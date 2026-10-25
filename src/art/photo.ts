import Phaser from "phaser";
import { TH, TW } from "../world/iso";
import { INGREDIENTS, type Ingredient } from "../sim/order";
import { BASE } from "./canvas";
import { RENDER_SCALE } from "../core/render";
import { TILE } from "./tiles";
import { PROP } from "./props";
import { BUILD } from "./building";
import { HELD, type HeldLook } from "./held";
import { FOOD } from "./food";
import { FX, FLY_W, FLY_BOX } from "./fx";
import {
  GAIT_FRAMES, markEightWay, markGait, textureFor, walkKey,
  type Gait, type Pose,
} from "./character";
import type { Facing8 } from "../world/iso";

// Ảnh artist ghi đè lên texture vẽ code cùng key; cỡ texture tính từ chiều cao muốn có vì điểm chạm đất là `H − 1 − BASE − TH/2`, không phải đáy.

const SRC = "photo/";

/** Atlas ba động tác tại chỗ của người chơi; thiếu thì rơi về ảnh đứng yên. */
const WORK_FILE = "player_work";
const walkAtlas = (file: string) => `${SRC}${file}_walk`;

const HOLD_JSON = SRC + "player_hold";

const FLY = "fly";

/** Ảnh phải chụp góc ngẩng 30° (mặt trên rộng gấp đôi bề cao). */
export const BOARD_TEX = "cut_board";
const BOARD = "cutting_board";

export const BOARD_W = 28;

export const BASKET_TEX = "bread_basket";
const BASKET = "ro_banh_mi";

export const BASKET_W = 23;


/** Pixel texture trên một pixel thiết kế; trần 3 vì diện tích tăng theo bình phương. */
export const ART_SS = Math.min(weakDevice() ? 2 : 3, Math.max(1, RENDER_SCALE * 1.4));

/** Màn mật độ cao hoặc ít RAM thì texture nướng dư pixel dễ hết bộ nhớ. */
function weakDevice() {
  if (typeof window === "undefined") return false;
  const mem = (navigator as { deviceMemory?: number }).deviceMemory;
  return (window.devicePixelRatio || 1) >= 3 || (mem !== undefined && mem <= 4);
}

/** Không suy từ cỡ texture được vì texture vẽ code (1:1) dùng chung key với ảnh thật. */
const ssOf = new Map<string, number>();

export function artScale(key: string) {
  return ssOf.get(key) ?? 1;
}

/** Gọi lại sau mỗi `setTexture` vì hệ số thuộc texture, không thuộc sprite. */
export function fitPhoto<T extends Phaser.GameObjects.Image>(img: T, extra = 1): T {
  img.setScale(extra / artScale(img.texture.key));
  return img;
}

const FLOORS = ["shop", "walk", "road"] as const;

/** Mật độ px/px thiết kế của ô sàn nướng sẵn; `prep-art.py` `FLOOR_SS`. */
const HD_FLOORS: Partial<Record<(typeof FLOORS)[number], number>> = { shop: 4, walk: 4, road: 4 };

/** Ảnh bóng tán lá xám, key texture là `photo/leaf_a`, `photo/leaf_b`, `photo/leaf_c`. */
export const LEAF_A_KEY = SRC + "leaf_a";
export const LEAF_C_KEY = SRC + "leaf_c";
export const LEAF_B_KEY = SRC + "leaf_b";
export const LEAF_EAVE_KEY = SRC + "leaf_eave";
export const LEAF_WALL_A_KEY = SRC + "leaf_wall_a";
export const LEAF_WALL_B_KEY = SRC + "leaf_wall_b";

type Standing = {
  h: number;
  dx?: number;
  dy?: number;
};

/** Ảnh chụp đáy thẳng nên tụt xuống chừng này px, không thì vật trông lơ lửng trên ô thoi. */
const SIT = 10;

/** Bàn nguyên ô vuông tới mép ô nên hạ thêm chừng này px để chân bàn chạm mặt sàn; thứ đặt lên mặt bàn phải trừ lại. */
export const TABLE_DROP = 6;
export const SUNK = new Set<string>([PROP.prep, PROP.benchNear]);

/** Ảnh khối tường kín cả khung texture `heightFor(WALL_H)` = 118, đáy ảnh là đáy cạnh đứng trước. */
const WALL_PHOTO: Standing = { h: 118, dy: 22 };

