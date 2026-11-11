// Urge Walk — offline (round 3, Nov 9 2026). The three tools keep working with no signal: Walk, Breathe and
// Ground, with their styles, fonts and phone-size photographs in both lights. Pages are fetched fresh when
// online (network first) so updates arrive; everything else is served from cache and refreshed behind.
const VERSION = 'uw-2026-11-11-r2'
const CORE = [
  './', 'index.html', 'walk.html', 'breathe.html', 'ground.html', 'ride.html', 'support.html',
  'site.css', 'places.css', 'site.js', 'tools.json', 'manifest.webmanifest',
  'assets/icon-sg11.svg', 'assets/icon-192-sg11.png', 'assets/icon-512-sg11.png',
  'assets/fonts/cormorant-garamond-latin-300-normal.woff2', 'assets/fonts/cormorant-garamond-latin-300-italic.woff2',
  'assets/fonts/cormorant-garamond-latin-400-italic.woff2', 'assets/fonts/cormorant-garamond-latin-500-normal.woff2',
  'assets/fonts/inter-latin-400-normal.woff2', 'assets/fonts/inter-latin-500-normal.woff2', 'assets/fonts/inter-latin-600-normal.woff2',
  'assets/motion/path-tall.webp', 'assets/motion/path-evening-tall.webp',
  'assets/motion/inlet-tall.webp', 'assets/motion/inlet-evening-tall.webp',
  'assets/motion/shore-tall.webp', 'assets/motion/shore-evening-tall.webp',
  'assets/motion/shore-tall.jpg', 'assets/motion/shore-wide.jpg',
]
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return
  if (req.headers.has('range') || /\.mp4$/.test(new URL(req.url).pathname)) return // footage streams from the network, never cached
  const isPage = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')
  if (isPage) {
    // Network first: fresh pages online, the saved copy offline (or the walk, as the one page that always helps).
    e.respondWith(fetch(req).then((res) => {
      const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('walk.html'))))
    return
  }
  // Everything else: from cache at once, refreshed in the background.
  e.respondWith(caches.match(req).then((hit) => {
    const net = fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)) } return res }).catch(() => hit)
    return hit || net
  }))
})
