import type Phaser from "phaser";

const holds = new Set<string>();

/** Vòng lặp game ngủ khi còn ít nhất một lý do giữ; hết lý do thì chạy lại, bỏ qua khoảng đã ngủ. */
export function holdLoop(game: Phaser.Game, why: string, on: boolean) {
  if (on) holds.add(why);
  else holds.delete(why);
  if (holds.size) game.loop.sleep();
  else if (!game.loop.running) {
    game.loop.wake();
    game.loop.resetDelta();
  }
}
