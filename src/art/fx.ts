import Phaser from "phaser";
import { TW, TH } from "../world/iso";
import { SHADOW } from "./palette";

/** Ngân sách 4–6 TEXTURE HẠT cho cả lửa/khói/mưa/bụi; đang dùng ba, và cả ba vẽ TRẮNG rồi để emitter `tint`. */
export const FX = {
  shadow: "shadow", ring: "ring", fly: "fly", puff: "puff", you: "you",
  drop: "drop", ripple: "ripple",
} as const;

/** ⚠️ TAM GIÁC ĐẶC chứ không phải một chữ: trên đầu khách đã có `?` và `!`, thêm chữ nữa là người chơi phải ĐỌC mới biết dấu nào của ai. */
const YOU_W = 18, YOU_H = 13, YOU_PAD = 3;
/** Viền sậm bọc quanh: nền quán là gạch men trắng, mũi tên sáng trơn sẽ tan vào đó. */
const YOU_INK = 0x2b2f31;
/** Vàng nắng, cùng họ với lõi vòng sáng dưới chân trạm — không thêm màu mới. */
const YOU_FILL = 0xffe9a8;

/** Phải đủ cho nét ngoài cùng (dày 6 ⇒ thò ra 3 px) cộng một px nghỉ, không thì nét bọc bị xén cụt thành hai cái "sừng". */
const RING_PAD = 4;
const RING_INK = YOU_INK;
/** Thân vòng: hổ phách đậm, đủ no màu để không tan vào gạch men trắng. */
const RING_EDGE = 0xffa726;
/** Lõi sáng mảnh — thứ làm nó đọc ra là ĐÈN chứ không phải một vệt sơn. */
const RING_CORE = 0xfff0c2;

/** KHÔNG phải cỡ thật — ruồi đúng tỉ lệ chưa tới 1 px, tức vô hình, mà độ bẩn thì phải NHÌN THẤY ĐƯỢC. */
export const FLY_W = 7;

/** Khung vuông của texture ruồi — chừa chỗ cho cánh lúc ảnh bị XOAY theo hướng bay. */
export const FLY_BOX = 14;

/**
 * Cỡ hạt bụi. 32 px là dư: mặt thớt chỉ rộng `BOARD_W = 28`, mà hạt còn được emitter
 * thu xuống 0,2 lúc sinh ra. Lấy dư rồi thu lại thì rìa hạt mới mượt — P5-02 §621
 * cho ngân sách 4–6 texture hạt cho cả lửa/khói/mưa/bụi, nên một texture tròn mềm
 * dùng chung, đổi tông bằng `tint`, là đúng khoản đó.
 */
const PUFF_PX = 32;
/**
 * Số lớp vẽ chồng. Mỗi lớp phủ alpha 0,11 nên tâm hạt (bị cả 14 lớp phủ) đậm
 * 1−0,89¹⁴ ≈ 0,80, rìa chỉ 0,11 — ra dốc mềm. Vẽ một vòng tròn đặc rồi hạ alpha thì
 * rìa thành một ĐƯỜNG TRÒN đọc ra được, hạt hoá bong bóng xà phòng chứ không ra bụi.
 */
const PUFF_LAYERS = 14;

/**
 * VỆT MƯA. Hẹp và dài: một giọt rơi nhanh hơn mắt bắt kịp nên thứ người ta thật sự thấy là VỆT
 * NHOÈ của nó.
 *
 * Đậm ở ĐÁY, nhạt dần lên ĐỈNH — đáy là chỗ giọt đang ở, phần trên là cái đuôi nó vừa đi qua. Vẽ
 * đều một màu thì ra cái que; vẽ đậm ở đỉnh thì vệt đi ngược chiều rơi.
 *
 * 4 × 28 là cỡ NƯỚNG chứ không phải cỡ hiện (emitter thu ngang còn ~0,5 và kéo dọc theo quãng
 * rơi) — nướng dư rồi thu lại thì rìa mới mượt.
 */
const DROP_W = 4;
/** Cao của texture vệt mưa. `ui/stall/Rain` chia độ dài vệt cho nó ra `scaleY`. */
export const DROP_H = 28;

/**
 * VÒNG NƯỚC BẮN lúc giọt chạm đất. Hình THOI DẸT chứ không tròn: mặt đất trong iso là mặt phẳng
 * nghiêng 2:1, nên vẽ tròn là cái vòng dựng đứng lên khỏi mặt đường.
 *
 * Hai nét chồng nhau — một nét DÀY mờ (nước loang) bọc một nét MẢNH rõ (mép sóng): một nét đơn
 * phóng to ra thành cái vòng kim loại, hai nét mới ra chất nước.
 */
