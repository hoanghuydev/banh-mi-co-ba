import { test } from "node:test";
import assert from "node:assert/strict";
import { Rng } from "../src/core/rng";
import type { TimeBand } from "../src/core/clock";
import { MOOD_FACE } from "../src/sim/talk";
import { POSES as POSE_DEFS } from "../src/sim/reaction";
import {
  PURPOSES, STATES, allows, describe, purposeAngerMul, purposeById, purposeHurry,
  purposeInviteMul, purposePatienceMul, purposesIn, rollPurpose, stateById, statesOf,
} from "../src/sim/purpose";

const BANDS: TimeBand[] = ["PRE_OPEN", "PEAK", "MID", "LULL"];
const POSES = new Set(Object.keys(POSE_DEFS));

test("đủ 60 × 30 — dưới ngần này thì cái hẻm bắt đầu lặp lại chính nó", () => {
  assert.ok(PURPOSES.length >= 55, `mới có ${PURPOSES.length} mục đích`);
  assert.ok(STATES.length >= 28, `mới có ${STATES.length} tâm trạng`);
});

test("không id nào trùng, không id nào rỗng", () => {
  const pid = new Set(PURPOSES.map((p) => p.id));
  const sid = new Set(STATES.map((s) => s.id));
  assert.equal(pid.size, PURPOSES.length);
  assert.equal(sid.size, STATES.length);
  for (const id of [...pid, ...sid]) assert.match(id, /^[A-Z][A-Z0-9_]*$/);
});

test("mọi face/pose của tâm trạng đều CÓ THẬT — tên sai là một ô vuông trắng", () => {
  for (const s of STATES) {
    assert.ok(s.face in MOOD_FACE, `${s.id}: face '${s.face}' không có trong MOOD_FACE`);
    assert.ok(POSES.has(s.pose), `${s.id}: pose '${s.pose}' không phải PoseId`);
  }
});

test("mọi states[] của mục đích đều trỏ tới một tâm trạng có thật", () => {
  for (const p of PURPOSES) {
    for (const id of p.states) {
      assert.ok(stateById(id), `${p.id}: tâm trạng '${id}' không tồn tại`);
    }
    assert.equal(statesOf(p).length, p.states.length);
  }
});

test("mỗi mục đích có 2–4 tâm trạng — một cái thì không phải một con người", () => {
  for (const p of PURPOSES) {
    assert.ok(p.states.length >= 2, `${p.id} chỉ có ${p.states.length} tâm trạng`);
    assert.ok(p.states.length <= 4, `${p.id} có tới ${p.states.length} tâm trạng`);
    assert.equal(new Set(p.states).size, p.states.length, `${p.id} khai trùng tâm trạng`);
  }
});

test("mọi khung giờ đều có người đi ngang — tổng weight > 0 ở cả bốn", () => {
  for (const b of BANDS) {
    const list = purposesIn(b);
    const sum = list.reduce((n, p) => n + p.weight, 0);
    assert.ok(list.length >= 5, `${b} chỉ có ${list.length} mục đích`);
    assert.ok(sum > 0, `${b} tổng weight = 0`);
    for (const p of list) assert.ok(p.bands.includes(b));
  }
});

test("số nằm trong khoảng — buyable/hurry là 0..1, hệ số nhân là số dương", () => {
  for (const p of PURPOSES) {
    assert.ok(p.buyable >= 0 && p.buyable <= 1, `${p.id}.buyable = ${p.buyable}`);
    assert.ok(p.hurry >= 0 && p.hurry <= 1, `${p.id}.hurry = ${p.hurry}`);
    assert.ok(p.weight > 0, `${p.id}.weight = ${p.weight}`);
    assert.ok(p.bands.length > 0, `${p.id} không có khung giờ nào`);
  }
  for (const s of STATES) {
    for (const k of ["patienceMul", "angerMul", "inviteMul"] as const) {
      assert.ok(s[k] > 0 && s[k] < 3, `${s.id}.${k} = ${s[k]}`);
    }
  }
});

test("label là tiếng Việt VIẾT THƯỜNG — nó hiện thẳng ra màn hình", () => {
  for (const x of [...PURPOSES, ...STATES]) {
    assert.ok(x.label.length > 0, `${x.id} không có label`);
    assert.equal(x.label, x.label.toLowerCase(), `${x.id}: '${x.label}' có chữ hoa`);
    assert.equal(x.label, x.label.trim());
    assert.equal(x.label.normalize("NFC"), x.label, `${x.id}: label chưa chuẩn NFC`);
  }
});

