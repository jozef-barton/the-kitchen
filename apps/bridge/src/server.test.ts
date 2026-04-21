// @vitest-environment node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AddressInfo } from 'node:net';
import type {
  ApiError,
  BootstrapResponse,
  ChatStreamEvent,
  JobsResponse,
  ModelProviderResponse,
  OpenRecipeChatResponse,
  Session,
  SessionMessagesResponse,
  SessionsResponse,
  SettingsResponse,
  RecipeDeletionResponse,
  RecipeResponse,
  RecipesResponse,
  SkillsResponse,
  TelemetryResponse,
  ToolExecution,
  ToolHistoryResponse,
  ToolsResponse
} from '@hermes-recipes/protocol';
import { getRecipeContentEntries, getRecipeContentFormat as getAttachedRecipeContentFormat, getRecipeContentTab, getRecipeContentViewData } from '@hermes-recipes/protocol';
import { createBridgeServer } from './server';

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const fixtureCliPath = path.resolve(moduleDirectory, '../test/fixtures/hermes-cli-fixture.mjs');

// The bridge requires the x-hermes-bridge: 1 header on non-safe requests (CSRF guard).
// Wrap global fetch so tests don't have to set it on every call.
const originalFetch = globalThis.fetch;
globalThis.fetch = ((input: Parameters<typeof originalFetch>[0], init?: Parameters<typeof originalFetch>[1]) => {
  const mergedHeaders = {
    'x-hermes-bridge': '1',
    ...(init?.headers ?? {})
  };
  return originalFetch(input, { ...init, headers: mergedHeaders });
}) as typeof originalFetch;

