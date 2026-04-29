import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Button, Drawer, HStack, Spinner, Text, VStack
} from '@chakra-ui/react';
import { useCodingIntegrations } from '../../../hooks/use-coding-integrations';
import { ProviderLogo } from '../../atoms/ProviderLogo';
import * as api from '../../../lib/coding-api';
import type { AgentIntegration, ConnectEvent } from '../../../lib/coding-api';

const AGENT_NAMES: Record<string, string> = {
  'claude-code': 'Claude Code',
  codex: 'Codex',
};

// Agents that are fully supported. Others show a "Coming soon" card.
const SUPPORTED_AGENTS = new Set(['claude-code']);

const INSTALL_CMDS: Record<string, string> = {
  'claude-code': 'npm install -g @anthropic-ai/claude-code',
  codex: 'npm install -g @openai/codex',
};

const AUTH_CMDS: Record<string, string> = {
  'claude-code': 'claude auth login',
  codex: 'codex login',
};

const DOCS_URLS: Record<string, string> = {
  'claude-code': 'https://docs.anthropic.com/claude-code',
  codex: 'https://github.com/openai/codex',
};

function semverNewer(installed: string, latest: string): boolean {
  const p = (v: string) => v.replace(/[^0-9.]/g, '').split('.').map(Number);
  const a = p(installed);
  const b = p(latest);
  for (let i = 0; i < 3; i++) {
    if ((b[i] ?? 0) > (a[i] ?? 0)) return true;
    if ((b[i] ?? 0) < (a[i] ?? 0)) return false;
  }
  return false;
}

function hasUpdate(integration: AgentIntegration): boolean {
  return !!(
    integration.version &&
    integration.latestVersion &&
    semverNewer(integration.version, integration.latestVersion)
  );
}

// ── CopyLine ─────────────────────────────────────────────────────────────────

function CopyLine({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <HStack
      gap="2" px="3" py="2.5"
      bg="hsl(220,14%,8%)" rounded="6px"
      border="1px solid var(--border-subtle)"
    >
      <Text
        flex="1" fontSize="12px" fontFamily="ui-monospace,monospace"
        color="hsl(220,8%,80%)" minW={0}
        overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap"
      >
        {code}
      </Text>
      <Button
        size="xs" variant="ghost" h="5" px="2" fontSize="10px" flexShrink={0}
        color={copied ? 'var(--status-success)' : 'var(--text-muted)'}
        _hover={{ color: 'var(--text-primary)' }}
        onClick={() => {
          void navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
      >
        {copied ? '✓' : 'Copy'}
      </Button>
    </HStack>
  );
}

// ── StreamTerminal ────────────────────────────────────────────────────────────

function StreamTerminal({ lines, running }: { lines: string[]; running: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines]);

  if (lines.length === 0 && !running) return null;

  return (
    <Box
      ref={ref}
      maxH="160px" overflow="auto"
      bg="hsl(220,14%,7%)" rounded="6px" p="3"
      fontFamily="ui-monospace,monospace" fontSize="11px" lineHeight="1.7"
      border="1px solid var(--border-subtle)"
    >
      {lines.map((line, i) => (
        <Text
          key={i}
          color={
            line.startsWith('✗') ? 'hsl(0,65%,60%)' :
            line.startsWith('✓') ? 'var(--status-success)' :
            line.startsWith('→') ? 'var(--accent)' :
            'hsl(220,8%,60%)'
          }
          whiteSpace="pre-wrap" wordBreak="break-all"
        >
          {line}
        </Text>
      ))}
      {running && (
        <HStack gap="1.5" mt="0.5">
          <Spinner size="xs" color="hsl(220,8%,40%)" />
          <Text color="hsl(220,8%,40%)">running…</Text>
        </HStack>
      )}
    </Box>
  );
}

// ── StepBar ───────────────────────────────────────────────────────────────────

function StepBar({ steps, current }: { steps: string[]; current: number }) {
  return (
    <HStack gap="0" mb="7" w="full" align="flex-start">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={label}>
            <VStack gap="1.5" align="center" flexShrink={0} minW="56px">
              <Box
                w="26px" h="26px" rounded="full"
                display="flex" alignItems="center" justifyContent="center"
                bg={done ? 'var(--status-success)' : active ? 'var(--accent)' : 'var(--surface-3)'}
                border={done || active ? 'none' : '1px solid var(--border-subtle)'}
                transition="background 0.2s"
              >
                <Text
                  fontSize="11px" fontWeight="700" lineHeight="1"
                  color={done || active ? 'white' : 'var(--text-muted)'}
                >
                  {done ? '✓' : String(i + 1)}
                </Text>
              </Box>
              <Text
                fontSize="10px"
                fontWeight={active ? '600' : '400'}
                color={active ? 'var(--text-primary)' : 'var(--text-muted)'}
                whiteSpace="nowrap"
                textAlign="center"
              >
                {label}
              </Text>
            </VStack>

            {i < steps.length - 1 && (
              <Box
                flex="1" h="1px" mt="12px"
                bg={i < current ? 'var(--status-success)' : 'var(--border-subtle)'}
                transition="background 0.2s"
              />
            )}
          </React.Fragment>
        );
      })}
    </HStack>
  );
}

