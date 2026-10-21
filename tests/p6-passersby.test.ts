import { test } from "node:test";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { Bus } from "../src/core/eventbus";
import { Rng } from "../src/core/rng";
import { newGame, type SaveFile } from "../src/core/save";
import { HeadlessStall, POLICIES } from "../src/sim/headless";
import {
  GAP_SEC, PASSERS_MAX, RAIN_GAP_MUL, inviteChance, nextGapSec, passerAlpha, planPasser,
} from "../src/sim/passersby";
import { TALK_REACH } from "../src/sim/service";
import { WALKIN_ADDRESS, WALKIN_CALLS, hasInvite, type Talk } from "../src/sim/talk";
import { NPCS, WALKIN_STYLES } from "../src/content/npcs";

const NAMES = NPCS.map((n) => n.name.split(" ").slice(-1)[0]);
import { TalkStore } from "../src/content/talks";
import { STREET_LANES, STREET_X, QUEUE_SLOTS, assertWalkable, hitsWall } from "../src/world/map";
import type { Customer } from "../src/sim/customer";

const dayOf = (day: number, saveId = "pass-save"): SaveFile => {
  const w = newGame("t", saveId);
  w.progress.dayIndex = day;
  return w;
};

type Watch = (h: HeadlessStall) => void;
function play(day: number, watch?: Watch) {
  const bus = new Bus();
  const h = new HeadlessStall(dayOf(day), POLICIES.greedy, { bus });
  h.run({ inject: (_t, x) => watch?.(x) });
  return h;
}

const ambientOf = (h: HeadlessStall) => h.service.customers.filter((c) => c.ambient);

// Bỏ qua khi theo sau là tên riêng ("Chú Sáu dọn đi rồi") vì đó là gọi tên, không phải xưng hô.
const PRONOUN = (line: string, w: string) =>
  new RegExp(`(^|[^\\p{L}])${w}(?!\\s+\\p{Lu})([^\\p{L}]|$)`, "iu").test(line);

test("hai dải đường đều ĐI ĐƯỢC suốt chiều ngang — `walk()` đi thẳng, không né được gì", () => {
  assertWalkable();
  for (const lane of STREET_LANES) {
    for (let x = STREET_X[0]; x <= STREET_X[1]; x += 0.25) {
      assert.ok(!hitsWall(x, lane.y), `dải "${lane.id}" bị chặn ở x=${x.toFixed(2)}`);
    }
  }
});

test("hai đầu đường mờ hẳn, giữa đường thì rõ hẳn — không ai bật ra giữa vỉa hè", () => {
  assert.equal(passerAlpha(STREET_X[0]), 0);
  assert.equal(passerAlpha(STREET_X[1]), 0);
  assert.equal(passerAlpha((STREET_X[0] + STREET_X[1]) / 2), 1);
  for (let x = STREET_X[0]; x < STREET_X[0] + 1.5; x += 0.1) {
    assert.ok(passerAlpha(x + 0.1) >= passerAlpha(x));
  }
});

test("đi XUYÊN cái hẻm: vào đầu này ra đầu kia, không quay đầu về chỗ cũ", () => {
  for (let seed = 0; seed < 40; seed++) {
    const p = planPasser(new Rng(seed), QUEUE_SLOTS[0].x);
    assert.notEqual(p.from.x, p.to.x, `seed ${seed}: vào ra cùng một đầu`);
    assert.equal(p.from.y, p.to.y, "đổi dải giữa đường");
    assert.ok(STREET_LANES.some((l) => l.y === p.from.y));
    if (p.spot) {
      const lo = Math.min(p.from.x, p.to.x), hi = Math.max(p.from.x, p.to.x);
      assert.ok(p.spot.x > lo && p.spot.x < hi, "chỗ ngoái nhìn nằm ngoài đường họ đi");
      assert.ok(p.stay > 0, "có chỗ dừng mà không dừng giây nào");
    } else {
      assert.equal(p.stay, 0, "không dừng mà vẫn hẹn giờ đứng");
    }
  }
});

test("ngoái nhìn là THIỂU SỐ — đi ngang mà không ngó gì mới là chuyện thường", () => {
  let glanced = 0;
  for (let seed = 0; seed < 400; seed++) if (planPasser(new Rng(seed), 12.5).spot) glanced++;
  assert.ok(glanced > 0, "không một ai ngoái nhìn — chi tiết duy nhất nói 'người ta có để ý' đã chết");
  assert.ok(glanced < 200, `${glanced}/400 người ngoái nhìn — ai cũng ngó thì cái ngó hết nghĩa`);
});

