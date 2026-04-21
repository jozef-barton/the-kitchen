#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_PROFILE_ID = 'jbarton';
const SEEDED_PROFILE_IDS = ['default', '8tn', 'jbarton'];
const FIXTURE_DISCOVERED_AT = '2026-04-08T20:00:00.000Z';
const FIXTURE_NOUS_VERIFICATION_URL = 'https://portal.nousresearch.com/device/verify?user_code=39RS-VCYV';
const FIXTURE_NOUS_VERIFICATION_CODE = '39RS-VCYV';

function getFailureFlags() {
  return new Set(
    String(process.env.HERMES_FIXTURE_FAIL ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

function shouldFail(scope) {
  return getFailureFlags().has(scope);
}

function readFixtureMarker(scope) {
  const markerFile = path.join(getFixtureRoot(), `.fixture-failure-${scope}`);
  if (!fs.existsSync(markerFile)) {
    return null;
  }

  return fs.readFileSync(markerFile, 'utf8').trim();
}

function writeFixtureMarker(scope, value) {
  const markerFile = path.join(getFixtureRoot(), `.fixture-failure-${scope}`);
  fs.writeFileSync(markerFile, value, 'utf8');
}

function shouldFailRecipeDslBuildOnce(scope, stage) {
  if (!shouldFail(scope)) {
    return false;
  }

  const markerState = readFixtureMarker(scope);
  if (!markerState) {
    if (stage === 'generate') {
      writeFixtureMarker(scope, 'pending-repair');
      return true;
    }

    writeFixtureMarker(scope, 'complete');
    return true;
  }

  if (markerState === 'pending-repair' && stage === 'repair') {
    writeFixtureMarker(scope, 'complete');
    return true;
  }

  return false;
}

function shouldFailRecipeTemplateBuildOnce(scope, stage) {
  if (!shouldFail(scope)) {
    return false;
  }

  const markerState = readFixtureMarker(scope);
  if (!markerState) {
    if (
      stage === 'select' ||
      stage === 'text' ||
      stage === 'hydrate' ||
      stage === 'actions' ||
      stage === 'text_repair' ||
      stage === 'actions_repair'
    ) {
      writeFixtureMarker(scope, 'complete');
      return true;
    }

    return false;
  }

  return false;
}

function shouldFailRecipeTemplateBuildAttempts(scope, stage, maxAttempts, allowedStages) {
  if (!shouldFail(scope) || !allowedStages.includes(stage)) {
    return false;
  }

  const markerState = readFixtureMarker(scope);
  const attemptsUsed = markerState ? Number.parseInt(markerState, 10) : 0;
  if (!Number.isFinite(attemptsUsed) || attemptsUsed >= maxAttempts) {
    return false;
  }

  writeFixtureMarker(scope, String(attemptsUsed + 1));
  return true;
}

function sleep(milliseconds) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, milliseconds);
  });
}

function getFixtureRoot() {
  const root = process.env.HERMES_FIXTURE_HOME ?? path.join(os.tmpdir(), 'hermes-bridge-fixture');
  fs.mkdirSync(root, { recursive: true });
  return root;
}

function getStateFile() {
  return path.join(getFixtureRoot(), 'state.json');
}

function buildProfilePath(profileId) {
  const profilePath = path.join(getFixtureRoot(), 'profiles', profileId);
  fs.mkdirSync(profilePath, { recursive: true });
  return profilePath;
}

function truncate(value, maxLength) {
  return value.length <= maxLength ? value : `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function createSeedSession(index, updatedAt, preview, lastUsedProfileId = null, options = {}) {
  const timestamp = Date.parse(updatedAt) / 1000;
  const idPrefix = options.synthetic ? 'fixture' : 'session';
  const generatedId = options.id ?? `20260408_16${String(index).padStart(2, '0')}39_${idPrefix}_${String(index).padStart(2, '0')}`;

  return {
    id: generatedId,
    title: options.title ?? '',
    preview,
    source: 'cli',
    updatedAt,
    lastUsedProfileId,
    messages: [
      {
        id: 1,
        role: 'user',
        content: `Resume ${preview}`,
        timestamp
      },
      {
        id: 2,
        role: 'assistant',
        content: `${preview} is available.`,
        timestamp: timestamp + 0.001
      }
    ]
  };
}

function createSeedSkills() {
  return {
    default: [
      { name: 'google-workspace', category: 'productivity', source: 'builtin', trust: 'builtin' },
      { name: 'himalaya', category: 'email', source: 'builtin', trust: 'builtin' },
      { name: 'codebase-inspection', category: 'github', source: 'builtin', trust: 'builtin' },
      { name: 'project-notes', category: 'productivity', source: 'hub', trust: 'verified' }
    ],
    '8tn': [
      { name: 'google-workspace', category: 'productivity', source: 'builtin', trust: 'builtin' },
      { name: 'himalaya', category: 'email', source: 'builtin', trust: 'builtin' },
      { name: 'codebase-inspection', category: 'github', source: 'builtin', trust: 'builtin' },
      { name: 'project-notes', category: 'productivity', source: 'hub', trust: 'verified' }
    ],
    jbarton: [
      { name: 'google-workspace', category: 'productivity', source: 'builtin', trust: 'builtin' },
      { name: 'himalaya', category: 'email', source: 'builtin', trust: 'builtin' },
      { name: 'codebase-inspection', category: 'github', source: 'builtin', trust: 'builtin' },
      { name: 'project-notes', category: 'productivity', source: 'hub', trust: 'verified' }
    ]
  };
}

function createSeededState() {
  const seededSessions = Object.fromEntries(
    [
      createSeedSession(8, '2026-04-08T20:00:00.000Z', 'Quarterly planning review', 'jbarton'),
      createSeedSession(7, '2026-04-08T19:30:00.000Z', 'Inbox follow-up for launch prep', 'jbarton'),
      createSeedSession(6, '2026-04-08T19:00:00.000Z', 'Research digest follow-up', '8tn'),
      createSeedSession(5, '2026-04-08T18:30:00.000Z', 'Supplier pricing notes', '8tn'),
      createSeedSession(4, '2026-04-08T18:00:00.000Z', 'Bridge reset planning session', 'jbarton', {
        synthetic: true
      }),
      createSeedSession(3, '2026-04-08T17:30:00.000Z', 'Browser bridge persistence smoke 12345', 'jbarton', {
        synthetic: true
      }),
      createSeedSession(2, '2026-04-08T17:00:00.000Z', 'Prior Hermes chat about jobs', '8tn', {
        synthetic: true
      }),
      createSeedSession(1, '2026-04-08T16:30:00.000Z', 'Fixture hermes reply session', '8tn', {
        synthetic: true
      })
    ].map((session) => [session.id, session])
  );

  return {
    version: 1,
    activeProfileId: 'jbarton',
    nextSessionIndex: 9,
    profiles: {
      default: {
        id: 'default',
        alias: 'default',
        model: 'openai/gpt-5.4',
        gateway: 'stopped',
        skills: 4,
        path: buildProfilePath('default'),
        jobs: [],
        runtimeConfig: {
          defaultModel: 'openai/gpt-5.4',
          provider: 'openrouter',
          baseUrl: 'https://openrouter.ai/api/v1',
          apiMode: 'chat_completions',
          maxTurns: 150,
          reasoningEffort: 'medium',
          toolUseEnforcement: 'auto'
        }
      },
      '8tn': {
        id: '8tn',
        alias: '8tn',
        model: 'openai/gpt-5.4',
        gateway: 'stopped',
        skills: 4,
        path: buildProfilePath('8tn'),
        jobs: [
          {
            id: 'job-8tn-research',
            state: 'active',
            name: 'Research digest',
            schedule: '0 */4 * * *',
            repeat: 'infinite',
            nextRun: '2026-04-08 20:00',
            deliver: 'local',
            skills: 'research-digest'
          }
        ],
        runtimeConfig: {
          defaultModel: 'openai/gpt-5.4',
          provider: 'openrouter',
          baseUrl: 'https://openrouter.ai/api/v1',
          apiMode: 'chat_completions',
          maxTurns: 150,
          reasoningEffort: 'medium',
          toolUseEnforcement: 'auto'
        }
      },
      jbarton: {
        id: 'jbarton',
        alias: 'jbarton',
        model: 'openai/gpt-5.4',
        gateway: 'stopped',
        skills: 4,
        path: buildProfilePath('jbarton'),
        jobs: [],
        runtimeConfig: {
          defaultModel: 'openai/gpt-5.4',
          provider: 'openrouter',
          baseUrl: 'https://openrouter.ai/api/v1',
          apiMode: 'chat_completions',
          maxTurns: 150,
          reasoningEffort: 'medium',
          toolUseEnforcement: 'auto'
        }
      }
    },
    sessions: seededSessions,
    installedSkillsByProfile: createSeedSkills(),
    authProvidersByProfile: {},
    providerAuthSessionsByProfile: {}
  };
}

function ensureFixturePaths(state) {
  for (const profile of Object.values(state.profiles ?? {})) {
    profile.path = profile.path || buildProfilePath(profile.id);
    fs.mkdirSync(profile.path, { recursive: true });
    profile.runtimeConfig = profile.runtimeConfig ?? {
      defaultModel: profile.model ?? 'openai/gpt-5.4',
      provider: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiMode: 'chat_completions',
      maxTurns: 150,
      reasoningEffort: 'medium',
      toolUseEnforcement: 'auto'
    };

    if (profile.id === '8tn' || profile.id === 'jbarton') {
      const googleTokenPath = path.join(profile.path, 'google_token.json');
      if (!fs.existsSync(googleTokenPath)) {
        fs.writeFileSync(googleTokenPath, JSON.stringify({ fixture: true }), 'utf8');
      }
    }

    writeConfigFile(profile);
  }

  if (!state.activeProfileId || !state.profiles[state.activeProfileId]) {
    state.activeProfileId = DEFAULT_PROFILE_ID;
  }

  if (!Number.isInteger(state.nextSessionIndex) || state.nextSessionIndex <= 0) {
    state.nextSessionIndex = Object.keys(state.sessions ?? {}).length + 1;
  }

  state.sessions = state.sessions ?? {};
  state.installedSkillsByProfile = state.installedSkillsByProfile ?? createSeedSkills();
  const authProvidersByProfile = state.authProvidersByProfile ?? {};
  if (state.authProviders && typeof state.authProviders === 'object') {
    const defaultProfileProviders = authProvidersByProfile[DEFAULT_PROFILE_ID] ?? {};
    authProvidersByProfile[DEFAULT_PROFILE_ID] = {
      ...state.authProviders,
      ...defaultProfileProviders
    };
    delete state.authProviders;
  }

  for (const profile of Object.values(state.profiles ?? {})) {
    authProvidersByProfile[profile.id] = authProvidersByProfile[profile.id] ?? {};
    state.installedSkillsByProfile[profile.id] = state.installedSkillsByProfile[profile.id] ?? createSeedSkills()[profile.id] ?? [];
    profile.skills = state.installedSkillsByProfile[profile.id].length;
  }

  state.authProvidersByProfile = authProvidersByProfile;
  state.providerAuthSessionsByProfile = state.providerAuthSessionsByProfile ?? {};
  for (const profile of Object.values(state.profiles ?? {})) {
    state.providerAuthSessionsByProfile[profile.id] = state.providerAuthSessionsByProfile[profile.id] ?? {};
  }
  return state;
}

function loadState() {
  const stateFile = getStateFile();
  if (!fs.existsSync(stateFile)) {
    const seededState = createSeededState();
    saveState(seededState);
    return seededState;
  }

  try {
    const parsedState = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    if (parsedState && typeof parsedState === 'object') {
      return ensureFixturePaths(parsedState);
    }
  } catch {
    // Fall through to reseed.
  }

  const seededState = createSeededState();
  saveState(seededState);
  return seededState;
}

function saveState(state) {
  fs.writeFileSync(getStateFile(), JSON.stringify(ensureFixturePaths(state), null, 2), 'utf8');
}

function print(value = '') {
  process.stdout.write(`${value}\n`);
}

function printJson(value) {
  return new Promise((resolve, reject) => {
    process.stdout.write(`${JSON.stringify(value)}\n`, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function getProfileIdFromEnvironment(state) {
  const hermesHome = process.env.HERMES_HOME;
  if (hermesHome) {
    const matchedProfile = Object.values(state.profiles).find(
      (profile) => profile.path === hermesHome || path.basename(hermesHome) === profile.id
    );
    if (matchedProfile) {
      return matchedProfile.id;
    }
  }

  return state.activeProfileId ?? DEFAULT_PROFILE_ID;
}

function getProfile(state, profileId = getProfileIdFromEnvironment(state)) {
  return state.profiles[profileId] ?? state.profiles[state.activeProfileId] ?? state.profiles[DEFAULT_PROFILE_ID];
}

function getAuthProvidersForProfile(state, profileId = getProfileIdFromEnvironment(state)) {
  state.authProvidersByProfile = state.authProvidersByProfile ?? {};
  state.authProvidersByProfile[profileId] = state.authProvidersByProfile[profileId] ?? {};
  return state.authProvidersByProfile[profileId];
}

function getProviderAuthSessionsForProfile(state, profileId = getProfileIdFromEnvironment(state)) {
  state.providerAuthSessionsByProfile = state.providerAuthSessionsByProfile ?? {};
  state.providerAuthSessionsByProfile[profileId] = state.providerAuthSessionsByProfile[profileId] ?? {};
  return state.providerAuthSessionsByProfile[profileId];
}

function getInstalledSkillsForProfile(state, profileId = getProfileIdFromEnvironment(state)) {
  state.installedSkillsByProfile = state.installedSkillsByProfile ?? createSeedSkills();
  state.installedSkillsByProfile[profileId] = state.installedSkillsByProfile[profileId] ?? [];
  return state.installedSkillsByProfile[profileId];
}

function getOrderedProfiles(state) {
  return SEEDED_PROFILE_IDS.map((profileId) => state.profiles[profileId]).filter(Boolean);
}

function getOrderedSessions(state, profileId = getProfileIdFromEnvironment(state)) {
  return Object.values(state.sessions)
    .filter((session) => session.lastUsedProfileId === profileId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function findSessionById(state, sessionId) {
  return state.sessions[sessionId];
}

function nextSessionId(state) {
  const nextIndex = state.nextSessionIndex ?? 1;
  state.nextSessionIndex = nextIndex + 1;
  return `session-${String(nextIndex).padStart(3, '0')}`;
}

function listProfiles() {
  if (shouldFail('profile')) {
    process.stderr.write('Fixture failed to load profiles.\n');
    process.exit(1);
  }

  const state = loadState();

  print('');
  print(' Profile          Model                        Gateway      Alias');
  print(' ───────────────    ───────────────────────────    ───────────    ────────────');
  for (const profile of getOrderedProfiles(state)) {
    const marker = profile.id === state.activeProfileId ? '◆' : ' ';
    print(` ${marker}${profile.id.padEnd(14)}    ${profile.model.padEnd(27)}    ${profile.gateway.padEnd(11)}    ${profile.alias ?? '—'}`);
  }
}

function showProfile(profileId) {
  if (shouldFail('profile')) {
    process.stderr.write(`Fixture failed to show profile ${profileId}.\n`);
    process.exit(1);
  }

  const state = loadState();
  const profile = getProfile(state, profileId);

  print('');
  print(`Profile: ${profile.id}`);
  print(`Path:    ${profile.path}`);
  print(`Model:   ${profile.model} (openrouter)`);
  print(`Gateway: ${profile.gateway}`);
  print(`Skills:  ${profile.skills}`);
  print(`.env:    exists`);
  print(`SOUL.md: exists`);
  print(`Alias:   ${profile.alias}`);
}

function listSessions(limit) {
  if (shouldFail('sessions')) {
    process.stderr.write('Fixture failed to list sessions.\n');
    process.exit(1);
  }

  const state = loadState();
  const sessions = getOrderedSessions(state).slice(0, limit);

  print('Title                            Preview                                  Last Active   ID');
  print('──────────────────────────────────────────────────────────────────────────────────────────────────────────────');
  for (const session of sessions) {
    const relative = session.updatedAt === '2026-04-08T20:00:00.000Z' ? '9m ago' : session.updatedAt;
    print(
      `${truncate(session.title || '—', 32).padEnd(32, ' ')}  ${truncate(session.preview, 40).padEnd(40, ' ')}  ${relative.padEnd(12)}  ${session.id}`
    );
  }
}

function renameSession(sessionId, titleParts) {
  const state = loadState();
  const session = findSessionById(state, sessionId);
  if (!session) {
    process.stderr.write(`Fixture could not find session ${sessionId}.\n`);
    process.exit(1);
  }

  session.title = titleParts.join(' ').trim();
  session.updatedAt = new Date().toISOString();
  saveState(state);
  print(`Renamed ${sessionId} to ${session.title}`);
}

function deleteSession(sessionId) {
  const state = loadState();
  if (!state.sessions[sessionId]) {
    process.stderr.write(`Fixture could not find session ${sessionId}.\n`);
    process.exit(1);
  }

  delete state.sessions[sessionId];
  saveState(state);
  print(`Deleted ${sessionId}`);
}

function exportSession(sessionId) {
  if (shouldFail('export')) {
    process.stderr.write(`Fixture failed to export session ${sessionId}.\n`);
    process.exit(1);
  }

  const state = loadState();
  const session = findSessionById(state, sessionId);
  if (!session) {
    process.stderr.write(`Session not found: ${sessionId}\n`);
    process.exit(1);
  }

  process.stdout.write(
    JSON.stringify({
      id: session.id,
      source: session.source,
      messages: session.messages
    })
  );
}

function listCronJobs() {
  if (shouldFail('cron')) {
    process.stderr.write('Fixture failed to list cron jobs.\n');
    process.exit(1);
  }

  const state = loadState();
  const profile = getProfile(state);

  if (profile.jobs.length === 0) {
    print("No scheduled jobs.\nCreate one with 'hermes cron create ...' or the /cron command in chat.");
    return;
  }

  print('');
  print('┌─────────────────────────────────────────────────────────────────────────┐');
  print('│                         Scheduled Jobs                                  │');
  print('└─────────────────────────────────────────────────────────────────────────┘');
  print('');
  for (const job of profile.jobs) {
    print(`  ${job.id} [${job.state}]`);
    print(`    Name:      ${job.name}`);
    print(`    Schedule:  ${job.schedule}`);
    print(`    Repeat:    ${job.repeat}`);
    print(`    Next run:  ${job.nextRun}`);
    print(`    Deliver:   ${job.deliver}`);
    print(`    Skills:    ${job.skills}`);
    print('');
  }
}

function cronStatus() {
  if (shouldFail('cron')) {
    process.stderr.write('Fixture failed to show cron status.\n');
    process.exit(1);
  }

  const state = loadState();
  const profile = getProfile(state);
  if (profile.jobs.length === 0) {
    print('');
    print('✗ Gateway is not running — cron jobs will NOT fire');
    print('');
    print('  No active jobs');
    return;
  }

  print('');
  print('✓ Gateway is running — cron jobs will fire automatically');
  print('  PID: 4123');
  print('');
  print(`  ${profile.jobs.length} active job(s)`);
  print(`  Next run: ${profile.jobs[0].nextRun}`);
}

function listTools() {
  if (shouldFail('tools')) {
    process.stderr.write('Fixture failed to list tools.\n');
    process.exit(1);
  }

  print('Built-in toolsets (cli):');
  print('  ✓ enabled  web  Web Search & Scraping');
  print('  ✓ enabled  terminal  Terminal & Processes');
  print('  ✓ enabled  file  File Operations');
  print('  ✓ enabled  skills  Skills');
  print('  ✓ enabled  cronjob  Cron Jobs');
  print('  ✗ disabled  rl  RL Training');
}

function listSkills() {
  if (shouldFail('skills')) {
    process.stderr.write('Fixture failed to list skills.\n');
    process.exit(1);
  }

  const state = loadState();
  const skills = getInstalledSkillsForProfile(state);

  print('                                Installed Skills                                ');
  print('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━┳━━━━━━━━━━┓');
  print('┃ Name                           ┃ Category             ┃ Source    ┃ Trust    ┃');
  print('┡━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━╇━━━━━━━━━━┩');
  for (const skill of skills) {
    print(
      `│ ${truncate(skill.name, 30).padEnd(30, ' ')} │ ${truncate(skill.category, 20).padEnd(20, ' ')} │ ${truncate(skill.source, 9).padEnd(9, ' ')} │ ${truncate(skill.trust, 8).padEnd(8, ' ')} │`
    );
  }
  print('└────────────────────────────────┴──────────────────────┴───────────┴──────────┘');
}

function uninstallSkill(skillName) {
  const state = loadState();
  const profile = getProfile(state);
  const installedSkills = getInstalledSkillsForProfile(state, profile.id);
  const skill = installedSkills.find((item) => item.name === skillName);
  if (!skill) {
    process.stderr.write(`Fixture could not find skill ${skillName}.\n`);
    process.exit(1);
  }

  if (skill.source === 'builtin') {
    process.stderr.write(`Fixture cannot uninstall builtin skill ${skillName}.\n`);
    process.exit(1);
  }

  state.installedSkillsByProfile[profile.id] = installedSkills.filter((item) => item.name !== skillName);
  profile.skills = state.installedSkillsByProfile[profile.id].length;
  saveState(state);
  print(`Uninstalled ${skillName}`);
}

function configShow() {
  if (shouldFail('config')) {
    process.stderr.write('Fixture failed to show config.\n');
    process.exit(1);
  }

  const state = loadState();
  const profile = getProfile(state);
  const config = profile.runtimeConfig;

  print('');
  print('┌─────────────────────────────────────────────────────────┐');
  print('│              ⚕ Hermes Configuration                    │');
  print('└─────────────────────────────────────────────────────────┘');
  print('');
  print('◆ Paths');
  print(`  Config:       ${path.join(profile.path, 'config.yaml')}`);
  print(`  Secrets:      ${path.join(profile.path, '.env')}`);
  print(`  Install:      ${path.join(getFixtureRoot(), 'hermes-agent')}`);
  print('');
  print('◆ API Keys');
  print('  OpenRouter     sk-o...fixture');
  print('  Anthropic      (not set)');
  print('');
  print('◆ Model');
  print(
    `  Model:        {'default': '${config.defaultModel}', 'provider': '${config.provider}', 'base_url': '${config.baseUrl}', 'api_mode': '${config.apiMode}'}`
  );
  print(`  Max turns:    ${config.maxTurns}`);
  print('');
  print('◆ Display');
  print('  Personality:  kawaii');
  print('  Reasoning:    off');
  print('  Bell:         off');
}

function writeConfigFile(profile) {
  const configFile = path.join(profile.path, 'config.yaml');
  fs.writeFileSync(
    configFile,
    `model:\n  default: ${profile.runtimeConfig.defaultModel}\n  provider: ${profile.runtimeConfig.provider}\n  base_url: ${profile.runtimeConfig.baseUrl}\n  api_mode: ${profile.runtimeConfig.apiMode}\nagent:\n  max_turns: ${profile.runtimeConfig.maxTurns}\n  reasoning_effort: ${profile.runtimeConfig.reasoningEffort}\n  tool_use_enforcement: ${profile.runtimeConfig.toolUseEnforcement}\n`,
    'utf8'
  );
}

function configSet(key, value) {
  if (shouldFail('config')) {
    process.stderr.write('Fixture failed to update config.\n');
    process.exit(1);
  }

  const state = loadState();
  const profile = getProfile(state);

  if (key === 'model.default' || key === 'model') {
    profile.runtimeConfig.defaultModel = value;
    profile.model = value;
  } else if (key === 'model.provider') {
    profile.runtimeConfig.provider = value;
  } else if (key === 'model.base_url') {
    profile.runtimeConfig.baseUrl = value;
  } else if (key === 'model.api_mode') {
    profile.runtimeConfig.apiMode = value;
  } else if (key === 'agent.max_turns') {
    profile.runtimeConfig.maxTurns = Number(value);
  } else if (key === 'agent.reasoning_effort') {
    profile.runtimeConfig.reasoningEffort = value;
  } else if (key === 'agent.tool_use_enforcement') {
    profile.runtimeConfig.toolUseEnforcement = value;
  }

  writeConfigFile(profile);
  saveState(state);
  print(`Updated ${key} = ${value}`);
}

function authList() {
  if (shouldFail('auth')) {
    process.stderr.write('Fixture failed to list auth providers.\n');
    process.exit(1);
  }

  const state = loadState();
  const profile = getProfile(state);
  const providers = Object.entries(getAuthProvidersForProfile(state, profile.id));
  for (const [providerId, entry] of providers) {
    print(`${providerId} (1 credentials):`);
    print(`  #1  ${entry.credentialLabel}   api_key ${entry.source} ←`);
    print('');
  }
}

