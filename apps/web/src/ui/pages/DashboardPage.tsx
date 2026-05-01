import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Box, Flex, HStack, Heading, SimpleGrid, Spinner, Text, VStack } from '@chakra-ui/react';
import type { AppPage, DashboardResponse, JobsResponse } from '@hermes-recipes/protocol';
import { getDashboard } from '../../lib/api';
import { listJobs, type CodingJob } from '../../lib/coding-api';

type WidgetCardProps = {
  title: string;
  subtitle?: string;
  span?: 1 | 2 | 4;
  testId?: string;
  children: ReactNode;
};

function WidgetCard({ title, subtitle, span = 1, testId, children }: WidgetCardProps) {
  return (
    <Box
      gridColumn={{
        base: 'span 1',
        md: `span ${Math.min(span, 2)}`,
        lg: `span ${span}`
      }}
      rounded="var(--radius-card)"
      border="1px solid var(--border-subtle)"
      bg="var(--surface-1)"
      p="4"
      display="flex"
      flexDirection="column"
      gap="3"
      minH="200px"
      data-testid={testId}
    >
      <VStack align="start" gap="0.5" flexShrink={0}>
        <Heading
          as="h3"
          fontSize="13px"
          fontWeight="600"
          color="var(--text-primary)"
          lineHeight="1.3"
        >
          {title}
        </Heading>
        {subtitle ? (
          <Text fontSize="11px" color="var(--text-muted)" lineHeight="1.3">
            {subtitle}
          </Text>
        ) : null}
      </VStack>
      <Box flex="1" minH={0}>
        {children}
      </Box>
    </Box>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Flex align="center" justify="center" h="100%" minH="80px">
      <Text fontSize="12px" color="var(--text-muted)" textAlign="center">
        {message}
      </Text>
    </Flex>
  );
}

function LoadingState() {
  return (
    <Flex align="center" justify="center" h="100%" minH="80px">
      <Spinner size="sm" color="var(--text-muted)" />
    </Flex>
  );
}

// ── Activity heatmap ─────────────────────────────────────────────
function intensityColor(count: number, max: number): string {
  if (count === 0 || max === 0) return 'var(--surface-2)';
  const ratio = Math.min(1, count / max);
  // Five-step ramp tied to the accent color via opacity.
  if (ratio < 0.2) return 'color-mix(in srgb, var(--accent) 18%, var(--surface-2))';
  if (ratio < 0.4) return 'color-mix(in srgb, var(--accent) 35%, var(--surface-2))';
  if (ratio < 0.6) return 'color-mix(in srgb, var(--accent) 55%, var(--surface-2))';
  if (ratio < 0.85) return 'color-mix(in srgb, var(--accent) 75%, var(--surface-2))';
  return 'var(--accent)';
}

function ActivityHeatmap({ days }: { days: DashboardResponse['activity'] }) {
  // Render as 13 weekly columns × 7 days. Each cell is a 10px square.
  const max = useMemo(() => days.reduce((m, d) => Math.max(m, d.messageCount), 0), [days]);
  if (days.length === 0) return <EmptyState message="No activity in the last 90 days." />;

  // Pad the start of the array so the first column begins on a Sunday.
  const firstDate = new Date(days[0].date + 'T00:00:00Z');
  const leadingBlanks = firstDate.getUTCDay();
  const cells: ({ date: string; messageCount: number } | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...days
  ];
  // Pad to a multiple of 7
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <VStack align="start" gap="2" h="100%">
      <HStack gap="2px" align="start" overflowX="auto" w="100%" pb="2">
        {weeks.map((week, i) => (
          <VStack key={i} gap="2px">
            {week.map((cell, j) => {
              if (!cell) {
                return <Box key={j} w="10px" h="10px" rounded="2px" bg="transparent" />;
              }
              return (
                <Box
                  key={j}
                  w="10px"
                  h="10px"
                  rounded="2px"
                  bg={intensityColor(cell.messageCount, max)}
                  border="1px solid"
                  borderColor="var(--border-subtle)"
                  title={`${cell.date} · ${cell.messageCount} message${cell.messageCount === 1 ? '' : 's'}`}
                />
              );
            })}
          </VStack>
        ))}
      </HStack>
      <HStack gap="2" align="center" mt="auto">
        <Text fontSize="10px" color="var(--text-muted)">Less</Text>
        {[0, 1, 2, 3, 4].map((step) => (
          <Box
            key={step}
            w="10px"
            h="10px"
            rounded="2px"
            bg={intensityColor(step, 4)}
            border="1px solid"
            borderColor="var(--border-subtle)"
          />
        ))}
        <Text fontSize="10px" color="var(--text-muted)">More</Text>
        <Box flex="1" />
        <Text fontSize="10px" color="var(--text-muted)">
          {max} max/day · {days.reduce((s, d) => s + d.messageCount, 0).toLocaleString()} total
        </Text>
      </HStack>
    </VStack>
  );
}

