import Phaser from "phaser";
import { GAME_H, GAME_W } from "../../core/config";
import { FONT, UI, label, panel, textScale } from "../theme";
import type { TalkTone } from "../../sim/talk";
import { CARD_EDGE, placeTalkCard } from "./talkCardLayout";

/**
 * Dải trò chuyện — một thẻ HẸP neo CẠNH người đang nói, phía vỉa hè trống; tự lật sang bên kia
 * khi chạm mép khung, và không bao giờ phủ lên cột của chính người đó.
 *
 * ⚠️ Bảng đáy màn hình của bản cũ che TRỌN người đang nói chuyện (đo được: mép trên bảng y = 244
 * trong khi đỉnh đầu khách y ≈ 246), và ở cỡ chữ 200% thì hàng thứ tư rơi xuống y ≈ 598 > GAME_H
 * — cái trợ năng tự huỷ chính nó.
 *
 * Ba đường vào, đủ cả ba như CANON §15.5: bấm chuột · phím số 1–3 · ↑↓ rồi Enter.
 *
 * Hai thứ ĐÃ BỎ, cùng lý do (không hiện một thông tin ở hai kênh): huy hiệu mặt trong thẻ (khuôn
 * mặt THẬT đang ở trên người họ) và chữ `MOOD_LABEL` dưới nó.
 *
 * Đồng hồ KHÔNG đóng băng khi thẻ mở (`StallScene` đặt `clock.busy`), nên ngân sách đọc ở đây
 * phải chặt — tối đa ba dòng, mỗi dòng một câu ngắn.
 */

/** Bề ngang thẻ. Hẹp là CỐ Ý: nó phải lọt vào khoảng trống cạnh người, không chiếm hàng ghế đầu. */
const CARD_W = 310;
const PAD = 12;

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
  /** Khách cố ý KHÔNG đáp — thẻ vẫn phải nói ra cái trống đó, xem `show()`. */
  silent?: boolean;
  options: readonly { say: string; tone: TalkTone }[];
  done: boolean;
  /**
   * Chỗ người đang nói, theo TOẠ ĐỘ MÀN HÌNH (đã trừ camera). Thẻ neo cạnh điểm này.
   * Vắng thì rơi về giữa–dưới như cũ — headless và mấy màn không có sân khấu.
   */
  anchor?: { x: number; y: number };
};

export class TalkPanel {
  private root: Phaser.GameObjects.Container | null = null;
  private rows: { bg: Phaser.GameObjects.Graphics; w: number; h: number }[] = [];
  private cursor = 0;
  private count = 0;
  private off: (() => void)[] = [];
  /**
   * Chỗ đã CHỐT cho cuộc đang mở — tâm ngang và MÉP TRÊN, đã kẹp xong.
   *
   * ⚠️ Khoá riêng cái điểm neo là chưa đủ: chiều cao vẫn đổi theo nhịp, nên nhịp dày chạm mép
   * dưới màn hình thì cú kẹp đẩy thẻ LÊN rồi nhịp sau mỏng lại nó RƠI XUỐNG.
   *
   * Nên khoá chỗ ĐÃ GIẢI XONG và cho nó đi MỘT CHIỀU: được trồi lên khi cần thêm chỗ, không bao
   * giờ tụt lại. `show()` giữ nó qua cú `destroy()` bên trong; chỉ `destroy()` từ ngoài mới xoá.
   */
  private locked: { cx: number; top: number } | null = null;

  /**
   * @param onPick  người chơi chọn dòng thứ i
   * @param onClose người chơi đóng thẻ (Esc) — LUÔN MIỄN PHÍ, xem `StallScene.endTalk`
   * @param blocked thẻ đang bị một lớp khác che (menu tạm dừng, sổ tay) ⇒ nuốt hết phím
   */
  constructor(
    private scene: Phaser.Scene,
    private onPick: (i: number) => void,
    private onClose: () => void,
    private blocked: () => boolean = () => false,
  ) {}

  get isOpen() {
    return this.root !== null;
  }

