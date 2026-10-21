// RNG tất định theo ngày (chống save-scum); ngoài `core/` cấm `Math.random()`, `tools/check-gates.ts` chặn.

export function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function splitmix32(x: number): number {
  let z = (x + 0x9e3779b9) >>> 0;
  z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
  z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
  return (z ^ (z >>> 16)) >>> 0;
}

/** PRNG theo bộ đếm: `counter` là toàn bộ trạng thái, lưu vào save là reload ra đúng dãy cũ. */
export class Rng {
  counter = 0;

  constructor(readonly seed: number) {}

  /** [0, 1) */
  next(): number {
    const x = splitmix32((this.seed + Math.imul(this.counter++, 0x9e3779b9)) >>> 0);
    return x / 4294967296;
  }

  skipTo(counter: number) {
    this.counter = counter;
  }

  range(lo: number, hi: number) {
    return lo + this.next() * (hi - lo);
  }

  int(lo: number, hiExclusive: number) {
    return lo + Math.floor(this.next() * (hiExclusive - lo));
  }

  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length)];
  }
}

/** Tách stream để rút thêm số ở hệ này không dịch chuỗi số của hệ khác. */
export const STREAMS = ["market", "npc-schedule", "dialog-shufflebag", "ambient", "event"] as const;
export type StreamName = typeof STREAMS[number];

export class RngHub {
  private streams = new Map<StreamName, Rng>();
  private saveId = "";
  private dayIndex = 0;
  daySeed = 0;

  beginDay(saveId: string, dayIndex: number) {
    this.saveId = saveId;
    this.dayIndex = dayIndex;
    this.daySeed = fnv1a(`${saveId}|${dayIndex}`);
    for (const name of STREAMS) this.streams.set(name, new Rng(splitmix32(this.daySeed ^ fnv1a(name))));
  }

  stream(s: StreamName): Rng {
    const r = this.streams.get(s);
    if (!r) throw new Error(`RngHub: chưa beginDay() mà đã rút stream '${s}'`);
    return r;
  }

  next(s: StreamName) { return this.stream(s).next(); }
  int(s: StreamName, n: number) { return Math.floor(this.next(s) * n); }
  pick<T>(s: StreamName, xs: readonly T[]): T { return xs[this.int(s, xs.length)]; }

  /** Dòng riêng sinh từ (daySeed, key): không cần lưu bộ đếm, không đụng stream chính. */
  derive(key: string): Rng {
    return new Rng(splitmix32(this.daySeed ^ fnv1a(`derive|${key}`)));
  }

  get day() { return this.dayIndex; }
  get id() { return this.saveId; }

  toJSON(): [StreamName, number][] {
    return [...this.streams].map(([k, v]) => [k, v.counter]);
  }

  fromJSON(saveId: string, dayIndex: number, counters: [StreamName, number][]) {
    this.beginDay(saveId, dayIndex);
    for (const [k, c] of counters) this.streams.get(k)?.skipTo(c);
  }
}

export type BagState = { o: number[]; l: number; r: number; t?: number };

export class ShuffleBag {
  private order: number[] = [];
  private lastDrawn = -1;
  refills = 0;
  touchedDay = 0;

  constructor(readonly n: number, state?: BagState) {
    if (state && state.o.every((i) => i < n)) {
      this.order = [...state.o];
      this.lastDrawn = state.l;
      this.refills = state.r;
      this.touchedDay = state.t ?? 0;
    }
  }

  draw(rng: Rng, day = 0): number {
    if (this.order.length === 0) this.refill(rng);
    this.touchedDay = day;
    return (this.lastDrawn = this.order.pop()!);
  }

  private refill(rng: Rng) {
    const n = this.n;
    this.order = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) {
      const j = rng.int(0, i + 1);
      [this.order[i], this.order[j]] = [this.order[j], this.order[i]];
    }
    // Mép túi: hoán vị tại chỗ chứ không trộn lại, trộn lại tiêu số RNG không đoán được.
    if (n > 1 && this.order[n - 1] === this.lastDrawn) {
      [this.order[n - 1], this.order[n - 2]] = [this.order[n - 2], this.order[n - 1]];
    }
    this.refills++;
  }

  toJSON(): BagState {
    return { o: [...this.order], l: this.lastDrawn, r: this.refills, t: this.touchedDay };
  }
}

/** Bag không được rút trong ngần này ngày thì xoá khỏi save. */
export const SHUFFLEBAG_GC_DAYS = 7;

export function gcBags(bags: Record<string, BagState>, today: number) {
  for (const [k, b] of Object.entries(bags)) {
    if (today - (b.t ?? 0) > SHUFFLEBAG_GC_DAYS) delete bags[k];
  }
}