// Lưới chắn cho người soạn dữ liệu; lúc chạy đã có danh sách trắng `states`.
const CAM: [string, string, string][] = [
  ["TRUNG_SO", "BUON", "vừa trúng số mà buồn — yêu cầu của chủ dự án cấm thẳng cặp này"],
  ["TRUNG_SO", "NAO_LONG", "nặng lòng vì trúng số thì không phải trúng số nữa"],
  ["TRUNG_SO", "GIAN", "'không thể là dạng tức giận' — nguyên văn"],
  ["TRUNG_SO", "CAU_GAT", "cáu gắt với tờ vé số vừa đổi được tiền: không"],
  ["TRUNG_SO", "UC_CHE", "ức chế là chuyện của người thiếu tiền"],
  ["DI_DAM_TANG", "VUI", "đi đám tang mà vui — cái sai đọc ra ngay từ ngoài đường"],
  ["DI_DAM_TANG", "HON_HO", "hớn hở trong bộ đồ đen"],
  ["DI_DAM_TANG", "THONG_THA", "có giờ tẩm liệm, không ai thong thả đi đám tang"],
  ["DI_DAM_GIO", "HON_HO", "giỗ là tưởng nhớ, vui vẻ thì có, hớn hở thì không"],
  ["DI_PHONG_VAN", "DUNG_DUNG", "dửng dưng thì ở nhà, không ai đi phỏng vấn kiểu đó"],
  ["DI_PHONG_VAN", "BUON_NGU", "ngủ gật trước cửa phòng phỏng vấn là bỏ luôn buổi đó"],
  ["DI_LAM_TRE", "THONG_THA", "trễ mà thong thả thì không gọi là trễ"],
  ["DI_LAM_TRE", "THU_THAI", "như trên, nặng hơn"],
  ["DI_LAM_TRE", "DUNG_DUNG", "dửng dưng với giờ chấm công = không trễ"],
  ["DI_HOC_TRE", "THONG_THA", "cổng trường sắp đóng"],
  ["MAT_XE", "VUI", "mất cả cần câu cơm mà vui"],
  ["MAT_XE", "HON_HO", "như trên"],
  ["MAT_XE", "THONG_THA", "không ai thong thả sau khi quay lại chỗ gửi xe"],
  ["MUA_THUOC_GAP", "THONG_THA", "gấp và thong thả không ở chung một người"],
  ["MUA_THUOC_GAP", "DUNG_DUNG", "nhà có người đang nằm"],
  ["DI_TAP_THE_DUC", "CUONG", "đi tập là việc tự mình chọn, không ai giục"],
  ["DAT_CHO_DI_DAO", "CUONG", "dắt chó đi dạo mà cuống thì đó là đi tìm chó"],
  ["DI_UONG_CA_PHE", "CUONG", "hẹn cà phê là hẹn của người rảnh"],
  ["DAO_MOT_VONG", "CUONG", "không có đích thì không có gì để mà cuống"],
  ["DI_LE_CHUA", "GIAN", "đi lễ với cái mặt giận là đi sai chỗ"],
  ["DI_LE_CHUA", "CAU_GAT", "như trên"],
  ["DI_AN_CUOI", "GIAN", "giận thì người ta không tới"],
  ["DI_AN_CUOI", "NAO_LONG", "nặng lòng là tâm trạng của đám tang, không phải đám cưới"],
  ["DI_VAY_TIEN", "TU_HAO", "tự hào thì đã không phải đi hỏi vay"],
  ["DI_TIEN_NGUOI_NHA", "HON_HO", "hớn hở lúc tiễn người nhà về quê"],
];

test("không mục đích nào ghép được với một tâm trạng vô lý", () => {
  for (const [pid, sid, why] of CAM) {
    const p = purposeById(pid);
    assert.ok(p, `bảng CẤM nhắc mục đích '${pid}' mà dữ liệu không có — sửa bảng hoặc sửa dữ liệu`);
    assert.ok(stateById(sid), `bảng CẤM nhắc tâm trạng '${sid}' mà dữ liệu không có`);
    assert.equal(allows(p, sid), false, `${pid} × ${sid} — ${why}`);
  }
});