// ── Top sessions ─────────────────────────────────────────────────
function TopSessions({
  sessions,
  onOpenSession
}: {
  sessions: DashboardResponse['topSessions'];
  onOpenSession: (sessionId: string) => void;
}) {
  if (sessions.length === 0) {
    return <EmptyState message="No active sessions in the last 7 days." />;
  }
  return (
    <VStack align="stretch" gap="1" h="100%" overflowY="auto">
      {sessions.map((s) => (
        <Box
          key={s.sessionId}
          as="button"
          onClick={() => onOpenSession(s.sessionId)}
          rounded="var(--radius-control)"
          px="2.5"
          py="2"
          bg="transparent"
          border="1px solid var(--border-subtle)"
          textAlign="left"
          transition="background var(--transition-fast), border-color var(--transition-fast)"
          _hover={{ bg: 'var(--surface-2)', borderColor: 'var(--border-default)' }}
          cursor="pointer"
        >
          <HStack justify="space-between" align="start" gap="2">
            <Text
              fontSize="12px"
              fontWeight="500"
              color="var(--text-primary)"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              flex="1"
              minW={0}
            >
              {s.title}
            </Text>
            <Text fontSize="11px" color="var(--text-secondary)" flexShrink={0} fontVariantNumeric="tabular-nums">
              {s.messageCount}
            </Text>
          </HStack>
        </Box>
      ))}
    </VStack>
  );
}

// ── Streak + cadence ─────────────────────────────────────────────
function StreakCadence({ streak }: { streak: DashboardResponse['streak'] }) {
  return (
    <Flex direction="column" gap="3" h="100%">
      <HStack gap="4" align="baseline">
        <VStack gap="0" align="start">
          <Text fontSize="22px" fontWeight="700" color="var(--text-primary)" lineHeight="1" fontVariantNumeric="tabular-nums">
            {streak.currentStreakDays}
          </Text>
          <Text fontSize="10px" color="var(--text-muted)">current streak</Text>
        </VStack>
        <VStack gap="0" align="start">
          <Text fontSize="14px" fontWeight="600" color="var(--text-secondary)" lineHeight="1" fontVariantNumeric="tabular-nums">
            {streak.longestStreakDays}
          </Text>
          <Text fontSize="10px" color="var(--text-muted)">longest</Text>
        </VStack>
      </HStack>
      <Box h="1px" bg="var(--border-subtle)" />
      <HStack justify="space-between">
        <VStack gap="0" align="start">
          <Text fontSize="14px" fontWeight="600" color="var(--text-primary)" lineHeight="1" fontVariantNumeric="tabular-nums">
            {streak.activeDaysLast30}
            <Text as="span" fontSize="10px" color="var(--text-muted)" ml="1">/ 30</Text>
          </Text>
          <Text fontSize="10px" color="var(--text-muted)">active days</Text>
        </VStack>
        <VStack gap="0" align="end">
          <Text fontSize="14px" fontWeight="600" color="var(--text-primary)" lineHeight="1" fontVariantNumeric="tabular-nums">
            {streak.avgMessagesPerActiveDay.toFixed(1)}
          </Text>
          <Text fontSize="10px" color="var(--text-muted)">msgs / active day</Text>
        </VStack>
      </HStack>
    </Flex>
  );
}

