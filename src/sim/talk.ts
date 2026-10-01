/**
 * Trò chuyện có nhánh — P5-01. Thay cho cái nút F cũ.
 *
 * Cái sai của bản cũ: F rút MỘT câu người chơi từ túi `askPlayer` rồi rút MỘT câu khách
 * từ rule `gen.ask` — hai lần rút ĐỘC LẬP. Nên "Sáng nay đi đâu sớm vậy?" được đáp bằng
 * "Ờ, cũng khoẻ con." Không phải lỗi nội dung: lỗi ở chỗ câu đáp không bao giờ BIẾT câu hỏi.
 *
 * Ở đây một cuộc trò chuyện là một CÂY THẬT, rẽ nhánh tới đâu cũng được:
 *
 *   opener (khách nói)
 *     A ─ reply A ─→ A1 A2 A3 A4
 *     │                └ A4 ─ reply A4 ─→ A4a A4b A4c
 *     B ─ reply B ─→ B1 B2 B3
 *     C ─ (im)    ─→ C1 C2
 *     D ─ reply D ─ hết
 *
 * Mỗi nút mang CÂU ĐÁP CỦA RIÊNG NÓ (`reply`) và BỘ LỰA CHỌN CỦA RIÊNG NÓ (`then`) —
 * đó là toàn bộ chỗ bản cũ gãy. Nhánh nào muốn nhập lại với nhánh khác thì trỏ `ref`
 * tới một cây con đặt tên trong `shared`, khỏi chép lại.
 *
 * `reply` vắng + `silent: true` = khách KHÔNG ĐÁP. Người nóng tính, người đang giận, hoặc
 * người thấy câu vừa rồi không đáng trả lời. Im lặng là một câu trả lời (P2-02 §2.3), không
 * phải chỗ thiếu nội dung — và nó vẫn đi tiếp xuống `then` như thường.
 *
 * BỐN LUẬT không được bỏ:
 *  1. Mở bảng lựa chọn = ĐÓNG BĂNG đồng hồ (StallScene). Đọc 4 dòng mà khách vẫn hết kiên
 *     nhẫn thì người chơi học được đúng một bài: đừng bao giờ bấm F.
 *  2. Lúc nào cũng có đường RA ở nhịp đầu — và im lặng CÓ GIÁ, không phải nút huỷ (`ignore`).
 *  3. T3 (CANON): không một con số nào ở đây lên màn hình. `rel`, `anger` không bao giờ
 *     được hiện ra, kể cả dưới dạng "+2 thiện cảm".
 *  4. Nội dung nạp theo TỪNG NGƯỜI, lúc họ đi tới quầy, và thả ra lúc họ đi (`TalkStore`).
 *     Một hẻm 12 người × nhiều chục cuộc × cây sâu 4 tầng không nằm hết trong RAM được.
 *
 * Thuần dữ liệu: không Phaser, không RNG riêng (mọi số ngẫu nhiên nhận từ ngoài vào).
 */
import type { Personality } from "../content/npcs";
import type { RelTier } from "../core/types";
import type { Rng } from "../core/rng";
import { record, talkPoints, type BaseKind, type RelState } from "./memory";
import { weekdayOf, type Weekday } from "./schedule";
import type { TimeBand } from "../core/clock";

/**
 * Giọng của một lựa chọn. Dùng để (a) tô mép nút, (b) kiểm nội dung: một nhịp mà cả 4
 * lựa chọn cùng giọng thì không phải lựa chọn — test bắt.
 *
 *   AM     ấm, hỏi han, để ý tới người ta
 *   THUONG câu xã giao bình thường, không mất gì không được gì
 *   DUA    giỡn, chọc — hợp người này thì ăn, trật người thì mất điểm
 *   THANG  nói thẳng, không vòng vo — không hỗn, nhưng không dịu
 *   LANH   lạnh, cho qua chuyện
 *   GAT    gắt với CHÍNH người đang đứng đây — hỗn, chửi vô mặt. LUÔN có giá.
 *   CHUI   chửi NGƯỜI THỨ BA cùng với họ ("thằng đó mất dạy thiệt"). KHÔNG phải GAT:
 *          với ông Hải thì đây là bắt được tần số, với chị Lan thì đây là mất điểm.
 *          Nó không bao giờ trung tính — người ta luôn thấy mình vừa nghe thấy gì.
 *   IM     không nói gì
 */
