/**
 * Debug overlay + console dev — P0-03 §2.2. CHỈ ở dev build.
 *
 * `main.ts` chỉ import file này sau `if (DEV_TOOLS)` → bản phát hành không có dòng nào.
 * ⚠️ Không bao giờ có chế độ "hiện certainty" trong bản bán ra: T5 đòi attention nhìn
 * thấy được QUA MẶT NGƯỜI, không phải qua một thanh số.
 *
 *   F1 bật/tắt · F2 Perception · F3 Thoại
 *   F6 Đồng hồ & RNG · F7 Perf · F8 Kinh tế · ~ console lệnh · ?debug=1 bật sẵn
 */
import { MOOD_CAUSES, moodBaseFace, moodOf, type MoodCause } from "../sim/mood";
import { NEUTRAL } from "../sim/reaction";
import type Phaser from "phaser";
import { bus, type EventKey } from "../core/eventbus";
import { fmtHhmm } from "../core/clock";
import { telemetry } from "../core/session";
import { factorsOf, stateOf } from "../sim/perception";
import { FRAME_STEPS, frameStats } from "../sim/frame";
import type { StallZone, Weather } from "../core/types";
import { CAL } from "../sim/econ";
import { dev } from "./registry";
import type { DayScene } from "../scenes/DayScene";

type PanelId = "perception" | "dialog" | "clock" | "perf" | "econ";
const KEYS: Record<string, PanelId> = {
  F2: "perception", F3: "dialog", F6: "clock", F7: "perf", F8: "econ",
};
const TITLE: Record<PanelId, string> = {
  perception: "P1 · Perception", dialog: "P2 · Thoại / rule query",
  clock: "P5 · Đồng hồ & RNG", perf: "P6 · Perf", econ: "P7 · Kinh tế",
};

const SS_KEY = "byesep.dev.overlay";

const DIALOG_EVENTS: readonly EventKey[] = ["bark:queued", "dialog:spoken", "dialog:silent"];

export function installDevTools(game: Phaser.Game) {
  const state = loadState();
  if (new URLSearchParams(location.search).get("debug") === "1") state.visible = true;

  const root = document.createElement("div");
  root.id = "dev-overlay";
  root.style.cssText = [
    "position:fixed", "top:8px", "left:8px", "z-index:9999", "max-width:560px", "max-height:calc(100vh - 16px)",
    "overflow:auto", "background:rgba(10,12,14,.85)", "color:#d8e4ea", "font:11px/1.45 ui-monospace,Consolas,monospace",
    "padding:8px 10px", "border-radius:6px", "white-space:pre", "pointer-events:none",
  ].join(";");
  document.body.appendChild(root);

  const input = document.createElement("input");
  input.placeholder = "dev lệnh — vd. day.skipTo(\"08:15\")   (Enter chạy · Esc đóng)";
  input.style.cssText = "position:fixed;left:8px;right:8px;bottom:8px;z-index:10000;display:none;"
    + "font:12px ui-monospace,Consolas,monospace;padding:6px 8px;background:#0d1114;color:#e8f0f3;border:1px solid #445;border-radius:4px";
  document.body.appendChild(input);

  const dialogLog: string[] = [];
  bus.onAny((e, p) => {
    if (!DIALOG_EVENTS.includes(e)) return;
    dialogLog.push(`${e.padEnd(16)} ${JSON.stringify(p)}`);
    if (dialogLog.length > 14) dialogLog.shift();
  });
  let lastOut = "";

  const api = makeApi(game, (s) => { lastOut = s; });
  (window as any).dev = api;

  window.addEventListener("keydown", (ev) => {
    if (document.activeElement === input) {
      if (ev.key === "Escape") { input.style.display = "none"; input.blur(); ev.preventDefault(); }
      else if (ev.key === "Enter") {
        try { lastOut = String(runCommand(api, input.value) ?? "ok"); }
        catch (e) { lastOut = `lỗi: ${(e as Error).message}`; }
        input.value = "";
      }
      ev.stopPropagation();
      return;
    }
    if (ev.code === "F1") { state.visible = !state.visible; saveState(state); ev.preventDefault(); }
    else if (KEYS[ev.code]) { state.panel = KEYS[ev.code]; state.visible = true; saveState(state); ev.preventDefault(); }
    else if (ev.code === "Backquote") {
      input.style.display = "block"; input.focus(); ev.preventDefault(); ev.stopPropagation();
    }
  }, true);

  const render = () => {
    root.style.display = state.visible ? "block" : "none";
    if (!state.visible) return;
    const head = `[F1] ẩn · ${Object.entries(KEYS).map(([k, id]) => (id === state.panel ? `[${k}]` : k)).join(" ")} · ~ console\n`
      + `── ${TITLE[state.panel]} ${"─".repeat(Math.max(0, 40 - TITLE[state.panel].length))}\n`;
    let body = "";
    try { body = PANELS[state.panel](game, dialogLog); } catch (e) { body = `(lỗi panel: ${(e as Error).message})`; }
    root.textContent = head + body + (lastOut ? `\n\n> ${lastOut}` : "");
  };
  setInterval(render, 250);
  render();
}