function authAdd(providerId, apiKey, label) {
  if (shouldFail('auth')) {
    process.stderr.write(`Fixture failed to add auth for ${providerId}.\n`);
    process.exit(1);
  }

  if (providerId === 'minimax' && /invalid|bad|wrong/iu.test(apiKey)) {
    process.stderr.write('MiniMax rejected the supplied API key.\n');
    process.exit(1);
  }

  const state = loadState();
  const profile = getProfile(state);
  const authProviders = getAuthProvidersForProfile(state, profile.id);
  authProviders[providerId] = {
    credentialLabel: label || `${providerId.toUpperCase().replace(/-/g, '_')}_API_KEY`,
    source: `bridge:${providerId}`,
    maskedCredential: apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : 'sk-f...mock'
  };
  saveState(state);
  print(`Added credential for ${providerId}`);
}

function upsertAuthProvider(providerId, apiKey, label) {
  const state = loadState();
  const profile = getProfile(state);
  const authProviders = getAuthProvidersForProfile(state, profile.id);
  authProviders[providerId] = {
    credentialLabel: label || `${providerId.toUpperCase().replace(/-/g, '_')}_API_KEY`,
    source: `bridge:${providerId}`,
    maskedCredential: apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : 'sk-f...mock'
  };
  saveState(state);
}

function clearAuthProvider(providerId) {
  const state = loadState();
  const profile = getProfile(state);
  const authProviders = getAuthProvidersForProfile(state, profile.id);
  delete authProviders[providerId];
  saveState(state);
}

function createFixtureNousAuthSession(status = 'pending', pollCount = 0) {
  return {
    id: 'fixture-nous-auth-session',
    providerId: 'nous',
    kind: 'oauth_device_code',
    status,
    actionUrl: FIXTURE_NOUS_VERIFICATION_URL,
    actionLabel: 'Open verification link',
    verificationCode: FIXTURE_NOUS_VERIFICATION_CODE,
    expiresAt: '2026-04-08T20:15:00.000Z',
    startedAt: FIXTURE_DISCOVERED_AT,
    checkedAt: FIXTURE_DISCOVERED_AT,
    pollAfterMs: 1_000,
    message:
      status === 'verifying'
        ? 'Hermes is verifying the Nous Portal authorization.'
        : 'Open the Nous verification link, approve access, then refresh provider status.',
    metadata: {
      pollCount
    }
  };
}

function beginFixtureProviderAuth(providerId) {
  const state = loadState();
  const profile = getProfile(state);
  const sessions = getProviderAuthSessionsForProfile(state, profile.id);
  const nextSession =
    providerId === 'nous'
      ? createFixtureNousAuthSession('pending', 0)
      : {
          id: `fixture-${providerId}-auth-session`,
          providerId,
          kind: 'manual',
          status: 'unavailable',
          startedAt: FIXTURE_DISCOVERED_AT,
          checkedAt: FIXTURE_DISCOVERED_AT,
          message: `${providerId} does not expose an interactive auth flow in this fixture.`,
          metadata: {}
        };
  sessions[providerId] = nextSession;
  saveState(state);
  return nextSession;
}

function pollFixtureProviderAuth(providerId, authSessionId = null) {
  const state = loadState();
  const profile = getProfile(state);
  const sessions = getProviderAuthSessionsForProfile(state, profile.id);
  const existingSession = sessions[providerId] ?? null;

  if (!existingSession) {
    return {
      session: {
        id: authSessionId ?? `fixture-${providerId}-auth-session`,
        providerId,
        kind: providerId === 'nous' ? 'oauth_device_code' : 'manual',
        status: 'unavailable',
        startedAt: FIXTURE_DISCOVERED_AT,
        checkedAt: FIXTURE_DISCOVERED_AT,
        message: `No active ${providerId} auth session was found.`,
        metadata: {}
      },
      connected: false
    };
  }

  if (authSessionId && existingSession.id !== authSessionId) {
    const unavailableSession = {
      ...existingSession,
      checkedAt: FIXTURE_DISCOVERED_AT,
      status: 'unavailable',
      message: `Auth session ${authSessionId} is no longer active for ${providerId}.`
    };
    sessions[providerId] = unavailableSession;
    saveState(state);
    return {
      session: unavailableSession,
      connected: false
    };
  }

  if (providerId !== 'nous') {
    const unavailableSession = {
      ...existingSession,
      checkedAt: FIXTURE_DISCOVERED_AT,
      status: 'unavailable',
      message: `${providerId} does not expose a pollable auth session in this fixture.`
    };
    sessions[providerId] = unavailableSession;
    saveState(state);
    return {
      session: unavailableSession,
      connected: false
    };
  }

  const pollCount = Number(existingSession.metadata?.pollCount ?? 0);
  if (pollCount >= 1) {
    delete sessions[providerId];
    const authProviders = getAuthProvidersForProfile(state, profile.id);
    authProviders[providerId] = {
      credentialLabel: 'NOUS_OAUTH',
      source: 'oauth:nous',
      maskedCredential: 'oauth...nous'
    };
    saveState(state);
    return {
      session: {
        ...existingSession,
        checkedAt: FIXTURE_DISCOVERED_AT,
        status: 'completed',
        message: 'Nous Portal is now authorized for this profile.',
        metadata: {
          pollCount: pollCount + 1
        }
      },
      connected: true
    };
  }

  const verifyingSession = {
    ...existingSession,
    checkedAt: FIXTURE_DISCOVERED_AT,
    status: 'verifying',
    message: 'Hermes is verifying the Nous Portal authorization.',
    metadata: {
      ...(existingSession.metadata ?? {}),
      pollCount: pollCount + 1
    }
  };
  sessions[providerId] = verifyingSession;
  saveState(state);
  return {
    session: verifyingSession,
    connected: false
  };
}

function clearFixtureProviderAuthSession(providerId) {
  const state = loadState();
  const profile = getProfile(state);
  const sessions = getProviderAuthSessionsForProfile(state, profile.id);
  delete sessions[providerId];
  saveState(state);
}

function showStatus() {
  if (shouldFail('status')) {
    process.stderr.write('Fixture failed to show status.\n');
    process.exit(1);
  }

  print('');
  print('◆ Auth Providers');
  print('  Nous Portal   ✗ not logged in (run: hermes model)');
  print('    Open browser: https://portal.nousresearch.com/');
  print('    Verify device: https://portal.nousresearch.com/device/verify?user_code=39RS-VCYV');
  print('  OpenAI Codex  ✗ not logged in (run: hermes model)');
  print('');
}

function fixtureProviderMetadata(providerId) {
  const catalog = {
    openrouter: {
      displayName: 'OpenRouter',
      description: 'OpenRouter pay-per-use routing.',
      authKind: 'api_key',
      supportsApiKey: true,
      supportsOAuth: false,
      defaultBaseUrl: 'https://openrouter.ai/api/v1',
      defaultApiMode: 'chat_completions'
    },
    anthropic: {
      displayName: 'Anthropic',
      description: 'Claude models directly from Anthropic.',
      authKind: 'api_key',
      supportsApiKey: true,
      supportsOAuth: false
    },
    nous: {
      displayName: 'Nous Portal',
      description: 'Nous-managed inference with OAuth device login.',
      authKind: 'oauth',
      supportsApiKey: false,
      supportsOAuth: true
    },
    minimax: {
      displayName: 'MiniMax',
      description: 'MiniMax routed models.',
      authKind: 'api_key',
      supportsApiKey: true,
      supportsOAuth: false
    },
    'ai-gateway': {
      displayName: 'AI Gateway',
      description: 'Vercel AI Gateway compatible endpoint.',
      authKind: 'api_key',
      supportsApiKey: true,
      supportsOAuth: false,
      defaultApiMode: 'responses'
    }
  };

  return catalog[providerId] ?? {
    displayName: providerId,
    description: `${providerId} provider`,
    authKind: 'unknown',
    supportsApiKey: false,
    supportsOAuth: false
  };
}

function fixtureReasoningOptions(modelId) {
  const normalized = String(modelId ?? '').toLowerCase();
  if (normalized.includes('mini') || normalized.includes('nano') || normalized.includes('haiku')) {
    return [];
  }
  if (normalized.includes('gpt-5') || normalized.includes('o1') || normalized.includes('o3') || normalized.includes('o4')) {
    return ['low', 'medium', 'high'];
  }
  return [];
}

function buildFixtureModelOptions(providerId, config) {
  const modelCatalog = {
    openrouter: ['openai/gpt-5.4', 'openai/gpt-5.4-mini'],
    anthropic: ['anthropic/claude-3.7-sonnet'],
    nous: ['anthropic/claude-opus-4.6'],
    minimax: ['MiniMax-M2.5'],
    'ai-gateway': ['openai/gpt-5.4']
  };
  const modelIds = modelCatalog[providerId] ?? [];
  return modelIds.map((modelId) => {
    const reasoningEffortOptions = fixtureReasoningOptions(modelId);
    return {
      id: modelId,
      label: modelId,
      providerId,
      disabled: false,
      supportsReasoningEffort: reasoningEffortOptions.length > 0,
      reasoningEffortOptions,
      metadata: {
        current: config.provider === providerId && config.defaultModel === modelId
      }
    };
  });
}

function buildFixtureRuntimeConfig(profile) {
  return {
    provider: profile.runtimeConfig.provider,
    defaultModel: profile.runtimeConfig.defaultModel,
    baseUrl: profile.runtimeConfig.baseUrl,
    apiMode: profile.runtimeConfig.apiMode,
    maxTurns: profile.runtimeConfig.maxTurns,
    reasoningEffort: profile.runtimeConfig.reasoningEffort,
    toolUseEnforcement: profile.runtimeConfig.toolUseEnforcement,
    lastSyncedAt: FIXTURE_DISCOVERED_AT
  };
}

function buildFixtureProviderState({ providerId, metadata, authEntry, authSession, models, config }) {
  const providerIsActive = config.provider === providerId;
  const connected = providerId === 'openrouter' || Boolean(authEntry);
  const currentModelConfigured =
    providerIsActive &&
    Boolean(config.defaultModel) &&
    models.some((model) => model.id === config.defaultModel && !model.disabled);

  if (authSession?.status === 'pending') {
    return {
      state: 'waiting_for_verification',
      ready: false,
      stateMessage: authSession.message
    };
  }

  if (authSession?.status === 'verifying') {
    return {
      state: 'verifying',
      ready: false,
      stateMessage: authSession.message
    };
  }

  if (metadata.supportsOAuth && !connected) {
    return {
      state: 'needs_oauth',
      ready: false,
      stateMessage: `Authorize ${metadata.displayName} before Hermes can use this provider.`
    };
  }

  if (metadata.supportsApiKey && !connected) {
    return {
      state: 'needs_api_key',
      ready: false,
      stateMessage: `Add an API key for ${metadata.displayName} before Hermes can use this provider.`
    };
  }

  if (models.length === 0) {
    return {
      state: 'discovery_pending',
      ready: false,
      stateMessage: `Hermes has not exposed selectable ${metadata.displayName} models yet.`
    };
  }

  if (providerIsActive && !currentModelConfigured) {
    return {
      state: 'needs_model_selection',
      ready: false,
      stateMessage: `Select a default model for ${metadata.displayName} before using chat.`
    };
  }

  return {
    state: 'connected',
    ready: true,
    stateMessage: `${metadata.displayName} is ready for Hermes chat requests.`
  };
}

function buildFixtureValidation({ authSession }) {
  if (authSession?.status === 'failed') {
    return {
      status: 'error',
      code: 'provider_auth_failed',
      message: authSession.message,
      checkedAt: FIXTURE_DISCOVERED_AT
    };
  }

  if (authSession?.status === 'unavailable') {
    return {
      status: 'warning',
      code: 'provider_auth_unavailable',
      message: authSession.message,
      checkedAt: FIXTURE_DISCOVERED_AT
    };
  }

  return undefined;
}

function buildFixtureConfigFields(providerId, provider, config, models, metadata) {
  const fields = [];
  const providerIsActive = config.provider === providerId;
  const requiresCredentialEntry = provider.supportsApiKey && ['needs_api_key', 'invalid_credentials', 'config_error', 'unconfigured'].includes(provider.state);

  if (requiresCredentialEntry) {
    fields.push({
      key: 'apiKey',
      label: 'API key',
      description: `Connect ${provider.displayName} for this Hermes profile.`,
      input: 'secret',
      required: true,
      secret: true,
      placeholder: `Paste the ${provider.displayName} API key`,
      options: [],
      disabled: false
    });
    fields.push({
      key: 'label',
      label: 'Credential label',
      description: 'Optional environment label stored by Hermes for this profile.',
      input: 'text',
      required: false,
      secret: false,
      placeholder: `${providerId.toUpperCase().replace(/-/g, '_')}_API_KEY`,
      options: [],
      disabled: false
    });
  }

  fields.push({
    key: 'defaultModel',
    label: 'Default model',
    description:
      models.length > 0
        ? 'Selectable models discovered from the active Hermes runtime.'
        : `${provider.displayName} cannot be selected until Hermes exposes a structured model list.`,
    input: 'select',
    required: true,
    secret: false,
    value: models.length > 0 ? (providerIsActive ? config.defaultModel : models[0]?.id ?? '') : undefined,
    placeholder: models.length > 0 ? undefined : 'Model discovery unavailable',
    options: models.map((model) => ({
      value: model.id,
      label: model.label,
      disabled: model.disabled,
      disabledReason: model.disabledReason
    })),
    disabled: models.length === 0,
    disabledReason: models.length === 0 ? `${provider.displayName} does not currently expose selectable models.` : undefined
  });

  if (providerId === 'openrouter' || providerId === 'ai-gateway') {
    fields.push({
      key: 'baseUrl',
      label: 'Base URL',
      description: 'Provider-specific endpoint override saved in the active Hermes profile when needed.',
      input: 'url',
      required: false,
      secret: false,
      value: providerIsActive ? config.baseUrl || undefined : metadata.defaultBaseUrl,
      options: [],
      disabled: false
    });
    fields.push({
      key: 'apiMode',
      label: 'API mode',
      description: 'Transport mode currently configured for this provider in Hermes.',
      input: 'select',
      required: false,
      secret: false,
      value: providerIsActive ? config.apiMode : metadata.defaultApiMode ?? 'chat_completions',
      options: [
        { value: 'chat_completions', label: 'chat_completions', disabled: false },
        { value: 'responses', label: 'responses', disabled: false }
      ],
      disabled: false
    });
  }

  return fields;
}

