/* sw.js — offline support: precache app shell + data, runtime-cache topics. */

const VERSION = "awth-v2";
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;

const SHELL_ASSETS = [
  "index.html",
  "topic.html",
  "emergency.html",
  "about.html",
  "library.html",
  "practices.html", "practice.html",
  "approaches.html", "approach.html",
  "teachers.html", "teacher.html",
  "recovery.html", "apps.html",
  "stories.html", "story.html",
  "communities.html", "meetings.html",
  "css/styles.css",
  "css/lib.css",
  "js/app.js",
  "js/i18n.js",
  "js/data.js",
  "js/search.js",
  "js/topic.js",
  "js/emergency.js",
  "js/detail.js",
  "js/directory.js",
  "js/meetings.js",
  "data/topics-index.json",
  "data/practices-index.json",
  "data/approaches-index.json",
  "data/teachers-index.json",
  "data/stories-index.json",
  "data/recovery.json",
  "data/apps.json",
  "data/communities.json",
  "data/meetings.json",
  "data/synonyms.json",
  "data/crisis-terms.json",
  "data/emergency.json",
  "data/i18n/en.json",
  "manifest.webmanifest",
  "icons/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request);
  if (url.origin !== self.location.origin) return; // let external resource links pass through

  // Topic JSON + any data: stale-while-revalidate so visited topics work offline.
  if (url.pathname.includes("/data/")) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // App shell / navigations: cache-first with network fallback.
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((res) => {
      return caches.open(RUNTIME).then((cache) => { cache.put(request, res.clone()); return res; });
    }).catch(() => caches.match("index.html")))
  );
});

function staleWhileRevalidate(request) {
  return caches.open(RUNTIME).then((cache) =>
    cache.match(request).then((cached) => {
      const network = fetch(request).then((res) => { cache.put(request, res.clone()); return res; }).catch(() => cached);
      return cached || network;
    })
  );
}
