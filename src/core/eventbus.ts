/**
 * EventBus — CANON §5: "duyệt loop từ phía SỰ KIỆN, không từ phía NPC".
 * Sự kiện phát ra ở đây; tầng perception sẽ là bên đăng ký nghe (P1).
 */
export type StimId =
  | "WRONG_NAME" | "MADE_THEM_WAIT" | "BURNT_OR_COLD" | "DROPPED_FOOD"
  | "ORDER_DEFECT" | "DIRTY_HANDS"
  | "REMEMBERED_USUAL" | "REMEMBERED_STORY" | "CARED_FOR_THEM" | "FREE_EXTRA" | "FLOURISH";

/** Vùng cơ thể/quầy nơi sự kiện xảy ra — cột của bảng visibility (CANON §5). */
export type Slot = "HANDS" | "BOARD" | "OVEN" | "UNDER_COUNTER";

export type Stimulus = {
  id: StimId;
  slot: Slot;
  /**
   * Giây THẬT kể từ đầu buổi bán.
   *
   * Cố ý KHÔNG dùng đồng hồ trong game: đồng hồ ngày bị nén lại (1 giây thật =
   * 1 phút game), còn chuyện "khách có kịp nhìn thấy không" thì diễn ra trong
   * thời gian thật của tay người chơi. Trộn hai thang đo này là kích thích tắt
   * ngay lập tức và không ai nhận thấy gì.
   */
  at: number;
};

type Handler<T> = (payload: T) => void;

export class EventBus<Events extends Record<string, unknown>> {
  private map = new Map<keyof Events, Set<Handler<never>>>();

  on<K extends keyof Events>(key: K, fn: Handler<Events[K]>) {
    let set = this.map.get(key);
    if (!set) this.map.set(key, (set = new Set()));
    set.add(fn as Handler<never>);
    return () => set!.delete(fn as Handler<never>);
  }

  emit<K extends keyof Events>(key: K, payload: Events[K]) {
    this.map.get(key)?.forEach((fn) => (fn as Handler<Events[K]>)(payload));
  }
}

export type GameEvents = {
  stimulus: Stimulus;
  dayEnded: { day: number };
};

export const bus = new EventBus<GameEvents>();