/** `h` tính theo người cao `BODY_H` = 64. */
const STANDING: Record<string, [src: string, o: Standing]> = {
  [PROP.oven]: ["prop_oven", { h: 66 }],
  // Cao hơn lò than 2 px mà vẫn hẹp hơn một ô (72 × 0,828 = 60 ≈ TW).
  [PROP.ovenE]: ["prop_e-oven", { h: 72 }],
  [PROP.shelf]: ["prop_shelf", { h: 78, dy: SIT + 4 }],
  [PROP.tea]: ["prop_tea", { h: 68 }],
  [PROP.sink]: ["prop_sink", { h: 58, dx: -2 }],
  [PROP.stool]: ["prop_stool", { h: 38 }],
  [PROP.table]: ["prop_table", { h: 56 }],
  [PROP.order]: ["prop_order", { h: 50, dy: SIT + TABLE_DROP }],
  // Bàn 2 × 1 ô: `dx` đưa đỉnh dưới của ảnh (0,682 chiều ngang) về tâm khung.
  [PROP.tableLong]: ["prop_table_long", { h: 74, dx: -17, dy: SIT + TABLE_DROP }],
  // Xe nằm dọc trục y dài hơn 2 ô; lùi 0,2 ô về −y cho gọn trong ô xe và ô đầu xe `m`.
  [PROP.bike]: ["prop_bike", { h: 82, dx: 6, dy: SIT - 3 }],
  [PROP.scooter]: ["prop_scooter", { h: 78, dx: 6, dy: SIT - 3 }],
  [PROP.pothos]: ["prop_pothos", { h: 34 }],
  [PROP.bin]: ["prop_bin", { h: 46 }],
  [PROP.sign]: ["prop_sign", { h: 58 }],
  // Đáy phẳng hẹp, tụt đủ `SIT` là trông lún xuống sàn.
  [PROP.fire]: ["prop_extinguisher", { h: 44, dy: SIT - 5 }],
  [PROP.umbrella]: ["prop_umbrella", { h: 100 }],
  [PROP.fridge]: ["prop_fridge", { h: 57 }],
  [PROP.cooler]: ["prop_cooler", { h: 29 }],
  [PROP.crate]: ["prop_crate", { h: 44, dy: SIT + 5 }],
  [BUILD.wall(0)]: ["prop_wall_plain", WALL_PHOTO],
  [BUILD.wall(1)]: ["prop_wall_meter", WALL_PHOTO],
  [BUILD.wall(2)]: ["prop_wall_window", WALL_PHOTO],
  [BUILD.wall(3)]: ["prop_wall_rent", WALL_PHOTO],
  [BUILD.wall(4)]: ["prop_wall_sale", WALL_PHOTO],
  [BUILD.wall(5)]: ["prop_wall_notice", WALL_PHOTO],
  [BUILD.door]: ["prop_door", WALL_PHOTO],
  [BUILD.neighbour(0)]: ["prop_shop_shutter_half", WALL_PHOTO],
  [BUILD.neighbour(1)]: ["prop_shop_window_clothes", WALL_PHOTO],
  [BUILD.neighbour(2)]: ["prop_shop_shutter_closed", WALL_PHOTO],
  [BUILD.neighbour(3)]: ["prop_shop_window_ac", WALL_PHOTO],
};

/** Bàn 1 × 2 ô; `foot` là vị trí ngang của đỉnh dưới trong ảnh (0–1), `body` là bề cao thân bàn theo px thiết kế. */
const BENCH = { src: "prop_bench", h: 74, foot: 0.292, body: 28 };

/** Tám file cùng khung, đáy là mặt đất, tâm ngang là tâm hai bàn chân. */
const DIRS8: readonly Facing8[] = ["s", "se", "e", "ne", "n", "nw", "w", "sw"];

const PLAYER_SRC = (d: Facing8) => `player/p_${d}`;

/** Khung cao theo hướng có búi tóc cao nhất. */
const PLAYER_H = 65;

