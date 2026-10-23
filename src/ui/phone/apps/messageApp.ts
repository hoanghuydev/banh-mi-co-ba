import { MEMBERS, contactOf } from "../../../content/phone/contacts";
import { markRead, pendingEvent, reply, sortedThreads, unreadOf, type Thread } from "../../../sim/phone";
import { sfx } from "../../../audio/sfx";
import { avatar, bubbleNodes } from "../chat";
import { navBar, page, scroller, type AppCtx } from "../ctx";
import { btn, el } from "../dom";

export function messageList(ctx: AppCtx): HTMLElement {
  const list = el("div", "ph-list");
  const threads = sortedThreads(ctx.w.phone);
  if (!threads.length) list.append(el("div", "ph-blank", "Chưa có tin nhắn"));
  for (const t of threads) list.append(threadRow(ctx, t));
  return page(
    navBar(ctx, { back: { label: "Màn chính", to: { app: "home" } } }),
    el("div", "ph-title-l", "Message"),
    scroller(list),
  );
}

function threadRow(ctx: AppCtx, t: Thread) {
  const c = contactOf(t.id);
  const last = t.msgs[t.msgs.length - 1];
  const un = unreadOf(t);
  const row = btn(`ph-row${un || t.pending ? " unread" : ""}`, "", () => ctx.go({ app: "chat", id: t.id }));
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
  msgs.forEach((m, i) => body.append(...bubbleNodes(m, msgs[i - 1], !!c.group, msgs[i + 1])));
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
  return page(nav, sc, dock);
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