function buildFixtureSetupSteps(providerId, provider, models, configurationFields) {
  const steps = [
    {
      id: `${providerId}:inspect`,
      kind: 'inspect',
      title: 'Inspect Hermes runtime metadata',
      description: 'The Hermes backend loaded provider state, runtime config, and structured model metadata.',
      status: 'completed',
      metadata: {}
    }
  ];

  if (provider.supportsOAuth) {
    const authStepStatus =
      provider.state === 'connected'
        ? 'completed'
        : provider.authSession?.status === 'pending' || provider.authSession?.status === 'verifying'
          ? 'pending'
          : 'action_required';
    steps.push({
      id: `${providerId}:oauth`,
      kind: 'oauth',
      title: provider.state === 'connected' ? 'Provider sign-in completed' : 'Start provider sign-in',
      description:
        provider.state === 'connected'
          ? `${provider.displayName} is already authorized in Hermes.`
          : provider.authSession?.message ?? `Start ${provider.displayName} authorization and follow the structured verification link.`,
      status: authStepStatus,
      actionLabel: provider.authSession?.actionLabel,
      actionUrl: provider.authSession?.actionUrl,
      command: `hermes models auth --provider ${providerId} --json`,
      metadata: provider.authSession ? { authSessionId: provider.authSession.id } : {}
    });
  }

  if (provider.supportsApiKey) {
    steps.push({
      id: `${providerId}:api-key`,
      kind: 'api_key',
      title: provider.status === 'connected' ? 'API key connected' : 'Add API key',
      description:
        provider.status === 'connected'
          ? `${provider.displayName} already has a usable credential for this profile.`
          : `Paste the ${provider.displayName} API key below. Hermes stores the secret locally and only emits non-secret metadata to JSON clients.`,
      status: provider.status === 'connected' ? 'completed' : 'action_required',
      metadata: {}
    });
  }

  if (configurationFields.some((field) => !['apiKey', 'label', 'defaultModel'].includes(field.key))) {
    steps.push({
      id: `${providerId}:config`,
      kind: 'config',
      title: 'Review provider-specific settings',
      description: 'Review provider-specific runtime settings before saving.',
      status: provider.status === 'connected' ? 'pending' : 'blocked',
      metadata: {}
    });
  }

  steps.push({
    id: `${providerId}:model`,
    kind: 'model',
    title: models.length > 0 ? 'Choose a default model' : 'Wait for discovered model choices',
    description:
      models.length > 0
        ? 'Select one of the models discovered from the active Hermes runtime.'
        : `${provider.displayName} cannot be selected until Hermes exposes a structured model list.`,
    status:
      provider.state === 'needs_model_selection'
        ? 'action_required'
        : provider.ready
          ? 'completed'
          : models.length > 0 && !['needs_api_key', 'needs_oauth', 'waiting_for_verification', 'verifying'].includes(provider.state)
            ? 'pending'
            : 'blocked',
    metadata: {}
  });

  if (provider.authSession && ['pending', 'verifying'].includes(provider.authSession.status)) {
    steps.push({
      id: `${providerId}:refresh`,
      kind: 'refresh',
      title: 'Refresh provider authorization',
      description: 'Poll the Hermes auth session after you complete the provider verification step.',
      status: 'pending',
      metadata: {
        authSessionId: provider.authSession.id
      }
    });
  }

  steps.push({
    id: `${providerId}:verify`,
    kind: 'verify',
    title: provider.ready ? 'Provider ready for chat' : 'Monitor provider readiness',
    description:
      provider.ready
        ? `${provider.displayName} has a usable credential and model selection for this profile.`
        : 'Keep this drawer open after setup. Hermes polls authoritative state until onboarding completes.',
    status: provider.ready ? 'completed' : 'pending',
    metadata: {}
  });

  return steps;
}

function buildFixtureProviderPayload(profile, config, providerId) {
  const state = loadState();
  const metadata = fixtureProviderMetadata(providerId);
  const authProviders = getAuthProvidersForProfile(state, profile.id);
  const authSessions = getProviderAuthSessionsForProfile(state, profile.id);
  const authEntry = authProviders[providerId];
  const authSession = authSessions[providerId] ?? null;
  const models = buildFixtureModelOptions(providerId, config);
  const providerState = buildFixtureProviderState({
    providerId,
    metadata,
    authEntry,
    authSession,
    models,
    config
  });
  const connected = providerId === 'openrouter' || Boolean(authEntry);
  const disabled = ['needs_api_key', 'needs_oauth', 'waiting_for_verification', 'verifying', 'unsupported'].includes(providerState.state);
  const disabledReason =
    providerState.state === 'needs_api_key'
      ? `Connect ${metadata.displayName} before selecting it.`
      : providerState.state === 'needs_oauth'
        ? `Authorize ${metadata.displayName} before selecting it.`
        : providerState.state === 'waiting_for_verification' || providerState.state === 'verifying'
          ? `Finish ${metadata.displayName} authorization before selecting it.`
          : providerState.state === 'unsupported'
            ? `${metadata.displayName} is not supported in this fixture.`
            : undefined;

  const provider = {
    id: providerId,
    displayName: metadata.displayName,
    source: authEntry?.source ?? (providerId === 'openrouter' ? 'env:OPENROUTER_API_KEY' : 'authoritative_fixture'),
    status: connected ? 'connected' : metadata.supportsApiKey || metadata.supportsOAuth ? 'missing' : 'available',
    authKind: metadata.authKind,
    supportsApiKey: metadata.supportsApiKey,
    supportsOAuth: metadata.supportsOAuth,
    credentialLabel: authEntry?.credentialLabel ?? (providerId === 'openrouter' ? 'OPENROUTER_API_KEY' : undefined),
    maskedCredential: authEntry?.maskedCredential ?? (providerId === 'openrouter' ? 'sk-o...fixture' : undefined),
    description: metadata.description,
    notes:
      providerState.state === 'needs_oauth'
        ? 'Use the authoritative Hermes provider auth flow.'
        : providerState.state === 'needs_api_key'
          ? `Connect ${metadata.displayName} with an API key.`
          : undefined,
    disabled,
    disabledReason,
    supportsModelDiscovery: models.length > 0,
    state: providerState.state,
    stateMessage: providerState.stateMessage,
    ready: providerState.ready,
    modelSelectionMode: 'select_only',
    supportsDisconnect: providerId !== 'openrouter' && (connected || Boolean(authSession)),
    validation: buildFixtureValidation({ authSession }),
    authSession: authSession ?? undefined,
    models,
    configurationFields: [],
    setupSteps: [],
    lastSyncedAt: FIXTURE_DISCOVERED_AT
  };

  provider.configurationFields = buildFixtureConfigFields(providerId, provider, config, models, metadata);
  provider.setupSteps = buildFixtureSetupSteps(providerId, provider, models, provider.configurationFields);
  return provider;
}

function fixtureRuntimeReadiness(config, providers) {
  const selectedProvider = providers.find((provider) => provider.id === config.provider) ?? null;
  if (!selectedProvider) {
    return {
      ready: false,
      code: 'provider_missing',
      message: 'No usable Hermes provider is selected yet. Open Settings and configure a provider before using chat.',
      providerId: config.provider,
      modelId: config.defaultModel || null
    };
  }

  if (selectedProvider.ready) {
    return {
      ready: true,
      code: 'ready',
      message: selectedProvider.stateMessage,
      providerId: selectedProvider.id,
      modelId: config.defaultModel
    };
  }

  const readinessCodeByState = {
    needs_api_key: 'provider_auth_required',
    needs_oauth: 'provider_auth_required',
    waiting_for_verification: 'provider_auth_required',
    verifying: 'provider_auth_required',
    needs_model_selection: 'model_missing',
    discovery_pending: 'discovery_pending',
    invalid_credentials: 'invalid_credentials',
    config_error: 'config_error',
    unsupported: 'unsupported'
  };

  return {
    ready: false,
    code: readinessCodeByState[selectedProvider.state] ?? 'runtime_state_unavailable',
    message: selectedProvider.stateMessage,
    providerId: selectedProvider.id,
    modelId: config.defaultModel || null
  };
}

function buildFixtureDiscovery(inspectedProviderId = null) {
  const state = loadState();
  const profile = getProfile(state);
  const config = buildFixtureRuntimeConfig(profile);
  const providerIds = ['openrouter', 'anthropic', 'nous', 'minimax', 'ai-gateway'];
  const providers = providerIds.map((providerId) => buildFixtureProviderPayload(profile, config, providerId));

  return {
    schemaVersion: 'hermes_cli_models/v2',
    discoveredAt: FIXTURE_DISCOVERED_AT,
    inspectedProviderId: inspectedProviderId ?? config.provider,
    runtimeReadiness: fixtureRuntimeReadiness(config, providers),
    config,
    providers
  };
}

async function modelsJsonDiscovery(inspectedProviderId = null) {
  if (shouldFail('models-json-unavailable')) {
    process.stderr.write("error: unrecognized arguments: --json\n");
    process.exit(2);
  }
  if (shouldFail('models-json-invalid')) {
    await printJson({ schemaVersion: 'hermes_cli_models/v2', providers: 'broken' });
    process.exit(0);
  }

  await printJson(buildFixtureDiscovery(inspectedProviderId));
}

async function modelsJsonAuth(providerId, poll = false, authSessionId = null) {
  if (shouldFail('models-json-unavailable')) {
    process.stderr.write("error: unrecognized arguments: --json\n");
    process.exit(2);
  }

  const authResult = poll ? pollFixtureProviderAuth(providerId, authSessionId) : { session: beginFixtureProviderAuth(providerId), connected: false };
  const success = !['failed', 'unavailable'].includes(authResult.session.status);

  await printJson({
    schemaVersion: 'hermes_cli_models/v2',
    action: poll ? 'auth_poll' : 'auth',
    providerId,
    success,
    message: authResult.session.message,
    authSession: authResult.session,
    discovery: buildFixtureDiscovery(providerId)
  });

  if (!success) {
    process.exit(1);
  }
}

async function modelsJsonConnect(providerId, apiKey, label, options = {}) {
  if (shouldFail('models-json-unavailable')) {
    process.stderr.write("error: unrecognized arguments: --json\n");
    process.exit(2);
  }

  if (providerId === 'minimax' && /invalid|bad|wrong/iu.test(apiKey)) {
    await printJson({
      schemaVersion: 'hermes_cli_models/v2',
      action: 'connect',
      providerId,
      success: false,
      message: 'MiniMax rejected the supplied API key.',
      error: {
        code: 'invalid_credentials',
        message: 'MiniMax rejected the supplied API key.'
      }
    });
    process.exit(1);
  }

  upsertAuthProvider(providerId, apiKey, label);
  clearFixtureProviderAuthSession(providerId);

  const state = loadState();
  const profile = getProfile(state);
  if (typeof options.baseUrl === 'string' && options.baseUrl.length > 0) {
    profile.runtimeConfig.baseUrl = options.baseUrl;
  }
  if (typeof options.apiMode === 'string' && options.apiMode.length > 0) {
    profile.runtimeConfig.apiMode = options.apiMode;
  }
  writeConfigFile(profile);
  saveState(state);

  await printJson({
    schemaVersion: 'hermes_cli_models/v2',
    action: 'connect',
    providerId,
    success: true,
    message: `${providerId} connected successfully.`,
    discovery: buildFixtureDiscovery(providerId)
  });
}

async function modelsJsonConfigure(providerId, options = {}) {
  if (shouldFail('models-json-unavailable')) {
    process.stderr.write("error: unrecognized arguments: --json\n");
    process.exit(2);
  }

  const state = loadState();
  const profile = getProfile(state);
  const availableModelIds = buildFixtureModelOptions(providerId, buildFixtureRuntimeConfig(profile)).map((model) => model.id);

  if (typeof options.baseUrl === 'string' && options.baseUrl.length > 0 && !/^https?:\/\//u.test(options.baseUrl)) {
    await printJson({
      schemaVersion: 'hermes_cli_models/v2',
      action: 'configure',
      providerId,
      success: false,
      message: 'Base URL must start with http:// or https://.',
      error: {
        code: 'invalid_base_url',
        message: 'Base URL must start with http:// or https://.'
      }
    });
    process.exit(1);
  }

  if (typeof options.apiMode === 'string' && !['chat_completions', 'responses'].includes(options.apiMode)) {
    await printJson({
      schemaVersion: 'hermes_cli_models/v2',
      action: 'configure',
      providerId,
      success: false,
      message: 'API mode must be chat_completions or responses.',
      error: {
        code: 'invalid_api_mode',
        message: 'API mode must be chat_completions or responses.'
      }
    });
    process.exit(1);
  }

  if (typeof options.defaultModel === 'string' && options.defaultModel.length > 0 && !availableModelIds.includes(options.defaultModel)) {
    await printJson({
      schemaVersion: 'hermes_cli_models/v2',
      action: 'configure',
      providerId,
      success: false,
      message: `${options.defaultModel} is not an authoritative selectable model for ${providerId}.`,
      error: {
        code: 'model_unavailable',
        message: `${options.defaultModel} is not an authoritative selectable model for ${providerId}.`
      }
    });
    process.exit(1);
  }

  profile.runtimeConfig.provider = providerId;
  if (typeof options.defaultModel === 'string' && options.defaultModel.length > 0) {
    profile.runtimeConfig.defaultModel = options.defaultModel;
    profile.model = options.defaultModel;
  }
  if (typeof options.baseUrl === 'string' && options.baseUrl.length > 0) {
    profile.runtimeConfig.baseUrl = options.baseUrl;
  }
  if (typeof options.apiMode === 'string' && options.apiMode.length > 0) {
    profile.runtimeConfig.apiMode = options.apiMode;
  }
  if (typeof options.maxTurns === 'number' && Number.isFinite(options.maxTurns)) {
    profile.runtimeConfig.maxTurns = options.maxTurns;
  }
  if (typeof options.reasoningEffort === 'string') {
    profile.runtimeConfig.reasoningEffort = options.reasoningEffort;
  }
  writeConfigFile(profile);
  saveState(state);

  await printJson({
    schemaVersion: 'hermes_cli_models/v2',
    action: 'configure',
    providerId,
    success: true,
    message: `${providerId} settings updated successfully.`,
    discovery: buildFixtureDiscovery(providerId)
  });
}

async function modelsJsonDisconnect(providerId) {
  if (shouldFail('models-json-unavailable')) {
    process.stderr.write("error: unrecognized arguments: --json\n");
    process.exit(2);
  }

  clearAuthProvider(providerId);
  clearFixtureProviderAuthSession(providerId);

  await printJson({
    schemaVersion: 'hermes_cli_models/v2',
    action: 'disconnect',
    providerId,
    success: true,
    message: `${providerId} disconnected successfully.`,
    discovery: buildFixtureDiscovery(providerId)
  });
}

function pushMessage(session, role, content, timestamp) {
  session.messages.push({
    id: session.messages.length + 1,
    role,
    content,
    timestamp
  });
}

function createRecipeReply(confirmation, operation, options = {}) {
  const leadingProse = options.leadingProse ? `${options.leadingProse}\n` : '';
  return `${confirmation}

\`\`\`hermes-ui-recipes
${leadingProse}${JSON.stringify({
  operations: [operation]
})}
\`\`\``;
}

function createRecoveredRecipeReply(confirmation, operation, options = {}) {
  const innerFence = options.innerFence === 'json' ? 'json' : 'hermes-ui-recipes';
  const trailingProse = options.trailingProse ? `\n${options.trailingProse}` : '';

  return `${confirmation}

\`\`\`hermes-ui-recipes
Created a recipe and included the valid payload below.
\`\`\`${innerFence === 'json' ? 'json' : 'hermes-ui-recipes'}
${JSON.stringify({
  operations: [operation]
})}
\`\`\`${trailingProse}
\`\`\``;
}

