import { Box, Flex, HStack, Heading, SimpleGrid, Text, VStack } from '@chakra-ui/react';

type WidgetSize = 'sm' | 'md' | 'lg';

type WidgetIdea = {
  id: string;
  title: string;
  pitch: string;
  size: WidgetSize;
  tag: 'live' | 'planned';
};

const widgetIdeas: WidgetIdea[] = [
  {
    id: 'runtime-pulse',
    title: 'Runtime pulse',
    pitch: 'Hermes health, active model, provider, version, last error — one glanceable card.',
    size: 'sm',
    tag: 'planned'
  },
  {
    id: 'activity-heatmap',
    title: 'Activity heatmap',
    pitch: 'GitHub-style 90-day grid of message volume. Hover for daily totals; click a cell to filter sessions.',
    size: 'lg',
    tag: 'planned'
  },
  {
    id: 'top-sessions',
    title: 'Top sessions this week',
    pitch: 'Most active sessions by message count with last-touched timestamp. Click to resume.',
    size: 'md',
    tag: 'planned'
  },
  {
    id: 'recipe-shortcuts',
    title: 'Pinned recipes',
    pitch: 'Star a recipe to surface it here. One click to open or re-run with a fresh session.',
    size: 'md',
    tag: 'planned'
  },
  {
    id: 'job-ticker',
    title: 'Live job ticker',
    pitch: 'Currently-running cron + the last five completions, with status, duration, and a deeplink.',
    size: 'md',
    tag: 'planned'
  },
  {
    id: 'token-rollup',
    title: 'Token + cost rollup',
    pitch: '7-day token spend bucketed by provider/model. Sparkline + estimated $ if the provider exposes pricing.',
    size: 'md',
    tag: 'planned'
  },
  {
    id: 'tool-leaderboard',
    title: 'Tool leaderboard',
    pitch: 'Top tools used in the last 7 days from the review-history audit trail. Drives skill-loading hints.',
    size: 'sm',
    tag: 'planned'
  },
  {
    id: 'skill-spotlight',
    title: 'Skill spotlight',
    pitch: 'Surface a least-used or newly-installed skill — echoes the Hermes 0.12 curator usage ranking.',
    size: 'sm',
    tag: 'planned'
  },
  {
    id: 'quick-ask',
    title: 'Quick ask',
    pitch: 'Mini composer that spawns a fresh session and jumps to chat. Optional template picker inline.',
    size: 'md',
    tag: 'planned'
  },
  {
    id: 'recent-attachments',
    title: 'Recent attachments',
    pitch: 'Thumbnails of files uploaded in the last 14 days, grouped by session, with a re-attach action.',
    size: 'md',
    tag: 'planned'
  },
  {
    id: 'streak',
    title: 'Streak + cadence',
    pitch: 'Days-in-a-row used, longest streak, average messages per active day. Lightweight gamification.',
    size: 'sm',
    tag: 'planned'
  },
  {
    id: 'coding-jobs',
    title: 'Coding jobs in flight',
    pitch: 'Claude Code / Codex jobs grouped by status, with elapsed time and a deeplink into the Coding page.',
    size: 'md',
    tag: 'planned'
  }
];

function colSpanFor(size: WidgetSize): number {
  if (size === 'lg') return 4;
  if (size === 'md') return 2;
  return 1;
}

function WidgetCard({ idea }: { idea: WidgetIdea }) {
  const colSpan = colSpanFor(idea.size);
  return (
    <Box
      gridColumn={{ base: 'span 1', md: `span ${Math.min(colSpan, 2)}`, lg: `span ${colSpan}` }}
      rounded="var(--radius-card)"
      border="1px solid var(--border-subtle)"
      bg="var(--surface-1)"
      p="4"
      minH="160px"
      display="flex"
      flexDirection="column"
      gap="2"
      transition="border-color var(--transition-fast), background var(--transition-fast)"
      _hover={{ borderColor: 'var(--border-default)', bg: 'var(--surface-2)' }}
      data-testid={`dashboard-widget-${idea.id}`}
    >
      <HStack justify="space-between" align="start" gap="2">
        <Heading
          as="h3"
          fontSize="13px"
          fontWeight="600"
          color="var(--text-primary)"
          lineHeight="1.3"
        >
          {idea.title}
        </Heading>
        <Text
          fontSize="9px"
          fontWeight="600"
          letterSpacing="0.06em"
          textTransform="uppercase"
          px="1.5"
          py="0.5"
          rounded="full"
          bg="var(--surface-3)"
          color="var(--text-muted)"
          flexShrink={0}
        >
          {idea.tag}
        </Text>
      </HStack>
      <Text fontSize="12px" color="var(--text-secondary)" lineHeight="1.5">
        {idea.pitch}
      </Text>
      <Box
        flex="1"
        mt="2"
        rounded="var(--radius-control)"
        border="1px dashed var(--border-subtle)"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text fontSize="10px" color="var(--text-muted)" opacity={0.6}>
          widget preview
        </Text>
      </Box>
    </Box>
  );
}

export function DashboardPage() {
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
            At-a-glance view of activity, jobs, and recent work. Widgets below are sketches —
            we will wire them up one by one.
          </Text>
        </VStack>

        <Box flex="1" minH={0} overflowY="auto" pr="1">
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="3">
            {widgetIdeas.map((idea) => (
              <WidgetCard key={idea.id} idea={idea} />
            ))}
          </SimpleGrid>
        </Box>
      </Flex>
    </div>
  );
}
