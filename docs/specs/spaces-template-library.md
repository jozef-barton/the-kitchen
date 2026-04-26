# Spaces Template Library

> **Status:** This document defines the target first-set catalog of 20 templates and the framework they share. The set actually wired up in production may lag this catalog at any given time — the recipe template registry under `apps/bridge/src/services/recipes/` is the source of truth for what currently ships.

## Purpose

The top-level `Spaces` page is now a curated template gallery and pattern library.
It is not a freeform runtime layout generator.
It exists so Hermes Home can move toward:

1. strong reusable primitives
2. excellent curated templates
3. controlled Hermes template selection and filling later

This document defines the common framework, the quality bar, and the first 20 templates.

## Core direction

- Templates are deterministic and local.
- Preview rendering is built from shared primitives, not one-off runtime JSX blobs.
- Hermes will eventually select a template id and fill structured data into it.
- Hermes should not invent new layouts at runtime.
- Updates should patch existing template state whenever the use case is unchanged.

## Common framework

### Registry

Each template entry carries:

- identity: `id`, `name`, `category`, `useCase`, `purpose`
- decision metadata: `primaryUserGoal`, `whenHermesShouldChoose`, `selectionSignals`
- UI contract: `preferredLayout`, `supportedTabs`, `requiredSections`, `optionalSections`, `requiredActions`, `optionalActions`
- data contract: `idealDataShape`
- states: empty, loading, error/degraded behavior
- population contract: explicit later-Hermes instructions and guardrails
- update contract: patch-vs-replace rules, persisted state, stable regions
- preview fixture: deterministic example state used by the gallery and tests

### Primitive layer

Templates compose from a small opinionated primitive set:

- section header
- stat strip
- filter strip
- action bar
- grouped list
- card grid
- comparison table
- detail panel
- timeline
- notes panel
- activity log
- kanban board
- confirmation block
- empty/loading/error blocks
- split panes
- tab rail

### Quality bar

- small-pane friendly first
- reduced radius and dense spacing consistent with Hermes Home
- distinct information architecture across template families
- clear, direct actions
- stable tabs and regions across updates
- no generic “admin sludge” card soup

## Update philosophy

Unless the use case changes materially:

- keep the same template
- keep the same tabs
- patch rows/cards/items in place
- preserve saved selections, notes, checklist completion, and filters where reasonable
- append results when new data arrives instead of rewriting the whole preview state

Replace whole regions only when the underlying intent changes, such as moving from restaurant search to hotel planning or from vendor evaluation to shopping comparison.

## Template catalog

### 1. Price Comparison Grid

- Why it exists: product comparisons need merchant columns, landed-price clarity, and stable row identity.
- Look and feel: dense merchant matrix, pinned stats, shopping-comparison energy without marketplace clutter.
- References: Google Shopping, Amazon compare tables, procurement scorecards.
- Later Hermes fill: create one canonical product row per compared item and normalize merchant offers into fixed columns.
- Update stability: patch merchant cells, shipping, and availability in place; preserve row order, notes, and merchant preferences.

### 2. Shopping Shortlist

- Why it exists: not every shopping decision should become a comparison table.
- Look and feel: visual shortlist cards, quick reasons, and clear shortlist notes.
- References: saved-items collections, premium commerce category cards.
- Later Hermes fill: add one card per serious candidate, with price, highlights, and a short “why it made the cut” note.
- Update stability: patch price and highlights in place; preserve pinned items, shortlist notes, and manual removals.

### 3. Inbox Triage Board

- Why it exists: inbox cleanup is usually sender- and bucket-oriented, not thread-oriented.
- Look and feel: grouped sender lanes, counts, and a safe selected-sender preview.
- References: Gmail triage patterns, moderation/admin queues.
- Later Hermes fill: cluster senders, expose message counts and safe bulk actions, and keep one selected sender detail block.
- Update stability: patch counts and previews in place; preserve selected sender, collapsed groups, and acknowledged decisions.

