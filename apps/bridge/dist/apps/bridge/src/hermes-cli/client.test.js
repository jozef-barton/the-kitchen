// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { RECIPE_REFRESH_USER_MESSAGE } from '@hermes-recipes/protocol';
import { classifyStructuredRecipeIntent, HermesCli, resolveHermesChatTimeoutMs } from './client';
const skillsListOutput = `                                Installed Skills                                
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━┳━━━━━━━━━┓
┃ Name                              ┃ Category             ┃ Source  ┃ Trust   ┃
┡━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━╇━━━━━━━━━┩
│ google-workspace                  │ productivity         │ builtin │ builtin │
└───────────────────────────────────┴──────────────────────┴─────────┴─────────┘`;
describe('HermesCli', () => {
    it('classifies research-note recipe requests as research intents so template enrichment can run', () => {
        expect(classifyStructuredRecipeIntent('Create a recovered markdown recipe with research notes.', false)).toEqual({
            category: 'research',
            preferredContentFormat: 'markdown',
            label: 'research notebook'
        });
    });
    it('classifies research-notebook planning requests as plan intents so template enrichment can run', () => {
        expect(classifyStructuredRecipeIntent('Research AI browser agents and organize findings in a compact notebook with sources, notes, and follow-ups.', false)).toEqual({
            category: 'plan',
            preferredContentFormat: 'table',
            label: 'research notebook'
        });
    });
    it('classifies architecture requests as research notebook intents', () => {
        expect(classifyStructuredRecipeIntent('Design an architecture for a vendor-tracking app', false))
            .toEqual({ category: 'plan', preferredContentFormat: 'table', label: 'research notebook' });
    });
    it('classifies how-to requests as step-by-step intents', () => {
        expect(classifyStructuredRecipeIntent('How to deploy a Next.js app to Vercel', false))
            .toEqual({ category: 'plan', preferredContentFormat: 'table', label: 'step by step' });
    });
    it('classifies explicit instructions requests as step-by-step intents even with shopping context', () => {
        expect(classifyStructuredRecipeIntent('Can you give me instructions on how to return this item?', false))
            .toEqual({ category: 'plan', preferredContentFormat: 'table', label: 'step by step' });
    });
    it('classifies recommendation requests as research notebook intents', () => {
        expect(classifyStructuredRecipeIntent('What should I use for state management in React?', false))
            .toEqual({ category: 'plan', preferredContentFormat: 'table', label: 'research notebook' });
    });
    it('caps structured recipe seed generation at the temporary 90s limit', () => {
        expect(resolveHermesChatTimeoutMs({
            content: 'Create a structured recipe seed.',
            timeoutMs: 45_000,
            discoveryTimeoutMs: 240_000,
            nearbySearchTimeoutMs: 300_000,
            recipeOperationTimeoutMs: 240_000,
            unrestrictedTimeoutMs: 1_800_000,
            unrestrictedAccessEnabled: false,
            structuredArtifactOnly: true
        })).toBe(90_000);
    });
    it('gives email intents a longer timeout and preloads google-workspace when available', async () => {
        const streamCalls = [];
        const runner = {
            async run(args) {
                if (args[0] === 'skills' && args[1] === 'list') {
                    return {
                        stdout: skillsListOutput,
                        stderr: '',
                        exitCode: 0
                    };
                }
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            },
            async stream(args, options = {}) {
                streamCalls.push({
                    args,
                    timeoutMs: options.timeoutMs
                });
                return {
                    stdout: 'You have 1 unread email.\nsession_id: session-123\n',
                    stderr: '',
                    exitCode: 0
                };
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd()
        });
        const result = await cli.streamChat({
            profile: {
                id: 'jbarton',
                name: 'jbarton',
                description: 'real profile',
                path: '/tmp/jbarton',
                isActive: true
            },
            content: 'Check my unread email.',
            timeoutMs: 45_000,
            maxTurns: 8,
            unrestrictedAccessEnabled: false
        });
        expect(result.assistantMarkdown).toContain('unread email');
        expect(streamCalls[0]?.timeoutMs).toBe(240_000);
        expect(streamCalls[0]?.args).toContain('-s');
        expect(streamCalls[0]?.args.join(' ')).toContain('google-workspace');
    });
    it('pins email intents to the active Hermes profile, preloads google-workspace, and forbids cross-profile checks', async () => {
        const streamCalls = [];
        const runner = {
            async run(args) {
                if (args[0] === 'skills' && args[1] === 'list') {
                    return {
                        stdout: skillsListOutput,
                        stderr: '',
                        exitCode: 0
                    };
                }
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            },
            async stream(args) {
                streamCalls.push({
                    args
                });
                return {
                    stdout: 'Google Recipe is not fully authenticated for jbarton.\nsession_id: session-789\n',
                    stderr: '',
                    exitCode: 0
                };
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd()
        });
        await cli.streamChat({
            profile: {
                id: 'jbarton',
                name: 'jbarton',
                description: 'real profile',
                path: '/tmp/jbarton',
                isActive: true
            },
            content: 'How many unread emails do I have?',
            timeoutMs: 45_000,
            maxTurns: 8,
            unrestrictedAccessEnabled: false
        });
        const serializedArgs = streamCalls[0]?.args.join(' ') ?? '';
        expect(serializedArgs).toContain('The active Hermes profile is jbarton.');
        expect(serializedArgs).toContain('-s google-workspace');
        expect(serializedArgs).toContain('Do not inspect or use other Hermes profiles');
        expect(serializedArgs).not.toContain('this Hermes environment');
    });
    it('keeps the configured timeout for non-email intents', async () => {
        const streamCalls = [];
        const runner = {
            async run() {
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            },
            async stream(_args, options = {}) {
                streamCalls.push({
                    timeoutMs: options.timeoutMs
                });
                return {
                    stdout: 'Bridge reset planning session.\nsession_id: session-321\n',
                    stderr: '',
                    exitCode: 0
                };
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd()
        });
        await cli.streamChat({
            profile: {
                id: '8tn',
                name: '8tn',
                description: 'research profile',
                path: '/tmp/8tn',
                isActive: true
            },
            content: 'Summarize my recent sessions.',
            timeoutMs: 45_000,
            maxTurns: 8,
            unrestrictedAccessEnabled: false
        });
        expect(streamCalls[0]?.timeoutMs).toBe(45_000);
    });
    it('preserves raw JSON output during structured-only artifact generation', async () => {
        const streamCalls = [];
        const runner = {
            async run() {
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            },
            async stream(args) {
                streamCalls.push({ args });
                return {
                    stdout: '{"schemaVersion":"hermes_space_data/v1","recipe":{"title":"Structured shortlist","status":"active","preferredPresentation":"cards"},"rawData":{"kind":"raw_data","schemaVersion":"recipe_raw_data/v1","payload":{"items":[{"id":"item-1","title":"Option A"}]},"links":[],"paginationHints":[],"metadata":{}},"assistantContext":{"kind":"assistant_context","schemaVersion":"recipe_assistant_context/v1","summary":"Structured shortlist ready.","responseLead":"Structured shortlist ready.","responseTail":"Use the attached recipe.","links":[],"citations":[],"metadata":{}}}\nsession_id: session-structured-json\n',
                    stderr: '',
                    exitCode: 0
                };
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd()
        });
        const result = await cli.streamChat({
            profile: {
                id: 'jbarton',
                name: 'jbarton',
                description: 'real profile',
                path: '/tmp/jbarton',
                isActive: true
            },
            content: 'Create a recipe with a table of random numbers.',
            timeoutMs: 45_000,
            maxTurns: 8,
            unrestrictedAccessEnabled: false,
            structuredArtifactOnly: true
        });
        expect(result.assistantMarkdown.trim().startsWith('{')).toBe(true);
        expect(result.assistantMarkdown).toContain('"schemaVersion":"hermes_space_data/v1"');
        expect(streamCalls[0]?.args.join(' ')).toContain('structured artifact generation step');
    });
    it('preserves marker-only structured-only output so the bridge can classify empty payloads explicitly', async () => {
        const runner = {
            async run() {
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            },
            async stream() {
                return {
                    stdout: '```hermes-recipe-data\nsession_id: session-structured-marker\n',
                    stderr: '',
                    exitCode: 0
                };
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd()
        });
        const result = await cli.streamChat({
            profile: {
                id: 'jbarton',
                name: 'jbarton',
                description: 'real profile',
                path: '/tmp/jbarton',
                isActive: true
            },
            content: 'Create a malformed recipe.',
            timeoutMs: 45_000,
            maxTurns: 8,
            unrestrictedAccessEnabled: false,
            structuredArtifactOnly: true
        });
        expect(result.assistantMarkdown).toBe('```hermes-recipe-data');
    });
    it('runs recipe applet generation through a dedicated artifact-only path without resuming live work', async () => {
        const streamCalls = [];
        const runner = {
            async run() {
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            },
            async stream(args, options = {}) {
                streamCalls.push({
                    args,
                    timeoutMs: options.timeoutMs
                });
                return {
                    stdout: "import { Stack, Text, defineApplet } from 'recipe-applet-sdk';\n\nexport default defineApplet(() => (\n  <Stack>\n    <Text>Inbox applet</Text>\n  </Stack>\n));\n",
                    stderr: '',
                    exitCode: 0
                };
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd()
        });
        const result = await cli.generateRecipeAppletArtifact({
            profile: {
                id: 'jbarton',
                name: 'jbarton',
                description: 'real profile',
                path: '/tmp/jbarton',
                isActive: true
            },
            stage: 'source',
            prompt: `Persisted task summary:
{"assistantSummary":"There is 1 unread email.","baselineTitle":"Inbox summary"}`,
            timeoutMs: 45_000
        });
        const serializedArgs = streamCalls[0]?.args.join(' ') ?? '';
        expect(result.assistantMarkdown).toContain("defineApplet");
        expect(streamCalls[0]?.timeoutMs).toBe(45_000);
        expect(serializedArgs).toContain('Artifact-only contract:');
        expect(serializedArgs).toContain('Do not check email again, rerun search/discovery');
        expect(serializedArgs).not.toContain('--resume');
        expect(serializedArgs).not.toContain(' -s ');
    });
    it('rejects recipe applet prompts that still include the raw original task prompt', async () => {
        const runner = {
            async run() {
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            },
            async stream() {
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd()
        });
        await expect(cli.generateRecipeAppletArtifact({
            profile: {
                id: 'jbarton',
                name: 'jbarton',
                description: 'real profile',
                path: '/tmp/jbarton',
                isActive: true
            },
            stage: 'source',
            prompt: 'Original prompt:\nCheck my unread email and summarize it.',
            timeoutMs: 45_000
        })).rejects.toThrow('raw original task prompt');
    });
    it('blocks recipe applet generation when Hermes emits live tool activity', async () => {
        const runner = {
            async run() {
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            },
            async stream(_args, options = {}) {
                options.onStdout?.('Initializing agent...\n');
                options.onStdout?.('┊ 📚 preparing google-workspace…\n');
                if (options.signal?.aborted) {
                    const abortError = new Error('aborted');
                    abortError.name = 'AbortError';
                    throw abortError;
                }
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 1
                };
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd()
        });
        await expect(cli.generateRecipeAppletArtifact({
            profile: {
                id: 'jbarton',
                name: 'jbarton',
                description: 'real profile',
                path: '/tmp/jbarton',
                isActive: true
            },
            stage: 'source',
            prompt: 'Persisted task summary:\n{"assistantSummary":"Inbox summary"}',
            timeoutMs: 45_000
        })).rejects.toMatchObject({
            name: 'HermesCliRecipeAppletViolationError'
        });
    });
    it('fails loudly if applet generation is routed through the live chat API', async () => {
        const runner = {
            async run() {
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            },
            async stream() {
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd()
        });
        await expect(cli.streamChat({
            profile: {
                id: 'jbarton',
                name: 'jbarton',
                description: 'real profile',
                path: '/tmp/jbarton',
                isActive: true
            },
            content: 'Artifact-only applet prompt',
            recipeAppletStage: 'source',
            timeoutMs: 45_000,
            maxTurns: 1,
            unrestrictedAccessEnabled: false
        })).rejects.toThrow('generateRecipeAppletArtifact');
    });
    it('runs recipe DSL generation through a dedicated artifact-only path without resuming live work', async () => {
        const streamCalls = [];
        const runner = {
            async run() {
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            },
            async stream(args, options = {}) {
                streamCalls.push({
                    args,
                    timeoutMs: options.timeoutMs
                });
                return {
                    stdout: '{"kind":"recipe_dsl","schemaVersion":"recipe_dsl/v2","sdkVersion":"recipe_sdk/v1","title":"Inbox summary","summary":"Fixture DSL","status":"active","tabs":[{"id":"tab-overview","label":"Overview","sectionIds":["section-summary"],"layout":"stack","metadata":{}}],"datasets":[],"sections":[{"id":"section-summary","type":"summary","title":"Inbox summary","body":"### Overview\\n\\nDeclarative recipe.","fields":[],"entityIds":[],"actionIds":[],"links":[],"media":[],"stats":[],"metadata":{}}],"actions":[],"notes":[],"operations":[{"op":"set_active_tab","tabId":"tab-overview"}],"semanticHints":{"preferredLayout":"stack","notes":[],"narrowPaneStrategy":"stack"},"metadata":{}}\n',
                    stderr: '',
                    exitCode: 0
                };
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd()
        });
        const result = await cli.generateRecipeDslArtifact({
            profile: {
                id: 'jbarton',
                name: 'jbarton',
                description: 'real profile',
                path: '/tmp/jbarton',
                isActive: true
            },
            stage: 'generate',
            prompt: `Persisted recipe graph:\n{"title":"Inbox summary","tabs":[{"id":"tab-overview"}]}`,
            timeoutMs: 90_000
        });
        const serializedArgs = streamCalls[0]?.args.join(' ') ?? '';
        expect(result.assistantMarkdown).toContain('"recipe_dsl"');
        expect(streamCalls[0]?.timeoutMs).toBe(90_000);
        expect(serializedArgs).toContain('Artifact-only contract:');
        expect(serializedArgs).toContain('Do not check email again, rerun search/discovery');
        expect(serializedArgs).toContain('recipe_dsl/v2');
        expect(serializedArgs).not.toContain('--resume');
        expect(serializedArgs).not.toContain(' -s ');
    });
    it('rejects recipe DSL prompts that still include the raw original task prompt', async () => {
        const runner = {
            async run() {
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            },
            async stream() {
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd()
        });
        await expect(cli.generateRecipeDslArtifact({
            profile: {
                id: 'jbarton',
                name: 'jbarton',
                description: 'real profile',
                path: '/tmp/jbarton',
                isActive: true
            },
            stage: 'generate',
            prompt: 'Original prompt:\nCheck my unread email and summarize it.',
            timeoutMs: 90_000
        })).rejects.toThrow('raw original task prompt');
    });
    it('blocks recipe DSL generation when Hermes emits live tool activity', async () => {
        const runner = {
            async run() {
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            },
            async stream(_args, options = {}) {
                options.onStdout?.('Initializing agent...\n');
                options.onStdout?.('┊ 📚 preparing google-workspace…\n');
                if (options.signal?.aborted) {
                    const abortError = new Error('aborted');
                    abortError.name = 'AbortError';
                    throw abortError;
                }
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 1
                };
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd()
        });
        await expect(cli.generateRecipeDslArtifact({
            profile: {
                id: 'jbarton',
                name: 'jbarton',
                description: 'real profile',
                path: '/tmp/jbarton',
                isActive: true
            },
            stage: 'generate',
            prompt: 'Persisted recipe graph:\n{"title":"Inbox summary"}',
            timeoutMs: 90_000
        })).rejects.toMatchObject({
            name: 'HermesCliRecipeAppletViolationError'
        });
    });
    it('gives nearby-search intents a longer timeout and shapes the prompt for fast local results', async () => {
        const streamCalls = [];
        const runner = {
            async run() {
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            },
            async stream(args, options = {}) {
                streamCalls.push({
                    args,
                    timeoutMs: options.timeoutMs
                });
                return {
                    stdout: 'Here are 3 good Italian restaurants near Dayton, OH: Mamma Disalvo\'s, Roost Italian, and Jimmy’s Italian Kitchen.\nsession_id: session-555\n',
                    stderr: '',
                    exitCode: 0
                };
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd()
        });
        const result = await cli.streamChat({
            profile: {
                id: 'jbarton',
                name: 'jbarton',
                description: 'real profile',
                path: '/tmp/jbarton',
                isActive: true
            },
            content: 'good Italian restaurants near Dayton, OH',
            timeoutMs: 45_000,
            maxTurns: 8,
            unrestrictedAccessEnabled: false
        });
        const serializedArgs = streamCalls[0]?.args.join(' ') ?? '';
        expect(result.assistantMarkdown).toContain('Italian restaurants near Dayton, OH');
        expect(streamCalls[0]?.timeoutMs).toBe(300_000);
        expect(serializedArgs).toContain('keep the search scoped to the exact location the user named');
        expect(serializedArgs).toContain('Prefer one concise nearby-search pass and a short verified shortlist');
        expect(serializedArgs).toContain('Do not inspect the local repository or recipe for nearby-search requests');
        expect(serializedArgs).toContain('Do not use read_file, open, cat, ls, execute_code, python, shell');
        expect(serializedArgs).toContain('Do not include raw tool output');
        // Phase 1: recipe-creation instructions must NOT be in the main-chat prompt for local search
        expect(serializedArgs).not.toContain('Create exactly one attached Recipe');
        expect(serializedArgs).not.toContain('create exactly one attached recipe');
        expect(serializedArgs).not.toContain('naturally produces a shortlist, create or update the local attached Recipe');
    });
    it('omits recipe-creation instructions from discovery and general structured-intent prompts (Phase 1 slim prompt)', async () => {
        const prompts = [
            { content: 'Find me the best Bluetooth speakers under $100.', label: 'discovery' },
            { content: 'Compare three project management tools.', label: 'discovery' },
            { content: 'Top 5 hotels in Cleveland OH.', label: 'local search (hotels)' },
            { content: 'What are some good laptop recommendations?', label: 'general structured intent' }
        ];
        for (const { content, label } of prompts) {
            const streamCalls = [];
            const runner = {
                async run() { return { stdout: '', stderr: '', exitCode: 0 }; },
                async stream(args) {
                    streamCalls.push({ args });
                    return { stdout: `Answer for ${content}\nsession_id: s-1\n`, stderr: '', exitCode: 0 };
                }
            };
            const cli = new HermesCli({ runner, workingDirectory: process.cwd() });
            await cli.streamChat({
                profile: { id: 'jbarton', name: 'jbarton', description: 'real profile', path: '/tmp/jbarton', isActive: true },
                content,
                timeoutMs: 60_000,
                maxTurns: 1,
                unrestrictedAccessEnabled: false
            });
            const serialized = streamCalls[0]?.args.join(' ') ?? '';
            expect(serialized, `[${label}] must not contain recipe-creation instruction`).not.toContain('Create exactly one attached Recipe');
            expect(serialized, `[${label}] must not contain recipe-creation instruction`).not.toContain('create exactly one attached recipe');
        }
    });
    it('returns a clearer timeout error for nearby-search intents', async () => {
        const runner = {
            async run() {
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            },
            async stream() {
                const timeoutError = new Error('Fixture local search timed out.');
                timeoutError.name = 'TimeoutError';
                throw timeoutError;
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd()
        });
        await expect(cli.streamChat({
            profile: {
                id: 'jbarton',
                name: 'jbarton',
                description: 'real profile',
                path: '/tmp/jbarton',
                isActive: true
            },
            content: 'good Italian restaurants near Dayton, OH',
            timeoutMs: 45_000,
            maxTurns: 8,
            unrestrictedAccessEnabled: false
        })).rejects.toThrow('Hermes timed out while searching for nearby results');
    });
    it('uses the recipe-operation timeout policy and narrows the prompt for Hermes-managed recipe creation', async () => {
        const streamCalls = [];
        const runner = {
            async run() {
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            },
            async stream(args, options = {}) {
                streamCalls.push({
                    args,
                    timeoutMs: options.timeoutMs
                });
                return {
                    stdout: 'Created a number table.\n```hermes-ui-recipes\n{"operations":[{"type":"create_space","title":"Random numbers","viewType":"table","data":{"columns":[{"id":"value","label":"Value","emphasis":"primary"}],"rows":[{"value":4},{"value":7}]}}]}\n```\nsession_id: session-777\n',
                    stderr: '',
                    exitCode: 0
                };
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd()
        });
        await cli.streamChat({
            profile: {
                id: 'jbarton',
                name: 'jbarton',
                description: 'real profile',
                path: '/tmp/jbarton',
                isActive: true
            },
            content: 'Create a recipe with a table of random numbers.',
            timeoutMs: 45_000,
            maxTurns: 8,
            unrestrictedAccessEnabled: false
        });
        const serializedArgs = streamCalls[0]?.args.join(' ') ?? '';
        expect(streamCalls[0]?.timeoutMs).toBe(180_000);
        expect(serializedArgs).toContain('Treat this as a narrow structured recipe request');
        expect(serializedArgs).toContain('If one direct create, update, mark-changed, or delete operation can satisfy the request, do only that');
        expect(serializedArgs).toContain('Bias toward a single structured operation and a short confirmation');
        expect(serializedArgs).toContain('Avoid terminal commands, scripts, code execution, or repeated tool exploration');
    });
    it('uses the unrestricted timeout policy when unrestricted access is enabled', async () => {
        const streamCalls = [];
        const runner = {
            async run() {
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            },
            async stream(_args, options = {}) {
                streamCalls.push({
                    timeoutMs: options.timeoutMs
                });
                return {
                    stdout: 'Unrestricted result.\nsession_id: session-888\n',
                    stderr: '',
                    exitCode: 0
                };
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd()
        });
        await cli.streamChat({
            profile: {
                id: '8tn',
                name: '8tn',
                description: 'research profile',
                path: '/tmp/8tn',
                isActive: true
            },
            content: 'Take unrestricted action for this fixture request.',
            timeoutMs: 45_000,
            unrestrictedTimeoutMs: 3_600_000,
            maxTurns: 8,
            unrestrictedAccessEnabled: true
        });
        expect(streamCalls[0]?.timeoutMs).toBe(3_600_000);
    });
    it('includes active recipe context in the Hermes bridge chat query when a recipe is selected', async () => {
        const streamCalls = [];
        const runner = {
            async run() {
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            },
            async stream(args) {
                streamCalls.push({ args });
                return {
                    stdout: 'Updated the current recipe.\nsession_id: session-654\n',
                    stderr: '',
                    exitCode: 0
                };
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd()
        });
        await cli.streamChat({
            profile: {
                id: 'jbarton',
                name: 'jbarton',
                description: 'real profile',
                path: '/tmp/jbarton',
                isActive: true
            },
            content: 'Update the current recipe with a summary section.',
            timeoutMs: 45_000,
            maxTurns: 8,
            unrestrictedAccessEnabled: false,
            spaceContext: {
                id: 'recipe-123',
                title: 'Weekly plan',
                description: 'Planning recipe',
                contentFormat: 'markdown',
                status: 'active',
                metadata: {
                    changeVersion: 3,
                    auditTags: ['planning'],
                    homeRecipe: true
                },
                data: '{\n  "markdown": "## Weekly plan"\n}'
            }
        });
        const serializedArgs = streamCalls[0]?.args.join(' ') ?? '';
        expect(serializedArgs).toContain('Recipe ID: recipe-123');
        expect(serializedArgs).toContain('Title: Weekly plan');
        expect(serializedArgs).toContain('Content format: markdown');
        expect(serializedArgs).toContain('Planning recipe');
        expect(serializedArgs).toContain('"changeVersion":3');
        expect(serializedArgs).toContain('Data snapshot:');
    });
    it('uses persisted refresh context when refreshing an attached recipe', async () => {
        const streamCalls = [];
        const runner = {
            async run() {
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            },
            async stream(args, options = {}) {
                streamCalls.push({
                    args,
                    timeoutMs: options.timeoutMs
                });
                return {
                    stdout: 'Refreshed the shortlist.\nsession_id: session-901\n',
                    stderr: '',
                    exitCode: 0
                };
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd()
        });
        await cli.streamChat({
            profile: {
                id: 'jbarton',
                name: 'jbarton',
                description: 'real profile',
                path: '/tmp/jbarton',
                isActive: true
            },
            content: RECIPE_REFRESH_USER_MESSAGE,
            requestMode: 'recipe_refresh',
            timeoutMs: 45_000,
            maxTurns: 8,
            unrestrictedAccessEnabled: false,
            refreshContext: {
                intentPrompt: 'Find the best boutique hotels in Dayton with breakfast.',
                source: 'recipe_metadata'
            },
            spaceContext: {
                id: 'recipe-123',
                title: 'Hotel shortlist',
                description: 'Current attached hotel research',
                contentFormat: 'card',
                status: 'active',
                metadata: {
                    changeVersion: 3,
                    auditTags: ['hotel-research'],
                    homeRecipe: true,
                    refreshPrompt: 'Find the best boutique hotels in Dayton with breakfast.'
                },
                data: '{\n  "cards": []\n}'
            }
        });
        const serializedArgs = streamCalls[0]?.args.join(' ') ?? '';
        expect(streamCalls[0]?.timeoutMs).toBe(300_000);
        expect(serializedArgs).toContain('This request is a refresh of the current attached Recipe.');
        expect(serializedArgs).toContain(`User-visible refresh action: ${RECIPE_REFRESH_USER_MESSAGE}`);
        expect(serializedArgs).toContain('Original request:');
        expect(serializedArgs).toContain('Find the best boutique hotels in Dayton with breakfast.');
        expect(serializedArgs).toContain('Update the current attached Recipe in this same response.');
        expect(serializedArgs).toContain('Do not create a new recipe.');
    });
    it('parses Hermes session listings without turning relative times into ids', async () => {
        let listCalls = 0;
        const runner = {
            async run(args) {
                if (args[0] === 'sessions' && args[1] === 'list') {
                    listCalls += 1;
                    return {
                        stdout: listCalls === 1
                            ? `Preview                                            Last Active   Src    ID
───────────────────────────────────────────────────────────────────────────────────────────────
How many unread emails do I have?  Bridge execut   3m ago        cli    20260408_224934_113faa
                                                   1h ago        cli    20260408_215103_ed5cf3
`
                            : listCalls === 2
                                ? `Preview                                            Last Active   Src    ID
───────────────────────────────────────────────────────────────────────────────────────────────
Inbox follow-up for launch prep                      2026-04-08T19:30:00.000Z  cli    20260408_160739_session_07
Quarterly planning review                           9m ago                      cli    20260408_160839_session_08
`
                                : `Title                            Preview                                  Last Active   ID
──────────────────────────────────────────────────────────────────────────────────────────────────────────────
—                                How many unread emails do I have?  Bri   3m ago        20260408_225823_ec9ed0
—                                                                         1h ago        20260408_215103_ed5cf3
`,
                        stderr: '',
                        exitCode: 0
                    };
                }
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            },
            async stream() {
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd(),
            now: () => '2026-04-08T23:00:00.000Z'
        });
        const sessions = await cli.listSessions({
            id: '8tn',
            name: '8tn',
            description: 'real profile',
            path: '/tmp/8tn',
            isActive: true
        });
        const isoTimestampSessions = await cli.listSessions({
            id: '8tn',
            name: '8tn',
            description: 'real profile',
            path: '/tmp/8tn',
            isActive: true
        });
        const titleColumnSessions = await cli.listSessions({
            id: '8tn',
            name: '8tn',
            description: 'real profile',
            path: '/tmp/8tn',
            isActive: true
        });
        expect(sessions.map((session) => session.runtimeSessionId)).toEqual(['20260408_224934_113faa', '20260408_215103_ed5cf3']);
        expect(sessions[0]?.summary).toContain('Bridge execut');
        expect(isoTimestampSessions.map((session) => session.runtimeSessionId)).toEqual([
            '20260408_160739_session_07',
            '20260408_160839_session_08'
        ]);
        expect(isoTimestampSessions[0]?.lastUpdatedAt).toBe('2026-04-08T19:30:00.000Z');
        expect(titleColumnSessions.map((session) => session.runtimeSessionId)).toEqual(['20260408_225823_ec9ed0', '20260408_215103_ed5cf3']);
    });
    it('deduplicates repeated assistant paragraphs in the extracted final reply', async () => {
        const runner = {
            async run() {
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            },
            async stream() {
                return {
                    stdout: `Unread email is available via Google Recipe on profile 8tn.\n\nCurrent unread count I checked: 1\n\nLatest unread:\nFunding notice\n\nUnread email is available via Google Recipe on profile 8tn.\n\nCurrent unread count I checked: 1\n\nLatest unread:\nFunding notice\n\nNote: re-run OAuth consent for jbarton.\nsession_id: session-456\n`,
                    stderr: '',
                    exitCode: 0
                };
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd()
        });
        const result = await cli.streamChat({
            profile: {
                id: 'jbarton',
                name: 'jbarton',
                description: 'real profile',
                path: '/tmp/jbarton',
                isActive: true
            },
            content: 'Check my unread email.',
            timeoutMs: 45_000,
            maxTurns: 8,
            unrestrictedAccessEnabled: false
        });
        expect(result.assistantMarkdown).toBe('Unread email is available via Google Recipe on profile 8tn.\n\nCurrent unread count I checked: 1\n\nLatest unread:\nFunding notice\n\nNote: re-run OAuth consent for jbarton.');
    });
    it('classifies imported tool and technical system messages as runtime-only session messages', async () => {
        const runner = {
            async run(args) {
                if (args[0] === 'sessions' && args[1] === 'export') {
                    return {
                        stdout: JSON.stringify({
                            messages: [
                                {
                                    id: 1,
                                    role: 'user',
                                    content: 'Check unread email',
                                    timestamp: '2026-04-08T20:00:00.000Z'
                                },
                                {
                                    id: 2,
                                    role: 'tool',
                                    content: '{"count":1}',
                                    timestamp: '2026-04-08T20:00:00.100Z'
                                },
                                {
                                    id: 3,
                                    role: 'system',
                                    content: 'AUTH_SCOPE_MISMATCH: Google Recipe is not fully authenticated for jbarton.',
                                    timestamp: '2026-04-08T20:00:00.200Z'
                                },
                                {
                                    id: 4,
                                    role: 'assistant',
                                    content: 'You have 1 unread email in jbarton.',
                                    timestamp: '2026-04-08T20:00:01.000Z'
                                }
                            ]
                        }),
                        stderr: '',
                        exitCode: 0
                    };
                }
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            },
            async stream() {
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd()
        });
        const messages = await cli.exportSessionMessages({
            id: 'jbarton',
            name: 'jbarton',
            description: 'real profile',
            path: '/tmp/jbarton',
            isActive: true
        }, {
            id: 'runtime-session-1',
            runtimeSessionId: 'runtime-session-1'
        });
        expect(messages).toHaveLength(4);
        expect(messages[0]?.requestId).toBe('imported-runtime-session-1-1');
        expect(messages[1]?.visibility).toBe('runtime');
        expect(messages[1]?.requestId).toBe(messages[0]?.requestId);
        expect(messages[2]?.visibility).toBe('runtime');
        expect(messages[3]?.visibility).toBe('transcript');
        expect(messages[3]?.requestId).toBe(messages[0]?.requestId);
    });
    it('sanitizes imported runtime transcripts so bridge prompt scaffolding and recipe fences stay out of chat', async () => {
        const runner = {
            async run(args) {
                if (args[0] === 'sessions' && args[1] === 'export') {
                    return {
                        stdout: JSON.stringify({
                            messages: [
                                {
                                    id: 1,
                                    role: 'user',
                                    content: 'Update the launch tracker.\n\nBridge execution note: The active Hermes profile is jbarton. Use only this active profile\'s auth state.\nReturn only the final assistant answer.',
                                    timestamp: '2026-04-09T18:00:00.000Z'
                                },
                                {
                                    id: 2,
                                    role: 'assistant',
                                    content: `Updated the launch tracker.

\`\`\`hermes-ui-recipes
{"operations":[{"type":"update_space","target":"current","status":"changed"}]}
\`\`\`

{"count":1}`,
                                    timestamp: '2026-04-09T18:00:01.000Z'
                                }
                            ]
                        }),
                        stderr: '',
                        exitCode: 0
                    };
                }
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            },
            async stream() {
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd()
        });
        const messages = await cli.exportSessionMessages({
            id: 'jbarton',
            name: 'jbarton',
            description: 'real profile',
            path: '/tmp/jbarton',
            isActive: true
        }, {
            id: 'runtime-session-2',
            runtimeSessionId: 'runtime-session-2'
        });
        expect(messages).toHaveLength(2);
        expect(messages[0]?.content).toBe('Update the launch tracker.');
        expect(messages[1]?.content).toBe('Updated the launch tracker.');
        expect(messages[1]?.visibility).toBe('transcript');
        expect(messages[1]?.kind).toBe('conversation');
    });
    it('strips raw JSON blobs from the final assistant text when Hermes leaks tool output', async () => {
        const runner = {
            async run() {
                return {
                    stdout: '',
                    stderr: '',
                    exitCode: 0
                };
            },
            async stream() {
                return {
                    stdout: `You have 1 unread email in jbarton.\n\n{"count":1,"labels":["Inbox"]}\n\nNext step: open Gmail if you want details.\nsession_id: session-999\n`,
                    stderr: '',
                    exitCode: 0
                };
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd()
        });
        const result = await cli.streamChat({
            profile: {
                id: 'jbarton',
                name: 'jbarton',
                description: 'real profile',
                path: '/tmp/jbarton',
                isActive: true
            },
            content: 'How many unread emails do I have?',
            timeoutMs: 45_000,
            maxTurns: 8,
            unrestrictedAccessEnabled: false
        });
        expect(result.assistantMarkdown).toBe('You have 1 unread email in jbarton.\n\nNext step: open Gmail if you want details.');
    });
    it('uses hermes dump for runtime discovery', async () => {
        const runner = {
            async run(args) {
                if (args.join(' ') === 'dump') {
                    return {
                        stdout: [
                            'model: openai/gpt-5.4',
                            'provider: openrouter',
                            'api_keys:',
                            '  openrouter           set',
                            '  openai               not set',
                            'features:',
                            '  toolsets:           hermes-cli',
                        ].join('\n'),
                        stderr: '',
                        exitCode: 0
                    };
                }
                throw new Error(`Unexpected command: ${args.join(' ')}`);
            },
            async stream() {
                return { stdout: '', stderr: '', exitCode: 0 };
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd(),
            now: () => '2026-04-10T18:00:00.000Z'
        });
        const response = await cli.discoverRuntimeProviderState({ id: 'jbarton', name: 'jbarton', description: 'real profile', path: '/tmp/jbarton', isActive: true }, 'openrouter');
        expect(response.config.defaultModel).toBe('openai/gpt-5.4');
        expect(response.config.provider).toBe('openrouter');
        expect(response.discoveredAt).toBe('2026-04-10T18:00:00.000Z');
        expect(response.runtimeReadiness.ready).toBe(true);
        expect(response.runtimeReadiness.code).toBe('ready');
        expect(response.providers.find((p) => p.id === 'openrouter')).toMatchObject({
            state: 'connected',
            ready: true
        });
    });
    it('parses model and provider from hermes dump output and reports ready when provider is connected', async () => {
        const runner = {
            async run(args) {
                if (args.join(' ') === 'dump') {
                    return {
                        stdout: [
                            'model: openai/gpt-5.4',
                            'provider: openrouter',
                            'api_keys:',
                            '  openrouter           set',
                            '  anthropic            not set',
                            'features:',
                            '  toolsets:           hermes-cli',
                        ].join('\n'),
                        stderr: '',
                        exitCode: 0
                    };
                }
                throw new Error(`Unexpected command: ${args.join(' ')}`);
            },
            async stream() {
                return { stdout: '', stderr: '', exitCode: 0 };
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd(),
            now: () => '2026-04-10T18:00:00.000Z'
        });
        const response = await cli.discoverRuntimeProviderState({ id: 'jbarton', name: 'jbarton', description: 'real profile', path: '/tmp/jbarton', isActive: true }, 'openrouter');
        expect(response.config.defaultModel).toBe('openai/gpt-5.4');
        expect(response.config.provider).toBe('openrouter');
        expect(response.runtimeReadiness.ready).toBe(true);
    });
    it('returns ready: false when model is not set (fresh install)', async () => {
        const runner = {
            async run(args) {
                if (args.join(' ') === 'dump') {
                    return {
                        stdout: [
                            'model: (not set)',
                            'provider: (auto)',
                            'api_keys:',
                            '  openrouter           not set',
                            '  anthropic            not set',
                            'features:',
                            '  toolsets:           hermes-cli',
                        ].join('\n'),
                        stderr: '',
                        exitCode: 0
                    };
                }
                throw new Error(`Unexpected command: ${args.join(' ')}`);
            },
            async stream() { return { stdout: '', stderr: '', exitCode: 0 }; }
        };
        const cli = new HermesCli({ runner, workingDirectory: process.cwd(), now: () => '2026-04-10T18:00:00.000Z' });
        const response = await cli.discoverRuntimeProviderState({ id: 'jbarton', name: 'jbarton', description: 'real profile', path: '/tmp/jbarton', isActive: true }, null);
        expect(response.runtimeReadiness.ready).toBe(false);
        expect(response.runtimeReadiness.code).toBe('config_error');
        expect(response.config.defaultModel).toBe('unknown');
    });
    it('returns ready: false with provider_auth_required when model is set but provider has no key', async () => {
        const runner = {
            async run(args) {
                if (args.join(' ') === 'dump') {
                    return {
                        stdout: [
                            'model: anthropic/claude-sonnet-4',
                            'provider: anthropic',
                            'api_keys:',
                            '  openrouter           not set',
                            '  anthropic            not set',
                            'features:',
                            '  toolsets:           hermes-cli',
                        ].join('\n'),
                        stderr: '',
                        exitCode: 0
                    };
                }
                throw new Error(`Unexpected command: ${args.join(' ')}`);
            },
            async stream() { return { stdout: '', stderr: '', exitCode: 0 }; }
        };
        const cli = new HermesCli({ runner, workingDirectory: process.cwd(), now: () => '2026-04-10T18:00:00.000Z' });
        const response = await cli.discoverRuntimeProviderState({ id: 'jbarton', name: 'jbarton', description: 'real profile', path: '/tmp/jbarton', isActive: true }, 'anthropic');
        expect(response.runtimeReadiness.ready).toBe(false);
        expect(response.runtimeReadiness.code).toBe('provider_auth_required');
    });
    it('marks provider connected when api key is set in dump', async () => {
        const runner = {
            async run(args) {
                if (args.join(' ') === 'dump') {
                    return {
                        stdout: [
                            'model: anthropic/claude-sonnet-4',
                            'provider: anthropic',
                            'api_keys:',
                            '  openrouter           not set',
                            '  anthropic            set',
                            'features:',
                            '  toolsets:           hermes-cli',
                        ].join('\n'),
                        stderr: '',
                        exitCode: 0
                    };
                }
                throw new Error(`Unexpected command: ${args.join(' ')}`);
            },
            async stream() {
                return { stdout: '', stderr: '', exitCode: 0 };
            }
        };
        const cli = new HermesCli({
            runner,
            workingDirectory: process.cwd(),
            now: () => '2026-04-10T18:00:00.000Z'
        });
        const response = await cli.discoverRuntimeProviderState({ id: 'jbarton', name: 'jbarton', description: 'real profile', path: '/tmp/jbarton', isActive: true }, 'anthropic');
        expect(response.config.provider).toBe('anthropic');
        const anthropic = response.providers.find((p) => p.id === 'anthropic');
        expect(anthropic?.state).toBe('connected');
        expect(anthropic?.ready).toBe(true);
    });
    it('uses login --provider and dump for OAuth provider auth begin and poll', async () => {
        const calls = [];
        let dumpCallCount = 0;
        const dumpOutput = [
            'model: openai/gpt-5.4',
            'provider: openrouter',
            'api_keys:',
            '  openrouter           set',
            'features:',
            '  toolsets:           hermes-cli',
        ].join('\n');
        const runner = {
            async run(args) {
                const command = args.join(' ');
                calls.push(command);
                if (command.startsWith('login')) {
                    return { stdout: '', stderr: '', exitCode: 0 };
                }
                if (command === 'dump') {
                    dumpCallCount++;
                    return { stdout: dumpOutput, stderr: '', exitCode: 0 };
                }
                throw new Error(`Unexpected command: ${command}`);
            },
            async stream() {
                return { stdout: '', stderr: '', exitCode: 0 };
            }
        };
        const cli = new HermesCli({ runner, workingDirectory: process.cwd() });
        const profile = { id: 'jbarton', name: 'jbarton', description: 'real profile', path: '/tmp/jbarton', isActive: true };
        const beginState = await cli.beginProviderAuth(profile, 'nous');
        const pollState = await cli.pollProviderAuth(profile, 'nous', 'nous-session-1');
        expect(beginState.runtimeReadiness.ready).toBe(true);
        expect(pollState.runtimeReadiness.ready).toBe(true);
        // beginProviderAuth should pass --provider nous, not just 'login'
        expect(calls).toContain('login --provider nous');
        expect(dumpCallCount).toBe(2); // once for begin, once for poll
    });
    it('passes correct --provider flag for openai-codex OAuth auth', async () => {
        const calls = [];
        const runner = {
            async run(args) {
                const command = args.join(' ');
                calls.push(command);
                if (command.startsWith('login') || command === 'dump') {
                    return { stdout: command === 'dump' ? 'model: openai/gpt-5.4\nprovider: openrouter\n' : '', stderr: '', exitCode: 0 };
                }
                throw new Error(`Unexpected command: ${command}`);
            },
            async stream() { return { stdout: '', stderr: '', exitCode: 0 }; }
        };
        const cli = new HermesCli({ runner, workingDirectory: process.cwd() });
        const profile = { id: 'jbarton', name: 'jbarton', description: 'real profile', path: '/tmp/jbarton', isActive: true };
        await cli.beginProviderAuth(profile, 'openai-codex');
        expect(calls).toContain('login --provider openai-codex');
    });
    it('uses config set model.default (not model) and applies all fields', async () => {
        const calls = [];
        const runner = {
            async run(args) {
                const command = args.join(' ');
                calls.push(command);
                if (command.startsWith('config set ')) {
                    return { stdout: '', stderr: '', exitCode: 0 };
                }
                if (command === 'dump') {
                    return {
                        stdout: 'model: openai/gpt-5.4-mini\nprovider: openrouter\n',
                        stderr: '',
                        exitCode: 0
                    };
                }
                throw new Error(`Unexpected command: ${command}`);
            },
            async stream() {
                return { stdout: '', stderr: '', exitCode: 0 };
            }
        };
        const cli = new HermesCli({ runner, workingDirectory: process.cwd() });
        const config = await cli.updateRuntimeModelConfig({ id: 'jbarton', name: 'jbarton', description: 'real profile', path: '/tmp/jbarton', isActive: true }, { provider: 'openrouter', defaultModel: 'openai/gpt-5.4-mini', baseUrl: 'https://openrouter.ai/api/v1', apiMode: 'responses', maxTurns: 42, reasoningEffort: 'high' });
        expect(config).toMatchObject({ provider: 'openrouter', defaultModel: 'openai/gpt-5.4-mini' });
        // Must use model.default (dict key) not model (scalar) to preserve sibling keys
        expect(calls).toContain('config set model.default openai/gpt-5.4-mini');
        expect(calls).toContain('config set model.provider openrouter');
        expect(calls).toContain('config set model.base_url https://openrouter.ai/api/v1');
        expect(calls).toContain('config set model.api_mode responses');
        expect(calls).toContain('config set agent.max_turns 42');
        expect(calls).toContain('config set agent.reasoning_effort high');
        // Must NOT use 'config set model ...' (scalar form) which would clobber provider/base_url
        expect(calls.every((c) => c !== 'config set model openai/gpt-5.4-mini')).toBe(true);
    });
    it('treats model: (not set) from dump as unknown', async () => {
        const runner = {
            async run(args) {
                if (args.join(' ') === 'dump') {
                    return {
                        stdout: 'model: (not set)\nprovider: openrouter\n',
                        stderr: '',
                        exitCode: 0
                    };
                }
                throw new Error(`Unexpected command: ${args.join(' ')}`);
            },
            async stream() { return { stdout: '', stderr: '', exitCode: 0 }; }
        };
        const cli = new HermesCli({ runner, workingDirectory: process.cwd(), now: () => '2026-04-10T18:00:00.000Z' });
        const response = await cli.discoverRuntimeProviderState({ id: 'jbarton', name: 'jbarton', description: 'real profile', path: '/tmp/jbarton', isActive: true }, 'openrouter');
        expect(response.config.defaultModel).toBe('unknown');
    });
    it('connectProvider writes API key via config set and calls dump-based discovery', async () => {
        const calls = [];
        const runner = {
            async run(args) {
                const command = args.join(' ');
                calls.push(command);
                if (command.startsWith('config set ')) {
                    return { stdout: '', stderr: '', exitCode: 0 };
                }
                if (command === 'dump') {
                    return {
                        stdout: [
                            'model: openai/gpt-5.4',
                            'provider: openrouter',
                            'api_keys:',
                            '  openrouter           set',
                            'features:',
                            '  toolsets:           hermes-cli',
                        ].join('\n'),
                        stderr: '',
                        exitCode: 0
                    };
                }
                throw new Error(`Unexpected command: ${args.join(' ')}`);
            },
            async stream() {
                return { stdout: '', stderr: '', exitCode: 0 };
            }
        };
        const cli = new HermesCli({ runner, workingDirectory: process.cwd() });
        const result = await cli.connectProvider({ id: 'jbarton', name: 'jbarton', description: 'real profile', path: '/tmp/jbarton', isActive: true }, { profileId: 'jbarton', provider: 'openrouter', apiKey: 'sk-or-test-1234' });
        expect(calls).toContain('config set OPENROUTER_API_KEY sk-or-test-1234');
        expect(result.runtimeReadiness.ready).toBe(true);
    });
});
