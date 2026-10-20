# PL-B — Bảng tra số liệu

> ## ⚡ REVAMP 2026-10-20 — ⚠️ CHẾT MỘT PHẦN
> Căn cứ: [`CANON.md`](../CANON.md) bản revamp. Phần ☠️ không dùng làm căn cứ.
>
> | Mục | Trạng thái | Lý do / thay bằng |
> |---|---|---|
> | §2.1 Salience 11 sự kiện | 🔁 | Còn 8: `WRONG_NAME`, `REMEMBERED_USUAL`, `REMEMBERED_STORY` ☠️ |
> | §2.4 `TOOL.CO_BA`, §2.14 `TAM_LINH_TONE` (niềm tin cô Ba) | ☠️ | Cô Ba bỏ (R0.5). Công cụ thay thế / chủ thể đốt vía chốt R0.5 |
> | §2.5 `RELATION_TIERS`, `RIMWORLD_SPIRAL_MULT`, cột "vai trò" có arc/lan tin | ☠️ | Quan hệ, arc theo ngày, đồn thổi chết. 4 chiều tính cách giữ → persona review (R4); tên NPC đổi R6 |
> | §2.6 Trí nhớ, §2.7 Đồn thổi (toàn mục) | ☠️ | Hệ chết; chức năng lan tin → review công khai (T6) |
> | §2.8 Ngân sách dòng thoại | ⏳ | Tính lại khi có kho review (R4) + thoại gen Z (R6). Luật shuffle-bag, rule DB giữ |
> | §2.9 Hạn dùng, giá chợ, mưa, chi phí cố định | ⏳ | Giá chợ → giá nhà cung cấp (R3); số mô phỏng lại |
> | §2.9 `OBLIGATIONS` (hụi, tiền học), `RELATIONSHIP_RESPAWN` | ☠️ | Fail mềm, hụi, tiền học, quan hệ chết |
> | §2.10 `SEASON_DAYS`, `SEASON_HOURS*`, `CHU_TU_DISAPPEAR_DAY`, `ENDING_PRINCIPLE` | ☠️ | Chơi vô hạn tới thắng/thua (R5) |
> | §2.10 `RNG_STREAMS` stream `gossip` | 🔁 | Đổi vai thành stream `review` (R4) |
> | §2.11 `A11Y_REQUIRED_TOGGLES` (nhớ nhầm, biến mất, sổ tay), `RELATIONSHIP_METER_SHOWN` | 🔁 | 3 công tắc + luật T3 ☠️; thêm "tắt thông báo review" (R4) |
> | §2.13 `PLAYTEST_GATE_P1`, clip "khoảnh khắc đồn thổi" | 🔁 | Gắn bản đồ phase cũ/đồn thổi; viết lại theo R0–R6 và review |
>
> **Còn dùng được:** perception (`visibility`, certainty, công cụ hạ attention), hiệu năng/đóng gói, kinh doanh/phát hành, trợ năng, con số nghi thức VN — cho R1/R4.

**Thuộc phase:** Phụ lục — dùng ở mọi phase
**Phụ thuộc:** `CANON.md` (nguồn sự thật) · `idea.md` (nguồn gốc) · `P0-01`, `P0-02`, `P0-03` (định danh code và cách đo)
**Trạng thái:** **Chốt** về giá trị · **Cần đo** về khoảng cho phép (cột 3 là đề xuất tune, không phải phán quyết)

---

## 1. Mục tiêu

Gom **mọi con số** của dự án về một chỗ để tune được, thay vì đi tìm trong 25 mục của `idea.md` và 18 mục của `CANON.md`.

Mỗi dòng trả lời đủ 5 câu: **gọi nó là gì trong code · giá trị bao nhiêu · được phép đổi trong khoảng nào · lấy từ đâu · làm sao biết đã đúng.**

Đây là điều kiện để **T5** (attention nhìn thấy được) và **T1** (khách chấm quá trình) tune được bằng số chứ không bằng cảm giác — và là điều kiện để bảng theo dõi hằng tuần (`P0-03` §2.5) có thứ để đối chiếu.

**Ba luật dùng bảng này:**

1. **CANON thắng.** Nếu bảng này lệch CANON, CANON đúng và bảng này sai → sửa bảng.
2. **Cột "Khoảng cho phép" là khoảng TUNE, không phải giấy phép.** Các dòng ghi **Cố định** là hằng số thiết kế: đổi chúng là đổi thiết kế, phải qua mục "Đề xuất sửa CANON".
3. **Không bịa số mới.** Mọi dòng phải truy được về `idea.md`. Dòng nào là suy ra từ doc P0 thì ghi rõ nguồn là doc đó.

---

## 2. Cơ chế — các bảng tra

### 2.1. Salience — 11 sự kiện xương sống

Công thức dùng nó (CANON §5):
```
rate = salience × visibility[slot][zone] × occluderMul × gazeFactor × traitMul / 100
```

**Tiêu cực (6):**

| Định danh code | Giá trị | Khoảng | Nguồn | Cách đo để biết đã đúng |
|---|---|---|---|---|
| `SALIENCE.WRONG_NAME` | **100** | **Cố định** | `idea.md` §18.2, §9.2 mục 16 · CANON §3.1 | Là âm thanh nhắm thẳng vào khách → **bỏ qua `gazeFactor`**. Test: khách đang bấm điện thoại, gọi sai tên → vẫn `CONFIRMED`. Nếu không thì cài đặt sai |
| `SALIENCE.MADE_THEM_WAIT` | **100** | **Cố định** | §9.2 mục 14 · CANON §3.1 | Không cần gaze, leo thang theo giây. Đo: `confirmRate` phải ≈1,0 khi chờ vượt ngưỡng |
| `SALIENCE.BURNT_OR_COLD` | **80** | 70–90 | §18.2 (BURNT 80) · CANON §3.1 | Có mùi → bán kính nhận thấy rộng hơn: khách `QUEUE_3` vẫn bắt được. Test: đặt khách ở `QUEUE_3`, đốt bánh → phải `NOTICED` trong ≤ 8 s |
| `SALIENCE.DROPPED_FOOD` | **75** | 70–85 | §18.2 · CANON §3.1 | **Mốc hiệu chỉnh chính của cả hệ.** Khách nhìn thẳng (`FRONT_CENTER`×`HANDS`) → `CONFIRMED` sau **~1,4 s** |
| `SALIENCE.ORDER_DEFECT` | **20 tại quầy → 100 lúc ăn** | 15–25 → **100** | §9.2 mục 8/10 · CANON §3.1 | Họ **sự kiện**, chạy qua delivery-diff. Test: thiếu hành, khách không nhìn → tại quầy im, lúc ăn phản ứng đầy đủ (`DISCOVERED`) |
| `SALIENCE.DIRTY_HANDS` | **40** | 30–50 | §18.2 (TOUCHED_FACE 35), §9.2 mục 2 (0.4) · CANON §3.1 | **Sự kiện dẫn đầu trailer** (§24). Phải đủ cao để bắt được trong 20 phút demo, đủ thấp để không thành phiền hà |

**Tích cực (5):**

| Định danh code | Giá trị | Khoảng | Nguồn | Cách đo |
|---|---|---|---|---|
| `SALIENCE.REMEMBERED_USUAL` | **90** | 85–95 | §9.2 mục 19 (0.9) · CANON §3.2 | Khoảnh khắc chữa lành lõi. Đo: ≥1 lần/ngày sau khi có khách quen; playtest phải có người mỉm cười ở đây |
| `SALIENCE.REMEMBERED_STORY` | **70** | 60–80 | §9.6 · CANON §3.2 | Đầu vào là memory slot. Đo: tỉ lệ thành công khi người chơi **chủ động** hỏi đúng chuyện hôm trước |
| `SALIENCE.CARED_FOR_THEM` | **50** | 40–60 | §18.2 §5.4 · CANON §3.2 | **Đồng thời là công cụ hạ attention.** Đo: `attentionToolUses.TRA_DA` ≥ 3/ngày (`P0-03` A6) |
| `SALIENCE.FREE_EXTRA` | **25** | 20–35 | §21 mục (i) · CANON §3.2 | Có diminishing returns. Đo: cho thêm 10 lần liên tiếp → hiệu quả lần 10 ≤ 30% lần 1, và NPC "soi" phải nhận ra đang bị mua chuộc |
| `SALIENCE.FLOURISH` | **15** | 10–20 | §18.2 · CANON §3.2 | Thưởng cho **kỹ năng tay**, không thưởng cho tiền. Đo: người chơi giỏi tay phải gom được ≥5 lần/ngày |

