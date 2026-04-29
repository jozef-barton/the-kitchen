// @vitest-environment node

import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  LOCAL_BIND_ADDRESS,
  TAILNET_BIND_ADDRESS,
  createRemoteAccessController,
  desiredBindAddress,
  type TailscaleStatus
} from './tailscale';

function runningStatus(dnsName: string): TailscaleStatus {
  return { installed: true, running: true, dnsName, ipv4: '100.0.0.1' };
}

function notRunningStatus(): TailscaleStatus {
  return { installed: true, running: false, dnsName: null, ipv4: null };
}

async function listen(server: http.Server, address: string): Promise<number> {
  await new Promise<void>((resolve) => {
    server.listen(0, address, () => resolve());
  });
  return (server.address() as AddressInfo).port;
}

async function close(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
    server.closeAllConnections?.();
  });
}

describe('desiredBindAddress', () => {
  it('returns 0.0.0.0 when Tailscale is running', () => {
    expect(desiredBindAddress(runningStatus('foo.ts.net'))).toBe(TAILNET_BIND_ADDRESS);
  });

  it('returns 127.0.0.1 when Tailscale is not running', () => {
    expect(desiredBindAddress(notRunningStatus())).toBe(LOCAL_BIND_ADDRESS);
  });
});

describe('createRemoteAccessController', () => {
  let server: http.Server;
  let port: number;

  beforeEach(async () => {
    server = http.createServer((_req, res) => {
      res.writeHead(200);
      res.end('ok');
    });
    port = await listen(server, LOCAL_BIND_ADDRESS);
  });

  afterEach(async () => {
    if (server.listening) {
      await close(server);
    }
  });

  it('reports the initial bind address and dns name from the seeded status', () => {
    const controller = createRemoteAccessController({
      server,
      port,
      initial: notRunningStatus(),
      detect: async () => notRunningStatus()
    });

    expect(controller.getBindAddress()).toBe(LOCAL_BIND_ADDRESS);
    expect(controller.getDnsName()).toBeNull();
  });

  it('rebinds 127.0.0.1 → 0.0.0.0 and exposes dns name when Tailscale comes online', async () => {
    let status: TailscaleStatus = notRunningStatus();
    const controller = createRemoteAccessController({
      server,
      port,
      initial: status,
      detect: async () => status
    });

    expect(controller.getBindAddress()).toBe(LOCAL_BIND_ADDRESS);
    expect(controller.getDnsName()).toBeNull();

    status = runningStatus('host.ts.net');
    const result = await controller.refresh();

    expect(result.rebound).toBe(true);
    expect(result.bindAddress).toBe(TAILNET_BIND_ADDRESS);
    expect(result.tailscale.running).toBe(true);
    expect(controller.getBindAddress()).toBe(TAILNET_BIND_ADDRESS);
    expect(controller.getDnsName()).toBe('host.ts.net');
    expect((server.address() as AddressInfo).address).toBe(TAILNET_BIND_ADDRESS);
    expect((server.address() as AddressInfo).port).toBe(port);
  });

  it('rebinds 0.0.0.0 → 127.0.0.1 and clears dns name when Tailscale goes down', async () => {
    // Seed with running so the controller starts in tailnet bind mode.
    await close(server);
    server = http.createServer((_req, res) => {
      res.writeHead(200);
      res.end('ok');
    });
    port = await listen(server, TAILNET_BIND_ADDRESS);

    let status: TailscaleStatus = runningStatus('host.ts.net');
    const controller = createRemoteAccessController({
      server,
      port,
      initial: status,
      detect: async () => status
    });

    expect(controller.getBindAddress()).toBe(TAILNET_BIND_ADDRESS);
    expect(controller.getDnsName()).toBe('host.ts.net');

    status = notRunningStatus();
    const result = await controller.refresh();

    expect(result.rebound).toBe(true);
    expect(result.bindAddress).toBe(LOCAL_BIND_ADDRESS);
    expect(controller.getBindAddress()).toBe(LOCAL_BIND_ADDRESS);
    expect(controller.getDnsName()).toBeNull();
    expect((server.address() as AddressInfo).address).toBe(LOCAL_BIND_ADDRESS);
  });

  it('does not rebind when state is unchanged but still updates dns name', async () => {
    let status: TailscaleStatus = runningStatus('first.ts.net');
    await close(server);
    server = http.createServer((_req, res) => {
      res.writeHead(200);
      res.end('ok');
    });
    port = await listen(server, TAILNET_BIND_ADDRESS);

    const controller = createRemoteAccessController({
      server,
      port,
      initial: status,
      detect: async () => status
    });

    status = runningStatus('second.ts.net');
    const result = await controller.refresh();

    expect(result.rebound).toBe(false);
    expect(result.bindAddress).toBe(TAILNET_BIND_ADDRESS);
    expect(controller.getDnsName()).toBe('second.ts.net');
  });
});
