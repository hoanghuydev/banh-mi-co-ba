import Phaser from "phaser";
import { TH, TW } from "../world/iso";
import { INGREDIENTS, type Ingredient } from "../sim/order";
import type { Hand } from "../world/stations";
import { BASE } from "./canvas";
import { TILE } from "./tiles";
import { PROP } from "./props";
import { HELD } from "./held";
import { FOOD } from "./food";

/**
 * ART V2 — ẢNH THẬT CỦA ARTIST ĐÈ LÊN HÌNH VẼ BẰNG CODE.
 *
 * `art/index.ts` vẫn nướng đủ bộ texture bằng Graphics như cũ, RỒI file này ghi đè
 * lên đúng những key mà artist đã có ảnh. Làm vậy vì hai lẽ:
 *  · bảng tên texture không đổi -> không một file gameplay nào phải sửa (đúng lời
 *    hứa ở đầu `art/index.ts`);
 *  · ảnh nào artist chưa vẽ (dưa leo, tương ớt, két nước, tường, quầy, nhân vật)
 *    thì tự khắc còn nguyên bản vẽ code, không thủng lỗ.
 *
 * File PNG nằm ở `public/art/`, do `tools/prep-art.py` rửa ra từ `public/image-raw/`
 * (tách nền, cắt sát mép, XOAY ổ bánh về nằm ngang, ép ô sàn về hình thoi 2:1).
 *
 * ── Luật đặt ảnh vào ô ───────────────────────────────────────────────────────
 * Y hệt luật của `canvas.ts`, không có ngoại lệ nào cho ảnh:
 *   origin (0.5, 1) đặt tại `footY(sy)`, và ĐIỂM CHẠM ĐẤT nằm ở local y =
 *   H − 1 − BASE − TH/2 chứ không phải đáy texture.
 * Nên cỡ texture ở đây được TÍNH RA từ chiều cao muốn có, không phải gõ tay:
 * xem `standing()` bên dưới. Gõ tay là y như rằng có vật lơ lửng, và bóng đổ
 * rơi lệch xuống dưới chân — đúng cái bẫy mà `canvas.ts` đã cảnh báo.
 */

/** Tiền tố cho ảnh gốc vừa tải về, để không đụng tên với texture của game. */
const SRC = "photo/";

// ─────────────────────────────────────────────────────────────────────── ô sàn

/**
 * Ảnh ô sàn đã được `prep-art.py` cắt sẵn ĐÚNG cỡ texture game (62×38, tâm hình
 * thoi đúng chỗ), nên ở đây chỉ việc nhận nguyên ảnh làm texture — không vẽ lại.
 *
 * KHÔNG có sàn quán (`shop`): tấm gạch bông hoa văn quá dày, lát kín sàn quán thì
 * nền rối hơn thứ đứng trên nó — mà sàn quán là phông của khoảnh khắc quan trọng
 * nhất game (khách nhìn tay mình làm, T1). Sàn quán để trắng, dùng `art/tiles.ts`.
 */
const FLOORS = ["walk", "road"] as const;

// ───────────────────────────────────────────────────────────── đạo cụ đứng trên ô

type Standing = {
  /** Cao bao nhiêu px trên màn hình, đo từ điểm chạm đất lên đỉnh. */
  h: number;
  /** Nhích ngang (px) khi chân vật không nằm giữa ảnh — xe máy chống nghiêng chẳng hạn. */
  dx?: number;
  /** Hạ xuống bao nhiêu px so với TÂM hình thoi. Mặc định `SIT` — xem ngay dưới. */
  dy?: number;
};

/**
 * ── VÌ SAO ẢNH PHẢI HẠ XUỐNG, KHÔNG ĐỂ ĐÚNG TÂM Ô ────────────────────────────
 *
 * Đạo cụ vẽ bằng code đứng bằng `standing()`: đáy khối là một HÌNH THOI trùng khít
 * mặt ô, nên nó phủ từ đỉnh sau (tâm − TH/2) tới đỉnh trước (tâm + TH/2) — mắt đọc
 * ra ngay là "vật này nằm trên ô này".
 *
 * Ảnh chụp thì đáy là một ĐƯỜNG THẲNG NGANG. Đặt đường đó đúng vào tâm hình thoi
 * thì nửa trước của ô lộ ra trống dưới chân vật, và cái lò trông như treo lơ lửng
 * cách sàn mấy px. Nên mọi ảnh đều tụt xuống `SIT` px: đáy ảnh rơi vào khoảng hai
 * phần ba về phía đỉnh trước của ô, đúng chỗ mặt trước của vật thật sự chạm đất.
 */
