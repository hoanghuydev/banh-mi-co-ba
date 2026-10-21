import Phaser from "phaser";
import { GAME_W, GAME_H } from "../core/config";
import { PAL as P } from "../art/palette";
import { COUNTER, textureFor } from "../art";
import { DEFAULT_SHOP_NAME, shopName } from "../content/shop";
import { FONT } from "./theme";
import { BASKET_TEX, BASKET_W, artScale, fitPhoto } from "../art/photo";

/** Phông đầu hẻm mờ của `MenuScene`. */
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

  drawShopfront(scene, 64, GAME_H - 96);

  const S = 2.0;
  scene.add.image(GAME_W - 262, GAME_H - 26, COUNTER.case(0)).setOrigin(0.5, 1).setScale(S).setAlpha(0.5);
  const end = scene.add.image(GAME_W - 190, GAME_H + 4, COUNTER.end).setOrigin(0.5, 1).setScale(S).setAlpha(0.5);
  // Rổ bánh là ảnh rời, không nằm trong texture quầy; đặt giống `StallScene.addOnCounter`.
  if (scene.textures.exists(BASKET_TEX)) {
    fitPhoto(scene.add.image(end.x, end.y - (COUNTER.TOP_ABOVE_FOOT - BASKET_W / 4) * S, BASKET_TEX))
      .setOrigin(0.5, 1).setScale(S / artScale(BASKET_TEX)).setAlpha(0.5);
  }
  // `fitPhoto` chứ không `setScale` thẳng: hình người chơi là ẢNH THẬT nướng dư pixel.
  fitPhoto(scene.add.image(GAME_W - 292, GAME_H - 84, textureFor("s").key), 1.9)
    .setOrigin(0.5, 1).setAlpha(0.5);
}

/** Mặt tiền quán đầu hẻm: biển đỏ, mái che sọc, cửa cuốn kéo nửa chừng. */
function drawShopfront(scene: Phaser.Scene, x: number, floorY: number) {
  const W = 210, H = 250, a = 0.6;
  const g = scene.add.graphics().setAlpha(a);
  const top = floorY - H;
  g.fillStyle(0x56646d, 1).fillRect(x, top, W, H);
  g.fillStyle(0x46535b, 1).fillRect(x, top, 8, H);

  const signY = top + 22;
  g.fillStyle(P.signRedDark, 1).fillRoundedRect(x + 14, signY, W - 28, 44, 6);
  g.fillStyle(P.signRed, 1).fillRoundedRect(x + 18, signY + 4, W - 36, 36, 4);

  const awnY = signY + 54;
  for (let i = 0; i < 7; i++) {
    g.fillStyle(i % 2 ? 0xf3f0e7 : P.signRed, 1);
    g.fillPoints([
      { x: x + 10 + i * 27, y: awnY }, { x: x + 37 + i * 27, y: awnY },
      { x: x + 41 + i * 27, y: awnY + 26 }, { x: x + 6 + i * 27, y: awnY + 26 },
    ], true);
  }

  const doorY = awnY + 34, doorH = floorY - doorY;
  g.fillStyle(0xf5c542, 0.45).fillRect(x + 24, doorY + 8, W - 48, doorH - 8);
  g.fillStyle(0x8f98a0, 1).fillRect(x + 24, doorY, W - 48, doorH * 0.42);
  g.lineStyle(2, 0x6f7880, 1);
  for (let yy = doorY + 8; yy < doorY + doorH * 0.42; yy += 9) g.lineBetween(x + 24, yy, x + W - 24, yy);

  scene.add.text(x + W / 2, signY + 22, shopName(DEFAULT_SHOP_NAME), {
    fontFamily: FONT, fontSize: "14px", fontStyle: "700", color: "#f5c542",
  }).setOrigin(0.5).setAlpha(a + 0.2);
}
