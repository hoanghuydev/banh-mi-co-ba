# P0-03 — Đo lường và công cụ dev

**Thuộc phase:** P0 — Nền tảng
**Phụ thuộc:** `P0-01` (EventBus, `GameContext`, dev build), `P0-02` (clock, rng, save) · `CANON.md` §5 (certainty), §8 (12 lỗ hổng), §11 (rule DB, số dòng thoại), §12 (memory/gossip), §15 (trợ năng), §17 (bản đồ phase, cổng P1)
**Trạng thái:** **Chốt** về công cụ · **Còn mở** các ngưỡng cảnh báo ở §5 (chốt sau 3 ngày đo đầu tiên)

---

## 1. Mục tiêu

Trả lời **một câu hỏi duy nhất bằng con số**: *một ngày chơi mất bao nhiêu phút thật → 40 ngày = bao nhiêu giờ?* Đây là cổng đầu tiên của §23 tuần 1–2: *"Nếu bạn chưa đo, bạn chưa thiết kế."*

Và dựng ba công cụ để P1–P4 không phải đoán: **debug overlay** (nhìn thấy `certainty`, rule nào thắng, gossip đi đâu), **validator nội dung** (rule chết, fact mồ côi, thoại thiếu biến thể), **giao thức playtest** cho cổng cứng P1 (**≥7/10 người lạ trả lời đúng "vì sao khách đó giận"**).

Cả ba phục vụ **T5**: attention phải nhìn thấy được. Nếu *người làm game* không nhìn thấy được `certainty` thì không có cách nào biết *người chơi* có nhìn thấy không.

---

## 2. Cơ chế

### 2.1. Telemetry cục bộ

**Nguyên tắc:** game là **client-only, offline-first** (CANON §2). Telemetry **không gửi đi đâu cả** — nó ghi ra file cạnh save, có công tắc, và có nút *"Xuất file gửi cho người làm game"*. Ở bản dev/playtest thì mặc định **bật**; ở bản bán ra thì mặc định **tắt** và có một màn hình hỏi rõ.

Hạ tầng đã có sẵn: mọi thứ đáng đo đều đã là một event trên bus (`P0-01` §2.5). Telemetry chỉ là **một listener ghi ra JSONL**.

```ts
// core/telemetry.ts — một listener, không phải một hệ thống
const WATCHED = ['day:started','day:ended','npc:arrived','npc:left','order:placed',
  'order:delivered','delivery:diffed','stim:emitted','perception:stateChanged',
  'attention:toolUsed','dialog:selected','dialog:silent','gossip:propagated',
  'gossip:overheard','money:changed','save:written','ui:pauseToggled',
  'scene:transition','notebook:hypothesisResolved','telemetry:mark'] as const;

type Row = { t: number; realMs: number; gameMin: number; day: number; e: string; p: unknown };
// Ghi vào ring buffer 20.000 dòng, flush ra file mỗi lần 'day:ended' (ngoài frame).
// ~600 dòng/ngày × ~120 B ≈ 72 KB/ngày → 40 ngày ≈ 2,9 MB. Chấp nhận được.
```

**Chỉ số dẫn xuất — tính lúc `day:ended`, ghi vào một file tổng hợp riêng:**

```ts
type DayMetrics = {
  dayIndex: number;

  // ── CÂU HỎI SỐ 1 ────────────────────────────────────────────────
  realMsTotal:        number;   // từ 'day:started' đến 'day:ended'
  realMsByScene:      Record<SceneKey, number>;      // Market / Stall / Evening
  realMsPaused:       number;   // KHÔNG tính vào tổng — người chơi đi pha cà phê
  realMsMenu:         number;
  realMsActive:       number;   // = total − paused − menu  ← con số dùng để ngoại suy

  // ── nhịp một khách ──────────────────────────────────────────────
  customersServed:    number;
  customersLost:      Record<'IMPATIENT'|'SILENT_EXIT'|'SOLD_OUT'|'REFUSED', number>;
  msPerCustomer:      { p50: number; p90: number; max: number };
  msPerCustomerByBand: Record<TimeBand, number>;
  queueLenMax:        number;

  // ── tỉ lệ lỗi theo loại (11 sự kiện CANON §3) ───────────────────
  stimEmitted:        Record<StimId, number>;
  stimConfirmed:      Record<StimId, number>;        // bao nhiêu cái bị BẮT
  confirmRate:        Record<StimId, number>;        // confirmed / emitted
  defectsSpoken:      number;   defectsSilent: number;
  anticipatedVsDiscovered: { anticipated: number; discovered: number };

  // ── công cụ hạ attention (CANON §5.4) ───────────────────────────
  attentionToolUses:  Record<AttentionTool, number>;
  attentionToolSuccess: Record<AttentionTool, number>;  // dùng rồi KHÔNG bị bắt trong 3 s sau

  // ── thoại (chống lặp — HT6) ─────────────────────────────────────
  linesSpoken:        number;
  uniqueLinesSpoken:  number;
  lineRepeatWithin2h: number;                        // ← cổng của Sarah, xem §5
  silentNoticeRate:   number;                        // mục tiêu ~0,35 (CANON §11)
  barkTierMix:        Record<1|2|3, number>;

  // ── hệ thống ────────────────────────────────────────────────────
  fpsP5:              number;   frameMsP95: number;
  saveWriteMsP99:     number;   saveBytes: number;
  bubblePoolSteals:   number;                        // >0 = lỗi cân bằng, P0-01 §2.6
  dialogQueriesDeferred: number;
};
```

**Ngoại suy ra con số của cả mùa:**

```
gioMuaUocTinh = Σ(realMsActive của N ngày đã đo) / N × 40 / 3_600_000
```
Dùng `realMsActive` (đã trừ pause và menu), vì pause là hành vi của đời thật chứ không phải độ dài game. Nhưng **báo cáo cả hai con số** — người mua trên Steam thấy "playtime" gồm cả pause.

**Bảng quyết định theo kết quả đo** (ngưỡng từ §23):

| `gioMuaUocTinh` | Kết luận | Hành động |
|---|---|---|
| **< 4 giờ** | **Quá ngắn** — §23 nói thẳng | Giảm `SEASON_DAYS` 40 → 30 **và** tăng mật độ: nhiều khách hơn mỗi ngày, nhiều sự kiện arc hơn mỗi ngày. **Không** kéo dài bằng cách tăng thời gian chờ |
| 4–6 giờ | Ngắn nhưng đủ | Giữ 40 ngày, tăng mật độ nhẹ (thêm 2–3 khách vãng lai/ngày) |
| **6–8 giờ** | **Vùng mục tiêu** | Không đổi. `P0-02` §2.1 ước tính 6,8 — nếu đo trúng vùng này thì mô hình đúng |
| 8–10 giờ | Hơi dài | Tăng `TIME_SCALE_IDLE_LULL` (tua nhanh giờ vắng mạnh hơn), rút `EveningScene` |
| **> 10 giờ** | **Quá dài** | Cắt xuống 30–35 ngày. Rủi ro thật: người chơi bỏ dở **trước cú quay lại ngày 40**, mà cú đó là toàn bộ điểm kết (T4) |

