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
  GAIT_FRAMES, hasEightWay, hasGait, markEightWay, markGait, textureFor, unmarkCharacter, walkKey,
  type Gait, type Pose,
} from "./character";
import { feetSteps, forgetActor } from "./light/actor";
import type { Facing8 } from "../world/iso";
import type { Step } from "./steps";

// Ảnh artist ghi đè lên texture vẽ code cùng key; cỡ texture tính từ chiều cao muốn có vì điểm chạm đất là `H − 1 − BASE − TH/2`, không phải đáy.

const SRC = "photo/";

/** Atlas ba động tác tại chỗ của người chơi; thiếu thì rơi về ảnh đứng yên. */
const WORK_FILE = "player_work";

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

type NpcPhoto = { h: number; walk: string };

/** Khoá là `memKey` = tiền tố texture của `CustomerActor`; `walk` là atlas đứng yên + chu kỳ đi. */
const REGULARS: Record<string, NpcPhoto> = {
  ANH_DUNG: { h: 65, walk: "minh-quan" },
  BA_BAY: { h: 64, walk: "ba-bay" },
  ANH_BAO: { h: 65, walk: "anh-bao" },
  CHU_KIET: { h: 64, walk: "chu-dat" },
  CHU_TU: { h: 64, walk: "chu-quang" },
  CHI_LAN: { h: 63, walk: "ngoc-tram" },
  ONG_HAI: { h: 65, walk: "chu-thinh" },
  BE_SU: { h: 57, walk: "kha-han" },
  CO_MAI: { h: 60, walk: "co-thuy" },
  CHI_HANH: { h: 63, walk: "thu-ha" },
  BA_SAU: { h: 60, walk: "di-lien" },
  THAY_PHUC: { h: 63, walk: "thay-khai" },
};

