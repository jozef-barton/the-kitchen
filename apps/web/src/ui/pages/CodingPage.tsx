import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Button, Flex, HStack, Input, NativeSelect, Spinner, Tabs, Text, Textarea, VStack
} from '@chakra-ui/react';
import * as api from '../../lib/coding-api';
import type { CodingProject, CodingJob, JobEvent, JobFileSummaryEntry, ApprovalMode } from '../../lib/coding-api';
import * as mainApi from '../../lib/api';
import type { ModelProviderResponse } from '@hermes-recipes/protocol';
import { JobConversation } from './coding/JobConversation';
import { JobComposer } from './coding/JobComposer';
import { CostBadge } from './coding/CostBadge';
import { MessageRow } from './coding/events/MessageRow';
import { FilePanel } from './coding/FilePanel';
import { IntegrationsTab } from './coding/IntegrationsTab';
import { useCodingIntegrations } from '../../hooks/use-coding-integrations';
import type { FilePanelMode } from './coding/FilePanel';

// ── Agent model/effort option tables ────────────────────────────────────────
const AGENT_MODELS: Record<string, { value: string; label: string }[]> = {
  'claude-code': [
    { value: 'sonnet', label: 'Claude Sonnet 4.6' },
    { value: 'opus', label: 'Claude Opus 4.7' },
    { value: 'haiku', label: 'Claude Haiku 4.5' },
  ],
  codex: [
    { value: 'codex-mini-latest', label: 'Codex Mini' },
    { value: 'gpt-5-codex', label: 'GPT-5 Codex' },
  ],
};

const AGENT_EFFORTS: Record<string, { value: string; label: string }[]> = {
  'claude-code': [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'xhigh', label: 'X-High' },
    { value: 'max', label: 'Max' },
  ],
  codex: [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ],
};

// ── Views ───────────────────────────────────────────────────────────────────
type View =
  | { kind: 'projects' }
  | { kind: 'project'; projectId: string }
  | { kind: 'job'; projectId: string; jobId: string };

// ── Shared small components ─────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const color =
    status === 'running' ? 'var(--status-info)' :
    status === 'completed' ? 'var(--status-success)' :
    status === 'failed' || status === 'cancelled' ? 'var(--status-danger)' :
    status === 'awaiting_approval' ? 'var(--status-warning)' :
    status === 'awaiting_user' ? 'var(--accent)' :
    status === 'interrupted' ? 'var(--status-warning)' :
    'var(--text-muted)';
  return (
    <Text
      display="inline-block"
      fontSize="10px"
      fontWeight="600"
      textTransform="uppercase"
      letterSpacing="0.06em"
      color={color}
      bg={`${color}22`}
      rounded="var(--radius-pill)"
      px="2"
      py="0.5"
    >
      {status}
    </Text>
  );
}

function RelativeTime({ ts }: { ts: number }) {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  const label = seconds < 60 ? `${seconds}s ago`
    : seconds < 3600 ? `${Math.floor(seconds / 60)}m ago`
    : `${Math.floor(seconds / 3600)}h ago`;
  return <Text fontSize="11px" color="var(--text-muted)">{label}</Text>;
}


// ── Clone progress modal ──────────────────────────────────────────────────────

interface GitPhase { label: string; pct: number }

function parseGitLine(raw: string): GitPhase | null {
  const last = raw.split('\r').filter(s => s.trim()).pop()?.trim() ?? '';
  const clean = last.replace(/^remote:\s*/i, '');
  const m = clean.match(/^([\w][\w\s,]+?):\s+(\d+)%/);
  if (!m) return null;
  return { label: m[1]!.trim(), pct: Math.min(100, parseInt(m[2]!)) };
}

// Named phases in display order
const PHASE_ORDER = ['Counting objects', 'Compressing objects', 'Receiving objects', 'Resolving deltas'];
const PHASE_WEIGHT: Record<string, number> = {
  'Counting objects': 0.05, 'Compressing objects': 0.10,
  'Receiving objects': 0.70, 'Resolving deltas': 0.15,
};

