import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Button, Flex, HStack, Input, NativeSelect, Spinner, Text, Textarea, VStack
} from '@chakra-ui/react';
import * as api from '../../lib/coding-api';
import type { CodingProject, CodingJob, AgentIntegration, JobEvent, JobFileSummaryEntry, ApprovalMode } from '../../lib/coding-api';
import { JobConversation } from './coding/JobConversation';
import { JobComposer } from './coding/JobComposer';
import { CostBadge } from './coding/CostBadge';
import { FilePanel } from './coding/FilePanel';
import type { FilePanelMode } from './coding/FilePanel';

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

// ── Integrations strip ──────────────────────────────────────────────────────
function IntegrationsStrip({ onManage }: { onManage: () => void }) {
  const [integrations, setIntegrations] = useState<AgentIntegration[]>([]);

  useEffect(() => {
    const ONE_HOUR = 60 * 60 * 1000;
    api.listIntegrations().then(list => {
      setIntegrations(list);
      // Auto-detect any agent that is unchecked or has stale data (> 1h old)
      for (const agent of list) {
        const stale = agent.authStatus === 'unchecked' || agent.lastCheckedAt === 0 || (Date.now() - agent.lastCheckedAt > ONE_HOUR);
        if (stale) {
          api.detectIntegration(agent.id)
            .then(updated => setIntegrations(prev => prev.map(i => i.id === updated.id ? updated : i)))
            .catch(() => {});
        }
      }
      // Also detect agents not in the list yet (brand-new install, no DB rows)
      const knownIds = new Set(list.map(i => i.id));
      for (const id of ['claude-code', 'codex'] as const) {
        if (!knownIds.has(id)) {
          api.detectIntegration(id)
            .then(updated => setIntegrations(prev => {
              if (prev.some(i => i.id === updated.id)) return prev.map(i => i.id === updated.id ? updated : i);
              return [...prev, updated];
            }))
            .catch(() => {});
        }
      }
    }).catch(() => {});
  }, []);

  function dotColor(r: AgentIntegration) {
    if (!r.installed) return 'var(--status-neutral)';
    if (r.authStatus === 'ok') return 'var(--status-success)';
    if (r.authStatus === 'not_authenticated') return 'var(--status-warning)';
    return 'var(--status-neutral)';
  }

  function label(r: AgentIntegration) {
    const name = r.id === 'claude-code' ? 'Claude Code' : 'Codex';
    if (!r.installed) return `${name} · Not installed`;
    if (r.authStatus === 'ok') return r.account ? `${name} · ${r.account}` : `${name} · Authenticated`;
    if (r.authStatus === 'not_authenticated') return `${name} · Not authenticated`;
    return `${name} · ${r.authStatus}`;
  }

  return (
    <HStack
      px="4" py="2"
      borderBottom="1px solid var(--divider)"
      gap="4"
      flexShrink={0}
      flexWrap="wrap"
    >
      {integrations.map(r => (
        <HStack key={r.id} gap="1.5" align="center">
          <Box w="6px" h="6px" rounded="full" bg={dotColor(r)} flexShrink={0} />
          <Text fontSize="11px" color="var(--text-secondary)">{label(r)}</Text>
        </HStack>
      ))}
      {integrations.length === 0 && (
        <Text fontSize="11px" color="var(--text-muted)">Checking agents…</Text>
      )}
      <Button
        variant="ghost" size="xs" h="5" px="2" ml="auto"
        fontSize="11px" color="var(--text-muted)"
        _hover={{ color: 'var(--text-primary)', bg: 'var(--surface-hover)' }}
        onClick={onManage}
      >
        Manage agents →
      </Button>
    </HStack>
  );
}

