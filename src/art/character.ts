import Phaser from "phaser";
import { PAL } from "./palette";
import { blob, heightFor, prop, shade, slab, type Pen } from "./canvas";
import type { Facing8 } from "../world/iso";

/**
 * Thân người — dùng chung cho người chơi lẫn khách. v1 vẽ bằng code nhưng vẽ cho tử tế; v2 artist
 * thay bằng ảnh thật.
 *
 * Mỗi nhân vật chỉ NƯỚNG 3 hướng, hướng "w" là bản lật ngang của "e". Ai được `art/photo.ts` sơn
 * đè đủ ẢNH tám hướng thì dùng tám file rời, không lật (xem `markEightWay`).
 *
 * ⚠️ Bàn chân đứng ĐÚNG ở `cy` — tâm hình thoi của ô. Neo sai chỗ này là nhân vật bị nhấc lên và
 * bóng đổ rơi lệch hẳn xuống chân.
 *
 * Đầu chiếm ~38% chiều cao, và đó là quyết định CHỨC NĂNG chứ không phải cho dễ thương: nhân vật
 * chỉ cao 64 px trên màn 1024×576, mà CANON §5 bắt người chơi phải ĐỌC ĐƯỢC mức nhận thấy qua NÉT
 * MẶT — đầu đúng tỉ lệ thật thì mắt chỉ còn 2 px.
 */
export const BODY_H = 64;

/** Kiểu tóc. Đây là thứ phân biệt 12 NPC nhanh hơn màu áo, vì nó nằm ngay cạnh mặt. */
export type HairStyle = "short" | "bob" | "bun" | "ponytail";

/** Mũ. `nonla` là nón lá — dấu hiệu "đi chợ / bán hàng rong" rõ nhất, nhận ra từ xa. */
export type Hat = "cap" | "helmet" | "nonla";

/** Dáng người. Chỉ hai mức, vì ở 64 px thì mức thứ ba không ai phân biệt được. */
export type Build = "slim" | "round";

/**
 * Hai TƯ THẾ. Chỉ ai thật sự bưng đồ mới cần nướng thêm `carry`
 * (hiện là mỗi người chơi) — khách không cầm gì nên chỉ có `idle`.
 */
export type Pose = "idle" | "carry";

/** Mỗi nhân vật là một bảng màu + vài phụ kiện. Thêm người = thêm một object. */
export type BodyStyle = {
  skin: number;
  hair: number;
  shirt: number;
  trousers: number;
  /** Có tạp dề không — chỉ người bán mới có. */
  apron?: number;
  hat?: Hat;
  /** Dáng còng của người lớn tuổi. */
  stoop?: boolean;
  /** Mặc định "short". */
  hairStyle?: HairStyle;
  /** Kính lão — đọc ra tuổi nhanh hơn mọi thứ khác. */
  glasses?: boolean;
  /** Khẩu trang — Sài Gòn buổi sáng thì một nửa người đi đường đang đeo. */
  mask?: boolean;
  /** Giỏ đi chợ xách bên tay. Giá trị là màu của giỏ. */
  bag?: number;
  /** Mặc định "slim". */
  build?: Build;
};

export const PLAYER_STYLE: BodyStyle = {
  skin: PAL.skin, hair: PAL.hair, shirt: PAL.shirt,
  trousers: PAL.trousers, apron: PAL.apron, hairStyle: "bob",
};

const DIRS = ["s", "n", "e"] as const;
type Dir = (typeof DIRS)[number];

function keyOf(who: string, dir: string, pose: Pose) {
  return pose === "carry" ? `${who}_${dir}_c` : `${who}_${dir}`;
}

/**
 * Nhân vật nào có ĐỦ ẢNH THẬT tám hướng. `art/photo.ts` ghi tên vào đây sau khi sơn xong, và chỉ
 * khi sơn đủ cả tám — thiếu một file ảnh là cả bộ lặng lẽ rơi về bản vẽ code.
 *
 * Phải là một cái sổ ĐĂNG KÝ chứ không phải cờ cứng: bản vẽ code chỉ nướng ba hướng nên
 * `textureFor` không thể đoán bừa rằng `p_se` có tồn tại hay không.
 */
