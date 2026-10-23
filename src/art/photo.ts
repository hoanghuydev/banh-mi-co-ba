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
  WALK_FRAMES, markEightWay, markGait, textureFor, walkKey,
  type Gait, type Pose,
} from "./character";
import type { Facing8 } from "../world/iso";

// Ảnh artist ghi đè lên texture vẽ code cùng key; cỡ texture tính từ chiều cao muốn có vì điểm chạm đất là `H − 1 − BASE − TH/2`, không phải đáy.

const SRC = "photo/";

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
export const ART_SS = Math.min(3, Math.max(1, RENDER_SCALE * 1.4));

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

/** Không có sàn quán: gạch bông lát kín làm nền rối. */
const FLOORS = ["walk", "road"] as const;

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

/** `h` tính theo người cao `BODY_H` = 64. */
const STANDING: Record<string, [src: string, o: Standing]> = {
  [PROP.oven]: ["prop_oven", { h: 70 }],
  // Cao hơn lò than 4 px mà vẫn hẹp hơn một ô (74 × 0,773 = 57 < TW 60).
  [PROP.ovenE]: ["prop_e-oven", { h: 74 }],
  [PROP.shelf]: ["prop_shelf", { h: 86 }],
  [PROP.tea]: ["prop_tea", { h: 68 }],
  [PROP.sink]: ["prop_sink", { h: 58, dx: -2 }],
  [PROP.stool]: ["prop_stool", { h: 38 }],
  [PROP.table]: ["prop_table", { h: 56 }],
  [PROP.order]: ["prop_order", { h: 50, dy: SIT + TABLE_DROP }],
  [PROP.prep]: ["prop_prep", { h: 59, dy: SIT + TABLE_DROP }],
  // Ảnh gần vuông, xe nằm chéo nên trông bé hơn `h`.
  [PROP.bike]: ["prop_bike", { h: 82 }],
  [PROP.scooter]: ["prop_scooter", { h: 78 }],
  [PROP.pothos]: ["prop_pothos", { h: 34 }],
  [PROP.bin]: ["prop_bin", { h: 46 }],
  [PROP.sign]: ["prop_sign", { h: 58 }],
  // Đáy phẳng hẹp, tụt đủ `SIT` là trông lún xuống sàn.
  [PROP.fire]: ["prop_extinguisher", { h: 44, dy: SIT - 5 }],
  [PROP.umbrella]: ["prop_umbrella", { h: 100 }],
  [PROP.fridge]: ["prop_fridge", { h: 62 }],
  [PROP.cooler]: ["prop_cooler", { h: 30 }],
};

/** Bàn 1 × 2 ô; `foot` là vị trí ngang của đỉnh dưới trong ảnh (0–1), `body` là bề cao thân bàn theo px thiết kế. */
const BENCH = { src: "prop_bench", h: 74, foot: 0.336, body: 28 };

/** Tám file cùng khung, đáy là mặt đất, tâm ngang là tâm hai bàn chân. */
const DIRS8: readonly Facing8[] = ["s", "se", "e", "ne", "n", "nw", "w", "sw"];

const PLAYER_SRC = (d: Facing8) => `player/p_${d}`;

/** Khung cao theo hướng có búi tóc cao nhất. */
const PLAYER_H = 65;

/** Khoá là `memKey` = tiền tố texture của `CustomerActor`; `walk` là atlas chu kỳ đi, thiếu thì đứng yên. */
const NPC_PHOTOS: Record<string, { src: (d: Facing8) => string; h: number; walk?: string }> = {
  ANH_DUNG: { src: (d) => `npc/anh-dung/${d}`, h: 64 },
  BA_BAY: { src: (d) => `npc/ba-bay/${d}`, h: 64, walk: "ba-bay" },
  ANH_BAO: { src: (d) => `npc/anh-bao/${d}`, h: 65, walk: "anh-bao" },
};

/** `held_loaf_baked` cố ý không có: mượn ảnh ổ nóng thì ổ nguội và ổ nóng giống hệt nhau. */
const CARRIED: Partial<Record<HeldLook, [src: string, size: Fit]>> = {
  loaf_cold: ["held_loaf_cold", { w: 21 }],
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
  hanhngo: ["ing_hanhngo"],
  // Ảnh ớt kín khung nên thu nhỏ; số thứ ba là cỡ lúc nằm trong ổ.
  ot: ["ing_ot", 0.62, 0.40],
};

const OPEN_LOAF = ["loaf_lid", "loaf_trough"] as const;

/** `textures.exists` chưa đủ: lượt tải đang bay mà xin lại là Phaser báo trùng key. */
const asked = new Set<string>();

