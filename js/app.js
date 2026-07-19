/* app.js — shared shell: header, footer, theme, disclaimer banner, emergency strip.
   Injected on every page. */

import { initI18n, currentLang, setLang, AVAILABLE } from "./i18n.js";

const THEME_KEY = "awth-theme";
const BANNER_KEY = "awth-banner-dismissed";

/* ---- Icons (inline SVG, single stroke family) --------------------------- */
export const ICON = {
  lifebuoy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="m4.9 4.9 4.6 4.6M14.5 14.5l4.6 4.6M19.1 4.9l-4.6 4.6M9.5 14.5l-4.6 4.6"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  external: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>`,
  moon: `<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`,
  sun: `<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`,
  lotus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20c-4 0-7.5-2.2-7.5-2.2S6 12 12 12s7.5 5.8 7.5 5.8S16 20 12 20z"/><path d="M12 12c-2.2-2-2.2-6.5 0-9 2.2 2.5 2.2 7 0 9z"/><path d="M12 12C9 11 6.5 12.5 5 15c3-.2 5.2-1.2 7-3z"/><path d="M12 12c3-1 5.5.5 7 3-3-.2-5.2-1.2-7-3z"/></svg>`,
  wind: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h9a3 3 0 1 1-3 3"/></svg>`,
  brain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 4a2.5 2.5 0 0 0-2.5 2.5A2.5 2.5 0 0 0 5 9a2.5 2.5 0 0 0 1 4v1a2.5 2.5 0 0 0 3.5 2.3V4z"/><path d="M14.5 4A2.5 2.5 0 0 1 17 6.5 2.5 2.5 0 0 1 19 9a2.5 2.5 0 0 1-1 4v1a2.5 2.5 0 0 1-3.5 2.3V4z"/></svg>`,
  people: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 6a3 3 0 0 1 0 6M21 20a6 6 0 0 0-4-5.7"/></svg>`,
  grid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/></svg>`,
  book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5z"/><path d="M4 4.5v16"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="2.5"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20C7 17 3 13.5 3 9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 9 2.5C21 13.5 17 17 12 20z"/></svg>`,
};

const NAV = [
  { href: "index.html", label: "Home" },
  { href: "library.html", label: "Explore" },
  { href: "practices.html", label: "Practices" },
  { href: "approaches.html", label: "Approaches" },
  { href: "teachers.html", label: "Teachers" },
  { href: "recovery.html", label: "Recovery" },
  { href: "apps.html", label: "Apps" },
  { href: "meetings.html", label: "Meetings" },
];

const BRAND_MARK = `<svg class="brand__mark" viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="var(--accent)"/><path d="M16 23c-4-2.6-7-5.4-7-9a3.7 3.7 0 0 1 7-1.6A3.7 3.7 0 0 1 23 14c0 3.6-3 6.4-7 9z" fill="var(--accent-fg)"/></svg>`;

/* ---- Theme -------------------------------------------------------------- */
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) document.documentElement.setAttribute("data-theme", saved);
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme");
  const next = cur === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(THEME_KEY, next);
}
// Apply saved theme ASAP (before paint) to avoid flash.
initTheme();

/* ---- Header ------------------------------------------------------------- */
function renderHeader() {
  const header = document.createElement("header");
  header.className = "site-header";
  const here = location.pathname.split("/").pop() || "index.html";
  const links = NAV.map((n) => `<a href="${n.href}"${n.href === here ? ' aria-current="page"' : ""}>${n.label}</a>`).join("");
  header.innerHTML = `
    <div class="container site-header__inner">
      <a class="brand" href="index.html" aria-label="A World That Heals — home">
        ${BRAND_MARK}
        <span class="brand__name">A World That Heals<small>Free · For everyone</small></span>
      </a>
      <div class="header-spacer"></div>
      <nav class="nav-links" id="nav-links" aria-label="Primary">${links}</nav>
      <div class="header-actions">
        <a class="emergency-link" href="emergency.html">${ICON.lifebuoy}<span data-i18n="nav.getHelp">Get help now</span></a>
        <button class="theme-toggle" type="button" aria-label="Toggle light and dark theme">${ICON.moon}${ICON.sun}</button>
        <button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="nav-links">${ICON.menu}</button>
      </div>
    </div>`;
  header.querySelector(".theme-toggle").addEventListener("click", toggleTheme);
  const navEl = header.querySelector("#nav-links");
  const toggle = header.querySelector(".nav-toggle");
  const setNav = (open) => { navEl.hidden = !open; toggle.setAttribute("aria-expanded", String(open)); };
  const isMobile = () => window.matchMedia("(max-width: 900px)").matches;
  if (isMobile()) setNav(false);
  window.addEventListener("resize", () => { if (!isMobile()) navEl.hidden = false; else if (toggle.getAttribute("aria-expanded") !== "true") navEl.hidden = true; });
  toggle.addEventListener("click", () => setNav(navEl.hidden));
  return header;
}

