/** Ảnh RGBA thô, hàng từ trên xuống; không phụ thuộc Phaser hay DOM để chạy được trong test node. */
export type Img = { w: number; h: number; data: Uint8ClampedArray };

/** Ảnh xám một kênh, 0–255. */
export type Gray = { w: number; h: number; data: Uint8ClampedArray };

export type FloorMaterial = {
  id: string;
  /** 0 = nhám, không phản chiếu. */
  gloss: number;
  reflNear: number;
  reflFar: number;
  /** Có loá ở vạt nắng không. */
  glare: boolean;
};

/** Một đạo cụ đã đặt cố định trên sàn. */
export type LitObject = {
  /** Ảnh đã nướng ở mật độ `imgScale` px mỗi px thiết kế. */
  img: Img;
  imgScale: number;
  /** Giữa đáy ảnh, toạ độ màn hình thiết kế. */
  footX: number;
  footY: number;
  /** Phần chiều cao ảnh là mặt bên (thùng 0,62, tủ 0,64, bồn 0,85). */
  side: number;
  /** Cỡ chân theo ô, cho AO hình thoi. */
  fw: number;
  fh: number;
  /** Độ lệch bóng riêng của vật; thiếu thì dùng `LIGHT.SUN_K`. Trong tiệm ngắn hơn ngoài trời. */
  shadowK?: number;
  /** Nhân độ nhoè viền bóng (1 = mặc định); trong tiệm lớn hơn để bóng mềm. */
  shadowSoft?: number;
  /** Nhân độ đậm bóng (1 = mặc định); trong tiệm nhạt hơn. */
  shadowAlpha?: number;
  /** Px thiết kế nâng tâm AO lên, cho ảnh có chân cao hơn đáy khung. */
  aoUp?: number;
};

/** Ảnh bóng xám (trắng là nắng) trải trên hình chữ nhật thế giới `x, y, w, h` tính theo ô; `soft` làm nhoè mép (ô), `feather: false` bỏ mờ dần ở 4 mép ảnh. */
export type Canopy = { img: Gray; x: number; y: number; w: number; h: number; flipX?: boolean; flipY?: boolean; alpha?: number; soft?: number; feather?: boolean };

export type FloorLightInput = {
  /** Hình chữ nhật sàn, toạ độ màn hình thiết kế (góc trên-trái và cỡ). */
  rect: { x: number; y: number; w: number; h: number };
  /** px mỗi px thiết kế của lightmap và phản chiếu. */
  scale: number;
  objects: LitObject[];
  /** Các mảng tán lá đặt trên sàn; ngoài mảng là nắng đầy. */
  canopies: Canopy[];
  /** Độ bóng sàn tại toạ độ màn hình thiết kế (0–1); nhân với phản chiếu theo điểm ảnh. */
  glossAt(sx: number, sy: number): number;
  /** Trong vùng sàn đi được hay không (ngoài thì không tô). */
  insideAt(sx: number, sy: number): boolean;
  overcast: boolean;
  /** Cường độ bóng lá tại điểm màn hình thiết kế: 0 = không có lá (trong tiệm có mái), 1 = đủ. Thiếu = 1 ở mọi nơi. */
  leafStrengthAt?(sx: number, sy: number): number;
};

export type FloorLightOutput = {
  /** RGBA nhân lên albedo sàn: `AMB·AO·… + SUN·nắng`, alpha 255. */
  lightmap: Img;
  /** RGBA thường (phản chiếu), alpha theo độ bóng. */
  reflection: Img;
  /** Nắng tới mỗi điểm ở độ phân giải `scale`, 0–1, cho `LightEnv.sun` và đốm lá lên vật. */
  sun: { w: number; h: number; data: Float32Array };
};
