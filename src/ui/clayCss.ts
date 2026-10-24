/** CSS cho các màn DOM: nút 3D kiểu đất sét, khay phẳng tối, ô lõm. */
export const CLAY_CSS = `
.clay-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:.4em;min-height:2.6em;padding:0 1.4em;border:0;border-radius:1.2em;
  font:700 1em/1.1 "Be Vietnam Pro",system-ui,sans-serif;color:#2a2420;cursor:pointer;
  background:linear-gradient(180deg,#fffdf6 0%,#f6efdc 55%,#e3d6b4 100%);
  box-shadow:0 4px 0 #b9a47a,0 6px 4px -2px rgba(60,28,10,.38),0 12px 16px rgba(60,28,10,.26),inset 0 2px 1px rgba(255,255,255,.9),inset 0 -4px 6px rgba(0,0,0,.12),inset -2px 0 4px rgba(255,255,255,.2);
  text-shadow:0 1px 0 #fff;transition:none}
.clay-btn::before{content:"";position:absolute;left:.7em;right:.7em;top:.22em;height:36%;border-radius:.9em .9em 1.4em 1.4em;
  background:linear-gradient(rgba(255,255,255,.62),rgba(255,255,255,.04));pointer-events:none}
.clay-btn:hover{transform:translateY(-2px);box-shadow:0 6px 0 #b9a47a,0 8px 5px -2px rgba(60,28,10,.34),0 16px 18px rgba(60,28,10,.24),inset 0 2px 1px #fff,inset 0 -4px 6px rgba(0,0,0,.1)}
.clay-btn:active,.clay-btn.on{transform:translateY(3px);box-shadow:0 1px 0 #b9a47a,0 2px 2px rgba(60,28,10,.35),inset 0 3px 7px rgba(0,0,0,.22)}
.clay-btn.red{color:#fff;text-shadow:0 2px 0 #8f1f13;background:linear-gradient(180deg,#f77a64 0%,#e0432f 55%,#b52a1a 100%);box-shadow:0 4px 0 #8f1f13,0 6px 4px -2px rgba(60,28,10,.38),0 12px 16px rgba(60,28,10,.26),inset 0 2px 1px rgba(255,255,255,.55),inset 0 -4px 6px rgba(0,0,0,.16)}
.clay-btn.red:active{box-shadow:0 1px 0 #8f1f13,0 2px 2px rgba(60,28,10,.35),inset 0 3px 7px rgba(0,0,0,.28)}
.clay-btn:disabled{filter:grayscale(.7) brightness(.95);cursor:default}
.clay-tray{background:rgba(42,32,24,.62);border:2px solid rgba(247,241,226,.2);border-radius:1.4em;color:#f7f1e2}
.clay-well{background:#cfc6ae;border-radius:.7em;box-shadow:inset 0 3px 5px rgba(60,50,30,.45),0 2px 0 rgba(255,255,255,.7);color:#2a2420}
`;
