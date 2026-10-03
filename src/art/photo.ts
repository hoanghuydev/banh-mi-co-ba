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
import { BODY_H, markEightWay, textureFor, type Pose } from "./character";
import type { Facing8 } from "../world/iso";

/**
 * ART V2 — ẢNH THẬT CỦA ARTIST ĐÈ LÊN HÌNH VẼ BẰNG CODE.
 *
 * `art/index.ts` vẫn nướng đủ bộ texture bằng Graphics như cũ, RỒI file này ghi đè lên đúng
 * những key artist đã có ảnh. Bảng tên texture không đổi nên không file gameplay nào phải sửa,
 * và ảnh nào chưa vẽ thì tự khắc còn nguyên bản vẽ code.
 *
 * PNG nằm ở `public/art/`, do `tools/prep-art.py` rửa ra từ `public/image-raw/`.
 *
 * ⚠️ Luật đặt ảnh vào ô y hệt `canvas.ts`, không ngoại lệ: origin (0.5, 1) tại `footY(sy)`, và
 * ĐIỂM CHẠM ĐẤT ở local y = H − 1 − BASE − TH/2 chứ không phải đáy texture. Nên cỡ texture được
 * TÍNH RA từ chiều cao muốn có (`standing()`), không gõ tay — gõ tay là y như rằng có vật lơ
 * lửng và bóng đổ rơi lệch xuống dưới chân.
 */

const SRC = "photo/";

const FLY = "fly";

/**
 * Thớt gỗ nằm trên mặt quầy. KHÔNG có bản vẽ code đi kèm: ảnh chưa về thì `StallScene` bỏ qua
 * hẳn, mặt quầy gỗ sẵn có vẫn đọc ra là chỗ làm bánh.
 *
 * ⚠️ Ảnh phải chụp ở góc ngẩng 30°, tức MẶT TRÊN rộng gấp đúng đôi bề cao — đó là tỉ lệ mà
 * `world/iso.ts` ép mọi mặt phẳng nằm ngang về. Sai tỉ lệ thì ép méo ở code cũng không cứu được.
 */
export const BOARD_TEX = "cut_board";
const BOARD = "cutting_board";

export const BOARD_W = 28;

/**
 * Rổ bánh mì ở hai đầu quầy. Cùng luật với cái thớt: ảnh chụp góc ngẩng 30°, và
 * `StallScene` đặt nó NẰM trên mặt quầy chứ không đứng trên lưới ô.
 */
export const BASKET_TEX = "bread_basket";
const BASKET = "ro_banh_mi";

export const BASKET_W = 23;

/**
 * SIÊU LẤY MẪU — bao nhiêu pixel texture cho một pixel thiết kế.
 *
 * `standing()` nướng ảnh về đúng chiều cao vật trong thế giới, rồi camera còn phóng
 * `ZOOM × RENDER_SCALE` lần nữa — nên phải nướng dư ra đúng bằng hệ số phóng cuối cùng.
 *
 * 1,4 là `world/camera.ZOOM`, viết thẳng số thay vì import vì `art/` không nên phụ thuộc camera.
 * Trần 3 để texture không phình: diện tích tăng theo BÌNH PHƯƠNG hệ số này.
 */
export const ART_SS = Math.min(3, Math.max(1, RENDER_SCALE * 1.4));

/**
 * Hệ số siêu lấy mẫu của từng texture, để người VẼ biết phải thu nhỏ sprite bao nhiêu.
 *
 * ⚠️ Không suy ra từ cỡ texture được: `art/index.ts` nướng cả một bộ texture bằng Graphics ở tỉ
 * lệ 1:1 và chúng dùng chung bảng tên với ảnh thật.
 */
const ssOf = new Map<string, number>();

export function artScale(key: string) {
  return ssOf.get(key) ?? 1;
}

