import Phaser from "phaser";
import { FX, buildBody, footY, textureFor } from "../../art";
import { artScale } from "../../art/photo";
import { NPCS } from "../../content/npcs";
import { depthOf, toScreen } from "../../world/iso";
import { GOSSIP_CORNER } from "../../world/map";
import { OVERHEAR_FROM, type OverhearScene, type Tier } from "../../sim/overhear";
import type { BubblePool } from "./BubblePool";

const OVERLAY_DEPTH = 8_100_000;

/**
 * Góc hẻm — sân khấu nghe lỏm (P2-04 §2.7). Hai người `fade-in` vào chỗ, nói ba câu, rồi
 * `fade-out`. KHÔNG pathing (Đừng-1). Không badge, không chấm đỏ, không popup "tin đồn
 * mới!" (§4 quy tắc 1): thứ DUY NHẤT báo hiệu là hai chấm `..` nhỏ trên góc hẻm — một chi
 * tiết môi trường, và nó vẫn còn khi bật giảm chuyển động (thành dấu tĩnh).
 */
export class GossipCorner {
  private a: Phaser.GameObjects.Image;
  private b: Phaser.GameObjects.Image;
  private sa: Phaser.GameObjects.Image;
  private sb: Phaser.GameObjects.Image;
  private dots: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, readonly sc: OverhearScene, private bubbles: BubblePool) {
    for (const id of [sc.plan.a, sc.plan.b]) {
      const npc = NPCS.find((n) => n.id === id);
      if (npc && !scene.textures.exists(`${id}_s`)) buildBody(scene, id, npc.body);
    }
    const [pa, pb] = GOSSIP_CORNER;
    const A = toScreen(pa.x, pa.y), B = toScreen(pb.x, pb.y);
    const ta = textureFor("e", sc.plan.a), tb = textureFor("w", sc.plan.b);
    this.sa = scene.add.image(A.sx, A.sy, FX.shadow).setDepth(depthOf(pa.x, pa.y) - 1).setAlpha(0);
    this.sb = scene.add.image(B.sx, B.sy, FX.shadow).setDepth(depthOf(pb.x, pb.y) - 1).setAlpha(0);
    // `setScale(1 / artScale)` cùng lý do với `Player.ts` và `CustomerActor.ts`: người
    // đã có bảng xoay ảnh thật thì texture nướng dư pixel, người chưa có thì `artScale`
    // trả 1. Hai người đứng tám chuyện mà cao gấp `ART_SS` lần thì che hết góc hẻm.
    this.a = scene.add.image(A.sx, footY(A.sy), ta.key).setOrigin(0.5, 1).setFlipX(ta.flip).setDepth(depthOf(pa.x, pa.y)).setAlpha(0).setScale(1 / artScale(ta.key));
    this.b = scene.add.image(B.sx, footY(B.sy), tb.key).setOrigin(0.5, 1).setFlipX(tb.flip).setDepth(depthOf(pb.x, pb.y)).setAlpha(0).setScale(1 / artScale(tb.key));
    this.dots = scene.add.graphics().setDepth(OVERLAY_DEPTH);
  }

  draw(tier: Tier, minutes: number, time: number, reducedMotion: boolean) {
    const sc = this.sc;
    const alpha = sc.state === "PLAY" ? sc.fade : 0;
    for (const o of [this.a, this.b, this.sa, this.sb]) o.setAlpha(alpha);
    this.dots.clear();
    // hai chấm `..` — hiện từ ngay trước lõm khách tới hết cảnh
    if ((sc.state === "WAIT" && minutes >= OVERHEAR_FROM - 10) || sc.state === "PLAY") {
      const [pa, pb] = GOSSIP_CORNER;
      const m = toScreen((pa.x + pb.x) / 2, (pa.y + pb.y) / 2);
      const pulse = reducedMotion ? 0.8 : 0.45 + 0.35 * Math.sin(time / 300);
      this.dots.fillStyle(0xf2efe9, pulse).fillCircle(m.sx - 4, footY(m.sy) - 70, 2.2).fillCircle(m.sx + 4, footY(m.sy) - 70, 2.2);
    }
    if (sc.state !== "PLAY") { this.bubbles.release("corner", reducedMotion); return; }
    const who = sc.speaker === sc.plan.a ? this.a : this.b;
    const bub = this.bubbles.acquire("corner");
    bub.setText(sc.text(tier));
    // tầng 0: bubble mờ, chỉ có dấu hiệu — người chơi biết CÓ chuyện, không biết chuyện gì
    bub.place(who.x, who.y - 72, OVERLAY_DEPTH + 2, tier === 0 ? 0.8 : 1, reducedMotion);
  }

  destroy() {
    for (const o of [this.a, this.b, this.sa, this.sb, this.dots]) o.destroy();
    this.bubbles.release("corner", true);
  }
}