  /** Vẽ lại toàn bộ thẻ cho một nhịp. Gọi lại mỗi lần khách đáp xong. */
  show(v: TalkPanelView) {
    // Giữ chỗ đã chốt qua cú `destroy()` ngay dưới: vẽ lại một nhịp KHÔNG phải mở cuộc mới.
    const lock = this.locked;
    this.destroy();
    this.locked = lock;
    const sz = Math.min(textScale(), 1.35);
    const w = Math.min(CARD_W * Math.min(sz, 1.2), GAME_W - CARD_EDGE * 2);
    const c = this.scene.add.container(0, 0).setDepth(9_400_000).setScrollFactor(0);


    // Mỗi dòng lựa chọn cao theo CHÍNH chữ của nó. Bản cũ dùng một `rowH` cố định rồi
    // kẹp chiều cao cả bảng — đó là chỗ cỡ chữ 200% làm hàng cuối rơi ra ngoài màn hình.
    const rowTexts = v.options.map((o) => this.scene.add.text(0, 0, o.say, {
      fontFamily: FONT, fontSize: `${Math.round(14 * sz)}px`, color: UI.ink,
      lineSpacing: Math.round(5 * sz), wordWrap: { width: w - PAD * 2 - 30 },
    }).setOrigin(0, 0.5));
    const rowH = rowTexts.map((t) => Math.max(Math.round(30 * sz), t.height + Math.round(14 * sz)));

    const nameH = Math.round(16 * sz);
    /*
     * CÂU HỌ VỪA ĐÁP, NẰM NGAY TRÊN BỘ LỰA CHỌN. Bong bóng SỐNG CÓ HẠN (2,8–9 s) rồi tắt, trong
     * khi thẻ đứng chờ tới lúc người chơi bấm — mà đọc ba dòng rồi cân nhắc thường lâu hơn thế,
     * nên tới lúc bấm thì câu mình đang ĐÁP LẠI đã biến mất.
     *
     * Hai kênh không phải một thông tin hiện hai lần: bong bóng mang theo CHỖ và KHOẢNH KHẮC,
     * chữ trong thẻ mang theo NGỮ CẢNH và nó đứng yên.
     *
     * Im lặng cố ý vẫn phải có hình: ô trống đọc ra là UI hỏng, "…" đọc ra là một câu trả lời.
     */
    const quote = v.silent ? "…" : v.line.trim();
    const lineTxt = quote
      ? this.scene.add.text(0, 0, `“${quote}”`, {
        fontFamily: FONT, fontSize: `${Math.round(13 * sz)}px`, color: UI.ink,
        fontStyle: "italic", lineSpacing: Math.round(4 * sz),
        wordWrap: { width: w - PAD * 2 },
      }).setOrigin(0, 0)
      : null;
    const lineH = lineTxt ? lineTxt.height + Math.round(10 * sz) : 0;
    const hintH = Math.round(15 * sz) + 6;
    const h = PAD * 2 + nameH + lineH + rowH.reduce((a, x) => a + x + 5, 0) + hintH;

    const { cx, cy } = this.place(v.anchor, w, h);
    const top = cy - h / 2;

    c.add(panel(this.scene, cx, cy, w, h, UI.paper, 0.97));
    c.add(label(this.scene, cx - w / 2 + PAD, top + PAD + nameH / 2, `nói với ${v.name}`, 12, UI.muted, "700").setOrigin(0, 0.5));

    if (lineTxt) {
      lineTxt.setPosition(cx - w / 2 + PAD, top + PAD + nameH + Math.round(3 * sz));
      c.add(lineTxt);
      // Một gạch mảnh ngăn lời HỌ với lời MÌNH: hai khối chữ liền nhau trong cùng một
      // thẻ thì mắt đọc thành một danh sách bốn dòng, và dòng đầu không bấm được.
      const sep = this.scene.add.graphics();
      sep.fillStyle(UI.line, 1);
      sep.fillRect(cx - w / 2 + PAD, top + PAD + nameH + lineH - Math.round(5 * sz), w - PAD * 2, 1);
      c.add(sep);
    }

    let y = top + PAD + nameH + lineH;
    this.rows = [];
    this.count = v.options.length;
    this.cursor = 0;
    v.options.forEach((o, i) => {
      c.add(this.makeRow(cx, y + rowH[i] / 2, w - PAD * 2, rowH[i], i, rowTexts[i], o.tone, sz));
      y += rowH[i] + 5;
    });

    const hint = v.done ? "Enter — thôi" : "1–3 · ↑↓ + Enter · Esc đóng";
    c.add(label(this.scene, cx, top + h - PAD / 2 - hintH / 2, hint, 10, UI.muted, "400"));

    this.root = c;
    this.paint();
    this.bindKeys(v.done);
  }

  /**
   * Chỗ đặt thẻ. Neo SANG BÊN người nói, bên nào còn chỗ thì về bên đó.
   *
   * ⚠️ NEO BẰNG MÉP TRÊN, KHÔNG BẰNG TÂM: chiều cao thẻ đổi theo TỪNG NHỊP, nên neo bằng tâm thì
   * cú kẹp đẩy thẻ CAO lên khi nó dày ra rồi thả xuống khi nhịp sau mỏng lại. Neo mép trên thì
   * thẻ chỉ DÀI THÊM XUỐNG DƯỚI — mắt đang đọc từ trên xuống, nên mỏ neo phải là chỗ họ đang nhìn.
   */
  private place(a: { x: number; y: number } | undefined, w: number, h: number) {
    const r = placeTalkCard(this.locked, a, { w, h }, { w: GAME_W, h: GAME_H });
    this.locked = { cx: r.cx, top: r.top };
    return { cx: r.cx, cy: r.top + h / 2 };
  }


