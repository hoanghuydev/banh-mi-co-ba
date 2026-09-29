import Phaser from "phaser";
import { GAME_W, GAME_H } from "../core/config";
import type { GameContext } from "../core/context";
import { bus } from "../core/eventbus";
import { PAL as P } from "../art/palette";
import { Stack, UI, button, label } from "../ui/theme";
import { music } from "../audio/music";

const WEATHER_LABEL = { NANG: "trời nắng", MUA: "trời mưa", AM_U: "trời âm u" } as const;

/**
 * Đi chợ sáng — P0-01 §2.3. Chạy theo LƯỢT: đồng hồ KHÔNG trôi ở đây (P0-02 §2.1).
 * Áp lực thời gian là đặc sản của giờ cao điểm; đi chợ là lúc suy nghĩ.
 *
 * P0 mới dựng khung để vòng ngày chạy đủ. Giá chợ có pattern, bốn lò bánh mì là NPC,
 * tồn kho + hạn dùng là việc của P3 (P3-02, P3-03).
 */
export class MarketScene extends Phaser.Scene {
  private ctx!: GameContext;
  /** Bấm nút và gõ Enter cùng lúc không được phát event hai lần (= nhảy cóc một ngày). */
  private finished = false;

  constructor() { super("market"); }

  init(data: { ctx: GameContext }) {
    this.ctx = data.ctx;
    this.finished = false;
  }

  create() {
    const w = this.ctx.world;
    this.cameras.main.setBackgroundColor(P.skyLow);
    music.play(this, "menu", 800);

    const cx = GAME_W / 2;
    this.add.rectangle(cx, GAME_H / 2, GAME_W, GAME_H, 0x1b2126, 0.35);
    const bg = this.add.graphics();
    const st = new Stack(0, 14);
    const wrap = 460;
    const items = [
      st.place(label(this, cx, 0, `Ngày ${w.progress.dayIndex} — sáng sớm`, 24, UI.ink, "700").setWordWrapWidth(wrap), 8),
      st.place(label(this, cx, 0,
        `${WEATHER_LABEL[w.progress.weather]}  ·  ${w.money.cash.toLocaleString("vi-VN")}₫ trong ống`, 14, UI.muted, "400").setWordWrapWidth(wrap), 22),
      st.place(label(this, cx, 0,
        "Cô Ba đã đi chợ từ bốn giờ sáng: bánh mì, pate, chả lụa, rau, đồ chua đủ cho một buổi.",
        15, UI.ink, "400").setWordWrapWidth(wrap).setAlign("center")),
      st.place(label(this, cx, 0,
        "(chợ thật — giá lên xuống, lò bánh quen, hàng tồn — mở ở giai đoạn sau)", 12, "#8b959e", "400")
        .setWordWrapWidth(wrap).setAlign("center"), 22),
      st.button(button(this, cx, 0, "Dọn hàng ra bán", () => this.done(), { primary: true, width: 280, hint: "6h00 mở cửa" }), 0),
    ];
    // canh giữa cả khối theo chiều dọc, nền cao đúng bằng nội dung
    const total = st.y, top = Math.max(16, (GAME_H - total) / 2);
    for (const o of items) o.setY(o.y + top);
    bg.fillStyle(UI.paper, 0.97).fillRoundedRect(cx - 270, top - 26, 540, total + 52, 16);
    this.input.keyboard?.once("keydown-ENTER", () => this.done());
  }

  private done() {
    if (this.finished) return;
    this.finished = true;
    bus.emit("market:done", { spent: 0, bought: [] });
  }
}
