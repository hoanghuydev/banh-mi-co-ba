/**
 * NGƯỜI QUA ĐƯỜNG (`sim/passersby.ts`) + bấm F theo KHOẢNG CÁCH (`Service.talkTarget`).
 *
 * File này giữ hai hợp đồng, và cái thứ hai mới là cái dễ mất nhất:
 *
 *  1. Con hẻm có người đi ngang, họ đi hết đường rồi khuất, và họ KHÔNG MUA GÌ.
 *  2. RANH GIỚI: thêm họ vào KHÔNG được đụng một con số nào của buổi bán. Cùng một seed,
 *     một ngày có người qua đường và một ngày không có phải bán được y hệt nhau, ghi vào
 *     sổ y hệt nhau, và mọi dòng số ngẫu nhiên của hệ khác phải đứng nguyên chỗ cũ. Đây
 *     là cái nền của con hẻm — cái nền mà làm xê dịch được kết quả thì nó là một hệ.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { Bus } from "../src/core/eventbus";
import { Rng } from "../src/core/rng";
import { newGame, type SaveFile } from "../src/core/save";
import { HeadlessStall, POLICIES } from "../src/sim/headless";
import {
  GAP_SEC, PASSERS_MAX, RAIN_GAP_MUL, inviteChance, nextGapSec, passerAlpha, planPasser,
} from "../src/sim/passersby";
import { TALK_REACH } from "../src/sim/service";
import { WALKIN_ADDRESS, WALKIN_CALLS } from "../src/sim/talk";
import { WALKIN_STYLES } from "../src/content/npcs";
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

/**
 * Từ `w` có được dùng làm ĐẠI TỪ trong câu này không. Bỏ qua lúc ngay sau nó là một tên
 * riêng ("Chú Sáu dọn đi rồi") — đó là gọi tên người khác, không phải xưng hô với người
 * đang đứng đây. Cùng một cửa với lưới L-6 của `p5-talk`.
 */
const PRONOUN = (line: string, w: string) =>
  new RegExp(`(^|[^\\p{L}])${w}(?!\\s+\\p{Lu})([^\\p{L}]|$)`, "iu").test(line);

// ───────────────────────────────────────────────────── đường đi có thật không

