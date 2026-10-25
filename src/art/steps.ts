/** Một bước; trả về iterator thì mỗi `yield` là chỗ được nhường luồng giữa chừng. */
export type Step = () => void | Iterator<unknown>;

/** Nhường luồng cho vẽ và input rồi chạy tiếp ngay; `setTimeout(0)` bị kẹp tối thiểu 4 ms nên chậm hơn. */
const nextTask = () => new Promise<void>((done) => {
  const ch = new MessageChannel();
  ch.port1.onmessage = () => done();
  ch.port2.postMessage(0);
});
const now = () => performance.now();

const BASE_SLICE_MS = 8;
/** Ngân sách mỗi lát khi màn chờ đang che: sát mốc 50 ms của long task để xong sớm. */
const WAIT_SLICE_MS = 40;
let boosts = 0;

/** Số ms làm liền một mạch trước khi nhường luồng. */
export const slice = { ms: BASE_SLICE_MS };

/** Lát dài trong lúc màn chờ che, tới khi mọi lượt nâng đã trả; hàm trả gọi lại nhiều lần vô hại. */
export function boostSlice() {
  boosts++;
  slice.ms = WAIT_SLICE_MS;
  let given = false;
  return () => {
    if (given) return;
    given = true;
    if (--boosts === 0) slice.ms = BASE_SLICE_MS;
  };
}

/** Chạy hết `steps` theo thứ tự, nhường luồng mỗi khi quá `slice.ms`. */
export async function runSteps(
  steps: readonly Step[], yieldTo: () => Promise<void> = nextTask, onStep?: (done: number, total: number) => void,
) {
  let t0 = now();
  const pause = async () => {
    if (now() - t0 < slice.ms) return;
    await yieldTo();
    t0 = now();
  };
  for (let i = 0; i < steps.length; i++) {
    const it = steps[i]();
    if (it) while (!it.next().done) await pause();
    onStep?.(i + 1, steps.length);
    await pause();
  }
}

/** Chạy một mạch một iterator chia bước. */
export function drain<T>(it: Iterator<unknown, T>): T {
  for (;;) {
    const r = it.next();
    if (r.done) return r.value;
  }
}