/** Bề ngang texture vòng nước — `ui/stall/Rain` cần nó để tính cỡ vòng lúc loang hết. */
export const RIPPLE_W = 32;
const RIPPLE_H = 16;

/**
 * Bề ngang texture bóng. Phần ĐẬM chỉ rộng `SHADOW_CORE`, chỗ dư còn lại là vùng nhoè —
 * nên con số này lớn hơn cái bóng người ta nhìn thấy khá nhiều.
 */
const SHADOW_W = 44, SHADOW_H = 22;
/**
 * Bề ngang phần đậm — bằng đúng sải chân, giữ nguyên cỡ cũ (24) để không ai phải chỉnh lại scale.
 * Cũng là MỐC QUY ĐỔI cho bóng đạo cụ: `scale = bề ngang muốn có / SHADOW_CORE`, nên người chơi
 * (sải chân 24) ra đúng scale 1.
 */
export const SHADOW_CORE = 24;

/**
 * Bề ngang bóng của từng đạo cụ, tính bằng px thiết kế. Không có tên trong bảng = KHÔNG có bóng,
 * nên tường, cửa, nhà bên và mặt quầy tự khắc đứng ngoài (chúng ra key `BUILD.*`/`COUNTER.*`).
 *
 * ⚠️ Lấy theo BỀ NGANG VẬT CHE NẮNG, không theo chỗ nó chạm đất. Đo thực tế hai cột lệch nhau rất xa:
 *
 *      vật        bề ngang vẽ   bề ngang đáy
 *      dù            109,5          24,0
 *      ghế đẩu        28,9           2,1
 *      bàn            75,5          40,1
 *      bảng gỗ        41,5           3,8
 *
 * Cái dù mà lấy 24 thì ra một chấm bé tí dưới cây cột, trong khi thứ che nắng là cái TÁN rộng gấp
 * bốn; cái ghế đẩu lấy 2,1 thì gần như không có bóng, dù mặt ghế vẫn chắn sáng. Nên các số dưới đây
 * bám theo cột TRÁI, hạ bớt một chút vì nguồn sáng ở đây tản chứ không phải đèn chiếu thẳng đứng.
 *
 * Con số 76 của cái dù không phải bịa: bản vẽ-code dự phòng trong `StallScene` xưa nay vẫn vẽ
 * `fillEllipse(x, y + 2, 76, 26)` dưới chân dù — giữ đúng nó để hai bản không lệch nhau.
 */
/**
 * `w` bề ngang (px thiết kế) · `a` độ đậm so với bóng tiếp đất, mặc định 1.
 *
 * `a` < 1 dành cho vật KHÔNG nằm trên sàn. Vật càng cao khỏi mặt đất thì ánh sáng càng vòng
 * được ra sau nó, bóng càng tán và nhạt — cái dù che ở tầm hai mét mà đổ bóng đặc như cái
 * thùng rác thì nhìn ra ngay là sai. Cái bồn rửa là ví dụ rõ nhất: nó GẮN TƯỜNG, chỉ có một
 * ống thoát mảnh chạm sàn, còn cả chậu nước thì lơ lửng tầm hông.
 */
export const PROP_SHADOW: Record<string, { w: number; a?: number }> = {
  // đặt thẳng trên sàn — bóng tiếp đất, đậm đủ
  oven: { w: 40 }, oven_e: { w: 42 }, shelf: { w: 40 }, tea: { w: 30 },
  stool: { w: 22 }, pothos: { w: 22 }, bin: { w: 28 }, crate: { w: 30 },
  sign: { w: 26 }, fire: { w: 15 }, fridge: { w: 28 },
  // mặt bàn ở tầm đùi, chỉ bốn chân chạm sàn
  table: { w: 56, a: 0.75 },
  // thân xe gác trên hai bánh — phần che nắng nằm cách mặt đường một quãng
  bike: { w: 58, a: 0.8 }, scooter: { w: 52, a: 0.8 },
  // chậu nước tầm hông, gắn tường
  sink: { w: 34, a: 0.6 },
  // tán dù tầm hai mét: rộng nhất mà cũng nhạt nhất
  umbrella: { w: 76, a: 0.45 },
};

