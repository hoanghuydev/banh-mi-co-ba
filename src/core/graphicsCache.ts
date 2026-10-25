// Phaser WebGL dựng lại đường cong và chạy earcut cho mọi Graphics mỗi frame dù lệnh vẽ không đổi;
// ở đây chép lại đỉnh đã ghi vào bộ đệm, chỉ sửa toạ độ khi vật dời và số texture unit theo batch hiện tại.
import Phaser from "phaser";

type Matrix = { a: number; b: number; c: number; d: number; e: number; f: number };

type Take = {
  cam: Phaser.Cameras.Scene2D.Camera;
  alpha: number;
  pipe: any;
  rec: Rec | null;
};

type Rec = {
  /** Ma trận lúc ghi: còn y nguyên thì chép thẳng đỉnh, khác thì đổi toạ độ bằng ma trận chênh. */
  m: Float64Array;
  /** Đỉnh đúng như trong bộ đệm của pipeline. */
  verts: Uint32Array;
  /** Toạ độ chưa làm tròn float32 của từng đỉnh, dùng khi vật dời. */
  pos: Float64Array;
  /** Số đỉnh từng hình (3 hoặc 6) để flush đúng chỗ Phaser flush. */
  sizes: Uint8Array;
  /** Texture unit chung của mọi đỉnh lúc ghi; NaN nếu lẫn. */
  unit: number;
  stride: number;
};

type Cache = { cmds: unknown[]; takes: Take[] };

