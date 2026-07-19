/* detail.js — generic detail-page renderer driven by a flexible "sections" schema.
   Powers practices, approaches, teachers, and stories. Usage:
     import { renderDetail } from "./detail.js";
     renderDetail({ collection: "practices", backHref: "practices.html", backLabel: "Practices" });
*/

import { EVIDENCE_LABEL } from "./data.js";
import { ICON, emergencyStripHTML } from "./app.js";

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

function badge(status) {
  if (!status) return "";
  const info = EVIDENCE_LABEL[status] || EVIDENCE_LABEL["evidence-based"];
  return `<span class="ev-badge ev-badge--${info.cls}">${info.text}</span>`;
}

const RESOURCE_LABELS = {
  article: "Articles & guides", video: "Videos", app: "Apps",
  book: "Books", worksheet: "Worksheets", podcast: "Podcasts", community: "Communities",
};

function block(b) {
  switch (b.kind) {
    case "p": return `<p>${esc(b.text)}</p>`;
    case "steps": return `<ol class="detail-steps">${b.items.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>`;
    case "chips": return `<div class="chip-list">${b.items.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div>`;
    case "quote": return `<blockquote class="detail-quote">${esc(b.text)}</blockquote>`;
    case "meta": return `<dl class="meta-list">${b.items.map((m) => `<div><dt>${esc(m.label)}</dt><dd>${esc(m.value)}</dd></div>`).join("")}</dl>`;
    default: return "";
  }
}

function section(sec) {
  const cls = sec.style === "dark" ? "panel panel--dark" : "panel";
  const body = (sec.blocks || []).map(block).join("");
  return `<section class="${cls}">${sec.heading ? `<h2>${esc(sec.heading)}</h2>` : ""}${body}</section>`;
}

function resources(list) {
  if (!list || !list.length) return "";
  const groups = {};
  for (const r of list) (groups[r.type] ||= []).push(r);
  const order = ["article", "video", "app", "worksheet", "book", "podcast", "community"];
  const types = Object.keys(groups).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const html = types.map((type) => {
    const items = groups[type].map((r) => `
      <div class="resource">
        <div class="resource__top">
          <a class="resource__title" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)}${ICON.external}</a>
          <span class="resource__source">${esc(r.source)}</span>
          ${badge(r.evidenceStatus)}
        </div>
        ${r.whyHere ? `<p class="resource__why">${esc(r.whyHere)}</p>` : ""}
      </div>`).join("");
    return `<div class="resource-group"><div class="resource-group__label">${RESOURCE_LABELS[type] || type}</div>${items}</div>`;
  }).join("");
  return `<section class="panel"><h2>Free resources</h2>${html}</section>`;
}

function profileHead(item) {
  const initials = (item.title || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return `<div class="profile-head">
      <div class="profile-avatar" aria-hidden="true">${esc(initials)}</div>
      <div>
        <h1>${esc(item.title)}</h1>
        ${item.role ? `<div class="profile-head__role">${esc(item.role)}</div>` : ""}
      </div>
    </div>`;
}

async function relatedBlock(item, detailBase) {
  if (!item.related || !item.related.length) return "";
  const tiles = item.related.map((r) => {
    const href = r.href || `${r.detailBase || detailBase}.html?id=${r.id}`;
    return `<a class="related-tile" href="${esc(href)}">${esc(r.title)} ${ICON.arrow}</a>`;
  }).join("");
  return `<section class="panel panel--dark"><h2>Related</h2><div class="related-grid">${tiles}</div></section>`;
}

const SINGULAR = { practices: "practice", approaches: "approach", teachers: "teacher", stories: "story" };

export async function renderDetail({ collection, detailBase, backHref, backLabel, profile = false }) {
  detailBase = detailBase || SINGULAR[collection] || collection.replace(/s$/, "");
  const root = document.getElementById("detail-root");
  const id = new URLSearchParams(location.search).get("id");
  if (!id) { root.innerHTML = notFound(backHref, backLabel); return; }

  const safe = id.replace(/[^a-z0-9-]/gi, "");
  let item;
  try {
    const res = await fetch(`data/${collection}/${safe}.json`);
    if (!res.ok) throw new Error("404");
    item = await res.json();
  } catch { root.innerHTML = notFound(backHref, backLabel); return; }

  document.title = `${item.title} — A World That Heals`;

  const paras = item.lead ? `<p class="topic-lead">${esc(item.lead)}</p>` : "";
  const sections = (item.sections || []).map(section).join("");

  root.innerHTML = `
    <div class="container page-intro">
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a> &nbsp;/&nbsp; <a href="${esc(backHref)}">${esc(backLabel)}</a> &nbsp;/&nbsp; ${esc(item.title)}</nav>
      ${item.category || item.evidenceStatus ? `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">${item.category ? `<span class="tag">${esc(item.category)}</span>` : ""}${badge(item.evidenceStatus)}</div>` : ""}
      ${profile ? profileHead(item) : `<h1>${esc(item.title)}</h1>`}
      ${paras}
    </div>
    <div class="container topic-body">
      ${sections}
      ${resources(item.resources)}
      <div id="related-slot"></div>
      ${emergencyStripHTML({})}
    </div>`;

  document.getElementById("related-slot").innerHTML = await relatedBlock(item, detailBase);
  window.scrollTo(0, 0);
}

function notFound(backHref, backLabel) {
  return `<div class="container page-intro">
      <nav class="breadcrumb"><a href="index.html">Home</a></nav>
      <h1>We couldn't find that page</h1>
      <p class="topic-lead">It may have moved, or the link may be incomplete.</p>
      <div style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap">
        <a class="btn btn--primary" href="${esc(backHref)}">Back to ${esc(backLabel)}</a>
        <a class="btn btn--ghost" href="emergency.html">Get help now</a>
      </div>
    </div>`;
}
