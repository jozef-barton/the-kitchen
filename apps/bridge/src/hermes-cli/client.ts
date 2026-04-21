import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile, spawn } from 'node:child_process';
import type { ExecFileException } from 'node:child_process';
import type {
  ChatActivity,
  ChatRequestMode,
  ChatMessage,
  ConnectProviderRequest,
  HermesCliActionResult,
  HermesCliModelDiscovery,
  Job,
  Profile,
  RecipeMutationIntent,
  RuntimeModelConfig,
  RuntimeReadiness,
  RuntimeProviderOption,
  Session,
  RecipeContentFormat,
  Recipe,
  Skill,
  Tool
} from '@hermes-recipes/protocol';
import { HermesCliActionResultSchema, HermesCliModelDiscoverySchema, RECIPE_REFRESH_USER_MESSAGE } from '@hermes-recipes/protocol';
export type { RecipeMutationIntent };
import {
  classifyImportedMessageKind,
  classifyImportedMessageVisibility,
  sanitizeAssistantBody,
  sanitizeImportedMessageContent
} from '../transcript-runtime';

export const HERMES_EXPECTED_VERSION = '0.9.0';

interface HermesProviderMeta {
  displayName: string;
  envVar?: string;
  keyUrl?: string;
  authKind: 'api_key' | 'oauth' | 'mixed';
  supportsApiKey: boolean;
  supportsOAuth: boolean;
  oauthCommand?: string;
  oauthDescription?: string;
  exampleModel?: string;
  description?: string;
}

const HERMES_PROVIDER_REGISTRY: Record<string, HermesProviderMeta> = {
  openrouter: {
    displayName: 'OpenRouter',
    envVar: 'OPENROUTER_API_KEY',
    keyUrl: 'https://openrouter.ai/keys',
    authKind: 'api_key',
    supportsApiKey: true,
    supportsOAuth: false,
    exampleModel: 'openai/gpt-5.4',
    description: 'Routes to 300+ models through one API key.'
  },
  openai: {
    displayName: 'OpenAI',
    envVar: 'VOICE_TOOLS_OPENAI_KEY',
    keyUrl: 'https://platform.openai.com/api-keys',
    authKind: 'api_key',
    supportsApiKey: true,
    supportsOAuth: false,
    exampleModel: 'openai/gpt-4o',
    description: 'Direct OpenAI API access. Used for STT/TTS and direct model calls.'
  },
  anthropic: {
    displayName: 'Anthropic',
    envVar: 'ANTHROPIC_API_KEY',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    authKind: 'api_key',
    supportsApiKey: true,
    supportsOAuth: false,
    exampleModel: 'anthropic/claude-sonnet-4',
    description: 'Direct Anthropic API access for Claude models.'
  },
  anthropic_token: {
    displayName: 'Anthropic (Token)',
    envVar: 'ANTHROPIC_TOKEN',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    authKind: 'api_key',
    supportsApiKey: true,
    supportsOAuth: false,
    exampleModel: 'anthropic/claude-sonnet-4',
    description: 'Alternate Anthropic credential slot.'
  },
  nous: {
    displayName: 'Nous Portal',
    authKind: 'oauth',
    supportsApiKey: false,
    supportsOAuth: true,
    oauthCommand: 'hermes login --provider nous',
    oauthDescription: 'Sign in to Nous Portal using the OAuth device flow. This will open a browser window for verification.',
    exampleModel: 'nous/hermes-3-llama-3.1-405b',
    description: 'Nous Research Portal with OAuth device-code authentication.'
  },
  'openai-codex': {
    displayName: 'OpenAI Codex',
    authKind: 'oauth',
    supportsApiKey: false,
    supportsOAuth: true,
    oauthCommand: 'hermes login --provider openai-codex',
    oauthDescription: 'Sign in to OpenAI Codex using the OAuth device flow. This will open a browser window for verification.',
    exampleModel: 'openai/codex-mini',
    description: 'OpenAI Codex with OAuth device-code authentication.'
  },
  'glm/zai': {
    displayName: 'Z.AI / GLM',
    envVar: 'GLM_API_KEY',
    keyUrl: 'https://open.bigmodel.cn',
    authKind: 'api_key',
    supportsApiKey: true,
    supportsOAuth: false,
    exampleModel: 'glm/glm-4-plus',
    description: 'ZhipuAI GLM models (GLM-4-Plus, etc.).'
  },
  zai: {
    displayName: 'Z.AI',
    envVar: 'GLM_API_KEY',
    keyUrl: 'https://z.ai',
    authKind: 'api_key',
    supportsApiKey: true,
    supportsOAuth: false,
    exampleModel: 'glm/glm-4-plus',
    description: 'Z.AI alias for ZhipuAI GLM provider.'
  },
  kimi: {
    displayName: 'Kimi / Moonshot',
    envVar: 'KIMI_API_KEY',
    keyUrl: 'https://platform.kimi.ai',
    authKind: 'api_key',
    supportsApiKey: true,
    supportsOAuth: false,
    exampleModel: 'kimi/kimi-k2.5',
    description: 'Moonshot AI coding models via Kimi Code console.'
  },
  minimax: {
    displayName: 'MiniMax',
    envVar: 'MINIMAX_API_KEY',
    keyUrl: 'https://www.minimax.io',
    authKind: 'api_key',
    supportsApiKey: true,
    supportsOAuth: false,
    exampleModel: 'minimax/minimax-text-01',
    description: 'MiniMax international API.'
  },
  deepseek: {
    displayName: 'DeepSeek',
    envVar: 'DEEPSEEK_API_KEY',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    authKind: 'api_key',
    supportsApiKey: true,
    supportsOAuth: false,
    exampleModel: 'deepseek/deepseek-chat',
    description: 'DeepSeek models (DeepSeek-V3, DeepSeek-R1, etc.).'
  },
  dashscope: {
    displayName: 'DashScope / Qwen',
    envVar: 'DASHSCOPE_API_KEY',
    keyUrl: 'https://dashscope.console.aliyun.com/apiKey',
    authKind: 'api_key',
    supportsApiKey: true,
    supportsOAuth: false,
    exampleModel: 'qwen/qwen-max',
    description: 'Alibaba Cloud DashScope for Qwen models.'
  },
  huggingface: {
    displayName: 'Hugging Face',
    envVar: 'HF_TOKEN',
    keyUrl: 'https://huggingface.co/settings/tokens',
    authKind: 'api_key',
    supportsApiKey: true,
    supportsOAuth: false,
    exampleModel: 'huggingface/meta-llama/Llama-3.1-70B-Instruct',
    description: 'Hugging Face Inference Providers. Routes to 20+ open models. Free tier included.'
  },
  ai_gateway: {
    displayName: 'AI Gateway',
    envVar: 'AI_GATEWAY_API_KEY',
    authKind: 'api_key',
    supportsApiKey: true,
    supportsOAuth: false,
    description: 'Custom OpenAI-compatible gateway endpoint.'
  },
  opencode_zen: {
    displayName: 'OpenCode Zen',
    envVar: 'OPENCODE_ZEN_API_KEY',
    keyUrl: 'https://opencode.ai/auth',
    authKind: 'api_key',
    supportsApiKey: true,
    supportsOAuth: false,
    exampleModel: 'opencode/zen',
    description: 'OpenCode Zen — pay-as-you-go pricing.'
  },
  opencode_go: {
    displayName: 'OpenCode Go',
    envVar: 'OPENCODE_GO_API_KEY',
    keyUrl: 'https://opencode.ai/auth',
    authKind: 'api_key',
    supportsApiKey: true,
    supportsOAuth: false,
    exampleModel: 'opencode/go',
    description: 'OpenCode Go — $10/month subscription.'
  },
  kilocode: {
    displayName: 'KiloCode',
    envVar: 'KILOCODE_API_KEY',
    authKind: 'api_key',
    supportsApiKey: true,
    supportsOAuth: false,
    description: 'KiloCode API provider.'
  }
};

interface HermesCliProfileRecord {
  id: string;
  path: string;
  model: string;
  gateway: string;
  isActive: boolean;
  alias?: string;
}

interface HermesCliSessionRecord {
  id: string;
  title: string;
  preview: string;
  lastActive: string;
  source?: string;
}

interface HermesCliChatResult {
  assistantMarkdown: string;
  runtimeSessionId?: string;
}

export type RecipeAppletStage = 'source' | 'repair';
export type RecipeDslStage = 'generate' | 'repair';
export type RecipeTemplateStage = 'select' | 'text' | 'hydrate' | 'actions' | 'text_repair' | 'actions_repair';

export interface RuntimeProviderDiscoveryResult {
  config: RuntimeModelConfig;
  providers: RuntimeProviderOption[];
  runtimeReadiness: RuntimeReadiness;
  inspectedProviderId: string | null;
  discoveredAt: string;
}

class HermesCliTimeoutError extends Error {
  constructor(command: string, timeoutMs: number) {
    super(`Hermes CLI command ${command} timed out after ${timeoutMs}ms.`);
    this.name = 'TimeoutError';
  }
}

export class HermesCliRecipeAppletViolationError extends Error {
  constructor(
    message: string,
    readonly detail?: string
  ) {
    super(message);
    this.name = 'HermesCliRecipeAppletViolationError';
  }
}

export class HermesCliRecipeAppletContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HermesCliRecipeAppletContextError';
  }
}

export class HermesCliStructuredActionError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly detail?: string
  ) {
    super(message);
    this.name = 'HermesCliStructuredActionError';
  }
}

