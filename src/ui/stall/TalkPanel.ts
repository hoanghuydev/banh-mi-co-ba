import Phaser from "phaser";
import { GAME_H, GAME_W } from "../../core/config";
import { FONT, UI, buttonHeight, label, panel, textScale } from "../theme";
import { MOOD_FACE, MOOD_LABEL, type TalkMood, type TalkTone } from "../../sim/talk";
import { FACE_R, drawFace } from "../../entities/face";

/**
 * Bảng trò chuyện — P5-01. Cái mà bấm F ra.
 *
 * Nằm DƯỚI CÙNG màn hình, cao vừa đủ: khách đứng ở giữa–phải và người chơi phải còn
 * thấy MẶT họ trong lúc chọn câu. Cả game là chuyện bị nhìn; che mặt người đang nói
 * chuyện với mình thì mất luôn thứ duy nhất đáng xem.
 *
 * Ba đường vào, đủ cả ba như CANON §15.5 bắt với bảng kẹp nhân:
 *   1. bấm chuột vào dòng
 *   2. phím số 1–4
 *   3. ↑ ↓ chọn, Enter xác nhận
 * cộng Esc = làm thinh (KHÔNG phải nút huỷ — xem `talk.ignore`).
 *
 * Bảng này KHÔNG tự đóng băng thế giới: StallScene đặt `clock.paused` trước khi mở.
 * Nhưng nó là lý do cái đóng băng đó tồn tại — đọc bốn dòng tiếng Việt mất 6–10 giây,
 * mà sức chờ ngắn nhất hẻm (anh Dũng) có 28 giây.
 */

const PANEL_W = 620;
const PAD = 16;
/** Chiều cao tối đa của bảng theo % khung hình — còn lại phải thấy được khách. */
const MAX_H_RATIO = 0.56;

/** Màu mép trái của mỗi dòng theo giọng. Chỉ là GỢI Ý khí, không phải điểm số (T3). */
const TONE_TINT: Record<TalkTone, number> = {
  AM: 0x3f7d5a,
  THUONG: 0xa9a393,
  DUA: 0xd4a13c,
  THANG: 0x4a6f8c,
  LANH: 0x7d8a93,
  GAT: 0xc0392b,
  CHUI: 0x9b4a2f,
  IM: 0x6a7680,
};

export type TalkPanelView = {
  name: string;
  line: string;
  /**
   * Khách nói câu đó bằng mặt mũi nào (P5-06). Vẽ thành huy hiệu mặt bên trái câu nói —
   * CÙNG bộ mặt ba lớp đang chạy trên người họ, không phải một bộ icon thứ hai.
   */
  mood?: TalkMood;
  skin?: number;
  hair?: number;
  options: readonly { say: string; tone: TalkTone }[];
  done: boolean;
};

/** Mày tóc bạc vẽ lên nền da thì chìm — sậm lại, y như `CustomerActor`. */
const browColor = (hair: number) => {
  const r = (hair >> 16) & 255, g = (hair >> 8) & 255, b = hair & 255;
  return 0.3 * r + 0.59 * g + 0.11 * b > 140 ? 0x5a5550 : hair;
};

export class TalkPanel {
  private root: Phaser.GameObjects.Container | null = null;
  private rows: { bg: Phaser.GameObjects.Graphics; w: number; h: number }[] = [];
  private cursor = 0;
  private count = 0;
  private off: (() => void)[] = [];

  /**
   * @param onPick  người chơi chọn dòng thứ i
   * @param onClose người chơi đóng bảng mà chưa nói hết (Esc) — LÀM THINH, có giá
   */
  constructor(
    private scene: Phaser.Scene,
    private onPick: (i: number) => void,
    private onClose: () => void,
  ) {}

  get isOpen() {
    return this.root !== null;
  }