const SIT = 10;

/**
 * Cỡ lấy mốc theo NGƯỜI: `BODY_H = 64` px là chiều cao một nhân vật.
 * Cái ghế nhựa phải thấp hơn hông người, cái tủ bánh phải cao hơn đầu người —
 * sai tỉ lệ ở đây là cả góc phố đọc ra như đồ chơi xếp lộn cỡ.
 */
const STANDING: Record<string, [src: string, o: Standing]> = {
  [PROP.oven]: ["prop_oven", { h: 70 }],
  [PROP.shelf]: ["prop_shelf", { h: 86 }],
  [PROP.tea]: ["prop_tea", { h: 68 }],
  [PROP.sink]: ["prop_sink", { h: 58, dx: -2 }],
  [PROP.stool]: ["prop_stool", { h: 38 }],
  [PROP.table]: ["prop_table", { h: 56 }],
  // Xe máy trông bé hơn con số `h` nhiều, vì ảnh render gần vuông: chiếc xe nằm
  // chéo trong khung nên bề cao khung lớn hơn hẳn bề cao thật của cái xe.
  [PROP.bike]: ["prop_bike", { h: 82 }],
  [PROP.scooter]: ["prop_scooter", { h: 78 }],
  [PROP.pothos]: ["prop_pothos", { h: 50 }],
  [PROP.bin]: ["prop_bin", { h: 46 }],
  [PROP.sign]: ["prop_sign", { h: 58 }],
  [PROP.fire]: ["prop_extinguisher", { h: 44 }],
};

// ──────────────────────────────────────────────────────────────── món trên tay

/**
 * Bốn ổ bánh NẰM NGANG (prep-art.py đã xoay theo trục chính) và một ly trà ĐỨNG —
 * đúng bài kiểm tra bóng hình của `held.ts`: nhìn đen trắng vẫn phải phân biệt được.
 * `w` là bề ngang muốn có; ly trà đo theo chiều cao nên ghi `h`.
 */
const CARRIED: Partial<Record<Hand, [src: string, size: Fit]>> = {
  loaf_cold: ["held_loaf_cold", { w: 30 }],
  loaf_hot: ["held_loaf_hot", { w: 30 }],
  loaf_burnt: ["held_loaf_burnt", { w: 30 }],
  loaf_filled: ["held_loaf_filled", { w: 34 }],
  tea: ["held_tea", { h: 24 }],
};

// ──────────────────────────────────────────────────────────────────────── nhân

/**
 * Tám món artist đã vẽ. Hai món còn thiếu — `dualeo` (dưa leo) và `tuongot`
 * (tương ớt) — cố ý KHÔNG có trong bảng: chúng rơi về hình vẽ code của `food.ts`.
 *
 * Lưu ý cho lần artist vẽ tiếp (CANON §15): thịt nguội và chả lụa giờ đều là
 * LÁT TRÒN HỒNG, chỉ khác sắc độ. Bản vẽ code cũ cố tình cho thịt nguội hình
 * vuông bo góc để nhìn đen trắng vẫn tách được hai món.
 */
const FILLINGS: Partial<Record<Ingredient, [src: string, fill?: number]>> = {
  pate: ["ing_pate"],
  thit: ["ing_thit"],
  chalua: ["ing_chalua"],
  xiumai: ["ing_xiumai"],
  opla: ["ing_opla"],
  dochua: ["ing_dochua"],
  hanhngo: ["ing_hanhngo"],
  // Trái ớt chiếm gần kín khung ảnh của nó, trong khi mấy món khác còn chừa lề.
  // Cho đầy ô như nhau thì ớt to lấn át cả đĩa — nó là GIA VỊ, không phải miếng nhân.
  ot: ["ing_ot", 0.62],
};

/** Ổ bánh rạch đôi của bảng kẹp nhân: nắp lật ra sau + máng đựng nhân. */
const OPEN_LOAF = ["loaf_lid", "loaf_trough"] as const;

// ─────────────────────────────────────────────────────────────────────── tải về

/**
 * Ảnh đã XIN tải rồi — nhớ ở mức module, không phải mức scene.
 *
 * Cả BootScene lẫn StallScene đều gọi `preloadPhotos`, mà StallScene thì dựng lại
 * mỗi ngày. Hỏi `textures.exists` là chưa đủ: lúc một lượt tải còn đang bay thì
 * texture chưa có, nên lượt sau xin tải lại, và Phaser chửi "Texture key already
 * in use" khi cả hai cùng về. Một cái tên chỉ được xin đúng một lần cho cả ván.
 */
