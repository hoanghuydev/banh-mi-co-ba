const VERSION = new URL(self.location).searchParams.get("v") || "0";
// Lúc build `vite.config.ts` thay hai dòng này: băm nội dung art/audio/phông và danh sách file menu cần.
const STATIC_HASH = "dev";
const PRECACHE = { shell: [], static: [] };
const STATIC = `static-${STATIC_HASH}`;
const SHELL = `shell-${VERSION}`;
const STATIC_PATH = /\/(art|audio|fonts|icons)\//;
const SHELL_ASSET = /\/assets\//;

const addAll = (cache, urls) => Promise.all(urls.map((u) => cache.add(u).catch(() => {})));

self.addEventListener("install", (e) => {
  e.waitUntil(Promise.all([
    caches.open(SHELL).then((c) => addAll(c, ["./", "manifest.webmanifest", ...PRECACHE.shell])),
    caches.open(STATIC).then((c) => addAll(c, PRECACHE.static)),
  ]).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== STATIC && k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** Trang gửi danh sách file đã tải trước khi service worker kịp nắm trang, để lần sau chơi offline vẫn đủ. */
self.addEventListener("message", (e) => {
  if (e.data?.type !== "warm" || !Array.isArray(e.data.urls)) return;
  const urls = e.data.urls.filter((u) => STATIC_PATH.test(new URL(u, self.location).pathname));
  e.waitUntil(caches.open(STATIC).then(async (c) => {
    for (const u of urls) if (!(await c.match(u, { ignoreVary: true }))) await c.add(u).catch(() => {});
  }));
});

async function cacheFirst(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req, { ignoreVary: true });
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
    const hit = await cache.match(req, { ignoreSearch: true, ignoreVary: true });
    if (hit) return hit;
    throw err;
  }
}

const filling = new Set();

/** Nhạc phát qua <audio> xin từng khúc (Range): có bản đủ trong cache thì cắt đúng khúc trả 206; chưa có thì đi mạng và tải bản đủ về sau. */
async function ranged(e) {
  const req = e.request;
  const cache = await caches.open(STATIC);
  const hit = await cache.match(req.url, { ignoreVary: true });
  if (!hit) {
    if (!filling.has(req.url)) {
      filling.add(req.url);
      e.waitUntil(fetch(req.url).then((res) => (res.status === 200 ? cache.put(req.url, res) : null)).catch(() => {}).finally(() => filling.delete(req.url)));
    }
    return fetch(req);
  }
  const blob = await hit.blob();
  const size = blob.size;
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range").trim());
  let start = 0, end = size - 1;
  if (m && m[1] !== "") {
    start = Number(m[1]);
    if (m[2] !== "") end = Math.min(Number(m[2]), size - 1);
  } else if (m && m[2] !== "") {
    start = Math.max(0, size - Number(m[2]));
  }
  if (!m || start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  return new Response(blob.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": hit.headers.get("Content-Type") || "audio/mpeg",
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
    },
  });
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (req.headers.has("range")) {
    if (STATIC_PATH.test(url.pathname)) e.respondWith(ranged(e));
    return;
  }
  if (req.mode === "navigate" || url.pathname.endsWith("manifest.webmanifest")) e.respondWith(networkFirst(req));
  else if (SHELL_ASSET.test(url.pathname)) e.respondWith(cacheFirst(req, SHELL));
  else if (STATIC_PATH.test(url.pathname)) e.respondWith(cacheFirst(req, STATIC));
});
