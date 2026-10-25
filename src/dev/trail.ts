// Vết dò tạm để tìm bước làm Safari iOS văng tab: ghi bước cuối vào localStorage, lần mở sau hiện lại.
const KEY = "dev-trail";
let box: HTMLDivElement | null = null;
let step = "";

function stats(): string {
  const g = (window as any).__game;
  if (!g) return "";
  let n = 0, px = 0;
  for (const k in g.textures.list) {
    const t = g.textures.list[k];
    for (const s of t.source) { n++; px += (s.width || 0) * (s.height || 0); }
  }
  return `tex ${n} · ${Math.round(px * 4 / 1048576)}MB`;
}

function paint(text: string) {
  if (!box) {
    box = document.createElement("div");
    box.style.cssText = "position:fixed;left:4px;top:4px;z-index:99999;font:11px monospace;color:#fff;background:rgba(0,0,0,.75);padding:3px 6px;pointer-events:none;white-space:pre";
    document.body.appendChild(box);
  }
  box.textContent = text;
}

// Safari tự tải lại sau khi văng nên giữ vết của vài lần mở gần nhất.
const prev: string[] = (() => {
  try {
    const list = JSON.parse(localStorage.getItem(KEY + "-old") ?? "[]") as string[];
    const cur = localStorage.getItem(KEY);
    if (cur) list.unshift(cur);
    list.length = Math.min(list.length, 4);
    localStorage.setItem(KEY + "-old", JSON.stringify(list));
    return list;
  } catch { return []; }
})();

const t0 = performance.now();

function write() {
  const line = `${Math.round((performance.now() - t0) / 1000)}s · ${step} · ${stats()}`;
  try { localStorage.setItem(KEY, line); } catch {}
  paint([...prev.map((p, i) => `lần -${i + 1}: ${p}`), `nay: ${line}`].join("\n"));
}

export function trail(label: string) {
  step = label;
  write();
}

setInterval(write, 2000);
trail("mở trang");
