/**
 * RNG có seed — CANON §8(e): seed cố định theo ngày để chống save-scum.
 * mulberry32: nhỏ, nhanh, đủ tốt cho game; quan trọng là tái lập được.
 */
export class Rng {
  private s: number;

  constructor(seed: number) {
    this.s = seed >>> 0;
  }

  /** Seed ổn định cho một ngày trong mùa của một lượt chơi. */
  static forDay(saveSeed: number, day: number) {
    return new Rng((saveSeed * 0x9e3779b1 + day * 0x85ebca6b) >>> 0);
  }

  /**
   * Seed ổn định theo MÙA cho một thứ có tên — không phụ thuộc ngày.
   * Dùng cho những thứ phải giống nhau suốt 40 ngày, ví dụ đơn "ruột" của mỗi khách:
   * sinh lại mỗi sáng thì "cho cô như mọi bữa" thành vô nghĩa.
   */
  static forSeason(saveSeed: number, name: string) {
    let h = 2166136261;
    for (let i = 0; i < name.length; i++) {
      h ^= name.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return new Rng((saveSeed * 0x9e3779b1 ^ h) >>> 0);
  }

  next() {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
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
 * Shuffle-bag — CANON §11: "đòn bẩy rẻ nhất dự án".
 * 8 biến thể qua shuffle-bag ≈ cảm giác của ~25–30 dòng random thuần,
 * vì không bao giờ lặp lại ngay lập tức.
 */
export class ShuffleBag<T> {
  private bag: T[] = [];

  constructor(private items: readonly T[], private rng: Rng) {}

  take(): T {
    if (this.bag.length === 0) {
      this.bag = [...this.items];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = this.rng.int(0, i + 1);
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop()!;
  }
}
