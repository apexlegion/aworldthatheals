#!/usr/bin/env python3
"""
Autonomous content addition — drafts ONE new free resource per run using a
free-tier LLM (Gemini), and commits it straight to main if (and only if) it
passes every automated safety gate below. No human review step by design —
that's what was asked for — but the gates exist so autonomy doesn't mean
recklessness on a mental-health site.

HARD BOUNDARY (not configurable via prompt or env): this script can only
append a `resources[]` entry to an EXISTING topic/practice/approach file. It
can never create a new topic, edit explanatory/clinical text, coping tools,
or symptoms, and it is physically incapable of touching PROTECTED_FILES
below — those are excluded before the AI ever sees the request.
"""
import json, os, re, sys, glob, random
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
LOG_PATH = os.path.join(DATA, "auto-content-log.json")

GEMINI_MODEL = "gemini-2.0-flash"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

# Never eligible for autonomous edits, full stop.
PROTECTED_FILES = {
    os.path.join(DATA, "emergency.json"),
    os.path.join(DATA, "crisis-terms.json"),
    os.path.join(DATA, "topics", "suicidal-thoughts.json"),
}
PROTECTED_IDS = {"suicidal-thoughts"}

# Only resources on these domains are eligible. Same trusted sources already
# cited across the hand-written content — not a list the bot can expand.
ALLOWED_DOMAINS = {
    "nimh.nih.gov", "who.int", "nhs.uk", "apa.org", "samhsa.gov", "va.gov",
    "mobile.va.gov", "mind.org.uk", "helpguide.org", "self-compassion.org",
    "hminnovations.org", "sleepfoundation.org",
    "insighttimer.com", "smartrecovery.org", "aa.org", "na.org",
    "recoverydharma.org", "al-anon.org", "adultchildren.org", "coda.org",
    "gamblersanonymous.org", "nicotine-anonymous.org", "oa.org", "7cups.com",
    "thedinnerparty.org", "whatsyourgrief.com", "ted.com", "youtube.com",
    "plumvillage.org", "plumvillage.app", "tarabrach.com", "jackkornfield.com",
    "ifs-institute.com", "thehappinesstrap.com", "compassionatemind.co.uk",
    "dharmaseed.org", "gottman.com", "meditofoundation.org",
    "smilingmind.com.au", "getselfhelp.co.uk", "palousemindfulness.com",
    "uclahealth.org", "findahelpline.com", "findtreatment.gov",
    "prevent-suicide.org.uk", "clearfear.stem4.org.uk", "stem4.org.uk",
    "befrienders.org", "iasp.info", "solvingprocrastination.com",
    "cci.health.wa.gov.au", "wysa.com", "woebothealth.com",
    "marijuana-anonymous.org", "saa-recovery.org",
    "gamingaddictsanonymous.org", "reddit.com", "meetup.com",
    "sharonsalzberg.com", "pemachodronfoundation.org", "sfzc.org",
    "contextualscience.org", "ggia.berkeley.edu",
}

VALID_TYPES = {"article", "video", "app", "book", "worksheet", "podcast", "community"}
VALID_EVIDENCE = {"evidence-based", "emerging", "traditional"}
MAX_RESOURCES_PER_ITEM = 10


def eligible_items():
    """Every (collection, id, filepath, item-json) the bot is allowed to touch."""
    out = []
    for coll, folder in (("topics", "topics"), ("practices", "practices"),
                          ("approaches", "approaches")):
        for path in glob.glob(os.path.join(DATA, folder, "*.json")):
            if path in PROTECTED_FILES:
                continue
            item = json.load(open(path, encoding="utf-8"))
            if item.get("id") in PROTECTED_IDS:
                continue
            if len(item.get("resources", [])) >= MAX_RESOURCES_PER_ITEM:
                continue
            out.append((coll, item["id"], path, item))
    return out


def build_prompt(item):
    existing_titles = [r["title"] for r in item.get("resources", [])]
    existing_urls = [r["url"] for r in item.get("resources", [])]
    return f"""You are helping curate ONE new free resource for a mental-health
resource library called "A World That Heals". The platform's entire purpose
is helping people in emotional pain find trustworthy, completely free help
quickly and gently. Write with genuine warmth and empathy, never clinically
cold, never sensationalized.

The topic/practice you're adding a resource to is: "{item.get('title')}"
Its existing lead text: {item.get('lead', '')}

Already-listed resources (do NOT duplicate these): {existing_titles}
Already-listed URLs (do NOT reuse these): {existing_urls}

Propose exactly ONE new free resource for this topic. Requirements:
- The URL's domain MUST be one of these approved trusted sources ONLY:
  {sorted(ALLOWED_DOMAINS)}
- It must be genuinely free to use (no paywall for core value).
- type must be one of: {sorted(VALID_TYPES)}
- evidenceStatus must be one of: {sorted(VALID_EVIDENCE)} — be honest, don't
  inflate a traditional practice to "evidence-based".
- whyHere: one warm, specific sentence on why this helps someone with this
  exact struggle — written the way you'd gently point a friend toward help,
  not marketing copy.

Respond with ONLY this JSON object, nothing else, no markdown fences:
{{"type": "...", "title": "...", "source": "...", "url": "https://...",
"whyHere": "...", "evidenceStatus": "...", "empathyNote": "one sentence on why you chose this, for a human changelog"}}
"""


