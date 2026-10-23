import {
  COMMENT_MAX, REPLY_MAX, applyFix, average, fixable, markSeen, reply, spread, starText, unseen, type Review,
} from "../../../sim/reviews";
import { avatar } from "../chat";
import { navBar, page, scroller, type AppCtx } from "../ctx";
import { btn, el, starRow } from "../dom";
import { reviewIntro } from "../reviewIntro";

type Sort = "moi" | "cao" | "thap";
const PAGE = 20;

let sort: Sort = "moi";
let star = 0;
let shown = PAGE;

const reset = () => { sort = "moi"; star = 0; shown = PAGE; };

export function reviewPage(ctx: AppCtx) {
  const { tab, id } = ctx.route;
  if (tab === "fix" && id) return fixPage(ctx, Number(id));
  if (tab === "rep" && id) return replyPage(ctx, Number(id));
  if (!tab) reset();
  return listPage(ctx);
}

function listPage(ctx: AppCtx) {
  const { w } = ctx;
  if (unseen(w)) { markSeen(w); ctx.host.onSave(); }
  const sc = scroller();
  if (!w.reviews.list.length) {
    sc.append(...reviewIntro(w.shopName));
    return page(navBar(ctx, { title: "Đánh giá", back: { label: "Màn chính", to: { app: "home" } } }), sc);
  }
  sc.append(hero(ctx), chips(ctx));

  const rows = pick(w.reviews.list);
  const box = el("div", "ph-revs");
  for (const r of rows.slice(0, shown)) box.append(card(ctx, r));
  if (!rows.length) box.append(el("div", "ph-blank", `Không có đánh giá ${star}★`));
  sc.append(box);
  if (rows.length > shown) {
    const more = el("div", "ph-more");
    more.append(btn("ph-ghost", `Xem thêm ${Math.min(PAGE, rows.length - shown)}`, () => { shown += PAGE; ctx.rerender(); }));
    sc.append(more);
  }
  return page(navBar(ctx, { title: "Đánh giá", back: { label: "Màn chính", to: { app: "home" } } }), sc);
}

function pick(list: readonly Review[]): Review[] {
  const out = star ? list.filter((r) => r.stars === star) : [...list];
  if (sort === "cao") out.sort((a, b) => b.stars - a.stars || b.day - a.day);
  if (sort === "thap") out.sort((a, b) => a.stars - b.stars || b.day - a.day);
  return out;
}

function hero(ctx: AppCtx) {
  const { w } = ctx;
  const avg = average(w);
  const h = el("div", "ph-rev-hero");
  h.append(el("div", "shop", w.shopName), el("div", "sub", "Quán bánh mì"));
  h.append(el("div", "ph-score", starText(avg)));
  const st = el("div", "ph-stars");
  st.innerHTML = starRow(avg, 30);
  h.append(st, el("div", "ph-count", `${w.reviews.list.length} đánh giá`));

  const sp = spread(w);
  const top = Math.max(1, ...sp);
  const dist = el("div", "ph-dist");
  for (let s = 5; s >= 1; s--) {
    const n = sp[s - 1];
    const row = btn(`ph-distrow${star === s ? " on" : ""}`, "", () => {
      star = star === s ? 0 : s;
      shown = PAGE;
      ctx.rerender();
    }, `${n} đánh giá ${s} sao`);
    const bar = el("span", "bar");
    bar.append(el("i", "", ""));
    (bar.firstElementChild as HTMLElement).style.width = `${(n / top) * 100}%`;
    row.append(el("span", "s", String(s)), bar, el("span", "n", String(n)));
    dist.append(row);
  }
  h.append(dist);
  return h;
}

function chips(ctx: AppCtx) {
  const box = el("div", "ph-chips");
  const chip = (id: Sort, label: string) =>
    box.append(btn(`ph-pill${sort === id ? " on" : ""}`, label, () => { sort = id; shown = PAGE; ctx.rerender(); }));
  chip("moi", "Mới nhất");
  chip("cao", "Sao cao");
  chip("thap", "Sao thấp");
  if (star) box.append(btn("ph-pill on", `${star}★ ✕`, () => { star = 0; shown = PAGE; ctx.rerender(); }));
  return box;
}

