#!/usr/bin/env node
import { spawn } from 'node:child_process';
import net from 'node:net';
import { platform } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';

const PREFERRED_PORT = Number.parseInt(process.env.BRIDGE_PORT ?? '8787', 10);

function tryPort(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.unref();
    srv.once('error', () => resolve(false));
    srv.listen(port, '127.0.0.1', () => srv.close(() => resolve(true)));
  });
}

function pickEphemeralPort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function findFreePort() {
  if (await tryPort(PREFERRED_PORT)) return PREFERRED_PORT;
  return pickEphemeralPort();
}

function openBrowser(url) {
  const p = platform();
  const cmd = p === 'darwin' ? 'open' : p === 'win32' ? 'start' : 'xdg-open';
  spawn(cmd, [url], {
    stdio: 'ignore',
    detached: true,
    shell: p === 'win32',
  }).unref();
}

function runStep(label, cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit' });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} failed with exit code ${code}`));
    });
    child.on('error', reject);
  });
}

async function main() {
  const port = await findFreePort();
  if (port !== PREFERRED_PORT) {
    console.log(`[kitchen] port ${PREFERRED_PORT} in use, falling back to ${port}`);
  }

  console.log('[kitchen] building...');
  await runStep('build', 'pnpm', ['build']);

  console.log(`[kitchen] starting bridge on http://127.0.0.1:${port}`);
  const bridge = spawn(
    'pnpm',
    [
      '--filter',
      '@hermes-recipes/bridge',
      'start',
      '--',
      '--static-dir',
      '../web/dist',
      '--port',
      String(port),
    ],
    {
      stdio: ['inherit', 'pipe', 'inherit'],
      env: { ...process.env, BRIDGE_PORT: String(port) },
    },
  );

  let opened = false;
  const launchBrowser = () => {
    if (opened) return;
    opened = true;
    const url = `http://127.0.0.1:${port}`;
    console.log(`[kitchen] opening ${url}`);
    openBrowser(url);
  };

  bridge.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);
    if (!opened && /listening on http/i.test(chunk.toString())) launchBrowser();
  });

  delay(5000).then(launchBrowser);

  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => bridge.kill(sig));
  }
  bridge.on('exit', (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error(`[kitchen] ${err.message}`);
  process.exit(1);
});
