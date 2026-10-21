/** npx tsx tools/read-talks.ts [KHO] [--all] — in trọn một cuộc trò chuyện dưới dạng kịch bản đọc được. */
import { TalkStore } from "../src/content/talks";
import { MAX_DEPTH, needKeys, type Talk, type TalkNode } from "../src/sim/talk";

const WHO: Record<string, [string, string, string, string]> = {
  // call · me · self · you  — lấy một vai cụ thể cho dễ đọc
  QUA_DUONG: ["cô", "con", "tui", "con"],
  WALKIN: ["anh", "em", "tui", "em"],
  ANY: ["cô", "con", "tui", "con"],
};

function fill(s: string, npc: string): string {
  const a = WHO[npc] ?? ["chú", "con", "tui", "con"];
  return s
    .replace(/\{call\}/g, a[0]).replace(/\{me\}/g, a[1])
    .replace(/\{self\}/g, a[2]).replace(/\{you\}/g, a[3])
    .replace(/\{gia\d*\}/g, "hai mươi lăm ngàn").replace(/\{gio\}/g, "bảy giờ")
    .replace(/\{m\.what\}/g, "chuyện bữa trước").replace(/\{p\.\w+\}/g, "…");
}

function gates(n: TalkNode): string {
  const g = [...needKeys(n).map((k) => k), ...(n.while ?? []).map((k) => `~${k}`)];
  if (n.needEquip) g.push(`@${n.needEquip}`);
  if (n.needCash) g.push(`$${n.needCash}`);
  const a = n.act as { kind: string } | undefined;
  if (a) g.push(`»${a.kind}`);
  return g.length ? `   ⟨${g.join(" ")}⟩` : "";
}

function render(t: Talk, npc: string) {
  const w = t.when ? ` · ${JSON.stringify(t.when)}` : "";
  console.log(`\n┌─ ${t.id}  [${t.source} · ${t.depth}]${w}`);
  if (t.opener) console.log(`│  HỌ: “${fill(t.opener, npc)}”`);
  const go = (ns: readonly TalkNode[], pad: string, depth: number) => {
    if (depth > MAX_DEPTH) return;
    for (const n of ns) {
      console.log(`${pad}• ${n.tone.padEnd(6)} “${fill(n.say, npc)}”${gates(n)}`);
      if (n.reply) console.log(`${pad}      ↳ “${fill(n.reply, npc)}”`);
      else if (n.silent) console.log(`${pad}      ↳ (im lặng)`);
      const a = n.act as { kind: string; yes?: string; no?: string } | undefined;
      if (a?.kind === "INVITE") {
        console.log(`${pad}      ↳ ghé  : “${fill(a.yes ?? "", npc)}”`);
        console.log(`${pad}      ↳ đi   : “${fill(a.no ?? "", npc)}”`);
      }
      const kids = n.then?.length ? n.then : n.ref ? t.shared?.[n.ref] : null;
      if (kids) go(kids, pad + "    ", depth + 1);
    }
  };
  go(t.tree, "│  ", 1);
  for (const [k, v] of Object.entries(t.shared ?? {})) {
    console.log(`│  ── shared.${k} ──`);
    go(v, "│  ", 1);
  }
}

const all: Talk[] = await TalkStore.loadAll();
const want = process.argv[2];
const pools = want && want !== "--all" ? [want] : [...new Set(all.map((t) => t.npc))];
for (const p of pools) {
  console.log(`\n╔══════════ ${p} ══════════`);
  for (const t of all.filter((x) => x.npc === p)) render(t, p);
}