/** Khoá là `memKey` = tiền tố texture của `CustomerActor`; `walk` là atlas chu kỳ đi, thiếu thì đứng yên. */
const NPC_PHOTOS: Record<string, { src: (d: Facing8) => string; h: number; walk?: string }> = {
  ANH_DUNG: { src: (d) => `npc/anh-dung/${d}`, h: 65, walk: "minh-quan" },
  BA_BAY: { src: (d) => `npc/ba-bay/${d}`, h: 64, walk: "ba-bay" },
  ANH_BAO: { src: (d) => `npc/anh-bao/${d}`, h: 65, walk: "anh-bao" },
  CHU_KIET: { src: (d) => `npc/chu-dat/${d}`, h: 64, walk: "chu-dat" },
  CHU_TU: { src: (d) => `npc/chu-quang/${d}`, h: 64, walk: "chu-quang" },
  CHI_LAN: { src: (d) => `npc/ngoc-tram/${d}`, h: 63, walk: "ngoc-tram" },
  ONG_HAI: { src: (d) => `npc/chu-thinh/${d}`, h: 65, walk: "chu-thinh" },
  BE_SU: { src: (d) => `npc/kha-han/${d}`, h: 57, walk: "kha-han" },
  CO_MAI: { src: (d) => `npc/co-thuy/${d}`, h: 60, walk: "co-thuy" },
};

const CARRIED: Partial<Record<HeldLook, [src: string, size: Fit]>> = {
  loaf_cold: ["held_loaf_cold", { w: 21 }],
  loaf_soft: ["held_loaf_soft", { w: 21 }],
  loaf_baked: ["held_loaf_baked", { w: 21 }],
  loaf_hot: ["held_loaf_hot", { w: 21 }],
  loaf_burnt: ["held_loaf_burnt", { w: 21 }],
  loaf_filled: ["held_loaf_filled", { w: 24 }],
  tea: ["held_tea", { h: 19 }],
};

const FILLINGS: Partial<Record<Ingredient, [src: string, fill?: number, inLoaf?: number]>> = {
  pate: ["ing_pate"],
  thit: ["ing_thit"],
  chalua: ["ing_chalua"],
  xiumai: ["ing_xiumai"],
  opla: ["ing_opla"],
  dochua: ["ing_dochua"],
  dualeo: ["ing_dualeo"],
  hanhngo: ["ing_hanhngo"],
  // Ảnh ớt kín khung nên thu nhỏ; số thứ ba là cỡ lúc nằm trong ổ.
  ot: ["ing_ot", 0.62, 0.40],
  tuongot: ["ing_tuongot"],
};

const OPEN_LOAF = ["loaf_lid", "loaf_trough"] as const;

/** `textures.exists` chưa đủ: lượt tải đang bay mà xin lại là Phaser báo trùng key. */
const asked = new Set<string>();

/** Ảnh chỉ dùng để nướng một lần trong `paintPhotos`; nướng xong là bỏ. */
const BAKE_ONCE = [
  ...FLOORS.flatMap((f) => [0, 1, 2, 3].map((i) => `f_${f}${i}`)),
  ...Object.values(STANDING).map(([src]) => src),
  BENCH.src,
  ...Object.values(CARRIED).map(([src]) => src),
  ...Object.values(FILLINGS).map(([src]) => src),
  ...OPEN_LOAF,
  FLY,
  BOARD,
  BASKET,
];

/** Vẽ lại mỗi lần dựng quán nên giữ suốt phiên. */
const KEPT = ["shopfront", "menu_khung", "leaf_a", "leaf_c", "leaf_b", "leaf_eave", "leaf_wall_a", "leaf_wall_b"];

export function preloadPhotos(scene: Phaser.Scene) {
  for (const n of [...BAKE_ONCE, ...KEPT]) {
    if (asked.has(n) || scene.textures.exists(SRC + n)) continue;
    asked.add(n);
    scene.load.image(SRC + n, `art/${n}.webp`);
  }
  preloadWalk(scene, "player", true);
  preloadWalk(scene, WORK_FILE);
}

/** Ai có atlas thì ảnh đứng yên lấy từ atlas, khỏi tải tám file rời. */
type NpcAsset = { walk: string } | { image: string };

function npcAssets(): NpcAsset[] {
  return Object.values(NPC_PHOTOS).flatMap((o): NpcAsset[] => (o.walk
    ? [{ walk: o.walk }]
    : DIRS8.map((d) => ({ image: o.src(d) }))));
}

/** Ảnh NPC không chặn lúc khởi động; ai gọi lúc cần ngay thì dùng cùng hàm này. */
export function preloadNpcPhotos(scene: Phaser.Scene) {
  for (const a of npcAssets()) {
    if ("walk" in a) preloadWalk(scene, a.walk);
    else if (!asked.has(a.image) && !scene.textures.exists(SRC + a.image)) {
      asked.add(a.image);
      scene.load.image(SRC + a.image, `art/${a.image}.webp`);
    }
  }
}

