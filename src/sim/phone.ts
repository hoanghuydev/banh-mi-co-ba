import type { SaveFile } from "../core/save";
import { ME } from "../content/phone/contacts";
import { EVENTS, TUITION, type PhoneEvent, type Vars } from "../content/phone/events";
import { Rng, fnv1a, splitmix32 } from "../core/rng";
import type { Beat, Chapter } from "../content/phone/intro";
import { postTin } from "./vietsoci";

export type Msg = { n: number; from: string; text: string; at: string; attach?: string; /** Mã bài VietSoci. */ link?: number };
export type Thread = {
  id: string;
  msgs: Msg[];
  /** Số tin đã đọc, tính từ đầu thread. */
  seen: number;
  pending?: { ev: string; vars?: Record<string, string | number> };
};
export type Note = { id: string; day: number; text: string };
export type PhoneState = { seq: number; threads: Thread[]; notes: Note[]; fired: string[]; firedDay: Record<string, number> };

export const NOTE_MAX = 600;

export const newPhone = (): PhoneState => ({ seq: 0, threads: [], notes: [], fired: [], firedDay: {} });

function thread(p: PhoneState, id: string): Thread {
  let t = p.threads.find((x) => x.id === id);
  if (!t) p.threads.push((t = { id, msgs: [], seen: 0 }));
  return t;
}

function push(p: PhoneState, id: string, from: string, text: string, at: string, attach?: string): Msg {
  const m: Msg = { n: ++p.seq, from, text, at };
  if (attach) m.attach = attach;
  thread(p, id).msgs.push(m);
  return m;
}

export function fill(text: string, vars?: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, k) => String(vars?.[k] ?? ""));
}

/** Tin đến từ người khác — của mình không tính chưa đọc. */
export function unreadOf(t: Thread): number {
  return t.msgs.slice(t.seen).filter((m) => m.from !== ME).length;
}

export const totalUnread = (p: PhoneState): number => p.threads.reduce((s, t) => s + unreadOf(t), 0);

export function markRead(p: PhoneState, id: string) {
  const t = p.threads.find((x) => x.id === id);
  if (t) t.seen = t.msgs.length;
}

export const lastMsgN = (t: Thread): number => t.msgs[t.msgs.length - 1]?.n ?? 0;

/** Mới nhất lên đầu. */
export function sortedThreads(p: PhoneState): Thread[] {
  return [...p.threads].sort((a, b) => lastMsgN(b) - lastMsgN(a));
}

/** Chat của màn giới thiệu, đã đọc hết. */
export function seedIntro(p: PhoneState, chapters: readonly Chapter[]) {
  for (const c of chapters) {
    for (const b of c.beats) push(p, c.thread, b.from, b.text, c.at, b.attach);
    markRead(p, c.thread);
  }
}

export function beatToMsg(p: PhoneState, c: Chapter, b: Beat) {
  push(p, c.thread, b.from, b.text, c.at, b.attach);
  markRead(p, c.thread);
}

const repliesOf = (ev: PhoneEvent, vars?: Vars) =>
  typeof ev.replies === "function" ? ev.replies(vars ?? {}) : ev.replies;

export const eventById = (id: string): PhoneEvent | undefined => EVENTS.find((e) => e.id === id);

const money = (v: number) => `${v.toLocaleString("vi-VN")}₫`;

export const isTuition = (t: Thread) => t.pending?.ev === TUITION.id;

export function pendingEvent(t: Thread): { ev: PhoneEvent; options: { me: string }[] } | null {
  if (!t.pending) return null;
  if (isTuition(t)) {
    const amount = Number(t.pending.vars?.amount ?? 0);
    return { ev: { id: TUITION.id, from: "mom", text: "", when: () => false }, options: [{ me: `Gửi mẹ ${money(amount)}` }] };
  }
  const ev = eventById(t.pending.ev);
  const replies = ev && repliesOf(ev, t.pending.vars);
  if (!ev || !replies) return null;
  return { ev, options: replies.map((r) => ({ me: fill(r.me, t.pending!.vars) })) };
}

/** Trả lời bằng lựa chọn `i`; người kia đáp ngay nếu có. */
export function reply(w: SaveFile, threadId: string, i: number, at = stamp(w)): boolean {
  const t = w.phone.threads.find((x) => x.id === threadId);
  const pe = t && pendingEvent(t);
  if (!t || !pe) return false;
  if (isTuition(t)) return payTuition(w, t, at);
  const r = repliesOf(pe.ev, t.pending!.vars)![i];
  if (!r) return false;
  const vars = t.pending!.vars;
  delete t.pending;
  push(w.phone, threadId, ME, fill(r.me, vars), at);
  if (r.answer) push(w.phone, threadId, pe.ev.from, fill(r.answer, vars), at);
  markRead(w.phone, threadId);
  return true;
}

