/**
 * Góc phố có quán bánh mì — dữ liệu thuần. Camera nhìn từ (−x, −y): y CÀNG LỚN CÀNG GẦN người xem.
 *
 * ⚠️ HÀNG y1 VÀ y6 BỊ KHOÁ — `world/stations.ts` đọc `STATION_ROW_Y` / `COUNTER_Y` từ đây. Chèn
 * hàng vào giữa mà quên sửa hai hằng số đó là đẩy trạm ra khỏi quầy, và `assertWalkable()` chỉ
 * xét chỗ người đứng chứ không xét trạm.
 */
export const MAP = [
  "NN###D###############NN",  // y0  nhà hàng xóm · tường sau quán có CỬA ở x=5
  "###XK..O..V..T.WP...###",  // y1  bình chữa cháy · kệ · lò · THÙNG RÁC · thùng trà đá · bồn rửa · chậu cây
  "###.................##N",  // y2  lối đi sau quầy
  "###.................###",  // y3  lối đi sau quầy
  "###.................###",  // y4  lối đi sau quầy
  "###.................##N",  // y5  lối đi sau quầy
  "###QQQQQQQQQQQQQQQ..###",  // y6  QUẦY x=3..17 (thớt x=4, rổ x=8, chỗ đưa hàng x=12) — lối ra 2 ô ở x=18,19
  ".................A.....",  // y7  vỉa hè — hàng khách đứng gọi món · bảng gỗ "bánh mì ngon" ở đầu quầy (x=17)
  ".......................",  // y8  vỉa hè — LỐI ĐI của khách, từ đầu hẻm bên trái
  ".......................",  // y9  vỉa hè — trống
  "..C.V..................",  // y10 két nước · thùng rác
  "..............b.ss.MM.P",  // y11 bàn có hũ đũa · hai ghế nhựa · xe máy dựng · chậu cây
  ".......................",  // y12 lòng đường
  ".......................",  // y13 lòng đường
  ".......................",  // y14 lòng đường
  ".......................",  // y15 lòng đường
  ".......................",  // y16 lòng đường
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

/**
 * ĐẠO CỤ MUA ĐƯỢC — ký tự bản đồ ↦ mã món đồ nghề mở khoá nó.
 *
 * Bốn ô này nằm sẵn trong `MAP` từ bản dựng đầu, nhưng ngày nào chưa mua thì không được có mặt
 * trên cảnh (xem `StallScene.propHidden`). Bảng này là MỘT NGUỒN cho cả hai nửa của chuyện đó:
 * không vẽ ra, VÀ không chặn chân ai.
 *
 * ⚠️ Giá trị để kiểu `string` chứ không `EquipId`: `world/` không được biết tới `sim/`.
 * `tests/p3-equipment` canh lại bốn mã này có thật trong `EQUIP`.
 */
export const BUYABLE_TILES: Readonly<Record<string, string>> = {
  s: "GHE_BAN",      // ghế nhựa
  b: "GHE_BAN",      // bàn nhỏ — cùng một món với ghế
  T: "BINH_TRA",     // thùng nước trà đá
  A: "BANG_HIEU",    // bảng gỗ chữ A "bánh mì ngon" ở đầu quầy
};

/**
 * Ô đạo cụ CHƯA MUA — rỗng cho tới khi một buổi bán khai ra (`StallScene`, `sim/headless`).
 *
 * Trạng thái sống trong một module dữ liệu là chuyện đáng ngờ, nên: nó được đặt ĐÚNG MỘT LẦN lúc
 * dựng buổi bán, trước khi có ai bước chân, và chỉ nhận một giá trị suy thẳng từ đồ nghề đã lưu —
 * nên cùng save + cùng seed vẫn ra cùng một buổi. Đường kia là luồn danh sách này qua `hitsWall`
 * xuống tới `walk()` nằm sâu trong `sim/service.ts`, chỗ không biết gì về đồ nghề.
 */
let openTiles: ReadonlySet<string> = new Set();

/** Ô nào đang MỞ hôm nay, suy từ đồ nghề đã mua. `owns` chính là `has(equipment, id)`. */
export function openTilesFor(owns: (id: string) => boolean): string[] {
  return Object.keys(BUYABLE_TILES).filter((code) => !owns(BUYABLE_TILES[code]));
}

/** ⚠️ Gọi TRƯỚC khi ai đó bắt đầu đi. Gọi với danh sách rỗng là trả bản đồ về nguyên trạng. */
export function setOpenTiles(codes: Iterable<string>) {
  openTiles = new Set(codes);
}

/**
 * Ô nào chặn chân người chơi. Ghế nhựa cũng chặn — đi vòng qua ghế là chuyện đời thường.
 *
 * Trừ cái ghế CHƯA MUA: chủ dự án chỉ ra *"chỗ ô của ghế vẫn bị chiếm chỗ"* — ghế ẩn rồi mà chân
 * vẫn đâm vào nó. Một vật vô hình chặn đường là lỗi tệ hơn hẳn một vật thừa, vì người chơi không
 * có cách nào đọc ra chuyện gì đang xảy ra.
 */
export function isBlocked(tx: number, ty: number) {
  const code = tileAt(tx, ty);
  return code !== "." && !openTiles.has(code);
}

/** `world/stations.ts` đọc hai hằng số này thay vì chép tay số hàng. */
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
/** Lối đi của khách. y9 soi SUỐT chiều ngang (nó cũng là lối người qua đường); y7/y8 chỉ soi khúc khách thật sự đi qua. */
const LANE_LAST_Y = 9;

export function floorAt(_tx: number, ty: number): Floor {
  if (ty <= SHOP_LAST_Y) return "shop";
  if (ty <= WALK_LAST_Y) return "walk";
  return "road";
}

/** DỮ KIỆN BẢN ĐỒ chứ không phải chuyện của lớp vẽ: vạch sơn là một đường liền nên phải ở một hàng cố định. */
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
 * ⚠️ Ở y9 (hàng vỉa hè NGOÀI) chứ không y7: `walk()` đi thẳng không né ai, nên vào từ hàng ngoài
 * thì khách men theo mép vỉa hè chứ không xuyên qua giữa hàng người đang chờ.
 */
export const CUSTOMER_GATE = { x: 1.5, y: 9.5 };

/** Cách cổng 3 ô chứ không 1: sát quá thì chị vừa rẽ vào đã chạm bán kính despawn và biến mất giữa chừng động tác. */
export const STREET_BIN = { x: 4.5, y: 9.45 };

/**
 * GÓC HẺM — sân khấu nghe lỏm: cách xe bánh mì ~4–5 m, cạnh hai cái ghế nhựa. Ở phía PHẢI vì bên
 * trái là lối khách vào, mà hai người đứng tám giữa lối đi thì cả hàng khách phải lách qua họ.
 */
export const GOSSIP_CORNER = [{ x: 16.4, y: 10.4 }, { x: 17.5, y: 10.45 }] as const;

/**
 * Một HÀNG NGANG song song với quầy, lùi dần sang TRÁI.
 *
 * ⚠️ Không chéo ra đường: `depthOf` vẽ theo (x+y), nên hàng chéo cho người thứ tư vẽ ĐÈ lên người
 * đang gọi món. Giãn 1,5 ô để còn thấy KHE HỞ — "hàng dài" phải đọc ra từ hình, không phải đếm.
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
 * Phải nằm NGOÀI hàng chờ thật, không phải một chỗ khác TRONG hàng — nếu không người chơi chỉ
 * thấy hai người đổi chỗ. Lùi một hàng ra ngoài nên `depthOf` vẽ họ ĐÈ LÊN người đang gọi món.
 */
export const ASIDE_SPOT = { x: 13.9, y: 8.5 };

/**
 * Ngoài khúc lối đi (x ≤ 13) và tách khỏi `ASIDE_SPOT` một quãng — trùng nhau thì "dạt ra" và
 * "đứng cho mát" ra cùng một dáng người ở cùng một điểm. MỘT CHỖ, MỘT NGƯỜI.
 *
 * ⚠️ 15,6 → 15,0 khi quầy ngắn đi 3 ô: khúc vỉa hè bên phải hàng chờ hẹp lại đúng 3 ô, mà bốn
 * thứ vẫn phải chen vào đó (nép ra · gánh bà Sáu · đứng mát · xe chú Kiệt). Giữ nguyên 15,6 thì
 * người đứng mát dính vào cái xe ở 16,1.
 */
export const SHADE_SPOT = { x: 15.0, y: 8.2 };

/** Sát `ASIDE_SPOT` nhưng lùi vào trong: ngồi là ở TRONG quán, khác hẳn đứng nép ra cho người ta qua. */
export const SEAT_SPOT = { x: 16.6, y: 10.4 };

/** HAI — đọc từ `slots` của `GHE_BAN` trong `equipment.json`. Khác `SHADE_CAPACITY` (một): ghế là đồ mình mua. */
export const SEAT_CAPACITY = 2;

/**
 * `GANH_OUT` là chỗ bà Sáu hạ gánh theo thói quen — ngay mặt tiền, tiện cho bà, vướng cho mình
 * (chiếm một chỗ, khách nhìn vô thấy chật). `GANH_IN` là trong quán sát vách: bưng vô đó là một
 * việc mình làm giùm.
 */
export const GANH_OUT = { x: 14.6, y: 7.4 };
export const GANH_IN = { x: 11.9, y: 9.6 };

/**
 * XE BÁNH MÌ CỦA CHÚ KIỆT — act `MOVE_CART`. Ba chỗ, ba chuyện khác nhau.
 *
 * `P2-08` §2 nhóm C: *"hai cái xe tranh chỗ là arc của ông"*. Mà tới đợt này mười một câu
 * nói về cái xe đó đều là chữ suông — kể cả câu *"chú đứng chắn hết lối rồi"*, vốn mang
 * `STEP_ASIDE`, tức bảo NGƯỜI dạt ra chứ không dời CÁI XE.
 *
 * `CART_LAN`  — chú đẩy sát qua mặt tiền mình. Chắn lối, VÀ ăn bớt khách.
 * `CART_XA`   — chú về chỗ chú, bên kia hẻm.
 * `CART_CHUNG`— hai xe chung một mái, lúc mưa. Mình mất một khoảng mặt tiền, chú khỏi ướt.
 */
/*
 * ⚠️ Ba con số này ĐI THEO chiều dài quầy. Quầy rút 3 ô (x=3..17) thì mặt tiền cũng rút 3 ô, nên
 * "lấn qua mặt tiền mình" phải là một chỗ KHÁC trước. Dời thẳng −3 thì `CART_LAN` rơi đúng lên
 * `GANH_OUT` (14,6) — hai vật thể khác nhau, hai arc khác nhau, một điểm. 16,1 là chỗ xa gánh
 * nhất mà vẫn còn nằm trong mặt tiền (`SHOPFRONT_X` = 3..18).
 * `CART_XA` giữ khoảng cách ≥ 3 ô với `CART_LAN` — `assertWalkable()` gác đúng điều đó.
 */
export const CART_LAN = { x: 16.1, y: 7.6 };
export const CART_XA = { x: 19.4, y: 7.6 };
export const CART_CHUNG = { x: 14.0, y: 8.8 };

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
  check("MENU_SPOT", MENU_SPOT);
  check("CUSTOMER_GATE", CUSTOMER_GATE);
  check("STREET_BIN", STREET_BIN);
  check("ASIDE_SPOT", ASIDE_SPOT);
  check("SHADE_SPOT", SHADE_SPOT);
  check("SEAT_SPOT", SEAT_SPOT);
  check("GANH_OUT", GANH_OUT);
  check("GANH_IN", GANH_IN);
  check("CART_LAN", CART_LAN);
  check("CART_CHUNG", CART_CHUNG);
  if (Math.hypot(CART_XA.x - CART_LAN.x, CART_XA.y - CART_LAN.y) < 3) {
    bad.push("CART_XA quá sát CART_LAN — đẩy đi với lấn chỗ trông như một chỗ");
  }
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
 * BẢNG MENU — treo trên cùng mặt vách, ở khúc BÊN PHẢI, và chỗ này không phải tuỳ tiện.
 *
 * Người chơi phải ĐỨNG CẠNH nó mới bấm E đọc được, mà `stationNear` bắt mọi trạm trong
 * bán kính 1,6 ô. Chạy thử hết hàng y1 thì khúc đứng được CHỈ CÒN MỘT: mọi chỗ trống khác
 * đều lọt vào tầm với của một trạm — (5,5) là cái kệ, (6,5)/(9,0) là cái lò, (12,0) là
 * thùng rác, (14,5) là thùng trà. Từ x = 17,2 trở đi mới ra khỏi bán kính của bồn rửa
 * (x15), nên bảng treo ở x17 và chỗ đứng là (17,5 · 1,5).
 *
 * ⚠️ Chỗ gác đúng khoảng cách này là `stations.assertMenuSpotFree()` — ở đó vì bán kính với
 * tới là chuyện của `stations.ts`, mà `world/map.ts` không được biết tới nó (vòng lặp module).
 */
/**
 * ⚠️ x = 16,6 với bề ngang 40 px (`art/menuboard`) là để tấm bảng phủ ĐÚNG ba ô tường
 * x = 15 · 16 · 17, không chạm ô x = 18. Đó là điều kiện để nó có một `depth` đặt vừa
 * khít: trên ba ô tường ấy, mà vẫn dưới người chơi đứng ở hàng y = 1 và dưới nhà bên.
 * Nới bảng rộng ra là mất chỗ khít đó — xem `MENU_DEPTH_AT`.
 */
export const MENU_TILE = { x: 16.6, y: 0.5 };

/**
 * Điểm dùng để tính `depth` của tấm bảng: ngay SAU mép phải của nó, còn trước ô tường
 * kế tiếp. `depthOf` xếp theo (x + y) nên một vật trải qua nhiều ô chỉ có đúng MỘT độ
 * sâu — không có cách nào lồng nó xen kẽ vào dãy ô tường. Chọn mốc này thì:
 *   · ba ô tường nó treo lên (depth 16000 · 17000 · 18000) nằm DƯỚI  → bảng hiện ra
 *   · người chơi đứng đọc ở (17,5 · 1,5) (depth 19000) nằm TRÊN      → không bị bảng đè
 *   · nhà bên và khúc tường góc (≥ 21000) nằm TRÊN                   → bảng không tràn ra
 */
export const MENU_DEPTH_AT = { x: MENU_TILE.x + 1.5, y: MENU_TILE.y };
/** Chỗ đứng đọc bảng. Ngay dưới bảng, trong khu làm việc. */
export const MENU_SPOT = { x: 17.5, y: 1.5 };
/** Với tới bảng trong bán kính này (ô) — rộng hơn trạm một chút vì nó treo trên cao. */
export const MENU_REACH = 1.6;

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
