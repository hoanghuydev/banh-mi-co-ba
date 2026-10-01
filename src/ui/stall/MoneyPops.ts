import Phaser from "phaser";
import { FONT } from "../theme";

/**
 * Số tiền bay lên trên đầu — P5-03.
 *
 * Trước đây tiền vào ra chỉ hiện ở ô "két" góc HUD: người chơi đang nhìn TAY mình và
 * nhìn MẶT khách (cả trò chơi dạy họ nhìn hai chỗ đó), nên con số ở góc màn hình đổi
 * mà không ai thấy. Đưa bánh xong không biết mình vừa được bao nhiêu, bớt tiền cho
 * khách cũng không thấy mình vừa mất bao nhiêu — mà P5-02 vừa làm cho mấy con số đó
 * thành hệ quả của lời nói, nên chúng phải ĐỌC ĐƯỢC ngay chỗ đang xảy ra.
 *
 * Ba luật:
 *  1. POOL, không cấp phát. Giờ cao điểm là vài chục lần mỗi phút; `add.text()` mỗi lần
 *     là GC spike rơi đúng lúc đông khách nhất (cùng lý do với `BubblePool`).
 *  2. Nằm trong THẾ GIỚI, không phải HUD: nó phải trôi theo đầu nhân vật, và phải bị
 *     camera kéo/zoom y như mọi thứ khác. HUD có ô két riêng rồi.
 *  3. `reducedMotion` (CANON §15.3) → không bay, chỉ hiện rồi tắt tại chỗ.
 */

const POOL_SIZE = 10;
/** Bay lên bao nhiêu pixel trong đời nó. */
const RISE_PX = 46;
const LIFE_MS = 1150;
/** Bắt đầu mờ ở mốc này của vòng đời — nửa đầu còn rõ nét để đọc kịp con số. */
const FADE_FROM = 0.45;
/**
 * Nhiều số cùng lúc thì xếp CHỒNG DỌC, không nhích ngang.
 *
 * Nhích ngang 26 px không đủ tách hai chuỗi chữ rộng cả trăm pixel — đo trên máy thì ba
 * con số đè lên nhau thành một đống không đọc được. Xếp dọc thì chúng cùng bay lên một
 * nhịp nên khoảng cách GIỮ NGUYÊN suốt vòng đời, đọc được từ trên xuống.
 */
const STACK_PX = 24;
/** Quá ngần này thì thôi chồng tiếp — cao quá là ra khỏi khung hình. */
const STACK_MAX = 3;

/**
 * Xanh/đỏ của bảng màu game (`UI.good` #3f7d5a) nhưng sáng hơn một nấc: chữ nằm trên
 * nền quán lúc sáng sớm, và có viền tối bọc ngoài nên sáng hơn mới đọc ra.
 */
const GAIN = "#5fb98a", LOSS = "#e2695c";

type Pop = {
  text: Phaser.GameObjects.Text;
  /** Thời điểm sinh, theo đồng hồ hiệu ứng. −1 = đang rảnh. */
  born: number;
  x: number;
  y: number;
};

export class MoneyPops {
  private pool: Pop[] = [];
  private live = 0;

  constructor(scene: Phaser.Scene, textScale: number, private depth: number) {
    const size = Math.round(14 * Math.min(textScale, 1.6));
    for (let i = 0; i < POOL_SIZE; i++) {
      const text = scene.add.text(0, 0, "", {
        fontFamily: FONT, fontSize: `${size}px`, fontStyle: "700", color: GAIN,
        // Viền đậm thay cho hộp nền: con số phải đọc được trên cả nền sáng (vỉa hè nắng)
        // lẫn nền tối (trong quán), mà không dựng thêm một cái hộp che mất tay người chơi.
        stroke: "#0d1216", strokeThickness: Math.max(3, Math.round(size / 4)),
      }).setOrigin(0.5, 1).setDepth(depth).setVisible(false);
      this.pool.push({ text, born: -1, x: 0, y: 0 });
    }
  }

