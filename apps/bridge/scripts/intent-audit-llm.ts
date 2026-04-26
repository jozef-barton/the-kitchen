/**
 * Intent classifier comparison audit.
 * Usage: pnpm tsx apps/bridge/scripts/intent-audit-llm.ts
 *
 * Tests both the regex classifier and LLM classifier against 200 queries
 * (100 original + 100 natural-language variations) and prints a comparison.
 */

import { classifyStructuredRecipeIntent } from '../src/hermes-cli/client';
/* eslint-disable no-console */
import {
  classifyStructuredRecipeIntentLLM,
  readHermesProviderConfig,
} from '../src/hermes-cli/intent-classifier-llm';

interface Case {
  id: number;
  query: string;
  expected: string | null;
  suite: 'original' | 'variation';
}

// ---------------------------------------------------------------------------
// Original 100 cases (same expected labels as the regex audit)
// ---------------------------------------------------------------------------

const ORIGINAL: Case[] = [
  // Inbox triage
  { id: 1,   query: "Sort through my unread Slack messages and flag the ones that need a reply today", expected: "inbox triage", suite: 'original' },
  { id: 2,   query: "Triage my support tickets and label them by urgency", expected: "inbox triage", suite: 'original' },
  { id: 3,   query: "Review these 30 job applications and rank them by fit", expected: "inbox triage", suite: 'original' },
  { id: 4,   query: "I have 50 GitHub issues — which ones need attention first?", expected: "inbox triage", suite: 'original' },
  { id: 5,   query: "Go through these customer feedback submissions and categorize by sentiment", expected: "inbox triage", suite: 'original' },
  { id: 6,   query: "I have 20 pull requests open — prioritize them for review", expected: "inbox triage", suite: 'original' },
  { id: 7,   query: "Sort these 15 meeting requests and tell me which I should accept", expected: "inbox triage", suite: 'original' },
  // Security review
  { id: 8,   query: "Review my nginx config for security misconfigurations", expected: "security review", suite: 'original' },
  { id: 9,   query: "Audit this list of npm packages for known vulnerabilities", expected: "security review", suite: 'original' },
  { id: 10,  query: "Check my AWS IAM roles for over-permissive policies", expected: "security review", suite: 'original' },
  { id: 11,  query: "Scan these environment variables and flag anything that looks like a leaked secret", expected: "security review", suite: 'original' },
  { id: 12,  query: "Review my Docker Compose file for security issues", expected: "security review", suite: 'original' },
  { id: 13,  query: "Assess these API endpoints for common OWASP issues", expected: "security review", suite: 'original' },
  { id: 14,  query: "Evaluate this open source library before we adopt it — any red flags?", expected: "security review", suite: 'original' },
  // Job search
  { id: 15,  query: "Track my job applications — I've applied to 12 companies this week", expected: "job search", suite: 'original' },
  { id: 16,  query: "Compare these 5 job offers I received — comp, culture, growth", expected: "job search", suite: 'original' },
  { id: 17,  query: "Find remote senior frontend roles at companies valued between $500M–$5B", expected: "job search", suite: 'original' },
  { id: 18,  query: "Organize my networking contacts by who can refer me to open positions", expected: "job search", suite: 'original' },
  { id: 19,  query: "Which of these 8 roles best match my resume strengths?", expected: "job search", suite: 'original' },
  { id: 20,  query: "Create a pipeline for my recruiting process — sourcing, screen, interview, offer", expected: "job search", suite: 'original' },
  { id: 21,  query: "Rank these companies by Glassdoor rating, salary range, and remote policy", expected: "job search", suite: 'original' },
  // Flight comparison
  { id: 22,  query: "Find me flights from NYC to Tokyo in mid-June — compare by price, layovers, and total time", expected: "flight comparison", suite: 'original' },
  { id: 23,  query: "What's the cheapest way to get from Chicago to London for two weeks?", expected: "flight comparison", suite: 'original' },
  { id: 24,  query: "Compare business class vs. economy on this 14-hour flight — is the upgrade worth it?", expected: "flight comparison", suite: 'original' },
  { id: 25,  query: "I need to be in both Paris and Berlin in the same week — what's the most efficient routing?", expected: "flight comparison", suite: 'original' },
  { id: 26,  query: "Find me a round-trip to Reykjavik under $700 in the next 3 months", expected: "flight comparison", suite: 'original' },
  { id: 27,  query: "Which airline has the best JFK–LAX options this Friday — Delta, United, or JetBlue?", expected: "flight comparison", suite: 'original' },
  { id: 28,  query: "Compare red-eye vs. morning departure for this conference trip", expected: "flight comparison", suite: 'original' },
  // Travel planner
  { id: 29,  query: "Plan a 10-day Japan trip starting in Tokyo, ending in Osaka — I like food and architecture", expected: "travel planner", suite: 'original' },
  { id: 30,  query: "I have 4 days in Lisbon — build me a day-by-day itinerary", expected: "travel planner", suite: 'original' },
  { id: 31,  query: "Road trip from Denver to Portland: plan 7 days with stops worth visiting", expected: "travel planner", suite: 'original' },
  { id: 32,  query: "My partner and I want a 2-week Southeast Asia trip — we've never been", expected: "travel planner", suite: 'original' },
  { id: 33,  query: "Plan a long weekend in New Orleans focused on jazz, food, and history", expected: "travel planner", suite: 'original' },
  { id: 34,  query: "I'm doing a solo Europe trip for a month on $3k — where should I go and in what order?", expected: "travel planner", suite: 'original' },
  { id: 35,  query: "Weekend ski trip from San Francisco — where and how should I plan it?", expected: "travel planner", suite: 'original' },
  // Event planner
  { id: 36,  query: "Help me plan a team offsite for 25 people in Austin in September", expected: "event planner", suite: 'original' },
  { id: 37,  query: "I'm throwing a birthday dinner for 12 — plan the whole evening", expected: "event planner", suite: 'original' },
  { id: 38,  query: "Organize a virtual conference with 5 speakers across 3 time zones", expected: "event planner", suite: 'original' },
  { id: 39,  query: "Plan a product launch event in NYC — venue, catering, PR, timeline", expected: "event planner", suite: 'original' },
  { id: 40,  query: "My wedding is in 8 months — build me a master planning checklist", expected: "event planner", suite: 'original' },
  { id: 41,  query: "Organize a hackathon for 80 students over 2 days", expected: "event planner", suite: 'original' },
  { id: 42,  query: "Plan a corporate holiday party for 150 people with a $10k budget", expected: "event planner", suite: 'original' },
  // Price comparison
  { id: 43,  query: "Help me compare these 3 health insurance plans — premiums, deductibles, network", expected: "price comparison", suite: 'original' },
  { id: 44,  query: "Standing desk comparison: Uplift vs. Flexispot vs. Fully Jarvis", expected: "price comparison", suite: 'original' },
  { id: 45,  query: "Compare these 5 mortgage offers I got this week", expected: "price comparison", suite: 'original' },
  { id: 46,  query: "Which streaming service has the best value for my household — Netflix, Disney+, Max, Apple TV+?", expected: "price comparison", suite: 'original' },
  // Comparison matrix (formerly some were "price comparison" — these are multi-criteria tool/vendor evals)
  { id: 47,  query: "Compare AWS vs. GCP vs. Azure for hosting a mid-size Node.js app", expected: "comparison matrix", suite: 'original' },
  { id: 48,  query: "Compare these 4 project management tools: Linear, Jira, Asana, Notion", expected: "comparison matrix", suite: 'original' },
  { id: 49,  query: "Which CRM is best for a 10-person sales team — Salesforce, HubSpot, or Pipedrive?", expected: "comparison matrix", suite: 'original' },
  { id: 50,  query: "Compare iPhone 16 Pro vs. Samsung Galaxy S25 vs. Pixel 9 on camera, battery, price", expected: "comparison matrix", suite: 'original' },
  // Restaurant finder
  { id: 51,  query: "Find me the best ramen spots in Seattle I haven't tried yet", expected: "restaurant shortlist", suite: 'original' },
  { id: 52,  query: "Suggest 5 date-night restaurants in Chicago under $100 for two", expected: "restaurant shortlist", suite: 'original' },
  { id: 53,  query: "What's the best place for a business lunch near Grand Central?", expected: "restaurant shortlist", suite: 'original' },
  { id: 54,  query: "Find me highly rated vegetarian restaurants in Paris", expected: "restaurant shortlist", suite: 'original' },
  { id: 55,  query: "I want a great outdoor brunch spot in Austin — not a chain", expected: "restaurant shortlist", suite: 'original' },
  { id: 56,  query: "Recommend 3 restaurants in Lisbon that locals actually eat at", expected: "restaurant shortlist", suite: 'original' },
  { id: 57,  query: "Find a private dining room in NYC for a client dinner of 8", expected: "restaurant shortlist", suite: 'original' },
  // Hotel shortlist
  { id: 58,  query: "Find me a boutique hotel in Rome under €200/night for a week in July", expected: "hotel shortlist", suite: 'original' },
  { id: 59,  query: "I need a hotel near the Las Vegas Convention Center — best options under $180", expected: "hotel shortlist", suite: 'original' },
  { id: 60,  query: "Compare these 4 hotels in Bali I'm considering — pool, beach access, vibe", expected: "hotel shortlist", suite: 'original' },
  { id: 61,  query: "Find a family-friendly resort in Mexico with all-inclusive under $300/night", expected: "hotel shortlist", suite: 'original' },
  { id: 62,  query: "Best hotels in Tokyo's Shinjuku district for a first-time visitor", expected: "hotel shortlist", suite: 'original' },
  { id: 63,  query: "Find me an Airbnb alternative for a month-long stay in Lisbon", expected: "hotel shortlist", suite: 'original' },
  { id: 64,  query: "I need a hotel with good WiFi and meeting rooms in Dublin for a team of 6", expected: "hotel shortlist", suite: 'original' },
  // Nearby places
  { id: 65,  query: "What are the best co-working spaces near downtown Boston?", expected: "nearby places", suite: 'original' },
  { id: 66,  query: "Find gyms near my zip code with a pool and sauna", expected: "nearby places", suite: 'original' },
  { id: 67,  query: "Recommend independent coffee shops near Williamsburg, Brooklyn good for working", expected: "nearby places", suite: 'original' },
  { id: 68,  query: "What are the best farmers markets in the Bay Area this weekend?", expected: "nearby places", suite: 'original' },
  { id: 69,  query: "Find the nearest urgent care clinics to me that take my insurance", expected: "nearby places", suite: 'original' },
  { id: 70,  query: "What repair shops near me have the best reviews for MacBook screens?", expected: "nearby places", suite: 'original' },
  { id: 71,  query: "Recommend yoga studios in Portland with beginner-friendly classes", expected: "nearby places", suite: 'original' },
  // Research notebook
  { id: 72,  query: "Summarize the current state of research on GLP-1 drugs beyond weight loss", expected: "research notebook", suite: 'original' },
  { id: 73,  query: "Give me a deep dive on the history and mechanics of lithium-ion batteries", expected: "research notebook", suite: 'original' },
  { id: 74,  query: "Research the competitive landscape of AI coding assistants as of 2025", expected: "research notebook", suite: 'original' },
  { id: 75,  query: "What do we know about the gut-brain axis and mental health?", expected: "research notebook", suite: 'original' },
  { id: 76,  query: "Explain the current regulatory environment for autonomous vehicles in the US", expected: "research notebook", suite: 'original' },
  { id: 77,  query: "Summarize the key arguments for and against universal basic income", expected: "research notebook", suite: 'original' },
  { id: 78,  query: "Research what happened to Silicon Valley Bank — causes, timeline, aftermath", expected: "research notebook", suite: 'original' },
  { id: 79,  query: "What is the current scientific consensus on seed oils and health?", expected: "research notebook", suite: 'original' },
  // Comparison matrix
  { id: 80,  query: "Evaluate these 5 analytics vendors for our data team — cost, scale, integrations", expected: "comparison matrix", suite: 'original' },
  { id: 81,  query: "Compare these 3 freelance developers I'm considering for a contract", expected: "comparison matrix", suite: 'original' },
  { id: 82,  query: "Help me pick a payroll provider — Rippling, Gusto, or Deel", expected: "comparison matrix", suite: 'original' },
  { id: 83,  query: "Evaluate 4 API providers for our SMS notification system", expected: "comparison matrix", suite: 'original' },
  { id: 84,  query: "Compare these 3 law firms I'm interviewing for startup legal work", expected: "comparison matrix", suite: 'original' },
  { id: 85,  query: "Help me choose between these 2 offshore development agencies", expected: "comparison matrix", suite: 'original' },
  { id: 86,  query: "Evaluate these CI/CD options for our engineering team: GitHub Actions, CircleCI, Jenkins", expected: "comparison matrix", suite: 'original' },
  // Shopping
  { id: 87,  query: "Find me the best mechanical keyboards under $150 for a developer", expected: "shopping results", suite: 'original' },
  { id: 88,  query: "What's the best espresso machine for home use under $500?", expected: "shopping results", suite: 'original' },
  { id: 89,  query: "Suggest 5 gifts for a tech-savvy dad who already has everything", expected: "shopping results", suite: 'original' },
  { id: 90,  query: "Find the best noise-canceling headphones — I travel constantly", expected: "shopping results", suite: 'original' },
  { id: 91,  query: "Recommend a beginner camera kit for YouTube content creation under $800", expected: "shopping results", suite: 'original' },
  { id: 92,  query: "Find the best ergonomic office chair under $400 with lumbar support", expected: "shopping results", suite: 'original' },
  // Step by step
  { id: 93,  query: "Walk me through setting up a self-hosted Plausible Analytics instance on a DigitalOcean droplet", expected: "step by step", suite: 'original' },
  { id: 94,  query: "How do I deploy a Next.js app to Vercel?", expected: "step by step", suite: 'original' },
  { id: 95,  query: "Give me step-by-step instructions for setting up a GitHub Action for CI", expected: "step by step", suite: 'original' },
  // Null cases — conversational queries that should NOT trigger a template
  { id: 96,  query: "What do you think about microservices vs monoliths?", expected: null, suite: 'original' },
  { id: 97,  query: "Can you help me write a cover letter?", expected: null, suite: 'original' },
  { id: 98,  query: "Explain how React's useEffect hook works", expected: null, suite: 'original' },
  { id: 99,  query: "What's the difference between TCP and UDP?", expected: null, suite: 'original' },
  { id: 100, query: "Review this pull request description and give me feedback", expected: null, suite: 'original' },
];

