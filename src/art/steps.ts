/** Một bước; trả về iterator thì mỗi `yield` là chỗ được nhường luồng giữa chừng. */
export type Step = () => void | Iterator<unknown>;

/** Nhường luồng cho vẽ và input rồi chạy tiếp ngay; `setTimeout(0)` bị kẹp tối thiểu 4 ms nên chậm hơn. */
const nextTask = () => new Promise<void>((done) => {
  const ch = new MessageChannel();
  ch.port1.onmessage = () => done();
  ch.port2.postMessage(0);
});
const now = () => performance.now();

/** Số ms làm liền một mạch trước khi nhường luồng; màn chờ đang hiện thì nâng lên cho nhanh xong. */
export const slice = { ms: 8 };

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
