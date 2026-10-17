import Phaser from "phaser";
import { TH, TW } from "../world/iso";
import { INGREDIENTS, type Ingredient } from "../sim/order";
import { BASE } from "./canvas";
import { RENDER_SCALE } from "../core/render";
import { TILE } from "./tiles";
import { PROP } from "./props";
import { HELD, type HeldLook } from "./held";
import { FOOD } from "./food";
import { FX, FLY_W, FLY_BOX } from "./fx";
import {
  BODY_H, WALK_FRAMES, markEightWay, markGait, textureFor, walkKey,
  type Gait, type Pose,
} from "./character";
import type { Facing8 } from "../world/iso";

/**
 * ẢNH THẬT CỦA ARTIST ĐÈ LÊN HÌNH VẼ BẰNG CODE — `art/index.ts` vẫn nướng đủ bộ texture bằng
 * Graphics, rồi file này ghi đè lên đúng những key đã có ảnh. Bảng tên không đổi nên không file
 * gameplay nào phải sửa, và key nào chưa có ảnh thì còn nguyên bản vẽ code.
 *
 * ⚠️ Cỡ texture TÍNH RA từ chiều cao muốn có (`standing()`), không gõ tay: điểm chạm đất nằm ở
 * `H − 1 − BASE − TH/2` chứ không phải đáy texture, nên gõ tay là vật lơ lửng và bóng đổ rơi lệch.
 */

const SRC = "photo/";

/**
 * Atlas chu kỳ đi — `tools/pack-atlas.py` sinh ra MỘT tấm cho mỗi nhân vật có animation.
 * `file` là tên bộ ảnh trong `public/art/` (`player` -> `player.png` + `player.json`).
 */
const walkAtlas = (file: string) => `${SRC}${file}_walk`;

/** Bảng neo bàn tay của bộ `carry`, `tools/pack-atlas.py` xuất ra cạnh atlas. */
const HOLD_JSON = SRC + "player_hold";

const FLY = "fly";

/** Ảnh chưa về thì `StallScene` bỏ qua hẳn. ⚠️ Chụp ở góc ngẩng 30° (mặt trên rộng gấp đôi bề cao) — sai tỉ lệ đó thì ép méo ở code cũng không cứu được. */
export const BOARD_TEX = "cut_board";
const BOARD = "cutting_board";

export const BOARD_W = 28;

/** Cùng luật với cái thớt — xem trên. */
export const BASKET_TEX = "bread_basket";
const BASKET = "ro_banh_mi";

export const BASKET_W = 23;

/**
 * Bao nhiêu pixel texture cho một pixel thiết kế. `standing()` nướng ảnh về đúng chiều cao vật
 * trong thế giới, rồi camera còn phóng `ZOOM × RENDER_SCALE` lần nữa.
 *
 * Trần 3 để texture không phình — diện tích tăng theo BÌNH PHƯƠNG hệ số này.
 */
export const ART_SS = Math.min(3, Math.max(1, RENDER_SCALE * 1.4));

/** ⚠️ Không suy ra được từ cỡ texture: `art/index.ts` nướng cả một bộ bằng Graphics ở tỉ lệ 1:1 và chúng dùng chung bảng tên với ảnh thật. */
const ssOf = new Map<string, number>();

export function artScale(key: string) {
  return ssOf.get(key) ?? 1;
}

/** 0,55 là đầu + một chút vai: cái cổ rơi vào trong khung nên chân dung không bị cắt ngang cằm. */
const FACE_CROP = 0.55;

/**
 * ⚠️ Cắt bằng HÌNH HỌC chứ không giao cho `object-fit: cover`: người vẽ code chừa 16 px trống trên
 * đỉnh đầu, còn ảnh thật thì `standing()` cắt sát — cùng một luật `cover` trên hai tỉ lệ khung
 * khác nhau ra hai kiểu ảnh khác hẳn.
 */
export function faceCrop(scene: Phaser.Scene, key: string): string {
  const src = scene.textures.get(key).getSourceImage() as CanvasImageSource & { width: number; height: number };
  const ss = artScale(key);
  const headTop = src.height / ss - 1 - BASE - TH / 2 - BODY_H;
  const side = Math.round(BODY_H * FACE_CROP * ss);
  const out = document.createElement("canvas");
  out.width = out.height = side;
  const ctx = out.getContext("2d");
  if (!ctx) return "";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, Math.round((src.width - side) / 2), Math.round(headTop * ss), side, side, 0, 0, side, side);
  return out.toDataURL();
}

