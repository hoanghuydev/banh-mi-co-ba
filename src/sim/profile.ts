/**
 * HỒ SƠ GIAO TIẾP — P2-09 §2.8. Nạp `content/npcs/profiles.json` và trả lời ba câu hỏi:
 * người này nặng drive nào, nhớ theo kiểu nào, và nuốt lời thì nổi ở nấc nào.
 *
 * Không phải nội dung mới — là một TỜ BÌA đặt lên nội dung đã có, để 12 người đi qua
 * cùng một bộ máy mà ra 12 cách nói chuyện (cùng nguyên tắc với P2-02 §2.11: tính cách
 * nổi lên từ mật độ rule, không code riêng).
 *
 * Người KHÔNG CÓ TÊN không có hồ sơ, và đó là đúng: `memKey` của họ dùng chung cho tám
 * dáng người suốt cả mùa, nên một hồ sơ riêng ở đó là một hồ sơ nói về tám người khác
 * nhau. Họ nhận bộ mặc định suy từ tính cách (`baseDrives`).
 */
import DATA from "../content/npcs/profiles.json";
import type { DriveId } from "../content/vocab";
import type { Personality } from "../content/npcs";
import { weightsOf, type Weights } from "./recall";

export type TalkProfile = {
  tune: Partial<Record<DriveId, number>>;
  /** Chuyện CỦA HỌ — chỗ nhân vật thành người, không phải một bộ hệ số. */
  advertises: readonly string[];
  /** Nghe chuyện gì thì để ý. Nhân vào relevance lúc truy hồi. */
  cares: Record<string, number>;
  /** Nhắc là `RUDE_TO_THEM`, dù câu chữ lịch sự. */
  taboo: readonly string[];
  mem: Weights;
  /** Ba nấc nuốt lời, tính bằng BỘI của hạn. Nấc 0 = BỎ nấc đó. */
  breakPromise: readonly [number, number, number];
};

type Raw = { profiles: Record<string, Partial<TalkProfile> & { _why?: string }> };
const RAW = (DATA as unknown as Raw).profiles;

const PROFILES = new Map<string, TalkProfile>(
  Object.entries(RAW).map(([id, p]) => [id, {
    tune: p.tune ?? {},
    advertises: p.advertises ?? [],
    cares: p.cares ?? {},
    taboo: p.taboo ?? [],
    mem: p.mem ?? { recency: 1, importance: 1, relevance: 1 },
    breakPromise: p.breakPromise ?? [1, 1.8, 2.6],
  }]));

/**
 * Hồ sơ của một người. Không có tên ⇒ `null`, và người gọi dùng bộ suy từ tính cách.
 * Trả `null` chứ không trả một hồ sơ rỗng: "không có hồ sơ" và "hồ sơ toàn số mặc định"
 * là hai chuyện khác nhau, và chỉ cái thứ nhất mới đúng với một người lạ.
 */
export const profileOf = (npcId: string | null | undefined): TalkProfile | null =>
  (npcId && PROFILES.get(npcId)) || null;

/** Trọng số truy hồi: hồ sơ thắng, không có hồ sơ thì suy từ bốn chiều tính cách. */
export const memWeights = (npcId: string | null | undefined, p: Personality): Weights =>
  profileOf(npcId)?.mem ?? weightsOf(p);

/** Mọi id có hồ sơ — test `V-3` đối chiếu với `NPCS` để không ai bị bỏ quên. */
export const PROFILE_IDS: readonly string[] = [...PROFILES.keys()];