export interface HermesCliExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface HermesCliRunOptions {
  cwd?: string;
  env?: Record<string, string | undefined>;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface HermesCliRunner {
  run(args: string[], options?: HermesCliRunOptions): Promise<HermesCliExecutionResult>;
  stream(
    args: string[],
    options?: HermesCliRunOptions & {
      onStdout?: (chunk: string) => void;
      onStderr?: (chunk: string) => void;
    }
  ): Promise<HermesCliExecutionResult>;
}

export interface HermesRecipeAppletGenerationOptions {
  profile: Profile;
  prompt: string;
  stage: RecipeAppletStage;
  requestId?: string | null;
  timeoutMs: number;
  onProgress?: (message: string) => void;
  onActivity?: (activity: ChatActivity) => void;
  onAssistantSnapshot?: (markdown: string) => void;
}

export interface HermesRecipeDslGenerationOptions {
  profile: Profile;
  prompt: string;
  stage: RecipeDslStage;
  requestId?: string | null;
  timeoutMs: number;
  onProgress?: (message: string) => void;
  onActivity?: (activity: ChatActivity) => void;
  onAssistantSnapshot?: (markdown: string) => void;
}

export interface HermesRecipeTemplateGenerationOptions {
  profile: Profile;
  prompt: string;
  stage: RecipeTemplateStage;
  requestId?: string | null;
  timeoutMs: number;
  onProgress?: (message: string) => void;
  onActivity?: (activity: ChatActivity) => void;
  onAssistantSnapshot?: (markdown: string) => void;
}

export interface HermesRecipeTemplateCorrectionOptions {
  profile: Profile;
  correctionPrompt: string;
  sessionId: string;
  stage: RecipeTemplateStage;
  requestId?: string | null;
  timeoutMs: number;
  onProgress?: (message: string) => void;
  onActivity?: (activity: ChatActivity) => void;
  onAssistantSnapshot?: (markdown: string) => void;
}

function createDefaultHermesCliRunner(cliPath: string): HermesCliRunner {
  return {
    async run(args, options = {}) {
      return new Promise<HermesCliExecutionResult>((resolve, reject) => {
        execFile(
          cliPath,
          args,
          {
            cwd: options.cwd,
            env: options.env,
            timeout: options.timeoutMs,
            signal: options.signal,
            encoding: 'utf8',
            maxBuffer: 10 * 1024 * 1024
          },
          (error, stdout, stderr) => {
            if (error?.name === 'AbortError') {
              reject(error);
              return;
            }

            resolve({
              stdout: typeof stdout === 'string' ? stdout : '',
              stderr: typeof stderr === 'string' ? stderr : '',
              exitCode: error ? ((error as ExecFileException).code as number | undefined) ?? 1 : 0
            });
          }
        );
      });
    },
    async stream(args, options = {}) {
      return new Promise<HermesCliExecutionResult>((resolve, reject) => {
        const child = spawn(cliPath, args, {
          cwd: options.cwd,
          env: options.env,
          stdio: ['ignore', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';
        let timeoutHandle: ReturnType<typeof globalThis.setTimeout> | undefined;
        let forcedKillHandle: ReturnType<typeof globalThis.setTimeout> | undefined;
        let timedOut = false;
        let abortedBySignal = false;

        const abortHandler = () => {
          abortedBySignal = true;
          child.kill('SIGTERM');
        };

        options.signal?.addEventListener('abort', abortHandler, { once: true });

        if (options.timeoutMs && options.timeoutMs > 0) {
          timeoutHandle = globalThis.setTimeout(() => {
            timedOut = true;
            child.kill('SIGTERM');
            forcedKillHandle = globalThis.setTimeout(() => {
              child.kill('SIGKILL');
            }, 2_000);
          }, options.timeoutMs);
        }

        child.stdout.setEncoding('utf8');
        child.stdout.on('data', (chunk: string) => {
          stdout += chunk;
          options.onStdout?.(chunk);
        });

        child.stderr.setEncoding('utf8');
        child.stderr.on('data', (chunk: string) => {
          stderr += chunk;
          options.onStderr?.(chunk);
        });

        child.on('error', reject);
        child.on('close', (code, signal) => {
          if (timeoutHandle) {
            globalThis.clearTimeout(timeoutHandle);
          }
          if (forcedKillHandle) {
            globalThis.clearTimeout(forcedKillHandle);
          }
          options.signal?.removeEventListener('abort', abortHandler);

          if (timedOut) {
            reject(new HermesCliTimeoutError(args.join(' '), options.timeoutMs ?? 0));
            return;
          }

          if (options.signal?.aborted || abortedBySignal) {
            const error = new Error(`Hermes CLI command ${args.join(' ')} was aborted.`);
            error.name = 'AbortError';
            reject(error);
            return;
          }

          if (signal && code === null) {
            reject(new Error(`Hermes CLI command ${args.join(' ')} exited via ${signal}.`));
            return;
          }

          resolve({
            stdout,
            stderr,
            exitCode: code ?? 0
          });
        });
      });
    }
  };
}

function normalizeOutput(output: string) {
  return output.replace(/\r/g, '').trim();
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function formatCliCommand(args: string[]) {
  return ['hermes', ...args].join(' ');
}

function combineCliOutput(result: Pick<HermesCliExecutionResult, 'stdout' | 'stderr'>) {
  return normalizeOutput([result.stdout, result.stderr].filter((chunk) => chunk.trim().length > 0).join('\n'));
}

function normalizeCliCellValue(value: string | undefined) {
  const normalized = value?.trim() ?? '';
  return normalized === '—' ? '' : normalized;
}

function splitCliCells(line: string) {
  return line
    .trim()
    .split(/\s{2,}/u)
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0);
}

function splitSessionLineFromRight(line: string, segmentCount: number) {
  const trimmedLine = line.trimEnd();
  const separators = Array.from(trimmedLine.matchAll(/\s{2,}/gu));
  if (separators.length < segmentCount - 1) {
    return null;
  }

  const parts = new Array<string>(segmentCount);
  let cursor = trimmedLine.length;

  for (let index = segmentCount - 1; index > 0; index -= 1) {
    const separator = separators.pop();
    if (!separator?.index && separator?.index !== 0) {
      return null;
    }

    parts[index] = trimmedLine.slice(separator.index + separator[0].length, cursor).trim();
    cursor = separator.index;
  }

  parts[0] = trimmedLine.slice(0, cursor).trimEnd();
  return parts;
}

function toIsoTimestamp(value: unknown, fallback: string) {
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const milliseconds = value > 1_000_000_000_000 ? value : value * 1000;
    return new Date(milliseconds).toISOString();
  }

  return fallback;
}

function isCliTableDivider(line: string) {
  return /^[\s─-]+$/u.test(line.trim());
}

function isCliHeaderLine(line: string, headerLabel: string) {
  return line.trimStart().startsWith(headerLabel);
}

function parseProfileList(output: string): HermesCliProfileRecord[] {
  const normalized = normalizeOutput(output);
  if (!normalized) {
    return [];
  }

  return normalized
    .split('\n')
    .map((line) => line.replace(/\r/g, '').trimEnd())
    .filter((line) => line.trim().length > 0)
    .filter((line) => !isCliHeaderLine(line, 'Profile'))
    .filter((line) => !isCliTableDivider(line))
    .flatMap((line) => {
      const trimmed = line.trimStart();
      const marker = trimmed.startsWith('◆') ? '◆' : '';
      const withoutMarker = marker ? trimmed.slice(1).trimStart() : trimmed;
      const [profileId, model = '', gateway = '', alias = ''] = splitCliCells(withoutMarker);

      return profileId
        ? [
            {
              id: profileId,
              path: '',
              model,
              gateway,
              isActive: marker === '◆',
              alias: alias && alias !== '—' ? alias.trim() : undefined
            }
          ]
        : [];
    });
}

function parseProfileShow(profileId: string, output: string, isActive: boolean): HermesCliProfileRecord {
  const lines = normalizeOutput(output)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const path = lines.find((line) => line.startsWith('Path:'))?.replace(/^Path:\s+/, '') ?? '';
  const model = lines.find((line) => line.startsWith('Model:'))?.replace(/^Model:\s+/, '') ?? 'Unknown model';
  const gateway = lines.find((line) => line.startsWith('Gateway:'))?.replace(/^Gateway:\s+/, '') ?? 'unknown';
  const alias = lines.find((line) => line.startsWith('Alias:'))?.replace(/^Alias:\s+/, '');

  return {
    id: profileId,
    path,
    model,
    gateway,
    isActive,
    alias: alias && !alias.startsWith('/') ? alias : undefined
  };
}

function toProfile(record: HermesCliProfileRecord): Profile {
  return {
    id: record.id,
    name: record.id,
    description: [record.model, `gateway ${record.gateway}`, record.alias && record.alias !== record.id ? `alias ${record.alias}` : undefined]
      .filter(Boolean)
      .join(' · '),
    path: record.path || undefined,
    model: record.model,
    gateway: record.gateway,
    alias: record.alias,
    isActive: record.isActive
  };
}

function parseRelativeSessionTimestamp(value: string, referenceTime: string) {
  const normalized = value.trim().toLowerCase();
  const referenceTimestamp = Date.parse(referenceTime);

  if (Number.isNaN(referenceTimestamp)) {
    return undefined;
  }

  if (normalized === 'just now' || normalized === 'moments ago') {
    return new Date(referenceTimestamp).toISOString();
  }

  if (normalized === 'yesterday') {
    return new Date(referenceTimestamp - 24 * 60 * 60 * 1000).toISOString();
  }

  const match = normalized.match(
    /^(?<amount>\d+)\s*(?<unit>s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|wk|wks|week|weeks)\s+ago$/u
  );
  if (!match?.groups?.amount || !match.groups.unit) {
    return undefined;
  }

  const amount = Number.parseInt(match.groups.amount, 10);
  if (!Number.isFinite(amount)) {
    return undefined;
  }

  const unit = match.groups.unit;
  const millisecondsPerUnit =
    unit.startsWith('s')
      ? 1_000
      : unit.startsWith('m')
        ? 60_000
        : unit.startsWith('h')
          ? 60 * 60 * 1_000
          : unit.startsWith('d')
            ? 24 * 60 * 60 * 1_000
            : 7 * 24 * 60 * 60 * 1_000;

  return new Date(referenceTimestamp - amount * millisecondsPerUnit).toISOString();
}

function parseSessionsList(output: string): HermesCliSessionRecord[] {
  const normalized = normalizeOutput(output);
  if (!normalized || normalized.startsWith('No sessions')) {
    return [];
  }

  const lines = normalized
    .split('\n')
    .map((line) => line.replace(/\r/g, '').trimEnd())
    .filter((line) => line.trim().length > 0);
  const headerLine = lines.find((line) => !isCliTableDivider(line));

  if (!headerLine) {
    return [];
  }

  const usesLegacyColumns = headerLine.includes('Src');
  const usesTitleColumn = headerLine.includes('Title');
  const titleColumnStart = usesTitleColumn ? headerLine.indexOf('Title') : -1;
  const previewColumnStart = headerLine.indexOf('Preview');
  const lastActiveColumnStart = headerLine.indexOf('Last Active');
  const sourceColumnStart = usesLegacyColumns ? headerLine.indexOf('Src') : -1;
  const idColumnStart = headerLine.lastIndexOf('ID');

  return lines
    .filter((line) => !isCliTableDivider(line))
    .filter((line) => line !== headerLine)
    .map((line) => {
      const legacySplit = usesLegacyColumns ? splitSessionLineFromRight(line, 4) : null;
      if (usesLegacyColumns && legacySplit) {
        const [preview, lastActive, source, id] = legacySplit;
        if (!lastActive || !id) {
          return null;
        }

        return {
          id: normalizeCliCellValue(id),
          title: '',
          preview: normalizeCliCellValue(preview),
          lastActive: normalizeCliCellValue(lastActive),
          source: normalizeCliCellValue(source)
        } satisfies HermesCliSessionRecord;
      }

      const titleSplit = usesTitleColumn ? splitSessionLineFromRight(line, 4) : null;
      if (usesTitleColumn && titleSplit) {
        const [title, preview, lastActive, id] = titleSplit;
        if (!lastActive || !id) {
          return null;
        }

        return {
          id: normalizeCliCellValue(id),
          title: normalizeCliCellValue(title),
          preview: normalizeCliCellValue(preview),
          lastActive: normalizeCliCellValue(lastActive)
        } satisfies HermesCliSessionRecord;
      }

      if (usesLegacyColumns && previewColumnStart >= 0 && lastActiveColumnStart >= 0 && sourceColumnStart >= 0 && idColumnStart >= 0) {
        const preview = normalizeCliCellValue(line.slice(previewColumnStart, lastActiveColumnStart));
        const lastActive = normalizeCliCellValue(line.slice(lastActiveColumnStart, sourceColumnStart));
        const source = normalizeCliCellValue(line.slice(sourceColumnStart, idColumnStart));
        const id = normalizeCliCellValue(line.slice(idColumnStart));
        if (!lastActive || !id) {
          return null;
        }

        return {
          id,
          title: '',
          preview,
          lastActive,
          source
        } satisfies HermesCliSessionRecord;
      }

      if (usesTitleColumn && titleColumnStart >= 0 && previewColumnStart >= 0 && lastActiveColumnStart >= 0 && idColumnStart >= 0) {
        const title = normalizeCliCellValue(line.slice(titleColumnStart, previewColumnStart));
        const preview = normalizeCliCellValue(line.slice(previewColumnStart, lastActiveColumnStart));
        const lastActive = normalizeCliCellValue(line.slice(lastActiveColumnStart, idColumnStart));
        const id = normalizeCliCellValue(line.slice(idColumnStart));
        if (!lastActive || !id) {
          return null;
        }

        return {
          id,
          title,
          preview,
          lastActive
        } satisfies HermesCliSessionRecord;
      }

      const cells = splitCliCells(line);
      if (usesLegacyColumns && cells.length >= 4) {
        const [preview, lastActive, source, id] = cells;
        return {
          id,
          title: '',
          preview: normalizeCliCellValue(preview),
          lastActive,
          source: normalizeCliCellValue(source)
        } satisfies HermesCliSessionRecord;
      }

      if (usesTitleColumn && cells.length >= 4) {
        const [title, preview, lastActive, id] = cells;
        return {
          id,
          title: normalizeCliCellValue(title),
          preview: normalizeCliCellValue(preview),
          lastActive
        } satisfies HermesCliSessionRecord;
      }

      return null;
    })
    .filter((record): record is HermesCliSessionRecord => Boolean(record));
}

function parseSessionListTimestamp(value: string, referenceTime: string) {
  const parsed = Date.parse(value);

  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString();
  }

  return parseRelativeSessionTimestamp(value, referenceTime);
}

function parseCronJobs(listOutput: string, statusOutput: string, profileId: string, timestamp: string): Job[] {
  const normalizedList = normalizeOutput(listOutput);
  if (!normalizedList || normalizedList.includes('No scheduled jobs.')) {
    return [];
  }

  const gatewayRunning = normalizeOutput(statusOutput).includes('Gateway is running');
  const lines = normalizedList.split('\n');
  const jobs: Job[] = [];
  let current: {
    id: string;
    state: string;
    name?: string;
    schedule?: string;
    repeat?: string;
    nextRun?: string;
    deliver?: string;
    skills?: string;
  } | null = null;

  const pushCurrent = () => {
    if (!current) {
      return;
    }

    const baseStatus =
      current.state === 'paused' || current.state === 'disabled'
        ? 'paused'
        : current.state === 'completed'
          ? 'healthy'
          : 'healthy';
    const status = gatewayRunning || baseStatus !== 'healthy' ? baseStatus : 'attention';
    const detailParts = [
      current.deliver ? `Deliver: ${current.deliver}` : undefined,
      current.repeat ? `Repeat: ${current.repeat}` : undefined,
      current.skills ? `Skills: ${current.skills}` : undefined
    ].filter(Boolean);

    jobs.push({
      id: current.id,
      profileId,
      label: current.name ?? current.id,
      schedule: current.schedule ?? 'Not reported by Hermes CLI',
      status,
      description: detailParts.join(' · ') || 'Managed by local Hermes cron.',
      lastRun: 'Not reported by Hermes CLI',
      nextRun: current.nextRun ?? 'Not scheduled',
      lastSyncedAt: timestamp
    });
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const headerMatch = line.match(/^\s+(\S+)\s+\[([^\]]+)\]\s*$/);

    if (headerMatch) {
      pushCurrent();
      current = {
        id: headerMatch[1],
        state: headerMatch[2].toLowerCase()
      };
      continue;
    }

    if (!current) {
      continue;
    }

    const normalizedLine = line.trim();
    if (!normalizedLine) {
      continue;
    }

    if (normalizedLine.startsWith('Name:')) {
      current.name = normalizedLine.replace(/^Name:\s+/, '');
    } else if (normalizedLine.startsWith('Schedule:')) {
      current.schedule = normalizedLine.replace(/^Schedule:\s+/, '');
    } else if (normalizedLine.startsWith('Repeat:')) {
      current.repeat = normalizedLine.replace(/^Repeat:\s+/, '');
    } else if (normalizedLine.startsWith('Next run:')) {
      current.nextRun = normalizedLine.replace(/^Next run:\s+/, '');
    } else if (normalizedLine.startsWith('Deliver:')) {
      current.deliver = normalizedLine.replace(/^Deliver:\s+/, '');
    } else if (normalizedLine.startsWith('Skills:')) {
      current.skills = normalizedLine.replace(/^Skills:\s+/, '');
    }
  }

  pushCurrent();

  return jobs;
}

function stripAnsi(output: string) {
  return output
    .replace(new RegExp(String.raw`\u001B\[[0-9;?]*[ -/]*[@-~]`, 'g'), '')
    .replace(new RegExp(String.raw`\u001B[\(\)][0-9A-Za-z]`, 'g'), '')
    .replace(new RegExp(String.raw`\u001B[@-_]`, 'g'), '');
}

function extractRuntimeSessionId(output: string) {
  const quietMatch = output.match(/session_id:\s*(\S+)/);
  if (quietMatch) {
    return quietMatch[1];
  }

  const normalMatch = output.match(/Session:\s+(\S+)/);
  return normalMatch?.[1];
}

function extractAssistantBoxContent(output: string) {
  const boxStart = output.lastIndexOf('╭─ ⚕ Hermes');
  if (boxStart < 0) {
    return undefined;
  }

  const boxLines = output.slice(boxStart).split('\n').slice(1);
  const bodyLines: string[] = [];

  for (const rawLine of boxLines) {
    const line = rawLine.trimEnd();
    if (line.trim().startsWith('╰')) {
      break;
    }

    if (!line.trim()) {
      if (bodyLines.length > 0) {
        bodyLines.push('');
      }
      continue;
    }

    if (line.trim().startsWith('session_id:')) {
      break;
    }

    bodyLines.push(line.trim());
  }

  return bodyLines.join('\n').trim();
}

function collapseRepeatedParagraphSequences(content: string) {
  const paragraphs = content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length < 2) {
    return content.trim();
  }

  let changed = true;
  while (changed) {
    changed = false;

    for (let size = Math.floor(paragraphs.length / 2); size >= 1 && !changed; size -= 1) {
      for (let start = 0; start + size * 2 <= paragraphs.length; start += 1) {
        const first = paragraphs.slice(start, start + size);
        const second = paragraphs.slice(start + size, start + size * 2);
        if (first.every((paragraph, index) => paragraph === second[index])) {
          paragraphs.splice(start + size, size);
          changed = true;
          break;
        }
      }
    }
  }

  return paragraphs.join('\n\n');
}

function extractAssistantBody(
  output: string,
  options: {
    structuredArtifactOnly?: boolean;
    recipeAppletStage?: RecipeAppletStage;
  } = {}
) {
  const assistantBox = extractAssistantBoxContent(output);
  if (assistantBox && assistantBox.length > 0) {
    if (options.structuredArtifactOnly || options.recipeAppletStage) {
      return assistantBox.trim();
    }

    return sanitizeAssistantBody(collapseRepeatedParagraphSequences(assistantBox), {
      keepRecipeFence: true
    });
  }

  const lines = output.split('\n');
  const bodyLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      if (bodyLines.length > 0) {
        bodyLines.push('');
      }
      continue;
    }

    if (
      trimmed.startsWith('session_id:') ||
      trimmed.startsWith('Session:') ||
      trimmed.startsWith('Resume this session') ||
      trimmed.startsWith('Duration:') ||
      trimmed.startsWith('Messages:') ||
      trimmed.startsWith('Query:') ||
      trimmed.startsWith('⚠️  Reached maximum iterations') ||
      trimmed.startsWith('⚠️  DANGEROUS COMMAND') ||
      trimmed.startsWith('Choice [o/s/D]:') ||
      trimmed.startsWith('📞 Tool') ||
      trimmed.startsWith('✅ Tool') ||
      trimmed.startsWith('[thinking]') ||
      trimmed.startsWith('✗ Denied') ||
      trimmed.startsWith('╭─') ||
      trimmed.startsWith('╰') ||
      trimmed.startsWith('↻ ') ||
      trimmed.startsWith('┊ ') ||
      trimmed === '────────────────────────────────────────'
    ) {
      continue;
    }

    if (trimmed.startsWith('Initializing agent')) {
      continue;
    }

    bodyLines.push(line);
  }

  const body = bodyLines.join('\n').trim();
  if (options.structuredArtifactOnly || options.recipeAppletStage) {
    return body;
  }

  return sanitizeAssistantBody(collapseRepeatedParagraphSequences(body), {
    keepRecipeFence: true
  });
}