function card(ctx: AppCtx, r: Review) {
  const day = ctx.w.progress.dayIndex;
  const c = el("div", `ph-rev${r.text ? "" : " bare"}`);
  const top = el("div", "tp");
  const who = el("div", "who");
  who.append(el("b", "", r.who), el("span", "", `Ngày ${r.day}`));
  const st = el("div", "ph-stars sm");
  st.innerHTML = starRow(r.stars, 16);
  top.append(avatar(r.who, true), who, st);
  c.append(top);
  if (r.text) c.append(el("p", "tx", r.text));
  if (r.edited) c.append(el("div", "ed", "(đã cập nhật)"));

  if (r.reply) {
    const rep = el("div", "ph-reply");
    const head = el("div", "hd");
    head.append(avatar(ctx.w.shopName, true), el("b", "", ctx.w.shopName));
    rep.append(head, el("p", "tx", r.reply));
    c.append(rep);
  }

  const acts = el("div", "ph-revacts");
  if (!r.reply) acts.append(btn("ph-btn-text", "Trả lời", () => ctx.go({ app: "rev", tab: "rep", id: String(r.id) })));
  if (ctx.w.system.fix > 0 && fixable(r, day)) {
    acts.append(btn("ph-btn-text", "Hồi Tâm Chuyển Ý", () => ctx.go({ app: "rev", tab: "fix", id: String(r.id) })));
  }
  if (acts.childElementCount) c.append(acts);
  return c;
}

const backTo = { app: "rev" as const };

function replyPage(ctx: AppCtx, id: number) {
  const r = ctx.w.reviews.list.find((x) => x.id === id);
  if (!r || r.reply) {
    return page(navBar(ctx, { title: "Trả lời", back: { label: "Đánh giá", to: backTo } }), el("div", "ph-blank", "Không trả lời được đánh giá này"));
  }
  const quote = el("div", "ph-rev");
  const top = el("div", "tp");
  const who = el("div", "who");
  who.append(el("b", "", r.who), el("span", "", `Ngày ${r.day}`));
  const st = el("div", "ph-stars sm");
  st.innerHTML = starRow(r.stars, 16);
  top.append(avatar(r.who, true), who, st);
  quote.append(top);
  if (r.text) quote.append(el("p", "tx", r.text));

  const ta = el("textarea");
  ta.maxLength = REPLY_MAX;
  ta.setAttribute("aria-label", "Lời trả lời");
  const send = btn("ph-primary", "Gửi", () => {
    if (reply(ctx.w, id, ta.value)) { ctx.host.onSave(); ctx.go(backTo, "l"); }
  });
  send.disabled = true;
  ta.oninput = () => { send.disabled = !ta.value.trim(); };

  const body = el("div", "ph-fix");
  body.append(quote, ta);
  const dock = el("div", "ph-compose");
  dock.append(send, btn("ph-ghost", "Thôi", () => ctx.go(backTo, "l")));
  return page(navBar(ctx, { title: "Trả lời", back: { label: "Đánh giá", to: backTo } }), scroller(body), dock);
}

function fixPage(ctx: AppCtx, id: number) {
  const r = ctx.w.reviews.list.find((x) => x.id === id);
  if (!r || !fixable(r, ctx.w.progress.dayIndex)) {
    return page(navBar(ctx, { title: "Hồi Tâm", back: { label: "Đánh giá", to: backTo } }), el("div", "ph-blank", "Không sửa được đánh giá này"));
  }
  let stars = r.stars;
  const ta = el("textarea");
  ta.maxLength = COMMENT_MAX;
  ta.value = r.text;
  ta.setAttribute("aria-label", "Lời đánh giá");
  const row = el("div", "ph-pick");
  const paint = () => {
    row.replaceChildren();
    for (let i = 1; i <= 5; i++) {
      const b = btn(`ph-star${i <= stars ? " on" : ""}`, "", () => { stars = i; paint(); sync(); }, `${i} sao`);
      b.innerHTML = starRow(i <= stars ? 5 : 0, 34).split("</svg>")[0] + "</svg>";
      row.append(b);
    }
  };
  const save = btn("ph-primary", "Lưu thay đổi", () => {
    if (applyFix(ctx.w, id, { stars, text: ta.value })) { ctx.host.onSave(); ctx.go(backTo, "l"); }
  });
  const sync = () => { save.disabled = stars === r.stars && ta.value.trim() === r.text; };
  ta.oninput = sync;
  paint();
  sync();
  const body = el("div", "ph-fix");
  body.append(el("div", "who", r.who), row, ta);
  const dock = el("div", "ph-compose");
  dock.append(save, btn("ph-ghost", "Giữ nguyên", () => ctx.go(backTo, "l")));
  return page(navBar(ctx, { title: "Hồi Tâm", back: { label: "Đánh giá", to: backTo } }), scroller(body), dock);
}
