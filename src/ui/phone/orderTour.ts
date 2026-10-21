import type { SaveFile } from "../../core/save";
import { QUEST_TEXT } from "../../content/system";
import { TOUR_ORDER, TOUR_SUPPLIER, TOUR_TOTAL, tourAt, tourIndex, tourOrderReady, tourOrderSteps, tourSkip } from "../../sim/tour";
import { linked } from "../../sim/system";
import { supplierById } from "../../sim/suppliers";
import { TourCoach } from "../tour/TourCoach";
import type { Route } from "./ctx";

const q = (sel: string) => document.querySelector<HTMLElement>(`.ph-root ${sel}`);

/** Dắt đặt hàng ngày đầu từng món trong app Thực phẩm: chọn nơi bán, bấm + đủ lần, xem giỏ, đặt. */
export class OrderTour {
  private coach: TourCoach | null = null;
  private timer = 0;

  constructor(private w: SaveFile, private textScale: number) {}

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
    // Chờ hiệu ứng chuyển trang xong rồi mới đo vị trí.
    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.aim(r, point, intro), 260);
  }

  private aim(r: Route, point: (el: HTMLElement | null, text: string) => void, intro: string) {
    if (!this.coach) return;
    if (r.app === "home") { point(q('.ph-app[aria-label="Thực phẩm"]'), `${intro}Mở Thực phẩm để đặt hàng.`); return; }
    if (r.app !== "shop") { this.coach.hide(); return; }
    const tab = r.tab ?? "shop";
    if (tab === "orders") { point(q(".ph-tab"), "Quay lại Mua sắm."); return; }
    if (tab === "cart") {
      if (tourOrderReady(this.w)) point(q(".ph-primary"), "Bấm Đặt hàng.");
      else point(q(".ph-tab"), "Còn thiếu món. Quay lại Mua sắm.");
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

  destroy() { clearTimeout(this.timer); this.coach?.destroy(); this.coach = null; }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
