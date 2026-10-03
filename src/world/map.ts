/**
 * Góc phố có quán bánh mì — dữ liệu thuần, tách khỏi phép chiếu và khỏi scene. Sửa cái quán =
 * sửa mấy dòng chuỗi ở đây, không đụng code vẽ.
 *
 * Camera nhìn từ phía (−x, −y): y CÀNG LỚN CÀNG GẦN người xem, nên quán nằm ở y nhỏ còn vỉa hè
 * và đường ở y lớn.
 *
 *   y0         tường sau + cửa ra vào
 *   y1         HÀNG TRẠM — kệ, lò, thùng trà đá, bồn rửa tay
 *   y2..y5     trong quán — khu người chơi làm việc
 *   y6         QUẦY tủ kính, sát mặt tiền; chừa lối đi RỘNG 2 Ô ở đầu quầy (một ô không lọt,
 *              thân người rộng 0,6 ô)
 *   y7..y11    vỉa hè — khách đứng gọi món ở y7; y7..y9 là LỐI ĐI của khách nên phải sạch đồ
 *              đạc tới cỡ x=13, đồ dồn xuống y10/y11
 *   y12..y16   lòng đường
 *
 * ⚠️ HÀNG y1 VÀ y6 BỊ KHOÁ: `world/stations.ts` đọc `STATION_ROW_Y` và `COUNTER_Y` từ chính file
 * này. Chèn thêm hàng vào giữa mà quên sửa hai hằng số đó là đẩy trạm ra khỏi quầy —
 * `assertWalkable()` chỉ xét chỗ người đứng, không xét trạm.
 *
 * Ba cột ngoài cùng mỗi bên là khối nhà hàng xóm, đặc. Vỉa hè và lòng đường KHÔNG có tường: hẻm
 * chạy thông suốt ra hai mép khung hình.
 */
