import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Box, Flex, Grid, HStack, Heading, Spinner, Text, VStack } from '@chakra-ui/react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { AppPage, DashboardResponse, JobsResponse } from '@hermes-recipes/protocol';
import { getDashboard } from '../../lib/api';
import { listJobs, type CodingJob } from '../../lib/coding-api';

// ── Shared helpers ────────────────────────────────────────────────

const SPAN_6 = { base: 'span 12', md: 'span 12', lg: 'span 6' };

type WidgetCardProps = {
  title: string;
  subtitle?: string;
  gridColumn?: object | string;
  minH?: string;
  testId?: string;
  children: ReactNode;
};

function WidgetCard({ title, subtitle, gridColumn = SPAN_6, minH = '200px', testId, children }: WidgetCardProps) {
  return (
    <Box
      gridColumn={gridColumn}
      rounded="var(--radius-card)"
      border="1px solid var(--border-subtle)"
      bg="var(--surface-1)"
      p="4"
      display="flex"
      flexDirection="column"
      gap="3"
      minH={minH}
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

// Recharts custom tooltip shared style
function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: ReadonlyArray<any>;
  label?: string;
  formatter?: (value: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <Box
      bg="var(--surface-2)"
      border="1px solid var(--border-default)"
      rounded="var(--radius-control)"
      px="2.5"
      py="2"
      boxShadow="var(--shadow-md)"
    >
      {label ? (
        <Text fontSize="10px" color="var(--text-muted)" mb="1">
          {label}
        </Text>
      ) : null}
      {payload.map((p, i) => (
        <Text key={i} fontSize="12px" color="var(--text-primary)" fontVariantNumeric="tabular-nums">
          {formatter ? formatter(p.value) : p.value}
        </Text>
      ))}
    </Box>
  );
}

// ── Streak + cadence ─────────────────────────────────────────────
function StreakCadence({
  streak,
  days,
}: {
  streak: DashboardResponse['streak'];
  days: DashboardResponse['activity'];
}) {
  const sparkData = useMemo(
    () =>
      days.slice(-14).map((d) => ({
        date: d.date.slice(5),
        count: d.messageCount,
      })),
    [days]
  );

  return (
    <Flex direction="column" gap="3" h="100%">
      {/* Hero numeral */}
      <HStack gap="4" align="baseline">
        <VStack gap="0" align="start">
          <Text
            fontSize="42px"
            fontWeight="800"
            color="var(--text-primary)"
            lineHeight="1"
            fontVariantNumeric="tabular-nums"
          >
            {streak.currentStreakDays}
          </Text>
          <Text fontSize="11px" color="var(--text-muted)" mt="1">
            day streak
          </Text>
        </VStack>
        <VStack gap="0" align="start">
          <Text
            fontSize="20px"
            fontWeight="700"
            color="var(--text-secondary)"
            lineHeight="1"
            fontVariantNumeric="tabular-nums"
          >
            {streak.longestStreakDays}
          </Text>
          <Text fontSize="10px" color="var(--text-muted)">longest</Text>
        </VStack>
      </HStack>

      {/* Sparkline – last 14 days */}
      {sparkData.length > 0 ? (
        <Box flex="1" minH="60px">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
              <defs>
                <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Tooltip
                content={({ active, payload, label }) => (
                  <ChartTooltip
                    active={active}
                    payload={payload}
                    label={label as string}
                    formatter={(v) => `${v} msg`}
                  />
                )}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--accent)"
                strokeWidth={1.5}
                fill="url(#sparkGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      ) : null}

      {/* Secondary stats */}
      <Box h="1px" bg="var(--border-subtle)" flexShrink={0} />
      <HStack justify="space-between" flexShrink={0}>
        <VStack gap="0" align="start">
          <HStack gap="1" align="baseline">
            <Text fontSize="15px" fontWeight="700" color="var(--text-primary)" lineHeight="1" fontVariantNumeric="tabular-nums">
              {streak.activeDaysLast30}
            </Text>
            <Text fontSize="10px" color="var(--text-muted)">/ 30 days</Text>
          </HStack>
          <Text fontSize="10px" color="var(--text-muted)">active</Text>
        </VStack>
        <VStack gap="0" align="end">
          <Text fontSize="15px" fontWeight="700" color="var(--text-primary)" lineHeight="1" fontVariantNumeric="tabular-nums">
            {streak.avgMessagesPerActiveDay.toFixed(1)}
          </Text>
          <Text fontSize="10px" color="var(--text-muted)">msgs/day</Text>
        </VStack>
      </HStack>
    </Flex>
  );
}

// ── Live job ticker (cron) ───────────────────────────────────────
const JOB_STATUS_COLORS: Record<string, string> = {
  healthy: 'var(--accent)',
  paused: 'color-mix(in srgb, var(--accent) 40%, transparent)',
  attention: '#ef4444',
};

function LiveJobTicker({
  response,
  loading,
  onOpenJobs,
}: {
  response: JobsResponse | null;
  loading: boolean;
  onOpenJobs: () => void;
}) {
  if (loading && !response) return <LoadingState />;
  if (!response || response.items.length === 0) {
    return <EmptyState message="No cron jobs configured." />;
  }

  const items = [...response.items].sort((a, b) => a.nextRun.localeCompare(b.nextRun));

  // Status distribution for pie chart
  const statusCounts = items.reduce<Record<string, number>>((acc, j) => {
    const s = j.status === 'healthy' ? 'healthy' : j.status === 'paused' ? 'paused' : 'attention';
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  return (
    <Flex direction="column" gap="3" h="100%">
      {/* Status distribution mini pie */}
      <HStack gap="3" align="center" flexShrink={0}>
        <Box w="60px" h="60px">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={18}
                outerRadius={28}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={JOB_STATUS_COLORS[entry.name] ?? 'var(--surface-2)'} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.[0] ? (
                    <Box
                      bg="var(--surface-2)"
                      border="1px solid var(--border-default)"
                      rounded="var(--radius-control)"
                      px="2"
                      py="1"
                    >
                      <Text fontSize="11px" color="var(--text-primary)">
                        {payload[0].name}: {payload[0].value}
                      </Text>
                    </Box>
                  ) : null
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        <VStack gap="1" align="start">
          {pieData.map((d) => (
            <HStack key={d.name} gap="1.5" align="center">
              <Box
                w="6px"
                h="6px"
                rounded="full"
                bg={JOB_STATUS_COLORS[d.name] ?? 'var(--surface-2)'}
                flexShrink={0}
              />
              <Text fontSize="10px" color="var(--text-secondary)" textTransform="capitalize">
                {d.name}:
              </Text>
              <Text fontSize="10px" color="var(--text-primary)" fontVariantNumeric="tabular-nums">
                {d.value}
              </Text>
            </HStack>
          ))}
        </VStack>
      </HStack>

      {/* Job list */}
      <VStack align="stretch" gap="1" flex="1" overflowY="auto">
        {items.slice(0, 6).map((job) => (
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
              <span
                className={`status-dot status-dot--${
                  job.status === 'healthy'
                    ? 'connected'
                    : job.status === 'paused'
                      ? 'reconnecting'
                      : 'disconnected'
                }`}
              />
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
            <Text
              fontSize="10px"
              color="var(--text-muted)"
              flexShrink={0}
              fontVariantNumeric="tabular-nums"
            >
              {job.schedule}
            </Text>
          </HStack>
        ))}
      </VStack>

      <Box
        as="button"
        onClick={onOpenJobs}
        py="1"
        fontSize="10px"
        color="var(--text-muted)"
        _hover={{ color: 'var(--text-primary)' }}
        textAlign="center"
        cursor="pointer"
        borderTop="1px solid var(--border-subtle)"
        pt="2"
        flexShrink={0}
      >
        View all jobs →
      </Box>
    </Flex>
  );
}

// ── Coding jobs in flight ────────────────────────────────────────
const CODING_ACTIVE_STATUSES = new Set(['queued', 'running', 'awaiting_user', 'awaiting_approval']);

function jobsByDay(jobs: CodingJob[], days = 14): { date: string; count: number }[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const buckets = new Map<string, number>();
  for (const j of jobs) {
    const ts = j.createdAt;
    if (ts < cutoff) continue;
    const key = new Date(ts).toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  // Fill in missing days
  const result: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    result.push({ date: d.slice(5), count: buckets.get(d) ?? 0 });
  }
  return result;
}

function CodingJobsInFlight({
  jobs,
  loading,
  onOpenCoding,
}: {
  jobs: CodingJob[] | null;
  loading: boolean;
  onOpenCoding: () => void;
}) {
  if (loading && !jobs) return <LoadingState />;
  if (!jobs) return <EmptyState message="Could not load coding jobs." />;

  const active = jobs.filter((j) => CODING_ACTIVE_STATUSES.has(j.status) && !j.archivedAt);
  const sparkData = jobsByDay(jobs, 14);

  return (
    <Flex direction="column" gap="3" h="100%">
      {/* Active count hero + sparkline */}
      <HStack gap="4" align="start">
        <VStack gap="0" align="start" flexShrink={0}>
          <Text
            fontSize="42px"
            fontWeight="800"
            color="var(--text-primary)"
            lineHeight="1"
            fontVariantNumeric="tabular-nums"
          >
            {active.length}
          </Text>
          <Text fontSize="11px" color="var(--text-muted)" mt="1">
            active job{active.length === 1 ? '' : 's'}
          </Text>
        </VStack>
        <Box flex="1" h="60px">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sparkData} margin={{ top: 2, right: 2, left: -30, bottom: 0 }} barSize={5}>
              <Bar dataKey="count" fill="var(--accent)" radius={[2, 2, 0, 0]} />
              <Tooltip
                content={({ active: a, payload, label }) => (
                  <ChartTooltip
                    active={a}
                    payload={payload}
                    label={label as string}
                    formatter={(v) => `${v} job${v === 1 ? '' : 's'}`}
                  />
                )}
                cursor={{ fill: 'var(--surface-hover)' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </HStack>

      {active.length === 0 ? (
        <Flex flex="1" align="center" justify="center">
          <Text fontSize="12px" color="var(--text-muted)">No coding jobs in flight.</Text>
        </Flex>
      ) : (
        <VStack align="stretch" gap="1" flex="1" overflowY="auto">
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
                  {job.title ?? job.prompt}
                </Text>
                <Text
                  fontSize="10px"
                  color="var(--text-muted)"
                  flexShrink={0}
                  textTransform="uppercase"
                  letterSpacing="0.04em"
                >
                  {job.status.replace(/_/g, ' ')}
                </Text>
              </HStack>
              <HStack gap="2" mt="0.5">
                <Text fontSize="10px" color="var(--text-muted)">{job.agent}</Text>
                {typeof job.turnCount === 'number' ? (
                  <Text fontSize="10px" color="var(--text-muted)">
                    · {job.turnCount} turn{job.turnCount === 1 ? '' : 's'}
                  </Text>
                ) : null}
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
    </Flex>
  );
}

// ── Token + cost rollup ──────────────────────────────────────────
function costByDay(jobs: CodingJob[], days = 14): { date: string; cost: number }[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const buckets = new Map<string, number>();
  for (const j of jobs) {
    const ts = j.completedAt ?? j.startedAt ?? j.createdAt;
    if (ts < cutoff) continue;
    const key = new Date(ts).toISOString().slice(0, 10);
    const c = j.estimatedCostUsd ?? 0;
    buckets.set(key, (buckets.get(key) ?? 0) + c);
  }
  const result: { date: string; cost: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    result.push({ date: d.slice(5), cost: +(buckets.get(d) ?? 0).toFixed(4) });
  }
  return result;
}

function TokenCostRollup({ jobs, loading }: { jobs: CodingJob[] | null; loading: boolean }) {
  if (loading && !jobs) return <LoadingState />;
  if (!jobs) return <EmptyState message="Could not load coding jobs." />;

  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - SEVEN_DAYS_MS;
  const recent = jobs.filter((j) => (j.completedAt ?? j.startedAt ?? j.createdAt) >= cutoff);

  let totalTokens = 0;
  let totalCost = 0;
  for (const job of recent) {
    totalTokens += job.totalTokens ?? 0;
    totalCost += job.estimatedCostUsd ?? 0;
  }

  const costSeries = costByDay(jobs, 14);

  return (
    <Flex gap="3" h="100%" direction="column">
      {/* Top: Coding section */}
      <Flex direction="column" gap="2">
        <Text fontSize="11px" fontWeight="600" color="var(--text-secondary)">
          Coding (Claude Code + Codex)
        </Text>

        {/* Summary numbers */}
        <HStack gap="4" align="baseline">
          <VStack gap="0" align="start">
            <Text
              fontSize="22px"
              fontWeight="700"
              color="var(--text-primary)"
              lineHeight="1"
              fontVariantNumeric="tabular-nums"
            >
              ${totalCost.toFixed(2)}
            </Text>
            <Text fontSize="10px" color="var(--text-muted)">7-day spend</Text>
          </VStack>
          <VStack gap="0" align="start">
            <Text
              fontSize="14px"
              fontWeight="600"
              color="var(--text-secondary)"
              lineHeight="1"
              fontVariantNumeric="tabular-nums"
            >
              {totalTokens.toLocaleString()}
            </Text>
            <Text fontSize="10px" color="var(--text-muted)">tokens</Text>
          </VStack>
        </HStack>

        {/* 14-day cost area chart */}
        <Box h="120px">
          {costSeries.some((d) => d.cost > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costSeries} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                  tickLine={false}
                  axisLine={false}
                  interval={6}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `$${v.toFixed(2)}`}
                  width={36}
                />
                <Tooltip
                  content={({ active, payload, label }) => (
                    <ChartTooltip
                      active={active}
                      payload={payload}
                      label={label as string}
                      formatter={(v) => `$${v.toFixed(4)}`}
                    />
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="var(--accent)"
                  strokeWidth={1.5}
                  fill="url(#costGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Flex align="center" justify="center" h="100%">
              <Text fontSize="11px" color="var(--text-muted)">No cost data in the last 14 days.</Text>
            </Flex>
          )}
        </Box>
      </Flex>

      {/* Divider */}
      <Box h="1px" bg="var(--border-subtle)" flexShrink={0} />

      {/* Bottom: Hermes section */}
      <Flex direction="column" gap="2">
        <Text fontSize="11px" fontWeight="600" color="var(--text-secondary)">
          Hermes (chat)
        </Text>

        <Box
          h="120px"
          rounded="var(--radius-control)"
          border="1px dashed var(--border-subtle)"
          position="relative"
          overflow="hidden"
        >
          {/* Grayed-out placeholder chart bars */}
          <Flex
            position="absolute"
            inset={0}
            align="flex-end"
            gap="2px"
            px="3"
            pb="3"
            opacity={0.18}
          >
            {[0.4, 0.6, 0.3, 0.8, 0.5, 0.7, 0.4, 0.9, 0.6, 0.5, 0.7, 0.3, 0.6, 0.8].map((h, i) => (
              <Box
                key={i}
                flex="1"
                style={{ height: `${h * 60}%` }}
                bg="var(--text-muted)"
                rounded="1px"
              />
            ))}
          </Flex>

          {/* Overlay message */}
          <Flex
            position="absolute"
            inset={0}
            align="center"
            justify="center"
            direction="column"
            gap="1.5"
            px="3"
            textAlign="center"
          >
            <Text fontSize="12px" fontWeight="600" color="var(--text-secondary)">
              Not yet captured
            </Text>
            <Text fontSize="10px" color="var(--text-muted)" maxW="200px" lineHeight="1.5">
              Hermes runtime-metadata token reporting (Hermes 0.12 #17026) is not yet wired to the bridge.
            </Text>
          </Flex>
        </Box>
      </Flex>
    </Flex>
  );
}

// ── Page shell ───────────────────────────────────────────────────
export function DashboardPage({
  activeProfileId,
  jobsResponse,
  jobsLoading,
  onOpenSession: _onOpenSession,
  onOpenPage,
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
        if (!cancelled)
          setDashboardError(err instanceof Error ? err.message : 'Failed to load dashboard.');
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
        {/* Page header */}
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
          <Box
            rounded="var(--radius-card)"
            border="1px solid var(--border-subtle)"
            bg="var(--surface-1)"
            p="3"
            flexShrink={0}
          >
            <Text fontSize="12px" color="var(--text-secondary)">
              Failed to load dashboard data: {dashboardError}
            </Text>
          </Box>
        ) : null}

        {/* 12-column grid */}
        <Box flex="1" minH={0} overflowY="auto" pr="1">
          <Grid
            templateColumns="repeat(12, 1fr)"
            gap="3"
          >
            {/* Row 1: Streak + cadence (6 cols) | Token + cost rollup (6 cols) */}
            <WidgetCard
              title="Streak + cadence"
              subtitle="Active days, longest run, average"
              gridColumn={SPAN_6}
              minH="220px"
              testId="dashboard-widget-streak"
            >
              {dashboardLoading && !dashboard ? (
                <LoadingState />
              ) : dashboard ? (
                <StreakCadence streak={dashboard.streak} days={dashboard.activity} />
              ) : (
                <EmptyState message="No data yet." />
              )}
            </WidgetCard>

            <WidgetCard
              title="Token + cost rollup"
              subtitle="7-day usage · coding jobs telemetry"
              gridColumn={SPAN_6}
              minH="220px"
              testId="dashboard-widget-token-cost"
            >
              <TokenCostRollup jobs={codingJobs} loading={codingLoading} />
            </WidgetCard>

            {/* Row 2: Live job ticker (6 cols) + coding jobs (6 cols) */}
            <WidgetCard
              title="Live job ticker"
              subtitle="Cron jobs sorted by next run"
              gridColumn={SPAN_6}
              minH="280px"
              testId="dashboard-widget-job-ticker"
            >
              <LiveJobTicker
                response={jobsResponse}
                loading={jobsLoading}
                onOpenJobs={() => onOpenPage('jobs')}
              />
            </WidgetCard>

            <WidgetCard
              title="Coding jobs in flight"
              subtitle="Running / awaiting input or approval"
              gridColumn={SPAN_6}
              minH="280px"
              testId="dashboard-widget-coding-jobs"
            >
              <CodingJobsInFlight
                jobs={codingJobs}
                loading={codingLoading}
                onOpenCoding={() => onOpenPage('coding')}
              />
            </WidgetCard>
          </Grid>
        </Box>
      </Flex>
    </div>
  );
}