**Đo khi nào:** từ ngày đầu có `StallScene` chạy được (P0), **không đợi P1**. Ba lần đo bắt buộc: cuối P0 (khung rỗng, chỉ có nhịp), cuối P1 (3 NPC thật), cuối P3 (kinh tế đủ). Mỗi lần ≥ 5 ngày liên tục, ≥ 2 người chơi khác nhau.

### 2.2. Dev console / debug overlay

**Chỉ ở dev build.** Vite `define: { __DEV_TOOLS__: mode !== 'production' }`; mọi code overlay nằm trong `if (__DEV_TOOLS__) { … }` → tree-shake sạch khỏi bản phát hành. Cổng: `grep -c "certainty" dist/assets/*.js` trong bản production phải ra **0** cho phần UI debug.

> ⚠️ **Không bao giờ có chế độ "hiện certainty" trong bản bán ra.** Vi phạm **T5** ở chiều ngược: T5 đòi attention *nhìn thấy được qua biểu hiện của NPC*, không phải qua một thanh số. Một thanh số làm người chơi ngừng nhìn mặt người — và nhìn mặt người là cả game.

**Bật:** `?debug=1` trên web, `--dev-tools` trên Electron. Phím `F1` bật/tắt.

| Panel | Phím | Hiện gì | Dùng để |
|---|---|---|---|
| **P1 · Perception** | `F2` | Với mỗi NPC ở quầy: một hàng cho mỗi `stim` đang sống — `stimId · certainty (2 chữ số) · state · rate · từng thừa số (salience × visibility × occluder × gaze × trait)` | Tune §5. **Thấy ngay thừa số nào đang giết công thức** |
| **P2 · Rule query** | `F3` | Truy vết query gần nhất: concept, blackboard snapshot, **rule thắng + `score`**, 5 rule sát nút + lý do bị loại (criterion nào fail), số rule bị early-reject, thời gian query | Trả lời câu hỏi đắt nhất của rule DB: *"tại sao nó lại nói câu đó?"* |
| **P3 · Gossip graph** | `F4` | 12 NPC dạng vòng tròn, cạnh = fact đã truyền, nhãn = `hop · confidence · mutatedTo`. Đỏ = tin xấu, xanh = tin tốt. Bôi đậm cạnh mà **người chơi đã nghe lỏm được** | Kiểm ràng buộc §12: hop cap 2–3, confidence 0.7–0.85, **nguồn truy vết được**, tin tốt lan nhanh hơn tin xấu |
| **P4 · Memory** | `F5` | 3 tầng slot của NPC đang chọn: kind, intensity, `0.75^(n-1)` đã áp, ngày tạo, `source` (WITNESSED / TOLD_BY ai) | Kiểm luật ghi đè **intensity thấp nhất** (không phải cũ nhất) |
| **P5 · Clock & RNG** | `F6` | `gameMin`, band, `TIME_SCALE` hiệu lực, bộ đếm 6 stream, `daySeed` | Chẩn đoán lệch tất định |
| **P6 · Perf** | `F7` | Frame ms theo từng bước §2.4 của `P0-01`, số GameObject, draw call, pool steals, query bị hoãn | Giữ ngân sách `P0-01` §2.8 |
| **P7 · Econ** | `F8` | Kho + hạn dùng còn lại, giá chợ hôm nay + pattern, sổ nợ, nghĩa vụ sắp tới | P3 |

**Bảng điều khiển (console lệnh, `~` để mở):**

```
day.skipTo("08:15")            # tua đồng hồ tới giờ
day.fastForward(4)             # nhân TIME_SCALE ×4 (KHÔNG đổi dt của certainty — xem dưới)
day.end()                      # đóng quầy ngay
day.replay()                   # chơi lại ngày từ dayStartSnapshot

npc.spawn("BA_BAY", "FRONT_CENTER")
npc.gaze("BA_BAY", 0.05)       # ép khách bấm điện thoại
npc.mood("ONG_HAI", "SAY")     # ép tâm trạng nền (§9.2 mục 20)

stim.fire("DROPPED_FOOD", "HANDS")
stim.fire("WRONG_NAME")        # bỏ qua gazeFactor theo CANON §3.1

gossip.seed("BA_BAY", "roi_banh_xuong_dat")
gossip.tick()                  # chạy tick ngày ngay lập tức
gossip.graph()                 # dump adjacency ra console

rule.why()                     # in truy vết query gần nhất (giống P2 nhưng vào clipboard)
rule.test({concept:"NOTICE_DROP", npc:"CHI_LAN", mood:"BUC"})   # query khô, không phát thoại

sim.headless(40)               # chạy 40 ngày không render, in DayMetrics — xem §2.3
bus.dump()                     # ring buffer 2.000 event ra file
```

**Một cái bẫy phải tránh trong `day.fastForward`:** tua nhanh **chỉ được** nhân `TIME_SCALE` (phút game), **không được** nhân `dt` (giây thật). Nếu nhân cả `dt` thì `certainty` tích luỹ nhanh gấp 4 và mọi thứ quan sát được trong lúc tua đều sai. Tua nhanh là để **đi tới trạng thái kinh tế xa**, không phải để quan sát perception.

**Chế độ headless — công cụ đáng giá nhất trong danh sách này:**

```bash
npm run sim -- --days 40 --seed test-01 --policy greedy --out metrics.json
```
Chạy được vì `sim/ dialog/ craft/ econ/` **không import `phaser`** (cổng CI ở `P0-01`). 40 ngày chạy < 20 giây. Dùng để: tune cân bằng kinh tế, tìm dominant strategy (§8), kiểm rule nào không bao giờ được chọn trong 40 ngày thật (bổ sung cho validator tĩnh ở §2.3), và kiểm tất định (chạy 2 lần so byte).

### 2.3. Công cụ kiểm thử nội dung

Chạy bằng Node, **không cần trình duyệt**. Gắn vào `pre-commit` và CI. Lỗi `ERROR` chặn commit; `WARN` in ra nhưng cho qua.

#### (a) `validate-rules` — validator cho rule DB

```bash
npm run validate:rules           # đọc content/rules/**/*.json + content/lines/**/*.json
```

