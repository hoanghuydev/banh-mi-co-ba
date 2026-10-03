/**
 * HÌNH HỌC CỦA MỘT CƠN MƯA — toán thuần, không biết Phaser, không biết scene.
 * `ui/stall/Rain.ts` là phần VẼ; file này là phần ĐÚNG, và ba câu hỏi nó trả lời đều kiểm được
 * bằng Node (`tests/p5-rain.test.ts`) còn cái vẽ thì không:
 *   1. mưa bắt đầu từ ĐÂU (mép mái hiên, không phải mép khung hình)
 *   2. một giọt rơi bao xa thì chạm đất ở hàng nào
 *   3. gió nghiêng thì thả giọt lệch sang bên bao nhiêu
 *
 * ⚠️ Mọi hàm trả `sy` của TÂM Ô, CHƯA cộng `art/canvas.footY` — `footY` cộng `BASE`, một hằng số
 * của lớp VẼ (import Phaser), mà test thì chạy trong Node. Nó là phép tịnh tiến thuần nên cộng
 * trước hay sau đều ra một kết quả.
 */
import { TH, TW } from "./iso";
import { SKY_FROM_Y, WORLD_H } from "./map";
import type { Weather } from "../core/types";

/**
 * MÉP MÁI CAO BAO NHIÊU PX so với mặt đất ngay dưới nó — con số CHỈNH BẰNG MẮT, đổi chác hai đầu:
 * cao quá thì mưa bắt đầu rơi phía trên chỗ người chơi đứng và đọc ra là "mưa tạt vào trong quán";
 * thấp quá thì giọt rơi trúng hàng khách chỉ còn một vệt 18 px, không ra mưa nữa.
 *
 * 80 px ≈ 2 m ở tỉ lệ của cảnh: giọt rơi xuống hàng khách thành vệt ~100 px, mà đường mép mái vẫn
 * nằm sát ngay trên mặt quầy chứ không trèo vào tới hàng trạm.
 */
export const ROOF_PX = 80;

/**
 * `sy` (tâm ô) của ĐƯỜNG MÉP MÁI tại một cột `sx` — chưa trừ `ROOF_PX`.
 *
 * Mép mái chạy dọc hàng `SKY_FROM_Y`, mà trong iso một HÀNG là một ĐƯỜNG THẲNG dốc `TH/TW`. Suy
 * từ `toScreen` chứ không gõ tay hai con số: đổi `TW`/`TH` là đổi cả phép chiếu.
 */
export function eaveCenterY(sx: number) {
  return sx * (TH / TW) + SKY_FROM_Y * TH;
}

/** Hàng `wy` này có trời ở trên đầu không — trong quán thì không, nên không ướt. */
export function isUnderSky(wy: number) {
  return wy >= SKY_FROM_Y;
}

/**
 * Giọt rơi trúng hàng `wy` thì nó đã rơi bao nhiêu px. `ROOF_PX` là quãng từ mép mái xuống mặt
 * đất NGAY DƯỚI mép mái; mỗi hàng ra xa thêm một bậc thì mặt đất tụt thêm `TH` px, mà giọt rơi
 * THẲNG ĐỨNG trên màn hình nên cộng thẳng vào quãng rơi.
 */
export function fallPx(wy: number) {
  return TH * (wy - SKY_FROM_Y) + ROOF_PX;
}

/** Ngược của `fallPx`: rơi ngần này px thì chạm đất ở hàng nào. */
export function rowAtFall(px: number) {
  return SKY_FROM_Y + (px - ROOF_PX) / TH;
}

/** Hàng xa nhất còn có mặt đất để mà chạm — mép dưới bản đồ. */
export const LAST_SKY_ROW = WORLD_H;

/**
 * THẢ GIỌT LỆCH SANG BÊN BAO NHIÊU để gió nghiêng mà nó vẫn rơi trúng chỗ đã định.
 *
 *   sx = tx − lean·d,  d = ty − mép(sx),  mép(sx) = k·sx + C
 *   ⇒ sx·(1 − lean·k) = tx − lean·(ty − C)
 *
 * Có nghiệm đóng nên không phải dò — lặp xấp xỉ thì mỗi giọt lệch một chút khác nhau và cả màn
 * mưa rung lên theo sai số. `lean·k` luôn ≪ 1 (gió tối đa ~12° ⇒ mẫu số ≈ 0,89) nên không chia 0.
 *
 * `eaveC` là hằng số C ĐÃ cộng `footY` và ĐÃ trừ `ROOF_PX` — người gọi tính một lần rồi truyền vào.
 */
export function spawnSx(tx: number, ty: number, lean: number, eaveC: number) {
  return (tx - lean * (ty - eaveC)) / (1 - lean * (TH / TW));
}

