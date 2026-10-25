/** Cảnh quán công bố môi trường ánh sáng qua `scene.registry`; nhân vật và khách đọc ra, thiếu thì không vẽ hiệu ứng. */
export const LIGHT_ENV_KEY = "lightEnv";

export type LightEnv = {
  /** Trời mưa: bỏ bóng nắng và đốm lá, giữ AO. */
  overcast: boolean;
  /** Độ lệch bóng trên mỗi px chiều cao, đổ về (−2, +1). */
  sunK: number;
  /** Độ bóng của sàn tại ô thế giới (0 = nhám, không phản chiếu). */
  gloss(wx: number, wy: number): number;
  /** Mức "trong tiệm có mái" tại ô thế giới: 0 = ngoài trời, 1 = trong tiệm, mượt quanh ranh. */
  indoor(wx: number, wy: number): number;
  /** Phần nắng tới được điểm trên sàn tại toạ độ màn hình thiết kế (0 = bóng đổ hoặc dưới lá, 1 = nắng đầy). */
  sun(sx: number, sy: number): number;
  /** Ảnh nắng của sàn (alpha = nắng) để bóng người chỉ hiện ở chỗ còn nắng; thiếu thì bóng người không bị cắt. */
  sunLayer?: {
    canvas: HTMLCanvasElement; x: number; y: number; scale: number;
    /** Vùng px canvas [x0, x1) × [y0, y1): 1 = nắng đầy cả vùng, 0 = không chút nắng, −1 = lẫn hoặc ra ngoài canvas. */
    cover(x0: number, y0: number, x1: number, y1: number): number;
  };
};

/** Độ sâu các lớp sáng trên sàn; sprite đạo cụ và người dùng `depthOf` nên luôn nằm trên. */
export const LIGHT_DEPTH = {
  lightmap: -999_000,
  reflection: -998_000,
  actorShadow: -997_000,
} as const;

/** Bóng đổ trong tiệm: ngắn, nhoè, nhạt; ngoài trời dùng `sunK` và độ nhoè mặc định. */
export const INDOOR_SHADOW = { k: 0.25, soft: 2, alpha: 0.6 } as const;
