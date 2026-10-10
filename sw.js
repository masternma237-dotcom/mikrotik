// ═══════════════════════════════════════════════════════════════
// FICHIER GÉNÉRÉ par tools/build-sw.js — ne pas modifier à la main.
// Service worker : mode hors ligne du guide (HTTPS ou localhost uniquement).
//  • pré-cache des fichiers locaux ;
//  • fichiers locaux : réponse du cache puis mise à jour en arrière-plan ;
//  • ressources externes (polices, icônes, coloration) : mises en cache à la 1re utilisation.
// ═══════════════════════════════════════════════════════════════
const VERSION = '2.0.1';
const CACHE = 'mk-guide-' + VERSION;
const RUNTIME = 'mk-guide-runtime';
const PRECACHE = [
  "./",
  "assets/apple-touch-icon.png",
  "assets/favicon-96x96.png",
  "assets/favicon.ico",
  "assets/web-app-manifest-192x192.png",
  "assets/web-app-manifest-512x512.png",
  "css/styles.css",
  "data/core.js",
  "data/diagrams-core.js",
  "data/diagrams-exploitation.js",
  "data/diagrams-interconnexion.js",
  "data/diagrams-securite.js",
  "data/diagrams-services.js",
  "data/diagrams-v2.js",
  "data/exploitation-1.js",
  "data/exploitation-2.js",
  "data/glossary-core.js",
  "data/glossary-exploitation.js",
  "data/glossary-interconnexion.js",
  "data/glossary-securite.js",
  "data/glossary-services.js",
  "data/glossary-v2.js",
  "data/interconnexion-1.js",
  "data/interconnexion-2.js",
  "data/interconnexion-3.js",
  "data/labs.js",
  "data/quiz-exploitation.js",
  "data/quiz-interconnexion.js",
  "data/quiz-securite.js",
  "data/quiz-services.js",
  "data/quiz-socle.js",
  "data/securite-1.js",
  "data/securite-2.js",
  "data/services-1.js",
  "data/services-2.js",
  "data/services-3.js",
  "index.html",
  "js/app.js",
  "js/diagrams.js",
  "js/quiz.js",
  "js/registry.js",
  "js/tools/rsc-generator.js",
  "site.webmanifest"
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('mk-guide-') && k !== CACHE && k !== RUNTIME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    // Fichiers du guide : cache d'abord, rafraîchi en arrière-plan ; page d'accueil en secours hors ligne
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(req, { ignoreSearch: true });
        const network = fetch(req).then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
        if (cached) { event.waitUntil(network); return cached; }
        const res = await network;
        return res || (req.mode === 'navigate' ? cache.match('index.html') : Response.error());
      })
    );
    return;
  }

  // Ressources externes : cache d'abord (polices, icônes, coloration syntaxique)
  event.respondWith(
    caches.open(RUNTIME).then(async (cache) => {
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      } catch (e) {
        return Response.error();
      }
    })
  );
});
