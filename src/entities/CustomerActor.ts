import Phaser from "phaser";
import { depthOf, facingOf, toScreen, type Facing } from "../world/iso";
import { BODY_H, FX, buildBody, footY, textureFor } from "../art";
import type { Customer } from "../sim/customer";
import { nowState } from "../sim/perception";
import { FONT, UI } from "../ui/theme";

/**
 * Phần NHÌN THẤY của một người khách.
 *
 * CANON §5 bắt buộc mỗi mức `certainty` phải có biểu hiện hình ảnh:
 *   GLIMPSED  → quay đầu, dấu `?` nhỏ
 *   NOTICED   → nhíu mày (ở đây: chấm cảnh báo)
 *   CONFIRMED → phản ứng đầy đủ (bong bóng thoại)
 * Không có thanh kiên nhẫn dạng số — trụ cột T3. Sốt ruột đọc qua DÁNG:
 * đứng yên → nhấp nhổm → khoanh tay nghiêng người.
 */
export class CustomerActor {
  private body: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Image;
  private bubble: Phaser.GameObjects.Container;
  private bubbleBg: Phaser.GameObjects.Graphics;
  private bubbleText: Phaser.GameObjects.Text;
  private mark: Phaser.GameObjects.Text;
  private tag: Phaser.GameObjects.Text;

  private facing: Facing = "n";
  private lastX: number;
  private lastY: number;
  private bob = 0;

  constructor(scene: Phaser.Scene, private c: Customer) {
    // Texture nướng theo `memKey` (dáng người), không theo `id` (duy nhất mỗi lượt ghé) —
    // nếu không thì Chú Tư ghé hai lần là nướng lại hai bộ sprite y hệt nhau.
    if (!scene.textures.exists(`${c.memKey}_s`)) buildBody(scene, c.memKey, c.body);

    this.shadow = scene.add.image(0, 0, FX.shadow).setOrigin(0.5, 0.5);
    this.body = scene.add.image(0, 0, textureFor("n", c.memKey).key).setOrigin(0.5, 1);

    this.tag = scene.add.text(0, 0, c.name, {
      fontFamily: FONT, fontSize: "10px", fontStyle: "500", color: "#f2efe6",
    }).setOrigin(0.5);

    this.mark = scene.add.text(0, 0, "", {
      fontFamily: FONT, fontSize: "16px", fontStyle: "700", color: "#ffd98a",
    }).setOrigin(0.5);

    this.bubbleBg = scene.add.graphics();
    this.bubbleText = scene.add.text(0, 0, "", {
      fontFamily: FONT, fontSize: "12px", color: UI.ink, align: "center",
      wordWrap: { width: 190 },
    }).setOrigin(0.5);
    this.bubble = scene.add.container(0, 0, [this.bubbleBg, this.bubbleText]).setVisible(false);

    this.lastX = c.x;
    this.lastY = c.y;
  }

  draw(reducedMotion: boolean, time: number) {
    const c = this.c;
    const moved = Math.hypot(c.x - this.lastX, c.y - this.lastY);
    if (moved > 0.002) this.facing = facingOf(c.x - this.lastX, c.y - this.lastY);
    this.lastX = c.x;
    this.lastY = c.y;

    const { sx, sy } = toScreen(c.x, c.y);
    const depth = depthOf(c.x, c.y);
    const amp = reducedMotion ? 0 : 1;

    this.bob = moved > 0.002 ? this.bob + moved * 9 : 0;
    const hop = Math.abs(Math.sin(this.bob)) * 2.2 * amp;

    // sốt ruột thì nhấp nhổm tại chỗ — dáng nói thay cho con số
    const fidget = c.mood === "annoyed" ? Math.sin(time / 130) * 1.6 * amp
      : c.mood === "checking" ? Math.sin(time / 320) * 0.9 * amp : 0;

    const tex = textureFor(this.facing, c.memKey);
    this.body.setTexture(tex.key).setFlipX(tex.flip);
    this.body.setPosition(sx + fidget, footY(sy) - hop).setDepth(depth);
    this.body.setScale(1, 1 + Math.sin(this.bob * 2) * 0.02 * amp);
    this.shadow.setPosition(sx, sy).setDepth(depth - 1);

    this.tag.setPosition(sx, sy - BODY_H - 8).setDepth(depth + 1)
      .setAlpha(c.phase === "leaving" ? 0.45 : 0.9);

    // dấu nhận thấy: `?` khi mới liếc thấy, `!` khi đã chắc (CANON §5)
    const st = nowState(c);
    const glyph = !st ? "" : st.state === "GLIMPSED" ? "?" : st.state === "UNAWARE" ? "" : "!";
    this.mark.setText(glyph)
      .setColor(st?.state === "GLIMPSED" ? "#ffd98a" : "#ff9a7a")
      .setPosition(sx + 14, sy - BODY_H - 18 + Math.sin(time / 260) * 1.5 * amp)
      .setDepth(depth + 2);

    if (c.say) this.drawBubble(sx, sy, depth, c.say);
    else this.bubble.setVisible(false);
  }

  private drawBubble(sx: number, sy: number, depth: number, text: string) {
    this.bubbleText.setText(text);
    const w = Math.max(this.bubbleText.width + 20, 60);
    const h = this.bubbleText.height + 14;

    this.bubbleBg.clear();
    this.bubbleBg.fillStyle(0x0d1216, 0.2);
    this.bubbleBg.fillRoundedRect(-w / 2 + 2, -h / 2 + 3, w, h, 9);
    this.bubbleBg.fillStyle(UI.paper, 0.97);
    this.bubbleBg.fillRoundedRect(-w / 2, -h / 2, w, h, 9);
    this.bubbleBg.fillTriangle(-5, h / 2 - 1, 5, h / 2 - 1, 0, h / 2 + 8);

    this.bubbleText.setPosition(0, 0);
    this.bubble.setPosition(sx, sy - BODY_H - 40).setDepth(depth + 3).setVisible(true);
  }

  destroy() {
    this.body.destroy();
    this.shadow.destroy();
    this.tag.destroy();
    this.mark.destroy();
    this.bubble.destroy(true);
  }
}