/**
 * Bề cao ô cắt chân dung, tính theo thân người. 0,55 là đầu + một chút vai: cái cổ rơi
 * vào khoảng 27–43% chiều cao thân tuỳ người (bà Bảy thấp nhất, cô Ba cao nhất), nên
 * cắt rộng hơn mốc cao nhất một nhịp thì ai cũng còn vai, không ai bị cắt ngang cằm.
 */
const FACE_CROP = 0.55;

/**
 * Chân dung VUÔNG quanh cái đầu, trả về data-URL cho thẻ `<img>` của sổ tay.
 *
 * ⚠️ Cắt bằng HÌNH HỌC chứ không giao cho CSS `object-fit: cover`: người vẽ bằng code chừa 16 px
 * trống trên đỉnh đầu, người đã có ảnh thật thì `standing()` cắt sát đỉnh đầu. Cùng luật `cover`
 * trên hai tỉ lệ khung khác nhau ra hai kiểu ảnh khác hẳn.
 *
 * Hai mốc dưới đây đúng cho CẢ HAI loại: chân chạm đất ở `H − 1 − BASE − TH/2`, đỉnh đầu cách
 * chỗ đó đúng một thân người.
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

/**
 * Thu một sprite về đúng cỡ THIẾT KẾ của nó, bù lại phần texture đã nướng dư. `extra` là hệ số
 * phóng của riêng chỗ gọi, nhân vào chứ không thay thế.
 *
 * ⚠️ Phải gọi LẠI sau mỗi `setTexture`: hệ số thuộc về texture chứ không thuộc sprite, mà cùng
 * một sprite có thể đổi qua lại giữa ảnh thật (dư pixel) và hình vẽ code (1:1).
 */
export function fitPhoto<T extends Phaser.GameObjects.Image>(img: T, extra = 1): T {
  img.setScale(extra / artScale(img.texture.key));
  return img;
}

// ─────────────────────────────────────────────────────────────────────── ô sàn

/**
 * Ảnh ô sàn đã được `prep-art.py` cắt sẵn ĐÚNG cỡ texture game (62×38, tâm hình thoi đúng chỗ),
 * nên ở đây chỉ việc nhận nguyên ảnh làm texture.
 *
 * KHÔNG có sàn quán (`shop`): tấm gạch bông hoa văn quá dày, lát kín thì nền rối hơn thứ đứng
 * trên nó — mà sàn quán là phông của khoảnh khắc quan trọng nhất game (T1).
 */
const FLOORS = ["walk", "road"] as const;

// ───────────────────────────────────────────────────────────── đạo cụ đứng trên ô

type Standing = {
  h: number;
  dx?: number;
  dy?: number;
};

/**
 * VÌ SAO ẢNH PHẢI HẠ XUỐNG, KHÔNG ĐỂ ĐÚNG TÂM Ô: đạo cụ vẽ bằng code có đáy là HÌNH THOI trùng
 * khít mặt ô, còn ảnh chụp thì đáy là một ĐƯỜNG THẲNG NGANG. Đặt đường đó đúng tâm hình thoi thì
 * nửa trước của ô lộ ra trống và cái lò trông như treo lơ lửng.
 *
 * Nên mọi ảnh tụt xuống `SIT` px: đáy ảnh rơi vào khoảng hai phần ba về phía đỉnh trước của ô.
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
  // Chậu để DƯỚI ĐẤT thì phải thấp hơn cái ghế nhựa (38): ở 50 px nó cao gần bằng
  // bồn rửa bên cạnh (58) và đọc ra như một cái cây cảnh to đùng chắn mất khúc quầy.
  [PROP.pothos]: ["prop_pothos", { h: 34 }],
  [PROP.bin]: ["prop_bin", { h: 46 }],
  [PROP.sign]: ["prop_sign", { h: 58 }],
  // Bình chữa cháy là khối ĐỨNG, đáy phẳng và hẹp — không có phần bụng phình ra
  // phía trước như cái lò hay cái tủ, nên tụt đủ `SIT` px là nhìn ra lún xuống sàn.
  [PROP.fire]: ["prop_extinguisher", { h: 44, dy: SIT - 5 }],
};

// ──────────────────────────────────────────────────────────── người chơi 8 hướng

/**
 * Tám hướng của một bảng xoay, cắt ra bằng `tools/cut-character.py`. Tên file là tên HƯỚNG TRÊN
 * MÀN HÌNH (`world/iso.Facing8`) nên bảng này chỉ là danh sách.
 *
 * Tám file CÙNG MỘT KHUNG, đáy khung là mặt đất và tâm ngang khung là tâm hai bàn chân — nhờ vậy
 * đổi hướng là đổi đúng tấm hình, nhân vật không nhảy lên hụp xuống hay trượt ngang.
 */
