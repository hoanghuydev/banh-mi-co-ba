import type Phaser from "phaser";
import { MENU_BOARD, MENU_DRINKS, MENU_TIPS, type MenuItem } from "../../sim/menu";
import { ECON, loafPriceVnd, vnd } from "../../sim/econ";
import { INGREDIENTS, levelsOf } from "../../sim/order";
import { shopName } from "../../content/intro";

/**
 * BẢNG MENU — cái người chơi ĐỌC, không phải cái người chơi bấm.
 *
 * Game này không có màn hình nào dạy công thức: khách nói "cho ổ xíu mại" và người chơi
 * phải biết ổ đó có gì. Trước đây chỗ duy nhất biết điều ấy là `diffDish`, tức người chơi
 * chỉ học được bằng cách LÀM SAI rồi bị trừ. Tấm bảng này là chỗ học trước khi sai — đúng
 * như ngoài đời: ai mới vô làm cũng đứng ngó cái bảng một lúc.
 *
 * Lớp DOM phủ lên canvas (giống `ui/notebook`): chữ Việt nhiều dấu, nhiều cỡ chữ, và phải
 * cuộn được ở 200% — mấy thứ đó trình duyệt làm sẵn, vẽ trong Phaser thì phải làm tay.
 *
 * Hình thức là một luận điểm, không phải trang trí: P4-01 §prop_a chốt rằng xe chú Kiệt có
 * "bảng menu IN DECAL" và *"đây là toàn bộ chủ đề của game gói trong hai cái bảng"*. Nên
 * bảng này sơn tay, chữ không đều, treo lệch, và tờ giấy dán bên cạnh thì quăn mép.
 *
 * MỘT NGUỒN: mọi dòng dưới đây đọc từ `sim/menu` + `sim/econ`. Không một tên món hay con
 * số nào được gõ tay vào file này — bảng treo trên vách, bảng người chơi đọc, và bảng
 * `diffDish` chấm điểm phải là CÙNG MỘT bảng, nếu không nó dạy sai.
 */

