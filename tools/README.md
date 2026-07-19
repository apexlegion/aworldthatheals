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

## Future (Phase 8+ continued)
The full vision's "auto-update every ~10 hours" pipeline would extend this into a
scheduled job that also: pulls new resources from trusted sources, de-duplicates,
archives dead links, and opens a pull request with the changes. That requires a
backend/CI runner beyond the static site and is intentionally out of scope for the
static build — this script is the foundation it would grow from.