export type TalkTone = "AM" | "THUONG" | "DUA" | "THANG" | "LANH" | "GAT" | "CHUI" | "IM";

export const TONE_LABEL: Record<TalkTone, string> = {
  AM: "ấm", THUONG: "thường", DUA: "giỡn", THANG: "thẳng",
  LANH: "lạnh", GAT: "gắt", CHUI: "chửi đổng", IM: "im",
};

/** Cây sâu quá ngần này là viết lỗi (hoặc `ref` quay vòng) — runtime cắt, test bắt. */
export const MAX_DEPTH = 6;

export type TalkEffect = {
  /** Điểm quan hệ cộng thẳng (không thành ký ức). Cỡ thường gặp: −6 … +4. */
  rel?: number;
  /**
   * Thành KÝ ỨC hẳn hoi — chỉ dùng cho câu đủ nặng để người ta còn nhớ sang hôm sau.
   * `RUDE_TO_THEM` cho câu nói khó nghe; `CARED_FOR_THEM` / `REMEMBERED_STORY` cho câu
   * chạm đúng chuyện của họ.
   */
  mem?: { kind: BaseKind; intensity: number };
  /**
   * Giận: 0..100. Ăn thẳng vào sức chờ của lượt ghé NÀY (`waitSec` nhảy lên theo %), nên
   * người chơi thấy hậu quả NGAY ở dáng đứng và ở việc họ bỏ về sớm — không phải một con số.
   */
  anger?: number;
  /** Đặt một cờ chuyện (story.flags) — cho arc và cho `need` của cuộc khác đọc lại. */
  flag?: string;
};

export type TalkNode = TalkEffect & {
  /** Câu người chơi nói. Ngắn — nó nằm trên một cái nút. */
  say: string;
  tone: TalkTone;
  /** Câu khách đáp ĐÚNG lựa chọn này. */
  reply?: string;
  /**
   * Khách KHÔNG đáp — cố ý. Khác với quên viết `reply`: `silent` là một nước đi của nhân
   * vật (người nóng tính, người đang giận, người thấy câu đó không đáng trả lời), và test
   * đòi mọi nút không có `reply` phải khai `silent` để phân biệt hai chuyện đó.
   */
  silent?: boolean;
  /** Bộ lựa chọn tiếp theo CỦA RIÊNG nhánh này. Vắng (và không có `ref`) = hết chuyện. */
  then?: TalkNode[];
  /** Nhập vào một cây con đặt tên trong `talk.shared` — để nhánh hội tụ mà khỏi chép lại. */
  ref?: string;
  /** Chỉ hiện lựa chọn này khi cờ chuyện này đang bật. */
  need?: string;
};

export type TalkWhen = {
  /** Khoảng ngày [từ, tới] trong mùa 40 ngày. */
  day?: [number, number];
  weekday?: Weekday[];
  tier?: RelTier[];
  slot?: TimeBand[];
  rain?: boolean;
  /** Ghé đủ ngần này lần rồi mới có chuyện này để nói. */
  minVisits?: number;
  needFlag?: string;
  /** Không hiện khi cờ này bật (chuyện đã cũ / người ta đã đi rồi). */
  notFlag?: string;
};

export type Talk = {
  id: string;
  /** NPC id, hoặc `WALKIN` (khách vãng lai), hoặc `ANY`. */
  npc: string;
  /** Chủ đề — mỗi ngày mỗi người chỉ đụng một chủ đề một lần. */
  topic: string;
  /** Câu khách nói trước. Bấm F = người chơi gợi chuyện, khách mở lời bằng câu này. */
  opener: string;
  /**
   * Khách TỰ bắt chuyện (không cần F): 0..0,6, roll khi họ đứng chờ. Người chơi làm lơ
   * được — và làm lơ có giá, xem `ignore`.
   */
  initiates?: number;
  /**
   * Người chơi đóng bảng mà không chọn gì (Esc). Mặc định (không khai): coi như
   * `{ rel: -1 }` — làm thinh với người đang nói chuyện với mình thì nguội đi một chút.
   */
  ignore?: { reply?: string; rel?: number; anger?: number; mem?: TalkEffect["mem"] };
  when?: TalkWhen;
  /** Trọng số khi nhiều cuộc cùng đủ điều kiện. Mặc định 10. */
  weight?: number;
  /** Nhịp đầu. */
  tree: TalkNode[];
  /** Cây con dùng chung, cho `ref` trỏ tới. */
  shared?: Record<string, TalkNode[]>;
};

