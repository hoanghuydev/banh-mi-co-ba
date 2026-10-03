/**
 * MỤC ĐÍCH và TÂM TRẠNG — "mỗi người đi ngang phải có một lý do để đi".
 *
 * Một lời mời chỉ là việc thật khi nó có thể SAI, và nó chỉ sai được khi người kia đang bận một
 * chuyện của riêng họ: mời bà đi chợ về, với mời người đang chạy đi mua thuốc cho mẹ, phải ra hai
 * kết quả khác nhau.
 *
 * Hai trục, KHÔNG độc lập với nhau: mục đích (60) quyết `buyable` và `hurry`; tâm trạng (34) quyết
 * sức chờ, độ dễ cáu, và nhân thêm vào lời mời.
 *
 * ⚠️ `states` của mỗi mục đích là một DANH SÁCH TRẮNG — đó là cả lý do file dữ liệu tồn tại. Ghép
 * tự do hai bảng là 2.040 cặp, trong đó có người đi đám tang vừa đi vừa hớn hở. Không có "bảng
 * cấm": chỉ cặp được KHAI RA mới tồn tại (`tests/p4-purpose.test.ts` canh chừng).
 *
 * File này CHỈ cung cấp, không tự nối vào đâu — `passersby`/`service` gọi `purposeInviteMul` /
 * `purposeHurry` / `purposePatienceMul` / `purposeAngerMul`.
 */
import DATA from "../content/npcs/purposes.json";
import type { Rng } from "../core/rng";
import type { TimeBand } from "../core/clock";
import type { PoseId } from "./reaction";
import type { TalkMood } from "./talk";

export type StateId = string;
export type PurposeId = string;

/** Một tâm trạng. Ba hệ số đều là NHÂN — 1,0 nghĩa là "không đổi gì cả". */
export type NpcState = {
  id: StateId;
  /** Tiếng Việt viết thường, hiện ra được: *"chị đi chợ về"* + *"mệt"*. */
  label: string;
  /** Khoá của `MOOD_FACE` (sim/talk.ts). Tên sai = một ô vuông trắng trên màn hình. */
  face: TalkMood;
  /** `PoseId` của `sim/reaction.ts`. */
  pose: PoseId;
  /** Nhân vào sức chờ. > 1 là chờ được lâu hơn. */
  patienceMul: number;
  /** Nhân vào cường độ phản ứng xấu. > 1 là dễ nổi hơn. */
  angerMul: number;
  /** Nhân vào `inviteChance`. */
  inviteMul: number;
};

/** Một mục đích: hôm nay người này ra khỏi nhà để làm gì. */
export type Purpose = {
  id: PurposeId;
  label: string;
  /**
   * Mời được không: 0 = không đời nào · 1 = rất dễ. NHÂN vào `inviteChance`.
   *
   * Nó là cái HÃM, không phải cái đẩy: `inviteChance` đã có trần `INVITE_MAX = 0,8`
   * (`sim/passersby.ts`), nên `buyable = 1` chỉ có nghĩa "mục đích này không cản trở gì",
   * chứ không kéo ai lên trên trần đó. Chỗ duy nhất gần 1 là người đang ĐI MUA ĐỒ ĂN SÁNG.
   */
  buyable: number;
  /** Vội tới mức nào: 0 thong thả · 1 cuống. Ăn vào tốc độ đi và vào việc có dừng nghe không. */
  hurry: number;
  /** DANH SÁCH TRẮNG những tâm trạng hợp lý với mục đích này. 2–4 cái. */
  states: readonly StateId[];
  /** Khung giờ hay gặp mục đích này. Ngày game chỉ có 06:00–11:00. */
  bands: readonly TimeBand[];
  /** Hay gặp cỡ nào trong những khung giờ đó. Tương đối, không phải phần trăm. */
  weight: number;
  note?: string;
};

type RawState = Omit<NpcState, "face" | "pose"> & { face: string; pose: string };
type RawPurpose = Omit<Purpose, "bands"> & { bands: string[] };
type Raw = { states: RawState[]; purposes: RawPurpose[] };

const RAW = DATA as unknown as Raw;

export const STATES: readonly NpcState[] = RAW.states.map((s) => ({
  ...s, face: s.face as TalkMood, pose: s.pose as PoseId,
}));

export const PURPOSES: readonly Purpose[] = RAW.purposes.map((p) => ({
  ...p, bands: p.bands as TimeBand[],
}));

const STATE_OF = new Map(STATES.map((s) => [s.id, s]));
const PURPOSE_OF = new Map(PURPOSES.map((p) => [p.id, p]));

export function stateById(id: StateId): NpcState | null {
  return STATE_OF.get(id) ?? null;
}

export function purposeById(id: PurposeId): Purpose | null {
  return PURPOSE_OF.get(id) ?? null;
}

/**
 * Những tâm trạng mục đích này ghép được — đã đổi sang object, đã bỏ id lạ.
 * Đây là CHỖ DUY NHẤT dịch từ id sang state: không ai được tự ghép bằng tay chỗ khác.
 */
export function statesOf(p: Purpose): readonly NpcState[] {
  return p.states.map((id) => STATE_OF.get(id)).filter((s): s is NpcState => !!s);
}