/** ⚠️ Phải gọi LẠI sau mỗi `setTexture`: hệ số thuộc về texture chứ không thuộc sprite, mà cùng một sprite đổi qua lại giữa ảnh thật (dư pixel) và hình vẽ code (1:1). */
export function fitPhoto<T extends Phaser.GameObjects.Image>(img: T, extra = 1): T {
  img.setScale(extra / artScale(img.texture.key));
  return img;
}

// ─────────────────────────────────────────────────────────────────────── ô sàn

/** KHÔNG có sàn quán: gạch bông hoa văn quá dày, lát kín thì nền rối hơn thứ đứng trên nó — mà sàn quán là phông của khoảnh khắc T1. */
const FLOORS = ["walk", "road"] as const;

// ───────────────────────────────────────────────────────────── đạo cụ đứng trên ô

type Standing = {
  h: number;
  dx?: number;
  dy?: number;
};

/** Đạo cụ vẽ code có đáy là HÌNH THOI trùng mặt ô, ảnh chụp thì đáy là ĐƯỜNG THẲNG — đặt đúng tâm thoi thì nửa trước ô lộ ra trống và vật trông như treo lơ lửng. */
const SIT = 10;

/** Lấy mốc theo NGƯỜI (`BODY_H` = 64): cái ghế nhựa phải thấp hơn hẳn, cái tủ phải cao hơn. */
const STANDING: Record<string, [src: string, o: Standing]> = {
  [PROP.oven]: ["prop_oven", { h: 70 }],
  // Cùng tỉ lệ khung với lò than (0,773) nên nó rơi đúng chỗ cũ; cao hơn 4 px để cú nâng
  // cấp ĐỌC RA ĐƯỢC từ xa mà vẫn hẹp hơn một ô (74 × 0,773 = 57 < TW 60).
  [PROP.ovenE]: ["prop_e-oven", { h: 74 }],
  [PROP.shelf]: ["prop_shelf", { h: 86 }],
  [PROP.tea]: ["prop_tea", { h: 68 }],
  [PROP.sink]: ["prop_sink", { h: 58, dx: -2 }],
  [PROP.stool]: ["prop_stool", { h: 38 }],
  [PROP.table]: ["prop_table", { h: 56 }],
  // Xe máy trông bé hơn con số `h` nhiều, vì ảnh render gần vuông: chiếc xe nằm
  // chéo trong khung nên bề cao khung lớn hơn hẳn bề cao thật của cái xe.
  [PROP.bike]: ["prop_bike", { h: 82 }],
  [PROP.scooter]: ["prop_scooter", { h: 78 }],
  // Chậu để DƯỚI ĐẤT thì phải thấp hơn cái ghế nhựa (38): ở 50 px nó cao gần bằng
  // bồn rửa bên cạnh (58) và đọc ra như một cái cây cảnh to đùng chắn mất khúc quầy.
  [PROP.pothos]: ["prop_pothos", { h: 34 }],
  [PROP.bin]: ["prop_bin", { h: 46 }],
  [PROP.sign]: ["prop_sign", { h: 58 }],
  // Bình chữa cháy là khối ĐỨNG, đáy phẳng và hẹp — không có phần bụng phình ra
  // phía trước như cái lò hay cái tủ, nên tụt đủ `SIT` px là nhìn ra lún xuống sàn.
  [PROP.fire]: ["prop_extinguisher", { h: 44, dy: SIT - 5 }],
  // Vật CAO NHẤT trong bộ. Mốc không phải "cao bao nhiêu px cho đẹp" mà là TỈ LỆ VỚI
  // NGƯỜI: dù sân thật cao cỡ 2,2 m so với người 1,6 m, nên 100 px trên `BODY_H` = 64.
  // Bản vẽ code cũ để 110 — ở đó tán dù ngang tầm mái hiên và đọc ra như một cái ô
  // dựng trên sân khấu chứ không phải cái dù cắm ngoài vỉa hè.
  [PROP.umbrella]: ["prop_umbrella", { h: 100 }],
  // Tủ lạnh hai ngăn cỡ gia đình: cao ~1,55 m, tức THẤP HƠN người một chút — 62 trên
  // `BODY_H` = 64. Cao hơn bồn rửa (58), thấp hơn cái lò (70). Hình vẽ code cũ để 40 px,
  // ở đó nó ngang tầm cái ghế nhựa và đọc ra như một cái thùng xốp dựng đứng.
  [PROP.fridge]: ["prop_fridge", { h: 62 }],
};

