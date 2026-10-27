/** Lượt đầu, file tải trước khi service worker nắm trang không vào cache của nó; gửi lại danh sách để lần sau chơi offline vẫn đủ. */
export function keepForOffline(more: readonly string[] = []) {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  const urls = [...performance.getEntriesByType("resource").map((e) => e.name), ...more.map((u) => new URL(u, location.href).href)];
  void navigator.serviceWorker.ready.then((reg) => reg.active?.postMessage({ type: "warm", urls }));
}