export const MAP = [
  "NN###D##################NN",  // y0  nhà hàng xóm · tường sau quán có CỬA ở x=5
  "###XK..O..V..T.WP......###",  // y1  bình chữa cháy · kệ · lò · THÙNG RÁC · thùng trà đá · bồn rửa · chậu cây
  "###....................##N",  // y2  lối đi sau quầy
  "###....................###",  // y3  lối đi sau quầy
  "###....................###",  // y4  lối đi sau quầy
  "###....................##N",  // y5  lối đi sau quầy
  "###QQQQQQQQQQQQQQQQQQ..###",  // y6  QUẦY (thớt x=4, rổ x=8, chỗ đưa hàng x=12) — lối ra 2 ô ở x=21,22
  "....................A.....",  // y7  vỉa hè — hàng khách đứng gọi món · bảng gỗ "bánh mì ngon" ở đầu quầy (x=20)
  "..........................",  // y8  vỉa hè — LỐI ĐI của khách, từ đầu hẻm bên trái
  "..........................",  // y9  vỉa hè — trống
  "..C.V.....................",  // y10 két nước · thùng rác
  ".................b.ss.MM.P",  // y11 bàn có hũ đũa · hai ghế nhựa · xe máy dựng · chậu cây
  "..........................",  // y12 lòng đường
  "..........................",  // y13 lòng đường
  "..........................",  // y14 lòng đường
  "..........................",  // y15 lòng đường
  "..........................",  // y16 lòng đường
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
 * Hàng của HÀNG TRẠM và của QUẦY. `world/stations.ts` đọc hai hằng số này thay vì chép tay số
 * hàng — hồi còn ghi số thì đẩy quầy ra một hàng là ba cái trạm đứng chơ vơ giữa lối đi mà không
 * có gì báo.
 */
export const STATION_ROW_Y = 1;
export const COUNTER_Y = 6;

/**
 * Loại mặt sàn, suy ra từ HÀNG chứ không từ ký tự — nhờ vậy đặt một cái ghế
 * lên vỉa hè không làm mất miếng vỉa hè dưới chân nó.
 */
export type Floor = "shop" | "walk" | "road";

/** Hàng cuối của mỗi dải. Đổi bản đồ thì đổi ở đây, đừng rải số vào `floorAt`. */
const SHOP_LAST_Y = 6;
const WALK_LAST_Y = 11;
/**
 * Ba hàng vỉa hè trong cùng (y7..y9) là LỐI ĐI — `assertWalkable()` soi đúng dải này.
 * Hàng y9 soi SUỐT chiều ngang (nó cũng là lối người qua đường, `STREET_LANES`); y7 và
 * y8 chỉ soi khúc khách thật sự đi qua — xem `assertWalkable()`.
 */
const LANE_LAST_Y = 9;

export function floorAt(_tx: number, ty: number): Floor {
  if (ty <= SHOP_LAST_Y) return "shop";
  if (ty <= WALK_LAST_Y) return "walk";
  return "road";
}

/**
 * Hàng nào của lòng đường có vạch sơn giữa đường — DỮ KIỆN BẢN ĐỒ chứ không phải chuyện của lớp
 * vẽ: vạch sơn chạy thành một đường liền nên phải nằm ở một hàng cố định. Rắc theo hàm băm như ô
 * sàn thường là ra mấy vệt trắng lốm đốm giữa đường.
 */
export const ROAD_LANE_Y = 14;

/** Bán kính va chạm của người chơi, tính theo ô. */
export const BODY_RADIUS = 0.3;

/** Có va vào tường không, xét bốn góc của hình vuông bao quanh người. */
export function hitsWall(x: number, y: number, r = BODY_RADIUS) {
  for (const ox of [-r, r])
    for (const oy of [-r, r])
      if (isBlocked(Math.floor(x + ox), Math.floor(y + oy))) return true;
  return false;
}

/** Chỗ người chơi đứng lúc mở màn: giữa khu làm việc, cách quầy một bước. */
export const SPAWN = { x: 8.5, y: 3.5 };

/**
 * Cổng khách vào/ra. Mấy toạ độ này là DỮ KIỆN CỦA BẢN ĐỒ nên phải ở cùng file với bản đồ — để
 * trong `sim/service.ts` là có ngày ai đó đặt thùng rác lên đúng ô cổng rồi cả hàng khách đứng
 * chôn chân mà không ai biết vì sao. `assertWalkable()` bắt lỗi đó.
 *
 * Cổng ở ĐẦU HẺM BÊN TRÁI, TRÊN VỈA HÈ, và ở y9 (hàng vỉa hè NGOÀI) chứ không phải y7: `walk()`
 * đi thẳng không né ai, nên vào từ hàng ngoài thì khách men theo mép vỉa hè rồi mới tạt lên chỗ
 * đứng, chứ không xuyên thẳng qua giữa hàng người đang chờ.
 */
export const CUSTOMER_GATE = { x: 1.5, y: 9.5 };

/**
 * Chỗ đứng cạnh thùng rác đầu hẻm — chị Lan trả tiền, cầm bánh, ra tới đây bỏ vô thùng. Frame
 * quan trọng nhất của cả game nên nó phải nằm TRONG khung hình, trên đường khách vẫn đi ra cổng.
 *
 * Cách cổng 3 ô chứ không phải 1: sát quá thì chị vừa rẽ vào đã chạm bán kính despawn 0,5 ô của
 * cổng và biến mất giữa chừng động tác.
 */
export const STREET_BIN = { x: 4.5, y: 9.45 };

/**
 * GÓC HẺM — sân khấu nghe lỏm: cách xe bánh mì ~4–5 m, cạnh hai cái ghế nhựa. Ở phía PHẢI vì bên
 * trái là lối khách vào, mà hai người đứng tám giữa lối đi thì cả hàng khách phải lách qua họ.
 */
export const GOSSIP_CORNER = [{ x: 19.4, y: 10.4 }, { x: 20.5, y: 10.45 }] as const;

/**
 * Chỗ đứng xếp hàng — một HÀNG NGANG song song với quầy: người đầu tiên đứng ngay trước chỗ đưa
 * hàng (x=12), người sau lùi dần SANG TRÁI, cùng một hàng y.
 *
 * ⚠️ Hàng ngang chứ không chéo ra đường là chuyện HÌNH HỌC: `depthOf` vẽ theo (x+y), nên hàng
 * chéo cho người đứng sau x+y lớn hơn và người thứ tư vẽ ĐÈ lên người đang gọi món. Lùi theo
 * trục x thuần thì người đầu hàng luôn nằm TRÊN CÙNG.
 *
 * Giãn 1,5 ô = 45 px, rộng hơn một thân người (~26 px) nên còn thấy rõ KHE HỞ: "đang có hàng
 * dài" phải đọc ra được từ hình, không phải đếm.
 *
 * `service.ts` vẫn dồn khách thứ 7 trở đi vào chỗ CUỐI, nên sáu chỗ chỉ đẩy bug đó ra xa chứ
 * không chữa — chữa thật là luật "đông quá thì thôi không mua" bên `service.ts`.
 */
export const QUEUE_SLOTS = [
  { x: 12.5, y: 7.6, zone: "FRONT_CENTER" },
  { x: 11.0, y: 7.6, zone: "FRONT_SIDE" },
  { x: 9.5, y: 7.6, zone: "QUEUE_2" },
  { x: 8.0, y: 7.6, zone: "QUEUE_3" },
  { x: 6.5, y: 7.6, zone: "SEATED_FAR" },
  { x: 5.0, y: 7.6, zone: "SEATED_FAR" },
] as const;

/**
 * CHỖ ĐỨNG DẠT RA — "Con đứng qua bên cho cô bán nghen" (`STEP_ASIDE`). Phải nằm NGOÀI hàng chờ
 * thật, không phải một chỗ khác TRONG hàng, nếu không người chơi chỉ thấy hai người đổi chỗ.
 *
 *  · x=13,9 — bên phải đầu hàng, lệch hẳn khỏi dãy người đứng mà vẫn trong tầm với của quầy
 *    (`FRONT_SIDE`), và nằm ngoài khúc lối đi x ≤ 13 mà `assertWalkable()` bắt phải sạch
 *  · y=8,5 — lùi một hàng ra ngoài, nên `depthOf` vẽ họ ĐÈ LÊN người đang gọi món: nhìn ra ngay
 *    là một người đã bước ra khỏi hàng
 */
export const ASIDE_SPOT = { x: 13.9, y: 8.5 };

/**
 * CHỖ HÓNG MÁT / TRÚ MƯA — 38 nút thoại chờ ô này tồn tại. Trước đó `Service.shadeFree` khai ra
 * rồi không ai gán, vì không có ô nào để gán về: khoá có thật, chỗ đứng thì không.
 *
 *  · x=15,6 — ngoài khúc lối đi (x ≤ 13), và tách khỏi `ASIDE_SPOT` một quãng vì hai chỗ trùng
 *    nhau thì "dạt ra" và "đứng cho mát" ra cùng một dáng người ở cùng một điểm
 *  · y=8,2 — mép trong vỉa hè, dưới mái hiên nhà bên; vẫn trong tầm nhìn và tầm nói
 *
 * MỘT CHỖ, MỘT NGƯỜI — đó là cả lý do `w.shadeFree` là sự thật ĐỘNG (ra dấu "?" chứ không ẩn nút).
 */
export const SHADE_SPOT = { x: 15.6, y: 8.2 };

/**
 * CHỖ NGỒI — act `THEY_SIT`, mở khoá bằng thiết bị `GHE_BAN` (Ghế nhựa + bàn nhỏ).
 *
 * Trước đợt này `GHE_BAN` **chỉ là một món đồ mua được và một hình vẽ**: 24 nút thoại
 * mời người ta ngồi (`needEquip: "GHE_BAN"`) mà không nút nào làm người ta ngồi xuống —
 * đúng loại "lời nói miễn phí" mà lưới `A-1` sinh ra để dẹp, chỉ là nó nằm ở tầng act
 * chứ không ở tầng chữ nên không lưới nào thấy.
 *
 * Đặt sát ASIDE_SPOT nhưng lùi vào trong (x nhỏ hơn, y sâu hơn): ngồi là ở TRONG quán,
 * khác hẳn đứng nép ra cho người ta qua.
 */
export const SEAT_SPOT = { x: 12.8, y: 9.2 };

/**
 * Mấy người ngồi được cùng lúc. HAI — `equipment.json` ghi `slots: 2` cho `GHE_BAN`
 * ("Ghế nhựa + bàn nhỏ"), nên con số này đọc từ chính món đồ chứ không bịa ra.
 *
 * Khác `SHADE_CAPACITY` (một): chỗ mát là một mẩu bóng râm, còn cái ghế là đồ mình mua —
 * mua rồi thì nó phải đáng tiền hơn một mẩu bóng.
 */
export const SEAT_CAPACITY = 2;

/**
 * CHỖ ĐỂ CÁI GÁNH — act `CARRY_GANH` / `MOVE_GANH`, của bà Sáu.
 *
 * Bà Sáu gánh tàu hũ tới, và cái gánh ĐẶT XUỐNG ĐÂU là một chuyện có hậu quả: để ngoài
 * thì nó chiếm mặt tiền, khách nhìn vô thấy chật và quay đầu nhiều hơn. `P2-08` §2 nhóm
 * C đòi 11 lần, và chính nội dung đã viết sẵn cả ba vai của nó — nặng vai bà, chắn lối
 * khách, gửi lại một nồi — mà không có vật thể nào để bám.
 *
 * `GANH_OUT` là chỗ bà hạ gánh theo thói quen: ngay mặt tiền, tiện cho bà, vướng cho mình.
 * `GANH_IN` là trong quán, sát vách — bưng vô đó là một việc mình làm giùm.
 */
export const GANH_OUT = { x: 14.6, y: 7.4 };
export const GANH_IN = { x: 11.9, y: 9.6 };

/** Mấy người đứng mát được cùng lúc. Một — xem khối trên. */
export const SHADE_CAPACITY = 1;

/**
 * LỐI NGƯỜI QUA ĐƯỜNG — hai dải chạy SUỐT chiều ngang bản đồ, cho người chỉ đi ngang chứ không
 * ghé. Họ là cái nền làm cho "có người nhìn" còn nghĩa: quầy trống mà cả khu phố cũng trống thì
 * không có ai để mà không nhìn.
 *
 *  · y9,6 — hàng vỉa hè NGOÀI của lối đi, đã được `assertWalkable()` bảo đảm sạch suốt chiều
 *    ngang. Nằm NGOÀI hàng khách đứng nên người đi ngang che chân chứ không che MẶT (kênh 1,
 *    không được phép bị che — CANON §5).
 *  · y12,4 — mép trong lòng đường. Hai dải khác chiều sâu thì cái hẻm mới có lớp.
 *
 * ⚠️ Hàng y10/y11 KHÔNG dùng được: đó là chỗ để két nước, thùng rác, bàn ghế, xe máy.
 */
export const STREET_LANES = [
  { id: "he", y: 9.6 },
  { id: "duong", y: 12.4 },
] as const;

/**
 * Hai đầu lối đi. Nằm NGOÀI khung nhìn ở cả hai phía (phép chiếu iso kéo một dải ngang
 * thành một đường chéo, nên mép trái của dải rơi hẳn ra ngoài mép màn hình) — người ta
 * phải ĐI VÀO khung hình, không được hiện ra giữa đường.
 *
 * Không đặt ngoài mép bản đồ: `tileAt` trả "#" cho mọi ô ngoài biên, nên x < 0 là tường,
 * và `walk()` sẽ ghim người ta tại chỗ ngay bước đầu tiên.
 */
export const STREET_X = [0.6, WORLD_W - 0.6] as const;

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
  check("ASIDE_SPOT", ASIDE_SPOT);
  check("SHADE_SPOT", SHADE_SPOT);
  check("SEAT_SPOT", SEAT_SPOT);
  check("GANH_OUT", GANH_OUT);
  check("GANH_IN", GANH_IN);
  if (Math.hypot(GANH_IN.x - GANH_OUT.x, GANH_IN.y - GANH_OUT.y) < 1.5) {
    bad.push("GANH_IN quá sát GANH_OUT — bưng vô với để ngoài trông như một chỗ");
  }
  if (Math.hypot(SEAT_SPOT.x - SHADE_SPOT.x, SEAT_SPOT.y - SHADE_SPOT.y) < 1) {
    bad.push("SEAT_SPOT nằm chồng lên SHADE_SPOT — ngồi với đứng mát thành một chỗ");
  }
  if (Math.hypot(SEAT_SPOT.x - ASIDE_SPOT.x, SEAT_SPOT.y - ASIDE_SPOT.y) < 1) {
    bad.push("SEAT_SPOT nằm chồng lên ASIDE_SPOT — ngồi với nép ra thành một chỗ");
  }
  // Hai chỗ đứng khác nhau phải TRÔNG khác nhau — trùng chỗ là hai việc khác hẳn nhau
  // ("dạt ra nhường hàng" và "đứng nhờ cho mát") ra cùng một dáng người ở cùng một điểm.
  if (Math.hypot(SHADE_SPOT.x - ASIDE_SPOT.x, SHADE_SPOT.y - ASIDE_SPOT.y) < 1) {
    bad.push("SHADE_SPOT nằm chồng lên ASIDE_SPOT — người chơi không phân biệt được hai việc");
  }
  GOSSIP_CORNER.forEach((p, i) => check(`GOSSIP_CORNER[${i}]`, p));
  QUEUE_SLOTS.forEach((s, i) => check(`QUEUE_SLOTS[${i}]`, s));

  // Hàng nào ngắn hơn là `tileAt` trả "#" ở mép phải mà không ai ngờ: cả một mảng
  // vỉa hè bỗng dưng chặn chân, nhìn thì vẫn thấy sàn.
  MAP.forEach((row, y) => {
    if (row.length !== WORLD_W) bad.push(`hàng y${y} dài ${row.length} ô, phải là ${WORLD_W}`);
  });

  // Quầy phải LIỀN MẠCH: một ô "." lọt giữa dãy Q là một cái khe khách thò tay qua
  // được, mà `art/index.ts` lại vẽ ra hai đầu quầy ở giữa quầy — nhìn ra ngay.
  const counter = MAP[COUNTER_Y];
  const lo = counter.indexOf("Q"), hi = counter.lastIndexOf("Q");
  if (lo < 0) bad.push(`COUNTER_Y = ${COUNTER_Y} mà hàng đó không có ô quầy nào`);
  else for (let x = lo; x <= hi; x++) {
    if (counter[x] !== "Q") { bad.push(`quầy thủng ở x=${x} (ô "${counter[x]}")`); break; }
  }

  // Lối khách đi phải sạch: `service.walk()` đi thẳng từ cổng tới chỗ đứng, không né
  // được đồ đạc. Một cái ghế kê nhầm vào đây là khách ủi vào nó rồi đứng rung tại chỗ.
  //
  // Soi ĐÚNG KHÚC họ đi qua, không soi suốt chiều ngang: khúc cần sạch trải từ
  // `CUSTOMER_GATE` tới chỗ đứng xa nhất của `QUEUE_SLOTS`, nên lấy thẳng từ hai dữ
  // kiện đó (nới ra một thân người) chứ không gõ tay — dời cổng hay nới hàng chờ thì
  // cái gác tự theo. Khúc bên phải hàng chờ không ai đi qua: đó là chỗ ngoài lối ra
  // quầy, kê được đồ (bảng gỗ "bánh mì ngon" đứng ở y7 x=20).
  //
  // Trừ hàng NGOÀI CÙNG (y9): nó là lối người qua đường, chạy hết bề ngang bản đồ,
  // nên vẫn soi suốt — `STREET_LANES` bên dưới soi lại theo đúng bán kính người đi.
  const laneXs = [CUSTOMER_GATE.x, ...QUEUE_SLOTS.map((s) => s.x)];
  const laneLo = Math.floor(Math.min(...laneXs) - BODY_RADIUS);
  const laneHi = Math.ceil(Math.max(...laneXs) + BODY_RADIUS);
  for (let ty = SHOP_LAST_Y + 1; ty <= LANE_LAST_Y; ty++) {
    const full = ty === LANE_LAST_Y;
    const lo = full ? 0 : laneLo, hi = full ? WORLD_W - 1 : laneHi;
    for (let tx = lo; tx <= hi; tx++) {
      if (MAP[ty][tx] === ".") continue;
      bad.push(`lối khách đi y${ty} bị chặn ở x=${tx} (ô "${MAP[ty][tx]}")`);
      break;
    }
  }

  // Lối NGƯỜI QUA ĐƯỜNG: chạy suốt từ đầu này tới đầu kia, nên phải soi cả dải chứ
  // không chỉ soi một điểm. Nửa ô một bước là đủ dày để không lọt một cái ghế nào.
  for (const lane of STREET_LANES) {
    for (let x = STREET_X[0]; x <= STREET_X[1] + 1e-6; x += 0.5) {
      if (!hitsWall(x, lane.y)) continue;
      bad.push(`lối qua đường "${lane.id}" (y${lane.y}) bị chặn ở x=${x.toFixed(1)} (ô "${tileAt(x | 0, lane.y | 0)}")`);
      break;
    }
  }

  if (bad.length) {
    throw new Error(`Bản đồ chặn mất chỗ phải đứng được:\n  ${bad.join("\n  ")}`);
  }
}