function payTuition(w: SaveFile, t: Thread, at: string): boolean {
  const vars = t.pending!.vars;
  const amount = Math.min(Number(vars?.amount ?? 0), w.money.cash);
  const n = Number(vars?.n ?? 0);
  delete t.pending;
  w.money.cash -= amount;
  w.econ.today.family += amount;
  push(w.phone, t.id, ME, `💸 Đã gửi ${money(amount)}`, at);
  push(w.phone, t.id, "mom", TUITION.answers[n % TUITION.answers.length], at);
  markRead(w.phone, t.id);
  return true;
}

function avgProfit(w: SaveFile): number {
  const rows = w.ledger.slice(-3);
  if (!rows.length) return 0;
  return rows.reduce((a, r) => a + r.revenue - r.cost, 0) / rows.length;
}

/** Mỗi tối có xác suất mẹ xin tiền học; cùng ngày cùng kết quả. */
function tuitionTick(w: SaveFile): { from: string; text: string } | null {
  const day = w.progress.dayIndex;
  const mom = thread(w.phone, "mom");
  if (mom.pending) return null;
  const last = w.phone.firedDay[TUITION.id] ?? -99;
  if (day - last < TUITION.minGapDays) return null;
  const rng = new Rng(splitmix32(fnv1a(`${w.saveId}|tuition|${day}`)));
  if (rng.next() >= TUITION.p) return null;
  const amount = Math.round(Math.min(TUITION.maxVnd, Math.max(TUITION.minVnd, avgProfit(w) * TUITION.share)) / 1000) * 1000;
  if (w.money.cash < amount * TUITION.cashMul) return null;
  const n = w.phone.fired.filter((x) => x === TUITION.id).length;
  w.phone.fired.push(TUITION.id);
  w.phone.firedDay[TUITION.id] = day;
  const text = fill(TUITION.asks[n % TUITION.asks.length], { amount: money(amount) });
  push(w.phone, "mom", "mom", text, stamp(w));
  mom.pending = { ev: TUITION.id, vars: { amount, n } };
  return { from: "mom", text };
}

export const stamp = (w: SaveFile): string => `Ngày ${w.progress.dayIndex}`;

/** Chạy cuối ngày; trả về các tin mới để báo. */
export function phoneTick(w: SaveFile, evening = false): { from: string; text: string }[] {
  const out: { from: string; text: string }[] = [];
  for (const ev of EVENTS) {
    if (w.phone.fired.includes(ev.id) || !ev.when(w)) continue;
    w.phone.fired.push(ev.id);
    w.phone.firedDay[ev.id] = w.progress.dayIndex;
    const vars = ev.vars?.(w);
    const text = fill(ev.text, vars);
    const m = push(w.phone, ev.from, ev.from, text, stamp(w));
    const post = ev.tin ? postTin(w, ev.tin) : null;
    if (post) m.link = post.id;
    if (ev.replies) thread(w.phone, ev.from).pending = { ev: ev.id, vars };
    out.push({ from: ev.from, text });
  }
  const t = evening ? tuitionTick(w) : null;
  if (t) out.push(t);
  return out;
}

/** Người quen nhắn kèm link một bài VietSoci. */
export function pushLink(w: SaveFile, from: string, text: string, post: number) {
  push(w.phone, from, from, text, stamp(w)).link = post;
}

export function addNote(w: SaveFile, text: string): Note | null {
  const t = text.trim().slice(0, NOTE_MAX);
  if (!t) return null;
  const note = { id: `n${++w.phone.seq}`, day: w.progress.dayIndex, text: t };
  w.phone.notes.unshift(note);
  return note;
}

export function editNote(w: SaveFile, id: string, text: string) {
  const n = w.phone.notes.find((x) => x.id === id);
  if (!n) return;
  const t = text.trim().slice(0, NOTE_MAX);
  if (t) n.text = t; else w.phone.notes = w.phone.notes.filter((x) => x.id !== id);
}

export function deleteNote(w: SaveFile, id: string) {
  w.phone.notes = w.phone.notes.filter((x) => x.id !== id);
}