// ── Live job ticker (cron) ───────────────────────────────────────
function LiveJobTicker({
  response,
  loading,
  onOpenJobs
}: {
  response: JobsResponse | null;
  loading: boolean;
  onOpenJobs: () => void;
}) {
  if (loading && !response) return <LoadingState />;
  if (!response || response.items.length === 0) {
    return <EmptyState message="No cron jobs configured." />;
  }
  // Sort by next run ascending, take top 6.
  const items = [...response.items].sort((a, b) => a.nextRun.localeCompare(b.nextRun)).slice(0, 6);
  return (
    <VStack align="stretch" gap="1" h="100%" overflowY="auto">
      {items.map((job) => (
        <HStack
          key={job.id}
          justify="space-between"
          gap="2"
          px="2"
          py="1.5"
          rounded="var(--radius-control)"
          _hover={{ bg: 'var(--surface-2)' }}
        >
          <HStack gap="2" flex="1" minW={0}>
            <span className={`status-dot status-dot--${job.status === 'healthy' ? 'connected' : job.status === 'paused' ? 'reconnecting' : 'disconnected'}`} />
            <Text
              fontSize="12px"
              color="var(--text-primary)"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              {job.label}
            </Text>
          </HStack>
          <Text fontSize="10px" color="var(--text-muted)" flexShrink={0} fontVariantNumeric="tabular-nums">
            {job.schedule}
          </Text>
        </HStack>
      ))}
      <Box
        as="button"
        onClick={onOpenJobs}
        mt="auto"
        py="1"
        fontSize="10px"
        color="var(--text-muted)"
        _hover={{ color: 'var(--text-primary)' }}
        textAlign="center"
        cursor="pointer"
        borderTop="1px solid var(--border-subtle)"
        pt="2"
      >
        View all jobs →
      </Box>
    </VStack>
  );
}

// ── Coding jobs in flight ────────────────────────────────────────
const CODING_ACTIVE_STATUSES = new Set(['queued', 'running', 'awaiting_user', 'awaiting_approval']);

function CodingJobsInFlight({
  jobs,
  loading,
  onOpenCoding
}: {
  jobs: CodingJob[] | null;
  loading: boolean;
  onOpenCoding: () => void;
}) {
  if (loading && !jobs) return <LoadingState />;
  if (!jobs) return <EmptyState message="Could not load coding jobs." />;

  const active = jobs.filter((j) => CODING_ACTIVE_STATUSES.has(j.status) && !j.archivedAt);
  if (active.length === 0) {
    return <EmptyState message="No coding jobs in flight." />;
  }

  return (
    <VStack align="stretch" gap="1" h="100%" overflowY="auto">
      {active.slice(0, 5).map((job) => (
        <Box
          key={job.id}
          as="button"
          onClick={onOpenCoding}
          rounded="var(--radius-control)"
          px="2.5"
          py="2"
          textAlign="left"
          border="1px solid var(--border-subtle)"
          bg="transparent"
          _hover={{ bg: 'var(--surface-2)', borderColor: 'var(--border-default)' }}
          cursor="pointer"
        >
          <HStack justify="space-between" gap="2" align="start">
            <Text
              fontSize="12px"
              fontWeight="500"
              color="var(--text-primary)"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              flex="1"
              minW={0}
            >
              {job.title || job.prompt}
            </Text>
            <Text fontSize="10px" color="var(--text-muted)" flexShrink={0} textTransform="uppercase" letterSpacing="0.04em">
              {job.status.replace(/_/g, ' ')}
            </Text>
          </HStack>
          <HStack gap="2" mt="0.5">
            <Text fontSize="10px" color="var(--text-muted)">{job.agent}</Text>
            {typeof job.turnCount === 'number' ? (
              <Text fontSize="10px" color="var(--text-muted)">· {job.turnCount} turn{job.turnCount === 1 ? '' : 's'}</Text>
            ) : null}
          </HStack>
        </Box>
      ))}
    </VStack>
  );
}

