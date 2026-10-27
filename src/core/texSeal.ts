import type Phaser from "phaser";

type Source = Phaser.Textures.TextureSource;
type GlRenderer = Phaser.Renderer.WebGL.WebGLRenderer;

/** Texture tĩnh đã lên GPU, canvas CPU đã thu về 0. */
const sealed = new WeakSet<Source>();
let fbo: WebGLFramebuffer | null = null;
let last: { src: Source; canvas: HTMLCanvasElement } | null = null;

const free = (c: HTMLCanvasElement) => { c.width = c.height = 0; };

/** Chép ngược từ GPU; kênh alpha giữ nguyên, màu ở điểm nửa trong suốt có thể lệch 1/255. */
function restore(src: Source): HTMLCanvasElement {
  if (last?.src === src) return last.canvas;
  if (last) free(last.canvas);
  const renderer = src.renderer as GlRenderer;
  const gl = renderer.gl;
  const { width: w, height: h } = src;
  fbo ??= gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, src.glTexture!.webGLTexture, 0);
  const px = new Uint8ClampedArray(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, renderer.currentFramebuffer?.webGLFramebuffer ?? null);
  // Texture lưu màu đã nhân alpha, `putImageData` nhận màu chưa nhân.
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3];
    if (a === 255 || a === 0) continue;
    px[i] = Math.round((px[i] * 255) / a);
    px[i + 1] = Math.round((px[i + 1] * 255) / a);
    px[i + 2] = Math.round((px[i + 2] * 255) / a);
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.putImageData(new ImageData(px, w, h), 0, 0);
  last = { src, canvas };
  return canvas;
}

/** Ảnh nguồn của frame; texture đã niêm thì chép ngược từ GPU (giữ tới lần đọc texture khác). */
export function sourceImage(frame: Phaser.Textures.Frame): CanvasImageSource & { width: number; height: number } {
  const src = frame.source;
  return sealed.has(src) ? restore(src) : src.image as HTMLCanvasElement;
}

/** Thu canvas CPU của texture vẽ xong, không vẽ lại nữa; ai đọc qua `getSourceImage` vẫn được ảnh y như cũ. */
export function sealTexture(textures: Phaser.Textures.TextureManager, key: string) {
  if (!textures.exists(key)) return;
  for (const src of textures.get(key).source) {
    if (!src.isCanvas || !src.glTexture || !(src.renderer as GlRenderer | null)?.gl || sealed.has(src)) continue;
    sealed.add(src);
    if (last?.src === src) { free(last.canvas); last = null; }
    free(src.image as HTMLCanvasElement);
  }
}

/** Phải chạy trước khi dựng game. */
export function installTexSeal(P: typeof Phaser) {
  const T = P.Textures.Texture.prototype as unknown as { getSourceImage(this: Phaser.Textures.Texture, name?: string): unknown };
  const get = T.getSourceImage;
  T.getSourceImage = function (name) {
    const img = get.call(this, name);
    const src = this.source.find((s) => s.image === img);
    return src && sealed.has(src) ? restore(src) : img;
  };
  const S = P.Textures.TextureSource.prototype as unknown as { update(this: Source): void };
  const update = S.update;
  S.update = function () {
    if (!sealed.has(this)) return update.call(this);
    if (import.meta.env.DEV) console.error(`texture đã niêm, không tải lại được: ${this.texture?.key}`);
  };
}