function parseStructuredPromptJson(prompt, label, nextLabels = []) {
  const raw = extractStructuredPromptSection(prompt, label, nextLabels);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractJsonStringValue(raw, key) {
  if (!raw) {
    return null;
  }

  const pattern = new RegExp(`"${escapeRegExp(key)}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, 'u');
  const match = raw.match(pattern);
  if (!match) {
    return null;
  }

  try {
    return JSON.parse(`"${match[1]}"`);
  } catch {
    return match[1];
  }
}

function extractJsonStringArray(raw, key) {
  if (!raw) {
    return [];
  }

  const pattern = new RegExp(`"${escapeRegExp(key)}"\\s*:\\s*\\[([\\s\\S]*?)\\]`, 'u');
  const match = raw.match(pattern);
  if (!match) {
    return [];
  }

  const values = [];
  const valuePattern = /"((?:\\.|[^"\\])*)"/gu;
  for (const valueMatch of match[1].matchAll(valuePattern)) {
    try {
      values.push(JSON.parse(`"${valueMatch[1]}"`));
    } catch {
      values.push(valueMatch[1]);
    }
  }

  return values;
}

function createRecipeDslArtifact(prompt, userRequest) {
  const contractPacketRaw = extractStructuredPromptSection(prompt, 'Compact contract packet', ['Current Home recipe']);
  const normalizedDataRaw = extractStructuredPromptSection(prompt, 'Normalized data snapshot', ['Assistant response summary']);
  const contractPacket = parseStructuredPromptJson(prompt, 'Compact contract packet', ['Current Home recipe']) ?? {};
  const allowedActions = parseStructuredPromptJson(prompt, 'Allowed actions', ['Baseline recipe model snapshot']) ?? {};
  const intentSummary = parseStructuredPromptJson(prompt, 'Intent summary', ['Allowed actions']) ?? {};
  const currentRecipe = parseStructuredPromptJson(prompt, 'Current Home recipe', ['Intent summary']) ?? {};
  const graph =
    parseStructuredPromptJson(prompt, 'Baseline recipe model snapshot', ['Baseline patch snapshot', 'Normalized data snapshot']) ?? {};
  const normalizedData = parseStructuredPromptJson(prompt, 'Normalized data snapshot', ['Assistant response summary']) ?? {};
  const normalizedDatasets = Array.isArray(normalizedData.datasets) ? normalizedData.datasets : [];
  const contractDatasetIds = Array.from(
    new Set(
      (
        Array.isArray(contractPacket.allowedReferences?.datasetIds)
          ? contractPacket.allowedReferences.datasetIds
          : extractJsonStringArray(contractPacketRaw, 'datasetIds')
      ).filter((datasetId) => typeof datasetId === 'string' && datasetId.trim().length > 0)
    )
  );
  const primaryDatasetId =
    (typeof normalizedData.primaryDatasetId === 'string' && normalizedData.primaryDatasetId.trim().length > 0
      ? normalizedData.primaryDatasetId
      : extractJsonStringValue(normalizedDataRaw, 'primaryDatasetId')) || null;
  const candidateDatasetIds = Array.from(
    new Set([primaryDatasetId, ...contractDatasetIds].filter((datasetId) => typeof datasetId === 'string' && datasetId.trim().length > 0))
  );
  const collections = Array.isArray(graph.collections) && graph.collections.length > 0
    ? graph.collections
    : normalizedDatasets.length > 0
      ? normalizedDatasets.map((dataset) => ({
          id: dataset.id,
          label: dataset.title || dataset.label || 'Results',
          preferredView:
            dataset.preferredPresentation === 'card'
              ? 'cards'
              : dataset.preferredPresentation === 'markdown' || dataset.preferredPresentation === 'table'
                ? dataset.preferredPresentation
                : dataset.display === 'cards' || dataset.display === 'list' || dataset.display === 'markdown'
                  ? dataset.display
                  : 'table',
          fieldKeys: Array.isArray(dataset.fieldKeys)
            ? dataset.fieldKeys
            : Array.isArray(dataset.fields)
              ? dataset.fields
              : Array.isArray(dataset.columns)
                ? dataset.columns
                    .map((column) => {
                      if (column && typeof column.id === 'string' && column.id.trim().length > 0) {
                        return column.id;
                      }

                      if (column && typeof column.label === 'string' && column.label.trim().length > 0) {
                        return structuredFieldKey(column.label);
                      }

                      return null;
                    })
                    .filter(Boolean)
                : [],
          detailEntityId:
            typeof dataset.selectedItemId === 'string' && dataset.selectedItemId.trim().length > 0 ? dataset.selectedItemId : null,
          metadata: dataset.metadata || {}
        }))
      : candidateDatasetIds.map((datasetId, index) => ({
          id: datasetId,
          label:
            index === 0
              ? intentSummary.label || currentRecipe.title || 'Results'
              : `Related ${index + 1}`,
          preferredView:
            intentSummary.preferredPresentation === 'cards' ||
            intentSummary.preferredPresentation === 'table' ||
            intentSummary.preferredPresentation === 'markdown'
              ? intentSummary.preferredPresentation
              : 'table',
          fieldKeys: [],
          detailEntityId: null,
          metadata: {
            source: 'compact-contract-fallback'
          }
        }));
  const tabs = Array.isArray(graph.tabs) ? graph.tabs : [];
  const views = Array.isArray(graph.views) ? graph.views : [];
  const entities = Array.isArray(graph.entities) ? graph.entities : [];
  const actions = Array.isArray(allowedActions.actions) ? allowedActions.actions : [];
  const firstCollection = collections[0] ?? null;
  const secondCollection = collections[1] ?? null;
  const fieldKeys = Array.isArray(firstCollection?.fieldKeys) ? firstCollection.fieldKeys : [];
  const detailFieldKeys = fieldKeys.slice(0, Math.max(1, Math.min(4, fieldKeys.length)));
  const hasImages = entities.some((entity) => entity && entity.hasImage);
  const availableActionIds = actions
    .map((action) => (action && typeof action.id === 'string' ? action.id : null))
    .filter(Boolean);
  const topActionIds = availableActionIds.filter((actionId) => ['refresh-recipe', 'retry-build'].includes(actionId));
  const rowActionIds = availableActionIds.filter((actionId) => ['refine-selection', 'refresh-recipe'].includes(actionId));
  const normalizedRequest = String(userRequest || '').toLowerCase();
  const primarySectionKind =
    /\b(compare|comparison|price|prices|store|stores)\b/.test(normalizedRequest)
      ? 'comparison'
      : /\b(inbox|email|triage|pipeline|crm|threat|board)\b/.test(normalizedRequest)
        ? 'board'
        : hasImages
          ? 'media'
          : /\b(notes|research|plan|planning|repo|code|security)\b/.test(normalizedRequest)
            ? 'list'
            : 'table';

  const overviewSectionIds = ['dsl-summary'];
  const sections = [
    {
      id: 'dsl-summary',
      kind: 'summary',
      title: graph.title || currentRecipe.title || 'Richer recipe',
      description: graph.subtitle || currentRecipe.description || 'Deterministic fixture-generated DSL recipe.',
      body: `### Recipe enrichment\n\nHermes returned a declarative recipe DSL overlay for **${graph.title || currentRecipe.title || 'this Home recipe'}**.\n\n- Keeps the baseline Home recipe intact\n- Reuses stable ids from the existing recipe graph\n- Promotes richer sections without runtime TSX generation`,
      actionIds: [],
      fieldKeys: [],
      status: 'ready',
      metadata: {}
    }
  ];

  if (firstCollection && typeof firstCollection.id === 'string') {
    sections.push({
      id: 'dsl-primary-collection',
      kind: primarySectionKind,
      title: firstCollection.label || 'Results',
      description: 'Primary collection rendered from the normalized recipe model.',
      collectionId: firstCollection.id,
      entityId: null,
      actionIds: rowActionIds,
      fieldKeys,
      status: 'ready',
      metadata:
        primarySectionKind === 'board'
          ? {
              laneFieldKey: fieldKeys.find((fieldKey) => /status|stage|state/i.test(fieldKey)) || fieldKeys[0] || null
            }
          : {}
    });
    overviewSectionIds.push('dsl-primary-collection');

    sections.push({
      id: 'dsl-detail',
      kind: 'detail_panel',
      title: 'Details',
      description: 'Inspect the selected record without replacing the whole recipe.',
      collectionId: firstCollection.id,
      entityId: null,
      actionIds: rowActionIds,
      fieldKeys: detailFieldKeys,
      status: 'ready',
      metadata: {},
      emptyState: {
        title: 'Nothing selected',
        description: 'Choose an item from the collection to inspect it here.'
      }
    });
    overviewSectionIds.push('dsl-detail');
  }

  if (topActionIds.length > 0) {
    sections.push({
      id: 'dsl-actions',
      kind: 'actions',
      title: 'Recipe actions',
      description: 'Bridge-validated actions remain stable across recipe updates.',
      collectionId: null,
      entityId: null,
      actionIds: topActionIds,
      fieldKeys: [],
      status: 'ready',
      metadata: {}
    });
    overviewSectionIds.push('dsl-actions');
  }

  const dslViews = [
    {
      id: 'dsl-view-overview',
      label: 'Overview',
      sectionIds: overviewSectionIds,
      layout: 'stack',
      metadata: {
        source: 'fixture-recipe-dsl'
      }
    }
  ];
  const dslTabs = [
    {
      id: 'dsl-tab-overview',
      label: 'Overview',
      viewId: 'dsl-view-overview',
      status: 'ready',
      metadata: {}
    }
  ];

  if (secondCollection && typeof secondCollection.id === 'string') {
    sections.push({
      id: 'dsl-secondary-collection',
      kind: secondCollection.preferredView === 'list' ? 'list' : 'table',
      title: secondCollection.label || 'Secondary results',
      description: 'Additional results kept in a dedicated tab.',
      collectionId: secondCollection.id,
      entityId: null,
      actionIds: [],
      fieldKeys: Array.isArray(secondCollection.fieldKeys) ? secondCollection.fieldKeys : [],
      status: 'ready',
      metadata: {}
    });
    dslViews.push({
      id: 'dsl-view-secondary',
      label: secondCollection.label || 'Related',
      sectionIds: ['dsl-secondary-collection'],
      layout: 'stack',
      metadata: {}
    });
    dslTabs.push({
      id: 'dsl-tab-secondary',
      label: secondCollection.label || 'Related',
      viewId: 'dsl-view-secondary',
      status: 'ready',
      metadata: {}
    });
  }

  return {
    kind: 'recipe_dsl',
    schemaVersion: 'recipe_dsl/v2',
    sdkVersion: graph.sdkVersion || 'recipe_sdk/v1',
    title: graph.title || currentRecipe.title || 'Fixture rich recipe',
    subtitle: graph.subtitle || currentRecipe.description || 'Declarative recipe enrichment',
    summary: 'Fixture-generated richer recipe DSL overlay.',
    status: 'active',
    tabs: dslTabs.map((tab) => ({
      id: tab.id,
      label: tab.label,
      sectionIds: dslViews.find((view) => view.id === tab.viewId)?.sectionIds || overviewSectionIds,
      layout: dslViews.find((view) => view.id === tab.viewId)?.layout || 'stack',
      metadata: tab.metadata
    })),
    datasets: collections.map((collection) => ({
      id: collection.id,
      title: collection.label,
      summary: undefined,
      display:
        collection.preferredView === 'detail_panel'
          ? 'detail'
          : collection.preferredView === 'cards' || collection.preferredView === 'list' || collection.preferredView === 'markdown'
            ? collection.preferredView
            : 'table',
      fields: Array.isArray(collection.fieldKeys) ? collection.fieldKeys : [],
      focusEntityId: collection.detailEntityId ?? null,
      notes: [],
      metadata: collection.metadata || {}
    })),
    sections: sections.map((section) => ({
      id: section.id,
      type:
        section.kind === 'table' || section.kind === 'list' || section.kind === 'cards' || section.kind === 'board'
          ? 'dataset'
          : section.kind === 'detail_panel'
            ? 'detail'
            : section.kind === 'actions'
              ? 'actions'
              : section.kind,
      title: section.title,
      summary: section.description,
      datasetId: section.collectionId || undefined,
      body: section.body,
      fields: Array.isArray(section.fieldKeys) ? section.fieldKeys : [],
      entityIds: section.entityId ? [section.entityId] : [],
      actionIds: Array.isArray(section.actionIds) ? section.actionIds : [],
      links: [],
      media: [],
      stats: [],
      metadata: {
        ...section.metadata,
        ...(section.kind === 'cards' ? { display: 'cards' } : {}),
        ...(section.kind === 'list' ? { display: 'list' } : {}),
        ...(section.kind === 'board' ? { display: 'cards' } : {})
      }
    })),
    actions: topActionIds.map((actionId) => ({
      kind: 'existing_action',
      id: actionId,
      placement: 'toolbar',
      metadata: {}
    })),
    notes: [],
    operations: [
      {
        op: 'set_active_tab',
        tabId: dslTabs[0]?.id || tabs[0]?.id || 'dsl-tab-overview'
      }
    ],
    semanticHints: {
      primaryDatasetId: firstCollection?.id,
      preferredLayout: secondCollection ? 'tabbed' : 'stack',
      notes: ['Fixture DSL path', `Existing tabs: ${views.length > 0 ? views.length : tabs.length}`],
      narrowPaneStrategy: 'stack'
    },
    metadata: {
      fixture: true,
      source: 'recipe_dsl_fixture'
    }
  };
}

function inferTemplateIdFromPrompt(prompt) {
  const selection = parseStructuredPromptJson(prompt, 'Selected template', [
    'Template contract packet',
    'Template text contract packet',
    'Template hydration contract packet',
    'Template actions contract packet',
    'CANONICAL SCHEMA',
    'Schema compliance rules',
    'Staged text artifact',
    'Hydrated content artifact',
    'Current Home recipe'
  ]);
  if (selection && typeof selection.templateId === 'string') {
    return selection.templateId;
  }

  const textContractPacket = parseStructuredPromptJson(prompt, 'Template text contract packet', [
    'Template hydration contract packet',
    'Template actions contract packet',
    'Staged text artifact',
    'Current Home recipe'
  ]);
  if (textContractPacket && typeof textContractPacket.templateId === 'string') {
    return textContractPacket.templateId;
  }

  const hydrationContractPacket = parseStructuredPromptJson(prompt, 'Template hydration contract packet', [
    'Template actions contract packet',
    'Staged text artifact',
    'Hydrated content artifact',
    'Current Home recipe'
  ]);
  if (hydrationContractPacket && typeof hydrationContractPacket.templateId === 'string') {
    return hydrationContractPacket.templateId;
  }

  const actionsContractPacket = parseStructuredPromptJson(prompt, 'Template actions contract packet', [
    'Staged text artifact',
    'Hydrated content artifact',
    'Current Home recipe'
  ]);
  if (actionsContractPacket && typeof actionsContractPacket.templateId === 'string') {
    return actionsContractPacket.templateId;
  }

  const stagedTextArtifact = parseStructuredPromptJson(prompt, 'Staged text artifact', [
    'Template hydration contract packet',
    'Template actions contract packet',
    'Current Home recipe',
    'Current template state',
    'Normalized data snapshot'
  ]);
  if (stagedTextArtifact && typeof stagedTextArtifact.templateId === 'string') {
    return stagedTextArtifact.templateId;
  }

  const hydratedArtifact = parseStructuredPromptJson(prompt, 'Hydrated content artifact', [
    'Template actions contract packet',
    'Current Home recipe',
    'Current template state',
    'Normalized data snapshot'
  ]);
  if (hydratedArtifact && typeof hydratedArtifact.templateId === 'string') {
    return hydratedArtifact.templateId;
  }

  const currentTemplate = parseStructuredPromptJson(prompt, 'Current template state');
  if (currentTemplate && typeof currentTemplate.templateId === 'string') {
    return currentTemplate.templateId;
  }

  const intent = parseStructuredPromptJson(prompt, 'Intent summary', ['Assistant response summary', 'Current template state']);
  const currentRecipe = parseStructuredPromptJson(prompt, 'Current Home recipe', ['Intent summary', 'Normalized data snapshot']);
  const assistantSummary = parseStructuredPromptJson(prompt, 'Assistant response summary', ['Current template state']);
  const normalizedData = parseStructuredPromptJson(prompt, 'Normalized data snapshot', ['Assistant response summary', 'Current template state']);
  const intentText = [
    intent?.category,
    intent?.label,
    intent?.summary,
    currentRecipe?.title,
    currentRecipe?.description,
    currentRecipe?.summary,
    assistantSummary?.summary,
    assistantSummary?.responseLead,
    assistantSummary?.responseTail,
    JSON.stringify(normalizedData ?? {})
  ]
    .filter((value) => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .toLowerCase();

  // Short-circuit: recipe was created by the local-discovery fixture operation → always local-discovery
  if (
    typeof currentRecipe?.description === 'string' &&
    /fixture-created local discovery/i.test(currentRecipe.description)
  ) {
    return 'local-discovery-comparison';
  }

  if (/\b(email|inbox|mail|sender|unread|rule|rules|filter|routing|automation)\b/u.test(intentText)) {
    return 'inbox-triage-board';
  }

  if (/\b(job|application|interview|salary|company posting)\b/u.test(intentText)) {
    return 'job-search-pipeline';
  }

  if (/\b(campaign|content|newsletter|launch email|draft)\b/u.test(intentText)) {
    return 'content-campaign-planner';
  }

  if (/\b(vendor|crm|procurement|compare software|evaluation matrix)\b/u.test(intentText)) {
    return 'vendor-evaluation-matrix';
  }

  if (/\b(project plan|launch plan|rollout plan|milestone|timeline)\b/u.test(intentText)) {
    return 'research-notebook';
  }

  if (/\b(code|repo|refactor|engineering|beta launch|implementation plan|risk)\b/u.test(intentText)) {
    return 'research-notebook';
  }

  if (/\b(research|sources|claims|follow-?up|notes)\b/u.test(intentText)) {
    return 'research-notebook';
  }

  if (/\b(event|venue|guest|checklist)\b/u.test(intentText)) {
    return 'event-planner';
  }

  if (/\b(trip|itinerary|bookings|packing|travel|budget breakdown|financial breakdown|line items|lodging|meals)\b/u.test(intentText)) {
    return 'travel-itinerary-planner';
  }

  if (/\b(hotel|hotels|lodging|lodgings|stay|stays)\b/u.test(intentText)) {
    return 'hotel-shortlist';
  }

  if (/\b(restaurant|restaurants|dining|menu|book table|book tables)\b/u.test(intentText)) {
    return 'restaurant-finder';
  }

  if (/\b(nearby|local|venue shortlist|service providers|places)\b/u.test(intentText)) {
    return 'local-discovery-comparison';
  }

  if (/\b(structured shortlist|comparison shortlist|option a|compare|price|merchant|store|shopping|shortlist)\b/u.test(intentText)) {
    return 'vendor-evaluation-matrix';
  }

  return 'hotel-shortlist';
}

function createRecipeTemplateSelectionArtifact(prompt) {
  const currentTemplate = parseStructuredPromptJson(prompt, 'Current template state');
  const templateId = inferTemplateIdFromPrompt(prompt);
  const currentTemplateId =
    currentTemplate && typeof currentTemplate.templateId === 'string' ? currentTemplate.templateId : null;
  const mode = currentTemplateId ? (currentTemplateId === templateId ? 'update' : 'switch') : 'fill';

  return JSON.stringify({
    kind: 'recipe_template_selection',
    schemaVersion: 'recipe_template_selection/v2',
    templateId,
    mode,
    reason:
      currentTemplateId && currentTemplateId !== templateId
        ? 'Fixture detected an intent shift and selected a supported template transition.'
        : currentTemplateId
          ? 'Fixture kept the current approved template and requested a bounded update.'
          : 'Fixture selected the closest approved template for the current Home recipe.',
    confidence: currentTemplateId ? 0.88 : 0.84,
    ...(currentTemplateId ? { hints: { currentTemplateId } } : {})
  });
}

function findTemplateSectionBySlotId(sections, slotId) {
  for (const section of sections ?? []) {
    if (section?.slotId === slotId) {
      return section;
    }

    if (section?.kind === 'split') {
      const left = findTemplateSectionBySlotId(section.left ?? [], slotId);
      if (left) {
        return left;
      }
      const right = findTemplateSectionBySlotId(section.right ?? [], slotId);
      if (right) {
        return right;
      }
    }

    if (section?.kind === 'tabs') {
      for (const pane of Object.values(section.panes ?? {})) {
        const match = findTemplateSectionBySlotId(pane ?? [], slotId);
        if (match) {
          return match;
        }
      }
    }
  }

  return null;
}

function findTemplateSectionBySlotIds(sections, slotIds) {
  for (const slotId of slotIds) {
    const section = findTemplateSectionBySlotId(sections, slotId);
    if (section) {
      return section;
    }
  }

  return null;
}

function actionRefsToLinks(actions) {
  return (actions ?? [])
    .filter((action) => action?.kind === 'link' && typeof action.href === 'string')
    .map((action) => ({
      label: action.label,
      href: action.href
    }));
}

function groupedListToGroups(section) {
  if (!section || section.kind !== 'grouped-list') {
    return [];
  }

  return (section.groups ?? []).map((group) => ({
    id: group.id,
    label: group.label,
    tone: group.tone,
    items: (group.items ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      meta: item.meta,
      chips: item.chips ?? [],
      bullets: [],
      links: actionRefsToLinks(item.actions)
    }))
  }));
}

function cardGridToCards(section) {
  if (!section || section.kind !== 'card-grid') {
    return [];
  }

  return (section.cards ?? []).map((card) => ({
    id: card.id,
    title: card.title,
    subtitle: card.subtitle,
    meta: card.meta,
    imageLabel: card.imageLabel,
    price: card.price,
    chips: card.chips ?? [],
    bullets: card.bullets ?? [],
    footer: card.footer,
    links: actionRefsToLinks(card.actions)
  }));
}

function timelineToItems(section) {
  if (!section || section.kind !== 'timeline') {
    return [];
  }

  return (section.items ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    time: item.time,
    summary: item.summary,
    chips: item.chips ?? [],
    links: actionRefsToLinks(item.actions)
  }));
}

function detailPanelToDetail(section) {
  if (!section || section.kind !== 'detail-panel') {
    return null;
  }

  return {
    id: section.slotId,
    title: section.title,
    eyebrow: section.eyebrow,
    summary: section.summary,
    chips: section.chips ?? [],
    fields: section.fields ?? [],
    note: section.note,
    noteTitle: section.noteTitle
  };
}

function notesToLines(section) {
  return section && section.kind === 'notes' ? section.lines ?? [] : [];
}

function statsToItems(section) {
  return section && section.kind === 'stats' ? section.items ?? [] : [];
}

function comparisonTableToData(section) {
  if (!section || section.kind !== 'comparison-table') {
    return {
      columns: [],
      rows: [],
      footerChips: [],
      footnote: undefined
    };
  }

  return {
    columns: (section.columns ?? []).map((column) => ({
      id: column.id,
      label: column.label,
      align: column.align
    })),
    rows: (section.rows ?? []).map((row) => ({
      id: row.id,
      label: row.label,
      cells: row.cells ?? []
    })),
    footerChips: section.footerChips ?? [],
    footnote: section.footnote
  };
}


function groupedChecklistToItems(section) {
  if (!section || section.kind !== 'grouped-list') {
    return [];
  }

  return (section.groups ?? []).flatMap((group) =>
    (group.items ?? []).map((item) => ({
      id: item.id ?? item.title,
      title: item.title,
      subtitle: item.subtitle,
      meta: item.meta,
      checked: (item.chips ?? []).some((chip) => chip.label === 'Done'),
      tone: group.label && /done|complete/iu.test(group.label) ? 'success' : undefined
    }))
  );
}