const EIGHT = new Set<string>();

export function markEightWay(who: string) {
  EIGHT.add(who);
}

/**
 * Gộp tám hướng về ba bản vẽ code. Hướng chéo lấy hình NGHIÊNG: nhân vật đi chéo
 * mà đứng chính diện thì nhìn như đang trượt ngang, còn nghiêng thì chỉ là hơi
 * quá đà. Nửa phía tây lật ngang bản "e", đúng quy ước cũ.
 */
const FOLD: Record<Facing8, { dir: Dir; flip: boolean }> = {
  s: { dir: "s", flip: false },
  n: { dir: "n", flip: false },
  e: { dir: "e", flip: false },
  w: { dir: "e", flip: true },
  se: { dir: "e", flip: false },
  ne: { dir: "e", flip: false },
  sw: { dir: "e", flip: true },
  nw: { dir: "e", flip: true },
};

/**
 * Tên texture của một nhân vật theo hướng nhìn.
 *
 * Có ảnh thật tám hướng thì mỗi hướng một file, KHÔNG lật ngang cái nào — lật là
 * chữ "Bánh Mì" trên tạp dề soi gương, và hai nửa người đổi chỗ cho nhau.
 * Chưa có ảnh thì gộp về ba bản vẽ code theo `FOLD`.
 */
export function textureFor(facing: Facing8, who = "p", pose: Pose = "idle") {
  if (EIGHT.has(who)) return { key: keyOf(who, facing, pose), flip: false };
  const f = FOLD[facing];
  return { key: keyOf(who, f.dir, pose), flip: f.flip };
}

// ─────────────────────────────────────────────────────────────── kích thước thân

/**
 * Bốn con số này cộng lại ra đúng `BODY_H`. Đụng vào một cái là phải cộng lại.
 *
 * Chân phải dài hơn phần áo phủ xuống, không thì tạp dề trùm kín hai ống quần và
 * nhân vật đứng như một cái chuông — không đọc ra là đang ĐỨNG.
 */
const HIP = 17;          // từ gót lên hông
const TORSO = 19;        // từ hông lên vai
const NECK_GAP = 4;      // khoảng hở cổ giữa vai và cằm
const HEAD_R = 12;       // bán kính đầu
const ARM_W = 5.6;       // mảnh — 7 px làm hai cánh tay to ngang nửa thân, đọc ra như tấm ván

/** Bề ngang thân áo theo hướng nhìn và dáng người. */
function bodyWidth(dir: Dir, st: BodyStyle) {
  const round = st.build === "round" ? 3 : 0;
  return (dir === "e" ? 17 : 24) + round;
}

/**
 * Chỗ đặt món đang cầm, đo từ ĐIỂM CHẠM ĐẤT lên (y dương = lên trên).
 *
 * Đây là hợp đồng giữa `character.ts` và `entities/Player.ts`: đổi tư thế bưng đồ
 * ở đây thì sửa đúng bảng này, không file nào khác phải biết. Toạ độ khớp với chỗ
 * hai cẳng tay của tư thế `carry` gặp nhau — xem `arms()`.
 */
const HOLD_ANCHOR: Record<Facing8, { x: number; y: number }> = {
  s: { x: 0, y: 23 },
  se: { x: 5, y: 22 },
  e: { x: 8, y: 22 },
  ne: { x: 5, y: 22 },
  n: { x: 0, y: 23 },
  nw: { x: -5, y: 22 },
  w: { x: -8, y: 22 },
  sw: { x: -5, y: 22 },
};

/** Ba hướng NGOẢNH LƯNG: món nằm khuất sau thân, `Player` phải hạ depth xuống. */
const BEHIND = new Set<Facing8>(["n", "ne", "nw"]);

export function holdAnchor(facing: Facing8) {
  const a = HOLD_ANCHOR[facing];
  return { x: a.x, y: a.y, behind: BEHIND.has(facing) };
}

