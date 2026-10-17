/**
 * MÀN MỞ — thanh tiến độ của lúc nạp game, và là CHỖ DUY NHẤT biết cái `#boot` trong
 * `index.html` có hình dạng gì.
 *
 * Trước file này màn mở là một dòng chữ đứng im ("đang dọn hàng…"). Vấn đề không phải nó
 * nhạt: 8 MB ảnh ở `public/art` cộng bus âm báo nghĩa là ở mạng chậm người ta nhìn một
 * dòng chữ bất động mươi giây, và **không có cách nào phân biệt "đang tải" với "treo"**.
 * Một thanh tiến độ trả lời đúng câu hỏi đó, và nó không phải đồ trang trí: số ở đây là
 * `progress` thật của loader Phaser, không phải một animation chạy cho đẹp.
 *
 * BA TRẠNG THÁI, và cái đầu mới là cái dễ quên:
 *
 *  1. **Chưa biết gì** — lớp `boot-wait` mà `index.html` đặt sẵn, `setStep` chưa gọi lần
 *     nào. Khúc này trình duyệt còn đang tải bó mã Phaser, tức mã của mình CHƯA chạy nên
 *     không có con số nào để hiện: thanh chạy kiểu KHÔNG XÁC ĐỊNH (một vạch ngắn trôi
 *     qua lại), chỗ phần trăm để trống.
 *  2. **Đang tải** — `progress` của loader, 0…1, hiện phần trăm.
 *  3. **Xong** — `fadeOut()` mờ đi rồi tắt hẳn con trỏ.
 *
 * ⚠️ `prefers-reduced-motion`: vạch trôi của trạng thái 1 TẮT HẲN, thay bằng một đoạn
 * đứng yên 12%. P5-01 §1 nói "tắt hiệu ứng thì mất trải nghiệm, KHÔNG được mất thông
 * tin" — thông tin ở đây nằm trong dòng chữ bên dưới ("đang khởi động…"), nên bỏ cái vạch
 * trôi không làm mất gì. Đổi nó thành một hiệu ứng nhấp nháy khác là làm sai ý người ta
 * khi họ bật cái công tắc đó.
 *
 * ⚠️ Màu vạch là `#f0c419` của P5-01 §2.1.3 (màu tên NPC), KHÔNG phải `UI.accent`
 * `#c0392b`. Đỏ gạch trên nền `#1d232b` chỉ được 2,8:1 — dưới sàn 3:1 của WCAG cho thành
 * phần KHÔNG phải chữ, tức người cận nặng nhìn thanh đầy cũng không chắc nó đầy tới đâu.
 * Vàng kia được 9,6:1.
 */

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;

/**
 * Đặt tiến độ VÀ dòng chữ nói đang làm gì. Hai thứ luôn đi cùng nhau: một con số nhảy mà
 * không nói nó là con số của việc gì thì lúc nó đứng im ở 88% người ta lại không biết là
 * treo hay là đang chờ phông chữ.
 */
export function setStep(label: string, progress: number) {
  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100);
  const bar = el("boot-bar"), fill = el("boot-fill"), note = el("boot-note"), num = el("boot-pct");
  if (bar) bar.setAttribute("aria-valuenow", String(pct));
  // Bỏ `boot-wait` là rời trạng thái 1 — một chiều, không bao giờ quay lại. Lớp đó nằm
  // trên RÃNH chứ không trên vạch (xem chú thích @keyframes boot-slide ở index.html).
  bar?.classList.remove("boot-wait");
  if (fill) fill.style.width = `${pct}%`;
  if (note) note.textContent = label;
  if (num) num.textContent = `${pct}%`;
}

/**
 * Tiến độ của loader, đã nén vào khúc 2…88%.
 *
 * Vì sao không phải 0…100: nạp ảnh xong KHÔNG phải là xong — còn `buildTextures` (nướng
 * texture, chạy chặn luồng) và còn chờ phông chữ Việt. Để loader chạy tới 100% rồi thanh
 * đứng đó mấy trăm milli-giây là đúng cái cảm giác "treo ở 100%" mà ai cũng từng gặp.
 * Chừa 12% cuối cho hai việc đó, và mốc 2% ở đầu để thanh có một vạch thấy được ngay.
 */
export const setLoading = (p: number) => setStep("đang tải hình ảnh…", 0.02 + p * 0.86);

/**
 * Mờ đi. Lớp `gone` lo phần `opacity` + `pointer-events` ở `index.html`; ở đây chỉ đẩy
 * thanh lên 100% trước đã — mờ đi từ 95% là nói với người chơi rằng có 5% không bao giờ
 * chạy xong.
 */
export function fadeOut() {
  setStep("xong", 1);
  el("boot")?.classList.add("gone");
}

/**
 * Nhường một nhịp vẽ cho trình duyệt.
 *
 * `buildTextures` chặn luồng chính cỡ trăm milli-giây. Gọi `setStep("đang dựng hình…")`
 * rồi chạy nó ngay thì khung hình đó chưa kịp vẽ, nên dòng chữ mới KHÔNG BAO GIỜ hiện ra
 * — người chơi chỉ thấy thanh nhảy một phát sau khi xong. Hai nhịp: một cho tính lại
 * style, một cho vẽ.
 */
export const paintTick = () =>
  new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done())));