### 4. Inbox Rules Builder

- Why it exists: rule maintenance should feel like approving automation, not editing raw config.
- Look and feel: current rules on one side, suggested rules plus impact preview on the other, with a confirmation block.
- References: Gmail filters/settings, automation review panels.
- Later Hermes fill: separate current rules from suggestions and attach impact estimates to each suggestion.
- Update stability: patch suggestion wording and impact counts in place; preserve dismissed suggestions and manual notes.

### 5. Restaurant Finder

- Why it exists: dining search needs list/detail focus, not a generic comparison table.
- Look and feel: local-search list, cuisine and price filters, reservation-ready detail panel.
- References: Yelp, Google Maps result lists, OpenTable.
- Later Hermes fill: populate result rows with cuisine, price, rating, hours, and direct menu/booking links.
- Update stability: patch venue rows and detail fields in place; preserve selected venue, saved items, and active filters.

### 6. Hotel Shortlist

- Why it exists: hotel decisions blend price, location, amenities, and note-taking over time.
- Look and feel: hospitality cards with notes and link tabs, tuned for trip planning.
- References: Booking, Airbnb shortlist flows, TripAdvisor.
- Later Hermes fill: create one property card per hotel with nightly price, neighborhood summary, amenity highlights, and booking links.
- Update stability: patch prices and amenities in place; preserve favorite choice, notes, and tab structure.

### 7. Flight Comparison

- Why it exists: outbound and return legs should not collapse into one ambiguous itinerary blob.
- Look and feel: route-focused tabs with compact flight rows and fare caveats.
- References: Kayak, Google Flights.
- Later Hermes fill: keep outbound and return results separate, with price, stops, duration, airline, and booking actions.
- Update stability: patch only the affected leg; preserve selected leg, saved itinerary, notes, and active filters.

### 8. Travel Itinerary Planner

- Why it exists: trips need a stable home for chronology, bookings, packing, notes, and links.
- Look and feel: notebook-style trip planner with a strong timeline and logistics tabs.
- References: travel itinerary apps, planning notebooks.
- Later Hermes fill: use itinerary for dated events, bookings for confirmations, packing for checklist items, and links for external references.
- Update stability: append itinerary events and bookings; preserve selected tab, checklist completion, and notes.

### 9. Research Notebook

- Why it exists: sources, extracted claims, and operator notes should not live in one long markdown dump.
- Look and feel: tabbed notebook with sources, notes, extracted points, and follow-up prompts.
- References: Notion, Obsidian, Apple Notes.
- Later Hermes fill: keep raw sources separate from extracted points and follow-up asks.
- Update stability: append sources and claims; preserve operator notes, pinned findings, and selected tab.

### 10. Coding Workbench

- Why it exists: engineering work needs evidence, plan, tasks, and risks kept in separate but connected lanes.
- Look and feel: repository review mixed with execution planning, compact and direct.
- References: GitHub review surfaces, Linear planning pages, IDE side panels.
- Later Hermes fill: findings get evidence, tasks get discrete execution items, risks get explicit uncertainty or regression notes.
- Update stability: append findings, patch task state, and extend plan notes; preserve completed tasks, pinned risks, and tab structure.

### 11. Security Review Board

- Why it exists: security review is severity-first and evidence-heavy.
- Look and feel: severity groups, evidence detail, remediation actions, and status tracking.
- References: security triage dashboards, audit boards.
- Later Hermes fill: group findings by severity, attach concise evidence, and track remediation separately from narrative.
- Update stability: patch status and remediation in place; preserve owners, selected finding, and verification notes.

### 12. Vendor Evaluation Matrix

- Why it exists: vendor and tool selection needs weighted criteria, not just cards or notes.
- Look and feel: clean matrix with explicit criteria, pricing, and decision notes.
- References: procurement scorecards, evaluation spreadsheets.
- Later Hermes fill: use fixed criteria columns, normalized pricing summaries, and concise vendor notes.
- Update stability: patch cells and weights in place; preserve manual weighting, notes, and vendor ordering.

