/**
 * Góc phố có quán bánh mì — dữ liệu thuần, tách khỏi phép chiếu và khỏi scene.
 * Sửa cái quán = sửa mấy dòng chuỗi ở đây, không đụng tới code vẽ.
 *
 * Camera nhìn từ phía (-x, -y): y CÀNG LỚN CÀNG GẦN người xem.
 * Nên quán nằm ở y nhỏ (phía trong), vỉa hè và đường nằm ở y lớn (phía ngoài).
 * Nhờ vậy nhìn thẳng vào mặt tiền quán, không bức tường nào chắn.
 *
 *   y0        tường sau + cửa ra vào, hai bên là mặt tiền nhà hàng xóm
 *   y1..y3    trong quán — khu người chơi làm việc
 *   y4        QUẦY tủ kính — chừa lối đi RỘNG 2 Ô ở đầu quầy để còn ra ngoài dọn bàn,
 *             kéo ghế. Một ô là không lọt: thân người rộng 0,6 ô nên khe 1 ô chỉ đi
 *             được khi canh chính giữa, chơi rất ức chế.
 *   y5..y6    chỗ khách đứng gọi món, trong quán
 *   y7..y8    vỉa hè — đồ đạc dồn hết về ĐẦU HẺM (x < 11). Khúc vỉa hè trước mặt quầy
             (x = 11..17) để TRỐNG: đó là chỗ hàng khách đứng và chỗ khách đi từ
             cổng vào, kê một cái ghế ra giữa đó là chắn ngay lối người ta đi.
 *   y9..y11   lòng đường
 *
 * Bốn cột ngoài cùng mỗi bên là khối nhà hàng xóm — đặc, không đi vào được.
 * Kích thước 20×12 là cố ý: chiếu ra 960×480 px nên CẢ cảnh lọt trong khung
 * 1024×576 kể cả phần tường cao nhô lên, không bị cắt ngọn.
 */
export const MAP = [
  "NN###D############NN",  // y0  nhà hàng xóm · tường sau quán có CỬA ở x=5 · nhà hàng xóm
  "###XK..O.....T.WP###",  // y1  bình chữa cháy · kệ nguyên liệu · lò than · thùng trà đá · bồn rửa tay · chậu cây
  "###..............##N",  // y2  lối đi sau quầy
  "###..............###",  // y3  lối đi sau quầy
  "###QQQQQQQQQQQQ..###",  // y4  QUẦY (thớt x=7, chỗ đưa hàng x=12) — lối ra 2 ô ở x=15,16
  "###..............##N",  // y5  chỗ khách đứng — FRONT_CENTER của bảng visibility
  "###..............###",  // y6  trong quán, sát mặt tiền
  "....................",  // y7  vỉa hè
  ".Css.A.b.MM.......V.",  // y8  két nước · hai ghế nhựa · bảng gỗ · bàn có hũ đũa · xe máy dựng · thùng rác
  "....................",  // y9  lòng đường
  "....................",  // y10 lòng đường
  "....................",  // y11 lòng đường
] as const;

export const WORLD_W = MAP[0].length;
export const WORLD_H = MAP.length;

/** Ký tự bản đồ. Mỗi ký tự ứng với đúng một texture, tra ở `art/index.ts`. */
export type TileCode =
  | "." | "#" | "N" | "D" | "Q" | "O" | "T" | "K" | "s" | "b" | "M" | "P"
  | "C" | "V" | "W" | "A" | "X";

export function tileAt(tx: number, ty: number): TileCode {
  if (tx < 0 || ty < 0 || tx >= WORLD_W || ty >= WORLD_H) return "#";
  return MAP[ty][tx] as TileCode;
}

/** Ô nào chặn chân người chơi. Ghế nhựa cũng chặn — đi vòng qua ghế là chuyện đời thường. */
export function isBlocked(tx: number, ty: number) {
  return tileAt(tx, ty) !== ".";
}

/**
 * Loại mặt sàn, suy ra từ HÀNG chứ không từ ký tự — nhờ vậy đặt một cái ghế
 * lên vỉa hè không làm mất miếng vỉa hè dưới chân nó.
 */
export type Floor = "shop" | "walk" | "road";

export function floorAt(_tx: number, ty: number): Floor {
  if (ty <= 6) return "shop";
  if (ty <= 8) return "walk";
  return "road";
}

/**
 * Hàng nào của lòng đường có vạch sơn giữa đường.
 * Là DỮ KIỆN BẢN ĐỒ chứ không phải chuyện của lớp vẽ: vạch sơn chạy thành một
 * đường liền, nên nó phải nằm ở một hàng cố định. Rắc theo hàm băm như ô sàn
 * thường là ra mấy vệt trắng lốm đốm giữa đường, nhìn ra ngay là lỗi.
 */