  private makeRow(x: number, y: number, w: number, h: number, i: number, txt: Phaser.GameObjects.Text, tone: TalkTone, sz: number) {
    const row = this.scene.add.container(x, y);
    const bg = this.scene.add.graphics();
    const num = label(this.scene, -w / 2 + 13, 0, String(i + 1), 12, UI.muted, "700").setOrigin(0.5);
    txt.setPosition(-w / 2 + 26, 0);

    row.add([bg, num, txt]);
    row.setSize(w, h);
    // Container cộng displayOrigin vào toạ độ local trước khi gọi Contains — hit area
    // phải tính từ (0,0), y hệt bẫy đã gặp ở `theme.button`.
    row.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    row.on("pointerover", () => { this.cursor = i; this.paint(); });
    row.on("pointerup", () => this.pick(i));

    this.rows.push({ bg, w, h });
    (bg as any).__tone = tone;
    void sz;
    return row;
  }

  private paint() {
    this.rows.forEach((r, i) => {
      const on = i === this.cursor;
      const tone = (r.bg as any).__tone as TalkTone;
      r.bg.clear();
      r.bg.fillStyle(on ? 0xe9e4d6 : 0xf7f5ee, 1);
      r.bg.fillRoundedRect(-r.w / 2, -r.h / 2, r.w, r.h, 8);
      r.bg.lineStyle(1.5, on ? UI.accent : UI.line, 1);
      r.bg.strokeRoundedRect(-r.w / 2, -r.h / 2, r.w, r.h, 8);
      // mép trái theo giọng — đủ để thấy "cái này gắt" mà không thành một con số
      r.bg.fillStyle(TONE_TINT[tone], on ? 1 : 0.75);
      r.bg.fillRoundedRect(-r.w / 2, -r.h / 2 + 5, 3, r.h - 10, 2);
    });
  }

  /**
   * Phím KHÔNG lớp nào được nuốt — CANON §15.2. `stopPropagation()` trên MỌI `keydown` làm `P`
   * không tới được `StallScene`, tức người chơi KHÔNG VÀO ĐƯỢC menu tạm dừng khi thẻ đang mở, mà
   * §15.2 nói "pause mọi lúc, kể cả giữa lúc khách đang nói". `Tab` và `F1`–`F8` đi cùng đường.
   */
  private static readonly PASS_THROUGH = new Set(["KeyP", "Tab", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8"]);

  private bindKeys(done: boolean) {
    const kb = this.scene.input.keyboard;
    if (!kb) return;
    const onKey = (ev: KeyboardEvent) => {
      if (!this.root) return;
      /*
       * Giữ phím KHÔNG được chạy hết cả cuộc: không lọc `ev.repeat` thì giữ Space hoặc Enter là
       * key-repeat bấm qua cả cây trong một phần mười giây, áp đủ `rel`/`anger`/`act` rồi đánh
       * dấu đã nghe — nội dung đó mất VĨNH VIỄN cả mùa mà người chơi không kịp thấy một chữ nào.
       */
      if (TalkPanel.PASS_THROUGH.has(ev.code)) return;
      /*
       * CHẶN TRƯỚC, LỌC `repeat` SAU — thứ tự này là bắt buộc.
       *
       * ⚠️ `return` ngay khi `ev.repeat` mà chưa `stopPropagation()` thì cú bấm đầu bị nuốt đúng,
       * nhưng mọi sự kiện lặp phía sau lọt xuống plugin bàn phím của Phaser và bật
       * `keys.W/A/S/D.isDown` — giữ W/A/S/D trong lúc đọc thẻ là cô Ba đi mất khỏi quầy.
       */
      ev.stopPropagation();
      if (ev.repeat && ev.code !== "ArrowUp" && ev.code !== "ArrowDown"
        && ev.code !== "KeyW" && ev.code !== "KeyS") return;
      /*
       * CÓ LỚP KHÁC ĐÈ LÊN THÌ THẺ NÀY CÂM. `PASS_THROUGH` cho `P` đi thẳng vào menu tạm dừng,
       * nhưng thẻ vẫn còn đó phía dưới và vẫn còn nghe phím — mà phản xạ của ai cũng là bấm Enter,
       * và Enter rơi xuống đây thành `pick(cursor)` trong lúc màn hình đang mờ.
       */
      if (this.blocked()) return;
      // Listener này ở pha CAPTURE trên window nên nó chạy trước plugin bàn phím của
      // Phaser — `stopPropagation` phía trên là thứ duy nhất giữ cho W/A/S/D không làm
      // người chơi đi mất khỏi quầy trong lúc đọc.
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
      /*
       * Esc = LÙI RA, luôn MIỄN PHÍ (luật L4: một phím chỉ mang một nghĩa, và "lùi ra khỏi lớp
       * trên cùng" không bao giờ được là một nước đi có giá).
       *
       * Bản cũ gộp hai nghĩa vào một phím, và `KeyF` — đúng cái phím vừa MỞ ra thẻ này — cũng gọi
       * `close()` trong khi dòng gợi ý không hề nhắc tới F. "Làm thinh" giờ là một DÒNG trong thẻ,
       * giọng `IM`, hệ quả khai sẵn.
       */
      if (ev.code === "Escape") { ev.preventDefault(); this.close(); }
    };
    // `capture` để Esc không chạm tới menu tạm dừng của StallScene lúc thẻ đang mở.
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
    this.locked = null;
    this.unbind();
    this.root?.destroy(true);
    this.root = null;
    this.rows = [];
    this.count = 0;
  }
}