function npcLoaded(scene: Phaser.Scene) {
  return npcAssets().every((a) => scene.textures.exists("walk" in a ? walkAtlas(a.walk) : SRC + a.image));
}

let npcPainted = false;

/** Gọi sau khi ảnh NPC đã tải; sơn một lần, vì sơn lại sẽ xoá texture đang có sprite dùng. */
export function paintNpcPhotos(scene: Phaser.Scene) {
  if (npcPainted || !npcLoaded(scene)) return;
  npcPainted = true;
  npcPhotos(scene);
  drop(scene, npcAssets().map((a) => ("walk" in a ? walkAtlas(a.walk) : SRC + a.image)));
}

/** `asked` giữ key nên các lượt `preload` sau không tải lại ảnh đã bỏ. */
function drop(scene: Phaser.Scene, keys: string[]) {
  for (const k of keys) if (scene.textures.exists(k)) scene.textures.remove(k);
}

/** Tải nền ngay sau khi vào menu; scene tắt giữa chừng thì loader bỏ dở nên phải quên các key đã xin. */
export function warmNpcPhotos(scene: Phaser.Scene) {
  if (npcPainted) return;
  preloadNpcPhotos(scene);
  scene.load.once(Phaser.Loader.Events.COMPLETE, () => paintNpcPhotos(scene));
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    if (npcPainted) return;
    for (const a of npcAssets()) {
      if ("walk" in a) { if (!scene.textures.exists(walkAtlas(a.walk))) asked.delete(walkAtlas(a.walk)); }
      else if (!scene.textures.exists(SRC + a.image)) asked.delete(a.image);
    }
  });
  if (!scene.load.isLoading()) scene.load.start();
}

function preloadWalk(scene: Phaser.Scene, file: string, hold = false) {
  const key = walkAtlas(file);
  if (asked.has(key) || scene.textures.exists(key)) return;
  asked.add(key);
  scene.load.atlas(key, `art/${file}.webp`, `art/${file}.json`);
  // File riêng vì Phaser nuốt atlas JSON, moi phụ chú ra rất lắt léo.
  if (hold) scene.load.json(HOLD_JSON, `art/${file}_hold.json`);
}

function source(scene: Phaser.Scene, name: string): HTMLImageElement | null {
  const key = SRC + name;
  if (!scene.textures.exists(key)) return null;
  const img = scene.textures.get(key).getSourceImage();
  return img instanceof HTMLImageElement ? img : null;
}

/** Thu nhỏ từng nửa một, vì thu một phát thì song tuyến tính bỏ sót điểm nguồn, ảnh rỗ. */
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

function onCounter(scene: Phaser.Scene, key: string, src: string, w: number) {
  const img = source(scene, src);
  if (!img) return;
  const h = (img.height / img.width) * w;
  const made = blank(scene, key, w, h, ART_SS);
  if (!made) return;
  made.ctx.drawImage(shrink(img, w * ART_SS, h * ART_SS), 0, 0, w, h);
  made.tex.refresh();
}

/** `ss` > 1 thì canvas to gấp `ss` nhưng context scale sẵn, lệnh vẽ vẫn dùng toạ độ thiết kế. */
function blank(scene: Phaser.Scene, key: string, w: number, h: number, ss = 1) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, Math.ceil(w * ss), Math.ceil(h * ss));
  if (!tex) return null;
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (ss !== 1) { ctx.scale(ss, ss); ssOf.set(key, ss); } else ssOf.delete(key);
  return { tex, ctx };
}

/** Mép dưới ảnh là chỗ chạm đất (`prep-art.py` cắt sát). */
function standing(scene: Phaser.Scene, key: string, src: string, o: Standing) {
  const img = source(scene, src);
  if (!img) return;
  const h = o.h;
  const w = (img.width / img.height) * h;
  const W = Math.max(TW + 2, Math.ceil(w + 2 * Math.abs(o.dx ?? 0)) + 6);
  const H = Math.ceil(h + BASE + TH / 2 + 1 - (o.dy ?? SIT));
  const made = blank(scene, key, W, H, ART_SS);
  if (!made) return;
  // `shrink` tính theo pixel thật, `drawImage` theo toạ độ thiết kế.
  made.ctx.drawImage(shrink(img, w * ART_SS, h * ART_SS),
    Math.round(W / 2 - w / 2 + (o.dx ?? 0)), 0, w, h);
  made.tex.refresh();
}

