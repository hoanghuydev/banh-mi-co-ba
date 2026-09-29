/**
 * `applycontext` — P2-01 §2.6: rule ghi fact `ctx*` lên một người, có hạn giờ.
 * Đây là toàn bộ cơ chế "nhớ chuyện vừa xảy ra" của rule DB — running gag, cooldown
 * tier-1, "đã thấy rớt bánh hôm nay".
 *
 *   duration > 0  → hết hạn sau ngần ấy giây THẬT
 *   duration = 0  → chỉ đúng trong tick này (đóng một chuỗi thoại)
 *   duration = −1 → tới hết ngày
 *
 * Hết hạn kiểm LƯỜI lúc dựng query — không có timer nào. Sang ngày mới là xoá sạch.
 * Nằm trong save (`dialogState.appliedContext`) để reload giữa buổi không mất.
 */
import type { Query } from "./facts";

export type CtxEntry = { key: string; value: unknown; expiresAtMinutes: number };

type Live = { fact: string; value: number; expireAt: number };

export class ContextStore {
  private map = new Map<string, Live[]>();

  /**
   * Save lưu số giây CÒN LẠI (−1 = tới hết ngày) kèm ngày — đồng hồ giây của buổi bán
   * chạy lại từ 0 sau reload, nên lưu mốc tuyệt đối là sai.
   */
  constructor(private day: number, saved: CtxEntry[] = [], now = 0) {
    for (const e of saved) {
      const v = e.value as { npc: string; fact: string; value: number; day: number; left: number };
      if (!v || v.day !== day) continue;
      this.put(v.npc, v.fact, v.value, v.left < 0 ? Infinity : now + v.left);
    }
  }

  private put(npc: string, fact: string, value: number, expireAt: number) {
    let l = this.map.get(npc);
    if (!l) this.map.set(npc, (l = []));
    const i = l.findIndex((x) => x.fact === fact);
    if (i >= 0) l[i] = { fact, value, expireAt }; else l.push({ fact, value, expireAt });
  }

  /** Ghi từ `applycontext` của một rule vừa nói. `now` = giây thật trong buổi. */
  apply(npc: string, fact: string, value: number, durationSec: number, now: number) {
    const expireAt = durationSec < 0 ? Infinity : durationSec === 0 ? now : now + durationSec;
    this.put(npc, fact, value, expireAt);
  }

  /** Đổ các ctx còn hạn của người này vào query. */
  write(q: Query, npc: string, now: number) {
    const l = this.map.get(npc);
    if (!l) return;
    for (let i = l.length - 1; i >= 0; i--) {
      const e = l[i];
      if (e.expireAt < now) { l.splice(i, 1); continue; }
      q.set(e.fact, e.value);
    }
  }

  toJSON(now: number): CtxEntry[] {
    const out: CtxEntry[] = [];
    for (const [npc, l] of this.map) {
      for (const e of l) {
        if (e.expireAt < now) continue;
        const left = e.expireAt === Infinity ? -1 : e.expireAt - now;
        out.push({ key: `${npc}|${e.fact}`, value: { npc, fact: e.fact, value: e.value, day: this.day, left }, expiresAtMinutes: 0 });
      }
    }
    return out;
  }
}
