import type { AchTier } from "../../../content/ach";

export type BadgeState = "got" | "off" | "fail";

type Pal = { hi: string; mid: string; lo: string; rim: string; ink: string; rib: string; ribLo: string };

const PAL: Record<AchTier, Pal> = {
  dong: { hi: "#f0a870", mid: "#c9733a", lo: "#8f4a22", rim: "#5e2f12", ink: "#6e3718", rib: "#3f9a63", ribLo: "#276b43" },
  bac: { hi: "#ffffff", mid: "#c3ced6", lo: "#8794a0", rim: "#4d5a65", ink: "#56636e", rib: "#3aa0c4", ribLo: "#21728f" },
  vang: { hi: "#fff0a0", mid: "#f2b92a", lo: "#c4850a", rim: "#7a4d00", ink: "#8a5600", rib: "#e0402f", ribLo: "#a82619" },
  kc: { hi: "#ffffff", mid: "#8fe8ff", lo: "#2aa8e0", rim: "#0f5f94", ink: "#0f6aa0", rib: "#8fe8ff", ribLo: "#2aa8e0" },
};

let uid = 0;

const burst = (n: number, r1: number, r2: number, cx: number, cy: number) => {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI * i) / n - Math.PI / 2;
    const r = i % 2 ? r2 : r1;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
};

const LOAF = (c: string, slash: string) =>
  `<g transform="rotate(-28 32 30)"><ellipse cx="32" cy="30" rx="12" ry="6" fill="${c}"/><path d="M26 26.2l3 7.2M32 25.4l3 8.4M38 26.2l-0.5 6.6" stroke="${slash}" stroke-width="1.7" stroke-linecap="round"/></g>`;

function medal(t: AchTier, id: string, p: Pal) {
  const grad = `<linearGradient id="${id}f" x1="0.2" y1="0" x2="0.8" y2="1"><stop offset="0" stop-color="${p.hi}"/><stop offset=".55" stop-color="${p.mid}"/><stop offset="1" stop-color="${p.lo}"/></linearGradient>
<linearGradient id="${id}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.rib}"/><stop offset="1" stop-color="${p.ribLo}"/></linearGradient>
<linearGradient id="${id}e" x1="0.8" y1="0" x2="0.2" y2="1"><stop offset="0" stop-color="${p.lo}"/><stop offset="1" stop-color="${p.hi}"/></linearGradient>`;
  const ribbon = `<path d="M17 38 L10 70 L19 65 L24 72 L31 46Z" fill="url(#${id}r)" stroke="${p.rim}" stroke-width="1.4" stroke-linejoin="round"/>
<path d="M47 38 L54 70 L45 65 L40 72 L33 46Z" fill="url(#${id}r)" stroke="${p.rim}" stroke-width="1.4" stroke-linejoin="round"/>`;
  let body: string;
  if (t === "dong") {
    body = `<circle cx="32" cy="30" r="23" fill="url(#${id}e)" stroke="${p.rim}" stroke-width="2"/>
<circle cx="32" cy="30" r="18" fill="url(#${id}f)" stroke="${p.rim}" stroke-width="1.2"/>${LOAF(p.ink, p.hi)}`;
  } else if (t === "bac") {
    const beads = Array.from({ length: 16 }, (_, i) => {
      const a = (Math.PI * 2 * i) / 16;
      return `<circle cx="${(32 + 20.5 * Math.cos(a)).toFixed(1)}" cy="${(30 + 20.5 * Math.sin(a)).toFixed(1)}" r="1.5" fill="${p.rim}" opacity=".75"/>`;
    }).join("");
    body = `<circle cx="32" cy="30" r="24" fill="url(#${id}e)" stroke="${p.rim}" stroke-width="2.2"/>
<circle cx="32" cy="30" r="17" fill="url(#${id}f)" stroke="${p.rim}" stroke-width="1.2"/>${beads}${LOAF(p.ink, p.hi)}`;
  } else {
    body = `<polygon points="${burst(14, 26, 22, 32, 30)}" fill="url(#${id}e)" stroke="${p.rim}" stroke-width="2" stroke-linejoin="round"/>
<circle cx="32" cy="30" r="18" fill="url(#${id}f)" stroke="${p.rim}" stroke-width="1.4"/>
<circle cx="32" cy="30" r="14.5" fill="none" stroke="#fff6c0" stroke-width="1" opacity=".8"/>${LOAF(p.ink, p.hi)}
<path d="M24 13l1.3 3 3 1.3-3 1.3-1.3 3-1.3-3-3-1.3 3-1.3z" fill="#fff" opacity=".9"/>`;
  }
  const gloss = `<path d="M15 24a17 17 0 0113-11" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>`;
  return { defs: grad, art: ribbon + body + gloss };
}