// ───────────────────────────────────────────────────────────────────── panels

const f2 = (n: number) => n.toFixed(2);

const PANELS: Record<PanelId, (game: Phaser.Game, dialogLog: string[]) => string> = {
  perception() {
    const s = dev.stall?.service;
    if (!s) return "(không ở quầy)";
    const stims = s.liveStims;
    const out: string[] = [`kích thích đang sống: ${stims.map((x) => `${x.id}@${x.slot}`).join(", ") || "—"}`,
      "rate = salience × visibility × occluder × gaze × trait / 100", ""];
    for (const c of s.customers) {
      out.push(`${c.name.padEnd(18)} ${c.zone.padEnd(12)} ${c.gazeState.padEnd(10)} gaze ${f2(c.gaze)} trait ${f2(c.traitMul)}`
        + ` chờ ${f2(c.waitRatio)} ${c.phase}`);
      const keys = new Set<string>([...stims.filter((x) => !x.target || x.target === c.id).map((x) => x.key), ...c.observations.keys()]);
      for (const key of keys) {
        const o = c.observations.get(key);
        const live = stims.find((x) => x.key === key);
        const fx = live ? factorsOf(c, live) : null;
        out.push(`   ${key.slice(0, 34).padEnd(34)} c=${f2(o?.certainty ?? 0)} ${stateOf(o?.certainty ?? 0).padEnd(9)} peak=${(o?.peak ?? "UNAWARE").padEnd(9)}`
          + (fx ? ` rate ${f2(fx.rate)} = ${f2(fx.salience)}×${f2(fx.visibility)}×${f2(fx.occluder)}×${f2(fx.gaze)}×${f2(fx.trait)}/100` : " (đã tắt)"));
      }
    }
    return out.join("\n");
  },

  dialog(_g, log) {
    const s = dev.stall?.service;
    const l = s?.speaker.last;
    const head = [
      `rule DB: ${s?.speaker.db.all.length ?? 0} rule · câu bị hoãn vì trần 1 câu/frame: ${s?.dialogDeferred ?? 0}`,
      `~ rule.why() · rule.test("CONCEPT", "fact=giá trị,…")`,
    ];
    if (s && l) {
      head.push("", `lần hỏi gần nhất: ${l.concept} · ${l.npc} → ${l.picked ?? "(không rule nào khớp)"}`,
        `  ${l.q.dump().map(([k, v]) => `${k}=${v}`).join(" ")}`,
        ranking(s.speaker.db.explain(l.concept, l.q, s.speaker.st, l.now), 6));
    }
    return [...head, "", ...log].join("\n");
  },

  clock() {
    const ctx = dev.ctx;
    if (!ctx) return "(chưa vào ván)";
    const c = ctx.clock;
    return [
      `giờ game   ${fmtHhmm(c.minutes)} (${c.minutes.toFixed(2)} phút)   khung ${c.band}`,
      `TIME_SCALE ${c.scale} (base 30 · ×${c.scaleMul} a11y · ×${c.devFastForward} ff)   quầy ${c.busy ? "có khách" : "trống"}`,
      `paused     ${c.paused}`,
      `saveId     ${ctx.world.saveId}`,
      `ngày       ${ctx.day}   daySeed ${ctx.rng.daySeed}`,
      "", "bộ đếm stream:",
      ...ctx.rng.toJSON().map(([k, v]) => `   ${k.padEnd(18)} ${v}`),
    ].join("\n");
  },

  perf(game) {
    const last = FRAME_STEPS.map((s) => `${s} ${frameStats.last[s].toFixed(2)}`).join(" · ");
    const r = game.renderer as any;
    return [
      `fps thật     ${game.loop.actualFps.toFixed(1)} (mục tiêu 30)`,
      `logic p95    ${frameStats.p95().toFixed(2)} ms (ngân sách 17 · trần 31)`,
      `từng bước    ${last}`,
      `GameObject   ${dev.stall?.gameObjects() ?? "—"} (ngân sách 180)`,
      `draw call    ${r?.drawCount ?? "n/a"}`,
      `bubble steal ${telemetry.bubblePoolSteals} (phải = 0)`,
      `thoại hoãn   ${dev.stall?.service.dialogDeferred ?? 0}`,
      `autosave     ${dev.ctx?.save.writes ?? 0} lần · bị ép ${dev.ctx?.save.forcedWrites ?? 0}`,
    ].join("\n");
  },

  econ() {
    const w = dev.ctx?.world;
    if (!w) return "(chưa vào ván)";
    const est = telemetry.pace();
    return [
      `tiền       ${w.money.cash.toLocaleString("vi-VN")}₫`,
      `hôm nay    ${w.progress.today.served} phần · ${w.progress.today.revenue.toLocaleString("vi-VN")}₫ · mất ${w.progress.today.lost}`,
      "sổ cái:", ...w.ledger.slice(-5).map((r) => `   ngày ${r.day}: ${r.served} phần, ${r.revenue.toLocaleString("vi-VN")}₫, mất ${r.lost}`),
      "", `nhịp: ${est.minPerDay} phút/ngày (gồm pause: ${est.minPerDayTotal}) · ${est.days} ngày đo`,
      "", "Kho + hạn dùng + nhà cung cấp — P3.",
    ].join("\n");
  },
};

