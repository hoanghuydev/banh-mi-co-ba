import Phaser from "phaser";

/** Tín hiệu DUY NHẤT của `warmth`: tắt khói = đưa ra là khách chê nguội. */
export class Steam {
  private g: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, fixedToScreen = false) {
    this.g = scene.add.graphics();
    if (fixedToScreen) this.g.setScrollFactor(0);
  }

  get graphics() { return this.g; }

  draw(x: number, y: number, depth: number, time: number, on: boolean, reducedMotion: boolean, scale = 1) {
    this.g.clear();
    if (!on) return;
    this.g.setDepth(depth);
    for (let i = 0; i < 3; i++) {
      const phase = reducedMotion ? 0.45 : ((time / 1400 + i / 3) % 1);
      const baseX = x + (i - 1) * 7 * scale;
      const rise = phase * 16 * scale;
      this.g.lineStyle(2 * scale, 0xffffff, 0.55 * (1 - phase));
      this.g.beginPath();
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        const px = baseX + Math.sin(t * Math.PI * 2 + i) * 2.4 * scale;
        const py = y - rise - t * 12 * scale;
        if (k === 0) this.g.moveTo(px, py); else this.g.lineTo(px, py);
      }
      this.g.strokePath();
    }
  }

  destroy() {
    this.g.destroy();
  }
}
