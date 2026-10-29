/* Sour Paint Studios Songbook - service worker.
   Goal: the app ALWAYS starts, even on weak or no signal.
   - Page (HTML): network first, but after 2.5 s of waiting it opens the saved copy.
   - Images / scripts: saved copy first, fetched once then kept.
   - Video/audio range requests are left to the network (the intro falls back to the still card).
   RELEASE RULE: change VERSION on every release so old saved files are cleared. */
var VERSION = 'v98';
var CACHE = 'spss-songbook-' + VERSION;
var PAGE_KEY = './';
var NAV_TIMEOUT_MS = 2500;
var EXTRAS = ['manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'art-splash-poster.jpg',
  'art-covers.jpg', 'art-jailhouse.jpg', 'art-originals.jpg', 'art-public-domain.jpg'];

self.addEventListener('install', function (e) {
  e.waitUntil((async function () {
    var cache = await caches.open(CACHE);
    var res = await fetch(new Request(PAGE_KEY, { cache: 'reload' }));
    if (res && res.ok && !res.redirected) await cache.put(PAGE_KEY, res);
    await Promise.all(EXTRAS.map(function (u) {
      return cache.add(new Request(u, { cache: 'reload' })).catch(function () {});
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    var keys = await caches.keys();
    await Promise.all(keys.filter(function (k) { return k.indexOf('spss-songbook-') === 0 && k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.headers.has('range')) return;
  if (/\/sw\.js$/.test(url.pathname)) return;
  if (req.mode === 'navigate') { e.respondWith(handleNavigate(req)); return; }
  e.respondWith(handleAsset(req));
});

async function handleNavigate(req) {
  var cache = await caches.open(CACHE);
  var network = fetch(req).then(function (res) {
    if (res && res.ok && !res.redirected) cache.put(PAGE_KEY, res.clone()).catch(function () {});
    return res;
  });
  network.catch(function () {});
  var timeout = new Promise(function (resolve) { setTimeout(function () { resolve(null); }, NAV_TIMEOUT_MS); });
  try {
    var first = await Promise.race([network, timeout]);
    if (first) return first;
  } catch (err) { /* offline: fall through to the saved copy */ }
  var saved = await cache.match(PAGE_KEY, { ignoreSearch: true });
  if (saved) return saved;
  return network;
}

async function handleAsset(req) {
  var cache = await caches.open(CACHE);
  var hit = await cache.match(req);
  if (hit) return hit;
  try {
    var res = await fetch(req);
    if (res && res.status === 200 && res.type === 'basic') cache.put(req, res.clone()).catch(function () {});
    return res;
  } catch (err) {
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}
