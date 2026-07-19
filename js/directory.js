/* directory.js — generic filterable card directory.
   Config object:
     { data, mount, filterKey, detailPattern, external }
   - data: array of items (already loaded) OR a url string to fetch
   - mount: container id
   - filterKey: item field to build filter chips from (optional)
   - detailPattern: (item) => href  OR omit + external:true to link item.url
*/

import { ICON } from "./app.js";

function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

function card(item, hrefFn, external) {
  const href = hrefFn ? hrefFn(item) : item.url;
  const ext = external || !hrefFn;
  const tags = (item.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("");
  const freeTag = item.free ? `<span class="tag tag--free">Free</span>` : "";
  return `<a class="dir-card" href="${esc(href)}" ${ext ? 'target="_blank" rel="noopener noreferrer"' : ""}>
      ${item.category ? `<div class="dir-card__meta">${esc(item.category)}</div>` : ""}
      <div class="dir-card__title">${esc(item.title)}${ext ? ICON.external : ""}</div>
      <div class="dir-card__blurb">${esc(item.blurb || item.description || "")}</div>
      <div class="dir-card__tags">${freeTag}${tags}</div>
    </a>`;
}

export async function initDirectory({ data, mount, filterKey, detailPattern, external }) {
  const container = document.getElementById(mount);
  let items = Array.isArray(data) ? data : await (await fetch(data)).json();

  // Build filter chips
  let active = "all";
  const cats = filterKey ? ["all", ...Array.from(new Set(items.map((i) => i[filterKey]).filter(Boolean)))] : [];
  const bar = document.getElementById("filter-bar");
  const grid = document.getElementById(mount);

  function draw() {
    const shown = active === "all" ? items : items.filter((i) => i[filterKey] === active);
    grid.innerHTML = shown.map((i) => card(i, detailPattern, external)).join("") ||
      `<div class="empty-state"><p>Nothing here yet.</p></div>`;
  }

  if (bar && cats.length > 1) {
    bar.innerHTML = cats.map((c) =>
      `<button class="filter-chip" type="button" data-cat="${esc(c)}" aria-pressed="${c === "all"}">${c === "all" ? "All" : esc(c)}</button>`).join("");
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cat]");
      if (!btn) return;
      active = btn.dataset.cat;
      bar.querySelectorAll(".filter-chip").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === active)));
      draw();
    });
  }
  draw();
}