  /** Vẽ lại toàn bộ bảng cho một nhịp. Gọi lại mỗi lần khách đáp xong. */
  show(v: TalkPanelView) {
    this.destroy();
    const sz = Math.min(textScale(), 1.35);
    const w = Math.min(PANEL_W * Math.min(sz, 1.15), GAME_W - 24);
    const rowH = Math.round(buttonHeight(1.35) * 0.92);

    const c = this.scene.add.container(0, 0).setDepth(9_400_000).setScrollFactor(0);

    // Câu khách vừa nói. Đo TRƯỚC khi đặt chỗ: tiếng Việt chồng dấu, 2 dòng hay 3 dòng
    // là chênh nhau cả một hàng nút (CANON §15.1 — hộp giãn theo chữ, không đặt số cứng).
    // Huy hiệu mặt chiếm một cột bên trái câu nói — câu phải hẹp lại đúng ngần đó, nếu
    // không thì dòng cuối chui xuống dưới cái mặt và trông như vỡ chữ.
    const faceCol = v.mood ? Math.round((FACE_R * 2 + 12) * sz) : 0;
    const said = this.scene.add.text(0, 0, v.line, {
      fontFamily: FONT, fontSize: `${Math.round(16 * sz)}px`, fontStyle: "500",
      color: UI.ink, lineSpacing: Math.round(8 * sz), wordWrap: { width: w - PAD * 2 - faceCol },
    }).setOrigin(0, 0);

    const nameH = Math.round(20 * sz);
    const lineH = v.line ? Math.max(said.height, v.mood ? (FACE_R * 2 + 16) * sz : 0) + 10 : 0;
    const listH = v.options.length * (rowH + 6);
    const hintH = Math.round(18 * sz) + 6;
    const h = Math.min(GAME_H * MAX_H_RATIO, PAD * 2 + nameH + lineH + listH + hintH);
    const cy = GAME_H - h / 2 - 10;
    const top = cy - h / 2;

    c.add(panel(this.scene, GAME_W / 2, cy, w, h, UI.paper, 0.97));
    c.add(label(this.scene, GAME_W / 2 - w / 2 + PAD, top + PAD + nameH / 2, v.name, 13, UI.muted, "700").setOrigin(0, 0.5));

    if (v.line) {
      said.setPosition(GAME_W / 2 - w / 2 + PAD + faceCol, top + PAD + nameH + 2);
      c.add(said);
      if (v.mood) {
        const g = this.scene.add.graphics();
        const fx = GAME_W / 2 - w / 2 + PAD + Math.round(FACE_R * sz);
        const fy = said.y + Math.round(FACE_R * sz) + 2;
        g.setScale(sz);
        // `drawFace` vẽ quanh gốc toạ độ của graphics, nên đặt gốc rồi vẽ ở (0,0):
        // scale ăn vào nét vẽ chứ không đẩy cái mặt lệch khỏi cột bên trái.
        g.setPosition(fx, fy);
        drawFace(g, 0, 0, MOOD_FACE[v.mood], v.skin ?? 0xe3b189, browColor(v.hair ?? 0x2b2420));
        c.add(g);
        // Phụ đề một chữ: huy hiệu 22 px đọc được "cười" hay "giận", nhưng "ngượng" với
        // "rưng rưng" thì không. Chữ là lưới an toàn, không phải phần trang trí.
        c.add(label(this.scene, fx, fy + Math.round((FACE_R + 9) * sz), MOOD_LABEL[v.mood], 10, UI.muted, "500").setOrigin(0.5));
      }
    } else said.destroy();

    let y = top + PAD + nameH + lineH;
    this.rows = [];
    this.count = v.options.length;
    this.cursor = 0;
    v.options.forEach((o, i) => {
      const ry = y + rowH / 2;
      c.add(this.makeRow(GAME_W / 2, ry, w - PAD * 2, rowH, i, o.say, o.tone, sz));
      y += rowH + 6;
    });

    const hint = v.done ? "Enter — thôi nói chuyện" : "1–4 hoặc ↑↓ + Enter · Esc làm thinh";
    c.add(label(this.scene, GAME_W / 2, top + h - PAD / 2 - hintH / 2, hint, 11, UI.muted, "400"));

    this.root = c;
    this.paint();
    this.bindKeys(v.done);
  }

