/**
 * Chỗ để overlay dev (P0-03 §2.2) tìm thấy những thứ đang chạy mà không cần
 * scene nào import overlay. Ở bản phát hành không ai ghi vào đây — mọi chỗ ghi
 * đều nằm sau `if (DEV_TOOLS)`.
 */
import type { GameContext } from "../core/context";
import type { Service } from "../sim/service";

export type StallHooks = {
  service: Service;
  /** Ép đóng quầy ngay. */
  end(): void;
  fire(stimId: string, zone?: string): void;
  gameObjects(): number;
};

export const dev: {
  ctx: GameContext | null;
  stall: StallHooks | null;
  /** Lời gọi tới hàng đợi thoại / rule DB gần nhất — P2 sẽ ghi vào đây. */
  lastQuery: unknown;
} = { ctx: null, stall: null, lastQuery: null };