/** Một ảnh bàn dài cắt làm hai texture cùng khung; vẽ chồng lên nhau tại cùng chỗ thì liền như ảnh gốc. */
function bench(scene: Phaser.Scene) {
  const img = source(scene, BENCH.src);
  if (!img) return;
  const { h, foot, body } = BENCH;
  const w = (img.width / img.height) * h;
  const W = Math.ceil(2 * Math.max(foot, 1 - foot) * w) + 6;
  const H = Math.ceil(h + BASE + TH / 2 + 1 - SIT - TABLE_DROP);
  const cx = W / 2;
  const left = cx - foot * w;
  const small = shrink(img, w * ART_SS, h * ART_SS);
  // Ranh giới hai ô: cạnh dốc 1/2 qua giữa mặt trên, rồi thẳng đứng xuống mặt dài bên phải.
  const q0 = h - body - TH;
  const cut = (shift: number): [number, number][] => [
    [cx - 120, q0 - 60 - shift], [cx + TW / 2 + shift, q0 + TH / 2 - shift],
    [cx + TW / 2 + shift, 2000], [cx - 120, 2000],
  ];
  for (const [key, near] of [[PROP.benchNear, true], [PROP.benchFar, false]] as const) {
    const made = blank(scene, key, W, H, ART_SS);
    if (!made) continue;
    // Nửa gần lấn sang nửa xa 1,5 px để mép cắt khử răng cưa không hở.
    const poly = cut(near ? 1.5 : 0);
    made.ctx.save();
    made.ctx.beginPath();
    if (near) {
      poly.forEach(([x, y], i) => (i ? made.ctx.lineTo(x, y) : made.ctx.moveTo(x, y)));
    } else {
      made.ctx.rect(-50, -50, W + 100, 2100);
      poly.forEach(([x, y], i) => (i ? made.ctx.lineTo(x, y) : made.ctx.moveTo(x, y)));
    }
    made.ctx.closePath();
    made.ctx.clip(near ? "nonzero" : "evenodd");
    made.ctx.drawImage(small, Math.round(left), 0, w, h);
    made.ctx.restore();
    made.tex.refresh();
  }
}

/** Bàn để bánh là lát một ô cắt từ ảnh bàn 2 × 1 (mặt phẳng x = 5), nên cùng màu và mép với bàn kề, chỗ nối liền. */
function prepFromLong(scene: Phaser.Scene) {
  const img = source(scene, "prop_table_long");
  if (!img) return;
  const { h, dx = 0, dy = SIT } = STANDING[PROP.tableLong][1];
  const w = (img.width / img.height) * h;
  const W = 90;
  const H = Math.ceil(h + BASE + TH / 2 + 1 - dy);
  const made = blank(scene, PROP.prep, W, H, ART_SS);
  if (!made) return;
  const cx = W / 2;
  // Mép trái-trước của mặt trên lát nằm ở (cx − TW/2, TH), dốc 1/2 lên phải; lùi `over` ô để phủ mép vát đầu bàn dài.
  const over = 0.3;
  const left = cx - (1 + over) * (TW / 2) - 0.5, top = TH - over * (TH / 2) - 0.5;
  made.ctx.save();
  made.ctx.beginPath();
  made.ctx.moveTo(left, 2000);
  made.ctx.lineTo(left, top);
  made.ctx.lineTo(left + 4000, top - 2000);
  made.ctx.lineTo(left + 4000, 2000);
  made.ctx.closePath();
  made.ctx.clip();
  made.ctx.drawImage(shrink(img, w * ART_SS, h * ART_SS), Math.round(W / 2 - w / 2 + dx), -0.8, w, h);

  // Mặt bàn dài sáng dần về đầu phải; làm sáng mặt trên lát giảm dần về 0 để màu nối tiếp liên tục.
  const zt = h - 3 * (TH / 2);
  const pt = (x: number, y: number) => ({
    x: cx + (x - 7) * (TW / 2) - (y - 6) * (TW / 2),
    y: h + (x - 7) * (TH / 2) + (y - 6) * (TH / 2) - zt,
  });
  made.ctx.beginPath();
  [pt(6 - over - 0.05, 6.05), pt(7.05, 6.05), pt(7.05, 4.95), pt(6 - over - 0.05, 4.95)]
    .forEach((p, i) => (i ? made.ctx.lineTo(p.x, p.y) : made.ctx.moveTo(p.x, p.y)));
  made.ctx.closePath();
  made.ctx.clip();
  const a = pt(6 - over, 5.5);
  const k = 1 + over;
  const lift = made.ctx.createLinearGradient(a.x, a.y, a.x + 12 * k, a.y + 24 * k);
  lift.addColorStop(0, "rgba(125,178,165,0.3)");
  lift.addColorStop(1, "rgba(125,178,165,0)");
  made.ctx.globalCompositeOperation = "source-atop";
  made.ctx.fillStyle = lift;
  made.ctx.fillRect(0, 0, W, H);
  made.ctx.restore();
  made.tex.refresh();
}

