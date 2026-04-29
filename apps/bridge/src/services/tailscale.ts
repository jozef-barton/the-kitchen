import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { access } from 'node:fs/promises';
import type { Server } from 'node:http';

const execFileAsync = promisify(execFile);

export interface TailscaleStatus {
  installed: boolean;
  running: boolean;
  dnsName: string | null;
  ipv4: string | null;
  error?: string;
}

const CANDIDATE_PATHS = [
  '/Applications/Tailscale.app/Contents/MacOS/Tailscale',
  '/opt/homebrew/bin/tailscale',
  '/usr/local/bin/tailscale',
  'tailscale'
];

async function findTailscaleBinary(): Promise<string | null> {
  for (const candidate of CANDIDATE_PATHS) {
    if (candidate === 'tailscale') {
      try {
        await execFileAsync('which', ['tailscale'], { timeout: 2000 });
        return 'tailscale';
      } catch {
        continue;
      }
    }
    try {
      await access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }
  return null;
}

export async function detectTailscale(): Promise<TailscaleStatus> {
  const binary = await findTailscaleBinary();
  if (!binary) {
    return { installed: false, running: false, dnsName: null, ipv4: null };
  }

  try {
    const { stdout } = await execFileAsync(binary, ['status', '--json'], { timeout: 2000 });
    const data = JSON.parse(stdout) as {
      BackendState?: string;
      Self?: { DNSName?: string; TailscaleIPs?: string[] };
    };

    if (data.BackendState !== 'Running') {
      return { installed: true, running: false, dnsName: null, ipv4: null };
    }

    // Strip trailing dot from DNS name — Tailscale includes it in the FQDN but browsers don't expect it.
    const rawDns = data.Self?.DNSName ?? null;
    const dnsName = rawDns ? rawDns.replace(/\.$/, '') : null;
    const ipv4 = data.Self?.TailscaleIPs?.find((ip) => !ip.includes(':')) ?? null;

    return { installed: true, running: true, dnsName, ipv4 };
  } catch (err) {
    return {
      installed: true,
      running: false,
      dnsName: null,
      ipv4: null,
      error: err instanceof Error ? err.message : 'tailscale status failed'
    };
  }
}

export const LOCAL_BIND_ADDRESS = '127.0.0.1';
export const TAILNET_BIND_ADDRESS = '0.0.0.0';

export function desiredBindAddress(status: TailscaleStatus): string {
  return status.running ? TAILNET_BIND_ADDRESS : LOCAL_BIND_ADDRESS;
}

export interface RemoteAccessSnapshot {
  tailscale: TailscaleStatus;
  bindAddress: string;
  rebound: boolean;
}

export interface RemoteAccessController {
  getDnsName(): string | null;
  getBindAddress(): string;
  refresh(): Promise<RemoteAccessSnapshot>;
}

/**
 * Owns the http.Server's bind address and the Tailscale DNS name visible to the origin policy.
 * Both depend on Tailscale state, which can change after server startup (e.g. user starts Tailscale
 * after launching the bridge). Calling refresh() re-detects, rebinds the listener if the desired
 * address changed, and updates the dns allow-list so requests with Host: <dns>:port are accepted.
 */
export function createRemoteAccessController(args: {
  server: Server;
  port: number;
  initial: TailscaleStatus;
  detect?: () => Promise<TailscaleStatus>;
}): RemoteAccessController {
  const detect = args.detect ?? detectTailscale;
  let bindAddress = desiredBindAddress(args.initial);
  let dnsName = args.initial.running ? args.initial.dnsName : null;

  async function rebind(target: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      args.server.close((err) => (err ? reject(err) : resolve()));
      // closeAllConnections terminates lingering keep-alive sockets so close() can complete promptly
      // instead of waiting on idle clients that may never disconnect on their own.
      args.server.closeAllConnections?.();
    });
    await new Promise<void>((resolve, reject) => {
      const onError = (err: Error) => {
        args.server.off('error', onError);
        reject(err);
      };
      args.server.once('error', onError);
      args.server.listen(args.port, target, () => {
        args.server.off('error', onError);
        resolve();
      });
    });
  }

  return {
    getDnsName() {
      return dnsName;
    },
    getBindAddress() {
      return bindAddress;
    },
    async refresh() {
      const status = await detect();
      const desired = desiredBindAddress(status);
      let rebound = false;
      if (desired !== bindAddress) {
        await rebind(desired);
        bindAddress = desired;
        rebound = true;
      }
      dnsName = status.running ? status.dnsName : null;
      return { tailscale: status, bindAddress, rebound };
    }
  };
}