const sameCmds = (a: unknown[], b: unknown[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

/** Cài một lần trước `new Phaser.Game`. */
export function installGraphicsCache() {
  const G = Phaser.GameObjects.Graphics.prototype as any;
  const native = G.renderWebGL;
  const getCalc = (Phaser.GameObjects as any).GetCalcMatrix;
  const WP = Phaser.Renderer.WebGL.WebGLPipeline.prototype as any;

  const plain = (pipe: any) => pipe.batchTri === WP.batchTri && pipe.batchQuad === WP.batchQuad && pipe.onBatch === WP.onBatch;

  /** Vẽ thường và chép lại mọi đỉnh vừa sinh; `null` nếu có texture thật hoặc pipeline lạ. */
  function record(pipe: any, m: Matrix, run: () => void): Rec | null {
    const mat = Float64Array.of(m.a, m.b, m.c, m.d, m.e, m.f);
    if (!plain(pipe)) { run(); return null; }
    const stride: number = pipe.currentShader.vertexComponentCount;
    let verts = new Uint32Array(stride * 384), pos = new Float64Array(2 * 384);
    const sizes: number[] = [];
    let n = 0, unit = -1, ok = true;
    /** Chép k đỉnh vừa ghi vào bộ đệm; trả chỗ ghi toạ độ trong `pos`. */
    const keep = (k: number) => {
      if (n + k > pos.length / 2) {
        const v2 = new Uint32Array(verts.length * 2); v2.set(verts); verts = v2;
        const p2 = new Float64Array(pos.length * 2); p2.set(pos); pos = p2;
      }
      const at = (pipe.vertexCount - k) * stride, u32 = pipe.vertexViewU32, f32 = pipe.vertexViewF32;
      for (let i = 0, o = n * stride; i < k * stride; i++) verts[o + i] = u32[at + i];
      for (let i = 0; i < k; i++) {
        const u = f32[at + i * stride + 4];
        unit = unit === -1 || unit === u ? u : NaN;
      }
      sizes.push(k);
      n += k;
      return (n - k) * 2;
    };
    pipe.batchTri = function (go: unknown, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) {
      if (go || arguments[15] !== undefined || arguments[16] !== undefined) ok = false;
      const r = WP.batchTri.apply(this, arguments);
      const o = keep(3);
      pos[o] = x0; pos[o + 1] = y0; pos[o + 2] = x1; pos[o + 3] = y1; pos[o + 4] = x2; pos[o + 5] = y2;
      return r;
    };
    pipe.batchQuad = function (go: unknown, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
      if (go || arguments[18] !== undefined || arguments[19] !== undefined) ok = false;
      const r = WP.batchQuad.apply(this, arguments);
      const o = keep(6);
      pos[o] = x0; pos[o + 1] = y0; pos[o + 2] = x1; pos[o + 3] = y1; pos[o + 4] = x2; pos[o + 5] = y2;
      pos[o + 6] = x0; pos[o + 7] = y0; pos[o + 8] = x2; pos[o + 9] = y2; pos[o + 10] = x3; pos[o + 11] = y3;
      return r;
    };
    try { run(); } finally { delete pipe.batchTri; delete pipe.batchQuad; }
    if (!ok || stride !== 7) return null;
    return {
      m: mat,
      verts: verts.slice(0, n * stride), pos: pos.slice(0, n * 2), sizes: Uint8Array.from(sizes), unit, stride,
    };
  }

  /** Đúng thứ tự Phaser làm trong `batchTri`: hết chỗ thì flush, chưa có batch thì lấy unit của texture trắng. */
  function replay(pipe: any, t: Rec, m: Matrix) {
    const r = t.m, S = t.stride, sizes = t.sizes, total = t.pos.length / 2;
    let a = 1, b = 0, c = 0, d = 1, e = 0, f = 0;
    const moved = m.a !== r[0] || m.b !== r[1] || m.c !== r[2] || m.d !== r[3] || m.e !== r[4] || m.f !== r[5];
    if (moved) {
      const det = r[0] * r[3] - r[1] * r[2];
      const ia = r[3] / det, ib = -r[1] / det, ic = -r[2] / det, id = r[0] / det;
      const ie = (r[2] * r[5] - r[3] * r[4]) / det, iff = (r[1] * r[4] - r[0] * r[5]) / det;
      a = m.a * ia + m.c * ib; b = m.b * ia + m.d * ib;
      c = m.a * ic + m.c * id; d = m.b * ic + m.d * id;
      e = m.a * ie + m.c * iff + m.e; f = m.b * ie + m.d * iff + m.f;
    }
    let v = 0, p = 0;
    while (v < total) {
      if (pipe.vertexCount + sizes[p] > pipe.vertexCapacity) pipe.flush();
      const unit = pipe.currentBatch ? pipe.currentUnit : pipe.setTexture2D();
      const room = pipe.vertexCapacity - pipe.vertexCount;
      let end = v;
      while (p < sizes.length && end + sizes[p] - v <= room) end += sizes[p++];
      const off = pipe.vertexCount * S;
      pipe.vertexViewU32.set(t.verts.subarray(v * S, end * S), off);
      const f32 = pipe.vertexViewF32, pos = t.pos;
      if (moved) {
        for (let i = v, o = off; i < end; i++, o += S) {
          const x = pos[i * 2], y = pos[i * 2 + 1];
          f32[o] = x * a + y * c + e;
          f32[o + 1] = x * b + y * d + f;
        }
      }
      if (unit !== t.unit) for (let o = off + 4, z = off + (end - v) * S; o < z; o += S) f32[o] = unit;
      pipe.vertexCount += end - v;
      pipe.currentBatch.count = pipe.vertexCount - pipe.currentBatch.start;
      v = end;
    }
  }

  G.renderWebGL = function (this: any, renderer: any, src: any, camera: any, parentMatrix: any) {
    const cmds: unknown[] = src.commandBuffer;
    if (cmds.length === 0) return;
    const cache: Cache | undefined = src.__gfxCache;
    // Lệnh vừa đổi thì vẽ thường; chỉ ghi khi hai frame liền nhau giống nhau, để thứ đổi liên tục không tốn thêm.
    if (!cache || !sameCmds(cache.cmds, cmds)) {
      if (!cache) src.__gfxCache = { cmds: cmds.slice(), takes: [] };
      else {
        cache.cmds.length = cmds.length;
        for (let k = 0; k < cmds.length; k++) cache.cmds[k] = cmds[k];
        cache.takes.length = 0;
      }
      return native.call(this, renderer, src, camera, parentMatrix);
    }
    const alpha = camera.alpha * src.alpha;
    const pipe = renderer.pipelines.set(src.pipeline, src);
    const i = cache.takes.findIndex((t) => t.cam === camera);
    const take = i < 0 ? null : cache.takes[i];
    if (take && take.alpha === alpha && take.pipe === pipe) {
      const rec = take.rec;
      if (!rec || rec.stride !== pipe.currentShader.vertexComponentCount) return native.call(this, renderer, src, camera, parentMatrix);
      camera.addToRenderList(src);
      renderer.pipelines.preBatch(src);
      replay(pipe, rec, getCalc(src, camera, parentMatrix).calc);
      renderer.pipelines.postBatch(src);
      return;
    }
    if (i >= 0) cache.takes.splice(i, 1);
    const rec = record(pipe, getCalc(src, camera, parentMatrix).calc, () => native.call(this, renderer, src, camera, parentMatrix));
    cache.takes.push({ cam: camera, alpha, pipe, rec });
  };
}
