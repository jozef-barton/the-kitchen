// @vitest-environment node

import { describe, expect, it } from 'vitest';
import type { IncomingMessage } from 'node:http';
import { evaluateLocalOriginPolicy } from './origin-policy';
import { isPrivateNetworkHostname } from '../services/local-network';

function makeRequest(options: {
  host?: string;
  origin?: string;
  method?: string;
  bridgeHeader?: string;
  localPort?: number;
}): IncomingMessage {
  return {
    headers: {
      host: options.host,
      origin: options.origin,
      'x-hermes-bridge': options.bridgeHeader
    },
    method: options.method ?? 'GET',
    socket: { localPort: options.localPort ?? 8787 }
  } as unknown as IncomingMessage;
}

describe('evaluateLocalOriginPolicy — default (loopback only)', () => {
  it('allows requests with localhost Host', () => {
    const result = evaluateLocalOriginPolicy(makeRequest({ host: 'localhost:8787' }));
    expect(result.allowed).toBe(true);
  });

  it('allows requests with 127.0.0.1 Host', () => {
    const result = evaluateLocalOriginPolicy(makeRequest({ host: '127.0.0.1:8787' }));
    expect(result.allowed).toBe(true);
  });

  it('rejects requests with a public IP Host', () => {
    const result = evaluateLocalOriginPolicy(makeRequest({ host: '8.8.8.8:8787' }));
    expect(result.allowed).toBe(false);
  });

  it('rejects requests with a LAN IP Host when no predicate is provided', () => {
    const result = evaluateLocalOriginPolicy(makeRequest({ host: '192.168.1.42:8787' }));
    expect(result.allowed).toBe(false);
  });
});

describe('evaluateLocalOriginPolicy — additionalAllowedHostnames (Tailscale path)', () => {
  it('allows requests with listed hostname in Host', () => {
    const result = evaluateLocalOriginPolicy(
      makeRequest({ host: 'my-machine.ts.net:8787' }),
      { additionalAllowedHostnames: ['my-machine.ts.net'] }
    );
    expect(result.allowed).toBe(true);
  });

  it('rejects requests with unlisted hostname', () => {
    const result = evaluateLocalOriginPolicy(
      makeRequest({ host: 'evil.ts.net:8787' }),
      { additionalAllowedHostnames: ['my-machine.ts.net'] }
    );
    expect(result.allowed).toBe(false);
  });
});

describe('evaluateLocalOriginPolicy — additionalAllowedHostnamePredicate (--public mode)', () => {
  it('allows RFC1918 Host header when predicate accepts it', () => {
    const result = evaluateLocalOriginPolicy(
      makeRequest({ host: '192.168.1.42:8787' }),
      { additionalAllowedHostnamePredicate: isPrivateNetworkHostname }
    );
    expect(result.allowed).toBe(true);
  });

  it('allows 10.x.x.x Host header', () => {
    const result = evaluateLocalOriginPolicy(
      makeRequest({ host: '10.0.0.5:8787' }),
      { additionalAllowedHostnamePredicate: isPrivateNetworkHostname }
    );
    expect(result.allowed).toBe(true);
  });

  it('allows 172.16.x.x Host header', () => {
    const result = evaluateLocalOriginPolicy(
      makeRequest({ host: '172.16.0.1:8787' }),
      { additionalAllowedHostnamePredicate: isPrivateNetworkHostname }
    );
    expect(result.allowed).toBe(true);
  });

  it('allows 169.254.x.x (link-local) Host header', () => {
    const result = evaluateLocalOriginPolicy(
      makeRequest({ host: '169.254.1.5:8787' }),
      { additionalAllowedHostnamePredicate: isPrivateNetworkHostname }
    );
    expect(result.allowed).toBe(true);
  });

  it('rejects public IP even when predicate is set', () => {
    const result = evaluateLocalOriginPolicy(
      makeRequest({ host: '8.8.8.8:8787' }),
      { additionalAllowedHostnamePredicate: isPrivateNetworkHostname }
    );
    expect(result.allowed).toBe(false);
  });

  it('allows RFC1918 Origin header when predicate accepts it', () => {
    const result = evaluateLocalOriginPolicy(
      makeRequest({ host: '192.168.1.42:8787', origin: 'http://192.168.1.42:8787' }),
      { additionalAllowedHostnamePredicate: isPrivateNetworkHostname }
    );
    expect(result.allowed).toBe(true);
    expect(result.allowOrigin).toBe('http://192.168.1.42:8787');
  });

  it('rejects public-IP Origin even when Host is local', () => {
    const result = evaluateLocalOriginPolicy(
      makeRequest({ host: 'localhost:8787', origin: 'http://8.8.8.8:8787' }),
      { additionalAllowedHostnamePredicate: isPrivateNetworkHostname }
    );
    expect(result.allowed).toBe(false);
  });

  it('predicate and array are unioned — either allows', () => {
    const resultFromArray = evaluateLocalOriginPolicy(
      makeRequest({ host: 'ts-node.ts.net:8787' }),
      {
        additionalAllowedHostnames: ['ts-node.ts.net'],
        additionalAllowedHostnamePredicate: isPrivateNetworkHostname
      }
    );
    expect(resultFromArray.allowed).toBe(true);

    const resultFromPredicate = evaluateLocalOriginPolicy(
      makeRequest({ host: '192.168.1.1:8787' }),
      {
        additionalAllowedHostnames: ['ts-node.ts.net'],
        additionalAllowedHostnamePredicate: isPrivateNetworkHostname
      }
    );
    expect(resultFromPredicate.allowed).toBe(true);
  });
});
