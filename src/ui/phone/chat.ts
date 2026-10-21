import { ME, contactOf } from "../../content/phone/contacts";
import type { Msg } from "../../sim/phone";
import { el } from "./dom";

export function avatar(id: string, sm = false): HTMLElement {
  const c = contactOf(id);
  const a = el("span", `ph-av${sm ? " sm" : ""}`, c.initial);
  a.style.background = c.tint;
  a.setAttribute("aria-hidden", "true");
  return a;
}

/** Dựng một bong bóng; `prev` quyết định có hiện nhãn giờ / tên người gửi / avatar hay không. */
export function bubbleNodes(m: Msg, prev: Msg | undefined, group: boolean, next: Msg | undefined): HTMLElement[] {
  const out: HTMLElement[] = [];
  if (!prev || prev.at !== m.at) out.push(el("div", "ph-time", m.at));
  const mine = m.from === ME;
  const firstOfRun = !prev || prev.from !== m.from || prev.at !== m.at;
  const lastOfRun = !next || next.from !== m.from || next.at !== m.at;
  if (group && !mine && firstOfRun) {
    const w = el("div", "ph-who", contactOf(m.from).name);
    w.style.color = contactOf(m.from).tint;
    out.push(w);
  }
  const line = el("div", `ph-line${mine ? " me" : ""}`);
  if (!mine && group) line.append(lastOfRun ? avatar(m.from, true) : el("span", "sp"));
  const b = el("div", "ph-b");
  if (m.attach) {
    b.classList.add("ph-file");
    const fi = el("span", "fi", "PDF");
    const fn = el("span", "fn", m.attach);
    b.append(fi, fn);
  } else {
    b.textContent = m.text;
  }
  line.append(b);
  out.push(line);
  return out;
}

export function typingDots(mine: boolean): HTMLElement {
  const t = el("div", `ph-typing${mine ? "" : " l"}`);
  t.setAttribute("aria-label", "đang gõ");
  t.append(el("i"), el("i"), el("i"));
  return t;
}

