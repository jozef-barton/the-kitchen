import { Box, Button, Flex, Text, VStack } from '@chakra-ui/react';
import type { Session } from '@hermes-recipes/protocol';
import { SessionActionMenu } from './SessionActionMenu';

function formatSessionMeta(session: Session) {
  const messageLabel = `${session.messageCount} ${session.messageCount === 1 ? 'message' : 'messages'}`;
  const updatedLabel = new Date(session.lastUpdatedAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
  return `${messageLabel} · ${updatedLabel}`;
}

export function SessionRow({
  session,
  active,
  onClick,
  onRename,
  onDelete
}: {
  session: Session;
  active: boolean;
  onClick: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}) {
  return (
    <Box
      className="session-row"
      data-testid="recent-session-row"
      data-session-id={session.id}
      width="100%"
      maxW="100%"
      minW={0}
      rounded="8px"
      bg={active ? 'var(--surface-selected)' : 'transparent'}
      overflow="hidden"
      transition="background-color 140ms ease"
      position="relative"
      _hover={{ bg: active ? 'var(--surface-selected)' : 'var(--surface-hover)' }}
    >
      <Flex align="center" gap="1" px="2" py="1.5" minW={0} maxW="100%" overflow="hidden">
        <Button
          justifyContent="start"
          alignItems="start"
          textAlign="left"
          variant="ghost"
          flex="1 1 0"
          maxW="100%"
          minW={0}
          minH="0"
          rounded="6px"
          px="1"
          py="0"
          height="auto"
          bg="transparent"
          overflow="hidden"
          _hover={{ bg: 'transparent' }}
          onClick={onClick}
        >
          <VStack align="start" gap="0.5" width="100%" minW={0} overflow="hidden">
            <Text
              data-testid="recent-session-title"
              width="100%"
              minW={0}
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              fontSize="sm"
              fontWeight="600"
              color={active ? 'var(--text-primary)' : 'var(--text-secondary)'}
              lineHeight="1.3"
            >
              {session.title}
            </Text>
            <Text
              data-testid="recent-session-meta"
              width="100%"
              minW={0}
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              fontSize="xs"
              color="var(--text-muted)"
              lineHeight="1"
            >
              {formatSessionMeta(session)}
            </Text>
          </VStack>
        </Button>

        {onRename && onDelete ? (
          <Box className="session-row__actions" flexShrink={0}>
            <SessionActionMenu
              label={`Actions for ${session.title}`}
              onRename={onRename}
              onDelete={onDelete}
              size="xs"
            />
          </Box>
        ) : null}
      </Flex>
    </Box>
  );
}