export const ROAD_LANE_Y = 10;

/** Bán kính va chạm của người chơi, tính theo ô. */
export const BODY_RADIUS = 0.3;

/** Có va vào tường không, xét bốn góc của hình vuông bao quanh người. */
export function hitsWall(x: number, y: number, r = BODY_RADIUS) {
  for (const ox of [-r, r])
    for (const oy of [-r, r])
      if (isBlocked(Math.floor(x + ox), Math.floor(y + oy))) return true;
  return false;
}

/** Chỗ người chơi đứng lúc mở màn: trong quán, sau quầy. */
export const SPAWN = { x: 8.5, y: 2.5 };

/**
 * Cổng khách vào/ra và chỗ đứng xếp hàng.
 *
 * Mấy toạ độ này là DỮ KIỆN CỦA BẢN ĐỒ nên phải ở cùng file với bản đồ.
 * Để chúng nằm trong `sim/service.ts` là kiểu gì cũng có ngày ai đó đặt cái
 * thùng rác lên đúng ô cổng rồi cả hàng khách đứng chôn chân mà không ai biết
 * vì sao — đã xảy ra đúng một lần rồi. `assertWalkable()` bên dưới bắt lỗi đó.
 */
export const CUSTOMER_GATE = { x: 18.5, y: 10.5 };

/**
 * Chỗ đứng cạnh thùng rác đầu hẻm (ô `V`, x=18 y=8) — P2-02 §4.6: chị Lan trả tiền,
 * cầm bánh, ra tới đây bỏ vô thùng. Frame quan trọng nhất của cả game: nó phải nằm
 * TRONG khung hình, trên đường khách vẫn đi ra cổng.
 */
export const STREET_BIN = { x: 18.45, y: 9.35 };

/**
 * GÓC HẺM — sân khấu nghe lỏm (P2-04 §2.7): chéo bên trái xe bánh mì, cách ~4–5 m, cạnh
 * hai cái ghế nhựa (ô `s` x=2 y=8). Hai người đứng nói chuyện — A kể, B nghe.
 */
export const GOSSIP_CORNER = [{ x: 3.4, y: 7.45 }, { x: 4.55, y: 7.9 }] as const;

/** Thứ tự từ sát quầy ra ngoài. `zone` là cột của bảng visibility (CANON §5). */
export const QUEUE_SLOTS = [
  { x: 12.5, y: 5.4, zone: "FRONT_CENTER" },
  { x: 13.9, y: 6.3, zone: "QUEUE_2" },
  { x: 15.2, y: 7.3, zone: "QUEUE_3" },
  { x: 16.6, y: 8.6, zone: "SEATED_FAR" },
] as const;

/**
 * Kiểm tra lúc khởi động: mọi điểm mà con người phải đứng được thì phải đi được.
 * Sửa bản đồ mà lỡ chặn mất một chỗ thì vỡ ngay ở đây, không phải mò nửa tiếng.
 */
export function assertWalkable() {
  const bad: string[] = [];
  const check = (name: string, p: { x: number; y: number }) => {
    if (hitsWall(p.x, p.y)) bad.push(`${name} (${p.x}, ${p.y}) -> ô "${tileAt(p.x | 0, p.y | 0)}"`);
  };
  check("SPAWN", SPAWN);
  check("CUSTOMER_GATE", CUSTOMER_GATE);
  check("STREET_BIN", STREET_BIN);
  GOSSIP_CORNER.forEach((p, i) => check(`GOSSIP_CORNER[${i}]`, p));
  QUEUE_SLOTS.forEach((s, i) => check(`QUEUE_SLOTS[${i}]`, s));
  if (bad.length) {
    throw new Error(`Bản đồ chặn mất chỗ phải đứng được:\n  ${bad.join("\n  ")}`);
  }
}

/**
 * Bảng hiệu gắn trên tường sau, giữa mặt tiền quán.
 * Đặt lệch hẳn khỏi trục dọc của CỬA (x=5) và của mọi trạm, vì bảng rộng gần 200px
 * nên rất dễ đè lên nhãn trạm hoặc che mất cánh cửa.
 */
export const SIGN_TILE = { x: 9.5, y: 0.5 };

/**
 * Vạt nắng gắt rọi xiên xuống vỉa hè và mặt đường.
 * Trong quán thì râm — đó là lý do người ta tấp vào.
 */
export function isSunlit(tx: number, ty: number) {
  if (ty < 7) return false;
  const d = tx - ty;
  return d >= -2 && d <= 7;
}
