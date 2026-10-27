// Chỗ duy nhất biết hình dạng `#boot` trong `index.html`.

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;

export function setStep(label: string, progress: number) {
  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100);
  const bar = el("boot-bar"), fill = el("boot-fill"), note = el("boot-note"), num = el("boot-pct");
  if (bar) bar.setAttribute("aria-valuenow", String(pct));
  // Rời trạng thái "chưa biết gì" (vạch trôi) — một chiều, không quay lại.
  bar?.classList.remove("boot-wait");
  if (fill) fill.style.width = `${pct}%`;
  el("boot-walker")?.style.setProperty("--p", String(pct / 100));
  if (note) note.textContent = label;
  if (num) num.textContent = `${pct}%`;
}

/** Nén vào 2…88%, chừa phần cuối cho chờ phông chữ. */
export const setLoading = (p: number) => setStep("đang tải hình ảnh…", 0.02 + p * 0.86);

export const LOADING = "đang vào game…";
/** Phần thanh lúc vào quán dành cho chờ hình; phần còn lại là dựng cảnh quán. */
export const ART_SHARE = 0.6;

/** Hiện lại màn mở ngay lập tức ở 0%, không mờ dần và không chạy lùi thanh, để che cú treo của cảnh quán. */
export function showLoading(label: string) {
  const boot = el("boot"), fill = el("boot-fill"), walker = el("boot-walker");
  if (!boot) return;
  const still = [boot, fill, walker];
  for (const e of still) if (e) e.style.transition = "none";
  boot.classList.remove("gone");
  setStep(label, 0);
  void boot.offsetWidth;
  for (const e of still) if (e) e.style.transition = "";
}

export const loadingShown = () => !!el("boot") && !el("boot")!.classList.contains("gone");

export function fadeOut() {
  setStep("xong", 1);
  el("boot")?.classList.add("gone");
}

/** Hai nhịp rAF (style + vẽ) để chữ mới kịp hiện trước khi việc nặng chặn luồng. */
export const paintTick = () =>
  new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done())));