**Tổng kiểm (ràng buộc cứng):**

| Định danh code | Giá trị | Khoảng | Nguồn | Cách đo |
|---|---|---|---|---|
| `EVENT_COUNT_TOTAL` | **11** | **Cố định** | HT7 (§16) 24→10 · CANON §3 | Đếm. Không được thêm mà không qua CANON |
| `EVENT_COUNT_NEGATIVE` | **6** | **Cố định** | CANON §3.1 | Đếm |
| `EVENT_COUNT_POSITIVE` | **5** | **Cố định** | CANON §3.2 | Đếm |
| `HYGIENE_EVENT_CAP` | **4** (hiện dùng **3**) | 3–4 | XĐ1.1 (§17) · CANON §7.1 | Đếm: `DROPPED_FOOD`, `DIRTY_HANDS`, `STALL_CLEANLINESS` = 3/11. Vượt 4 là vi phạm phán quyết |
| `POSITIVE_TO_NEGATIVE_RATIO_LIVE` | **≥ 1,0** | ≥ 1,0 | §9.7, §14 checklist · CANON §3 | **Đo trải nghiệm thực, không đếm danh mục.** `P0-03` chỉ số A8. < 0,8 → *"game cằn nhằn"* |
| `DEFECTS_SPOKEN_MAX` | **1** | **Cố định** | §18.3 (Lucas Pope) · CANON §6 | Test: gây 4 lỗi cùng lúc → **đúng 1** lỗi được nói ra, 3 lỗi còn lại chỉ vào `silentScore` |

### 2.2. Bảng `visibility` — tra tĩnh O(1)

Nguồn: `idea.md` §18.2 · CANON §5. Giá trị **hand-tuned**, khoảng cho phép ±0,10 trừ hai ô đánh dấu.

| `VISIBILITY[slot][zone]` | `HANDS` | `BOARD` | `OVEN` | `UNDER_COUNTER` |
|---|---|---|---|---|
| `FRONT_CENTER` | **0.95** ⚑ | 0.85 | 0.60 | 0.05 |
| `FRONT_SIDE` | 0.70 | 0.65 | 0.75 | 0.05 |
| `QUEUE_2` | 0.45 | 0.40 | 0.50 | 0.02 |
| `QUEUE_3` | **0.20** ⚑ | 0.18 | 0.30 | 0.00 |
| `SEATED_FAR` | 0.10 | 0.10 | 0.25 | 0.00 |

⚑ = **Cố định**, là hai mốc hiệu chỉnh được nêu tên trong `idea.md` §18.2.

| Định danh code | Giá trị | Khoảng | Nguồn | Cách đo |
|---|---|---|---|---|
| `VISIBILITY_TABLE_SIZE` | 5 slot × 4 zone = **20 ô** | **Cố định** | §18.2 · CANON §5 | Bảng tra, **O(1)** — không viewcone, không raycast (Đừng-2) |
| `OVEN_GT_HANDS_AT_FRONT_SIDE` | `true` (0.75 > 0.70) | **Cố định** | CANON §5 | Đứng lệch bên thì thấy lò rõ hơn thấy tay — là **lý do tồn tại** của công cụ "đổi chỗ đứng bên trái/phải xe" (§5.4) |
| `UNDER_COUNTER_MAX` | 0.05 | 0–0.08 | CANON §5 | Dưới quầy gần như vô hình. Nhưng **không được là 0 ở `FRONT_CENTER`** — nếu bằng 0 thì có một chỗ an toàn tuyệt đối và cả cơ chế sụp |

### 2.3. Certainty — 4 state và hiệu chỉnh

| Định danh code | Giá trị | Khoảng | Nguồn | Cách đo |
|---|---|---|---|---|
| `CERTAINTY.UNAWARE_MAX` | **0.35** | **Cố định** | §18.2 · CANON §5 | Dưới ngưỡng: không biểu hiện gì |
| `CERTAINTY.GLIMPSED` | **0.35 – 0.70** | **Cố định** | §18.2 · CANON §5 | Biểu hiện **bắt buộc**: quay đầu + dấu `?` nhỏ. Test thị giác: quay video, người ngoài phải chỉ ra được khoảnh khắc này |
| `CERTAINTY.NOTICED` | **0.70 – 1.0** | **Cố định** | §18.2 · CANON §5 | Nhíu mày + **bark tier-1**. Là ngưỡng để delivery-diff chọn `ANTICIPATED` |
| `CERTAINTY.CONFIRMED` | **≥ 1.0** | **Cố định** | §18.2 · CANON §5 | Phản ứng đầy đủ + **ghi memory** + ảnh hưởng tip + **autosave** (`P0-02` §2.6) |
| `CALIB.DROP_FRONT_SEC` | **~1,4 giây** | 1,2–1,8 | §18.2 (khớp TLoU, go/no-go 0,38 s của Rabin) | **Test hồi quy bắt buộc:** `DROPPED_FOOD` (75) × `FRONT_CENTER`×`HANDS` (0.95) × gaze 1.0 × trait 1.0 → thời gian tới `certainty ≥ 1.0`. Lệch ngoài khoảng = công thức đã bị ai đó sửa |
| `CALIB.DROP_PHONE_SEC` | **~28 giây** | ≥ 20 | §18.2 | Cùng sự kiện, `gazeFactor = 0.05` → "thực tế không bao giờ". Test: chạy 25 s, `certainty` phải < 1.0 |
| `GAZE_FACTOR.PHONE` | **0.05** | 0.03–0.10 | §18.2 | Hệ số thấp nhất trong game. Anh Bảo (`ANH_BAO`) là sandbox học hệ perception (CANON §9) |
| `GAZE_FACTOR.LOOKING` | 1.00 | **Cố định** | §18.2 | Chuẩn hoá |
| `DECAY_RATE` | Cần đo | 0.15–0.6 /giây | §18.2 ("giảm thì tụt dần kiểu capacitor", Thief) | Thời gian từ `NOTICED` (0.85) về `UNAWARE` khi kích thích biến mất. Mục tiêu **4–6 giây** — đủ lâu để người chơi thấy mình "thoát trong gang tấc" |
| `REACTION_DELAY_SEC` | **0,2 – 0,4** | **Cố định** | §18.7 (chống "twinning") · CANON §11 | Random hoá độ trễ phản ứng. Test: 4 NPC cùng thấy một sự kiện → **không ai phản ứng cùng frame**. Đo bằng `bark:queued.delaySec` |
| `PHONE_WINDOW_SEC` | **2 – 3** | **Cố định** | §21 mục (a) · CANON §5.4 | Cửa sổ khách bấm điện thoại. *"Đủ để dùng nếu đã chuẩn bị sẵn, không đủ để farm."* Đo: tỉ lệ người chơi khai thác thành công khi **chưa** chuẩn bị sẵn phải < 20% |
| `SILENT_NOTICE_RATE` | **0,35** | 0,30–0,40 | §9.4 mục 4 · CANON §11 | ~35% số lần "nhận thấy" **không nói gì**, chỉ đổi nét mặt. `P0-03` chỉ số A7 |

### 2.4. Công cụ hạ attention (CANON §5.4)

| Định danh code | Hiệu ứng | Khoảng | Nguồn | Cách đo |
|---|---|---|---|---|
| `TOOL.TRA_DA` | `gazeFactor` ↓ trong **2–3 s** + tính là `CARED_FOR_THEM` | 2–4 s | §18.2, §5.4 | Lượt dùng/ngày ≥ 3 (`P0-03` A6) |
| `TOOL.ASK_QUESTION` | Khách nhìn **mặt** thay vì nhìn **tay** | — | §18.2 | Panel Perception: `gazeFactor` chuyển target, không chỉ giảm |
| `TOOL.OCCLUDE_BODY` | `occluderMul` ↓ | 0.3–0.6 | §18.2 | Đặt thân/ổ bánh che → thời gian tới `CONFIRMED` phải dài ra ≥ 2× |
| `TOOL.SWITCH_SIDE` | Đổi `zone` đang lộ | — | §18.2 | Dùng bảng §2.2: `OVEN` 0.75 vs `HANDS` 0.70 ở `FRONT_SIDE` |
| `TOOL.CO_BA` | Chuyển gaze của **một** khách sang cô Ba | 1 khách | CANON §5.4, §7.4 | **Đúng một** khách. Cô Ba **không bao giờ làm bánh thay người chơi** (CANON §10) |
| `ATTENTION_TOOL_USES_PER_DAY` | **≥ 3** | 3–10 | §18.2 (*"không có thì cơ chế thành cờ bạc"*) | `P0-03` A6. **Bằng 0 là đèn đỏ**, không phải "người chơi chưa quen" |

