# Maintenance tools

## `maintain.py` — integrity & link checker

The seed of the platform's "keep everything current" goal. Run it on a schedule
(a cron job, a CI workflow, or by hand) to catch problems before users do.

```bash
# Fast, offline: validate every JSON file + all cross-references
python tools/maintain.py

# Also check every external URL is alive (slower, needs network)
python tools/maintain.py --links
```

Exit code is non-zero if any errors or dead links are found, so it can gate a
deploy in CI.

### What it checks
- Every `data/**/*.json` parses.
- `topics-index.json` ids match the files in `data/topics/`, and every
  `relatedTopics` id resolves.
- Each collection index (`practices`, `approaches`, `teachers`, `stories`) matches
  its detail files.
- `emergency.json`'s `default` country exists.
- With `--links`: every `https://` URL across the data returns a live response.

## Automation (live, GitHub-only)

Two GitHub Actions workflows run this script automatically — no Netlify or
external server involved:

- **`.github/workflows/validate.yml`** — runs `maintain.py` (fast, offline) on
  every push and pull request to `main`. Catches broken JSON or a bad
  cross-reference before it merges.
- **`.github/workflows/maintain.yml`** — runs `maintain.py --links` every
  Monday (and on-demand from the Actions tab), and if anything is broken —
  invalid JSON or a dead external link — it automatically opens (or updates)
  a GitHub issue with the report, using the template in
  `.github/ISSUE_TEMPLATE/maintenance-report.md`. It reuses one open issue
  per week rather than spamming duplicates.

Hosting is GitHub Pages, serving directly from `main` — every push to `main`
that passes `validate.yml` auto-publishes, with no separate deploy step.

## `auto_content.py` — autonomous content addition (live, no human review)

A third workflow, **`.github/workflows/auto-content.yml`**, runs every
Thursday (and on demand) and genuinely adds new content to the live site
with no approval step — it commits straight to `main`. It works by asking a
free-tier LLM (Gemini) to draft one new free resource for an existing topic,
practice, or approach, written with warmth and empathy for the person who'll
read it.

Autonomy here is bounded by automated gates, not a human:
- **The URL's domain must be on a fixed allowlist** of ~45 already-trusted
  sources (NIMH, WHO, NHS, APA, SAMHSA, established nonprofits — the same
  sources already cited by hand across the site). The model cannot expand
  this list.
- **The URL must respond live** before anything is written.
- **The draft must pass `maintain.py`'s structure validator** after being
  written; if it fails, the file is reverted and nothing is committed.
- **It can only append to an existing item's `resources[]` array** — it can
  never create a new topic, edit clinical/explanatory text, symptoms, or
  coping tools.
- **It is physically excluded from `emergency.json`, `crisis-terms.json`,
  and the suicidal-thoughts topic** (see `PROTECTED_FILES`/`PROTECTED_IDS`
  in `auto_content.py`) — those never change without a human, regardless of
  how autonomy is configured elsewhere. This is the one deliberate
  exception: an unreviewed AI mistake in crisis-support content is the
  single failure mode that could directly endanger someone in crisis, so
  it's excluded at the code level, not just by prompt instruction.

Every autonomous addition is appended to `data/auto-content-log.json` (newest
first) as a visible audit trail, and each commit is tagged `[auto-content]`
in the git history.

### Setup required
Add a **`GEMINI_API_KEY`** repository secret (Settings → Secrets and
variables → Actions → New repository secret) with a free Gemini API key from
[aistudio.google.com](https://aistudio.google.com/app/apikey). Without it,
the workflow runs harmlessly and skips (see the first check in
`auto_content.py`'s `main()`).

## Future (Phase 8+ continued)
The full original vision's "auto-update every ~10 hours" pipeline — pulling in
*new* resources from trusted sources, not just checking existing ones — would
extend this into a scheduled job that also fetches candidate content and opens
a PR for review. That's a larger scraping/aggregation system and is
intentionally out of scope for now; this script and its workflows are the
foundation it would grow from.
