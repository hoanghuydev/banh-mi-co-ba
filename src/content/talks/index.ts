/**
 * Kho nội dung trò chuyện — nạp THEO NGƯỜI, lúc người đó đi tới quầy.
 *
 * Vì sao không `import` thẳng hết như `dialog/speaker.ts` làm với rule DB: rule DB là
 * vài trăm dòng phẳng, còn ở đây mỗi NPC có nhiều chục cuộc, mỗi cuộc là một CÂY sâu
 * bốn tầng. Nhét cả hẻm vào bundle đầu tiên thì màn Boot gánh một cục JSON mà 90% số
 * đó hôm nay không ai nói tới — hôm nay thứ Ba thì chú Đạt còn chưa mở xe.
 *
 * Cách làm: mỗi NPC một file, nạp bằng `import()` ĐỘNG. Vite tự tách thành chunk riêng
 * và chỉ tải khi gọi; Node/tsx (test, `npm run sim`) chạy đúng cú pháp đó không cần
 * thêm gì. Không dùng `import.meta.glob` — nó là của riêng Vite, test sẽ chết.
 *
 * Vòng đời (Service lái):
 *   khách spawn / bắt đầu đi vô  → `ensure(npcId)`   nạp nền, không chặn frame nào
 *   khách rời đi                 → `release(npcId)`  trả chỗ, trừ khi còn trong LRU
 *
 * Chưa nạp xong mà người chơi đã bấm F thì `openTalk()` trả null và rơi về câu xã giao
 * một nhịp của P1-02 — thà vậy còn hơn chặn vòng lặp game để chờ một file.
 */
import type { Talk, TalkFile } from "../../sim/talk";

/** Thêm NPC = thêm MỘT dòng. `() =>` là bắt buộc: gọi rồi mới tải. */
const LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  BA_BAY: () => import("./ba-bay.json"),
  BE_SU: () => import("./be-su.json"),
  CO_MAI: () => import("./co-mai.json"),
  ONG_HAI: () => import("./ong-hai.json"),
  CHU_TU: () => import("./chu-tu.json"),
  ANH_DUNG: () => import("./anh-dung.json"),
  CHI_LAN: () => import("./chi-lan.json"),
  THAY_PHUC: () => import("./thay-phuc.json"),
  CHI_HANH: () => import("./chi-hanh.json"),
  ANH_BAO: () => import("./anh-bao.json"),
  BA_SAU: () => import("./ba-sau.json"),
  CHU_KIET: () => import("./chu-kiet.json"),
  WALKIN: () => import("./walkin.json"),
  QUA_DUONG: () => import("./qua-duong.json"),
  // Tầng dùng chung — `get()` ghép kho này vào MỌI người. Nạp một lần, không bao giờ thả.
  ANY: () => import("./any.json"),
};

/** Kho dùng chung cho mọi người. `get()` luôn ghép vào, `clear()` luôn giữ lại. */
export const SHARED_POOL = "ANY";

/**
 * Giữ lại bao nhiêu người gần nhất sau khi họ đi. Chú Quang đi lúc 6h50 rồi dì Liên tới
 * 8h50 — nhưng khách vãng lai thì ra vào liên tục, thả ngay là tải lại mỗi lượt.
 */
const KEEP_RECENT = 4;

export class TalkStore {
  private loaded = new Map<string, Talk[]>();
  private pending = new Map<string, Promise<void>>();
  /**
   * Người đang đứng ở quán — không bao giờ thả. ĐẾM THAM CHIẾU, không phải `Set`.
   *
   * Lỗi ẩn H-12 của bản cũ: các dáng khách lạ dùng chung khoá `WALKIN`, nên ba người
   * cùng đứng ở quầy là ba lần `ensure("WALKIN")` nhưng chỉ cần MỘT người đi là
   * `live.delete` trả về true và kho bị thả — hai người còn đứng đó mất sạch thoại,
   * và `openTalk` trả "…" giữa lúc họ đang chờ được trả lời.
   */
  private live = new Map<string, number>();
  /** Người vừa đi, theo thứ tự đi (cũ nhất trước). */
  private recent: string[] = [];

  /** Đã có sẵn để `pickTalk` dùng ngay trong frame này chưa. */
  has(npcId: string) {
    return this.loaded.has(npcId);
  }

  /** Cuộc của người này + các cuộc dùng chung (`ANY`). Chưa nạp xong thì rỗng. */
  get(npcId: string): Talk[] {
    const own = this.loaded.get(npcId) ?? [];
    // Hỏi thẳng kho dùng chung thì đừng ghép nó vào chính nó — mỗi cuộc sẽ ra hai lần,
    // và `pickTalk` rút theo trọng số nên cuộc nào cũng tự nhân đôi cơ hội của mình.
    return npcId === SHARED_POOL ? [...own] : [...own, ...(this.loaded.get(SHARED_POOL) ?? [])];
  }

  /**
   * Gọi lúc khách bắt đầu đi vô. Không `await` ở chỗ gọi — nó tự xong trong lúc người ta
   * đi từ cổng vào quầy (vài giây thật). Gọi nhiều lần vô hại.
   */
  ensure(npcId: string): Promise<void> {
    this.live.set(npcId, (this.live.get(npcId) ?? 0) + 1);
    const i = this.recent.indexOf(npcId);
    if (i >= 0) this.recent.splice(i, 1);
    if (this.loaded.has(npcId)) return Promise.resolve();
    const p = this.pending.get(npcId);
    if (p) return p;
    const load = LOADERS[npcId];
    if (!load) { this.loaded.set(npcId, []); return Promise.resolve(); }
    const job = load()
      .then((m) => { this.loaded.set(npcId, ((m.default ?? m) as TalkFile).talks ?? []); })
      // Thiếu một file thoại KHÔNG được làm sập buổi bán: người đó im, game chạy tiếp.
      .catch(() => { this.loaded.set(npcId, []); })
      .finally(() => { this.pending.delete(npcId); });
    this.pending.set(npcId, job);
    return job;
  }

  /** Gọi lúc khách đi khỏi. Còn trong LRU thì chưa thả thật. */
  release(npcId: string) {
    const n = this.live.get(npcId) ?? 0;
    if (n <= 0) return;
    if (n > 1) { this.live.set(npcId, n - 1); return; }     // còn người khác đang dùng
    this.live.delete(npcId);
    if (npcId === SHARED_POOL) return;                      // kho dùng chung không bao giờ thả
    this.recent.push(npcId);
    while (this.recent.length > KEEP_RECENT) {
      const old = this.recent.shift()!;
      if (!this.live.has(old)) this.loaded.delete(old);
    }
  }

  /** Hết buổi bán. Giữ `ANY` lại: nó dùng cho mọi người, mọi ngày. */
  clear() {
    const any = this.loaded.get(SHARED_POOL);
    this.loaded.clear();
    this.pending.clear();
    this.live.clear();
    this.recent = [];
    if (any) this.loaded.set(SHARED_POOL, any);
  }

  /** Chỉ cho test / tool: nạp hết một lượt rồi trả về phẳng. */
  static async loadAll(): Promise<Talk[]> {
    const s = new TalkStore();
    await Promise.all(Object.keys(LOADERS).map((k) => s.ensure(k)));
    return Object.keys(LOADERS).flatMap((k) => s.loaded.get(k) ?? []);
  }
}

export const TALK_NPC_IDS = Object.keys(LOADERS);
