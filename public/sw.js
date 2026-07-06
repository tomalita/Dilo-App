const CACHE = 'dilo-v2';

const CDN_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.tailwindcss.com',
  'fonts.googleapis.com',
];

const SKIP_HOSTS = [
  'supabase.co',
  'generativelanguage.googleapis.com',
];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache: Supabase realtime/auth, Gemini API
  if (SKIP_HOSTS.some(h => url.hostname.includes(h))) return;

  // CDN fonts/styles — cache first, revalidate in background
  if (CDN_HOSTS.some(h => url.hostname.includes(h))) {
    e.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Same-origin JS/CSS/images — cache first (content-hashed, safe)
  if (
    url.origin === self.location.origin &&
    (request.destination === 'script' ||
     request.destination === 'style'  ||
     request.destination === 'image'  ||
     request.destination === 'font')
  ) {
    e.respondWith(cacheFirst(request));
    return;
  }

  // HTML navigation — network first, fallback to cache
  if (request.mode === 'navigate') {
    e.respondWith(networkFirst(request));
    return;
  }
});

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  const networkPromise = fetch(req).then(res => {
    if (res.ok) cache.put(req, res.clone());
    return res;
  });
  return hit || networkPromise;
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(req);
    return cached || new Response('Offline', { status: 503 });
  }
}