| Mã | Mức | Kiểm gì | Vì sao |
|---|---|---|---|
| `R001` | **ERROR** | **Rule không bao giờ match được**: criterion tham chiếu key không có trong `BlackboardSchema` | Rule chết im lặng — không crash, chỉ là không bao giờ nói. Loại bug tốn nhất để tìm bằng tay |
| `R002` | **ERROR** | Hai criterion **mâu thuẫn** trên cùng key (`mood == BUC` và `mood == VUI`; `visitCount > 10` và `visitCount < 3`) | Như trên |
| `R003` | **ERROR** | `concept` không có ai `emit` — grep toàn bộ `dialog:requested` trong `src/` | Rule viết cho một tình huống không tồn tại |
| `R004` | **ERROR** | `followup` trỏ tới `concept` không tồn tại | `followup` tra **lúc callback** (CANON §11) → lỗi này chỉ lộ ra khi chạy tới đó, có thể sau nhiều giờ chơi |
| `R005` | **ERROR** | `applycontext` có `key` mà không rule nào đọc | Trí nhớ ghi vào hư không. `applycontext` **là toàn bộ cơ chế trí nhớ** của rule DB — mục này thủng là hệ trí nhớ thủng |
| `R006` | **WARN** | **Fact / blackboard key không ai dùng**: khai báo trong schema, không criterion nào tham chiếu | Nợ kỹ thuật, hoặc dấu hiệu quên viết rule |
| `R007` | **WARN** | Response có **< 6 biến thể** | CANON §11: shuffle-bag 8 biến thể ≈ 25–30 dòng random. Dưới 6 thì bag ngắn quá, người chơi nghe lại trong một buổi. **Sàn cứng: 6. Mục tiêu: 8** |
| `R008` | **ERROR** | Hai rule **trùng hệt** (cùng `concept`, cùng tập criterion) | Một trong hai không bao giờ thắng — `score = criteria.length` nên hoà, và hoà thì thứ tự load quyết định = không xác định |
| `R009` | **WARN** | Rule bị **che khuất**: cùng concept, criteria là tập con của rule khác nhưng không có rule nào tổng quát hơn nó | Không hỏng, nhưng thường là dấu hiệu viết nhầm |
| `R010` | **ERROR** | `speakonce: true` **và** `norepeat: true` cùng lúc | Mâu thuẫn ngữ nghĩa |
| `R011` | **ERROR** | `odds` ngoài `[0,100]`; `applycontext.duration_sec` ≤ 0 | |
| `R012` | **WARN** | Concept **không có rule tier-3** làm lưới an toàn | CANON §11: bark 3 tầng, tier-3 (*"Hửm."*) là lưới an toàn. Thiếu nó = có tình huống NPC câm |
| `R013` | **ERROR** | `stimId` / `NpcId` / `StimId` trong content không thuộc danh sách CANON (11 sự kiện, 12 NPC) | Chống trôi định danh — CANON §3, §9 |
| `R014` | **WARN** | NPC không có dòng riêng cho **tình huống đặc trưng** của mình (bà Bảy–cải lương, chị Hạnh–từ Bắc, chú Kiệt–đối thủ) | CANON §11 đòn bẩy 2: pool generic + dòng riêng cho tình huống đặc trưng. Thiếu dòng riêng = 12 NPC nói giống nhau |

**Cách kiểm `R001`/`R002` — walk tuyến tính, tái dùng chính engine:**

```ts
// Criteria đã sort theo alphabet để walk tuyến tính + early reject (CANON §11).
// Validator dùng đúng thứ tự đó, nên nếu validator bảo "không match được"
// thì runtime cũng không match được — không có kẽ hở giữa hai bên.
function isSatisfiable(rule: Rule, schema: BlackboardSchema): Diagnosis {
  const byKey = groupBy(rule.criteria, c => c.key);
  for (const [key, cs] of byKey) {
    const def = schema[key];
    if (!def) return { code: 'R001', detail: `key '${key}' không có trong blackboard` };
    const range = intersectAll(cs.map(c => toRange(c, def)));
    if (range.isEmpty) return { code: 'R002', detail: `'${key}': ${cs.map(fmt).join(' ∧ ')}` };
  }
  return OK;
}
```

#### (b) `lint-lines` — linter cho file thoại

```bash
npm run lint:lines               # đọc content/lines/**/*.json
```

| Mã | Mức | Kiểm gì | Ngưỡng / lý do |
|---|---|---|---|
| `L001` | **ERROR** | **Biến nội suy chưa định nghĩa**: `{npcName}`, `{usual}`, `{itemVi}` không có trong scope của rule đó | Chạy tới mới lộ. Lỗi hiển thị `{npcName}` trên màn hình là lỗi gây refund |
| `L002` | **ERROR** | Biến đúng tên nhưng **sai scope** (`Session` dùng ở concept không có session) | Như trên |
| `L003` | **WARN** | **Độ dài**: > 90 ký tự hiển thị, hoặc > 2 dòng khi render ở `fontScale = 2` với bề rộng bong bóng chuẩn | CANON §15.1: chữ ≥200% và hộp **tự giãn**. Linter mô phỏng wrap thật bằng cùng hàm đo, không đoán |
| `L004` | **ERROR** | **Unicode NFD** (dấu tách rời): `ề` viết thành `e` + `◌̀` + `◌̂` | Trộn NFC/NFD làm so sánh chuỗi và đếm ký tự sai; font hiển thị lệch dấu. Ép **NFC** toàn bộ |
| `L005` | **WARN** | **Kiểu đặt dấu không nhất quán**: `oà/òa`, `uỷ/ủy`, `hoà/hòa` trộn lẫn trong cùng repo | Chọn **một** chuẩn (đề xuất: kiểu cũ `oà`, `uỷ` — tông hoài niệm hợp với game), linter ép nhất quán |
| `L006` | **ERROR** | **Chữ tiếng Việt bị mất dấu**: heuristic — một câu ≥ 5 từ mà 0 từ có dấu, và có từ trong bảng "dễ mất dấu" (`banh mi`, `co Ba`, `do chua`) | Lỗi copy-paste rất hay gặp, và rất xấu mặt với người Việt |
| `L007` | **ERROR** | **VIẾT HOA TOÀN BỘ** | CANON §15: *"Không viết hoa toàn bộ"* |
| `L008` | **WARN** | **Từ giọng Bắc trong pool giọng Nam**: `bát`→`chén`, `mũ`→`nón`, `bố/mẹ`→`ba/má`, `ngô`→`bắp`, `vào`→`vô`, `lạc`→`đậu phộng`, `dứa`→`thơm` | CANON §2: tiếng Việt **giọng miền Nam**. **Allowlist theo NPC**: `CHI_HANH` được miễn (§9: *"người Bắc mới vô Sài Gòn, gọi món bằng từ Bắc"*) — đây là đặc điểm nhân vật, không phải lỗi |
| `L009` | **ERROR** | **Đại từ xưng hô bị dịch** trong file `en`: `co/con/chu/chi/anh/em` bị đổi thành `aunt/uncle/you` | CANON §2: **KHÔNG dịch đại từ xưng hô.** Đây là một trong những điều dễ bị dịch giả "sửa giúp" nhất |
| `L010` | **ERROR** | **Chạm lằn ranh đỏ §14.1**: từ khoá chiến tranh (`lính`, `bộ đội`, `giải phóng`, `nón cối`, `B52`), hoặc chữ hạ thấp nghề (`chỉ là bán bánh mì`, `thoát khỏi`, `đổi đời`) | CANON §14.1: *"Chiến tranh — KHÔNG MỘT CHỮ"*, *"Hạ thấp nghề"*. Vi phạm là **chết**, không phải bị chê. Danh sách từ khoá do người Việt viết văn hoá duyệt, không tự sinh |
| `L011` | **WARN** | Dòng tiếng Việt có mà **thiếu phụ đề tiếng Anh** tương ứng | CANON §2 |
| `L012` | **WARN** | Hai dòng **giống nhau > 85%** trong cùng bag (Levenshtein chuẩn hoá) | 8 biến thể mà 3 cái gần giống nhau = bag thật chỉ có 6. Bắt "biến thể giả" |
| `L013` | **ERROR** | Ký tự không render được bằng font đã chọn (kiểm tra trực tiếp trong bảng glyph) | Tiếng Việt có dấu chồng dấu `ề ộ ỡ ữ`; một font thiếu glyph là ô vuông trên màn hình |