// ─────────────────────────────────────────────────────────────────── console

function makeApi(game: Phaser.Game, print: (s: string) => void) {
  const daySc = () => game.scene.getScene("day") as DayScene | null;
  const need = <T>(x: T | null | undefined, what: string): T => {
    if (!x) throw new Error(`chưa có ${what}`);
    return x;
  };

  return {
    day: {
      skipTo(hhmm: string) {
        const [h, m] = hhmm.split(":").map(Number);
        need(dev.ctx, "ván chơi").clock.minutes = h * 60 + m;
        return `→ ${hhmm}`;
      },
      /** Nhân TIME_SCALE (phút game). KHÔNG đụng `dt` của certainty — xem P0-03 §2.2. */
      fastForward(n: number) {
        need(dev.ctx, "ván chơi").clock.devFastForward = n;
        return `TIME_SCALE ×${n}`;
      },
      /**
       * Ép trời — để xem được NGÀY MƯA mà không phải chơi tới ngày 6.
       *
       * Chỉ đổi CÁI NHÌN và TIẾNG: nền nướng lại (mặt đường ướt, không còn vạt nắng),
       * lớp mưa dựng lên, `stallAudio` bắt `amb_mua_*`. KHÔNG đổi lượng khách hay độ
       * soi — mấy cái đó `Service` suy thẳng từ `weatherOf(day)` theo lịch, cố ý,
       * để không ai chỉnh thời tiết mà lệch luôn cân bằng của ngày hôm đó.
       *
       * Phải dựng lại cảnh quán vì nền là `RenderTexture` nướng một lần ở `create()`.
       */
      weather(w: string) {
        const world = need(dev.ctx, "ván chơi").world;
        const all = Object.keys(CAL.weatherInfo);
        if (!all.includes(w)) return `trời lạ — ${all.join(" ")}`;
        world.progress.weather = w as Weather;
        need(daySc(), "DayScene").devReopenStall();
        return `trời → ${w} (chỉ đổi cái nhìn + tiếng, không đổi lượng khách)`;
      },
      end() { need(dev.stall, "quầy").end(); return "đóng quầy"; },
      replay() { return need(daySc(), "DayScene").replayDay() ? "chơi lại từ sáng" : "không có bản chụp đầu ngày"; },
    },
    npc: {
      spawn(id: string) { return need(dev.stall, "quầy").service.devSpawn(id) ? `gọi ${id}` : `không có NPC ${id}`; },
      gaze(id: string, g: number | null) {
        const cs = need(dev.stall, "quầy").service.customers.filter((c) => c.memKey === id);
        for (const c of cs) c.gazeOverride = g;
        return `${cs.length} người`;
      },
      mood(id: string, cause: string) {
        const cs = need(dev.stall, "quầy").service.customers.filter((c) => c.memKey === id);
        if (!MOOD_CAUSES.includes(cause as MoodCause)) return `mood lạ — ${MOOD_CAUSES.join(" ")}`;
        for (const c of cs) {
          c.dayMood = moodOf(cause as MoodCause);
          const f = moodBaseFace(c.dayMood);
          c.react.baseFace = c.react.face = f ?? NEUTRAL;
        }
        return `${cs.length} người → ${cause}`;
      },
    },
    stim: {
      fire(id: string, zone: StallZone = "HANDS") { need(dev.stall, "quầy").fire(id, zone); return `${id}@${zone}`; },
    },
    rule: {
      /** "Tại sao nó nói câu đó?" — xếp hạng mọi rule của lần hỏi gần nhất, rule trượt ở fact nào. */
      why() {
        const sp = need(dev.stall, "quầy").service.speaker;
        const l = need(sp.last, "lần hỏi rule nào");
        return `${l.concept} · ${l.npc} → ${l.picked ?? "(im)"}\n` + ranking(sp.db.explain(l.concept, l.q, sp.st, l.now));
      },
      test(concept: string, facts = "") {
        const extra: Record<string, string | number | boolean> = {};
        for (const kv of facts.split(",").map((x) => x.trim()).filter(Boolean)) {
          const [k, v] = kv.split("=");
          extra[k] = v === "true" ? true : v === "false" ? false : /^-?\d+$/.test(v) ? Number(v) : v;
        }
        const r = need(need(dev.stall, "quầy").service.devTest(concept, extra), "khách ở quầy");
        return `${concept} · ${r.npc}\n` + ranking(r.ranking);
      },
    },
    sim: { headless: () => "chạy bằng Node: npm run sim -- --days 40" },
    bus: {
      dump() {
        const text = bus.trace.dump();
        const url = URL.createObjectURL(new Blob([text], { type: "application/x-ndjson" }));
        const a = document.createElement("a");
        a.href = url; a.download = `bus-trace-${Date.now()}.jsonl`; a.click();
        URL.revokeObjectURL(url);
        return `${text.split("\n").length} dòng`;
      },
    },
    telemetry: {
      pace: () => JSON.stringify(telemetry.pace()),
      export: () => { telemetry.download(); return "đã xuất"; },
    },
    print,
  };
}

function runCommand(api: any, line: string): unknown {
  const m = line.trim().match(/^([\w.]+)\s*(?:\((.*)\))?$/);
  if (!m) throw new Error("cú pháp: nhom.lenh(tham, so)");
  const path = m[1].split(".");
  let fn: any = api;
  for (const k of path) fn = fn?.[k];
  if (typeof fn !== "function") throw new Error(`không có lệnh ${m[1]}`);
  const args = m[2]?.trim() ? JSON.parse(`[${m[2].replace(/'/g, '"')}]`) : [];
  return fn(...args);
}

function loadState(): { visible: boolean; panel: PanelId } {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { }
  return { visible: false, panel: "perception" };
}

function saveState(s: { visible: boolean; panel: PanelId }) {
  try { sessionStorage.setItem(SS_KEY, JSON.stringify(s)); } catch { }
}

function ranking(rows: { id: string; score: number; ok: boolean; why: string }[], n = 10) {
  return rows.slice(0, n).map((x) => `  ${x.ok ? "✓" : "·"} ${String(x.score).padStart(2)} ${x.id.padEnd(26)} ${x.why}`).join("\n");
}
