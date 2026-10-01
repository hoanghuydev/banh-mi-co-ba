/**
 * Góc phố có quán bánh mì — dữ liệu thuần, tách khỏi phép chiếu và khỏi scene.
 * Sửa cái quán = sửa mấy dòng chuỗi ở đây, không đụng tới code vẽ.
 *
 * Camera nhìn từ phía (-x, -y): y CÀNG LỚN CÀNG GẦN người xem.
 * Nên quán nằm ở y nhỏ (phía trong), vỉa hè và đường nằm ở y lớn (phía ngoài).
 * Nhờ vậy nhìn thẳng vào mặt tiền quán, không bức tường nào chắn.
 *
 *   y0         tường sau + cửa ra vào, hai bên là mặt tiền nhà hàng xóm
 *   y1         HÀNG TRẠM — kệ, lò, thùng trà đá, bồn rửa tay
 *   y2..y5     trong quán — KHU NGƯỜI CHƠI LÀM VIỆC, bốn hàng trống sau quầy
 *   y6         QUẦY tủ kính — nằm ở hàng NGOÀI CÙNG của quán, sát mặt tiền. Chừa lối
 *              đi RỘNG 2 Ô ở đầu quầy để còn ra ngoài dọn bàn, kéo ghế. Một ô là
 *              không lọt: thân người rộng 0,6 ô nên khe 1 ô chỉ đi được khi canh
 *              chính giữa, chơi rất ức chế.
 *   y7..y11    vỉa hè — khách đứng gọi món ngay ở y7, sát ngoài quầy. y7..y9 để TRỐNG
 *              SUỐT CHIỀU NGANG: đó vừa là chỗ xếp hàng, vừa là lối khách đi từ đầu
 *              hẻm bên trái vào. Đồ đạc dồn xuống hai hàng ngoài cùng (y10, y11); kê
 *              một cái ghế lên lối đi là chắn ngay đường người ta vào quán.
 *   y12..y16   lòng đường
 *
 * ── Vì sao quầy nằm ở hàng ngoài cùng ────────────────────────────────────────
 * Đẩy quầy ra sát mặt tiền để DỒN HẾT chiều sâu còn lại vào trong quán: khu làm việc
 * đi từ 3 hàng lên 5 (y1..y5). Bốn trạm trải dọc quầy mà chỉ có hai hàng để lách thì
 * người chơi đi một bước là chạm tường; năm hàng mới đủ để vòng ra sau lưng chính
 * mình lúc ba ổ cùng chờ. Khách thì không mất gì: họ vốn đứng ngoài quầy, giờ đứng
 * hẳn trên vỉa hè — đúng chỗ người ta đứng mua bánh mì thật.
 *
 * ⚠️ HÀNG y1 VÀ HÀNG y6 BỊ KHOÁ: `world/stations.ts` đọc `STATION_ROW_Y` (kệ, lò, trà,
 * bồn rửa) và `COUNTER_Y` (thớt, rổ, chỗ đưa hàng) từ chính file này. Chèn thêm hàng
 * vào giữa mà quên sửa hai hằng số đó là đẩy trạm ra khỏi quầy — `assertWalkable()`
 * chỉ xét chỗ người đứng, không xét trạm.
 *
 * Ba cột ngoài cùng mỗi bên là khối nhà hàng xóm — đặc, không đi vào được. Vỉa hè và
 * lòng đường thì KHÔNG có tường: hẻm chạy thông suốt ra hai mép khung hình.
 *
 * ── Vì sao cỡ này ────────────────────────────────────────────────────────────
 * 26×17. Bản đồ KHÔNG còn phải lọt trọn trong khung 1024×576 như hồi 20×12: từ lúc
 * `world/camera.ts` phóng `ZOOM` lần rồi trượt theo người chơi, mép đường đi của
 * camera lấy từ hình bao của cảnh (`StallScene.sceneBounds`, tính ra từ `WORLD_W/H`),
 * nên nới bản đồ là camera tự nới theo, không phải sửa một dòng nào bên đó.
 * Thứ bị giới hạn bây giờ là CHỖ THỞ: quầy phải đủ dài để bốn trạm không chen nhau,
 * và vỉa hè phải đủ sâu để hàng khách đứng không đè lên nhau.
 */