/* ---- Disclaimer banner -------------------------------------------------- */
function renderBanner() {
  if (sessionStorage.getItem(BANNER_KEY)) return null;
  const banner = document.createElement("div");
  banner.className = "disclaimer-banner";
  banner.setAttribute("role", "note");
  banner.innerHTML = `
    <div class="container disclaimer-banner__inner">
      <p><strong data-i18n="banner.title">This is a library, not a lifeline.</strong> <span data-i18n="banner.body">A World That Heals shares free educational resources — it does not diagnose, treat, or replace professional care. In an emergency,</span> <a href="emergency.html" data-i18n="banner.link">find crisis help near you</a>.</p>
      <button type="button" aria-label="Dismiss this notice">${ICON.close}</button>
    </div>`;
  banner.querySelector("button").addEventListener("click", () => {
    banner.hidden = true;
    sessionStorage.setItem(BANNER_KEY, "1");
  });
  return banner;
}

/* ---- Footer ------------------------------------------------------------- */
function renderFooter() {
  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="container">
      <div class="footer-disclaimer">
        <p><strong data-i18n="footer.disclaimerTitle">Important:</strong> <span data-i18n="footer.disclaimerBody">The information here is for education and navigation only. It is not medical advice, diagnosis, or therapy, and it cannot replace a qualified professional. If you or someone else may be in danger, contact your local emergency services or a crisis line —</span> <a href="emergency.html" data-i18n="footer.disclaimerLink">see resources by country</a>.</p>
      </div>
      <div class="footer-grid">
        <nav class="footer-nav" aria-label="Footer">
          <a href="index.html">Home</a>
          <a href="library.html">Explore</a>
          <a href="practices.html">Practices</a>
          <a href="approaches.html">Approaches</a>
          <a href="teachers.html">Teachers</a>
          <a href="recovery.html">Recovery</a>
          <a href="apps.html">Free apps</a>
          <a href="stories.html">Stories</a>
          <a href="communities.html">Communities</a>
          <a href="meetings.html">Meetings</a>
          <a href="emergency.html">Emergency support</a>
          <a href="about.html">About</a>
        </nav>
        <div>
          <p class="footer-meta" data-i18n="footer.meta">100% free · No ads · No accounts · No tracking. Built on the belief that healing should never be limited by money or access.</p>
          <label class="footer-meta" style="display:inline-flex;gap:8px;align-items:center;margin-top:12px">
            <span data-i18n="lang.label">Language</span>
            <select id="lang-select" aria-label="Language" style="font:inherit;background:var(--surface);color:var(--text);border:1px solid var(--border-strong);border-radius:var(--r-pill);padding:6px 12px;min-height:40px"></select>
          </label>
        </div>
      </div>
    </div>`;
  return footer;
}

/* ---- Emergency strip (reusable) ---------------------------------------- */
export function emergencyStripHTML({ large = false, heading = "If you need help right now" } = {}) {
  return `
    <section class="crisis-strip ${large ? "crisis-strip--lg" : ""}" role="alert" aria-label="Emergency support">
      <div class="crisis-strip__head">${ICON.alert}<h2>${heading}</h2></div>
      <p>If you are thinking about suicide or are worried about your safety, you deserve immediate support from a real person. Crisis lines are free, confidential, and available in most countries.</p>
      <div class="crisis-strip__actions">
        <a class="btn btn--primary" href="emergency.html">Find a crisis line near you ${ICON.arrow}</a>
      </div>
    </section>`;
}

/* ---- Mount -------------------------------------------------------------- */
function mount() {
  // Skip link
  const skip = document.createElement("a");
  skip.className = "skip-link";
  skip.href = "#main";
  skip.textContent = "Skip to main content";
  document.body.prepend(skip);

  document.body.insertBefore(renderHeader(), document.body.children[1] || null);
  const banner = renderBanner();
  if (banner) {
    const header = document.querySelector(".site-header");
    header.after(banner);
  }
  document.body.appendChild(renderFooter());

  // Language switcher
  const langSel = document.getElementById("lang-select");
  if (langSel) {
    const cur = currentLang();
    langSel.innerHTML = Object.entries(AVAILABLE).map(([code, name]) => `<option value="${code}">${name}</option>`).join("");
    langSel.value = cur;
    langSel.addEventListener("change", () => setLang(langSel.value));
  }

  // Apply translations to shared chrome
  initI18n().catch(() => {});

  // Register service worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