// ──────────────────────────────────────────────────────────── người chơi 8 hướng

/** Tám file CÙNG MỘT KHUNG, đáy là mặt đất và tâm ngang là tâm hai bàn chân — nhờ vậy đổi hướng không làm nhân vật nhảy lên hụp xuống hay trượt ngang. */
const DIRS8: readonly Facing8[] = ["s", "se", "e", "ne", "n", "nw", "w", "sw"];

const PLAYER_SRC = (d: Facing8) => `player/p_${d}`;

/** 65 chứ không `BODY_H` = 64: khung cao bằng hướng có BÚI TÓC CAO NHẤT, mà hướng chính diện thấp hơn thế một chút. */
const PLAYER_H = 65;

/**
 * Khoá là `memKey` — cũng chính là tiền tố texture `CustomerActor` dùng, nên sơn đè xong là xong.
 * Mỗi người một THƯ MỤC RIÊNG: chung thư mục rồi phân biệt bằng tiền tố là có ngày đặt trùng tên,
 * mà trùng tên thì ảnh người này lặng lẽ đè lên người kia, không lỗi nào nổ ra.
 *
 * ⚠️ Ba bảng lệch với `content/npcs.ts` ở phần phụ kiện. KHÔNG sửa `npcs.ts` theo ảnh — từ lúc có
 * ảnh thật, `body` chỉ còn dùng để lấy MÀU cho huy hiệu nét mặt.
 *
 * `walk` là tên atlas chu kỳ đi trong `public/art/`, chỉ ai có model 3D đã rig mới có —
 * xem `docs/phu-luc/xuong-render-nhan-vat.md`. Thiếu thì người đó vẫn đứng yên như cũ.
 */
const NPC_PHOTOS: Record<string, { src: (d: Facing8) => string; h: number; walk?: string }> = {
  // Anh Dũng — nón bảo hiểm nửa đầu, áo khoác xanh lá. Bảng `anh-dung-list.png`:
  // bảng DUY NHẤT đủ tám hướng, không hướng nào phải lật ngang. (Bản render đầu,
  // `driver_char_list.png`, có hai ô nghiêng mới xoay ~70° nên `e`/`w` đọc ra thành
  // `se`/`sw`; artist render lại, bảng cũ còn trong `art-raw/` nhưng không dùng.)
  ANH_DUNG: { src: (d) => `npc/anh-dung/${d}`, h: 64 },
  // Bà Bảy — tóc búi bạc, áo tím nhạt, đi chân đất. Bảng `ba-bay-list.png`.
  // Ảnh thiếu kính lão và lưng còng (`npcs.ts` có cả hai): còn tóc búi bạc làm dấu,
  // vẫn đủ tách khỏi người kế bên, nhưng mất hai trong ba tín hiệu tuổi tác.
  // Có chu kỳ đi, render từ `art-raw/model/ba-bay.glb`.
  BA_BAY: { src: (d) => `npc/ba-bay/${d}`, h: 64, walk: "ba-bay" },
  // Anh Bảo — sinh viên, kính tròn gọng đen, cardigan xám. Bảng `anh-bao-list.png`.
  // Ảnh có KÍNH mà không có NÓN KẾT, `npcs.ts` ghi ngược lại. Đổi một dấu lấy một
  // dấu nên vẫn không lẫn với ai; cái kính tròn to là thứ nhận ra nhanh nhất.
  // Có chu kỳ đi, render từ `art-raw/model/anh-bao.glb`.
  ANH_BAO: { src: (d) => `npc/anh-bao/${d}`, h: 65, walk: "anh-bao" },
};

// ──────────────────────────────────────────────────────────────── món trên tay

/**
 * Tỉ lệ đo theo người cao `BODY_H`: ổ bánh 21 px là đúng một phần ba người, nhìn ra ngay là ổ bánh
 * chứ không phải khúc gỗ.
 *
 * ⚠️ `held_loaf_baked` cố ý không có dòng — nó rơi về bản vẽ code. Đừng mượn tạm ảnh ổ nóng:
 * mượn xong là ổ nguội và ổ nóng giống hệt nhau.
 */
