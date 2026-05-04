import os from 'node:os';

/**
 * Returns all non-loopback IPv4 addresses on the machine, derived from
 * os.networkInterfaces(). Used to compute the LAN URLs to display in the
 * kitchen banner and the Remote Access UI.
 */
export function getLocalNetworkIpv4s(): string[] {
  const ifaces = os.networkInterfaces();
  const results: string[] = [];
  for (const iface of Object.values(ifaces)) {
    if (!iface) continue;
    for (const entry of iface) {
      if (entry.family === 'IPv4' && !entry.internal) {
        results.push(entry.address);
      }
    }
  }
  return results;
}

/**
 * Returns true if the given hostname string is in a private network range that
 * --public mode should admit:
 *   - RFC 1918: 10/8, 172.16/12, 192.168/16
 *   - IPv4 link-local: 169.254/16
 *   - IPv6 ULA: fc00::/7  (fc… or fd…)
 *   - IPv6 link-local: fe80::/10
 *
 * Does NOT import `os` — intentionally pure/testable without system state.
 */
export function isPrivateNetworkHostname(hostname: string): boolean {
  // IPv6 ULA: fc00::/7 covers fc** and fd**
  if (/^fd[0-9a-f]{2}:/i.test(hostname) || /^fc[0-9a-f]{2}:/i.test(hostname)) {
    return true;
  }

  // IPv6 link-local: fe80::/10
  if (/^fe[89ab][0-9a-f]:/i.test(hostname) || /^\[?fe[89ab][0-9a-f]:/i.test(hostname)) {
    return true;
  }

  // Strip IPv6 brackets if present
  const bare = hostname.replace(/^\[/, '').replace(/\]$/, '');

  // Parse as IPv4 octets
  const parts = bare.split('.');
  if (parts.length !== 4) return false;
  const octets = parts.map(Number);
  if (octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;

  const [a, b] = octets as [number, number, number, number];

  // 10.0.0.0/8
  if (a === 10) return true;
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;
  // 169.254.0.0/16  (IPv4 link-local / APIPA)
  if (a === 169 && b === 254) return true;

  return false;
}
