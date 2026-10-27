import { WEEKDAY_VI, weekdayIdx } from "../../../sim/econ";
import { NOTE_MAX, addNote, deleteNote, editNote, type Note } from "../../../sim/phone";
import type { LedgerRow } from "../../../core/save";
import { isTouch } from "../../../core/device";
import { navBar, page, scroller, type AppCtx } from "../ctx";
import { ICON, btn, el, money } from "../dom";

type Entry = { key: string; day: number; title: string; snippet: string; open: () => void };

const dateLabel = (today: number, day: number) =>
  day >= today ? "Hôm nay" : day === today - 1 ? "Hôm qua" : `Ngày ${day}`;

function dayTitle(day: number) {
  return `Ngày ${day} · ${WEEKDAY_VI[weekdayIdx(day)]}`;
}

function dayLine(r: LedgerRow) {
  const p = r.revenue - r.cost;
  return `${p >= 0 ? "Lời" : "Lỗ"} ${money(Math.abs(p))} · bán ${r.served} ổ${r.sick ? ` · ${r.sick} đau bụng` : ""}`;
}

export function noteList(ctx: AppCtx) {
  const { w } = ctx;
  const today = w.progress.dayIndex;
  const entries: Entry[] = [
    ...w.phone.notes.map((n): Entry => {
      const [first, ...rest] = n.text.split("\n");
      return { key: n.id, day: n.day, title: first, snippet: rest.join(" ").trim(), open: () => ctx.go({ app: "edit", id: n.id }) };
    }),
    ...w.ledger.map((r): Entry => ({
      key: `d${r.day}`, day: r.day, title: dayTitle(r.day), snippet: dayLine(r),
      open: () => ctx.go({ app: "day", day: r.day }),
    })),
  ].sort((a, b) => b.day - a.day || (a.key[0] === "n" ? -1 : 1));

  const compose = btn("ph-btn-text", "", () => ctx.go({ app: "edit" }), "Note mới");
  compose.innerHTML = ICON.compose;

  const body = el("div");
  if (!entries.length) body.append(el("div", "ph-blank", "Chưa có ghi chú"));
  else {
    const card = el("div", "ph-card");
    for (const e of entries) {
      const row = btn("ph-row note", "", e.open);
      const mid = el("span", "mid");
      mid.append(el("div", "nm", e.title));
      const sub = el("div", "pv");
      sub.append(el("b", "", dateLabel(today, e.day)), document.createTextNode(e.snippet ? `  ${e.snippet}` : ""));
      mid.append(sub);
      row.append(mid);
      card.append(row);
    }
    body.append(card);
  }
  return page(
    navBar(ctx, { title: "Note", shortOnly: true, back: { label: "Màn chính", to: { app: "home" } }, right: compose }),
    el("div", "ph-title-l", "Note"),
    scroller(body),
  );
}

export function dayNote(ctx: AppCtx, day: number) {
  const r = ctx.w.ledger.find((x) => x.day === day);
  const doc = el("article", "ph-doc");
  doc.append(el("h2", "", dayTitle(day)));
  if (r) {
    const p = r.revenue - r.cost;
    const lines = [
      `Khách ghé ${r.served + r.lost}, bán ${r.served} ổ${r.lost ? `, ${r.lost} người bỏ đi` : ""}.`,
      ...(r.sick ? [`${r.sick} khách đau bụng sau khi ăn.`] : []),
      `Thu ${money(r.revenue)}, chi ${money(r.cost)}.`,
      p >= 0 ? `Lời ${money(p)}.` : `Lỗ ${money(-p)}.`,
    ];
    for (const l of lines) doc.append(el("p", "", l));
  }
  return page(navBar(ctx, { back: { label: "Note", to: { app: "note" } } }), scroller(doc));
}

export function noteEditor(ctx: AppCtx, id?: string) {
  const { w } = ctx;
  let cur: Note | undefined = id ? w.phone.notes.find((n) => n.id === id) : undefined;
  const ta = el("textarea");
  ta.maxLength = NOTE_MAX;
  ta.value = cur?.text ?? "";
  ta.setAttribute("aria-label", "Nội dung ghi chú");
  const commit = () => {
    if (cur) editNote(w, cur.id, ta.value);
    else if (ta.value.trim()) cur = addNote(w, ta.value) ?? undefined;
    ctx.host.onSave();
  };
  let t = 0;
  ta.oninput = () => { clearTimeout(t); t = window.setTimeout(commit, 400); };
  const leave = () => { clearTimeout(t); commit(); ctx.go({ app: "note" }, "l"); };

  const del = btn("ph-btn-text muted", "", () => {
    if (!cur) { leave(); return; }
    if (del.dataset.arm !== "1") {
      del.dataset.arm = "1";
      del.classList.add("armed");
      window.setTimeout(() => { del.dataset.arm = ""; del.classList.remove("armed"); }, 2500);
      return;
    }
    clearTimeout(t);
    deleteNote(w, cur.id);
    ctx.host.onSave();
    ctx.go({ app: "note" }, "l");
  }, "Xoá ghi chú");
  del.innerHTML = ICON.trash;
  const done = btn("ph-btn-text", "Xong", leave);
  const right = el("div");
  right.style.display = "flex";
  right.append(del, done);

  const ed = el("div", "ph-editor");
  ed.append(ta);
  if (!isTouch()) queueMicrotask(() => { if (!cur) ta.focus({ preventScroll: true }); });
  const nav = navBar(ctx, { back: { label: "Note", to: { app: "note" } }, right });
  (nav.querySelector(".ph-btn-text") as HTMLElement).onclick = leave;
  return page(nav, ed);
}