function parseChatActivity(line: string, timestamp: string, requestId: string | null = null): ChatActivity | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.includes('Initializing agent')) {
    return {
      kind: 'status',
      state: 'started',
      label: 'Hermes agent',
      detail: 'Initializing the Hermes runtime.',
      requestId,
      timestamp
    };
  }

  const preparingMatch = trimmed.match(/^┊\s+(?<icon>📚|💻|📞|📖|🐍)\s+preparing\s+(?<label>.+?)…$/u);
  if (preparingMatch?.groups?.label) {
    return {
      kind:
        preparingMatch.groups.icon === '📚'
          ? 'skill'
          : preparingMatch.groups.icon === '💻'
            ? 'command'
            : 'tool',
      state: 'started',
      label: preparingMatch.groups.label.trim(),
      requestId,
      timestamp
    };
  }

  const toolActivityMatch = trimmed.match(
    /^┊\s+(?<icon>📞|📖|🐍)\s+(?<verb>tool|read|exec)\s+(?<label>.+?)\s+\d+(?:\.\d+)?s(?:\s+\[exit\s+(?<exitCode>-?\d+)\])?$/u
  );
  if (toolActivityMatch?.groups?.label && toolActivityMatch.groups.verb) {
    const rawLabel = toolActivityMatch.groups.label.trim();
    const toolLabel =
      toolActivityMatch.groups.verb === 'read'
        ? 'read_file'
        : toolActivityMatch.groups.verb === 'exec'
          ? 'execute_code'
          : rawLabel;

    return {
      kind: 'tool',
      state: toolActivityMatch.groups.exitCode && toolActivityMatch.groups.exitCode !== '0' ? 'failed' : 'completed',
      label: toolLabel,
      detail: rawLabel,
      requestId,
      timestamp
    };
  }

  const bareToolStartedMatch = trimmed.match(/^📞\s+Tool\s+(?<label>\S.+)$/u);
  if (bareToolStartedMatch?.groups?.label) {
    return {
      kind: 'tool',
      state: 'started',
      label: bareToolStartedMatch.groups.label.trim(),
      requestId,
      timestamp
    };
  }

  const bareToolCompletedMatch = trimmed.match(/^✅\s+Tool\s+(?<label>\S.+)$/u);
  if (bareToolCompletedMatch?.groups?.label) {
    return {
      kind: 'tool',
      state: 'completed',
      label: bareToolCompletedMatch.groups.label.trim(),
      requestId,
      timestamp
    };
  }

  const bareToolFailedMatch = trimmed.match(/^(?:❌|✗)\s+Tool\s+(?<label>\S.+)$/u);
  if (bareToolFailedMatch?.groups?.label) {
    return {
      kind: 'tool',
      state: 'failed',
      label: bareToolFailedMatch.groups.label.trim(),
      requestId,
      timestamp
    };
  }

  const skillCompletedMatch = trimmed.match(/^┊\s+📚\s+skill\s+(?<label>.+?)\s+\d+(?:\.\d+)?s(?:\s+\[exit\s+[^\]]+\])?$/u);
  if (skillCompletedMatch?.groups?.label) {
    return {
      kind: 'skill',
      state: 'completed',
      label: skillCompletedMatch.groups.label.trim(),
      requestId,
      timestamp
    };
  }

  const commandMatch = trimmed.match(/^┊\s+💻\s+\$\s+(?<command>.+?)\s+\d+(?:\.\d+)?s(?:\s+\[exit\s+(?<exitCode>-?\d+)\])?$/u);
  if (commandMatch?.groups?.command) {
    return {
      kind: 'command',
      state: commandMatch.groups.exitCode && commandMatch.groups.exitCode !== '0' ? 'failed' : 'completed',
      label: commandMatch.groups.command.trim().split(/\s+/u)[0] ?? 'command',
      command: commandMatch.groups.command.trim(),
      requestId,
      timestamp
    };
  }

  if (trimmed.startsWith('⚠️  DANGEROUS COMMAND')) {
    return {
      kind: 'approval',
      state: 'started',
      label: 'Command approval required',
      detail: trimmed.replace(/^⚠️\s+/u, ''),
      requestId,
      timestamp
    };
  }

  if (trimmed.startsWith('✗ Denied')) {
    return {
      kind: 'approval',
      state: 'denied',
      label: 'Command approval denied',
      requestId,
      timestamp
    };
  }

  if (trimmed.startsWith('⚠️  Reached maximum iterations')) {
    return {
      kind: 'warning',
      state: 'failed',
      label: 'Restricted turn limit reached',
      detail: trimmed.replace(/^⚠️\s+/u, ''),
      requestId,
      timestamp
    };
  }

  if (/^(AUTH_[A-Z_]+:|NOT_AUTHENTICATED:|REFRESH_FAILED:)/u.test(trimmed) || /missing Google Recipe scopes/i.test(trimmed)) {
    return {
      kind: 'warning',
      state: 'failed',
      label: 'Active profile auth issue',
      detail: trimmed,
      requestId,
      timestamp
    };
  }

  return null;
}

function progressMessageForActivity(activity: ChatActivity) {
  if (activity.kind === 'status') {
    return activity.detail ?? activity.label;
  }

  if (activity.kind === 'skill' && activity.state === 'started') {
    return `Hermes is using the ${activity.label} skill…`;
  }

  if (activity.kind === 'skill' && activity.state === 'completed') {
    return `Hermes finished using the ${activity.label} skill.`;
  }

  if (activity.kind === 'command' && activity.state === 'started') {
    return 'Hermes is using the terminal…';
  }

  if (activity.kind === 'command' && activity.state === 'completed') {
    return 'Hermes finished in the terminal.';
  }

  if (activity.kind === 'tool' && activity.state === 'started') {
    const label = activity.label.toLowerCase();
    if (/\b(search|find|lookup|lookup_places|nearby|places?|restaurant|hotel|google|maps|web)\b/u.test(label)) {
      return 'Hermes is searching…';
    }
    if (/\b(read_file|open|inspect|list|ls|cat)\b/u.test(label)) {
      return 'Hermes is inspecting local files…';
    }
    return `Hermes is using ${activity.label}…`;
  }

  if (activity.kind === 'tool' && activity.state === 'completed') {
    const label = activity.label.toLowerCase();
    if (/\b(search|find|lookup|lookup_places|nearby|places?|restaurant|hotel|google|maps|web)\b/u.test(label)) {
      return 'Hermes finished searching.';
    }
    return `Hermes used ${activity.label}.`;
  }

  if (activity.kind === 'tool' && activity.state === 'failed') {
    return activity.detail ?? `${activity.label} failed.`;
  }

  if (activity.kind === 'approval') {
    return activity.state === 'denied' ? 'A Hermes command approval was denied.' : 'Hermes is waiting for command approval.';
  }

  if (activity.kind === 'warning') {
    return activity.detail ?? activity.label;
  }

  return null;
}

function defaultProgressMessageForContent(content: string, normalizedOutput: string, assistantChunk: string | null | undefined) {
  if (normalizedOutput.includes('Initializing agent')) {
    return 'Hermes is working…';
  }

  if (assistantChunk) {
    return 'Hermes is typing…';
  }

  if (isRecipeWorkflowIntent(content)) {
    return 'Hermes is updating the recipe…';
  }

  if (isLocalSearchIntent(content)) {
    return 'Hermes is searching…';
  }

  if (isDiscoveryIntent(content)) {
    return 'Hermes is researching…';
  }

  return 'Hermes is preparing a response…';
}

function resolveSessionTitle(session: HermesCliSessionRecord) {
  if (session.title.trim().length > 0) {
    return truncate(session.title.trim(), 64);
  }

  if (session.preview.trim().length > 0) {
    return truncate(session.preview.trim(), 64);
  }

  return `Hermes ${session.id.slice(0, 8)}`;
}

function buildSessionSummary(session: HermesCliSessionRecord) {
  const detailParts = [session.preview ? truncate(session.preview, 96) : undefined, session.lastActive, session.source ? `via ${session.source}` : undefined].filter(Boolean);
  return detailParts.join(' · ') || 'Imported from Hermes CLI.';
}

function parseToolsList(output: string, profileId: string | null, timestamp: string): Tool[] {
  const normalized = normalizeOutput(output);
  if (!normalized) {
    return [];
  }

  const tools: Tool[] = [];
  let scope = 'cli';

  for (const rawLine of normalized.split('\n')) {
    const line = rawLine.trimEnd();
    const headingMatch = line.match(/^(?:Built-in toolsets|MCP tools)\s+\(([^)]+)\):$/u);
    if (headingMatch?.[1]) {
      scope = headingMatch[1];
      continue;
    }

    const toolMatch = line.match(/^\s*(?<marker>✓|✗)\s+(?<status>enabled|disabled)\s+(?<name>\S+)\s+(?<description>.+)$/u);
    if (!toolMatch?.groups?.name || !toolMatch.groups.description) {
      continue;
    }

    const enabled = toolMatch.groups.status === 'enabled';
    tools.push({
      id: `hermes:${scope}:${toolMatch.groups.name}`,
      profileId,
      source: 'hermes',
      scope,
      name: toolMatch.groups.name,
      description: toolMatch.groups.description.trim(),
      enabled,
      status: enabled ? 'enabled' : 'disabled',
      approvalModel: 'managed_by_hermes',
      capabilities: [toolMatch.groups.description.trim()],
      restrictions: ['Configured through the local Hermes CLI tool settings.'],
      lastSyncedAt: timestamp
    });
  }

  return tools;
}

function parseSkillsList(output: string, profileId: string, timestamp: string): Skill[] {
  const normalized = normalizeOutput(output);
  if (!normalized) {
    return [];
  }

  return normalized
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.startsWith('│'))
    .map((line) => line.split('│').slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 4 && cells[0] !== 'Name')
    .map((cells) => ({
      id: `${profileId}:${cells[0]}`,
      profileId,
      name: cells[0],
      summary: '',
      category: cells[1] ?? '',
      source: cells[2] ?? 'unknown',
      trust: cells[3] ?? 'unknown',
      lastSyncedAt: timestamp
    }));
}

function mapCliConfigToRuntimeConfig(profileId: string, config: HermesCliModelDiscovery['config']): RuntimeModelConfig {
  return {
    profileId,
    defaultModel: config.defaultModel,
    provider: config.provider,
    baseUrl: config.baseUrl,
    apiMode: config.apiMode,
    maxTurns: config.maxTurns,
    reasoningEffort: config.reasoningEffort,
    toolUseEnforcement: config.toolUseEnforcement,
    lastSyncedAt: config.lastSyncedAt
  };
}

function mapCliProviderToRuntimeProvider(profileId: string, provider: HermesCliModelDiscovery['providers'][number]): RuntimeProviderOption {
  return {
    id: provider.id,
    profileId,
    displayName: provider.displayName,
    authKind: provider.authKind,
    status: provider.status,
    credentialLabel: provider.credentialLabel,
    maskedCredential: provider.maskedCredential,
    source: provider.source,
    supportsApiKey: provider.supportsApiKey,
    supportsOAuth: provider.supportsOAuth,
    description: provider.description,
    notes: provider.notes,
    disabled: provider.disabled,
    disabledReason: provider.disabledReason,
    state: provider.state,
    stateMessage: provider.stateMessage,
    ready: provider.ready,
    modelSelectionMode: provider.modelSelectionMode,
    supportsDisconnect: provider.supportsDisconnect,
    validation: provider.validation,
    authSession: provider.authSession,
    supportsModelDiscovery: provider.supportsModelDiscovery,
    models: provider.models.map((model) => ({
      id: model.id,
      label: model.label,
      providerId: model.providerId ?? provider.id,
      description: model.description,
      disabled: model.disabled,
      disabledReason: model.disabledReason,
      supportsReasoningEffort: model.supportsReasoningEffort,
      reasoningEffortOptions: model.reasoningEffortOptions,
      metadata: model.metadata
    })),
    configurationFields: provider.configurationFields.map((field) => ({
      key: field.key,
      label: field.label,
      description: field.description,
      input: field.input,
      required: field.required,
      secret: field.secret,
      placeholder: field.placeholder,
      value: field.value,
      options: field.options,
      disabled: field.disabled,
      disabledReason: field.disabledReason
    })),
    setupSteps: provider.setupSteps.map((step) => ({
      id: step.id,
      kind: step.kind,
      title: step.title,
      description: step.description,
      status: step.status,
      actionLabel: step.actionLabel,
      actionUrl: step.actionUrl,
      command: step.command,
      metadata: step.metadata
    })),
    lastSyncedAt: provider.lastSyncedAt
  };
}

function mapCliDiscoveryToRuntimeState(profileId: string, discovery: HermesCliModelDiscovery): RuntimeProviderDiscoveryResult {
  const config = mapCliConfigToRuntimeConfig(profileId, discovery.config);
  const providers = discovery.providers.map((provider) => mapCliProviderToRuntimeProvider(profileId, provider));

  return {
    config,
    providers,
    runtimeReadiness: {
      ready: discovery.runtimeReadiness.ready,
      code: discovery.runtimeReadiness.code,
      message: discovery.runtimeReadiness.message,
      providerId: discovery.runtimeReadiness.providerId,
      modelId: discovery.runtimeReadiness.modelId
    },
    inspectedProviderId: discovery.inspectedProviderId,
    discoveredAt: discovery.discoveredAt
  };
}

function isEmailIntent(content: string) {
  return /\b(email|gmail|inbox|mail|unread)\b/i.test(content);
}

function isDiscoveryIntent(content: string) {
  return /\b(search|find|look up|lookup|discover|research|compare|recommend|recommendation|best|top)\b/i.test(content);
}

function isLocalSearchIntent(content: string) {
  return /\b(restaurant|restaurants|coffee|cafe|cafes|bar|bars|brunch|breakfast|lunch|dinner|food|hotel|hotels|nearby|near me|around me)\b/i.test(
    content
  );
}

export interface StructuredRecipeIntent {
  category: 'places' | 'shopping' | 'plan' | 'research' | 'finance' | 'results';
  preferredContentFormat: RecipeContentFormat;
  label: string;
}

