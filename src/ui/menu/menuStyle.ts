import { CLAY_CSS } from "../clayCss";

const SAFE = (side: string) => `env(safe-area-inset-${side},0px)`;

export const MENU_CSS = CLAY_CSS + `
.mn-root{position:fixed;inset:0;z-index:9000;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;
  display:flex;color:#f7f1e2;font-family:"Be Vietnam Pro",system-ui,sans-serif;line-height:1.5;
  padding:max(14px,${SAFE("top")}) max(16px,${SAFE("right")}) max(14px,${SAFE("bottom")}) max(16px,${SAFE("left")});
  background:linear-gradient(rgba(18,14,10,.46),rgba(18,14,10,.62)),#1d232b url(art/sanh_bg.webp) center/cover no-repeat}
.mn-root *{box-sizing:border-box}
.mn-page{margin:auto;width:min(460px,100%);display:flex;flex-direction:column;gap:12px;animation:mn-in .16s ease-out}
@keyframes mn-in{from{opacity:0}to{opacity:1}}
.mn-root.calm .mn-page{animation:none}
@media (prefers-reduced-motion:reduce){.mn-page{animation:none}}

.mn-logo{display:block;width:min(300px,72%);max-height:42dvh;object-fit:contain;margin:0 auto;filter:drop-shadow(0 8px 14px rgba(0,0,0,.45))}
.mn-sub{margin:0;text-align:center;font-size:.95em;color:#f1e6cf;text-shadow:0 1px 3px rgba(0,0,0,.6)}
.mn-stack{display:flex;flex-direction:column;gap:12px}
.mn-h{margin:0;font-size:1.5em;line-height:1.25;font-weight:700;text-align:center;outline:0;overflow-wrap:anywhere}

.mn-root .clay-btn{width:100%;min-height:3.1em;padding:.4em 1.1em;font-size:1em;touch-action:manipulation;-webkit-tap-highlight-color:transparent;overflow-wrap:anywhere;text-align:center}
.mn-root .clay-btn:focus-visible,.mn-sw:focus-visible,.mn-seg button:focus-visible,.mn-step:focus-visible{outline:3px solid #ffd666;outline-offset:3px}
.mn-root .clay-btn small{display:block;font-size:.9em;font-weight:500;color:#5b4f3a;text-shadow:none}
.mn-root .clay-btn.red small{color:#ffe3dc}
.mn-btn-col{display:flex;flex-direction:column;align-items:center;line-height:1.25}
.mn-root .clay-btn.ghost{background:rgba(42,32,24,.6);color:#f7f1e2;text-shadow:none;box-shadow:0 0 0 2px rgba(247,241,226,.28)}
.mn-root .clay-btn.ghost::before{display:none}
@media (hover:hover){.mn-root .clay-btn.ghost:hover{background:rgba(70,54,40,.75)}}
@media (hover:none){.clay-btn:hover{transform:none}}

.mn-paper{background:rgba(247,244,236,.95);color:#222a31;border-radius:1.2em;padding:1.1em 1.2em;box-shadow:0 10px 24px rgba(0,0,0,.35)}
.mn-paper p{margin:.6em 0 0}
.mn-paper .mn-h{margin-bottom:.1em}
.mn-muted{color:#5b6670}
.mn-paper p.mn-small{font-size:.9em}
.mn-gap{height:20px}
.mn-sep{height:2px;margin:6px 0;background:rgba(247,241,226,.25);border-radius:1px}
.mn-info{text-align:center}
.mn-tray{padding:.5em;display:flex;flex-direction:column;gap:.5em}
.mn-tray-h{margin:.5em .5em 0;font-size:.9em;font-weight:700;color:#e9d9b4;letter-spacing:.02em}

.mn-sw{display:flex;align-items:center;justify-content:space-between;gap:.8em;width:100%;min-height:3.2em;padding:.5em .8em;border:0;border-radius:.9em;
  background:rgba(255,255,255,.08);color:inherit;font:inherit;text-align:left;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.mn-sw .t{flex:1 1 8em;min-width:0;overflow-wrap:anywhere}
.mn-sw b{display:block;font-weight:600}
.mn-sw small{display:block;font-size:.9em;color:#d8cdb4;font-weight:400}
.mn-pill{flex:0 0 auto;min-width:3.6em;padding:.25em .8em;border-radius:1em;text-align:center;font-weight:700;background:#6b6458;color:#fff}
.mn-sw[aria-checked=true] .mn-pill{background:#3f7d5a}
.mn-sw[data-go] .mn-pill{background:transparent;color:#ffd666;font-size:1.2em;min-width:0;padding:0}
@media (hover:hover){.mn-sw:hover{background:rgba(255,255,255,.15)}}

.mn-row{padding:.4em .8em .6em;border-radius:.9em;background:rgba(255,255,255,.08)}
.mn-row-h{display:flex;justify-content:space-between;align-items:baseline;gap:.8em;flex-wrap:wrap}
.mn-row-h b{font-weight:600;overflow-wrap:anywhere;flex:1 1 8em;min-width:0}
.mn-row-h span{font-weight:700;color:#ffd666}
.mn-row small{display:block;font-size:.9em;color:#d8cdb4}
.mn-seg{display:grid;grid-template-columns:repeat(auto-fit,minmax(4em,1fr));gap:6px;margin-top:.5em}
.mn-seg button{min-width:0;overflow-wrap:anywhere;min-height:3em;border:0;border-radius:.7em;font:inherit;font-weight:700;color:#f7f1e2;background:rgba(255,255,255,.12);cursor:pointer;touch-action:manipulation}
.mn-seg button[aria-pressed=true]{background:#f6efdc;color:#2a2420}

.mn-slider{display:flex;align-items:center;gap:6px;margin-top:.2em}
.mn-step{flex:0 0 auto;width:3em;height:3em;border:0;border-radius:.8em;font:inherit;font-size:1.2em;font-weight:700;line-height:1;color:#2a2420;background:#f6efdc;cursor:pointer;touch-action:manipulation}
.mn-step:disabled{opacity:.4}
.mn-range{flex:1 1 auto;min-width:0;height:3em;margin:0;background:transparent;-webkit-appearance:none;appearance:none;touch-action:pan-y;cursor:pointer}
.mn-range::-webkit-slider-runnable-track{height:12px;border-radius:6px;background:linear-gradient(90deg,#ffd666 var(--p,0%),#cfc6ae var(--p,0%));box-shadow:inset 0 2px 3px rgba(60,50,30,.5)}
.mn-range::-moz-range-track{height:12px;border-radius:6px;background:#cfc6ae;box-shadow:inset 0 2px 3px rgba(60,50,30,.5)}
.mn-range::-moz-range-progress{height:12px;border-radius:6px;background:#ffd666}
.mn-range::-webkit-slider-thumb{-webkit-appearance:none;width:30px;height:30px;margin-top:-9px;border-radius:50%;border:0;background:linear-gradient(#fffdf6,#e3d6b4);box-shadow:0 3px 0 #b9a47a,0 4px 6px rgba(0,0,0,.4)}
.mn-range::-moz-range-thumb{width:30px;height:30px;border-radius:50%;border:0;background:linear-gradient(#fffdf6,#e3d6b4);box-shadow:0 3px 0 #b9a47a,0 4px 6px rgba(0,0,0,.4)}
.mn-range:focus-visible{outline:3px solid #ffd666;outline-offset:2px;border-radius:8px}

.mn-credit{font-size:.9em;color:#4a545c}
.mn-credit p{margin:.5em 0 0}

@media (orientation:landscape) and (max-height:520px){
  .mn-root{padding-top:max(8px,${SAFE("top")});padding-bottom:max(8px,${SAFE("bottom")})}
  .mn-main{width:min(820px,100%);flex-direction:row;align-items:center;gap:28px}
  .mn-main .mn-hero{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:6px;justify-content:center}
  .mn-main .mn-stack{flex:1 1 0;min-width:0}
  .mn-main .mn-logo{width:auto;max-width:100%;max-height:62dvh}
  .mn-root .clay-btn{min-height:2.8em;padding-top:.2em;padding-bottom:.2em}
  .mn-main .mn-stack{gap:10px}
  .mn-gap{height:12px}
}
@media (orientation:landscape) and (max-height:520px) and (min-width:700px){
  .mn-wide{width:min(720px,100%)}
}
`;