**Báo cáo:** in ra bảng, kèm `--fix` cho các lỗi máy sửa được (`L004` NFC, `L005` nhất quán kiểu dấu, `L007` viết hoa).

#### (c) `content-stats` — bảng đếm để đối chiếu mốc §11

```bash
npm run content:stats
```
In ra: tổng số dòng, tổng số từ, từ/dòng trung bình, số dòng theo NPC, theo concept, theo tier bark, số bag < 8 biến thể, tỉ lệ dòng generic / dòng riêng.

Đối chiếu mốc CANON §11: **v1/demo ~520 dòng ~5.000 từ** · beta nội bộ ~1.200 · full ~2.980 ~30.000 từ. Và đối chiếu tỉ lệ Firewatch **8,3 từ/dòng** — nếu số từ/dòng của ta là 20 thì ta đang viết văn chứ không viết bark, và 2.980 dòng sẽ thành 60.000 từ.

### 2.4. Giao thức playtest cho cổng P1

**Cổng cứng (CANON §17, `idea.md` §23 tuần 5–8):**

> Gửi **10 người lạ** chơi, quay màn hình. **Câu hỏi duy nhất: "Bạn có biết vì sao khách đó giận không?" Dưới 7/10 trả lời đúng = hệ thống chưa đọc được, và không lượng thoại nào cứu được nó.**

**Tuyển người (10 người):**

| Tiêu chí | Yêu cầu |
|---|---|
| Quan hệ | **Người lạ.** Không bạn bè, không người nhà, không người trong Hội Làm Game. Bạn bè sẽ đoán ý bạn và cho kết quả giả |
| Biết trước | Chưa xem trailer, chưa đọc mô tả, chưa nghe pitch. Chỉ biết *"một game nhỏ về bán bánh mì"* |
| Phân bố | 5 người chơi game cozy thường xuyên / 5 người không. Nếu chỉ tuyển người cozy thì đang đo sai tập |
| Ngôn ngữ | ≥ 7 người Việt (game gốc tiếng Việt giọng Nam). 2–3 người nước ngoài chơi bản phụ đề Anh để kiểm §2 (đại từ xưng hô không dịch) |
| Thiết bị | PC, tai nghe, chuột. Không dùng máy của dev |

**Quy trình một phiên (~35 phút):**

1. **(2 phút) Đọc kịch bản cố định.** Nguyên văn, giống nhau cho cả 10 người: *"Đây là bản thử. Bạn cứ chơi tự nhiên. Tôi sẽ không hướng dẫn gì. Nếu bạn bí, cứ bí — đó cũng là dữ liệu. Bạn nghĩ gì cứ nói ra thành tiếng."*
2. **(1 phút) Bật ghi màn hình + mic.** Webcam **tuỳ chọn**, hỏi rõ trước.
3. **(20 phút) Chơi vertical slice.** Người điều phối **không nói gì** — kể cả khi người chơi hỏi. Câu trả lời duy nhất được phép: *"Bạn cứ thử xem sao."*
4. **(hỏi tại chỗ) Câu hỏi cổng.** Xem bên dưới.
5. **(10 phút) Phỏng vấn sau**, các câu phụ (không tính điểm cổng).

**Thời điểm hỏi — quan trọng ngang câu hỏi:**

Hỏi **ngay tại khoảnh khắc**, không hỏi cuối buổi. Cụ thể: khi bus phát `perception:confirmed` dẫn tới một phản ứng tiêu cực rõ rệt (NPC nhíu mày + bark tier-1, hoặc NPC bỏ đi), build playtest **tự pause** và người điều phối hỏi.

Vì sao: hỏi cuối buổi thì người chơi đã tích luỹ 20 phút hiểu biết và sẽ suy luận ngược — họ trả lời đúng vì *đã ghép mảnh sau đó*, không phải vì *hệ thống đọc được lúc đó*. Cái cần đo là cái thứ hai.

**Hỏi đúng 2 lần mỗi người**, ở 2 sự kiện khác loại (một `DROPPED_FOOD`/`DIRTY_HANDS` kiểu quá trình, một `ORDER_DEFECT`/`WRONG_NAME` kiểu kết quả/quan hệ). Lấy **điểm trung bình 2 lần** làm điểm của người đó. Lý do: một lần duy nhất phụ thuộc quá nhiều vào may rủi của phiên.

**Câu hỏi, nguyên văn, không thêm không bớt:**

> **"Bạn có biết vì sao khách đó giận không?"**

Cấm tuyệt đối: gợi ý, nhắc lại, hỏi tiếp *"bạn có thấy bà ấy nhìn không?"*, hoặc hỏi *"vì sao bạn nghĩ vậy?"* **trước khi** chấm. Mọi câu hỏi đào sâu để sang bước 5.

**Cách chấm — rubric 3 mức, 2 người chấm độc lập:**

| Điểm | Mức | Định nghĩa | Ví dụ |
|---|---|---|---|
| **1,0** | **ĐÚNG** | Nêu **đúng sự kiện gốc** VÀ **đúng cơ chế** (khách đã *chứng kiến*, hoặc *phát hiện lúc ăn*) | *"Tại con làm rớt cái bánh mà bả đang nhìn."* · *"Tại thiếu hành, mà lúc đó ổng bấm điện thoại nên tới lúc ăn ổng mới biết."* |
| **0,5** | **GẦN ĐÚNG** | Đúng **sự kiện gốc**, không nêu được cơ chế | *"Chắc tại tôi làm rớt bánh."* (không biết bà có nhìn hay không) |
| **0** | **SAI** | Sai sự kiện, hoặc quy cho thứ không phải nguyên nhân, hoặc *"không biết"* | *"Chắc tại tôi chậm."* (khi không hề chậm) · *"Tại bả khó tính."* · *"Không biết."* · *"Game random ấy mà."* |

