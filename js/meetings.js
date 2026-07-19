/* meetings.js — timezone-aware finder for free recurring online meetings.
   Each meeting recurs weekly at a UTC day/time; we compute the next occurrence
   and display it in the user's local timezone, sorted soonest-first. */

import { ICON } from "./app.js";

function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

/* Next weekly occurrence (as a Date) for a given UTC weekday (0=Sun) + HH:MM UTC. */
function nextOccurrence(dayUTC, timeUTC) {
  const [h, m] = timeUTC.split(":").map(Number);
  const now = new Date();
  const result = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m, 0));
  let delta = (dayUTC - result.getUTCDay() + 7) % 7;
  result.setUTCDate(result.getUTCDate() + delta);
  if (result.getTime() < now.getTime()) result.setUTCDate(result.getUTCDate() + 7);
  return result;
}

function relativeLabel(date) {
  const mins = Math.round((date - Date.now()) / 60000);
  if (mins < 60) return `in ${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `in ${hrs} hr${hrs === 1 ? "" : "s"}`;
  const days = Math.round(hrs / 24);
  return `in ${days} day${days === 1 ? "" : "s"}`;
}

export async function initMeetings() {
  const res = await fetch("data/meetings.json");
  const data = await res.json();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "your local time";

  const tzEl = document.getElementById("tz-label");
  if (tzEl) tzEl.textContent = tz;
  const noteEl = document.getElementById("meeting-note");
  if (noteEl) noteEl.textContent = data.note;

  const meetings = data.meetings.map((mtg) => ({ ...mtg, next: nextOccurrence(mtg.dayUTC, mtg.timeUTC) }));

  const list = document.getElementById("meeting-list");
  const bar = document.getElementById("filter-bar");
  const types = ["all", ...Array.from(new Set(meetings.map((m) => m.type)))];
  let active = "all";

  const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: "short" });
  const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

  function card(m) {
    const cont = m.format.includes("24/7");
    return `<div class="meeting-card">
        <div class="meeting-time">${cont ? "24/7" : esc(timeFmt.format(m.next))}<br><span style="font-size:var(--fs-12);color:var(--text-faint);font-weight:600">${cont ? "always" : esc(dayFmt.format(m.next)) + " · " + relativeLabel(m.next)}</span></div>
        <div class="meeting-info">
          <h3>${esc(m.name)}</h3>
          <p>${esc(m.type)} · ${esc(m.format)}${m.langs ? " · " + esc(m.langs) : ""}</p>
        </div>
        <a class="btn btn--primary" href="${esc(m.url)}" target="_blank" rel="noopener noreferrer">Join ${ICON.external}</a>
      </div>`;
  }

  function draw() {
    const shown = (active === "all" ? meetings : meetings.filter((m) => m.type === active))
      .slice().sort((a, b) => a.next - b.next);
    list.innerHTML = shown.map(card).join("") || `<div class="empty-state"><p>No meetings match that filter.</p></div>`;
  }

  bar.innerHTML = types.map((t) =>
    `<button class="filter-chip" type="button" data-type="${esc(t)}" aria-pressed="${t === "all"}">${t === "all" ? "All" : esc(t)}</button>`).join("");
  bar.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-type]");
    if (!btn) return;
    active = btn.dataset.type;
    bar.querySelectorAll(".filter-chip").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.type === active)));
    draw();
  });
  draw();
}

initMeetings().catch((err) => {
  console.error(err);
  const list = document.getElementById("meeting-list");
  if (list) list.innerHTML = `<div class="empty-state"><p>Couldn't load meetings. Try the <a href="recovery.html">recovery directory</a> to find official schedules.</p></div>`;
});