// ── Integrations panel (sheet overlay) ─────────────────────────────────────
function IntegrationsPanel({ onClose }: { onClose: () => void }) {
  const [integrations, setIntegrations] = useState<AgentIntegration[]>([]);
  const [checking, setChecking] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectLog, setConnectLog] = useState<Record<string, string[]>>({}); // shared for connect + disconnect
  const termRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => { api.listIntegrations().then(setIntegrations).catch(() => {}); }, []);

  async function refresh(id: string) {
    setChecking(id);
    try {
      const updated = await api.checkIntegration(id);
      setIntegrations(prev => prev.map(i => i.id === id ? updated : i));
    } catch { /* ignore */ }
    finally { setChecking(null); }
  }

  function runAction(id: string, action: 'connect' | 'disconnect') {
    setConnecting(id);
    setConnectLog(prev => ({ ...prev, [id]: [] }));
    const addLine = (line: string) => {
      setConnectLog(prev => {
        const next = { ...prev, [id]: [...(prev[id] ?? []), line] };
        setTimeout(() => {
          const el = termRefs.current[id];
          if (el) el.scrollTop = el.scrollHeight;
        }, 0);
        return next;
      });
    };
    const handler = (event: api.ConnectEvent) => {
      if (event.type === 'connect.status') addLine(`→ ${event.message}`);
      if (event.type === 'connect.output') addLine(event.line);
      if (event.type === 'connect.error') {
        addLine(`✗ ${event.message}`);
        setConnecting(null);
      }
      if (event.type === 'connect.complete') {
        addLine(`✓ ${action === 'disconnect' ? 'Signed out' : 'Done'}`);
        setIntegrations(prev => prev.map(i => i.id === id ? event.integration : i));
        setConnecting(null);
      }
    };
    if (action === 'disconnect') {
      api.disconnectAgent(id, handler);
    } else {
      api.connectAgent(id, handler);
    }
  }

  const names: Record<string, string> = { 'claude-code': 'Claude Code', codex: 'Codex' };
  const docsUrls: Record<string, string> = {
    'claude-code': 'https://docs.anthropic.com/claude-code',
    codex: 'https://github.com/openai/codex'
  };
  const authCmds: Record<string, string> = {
    'claude-code': 'claude auth login --console',
    codex: 'codex auth login'
  };

  const shown = (['claude-code', 'codex'] as const).map(id =>
    integrations.find(i => i.id === id) ?? { id, installed: 0 as const, authStatus: 'unchecked', lastCheckedAt: 0 }
  );

  return (
    <Box
      position="fixed" inset={0} zIndex={100}
      bg="rgba(0,0,0,0.4)"
      display="flex" alignItems="flex-start" justifyContent="flex-end"
      onClick={onClose}
    >
      <Box
        bg="var(--surface-1)"
        borderLeft="1px solid var(--border-subtle)"
        w="440px" maxW="90vw" h="100vh"
        overflow="auto"
        p="5"
        onClick={(e) => e.stopPropagation()}
      >
        <HStack justify="space-between" mb="5">
          <Text fontSize="15px" fontWeight="600" color="var(--text-primary)">Agent integrations</Text>
          <Button variant="ghost" size="xs" onClick={onClose} color="var(--text-muted)">✕</Button>
        </HStack>
        <VStack gap="5" align="stretch">
          {shown.map(r => {
            const isConnecting = connecting === r.id;
            const log = connectLog[r.id] ?? [];
            const isAuthenticated = r.installed && r.authStatus === 'ok';
            return (
              <Box key={r.id} p="4" rounded="var(--radius-card)" border="1px solid var(--border-subtle)" bg="var(--surface-2)">
                <HStack justify="space-between" mb="3">
                  <Text fontSize="14px" fontWeight="600" color="var(--text-primary)">{names[r.id]}</Text>
                  <HStack gap="1.5">
                    <Button
                      size="xs" variant="ghost" h="6" px="2"
                      color="var(--text-muted)" _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
                      loading={checking === r.id}
                      disabled={isConnecting}
                      onClick={() => void refresh(r.id)}
                    >
                      Refresh
                    </Button>
                    {isAuthenticated ? (
                      /* Red Disconnect button — only shown when fully connected */
                      <Button
                        size="xs" h="6" px="3"
                        bg="var(--status-danger-bg)" color="var(--status-danger)"
                        border="1px solid var(--status-danger)"
                        _hover={{ bg: 'var(--surface-danger)' }}
                        rounded="var(--radius-control)"
                        loading={isConnecting}
                        disabled={checking === r.id}
                        onClick={() => runAction(r.id, 'disconnect')}
                      >
                        Disconnect
                      </Button>
                    ) : (
                      /* Connect button — shown when not installed or not authenticated */
                      <Button
                        size="xs" h="6" px="3"
                        bg="var(--accent)" color="var(--accent-contrast)"
                        _hover={{ bg: 'var(--accent-strong)' }}
                        rounded="var(--radius-control)"
                        loading={isConnecting}
                        disabled={checking === r.id}
                        onClick={() => runAction(r.id, 'connect')}
                      >
                        {r.installed ? 'Re-authenticate' : 'Connect'}
                      </Button>
                    )}
                  </HStack>
                </HStack>

                {r.installed ? (
                  <>
                    <Text fontSize="12px" color="var(--status-success)">✓ Installed{r.version ? ` (v${r.version})` : ''}</Text>
                    {isAuthenticated
                      ? <Text fontSize="12px" color="var(--status-success)" mt="1">✓ Authenticated{r.account ? ` as ${r.account}` : ''}</Text>
                      : <Text fontSize="12px" color="var(--status-warning)" mt="1">⚠ {r.authStatus === 'not_authenticated' ? 'Not authenticated — click Re-authenticate' : `Auth: ${r.authStatus}`}</Text>
                    }
                  </>
                ) : (
                  <Text fontSize="12px" color="var(--status-danger)">✗ Not installed — click Connect to install and authenticate</Text>
                )}

                {/* Streaming terminal for connect output */}
                {log.length > 0 && (
                  <Box
                    ref={(el: HTMLDivElement | null) => { termRefs.current[r.id] = el; }}
                    mt="3" p="2" maxH="160px" overflow="auto"
                    bg="hsl(220, 14%, 8%)" rounded="4px"
                    fontFamily="ui-monospace, monospace" fontSize="11px" lineHeight="1.6"
                  >
                    {log.map((line, i) => (
                      <Text key={i} color={line.startsWith('✗') ? 'var(--status-danger)' : line.startsWith('✓') ? 'var(--status-success)' : line.startsWith('→') ? 'var(--text-muted)' : 'var(--text-primary)'} whiteSpace="pre-wrap" wordBreak="break-all">
                        {line}
                      </Text>
                    ))}
                    {isConnecting && <Text color="var(--text-muted)">…</Text>}
                  </Box>
                )}

                {r.lastCheckedAt > 0 && (
                  <Text fontSize="11px" color="var(--text-muted)" mt="2">
                    Last check: <RelativeTime ts={r.lastCheckedAt} />
                  </Text>
                )}

                {/* Auth command for manual fallback */}
                {r.installed && r.authStatus !== 'ok' && (
                  <Box mt="3">
                    <Text fontSize="11px" color="var(--text-muted)" mb="1">Or run manually:</Text>
                    <CopyLine code={authCmds[r.id] ?? ''} />
                  </Box>
                )}

                <Box mt="3">
                  <a href={docsUrls[r.id]} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: 'var(--accent)', display: 'block' }}>
                    Documentation ↗
                  </a>
                </Box>
              </Box>
            );
          })}
        </VStack>
      </Box>
    </Box>
  );
}