const DIRS8: readonly Facing8[] = ["s", "se", "e", "ne", "n", "nw", "w", "sw"];

const PLAYER_SRC = (d: Facing8) => `player/p_${d}`;

/**
 * Chiều cao khung chung, px thiết kế. 65 chứ không phải `BODY_H` = 64: khung cao bằng hướng có
 * BÚI TÓC CAO NHẤT, mà hướng chính diện thấp hơn thế một chút. `tools/cut-character.py` in sẵn
 * con số này mỗi lần cắt lại.
 */
const PLAYER_H = 65;

/**
 * Khách đã có bảng xoay ảnh thật. Khoá là `memKey` của khách — tức `id` trong `content/npcs.ts`,
 * cũng chính là tiền tố texture mà `CustomerActor` đang dùng, nên sơn đè xong là xong. Ai chưa
 * có ảnh thì KHÔNG có dòng ở đây và vẫn là người vẽ bằng code.
 *
 * Mỗi người một THƯ MỤC RIÊNG trong `public/art/npc/`, file đặt tên bằng đúng tên hướng — chung
 * thư mục rồi phân biệt bằng tiền tố là có ngày đặt trùng tên, mà trùng tên thì ảnh người này
 * lặng lẽ đè lên người kia, không lỗi nào nổ ra.
 *
 * ⚠️ BA BẢNG ĐỀU LỆCH VỚI `content/npcs.ts` ở phần phụ kiện (bà Bảy thiếu kính lão và lưng còng;
 * anh Bảo có kính nhưng thiếu nón kết). KHÔNG sửa `npcs.ts` theo ảnh — bảng dáng người bên đó là
 * dữ liệu CANON §9, và từ lúc có ảnh thật thì `body` của mấy người này chỉ còn dùng để lấy MÀU
 * cho huy hiệu nét mặt. Chỗ cần sửa là bảng xoay, lần artist vẽ tiếp.
 */
const NPC_PHOTOS: Record<string, { src: (d: Facing8) => string; h: number }> = {
  // Anh Dũng — nón bảo hiểm nửa đầu, áo khoác xanh lá. Bảng `anh-dung-list.png`:
  // bảng DUY NHẤT đủ tám hướng, không hướng nào phải lật ngang. (Bản render đầu,
  // `driver_char_list.png`, có hai ô nghiêng mới xoay ~70° nên `e`/`w` đọc ra thành
  // `se`/`sw`; artist render lại, bảng cũ còn trong `art-raw/` nhưng không dùng.)
  ANH_DUNG: { src: (d) => `npc/anh-dung/${d}`, h: 64 },
  // Bà Bảy — tóc búi bạc, áo tím nhạt, đi chân đất. Bảng `ba-bay-list.png`.
  // Ảnh thiếu kính lão và lưng còng (`npcs.ts` có cả hai): còn tóc búi bạc làm dấu,
  // vẫn đủ tách khỏi người kế bên, nhưng mất hai trong ba tín hiệu tuổi tác.
  BA_BAY: { src: (d) => `npc/ba-bay/${d}`, h: 64 },
  // Anh Bảo — sinh viên, kính tròn gọng đen, cardigan xám. Bảng `anh-bao-list.png`.
  // Ảnh có KÍNH mà không có NÓN KẾT, `npcs.ts` ghi ngược lại. Đổi một dấu lấy một
  // dấu nên vẫn không lẫn với ai; cái kính tròn to là thứ nhận ra nhanh nhất.
  ANH_BAO: { src: (d) => `npc/anh-bao/${d}`, h: 65 },
};