const asked = new Set<string>();

/** Mọi file PNG cần tải. Scene nào vẽ cảnh cũng phải gọi cái này trong `preload()`. */
export function preloadPhotos(scene: Phaser.Scene) {
  const names = [
    ...FLOORS.flatMap((f) => [0, 1, 2, 3].map((i) => `f_${f}${i}`)),
    ...Object.values(STANDING).map(([src]) => src),
    ...Object.values(CARRIED).map(([src]) => src),
    ...Object.values(FILLINGS).map(([src]) => src),
    ...OPEN_LOAF,
  ] as string[];
  for (const n of names) {
    if (asked.has(n) || scene.textures.exists(SRC + n)) continue;
    asked.add(n);
    scene.load.image(SRC + n, `art/${n}.png`);
  }
}

function source(scene: Phaser.Scene, name: string): HTMLImageElement | null {
  const key = SRC + name;
  if (!scene.textures.exists(key)) return null;               // artist chưa gửi ảnh này
  const img = scene.textures.get(key).getSourceImage();
  return img instanceof HTMLImageElement ? img : null;
}

// ────────────────────────────────────────────────────────────────── bút vẽ ảnh

/**
 * Thu ảnh về cỡ `w × h` bằng cách CHIA ĐÔI nhiều nhịp rồi mới về cỡ cuối.
 *
 * `drawImage` thu một phát từ 384 px xuống 70 px là trình duyệt chỉ lấy mẫu song
 * tuyến tính: mỗi điểm đích đọc 4 điểm nguồn trong khi đáng ra phải gộp ~30 điểm.
 * Kết quả là ảnh vừa rỗ vừa bệt — đúng cái "mờ hơn hẳn ảnh gốc" mà mắt bắt được
 * ngay. Chia đôi từng nhịp thì mỗi nhịp gộp đủ 4 điểm, không mất mẫu nào.
 */
function shrink(img: HTMLImageElement, w: number, h: number): CanvasImageSource {
  let src: CanvasImageSource = img;
  let sw = img.width, sh = img.height;
  while (sw > w * 2 && sh > h * 2) {
    sw = Math.max(Math.round(w), sw >> 1);
    sh = Math.max(Math.round(h), sh >> 1);
    const step = document.createElement("canvas");
    step.width = sw;
    step.height = sh;
    const ctx = step.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, 0, 0, sw, sh);
    src = step;
  }
  return src;
}

/** Mở một texture canvas trắng, xoá bản cũ nếu có. Gọi lúc boot, chưa sprite nào dùng. */
function blank(scene: Phaser.Scene, key: string, w: number, h: number) {
  // Hỏi `exists` trước: `remove()` một key chưa có thì Phaser cảnh báo ra console,
  // mà ba vật chỉ-có-ảnh (Vespa, bảng gỗ, bình chữa cháy) vốn không có bản vẽ code.
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, Math.ceil(w), Math.ceil(h));
  if (!tex) return null;
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return { tex, ctx };
}

/**
 * Texture của một vật ĐỨNG TRÊN Ô.
 *
 * Mép dưới của ảnh là chỗ vật chạm đất (prep-art.py đã cắt sát alpha nên mép dưới
 * đúng là chân vật). Chiều cao texture suy ngược ra từ đó để điểm chạm đất rơi
 * đúng vào `H − 1 − BASE − TH/2`:
 *
 *      H = h + BASE + TH/2 + 1 − dy
 *
 * Đừng gõ tay H. Sai một px là cái lò lơ lửng trên mặt sàn.
 */
function standing(scene: Phaser.Scene, key: string, src: string, o: Standing) {
  const img = source(scene, src);
  if (!img) return;
  const h = o.h;
  const w = (img.width / img.height) * h;
  const W = Math.max(TW + 2, Math.ceil(w) + 6);
  const H = Math.ceil(h + BASE + TH / 2 + 1 - (o.dy ?? SIT));
  const made = blank(scene, key, W, H);
  if (!made) return;
  made.ctx.drawImage(shrink(img, w, h), Math.round(W / 2 - w / 2 + (o.dx ?? 0)), 0, w, h);
  made.tex.refresh();
}

/** Cỡ muốn có: đo theo bề NGANG (ổ bánh nằm) hoặc theo chiều CAO (ly trà đứng). */
type Fit = { w?: number; h?: number };

