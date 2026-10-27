import { isPhone } from "../../core/device";

export const STICK_BASE = 112;
export const STICK_KNOB = 52;
export const ACTION_SIZE = 84;
export const RUN_SIZE = 60;
export const CTX_SIZE = 60;
export const EDGE = 16;
export const PILL_GAP = 8;

export type TouchDims = { stick: number; knob: number; act: number; sm: number; gap: number };

const TABLET: TouchDims = { stick: STICK_BASE, knob: STICK_KNOB, act: ACTION_SIZE, sm: RUN_SIZE, gap: 12 };
const PHONE: TouchDims = { stick: 100, knob: 42, act: 62, sm: 50, gap: 14 };

export const touchDims = (): TouchDims => (isPhone() ? PHONE : TABLET);

const FONT = '"Be Vietnam Pro",system-ui,sans-serif';
const px = (d: TouchDims) =>
  `--stick:${d.stick}px;--knob:${d.knob}px;--act:${d.act}px;--sm:${d.sm}px;`;

/** Phẳng: nút chính đỏ đặc, nút phụ nền tối mờ viền kem để đọc được trên cả nền sáng lẫn tối. */
export const TOUCH_CSS = `
.tc-root{${px(TABLET)}--act-font:16px;--tag-font:12px;--icon:30px;position:fixed;inset:0;z-index:8000;pointer-events:none;display:none;font-family:${FONT};-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
html[data-phone="1"] .tc-root{${px(PHONE)}--act-font:12px;--tag-font:10px;--icon:26px}
.tc-root.on{display:block}
.tc-root *{box-sizing:border-box;touch-action:none}
.tc-zone{position:absolute;pointer-events:auto}
.tc-base{position:absolute;width:var(--stick);height:var(--stick);margin:calc(var(--stick) / -2) 0 0 calc(var(--stick) / -2);border-radius:50%;
  background:rgba(28,24,20,.35);border:2px solid rgba(255,244,222,.7);opacity:.45;pointer-events:none;transition:opacity .12s}
.tc-base.live{opacity:1}
.tc-knob{position:absolute;left:50%;top:50%;width:var(--knob);height:var(--knob);margin:calc(var(--knob) / -2) 0 0 calc(var(--knob) / -2);border-radius:50%;
  background:#f6efdc;border:2px solid rgba(60,44,28,.55);box-shadow:0 1px 3px rgba(0,0,0,.3)}
.tc-btn{position:absolute;pointer-events:auto;display:flex;align-items:center;justify-content:center;text-align:center;padding:0;border-radius:50%;cursor:default;
  font-weight:800;line-height:1.12;color:#fff;background:rgba(28,24,20,.62);border:2px solid rgba(255,244,222,.85);box-shadow:0 1px 3px rgba(0,0,0,.3);
  transition:transform .06s}
.tc-btn.on{transform:scale(.94);background:rgba(214,92,52,.9);box-shadow:0 0 0 3px rgba(255,214,120,.85)}
.tc-btn[hidden]{display:none}
.tc-act{width:var(--act);height:var(--act);padding:0 6px;font-size:var(--act-font);text-wrap:balance;background:#e0432f;border-color:#fff3d6;text-shadow:0 1px 1px rgba(94,19,11,.6)}
.tc-act.on{background:#b52a1a}
.tc-act.hold::after{content:"";position:absolute;inset:-7px;border-radius:50%;border:2px dotted rgba(255,244,222,.95);pointer-events:none}
.tc-act.hold.on::after{inset:-8px;border:3px solid rgba(255,244,222,.3);border-top-color:#fff;border-right-color:#fff;animation:tc-spin .9s linear infinite}
@keyframes tc-spin{to{transform:rotate(360deg)}}
.tc-sm{width:var(--sm);height:var(--sm)}
.tc-sm svg{width:var(--icon);height:var(--icon);flex:none;margin-top:-3px;overflow:visible}
.tc-tag{position:absolute;left:50%;bottom:-8px;transform:translateX(-50%);white-space:nowrap;padding:0 5px 1px;border-radius:6px;
  font-size:var(--tag-font);font-weight:700;line-height:1.3;color:#fff;background:rgba(28,24,20,.82)}
`;