// ──────────────────────────────────────────────────────────────── món trên tay

/**
 * Bốn ổ bánh NẰM NGANG (prep-art.py đã xoay theo trục chính) và một ly trà ĐỨNG — đúng bài kiểm
 * tra bóng hình của `held.ts`. `w` là bề ngang muốn có; ly trà đo theo chiều cao nên ghi `h`.
 *
 * Tỉ lệ đo theo người cao `BODY_H` = 64 px: ổ bánh 21 px là đúng một phần ba người, nhìn ra ngay
 * là ổ bánh chứ không phải khúc gỗ. Ổ đã gói nhỉnh hơn (giấy bọc).
 *
 * ⚠️ THIẾU `held_loaf_baked` (ổ đã nướng mà đã nguội) — cố ý không có dòng, nó rơi về bản vẽ
 * code. Đừng mượn tạm ảnh ổ nóng: mượn xong là ổ nguội và ổ nóng giống hệt nhau.
 */
const CARRIED: Partial<Record<HeldLook, [src: string, size: Fit]>> = {
  loaf_cold: ["held_loaf_cold", { w: 21 }],
  loaf_hot: ["held_loaf_hot", { w: 21 }],
  loaf_burnt: ["held_loaf_burnt", { w: 21 }],
  loaf_filled: ["held_loaf_filled", { w: 24 }],
  tea: ["held_tea", { h: 19 }],
};

// ──────────────────────────────────────────────────────────────────────── nhân

/**
 * Tám món artist đã vẽ. `dualeo` và `tuongot` cố ý KHÔNG có trong bảng — chúng rơi về hình vẽ
 * code của `food.ts`.
 *
 * ⚠️ Lưu ý cho lần vẽ tiếp: thịt nguội và chả lụa giờ đều là LÁT TRÒN HỒNG, chỉ khác sắc độ. Bản
 * vẽ code cũ cố tình cho thịt nguội hình vuông bo góc để nhìn đen trắng vẫn tách được hai món.
 */
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

/**
 * Ảnh đã XIN tải rồi — nhớ ở mức module, không phải mức scene, vì cả BootScene lẫn StallScene
 * đều gọi `preloadPhotos` và StallScene thì dựng lại mỗi ngày.
 *
 * ⚠️ Hỏi `textures.exists` là chưa đủ: lúc một lượt tải còn đang bay thì texture chưa có, nên
 * lượt sau xin tải lại và Phaser chửi "Texture key already in use" khi cả hai cùng về.
 */
const asked = new Set<string>();

export function preloadPhotos(scene: Phaser.Scene) {
  const names = [
    ...FLOORS.flatMap((f) => [0, 1, 2, 3].map((i) => `f_${f}${i}`)),
    ...Object.values(STANDING).map(([src]) => src),
    ...Object.values(CARRIED).map(([src]) => src),
    ...Object.values(FILLINGS).map(([src]) => src),
    ...OPEN_LOAF,
    ...DIRS8.map(PLAYER_SRC),
    ...Object.values(NPC_PHOTOS).flatMap((o) => DIRS8.map(o.src)),
    FLY,
    BOARD,
    BASKET,
  ] as string[];
  for (const n of names) {
    if (asked.has(n) || scene.textures.exists(SRC + n)) continue;
    asked.add(n);
    scene.load.image(SRC + n, `art/${n}.png`);
  }
}

function source(scene: Phaser.Scene, name: string): HTMLImageElement | null {
  const key = SRC + name;
  if (!scene.textures.exists(key)) return null;
  const img = scene.textures.get(key).getSourceImage();
  return img instanceof HTMLImageElement ? img : null;
}

// ────────────────────────────────────────────────────────────────── bút vẽ ảnh