// ── Token + cost rollup ──────────────────────────────────────────
function TokenCostRollup({ jobs, loading }: { jobs: CodingJob[] | null; loading: boolean }) {
  if (loading && !jobs) return <LoadingState />;
  if (!jobs) return <EmptyState message="Could not load coding jobs." />;

  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - SEVEN_DAYS_MS;
  const recent = jobs.filter((j) => (j.completedAt ?? j.startedAt ?? j.createdAt) >= cutoff);

  const buckets = new Map<string, { tokens: number; cost: number }>();
  let totalTokens = 0;
  let totalCost = 0;
  for (const job of recent) {
    const t = job.totalTokens ?? 0;
    const c = job.estimatedCostUsd ?? 0;
    totalTokens += t;
    totalCost += c;
    const key = job.agent;
    const bucket = buckets.get(key) ?? { tokens: 0, cost: 0 };
    bucket.tokens += t;
    bucket.cost += c;
    buckets.set(key, bucket);
  }

  if (totalTokens === 0 && totalCost === 0) {
    return (
      <VStack align="start" gap="2" h="100%" justify="center">
        <Text fontSize="11px" color="var(--text-muted)">
          No token data in the last 7 days. Coding jobs report usage; chat sessions
          do not yet capture per-turn token counts from Hermes.
        </Text>
      </VStack>
    );
  }

  return (
    <Flex direction="column" gap="3" h="100%">
      <HStack gap="4" align="baseline">
        <VStack gap="0" align="start">
          <Text fontSize="20px" fontWeight="700" color="var(--text-primary)" lineHeight="1" fontVariantNumeric="tabular-nums">
            ${totalCost.toFixed(2)}
          </Text>
          <Text fontSize="10px" color="var(--text-muted)">7-day spend</Text>
        </VStack>
        <VStack gap="0" align="start">
          <Text fontSize="14px" fontWeight="600" color="var(--text-secondary)" lineHeight="1" fontVariantNumeric="tabular-nums">
            {totalTokens.toLocaleString()}
          </Text>
          <Text fontSize="10px" color="var(--text-muted)">tokens</Text>
        </VStack>
      </HStack>
      <Box h="1px" bg="var(--border-subtle)" />
      <VStack align="stretch" gap="1">
        {[...buckets.entries()].map(([agent, b]) => (
          <HStack key={agent} justify="space-between" fontSize="11px">
            <Text color="var(--text-secondary)">{agent}</Text>
            <Text color="var(--text-muted)" fontVariantNumeric="tabular-nums">
              {b.tokens.toLocaleString()} tok · ${b.cost.toFixed(2)}
            </Text>
          </HStack>
        ))}
      </VStack>
      <Text fontSize="10px" color="var(--text-muted)" mt="auto">
        Source: coding job telemetry (chat sessions not yet wired up).
      </Text>
    </Flex>
  );
}