/**
 * Bảng hiệu gắn trên tường sau, giữa mặt tiền quán.
 * Đặt lệch hẳn khỏi trục dọc của CỬA (x=5) và của mọi trạm, vì bảng rộng gần 200px
 * nên rất dễ đè lên nhãn trạm hoặc che mất cánh cửa.
 */
export const SIGN_TILE = { x: 10.5, y: 0.5 };

/**
 * KHÚC X CỦA MẶT TIỀN QUÁN — suy từ dãy ô quầy, không gõ tay.
 *
 * Mép mái hiên nhỏ nước xuống đúng khúc này (`ui/stall/Rain`): mái che tới đâu thì
 * nước chảy xuống tới đó. Dời quầy dài ra hay ngắn lại thì vệt nước theo luôn, chứ
 * không còn một hàng giọt treo lơ lửng ở khúc không có mái nào.
 */
export const SHOPFRONT_X = (() => {
  const row = MAP[COUNTER_Y];
  return { lo: row.indexOf("Q"), hi: row.lastIndexOf("Q") + 1 };
})();

/**
 * HÀNG ĐẦU TIÊN CÓ TRỜI Ở TRÊN ĐẦU — mép mái hiên của quán.
 *
 * Một con số, hai cái luật ngược nhau dùng chung: vạt nắng chỉ rọi từ đây trở ra
 * (`isSunlit`), và mưa cũng chỉ rơi từ đây trở ra (`world/rain.ts`). Chép tay hai
 * lần là có ngày sửa một chỗ: nắng rọi tới đâu thì mưa phải tạnh tới đó, nếu không
 * thì cái quán vừa có mái vừa không có mái tuỳ theo hôm nay trời thế nào.
 *
 * Trong quán thì râm, và khô — đó là lý do người ta tấp vào.
 */
export const SKY_FROM_Y = SHOP_LAST_Y + 1;

/**
 * Vạt nắng gắt rọi xiên xuống vỉa hè và mặt đường.
 * Trong quán thì râm — đó là lý do người ta tấp vào.
 */
export function isSunlit(tx: number, ty: number) {
  if (ty < SKY_FROM_Y) return false;
  const d = tx - ty;
  return d >= -2 && d <= 7;
}