### 2.5. Tính cách — 4 chiều và 12 NPC

| Định danh code | Giá trị | Khoảng | Nguồn | Cách đo |
|---|---|---|---|---|
| `PERSONALITY_DIMENSIONS` | **4** | **Cố định** | §23 (6→4), HT7 · CANON §4 | `soi` / `nongTinh` / `deTha` / `thanThien`, mỗi chiều `0..1`. Minh: *"6 chiều × nhớ nhầm × đồn thổi = ba tầng nhiễu, người chơi không phân giải được"* |
| `NPC_NAMED_COUNT` | **12** | **Cố định** | §16 HT7 (*"12 NPC được viết sâu > 30 NPC template"*) · CANON §9 | Đếm. Ngoài danh sách: cô Ba + khách vãng lai (pool generic) |
| `RELATION_TIERS` | **3** | **Cố định** | §18.4 (RimWorld) · CANON §4 | `RIVAL` → `ACQUAINTANCE` → `FRIEND`, **bất đối xứng**. Không làm 7 bậc |
| `RIMWORLD_SPIRAL_MULT` | **KHÔNG dùng** (×6) | — | §18.4 · CANON §4 | Test: ở `RIVAL`, hệ số bị xúc phạm phải ≈ bình thường. *"Một lần sai → cả phố tẩy chay"* là cái cozy không sống nổi |

**12 NPC — `soi / nongTinh / deTha / thanThien`** (nguồn: CANON §9, `idea.md` §19.5. **Cố định** — mọi doc dùng đúng số này):

| `NpcId` | Tên | soi | nongTinh | deTha | thanThien | Vai trò đo lường |
|---|---|---|---|---|---|---|
| `BA_BAY` | Bà Bảy | 0.9 | 0.6 | 0.8 | 0.7 | Soi nhất + dễ tha → **NPC an toàn để học luật** |
| `CHU_TU` | Chú Tư | 0.3 | 0.3 | 0.9 | 0.6 | Dạy **lịch sinh hoạt**. Arc: biến mất ~ngày 30, báo trước 3–4 ngày |
| `ANH_DUNG` | Anh Dũng | 0.2 | 0.5 | 0.7 | 0.5 | Dạy `MADE_THEM_WAIT` |
| `CHI_LAN` | Chị Lan | 0.9 | 0.1 | 0.2 | 0.3 | **Im lặng biến mất** + nút lan tin mạnh nhất |
| `BE_SU` | Bé Su | 0.4 | 0.4 | 0.9 | 1.0 | `thanThien = 1.0` → **bộ khuếch đại danh tiếng** |
| `ONG_HAI` | Ông Hải | 0.5 | 0.9 | 0.5 | 0.6 | `nongTinh` cao nhất. **Trước 10 giờ sáng rất tử tế** |
| `CO_MAI` | Cô Mai | 0.6 | 0.4 | 0.6 | 0.8 | §19.5: *"cái hẻm mà ai cũng nghèo là cái hẻm giả"* |
| `THAY_PHUC` | Thầy Phúc | 0.8 | 0.2 | 0.7 | 0.5 | Soi + điềm đạm → **dạy đọc hệ thống** không phạt nặng |
| `CHI_HANH` | Chị Hạnh | 0.5 | 0.3 | 0.6 | 0.4 | **Allowlist từ giọng Bắc** trong linter (`P0-03` `L008`) |
| `ANH_BAO` | Anh Bảo | 0.3 | 0.2 | 0.8 | 0.4 | **`gazeFactor` thấp nhất** → sandbox học perception |
| `BA_SAU` | Bà Sáu | 0.4 | 0.3 | 0.8 | 0.9 | Nút gossip + mốc tiến trình ngôn ngữ |
| `CHU_KIET` | Chú Kiệt | 0.7 | 0.6 | 0.3 | 0.4 | `deTha` thấp nhất. Kẻ gian dối vệ sinh (XĐ1.5) |

**Kiểm phân bố (đo bằng script, không bằng mắt):** `soi` phải phủ 0.2–0.9 · có ≥1 NPC `nongTinh ≥ 0.9` và ≥1 NPC `nongTinh ≤ 0.1` · có ≥1 NPC `deTha ≤ 0.3` (để "để bụng" tồn tại) · `thanThien` phủ 0.3–1.0 (để tốc độ lan tin có dải).

**Suy ra hành vi** (CANON §4, không có chiều riêng):
`nói thẳng ra miệng` ≈ `nongTinh` cao **hoặc** `thanThien` cao · `im lặng rồi biến mất` ≈ `soi` cao **và** `nongTinh` thấp **và** `thanThien` thấp (→ `CHI_LAN`: 0.9 / 0.1 / — / 0.3 ✓).

### 2.6. Trí nhớ

| Định danh code | Giá trị | Khoảng | Nguồn | Cách đo |
|---|---|---|---|---|
| `MEMORY.SHORT_SLOTS` | **6 – 8** | 6–8 | §18.4 (Dwarf Fortress) · CANON §12 | Đếm slot trong panel Memory (`P0-03` F5) |
| `MEMORY.LONG_SLOTS` | **3 – 4** | 3–4 | §18.4 · CANON §12 | |
| `MEMORY.CORE_SLOTS` | **1** | **Cố định** | §18.4 · CANON §12 | Một lần duy nhất định hình NPC |
| `MEMORY.PROMOTE_AFTER_DAYS` | Cần đo | 3–7 | §18.4 ("promote sau N ngày") | Số memory lên `LONG` sau 40 ngày. Mục tiêu 8–15/NPC |
| `MEMORY.EVICTION_RULE` | **Ghi đè `intensity` THẤP NHẤT** | **Cố định** | §18.4 (chi tiết tinh tế của DF) | **Không phải cũ nhất.** Test: nhét 9 memory, cái bị đẩy ra phải là cái yếu nhất |
| `MEMORY.SAME_KIND_RULE` | **Giữ cái `intensity` CAO HƠN** | **Cố định** | §18.4 · CANON §12 | Test: ghi 2 memory cùng kind, intensity 0.3 rồi 0.8 → còn lại 0.8 |
| `MEMORY_STACK_FALLOFF` | **0.75** → memory thứ *n* góp `0.75^(n-1)` | 0.65–0.85 | §18.4 · CANON §12 | `n=1: 1.00 · n=2: 0.75 · n=3: 0.56 · n=4: 0.42 · n=5: 0.32`. Test: 5 lỗi cùng loại → tổng ảnh hưởng ≈ 3,05× chứ không phải 5× |
| `DECAY_PER_TIER.RIVAL` | **−2** /ngày | −1 → −4 | §18.4 (Stardew) · CANON §12 | Decay **mạnh dần khi càng thân** |
| `DECAY_PER_TIER.ACQUAINTANCE` | **−10** /ngày | −6 → −14 | §18.4 · CANON §12 | Nghỉ 3 ngày không về 0, nhưng càng thân càng phải chăm |
| `DECAY_PER_TIER.FRIEND` | **−20** /ngày | −15 → −28 | §18.4 · CANON §12 | Test: `FRIEND`, nghỉ 5 ngày → tụt 100 điểm nhưng **không xuống dưới `floor_of_tier`** |
| `DECAY_FLOOR_RULE` | `points = max(points − decay, floor_of_tier)` | **Cố định** | §18.4 · CANON §12 | **Sàn theo bucket đã đạt.** Decay **tapering, không cliff** — cảnh báo từ mod RimWorld "All Memories Fade" |
| `TRUST_CEILING_PERMANENT_DROP` | Có | Cần đo | §21 mục (d) · CANON §8d | **Đốt NPC rồi để nguội: grudge decay được nhưng HẠ TRẦN TIN TƯỞNG VĨNH VIỄN.** Test: vắt kiệt 3 ngày → né 5 ngày → quay lại: hết giận nhưng **không bao giờ thân lại như cũ** |
| `MISREMEMBER_BIAS_BY_TRAIT` | `soi` cao → lệch **xấu**; `thanThien` cao → lệch **tốt** | **Cố định** | §21 mục (h) · CANON §8h | Chặn khai thác nhớ nhầm chiều ngược (được ghi công oan) |
| `MICRO_CHEAT_PATTERN_N` | Cần đo | 5–12 lần | §21 mục (g) · CANON §8g | **Lỗ hổng lớn nhất hiện tại.** Sau N lần bớt cùng một thứ: *"ê, dạo này bánh nhạt hơn hay tại tao?"*. Đo bằng `sim.headless(40)` với policy micro-cheat: phải bị phát hiện trước ngày 15 |