// ── Page shell ───────────────────────────────────────────────────
export function DashboardPage({
  activeProfileId,
  jobsResponse,
  jobsLoading,
  onOpenSession,
  onOpenPage
}: {
  activeProfileId: string | null;
  jobsResponse: JobsResponse | null;
  jobsLoading: boolean;
  onOpenSession: (sessionId: string) => void;
  onOpenPage: (page: AppPage) => void;
}) {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [codingJobs, setCodingJobs] = useState<CodingJob[] | null>(null);
  const [codingLoading, setCodingLoading] = useState(false);

  useEffect(() => {
    if (!activeProfileId) {
      setDashboard(null);
      return;
    }
    let cancelled = false;
    setDashboardLoading(true);
    setDashboardError(null);
    getDashboard(activeProfileId)
      .then((res) => {
        if (!cancelled) setDashboard(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) setDashboardError(err instanceof Error ? err.message : 'Failed to load dashboard.');
      })
      .finally(() => {
        if (!cancelled) setDashboardLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeProfileId]);

  useEffect(() => {
    let cancelled = false;
    setCodingLoading(true);
    listJobs({ includeArchived: false })
      .then((jobs) => {
        if (!cancelled) setCodingJobs(jobs);
      })
      .catch(() => {
        if (!cancelled) setCodingJobs([]);
      })
      .finally(() => {
        if (!cancelled) setCodingLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page-content">
      <Flex direction="column" gap="4" h="100%" minH={0}>
        <VStack align="start" gap="1" flexShrink={0}>
          <Heading
            as="h2"
            fontSize="18px"
            fontWeight="600"
            color="var(--text-primary)"
            letterSpacing="-0.01em"
          >
            Dashboard
          </Heading>
          <Text fontSize="12px" color="var(--text-muted)">
            {dashboard
              ? `${dashboard.totalSessions.toLocaleString()} sessions · ${dashboard.totalMessagesLast30.toLocaleString()} messages in the last 30 days`
              : 'At-a-glance view of activity, jobs, and recent work.'}
          </Text>
        </VStack>

        {dashboardError ? (
          <Box rounded="var(--radius-card)" border="1px solid var(--border-subtle)" bg="var(--surface-1)" p="3">
            <Text fontSize="12px" color="var(--text-secondary)">
              Failed to load dashboard data: {dashboardError}
            </Text>
          </Box>
        ) : null}

        <Box flex="1" minH={0} overflowY="auto" pr="1">
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="3">
            <WidgetCard
              title="Activity heatmap"
              subtitle="Last 90 days · message volume per day"
              span={4}
              testId="dashboard-widget-activity-heatmap"
            >
              {dashboardLoading && !dashboard ? (
                <LoadingState />
              ) : dashboard ? (
                <ActivityHeatmap days={dashboard.activity} />
              ) : (
                <EmptyState message={activeProfileId ? 'Loading…' : 'Pick a profile to see activity.'} />
              )}
            </WidgetCard>

            <WidgetCard
              title="Top sessions this week"
              subtitle="Most active by message count"
              span={2}
              testId="dashboard-widget-top-sessions"
            >
              {dashboardLoading && !dashboard ? (
                <LoadingState />
              ) : dashboard ? (
                <TopSessions sessions={dashboard.topSessions} onOpenSession={onOpenSession} />
              ) : (
                <EmptyState message="No data yet." />
              )}
            </WidgetCard>

            <WidgetCard title="Streak + cadence" subtitle="Active days, longest run, average" span={2} testId="dashboard-widget-streak">
              {dashboardLoading && !dashboard ? (
                <LoadingState />
              ) : dashboard ? (
                <StreakCadence streak={dashboard.streak} />
              ) : (
                <EmptyState message="No data yet." />
              )}
            </WidgetCard>

            <WidgetCard title="Live job ticker" subtitle="Cron jobs sorted by next run" span={2} testId="dashboard-widget-job-ticker">
              <LiveJobTicker
                response={jobsResponse}
                loading={jobsLoading}
                onOpenJobs={() => onOpenPage('jobs')}
              />
            </WidgetCard>

            <WidgetCard title="Coding jobs in flight" subtitle="Running / awaiting input or approval" span={2} testId="dashboard-widget-coding-jobs">
              <CodingJobsInFlight
                jobs={codingJobs}
                loading={codingLoading}
                onOpenCoding={() => onOpenPage('coding')}
              />
            </WidgetCard>

            <WidgetCard title="Token + cost rollup" subtitle="7-day usage from coding jobs" span={4} testId="dashboard-widget-token-cost">
              <TokenCostRollup jobs={codingJobs} loading={codingLoading} />
            </WidgetCard>
          </SimpleGrid>
        </Box>
      </Flex>
    </div>
  );
}
