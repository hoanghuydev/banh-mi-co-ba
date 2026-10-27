import Phaser from "phaser";
import { DEFAULT_SHOP_NAME, NAME_MAX, cleanName, shopName } from "../../content/shop";
import { CLAY_CSS } from "../clayCss";
import { isTouch, onDeviceChange, viewport } from "../../core/device";
import { btn, el } from "./dom";

const STYLE = `
.nm-root{position:fixed;left:0;right:0;top:0;z-index:8996;display:flex;padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));overflow:auto;box-sizing:border-box;overscroll-behavior:contain;
  background:linear-gradient(180deg,#1f3a47 0%,#3b6470 45%,#c98f62 100%);font-family:"Be Vietnam Pro",system-ui,sans-serif;color:#1c2329;animation:ph-fade .25s ease-out}
.nm-card{width:min(440px,100%);margin:auto;background:#e9dcb9;border-radius:22px;padding:22px 22px 20px;box-shadow:0 20px 50px rgba(0,0,0,.4)}
.nm-card h1{margin:0;font-size:1.55em;line-height:1.2}
.nm-card .sub{margin:4px 0 16px;color:#5a5340;font-size:max(14px,.95em);line-height:1.45}
.nm-shop{position:relative;aspect-ratio:2/1;border-radius:14px;background:url(art/man_nhap_ten_quan.webp) center/cover;overflow:hidden;margin-bottom:16px;border:1px solid #bdb59e}
.nm-sign{position:absolute;left:25.2%;top:14.1%;width:48.4%;height:15.9%;display:flex;align-items:center;justify-content:center;overflow:hidden}
.nm-sign span{color:#f5c542;font-weight:700;letter-spacing:.03em;white-space:nowrap;text-align:center;padding:0 4px;text-shadow:0 1px 2px rgba(60,10,5,.6)}
.nm-card label{display:block;font-size:max(14px,.9em);font-weight:700;margin-bottom:6px}
.nm-in{display:flex;align-items:center;gap:8px;border-radius:.8em;padding:0 12px;box-shadow:inset 0 3px 5px rgba(60,50,30,.45),0 2px 0 rgba(255,255,255,.7),0 0 0 2px transparent;transition:box-shadow .12s}
.nm-in:focus-within{box-shadow:inset 0 3px 5px rgba(60,50,30,.45),0 2px 0 rgba(255,255,255,.7),0 0 0 3px #c0392b}
.nm-in input{flex:1;min-width:0;height:48px;border:0;outline:0;background:none;font:inherit;font-size:max(16px,1.05em);font-weight:600;color:#2a2420}
.nm-in small{flex:none;color:#6e6650;font-size:max(14px,.85em);font-variant-numeric:tabular-nums}
.nm-chips{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 16px}
.nm-chip{min-height:44px;padding:0 1em;border-radius:22px;font-size:max(14px,.9em);font-weight:600;box-shadow:0 3px 0 #b9a47a,0 5px 3px -2px rgba(60,28,10,.4),inset 0 2px 1px rgba(255,255,255,.9),inset 0 -3px 5px rgba(0,0,0,.1)}
.nm-chip::before{top:.14em;left:.5em;right:.5em}
@media (hover:hover){.nm-chip:hover{transform:translateY(-1px)}}
.nm-chip:active{transform:translateY(2px);box-shadow:0 1px 0 #b9a47a,inset 0 3px 6px rgba(0,0,0,.22)}
.nm-chip:focus-visible{outline:3px solid #c0392b;outline-offset:2px}
.nm-go{width:100%;min-height:48px;font-size:1.02em;border-radius:1.3em}
.nm-go:focus-visible{outline:3px solid #1c2329;outline-offset:3px}
.nm-note{margin:11px 0 0;text-align:center;font-size:max(14px,.9em);color:#6e6650}
.nm-root[data-two] .nm-card{width:min(860px,100%);display:grid;grid-template-columns:1fr 1fr;column-gap:22px;padding:16px 20px;align-items:start}
.nm-root[data-two] .nm-left,.nm-root[data-two] .nm-right{min-width:0}
.nm-root[data-two] .nm-card .sub{margin-bottom:10px}
.nm-root[data-two] .nm-shop{margin-bottom:0}
.nm-root[data-two] .nm-chips{margin-bottom:12px}
.nm-root[data-two] .nm-note{margin-top:8px}
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
  private go!: HTMLButtonElement;
  private offDevice: () => void = () => {};

  private layout() {
    const { w, h } = viewport();
    this.root.style.top = `${Math.round(window.visualViewport?.offsetTop ?? 0)}px`;
    this.root.style.height = `${h}px`;
    if (w >= 600 && h <= 600) this.root.setAttribute("data-two", "");
    else this.root.removeAttribute("data-two");
  }

  private revealGo() {
    window.setTimeout(() => this.go.scrollIntoView({ block: "nearest", behavior: "smooth" }), 60);
  }

  constructor(private game: Phaser.Game, private opts: { textScale: number; onDone: (name: string) => void }) {
    if (!document.getElementById("nm-style")) {
      const st = document.createElement("style");
      st.id = "nm-style";
      st.textContent = CLAY_CSS + STYLE;
      document.head.appendChild(st);
    }
    this.root = el("div", "nm-root");
    this.root.style.fontSize = `${Math.round(15 * Math.min(opts.textScale, 1.4))}px`;
    const card = el("div", "nm-card");
    const left = el("div", "nm-left");
    const right = el("div", "nm-right");
    left.append(el("h1", "", "Đặt tên cho quán"), el("p", "sub", "Mặt bằng đã thuê xong. Tên bạn chọn sẽ treo trên biển hiệu."));

    const shop = el("div", "nm-shop");
    const sign = el("div", "nm-sign");
    const text = el("span");
    text.style.cssText = "display:block;max-width:100%";
    sign.append(text);
    shop.append(sign);
    left.append(shop);

    const lab = el("label", "", "Tên quán");
    lab.htmlFor = "nm-input";
    const wrap = el("div", "nm-in clay-well");
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
      let px = Math.min(24, Math.floor(sign.clientHeight * 0.8));
      text.style.fontSize = `${px}px`;
      while (px > 7 && text.scrollWidth > sign.clientWidth - 8) text.style.fontSize = `${--px}px`;
      count.textContent = `${inp.value.length}/${NAME_MAX}`;
    };
    inp.oninput = paint;
    queueMicrotask(paint);

    const chips = el("div", "nm-chips");
    chips.setAttribute("aria-label", "Gợi ý tên");
    for (const s of SUGGEST) chips.append(btn("nm-chip clay-btn", s, () => { inp.value = s; paint(); if (!isTouch()) inp.focus(); }));

    const go = btn("nm-go clay-btn red", "Treo biển", () => this.submit());
    right.append(lab, wrap, chips, go, el("p", "nm-note", "Để trống thì quán lấy tên mặc định."));
    card.append(left, right);
    this.root.append(card);
    this.go = go;
    this.layout();
    this.offDevice = onDeviceChange(() => { this.layout(); paint(); if (document.activeElement === inp) this.revealGo(); });
    inp.addEventListener("focus", () => this.revealGo());
    this.root.addEventListener("keydown", this.onKey, true);
    document.body.appendChild(this.root);
    if (game.input.keyboard) { this.prevKbd = game.input.keyboard.enabled; game.input.keyboard.enabled = false; }
    if (!isTouch()) queueMicrotask(() => { inp.focus(); inp.select(); });
  }

  private submit() {
    const name = cleanName(this.input.value) || DEFAULT_SHOP_NAME;
    this.close();
    this.opts.onDone(name);
  }

  close() {
    if (!this.root.isConnected) return;
    this.offDevice();
    this.root.remove();
    if (this.game.input.keyboard && this.prevKbd !== null) this.game.input.keyboard.enabled = this.prevKbd;
  }
}