// ──────────────────────────────────────────────────────────────────────── cái đầu

/**
 * Tóc phía SAU mặt — vẽ trước khối mặt để mặt đè lên.
 *
 * Chỉ nhô ra khỏi khối mặt 2–3 px. Để lớp này to hơn mặt tới 6 px là tóc nuốt gọn
 * cái đầu: còn đúng một ô mặt bé tí ở giữa, mọi biểu cảm chết theo. Ở kích cỡ này
 * tóc là cái VIỀN quanh mặt, không phải cái mũ trùm.
 */
function hairBack(g: Pen, cx: number, y: number, dir: Dir, st: BodyStyle) {
  const style = st.hairStyle ?? "short";
  g.fillStyle(shade(st.hair, -14), 1);

  if (style === "bob") {
    g.fillEllipse(cx, y + 3, HEAD_R * 2 + 3, HEAD_R * 2 + 3);       // mái ôm tới quai hàm
  } else if (style === "bun") {
    g.fillEllipse(cx, y - HEAD_R - 3, 14, 11);                      // búi trên đỉnh
    g.fillEllipse(cx, y, HEAD_R * 2 + 2, HEAD_R * 2 + 1);
  } else if (style === "ponytail") {
    g.fillEllipse(cx + (dir === "e" ? -10 : 0), y + 7, 10, 17);     // đuôi hất ra sau
    g.fillEllipse(cx, y, HEAD_R * 2 + 2, HEAD_R * 2 + 1);
  } else {
    g.fillEllipse(cx, y, HEAD_R * 2 + 2, HEAD_R * 2 + 1);
  }
}

/** Tóc phía TRƯỚC mặt: mái, gọng tóc ôm thái dương. */
function hairFront(g: Pen, cx: number, y: number, dir: Dir, st: BodyStyle) {
  const style = st.hairStyle ?? "short";
  g.fillStyle(st.hair, 1);

  // chỏm tóc: nửa trên của khối đầu, luôn có ở mọi kiểu.
  // Mép dưới dừng cao hơn tâm đầu — chừa chỗ cho chân mày.
  g.beginPath();
  g.arc(cx, y, HEAD_R + 0.5, Math.PI, Math.PI * 2);
  g.closePath();
  g.fillPath();
  g.fillRect(cx - HEAD_R - 0.5, y - 5.5, HEAD_R * 2 + 1, 2);

  if (style === "bun") {
    g.fillStyle(shade(st.hair, 12), 0.55);                          // tóc bạc chải ngược
    for (const dy of [-9, -6.5, -4]) g.fillRect(cx - 8, y + dy, 16, 1.1);
  } else if (style === "bob") {
    // hai lọn ôm má — thứ làm kiểu bob đọc ra là bob chứ không phải mũ trùm
    if (dir === "s") {
      g.fillEllipse(cx - HEAD_R + 0.5, y + 4, 5.5, 14);
      g.fillEllipse(cx + HEAD_R - 0.5, y + 4, 5.5, 14);
    } else {
      g.fillEllipse(cx - HEAD_R + 1.5, y + 4, 6, 14);
    }
    g.fillStyle(st.hair, 1);
    g.fillEllipse(cx - (dir === "s" ? 4 : -3), y - 6, 13, 7);        // mái lệch
  } else if (style === "ponytail") {
    g.fillEllipse(cx + (dir === "s" ? 3 : 4), y - 6, 14, 7);
  } else {
    g.fillEllipse(cx + (dir === "s" ? -3 : 3), y - 6.5, 12, 6.5);    // mái ngắn hất sang
    if (dir === "s") { g.fillEllipse(cx - HEAD_R + 1, y - 1, 4.5, 9); g.fillEllipse(cx + HEAD_R - 1, y - 1, 4.5, 9); }
    else g.fillEllipse(cx - HEAD_R + 1.5, y - 1, 5, 9);
  }
}

