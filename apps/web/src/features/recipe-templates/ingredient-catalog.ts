import type { RecipeTemplateSection } from '@hermes-recipes/protocol';

export type IngredientGroup = 'framing' | 'data' | 'detail' | 'composition' | 'media' | 'charts';

export interface Ingredient {
  id: string;
  kind: RecipeTemplateSection['kind'];
  name: string;
  group: IngredientGroup;
  summary: string;
  whenToUse: string;
  example: RecipeTemplateSection;
}

const sampleImageSrc = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=640&q=60';

const barData = [
  { label: 'Jan', revenue: 32, costs: 18 },
  { label: 'Feb', revenue: 45, costs: 22 },
  { label: 'Mar', revenue: 52, costs: 25 },
  { label: 'Apr', revenue: 40, costs: 21 },
  { label: 'May', revenue: 58, costs: 28 }
];

const lineData = [
  { day: 'Mon', users: 320 },
  { day: 'Tue', users: 412 },
  { day: 'Wed', users: 395 },
  { day: 'Thu', users: 480 },
  { day: 'Fri', users: 530 },
  { day: 'Sat', users: 610 },
  { day: 'Sun', users: 590 }
];

const timeSeriesData = [
  { timestamp: '09:00', latency: 120, errors: 2 },
  { timestamp: '10:00', latency: 135, errors: 1 },
  { timestamp: '11:00', latency: 180, errors: 4 },
  { timestamp: '12:00', latency: 220, errors: 6 },
  { timestamp: '13:00', latency: 165, errors: 3 },
  { timestamp: '14:00', latency: 140, errors: 2 }
];