export const MAP = [
  "NN###D##################NN",  // y0  nhà hàng xóm · tường sau quán có CỬA ở x=5
  "###XK..O..V..T.WP......###",  // y1  bình chữa cháy · kệ · lò · THÙNG RÁC · thùng trà đá · bồn rửa · chậu cây
  "###....................##N",  // y2  lối đi sau quầy
  "###....................###",  // y3  lối đi sau quầy
  "###....................###",  // y4  lối đi sau quầy
  "###....................##N",  // y5  lối đi sau quầy
  "###QQQQQQQQQQQQQQQQQQ..###",  // y6  QUẦY (thớt x=4, rổ x=8, chỗ đưa hàng x=12) — lối ra 2 ô ở x=21,22
  "..........................",  // y7  vỉa hè — hàng khách đứng gọi món
  "..........................",  // y8  vỉa hè — LỐI ĐI của khách, từ đầu hẻm bên trái
  "..........................",  // y9  vỉa hè — trống
  "..C.V.................A...",  // y10 két nước · thùng rác · bảng gỗ
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
 * Hàng của HÀNG TRẠM và của QUẦY. `world/stations.ts` đọc hai hằng số này thay vì chép
 * tay số hàng — trạm nằm trên mặt quầy phải theo quầy, trạm dọc tường sau phải theo
 * tường. Hồi còn ghi số thì đẩy quầy ra một hàng là ba cái trạm đứng chơ vơ giữa lối
 * đi mà không có gì báo.
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
 * Ba hàng vỉa hè trong cùng (y7..y9) là LỐI ĐI, phải sạch đồ đạc suốt chiều ngang —
 * `assertWalkable()` soi đúng dải này. Đồ đạc chỉ được nằm từ y10 trở ra.
 */
const LANE_LAST_Y = 9;

export function floorAt(_tx: number, ty: number): Floor {
  if (ty <= SHOP_LAST_Y) return "shop";
  if (ty <= WALK_LAST_Y) return "walk";
  return "road";
}

/**
 * Hàng nào của lòng đường có vạch sơn giữa đường.
 * Là DỮ KIỆN BẢN ĐỒ chứ không phải chuyện của lớp vẽ: vạch sơn chạy thành một
 * đường liền, nên nó phải nằm ở một hàng cố định. Rắc theo hàm băm như ô sàn
 * thường là ra mấy vệt trắng lốm đốm giữa đường, nhìn ra ngay là lỗi.
 * Hàng GIỮA của năm hàng đường (y12..y16).
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
 * Cổng khách vào/ra và chỗ đứng xếp hàng.
 *
 * Mấy toạ độ này là DỮ KIỆN CỦA BẢN ĐỒ nên phải ở cùng file với bản đồ.
 * Để chúng nằm trong `sim/service.ts` là kiểu gì cũng có ngày ai đó đặt cái
 * thùng rác lên đúng ô cổng rồi cả hàng khách đứng chôn chân mà không ai biết
 * vì sao — đã xảy ra đúng một lần rồi. `assertWalkable()` bên dưới bắt lỗi đó.
 *
 * Cổng dời về ĐẦU HẺM BÊN TRÁI, và nằm TRÊN VỈA HÈ chứ không phải dưới lòng đường:
 * khách là người đi bộ trong hẻm, không phải người băng qua đường. `service.walk()`
 * đi thẳng một mạch từ cổng tới chỗ đứng chứ không có waypoint — nhưng cổng và cả
 * hàng khách đều nằm trong dải y7..y9 trống trơn, nên đường thẳng đó CHÍNH LÀ dọc
 * vỉa hè. Muốn khách đi đúng lối thì giữ ba hàng đó sạch đồ đạc.
 *
 * Cổng nằm ở y9, hàng vỉa hè NGOÀI của lối đi, chứ không phải y7 ngay cạnh hàng người:
 * vào từ hàng ngoài thì khách men theo mép vỉa hè rồi mới tạt lên chỗ đứng, chứ không
 * xuyên thẳng qua giữa hàng người đang chờ. `walk()` đi thẳng không né ai — hai khách
 * chồng lên nhau một nhịp thì nhìn ra ngay là lỗi.
 */
export const CUSTOMER_GATE = { x: 1.5, y: 9.5 };

/**
 * Chỗ đứng cạnh thùng rác đầu hẻm (ô `V`, x=4 y=10) — P2-02 §4.6: chị Lan trả tiền,
 * cầm bánh, ra tới đây bỏ vô thùng. Frame quan trọng nhất của cả game: nó phải nằm
 * TRONG khung hình, trên đường khách vẫn đi ra cổng — nên thùng rác theo cổng về
 * bên trái, ngay cạnh lối ra, chứ không nằm bên kia hẻm nữa.
 *
 * Cách cổng 3 ô chứ không phải 1: sát quá thì chị vừa rẽ vào thùng rác đã chạm bán
 * kính despawn 0,5 ô của cổng và biến mất giữa chừng động tác.
 */
export const STREET_BIN = { x: 4.5, y: 9.45 };

/**
 * GÓC HẺM — sân khấu nghe lỏm (P2-04 §2.7): cách xe bánh mì ~4–5 m, cạnh hai cái ghế
 * nhựa (ô `s` x=19,20 y=11). Hai người đứng nói chuyện — A kể, B nghe.
 *
 * Đổi sang phía PHẢI cùng lúc với mấy cái ghế: bên trái bây giờ là lối khách vào, mà
 * hai người đứng tám giữa lối đi thì cả hàng khách phải lách qua họ mới vô tới quầy.
 */
export const GOSSIP_CORNER = [{ x: 19.4, y: 10.4 }, { x: 20.5, y: 10.45 }] as const;

/**
 * Chỗ đứng xếp hàng — một HÀNG NGANG song song với quầy: người đầu tiên đứng ngay
 * trước chỗ đưa hàng (x=12), người sau lùi dần SANG TRÁI, cùng một hàng y.
 *
 * Vì sao hàng ngang chứ không phải hàng chéo ra đường như trước — đây là chuyện HÌNH
 * HỌC, không phải thẩm mỹ. `depthOf` vẽ theo (x+y): ai có x+y LỚN HƠN thì vẽ đè lên.
 * Hàng chéo cũ cho người đứng sau x+y lớn hơn, nên người thứ tư vẽ ĐÈ lên người thứ
 * nhất — đúng người đang gọi món thì bị che. Lùi theo trục x thuần thì ngược lại:
 * người đầu hàng có x+y lớn nhất nên luôn nằm TRÊN CÙNG, và mỗi người sau dịch
 * 45 px sang trái + 22 px LÊN TRÊN màn hình, tức không ai nấp sau lưng ai.
 *
 * Giãn 1,5 ô = 45 px ngang, rộng hơn một thân người (~26 px) nên còn thấy rõ KHE HỞ
 * giữa hai người: "đang có hàng dài" phải đọc ra được từ hình, không phải đếm.
 *
 * Sáu chỗ thay vì bốn: quầy dài ra thì hàng cũng chứa được dài hơn. Nhưng `service.ts`
 * vẫn dồn mọi khách thứ 7 trở đi vào chỗ CUỐI (`c.slot = min(i, SLOTS.length-1)`),
 * tức người thứ 7 đứng chồng khít lên người thứ 6 — sáu chỗ chỉ đẩy cái bug đó ra xa
 * chứ không chữa. Chữa thật là luật "đông quá thì thôi không mua" bên `service.ts`.
 *
 * `zone` là cột của bảng visibility (CANON §5). Hết năm giá trị thì chỗ xa nhất dùng
 * lại `SEATED_FAR`, vì từ đó trở ra thì nhìn vào tay người bán đã mờ như nhau cả.
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
 * LỐI NGƯỜI QUA ĐƯỜNG — hai dải chạy SUỐT chiều ngang bản đồ, cho người chỉ đi ngang
 * qua chứ không ghé (`sim/passersby.ts`).
 *
 * Cái hẻm trước đây chỉ có đúng những người tới mua: quầy trống là cả khu phố trống,
 * nên "có người nhìn" không còn nghĩa gì — không có ai để mà không nhìn. Mấy người này
 * là cái nền ấy: họ đi ngang, một số ngó cái xe một cái rồi đi tiếp, và KHÔNG MUA.
 *
 * Vì sao hai dải này chứ không phải bất kỳ hàng nào:
 *  · y9,6 — hàng vỉa hè NGOÀI của lối đi (y7..y9). `assertWalkable()` đã bảo đảm ba
 *    hàng đó sạch đồ đạc suốt chiều ngang, nên đi thẳng một mạch là đi được thật.
 *    Nó nằm NGOÀI hàng khách đứng (y7,6) nên người đi ngang che chân chứ không che mặt
 *    người đang xếp hàng — mặt là kênh 1, không được phép bị che (CANON §5).
 *  · y12,4 — mép trong lòng đường, ngay sát lề. Xa hơn, thấp hơn trên màn hình: hai
 *    dải khác chiều sâu thì cái hẻm mới có lớp, chứ không phải một hàng người nối đuôi.
 * Hàng y10/y11 KHÔNG dùng được: đó là chỗ để két nước, thùng rác, bàn ghế, xe máy — mà
 * `walk()` đi thẳng không né được, đụng vô là đứng rung tại chỗ.
 *
 * `assertWalkable()` soi cả hai dải theo đúng bán kính người đi, nên kê thêm một món đồ
 * vào đường của họ là vỡ lúc khởi động chứ không phải lúc có người đi ngang.
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

  // Lối khách đi phải sạch suốt chiều ngang: `service.walk()` đi thẳng, không né được
  // đồ đạc. Một cái ghế kê nhầm vào đây là khách ủi vào nó rồi đứng rung tại chỗ.
  for (let ty = SHOP_LAST_Y + 1; ty <= LANE_LAST_Y; ty++) {
    const blocked = [...MAP[ty]].findIndex((c) => c !== ".");
    if (blocked >= 0) bad.push(`lối khách đi y${ty} bị chặn ở x=${blocked} (ô "${MAP[ty][blocked]}")`);
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
 * Vạt nắng gắt rọi xiên xuống vỉa hè và mặt đường.
 * Trong quán thì râm — đó là lý do người ta tấp vào.
 */
export function isSunlit(tx: number, ty: number) {
  if (ty <= SHOP_LAST_Y) return false;
  const d = tx - ty;
  return d >= -2 && d <= 7;
}