/** Mặt: mắt to có bắt sáng, chân mày, miệng cười nhẹ, má ửng. */
function face(g: Pen, cx: number, y: number, dir: Dir, st: BodyStyle) {
  const eyes: number[] = dir === "s" ? [-5, 5] : [5];
  const eyeY = y + 2.5;

  for (const dx of eyes) {
    g.fillStyle(shade(st.hair, 8), 1);                              // chân mày
    g.fillRoundedRect(cx + dx - 3.4, eyeY - 6.6, 6.8, 1.8, 0.9);

    g.fillStyle(PAL.ink, 1);                                        // tròng mắt
    g.fillEllipse(cx + dx, eyeY, 3.4, 4.4);
    g.fillStyle(0xffffff, 0.92);                                    // bắt sáng
    g.fillCircle(cx + dx + 1, eyeY - 1.2, 1.15);
    g.fillStyle(0xffffff, 0.45);
    g.fillCircle(cx + dx - 1, eyeY + 1.3, 0.6);
  }

  if (st.mask) {                                                    // khẩu trang che nửa mặt dưới
    const mx = cx + (dir === "s" ? 0 : 3);
    const mw = dir === "s" ? 20 : 17;
    g.fillStyle(shade(0xdfe8ec, -26), 1);
    g.fillRoundedRect(mx - mw / 2, y + 1.5, mw, 11, 4);
    g.fillStyle(0xdfe8ec, 1);
    g.fillRoundedRect(mx - mw / 2 + 0.8, y + 2, mw - 1.6, 10, 3.5);
    g.fillStyle(shade(0xdfe8ec, -20), 0.7);                         // nếp gấp
    for (const dy of [4.5, 7.5]) g.fillRect(mx - mw / 2 + 2, y + dy, mw - 4, 1);
    g.lineStyle(1.2, shade(0xdfe8ec, -32), 0.9);                    // quai đeo tai
    if (dir === "s") {
      g.lineBetween(mx - mw / 2, y + 4, cx - HEAD_R, y + 2);
      g.lineBetween(mx + mw / 2, y + 4, cx + HEAD_R, y + 2);
    } else g.lineBetween(mx - mw / 2, y + 4, cx - 3, y + 2);
  } else {
    g.fillStyle(0xe58b8b, 0.34);                                    // má
    if (dir === "s") { g.fillEllipse(cx - 8.5, y + 6.5, 6.5, 3.6); g.fillEllipse(cx + 8.5, y + 6.5, 6.5, 3.6); }
    else g.fillEllipse(cx + 1.5, y + 7, 6.5, 3.6);

    const mx = cx + (dir === "s" ? 0 : 5);                          // miệng cười
    g.lineStyle(1.5, shade(st.skin, -46), 0.9);
    g.beginPath();
    g.arc(mx, y + 6, 3.2, 0.25 * Math.PI, 0.75 * Math.PI);
    g.strokePath();
  }

  if (st.glasses) {                                                 // kính lão
    g.lineStyle(1.4, 0x4a5157, 0.95);
    for (const dx of eyes) g.strokeEllipse(cx + dx, eyeY, 8.6, 8);
    if (dir === "s") g.lineBetween(cx - 0.6, eyeY, cx + 0.6, eyeY);
    else g.lineBetween(cx + 0.7, eyeY, cx - 2, eyeY - 0.4);
  }
}

