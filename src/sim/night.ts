/**
 * Ban đêm — P0-01 §2.3 / P2-03. Chạy ĐÚNG MỘT LẦN mỗi tối, sau buổi bán, trước khi sang
 * ngày mới: promote trí nhớ, decay theo lần ghé bị lỡ, dò đốt NPC, đổi bucket.
 * (Tick đồn thổi của P2-04 cắm vào cùng chỗ này, trước `settle` trí nhớ.)
 *
 * Cả EveningScene lẫn headless (`nextDay`) gọi hàm này, nên sim chạy 40 ngày trong Node
 * ra đúng cái người chơi thấy. Không tiêu RNG.
 */
import { NPCS } from "../content/npcs";
import type { Bus } from "../core/eventbus";
import { newNpcState, type SaveFile } from "../core/save";
import { nightly, record } from "./memory";
import { gossipTick, newGossipState, witness } from "./gossip";
import { checkHypotheses, composeEvening, landmarkTier, newNotebook } from "./notebook";
import { makeUsual } from "./order";
import { STANDS } from "./stands";
import { daySpec, gossipOpen } from "./season";
import { arcCtx, endOfDay, eveningNoteOverride, newStoryState, storyOverhear } from "./story";
import { usualOf as authoredUsual } from "../content/arcs";
import { Rng } from "../core/rng";
import { SEASON_DAYS } from "../core/save";

const SETTLED = "settledDay";

export function settleNight(w: SaveFile, bus?: Bus) {
  const day = w.progress.dayIndex;
  // vào lại cảnh tối sau reload không được settle hai lần (decay hai lần = phạt oan)
  if (w.flags[SETTLED] === day) return;
  w.flags[SETTLED] = day;
  // P2-04 trước — đồn thổi đọc trí nhớ của NGÀY HÔM NAY, rồi trí nhớ mới promote/decay
  w.gossip ??= newGossipState();
  const sent = gossipTick(w.gossip, {
    saveId: w.saveId, day, allowFalseMemory: w.a11y.allowFalseMemory ?? true,
    present: (id) => w.npcs[id]?.lastSeenDay === day,
    // ghế ngồi (P3-04 D1) và chỗ đông người nói chuyện (cổng trường ×2,4, chợ ×1,7 — P3-05) → chuyện lan nhanh hơn
    extraTransmissions: (w.equipment?.owned.includes("GHE_BAN") ? 1 : 0) + (STANDS[w.econ?.stand ?? "L1"].gossip >= 1.5 ? 1 : 0),
    // P4-02 §2.3: cảnh của đêm nay diễn sáng mai — mở khi SÁNG MAI đã là ngày 9 (hoặc đã ≥ 90 phút chơi)
    open: gossipOpen(day + 1, w.telemetry?.totalPlayMs ?? 0),
    willMul: (teller, valence) => (teller === "CHU_KIET" && valence < 0 && w.story?.flags.kietTalked ? 0.15 / 0.45 : 1),
  });
  // P4-03 — cảnh nghe lỏm có kịch bản của sáng mai (SK-24 bảng hiệu, thước đo tiến trình, tin đo đạc)
  const sp = w.story ? storyOverhear(day + 1) : null;
  if (sp) w.gossip.overhear = { day: day + 1, a: sp.a, b: sp.b, claim: sp.id, source: null, lines: sp.lines, hiddenA: sp.lines[0] };
  if (w.story) endOfDay(w.story, day);
  for (const e of sent) {
    bus?.emit("gossip:propagated", { from: e.from, to: e.to, factId: e.claim, hop: e.hops, confidence: 0, mutatedTo: e.mutated ? e.claim : undefined });
  }
  // P3-01 §2.7 ăn gian (l) — dẹp hàng sớm: người có lịch ghé SAU giờ dẹp tới mà không có gì.
  // Không có sự kiện thứ 12: là MADE_THEM_WAIT lý do CLOSED_EARLY (70, nặng hơn khi quen lâu).
  const closedAt = w.econ?.today.closedAtMin ?? null;
  if (closedAt !== null) {
    for (const npc of NPCS) {
      const s = w.npcs[npc.id];
      if (!s || s.expectedDay !== day || s.lastServedDay === day || s.absentUntil >= day) continue;
      if ((s.expectedAt ?? 0) < closedAt) continue;
      const streak = Math.min(s.visits, 20);
      record(s, npc.personality, "MADE_THEM_WAIT", Math.min(100, 70 * (1 + (0.5 * streak) / 10)), day);
      witness(w.gossip, npc.id, "MADE_THEM_WAIT", 70, day);
    }
  }

  for (const npc of NPCS) {
    const s = (w.npcs[npc.id] ??= newNpcState());
    const r = nightly(s, npc.personality, day);
    for (const id of r.promoted) bus?.emit("memory:promoted", { npcId: npc.id, memoryId: id });
    if (r.from !== r.to) bus?.emit("relationship:tierChanged", { npcId: npc.id, from: r.from, to: r.to });
  }

  // P2-05 — tick mực đỏ cho giả thuyết đúng VÀ đã chứng minh hôm nay, rồi trang của cô Ba
  const nb = (w.notebook ??= newNotebook());
  const story = w.story ?? newStoryState();
  const actx = arcCtx(story, day, { rain: false, owns: () => false, hasWrongName: () => false });
  const confirmations = checkHypotheses(nb, day, (id) => (authoredUsual(id, actx) ?? makeUsual(Rng.forSeason(w.saveId, id))).levels);
  composeEvening(nb, {
    day, lastDay: day >= SEASON_DAYS, weather: w.progress.weather,
    absences: nb.met.map((id) => ({ npcId: id, missed: w.npcs[id]?.gone ? 0 : w.npcs[id]?.missStreak ?? 0 })).filter((a) => a.missed >= 2),
    landmark: landmarkTier(w.gossip, nb.today.strangers, w.npcs.BA_SAU?.tier === "FRIEND"),
    confirmations, bags: w.shuffleBags, rng: Rng.forSeason(w.saveId, `note:${day}`), spokenOnce: w.dialogState.spokenOnce,
  });
  // P4-02 §2.5 phanh #2: tối hôm có người không tới, cô Ba ghi 2–3 dòng — KHÔNG phán đúng sai
  const override = eveningNoteOverride(day, story, daySpec(day).notebookLine);
  const note = nb.eveningNotes.find((n) => n.day === day);
  if (override && note) note.lines = override.split("\n");
}