// ---------------------------------------------------------------------------
// 100 variation cases — different phrasings, no template keywords, edge cases
// ---------------------------------------------------------------------------

const VARIATIONS: Case[] = [
  // Inbox triage variations
  { id: 101, query: "My support queue is overwhelming — help me make sense of what actually needs attention", expected: "inbox triage", suite: 'variation' },
  { id: 102, query: "I've got 200 unread GitHub notifications, which ones actually matter?", expected: "inbox triage", suite: 'variation' },
  { id: 103, query: "Which of these customer complaints should I respond to first?", expected: "inbox triage", suite: 'variation' },
  { id: 104, query: "Our on-call queue has 40 items — help me sort them by impact", expected: "inbox triage", suite: 'variation' },
  { id: 105, query: "I need to go through these 25 applicant portfolios and shortlist the best ones", expected: "inbox triage", suite: 'variation' },
  { id: 106, query: "My Jira backlog is a mess — what's actually blocking anything right now?", expected: "inbox triage", suite: 'variation' },
  { id: 107, query: "Flag the urgent items from this batch of user feedback forms", expected: "inbox triage", suite: 'variation' },
  // Security review variations
  { id: 108, query: "Something looks off with our S3 bucket permissions — can you audit them?", expected: "security review", suite: 'variation' },
  { id: 109, query: "We're shipping Friday — do a quick pass on our auth implementation for obvious holes", expected: "security review", suite: 'variation' },
  { id: 110, query: "Our API keys might have leaked into the git history — help me assess the exposure", expected: "security review", suite: 'variation' },
  { id: 111, query: "Check this Docker image for anything running as root that shouldn't be", expected: "security review", suite: 'variation' },
  { id: 112, query: "Before we go to production, look at our infra for the most obvious risks", expected: "security review", suite: 'variation' },
  { id: 113, query: "Is this npm package safe to add? It has 3 CVEs listed on the GitHub advisory page", expected: "security review", suite: 'variation' },
  { id: 114, query: "Help me work through these Dependabot alerts by severity", expected: "security review", suite: 'variation' },
  // Job search variations
  { id: 115, query: "I'm looking for my next engineering role — help me organize the search", expected: "job search", suite: 'variation' },
  { id: 116, query: "I got three offers this week — help me think through them beyond just base salary", expected: "job search", suite: 'variation' },
  { id: 117, query: "Applied to 15 companies in the past month — need to track where things stand", expected: "job search", suite: 'variation' },
  { id: 118, query: "What senior PM roles at Series B companies should I be targeting right now?", expected: "job search", suite: 'variation' },
  { id: 119, query: "My recruiter pipeline is messy — help me organize who I'm talking to and at what stage", expected: "job search", suite: 'variation' },
  { id: 120, query: "Two competing offers — remote-first startup vs. FAANG — how should I compare them?", expected: "job search", suite: 'variation' },
  { id: 121, query: "I want to track companies I'm targeting and the status of each conversation", expected: "job search", suite: 'variation' },
  // Flight comparison variations
  { id: 122, query: "I need to get to London by Thursday — what are my options from Boston?", expected: "flight comparison", suite: 'variation' },
  { id: 123, query: "Flying to Bali next month — what's the smartest routing from the East Coast?", expected: "flight comparison", suite: 'variation' },
  { id: 124, query: "Is it worth paying $400 more for the direct flight or should I take the layover?", expected: "flight comparison", suite: 'variation' },
  { id: 125, query: "I need to visit Dubai and Istanbul on the same trip — what's the best order?", expected: "flight comparison", suite: 'variation' },
  { id: 126, query: "My client needs me in Singapore Monday — what can I get out of LAX?", expected: "flight comparison", suite: 'variation' },
  { id: 127, query: "Two-week Europe trip starting in London — smartest way to get there from NYC?", expected: "flight comparison", suite: 'variation' },
  { id: 128, query: "Overnight vs. daytime on the Tokyo route — help me think through the tradeoffs", expected: "flight comparison", suite: 'variation' },
  // Travel planner variations
  { id: 129, query: "Taking two weeks off and want to do Southeast Asia for the first time — help me plan it", expected: "travel planner", suite: 'variation' },
  { id: 130, query: "Honeymoon planning — 10 days in Greece, two of us, not budget-constrained", expected: "travel planner", suite: 'variation' },
  { id: 131, query: "I want to backpack South America for six weeks — help me figure out the route", expected: "travel planner", suite: 'variation' },
  { id: 132, query: "Company retreat in Portugal — 4 days, 12 people — what does the schedule look like?", expected: "travel planner", suite: 'variation' },
  { id: 133, query: "Long weekend coming up and I've never been to New Orleans — build me a plan", expected: "travel planner", suite: 'variation' },
  { id: 134, query: "Cross-country drive this summer — what stops are actually worth it?", expected: "travel planner", suite: 'variation' },
  { id: 135, query: "Anniversary trip to Italy — Rome and the Amalfi coast — 8 days", expected: "travel planner", suite: 'variation' },
  // Event planner variations
  { id: 136, query: "Engineering team is growing — I want to do a proper team-building day", expected: "event planner", suite: 'variation' },
  { id: 137, query: "Parents' 40th anniversary next month — want to throw them a dinner", expected: "event planner", suite: 'variation' },
  { id: 138, query: "We're hosting a demo day for potential investors — about 30 people", expected: "event planner", suite: 'variation' },
  { id: 139, query: "My startup is having its first user conference — 200 attendees, one day", expected: "event planner", suite: 'variation' },
  { id: 140, query: "Baby shower for my sister — about 20 people — help me plan it", expected: "event planner", suite: 'variation' },
  { id: 141, query: "Company all-hands in Austin next quarter — 80 people, two days", expected: "event planner", suite: 'variation' },
  { id: 142, query: "Organizing a memorial service — help me think through the logistics", expected: "event planner", suite: 'variation' },
  // Price comparison variations
  { id: 143, query: "Renewing my health insurance and I have three plans to choose between", expected: "price comparison", suite: 'variation' },
  { id: 144, query: "Competing mortgage quotes from four lenders — which is actually cheaper long-term?", expected: "price comparison", suite: 'variation' },
  { id: 145, query: "I'm paying for too many subscriptions — help me figure out what to cut", expected: "price comparison", suite: 'variation' },
  { id: 146, query: "Standing desk upgrade time — help me compare the top three options", expected: "price comparison", suite: 'variation' },
  { id: 147, query: "Three car insurance renewal quotes — which has the best overall value?", expected: "price comparison", suite: 'variation' },
  { id: 148, query: "Which cell phone plan makes sense for someone who travels internationally a lot?", expected: "price comparison", suite: 'variation' },
  // Restaurant shortlist variations
  { id: 149, query: "Date night this Saturday in SF — somewhere nice but not stuffy", expected: "restaurant shortlist", suite: 'variation' },
  { id: 150, query: "Investors coming to town — need somewhere impressive for dinner in Midtown Manhattan", expected: "restaurant shortlist", suite: 'variation' },
  { id: 151, query: "Good izakaya in LA that aren't tourist traps?", expected: "restaurant shortlist", suite: 'variation' },
  { id: 152, query: "Taking my parents out for their anniversary in Chicago — budget around $150 for two", expected: "restaurant shortlist", suite: 'variation' },
  { id: 153, query: "Late-night food in Nashville after the concert — what's actually open?", expected: "restaurant shortlist", suite: 'variation' },
  { id: 154, query: "My client is lactose intolerant — Italian in Boston that can work for both of us?", expected: "restaurant shortlist", suite: 'variation' },
  { id: 155, query: "Best outdoor brunch spots in Brooklyn this weekend", expected: "restaurant shortlist", suite: 'variation' },
  // Hotel shortlist variations
  { id: 156, query: "Visiting my sister in Miami, staying in a hotel rather than with her — what's near the beach?", expected: "hotel shortlist", suite: 'variation' },
  { id: 157, query: "Company is paying for my hotel in Vegas — what's most convenient to the convention center?", expected: "hotel shortlist", suite: 'variation' },
  { id: 158, query: "I need somewhere with a proper desk and fast WiFi in Dublin for a two-week work sprint", expected: "hotel shortlist", suite: 'variation' },
  { id: 159, query: "Romantic getaway in Tuscany — farmhouse style, nothing corporate", expected: "hotel shortlist", suite: 'variation' },
  { id: 160, query: "Family vacation in Mexico — beach resort, kids are 8 and 10", expected: "hotel shortlist", suite: 'variation' },
  { id: 161, query: "Staying in Tokyo for two weeks for the first time — where should I be?", expected: "hotel shortlist", suite: 'variation' },
  { id: 162, query: "Ski trip to the French Alps with four friends — where do we stay?", expected: "hotel shortlist", suite: 'variation' },
  // Nearby places variations
  { id: 163, query: "Moving to Austin next month — where are the good gyms near downtown?", expected: "nearby places", suite: 'variation' },
  { id: 164, query: "Need a dentist in Seattle who takes Delta Dental and is open on Saturdays", expected: "nearby places", suite: 'variation' },
  { id: 165, query: "Good study spots in Cambridge MA that aren't a chain coffee shop?", expected: "nearby places", suite: 'variation' },
  { id: 166, query: "Dog-friendly parks and cafes near Capitol Hill DC", expected: "nearby places", suite: 'variation' },
  { id: 167, query: "Best places to work remotely in Portland that aren't Starbucks", expected: "nearby places", suite: 'variation' },
  { id: 168, query: "Emergency — I need a walk-in clinic near the Financial District in SF", expected: "nearby places", suite: 'variation' },
  { id: 169, query: "Best farmers market in the Bay Area for this Saturday morning", expected: "nearby places", suite: 'variation' },
  // Research notebook variations
  { id: 170, query: "I keep hearing about metabolic syndrome — what do we actually know about it?", expected: "research notebook", suite: 'variation' },
  { id: 171, query: "Explain transformer architecture to me like I'm a backend engineer", expected: "research notebook", suite: 'variation' },
  { id: 172, query: "What's the current thinking on how to structure a Series A term sheet?", expected: "research notebook", suite: 'variation' },
  { id: 173, query: "I need to understand GDPR compliance for a US SaaS company entering Europe", expected: "research notebook", suite: 'variation' },
  { id: 174, query: "Walk me through the debate around charter schools and educational outcomes", expected: "research notebook", suite: 'variation' },
  { id: 175, query: "Is the evidence for intermittent fasting actually solid?", expected: "research notebook", suite: 'variation' },
  { id: 176, query: "What are the key findings from recent research on ADHD in adults?", expected: "research notebook", suite: 'variation' },
  { id: 177, query: "Give me the 30-minute version of why microservices replaced monoliths — and when they shouldn't", expected: "research notebook", suite: 'variation' },
  // Comparison matrix variations
  { id: 178, query: "Our team needs to pick a design system — evaluate the main options", expected: "comparison matrix", suite: 'variation' },
  { id: 179, query: "Choosing between three SaaS analytics vendors before the board meeting", expected: "comparison matrix", suite: 'variation' },
  { id: 180, query: "Hiring a fractional CFO — I have three candidates and need a structured comparison", expected: "comparison matrix", suite: 'variation' },
  { id: 181, query: "API gateway for our microservices — Kong vs AWS API Gateway vs NGINX Plus", expected: "comparison matrix", suite: 'variation' },
  { id: 182, query: "We need to pick a data warehouse: Snowflake, BigQuery, or Redshift?", expected: "comparison matrix", suite: 'variation' },
  { id: 183, query: "Two competing bids from dev agencies — which one looks more credible?", expected: "comparison matrix", suite: 'variation' },
  { id: 184, query: "What's the best observability stack for a team our size — Datadog, Grafana, or New Relic?", expected: "comparison matrix", suite: 'variation' },
  // Shopping variations
  { id: 185, query: "Birthday present for my 16-year-old who's into tech — budget $200", expected: "shopping results", suite: 'variation' },
  { id: 186, query: "Spilled coffee on my keyboard — what's the best replacement under $100?", expected: "shopping results", suite: 'variation' },
  { id: 187, query: "What's a good espresso setup for a home office — nothing too complicated", expected: "shopping results", suite: 'variation' },
  { id: 188, query: "Best noise-canceling for long-haul flights without paying Bose prices", expected: "shopping results", suite: 'variation' },
  { id: 189, query: "I need a new webcam for video calls — something that doesn't look terrible", expected: "shopping results", suite: 'variation' },
  { id: 190, query: "Back is wrecked from sitting all day — what chair would actually help?", expected: "shopping results", suite: 'variation' },
  { id: 191, query: "Gifts for a new homeowner who already has everything — under $75 each", expected: "shopping results", suite: 'variation' },
  // Step by step variations
  { id: 192, query: "Never deployed to Railway — walk me through getting a Next.js app live", expected: "step by step", suite: 'variation' },
  { id: 193, query: "How do I set up SSH keys for GitHub from scratch?", expected: "step by step", suite: 'variation' },
  { id: 194, query: "MacBook won't connect to home network — help me debug it", expected: "step by step", suite: 'variation' },
  { id: 195, query: "Getting started with Terraform for the first time — what do I actually need to know?", expected: "step by step", suite: 'variation' },
  { id: 196, query: "I want to automate my invoice process using Make.com — where do I start?", expected: "step by step", suite: 'variation' },
  { id: 197, query: "The database migration failed halfway through — how do I safely roll it back?", expected: "step by step", suite: 'variation' },
  { id: 198, query: "Help me set up a monorepo with Turborepo", expected: "step by step", suite: 'variation' },
  // Null variations — should return null
  { id: 199, query: "What are your thoughts on serverless architecture?", expected: null, suite: 'variation' },
  { id: 200, query: "Hi, I'm new here — what can you help me with?", expected: null, suite: 'variation' },
];

