/*
 * NOVA — service worker teardown.
 *
 * The app previously shipped a Workbox service worker (via vite-plugin-pwa)
 * that precached index.html + hashed assets. A known failure mode of that
 * setup on GitHub Pages: a visitor's browser keeps the OLD service worker
 * after a redeploy, and the old worker serves the OLD precached index.html,
 * which references OLD hashed asset files that no longer exist on the
 * server — producing a blank page.
 *
 * This worker is intentionally a no-op: it unregisters itself and wipes all
 * caches so returning visitors get a fresh, network-served page. The app no
 * longer registers any service worker, so nothing will install a new one.
 */
self.addEventListener('install', () => {
  // Do not claim clients; let this worker die immediately.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Delete every cache this origin has.
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));

      // Unregister this worker (and any legacy registration).
      if (self.registration) {
        await self.registration.unregister();
      }

      // Take control of open pages so they reload without the worker
      // and never see the stale precached document again.
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      await Promise.all(clients.map((client) => client.navigate(client.url)));
    })()
  );
});

// Never intercept network requests.
self.addEventListener('fetch', () => {});
