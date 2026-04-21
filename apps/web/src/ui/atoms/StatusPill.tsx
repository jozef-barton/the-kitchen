const STATUS_SLOT: Record<string, string> = {
  connected: 'connected',
  degraded: 'degraded',
  disconnected: 'disconnected',
  error: 'error',
  enabled: 'enabled',
  disabled: 'disabled',
  unavailable: 'unavailable',
  healthy: 'healthy',
  paused: 'paused',
  attention: 'attention',
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  completed: 'completed',
  failed: 'failed',
  started: 'started',
  updated: 'updated',
  cancelled: 'cancelled',
  denied: 'denied',
  stopped: 'stopped',
  idle: 'idle',
  warning: 'warning',
  info: 'info',
};

export function StatusPill({ label }: { label: string }) {
  const slot = STATUS_SLOT[label] ?? 'unknown';
  return (
    <span className={`status-badge status-badge--${slot}`}>
      <span className="status-badge__dot" />
      {label}
    </span>
  );
}