### 2.7. Đồn thổi

| Định danh code | Giá trị | Khoảng | Nguồn | Cách đo |
|---|---|---|---|---|
| `GOSSIP_TICK` | **1 lần / ngày** | **Cố định** | §18.5 (Talk of the Town) · CANON §12 | Ở `evening:done`. **Thời điểm cố định = tất định tuyệt đối** (`P0-02` §2.3) |
| `GOSSIP_HOP_CAP` | **2 – 3** | **Cố định** | §18.5 ràng buộc 2 · CANON §12 | Panel Gossip (F4): không cạnh nào có `hop > 3` |
| `GOSSIP_CONFIDENCE_DECAY` | **0.70 – 0.85** mỗi hop | **Cố định** | §18.5 ràng buộc 3 · CANON §12 | Hop 3 → confidence ≈ 0.34–0.61. Nguồn **phải truy vết được**: *"chị Lan bảo tôi…"* |
| `GOSSIP_SOURCE_TRACEABLE` | **Bắt buộc** | **Cố định** | §18.5 ràng buộc 3, HT3 | Test: mọi fact ở hop ≥1 phải có `source: NpcId`. HT3: *"NPC nhớ nhầm 10% random — cắt. Chỉ giữ nếu truy vết được nguồn"* |
| `GOSSIP_GOOD_NEWS_MULT` | **> 1,0** (tin tốt lan **nhanh hơn**) | 1,2–1,8 | §18.5 ràng buộc 5 · CANON §12 | *"Ngược đời thật, nhưng đúng với cozy."* Đo: tỉ lệ fact tích cực / tiêu cực trong `gossip.inFlight` phải ≥ 1,0 |
| `GOSSIP_LOCKOUT_HOURS` | **2 giờ chơi đầu** | 1,5–3 | §18.5 ràng buộc 6 (Sarah) · CANON §12 | Đo `gossip:seeded` đầu tiên ở phút thứ mấy. Lúc đó người chơi vẫn đang học luật |
| `GOSSIP_TOGGLE` | **Bắt buộc có** | **Cố định** | §18.5 ràng buộc 6 (Linh) · CANON §15 | Một trong 6 công tắc: "NPC nhớ nhầm / đổ oan" |
| `GOSSIP_EAVESDROP_REQUIRED` | **Bắt buộc** | **Cố định** | §18.5 ràng buộc 4 · CANON §12 | *"Không có nghe lỏm thì **bỏ luôn** cả nhớ nhầm lẫn đồn thổi."* Đo: `gossip:overheard` ≥ 1/ngày sau khi mở khoá (`P0-03` A13) |
| `GOSSIP_DECLARATION_BOOST` | Có | Cần đo | §18.5 | Mỗi lần kể lại, `intensity` của **chính người kể** tăng → nói mãi thành tin thật |

**`GOSSIP_MUTATION_RATE` — per-kind, KHÔNG global** (§18.5 ràng buộc 1 · CANON §12). Author tay — *"đây là chỗ vui nhất của game"*:

| Định danh code | Giá trị | Khoảng | Kết quả mutate | Ghi chú |
|---|---|---|---|---|
| `MUTATION.DROPPED_FOOD` | **0.30** | 0.20–0.40 | *"bán đồ rơi xuống đất"* | Phóng đại |
| `MUTATION.ORDER_DEFECT` | **0.35** | 0.25–0.45 | *"ăn bớt nguyên liệu"* | **Đổi ý định — nặng nhất.** Từ *sai sót* thành *gian dối* |
| `MUTATION.WRONG_NAME` | **0.40** | 0.30–0.50 | *"chảnh, không thèm nhớ khách"* | Rate cao nhất |
| `MUTATION.FREE_EXTRA` | **0.25** | 0.15–0.35 | *"cho thêm vì ế hàng"* | **Công hoá tội** |
| `MUTATION.REMEMBERED_USUAL` | **0.20** | 0.15–0.30 | *"ngon nhất khu này"* | Tin tốt cũng phóng đại |

**Cách đo cả cụm:** chạy `sim.headless(40)`, đếm số fact đã mutate / tổng fact lan truyền. Mục tiêu **25–35%**. Dưới 15% thì cơ chế vô hình; trên 50% thì thành nhiễu và người chơi mất niềm tin vào hệ thống.

**Luật tuyệt đối** (§18.6 Đừng-3 · CANON §12, §16): ngẫu nhiên và tin đồn được đổi **thoại · dáng đi · món gọi · tip · thứ tự đến**. **KHÔNG** được đổi **công thức có ra đúng món không · tiền có vào túi không · cốt truyện có unlock được không**. Cách đo: `grep -rn "rng\.\|gossip\." src/craft src/econ/ledger.ts` → **0**.

### 2.8. Thoại và chống lặp

| Định danh code | Giá trị | Khoảng | Nguồn | Cách đo |
|---|---|---|---|---|
| `LINES.V1_DEMO` | **~520 dòng / ~5.000 từ** | 450–600 | §18.7 · CANON §11 | 1/10 Firewatch · 1 writer × 2–3 tuần. `npm run content:stats` |
| `LINES.BETA` | **~1.200 dòng / ~12.000 từ** | 1.000–1.400 | §18.7 · CANON §11 | ~20% Firewatch · 6–8 tuần |
| `LINES.FULL` | **~2.980 dòng / ~30.000 từ** | 2.500–3.400 | §18.7, HT6 · CANON §11 | 48% Firewatch · 14% Hades · 3–4 tháng |
| `WORDS_PER_LINE` | **8 – 12** | 8–14 | Firewatch **8,3** (§18.7, đếm từ repo localization chính thức) | Nếu ra 20 thì đang viết văn chứ không viết bark → 2.980 dòng sẽ thành 60.000 từ |
| `SHUFFLEBAG_VARIANTS` | **8** | 6–12 | §18.7 · CANON §11 | **Sàn cứng 6** (`P0-03` `R007`). 8 biến thể shuffle-bag ≈ cảm giác của **~25–30 dòng random** |
| `RANDOM_COLLISION_AFTER` | **~3,4 lần** (8 biến thể, random thuần, P ≥ 50%) | — | §18.7 (bài toán sinh nhật) | **Lý do tồn tại của shuffle-bag.** Test: mô phỏng 10.000 lần random thuần n=8 → P(trùng) ở lần rút thứ 4 phải ≈ 0,5 |
| `GENERIC_POOL_SAVING` | **~40%** khối lượng cắt được | 30–50% | §18.7 đòn bẩy 2 · CANON §11 | Tỉ lệ dòng generic / dòng riêng trong `content:stats` |
| `BARK_TIERS` | **3** | **Cố định** | §18.7 (Splinter Cell Blacklist) · CANON §11 | tier-1 rất cụ thể (**có cooldown**) → tier-2 chung hơn → tier-3 (*"Hửm."*) **lưới an toàn**. `R012` bắt concept thiếu tier-3 |
| `BARK_TIER1_COOLDOWN_SEC` | Cần đo | 45–180 | §18.7 (nghịch lý lặp của Ocio Barriales) | *"Phản ứng càng đặc thù càng dễ lộ khi lặp."* Đo `barkTierMix`: tier-1 ≤ 40% tổng bark |
| `LINE_REPEAT_IN_FIRST_2H` | **0** | **Cố định** | HT6 (Sarah) · CANON §11 | *"Nghe lại một dòng thoại trong 2 giờ đầu → hệ thống của bạn nông → Refund."* `P0-03` A9 |
| `DIALOGUE_TREE_COUNT` | **0** | **Cố định** | §9.5 (VA-11 HALL-A), T2 · CANON §1 | **Không có dialogue tree.** Người chơi không bao giờ chọn câu nói — họ chọn nguyên liệu |
| `RULE_SCORE_FORMULA` | `score = criteria.length` | **Cố định** | §18.1 (Elan Ruskin, Valve GDC 2012 — *copy nguyên, không sáng tạo*) · CANON §11 | Tính sẵn lúc load. Test: rule 3 criteria phải thắng rule 2 criteria khi cả hai match |

### 2.9. Kinh tế — hạn dùng và giá chợ

