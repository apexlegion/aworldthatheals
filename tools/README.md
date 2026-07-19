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

This auto-*detects and flags* problems; it does not auto-rewrite health
content. On a mental-health site, resource text should be reviewed by a human
before it changes — the workflow's job is making sure nothing goes stale or
dead without you knowing.

Hosting is GitHub Pages, serving directly from `main` — every push to `main`
that passes `validate.yml` auto-publishes, with no separate deploy step.

## Future (Phase 8+ continued)
The full original vision's "auto-update every ~10 hours" pipeline — pulling in
*new* resources from trusted sources, not just checking existing ones — would
extend this into a scheduled job that also fetches candidate content and opens
a PR for review. That's a larger scraping/aggregation system and is
intentionally out of scope for now; this script and its workflows are the
foundation it would grow from.
