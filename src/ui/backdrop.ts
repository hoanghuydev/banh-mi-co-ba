import Phaser from "phaser";
import { GAME_W, GAME_H } from "../core/config";
import { PAL as P } from "../art/palette";
import { COUNTER, textureFor } from "../art";
import { BASKET_TEX, BASKET_W, artScale, fitPhoto } from "../art/photo";

/**
 * PHÔNG ĐẦU HẺM — một khúc quầy mờ, cái rổ bánh, và bóng người đứng sau quầy.
 *
 * Dùng chung cho sảnh (`MenuScene`) và màn mở đầu (`IntroScene`): hai màn đó là hai thứ
 * người chơi thấy liền nhau trong mười giây đầu, nên chúng phải là CÙNG MỘT chỗ. Trước
 * đây đoạn này nằm riêng trong `MenuScene`; chép nó qua màn mở đầu thì sửa một bên là lệch.
 *
 * Mọi thứ ở đây đều `setAlpha(0.5)`: đây là PHÔNG, không phải cảnh. Có chữ đè lên nó.
 */
export function drawAlleyBackdrop(scene: Phaser.Scene) {
  const g = scene.add.graphics();
  for (let i = 0; i < GAME_H; i += 4) {
    const t = i / GAME_H;
    g.fillStyle(Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.IntegerToColor(P.skyTop),
      Phaser.Display.Color.IntegerToColor(P.skyLow), 100, t * 100,
    ).color as unknown as number, 1);
    g.fillRect(0, i, GAME_W, 5);
  }

  g.fillStyle(P.sun, 0.1);
  g.fillPoints([
    { x: GAME_W * 0.52, y: 0 }, { x: GAME_W * 0.78, y: 0 },
    { x: GAME_W * 0.46, y: GAME_H }, { x: GAME_W * 0.2, y: GAME_H },
  ], true);

  g.fillStyle(0x2f3a41, 0.32);
  g.fillPoints([{ x: 0, y: 0 }, { x: 190, y: 0 }, { x: 96, y: GAME_H }, { x: 0, y: GAME_H }], true);
  g.fillPoints([
    { x: GAME_W, y: 0 }, { x: GAME_W - 210, y: 0 },
    { x: GAME_W - 110, y: GAME_H }, { x: GAME_W, y: GAME_H },
  ], true);

  g.fillStyle(0x1b2126, 0.25);
  g.fillRect(0, GAME_H - 96, GAME_W, 96);

  const S = 2.0;
  scene.add.image(GAME_W - 262, GAME_H - 26, COUNTER.case(0)).setOrigin(0.5, 1).setScale(S).setAlpha(0.5);
  const end = scene.add.image(GAME_W - 190, GAME_H + 4, COUNTER.end).setOrigin(0.5, 1).setScale(S).setAlpha(0.5);
  // Rổ bánh là ẢNH THẬT đặt rời (xem `art/photo.ts`), không còn nướng trong texture
  // khúc quầy — không đặt lại ở đây thì mặt quầy của sảnh trơ ra một khoảng trống.
  // Dùng chung đúng phép đặt của `StallScene.addOnCounter`, chỉ nhân thêm hệ số phóng.
  if (scene.textures.exists(BASKET_TEX)) {
    fitPhoto(scene.add.image(end.x, end.y - (COUNTER.TOP_ABOVE_FOOT - BASKET_W / 4) * S, BASKET_TEX))
      .setOrigin(0.5, 1).setScale(S / artScale(BASKET_TEX)).setAlpha(0.5);
  }
  // `fitPhoto` chứ không `setScale` thẳng: hình người chơi là ẢNH THẬT nướng dư pixel.
  fitPhoto(scene.add.image(GAME_W - 292, GAME_H - 84, textureFor("s").key), 1.9)
    .setOrigin(0.5, 1).setAlpha(0.5);
}

/**
 * Tấm lọc xanh đêm phủ lên phông — màn mở đầu diễn ra lúc 4 giờ rưỡi sáng, trời chưa hửng.
 * Tách khỏi `drawAlleyBackdrop` để sảnh vẫn là buổi sáng, không ai phải truyền cờ qua lại.
 */
export function tintPreDawn(scene: Phaser.Scene) {
  scene.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x0e151d, 0.5);
}