| Định danh code | Giá trị | Khoảng | Nguồn | Cách đo |
|---|---|---|---|---|
| `SHELF_LIFE_DAYS.PATE` | **2** | 2–3 | §22.1 · CANON §13.1 | Ngày 3: `econ:spoiled`. Là ràng buộc chặt nhất → quyết định bài toán tồn kho |
| `SHELF_LIFE_DAYS.THIT_NGUOI` | **3** | 3–4 | §22.1 · CANON §13.1 | |
| `SHELF_LIFE_DAYS.RAU` | **1** | 1 | §22.1 · CANON §13.1 | **Cố định** — rau là thứ buộc phải đi chợ mỗi sáng |
| `PICKLE_PEAK_DAY` | **3** | 3 | §22.1 · CANON §13.1 | **Đồ chua ngâm càng lâu càng ngon** — đỉnh ngày 3. Là ngoại lệ duy nhất, và là chỗ dạy người chơi rằng "cũ" ≠ "hỏng" |
| `PICKLE_SOUR_DAY` | **7** | 6–8 | §22.1 · CANON §13.1 | Chua gắt ngày 7 |
| `FRIDGE_CAPACITY` | Cần đo | — | §21 mục (j) · CANON §8j | **Hạn dùng + sức chứa tủ** = cách bịt "tích trữ khi giá đáy". Test: chạy policy tích trữ trong headless → phải lỗ |
| `PEAK_HOURS` | **6h30 – 8h00** | **Cố định** | §22.3 · CANON §13.3 | *"1 lò, 2 tay."* **Đông khách = nhiều mắt nhìn hơn + áp lực làm nhanh = dễ ẩu.** §22.3 gọi đây là ràng buộc quan trọng nhất |
| `MEAT_EXPENSIVE_DAY` | **Thứ 2** | **Cố định** | §22.4 · CANON §13.4 | Pattern **học được** |
| `MEAT_CHEAP_DAY` | **Thứ 5** | **Cố định** | §22.4 · CANON §13.4 | Đo: playtest có ai tự phát hiện ra pattern không (câu phụ) |
| `PORK_SHORTAGE_PATE_MULT` | **+40%** (×1.40) | 1.3–1.5 | §22.4 · CANON §13.4 | Dịch heo |
| `PORK_SHORTAGE_DAYS` | **5** | 4–7 | §22.4 · CANON §13.4 | Đủ dài để đau, đủ ngắn để không phá cả mùa |
| `RAIN_CUSTOMER_MULT` | **0.60** (giảm **40%** khách) | 0.55–0.70 | §21 mục (c) · CANON §8c | Bịt "lịch mưa": ngày ăn gian = ngày ít doanh thu → **tự cân bằng**. Test headless: policy "chỉ ăn gian ngày mưa" phải **không** lãi hơn policy trung thực |
| `RAIN_BEHAVIOR` | Khách **nán lại, nói chuyện nhiều hơn** | — | §9.2 mục 21 | Mưa vừa giảm số khách vừa tăng thời gian mỗi khách → phút thật/ngày có thể **không giảm**. Đo `realMsActive` ngày mưa vs ngày nắng |
| `DAILY_FIXED_COST` | Cần đo | — | §21 mục (l) · CANON §8l | Bịt "đóng cửa sớm". Test: policy đóng cửa lúc đủ tiền phải **không** thắng |
| `OBLIGATIONS` | Tiền thuê chỗ · tiền hụi · tiền học | **Cố định** | §22 · CANON §13 | **Fail mềm nhưng vĩnh viễn.** Không trả không chết, nhưng mất chỗ đứng đẹp / phải bán tủ mát — **không lấy lại được** |
| `RELATIONSHIP_RESPAWN` | **KHÔNG CÓ** | **Cố định** | §22 · CANON §13 | *"Khách ruột mất là mất thật."* Test: NPC `gone = true` không bao giờ quay lại |
| `RECIPE_PRESETS_PER_DAY` | **3** | 2–4 | §22 (Minh, hệ thống #1) | *"Chỉ chuẩn bị được 3 preset mỗi sáng, phục vụ 12 người khác khẩu vị — tối ưu cái gì?"* Biến làm bánh từ **thao tác** thành **tuning** |
| `NO_PICKUP_BUTTON` | **Không có nút "nhặt lên dùng tiếp"** | **Cố định** | XĐ1.2 (§17) · CANON §7.2 | **Bánh rớt = bắt buộc bỏ, làm lại.** Rủi ro chuyển từ **đạo đức** sang **vận hành**. Ý tưởng gốc ở Phần II đã bị **bác bỏ** |

### 2.10. Thời gian và vòng đời

| Định danh code | Giá trị | Khoảng | Nguồn | Cách đo |
|---|---|---|---|---|
| `SEASON_DAYS` | **40** | 30–40 | §12.2, T4 · CANON §1 | **Một mùa có điểm kết.** Không Early Access, không daily login, không stamina, không cây chết khi offline |
| `TIME_SCALE_BASE` | **30** phút game / phút thật | 20–45 | `P0-02` §2.1 (suy ra từ §22.3) | 1 giây thật = 30 giây game khi có khách |
| `DAY_OPEN_HHMM` / `DAY_CLOSE_HHMM` | **06:00 / 11:00** | — | `P0-02` §2.1 | Khung bán hàng |
| `REAL_MIN_PER_DAY` | **≈10,25** (ước tính) | 7–14 | `P0-02` §2.1, §23 | **Phải ĐO, không được tính.** `P0-03` A1 |
| `SEASON_HOURS` | **≈6,8** (ước tính) | 6–8 | `P0-02` §2.1, §23 | `P0-03` A2 |
| `SEASON_HOURS_FLOOR` | **4** | **Cố định** | §23 tuần 1–2 | **Dưới 4 giờ → giảm số ngày, tăng mật độ.** *"Nếu bạn chưa đo, bạn chưa thiết kế"* |
| `AUTOSAVE_TRIGGER` | **Sau mỗi khách** + ngay khi sự kiện xảy ra | **Cố định** | §21 mục (e) · CANON §2, §8e | Không phải sau mỗi ngày |
| `RNG_SEED_FORMULA` | `hash(saveId, dayIndex)` | **Cố định** | §21 mục (e) · CANON §8e | Reload ra **đúng kết quả cũ** |
| `RNG_STREAMS` | **6** | 4–8 | `P0-02` §2.3 | `market` / `npc-schedule` / `dialog-shufflebag` / `gossip` / `ambient` / `event`. Tách stream là **điều kiện** của §8e, không phải chuyện gọn gàng |
| `CHU_TU_DISAPPEAR_DAY` | **~30** | 28–33 | CANON §9 | Arc: công ty dời chỗ. **Có báo trước 3–4 ngày** |
| `ENDING_PRINCIPLE` | Mọi ending đều **tử tế**, chỉ khác **ai còn ở đó với mình** | **Cố định** | §20 · CANON §15 | **Không** làm ending dựa trên "bạn đã làm tốt tới đâu" |

### 2.11. Trợ năng

| Định danh code | Giá trị | Khoảng | Nguồn | Cách đo |
|---|---|---|---|---|
| `FONT_SIZE_LEVELS` | **4** | **Cố định** | §20 mục 1 · CANON §15 | Có **preview ngay trong menu**. Hộp thoại **tự giãn** khi chữ ≥200% |
| `FONT_SCALE_MAX` | **2,0** (200%) | **Cố định** | §20 mục 1 · CANON §15 | Test: đặt 200%, chạy `lint:lines` `L003` → không dòng nào tràn |
| `DIALOG_BG_OPAQUE` | **Bắt buộc** | **Cố định** | §20 mục 1 | Hộp thoại nền **ĐỤC**, không trong suốt |
| `TEXT_AUTO_ADVANCE` | **Không bao giờ** | **Cố định** | §20 mục 1 · CANON §15 | Text **không tự chạy tiếp** — phải chạm mới qua câu kế |
| `PAUSE_FREEZES_PATIENCE` | **Bắt buộc** | **Cố định** | §20 mục 2 · CANON §15.2 | Pause đóng băng **cả sự kiên nhẫn của khách**. Test: pause 60 s, `certainty` + `patience` không đổi |
| `NO_TIME_PRESSURE_MODE` | **Bắt buộc có** | **Cố định** | §20 mục 2 · CANON §15.2 | Khách vẫn bỏ đi vì bạn làm **sai**, nhưng **không bao giờ** vì bạn **chậm** |
| `AUDIO_CHANNELS` | **5** | **Cố định** | §20 mục 4 · CANON §15 | nhạc / đường phố / giọng NPC / thao tác / âm báo + nút riêng **"tắt âm báo tiêu cực"** |
| `A11Y_REQUIRED_TOGGLES` | **6** | **Cố định** | §20 · CANON §15 | NPC nhớ nhầm · số khách cùng lúc ("một khách một lượt") · khách biến mất không chia tay ("họ để lại lời nhắn") · sổ tay cuối ngày · tiếng ồn đám đông riêng · hiệu ứng khi làm sai (rung, nháy đỏ) |
| `TAP_UNDO_CONFIRM` | **3 cái đi chung** | **Cố định** | §20 mục 5 · CANON §15 | Chạm-để-đặt + Hoàn tác + **một bước xác nhận trước khi đưa bánh**. *"Bị NPC trách vì lỗi ngón tay thì cay lắm"* |
| `TOUCH_TARGET_PT` | **44 × 44** | ≥44 | §7.1, §14 checklist · CANON §2 | Đo bằng thước trên bản build |
| `ICON_SHAPE_DISTINCT` | **Bắt buộc** | **Cố định** | §20 · CANON §15 | Dưa leo / ngò / hành lá **đều xanh** → phải khác nhau về **HÌNH DÁNG**. Test mù màu: chuyển ảnh sang xám, vẫn phân biệt được |
| `ALL_CAPS` | **Không dùng** | **Cố định** | §20 · CANON §15 | `lint:lines` `L007` |
| `FONT_FAMILY` | **sans, line-height rộng** | — | §20 · CANON §15 | Tiếng Việt dấu chồng dấu `ề ộ ỡ ữ` — line-height chật là dấu bị cắt cụt |
| `REDUCE_MOTION_ITEMS` | **5** | ≥5 | §20 mục 3 · CANON §15 | xe máy chạy qua · đám đông nền · lá bay · rung màn hình · chuyển cảnh trượt |
| `RELATIONSHIP_METER_SHOWN` | **Không bao giờ** | **Cố định** | T3 · CANON §1 | Không `+3 trust`, không thanh tình cảm, không màu tên. **Và không hiện `certainty` dưới dạng số trong bản bán ra** (`P0-03` §2.2) |

### 2.12. Hiệu năng và đóng gói

| Định danh code | Giá trị | Khoảng | Nguồn | Cách đo |
|---|---|---|---|---|
| `TARGET_FPS` | **30** | **Cố định** | §7.1 (*"30fps là đủ cho cozy"*) · CANON §2 | fps p5 ≥ 30 qua một ngày (`P0-03` A10) |
| `FRAME_MS_P95` | ≤ **31** | ≤ 33,3 | `P0-01` §2.8 | Chrome Performance |
| `MAX_GAMEOBJECTS` | **180** | 120–260 | `P0-01` §2.8 | `scene.children.length` p95 |
| `MAX_DRAW_CALLS` | **60** | 40–90 | `P0-01` §2.8 | `game.renderer.drawCount` |
| `MAX_NPC_AT_STALL` | **6** | 4–8 | `P0-01` §2.8, §22.3 | Nối vào chế độ trợ năng "một khách một lượt" |
| `BUBBLE_POOL_SIZE` | **8** | 6–12 | `P0-01` §2.6 | Số lần "cướp pool" = **0** (`P0-03` A12) |
| `FACE_LAYER_FILES` | **18** → **216 trạng thái** | **Cố định** | §18.6 Đừng-4 · CANON §16 | 6 lông mày × 6 mắt × 6 miệng. **Không frame-by-frame** (Cuphead: >25 phút cho MỘT frame) |
| `BG_RENDER_TEXTURES` | **1** | **Cố định** | §7.1, prototype · CANON §2 | Nền bake vào **một** RenderTexture. `beginDraw/batchDrawFrame/endDraw` |
| `WEB_BUILD_GZIP_MB` | ≤ **12** | 8–20 | `P0-01` §2.8 | Đo **thời gian tải thật trên 4G** (< 8 s), không đo dung lượng suông |
| `ELECTRON_BUILD_MB` | ≤ **250** | 180–400 | `P0-01` §2.7 | Kích thước installer |
| `DESKTOP_WRAPPER` | **Electron** | **Cố định** | §23 · CANON §2 | **KHÔNG Tauri** — WebView hệ thống render khác nhau mỗi máy, Steam Overlay/Input hay lỗi |
| `SERVER_COUNT` | **0** | **Cố định** | HT5, §23 · CANON §2 | Client-only, offline-first. Test: tắt wifi, chơi trọn một ngày |
| `SAVE_WRITE_MS_P99` | ≤ **5** | ≤ 5 | `P0-02` §2.6 | `save:written.ms` |

### 2.13. Kinh doanh và phát hành

> Các số dưới đây **lấy nguyên từ `idea.md`**. Không bịa số thị trường mới (CANON §18).

| Định danh code | Giá trị | Khoảng | Nguồn | Cách đo |
|---|---|---|---|---|
| `PRICE_USD` | **$9.99** | **Cố định** | XĐ2 (§17), §23 · CANON §2 | $12.99–14.99 **chỉ nếu** có publisher trả tiền marketing. Lý do chọn: mức thấp nhất **vượt mốc tâm lý $10**, không rơi vào vùng "$5–8 = mobile port" |
| `PRICE_VND` | **59.000₫** | **Cố định** | XĐ2, §23 · CANON §2 | Neo thị trường VN: Hust Banhmi 39k, Thần Trùng 75k, Tai Ương 128k. Steam VN ≈ **45%** giá Mỹ |
| `REGIONAL_PRICING` | Nhận **giá đề xuất PPP của Valve** | **Cố định** | XĐ2 | *"Đừng tự nâng."* Chuyện người Việt mua được giải bằng regional pricing, không bằng giá gốc |
| `DEMO_PRICE` | **Miễn phí** (web / itch.io) | **Cố định** | §23 · CANON §2 | Kênh marketing chính. Đối chiếu: *Tiệm Phở Anh Hai* đạt **650.000 lượt tải** |
| `WISHLIST_TARGET_W12` | **5.000** | **Cố định** | §23 tuần 10–12 | Mục tiêu cứng tuần 12 |
| `WISHLIST_GATE_W12` | **2.000** | **Cố định** | §23, CANON §17 | **Dưới 2.000 ở tuần 12 → DỪNG LẠI.** Vấn đề ở **hook hoặc art**, không ở việc chưa làm đủ nội dung |
| `CLIPS_PER_WEEK` | **3** | 2–4 | §23 tuần 10–12 | Mỗi clip là **một khoảnh khắc đồn thổi** hoặc **một lỗi bị bắt quả tang**. Song ngữ |
| `PLATFORM_V1` | **PC (Steam) + demo web itch.io** | **Cố định** | XĐ4 (§17), §23 · CANON §2 | Mobile là **v2**, sau khi bán **30k bản** |
| `ARTIST_MONTHLY_USD` | **$1.500 – 2.500** | — | §23 tuần 3–4 | Artist VN. Giao **đúng một việc**: một khung key art hẻm Sài Gòn lúc 6 giờ sáng. Không làm gì khác cho tới khi khung đó đẹp |
| `CAPSULE_ART_USD` | **$800 – 1.200** | — | §23 tuần 9 | **Thuê riêng** — đừng để artist chính làm |
| `INTERVIEWS_REQUIRED` | **3 – 5 chủ xe bánh mì thật ở TP.HCM**, 30 phút/người | **Cố định** | §23 (*"việc quan trọng nhất, làm ngay tuần 1"*) | *"Không nguồn online nào thay được — và chính là lợi thế duy nhất của bạn so với marisa0704"* |
| `TRAILER_LEAD_EVENT` | **`DIRTY_HANDS`** | **Cố định** | §24, XĐ1.6 · CANON §7.6 | **Không** đưa cảnh nhặt bánh vào trailer — dễ bị cắt khỏi ngữ cảnh nhất |
| `CAPSULE_IMAGE` | Cận cảnh **đôi mắt khách nhìn thẳng vào tay bạn** | **Cố định** | §24 | *"Nếu bạn không nghĩ ra hình ảnh đó trước khi viết code, dự án không có đường marketing"* |
| `TAGLINE` | *"Món ăn chính là lựa chọn hội thoại"* | **Cố định** | §24 · CANON §0 | Đưa lên **đầu**, không chôn ở dòng thứ 6 |
| `LEAD_PHRASE` | *"a game about being watched while you work"* | **Cố định** | §24 · CANON §0 | **KHÔNG** dẫn đầu bằng chữ "cozy". Mất một ít click, được đúng người |
| `PLAYTEST_GATE_P1` | **≥ 7 / 10** người lạ | **Cố định** | §23 tuần 5–8 · CANON §17 | Câu hỏi duy nhất: *"Bạn có biết vì sao khách đó giận không?"* Rubric ở `P0-03` §2.4 |
| `QR_ADOPTION_CONTEXT` | Người Việt trung bình **11 ngày liên tiếp/tháng** không tiêu tiền mặt | — | §19.2 (khảo sát Visa 2023) | Lý do bảng QR là **upgrade thật**, không phải trang trí |
| `GOOD_PIZZA_PENALTY_THRESHOLD` | **40%** happiness (không phải 80%) | — | §8 bảng cạnh tranh, §15 | **Số đối chiếu, không phải hằng số của ta.** Ghi ở đây vì §15 nêu rõ: copy nhầm 80% → hệ thống khắc nghiệt gấp đôi tham chiếu → **phá đúng cái "cozy"** |
| `FIREWATCH_REFERENCE` | **6.169 dòng / 51.103 từ / 8,3 từ mỗi dòng** | — | HT6 (đếm trực tiếp từ repo localization chính thức) | **Số đối chiếu.** Mốc để quy chiếu `LINES.*` |

### 2.14. Cơ chế Việt Nam — con số nghi thức

Nguồn: `idea.md` §19.1 · CANON §14. **Cố định** — đây là chi tiết văn hoá, sai là mất uy tín, không phải mất cân bằng.

| Định danh code | Giá trị | Ghi chú |
|---|---|---|
| `DOT_VIA_STEPS_MALE` | **7 lần** bước qua lửa | Nam |
| `DOT_VIA_STEPS_FEMALE` | **9 lần** | Nữ |
| `SALT_HAND_FEMALE` | **Tay phải** | Ném **qua vai trái** |
| `SALT_HAND_MALE` | **Tay trái** | Ném **qua vai trái** |
| `CHANH_COUNT` | **3 quả**, cắt tư | |
| `BO_KET_COUNT` | **3 – 5 quả** khô | |
| `NHANG_COUNT` | **Số lẻ** | |
| `KHAN_TEXT` | *"Đốt vía, đốt van, đốt gan, đốt ruột — vía lành thì ở, vía dữ thì đi."* | Nguyên văn |
| `TAM_LINH_TONE` | **Trìu mến / tự trào** | ⚠️ Là **niềm tin của cô Ba**, KHÔNG phải hệ ma thuật có tác dụng cơ học rõ ràng. Cách đo: nếu người chơi bắt đầu **tối ưu** nghi thức để lấy buff, tông đã sai |
| `PALETTE` | **Xanh xám + nắng gắt trắng** | **KHÔNG** màu vàng nghệ kiểu phim Mỹ |
| `ENV_DETAILS_REQUIRED` | **5** | ghế nhựa · hũ đũa · bảng hiệu đỏ chữ vàng · xe máy dựng sát vách nhường lối đi · vài chậu trầu bà treo ngoài cửa sổ |
| `RED_LINES` | **5 đỏ + 1 vàng** | Bản đồ/chủ quyền (**tự vẽ**) · làm sai món Việt · hạ thấp nghề · **chiến tranh: KHÔNG MỘT CHỮ** · credits (người Việt viết văn hoá đứng **ĐẦU**) · 🟡 tâm linh giữ tông nhẹ |
| `HYGIENE_JUDGE_NATIONALITY` | **LUÔN LUÔN người Việt** | XĐ1.3. Không bao giờ để nhân vật nước ngoài nhăn mặt chê vệ sinh |
| `PRONOUNS_TRANSLATED` | **KHÔNG** | Giữ nguyên "cô / con / chú / chị / anh / em" trong bản Anh. Giải thích **một lần** ở đầu game |
| `VOICE_ACTING` | **Người thật**, không AI voice | CANON §2 |

---

## 3. Dữ liệu & schema

Bảng này nên tồn tại **hai bản**: bản người đọc (file này) và bản máy đọc. Bản máy đọc là nguồn để validator đối chiếu — nếu code lệch bảng, CI báo.

```ts
// content/tuning/constants.json  →  core/tuning.ts
export type TuningEntry<T = number> = {
  value: T;
  range?: [T, T] | null;           // null = Cố định
  source: string;                  // "idea.md §18.2 · CANON §5"
  measure: string;                 // cách đo
  locked?: true;                   // đổi phải qua "Đề xuất sửa CANON"
};
export type TuningTable = Record<string, TuningEntry<number | string | boolean>>;
```

```json
{
  "SALIENCE.DROPPED_FOOD": {
    "value": 75, "range": [70, 85],
    "source": "idea.md §18.2 · CANON §3.1",
    "measure": "FRONT_CENTER×HANDS, gaze 1.0 -> CONFIRMED sau ~1,4 s"
  },
  "SALIENCE.WRONG_NAME": {
    "value": 100, "range": null, "locked": true,
    "source": "idea.md §18.2, §9.2 mục 16 · CANON §3.1",
    "measure": "Bỏ qua gazeFactor. Khách bấm điện thoại vẫn CONFIRMED"
  },
  "MEMORY_STACK_FALLOFF": {
    "value": 0.75, "range": [0.65, 0.85],
    "source": "idea.md §18.4 · CANON §12",
    "measure": "5 lỗi cùng loại -> tổng ảnh hưởng ~3,05x chứ không phải 5x"
  },
  "RAIN_CUSTOMER_MULT": {
    "value": 0.6, "range": [0.55, 0.7],
    "source": "idea.md §21 mục (c) · CANON §8c",
    "measure": "headless: policy 'chỉ ăn gian ngày mưa' không lãi hơn policy trung thực"
  }
}
```

**Cổng CI (`npm run validate:tuning`):** mọi hằng số trong `src/` phải có mục tương ứng trong `constants.json`; giá trị phải nằm trong `range`; mục `locked: true` mà lệch giá trị → **ERROR**, kèm dòng nhắc *"đổi hằng số này phải qua mục 'Đề xuất sửa CANON'"*.

---

## 4. UI/UX hai thiết bị

Không có mặt trên màn hình. Bảng này là tài liệu nội bộ + bảng đối chiếu cho `validate:tuning`.

Một ràng buộc duy nhất liên quan tới màn hình: **không con số nào trong bảng này được hiển thị cho người chơi dưới dạng số** — `certainty`, `relationPoints`, `salience`, `confidence` đều là nội bộ (T3, T5, `P0-03` §2.2). Người chơi chỉ thấy **mặt, lời, dáng, hành động, hệ quả trễ**.

---

## 5. Tham số cần tune

Cả tài liệu này **là** bảng tham số. Danh sách dưới đây là những mục **chưa có giá trị** — phải đo trước khi P2 khoá thiết kế:

| Tên | Trạng thái | Chặn phase nào | Cách đo |
|---|---|---|---|
| `DECAY_RATE` (certainty) | **Cần đo** | P1 | Thời gian `NOTICED` → `UNAWARE`, mục tiêu 4–6 s |
| `MEMORY.PROMOTE_AFTER_DAYS` | **Cần đo** | P2 | Số memory lên `LONG` sau 40 ngày, mục tiêu 8–15/NPC |
| `MICRO_CHEAT_PATTERN_N` | **Cần đo** — **lỗ hổng lớn nhất** (§8g) | P2 | Headless policy micro-cheat phải bị phát hiện trước ngày 15 |
| `BARK_TIER1_COOLDOWN_SEC` | **Cần đo** | P2 | tier-1 ≤ 40% tổng bark |
| `TRUST_CEILING_PERMANENT_DROP` | **Cần đo** | P2 | Kịch bản "đốt rồi để nguội" 3+5 ngày |
| `FRIDGE_CAPACITY` | **Cần đo** | P3 | Headless policy tích trữ phải lỗ |
| `DAILY_FIXED_COST` | **Cần đo** | P3 | Headless policy đóng cửa sớm phải không thắng |
| `REAL_MIN_PER_DAY` / `SEASON_HOURS` | **Cần đo** | **P0** | `P0-03` §2.1 — **cổng đầu tiên của cả dự án** |
| `GOSSIP_DECLARATION_BOOST` | **Cần đo** | P2 | Độ tăng `intensity` của người kể mỗi lần kể lại |

---

## 6. Tiêu chí đạt

- [ ] Mọi hằng số trong `src/` có mục tương ứng trong `content/tuning/constants.json` — `validate:tuning` xanh
- [ ] Mọi dòng của bảng này truy được về `idea.md` hoặc một doc P0; **không dòng nào có nguồn trống**
- [ ] Mọi dòng **Cố định** khớp từng chữ với `CANON.md`; sai lệch → sửa bảng này, không sửa CANON
- [ ] 9 mục **Cần đo** ở §5 có chủ và có phase chặn
- [ ] Hai test hồi quy hiệu chỉnh chạy trong CI: `CALIB.DROP_FRONT_SEC` ≈ 1,4 s và `CALIB.DROP_PHONE_SEC` ≥ 20 s
- [ ] `sim.headless(40)` chạy được 4 policy ăn gian (mưa · tích trữ · đóng cửa sớm · micro-cheat) và **cả 4 đều không thắng policy trung thực**
- [ ] Không con số nội bộ nào lọt ra UI bản bán ra — grep `dist/` cho `certainty`, `relationPoints`, `salience`

---

## 7. Rủi ro & cách bịt

| # | Rủi ro | Mức | Cách bịt |
|---|---|---|---|
| R1 | **Bảng này trôi khỏi code.** Ai đó tune trong code, không cập nhật bảng → bảng thành tài liệu chết | **Rất cao** | `constants.json` là **nguồn duy nhất**, code đọc từ đó. `validate:tuning` là cổng CI. Bảng markdown sinh lại từ JSON được |
| R2 | **Copy nhầm số của game tham chiếu** — đúng lỗi §15 đã mắc một lần: Good Pizza phạt 40% bị chép thành 80% → *"hệ thống khắc nghiệt gấp đôi → phá đúng cái cozy"* | **Rất cao** | §2.13 ghi rõ các số đối chiếu và dán nhãn **"số đối chiếu, không phải hằng số của ta"** |
| R3 | Tune một hằng số **Cố định** vì "chỉ 5% thôi" | Cao | `locked: true` → ERROR ở CI, kèm nhắc phải qua mục 9 |
| R4 | Hai doc dùng hai giá trị khác nhau cho cùng một thứ | Cao | Mọi doc trỏ về bảng này thay vì chép số. `grep` tìm số trần trong `docs/` khi review |
| R5 | Cột "Khoảng cho phép" bị đọc thành "giấy phép tự đổi" | Trung bình | §1 luật 2 nói rõ. Và khoảng chỉ có ý nghĩa cùng với cột "Cách đo" — đổi mà không đo thì không phải tune |
| R6 | `MICRO_CHEAT_PATTERN_N` bị hoãn mãi vì khó | Cao | §8g: **lỗ hổng lớn nhất hiện tại**. Ghi vào §5 với phase chặn P2, không để trôi |
| R0.5 | Số nghi thức §2.14 bị "làm tròn cho tiện" (7/9 lần thành 5 lần) | Trung bình | **Cố định**. Sai chi tiết văn hoá là mất uy tín với đúng tập người chơi mình cần nhất |
| R8 | Số thị trường mới được thêm vào từ nguồn ngoài | Trung bình | CANON §18: **Không bịa số liệu thị trường mới.** Review doc kiểm cột Nguồn |

---

## 8. Truy vết

Bảng này **là** bản đồ truy vết. Chỉ mục ngược theo mục của `idea.md`:

| Mục `idea.md` | Nội dung | Mục bảng này | `CANON.md` |
|---|---|---|---|
| §7.1 | 44pt, 30fps, bake nền, tap-to-interact | §2.11, §2.12 | §2 |
| §8 (bảng cạnh tranh) | Good Pizza ngưỡng 40% | §2.13 | — |
| §9.2 | Danh mục 24 sự kiện → nguồn của salience | §2.1 | §3 |
| §9.4 | 35% im lặng | §2.3 | §11 |
| §9.5 | Món ăn LÀ lựa chọn hội thoại | §2.8 | §1 (T2) |
| §9.7 | Tích cực ≥ tiêu cực | §2.1 | §3 |
| §12.2 | 40 ngày, có điểm kết | §2.10 | §1 (T4) |
| §15 | Lỗi đã mắc: chép nhầm 80% | §2.13 | — |
| HT3, HT5, HT6, HT7 (§16) | Nhớ nhầm truy vết được · cắt Colyseus · số dòng thoại · cắt bề rộng | §2.7, §2.8, §2.12 | §2, §11 |
| XĐ1 (§17) | Phán quyết vệ sinh, cap 3–4, không nút nhặt | §2.1, §2.9 | §7 |
| XĐ2 (§17) | Giá $9.99 / 59.000₫ | §2.13 | §2 |
| XĐ4 (§17) | PC trước, mobile v2 | §2.13 | §2 |
| §18.1 | Rule DB Valve, `score = criteria.length` | §2.8 | §11 |
| §18.2 | Salience, visibility, 4 state, 1,4 s / 28 s, công cụ hạ attention | §2.1–§2.4 | §5 |
| §18.3 | Delivery-diff, `take(1)` | §2.1 | §6 |
| §18.4 | Memory 3 tầng, decay −2/−10/−20, `0.75^(n-1)` | §2.6 | §12 |
| §18.5 | Gossip: mutation rate, hop cap, confidence 0.7–0.85, 6 ràng buộc | §2.7 | §12 |
| §18.6 | Đừng-1…4, 18 file → 216 trạng thái | §2.7, §2.12 | §16 |
| §18.7 | 520/1.200/2.980 dòng, shuffle-bag 8, ~3,4 lần, 0,2–0,4 s | §2.3, §2.8 | §11 |
| §19.1 | Đốt vía: 7/9, muối, 3 chanh, 3–5 bồ kết, nhang lẻ | §2.14 | §14 |
| §19.2 | QR: 11 ngày/tháng không tiền mặt | §2.13 | §14 |
| §19.4 | Lằn ranh đỏ, bảng màu, chi tiết môi trường | §2.14 | §14.1 |
| §19.5 | 12 NPC, tránh rập khuôn | §2.5 | §9 |
| §20 | Trợ năng: 4 mức chữ, pause, 5 kênh, 6 công tắc, 44pt, icon hình dáng | §2.11 | §15 |
| §21 (a–l) | 12 lỗ hổng: 2–3 s điện thoại, mưa −40%, save-scum, micro-cheat, hạn dùng | §2.3, §2.6, §2.9, §2.10 | §8 |
| §22 | 4 ràng buộc kinh tế, hạn dùng, cao điểm, giá chợ, fail mềm, 3 preset | §2.9 | §13 |
| §23 | Cắt Colyseus/mobile/Tauri, 4 giờ, $9.99, wishlist 5.000/2.000, artist, phỏng vấn | §2.10, §2.12, §2.13 | §2, §17 |
| §24 | Trailer dẫn đầu `DIRTY_HANDS`, capsule đôi mắt, tagline, không dẫn bằng "cozy" | §2.13 | §0, §7.6 |

---

## 9. Đề xuất sửa CANON

| # | Đề xuất | Lý do |
|---|---|---|
| 1 | Thêm vào §18 (quy ước viết doc): **mọi con số trong doc phải trỏ về `phu-luc/B-bang-tra-so-lieu.md`, không chép giá trị trần** | Chép số là cách chắc chắn nhất để 7 doc có 7 giá trị khác nhau cho cùng một hằng số sau 3 tháng |
| 2 | Thêm vào §2: **`content/tuning/constants.json` là nguồn duy nhất của mọi hằng số**, code không được hardcode | Không có luật này thì R1 (bảng trôi khỏi code) chắc chắn xảy ra |
| 3 | Bổ sung §5: `VISIBILITY[FRONT_CENTER][UNDER_COUNTER]` **không được bằng 0** | Hiện CANON ghi 0.05 nhưng không nói vì sao. Nếu ai đó "làm tròn" xuống 0 thì có một chỗ **an toàn tuyệt đối** và cả cơ chế attention sụp — đây là kiểu tune vô hại nhìn bề ngoài mà giết thiết kế |
| 4 | Bổ sung §5: ghi rõ `OVEN` (0.75) **cao hơn** `HANDS` (0.70) ở `FRONT_SIDE` là **có chủ ý** — nó là lý do tồn tại của công cụ "đổi chỗ đứng" ở §5.4 | Nhìn bảng thì trông như lỗi gõ. Không ghi chú thì sớm muộn có người "sửa" nó |
| 5 | Bổ sung §8g: ghi con số `N` (số lần micro-cheat trước khi bị phát hiện) vào CANON khi đo xong, và **ghi rõ nó chặn phase P2** | §8g được CANON gọi là *"lỗ hổng lớn nhất hiện tại"* nhưng không có con số nào và không có phase chặn — tức là nó sẽ bị hoãn vô thời hạn |
| 6 | Bổ sung §11: ghi mốc **8,3 từ/dòng (Firewatch)** như một ràng buộc kiểm được, không chỉ như một đối chiếu | Ba mốc số dòng (520/1.200/2.980) vô nghĩa nếu độ dài mỗi dòng trôi. 2.980 dòng × 20 từ = 60.000 từ = gấp đôi ngân sách viết |
