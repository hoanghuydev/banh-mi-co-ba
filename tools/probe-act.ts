/**
 * SĂN TỪNG ACT MỘT — "đứng yên" là nhánh CHẾT hay chỉ là HIẾM?
 *
 * `tools/probe-social.ts` quét 27 act cùng lúc bằng cách xoay vòng, nên mỗi act chỉ được
 * chừng 1/27 số cuộc. Mười act ra 0 lần, và tới đó thì chưa trả lời được câu quan trọng:
 * nhánh đó KHÔNG VỚI TỚI ĐƯỢC, hay chỉ là bot chưa đủ lượt?
 *
 * Máy này dồn cả mùa cho MỘT act: `socialActs: [act]`. Chạy được ⇒ nhánh sống, chỉ hiếm.
 * Vẫn 0 ⇒ in ra đúng cái cổng đang chặn, để sửa chứ không để đoán.
 *
 *   npx tsx tools/probe-act.ts [--days 30] [--acts LEND_ITEM,RAO]
 */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { TALK_NPC_IDS, TalkStore } from "../src/content/talks";
import { eligible, walkNodes, type Talk, type TalkNode } from "../src/sim/talk";

const argN = (k: string, d: number) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? Number(process.argv[i + 1]) : d; };
const argS = (k: string, d: string) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? String(process.argv[i + 1]) : d; };
const NGAY = argN("days", 30);

const TALKS: Talk[] = await TalkStore.loadAll();

/** Act nào nằm ở đâu, kèm cổng của CUỘC và của NÚT — để khi nó không chạy thì biết hỏi ai. */
const O = new Map<string, { talk: Talk; node: TalkNode }[]>();
for (const t of TALKS) {
  for (const { node } of walkNodes(t)) {
    if (!node.act) continue;
    (O.get(node.act.kind) ?? O.set(node.act.kind, []).get(node.act.kind)!).push({ talk: t, node });
  }
}

const DS = argS("acts", "").split(",").filter(Boolean);
const SAN = DS.length ? DS : [...O.keys()].sort();

const ket: { act: string; lan: number }[] = [];
for (const act of SAN) {
  const w = newGame(`act-${act}`, "p210");
  const bus = new Bus(false);
  const platform = memoryPlatform();
  for (let d = 1; d < 5; d++) nextDay(w, bus);
  let lan = 0;
  const troi = new Set<string>();
  /*
   * ĐỌC ĐƯỢC hay KHÔNG, tách khỏi BOT CÓ BẤM hay không. Act không chạy có hai nghĩa rất
   * khác nhau: cuộc chứa nó chưa bao giờ rút ra được (nhánh chết), hay cuộc có ra mà bot
   * không chọn đúng nhánh (chỉ hiếm). Đếm riêng số lần cuộc đó ĐỦ ĐIỀU KIỆN chạy.
   */
  const cuocCo = new Set((O.get(act) ?? []).map((x) => x.talk.id));
  let moRa = 0;
  for (let ngay = 0; ngay < NGAY; ngay++) {
    const h = new HeadlessStall(w, { ...POLICIES.social, socialActs: [act] }, { bus, platform });
    const svc = (h as unknown as { service: any }).service;
    for (const k of [...TALK_NPC_IDS, "WALKIN", "QUA_DUONG", "ANY"]) await svc.talks.ensure(k);
    const goc = svc.applyAct.bind(svc);
    svc.applyAct = (c: any, a: any, t: any) => { if (a.kind === act) lan++; return goc(c, a, t); };
    for (let f = 0; f < 140_000 && !h.closed; f++) {
      h.step(1000 / 30);
      /*
       * ⚠️ Lấy mẫu DÀY. Bản đầu lấy mỗi 211 frame và báo cả chín act là "chưa bao giờ đủ
       * điều kiện" — sai, vì `okPractice` làm mấy cuộc này chỉ sống trong mấy khung cảnh
       * RẤT HẸP (`NAN_LAI` đúng chừng 8% thời gian). Lấy mẫu thưa hơn cái cửa sổ cần đo
       * thì không thấy nó: đúng cái lỗi "đo ngắn hơn cái được đo" của đợt trước.
       */
      if (f % 17 || !cuocCo.size) continue;
      for (const c of svc.customers) {
        if (c.phase === "leaving" && !c.pass) continue;
        /*
         * ⚠️ Phải hỏi CẢ HAI chiều mở lời. 81/86 cuộc là `NPC_ONLY` — hỏi mỗi `"PLAYER"`
         * thì `okSource` gạt sạch và máy này báo "nhánh chết" cho một đống cuộc sống
         * nguyên (`su.toan` rụng 53/53 mẫu đúng ở cổng đó).
         */
        const pool = svc.talks.get(svc.talkKey(c));
        const ctx = svc.talkCtx(c);
        const ok = [...eligible(pool, ctx, "PLAYER"), ...eligible(pool, ctx, "NPC")]
          .filter((t: Talk) => svc.canRun(t, c) && cuocCo.has(t.id));
        if (ok.length) moRa++;
      }
    }
    troi.add(w.progress.weather);
    nextDay(w, bus);
  }
  ket.push({ act, lan });
  const dau = lan > 0 ? "✓" : moRa > 0 ? "~" : "✗";
  const vi = lan > 0 ? "" : moRa > 0
    ? `  — cuộc chứa nó CÓ mở ra được ${moRa} lượt, bot không bấm trúng nhánh ⇒ HIẾM, không chết`
    : "  — cuộc chứa nó CHƯA BAO GIỜ đủ điều kiện ⇒ nghi nhánh chết";
  console.log(`${dau} ${act.padEnd(16)} ${String(lan).padStart(4)} lần / ${NGAY} buổi${vi}`);
  if (lan === 0) {
    for (const { talk, node } of O.get(act) ?? []) {
      const cong = [
        talk.when?.day && `cuộc: ngày ${talk.when.day[0]}–${talk.when.day[1]}`,
        talk.when?.rain !== undefined && `cuộc: rain=${talk.when.rain}`,
        talk.when?.minVisits && `cuộc: ≥${talk.when.minVisits} lượt ghé`,
        talk.when?.tier && `cuộc: tier ${talk.when.tier.join("/")}`,
        talk.when?.world?.length && `cuộc: ${talk.when.world.join(" ")}`,
        talk.when?.needFlag && `cuộc: cờ ${talk.when.needFlag}`,
        node.need && `nút: ${[node.need].flat().join(" ")}`,
        node.while && `nút: while ${[node.while].flat().join(" ")}`,
        node.needCash && `nút: cần ${node.needCash}đ`,
        node.needEquip && `nút: cần ${node.needEquip}`,
      ].filter(Boolean);
      console.log(`     ${talk.npc}/${talk.id}  ${cong.join(" · ") || "(không cổng nào)"}`);
    }
    console.log(`     thời tiết mùa này: ${[...troi].join(", ")}`);
  }
}

const song = ket.filter((x) => x.lan > 0).length;
console.log(`\n${song}/${ket.length} act CHẠY được khi dồn cả mùa cho riêng nó.`);
console.log("✓ chạy  ·  ~ cuộc có mở ra mà bot không bấm trúng (hiếm)  ·  ✗ cuộc chưa bao giờ đủ điều kiện");