function gem(id: string, p: Pal) {
  const defs = `<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="${p.mid}"/><stop offset="1" stop-color="${p.lo}"/></linearGradient>
<linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8fbff"/><stop offset="1" stop-color="${p.mid}"/></linearGradient>`;
  const art = `<path d="M16 8h32l14 17-30 42L2 25z" fill="url(#${id}g)" stroke="${p.rim}" stroke-width="2.4" stroke-linejoin="round"/>
<path d="M2 25h60M16 8l-7 17 23 42M48 8l7 17-23 42M24 25l8-17 8 17-8 42z" fill="none" stroke="${p.rim}" stroke-width="1.3" stroke-linejoin="round" opacity=".85"/>
<path d="M16 8l16 0-8 17zM48 8H32l8 17z" fill="url(#${id}h)" opacity=".9"/>
<path d="M9 25l7-17 8 17z" fill="#fff" opacity=".5"/>
<g class="spark"><path d="M54 6l1.6 3.6 3.6 1.6-3.6 1.6L54 16.4l-1.6-3.6-3.6-1.6 3.6-1.6z" fill="#fff" stroke="${p.lo}" stroke-width=".8"/></g>
<g class="spark s2"><path d="M8 40l1.2 2.6 2.6 1.2-2.6 1.2L8 47.6l-1.2-2.6-2.6-1.2 2.6-1.2z" fill="#fff" stroke="${p.lo}" stroke-width=".8"/></g>`;
  return { defs, art };
}

function silhouette(t: AchTier) {
  const sh = "#d9d4c6";
  const ln = "#a39e90";
  if (t === "kc") {
    return `<path d="M16 8h32l14 17-30 42L2 25z" fill="${sh}" stroke="${ln}" stroke-width="2.2" stroke-dasharray="4 3" stroke-linejoin="round"/><path d="M2 25h60M24 25l8-17 8 17" fill="none" stroke="${ln}" stroke-width="1.2" opacity=".7"/>`;
  }
  const edge = t === "vang" ? `<polygon points="${burst(14, 26, 22, 32, 30)}" fill="${sh}" stroke="${ln}" stroke-width="2" stroke-dasharray="4 3" stroke-linejoin="round"/>`
    : `<circle cx="32" cy="30" r="${t === "bac" ? 24 : 23}" fill="${sh}" stroke="${ln}" stroke-width="2" stroke-dasharray="4 3"/>`;
  return `<path d="M17 38L10 70l9-5 5 7 7-26zM47 38l7 32-9-5-5 7-7-26z" fill="${sh}" opacity=".7"/>${edge}<circle cx="32" cy="30" r="15" fill="none" stroke="${ln}" stroke-width="1.2" opacity=".6"/>`;
}

/** Huy hiệu hạng `t`; `size` là chiều rộng. */
export function badgeSvg(t: AchTier, state: BadgeState, size = 56): string {
  const id = `ab${uid++}`;
  const vb = t === "kc" ? "0 0 64 70" : "0 0 64 74";
  const h = Math.round(size * (t === "kc" ? 70 : 74) / 64);
  let inner: string;
  if (state === "off") inner = silhouette(t);
  else {
    const { defs, art } = t === "kc" ? gem(id, PAL.kc) : medal(t, id, PAL[t]);
    inner = `<defs>${defs}</defs>${art}`;
  }
  const mark = state === "fail"
    ? `<g class="fmark"><circle cx="54" cy="12" r="9" fill="#6b7a88" stroke="#fff" stroke-width="1.8"/><path d="M50.6 8.6l6.8 6.8M57.4 8.6l-6.8 6.8" stroke="#fff" stroke-width="2.1" stroke-linecap="round"/></g>`
    : "";
  return `<svg class="ab ab-${t} ${state}" width="${size}" height="${h}" viewBox="${vb}" fill="none" aria-hidden="true">${inner}${mark}</svg>`;
}