**Điểm cổng = Σ (trung bình 2 lần của mỗi người) trên 10 người. Đạt khi ≥ 7,0/10.**

**Độ tin cậy giữa 2 người chấm:** chấm **mù** (không thấy điểm của nhau), bằng transcript + video, không biết ai là dev. Tính **Cohen's kappa**; nếu κ < 0,7 thì rubric chưa đủ rõ → viết lại rubric và chấm lại, **không** lấy kết quả đó làm cổng. Bất đồng ở từng ca → người thứ ba phân xử.

**Ghi nhận phụ — không tính vào cổng nhưng ghi mọi phiên:**

| Chỉ số | Cách lấy | Dùng để |
|---|---|---|
| Thời điểm người chơi **lần đầu nhìn lên mặt khách** | Video + telemetry | Nếu > 5 phút thì bố cục đang giấu mặt khách |
| Có ai **tự thốt ra** *"ủa bả thấy kìa"* không | Ghi âm | Tiêu chí gốc của §13: *"người xem clip phải tự thốt ra mà không cần giải thích luật chơi"* |
| Số lần dùng **công cụ hạ attention** (§5.4) | `attention:toolUsed` | Nếu ≈ 0 thì cơ chế đang là **cờ bạc**, không phải trò chơi vị trí và timing — đúng cái Minh cảnh báo |
| Có ai **nghe lỏm** được gossip không | `gossip:overheard` | CANON §12 ràng buộc 4: không nghe lỏm được thì **bỏ luôn cả nhớ nhầm lẫn đồn thổi** |
| Có ai nghe lại **một dòng thoại** trong 2 giờ đầu | `lineRepeatWithin2h` | HT6 / Sarah: *"nghe lại một dòng trong 2 giờ đầu → hệ thống của bạn nông → Refund"* |
| Người chơi có hiểu **mình đang bị chấm quá trình** không | Câu phụ: *"Theo bạn, khách để ý những gì?"* | T1 |

**Nếu < 7,0 — chẩn đoán theo 3 nhánh, không được sửa bừa:**

| Nhánh | Dấu hiệu trong video | Nguyên nhân | Sửa |
|---|---|---|---|
| **A. Không nhìn thấy** | Mắt người chơi không bao giờ rời khỏi bàn làm bánh | Bố cục giấu mặt khách, hoặc gaze chưa được **vẽ ra** (§18.2: *"gaze phải được VẼ RA"*) | Sửa render/bố cục. **Không** thêm thoại |
| **B. Nhìn thấy nhưng không nối được nhân quả** | Người chơi nhìn lên, nhưng nói *"không biết vì sao"* | Độ trễ giữa sự kiện và phản ứng quá dài, hoặc bark tier-1 không đủ cụ thể, hoặc nhiều sự kiện chồng nhau | Rút ngắn độ trễ, làm tier-1 cụ thể hơn, siết `take(1)` |
| **C. Biết nhưng diễn đạt khác** | Người chơi mô tả đúng bằng từ khác, bị chấm 0 oan | **Rubric sai, không phải game sai** | Viết lại rubric, chấm lại. κ < 0,7 là dấu hiệu của nhánh này |

> **Không lượng thoại nào cứu được cổng này** (§23). Nếu trượt, **cấm** sửa bằng cách thêm dòng thoại giải thích. Thêm *"tôi thấy con làm rớt bánh đó nha"* làm điểm cổng lên nhưng giết T1 — khách đang **tường thuật luật chơi** thay vì **phản ứng như người**.

### 2.5. Bảng chỉ số theo dõi hằng tuần

Một trang, cập nhật mỗi thứ Sáu. Ba nhóm: **sản phẩm** (game có đang tốt lên không), **nội dung** (có đủ chưa), **thị trường** (có ai muốn không).

| # | Chỉ số | Nguồn | Mục tiêu | Đèn đỏ | Từ tuần |
|---|---|---|---|---|---|
| **A · SẢN PHẨM** ||||||
| A1 | **Phút thật / ngày chơi** | `DayMetrics.realMsActive` | 9–12 | < 7 hoặc > 16 | P0 |
| A2 | **Giờ ước tính cả mùa (40 ngày)** | Ngoại suy §2.1 | 6–8 | **< 4** → hành động ngay | P0 |
| A3 | Giây thật / khách (p50) | `msPerCustomer.p50` | 20–30 | > 45 | P0 |
| A4 | Khách mất / ngày | `customersLost` | ≤ 2 | > 4 | P1 |
| A5 | `confirmRate` của `DROPPED_FOOD` | `DayMetrics` | 0,55–0,75 | < 0,3 (không ai bị bắt) hoặc > 0,9 (không né được) | P1 |
| A6 | Lượt dùng công cụ hạ attention / ngày | `attentionToolUses` | ≥ 3 | **0** → cơ chế thành cờ bạc | P1 |
| A7 | Tỉ lệ im lặng khi nhận thấy | `silentNoticeRate` | 0,30–0,40 | < 0,2 (cằn nhằn) hoặc > 0,5 (câm) | P1 |
| A8 | Tỉ lệ sự kiện **tích cực / tiêu cực** trải nghiệm thực | `stimEmitted` | ≥ 1,0 | < 0,8 → *"game cằn nhằn"* (§9.7) | P1 |
| A9 | Dòng thoại nghe lại trong 2 giờ đầu | `lineRepeatWithin2h` | **0** | ≥ 1 | P1 |
| A10 | fps p5 / frame ms p95 | `DayMetrics` | ≥ 30 / ≤ 31 ms | < 25 / > 40 ms | P0 |
| A11 | `save:written.ms` p99 | `DayMetrics` | ≤ 5 ms | > 10 ms | P0 |
| A12 | Số lần "cướp" bubble pool | `bubblePoolSteals` | 0 | > 0 | P0 |
| A13 | Gossip chain người chơi **nghe lỏm được** / ngày | `gossip:overheard` | ≥ 1 (sau khi mở khoá) | 0 trong 3 ngày liền | P1 |
| **B · NỘI DUNG** ||||||
| B1 | Tổng dòng thoại / tổng từ | `content:stats` | Theo mốc §11 | Lệch > 25% | P1 |
| B2 | Từ / dòng trung bình | `content:stats` | 8–12 (Firewatch 8,3) | > 16 | P1 |
| B3 | Bag có < 8 biến thể | `content:stats` | 0 bag < 6 | Bất kỳ bag < 6 | P2 |
| B4 | Lỗi `validate:rules` ERROR / WARN | CI | 0 / < 20 | ERROR > 0 | P1 |
| B5 | Lỗi `lint:lines` ERROR / WARN | CI | 0 / < 30 | ERROR > 0 | P1 |
| B6 | Rule **không bao giờ được chọn** trong `sim.headless(40)` | Headless | < 5% tổng rule | > 15% | P2 |
| B7 | NPC đã có mặt + giọng riêng | Thủ công | Theo phase | Chậm > 1 tuần | P2 |
| **C · THỊ TRƯỜNG** ||||||
| C1 | **Wishlist** | Steamworks | **5.000** (tuần 12) | **< 2.000 ở tuần 12 → DỪNG LẠI** | Tuần 9 |
| C2 | Wishlist tăng / tuần | Steamworks | — | 2 tuần liền giảm | Tuần 9 |
| C3 | Clip đăng / tuần | Thủ công | 3 | < 2 | Tuần 10 |
| C4 | Lượt chơi demo itch.io | itch.io | — | — | Tuần 9 |
| C5 | Playtest người lạ tích luỹ | Thủ công | ≥ 10 trước cổng P1 | — | P1 |
| C6 | **Điểm cổng P1** (§2.4) | Rubric | **≥ 7,0/10** | < 7,0 → không qua P2 | P1 |