export function preloadPhotos(scene: Phaser.Scene) {
  const names = [
    ...FLOORS.flatMap((f) => [0, 1, 2, 3].map((i) => `f_${f}${i}`)),
    ...Object.values(STANDING).map(([src]) => src),
    BENCH.src,
    ...Object.values(CARRIED).map(([src]) => src),
    ...Object.values(FILLINGS).map(([src]) => src),
    ...OPEN_LOAF,
    FLY,
    BOARD,
    BASKET,
  ] as string[];
  for (const n of names) {
    if (asked.has(n) || scene.textures.exists(SRC + n)) continue;
    asked.add(n);
    scene.load.image(SRC + n, `art/${n}.webp`);
  }
  preloadWalk(scene, "player", true);
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
}

/** Tải nền ngay sau khi vào menu; scene tắt giữa chừng thì loader bỏ dở nên phải quên các key đã xin. */
export function warmNpcPhotos(scene: Phaser.Scene) {
  if (npcPainted) return;
  preloadNpcPhotos(scene);
  scene.load.once(Phaser.Loader.Events.COMPLETE, () => paintNpcPhotos(scene));
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
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
  const W = Math.max(TW + 2, Math.ceil(w) + 6);
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
  const W = Math.max(TW + 2, Math.ceil(w) + 6);
  const H = Math.ceil(h + BASE + TH / 2 + 1 - (o.dy ?? SIT));
  const made = blank(scene, key, W, H, ART_SS);
  if (!made) return false;
  made.ctx.drawImage(shrink(cut, w * ART_SS, h * ART_SS),
    Math.round(W / 2 - w / 2 + (o.dx ?? 0)), 0, w, h);
  made.tex.refresh();
  const last = lowestOpaque(alphaOfAtlas(atlas, img), f);
  const row = Math.ceil(((last + 1) * h * ART_SS) / f.cutHeight) - 1;
  footLift.set(key, (Math.ceil(H * ART_SS) - 1 - row) / ART_SS);
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

function floors(scene: Phaser.Scene) {
  for (const kind of FLOORS) {
    for (let i = 0; i < TILE.VARIANTS; i++) {
      const img = source(scene, `f_${kind}${i}`);
      if (!img) continue;
      // Nhận nguyên ảnh, vẽ lại qua canvas là nội suy thêm và lộ đường ráp.
      const key = TILE.floor(kind, i);
      if (scene.textures.exists(key)) scene.textures.remove(key);
      scene.textures.addImage(key, img);
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
  readHoldAnchors(scene);
}

/** Đọc alpha từ canvas CPU: đọc ngược từ texture đã vẽ phải chờ GPU, mỗi lần cả trăm ms. */
const atlasAlpha = new Map<string, ImageData>();

function alphaOfAtlas(atlas: string, img: HTMLImageElement | HTMLCanvasElement) {
  let d = atlasAlpha.get(atlas);
  if (!d) {
    const cv = document.createElement("canvas");
    cv.width = img.width;
    cv.height = img.height;
    const ctx = cv.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0);
    d = ctx.getImageData(0, 0, cv.width, cv.height);
    atlasAlpha.set(atlas, d);
  }
  return d;
}

/** Hàng thấp nhất còn đục của ô, tính từ đỉnh ô. */
function lowestOpaque(d: ImageData, f: Phaser.Textures.Frame) {
  for (let y = f.cutY + f.cutHeight - 1; y >= f.cutY; y--) {
    for (let x = f.cutX; x < f.cutX + f.cutWidth; x++) {
      if (d.data[(y * d.width + x) * 4 + 3] > 40) return y - f.cutY;
    }
  }
  return f.cutHeight - 1;
}

/** Bàn chân cách đất bao nhiêu px thiết kế, đo từ ảnh vì đáy chân không theo sin sạch. */
const footLift = new Map<string, number>();

const liftOf = new Map<string, number>();

export function walkLift(key: string) {
  return liftOf.get(key) ?? 0;
}

/** Chỉ ghi sổ khi đủ 8 hướng × `WALK_FRAMES`, thiếu một ô là Phaser vẽ ô xanh lá. */
function paintWalk(
  scene: Phaser.Scene, who: string, file: string, h: number, gaits: readonly Gait[],
) {
  const atlas = walkAtlas(file);
  if (!scene.textures.exists(atlas)) return;
  const lifts: string[] = [];
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
  atlasAlpha.delete(atlas);
  if (!lifts.length) return;
  // Mốc 0 là chân thấp nhất của mọi chu kỳ, không phải đáy khung, để bóng không giật khi đổi chu kỳ.
  const raw = lifts.map((k) => footLift.get(k) ?? 0);
  const floor = Math.min(...raw);
  lifts.forEach((k, i) => liftOf.set(k, raw[i] - floor));
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
  player(scene);
  for (const [hand, [src, fit]] of Object.entries(CARRIED) as [HeldLook, [string, Fit]][]) {
    boxed(scene, HELD.key(hand), src, HELD.W, fit);
  }
  paintFoodPhotos(scene);
}