const WALKINS: Record<string, NpcPhoto> = {
  walkin0: { h: 65, walk: "khach-la" },
  walkin1: { h: 63, walk: "chi-khau-trang" },
  walkin2: { h: 63, walk: "co-xach-gio" },
  walkin3: { h: 58, walk: "ba-cu" },
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

/** Ảnh sàn thành luôn texture sàn nên đi qua loader của Phaser. */
const FLOOR_SRC = FLOORS.flatMap((f) => [0, 1, 2, 3].map((i) => `f_${f}${i}`));

/** Ảnh chỉ dùng để nướng một lần trong `photoSteps`; nướng xong là bỏ. */
const BAKE_ONCE = [
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
  for (const n of [...FLOOR_SRC, ...KEPT]) {
    if (asked.has(n) || scene.textures.exists(SRC + n)) continue;
    asked.add(n);
    scene.load.image(SRC + n, `art/${n}.webp`);
  }
  // File riêng vì Phaser nuốt atlas JSON, moi phụ chú ra rất lắt léo.
  if (!asked.has(HOLD_JSON)) {
    asked.add(HOLD_JSON);
    scene.load.json(HOLD_JSON, `art/player_hold.json`);
  }
}

type Rect = { x: number; y: number; w: number; h: number };

/** Ảnh chỉ để nướng, theo tên file trong `art/`: giải mã ngoài luồng chính và không đưa lên GPU. */
const images = new Map<string, HTMLImageElement>();
/** Atlas thì ô nào cũng chép qua canvas trước khi thu nhỏ, nên giữ dạng `ImageBitmap` cho nhanh. */
const sheets = new Map<string, { img: ImageBitmap; frames: Map<string, Rect> }>();

/** Ảnh vẽ thẳng (không qua canvas) phải là `<img>` như loader của Phaser, vì `ImageBitmap` thu nhỏ ra điểm ảnh hơi khác. */
async function fetchImage(name: string) {
  const img = new Image();
  img.src = `art/${name}.webp`;
  await img.decode();
  images.set(name, img);
}

async function fetchSheet(file: string) {
  const get = (ext: string) => fetch(`art/${file}.${ext}`).then((r) => {
    if (!r.ok) throw new Error(`${r.status} art/${file}.${ext}`);
    return r;
  });
  const [img, json] = await Promise.all([
    get("webp").then((r) => r.blob()).then((b) => createImageBitmap(b)),
    get("json").then((r) => r.json() as Promise<{ frames: Record<string, { frame: Rect }> }>),
  ]);
  return { img, frames: new Map(Object.entries(json.frames).map(([k, v]) => [k, v.frame])) };
}

/** Mỗi phần tử tải một ảnh nguồn cho `photoSteps`/`npcSteps`; lỗi thì bỏ qua như ảnh thiếu. */
export function bakeSourceLoads(): (() => Promise<void>)[] {
  const files = ["player", WORK_FILE, ...Object.values(WALKINS).map((o) => o.walk)];
  return [
    ...BAKE_ONCE.filter((n) => !images.has(n)).map((n) => () => fetchImage(n).catch(() => {})),
    ...files.filter((f) => !sheets.has(f)).map((f) => () => fetchSheet(f).then((v) => { sheets.set(f, v); }, () => {})),
  ];
}

function* paintNpc(scene: Phaser.Scene, who: string, o: NpcPhoto) {
  if (yield* eightWayFromAtlas(scene, who, o.walk, o.h, ["idle"])) yield* paintWalk(scene, who, o.walk, o.h, ["walk"]);
}

/** Sơn một lần, vì sơn lại sẽ xoá texture đang có sprite dùng. */
export function npcSteps(scene: Phaser.Scene): Step[] {
  return [
    ...Object.entries(WALKINS).map(([who, o]) => () => paintNpc(scene, who, o)),
    () => forget(Object.values(WALKINS).map((o) => o.walk)),
  ];
}

const isRegular = (who: string) => who in REGULARS;
export const regularIds = () => Object.keys(REGULARS);

const ready = new Set<string>();
/** Tải hỏng hết lượt thử: hôm đó vẫn ghé, `CustomerActor` vẽ thân bằng code. */
const failed = new Set<string>();

/** Khách lạ và người chơi luôn sẵn; khách quen sẵn khi `bakeRegulars` đã sơn đủ bộ hoặc đã bỏ cuộc. */
export const regularReady = (who: string) => !isRegular(who) || ready.has(who) || failed.has(who);

/** Atlas khách quen, để service worker giữ sẵn cho lúc chơi offline. */
export const regularFiles = () => Object.values(REGULARS).flatMap((o) => [`art/${o.walk}.webp`, `art/${o.walk}.json`]);

const RETRY_MS = [0, 1000, 3000];

/** Tải atlas có thử lại; `alive()` sai lúc tải xong thì trả ảnh luôn, khỏi giữ bộ nhớ. */
async function loadSheet(file: string, alive: () => boolean) {
  for (const wait of RETRY_MS) {
    if (wait) await new Promise((ok) => setTimeout(ok, wait));
    if (!alive()) return;
    try {
      const s = await fetchSheet(file);
      if (alive()) sheets.set(file, s); else s.img.close();
      return;
    } catch (e) {
      console.warn("tải ảnh khách quen lỗi", file, e);
    }
  }
}

/** Mỗi `yield` là một khung, yield ra Promise là chờ tải atlas; tải trước atlas người kế, đo chân và niêm sau từng người. */
export function* bakeRegulars(scene: Phaser.Scene, ids: Iterable<string>, alive: () => boolean): Generator<Promise<void> | undefined> {
  const todo = [...ids].filter((id) => id in REGULARS && !ready.has(id));
  for (const id of todo) failed.delete(id);
  const load = async (id?: string) => {
    const file = id && REGULARS[id].walk;
    if (file && !sheets.has(file)) await loadSheet(file, alive);
  };
  let next = load(todo[0]);
  for (let i = 0; i < todo.length; i++) {
    const o = REGULARS[todo[i]];
    yield next;
    next = load(todo[i + 1]);
    yield* paintNpc(scene, todo[i], o);
    forget([o.walk]);
    yield* feetSteps(scene.textures);
  }
  for (const who of todo) {
    if (hasEightWay(who) && hasGait(who, "walk")) ready.add(who);
    else {
      dropRegular(scene, who);
      if (alive()) failed.add(who);
    }
  }
}

/** Xoá texture, sổ tám hướng/bước đi và bóng đã bake; gọi lúc dở dang cũng được. */
export function dropRegular(scene: Phaser.Scene, who: string) {
  const o = REGULARS[who];
  if (!o) return;
  ready.delete(who);
  forget([o.walk]);
  const keys = DIRS8.flatMap((d) => [
    textureFor(d, who).key,
    ...Array.from({ length: GAIT_FRAMES.walk }, (_, i) => walkKey(who, d, "walk", i)),
  ]);
  unmarkCharacter(who);
  forgetActor(scene.textures, who);
  for (const k of keys) ssOf.delete(k);
  drop(scene, keys);
}

/** `asked` giữ key nên các lượt `preload` sau không tải lại ảnh đã bỏ. */
function drop(scene: Phaser.Scene, keys: string[]) {
  for (const k of keys) if (scene.textures.exists(k)) scene.textures.remove(k);
}

function forget(names: string[]) {
  for (const n of names) {
    images.delete(n);
    sheets.get(n)?.img.close();
    sheets.delete(n);
  }
}

function source(scene: Phaser.Scene, name: string): HTMLImageElement | null {
  const own = images.get(name);
  if (own) return own;
  const key = SRC + name;
  if (!scene.textures.exists(key)) return null;
  const img = scene.textures.get(key).getSourceImage();
  return img instanceof HTMLImageElement ? img : null;
}

/** Thu nhỏ từng nửa một, vì thu một phát thì song tuyến tính bỏ sót điểm nguồn, ảnh rỗ. */
function shrink(img: HTMLImageElement | HTMLCanvasElement, w: number, h: number): HTMLImageElement | HTMLCanvasElement {
  let src = img;
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
    if (src !== img) free(src);
    src = step;
  }
  return src;
}