**Luật đọc bảng:** một đèn đỏ ở nhóm A = sửa tuần này. Đèn đỏ ở **C1 tuần 12** = **dừng dự án** (CANON §17 cổng cứng) — vấn đề nằm ở hook hoặc art, không nằm ở việc chưa làm đủ nội dung.

---

## 3. Dữ liệu & schema

```ts
// core/telemetry.ts
export type TelemetryRow = {
  t: number;          // thứ tự tăng dần
  realMs: number;     // performance.now() từ lúc vào game
  gameMin: number;    // vị trí đồng hồ game
  day: number;
  e: keyof EventMap;
  p: unknown;         // payload, đã cắt field nặng (không ghi blackboard đầy đủ)
};

export type PlaytestRecord = {
  sessionId: string; testerId: string;          // ẩn danh: "T-03"
  cohort: 'COZY' | 'NON_COZY';  lang: 'vi' | 'en';
  buildId: string;  dateIso: string;
  gateQuestions: {
    atRealMs: number;
    stimId: StimId;
    npcId: NpcId;
    npcObsState: ObsState;                      // state THẬT lúc hỏi — để đối chiếu
    answerVerbatim: string;                     // chép nguyên văn, không tóm tắt
    scoreRaterA: 0 | 0.5 | 1;
    scoreRaterB: 0 | 0.5 | 1;
    scoreFinal:  0 | 0.5 | 1;                   // bằng nhau, hoặc do người thứ ba
  }[];                                          // đúng 2 mục
  secondary: {
    firstLookAtFaceMs: number | null;
    saidBaThayKia: boolean;
    attentionToolUses: number;
    overheardGossip: boolean;
    lineRepeatWithin2h: number;
  };
  notes: string;
};
```

**Ví dụ content thật** — `content/rules/notice_drop.json`, đã qua validator:

```json
{
  "id": "rule.notice_drop.ba_bay.friend",
  "concept": "NOTICE_DROP",
  "criteria": [
    { "key": "Customer.npcId",     "op": "eq",  "value": "BA_BAY" },
    { "key": "Customer.obsState",  "op": "gte", "value": "NOTICED" },
    { "key": "Customer.tier",      "op": "eq",  "value": "FRIEND" }
  ],
  "responses": [{
    "id": "r1",
    "variants": [
      "Ủa con, cái bánh đó rớt xuống đất rồi mà?",
      "Con ơi, cái ổ đó rớt rồi đó nghen.",
      "Ê ê — rớt rồi kìa con.",
      "Thôi bỏ đi con, đừng có tiếc.",
      "Cái đó rớt rồi, làm ổ khác đi con.",
      "Rớt rồi đó con, cô thấy nè.",
      "Con, cái bánh…",
      "Ối, rớt rồi."
    ],
    "en": ["That bánh mì just hit the ground, con.", "…"]
  }],
  "applycontext": [["Customer.sawDropToday", true, 86400]],
  "followup": ["SELF", "DROP_AFTERMATH", 4.0],
  "speakonce": false, "norepeat": true, "odds": 100,
  "tier": 1
}
```
`score` **không** ghi trong file — tính sẵn lúc load (`= criteria.length = 3`), CANON §11.

**File telemetry thật** — `telemetry/day_07.jsonl` (rút gọn):

```jsonl
{"t":1,"realMs":0,"gameMin":360,"day":7,"e":"day:started","p":{"daySeed":2418367241,"weather":"MUA"}}
{"t":42,"realMs":91340,"gameMin":404,"day":7,"e":"stim:emitted","p":{"stimId":"DROPPED_FOOD","zone":"HANDS","salience":75}}
{"t":43,"realMs":92760,"gameMin":405,"day":7,"e":"perception:stateChanged","p":{"npcId":"BA_BAY","stimId":"DROPPED_FOOD","from":"NOTICED","to":"CONFIRMED","certainty":1.02}}
{"t":44,"realMs":93090,"gameMin":405,"day":7,"e":"bark:queued","p":{"npcId":"BA_BAY","tier":1,"delaySec":0.28}}
{"t":48,"realMs":98210,"gameMin":407,"day":7,"e":"save:written","p":{"bytes":47120,"ms":1.8,"slot":"B"}}
```

---

## 4. UI/UX hai thiết bị

Toàn bộ công cụ ở doc này là **dev-only** và **không có mặt trong bản bán ra**. Ràng buộc trình bày:

| Thành phần | Quy tắc |
|---|---|
| Debug overlay | DOM overlay riêng, `z-index` trên cùng, nền đen 85% để đọc được trên nền sáng. Font mono. **Không** nằm trong ngân sách GameObject (`P0-01` §2.8) |
| Bật/tắt | `F1`. Panel nhớ trạng thái trong `sessionStorage` (không vào save) |
| Trên bản playtest gửi người lạ | **Tắt hoàn toàn**, không có phím tắt nào bật được. Build riêng, cờ `__DEV_TOOLS__ = false` |
| Nút "Xuất telemetry" | Có ở **cả** bản playtest: một nút trong cài đặt, ghi ra file `.jsonl` để người chơi gửi lại. Có câu giải thích ghi gì, **không gửi đi đâu** |
| Công tắc telemetry | Bản bán ra: mặc định **tắt**, có màn hình hỏi rõ một lần |
| Mobile | Không hỗ trợ overlay (v2). `sim.headless` là công cụ thay thế |

---

## 5. Tham số cần tune

