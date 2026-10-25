import { contactOf } from "../../content/phone/contacts";
import { avatar } from "./chat";
import { el } from "./dom";
import { sfx } from "../../audio/sfx";

const STYLE = `
.ph-banner{position:fixed;top:calc(env(safe-area-inset-top) + 14px);right:calc(env(safe-area-inset-right) + 14px);left:auto;z-index:8994;width:min(340px,calc(100vw - 28px));display:flex;gap:11px;align-items:center;text-align:left;
  min-height:44px;padding:11px 14px;border:0;border-radius:18px;background:rgba(250,248,242,.97);color:#1c2329;font:inherit;cursor:pointer;
  box-shadow:0 10px 30px rgba(0,0,0,.4);animation:ph-ban .3s cubic-bezier(.2,.8,.2,1)}
@media (hover:hover){.ph-banner:hover{background:#fff}}
.ph-banner:focus-visible{outline:3px solid #c0392b;outline-offset:2px}
.ph-banner .tx{min-width:0;flex:1}
.ph-banner .nm{font-weight:700;font-size:max(14px,.92em)}
.ph-banner .pv{margin-top:1px;font-size:.88em;color:#4a545c;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ph-banner .tip{margin-top:4px;font-size:max(14px,.76em);color:#6b7680}
.ph-banner.out{animation:ph-ban-out .25s ease-in forwards}
@keyframes ph-ban{from{transform:translateY(-24px);opacity:0}}
@keyframes ph-ban-out{to{transform:translateY(-24px);opacity:0}}
@media (prefers-reduced-motion:reduce){.ph-banner,.ph-banner.out{animation:none}}
`;

/** Thông báo tin mới, tự tắt sau vài giây; bấm vào thì mở thẳng cuộc chat. */
export function showBanner(msgs: { from: string; text: string }[], onOpen: (threadId: string) => void, textScale = 1): () => void {
  if (!msgs.length) return () => {};
  if (!document.getElementById("ph-banner-style")) {
    const st = document.createElement("style");
    st.id = "ph-banner-style";
    st.textContent = STYLE;
    document.head.appendChild(st);
  }
  sfx.ui("ph_tin_den");
  const first = msgs[0];
  const b = el("button", "ph-banner");
  b.type = "button";
  b.style.fontSize = `${Math.round(15 * Math.min(textScale, 1.4))}px`;
  b.append(avatar(first.from));
  const tx = el("span", "tx");
  tx.append(el("div", "nm", contactOf(first.from).name));
  tx.append(el("div", "pv", first.text));
  if (msgs.length > 1) tx.append(el("div", "tip", `và ${msgs.length - 1} tin nữa`));
  b.append(tx);
  const kill = () => {
    clearTimeout(timer);
    b.classList.add("out");
    window.setTimeout(() => b.remove(), 260);
  };
  b.onclick = () => { kill(); onOpen(first.from); };
  const timer = window.setTimeout(kill, 7000);
  document.body.appendChild(b);
  return kill;
}