export function classifyStructuredRecipeIntent(content: string, hasRecipeContext = false): StructuredRecipeIntent | null {
  // --- Domain-specific templates — checked first so generic keywords can't hijack them ---

  // Inbox triage / email cleanup  →  inbox-triage-board
  if (
    /\b(inbox triage|inbox triaging|inbox cleanup|email triage|triage my emails?|triage.*inbox|unread email|bulk archive|sender cleanup|clean up.*inbox|manage my inbox|email cleanup)\b/i.test(content) ||
    (isEmailIntent(content) && /\b(triaging?|clean up|cleanup|organize|sort|archive|manage|filter)\b/i.test(content))
  ) {
    return {
      category: 'results',
      preferredContentFormat: 'card',
      label: 'inbox triage'
    };
  }

  // Security review / audit  →  security-review-board
  if (/\b(security review|security audit|threat findings?|audit board|severity triage|vulnerability scan|penetration test|pentest|CVE|OWASP|threat model)\b/i.test(content)) {
    return {
      category: 'plan',
      preferredContentFormat: 'table',
      label: 'security review'
    };
  }

  // Job search / career pipeline  →  job-search-pipeline
  if (/\b(job search|job listings?|job postings?|career opportunities|open positions?|job hunt|job pipeline|find.*jobs?|apply.*jobs?|hiring pipeline)\b/i.test(content)) {
    return {
      category: 'results',
      preferredContentFormat: 'card',
      label: 'job search'
    };
  }

  // Flight comparison  →  flight-comparison
  if (
    /\b(flight comparison|compare flights?|airline options?|compare itineraries|outbound.*return|round.?trip.*flights?)\b/i.test(content) ||
    (/\b(flights?|airlines?)\b/i.test(content) && /\b(compare|book|options?|itinerary|search|find)\b/i.test(content))
  ) {
    return {
      category: 'places',
      preferredContentFormat: 'table',
      label: 'flight comparison'
    };
  }

  // Travel itinerary / trip planning  →  travel-itinerary-planner  (before generic plan)
  if (/\b(trip itinerary|travel itinerary|travel planner|travel plan|itinerary for.*trip|plan.*trip|trip plan|packing list|bookings? and packing|trip notes|travel notes)\b/i.test(content)) {
    return {
      category: 'places',
      preferredContentFormat: 'card',
      label: 'travel planner'
    };
  }

  // Event planning  →  event-planner  (before generic plan)
  if (/\b(event planner|plan.*event|event checklist|venue and guests|plan.*party|plan.*wedding|plan.*birthday|plan.*conference|plan.*dinner party|host.*event|plan.*celebration)\b/i.test(content)) {
    return {
      category: 'plan',
      preferredContentFormat: 'card',
      label: 'event planner'
    };
  }

  // Content / campaign planning  →  content-campaign-planner
  if (/\b(campaign planner|content plan|content calendar|campaign ideas?|marketing plan|newsletter plan|content ideas?|drafts? and schedule|social media plan|launch campaign)\b/i.test(content)) {
    return {
      category: 'plan',
      preferredContentFormat: 'card',
      label: 'campaign planner'
    };
  }

  // Price comparison (specific shopping intent)  →  price-comparison-grid
  if (/\b(price comparison|compare prices?|cheapest|best price|merchant grid|same product|best deal)\b/i.test(content)) {
    return {
      category: 'shopping',
      preferredContentFormat: 'table',
      label: 'price comparison'
    };
  }

  // --- Local discovery templates — specific before generic ---

  // Restaurant finder  →  restaurant-finder
  if (
    /\b(restaurants? nearby|restaurants? near|dinner options?|places to eat|restaurant shortlist|find.*restaurants?)\b/i.test(content) ||
    (/\b(restaurants?|brunch|dinner)\b/i.test(content) && /\b(nearby|near me|around me)\b/i.test(content))
  ) {
    return {
      category: 'places',
      preferredContentFormat: 'card',
      label: 'restaurant shortlist'
    };
  }

  // Hotel shortlist  →  hotel-shortlist
  if (
    /\b(hotel shortlist|where to stay|compare hotels?|lodging options?|hotels? near|hotels? in)\b/i.test(content) ||
    (/\b(hotels?|lodging|accommodation)\b/i.test(content) && /\b(nearby|near me|around me)\b/i.test(content))
  ) {
    return {
      category: 'places',
      preferredContentFormat: 'card',
      label: 'hotel shortlist'
    };
  }

  // General local discovery  →  local-discovery-comparison
  if (
    isLocalSearchIntent(content) ||
    /\b(lodging|lodgings?|stay|stays|places? nearby|venues?|coffee shops?|cafes?|service providers?|venue shortlist)\b/i.test(content)
  ) {
    return {
      category: 'places',
      preferredContentFormat: 'card',
      label: 'nearby places'
    };
  }

  // --- Planning templates ---

  // Project / action plan — no dedicated template; maps to research-notebook
  if (/\b(project plan|action plan|roadmap|timeline|milestones?|launch plan|implementation plan|rollout plan)\b/i.test(content)) {
    return {
      category: 'plan',
      preferredContentFormat: 'table',
      label: 'research notebook'
    };
  }

  if (
    /\b(engineering objective|engineering plan|technical plan|repo plan|refactor plan)\b/i.test(content) ||
    (
      /\b(findings?|tasks?|risks?|next actions?|refactor|migration|repo|repository|technical debt|architecture)\b/i.test(content) &&
      /\b(plan|organize|review|analy[sz]e|break down|implementation)\b/i.test(content)
    )
  ) {
    return {
      category: 'plan',
      preferredContentFormat: 'table',
      label: 'research notebook'
    };
  }

  if (/\b(architecture|app design|system design|technical design|API design|schema design|database design)\b/i.test(content)) {
    return {
      category: 'plan',
      preferredContentFormat: 'table',
      label: 'research notebook'
    };
  }

  // Step-by-step instructions  →  step-by-step-instructions
  // "guide" excluded — too generic and causes false positives across domain-specific templates
  if (/\b(how to|step by step|step-by-step|tutorial|walkthrough|set up|install|configure|deploy|getting started|quick start)\b/i.test(content)) {
    return {
      category: 'plan',
      preferredContentFormat: 'table',
      label: 'step by step'
    };
  }

  if (/\b(recommend|suggestion|advice|what should I|which should I|best approach|best practice)\b/i.test(content)) {
    return {
      category: 'plan',
      preferredContentFormat: 'table',
      label: 'research notebook'
    };
  }

  // Finance (no dedicated template; will fall through to generic in template selection)
  if (/\b(finance|financial|budget|budgets|expenses?|cost breakdown|line items?|portfolio|holdings|allocations?)\b/i.test(content)) {
    return {
      category: 'finance',
      preferredContentFormat: 'table',
      label: 'financial breakdown'
    };
  }

  // --- Comparison / shopping templates ---

  // Technology / vendor comparison matrix  →  vendor-evaluation-matrix  (before generic comparison)
  if (
    /\b(compare|comparison|vs\.?|versus)\b/i.test(content) &&
    /\b(frameworks?|vendors?|technologies|tools?|libraries?|services?|platforms?|apps?)\b/i.test(content)
  ) {
    return {
      category: 'shopping',
      preferredContentFormat: 'table',
      label: 'comparison matrix'
    };
  }

  // Generic shopping / comparison  →  shopping-shortlist
  if (
    /\b(compare|comparison|vs\.?|options|shortlist|candidates|shopping|buy|buying|products?|purchase|purchasing)\b/i.test(content)
  ) {
    return {
      category: 'shopping',
      preferredContentFormat: 'card',
      label: 'shopping results'
    };
  }

  // Natural-language product browsing — no explicit shopping verb but clear product intent.
  // Requires a product category noun AND at least one soft framing word to avoid false positives
  // (e.g. "some gym shorts I normally wear" or "headphones for running under $100").
  if (
    /\b(shorts?|shirt|shirts|pants|jeans|jacket|jackets|shoes|sneakers|boots|dress|dresses|hoodie|hoodies|sweater|leggings|activewear|sportswear|gym\s+\w+|workout\s+\w+|running\s+\w+)\b/i.test(content) ||
    /\b(headphones?|earbuds?|laptop|laptops?|monitor|keyboard|mouse|tablet|phone|speaker|camera|smartwatch|charger)\b/i.test(content) ||
    /\b(backpack|bag|bags|wallet|purse|sunglasses|jewelry|supplement|protein|vitamins?)\b/i.test(content)
  ) {
    if (
      /\b(some|for\s+(?:me|my|the|gym|running|work|summer|winter|training)|I\s+(?:wear|use|like|need|want|normally|usually)|normally\s+wear|usually\s+wear|looking\s+for|gift\s+for|under\s+\$?\d|around\s+\$?\d)\b/i.test(content)
    ) {
      return {
        category: 'shopping',
        preferredContentFormat: 'card',
        label: 'shopping results'
      };
    }
  }

  // Research notebook  →  research-notebook
  if (
    /\b(research|sources?|papers?|studies?|summary|summaries|tradeoffs?|pros and cons|claims?|notes?|notebook|follow-?ups?)\b/i.test(content) &&
    (
      isDiscoveryIntent(content) ||
      /\b(create|build|make|organize|gather|track|capture)\b.*\b(research|notes?|notebook|sources?|claims?|follow-?ups?)\b/i.test(content)
    )
  ) {
    return {
      category: 'research',
      preferredContentFormat: 'markdown',
      label: 'research notebook'
    };
  }

  if (
    isDiscoveryIntent(content) &&
    (/\b(results?|candidates?|options|shortlist|compare|comparison)\b/i.test(content) || hasRecipeContext)
  ) {
    return {
      category: 'results',
      preferredContentFormat: 'card',
      label: 'structured result set'
    };
  }

  return null;
}

/**
 * Detects when a user is asking to mutate an already-rendered recipe — changing its layout,
 * visual style, or content structure — rather than making a new query.
 *
 * Only fires when `attachedTemplateId` is non-null (recipe is open). Returns null for fresh
 * recipe requests or plain conversational messages so enrichment is not triggered spuriously.
 */