const STYLE = `
.mb-root{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(18,22,26,.66);font-family:"Be Vietnam Pro",system-ui,sans-serif;color:#2b2f31}
.mb-wrap{display:flex;gap:18px;align-items:flex-start;max-width:96vw;max-height:94vh}
.mb-board{position:relative;width:min(400px,42vw);transform:rotate(-.5deg);background:#a83226;border:7px solid #6f6256;border-radius:4px;box-shadow:0 14px 40px rgba(0,0,0,.5);padding:16px 18px 14px;color:#f5c542;flex:0 0 auto;max-height:94vh;overflow:auto}
.mb-board::after{content:"";position:absolute;inset:4px;border:1px solid rgba(245,197,66,.35);border-radius:2px;pointer-events:none}
.mb-nail{position:absolute;top:-3px;left:50%;width:9px;height:9px;margin-left:-4px;border-radius:50%;background:#d9d2c4;box-shadow:0 1px 2px rgba(0,0,0,.6)}
.mb-ten{font-weight:700;font-size:1.5em;letter-spacing:.06em;line-height:1.2;text-shadow:0 1px 0 rgba(0,0,0,.35)}
.mb-ten small{display:block;font-weight:500;font-size:.44em;letter-spacing:.14em;opacity:.85;margin-top:2px}
.mb-ke{height:2px;background:#f5c542;opacity:.75;margin:10px 0 8px;transform:rotate(.25deg)}
.mb-row{display:flex;align-items:baseline;gap:6px;padding:4px 0;font-size:1.02em}
.mb-row .n{font-weight:700;white-space:nowrap}
.mb-row .d{flex:1;border-bottom:1px dotted rgba(245,197,66,.5);transform:translateY(-3px)}
.mb-row .g{font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
.mb-row:nth-child(odd) .n{transform:translateY(.5px)}
.mb-row:nth-child(3n) .n{transform:translateX(1px)}
.mb-chan{margin-top:10px;font-size:.78em;line-height:1.55;opacity:.92}
.mb-chan b{color:#fff2c6}

.mb-giay{position:relative;width:min(470px,50vw);max-height:94vh;overflow:auto;background:#f6f0e1;border-radius:3px;box-shadow:0 10px 30px rgba(0,0,0,.4);padding:16px 20px 18px 26px;transform:rotate(.35deg);background-image:linear-gradient(90deg,transparent 14px,rgba(176,52,42,.5) 14px 15px,transparent 15px)}
.mb-bang{position:absolute;top:-10px;left:28px;width:70px;height:22px;background:rgba(222,210,180,.75);border:1px solid rgba(0,0,0,.08);transform:rotate(-3deg)}
.mb-h{font-weight:700;font-size:1.06em;margin:0 0 2px}
.mb-sub{font-size:.8em;color:#7a6f5b;margin-bottom:10px;line-height:1.5}
.mb-nen{border:1px dashed #c3b696;border-radius:6px;padding:8px 10px;margin-bottom:12px;background:rgba(255,255,255,.4)}
.mb-nen .t{font-weight:700;font-size:.92em;margin-bottom:4px}
.mb-nen .l{font-size:.88em;line-height:1.6}
.mb-mon{padding:9px 0;border-bottom:1px dashed #d6c9a8}
.mb-mon:last-of-type{border-bottom:none}
.mb-mon .hd{display:flex;align-items:baseline;gap:6px}
.mb-mon .n{font-weight:700;font-size:1em}
.mb-mon .dot{flex:1;border-bottom:1px dotted #c3b696;transform:translateY(-3px)}
.mb-mon .gia{font-weight:700;font-size:.9em;color:#8e2a20;font-variant-numeric:tabular-nums}
.mb-ing{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}
.mb-ing span{display:inline-flex;align-items:center;gap:4px;padding:2px 7px 2px 3px;border-radius:11px;border:1px solid #cdbf9f;background:rgba(255,255,255,.55);font-size:.84em;line-height:1.5}
.mb-ing span.nhan{border-color:#b0342a;background:rgba(176,52,42,.09);font-weight:700}
.mb-ing b{display:inline-flex;align-items:center;justify-content:center;width:1.35em;height:1.35em;border-radius:50%;background:#2b2f31;color:#f6f0e1;font-size:.82em;font-weight:700}
.mb-ing i{font-style:normal;font-weight:700;color:#8e2a20}
.mb-mon .note{font-size:.82em;color:#6f6450;line-height:1.5;margin-top:4px}
.mb-mon .trong{font-size:.86em;color:#6f6450;margin-top:5px;font-style:italic}
.mb-sec{margin-top:14px;padding-top:10px;border-top:2px solid #d6c9a8}
.mb-tip{display:grid;grid-template-columns:minmax(120px,38%) 1fr;gap:4px 10px;padding:4px 0;font-size:.88em;line-height:1.5}
.mb-tip .s{font-weight:700;color:#8e2a20}
.mb-bar{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:14px;font-size:.8em;color:#7a6f5b}
.mb-btn{font:inherit;font-size:1em;padding:6px 14px;border-radius:6px;border:1px solid #b8ab8e;background:#fbf7ec;color:#2b2f31;cursor:pointer;min-height:32px}
.mb-btn:focus-visible{outline:2px solid #8e2a20;outline-offset:2px}
`;

/**
 * Tiền ghi bằng SỐ trên bảng: "25.000₫".
 *
 * ⚠️ KHÔNG dùng `dongVi()` — hàm đó đọc số thành LỜI ("hai mươi lăm ngàn") vì nó sinh ra
 * cho câu thoại của NPC. Lọt vào bảng giá thì tấm bảng đọc như một người đang nói, và chủ
 * dự án bắt được ngay: *"sao chỗ menu hiện hai mươi lăm ngàn thế. 25.000đ chứ"*.
 */
const tien = (d: number) => `${d.toLocaleString("vi-VN")}₫`;

export type MenuBoardOpts = {
  textScale: number;
  /** Tên con đặt ở màn mở đầu — ghi dưới tên quán, y như dòng trên tấm bảng ngoài vách. */
  playerName?: string;
  onClose: () => void;
};

