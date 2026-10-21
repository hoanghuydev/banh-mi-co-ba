import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import catalog from "../src/audio/catalog.json";
import { DEFAULT_SETTINGS } from "../src/core/flags";

/**
 * Cổng của bộ âm thanh — P5-03 §2, §4, §5.
 *
 * Mấy thứ kiểm ở đây đều là loại HỎNG ÂM THẦM: game vẫn chạy, chỉ là một tiếng
 * không bao giờ phát, hoặc một file nằm trong bản build mà không có giấy phép rõ
 * ràng. Không có cái test nào thì chúng chỉ lộ ra khi có người nghe kỹ, hoặc khi
 * có người gửi thư.
 *
 * KHÔNG kiểm chất lượng nghe được — cái đó phải nghe bằng tai, không có cách nào
 * khác. Ở đây chỉ kiểm những thứ đếm được.
 */

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
  // §2.1 — `giongNPC` mặc định 100 và trần 0 dB: giọng người không bị gì đè lên.
  assert.equal(DEFAULT_SETTINGS.voiceVolume, 100);
});

test("công tắc trợ năng âm thanh mặc định đúng chiều (P5-03 §5.4, §5.5)", () => {
  // Tắt âm báo tiêu cực mặc định TẮT: người chơi phải CHỌN bỏ nó, không phải chọn lấy lại.
  assert.equal(DEFAULT_SETTINGS.disableNegativeAudioCues, false);
  // §5.4 ghi thẳng: tick báo-có-người-để-ý mặc định TẮT.
  assert.equal(DEFAULT_SETTINGS.a11yPerceptionPing, false);
  assert.equal(DEFAULT_SETTINGS.monoAudio, false);
});

test("mọi file âm thanh trong bản build đều có dòng trong PROVENANCE.csv (P5-02 §2.8.2)", () => {
  const rows = readFileSync(join(PUBLIC, "audio", "PROVENANCE.csv"), "utf8").trim().split("\n").slice(1);
  const listed = new Set(rows.map((r) => r.split(",")[0]));
  const missing: string[] = [];
  for (const e of Object.values(CAT)) for (const f of e.files) if (!listed.has(f)) missing.push(f);
  // Nhạc không tra qua `audio/music.ts`: file đó `import Phaser`, mà Phaser đụng
  // `window` ngay lúc nạp nên không chạy được dưới `node --test`. Đọc thẳng thư mục.
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
    // Cột `license` là cột 5; dòng có dấu phẩy trong ngoặc kép thì cột đầu vẫn đúng,
    // nên dò bằng chuỗi con thay vì tách cột — đủ chặt cho việc này.
    const cc0 = r.includes("CC0 1.0");
    const by = r.includes("CC BY 4.0");
    if (!cc0 && !by) bad.push(file);
    // Mọi thứ cấm đều có mặt ở đây dưới dạng chuỗi, vì cái cần chặn là chúng LỌT VÀO.
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
  /*
   * Danh mục do máy sinh từ `tools/audio/sources.py`, còn `sfx.play("…")` thì viết
   * tay. TypeScript đã bắt được sai tên lúc biên dịch — nhưng chỉ khi `catalog.json`
   * có mặt. Dòng này bắt trường hợp khác: ai đó xoá một id khỏi `sources.py` rồi
   * chạy lại tool, và quên rằng có chỗ đang gọi nó.
   */
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
  // §4.2 C: `ui_khong_hop_le` -> `ui_click_go`, "cùng độ to". Cùng bus là điều kiện
  // cần; cùng mức RMS thì đã lo ở `sources.py` (hai bộ dùng chung preset `UI`).
  assert.equal(CAT["ui_khong_hop_le"].bus, "amBao");
  assert.equal(CAT["ui_click_go"].bus, "amBao");
});

test("âm MÔ TẢ THẾ GIỚI không nằm trên bus âm báo (P5-03 §5.5)", () => {
  /*
   * Ranh giới một dòng của §5.5: *âm mô tả thế giới thì giữ; âm chấm điểm người
   * chơi thì bỏ.* Công tắc "tắt âm báo tiêu cực" chỉ được đụng tới bus `amBao`.
   * Nên bánh rớt, bánh khét và ruồi bay mà trôi sang bus đó là chúng tắt được —
   * và người nhìn không rõ mất cách duy nhất biết chuyện vừa xảy ra.
   */
  for (const id of ["sfx_do_roi_dat", "sfx_khet", "sfx_ruoi"]) {
    assert.notEqual(CAT[id].bus, "amBao", `${id} phải là âm của thế giới, không phải âm báo`);
  }
  assert.equal(CAT["sfx_do_roi_dat"].bus, "thaoTac");
  assert.equal(CAT["sfx_ruoi"].bus, "duongPho");
});

test("âm dùng nhiều nhất phải có nhiều biến thể, không thì nghe như súng máy", () => {
  // Con số nhỏ hơn bảng BT của §4.2 (bộ tạm chỉ 3–6 thay vì 5–8) và bù bằng rung
  // cao độ lúc chạy (`JITTER` trong `sfx.ts`) — nhưng dưới 3 thì rung cũng không cứu.
  for (const id of ["sfx_dao_rach", "sfx_kep_gap", "sfx_tien_le", "sfx_buoc_chu_quan", "vox_blip"]) {
    assert.ok(CAT[id].files.length >= 3, `${id} mới có ${CAT[id].files.length} biến thể`);
  }
});

test("a11y ping chỉ có MỘT file — timbre phải giống hệt nhau (P5-03 §5.4)", () => {
  // "Cùng một âm cho sự kiện tốt và xấu" là ĐIỀU KIỆN TỒN TẠI của nó: nó báo
  // "có người để ý tới bạn", không báo "bạn vừa làm sai". Nhiều biến thể là mở
  // đường cho việc lỡ tay làm cái "xấu" nghe tối hơn cái "tốt".
  assert.equal(CAT["a11y_ping_glimpsed"].files.length, 1);
});