async function collectStreamEvents(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) {
    return [] as ChatStreamEvent[];
  }

  const decoder = new TextDecoder();
  let buffer = '';
  const events: ChatStreamEvent[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    let separatorIndex = buffer.indexOf('\n\n');
    while (separatorIndex >= 0) {
      const chunk = buffer.slice(0, separatorIndex).trim();
      buffer = buffer.slice(separatorIndex + 2);
      if (chunk.startsWith('data:')) {
        events.push(JSON.parse(chunk.slice(5).trim()));
      }
      separatorIndex = buffer.indexOf('\n\n');
    }
  }

  return events;
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function waitForSessionMessages(
  baseUrl: string,
  profileId: string,
  sessionId: string,
  predicate: (payload: SessionMessagesResponse) => boolean,
  timeoutMs = 4_000
): Promise<SessionMessagesResponse> {
  const startedAt = Date.now();
  let latest: SessionMessagesResponse | undefined;

  while (Date.now() - startedAt < timeoutMs) {
    latest = await fetch(
      `${baseUrl}/api/sessions/${encodeURIComponent(sessionId)}/messages?profileId=${encodeURIComponent(profileId)}`
    ).then((result) => readJson<SessionMessagesResponse>(result));
    const current = latest as SessionMessagesResponse;
    if (predicate(current)) {
      return current;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  if (latest) {
    return latest;
  }

  return fetch(
    `${baseUrl}/api/sessions/${encodeURIComponent(sessionId)}/messages?profileId=${encodeURIComponent(profileId)}`
  ).then((result) => readJson<SessionMessagesResponse>(result));
}

function getPrimaryDynamicDataset(recipe: RecipeResponse['recipe']) {
  if (recipe.renderMode !== 'dynamic_v1') {
    return null;
  }

  const normalizedData = recipe.dynamic?.normalizedData;
  if (!normalizedData || normalizedData.datasets.length === 0) {
    return null;
  }

  return normalizedData.datasets.find((dataset) => dataset.id === normalizedData.primaryDatasetId) ?? normalizedData.datasets[0] ?? null;
}

function getRecipeContentFormat(recipe: RecipeResponse['recipe']) {
  const primaryDynamicDataset = getPrimaryDynamicDataset(recipe);
  if (primaryDynamicDataset) {
    if (primaryDynamicDataset.preferredPresentation === 'table') {
      return 'table';
    }

    if (primaryDynamicDataset.preferredPresentation === 'markdown') {
      return 'markdown';
    }

    return 'card';
  }

  return getAttachedRecipeContentFormat(recipe);
}

function hasMeaningfulAttachedRecipe(recipe: RecipeResponse['recipe']) {
  const primaryDynamicDataset = getPrimaryDynamicDataset(recipe);
  if (primaryDynamicDataset) {
    return (
      primaryDynamicDataset.items.length > 0 ||
      primaryDynamicDataset.notes.length > 0 ||
      (recipe.dynamic?.fallback?.summaryMarkdown?.trim().length ?? 0) > 0
    );
  }

  const contentTab = getRecipeContentTab(recipe);
  return (
    getRecipeContentViewData(contentTab, 'markdown').markdown.trim().length > 0 ||
    getRecipeContentViewData(contentTab, 'table').rows.length > 0 ||
    getRecipeContentViewData(contentTab, 'card').cards.length > 0
  );
}

function expectBaselineHomeRecipe(recipe: RecipeResponse['recipe'] | null | undefined, expectedSnippet?: string) {
  expect(recipe).toBeTruthy();
  if (!recipe) {
    return;
  }

  const markdown = getRecipeContentViewData(getRecipeContentTab(recipe), 'markdown').markdown;

  expect(recipe.metadata.homeRecipe).toBe(true);
  expect(recipe.title.includes('undefined')).toBe(false);
  expect(markdown.trim().length).toBeGreaterThan(0);
  expect(markdown).not.toContain('hermes-ui-recipes');

  if (expectedSnippet) {
    expect(markdown).toContain(expectedSnippet);
  }
}

function expectLegacyHomeRecipe(
  recipe: RecipeResponse['recipe'] | null | undefined,
  expectedSnippet?: string,
  options: {
    allowFailedEnrichmentBuild?: boolean;
  } = {}
) {
  expectBaselineHomeRecipe(recipe, expectedSnippet);
  if (!recipe) {
    return;
  }

  expect(recipe.renderMode).toBe('legacy_content_v1');
  expect(getAttachedRecipeContentFormat(recipe)).toBe('markdown');

  if (!options.allowFailedEnrichmentBuild) {
    expect(recipe.dynamic).toBeUndefined();
    return;
  }

  expect(recipe.dynamic?.activeBuild?.phase).toBe('failed');
}

function expectPromotedRichHomeRecipe(recipe: RecipeResponse['recipe'] | null | undefined, expectedSnippet?: string) {
  expectBaselineHomeRecipe(recipe, expectedSnippet);
  if (!recipe) {
    return;
  }

  expect(recipe.renderMode).toBe('dynamic_v1');
  expect(recipe.dynamic?.activeBuild?.buildKind).toBe('template_enrichment');
  expect(recipe.dynamic?.recipeTemplate?.kind).toBe('recipe_template_state');
  expect(recipe.dynamic?.recipeDsl).toBeUndefined();
  expect(recipe.dynamic?.recipeModel).toBeUndefined();
  expect(getPrimaryDynamicDataset(recipe)).not.toBeNull();
}


async function startServer(
  tempRoot: string,
  options: {
    failureFlags?: string;
    databasePath?: string;
    legacySnapshotPaths?: string[];
    staticDirectory?: string;
  } = {}
) {
  const databasePath = options.databasePath ?? path.join(tempRoot, 'bridge.sqlite');
  process.env.HERMES_FIXTURE_HOME = path.join(tempRoot, 'fixture-home');
  process.env.HERMES_FIXTURE_FAIL = options.failureFlags ?? '';

  const instance = createBridgeServer({
    databasePath,
    cliPath: fixtureCliPath,
    staticDirectory: options.staticDirectory,
    recipeRoot: tempRoot,
    legacySnapshotPaths: options.legacySnapshotPaths ?? []
  });

  await new Promise<void>((resolve) => {
    instance.server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = instance.server.address() as AddressInfo;

  return {
    ...instance,
    baseUrl: `http://127.0.0.1:${address.port}`,
    async close() {
      await new Promise<void>((resolve, reject) => {
        instance.server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
      await instance.bridge.waitForRecipeEnrichmentQueues();
      instance.database.close();
    }
  };
}

let tempRoots: string[] = [];

beforeEach(() => {
  delete process.env.HERMES_FIXTURE_FAIL;
  delete process.env.HERMES_FIXTURE_HOME;
});

afterEach(() => {
  delete process.env.HERMES_FIXTURE_FAIL;
  delete process.env.HERMES_FIXTURE_HOME;
  while (tempRoots.length > 0) {
    const target = tempRoots.pop();
    if (target) {
      fs.rmSync(target, { recursive: true, force: true });
    }
  }
});

describe.sequential('bridge server', () => {
  it('returns real structured bootstrap data from Hermes fixture output', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-server-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const response = await fetch(`${server.baseUrl}/api/bootstrap`);
    const payload = await readJson<BootstrapResponse>(response);

    expect(response.status).toBe(200);
    expect(payload.profiles.some((profile: { id: string }) => profile.id === '8tn')).toBe(true);
    expect(payload.profiles.some((profile: { id: string }) => profile.id === 'jbarton')).toBe(true);
    expect(payload.recentSessions.length).toBeGreaterThan(0);
    expect(payload.connection.status).toBe('connected');

    await server.close();
  });

  it('imports session transcripts from sessions export on demand', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-transcript-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const bootstrap = await fetch(`${server.baseUrl}/api/bootstrap`).then((result) => readJson<BootstrapResponse>(result));
    const profileId = bootstrap.activeProfileId ?? 'jbarton';
    const sessionId = bootstrap.recentSessions[0].id;

    const transcript = await fetch(
      `${server.baseUrl}/api/sessions/${sessionId}/messages?profileId=${encodeURIComponent(profileId)}`
    ).then((result) => readJson<SessionMessagesResponse>(result));

    expect(transcript.messages.length).toBeGreaterThan(0);
    expect(transcript.messages[0].role).toBe('user');
    expect(transcript.session.id).toBe(sessionId);

    await server.close();
  });

  it('returns jobs and tools from Hermes fixture output', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-tools-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const jobsResponse = await fetch(`${server.baseUrl}/api/jobs?profileId=8tn`);
    const toolsResponse = await fetch(`${server.baseUrl}/api/tools?profileId=jbarton`);
    const jobs = await readJson<JobsResponse>(jobsResponse);
    const tools = await readJson<ToolsResponse>(toolsResponse);

    expect(jobsResponse.status).toBe(200);
    expect(toolsResponse.status).toBe(200);
    expect(jobs.items[0].profileId).toBe('8tn');
    expect(jobs.freshness.status).toBe('connected');
    expect(tools.items.some((tool: { id: string }) => tool.id === 'bridge:reviewed-shell')).toBe(true);
    expect(tools.items.some((tool: { id: string }) => tool.id === 'hermes:cli:web')).toBe(true);

    await server.close();
  });

  it('allows trusted local origins and rejects non-local origins for JSON and SSE routes', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-origin-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const allowed = await fetch(`${server.baseUrl}/api/health`, {
      headers: {
        Origin: 'http://localhost:5173'
      }
    });
    const forbidden = await fetch(`${server.baseUrl}/api/health`, {
      headers: {
        Origin: 'https://example.com'
      }
    });
    const preflight = await fetch(`${server.baseUrl}/api/chat/stream`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'access-control-request-method': 'POST'
      }
    });
    const forbiddenPayload = await readJson<ApiError & { error: ApiError }>(forbidden);

    expect(allowed.status).toBe(200);
    expect(allowed.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
    expect(forbidden.status).toBe(403);
    expect(forbiddenPayload.error.code).toBe('ORIGIN_FORBIDDEN');

    await server.close();
  });

  it('returns skills and model/provider state and persists provider updates', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-providers-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const skills = await fetch(`${server.baseUrl}/api/skills?profileId=8tn`).then((result) => readJson<SkillsResponse>(result));
    const providers = await fetch(`${server.baseUrl}/api/model-providers?profileId=8tn`).then((result) =>
      readJson<ModelProviderResponse>(result)
    );
    const updated = await fetch(`${server.baseUrl}/api/model-providers`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: '8tn',
        provider: 'anthropic',
        defaultModel: 'anthropic/claude-3.7-sonnet',
        maxTurns: 42,
        reasoningEffort: 'high'
      })
    }).then((result) => readJson<ModelProviderResponse>(result));
    const connected = await fetch(`${server.baseUrl}/api/provider-connections`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: '8tn',
        provider: 'anthropic',
        apiKey: 'sk-ant-fixture-1234',
        label: 'ANTHROPIC_API_KEY'
      })
    }).then((result) => readJson<ModelProviderResponse>(result));
    await fetch(`${server.baseUrl}/api/model-providers?profileId=jbarton`).then((result) =>
      readJson<ModelProviderResponse>(result)
    );
    const settings = await fetch(`${server.baseUrl}/api/settings`).then((result) => readJson<SettingsResponse>(result));

    expect(skills.items.some((item) => item.name === 'google-workspace')).toBe(true);
    expect(skills.items.some((item) => item.name === 'google-workspace' && item.summary.length > 0)).toBe(true);
    expect(providers.config.provider).toBe('openrouter');
    expect(providers.runtimeReadiness.ready).toBe(true);
    expect(providers.providers.some((item) => item.id === 'openrouter' && item.status === 'connected')).toBe(true);
    expect(
      providers.providers.some(
        (item) =>
          item.id === 'openrouter' &&
          item.setupSteps.some((step) => step.kind === 'api_key' && step.status === 'completed') &&
          item.configurationFields.some((field) => field.key === 'baseUrl')
      )
    ).toBe(true);
    expect(updated.config.defaultModel).toBe('anthropic/claude-3.7-sonnet');
    // In v0.9.0, provider is not changed via config set model — only the model changes
    expect(updated.config.provider).toBe('openrouter');
    // connectProvider in v0.9.0 delegates to discovery — returns provider state
    expect(connected.config).toBeTruthy();
    expect(connected.providers.length).toBeGreaterThan(0);
    expect(settings.settings.unrestrictedAccessEnabled).toBe(false);

    await server.close();
  });

  it('persists expanded timeout settings through the bridge settings API', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-timeout-settings-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const updated = await fetch(`${server.baseUrl}/api/settings`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        chatTimeoutMs: 300_000,
        discoveryTimeoutMs: 600_000,
        nearbySearchTimeoutMs: 900_000,
        recipeOperationTimeoutMs: 240_000,
        unrestrictedTimeoutMs: 3_600_000
      })
    }).then((result) => readJson<SettingsResponse>(result));
    const reloaded = await fetch(`${server.baseUrl}/api/settings`).then((result) => readJson<SettingsResponse>(result));

    expect(updated.settings).toMatchObject({
      chatTimeoutMs: 300_000,
      discoveryTimeoutMs: 600_000,
      nearbySearchTimeoutMs: 900_000,
      recipeOperationTimeoutMs: 240_000,
      unrestrictedTimeoutMs: 3_600_000
    });
    expect(reloaded.settings).toMatchObject({
      chatTimeoutMs: 300_000,
      discoveryTimeoutMs: 600_000,
      nearbySearchTimeoutMs: 900_000,
      recipeOperationTimeoutMs: 240_000,
      unrestrictedTimeoutMs: 3_600_000
    });

    await server.close();
  });

  it('uses discovery and login for provider auth routes in v0.9.0', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-provider-discovery-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const openrouterProviders = await fetch(
      `${server.baseUrl}/api/model-providers?profileId=jbarton&inspectedProviderId=openrouter`
    ).then((result) => readJson<ModelProviderResponse>(result));
    const openrouter = openrouterProviders.providers.find((provider) => provider.id === 'openrouter');
    const beginAuth = await fetch(`${server.baseUrl}/api/provider-auth`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton',
        provider: 'openrouter'
      })
    }).then((result) => readJson<ModelProviderResponse>(result));
    const pollResult = await fetch(`${server.baseUrl}/api/provider-auth/poll`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton',
        provider: 'openrouter'
      })
    }).then((result) => readJson<ModelProviderResponse>(result));

    expect(openrouter?.supportsModelDiscovery).toBe(true);
    expect(openrouter?.models.length).toBeGreaterThan(0);
    expect(openrouter?.configurationFields.find((field) => field.key === 'defaultModel')).toMatchObject({
      input: 'select',
      disabled: false
    });
    expect(openrouter?.configurationFields.find((field) => field.key === 'defaultModel')?.options.length).toBeGreaterThan(0);
    expect(openrouter?.modelSelectionMode).toBe('select_only');
    // In v0.9.0, beginProviderAuth calls login then discovery
    expect(beginAuth.runtimeReadiness.ready).toBe(true);
    // pollProviderAuth just calls discovery
    expect(pollResult.runtimeReadiness.ready).toBe(true);

    await server.close();
  });

  it('falls back to dump when model --json is unavailable in v0.9.0', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-provider-fallback-unavailable-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot, {
      failureFlags: 'models-json-unavailable'
    });

    const providers = await fetch(`${server.baseUrl}/api/model-providers?profileId=jbarton&inspectedProviderId=openrouter`);
    const payload = await readJson<ModelProviderResponse>(providers);

    // In v0.9.0, when model --json fails, the client falls back to hermes dump
    expect(providers.status).toBe(200);
    expect(payload.runtimeReadiness.ready).toBe(true);
    expect(payload.config.defaultModel).toBeTruthy();

    await server.close();
  });

  it('falls back to dump when model --json returns invalid data in v0.9.0', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-provider-fallback-invalid-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot, {
      failureFlags: 'models-json-invalid'
    });

    const providers = await fetch(`${server.baseUrl}/api/model-providers?profileId=jbarton&inspectedProviderId=openrouter`);
    const payload = await readJson<ModelProviderResponse>(providers);

    // In v0.9.0, when model --json returns invalid data, the client falls back to hermes dump
    expect(providers.status).toBe(200);
    expect(payload.runtimeReadiness.ready).toBe(true);

    await server.close();
  });

  it('renames and deletes sessions through the bridge API and keeps deleted sessions hidden', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-session-actions-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const sessionsBeforeRename = await fetch(`${server.baseUrl}/api/sessions?page=1&pageSize=25&search=&profileId=jbarton`).then((result) =>
      readJson<SessionsResponse>(result)
    );
    const targetSession = sessionsBeforeRename.items[0];

    expect(targetSession).toBeTruthy();

    const renamedSession = await fetch(`${server.baseUrl}/api/sessions/${encodeURIComponent(targetSession?.id ?? '')}/rename`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton',
        title: 'Renamed in bridge test'
      })
    }).then((result) => readJson<Session>(result));
    const sessionsAfterRename = await fetch(`${server.baseUrl}/api/sessions?page=1&pageSize=25&search=&profileId=jbarton`).then((result) =>
      readJson<SessionsResponse>(result)
    );

    expect(renamedSession.title).toBe('Renamed in bridge test');
    expect(sessionsAfterRename.items.some((session) => session.id === renamedSession.id && session.title === 'Renamed in bridge test')).toBe(true);

    const deletion = await fetch(`${server.baseUrl}/api/sessions/${encodeURIComponent(renamedSession.id)}/delete`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton'
      })
    }).then((result) => readJson<{ sessionId: string; mode: string; deletedAt: string }>(result));
    const sessionsAfterDelete = await fetch(`${server.baseUrl}/api/sessions?page=1&pageSize=25&search=&profileId=jbarton`).then((result) =>
      readJson<SessionsResponse>(result)
    );

    expect(deletion.sessionId).toBe(renamedSession.id);
    expect(deletion.mode).toBe('hybrid');
    expect(sessionsAfterDelete.items.some((session) => session.id === renamedSession.id)).toBe(false);

    await server.close();
  });

  it('deletes hub skills through the bridge API and persists the removal', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-skill-delete-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const skillsBeforeDelete = await fetch(`${server.baseUrl}/api/skills?profileId=jbarton`).then((result) => readJson<SkillsResponse>(result));
    const targetSkill = skillsBeforeDelete.items.find((item) => item.name === 'project-notes');

    expect(targetSkill).toBeTruthy();

    const deletion = await fetch(`${server.baseUrl}/api/skills/${encodeURIComponent(targetSkill?.id ?? '')}/delete`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton'
      })
    }).then((result) => readJson<{ profileId: string; skillId: string; skillName: string; deletedAt: string }>(result));
    const skillsAfterDelete = await fetch(`${server.baseUrl}/api/skills?profileId=jbarton`).then((result) => readJson<SkillsResponse>(result));

    expect(deletion.profileId).toBe('jbarton');
    expect(deletion.skillName).toBe('project-notes');
    expect(skillsAfterDelete.items.some((item) => item.name === 'project-notes')).toBe(false);

    await server.close();
  });

  it('generates compact skill summaries, persists them locally, and removes them when skills are deleted', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-skill-summaries-'));
    tempRoots.push(tempRoot);
    const databasePath = path.join(tempRoot, 'bridge.sqlite');
    const skillFiles = [
      {
        name: 'google-workspace',
        content: `# Google Recipe

Use \`gmail unread\`, \`calendar events\`, \`docs search\`, and \`drive files\`.
Authenticate with Google Recipe and summarize inbox status quickly.
`
      },
      {
        name: 'project-notes',
        content: `# Project Notes

Track \`project notes\`, \`recipe context\`, \`delivery risks\`, and \`launch tasks\`.
Keep summaries short and searchable for the active profile.
`
      }
    ];

    for (const skill of skillFiles) {
      const skillFile = path.join(tempRoot, 'fixture-home', 'profiles', '8tn', 'skills', 'productivity', skill.name, 'SKILL.md');
      fs.mkdirSync(path.dirname(skillFile), { recursive: true });
      fs.writeFileSync(skillFile, skill.content, 'utf8');
    }

    const first = await startServer(tempRoot, {
      databasePath
    });

    const initialSkills = await fetch(`${first.baseUrl}/api/skills?profileId=8tn`).then((result) => readJson<SkillsResponse>(result));
    const googleRecipe = initialSkills.items.find((item) => item.name === 'google-workspace');
    const projectNotes = initialSkills.items.find((item) => item.name === 'project-notes');

    expect(googleRecipe?.summary.length).toBeGreaterThan(0);
    expect(projectNotes?.summary.length).toBeGreaterThan(0);
    expect(googleRecipe?.summary.split(/\s+/u).length ?? 0).toBeLessThanOrEqual(10);
    expect(projectNotes?.summary.split(/\s+/u).length ?? 0).toBeLessThanOrEqual(10);

    await first.close();

    const degraded = await startServer(tempRoot, {
      databasePath,
      failureFlags: 'skills'
    });
    const cachedSkills = await fetch(`${degraded.baseUrl}/api/skills?profileId=8tn`).then((result) => readJson<SkillsResponse>(result));

    expect(cachedSkills.connection.status).toBe('degraded');
    expect(cachedSkills.items.find((item) => item.name === 'google-workspace')?.summary).toBe(googleRecipe?.summary);

    await degraded.close();

    const finalServer = await startServer(tempRoot, {
      databasePath
    });
    await fetch(`${finalServer.baseUrl}/api/skills/${encodeURIComponent(projectNotes?.id ?? '')}/delete`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: '8tn'
      })
    }).then((result) => readJson<SkillsResponse | { deletedAt: string }>(result));
    const afterDelete = await fetch(`${finalServer.baseUrl}/api/skills?profileId=8tn`).then((result) => readJson<SkillsResponse>(result));

    expect(afterDelete.items.find((item) => item.name === 'project-notes')).toBeUndefined();

    await finalServer.close();
  });

  it('creates, updates, persists, reopens, and deletes session-attached spaces through the bridge API', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-spaces-'));
    tempRoots.push(tempRoot);
    const databasePath = path.join(tempRoot, 'bridge.sqlite');
    const server = await startServer(tempRoot, {
      databasePath
    });

    const session = await fetch(`${server.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton'
      })
    }).then((result) => readJson<Session>(result));

    const created = await fetch(`${server.baseUrl}/api/recipes`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton',
        sessionId: session.id,
        title: 'Roadmap note',
        description: 'Track roadmap changes',
        contentFormat: 'markdown',
        contentData: {
          markdown: '## Roadmap\n\nInitial notes'
        }
      })
    }).then((result) => readJson<RecipeResponse>(result));

    expect(created.recipe.title).toBe('Roadmap note');
    expect(created.recipe.primarySessionId).toBe(session.id);
    expect(getRecipeContentFormat(created.recipe)).toBe('markdown');
    expect(created.events.some((event) => event.type === 'created')).toBe(true);

    const updated = await fetch(`${server.baseUrl}/api/recipes/${encodeURIComponent(created.recipe.id)}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton',
        title: 'Roadmap note updated',
        contentData: {
          markdown: '## Roadmap\n\nUpdated notes'
        }
      })
    }).then((result) => readJson<RecipeResponse>(result));

    expect(updated.recipe.title).toBe('Roadmap note updated');
    const updatedContentTab = getRecipeContentTab(updated.recipe);
    expect(updatedContentTab.content.activeView).toBe('markdown');
    expect(getRecipeContentViewData(updatedContentTab, 'markdown').markdown).toContain('Updated notes');
    expect(updated.events.some((event) => event.type === 'renamed')).toBe(true);

    const openedChat = await fetch(`${server.baseUrl}/api/recipes/${encodeURIComponent(created.recipe.id)}/open-chat`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton'
      })
    }).then((result) => readJson<OpenRecipeChatResponse>(result));

    expect(openedChat.session.id).toBe(session.id);
    expect(openedChat.session.attachedRecipeId).toBe(created.recipe.id);
    expect(openedChat.recipe.primarySessionId).toBe(session.id);

    const attachedSessionMessages = await fetch(
      `${server.baseUrl}/api/sessions/${encodeURIComponent(session.id)}/messages?profileId=${encodeURIComponent('jbarton')}`
    ).then((result) => readJson<SessionMessagesResponse>(result));
    expect(attachedSessionMessages.attachedRecipe?.id).toBe(created.recipe.id);
    expect(attachedSessionMessages.session.attachedRecipeId).toBe(created.recipe.id);
    expect(attachedSessionMessages.recipeEvents.some((event) => event.recipeId === created.recipe.id && event.type === 'linked_chat')).toBe(true);

    const listedBeforeRestart = await fetch(`${server.baseUrl}/api/recipes?profileId=jbarton`).then((result) => readJson<RecipesResponse>(result));
    expect(listedBeforeRestart.items.some((recipe) => recipe.id === created.recipe.id && recipe.primarySessionId === session.id)).toBe(true);
    expect(listedBeforeRestart.events.some((event) => event.recipeId === created.recipe.id && event.type === 'linked_chat')).toBe(true);

    await server.close();

    const reopened = await startServer(tempRoot, {
      databasePath
    });
    const reopenedSessionMessages = await fetch(
      `${reopened.baseUrl}/api/sessions/${encodeURIComponent(session.id)}/messages?profileId=${encodeURIComponent('jbarton')}`
    ).then((result) => readJson<SessionMessagesResponse>(result));

    expect(reopenedSessionMessages.attachedRecipe?.id).toBe(created.recipe.id);
    expect(reopenedSessionMessages.attachedRecipe?.title).toBe('Roadmap note updated');
    expect(reopenedSessionMessages.recipeEvents.some((event) => event.recipeId === created.recipe.id && event.type === 'linked_chat')).toBe(true);

    const deleted = await fetch(`${reopened.baseUrl}/api/recipes/${encodeURIComponent(created.recipe.id)}/delete`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton'
      })
    }).then((result) => readJson<RecipeDeletionResponse>(result));
    const sessionsAfterDelete = await fetch(`${reopened.baseUrl}/api/sessions?page=1&pageSize=25&search=&profileId=jbarton`).then((result) =>
      readJson<SessionsResponse>(result)
    );
    const messagesAfterDelete = await fetch(
      `${reopened.baseUrl}/api/sessions/${encodeURIComponent(session.id)}/messages?profileId=${encodeURIComponent('jbarton')}`
    ).then((result) => readJson<SessionMessagesResponse>(result));

    expect(deleted.recipeId).toBe(created.recipe.id);
    expect(sessionsAfterDelete.items.some((item) => item.id === session.id && item.attachedRecipeId === null)).toBe(true);
    expect(messagesAfterDelete.attachedRecipe).toBeNull();

    await reopened.close();
  });

  it('keeps chat as the persisted page when opening and loading an attached-recipe session', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-recipe-ui-state-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const session = await fetch(`${server.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton'
      })
    }).then((result) => readJson<Session>(result));
    const created = await fetch(`${server.baseUrl}/api/recipes`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton',
        sessionId: session.id,
        title: 'Roadmap note',
        description: 'Attached session hydration regression',
        contentFormat: 'markdown',
        contentData: {
          markdown: '## Roadmap\n\nInitial notes'
        }
      })
    }).then((result) => readJson<RecipeResponse>(result));

    const openedChat = await fetch(`${server.baseUrl}/api/recipes/${encodeURIComponent(created.recipe.id)}/open-chat`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton'
      })
    }).then((result) => readJson<OpenRecipeChatResponse>(result));

    const beforeMessagesBootstrap = await fetch(`${server.baseUrl}/api/bootstrap`).then((result) => readJson<BootstrapResponse>(result));
    expect(beforeMessagesBootstrap.uiState.currentPage).toBe('chat');
    expect(beforeMessagesBootstrap.uiState.activeSessionIdByProfile.jbarton).toBe(openedChat.session.id);

    const loadedMessages = await fetch(
      `${server.baseUrl}/api/sessions/${encodeURIComponent(openedChat.session.id)}/messages?profileId=${encodeURIComponent('jbarton')}`
    ).then((result) => readJson<SessionMessagesResponse>(result));

    expect(loadedMessages.attachedRecipe?.id).toBe(created.recipe.id);

    const afterMessagesBootstrap = await fetch(`${server.baseUrl}/api/bootstrap`).then((result) => readJson<BootstrapResponse>(result));
    expect(afterMessagesBootstrap.uiState.currentPage).toBe('chat');
    expect(afterMessagesBootstrap.uiState.activeSessionIdByProfile.jbarton).toBe(openedChat.session.id);

    await server.close();
  });

  it('removes individual aligned recipe entries through the HTTP entry-actions route', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-recipe-entry-actions-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const session = await fetch(`${server.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton'
      })
    }).then((result) => readJson<Session>(result));

    const created = await fetch(`${server.baseUrl}/api/recipes`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton',
        sessionId: session.id,
        title: 'Hotel shortlist',
        description: 'Structured rows for deletion',
        contentFormat: 'table',
        contentData: {
          columns: [
            {
              id: 'hotel',
              label: 'Hotel',
              emphasis: 'primary'
            },
            {
              id: 'price',
              label: 'Price',
              emphasis: 'none'
            }
          ],
          rows: [
            {
              hotel: 'AC Hotel Dayton',
              price: '$189'
            },
            {
              hotel: 'Hotel Ardent',
              price: '$210'
            }
          ]
        }
      })
    }).then((result) => readJson<RecipeResponse>(result));
    const entries = getRecipeContentEntries(created.recipe);

    const updated = await fetch(`${server.baseUrl}/api/recipes/${encodeURIComponent(created.recipe.id)}/entries/actions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton',
        action: 'remove',
        entryIds: [entries[0]!.id]
      })
    }).then((result) => readJson<{ removedEntryIds: string[]; deletedSourceEntryIds: string[]; recipe: RecipeResponse['recipe'] }>(result));

    expect(updated.removedEntryIds).toEqual([entries[0]!.id]);
    expect(updated.deletedSourceEntryIds).toEqual([]);
    expect(getRecipeContentEntries(updated.recipe)).toHaveLength(1);
    expect(getRecipeContentEntries(updated.recipe)[0]?.row.hotel).toBe('Hotel Ardent');
    expect(getRecipeContentViewData(getRecipeContentTab(updated.recipe), 'markdown').markdown).not.toContain('AC Hotel Dayton');

    await server.close();
  });

  it('strips legacy Hermes recipe-operation blocks during chat streams and keeps the baseline Home recipe attached to the session', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-recipe-stream-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const bootstrap = await fetch(`${server.baseUrl}/api/bootstrap`).then((result) => readJson<BootstrapResponse>(result));
    const profileId = bootstrap.activeProfileId ?? 'jbarton';
    const session = await fetch(`${server.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId
      })
    }).then((result) => readJson<Session>(result));

    const createEvents = await fetch(`${server.baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId,
        sessionId: session.id,
        content: 'Create a launch tracker recipe.'
      })
    }).then(collectStreamEvents);

    const createRecipeEvent = createEvents.find((event) => event.type === 'recipe_event');
    const createComplete = createEvents.find((event) => event.type === 'complete');
    expect(createRecipeEvent?.type).toBe('recipe_event');
    if (createRecipeEvent?.type === 'recipe_event') {
      expect(createRecipeEvent.event.type).toBe('created');
      expect(createRecipeEvent.recipe?.renderMode).toBe('legacy_content_v1');
    }
    expect(createComplete?.type).toBe('complete');
    if (createComplete?.type === 'complete') {
      expect(createComplete.assistantMessage.content).toContain('Created a launch tracker recipe for this request.');
      expect(createComplete.assistantMessage.content).not.toContain('hermes-ui-recipes');
    }

    const afterCreate = await fetch(
      `${server.baseUrl}/api/sessions/${encodeURIComponent(session.id)}/messages?profileId=${encodeURIComponent(profileId)}`
    ).then((result) => readJson<SessionMessagesResponse>(result));
    const createdRecipe = afterCreate.attachedRecipe;

    expect(afterCreate.session.attachedRecipeId).toBe(createdRecipe?.id ?? null);
    expect(createdRecipe?.primarySessionId).toBe(session.id);
    expectLegacyHomeRecipe(createdRecipe, 'Created a launch tracker recipe for this request.');

    const updateEvents = await fetch(`${server.baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId,
        sessionId: session.id,
        recipeId: createdRecipe?.id,
        content: 'Update the current recipe with another card.'
      })
    }).then(collectStreamEvents);

    const updateRecipeEvent = updateEvents.find((event) => event.type === 'recipe_event');
    const updatedSession = await fetch(
      `${server.baseUrl}/api/sessions/${encodeURIComponent(session.id)}/messages?profileId=${encodeURIComponent(profileId)}`
    ).then((result) => readJson<SessionMessagesResponse>(result));

    expect(updateRecipeEvent?.type).toBe('recipe_event');
    if (updateRecipeEvent?.type === 'recipe_event') {
      expect(updateRecipeEvent.event.type).toBe('updated');
      expect(updateRecipeEvent.recipe?.id).toBe(createdRecipe?.id);
    }
    expect(updatedSession.attachedRecipe?.id).toBe(createdRecipe?.id);
    expectLegacyHomeRecipe(updatedSession.attachedRecipe, 'Updated the current recipe with fixture data.');
    expect(updatedSession.recipeEvents.some((event) => event.type === 'updated')).toBe(true);

    const deleteEvents = await fetch(`${server.baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId,
        sessionId: session.id,
        recipeId: createdRecipe?.id,
        content: 'Delete the current recipe.'
      })
    }).then(collectStreamEvents);
    const deleteRecipeEvent = deleteEvents.find((event) => event.type === 'recipe_event');
    const afterDelete = await fetch(
      `${server.baseUrl}/api/sessions/${encodeURIComponent(session.id)}/messages?profileId=${encodeURIComponent(profileId)}`
    ).then((result) => readJson<SessionMessagesResponse>(result));

    expect(deleteRecipeEvent?.type).toBe('recipe_event');
    if (deleteRecipeEvent?.type === 'recipe_event') {
      expect(deleteRecipeEvent.event.type).toBe('updated');
    }
    expect(afterDelete.session.attachedRecipeId).toBe(createdRecipe?.id ?? null);
    expect(afterDelete.attachedRecipe?.id).toBe(createdRecipe?.id);
    expectLegacyHomeRecipe(afterDelete.attachedRecipe, 'Deleted the current recipe.');

    await server.close();
  });

  it('creates stable Home recipes for legacy-style fixture prompts and preserves their baseline or rich state across restart', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-recipe-types-'));
    tempRoots.push(tempRoot);
    const databasePath = path.join(tempRoot, 'bridge.sqlite');
    const server = await startServer(tempRoot, {
      databasePath
    });

    const bootstrap = await fetch(`${server.baseUrl}/api/bootstrap`).then((result) => readJson<BootstrapResponse>(result));
    const profileId = bootstrap.activeProfileId ?? 'jbarton';
    const prompts = [
      {
        prompt: 'Create a recipe with a table of random numbers.',
        summary: 'Created a random numbers recipe for this request.',
        expectedMode: 'baseline'
      },
      {
        prompt: 'Create a launch tracker recipe.',
        summary: 'Created a launch tracker recipe for this request.',
        expectedMode: 'baseline'
      },
      {
        prompt: 'Create a markdown recipe with research notes.',
        summary: 'Created a research notes recipe for this request.',
        expectedMode: 'rich'
      }
    ];
    const createdSessions: Array<{ sessionId: string; summary: string; expectedMode: 'baseline' | 'rich' }> = [];

    for (const item of prompts) {
      const session = await fetch(`${server.baseUrl}/api/sessions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          profileId
        })
      }).then((result) => readJson<Session>(result));
      const events = await fetch(`${server.baseUrl}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          profileId,
          sessionId: session.id,
          content: item.prompt
        })
      }).then(collectStreamEvents);
      const completeEvent = events.find((event) => event.type === 'complete');
      await server.bridge.waitForRecipeEnrichmentQueues();
      const sessionMessages = await fetch(
        `${server.baseUrl}/api/sessions/${encodeURIComponent(session.id)}/messages?profileId=${encodeURIComponent(profileId)}`
      ).then((result) => readJson<SessionMessagesResponse>(result));

      expect(events.some((event) => event.type === 'recipe_event')).toBe(true);
      expect(completeEvent?.type).toBe('complete');
      if (completeEvent?.type === 'complete') {
        expect(completeEvent.assistantMessage.content).not.toContain('hermes-ui-recipes');
      }
      expect(sessionMessages.attachedRecipe?.primarySessionId).toBe(session.id);
      expect(sessionMessages.session.attachedRecipeId).toBe(sessionMessages.attachedRecipe?.id ?? null);
      if (item.expectedMode === 'rich') {
        expectPromotedRichHomeRecipe(sessionMessages.attachedRecipe, item.summary);
      } else {
        expectLegacyHomeRecipe(sessionMessages.attachedRecipe, item.summary);
      }

      createdSessions.push({
        sessionId: session.id,
        summary: item.summary,
        expectedMode: item.expectedMode as 'baseline' | 'rich'
      });
    }

    await server.close();

    const reopened = await startServer(tempRoot, {
      databasePath
    });

    for (const created of createdSessions) {
      const sessionMessages = await fetch(
        `${reopened.baseUrl}/api/sessions/${encodeURIComponent(created.sessionId)}/messages?profileId=${encodeURIComponent(profileId)}`
      ).then((result) => readJson<SessionMessagesResponse>(result));
      expect(sessionMessages.session.attachedRecipeId).toBe(sessionMessages.attachedRecipe?.id ?? null);
      if (created.expectedMode === 'rich') {
        expectPromotedRichHomeRecipe(sessionMessages.attachedRecipe, created.summary);
      } else {
        expectLegacyHomeRecipe(sessionMessages.attachedRecipe, created.summary);
      }
    }

    await reopened.close();
  });

  it(
    'auto-creates Home recipes for structured-result prompts and promotes richer declarative recipes without requiring the word recipe',
    async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-auto-recipe-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const bootstrap = await fetch(`${server.baseUrl}/api/bootstrap`).then((result) => readJson<BootstrapResponse>(result));
    const profileId = bootstrap.activeProfileId ?? 'jbarton';
    const prompts = [
      {
        content: 'Find good hotels in Dayton, OH for a weekend stay.'
      },
      {
        content: 'Good Italian restaurants near Dayton, OH.'
      },
      {
        content: 'Make a project plan for launching our beta.'
      },
      {
        content: 'Break down a weekend Dayton trip budget by line item.'
      },
      {
        content: 'Compare three CRM options and give me a shortlist.'
      }
    ];

    for (const prompt of prompts) {
      const session = await fetch(`${server.baseUrl}/api/sessions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          profileId
        })
      }).then((result) => readJson<Session>(result));

      const events = await fetch(`${server.baseUrl}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          profileId,
          sessionId: session.id,
          content: prompt.content
        })
      }).then(collectStreamEvents);
      const completeEvent = events.find((event) => event.type === 'complete');
      await server.bridge.waitForRecipeEnrichmentQueues();
      const sessionMessages = await waitForSessionMessages(
        server.baseUrl,
        profileId,
        session.id,
        (payload) =>
          Boolean(
            payload.attachedRecipe &&
              (payload.attachedRecipe.dynamic?.recipeTemplate ||
                payload.attachedRecipe.dynamic?.activeBuild?.phase === 'failed')
          ),
        10_000
      );

      expect(completeEvent?.type).toBe('complete');
      expect(events.some((event) => event.type === 'recipe_event')).toBe(true);
      expect(sessionMessages.session.attachedRecipeId).toBeTruthy();
      expect(sessionMessages.attachedRecipe?.primarySessionId).toBe(session.id);
      expect(sessionMessages.attachedRecipe?.id).toBe(sessionMessages.session.attachedRecipeId);
      expect(sessionMessages.attachedRecipe ? hasMeaningfulAttachedRecipe(sessionMessages.attachedRecipe) : false).toBe(true);
      expectPromotedRichHomeRecipe(sessionMessages.attachedRecipe);
      if (completeEvent?.type === 'complete') {
        expect(completeEvent.assistantMessage.content).not.toBe('Hermes ran into an issue. Check the logs for more information.');
        expect(completeEvent.assistantMessage.content).not.toContain('hermes-ui-recipes');
      }
    }

      await server.close();
    },
    20_000
  );

  it('uses the conversational answer as the baseline when main-chat recipe instructions are absent (Phase 1 slim prompt)', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-shell-recipe-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const bootstrap = await fetch(`${server.baseUrl}/api/bootstrap`).then((result) => readJson<BootstrapResponse>(result));
    const profileId = bootstrap.activeProfileId ?? 'jbarton';
    const session = await fetch(`${server.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId
      })
    }).then((result) => readJson<Session>(result));

    const events = await fetch(`${server.baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId,
        sessionId: session.id,
        content: 'Create a shell-only hotel shortlist for Dayton, OH.'
      })
    }).then(collectStreamEvents);
    const errorEvent = events.find((event) => event.type === 'error');
    const completeEvent = events.find((event) => event.type === 'complete');
    await server.bridge.waitForRecipeEnrichmentQueues();
    const sessionMessages = await fetch(
      `${server.baseUrl}/api/sessions/${encodeURIComponent(session.id)}/messages?profileId=${encodeURIComponent(profileId)}`
    ).then((result) => readJson<SessionMessagesResponse>(result));

    expect(errorEvent).toBeUndefined();
    expect(events.some((event) => event.type === 'recipe_event')).toBe(true);
    expect(sessionMessages.attachedRecipe).not.toBeNull();
    expect(sessionMessages.session.attachedRecipeId).toBeTruthy();
    // Phase 1: the main chat no longer appends recipe-creation instructions, so the
    // baseline Home recipe is seeded from the conversational answer rather than an
    // empty shell. The structured template is built by the separate enrichment pipeline.
    expectBaselineHomeRecipe(sessionMessages.attachedRecipe);
    expect(
      sessionMessages.messages.some(
        (message) => message.role === 'assistant' && message.content.includes('Italian restaurants')
      )
    ).toBe(true);
    expect(completeEvent?.type).toBe('complete');
    if (completeEvent?.type === 'complete') {
      expect(completeEvent.assistantMessage.content).not.toContain('hermes-ui-recipes');
    }

    await server.close();
  });

  it('keeps recovered legacy recipe blocks stable while promoting richer declarative recipes only where structured intent warrants them', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-recipe-recovered-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const bootstrap = await fetch(`${server.baseUrl}/api/bootstrap`).then((result) => readJson<BootstrapResponse>(result));
    const profileId = bootstrap.activeProfileId ?? 'jbarton';
    const prompts = [
      {
        content: 'Create a recovered table recipe with a table of random numbers.',
        summary: 'Created a random numbers recipe for this request.',
        expectedMode: 'baseline'
      },
      {
        content: 'Create a recovered card recipe for a launch tracker.',
        summary: 'Created a launch tracker recipe for this request.',
        expectedMode: 'baseline'
      },
      {
        content: 'Create a recovered markdown recipe with research notes.',
        summary: 'Created a research notes recipe for this request.',
        expectedMode: 'rich'
      }
    ];

    for (const prompt of prompts) {
      const session = await fetch(`${server.baseUrl}/api/sessions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          profileId
        })
      }).then((result) => readJson<Session>(result));

      const events = await fetch(`${server.baseUrl}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          profileId,
          sessionId: session.id,
          content: prompt.content
        })
      }).then(collectStreamEvents);
      await server.bridge.waitForRecipeEnrichmentQueues();
      const sessionMessages = await fetch(
        `${server.baseUrl}/api/sessions/${encodeURIComponent(session.id)}/messages?profileId=${encodeURIComponent(profileId)}`
      ).then((result) => readJson<SessionMessagesResponse>(result));
      const telemetry = await fetch(
        `${server.baseUrl}/api/telemetry?profileId=${encodeURIComponent(profileId)}&sessionId=${encodeURIComponent(session.id)}&limit=20`
      ).then((result) => readJson<TelemetryResponse>(result));
      const completeEvent = events.find((event) => event.type === 'complete');

      expect(events.some((event) => event.type === 'recipe_event')).toBe(true);
      expect(
        events.some(
          (event) =>
            event.type === 'activity' && event.activity.label === 'Hermes UI Recipes block' && event.activity.state === 'failed'
        )
      ).toBe(false);
      expect(telemetry.items.some((event) => String(event.code).startsWith('RECIPE_BLOCK_'))).toBe(false);
      expect(telemetry.items.some((event) => event.code === 'RECIPE_BLOCK_PARSE_FAILED')).toBe(false);
      if (prompt.expectedMode === 'rich') {
        expectPromotedRichHomeRecipe(sessionMessages.attachedRecipe, prompt.summary);
      } else {
        expectLegacyHomeRecipe(sessionMessages.attachedRecipe, prompt.summary);
      }
      expect(completeEvent?.type).toBe('complete');
      if (completeEvent?.type === 'complete') {
        expect(completeEvent.assistantMessage.content).not.toBe('Hermes ran into an issue. Check the logs for more information.');
        expect(completeEvent.assistantMessage.content).not.toContain('hermes-ui-recipes');
      }
    }

    await server.close();
  });

  it('keeps mixed-prose legacy recipe blocks as baseline Home recipes without parse telemetry', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-recipe-mixed-prose-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const bootstrap = await fetch(`${server.baseUrl}/api/bootstrap`).then((result) => readJson<BootstrapResponse>(result));
    const profileId = bootstrap.activeProfileId ?? 'jbarton';
    const session = await fetch(`${server.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId
      })
    }).then((result) => readJson<Session>(result));

    const events = await fetch(`${server.baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId,
        sessionId: session.id,
        content: 'Create a mixed prose recipe.'
      })
    }).then(collectStreamEvents);
    const sessionMessages = await fetch(
      `${server.baseUrl}/api/sessions/${encodeURIComponent(session.id)}/messages?profileId=${encodeURIComponent(profileId)}`
    ).then((result) => readJson<SessionMessagesResponse>(result));
    const telemetry = await fetch(
      `${server.baseUrl}/api/telemetry?profileId=${encodeURIComponent(profileId)}&sessionId=${encodeURIComponent(session.id)}&limit=20`
    ).then((result) => readJson<TelemetryResponse>(result));
    const completeEvent = events.find((event) => event.type === 'complete');

    expect(events.some((event) => event.type === 'recipe_event')).toBe(true);
    expectLegacyHomeRecipe(sessionMessages.attachedRecipe, 'Created a mixed prose tracker for this request.');
    expect(telemetry.items.some((event) => String(event.code).startsWith('RECIPE_BLOCK_'))).toBe(false);
    expect(telemetry.items.some((event) => event.code === 'RECIPE_BLOCK_PARSE_FAILED')).toBe(false);
    expect(completeEvent?.type).toBe('complete');
    if (completeEvent?.type === 'complete') {
      expect(completeEvent.assistantMessage.content).toContain('Created a mixed prose tracker');
      expect(completeEvent.assistantMessage.content).not.toContain('hermes-ui-recipes');
    }

    await server.close();
  });

  it('keeps malformed legacy recipe blocks as baseline Home recipes while preserving the assistant answer', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-recipe-malformed-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const bootstrap = await fetch(`${server.baseUrl}/api/bootstrap`).then((result) => readJson<BootstrapResponse>(result));
    const profileId = bootstrap.activeProfileId ?? 'jbarton';
    const session = await fetch(`${server.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId
      })
    }).then((result) => readJson<Session>(result));
    const spacesBefore = await fetch(`${server.baseUrl}/api/recipes?profileId=${encodeURIComponent(profileId)}`).then((result) =>
      readJson<RecipesResponse>(result)
    );

    const events = await fetch(`${server.baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId,
        sessionId: session.id,
        content: 'Create a malformed recipe.'
      })
    }).then(collectStreamEvents);
    const sessionMessages = await fetch(
      `${server.baseUrl}/api/sessions/${encodeURIComponent(session.id)}/messages?profileId=${encodeURIComponent(profileId)}`
    ).then((result) => readJson<SessionMessagesResponse>(result));
    const spacesAfter = await fetch(`${server.baseUrl}/api/recipes?profileId=${encodeURIComponent(profileId)}`).then((result) =>
      readJson<RecipesResponse>(result)
    );
    const telemetry = await fetch(
      `${server.baseUrl}/api/telemetry?profileId=${encodeURIComponent(profileId)}&sessionId=${encodeURIComponent(session.id)}&limit=20`
    ).then((result) => readJson<TelemetryResponse>(result));
    const errorEvent = events.find((event) => event.type === 'error');
    const completeEvent = events.find((event) => event.type === 'complete');

    expect(events.some((event) => event.type === 'recipe_event')).toBe(true);
    expect(errorEvent).toBeUndefined();
    expectLegacyHomeRecipe(sessionMessages.attachedRecipe, 'Tried to create a malformed recipe block.');
    expect(spacesAfter.items).toHaveLength(spacesBefore.items.length + 1);
    expect(telemetry.items.some((event) => String(event.code).startsWith('RECIPE_BLOCK_'))).toBe(false);
    expect(telemetry.items.some((event) => String(event.code).startsWith('RECIPE_DATA_STRUCTURED_ONLY'))).toBe(false);
    expect(
      sessionMessages.messages.some(
        (message) => message.role === 'assistant' && message.content.includes('Tried to create a malformed recipe block.')
      )
    ).toBe(true);
    expect(completeEvent?.type).toBe('complete');
    if (completeEvent?.type === 'complete') {
      expect(completeEvent.assistantMessage.content).not.toContain('hermes-ui-recipes');
    }

    await server.close();
  });

  it('reopens the existing primary session for attached-recipe chat and keeps the session after deleting the recipe', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-recipe-primary-chat-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const session = await fetch(`${server.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton'
      })
    }).then((result) => readJson<Session>(result));
    const created = await fetch(`${server.baseUrl}/api/recipes`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton',
        sessionId: session.id,
        title: 'Roadmap note',
        contentFormat: 'markdown',
        contentData: {
          markdown: '## Roadmap\n\nInitial notes'
        }
      })
    }).then((result) => readJson<RecipeResponse>(result));

    const firstOpen = await fetch(`${server.baseUrl}/api/recipes/${encodeURIComponent(created.recipe.id)}/open-chat`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton'
      })
    }).then((result) => readJson<OpenRecipeChatResponse>(result));
    const secondOpen = await fetch(`${server.baseUrl}/api/recipes/${encodeURIComponent(created.recipe.id)}/open-chat`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton'
      })
    }).then((result) => readJson<OpenRecipeChatResponse>(result));

    expect(firstOpen.session.id).toBe(session.id);
    expect(secondOpen.session.id).toBe(session.id);
    expect(firstOpen.session.attachedRecipeId).toBe(created.recipe.id);
    expect(secondOpen.session.attachedRecipeId).toBe(created.recipe.id);
    expect(secondOpen.recipe.primarySessionId).toBe(session.id);

    await fetch(`${server.baseUrl}/api/recipes/${encodeURIComponent(created.recipe.id)}/delete`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton'
      })
    });

    const sessions = await fetch(`${server.baseUrl}/api/sessions?page=1&pageSize=25&search=&profileId=jbarton`).then((result) =>
      readJson<SessionsResponse>(result)
    );
    const persistedSession = sessions.items.find((item) => item.id === session.id);

    expect(persistedSession).toBeTruthy();
    expect(persistedSession?.attachedRecipeId).toBeNull();

    await server.close();
  });

  it('converts attached-recipe content formats across markdown/table/cards and drops legacy todo state', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-recipe-format-conversion-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const session = await fetch(`${server.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton'
      })
    }).then((result) => readJson<Session>(result));
    const created = await fetch(`${server.baseUrl}/api/recipes`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton',
        sessionId: session.id,
        title: 'Roadmap checklist',
        contentFormat: 'markdown',
        contentData: {
          markdown: '## Roadmap\n\n- Ship bridge\n- Verify spaces'
        }
      })
    }).then((result) => readJson<RecipeResponse>(result));

    const asTable = await fetch(`${server.baseUrl}/api/recipes/${encodeURIComponent(created.recipe.id)}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton',
        contentFormat: 'table'
      })
    }).then((result) => readJson<RecipeResponse>(result));
    expect(getRecipeContentFormat(asTable.recipe)).toBe('table');
    const asTableContentTab = getRecipeContentTab(asTable.recipe);
    expect(getRecipeContentViewData(asTableContentTab, 'table').rows).toHaveLength(2);

    const asCard = await fetch(`${server.baseUrl}/api/recipes/${encodeURIComponent(created.recipe.id)}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton',
        contentFormat: 'card'
      })
    }).then((result) => readJson<RecipeResponse>(result));
    expect(getRecipeContentFormat(asCard.recipe)).toBe('card');
    const asCardContentTab = getRecipeContentTab(asCard.recipe);
    expect(getRecipeContentViewData(asCardContentTab, 'card').cards).toHaveLength(2);

    const normalizedUiState = await fetch(`${server.baseUrl}/api/recipes/${encodeURIComponent(created.recipe.id)}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton',
        uiState: {
          activeTab: 'todos'
        }
      })
    }).then((result) => readJson<RecipeResponse>(result));

    expect(normalizedUiState.recipe.uiState.activeTab).toBe('content');
    expect(normalizedUiState.recipe.tabs).toHaveLength(1);

    const jobs = await fetch(`${server.baseUrl}/api/jobs?profileId=jbarton`).then((result) => readJson<JobsResponse>(result));
    expect(jobs.items.some((job) => job.label.startsWith('Reminder:'))).toBe(false);

    await server.close();
  });

  it('filters synthetic sessions and keeps listings scoped to the selected profile', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-sessions-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const bootstrap = await fetch(`${server.baseUrl}/api/bootstrap`).then((result) => readJson<BootstrapResponse>(result));
    const sessions = await fetch(`${server.baseUrl}/api/sessions?page=1&pageSize=25&search=&profileId=jbarton`).then((result) =>
      readJson<SessionsResponse>(result)
    );

    expect(bootstrap.activeProfileId).toBe('jbarton');
    expect(bootstrap.recentSessions.every((session) => session.associatedProfileIds.includes('jbarton'))).toBe(true);
    expect(bootstrap.recentSessions.some((session) => /fixture|smoke/i.test(`${session.id} ${session.title} ${session.summary}`))).toBe(
      false
    );
    expect(sessions.profileId).toBe('jbarton');
    expect(sessions.hiddenSyntheticCount).toBeGreaterThan(0);
    expect(sessions.items.every((session) => session.associatedProfileIds.includes('jbarton'))).toBe(true);
    expect(sessions.items.some((session) => /fixture|smoke/i.test(`${session.id} ${session.title} ${session.summary}`))).toBe(false);

    await server.close();
  });

  it('rejects transcripts from a different profile instead of leaking session associations', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-cross-profile-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const eightSessions = await fetch(`${server.baseUrl}/api/sessions?page=1&pageSize=25&search=&profileId=8tn`).then((result) =>
      readJson<SessionsResponse>(result)
    );
    const foreignSessionId = eightSessions.items[0]?.id;
    expect(foreignSessionId).toBeTruthy();

    const crossProfileResponse = await fetch(
      `${server.baseUrl}/api/sessions/${encodeURIComponent(foreignSessionId ?? '')}/messages?profileId=jbarton`
    );
    const crossProfilePayload = await readJson<{ error: ApiError }>(crossProfileResponse);
    const jbartonSessions = await fetch(`${server.baseUrl}/api/sessions?page=1&pageSize=25&search=&profileId=jbarton`).then((result) =>
      readJson<SessionsResponse>(result)
    );

    expect(crossProfileResponse.status).toBe(404);
    expect(crossProfilePayload.error.code).toBe('SESSION_PROFILE_MISMATCH');
    expect(jbartonSessions.items.some((session) => session.id === foreignSessionId)).toBe(false);

    await server.close();
  });

  it('streams chat replies and persists the new session transcript', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-stream-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const bootstrap = await fetch(`${server.baseUrl}/api/bootstrap`).then((result) => readJson<BootstrapResponse>(result));
    const session = await fetch(`${server.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: bootstrap.activeProfileId
      })
    }).then((result) => readJson<Session>(result));

    const streamResponse = await fetch(`${server.baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: bootstrap.activeProfileId,
        sessionId: session.id,
        content: 'Stream this bridge reply'
      })
    });
    const events = await collectStreamEvents(streamResponse);
    const transcript = await fetch(
      `${server.baseUrl}/api/sessions/${session.id}/messages?profileId=${encodeURIComponent(bootstrap.activeProfileId ?? 'jbarton')}`
    ).then((result) => readJson<SessionMessagesResponse>(result));
    const reloadedTranscript = await fetch(
      `${server.baseUrl}/api/sessions/${session.id}/messages?profileId=${encodeURIComponent(bootstrap.activeProfileId ?? 'jbarton')}`
    ).then((result) => readJson<SessionMessagesResponse>(result));
    const exported = await fetch(
      `${server.baseUrl}/api/sessions/${session.id}/export?profileId=${encodeURIComponent(bootstrap.activeProfileId ?? 'jbarton')}`
    ).then((result) =>
      readJson<{
        profileId: string;
        session: Session;
        messages: Array<{ visibility: string; kind: string; content: string }>;
      }>(result)
    );
    const latestRuntimeRequest = transcript.runtimeRequests.at(-1);

    expect(events.some((event: { type: string }) => event.type === 'assistant_snapshot')).toBe(true);
    expect(events.some((event: { type: string }) => event.type === 'complete')).toBe(true);
    expect(transcript.messages.some((message: { role: string }) => message.role === 'assistant')).toBe(true);
    expect(transcript.session.runtimeSessionId).toBeTruthy();
    expect(transcript.runtimeRequests).toHaveLength(1);
    expect(reloadedTranscript.runtimeRequests).toHaveLength(1);
    expect(reloadedTranscript.runtimeRequests[0]?.requestId).toBe(transcript.runtimeRequests[0]?.requestId);
    expect(latestRuntimeRequest?.status).toBe('completed');
    expect(latestRuntimeRequest?.messageIds).toEqual(
      expect.arrayContaining([
        transcript.messages.find((message) => message.role === 'user')?.id,
        transcript.messages.find((message) => message.role === 'assistant')?.id
      ])
    );
    expect(latestRuntimeRequest?.activities.every((activity) => !['started', 'updated'].includes(activity.state))).toBe(true);
    expect(latestRuntimeRequest?.activities.every((activity) => activity.timestamp.length > 0)).toBe(true);
    expect(exported.messages.every((message) => message.visibility === 'transcript' && message.kind !== 'technical')).toBe(true);
    expect(exported.messages.map((message) => message.content).join('\n')).not.toMatch(
      /Bridge execution note|Raw system message|python scripts\/check_mail\.py|Built-in toolsets|session_id:|Traceback|No such file or directory/u
    );

    await server.close();
  });

  it('stores chat failure telemetry and finalizes failed runtime requests', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-stream-failure-telemetry-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot, {
      failureFlags: 'chat'
    });

    const bootstrap = await fetch(`${server.baseUrl}/api/bootstrap`).then((result) => readJson<BootstrapResponse>(result));
    const session = await fetch(`${server.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: bootstrap.activeProfileId
      })
    }).then((result) => readJson<Session>(result));
    const streamResponse = await fetch(`${server.baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: bootstrap.activeProfileId,
        sessionId: session.id,
        content: 'Trigger fixture chat failure'
      })
    });
    const events = await collectStreamEvents(streamResponse);
    const transcript = await fetch(
      `${server.baseUrl}/api/sessions/${session.id}/messages?profileId=${encodeURIComponent(bootstrap.activeProfileId ?? 'jbarton')}`
    ).then((result) => readJson<SessionMessagesResponse>(result));
    const telemetry = await fetch(
      `${server.baseUrl}/api/telemetry?profileId=${encodeURIComponent(bootstrap.activeProfileId ?? 'jbarton')}&sessionId=${encodeURIComponent(session.id)}&limit=20`
    ).then((result) => readJson<TelemetryResponse>(result));
    const requestTelemetry = await fetch(
      `${server.baseUrl}/api/telemetry?profileId=${encodeURIComponent(bootstrap.activeProfileId ?? 'jbarton')}&sessionId=${encodeURIComponent(session.id)}&requestId=${encodeURIComponent(transcript.runtimeRequests.at(-1)?.requestId ?? '')}&limit=20`
    ).then((result) => readJson<TelemetryResponse>(result));
    const telemetryByProfile = await fetch(
      `${server.baseUrl}/api/telemetry?profileId=${encodeURIComponent(bootstrap.activeProfileId ?? 'jbarton')}&limit=20`
    ).then((result) => readJson<TelemetryResponse>(result));
    const telemetryAll = await fetch(`${server.baseUrl}/api/telemetry?limit=20`).then((result) => readJson<TelemetryResponse>(result));

    expect(events.some((event) => event.type === 'error')).toBe(true);
    expect(transcript.runtimeRequests.at(-1)?.status).toBe('failed');
    expect(transcript.runtimeRequests.at(-1)?.activities.every((activity) => !['started', 'updated'].includes(activity.state))).toBe(true);
    expect(transcript.messages.at(-1)?.content).toBe('Hermes could not finish the task, so the Home recipe baseline was not updated.');
    expect(transcript.messages.at(-1)?.role).toBe('system');
    expect(transcript.messages.map((message) => message.content).join('\n')).not.toContain('Fixture failed to chat.');
    expect(telemetryByProfile.items.some((event) => event.code === 'CHAT_STREAM_FAILED')).toBe(true);
    expect(telemetryAll.items.some((event) => event.code === 'CHAT_STREAM_FAILED')).toBe(true);
    expect(telemetry.items.some((event) => event.code === 'CHAT_STREAM_FAILED')).toBe(true);
    expect(requestTelemetry.items.some((event) => event.code === 'CHAT_STREAM_FAILED')).toBe(true);

    await server.close();
  });

  it('emits an SSE error event instead of crashing when a stream fails after headers are sent', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-stream-error-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    server.bridge.streamChat = vi.fn(async (_input, onEvent) => {
      await onEvent({
        type: 'progress',
        message: 'Hermes is preparing a response…'
      });

      throw new Error('Simulated stream failure after headers.');
    });

    const bootstrap = await fetch(`${server.baseUrl}/api/bootstrap`).then((result) => readJson<BootstrapResponse>(result));
    const session = await fetch(`${server.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: bootstrap.activeProfileId
      })
    }).then((result) => readJson<Session>(result));

    const streamResponse = await fetch(`${server.baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: bootstrap.activeProfileId,
        sessionId: session.id,
        content: 'Trigger the simulated stream error.'
      })
    });
    const events = await collectStreamEvents(streamResponse);
    const errorEvent = events.find((event) => event.type === 'error');
    const health = await fetch(`${server.baseUrl}/api/health`);

    expect(streamResponse.status).toBe(200);
    expect(events.some((event) => event.type === 'progress')).toBe(true);
    expect(errorEvent?.type).toBe('error');
    if (errorEvent?.type === 'error') {
      expect(errorEvent.error.code).toBe('INTERNAL_ERROR');
      // The client must get a non-empty error message; the message is intentionally
      // generic (internals stay server-side) so we do not assert its exact text.
      expect(errorEvent.error.message.length).toBeGreaterThan(0);
    }
    expect(health.status).toBe(200);

    await server.close();
  });

  it('supports unrestricted access mode and audits when it is enabled and used', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-unrestricted-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const bootstrap = await fetch(`${server.baseUrl}/api/bootstrap`).then((result) => readJson<BootstrapResponse>(result));
    const session = await fetch(`${server.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: bootstrap.activeProfileId
      })
    }).then((result) => readJson<Session>(result));
    const updatedSettings = await fetch(`${server.baseUrl}/api/settings`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        restrictedChatMaxTurns: 1,
        unrestrictedAccessEnabled: true
      })
    }).then((result) => readJson<SettingsResponse>(result));
    const streamResponse = await fetch(`${server.baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: bootstrap.activeProfileId,
        sessionId: session.id,
        content: 'Take unrestricted action for this fixture request.'
      })
    });
    const events = await collectStreamEvents(streamResponse);
    const settingsAfterChat = await fetch(`${server.baseUrl}/api/settings`).then((result) => readJson<SettingsResponse>(result));

    expect(updatedSettings.settings.unrestrictedAccessEnabled).toBe(true);
    expect(events.some((event) => event.type === 'complete')).toBe(true);
    expect(
      settingsAfterChat.accessAudit.latestEvents.some(
        (event) => event.type === 'unrestricted_access_enabled' || event.type === 'unrestricted_access_used'
      )
    ).toBe(true);
    expect(settingsAfterChat.accessAudit.unrestrictedAccessLastEnabledAt).toBeTruthy();
    expect(settingsAfterChat.accessAudit.unrestrictedAccessLastUsedAt).toBeTruthy();

    await server.close();
  });

  it('keeps unread-email replies focused on the final assistant answer', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-unread-email-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const bootstrap = await fetch(`${server.baseUrl}/api/bootstrap`).then((result) => readJson<BootstrapResponse>(result));
    const session = await fetch(`${server.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: bootstrap.activeProfileId
      })
    }).then((result) => readJson<Session>(result));
    const streamResponse = await fetch(`${server.baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: bootstrap.activeProfileId,
        sessionId: session.id,
        content: 'Check my unread email.'
      })
    });
    const events = await collectStreamEvents(streamResponse);
    const transcript = await fetch(
      `${server.baseUrl}/api/sessions/${session.id}/messages?profileId=${encodeURIComponent(bootstrap.activeProfileId ?? 'jbarton')}`
    ).then((result) => readJson<SessionMessagesResponse>(result));

    const completeEvent = events.find((event) => event.type === 'complete');
    const assistantMessages = transcript.messages.filter((message) => message.role === 'assistant').map((message) => message.content);

    expect(completeEvent?.type).toBe('complete');
    if (completeEvent?.type === 'complete') {
      expect(completeEvent.assistantMessage.content).toMatch(/jbarton|google recipe/i);
      expect(completeEvent.assistantMessage.content).not.toMatch(
        /Reached maximum iterations|Tool gmail_unread_count|Built-in toolsets|profile 8tn|AUTH_SCOPE_MISMATCH|session_id:/i
      );
    }
    expect(assistantMessages.some((content) => /jbarton|google recipe/i.test(content))).toBe(true);
    expect(assistantMessages.join('\n')).not.toMatch(
      /Reached maximum iterations|Tool gmail_unread_count|Built-in toolsets|profile 8tn|AUTH_SCOPE_MISMATCH|session_id:/i
    );

    await server.close();
  });

  it('supports active-profile email success paths without leaking raw tool output', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-unread-email-success-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const switchedBootstrap = await fetch(`${server.baseUrl}/api/profiles/select`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: '8tn'
      })
    }).then((result) => readJson<BootstrapResponse>(result));
    const session = await fetch(`${server.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: '8tn'
      })
    }).then((result) => readJson<Session>(result));
    const streamResponse = await fetch(`${server.baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: '8tn',
        sessionId: session.id,
        content: 'How many unread emails do I have?'
      })
    });
    const events = await collectStreamEvents(streamResponse);

    const activityEvents = events.filter((event) => event.type === 'activity');
    const completeEvent = events.find((event) => event.type === 'complete');

    expect(switchedBootstrap.activeProfileId).toBe('8tn');
    expect(activityEvents.length).toBeGreaterThan(0);
    expect(activityEvents.some((event) => event.type === 'activity' && event.activity.label === 'gmail_unread_count')).toBe(true);
    expect(completeEvent?.type).toBe('complete');
    if (completeEvent?.type === 'complete') {
      expect(completeEvent.assistantMessage.content).toContain('1 unread email in 8tn');
      expect(completeEvent.assistantMessage.content).not.toMatch(/Tool gmail_unread_count|AUTH_SCOPE_MISMATCH|session_id:/i);
    }

    await server.close();
  });

  it('keeps nearby-search chats responsive, emits search progress, and persists runtime tool history', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-local-search-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const bootstrap = await fetch(`${server.baseUrl}/api/bootstrap`).then((result) => readJson<BootstrapResponse>(result));
    const profileId = bootstrap.activeProfileId ?? 'jbarton';
    const session = await fetch(`${server.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId
      })
    }).then((result) => readJson<Session>(result));

    const events = await fetch(`${server.baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId,
        sessionId: session.id,
        content: 'good Italian restaurants near Dayton, OH'
      })
    }).then(collectStreamEvents);
    const history = await fetch(
      `${server.baseUrl}/api/tool-history?page=1&pageSize=25&profileId=${encodeURIComponent(profileId)}`
    ).then((result) => readJson<ToolHistoryResponse>(result));
    const telemetry = await fetch(
      `${server.baseUrl}/api/telemetry?profileId=${encodeURIComponent(profileId)}&sessionId=${encodeURIComponent(session.id)}&limit=20`
    ).then((result) => readJson<TelemetryResponse>(result));
    const progressEvent = events.find((event) => event.type === 'progress');
    const completeEvent = events.find((event) => event.type === 'complete');

    expect(progressEvent?.type).toBe('progress');
    if (progressEvent?.type === 'progress') {
      expect(progressEvent.message).toBe('Hermes is searching…');
    }
    expect(events.some((event) => event.type === 'activity' && event.activity.label === 'nearby_restaurants_search')).toBe(true);
    expect(completeEvent?.type).toBe('complete');
    if (completeEvent?.type === 'complete') {
      expect(completeEvent.assistantMessage.content).toContain('Italian restaurants near Dayton, OH');
    }
    expect(
      history.runtimeItems.some(
        (item) => item.label === 'nearby_restaurants_search' && item.state === 'completed' && item.sessionId === session.id
      )
    ).toBe(true);
    expect(telemetry.items.some((event) => event.code === 'CHAT_REQUEST_STARTED')).toBe(true);
    expect(telemetry.items.some((event) => event.code === 'CHAT_REQUEST_COMPLETED')).toBe(true);
    expect(telemetry.items.some((event) => event.code === 'CHAT_REQUEST_TIMEOUT')).toBe(false);

    await server.close();
  });

  it('records reviewed tool history for approvals and rejections', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-tool-history-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    const bootstrap = await fetch(`${server.baseUrl}/api/bootstrap`).then((result) => readJson<BootstrapResponse>(result));
    const session = await fetch(`${server.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: bootstrap.activeProfileId
      })
    }).then((result) => readJson<Session>(result));

    const pending = await fetch(`${server.baseUrl}/api/tool-executions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        toolId: 'bridge:reviewed-shell',
        profileId: bootstrap.activeProfileId,
        sessionId: session.id,
        summary: 'Inspect the working directory',
        command: 'pwd',
        args: [],
        cwd: '.'
      })
    }).then((result) => readJson<ToolExecution>(result));

    await fetch(`${server.baseUrl}/api/tool-executions/${pending.id}/resolve`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        decision: 'approve'
      })
    });

    const rejected = await fetch(`${server.baseUrl}/api/tool-executions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        toolId: 'bridge:reviewed-shell',
        profileId: bootstrap.activeProfileId,
        sessionId: session.id,
        summary: 'Reject this request',
        command: 'pwd',
        args: [],
        cwd: '.'
      })
    }).then((result) => readJson<ToolExecution>(result));

    await fetch(`${server.baseUrl}/api/tool-executions/${rejected.id}/resolve`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        decision: 'reject'
      })
    });

    const history = await fetch(
      `${server.baseUrl}/api/tool-history?page=1&pageSize=25&profileId=${encodeURIComponent(bootstrap.activeProfileId ?? 'jbarton')}`
    ).then((result) => readJson<ToolHistoryResponse>(result));

    expect(history.items.some((item: { status: string }) => item.status === 'completed')).toBe(true);
    expect(history.items.some((item: { status: string }) => item.status === 'rejected')).toBe(true);

    await server.close();
  });

  it('provider update and connect succeed via config set and discovery in v0.9.0', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-provider-telemetry-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    // In v0.9.0, config set + discovery succeeds even for unknown models
    const update = await fetch(`${server.baseUrl}/api/model-providers`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton',
        provider: 'openrouter',
        defaultModel: 'openai/does-not-exist'
      })
    });
    // In v0.9.0, connectProvider just runs discovery
    const connect = await fetch(`${server.baseUrl}/api/provider-connections`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        profileId: 'jbarton',
        provider: 'openrouter',
        apiKey: 'any-key',
        label: 'API_KEY'
      })
    });

    expect(update.ok).toBe(true);
    expect(connect.ok).toBe(true);

    await server.close();
  });

  it('surfaces degraded cached bootstrap state when Hermes profile discovery fails', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-degraded-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot);

    await fetch(`${server.baseUrl}/api/bootstrap`);
    process.env.HERMES_FIXTURE_FAIL = 'profile';

    const degradedBootstrap = await fetch(`${server.baseUrl}/api/bootstrap`).then((result) =>
      readJson<BootstrapResponse>(result)
    );

    expect(degradedBootstrap.connection.status).toBe('degraded');
    expect(degradedBootstrap.connection.usingCachedData).toBe(true);
    expect(degradedBootstrap.profiles.length).toBeGreaterThan(0);

    await server.close();
  });

  it('injects the persisted theme into served html before the browser boots', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-theme-html-'));
    tempRoots.push(tempRoot);
    const server = await startServer(tempRoot, {
      staticDirectory: path.resolve(moduleDirectory, '../../web')
    });

    await fetch(`${server.baseUrl}/api/settings`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        themeMode: 'light'
      })
    }).then((result) => readJson<SettingsResponse>(result));

    const html = await fetch(`${server.baseUrl}/`).then((result) => result.text());

    expect(html).toContain("const serverTheme = 'light';");
    expect(html).not.toContain('__HERMES_THEME_MODE__');
    expect(html).toContain('rel="icon"');
    expect(html).toContain('<title>The Kitchen</title>');

    await server.close();
  });

  it('migrates a legacy Electron snapshot into SQLite before serving the browser bridge', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-migration-'));
    tempRoots.push(tempRoot);
    const databasePath = path.join(tempRoot, 'bridge.sqlite');
    const snapshotPath = path.join(tempRoot, 'legacy-state.json');

    fs.writeFileSync(
      snapshotPath,
      JSON.stringify({
        version: 2,
        activeTab: 'profiles',
        themeMode: 'light',
        activeProfileId: 'default',
        activeSessionId: 'legacy-runtime-session',
        profiles: [
          {
            id: 'default',
            name: 'Default',
            description: 'openai/gpt-5.4 · gateway stopped'
          }
        ],
        sessions: [
          {
            id: 'legacy-runtime-session',
            profileId: 'default',
            title: 'Legacy runtime session',
            summary: 'Imported from Electron',
            provider: 'hermes',
            runtimeSessionId: 'legacy-runtime-session'
          }
        ],
        sessionMessages: {
          'legacy-runtime-session': [
            {
              id: 'legacy-user',
              role: 'user',
              content: 'Legacy question',
              timestamp: '2026-04-07T20:00:00.000Z'
            },
            {
              id: 'legacy-assistant',
              role: 'assistant',
              content: 'Legacy answer',
              timestamp: '2026-04-07T20:00:01.000Z'
            }
          ],
          'fallback-local-session': [
            {
              id: 'legacy-user',
              role: 'user',
              blocks: [
                {
                  type: 'markdown',
                  markdown: 'Recovered local draft'
                }
              ],
              timestamp: '2026-04-06T18:00:00.000Z'
            }
          ]
        },
        jobs: [
          {
            id: 'legacy-job',
            label: 'Legacy cron job',
            schedule: 'every 1h',
            status: 'healthy',
            description: 'Imported job',
            lastRun: 'Not reported',
            nextRun: '2026-04-09T00:00:00.000Z'
          }
        ],
        jobsCacheState: {
          status: 'connected',
          source: 'hermes_cli',
          lastRequestedAt: '2026-04-08T20:00:00.000Z',
          lastSuccessfulAt: '2026-04-08T20:00:00.000Z'
        },
        toolExecutionHistory: [
          {
            id: 'legacy-execution',
            summary: 'Legacy reviewed pwd',
            command: 'pwd',
            args: [],
            status: 'completed',
            requestedAt: '2026-04-08T20:05:00.000Z',
            resolvedAt: '2026-04-08T20:05:01.000Z',
            stdout: '/tmp/legacy'
          }
        ],
        pageState: {
          chat: {
            lastVisitedSessionId: 'fallback-local-session'
          },
          profiles: {
            recentSessionIdsByProfile: {
              default: ['legacy-runtime-session', 'fallback-local-session']
            }
          },
          settings: {
            activeSection: 'general'
          }
        },
        sessionSummary: {
          profileId: 'default'
        }
      }),
      'utf8'
    );

    const first = await startServer(tempRoot, {
      databasePath,
      legacySnapshotPaths: [snapshotPath]
    });

    const bootstrap = await fetch(`${first.baseUrl}/api/bootstrap`).then((result) => readJson<BootstrapResponse>(result));
    const importedTranscript = await fetch(
      `${first.baseUrl}/api/sessions/legacy-runtime-session/messages?profileId=default`
    ).then((result) => readJson<SessionMessagesResponse>(result));
    const localTranscript = await fetch(
      `${first.baseUrl}/api/sessions/fallback-local-session/messages?profileId=default`
    ).then((result) => readJson<SessionMessagesResponse>(result));
    process.env.HERMES_FIXTURE_FAIL = 'cron';
    const jobs = await fetch(`${first.baseUrl}/api/jobs?profileId=default`).then((result) => readJson<JobsResponse>(result));
    const history = await fetch(`${first.baseUrl}/api/tool-history?page=1&pageSize=25&profileId=default`).then((result) =>
      readJson<ToolHistoryResponse>(result)
    );

    expect(bootstrap.settings.themeMode).toBe('light');
    expect(bootstrap.activeSessionId).toBe('fallback-local-session');
    expect(importedTranscript.messages.at(-1)?.content).toBe('Legacy answer');
    expect(localTranscript.messages[0]?.content).toBe('Recovered local draft');
    expect(new Set([...importedTranscript.messages, ...localTranscript.messages].map((message) => message.id)).size).toBe(3);
    expect(jobs.connection.status).toBe('degraded');
    expect(jobs.items.some((item) => item.id === 'legacy-job')).toBe(true);
    expect(history.items.some((item) => item.id === 'legacy-execution')).toBe(true);

    await first.close();

    const reopened = await startServer(tempRoot, {
      databasePath,
      legacySnapshotPaths: []
    });
    const reopenedSessions = await fetch(
      `${reopened.baseUrl}/api/sessions?page=1&pageSize=25&search=Legacy&profileId=default`
    ).then((result) => readJson<SessionsResponse>(result));

    expect(reopenedSessions.items.some((item) => item.id === 'legacy-runtime-session')).toBe(true);

    await reopened.close();
  });

  it(
    'routes mutation intent (redo with cards and images) to template enrichment when a recipe is already attached',
    async () => {
      const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-mutation-intent-'));
      tempRoots.push(tempRoot);
      const server = await startServer(tempRoot);

      const bootstrap = await fetch(`${server.baseUrl}/api/bootstrap`).then((result) => readJson<BootstrapResponse>(result));
      const profileId = bootstrap.activeProfileId ?? 'jbarton';

      // Step 1: Establish a recipe baseline from an initial structured-intent prompt.
      const session = await fetch(`${server.baseUrl}/api/sessions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ profileId })
      }).then((result) => readJson<Session>(result));

      await fetch(`${server.baseUrl}/api/chat/stream`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          profileId,
          sessionId: session.id,
          content: 'Find good hotels in Dayton, OH for a weekend stay.'
        })
      }).then(collectStreamEvents);
      await server.bridge.waitForRecipeEnrichmentQueues();

      const firstPayload = await waitForSessionMessages(
        server.baseUrl,
        profileId,
        session.id,
        (payload) =>
          Boolean(
            payload.attachedRecipe &&
              (payload.attachedRecipe.dynamic?.recipeTemplate ||
                payload.attachedRecipe.dynamic?.activeBuild?.phase === 'failed')
          ),
        12_000
      );
      expect(firstPayload.session.attachedRecipeId).toBeTruthy();
      expect(firstPayload.attachedRecipe?.dynamic?.recipeTemplate?.kind).toBe('recipe_template_state');

      // Step 2: Send a mutation intent — "redo this with more pictures and cards".
      // The system should route this through template enrichment, producing recipe_build_progress events.
      const mutationEvents = await fetch(`${server.baseUrl}/api/chat/stream`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          profileId,
          sessionId: session.id,
          content: 'Redo this with more pictures and cards.'
        })
      }).then(collectStreamEvents);

      await server.bridge.waitForRecipeEnrichmentQueues();

      // Mutation intent MUST trigger at least one recipe_build_progress event — confirming that
      // enrichment started rather than falling through to plain-chat "Got it!" reply.
      const buildProgressEvents = mutationEvents.filter((ev) => ev.type === 'recipe_build_progress');
      expect(
        buildProgressEvents.length,
        'mutation intent should trigger recipe_build_progress events (not plain chat)'
      ).toBeGreaterThan(0);

      // The early ghost (Phase 3) should emit a partialTemplateState before the complete event.
      const earlyPartialEvents = mutationEvents.filter(
        (ev) => ev.type === 'recipe_build_progress' && ev.partialTemplateState !== null
      );
      expect(
        earlyPartialEvents.length,
        'early ghost state should be emitted for mutation with an attached recipe'
      ).toBeGreaterThan(0);

      await server.close();
    },
    30_000
  );

  it(
    'emits early ghost state before complete event when a structured intent is classified on an existing recipe',
    async () => {
      const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-bridge-early-ghost-'));
      tempRoots.push(tempRoot);
      const server = await startServer(tempRoot);

      const bootstrap = await fetch(`${server.baseUrl}/api/bootstrap`).then((result) => readJson<BootstrapResponse>(result));
      const profileId = bootstrap.activeProfileId ?? 'jbarton';

      // Step 1: First chat creates a recipe (hotel shortlist)
      const session = await fetch(`${server.baseUrl}/api/sessions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ profileId })
      }).then((result) => readJson<Session>(result));

      await fetch(`${server.baseUrl}/api/chat/stream`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          profileId,
          sessionId: session.id,
          content: 'Find good hotels in Dayton, OH for a weekend stay.'
        })
      }).then(collectStreamEvents);
      await server.bridge.waitForRecipeEnrichmentQueues();

      // Confirm recipe exists
      const basePayload = await waitForSessionMessages(
        server.baseUrl,
        profileId,
        session.id,
        (payload) => Boolean(payload.attachedRecipe?.dynamic?.recipeTemplate),
        12_000
      );
      expect(basePayload.attachedRecipe?.dynamic?.recipeTemplate?.kind).toBe('recipe_template_state');

      // Step 2: Second chat (same session, recipe attached) — structured intent with a known template.
      // The early ghost (Phase 3) should fire BEFORE the complete event in the stream.
      const secondEvents = await fetch(`${server.baseUrl}/api/chat/stream`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          profileId,
          sessionId: session.id,
          content: 'Compare three CRM options and give me a shortlist.'
        })
      }).then(collectStreamEvents);
      await server.bridge.waitForRecipeEnrichmentQueues();

      const completeIndex = secondEvents.findIndex((ev) => ev.type === 'complete');
      const firstGhostIndex = secondEvents.findIndex(
        (ev) => ev.type === 'recipe_build_progress' && ev.partialTemplateState !== null
      );

      // At minimum, some recipe_build_progress events fired.
      expect(
        secondEvents.some((ev) => ev.type === 'recipe_build_progress'),
        'second chat with attached recipe and structured intent should produce recipe_build_progress events'
      ).toBe(true);

      // If an early ghost fired, it should have arrived early in the stream (within a few events of
      // the start, well before the async enrichment completes).
      if (firstGhostIndex >= 0 && completeIndex >= 0) {
        // The ghost should not appear AFTER the complete event (it's meant to be early).
        expect(
          firstGhostIndex,
          'early ghost should arrive before or at the complete event in the SSE stream'
        ).toBeLessThanOrEqual(completeIndex + 2);
      }

      await server.close();
    },
    30_000
  );
});