// ── IntegrationDrawer ─────────────────────────────────────────────────────────

type DrawerMode = 'connect' | 'manage';

interface IntegrationDrawerProps {
  agentId: string;
  mode: DrawerMode;
  initialStep: number;
  integration: AgentIntegration;
  onClose: () => void;
  onUpdated: (updated: AgentIntegration) => void;
}

function IntegrationDrawer({ agentId, mode, initialStep, integration, onClose, onUpdated }: IntegrationDrawerProps) {
  const name = AGENT_NAMES[agentId] ?? agentId;

  const connectSteps: string[] = [];
  if (mode === 'connect') {
    if (!integration.installed) connectSteps.push('Install');
    connectSteps.push('Sign in', 'Done');
  }

  const steps = mode === 'connect' ? connectSteps : ['Status', 'Update', 'Settings'];
  const clampedInitial = Math.max(0, Math.min(initialStep, steps.length - 1));

  const [stepIdx, setStepIdx] = useState(clampedInitial);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [streamLines, setStreamLines] = useState<string[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [liveIntegration, setLiveIntegration] = useState<AgentIntegration>(integration);
  const stopRef = useRef<(() => void) | null>(null);

  // Sync external integration changes (e.g. on re-detect)
  useEffect(() => { setLiveIntegration(integration); }, [integration]);

  function addLine(line: string) {
    setStreamLines(prev => [...prev, line]);
  }

  function clearStream() {
    setStreamLines([]);
    setVerifyError(null);
  }

  function runStream(action: 'connect' | 'update', onComplete?: () => void) {
    if (streaming) return;
    clearStream();
    setStreaming(true);
    const fn = action === 'update' ? api.updateAgent : api.connectAgent;
    const stop = fn(agentId, (event: ConnectEvent) => {
      if (event.type === 'connect.status') addLine(`→ ${event.message}`);
      if (event.type === 'connect.output') addLine(event.line);
      if (event.type === 'connect.error') {
        addLine(`✗ ${event.message}`);
        setStreaming(false);
      }
      if (event.type === 'connect.complete') {
        addLine('✓ Done');
        setLiveIntegration(event.integration);
        onUpdated(event.integration);
        setStreaming(false);
        onComplete?.();
      }
    });
    stopRef.current = stop;
  }

  async function verifyStep(): Promise<boolean> {
    setVerifyError(null);
    setVerifying(true);
    try {
      const label = steps[stepIdx];
      if (label === 'Install') {
        const updated = await api.detectIntegration(agentId);
        if (!updated.installed) {
          setVerifyError(`${name} not detected on PATH. Try a new terminal session, then click again.`);
          return false;
        }
        setLiveIntegration(updated);
        onUpdated(updated);
      } else if (label === 'Sign in') {
        const updated = await api.checkIntegration(agentId);
        if (updated.authStatus !== 'ok') {
          const detail = updated.authMessage ? ` — ${updated.authMessage}` : '';
          setVerifyError(`Not yet authenticated${detail}. Complete sign-in and try again.`);
          return false;
        }
        setLiveIntegration(updated);
        onUpdated(updated);
      }
      return true;
    } catch {
      setVerifyError('Check failed. Please try again.');
      return false;
    } finally {
      setVerifying(false);
    }
  }

  async function handleNext() {
    if (stepIdx >= steps.length - 1) { onClose(); return; }
    const label = steps[stepIdx];
    const needsVerify = label === 'Install' || label === 'Sign in';
    if (needsVerify) {
      const ok = await verifyStep();
      if (!ok) return;
    }
    clearStream();
    setStepIdx(i => i + 1);
  }

  function handleBack() {
    clearStream();
    setStepIdx(i => i - 1);
  }

  const isLastStep = stepIdx >= steps.length - 1;
  const currentLabel = steps[stepIdx] ?? '';

  const nextLabel =
    isLastStep ? 'Done' :
    currentLabel === 'Install' ? 'Verify installation →' :
    currentLabel === 'Sign in' ? 'Verify sign-in →' :
    'Next →';

  // ── Step renders ────────────────────────────────────────────────────────────

  function renderInstall() {
    return (
      <VStack align="stretch" gap="4">
        <Text fontSize="13px" color="var(--text-secondary)">
          {name} runs as a CLI on your machine. Install it via npm (requires Node.js 18+):
        </Text>
        <CopyLine code={INSTALL_CMDS[agentId] ?? ''} />
        <Text fontSize="12px" color="var(--text-muted)">
          Once installed, click &ldquo;Verify installation&rdquo; below to confirm it was found on your PATH.
          Or let the app install it in the background:
        </Text>
        <Button
          size="sm" variant="outline" alignSelf="start"
          color="var(--text-secondary)" borderColor="var(--border-subtle)"
          _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
          disabled={streaming}
          loading={streaming}
          onClick={() => runStream('connect')}
        >
          Auto-install in background
        </Button>
        <StreamTerminal lines={streamLines} running={streaming} />
        {verifyError && <ErrorBox message={verifyError} />}
      </VStack>
    );
  }

  function renderSignIn() {
    return (
      <VStack align="stretch" gap="4">
        <Text fontSize="13px" color="var(--text-secondary)">
          Run this in your terminal to authenticate {name}:
        </Text>
        <CopyLine code={AUTH_CMDS[agentId] ?? ''} />
        <Text fontSize="12px" color="var(--text-muted)">
          This opens a browser window. Complete sign-in there, then return here and click &ldquo;Verify sign-in&rdquo;.
          Or launch it directly from here:
        </Text>
        <Button
          size="sm" variant="outline" alignSelf="start"
          color="var(--text-secondary)" borderColor="var(--border-subtle)"
          _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
          disabled={streaming}
          loading={streaming}
          onClick={() => runStream('connect')}
        >
          Launch sign-in from here
        </Button>
        <StreamTerminal lines={streamLines} running={streaming} />
        {verifyError && <ErrorBox message={verifyError} />}
      </VStack>
    );
  }

  function renderDone() {
    return (
      <VStack align="center" gap="3" py="6">
        <Text fontSize="32px">✓</Text>
        <Text fontSize="15px" fontWeight="600" color="var(--status-success)">
          {name} is ready
        </Text>
        {liveIntegration.account && (
          <Text fontSize="13px" color="var(--text-secondary)">
            Signed in as {liveIntegration.account}
          </Text>
        )}
        {liveIntegration.version && (
          <Text fontSize="12px" color="var(--text-muted)">Version {liveIntegration.version}</Text>
        )}
      </VStack>
    );
  }

  function renderStatus() {
    const isOk = liveIntegration.installed === 1 && liveIntegration.authStatus === 'ok';
    const rows = [
      {
        ok: liveIntegration.installed === 1,
        label: liveIntegration.installed === 1
          ? `Installed${liveIntegration.version ? ` · v${liveIntegration.version}` : ''}`
          : 'Not installed',
      },
      {
        ok: liveIntegration.authStatus === 'ok',
        label: liveIntegration.authStatus === 'ok'
          ? (liveIntegration.account ? `Signed in as ${liveIntegration.account}` : 'Authenticated')
          : 'Not signed in',
      },
      {
        ok: liveIntegration.enabled !== 0,
        label: liveIntegration.enabled !== 0 ? 'Enabled in this app' : 'Disabled in this app',
      },
    ];

    return (
      <VStack align="stretch" gap="4">
        <VStack align="stretch" gap="2.5">
          {rows.map(({ ok, label }) => (
            <HStack key={label} gap="2.5">
              <Box
                w="7px" h="7px" rounded="full" flexShrink={0}
                mt="1px"
                bg={ok ? 'var(--status-success)' : 'var(--status-warning)'}
              />
              <Text fontSize="13px" color={ok ? 'var(--text-secondary)' : 'var(--status-warning)'}>
                {label}
              </Text>
            </HStack>
          ))}
        </VStack>

        {!isOk && liveIntegration.lastDiagnostic && (
          <Box p="3" rounded="6px" bg="var(--surface-3)" border="1px solid var(--border-subtle)">
            <Text fontSize="11px" color="var(--text-muted)" fontFamily="ui-monospace,monospace">
              {liveIntegration.lastDiagnostic}
            </Text>
          </Box>
        )}

        <Button
          size="sm" variant="outline" alignSelf="start"
          color="var(--text-secondary)" borderColor="var(--border-subtle)"
          _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
          loading={verifying}
          onClick={async () => {
            setVerifying(true);
            try {
              const updated = await api.checkIntegration(agentId);
              setLiveIntegration(updated);
              onUpdated(updated);
            } finally {
              setVerifying(false);
            }
          }}
        >
          Refresh status
        </Button>

        <Box>
          <a
            href={DOCS_URLS[agentId]}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '12px', color: 'var(--accent)' }}
          >
            Documentation ↗
          </a>
        </Box>
      </VStack>
    );
  }

  function renderUpdate() {
    const updateReady = hasUpdate(liveIntegration);
    if (!updateReady) {
      return (
        <VStack align="center" gap="3" py="6">
          <Text fontSize="28px">✓</Text>
          <Text fontSize="14px" fontWeight="500" color="var(--text-secondary)">
            {liveIntegration.version ? `v${liveIntegration.version} — up to date` : 'Up to date'}
          </Text>
          {liveIntegration.latestVersion && (
            <Text fontSize="12px" color="var(--text-muted)">
              Latest: v{liveIntegration.latestVersion}
            </Text>
          )}
        </VStack>
      );
    }

    return (
      <VStack align="stretch" gap="4">
        <HStack
          gap="3" p="3" rounded="8px"
          bg="rgba(99,102,241,0.08)"
          border="1px solid rgba(99,102,241,0.35)"
        >
          <Text fontSize="22px" lineHeight="1">↑</Text>
          <VStack align="start" gap="0.5">
            <Text fontSize="13px" fontWeight="600" color="var(--text-primary)">Update available</Text>
            <Text fontSize="12px" color="var(--text-secondary)">
              {liveIntegration.version} → {liveIntegration.latestVersion}
            </Text>
          </VStack>
        </HStack>

        <Text fontSize="13px" color="var(--text-secondary)">Run to update:</Text>
        <CopyLine code={INSTALL_CMDS[agentId] ?? ''} />

        <Button
          size="sm" alignSelf="start"
          bg="var(--accent)" color="var(--accent-contrast)"
          _hover={{ bg: 'var(--accent-strong)' }}
          disabled={streaming}
          loading={streaming}
          onClick={() =>
            runStream('update', () => {
              setTimeout(() => setStepIdx(i => Math.min(i + 1, steps.length - 1)), 700);
            })
          }
        >
          Run update
        </Button>

        <StreamTerminal lines={streamLines} running={streaming} />
      </VStack>
    );
  }

  function renderStep() {
    switch (currentLabel) {
      case 'Install': return renderInstall();
      case 'Sign in': return renderSignIn();
      case 'Done': return renderDone();
      case 'Status': return renderStatus();
      case 'Update': return renderUpdate();
      default: return null;
    }
  }

  return (
    <Drawer.Root
      open
      lazyMount
      unmountOnExit
      onOpenChange={(e) => { if (!e.open) onClose(); }}
      size={{ base: 'full', md: 'md' }}
    >
      <Drawer.Backdrop backdropFilter="auto" backdropBlur="sm" bg="blackAlpha.500" />
      <Drawer.Positioner>
        <Drawer.Content bg="var(--surface-elevated)" borderLeft="1px solid var(--border-subtle)">

          <Drawer.Header borderBottom="1px solid var(--border-subtle)" pb="5">
            <VStack align="center" gap="2" w="full" pt="2">
              <ProviderLogo providerId={agentId} size={52} />
              <Drawer.Title fontSize="16px" fontWeight="600" color="var(--text-primary)">
                {name}
              </Drawer.Title>
              <Text fontSize="12px" color="var(--text-muted)">
                {mode === 'connect' ? 'Connect agent' : 'Manage agent'}
              </Text>
            </VStack>
          </Drawer.Header>

          <Drawer.Body overflowY="auto" pt="6">
            {steps.length > 1 && <StepBar steps={steps} current={stepIdx} />}
            {currentLabel === 'Settings' ? (
              <SettingsStep
                agentId={agentId}
                name={name}
                liveIntegration={liveIntegration}
                onUpdated={(u) => { setLiveIntegration(u); onUpdated(u); }}
              />
            ) : renderStep()}
          </Drawer.Body>

          <Drawer.Footer borderTop="1px solid var(--border-subtle)" pt="4">
            <HStack w="full" justify="space-between">
              {stepIdx > 0 ? (
                <Button
                  size="sm" variant="ghost"
                  color="var(--text-muted)"
                  _hover={{ color: 'var(--text-primary)', bg: 'var(--surface-hover)' }}
                  onClick={handleBack}
                >
                  ← Back
                </Button>
              ) : (
                <Button
                  size="sm" variant="ghost"
                  color="var(--text-muted)"
                  _hover={{ color: 'var(--text-primary)', bg: 'var(--surface-hover)' }}
                  onClick={onClose}
                >
                  Cancel
                </Button>
              )}

              <Button
                size="sm"
                bg={isLastStep ? 'var(--surface-3)' : 'var(--accent)'}
                color={isLastStep ? 'var(--text-secondary)' : 'var(--accent-contrast)'}
                _hover={{ bg: isLastStep ? 'var(--surface-hover)' : 'var(--accent-strong)' }}
                loading={verifying}
                disabled={streaming}
                onClick={handleNext}
              >
                {nextLabel}
              </Button>
            </HStack>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
}

