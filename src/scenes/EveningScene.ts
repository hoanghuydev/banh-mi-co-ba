import Phaser from "phaser";
import { GAME_W, GAME_H } from "../core/config";
import type { GameContext } from "../core/context";
import { bus } from "../core/eventbus";
import { SEASON_DAYS } from "../core/save";
import { Stack, UI, button, label } from "../ui/theme";
import { music } from "../audio/music";

/**
 * Buổi tối — P0-01 §2.3. Đếm tiền, ghi sổ, một cảnh yên tĩnh. Chạy theo LƯỢT.
 *
 * Trước khi phát `evening:done`, đúng thứ tự: tick đồn thổi (P2-04), promote trí nhớ
 * (P2-03), ghi autosave. P0 mới có phần sổ sách; hai hệ kia cắm vào `settle()`.
 * Stream `gossip` chỉ được tiêu số ở ĐÚNG thời điểm này (P0-02 §2.3) — một hệ chỉ
 * rút RNG ở một mốc cố định thì số lần rút không phụ thuộc cách người chơi chơi.
 */
export class EveningScene extends Phaser.Scene {
  private ctx!: GameContext;
  /** Bấm nút và gõ Enter cùng lúc không được phát event hai lần (= nhảy cóc một ngày). */
  private finished = false;

  constructor() { super("evening"); }

  init(data: { ctx: GameContext }) {
    this.ctx = data.ctx;
    this.finished = false;
  }

  create() {
    const w = this.ctx.world;
    const t = w.progress.today;
    const day = w.progress.dayIndex;
    music.play(this, "toi", 2200);                     // cảnh tối, đếm tiền — P5-03 §6.3 `mus_toi`

    // Sổ cái: một dòng mỗi ngày. Vào lại cảnh tối sau reload không được ghi hai lần.
    const row = { day, revenue: t.revenue, cost: 0, served: t.served, lost: t.lost };
    const i = w.ledger.findIndex((r) => r.day === day);
    if (i >= 0) w.ledger[i] = row; else w.ledger.push(row);

    const cx = GAME_W / 2;
    this.cameras.main.setBackgroundColor(0x1d232b);
    const bg = this.add.graphics();
    const st = new Stack(0, 14);
    const lines = [
      `đã đưa ${t.served} phần`,
      `thu ${t.revenue.toLocaleString("vi-VN")}₫  ·  ${w.money.cash.toLocaleString("vi-VN")}₫ trong ống`,
    ];
    if (t.lost) lines.push(`${t.lost} người bỏ đi vì chờ lâu`);
    const last = day >= SEASON_DAYS;
    const items = [
      st.place(label(this, cx, 0, `Tối ngày ${day}`, 24, UI.ink, "700"), 18),
      st.place(label(this, cx, 0, lines.join("\n"), 15, UI.ink, "400").setWordWrapWidth(440).setAlign("center"), 18),
      st.place(label(this, cx, 0, last
        ? "Hết mùa. (Cú quay lại ngày 40 là phần P4.)"
        : "Sổ tay của cô Ba nằm trên bàn — ghi chép mở ở giai đoạn sau.", 12, "#8b959e", "400")
        .setWordWrapWidth(440).setAlign("center"), 22),
      st.button(button(this, cx, 0, last ? "Về sảnh" : "Đi ngủ", () => this.settle(), { primary: true, width: 240 }), 0),
    ];
    const total = st.y, top = Math.max(16, (GAME_H - total) / 2);
    for (const o of items) o.setY(o.y + top);
    bg.fillStyle(UI.paper, 0.97).fillRoundedRect(cx - 250, top - 26, 500, total + 52, 16);
    this.input.keyboard?.once("keydown-ENTER", () => this.settle());
  }

  private settle() {
    if (this.finished) return;
    this.finished = true;
    // P2-04: gossip tick · P2-03: memory promote — cắm vào đây, trước khi phát event.
    bus.emit("evening:done", { dayIndex: this.ctx.world.progress.dayIndex });
  }
}
