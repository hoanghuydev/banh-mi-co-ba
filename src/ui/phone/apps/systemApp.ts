import {
  ASK_ACCEPT, AWAKEN_LINES, AWAKEN_STATS, QUEST_TEXT, REFUSE_ONE, REFUSE_TWO,
} from "../../../content/system";
import { HELP_FROM, rewinds } from "../../../core/rewinds";
import { rewindLines } from "../../../content/system";
import { BEAUTY_MAX, SLOTS, accept, canSpin, refuse, say, spin, spinIndex, startCashText, wheelOf, type RewardId } from "../../../sim/system";
import { TOUR_TOTAL, tourIndex, tourStep, touring } from "../../../sim/tour";
import { navBar, page, scroller, type AppCtx } from "../ctx";
import { btn, el } from "../dom";
import { sfx, type SfxId } from "../../../audio/sfx";

const RESULT_SFX: Partial<Record<RewardId, SfxId>> = { LUCK: "wheel_truot", TIEN_LE: "sfx_tien_le", KIM_KHO: "wheel_trung_lon" };

const SHORT: Record<RewardId, string> = {
  LUCK: "May mắn", TIEN_LE: "Tiền lẻ", KIM_KHO: "Kim khố", NHAN_SAC: "Nhan sắc",
  DANH_TIENG: "Danh tiếng", BAT_NHIEM: "Bất nhiễm", THIEN_DINH: "Thiền định", THE_GIAM: "Thẻ giảm",
  LUONG_THAO: "Lương thảo", MIEN_TO: "Miễn tô", THAN_HANH: "Hoả tốc", TAI_CHUYEN: "Quay lại", HOI_TAM: "Hồi tâm",
  BAO_KHI: "Bảo khí", THE_DO_NGHE: "Thẻ đồ nghề", NHAN_LIEU: "Nhân liệu", PHONG_HANH: "Tay nhanh", THIEN_CO: "Thiên cơ",
};
const FILL: Record<RewardId, string> = {
  LUCK: "#0d2530", TIEN_LE: "#0b4a5c", KIM_KHO: "#6b5200", NHAN_SAC: "#5a1a48",
  DANH_TIENG: "#31238a", BAT_NHIEM: "#0a5a5a", THIEN_DINH: "#1f3f7a", THE_GIAM: "#0a5a3a",
  LUONG_THAO: "#5a4a10", MIEN_TO: "#6b3a00", THAN_HANH: "#7a3010", TAI_CHUYEN: "#4a1f7a", HOI_TAM: "#7a1030",
  BAO_KHI: "#6b1f6b", THE_DO_NGHE: "#33465a", NHAN_LIEU: "#4f5a10", PHONG_HANH: "#0a4f7a", THIEN_CO: "#1a5a60",
};

export function systemApp(ctx: AppCtx): HTMLElement {
  const { w } = ctx;
  if (w.system.stage === "new") return awakening(ctx);
  const sc = scroller();
  const root = page(
    navBar(ctx, { title: "Hệ thống", back: { label: "Màn chính", to: { app: "home" } } }),
    sc,
  );
  root.classList.add("sys");

  sc.append(statusCard(ctx));
  if (touring(w)) sc.append(questCard(ctx));
  if (canSpin(w)) sc.append(wheelCard(ctx));
  sc.append(logCard(ctx));
  return root;
}

function statusCard(ctx: AppCtx) {
  const { w } = ctx;
  const c = el("div", "sys-card");
  const row = (k: string, v: string) => {
    const r = el("div", "kv");
    r.append(el("span", "", k), el("b", "", v));
    c.append(r);
  };
  row("Ký chủ", "Phương Anh");
  row("Cảnh giới", "Chủ Quán Mới Mở (Tầng 1)");
  row("Kinh nghiệm sống", String(w.system.exp));
  if (w.system.beauty) row("Nhan sắc", `cấp ${w.system.beauty}/${BEAUTY_MAX}`);
  if (w.system.discount) row("Thẻ giảm giá", `×${w.system.discount}`);
  if (w.system.gearCoupon) row("Thẻ giảm giá đồ nghề", `×${w.system.gearCoupon}`);
  if (w.system.express) row("Thần Hành Phù", `×${w.system.express}`);
  if (w.system.fix) row("Hồi Tâm Chuyển Ý", `×${w.system.fix}`);
  return c;
}

function questCard(ctx: AppCtx) {
  const step = tourStep(ctx.w);
  const c = el("div", "sys-card quest");
  c.append(el("div", "hd", `Nhiệm vụ tân thủ ${tourIndex(ctx.w)}/${TOUR_TOTAL}`));
  c.append(el("p", "", QUEST_TEXT[step] ?? ""));
  return c;
}

const LOG_PAGE = 20;

function logCard(ctx: AppCtx) {
  const log = ctx.w.system.log;
  const c = el("div", "sys-log");
  if (!log.length) return c;
  c.append(el("div", "ph-sec dark", "Thông báo"));
  const want = Math.max(LOG_PAGE, Number(ctx.route.id) || 0);
  for (const e of log.slice(-want).reverse()) c.append(el("p", "", e.text));
  if (log.length > want) {
    c.append(btn("ph-btn-text", "Xem thêm", () => ctx.go({ app: "sys", id: String(want + LOG_PAGE) }, "")));
  }
  return c;
}