export function classifyRecipeMutationIntent(
  content: string,
  attachedTemplateId: string | null
): RecipeMutationIntent | null {
  const text = content.trim().toLowerCase();
  if (text.length < 5) return null;

  // High-confidence layout/switch verbs: these must be combined with a UI keyword to avoid
  // false positives on messages like "I'd like to change my approach".
  const layoutVerbPattern = /\b(redo|redesign|change.*look|make it|convert it|switch to|show as|render as|reshape|display as|turn.*into|use a|let'?s use|try a|can you make|could you make)\b/i;
  const switchPattern = /\b(different recipe|other recipe|another recipe|wrong recipe|new recipe|replace.*recipe|change.*recipe)\b/i;

  const wantsImages = /\b(pictures?|images?|photos?|thumbnails?|logos?|visuals?|more visual|photo[s ]|imagery)\b/i.test(content);
  const wantsCards = /\b(cards?|tiles?|tiled|card[- ]grid|card[- ]view|gallery)\b/i.test(content);
  const wantsCharts = /\b(charts?|graphs?|bar chart|line chart|pie chart|pie graph|visualization|visualize)\b/i.test(content);
  const wantsTable = /\b(table|matrix|side[- ]by[- ]side|comparison table|tabular)\b/i.test(content);
  const wantsKanban = /\b(kanban|board|stages?|pipeline|columns?\s+with\s+cards?)\b/i.test(content);
  const wantsTimeline = /\b(timeline|chronological|time[- ]ordered|sequence)\b/i.test(content);
  const wantsFewerItems = /\b(fewer|less|top\s+\d+|only\s+(show|the top)|trim|cut down|focus on|just\s+(the top|show))\b/i.test(content);
  const wantsMoreItems = /\bmore\b.{0,30}\b(options?|results?|items?|cards?|choices?)\b/i.test(content);

  const hasVisualKeyword = wantsImages || wantsCards || wantsCharts || wantsTable || wantsKanban || wantsTimeline;
  const hasCountKeyword = wantsFewerItems || wantsMoreItems;
  const hasLayoutVerb = layoutVerbPattern.test(content);
  const isExplicitSwitch = switchPattern.test(content);

  // Need at least one positive signal to avoid false positives.
  if (!hasVisualKeyword && !hasCountKeyword && !hasLayoutVerb && !isExplicitSwitch) return null;

  // Without an existing template, only fire on strong visual signals (images or cards) to
  // avoid treating plain conversational recipe mentions as mutation requests.
  if (!attachedTemplateId && !wantsImages && !wantsCards && !wantsCharts) return null;

  // Reject plain-chat follow-ups that mention these words without mutation intent.
  // E.g., "can you show me more about the first card?" — single-item about-query, not layout mutation.
  const isFollowUpQuery = !hasLayoutVerb && !isExplicitSwitch && !hasVisualKeyword && hasCountKeyword;
  if (isFollowUpQuery && /\b(about|for|of|on|regarding)\b/i.test(content)) return null;

  // Derive the most likely target template hint from the signal combination.
  const targetTemplateHint: string | undefined =
    isExplicitSwitch ? undefined :
    wantsKanban ? 'job-search-pipeline' :
    wantsCharts ? 'vendor-evaluation-matrix' :
    (wantsCards && wantsImages) ? 'shopping-shortlist' :
    wantsTable ? 'vendor-evaluation-matrix' :
    wantsTimeline ? 'travel-itinerary-planner' :
    wantsCards ? 'shopping-shortlist' :
    undefined;

  const kind: RecipeMutationIntent['kind'] =
    isExplicitSwitch ? 'switch_recipe' :
    (wantsImages || wantsCharts) ? 'change_visual' :
    (wantsCards || wantsTable || wantsKanban || wantsTimeline) ? 'change_layout' :
    (wantsFewerItems || wantsMoreItems) ? 'refine_existing' :
    hasLayoutVerb ? 'change_layout' : 'refine_existing';

  const hintParts = [
    wantsImages && 'images',
    wantsCards && 'cards',
    wantsCharts && 'charts',
    wantsTable && 'table',
    wantsKanban && 'kanban',
    wantsTimeline && 'timeline',
    wantsFewerItems && 'fewer items',
    wantsMoreItems && 'more items'
  ].filter(Boolean).join(', ');

  return {
    kind,
    wantsImages,
    wantsCards,
    wantsCharts,
    wantsTable,
    wantsKanban,
    wantsTimeline,
    wantsFewerItems,
    wantsMoreItems,
    targetTemplateHint,
    mutationSummary: `User is asking to mutate the current recipe layout/appearance. Kind: ${kind}. Hints: ${hintParts || 'none'}. Current template: ${attachedTemplateId}.${targetTemplateHint ? ` Suggested new template: ${targetTemplateHint}.` : ''}`
  };
}

function isRecipeWorkflowIntent(content: string, hasRecipeContext = false) {
  if (hasRecipeContext) {
    return /\b(recipe|recipe|table|card|cards|markdown|note|board|tracker|refresh|update|revise|rerun)\b/i.test(content);
  }

  return /\b(create|build|make|update|refresh|revise|rename|delete|remove|organize|convert|turn|rerun|repeat)\b.*\b(recipe|recipe|table|card|cards|markdown|note|board|tracker)\b/i.test(
    content
  );
}

function isSimpleRecipeWorkflowIntent(content: string, hasRecipeContext = false) {
  if (!isRecipeWorkflowIntent(content, hasRecipeContext)) {
    return false;
  }

  if (isLocalSearchIntent(content) || isDiscoveryIntent(content)) {
    return false;
  }

  return !/\b(research|compare|analy[sz]e|investigate|search|discover|nearby|near me|around me|restaurants?|hotels?|coffee|cafe)\b/i.test(
    content
  );
}

function resolveIntentContent(
  content: string,
  refreshContext?: {
    intentPrompt: string;
  } | null
) {
  const refreshPrompt = refreshContext?.intentPrompt?.trim();
  return refreshPrompt && refreshPrompt.length > 0 ? refreshPrompt : content;
}

export function resolveHermesChatTimeoutMs(options: Pick<
  HermesChatStreamOptions,
  | 'content'
  | 'refreshContext'
  | 'spaceContext'
  | 'structuredArtifactOnly'
  | 'recipeAppletStage'
  | 'timeoutMs'
  | 'discoveryTimeoutMs'
  | 'nearbySearchTimeoutMs'
  | 'recipeOperationTimeoutMs'
  | 'unrestrictedTimeoutMs'
  | 'unrestrictedAccessEnabled'
>) {
  const normalTimeoutMs = options.timeoutMs;
  const discoveryTimeoutMs = options.discoveryTimeoutMs ?? Math.max(normalTimeoutMs, 240_000);
  const nearbyTimeoutMs = options.nearbySearchTimeoutMs ?? Math.max(discoveryTimeoutMs, 300_000);
  const spaceTimeoutMs = options.recipeOperationTimeoutMs ?? Math.max(normalTimeoutMs, 180_000);
  const unrestrictedTimeoutMs = options.unrestrictedTimeoutMs ?? Math.max(normalTimeoutMs, 1_800_000);
  const intentContent = resolveIntentContent(options.content, options.refreshContext);
  const structuredRecipeIntent = classifyStructuredRecipeIntent(intentContent, Boolean(options.spaceContext));

  if (options.structuredArtifactOnly) {
    return Math.max(15_000, Math.min(spaceTimeoutMs, 90_000));
  }

  if (options.recipeAppletStage) {
    return Math.max(15_000, Math.min(spaceTimeoutMs, 30_000));
  }

  if (options.unrestrictedAccessEnabled) {
    return unrestrictedTimeoutMs;
  }

  if (isRecipeWorkflowIntent(intentContent, Boolean(options.spaceContext))) {
    return spaceTimeoutMs;
  }

  if (isLocalSearchIntent(intentContent)) {
    return nearbyTimeoutMs;
  }

  if (isEmailIntent(intentContent) || isDiscoveryIntent(intentContent)) {
    return discoveryTimeoutMs;
  }

  if (structuredRecipeIntent) {
    return Math.max(spaceTimeoutMs, normalTimeoutMs);
  }

  return normalTimeoutMs;
}

function buildBridgeChatQuery(
  profile: Pick<Profile, 'id'>,
  content: string,
  spaceContext?: HermesChatStreamOptions['spaceContext'],
  refreshContext?: HermesChatStreamOptions['refreshContext'],
  options: {
    structuredArtifactOnly?: boolean;
    recipeAppletStage?: RecipeAppletStage;
  } = {}
) {
  const intentContent = resolveIntentContent(content, refreshContext);
  const structuredRecipeIntent = classifyStructuredRecipeIntent(intentContent, Boolean(spaceContext));
  const activeProfileInstruction = `Bridge execution note: The active Hermes profile is ${profile.id}. Use only this active profile's auth state, sessions, tools, skills, and HERMES_HOME. Do not inspect or use other Hermes profiles, do not run profile-discovery checks, and do not report results from any other profile.`;

  if (options.structuredArtifactOnly) {
    return `${content}

${activeProfileInstruction}
This is a dedicated bridge-managed structured artifact generation step.
Do not use tools, commands, code execution, approvals, or external requests.
Return only one JSON object that matches the requested minimal Hermes recipe seed schema.
Do not emit prose, markdown, code fences, or trailing text.
Compatibility fallback only if raw JSON is impossible: emit one hermes-recipe-data start marker followed immediately by the same JSON object, with no closing fence.
The schema contains only base recipe seed data: schemaVersion, recipe, rawData, assistantContext, and optional semantic/action/intent hints.
Do not emit normalizedData, uiSpec, actionSpec, testSpec, or other app-final recipe structures.`;
  }

  if (options.recipeAppletStage) {
    const stageInstruction =
      options.recipeAppletStage === 'source'
        ? `This is a dedicated bridge-managed recipe applet source generation step.
Return only one TSX module and nothing else.
Import only from recipe-applet-sdk.
Do not emit markdown fences, prose, tool output, commentary, or trailing text.
Do not use tools, commands, code execution, approvals, or outbound requests.`
        : `This is a dedicated bridge-managed recipe applet repair step.
Return only one corrected TSX module and nothing else.
Import only from recipe-applet-sdk.
Do not emit markdown fences, prose, tool output, commentary, or trailing text.
Do not use tools, commands, code execution, approvals, or outbound requests.`;

    return `${content}

${activeProfileInstruction}
${stageInstruction}`;
  }

  const spaceDataInstruction = `Do not embed structured recipe artifacts inside the normal conversational answer.
The bridge will request recipe artifacts separately through a dedicated structured-only step when it needs them.
If you must delete the current local Recipe, emit exactly one legacy delete block instead:
\`\`\`hermes-ui-recipes
{"operations":[{"type":"delete_space","target":"current"}]}
\`\`\`
Do not emit hermes-recipe-data blocks in the conversational answer.`;
  const recipeInstruction = spaceContext
    ? `The active local Recipe for this request is:
Recipe ID: ${spaceContext.id}
Title: ${spaceContext.title}
Content format: ${spaceContext.contentFormat}
Status: ${spaceContext.status}
Description: ${spaceContext.description ?? '(none)'}
Metadata: ${JSON.stringify(spaceContext.metadata)}
Data snapshot:
${spaceContext.data}

${spaceDataInstruction}`
    : `${spaceDataInstruction}`;
  const refreshInstruction = refreshContext
    ? `This request is a refresh of the current attached Recipe.
User-visible refresh action: ${content || RECIPE_REFRESH_USER_MESSAGE}
Use the original structured request below as the scope of truth, even if later conversation drifted to other topics.
Original request:
${refreshContext.intentPrompt}
Refresh context source: ${refreshContext.source}
Update the current attached Recipe in this same response.
Do not create a new recipe.
Replace stale items instead of appending duplicate copies of older results.
Do not emit any structured artifact in the conversational answer; the bridge will request it separately.
Keep the conversational answer short and focus on what changed or was refreshed.`
    : '';
  const structuredRecipeInstruction = structuredRecipeIntent
    ? `${spaceContext ? 'Update the current attached Recipe.' : 'Create exactly one attached Recipe in this same request.'}
This request naturally benefits from a structured local artifact for ${structuredRecipeIntent.label}, even if the user did not mention Recipes explicitly.
Do not create an empty shell. The bridge will request only a minimal recipe seed through a separate structured-only artifact step.
That seed should contain meaningful rawData plus assistantContext and optional semantic, action, or intent hints only.
Do not emit normalizedData, uiSpec, actionSpec, testSpec, or other app-final recipe schema in the conversational answer.
Prefer ${structuredRecipeIntent.preferredContentFormat} content as the primary structured representation.
When listings have reliable destinations, include first-class website, booking, menu, map, place, or email links in the structured data. Include small optional image URLs only for card-oriented content when they add value.
If you cannot populate a valid structured Recipe in this request, do not mention internal parsing or JSON. Return only the conversational answer.`
    : '';

  if (isEmailIntent(intentContent)) {
    return `${content}

${activeProfileInstruction}
${recipeInstruction}
${refreshInstruction}
${structuredRecipeInstruction}
Use the preloaded google-workspace skill or Gmail capability for email tasks in this active profile.
If Google Recipe is unavailable or missing scopes in this active profile, say so clearly, explain the minimum next step for ${profile.id}, and stop instead of searching other profiles.
Do not fall back to himalaya unless the user explicitly asks for it.
Do not include raw tool output, CLI diagnostics, JSON blobs, scripts, approvals, or turn-limit traces in the final answer.
Return only the final assistant answer.`;
  }

  // Detect when the user wants to reformat or repopulate an existing recipe visually —
  // e.g. "make it look like cards with pictures" or "show as a gallery". These requests
  // need real data extraction from the session, not a narrow one-liner acknowledgment.
  const isVisualRepopulation = Boolean(spaceContext) &&
    /\b(pictures?|images?|photos?|cards?|tiles?|gallery|visuals?|show as|render as|display as|more like|look like)\b/i.test(intentContent);

  if (isRecipeWorkflowIntent(intentContent, Boolean(spaceContext))) {
    // When a data-type structured intent is detected alongside a recipe workflow keyword
    // (e.g. "render them using the shopping results recipe"), the user wants real data
    // populated into the new format — not a narrow administrative update. Fall through
    // to the data-type routing below so structuredRecipeInstruction drives the response.
    if (structuredRecipeIntent) {
      // intentional fall-through — handled by the general path below
    } else if (isVisualRepopulation) {
      // Visual format change on an existing recipe (e.g. "make it look like cards with
      // pictures"). Tell Hermes to extract and repopulate real data, not just confirm.
      const repopulateHint = `The user is asking to change how the current recipe looks.
The existing recipe content is shown above in the Data snapshot.
Re-populate the recipe seed with the actual data from the current recipe and conversation — do not just confirm a format change.
Extract the real items (products, listings, results, etc.) from the existing content and include them as meaningful rawData in the recipe seed.
Prefer card content with images/photos where available.
Provide a short confirmation describing what was updated, but ensure the recipe seed contains the extracted real data.`;
      return `${content}

${activeProfileInstruction}
${recipeInstruction}
${refreshInstruction}
${structuredRecipeInstruction}
${repopulateHint}
Do not include raw tool output, CLI diagnostics, JSON blobs, scripts, or command traces in the final answer.
Return only the final assistant answer.`;
    } else {
      return `${content}

${activeProfileInstruction}
${recipeInstruction}
${refreshInstruction}
${structuredRecipeInstruction}
Treat this as a narrow structured recipe request, not a large autonomous task.
If one direct create, update, mark-changed, or delete operation can satisfy the request, do only that.
When creating or reshaping a recipe, keep the title short, the description brief, and the structured data minimal but meaningfully populated for the requested view.
Bias toward a single structured operation and a short confirmation.
Avoid terminal commands, scripts, code execution, or repeated tool exploration unless the user explicitly asked for outside research.
Do not include raw tool output, CLI diagnostics, JSON blobs, scripts, or command traces in the final answer.
Return only the final assistant answer.`;
    }
  }

  if (isLocalSearchIntent(intentContent)) {
    return `${content}

${activeProfileInstruction}
${recipeInstruction}
${refreshInstruction}
${structuredRecipeInstruction}
If this request involves nearby places, restaurants, or local businesses, keep the search scoped to the exact location the user named.
Prefer one concise nearby-search pass and a short verified shortlist over long setup narration.
If this request naturally produces a shortlist, create or update the local attached Recipe in the same response with that shortlist.
Do not inspect the local repository or recipe for nearby-search requests.
Do not use read_file, open, cat, ls, execute_code, python, shell, or repeated exploratory tool loops unless the user explicitly asked for code or local file analysis.
If you need prices or rates, inspect only the smallest number of candidate listings needed to produce a useful shortlist, then stop.
If you can only get partial local-search results within the time budget, say that clearly and return the best verified shortlist you have.
Do not include raw tool output, CLI startup banners, JSON blobs, scripts, or command traces in the final answer.
Return only the final assistant answer.`;
  }

  if (isDiscoveryIntent(intentContent)) {
    return `${content}

${activeProfileInstruction}
${recipeInstruction}
${refreshInstruction}
${structuredRecipeInstruction}
Keep discovery requests focused and concise.
Prefer a useful shortlist or direct answer over long setup narration.
Do not include raw tool output, CLI startup banners, JSON blobs, scripts, or command traces in the final answer.
Return only the final assistant answer.`;
  }

  return `${content}

${activeProfileInstruction}
${recipeInstruction}
${refreshInstruction}
${structuredRecipeInstruction}
${isSimpleRecipeWorkflowIntent(intentContent, Boolean(spaceContext)) ? 'Treat this as a single-step recipe action when possible. Do not expand into a longer autonomous workflow.' : ''}
Return only the final assistant answer.
  Do not include CLI startup banners, tool inventories, tool output, scripts, JSON blobs, or turn-limit summaries in the final answer.`;
}

function buildRecipeAppletArtifactQuery(
  profile: Pick<Profile, 'id'>,
  prompt: string,
  stage: RecipeAppletStage
) {
  const stageLabel = stage === 'source' ? 'source generation' : 'repair';

  return `${prompt}

Bridge execution note: The active Hermes profile is ${profile.id}. This is a dedicated bridge-managed recipe applet ${stageLabel} step.
Artifact-only contract:
- The original Hermes task is already complete.
- Work only from the persisted bridge artifacts and local bridge context in this prompt.
- Do not use tools, skills, commands, code execution, approvals, or outbound requests.
- Do not check email again, rerun search/discovery, refresh the attached recipe, fetch data again, or modify external systems.
- Do not resume the live task, inspect other Hermes profiles, or perform the original request again.
- If the artifact context is insufficient, stay conservative within the requested output contract instead of doing more work.
Return only the requested artifact output with no prose, markdown fences, or trailing commentary.`;
}

function buildRecipeDslArtifactQuery(
  profile: Pick<Profile, 'id'>,
  prompt: string,
  stage: RecipeDslStage
) {
  const stageLabel = stage === 'generate' ? 'generation' : 'repair';

  return `${prompt}

Bridge execution note: The active Hermes profile is ${profile.id}. This is a dedicated bridge-managed recipe DSL ${stageLabel} step.
Artifact-only contract:
- The original Hermes task is already complete.
- Work only from the persisted bridge artifacts and local bridge context in this prompt.
- Do not use tools, skills, commands, code execution, approvals, or outbound requests.
- Do not check email again, rerun search/discovery, refresh the attached recipe, fetch data again, or modify external systems.
- Do not resume the live task, inspect other Hermes profiles, or perform the original request again.
- If the artifact context is insufficient, stay conservative and emit a valid minimal DSL overlay instead of doing more work.
Output contract:
- Return only one JSON object.
- Do not emit prose, markdown, code fences, comments, or trailing text.
- Emit the compact authoring DSL: kind "recipe_dsl", schemaVersion "recipe_dsl/v2".
- Do not emit TSX, views, the final recipe_model, recipe_patch, or raw entities/collections graph objects.
- Use stable literal ids from the prompt context and keep the output within the compact contract packet included in the prompt.`;
}

function buildRecipeTemplateArtifactQuery(
  profile: Pick<Profile, 'id'>,
  prompt: string,
  stage: RecipeTemplateStage
) {
  const outputInstruction =
    stage === 'select'
      ? 'Return only one JSON object with kind "recipe_template_selection" and schemaVersion "recipe_template_selection/v2".'
      : stage === 'text' || stage === 'text_repair'
        ? 'Return only one JSON object with kind "recipe_template_text" and schemaVersion "recipe_template_text/v1".'
        : stage === 'hydrate'
          ? 'Return only one JSON object with kind "recipe_template_hydration" and schemaVersion "recipe_template_hydration/v1".'
        : stage === 'actions' || stage === 'actions_repair'
          ? 'Return only one JSON object with kind "recipe_template_actions" and schemaVersion "recipe_template_actions/v1".'
          : 'Return only one recipe template JSON object.';

  return `${prompt}

Bridge execution note: The active Hermes profile is ${profile.id}. This is a dedicated bridge-managed recipe template ${stage} step.
Artifact-only contract:
- The original Hermes task is already complete.
- Work only from the persisted bridge artifacts and local bridge context in this prompt.
- Do not use tools, skills, commands, code execution, approvals, or outbound requests.
- Do not check email again, rerun search/discovery, refresh the attached recipe, fetch data again, or modify external systems.
- Do not resume the live task, inspect other Hermes profiles, or perform the original request again.
- If the artifact context is insufficient, stay conservative and emit the smallest valid template artifact.
Output contract:
- ${outputInstruction}
- Do not emit prose, markdown, code fences, comments, or trailing text.
- Use only template ids, slot ids, action ids, and update operations that are explicitly allowed in the prompt.
- Never invent a freeform layout, recipe_dsl payload, recipe_model, or TSX source.`;
}

function buildRecipeTemplateCorrectionQuery(
  profile: Pick<Profile, 'id'>,
  correctionPrompt: string,
  stage: RecipeTemplateStage
) {
  const outputInstruction =
    stage === 'select'
      ? 'Return only one JSON object with kind "recipe_template_selection" and schemaVersion "recipe_template_selection/v2".'
      : stage === 'text' || stage === 'text_repair'
        ? 'Return only one JSON object with kind "recipe_template_text" and schemaVersion "recipe_template_text/v1".'
        : stage === 'hydrate'
          ? 'Return only one JSON object with kind "recipe_template_hydration" and schemaVersion "recipe_template_hydration/v1".'
        : stage === 'actions' || stage === 'actions_repair'
          ? 'Return only one JSON object with kind "recipe_template_actions" and schemaVersion "recipe_template_actions/v1".'
          : 'Return only one recipe template JSON object.';

  return `${correctionPrompt}

Bridge execution note: The active Hermes profile is ${profile.id}. This is a same-session correction turn for recipe template ${stage}.
Your previous response in this session did not match the required schema. Fix the output now.
Artifact-only contract:
- The original Hermes task is already complete.
- Do not use tools, skills, commands, code execution, approvals, or outbound requests.
- Do not redo the task, fetch data again, or invent new content not present in the prior turn.
- Fix only the schema shape. Preserve the semantic meaning from your previous response.
Output contract:
- ${outputInstruction}
- Do not emit prose, markdown, code fences, comments, or trailing text.
- Return only corrected JSON.`;
}

function validateRecipeAppletArtifactPrompt(prompt: string) {
  const trimmed = prompt.trim();
  if (!trimmed) {
    throw new HermesCliRecipeAppletContextError('Recipe applet generation requires a non-empty artifact-only prompt.');
  }

  const forbiddenPatterns = [
    {
      pattern: /(^|\n)\s*Original prompt:/iu,
      message: 'Recipe applet generation prompt still includes the raw original task prompt.'
    },
    {
      pattern: /(^|\n)\s*Original request:/iu,
      message: 'Recipe applet generation prompt still includes the raw original request.'
    },
    {
      pattern: /(^|\n)\s*Use the preloaded google-workspace skill\b/iu,
      message: 'Recipe applet generation prompt leaked a live operational skill instruction.'
    },
    {
      pattern: /(^|\n)\s*Update the current attached Recipe in this same response\b/iu,
      message: 'Recipe applet generation prompt leaked live recipe mutation instructions.'
    },
    {
      pattern: /(^|\n)\s*Create exactly one attached Recipe in this same request\b/iu,
      message: 'Recipe applet generation prompt leaked live recipe creation instructions.'
    },
    {
      pattern: /(^|\n)\s*This request is a refresh of the current attached Recipe\b/iu,
      message: 'Recipe applet generation prompt leaked live refresh instructions.'
    },
    {
      pattern: new RegExp(`(^|\\n)\\s*${RECIPE_REFRESH_USER_MESSAGE.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}(\\n|$)`, 'iu'),
      message: 'Recipe applet generation prompt leaked the synthetic refresh request text.'
    }
  ];

  for (const rule of forbiddenPatterns) {
    if (rule.pattern.test(trimmed)) {
      throw new HermesCliRecipeAppletContextError(rule.message);
    }
  }
}

function validateRecipeDslArtifactPrompt(prompt: string) {
  const trimmed = prompt.trim();
  if (!trimmed) {
    throw new HermesCliRecipeAppletContextError('Recipe DSL generation requires a non-empty artifact-only prompt.');
  }

  validateRecipeAppletArtifactPrompt(trimmed);
}

function validateRecipeTemplateArtifactPrompt(prompt: string) {
  const trimmed = prompt.trim();
  if (!trimmed) {
    throw new HermesCliRecipeAppletContextError('Recipe template generation requires a non-empty artifact-only prompt.');
  }

  validateRecipeAppletArtifactPrompt(trimmed);
}

function isRecipeAppletLiveTaskActivity(activity: ChatActivity) {
  return activity.kind === 'tool' || activity.kind === 'skill' || activity.kind === 'command' || activity.kind === 'approval';
}

function describeRecipeAppletActivity(activity: ChatActivity) {
  const detail = activity.detail?.trim();
  if (detail && detail.length > 0) {
    return `${activity.kind}:${activity.label} (${detail})`;
  }

  return `${activity.kind}:${activity.label}`;
}

function buildProfileEnvironment(profile: Pick<Profile, 'path'> | null | undefined) {
  if (!profile?.path) {
    return {
      ...process.env,
      NO_COLOR: '1',
      TERM: 'dumb'
    };
  }

  return {
    ...process.env,
    HERMES_HOME: profile.path,
    NO_COLOR: '1',
    TERM: 'dumb'
  };
}

export interface HermesChatStreamOptions {
  profile: Profile;
  runtimeSessionId?: string;
  content: string;
  requestMode?: ChatRequestMode;
  structuredArtifactOnly?: boolean;
  recipeAppletStage?: RecipeAppletStage;
  spaceContext?: {
    id: string;
    title: string;
    description?: string;
    contentFormat: RecipeContentFormat;
    status: Recipe['status'];
    metadata: Recipe['metadata'];
    data: string;
  } | null;
  refreshContext?: {
    intentPrompt: string;
    source: 'recipe_metadata' | 'recipe_event' | 'session_history' | 'recipe_snapshot';
  } | null;
  requestId?: string | null;
  timeoutMs: number;
  discoveryTimeoutMs?: number;
  nearbySearchTimeoutMs?: number;
  recipeOperationTimeoutMs?: number;
  unrestrictedTimeoutMs?: number;
  maxTurns: number;
  unrestrictedAccessEnabled: boolean;
  onProgress?: (message: string) => void;
  onActivity?: (activity: ChatActivity) => void;
  onAssistantSnapshot?: (markdown: string) => void;
}

export interface HermesCliOptions {
  cliPath?: string;
  runner?: HermesCliRunner;
  workingDirectory?: string;
  timeoutMs?: number;
  now?: () => string;
}

export class HermesCli {
  private readonly runner: HermesCliRunner;
  private readonly cliPath: string;
  private readonly timeoutMs: number;
  private readonly workingDirectory: string;
  private readonly now: () => string;

  constructor(options: HermesCliOptions = {}) {
    const cliPath = options.cliPath ?? process.env.HERMES_CLI_PATH ?? 'hermes';
    this.cliPath = cliPath;
    this.runner = options.runner ?? createDefaultHermesCliRunner(cliPath);
    this.workingDirectory = options.workingDirectory ?? process.cwd();
    this.timeoutMs = options.timeoutMs ?? 45_000;
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async getVersion(): Promise<string | null> {
    try {
      const result = await this.run(['--version']);
      const output = normalizeOutput(result.stdout);
      const match = output.match(/v?([\d]+\.[\d]+\.[\d]+)/);
      return match?.[1] ?? null;
    } catch {
      return null;
    }
  }

  private run(args: string[], env = process.env, signal?: AbortSignal) {
    return this.runner.run(args, {
      cwd: this.workingDirectory,
      env: {
        ...env,
        NO_COLOR: '1',
        TERM: 'dumb'
      },
      timeoutMs: this.timeoutMs,
      signal
    });
  }

  private async runExecutable(
    command: string,
    args: string[],
    env = process.env,
    signal?: AbortSignal,
    timeoutMs = this.timeoutMs
  ) {
    return new Promise<HermesCliExecutionResult>((resolve, reject) => {
      execFile(
        command,
        args,
        {
          cwd: this.workingDirectory,
          env: {
            ...env,
            NO_COLOR: '1',
            TERM: 'dumb'
          },
          timeout: timeoutMs,
          signal,
          encoding: 'utf8',
          maxBuffer: 10 * 1024 * 1024
        },
        (error, stdout, stderr) => {
          if (error?.name === 'AbortError') {
            reject(error);
            return;
          }

          resolve({
            stdout: typeof stdout === 'string' ? stdout : '',
            stderr: typeof stderr === 'string' ? stderr : '',
            exitCode: error ? ((error as ExecFileException).code as number | undefined) ?? 1 : 0
          });
        }
      );
    });
  }

  private resolveGoogleRecipePaths() {
    const hermesRoot = path.join(os.homedir(), '.hermes');
    const codebasePath = process.env.HERMES_CODEBASE ?? path.join(hermesRoot, 'hermes-agent');
    const pythonPath =
      process.env.HERMES_PYTHON ??
      path.join(codebasePath, 'venv', 'bin', process.platform === 'win32' ? 'python.exe' : 'python3');
    const scriptPath = path.join(hermesRoot, 'skills', 'productivity', 'google-workspace', 'scripts', 'google_api.py');

    return {
      codebasePath,
      pythonPath,
      scriptPath
    };
  }

  async listProfiles(signal?: AbortSignal) {
    const listResult = await this.run(['profile', 'list'], process.env, signal);
    if (listResult.exitCode !== 0) {
      throw new Error(listResult.stderr.trim() || 'Failed to list Hermes profiles.');
    }

    const listedProfiles = parseProfileList(listResult.stdout);
    const detailedProfiles: Profile[] = [];

    for (const listedProfile of listedProfiles) {
      const showResult = await this.run(['profile', 'show', listedProfile.id], process.env, signal);
      if (showResult.exitCode !== 0) {
        throw new Error(showResult.stderr.trim() || `Failed to load Hermes profile ${listedProfile.id}.`);
      }

      const detailedProfile = parseProfileShow(listedProfile.id, showResult.stdout, listedProfile.isActive);
      detailedProfiles.push(
        toProfile({
          ...detailedProfile,
          model: listedProfile.model || detailedProfile.model,
          gateway: listedProfile.gateway || detailedProfile.gateway,
          alias: listedProfile.alias ?? detailedProfile.alias
        })
      );
    }

    return detailedProfiles;
  }

  async listSessions(profile: Profile, limit = 500, signal?: AbortSignal): Promise<Session[]> {
    const timestamp = this.now();
    const env = buildProfileEnvironment(profile);
    const result = await this.run(['sessions', 'list', '--limit', String(limit)], env, signal);
    if (result.exitCode !== 0) {
      throw new Error(result.stderr.trim() || `Failed to list Hermes sessions for ${profile.id}.`);
    }

    return parseSessionsList(result.stdout).map((session) => ({
      id: session.id,
      runtimeSessionId: session.id,
      title: resolveSessionTitle(session),
      summary: buildSessionSummary(session),
      source: 'hermes_cli',
      lastUpdatedAt: parseSessionListTimestamp(session.lastActive, timestamp) ?? timestamp,
      lastUsedProfileId: profile.id,
      associatedProfileIds: [profile.id],
      messageCount: 0,
      attachedRecipeId: null,
      recipeType: 'tui'
    }));
  }

  async deleteSession(
    profile: Profile,
    session: Pick<Session, 'id' | 'runtimeSessionId'>,
    signal?: AbortSignal
  ) {
    const env = buildProfileEnvironment(profile);
    const sessionId = session.runtimeSessionId ?? session.id;
    const result = await this.run(['sessions', 'delete', '--yes', sessionId], env, signal);
    if (result.exitCode !== 0) {
      throw new Error(result.stderr.trim() || `Failed to delete Hermes session ${sessionId}.`);
    }
  }

  async renameSession(
    profile: Profile,
    session: Pick<Session, 'id' | 'runtimeSessionId'>,
    title: string,
    signal?: AbortSignal
  ) {
    const env = buildProfileEnvironment(profile);
    const sessionId = session.runtimeSessionId ?? session.id;
    const result = await this.run(['sessions', 'rename', sessionId, title], env, signal);
    if (result.exitCode !== 0) {
      throw new Error(result.stderr.trim() || `Failed to rename Hermes session ${sessionId}.`);
    }
  }

  async exportSessionMessages(
    profile: Profile,
    session: Pick<Session, 'id' | 'runtimeSessionId'>,
    signal?: AbortSignal
  ): Promise<ChatMessage[]> {
    if (!session.runtimeSessionId) {
      return [];
    }

    const timestamp = this.now();
    const env = buildProfileEnvironment(profile);
    const result = await this.run(['sessions', 'export', '-', '--session-id', session.runtimeSessionId], env, signal);
    if (result.exitCode !== 0) {
      throw new Error(result.stderr.trim() || `Failed to export Hermes session ${session.runtimeSessionId}.`);
    }

    const parsed = JSON.parse(result.stdout) as { messages?: Array<Record<string, unknown>> };
    const messages = parsed.messages ?? [];
    const importedMessages: ChatMessage[] = [];
    let currentRequestId: string | null = null;

    for (const [index, message] of messages.entries()) {
      const role = message.role;
      if (role !== 'user' && role !== 'assistant' && role !== 'system' && role !== 'tool') {
        continue;
      }

      const content = typeof message.content === 'string' ? sanitizeImportedMessageContent(role, message.content) : '';
      if (content.length === 0) {
        continue;
      }

      const messageId = `imported-${session.id}-${String(message.id ?? index + 1)}`;
      const requestId = role === 'user' ? messageId : currentRequestId;
      if (role === 'user') {
        currentRequestId = messageId;
      }

      const visibility = classifyImportedMessageVisibility(role, content);

      importedMessages.push({
        id: messageId,
        sessionId: session.id,
        role,
        content,
        createdAt: toIsoTimestamp(message.timestamp, timestamp),
        status: 'completed' as const,
        requestId,
        visibility,
        kind: classifyImportedMessageKind(role, content, visibility)
      });
    }

    return importedMessages;
  }

  async loadJobs(profile: Profile, signal?: AbortSignal) {
    const timestamp = this.now();
    const env = buildProfileEnvironment(profile);
    const [listResult, statusResult] = await Promise.all([
      this.run(['cron', 'list', '--all'], env, signal),
      this.run(['cron', 'status'], env, signal)
    ]);

    if (listResult.exitCode !== 0) {
      throw new Error(listResult.stderr.trim() || `Failed to load cron jobs for ${profile.id}.`);
    }

    if (statusResult.exitCode !== 0) {
      throw new Error(statusResult.stderr.trim() || `Failed to load cron status for ${profile.id}.`);
    }

    return parseCronJobs(listResult.stdout, statusResult.stdout, profile.id, timestamp);
  }

  async listTools(profile: Profile, signal?: AbortSignal) {
    const timestamp = this.now();
    const env = buildProfileEnvironment(profile);
    const result = await this.run(['tools', 'list'], env, signal);
    if (result.exitCode !== 0) {
      throw new Error(result.stderr.trim() || `Failed to list Hermes tools for ${profile.id}.`);
    }

    return parseToolsList(result.stdout, profile.id, timestamp);
  }

  async listSkills(profile: Profile, signal?: AbortSignal) {
    const timestamp = this.now();
    const env = buildProfileEnvironment(profile);
    const result = await this.run(['skills', 'list'], env, signal);
    if (result.exitCode !== 0) {
      throw new Error(result.stderr.trim() || `Failed to list Hermes skills for ${profile.id}.`);
    }

    return parseSkillsList(result.stdout, profile.id, timestamp);
  }

  async deleteSkill(profile: Profile, skillName: string, signal?: AbortSignal) {
    const env = buildProfileEnvironment(profile);
    const result = await this.run(['skills', 'uninstall', skillName], env, signal);
    if (result.exitCode !== 0) {
      throw new Error(result.stderr.trim() || `Failed to uninstall Hermes skill ${skillName}.`);
    }
  }

  private parseDiscoveryJsonResult(args: string[], result: HermesCliExecutionResult): HermesCliModelDiscovery {
    const stdout = normalizeOutput(result.stdout);
    const combinedOutput = combineCliOutput(result);
    const commandLabel = formatCliCommand(args);

    if (stdout.length === 0) {
      throw new Error(
        `${commandLabel} did not return authoritative structured JSON. ${combinedOutput || 'The Hermes backend returned no JSON output.'}`
      );
    }

    try {
      return HermesCliModelDiscoverySchema.parse(JSON.parse(stdout));
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown JSON validation failure.';
      throw new Error(`${commandLabel} returned invalid authoritative discovery output. ${detail}`);
    }
  }

  private parseStructuredActionResult(args: string[], result: HermesCliExecutionResult): HermesCliActionResult {
    const stdout = normalizeOutput(result.stdout);
    const combinedOutput = combineCliOutput(result);
    const commandLabel = formatCliCommand(args);

    if (stdout.length === 0) {
      throw new Error(
        `${commandLabel} did not return authoritative structured JSON. ${combinedOutput || 'The Hermes backend returned no JSON output.'}`
      );
    }

    try {
      return HermesCliActionResultSchema.parse(JSON.parse(stdout));
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown JSON validation failure.';
      throw new Error(`${commandLabel} returned invalid authoritative action output. ${detail}`);
    }
  }

  private parseDumpProviders(dumpOutput: string, profileId: string, activeProvider: string, now: string): RuntimeProviderOption[] {
    const apiKeysMatch = dumpOutput.match(/^api_keys:\n((?: {2}.+\n)*)/m);
    const providers: RuntimeProviderOption[] = [];

    // Non-LLM tool/service keys to exclude
    const NON_MODEL_PROVIDERS = new Set([
      'firecrawl', 'tavily', 'browserbase', 'fal', 'elevenlabs', 'github'
    ]);

    if (apiKeysMatch?.[1]) {
      const lines = apiKeysMatch[1].split('\n').filter(Boolean);
      for (const line of lines) {
        const match = line.match(/^\s+(\S+)\s+(set|not set)\s*$/);
        if (!match) continue;
        const [, id, status] = match;
        if (!id || NON_MODEL_PROVIDERS.has(id)) continue;

        const connected = status === 'set';
        const isActive = id === activeProvider;
        const meta = HERMES_PROVIDER_REGISTRY[id];
        const displayName = meta?.displayName ?? id;
        const authKind = meta?.authKind ?? 'api_key';
        const supportsOAuth = meta?.supportsOAuth ?? false;

        providers.push({
          id,
          profileId,
          displayName,
          authKind: authKind as 'api_key' | 'oauth' | 'mixed',
          status: connected ? 'connected' as const : 'missing' as const,
          source: 'hermes_dump',
          supportsApiKey: meta?.supportsApiKey ?? true,
          supportsOAuth,
          lastSyncedAt: now,
          state: connected ? 'connected' as const : (supportsOAuth && !meta?.supportsApiKey) ? 'needs_oauth' as const : 'needs_api_key' as const,
          stateMessage: connected
            ? `${displayName} is ready for Hermes chat requests.`
            : `Add credentials for ${displayName}.`,
          ready: connected,
          modelSelectionMode: 'select_only' as const,
          disabled: !connected && !isActive,
          supportsModelDiscovery: false,
          supportsDisconnect: connected && id !== activeProvider,
          models: [],
          configurationFields: [],
          setupSteps: []
        });
      }
    }

    // Add OAuth-only providers that may not appear in api_keys
    const providerIds = new Set(providers.map((p) => p.id));
    for (const [registryId, meta] of Object.entries(HERMES_PROVIDER_REGISTRY)) {
      if (providerIds.has(registryId)) continue;
      if (!meta.supportsOAuth) continue;
      providers.push({
        id: registryId,
        profileId,
        displayName: meta.displayName,
        authKind: 'oauth' as const,
        status: 'missing' as const,
        source: 'hermes_dump',
        supportsApiKey: meta.supportsApiKey,
        supportsOAuth: true,
        lastSyncedAt: now,
        state: 'needs_oauth' as const,
        stateMessage: `Sign in to ${meta.displayName} to use this provider.`,
        ready: false,
        modelSelectionMode: 'select_only' as const,
        disabled: true,
        supportsModelDiscovery: false,
        supportsDisconnect: false,
        models: [],
        configurationFields: [],
        setupSteps: []
      });
    }

    if (providers.length === 0) {
      const meta = HERMES_PROVIDER_REGISTRY[activeProvider];
      providers.push({
        id: activeProvider,
        profileId,
        displayName: meta?.displayName ?? activeProvider,
        authKind: 'api_key' as const,
        status: 'connected' as const,
        source: 'hermes_dump',
        supportsApiKey: true,
        supportsOAuth: false,
        lastSyncedAt: now,
        state: 'connected' as const,
        stateMessage: 'Connected',
        ready: true,
        modelSelectionMode: 'select_only' as const,
        disabled: false,
        supportsModelDiscovery: false,
        supportsDisconnect: false,
        models: [],
        configurationFields: [],
        setupSteps: []
      });
    }

    return providers;
  }

  private buildDumpSetupSteps(provider: RuntimeProviderOption): RuntimeProviderOption['setupSteps'] {
    const id = provider.id;
    const meta = HERMES_PROVIDER_REGISTRY[id];
    const name = provider.displayName;
    const connected = provider.status === 'connected';
    const steps: RuntimeProviderOption['setupSteps'] = [];

    // Step 1: Inspect — always completed
    steps.push({
      id: `${id}:inspect`,
      kind: 'inspect',
      title: 'Inspect Hermes runtime metadata',
      description: `Hermes detected ${name} from the runtime configuration.`,
      status: 'completed',
      metadata: {}
    });

    // Step 2: OAuth (if the provider supports it)
    if (meta?.supportsOAuth) {
      steps.push({
        id: `${id}:oauth`,
        kind: 'oauth',
        title: connected ? 'Provider sign-in completed' : `Sign in to ${name}`,
        description: connected
          ? `${name} is authorized in Hermes.`
          : meta.oauthDescription ?? `Run the OAuth device flow to authorize ${name}.`,
        status: connected ? 'completed' : 'action_required',
        command: meta.oauthCommand,
        metadata: {}
      });
    }

    // Step 3: API key (if the provider supports it)
    if (meta?.supportsApiKey !== false) {
      const envVar = meta?.envVar;
      const keyUrl = meta?.keyUrl;
      steps.push({
        id: `${id}:api-key`,
        kind: 'api_key',
        title: connected ? 'API key connected' : 'Add API key',
        description: connected
          ? `${name} already has a usable credential for this profile.`
          : keyUrl
            ? `Get your API key at ${keyUrl} and add it to your .env file${envVar ? ` as ${envVar}` : ''}, or run: hermes auth add ${id} --api-key <key>`
            : `Add the API key to your .env file${envVar ? ` as ${envVar}` : ''}, or run: hermes auth add ${id} --api-key <key>`,
        status: connected ? 'completed' : 'action_required',
        command: `hermes auth add ${id} --api-key <your-key>`,
        actionUrl: keyUrl,
        actionLabel: keyUrl ? `Get ${name} API key` : undefined,
        metadata: {}
      });
    }

    // Step 4: Model selection
    steps.push({
      id: `${id}:model`,
      kind: 'model',
      title: provider.ready ? 'Model configured' : 'Set default model',
      description: provider.ready
        ? `Using the configured model on ${name}.`
        : meta?.exampleModel
          ? `Set the default model. Example: hermes config set model ${meta.exampleModel}`
          : `Set the default model with: hermes config set model <provider>/<model>`,
      status: provider.ready ? 'completed' : connected ? 'action_required' : 'blocked',
      command: provider.ready ? undefined : `hermes config set model ${meta?.exampleModel ?? `${id}/<model>`}`,
      metadata: {}
    });

    // Step 5: Verify
    steps.push({
      id: `${id}:verify`,
      kind: 'verify',
      title: provider.ready ? 'Provider ready for chat' : 'Verify provider readiness',
      description: provider.ready
        ? `${name} is fully configured and ready to use.`
        : 'Complete the steps above, then refresh to verify the provider is ready.',
      status: provider.ready ? 'completed' : 'pending',
      metadata: {}
    });

    return steps;
  }

  private parseDumpConfig(dumpOutput: string, profileId: string, now: string): RuntimeModelConfig & { baseUrl?: string; apiMode?: string; reasoningEffort?: string; toolUseEnforcement?: string } {
    const modelMatch = dumpOutput.match(/^model:\s+(.+)$/m);
    const providerMatch = dumpOutput.match(/^provider:\s+(.+)$/m);

    const model = modelMatch?.[1]?.trim() ?? 'unknown';
    const provider = providerMatch?.[1]?.trim() ?? 'unknown';

    // Try to read the config YAML for extra fields (base_url, api_mode, max_turns, etc.)
    let baseUrl: string | undefined;
    let apiMode: string | undefined;
    let maxTurns = 150;
    let reasoningEffort: string | undefined;
    let toolUseEnforcement: string | undefined;

    // Parse config_overrides section from dump for max_turns, reasoning_effort, etc.
    const overridesMatch = dumpOutput.match(/^config_overrides:\n((?: {2}.+\n)*)/m);
    if (overridesMatch?.[1]) {
      const lines = overridesMatch[1].split('\n').filter(Boolean);
      for (const line of lines) {
        const kv = line.match(/^\s+(\S+):\s+(.+)$/);
        if (!kv) continue;
        const [, key, value] = kv;
        if (key === 'agent.max_turns') maxTurns = parseInt(value!, 10) || 150;
        if (key === 'agent.reasoning_effort') reasoningEffort = value!.trim();
        if (key === 'agent.tool_use_enforcement') toolUseEnforcement = value!.trim();
      }
    }

    return {
      profileId,
      provider,
      defaultModel: model,
      maxTurns,
      lastSyncedAt: now,
      ...(baseUrl ? { baseUrl } : {}),
      ...(apiMode ? { apiMode } : {}),
      ...(reasoningEffort ? { reasoningEffort } : {}),
      ...(toolUseEnforcement ? { toolUseEnforcement } : {})
    };
  }

  private async runRuntimeProviderDiscoveryDump(
    profile: Profile,
    _inspectedProviderId?: string | null,
    signal?: AbortSignal
  ) {
    const env = buildProfileEnvironment(profile);
    // Try JSON discovery first (hermes model --json), fall back to dump parsing
    try {
      const jsonArgs = ['model', '--json'];
      const jsonResult = await this.run(jsonArgs, env, signal);
      const discovery = this.parseDiscoveryJsonResult(jsonArgs, jsonResult);
      return mapCliDiscoveryToRuntimeState(profile.id, discovery);
    } catch {
      // Fall back to hermes dump for v0.9.0+
      const dumpResult = await this.run(['dump'], env, signal);
      const dumpOutput = normalizeOutput(dumpResult.stdout);
      const now = this.now();

      const config = this.parseDumpConfig(dumpOutput, profile.id, now);
      const providers = this.parseDumpProviders(dumpOutput, profile.id, config.provider, now);

      // Try to read config.yaml for base_url and api_mode before building fields
      if (profile.path) {
        try {
          const configPath = path.join(profile.path, 'config.yaml');
          if (fs.existsSync(configPath)) {
            const configYaml = fs.readFileSync(configPath, 'utf8');
            const baseUrlMatch = configYaml.match(/^\s+base_url:\s+(.+)$/m);
            const apiModeMatch = configYaml.match(/^\s+api_mode:\s+(.+)$/m);
            if (baseUrlMatch?.[1]?.trim()) {
              (config as Record<string, unknown>).baseUrl = baseUrlMatch[1].trim();
            }
            if (apiModeMatch?.[1]?.trim()) {
              (config as Record<string, unknown>).apiMode = apiModeMatch[1].trim();
            }
          }
        } catch {
          // Config read is best-effort
        }
      }

      // Populate the active provider with model data and configuration fields
      const activeProviderEntry = providers.find((p) => p.id === config.provider);
      if (activeProviderEntry && config.defaultModel !== 'unknown') {
        activeProviderEntry.supportsModelDiscovery = true;
        activeProviderEntry.models = [{
          id: config.defaultModel,
          label: config.defaultModel,
          providerId: config.provider,
          disabled: false,
          supportsReasoningEffort: false,
          reasoningEffortOptions: [] as string[],
          metadata: {} as Record<string, unknown>
        }];
        activeProviderEntry.configurationFields = [
          {
            key: 'defaultModel',
            label: 'Default model',
            input: 'select' as const,
            required: true,
            secret: false,
            disabled: false,
            value: config.defaultModel,
            options: [{
              value: config.defaultModel,
              label: config.defaultModel,
              disabled: false
            }]
          },
          {
            key: 'baseUrl',
            label: 'Base URL',
            input: 'url' as const,
            required: false,
            secret: false,
            disabled: false,
            value: (config as Record<string, unknown>).baseUrl as string | undefined,
            options: []
          },
          {
            key: 'apiMode',
            label: 'API mode',
            input: 'select' as const,
            required: false,
            secret: false,
            disabled: false,
            value: (config as Record<string, unknown>).apiMode as string | undefined,
            options: [
              { value: 'chat_completions', label: 'Chat Completions', disabled: false },
              { value: 'responses', label: 'Responses', disabled: false }
            ]
          }
        ];
      }

      // Generate setup steps for all providers
      for (const provider of providers) {
        provider.setupSteps = this.buildDumpSetupSteps(provider);
      }

      return {
        config,
        providers,
        runtimeReadiness: {
          ready: true,
          code: 'ready' as const,
          message: `${config.provider} / ${config.defaultModel}`,
          providerId: config.provider,
          modelId: config.defaultModel
        },
        inspectedProviderId: config.provider,
        discoveredAt: now
      } satisfies RuntimeProviderDiscoveryResult;
    }
  }

  async discoverRuntimeProviderState(profile: Profile, inspectedProviderId?: string | null, signal?: AbortSignal) {
    return this.runRuntimeProviderDiscoveryDump(profile, inspectedProviderId, signal);
  }

  async getRuntimeModelConfig(profile: Profile) {
    return (await this.discoverRuntimeProviderState(profile)).config;
  }

  async updateRuntimeModelConfig(
    profile: Profile,
    input: Partial<
      Pick<RuntimeModelConfig, 'defaultModel' | 'provider' | 'baseUrl' | 'apiMode' | 'maxTurns' | 'reasoningEffort'>
    >,
    signal?: AbortSignal
  ) {
    const env = buildProfileEnvironment(profile);

    // v0.9.0+: use 'config set' for model/provider changes
    if (input.defaultModel) {
      await this.run(['config', 'set', 'model', input.defaultModel], env, signal);
    }

    return this.getRuntimeModelConfig(profile);
  }

  async beginProviderAuth(profile: Profile, providerId: string, signal?: AbortSignal) {
    // v0.9.0+: use 'hermes login' for provider auth
    const env = buildProfileEnvironment(profile);
    try {
      await this.run(['login'], env, signal);
    } catch {
      // Login is interactive — may fail in headless mode
    }
    return this.discoverRuntimeProviderState(profile, providerId, signal);
  }

  async pollProviderAuth(profile: Profile, providerId: string, _authSessionId?: string | null, signal?: AbortSignal) {
    return this.discoverRuntimeProviderState(profile, providerId, signal);
  }

  async connectProvider(profile: Profile, input: ConnectProviderRequest, signal?: AbortSignal) {
    // v0.9.0+: API keys are set via hermes config or .env
    return this.discoverRuntimeProviderState(profile, input.provider, signal);
  }

  async deleteGmailMessages(profile: Profile, messageIds: string[], signal?: AbortSignal) {
    const uniqueMessageIds = [...new Set(messageIds.map((value) => value.trim()).filter((value) => value.length > 0))];
    if (uniqueMessageIds.length === 0) {
      return [];
    }

    const { codebasePath, pythonPath, scriptPath } = this.resolveGoogleRecipePaths();
    if (!fs.existsSync(scriptPath)) {
      throw new Error('Google Recipe delete is unavailable because the google-workspace skill script is missing.');
    }
    if (!fs.existsSync(pythonPath)) {
      throw new Error('Google Recipe delete is unavailable because the Hermes Python runtime could not be found.');
    }

    const env = {
      ...buildProfileEnvironment(profile),
      HERMES_CODEBASE: codebasePath,
      HERMES_PYTHON: pythonPath,
      PYTHONPATH: codebasePath
    };
    const deletedIds: string[] = [];

    for (const messageId of uniqueMessageIds) {
      const result = await this.runExecutable(
        pythonPath,
        [scriptPath, 'gmail', 'modify', messageId, '--add-labels', 'TRASH', '--remove-labels', 'INBOX,UNREAD'],
        env,
        signal,
        Math.max(this.timeoutMs, 30_000)
      );
      if (result.exitCode !== 0) {
        throw new Error(result.stderr.trim() || `Failed to delete Gmail message ${messageId}.`);
      }
      deletedIds.push(messageId);
    }

    return deletedIds;
  }

  async generateRecipeAppletArtifact(options: HermesRecipeAppletGenerationOptions) {
    validateRecipeAppletArtifactPrompt(options.prompt);

    const env = buildProfileEnvironment(options.profile);
    const args = [
      'chat',
      '-Q',
      '--max-turns',
      '1',
      '--source',
      'tool',
      '-q',
      buildRecipeAppletArtifactQuery(options.profile, options.prompt, options.stage)
    ];

    let streamedOutput = '';
    let stdoutLineBuffer = '';
    let lastAssistantSnapshot = '';
    let lastProgressMessage = '';
    let liveTaskViolation: HermesCliRecipeAppletViolationError | null = null;
    const controller = new AbortController();

    let result: HermesCliExecutionResult;
    try {
      result = await this.runner.stream(args, {
        cwd: this.workingDirectory,
        env: {
          ...env,
          NO_COLOR: '1',
          TERM: 'dumb'
        },
        timeoutMs: options.timeoutMs,
        signal: controller.signal,
        onStdout: (chunk) => {
          streamedOutput += chunk;
          const normalizedChunk = stripAnsi(chunk).replace(/\r/g, '');
          stdoutLineBuffer += normalizedChunk;

          let newlineIndex = stdoutLineBuffer.indexOf('\n');
          while (newlineIndex >= 0) {
            const line = stdoutLineBuffer.slice(0, newlineIndex);
            stdoutLineBuffer = stdoutLineBuffer.slice(newlineIndex + 1);

            const activity = parseChatActivity(line, this.now(), options.requestId ?? null);
            if (activity) {
              options.onActivity?.(activity);
              if (isRecipeAppletLiveTaskActivity(activity)) {
                const violationDetail = describeRecipeAppletActivity(activity);
                liveTaskViolation = new HermesCliRecipeAppletViolationError(
                  `Recipe applet generation attempted live task activity (${violationDetail}).`,
                  violationDetail
                );
                controller.abort();
                return;
              }

              const progressMessage = progressMessageForActivity(activity);
              if (progressMessage && progressMessage !== lastProgressMessage) {
                lastProgressMessage = progressMessage;
                options.onProgress?.(progressMessage);
              }
            }

            newlineIndex = stdoutLineBuffer.indexOf('\n');
          }

          const normalizedOutput = stripAnsi(streamedOutput).replace(/\r/g, '');
          const assistantChunk = extractAssistantBoxContent(normalizedOutput);

          if (assistantChunk && assistantChunk !== lastAssistantSnapshot) {
            lastAssistantSnapshot = assistantChunk;
            options.onAssistantSnapshot?.(assistantChunk);
          }
        }
      });
    } catch (error) {
      if (liveTaskViolation) {
        throw liveTaskViolation;
      }

      if (error instanceof Error && error.name === 'AbortError' && liveTaskViolation) {
        throw liveTaskViolation;
      }

      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new Error(`Recipe applet ${options.stage} generation timed out after ${options.timeoutMs}ms.`);
      }

      throw error;
    }

    if (liveTaskViolation) {
      throw liveTaskViolation;
    }

    if (result.exitCode !== 0) {
      throw new Error(result.stderr.trim() || `Recipe applet ${options.stage} generation failed.`);
    }

    const normalizedOutput = stripAnsi(result.stdout).replace(/\r/g, '');
    if (/Reached maximum iterations/i.test(normalizedOutput)) {
      throw new HermesCliRecipeAppletViolationError(
        'Recipe applet generation hit the restricted turn limit instead of staying inside the artifact-only contract.'
      );
    }

    return {
      assistantMarkdown: extractAssistantBody(normalizedOutput, {
        recipeAppletStage: options.stage
      })
    } satisfies HermesCliChatResult;
  }

  async generateRecipeDslArtifact(options: HermesRecipeDslGenerationOptions) {
    validateRecipeDslArtifactPrompt(options.prompt);

    const env = buildProfileEnvironment(options.profile);
    const args = [
      'chat',
      '-Q',
      '--max-turns',
      '1',
      '--source',
      'tool',
      '-q',
      buildRecipeDslArtifactQuery(options.profile, options.prompt, options.stage)
    ];

    let streamedOutput = '';
    let stdoutLineBuffer = '';
    let lastAssistantSnapshot = '';
    let lastProgressMessage = '';
    let liveTaskViolation: HermesCliRecipeAppletViolationError | null = null;
    const controller = new AbortController();

    let result: HermesCliExecutionResult;
    try {
      result = await this.runner.stream(args, {
        cwd: this.workingDirectory,
        env: {
          ...env,
          NO_COLOR: '1',
          TERM: 'dumb'
        },
        timeoutMs: options.timeoutMs,
        signal: controller.signal,
        onStdout: (chunk) => {
          streamedOutput += chunk;
          const normalizedChunk = stripAnsi(chunk).replace(/\r/g, '');
          stdoutLineBuffer += normalizedChunk;

          let newlineIndex = stdoutLineBuffer.indexOf('\n');
          while (newlineIndex >= 0) {
            const line = stdoutLineBuffer.slice(0, newlineIndex);
            stdoutLineBuffer = stdoutLineBuffer.slice(newlineIndex + 1);

            const activity = parseChatActivity(line, this.now(), options.requestId ?? null);
            if (activity) {
              options.onActivity?.(activity);
              if (isRecipeAppletLiveTaskActivity(activity)) {
                const violationDetail = describeRecipeAppletActivity(activity);
                liveTaskViolation = new HermesCliRecipeAppletViolationError(
                  `Recipe DSL generation attempted live task activity (${violationDetail}).`,
                  violationDetail
                );
                controller.abort();
                return;
              }

              const progressMessage = progressMessageForActivity(activity);
              if (progressMessage && progressMessage !== lastProgressMessage) {
                lastProgressMessage = progressMessage;
                options.onProgress?.(progressMessage);
              }
            }

            newlineIndex = stdoutLineBuffer.indexOf('\n');
          }

          const normalizedOutput = stripAnsi(streamedOutput).replace(/\r/g, '');
          const assistantChunk = extractAssistantBoxContent(normalizedOutput);

          if (assistantChunk && assistantChunk !== lastAssistantSnapshot) {
            lastAssistantSnapshot = assistantChunk;
            options.onAssistantSnapshot?.(assistantChunk);
          }
        }
      });
    } catch (error) {
      if (liveTaskViolation) {
        throw liveTaskViolation;
      }

      if (error instanceof Error && error.name === 'AbortError' && liveTaskViolation) {
        throw liveTaskViolation;
      }

      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new Error(`Recipe DSL ${options.stage} timed out after ${options.timeoutMs}ms.`);
      }

      throw error;
    }

    if (liveTaskViolation) {
      throw liveTaskViolation;
    }

    if (result.exitCode !== 0) {
      throw new Error(result.stderr.trim() || `Recipe DSL ${options.stage} failed.`);
    }

    const normalizedOutput = stripAnsi(result.stdout).replace(/\r/g, '');
    if (/Reached maximum iterations/i.test(normalizedOutput)) {
      throw new HermesCliRecipeAppletViolationError(
        'Recipe DSL generation hit the restricted turn limit instead of staying inside the artifact-only contract.'
      );
    }

    return {
      assistantMarkdown: extractAssistantBody(normalizedOutput, {
        structuredArtifactOnly: true
      })
    } satisfies HermesCliChatResult;
  }

  async generateRecipeTemplateArtifact(options: HermesRecipeTemplateGenerationOptions) {
    validateRecipeTemplateArtifactPrompt(options.prompt);

    const env = buildProfileEnvironment(options.profile);
    const args = [
      'chat',
      '-Q',
      '--max-turns',
      '1',
      '--source',
      'tool',
      '-q',
      buildRecipeTemplateArtifactQuery(options.profile, options.prompt, options.stage)
    ];

    let streamedOutput = '';
    let stdoutLineBuffer = '';
    let lastAssistantSnapshot = '';
    let lastProgressMessage = '';
    let liveTaskViolation: HermesCliRecipeAppletViolationError | null = null;
    const controller = new AbortController();

    let result: HermesCliExecutionResult;
    try {
      result = await this.runner.stream(args, {
        cwd: this.workingDirectory,
        env: {
          ...env,
          NO_COLOR: '1',
          TERM: 'dumb'
        },
        timeoutMs: options.timeoutMs,
        signal: controller.signal,
        onStdout: (chunk) => {
          streamedOutput += chunk;
          const normalizedChunk = stripAnsi(chunk).replace(/\r/g, '');
          stdoutLineBuffer += normalizedChunk;

          let newlineIndex = stdoutLineBuffer.indexOf('\n');
          while (newlineIndex >= 0) {
            const line = stdoutLineBuffer.slice(0, newlineIndex);
            stdoutLineBuffer = stdoutLineBuffer.slice(newlineIndex + 1);

            const activity = parseChatActivity(line, this.now(), options.requestId ?? null);
            if (activity) {
              options.onActivity?.(activity);
              if (isRecipeAppletLiveTaskActivity(activity)) {
                const violationDetail = describeRecipeAppletActivity(activity);
                liveTaskViolation = new HermesCliRecipeAppletViolationError(
                  `Recipe template generation attempted live task activity (${violationDetail}).`,
                  violationDetail
                );
                controller.abort();
                return;
              }

              const progressMessage = progressMessageForActivity(activity);
              if (progressMessage && progressMessage !== lastProgressMessage) {
                lastProgressMessage = progressMessage;
                options.onProgress?.(progressMessage);
              }
            }

            newlineIndex = stdoutLineBuffer.indexOf('\n');
          }

          const normalizedOutput = stripAnsi(streamedOutput).replace(/\r/g, '');
          const assistantChunk = extractAssistantBoxContent(normalizedOutput);

          if (assistantChunk && assistantChunk !== lastAssistantSnapshot) {
            lastAssistantSnapshot = assistantChunk;
            options.onAssistantSnapshot?.(assistantChunk);
          }
        }
      });
    } catch (error) {
      if (liveTaskViolation) {
        throw liveTaskViolation;
      }

      if (error instanceof Error && error.name === 'AbortError' && liveTaskViolation) {
        throw liveTaskViolation;
      }

      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new Error(`Recipe template ${options.stage} timed out after ${options.timeoutMs}ms.`);
      }

      throw error;
    }

    if (liveTaskViolation) {
      throw liveTaskViolation;
    }

    if (result.exitCode !== 0) {
      throw new Error(result.stderr.trim() || `Recipe template ${options.stage} failed.`);
    }

    const normalizedOutput = stripAnsi(result.stdout).replace(/\r/g, '');
    if (/Reached maximum iterations/i.test(normalizedOutput)) {
      throw new HermesCliRecipeAppletViolationError(
        'Recipe template generation hit the restricted turn limit instead of staying inside the artifact-only contract.'
      );
    }

    return {
      assistantMarkdown: extractAssistantBody(normalizedOutput, {
        structuredArtifactOnly: true
      }),
      runtimeSessionId: extractRuntimeSessionId(normalizedOutput)
    } satisfies HermesCliChatResult;
  }

  async generateRecipeTemplateArtifactCorrection(
    options: HermesRecipeTemplateCorrectionOptions
  ): Promise<HermesCliChatResult> {
    validateRecipeTemplateArtifactPrompt(options.correctionPrompt);

    const env = buildProfileEnvironment(options.profile);
    const args = [
      'chat',
      '-Q',
      '--max-turns',
      '1',
      '--source',
      'tool',
      '--resume',
      options.sessionId,
      '-q',
      buildRecipeTemplateCorrectionQuery(options.profile, options.correctionPrompt, options.stage)
    ];

    let streamedOutput = '';
    let stdoutLineBuffer = '';
    let lastAssistantSnapshot = '';
    let lastProgressMessage = '';
    let liveTaskViolation: HermesCliRecipeAppletViolationError | null = null;
    const controller = new AbortController();

    let result: HermesCliExecutionResult;
    try {
      result = await this.runner.stream(args, {
        cwd: this.workingDirectory,
        env: {
          ...env,
          NO_COLOR: '1',
          TERM: 'dumb'
        },
        timeoutMs: options.timeoutMs,
        signal: controller.signal,
        onStdout: (chunk) => {
          streamedOutput += chunk;
          const normalizedChunk = stripAnsi(chunk).replace(/\r/g, '');
          stdoutLineBuffer += normalizedChunk;

          let newlineIndex = stdoutLineBuffer.indexOf('\n');
          while (newlineIndex >= 0) {
            const line = stdoutLineBuffer.slice(0, newlineIndex);
            stdoutLineBuffer = stdoutLineBuffer.slice(newlineIndex + 1);

            const activity = parseChatActivity(line, this.now(), options.requestId ?? null);
            if (activity) {
              options.onActivity?.(activity);
              if (isRecipeAppletLiveTaskActivity(activity)) {
                const violationDetail = describeRecipeAppletActivity(activity);
                liveTaskViolation = new HermesCliRecipeAppletViolationError(
                  `Recipe template correction attempted live task activity (${violationDetail}).`,
                  violationDetail
                );
                controller.abort();
                return;
              }

              const progressMessage = progressMessageForActivity(activity);
              if (progressMessage && progressMessage !== lastProgressMessage) {
                lastProgressMessage = progressMessage;
                options.onProgress?.(progressMessage);
              }
            }

            newlineIndex = stdoutLineBuffer.indexOf('\n');
          }

          const normalizedOutput = stripAnsi(streamedOutput).replace(/\r/g, '');
          const assistantChunk = extractAssistantBoxContent(normalizedOutput);

          if (assistantChunk && assistantChunk !== lastAssistantSnapshot) {
            lastAssistantSnapshot = assistantChunk;
            options.onAssistantSnapshot?.(assistantChunk);
          }
        }
      });
    } catch (error) {
      if (liveTaskViolation) {
        throw liveTaskViolation;
      }

      if (error instanceof Error && error.name === 'AbortError' && liveTaskViolation) {
        throw liveTaskViolation;
      }

      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new Error(`Recipe template ${options.stage} correction timed out after ${options.timeoutMs}ms.`);
      }

      throw error;
    }

    if (liveTaskViolation) {
      throw liveTaskViolation;
    }

    if (result.exitCode !== 0) {
      throw new Error(result.stderr.trim() || `Recipe template ${options.stage} correction failed.`);
    }

    const normalizedOutput = stripAnsi(result.stdout).replace(/\r/g, '');
    if (/Reached maximum iterations/i.test(normalizedOutput)) {
      throw new HermesCliRecipeAppletViolationError(
        'Recipe template correction hit the restricted turn limit instead of staying inside the artifact-only contract.'
      );
    }

    return {
      assistantMarkdown: extractAssistantBody(normalizedOutput, {
        structuredArtifactOnly: true
      }),
      runtimeSessionId: extractRuntimeSessionId(normalizedOutput)
    } satisfies HermesCliChatResult;
  }

  async streamChat(options: HermesChatStreamOptions) {
    if (options.recipeAppletStage) {
      throw new HermesCliRecipeAppletContextError(
        'Recipe applet generation must use generateRecipeAppletArtifact() instead of the live Hermes chat path.'
      );
    }

    const env = buildProfileEnvironment(options.profile);
    const args = ['chat', '-Q'];
    const streamTimeoutMs = resolveHermesChatTimeoutMs(options);
    const preloadedSkills: string[] = [];
    const intentContent = resolveIntentContent(options.content, options.refreshContext);

    if (isEmailIntent(intentContent)) {
      try {
        const runtimeSkills = await this.listSkills(options.profile);
        if (runtimeSkills.some((skill) => skill.name === 'google-workspace')) {
          preloadedSkills.push('google-workspace');
        }
      } catch {
        // Email checks can still fall back to prompt steering if the skills list is unavailable.
      }
    }

    if (options.runtimeSessionId) {
      args.push('--resume', options.runtimeSessionId);
    }

    if (options.unrestrictedAccessEnabled) {
      args.push('--yolo');
    } else {
      args.push('--max-turns', String(options.maxTurns));
    }

    if (preloadedSkills.length > 0) {
      args.push('-s', preloadedSkills.join(','));
    }

    args.push(
      '--source',
      'tool',
      '-q',
      buildBridgeChatQuery(options.profile, options.content, options.spaceContext, options.refreshContext, {
        structuredArtifactOnly: options.structuredArtifactOnly,
        recipeAppletStage: options.recipeAppletStage
      })
    );

    let streamedOutput = '';
    let stdoutLineBuffer = '';
    let lastAssistantSnapshot = '';
    let lastProgressMessage = '';

    let result: HermesCliExecutionResult;
    try {
      result = await this.runner.stream(args, {
        cwd: this.workingDirectory,
        env,
        timeoutMs: streamTimeoutMs,
        onStdout: (chunk) => {
          streamedOutput += chunk;
          const normalizedChunk = stripAnsi(chunk).replace(/\r/g, '');
          stdoutLineBuffer += normalizedChunk;

          let newlineIndex = stdoutLineBuffer.indexOf('\n');
          while (newlineIndex >= 0) {
            const line = stdoutLineBuffer.slice(0, newlineIndex);
            stdoutLineBuffer = stdoutLineBuffer.slice(newlineIndex + 1);

            const activity = parseChatActivity(line, this.now(), options.requestId ?? null);
            if (activity) {
              options.onActivity?.(activity);
              const progressMessage = progressMessageForActivity(activity);
              if (progressMessage && progressMessage !== lastProgressMessage) {
                lastProgressMessage = progressMessage;
                options.onProgress?.(progressMessage);
              }
            }

            newlineIndex = stdoutLineBuffer.indexOf('\n');
          }

          const normalizedOutput = stripAnsi(streamedOutput).replace(/\r/g, '');
          const assistantChunk = extractAssistantBoxContent(normalizedOutput);

          if (assistantChunk && assistantChunk !== lastAssistantSnapshot) {
            lastAssistantSnapshot = assistantChunk;
            options.onAssistantSnapshot?.(assistantChunk);
          }

          const progressMessage = defaultProgressMessageForContent(options.content, normalizedOutput, assistantChunk);

          if (progressMessage !== lastProgressMessage) {
            lastProgressMessage = progressMessage;
            options.onProgress?.(progressMessage);
          }
        }
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError' && isEmailIntent(options.content)) {
        throw new Error(
          `Hermes timed out while checking email for the active profile ${options.profile.id}. The bridge kept the request scoped to ${options.profile.id}; if Google Recipe is not fully authenticated for this profile, re-run the Google Recipe setup for ${options.profile.id} and try again.`
        );
      }

      if (error instanceof Error && error.name === 'TimeoutError' && isLocalSearchIntent(options.content)) {
        throw new Error(
          'Hermes timed out while searching for nearby results. The bridge now gives local-search requests more time; retrying with a tighter area or cuisine usually succeeds.'
        );
      }

      throw error;
    }

    if (result.exitCode !== 0) {
      throw new Error(result.stderr.trim() || 'Hermes CLI request failed.');
    }

    const normalizedOutput = stripAnsi(result.stdout).replace(/\r/g, '');
    if (!options.unrestrictedAccessEnabled && /Reached maximum iterations/i.test(normalizedOutput)) {
      throw new Error(
        'Hermes stopped before finishing because the restricted turn limit was reached. Increase the restricted turn limit or enable Unrestricted Access.'
      );
    }

    return {
      assistantMarkdown: extractAssistantBody(normalizedOutput, {
        structuredArtifactOnly: options.structuredArtifactOnly,
        recipeAppletStage: options.recipeAppletStage
      }),
      runtimeSessionId: extractRuntimeSessionId(normalizedOutput)
    } satisfies HermesCliChatResult;
  }
}
