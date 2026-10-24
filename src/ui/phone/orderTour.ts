import { hint } from "../../core/device";
import type { SaveFile } from "../../core/save";
import { QUEST_TEXT } from "../../content/system";
import { TOUR_ORDER, TOUR_SUPPLIER, TOUR_TOTAL, tourAt, tourIndex, tourOrderReady, tourOrderSteps, tourOrdered, tourSkip } from "../../sim/tour";
import { linked } from "../../sim/system";
import { supplierById } from "../../sim/suppliers";
import { TourCoach } from "../tour/TourCoach";
import type { Route } from "./ctx";

const q = (sel: string) => document.querySelector<HTMLElement>(`.ph-root ${sel}`);

/** Dắt đặt hàng ngày đầu từng món trong app Thực phẩm: chọn nơi bán, bấm + đủ lần, xem giỏ, đặt, rồi chỉ giờ hàng về. */
export class OrderTour {
  private coach: TourCoach | null = null;
  private timer = 0;
  private shipNoted = false;
  private waitClick = false;

  constructor(private w: SaveFile, private textScale: number, private onOrdered: () => void) {}

  get active() { return tourAt(this.w, "CHO"); }

  update(r: Route) {
    if (!this.active) { this.destroy(); return; }
    this.coach ??= new TourCoach({
      textScale: this.textScale,
      onSkip: () => { tourSkip(this.w); this.destroy(); },
    });
    this.coach.setWho(linked(this.w) ? "Hệ thống" : "Hướng dẫn");
    const idx = tourIndex(this.w);
    const point = (el: HTMLElement | null, text: string) => this.coach!.pointEl(el, text, idx, TOUR_TOTAL);
    const intro = linked(this.w) ? `${QUEST_TEXT.CHO.split(".")[0]}. ` : "";
    // Đo lại đều tay: điện thoại còn trượt vào màn hình thì đo một lần là khoanh trượt chỗ.
    clearInterval(this.timer);
    this.aim(r, point, intro);
    this.timer = window.setInterval(() => this.aim(r, point, intro), 250);
  }

  private aim(r: Route, point: (el: HTMLElement | null, text: string) => void, intro: string) {
    if (!this.coach) return;
    if (tourOrdered(this.w)) {
      const at = q(".ph-order .ph-st");
      if (!at) { this.coach.hide(); return; }
      this.armClick(() => { this.onOrdered(); this.destroy(); });
      point(at, "Đây là giờ hàng về dự kiến. " + hint("Bấm chuột để tiếp.", "Chạm để tiếp."));
      return;
    }
    if (r.app === "home") { point(q('.ph-app[aria-label="Thực phẩm"]'), `${intro}Mở Thực phẩm để đặt hàng.`); return; }
    if (r.app !== "shop") { this.coach.hide(); return; }
    const tab = r.tab ?? "shop";
    if (tab === "orders") { point(q(".ph-tab"), "Quay lại Mua sắm."); return; }
    if (tab === "cart") {
      if (!tourOrderReady(this.w)) { point(q(".ph-tab"), "Còn thiếu món. Quay lại Mua sắm."); return; }
      const ship = q('[data-opt="express"]') as HTMLButtonElement | null;
      if (ship && !this.shipNoted) {
        ship.scrollIntoView({ block: "center" });
        this.armClick(() => { this.shipNoted = true; });
        point(ship, ship.disabled
          ? "Hình thức giao: hàng kịp về trước giờ bán, khỏi hoả tốc. " + hint("Bấm chuột để tiếp.", "Chạm để tiếp.")
          : "Hình thức giao: hoả tốc về sớm hơn nhưng tốn phí. " + hint("Bấm chuột để tiếp.", "Chạm để tiếp."));
        return;
      }
      point(q(".ph-primary"), "Bấm Đặt hàng.");
      return;
    }
    if ((r.id ?? "all") !== TOUR_SUPPLIER) {
      const name = supplierById(TOUR_SUPPLIER)?.name ?? "";
      const chip = [...document.querySelectorAll<HTMLElement>(".ph-root .ph-pill")].find((p) => p.textContent === name) ?? null;
      chip?.scrollIntoView({ inline: "center", block: "nearest" });
      point(chip, `Chọn ${name}: món nào cũng có, giá ổn định.`);
      return;
    }
    const next = tourOrderSteps(this.w).find((s) => s.done < s.clicks);
    if (!next) { point(q(".ph-cartbar"), "Đủ hàng rồi. Mở giỏ hàng."); return; }
    const el = q(`[data-offer="${next.offerId}"]`);
    el?.scrollIntoView({ block: "center" });
    const total = TOUR_ORDER.find((t) => t.good === next.good)!.units;
    point(el, next.clicks > 1
      ? `${cap(next.label)}: bấm + ${next.clicks} lần cho đủ ${total} (đã ${next.done}/${next.clicks}).`
      : `${cap(next.label)}: bấm + một lần.`);
  }

  /** Câu chỉ để đọc: chạm chỗ nào cũng qua bước sau. */
  private armClick(done: () => void) {
    if (this.waitClick) return;
    this.waitClick = true;
    window.addEventListener("pointerdown", () => { this.waitClick = false; done(); }, { once: true, capture: true });
  }

  destroy() { clearInterval(this.timer); this.coach?.destroy(); this.coach = null; }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
