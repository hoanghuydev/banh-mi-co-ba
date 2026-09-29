/**
 * Những thứ sống suốt một phiên chơi, ngoài mọi scene: telemetry.
 * Tách khỏi `telemetry.ts` để test/headless tự dựng bản riêng mà không kéo theo bản của game.
 */
import { bus } from "./eventbus";
import { loadSettings } from "./flags";
import { Telemetry } from "./telemetry";

export const telemetry = new Telemetry(bus, loadSettings().telemetry === true);