/**
 * MẬT ĐỘ — hai kiểu mưa của lịch mùa là hai cơn mưa khác hẳn nhau, không phải một cơn chỉnh to
 * nhỏ: `MUA_RAO` nặng hạt, dày, gió tạt · `MUA_DAM` hạt nhỏ, thưa, gần như không gió.
 *
 * Đơn vị là GIỌT MỖI GIÂY trên một khung hình, không phải "trên mỗi ô".
 */
export type RainDensity = {
  /** Giọt mưa rơi xuống nền, mỗi giây. */
  drops: number;
  /** Giọt nhỏ từ mép mái xuống ngay trước quầy, mỗi giây. */
  drips: number;
  /** Góc gió (độ) — 0 là rơi thẳng đứng. */
  windDeg: number;
  /** Biên độ lay gió (độ) quanh `windDeg`. `reducedMotion` ép về 0. */
  gustDeg: number;
};

/*
 * `drops` là GIỌT MỖI GIÂY, không phải số vệt thấy trên màn hình — số vệt thấy cùng lúc chỉ cỡ
 * một phần ba con số này. Chỉnh bằng MẮT trên khung hình thật.
 *
 * ⚠️ BUỘC phải đi cùng `SPEED_MIN`/`SPEED_MAX` bên `ui/stall/Rain.ts`: cái quyết định độ dày màn
 * mưa (và khoản máy phải gánh) là SỐ HẠT ĐANG SỐNG = `drops × quãng rơi ÷ tốc độ`.
 */
const BASE_DENSITY: Record<"MUA_RAO" | "MUA_DAM", RainDensity> = {
  MUA_RAO: { drops: 135, drips: 7, windDeg: 7, gustDeg: 4 },
  MUA_DAM: { drops: 78, drips: 4, windDeg: 3, gustDeg: 2 },
};

/**
 * `reduceMotion` để mưa ở 25% mật độ, bỏ lay gió, và GIỮ tiếng mưa mái tôn.
 *
 * Cố ý KHÔNG xoá hẳn như "lá bay / bụi": mưa là một sự kiện của thế giới (ngày mưa ít khách hơn,
 * khách cầm dù, soi ít hơn) nên xoá sạch là người bật trợ năng mất một tin mà người khác có.
 */
export const REDUCED_MUL = 0.25;

export function rainDensity(weather: Weather, reducedMotion: boolean): RainDensity | null {
  const base = weather === "MUA_RAO" || weather === "MUA_DAM" ? BASE_DENSITY[weather] : null;
  if (!base) return null;
  if (!reducedMotion) return base;
  return {
    drops: base.drops * REDUCED_MUL,
    drips: base.drips * REDUCED_MUL,
    windDeg: base.windDeg,                             // vẫn nghiêng — chỉ bỏ phần LAY
    gustDeg: 0,
  };
}

/** Chu kỳ một hơi gió (ms). Dài và lệch số nguyên để hai cơn gió không bao giờ trùng nhịp. */
const GUST_MS = 5300;

/** Góc gió lúc `tMs` — `gustDeg = 0` (giảm chuyển động) thì đứng yên ở góc nền. */
export function windAt(d: RainDensity, tMs: number) {
  return d.windDeg + d.gustDeg * Math.sin(tMs / GUST_MS);
}

/**
 * LỚP PHỦ ĐỔI SÁNG — một phép gộp đại số. Spec đòi hai tấm phủ (NHÂN hạ sáng + THƯỜNG nén tương
 * phản), nhưng chồng lên nhau chúng vẫn chỉ là MỘT phép tuyến tính trên từng kênh:
 *
 *   dim: d ↦ d·k₁   ·   veil: d ↦ d·k₂ + b₂   ⇒   gộp: d ↦ d·k + b
 *
 * Mà `d ↦ d·k + b` CHÍNH LÀ một tấm phủ blend THƯỜNG duy nhất (`alpha = 1 − k`, `màu = b/alpha`).
 * Thay số của cả hai kiểu mưa thì ra cùng một màu, chỉ khác alpha.
 *
 * Xấp xỉ tới đâu: `k` của lớp NHÂN khác nhau chút ít theo kênh màu, chênh lớn nhất 2,2/255 — dưới
 * một nấc màu của mắt, và `tests/p5-rain` kẹp con số đó lại. Lợi: bỏ được 2,4 triệu pixel phải tô
 * mỗi frame cộng một lần đổi blend mode.
 *
 * ⚠️ Làm được vế TRẦN ("không còn gì trắng hẳn") nhưng KHÔNG làm được vế SÀN ("không còn gì đen
 * hẳn", ≥ 0,30) — muốn vậy phải kéo alpha quá nửa và cả khung bạc phếch. Vế đó là việc của khâu
 * VẼ ASSET (bake một bộ nền mưa riêng), đừng đi vặn alpha cho khớp con số 30%.
 */
export function rainGrade(weather: Weather): number | null {
  if (weather === "MUA_RAO") return 0.484;
  if (weather === "MUA_DAM") return 0.415;
  return null;
}
