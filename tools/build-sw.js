#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// Génère sw.js (service worker du mode hors ligne) à partir de index.html :
//   node tools/build-sw.js          → écrit sw.js
//   node tools/build-sw.js --check  → échoue si sw.js n'est pas à jour (utilisé par validate.js)
// La liste de pré-cache = fichiers locaux référencés par index.html + dossier assets/.
// La version du cache suit MK.version : tout changement de version renouvelle le cache.
// ═══════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

function build() {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const reg = fs.readFileSync(path.join(root, 'js', 'registry.js'), 'utf8');
  const version = (/version:\s*'([^']+)'/.exec(reg) || [])[1];
  if (!version) throw new Error('Version introuvable dans js/registry.js');

  const local = new Set(['./', 'index.html', 'site.webmanifest']);
  for (const m of html.matchAll(/(?:src|href)="((?:css|js|data|assets)\/[^"#?]+)"/g)) local.add(m[1]);
  const assetsDir = path.join(root, 'assets');
  if (fs.existsSync(assetsDir)) for (const f of fs.readdirSync(assetsDir).sort()) local.add('assets/' + f);
  const list = [...local].sort((a, b) => (a === './' ? -1 : b === './' ? 1 : a.localeCompare(b)));

  return `// ═══════════════════════════════════════════════════════════════
// FICHIER GÉNÉRÉ par tools/build-sw.js — ne pas modifier à la main.
// Service worker : mode hors ligne du guide (HTTPS ou localhost uniquement).
//  • pré-cache des fichiers locaux ;
//  • fichiers locaux : réponse du cache puis mise à jour en arrière-plan ;
//  • ressources externes (polices, icônes, coloration) : mises en cache à la 1re utilisation.
// ═══════════════════════════════════════════════════════════════
const VERSION = '${version}';
const CACHE = 'mk-guide-' + VERSION;
const RUNTIME = 'mk-guide-runtime';
const PRECACHE = ${JSON.stringify(list, null, 2)};

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
`;
}

const out = path.join(root, 'sw.js');
const next = build();
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
  if (cur !== next) { console.error('sw.js est périmé : lancez  node tools/build-sw.js'); process.exit(1); }
  console.log('sw.js à jour');
} else {
  fs.writeFileSync(out, next);
  console.log('sw.js généré (' + (next.match(/"[^"]+",?\n/g) || []).length + ' fichiers pré-cachés)');
}