function CopyLine({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <HStack gap="2" p="2" bg="var(--surface-3)" rounded="4px">
      <Text fontSize="11px" color="var(--text-primary)" fontFamily="ui-monospace, monospace" flex="1" minW={0} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{code}</Text>
      <Button
        size="xs" variant="ghost" h="5" px="1.5"
        fontSize="10px" color="var(--text-muted)"
        flexShrink={0}
        onClick={() => { void navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
      >
        {copied ? '✓' : 'Copy'}
      </Button>
    </HStack>
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
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [repoPath, setRepoPath] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd() {
    if (!name.trim() || !repoPath.trim()) return;
    setSubmitting(true);
    setAddError(null);
    try {
      await api.createProject(name.trim(), repoPath.trim());
      setName(''); setRepoPath(''); setAdding(false);
      onRefresh();
    } catch (err) {
      setAddError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <VStack align="stretch" h="100%" minH={0} gap="0" px="4" py="4">
      <HStack justify="space-between" mb="4" flexShrink={0}>
        <Text fontSize="15px" fontWeight="600" color="var(--text-primary)">Projects</Text>
        <Button
          size="sm" h="8" px="3"
          bg="var(--accent)" color="var(--accent-contrast)"
          _hover={{ bg: 'var(--accent-strong)' }}
          rounded="var(--radius-control)"
          onClick={() => setAdding(v => !v)}
        >
          {adding ? 'Cancel' : '+ Add project'}
        </Button>
      </HStack>

      {adding && (
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
            <Text fontSize="13px" color="var(--text-muted)">Connect a repo to get started</Text>
            <Button mt="2" size="sm" bg="var(--accent)" color="var(--accent-contrast)" _hover={{ bg: 'var(--accent-strong)' }} rounded="var(--radius-control)" onClick={() => setAdding(true)}>
              Add project
            </Button>
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
                <VStack align="start" gap="0.5" minW={0}>
                  <Text fontSize="14px" fontWeight="500" color="var(--text-primary)" truncate>{p.name}</Text>
                  <Text fontSize="11px" color="var(--text-muted)" fontFamily="ui-monospace, monospace" truncate>{p.repoPath}</Text>
                </VStack>
                <RelativeTime ts={p.updatedAt} />
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
            {/* Status dot */}
            <Box
              w="6px" h="6px" rounded="full" flexShrink={0}
              bg={
                isAwaiting ? 'var(--status-warning)' :
                isRunning ? 'var(--status-success)' :
                job.status === 'failed' || job.status === 'cancelled' ? 'var(--status-danger)' :
                'transparent'
              }
              boxShadow={isRunning ? '0 0 0 2px rgba(34,197,94,0.3)' : undefined}
            />
            <StatusPill status={job.status} />
          </HStack>
          <RelativeTime ts={lastActivity} />
        </VStack>
      </HStack>
    </Box>
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
  const [project, setProject] = useState<CodingProject | null>(null);
  const [jobs, setJobs] = useState<CodingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [integrations, setIntegrations] = useState<api.AgentIntegration[]>([]);
  const [focusedIdx, setFocusedIdx] = useState<number>(-1);
  const listRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback((attempt = 0) => {
    setLoading(true);
    Promise.all([
      api.getProject(projectId),
      api.listIntegrations()
    ]).then(([data, intgs]) => {
      setProject(data.project);
      setJobs(data.jobs);
      setIntegrations(intgs);
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
                  <option value="auto_safe">Auto-safe</option>
                  <option value="auto_all">Auto-all</option>
                  <option value="manual">Manual</option>
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

      {newJobOpen && project && (
        <NewJobForm
          project={project}
          integrations={integrations}
          onCancel={() => setNewJobOpen(false)}
          onCreated={(job) => { setNewJobOpen(false); load(); onSelectJob(job.id); }}
        />
      )}

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

// ── New job form ─────────────────────────────────────────────────────────────
function NewJobForm({
  project,
  integrations,
  onCancel,
  onCreated
}: {
  project: CodingProject;
  integrations: api.AgentIntegration[];
  onCancel: () => void;
  onCreated: (job: CodingJob) => void;
}) {
  const [prompt, setPrompt] = useState('');
  const [agent, setAgent] = useState<string>('claude-code');
  // Pre-fill from project default; user can override per-job
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>(project.defaultApprovalMode ?? 'auto_safe');
  const [bypassPermissions, setBypassPermissions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Bypass checkbox forces auto_all and locks the dropdown
  const effectiveMode: ApprovalMode = bypassPermissions ? 'auto_all' : approvalMode;

  const usableAgents = (['claude-code', 'codex'] as const).filter(id => {
    const intg = integrations.find(i => i.id === id);
    return !intg || intg.installed;
  });
  const noAgents = usableAgents.length === 0;

  async function handleCreate() {
    if (!prompt.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const job = await api.createJob({
        projectId: project.id,
        prompt: prompt.trim(),
        agent,
        approvalMode: effectiveMode,
        confirmAutoAll: effectiveMode === 'auto_all' ? true : undefined
      });
      onCreated(job);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box mb="4" p="4" rounded="var(--radius-card)" border="1px solid var(--border-subtle)" bg="var(--surface-2)" flexShrink={0}>
      <VStack align="stretch" gap="3">
        <Text fontSize="13px" fontWeight="600" color="var(--text-primary)">New job in {project.name}</Text>
        {noAgents && (
          <Text fontSize="12px" color="var(--status-danger)">No agents are installed. Set up Claude Code or Codex in Manage agents.</Text>
        )}
        <Textarea
          placeholder="Describe what you want Hermes to code…"
          value={prompt}
          onChange={e => setPrompt(e.currentTarget.value)}
          rows={4}
          bg="var(--surface-3)" border="1px solid var(--border-subtle)"
          rounded="var(--radius-control)" fontSize="13px"
          resize="vertical"
          disabled={noAgents}
        />
        <HStack gap="3">
          <Box flex="1">
            <Text fontSize="11px" color="var(--text-muted)" mb="1">Agent</Text>
            <NativeSelect.Root size="sm" bg="var(--surface-3)" disabled={noAgents}>
              <NativeSelect.Field value={agent} onChange={e => setAgent(e.currentTarget.value)}>
                <option value="claude-code" disabled={!usableAgents.includes('claude-code')}>
                  Claude Code{!usableAgents.includes('claude-code') ? ' (not installed)' : ''}
                </option>
                <option value="codex" disabled={!usableAgents.includes('codex')}>
                  Codex{!usableAgents.includes('codex') ? ' (not installed)' : ''}
                </option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Box>
          <Box flex="1">
            <Text fontSize="11px" color="var(--text-muted)" mb="1">Approval mode</Text>
            <NativeSelect.Root size="sm" bg="var(--surface-3)" disabled={noAgents || bypassPermissions}>
              <NativeSelect.Field
                value={effectiveMode}
                onChange={e => setApprovalMode(e.currentTarget.value as ApprovalMode)}
                opacity={bypassPermissions ? 0.5 : 1}
              >
                <option value="auto_safe">Auto-safe (edits only)</option>
                <option value="auto_all">Auto-all (all actions)</option>
                <option value="manual">Manual approval</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Box>
        </HStack>
        {/* Bypass permissions checkbox */}
        <Box p="3" rounded="var(--radius-control)" bg="var(--surface-2)" border="1px solid var(--border-subtle)">
          <HStack gap="2" align="flex-start">
            <input
              type="checkbox"
              id="bypass-permissions"
              checked={bypassPermissions}
              disabled={noAgents}
              onChange={e => setBypassPermissions(e.target.checked)}
              style={{ marginTop: '2px', flexShrink: 0 }}
            />
            <VStack align="start" gap="0.5">
              <label htmlFor="bypass-permissions" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}>
                Bypass all approval prompts (--bypassPermissions)
              </label>
              <Text fontSize="11px" color="var(--text-muted)">
                Runs any command without asking. Use only in isolated test environments.
              </Text>
            </VStack>
          </HStack>
          {bypassPermissions && (
            <Box mt="2" pl="5">
              <Text fontSize="11px" color="var(--status-warning)">
                ⚠ This job runs in {project.repoPath} directly with no isolation (worktrees ship in Phase 3).
              </Text>
            </Box>
          )}
        </Box>
        {effectiveMode === 'auto_all' && !bypassPermissions && (
          <Box p="3" rounded="var(--radius-control)" bg="var(--surface-warning)" border="1px solid var(--status-warning)">
            <Text fontSize="12px" color="var(--status-warning)" fontWeight="600" mb="1">⚠ Direct repo modification</Text>
            <Text fontSize="12px" color="var(--text-secondary)">
              Without worktree isolation (Phase 3), this job will edit {project.repoPath} directly.
              Commit any work in progress before proceeding.
            </Text>
          </Box>
        )}
        {error && <Text fontSize="12px" color="var(--status-danger)">{error}</Text>}
        <HStack gap="2" justify="flex-end">
          <Button variant="ghost" size="sm" h="8" px="3" onClick={onCancel} color="var(--text-muted)">Cancel</Button>
          <Button
            size="sm" h="8" px="3"
            bg="var(--accent)" color="var(--accent-contrast)"
            _hover={{ bg: 'var(--accent-strong)' }}
            rounded="var(--radius-control)"
            loading={submitting}
            disabled={noAgents || !prompt.trim()}
            onClick={() => void handleCreate()}
          >
            Start job
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}

// ── Job view ─────────────────────────────────────────────────────────────────
function JobView({
  jobId,
  projectId: _projectId,
  onBack
}: {
  jobId: string;
  projectId: string;
  onBack: () => void;
}) {
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
  const [jobPrompts] = useState<Map<string, string>>(new Map());
  const [compact, setCompact] = useState(() => localStorage.getItem('coding-compact') === 'true');
  const [filePanel, setFilePanel] = useState<FilePanelMode | null>(null);
  const [filePanelLoading, setFilePanelLoading] = useState(false);
  const [sessionFiles, setSessionFiles] = useState<JobFileSummaryEntry[]>([]);

  // Load initial history
  useEffect(() => {
    let cancelled = false;
    const load = (attempt = 0) => {
      api.getJobWithEvents(jobId)
        .then(({ job: j, events: evts }) => {
          if (cancelled) return;
          setJob(j);
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

  const syncJobStatus = useCallback(() => {
    api.getJob(activeJobId).then(j => {
      setJob(prev => {
        if (!prev) return j;
        const terminal = ['completed', 'failed', 'cancelled', 'interrupted'];
        if (prev.status !== j.status && terminal.includes(j.status)) return { ...prev, status: j.status, agentSessionId: j.agentSessionId ?? prev.agentSessionId };
        if (!prev.agentSessionId && j.agentSessionId) return { ...prev, agentSessionId: j.agentSessionId };
        if (!prev.sessionId && j.sessionId) return { ...prev, sessionId: j.sessionId };
        return prev;
      });
    }).catch(() => {});
  }, [activeJobId]);

  useEffect(() => {
    const unsubscribe = api.subscribeToJobEvents(activeJobId, (event) => {
      setEvents(prev => [...prev, event]);
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
    }, syncJobStatus);
    return unsubscribe;
  }, [activeJobId, syncJobStatus]);

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

  return (
    <Flex direction="column" h="100%" minH={0}>
      {/* Header */}
      <HStack px="4" py="2.5" borderBottom="1px solid var(--divider)" flexShrink={0} justify="space-between" gap="3">
        <HStack gap="1" color="var(--text-muted)" minW={0} flex="1">
          <Button variant="ghost" size="xs" h="6" px="1" onClick={onBack} color="var(--text-muted)" _hover={{ color: 'var(--text-primary)' }}>
            ← Project
          </Button>
          <Text fontSize="12px" flexShrink={0}>/</Text>
          <Text fontSize="13px" fontWeight="500" color="var(--text-primary)" truncate maxW="320px">
            {job?.prompt ?? '…'}
          </Text>
        </HStack>
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
              <Text fontSize="11px" color="var(--status-warning)" fontWeight="500" flexShrink={0}>⚠ bypass mode</Text>
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

      <JobConversation
        events={events}
        isActive={isActive}
        jobStatus={job?.status}
        compact={compact}
        pendingApproval={pendingApproval}
        onApprove={handleApprove}
        jobPrompts={jobPrompts}
        onOpenFile={(fp) => void openFile(fp)}
        composerSlot={
          <JobComposer
            jobStatus={job?.status ?? 'queued'}
            lastAssistantMessage={lastAssistantMessage}
            currentActivity={currentActivity}
            onSendTurn={handleSendTurn}
            onEndSession={handleEndSession}
            onResumeSession={handleResumeSession}
          />
        }
      />

      <FilePanel
        mode={filePanel}
        loading={filePanelLoading}
        onClose={() => setFilePanel(null)}
        onOpenFile={(entry) => void openFile(entry.path)}
      />
    </Flex>
  );
}

// ── Main CodingPage ───────────────────────────────────────────────────────────
export function CodingPage() {
  const [view, setView] = useState<View>({ kind: 'projects' });
  const [projects, setProjects] = useState<CodingProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);

  const loadProjects = useCallback((attempt = 0) => {
    setLoadingProjects(true);
    api.listProjects()
      .then(setProjects)
      .catch(() => { if (attempt < 5) setTimeout(() => loadProjects(attempt + 1), 400 * (attempt + 1)); })
      .finally(() => setLoadingProjects(false));
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  return (
    <Flex direction="column" h="100%" minH={0}>
      <IntegrationsStrip onManage={() => setPanelOpen(true)} />

      <Box flex="1" minH={0}>
        {view.kind === 'projects' && (
          <ProjectsView
            projects={projects}
            loading={loadingProjects}
            onSelectProject={(id) => setView({ kind: 'project', projectId: id })}
            onRefresh={loadProjects}
          />
        )}
        {view.kind === 'project' && (
          <ProjectDetailView
            projectId={view.projectId}
            onBack={() => { setView({ kind: 'projects' }); loadProjects(); }}
            onSelectJob={(jobId) => setView({ kind: 'job', projectId: view.projectId, jobId })}
          />
        )}
        {view.kind === 'job' && (
          <JobView
            jobId={view.jobId}
            projectId={view.projectId}
            onBack={() => setView({ kind: 'project', projectId: view.projectId })}
          />
        )}
      </Box>

      {panelOpen && <IntegrationsPanel onClose={() => setPanelOpen(false)} />}
    </Flex>
  );
}