function convertLegacyTemplateFillArtifact(fill) {
  if (fill.schemaVersion === 'recipe_template_fill/v2') {
    return fill;
  }

  const sections = fill.sections ?? [];
  const hero = findTemplateSectionBySlotId(sections, 'hero');

  switch (fill.templateId) {
    case 'hotel-shortlist':
      return {
        kind: 'recipe_template_fill',
        schemaVersion: 'recipe_template_fill/v2',
        templateId: fill.templateId,
        title: fill.title,
        subtitle: fill.subtitle,
        summary: fill.summary,
        data: {
          eyebrow: hero?.eyebrow,
          heroChips: hero?.chips ?? [],
          stats: statsToItems(findTemplateSectionBySlotId(sections, 'stats')),
          cards: cardGridToCards(findTemplateSectionBySlotId(sections, 'hotels')),
          noteLines: notesToLines(findTemplateSectionBySlotId(sections, 'notes'))
        },
        metadata: fill.metadata ?? {}
      };
    case 'inbox-triage-board':
      return {
        kind: 'recipe_template_fill',
        schemaVersion: 'recipe_template_fill/v2',
        templateId: fill.templateId,
        title: fill.title,
        subtitle: fill.subtitle,
        summary: fill.summary,
        data: {
          eyebrow: hero?.eyebrow,
          heroChips: hero?.chips ?? [],
          stats: statsToItems(findTemplateSectionBySlotId(sections, 'stats')),
          groups: groupedListToGroups(findTemplateSectionBySlotId(sections, 'triage-groups')),
          detail: detailPanelToDetail(findTemplateSectionBySlotId(sections, 'triage-detail')),
          bulkActionTitle: findTemplateSectionBySlotId(sections, 'bulk-actions')?.title
        },
        metadata: fill.metadata ?? {}
      };
    case 'restaurant-finder':
    case 'local-discovery-comparison':
      return {
        kind: 'recipe_template_fill',
        schemaVersion: 'recipe_template_fill/v2',
        templateId: fill.templateId,
        title: fill.title,
        subtitle: fill.subtitle,
        summary: fill.summary,
        data: {
          eyebrow: hero?.eyebrow,
          heroChips: hero?.chips ?? [],
          filters: findTemplateSectionBySlotId(sections, 'filters')?.filters ?? [],
          sortLabel: findTemplateSectionBySlotId(sections, 'filters')?.sortLabel,
          groups: groupedListToGroups(
            findTemplateSectionBySlotIds(sections, ['result-list', 'restaurant-list', 'place-list'])
          ),
          detail: detailPanelToDetail(
            findTemplateSectionBySlotIds(sections, ['result-detail', 'restaurant-detail', 'place-detail'])
          ),
          noteLines: notesToLines(findTemplateSectionBySlotId(sections, 'notes'))
        },
        metadata: fill.metadata ?? {}
      };
    case 'research-notebook':
      return {
        kind: 'recipe_template_fill',
        schemaVersion: 'recipe_template_fill/v2',
        templateId: fill.templateId,
        title: fill.title,
        subtitle: fill.subtitle,
        summary: fill.summary,
        data: {
          eyebrow: hero?.eyebrow,
          heroChips: hero?.chips ?? [],
          activeTabId: findTemplateSectionBySlotId(sections, 'research-tabs')?.activeTabId,
          sources: groupedListToGroups(findTemplateSectionBySlotIds(sections, ['sources', 'sources-list'])),
          noteLines: notesToLines(findTemplateSectionBySlotIds(sections, ['notes', 'notes-pane'])),
          extractedPoints: groupedListToGroups(findTemplateSectionBySlotIds(sections, ['extracted-points', 'points-pane', 'points'])),
          followUps: groupedListToGroups(findTemplateSectionBySlotIds(sections, ['follow-ups', 'followups-pane', 'followups']))
        },
        metadata: fill.metadata ?? {}
      };
    case 'vendor-evaluation-matrix': {
      const matrix = comparisonTableToData(findTemplateSectionBySlotId(sections, 'matrix'));
      return {
        kind: 'recipe_template_fill',
        schemaVersion: 'recipe_template_fill/v2',
        templateId: fill.templateId,
        title: fill.title,
        subtitle: fill.subtitle,
        summary: fill.summary,
        data: {
          eyebrow: hero?.eyebrow,
          heroChips: hero?.chips ?? [],
          stats: statsToItems(findTemplateSectionBySlotId(sections, 'stats')),
          columns: matrix.columns,
          rows: matrix.rows,
          footerChips: matrix.footerChips,
          footnote: matrix.footnote,
          noteLines: notesToLines(findTemplateSectionBySlotId(sections, 'notes'))
        },
        metadata: fill.metadata ?? {}
      };
    }
    case 'travel-itinerary-planner':
      return {
        kind: 'recipe_template_fill',
        schemaVersion: 'recipe_template_fill/v2',
        templateId: fill.templateId,
        title: fill.title,
        subtitle: fill.subtitle,
        summary: fill.summary,
        data: {
          eyebrow: hero?.eyebrow,
          heroChips: hero?.chips ?? [],
          activeTabId: findTemplateSectionBySlotId(sections, 'trip-tabs')?.activeTabId,
          itineraryItems: timelineToItems(findTemplateSectionBySlotIds(sections, ['itinerary', 'trip-itinerary'])),
          bookingCards: cardGridToCards(findTemplateSectionBySlotIds(sections, ['bookings', 'trip-bookings'])),
          packingItems: groupedChecklistToItems(findTemplateSectionBySlotIds(sections, ['packing', 'trip-packing'])),
          noteLines: notesToLines(findTemplateSectionBySlotIds(sections, ['notes', 'trip-notes'])),
          links: groupedListToGroups(findTemplateSectionBySlotId(sections, 'links')).flatMap((group) =>
            (group.items ?? []).flatMap((item) => item.links ?? [])
          )
        },
        metadata: fill.metadata ?? {}
      };
    case 'event-planner':
      return {
        kind: 'recipe_template_fill',
        schemaVersion: 'recipe_template_fill/v2',
        templateId: fill.templateId,
        title: fill.title,
        subtitle: fill.subtitle,
        summary: fill.summary,
        data: {
          eyebrow: hero?.eyebrow,
          heroChips: hero?.chips ?? [],
          activeTabId: findTemplateSectionBySlotId(sections, 'event-tabs')?.activeTabId,
          venueCards: cardGridToCards(findTemplateSectionBySlotId(sections, 'venues')),
          guestGroups: groupedListToGroups(findTemplateSectionBySlotIds(sections, ['guests', 'guest-list'])),
          checklistItems: groupedChecklistToItems(findTemplateSectionBySlotId(sections, 'checklist')),
          itineraryItems: timelineToItems(findTemplateSectionBySlotIds(sections, ['itinerary', 'event-itinerary'])),
          noteLines: notesToLines(findTemplateSectionBySlotId(sections, 'notes'))
        },
        metadata: fill.metadata ?? {}
      };
    case 'job-search-pipeline':
      return {
        kind: 'recipe_template_fill',
        schemaVersion: 'recipe_template_fill/v2',
        templateId: fill.templateId,
        title: fill.title,
        subtitle: fill.subtitle,
        summary: fill.summary,
        data: {
          eyebrow: hero?.eyebrow,
          heroChips: hero?.chips ?? [],
          stats: statsToItems(findTemplateSectionBySlotId(sections, 'stats')),
          cards: cardGridToCards(findTemplateSectionBySlotIds(sections, ['listings', 'job-listings'])),
          noteLines: notesToLines(findTemplateSectionBySlotId(sections, 'notes'))
        },
        metadata: fill.metadata ?? {}
      };
    case 'content-campaign-planner':
      return {
        kind: 'recipe_template_fill',
        schemaVersion: 'recipe_template_fill/v2',
        templateId: fill.templateId,
        title: fill.title,
        subtitle: fill.subtitle,
        summary: fill.summary,
        data: {
          eyebrow: hero?.eyebrow,
          heroChips: hero?.chips ?? [],
          activeTabId: findTemplateSectionBySlotId(sections, 'campaign-tabs')?.activeTabId,
          ideaCards: cardGridToCards(findTemplateSectionBySlotIds(sections, ['ideas', 'idea-cards'])),
          draftLines: notesToLines(findTemplateSectionBySlotIds(sections, ['drafts', 'draft-notes'])),
          scheduleItems: timelineToItems(findTemplateSectionBySlotIds(sections, ['schedule', 'campaign-schedule'])),
          noteLines: notesToLines(findTemplateSectionBySlotIds(sections, ['notes', 'campaign-notes']))
        },
        metadata: fill.metadata ?? {}
      };
    default:
      return fill;
  }
}

function createHotelShortlistTemplateFillArtifact() {
  return {
    kind: 'recipe_template_fill',
    schemaVersion: 'recipe_template_fill/v1',
    templateId: 'hotel-shortlist',
    title: 'Hotel shortlist',
    subtitle: 'Weekend Dayton options',
    summary: 'Curated hotel options for a weekend stay.',
    sections: [
      {
        slotId: 'hero',
        kind: 'hero',
        eyebrow: 'Trip stay',
        title: 'Weekend Dayton hotel shortlist',
        summary: 'A compact shortlist of walkable, downtown-friendly hotel options.',
        chips: [
          { label: '2 hotels', tone: 'accent' },
          { label: 'Downtown focus', tone: 'neutral' }
        ],
        actions: []
      },
      {
        slotId: 'stats',
        kind: 'stats',
        title: 'At a glance',
        items: [
          {
            label: 'Options',
            value: '2',
            tone: 'accent'
          },
          {
            label: 'Budget floor',
            value: '$189',
            tone: 'success'
          }
        ]
      },
      {
        slotId: 'hotels',
        kind: 'card-grid',
        title: 'Hotels',
        columns: 2,
        cards: [
          {
            id: 'hotel-ardent',
            title: 'Hotel Ardent',
            subtitle: 'Downtown Dayton',
            price: '$210',
            chips: [
              { label: 'Boutique', tone: 'accent' },
              { label: 'Walkable', tone: 'success' }
            ],
            bullets: ['Breakfast nearby', 'Historic building'],
            footer: 'Best fit for a central weekend stay.',
            actions: [
              {
                kind: 'link',
                label: 'Book',
                href: 'https://example.com/hotel-ardent'
              }
            ]
          },
          {
            id: 'ac-hotel-dayton',
            title: 'AC Hotel Dayton',
            subtitle: 'Dayton core',
            price: '$189',
            chips: [
              { label: 'Modern', tone: 'neutral' },
              { label: 'Lower price', tone: 'success' }
            ],
            bullets: ['Clean business-friendly rooms', 'Easy downtown access'],
            footer: 'Lower nightly rate with a simpler room setup.',
            actions: [
              {
                kind: 'link',
                label: 'Booking link',
                href: 'https://example.com/ac-dayton'
              }
            ]
          }
        ]
      },
      {
        slotId: 'notes',
        kind: 'notes',
        title: 'Notes',
        lines: ['Keep a walkable option at the top of the shortlist.'],
        actions: []
      }
    ],
    metadata: {
      fixture: true
    }
  };
}

