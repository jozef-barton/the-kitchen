import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBridgeServer } from './http/create-bridge-server';
import { resolveBridgeDatabasePath, resolveLegacySnapshotCandidates } from './paths';
import {
  createRemoteAccessController,
  desiredBindAddress,
  detectTailscale,
  type RemoteAccessController
} from './services/tailscale';

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));

function getArgValue(flag: string, args: string[]) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function resolveOptionalPath(rawPath: string | undefined) {
  if (!rawPath) {
    return undefined;
  }

  if (path.isAbsolute(rawPath)) {
    return rawPath;
  }

  const candidates = [
    path.resolve(process.cwd(), rawPath),
    path.resolve(moduleDirectory, rawPath),
    path.resolve(moduleDirectory, '..', rawPath)
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
}

export { createBridgeServer } from './http/create-bridge-server';

async function main() {
  const args = process.argv.slice(2);
  const port = Number.parseInt(getArgValue('--port', args) ?? process.env.BRIDGE_PORT ?? '8787', 10);
  const staticDirectoryArg = getArgValue('--static-dir', args);
  const fixtureMode = args.includes('--fixture');
  const staticDirectory = resolveOptionalPath(staticDirectoryArg ?? process.env.BRIDGE_STATIC_DIR);
  const databasePath = resolveBridgeDatabasePath(getArgValue('--db-path', args) ?? process.env.BRIDGE_DB_PATH);
  const cliPath =
    getArgValue('--cli-path', args) ??
    process.env.HERMES_CLI_PATH ??
    (fixtureMode ? path.resolve(moduleDirectory, '../test/fixtures/hermes-cli-fixture.mjs') : undefined);

  if (fixtureMode && !process.env.HERMES_FIXTURE_HOME) {
    process.env.HERMES_FIXTURE_HOME = path.resolve(process.cwd(), '../../tmp/hermes-fixture');
  }

  // Detect Tailscale up-front so the initial bind address matches the live state. The controller
  // (created after the listener starts) can re-detect later via /api/remote-access/refresh.
  const initialTailscale = await detectTailscale();
  const bindAddress = desiredBindAddress(initialTailscale);
  process.stdout.write(
    `[bridge] Tailscale: installed=${initialTailscale.installed} running=${initialTailscale.running}${initialTailscale.dnsName ? ` dns=${initialTailscale.dnsName}` : ''}\n`
  );
  process.stdout.write(`[bridge] Binding to ${bindAddress}\n`);

  // Holder so the create-bridge-server callbacks can resolve to the controller created after listen().
  const remoteAccessRef: { controller: RemoteAccessController | null } = { controller: null };

  const { server } = createBridgeServer({
    databasePath,
    cliPath,
    staticDirectory,
    recipeRoot: process.cwd(),
    legacySnapshotPaths: fixtureMode ? [] : resolveLegacySnapshotCandidates(),
    getTailscaleDnsName: () => remoteAccessRef.controller?.getDnsName() ?? null,
    refreshRemoteAccess: async () => {
      if (!remoteAccessRef.controller) {
        const status = await detectTailscale();
        return { tailscale: status, bindAddress, rebound: false };
      }
      return remoteAccessRef.controller.refresh();
    }
  });

  server.listen(port, bindAddress, () => {
    process.stdout.write(`Hermes bridge listening on http://${bindAddress}:${port}\n`);
    if (initialTailscale.running && initialTailscale.dnsName) {
      process.stdout.write(`[bridge] Remote access available at http://${initialTailscale.dnsName}:${port}\n`);
    }
    remoteAccessRef.controller = createRemoteAccessController({
      server,
      port,
      initial: initialTailscale
    });
  });
}

const isEntrypoint = process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;

if (isEntrypoint) {
  void main();
}