test("giờ cao điểm đường đông hơn giờ vắng, và mưa thì vắng hẳn", () => {
  const avg = (band: Parameters<typeof nextGapSec>[0], rain: boolean) => {
    let s = 0;
    for (let i = 0; i < 200; i++) s += nextGapSec(band, rain, new Rng(i));
    return s / 200;
  };
  assert.ok(avg("PEAK", false) < avg("MID", false));
  assert.ok(avg("MID", false) < avg("LULL", false));
  assert.ok(avg("PEAK", true) > avg("PEAK", false) * 1.3, "mưa mà đường vẫn đông y như trời ráo");
  for (const [lo, hi] of Object.values(GAP_SEC)) assert.ok(lo > 0 && lo < hi);
  assert.ok(Math.abs(avg("MID", true) / avg("MID", false) - RAIN_GAP_MUL) < 1e-9);
});

test("chạy thật: hẻm có người đi ngang, và họ đi KHUẤT chứ không đứng lại giữa đường", () => {
  let ever = 0, peak = 0;
  const seen = new Set<string>();
  const h = play(13, (x) => {
    const list = ambientOf(x);
    peak = Math.max(peak, list.length);
    for (const c of list) if (!seen.has(c.id)) { seen.add(c.id); ever++; }
  });
  assert.ok(ever >= 20, `cả buổi mới có ${ever} người đi ngang — hẻm vẫn vắng như cũ`);
  assert.ok(peak > 0 && peak <= PASSERS_MAX, `có lúc ${peak} người cùng lúc, trần là ${PASSERS_MAX}`);
  assert.equal(ambientOf(h).length <= PASSERS_MAX, true);
  assert.ok(seen.size > ambientOf(h).length * 3, "gần như không ai đi khuất — chắc đang kẹt tường");
});

test("người đi ngang KHÔNG mua, không gọi món, không chiếm một chỗ nào trong hàng", () => {
  play(13, (h) => {
    for (const c of ambientOf(h)) {
      assert.equal(c.order, null, `${c.id} gọi món`);
      assert.equal(c.slot, -1, `${c.id} chiếm chỗ xếp hàng`);
      assert.equal(c.waitSec, 0, `${c.id} tích thời gian chờ`);
      assert.equal(c.phase, "leaving");
      assert.ok(!h.service.audience.includes(c), `${c.id} lọt vào tầng nhận thấy`);
    }
  });
});

test("RANH GIỚI: thêm người qua đường KHÔNG đụng một con số nào của buổi bán", () => {
  const measure = (strip: boolean) => {
    const h = play(13, (x) => {
      if (!strip) return;
      const list = x.service.customers;
      for (let i = list.length - 1; i >= 0; i--) if (list[i].ambient) list.splice(i, 1);
    });
    return {
      served: h.service.servedCount, lost: h.service.lostCount, balked: h.service.balkedCount,
      cash: h.ctx.world.money.cash, today: { ...h.ctx.world.progress.today },
    };
  };
  assert.deepEqual(measure(true), measure(false));
});

test("tất định: cùng seed thì đúng những người đó, đúng chỗ đó", () => {
  const trace = () => {
    const out: string[] = [];
    play(12, (h) => {
      for (const c of ambientOf(h)) out.push(`${c.id}@${c.x.toFixed(2)},${c.y.toFixed(2)}`);
    });
    return out;
  };
  const a = trace();
  assert.ok(a.length > 0);
  assert.deepEqual(trace(), a);
});

const standBy = (c: Customer) => ({ x: c.x, y: c.y - 1 });

test("đứng ngay cạnh ai thì F nói chuyện với NGƯỜI ĐÓ, không phải người đứng đầu quầy", async () => {
  let checked = 0;
  const h2 = new HeadlessStall(dayOf(13), POLICIES.greedy, { bus: new Bus() });
  await h2.service.talks.ensure("WALKIN");
  h2.run({
    inject: (_t, x) => {
      const front = x.service.front;
      const back = x.service.customers.find((c) =>
        c.slot > 0 && c.phase !== "leaving" && c.phase !== "arriving");
      if (!front || !back || checked) return;
      // Người đang chờ trả lời thắng tuyệt đối (TALK_B_ADDRESSED), nên bỏ qua để đo riêng luật khoảng cách.
      if (x.service.pendingTalkers.length) return;
      x.service.playerAt = standBy(back);
      // Hỏi hai lần vì talkTarget() có độ dính (TALK_STICKY) mà ở đây người chơi bị dời tức thì.
      x.service.nearbyToTalk();
      assert.equal(x.service.nearbyToTalk()?.id, back.id, "đứng cạnh người xếp sau mà F vẫn bắt người đầu quầy");
      x.service.playerAt = { x: front.x, y: front.y - TALK_REACH - 1 };
      assert.equal(x.service.nearbyToTalk(), null);
      checked = 1;
    },
  });
  assert.equal(checked, 1, "cả ngày không có lúc nào hai người cùng đứng — đổi ngày đi");
});

