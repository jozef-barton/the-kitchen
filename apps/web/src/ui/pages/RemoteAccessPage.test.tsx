// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RemoteAccessStatus } from '../../lib/api';
import { RemoteAccessPage } from './RemoteAccessPage';

const mockGetRemoteAccessStatus = vi.fn();
const mockRefreshRemoteAccess = vi.fn();

vi.mock('../../lib/api', () => ({
  getRemoteAccessStatus: (...args: unknown[]) => mockGetRemoteAccessStatus(...args),
  refreshRemoteAccess: (...args: unknown[]) => mockRefreshRemoteAccess(...args)
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  mockGetRemoteAccessStatus.mockReset();
  mockRefreshRemoteAccess.mockReset();
});

function noopStatus(): RemoteAccessStatus {
  return {
    tailscale: { installed: false, running: false, dnsName: null, ipv4: null },
    url: null,
    enabled: false,
    public: { enabled: false, hostnames: [], urls: [] },
    bindAddress: '127.0.0.1'
  };
}

function renderPage(props: { requestedTab?: 'tailscale' | 'local-network'; onTabChange?: (t: 'tailscale' | 'local-network') => void } = {}) {
  return render(
    <MemoryRouter>
      <ChakraProvider value={defaultSystem}>
        <RemoteAccessPage {...props} />
      </ChakraProvider>
    </MemoryRouter>
  );
}

describe('RemoteAccessPage', () => {
  describe('Tailscale tab — setup state (Tailscale not running)', () => {
    it('shows the check-again button when Tailscale is not running', async () => {
      const status = noopStatus();
      mockRefreshRemoteAccess.mockResolvedValue(status);
      mockGetRemoteAccessStatus.mockResolvedValue(status);

      renderPage({ requestedTab: 'tailscale' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /check again/i })).toBeInTheDocument();
      });
    });
  });

  describe('Tailscale tab — connected state', () => {
    it('shows QR code and URL when Tailscale is connected', async () => {
      const connectedStatus: RemoteAccessStatus = {
        ...noopStatus(),
        tailscale: { installed: true, running: true, dnsName: 'my-machine.ts.net', ipv4: '100.0.0.1' },
        url: 'http://my-machine.ts.net:8787'
      };
      mockRefreshRemoteAccess.mockResolvedValue(connectedStatus);
      mockGetRemoteAccessStatus.mockResolvedValue(connectedStatus);

      renderPage({ requestedTab: 'tailscale' });

      await waitFor(() => {
        expect(screen.getByText('http://my-machine.ts.net:8787')).toBeInTheDocument();
      });
    });
  });

  describe('Local Network tab — disabled state', () => {
    it('shows CLI hint when public mode is disabled', async () => {
      const status = noopStatus();
      mockRefreshRemoteAccess.mockResolvedValue(status);
      mockGetRemoteAccessStatus.mockResolvedValue(status);

      renderPage({ requestedTab: 'local-network' });

      await waitFor(() => {
        expect(screen.getByText(/pnpm kitchen --public/i)).toBeInTheDocument();
      });
    });
  });

  describe('Local Network tab — enabled with URLs', () => {
    it('shows LAN URLs with copy buttons', async () => {
      const publicStatus: RemoteAccessStatus = {
        ...noopStatus(),
        public: {
          enabled: true,
          hostnames: ['192.168.1.42'],
          urls: ['http://192.168.1.42:8787']
        },
        bindAddress: '0.0.0.0'
      };
      mockRefreshRemoteAccess.mockResolvedValue(publicStatus);
      mockGetRemoteAccessStatus.mockResolvedValue(publicStatus);

      renderPage({ requestedTab: 'local-network' });

      await waitFor(() => {
        expect(screen.getByText('http://192.168.1.42:8787')).toBeInTheDocument();
      });
      expect(screen.getAllByRole('button', { name: /copy/i }).length).toBeGreaterThan(0);
    });

    it('shows the no-auth security warning', async () => {
      const publicStatus: RemoteAccessStatus = {
        ...noopStatus(),
        public: {
          enabled: true,
          hostnames: ['192.168.1.42'],
          urls: ['http://192.168.1.42:8787']
        },
        bindAddress: '0.0.0.0'
      };
      mockRefreshRemoteAccess.mockResolvedValue(publicStatus);
      mockGetRemoteAccessStatus.mockResolvedValue(publicStatus);

      renderPage({ requestedTab: 'local-network' });

      await waitFor(() => {
        expect(screen.getByText(/no authentication/i)).toBeInTheDocument();
      });
    });
  });

  describe('Local Network tab — enabled with no LAN NICs', () => {
    it('shows empty-state copy when no LAN IPs detected', async () => {
      const publicNoNics: RemoteAccessStatus = {
        ...noopStatus(),
        public: { enabled: true, hostnames: [], urls: [] },
        bindAddress: '0.0.0.0'
      };
      mockRefreshRemoteAccess.mockResolvedValue(publicNoNics);
      mockGetRemoteAccessStatus.mockResolvedValue(publicNoNics);

      renderPage({ requestedTab: 'local-network' });

      await waitFor(() => {
        expect(screen.getByText(/no local network interfaces/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tab switching', () => {
    it('calls onTabChange when a tab is clicked', async () => {
      const onTabChange = vi.fn();
      const status = noopStatus();
      mockRefreshRemoteAccess.mockResolvedValue(status);
      mockGetRemoteAccessStatus.mockResolvedValue(status);

      renderPage({ requestedTab: 'tailscale', onTabChange });

      await waitFor(() => screen.getByText('Local Network'));

      await userEvent.click(screen.getByText('Local Network'));
      expect(onTabChange).toHaveBeenCalledWith('local-network');
    });
  });
});
