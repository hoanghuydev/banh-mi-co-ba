import Phaser from "phaser";
import { artSteps, bakeSourceLoads, preloadArt } from "../art";
import { boostSlice, runSteps } from "../art/steps";
import { StallAudio } from "../audio/stallAudio";
import { Lamps } from "../ui/stall/Lamps";
import { keepForOffline } from "../core/offline";
import { holdLoop } from "../core/loopHold";

/** Phần thanh tiến độ dành cho tải file; còn lại là nướng texture. */
const LOAD_SHARE = 0.4;

let job: Promise<void> | null = null;
let loaded: Promise<unknown> | null = null;
let owner: Phaser.Scene | null = null;
/** Số bước nướng đã xong, để lượt thử lại không nướng lại từ đầu. */
let baked = 0;
let progress = 0;
const watchers = new Set<(p: number) => void>();

function report(p: number) {
  progress = p;
  for (const w of watchers) w(p);
}

/** Ảnh nguồn để nướng tải song song với loader của Phaser; tiến độ đếm theo số file xong. */
function load(scene: Phaser.Scene) {
  preloadArt(scene);
  Lamps.preload(scene);
  StallAudio.preload(scene);
  const own = bakeSourceLoads();
  const viaPhaser = scene.load.list.size;
  let done = 0;
  const tick = () => report(((done + scene.load.totalComplete) / Math.max(1, viaPhaser + own.length)) * LOAD_SHARE);
  return Promise.all([
    ...own.map((f) => f().then(() => { done++; tick(); })),
    !viaPhaser ? null : new Promise<void>((ok) => {
      scene.load.on(Phaser.Loader.Events.FILE_COMPLETE, tick);
      scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
        scene.load.off(Phaser.Loader.Events.FILE_COMPLETE, tick);
        ok();
      });
      scene.load.start();
    }),
  ]);
}

/** Tải và nướng nền mọi thứ cảnh quán cần; `scene` phải sống suốt phiên vì loader của nó chạy theo `update`. Lỗi thì lượt gọi sau làm tiếp từ bước hỏng. */
export function warmUp(scene: Phaser.Scene) {
  owner = scene;
  loaded ??= load(scene).catch((e) => { loaded = null; throw e; });
  job ??= (async () => {
    await loaded;
    const from = baked;
    await runSteps(artSteps(scene).slice(from), undefined, (done, total) => {
      baked = from + done;
      report(LOAD_SHARE + (1 - LOAD_SHARE) * baked / (from + total));
    });
    report(1);
    keepForOffline();
  })().catch((e) => { job = null; throw e; });
  return job;
}

/** Xong khi `warmUp` xong; có `onProgress` (0…1) nghĩa là màn chờ đang che: lát làm dài hơn, tải xong thì tạm dừng vẽ. */
export async function whenWarm(onProgress?: (p: number) => void) {
  if (!owner) throw new Error("warmUp chưa chạy");
  if (progress >= 1) { onProgress?.(1); return; }
  const game = owner.game;
  const ready = warmUp(owner);
  if (!onProgress) return ready;
  const release = boostSlice();
  watchers.add(onProgress);
  onProgress(progress);
  try {
    // Loader của Phaser chạy theo vòng lặp game nên chỉ được dừng vẽ sau khi tải xong.
    await loaded!.then(() => holdLoop(game, "warm", true));
    await ready;
  } finally {
    watchers.delete(onProgress);
    holdLoop(game, "warm", false);
    release();
  }
}