def call_gemini(prompt, api_key):
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.4, "maxOutputTokens": 500},
    }).encode("utf-8")
    req = Request(f"{GEMINI_URL}?key={api_key}", data=body,
                   headers={"Content-Type": "application/json"}, method="POST")
    with urlopen(req, timeout=30) as r:
        resp = json.load(r)
    text = resp["candidates"][0]["content"]["parts"][0]["text"]
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("no JSON object in model response")
    return json.loads(match.group(0))


def url_domain(url):
    m = re.match(r"https?://(?:www\.)?([^/]+)", url)
    return m.group(1).lower() if m else ""


def url_is_alive(url):
    try:
        req = Request(url, method="HEAD", headers={"User-Agent": "Mozilla/5.0 (AWTH auto-content)"})
        with urlopen(req, timeout=15) as r:
            return r.status < 400
    except HTTPError as e:
        return e.code in (403, 405)  # some sites block HEAD; treat as reachable
    except URLError:
        return False


def validate_draft(draft, item):
    if draft.get("type") not in VALID_TYPES:
        return False, "invalid resource type"
    if draft.get("evidenceStatus") not in VALID_EVIDENCE:
        return False, "invalid evidenceStatus"
    url = draft.get("url", "")
    if not url.startswith("https://"):
        return False, "url must be https"
    if url_domain(url) not in ALLOWED_DOMAINS:
        return False, f"domain '{url_domain(url)}' not in allowlist"
    if url in [r["url"] for r in item.get("resources", [])]:
        return False, "duplicate url"
    if not draft.get("title") or not draft.get("source") or not draft.get("whyHere"):
        return False, "missing required text field"
    if not url_is_alive(url):
        return False, "url did not respond (dead link)"
    return True, "ok"


def append_log(entry):
    log = json.load(open(LOG_PATH, encoding="utf-8")) if os.path.exists(LOG_PATH) else []
    log.insert(0, entry)
    json.dump(log[:200], open(LOG_PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=2)


def main():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY not set — skipping this run (no autonomous action taken).")
        return 0

    candidates = eligible_items()
    if not candidates:
        print("No eligible items (all at resource cap or protected). Skipping.")
        return 0

    random.shuffle(candidates)
    for coll, item_id, path, item in candidates[:5]:  # try a few in case one fails validation
        print(f"Trying: {coll}/{item_id}")
        try:
            draft = call_gemini(build_prompt(item), api_key)
        except Exception as e:
            print(f"  model call failed: {e}")
            continue

        ok, reason = validate_draft(draft, item)
        if not ok:
            print(f"  rejected: {reason}")
            continue

        resource = {
            "type": draft["type"], "title": draft["title"], "source": draft["source"],
            "url": draft["url"], "whyHere": draft["whyHere"], "evidenceStatus": draft["evidenceStatus"],
        }
        item.setdefault("resources", []).append(resource)
        json.dump(item, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

        # Structural safety net: if this somehow breaks validation, revert and stop.
        rc = os.system(f'python "{os.path.join(ROOT, "tools", "maintain.py")}"')
        if rc != 0:
            print("  post-write validation FAILED — reverting this file.")
            os.system(f'git -C "{ROOT}" checkout -- "{path}"')
            continue

        append_log({
            "collection": coll, "id": item_id, "resource": resource,
            "empathyNote": draft.get("empathyNote", ""),
        })
        print(f"  ADDED: {resource['title']} -> {coll}/{item_id}")
        with open(os.environ.get("GITHUB_OUTPUT", os.devnull), "a") as f:
            f.write("added=true\n")
            f.write(f"summary=Added '{resource['title']}' to {item_id} ({coll})\n")
        return 0

    print("No candidate passed validation this run — nothing committed.")
    with open(os.environ.get("GITHUB_OUTPUT", os.devnull), "a") as f:
        f.write("added=false\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