function hat(g: Pen, cx: number, y: number, dir: Dir, st: BodyStyle) {
  if (st.hat === "cap") {                                           // nón kết bảo vệ
    g.fillStyle(shade(PAL.capBlue, -26), 1);
    g.fillEllipse(cx, y - 7.5, 27.5, 15.5);
    g.fillStyle(PAL.capBlue, 1);
    g.fillEllipse(cx, y - 8, 26, 14);
    g.fillRect(cx - 13, y - 8, 26, 4.5);
    g.fillStyle(shade(PAL.capBlue, 16), 0.6);
    g.fillEllipse(cx - 4, y - 12, 10, 5);                           // bắt sáng trên chóp
    g.fillStyle(shade(PAL.capBlue, -18), 1);
    if (dir !== "n") g.fillEllipse(cx + (dir === "s" ? 0 : 6), y - 2.5, dir === "s" ? 28 : 21, 6.5);
  } else if (st.hat === "helmet") {                                 // nón bảo hiểm nửa đầu
    g.fillStyle(shade(PAL.helmet, -28), 1);
    g.fillEllipse(cx, y - 4, 29, 27);
    g.fillStyle(PAL.helmet, 1);
    g.fillEllipse(cx, y - 4.5, 27.5, 25.5);
    g.fillRect(cx - 13.7, y - 4.5, 27.4, 6);
    g.fillStyle(shade(PAL.helmet, 18), 0.7);
    g.fillEllipse(cx - 5, y - 11, 11, 6);
    g.fillStyle(shade(PAL.helmet, -24), 1);
    g.fillRect(cx - 13.7, y + 1, 27.4, 3.2);                        // viền nón
    if (dir !== "n") {
      g.fillEllipse(cx + (dir === "s" ? 0 : 5), y + 2.5, 25, 5.5);
      g.lineStyle(1.4, 0x3a4046, 0.8);                              // quai nón
      g.lineBetween(cx - (dir === "s" ? 9 : 6), y + 4, cx - (dir === "s" ? 4 : 2), y + 11);
      if (dir === "s") g.lineBetween(cx + 9, y + 4, cx + 4, y + 11);
    }
  } else if (st.hat === "nonla") {
    // Nón lá: một hình nón bẹt rộng hơn hẳn vai. Đó chính là điểm nhận dạng —
    // bóng của nó khác mọi thứ khác trong khung hình, nhận ra từ xa không cần nhìn mặt.
    g.fillStyle(shade(PAL.basket, -30), 1);
    g.fillEllipse(cx, y - 6, 44, 17);
    g.fillStyle(PAL.basket, 1);
    g.fillEllipse(cx, y - 7, 41, 15);
    g.fillStyle(shade(PAL.basket, 14), 0.5);
    g.fillEllipse(cx - 6, y - 11, 16, 6);
    g.fillStyle(shade(PAL.basket, -22), 0.5);                       // vành nan đồng tâm
    g.fillEllipse(cx, y - 7, 26, 9);
    g.fillEllipse(cx, y - 7, 13, 4.5);
    if (dir !== "n") {
      // Quai nón chạy sát MÉP MẶT rồi vòng xuống cằm. Kéo vào trong nữa là nó
      // vắt ngang hai con mắt, thành ra như có ai gạch chéo lên mặt nhân vật.
      g.lineStyle(1.3, PAL.beadCurtain, 0.8);
      g.lineBetween(cx - 14, y - 1, cx - 5, y + 11);
      if (dir === "s") g.lineBetween(cx + 14, y - 1, cx + 5, y + 11);
    }
  }
}

function head(g: Pen, cx: number, y: number, dir: Dir, st: BodyStyle) {
  hairBack(g, cx, y, dir, st);

  if (dir !== "n") {                                                // tai
    g.fillStyle(shade(st.skin, -12), 1);
    if (dir === "s") { g.fillEllipse(cx - HEAD_R, y + 2, 4.5, 7); g.fillEllipse(cx + HEAD_R, y + 2, 4.5, 7); }
    else g.fillEllipse(cx - 2, y + 2, 4.5, 7);
  }

  blob(g, cx, y, HEAD_R * 2, HEAD_R * 2 - 1, st.skin, 2.5);         // khối mặt

  // Sống mũi: chỉ có ở góc nghiêng, và nó là thứ DUY NHẤT nói cho mắt biết đây là
  // mặt nhìn NGHIÊNG, chứ không phải mặt nhìn thẳng bị vẽ lệch mất một con mắt.
  if (dir === "e") {
    g.fillStyle(shade(st.skin, -32), 1);
    g.fillEllipse(cx + HEAD_R - 0.5, y + 2.5, 7, 6.5);
    g.fillStyle(st.skin, 1);
    g.fillEllipse(cx + HEAD_R - 1.6, y + 2, 6.4, 5.8);
  }

  if (dir === "n") {
    g.fillStyle(st.hair, 1);                                        // quay lưng: tóc kín
    g.fillEllipse(cx, y - 0.5, HEAD_R * 2 + 1, HEAD_R * 2);
    g.fillStyle(shade(st.hair, 14), 0.45);
    g.fillEllipse(cx - 3.5, y - 5, 11, 7.5);                        // vệt sáng trên đỉnh tóc
    if ((st.hairStyle ?? "short") === "bun") {
      g.fillStyle(st.hair, 1);
      g.fillEllipse(cx, y - HEAD_R - 1, 14, 11);
      g.fillStyle(shade(st.hair, -22), 0.8);
      g.fillRect(cx - 5, y - HEAD_R + 4, 10, 2);                    // dây cột búi
    }
  } else {
    hairFront(g, cx, y, dir, st);
    face(g, cx, y, dir, st);
  }

  hat(g, cx, y, dir, st);
}

