import {
  ASK_ACCEPT, AWAKEN_LINES, AWAKEN_STATS, QUEST_TEXT, REFUSE_ONE, REFUSE_TWO,
} from "../../../content/system";
import { HELP_FROM, rewinds } from "../../../core/rewinds";
import { rewindLines } from "../../../content/system";
import { SLOTS, accept, canSpin, refuse, say, spin, spinIndex, startCashText, wheelOf, type RewardId } from "../../../sim/system";
import { TOUR_TOTAL, tourIndex, tourStep, touring } from "../../../sim/tour";
import { navBar, page, scroller, type AppCtx } from "../ctx";
import { btn, el } from "../dom";

const SHORT: Record<RewardId, string> = {
  LUCK: "May mắn", TIEN_LE: "Tiền lẻ", KIM_KHO: "Kim khố", MY_NHAN: "Mỹ nhân",
  DANH_TIENG: "Danh tiếng", THE_GIAM: "Thẻ giảm", THAN_HANH: "Hoả tốc",
};
const FILL: Record<RewardId, string> = {
  LUCK: "#3a4260", TIEN_LE: "#2f6f8f", KIM_KHO: "#b8860b", MY_NHAN: "#a8456f",
  DANH_TIENG: "#6b4fa3", THE_GIAM: "#2f7d57", THAN_HANH: "#c0502b",
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
  if (w.system.discount) row("Thẻ giảm giá", `×${w.system.discount}`);
  if (w.system.express) row("Thần Hành Phù", `×${w.system.express}`);
  return c;
}

function questCard(ctx: AppCtx) {
  const step = tourStep(ctx.w);
  const c = el("div", "sys-card quest");
  c.append(el("div", "hd", `Nhiệm vụ tân thủ ${tourIndex(ctx.w)}/${TOUR_TOTAL}`));
  c.append(el("p", "", QUEST_TEXT[step] ?? ""));
  return c;
}

function logCard(ctx: AppCtx) {
  const log = ctx.w.system.log;
  const c = el("div", "sys-log");
  if (!log.length) return c;
  c.append(el("div", "ph-sec dark", "Thông báo"));
  const shown = log.slice(-14).reverse();
  for (const e of shown) c.append(el("p", "", e.text));
  return c;
}

function awakening(ctx: AppCtx): HTMLElement {
  const { w } = ctx;
  const body = el("div", "sys-awake");
  const dock = el("div", "ph-compose sys-dock");
  const root = page(body, dock);
  root.classList.add("sys");

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
    for (const l of text) showLine(l);
    dock.replaceChildren();
    dock.append(
      btn("ph-primary sys-yes", "Chấp nhận", () => {
        accept(w, rewinds() >= HELP_FROM);
        say(w, "Keng! Ký chủ chấp nhận nhiệm vụ tân thủ.");
        ctx.host.onSave();
        ctx.close();
      }),
      btn("ph-ghost", "Từ chối", () => {
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
  card.append(el("p", "ann", `Keng! Ký chủ đánh dấu thành công ngày ${day}.`));
  card.append(el("p", "ann", "Mở ra vòng quay vận khí, phải chăng quay?"));
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
    window.setTimeout(() => {
      if (!res) return;
      out.append(...res.lines.map((l) => el("p", "", l)));
      go.remove();
      const done = btn("ph-primary", "Vào ngày mới", () => ctx.close());
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
    s += `<path d="M${cx} ${cy} L${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" fill="${FILL[id]}" stroke="#0f1430" stroke-width="2"/>`;
    const mid = ((i + 0.5) * 360) / n;
    s += `<text x="${cx}" y="${cy - 84}" transform="rotate(${mid} ${cx} ${cy})" fill="#fff" font-size="11.5" font-weight="700" text-anchor="middle" font-family="Be Vietnam Pro, sans-serif">${SHORT[id]}</text>`;
  });
  s += `<circle cx="${cx}" cy="${cy}" r="22" fill="#0f1430" stroke="#ffd84a" stroke-width="3"/></svg>`;
  return s;
}

