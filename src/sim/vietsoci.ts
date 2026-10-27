import type { SaveFile } from "../core/save";
import { Rng, fnv1a, splitmix32 } from "../core/rng";
import CONTENT from "../content/vietsoci.json";
import { NAMES } from "./reviewText";
import { enqueue } from "./reviews";
import { linked, say } from "./system";
import { pushLink } from "./phone";
import { isRain, weatherOf } from "./econ";

/** Clip quay quán dính cảnh gì; `sach` là không dính gì. */
export type ClipState = "sach" | "ruoi" | "tay";
export type Channel = "su" | "review";

type Pack = { caption: string[]; comment: string[] };
/** `vui` 1–3: tin càng thú vị càng hay lên bảng tin. `dacbiet` chỉ đăng theo sự kiện tin nhắn. */
type Tin = {
  id: string; loai: "hem" | "thanhpho" | "drama" | "dacbiet"; kenh: string; caption: string; comment: string[];
  /** Tên ảnh trong `public/art/vietsoci/`, không đuôi. */
  anh: string; vui: number;
  /** Chỉ đăng ngày mưa. */
  troi?: "mua";
  /** Khách thêm ngay hôm đăng. */
  khach?: number;
};
type Msg = { from: string; text: string };

const RAW = CONTENT as unknown as {
  kenh: Record<Channel, string>;
  clip: Record<Channel, Record<ClipState, Pack>>;
  danhGia: Record<ClipState, string[]>;
  tin: Tin[];
  tinNhan: Record<ClipState, Msg[]>;
};

export type Post = {
  id: number;
  day: number;
  kenh: string;
  caption: string;
  comments: string[];
  likes: number;
  /** Bài là clip thì ảnh có nút phát. */
  video: boolean;
  /** Tên ảnh trong `public/art/vietsoci/`, không đuôi. */
  img: string;
  /** Mã tin trong `vietsoci.json`; clip thì không có. */
  tin?: string;
};

export type VietsociState = {
  seq: number;
  posts: Post[];
  /** Mã bài cuối đã xem, để đếm badge. */
  seen: number;
  /** Ngày → số khách thêm nhờ clip sạch. */
  boost: Record<number, number>;
  /** Mã tin thường đã đăng, đăng hết mới lặp lại. */
  used: string[];
  /** Kênh → ngày quay clip gần nhất; mỗi kênh một clip mỗi ngày. */
  filmDay: Partial<Record<Channel, number>>;
};

export const newVietsoci = (): VietsociState => ({ seq: 0, posts: [], seen: 0, boost: {}, used: [], filmDay: {} });

export const filmedToday = (w: SaveFile, ch: Channel) => w.vietsoci.filmDay[ch] === w.progress.dayIndex;

/** Clip kéo theo bao nhiêu đánh giá từ người xem, thêm bao nhiêu khách hôm sau, chừng bao nhiêu lượt thích. */
export const CLIP_REACH: Record<Channel, { reviews: Record<ClipState, number>; boost: number; likes: readonly [number, number] }> = {
  su: { reviews: { sach: 1, ruoi: 1, tay: 1 }, boost: 1, likes: [40, 300] },
  review: { reviews: { sach: 3, ruoi: 5, tay: 5 }, boost: 3, likes: [1_500, 9_000] },
};

/** Clip lan dần nên đánh giá tới rải rác, tính bằng phút game sau lúc quay xong. */
const SPREAD_MIN = [20, 180] as const;
const COMMENTS_SHOWN = 4;

/** Bảng tin chỉ có ngần này bài mới nhất; bài cũ hơn chỉ mở được qua link. */
export const FEED_MAX = 20;

export const feedPosts = (w: SaveFile) => w.vietsoci.posts.slice(0, FEED_MAX);
export const unseenPosts = (w: SaveFile) => feedPosts(w).filter((p) => p.id > w.vietsoci.seen).length;
export const markPostsSeen = (w: SaveFile) => { w.vietsoci.seen = w.vietsoci.seq; };
export const boostOf = (w: SaveFile, day: number) => w.vietsoci?.boost[day] ?? 0;

function rngFor(w: SaveFile, tag: string) {
  return new Rng(splitmix32(fnv1a(`${w.saveId}|vietsoci|${tag}|${w.progress.dayIndex}|${w.vietsoci.seq}`)));
}

function pickN<T>(rng: Rng, xs: readonly T[], n: number): T[] {
  const pool = [...xs];
  const out: T[] = [];
  while (out.length < n && pool.length) out.push(pool.splice(rng.int(0, pool.length), 1)[0]);
  return out;
}