/** Cặp này có hợp lệ không — dùng cho test và cho dev tool, không dùng trong vòng lặp. */
export function allows(p: Purpose, s: StateId): boolean {
  return p.states.includes(s);
}

/** Lọc theo khung giờ, nhớ lại kết quả — `rollPurpose` chạy mỗi lần có người bước vào hẻm. */
const BY_BAND = new Map<TimeBand, readonly Purpose[]>();

export function purposesIn(band: TimeBand): readonly Purpose[] {
  const hit = BY_BAND.get(band);
  if (hit) return hit;
  const list = PURPOSES.filter((p) => p.bands.includes(band));
  // Khung giờ rỗng là lỗi dữ liệu (test canh), nhưng trong game thì thà có người đi ngang
  // với một mục đích hơi lệch giờ còn hơn là cái hẻm đứng im.
  const out = list.length ? list : PURPOSES;
  BY_BAND.set(band, out);
  return out;
}

export type PurposeRoll = { purpose: Purpose; state: NpcState };

/**
 * Rút một lý do để đi ngang.
 *
 * Thứ tự rút số là HỢP ĐỒNG, y như `planPasser`: ĐÚNG HAI lần rút — mục đích theo
 * `weight`, rồi tâm trạng đều tay trong danh sách trắng CỦA CHÍNH mục đích đó. Thêm một
 * lần rút vào giữa là dịch cả dãy số của dòng `passer`, tức mọi golden lệch theo.
 *
 * Tâm trạng rút ĐỀU, không có trọng số riêng: một người đi làm buồn ngủ hay bình thản là
 * chuyện của sáng hôm đó, không phải của thiết kế. Muốn một tâm trạng hiếm đi thì đừng
 * khai nó ở nhiều mục đích — đó mới là cái núm đúng.
 */
export function rollPurpose(rng: Rng, band: TimeBand): PurposeRoll {
  const list = purposesIn(band);
  let total = 0;
  for (const p of list) total += Math.max(0, p.weight);

  let r = rng.next() * total;
  let purpose = list[list.length - 1];
  for (const p of list) {
    r -= Math.max(0, p.weight);
    if (r < 0) { purpose = p; break; }
  }

  const pool = statesOf(purpose);
  const state = pool[rng.int(0, pool.length)] ?? STATES[0];
  return { purpose, state };
}

// ──────────────────────────────────────────────────────── hàm thuần cho passersby/service

/**
 * Nhân vào `inviteChance` — xem `sim/passersby.ts`.
 *
 * Nhân HAI cái: mục đích nói "việc hôm nay của tôi có chừa chỗ cho ổ bánh không", tâm
 * trạng nói "mà lúc này tôi có muốn nghe ai không". Người đi chợ về (0,8) đang vui (1,2)
 * ra 0,96 — gần như không hãm; cũng người đó đang cáu gắt (0,35) ra 0,28.
 */
export function purposeInviteMul(p: Purpose, s: NpcState): number {
  return Math.max(0, p.buyable * s.inviteMul);
}

/**
 * Vội tới mức nào, sau khi tâm trạng nói vào — 0..1.
 *
 * Tâm trạng không khai `hurryMul` riêng, và đó là cố ý: vội và hết kiên nhẫn là HAI MẶT
 * của một chuyện, khai hai số là sớm muộn gì cũng có một người đi "thong thả" mà "cuống".
 * Nên lấy ngay `patienceMul` mà soi gương: chờ được lâu (1,4) thì chân chậm lại (×0,6),
 * chờ không nổi (0,4) thì chân nhanh lên (×1,6).
 */
export function purposeHurry(p: Purpose, s: NpcState): number {
  const mul = Math.max(0.5, Math.min(1.6, 2 - s.patienceMul));
  return Math.max(0, Math.min(1, p.hurry * mul));
}

/**
 * Nhân vào sức chờ (`patienceBaseSec` của P1-02 §2.7).
 *
 * Mục đích đi vào đây qua `hurry` chứ không có hệ số riêng: người đang vội thì sức chờ
 * ngắn lại — cùng một chuyện với `rush` của `NpcDef`, chỉ là nó tới từ hôm nay chứ không
 * từ tính cách. Trần dưới 0,45 để không có ai chờ được 3 giây rồi bỏ đi.
 */
export function purposePatienceMul(p: Purpose, s: NpcState): number {
  return Math.max(0.45, s.patienceMul * (1 - 0.45 * purposeHurry(p, s)));
}

/** Nhân vào cường độ phản ứng xấu. Vội thì cũng dễ nổi hơn, nhưng nhẹ tay hơn sức chờ. */
export function purposeAngerMul(p: Purpose, s: NpcState): number {
  return s.angerMul * (1 + 0.3 * purposeHurry(p, s));
}

/**
 * Một dòng đọc được: *"đi chợ về · mệt"*. Dùng cho sổ tay, bong bóng thoại, dev overlay.
 * KHÔNG hiện số — T3: người chơi đọc ra mục đích qua lời nói, không qua thanh phần trăm.
 */
export function describe(p: Purpose, s: NpcState): string {
  return `${p.label} · ${s.label}`;
}
