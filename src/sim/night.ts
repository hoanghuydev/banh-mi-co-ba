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
import { nightly } from "./memory";
import { gossipTick, newGossipState } from "./gossip";
import { checkHypotheses, composeEvening, landmarkTier, newNotebook } from "./notebook";
import { makeUsual } from "./order";
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
  });
  for (const e of sent) {
    bus?.emit("gossip:propagated", { from: e.from, to: e.to, factId: e.claim, hop: e.hops, confidence: 0, mutatedTo: e.mutated ? e.claim : undefined });
  }
  for (const npc of NPCS) {
    const s = (w.npcs[npc.id] ??= newNpcState());
    const r = nightly(s, npc.personality, day);
    for (const id of r.promoted) bus?.emit("memory:promoted", { npcId: npc.id, memoryId: id });
    if (r.from !== r.to) bus?.emit("relationship:tierChanged", { npcId: npc.id, from: r.from, to: r.to });
  }

  // P2-05 — tick mực đỏ cho giả thuyết đúng VÀ đã chứng minh hôm nay, rồi trang của cô Ba
  const nb = (w.notebook ??= newNotebook());
  const confirmations = checkHypotheses(nb, day, (id) => makeUsual(Rng.forSeason(w.saveId, id)).levels);
  composeEvening(nb, {
    day, lastDay: day >= SEASON_DAYS, weather: w.progress.weather,
    absences: nb.met.map((id) => ({ npcId: id, missed: w.npcs[id]?.gone ? 0 : w.npcs[id]?.missStreak ?? 0 })).filter((a) => a.missed >= 2),
    landmark: landmarkTier(w.gossip, nb.today.strangers, w.npcs.BA_SAU?.tier === "FRIEND"),
    confirmations, bags: w.shuffleBags, rng: Rng.forSeason(w.saveId, `note:${day}`), spokenOnce: w.dialogState.spokenOnce,
  });
}
