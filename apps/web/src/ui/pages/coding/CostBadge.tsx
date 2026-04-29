import { Text } from '@chakra-ui/react';
import type { JobEvent } from '../../../lib/coding-api';

type CostEvent = Extract<JobEvent, { type: 'job.cost_update' }>;

interface Props { latestCost: CostEvent | null; startedAt?: number; }

export function CostBadge({ latestCost, startedAt }: Props) {
  if (!latestCost) return null;
  const cost = latestCost as unknown as {
    cumulative: { tokensIn: number; tokensOut: number; estimatedCostUsd: number };
    cacheReadTokens?: number;
  };
  const cumulative = cost.cumulative;
  const cacheRead = (latestCost as unknown as { cacheReadTokens?: number }).cacheReadTokens ?? 0;
  const tokens = cumulative.tokensIn + cumulative.tokensOut;
  const usd = cumulative.estimatedCostUsd;
  const elapsed = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  const tooltip = cacheRead > 0
    ? `${cumulative.tokensIn.toLocaleString()} in (${cacheRead.toLocaleString()} cached) · ${cumulative.tokensOut.toLocaleString()} out · $${usd.toFixed(4)}`
    : undefined;
  return (
    <Text fontSize="11px" color="var(--text-muted)" title={tooltip}>
      {timeStr} · {tokens.toLocaleString()} tokens · ~${usd.toFixed(4)}
    </Text>
  );
}