function createRestaurantFinderTemplateFillArtifact() {
  return {
    kind: 'recipe_template_fill',
    schemaVersion: 'recipe_template_fill/v1',
    templateId: 'restaurant-finder',
    title: 'Restaurant finder',
    subtitle: 'Italian near Dayton',
    summary: 'Compare nearby restaurants with direct menu and booking links.',
    sections: [
      {
        slotId: 'hero',
        kind: 'hero',
        eyebrow: 'Dining',
        title: 'Italian restaurants near Dayton',
        summary: 'A compact list-detail restaurant recipe tuned for a narrow session pane.',
        chips: [
          { label: '3 options', tone: 'accent' },
          { label: 'Open tonight', tone: 'success' }
        ],
        actions: []
      },
      {
        slotId: 'filters',
        kind: 'filter-strip',
        title: 'Filters',
        filters: [
          { label: '$$', tone: 'neutral' },
          { label: 'Highly rated', tone: 'accent' },
          { label: 'Walkable', tone: 'success' }
        ],
        sortLabel: 'Sort: Best rated'
      },
      {
        slotId: 'results',
        kind: 'split',
        ratio: 'list-detail',
        left: [
          {
            slotId: 'restaurant-list',
            kind: 'grouped-list',
            title: 'Matches',
            groups: [
              {
                id: 'top-matches',
                label: 'Top matches',
                tone: 'accent',
                items: [
                  {
                    id: 'mamma-disalvos',
                    title: "Mamma Disalvo's",
                    subtitle: 'Classic Italian',
                    meta: '4.6 rating · $$ · 7 min away',
                    chips: [
                      { label: 'Family style', tone: 'accent' },
                      { label: 'Open until 10 PM', tone: 'success' }
                    ],
                    actions: [
                      {
                        kind: 'link',
                        label: 'Menu',
                        href: 'https://example.com/mamma-menu'
                      },
                      {
                        kind: 'link',
                        label: 'Book',
                        href: 'https://example.com/mamma-book'
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        right: [
          {
            slotId: 'restaurant-detail',
            kind: 'detail-panel',
            title: "Mamma Disalvo's",
            eyebrow: 'Selected restaurant',
            summary: 'Strong neighborhood favorite with reliable reservations and a broad menu.',
            chips: [
              { label: '4.6 rating', tone: 'accent' },
              { label: '$$', tone: 'neutral' }
            ],
            fields: [
              {
                label: 'Hours',
                value: 'Open until 10 PM',
                chips: [],
                bullets: [],
                links: [],
                fullWidth: false
              },
              {
                label: 'Booking links',
                value: undefined,
                chips: [],
                bullets: [],
                links: [
                  {
                    label: 'Book a table',
                    href: 'https://example.com/mamma-book'
                  },
                  {
                    label: 'View menu',
                    href: 'https://example.com/mamma-menu'
                  }
                ],
                fullWidth: true
              }
            ],
            actions: [],
            note: 'Use the session chat to ask Hermes to book once you settle on a place.',
            noteTitle: 'Next step'
          }
        ]
      },
      {
        slotId: 'quick-actions',
        kind: 'action-bar',
        title: 'Quick actions',
        actions: [
          {
            kind: 'existing_action',
            actionId: 'refresh-recipe',
            selectedItemIds: []
          }
        ]
      }
    ],
    metadata: {
      fixture: true
    }
  };
}

function createInboxTriageTemplateFillArtifact() {
  return {
    kind: 'recipe_template_fill',
    schemaVersion: 'recipe_template_fill/v1',
    templateId: 'inbox-triage-board',
    title: 'Inbox triage board',
    subtitle: 'Unread sender cleanup',
    summary: 'Group unread senders and review the next cleanup move.',
    sections: [
      {
        slotId: 'hero',
        kind: 'hero',
        eyebrow: 'Email cleanup',
        title: 'Unread sender triage',
        summary: 'Review grouped senders, counts, and safe bulk cleanup steps.',
        chips: [
          { label: '12 unread', tone: 'accent' },
          { label: '4 senders', tone: 'neutral' }
        ],
        actions: []
      },
      {
        slotId: 'stats',
        kind: 'stats',
        title: 'Queue health',
        items: [
          {
            label: 'Senders',
            value: '4',
            tone: 'accent'
          },
          {
            label: 'Rules suggested',
            value: '2',
            tone: 'warning'
          }
        ]
      },
      {
        slotId: 'triage-board',
        kind: 'split',
        ratio: 'list-detail',
        left: [
          {
            slotId: 'triage-groups',
            kind: 'grouped-list',
            title: 'Sender groups',
            groups: [
              {
                id: 'priority',
                label: 'Needs review',
                tone: 'warning',
                items: [
                  {
                    id: 'sender-product',
                    title: 'Product updates',
                    subtitle: '4 unread',
                    meta: 'Likely archive or rule candidate',
                    chips: [{ label: 'Bulk action', tone: 'warning' }],
                    actions: []
                  }
                ]
              }
            ]
          }
        ],
        right: [
          {
            slotId: 'triage-detail',
            kind: 'detail-panel',
            title: 'Selected sender preview',
            summary: 'Product updates are repeat senders with low-priority content.',
            chips: [
              { label: '4 unread', tone: 'accent' },
              { label: 'Low urgency', tone: 'neutral' }
            ],
            fields: [
              {
                label: 'Suggested move',
                value: 'Archive the current batch and propose a routing rule for future sends.',
                chips: [],
                bullets: [],
                links: [],
                fullWidth: true
              }
            ],
            actions: [],
            note: 'Use this board to keep sender groups stable while Hermes updates the queue.',
            noteTitle: 'Why this layout'
          }
        ]
      },
      {
        slotId: 'bulk-actions',
        kind: 'action-bar',
        title: 'Bulk actions',
        actions: [
          {
            kind: 'existing_action',
            actionId: 'refresh-recipe',
            selectedItemIds: []
          }
        ]
      }
    ],
    metadata: {
      fixture: true
    }
  };
}

function createResearchNotebookTemplateFillArtifact() {
  return {
    kind: 'recipe_template_fill',
    schemaVersion: 'recipe_template_fill/v1',
    templateId: 'research-notebook',
    title: 'Research notebook',
    subtitle: 'Sources, notes, and follow-ups',
    summary: 'Keep the sources stable, then run targeted follow-up prompts directly from the recipe.',
    sections: [
      {
        slotId: 'hero',
        kind: 'hero',
        eyebrow: 'Research',
        title: 'Research notebook',
        summary: 'A source-first notebook with extracted claims and promptable follow-ups.',
        chips: [
          { label: '4 sources', tone: 'accent' },
          { label: '2 follow-ups ready', tone: 'success' }
        ],
        actions: []
      },
      {
        slotId: 'research-tabs',
        kind: 'tabs',
        title: 'Notebook',
        tabs: [
          { id: 'sources', label: 'Sources', badge: '4' },
          { id: 'notes', label: 'Notes' },
          { id: 'points', label: 'Extracted points' },
          { id: 'followups', label: 'Follow-ups' }
        ],
        activeTabId: 'sources',
        panes: {
          sources: [
            {
              slotId: 'sources-list',
              kind: 'grouped-list',
              title: 'Source stack',
              groups: [
                {
                  id: 'primary',
                  label: 'Primary sources',
                  tone: 'accent',
                  items: [
                    {
                      id: 'source-openai',
                      title: 'OpenAI release notes',
                      subtitle: 'Primary source',
                      meta: 'Used for product timeline context',
                      chips: [{ label: 'High trust', tone: 'success' }],
                      actions: [
                        {
                          kind: 'link',
                          label: 'Open source',
                          href: 'https://example.com/openai-release-notes'
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ],
          notes: [
            {
              slotId: 'notes-pane',
              kind: 'notes',
              title: 'Operator notes',
              lines: ['Preserve the current source stack and append only incremental notes.'],
              actions: [
                {
                  kind: 'existing_action',
                  actionId: 'append-template-note',
                  selectedItemIds: []
                }
              ]
            }
          ],
          points: [
            {
              slotId: 'points-pane',
              kind: 'grouped-list',
              title: 'Extracted points',
              groups: [
                {
                  id: 'claims',
                  label: 'Claims to verify',
                  tone: 'warning',
                  items: [
                    {
                      id: 'claim-1',
                      title: 'Feature rollout depends on provider readiness.',
                      subtitle: 'Keep verification tied to provider discovery state.',
                      meta: 'Cross-check against implementation notes.',
                      chips: [{ label: 'Needs citation', tone: 'warning' }],
                      actions: []
                    }
                  ]
                }
              ]
            }
          ],
          followups: [
            {
              slotId: 'followups-pane',
              kind: 'grouped-list',
              title: 'Follow-up prompts',
              groups: [
                {
                  id: 'next-prompts',
                  label: 'Run next',
                  tone: 'accent',
                  items: [
                    {
                      id: 'followup-provider-risks',
                      title: 'Compare provider readiness risks',
                      subtitle: 'Run a focused follow-up prompt',
                      meta: 'Narrow the open questions before finalizing the brief.',
                      chips: [{ label: 'Prompt action', tone: 'accent' }],
                      actions: [
                        {
                          kind: 'existing_action',
                          actionId: 'run-followup',
                          selectedItemIds: ['followup-provider-risks']
                        }
                      ]
                    },
                    {
                      id: 'followup-market-summary',
                      title: 'Draft the market summary',
                      subtitle: 'Generate a concise markdown brief',
                      meta: 'Use the current notebook context as input.',
                      chips: [{ label: 'Prompt action', tone: 'accent' }],
                      actions: [
                        {
                          kind: 'existing_action',
                          actionId: 'run-followup',
                          selectedItemIds: ['followup-market-summary']
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    ],
    metadata: {
      fixture: true
    }
  };
}

function createVendorEvaluationTemplateFillArtifact() {
  return {
    kind: 'recipe_template_fill',
    schemaVersion: 'recipe_template_fill/v1',
    templateId: 'vendor-evaluation-matrix',
    title: 'Vendor evaluation matrix',
    subtitle: 'CRM shortlist',
    summary: 'Compare weighted criteria, pricing, and fit across the shortlist.',
    sections: [
      {
        slotId: 'hero',
        kind: 'hero',
        eyebrow: 'Vendor review',
        title: 'CRM comparison matrix',
        summary: 'A compact matrix for comparing pricing, capabilities, and fit.',
        chips: [
          { label: '3 vendors', tone: 'accent' },
          { label: 'Weighted criteria', tone: 'neutral' }
        ],
        actions: []
      },
      {
        slotId: 'stats',
        kind: 'stats',
        title: 'Shortlist status',
        items: [
          { label: 'Leading fit', value: 'HubSpot', tone: 'success' },
          { label: 'Budget band', value: '$$', tone: 'neutral' }
        ]
      },
      {
        slotId: 'matrix',
        kind: 'comparison-table',
        title: 'Evaluation matrix',
        columns: [
          { id: 'pricing', label: 'Pricing' },
          { id: 'automation', label: 'Automation' },
          { id: 'fit', label: 'Best fit' }
        ],
        rows: [
          {
            id: 'hubspot',
            label: 'HubSpot',
            cells: [
              { value: '$$', emphasis: true },
              { value: 'Strong' },
              { value: 'Fastest rollout', tone: 'success' }
            ],
            actions: [
              {
                kind: 'link',
                label: 'Open vendor',
                href: 'https://example.com/hubspot'
              }
            ]
          },
          {
            id: 'pipedrive',
            label: 'Pipedrive',
            cells: [
              { value: '$', tone: 'success' },
              { value: 'Moderate' },
              { value: 'Budget-friendly' }
            ],
            actions: [
              {
                kind: 'link',
                label: 'Open vendor',
                href: 'https://example.com/pipedrive'
              }
            ]
          }
        ],
        footerChips: [
          { label: 'Keep criteria stable across updates', tone: 'neutral' }
        ],
        footnote: 'Use this matrix to patch vendor rows instead of rebuilding the whole recipe.'
      }
    ],
    metadata: {
      fixture: true
    }
  };
}

function createTravelItineraryPlannerTemplateFillArtifact() {
  return {
    kind: 'recipe_template_fill',
    schemaVersion: 'recipe_template_fill/v1',
    templateId: 'travel-itinerary-planner',
    title: 'Travel itinerary planner',
    subtitle: 'Weekend Dayton trip',
    summary: 'Organize itinerary, bookings, packing, and notes in a stable multi-tab trip recipe.',
    sections: [
      {
        slotId: 'hero',
        kind: 'hero',
        eyebrow: 'Travel',
        title: 'Weekend Dayton planner',
        summary: 'Keep itinerary timing, bookings, packing, and travel notes together.',
        chips: [
          { label: '2 nights', tone: 'accent' },
          { label: 'Downtown stay', tone: 'success' }
        ],
        actions: []
      },
      {
        slotId: 'trip-tabs',
        kind: 'tabs',
        title: 'Trip tabs',
        tabs: [
          { id: 'itinerary', label: 'Itinerary' },
          { id: 'bookings', label: 'Bookings' },
          { id: 'packing', label: 'Packing' },
          { id: 'notes', label: 'Notes' }
        ],
        activeTabId: 'itinerary',
        panes: {
          itinerary: [
            {
              slotId: 'trip-itinerary',
              kind: 'timeline',
              title: 'Itinerary',
              items: [
                {
                  id: 'fri-checkin',
                  title: 'Check into Hotel Ardent',
                  time: 'Friday · 4:00 PM',
                  summary: 'Drop bags and get settled before dinner.',
                  chips: [{ label: 'Booking', tone: 'accent' }],
                  actions: []
                }
              ]
            }
          ],
          bookings: [
            {
              slotId: 'trip-bookings',
              kind: 'grouped-list',
              title: 'Bookings',
              groups: [
                {
                  id: 'confirmed',
                  label: 'Confirmed',
                  tone: 'success',
                  items: [
                    {
                      id: 'booking-hotel',
                      title: 'Hotel Ardent',
                      subtitle: '2 nights · Downtown Dayton',
                      meta: 'Confirmation ready',
                      chips: [{ label: 'Confirmed', tone: 'success' }],
                      actions: [
                        {
                          kind: 'link',
                          label: 'Open booking',
                          href: 'https://example.com/hotel-ardent'
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ],
          packing: [
            {
              slotId: 'trip-packing',
              kind: 'notes',
              title: 'Packing list',
              lines: ['Walking shoes', 'Phone charger', 'Dinner reservation details'],
              actions: []
            }
          ],
          notes: [
            {
              slotId: 'trip-notes',
              kind: 'notes',
              title: 'Notes',
              lines: ['Append budget or route notes without replacing the trip tabs.'],
              actions: []
            }
          ]
        }
      }
    ],
    metadata: {
      fixture: true
    }
  };
}

function createEventPlannerTemplateFillArtifact() {
  return {
    kind: 'recipe_template_fill',
    schemaVersion: 'recipe_template_fill/v1',
    templateId: 'event-planner',
    title: 'Event planner',
    subtitle: 'Venue, guests, and itinerary',
    summary: 'Move from venue selection into event planning without losing the shortlisted context.',
    sections: [
      {
        slotId: 'hero',
        kind: 'hero',
        eyebrow: 'Planning',
        title: 'Event planner',
        summary: 'Keep venue selection, guests, checklist, itinerary, notes, and links in one stable recipe.',
        chips: [
          { label: 'Venue shortlist', tone: 'accent' },
          { label: 'Checklist ready', tone: 'success' }
        ],
        actions: [
          {
            kind: 'existing_action',
            actionId: 'add-event-guest',
            selectedItemIds: []
          }
        ]
      },
      {
        slotId: 'event-tabs',
        kind: 'tabs',
        title: 'Event tabs',
        tabs: [
          { id: 'venues', label: 'Venues' },
          { id: 'guests', label: 'Guests' },
          { id: 'checklist', label: 'Checklist' },
          { id: 'itinerary', label: 'Itinerary' },
          { id: 'notes', label: 'Notes' }
        ],
        activeTabId: 'venues',
        panes: {
          venues: [
            {
              slotId: 'venues',
              kind: 'card-grid',
              title: 'Venue options',
              columns: 2,
              cards: [
                {
                  id: 'venue-dana',
                  title: 'Dana Hall',
                  subtitle: 'Historic venue',
                  chips: [
                    { label: 'Indoor', tone: 'accent' },
                    { label: 'Selected candidate', tone: 'success' }
                  ],
                  bullets: ['Central location', 'Good for 40 guests'],
                  footer: 'Use Select venue to carry this venue forward.',
                  actions: [
                    {
                      kind: 'existing_action',
                      actionId: 'select-event-venue',
                      selectedItemIds: ['venue-dana']
                    }
                  ]
                }
              ]
            }
          ],
          guests: [
            {
              slotId: 'guest-list',
              kind: 'grouped-list',
              title: 'Guest list',
              groups: [
                {
                  id: 'confirmed',
                  label: 'Added guests',
                  tone: 'accent',
                  items: [
                    {
                      id: 'guest-riley',
                      title: 'Riley Shaw',
                      subtitle: 'Core planning team',
                      meta: 'Added to the first invite wave',
                      chips: [{ label: 'Confirmed', tone: 'success' }],
                      actions: []
                    }
                  ]
                }
              ]
            }
          ],
          checklist: [
            {
              slotId: 'checklist',
              kind: 'grouped-list',
              title: 'Checklist',
              groups: [
                {
                  id: 'before-booking',
                  label: 'Before booking',
                  tone: 'warning',
                  items: [
                    {
                      id: 'checklist-confirm-capacity',
                      title: 'Confirm venue capacity',
                      subtitle: 'Needed before locking the room',
                      meta: 'Toggle this item when finished',
                      chips: [{ label: 'Open', tone: 'warning' }],
                      actions: [
                        {
                          kind: 'existing_action',
                          actionId: 'toggle-template-checklist',
                          selectedItemIds: ['checklist-confirm-capacity']
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ],
          itinerary: [
            {
              slotId: 'event-itinerary',
              kind: 'timeline',
              title: 'Itinerary',
              items: [
                {
                  id: 'arrival-window',
                  title: 'Guest arrival window',
                  time: '6:00 PM',
                  summary: 'Hold the first 30 minutes for arrivals and quick setup.',
                  chips: [{ label: 'Editable', tone: 'accent' }],
                  actions: []
                }
              ]
            }
          ],
          notes: [
            {
              slotId: 'notes',
              kind: 'notes',
              title: 'Planning notes',
              lines: ['Capture venue constraints and catering notes here.'],
              actions: [
                {
                  kind: 'existing_action',
                  actionId: 'append-template-note',
                  selectedItemIds: []
                }
              ]
            }
          ]
        }
      }
    ],
    metadata: {
      fixture: true
    }
  };
}

function createJobSearchPipelineTemplateFillArtifact() {
  return {
    kind: 'recipe_template_fill',
    schemaVersion: 'recipe_template_fill/v1',
    templateId: 'job-search-pipeline',
    title: 'Job search — senior engineering roles',
    subtitle: 'Curated openings with direct Apply links',
    summary: 'A card grid of curated senior engineering roles. Each card links directly to the job posting.',
    sections: [
      {
        slotId: 'hero',
        kind: 'hero',
        eyebrow: 'Job search',
        title: 'Senior engineering openings',
        summary: 'Browse curated roles and apply directly, or ask Hermes for more listings.',
        chips: [
          { label: '3 roles', tone: 'accent' },
          { label: 'Per-card Apply link', tone: 'neutral' }
        ],
        actions: []
      },
      {
        slotId: 'listings',
        kind: 'card-grid',
        title: 'Job listings',
        columns: 2,
        cards: [
          {
            id: 'job-stripe-platform',
            title: 'Platform Engineer',
            subtitle: 'Stripe',
            image: {
              src: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=600&q=80',
              alt: 'Financial technology office',
              aspect: 'video',
              fit: 'cover',
              borderRadius: 'none',
              border: 'none'
            },
            price: '$200k\u2013$240k',
            chips: [
              { label: 'Remote', tone: 'accent' },
              { label: 'Full-time', tone: 'neutral' }
            ],
            actions: [
              {
                kind: 'link',
                label: 'Apply',
                href: 'https://stripe.com/jobs',
                openInNewTab: true
              }
            ]
          },
          {
            id: 'job-linear-product',
            title: 'Product Engineer',
            subtitle: 'Linear',
            image: {
              src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80',
              alt: 'Clean minimal product design setup',
              aspect: 'video',
              fit: 'cover',
              borderRadius: 'none',
              border: 'none'
            },
            price: '$200k\u2013$235k',
            chips: [
              { label: 'Remote', tone: 'accent' },
              { label: 'Full-time', tone: 'neutral' }
            ],
            actions: [
              {
                kind: 'link',
                label: 'Apply',
                href: 'https://linear.app/careers',
                openInNewTab: true
              }
            ]
          },
          {
            id: 'job-anthropic-swe',
            title: 'Senior Software Engineer',
            subtitle: 'Anthropic',
            image: {
              src: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80',
              alt: 'AI research workspace',
              aspect: 'video',
              fit: 'cover',
              borderRadius: 'none',
              border: 'none'
            },
            price: '$240k\u2013$320k',
            chips: [
              { label: 'Remote', tone: 'accent' },
              { label: 'Full-time', tone: 'neutral' }
            ],
            actions: [
              {
                kind: 'link',
                label: 'Apply',
                href: 'https://www.anthropic.com/careers',
                openInNewTab: true
              }
            ]
          }
        ]
      }
    ],
    metadata: {
      fixture: true
    }
  };
}
function createContentCampaignPlannerTemplateFillArtifact() {
  return {
    kind: 'recipe_template_fill',
    schemaVersion: 'recipe_template_fill/v1',
    templateId: 'content-campaign-planner',
    title: 'Content / campaign planner',
    subtitle: 'Ideas, drafts, schedule, and email',
    summary: 'Keep campaign ideas structured, expand them into markdown, and generate email drafts without losing per-idea notes.',
    sections: [
      {
        slotId: 'hero',
        kind: 'hero',
        eyebrow: 'Campaign',
        title: 'Content planner',
        summary: 'A tabbed workflow for ideas, drafts, schedule, and campaign notes.',
        chips: [
          { label: '3 ideas', tone: 'accent' },
          { label: '1 email draft ready', tone: 'success' }
        ],
        actions: []
      },
      {
        slotId: 'campaign-tabs',
        kind: 'tabs',
        title: 'Campaign workflow',
        tabs: [
          { id: 'ideas', label: 'Ideas', badge: '3' },
          { id: 'drafts', label: 'Drafts' },
          { id: 'schedule', label: 'Schedule' },
          { id: 'notes', label: 'Notes' }
        ],
        activeTabId: 'ideas',
        panes: {
          ideas: [
            {
              slotId: 'idea-cards',
              kind: 'card-grid',
              title: 'Ideas',
              columns: 2,
              cards: [
                {
                  id: 'idea-beta-launch',
                  title: 'Beta launch story',
                  subtitle: 'Half-formed narrative',
                  chips: [
                    { label: 'Idea', tone: 'accent' },
                    { label: 'Needs expansion', tone: 'warning' }
                  ],
                  bullets: ['Lead with product problem', 'Add two customer outcomes'],
                  footer: 'Per-idea notes should stay attached on update.',
                  actions: [
                    {
                      kind: 'existing_action',
                      actionId: 'flesh-out-idea',
                      selectedItemIds: ['idea-beta-launch']
                    },
                    {
                      kind: 'existing_action',
                      actionId: 'write-campaign-email',
                      selectedItemIds: ['idea-beta-launch']
                    }
                  ]
                }
              ]
            }
          ],
          drafts: [
            {
              slotId: 'draft-notes',
              kind: 'notes',
              title: 'Drafts',
              lines: ['Expanded drafts should be appended as markdown instead of replacing the idea list.'],
              actions: []
            }
          ],
          schedule: [
            {
              slotId: 'campaign-schedule',
              kind: 'timeline',
              title: 'Schedule',
              items: [
                {
                  id: 'schedule-email',
                  title: 'Launch email draft',
                  time: 'Tuesday · 10:00 AM',
                  summary: 'Prepare the first campaign email after the idea is fleshed out.',
                  chips: [{ label: 'Email', tone: 'accent' }],
                  actions: []
                }
              ]
            }
          ],
          notes: [
            {
              slotId: 'campaign-notes',
              kind: 'notes',
              title: 'Campaign notes',
              lines: ['Keep idea-specific notes instead of collapsing them into one generic summary.'],
              actions: [
                {
                  kind: 'existing_action',
                  actionId: 'append-template-note',
                  selectedItemIds: []
                }
              ]
            }
          ]
        }
      }
    ],
    metadata: {
      fixture: true
    }
  };
}

function createLocalDiscoveryTemplateFillArtifact() {
  return {
    kind: 'recipe_template_fill',
    schemaVersion: 'recipe_template_fill/v1',
    templateId: 'local-discovery-comparison',
    title: 'Local discovery shortlist',
    subtitle: 'Potential venues and local fits',
    summary: 'Compare places nearby, save the best fit, and convert the recipe into event planning if the intent shifts.',
    sections: [
      {
        slotId: 'hero',
        kind: 'hero',
        eyebrow: 'Local discovery',
        title: 'Venue and place comparison',
        summary: 'Review strong local options, then convert the recipe when the intent shifts into planning.',
        chips: [
          { label: '3 places', tone: 'accent' },
          { label: 'Planning-ready', tone: 'success' }
        ],
        actions: []
      },
      {
        slotId: 'filters',
        kind: 'filter-strip',
        title: 'Filters',
        filters: [
          { label: 'Indoor', tone: 'neutral' },
          { label: 'Parking', tone: 'accent' }
        ],
        sortLabel: 'Sort: Best fit'
      },
      {
        slotId: 'results',
        kind: 'split',
        ratio: 'list-detail',
        left: [
          {
            slotId: 'result-list',
            kind: 'grouped-list',
            title: 'Places',
            groups: [
              {
                id: 'top-matches',
                label: 'Top matches',
                tone: 'accent',
                items: [
                  {
                    id: 'venue-dana',
                    title: 'Dana Hall',
                    subtitle: 'Historic venue',
                    meta: 'Downtown Dayton',
                    chips: [
                      { label: 'Indoor', tone: 'accent' },
                      { label: 'Available', tone: 'success' }
                    ],
                    actions: [
                      {
                        kind: 'existing_action',
                        actionId: 'save-place',
                        selectedItemIds: ['venue-dana']
                      },
                      {
                        kind: 'existing_action',
                        actionId: 'switch-to-event-planner',
                        selectedItemIds: ['venue-dana']
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        right: [
          {
            slotId: 'result-detail',
            kind: 'detail-panel',
            title: 'Selected place',
            summary: 'Dana Hall is the strongest fit for a compact event recipe and a later switch into planning.',
            chips: [
              { label: 'Historic', tone: 'accent' },
              { label: 'Parking nearby', tone: 'neutral' },
              { label: 'Saveable', tone: 'success' }
            ],
            fields: [
              {
                label: 'Website and contact',
                value: undefined,
                chips: [],
                bullets: [
                  'Website: example.com/dana-hall',
                  'Contact: events@example.com',
                  'Phone: (937) 555-0182'
                ],
                links: [
                  {
                    label: 'Website',
                    href: 'https://example.com/dana-hall'
                  },
                  {
                    label: 'Email',
                    href: 'mailto:events@example.com'
                  }
                ],
                fullWidth: true
              },
              {
                label: 'Why it fits',
                value: 'Central location, manageable size, and a clean handoff into an Event Planner recipe if the user starts confirming guests and logistics.',
                chips: [],
                bullets: [],
                links: [],
                fullWidth: true
              }
            ],
            actions: [
              {
                kind: 'existing_action',
                actionId: 'save-place',
                selectedItemIds: ['venue-dana']
              },
              {
                kind: 'existing_action',
                actionId: 'switch-to-event-planner',
                selectedItemIds: ['venue-dana']
              }
            ],
            note: 'Contact links should open directly. Save place and convert remain explicit recipe actions.',
            noteTitle: 'Interaction model'
          }
        ]
      }
    ],
    metadata: {
      fixture: true
    }
  };
}

function createRecipeTemplateFillArtifact(prompt) {
  const templateId = inferTemplateIdFromPrompt(prompt);
  let artifact;

  switch (templateId) {
    case 'inbox-triage-board':
      artifact = createInboxTriageTemplateFillArtifact();
      break;
    case 'restaurant-finder':
      artifact = createRestaurantFinderTemplateFillArtifact();
      break;
    case 'research-notebook':
      artifact = createResearchNotebookTemplateFillArtifact();
      break;
    case 'vendor-evaluation-matrix':
      artifact = createVendorEvaluationTemplateFillArtifact();
      break;
    case 'travel-itinerary-planner':
      artifact = createTravelItineraryPlannerTemplateFillArtifact();
      break;
    case 'event-planner':
      artifact = createEventPlannerTemplateFillArtifact();
      break;
    case 'job-search-pipeline':
      artifact = createJobSearchPipelineTemplateFillArtifact();
      break;
    case 'content-campaign-planner':
      artifact = createContentCampaignPlannerTemplateFillArtifact();
      break;
    case 'local-discovery-comparison':
      artifact = createLocalDiscoveryTemplateFillArtifact();
      break;
    case 'hotel-shortlist':
    default:
      artifact = createHotelShortlistTemplateFillArtifact();
      break;
  }

  return JSON.stringify(convertLegacyTemplateFillArtifact(artifact));
}

function createRecipeTemplateHydrationArtifactResponse(prompt) {
  const fillArtifact = JSON.parse(createRecipeTemplateFillArtifact(prompt));
  return JSON.stringify({
    ...fillArtifact,
    kind: 'recipe_template_hydration',
    schemaVersion: 'recipe_template_hydration/v1'
  });
}

function createRefinedStructuredArtifactEnvelope() {
  return {
    schemaVersion: 'hermes_space_seed/v1',
    recipe: {
      title: 'Hotel Ardent focus',
      subtitle: 'Focused shortlist',
      description: 'Refined recipe action result',
      status: 'active'
    },
    rawData: {
      kind: 'raw_data',
      schemaVersion: 'recipe_raw_data/v1',
      payload: {
        hotels: [
          {
            id: 'hotel-ardent',
            name: 'Hotel Ardent',
            location: 'Downtown Dayton',
            price: '$210',
            website: 'https://example.com/hotel-ardent'
          }
        ]
      },
      links: [
        {
          label: 'Hotel Ardent',
          url: 'https://example.com/hotel-ardent',
          kind: 'website'
        }
      ],
      paginationHints: [],
      metadata: {
        source: 'fixture-refine-action'
      }
    },
    assistantContext: {
      kind: 'assistant_context',
      schemaVersion: 'recipe_assistant_context/v1',
      summary: 'Focused the shortlist on Hotel Ardent.',
      responseLead: 'Focused the shortlist on Hotel Ardent.',
      responseTail: 'The Home recipe can now center on the selected hotel.',
      links: [],
      citations: [],
      metadata: {
        action: 'refine-selection'
      }
    }
  };
}

function createFixtureRecipeOperation(spaceKind) {
  if (spaceKind === 'table') {
    return {
      confirmation: 'Created a random numbers recipe for this request.',
      operation: {
        type: 'create_space',
        title: 'Random numbers',
        description: 'Fixture-created random number table',
        viewType: 'table',
        status: 'active',
        data: {
          columns: [
            {
              id: 'value',
              label: 'Value',
              emphasis: 'primary'
            }
          ],
          rows: [
            { value: 4 },
            { value: 7 }
          ],
          emptyMessage: 'No rows yet.'
        },
        metadata: {
          changeSummary: 'Created a random number table',
          auditTags: ['fixture', 'table']
        },
        linkCurrentChat: true
      }
    };
  }

  if (spaceKind === 'markdown') {
    return {
      confirmation: 'Created a research notes recipe for this request.',
      operation: {
        type: 'create_space',
        title: 'Research notes',
        description: 'Fixture-created markdown notes',
        viewType: 'markdown',
        status: 'active',
        data: {
          markdown: '## Research notes\n\n- Capture the initial findings'
        },
        metadata: {
          changeSummary: 'Created initial markdown notes',
          auditTags: ['fixture', 'markdown']
        },
        linkCurrentChat: true
      }
    };
  }

  return {
    confirmation: 'Created a launch tracker recipe for this request.',
    operation: {
      type: 'create_space',
      title: 'Launch tracker',
      description: 'Fixture-created launch tracker',
      viewType: 'card',
      status: 'active',
      data: {
        cards: [
          {
            id: 'launch-card-1',
            title: 'Ship the bridge',
            description: 'Fixture launch card',
            eyebrow: 'Q2',
            badges: ['active'],
            metadata: [
              {
                label: 'Owner',
                value: 'Hermes'
              },
              {
                label: 'Spec',
                value: 'Launch brief',
                link: {
                  label: 'Launch brief',
                  url: 'https://example.com/launch-brief',
                  kind: 'website'
                }
              }
            ],
            links: [
              {
                label: 'Launch brief',
                url: 'https://example.com/launch-brief',
                kind: 'website'
              }
            ],
            image: {
              url: 'https://images.example.com/launch-brief.jpg',
              alt: 'Launch brief cover'
            }
          }
        ],
        emptyMessage: 'No cards yet.'
      },
      metadata: {
        changeSummary: 'Created initial launch tracker',
        auditTags: ['fixture', 'card']
      },
      linkCurrentChat: true
    }
  };
}

function extractStructuredPromptSection(prompt, label, nextLabels = []) {
  const startToken = `${label}:\n`;
  const startIndex = prompt.indexOf(startToken);
  if (startIndex < 0) {
    return '';
  }

  const remainder = prompt.slice(startIndex + startToken.length);
  let endIndex = remainder.length;
  for (const nextLabel of nextLabels) {
    const candidateIndex = remainder.indexOf(`\n\n${nextLabel}:\n`);
    if (candidateIndex >= 0) {
      endIndex = Math.min(endIndex, candidateIndex);
    }
  }

  return remainder.slice(0, endIndex).trim();
}

function structuredFieldKey(label) {
  const normalized = String(label || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || 'value';
}

function toStructuredPreferredPresentation(viewType) {
  if (viewType === 'table') {
    return 'table';
  }

  if (viewType === 'markdown') {
    return 'markdown';
  }

  return 'cards';
}

function createStructuredArtifactEnvelope({
  title,
  description,
  preferredPresentation,
  payload,
  summary,
  category,
  label,
  links = [],
  allowOutboundRequests = true
}) {
  const primaryCollection = Object.values(payload).find((value) => Array.isArray(value));
  const totalItems = Array.isArray(primaryCollection) ? primaryCollection.length : 0;

  return {
    schemaVersion: 'hermes_space_data/v1',
    recipe: {
      title,
      description,
      status: 'active',
      preferredPresentation
    },
    rawData: {
      kind: 'raw_data',
      schemaVersion: 'recipe_raw_data/v1',
      payload,
      links,
      paginationHints: [
        {
          datasetId: 'primary',
          pageSize: Math.max(1, Math.min(6, totalItems || 1)),
          totalItems,
          hasMore: false
        }
      ],
      metadata: {}
    },
    assistantContext: {
      kind: 'assistant_context',
      schemaVersion: 'recipe_assistant_context/v1',
      summary,
      responseLead: summary,
      responseTail: 'Use the attached recipe for the structured view.',
      links,
      citations: [],
      metadata: {}
    },
    intentHints: {
      category,
      label,
      summary,
      preferredPresentation,
      allowOutboundRequests,
      destructiveIntent: false
    }
  };
}

function createStructuredArtifactFromOperation(operation, options = {}) {
  const preferredPresentation = toStructuredPreferredPresentation(operation.viewType);
  const category =
    options.category ??
    (preferredPresentation === 'table'
      ? 'results'
      : preferredPresentation === 'markdown'
        ? 'research'
        : 'results');
  const label =
    options.label ??
    (preferredPresentation === 'table'
      ? 'recipe table'
      : preferredPresentation === 'markdown'
        ? 'recipe notes'
        : 'recipe shortlist');
  const summary =
    options.summary ??
    operation.description ??
    `Fixture structured artifact for ${operation.title}.`;

  if (operation.viewType === 'table') {
    const rows = Array.isArray(operation.data?.rows)
      ? operation.data.rows.map((row, index) => ({
          id: row.id ?? `row-${index + 1}`,
          ...row
        }))
      : [];

    return createStructuredArtifactEnvelope({
      title: operation.title,
      description: operation.description,
      preferredPresentation,
      payload: {
        rows
      },
      summary,
      category,
      label
    });
  }

  if (operation.viewType === 'markdown') {
    const markdown = typeof operation.data?.markdown === 'string' ? operation.data.markdown : `## ${operation.title}`;
    return createStructuredArtifactEnvelope({
      title: operation.title,
      description: operation.description,
      preferredPresentation,
      payload: {
        notes: [
          {
            id: 'note-1',
            title: operation.title,
            markdown
          }
        ]
      },
      summary,
      category,
      label
    });
  }

  const cards = Array.isArray(operation.data?.cards) ? operation.data.cards : [];
  const links = cards.flatMap((card) => (Array.isArray(card.links) ? card.links : [])).filter(Boolean);
  const items = cards.map((card, index) => {
    const metadataFields = Array.isArray(card.metadata)
      ? Object.fromEntries(card.metadata.map((item) => [structuredFieldKey(item.label), item.value]))
      : {};
    return {
      id: card.id ?? `item-${index + 1}`,
      title: card.title ?? `Item ${index + 1}`,
      subtitle: card.eyebrow,
      description: card.description,
      badges: Array.isArray(card.badges) ? card.badges : [],
      ...metadataFields
    };
  });

  return createStructuredArtifactEnvelope({
    title: operation.title,
    description: operation.description,
    preferredPresentation,
    payload: {
      items
    },
    summary,
    category,
    label,
    links
  });
}

function createAutoStructuredRecipeOperation(kind, userRequest) {
  const normalizedRequest = String(userRequest || '').trim();
  const conversationalRequest =
    normalizedRequest.length > 0 ? normalizedRequest.charAt(0).toUpperCase() + normalizedRequest.slice(1) : 'this request';

  if (kind === 'restaurant') {
    return {
      confirmation: `I organized ${conversationalRequest} into an attached shortlist recipe.`,
      operation: {
        type: 'create_space',
        title: 'Italian restaurants near Dayton',
        description: 'Fixture-created local shortlist',
        viewType: 'card',
        status: 'active',
        data: {
          cards: [
            {
              id: 'place-1',
              title: 'Mamma Disalvo’s',
              description: 'Classic Italian spot in Kettering',
              eyebrow: 'Dayton area',
              badges: ['verified'],
              metadata: [
                {
                  label: 'Why',
                  value: 'Strong local reputation'
                },
                {
                  label: 'Website',
                  value: 'mammadisalvos.com',
                  link: {
                    label: 'Official site',
                    url: 'https://mammadisalvos.com',
                    kind: 'website'
                  }
                }
              ],
              links: [
                {
                  label: 'Official site',
                  url: 'https://mammadisalvos.com',
                  kind: 'website'
                },
                {
                  label: 'Menu',
                  url: 'https://mammadisalvos.com/menu',
                  kind: 'menu'
                },
                {
                  label: 'Directions',
                  url: 'https://maps.google.com/?q=Mamma+Disalvos+Dayton',
                  kind: 'map'
                }
              ],
              image: {
                url: 'https://images.example.com/mamma-disalvos.jpg',
                alt: 'Mamma Disalvo exterior'
              }
            },
            {
              id: 'place-2',
              title: 'Roost Italian',
              description: 'Downtown option with a shorter list',
              eyebrow: 'Dayton area',
              badges: ['shortlist'],
              metadata: [
                {
                  label: 'Why',
                  value: 'Good fit for dinner near downtown'
                },
                {
                  label: 'Booking',
                  value: 'Reserve a table',
                  link: {
                    label: 'Reserve a table',
                    url: 'https://www.opentable.com/r/roost-italian-dayton',
                    kind: 'booking'
                  }
                }
              ],
              links: [
                {
                  label: 'Reserve',
                  url: 'https://www.opentable.com/r/roost-italian-dayton',
                  kind: 'booking'
                },
                {
                  label: 'Listing',
                  url: 'https://www.yelp.com/biz/roost-italian-dayton',
                  kind: 'place'
                }
              ],
              image: {
                url: 'https://images.example.com/roost-italian.jpg',
                alt: 'Roost Italian dining room'
              }
            }
          ],
          emptyMessage: 'No cards yet.'
        },
        metadata: {
          changeSummary: 'Created nearby shortlist',
          auditTags: ['fixture', 'places']
        },
        linkCurrentChat: true
      }
    };
  }

  if (kind === 'places') {
    return {
      confirmation: `I organized ${conversationalRequest} into an attached local discovery shortlist.`,
      operation: {
        type: 'create_space',
        title: 'Local discovery near Dayton',
        description: 'Fixture-created local discovery shortlist',
        viewType: 'card',
        status: 'active',
        data: {
          cards: [
            {
              id: 'place-1',
              title: 'Dana Hall',
              description: 'Downtown Dayton historic landmark, available for group bookings',
              eyebrow: 'Dayton area',
              badges: ['top-match'],
              metadata: [{ label: 'Type', value: 'Gathering space' }],
              links: [{ label: 'Website', url: 'https://example.com/dana-hall', kind: 'website' }]
            }
          ]
        },
        metadata: {
          changeSummary: 'Created local discovery shortlist',
          auditTags: ['fixture', 'places']
        },
        linkCurrentChat: true
      }
    };
  }

  if (kind === 'plan') {
    return {
      confirmation: 'Created a project plan recipe for this request.',
      operation: {
        type: 'create_space',
        title: 'Project plan',
        description: 'Fixture-created phased plan',
        viewType: 'table',
        status: 'active',
        data: {
          columns: [
            { id: 'phase', label: 'Phase', emphasis: 'primary' },
            { id: 'owner', label: 'Owner', emphasis: 'none' }
          ],
          rows: [
            { phase: 'Define scope', owner: 'Hermes' },
            { phase: 'Ship first milestone', owner: 'Hermes' }
          ],
          emptyMessage: 'No rows yet.'
        },
        metadata: {
          changeSummary: 'Created project plan',
          auditTags: ['fixture', 'plan']
        },
        linkCurrentChat: true
      }
    };
  }

  if (kind === 'finance') {
    return {
      confirmation: 'Created a financial breakdown recipe for this request.',
      operation: {
        type: 'create_space',
        title: 'Budget breakdown',
        description: 'Fixture-created line items',
        viewType: 'table',
        status: 'active',
        data: {
          columns: [
            { id: 'category', label: 'Category', emphasis: 'primary' },
            { id: 'amount', label: 'Amount', emphasis: 'none' }
          ],
          rows: [
            { category: 'Lodging', amount: '$420' },
            { category: 'Meals', amount: '$160' }
          ],
          emptyMessage: 'No rows yet.'
        },
        metadata: {
          changeSummary: 'Created budget line items',
          auditTags: ['fixture', 'finance']
        },
        linkCurrentChat: true
      }
    };
  }

  if (kind === 'research') {
    return {
      confirmation: 'Created a research summary recipe for this request.',
      operation: {
        type: 'create_space',
        title: 'Research summary',
        description: 'Fixture-created research notes',
        viewType: 'markdown',
        status: 'active',
        data: {
          markdown:
            '## Research summary\n\n- **Primary signal** — Highlights the leading option clearly.\n  - Source: [Fixture dataset](https://example.com/research/fixture-dataset)\n  - Website: [Official notes](https://example.com/research/notes)\n  - Contact: research@example.com'
        },
        metadata: {
          changeSummary: 'Created structured research summary',
          auditTags: ['fixture', 'research']
        },
        linkCurrentChat: true
      }
    };
  }

  return {
    confirmation: 'Created a structured shortlist recipe for this request.',
    operation: {
      type: 'create_space',
      title: 'Structured shortlist',
      description: 'Fixture-created comparison shortlist',
      viewType: 'card',
      status: 'active',
      data: {
        cards: [
          {
            id: 'result-1',
            title: 'Option A',
            description: 'Best overall match',
            eyebrow: 'Shortlist',
            badges: ['recommended'],
            metadata: [
              {
                label: 'Reason',
                value: 'Strong balance of fit and price'
              }
            ],
            links: [
              {
                label: 'Details',
                url: 'https://example.com/options/a',
                kind: 'website'
              }
            ],
            image: {
              url: 'https://images.example.com/option-a.jpg',
              alt: 'Option A product photo'
            }
          }
        ],
        emptyMessage: 'No cards yet.'
      },
      metadata: {
        changeSummary: 'Created comparison shortlist',
        auditTags: ['fixture', 'results']
      },
      linkCurrentChat: true
    }
  };
}

function getStructuredIntentMetadataForKind(kind) {
  if (kind === 'restaurant' || kind === 'places') {
    return {
      category: 'places',
      label: 'nearby shortlist'
    };
  }

  if (kind === 'plan') {
    return {
      category: 'plan',
      label: 'project plan'
    };
  }

  if (kind === 'finance') {
    return {
      category: 'finance',
      label: 'financial breakdown'
    };
  }

  if (kind === 'research') {
    return {
      category: 'research',
      label: 'research summary'
    };
  }

  return {
    category: 'results',
    label: 'structured result set'
  };
}

async function runChat(args) {
  if (shouldFail('chat')) {
    process.stderr.write('Fixture failed to chat.\n');
    process.exit(1);
  }

  const state = loadState();
  const activeProfile = getProfile(state);
  const resumeIndex = args.indexOf('--resume');
  const runtimeSessionId = resumeIndex >= 0 ? args[resumeIndex + 1] : undefined;
  const promptIndex = args.lastIndexOf('-q');
  const prompt = promptIndex >= 0 ? args[promptIndex + 1] : 'Fixture Hermes chat';
  const maxTurnsIndex = args.indexOf('--max-turns');
  const maxTurns = maxTurnsIndex >= 0 ? Number(args[maxTurnsIndex + 1]) : Number.POSITIVE_INFINITY;
  const unrestrictedAccessEnabled = args.includes('--yolo');
  const skillArgs = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '-s' || args[index] === '--skill') {
      skillArgs.push(args[index + 1]);
    }
  }
  const describedRequest = String(prompt).trim() || 'Fixture Hermes chat';
  const structuredArtifactOnly =
    /dedicated bridge-managed structured artifact generation step|Emit only the structured Hermes recipe artifact/i.test(describedRequest);
  const recipeDslStage =
    /dedicated bridge-managed recipe DSL generation step/i.test(describedRequest)
      ? 'generate'
      : /dedicated bridge-managed recipe DSL repair step/i.test(describedRequest)
        ? 'repair'
        : null;
  const recipeTemplateStage =
    /dedicated bridge-managed recipe template select step/i.test(describedRequest)
      ? 'select'
      : /generate the staged text\/content artifact for the selected approved recipe template/i.test(describedRequest)
        ? 'text'
        : /generate the staged hydration artifact for the selected approved recipe template/i.test(describedRequest)
          ? 'hydrate'
        : /generate the staged actions\/buttons artifact for the selected approved recipe template/i.test(describedRequest)
          ? 'actions'
          : /repair the invalid staged recipe template text\/content artifact/i.test(describedRequest)
            ? 'text_repair'
            : /repair the invalid staged recipe template actions\/buttons artifact/i.test(describedRequest)
              ? 'actions_repair'
              : null;
  const recipeAppletStage =
    /dedicated bridge-managed recipe applet source generation step/i.test(describedRequest)
      ? 'source'
      : /dedicated bridge-managed recipe applet repair step/i.test(describedRequest)
        ? 'repair'
        : null;
  const isArtifactOnlyRequest = structuredArtifactOnly || recipeDslStage || recipeTemplateStage || recipeAppletStage;
  if (recipeAppletStage) {
    process.stderr.write('Experimental recipe applet generation is disabled in DSL-only production fixture mode.\n');
    process.exit(1);
  }
  const structuredOriginalPrompt = extractStructuredPromptSection(describedRequest, 'Original user prompt', [
    'Recent assistant answer',
    'Structured intent',
    'Current attached recipe'
  ]);
  const userRequest = (
    structuredArtifactOnly
      ? structuredOriginalPrompt
      : describedRequest.split(/\n\s*\n/u)[0]
  )?.trim() || describedRequest;
  const normalizedUserRequest = userRequest.toLowerCase();
  const isEmailIntent = /\b(email|gmail|inbox|mail|unread)\b/.test(normalizedUserRequest);
  const isRestaurantIntent = /\b(restaurant|restaurants|coffee|cafe|cafes|bar|bars)\b/.test(normalizedUserRequest);
  const isLocalSearchIntent = isRestaurantIntent || /\b(hotel|hotels|lodging|nearby|near me|around me|local places|venue)\b/.test(
    normalizedUserRequest
  );
  const isPlanIntent = /\b(project plan|action plan|roadmap|timeline|milestones?|launch plan|implementation plan|rollout plan)\b/.test(
    normalizedUserRequest
  );
  const isFinanceIntent = /\b(finance|financial|budget|budgets|expenses?|cost breakdown|line items?|portfolio|holdings|allocations?)\b/.test(
    normalizedUserRequest
  );
  const isResearchIntent = /\b(research|sources?|papers?|studies?|summary|summaries|tradeoffs?|pros and cons)\b/.test(normalizedUserRequest);
  const isShoppingIntent = /\b(compare|comparison|vs\\.?|options|shortlist|candidates|shopping|buy|buying|products?|purchase|purchasing)\b/.test(
    normalizedUserRequest
  );
  const wantsRecipeCreate = /\b(create|build|make)\b.*\b(recipe|recipe)\b/.test(normalizedUserRequest);
  const wantsRecipeUpdate = /\b(update|refresh|revise)\b.*\b(recipe|recipe)\b/.test(normalizedUserRequest);
  const wantsRecipeDelete = /\b(delete|remove)\b.*\b(recipe|recipe)\b/.test(normalizedUserRequest);
  const wantsRecipeMixedProse = /\b(mixed prose|extra prose)\b.*\b(recipe|recipe)\b/.test(normalizedUserRequest);
  const wantsRecipeMalformed = /\b(malformed|broken)\b.*\b(recipe|recipe)\b/.test(normalizedUserRequest);
  const wantsRecipeRecovered = /\b(recovered|nested|inner payload|outer malformed)\b.*\b(recipe|recipe)\b/.test(normalizedUserRequest);
  const wantsShellOnlyStructuredRecipe = /\b(shell[- ]only|empty structured recipe|shell recipe)\b/.test(normalizedUserRequest);
  const wantsTableRecipe = wantsRecipeCreate && /\btable\b/.test(normalizedUserRequest);
  const wantsMarkdownRecipe = wantsRecipeCreate && /\b(markdown|note|notes)\b/.test(normalizedUserRequest);
  const wantsCardRecipe =
    wantsRecipeCreate && !wantsTableRecipe && !wantsMarkdownRecipe && /\b(card|cards|tracker|board)\b/.test(normalizedUserRequest);
  const isRefineActionPrompt = /\brefine the (selected record|current recipe around the selected item)\b/.test(normalizedUserRequest);
  const fixtureRecipeKind = wantsTableRecipe ? 'table' : wantsMarkdownRecipe ? 'markdown' : wantsCardRecipe || wantsRecipeCreate ? 'card' : null;
  const autoStructuredRecipeRequested = /create exactly one attached recipe in this same request|update the current attached recipe/i.test(describedRequest);
  const autoStructuredRecipeKind = isLocalSearchIntent
    ? (isRestaurantIntent ? 'restaurant' : 'places')
    : isPlanIntent
      ? 'plan'
      : isFinanceIntent
        ? 'finance'
        : isResearchIntent
          ? 'research'
          : isShoppingIntent
            ? 'results'
            : null;
  const scopedToActiveProfile =
    /the active hermes profile is /i.test(describedRequest) && /do not inspect or use other hermes profiles/i.test(describedRequest);
  const usesGoogleRecipe =
    skillArgs.includes('google-workspace') || /google recipe is authenticated|authenticated google recipe integration/i.test(describedRequest);
  const googleRecipeHealthy = activeProfile.id === '8tn';
  const existingSession = runtimeSessionId ? findSessionById(state, runtimeSessionId) : undefined;
  const timestampIso = new Date().toISOString();
  const timestamp = Date.parse(timestampIso) / 1000;
  const session =
    existingSession ?? {
      id: runtimeSessionId ?? nextSessionId(state),
      preview: truncate(describedRequest, 48),
      source: 'cli',
      updatedAt: timestampIso,
      lastUsedProfileId: activeProfile.id,
      messages: []
    };

  if (!isArtifactOnlyRequest) {
    session.preview = truncate(userRequest, 48);
    session.updatedAt = timestampIso;
    session.lastUsedProfileId = activeProfile.id;
    pushMessage(session, 'user', userRequest, timestamp);
    state.sessions[session.id] = session;
    saveState(state);
  } else if (!existingSession) {
    state.sessions[session.id] = session;
    saveState(state);
  }

  if (shouldFail('task_timeout_email') && isEmailIntent && !isArtifactOnlyRequest) {
    process.stderr.write(`Hermes timed out while checking email for the active profile ${activeProfile.id}.\n`);
    process.exit(1);
  }

  if ((shouldFail('dsl_timeout') && recipeDslStage === 'generate') || (shouldFail('template_timeout') && recipeTemplateStage)) {
    await sleep(1_200);
    process.stderr.write(
      recipeTemplateStage ? 'Recipe template generation timed out after 90000ms.\n' : 'Recipe DSL generation timed out after 90000ms.\n'
    );
    process.exit(1);
  }

  if (
    (shouldFail('dsl_slow_success') && (structuredArtifactOnly || recipeDslStage === 'generate')) ||
    (shouldFail('template_slow_success') && recipeTemplateStage)
  ) {
    await sleep(1_200);
  }

  print('');
  print('Initializing agent...');
  await sleep(25);

  if (!isArtifactOnlyRequest && usesGoogleRecipe) {
    print('┊ 📚 preparing google-workspace…');
    await sleep(20);
    print('┊ 📚 skill google-workspace 0.2s [exit 0]');
    await sleep(20);
  }

  if (!isArtifactOnlyRequest && isEmailIntent) {
    print('┊ 📖 preparing read_file…');
    await sleep(20);
    print('┊ 📖 read ~/.hermes/skills/productivity/google-workspace/scripts/setup.py 0.2s');
    await sleep(20);
    print('┊ 🐍 preparing execute_code…');
    await sleep(20);
    print('┊ 🐍 exec active-profile auth preflight 0.2s');
    await sleep(20);
    print('┊ 📞 preparing gmail unread check…');
    await sleep(20);

    if (scopedToActiveProfile && googleRecipeHealthy) {
      print('📞 Tool gmail_unread_count');
      await sleep(20);
      print('✅ Tool gmail_unread_count');
      await sleep(20);
    } else if (scopedToActiveProfile && !googleRecipeHealthy) {
      print(`AUTH_SCOPE_MISMATCH: Google Recipe is not fully authenticated for ${activeProfile.id}.`);
      await sleep(20);
    } else {
      print('📞 Tool gmail_unread_count');
      await sleep(20);
      print('✅ Tool gmail_unread_count');
      await sleep(20);
    }
  }

  if (!structuredArtifactOnly && !recipeDslStage && !recipeAppletStage && isLocalSearchIntent) {
    print('┊ 📞 preparing local search…');
    await sleep(20);
    print(isRestaurantIntent
      ? '┊ 📞 tool nearby_restaurants_search 0.3s [exit 0]'
      : '┊ 📞 tool local_discovery_search 0.3s [exit 0]');
    await sleep(20);
  }

  if (
    !isArtifactOnlyRequest &&
    isEmailIntent &&
    !usesGoogleRecipe &&
    !unrestrictedAccessEnabled &&
    Number.isFinite(maxTurns) &&
    maxTurns <= 1
  ) {
    print('⚠️  Reached maximum iterations (1) before the task could be completed.');
    print('');
    print(`session_id: ${session.id}`);
    pushMessage(session, 'assistant', 'Unable to complete the email request within the restricted turn limit.', timestamp + 0.001);
    state.sessions[session.id] = session;
    saveState(state);
    return;
  }

  print('╭─ ⚕ Hermes ─────────────────────────────────────────────────────────────────────────────╮');
  const fixtureRecipeOperation = fixtureRecipeKind ? createFixtureRecipeOperation(fixtureRecipeKind) : null;
  const autoStructuredRecipeOperation =
    autoStructuredRecipeRequested && !fixtureRecipeOperation && autoStructuredRecipeKind
      ? wantsShellOnlyStructuredRecipe
        ? {
            confirmation: 'I created a shell recipe for this request.',
            operation: {
              type: 'create_space',
              title: 'Shell recipe',
              description: 'Fixture-created incomplete shell',
              viewType: autoStructuredRecipeKind === 'research' ? 'markdown' : 'card',
              status: 'active',
              data: autoStructuredRecipeKind === 'research' ? { markdown: '' } : { cards: [] },
              metadata: {
                changeSummary: 'Created empty shell',
                auditTags: ['fixture', 'shell-only']
              },
              linkCurrentChat: true
            }
          }
        : createAutoStructuredRecipeOperation(autoStructuredRecipeKind, userRequest)
      : null;
  const structuredArtifactEnvelope =
    wantsRecipeMalformed || wantsShellOnlyStructuredRecipe
      ? null
      : isRefineActionPrompt
        ? createRefinedStructuredArtifactEnvelope()
      : wantsRecipeMixedProse
        ? createStructuredArtifactFromOperation(
            {
              type: 'create_space',
              title: 'Mixed prose tracker',
              description: 'Fixture-created tracker with extra prose in the fenced block',
              viewType: 'markdown',
              status: 'active',
              data: {
                markdown: '## Mixed prose tracker'
              },
              metadata: {
                changeSummary: 'Created from a mixed prose block',
                auditTags: ['fixture', 'mixed-prose']
              },
              linkCurrentChat: true
            },
            {
              summary: 'Created a mixed prose tracker for this request.'
            }
          )
      : fixtureRecipeOperation
        ? createStructuredArtifactFromOperation(fixtureRecipeOperation.operation, {
            summary: fixtureRecipeOperation.confirmation
          })
        : autoStructuredRecipeKind
          ? (() => {
              const autoOperation = createAutoStructuredRecipeOperation(autoStructuredRecipeKind, userRequest);
              const intentMetadata = getStructuredIntentMetadataForKind(autoStructuredRecipeKind);
              return createStructuredArtifactFromOperation(autoOperation.operation, {
                category: intentMetadata.category,
                label: intentMetadata.label,
                summary: autoOperation.confirmation
              });
            })()
          : null;
  const assistantReply =
    recipeTemplateStage
      ? (
          recipeTemplateStage === 'select' && shouldFail('template_selection_invalid') ||
          recipeTemplateStage === 'text' &&
            (
              shouldFail('template_fill_invalid') ||
              shouldFailRecipeTemplateBuildAttempts('template_fill_invalid_first_build', recipeTemplateStage, 3, ['text', 'hydrate']) ||
              shouldFail('dsl_invalid') ||
              shouldFailRecipeTemplateBuildOnce('template_fill_invalid_once', recipeTemplateStage) ||
              shouldFailRecipeTemplateBuildOnce('dsl_invalid_once', recipeTemplateStage)
            ) ||
          recipeTemplateStage === 'hydrate' &&
            (
              shouldFail('template_fill_invalid') ||
              shouldFailRecipeTemplateBuildAttempts('template_fill_invalid_first_build', recipeTemplateStage, 3, ['text', 'hydrate']) ||
              shouldFail('dsl_invalid') ||
              shouldFailRecipeTemplateBuildOnce('template_fill_invalid_once', recipeTemplateStage) ||
              shouldFailRecipeTemplateBuildOnce('dsl_invalid_once', recipeTemplateStage)
            ) ||
          recipeTemplateStage === 'actions' && shouldFail('template_update_invalid') ||
          recipeTemplateStage === 'text_repair' &&
            (
              shouldFail('template_repair_invalid') ||
              shouldFailRecipeTemplateBuildAttempts('template_repair_invalid_first_build', recipeTemplateStage, 3, ['text_repair']) ||
              shouldFailRecipeTemplateBuildOnce('template_repair_invalid_once', recipeTemplateStage)
            )
        )
        ? '{}'
        : recipeTemplateStage === 'select'
          ? createRecipeTemplateSelectionArtifact(describedRequest)
          : recipeTemplateStage === 'text'
            ? createRecipeTemplateFillArtifact(describedRequest)
            : recipeTemplateStage === 'hydrate'
              ? createRecipeTemplateHydrationArtifactResponse(describedRequest)
            : recipeTemplateStage === 'actions'
              ? createRecipeTemplateFillArtifact(describedRequest)
              : recipeTemplateStage === 'text_repair'
                ? createRecipeTemplateFillArtifact(describedRequest)
                : createRecipeTemplateFillArtifact(describedRequest)
    : recipeDslStage
      ? shouldFail('dsl_invalid') || shouldFailRecipeDslBuildOnce('dsl_invalid_once', recipeDslStage)
        ? '{}'
        : JSON.stringify(createRecipeDslArtifact(describedRequest, userRequest))
    : structuredArtifactOnly
      ? wantsRecipeMalformed || wantsShellOnlyStructuredRecipe
        ? '```hermes-recipe-data\n'
        : structuredArtifactEnvelope
          ? JSON.stringify(structuredArtifactEnvelope)
          : ''
    : isEmailIntent && scopedToActiveProfile && !googleRecipeHealthy
      ? `Google Recipe is not fully authenticated for ${activeProfile.id}. Minimum next step: re-run the Google Recipe setup for ${activeProfile.id} and try again.`
      : isEmailIntent && usesGoogleRecipe && !scopedToActiveProfile && activeProfile.id === 'jbarton'
        ? 'Unread email is available via Google Recipe on profile 8tn.\n\nCurrent unread count I checked: 1'
        : isRefineActionPrompt
          ? 'Focused the shortlist on Hotel Ardent.'
        : wantsRecipeRecovered && fixtureRecipeOperation
          ? createRecoveredRecipeReply(fixtureRecipeOperation.confirmation, fixtureRecipeOperation.operation, {
              innerFence: fixtureRecipeKind === 'card' ? 'json' : 'hermes-ui-recipes',
              trailingProse: 'Created it successfully.'
            })
        : wantsRecipeMixedProse
            ? createRecipeReply(
                wantsTableRecipe || wantsMarkdownRecipe || wantsCardRecipe
                  ? (fixtureRecipeOperation?.confirmation ?? 'Created a mixed prose tracker for this request.')
                  : 'Created a mixed prose tracker for this request.',
                wantsTableRecipe || wantsMarkdownRecipe || wantsCardRecipe
                  ? (fixtureRecipeOperation?.operation ?? {
                      type: 'create_space',
                      title: 'Mixed prose tracker',
                      description: 'Fixture-created tracker with extra prose in the fenced block',
                      viewType: 'markdown',
                      status: 'active',
                      data: {
                        markdown: '## Mixed prose tracker'
                      },
                      metadata: {
                        changeSummary: 'Created from a mixed prose block',
                        auditTags: ['fixture', 'mixed-prose']
                      },
                      linkCurrentChat: true
                    })
                  : {
                  type: 'create_space',
                  title: 'Mixed prose tracker',
                  description: 'Fixture-created tracker with extra prose in the fenced block',
                  viewType: 'markdown',
                  status: 'active',
                  data: {
                    markdown: '## Mixed prose tracker'
                  },
                  metadata: {
                    changeSummary: 'Created from a mixed prose block',
                    auditTags: ['fixture', 'mixed-prose']
                  },
                  linkCurrentChat: true
                },
                {
                  leadingProse: 'Created a recipe and included the structured payload below.'
                }
              )
            : wantsRecipeMalformed
            ? `Tried to create a malformed recipe block.

\`\`\`hermes-ui-recipes
Done — I created the recipe.
This is not valid JSON.
\`\`\``
          : wantsRecipeCreate && fixtureRecipeOperation
            ? createRecipeReply(fixtureRecipeOperation.confirmation, fixtureRecipeOperation.operation)
          : autoStructuredRecipeOperation
            ? createRecipeReply(autoStructuredRecipeOperation.confirmation, autoStructuredRecipeOperation.operation)
          : wantsRecipeUpdate
            ? `Updated the current recipe with fixture data.

\`\`\`hermes-ui-recipes
${JSON.stringify({
  operations: [
    {
      type: 'update_space',
      target: 'current',
      status: 'changed',
      data: {
        cards: [
          {
            id: 'launch-card-1',
            title: 'Ship the bridge',
            description: 'Fixture launch card',
            eyebrow: 'Q2',
            badges: ['active'],
            metadata: [
              {
                label: 'Owner',
                value: 'Hermes'
              }
            ]
          },
          {
            id: 'launch-card-2',
            title: 'Verify spaces',
            description: 'Fixture update card',
            eyebrow: 'Q2',
            badges: ['changed'],
            metadata: [
              {
                label: 'Status',
                value: 'Updated'
              }
            ]
          }
        ],
        emptyMessage: 'No cards yet.'
      },
      metadata: {
        changeSummary: 'Added verification card',
        auditTags: ['fixture', 'updated']
      },
      linkCurrentChat: true
    }
  ]
})}
\`\`\``
            : wantsRecipeDelete
              ? `Deleted the current recipe.

\`\`\`hermes-ui-recipes
${JSON.stringify({
  operations: [
    {
      type: 'delete_space',
      target: 'current'
    }
  ]
})}
\`\`\``
        : isLocalSearchIntent
          ? 'Here are 3 good Italian restaurants near Dayton, OH: Mamma Disalvo\'s, Roost Italian, and Jimmy’s Italian Kitchen.'
        : isEmailIntent && usesGoogleRecipe
          ? `You have 1 unread email in ${activeProfile.id}.`
          : unrestrictedAccessEnabled
            ? `Fixture unrestricted Hermes reply for ${activeProfile.id}: ${describedRequest}`
            : `Fixture Hermes reply for ${activeProfile.id}: ${describedRequest}`;
  process.stdout.write(assistantReply);
  await sleep(25);
  process.stdout.write('\n');
  await sleep(25);
  print('');
  print(`session_id: ${session.id}`);

  if (!isArtifactOnlyRequest) {
    pushMessage(session, 'assistant', assistantReply, timestamp + 0.001);
  }
  state.sessions[session.id] = session;
  saveState(state);
}

const args = process.argv.slice(2);

if (args.includes('--version')) {
  process.stdout.write('Hermes Agent v0.9.0 (2026.4.13)\n');
  process.exit(0);
}

const [command, subcommand, ...rest] = args;

if (command === 'profile' && subcommand === 'list') {
  listProfiles();
  process.exit(0);
}

if (command === 'profile' && subcommand === 'show') {
  showProfile(rest[0]);
  process.exit(0);
}

if (command === 'sessions' && subcommand === 'list') {
  const limitIndex = rest.indexOf('--limit');
  const limit = limitIndex >= 0 ? Number(rest[limitIndex + 1]) : 200;
  listSessions(limit);
  process.exit(0);
}

if (command === 'sessions' && subcommand === 'export') {
  const idIndex = rest.indexOf('--session-id');
  exportSession(rest[idIndex + 1]);
  process.exit(0);
}

if (command === 'sessions' && subcommand === 'rename') {
  renameSession(rest[0], rest.slice(1));
  process.exit(0);
}

if (command === 'sessions' && subcommand === 'delete') {
  const sessionId = rest.find((value) => !value.startsWith('-'));
  deleteSession(sessionId);
  process.exit(0);
}

if (command === 'cron' && subcommand === 'list') {
  listCronJobs();
  process.exit(0);
}

if (command === 'cron' && subcommand === 'status') {
  cronStatus();
  process.exit(0);
}

if (command === 'tools' && subcommand === 'list') {
  listTools();
  process.exit(0);
}

if (command === 'skills' && subcommand === 'list') {
  listSkills();
  process.exit(0);
}

if (command === 'skills' && subcommand === 'uninstall') {
  uninstallSkill(rest[0]);
  process.exit(0);
}

if (command === 'config' && subcommand === 'show') {
  configShow();
  process.exit(0);
}

if (command === 'config' && subcommand === 'set') {
  configSet(rest[0], rest[1]);
  process.exit(0);
}

if (command === 'auth' && subcommand === 'list') {
  authList();
  process.exit(0);
}

if (command === 'auth' && subcommand === 'add') {
  const providerId = rest[0];
  const apiKeyIndex = rest.indexOf('--api-key');
  const labelIndex = rest.indexOf('--label');
  authAdd(providerId, apiKeyIndex >= 0 ? rest[apiKeyIndex + 1] : '', labelIndex >= 0 ? rest[labelIndex + 1] : '');
  process.exit(0);
}

if (command === 'status') {
  showStatus();
  process.exit(0);
}

if (command === 'model') {
  const jsonRequested = args.includes('--json');
  if (subcommand === 'inspect' && jsonRequested) {
    const providerIndex = rest.indexOf('--provider');
    await modelsJsonDiscovery(providerIndex >= 0 ? rest[providerIndex + 1] : null);
    process.exit(0);
  }

  if (subcommand === 'auth' && jsonRequested) {
    const providerIndex = rest.indexOf('--provider');
    const authSessionIdIndex = rest.indexOf('--auth-session-id');
    await modelsJsonAuth(
      providerIndex >= 0 ? rest[providerIndex + 1] : 'nous',
      rest.includes('--poll'),
      authSessionIdIndex >= 0 ? rest[authSessionIdIndex + 1] : null
    );
    process.exit(0);
  }

  if (subcommand === 'connect' && jsonRequested) {
    const providerIndex = rest.indexOf('--provider');
    const apiKeyIndex = rest.indexOf('--api-key');
    const labelIndex = rest.indexOf('--label');
    const baseUrlIndex = rest.indexOf('--base-url');
    const apiModeIndex = rest.indexOf('--api-mode');
    await modelsJsonConnect(
      providerIndex >= 0 ? rest[providerIndex + 1] : '',
      apiKeyIndex >= 0 ? rest[apiKeyIndex + 1] : '',
      labelIndex >= 0 ? rest[labelIndex + 1] : '',
      {
        baseUrl: baseUrlIndex >= 0 ? rest[baseUrlIndex + 1] : undefined,
        apiMode: apiModeIndex >= 0 ? rest[apiModeIndex + 1] : undefined
      }
    );
    process.exit(0);
  }

  if (subcommand === 'configure' && jsonRequested) {
    const providerIndex = rest.indexOf('--provider');
    const defaultModelIndex = rest.indexOf('--default-model');
    const baseUrlIndex = rest.indexOf('--base-url');
    const apiModeIndex = rest.indexOf('--api-mode');
    const maxTurnsIndex = rest.indexOf('--max-turns');
    const reasoningEffortIndex = rest.indexOf('--reasoning-effort');
    await modelsJsonConfigure(providerIndex >= 0 ? rest[providerIndex + 1] : '', {
      defaultModel: defaultModelIndex >= 0 ? rest[defaultModelIndex + 1] : undefined,
      baseUrl: baseUrlIndex >= 0 ? rest[baseUrlIndex + 1] : undefined,
      apiMode: apiModeIndex >= 0 ? rest[apiModeIndex + 1] : undefined,
      maxTurns: maxTurnsIndex >= 0 ? Number(rest[maxTurnsIndex + 1]) : undefined,
      reasoningEffort: reasoningEffortIndex >= 0 ? rest[reasoningEffortIndex + 1] : undefined
    });
    process.exit(0);
  }

  if (subcommand === 'disconnect' && jsonRequested) {
    const providerIndex = rest.indexOf('--provider');
    await modelsJsonDisconnect(providerIndex >= 0 ? rest[providerIndex + 1] : '');
    process.exit(0);
  }

  if (jsonRequested) {
    const providerIndex = rest.indexOf('--provider');
    await modelsJsonDiscovery(providerIndex >= 0 ? rest[providerIndex + 1] : null);
    process.exit(0);
  }
}

if (command === 'chat') {
  await runChat([subcommand, ...rest].filter(Boolean));
  process.exit(0);
}

if (command === 'login') {
  print('Login successful (fixture)');
  process.exit(0);
}

if (command === 'dump') {
  const state = loadState();
  const profile = getProfile(state);
  const authProviders = getAuthProvidersForProfile(state, profile.id);
  print(`model: ${profile.runtimeConfig.defaultModel}`);
  print(`provider: ${profile.runtimeConfig.provider}`);
  print(`version: 0.9.0`);
  print('');
  print('api_keys:');
  const providerIds = ['openrouter', 'anthropic', 'nous', 'minimax', 'ai_gateway'];
  for (const pid of providerIds) {
    const connected = pid === 'openrouter' || Boolean(authProviders[pid]);
    print(`  ${pid.padEnd(20)} ${connected ? 'set' : 'not set'}`);
  }
  print('');
  print('config_overrides:');
  print(`  agent.max_turns: ${profile.runtimeConfig.maxTurns}`);
  if (profile.runtimeConfig.reasoningEffort) {
    print(`  agent.reasoning_effort: ${profile.runtimeConfig.reasoningEffort}`);
  }
  process.exit(0);
}

process.stderr.write(`Unsupported fixture command: ${args.join(' ')}\n`);
process.exit(1);
