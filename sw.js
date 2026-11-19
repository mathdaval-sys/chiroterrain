/* ChiroTerrain — service worker : appli disponible hors ligne + cache des fonds IGN */
const VERSION = '1.1.0';
const APP_CACHE = 'ct-app-' + VERSION;
const TILE_CACHE = 'ct-tuiles';
const SHELL = ['./', './index.html', './app.js', './manifest.webmanifest', './lib/leaflet.js', './lib/leaflet.css', './lib/proj4.js', './lib/jszip.min.js',
  './lib/images/layers.png', './lib/images/layers-2x.png', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(APP_CACHE).then(c => c.addAll(SHELL))); });
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('ct-app-') && k !== APP_CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });

async function tile(req) {
  const cache = await caches.open(TILE_CACHE);
  const hit = await cache.match(req.url);
  if (hit) return hit;
  try {
    const r = await fetch(req.url, { mode: 'cors' });
    if (r.ok) cache.put(req.url, r.clone());
    return r;
  } catch (e) {
    try { const r = await fetch(req); if (r.type === 'opaque') cache.put(req.url, r.clone()); return r; }
    catch (e2) { return new Response('', { status: 504 }); }
  }
}
async function shell(req) {
  const cache = await caches.open(APP_CACHE);
  const hit = await cache.match(req, { ignoreSearch: true });
  if (hit) return hit;
  try { return await fetch(req); }
  catch (e) { return (await cache.match('./index.html')) || new Response('Hors ligne', { status: 503 }); }
}
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.hostname === 'data.geopf.fr') e.respondWith(tile(e.request));
  else if (u.origin === self.location.origin) e.respondWith(shell(e.request));
});
