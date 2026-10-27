/**
 * Cầu nối rule DB ↔ trò chơi — P2-01 §2.5–§2.8. Service dựng query, Speaker chọn rule,
 * rút MỘT câu trong `say` bằng shuffle-bag theo (rule, người), và giữ hai loại trí nhớ
 * ngắn của rule DB: `applycontext` (ContextStore) và đã-nói (SpokenState).
 *
 * Trạng thái sống thẳng trong `world.dialogState` + `world.shuffleBags` — Service gọi
 * `sync(now)` trước mỗi lần autosave (npc:left) nên reload giữa buổi không mất gì.
 *
 * Không import Phaser.
 */
import GENERIC from "../content/rules/generic.json";
import BA_BAY from "../content/rules/ba-bay.json";
import CHU_TU from "../content/rules/chu-tu.json";
import ANH_DUNG from "../content/rules/anh-dung.json";
import CHI_LAN from "../content/rules/chi-lan.json";
import BE_SU from "../content/rules/be-su.json";
import ONG_HAI from "../content/rules/ong-hai.json";
import CO_MAI from "../content/rules/co-mai.json";
import THAY_PHUC from "../content/rules/thay-phuc.json";
import CHI_HANH from "../content/rules/chi-hanh.json";
import ANH_BAO from "../content/rules/anh-bao.json";
import BA_SAU from "../content/rules/ba-sau.json";
import CHU_KIET from "../content/rules/chu-kiet.json";
import { ShuffleBag, type BagState, type Rng } from "../core/rng";
import type { SaveFile } from "../core/save";
import { ContextStore } from "./context";
import { Query } from "./facts";
import { RuleDb, compileRules, tierOfScore, type Rule, type RuleJson, type SpokenState } from "./ruledb";

/** Mọi file rule — thêm NPC là thêm một dòng ở đây (Node/tsx không có import.meta.glob). */
export const RULE_FILES: Record<string, { rules: RuleJson[] }> = {
  "generic": GENERIC as unknown as { rules: RuleJson[] },
  "ba-bay": BA_BAY as unknown as { rules: RuleJson[] },
  "chu-tu": CHU_TU as unknown as { rules: RuleJson[] },
  "anh-dung": ANH_DUNG as unknown as { rules: RuleJson[] },
  "chi-lan": CHI_LAN as unknown as { rules: RuleJson[] },
  "be-su": BE_SU as unknown as { rules: RuleJson[] },
  "ong-hai": ONG_HAI as unknown as { rules: RuleJson[] },
  "co-mai": CO_MAI as unknown as { rules: RuleJson[] },
  "thay-phuc": THAY_PHUC as unknown as { rules: RuleJson[] },
  "chi-hanh": CHI_HANH as unknown as { rules: RuleJson[] },
  "anh-bao": ANH_BAO as unknown as { rules: RuleJson[] },
  "ba-sau": BA_SAU as unknown as { rules: RuleJson[] },
  "chu-kiet": CHU_KIET as unknown as { rules: RuleJson[] },
};

let shared: RuleDb | null = null;
/** Rule DB biên dịch một lần cho cả tiến trình — content là bất biến lúc chạy. */
export function ruleDb(): RuleDb {
  return (shared ??= new RuleDb(compileRules(Object.values(RULE_FILES).flatMap((f) => f.rules))));
}

export type DialogState = SaveFile["dialogState"];
export const newDialogState = (): DialogState => ({ spokenOnce: [], norepeat: {}, appliedContext: [], barkCooldowns: {} });

export type Picked = { rule: Rule; text: string; tier: 1 | 2 | 3 };

const ADDRESS_SLOTS = new Set(["self", "you", "call", "me"]);

export class Speaker {
  readonly db = ruleDb();
  readonly ctx: ContextStore;
  readonly st: SpokenState;
  private live = new Map<string, ShuffleBag>();
  /** Query cuối cùng được hỏi — overlay dev / `rule.why` đọc. */
  last: { concept: string; npc: string; q: Query; picked: string | null; now: number } | null = null;

  constructor(
    private rng: Rng,
    private bags: Record<string, BagState>,
    private day: number,
    private state: DialogState = newDialogState(),
    now = 0,
  ) {
    this.ctx = new ContextStore(day, state.appliedContext, now);
    this.st = { once: new Set(state.spokenOnce), norepeat: { ...state.norepeat }, lastAt: new Map(), day };
  }

  /** Chọn rule + rút câu. Chưa ghi nhận là đã nói — gọi `spoken()` khi câu thật sự ra miệng. */
  pick(concept: string, npcKey: string, q: Query, now: number, vars: Record<string, string> = {}): Picked | null {
    this.ctx.write(q, npcKey, now);
    const rule = this.db.select(concept, q, this.st, now, this.rng);
    this.last = { concept, npc: npcKey, q, picked: rule?.idName ?? null, now };
    if (!rule) return null;
    if (rule.silent) return { rule, text: "", tier: tierOfScore(rule.score) };
    const id = `rule:${rule.idName}:${npcKey}`;
    let bag = this.live.get(id);
    if (!bag) this.live.set(id, (bag = new ShuffleBag(rule.say.length, this.bags[id])));
    const i = bag.draw(this.rng, this.day);
    this.bags[id] = bag.toJSON();
    // Xưng hô để nguyên cho `Service.fill` điền theo người nói.
    const text = rule.say[i].replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? (ADDRESS_SLOTS.has(k) ? m : ""));
    return { rule, text, tier: tierOfScore(rule.score) };
  }

  /** Câu đã ra miệng: đánh dấu đã nói + ghi `applycontext` lên người nói. */
  spoken(rule: Rule, npcKey: string, now: number) {
    this.db.markSpoken(rule, this.st, now);
    for (const a of rule.applycontext) this.ctx.apply(npcKey, a.name, a.value, a.durationSec, now);
    this.sync(now);
  }

  /** Ghi ngược vào save. */
  sync(now: number) {
    this.state.spokenOnce = [...this.st.once];
    this.state.norepeat = { ...this.st.norepeat };
    this.state.appliedContext = this.ctx.toJSON(now);
  }

  /** Ghi thẳng một ctx fact từ phía trò chơi (vd. "khách mới tới" cắt chuỗi độc thoại). */
  apply(npcKey: string, fact: string, value: number, durationSec: number, now: number) {
    this.ctx.apply(npcKey, fact, value, durationSec, now);
  }
}