// ── ErrorBox ──────────────────────────────────────────────────────────────────

function ErrorBox({ message }: { message: string }) {
  return (
    <Box p="3" rounded="6px" bg="rgba(220,38,38,0.08)" border="1px solid rgba(220,38,38,0.25)">
      <Text fontSize="12px" color="var(--status-danger)">{message}</Text>
    </Box>
  );
}

// ── SettingsStep — self-contained to avoid stale closure issues ───────────────

function SettingsStep({
  agentId, name, liveIntegration, onUpdated,
}: {
  agentId: string;
  name: string;
  liveIntegration: AgentIntegration;
  onUpdated: (u: AgentIntegration) => void;
}) {
  const [lines, setLines] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  function addLine(l: string) { setLines(prev => [...prev, l]); }

  function doSignOut() {
    setConfirmSignOut(false);
    setLines([]);
    setRunning(true);
    const stop = api.deleteAgent(agentId, (event: ConnectEvent) => {
      if (event.type === 'connect.status') addLine(`→ ${event.message}`);
      if (event.type === 'connect.output') addLine(event.line);
      if (event.type === 'connect.error') { addLine(`✗ ${event.message}`); setRunning(false); }
      if (event.type === 'connect.complete') {
        addLine('✓ Signed out');
        onUpdated(event.integration);
        setRunning(false);
      }
    });
    stopRef.current = stop;
  }

  return (
    <VStack align="stretch" gap="5">
      <HStack gap="3" p="3" rounded="8px" bg="var(--surface-3)" border="1px solid var(--border-subtle)">
        <Box flex="1">
          <Text fontSize="13px" fontWeight="500" color="var(--text-primary)">Enable in this app</Text>
          <Text fontSize="11px" color="var(--text-muted)" mt="0.5">
            {liveIntegration.enabled !== 0
              ? 'Selectable when creating coding jobs'
              : 'Hidden from the job creation form'}
          </Text>
        </Box>
        <Button
          size="xs" h="7" px="3" rounded="var(--radius-control)"
          bg={liveIntegration.enabled !== 0 ? 'var(--accent)' : 'var(--surface-hover)'}
          color={liveIntegration.enabled !== 0 ? 'var(--accent-contrast)' : 'var(--text-secondary)'}
          _hover={{ opacity: 0.85 }}
          onClick={async () => {
            const fn = liveIntegration.enabled !== 0 ? api.disableAgent : api.enableAgent;
            try { const u = await fn(agentId); onUpdated(u); } catch { /* ignore */ }
          }}
        >
          {liveIntegration.enabled !== 0 ? 'Enabled' : 'Disabled'}
        </Button>
      </HStack>

      <Box borderTop="1px solid var(--border-subtle)" pt="4">
        <Text fontSize="12px" color="var(--text-muted)" mb="3">Danger zone</Text>
        {!confirmSignOut ? (
          <Button
            size="sm" variant="outline"
            color="var(--status-danger)"
            borderColor="rgba(220,38,38,0.3)"
            _hover={{ bg: 'rgba(220,38,38,0.07)', borderColor: 'var(--status-danger)' }}
            disabled={running}
            onClick={() => setConfirmSignOut(true)}
          >
            Sign out of {name}
          </Button>
        ) : (
          <HStack gap="2">
            <Button
              size="sm" bg="var(--status-danger)" color="white"
              _hover={{ opacity: 0.85 }}
              loading={running}
              onClick={doSignOut}
            >
              Confirm sign-out
            </Button>
            <Button
              size="sm" variant="ghost" color="var(--text-muted)"
              onClick={() => setConfirmSignOut(false)}
            >
              Cancel
            </Button>
          </HStack>
        )}
        <Box mt="3">
          <StreamTerminal lines={lines} running={running} />
        </Box>
      </Box>
    </VStack>
  );
}