function CloneTerminal({ repoUrl, targetDir, onDone, onClose }: {
  repoUrl: string; targetDir: string;
  onDone: (path: string, name: string) => void;
  onClose: () => void;
}) {
  const [phases, setPhases] = useState<Record<string, number>>({});
  const [lastLine, setLastLine] = useState('');
  const [status, setStatus] = useState<'connecting' | 'running' | 'done' | 'error'>('connecting');
  const [errorDetail, setErrorDetail] = useState('');
  const stopRef = useRef<(() => void) | null>(null);

  const repoShort = repoUrl.split('/').slice(-2).join('/').replace(/\.git$/, '');

  function inferName(url: string) {
    return url.split('/').pop()?.replace(/\.git$/, '') ?? '';
  }

  useEffect(() => {
    const stop = api.cloneRepo(repoUrl, targetDir || undefined, (evt) => {
      if (evt.type === 'clone.status') {
        setStatus('running');
        setLastLine(evt.message);
      }
      if (evt.type === 'clone.output') {
        setStatus('running');
        const phase = parseGitLine(evt.line);
        if (phase) {
          setPhases(prev => ({ ...prev, [phase.label]: phase.pct }));
        } else {
          // Show non-progress lines (like "Cloning into...", "remote: Total...")
          const stripped = evt.line.replace(/^remote:\s*/i, '').trim();
          if (stripped && !stripped.match(/^\d/) && stripped.length < 80) {
            setLastLine(stripped);
          }
        }
      }
      if (evt.type === 'clone.complete') {
        setPhases(Object.fromEntries(PHASE_ORDER.map(k => [k, 100])));
        setStatus('done');
        setTimeout(() => onDone(evt.path, inferName(repoUrl)), 900);
      }
      if (evt.type === 'clone.error') {
        setErrorDetail(evt.message);
        setStatus('error');
      }
    });
    stopRef.current = stop;
    return () => stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const overallPct = status === 'done' ? 100 : Math.min(99, Math.round(
    PHASE_ORDER.reduce((sum, k) => sum + (phases[k] ?? 0) * (PHASE_WEIGHT[k] ?? 0), 0)
  ));
  const hasPhases = PHASE_ORDER.some(k => (phases[k] ?? 0) > 0);

  return (
    <Box
      position="fixed" inset={0} zIndex={200}
      bg="rgba(0,0,0,0.6)"
      display="flex" alignItems="center" justifyContent="center"
      style={{ animation: 'fade-in 0.15s ease' }}
      onClick={() => { if (status !== 'running' && status !== 'connecting') { stopRef.current?.(); onClose(); } }}
    >
      <Box
        bg="hsl(224,16%,9%)"
        border="1px solid hsl(224,12%,20%)"
        rounded="14px" overflow="hidden"
        w={{ base: '92vw', md: '440px' }}
        boxShadow="0 32px 80px rgba(0,0,0,0.6)"
        style={{ animation: 'slide-up 0.22s ease' }}
        onClick={e => e.stopPropagation()}
      >
        {/* macOS title bar */}
        <HStack px="4" py="3" bg="hsl(224,16%,11%)" borderBottom="1px solid hsl(224,12%,17%)" gap="3">
          <HStack gap="1.5">
            <Box w="11px" h="11px" rounded="full" bg="hsl(0,65%,52%)" />
            <Box w="11px" h="11px" rounded="full" bg="hsl(38,65%,52%)" />
            <Box w="11px" h="11px" rounded="full" bg="hsl(142,50%,42%)" />
          </HStack>
          <Text fontSize="12px" color="hsl(220,8%,50%)" fontFamily="ui-monospace,monospace" flex="1" textAlign="center" truncate>
            git clone — {repoShort}
          </Text>
          <Box w="36px" />
        </HStack>

        <VStack px="6" py="6" gap="4" align="stretch">
          {status === 'done' ? (
            /* ── Success ── */
            <VStack gap="2" py="2">
              <Text fontSize="24px">✓</Text>
              <Text fontSize="14px" fontWeight="600" color="var(--status-success)">Cloned successfully</Text>
              <Text fontSize="11px" color="hsl(220,8%,45%)" fontFamily="ui-monospace,monospace" truncate maxW="320px">
                {targetDir || repoShort}
              </Text>
            </VStack>
          ) : status === 'error' ? (
            /* ── Error ── */
            <VStack gap="3" align="stretch">
              <HStack gap="2">
                <Text color="hsl(0,65%,60%)">✗</Text>
                <Text fontSize="13px" fontWeight="600" color="hsl(0,65%,60%)">Clone failed</Text>
              </HStack>
              <Box bg="hsl(224,16%,6%)" rounded="8px" p="3" fontFamily="ui-monospace,monospace" fontSize="11px" color="hsl(0,55%,55%)" lineHeight="1.6">
                {errorDetail}
              </Box>
            </VStack>
          ) : (
            /* ── Running / Connecting ── */
            <>
              {/* Main progress bar — pulses while connecting, fills while running */}
              <Box>
                <HStack justify="space-between" mb="2">
                  <Text fontSize="11px" color="hsl(220,8%,55%)" fontWeight="500">
                    {status === 'connecting' ? 'Connecting…' : 'Progress'}
                  </Text>
                  {status === 'running' && (
                    <Text fontSize="11px" color="var(--status-success)" fontFamily="ui-monospace,monospace">{overallPct}%</Text>
                  )}
                </HStack>
                <Box w="100%" h="5px" bg="hsl(224,12%,17%)" rounded="full" overflow="hidden">
                  {status === 'connecting' ? (
                    /* Indeterminate shimmer */
                    <Box
                      h="100%"
                      style={{
                        background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.6s ease infinite',
                      }}
                    />
                  ) : (
                    <Box
                      h="100%" rounded="full"
                      bg="var(--status-success)"
                      style={{ width: `${overallPct}%`, transition: 'width 0.4s ease' }}
                    />
                  )}
                </Box>
              </Box>

              {/* Per-phase rows — appear as each phase starts */}
              {hasPhases && (
                <VStack gap="2.5" align="stretch">
                  {PHASE_ORDER.filter(k => (phases[k] ?? 0) > 0).map(k => (
                    <Box key={k}>
                      <HStack justify="space-between" mb="1">
                        <Text fontSize="10px" color="hsl(220,8%,45%)">{k}</Text>
                        <Text fontSize="10px" color="hsl(220,8%,45%)" fontFamily="ui-monospace,monospace">
                          {phases[k] === 100 ? '✓' : `${phases[k]}%`}
                        </Text>
                      </HStack>
                      <Box w="100%" h="3px" bg="hsl(224,12%,17%)" rounded="full" overflow="hidden">
                        <Box
                          h="100%" rounded="full"
                          bg={phases[k] === 100 ? 'var(--status-success)' : 'var(--accent)'}
                          style={{ width: `${phases[k]}%`, transition: 'width 0.35s ease' }}
                        />
                      </Box>
                    </Box>
                  ))}
                </VStack>
              )}

              {/* Current status line */}
              {lastLine && (
                <HStack gap="2" color="hsl(220,8%,40%)">
                  <Spinner size="xs" flexShrink={0} />
                  <Text fontSize="11px" fontFamily="ui-monospace,monospace" truncate>{lastLine}</Text>
                </HStack>
              )}
            </>
          )}
        </VStack>

        {status !== 'done' && (
          <Box px="6" pb="5" textAlign="right">
            <Button
              size="sm" h="7" px="3" variant="ghost" fontSize="12px"
              color="hsl(220,8%,40%)" _hover={{ color: 'hsl(220,8%,70%)' }}
              onClick={() => { stopRef.current?.(); onClose(); }}
            >
              {status === 'running' || status === 'connecting' ? 'Cancel' : 'Close'}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ── Clone GitHub Repo panel ───────────────────────────────────────────────────
function ClonePanel({ onDone, onCancel }: { onDone: (path: string, name: string) => void; onCancel: () => void }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [targetDir, setTargetDir] = useState('');
  const [showTerminal, setShowTerminal] = useState(false);

  function inferName(url: string) {
    return url.split('/').pop()?.replace(/\.git$/, '') ?? '';
  }

  return (
    <>
      <Box mb="4" p="4" rounded="var(--radius-card)" border="1px solid var(--border-subtle)" bg="var(--surface-2)" flexShrink={0}>
        <VStack align="stretch" gap="3">
          <Text fontSize="13px" fontWeight="600" color="var(--text-primary)">Clone GitHub Repository</Text>
          <Input
            placeholder="https://github.com/owner/repo.git"
            value={repoUrl}
            onChange={e => setRepoUrl(e.currentTarget.value)}
            onKeyDown={e => { if (e.key === 'Enter' && repoUrl.trim()) setShowTerminal(true); }}
            size="sm" bg="var(--surface-3)" border="1px solid var(--border-subtle)"
            rounded="var(--radius-control)"
          />
          <HStack gap="2">
            <Input
              placeholder={`~/Code/${inferName(repoUrl) || 'repo'}`}
              value={targetDir}
              onChange={e => setTargetDir(e.currentTarget.value)}
              size="sm" bg="var(--surface-3)" border="1px solid var(--border-subtle)"
              rounded="var(--radius-control)" flex="1"
            />
            <Button
              size="sm" h="8" px="3" flexShrink={0} variant="outline"
              color="var(--text-secondary)" borderColor="var(--border-subtle)"
              _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
              rounded="var(--radius-control)"
              onClick={async () => {
                const p = await api.pickDirectory();
                if (p) setTargetDir(p + '/' + inferName(repoUrl));
              }}
            >
              Browse…
            </Button>
          </HStack>
          <HStack gap="2" justify="flex-end">
            <Button variant="ghost" size="sm" h="8" px="3" onClick={onCancel} color="var(--text-muted)">Cancel</Button>
            <Button
              size="sm" h="8" px="3" bg="var(--accent)" color="var(--accent-contrast)"
              _hover={{ bg: 'var(--accent-strong)' }} rounded="var(--radius-control)"
              disabled={!repoUrl.trim()}
              onClick={() => setShowTerminal(true)}
            >
              Clone
            </Button>
          </HStack>
        </VStack>
      </Box>

      {showTerminal && (
        <CloneTerminal
          repoUrl={repoUrl.trim()}
          targetDir={targetDir.trim()}
          onClose={() => setShowTerminal(false)}
          onDone={(clonedPath, name) => {
            setShowTerminal(false);
            onDone(clonedPath, name);
          }}
        />
      )}
    </>
  );
}

// ── Projects list view ───────────────────────────────────────────────────────
function ProjectsView({
  onSelectProject,
  onRefresh,
  projects,
  loading
}: {
  onSelectProject: (id: string) => void;
  onRefresh: () => void;
  projects: CodingProject[];
  loading: boolean;
}) {
  const [panel, setPanel] = useState<'none' | 'add' | 'clone'>('none');
  const [name, setName] = useState('');
  const [repoPath, setRepoPath] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd() {
    if (!name.trim() || !repoPath.trim()) return;
    setSubmitting(true);
    setAddError(null);
    try {
      await api.createProject(name.trim(), repoPath.trim());
      setName(''); setRepoPath(''); setPanel('none');
      onRefresh();
    } catch (err) {
      setAddError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await api.deleteProject(id);
      onRefresh();
    } catch { /* ignore */ }
    finally { setDeletingId(null); }
  }

  return (
    <VStack align="stretch" h="100%" minH={0} gap="0" px="4" py="4">
      <HStack justify="space-between" mb="4" flexShrink={0}>
        <Text fontSize="15px" fontWeight="600" color="var(--text-primary)">Projects</Text>
        <HStack gap="2">
          <Button
            size="sm" h="8" px="3" variant="outline"
            color="var(--text-secondary)" borderColor="var(--border-subtle)"
            _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
            rounded="var(--radius-control)"
            onClick={() => setPanel(p => p === 'clone' ? 'none' : 'clone')}
          >
            {panel === 'clone' ? 'Cancel' : '↓ Clone repo'}
          </Button>
          <Button
            size="sm" h="8" px="3"
            bg="var(--accent)" color="var(--accent-contrast)"
            _hover={{ bg: 'var(--accent-strong)' }}
            rounded="var(--radius-control)"
            onClick={() => setPanel(p => p === 'add' ? 'none' : 'add')}
          >
            {panel === 'add' ? 'Cancel' : '+ Add project'}
          </Button>
        </HStack>
      </HStack>

      {panel === 'clone' && (
        <ClonePanel
          onCancel={() => setPanel('none')}
          onDone={(clonedPath, suggestedName) => {
            setPanel('add');
            setRepoPath(clonedPath);
            setName(suggestedName);
          }}
        />
      )}

      {panel === 'add' && (
        <Box mb="4" p="4" rounded="var(--radius-card)" border="1px solid var(--border-subtle)" bg="var(--surface-2)" flexShrink={0}>
          <VStack align="stretch" gap="3">
            <Input
              placeholder="Project name"
              value={name}
              onChange={e => setName(e.currentTarget.value)}
              size="sm" bg="var(--surface-3)" border="1px solid var(--border-subtle)"
              rounded="var(--radius-control)"
            />
            <HStack gap="2">
              <Input
                placeholder="/absolute/path/to/repo"
                value={repoPath}
                onChange={e => setRepoPath(e.currentTarget.value)}
                size="sm" bg="var(--surface-3)" border="1px solid var(--border-subtle)"
                rounded="var(--radius-control)"
                flex="1"
              />
              <Button
                size="sm" h="8" px="3" flexShrink={0}
                variant="outline"
                color="var(--text-secondary)"
                borderColor="var(--border-subtle)"
                _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
                rounded="var(--radius-control)"
                onClick={async () => {
                  const picked = await api.pickDirectory();
                  if (picked) setRepoPath(picked);
                }}
              >
                Browse…
              </Button>
            </HStack>
            {addError && <Text fontSize="12px" color="var(--status-danger)">{addError}</Text>}
            <Button
              size="sm" bg="var(--accent)" color="var(--accent-contrast)"
              _hover={{ bg: 'var(--accent-strong)' }}
              rounded="var(--radius-control)"
              loading={submitting}
              onClick={() => void handleAdd()}
            >
              Add project
            </Button>
          </VStack>
        </Box>
      )}

      {loading ? (
        <Flex flex="1" align="center" justify="center"><Spinner size="sm" /></Flex>
      ) : projects.length === 0 ? (
        <Flex flex="1" align="center" justify="center">
          <VStack gap="2" textAlign="center">
            <Text fontSize="15px" fontWeight="500" color="var(--text-secondary)">No projects yet</Text>
            <Text fontSize="13px" color="var(--text-muted)">Add a local repo or clone one from GitHub</Text>
            <HStack mt="2" gap="2">
              <Button size="sm" variant="outline" color="var(--text-secondary)" borderColor="var(--border-subtle)" _hover={{ bg: 'var(--surface-hover)' }} rounded="var(--radius-control)" onClick={() => setPanel('clone')}>↓ Clone repo</Button>
              <Button size="sm" bg="var(--accent)" color="var(--accent-contrast)" _hover={{ bg: 'var(--accent-strong)' }} rounded="var(--radius-control)" onClick={() => setPanel('add')}>Add project</Button>
            </HStack>
          </VStack>
        </Flex>
      ) : (
        <VStack align="stretch" gap="2" flex="1" overflow="auto">
          {projects.map(p => (
            <Box
              key={p.id}
              p="3" rounded="var(--radius-card)" border="1px solid var(--border-subtle)"
              bg="var(--surface-2)" cursor="pointer"
              _hover={{ bg: 'var(--surface-hover)', borderColor: 'var(--border-default)' }}
              transition="background var(--transition-fast), border-color var(--transition-fast)"
              onClick={() => onSelectProject(p.id)}
            >
              <HStack justify="space-between">
                <VStack align="start" gap="0.5" minW={0} flex="1">
                  <Text fontSize="14px" fontWeight="500" color="var(--text-primary)" truncate>{p.name}</Text>
                  <Text fontSize="11px" color="var(--text-muted)" fontFamily="ui-monospace, monospace" truncate>{p.repoPath}</Text>
                </VStack>
                <HStack gap="2" flexShrink={0}>
                  <RelativeTime ts={p.updatedAt} />
                  <Button
                    size="xs" h="6" px="2" variant="ghost"
                    color="var(--status-danger)" opacity={0.6}
                    _hover={{ opacity: 1, bg: 'var(--surface-danger)' }}
                    rounded="var(--radius-control)"
                    loading={deletingId === p.id}
                    onClick={e => void handleDelete(p.id, e)}
                    title="Delete project"
                  >
                    ✕
                  </Button>
                </HStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
    </VStack>
  );
}

// ── Project detail view ─────────────────────────────────────────────────────

function JobRow({ job, onSelect, focused }: { job: CodingJob; onSelect: () => void; focused: boolean }) {
  const isAwaiting = job.status === 'awaiting_user';
  const isRunning = job.status === 'running';
  const isTerminal = job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled';

  const lastActivity = job.lastTurnAt ?? job.createdAt;

  // Subtitle meta pieces
  const meta: string[] = [];
  if (job.turnCount > 1) meta.push(`${job.turnCount} turns`);
  if (job.filesChangedCount) meta.push(`${job.filesChangedCount} file${job.filesChangedCount !== 1 ? 's' : ''}`);
  if (job.startedAt && job.completedAt) {
    const secs = Math.round((job.completedAt - job.startedAt) / 1000);
    meta.push(secs >= 60 ? `${Math.floor(secs / 60)}m ${secs % 60}s` : `${secs}s`);
  }

  const mostRecent = job.turnCount > 1 ? job.mostRecentTurnText : null;

  return (
    <Box
      p="3"
      rounded="var(--radius-card)"
      border="1px solid"
      borderColor={isAwaiting ? 'var(--status-warning)' : 'var(--border-subtle)'}
      borderLeft={isAwaiting ? '3px solid var(--status-warning)' : '1px solid var(--border-subtle)'}
      bg={isTerminal ? 'var(--surface-1)' : 'var(--surface-2)'}
      opacity={isTerminal ? 0.65 : 1}
      cursor="pointer"
      outline={focused ? '2px solid var(--accent)' : undefined}
      _hover={{ bg: isTerminal ? 'var(--surface-2)' : 'var(--surface-hover)', borderColor: isAwaiting ? 'var(--status-warning)' : 'var(--border-default)', opacity: 1 }}
      transition="background var(--transition-fast), opacity var(--transition-fast)"
      onClick={onSelect}
    >
      <HStack justify="space-between" align="flex-start" gap="3">
        <VStack align="start" gap="0.5" minW={0} flex="1">
          {/* Title row — initial prompt */}
          <Text
            fontSize="13px"
            fontWeight="500"
            color="var(--text-primary)"
            lineClamp={1}
          >
            {job.prompt}
          </Text>

          {/* Subtitle row — most recent turn + metadata */}
          <HStack gap="1" flexWrap="wrap">
            {mostRecent && (
              <Text fontSize="11px" color="var(--text-muted)" truncate maxW="220px">
                &quot;{mostRecent.length > 60 ? mostRecent.slice(0, 60) + '…' : mostRecent}&quot;
              </Text>
            )}
            {meta.length > 0 && (
              <Text fontSize="11px" color="var(--text-muted)">
                {mostRecent ? '· ' : ''}{meta.join(' · ')}
              </Text>
            )}
          </HStack>
        </VStack>

        {/* Right side: status + last activity */}
        <VStack align="end" gap="1" flexShrink={0}>
          <HStack gap="1.5" align="center">
            {isRunning ? (
              <Spinner size="xs" color="var(--status-success)" flexShrink={0} />
            ) : (
              <Box
                w="6px" h="6px" rounded="full" flexShrink={0}
                bg={
                  isAwaiting ? 'var(--status-warning)' :
                  job.status === 'failed' || job.status === 'cancelled' ? 'var(--status-danger)' :
                  'transparent'
                }
              />
            )}
            <StatusPill status={job.status} />
          </HStack>
          <RelativeTime ts={lastActivity} />
        </VStack>
      </HStack>
    </Box>
  );
}

// ── All-jobs view (Jobs tab) ─────────────────────────────────────────────────
function AllJobsView({
  onSelectJob
}: {
  onSelectJob: (projectId: string, jobId: string) => void;
}) {
  const [projects, setProjects] = useState<CodingProject[]>([]);
  const [jobsByProject, setJobsByProject] = useState<Record<string, CodingJob[]>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [allProjects, allJobs] = await Promise.all([
        api.listProjects(),
        api.listJobs(),
      ]);
      setProjects(allProjects);
      const byProject: Record<string, CodingJob[]> = {};
      for (const project of allProjects) {
        byProject[project.id] = [];
      }
      for (const job of allJobs) {
        if (byProject[job.projectId]) {
          byProject[job.projectId]!.push(job);
        }
      }
      setJobsByProject(byProject);
      // Auto-expand projects that have jobs on first load
      setExpanded(prev => {
        const next = { ...prev };
        for (const project of allProjects) {
          if (!(project.id in next)) {
            next[project.id] = (byProject[project.id]?.length ?? 0) > 0;
          }
        }
        return next;
      });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Poll running jobs
  useEffect(() => {
    const hasRunning = Object.values(jobsByProject).flat()
      .some(j => j.status === 'running' || j.status === 'awaiting_approval');
    if (!hasRunning) return;
    const id = setInterval(() => { void load(); }, 5000);
    return () => clearInterval(id);
  }, [jobsByProject, load]);

  if (loading) {
    return (
      <Flex flex="1" align="center" justify="center">
        <Spinner size="sm" color="var(--text-muted)" />
      </Flex>
    );
  }

  const projectsWithJobs = projects.filter(p => (jobsByProject[p.id]?.length ?? 0) > 0);
  const projectsWithoutJobs = projects.filter(p => (jobsByProject[p.id]?.length ?? 0) === 0);
  const hasAnything = projects.length > 0;

  if (!hasAnything) {
    return (
      <Flex flex="1" align="center" justify="center">
        <VStack gap="2" textAlign="center">
          <Text fontSize="15px" fontWeight="500" color="var(--text-secondary)">No projects yet</Text>
          <Text fontSize="13px" color="var(--text-muted)">Add a project in the Repos tab to get started</Text>
        </VStack>
      </Flex>
    );
  }

  const totalRunning = Object.values(jobsByProject).flat()
    .filter(j => j.status === 'running' || j.status === 'awaiting_approval' || j.status === 'awaiting_user').length;

  return (
    <VStack align="stretch" h="100%" minH={0} gap="0">
      {/* Header */}
      <HStack px="4" py="3" flexShrink={0} justify="space-between" borderBottom="1px solid var(--border-subtle)">
        <HStack gap="2">
          <Text fontSize="14px" fontWeight="600" color="var(--text-primary)">All jobs</Text>
          {totalRunning > 0 && (
            <HStack gap="1.5" px="2" py="0.5" rounded="full"
              bg="rgba(34,197,94,0.12)" border="1px solid rgba(34,197,94,0.3)">
              <Spinner size="xs" color="var(--status-success)" />
              <Text fontSize="11px" fontWeight="600" color="var(--status-success)">
                {totalRunning} running
              </Text>
            </HStack>
          )}
        </HStack>
        <Button
          size="xs" variant="ghost" h="6" px="2" fontSize="11px"
          color="var(--text-muted)" _hover={{ color: 'var(--text-primary)' }}
          onClick={() => void load()}
        >
          Refresh
        </Button>
      </HStack>

      {/* Project groups */}
      <VStack align="stretch" flex="1" overflow="auto" gap="0" py="2" px="3">
        {[...projectsWithJobs, ...projectsWithoutJobs].map(project => {
          const jobs = jobsByProject[project.id] ?? [];
          const isOpen = expanded[project.id] ?? false;
          const runningCount = jobs.filter(j =>
            j.status === 'running' || j.status === 'awaiting_approval' || j.status === 'awaiting_user'
          ).length;

          return (
            <Box key={project.id} mb="1">
              {/* Section header */}
              <HStack
                px="2" py="2" rounded="var(--radius-control)" cursor="pointer"
                _hover={{ bg: 'var(--surface-hover)' }}
                onClick={() => setExpanded(prev => ({ ...prev, [project.id]: !isOpen }))}
                gap="2"
              >
                <Text
                  fontSize="12px" lineHeight="1"
                  color="var(--text-muted)"
                  style={{ transition: 'transform 0.15s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}
                >
                  ▶
                </Text>
                <Text fontSize="13px" fontWeight="600" color="var(--text-primary)" flex="1" truncate>
                  {project.name}
                </Text>
                <HStack gap="2" flexShrink={0}>
                  {runningCount > 0 && (
                    <HStack gap="1">
                      <Spinner size="xs" color="var(--status-success)" />
                      <Text fontSize="11px" color="var(--status-success)" fontWeight="600">
                        {runningCount}
                      </Text>
                    </HStack>
                  )}
                  <Text fontSize="11px" color="var(--text-muted)">
                    {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
                  </Text>
                </HStack>
              </HStack>

              {/* Jobs list */}
              {isOpen && (
                <VStack align="stretch" gap="1.5" pl="5" pb="2">
                  {jobs.length === 0 ? (
                    <Text fontSize="12px" color="var(--text-muted)" py="1">No jobs yet</Text>
                  ) : (
                    jobs.map(j => (
                      <JobRow
                        key={j.id}
                        job={j}
                        focused={false}
                        onSelect={() => onSelectJob(project.id, j.id)}
                      />
                    ))
                  )}
                </VStack>
              )}
            </Box>
          );
        })}
      </VStack>
    </VStack>
  );
}

function ProjectDetailView({
  projectId,
  onBack,
  onSelectJob
}: {
  projectId: string;
  onBack: () => void;
  onSelectJob: (jobId: string) => void;
}) {
  const { integrations } = useCodingIntegrations();
  const [project, setProject] = useState<CodingProject | null>(null);
  const [jobs, setJobs] = useState<CodingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState<number>(-1);
  const listRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback((attempt = 0) => {
    setLoading(true);
    api.getProject(projectId)
      .then((data) => {
        setProject(data.project);
        setJobs(data.jobs);
      }).catch(() => {
        if (attempt < 4) setTimeout(() => load(attempt + 1), 600 * (attempt + 1));
      }).finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  // Keyboard navigation
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIdx(i => Math.min(i + 1, jobs.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIdx(i => Math.max(i - 1, 0)); }
      else if (e.key === 'Enter' && focusedIdx >= 0 && jobs[focusedIdx]) { onSelectJob(jobs[focusedIdx]!.id); }
      else if (e.key === 'n' && !newJobOpen) { setNewJobOpen(true); }
    };
    el.addEventListener('keydown', handler);
    return () => el.removeEventListener('keydown', handler);
  }, [jobs, focusedIdx, newJobOpen, onSelectJob]);

  // New job view replaces the list — rendered after all hooks
  if (newJobOpen && project) {
    return (
      <NewJobView
        project={project}
        integrations={integrations}
        onCancel={() => setNewJobOpen(false)}
        onCreated={(job) => { setNewJobOpen(false); onSelectJob(job.id); }}
      />
    );
  }

  return (
    <VStack align="stretch" h="100%" minH={0} gap="0" px="4" py="4">
      <HStack mb="4" flexShrink={0} justify="space-between" flexWrap="wrap" gap="2">
        <HStack gap="1" color="var(--text-muted)">
          <Button variant="ghost" size="xs" h="6" px="1" onClick={onBack} color="var(--text-muted)" _hover={{ color: 'var(--text-primary)' }}>
            ← Projects
          </Button>
          <Text fontSize="12px">/</Text>
          <Text fontSize="13px" fontWeight="500" color="var(--text-primary)">{project?.name ?? '…'}</Text>
        </HStack>
        <HStack gap="2">
          {/* Project-level approval mode default */}
          {project && (
            <HStack gap="1.5" align="center">
              <Text fontSize="11px" color="var(--text-muted)">Default:</Text>
              <NativeSelect.Root size="sm" h="7" w="36">
                <NativeSelect.Field
                  fontSize="11px"
                  value={project.defaultApprovalMode}
                  bg="var(--surface-3)"
                  onChange={async (e) => {
                    const mode = e.currentTarget.value as ApprovalMode;
                    await api.updateProjectApprovalMode(project.id, mode);
                    load();
                  }}
                >
                  <option value="auto_safe">Edits only</option>
                  <option value="auto_all">Actions only</option>
                  <option value="manual">Manual approval</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </HStack>
          )}
          <Button
            size="sm" h="8" px="3"
            bg="var(--accent)" color="var(--accent-contrast)"
            _hover={{ bg: 'var(--accent-strong)' }}
            rounded="var(--radius-control)"
            onClick={() => setNewJobOpen(true)}
            disabled={!project}
          >
            + New job
          </Button>
        </HStack>
      </HStack>

      {loading ? (
        <Flex flex="1" align="center" justify="center"><Spinner size="sm" /></Flex>
      ) : jobs.length === 0 ? (
        <Flex flex="1" align="center" justify="center">
          <VStack gap="2" textAlign="center">
            <Text fontSize="15px" fontWeight="500" color="var(--text-secondary)">No jobs yet</Text>
            <Text fontSize="13px" color="var(--text-muted)">Create a new job to get started</Text>
          </VStack>
        </Flex>
      ) : (
        <VStack
          ref={listRef}
          align="stretch" gap="2" flex="1" overflow="auto"
          tabIndex={0}
          outline="none"
          _focusVisible={{ outline: 'none' }}
        >
          {jobs.map((j, idx) => (
            <JobRow
              key={j.id}
              job={j}
              focused={focusedIdx === idx}
              onSelect={() => onSelectJob(j.id)}
            />
          ))}
        </VStack>
      )}
    </VStack>
  );
}

// ── Header selector chip — shared, polished styling ──────────────────────────
function HeaderSelect({
  value, options, disabled, onChange, width,
}: {
  value: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  onChange: (v: string) => void;
  width: number;
}) {
  const [hover, setHover] = useState(false);
  return (
    <select
      value={value}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onChange={e => onChange(e.currentTarget.value)}
      style={{
        height: '30px',
        width: `${width}px`,
        paddingTop: '6px',
        paddingBottom: '6px',
        paddingLeft: '10px',
        paddingRight: '28px',
        fontSize: '12px',
        fontWeight: 500,
        lineHeight: '1',
        backgroundColor: 'var(--surface-2)',
        border: `1px solid ${hover && !disabled ? 'var(--border-default, rgba(255,255,255,0.18))' : 'var(--border-subtle, rgba(255,255,255,0.10))'}`,
        borderRadius: '8px',
        color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
        cursor: disabled ? 'default' : 'pointer',
        appearance: 'none',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23a1a1aa' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 9px center',
        opacity: disabled ? 0.7 : 1,
        outline: 'none',
        flexShrink: 0,
        transition: 'border-color 0.15s ease',
        boxShadow: 'inset 0 0 0 0 transparent',
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function CodingHeaderSelectors({
  agent, connectedAgents, agentLocked, onAgentChange,
  effectiveMode, unrestrictedAccess, onApprovalModeChange,
  model, onModelChange,
  reasoningEffort, onReasoningEffortChange,
}: {
  agent: string;
  connectedAgents: readonly string[];
  agentLocked: boolean;
  onAgentChange: (v: string) => void;
  effectiveMode: ApprovalMode;
  unrestrictedAccess: boolean;
  onApprovalModeChange: (m: ApprovalMode) => void;
  model: string;
  onModelChange: (v: string) => void;
  reasoningEffort: string;
  onReasoningEffortChange: (v: string) => void;
}) {
  return (
    <>
      <HeaderSelect
        width={130}
        value={agent}
        disabled={agentLocked || connectedAgents.length < 2}
        onChange={onAgentChange}
        options={connectedAgents.map(id => ({
          value: id,
          label: id === 'claude-code' ? 'Claude Code' : 'Codex',
        }))}
      />
      <HeaderSelect
        width={150}
        value={effectiveMode}
        disabled={unrestrictedAccess}
        onChange={(v) => onApprovalModeChange(v as ApprovalMode)}
        options={[
          { value: 'auto_safe', label: 'Edits only' },
          { value: 'auto_all', label: 'Actions only' },
          { value: 'manual', label: 'Manual approval' },
        ]}
      />
      <HeaderSelect
        width={170}
        value={model}
        onChange={onModelChange}
        options={AGENT_MODELS[agent] ?? AGENT_MODELS['claude-code']!}
      />
      <HeaderSelect
        width={110}
        value={reasoningEffort}
        onChange={onReasoningEffortChange}
        options={AGENT_EFFORTS[agent] ?? AGENT_EFFORTS['claude-code']!}
      />
    </>
  );
}

// ── New job view (chat-pane style) ────────────────────────────────────────────
function NewJobView({
  project,
  integrations,
  onCancel,
  onCreated,
}: {
  project: CodingProject;
  integrations: api.AgentIntegration[];
  onCancel: () => void;
  onCreated: (job: CodingJob) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Only show agents that are fully connected
  const connectedAgents = (['claude-code'] as const).filter(id => {
    const intg = integrations.find(i => i.id === id);
    return intg?.installed === 1 && intg.authStatus === 'ok';
  });
  const noAgents = connectedAgents.length === 0;

  const defaultAgent = connectedAgents[0] ?? 'claude-code';
  const [agent, setAgent] = useState<string>(defaultAgent);
  const [agentLocked, setAgentLocked] = useState(false);
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>(project.defaultApprovalMode ?? 'auto_safe');
  const [unrestrictedAccess, setUnrestrictedAccess] = useState(false);
  const [model, setModel] = useState<string>(() => AGENT_MODELS[defaultAgent]?.[0]?.value ?? '');
  const [reasoningEffort, setReasoningEffort] = useState<string>('medium');
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Model config validation
  const [modelCfg, setModelCfg] = useState<ModelProviderResponse | null>(null);
  const [modelCfgLoading, setModelCfgLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bootstrap = await mainApi.getBootstrap();
        const profileId = bootstrap.activeProfileId ?? 'default';
        const cfg = await mainApi.getModelProviders(profileId);
        if (!cancelled) setModelCfg(cfg);
      } catch { /* ignore — we'll show a generic message */ }
      finally { if (!cancelled) setModelCfgLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  // Derive validation gaps
  const readiness = modelCfg?.runtimeReadiness;
  const config = modelCfg?.config;

  const hasProvider = !!(config?.provider && config.provider !== 'unknown');
  const hasModel = !!(config?.defaultModel && config.defaultModel !== 'unknown');

  // Find the active model to check if reasoning effort is required
  const activeProvider = modelCfg?.providers.find(p => p.id === config?.provider);
  const activeModel = activeProvider?.models.find(
    m => m.id === config?.defaultModel || config?.defaultModel?.endsWith('/' + m.id)
  );
  const needsReasoningEffort = activeModel?.supportsReasoningEffort === true;
  const hasReasoningEffort = !!(config?.reasoningEffort && config.reasoningEffort.trim().length > 0);

  const modelReady = !modelCfgLoading && readiness?.ready === true &&
    (!needsReasoningEffort || hasReasoningEffort);

  // Human-readable gap description
  const modelGap: string | null = modelCfgLoading ? null :
    !hasProvider ? 'No provider selected — choose one in the top-right selector.' :
    !hasModel ? 'No model selected — choose one in the top-right selector.' :
    needsReasoningEffort && !hasReasoningEffort ? 'Reasoning level not set — select one in Settings → Model.' :
    readiness && !readiness.ready ? (readiness.message ?? 'Provider not ready — check Settings.') :
    null;

  const effectiveMode: ApprovalMode = unrestrictedAccess ? 'auto_all' : approvalMode;

  useEffect(() => { textareaRef.current?.focus(); }, []);

  function handleAgentChange(value: string) {
    if (agentLocked) return;
    setAgent(value);
    setModel(AGENT_MODELS[value]?.[0]?.value ?? '');
  }

  async function handleCreate() {
    if (!prompt.trim() || noAgents) return;
    setAgentLocked(true);
    setSubmitting(true);
    setError(null);
    try {
      const job = await api.createJob({
        projectId: project.id,
        prompt: prompt.trim(),
        agent,
        approvalMode: effectiveMode,
        confirmAutoAll: effectiveMode === 'auto_all' ? true : undefined,
        model: model || undefined,
        reasoningEffort: reasoningEffort || undefined,
      });
      onCreated(job);
    } catch (err) {
      setError((err as Error).message);
      setAgentLocked(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Flex direction="column" h="100%" minH={0}>
      {/* Header */}
      <HStack
        px="4"
        borderBottom="1px solid var(--divider)"
        flexShrink={0}
        justify="space-between"
        gap="3"
        h="44px"
      >
        <HStack gap="1" minW={0} flex="1">
          <Button
            variant="ghost" size="xs" h="6" px="1"
            color="var(--text-muted)" _hover={{ color: 'var(--text-primary)' }}
            onClick={onCancel}
          >
            ← {project.name}
          </Button>
          <Text fontSize="12px" color="var(--text-muted)">/</Text>
          <Text fontSize="13px" fontWeight="500" color="var(--text-primary)">New job</Text>
        </HStack>

        {/* Agent + approval selectors */}
        <HStack gap="1.5" flexShrink={0} align="center">
          {noAgents ? (
            <Text fontSize="12px" color="var(--status-danger)">
              No connected agents — go to Integrations
            </Text>
          ) : (
            <CodingHeaderSelectors
              agent={agent}
              connectedAgents={connectedAgents}
              agentLocked={agentLocked}
              onAgentChange={handleAgentChange}
              effectiveMode={effectiveMode}
              unrestrictedAccess={unrestrictedAccess}
              onApprovalModeChange={(m) => setApprovalMode(m)}
              model={model}
              onModelChange={setModel}
              reasoningEffort={reasoningEffort}
              onReasoningEffortChange={setReasoningEffort}
            />
          )}
        </HStack>
      </HStack>

      {/* Body — empty state placeholder */}
      <Box flex="1" minH={0} overflow="auto" px="6" py="8">
        <VStack align="center" gap="2" opacity={0.4} mt="8">
          <Text fontSize="28px">✦</Text>
          <Text fontSize="14px" fontWeight="500" color="var(--text-secondary)">
            What should Claude Code work on?
          </Text>
          <Text fontSize="12px" color="var(--text-muted)" textAlign="center" maxW="320px">
            Describe the task below. The agent will run in{' '}
            <code style={{ fontFamily: 'ui-monospace,monospace', fontSize: '11px' }}>
              {project.repoPath.replace(/^.*\//, '')}
            </code>
            .
          </Text>
        </VStack>
      </Box>

      {/* Unrestricted access warning + composer */}
      <Box borderTop="1px solid var(--divider)" flexShrink={0} bg="var(--surface-1)">
        {/* Warning checkbox */}
        <HStack
          px="4" py="2"
          gap="2"
          borderBottom={unrestrictedAccess ? '1px solid rgba(220,130,0,0.25)' : undefined}
          bg={unrestrictedAccess ? 'rgba(220,130,0,0.06)' : undefined}
        >
          <input
            type="checkbox"
            id="unrestricted-access"
            checked={unrestrictedAccess}
            disabled={noAgents}
            onChange={e => setUnrestrictedAccess(e.target.checked)}
            style={{ flexShrink: 0, accentColor: 'var(--status-warning)' }}
          />
          <label
            htmlFor="unrestricted-access"
            style={{
              fontSize: '12px',
              color: unrestrictedAccess ? 'var(--status-warning)' : 'var(--text-muted)',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            ⚠ Unrestricted access — run any command without approval prompts
          </label>
        </HStack>

        {/* Model config gap warning */}
        {!modelCfgLoading && modelGap && (
          <HStack
            px="4" py="2" gap="2"
            bg="rgba(220,130,0,0.07)"
            borderBottom="1px solid rgba(220,130,0,0.2)"
          >
            <Text fontSize="12px" color="var(--status-warning)" flex="1">⚠ {modelGap}</Text>
            <Button
              size="xs" variant="ghost" h="5" px="2" fontSize="11px"
              color="var(--accent)" _hover={{ textDecoration: 'underline', bg: 'transparent' }}
              onClick={() => window.location.hash = '/settings/models'}
            >
              Open Settings →
            </Button>
          </HStack>
        )}

        {/* Textarea + send */}
        <VStack align="stretch" gap="2" px="4" py="3">
          <Textarea
            ref={textareaRef}
            placeholder={
              noAgents ? 'Connect an agent in Integrations first…' :
              !modelReady && !modelCfgLoading ? 'Configure provider and model first…' :
              'Describe what you want Claude Code to do… (Enter to send)'
            }
            value={prompt}
            onChange={e => setPrompt(e.currentTarget.value)}
            rows={3}
            bg="var(--surface-2)"
            border="1px solid var(--border-subtle)"
            rounded="var(--radius-control)"
            fontSize="13px"
            resize="none"
            disabled={noAgents || submitting || (!modelReady && !modelCfgLoading)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleCreate(); }
            }}
          />
          {error && <Text fontSize="12px" color="var(--status-danger)">{error}</Text>}
          <HStack justify="space-between">
            <Text fontSize="11px" color="var(--text-muted)">Enter to start · Shift+Enter for newline</Text>
            <Button
              size="sm" h="7" px="4"
              bg="var(--accent)" color="var(--accent-contrast)"
              _hover={{ bg: 'var(--accent-strong)' }}
              rounded="var(--radius-control)"
              loading={submitting || modelCfgLoading}
              disabled={noAgents || !prompt.trim() || !modelReady}
              onClick={() => void handleCreate()}
            >
              Start job
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Flex>
  );
}

// ── Job view ─────────────────────────────────────────────────────────────────
function JobView({
  jobId,
  projectId,
  onBack
}: {
  jobId: string;
  projectId: string;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const [job, setJob] = useState<CodingJob | null>(null);
  const [events, setEvents] = useState<JobEvent[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [endConfirm, setEndConfirm] = useState(false);
  const [latestCost, setLatestCost] = useState<JobEvent | null>(null);
  const [lastAssistantMessage, setLastAssistantMessage] = useState<string | undefined>(undefined);
  const [pendingApproval, setPendingApproval] = useState<{
    approvalId: string; message: string; options: string[]; defaultOption?: number; category: string; resolving: boolean;
  } | null>(null);
  const [activeJobId, setActiveJobId] = useState(jobId);
  const maxEventIdRef = useRef<number>(0);
  // sinceId: null = load not done yet; number = ready for SSE subscription
  const [sinceId, setSinceId] = useState<number | null>(null);
  const [jobPrompts] = useState<Map<string, string>>(new Map());
  const [compact, setCompact] = useState(() => localStorage.getItem('coding-compact') === 'true');
  const [filePanel, setFilePanel] = useState<FilePanelMode | null>(null);
  const [filePanelLoading, setFilePanelLoading] = useState(false);
  const [sessionFiles, setSessionFiles] = useState<JobFileSummaryEntry[]>([]);
  // Local overrides for model/reasoning — kept in sync with job state
  const [localModel, setLocalModel] = useState<string>('');
  const [localReasoning, setLocalReasoning] = useState<string>('medium');

  // Load history first, then gate SSE subscription on sinceId so replayed
  // events can't regress the status that was authoritatively set by the load.
  useEffect(() => {
    let cancelled = false;
    maxEventIdRef.current = 0;
    setSinceId(null);
    const load = (attempt = 0) => {
      api.getJobWithEvents(jobId)
        .then(({ job: j, events: evts, maxEventId }) => {
          if (cancelled) return;
          maxEventIdRef.current = maxEventId ?? 0;
          setSinceId(maxEventId ?? 0);
          setJob(j);
          if (j.model) setLocalModel(j.model);
          if (j.reasoningEffort) setLocalReasoning(j.reasoningEffort);
          setEvents(evts);
          const costEvt = [...evts].reverse().find(e => e.type === 'job.cost_update');
          if (costEvt) setLatestCost(costEvt);
          const lastMsg = [...evts].reverse().find(e => e.type === 'job.message');
          if (lastMsg) setLastAssistantMessage((lastMsg as unknown as { text: string }).text);
        })
        .catch(() => { if (!cancelled && attempt < 5) setTimeout(() => load(attempt + 1), 500 * (attempt + 1)); });
    };
    load();
    return () => { cancelled = true; };
  }, [jobId]);

  // Always apply fetched status so manual syncs (SSE error, poll) are authoritative.
  const syncJobStatus = useCallback(() => {
    api.getJob(activeJobId).then(j => {
      setJob(prev => {
        if (!prev) return j;
        return {
          ...prev,
          status: j.status,
          agentSessionId: j.agentSessionId ?? prev.agentSessionId,
          sessionId: j.sessionId ?? prev.sessionId,
        };
      });
    }).catch(() => {});
  }, [activeJobId]);

  // Only subscribe after the initial load (sinceId !== null) so the SSE stream
  // starts exactly where the snapshot left off — no replayed status regressions.
  useEffect(() => {
    if (sinceId === null) return;
    const unsubscribe = api.subscribeToJobEvents(activeJobId, (event) => {
      setEvents(prev => {
        const evId = (event as JobEvent & { _id?: number })._id;
        if (evId && prev.some(e => (e as JobEvent & { _id?: number })._id === evId)) return prev;
        return [...prev, event];
      });
      if (event.type === 'job.completed') setJob(prev => prev ? { ...prev, status: 'completed' } : prev);
      if (event.type === 'job.failed') setJob(prev => prev ? { ...prev, status: 'failed' } : prev);
      if (event.type === 'job.started') setJob(prev => prev ? { ...prev, status: 'running' } : prev);
      if (event.type === 'job.awaiting_user') setJob(prev => prev ? { ...prev, status: 'awaiting_user' } : prev);
      if (event.type === 'job.user_turn') setJob(prev => prev ? { ...prev, status: 'running' } : prev);
      if (event.type === 'job.agent_initialized') {
        const e = event as JobEvent & { sessionId: string };
        setJob(prev => prev ? { ...prev, agentSessionId: e.sessionId, sessionId: e.sessionId } : prev);
      }
      if (event.type === 'job.needs_approval') {
        const e = event as JobEvent & { approvalId: string; message: string; options: string[]; defaultOption?: number; category: string };
        setPendingApproval({ approvalId: e.approvalId, message: e.message, options: e.options, defaultOption: e.defaultOption, category: e.category, resolving: false });
        setJob(prev => prev ? { ...prev, status: 'awaiting_approval' } : prev);
      }
      if (event.type === 'job.approval_resolved') { setPendingApproval(null); setJob(prev => prev ? { ...prev, status: 'running' } : prev); }
      if (event.type === 'job.cost_update') setLatestCost(event);
      if (event.type === 'job.message') setLastAssistantMessage((event as JobEvent & { text: string }).text);
    }, syncJobStatus, sinceId > 0 ? sinceId : undefined);
    return unsubscribe;
  }, [activeJobId, syncJobStatus, sinceId]);

  const jobIsActive = job?.status === 'running' || job?.status === 'awaiting_user';
  useEffect(() => {
    if (!jobIsActive) return;
    const timer = setInterval(syncJobStatus, 10_000);
    return () => clearInterval(timer);
  }, [jobIsActive, syncJobStatus]);

  // Compute session-level file stats from events (live, no extra request)
  const sessionFilesFromEvents = useMemo(() => {
    const map = new Map<string, { edits: number; linesAdded: number; linesRemoved: number; isNewFile: boolean }>();
    for (const e of events) {
      if (e.type !== 'job.tool_call') continue;
      const ev = e as unknown as { toolName: string; input: Record<string, unknown> };
      const name = ev.toolName;
      const input = ev.input ?? {};
      if (!/^(write|edit|str_replace_editor|multiedit|multi_edit)$/i.test(name)) continue;
      const fp = ((input.file_path ?? input.path) as string | undefined);
      if (!fp) continue;
      const isWrite = /^write$/i.test(name);
      const isEdit = /^(edit|str_replace_editor)$/i.test(name);
      const existing = map.get(fp) ?? { edits: 0, linesAdded: 0, linesRemoved: 0, isNewFile: isWrite };
      map.set(fp, {
        edits: existing.edits + 1,
        linesAdded: existing.linesAdded + (isWrite ? ((input.content as string) ?? '').split('\n').length : isEdit ? ((input.new_string as string) ?? '').split('\n').length : 0),
        linesRemoved: existing.linesRemoved + (isEdit ? ((input.old_string as string) ?? '').split('\n').length : 0),
        isNewFile: existing.isNewFile,
      });
    }
    return Array.from(map.entries()).map(([path, s]) => ({ path, ...s, lastModifiedTurnIndex: 0 }));
  }, [events]);

  const filesChangedCount = sessionFilesFromEvents.length;

  // Current activity label for composer
  const currentActivity = useMemo(() => {
    if (job?.status !== 'running') return undefined;
    const lastTool = [...events].reverse().find(e => e.type === 'job.tool_call');
    if (!lastTool) return undefined;
    const tc = lastTool as unknown as { toolName: string; input: Record<string, unknown> };
    const fp = ((tc.input.file_path ?? tc.input.path) as string | undefined);
    const name = fp?.split('/').pop();
    if (/^write$/i.test(tc.toolName) && name) return `Writing ${name}…`;
    if (/^(edit|str_replace_editor)$/i.test(tc.toolName) && name) return `Editing ${name}…`;
    if (/^bash$/i.test(tc.toolName)) return `Running: ${((tc.input.command as string) ?? '').slice(0, 30)}…`;
    return undefined;
  }, [events, job?.status]);

  async function handleJobConfigChange(field: 'model' | 'reasoningEffort', value: string) {
    if (field === 'model') setLocalModel(value);
    else setLocalReasoning(value);
    try {
      await api.updateJobConfig(activeJobId, { [field]: value });
    } catch { /* keep local state, show no error — non-critical */ }
  }

  async function handleCancel() {
    setCancelling(true);
    try { await api.cancelJob(activeJobId); setJob(prev => prev ? { ...prev, status: 'cancelled' } : prev); }
    catch { /* ignore */ }
    finally { setCancelling(false); }
  }

  async function handleApprove(approvalId: string, response: string, remember: boolean) {
    setPendingApproval(prev => prev ? { ...prev, resolving: true } : null);
    try { await api.respondToApproval(activeJobId, approvalId, response, remember); }
    catch { setPendingApproval(prev => prev ? { ...prev, resolving: false } : null); }
  }

  async function handleSendTurn(text: string) {
    const result = await api.sendTurn(activeJobId, text);
    if (!result.queued) setJob(prev => prev ? { ...prev, status: 'running' } : prev);
  }

  async function handleEndSession() {
    await api.endJob(activeJobId);
    setJob(prev => prev ? { ...prev, status: 'completed' } : prev);
    setEndConfirm(false);
  }

  async function handleResumeSession() {
    const updatedJob = await api.resumeJob(activeJobId);
    setJob(updatedJob);
    setActiveJobId(activeJobId);
  }

  // Open file panel — first try inline event data, then fetch from bridge
  async function openFile(filePath: string, inlineContent?: string) {
    if (inlineContent != null) {
      setFilePanel({ kind: 'file', path: filePath, content: inlineContent });
      return;
    }
    setFilePanel({ kind: 'file', path: filePath, content: null });
    setFilePanelLoading(true);
    try {
      const result = await api.getJobFiles(job!.id);
      const entry = result.files.find(f => f.path === filePath);
      setFilePanel({ kind: 'file', path: filePath, content: entry?.currentContent ?? null, truncated: entry?.currentContentTruncated });
      setSessionFiles(result.files);
    } catch { /* leave content null */ }
    finally { setFilePanelLoading(false); }
  }

  async function openSessionSummary() {
    if (sessionFiles.length > 0) {
      setFilePanel({ kind: 'session_summary', files: sessionFiles });
      return;
    }
    setFilePanelLoading(true);
    try {
      const result = await api.getJobFiles(job!.id);
      setSessionFiles(result.files);
      setFilePanel({ kind: 'session_summary', files: result.files });
    } catch { /* ignore */ }
    finally { setFilePanelLoading(false); }
  }

  const isActive = job?.status === 'running' || job?.status === 'awaiting_approval';
  const isOpusJob = localModel === 'opus' || job?.model === 'opus';
  const canExecuteWithSonnet =
    job?.agent === 'claude-code' &&
    isOpusJob &&
    (job?.status === 'completed' || job?.status === 'awaiting_user') &&
    !!lastAssistantMessage;

  const [executingWithSonnet, setExecutingWithSonnet] = useState(false);

  async function handleExecuteWithSonnet() {
    if (!job || !lastAssistantMessage || !projectId) return;
    setExecutingWithSonnet(true);
    try {
      const newJob = await api.createJob({
        projectId: job.projectId || projectId,
        prompt: `Execute the following plan:\n\n${lastAssistantMessage}`,
        agent: 'claude-code',
        approvalMode: job.approvalMode as api.ApprovalMode,
        model: 'sonnet',
        reasoningEffort: 'medium',
      });
      navigate('/coding/jobs/' + newJob.id);
    } catch { /* ignore */ }
    finally { setExecutingWithSonnet(false); }
  }

  return (
    <Flex direction="column" h="100%" minH={0}>
      {/* Header */}
      <HStack px="4" py="2.5" borderBottom="1px solid var(--divider)" flexShrink={0} justify="space-between" gap="3">
        <HStack gap="1" color="var(--text-muted)" minW={0} flex="1">
          <Button variant="ghost" size="xs" h="6" px="1" onClick={onBack} color="var(--text-muted)" _hover={{ color: 'var(--text-primary)' }}>
            ← All jobs
          </Button>
          <Text fontSize="12px" flexShrink={0}>/</Text>
          <Text fontSize="13px" fontWeight="500" color="var(--text-primary)" truncate maxW="240px">
            {job?.prompt ?? '…'}
          </Text>
        </HStack>

        {/* Per-job provider (locked) + model + reasoning — same chips as new-job view */}
        {job && (
          <HStack gap="1.5" flexShrink={0} align="center" mb="1">
            <HeaderSelect
              width={130}
              value={job.agent}
              disabled
              onChange={() => undefined}
              options={[
                { value: 'claude-code', label: 'Claude Code' },
                { value: 'codex', label: 'Codex' },
              ]}
            />
            <HeaderSelect
              width={170}
              value={localModel}
              disabled={isActive}
              onChange={v => void handleJobConfigChange('model', v)}
              options={[
                { value: '', label: 'Default model' },
                ...(AGENT_MODELS[job.agent] ?? AGENT_MODELS['claude-code']!),
              ]}
            />
            <HeaderSelect
              width={110}
              value={localReasoning}
              disabled={isActive}
              onChange={v => void handleJobConfigChange('reasoningEffort', v)}
              options={AGENT_EFFORTS[job.agent] ?? AGENT_EFFORTS['claude-code']!}
            />
          </HStack>
        )}

        <HStack gap="2" flexShrink={0} align="center">
          {/* Session metadata subtitle */}
          <HStack gap="1" fontSize="11px" color="var(--text-muted)">
            {job?.turnCount !== undefined && job.turnCount > 0 && (
              <Text>{job.turnCount} turn{job.turnCount !== 1 ? 's' : ''}</Text>
            )}
            {filesChangedCount > 0 && (
              <>
                <Text>·</Text>
                <Button
                  variant="ghost" size="xs" h="4" px="1" fontSize="11px"
                  color="var(--text-muted)"
                  _hover={{ color: 'var(--accent)', bg: 'transparent', textDecoration: 'underline' }}
                  onClick={() => void openSessionSummary()}
                >
                  {filesChangedCount} file{filesChangedCount !== 1 ? 's' : ''}
                </Button>
              </>
            )}
            <CostBadge
              latestCost={latestCost as Extract<JobEvent, { type: 'job.cost_update' }> | null}
              startedAt={job?.startedAt}
            />
            {job && <StatusPill status={job.status} />}
            {job?.approvalMode === 'auto_all' && (
              <Text fontSize="11px" color="var(--status-warning)" fontWeight="500" flexShrink={0}>⚠ unrestricted</Text>
            )}
          </HStack>

          {/* Compact toggle */}
          <Button
            size="xs" h="6" px="2"
            variant={compact ? 'solid' : 'outline'}
            fontSize="10px"
            color={compact ? 'var(--accent-contrast)' : 'var(--text-muted)'}
            bg={compact ? 'var(--accent)' : 'transparent'}
            borderColor="var(--border-subtle)"
            _hover={{ bg: compact ? 'var(--accent-strong)' : 'var(--surface-hover)' }}
            rounded="var(--radius-control)"
            title={compact ? 'Comfortable view' : 'Compact view'}
            onClick={() => {
              const next = !compact;
              setCompact(next);
              localStorage.setItem('coding-compact', String(next));
            }}
          >
            {compact ? '⊡' : '⊟'}
          </Button>

          {/* End / cancel */}
          {endConfirm ? (
            <HStack gap="1">
              <Text fontSize="11px" color="var(--status-warning)">End anyway?</Text>
              <Button size="xs" h="6" px="2" bg="var(--status-danger)" color="white" _hover={{ opacity: 0.85 }} rounded="var(--radius-control)" onClick={() => void handleEndSession()}>Yes, end</Button>
              <Button size="xs" h="6" px="2" variant="ghost" color="var(--text-muted)" _hover={{ bg: 'var(--surface-hover)' }} rounded="var(--radius-control)" onClick={() => setEndConfirm(false)}>Cancel</Button>
            </HStack>
          ) : isActive ? (
            <Button
              size="xs" h="7" px="3"
              variant="outline"
              rounded="var(--radius-control)"
              color="var(--status-danger)"
              borderColor="var(--status-danger)"
              _hover={{ bg: 'var(--surface-danger)' }}
              loading={cancelling}
              onClick={() => {
                if (job?.status === 'running') { setEndConfirm(true); }
                else { void handleCancel(); }
              }}
            >
              {job?.status === 'running' ? 'End session' : 'Cancel'}
            </Button>
          ) : null}
        </HStack>
      </HStack>

      {/* Two-column body: left = final response, right = activity feed */}
      <Flex flex="1" minH={0} overflow="hidden">
        {/* Left column — final markdown response */}
        <Box
          w="38%"
          minH={0}
          borderRight="1px solid var(--divider)"
          display="flex"
          flexDirection="column"
          flexShrink={0}
        >
          <Box px="3" py="2" borderBottom="1px solid var(--divider)" flexShrink={0}>
            <Text fontSize="11px" fontWeight="600" color="var(--text-muted)" textTransform="uppercase" letterSpacing="0.06em">Response</Text>
          </Box>
          <Box flex="1" minH={0} overflow="auto" px="4" py="3">
            {lastAssistantMessage ? (
              <VStack align="stretch" gap="3">
                <MessageRow
                  messageId="last-response"
                  jobId={job?.id ?? ''}
                  text={lastAssistantMessage}
                  isStreaming={job?.status === 'running'}
                />
                {canExecuteWithSonnet && (
                  <Box pt="2" borderTop="1px solid var(--border-subtle)">
                    <Button
                      size="sm" h="8" px="4"
                      bg="var(--accent)" color="var(--accent-contrast)"
                      _hover={{ bg: 'var(--accent-strong)' }}
                      rounded="var(--radius-control)"
                      loading={executingWithSonnet}
                      onClick={() => void handleExecuteWithSonnet()}
                    >
                      ↗ Execute with Sonnet
                    </Button>
                  </Box>
                )}
              </VStack>
            ) : (
              <Text fontSize="13px" color="var(--text-muted)" mt="4" textAlign="center">
                {isActive ? 'Waiting for response…' : 'No response yet.'}
              </Text>
            )}
          </Box>
        </Box>

        {/* Right column — live activity (tool calls, thinking, etc.) */}
        <Box flex="1" minH={0} overflow="hidden" display="flex" flexDirection="column">
          <Box px="3" py="2" borderBottom="1px solid var(--divider)" flexShrink={0}>
            <Text fontSize="11px" fontWeight="600" color="var(--text-muted)" textTransform="uppercase" letterSpacing="0.06em">Activity</Text>
          </Box>
          <JobConversation
            events={events}
            isActive={isActive}
            jobStatus={job?.status}
            compact={compact}
            hideAssistantMessages
            pendingApproval={pendingApproval}
            onApprove={handleApprove}
            jobPrompts={jobPrompts}
            onOpenFile={(fp) => void openFile(fp)}
          />
        </Box>
      </Flex>

      {/* Composer: full width below both columns */}
      <Box flexShrink={0} borderTop="1px solid var(--divider)">
        <JobComposer
          jobStatus={job?.status ?? 'queued'}
          lastAssistantMessage={lastAssistantMessage}
          currentActivity={currentActivity}
          onSendTurn={handleSendTurn}
          onEndSession={handleEndSession}
          onResumeSession={handleResumeSession}
        />
      </Box>

      <FilePanel
        mode={filePanel}
        loading={filePanelLoading}
        onClose={() => setFilePanel(null)}
        onOpenFile={(entry) => void openFile(entry.path)}
      />
    </Flex>
  );
}

type CodingTab = 'jobs' | 'repos' | 'integrations';

function pathToCodingTab(pathname: string): CodingTab {
  if (pathname.startsWith('/coding/repos')) return 'repos';
  if (pathname.startsWith('/coding/integrations')) return 'integrations';
  return 'jobs';
}

function codingTabToPath(tab: CodingTab): string {
  if (tab === 'repos') return '/coding/repos';
  if (tab === 'integrations') return '/coding/integrations';
  return '/coding/jobs';
}

function jobIdFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/coding\/jobs\/([^/]+)$/);
  return m?.[1] ?? null;
}

// ── Main CodingPage ───────────────────────────────────────────────────────────
export function CodingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = pathToCodingTab(location.pathname);

  // Derive initial view from URL
  const jobIdInUrl = jobIdFromPath(location.pathname);
  const [jobsView, setJobsView] = useState<View>(
    jobIdInUrl ? { kind: 'job', projectId: '', jobId: jobIdInUrl } : { kind: 'projects' }
  );
  const [projects, setProjects] = useState<CodingProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // When the URL contains a specific job ID (e.g. from a shared link or browser history),
  // restore the job view. Do NOT reset to 'projects' on /coding/jobs — that would undo a
  // project-detail view reached via the Repos tab.
  useEffect(() => {
    const id = jobIdFromPath(location.pathname);
    if (id) {
      setJobsView(prev => (prev.kind === 'job' && prev.jobId === id) ? prev : { kind: 'job', projectId: '', jobId: id });
    }
  }, [location.pathname]);

  const loadProjects = useCallback((attempt = 0) => {
    setLoadingProjects(true);
    api.listProjects()
      .then(setProjects)
      .catch(() => { if (attempt < 5) setTimeout(() => loadProjects(attempt + 1), 400 * (attempt + 1)); })
      .finally(() => setLoadingProjects(false));
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  return (
    <Tabs.Root
      value={activeTab}
      onValueChange={({ value }) => navigate(codingTabToPath(value as CodingTab))}
      display="flex" flexDirection="column" h="100%" minH={0}
      lazyMount
    >
      <Tabs.List
        px="4" pt="2"
        borderBottom="1px solid var(--divider)"
        flexShrink={0}
        gap="0"
      >
        {(['jobs', 'repos', 'integrations'] as const).map(tab => (
          <Tabs.Trigger
            key={tab}
            value={tab}
            fontSize="13px"
            fontWeight="500"
            px="3"
            py="2"
            color="var(--text-muted)"
            _selected={{ color: 'var(--text-primary)', borderBottom: '2px solid var(--accent)' }}
            _hover={{ color: 'var(--text-primary)', bg: 'var(--surface-hover)' }}
            rounded="var(--radius-control) var(--radius-control) 0 0"
            textTransform="capitalize"
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <Tabs.ContentGroup flex="1" minH={0}>
        <Tabs.Content value="jobs" h="100%" minH={0} pt="0" _open={{ display: 'flex' }} flexDirection="column">
          {jobsView.kind === 'projects' && (
            <AllJobsView
              onSelectJob={(projectId, jobId) => {
                setJobsView({ kind: 'job', projectId, jobId });
                navigate('/coding/jobs/' + jobId);
              }}
            />
          )}
          {jobsView.kind === 'project' && (
            <ProjectDetailView
              projectId={jobsView.projectId}
              onBack={() => { setJobsView({ kind: 'projects' }); navigate('/coding/jobs'); loadProjects(); }}
              onSelectJob={(jobId) => {
                setJobsView({ kind: 'job', projectId: jobsView.projectId, jobId });
                navigate('/coding/jobs/' + jobId);
              }}
            />
          )}
          {jobsView.kind === 'job' && (
            <JobView
              jobId={jobsView.jobId}
              projectId={jobsView.projectId}
              onBack={() => { setJobsView({ kind: 'projects' }); navigate('/coding/jobs'); }}
            />
          )}
        </Tabs.Content>

        <Tabs.Content value="repos" h="100%" minH={0} pt="0" _open={{ display: 'flex' }} flexDirection="column">
          <ProjectsView
            projects={projects}
            loading={loadingProjects}
            onSelectProject={(id) => {
              setJobsView({ kind: 'project', projectId: id });
              navigate('/coding/jobs');
            }}
            onRefresh={loadProjects}
          />
        </Tabs.Content>

        <Tabs.Content value="integrations" h="100%" minH={0} pt="0" _open={{ display: 'block' }}>
          <IntegrationsTab />
        </Tabs.Content>
      </Tabs.ContentGroup>
    </Tabs.Root>
  );
}