export type TalkFile = { talks: Talk[] };

// ─────────────────────────────────────────────────────────────── danh xưng

/**
 * Ai gọi ai bằng gì — CANON §2 (KHÔNG dịch đại từ) nới ra cho hội thoại.
 *
 * `self`  khách tự xưng          `you` khách gọi người chơi
 * `call`  người chơi gọi khách   `me`  người chơi tự xưng với người này
 *
 * Bảng này KHÔNG trang trí: nó là lưới chắn. "Bé Su công việc dạo này sao rồi?" là câu
 * hỏi một đứa cấp 2 chuyện đi làm — và nó lọt được là vì không có bảng nào chặn. Test
 * `p5-talk` đọc bảng này và bắt mọi dòng dùng sai đại từ.
 */
export type Address = { self: string; you: string; call: string; me: string };

export const ADDRESS: Record<string, Address> = {
  BA_BAY:    { self: "bà",   you: "con", call: "bà",   me: "con" },
  CHU_TU:    { self: "chú",  you: "con", call: "chú",  me: "con" },
  ANH_DUNG:  { self: "anh",  you: "em",  call: "anh",  me: "em" },
  CHI_LAN:   { self: "em",   you: "em",  call: "chị",  me: "em" },
  BE_SU:     { self: "con",  you: "cô",  call: "con",  me: "cô" },
  ONG_HAI:   { self: "chú",  you: "con", call: "chú",  me: "con" },
  CO_MAI:    { self: "cô",   you: "con", call: "cô",   me: "con" },
  THAY_PHUC: { self: "thầy", you: "con", call: "thầy", me: "con" },
  CHI_HANH:  { self: "chị",  you: "em",  call: "chị",  me: "em" },
  ANH_BAO:   { self: "em",   you: "cô",  call: "em",   me: "cô" },
  BA_SAU:    { self: "tui",  you: "con", call: "bà",   me: "con" },
  CHU_KIET:  { self: "tao",  you: "mày", call: "chú",  me: "tui" },
  WALKIN:    { self: "tui",  you: "em",  call: "anh",  me: "em" },
};

/**
 * Khách vãng lai không có MỘT vai cố định: hôm nay là "anh chạy xe", mai là "bà cụ",
 * mốt là "chị đeo khẩu trang" (xem `WALKIN_NAMES`). Nên lưới danh xưng với họ chỉ đòi
 * người chơi gọi bằng MỘT trong mấy vai này — chứ không đòi đúng một từ.
 */
export const WALKIN_CALLS = ["anh", "chị", "cô", "chú", "bà", "ông", "em"];

/**
 * Đại từ CẤM trong lời của từng người (lưới L-6 của test).
 *
 * Không suy ra được từ `ADDRESS` vì chiều ngược lại mới là chỗ sai hay gặp: bé Su mà
 * gọi người chơi là "em" thì nó thành một đứa khác, dù "em" vẫn là từ hợp lệ ở bảng trên.
 */
export const FORBIDDEN_SELF: Record<string, string[]> = {
  BE_SU: ["chị", "cô ấy", "tui", "tao"],
  ANH_BAO: ["anh", "tui", "tao", "chú"],
  CHI_LAN: ["tui", "tao"],
  THAY_PHUC: ["tao", "tui", "chú", "anh"],
  BA_BAY: ["tao", "chị", "em"],
  CHU_TU: ["tao", "anh", "ông"],
  CO_MAI: ["tao", "chị", "bà"],
  ONG_HAI: ["cô", "chị", "em"],
  BA_SAU: ["tao", "cô", "chị"],
  ANH_DUNG: ["tao", "chú", "tui"],
  CHI_HANH: ["tui", "tao", "cô"],
};