const CARRIED: Partial<Record<HeldLook, [src: string, size: Fit]>> = {
  loaf_cold: ["held_loaf_cold", { w: 21 }],
  loaf_hot: ["held_loaf_hot", { w: 21 }],
  loaf_burnt: ["held_loaf_burnt", { w: 21 }],
  loaf_filled: ["held_loaf_filled", { w: 24 }],
  tea: ["held_tea", { h: 19 }],
};

// ──────────────────────────────────────────────────────────────────────── nhân

/** ⚠️ Lưu ý cho lần vẽ tiếp: thịt nguội và chả lụa giờ đều là LÁT TRÒN HỒNG, chỉ khác sắc độ — bản vẽ code cũ cố tình cho thịt nguội hình vuông để nhìn đen trắng vẫn tách được. */
const FILLINGS: Partial<Record<Ingredient, [src: string, fill?: number, inLoaf?: number]>> = {
  pate: ["ing_pate"],
  thit: ["ing_thit"],
  chalua: ["ing_chalua"],
  xiumai: ["ing_xiumai"],
  opla: ["ing_opla"],
  dochua: ["ing_dochua"],
  hanhngo: ["ing_hanhngo"],
  // Trái ớt chiếm gần kín khung ảnh của nó trong khi mấy món khác còn chừa lề, nên cho đầy ô
  // như nhau thì ớt lấn át cả đĩa — nó là GIA VỊ, không phải miếng nhân.
  // Số thứ BA là cỡ lúc NẰM TRONG Ổ: trong khay ớt phải đủ to để bấm trúng, nằm trên ổ bánh thì
  // nó chỉ là vài lát rắc lên.
  ot: ["ing_ot", 0.62, 0.40],
};

/** Ổ bánh rạch đôi của bảng kẹp nhân: nắp lật ra sau + máng đựng nhân. */
const OPEN_LOAF = ["loaf_lid", "loaf_trough"] as const;

// ─────────────────────────────────────────────────────────────────────── tải về

/** ⚠️ Hỏi `textures.exists` là chưa đủ: lúc một lượt tải còn đang bay thì texture chưa có, nên lượt sau xin tải lại và Phaser chửi "Texture key already in use" khi cả hai cùng về. */
const asked = new Set<string>();

export function preloadPhotos(scene: Phaser.Scene) {
  const names = [
    ...FLOORS.flatMap((f) => [0, 1, 2, 3].map((i) => `f_${f}${i}`)),
    ...Object.values(STANDING).map(([src]) => src),
    ...Object.values(CARRIED).map(([src]) => src),
    ...Object.values(FILLINGS).map(([src]) => src),
    ...OPEN_LOAF,
    // Bảng tám hướng RỜI chỉ còn cần cho ai CHƯA có atlas: ai có rồi thì ảnh đứng yên
    // lấy từ chính atlas đó (xem `eightWay`), tải thêm tám file nữa là 1,4 MB tải về
    // rồi không vẽ ra một pixel nào.
    ...Object.values(NPC_PHOTOS).filter((o) => !o.walk).flatMap((o) => DIRS8.map(o.src)),
    FLY,
    BOARD,
    BASKET,
  ] as string[];
  for (const n of names) {
    if (asked.has(n) || scene.textures.exists(SRC + n)) continue;
    asked.add(n);
    scene.load.image(SRC + n, `art/${n}.png`);
  }
  // Chu kỳ đi nằm trong MỘT atlas mỗi người thay vì 64 file rời — xem
  // `docs/phu-luc/xuong-render-nhan-vat.md`. Thiếu file thì `paintWalk()` bỏ qua,
  // người đó quay về ảnh đứng yên chứ không vỡ.
  preloadWalk(scene, "player", true);
  for (const o of Object.values(NPC_PHOTOS)) {
    if (o.walk) preloadWalk(scene, o.walk);
  }
}

/** `hold` chỉ đúng với người chơi: khách không bưng gì nên không có bảng neo tay. */
function preloadWalk(scene: Phaser.Scene, file: string, hold = false) {
  const key = walkAtlas(file);
  if (asked.has(key) || scene.textures.exists(key)) return;
  asked.add(key);
  scene.load.atlas(key, `art/${file}.png`, `art/${file}.json`);
  // Nạp RIÊNG chứ không nhét vào atlas JSON: Phaser nuốt file atlas vào texture manager,
  // moi lại phần phụ chú rất lắt léo. File này chỉ ~2,6 KB.
  if (hold) scene.load.json(HOLD_JSON, `art/${file}_hold.json`);
}