### 13. CRM Pipeline

- Why it exists: stage-driven contact work should feel like a real pipeline, not a task list.
- Look and feel: compact stage columns with a strong detail panel and recent activity.
- References: HubSpot, Pipedrive, Trello-style boards.
- Later Hermes fill: create one card per lead or opportunity and attach next-step context in the detail panel.
- Update stability: move only changed cards between stages; preserve selected lead, notes, and owner state.

### 14. Support Queue

- Why it exists: ticket backlogs need urgency, aging, and owner clarity at a glance.
- Look and feel: grouped queue lanes, bulk actions, and one focused ticket pane.
- References: shared support inboxes, operations triage boards.
- Later Hermes fill: group tickets by severity or status, expose owner and age in each row, and keep bulk actions explicit.
- Update stability: patch ticket rows and owner assignments in place; preserve selected ticket and bulk selection.

### 15. Subscription Audit

- Why it exists: recurring subscriptions call for explicit keep/cancel/review decisions and spend totals.
- Look and feel: decision tabs with totals pinned above and a durable notes lane.
- References: subscription managers, personal finance dashboards.
- Later Hermes fill: bucket subscriptions into keep, cancel, and review with monthly/annual totals.
- Update stability: move only changed services between tabs; preserve manual decisions, notes, and selected tab.

### 16. Recurring Charges Workspace

- Why it exists: merchant-level charge investigation is different from subscription cleanup.
- Look and feel: merchant groups, trend summaries, and follow-up/dispute actions.
- References: finance transaction explorers, Stripe-like merchant review patterns.
- Later Hermes fill: group charges by merchant, summarize cadence and amount trend, and surface categorization or dispute actions.
- Update stability: patch merchant metrics and notes in place; preserve selected merchant and investigation state.

### 17. Event Planner

- Why it exists: events need venues, guests, checklist state, notes, and links to stay separate and persistent.
- Look and feel: planning notebook with strong tab discipline and checklist clarity.
- References: project planner/checklist apps, event coordination tools.
- Later Hermes fill: keep venues, guests, checklist, notes, and links in dedicated tabs.
- Update stability: append checklist items and venue updates; preserve checklist completion, notes, and selected tab.

### 18. Job Search Pipeline

- Why it exists: applications and interview stages behave like a pipeline with prep context.
- Look and feel: stage board plus salary/location detail and prep actions.
- References: applicant tracking boards, CRM-style stages.
- Later Hermes fill: represent each role/company as one card and keep salary, location, and next steps in the detail panel.
- Update stability: move cards between stages as interviews progress; preserve prep notes, pinned companies, and selected application.

### 19. Content / Campaign Planner

- Why it exists: content operations need idea, draft, schedule, and asset structure that survives iteration.
- Look and feel: editorial workflow with tabbed lanes and compact status chips.
- References: editorial planners, campaign boards, kanban workflows.
- Later Hermes fill: ideas, drafts, schedule, and assets each get stable tabs rather than one blended content list.
- Update stability: patch status and schedule items in place; preserve asset links, notes, and curated card ordering.

### 20. Local Discovery Comparison

- Why it exists: not every nearby comparison is a restaurant or hotel.
- Look and feel: flexible list/detail local-search frame with direct website/contact actions.
- References: local directories, marketplace browse patterns, map result lists.
- Later Hermes fill: populate one row per place or provider with category-relevant attributes and direct contact links.
- Update stability: patch results in place; preserve selected place, saved options, notes, and filters.

## Future Hermes integration hook

When controlled template selection lands, Hermes should only need to return:

- template id
- structured content matching the template’s expected data shape
- bounded updates against stable regions

Hermes should not be responsible for:

- inventing layout primitives
- inventing new tabs or sections unless the template contract allows it
- rewriting the full workspace when a patch is sufficient
- emitting arbitrary UI code
