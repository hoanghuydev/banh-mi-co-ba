// Chỗ duy nhất biết hình dạng `#boot` trong `index.html`.

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;

export function setStep(label: string, progress: number) {
  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100);
  const bar = el("boot-bar"), fill = el("boot-fill"), note = el("boot-note"), num = el("boot-pct");
  if (bar) bar.setAttribute("aria-valuenow", String(pct));
  // Rời trạng thái "chưa biết gì" (vạch trôi) — một chiều, không quay lại.
  bar?.classList.remove("boot-wait");
  if (fill) fill.style.width = `${pct}%`;
  if (note) note.textContent = label;
  if (num) num.textContent = `${pct}%`;
}

/** Nén vào 2…88%, chừa phần cuối cho `buildTextures` và chờ phông chữ. */
export const setLoading = (p: number) => setStep("đang tải hình ảnh…", 0.02 + p * 0.86);

export function fadeOut() {
  setStep("xong", 1);
  el("boot")?.classList.add("gone");
}

/** Hai nhịp rAF (style + vẽ) để chữ mới kịp hiện trước khi `buildTextures` chặn luồng. */
export const paintTick = () =>
  new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done())));
