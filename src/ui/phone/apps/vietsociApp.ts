import { faComment, faThumbsUp } from "@fortawesome/free-regular-svg-icons";
import { faHeart, faShare, faThumbsUp as faThumbsUpSolid, type IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { feedPosts, markPostsSeen, unseenPosts, type Post } from "../../../sim/vietsoci";
import { navBar, page, scroller, type AppCtx } from "../ctx";
import { btn, el } from "../dom";

const FEED_STEP = 5;
const LOAD_AHEAD_PX = 200;

export const postImg = (p: Post) => `art/vietsoci/${p.img}.webp`;

function fa(def: IconDefinition, cls = ""): HTMLElement {
  const [w, h, , , d] = def.icon;
  const i = el("span", `fa ${cls}`);
  i.innerHTML = `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true"><path fill="currentColor" d="${String(d)}"/></svg>`;
  return i;
}

const count = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(".", ",")}K` : String(n);

export function vietsociApp(ctx: AppCtx) {
  const { w, route } = ctx;
  const one = route.id ? w.vietsoci.posts.find((p) => p.id === Number(route.id)) : undefined;
  if (one) return postPage(ctx, one);

  if (unseenPosts(w)) { markPostsSeen(w); ctx.host.onSave(); }
  const posts = feedPosts(w);
  const feed = el("div", "ph-vs-feed");
  const sc = scroller(feed);
  let shown = 0;
  const more = () => {
    for (const p of posts.slice(shown, shown + FEED_STEP)) feed.append(card(p, 2, () => ctx.go({ app: "vs", id: String(p.id) })));
    shown = Math.min(posts.length, shown + FEED_STEP);
  };
  more();
  if (!posts.length) feed.append(el("div", "ph-blank", "Chưa có bài nào"));
  sc.addEventListener("scroll", () => {
    if (shown < posts.length && sc.scrollTop + sc.clientHeight >= sc.scrollHeight - LOAD_AHEAD_PX) more();
  });
  return page(navBar(ctx, { title: "VietSoci", back: { label: "Màn chính", to: { app: "home" } } }), sc);
}

function postPage(ctx: AppCtx, p: Post) {
  const feed = el("div", "ph-vs-feed");
  feed.append(card(p, p.comments.length));
  return page(navBar(ctx, { title: p.kenh, back: { label: "VietSoci", to: { app: "vs" } } }), scroller(feed));
}

/** `open` có thì ảnh và phần bình luận mở trang chi tiết; trang chi tiết thì không truyền. */
function card(p: Post, comments: number, open?: () => void) {
  const c = el("div", "ph-vs");
  const head = el("div", "hd");
  const who = el("div", "who");
  who.append(el("b", "", p.kenh), el("span", "", `Ngày ${p.day}`));
  head.append(el("span", "av", p.kenh.slice(0, 1).toUpperCase()), who);
  const picCls = `pic${p.video ? " video" : ""}`;
  const pic = open ? btn(picCls, "", open, `Mở bài của ${p.kenh}`) : el("div", picCls);
  const img = el("img") as HTMLImageElement;
  img.src = postImg(p);
  img.alt = "";
  pic.append(img);
  const stats = el("div", "st");
  const likes = el("span", "lk");
  likes.append(fa(faThumbsUpSolid, "like"), fa(faHeart, "love"), document.createTextNode(count(p.likes)));
  const nCm = el("span", "", `${count(p.comments.length)} bình luận`);
  stats.append(likes, nCm);
  const acts = el("div", "ac");
  for (const [icon, label] of [[faThumbsUp, "Thích"], [faComment, "Bình luận"], [faShare, "Chia sẻ"]] as const) {
    const a = el("span");
    a.append(fa(icon), document.createTextNode(label));
    acts.append(a);
    if (open && icon === faComment) tappable(a, open);
  }
  c.append(head, el("div", "cap", p.caption), pic, stats, acts);
  const cm = el("div", "cm");
  for (const t of p.comments.slice(0, comments)) cm.append(el("div", "", t));
  if (cm.childElementCount) c.append(cm);
  if (open) { tappable(nCm, open); tappable(cm, open); }
  return c;
}

function tappable(e: HTMLElement, open: () => void) {
  e.classList.add("tap");
  e.onclick = open;
}