/** Trả bộ nhớ canvas nháp ngay, không chờ GC (Safari iOS dọn rất trễ). */
function free(c: HTMLImageElement | HTMLCanvasElement) {
  if (c instanceof HTMLCanvasElement) c.width = c.height = 0;
}

/** `shrink` rồi vẽ vào `ctx` ở khung thiết kế `x, y, dw, dh`. */
function drawShrunk(
  ctx: CanvasRenderingContext2D, img: HTMLImageElement | HTMLCanvasElement, w: number, h: number,
  x: number, y: number, dw: number, dh: number,
) {
  const small = shrink(img, w, h);
  ctx.drawImage(small, x, y, dw, dh);
  if (small !== img) free(small);
}

function onCounter(scene: Phaser.Scene, key: string, src: string, w: number) {
  const img = source(scene, src);
  if (!img) return;
  const h = (img.height / img.width) * w;
  const made = blank(scene, key, w, h, ART_SS);
  if (!made) return;
  drawShrunk(made.ctx, img, w * ART_SS, h * ART_SS, 0, 0, w, h);
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

/** Lề trong suốt quanh vùng vẽ, để lọc song tuyến ở mép đọc ra 0 như khung đầy đủ. */
const TRIM_PAD = 2;

/** Như `blank` nhưng texture chỉ phủ vùng sẽ vẽ (x, 0, w, h) cộng lề; frame `setTrim` nên sprite đặt, lật và đo cỡ như khung đầy đủ W × H. */
function trimmedBlank(scene: Phaser.Scene, key: string, W: number, H: number, x: number, w: number, h: number) {
  const fw = Math.ceil(W * ART_SS), fh = Math.ceil(H * ART_SS);
  const x0 = Math.max(0, Math.floor(x * ART_SS) - TRIM_PAD);
  const x1 = Math.min(fw, Math.ceil((x + w) * ART_SS) + TRIM_PAD);
  const y1 = Math.min(fh, Math.ceil(h * ART_SS) + TRIM_PAD);
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, x1 - x0, y1);
  if (!tex) return null;
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.setTransform(ART_SS, 0, 0, ART_SS, -x0, 0);
  if (ART_SS !== 1) ssOf.set(key, ART_SS); else ssOf.delete(key);
  tex.get().setTrim(fw, fh, x0, 0, x1 - x0, y1);
  return { tex, ctx };
}

