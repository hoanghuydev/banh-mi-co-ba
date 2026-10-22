// Camera nhìn từ (−x, −y): y càng lớn càng gần; chèn hàng thì sửa cả `STATION_ROW_Y` / `COUNTER_Y`.
export const MAP = [
  "NN###D##########NN",  // y0  tường sau, cửa x=5
  "###XK.O.V.T.W..###",  // y1  bình chữa cháy · kệ · lò · thùng rác · trà đá · bồn rửa
  "###F...........###",
  "###............###",
  "###............##N",
  "###.Q.Q.Q......###",  // y5  ba bàn: thớt x=4, chỗ để bánh x=6, order x=8
  "..............A...",  // y6  hàng khách · bảng chữ A x=14
  "..................",  // y7  lối khách đi
  "..................",
  "..C.V.............",  // y9  két nước · thùng rác
  "..........b.ss.MMP",  // y10 bàn · ghế nhựa · xe máy · chậu cây
  "..................",  // y11+ lòng đường
  "..................",
  "..................",
  "..................",
  "..................",
] as const;

export const WORLD_W = MAP[0].length;
export const WORLD_H = MAP.length;

export type TileCode =
  | "." | "#" | "N" | "D" | "Q" | "O" | "T" | "K" | "s" | "b" | "M" | "P"
  | "C" | "V" | "W" | "A" | "X" | "F";

export function tileAt(tx: number, ty: number): TileCode {
  if (tx < 0 || ty < 0 || tx >= WORLD_W || ty >= WORLD_H) return "#";
  return MAP[ty][tx] as TileCode;
}

// Ô đạo cụ chưa mua thì không vẽ và không chặn; giá trị là `EquipId` nhưng để `string` vì `world/` không được import `sim/`.
export const BUYABLE_TILES: Readonly<Record<string, string>> = {
  s: "GHE_BAN",
  b: "GHE_BAN",
  T: "BINH_TRA",
  A: "BANG_HIEU",
};

// Chỉ đặt một lần lúc dựng buổi bán, suy từ save, để cùng save + seed vẫn ra cùng một buổi.
let openTiles: ReadonlySet<string> = new Set();

export function openTilesFor(owns: (id: string) => boolean): string[] {
  return Object.keys(BUYABLE_TILES).filter((code) => !owns(BUYABLE_TILES[code]));
}

/** Gọi trước khi có ai bắt đầu đi. */
export function setOpenTiles(codes: Iterable<string>) {
  openTiles = new Set(codes);
}

export function isBlocked(tx: number, ty: number) {
  const code = tileAt(tx, ty);
  return code !== "." && !openTiles.has(code);
}

export const STATION_ROW_Y = 1;
export const COUNTER_Y = MAP.findIndex((row) => row.includes("Q"));

/** Suy theo hàng chứ không theo ký tự, để ghế đặt trên vỉa hè vẫn có vỉa hè dưới chân. */
export type Floor = "shop" | "walk" | "road";

const SHOP_LAST_Y = COUNTER_Y;
const WALK_LAST_Y = 10;
const LANE_LAST_Y = 8;

export function floorAt(_tx: number, ty: number): Floor {
  if (ty <= SHOP_LAST_Y) return "shop";
  if (ty <= WALK_LAST_Y) return "walk";
  return "road";
}

export const ROAD_LANE_Y = 13;

/** Bán kính va chạm, đơn vị ô. */
export const BODY_RADIUS = 0.3;

/** Cột dù: cọc tròn nhỏ, không chiếm cả ô vì `SHADE_SPOT` và `GANH_OUT` nằm sát bên. */
const POLE_R = 0.2;
let pole: { x: number; y: number } | null = null;

export function setPole(p: { x: number; y: number } | null) {
  pole = p;
}

export function hitsWall(x: number, y: number, r = BODY_RADIUS) {
  if (pole && Math.hypot(x - pole.x, y - pole.y) < POLE_R + r) return true;
  for (const ox of [-r, r])
    for (const oy of [-r, r])
      if (isBlocked(Math.floor(x + ox), Math.floor(y + oy))) return true;
  return false;
}

export const SPAWN = { x: 8.5, y: 3.5 };

/** Ở y9 vì `walk()` đi thẳng không né, vào từ hàng ngoài để khỏi xuyên qua hàng chờ. */
export const CUSTOMER_GATE = { x: 1.5, y: 8.5 };

/** Cách cổng 3 ô để khỏi chạm bán kính despawn giữa động tác. */
export const STREET_BIN = { x: 4.5, y: 8.45 };

