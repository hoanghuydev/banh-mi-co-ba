/** Lượt đầu, file tải trước khi service worker nắm trang không vào cache của nó; gửi lại danh sách để lần sau chơi offline vẫn đủ. */
export function keepForOffline() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.ready.then((reg) =>
    reg.active?.postMessage({ type: "warm", urls: performance.getEntriesByType("resource").map((e) => e.name) }));
}
