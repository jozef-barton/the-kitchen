// @vitest-environment node

import { describe, expect, it, vi, afterEach } from 'vitest';
import os from 'node:os';
import { getLocalNetworkIpv4s, isPrivateNetworkHostname } from './local-network';

vi.mock('node:os');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getLocalNetworkIpv4s', () => {
  it('returns non-internal IPv4 addresses', () => {
    vi.spyOn(os, 'networkInterfaces').mockReturnValue({
      lo0: [
        { family: 'IPv4', address: '127.0.0.1', internal: true, netmask: '255.0.0.0', mac: '00:00:00:00:00:00', cidr: '127.0.0.1/8' }
      ],
      en0: [
        { family: 'IPv4', address: '192.168.1.42', internal: false, netmask: '255.255.255.0', mac: 'aa:bb:cc:dd:ee:ff', cidr: '192.168.1.42/24' },
        { family: 'IPv6', address: 'fe80::1', internal: false, netmask: 'ffff::', mac: 'aa:bb:cc:dd:ee:ff', cidr: 'fe80::1/64', scopeid: 5 }
      ]
    });

    expect(getLocalNetworkIpv4s()).toEqual(['192.168.1.42']);
  });

  it('returns multiple IPs from multiple interfaces', () => {
    vi.spyOn(os, 'networkInterfaces').mockReturnValue({
      en0: [
        { family: 'IPv4', address: '192.168.1.10', internal: false, netmask: '255.255.255.0', mac: 'aa:bb:cc:dd:ee:ff', cidr: '192.168.1.10/24' }
      ],
      en1: [
        { family: 'IPv4', address: '10.0.0.5', internal: false, netmask: '255.0.0.0', mac: 'aa:bb:cc:dd:ee:fe', cidr: '10.0.0.5/8' }
      ]
    });

    expect(getLocalNetworkIpv4s()).toEqual(['192.168.1.10', '10.0.0.5']);
  });

  it('returns empty array when only loopback exists', () => {
    vi.spyOn(os, 'networkInterfaces').mockReturnValue({
      lo0: [
        { family: 'IPv4', address: '127.0.0.1', internal: true, netmask: '255.0.0.0', mac: '00:00:00:00:00:00', cidr: '127.0.0.1/8' }
      ]
    });

    expect(getLocalNetworkIpv4s()).toEqual([]);
  });

  it('returns empty array when networkInterfaces returns empty', () => {
    vi.spyOn(os, 'networkInterfaces').mockReturnValue({});
    expect(getLocalNetworkIpv4s()).toEqual([]);
  });
});

describe('isPrivateNetworkHostname', () => {
  it.each([
    ['10.0.0.1', true],
    ['10.255.255.255', true],
    ['172.16.0.1', true],
    ['172.31.255.255', true],
    ['192.168.1.42', true],
    ['192.168.0.1', true],
    ['169.254.0.1', true],
    ['169.254.255.254', true],
  ])('accepts private IPv4 %s', (hostname, expected) => {
    expect(isPrivateNetworkHostname(hostname)).toBe(expected);
  });

  it.each([
    ['8.8.8.8', false],
    ['1.1.1.1', false],
    ['172.15.255.255', false],
    ['172.32.0.0', false],
    ['11.0.0.1', false],
    ['192.169.1.1', false],
    ['localhost', false],
    ['127.0.0.1', false],
    ['0.0.0.0', false],
  ])('rejects non-private IPv4 %s', (hostname, expected) => {
    expect(isPrivateNetworkHostname(hostname)).toBe(expected);
  });

  it.each([
    ['fc00::1', true],
    ['fd12:3456:789a::1', true],
    ['fe80::1', true],
    ['fe89::1', true],
    ['feab::1', true],
  ])('accepts private IPv6 %s', (hostname, expected) => {
    expect(isPrivateNetworkHostname(hostname)).toBe(expected);
  });

  it.each([
    ['2001:db8::1', false],
    ['::1', false],
    ['2600::', false],
  ])('rejects non-private IPv6 %s', (hostname, expected) => {
    expect(isPrivateNetworkHostname(hostname)).toBe(expected);
  });

  it('handles empty string', () => {
    expect(isPrivateNetworkHostname('')).toBe(false);
  });

  it('handles non-IP strings', () => {
    expect(isPrivateNetworkHostname('example.com')).toBe(false);
  });
});