// ──────────────────────────────────────────────────────────────────────── cái thân

function legs(g: Pen, cx: number, feet: number, hip: number, dir: Dir, st: BodyStyle) {
  const w = 8.5;

  const leg = (dx: number, color: number) => {
    slab(g, cx + dx, hip - 3, w, HIP + 1, 3.5, color, 2);
    g.fillStyle(shade(color, -26), 0.8);                             // gấu quần
    g.fillRect(cx + dx + 0.6, feet - 7, w - 1.2, 1.6);
    g.fillStyle(PAL.sandal, 1);                                      // dép lê
    g.fillEllipse(cx + dx + w / 2, feet - 1.5, 12.5, 6);
    g.fillStyle(shade(PAL.sandal, 30), 0.5);                         // quai ngang, chỉ gợi
    g.fillRect(cx + dx + 0.8, feet - 4, w - 1.6, 1.4);
  };

  if (dir === "e") {
    leg(-7, shade(st.trousers, -16));                                // chân xa, tối hơn
    leg(-2, st.trousers);
  } else {
    leg(-9.5, st.trousers);
    leg(1, st.trousers);
  }
}

/**
 * Thân áo. Mép dưới dừng cao hơn hông 1 px, để hai ống quần lúc nào cũng lộ ra.
 * Áo dài quá là mất luôn cái chân.
 */
function torso(g: Pen, cx: number, shoulder: number, dir: Dir, st: BodyStyle) {
  const bw = bodyWidth(dir, st);
  const h = TORSO + 2;

  slab(g, cx - bw / 2, shoulder, bw, h, 7, st.shirt, 2.5);          // áo
  g.fillStyle(shade(st.shirt, 18), 0.3);                            // nắng rọi vai phải
  g.fillRoundedRect(cx + bw / 2 - 5.5, shoulder + 2.5, 4, h - 7, 2);
  g.fillStyle(shade(st.shirt, -20), 0.45);                          // gấu áo
  g.fillRect(cx - bw / 2 + 2, shoulder + h - 3, bw - 4, 1.4);

  if (dir !== "n") {                                                // cổ áo
    g.fillStyle(shade(st.shirt, -24), 0.9);
    g.beginPath();
    g.arc(cx + (dir === "e" ? 2 : 0), shoulder + 0.5, dir === "e" ? 4.5 : 6, 0, Math.PI);
    g.closePath();
    g.fillPath();
  }
}

/**
 * Tay. Cánh tay và bàn tay là MỘT khối bo tròn, không phải một thanh rồi một
 * quả bóng gắn ở đầu — tách hai thì bàn tay trông như rời ra khỏi tay.
 *
 * `layer` quyết định tay nằm TRƯỚC hay SAU thân (xem thứ tự vẽ ở `draw`).
 * `pose`:
 *   idle  — buông thẳng xuống cạnh người
 *   carry — khuỷu gập, cẳng tay đưa ngang ra trước bụng để BƯNG ĐỒ.
 *           Món đang cầm đặt đúng chỗ hai bàn tay gặp nhau (`HOLD_ANCHOR`).
 */
