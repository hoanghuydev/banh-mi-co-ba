import { COMMENT_MAX, applyFix, average, fixable, type Review } from "../../../sim/reviews";
import { avatar } from "../chat";
import { navBar, page, scroller, type AppCtx } from "../ctx";
import { btn, el, starRow } from "../dom";
import { reviewIntro } from "../reviewIntro";

export function reviewPage(ctx: AppCtx) {
  if (ctx.route.tab === "fix" && ctx.route.id) return fixPage(ctx, Number(ctx.route.id));
  const { w } = ctx;
  const list = w.reviews.list;
  const sc = scroller();
  if (!list.length) sc.append(...reviewIntro(w.shopName));
  else {
    const hero = el("div", "ph-rev-hero");
    hero.append(el("div", "shop", w.shopName), el("div", "sub", "Quán bánh mì"));
    hero.append(el("div", "ph-score", average(w).toFixed(1)));
    const stars = el("div", "ph-stars");
    stars.innerHTML = starRow(average(w), 30);
    hero.append(stars, el("div", "ph-count", `${list.length} đánh giá`));
    sc.append(hero);
    const box = el("div", "ph-revs");
    for (const r of list) box.append(card(ctx, r));
    sc.append(box);
  }
  return page(navBar(ctx, { title: "Đánh giá", back: { label: "Màn chính", to: { app: "home" } } }), sc);
}

function card(ctx: AppCtx, r: Review) {
  const c = el("div", "ph-rev");
  const top = el("div", "tp");
  const who = el("div", "who");
  who.append(el("b", "", r.who), el("span", "", `Ngày ${r.day}`));
  const st = el("div", "ph-stars sm");
  st.innerHTML = starRow(r.stars, 16);
  top.append(avatar(r.who, true), who, st);
  c.append(top);
  if (r.text) c.append(el("p", "tx", r.text));
  if (r.edited) c.append(el("div", "ed", "(đã cập nhật)"));
  if (ctx.w.system.fix > 0 && fixable(r)) {
    c.append(btn("ph-btn-text", "Hồi Tâm Chuyển Ý", () => ctx.go({ app: "rev", tab: "fix", id: String(r.id) })));
  }
  return c;
}

function fixPage(ctx: AppCtx, id: number) {
  const r = ctx.w.reviews.list.find((x) => x.id === id);
  const back = { app: "rev" as const };
  if (!r || !fixable(r)) return page(navBar(ctx, { title: "Hồi Tâm", back: { label: "Đánh giá", to: back } }), el("div", "ph-blank", "Không sửa được đánh giá này"));
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
    if (applyFix(ctx.w, id, { stars, text: ta.value })) { ctx.host.onSave(); ctx.go(back, "l"); }
  });
  const sync = () => { save.disabled = stars === r.stars && ta.value.trim() === r.text; };
  ta.oninput = sync;
  paint();
  sync();
  const body = el("div", "ph-fix");
  body.append(el("div", "who", r.who), row, ta);
  const dock = el("div", "ph-compose");
  dock.append(save, btn("ph-ghost", "Giữ nguyên", () => ctx.go(back, "l")));
  return page(navBar(ctx, { title: "Hồi Tâm", back: { label: "Đánh giá", to: back } }), scroller(body), dock);
}