// ── IntegrationCard ───────────────────────────────────────────────────────────

function IntegrationCard({
  integration,
  onConnect,
  onManage,
}: {
  integration: AgentIntegration;
  onConnect: () => void;
  onManage: (initialStep?: number) => void;
}) {
  const supported = SUPPORTED_AGENTS.has(integration.id);
  const isConnected = supported && integration.installed === 1 && integration.authStatus === 'ok' && integration.enabled !== 0;
  const updateReady = supported && hasUpdate(integration);
  const name = AGENT_NAMES[integration.id] ?? integration.id;

  const ctaLabel =
    isConnected ? 'Manage' :
    integration.installed === 1 ? 'Sign in' :
    'Connect';

  const ctaAction = isConnected ? () => onManage(0) : onConnect;

  return (
    <>
      {updateReady && (
        <style>{`
          @keyframes _update-glow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.35); }
            50%       { box-shadow: 0 0 10px 3px rgba(99,102,241,0.55); }
          }
        `}</style>
      )}

      <VStack
        align="center" gap="3.5" p="6"
        rounded="var(--radius-card)"
        border="1px solid var(--border-subtle)"
        bg="var(--surface-2)"
        minW="0"
        position="relative"
        opacity={supported ? 1 : 0.6}
        transition="border-color 0.15s"
        _hover={supported ? { borderColor: 'var(--border-focus)' } : undefined}
      >
        {!supported && (
          <Box
            position="absolute" top="10px" right="10px"
            px="1.5" py="0.5" rounded="4px"
            bg="var(--surface-3)" border="1px solid var(--border-subtle)"
          >
            <Text fontSize="10px" fontWeight="600" color="var(--text-muted)" letterSpacing="0.05em">
              COMING SOON
            </Text>
          </Box>
        )}

        <ProviderLogo providerId={integration.id} size={48} />

        <VStack gap="1" align="center">
          <Text fontSize="14px" fontWeight="600" color="var(--text-primary)">{name}</Text>
          <Text fontSize="11px" color="var(--text-muted)">
            {!supported
              ? 'OpenAI · GPT / o-series models'
              : integration.version
              ? `v${integration.version}`
              : integration.installed === 1
              ? integration.authStatus === 'ok' ? 'Connected' : 'Not signed in'
              : 'Not installed'}
          </Text>
        </VStack>

        <HStack gap="2">
          {updateReady && (
            <Button
              size="sm" h="7" px="3"
              bg="var(--accent)" color="var(--accent-contrast)"
              _hover={{ bg: 'var(--accent-strong)' }}
              rounded="var(--radius-control)"
              style={{ animation: '_update-glow 2s ease-in-out infinite' }}
              onClick={() => onManage(1)}
            >
              Update
            </Button>
          )}
          <Button
            size="sm" h="7" px="3"
            bg="var(--surface-3)"
            color="var(--text-secondary)"
            border="1px solid var(--border-subtle)"
            _hover={supported ? { bg: 'var(--surface-hover)', color: 'var(--text-primary)' } : undefined}
            rounded="var(--radius-control)"
            disabled={!supported}
            cursor={supported ? 'pointer' : 'default'}
            onClick={supported ? ctaAction : undefined}
          >
            {supported ? ctaLabel : 'Coming soon'}
          </Button>
        </HStack>
      </VStack>
    </>
  );
}