test("hai dải đường đều ĐI ĐƯỢC suốt chiều ngang — `walk()` đi thẳng, không né được gì", () => {
  assertWalkable();                                      // chính nó soi hai dải này
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
  // đơn điệu trên nửa đầu: mờ dần đều, không nhấp nháy
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

// ────────────────────────────────────────────────────────── chạy thật một ngày

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
  // ai cũng phải được dọn đi: còn đọng lại nghĩa là có người ghim chân ở đâu đó
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
  /**
   * Cách kiểm: chạy cùng một ngày, cùng seed, HAI lần — một lần để nguyên, một lần ép
   * trần người qua đường về 0 bằng cách nuốt sạch họ ngay khi vừa sinh ra. Hai buổi phải
   * ra y hệt nhau. Khác một ổ bánh thôi cũng có nghĩa là mấy người này đã lọt vào một
   * dòng số hoặc một bộ đếm nào đó mà lẽ ra họ không được chạm tới.
   */
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

// ───────────────────────────────────────────────── bấm F theo khoảng cách

/** Người chơi đứng ở đâu để với tới `c`. */
const standBy = (c: Customer) => ({ x: c.x, y: c.y - 1 });

test("đứng ngay cạnh ai thì F nói chuyện với NGƯỜI ĐÓ, không phải người đứng đầu quầy", async () => {
  let checked = 0;
  const h2 = new HeadlessStall(dayOf(13), POLICIES.greedy, { bus: new Bus() });
  await h2.service.talks.ensure("WALKIN");
  h2.run({
    inject: (_t, x) => {
      const front = x.service.front;
      const back = x.service.customers.find((c) => c.slot > 0 && c.phase !== "leaving");
      if (!front || !back || checked) return;
      x.service.playerAt = standBy(back);
      assert.equal(x.service.nearbyToTalk()?.id, back.id, "đứng cạnh người xếp sau mà F vẫn bắt người đầu quầy");
      // lùi về quầy: không còn ai trong tầm → rơi về người đứng đầu
      x.service.playerAt = { x: front.x, y: front.y - TALK_REACH - 1 };
      assert.equal(x.service.nearbyToTalk(), null);
      checked = 1;
    },
  });
  assert.equal(checked, 1, "cả ngày không có lúc nào hai người cùng đứng — đổi ngày đi");
});

// ──────────────────────────────────────────────────────────────── danh xưng

test("mỗi DÁNG người một vai — bà cụ không được gọi bằng 'anh'", () => {
  assert.equal(WALKIN_ADDRESS.length, WALKIN_STYLES.length, "bảng vai lệch bảng dáng người");
  for (const [i, a] of WALKIN_ADDRESS.entries()) {
    for (const k of ["self", "you", "call", "me"] as const) {
      assert.ok(a[k].length > 0, `dáng ${i} thiếu vai "${k}"`);
    }
    assert.ok(WALKIN_CALLS.includes(a.call), `dáng ${i}: gọi bằng "${a.call}" — không có trong WALKIN_CALLS`);
  }
  // dáng 3 là bà cụ (tóc búi bạc, lưng còng) — đây là chính cái ca làm lộ ra lỗi
  assert.equal(WALKIN_ADDRESS[3].call, "bà");
  assert.equal(WALKIN_ADDRESS[3].me, "con");
  assert.notEqual(WALKIN_ADDRESS[3].call, WALKIN_ADDRESS[0].call, "bà cụ và anh thanh niên cùng một vai");
});

test("kho thoại đường phố KHÔNG viết cứng một vai nào — tám dáng dùng chung mà", async () => {
  /**
   * Lưới này là thứ giữ cho cái lỗi "gọi bà cụ bằng anh" không mọc lại. Một bộ thoại
   * dùng chung cho tám dáng người thì mọi chỗ xưng hô phải là CHỖ TRỐNG; viết thẳng
   * "anh" vào là lại sai với bảy dáng còn lại.
   *
   * Bỏ qua lúc ngay sau từ đó là một TÊN RIÊNG ("Chú Sáu dọn đi rồi") — đó là gọi tên
   * người khác, không phải xưng hô với người đang đứng đây. Cùng một cửa với L-6.
   */
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
      assert.ok(view.line.length > 0, "mở bảng ra mà người ta không nói câu nào");
      assert.ok(view.options.length >= 2, "không có đường ra ở nhịp đầu");
      // Chỗ trống danh xưng phải được ĐIỀN, và điền đúng vai của dáng người này.
      const shown = [view.line, ...view.options.map((o) => o.say)];
      for (const l of shown) assert.ok(!l.includes("{"), `chỗ trống danh xưng lọt ra màn hình: "${l}"`);
      const a = WALKIN_ADDRESS[Number(p.memKey.slice("walkin".length))];
      const all = shown.join(" ");
      for (const w of WALKIN_CALLS) {
        if (w === a.call || w === a.you || w === a.me || w === a.self) continue;
        // cùng cửa "tên riêng" với L-6: "Chú Sáu dọn đi rồi" là gọi TÊN, không phải xưng hô
        assert.ok(!PRONOUN(all, w), `${p.memKey} (vai "${a.call}") bị gọi bằng "${w}": ${all}`);
      }
      // gọi rồi thì người ta dừng, ngay tại chỗ đang đứng
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

// ────────────────────────────────────────────── mời khách vô (quán vắng)

/**
 * Mời tới khi có người chịu ghé. Trả lượt ghé đó, hoặc null nếu cả buổi không ai chịu.
 *
 * Ép roll bằng cách gọi thẳng `openTalk`/`chooseTalk` — đây là đúng đường người chơi đi
 * (bấm F, bấm một dòng), chỉ là không có bàn phím.
 */
type Snapshot = { phase: string; hasOrder: boolean; slotted: boolean };

async function inviteUntilYes(day: number) {
  const h = new HeadlessStall(dayOf(day), POLICIES.greedy, { bus: new Bus() });
  await h.service.talks.ensure("QUA_DUONG");
  let took: Customer | null = null, tried = 0;
  /** Chụp lại ngay lúc họ nhận lời — tới cuối ngày thì họ đã mua xong và về mất rồi. */
  let atYes: Snapshot | null = null;
  h.run({
    inject: (_t, x) => {
      if (took) return;
      const p = ambientOf(x).find((c) => passerAlpha(c.x) === 1 && c.pass!.until < 0);
      if (!p) return;
      x.service.playerAt = standBy(p);
      const view = x.service.openTalk();
      if (!view) return;
      // đi sâu tới khi gặp một nhánh có lời mời, hoặc hết cuộc
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
  // và cái lượt ghé đó phải đi tới nơi: cuối ngày họ đã mua xong, không kẹt giữa hẻm
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
    glanced: true, tone: "AM", warmth: 10, soldOut: false, slots: QUEUE_SLOTS.length,
  };
  const empty = inviteChance({ ...warm, ahead: 0 });
  assert.ok(empty > 0.5, `quán trống, mời hết sức mà mới ${empty.toFixed(2)}`);
  for (let n = 1; n <= QUEUE_SLOTS.length; n++) {
    assert.ok(inviteChance({ ...warm, ahead: n }) < inviteChance({ ...warm, ahead: n - 1 }) + 1e-9);
  }
  assert.equal(inviteChance({ ...warm, ahead: QUEUE_SLOTS.length }), 0);
});