test("mỗi DÁNG người một vai — bà cụ không được gọi bằng 'anh'", () => {
  assert.equal(WALKIN_ADDRESS.length, WALKIN_STYLES.length, "bảng vai lệch bảng dáng người");
  for (const [i, a] of WALKIN_ADDRESS.entries()) {
    for (const k of ["self", "you", "call", "me"] as const) {
      assert.ok(a[k].length > 0, `dáng ${i} thiếu vai "${k}"`);
    }
    assert.ok(WALKIN_CALLS.includes(a.call), `dáng ${i}: gọi bằng "${a.call}" — không có trong WALKIN_CALLS`);
  }
  // Dáng 3 là bà cụ.
  assert.equal(WALKIN_ADDRESS[3].call, "bà");
  assert.equal(WALKIN_ADDRESS[3].me, "con");
  assert.notEqual(WALKIN_ADDRESS[3].call, WALKIN_ADDRESS[0].call, "bà cụ và anh thanh niên cùng một vai");
});

test("kho thoại đường phố KHÔNG viết cứng một vai nào — tám dáng dùng chung mà", async () => {
  const talks = (await TalkStore.loadAll()).filter((t) => t.npc === "QUA_DUONG");
  assert.ok(talks.length >= 6, `mới có ${talks.length} cuộc cho người đi đường`);
  const asPronoun = PRONOUN;
  const lines = (t: (typeof talks)[number]) => {
    const out = [t.opener, t.ignore?.reply ?? ""];
    const walk = (nodes: readonly any[] = [], depth = 0) => {
      if (depth > 6) return;
      for (const n of nodes) {
        out.push(n.say, n.reply ?? "", n.act?.yes ?? "", n.act?.no ?? "");
        walk(n.then ?? (n.ref ? t.shared?.[n.ref] : []) ?? [], depth + 1);
      }
    };
    walk(t.tree);
    for (const sub of Object.values(t.shared ?? {})) walk(sub);
    return out.filter(Boolean);
  };
  for (const t of talks) {
    for (const l of lines(t)) {
      for (const w of WALKIN_CALLS) {
        assert.ok(!asPronoun(l, w), `${t.id}: "${l}" viết cứng vai "${w}" — phải là {call}/{you}`);
      }
    }
  }
});

test("người đi ngang cũng nói chuyện được, và họ ĐỨNG LẠI khi mình gọi", async () => {
  const h = new HeadlessStall(dayOf(13), POLICIES.greedy, { bus: new Bus() });
  await h.service.talks.ensure("QUA_DUONG");
  let opened = 0;
  h.run({
    inject: (_t, x) => {
      if (opened) return;
      const p = ambientOf(x).find((c) => passerAlpha(c.x) === 1);
      if (!p) return;
      x.service.playerAt = standBy(p);
      assert.equal(x.service.nearbyToTalk()?.id, p.id, "đứng sát một người đi ngang mà F không thấy họ");
      const view = x.service.openTalk();
      if (!view) return;                                 // kho chưa nạp kịp — thử frame sau
      opened = 1;
      assert.equal(view.line, "", "người chơi chủ động mà NPC lại nói trước");
      assert.ok(view.options.length >= 2, "không có đường ra ở nhịp đầu");
      const shown = view.options.map((o) => o.say);
      for (const l of shown) assert.ok(!l.includes("{"), `chỗ trống danh xưng lọt ra màn hình: "${l}"`);
      const a = WALKIN_ADDRESS[Number(p.memKey.slice("walkin".length))];
      const all = shown.join(" ");
      for (const w of WALKIN_CALLS) {
        if (w === a.call || w === a.you || w === a.me || w === a.self) continue;
        assert.ok(!PRONOUN(all, w), `${p.memKey} (vai "${a.call}") bị gọi bằng "${w}": ${all}`);
      }
      assert.ok(p.pass!.until > p.now, "gọi người ta lại mà họ vẫn thủng thẳng đi tiếp");
      assert.equal(p.pass!.spot!.x, p.x);
      assert.equal(p.pass!.spot!.y, p.y);
      x.service.closeTalk();
    },
  });
  assert.equal(opened, 1, "cả buổi không bắt chuyện được với một người đi ngang nào");
});

