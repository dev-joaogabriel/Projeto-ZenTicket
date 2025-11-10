const CACHE = 'helpdesk-v1';
const ASSETS = ['/', '/index.html'];

self.addEventListener('install', (e: any) => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e: any) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
});

self.addEventListener('fetch', (e: any) => {
    const req = e.request;
    if (req.method !== 'GET') return;
    e.respondWith(
        caches.match(req).then(cacheRes =>
            cacheRes ||
            fetch(req).then(netRes => {
                const copy = netRes.clone();
                caches.open(CACHE).then(c => c.put(req, copy));
                return netRes;
            }).catch(() => caches.match('/'))
        )
    );
});