function arms(
  g: Pen, cx: number, shoulder: number, dir: Dir, st: BodyStyle,
  layer: "behind" | "front", pose: Pose,
) {
  const bw = bodyWidth(dir, st);

  /** Cánh tay buông thẳng. */
  const hang = (dx: number, skin: number) => {
    const LEN = 17;
    slab(g, cx + dx, shoulder + 4, ARM_W, LEN, 2.8, skin, 2);
    g.fillStyle(shade(skin, -24), 0.45);                            // vạch cổ tay
    g.fillRect(cx + dx + 0.7, shoulder + 4 + LEN - 6.5, ARM_W - 1.4, 1);
    slab(g, cx + dx - 0.7, shoulder + 1.5, ARM_W + 1.4, 7.5, 3.2, st.shirt, 2);  // tay áo
  };

  /**
   * Cánh tay gập bưng đồ: bắp tay đi xuống, cẳng tay nằm ngang vào giữa.
   * `inward` = +1 cẳng tay chạy sang phải, −1 sang trái.
   */
  const carry = (dx: number, inward: number, reach: number, skin: number) => {
    slab(g, cx + dx, shoulder + 4, ARM_W, 11, 2.8, skin, 2);        // bắp tay
    const fy = shoulder + 13;                                       // cẳng tay ngang BỤNG, không ngang ngực
    const x0 = inward > 0 ? cx + dx : cx + dx + ARM_W - reach;
    slab(g, x0, fy, reach, ARM_W, 2.8, skin, 2);                    // cẳng tay nằm ngang
    slab(g, cx + dx - 0.7, shoulder + 1.5, ARM_W + 1.4, 7.5, 3.2, st.shirt, 2);  // tay áo
    g.fillStyle(shade(skin, -24), 0.4);                             // vạch cổ tay
    g.fillRect(inward > 0 ? x0 + reach - 5 : x0 + 4, fy + 0.8, 1, ARM_W - 1.6);
  };

  if (dir === "e") {
    // Nhìn nghiêng thì chỉ THẤY MỘT tay. Tay bên kia thò ra sau lưng một mẩu,
    // vẽ trước thân. Vẽ cả hai ra phía trước là ra hai cái cẳng song song,
    // trông như nhân vật có bốn chân — đó là lỗi của bản trước.
    if (layer === "behind") {
      if (pose === "carry") carry(-6, 1, 11, shade(st.skin, -20));
      else hang(-6, shade(st.skin, -20));
    } else if (pose === "carry") carry(0.5, 1, 14, st.skin);
    else hang(0.5, st.skin);
    return;
  }

  if (layer !== "front") return;

  // Nhìn thẳng / nhìn sau: hai tay đối xứng, ĐÈ LÊN mép thân áo 3 px.
  // Để rời hẳn ra ngoài là hai cánh tay treo lủng lẳng, không đọc ra là mọc từ vai.
  const left = -bw / 2 - 2.2, right = bw / 2 - 3.4;
  if (pose === "carry") {
    carry(left, 1, bw / 2 + 4, st.skin);
    carry(right, -1, bw / 2 + 4, st.skin);
  } else {
    hang(left, st.skin);
    hang(right, st.skin);
  }
}

function apron(g: Pen, cx: number, shoulder: number, dir: Dir, color: number) {
  if (dir === "n") {
    g.lineStyle(2.2, shade(color, -22), 0.95);                      // nút dây thắt sau lưng
    g.lineBetween(cx - 9, shoulder + 14, cx + 9, shoulder + 14);
    g.fillStyle(shade(color, -22), 1);
    g.fillCircle(cx, shoulder + 14, 2.6);
    return;
  }

  // Nhìn nghiêng, tạp dề là một DẢI HẸP chạy dọc mép trước người — nó không có bề
  // ngang nào để mà thấy. Để nó rộng như lúc nhìn thẳng là ra một tấm ván trắng úp
  // trước bụng, che luôn ống quần; đó chính là chỗ làm góc nghiêng trông kì.
  const aw = dir === "e" ? 7 : 17;
  const ax = cx - aw / 2 + (dir === "e" ? 6 : 0);

  slab(g, ax, shoulder + 7, aw, 18, 3.5, color, 2);
  if (dir === "e") {
    g.lineStyle(2, shade(color, -22), 0.95);                        // dây quàng cổ
    g.lineBetween(ax + aw / 2, shoulder + 7, cx + 1, shoulder + 0.5);
    return;
  }

  g.lineStyle(2, shade(color, -22), 0.95);
  g.lineBetween(ax + 2.5, shoulder + 7, cx - 2, shoulder + 0.5);
  g.lineBetween(ax + aw - 2.5, shoulder + 7, cx + 2, shoulder + 0.5);

  g.fillStyle(shade(color, -18), 0.8);                              // túi trước + đường may
  g.fillRoundedRect(ax + 2, shoulder + 16, aw - 4, 6.5, 1.8);
  g.fillStyle(shade(color, -26), 0.5);
  g.fillRect(ax + aw / 2 - 0.5, shoulder + 16, 1, 6.5);
}