/**
 * Bóng đổ. Vẽ bằng CANVAS chứ không bằng `Graphics`, vì cần chuyển sắc.
 *
 * ⚠️ Bản cũ là một ê-líp ĐẶC, màu đều, mép cắt ngọt (`fillEllipse` + alpha 0,26). Mép ngọt
 * là thứ tố cáo ngay: bóng thật không có đường biên: nó đậm nhất ngay dưới chỗ chạm đất rồi
 * nhoè dần ra — chính vùng nhoè đó (nửa tối) mới làm người ta tin vật đang ĐỨNG TRÊN sàn
 * chứ không phải có ai dán một miếng ê-líp xám xuống đất.
 *
 * Hai lớp, cùng một mẹo với vòng sáng dưới chân trạm ngay bên dưới:
 *
 *   · NHOÈ   trải hết khung, tắt dần về 0 — vùng nửa tối
 *   · TIẾP ĐẤT ê-líp nhỏ và đậm ngay giữa — chỗ bàn chân ấn xuống sàn, không có nó thì
 *             cả cái bóng loãng thành một vệt khói và nhân vật lại lơ lửng
 *
 * Ê-líp chứ không tròn: mặt đất trong iso nghiêng 2:1 (`TW`/`TH`), vẽ tròn là cái bóng
 * dựng đứng lên khỏi mặt đường.
 */
function buildShadow(scene: Phaser.Scene) {
  if (scene.textures.exists(FX.shadow)) scene.textures.remove(FX.shadow);
  const tex = scene.textures.createCanvas(FX.shadow, SHADOW_W, SHADOW_H);
  if (!tex) return;
  const ctx = tex.getContext();
  const cx = SHADOW_W / 2, cy = SHADOW_H / 2;
  const r = SHADOW.color >> 16 & 0xff, g = SHADOW.color >> 8 & 0xff, b = SHADOW.color & 0xff;
  const rgba = (a: number) => `rgba(${r},${g},${b},${a})`;

  // Ép hình tròn thành ê-líp bằng cách bóp trục Y — gradient tròn vẽ trong hệ đã bóp thì
  // ra đúng ê-líp mà vẫn giữ được độ tắt dần đều.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, SHADOW_H / SHADOW_W);
  const soft = ctx.createRadialGradient(0, 0, 0, 0, 0, SHADOW_W / 2);
  // Các mốc dồn vào trong để vầng nhoè nhìn thấy được chỉ rộng ~30 px — sải chân có 24.
  // Trải hết 44 px khung thì bóng loe ra gần gấp rưỡi bàn chân, đọc thành vũng sáng
  // dưới đèn sân khấu chứ không phải bóng người đứng trên vỉa hè.
  soft.addColorStop(0, rgba(SHADOW.alpha * 0.85));
  soft.addColorStop(0.3, rgba(SHADOW.alpha * 0.55));
  soft.addColorStop(0.55, rgba(SHADOW.alpha * 0.22));
  soft.addColorStop(0.78, rgba(SHADOW.alpha * 0.05));
  soft.addColorStop(1, rgba(0));
  ctx.fillStyle = soft;
  ctx.beginPath();
  ctx.arc(0, 0, SHADOW_W / 2, 0, Math.PI * 2);
  ctx.fill();

  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, SHADOW_CORE / 2);
  core.addColorStop(0, rgba(SHADOW.alpha * 0.75));
  core.addColorStop(0.6, rgba(SHADOW.alpha * 0.4));
  core.addColorStop(1, rgba(0));
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, SHADOW_CORE / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  tex.refresh();
}

