import Phaser from "phaser";
import { GAME_W, GAME_H } from "../core/config";
import type { Clock } from "../core/clock";
import type { Settings } from "../core/save";
import { blockedReason, type Hand, type Station } from "../world/stations";
import { FONT, UI, panel } from "./theme";

const DEPTH = 9_000_000;

/**
 * Lớp thông tin trên màn hình. Tách khỏi scene vì HUD là thứ sẽ đổi nhiều nhất
 * và không nên bắt ai phải đọc code gameplay mới sửa được một dòng chữ.
 *
 * CANON §15: cỡ chữ theo cài đặt, nền hộp ĐỤC, không viết hoa toàn bộ.
 */
export class Hud {
  private left: Phaser.GameObjects.Text;
  private right: Phaser.GameObjects.Text;
  private prompt: Phaser.GameObjects.Text;
  private promptBg: Phaser.GameObjects.Graphics;
  private bar: Phaser.GameObjects.Graphics;
  private feedText: Phaser.GameObjects.Text;
  private feed: string[] = [];
  private ticketBg: Phaser.GameObjects.Graphics;
  private ticketText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, private settings: Settings) {
    const fs = (n: number) => `${Math.round(n * settings.textScale)}px`;
    const fixed = <T extends Phaser.GameObjects.GameObject>(o: T, d = DEPTH) =>
      (o as any).setScrollFactor(0).setDepth(d) as T;

    fixed(panel(scene, 118, 40, 210, 58, UI.paper, 0.93));
    fixed(panel(scene, GAME_W - 118, 40, 210, 58, UI.paper, 0.93));

    const stat = (x: number, origin: number) => fixed(scene.add.text(x, 21, "", {
      fontFamily: FONT, fontSize: fs(14), fontStyle: "500", color: UI.ink, lineSpacing: 4,
    }).setOrigin(origin, 0), DEPTH + 100);

    this.left = stat(24, 0);
    this.right = stat(GAME_W - 24, 1);

    this.promptBg = fixed(scene.add.graphics());
    this.prompt = fixed(scene.add.text(GAME_W / 2, GAME_H - 66, "", {
      fontFamily: FONT, fontSize: fs(15), fontStyle: "500", color: UI.ink, align: "center",
    }).setOrigin(0.5), DEPTH + 100);

    this.bar = fixed(scene.add.graphics(), DEPTH + 50);

    // Phiếu đơn của người đang đứng trước mặt. Đây là thứ DUY NHẤT được phép hiện
    // thành chữ về khách — CANON T3 cấm mọi chỉ số quan hệ.
    this.ticketBg = fixed(scene.add.graphics());
    this.ticketText = fixed(scene.add.text(GAME_W - 26, 92, "", {
      fontFamily: FONT, fontSize: fs(13), fontStyle: "500", color: UI.ink,
      align: "right", lineSpacing: 4,
    }).setOrigin(1, 0), DEPTH + 100);

    this.feedText = fixed(scene.add.text(24, GAME_H - 96, "", {
      fontFamily: FONT, fontSize: "12px", color: "#eef4f7", lineSpacing: 3,
    }).setOrigin(0, 1).setAlpha(0.88), DEPTH + 100);

    fixed(scene.add.text(GAME_W / 2, GAME_H - 22,
      "WASD / mũi tên  đi   ·   E  làm việc   ·   kéo–thả hoặc 1–9,0  kẹp nhân   ·   Q  bỏ đồ   ·   Esc  tạm dừng", {
      fontFamily: FONT, fontSize: "12px", color: "#e3ecf0",
    }).setOrigin(0.5).setAlpha(0.82), DEPTH + 100);
  }

  /** Dòng nhật ký ngắn ở góc — cũng là chỗ tầng perception (P1) sẽ đổ bark vào. */
  log(line: string) {
    this.feed.push(line);
    if (this.feed.length > 3) this.feed.shift();
    this.feedText.setText(this.feed.join("\n"));
  }

  clearLog() {
    this.feed = [];
    this.feedText.setText("");
  }

  update(s: {
    day: number; seasonDays: number; clock: Clock; money: number; served: number;
    near: Station | null; hand: Hand; busy: { st: Station; ms: number } | null;
    frozen: boolean;
    ticket: { name: string; text: string; urgent: boolean } | null;
  }) {
    const peak = s.clock.isPeak ? "  ·  cao điểm" : "";
    const stopped = this.settings.noTimePressure ? "  ·  giờ đứng" : "";
    this.left.setText(`ngày ${s.day} / ${s.seasonDays}\n${s.clock.format()}${peak}${stopped}`);
    this.right.setText(`${s.money.toLocaleString("vi-VN")}₫\nđã đưa ${s.served} phần`);

    this.drawPrompt(s.near, s.hand, s.frozen);
    this.drawBar(s.busy);
    this.drawTicket(s.ticket, s.frozen);
  }

  private drawTicket(t: { name: string; text: string; urgent: boolean } | null, frozen: boolean) {
    this.ticketBg.clear();
    if (!t || frozen) { this.ticketText.setText(""); return; }

    this.ticketText.setText(`${t.name}\n${t.text}`);
    const w = this.ticketText.width + 28, h = this.ticketText.height + 18;
    const x = GAME_W - 12 - w, y = 84;
    this.ticketBg.fillStyle(0x0d1216, 0.2);
    this.ticketBg.fillRoundedRect(x + 2, y + 3, w, h, 10);
    this.ticketBg.fillStyle(t.urgent ? 0xf3ddd4 : UI.paper, 0.95);
    this.ticketBg.fillRoundedRect(x, y, w, h, 10);
    this.ticketText.setPosition(GAME_W - 26, y + 9);
  }

  private drawPrompt(st: Station | null, hand: Hand, frozen: boolean) {
    this.promptBg.clear();
    if (!st || frozen) { this.prompt.setText(""); return; }

    const why = blockedReason(st, hand);
    const keyHint = st.holdMs === 0 ? "bấm E" : "giữ E";
    this.prompt.setText(why
      ? `${st.name} — ${why}`
      : st.overcookMs
        ? `${st.name} — ${keyHint} để ${st.verb}, thả khi vừa vàng`
        : `${st.name} — ${keyHint} để ${st.verb}`);

    const w = this.prompt.width + 34, h = this.prompt.height + 16;
    const x = GAME_W / 2 - w / 2, y = GAME_H - 66 - h / 2;
    this.promptBg.fillStyle(0x0d1216, 0.22);
    this.promptBg.fillRoundedRect(x, y + 3, w, h, 10);
    this.promptBg.fillStyle(why ? 0xe7e0d2 : UI.paper, 0.96);
    this.promptBg.fillRoundedRect(x, y, w, h, 10);
  }

  /** Thanh tiến trình: vùng xanh = được, dải nâu = quá tay. Vạch trắng = mốc vừa chín. */
  private drawBar(busy: { st: Station; ms: number } | null) {
    this.bar.clear();
    if (!busy) return;

    const { st, ms } = busy;
    const total = st.overcookMs ?? st.holdMs;
    const W = 200, H = 10, x = GAME_W / 2 - W / 2, y = GAME_H - 106;
    const readyAt = st.holdMs / total;

    this.bar.fillStyle(0x1b2429, 0.55);
    this.bar.fillRoundedRect(x - 2, y - 2, W + 4, H + 4, 6);
    if (st.overcookMs) {                                // dải cháy hiện SẴN, trước khi chạm vào
      this.bar.fillStyle(0x7d3b2c, 0.85);
      this.bar.fillRect(x + W * readyAt, y, W * (1 - readyAt), H);
    }
    this.bar.fillStyle(ms >= st.holdMs ? 0x6fbf8a : 0xe8c27a, 1);
    this.bar.fillRoundedRect(x, y, Math.max(4, W * Math.min(1, ms / total)), H, 5);
    this.bar.lineStyle(2, 0xffffff, 0.9);
    this.bar.lineBetween(x + W * readyAt, y - 3, x + W * readyAt, y + H + 3);
  }
}
