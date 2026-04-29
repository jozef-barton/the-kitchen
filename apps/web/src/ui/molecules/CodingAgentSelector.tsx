import { useState } from 'react';
import { Box, Button, HStack, Menu } from '@chakra-ui/react';
import { useCodingIntegrations } from '../../hooks/use-coding-integrations';

const AGENT_NAMES: Record<string, string> = { 'claude-code': 'Claude Code', codex: 'Codex' };

const CLAUDE_MODELS = [
  { value: 'sonnet', label: 'Sonnet 4.6' },
  { value: 'opus', label: 'Opus 4.7' },
  { value: 'haiku', label: 'Haiku 4.5' },
];
const CODEX_MODELS = [
  { value: 'codex-mini-latest', label: 'Codex Mini' },
  { value: 'gpt-5-codex', label: 'GPT-5 Codex' },
];
const CLAUDE_EFFORTS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'xhigh', label: 'X-High' },
  { value: 'max', label: 'Max' },
];
const CODEX_EFFORTS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const LS_AGENT = 'coding-default-agent';
const LS_MODEL = 'coding-default-model';
const LS_EFFORT = 'coding-default-reasoning';

function ChipMenu({
  label, placeholder, options, onSelect, disabled
}: {
  label: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  onSelect: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button
          size="xs" h="7" px="3" variant="outline"
          borderColor="var(--border-subtle)"
          color={label ? 'var(--text-primary)' : 'var(--text-muted)'}
          bg="var(--surface-1)"
          _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
          rounded="var(--radius-pill)"
          fontSize="12px"
          disabled={disabled}
        >
          {label || placeholder || '—'} ▾
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content
          bg="var(--surface-elevated)" border="1px solid var(--border-subtle)"
          rounded="var(--radius-card)" shadow="var(--shadow-md)" minW="140px" p="1"
        >
          {options.map(opt => (
            <Menu.Item
              key={opt.value}
              value={opt.value}
              fontSize="12px" px="3" py="1.5"
              rounded="var(--radius-control)"
              _hover={{ bg: 'var(--surface-hover)' }}
              onClick={() => onSelect(opt.value)}
            >
              {opt.label}
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}

export function CodingAgentSelector({ onGoToIntegrations }: { onGoToIntegrations: () => void }) {
  const { integrations } = useCodingIntegrations();

  const [selectedAgent, setSelectedAgent] = useState<string>(() => localStorage.getItem(LS_AGENT) ?? '');
  const [selectedModel, setSelectedModel] = useState<string>(() => localStorage.getItem(LS_MODEL) ?? '');
  const [selectedEffort, setSelectedEffort] = useState<string>(() => localStorage.getItem(LS_EFFORT) ?? 'medium');

  const connectedAgents = integrations.filter(i => i.installed && i.authStatus === 'ok' && i.enabled !== 0);
  const noAgents = connectedAgents.length === 0;

  const agentOptions = connectedAgents.map(i => ({
    value: i.id,
    label: AGENT_NAMES[i.id] ?? i.id,
  }));

  const modelOptions = selectedAgent === 'codex' ? CODEX_MODELS : CLAUDE_MODELS;
  const effortOptions = selectedAgent === 'codex' ? CODEX_EFFORTS : CLAUDE_EFFORTS;

  const activeAgent = connectedAgents.find(i => i.id === selectedAgent);
  const agentLabel = activeAgent ? (AGENT_NAMES[activeAgent.id] ?? activeAgent.id) : '';
  const modelLabel = modelOptions.find(m => m.value === selectedModel)?.label ?? '';
  const effortLabel = effortOptions.find(e => e.value === selectedEffort)?.label ?? '';

  function setAgent(v: string) {
    setSelectedAgent(v);
    localStorage.setItem(LS_AGENT, v);
    // Reset model when agent changes
    setSelectedModel('');
    localStorage.setItem(LS_MODEL, '');
  }
  function setModel(v: string) {
    setSelectedModel(v);
    localStorage.setItem(LS_MODEL, v);
  }
  function setEffort(v: string) {
    setSelectedEffort(v);
    localStorage.setItem(LS_EFFORT, v);
  }

  if (noAgents) {
    return (
      <Button
        size="xs" h="7" px="3" variant="outline"
        borderColor="var(--border-subtle)"
        color="var(--text-muted)"
        bg="var(--surface-1)"
        _hover={{ bg: 'var(--surface-hover)', color: 'var(--text-primary)' }}
        rounded="var(--radius-pill)"
        fontSize="12px"
        onClick={onGoToIntegrations}
      >
        Choose a provider
      </Button>
    );
  }

  return (
    <HStack gap="1.5">
      <ChipMenu
        label={agentLabel}
        placeholder="Choose a provider"
        options={agentOptions}
        onSelect={setAgent}
      />
      {selectedAgent && (
        <ChipMenu
          label={modelLabel}
          placeholder="Choose a model"
          options={modelOptions}
          onSelect={setModel}
        />
      )}
      {selectedAgent && (
        <HStack gap="1" align="center">
          <Box w="1px" h="16px" bg="var(--border-subtle)" />
          <ChipMenu
            label={effortLabel || 'Medium'}
            options={effortOptions}
            onSelect={setEffort}
          />
        </HStack>
      )}
    </HStack>
  );
}

