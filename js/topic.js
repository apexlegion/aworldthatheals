/* topic.js — renders a single topic page from ?id= param. */

import { loadTopic, loadIndex, EVIDENCE_LABEL } from "./data.js";
import { ICON, emergencyStripHTML } from "./app.js";

function badge(status) {
  const info = EVIDENCE_LABEL[status] || EVIDENCE_LABEL["evidence-based"];
  return `<span class="ev-badge ev-badge--${info.cls}">${info.text}</span>`;
}

const RESOURCE_LABELS = {
  article: "Articles & guides", video: "Videos", app: "Apps",
  book: "Books", worksheet: "Worksheets", podcast: "Podcasts", community: "Communities",
};

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

function renderResources(resources) {
  if (!resources || !resources.length) return "";
  const groups = {};
  for (const r of resources) (groups[r.type] ||= []).push(r);
  const order = ["article", "video", "app", "worksheet", "book", "podcast", "community"];
  const types = Object.keys(groups).sort((a, b) => order.indexOf(a) - order.indexOf(b));

  const html = types.map((type) => {
    const items = groups[type].map((r) => `
      <div class="resource">
        <div class="resource__top">
          <a class="resource__title" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)}${ICON.external}</a>
          <span class="resource__source">${esc(r.source)}</span>
          ${r.evidenceStatus ? badge(r.evidenceStatus) : ""}
        </div>
        ${r.whyHere ? `<p class="resource__why">${esc(r.whyHere)}</p>` : ""}
      </div>`).join("");
    return `<div class="resource-group">
        <div class="resource-group__label">${RESOURCE_LABELS[type] || type}</div>
        ${items}
      </div>`;
  }).join("");

  return `<section class="panel"><h2>Free resources</h2>${html}</section>`;
}

function renderCoping(coping) {
  if (!coping) return "";
  let html = "";
  if (coping.immediate?.length) {
    html += `<section class="panel"><h2>If you need relief right now</h2><div class="tool-list">` +
      coping.immediate.map((t) => `<div class="tool"><h3>${esc(t.title)}</h3>${t.steps ? `<ol>${t.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>` : ""}${t.description ? `<p>${esc(t.description)}</p>` : ""}</div>`).join("") +
      `</div></section>`;
  }
  if (coping.longTerm?.length) {
    html += `<section class="panel panel--dark"><h2>Practices that help over time</h2><div class="tool-list">` +
      coping.longTerm.map((t) => `<div class="tool"><h3>${esc(t.title)}</h3><p>${esc(t.description)}</p></div>`).join("") +
      `</div></section>`;
  }
  return html;
}

function renderSymptoms(symptoms) {
  if (!symptoms || !symptoms.length) return "";
  return `<section class="panel panel--dark"><h2>What it can feel like</h2>
    <p>Everyone experiences this differently. You don't need to have all of these — this is just to help you recognise what you're going through.</p>
    <div class="chip-list">${symptoms.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div></section>`;
}

async function renderRelated(ids) {
  if (!ids || !ids.length) return "";
  let index = [];
  try { index = await loadIndex(); } catch { return ""; }
  const byId = Object.fromEntries(index.map((t) => [t.id, t]));
  const tiles = ids.map((id) => byId[id]).filter(Boolean).map((t) =>
    `<a class="related-tile" href="topic.html?id=${t.id}">${t.title} ${ICON.arrow}</a>`).join("");
  if (!tiles) return "";
  return `<section class="panel--dark panel"><h2>Related topics</h2><div class="related-grid">${tiles}</div></section>`;
}

async function init() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const root = document.getElementById("topic-root");
  if (!id) { root.innerHTML = notFound(); return; }

  let topic;
  try { topic = await loadTopic(id); }
  catch { root.innerHTML = notFound(); return; }

  document.title = `${topic.title} — A World That Heals`;
  const crisis = topic.isCrisisTopic;

  const paras = Array.isArray(topic.explanation) ? topic.explanation : [topic.explanation];

  root.innerHTML = `
    <div class="container topic-hero">
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a> &nbsp;/&nbsp; ${esc(topic.title)}</nav>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:12px">${badge(topic.evidenceStatus)}</div>
      <h1>${esc(topic.title)}</h1>
      ${topic.lead ? `<p class="topic-lead">${esc(topic.lead)}</p>` : ""}
    </div>
    <div class="container topic-body">
      ${crisis ? emergencyStripHTML({ large: true, heading: "Please reach out — you deserve support right now" }) : ""}
      <section class="panel"><h2>Understanding it</h2>${paras.map((p) => `<p>${esc(p)}</p>`).join("")}</section>
      ${renderSymptoms(topic.symptoms)}
      ${renderCoping(topic.copingTools)}
      ${renderResources(topic.resources)}
      <div id="related-slot"></div>
      ${!crisis ? emergencyStripHTML({}) : ""}
    </div>`;

  document.getElementById("related-slot").innerHTML = await renderRelated(topic.relatedTopics);
  window.scrollTo(0, 0);
}

function notFound() {
  return `<div class="container topic-hero">
      <nav class="breadcrumb"><a href="index.html">Home</a></nav>
      <h1>We couldn't find that page</h1>
      <p class="topic-lead">The topic you're looking for isn't here — it may have moved, or the link may be incomplete. Head back home to search, or reach a real person now.</p>
      <div class="stack-4" style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap">
        <a class="btn btn--primary" href="index.html">Back to home</a>
        <a class="btn btn--ghost" href="emergency.html">Get help now</a>
      </div>
    </div>`;
}

init().catch((err) => {
  console.error(err);
  document.getElementById("topic-root").innerHTML = notFound();
});
