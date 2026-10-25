const nextFrame = () => new Promise<void>((done) => setTimeout(done, 0));

/** Chạy lần lượt từng bước, nhường luồng giữa các bước. */
export async function runSteps(steps: readonly (() => void)[], yieldTo: () => Promise<void> = nextFrame) {
  for (let i = 0; i < steps.length; i++) {
    if (i > 0) await yieldTo();
    steps[i]();
  }
}