// ─────────────────────────────────────────────────────────────── chọn cuộc

/** Mọi thứ cần biết để lọc + chấm một cuộc trò chuyện. Service dựng, talk.ts không tự đọc gì. */
export type TalkCtx = {
  npcId: string;
  day: number;
  slot: TimeBand;
  rain: boolean;
  tier: RelTier;
  visits: number;
  flags: Record<string, string | number | boolean | undefined>;
  /** Chủ đề đã đụng hôm nay với CHÍNH người này (không lặp chủ đề trong ngày). */
  usedToday: readonly string[];
  /** id cuộc đã chơi cả mùa — không bao giờ lặp lại nguyên một cuộc. */
  usedSeason: readonly string[];
};

function okWhen(w: TalkWhen | undefined, c: TalkCtx): boolean {
  if (!w) return true;
  if (w.day && (c.day < w.day[0] || c.day > w.day[1])) return false;
  if (w.weekday && !w.weekday.includes(weekdayOf(c.day))) return false;
  if (w.tier && !w.tier.includes(c.tier)) return false;
  if (w.slot && !w.slot.includes(c.slot)) return false;
  if (w.rain !== undefined && w.rain !== c.rain) return false;
  if (w.minVisits !== undefined && c.visits < w.minVisits) return false;
  if (w.needFlag && !c.flags[w.needFlag]) return false;
  if (w.notFlag && c.flags[w.notFlag]) return false;
  return true;
}

export function eligible(all: readonly Talk[], c: TalkCtx): Talk[] {
  return all.filter((t) =>
    (t.npc === c.npcId || t.npc === "ANY")
    && !c.usedSeason.includes(t.id)
    && !c.usedToday.includes(t.topic)
    && okWhen(t.when, c));
}

/**
 * Rút một cuộc theo trọng số. Dùng stream `dialog-shufflebag` (truyền từ ngoài vào) —
 * KHÔNG được đụng `npc-schedule`, nếu không thì bấm F hôm nay làm xê dịch ai tới ngày mai.
 */
export function pickTalk(all: readonly Talk[], c: TalkCtx, rng: Rng): Talk | null {
  const list = eligible(all, c);
  if (!list.length) return null;
  const total = list.reduce((a, t) => a + (t.weight ?? 10), 0);
  let x = rng.next() * total;
  for (const t of list) if ((x -= t.weight ?? 10) < 0) return t;
  return list[list.length - 1];
}

/** Lựa chọn nào được hiện ở nhịp này (lọc `need`). Luôn trả về ít nhất một đường ra. */
export function visibleOptions(nodes: readonly TalkNode[], flags: TalkCtx["flags"]): TalkNode[] {
  const out = nodes.filter((o) => !o.need || !!flags[o.need]);
  return out.length ? out : nodes.slice(0, 1);
}

/** Nhánh con của một nút: `then` của chính nó, hoặc cây con dùng chung mà nó trỏ `ref`. */
export function childrenOf(n: TalkNode, t: Talk): TalkNode[] | null {
  if (n.then?.length) return n.then;
  if (n.ref) return t.shared?.[n.ref] ?? null;
  return null;
}

// ─────────────────────────────────────────────────────────────── phiên

/** Một cuộc đang mở. Sống trong Service, chết khi đóng bảng. */
export class TalkSession {
  /** Bộ lựa chọn đang hiện. null = hết chuyện. */
  private here: TalkNode[] | null;
  private depth = 0;
  done = false;
  /** Người chơi đã chọn gì — nhật ký cuối ngày đọc. */
  readonly picked: { say: string; tone: TalkTone }[] = [];

  constructor(readonly talk: Talk, readonly npcKey: string) {
    this.here = talk.tree.length ? talk.tree : null;
    this.done = this.here === null;
  }

  get options(): readonly TalkNode[] | null {
    return this.done ? null : this.here;
  }