/** Mép dưới ảnh là chỗ chạm đất (`prep-art.py` cắt sát); `trim` cho khung nhân vật. */
function standing(scene: Phaser.Scene, key: string, src: string, o: Standing, trim = false) {
  const img = source(scene, src);
  if (!img) return;
  const h = o.h;
  const w = (img.width / img.height) * h;
  const W = Math.max(TW + 2, Math.ceil(w + 2 * Math.abs(o.dx ?? 0)) + 6);
  const H = Math.ceil(h + BASE + TH / 2 + 1 - (o.dy ?? SIT));
  const x = Math.round(W / 2 - w / 2 + (o.dx ?? 0));
  const made = trim ? trimmedBlank(scene, key, W, H, x, w, h) : blank(scene, key, W, H, ART_SS);
  if (!made) return;
  // `shrink` tính theo pixel thật, `drawImage` theo toạ độ thiết kế.
  drawShrunk(made.ctx, img, w * ART_SS, h * ART_SS, x, 0, w, h);
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
  if (small !== img) free(small);
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
  drawShrunk(made.ctx, img, w * ART_SS, h * ART_SS, Math.round(W / 2 - w / 2 + dx), -0.8, w, h);

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

/** Khung nhân vật; cắt ô ra canvas riêng trước khi `shrink`, không thì màu ô bên cạnh loang sang. */
function standingFromAtlas(
  scene: Phaser.Scene, key: string, file: string, frame: string, o: Standing,
) {
  const sheet = sheets.get(file);
  const f = sheet?.frames.get(frame);
  if (!sheet || !f) return false;

  const h = o.h;
  const w = (f.w / f.h) * h;
  const W = Math.max(TW + 2, Math.ceil(w + 2 * Math.abs(o.dx ?? 0)) + 6);
  const H = Math.ceil(h + BASE + TH / 2 + 1 - (o.dy ?? SIT));
  const x = Math.round(W / 2 - w / 2 + (o.dx ?? 0));
  const made = trimmedBlank(scene, key, W, H, x, w, h);
  if (!made) return false;
  const cut = document.createElement("canvas");
  cut.width = f.w;
  cut.height = f.h;
  cut.getContext("2d")!.drawImage(sheet.img, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
  drawShrunk(made.ctx, cut, w * ART_SS, h * ART_SS, x, 0, w, h);
  free(cut);
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
  drawShrunk(made.ctx, img, w, h, (size - w) / 2, (size - h) / 2, w, h);
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
  if (img) drawShrunk(ctx, img, w * ART_SS, h * ART_SS, 0, 0, w, h);
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
function* eightWay(
  scene: Phaser.Scene, who: string,
  src: (d: Facing8) => string, h: number, poses: readonly Pose[],
  file?: string,
) {
  if (file && (yield* eightWayFromAtlas(scene, who, file, h, poses))) return;
  if (DIRS8.some((d) => !source(scene, src(d)))) return;
  // Ghi sổ trước khi sơn vì `textureFor` tra sổ này để ra tên tám hướng.
  markEightWay(who);
  for (const dir of DIRS8) {
    for (const pose of poses) {
      standing(scene, textureFor(dir, who, pose).key, src(dir), { h, dy: 0 }, true);
      yield;
    }
  }
}

/** Chỉ ghi sổ khi atlas đủ cả tám ô, thiếu là Phaser vẽ ô xanh lá. */
function* eightWayFromAtlas(
  scene: Phaser.Scene, who: string, file: string, h: number, poses: readonly Pose[],
) {
  const frames = sheets.get(file)?.frames;
  if (!frames || DIRS8.some((d) => !frames.has(`idle_${d}_00`))) return false;
  markEightWay(who);
  for (const dir of DIRS8) {
    for (const pose of poses) {
      standingFromAtlas(scene, textureFor(dir, who, pose).key, file,
                        `idle_${dir}_00`, { h, dy: 0 });
      yield;
    }
  }
  return true;
}

function* player(scene: Phaser.Scene) {
  yield* eightWay(scene, "p", PLAYER_SRC, PLAYER_H, ["idle", "carry"], "player");
  yield* paintWalk(scene, "p", "player", PLAYER_H, ["walk", "carry"]);
  yield* paintWalk(scene, "p", WORK_FILE, PLAYER_H, ["wipe", "wash", "breathe"]);
  readHoldAnchors(scene);
}

/** Chỉ ghi sổ khi đủ 8 hướng × số ô của gait, thiếu một ô là Phaser vẽ ô xanh lá. */
function* paintWalk(
  scene: Phaser.Scene, who: string, file: string, h: number, gaits: readonly Gait[],
) {
  if (!sheets.has(file)) return;
  for (const gait of gaits) {
    let n = 0;
    for (const dir of DIRS8) {
      for (let i = 0; i < GAIT_FRAMES[gait]; i++) {
        const key = walkKey(who, dir, gait, i);
        const frame = `${gait}_${dir}_${String(i).padStart(2, "0")}`;
        if (!standingFromAtlas(scene, key, file, frame, { h, dy: 0 })) break;
        n++;
        yield;
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
  drawShrunk(made.ctx, lid, w, lh, x, cy - th / 2 - FOOD.LID_PEEK, w, lh);
  drawShrunk(made.ctx, trough, w, th, x, cy - th / 2, w, th);
  made.tex.refresh();
}

function* foodPhotos(scene: Phaser.Scene) {
  openLoaf(scene);
  for (const ing of INGREDIENTS) {
    const spec = FILLINGS[ing.id];
    if (!spec) continue;
    const [src, fill = 1, inLoaf = fill] = spec;
    const big = Math.ceil(FOOD.ICON * FOOD.BIG_SCALE);
    yield;
    boxed(scene, FOOD.icon(ing.id), src, FOOD.ICON, { h: (FOOD.ICON - 2) * fill });
    boxed(scene, FOOD.big(ing.id), src, big, { h: (big - 4) * inLoaf });
  }
}

/** Chạy sau các bước vẽ code của `artSteps()`. */
export function photoSteps(scene: Phaser.Scene): Step[] {
  return [
    () => floors(scene),
    // Khung vuông để xoay quanh tâm không lệch.
    () => boxed(scene, FX.fly, FLY, FLY_BOX, { w: FLY_W }),
    () => onCounter(scene, BOARD_TEX, BOARD, BOARD_W),
    () => onCounter(scene, BASKET_TEX, BASKET, BASKET_W),
    ...Object.entries(STANDING).map(([key, [src, o]]) => () => standing(scene, key, src, o)),
    () => bench(scene),
    () => prepFromLong(scene),
    () => player(scene),
    () => {
      for (const [hand, [src, fit]] of Object.entries(CARRIED) as [HeldLook, [string, Fit]][]) {
        boxed(scene, HELD.key(hand), src, HELD.W, fit);
      }
    },
    () => foodPhotos(scene),
    () => {
      drop(scene, FLOOR_SRC.map((n) => SRC + n));
      forget([...BAKE_ONCE, "player", WORK_FILE]);
    },
  ];
}