const ALL_CASES = [...ORIGINAL, ...VARIATIONS];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function regexLabel(query: string): string | null {
  const result = classifyStructuredRecipeIntent(query, false);
  return result?.label ?? null;
}

function matches(got: string | null, expected: string | null): boolean {
  return got === expected;
}

function pct(n: number, total: number) {
  return `${((n / total) * 100).toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const hermesHome = process.env['HERMES_HOME'] ?? `${process.env['HOME']}/.hermes`;
  const config = await readHermesProviderConfig(hermesHome);
  if (!config) {
    console.error('Could not read provider config from', hermesHome);
    process.exit(1);
  }

  console.log(`\nProvider: ${config.baseUrl}  Model: ${config.model}\n`);
  console.log('Running 200 queries (regex instant, LLM in parallel batches)...\n');

  // Run regex immediately — all 200
  const regexResults = ALL_CASES.map((c) => ({
    ...c,
    regexGot: regexLabel(c.query),
  }));

  // Run LLM in parallel batches of 20 to stay within rate limits
  const BATCH = 20;
  const llmGot: (string | null)[] = new Array(ALL_CASES.length).fill(null);

  for (let i = 0; i < ALL_CASES.length; i += BATCH) {
    const batch = ALL_CASES.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((c) => classifyStructuredRecipeIntentLLM(c.query, config))
    );
    results.forEach((r, j) => {
      llmGot[i + j] = r?.label ?? null;
    });
    process.stdout.write(`  LLM: ${Math.min(i + BATCH, ALL_CASES.length)}/200\r`);
  }
  process.stdout.write('\n');

  // ---------------------------------------------------------------------------
  // Results
  // ---------------------------------------------------------------------------

  let regexPass = 0, llmPass = 0;
  let regexOrigPass = 0, llmOrigPass = 0;
  let regexVarPass = 0, llmVarPass = 0;

  const failures: Array<{
    id: number; suite: string; query: string;
    expected: string | null; regexGot: string | null; llmGot: string | null;
  }> = [];

  for (let i = 0; i < ALL_CASES.length; i++) {
    const c = ALL_CASES[i];
    const rGot = regexResults[i].regexGot;
    const lGot = llmGot[i];
    const rOk = matches(rGot, c.expected);
    const lOk = matches(lGot, c.expected);

    if (rOk) { regexPass++; if (c.suite === 'original') regexOrigPass++; else regexVarPass++; }
    if (lOk) { llmPass++;   if (c.suite === 'original') llmOrigPass++;   else llmVarPass++;   }

    if (!rOk || !lOk) {
      failures.push({ id: c.id, suite: c.suite, query: c.query, expected: c.expected, regexGot: rGot, llmGot: lGot });
    }
  }

  const total = ALL_CASES.length;
  const origTotal = ORIGINAL.length;
  const varTotal = VARIATIONS.length;

  console.log('═══════════════════════════════════════════════════════');
  console.log('  INTENT CLASSIFIER COMPARISON AUDIT  (200 queries)   ');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`                     REGEX          LLM`);
  console.log(`  Original (${origTotal})       ${String(regexOrigPass).padStart(3)}/${origTotal}  ${pct(regexOrigPass,origTotal).padStart(6)}    ${String(llmOrigPass).padStart(3)}/${origTotal}  ${pct(llmOrigPass,origTotal).padStart(6)}`);
  console.log(`  Variations (${varTotal})     ${String(regexVarPass).padStart(3)}/${varTotal}  ${pct(regexVarPass,varTotal).padStart(6)}    ${String(llmVarPass).padStart(3)}/${varTotal}  ${pct(llmVarPass,varTotal).padStart(6)}`);
  console.log(`  ─────────────────────────────────────────────────────`);
  console.log(`  TOTAL (${total})         ${String(regexPass).padStart(3)}/${total}  ${pct(regexPass,total).padStart(6)}    ${String(llmPass).padStart(3)}/${total}  ${pct(llmPass,total).padStart(6)}`);
  console.log('═══════════════════════════════════════════════════════\n');

  if (failures.length > 0) {
    console.log('FAILURES (at least one classifier wrong):');
    console.log('─'.repeat(80));
    for (const f of failures) {
      const rMark = matches(f.regexGot, f.expected) ? '✓' : '✗';
      const lMark = matches(f.llmGot, f.expected) ? '✓' : '✗';
      console.log(`  #${String(f.id).padStart(3)} [${f.suite.slice(0,3)}]  expected="${f.expected ?? 'null'}"`);
      console.log(`         regex ${rMark} "${f.regexGot ?? 'null'}"   llm ${lMark} "${f.llmGot ?? 'null'}"`);
      console.log(`         "${f.query.slice(0, 90)}"`);
    }
  }

  const winner = llmPass > regexPass ? 'LLM' : llmPass === regexPass ? 'TIE' : 'REGEX';
  const delta = Math.abs(llmPass - regexPass);
  console.log(`\nVerdict: ${winner} wins by ${delta} point${delta !== 1 ? 's' : ''} (${pct(llmPass, total)} vs ${pct(regexPass, total)})\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