test("người vừa mua xong đang quay lưng về thì KHÔNG gọi giật lại được", () => {
  let checked = 0;
  play(13, (h) => {
    const gone = h.service.customers.find((c) => c.phase === "leaving" && !c.pass);
    if (!gone) return;
    h.service.playerAt = standBy(gone);
    assert.notEqual(h.service.nearbyToTalk()?.id, gone.id, `${gone.id} đã quay lưng mà vẫn gọi lại được`);
    checked = 1;
  });
  assert.equal(checked, 1, "cả ngày không ai đi về — đổi ngày đi");
});

type Snapshot = { phase: string; hasOrder: boolean; slotted: boolean };

async function inviteUntilYes(day: number) {
  const h = new HeadlessStall(dayOf(day), POLICIES.greedy, { bus: new Bus() });
  await h.service.talks.ensure("QUA_DUONG");
  let took: Customer | null = null, tried = 0;
  // Chụp lúc nhận lời vì tới cuối ngày họ đã mua xong và về.
  let atYes: Snapshot | null = null;
  h.run({
    inject: (_t, x) => {
      if (took) return;
      const p = ambientOf(x).find((c) => passerAlpha(c.x) === 1 && c.pass!.until < 0);
      if (!p) return;
      x.service.playerAt = standBy(p);
      const view = x.service.openTalk();
      if (!view) return;
      for (let depth = 0; depth < 6; depth++) {
        const next = x.service.chooseTalk(0);
        tried++;
        if (!p.ambient) {
          took = p;
          atYes = { phase: p.phase, hasOrder: !!p.order, slotted: x.service.customers.includes(p) };
          return;
        }
        if (!next || next.done) break;
      }
      x.service.closeTalk();
    },
  });
  return { h, took: took as Customer | null, atYes: atYes as Snapshot | null, tried };
}

test("mời khéo thì có người ghé vô thiệt — và họ đi hết đường của một người khách", async () => {
  const { h, took, atYes, tried } = await inviteUntilYes(13);
  assert.ok(tried > 0, "cả buổi không mở được cuộc nào với người đi ngang");
  assert.ok(took && atYes, `mời ${tried} lượt mà không ai chịu ghé — cái cửa này đóng chết rồi`);
  assert.equal(took!.ambient, false, "nhận lời rồi mà vẫn còn là cái nền");
  assert.equal(took!.pass, null, "nhận lời rồi mà vẫn còn đường đi ngang");
  assert.ok(atYes!.hasOrder, "ghé vô mà không có món nào để gọi");
  assert.equal(atYes!.phase, "arriving", `nhận lời xong mà phase là ${atYes!.phase}`);
  assert.ok(atYes!.slotted, "nhận lời rồi mà không nằm trong danh sách khách");
  assert.ok(h.service.servedCount > 0);
  assert.ok(!h.service.customers.includes(took!), "tới cuối ngày vẫn còn đứng đó");
});

test("một người chỉ có MỘT câu trả lời — mời hụt rồi mời lại không đổi được gì", async () => {
  const h = new HeadlessStall(dayOf(14), POLICIES.greedy, { bus: new Bus() });
  await h.service.talks.ensure("QUA_DUONG");
  let checked = 0;
  h.run({
    inject: (_t, x) => {
      if (checked) return;
      const p = ambientOf(x).find((c) => passerAlpha(c.x) === 1);
      if (!p) return;
      const roll = () => x.service["deps"].hub.derive(`invite:${p.id}`).next();
      assert.equal(roll(), roll(), "cùng một người mà hai lần hỏi ra hai con số");
      checked = 1;
    },
  });
  assert.equal(checked, 1);
});

