import { useCallback, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  HStack,
  Input,
  Separator,
  Spinner,
  Table,
  Text,
  VStack
} from '@chakra-ui/react';
import type { SkillSearchResult } from '@hermes-recipes/protocol';
import { searchSkillsHub, installSkillFromHub } from '../../lib/api';

const PAGE_SIZE = 12;

const EXAMPLE_QUERIES = ['code review', 'git', 'screenshots', 'file manager', 'calendar'];

function trustTone(trust: string): string {
  if (trust === 'builtin') return 'var(--status-neutral-bg)';
  if (trust === 'official') return 'var(--status-success-bg)';
  return 'var(--status-accent-bg)';
}

function trustTextColor(trust: string): string {
  if (trust === 'builtin') return 'var(--text-muted)';
  if (trust === 'official') return 'var(--status-success-text)';
  return 'var(--accent)';
}

function trustLabel(trust: string): string {
  if (trust === 'builtin') return 'Built-in';
  if (trust === 'official') return 'Official';
  return trust.charAt(0).toUpperCase() + trust.slice(1);
}

function TrustChip({ trust }: { trust: string }) {
  return (
    <Badge
      rounded="full"
      px="2"
      py="0.5"
      fontSize="10px"
      fontWeight="600"
      bg={trustTone(trust)}
      color={trustTextColor(trust)}
      border="none"
    >
      {trustLabel(trust)}
    </Badge>
  );
}

function InstalledChip() {
  return (
    <Badge
      rounded="full"
      px="2"
      py="0.5"
      fontSize="10px"
      fontWeight="600"
      bg="var(--status-success-bg)"
      color="var(--status-success-text)"
      border="none"
    >
      Installed
    </Badge>
  );
}