/** Hàng ngang, không chéo, vì `depthOf` vẽ theo (x+y) sẽ cho người sau đè người đang gọi món. */
export const QUEUE_SLOTS = [
  { x: 8.5, y: 6.6, zone: "FRONT_CENTER" },
  { x: 7.0, y: 6.6, zone: "FRONT_SIDE" },
  { x: 5.5, y: 6.6, zone: "QUEUE_2" },
  { x: 4.0, y: 6.6, zone: "QUEUE_3" },
  { x: 2.5, y: 6.6, zone: "SEATED_FAR" },
  { x: 1.0, y: 6.6, zone: "SEATED_FAR" },
] as const;

/** Lùi ra ngoài hàng chờ, để không trông như hai người đổi chỗ trong hàng. */
export const ASIDE_SPOT = { x: 9.9, y: 7.5 };

/** Tách khỏi `ASIDE_SPOT` và xe ở 16,1 để mỗi việc đọc ra một chỗ riêng. */
export const SHADE_SPOT = { x: 11.0, y: 7.3 };

export const SEAT_SPOT = { x: 12.6, y: 9.4 };

/** Khớp `slots` của `GHE_BAN` trong `equipment.json`. */
export const SEAT_CAPACITY = 2;

// OUT: bà Sáu hạ gánh ngay mặt tiền; IN: mình bưng vô sát vách giùm.
export const GANH_OUT = { x: 10.6, y: 6.4 };
export const GANH_IN = { x: 8.0, y: 8.6 };

// Xe chú Kiệt: lấn mặt tiền / về bên kia hẻm / chung mái lúc mưa; CART_LAN phải nằm trong `SHOPFRONT_X` mà không đè `GANH_OUT`.
export const CART_LAN = { x: 12.4, y: 6.5 };
export const CART_XA = { x: 15.8, y: 6.6 };
export const CART_CHUNG = { x: 10.2, y: 8.2 };

export const SHADE_CAPACITY = 1;

// Lối người qua đường; y10/y11 có đồ đạc nên không dùng được.
export const STREET_LANES = [
  { id: "he", y: 8.6 },
  { id: "duong", y: 11.4 },
] as const;

/** Ngoài khung nhìn nhưng trong bản đồ, vì ô ngoài biên là tường và `walk()` sẽ ghim người tại chỗ. */
export const STREET_X = [0.6, WORLD_W - 0.6] as const;

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
  if (Math.hypot(SHADE_SPOT.x - ASIDE_SPOT.x, SHADE_SPOT.y - ASIDE_SPOT.y) < 1) {
    bad.push("SHADE_SPOT nằm chồng lên ASIDE_SPOT — người chơi không phân biệt được hai việc");
  }
  QUEUE_SLOTS.forEach((s, i) => check(`QUEUE_SLOTS[${i}]`, s));

  MAP.forEach((row, y) => {
    if (row.length !== WORLD_W) bad.push(`hàng y${y} dài ${row.length} ô, phải là ${WORLD_W}`);
  });

  if (!MAP[COUNTER_Y].includes("Q")) bad.push(`COUNTER_Y = ${COUNTER_Y} mà hàng đó không có bàn nào`);

  // `walk()` không né đồ đạc: soi khúc từ cổng tới chỗ xa nhất của hàng chờ, riêng y9 soi suốt vì là lối qua đường.
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

/** Lệch khỏi trục cửa và trạm vì bảng rộng gần 200px dễ đè nhãn trạm. */
export const SIGN_TILE = { x: 9.2, y: 0.5 };

/** Phủ đúng ba ô tường x=15..17 (bảng 40px) để có một `depth` vừa khít, và chỗ đứng đọc nằm ngoài tầm mọi trạm (gác ở `stations.assertMenuSpotFree()`). */
export const MENU_TILE = { x: 13.6, y: 0.5 };

/** Mốc depth ngay sau mép phải bảng: trên ba ô tường nó treo, dưới người đứng đọc và nhà bên. */
export const MENU_DEPTH_AT = { x: MENU_TILE.x + 1.5, y: MENU_TILE.y };
export const MENU_SPOT = { x: 14.5, y: 1.5 };
export const MENU_REACH = 1.6;

/** Mép mái hiên, nơi `ui/stall/Rain` nhỏ nước xuống. */
export const SHOPFRONT_X = (() => {
  const row = MAP[COUNTER_Y];
  return { lo: row.indexOf("."), hi: row.lastIndexOf(".", row.indexOf("###", 3)) + 1 };
})();

/** Hàng đầu tiên ngoài mái hiên, dùng chung cho cả nắng (`isSunlit`) lẫn mưa (`world/rain.ts`). */
export const SKY_FROM_Y = SHOP_LAST_Y + 1;

export function isSunlit(tx: number, ty: number) {
  if (ty < SKY_FROM_Y) return false;
  const d = tx - ty;
  return d >= -2 && d <= 7;
}
