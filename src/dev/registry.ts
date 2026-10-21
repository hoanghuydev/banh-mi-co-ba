/** Overlay dev đọc từ đây để scene không phải import overlay; chỉ ghi sau `if (DEV_TOOLS)`. */
import type { GameContext } from "../core/context";
import type { Service } from "../sim/service";

export type StallHooks = {
  service: Service;
  end(): void;
  fire(stimId: string, zone?: string): void;
  gameObjects(): number;
};

export const dev: {
  ctx: GameContext | null;
  stall: StallHooks | null;
  lastQuery: unknown;
} = { ctx: null, stall: null, lastQuery: null };