function SkillCard({
  skill,
  onInstall,
  installing
}: {
  skill: SkillSearchResult;
  onInstall: (identifier: string) => void;
  installing: boolean;
}) {
  const authorFromIdentifier = (id: string) => id.split('/')[0] ?? id;

  return (
    <Box
      rounded="8px"
      border="1px solid var(--border-subtle)"
      bg="var(--surface-1)"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      flex={{ base: '1 1 100%', md: '1 1 calc(50% - 7px)' }}
      minW="280px"
      opacity={skill.isInstalled ? 0.85 : 1}
    >
      <Box px="4" py="3.5" bg="var(--surface-1)" borderBottom="1px solid var(--border-subtle)">
        <Text
          fontSize="11px"
          fontWeight="600"
          letterSpacing="0.12em"
          textTransform="uppercase"
          color="var(--text-muted)"
        >
          {skill.category || skill.source}
        </Text>
        <Text mt="1.5" fontWeight="600" color="var(--text-primary)">
          {skill.name}
        </Text>
        <Text mt="0.5" fontSize="sm" color="var(--text-secondary)">
          by {authorFromIdentifier(skill.identifier)}
        </Text>
      </Box>
      <VStack align="stretch" gap="3" px="4" py="3.5" flex="1">
        {skill.description ? (
          <Text fontSize="sm" color="var(--text-secondary)" lineClamp={3} lineHeight="1.5">
            {skill.description}
          </Text>
        ) : null}
        <Flex gap="2" wrap="wrap">
          <TrustChip trust={skill.trust} />
          {skill.source && skill.source !== skill.trust ? (
            <Badge
              rounded="full"
              px="2"
              py="0.5"
              fontSize="10px"
              fontWeight="600"
              bg="var(--status-neutral-bg)"
              color="var(--text-muted)"
              border="none"
            >
              {skill.source}
            </Badge>
          ) : null}
          {skill.isInstalled ? <InstalledChip /> : null}
        </Flex>
        {!skill.isInstalled ? (
          <Box mt="auto">
            <Button
              size="sm"
              variant="outline"
              rounded="7px"
              colorPalette="blue"
              loading={installing}
              onClick={() => onInstall(skill.identifier)}
              w="full"
            >
              Install Skill
            </Button>
          </Box>
        ) : (
          <Box
            mt="auto"
            rounded="7px"
            border="1px solid var(--border-subtle)"
            bg="var(--surface-2)"
            px="3"
            py="1.5"
            textAlign="center"
          >
            <Text fontSize="xs" color="var(--text-muted)">
              Already installed
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}

export function SkillFinderTab({ profileId }: { profileId: string }) {
  const [query, setQuery] = useState('');
  const [safeOnly, setSafeOnly] = useState(true);
  const [results, setResults] = useState<SkillSearchResult[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installedSet, setInstalledSet] = useState<Set<string>>(new Set());
  const [installError, setInstallError] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');

  const doSearch = useCallback(
    async (q: string, resetPage: boolean, safe: boolean) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      if (resetPage) {
        setLoading(true);
        setPage(1);
        setResults(null);
        setCurrentQuery(trimmed);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      try {
        const nextPage = resetPage ? 1 : page + 1;
        const resp = await searchSkillsHub({
          profileId,
          query: trimmed,
          safeOnly: safe,
          page: nextPage,
          pageSize: PAGE_SIZE
        });
        if (resetPage) {
          setResults(
            resp.results.map((r) => ({ ...r, isInstalled: r.isInstalled || installedSet.has(r.identifier) }))
          );
        } else {
          setResults((prev) => [
            ...(prev ?? []),
            ...resp.results.map((r) => ({ ...r, isInstalled: r.isInstalled || installedSet.has(r.identifier) }))
          ]);
          setPage(nextPage);
        }
        setTotal(resp.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [profileId, page, installedSet]
  );

  async function handleInstall(identifier: string) {
    setInstallingId(identifier);
    setInstallError(null);
    try {
      await installSkillFromHub({ profileId, identifier });
      setInstalledSet((prev) => new Set([...prev, identifier]));
      setResults((prev) =>
        prev
          ? prev.map((r) => (r.identifier === identifier ? { ...r, isInstalled: true } : r))
          : prev
      );
    } catch (err) {
      setInstallError(err instanceof Error ? err.message : 'Installation failed.');
    } finally {
      setInstallingId(null);
    }
  }

  const shownCount = results?.length ?? 0;
  const hasMore = shownCount < total;

  return (
    <VStack align="stretch" h="100%" minH={0} gap="4" overflow="auto">
      <Box
        rounded="8px"
        border="1px solid var(--border-subtle)"
        bg="var(--surface-elevated)"
        px="4"
        py="3.5"
        boxShadow="var(--shadow-xs)"
      >
        <VStack align="stretch" gap="3">
          <Box>
            <Text fontSize="sm" fontWeight="650" color="var(--text-primary)">
              Skill Finder
            </Text>
            <Text fontSize="xs" color="var(--text-secondary)" mt="0.5">
              Search the Hermes Skill Hub and install skills directly.
            </Text>
          </Box>
          <HStack gap="2" align="center">
            <Input
              flex="1"
              size="sm"
              rounded="8px"
              placeholder="Search skills…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void doSearch(query, true, safeOnly);
              }}
            />
            <Button
              size="sm"
              rounded="8px"
              colorPalette="blue"
              loading={loading}
              onClick={() => void doSearch(query, true, safeOnly)}
              disabled={!query.trim()}
            >
              Search
            </Button>
          </HStack>
          <HStack gap="2" align="center">
            <Checkbox.Root
              size="sm"
              checked={safeOnly}
              onCheckedChange={(details) => {
                const next = details.checked === true;
                setSafeOnly(next);
                if (currentQuery) void doSearch(currentQuery, true, next);
              }}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control rounded="4px" />
              <Checkbox.Label>
                <Text fontSize="xs" color="var(--text-secondary)">
                  Official & built-in only (recommended)
                </Text>
              </Checkbox.Label>
            </Checkbox.Root>
          </HStack>
          {!results && !loading ? (
            <Flex gap="2" wrap="wrap">
              {EXAMPLE_QUERIES.map((q) => (
                <Badge
                  key={q}
                  rounded="full"
                  px="2.5"
                  py="1"
                  fontSize="xs"
                  fontWeight="500"
                  cursor="pointer"
                  bg="var(--surface-2)"
                  color="var(--text-secondary)"
                  border="1px solid var(--border-subtle)"
                  _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
                  onClick={() => {
                    setQuery(q);
                    void doSearch(q, true, safeOnly);
                  }}
                >
                  {q}
                </Badge>
              ))}
            </Flex>
          ) : null}
        </VStack>
      </Box>

      {error ? (
        <Box rounded="8px" border="1px solid var(--border-danger)" bg="var(--surface-danger)" px="4" py="3">
          <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
            Search failed
          </Text>
          <Text fontSize="xs" color="var(--text-secondary)" mt="0.5">
            {error}
          </Text>
        </Box>
      ) : null}

      {installError ? (
        <Box rounded="8px" border="1px solid var(--border-danger)" bg="var(--surface-danger)" px="4" py="3">
          <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
            Installation failed
          </Text>
          <Text fontSize="xs" color="var(--text-secondary)" mt="0.5">
            {installError}
          </Text>
        </Box>
      ) : null}

      {loading ? (
        <Box rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-1)" px="4" py="8">
          <VStack align="center" gap="3">
            <Spinner size="md" color="blue.500" />
            <Text fontSize="sm" color="var(--text-secondary)">
              Searching Skill Hub…
            </Text>
          </VStack>
        </Box>
      ) : results !== null ? (
        <VStack align="stretch" gap="4">
          <Box
            rounded="8px"
            border="1px solid var(--border-subtle)"
            bg="var(--surface-1)"
            px="4"
            py="3.5"
          >
            <VStack align="stretch" gap="1">
              <Text
                fontSize="11px"
                fontWeight="600"
                letterSpacing="0"
                textTransform="uppercase"
                color="var(--text-muted)"
              >
                Skill Finder
              </Text>
              <Text fontSize="lg" fontWeight="600" color="var(--text-primary)">
                {currentQuery ? `Skills matching "${currentQuery}"` : 'Discover skills'}
              </Text>
              <Text fontSize="sm" color="var(--text-secondary)">
                {total} result{total === 1 ? '' : 's'} from Hermes Skill Hub
                {safeOnly ? ' (official & built-in)' : ' (all sources)'}.
              </Text>
            </VStack>
          </Box>

          {results.length > 0 ? (
            <>
              <Box rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-1)" overflow="hidden">
                <Box px="4" py="3" borderBottom="1px solid var(--border-subtle)">
                  <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
                    Compare
                  </Text>
                </Box>
                <Table.ScrollArea>
                  <Table.Root size="sm" variant="outline">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>Skill</Table.ColumnHeader>
                        <Table.ColumnHeader>Source</Table.ColumnHeader>
                        <Table.ColumnHeader>Trust</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Installed</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {results.map((r) => (
                        <Table.Row key={r.identifier}>
                          <Table.Cell>
                            <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
                              {r.name}
                            </Text>
                          </Table.Cell>
                          <Table.Cell>
                            <Text fontSize="xs" color="var(--text-secondary)">
                              {r.source}
                            </Text>
                          </Table.Cell>
                          <Table.Cell>
                            <TrustChip trust={r.trust} />
                          </Table.Cell>
                          <Table.Cell textAlign="center">
                            {r.isInstalled || installedSet.has(r.identifier) ? (
                              <Text fontSize="sm" fontWeight="700" color="var(--status-success-text)">
                                ✓
                              </Text>
                            ) : (
                              <Text fontSize="sm" color="var(--text-muted)">
                                —
                              </Text>
                            )}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Table.ScrollArea>
              </Box>

              <Separator borderColor="var(--border-subtle)" />

              <Box>
                <Text fontSize="sm" fontWeight="600" color="var(--text-primary)" mb="3">
                  Skills
                </Text>
                <Flex gap="3.5" wrap="wrap">
                  {results.map((skill) => (
                    <SkillCard
                      key={skill.identifier}
                      skill={skill.isInstalled || installedSet.has(skill.identifier) ? { ...skill, isInstalled: true } : skill}
                      onInstall={(id) => void handleInstall(id)}
                      installing={installingId === skill.identifier}
                    />
                  ))}
                </Flex>
              </Box>

              {hasMore ? (
                <Box textAlign="center" pb="4">
                  <Button
                    size="sm"
                    variant="outline"
                    rounded="8px"
                    loading={loadingMore}
                    onClick={() => void doSearch(currentQuery, false, safeOnly)}
                  >
                    Load more ({total - shownCount} remaining)
                  </Button>
                </Box>
              ) : null}
            </>
          ) : (
            <Box rounded="8px" border="1px solid var(--border-subtle)" bg="var(--surface-1)" px="4" py="8">
              <VStack align="center" gap="2">
                <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
                  No skills found
                </Text>
                <Text fontSize="xs" color="var(--text-secondary)">
                  Try a different search term
                  {safeOnly ? ' or uncheck "Official & built-in only" to include community skills' : ''}.
                </Text>
              </VStack>
            </Box>
          )}
        </VStack>
      ) : null}
    </VStack>
  );
}