/** Cắt ô ra canvas riêng trước khi `shrink`, không thì màu ô bên cạnh loang sang. */
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
  const W = Math.max(TW + 2, Math.ceil(w + 2 * Math.abs(o.dx ?? 0)) + 6);
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

/** Vẽ vào mặt vách: mọi lệnh `draw` dùng toạ độ phẳng w × h, canvas vuốt theo `slope` nên chữ và ảnh cùng một mặt phẳng. */
export function bakeWall(
  scene: Phaser.Scene, key: string, w: number, h: number, slope: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
) {
  const made = blank(scene, key, w, h + w * slope, ART_SS);
  if (!made) return null;
  made.ctx.setTransform(ART_SS, ART_SS * slope, 0, ART_SS, 0, 0);
  draw(made.ctx);
  made.tex.refresh();
  return key;
}

/** Tỉ lệ cao/rộng của ảnh đã nạp, `null` nếu chưa có. */
export function photoRatio(scene: Phaser.Scene, name: string) {
  const img = source(scene, name);
  return img ? img.height / img.width : null;
}

export function drawPhoto(ctx: CanvasRenderingContext2D, scene: Phaser.Scene, name: string, w: number, h: number) {
  const img = source(scene, name);
  if (img) ctx.drawImage(shrink(img, w * ART_SS, h * ART_SS), 0, 0, w, h);
}

/** Vẽ ảnh khung co giãn 9 mảnh: mảnh góc `slice` px ảnh nguồn thành `border` px thiết kế. */
export function drawFrame(
  ctx: CanvasRenderingContext2D, scene: Phaser.Scene, name: string,
  w: number, h: number, slice: number, border: number,
) {
  const img = source(scene, name);
  if (!img) return;
  ctx.imageSmoothingQuality = "high";
  const sx = [0, slice, img.width - slice, img.width];
  const sy = [0, slice, img.height - slice, img.height];
  const dx = [0, border, w - border, w];
  const dy = [0, border, h - border, h];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      ctx.drawImage(img, sx[c], sy[r], sx[c + 1] - sx[c], sy[r + 1] - sy[r], dx[c], dy[r], dx[c + 1] - dx[c], dy[r + 1] - dy[r]);
    }
  }
}

function floors(scene: Phaser.Scene) {
  for (const kind of FLOORS) {
    for (let i = 0; i < TILE.VARIANTS; i++) {
      const img = source(scene, `f_${kind}${i}`);
      if (!img) continue;
      // Nhận nguyên ảnh, vẽ lại qua canvas là nội suy thêm và lộ đường ráp.
      const key = TILE.floor(kind, i);
      if (scene.textures.exists(key)) scene.textures.remove(key);
      scene.textures.addImage(key, img);
      const ss = HD_FLOORS[kind];
      if (ss) ssOf.set(key, ss); else ssOf.delete(key);
    }
  }
}

/** Ưu tiên atlas để đứng yên và bước đi cùng một nguồn, trộn với bảng artist là nhân vật nhấp nháy. */
function eightWay(
  scene: Phaser.Scene, who: string,
  src: (d: Facing8) => string, h: number, poses: readonly Pose[],
  file?: string,
) {
  if (file && eightWayFromAtlas(scene, who, file, h, poses)) return;
  if (DIRS8.some((d) => !source(scene, src(d)))) return;
  // Ghi sổ trước khi sơn vì `textureFor` tra sổ này để ra tên tám hướng.
  markEightWay(who);
  for (const dir of DIRS8) {
    for (const pose of poses) {
      standing(scene, textureFor(dir, who, pose).key, src(dir), { h, dy: 0 });
    }
  }
}

