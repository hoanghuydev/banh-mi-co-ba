/**
 * Cảnh NGHE LỎM ở góc hẻm — P2-04 §2.7, điều kiện tồn tại của cả hệ đồn thổi (CANON §12
 * RB4: "không có nghe lỏm thì bỏ luôn cả nhớ nhầm lẫn đồn thổi").
 *
 * Logic thuần (không Phaser). Cảnh của đêm `d` diễn ra sáng `d+1`, trong một LÕM khách
 * (8h15–10h30, không bao giờ trong cao điểm), tối đa 1 cảnh/ngày, dùng ĐÚNG tin vừa lan
 * đêm trước — không sinh thêm thông tin nào hệ thống chưa có (không farm được).
 *
 * Ba tầng nghe, ánh xạ thẳng từ việc người chơi đang làm (§2.7 bảng quan trọng nhất):
 *   0 — tay đang bận            → chỉ biết CÓ người nói chuyện ("· · ·")
 *   1 — dừng tay, đứng yên       → nghe NỘI DUNG, tên nguồn thành "…"
 *   2 — đứng yên + nghiêng người → nghe ĐỦ cả nguồn (giá: khách trước quầy thấy mình lơ đễnh)
 */
import type { OverhearPlan } from "./gossip";

export const OVERHEAR_FROM = 8 * 60 + 15;
export const OVERHEAR_UNTIL = 10 * 60 + 30;
export type Tier = 0 | 1 | 2;

export class OverhearScene {
  state: "WAIT" | "PLAY" | "DONE" = "WAIT";
  line = 0;
  /** Giây đã đọc của dòng hiện tại. */
  private t = 0;
  /** Mức nghe CAO NHẤT người chơi đạt được trong cả cảnh — P2-05 ghi nhật ký theo mức này. */
  best: Tier = 0;
  /** Mức nghe cao nhất ở dòng đầu (dòng có tên nguồn). */
  bestFirst: Tier = 0;
  fade = 0;

  constructor(readonly plan: OverhearPlan, private opts: { reducedMotion: boolean; noTimePressure: boolean }) {}

  /** Thời gian đọc một dòng: đủ đọc 3 bubble ở cỡ chữ 200%; giảm chuyển động ×1,5. */
  private dur(i: number) {
    const s = Math.max(4.5, 1.6 + 0.07 * this.plan.lines[i].length);
    return s * (this.opts.reducedMotion ? 1.5 : 1);
  }

  /** Trả true đúng frame cảnh kết thúc (để phát event một lần). */
  tick(dt: number, ctx: { minutes: number; quiet: boolean; tier: Tier }): boolean {
    if (this.state === "DONE") return false;
    if (this.state === "WAIT") {
      if (ctx.minutes > OVERHEAR_UNTIL) { this.state = "DONE"; return false; }   // hôm nay đông quá — lỡ
      if (ctx.minutes >= OVERHEAR_FROM && ctx.quiet) this.state = "PLAY";
      return false;
    }
    this.fade = Math.min(1, this.fade + dt / 0.6);
    if (ctx.tier > this.best) this.best = ctx.tier;
    if (this.line === 0 && ctx.tier > this.bestFirst) this.bestFirst = ctx.tier;
    // CANON §15.2 không giới hạn thời gian: cảnh KHÔNG tự hết — chỉ trôi khi người chơi đang nghe
    if (!(this.opts.noTimePressure && ctx.tier === 0)) this.t += dt;
    if (this.t >= this.dur(this.line)) {
      this.t = 0;
      this.line++;
      if (this.line >= 3) { this.state = "DONE"; return true; }
    }
    return false;
  }

  /** Chữ trong bubble ở mức nghe hiện tại. */
  text(tier: Tier): string {
    if (tier === 0) return "· · ·";
    if (this.line === 0 && tier === 1 && this.plan.source) return this.plan.hiddenA;
    return this.plan.lines[this.line];
  }

  get speaker() { return this.line === 1 ? this.plan.b : this.plan.a; }
}