/** Bài rơi khỏi bảng tin mà không tin nhắn nào gắn link thì bỏ, khỏi phình save. */
function addPost(w: SaveFile, p: Omit<Post, "id" | "day">): Post {
  const post = { ...p, id: ++w.vietsoci.seq, day: w.progress.dayIndex };
  const linked = new Set(w.phone.threads.flatMap((t) => t.msgs.map((m) => m.link)));
  w.vietsoci.posts = [post, ...w.vietsoci.posts].filter((x, i) => i < FEED_MAX || linked.has(x.id));
  return post;
}

/** Clip quay xong: lên VietSoci, người xem vào chấm sao, người quen nhắn link; clip sạch thì mai thêm khách. */
export function postClip(w: SaveFile, clip: { channel: Channel; state: ClipState }, at: number): { system: string | null } {
  w.vietsoci.filmDay[clip.channel] = w.progress.dayIndex;
  const rng = rngFor(w, `clip-${clip.channel}`);
  const reach = CLIP_REACH[clip.channel];
  const pack = RAW.clip[clip.channel][clip.state];
  const likes = rng.int(reach.likes[0], reach.likes[1]) * (clip.state === "sach" ? 1 : 3);
  const post = addPost(w, {
    kenh: RAW.kenh[clip.channel], caption: rng.pick(pack.caption),
    comments: pickN(rng, pack.comment, COMMENTS_SHOWN), likes, video: true, img: `clip_${clip.state}`,
  });

  const day = w.progress.dayIndex;
  const stars = clip.state === "sach" ? 5 : 1;
  for (const text of pickN(rng, RAW.danhGia[clip.state], reach.reviews[clip.state])) {
    enqueue(w, { at: at + rng.int(SPREAD_MIN[0], SPREAD_MIN[1]), r: {
      day, who: rng.pick(NAMES), stars, text, food: false, noise: "clip",
    } });
  }

  const m = rng.pick(RAW.tinNhan[clip.state]);
  pushLink(w, m.from, m.text.replace("{kenh}", post.kenh), post.id);

  if (clip.state !== "sach") return { system: null };
  w.vietsoci.boost[day + 1] = (w.vietsoci.boost[day + 1] ?? 0) + reach.boost;
  if (!linked(w)) return { system: null };
  const lines = [
    "Keng! Danh tiếng quán của ký chủ đang lan truyền trên 【VietSoci】.",
    `Hiệu quả: ngày mai khách +${reach.boost}.`,
    "Mô tả: Hữu xạ tự nhiên hương.",
  ];
  for (const l of lines) say(w, l);
  return { system: lines.slice(0, 2).join(" ") };
}

/** Tin gắn với một sự kiện tin nhắn; đã đăng thì dùng lại bài cũ. */
export function postTin(w: SaveFile, id: string): Post | null {
  const old = w.vietsoci.posts.find((p) => p.tin === id);
  if (old) return old;
  const t = RAW.tin.find((x) => x.id === id);
  if (!t) return null;
  const rng = rngFor(w, `tin-${id}`);
  return addPost(w, {
    kenh: t.kenh, caption: t.caption.replace("{QUAN}", w.shopName.toUpperCase()), comments: pickN(rng, t.comment, COMMENTS_SHOWN),
    likes: rng.int(200, 12_000), video: false, img: t.anh, tin: t.id,
  });
}

/** Không phải ngày nào cũng có tin. */
const DAILY_ODDS = 0.6;

/** Đầu ngày: có thể đăng một tin, đăng hết kho mới quay vòng. */
export function dailyTin(w: SaveFile): Post | null {
  const rng = rngFor(w, "daily");
  if (rng.next() >= DAILY_ODDS) return null;
  const rain = isRain(weatherOf(w.progress.dayIndex));
  const all = RAW.tin.filter((t) => t.loai !== "dacbiet" && (t.troi !== "mua" || rain));
  if (!all.length) return null;
  let left = all.filter((t) => !w.vietsoci.used.includes(t.id));
  if (!left.length) { w.vietsoci.used = []; left = all; }
  let roll = rng.next() * left.reduce((a, t) => a + t.vui, 0);
  const t = left.find((x) => (roll -= x.vui) < 0) ?? left[0];
  w.vietsoci.used.push(t.id);
  const old = w.vietsoci.posts.findIndex((p) => p.tin === t.id);
  if (old >= 0) w.vietsoci.posts.splice(old, 1);
  if (t.khach) {
    const day = w.progress.dayIndex;
    w.vietsoci.boost[day] = (w.vietsoci.boost[day] ?? 0) + t.khach;
    if (linked(w)) {
      say(w, "Keng! Trào lưu mới trên 【VietSoci】 đang càn quét phố phường.");
      say(w, `Hiệu quả: hôm nay khách +${t.khach}.`);
    }
  }
  return postTin(w, t.id);
}