test("luật của chủ dự án đọc ngược lại vẫn đúng: trúng số VUI được, LO TIỀN được", () => {
  const p = purposeById("TRUNG_SO")!;
  assert.ok(allows(p, "VUI"));
  assert.ok(allows(p, "LO_TIEN"), "'có thể đi với lo lắng do số tiền lớn' — nguyên văn");
});

test("rút cả vạn lần cũng không rơi ra một cặp trong bảng CẤM", () => {
  const cam = new Set(CAM.map(([p, s]) => `${p}|${s}`));
  for (const b of BANDS) {
    const rng = new Rng(7788);
    for (let i = 0; i < 2500; i++) {
      const { purpose, state } = rollPurpose(rng, b);
      assert.ok(purpose.bands.includes(b), `${purpose.id} không thuộc ${b}`);
      assert.ok(allows(purpose, state.id), `${purpose.id} × ${state.id} ngoài danh sách trắng`);
      assert.equal(cam.has(`${purpose.id}|${state.id}`), false, `${purpose.id} × ${state.id}`);
    }
  }
});

test("cùng seed ra cùng một dãy người — khác seed thì khác", () => {
  const run = (seed: number) => {
    const rng = new Rng(seed);
    return Array.from({ length: 40 }, () => {
      const r = rollPurpose(rng, "PEAK");
      return `${r.purpose.id}|${r.state.id}`;
    });
  };
  assert.deepEqual(run(1234), run(1234));
  assert.notDeepEqual(run(1234), run(4321));
});

test("một lần rút tiêu ĐÚNG HAI số — chèn thêm là dịch cả dòng người đi ngang", () => {
  const rng = new Rng(99);
  rollPurpose(rng, "MID");
  assert.equal(rng.counter, 2);
  rollPurpose(rng, "MID");
  assert.equal(rng.counter, 4);
});

test("rút nhiều thì trải ra, không dính một chỗ", () => {
  const rng = new Rng(5);
  const seen = new Map<string, number>();
  for (let i = 0; i < 4000; i++) {
    const { purpose } = rollPurpose(rng, "MID");
    seen.set(purpose.id, (seen.get(purpose.id) ?? 0) + 1);
  }
  const list = purposesIn("MID");
  assert.ok(seen.size >= list.length * 0.9, `chỉ rút ra ${seen.size}/${list.length} mục đích`);
  // Weight DI_CHO_VE 10 so với TRUNG_SO 2.
  assert.ok((seen.get("DI_CHO_VE") ?? 0) > (seen.get("TRUNG_SO") ?? 0));
});

test("buyable là cái HÃM, không phải cái đẩy — và vội thì mời không nổi", () => {
  const tre = purposeById("DI_LAM_TRE")!, cho = purposeById("DI_CHO_VE")!;
  const nonNong = stateById("NON_NONG")!, vui = stateById("VUI")!;
  assert.ok(purposeInviteMul(tre, nonNong) < 0.1);
  assert.ok(purposeInviteMul(cho, vui) > purposeInviteMul(cho, stateById("MET")!));
  assert.ok(purposeInviteMul(cho, vui) <= 1.2, "không mục đích nào được đẩy người ta lên trên trần");
  for (const p of PURPOSES) {
    for (const s of statesOf(p)) assert.ok(purposeInviteMul(p, s) >= 0);
  }
});

test("hurry nằm trong 0..1 và tâm trạng kéo được nó hai chiều", () => {
  const cho = purposeById("DI_CHO")!;
  const thongTha = stateById("THONG_THA")!, sotRuot = stateById("SOT_RUOT")!;
  assert.ok(purposeHurry(cho, thongTha) < cho.hurry);
  assert.ok(purposeHurry(cho, sotRuot) > cho.hurry);
  for (const p of PURPOSES) {
    for (const s of statesOf(p)) {
      const h = purposeHurry(p, s);
      assert.ok(h >= 0 && h <= 1, `${p.id} × ${s.id} → hurry ${h}`);
      assert.ok(purposePatienceMul(p, s) >= 0.45);
      assert.ok(purposeAngerMul(p, s) > 0);
    }
  }
});

test("describe ra một dòng đọc được, không có số nào trong đó", () => {
  const p = purposeById("DI_CHO_VE")!;
  assert.equal(describe(p, stateById("MET")!), "đi chợ về · mệt");
  assert.doesNotMatch(describe(p, stateById("MET")!), /\d/);
});
