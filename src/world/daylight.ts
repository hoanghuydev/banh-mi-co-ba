import { DAY_END_MIN, DAY_START_MIN } from "../core/clock";

export type Sun = {
  /** Hướng bóng trên màn hình, vector đơn vị. */
  dirX: number;
  dirY: number;
  /** Bóng dài gấp mấy lần bóng giữa trưa; không bao giờ dưới 1. */
  stretch: number;
  /** Màu nhân (multiply) phủ cả cảnh. */
  tone: number;
  /** Vạt nắng: dịch ngang theo ô, cường độ, màu. */
  patchShift: number;
  patchAlpha: number;
  patchTint: number;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);

function mix(a: number, b: number, t: number) {
  const ch = (s: number) => Math.round(lerp((a >> s) & 0xff, (b >> s) & 0xff, t));
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

/** Mỗi mốc: [phần ngày 0..1, màu]. */
function ramp(stops: readonly (readonly [number, number])[], t: number) {
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1], [t1, c1] = stops[i];
      return mix(c0, c1, (t - t0) / (t1 - t0));
    }
  }
  return stops[stops.length - 1][1];
}

const TONE = [[0, 0xe6dcd3], [0.22, 0xf2ece6], [0.5, 0xffffff], [1, 0xfdfcf8]] as const;
const PATCH_TINT = [[0, 0xffecd5], [0.3, 0xfff4e6], [0.65, 0xfffcf5], [1, 0xfffefb]] as const;

/** Nắng buổi sáng từ phía đông: càng về trưa bóng càng ngắn và cuộn vào chân vật. */
export function sunAt(minutes: number): Sun {
  const day = Math.min(1, Math.max(0, (minutes - DAY_START_MIN) / (DAY_END_MIN - DAY_START_MIN)));
  const t = ease(day);
  const ax = lerp(-0.95, -0.55, t), ay = lerp(0.28, 0.62, t);
  const len = Math.hypot(ax, ay);
  return {
    dirX: ax / len,
    dirY: ay / len,
    stretch: lerp(2.1, 1, t),
    tone: ramp(TONE, day),
    patchShift: lerp(-1.6, 1.4, day),
    patchAlpha: lerp(0.2, 0.3, Math.sin(day * Math.PI * 0.5)),
    patchTint: ramp(PATCH_TINT, day),
  };
}

/** Trời mưa không có nắng trực tiếp: bóng ngắn, mềm, không hướng. */
export const OVERCAST: Sun = {
  dirX: 0, dirY: 1, stretch: 1, tone: 0xffffff, patchShift: 0, patchAlpha: 0, patchTint: 0xffffff,
};