/** Chỉ ghi sổ khi atlas đủ cả tám ô, thiếu là Phaser vẽ ô xanh lá. */
function eightWayFromAtlas(
  scene: Phaser.Scene, who: string, file: string, h: number, poses: readonly Pose[],
) {
  const atlas = walkAtlas(file);
  if (!scene.textures.exists(atlas)) return false;
  if (DIRS8.some((d) => !scene.textures.getFrame(atlas, `idle_${d}_00`))) return false;
  markEightWay(who);
  for (const dir of DIRS8) {
    for (const pose of poses) {
      standingFromAtlas(scene, textureFor(dir, who, pose).key, atlas,
                        `idle_${dir}_00`, { h, dy: 0 });
    }
  }
  return true;
}

function player(scene: Phaser.Scene) {
  eightWay(scene, "p", PLAYER_SRC, PLAYER_H, ["idle", "carry"], "player");
  paintWalk(scene, "p", "player", PLAYER_H, ["walk", "carry"]);
  paintWalk(scene, "p", WORK_FILE, PLAYER_H, ["wipe", "wash", "breathe"]);
  readHoldAnchors(scene);
}

/** Chỉ ghi sổ khi đủ 8 hướng × số ô của gait, thiếu một ô là Phaser vẽ ô xanh lá. */
function paintWalk(
  scene: Phaser.Scene, who: string, file: string, h: number, gaits: readonly Gait[],
) {
  const atlas = walkAtlas(file);
  if (!scene.textures.exists(atlas)) return;
  for (const gait of gaits) {
    let n = 0;
    for (const dir of DIRS8) {
      for (let i = 0; i < GAIT_FRAMES[gait]; i++) {
        const key = walkKey(who, dir, gait, i);
        const frame = `${gait}_${dir}_${String(i).padStart(2, "0")}`;
        if (!standingFromAtlas(scene, key, atlas, frame, { h, dy: 0 })) break;
        n++;
      }
    }
    if (n === DIRS8.length * GAIT_FRAMES[gait]) markGait(who, gait);
  }
}

/** File ghi theo tỉ lệ chiều cao ô, quy ra px thiết kế ở đây. */
function readHoldAnchors(scene: Phaser.Scene) {
  const raw = scene.cache.json.get(HOLD_JSON) as
    Record<string, Record<string, [number, number]>> | undefined;
  const carry = raw?.carry;
  if (!carry) return;
  for (const [k, v] of Object.entries(carry)) {
    holdOf.set(k, { x: v[0] * PLAYER_H, y: v[1] * PLAYER_H });
  }
}

const holdOf = new Map<string, { x: number; y: number }>();

/** Px thiết kế so với điểm chạm đất. */
export function holdAnchorAt(facing: string, frame: number) {
  return holdOf.get(`${facing}_${String(frame).padStart(2, "0")}`) ?? null;
}

function npcPhotos(scene: Phaser.Scene) {
  for (const [who, o] of Object.entries(NPC_PHOTOS)) {
    eightWay(scene, who, o.src, o.h, ["idle"], o.walk);
    if (o.walk) paintWalk(scene, who, o.walk, o.h, ["walk"]);
  }
}

/** Nắp vẽ trước, máng đè lên để nắp chỉ ló phần lưng ra sau. */
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
  // Mép trên nắp cao hơn mép trên máng đúng `LID_PEEK`, không phụ thuộc chiều cao nắp.
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

/** Gọi cuối `buildTextures()`. */
export function paintPhotos(scene: Phaser.Scene) {
  floors(scene);
  // Khung vuông để xoay quanh tâm không lệch.
  boxed(scene, FX.fly, FLY, FLY_BOX, { w: FLY_W });
  onCounter(scene, BOARD_TEX, BOARD, BOARD_W);
  onCounter(scene, BASKET_TEX, BASKET, BASKET_W);
  for (const [key, [src, o]] of Object.entries(STANDING)) standing(scene, key, src, o);
  bench(scene);
  prepFromLong(scene);
  player(scene);
  for (const [hand, [src, fit]] of Object.entries(CARRIED) as [HeldLook, [string, Fit]][]) {
    boxed(scene, HELD.key(hand), src, HELD.W, fit);
  }
  paintFoodPhotos(scene);
  drop(scene, [...BAKE_ONCE.map((n) => SRC + n), walkAtlas("player"), walkAtlas(WORK_FILE)]);
}
