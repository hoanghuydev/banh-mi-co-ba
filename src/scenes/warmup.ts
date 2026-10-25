import Phaser from "phaser";
import { artSteps, bakeSourceLoads, preloadArt } from "../art";
import { runSteps, slice } from "../art/steps";
import { StallAudio } from "../audio/stallAudio";
import { Lamps } from "../ui/stall/Lamps";
import { keepForOffline } from "../core/offline";
import { holdLoop } from "../core/loopHold";

/** Phần thanh tiến độ dành cho tải file; còn lại là nướng texture. */
const LOAD_SHARE = 0.4;
/** Ngân sách mỗi lát khi màn chờ đang che: sát mốc 50 ms của long task để xong sớm. */
export const WAIT_SLICE_MS = 40;

let job: Promise<void> | null = null;
let loaded: Promise<unknown> | null = null;
let game: Phaser.Game | null = null;
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

/** Tải và nướng nền mọi thứ cảnh quán cần; `scene` phải sống suốt phiên vì loader của nó chạy theo `update`. */
export function warmUp(scene: Phaser.Scene) {
  game = scene.game;
  loaded ??= load(scene);
  job ??= (async () => {
    await loaded;
    await runSteps(artSteps(scene), undefined, (done, total) => report(LOAD_SHARE + (1 - LOAD_SHARE) * done / total));
    report(1);
    keepForOffline();
  })();
  return job;
}

/** Xong khi `warmUp` xong; có `onProgress` (0…1) nghĩa là màn chờ đang che: lát làm dài hơn, tải xong thì tạm dừng vẽ. */
export async function whenWarm(onProgress?: (p: number) => void) {
  if (!job || !loaded || !game) throw new Error("warmUp chưa chạy");
  if (progress >= 1) { onProgress?.(1); return; }
  const keep = slice.ms;
  slice.ms = WAIT_SLICE_MS;
  if (onProgress) { watchers.add(onProgress); onProgress(progress); }
  try {
    // Loader của Phaser chạy theo vòng lặp game nên chỉ được dừng vẽ sau khi tải xong.
    if (onProgress) await loaded.then(() => holdLoop(game!, "warm", true));
    await job;
  } finally {
    if (onProgress) {
      watchers.delete(onProgress);
      holdLoop(game, "warm", false);
    }
    slice.ms = keep;
  }
}