| Tên | Giá trị khởi điểm | Khoảng | Cách đo |
|---|---|---|---|
| `TELEMETRY_RING_ROWS` | 20.000 | 10k–50k | Số dòng/ngày thực tế × hệ số an toàn 2 |
| `TELEMETRY_FLUSH_ON` | `day:ended` | — | Đo `ms` của lần flush; phải ngoài frame |
| `METRICS_MIN_DAYS` | 5 | 3–10 | Độ lệch chuẩn của `realMsActive` giữa các ngày. Nếu > 25% thì cần nhiều ngày hơn |
| `METRICS_MIN_TESTERS` | 2 | 2–5 | Độ lệch giữa người chơi |
| `SEASON_HOURS_TARGET` | 6–8 | 4–10 | §2.1 bảng quyết định |
| `SEASON_HOURS_FLOOR` | **4** | — | **Cố định** (§23). Dưới ngưỡng → giảm số ngày, tăng mật độ |
| `GATE_P1_SCORE` | **7,0 / 10** | — | **Cố định** (§23, CANON §17) |
| `GATE_P1_TESTERS` | **10** | — | **Cố định** |
| `GATE_P1_QUESTIONS_PER_TESTER` | 2 | 2–3 | Độ lệch điểm giữa 2 lần của cùng người. > 0,5 → cần 3 lần |
| `RATER_KAPPA_MIN` | 0,70 | 0,6–0,8 | Cohen's kappa giữa 2 người chấm |
| `LINE_VARIANT_FLOOR` | **6** | — | `R007`. Sàn cứng |
| `LINE_VARIANT_TARGET` | **8** | 8–12 | CANON §11 |
| `LINE_MAX_CHARS` | 90 | 70–120 | Mô phỏng wrap ở `fontScale = 2` |
| `LINE_SIMILARITY_MAX` | 0,85 | 0,8–0,92 | `L012`, Levenshtein chuẩn hoá |
| `SILENT_NOTICE_TARGET` | 0,35 | 0,30–0,40 | CANON §11 |
| `HEADLESS_DAYS` | 40 | 10–200 | Thời gian chạy; mục tiêu < 20 s cho 40 ngày |
| `UNUSED_RULE_WARN_PCT` | 5% | 3–15% | B6 |

---

## 6. Tiêu chí đạt

**Telemetry**
- [ ] `DayMetrics` sinh ra đủ **mọi** field §2.1 sau mỗi `day:ended`
- [ ] **Trả lời được bằng con số:** một ngày = **___ phút thật** (p50 qua ≥5 ngày, ≥2 người), 40 ngày = **___ giờ**
- [ ] Con số đó được ghi vào bảng §2.5 dòng A1/A2 và được đối chiếu với bảng quyết định §2.1 — **có kết luận bằng chữ**, không chỉ có số
- [ ] Đo được `realMsPaused` và `realMsMenu` tách khỏi `realMsActive`
- [ ] Ghi telemetry không làm rớt frame: 0 lần flush xảy ra trong frame có `stim:emitted`
- [ ] File `.jsonl` một ngày ≤ 150 KB

**Debug overlay**
- [ ] 7 panel §2.2 chạy được; `F1`–`F8` đúng phím
- [ ] Panel Perception hiện **từng thừa số** của công thức §5, không chỉ hiện kết quả
- [ ] Panel Rule query hiện rule thắng + `score` + **lý do loại** của 5 rule sát nút
- [ ] Panel Gossip hiện hop, confidence, nguồn — kiểm được ràng buộc *"nguồn phải truy vết được"*
- [ ] `day.fastForward(4)` **không** làm `certainty` tích nhanh gấp 4 (test)
- [ ] `npm run sim -- --days 40` chạy < 20 s và in `DayMetrics` của cả 40 ngày
- [ ] Bản production: `grep -i "certainty\|__DEV_TOOLS__" dist/assets/*.js` không tìm thấy code overlay

**Công cụ nội dung**
- [ ] `npm run validate:rules` cài đủ **14** kiểm tra `R001`–`R014`, chạy < 5 s trên toàn bộ content
- [ ] `npm run lint:lines` cài đủ **13** kiểm tra `L001`–`L013`, có `--fix` cho `L004`/`L005`/`L007`
- [ ] Cả hai gắn vào pre-commit + CI; ERROR chặn merge
- [ ] Test âm tính: cố tình tạo 1 rule chết, 1 fact mồ côi, 1 response 4 biến thể, 1 dòng NFD, 1 dòng mất dấu, 1 từ Bắc trong pool Nam, 1 dòng dịch đại từ xưng hô → **cả 7 đều bị bắt**
- [ ] Test dương tính giả: `CHI_HANH` dùng từ Bắc → **không** bị báo lỗi (allowlist)
- [ ] `npm run content:stats` đối chiếu được với mốc §11 và với 8,3 từ/dòng của Firewatch

**Playtest P1**
- [ ] Giao thức §2.4 viết thành checklist một trang cho người điều phối
- [ ] Build playtest riêng: `__DEV_TOOLS__ = false`, telemetry bật, tự pause ở `perception:confirmed`
- [ ] Rubric 3 mức + form chấm; **2 người chấm mù**; tính được Cohen's kappa
- [ ] 10 người lạ, 5 cozy / 5 không, ≥7 người Việt
- [ ] **Điểm cổng ≥ 7,0/10** — nếu không đạt, có **chẩn đoán theo nhánh A/B/C bằng văn bản** trước khi sửa bất cứ thứ gì
- [ ] Ghi đủ 6 chỉ số phụ cho cả 10 phiên

---

## 7. Rủi ro & cách bịt

