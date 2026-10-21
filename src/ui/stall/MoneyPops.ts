import Phaser from "phaser";
import { FONT } from "../theme";

// Pool sẵn để giờ cao điểm khỏi GC spike; nằm trong thế giới để trôi theo camera.

const POOL_SIZE = 10;
const RISE_PX = 46;
const LIFE_MS = 1150;
/** Mốc bắt đầu mờ, tính theo tỉ lệ vòng đời. */
const FADE_FROM = 0.45;
/** Chồng dọc chứ không nhích ngang, vì chuỗi chữ rộng sẽ đè nhau. */
const STACK_PX = 24;
const STACK_MAX = 3;

/** Sáng hơn `UI.good` một nấc vì có viền tối bọc ngoài. */
const GAIN = "#5fb98a", LOSS = "#e2695c";

type Pop = {
  text: Phaser.GameObjects.Text;
  /** Theo đồng hồ hiệu ứng; −1 = rảnh. */
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
        // Viền đậm thay hộp nền để đọc được trên cả nền sáng lẫn tối mà không che tay.
        stroke: "#0d1216", strokeThickness: Math.max(3, Math.round(size / 4)),
      }).setOrigin(0.5, 1).setDepth(depth).setVisible(false);
      this.pool.push({ text, born: -1, x: 0, y: 0 });
    }
  }

  /** `ceilY` là mép trên chữ không được bay qua, để khỏi chui sau dải HUD. */
  pop(vnd: number, x: number, y: number, now: number, ceilY = -Infinity) {
    if (!vnd) return;
    // Hết chỗ thì lấy cái già nhất.
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
    // Đỉnh đường bay là `y − stack − RISE_PX`; đẩy cả đường bay xuống nếu đỉnh vượt mép.
    const stacked = y - Math.min(this.live, STACK_MAX) * STACK_PX;
    slot.y = Math.max(stacked, ceilY + RISE_PX);
    this.live++;
    slot.text.setPosition(slot.x, slot.y).setDepth(this.depth);
  }

  /** `now` là đồng hồ cộng dồn chỉ chạy khi không pause, vì bảng trò chuyện đóng băng `clock` chứ không đóng băng Phaser. */
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
      const rise = reducedMotion ? 0 : RISE_PX * (1 - (1 - t) * (1 - t));
      const alpha = t < FADE_FROM ? 1 : 1 - (t - FADE_FROM) / (1 - FADE_FROM);
      p.text.setPosition(p.x, p.y - rise).setAlpha(alpha);
    }
    this.live = live;
  }

  clear() {
    for (const p of this.pool) { p.born = -1; p.text.setVisible(false); }
    this.live = 0;
  }

  destroy() {
    for (const p of this.pool) p.text.destroy();
    this.pool = [];
  }
}