/**
 * Thu ảnh về cỡ `w × h` bằng cách CHIA ĐÔI nhiều nhịp rồi mới về cỡ cuối.
 *
 * `drawImage` thu một phát từ 384 px xuống 70 px là trình duyệt chỉ lấy mẫu song tuyến tính: mỗi
 * điểm đích đọc 4 điểm nguồn trong khi đáng ra phải gộp ~30 điểm, ra ảnh vừa rỗ vừa bệt.
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

/**
 * Canvas trắng để vẽ texture lên. `ss` > 1 thì canvas to gấp `ss` lần NHƯNG context được scale
 * sẵn — mọi lệnh vẽ phía sau vẫn viết bằng toạ độ thiết kế, không chỗ nào phải nhân tay.
 */
/**
 * Vật NẰM TRÊN MẶT QUẦY: texture ôm sát ảnh, không đệm thêm gì.
 *
 * Khác `standing()` ở chỗ không chừa lớp `BASE` + nửa ô hình thoi phía dưới — mấy px đó
 * là để vật đứng trên MẶT ĐẤT khớp với lưới ô, mà cái thớt thì nằm trên mặt quầy chứ
 * không nằm trên lưới. Chỗ đặt do `StallScene` lo, theo mốc của chính khúc quầy đó.
 */
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
  const made = blank(scene, key, W, H, ART_SS);
  if (!made) return;
  // `shrink` thu dần theo PIXEL THẬT của canvas, nên đích là `w × ART_SS`; còn lệnh
  // `drawImage` vẫn nói bằng toạ độ thiết kế vì context đã được scale sẵn.
  made.ctx.drawImage(shrink(img, w * ART_SS, h * ART_SS),
    Math.round(W / 2 - w / 2 + (o.dx ?? 0)), 0, w, h);
  made.tex.refresh();
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
 * Sơn ảnh thật lên bộ texture của MỘT nhân vật, tám hướng.
 *
 * Thiếu DÙ CHỈ MỘT hướng thì không sơn gì cả và không ghi tên vào sổ tám hướng:
 * trộn ảnh thật với bản vẽ code giữa chừng là người đổi hình hài mỗi lần quay.
 * Nhờ vậy bảng xoay về được nửa chừng vẫn chạy — cả bộ lặng lẽ ở lại art v1.
 */
function eightWay(
  scene: Phaser.Scene, who: string,
  src: (d: Facing8) => string, h: number, poses: readonly Pose[],
) {
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
 * Người chơi — sơn CẢ tư thế buông tay lẫn tư thế bưng đồ, bằng cùng một tấm hình.
 *
 * Artist chưa render tư thế bưng, mà sơn mỗi tư thế buông tay thì cứ cầm ổ bánh lên
 * là cô hoá lại thành hình vẽ code rồi buông tay ra lại thành người thật — cái nháy
 * đó lộ hơn hẳn chuyện hai tay buông thõng. Món vẫn nằm đúng tầm tay nhờ `holdAnchor`
 * (ngang hông, hơi chếch ra trước), nên nhìn ra là đang xách đồ.
 */
function player(scene: Phaser.Scene) {
  eightWay(scene, "p", PLAYER_SRC, PLAYER_H, ["idle", "carry"]);
}

/**
 * Khách có ảnh thật. Chỉ tư thế buông tay: khách không bưng gì, nên `character.ts`
 * cũng chỉ nướng mỗi `idle` cho họ — nướng thêm `carry` là tám texture nằm không.
 *
 * Sơn ở đây, lúc boot, nên tên `ANH_DUNG_s` có sẵn trước khi `CustomerActor` kịp
 * hỏi — mà chỗ đó chỉ gọi `buildBody` khi CHƯA có tên đó. Người có ảnh thì không
 * ai vẽ lại bằng code nữa, người chưa có ảnh vẫn được vẽ như cũ.
 */
function npcPhotos(scene: Phaser.Scene) {
  for (const [who, o] of Object.entries(NPC_PHOTOS)) {
    eightWay(scene, who, o.src, o.h, ["idle"]);
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
