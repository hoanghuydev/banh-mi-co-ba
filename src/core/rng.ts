/**
 * RNG tất định — P0-02 §2.3. CANON §8(e): seed cố định theo ngày để chống save-scum.
 *
 *   daySeed          = fnv1a(`${saveId}|${dayIndex}`)
 *   streamSeed(name) = splitmix32(daySeed ^ fnv1a(name))
 *
 * Vì sao splitmix32: nó là PRNG theo BỘ ĐẾM — số thứ n chỉ phụ thuộc (seed, n), nên
 * nhảy tới lần gọi thứ n là O(1). Reload giữa ngày chỉ cần lưu bộ đếm của từng stream.
 *
 * LUẬT (CANON §8.1): không file nào ngoài `core/` được gọi `Math.random()`.
 * `tools/check-gates.ts` chặn điều đó.
 */

/** FNV-1a 32-bit. Dùng cho seed, cho checksum save, cho khoá bag. */
export function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Hàm trộn của splitmix32 — một số vào, một số ra, không trạng thái. */
export function splitmix32(x: number): number {
  let z = (x + 0x9e3779b9) >>> 0;
  z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
  z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
  return (z ^ (z >>> 16)) >>> 0;
}

/**
 * Một dòng số ngẫu nhiên. `counter` là toàn bộ trạng thái ngoài seed —
 * lưu nó vào save là reload giữa ngày ra đúng dãy số cũ.
 */
export class Rng {
  counter = 0;

  constructor(readonly seed: number) {}

  /**
   * Seed ổn định theo MÙA cho một thứ có tên — không phụ thuộc ngày.
   * Dùng cho những thứ phải giống nhau suốt 40 ngày, ví dụ đơn "ruột" của mỗi khách:
   * sinh lại mỗi sáng thì "cho cô như mọi bữa" thành vô nghĩa.
   */
  static forSeason(saveId: string, name: string) {
    return new Rng(splitmix32(fnv1a(`${saveId}|season`) ^ fnv1a(name)));
  }

  /** [0, 1) */
  next(): number {
    const x = splitmix32((this.seed + Math.imul(this.counter++, 0x9e3779b9)) >>> 0);
    return x / 4294967296;
  }

  /** Nhảy tới lần gọi thứ n — O(1), không phải chạy lại n bước. */
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

/**
 * Sáu stream độc lập — P0-02 §2.3. Tách stream là ĐIỀU KIỆN của chống save-scum:
 * một hành động vô hại ở hệ này (hỏi thêm một câu → rút thêm vài số thoại) không
 * được phép dịch chuỗi số của hệ khác (tin đồn tối nay, ai tới quán ngày mai).
 */
export const STREAMS = ["market", "npc-schedule", "dialog-shufflebag", "gossip", "ambient", "event"] as const;
export type StreamName = typeof STREAMS[number];

export class RngHub {
  private streams = new Map<StreamName, Rng>();
  private saveId = "";
  private dayIndex = 0;
  daySeed = 0;

  /** Gọi lúc `day:started`. Reset TẤT CẢ stream về đầu ngày. */
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

  /**
   * Một dòng số RIÊNG cho một thứ có tên trong ngày (một lượt khách, một con bot test).
   * Không có bộ đếm trong save: nó sinh ra từ (daySeed, key) nên dựng lại lúc nào
   * cũng ra đúng dãy đó — và việc nó tiêu bao nhiêu số không đụng tới 6 stream chính.
   */
  derive(key: string): Rng {
    return new Rng(splitmix32(this.daySeed ^ fnv1a(`derive|${key}`)));
  }

  get day() { return this.dayIndex; }
  get id() { return this.saveId; }

  /** Bộ đếm phải vào save — reload giữa ngày không được reset về đầu ngày. */
  toJSON(): [StreamName, number][] {
    return [...this.streams].map(([k, v]) => [k, v.counter]);
  }

  fromJSON(saveId: string, dayIndex: number, counters: [StreamName, number][]) {
    this.beginDay(saveId, dayIndex);
    for (const [k, c] of counters) this.streams.get(k)?.skipTo(c);
  }
}

/**
 * Shuffle-bag — P0-02 §2.4, CANON §11: "đòn bẩy rẻ nhất dự án".
 * 8 biến thể qua shuffle-bag ≈ cảm giác của ~25–30 dòng random thuần.
 *
 * Ba chi tiết dễ làm sai, cả ba được giữ ở đây:
 *  1. Luật MÉP TÚI: phần tử rút đầu của túi mới không được trùng phần tử rút cuối
 *     của túi cũ. Sửa bằng HOÁN VỊ TẠI CHỖ, không trộn lại (trộn lại tiêu thêm số
 *     RNG với số lần không đoán được → mất tất định).
 *  2. Trộn lúc REFILL, không lúc draw: mỗi lần refill tiêu đúng `n-1` số.
 *  3. Bag sống qua ngày và qua reload — `toJSON()` vào save.
 */
export type BagState = { o: number[]; l: number; r: number; t?: number };

export class ShuffleBag {
  private order: number[] = [];
  private lastDrawn = -1;
  refills = 0;
  /** Ngày cuối cùng bag này được rút — để dọn bag bỏ hoang khỏi save (§2.4). */
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
    if (n > 1 && this.order[n - 1] === this.lastDrawn) {
      [this.order[n - 1], this.order[n - 2]] = [this.order[n - 2], this.order[n - 1]];
    }
    this.refills++;
  }

  toJSON(): BagState {
    return { o: [...this.order], l: this.lastDrawn, r: this.refills, t: this.touchedDay };
  }
}

/** Bag không được chạm trong ngần này ngày game thì xoá khỏi save (P0-02 §2.4). */
export const SHUFFLEBAG_GC_DAYS = 7;

export function gcBags(bags: Record<string, BagState>, today: number) {
  for (const [k, b] of Object.entries(bags)) {
    if (today - (b.t ?? 0) > SHUFFLEBAG_GC_DAYS) delete bags[k];
  }
}
