export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K, cls = "", text = "",
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

export function btn(cls: string, text: string, onClick: () => void, label?: string): HTMLButtonElement {
  const b = el("button", cls, text);
  b.type = "button";
  if (label) b.setAttribute("aria-label", label);
  b.onclick = onClick;
  return b;
}

export const svg = (inner: string, size = 24, vb = 24) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 ${vb} ${vb}" fill="none" aria-hidden="true">${inner}</svg>`;

export const ICON = {
  back: svg('<path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>', 22),
  chev: svg('<path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>', 16),
  plus: svg('<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>', 24),
  compose: svg('<path d="M4 20h4L19 9a2.1 2.1 0 00-3-3L5 17z M14 8l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', 24),
  trash: svg('<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', 22),
  msg: svg('<path d="M5 6h14a2 2 0 012 2v7a2 2 0 01-2 2h-7l-4 3.5V17H5a2 2 0 01-2-2V8a2 2 0 012-2z" fill="#fff"/>', 38),
  star: svg('<path d="M12 3l2.7 5.8 6.3.8-4.6 4.3 1.2 6.3L12 17l-5.6 3.2 1.2-6.3L3 9.6l6.3-.8z" fill="#fff"/>', 38),
  note: svg('<rect x="5" y="3.5" width="14" height="17" rx="2.5" fill="#fff"/><path d="M8.5 9h7M8.5 12.5h7M8.5 16h4" stroke="#c98a1d" stroke-width="1.7" stroke-linecap="round"/>', 38),
  sys: svg('<g stroke="#19e3ff" stroke-width="1.6" stroke-linecap="round"><path d="M8 3v3M12 3v3M16 3v3M8 18v3M12 18v3M16 18v3M3 8h3M3 12h3M3 16h3M18 8h3M18 12h3M18 16h3"/><rect x="6" y="6" width="12" height="12" rx="1.5" fill="#06222c"/><rect x="9.5" y="9.5" width="5" height="5" fill="#39ff9c" stroke="none"/><path d="M6 12h3.5M14.5 12H18M12 6v3.5M12 14.5V18" stroke-width="1"/></g>', 40),
  bag: svg('<path d="M6 8h12l1 12H5z" fill="#fff"/><path d="M9 8V7a3 3 0 016 0v1" stroke="#fff" stroke-width="2" stroke-linecap="round"/>', 38),
  tag: svg('<path d="M3 12V4h8l10 10-8 8z" fill="#fff"/><circle cx="7.5" cy="8.5" r="1.6" fill="#2189a8"/>', 38),
  bagLine: svg('<path d="M6 8h12l1 12H5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 8V7a3 3 0 016 0v1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>', 24),
  cart: svg('<path d="M3 4h3l2 11h10l2-8H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="19" r="1.6" fill="currentColor"/><circle cx="17" cy="19" r="1.6" fill="currentColor"/>', 24),
  box: svg('<path d="M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>', 24),
  cartBig: svg('<path d="M3 4h3l2 11h10l2-8H7" stroke="#9aa3aa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="19" r="1.4" fill="#9aa3aa"/><circle cx="17" cy="19" r="1.4" fill="#9aa3aa"/>', 64),
  boxBig: svg('<path d="M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10" stroke="#9aa3aa" stroke-width="1.5" stroke-linejoin="round"/>', 64),
  tool: svg('<path d="M14.5 4a4.5 4.5 0 00-4.2 6.1L4 16.4 7.6 20l6.3-6.3A4.5 4.5 0 0020 9.5l-3 3-2.5-.5-.5-2.5 3-3A4.5 4.5 0 0014.5 4z" fill="#fff"/>', 36),
  file: svg('<path d="M6 3h8l4 4v14H6z" fill="#fff"/>', 20),
};

export function starRow(score: number, size = 30): string {
  const star = (fill: string) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.7 5.8 6.3.8-4.6 4.3 1.2 6.3L12 17l-5.6 3.2 1.2-6.3L3 9.6l6.3-.8z" fill="${fill}" stroke="#d9a21b" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
  return Array.from({ length: 5 }, (_, i) => star(score >= i + 0.75 ? "#f5b82e" : "#fff7dd")).join("");
}

export const money = (d: number) => `${d.toLocaleString("vi-VN")}₫`;
export const signed = (d: number) => `${d < 0 ? "−" : "+"}${money(Math.abs(d))}`;
