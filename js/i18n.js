/* i18n.js — lightweight internationalisation foundation.
   Loads a language catalog and translates any element carrying data-i18n
   (text) or data-i18n-attr="attr:key;attr:key" (attributes).
   Content pages (topics, practices, etc.) remain English for now — full
   content translation is a later phase — but the architecture is here and
   the shared UI chrome switches language today. */

const LANG_KEY = "awth-lang";
export const AVAILABLE = { en: "English", es: "Español" };

let catalog = {};

export function currentLang() {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved && AVAILABLE[saved]) return saved;
  const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
  return AVAILABLE[nav] ? nav : "en";
}

export function t(key, fallback = "") {
  return catalog[key] != null ? catalog[key] : fallback;
}

export function setLang(lang) {
  if (!AVAILABLE[lang]) return;
  localStorage.setItem(LANG_KEY, lang);
  location.reload();
}

function apply(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const v = catalog[el.getAttribute("data-i18n")];
    if (v != null) el.textContent = v;
  });
  root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    el.getAttribute("data-i18n-attr").split(";").forEach((pair) => {
      const [attr, key] = pair.split(":").map((s) => s.trim());
      if (attr && key && catalog[key] != null) el.setAttribute(attr, catalog[key]);
    });
  });
}

export async function initI18n(root) {
  const lang = currentLang();
  document.documentElement.lang = lang;
  if (lang !== "en") {
    try {
      const res = await fetch(`data/i18n/${lang}.json`);
      if (res.ok) catalog = await res.json();
    } catch { catalog = {}; }
  }
  apply(root || document);
  return { lang, t };
}
