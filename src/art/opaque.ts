import Phaser from "phaser";

/**
 * HỘP BAO PIXEL ĐỤC của một texture — mép thật của vật, bỏ hết khoảng trong suốt.
 *
 * Sinh ra vì cùng một lỗi đã lặp lại ba lần ở ba chỗ khác nhau, và lần nào cũng phải
 * chơi thật mới lòi ra:
 *
 *  · Ổ bánh đặt lên thớt: texture là khung 40×40 vẽ ổ quanh tâm, dưới ổ trống 15–20 px,
 *    nên "đặt mép dưới sprite vào mặt thớt" là ổ bánh treo lơ lửng.
 *  · Dấu "việc cần làm" trên khúc quầy: `displayHeight` là bề cao cả khối 92 px kể cả
 *    nóc tủ kính, nên dấu trỏ vào khoảng không phía trên tủ.
 *  · Bồn rửa: `standing()` nướng ảnh LỆCH 2 px trong texture (`STANDING[].dx`), nên tâm
 *    sprite không phải tâm vật.
 *
 * Mẫu số chung: code hỏi KHUNG TEXTURE trong khi nó cần hỏi CÁI VẬT. Đo một lần rồi
 * nhớ — quét alpha không rẻ, mà texture thì cả ván chơi không đổi.
 *
 * Tự đúng theo khi artist gửi ảnh mới hay ai đó sửa hàm vẽ: không có bảng số nào phải
 * nhớ chỉnh, nên không có bảng số nào lệch được.
 */

/** Mép của phần ĐỤC, tính bằng px TEXTURE, gốc ở góc trên trái. `null` = texture rỗng. */
export type OpaqueBox = { left: number; right: number; top: number; bottom: number } | null;

const cache = new Map<string, OpaqueBox>();

/** Ngưỡng alpha coi là "có vật". 8/255 bỏ được viền khử răng cưa mờ tịt. */
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
    box = null;                                        // không đọc được pixel thì thôi
  }
  cache.set(key, box);
  return box;
}

/** Khung sprite trên màn hình — vừa đủ cho `opaqueEdges`, không buộc phải là Phaser. */
export type SpriteBox = { left: number; top: number; width: number; height: number };

export type Edges = {
  left: number; right: number; top: number; bottom: number;
  /** Tâm NGANG của cái VẬT — khác tâm sprite ở mấy ảnh nướng lệch (`STANDING[].dx`). */
  cx: number;
};

/**
 * Quy hộp bao pixel đục về toạ độ màn hình — TOÁN THUẦN, không Phaser, không DOM.
 *
 * Tách riêng vì ĐÂY mới là chỗ cả ba lỗi lịch sử thật sự nằm. Phần quét alpha chỉ là đọc
 * pixel, không sai được; cái sai luôn là bước co giãn và dời gốc sau đó:
 *   · ổ bánh trong khung 40×40 — nhân tỉ lệ đúng nhưng lấy nhầm mép
 *   · khúc quầy cao 92 px — lấy mép khung thay vì mép vật
 *   · bồn rửa nướng lệch 2 px — quên hẳn chuyện tâm vật ≠ tâm khung
 * Ở dạng thuần thì quét được cả ngàn trường hợp trong một cái test, thay vì phải chơi
 * thật mới thấy.
 *
 * `box` rỗng (texture trong suốt hoàn toàn, hoặc không đọc được pixel) thì trả về đúng
 * khung sprite — thà rộng hơn vật còn hơn trả ra một con số bịa.
 */
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

/**
 * Mép THẬT của một sprite trong thế giới. Phần dính Phaser mỏng nhất có thể: đọc khung
 * và cỡ texture rồi giao hết cho `opaqueEdges`.
 *
 * Nhận cả sprite có origin bất kỳ — `getBounds()` đã tính sẵn origin, xoay và co.
 */
export function spriteEdges(scene: Phaser.Scene, img: Phaser.GameObjects.Image): Edges {
  const b = img.getBounds();
  const src = img.texture.getSourceImage() as { width: number; height: number };
  return opaqueEdges(
    { left: b.left, top: b.top, width: b.width, height: b.height },
    src.width, src.height, opaqueBox(scene, img.texture.key),
  );
}
