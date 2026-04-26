/**
 * LLM-based intent classifier — async drop-in replacement for classifyStructuredRecipeIntent.
 *
 * Uses the configured provider via OpenAI-compatible chat completions API.
 * Returns null on any error so callers degrade gracefully.
 */

import type { RecipeContentFormat } from '@hermes-recipes/protocol';
import type { StructuredRecipeIntent } from './client';

// ---------------------------------------------------------------------------
// Provider config
// ---------------------------------------------------------------------------

export interface LLMClassifierConfig {
  apiKey: string;
  baseUrl: string;       // e.g. "https://openrouter.ai/api/v1"
  model: string;         // e.g. "anthropic/claude-haiku-4-5"
  timeoutMs?: number;    // default 4000
}

/** Read active OpenRouter credentials from ~/.hermes/auth.json */
export async function readHermesProviderConfig(hermesHome: string): Promise<LLMClassifierConfig | null> {
  try {
    const fs = await import('fs/promises');
    const raw = await fs.readFile(`${hermesHome}/auth.json`, 'utf8');
    const auth = JSON.parse(raw) as Record<string, unknown>;
    const pool = auth['credential_pool'] as Record<string, unknown> | undefined;
    if (!pool) return null;

    for (const creds of Object.values(pool)) {
      const list = Array.isArray(creds) ? creds : [creds];
      for (const cred of list) {
        if (
          cred &&
          typeof cred === 'object' &&
          'access_token' in cred &&
          'base_url' in cred &&
          typeof (cred as Record<string, unknown>)['access_token'] === 'string' &&
          typeof (cred as Record<string, unknown>)['base_url'] === 'string'
        ) {
          return {
            apiKey: (cred as Record<string, string>)['access_token'],
            baseUrl: (cred as Record<string, string>)['base_url'],
            model: 'anthropic/claude-haiku-4-5',
            timeoutMs: 4000
          };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Template catalog — single source of truth for the classifier prompt.
// Add or remove a line here when the template registry changes.
// ---------------------------------------------------------------------------

const TEMPLATE_CATALOG = `\
inbox triage — Sort, prioritize, or triage a queue: emails, support tickets, GitHub issues, pull requests, feedback submissions, meeting requests, job applications
security review — Security audits, misconfiguration checks, leaked secrets, IAM policy review, vulnerability scanning, CVE triage, OWASP findings, red flags in code or dependencies
job search — Job listings, career opportunities, offer comparisons, application tracking, role searches, recruiting pipelines
flight comparison — Flight search or comparison, airline routing, round-trips, layover decisions, cheapest routes between cities, red-eye vs. daytime
travel planner — Trip itineraries, day-by-day travel plans, road trips, multi-city journeys, packing, weekend getaways, solo travel
event planner — Event logistics: parties, weddings, conferences, offsites, hackathons, dinner planning, guest lists, venues
price comparison — Consumer/financial comparison by price: insurance plans, mortgages, subscription services, standing desks, appliances
restaurant shortlist — Dining discovery: restaurants, cuisine-specific spots, date-night, business lunch, brunch places in a city
hotel shortlist — Accommodation options: hotels, resorts, Airbnb alternatives, lodging near a venue
nearby places — Local service discovery: gyms, co-working spaces, yoga studios, urgent care, farmers markets, repair shops
research notebook — Deep synthesis: what do we know about X, scientific consensus, regulatory landscape, historical analysis, literature review
comparison matrix — Multi-criteria professional evaluation: software tools, cloud platforms, vendors, law firms, agencies, freelancers
shopping results — Product search: electronics, gifts, keyboards, headphones, office chairs, espresso machines, consumer goods
step by step — How-to guides, tutorials, walkthroughs, setup/install/configure/deploy instructions, troubleshooting`;

// ---------------------------------------------------------------------------
// Label → StructuredRecipeIntent mapping
// ---------------------------------------------------------------------------

const LABEL_TO_INTENT: Record<string, Omit<StructuredRecipeIntent, 'label'>> = {
  'inbox triage':      { category: 'results',  preferredContentFormat: 'card' as RecipeContentFormat },
  'security review':   { category: 'plan',     preferredContentFormat: 'table' as RecipeContentFormat },
  'job search':        { category: 'results',  preferredContentFormat: 'card' as RecipeContentFormat },
  'flight comparison': { category: 'places',   preferredContentFormat: 'table' as RecipeContentFormat },
  'travel planner':    { category: 'places',   preferredContentFormat: 'card' as RecipeContentFormat },
  'event planner':     { category: 'plan',     preferredContentFormat: 'card' as RecipeContentFormat },
  'price comparison':  { category: 'shopping', preferredContentFormat: 'table' as RecipeContentFormat },
  'restaurant shortlist': { category: 'places', preferredContentFormat: 'card' as RecipeContentFormat },
  'hotel shortlist':   { category: 'places',   preferredContentFormat: 'card' as RecipeContentFormat },
  'nearby places':     { category: 'places',   preferredContentFormat: 'card' as RecipeContentFormat },
  'research notebook': { category: 'research', preferredContentFormat: 'markdown' as RecipeContentFormat },
  'comparison matrix': { category: 'shopping', preferredContentFormat: 'table' as RecipeContentFormat },
  'shopping results':  { category: 'shopping', preferredContentFormat: 'card' as RecipeContentFormat },
  'step by step':      { category: 'plan',     preferredContentFormat: 'table' as RecipeContentFormat },
};

// ---------------------------------------------------------------------------
// Prompt construction
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a visual template classifier for a workspace assistant.
Given a user query, return JSON identifying the best matching template, or null for conversational queries.

Templates (label — when to use):
${TEMPLATE_CATALOG}

Rules:
- Return null for greetings, general questions, opinions, or anything that doesn't call for a structured visual.
- Choose the single best match — never combine templates.
- Respond ONLY with valid JSON. No markdown, no explanation.

Response format: {"label":"<template label>"} or {"label":null}`;

// ---------------------------------------------------------------------------
// Core classifier
// ---------------------------------------------------------------------------

function extractLabel(text: string): string | null {
  // Strip markdown code fences if the model adds them
  const stripped = text.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
  try {
    const parsed = JSON.parse(stripped) as Record<string, unknown>;
    const label = parsed['label'];
    if (label === null || label === undefined) return null;
    if (typeof label === 'string' && label in LABEL_TO_INTENT) return label;
    return null;
  } catch {
    // Try to extract {"label":"..."} with a regex as last resort
    const m = /\{"label"\s*:\s*(?:"([^"]+)"|null)\}/.exec(stripped);
    if (!m) return null;
    if (!m[1]) return null;
    return m[1] in LABEL_TO_INTENT ? m[1] : null;
  }
}

export async function classifyStructuredRecipeIntentLLM(
  content: string,
  config: LLMClassifierConfig,
  signal?: AbortSignal
): Promise<StructuredRecipeIntent | null> {
  const timeoutMs = config.timeoutMs ?? 4000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const effectiveSignal = signal ?? controller.signal;

  try {
    const baseUrl = config.baseUrl.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal: effectiveSignal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        'HTTP-Referer': 'https://hermes.app',
        'X-Title': 'Hermes Intent Classifier',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 32,
        temperature: 0,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: content },
        ],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data?.choices?.[0]?.message?.content ?? '';
    const label = extractLabel(raw);
    if (!label) return null;

    return { label, ...LABEL_TO_INTENT[label] };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