  /**
   * Bắn một con số tại (x, y) — toạ độ chỗ cần chú ý (đỉnh đầu nhân vật).
   * `vnd` âm là tiền ra. Số 0 không bắn: "+0₫" không nói gì cả.
   *
   * `ceilY` = mép trên mà chữ KHÔNG được bay qua (scene tính từ scroll của camera + dải
   * HUD). Người bán đứng sau quầy, tức là gần mép trên khung hình gần như cả buổi — đo
   * trên máy thì `+25.000₫` bay thẳng vô sau mấy cái nút HUD và mất hút. Chặn ở đây chứ
   * không hạ `RISE_PX`: hạ thì chỗ nào cũng cụt, mà chỉ có đúng dải trên là vướng.
   */
  pop(vnd: number, x: number, y: number, now: number, ceilY = -Infinity) {
    if (!vnd) return;
    // Hết chỗ thì cướp cái GIÀ NHẤT — số mới luôn quan trọng hơn số sắp tắt.
    const slot = this.pool.find((p) => p.born < 0)
      ?? this.pool.reduce((a, b) => (a.born <= b.born ? a : b));
    const sign = vnd > 0 ? "+" : "−";
    slot.text
      .setText(`${sign}${Math.abs(vnd).toLocaleString("vi-VN")}₫`)
      .setColor(vnd > 0 ? GAIN : LOSS)
      .setAlpha(1)
      .setVisible(true);
    slot.born = now;
    slot.x = x;
    // Mỗi cái đang sống đẩy cái mới lên một nấc — tiền vô và tiền ra cùng một nhịp
    // (bán một ổ rồi bớt tiền) phải đọc được là HAI con số, không phải một vệt mực.
    // Đỉnh của đường bay là `y − stack − RISE_PX`; đẩy cả đường bay xuống nếu đỉnh vượt mép.
    const stacked = y - Math.min(this.live, STACK_MAX) * STACK_PX;
    slot.y = Math.max(stacked, ceilY + RISE_PX);
    this.live++;
    slot.text.setPosition(slot.x, slot.y).setDepth(this.depth);
  }

  /**
   * Gọi mỗi frame với ĐỒNG HỒ RIÊNG của hiệu ứng (scene giữ, chỉ chạy khi không pause).
   *
   * Vì sao không tween và không `scene.time.now`: bảng trò chuyện của P5-01 đóng băng
   * `clock` chứ không đóng băng Phaser. Dùng `time.now` thì số bay mất trong lúc người
   * chơi đang đọc bốn dòng lựa chọn; mà chỉ "giữ nguyên giá trị cũ lúc pause" cũng sai
   * nốt — lúc chạy lại `time.now` đã nhảy qua cả quãng pause và con số biến mất tức thì.
   * Một đồng hồ CỘNG DỒN là cách duy nhất đúng ở cả hai đầu.
   */
  update(now: number, reducedMotion: boolean) {
    let live = 0;
    for (const p of this.pool) {
      if (p.born < 0) continue;
      const t = (now - p.born) / LIFE_MS;
      if (t >= 1) {
        p.born = -1;
        p.text.setVisible(false);
        continue;
      }
      live++;
      // easeOut: vọt lên rồi chậm dần — mắt bắt được con số ở nửa sau, lúc nó gần đứng yên
      const rise = reducedMotion ? 0 : RISE_PX * (1 - (1 - t) * (1 - t));
      const alpha = t < FADE_FROM ? 1 : 1 - (t - FADE_FROM) / (1 - FADE_FROM);
      p.text.setPosition(p.x, p.y - rise).setAlpha(alpha);
    }
    this.live = live;
  }

  /** Dọn sạch (đổi ngày, rời cảnh). */
  clear() {
    for (const p of this.pool) { p.born = -1; p.text.setVisible(false); }
    this.live = 0;
  }

  destroy() {
    for (const p of this.pool) p.text.destroy();
    this.pool = [];
  }
}
