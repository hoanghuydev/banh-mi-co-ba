import { MEMBERS, contactOf } from "../../../content/phone/contacts";
import { markRead, pendingEvent, reply, sortedThreads, unreadOf, type Thread } from "../../../sim/phone";
import { sfx } from "../../../audio/sfx";
import { avatar, bubbleNodes } from "../chat";
import { navBar, page, scroller, type AppCtx } from "../ctx";
import { ICON, btn, el } from "../dom";
import { postImg } from "./vietsociApp";

function threadList(ctx: AppCtx, current = ""): HTMLElement {
  const list = el("div", "ph-list");
  const threads = sortedThreads(ctx.w.phone);
  if (!threads.length) list.append(el("div", "ph-blank", "Chưa có tin nhắn"));
  for (const t of threads) list.append(threadRow(ctx, t, t.id === current));
  return list;
}

const listNav = (ctx: AppCtx) => navBar(ctx, { title: "Message", shortOnly: true, back: { label: "Màn chính", to: { app: "home" } } });

/** Điện thoại ngang: danh sách bên trái, khung chat bên phải. */
export function messageList(ctx: AppCtx): HTMLElement {
  const empty = el("div", "ph-md-empty");
  empty.innerHTML = ICON.msgBig;
  const root = page(listNav(ctx), el("div", "ph-title-l", "Message"), scroller(threadList(ctx)), empty);
  root.classList.add("ph-md");
  return root;
}

function threadRow(ctx: AppCtx, t: Thread, on: boolean) {
  const c = contactOf(t.id);
  const last = t.msgs[t.msgs.length - 1];
  const un = unreadOf(t);
  const row = btn(`ph-row${un || t.pending ? " unread" : ""}${on ? " on" : ""}`, "", () => ctx.go({ app: "chat", id: t.id }));
  const mid = el("span", "mid");
  const preview = last ? (last.attach ? "📎 " + last.attach : last.text) : "";
  mid.append(el("div", "nm", c.name), el("div", "pv", preview));
  const side = el("span", "side");
  side.append(el("span", "", last?.at.replace(/^.*· /, "") ?? ""));
  if (un || t.pending) side.append(el("span", "ph-dot", un ? String(un) : ""));
  row.append(avatar(t.id), mid, side);
  return row;
}

export function chatPage(ctx: AppCtx, id: string): HTMLElement {
  const { w } = ctx;
  const t = w.phone.threads.find((x) => x.id === id);
  const c = contactOf(id);
  if (t) markRead(w.phone, id);
  const members = MEMBERS[id];
  const nav = navBar(ctx, {
    title: c.name,
    sub: members ? `${members.length + 1} thành viên` : undefined,
    back: { label: "Tin nhắn", to: { app: "msg" } },
    onTitle: members ? () => ctx.go({ app: "members", id }, "r") : undefined,
  });
  const body = el("div", "ph-chat");
  const sc = scroller(body);
  const msgs = t?.msgs ?? [];
  const link = (pid: number) => {
    const p = w.vietsoci.posts.find((x) => x.id === pid);
    if (!p) return null;
    const card = btn("ph-vslink", "", () => ctx.go({ app: "vs", id: String(p.id) }), `Mở bài VietSoci của ${p.kenh}`);
    const img = el("img") as HTMLImageElement;
    img.src = postImg(p);
    img.alt = "";
    const tx = el("span", "tx");
    tx.append(el("b", "", `VietSoci · ${p.kenh}`), el("span", "", p.caption));
    card.append(img, tx);
    return card;
  };
  msgs.forEach((m, i) => body.append(...bubbleNodes(m, msgs[i - 1], !!c.group, msgs[i + 1], link)));
  const dock = el("div");
  const pe = t && pendingEvent(t);
  if (pe) {
    const box = el("div", "ph-compose");
    pe.options.forEach((o, i) => {
      const chip = btn(`ph-chip${i ? " alt" : ""}`, `${i ? "😏" : "🙂"}  ${o.me}`, () => {
        if (reply(w, id, i)) { sfx.ui("ph_tin_di"); ctx.host.onSave(); ctx.go({ app: "chat", id }, ""); }
      });
      box.append(chip);
    });
    dock.append(box);
  }
  queueMicrotask(() => { sc.scrollTop = sc.scrollHeight; });
  const side = page(listNav(ctx), scroller(threadList(ctx, id)));
  side.classList.add("ph-md-side");
  const root = page(nav, sc, dock, side);
  root.classList.add("ph-md", "chat");
  return root;
}

export function membersPage(ctx: AppCtx, id: string): HTMLElement {
  const c = contactOf(id);
  const head = el("div", "ph-grp-head");
  const av = avatar(id);
  av.classList.add("xl");
  head.append(av, el("div", "gn", c.name), el("div", "gs", `${(MEMBERS[id]?.length ?? 0) + 1} thành viên`));
  const card = el("div", "ph-card");
  const who = [...(MEMBERS[id] ?? []), "me"];
  for (const m of who) {
    const row = el("div", "ph-row static");
    const mc = m === "me" ? { name: "Phương Anh (bạn)" } : contactOf(m);
    const mid = el("span", "mid");
    mid.append(el("div", "nm", mc.name));
    row.append(m === "me" ? avatarMe() : avatar(m), mid);
    card.append(row);
  }
  return page(
    navBar(ctx, { title: "Thành viên", back: { label: "Nhóm", to: { app: "chat", id } } }),
    scroller(head, card),
  );
}

function avatarMe(): HTMLElement {
  const a = el("span", "ph-av", "P");
  a.style.background = "#2f7d57";
  return a;
}