function source(scene: Phaser.Scene, name: string): HTMLImageElement | null {
  const key = SRC + name;
  if (!scene.textures.exists(key)) return null;
  const img = scene.textures.get(key).getSourceImage();
  return img instanceof HTMLImageElement ? img : null;
}

// ────────────────────────────────────────────────────────────────── bút vẽ ảnh

/** Thu một phát từ 384 px xuống 70 px là trình duyệt chỉ lấy mẫu song tuyến tính — mỗi điểm đích đọc 4 điểm nguồn trong khi đáng ra phải gộp ~30, ra ảnh vừa rỗ vừa bệt. */
function shrink(img: HTMLImageElement | HTMLCanvasElement, w: number, h: number): CanvasImageSource {
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

/** `ss` > 1 thì canvas to gấp `ss` lần NHƯNG context được scale sẵn — mọi lệnh vẽ phía sau vẫn viết bằng toạ độ thiết kế. */
/** Khác `standing()` ở chỗ không đệm: vật nằm trên mặt quầy không cần chừa chỗ cho bóng đổ dưới chân. */
function onCounter(scene: Phaser.Scene, key: string, src: string, w: number) {
  const img = source(scene, src);
  if (!img) return;
  const h = (img.height / img.width) * w;
  const made = blank(scene, key, w, h, ART_SS);
  if (!made) return;
  made.ctx.drawImage(shrink(img, w * ART_SS, h * ART_SS), 0, 0, w, h);
  made.tex.refresh();
}

function blank(scene: Phaser.Scene, key: string, w: number, h: number, ss = 1) {
  // Hỏi `exists` trước: `remove()` một key chưa có thì Phaser cảnh báo ra console,
  // mà ba vật chỉ-có-ảnh (Vespa, bảng gỗ, bình chữa cháy) vốn không có bản vẽ code.
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, Math.ceil(w * ss), Math.ceil(h * ss));
  if (!tex) return null;
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (ss !== 1) { ctx.scale(ss, ss); ssOf.set(key, ss); } else ssOf.delete(key);
  return { tex, ctx };
}

/** Mép dưới ảnh là chỗ vật chạm đất (`prep-art.py` cắt sát), nên texture tính ngược từ chiều cao muốn có. */
function standing(scene: Phaser.Scene, key: string, src: string, o: Standing) {
  const img = source(scene, src);
  if (!img) return;
  const h = o.h;
  const w = (img.width / img.height) * h;
  const W = Math.max(TW + 2, Math.ceil(w) + 6);
  const H = Math.ceil(h + BASE + TH / 2 + 1 - (o.dy ?? SIT));
  const made = blank(scene, key, W, H, ART_SS);
  if (!made) return;
  // `shrink` thu dần theo PIXEL THẬT của canvas, nên đích là `w × ART_SS`; còn lệnh
  // `drawImage` vẫn nói bằng toạ độ thiết kế vì context đã được scale sẵn.
  made.ctx.drawImage(shrink(img, w * ART_SS, h * ART_SS),
    Math.round(W / 2 - w / 2 + (o.dx ?? 0)), 0, w, h);
  made.tex.refresh();
}

/**
 * Như `standing()` nhưng nguồn là MỘT Ô trong atlas, không phải một file rời.
 *
 * Phải cắt ô ra canvas riêng trước khi thu nhỏ: `shrink()` thu dần bằng cách vẽ cả
 * tấm ảnh xuống một nửa mỗi vòng, mà atlas thì cả tấm là 64 ô ghép lại — thu thẳng
 * là màu của ô bên cạnh loang sang, viền nhân vật dính một vệt lạ.
 */
function standingFromAtlas(
  scene: Phaser.Scene, key: string, atlas: string, frame: string, o: Standing,
) {
  if (!scene.textures.exists(atlas)) return false;
  const f = scene.textures.getFrame(atlas, frame);
  if (!f) return false;
  const img = scene.textures.get(atlas).getSourceImage();
  if (!(img instanceof HTMLImageElement) && !(img instanceof HTMLCanvasElement)) return false;

  const cut = document.createElement("canvas");
  cut.width = f.cutWidth;
  cut.height = f.cutHeight;
  cut.getContext("2d")!.drawImage(
    img, f.cutX, f.cutY, f.cutWidth, f.cutHeight, 0, 0, f.cutWidth, f.cutHeight);

  const h = o.h;
  const w = (f.cutWidth / f.cutHeight) * h;
  const W = Math.max(TW + 2, Math.ceil(w) + 6);
  const H = Math.ceil(h + BASE + TH / 2 + 1 - (o.dy ?? SIT));
  const made = blank(scene, key, W, H, ART_SS);
  if (!made) return false;
  made.ctx.drawImage(shrink(cut, w * ART_SS, h * ART_SS),
    Math.round(W / 2 - w / 2 + (o.dx ?? 0)), 0, w, h);
  made.tex.refresh();
  return true;
}