/** Ảnh nằm gọn giữa một ô vuông `size × size` — dùng cho icon nhân và món trên tay. */
function boxed(scene: Phaser.Scene, key: string, src: string, size: number, fit: Fit) {
  const img = source(scene, src);
  if (!img) return;
  const k = fit.w ? fit.w / img.width : (fit.h ?? size) / img.height;
  const w = img.width * k, h = img.height * k;
  const made = blank(scene, key, size, size);
  if (!made) return;
  made.ctx.drawImage(shrink(img, w, h), (size - w) / 2, (size - h) / 2, w, h);
  made.tex.refresh();
}

// ──────────────────────────────────────────────────────────────────── ghi đè

function floors(scene: Phaser.Scene) {
  for (const kind of FLOORS) {
    for (let i = 0; i < TILE.VARIANTS; i++) {
      const img = source(scene, `f_${kind}${i}`);
      if (!img) continue;
      // Ảnh đã đúng cỡ texture game -> nhận nguyên, không vẽ lại qua canvas:
      // vẽ lại là thêm một lần nội suy, mà ô sàn lát kín thì đường ráp lộ ngay.
      const key = TILE.floor(kind, i);
      if (scene.textures.exists(key)) scene.textures.remove(key);
      scene.textures.addImage(key, img);
    }
  }
}

/**
 * Ổ bánh rạch đôi của bảng kẹp nhân.
 * Nắp vẽ TRƯỚC rồi máng vẽ đè lên, nên nắp chỉ ló phần lưng ra phía sau —
 * đúng dáng ổ bánh mở nằm trên thớt, và chừa nguyên lòng máng cho nhân.
 */
function openLoaf(scene: Phaser.Scene) {
  const lid = source(scene, "loaf_lid"), trough = source(scene, "loaf_trough");
  if (!lid || !trough) return;
  const made = blank(scene, FOOD.loaf, FOOD.LOAF_W, FOOD.LOAF_H);
  if (!made) return;

  const w = FOOD.CRUMB_W / 0.84;                     // ruột bánh chiếm ~84% bề ngang ảnh
  const th = (trough.height / trough.width) * w;
  const lh = (lid.height / lid.width) * w;
  const x = (FOOD.LOAF_W - w) / 2;
  const cy = FOOD.LOAF_H / 2 + FOOD.CRUMB_DY;        // tâm lòng máng
  // Nắp thò lên ĐÚNG `LID_PEEK` px phía trên mép máng: lấy mép trên của máng, lùi
  // lên chừng đó rồi mới đặt nắp xuống. (Bản trước trừ cả nửa chiều cao nắp nên
  // nắp bay hẳn ra ngoài khung texture — ổ bánh trong bảng kẹp mất hẳn một mặt.)
  made.ctx.drawImage(shrink(lid, w, lh), x, cy - th / 2 - FOOD.LID_PEEK + lh / 2, w, lh);
  made.ctx.drawImage(shrink(trough, w, th), x, cy - th / 2, w, th);
  made.tex.refresh();
}

/** Icon nhân (36 px) + bản to nằm trong ổ (×1,7). Gọi sau `buildFood()`. */
export function paintFoodPhotos(scene: Phaser.Scene) {
  openLoaf(scene);
  for (const ing of INGREDIENTS) {
    const spec = FILLINGS[ing.id];
    if (!spec) continue;                             // chưa có ảnh -> giữ hình vẽ code
    const [src, fill = 1] = spec;
    const big = Math.ceil(FOOD.ICON * FOOD.BIG_SCALE);
    boxed(scene, FOOD.icon(ing.id), src, FOOD.ICON, { h: (FOOD.ICON - 2) * fill });
    boxed(scene, FOOD.big(ing.id), src, big, { h: (big - 4) * fill });
  }
}

/**
 * Đè ảnh artist lên bộ texture vừa nướng bằng code.
 * Gọi CUỐI `buildTextures()`, sau khi mọi thứ đã có bản vẽ code làm nền.
 */
export function paintPhotos(scene: Phaser.Scene) {
  floors(scene);
  for (const [key, [src, o]] of Object.entries(STANDING)) standing(scene, key, src, o);
  for (const [hand, [src, fit]] of Object.entries(CARRIED) as [Hand, [string, Fit]][]) {
    boxed(scene, HELD.key(hand), src, HELD.W, fit);
  }
  paintFoodPhotos(scene);
}
