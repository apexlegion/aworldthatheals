#!/usr/bin/env python3
"""
Maintenance & integrity tool for A World That Heals.

Usage:
  python tools/maintain.py            # validate JSON + cross-references (fast, offline)
  python tools/maintain.py --links    # also check every external URL (slow, network)

This is the seed of the "auto-updating" phase: run it on a schedule (locally or in
CI) to catch broken JSON, missing cross-references, and dead links before users do.
"""
import json, os, sys, glob, re
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
errors = []
warnings = []

def load(path):
    try:
        return json.load(open(path, encoding="utf-8"))
    except Exception as e:
        errors.append(f"INVALID JSON: {os.path.relpath(path, ROOT)} — {e}")
        return None

def validate_structure():
    # All JSON parses
    files = glob.glob(os.path.join(DATA, "**", "*.json"), recursive=True)
    for f in files:
        load(f)

    # Topics: index ids <-> files, related ids resolve
    idx = load(os.path.join(DATA, "topics-index.json")) or []
    ids = {t["id"] for t in idx}
    topic_files = {os.path.splitext(os.path.basename(p))[0] for p in glob.glob(os.path.join(DATA, "topics", "*.json"))}
    for missing in ids - topic_files:
        errors.append(f"topics-index lists '{missing}' but data/topics/{missing}.json is missing")
    for orphan in topic_files - ids:
        warnings.append(f"data/topics/{orphan}.json exists but is not in topics-index.json")
    for p in glob.glob(os.path.join(DATA, "topics", "*.json")):
        t = load(p)
        if not t:
            continue
        for r in t.get("relatedTopics", []):
            if r not in ids:
                errors.append(f"{t['id']}: relatedTopics -> unknown '{r}'")

    # Collections with index + detail files
    for coll in ("practices", "approaches", "teachers", "stories"):
        idxp = os.path.join(DATA, f"{coll}-index.json")
        if not os.path.exists(idxp):
            continue
        cidx = load(idxp) or []
        cids = {i["id"] for i in cidx}
        cfiles = {os.path.splitext(os.path.basename(p))[0] for p in glob.glob(os.path.join(DATA, coll, "*.json"))}
        for missing in cids - cfiles:
            errors.append(f"{coll}-index lists '{missing}' but data/{coll}/{missing}.json is missing")
        for orphan in cfiles - cids:
            warnings.append(f"data/{coll}/{orphan}.json not in {coll}-index.json")

    # Emergency data sanity
    em = load(os.path.join(DATA, "emergency.json")) or {}
    if em.get("default") not in em.get("countries", {}):
        errors.append("emergency.json: default country not present in countries")

def collect_urls():
    urls = set()
    for f in glob.glob(os.path.join(DATA, "**", "*.json"), recursive=True):
        try:
            text = open(f, encoding="utf-8").read()
        except Exception:
            continue
        for m in re.findall(r'"(https?://[^"]+)"', text):
            urls.add(m)
    return sorted(urls)

# Pages that return HTTP 200 but are actually dead (org shut down, parked, etc.)
CLOSURE_SIGNALS = [
    "website closure", "ceased operations", "no longer available",
    "has officially ceased", "site is no longer", "page not found",
    "404 not found", "account suspended", "domain is for sale",
    "has shut down", "we have closed", "this domain is for sale",
]
BROWSER_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")

def check_links():
    urls = collect_urls()
    print(f"\nChecking {len(urls)} external URLs (full GET, content-scanned)...\n")
    dead = []
    for u in urls:
        try:
            # Full GET with a real browser UA: HEAD lies, and many hosts 403 bots.
            req = Request(u, headers={"User-Agent": BROWSER_UA})
            with urlopen(req, timeout=20) as r:
                code = r.status
                body = r.read(6000).decode("utf-8", "ignore").lower()
            hit = next((s for s in CLOSURE_SIGNALS if s in body), None)
            if hit:
                dead.append((u, f"200 but page says '{hit}'"))
                print(f"  DEAD-CONTENT  {u}  (says '{hit}')")
            else:
                print(f"  ok   {code}  {u}")
        except HTTPError as e:
            if e.code in (403, 405, 406):  # bot-blocking; real browsers get through
                print(f"  ~    {e.code}  {u}  (blocks bots; verify in a browser if unsure)")
            else:
                dead.append((u, e.code)); print(f"  DEAD {e.code}  {u}")
        except (URLError, Exception) as e:
            dead.append((u, str(e))); print(f"  DEAD  --   {u}  ({e})")
    return dead

def main():
    validate_structure()
    print("=== Structure validation ===")
    if errors:
        for e in errors: print("  ERROR:", e)
    else:
        print("  All JSON valid; all cross-references resolve.")
    for w in warnings: print("  warn:", w)

    dead = []
    if "--links" in sys.argv:
        dead = check_links()
        print("\n=== Link check ===")
        if dead:
            for u, why in dead: print(f"  DEAD ({why}): {u}")
        else:
            print("  No dead links found.")

    sys.exit(1 if errors or dead else 0)

if __name__ == "__main__":
    main()
