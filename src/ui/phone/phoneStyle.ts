export const PHONE_STYLE = `
.ph-root{box-sizing:border-box;--fmin:0px;--tmin:38px;position:fixed;left:0;right:0;top:0;bottom:0;z-index:8995;display:flex;align-items:center;justify-content:center;background:rgba(12,16,20,.62);font-family:"Be Vietnam Pro",system-ui,sans-serif;color:#1c2329;animation:ph-fade .18s ease-out}
@keyframes ph-fade{from{opacity:0}to{opacity:1}}
.ph-root{user-select:none;-webkit-user-select:none}
.ph-root input,.ph-root textarea{user-select:text;-webkit-user-select:text}
.ph-fit{position:relative;flex:none}
.ph-root[data-compact]{padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);background:#0c1014}
.ph-root[data-compact] .ph-fit{width:100%;height:100%}
.ph-root[data-compact] .ph-stage{width:100%;height:100%;transform:none;animation:ph-rise-c .26s cubic-bezier(.2,.8,.2,1)}
@keyframes ph-rise-c{from{transform:translateY(40px);opacity:0}}
.ph-root[data-compact] .ph-screen{left:0;top:0;width:100%;height:100%;border-radius:0}
.ph-root[data-compact] .ph-frame{display:none}
.ph-root[data-compact] .ph-status{height:36px;padding:0 14px 0 18px}

.ph-stage{position:absolute;left:0;top:0;width:438px;height:835px;transform-origin:0 0;animation:ph-rise .26s cubic-bezier(.2,.8,.2,1)}
@keyframes ph-rise{from{transform:translateY(40px) scale(var(--k));opacity:0}}
.ph-stage{transform:scale(var(--k))}
.ph-screen{position:absolute;left:27px;top:22px;width:387px;height:791px;border-radius:46px;overflow:hidden;background:#f4f1ea;display:flex;flex-direction:column}
.ph-frame{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5}

.ph-status{flex:none;height:50px;padding:6px 30px 0 34px;display:flex;align-items:center;justify-content:space-between;font-size:max(15px,var(--fmin));font-weight:700;position:relative;z-index:2}
.ph-status .r{display:flex;gap:6px;align-items:center}
.ph-x{width:var(--tmin);height:var(--tmin);margin:0 -10px 0 0;border:0;border-radius:50%;background:none;color:inherit;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}
.ph-x:focus-visible{outline:2px solid #c0392b;outline-offset:-4px}
@media (hover:hover){.ph-x:hover{background:rgba(128,128,128,.2)}}
.ph-root:not([data-locked]) .ph-status{height:calc(var(--tmin) + 6px)}
.ph-root[data-locked] .ph-x{display:none}
.ph-root[data-short] .ph-bar{display:none}
.ph-root[data-short] .ph-screen{flex-direction:row}
.ph-root[data-short] .ph-status,.ph-root[data-short]:not([data-locked]) .ph-status{flex:none;width:calc(var(--tmin) + 8px);height:auto;padding:4px 0 0;flex-direction:column;justify-content:flex-start;align-items:center}
.ph-root[data-short] .ph-status>span{display:none}
.ph-root[data-short] .ph-x{margin:0;background:rgba(128,128,128,.22)}
.ph-root[data-short][data-locked] .ph-status{display:none}
.ph-root[data-short] .ph-view{min-width:0}
.ph-root[data-short] .ph-view>div:has(>.ph-tabs){display:grid!important;grid-template-columns:auto minmax(0,1fr);grid-template-rows:auto minmax(0,1fr)}
.ph-root[data-short] .ph-view>div:has(>.ph-tabs)>:not(.ph-tabs){grid-column:2;min-height:0;min-width:0}
.ph-root[data-short] .ph-view>div:has(>.ph-tabs)>.ph-nav{grid-row:1}
.ph-root[data-short] .ph-view>div:has(>.ph-tabs)>:not(.ph-tabs):not(.ph-nav){grid-row:2}
.ph-root[data-short] .ph-tabs{grid-column:1;grid-row:1/3;flex-direction:column;justify-content:flex-start;width:88px;white-space:nowrap;border-top:0;border-right:1px solid #ddd8cb;overflow-y:auto}
.ph-root[data-short] .ph-tab{flex:none;min-height:calc(var(--tmin) + 14px)}
.ph-root[data-short] .ph-chips{padding-top:6px;padding-bottom:0}
.ph-root[data-short] .ph-nav{min-height:var(--tmin)}
.ph-status svg{display:block}
.ph-dark .ph-status{color:#fff}

.ph-view{flex:1;min-height:0;display:flex;flex-direction:column;position:relative;font-size:15px}
.ph-view.in-r{animation:ph-in-r .22s ease-out}
.ph-view.in-l{animation:ph-in-l .22s ease-out}
.ph-view.in-up{animation:ph-in-up .24s ease-out}
@keyframes ph-in-r{from{transform:translateX(28%);opacity:.2}}
@keyframes ph-in-l{from{transform:translateX(-28%);opacity:.2}}
@keyframes ph-in-up{from{transform:translateY(5%);opacity:.2}}
.ph-bar{flex:none;display:flex;justify-content:center;padding:0 0 4px;background:transparent}
.ph-bar button{width:min(220px,60%);height:var(--tmin);border:0;background:transparent;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center}
.ph-bar button::after{content:"";width:128px;height:5px;border-radius:3px;background:#1c2329;opacity:.82}
.ph-dark .ph-bar button::after{background:#fff;opacity:.85}
.ph-root[data-locked] .ph-bar button{height:22px;pointer-events:none}
.ph-bar button:focus-visible{outline:2px solid #c0392b;outline-offset:-2px;border-radius:8px}

/* ── màn chính ── */
.ph-home{background:linear-gradient(168deg,#254a56 0%,#3d6b6b 38%,#d79b66 100%);color:#fff}

.ph-widget{margin:4px 0 22px;padding:16px 18px 15px;border-radius:24px;background:rgba(255,255,255,.17);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.22)}
.ph-widget .shop{font-size:1.2em;font-weight:700;line-height:1.25}
.ph-widget .day{margin-top:2px;font-size:max(var(--fmin),.9em);opacity:.92}
.ph-widget .cash{margin-top:12px;padding-top:11px;border-top:1px solid rgba(255,255,255,.25);display:flex;justify-content:space-between;align-items:baseline;font-size:max(var(--fmin),.9em)}
.ph-widget .cash b{font-size:1.25em;font-variant-numeric:tabular-nums}
.ph-homewrap{padding:6px 22px 12px}
.ph-root[data-short] .ph-widget{margin-bottom:14px;padding:12px 16px}
.ph-root[data-short] .ph-grid{grid-template-columns:repeat(4,1fr);gap:14px 6px}
.ph-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px 8px}
.ph-app{position:relative;display:flex;flex-direction:column;align-items:center;gap:7px;background:none;border:0;color:#fff;font:inherit;font-size:max(var(--fmin),.86em);font-weight:500;cursor:pointer;padding:4px 0;border-radius:16px;text-shadow:0 1px 3px rgba(0,0,0,.45)}
.ph-app .ico{position:relative;width:68px;height:68px;border-radius:19px;display:flex;align-items:center;justify-content:center;box-shadow:0 5px 12px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.35);transition:transform .12s}
@media (hover:hover){.ph-app:hover .ico{transform:translateY(-2px)}}
.ph-app:active .ico{transform:scale(.94)}
.ph-app:focus-visible{outline:3px solid #fff;outline-offset:2px}
.ph-app .badge{position:absolute;top:-7px;right:-7px;min-width:24px;height:24px;padding:0 6px;border-radius:12px;background:#e03a2c;color:#fff;font-size:max(var(--fmin),12px);font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px #fff;text-shadow:none;font-variant-numeric:tabular-nums}

/* ── thanh điều hướng trong app ── */
.ph-nav{flex:none;display:grid;grid-template-columns:112px 1fr 112px;align-items:center;min-height:48px;padding:0 6px;border-bottom:1px solid #ddd8cb;background:rgba(250,248,242,.94)}
.ph-nav .t{text-align:center;font-weight:700;font-size:1.04em;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ph-nav .t small{display:block;font-weight:500;font-size:max(var(--fmin),.72em);color:#6b7680;margin-top:-2px}
.ph-nav .r{justify-self:end}
.ph-btn-text{height:var(--tmin);min-width:var(--tmin);padding:0 10px;border:0;background:none;font:inherit;font-weight:500;color:#b02f22;cursor:pointer;display:inline-flex;align-items:center;gap:2px;border-radius:10px;white-space:nowrap}
.ph-btn-text svg{flex:none}
@media (hover:hover){.ph-btn-text:hover{background:rgba(192,57,43,.08)}}
.ph-btn-text:focus-visible{outline:2px solid #b02f22;outline-offset:-2px}
.ph-btn-text.muted{color:#5b6670}
.ph-btn-text.ph-more{width:100%;justify-content:center}
.ph-title-l{padding:10px 20px 8px;font-size:1.9em;font-weight:700;letter-spacing:-.01em;display:flex;align-items:center;justify-content:space-between}
.ph-scroll{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin}

/* ── Message ── */
.ph-list{list-style:none;margin:0;padding:0}
.ph-row{display:flex;align-items:center;gap:12px;width:100%;min-height:72px;padding:10px 18px;background:none;border:0;border-bottom:1px solid #e6e1d4;font:inherit;text-align:left;color:inherit;cursor:pointer}
@media (hover:hover){.ph-row:hover{background:#ece8dc}}
.ph-row:focus-visible{outline:2px solid #b02f22;outline-offset:-2px}
.ph-av{flex:none;width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:1.15em}
.ph-av.sm{width:34px;height:34px;font-size:.95em}
.ph-row .mid{flex:1;min-width:0}
.ph-row .nm{font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ph-row .pv{margin-top:2px;font-size:max(var(--fmin),.9em);color:#5b6670;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ph-row .side{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:6px;font-size:max(var(--fmin),.78em);color:#6b7680;max-width:90px}
.ph-row .side span:first-child{white-space:nowrap}
.ph-row.unread .nm{font-weight:700}
.ph-row.unread .pv{color:#1c2329;font-weight:500}
.ph-dot{min-width:22px;height:22px;padding:0 6px;border-radius:11px;background:#c0392b;color:#fff;font-size:max(var(--fmin),12px);font-weight:700;display:flex;align-items:center;justify-content:center}
.ph-reply-flag{font-size:max(var(--fmin),.74em);font-weight:700;color:#b02f22;background:#fbe4e0;padding:2px 8px;border-radius:9px}

.ph-chat{padding:14px 14px 10px;display:flex;flex-direction:column;gap:4px}
.ph-time{align-self:center;margin:12px 0 6px;font-size:max(var(--fmin),.78em);font-weight:500;color:#5b6670;background:#e6e1d4;padding:3px 12px;border-radius:10px}
.ph-time:first-child{margin-top:0}
.ph-line{display:flex;align-items:flex-end;gap:7px;max-width:92%}
.ph-line.me{align-self:flex-end;flex-direction:row-reverse}
.ph-line .ph-av{margin-bottom:1px}
.ph-line .sp{flex:none;width:34px}
.ph-b{padding:9px 13px;border-radius:19px;line-height:1.42;font-size:.97em;word-break:break-word;background:#e8e4d8;color:#1c2329;animation:ph-pop .2s ease-out}
.ph-line.me .ph-b{background:#2f7d57;color:#fff;border-bottom-right-radius:6px}
.ph-line:not(.me) .ph-b{border-bottom-left-radius:6px}
.ph-who{font-size:max(var(--fmin),.74em);font-weight:700;margin:6px 0 1px 41px}
@keyframes ph-pop{from{transform:scale(.9) translateY(6px);opacity:0}}
.ph-file{display:flex;align-items:center;gap:10px;padding:8px 12px 8px 9px}
.ph-file .fi{flex:none;width:42px;height:40px;border-radius:6px;background:#fff;color:#c0392b;font-size:max(var(--fmin),12px);font-weight:700;display:flex;align-items:flex-end;justify-content:center;padding-bottom:5px;box-shadow:0 1px 3px rgba(0,0,0,.25)}
.ph-file .fn{font-size:max(var(--fmin),.9em);font-weight:500;word-break:break-all;line-height:1.3}
.ph-typing{align-self:flex-end;display:flex;gap:4px;padding:13px 15px;background:#2f7d57;border-radius:19px;border-bottom-right-radius:6px}
.ph-typing.l{align-self:flex-start;background:#e8e4d8}
.ph-typing i{width:7px;height:7px;border-radius:50%;background:#fff;opacity:.5;animation:ph-dots 1s infinite}
.ph-typing.l i{background:#6b7680}
.ph-typing i:nth-child(2){animation-delay:.15s}
.ph-typing i:nth-child(3){animation-delay:.3s}
@keyframes ph-dots{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}

.ph-compose{flex:none;padding:10px 14px 6px;background:#faf8f2;border-top:1px solid #ddd8cb;display:flex;flex-direction:column;gap:8px}
.ph-compose .ask{font-size:max(var(--fmin),.8em);font-weight:500;color:#5b6670}
.ph-chip small{display:block;font-size:max(var(--fmin),.78em);font-weight:700;letter-spacing:.04em;text-transform:uppercase;opacity:.8;margin-bottom:1px}
.ph-chip{width:100%;min-height:max(46px,var(--tmin));padding:10px 16px;border-radius:23px;border:1.5px solid #2f7d57;background:#fff;color:#1e5a3d;font:inherit;font-size:.95em;font-weight:500;line-height:1.35;text-align:left;cursor:pointer;transition:background .12s,transform .1s}
@media (hover:hover){.ph-chip:hover{background:#e6f2ea}}
.ph-chip:active{transform:scale(.985)}
.ph-chip:focus-visible{outline:3px solid #2f7d57;outline-offset:2px}
.ph-chip.alt{border-color:#c9772b;color:#8a4b12}
@media (hover:hover){.ph-chip.alt:hover{background:#fbeedd}}
.ph-chip.alt:focus-visible{outline-color:#c9772b}
.ph-primary{width:100%;min-height:max(48px,var(--tmin));border:0;border-radius:24px;background:#c0392b;color:#fff;font:inherit;font-size:1em;font-weight:700;cursor:pointer;box-shadow:0 3px 10px rgba(192,57,43,.35);transition:transform .1s,background .12s}
@media (hover:hover){.ph-primary:hover{background:#a93226}}
.ph-primary:active{transform:scale(.985)}
.ph-primary:focus-visible{outline:3px solid #1c2329;outline-offset:2px}
.ph-tap{display:flex;justify-content:center;align-items:center;min-height:var(--tmin);cursor:pointer;color:#6b7680;padding:0;animation:ph-bob 1.4s ease-in-out infinite}
@keyframes ph-bob{50%{transform:translateY(5px);opacity:.5}}
@keyframes ph-blink{50%{opacity:.45}}

/* ── Note ── */
.ph-note-sec{padding:14px 20px 6px;font-size:max(var(--fmin),.78em);font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#5b6670}
.ph-card{margin:0 14px 8px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.06)}
.ph-card .ph-row{min-height:60px;border-bottom:1px solid #eee9dc;padding:10px 16px}
.ph-card .ph-row:last-child{border-bottom:0}
.ph-card .ph-row .nm{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.ph-card .ph-row .side{align-self:center}
.ph-profit{font-variant-numeric:tabular-nums;font-weight:700}
.ph-profit.up{color:#2a7249}
.ph-profit.down{color:#b02f22}
.ph-chev{flex:none;color:#9aa3aa}
.ph-empty{padding:34px 28px;text-align:center;color:#5b6670;display:flex;flex-direction:column;align-items:center;gap:8px}
.ph-empty b{font-size:1.05em;color:#1c2329}
.ph-empty p{margin:0;line-height:1.5;font-size:max(var(--fmin),.92em)}
.ph-editor{flex:1;min-height:0;display:flex;flex-direction:column;padding:12px 18px 8px}
.ph-editor textarea{flex:1;min-height:0;width:100%;resize:none;border:0;background:transparent;font:inherit;font-size:max(16px,1.02em);line-height:1.55;color:#1c2329;outline:0;padding:0}
.ph-editor .foot{flex:none;display:flex;justify-content:space-between;align-items:center;font-size:max(var(--fmin),.78em);color:#6b7680;padding-top:6px;min-height:30px}
.ph-day-hero{padding:18px 20px 8px}
.ph-day-hero small{display:block;font-size:max(var(--fmin),.84em);color:#5b6670}
.ph-day-hero .big{font-size:2.2em;font-weight:700;margin-top:2px;font-variant-numeric:tabular-nums}
.ph-kv{display:flex;justify-content:space-between;gap:10px;padding:13px 16px;border-bottom:1px solid #eee9dc;font-size:.97em}
.ph-kv:last-child{border-bottom:0}
.ph-kv b{font-variant-numeric:tabular-nums}

/* ── Đánh giá ── */
.ph-rev-hero{padding:22px 20px 18px;text-align:center;background:#fff;border-bottom:1px solid #e6e1d4}
.ph-rev-hero .shop{font-weight:700;font-size:1.12em;line-height:1.3}
.ph-rev-hero .sub{margin-top:2px;font-size:max(var(--fmin),.84em);color:#5b6670}
.ph-score{margin:14px 0 4px;font-size:3.6em;font-weight:700;line-height:1;color:#1c2329;font-variant-numeric:tabular-nums}
.ph-stars{display:flex;justify-content:center;gap:4px}
.ph-count{margin-top:6px;font-size:max(var(--fmin),.88em);color:#5b6670}
.ph-rev-empty{padding:30px 28px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px}
.ph-rev-empty b{font-size:1.08em}
.ph-rev-empty p{margin:0;font-size:max(var(--fmin),.92em);color:#5b6670;line-height:1.5}
.ph-cta{padding:12px 16px 4px;flex:none}

/* ── danh sách chung ── */
.ph-blank{padding:44px 24px;text-align:center;color:#6b7680;font-size:.95em}
.ph-row.static{cursor:default}
@media (hover:hover){.ph-row.static:hover{background:none}}
.ph-row.note{min-height:64px}
.ph-row.note .pv b{font-weight:500;color:#1c2329;margin-right:2px}
.ph-sec{padding:16px 20px 6px;font-size:max(var(--fmin),.78em);font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#5b6670}
.ph-sec.dark{color:#9aa6d4;padding-left:2px}
.ph-nav .t.link{background:none;border:0;font:inherit;font-weight:700;color:inherit;cursor:pointer;border-radius:10px;min-height:var(--tmin)}
@media (hover:hover){.ph-nav .t.link:hover{background:rgba(0,0,0,.05)}}
.ph-nav .t.link:focus-visible{outline:2px solid #b02f22;outline-offset:-2px}
.ph-btn-text.armed{color:#b02f22;background:#fbe4e0}
.ph-av.xl{width:84px;height:84px;font-size:2em}
.ph-grp-head{display:flex;flex-direction:column;align-items:center;gap:6px;padding:22px 20px 16px}
.ph-grp-head .gn{font-weight:700;font-size:1.15em}
.ph-grp-head .gs{font-size:max(var(--fmin),.86em);color:#6b7680}
.ph-doc{padding:16px 22px 28px}
.ph-doc h2{margin:0 0 10px;font-size:1.45em;line-height:1.25}
.ph-doc p{margin:0 0 8px;line-height:1.6;font-size:1.02em}
.ph-ghost{width:100%;min-height:max(46px,var(--tmin));border:0;border-radius:23px;background:transparent;color:#5b6670;font:inherit;font-weight:500;cursor:pointer}
@media (hover:hover){.ph-ghost:hover{background:rgba(0,0,0,.05)}}
.ph-ghost:focus-visible{outline:2px solid #5b6670;outline-offset:2px}
.ph-primary:disabled{background:#c9c3b4;box-shadow:none;cursor:default;color:#fff}
.ph-primary.slim{width:auto;padding:0 26px}
.ph-warn{font-size:max(var(--fmin),.84em);color:#b02f22;font-weight:500;text-align:center}

/* ── Thực phẩm ── */
.ph-tabs{flex:none;display:flex;border-top:1px solid #ddd8cb;background:#faf8f2}
.ph-tab{position:relative;flex:1;min-height:54px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:none;border:0;font:inherit;font-size:max(var(--fmin),.72em);font-weight:500;color:#6b7680;cursor:pointer}
.ph-tab.on{color:#e5532b;font-weight:700}
.ph-tab:focus-visible{outline:2px solid #e5532b;outline-offset:-3px}
.ph-tab-n{position:absolute;top:5px;left:calc(50% + 8px);min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#e5532b;color:#fff;font-style:normal;font-size:max(var(--fmin),12px);font-weight:700;display:flex;align-items:center;justify-content:center}
.ph-chips{display:flex;gap:8px;padding:12px 14px 4px;overflow-x:auto;scrollbar-width:none}
.ph-chips::-webkit-scrollbar{display:none}
.ph-pill{flex:none;min-height:var(--tmin);padding:0 15px;border-radius:18px;border:1.5px solid #cfc9b9;background:#fff;font:inherit;font-size:max(var(--fmin),.88em);font-weight:500;color:#2b3339;cursor:pointer}
.ph-pill.on{background:#e5532b;border-color:#e5532b;color:#fff;font-weight:700}
.ph-pill:focus-visible{outline:3px solid #e5532b;outline-offset:2px}
.ph-prods{padding:6px 14px 14px;display:flex;flex-direction:column;gap:8px}
.ph-prod{display:flex;align-items:center;gap:10px;padding:12px 12px 12px 14px;background:#fff;border-radius:16px;border:1.5px solid transparent;box-shadow:0 1px 2px rgba(0,0,0,.06)}
.ph-prod.has{border-color:#f0a58c;background:#fff8f4}
.ph-prod .info{flex:1;min-width:0}
.ph-prod .nm,.ph-line-item .nm{font-weight:500;line-height:1.3}
.ph-prod .pr,.ph-line-item .pr{margin-top:2px;font-size:max(var(--fmin),.88em);color:#4a545c}
.ph-prod .pr b{color:#1c2329;font-variant-numeric:tabular-nums}
.ph-prod .st{margin-top:2px;font-size:max(var(--fmin),.78em);color:#6b7680}
.ph-trend{margin-left:7px;font-size:max(var(--fmin),.78em);font-weight:700}
.ph-trend.up{color:#b02f22}.ph-trend.down{color:#2a7249}
.ph-step{flex:none;display:flex;align-items:center;gap:2px;background:#f1eee5;border-radius:22px;padding:3px}
.ph-step button{width:var(--tmin);height:var(--tmin);border-radius:50%;border:0;background:#fff;font:inherit;font-size:1.25em;line-height:1;color:#1c2329;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.18)}
@media (hover:hover){.ph-step button:hover:not(:disabled){background:#e5532b;color:#fff}}
.ph-step button:disabled{opacity:.35;cursor:default;box-shadow:none}
.ph-step button:focus-visible{outline:3px solid #e5532b;outline-offset:1px}
.ph-step .q{min-width:34px;text-align:center;font-weight:700;font-variant-numeric:tabular-nums}
.ph-step.zero .q{color:#9aa3aa;font-weight:500}
.ph-cartbar{flex:none;display:flex;align-items:center;gap:10px;margin:0 14px 10px;min-height:52px;padding:0 18px;border:0;border-radius:26px;background:#e5532b;color:#fff;font:inherit;font-weight:500;cursor:pointer;box-shadow:0 4px 14px rgba(229,83,43,.45)}
.ph-cartbar b{margin-left:auto;font-variant-numeric:tabular-nums}
.ph-cartbar .go{font-weight:700}
@media (hover:hover){.ph-cartbar:hover{background:#d2461f}}
.ph-cartbar:focus-visible{outline:3px solid #1c2329;outline-offset:2px}
.ph-line-item{display:flex;align-items:center;gap:10px;padding:12px 12px 12px 16px;border-bottom:1px solid #eee9dc}
.ph-line-item:last-child{border-bottom:0}
.ph-line-item .info{flex:1;min-width:0}
.ph-line-item .amt{margin-top:3px;font-weight:700;font-variant-numeric:tabular-nums}
.ph-order .ls .li{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:6px}
.ph-order .ls .li:last-child{margin-bottom:0}
.ph-order .ls .li .nm{display:flex;flex-direction:column;min-width:0}
.ph-order .ls .li small{color:#78828a;font-size:max(var(--fmin),.86em)}
.ph-order .ls .li b{font-variant-numeric:tabular-nums;white-space:nowrap}
.ph-card+.ph-card{margin-top:10px}
.ph-card:first-child{margin-top:12px}
.ph-switch{display:flex;align-items:center;gap:8px;width:100%;min-height:54px;padding:0 16px;border:0;border-bottom:1px solid #eee9dc;background:none;font:inherit;text-align:left;cursor:pointer;color:inherit}
.ph-switch:last-child{border-bottom:0}
.ph-switch .tx{flex:1;min-width:0;padding:8px 0}
.ph-switch .lb{font-weight:500}
.ph-switch .ct{font-size:max(var(--fmin),.8em);color:#6b7680}
.ph-switch .sw{position:relative;width:46px;height:28px;border-radius:14px;background:#cfc9b9;transition:background .15s}
.ph-switch .sw::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .15s}
.ph-switch.on .sw{background:#2f7d57}
.ph-switch.on .sw::after{transform:translateX(18px)}
.ph-switch:focus-visible{outline:3px solid #2f7d57;outline-offset:-3px}
.ph-switch:disabled{opacity:.5;cursor:default}
.ph-sum .kv{display:flex;justify-content:space-between;gap:10px;padding:11px 16px;border-bottom:1px solid #eee9dc;font-size:.95em}
.ph-sum .kv:last-child{border-bottom:0}
.ph-sum .kv b{font-variant-numeric:tabular-nums}
.ph-sum .kv.good b{color:#2a7249}
.ph-sum .kv.bad b{color:#b02f22}
.ph-empty-big{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#6b7680;padding-bottom:40px}
.ph-empty-big b{color:#1c2329;font-weight:500}
.ph-flash{margin:12px 14px 0;padding:11px 16px;border-radius:14px;background:#e3f3e9;color:#1e5a3d;font-weight:700;animation:ph-pop .25s ease-out}
.ph-orders{padding:10px 14px 14px;display:flex;flex-direction:column;gap:10px}
.ph-order{background:#fff;border-radius:16px;padding:12px 14px 6px;box-shadow:0 1px 2px rgba(0,0,0,.06)}
.ph-order .hd{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ph-order .hd span:nth-child(2){font-size:max(var(--fmin),.82em);color:#6b7680}
.ph-st{margin-left:auto;font-size:max(var(--fmin),.76em);font-weight:700;padding:3px 10px;border-radius:11px}
.ph-st.go{background:#fff0d6;color:#8a5a00}
.ph-st.ok{background:#e3f3e9;color:#1e5a3d}
.ph-order .ls{margin:8px 0 4px;font-size:max(var(--fmin),.9em);color:#3a444b;line-height:1.5}
.ph-order .ft{display:flex;align-items:center;justify-content:space-between;gap:4px;border-top:1px solid #eee9dc;padding-top:2px}
.ph-order .ft b{margin-right:auto;font-variant-numeric:tabular-nums}

/* ── Đồ nghề ── */
.ph-cartcard{padding:12px 16px 14px}
.ph-cartcard .t{font-weight:700;font-size:max(var(--fmin),.9em);margin-bottom:8px}
.ph-cartcells{display:flex;flex-wrap:wrap;gap:5px}
.ph-cartcells .cell{width:18px;height:18px;border-radius:5px;background:#e6e1d4;border:1px dashed #c4bda9}
.ph-cartcells .cell.used{background:#55626e;border:1px solid #55626e}
.ph-cartcells .cell.pend{background:#f5b82e;border:1px solid #d9a21b}
.ph-gear{margin:0 14px 10px;padding:14px 16px 12px;background:#fff;border-radius:16px;box-shadow:0 1px 2px rgba(0,0,0,.06)}
.ph-gear.owned{opacity:.6}
.ph-gear.has{outline:2px solid #55626e;outline-offset:-2px}
.ph-buy.on{background:#fff;color:#55626e;box-shadow:inset 0 0 0 2px #55626e}
.ph-gear .tp{display:flex;justify-content:space-between;gap:10px;align-items:baseline}
.ph-gear .pr{font-weight:700;font-variant-numeric:tabular-nums}
.ph-chips-s{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 2px}
.ph-chips-s span{font-size:max(var(--fmin),.76em);color:#5b6670;background:#f1eee5;border-radius:9px;padding:2px 9px}
.ph-gear .gain{list-style:none;margin:8px 0 0;padding:0;font-size:max(var(--fmin),.9em);line-height:1.5;color:#2a6a47}
.ph-gear .gain li::before{content:"+ ";font-weight:700}
.ph-gear .hint{margin-top:8px;font-size:max(var(--fmin),.84em);color:#2f5d8a;line-height:1.45}
.ph-gear .ft{display:flex;align-items:center;gap:10px;margin-top:10px}
.ph-buy{min-height:var(--tmin);padding:0 22px;border:0;border-radius:20px;background:#55626e;color:#fff;font:inherit;font-weight:700;cursor:pointer}
@media (hover:hover){.ph-buy:hover:not(:disabled){background:#3f4a54}}
.ph-buy:disabled{background:#e6e1d4;color:#6b7680;cursor:default}
.ph-buy:focus-visible{outline:3px solid #55626e;outline-offset:2px}
.ph-gear .why{font-size:max(var(--fmin),.82em);color:#b02f22}

/* ── Nhà cung cấp: nhãn mức + 3 thanh ── */
.ph-tier-tag{display:inline-block;margin-left:8px;padding:1px 8px;border-radius:9px;font-size:max(var(--fmin),.72em);font-weight:700;vertical-align:1px}
.ph-tier-tag.bad{background:#fbe4e0;color:#a52a1f}
.ph-tier-tag.mid{background:#ece8dc;color:#4a545c}
.ph-tier-tag.good{background:#e3f3e9;color:#1e5a3d}
.ph-prod .sup{margin-top:1px;font-size:max(var(--fmin),.78em);color:#6b7680}
.ph-bars3{display:flex;flex-direction:column;gap:3px;margin:7px 0 2px}
.ph-bar3{display:flex;align-items:center;gap:8px;font-size:max(var(--fmin),.74em);color:#5b6670}
.ph-bar3 .lb{width:32px}
.ph-bar3 .pp{display:flex;gap:3px}
.ph-bar3 .pp i{width:16px;height:7px;border-radius:3px;background:#e6e1d4}
.ph-bar3.g .pp i.on{background:#2f9e57}
.ph-bar3.p .pp i.on{background:#e5532b}
.ph-supnote{padding:6px 6px 2px;font-size:max(var(--fmin),.88em);color:#5b6670}
.ph-sec.in{padding:12px 16px 2px}

/* ── Rao bán ── */
.ph-listing{padding:14px 16px 6px;border-bottom:1px solid #eee9dc}
.ph-listing:last-child{border-bottom:0}
.ph-listing .tp{display:flex;justify-content:space-between;gap:10px}
.ph-listing .ask{font-weight:700;font-variant-numeric:tabular-nums;color:#2189a8}
.ph-listing .md{display:flex;align-items:center;gap:10px;margin:8px 0 2px;font-size:max(var(--fmin),.84em);color:#4a545c}
.ph-listing .ft{display:flex;align-items:center;justify-content:space-between;font-size:max(var(--fmin),.82em);color:#6b7680}
.ph-meter{flex:1;max-width:120px;height:8px;border-radius:4px;background:#e6e1d4;overflow:hidden}
.ph-meter i{display:block;height:100%;border-radius:4px;background:linear-gradient(90deg,#4fc3d9,#2189a8)}
.ph-post-h{padding:18px 20px 8px}
.ph-post-h .nm{font-weight:700;font-size:1.2em}
.ph-post-h .pv{margin-top:2px;color:#5b6670;font-size:max(var(--fmin),.9em)}
.ph-tiers{padding:6px 14px;display:flex;flex-direction:column;gap:8px}
.ph-tier{display:flex;align-items:center;gap:12px;width:100%;min-height:68px;padding:10px 16px;border-radius:16px;border:2px solid transparent;background:#fff;font:inherit;text-align:left;color:inherit;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.06)}
.ph-tier.on{border-color:#2189a8;background:#effafd}
.ph-tier .l{flex:1;display:grid;grid-template-columns:auto 1fr;gap:2px 10px;align-items:center}
.ph-tier .l b{grid-column:1/3}
.ph-tier .l span{font-size:max(var(--fmin),.82em);color:#5b6670}
.ph-tier .r{font-weight:700;font-variant-numeric:tabular-nums}
.ph-tier:focus-visible{outline:3px solid #2189a8;outline-offset:2px}

/* ── Hệ thống: giao diện máy, mạch, lưới ── */
.sys{--c:#19e3ff;--g:#39ff9c;--ink:#cfeaf0;--dim:#6fa3b0;--line:rgba(25,227,255,.32);position:relative;color:var(--ink);letter-spacing:.01em}
.sys::before{content:"";position:absolute;inset:0;pointer-events:none;z-index:0;
  background:repeating-linear-gradient(0deg,transparent 0 3px,rgba(25,227,255,.035) 3px 4px)}
.sys>*{position:relative;z-index:1}
.ph-sysbg{background:
  linear-gradient(rgba(25,227,255,.06) 1px,transparent 1px) 0 0/22px 22px,
  linear-gradient(90deg,rgba(25,227,255,.06) 1px,transparent 1px) 0 0/22px 22px,
  radial-gradient(ellipse at 50% 0,#0c2a35 0,#060d12 70%)}
.sys .ph-nav{background:rgba(5,12,17,.9);border-bottom:1px solid var(--line)}
.sys .ph-nav .t{color:var(--c);text-transform:uppercase;letter-spacing:.14em;font-size:max(var(--fmin),.9em)}
.sys .ph-btn-text{color:var(--c)}
@media (hover:hover){.sys .ph-btn-text:hover{background:rgba(25,227,255,.1)}}
.sys .ph-scroll{padding:12px 14px 16px;overflow-x:hidden;scrollbar-color:#19e3ff #06222c}
.sys-awake{scrollbar-color:#19e3ff #06222c}
.sys-card{position:relative;background:rgba(8,26,34,.78);border:1px solid var(--line);border-radius:4px;padding:14px 16px;margin-bottom:12px;
  background-image:linear-gradient(var(--c),var(--c)),linear-gradient(var(--c),var(--c)),linear-gradient(var(--c),var(--c)),linear-gradient(var(--c),var(--c)),linear-gradient(var(--c),var(--c)),linear-gradient(var(--c),var(--c)),linear-gradient(var(--c),var(--c)),linear-gradient(var(--c),var(--c));
  background-size:12px 2px,2px 12px,12px 2px,2px 12px,12px 2px,2px 12px,12px 2px,2px 12px;
  background-position:left top,left top,right top,right top,left bottom,left bottom,right bottom,right bottom;
  background-repeat:no-repeat;box-shadow:0 0 18px rgba(25,227,255,.08) inset}
.sys-card .kv,.sys-stats .kv{display:flex;justify-content:space-between;gap:12px;padding:6px 0;font-size:max(var(--fmin),.88em);border-bottom:1px dashed rgba(25,227,255,.2)}
.sys-card .kv:last-child,.sys-stats .kv:last-child{border-bottom:0}
.sys-card .kv span,.sys-stats .kv span{color:var(--dim);text-transform:uppercase;letter-spacing:.08em;font-size:max(var(--fmin),.82em)}
.sys-card .kv b,.sys-stats .kv b{text-align:right;color:var(--g);font-weight:500;font-variant-numeric:tabular-nums;text-shadow:0 0 8px rgba(57,255,156,.45)}
.sys-card.quest{border-color:var(--g)}
.sys-card .hd{font-weight:700;color:var(--g);font-size:max(var(--fmin),.8em);letter-spacing:.14em;text-transform:uppercase}
.sys-card .hd::before{content:"// ";opacity:.7}
.sys-card p{margin:8px 0 0;line-height:1.55;font-size:.95em}
.sys-card .ann{color:var(--ink)}
.sys-card .ann::before{content:"> ";color:var(--g)}
.ph-sec.dark{color:var(--c);letter-spacing:.14em;padding-left:2px}
.ph-sec.dark::before{content:"// ";opacity:.7}
.sys-log p{margin:0 0 6px;padding:8px 12px;border-left:2px solid var(--g);background:rgba(8,26,34,.7);font-size:max(var(--fmin),.86em);line-height:1.5;color:var(--ink)}
.sys-awake{flex:1;min-height:0;overflow-x:hidden;overflow-y:auto;padding:18px 20px 8px}
.sys-awake p{margin:0 0 8px;line-height:1.55;animation:ph-pop .25s ease-out;color:var(--ink)}
.sys-awake p::before{content:"> ";color:var(--g)}
.sys-awake p:last-child::after{content:"▌";margin-left:3px;color:var(--g);animation:sys-blink 1s steps(1) infinite}
@keyframes sys-blink{50%{opacity:0}}
.sys-stats{margin:10px 0 14px;padding:8px 14px;background:rgba(8,26,34,.78);border:1px solid var(--line);border-radius:4px;animation:ph-pop .25s ease-out}
.sys-dock{background:rgba(5,12,17,.92)!important;border-top:1px solid var(--line)!important}
.sys .ph-primary{background:transparent;color:var(--g);border:1.5px solid var(--g);border-radius:4px;letter-spacing:.14em;text-transform:uppercase;font-size:max(var(--fmin),.9em);box-shadow:0 0 14px rgba(57,255,156,.35),inset 0 0 12px rgba(57,255,156,.12)}
@media (hover:hover){.sys .ph-primary:hover:not(:disabled){background:rgba(57,255,156,.14)}}
.sys .ph-primary:disabled{opacity:.4;box-shadow:none}
.sys .ph-primary:focus-visible{outline:2px solid #fff}
.sys .ph-ghost{color:var(--dim);border-radius:4px;letter-spacing:.1em;text-transform:uppercase;font-size:max(var(--fmin),.84em)}
@media (hover:hover){.sys .ph-ghost:hover{background:rgba(25,227,255,.08)}}
.sys-wheel{position:relative;width:268px;height:284px;margin:10px auto 12px;overflow:hidden}
.sys-wheel .disc{width:268px;height:268px;margin-top:16px;filter:drop-shadow(0 0 10px rgba(25,227,255,.35))}
.sys-wheel .pin{position:absolute;left:50%;top:0;width:0;height:0;margin-left:-11px;border-left:11px solid transparent;border-right:11px solid transparent;border-top:24px solid var(--g);filter:drop-shadow(0 0 6px rgba(57,255,156,.8))}
.sys-result p{margin:4px 0 0;font-size:max(var(--fmin),.9em);line-height:1.5;color:var(--ink);animation:ph-pop .25s ease-out}
.sys-result p:first-child{color:var(--g)}
.sys-result{margin-bottom:10px}
.wheel .ph-primary{margin-top:6px}

/* ── Đánh giá: danh sách + Hồi Tâm ── */
.ph-revs{padding:10px 14px 16px;display:flex;flex-direction:column;gap:8px}
.ph-rev{background:#fff;border-radius:16px;padding:12px 14px 6px;box-shadow:0 1px 2px rgba(0,0,0,.06)}
.ph-rev .tp{display:flex;align-items:center;gap:10px}
.ph-rev .who{flex:1;min-width:0;display:flex;flex-direction:column}
.ph-rev .who span{font-size:max(var(--fmin),.78em);color:#6b7680}
.ph-stars.sm{gap:1px}
.ph-rev .tx{margin:8px 0 2px;line-height:1.5}
.ph-rev .ed{font-size:max(var(--fmin),.78em);color:#6b7680;margin-bottom:2px}
.ph-dist{margin-top:14px;display:flex;flex-direction:column;gap:3px}
.ph-distrow{display:flex;align-items:center;gap:8px;width:100%;min-height:var(--tmin);padding:3px 4px;border:0;border-radius:8px;background:none;font:inherit;color:inherit;cursor:pointer;text-align:left}
.ph-distrow.on{background:#fff2cf}
.ph-distrow:focus-visible{outline:2px solid #e8a51c;outline-offset:1px}
.ph-distrow .s{width:1em;font-size:max(var(--fmin),.84em);color:#5b6670;font-variant-numeric:tabular-nums}
.ph-distrow .bar{flex:1;height:9px;border-radius:5px;background:#eceadf;overflow:hidden}
.ph-distrow .bar i{display:block;height:100%;background:#f5b82e}
.ph-distrow .n{min-width:2.2em;text-align:right;font-size:max(var(--fmin),.8em);color:#5b6670;font-variant-numeric:tabular-nums}
.ph-revacts{display:flex;flex-wrap:wrap;gap:4px 14px;padding-bottom:4px}
.ph-rev.bare{padding:10px 14px 2px}
.ph-rev.bare .ph-revacts{margin-top:2px}
.ph-reply{margin:8px 0 4px 10px;padding:9px 12px;border-left:3px solid #e6e1d4;background:#f7f5ef;border-radius:0 12px 12px 0}
.ph-reply .hd{display:flex;align-items:center;gap:7px;font-size:max(var(--fmin),.86em)}
.ph-reply .tx{margin:5px 0 0;line-height:1.5;font-size:.94em}
.ph-more{padding:0 14px 18px;display:flex}
.ph-more button{flex:1}
.ph-fix{padding:16px 18px;display:flex;flex-direction:column;gap:14px}
.ph-fix .who{font-weight:700}
.ph-fix textarea{box-sizing:border-box;width:100%;min-height:150px;resize:none;border:1.5px solid #cfc9b9;border-radius:14px;background:#fff;padding:12px 14px;font:inherit;font-size:max(16px,1em);line-height:1.5;color:#1c2329;outline:0}
.ph-fix textarea:focus{border-color:#c0392b}
.ph-pick{display:flex;gap:6px}
.ph-star{width:max(46px,var(--tmin));height:max(46px,var(--tmin));border:0;background:none;cursor:pointer;border-radius:12px;padding:0;display:flex;align-items:center;justify-content:center;opacity:.55}
.ph-star.on{opacity:1}
.ph-star:focus-visible{outline:3px solid #c0392b;outline-offset:1px}

/* ── nền sau điện thoại ở màn giới thiệu ── */
.ph-root.bg{transition:background .6s}
.ph-root.bg-office{background:
  linear-gradient(180deg,rgba(10,14,24,.0) 55%,rgba(8,10,16,.85) 100%),
  repeating-linear-gradient(90deg,transparent 0 58px,rgba(255,218,140,.07) 58px 62px),
  repeating-linear-gradient(0deg,transparent 0 66px,rgba(255,218,140,.07) 66px 70px),
  radial-gradient(ellipse at 20% 30%,rgba(255,214,120,.20),transparent 22%),
  radial-gradient(ellipse at 74% 46%,rgba(255,214,120,.16),transparent 18%),
  radial-gradient(ellipse at 52% 18%,rgba(255,214,120,.12),transparent 16%),
  #172033}
.ph-root.bg-night{background:
  radial-gradient(ellipse at 18% 12%,rgba(255,190,110,.35),transparent 38%),
  linear-gradient(180deg,#2d2019,#1a1210)}
.ph-root.bg-morning{background:
  linear-gradient(115deg,rgba(255,236,190,.28) 0 18%,transparent 18% 100%),
  linear-gradient(180deg,#a37a52,#6d4c33)}
.ph-root.bg-brown{background:linear-gradient(180deg,#6e4f38,#4a3426)}

/* ── Danh hiệu ── */
.ph-ach-h{display:flex;align-items:center;gap:8px;padding:16px 20px 4px;font-size:max(var(--fmin),.9em);color:#3a444c}
.ph-ach-h b{font-weight:700}
.ph-ach-h span{margin-left:auto;font-variant-numeric:tabular-nums;color:#6b7680;font-size:max(var(--fmin),.9em)}
.ph-ach-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px 10px;padding:8px 14px 6px}
.ph-ach{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0;padding:10px 4px 8px;border-radius:14px;border:1.5px solid #e1dccd;background:#fff;font:inherit;color:inherit;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.06)}
.ph-ach.t-bac{border-color:#b8c3cb}
.ph-ach.t-vang{border-color:#e3b93f;background:linear-gradient(#fff9de,#fff)}
.ph-ach.t-kc{border-color:#58c4ee;background:linear-gradient(#e6f8ff,#fff)}
.ph-ach:focus-visible{outline:3px solid #b02f22;outline-offset:2px}
.ph-ach .bd{position:relative;display:flex;height:60px;align-items:center;justify-content:center}
.ph-ach .nm{width:100%;font-size:max(var(--fmin),.78em);font-weight:600;line-height:1.25;text-align:center;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.5em}
.ph-ach.off{background:#f1eee5;border-color:#b5afa0;border-style:dashed;box-shadow:none}
.ph-ach.off .nm{color:#6b6659;font-weight:500}
.ph-ach .q,.ph-ach-hero .q{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:800;font-size:26px;color:#8d877a;transform:translateY(-9.5%)}
.ph-ach.t-kc .q,.ph-ach-hero.t-kc .q{transform:none}
.ph-ach-hero .q{font-size:56px}
.ab .spark{transform-box:fill-box;transform-origin:center;animation:ab-tw 2.4s ease-in-out infinite}
.ab .spark.s2{animation-delay:1.1s}
@keyframes ab-tw{0%,100%{opacity:.25;transform:scale(.6)}50%{opacity:1;transform:scale(1.15)}}
.ph-ach-hero{display:flex;flex-direction:column;align-items:center;gap:8px;padding:22px 20px 14px;text-align:center}
.ph-ach-hero .bd{position:relative;display:flex;align-items:center;justify-content:center}
.ph-ach-hero h2{margin:4px 0 0;font-size:1.35em;line-height:1.25}
.ph-ach-tier{padding:3px 14px;border-radius:12px;font-size:max(var(--fmin),.82em);font-weight:700;border:1.5px solid}
.ph-ach-tier.dong{color:#7a3d18;background:#f7e3d2;border-color:#c9733a}
.ph-ach-tier.bac{color:#44505a;background:#e8edf0;border-color:#8794a0}
.ph-ach-tier.vang{color:#7a4d00;background:#fff0b8;border-color:#d9a21b}
.ph-ach-tier.kc{color:#0b5a8a;background:#dff6ff;border-color:#2aa8e0}
.ph-ach-hero.off h2{color:#6b6659}
.ph-ach-info .kv{padding:12px 16px;border-bottom:1px solid #eee9dc}
.ph-ach-info .kv:last-child{border-bottom:0}
.ph-ach-info .kv span{font-size:max(var(--fmin),.76em);font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#5b6670}
.ph-ach-info .kv p{margin:3px 0 0;line-height:1.4}
@media (prefers-reduced-motion:reduce){
  .ph-stage,.ph-view,.ph-b,.ph-root{animation:none!important}
  .ph-typing i,.ph-tap,.ab .spark{animation:none!important}
}
`;