| # | Rủi ro | Mức | Cách bịt |
|---|---|---|---|
| R1 | **Đo muộn.** Tới P3 mới biết một mùa dài 14 giờ, lúc đó cắt ngày là cắt luôn arc nhân vật đã viết | **Rất cao** | Đo từ P0 trên khung rỗng. §23 tuần 1–2, không phải tuần 20. *"Nếu bạn chưa đo, bạn chưa thiết kế"* |
| R2 | **Debug overlay lọt vào bản bán ra** → hiện `certainty` → **giết T5** (người chơi nhìn thanh số thay vì nhìn mặt người) | **Rất cao** | `__DEV_TOOLS__` tree-shake + cổng grep trên `dist/` trong CI release |
| R3 | **Playtest với bạn bè** → 9/10 điểm giả → qua cổng sai → phát hiện ở review Steam | **Rất cao** | Tiêu chí "người lạ" là bắt buộc, ghi vào `PlaytestRecord.testerId`. Nếu không tuyển đủ 10 người lạ thì **hoãn cổng**, không hạ chuẩn |
| R4 | **Hỏi cuối buổi** thay vì hỏi tại chỗ → người chơi suy luận ngược → điểm giả cao | Cao | Build tự pause ở `perception:confirmed`. Giao thức ghi rõ |
| R5 | **Người điều phối gợi ý** (phản xạ tự nhiên khi thấy người chơi bí) | Cao | Kịch bản cố định + câu trả lời duy nhất được phép. Xem lại video để kiểm chính người điều phối |
| R6 | Trượt cổng rồi **sửa bằng cách thêm thoại giải thích** → điểm lên, T1 chết | **Rất cao** | §2.4 cấm rõ ràng. Phải chẩn đoán nhánh A/B/C trước |
| R7 | Rubric mơ hồ → 2 người chấm lệch → cổng vô nghĩa | Cao | κ ≥ 0,7 là điều kiện để kết quả được tính |
| R8 | Validator **quá nghiêm** → writer bị chặn commit liên tục → tắt validator | Cao | Chỉ các lỗi làm hỏng thật mới là ERROR. Độ dài, biến thể thiếu, từ vùng miền là WARN. `--fix` cho lỗi máy sửa được |
| R9 | `L008` (từ giọng Bắc) báo sai cho chị Hạnh → mất niềm tin vào linter | Trung bình | Allowlist theo NPC, có test dương tính giả ở §6 |
| R10 | `L010` (lằn ranh đỏ §14.1) tự sinh danh sách từ khoá → vừa lọt vừa báo oan | Cao | **Danh sách do người Việt viết văn hoá duyệt**, không tự sinh. Linter là lưới thứ hai, không phải lưới duy nhất — CANON §14.1 vi phạm là **chết** |
| R11 | Telemetry bị hiểu là "theo dõi người chơi" | Trung bình | Cục bộ, có công tắc, mặc định tắt ở bản bán ra, có màn hình giải thích. **Không gửi đi đâu** |
| R12 | Đo `realMsTotal` gồm cả lúc người chơi đi pha cà phê → con số mùa bị thổi phồng | Trung bình | Tách `realMsPaused` + `realMsMenu`; ngoại suy bằng `realMsActive`; báo cáo cả hai |
| R13 | `sim.headless` trôi khác bản có render (do có chỗ đọc `Date.now()` hoặc `Math.random()`) → tune bằng số liệu sai | Cao | Cổng CI của `P0-01`/`P0-02`. Test: 1 ngày headless vs 1 ngày có render, cùng input → trace giống byte |
| R14 | Chỉ số A6 (công cụ hạ attention) = 0 bị bỏ qua vì "chắc người chơi chưa quen" | Cao | Đây là **dấu hiệu sớm nhất** cho thấy cơ chế thành cờ bạc (§5.4: *"BẮT BUỘC có, nếu không cơ chế thành cờ bạc"*). Đèn đỏ ở A6 phải được xử như đèn đỏ ở A2 |

---

## 8. Truy vết

| Nội dung | `idea.md` | `CANON.md` |
|---|---|---|
| Đo "một ngày = bao nhiêu phút thật → 40 ngày = bao nhiêu giờ"; **dưới 4 giờ → giảm số ngày, tăng mật độ**; *"nếu bạn chưa đo, bạn chưa thiết kế"* | §23 tuần 1–2 | §17 (P0) |
| Cổng P1: 10 người lạ, quay màn hình, **câu hỏi duy nhất**, **dưới 7/10 = hệ thống chưa đọc được, không lượng thoại nào cứu được** | §23 tuần 5–8 | §17 (P1) |
| Tiêu chí gốc: người xem **tự thốt ra** *"ủa bả thấy kìa"* không cần giải thích luật | §13 | — |
| Cổng cứng wishlist 5.000 / 2.000 ở tuần 12 → dừng lại | §23 | §17 |
| Certainty + 5 thừa số của công thức | §18.2 | §5 |
| Công cụ hạ attention **bắt buộc**, không có thì cơ chế thành cờ bạc | §18.2 | §5.4 |
| Nghe lỏm được thì mới giữ đồn thổi; nguồn phải truy vết được; hop cap; confidence 0.7–0.85 | §18.5 | §12 |
| Rule DB: criteria sort alphabet, walk tuyến tính + early reject, `score = criteria.length` | §18.1 | §11 |
| Shuffle-bag 8 biến thể; *"nghe lại một dòng trong 2 giờ đầu → Refund"* | §18.7, HT6 | §11 |
| Bark 3 tầng, tier-3 làm lưới an toàn, 35% im lặng | §18.7 | §11 |
| Số dòng thoại 3 mốc; Firewatch 6.169 dòng / 51.103 từ / 8,3 từ mỗi dòng | §18.7, HT6 | §11 |
| Sự kiện tích cực ≥ tiêu cực, nếu không → *"game cằn nhằn"* | §9.7, §14 checklist | §3 |
| Tiếng Việt giọng miền Nam; đại từ xưng hô **không dịch** | — | §2 |
| Lằn ranh đỏ: chiến tranh không một chữ, không hạ thấp nghề | §19.4 | §14.1 |
| Không viết hoa toàn bộ; font sans line-height rộng vì dấu chồng dấu | §20 | §15 |
| 12 lỗ hổng ăn gian (đo bằng headless + telemetry) | §21 | §8 |

---

## 9. Đề xuất sửa CANON

| # | Đề xuất | Lý do |
|---|---|---|
| 1 | Bổ sung §17 cổng P1: ghi rõ **cách chấm** (rubric 3 mức 1 / 0,5 / 0, hỏi **2 lần/người tại chỗ**, 2 người chấm mù, κ ≥ 0,7) | CANON hiện chỉ ghi "≥7/10 trả lời đúng". Không có rubric thì "đúng" là ý kiến, và một cổng dựa trên ý kiến không phải là cổng. Đây là **cổng quan trọng nhất của cả dự án** |
| 2 | Thêm vào §17 (P0): **con số phải đo và ngưỡng hành động** — một ngày ≈9–12 phút, mùa 6–8 giờ, sàn 4 giờ | Nếu không có giá trị kỳ vọng thì đo xong không biết đạt hay trượt |
| 3 | Thêm vào §5.4: **lượt dùng công cụ hạ attention / ngày là chỉ số theo dõi bắt buộc; bằng 0 là đèn đỏ** | §5.4 đã nói "không có thì cơ chế thành cờ bạc" nhưng không nói cách biết nó **có mà không ai dùng** — tình huống này nguy hiểm ngang việc không có |
| 4 | Thêm vào §18 (quy ước viết doc): mọi doc có cơ chế sinh thoại phải khai báo **sàn 6 / mục tiêu 8 biến thể** cho mỗi response | Hiện §11 chỉ nói "8 biến thể shuffle-bag" như một ví dụ, không như một ràng buộc kiểm được. `R007` cần một con số ở CANON để trỏ tới |
| 5 | Thêm một dòng vào §16: **cấm hiện `certainty` dưới dạng số/thanh trong bản bán ra** | Đây là cách vi phạm T5 mà không ai nghĩ là vi phạm — "cho người chơi thấy attention" nghe như đúng tinh thần T5, nhưng một thanh số làm người chơi ngừng nhìn mặt người |