type Fit = { w?: number; h?: number };

function boxed(scene: Phaser.Scene, key: string, src: string, size: number, fit: Fit) {
  const img = source(scene, src);
  if (!img) return;
  const k = fit.w ? fit.w / img.width : (fit.h ?? size) / img.height;
  const w = img.width * k, h = img.height * k;
  const made = blank(scene, key, size, size, ART_SS);
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
 * Tám hướng ĐỨNG YÊN, ưu tiên lấy từ chính atlas của chu kỳ đi.
 *
 * ⚠️ Đứng yên và bước đi phải ra từ MỘT nguồn. Bảng xoay của artist (`art-raw/*-list.png`)
 * và model 3D trong `art-raw/model/` là hai bộ đèn khác nhau — với cô Ba còn là hai bản
 * MODEL khác nhau: tạp dề trong bảng artist có dây chéo sau lưng và cái nơ thắt, tạp dề
 * của `chef.glb` thì không có. Trộn hai nguồn thì mỗi lần thả phím nhân vật đổi màu và
 * đổi luôn cái tạp dề, nhìn như nhấp nháy giữa hai người.
 *
 * Ai chưa render tư thế nghỉ (`render-character.py --idle`) thì vẫn rơi về bảng artist
 * như cũ — vẫn lệch, nhưng còn hơn không có ảnh.
 */
function eightWay(
  scene: Phaser.Scene, who: string,
  src: (d: Facing8) => string, h: number, poses: readonly Pose[],
  file?: string,
) {
  if (file && eightWayFromAtlas(scene, who, file, h, poses)) return;
  if (DIRS8.some((d) => !source(scene, src(d)))) return;
  // Ghi sổ TRƯỚC khi sơn, không phải sau: chính `textureFor` dưới đây tra cái sổ đó
  // để ra tên tám hướng. Ghi sau là nó còn đang gộp về ba hướng, và cả tám tấm ảnh
  // đè lên nhau trên đúng ba cái tên.
  markEightWay(who);
  for (const dir of DIRS8) {
    for (const pose of poses) {
      // Chân nhân vật đứng ĐÚNG tâm hình thoi (`dy: 0`), không tụt `SIT` px như đạo
      // cụ: đáy ảnh đây là đế giày, không phải mặt trước của một cái khối.
      standing(scene, textureFor(dir, who, pose).key, src(dir), { h, dy: 0 });
    }
  }
}

/**
 * Tám hướng đứng yên lấy từ ô `idle_<hướng>_00` của atlas. Trả `false` nếu atlas chưa có
 * bộ đó — khi ấy nơi gọi quay về bảng ảnh rời.
 *
 * ⚠️ Ghi sổ tám hướng chỉ khi sơn ĐỦ cả tám, y như `eightWay`: `textureFor` tra cái sổ đó
 * để ra tên, ghi sổ mà thiếu ô là Phaser vẽ ra một ô xanh lá chói.
 */
function eightWayFromAtlas(
  scene: Phaser.Scene, who: string, file: string, h: number, poses: readonly Pose[],
) {
  const atlas = walkAtlas(file);
  if (!scene.textures.exists(atlas)) return false;
  if (DIRS8.some((d) => !scene.textures.getFrame(atlas, `idle_${d}_00`))) return false;
  markEightWay(who);
  for (const dir of DIRS8) {
    for (const pose of poses) {
      // Cùng một tấm cho cả buông tay lẫn bưng đồ, như bản cũ: lúc thật sự bưng thì
      // `Player` ghim vào frame 0 của chu kỳ `carry` chứ không dùng tấm tĩnh này.
      standingFromAtlas(scene, textureFor(dir, who, pose).key, atlas,
                        `idle_${dir}_00`, { h, dy: 0 });
    }
  }
  return true;
}

/** Sơn CẢ tư thế buông tay lẫn tư thế bưng đồ bằng cùng một tấm hình. */
function player(scene: Phaser.Scene) {
  eightWay(scene, "p", PLAYER_SRC, PLAYER_H, ["idle", "carry"], "player");
  paintWalk(scene, "p", "player", PLAYER_H, ["walk", "carry"]);
  readHoldAnchors(scene);
}

/**
 * Bàn chân frame này cách mặt đất bao nhiêu px thiết kế.
 *
 * ĐO từ chính tấm ảnh chứ không dựng lại bằng sine. Dãy đáy chân tám frame đo được là
 * 359·364·361·361·359·366·363·369 — không phải một hình sin sạch, nên mọi công thức đoán
 * đều lệch. Mà bóng chỉ thuyết phục khi nó ăn khớp ĐÚNG với bàn chân trong ảnh.
 *
 * Quét từ đáy lên và dừng ngay hàng đục đầu tiên, nên dù gọi 64 lần vẫn rẻ: bàn chân
 * luôn nằm sát đáy khung.
 */
function footLift(scene: Phaser.Scene, key: string): number {
  const src = scene.textures.get(key).getSourceImage();
  if (!(src instanceof HTMLCanvasElement)) return 0;
  const ctx = src.getContext("2d", { willReadFrequently: true });
  if (!ctx) return 0;
  const ss = artScale(key);
  for (let y = src.height - 1; y >= 0; y--) {
    const row = ctx.getImageData(0, y, src.width, 1).data;
    for (let x = 3; x < row.length; x += 4) {
      if (row[x] > 40) return (src.height - 1 - y) / ss;
    }
  }
  return 0;
}

/** Nhấc chân từng frame, px thiết kế. `Player` đọc để cho bóng co lại đúng lúc người nhổm lên. */
const liftOf = new Map<string, number>();

export function walkLift(key: string) {
  return liftOf.get(key) ?? 0;
}

/**
 * Chu kỳ đi của MỘT nhân vật, nướng từ atlas ra từng texture rời.
 *
 * ⚠️ Chỉ ghi sổ khi sơn ĐỦ 8 hướng × `WALK_FRAMES`. Thiếu dù một ô mà vẫn ghi sổ thì
 * `walkTextureFor` trả về cái tên không có texture, và Phaser vẽ ô xanh lá chói —
 * thà đứng yên còn hơn nhấp nháy một ô xanh giữa người.
 *
 * `who` là tiền tố texture (`p` cho người chơi, `memKey` cho khách), `file` là tên
 * atlas trong `public/art/`. Hai thứ này KHÔNG trùng nhau: tiền tố phải khớp cái mà
 * `CustomerActor` tra, còn tên file thì theo cách đặt tên của `pack-atlas.py`.
 */
function paintWalk(
  scene: Phaser.Scene, who: string, file: string, h: number, gaits: readonly Gait[],
) {
  const atlas = walkAtlas(file);
  if (!scene.textures.exists(atlas)) return;
  const lifts: string[] = [];
  // Mỗi chu kỳ ghi sổ RIÊNG: thiếu bộ bưng thì vẫn còn bộ đi tay không dùng được.
  for (const gait of gaits) {
    let n = 0;
    for (const dir of DIRS8) {
      for (let i = 0; i < WALK_FRAMES; i++) {
        const key = walkKey(who, dir, gait, i);
        const frame = `${gait}_${dir}_${String(i).padStart(2, "0")}`;
        if (!standingFromAtlas(scene, key, atlas, frame, { h, dy: 0 })) break;
        lifts.push(key);
        n++;
      }
    }
    if (n === DIRS8.length * WALK_FRAMES) markGait(who, gait);
  }
  if (!lifts.length) return;
  // Mốc 0 là frame bàn chân XUỐNG THẤP NHẤT của CẢ HAI chu kỳ, không phải đáy khung: khung
  // chung lấy theo hợp của mọi frame mọi hướng nên chỗ nào cũng chừa sẵn một chút lề dưới chân.
  // Chung một mốc cho cả hai chu kỳ thì lúc đổi qua lại bóng không giật nấc.
  const raw = lifts.map((k) => footLift(scene, k));
  const floor = Math.min(...raw);
  lifts.forEach((k, i) => liftOf.set(k, raw[i] - floor));
}

/**
 * Nạp bảng neo bàn tay rồi quy từ TỈ LỆ Ô sang px thiết kế.
 *
 * File ghi theo tỉ lệ chiều cao ô chứ không ghi px, nên đổi `PLAYER_H` hay đổi `--height`
 * lúc gộp atlas đều không phải sinh lại bảng.
 */
function readHoldAnchors(scene: Phaser.Scene) {
  const raw = scene.cache.json.get(HOLD_JSON) as
    Record<string, Record<string, [number, number]>> | undefined;
  const carry = raw?.carry;
  if (!carry) return;
  for (const [k, v] of Object.entries(carry)) {
    holdOf.set(k, { x: v[0] * PLAYER_H, y: v[1] * PLAYER_H });
  }
}

/** Khoá là `<hướng>_<frame 2 chữ số>`, đúng tên ô trong atlas. */
const holdOf = new Map<string, { x: number; y: number }>();

/** Chỗ dán món lúc VỪA ĐI VỪA BƯNG, px thiết kế so với điểm chạm đất. Chưa có thì trả `null`. */
export function holdAnchorAt(facing: string, frame: number) {
  return holdOf.get(`${facing}_${String(frame).padStart(2, "0")}`) ?? null;
}

/** Chỉ tư thế buông tay: khách không bưng gì, nên `character.ts` cũng chỉ nướng từng ấy. */
function npcPhotos(scene: Phaser.Scene) {
  for (const [who, o] of Object.entries(NPC_PHOTOS)) {
    eightWay(scene, who, o.src, o.h, ["idle"], o.walk);
    // Cũng vì không bưng gì: chỉ một chu kỳ `walk`, không có `carry`. Đó là lý do một
    // người khách tốn 1,1 MB trong khi cô Ba tốn 2,6 MB.
    if (o.walk) paintWalk(scene, who, o.walk, o.h, ["walk"]);
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
  const made = blank(scene, FOOD.loaf, FOOD.LOAF_W, FOOD.LOAF_H, ART_SS);
  if (!made) return;

  const w = FOOD.CRUMB_W / 0.84;
  const th = (trough.height / trough.width) * w;
  const lh = (lid.height / lid.width) * w;
  const x = (FOOD.LOAF_W - w) / 2;
  const cy = FOOD.LOAF_H / 2 + FOOD.CRUMB_DY;
  // Nắp thò lên ĐÚNG `LID_PEEK` px phía trên mép máng: MÉP TRÊN của nắp nằm cao
  // hơn mép trên của máng chừng đó, hết. Đừng cộng thêm nửa chiều cao nắp — làm
  // vậy thì phần ló ra phụ thuộc nắp cao bao nhiêu, nên nắp càng cao càng tụt
  // xuống, và với ảnh nắp đủ dày thì nó chui hẳn sau máng rồi tràn khỏi texture.
  made.ctx.drawImage(shrink(lid, w, lh), x, cy - th / 2 - FOOD.LID_PEEK, w, lh);
  made.ctx.drawImage(shrink(trough, w, th), x, cy - th / 2, w, th);
  made.tex.refresh();
}

export function paintFoodPhotos(scene: Phaser.Scene) {
  openLoaf(scene);
  for (const ing of INGREDIENTS) {
    const spec = FILLINGS[ing.id];
    if (!spec) continue;
    const [src, fill = 1, inLoaf = fill] = spec;
    const big = Math.ceil(FOOD.ICON * FOOD.BIG_SCALE);
    boxed(scene, FOOD.icon(ing.id), src, FOOD.ICON, { h: (FOOD.ICON - 2) * fill });
    boxed(scene, FOOD.big(ing.id), src, big, { h: (big - 4) * inLoaf });
  }
}

/**
 * Đè ảnh artist lên bộ texture vừa nướng bằng code.
 * Gọi CUỐI `buildTextures()`, sau khi mọi thứ đã có bản vẽ code làm nền.
 */
export function paintPhotos(scene: Phaser.Scene) {
  floors(scene);
  // Ruồi vào khung VUÔNG: `StallScene` xoay nó theo hướng bay quanh tâm, mà khung chữ
  // nhật thì xoay xong tâm lệch đi, con ruồi quét thành hình bầu dục.
  boxed(scene, FX.fly, FLY, FLY_BOX, { w: FLY_W });
  onCounter(scene, BOARD_TEX, BOARD, BOARD_W);
  onCounter(scene, BASKET_TEX, BASKET, BASKET_W);
  for (const [key, [src, o]] of Object.entries(STANDING)) standing(scene, key, src, o);
  player(scene);
  npcPhotos(scene);
  for (const [hand, [src, fit]] of Object.entries(CARRIED) as [HeldLook, [string, Fit]][]) {
    boxed(scene, HELD.key(hand), src, HELD.W, fit);
  }
  paintFoodPhotos(scene);
}