  /**
   * Người chơi chọn lựa chọn thứ `i` của nhịp hiện tại (đã lọc `need`).
   * Trả câu khách đáp + chính cái nút đã chọn, và tự đi xuống nhánh con của nó.
   */
  choose(i: number, flags: TalkCtx["flags"]): { node: TalkNode; reply?: string; done: boolean } | null {
    if (!this.here || this.done) return null;
    const opts = visibleOptions(this.here, flags);
    const n = opts[Math.max(0, Math.min(opts.length - 1, i))];
    this.picked.push({ say: n.say, tone: n.tone });

    const kids = childrenOf(n, this.talk);
    this.depth++;
    // Cắt ở MAX_DEPTH: `ref` trỏ vòng lại là cây vô hạn, mà người chơi thì đang đứng
    // giữa buổi bán. Test L-9 bắt chuyện này lúc build; đây là lưới thứ hai lúc chạy.
    this.here = kids && this.depth < MAX_DEPTH ? kids : null;
    this.done = this.here === null;
    return { node: n, reply: n.reply, done: this.done };
  }
}

// ─────────────────────────────────────────────────────────────── hệ quả

export const DEFAULT_IGNORE_REL = -1;

export type TalkOutcome = { relDelta: number; mem: BaseKind | null; anger: number; flag?: string };

/**
 * Áp hiệu ứng của MỘT lựa chọn lên quan hệ + trí nhớ.
 *
 * KHÔNG đi qua `Service.remember()` — tức là không vào tin đồn. Một câu nói giữa hai người
 * ở quầy không phải chuyện bà Sáu đem đi kể; chỉ hành động (rớt bánh, ăn bớt) mới đi xa
 * được. Giữ vậy thì `RUDE_TO_THEM` không bao giờ cần một claim trong `gossip.ts`.
 */
export function applyTalk(e: TalkEffect, s: RelState, p: Personality, day: number): TalkOutcome {
  const out: TalkOutcome = { relDelta: 0, mem: null, anger: e.anger ?? 0, flag: e.flag };
  if (e.rel) out.relDelta += talkPoints(s, p, e.rel);
  if (e.mem) {
    const r = record(s, p, e.mem.kind, e.mem.intensity, day);
    out.relDelta += r.delta;
    out.mem = e.mem.kind;
  }
  return out;
}

/**
 * Giận → sức chờ. `anger` 0..100 nghĩa là "đốt ngần ấy % quãng kiên nhẫn CÒN LẠI của
 * lượt ghé này". Nóng tính thì đốt mạnh hơn (`intensityMul` đã nhân sẵn ở Service).
 *
 * Trả về số giây chờ phải cộng thêm. Không bao giờ đẩy quá mốc bỏ đi trong MỘT câu: người
 * ta nói nặng rồi bỏ đi luôn thì người chơi không kịp thấy mình vừa làm gì.
 */
export function angerToWaitSec(anger: number, waitT: number, waited: number, leaveAt: number) {
  if (anger <= 0) return 0;
  const room = Math.max(0, waitT * leaveAt - waited);
  return Math.min(room * 0.85, (room * Math.min(100, anger)) / 100);
}

// ─────────────────────────────────────────────────────── duyệt cây (test/tool)

/** Mọi nút của một cuộc, kể cả cây con dùng chung. Cắt ở `MAX_DEPTH` để `ref` vòng không treo. */
export function walkNodes(t: Talk): { node: TalkNode; depth: number }[] {
  const out: { node: TalkNode; depth: number }[] = [];
  const seen = new Set<TalkNode>();
  const go = (nodes: readonly TalkNode[], depth: number) => {
    if (depth > MAX_DEPTH) return;
    for (const n of nodes) {
      if (seen.has(n)) continue;
      seen.add(n);
      out.push({ node: n, depth });
      const kids = childrenOf(n, t);
      if (kids) go(kids, depth + 1);
    }
  };
  go(t.tree, 1);
  return out;
}

/** Mọi dòng thoại của một cuộc — linter và test danh xưng đọc. */
export function linesOf(t: Talk): { npc: string[]; player: string[] } {
  const all = walkNodes(t);
  return {
    npc: [t.opener, ...(t.ignore?.reply ? [t.ignore.reply] : []), ...all.map((x) => x.node.reply).filter((x): x is string => !!x)],
    player: all.map((x) => x.node.say),
  };
}
