import { MIN_FONT, MIN_TOUCH } from "../../core/device";

export const STICK_BASE = 112;
export const STICK_KNOB = 52;
export const ACTION_SIZE = 84;
export const PILL_W = 104;
export const PILL_H = 48;
export const EDGE = 16;
export const PILL_GAP = 8;

const FONT = '"Be Vietnam Pro",system-ui,sans-serif';

export const TOUCH_CSS = `
.tc-root{position:fixed;inset:0;z-index:8000;pointer-events:none;display:none;font-family:${FONT};-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
.tc-root.on{display:block}
.tc-root *{box-sizing:border-box;touch-action:none}
.tc-zone{position:absolute;pointer-events:auto}
.tc-base{position:absolute;width:${STICK_BASE}px;height:${STICK_BASE}px;margin:-${STICK_BASE / 2}px 0 0 -${STICK_BASE / 2}px;border-radius:50%;background:rgba(20,26,31,.32);border:3px solid rgba(255,244,222,.55);opacity:.45;pointer-events:none;transition:opacity .12s}
.tc-base.live{opacity:1}
.tc-knob{position:absolute;left:50%;top:50%;width:${STICK_KNOB}px;height:${STICK_KNOB}px;margin:-${STICK_KNOB / 2}px 0 0 -${STICK_KNOB / 2}px;border-radius:50%;background:rgba(255,244,222,.85);box-shadow:0 2px 6px rgba(0,0,0,.35)}
.tc-btn{position:absolute;pointer-events:auto;display:flex;align-items:center;justify-content:center;text-align:center;color:#fff8ea;font-weight:700;line-height:1.1;background:rgba(32,38,44,.78);border:3px solid rgba(255,244,222,.7);box-shadow:0 2px 8px rgba(0,0,0,.4);cursor:default}
.tc-btn.on{background:rgba(214,92,52,.95);border-color:#fff}
.tc-btn[hidden]{display:none}
.tc-act{width:${ACTION_SIZE}px;height:${ACTION_SIZE}px;border-radius:50%;font-size:${MIN_FONT + 2}px;padding:6px;background:rgba(190,70,38,.9)}
.tc-act.off{background:rgba(32,38,44,.55);border-color:rgba(255,244,222,.35);color:rgba(255,248,234,.55)}
.tc-act.hold::after{content:"";position:absolute;inset:-9px;border-radius:50%;border:3px dashed rgba(255,244,222,.55);pointer-events:none}
.tc-pill{width:${PILL_W}px;height:${Math.max(PILL_H, MIN_TOUCH + 4)}px;border-radius:${PILL_H / 2}px;font-size:${MIN_FONT}px;padding:0 8px}
`;