export class MenuBoardView {
  private root: HTMLDivElement;
  private keyGuard = (ev: KeyboardEvent) => {
    /**
     * Esc và E đều đóng bảng — E vì đó là phím vừa MỞ nó, và bấm lại phím vừa bấm để
     * thoát là phản xạ của mọi người chơi.
     *
     * CANON §15.2 mục 7: không một lớp UI nào được nuốt phím tạm dừng. `P` và `Tab` đi
     * thẳng xuống scene, nên từ đây vẫn vào được menu tạm dừng và vẫn mở được sổ tay.
     */
    if (ev.code === "Escape" || ev.code === "KeyE") { ev.preventDefault(); this.close(); return; }
    if (ev.code === "KeyP" || ev.code === "Tab") return;
    ev.stopPropagation();
  };

  constructor(private game: Phaser.Game, private opts: MenuBoardOpts) {
    if (!document.getElementById("mb-style")) {
      const st = document.createElement("style");
      st.id = "mb-style";
      st.textContent = STYLE;
      document.head.appendChild(st);
    }
    this.root = document.createElement("div");
    this.root.className = "mb-root";
    this.root.style.fontSize = `${Math.round(14 * opts.textScale)}px`;
    this.root.addEventListener("keydown", this.keyGuard, true);
    this.root.addEventListener("keyup", (e) => { if (e.code !== "KeyP" && e.code !== "Tab") e.stopPropagation(); }, true);
    this.root.addEventListener("pointerdown", (e) => { if (e.target === this.root) this.close(); });
    document.body.appendChild(this.root);
    if (this.game.input.keyboard) this.game.input.keyboard.enabled = false;
    this.render();
    /**
     * `preventScroll` — không có nó thì cú focus kéo tờ giấy xuống đáy, và người chơi mở
     * bảng ra là thấy ngay mục "khách dặn thêm" thay vì dòng đầu tiên.
     */
    this.root.querySelector<HTMLButtonElement>(".mb-btn")?.focus({ preventScroll: true });
  }