/** Giỏ đi chợ xách bên tay — chỉ có nghĩa ở tư thế buông tay. */
function bag(g: Pen, cx: number, shoulder: number, dir: Dir, st: BodyStyle) {
  const color = st.bag!;
  const bx = dir === "e" ? cx + 5 : cx + bodyWidth(dir, st) / 2 + 1;
  const by = shoulder + 21;

  g.lineStyle(1.6, shade(color, -34), 0.95);                        // quai
  g.beginPath();
  g.arc(bx, by, 5.5, Math.PI, Math.PI * 2);
  g.strokePath();
  slab(g, bx - 8, by, 16, 13, 2.5, color, 2);
  g.fillStyle(shade(color, -22), 0.6);
  g.fillRect(bx - 6, by + 4.5, 12, 1.4);
  g.fillStyle(PAL.herbDark, 1);                                     // bó rau thò ra miệng giỏ
  g.fillEllipse(bx + 3, by - 2, 10, 6.5);
  g.fillStyle(PAL.herb, 1);
  g.fillEllipse(bx + 4.5, by - 4, 7, 5);
}

function draw(g: Pen, cx: number, cy: number, dir: Dir, st: BodyStyle, pose: Pose) {
  const feet = cy;                                     // mặt đất, xem chú thích đầu file
  const hip = feet - HIP;
  const shoulder = hip - TORSO + (st.stoop ? 3 : 0);
  const headY = shoulder - NECK_GAP - HEAD_R + (st.stoop ? 1 : 0);

  // Thứ tự vẽ = thứ tự lớp từ SAU ra TRƯỚC. Tay xa phải nằm trước thân
  // trong danh sách này để bị thân che bớt (xem chú thích ở `arms`).
  legs(g, cx, feet, hip, dir, st);
  arms(g, cx, shoulder, dir, st, "behind", pose);

  g.fillStyle(shade(st.skin, -20), 1);                              // cổ, khuất sau áo
  g.fillRoundedRect(cx - 3.8, shoulder - 7, 7.6, 9, 2);

  torso(g, cx, shoulder, dir, st);
  if (st.apron !== undefined) apron(g, cx, shoulder, dir, st.apron);
  arms(g, cx, shoulder, dir, st, "front", pose);
  if (st.bag !== undefined && pose === "idle" && dir !== "n") bag(g, cx, shoulder, dir, st);
  head(g, cx, headY, dir, st);
}

/**
 * Nướng texture cho một nhân vật. `who` là tiền tố tên texture.
 * Chỉ nướng thêm tư thế `carry` cho ai thật sự bưng đồ — mỗi tư thế là 3 texture nữa.
 */
export function buildBody(
  scene: Phaser.Scene, who: string, style: BodyStyle, poses: readonly Pose[] = ["idle"],
) {
  for (const pose of poses) {
    DIRS.forEach((dir) =>
      prop(scene, keyOf(who, dir, pose), heightFor(BODY_H),
        (g, cx, cy) => draw(g, cx, cy, dir, style, pose)));
  }
}

export function buildCharacter(scene: Phaser.Scene) {
  buildBody(scene, "p", PLAYER_STYLE, ["idle", "carry"]);
}
