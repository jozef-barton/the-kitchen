import { Box, Button, Flex, Text } from '@chakra-ui/react';
import type { Session } from '@hermes-recipes/protocol';
import { SessionActionMenu } from './SessionActionMenu';

function formatSessionMeta(session: Session) {
  const updatedLabel = new Date(session.lastUpdatedAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
  return updatedLabel;
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
    <Flex
      className="session-row"
      data-testid="recent-session-row"
      data-session-id={session.id}
      align="center"
      gap="1"
      px="2"
      h="9"
      minH="9"
      maxH="9"
      width="100%"
      maxW="100%"
      minW={0}
      rounded="7px"
      bg={active ? 'var(--surface-selected)' : 'transparent'}
      overflow="hidden"
      transition="background-color 140ms ease"
      _hover={{ bg: active ? 'var(--surface-selected)' : 'var(--surface-hover)' }}
    >
      <Button
        justifyContent="start"
        alignItems="center"
        textAlign="left"
        variant="ghost"
        flex="1 1 0"
        minW={0}
        minH="0"
        h="full"
        rounded="6px"
        px="1"
        py="0"
        bg="transparent"
        overflow="hidden"
        _hover={{ bg: 'transparent' }}
        onClick={onClick}
      >
        <Box minW={0} w="100%" overflow="hidden">
          <Text
            data-testid="recent-session-title"
            width="100%"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
            fontSize="xs"
            fontWeight="600"
            color={active ? 'var(--text-primary)' : 'var(--text-secondary)'}
            lineHeight="1.3"
          >
            {session.title}
          </Text>
          <Text
            data-testid="recent-session-meta"
            width="100%"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
            fontSize="10px"
            color="var(--text-muted)"
            lineHeight="1.2"
          >
            {formatSessionMeta(session)}
          </Text>
        </Box>
      </Button>

      {onRename && onDelete ? (
        <Box className="session-row__actions" flexShrink={0}>
          <SessionActionMenu
            label={`Actions for ${session.title}`}
            onRename={onRename}
            onDelete={onDelete}
            size="xs"
            showRename
          />
        </Box>
      ) : null}
    </Flex>
  );
}