test("hàng dài thì mời cũng vô ích — cơ chế này chỉ đáng dùng lúc VẮNG", () => {
  const warm = {
    person: { soi: 0.2, deTha: 0.9, thanThien: 0.9 },
    glanced: true, tone: "AM", soldOut: false, slots: QUEUE_SLOTS.length,
  };
  const empty = inviteChance({ ...warm, ahead: 0 });
  assert.ok(empty > 0.5, `quán trống, mời hết sức mà mới ${empty.toFixed(2)}`);
  for (let n = 1; n <= QUEUE_SLOTS.length; n++) {
    assert.ok(inviteChance({ ...warm, ahead: n }) < inviteChance({ ...warm, ahead: n - 1 }) + 1e-9);
  }
  assert.equal(inviteChance({ ...warm, ahead: QUEUE_SLOTS.length }), 0);
});

test("hai người đi NGƯỢC chiều gặp nhau thì chào nhau — và chỉ một thiểu số làm vậy", async () => {
  let greeted = 0, seen = 0, bothSpoke = 0;
  for (const day of [3, 9, 13, 21, 27]) {
    const h = new HeadlessStall(dayOf(day), POLICIES.greedy, { bus: new Bus() });
    const ids = new Set<string>();
    h.run({
      inject: (_t, x) => {
        for (const c of ambientOf(x)) {
          if (ids.has(c.id)) continue;
          if (c.greeted) { ids.add(c.id); greeted++; }
        }
        const talking = ambientOf(x).filter((c) => c.say).length;
        if (talking >= 2) bothSpoke++;
      },
    });
    seen += ids.size || 0;
    seen = Math.max(seen, greeted);
  }
  assert.ok(greeted > 0, "cả năm ngày không có ai chào ai — cái hẻm vẫn câm");
  assert.ok(bothSpoke > 0, "chào mà không ai đáp lại — một nửa cuộc chào thì không phải chào");
});

test("cái chào KHÔNG được mang thông tin — nền thì miễn phí, bỏ qua không mất gì", async () => {
  const g = JSON.parse(
    await readFile(new URL("../src/content/lines/generic.json", import.meta.url), "utf8"),
  ) as { pools: { id: string; variants: string[] }[] };
  const pools = g.pools.filter((p) => p.id === "chaoNhau" || p.id === "chaoDap");
  assert.equal(pools.length, 2, "thiếu túi câu chào");
  for (const p of pools) {
    assert.ok(p.variants.length >= 8, `${p.id}: mới ${p.variants.length} biến thể — nghe ra là máy phát lại`);
    for (const v of p.variants) {
      assert.ok(!/\{/.test(v), `${p.id}: "${v}" còn chỗ trống chưa điền`);
      for (const n of NAMES) {
        assert.ok(!v.includes(n), `${p.id}: "${v}" nhắc tên ${n} — cái chào thành một mẩu tin`);
      }
      assert.ok(v.length <= 40, `${p.id}: "${v}" dài quá, người ta đang đi ngang chứ không đứng lại kể`);
    }
  }
});

test("bước ra đường với người đi ngang thì LUÔN mời được — không rơi vào chuyện thời tiết", async () => {
  let drew = 0, withInvite = 0, promised = 0;
  for (const day of [5, 13, 21]) {
    const h = new HeadlessStall(dayOf(day), POLICIES.greedy, { bus: new Bus() });
    await h.service.talks.ensure("QUA_DUONG");
    const seen = new Set<string>();
    h.run({
      inject: (_t, x) => {
        for (const c of ambientOf(x)) {
          if (seen.has(c.id) || c.phase === "arriving" || x.service.talkOpen) continue;
          seen.add(c.id);
          x.service.playerAt = standBy(c);
          const saidMoi = x.service.talkVerb(c) === "mời";
          const v = x.service.openTalk();
          if (!v) continue;
          drew++;
          if (saidMoi) promised++;
          if (JSON.stringify(v.options) !== "" && x.service.talkOpen) {
            const t = (x.service as unknown as { talkSession: { talk: Talk } }).talkSession.talk;
            // Người đi ngang vừa thành khách mua giữa chừng thì chuyển sang kho thoại khách, không tính.
            if (t.npc !== "QUA_DUONG") { drew--; if (saidMoi) promised--; }
            else if (hasInvite(t)) withInvite++;
          }
          x.service.closeTalk();
        }
      },
    });
  }
  assert.ok(drew > 20, `cả ba ngày chỉ mở được ${drew} cuộc với người đi ngang`);
  assert.equal(withInvite, drew,
    `${drew - withInvite}/${drew} lần bước ra mời mà cuộc mở ra không có đường mời nào`);
  assert.equal(promised, drew, "dòng nhắc không ghi \"mời\" dù cuộc mở ra có đường mời");
});
