import { Text } from '@chakra-ui/react';
import type { JobEvent } from '../../../lib/coding-api';

type CostEvent = Extract<JobEvent, { type: 'job.cost_update' }>;

interface Props { latestCost: CostEvent | null; startedAt?: number; }

export function CostBadge({ latestCost, startedAt }: Props) {
  if (!latestCost) return null;
  const cost = latestCost as unknown as {
    cumulative: { tokensIn: number; tokensOut: number; estimatedCostUsd: number };
  };
  const tokens = cost.cumulative.tokensIn + cost.cumulative.tokensOut;
  const usd = cost.cumulative.estimatedCostUsd;
  const elapsed = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  return (
    <Text fontSize="11px" color="var(--text-muted)">
      {timeStr} · {tokens.toLocaleString()} tokens · ~${usd.toFixed(4)}
    </Text>
  );
}
