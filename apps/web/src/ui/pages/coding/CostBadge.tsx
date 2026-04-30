import { Box, HStack } from '@chakra-ui/react';
import type { JobEvent } from '../../../lib/coding-api';

type CostEvent = Extract<JobEvent, { type: 'job.cost_update' }>;

interface Props { latestCost: CostEvent | null; startedAt?: number; }

function MetaTag({ label, title }: { label: string; title?: string }) {
  return (
    <Box
      as="span"
      rounded="full"
      border="1px solid"
      borderColor="var(--border-subtle)"
      px="2"
      py="0.5"
      fontSize="11px"
      color="var(--text-muted)"
      title={title}
      lineHeight="1.4"
    >
      {label}
    </Box>
  );
}

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
  const tokenTooltip = cacheRead > 0
    ? `${cumulative.tokensIn.toLocaleString()} in (${cacheRead.toLocaleString()} cached) · ${cumulative.tokensOut.toLocaleString()} out`
    : undefined;
  return (
    <HStack gap="1.5" flexWrap="wrap">
      <MetaTag label={timeStr} />
      <MetaTag label={`${tokens.toLocaleString()} tokens`} title={tokenTooltip} />
      <MetaTag label={`~$${usd.toFixed(4)}`} />
    </HStack>
  );
}
