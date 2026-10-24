const VERSION = new URL(self.location).searchParams.get("v") || "0";
// Đổi tên khi art/audio/phông đổi nội dung mà giữ nguyên tên file.
const STATIC = "static-v1";
const SHELL = `shell-${VERSION}`;
const STATIC_PATH = /\/(art|audio|fonts|icons)\//;
const SHELL_ASSET = /\/assets\//;

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(SHELL).then((c) => c.addAll(["./", "manifest.webmanifest"])).catch(() => {}).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== STATIC && k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.status === 200) cache.put(req, res.clone()).catch(() => {});
  return res;
}

async function networkFirst(req) {
  const cache = await caches.open(SHELL);
  try {
    const res = await fetch(req);
    if (res.status === 200) cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    throw err;
  }
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (req.mode === "navigate" || url.pathname.endsWith("manifest.webmanifest")) e.respondWith(networkFirst(req));
  else if (SHELL_ASSET.test(url.pathname)) e.respondWith(cacheFirst(req, SHELL));
  else if (STATIC_PATH.test(url.pathname)) e.respondWith(cacheFirst(req, STATIC));
});
