import { navBar, page, scroller, type AppCtx } from "../ctx";
import { reviewIntro } from "../reviewIntro";

export function reviewPage(ctx: AppCtx) {
  return page(
    navBar(ctx, { title: "Đánh giá", back: { label: "Màn chính", to: { app: "home" } } }),
    scroller(...reviewIntro(ctx.w.shopName)),
  );
}
