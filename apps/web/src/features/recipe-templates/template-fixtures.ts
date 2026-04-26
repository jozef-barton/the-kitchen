import type { RecipeTemplateId, RecipeTemplatePreviewSpec, TemplateAction, TemplateChip } from './types';

const chip = (label: string, tone: TemplateChip['tone'] = 'neutral'): TemplateChip => ({ label, tone });
const action = (label: string, tone: TemplateAction['tone'] = 'neutral', helper?: string): TemplateAction => ({ label, tone, helper });

export const RECIPE_TEMPLATE_FIXTURES: Record<RecipeTemplateId, RecipeTemplatePreviewSpec> = {
  'price-comparison-grid': {
    headline: 'Compare each item across up to four stores — prices are hyperlinked directly to the listing.',
    summary: 'A focused price-first grid: one row per item, up to four store columns, with prices that link straight to each listing.',
    sections: [
      {
        kind: 'hero',
        eyebrow: 'Commerce template',
        title: '27" 4K monitor and laptop stand price check',
        summary: 'Three items compared across four stores. Prices link straight to the listing.',
        chips: [chip('Multiple items allowed', 'accent'), chip('Max 4 store columns'), chip('Prices are links')],
        actions: []
      },
      {
        kind: 'comparison-table',
        title: 'Price grid',
        columns: [
          { id: 'amazon', label: 'Amazon', align: 'end' },
          { id: 'bestbuy', label: 'Best Buy', align: 'end' },
          { id: 'bh', label: 'B&H', align: 'end' },
          { id: 'newegg', label: 'Newegg', align: 'end' },
        ],
        rows: [
          {
            id: 'dell-s2722qc',
            label: 'Dell S2722QC',
            cells: [
              { value: '$349', href: '#' },
              { value: '$359', href: '#' },
              { value: '$329', tone: 'success', emphasis: true, href: '#' },
              { value: '$341', href: '#' },
            ]
          },
          {
            id: 'lg-27up650',
            label: 'LG 27UP650',
            cells: [
              { value: '$319', tone: 'success', emphasis: true, href: '#' },
              { value: '$338', href: '#' },
              { value: '$334', href: '#' },
              { value: '$329', href: '#' },
            ]
          },
          {
            id: 'rain-laptop-stand',
            label: 'Rain Design mStand',
            cells: [
              { value: '$54', href: '#' },
              { value: '$59', href: '#' },
              { value: '$49', tone: 'success', emphasis: true, href: '#' },
              { value: '$56', href: '#' },
            ]
          }
        ]
      }
    ]
  },
  'shopping-shortlist': {
    headline: 'A tiled results grid of varied items with a photo, name, price, and direct link on every tile.',
    summary: 'Small tiled cards built for browsing a wide variety of items rather than comparing the same item.',
    sections: [
      {
        kind: 'hero',
        eyebrow: 'Commerce template',
        title: 'Gift ideas for a coffee lover',
        summary: 'A mixed set of items with just photo, name, and price on each tile.',
        chips: [chip('Small tiles', 'accent'), chip('Variety of items'), chip('Link per tile')],
        actions: []
      },
      {
        kind: 'card-grid',
        title: 'Results',
        columns: 2,
        cards: [
          {
            title: 'Fellow Stagg EKG Kettle',
            imageLabel: 'Matte black kettle',
            price: '$165'
          },
          {
            title: 'Baratza Encore Grinder',
            imageLabel: 'Burr grinder',
            price: '$179'
          },
          {
            title: 'Hario V60 Pour-Over Kit',
            imageLabel: 'Ceramic dripper',
            price: '$42'
          },
          {
            title: 'Chemex 6-Cup Classic',
            imageLabel: 'Glass carafe',
            price: '$48'
          },
          {
            title: 'Acaia Pearl Scale',
            imageLabel: 'Black scale',
            price: '$175'
          },
          {
            title: 'Origin Espresso Sampler',
            imageLabel: 'Bean sampler',
            price: '$38'
          }
        ]
      }
    ]
  },
  'inbox-triage-board': {
    headline: 'Expandable inbox rows: category name, vendor subtitle, count — click to reveal subjects, recommendation, and actions.',
    summary: 'Each row expands to show sample subjects, a toned recommendation panel, and Archive / Archive & Unsubscribe / Send to Folder buttons.',
    sections: [
      {
        kind: 'hero',
        eyebrow: 'Inbox template',
        title: 'Inbox triage',
        summary: 'Minimal rows with thin dividers. Click any row to expand.',
        chips: [chip('Expandable rows', 'accent'), chip('Sample subjects'), chip('Hermes-backed actions')],
        actions: []
      },
      {
        kind: 'accordion-list',
        items: [
          {
            id: 'promotions',
            title: 'Promotions',
            subtitle: 'Groupon, Woot, REI, Meh',
            count: '38 emails',
            tone: 'warning' as const,
            subjects: [
              '\u{1F525} REI Flash Sale \u2014 40% off hiking gear',
              '\u{1F4E6} Your Woot! deal of the day',
              '\u{1F6CD}\uFE0F Groupon: deals near you this weekend',
              'Meh \u2014 One sale. Today. $29.',
              '\u{1F4B8} REI Member Dividend reminder'
            ],
            recommendation: 'Safe to archive \u2014 no reply history and no purchases traced from these in 60 days.',
            recommendationTone: 'success' as const,
            actions: [action('Archive', 'accent'), action('Archive & Unsubscribe'), action('Send to Folder')]
          },
          {
            id: 'newsletters',
            title: 'Newsletters',
            subtitle: 'Stratechery, Platformer, The Browser, Morning Brew',
            count: '27 emails',
            subjects: [
              'Platformer \u2014 the OpenAI shakeup explained',
              'Stratechery \u2014 the aggregator bear case',
              'The Browser \u2014 5 great reads on attention',
              'Morning Brew \u2014 quick markets recap',
              'Platformer \u2014 how Meta is retooling ads'
            ],
            recommendation: 'Archive & Unsubscribe from low-engagement ones \u2014 you opened fewer than 10% of these in the last 30 days.',
            recommendationTone: 'warning' as const,
            actions: [action('Archive'), action('Archive & Unsubscribe', 'accent'), action('Send to Folder')]
          },
          {
            id: 'updates',
            title: 'Updates',
            subtitle: 'GitHub, Linear, Vercel',
            count: '19 emails',
            subjects: [
              '[GitHub] PR #1048 approved by jsmith',
              'Linear: 3 issues assigned to you',
              'Vercel deployment succeeded',
              '[GitHub] Dependabot alert: 1 new vulnerability',
              'Linear: Sprint review tomorrow at 10\u202fam'
            ],
            recommendation: 'Consider a digest rule \u2014 most of these are low-urgency and can batch to once-a-day.',
            recommendationTone: 'neutral' as const,
            actions: [action('Archive'), action('Archive & Unsubscribe'), action('Send to Folder', 'accent')]
          },
          {
            id: 'receipts',
            title: 'Receipts',
            subtitle: 'Stripe, Apple, Uber, Amazon',
            count: '12 emails',
            recommendation: 'Send to a Receipts folder to keep your inbox clean without losing the records.',
            recommendationTone: 'neutral' as const,
            actions: [action('Archive'), action('Archive & Unsubscribe'), action('Send to Folder', 'accent')]
          }
        ]
      }
    ]
  },
  'restaurant-finder': {
    headline: 'A local-search results surface that feels ready for a dining decision in a small pane.',
    summary: 'List/detail structure keeps cuisine, price, rating, and links visible without pretending to be a map UI.',
    sections: [
      {
        kind: 'hero',
        eyebrow: 'Travel template',
        title: 'Dinner options near Williamsburg',
        summary: 'Top nearby restaurants filtered for walkable dinner spots with good ratings and reliable reservation paths.',
        chips: [chip('Local search', 'accent'), chip('Book prompt'), chip('Cuisine filters')],
        actions: [action('Ask Hermes to book', 'accent'), action('Save selected'), action('Compare with quieter options')]
      },
      {
        kind: 'filter-strip',
        filters: [chip('Within 20 min walk'), chip('Italian or wine bar'), chip('$$$ max'), chip('Open after 7pm')],
        sortLabel: 'Sorted by rating and fit'
      },
      {
        kind: 'split',
        ratio: 'list-detail',
        left: [
          {
            kind: 'grouped-list',
            title: 'Results',
            groups: [
              {
                id: 'best-fits',
                label: 'Best fits',
                tone: 'success',
                items: [
                  {
                    title: 'Lilia',
                    subtitle: 'Italian · 4.7 ★ · $$$',
                    meta: 'Walk 14 min · reservations available',
                    chips: [chip('Top match', 'success'), chip('Popular')]
                  },
                  {
                    title: 'Four Horsemen',
                    subtitle: 'Wine bar · 4.6 ★ · $$$',
                    meta: 'Walk 11 min · small menu',
                    chips: [chip('Date-night pick', 'accent')]
                  }
                ]
              },
              {
                id: 'worth-checking',
                label: 'Worth checking',
                items: [
                  {
                    title: 'Misi',
                    subtitle: 'Italian · 4.5 ★ · $$$',
                    meta: 'Walk 19 min · later tables only',
                    chips: [chip('Later seating', 'warning')]
                  }
                ]
              }
            ]
          }
        ],
        right: [
          {
            kind: 'detail-panel',
            title: 'Selected venue',
            eyebrow: 'Lilia',
            fields: [
              { label: '\u{1F552} Hours', value: '5:00 PM \u2013 10:30 PM' },
              { label: '\u{1F310} Website', links: [{ label: 'Link', href: 'https://lilianewyork.com' }] },
              { label: '\u{1F4DE} Phone', value: '(718) 576-3095' },
              { label: '\u{1F374} Cuisine', value: 'Italian' }
            ],
            actions: []
          }
        ]
      }
    ]
  },
  'hotel-shortlist': {
    headline: 'Hotel cards with price, amenities, website, and phone — no tabs or chrome.',
    summary: 'Just cards. No header bar, no recipe tabs, no Hotels/Notes tabs, and no "Hotel shortlist" header.',
    sections: [
      {
        kind: 'card-grid',
        title: '',
        columns: 1,
        cards: [
          {
            title: 'Memmo Pr\u00edncipe Real',
            subtitle: 'Boutique \u00b7 Pr\u00edncipe Real',
            price: '$248/night',
            imageLabel: 'Warm terrace view',
            chips: [chip('Best fit', 'success'), chip('Rooftop')],
            bullets: ['Quiet block', 'Strong breakfast', 'Walkable to central sights', '\u{1F4DE} +351 21 901 6800']
          },
          {
            title: 'The Lumiares',
            subtitle: 'Apartment hotel \u00b7 Bairro Alto',
            price: '$226/night',
            imageLabel: 'Suite interior',
            chips: [chip('Work-friendly', 'accent'), chip('Kitchenette')],
            bullets: ['Good for longer stay', 'Liveliest nightlife nearby', '\u{1F4DE} +351 21 116 0200']
          },
          {
            title: 'Lisboa Pessoa',
            subtitle: 'Hotel \u00b7 Chiado',
            price: '$189/night',
            imageLabel: 'Classic room',
            chips: [chip('Best value', 'accent')],
            bullets: ['Central location', 'Slightly smaller rooms', '\u{1F4DE} +351 21 140 1600']
          }
        ]
      }
    ]
  },
  'flight-comparison': {
    headline: 'A split-leg airfare workspace that keeps outbound and return decisions stable across refreshes.',
    summary: 'Tabs prevent outbound and return options from blurring together while preserving notes and saved choices.',
    sections: [
      {
        kind: 'hero',
        eyebrow: 'Travel template',
        title: 'NYC to Lisbon flight compare',
        summary: 'Round-trip search with stable outbound and return tabs, focused on one-stop options and overnight comfort.',
        chips: [chip('Leg-aware tabs', 'accent'), chip('Stops and duration'), chip('Save itinerary')],
        actions: [action('Save best itinerary', 'accent'), action('Filter one-stop'), action('Ask Hermes to optimize total travel time')]
      },
      {
        kind: 'stats',
        items: [
          { label: 'Best round-trip price', value: '$711', helper: 'TAP + Delta mix', tone: 'success' },
          { label: 'Shortest total duration', value: '12h 45m', helper: 'Outbound only' },
          { label: 'Nonstop options', value: '2', helper: 'Higher fare band' }
        ]
      },
      {
        kind: 'tabs',
        tabs: [
          { id: 'outbound', label: 'Outbound' },
          { id: 'return', label: 'Return' }
        ],
        activeTabId: 'outbound',
        panes: {
          outbound: [
            {
              kind: 'comparison-table',
              title: 'Outbound options',
              columns: [
                { id: 'price', label: 'Price', align: 'center' },
                { id: 'stops', label: 'Stops', align: 'center' },
                { id: 'duration', label: 'Duration', align: 'center' },
                { id: 'airline', label: 'Airline', align: 'center' },
                { id: 'action', label: '', align: 'center' }
              ],
              rows: [
                {
                  id: 'tap-direct',
                  label: '7:45 PM → 7:20 AM',
                  cells: [
                    { value: '$398', emphasis: true },
                    { value: 'Nonstop', tone: 'success' },
                    { value: '6h 35m' },
                    { value: 'TAP Air Portugal' },
                    { value: '↗', href: '#' }
                  ]
                },
                {
                  id: 'delta-one-stop',
                  label: '5:10 PM → 8:55 AM',
                  cells: [{ value: '$355' }, { value: '1 stop' }, { value: '11h 45m' }, { value: 'Delta + KLM' }, { value: '↗', href: '#' }]
                }
              ]
            }
          ],
          return: [
            {
              kind: 'comparison-table',
              title: 'Return options',
              columns: [
                { id: 'price', label: 'Price', align: 'center' },
                { id: 'stops', label: 'Stops', align: 'center' },
                { id: 'duration', label: 'Duration', align: 'center' },
                { id: 'airline', label: 'Airline', align: 'center' },
                { id: 'action', label: '', align: 'center' }
              ],
              rows: [
                {
                  id: 'tap-return',
                  label: '11:05 AM → 1:50 PM',
                  cells: [
                    { value: '$313', emphasis: true },
                    { value: 'Nonstop', tone: 'success' },
                    { value: '7h 45m' },
                    { value: 'TAP Air Portugal' },
                    { value: '↗', href: '#' }
                  ]
                }
              ]
            }
          ]
        }
      }
    ]
  },
  'travel-itinerary-planner': {
    headline: 'A persistent trip-planning template with stable tabs for chronology, logistics, and notes.',
    summary: 'Later updates can patch itinerary events and bookings without rewriting the whole trip workspace.',
    sections: [
      {
        kind: 'hero',
        eyebrow: 'Travel template',
        title: 'Paris long-weekend itinerary',
        summary: 'A four-tab planner that separates chronology, confirmations, packing, and saved links.',
        chips: [chip('Trip timeline', 'accent'), chip('Bookings tab'), chip('Packing tab')],
        actions: [action('Refine day plan', 'accent'), action('Add booking note'), action('Share trip summary')]
      },
      {
        kind: 'tabs',
        tabs: [
          { id: 'itinerary', label: 'Itinerary' },
          { id: 'bookings', label: 'Bookings' },
          { id: 'packing', label: 'Packing' }
        ],
        activeTabId: 'itinerary',
        panes: {
          itinerary: [
            {
              kind: 'timeline',
              title: 'Day-by-day timeline',
              items: [
                { title: 'Arrive and check in', time: 'Thu 3:10 PM', summary: 'Hotel in Le Marais', chips: [chip('Booking')] },
                { title: 'Dinner near hotel', time: 'Thu 8:00 PM', summary: 'Shortlist from saved local discovery' },
                { title: 'Mus\u00e9e d\u2019Orsay visit', time: 'Fri 10:00 AM', summary: 'Timed entry recommended', chips: [chip('Book soon', 'warning')] }
              ]
            }
          ],
          bookings: [
            {
              kind: 'grouped-list',
              title: 'Bookings',
              groups: [
                {
                  id: 'confirmations',
                  label: 'Confirmations',
                  items: [
                    { title: 'Hotel in Le Marais', subtitle: 'Direct booking', meta: 'Confirmation #M4221' },
                    { title: 'Mus\u00e9e d\u2019Orsay timed entry', subtitle: 'Official site', meta: 'Fri 10:00 AM' }
                  ]
                }
              ]
            }
          ],
          packing: [
            {
              kind: 'grouped-list',
              title: 'Packing',
              groups: [
                {
                  id: 'carry-on',
                  label: 'Carry-on',
                  items: [
                    { title: 'Umbrella', meta: 'Rain forecast Friday' },
                    { title: 'Museum shoes', meta: 'High walking day' }
                  ]
                }
              ]
            }
          ]
        }
      }
    ]
  },
  'research-notebook': {
    headline: 'A formal research report with section headers, prose paragraphs, and numbered footnotes linking to sources.',
    summary: 'Rendered as a readable document — headers, subheaders, flowing paragraphs, and a footnote list at the bottom.',
    sections: [
      {
        kind: 'hero',
        eyebrow: 'Research template',
        title: 'AI browser agents — state of the field',
        summary: 'Synthesized findings rendered as a formal report with inline citations and source footnotes.',
        chips: [chip('Formal report', 'accent'), chip('Inline citations'), chip('Source footnotes')],
        actions: [action('Ask follow-up', 'accent'), action('Export as PDF'), action('Add research note')]
      },
      {
        kind: 'report',
        title: 'Findings',
        body: `## Overview\n\nAutonomous browser agents have advanced rapidly since 2023, driven by improvements in multimodal reasoning and tool-use capabilities in large language models.<sup>1</sup> Current systems can complete multi-step web tasks — form filling, navigation, and information extraction — with meaningful success rates on established benchmarks.<sup>2</sup>\n\n## Key findings\n\n### Recovery behavior is the primary bottleneck\n\nAgents fail more often due to brittle error recovery than initial navigation errors. When an unexpected state is encountered mid-task, most systems either retry the same action or abort entirely rather than re-planning.<sup>1</sup>\n\n### Prompt sensitivity affects long-horizon tasks\n\nSmall variations in system prompt phrasing can materially distort agent behavior across multi-step tasks, suggesting that current models have not fully internalized robust planning priors.<sup>3</sup>\n\n## Outlook\n\nNear-term gains are expected from better grounding signals and memory architectures that allow agents to reference prior session context across task boundaries.`,
        footnotes: [
          { id: '1', label: 'AgentLab: Benchmarking LLM Agents on Real-World Tasks (2024)', url: 'https://example.com/agentlab' },
          { id: '2', label: 'WebArena: A Realistic Web Environment for Building Autonomous Agents (2023)', url: 'https://example.com/webarena' },
          { id: '3', label: 'Prompt Sensitivity in Long-Horizon Planning, NeurIPS Workshop (2024)', url: 'https://example.com/prompt-sensitivity' }
        ]
      }
    ]
  },
  'security-review-board': {
    headline: 'Full-width expandable findings grouped by severity: Affected Surface, Evidence, Remediate now / Ignore.',
    summary: 'Click any finding to expand. No right pane. Ignore removes it from the list; Remediate now prompts Hermes.',
    sections: [
      {
        kind: 'hero',
        eyebrow: 'Security template',
        title: 'Public webhook surface review',
        summary: 'Severity-grouped findings as expandable rows. One click reveals the full context and actions.',
        chips: [chip('Severity groups', 'accent'), chip('Expandable rows'), chip('Remediate now / Ignore')],
        actions: []
      },
      {
        kind: 'stats',
        items: [
          { label: 'Total risks', value: '4', action: 'Remediate all' },
          { label: 'Critical', value: '1', tone: 'danger', action: 'Remediate all' },
          { label: 'Medium', value: '2', tone: 'warning', action: 'Remediate all' },
          { label: 'Low', value: '1', tone: 'neutral', action: 'Remediate all' }
        ]
      },
      {
        kind: 'accordion-list',
        title: 'Findings by Severity',
        items: [
          {
            id: 'webhook-bypass',
            title: 'Webhook signature bypass on preview endpoint',
            subtitle: 'Fallback preview path accepts unauthenticated traffic when feature flag is misconfigured.',
            count: 'Critical',
            tone: 'danger' as const,
            detailHeader: 'Affected surface',
            detailText: 'Preview webhook fallback route \u2014 /api/webhooks/preview falls through to an unauthenticated handler when the preview feature flag is enabled without a valid HMAC configuration.',
            evidenceBullets: [
              'Replay fixture reached the fallback route without a valid signature.',
              'Header verification is skipped when the preview flag is misconfigured.',
              'No audit log entry is emitted for the bypass path.'
            ],
            actions: [action('Remediate now', 'accent'), action('Ignore', 'danger')]
          },
          {
            id: 'stack-traces',
            title: 'Verbose stack traces in bridge error body',
            subtitle: 'Leaks internal paths and token fragments on unhandled exceptions.',
            count: 'Medium',
            tone: 'warning' as const,
            detailHeader: 'Affected surface',
            detailText: 'Bridge HTTP error handler \u2014 all 5xx responses from the bridge include a raw stack trace in the JSON body visible to authenticated callers.',
            evidenceBullets: [
              'Stack trace captured from a live 503 response in staging.',
              'Trace includes absolute file paths and partial module names.'
            ],
            actions: [action('Remediate now', 'accent'), action('Ignore', 'danger')]
          },
          {
            id: 'oauth-tokens',
            title: 'Long-lived oauth state tokens',
            subtitle: 'OAuth state tokens do not expire and accumulate in the session store.',
            count: 'Medium',
            tone: 'warning' as const,
            detailHeader: 'Affected surface',
            detailText: 'OAuth initiation flow \u2014 state tokens written to the session store on /auth/start have no TTL and persist indefinitely.',
            evidenceBullets: [
              'State tokens from 30-day-old sessions still present in store.',
              'No cleanup job found in codebase.'
            ],
            actions: [action('Remediate now', 'accent'), action('Ignore', 'danger')]
          },
          {
            id: 'hsts',
            title: 'Missing HSTS header on marketing subdomain',
            subtitle: 'Defense-in-depth issue \u2014 not exploitable without MitM position.',
            count: 'Low',
            tone: 'neutral' as const,
            detailHeader: 'Affected surface',
            detailText: 'marketing.example.com \u2014 Strict-Transport-Security header is absent from all responses.',
            evidenceBullets: [
              'Header not observed in curl response from marketing CDN origin.'
            ],
            actions: [action('Remediate now', 'accent'), action('Ignore', 'danger')]
          }
        ]
      }
    ]
  },
  'vendor-evaluation-matrix': {
    headline: 'A generic comparison matrix for frameworks, vendors, technologies, apps, or products.',
    summary: 'Up to 5 columns including the Name / Item column, followed by a single recommendation pane.',
    sections: [
      {
        kind: 'hero',
        eyebrow: 'Comparison template',
        title: 'Frontend framework comparison',
        summary: 'Four frameworks compared across four stable criteria, capped at five total columns.',
        chips: [chip('Max 5 columns', 'accent'), chip('Recommendation pane'), chip('No top stats')],
        actions: []
      },
      {
        kind: 'comparison-table',
        title: '',
        columns: [
          { id: 'bundle', label: 'Bundle size' },
          { id: 'rendering', label: 'Rendering model' },
          { id: 'ecosystem', label: 'Ecosystem' },
          { id: 'learning', label: 'Learning curve' }
        ],
        rows: [
          {
            id: 'react',
            label: 'React',
            cells: [{ value: 'Medium' }, { value: 'Client + SSR' }, { value: 'Largest', tone: 'success' }, { value: 'Moderate' }]
          },
          {
            id: 'solid',
            label: 'SolidJS',
            cells: [{ value: 'Small', tone: 'success' }, { value: 'Fine-grained reactive' }, { value: 'Growing' }, { value: 'Moderate' }]
          },
          {
            id: 'svelte',
            label: 'Svelte',
            cells: [{ value: 'Small', tone: 'success' }, { value: 'Compile-time' }, { value: 'Healthy' }, { value: 'Gentle', tone: 'success' }]
          },
          {
            id: 'qwik',
            label: 'Qwik',
            cells: [{ value: 'Tiny (resumable)', tone: 'success' }, { value: 'Resumable SSR' }, { value: 'Early' }, { value: 'Steep', tone: 'warning' }]
          }
        ]
      },
      {
        kind: 'detail-panel',
        title: 'Recommendation',
        summary: 'For a new team prioritizing ecosystem depth and hiring, start with React. If bundle size is non-negotiable, SolidJS or Svelte are both strong and will likely feel lighter day-to-day.',
        fields: [
          { label: 'Top pick', value: 'React', chips: [chip('Recommended', 'success')] },
          { label: 'Runner-up', value: 'Svelte', chips: [chip('Great DX', 'accent')] }
        ]
      }
    ]
  },
  'event-planner': {
    headline: 'A persistent multi-tab planner for events that need venues, guests, logistics, and notes to stay separate.',
    summary: 'Stateful tabs: add/remove/rename guests, check off tasks, prompt Hermes for itinerary, and edit notes inline.',
    sections: [
      {
        kind: 'hero',
        eyebrow: 'Planning template',
        title: 'Team offsite planner',
        summary: 'Venue shortlist, interactive guest list, live checklist, Hermes-generated itinerary, and editable notes.',
        chips: [chip('Stateful tabs', 'accent'), chip('Interactive checklist'), chip('Editable guests')],
        actions: []
      },
      {
        kind: 'tabs',
        tabs: [
          { id: 'venues', label: 'Venues' },
          { id: 'guests', label: 'Guests' },
          { id: 'checklist', label: 'Checklist' },
          { id: 'itinerary', label: 'Itinerary' },
          { id: 'notes', label: 'Notes' },
        ],
        activeTabId: 'venues',
        panes: {
          venues: [
            {
              kind: 'card-grid',
              title: 'Venue shortlist',
              columns: 1,
              cards: [
                {
                  title: 'Greenpoint Loft',
                  subtitle: '70 capacity · indoor / outdoor',
                  price: '$4,800',
                  imageLabel: 'Industrial loft',
                  chips: [chip('Best fit', 'success')],
                  bullets: ['Great for workshop breakout rooms', 'Catering flexibility', 'Need AV confirmation']
                },
                {
                  title: 'Rooftop Union',
                  subtitle: '55 capacity · skyline view',
                  price: '$5,300',
                  imageLabel: 'Rooftop terrace',
                  chips: [chip('Higher wow factor', 'accent')],
                  bullets: ['Weather risk', 'Excellent transit access']
                }
              ]
            }
          ],
          guests: [
            {
              kind: 'interactive-guest-list',
              title: 'Guests',
              guests: [
                { id: 'g1', name: 'Alex Rivera', meta: 'Needs hotel block' },
                { id: 'g2', name: 'Jordan Kim', meta: 'Evening arrival' },
                { id: 'g3', name: 'Sam Patel' }
              ]
            }
          ],
          checklist: [
            {
              kind: 'interactive-checklist',
              title: 'Checklist',
              items: [
                { id: 'c1', label: 'Confirm AV quote', checked: false },
                { id: 'c2', label: 'Send dietary form', checked: true },
                { id: 'c3', label: 'Book hotel block', checked: false }
              ]
            }
          ],
          itinerary: [
            {
              kind: 'timeline',
              title: 'Run of show',
              items: [
                { title: 'Venue load-in', time: '9:00 AM', summary: 'Confirm AV and signage placement.' },
                { title: 'Team arrival', time: '10:00 AM', summary: 'Welcome desk and breakfast setup.' },
                { title: 'Afternoon breakout sessions', time: '1:30 PM', summary: 'Need room assignment confirmation.' }
              ]
            }
          ],
          notes: [
            {
              kind: 'editable-notes',
              title: 'Planning notes',
              notes: [
                'Prefer venue that handles breakout tables well.',
                'Keep catering flexible for dietary changes.'
              ]
            }
          ]
        }
      }
    ]
  },
  'job-search-pipeline': {
    headline: 'Job listings as a card grid — click any card to apply directly. Find more via Hermes.',
    summary: 'Each card shows a company photo or logo, role title, pay range, and location chips. The whole card is the Apply link.',
    sections: [
      {
        kind: 'hero',
        eyebrow: 'Jobs template',
        title: 'Senior product design openings',
        summary: 'Click any card to apply. Ask Hermes to find more roles.',
        chips: [chip('Clickable cards', 'accent'), chip('Card = Apply link'), chip('Find more')],
        actions: []
      },
      {
        kind: 'card-grid',
        title: 'Job listings',
        columns: 2,
        cards: [
          {
            title: 'Senior Product Designer',
            subtitle: 'Horizon Health',
            price: '$195k \u2013 $215k',
            imageLabel: 'Horizon Health',
            chips: [chip('Remote', 'accent'), chip('Full-time')]
          },
          {
            title: 'Staff Product Designer',
            subtitle: 'Northlane',
            price: '$180k \u2013 $195k',
            imageLabel: 'Northlane',
            chips: [chip('Hybrid'), chip('Full-time')]
          },
          {
            title: 'Product Designer — Growth',
            subtitle: 'Aster',
            price: '$175k \u2013 $190k',
            imageLabel: 'Aster',
            chips: [chip('Remote', 'accent'), chip('Full-time')]
          },
          {
            title: 'Product Designer',
            subtitle: 'Beacon',
            price: '$160k \u2013 $180k',
            imageLabel: 'Beacon',
            chips: [chip('SF / Remote'), chip('Full-time')]
          }
        ]
      }
    ]
  },
  'local-discovery-comparison': {
    headline: 'A flexible local-comparison template for nearby providers and venues that are not restaurants or hotels.',
    summary: 'It keeps contact actions visible and uses a stable list/detail frame without pretending to be a freeform map canvas.',
    sections: [
      {
        kind: 'hero',
        eyebrow: 'Travel template',
        title: 'Coworking spaces near SoHo',
        summary: 'Nearby providers compared on day pass pricing, atmosphere, and direct contact links.',
        chips: [chip('Local comparison', 'accent'), chip('Direct links'), chip('Saved shortlist')],
        actions: [action('Save place', 'accent'), action('Convert to event plan'), action('Ask Hermes for quieter options')]
      },
      {
        kind: 'filter-strip',
        filters: [chip('Within 15 min'), chip('Day pass under $45'), chip('Phone booth needed'), chip('Weekend access')],
        sortLabel: 'Sorted by fit and rating'
      },
      {
        kind: 'split',
        ratio: 'list-detail',
        left: [
          {
            kind: 'grouped-list',
            title: 'Results',
            groups: [
              {
                id: 'top',
                label: 'Top matches',
                tone: 'success',
                items: [
                  {
                    title: 'The Malin SoHo',
                    subtitle: 'Coworking · 4.8 ★',
                    meta: '$40 day pass · weekend access',
                    chips: [chip('Best fit', 'success')]
                  },
                  {
                    title: 'NeueHouse Madison',
                    subtitle: 'Creative workspace · 4.6 ★',
                    meta: '$45 day pass · phone booths',
                    chips: [chip('Slightly farther', 'warning')]
                  }
                ]
              }
            ]
          }
        ],
        right: [
          {
            kind: 'detail-panel',
            title: 'Selected place',
            eyebrow: 'The Malin SoHo',
            summary: 'Quiet workspace with strong design, booth availability, and a booking-ready day pass.',
            fields: [
              { label: 'Website', links: [{ label: 'Visit booking site', href: 'https://example.com/the-malin-soho' }] },
              {
                label: 'Contact',
                links: [
                  { label: 'Email concierge', href: 'mailto:concierge@example.com' },
                  { label: 'Call front desk', href: 'tel:+12125550100' }
                ]
              },
              {
                label: 'Why it fits',
                value: 'Best blend of calm atmosphere, reliable booth access, and quick walking distance from the target area.',
                fullWidth: true
              }
            ],
            actions: [action('Save place', 'accent'), action('Convert to event plan')]
          }
        ]
      }
    ]
  },
  'step-by-step-instructions': {
    headline: 'Checkable steps with code blocks, hyperlinks, and an Ask Hermes button that unlocks sequentially.',
    summary: 'Check off each step to mark it done. Steps with content highlight in gray; text-only steps strike through.',
    sections: [
      {
        kind: 'hero',
        eyebrow: 'How-to template',
        title: 'Connect Google Workspace to Hermes',
        summary: 'Set up OAuth credentials, run the auth flow, and verify the connection — all with checkable steps.',
        chips: [chip('Stateful checkboxes', 'accent'), chip('Code blocks'), chip('Sequential unlock')],
        actions: []
      },
      {
        kind: 'step-by-step-preview',
        prerequisites: [
          { id: 'p1', label: 'Hermes Bridge running on localhost:4000' },
          { id: 'p2', label: 'Google account with Workspace admin access' },
          { id: 'p3', label: 'Node.js 18+ installed' }
        ],
        steps: [
          {
            id: 's1',
            label: 'Create a Google Cloud project',
            detail: 'Open the [Google Cloud Console](https://console.cloud.google.com) and create a new project named **Hermes Workspace**. Copy the **Project ID** — you\'ll need it in the next step.'
          },
          {
            id: 's2',
            label: 'Enable the required APIs',
            detail: 'In the console, go to **APIs & Services → Library** and enable the following APIs:\n\n- Gmail API\n- Google Calendar API\n- Google Drive API'
          },
          {
            id: 's3',
            label: 'Create OAuth 2.0 credentials',
            detail: 'Navigate to **APIs & Services → Credentials → Create Credentials → OAuth Client ID**. Set application type to **Web application** and add this authorized redirect URI:',
            code: 'http://localhost:4000/auth/google/callback'
          },
          {
            id: 's4',
            label: 'Add credentials to your environment',
            detail: 'Copy the Client ID and Client Secret from the credentials page into your `.env` file:',
            code: 'GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com\nGOOGLE_CLIENT_SECRET=your-client-secret'
          },
          {
            id: 's5',
            label: 'Run the authorization command',
            code: 'hermes auth google'
          },
          {
            id: 's6',
            label: 'Complete the browser authorization',
            detail: 'A browser window will open automatically. Sign in with your Google Workspace account and grant Hermes the requested permissions. You will be redirected back to the bridge on success.'
          },
          {
            id: 's7',
            label: 'Verify the connection',
            detail: 'Confirm Hermes can reach your Google Workspace by running:',
            code: 'hermes workspace test --provider google'
          }
        ]
      }
    ]
  },
};
