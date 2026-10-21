import Phaser from "phaser";

/** Hộp bao pixel đục, px texture; `right`/`bottom` hở; `null` = rỗng hoặc không đọc được. */
export type OpaqueBox = { left: number; right: number; top: number; bottom: number } | null;

const cache = new Map<string, OpaqueBox>();

// 8/255 bỏ được viền khử răng cưa mờ.
const ALPHA_MIN = 8;

export function opaqueBox(scene: Phaser.Scene, key: string): OpaqueBox {
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  let box: OpaqueBox = null;
  try {
    const src = scene.textures.get(key).getSourceImage() as CanvasImageSource & { width: number; height: number };
    const w = src.width, h = src.height;
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(src, 0, 0);
    const d = ctx.getImageData(0, 0, w, h).data;
    let l = w, r = -1, t = h, b = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] <= ALPHA_MIN) continue;
        if (x < l) l = x;
        if (x > r) r = x;
        if (y < t) t = y;
        if (y > b) b = y;
      }
    }
    if (r >= 0) box = { left: l, right: r + 1, top: t, bottom: b + 1 };
  } catch {
    box = null;
  }
  cache.set(key, box);
  return box;
}

export type SpriteBox = { left: number; top: number; width: number; height: number };

export type Edges = {
  left: number; right: number; top: number; bottom: number;
  /** Tâm ngang của vật, khác tâm sprite ở ảnh nướng lệch (`STANDING[].dx`). */
  cx: number;
};

/** Quy hộp đục về toạ độ màn hình; `box` rỗng thì trả nguyên khung sprite. */
export function opaqueEdges(b: SpriteBox, texW: number, texH: number, box: OpaqueBox): Edges {
  const right0 = b.left + b.width, bottom0 = b.top + b.height;
  if (!box || texW <= 0 || texH <= 0) {
    return { left: b.left, right: right0, top: b.top, bottom: bottom0, cx: b.left + b.width / 2 };
  }
  const sx = b.width / texW, sy = b.height / texH;
  const left = b.left + box.left * sx;
  const right = b.left + box.right * sx;
  return {
    left,
    right,
    top: b.top + box.top * sy,
    bottom: b.top + box.bottom * sy,
    cx: (left + right) / 2,
  };
}

/** Mép thật của sprite; `getBounds()` đã tính sẵn origin, xoay và co. */
export function spriteEdges(scene: Phaser.Scene, img: Phaser.GameObjects.Image): Edges {
  const b = img.getBounds();
  const src = img.texture.getSourceImage() as { width: number; height: number };
  return opaqueEdges(
    { left: b.left, top: b.top, width: b.width, height: b.height },
    src.width, src.height, opaqueBox(scene, img.texture.key),
  );
}
