/* search.js — home page: intent-driven phrase-matching search + topic grid. */

import { loadIndex, loadSynonyms, loadCrisisTerms } from "./data.js";
import { ICON, emergencyStripHTML } from "./app.js";

const STOP = new Set(["i","im","i'm","a","an","the","to","of","and","is","am","are","my","me","feel","feeling","feels","so","very","really","just","cant","can't","cannot","dont","don't","been","have","has","having","was","it","this","that","with","for","about","like","get","getting"]);

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s']/g, " ").replace(/\s+/g, " ").trim();
}
function tokens(str) {
  return normalize(str).split(" ").filter((w) => w && !STOP.has(w));
}

/* Expand a token set with synonyms (both directions). */
function expand(tokenList, synonyms) {
  const set = new Set(tokenList);
  for (const t of tokenList) {
    const syns = synonyms[t];
    if (syns) syns.forEach((s) => normalize(s).split(" ").forEach((w) => w && set.add(w)));
  }
  return set;
}

/* Score a topic against the user's expanded token set. */
function scoreTopic(topic, userTokens, userNorm) {
  let score = 0;
  // Whole-phrase match is strongest signal.
  for (const phrase of topic.matchPhrases || []) {
    const pn = normalize(phrase);
    if (!pn) continue;
    if (userNorm === pn) score += 12;
    else if (userNorm.includes(pn) || pn.includes(userNorm)) score += 6;
  }
  // Token overlap against phrases + title + keywords.
  const topicTokens = new Set();
  (topic.matchPhrases || []).forEach((p) => tokens(p).forEach((t) => topicTokens.add(t)));
  tokens(topic.title).forEach((t) => topicTokens.add(t));
  (topic.keywords || []).forEach((k) => tokens(k).forEach((t) => topicTokens.add(t)));
  for (const t of userTokens) if (topicTokens.has(t)) score += 2;
  return score;
}

export async function runSearch(query, { index, synonyms }) {
  const userNorm = normalize(query);
  const base = tokens(query);
  const userTokens = expand(base, synonyms);
  const ranked = index
    .map((t) => ({ topic: t, score: scoreTopic(t, userTokens, userNorm) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
  return ranked.slice(0, 3);
}

function containsCrisisTerm(query, crisisTerms) {
  const n = normalize(query);
  return crisisTerms.some((term) => n.includes(normalize(term)));
}

/* ---- Rendering ---------------------------------------------------------- */
function badge(status) {
  const map = { "evidence-based": ["based","Evidence-based"], "emerging": ["emerging","Emerging"], "traditional": ["trad","Traditional"] };
  const [cls, text] = map[status] || map["evidence-based"];
  return `<span class="ev-badge ev-badge--${cls}">${text}</span>`;
}

function resultCard(topic) {
  return `<a class="result-card" href="topic.html?id=${topic.id}">
      <div class="result-card__body">
        <div class="result-card__title">${topic.title}</div>
        <div class="result-card__blurb">${topic.blurb}</div>
      </div>
      <span class="result-card__arrow">${ICON.arrow}</span>
    </a>`;
}

function topicTile(topic) {
  return `<a class="topic-tile" href="topic.html?id=${topic.id}">
      <span class="topic-tile__title">${topic.title}</span>
      <span class="topic-tile__blurb">${topic.blurb}</span>
      ${badge(topic.evidenceStatus)}
    </a>`;
}

export async function initHome() {
  const [index, synonyms, crisisTerms] = await Promise.all([loadIndex(), loadSynonyms(), loadCrisisTerms()]);

  // Populate grid (alphabetical, crisis topic pinned but shown normally).
  const grid = document.getElementById("topic-grid");
  const sorted = [...index].sort((a, b) => a.title.localeCompare(b.title));
  grid.innerHTML = sorted.map(topicTile).join("");

  const form = document.getElementById("search-form");
  const input = document.getElementById("search-input");
  const results = document.getElementById("results");

  function render(query) {
    const q = query.trim();
    if (!q) { results.hidden = true; results.innerHTML = ""; return; }

    const crisis = containsCrisisTerm(q, crisisTerms);
    runSearch(q, { index, synonyms }).then((ranked) => {
      let html = "";
      if (crisis) html += emergencyStripHTML({ heading: "It sounds like you may be in real pain right now" });
      if (ranked.length) {
        html += `<p class="search__hint" role="status">Showing resources that may help:</p>`;
        html += ranked.map((r) => resultCard(r.topic)).join("");
      } else if (!crisis) {
        html += `<div class="empty-state"><p>We couldn't match that to a topic yet — but you're not at a dead end. Browse everything below, or <a href="emergency.html">reach a real person now</a>.</p></div>`;
      }
      results.innerHTML = html;
      results.hidden = false;
      results.classList.remove("rise"); void results.offsetWidth; results.classList.add("rise");
    });
  }

  form.addEventListener("submit", (e) => { e.preventDefault(); render(input.value); });

  // Live search (debounced) once the user has typed enough.
  let t;
  input.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => { if (input.value.trim().length >= 3) render(input.value); else { results.hidden = true; } }, 220);
  });

  // Example prompt chips
  document.querySelectorAll("[data-example]").forEach((btn) => {
    btn.addEventListener("click", () => {
      input.value = btn.dataset.example;
      input.focus();
      render(input.value);
      results.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });
}

initHome().catch((err) => {
  console.error(err);
  const results = document.getElementById("results");
  if (results) { results.hidden = false; results.innerHTML = `<div class="empty-state"><p>Something went wrong loading resources. Please refresh. If you need help now, <a href="emergency.html">find a crisis line</a>.</p></div>`; }
});