export const INGREDIENT_CATALOG: Ingredient[] = [
  {
    id: 'hero',
    kind: 'hero',
    name: 'Hero',
    group: 'framing',
    summary: 'Top-of-recipe headline block with eyebrow, title, summary, chips, and actions.',
    whenToUse: 'Lead a recipe with a clear purpose statement and primary call-to-action.',
    example: {
      slotId: 'example-hero',
      kind: 'hero',
      eyebrow: 'Shopping',
      title: 'Best wireless earbuds under $200',
      summary: 'Compared 8 models across 4 merchants. Pricing last verified 10 minutes ago.',
      chips: [
        { label: 'Noise cancelling', tone: 'accent' },
        { label: 'Under $200', tone: 'neutral' }
      ],
      actions: [{ kind: 'link', label: 'See methodology', href: '#', openInNewTab: true }]
    }
  },
  {
    id: 'filter-strip',
    kind: 'filter-strip',
    name: 'Filter strip',
    group: 'framing',
    summary: 'Horizontal chip row for quick filter toggles and sort labels.',
    whenToUse: 'Offer quick filtering when users are browsing a list or grid.',
    example: {
      slotId: 'example-filter-strip',
      kind: 'filter-strip',
      title: 'Filter results',
      filters: [
        { label: 'Open now', tone: 'success' },
        { label: '< 20 min walk', tone: 'neutral' },
        { label: 'Vegetarian', tone: 'accent' }
      ],
      sortLabel: 'Sort: Best match'
    }
  },
  {
    id: 'action-bar',
    kind: 'action-bar',
    name: 'Action bar',
    group: 'framing',
    summary: 'Row of primary and secondary buttons attached to a section.',
    whenToUse: 'Expose bulk actions or global controls at the top or bottom of a view.',
    example: {
      slotId: 'example-action-bar',
      kind: 'action-bar',
      title: 'Quick actions',
      actions: [
        { kind: 'link', label: 'Export CSV', href: '#', openInNewTab: true },
        { kind: 'link', label: 'Share', href: '#', openInNewTab: true }
      ]
    }
  },
  {
    id: 'stats',
    kind: 'stats',
    name: 'Stats',
    group: 'data',
    summary: 'KPI tiles with label, value, optional helper text, and tone.',
    whenToUse: 'Summarize counts, totals, or averages at a glance.',
    example: {
      slotId: 'example-stats',
      kind: 'stats',
      title: 'This month',
      items: [
        { label: 'Active users', value: '14,208', helper: '+12% vs last month', tone: 'success' },
        { label: 'Retention', value: '64%', helper: 'Rolling 30 days' },
        { label: 'Open issues', value: '37', tone: 'warning' }
      ]
    }
  },
  {
    id: 'comparison-table',
    kind: 'comparison-table',
    name: 'Comparison table',
    group: 'data',
    summary: 'Tabular comparison with labelled columns, typed cells, and optional leading images per row.',
    whenToUse: 'Compare options side-by-side — products, vendors, plans.',
    example: {
      slotId: 'example-comparison-table',
      kind: 'comparison-table',
      title: 'Laptop deals this week',
      columns: [
        { id: 'price', label: 'Price', align: 'end' },
        { id: 'stock', label: 'In stock', align: 'start' },
        { id: 'ship', label: 'Shipping', align: 'start' }
      ],
      rows: [
        {
          id: 'bestbuy',
          label: 'Best Buy',
          cells: [
            { value: '$1,299', emphasis: true, tone: 'success' },
            { value: 'Yes', emphasis: false },
            { value: 'Free', subvalue: '2-day', emphasis: false }
          ],
          actions: []
        },
        {
          id: 'amazon',
          label: 'Amazon',
          cells: [
            { value: '$1,329', emphasis: false },
            { value: 'Yes', emphasis: false },
            { value: '$9.99', subvalue: 'Prime', emphasis: false }
          ],
          actions: []
        },
        {
          id: 'newegg',
          label: 'Newegg',
          cells: [
            { value: '$1,349', emphasis: false },
            { value: 'Limited', emphasis: false, tone: 'warning' },
            { value: '$14.99', emphasis: false }
          ],
          actions: []
        }
      ],
      footerChips: [{ label: 'Prices updated 2 min ago', tone: 'neutral' }]
    }
  },
  {
    id: 'grouped-list',
    kind: 'grouped-list',
    name: 'Grouped list',
    group: 'data',
    summary: 'Items bucketed into labelled groups with optional tone per group.',
    whenToUse: 'Organize items by sender, status, category, or severity.',
    example: {
      slotId: 'example-grouped-list',
      kind: 'grouped-list',
      title: 'Unread by sender',
      groups: [
        {
          id: 'github',
          label: 'GitHub',
          tone: 'accent',
          items: [
            { title: 'PR #412 ready for review', subtitle: 'openai/openai-sdk', chips: [{ label: 'Review', tone: 'accent' }], actions: [] },
            { title: 'Build failed on main', subtitle: 'ci pipeline', chips: [{ label: 'Failed', tone: 'danger' }], actions: [] }
          ]
        },
        {
          id: 'newsletter',
          label: 'Newsletters',
          items: [
            { title: 'Weekly digest · Frontend Focus', subtitle: '', chips: [], actions: [] },
            { title: 'Product updates · Stripe', subtitle: '', chips: [], actions: [] }
          ]
        }
      ]
    }
  },
  {
    id: 'card-grid',
    kind: 'card-grid',
    name: 'Card grid',
    group: 'data',
    summary: 'Tiled cards with optional image, chips, price, and bullets.',
    whenToUse: 'Show a wide variety of visual items — products, places, gifts.',
    example: {
      slotId: 'example-card-grid',
      kind: 'card-grid',
      title: 'Shopping results',
      columns: 2,
      cards: [
        {
          id: 'c1',
          title: 'Sony WH-1000XM5',
          subtitle: 'Wireless noise cancelling',
          price: '$398',
          chips: [{ label: 'Top pick', tone: 'success' }],
          bullets: ['30-hour battery', 'Industry-leading ANC'],
          image: {
            src: sampleImageSrc,
            alt: 'Headphones',
            borderRadius: 'md',
            border: 'none',
            aspect: 'video',
            fit: 'cover'
          },
          actions: []
        },
        {
          id: 'c2',
          title: 'Bose QuietComfort Ultra',
          subtitle: 'Spatial audio',
          price: '$429',
          chips: [{ label: 'Premium', tone: 'accent' }],
          bullets: ['Immersive audio', 'Comfortable fit'],
          actions: []
        }
      ]
    }
  },
  {
    id: 'detail-panel',
    kind: 'detail-panel',
    name: 'Detail panel',
    group: 'detail',
    summary: 'Structured block of fields, chips, and a contextual note.',
    whenToUse: 'Show the full detail of a single selected item.',
    example: {
      slotId: 'example-detail-panel',
      kind: 'detail-panel',
      title: 'Koreatown Kitchen',
      eyebrow: 'Restaurant',
      summary: 'Family-run Korean BBQ, walk-in friendly before 6pm.',
      chips: [
        { label: 'Open now', tone: 'success' },
        { label: '$$', tone: 'neutral' }
      ],
      fields: [
        { label: 'Hours', value: '11:00 – 23:00', chips: [], bullets: [], links: [], fullWidth: false },
        { label: 'Phone', value: '(415) 555-0123', chips: [], bullets: [], links: [], fullWidth: false },
        { label: 'Specialties', value: '', chips: [], bullets: ['Galbi', 'Dolsot bibimbap', 'Jeon'], links: [], fullWidth: true }
      ],
      actions: [],
      note: 'Reservations recommended for parties over 4.',
      noteTitle: 'Tip'
    }
  },
  {
    id: 'timeline',
    kind: 'timeline',
    name: 'Timeline',
    group: 'detail',
    summary: 'Time-ordered list of items with titles and summaries.',
    whenToUse: 'Show a trip itinerary, an incident timeline, or a release history.',
    example: {
      slotId: 'example-timeline',
      kind: 'timeline',
      title: 'Trip itinerary · Day 1',
      items: [
        { title: 'Arrive SFO', time: '09:45', summary: 'United 225 from JFK', chips: [], actions: [] },
        { title: 'Hotel check-in', time: '12:00', summary: 'Hotel Zoe, Fisherman\u2019s Wharf', chips: [], actions: [] },
        { title: 'Lunch', time: '13:30', summary: 'Swan Oyster Depot', chips: [{ label: 'Booked', tone: 'success' }], actions: [] }
      ]
    }
  },
  {
    id: 'notes',
    kind: 'notes',
    name: 'Notes',
    group: 'detail',
    summary: 'Free-form bulleted lines for operator commentary.',
    whenToUse: 'Capture caveats, observations, or follow-ups that don\u2019t fit structured fields.',
    example: {
      slotId: 'example-notes',
      kind: 'notes',
      title: 'Notes',
      lines: [
        'Vendor pricing last refreshed 3 minutes ago.',
        'Best Buy has a 15% coupon if you sign up for their newsletter.'
      ],
      actions: []
    }
  },
  {
    id: 'activity-log',
    kind: 'activity-log',
    name: 'Activity log',
    group: 'detail',
    summary: 'Compact audit entries with label, detail, and timestamp.',
    whenToUse: 'Show recent changes, audits, or recipe events.',
    example: {
      slotId: 'example-activity-log',
      kind: 'activity-log',
      title: 'Recent activity',
      entries: [
        { label: 'Price updated', detail: 'Sony WH-1000XM5 dropped from $429 to $398', timestamp: '2 min ago', tone: 'success' },
        { label: 'New review', detail: 'The Verge · 4.5/5', timestamp: '12 min ago', tone: 'neutral' },
        { label: 'Stock warning', detail: 'Newegg flagged Limited', timestamp: '28 min ago', tone: 'warning' }
      ]
    }
  },
  {
    id: 'kanban',
    kind: 'kanban',
    name: 'Kanban board',
    group: 'data',
    summary: 'Columns of cards with optional tone per column.',
    whenToUse: 'Track workflow stages — job pipeline, security triage, content status.',
    example: {
      slotId: 'example-kanban',
      kind: 'kanban',
      title: 'Job pipeline',
      columns: [
        {
          label: 'Applied',
          tone: 'neutral',
          cards: [
            { title: 'Stripe · Senior engineer', subtitle: 'Applied 3 days ago', chips: [], actions: [] },
            { title: 'Linear · Product engineer', subtitle: 'Applied 5 days ago', chips: [], actions: [] }
          ]
        },
        {
          label: 'Interviewing',
          tone: 'accent',
          cards: [
            { title: 'Vercel · Staff engineer', subtitle: 'Onsite scheduled Fri', chips: [{ label: 'Onsite', tone: 'accent' }], actions: [] }
          ]
        },
        {
          label: 'Offer',
          tone: 'success',
          cards: [
            { title: 'Anthropic · Member of technical staff', subtitle: 'Offer received', chips: [{ label: 'Offer', tone: 'success' }], actions: [] }
          ]
        }
      ]
    }
  },
  {
    id: 'confirmation',
    kind: 'confirmation',
    name: 'Confirmation',
    group: 'composition',
    summary: 'Inline prompt with primary/secondary actions and tone.',
    whenToUse: 'Prompt the user to confirm or cancel a potentially destructive action.',
    example: {
      slotId: 'example-confirmation',
      kind: 'confirmation',
      title: 'Archive 23 newsletters?',
      message: 'This moves them out of your inbox but keeps them searchable.',
      confirmAction: { kind: 'link', label: 'Archive', href: '#', openInNewTab: false },
      secondaryAction: { kind: 'link', label: 'Cancel', href: '#', openInNewTab: false },
      tone: 'warning'
    }
  },
  {
    id: 'split',
    kind: 'split',
    name: 'Split layout',
    group: 'composition',
    summary: 'Two-column container holding other sections (list/detail, balanced, detail/list).',
    whenToUse: 'Show a list alongside a detail panel without leaving the page.',
    example: {
      slotId: 'example-split',
      kind: 'split',
      title: 'Nearby restaurants',
      ratio: 'list-detail',
      left: [
        {
          slotId: 'example-split-left',
          kind: 'grouped-list',
          title: 'Matches',
          groups: [
            {
              id: 'nearby',
              label: 'Nearby',
              items: [
                { title: 'Koreatown Kitchen', subtitle: '0.4 mi · $$', chips: [{ label: 'Open', tone: 'success' }], actions: [] },
                { title: 'Trestle', subtitle: '0.6 mi · $$$', chips: [], actions: [] }
              ]
            }
          ]
        }
      ],
      right: [
        {
          slotId: 'example-split-right',
          kind: 'detail-panel',
          title: 'Trestle',
          eyebrow: 'Restaurant',
          summary: 'Prix-fixe New American, seasonal menu.',
          chips: [{ label: '$$$', tone: 'neutral' }],
          fields: [
            { label: 'Hours', value: '17:30 – 22:00', chips: [], bullets: [], links: [], fullWidth: false },
            { label: 'Reservations', value: 'Resy', chips: [], bullets: [], links: [], fullWidth: false }
          ],
          actions: []
        }
      ]
    }
  },
  {
    id: 'tabs',
    kind: 'tabs',
    name: 'Tabs',
    group: 'composition',
    summary: 'Tabbed container holding nested sections per pane.',
    whenToUse: 'Switch between alternative views — e.g. outbound vs. return flights.',
    example: {
      slotId: 'example-tabs',
      kind: 'tabs',
      title: 'Flight options',
      tabs: [
        { id: 'outbound', label: 'Outbound', badge: '3 options' },
        { id: 'return', label: 'Return', badge: '3 options' }
      ],
      activeTabId: 'outbound',
      panes: {
        outbound: [
          {
            slotId: 'example-tabs-outbound',
            kind: 'comparison-table',
            title: 'SFO \u2192 JFK \u00b7 Jun 14',
            columns: [
              { id: 'carrier', label: 'Carrier', align: 'start' },
              { id: 'depart', label: 'Depart', align: 'start' },
              { id: 'price', label: 'Price', align: 'end' }
            ],
            rows: [
              { id: 'ua', label: 'United', cells: [{ value: 'United', emphasis: false }, { value: '07:30', emphasis: false }, { value: '$289', emphasis: true, tone: 'success' }], actions: [] },
              { id: 'dl', label: 'Delta', cells: [{ value: 'Delta', emphasis: false }, { value: '09:15', emphasis: false }, { value: '$312', emphasis: false }], actions: [] },
              { id: 'aa', label: 'American', cells: [{ value: 'American', emphasis: false }, { value: '11:00', emphasis: false }, { value: '$298', emphasis: false }], actions: [] }
            ],
            footerChips: []
          }
        ],
        return: [
          {
            slotId: 'example-tabs-return',
            kind: 'comparison-table',
            title: 'JFK \u2192 SFO \u00b7 Jun 21',
            columns: [
              { id: 'carrier', label: 'Carrier', align: 'start' },
              { id: 'depart', label: 'Depart', align: 'start' },
              { id: 'price', label: 'Price', align: 'end' }
            ],
            rows: [
              { id: 'dl-ret', label: 'Delta', cells: [{ value: 'Delta', emphasis: false }, { value: '08:00', emphasis: false }, { value: '$264', emphasis: true, tone: 'success' }], actions: [] },
              { id: 'aa-ret', label: 'American', cells: [{ value: 'American', emphasis: false }, { value: '12:45', emphasis: false }, { value: '$281', emphasis: false }], actions: [] },
              { id: 'ua-ret', label: 'United', cells: [{ value: 'United', emphasis: false }, { value: '18:20', emphasis: false }, { value: '$275', emphasis: false }], actions: [] }
            ],
            footerChips: []
          }
        ]
      }
    }
  },
  {
    id: 'checklist',
    kind: 'checklist',
    name: 'Checklist',
    group: 'detail',
    summary: 'Prerequisites plus a numbered list of steps with detail and checkbox state.',
    whenToUse: 'Give the user step-by-step instructions with trackable completion.',
    example: {
      slotId: 'example-checklist',
      kind: 'checklist',
      title: 'Deploy to production',
      prerequisites: ['Green CI on main', 'Migration tested on staging'],
      steps: [
        { id: 's1', label: 'Tag the release', detail: 'git tag v0.4.0 && git push --tags', checked: true },
        { id: 's2', label: 'Run the production migration', detail: 'pnpm run migrate:prod', checked: true },
        { id: 's3', label: 'Deploy the bridge', detail: 'pnpm --filter bridge deploy', checked: false },
        { id: 's4', label: 'Smoke-test the deploy', detail: 'Visit /health and confirm 200', checked: false }
      ],
      actions: []
    }
  },
  {
    id: 'image',
    kind: 'image',
    name: 'Image',
    group: 'media',
    summary: 'Standalone image with border, radius, aspect, and optional caption.',
    whenToUse: 'Show a key product photo, location shot, or reference image.',
    example: {
      slotId: 'example-image',
      kind: 'image',
      title: 'Featured photo',
      image: {
        src: sampleImageSrc,
        alt: 'Forest path in late afternoon light',
        caption: 'Photo: Unsplash · Muir Woods, CA',
        borderRadius: 'md',
        border: 'subtle',
        aspect: 'video',
        fit: 'cover'
      }
    }
  },
  {
    id: 'audio',
    kind: 'audio',
    name: 'Audio',
    group: 'media',
    summary: 'Inline audio player with optional subtitle and transcript.',
    whenToUse: 'Attach a voice note, podcast clip, or recorded call.',
    example: {
      slotId: 'example-audio',
      kind: 'audio',
      title: 'Voice memo · Meeting recap',
      subtitle: 'Recorded 2026-04-19 · 1:24',
      src: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
      transcript: 'Quick recap: we aligned on the Q2 launch date, agreed to deprioritize the billing rework, and assigned Jamie to draft the release notes.'
    }
  },
  {
    id: 'bar-chart',
    kind: 'bar-chart',
    name: 'Bar chart',
    group: 'charts',
    summary: 'Categorical comparison across one or more series. Supports vertical/horizontal and stacked variants.',
    whenToUse: 'Compare totals across a handful of categories.',
    example: {
      slotId: 'example-bar-chart',
      kind: 'bar-chart',
      title: 'Monthly revenue vs. costs',
      xKey: 'label',
      series: [
        { id: 'revenue', label: 'Revenue', tone: 'success' },
        { id: 'costs', label: 'Costs', tone: 'warning' }
      ],
      data: barData,
      orientation: 'vertical',
      stacked: false,
      valueFormat: 'currency'
    }
  },
  {
    id: 'line-chart',
    kind: 'line-chart',
    name: 'Line chart',
    group: 'charts',
    summary: 'Trend across an ordered x-axis. Smooth or linear interpolation.',
    whenToUse: 'Show a trend across time buckets or an ordered dimension.',
    example: {
      slotId: 'example-line-chart',
      kind: 'line-chart',
      title: 'Daily active users',
      xKey: 'day',
      series: [{ id: 'users', label: 'Users', tone: 'accent' }],
      data: lineData,
      smooth: true,
      valueFormat: 'number'
    }
  },
  {
    id: 'pie-chart',
    kind: 'pie-chart',
    name: 'Pie / donut chart',
    group: 'charts',
    summary: 'Proportional breakdown of a whole. Pie or donut variant.',
    whenToUse: 'Show relative shares that sum to a meaningful whole.',
    example: {
      slotId: 'example-pie-chart',
      kind: 'pie-chart',
      title: 'Q1 sales by region',
      variant: 'donut',
      valueFormat: 'percent',
      data: [
        { id: 'na', label: 'North America', value: 42, tone: 'accent' },
        { id: 'eu', label: 'Europe', value: 28, tone: 'success' },
        { id: 'apac', label: 'APAC', value: 18, tone: 'warning' },
        { id: 'row', label: 'Rest of world', value: 12, tone: 'neutral' }
      ]
    }
  },
  {
    id: 'time-series',
    kind: 'time-series',
    name: 'Time series',
    group: 'charts',
    summary: 'Time-ordered metric with one or more series. Good for latency/error streams.',
    whenToUse: 'Plot a metric against timestamps — latency, error rate, price.',
    example: {
      slotId: 'example-time-series',
      kind: 'time-series',
      title: 'API latency (p95, ms)',
      xKey: 'timestamp',
      series: [
        { id: 'latency', label: 'p95 latency', tone: 'accent' },
        { id: 'errors', label: 'Errors', tone: 'danger' }
      ],
      data: timeSeriesData,
      valueFormat: 'number'
    }
  }
];

export const INGREDIENT_GROUPS: Array<{ id: IngredientGroup | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'framing', label: 'Framing' },
  { id: 'data', label: 'Data' },
  { id: 'detail', label: 'Detail' },
  { id: 'composition', label: 'Composition' },
  { id: 'media', label: 'Media' },
  { id: 'charts', label: 'Charts' }
];

export function getIngredientById(id: string): Ingredient | undefined {
  return INGREDIENT_CATALOG.find((ingredient) => ingredient.id === id);
}