export function buildFx(scene: Phaser.Scene) {
  buildShadow(scene);

  // Vòng dưới chân trạm: phản hồi điều khiển, không phải trang trí.
  //
  // BA LỚP, không một nét. Một nét vàng nhạt gần như biến mất trên nền gạch men trắng của quầy —
  // và đó không phải thứ sửa được bằng cách tăng alpha, vấn đề là ĐỘ TƯƠNG PHẢN với nền.
  //
  // Nên: nét MỰC SẬM bọc ngoài (đọc trên nền sáng) · nét HỔ PHÁCH đậm ở giữa (đọc trên nền sậm) ·
  // lõi sáng mảnh làm nó "có đèn". Bọc mực là cùng mẹo mũi tên "cô Ba đây" dùng ngay dưới.
  const g2 = scene.make.graphics({ x: 0, y: 0 }, false);
  const cx = (TW + RING_PAD * 2) / 2, cy = (TH + RING_PAD * 2) / 2;
  const rw = TW - 12, rh = TH - 6;
  g2.lineStyle(6, RING_INK, 0.5);
  g2.strokeEllipse(cx, cy, rw, rh);
  g2.lineStyle(3.5, RING_EDGE, 1);
  g2.strokeEllipse(cx, cy, rw, rh);
  g2.lineStyle(1.5, RING_CORE, 1);
  g2.strokeEllipse(cx, cy, rw, rh);
  g2.generateTexture(FX.ring, TW + RING_PAD * 2, TH + RING_PAD * 2);
  g2.destroy();

  // Ruồi bản vẽ code — đúng cái chấm đen trước giờ. `art/photo.ts` đè ảnh thật lên
  // nếu `fly.png` về kịp; không kịp thì vẫn còn chấm này, không thủng lỗ.
  const g3 = scene.make.graphics({ x: 0, y: 0 }, false);
  g3.fillStyle(0x1b1b1b, 1);
  g3.fillCircle(FLY_BOX / 2, FLY_BOX / 2, 1.8);
  g3.generateTexture(FX.fly, FLY_BOX, FLY_BOX);
  g3.destroy();

  // Mũi tên "cô Ba đây". Vẽ viền bằng một tam giác TO HƠN nằm dưới, không dùng
  // `lineStyle` — nét viền của Graphics bị cắt ngang ở mỗi đỉnh nhọn, ra ba cái sừng.
  const g5 = scene.make.graphics({ x: 0, y: 0 }, false);
  const w = YOU_W + YOU_PAD * 2, h = YOU_H + YOU_PAD * 2;
  const tri = (cx: number, top: number, halfW: number, height: number) =>
    [cx - halfW, top, cx + halfW, top, cx, top + height] as const;
  g5.fillStyle(YOU_INK, 1);
  g5.fillTriangle(...tri(w / 2, YOU_PAD - 2, YOU_W / 2 + 2, YOU_H + 4));
  g5.fillStyle(YOU_FILL, 1);
  g5.fillTriangle(...tri(w / 2, YOU_PAD, YOU_W / 2, YOU_H));
  g5.generateTexture(FX.you, w, h);
  g5.destroy();

  // Hạt bụi lau thớt. Vẽ TRẮNG để `tint` bên emitter quyết màu — một texture xài cho
  // mọi tông bụi, khỏi nướng thêm cái nào.
  const g4 = scene.make.graphics({ x: 0, y: 0 }, false);
  const r = PUFF_PX / 2;
  for (let i = PUFF_LAYERS; i >= 1; i--) {
    g4.fillStyle(0xffffff, 0.11);
    g4.fillCircle(r, r, r * (i / PUFF_LAYERS));
  }
  g4.generateTexture(FX.puff, PUFF_PX, PUFF_PX);
  g4.destroy();

  // Vệt mưa: từng lát 1 px, alpha theo bình phương độ cao -> đuôi tan dần chứ không
  // cắt ngang. Đầu giọt là một chấm tròn ở đáy, để lúc vệt bị thu ngắn (mưa xa) nó
  // vẫn còn đọc ra là một giọt nước chứ không thành một dấu gạch.
  const g6 = scene.make.graphics({ x: 0, y: 0 }, false);
  for (let i = 0; i < DROP_H; i++) {
    const t = i / (DROP_H - 1);                        // 0 đỉnh -> 1 đáy
    g6.fillStyle(0xffffff, 0.12 + 0.88 * t * t);
    g6.fillRect(1, i, DROP_W - 2, 1);
  }
  g6.fillStyle(0xffffff, 1);
  g6.fillCircle(DROP_W / 2, DROP_H - DROP_W / 2, DROP_W / 2);
  g6.generateTexture(FX.drop, DROP_W, DROP_H);
  g6.destroy();

  // Vòng nước bắn. Chừa 1 px lề mỗi bên cho nét dày khỏi bị xén cụt ở bốn mép.
  const g7 = scene.make.graphics({ x: 0, y: 0 }, false);
  const rcx = RIPPLE_W / 2, rcy = RIPPLE_H / 2;
  g7.lineStyle(3, 0xffffff, 0.35);
  g7.strokeEllipse(rcx, rcy, RIPPLE_W - 4, RIPPLE_H - 4);
  g7.lineStyle(1.2, 0xffffff, 0.95);
  g7.strokeEllipse(rcx, rcy, RIPPLE_W - 4, RIPPLE_H - 4);
  g7.generateTexture(FX.ripple, RIPPLE_W, RIPPLE_H);
  g7.destroy();
}
