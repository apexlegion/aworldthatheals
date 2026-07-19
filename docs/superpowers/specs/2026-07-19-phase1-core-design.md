# A World That Heals — Phase 1 Design: Core (Search + Encyclopedia + Emergency Support)

## Context

"A World That Heals" is a long-term vision: a free, ad-free, non-commercial global platform aggregating trustworthy mental health, wellbeing, mindfulness, and addiction-recovery resources — a "Wikipedia for mental health recovery." The full vision (see Phase Map below) is too large for one build. This document specs **Phase 1 only**: a real, working core that is genuinely useful on its own.

## Phase Map (for context, not all specced here)

1. **Core** — search + encyclopedia + emergency support *(this doc)*
2. Practices libraries — mindfulness & breathwork
3. Psychological approaches + teacher/author directory
4. Addiction recovery directory
5. Free app & resource-type directory
6. Stories + communities
7. Live meeting aggregator (real-time scraping, timezones)
8. Auto-updating content pipeline + multi-language

Each phase ships as its own usable increment. Phase 1 must stand alone as something a person in distress can actually use tonight.

## Core Principles (apply to every phase)

- 100% free resources only. No ads, no affiliate links, no paid upsells, no accounts required.
- Privacy-first: no tracking, no geo-IP, no login. LocalStorage only, on-device.
- Evidence-informed: every intervention/resource labeled by evidence status (evidence-based / emerging evidence / traditional or spiritual practice) — never presented as equally supported.
- Educational and navigational only. Does not diagnose or replace therapy/medical care. Crisis resources are surfaced prominently and consistently.

## Phase 1 Scope

### In scope

- Homepage with intent-driven search ("How are you feeling?") + browsable topic grid fallback.
- ~18 hand-curated topic pages (see Content List below).
- Client-side phrase-matching search engine (no backend, no AI calls).
- Emergency Support page + persistent access point, manual country selector.
- Global disclaimer (footer + dismissible session banner).
- Installable PWA with offline access to visited/saved topic pages.
- Dark/light mode, mobile-first, WCAG 2.2 AA basics (keyboard nav, screen-reader labels, contrast).

### Explicitly out of scope for Phase 1

Mindfulness/breathwork libraries, psychological-approach explainers, teacher/author directory, addiction-org directory, app directory, books/stories libraries, communities directory, live meeting aggregation, auto-updating content pipeline, multi-language, accounts/sync.

## Tech Stack

Static PWA — plain HTML/CSS/vanilla JS, no build step or framework. Matches the pattern used in Harbor and Restless Roots. Deployed free (Netlify-style static hosting). No backend, no database, no server-side code.

Rationale: Phase 1's entire feature set (curated JSON content + client-side search) does not require a backend. This keeps hosting free and matches the user's established workflow. Revisit this choice at Phase 7 (live meeting aggregator), which genuinely needs a data pipeline.

## Data Model

Each topic is a single JSON file at `/data/topics/<id>.json`:

```json
{
  "id": "anxiety",
  "title": "Anxiety",
  "evidenceStatus": "evidence-based",
  "explanation": "Plain-language description...",
  "symptoms": ["...", "..."],
  "copingTools": {
    "immediate": [{ "title": "...", "steps": "..." }],
    "longTerm": [{ "title": "...", "description": "..." }]
  },
  "resources": [
    {
      "type": "article | video | app | book | worksheet",
      "title": "...",
      "source": "NIMH",
      "url": "https://...",
      "whyHere": "One sentence on why this is trustworthy/useful",
      "evidenceStatus": "evidence-based"
    }
  ],
  "relatedTopics": ["depression", "panic-attacks"],
  "matchPhrases": ["i feel anxious", "i can't stop worrying", "my heart is racing"],
  "isCrisisTopic": false
}
```

`isCrisisTopic: true` (used for e.g. "Suicidal thoughts") triggers the emergency-support strip to render expanded/first on that page, above the explanation.

## Search

Client-side matcher: normalizes user input (lowercase, strip punctuation), scores each topic by overlap against `matchPhrases` + a shared synonym list (`/data/synonyms.json`), returns top 3 topics ranked by score. No network call, works offline once the app shell is cached. If no topic scores above a minimum threshold, show the full topic grid plus a link to Emergency Support rather than a dead end.

Any input matching a crisis-language wordlist (hardcoded, curated) immediately surfaces the Emergency Support panel above search results, regardless of match score.

## Pages

- **Home** — search bar, topic grid, brief mission statement, emergency-support link in header.
- **Topic page** — crisis strip (if applicable) → explanation → symptoms → immediate coping tools → long-term practices → resources (grouped by type, evidence-status badge on each) → related topics.
- **Emergency Support** — country selector (manual, no geo-IP) → crisis line(s), mental-health crisis services, general emergency number for that country. Curated dataset starting with US, UK, Canada, Australia, India + an international fallback list. Reachable from every page via a persistent header element, not buried in a menu.
- **About** — mission, principles, disclaimer, "this is not therapy" statement.

## Design System

From the reference images: near-black/deep-olive backgrounds for hero/primary surfaces, warm cream/beige for secondary content panels, single warm orange-red accent reserved for CTAs and evidence/crisis emphasis, clean sans-serif type, generous whitespace, pill-shaped buttons, editorial-style imagery (not clinical stock photos, not cartoonish). Both dark and light themes required — the reference images' dark mode becomes the default `prefers-color-scheme: dark` treatment; a cream-forward light variant mirrors it.

## Content Sourcing

I draft all 18 launch topics directly, sourcing from established organizations (NIMH, WHO, NHS, APA, reputable nonprofits) and citing them per-resource. Each topic visibly carries its evidence-status label. No topic is invented or unsourced.

## Launch Topics (18)

Anxiety, Depression, Panic Attacks, Stress, Burnout, Grief, Loneliness, Self-Esteem & Self-Hatred, Overthinking, Sleep, Trauma (basics), Suicidal Thoughts (crisis topic), Relapse (general/addiction), Breakups & Relationships, Shame & Guilt, Anger, Hope & Motivation, Beginner Mindfulness.

## Offline / PWA

Service worker precaches the app shell (HTML/CSS/JS, synonym data, emergency-support dataset). Topic JSON is cached on first visit ("save for later" = already cached, no explicit save action needed beyond visiting). Installable via standard PWA manifest.

## Testing / Verification

Manual verification in-browser, no automated test framework needed for this scope:
- Search returns sensible top-3 matches for a sample set of phrases drawn from `matchPhrases` across multiple topics.
- Crisis-language input reliably surfaces Emergency Support first.
- Emergency Support page renders correct data per country selection.
- Offline mode: visited pages load with network disabled.
- Lighthouse PWA + accessibility pass (installable, contrast, labels, keyboard nav).
- Dark/light mode both verified visually against the reference palette.

## Open Questions Resolved

- Scope: full vision, phased delivery — this doc is Phase 1 only.
- Content: I draft, clearly labeled, sourced from established orgs.
- Stack: static PWA, no backend.
- Search: curated client-side phrase-matching, not AI-powered.
