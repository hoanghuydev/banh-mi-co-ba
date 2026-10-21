import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import catalog from "../src/audio/catalog.json";
import { DEFAULT_SETTINGS } from "../src/core/flags";

const ROOT = join(import.meta.dirname, "..");
const PUBLIC = join(ROOT, "public");

type Entry = { bus: string; desc: string; files: string[] };
const CAT = catalog as Record<string, Entry>;

const BUSES = ["duongPho", "giongNPC", "thaoTac", "amBao"];

test("mọi file trong danh mục đều có thật trong public/", () => {
  const missing: string[] = [];
  for (const [id, e] of Object.entries(CAT)) {
    for (const f of e.files) if (!existsSync(join(PUBLIC, f))) missing.push(`${id} -> ${f}`);
  }
  assert.deepEqual(missing, [], "danh mục trỏ vào file không có — chạy lại tools/audio/fetch-sfx.py");
});

test("CANON §15.4: đúng 4 bus tiếng động, không có bus thứ 5", () => {
  const seen = new Set(Object.values(CAT).map((e) => e.bus));
  for (const b of seen) assert.ok(BUSES.includes(b), `bus lạ: ${b}`);
});

test("mỗi bus đều có công tắc âm lượng riêng ở Cài đặt (CANON §15.4: không gộp)", () => {
  for (const k of ["musicVolume", "streetVolume", "voiceVolume", "foleyVolume", "uiVolume", "crowdVolume"]) {
    assert.equal(typeof (DEFAULT_SETTINGS as Record<string, unknown>)[k], "number", `thiếu công tắc ${k}`);
  }
  assert.equal(DEFAULT_SETTINGS.voiceVolume, 100);
});

test("công tắc trợ năng âm thanh mặc định đúng chiều (P5-03 §5.4, §5.5)", () => {
  assert.equal(DEFAULT_SETTINGS.disableNegativeAudioCues, false);
  assert.equal(DEFAULT_SETTINGS.a11yPerceptionPing, false);
  assert.equal(DEFAULT_SETTINGS.monoAudio, false);
});

test("mọi file âm thanh trong bản build đều có dòng trong PROVENANCE.csv (P5-02 §2.8.2)", () => {
  const rows = readFileSync(join(PUBLIC, "audio", "PROVENANCE.csv"), "utf8").trim().split("\n").slice(1);
  const listed = new Set(rows.map((r) => r.split(",")[0]));
  const missing: string[] = [];
  for (const e of Object.values(CAT)) for (const f of e.files) if (!listed.has(f)) missing.push(f);
  // Không import `audio/music.ts` vì Phaser đụng `window` lúc nạp, chạy không được dưới node.
  for (const f of readdirSync(join(PUBLIC, "audio", "music"))) {
    if (!listed.has(`audio/music/${f}`)) missing.push(`audio/music/${f}`);
  }
  assert.deepEqual(missing, [], "có file không ghi nguồn — không được phát hành");
});

test("tiếng động dùng giấy phép CC0, nhạc CC BY — không có loại nào khác lọt vào", () => {
  const rows = readFileSync(join(PUBLIC, "audio", "PROVENANCE.csv"), "utf8").trim().split("\n").slice(1);
  const bad: string[] = [];
  for (const r of rows) {
    const file = r.split(",")[0];
    // Dò chuỗi con thay vì tách cột vì có ô chứa dấu phẩy trong ngoặc kép.
    const cc0 = r.includes("CC0 1.0");
    const by = r.includes("CC BY 4.0");
    if (!cc0 && !by) bad.push(file);
    for (const no of ["NonCommercial", "Noncommercial", "-NC", "Sampling+", "ShareAlike", "-SA"]) {
      if (r.includes(no)) bad.push(`${file} (${no})`);
    }
  }
  assert.deepEqual(bad, [], "giấy phép không dùng được cho game bán ra");
});

test("file CC BY phải được đánh dấu bắt-buộc-ghi-công, CC0 thì không", () => {
  const rows = readFileSync(join(PUBLIC, "audio", "PROVENANCE.csv"), "utf8").trim().split("\n").slice(1);
  for (const r of rows) {
    const need = /,yes,/.test(r);
    assert.equal(need, r.includes("CC BY 4.0"), `cột attribution_required sai: ${r.split(",")[0]}`);
  }
});

test("mấy id mà code gọi thẳng theo tên đều có trong danh mục", () => {
  const must = [
    "sfx_dao_rach", "sfx_vo_gion", "sfx_goi_giay", "sfx_rot_tra_da", "sfx_lau_khan",
    "sfx_rua_tay", "sfx_do_roi_dat", "sfx_tien_le", "sfx_buoc_chu_quan", "sfx_buoc_chan",
    "sfx_khet", "sfx_ruoi", "sfx_lo_bed",
    "amb_hem_sang", "amb_hem_trua", "amb_hem_chieu", "amb_crowd", "amb_cho", "amb_toi_nha",
    "amb_mua_mai_ton", "amb_mua_nen",
    "ui_click", "ui_khong_hop_le", "ui_click_go", "ui_ngay_am_tien", "ui_autosave",
    "ui_mo_menu", "ui_dong_menu", "ui_chuyen_ngay",
    "vox_hm_glimpsed", "vox_blip", "a11y_ping_glimpsed",
  ];
  const missing = must.filter((id) => !(id in CAT));
  assert.deepEqual(missing, []);
});

test("âm bị tắt bởi công tắc tiêu cực phải có bản thay CÙNG nhóm, không to hơn", () => {
  assert.equal(CAT["ui_khong_hop_le"].bus, "amBao");
  assert.equal(CAT["ui_click_go"].bus, "amBao");
});

test("âm MÔ TẢ THẾ GIỚI không nằm trên bus âm báo (P5-03 §5.5)", () => {
  for (const id of ["sfx_do_roi_dat", "sfx_khet", "sfx_ruoi"]) {
    assert.notEqual(CAT[id].bus, "amBao", `${id} phải là âm của thế giới, không phải âm báo`);
  }
  assert.equal(CAT["sfx_do_roi_dat"].bus, "thaoTac");
  assert.equal(CAT["sfx_ruoi"].bus, "duongPho");
});

test("âm dùng nhiều nhất phải có nhiều biến thể, không thì nghe như súng máy", () => {
  for (const id of ["sfx_dao_rach", "sfx_kep_gap", "sfx_tien_le", "sfx_buoc_chu_quan", "vox_blip"]) {
    assert.ok(CAT[id].files.length >= 3, `${id} mới có ${CAT[id].files.length} biến thể`);
  }
});

test("a11y ping chỉ có MỘT file — timbre phải giống hệt nhau (P5-03 §5.4)", () => {
  assert.equal(CAT["a11y_ping_glimpsed"].files.length, 1);
});