  private makeRow(x: number, y: number, w: number, h: number, i: number, text: string, tone: TalkTone, sz: number) {
    const row = this.scene.add.container(x, y);
    const bg = this.scene.add.graphics();
    const num = label(this.scene, -w / 2 + 16, 0, String(i + 1), 13, UI.muted, "700").setOrigin(0.5);
    // Chữ cắt theo bề ngang CÒN LẠI, không theo bề ngang bảng: số thứ tự và mép màu
    // đã ăn mất ~34 px, không trừ thì dòng dài tràn ra ngoài nền ở cỡ chữ lớn.
    const txt = this.scene.add.text(-w / 2 + 34, 0, text, {
      fontFamily: FONT, fontSize: `${Math.round(15 * sz)}px`, color: UI.ink,
      wordWrap: { width: w - 50 },
    }).setOrigin(0, 0.5);

    row.add([bg, num, txt]);
    row.setSize(w, h);
    // Container cộng displayOrigin vào toạ độ local trước khi gọi Contains — hit area
    // phải tính từ (0,0), y hệt bẫy đã gặp ở `theme.button`.
    row.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    row.on("pointerover", () => { this.cursor = i; this.paint(); });
    row.on("pointerup", () => this.pick(i));

    this.rows.push({ bg, w, h });
    (bg as any).__tone = tone;
    return row;
  }

  private paint() {
    this.rows.forEach((r, i) => {
      const on = i === this.cursor;
      const tone = (r.bg as any).__tone as TalkTone;
      r.bg.clear();
      r.bg.fillStyle(on ? 0xe9e4d6 : 0xf7f5ee, 1);
      r.bg.fillRoundedRect(-r.w / 2, -r.h / 2, r.w, r.h, 10);
      r.bg.lineStyle(1.5, on ? UI.accent : UI.line, 1);
      r.bg.strokeRoundedRect(-r.w / 2, -r.h / 2, r.w, r.h, 10);
      // mép trái theo giọng — đủ để thấy "cái này gắt" mà không thành một con số
      r.bg.fillStyle(TONE_TINT[tone], on ? 1 : 0.75);
      r.bg.fillRoundedRect(-r.w / 2, -r.h / 2 + 6, 4, r.h - 12, 2);
    });
  }

  private bindKeys(done: boolean) {
    const kb = this.scene.input.keyboard;
    if (!kb) return;
    const onKey = (ev: KeyboardEvent) => {
      if (!this.root) return;
      // Bảng mở = CHẶN HẾT. Listener này ở pha CAPTURE trên window nên nó chạy trước
      // plugin bàn phím của Phaser (pha bubble); `stopPropagation` ở đây là thứ duy nhất
      // giữ cho W/A/S/D không làm người chơi đi mất khỏi quầy trong lúc đọc, và cho Esc
      // không mở menu tạm dừng chồng lên bảng. `preventDefault` một mình KHÔNG đủ: nó
      // chỉ bỏ hành vi mặc định của trình duyệt, không chặn listener khác.
      ev.stopPropagation();
      const num = /^(?:Digit|Numpad)([1-9])$/.exec(ev.code);
      if (num && !done) {
        const i = Number(num[1]) - 1;
        if (i < this.count) { ev.preventDefault(); this.pick(i); }
        return;
      }
      if (ev.code === "ArrowUp" || ev.code === "KeyW") {
        ev.preventDefault();
        this.cursor = (this.cursor - 1 + this.count) % Math.max(1, this.count);
        this.paint();
        return;
      }
      if (ev.code === "ArrowDown" || ev.code === "KeyS") {
        ev.preventDefault();
        this.cursor = (this.cursor + 1) % Math.max(1, this.count);
        this.paint();
        return;
      }
      if (ev.code === "Enter" || ev.code === "Space") {
        ev.preventDefault();
        if (done || !this.count) this.close();
        else this.pick(this.cursor);
        return;
      }
      // Esc KHÔNG phải nút huỷ: nó là "không trả lời", và Service tính tiền cho nó.
      if (ev.code === "Escape" || ev.code === "KeyF") { ev.preventDefault(); this.close(); }
    };
    // `capture` để Esc không chạm vào menu tạm dừng của StallScene lúc bảng đang mở.
    window.addEventListener("keydown", onKey, true);
    this.off.push(() => window.removeEventListener("keydown", onKey, true));
  }

  private pick(i: number) {
    const fn = this.onPick;
    this.unbind();
    fn(i);
  }

  private close() {
    const fn = this.onClose;
    this.destroy();
    fn();
  }

  private unbind() {
    for (const f of this.off) f();
    this.off = [];
  }

  destroy() {
    this.unbind();
    this.root?.destroy(true);
    this.root = null;
    this.rows = [];
    this.count = 0;
  }
}
