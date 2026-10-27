import Phaser from "phaser";

type Part = {
  rt: Phaser.GameObjects.RenderTexture; bg: Phaser.GameObjects.Rectangle;
  ox: number; oy: number; clip: Phaser.Display.Masks.GeometryMask | null;
};
type Layer = { img: Phaser.GameObjects.Image; clip: boolean };

/** Nền sàn và mọi lớp sáng nằm dưới vật động, gộp vào RenderTexture đúng thứ tự và blend như khi vẽ thẳng lên màn. */
export class FloorBake {
  private readonly parts: Part[] = [];
  private readonly layers: Layer[] = [];
  private readonly clipGfx: Phaser.GameObjects.Graphics[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    readonly rect: Phaser.Geom.Rectangle,
    private readonly ss: number,
    part: number,
    private readonly tiles: { draw(rt: Phaser.GameObjects.RenderTexture, ox: number, oy: number): void; destroy(): void },
  ) {
    for (let oy = 0; oy < rect.height; oy += part) {
      for (let ox = 0; ox < rect.width; ox += part) {
        const pw = Math.min(part, rect.width - ox), ph = Math.min(part, rect.height - oy);
        const rt = scene.add.renderTexture(rect.x + ox, rect.y + oy, Math.ceil(pw * ss), Math.ceil(ph * ss))
          .setOrigin(0, 0).setScale(1 / ss).setDepth(-1_000_000);
        const bg = new Phaser.GameObjects.Rectangle(scene, 0, 0, rt.width, rt.height, 0).setOrigin(0, 0);
        this.parts.push({ rt, bg, ox, oy, clip: null });
      }
    }
  }

  /** Ảnh không nằm trong display list; vẽ theo depth, `clip` thì cắt theo `clipTo`. */
  add(img: Phaser.GameObjects.Image, clip = false) {
    this.layers.push({ img, clip });
    return img;
  }

  clipTo(points: readonly { x: number; y: number }[]) {
    for (const p of this.parts) {
      const x0 = this.rect.x + p.ox, y0 = this.rect.y + p.oy;
      const gfx = this.scene.make.graphics({}, false).fillStyle(0xffffff).fillPoints(
        points.map((q) => new Phaser.Geom.Point((q.x - x0) * this.ss, (q.y - y0) * this.ss)), true);
      this.clipGfx.push(gfx);
      p.clip = gfx.createGeometryMask();
    }
  }

  /** Nền camera tô trước vì MULTIPLY/SCREEN trên màn cũng tác động lên nó. */
  paint(bg: number) {
    const ss = this.ss;
    const order = this.layers.filter((l) => l.img.visible).sort((a, b) => a.img.depth - b.img.depth);
    const renderer = this.scene.renderer as { setBlendMode(mode: number): unknown };
    for (const p of this.parts) {
      const { rt } = p;
      const x0 = this.rect.x + p.ox, y0 = this.rect.y + p.oy;
      rt.clear();
      rt.beginDraw();
      rt.batchDraw(p.bg.setFillStyle(bg), 0, 0);
      this.tiles.draw(rt, p.ox, p.oy);
      for (const { img, clip } of order) {
        const sx = img.scaleX, sy = img.scaleY;
        img.setScale(sx * ss, sy * ss);
        if (clip) img.setMask(p.clip!);
        rt.batchDraw(img, (img.x - x0) * ss, (img.y - y0) * ss);
        if (clip) img.clearMask();
        img.setScale(sx, sy);
      }
      // `endDraw` chép bản nháp sang texture bằng blend đang đặt.
      renderer.setBlendMode(Phaser.BlendModes.NORMAL);
      rt.endDraw();
    }
  }

  destroy() {
    for (const { img } of this.layers) img.destroy();
    this.layers.length = 0;
    for (const p of this.parts) {
      p.clip?.destroy();
      p.bg.destroy();
    }
    for (const g of this.clipGfx) g.destroy();
    this.clipGfx.length = 0;
    this.tiles.destroy();
  }
}