function awakening(ctx: AppCtx): HTMLElement {
  const { w } = ctx;
  const body = el("div", "sys-awake");
  const dock = el("div", "ph-compose sys-dock");
  const root = page(body, dock);
  root.classList.add("sys");

  sfx.ui("sys_khoi_dong");
  let i = 0;
  const showLine = (text: string, cls = "") => {
    const p = el("p", cls, text);
    body.append(p);
    queueMicrotask(() => { body.scrollTop = body.scrollHeight; });
  };

  let fast = false;
  const run = (items: (string | (() => void))[], done: () => void, gap = 520) => {
    const step = () => {
      if (!root.isConnected) return;
      if (i >= items.length) { done(); return; }
      const it = items[i++];
      if (typeof it === "string") showLine(it); else it();
      window.setTimeout(step, fast ? 30 : gap);
    };
    i = 0;
    window.setTimeout(step, 450);
  };
  root.addEventListener("pointerdown", () => { fast = true; });

  const stats = () => {
    const t = el("div", "sys-stats");
    for (const [k, v] of AWAKEN_STATS(startCashText(w))) {
      const r = el("div", "kv");
      r.append(el("span", "", k), el("b", "", v));
      t.append(r);
    }
    body.append(t);
  };

  const ask = (text: readonly string[]) => {
    sfx.ui("sys_thong_bao");
    for (const l of text) showLine(l);
    dock.replaceChildren();
    dock.append(
      btn("ph-primary sys-yes", "Chấp nhận", () => {
        accept(w, rewinds() >= HELP_FROM);
        sfx.ui("sys_nhiem_vu_xong");
        say(w, "Keng! Ký chủ chấp nhận nhiệm vụ tân thủ.");
        ctx.host.onSave();
        ctx.close();
      }),
      btn("ph-ghost", "Từ chối", () => {
        sfx.ui("sys_canh_bao");
        if (refuse(w) === "again") {
          showLine("");
          ask(REFUSE_ONE);
        } else {
          dock.replaceChildren();
          for (const l of REFUSE_TWO) showLine(l);
          ctx.host.onSave();
          dock.append(btn("ph-primary", "Tiếp tục", () => ctx.close()));
        }
      }),
    );
  };

  run([...AWAKEN_LINES, ...rewindLines(rewinds()), stats, ...ASK_ACCEPT.slice(0, 1)], () => ask(ASK_ACCEPT.slice(1)));
  return root;
}

function wheelCard(ctx: AppCtx) {
  const { w } = ctx;
  const day = w.progress.dayIndex;
  const card = el("div", "sys-card wheel");
  card.append(el("p", "ann", `Keng! Ký chủ điểm danh thành công ngày ${day}.`));
  card.append(el("p", "ann", "Mở ra vòng quay vận khí, quay ngay?"));
  const slots = wheelOf(w);
  const box = el("div", "sys-wheel");
  const wheel = el("div", "disc");
  wheel.innerHTML = wheelSvg(slots);
  box.append(wheel, el("div", "pin"));
  card.append(box);
  const out = el("div", "sys-result");
  const go = btn("ph-primary sys-yes", "Quay", () => {
    go.disabled = true;
    const idx = spinIndex(w);
    const turn = 360 * 6 - (idx * (360 / SLOTS) + 360 / SLOTS / 2);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    wheel.style.transition = reduce ? "none" : "transform 4.2s cubic-bezier(.12,.7,.1,1)";
    wheel.style.transform = `rotate(${turn}deg)`;
    const res = spin(w);
    ctx.host.onSave();
    sfx.ui("wheel_quay");
    window.setTimeout(() => {
      if (!res) return;
      sfx.ui(RESULT_SFX[res.id] ?? "wheel_trung");
      out.append(...res.lines.map((l) => el("p", "", l)));
      go.remove();
      const again = canSpin(w);
      const done = btn("ph-primary", again ? "Quay tiếp" : "Vào ngày mới", () => (again ? ctx.rerender() : ctx.close()));
      card.append(done);
    }, reduce ? 0 : 4300);
  });
  card.append(out, go);
  return card;
}

function wheelSvg(slots: RewardId[]) {
  const R = 130, cx = 130, cy = 130, n = slots.length, a = (Math.PI * 2) / n;
  let s = `<svg viewBox="0 0 260 260" width="100%" aria-hidden="true">`;
  slots.forEach((id, i) => {
    const a0 = i * a - Math.PI / 2, a1 = (i + 1) * a - Math.PI / 2;
    const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0);
    const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
    s += `<path d="M${cx} ${cy} L${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" fill="${FILL[id]}" stroke="#19e3ff" stroke-opacity=".55" stroke-width="1.5"/>`;
    const mid = ((i + 0.5) * 360) / n;
    s += `<text x="${cx}" y="${cy - 84}" transform="rotate(${mid} ${cx} ${cy})" fill="#fff" font-size="11.5" font-weight="700" text-anchor="middle" font-family="Be Vietnam Pro, sans-serif">${SHORT[id]}</text>`;
  });
  s += `<circle cx="${cx}" cy="${cy}" r="${R - 1}" fill="none" stroke="#19e3ff" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="16" fill="#06222c" stroke="#39ff9c" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="7" fill="#39ff9c"/></svg>`;
  return s;
}