// ── IntegrationsTab ───────────────────────────────────────────────────────────

export function IntegrationsTab() {
  const { integrations, refresh } = useCodingIntegrations();

  const [drawerAgent, setDrawerAgent] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('connect');
  const [drawerInitialStep, setDrawerInitialStep] = useState(0);

  const shown = (['claude-code', 'codex'] as const).map(id =>
    integrations.find(i => i.id === id) ?? ({
      id,
      installed: 0 as const,
      enabled: 1 as const,
      authStatus: 'unchecked',
      lastCheckedAt: 0,
    } as AgentIntegration)
  );

  const drawerIntegration = drawerAgent
    ? (shown.find(i => i.id === drawerAgent) ?? null)
    : null;

  function openConnect(id: string) {
    setDrawerAgent(id);
    setDrawerMode('connect');
    setDrawerInitialStep(0);
  }

  function openManage(id: string, step = 0) {
    setDrawerAgent(id);
    setDrawerMode('manage');
    setDrawerInitialStep(step);
  }

  return (
    <Box px="5" py="6" overflow="auto" h="100%">
      <VStack align="stretch" gap="5" maxW="560px">
        <Box>
          <Text fontSize="15px" fontWeight="600" color="var(--text-primary)" mb="1">
            Agent integrations
          </Text>
          <Text fontSize="13px" color="var(--text-secondary)">
            Connect Claude Code or Codex to create AI coding jobs against your local repos.
          </Text>
        </Box>

        <Box
          display="grid"
          gridTemplateColumns="repeat(2, 1fr)"
          gap="3"
        >
          {shown.map(integration => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onConnect={() => openConnect(integration.id)}
              onManage={(step) => openManage(integration.id, step)}
            />
          ))}
        </Box>
      </VStack>

      {drawerAgent && drawerIntegration && (
        <IntegrationDrawer
          agentId={drawerAgent}
          mode={drawerMode}
          initialStep={drawerInitialStep}
          integration={drawerIntegration}
          onClose={() => setDrawerAgent(null)}
          onUpdated={() => refresh(drawerAgent)}
        />
      )}
    </Box>
  );
}
