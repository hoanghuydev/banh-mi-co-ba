import type Phaser from "phaser";
import { bakeRegulars, dropRegular, regularIds, regularReady } from "../art";
import { runSteps } from "../art/steps";
import type { Service } from "../sim/service";

/** Lượt nướng hỏng thì chờ chừng này giây thật mới thử lại. */
const RETRY_SEC = 10;

/** Hình khách quen chỉ có trong quán lúc họ còn lượt ghé hoặc đang ở đó. */
export class RegularBakes {
  private job: string | null = null;
  private stopped = false;
  private retryAt = 0;

  constructor(private scene: Phaser.Scene, private service: Service) {}

  /** Bước dựng quán: bỏ người không còn lượt, nướng người còn lượt. */
  *prepare(alive: () => boolean) {
    const due = this.service.regulars();
    for (const id of regularIds()) if (!due.has(id)) dropRegular(this.scene, id);
    yield* bakeRegulars(this.scene, due.keys(), alive);
  }

  /** Mỗi khung: nướng ngầm, từng người một, ai còn lượt mà chưa có hình. */
  tick() {
    if (this.job || performance.now() < this.retryAt) return;
    const id = [...this.service.regulars().keys()].find((x) => !regularReady(x));
    if (!id) return;
    this.job = id;
    const alive = () => !this.stopped;
    const it = bakeRegulars(this.scene, [id], alive);
    void runSteps([() => ({ next: () => (alive() ? it.next() : { done: true, value: undefined }) })])
      .finally(() => {
        this.job = null;
        if (!this.stopped && !regularReady(id)) this.retryAt = performance.now() + RETRY_SEC * 1000;
      });
  }

  /** Thân của `id` vừa rời cảnh. */
  left(id: string) {
    if (id !== this.job && !this.service.regulars().has(id)) dropRegular(this.scene, id);
  }

  /** Dở dang thì bỏ, đã xong thì giữ cho lần dựng quán sau. */
  destroy() {
    this.stopped = true;
    for (const id of regularIds()) if (!regularReady(id)) dropRegular(this.scene, id);
  }
}
