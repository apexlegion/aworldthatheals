/* data.js — fetch helpers for topic index and individual topics. */

let _indexCache = null;
let _synonymCache = null;
let _crisisCache = null;

export async function loadIndex() {
  if (_indexCache) return _indexCache;
  const res = await fetch("data/topics-index.json");
  if (!res.ok) throw new Error("index load failed");
  _indexCache = await res.json();
  return _indexCache;
}

export async function loadTopic(id) {
  const safe = String(id).replace(/[^a-z0-9-]/gi, "");
  const res = await fetch(`data/topics/${safe}.json`);
  if (!res.ok) throw new Error("topic not found");
  return res.json();
}

export async function loadSynonyms() {
  if (_synonymCache) return _synonymCache;
  const res = await fetch("data/synonyms.json");
  _synonymCache = res.ok ? await res.json() : {};
  return _synonymCache;
}

export async function loadCrisisTerms() {
  if (_crisisCache) return _crisisCache;
  const res = await fetch("data/crisis-terms.json");
  _crisisCache = res.ok ? await res.json() : [];
  return _crisisCache;
}

export async function loadEmergency() {
  const res = await fetch("data/emergency.json");
  if (!res.ok) throw new Error("emergency data load failed");
  return res.json();
}

export const EVIDENCE_LABEL = {
  "evidence-based": { text: "Evidence-based", cls: "based" },
  "emerging":       { text: "Emerging evidence", cls: "emerging" },
  "traditional":    { text: "Traditional / spiritual", cls: "trad" },
};
