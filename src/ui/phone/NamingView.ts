import Phaser from "phaser";
import { DEFAULT_SHOP_NAME, NAME_MAX, cleanName, shopName } from "../../content/shop";
import { btn, el } from "./dom";

const STYLE = `
.nm-root{position:fixed;inset:0;z-index:8996;display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto;
  background:linear-gradient(180deg,#1f3a47 0%,#3b6470 45%,#c98f62 100%);font-family:"Be Vietnam Pro",system-ui,sans-serif;color:#1c2329;animation:ph-fade .25s ease-out}
.nm-card{width:min(440px,100%);background:#f6f2e6;border-radius:22px;padding:22px 22px 20px;box-shadow:0 20px 50px rgba(0,0,0,.4)}
.nm-card h1{margin:0;font-size:1.55em;line-height:1.2}
.nm-card .sub{margin:4px 0 16px;color:#4a545c;font-size:.95em;line-height:1.45}
.nm-shop{position:relative;height:178px;border-radius:14px;background:linear-gradient(#d9d2c0,#cbc3ae);overflow:hidden;margin-bottom:16px;border:1px solid #bdb59e}
.nm-sign{position:absolute;left:50%;top:18px;transform:translateX(-50%);width:84%;height:58px;border-radius:8px;background:#c0392b;border:4px solid #8e2a20;
  display:flex;align-items:center;justify-content:center;box-shadow:0 6px 12px rgba(0,0,0,.28);overflow:hidden}
.nm-sign span{color:#f5c542;font-weight:700;letter-spacing:.03em;white-space:nowrap;text-align:center;padding:0 10px}
.nm-sign::before,.nm-sign::after{content:"";position:absolute;top:6px;width:6px;height:6px;border-radius:50%;background:#8e2a20}
.nm-sign::before{left:7px}.nm-sign::after{right:7px}
.nm-door{position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:62%;height:76px;border-radius:6px 6px 0 0;background:repeating-linear-gradient(#8f98a0 0 7px,#7f8890 7px 9px);border:3px solid #5d666d;border-bottom:0}
.nm-door::after{content:"";position:absolute;left:50%;bottom:6px;width:26px;height:5px;border-radius:3px;background:#4a5258;transform:translateX(-50%)}
.nm-card label{display:block;font-size:.84em;font-weight:700;margin-bottom:6px}
.nm-in{display:flex;align-items:center;gap:8px;border:2px solid #b9b19b;background:#fff;border-radius:12px;padding:0 12px;transition:border-color .12s}
.nm-in:focus-within{border-color:#c0392b}
.nm-in input{flex:1;min-width:0;height:48px;border:0;outline:0;background:none;font:inherit;font-size:1.05em;font-weight:500;color:#1c2329}
.nm-in small{flex:none;color:#6b7680;font-size:.78em;font-variant-numeric:tabular-nums}
.nm-chips{display:flex;flex-wrap:wrap;gap:7px;margin:10px 0 16px}
.nm-chip{border:1px solid #b9b19b;background:#fff;border-radius:16px;padding:7px 13px;font:inherit;font-size:.84em;color:#2b3339;cursor:pointer;min-height:36px}
.nm-chip:hover{border-color:#c0392b;background:#fdf1ef}
.nm-chip:focus-visible{outline:3px solid #c0392b;outline-offset:2px}
.nm-go{width:100%;min-height:50px;border:0;border-radius:25px;background:#c0392b;color:#fff;font:inherit;font-size:1.02em;font-weight:700;cursor:pointer;box-shadow:0 3px 10px rgba(192,57,43,.4)}
.nm-go:hover{background:#a93226}
.nm-go:focus-visible{outline:3px solid #1c2329;outline-offset:2px}
.nm-note{margin:9px 0 0;text-align:center;font-size:.8em;color:#6b7680}
`;

const SUGGEST = ["Bánh Mì Phương Anh", "Bánh Mì Hẻm Nhỏ", "Bye Sếp Bánh Mì"];

/** Đặt tên quán trước biển hiệu trống; bảng hiệu cập nhật theo từng ký tự gõ. */
export class NamingView {
  private root: HTMLDivElement;
  private prevKbd: boolean | null = null;
  private onKey = (ev: KeyboardEvent) => {
    if (ev.code === "Enter" && !(ev.target instanceof HTMLButtonElement)) { ev.preventDefault(); this.submit(); }
    else if (ev.code !== "F12" && ev.code !== "KeyP") ev.stopPropagation();
  };
  private input!: HTMLInputElement;

  constructor(private game: Phaser.Game, private opts: { textScale: number; onDone: (name: string) => void }) {
    if (!document.getElementById("nm-style")) {
      const st = document.createElement("style");
      st.id = "nm-style";
      st.textContent = STYLE;
      document.head.appendChild(st);
    }
    this.root = el("div", "nm-root");
    this.root.style.fontSize = `${Math.round(15 * Math.min(opts.textScale, 1.4))}px`;
    const card = el("div", "nm-card");
    card.append(el("h1", "", "Đặt tên cho quán"), el("p", "sub", "Mặt bằng đã thuê xong. Tên bạn chọn sẽ treo trên biển hiệu."));

    const shop = el("div", "nm-shop");
    const sign = el("div", "nm-sign");
    const text = el("span");
    text.style.cssText = "display:block;max-width:100%";
    sign.append(text);
    shop.append(sign, el("div", "nm-door"));
    card.append(shop);

    const lab = el("label", "", "Tên quán");
    lab.htmlFor = "nm-input";
    const wrap = el("div", "nm-in");
    const inp = el("input");
    inp.id = "nm-input";
    inp.type = "text";
    inp.maxLength = NAME_MAX;
    inp.value = DEFAULT_SHOP_NAME;
    inp.autocomplete = "off";
    inp.spellcheck = false;
    const count = el("small");
    wrap.append(inp, count);
    this.input = inp;

    const paint = () => {
      const t = shopName(inp.value);
      text.textContent = t;
      let px = 24;
      text.style.fontSize = `${px}px`;
      while (px > 11 && text.scrollWidth > sign.clientWidth - 24) text.style.fontSize = `${--px}px`;
      count.textContent = `${inp.value.length}/${NAME_MAX}`;
    };
    inp.oninput = paint;
    queueMicrotask(paint);

    const chips = el("div", "nm-chips");
    chips.setAttribute("aria-label", "Gợi ý tên");
    for (const s of SUGGEST) chips.append(btn("nm-chip", s, () => { inp.value = s; paint(); inp.focus(); }));

    const go = btn("nm-go", "Treo biển", () => this.submit());
    card.append(lab, wrap, chips, go, el("p", "nm-note", "Để trống thì quán lấy tên mặc định."));
    this.root.append(card);
    this.root.addEventListener("keydown", this.onKey, true);
    document.body.appendChild(this.root);
    if (game.input.keyboard) { this.prevKbd = game.input.keyboard.enabled; game.input.keyboard.enabled = false; }
    queueMicrotask(() => { inp.focus(); inp.select(); });
  }

  private submit() {
    const name = cleanName(this.input.value) || DEFAULT_SHOP_NAME;
    this.close();
    this.opts.onDone(name);
  }

  close() {
    if (!this.root.isConnected) return;
    this.root.remove();
    if (this.game.input.keyboard && this.prevKbd !== null) this.game.input.keyboard.enabled = this.prevKbd;
  }
}