  private el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = ""): HTMLElementTagNameMap[K] {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  /**
   * ĐỦ BỘ một ổ, theo đúng thứ tự xếp lớp — và kèm PHÍM SỐ của từng thứ.
   *
   * Chỗ này từng chỉ ghi phần nhân, với một ô "ổ nào cũng có" ở đầu trang: đọc xong vẫn
   * không trả lời được câu "ổ thịt nguội thì bỏ cái gì vô". Người chơi không ghép hai chỗ
   * trong đầu giữa lúc có người đứng chờ. Nên mỗi món ghi ĐỦ, kể cả phần lặp lại.
   *
   * Mức lấy thẳng từ `levelsOf` — đúng cái hàm `diffDish` đem ra chấm điểm. Không có
   * đường nào để bảng dạy một đằng, ổ bánh chấm một nẻo.
   */
  private ingChips(it: MenuItem): HTMLElement {
    const box = this.el("div", "mb-ing");
    const lv = levelsOf({ mon: it.id, rau: "day-du", ot: 1, tuong: 1, usual: false });
    for (const i of INGREDIENTS) {
      const n = lv[i.id] ?? 0;
      if (n <= 0) continue;
      const chip = this.el("span", i.kind === "nhan" ? "nhan" : "");
      chip.appendChild(this.el("b", "", String(i.key)));       // phím bấm ở bảng kẹp nhân
      chip.appendChild(this.el("span", "", i.label));
      if (n >= 2) chip.appendChild(this.el("i", "", "×2"));
      box.appendChild(chip);
    }
    return box;
  }

  /** TẤM BẢNG SƠN TAY — tên món và giá. Giá tra thẳng `econ.json`, không gõ tay. */
  private board(): HTMLElement {
    const b = this.el("div", "mb-board");
    b.appendChild(this.el("div", "mb-nail"));
    /*
     * Tên quán ở đây phải là ĐÚNG cái đang sơn trên tấm tôn ngoài vách (`art/sign.ts`): người
     * chơi thấy tên mình ở trên tường, bấm E ra mà thấy tên khác thì đó là hai cái quán.
     */
    const ten = this.el("div", "mb-ten", shopName(this.opts.playerName ?? ""));
    ten.appendChild(this.el("small", "", "bán từ 6 giờ sáng"));
    b.appendChild(ten);
    b.appendChild(this.el("div", "mb-ke"));

    // `MENU_BOARD`, KHÔNG phải `MENU_ITEMS`: món đặt `onBoard: false` vẫn gọi được, chỉ là
    // không ai viết nó lên bảng (bánh mì không). Dùng nhầm danh sách là nó hiện lại.
    for (const it of MENU_BOARD) {
      const row = this.el("div", "mb-row");
      row.appendChild(this.el("span", "n", it.name));
      row.appendChild(this.el("span", "d"));
      row.appendChild(this.el("span", "g", tien(loafPriceVnd(it.tier))));
      b.appendChild(row);
    }

    const chan = this.el("div", "mb-chan");
    // Bậc "đặc biệt" không phải một MÓN — nó là chuyện của lời dặn, nên nó nằm ở chân bảng.
    const db = this.el("div");
    db.innerHTML = "";
    db.append("ổ đầy đủ xin thêm một thứ nhân — ");
    const bb = this.el("b", "", tien(vnd(ECON.menu_k.dacBiet)));
    db.appendChild(bb);
    chan.appendChild(db);
    for (const d of MENU_DRINKS) chan.appendChild(this.el("div", "", `${d.name} — ${d.price}`));
    b.appendChild(chan);
    return b;
  }

  /** TỜ GIẤY DÁN BÊN CẠNH — ổ nào có gì, và khách dặn được gì. */
  private paper(): HTMLElement {
    const p = this.el("div", "mb-giay");
    p.appendChild(this.el("div", "mb-bang"));
    p.appendChild(this.el("div", "mb-h", "Công thức món"));

    for (const it of MENU_BOARD) {
      const m = this.el("div", "mb-mon");
      const hd = this.el("div", "hd");
      hd.appendChild(this.el("span", "n", it.name));
      hd.appendChild(this.el("span", "dot"));
      hd.appendChild(this.el("span", "gia", tien(loafPriceVnd(it.tier))));
      m.appendChild(hd);
      const chips = this.ingChips(it);
      if (chips.childElementCount) m.appendChild(chips);
      else m.appendChild(this.el("div", "trong", "không bỏ gì — ổ bánh trơn."));
      if (it.note.trim()) m.appendChild(this.el("div", "note", it.note));
      p.appendChild(m);
    }

    const sec = this.el("div", "mb-sec");
    sec.appendChild(this.el("div", "mb-h", "Khách dặn thêm"));
    sec.appendChild(this.el("div", "mb-sub", "Nghe được câu nào thì sửa ổ theo câu đó — bảng không tự sửa."));
    for (const t of MENU_TIPS) {
      const row = this.el("div", "mb-tip");
      row.appendChild(this.el("span", "s", t.say));
      row.appendChild(this.el("span", "", t.means));
      sec.appendChild(row);
    }
    p.appendChild(sec);

    const bar = this.el("div", "mb-bar");
    bar.appendChild(this.el("span", "", "Esc hoặc E — quay lại quầy"));
    const btn = this.el("button", "mb-btn", "Đóng");
    btn.onclick = () => this.close();
    bar.appendChild(btn);
    p.appendChild(bar);
    return p;
  }

  private render() {
    this.root.textContent = "";
    const wrap = this.el("div", "mb-wrap");
    wrap.appendChild(this.board());
    wrap.appendChild(this.paper());
    this.root.appendChild(wrap);
  }

  close() {
    if (!this.root.isConnected) return;
    this.root.remove();
    if (this.game.input.keyboard) this.game.input.keyboard.enabled = true;
    this.opts.onClose();
  }

  get open() { return this.root.isConnected; }
}
