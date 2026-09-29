# P5-01 — Trợ năng

**Thuộc phase:** P5 — Hoàn thiện
**Phụ thuộc:** `CANON.md` §15 (danh sách bắt buộc) · §5 (perception) · §11 (thoại) · §16 (Đừng-4) · `P5-02` (icon, typography, giảm chuyển động) · `P5-03` (5 bus âm thanh) · `P5-04` (chế độ không giới hạn thời gian ảnh hưởng cân bằng)
**Trạng thái:** **Chốt** (trừ 3 dòng đánh dấu *Cần đo* trong §5)

---

## 1. Mục tiêu

Linh — ADHD + cận nặng + loạn thị — **vào trang Steam, cuộn xuống mục accessibility, đọc xong mới bấm mua**. Nếu mục đó trống hoặc viết chung chung, cô ấy không mua. Đây là tài liệu **thi hành**, không phải nguyện vọng: mỗi dòng dưới đây có giá trị số, có cách test, có người chịu trách nhiệm.

Trợ năng ở game này không phải lớp phủ bên ngoài, nó nằm **thẳng trong đường tới hạn của thiết kế**:
- **T1** (khách chấm quá trình) chỉ đúng khi người chơi **đọc được** quá trình đó. Chữ bị cắt dấu, icon xanh giống nhau, hiệu ứng nhiễu loạn → T1 sụp trước mắt người cận nặng.
- **T5** (attention phải NHÌN THẤY ĐƯỢC) là một lời hứa về **khả năng đọc**. Một hệ thống "đọc được" mà chỉ đọc được bằng mắt tốt thì là hệ thống hên xui.
- **T3** (không hiện chỉ số) đẩy toàn bộ tải thông tin sang **mặt, dáng, lời, hệ quả trễ** → mọi kênh trợ năng phải bảo toàn *thông tin*, chỉ được phép bỏ đi *sự trừng phạt cảm xúc*.

> **Nguyên tắc lõi của cả tài liệu:** *tắt hiệu ứng thì mất trải nghiệm, không được mất thông tin.* Mỗi lần tắt một kênh, phải có kênh thay thế mang đúng lượng thông tin đó.

**Vai trò chịu trách nhiệm (dùng suốt doc):**

| Mã | Vai | Người |
|---|---|---|
| `DEV-GP` | Gameplay / sim (perception, patience, undo) | Dev chính |
| `DEV-UI` | UI, layout, text, settings, input | Dev chính (kiêm) |
| `ART-1` | Artist chính (icon, sprite, biến thể tĩnh) | Thuê ngoài, VN |
| `SND` | Âm thanh & VO | Thuê ngoài |
| `QA-A11Y` | Chủ sở hữu checklist trợ năng, chạy test mỗi milestone | Producer kiêm, **không được kiêm DEV-GP** |
| `PROD` | Duyệt gate, viết mục Steam | Producer |

---

## 2. Cơ chế

### 2.1. Nhóm bắt buộc 1 — Cỡ chữ 4 mức + hộp thoại nền ĐỤC

#### 2.1.1. Hệ thống cỡ chữ

Toàn bộ UI dựng trên **canvas logic 1280×720**, scale lên độ phân giải thật bằng `Phaser.Scale.FIT`. Mọi số px dưới đây là **px logic**.

| Mức | Nhãn trong menu | Hệ số | Thoại NPC | Thân UI | Nhãn nút | Chú thích / số | `lineSpacing` (px thêm) | `line-height` hiệu dụng |
|---|---|---|---|---|---|---|---|---|
| **1** | *Bình thường* | 100% | **20** | 18 | 16 | 14 | 11 | 1,55 |
| **2** | *Lớn* | 130% | **26** | 23 | 21 | 18 | 14 | 1,54 |
| **3** | *Rất lớn* | 160% | **32** | 29 | 26 | 22 | 19 | 1,59 |
| **4** | *Tối đa* | **200%** | **40** | 36 | 32 | 28 | 26 | 1,65 |

Luật cứng:
- **Sàn tuyệt đối 14px logic.** Không có chuỗi nào trong game nhỏ hơn 14px ở mức 1. Mọi "chữ nhỏ trang trí" (giá tiền trên bảng, chữ trên bao bì) là **texture, không phải chuỗi đọc được** → không tính.
- **`line-height` không bao giờ dưới 1,5.** Lý do kỹ thuật ở §2.7 (dấu chồng dấu).
- Mức chữ **không ảnh hưởng** tới cỡ icon nguyên liệu (icon có thang riêng, §2.6) — tách ra để người cần chữ to không bị vỡ layout quầy.
- Đổi mức chữ **có hiệu lực tức thì**, không cần restart, không cần rời menu.

#### 2.1.2. Preview ngay trong menu

Ô preview nằm **ngay dưới 4 nút chọn mức**, chiếm 1280×220 logic, hiển thị **một hộp thoại thật** (không phải mockup) với nội dung cố định dùng đủ ký tự khó:

```
Bà Bảy: "Ủa con, cái bánh đó rớt xuống đất rồi mà?
         Thôi, bữa nay cô ăn ổ đó. Con làm ổ khác nghen."
```

Chuỗi preview **bắt buộc chứa**: `Ủ ề ộ ỡ ữ ằ ẫ ợ Đ` — nếu font thiếu một glyph, nó lòi ra ngay trong preview, trước cả khi QA chạy test.

#### 2.1.3. Hộp thoại nền ĐỤC

| Thuộc tính | Giá trị | Ghi chú |
|---|---|---|
| Màu nền hộp | `#12161B` | Xanh xám đậm, khớp bảng màu P5-02 |
| Alpha nền | **1,00** | Mặc định. **Không có chế độ nào đưa alpha xuống dưới 0,92** |
| Viền | 2px `#3A444E`, bo 6px | Để tách hộp khỏi nền sáng chói giờ nắng gắt |
| Màu chữ | `#F2F4F3` | Tương phản với nền: **14,8:1** (vượt WCAG AAA 7:1) |
| Màu tên NPC | `#F0C419` | Tương phản 10,1:1 |
| Padding | trái/phải 24px, trên 18px, dưới 20px | Padding trên **≥ 0,35em** của cỡ chữ hiện tại (chống cắt dấu) |
| Drop shadow | Không | Bóng làm nhoè với mắt loạn thị |

**Cấm tuyệt đối:** hộp thoại trong suốt, hộp thoại gradient, chữ đặt thẳng lên nền game, chữ có outline thay cho nền đục.

#### 2.1.4. Hộp tự giãn — luật layout không vỡ

Hộp thoại là một **flow dọc neo đáy màn hình**, không phải khung cứng.

```ts
type DialogBoxLayout = {
  anchor: 'BOTTOM'
  marginBottom: 24
  width: () => clamp(screenW - 2*sideMargin(), 720, 1232)
  minHeight: () => 3 * lineHeight()          // luôn chừa 3 dòng
  maxHeight: () => 0.45 * screenH            // trần 45% chiều cao
  overflow: 'SCROLL'                          // không bao giờ 'CLIP'
}
```

Thứ tự **xuống cấp** khi chữ lớn dần (áp dụng theo đúng thứ tự này, dừng ngay khi vừa):

| Bước | Điều kiện kích hoạt | Hành động |
|---|---|---|
| 0 | Mức 1–2 | Chân dung NPC 180×180 nằm **bên trái** hộp, chữ chiếm phần còn lại |
| 1 | Chữ tràn 1 dòng | Hộp cao thêm đúng 1 `lineHeight`, đẩy lên trên |
| 2 | Mức 3 | Chân dung **thu còn 96×96**, vẫn bên trái |
| 3 | Mức 4 (200%) | Chân dung thành **bust 64×64 đè lên góc trên-trái hộp**, chữ chiếm **toàn bộ** bề ngang |
| 4 | Vẫn tràn quá `maxHeight` | Bật **scroll trong hộp**: thanh cuộn 8px luôn hiển thị + chỉ báo `▾ còn nữa` nhấp nháy 1 lần |
| 5 | — | **KHÔNG BAO GIỜ** cắt chữ, không `...`, không thu nhỏ chữ để vừa |

Các lớp UI khác khi mức chữ ≥ 3:
- Bảng nguyên liệu: chuyển từ lưới 6×4 sang **danh sách dọc cuộn** (`ingredientPanelMode: 'list'`), mỗi hàng cao `2,2 × lineHeight`, icon 48px + chữ.
- Sổ tay tối: 2 cột → 1 cột.
- Bảng giá chợ: bỏ cột "chênh hôm qua", đưa vào tooltip.
- HUD hàng chờ: từ avatar ngang → **stack dọc tối đa 3, còn lại là "+n"**.

**Luật kiểm chứng layout:** mọi màn hình phải qua ma trận **4 mức chữ × 3 tỉ lệ (16:9, 16:10, 4:3) × 2 ngôn ngữ (VI, EN)** = **24 tổ hợp**. Chuỗi EN trung bình dài hơn VI ~12%, nhưng chuỗi VI **cao** hơn (dấu) → phải test cả hai chiều.

#### 2.1.5. Text KHÔNG BAO GIỜ tự chạy tiếp

```ts
const AUTO_ADVANCE = false   // HẰNG SỐ. Không có setting bật lên được.
```

- Một dòng thoại ở trên màn hình cho tới khi người chơi **chạm/bấm/nhấn**. Không có timeout, không có "auto" mode, không có "skip all".
- **Chạm lần 1** = hiện ngay toàn bộ dòng (bỏ typewriter). **Chạm lần 2** = qua dòng kế. Với `reduceMotion` bật, typewriter tắt sẵn → chỉ cần 1 chạm.
- Vùng chạm để qua dòng = **toàn bộ hộp thoại** (≥ 720×90 logic), không phải mũi tên nhỏ ở góc.

**Hệ quả lên sim — đây là chỗ dễ sai nhất:**

Nếu dòng thoại chờ người chơi vô hạn mà `patience` vẫn tụt, thì tính năng trợ năng này **tự biến thành hình phạt**. Giải pháp: mọi `DialogLine` có cờ `blocking`.

| `blocking` | Dùng cho | Trong lúc hiển thị |
|---|---|---|
| `true` | Gọi món, arc, cô Ba dạy, khách chốt đơn, kết ngày | **Đóng băng `patience` của MỌI khách + `certainty` của MỌI observation + đồng hồ lò + đồng hồ ngày** |
| `false` | Bark tier-1/2/3, tiếng nói lỏm, câu đệm | Không đóng băng gì. Nổi lên, tự mờ sau `barkHoldMs` |

Với bark `blocking: false`, người cần đọc chậm vẫn thiệt → có **công tắc `barkHoldMode`**:

| Giá trị | Hành vi |
|---|---|
| `AUTO` (mặc định) | Bark mờ đi sau 3,2s |
| `HOLD` | Bark **không tự mất**; xếp chồng tối đa 4 dòng ở cột phải; mỗi dòng có nút `×`; dòng thứ 5 đẩy dòng cũ nhất vào **Nhật ký** |
| `LOG_ONLY` | Bark không hiện trên màn hình, chỉ vào **Nhật ký** (mở bằng `Tab`, đóng băng game khi mở) |

**Nhật ký** (`ui/notebook/log.ts`) là lưới an toàn cho ADHD: cuộn lại được toàn bộ câu đã nói **trong ngày hôm đó**, kèm giờ và tên người nói. Không chứa chỉ số (giữ T3). Xoá khi sang ngày mới.

---

### 2.2. Nhóm bắt buộc 2 — Pause mọi lúc + Chế độ không giới hạn thời gian

#### 2.2.1. Pause mọi lúc

Phím: `ESC`, `P`, nút gamepad `Start`, và **một nút cảm ứng 56×56 logic luôn hiện ở góc trên-phải** (không bao giờ ẩn, không bao giờ bị scene nào che).

**Pause phải chạy được ở 6 trạng thái mà người ta hay quên:**

| # | Trạng thái | Yêu cầu khi resume |
|---|---|---|
| 1 | **Giữa lúc kéo nguyên liệu** | Nguyên liệu vẫn nằm trên tay/con trỏ. Nếu chuột đã nhả lúc pause → giữ ở chế độ "đang chọn" của tap-to-place, không rơi |
| 2 | **Giữa lúc khách đang nói** | Dòng thoại giữ nguyên vị trí typewriter. Voice clip pause chứ không restart |
| 3 | Giữa animation nướng / lò đang chạy | Timer lò dừng đúng ms |
| 4 | Giữa lúc `certainty` đang lên | Dừng tích luỹ, **và dừng cả decay** |
| 5 | Trong cảnh chợ / cảnh tối | Bình thường |
| 6 | Trong cutscene arc | Cho phép; cutscene không có nghĩa là mất quyền pause |

**Pause đóng băng danh sách sau — đây là hợp đồng, DEV-GP phải viết test cho từng dòng:**

```ts
// core/clock.ts
const PAUSABLE: PausableSystem[] = [
  'dayClock',            // đồng hồ trong ngày
  'customerPatience',    // sự kiên nhẫn của MỌI khách đang chờ
  'perceptionAccrual',   // obs.certainty += rate * dt
  'perceptionDecay',     // obs.certainty -= decayRate * dt   <-- HAY BỊ QUÊN
  'ovenTimers',          // nướng / cháy
  'dishFreshness',       // bánh nguội
  'npcSchedule',         // lịch đến của khách
  'gossipTicks',         // hop đồn thổi
  'ambientEmitters',     // xe máy chạy qua, tiếng rao
  'voicePlayback',       // pause, không stop
  'springRig',           // node đầu/thân/tay (P5-02)
]
```

> **CANON §15.2 chỉ ghi "đóng băng cả sự kiên nhẫn của khách".** Tài liệu này mở rộng sang **`certainty` của perception** theo yêu cầu thiết kế: nếu `certainty` vẫn chạy trong lúc pause thì người chơi bị phạt vì đã bấm pause, và cơ chế T5 ("đọc được rủi ro TRƯỚC khi hành động") bị vô hiệu. → Xem §9.

**Màn hình pause là một tính năng trợ năng, không phải một cái menu.** Nó hiển thị (tất cả bằng chữ + icon, không có số quan hệ):

- Ai đang đứng chờ, đứng ở zone nào, **chờ bao lâu rồi** (dạng chữ: "vừa tới" / "chờ một lát" / "chờ hơi lâu" — không phải giây).
- Cái gì đang ở trong lò và đang ở giai đoạn nào (dạng chữ: "còn sống" / "vừa tới" / "sắp cháy").
- Đơn hàng hiện tại **nguyên văn** khách đã nói ("cho một ổ đầy đủ, ít rau, không hành").
- Những gì đang có trên ổ bánh (danh sách chữ, đọc lại hành động của người chơi — **không** đối chiếu đúng/sai, xem §2.5.3).

Với người ADHD bị tuột mạch, đây là chỗ lấy lại bối cảnh mà không cần hỏi ai.

#### 2.2.2. Chế độ thời gian — 3 nấc

```ts
type TimeMode = 'NORMAL' | 'THONG_THA' | 'KHONG_GIOI_HAN'
```

**Chỉ `KHONG_GIOI_HAN` là bắt buộc theo CANON §15.2.** `THONG_THA` là nấc trung gian để người ta không phải nhảy thẳng từ 100% xuống 0%.

Bảng **đổi tham số chính xác** — đây là phần "nói rõ chế độ này đổi những tham số nào":

| Tham số | `NORMAL` | `THONG_THA` | `KHONG_GIOI_HAN` | Ghi chú |
|---|---|---|---|---|
| `patienceDrainRate` (điểm/s) | 1,00 | 0,50 | **0,00** | Nguồn duy nhất của `MADE_THEM_WAIT` theo thời gian |
| `patienceFloor` | 0 | 25 | — (không dùng) | Sàn kiên nhẫn |
| `MADE_THEM_WAIT` kích hoạt bởi *thời gian trôi* | Có | Có (chậm) | **KHÔNG** | |
| `MADE_THEM_WAIT` kích hoạt bởi *phục vụ sai thứ tự* | Có | Có | **CÓ — giữ nguyên salience 100** | Đây là **lỗi quyết định**, không phải lỗi tốc độ |
| `ovenBurnEnabled` (cháy do để quên) | Có | Có | **KHÔNG** — bánh giữ ở trạng thái `CHÍN` vô hạn | |
| `BURNT_OR_COLD` do *đặt sai mức lửa / nướng lại lần 2* | Có | Có | **CÓ** | Vẫn là lỗi quyết định |
| `dishColdRate` (bánh nguội) | 1,00 | 0,60 | **0,00** | |
| `arrivalModel` | Theo đồng hồ | Theo đồng hồ | **Theo sự kiện**: khách kế tới sau khi khách trước rời quầy | Ngày dài bằng *số khách*, không bằng phút |
| `maxConcurrentCustomers` | Theo setting (mặc định 3) | Theo setting | Bị ép về **min(setting, 2)** | Nếu không có đồng hồ thì 3 người đứng chờ vô nghĩa |
| `peakHourThroughputPenalty` | Có | Có | **KHÔNG** | §13.3 CANON: cao điểm 6h30–8h |
| `customersPerDay` | Theo lịch | Theo lịch | **Y HỆT theo lịch** | **Không cắt bớt khách** — không ai bị mất nội dung vì chọn trợ năng |
| `dailyFixedCost` | Theo §13 | Y hệt | **Y HỆT** | Không giảm giá, không "chế độ dễ ăn tiền" |
| Giá chợ / hạn dùng / tip | — | — | **Y HỆT** | Kinh tế không đổi → không tạo lỗ hổng §8(c)(j) |
| `undoCostSeconds` | 0,6s | 0,6s | **0** (vẫn có animation) | |
| Achievement / ending / arc | Đủ | Đủ | **ĐỦ.** Không khoá gì | Ghi rõ trên Steam |

**Câu nói gọn để dán lên menu (và lên Steam):**

> *"Khách vẫn bỏ đi vì bạn làm **sai**. Khách không bao giờ bỏ đi vì bạn **chậm**."*

**Vẫn còn nguyên trong chế độ không giới hạn** (danh sách này phải hiện trong menu, để người chơi biết mình không đang bật "chế độ thắng"): sai công thức, bỏ thứ khách cấm, quên món khách gọi, gọi sai tên, tay bẩn cầm tiền rồi bốc đồ ăn, làm rớt đồ, quầy bẩn, phục vụ sai thứ tự, hết hàng, không trả nghĩa vụ định kỳ, tin đồn.

**Kiểm chứng cân bằng:** P5-04 §4 phải chứng minh `KHONG_GIOI_HAN` **không** tạo dominant strategy (không có thời gian ≠ không có đánh đổi: tồn kho, hạn dùng, nghĩa vụ, khách ruột vẫn ép chọn). *Cần đo trong playtest vòng 2.*

---

### 2.3. Nhóm bắt buộc 3 — Giảm chuyển động

Một công tắc chính `reduceMotion` (OFF mặc định) + **cho phép chỉnh lẻ từng mục** (người loạn thị có thể chịu được lá bay nhưng không chịu được rung màn hình).

| # | Hiệu ứng | Hệ | Mặc định | Khi TẮT → thay bằng | Mất thông tin gì? |
|---|---|---|---|---|---|
| 1 | **Xe máy chạy qua nền** | `ambient` | Bật | Xe máy **dựng đứng, tĩnh**, thêm 1–2 chiếc; tiếng xe vẫn còn nhưng đi vào bus `duongPho` (tắt riêng được) | Không. Xe chạy qua chưa bao giờ mang thông tin gameplay |
| 2 | **Đám đông nền** (người đi bộ có walk-cycle) | `ambient` | Bật | 3–4 **bóng người tĩnh** ở độ sâu xa, thay tư thế mỗi 20–40s bằng **cross-fade 200ms**, không trượt ngang | Không |
| 3 | **Lá bay / bụi / hạt** | `fx` | Bật | Xoá hoàn toàn. Lá nằm tĩnh dưới đất | Không |
| 4 | **Rung màn hình** (`DROPPED_FOOD`, sấm) | `fx` | Bật | **Xung viền 250ms** màu trung tính `#8A9AA3`, dày 4px, fade-out tuyến tính. **Không** phải nháy đỏ (đỏ là công tắc số 6, §2.4) | Có → phải thay. Xung viền gánh phần đó |
| 5 | **Chuyển cảnh trượt** (quầy ↔ chợ ↔ tối) | `scene` | Bật | **Cross-fade 120ms**. Nếu `reduceMotion.strict` → **cắt cứng 0ms** | Không |
| 6 | **Parallax theo con trỏ** | `camera` | Bật | Tắt hẳn, camera khoá cứng | Không |
| 7 | **Typewriter chữ** | `ui` | Bật | Hiện nguyên dòng tức thì | Không |
| 8 | **Zoom punch camera** (lúc `CONFIRMED`) | `camera` | Bật | Tắt. Thay bằng **vignette tĩnh 180ms** quanh mặt NPC liên quan | Có → vignette gánh |
| 9 | **Khói / hơi nước từ lò** | `fx` | 100% hạt | **20% hạt, bỏ nhiễu động (turbulence), tốc độ ×0,5** | Có, một phần: khói là tín hiệu "lò đang nóng" → **giữ lại 20%** chứ không xoá |
| 10 | **Mưa** (vệt mưa, gió lay) | `weather` | 100% | **25% mật độ, bỏ lay gió**, giữ tiếng mưa mái tôn | Không (mưa là thông tin, nhưng thông tin nằm ở HUD thời tiết + tiếng) |
| 11 | **Squash/stretch 1–2 frame** (P5-02) | `sprite` | Bật | **GIỮ.** 1–2 frame ở 30fps = 33–66ms, lệch 1 hàng pixel — dưới ngưỡng gây khó chịu | — |
| 12 | **Ngôn ngữ cơ thể NPC** (spring rig) | `sprite` | Biên độ 1,0 | **Biên độ ×0,40 nhưng thời gian giữ pose ×1,8** | **CÓ VÀ RẤT NHIỀU.** Xem hộp cảnh báo dưới |
| 13 | **Nhấp nháy mắt NPC** | `sprite` | Bật | Giữ (chớp mắt không phải chuyển động gây kích ứng) | — |
| 14 | **Nhấp nháy / pulse trên UI** (chỉ báo "còn nữa") | `ui` | Nháy 1 lần | Thay bằng **mũi tên tĩnh** | Không |
| 15 | **Xe đẩy lăn vào đầu ngày** (intro mỗi ngày) | `scene` | Bật | Cắt thẳng tới khung xe đã dựng xong | Không |

> **CẢNH BÁO THIẾT KẾ — mục 12.**
> Theo **T3**, ngôn ngữ cơ thể là **kênh chỉ số duy nhất** của game. Tắt nó = xoá bảng chỉ số. Vì vậy `reduceMotion` **không bao giờ** được xoá spring rig. Cách đúng: **giảm biên độ, tăng thời gian giữ** — pose nhỏ hơn nhưng đứng lâu hơn để đọc kịp.
> Kèm theo, mở thêm một tuỳ chọn độc lập:
> **`postureCaptions`** (mặc định TẮT) — mô tả tư thế bằng chữ ở ngay dưới NPC, 1 dòng, ≤ 6 từ, màu `#B9C2C4`, không có số:
> *"chú Tư lùi nửa bước"* · *"bà Bảy nghiêng đầu nhìn tay bạn"* · *"chị Lan nhìn đi chỗ khác"*.
> Đây là "phụ đề cho ngôn ngữ cơ thể". Nó **không** vi phạm T3 vì nó mô tả cái đang thấy được, không tiết lộ chỉ số ẩn.

**Test tiền đình (QA-A11Y):** quay 60s gameplay giờ cao điểm với `reduceMotion` bật, đo **tổng số pixel dịch chuyển của lớp nền trên mỗi giây**. Mục tiêu: **< 3% chiều rộng màn hình/giây**, không có vệt chuyển động liên tục > 400ms.

---

### 2.4. Nhóm bắt buộc 4 — Âm thanh tách 5 kênh

Chi tiết kiến trúc ở **P5-03 §2**. Ở đây chỉ ghi **hợp đồng trợ năng**.

| Bus | Khoá | Mặc định | Khoảng | Chứa gì |
|---|---|---|---|---|
| Nhạc | `bus.nhac` | **55** | 0–100 | Toàn bộ nhạc nền, stem thích ứng |
| Tiếng đường phố | `bus.duongPho` | **70** | 0–100 | Ambience hẻm, xe máy, còi, mưa, radio hàng xóm, chó sủa, **tiếng rao** |
| Giọng NPC | `bus.giongNPC` | **100** | 0–100 | VO, bark, tiếng thở/"hm?", tiếng nói lỏm |
| Tiếng thao tác | `bus.thaoTac` | **85** | 0–100 | Dao, bánh giòn, than nổ, quết pate, gói giấy, tiền lẻ |
| Âm báo | `bus.amBao` | **80** | 0–100 | Tín hiệu UI: mở menu, chốt đơn, autosave, QR, chuyển ngày |

**Nút riêng: "Tắt âm báo tiêu cực"** — `disableNegativeAudioCues` (mặc định TẮT, tức là âm báo tiêu cực vẫn có).

Khi **BẬT**, bỏ đúng những thứ này và **không bỏ gì khác**:

| Âm bị bỏ | Thay bằng |
|---|---|
| Tiếng "sai rồi" (buzz trầm) khi thao tác không hợp lệ | **Click gỗ trung tính**, cùng độ to, giống hệt click "hợp lệ" |
| Sting nhạc buồn khi khách bỏ đi | **Im lặng** (nhạc đã fade sẵn theo luật P5-03 §6) |
| Hợp âm thứ / nốt trầm khi `CONFIRMED` sự kiện tiêu cực | Không có gì. Bark của NPC đã là tín hiệu |
| Tiếng "hụt" cuối ngày khi doanh thu âm | Không có gì. Con số trong sổ đã nói |
| Rung tay cầm khi làm sai | Rung bị tắt (trùng với công tắc 6) |

**KHÔNG bị bỏ** (vì đây là **âm thanh diegetic mang thông tin**, không phải lời phán xét):
- Tiếng bánh **rớt xuống đất** — đây là sự kiện có thật trong thế giới, và là cách duy nhất người không nhìn kịp biết mình vừa làm rớt.
- Tiếng bánh **cháy / khét nổ lách tách**.
- Tiếng **ruồi** khi quầy bẩn.
- Tiếng khách **thở dài / chép miệng** (thuộc `bus.giongNPC`, tắt bằng bus đó nếu muốn).

> **Ranh giới:** *âm thanh mô tả thế giới thì giữ; âm thanh chấm điểm người chơi thì bỏ.*

**Thêm 3 tuỳ chọn âm thanh không có trong CANON nhưng bắt buộc về mặt kỹ thuật:**
- `monoAudio` (mặc định TẮT) — gộp stereo về mono cho người nghe một tai.
- `duckingStrength` 0–100 (mặc định 70) — mức hạ nhạc + đường phố khi NPC nói.
- `soundCaptions` (mặc định TẮT) — **phụ đề cho âm thanh không phải lời nói**: `[tiếng bánh rớt]` `[xe máy chạy qua]` `[mưa trên mái tôn]` `[tiếng ruồi]` `[tiếng rao từ xa]`. Hiện ở góc dưới-trái, tối đa 2 dòng, giữ 2,5s. → §9.

---

### 2.5. Nhóm bắt buộc 5 — Chạm-để-đặt + Hoàn tác + Xác nhận

> **Ba cái đi chung, không tách.** Đây là một gói (`safeInput`), không phải 3 setting rời. Tắt được từng cái, nhưng chúng ship cùng nhau và được test cùng nhau.
> *"Không có nó thì mọi lỗi tôi mắc trên điện thoại đều là lỗi ngón tay chứ không phải lỗi quyết định — mà bị NPC trách vì lỗi ngón tay thì cay lắm."* — Linh

#### 2.5.1. Chạm-để-đặt (tap-to-place)

```ts
type PlacementMode = 'DRAG' | 'TAP' | 'BOTH'
// Mặc định: BOTH trên mọi nền tảng. Cả hai luôn hoạt động song song.
```

- **Chạm lần 1** lên nguyên liệu → vào trạng thái `SELECTED`: outline 3px `#F0C419` + **badge hình dáng** (§2.6) phóng to 1,15× + tên hiện ở thanh dưới ("đang cầm: **hành lá**").
- **Chạm lần 2** lên ô đích → đặt.
- Chạm lại chính nó → bỏ chọn. Chạm ra vùng trống → bỏ chọn.
- **Không có timeout** cho trạng thái `SELECTED`.
- **Vùng chạm tối thiểu 44×44 px logic** cho mọi mục tương tác (kể cả khi icon vẽ nhỏ hơn — vùng chạm lớn hơn phần vẽ).
- **Khoảng cách tối thiểu giữa 2 tâm vùng chạm: 8px.** Nếu lưới nguyên liệu chật hơn → giảm số cột, không giảm khoảng cách.
- Bàn phím: `←→↑↓` di chuyển tiêu điểm, `Enter/Space` chọn & đặt, `Backspace` hoàn tác, `Tab` mở Nhật ký. Gamepad: D-pad + `A` + `B` (hoàn tác) + `X` (xác nhận).
- Tiêu điểm bàn phím/gamepad có **vòng tiêu điểm 3px `#F2F4F3` + 1px viền trong `#12161B`** (đọc được trên cả nền sáng lẫn tối).

#### 2.5.2. Nút Hoàn tác

| Thuộc tính | Giá trị |
|---|---|
| Độ sâu stack | **10** hành động |
| Phạm vi | Trong phạm vi **một ổ bánh đang làm**. Sang khách mới → xoá stack |
| Phím | `Backspace` / gamepad `B` / nút 56×56 cạnh khay |
| Thời gian thực hiện | `undoAnimMs` = 300ms (animation lấy lại) |
| Chi phí thời gian | `undoCostSeconds` = **0,6s** ở `NORMAL`/`THONG_THA`, **0** ở `KHONG_GIOI_HAN` |
| Số lần | **Không giới hạn** |

**Hoàn tác được:** đặt nguyên liệu, gỡ nguyên liệu, rạch bánh, quết pate, rưới sốt, chọn mức lửa, đổi preset, gói/mở gói.

**KHÔNG hoàn tác được (danh sách cứng — DEV-GP viết assert):**
1. `DROPPED_FOOD` — làm rớt đồ. (CANON §7.2: **bắt buộc bỏ, không được nhặt**. Undo mà cứu được đồ rớt là đi thẳng vào điều cấm.)
2. `DIRTY_HANDS` — đã cầm tiền rồi chạm đồ ăn. Hành vi đã xảy ra trước mắt khách.
3. Đưa bánh cho khách (sau bước xác nhận).
4. Nhận / thối tiền.
5. Bất cứ gì sau khi khách đã rời quầy.
6. Gọi tên khách (đã phát ra tiếng → `WRONG_NAME` bỏ qua `gazeFactor`).

**Tương tác với perception — chỗ dễ tạo lỗ hổng:**

```ts
// craft/assembly.ts
function place(ing: Ingredient, slot: Slot) {
  const stim = perception.emit(ing.stimId, slot)   // bắt đầu tích certainty ngay
  undoStack.push({ kind: 'PLACE', ing, slot, stimId: stim.id, t: now() })
}

function undo() {
  const a = undoStack.pop()
  // Luôn gỡ stimulus, KÈM hoàn lại phần certainty do chính nó sinh ra
  perception.retract(a.stimId, { rewindAccruedCertainty: true })
  // Nhưng KHÔNG hoàn lại certainty đã đạt CONFIRMED: đã ghi memory rồi
  // (perception.retract tự bỏ qua các obs đã >= CONFIRMED)
  clock.advance(timeMode === 'KHONG_GIOI_HAN' ? 0 : UNDO_COST_SECONDS)
}
```

- Hoàn tác **trong `undoGraceMs = 1200ms`** → gỡ sạch stimulus, `certainty` quay về mốc trước đó. Khách chưa kịp "thấy".
- Hoàn tác **sau** grace → vẫn gỡ nguyên liệu, và vẫn rewind certainty của stimulus đó, **nhưng nếu observation đã chạm `CONFIRMED`** (≥ 1,0) thì memory đã ghi → không rút lại được. Đúng với đời: bạn có lấy lại được, nhưng người ta đã thấy rồi.
- **Chống ăn gian:** undo không phải công cụ dò phản ứng — nó không làm lộ bất cứ thông tin ẩn nào. Chi phí 0,6s/lần ở chế độ thường giữ cho spam undo không miễn phí. Xem P5-04 §2 mục (a).

#### 2.5.3. Một bước xác nhận trước khi đưa bánh

Nút **"Đưa bánh"** cần **hai lần tương tác riêng biệt**, không phải giữ-để-xác-nhận (người run tay không giữ được).

Bấm lần 1 → hiện **Thẻ đọc lại**, chiếm 560×360 logic, nền đục:

```
┌──────────────────────────────────────┐
│  Ổ bánh của chú Tư                    │
│                                       │
│  Chú Tư đã nói:                       │
│  "Cho ổ đầy đủ, ít rau, không hành."  │
│  ─────────────────────────────────    │
│  Bạn đã bỏ vào:                       │
│   [▬] pate          [◉◉◉] thịt nguội  │
│   [◐] chả lụa       [▤] đồ chua       │
│   [⬭] dưa leo       [≡] hành lá       │
│   [◞] ớt  ×2        [◌] nước sốt      │
│   [▬] bơ            — nướng: vừa      │
│                                       │
│     [ Quay lại sửa ]   [ Đưa bánh ]   │
└──────────────────────────────────────┘
```

**Luật vàng của thẻ này:**

> Thẻ xác nhận **đọc lại việc bạn đã làm**. Nó **KHÔNG** đối chiếu với đơn hàng, **KHÔNG** tô đỏ chỗ sai, **KHÔNG** cảnh báo "bạn quên hành".

Lý do: đối chiếu tự động sẽ giết **delivery-time diff** (CANON §6) — kỹ thuật lõi, ROI cao nhất của dự án — và giết luôn **T1**. Trợ năng ở đây là **đọc lại trung thực hành động của chính người chơi** (thứ mà người mắt tốt vẫn thấy trên khay), không phải cho lời giải.

- Đơn hàng nguyên văn của khách hiện ở **nửa trên** để người ADHD không phải nhớ. Nó vốn đã được nói ra và vốn đã ở trong Nhật ký.
- `confirmBeforeServe` mặc định **BẬT** trên mọi nền tảng. Tắt được, không kèm cảnh báo nào ngoài một dòng: *"Bạn sẽ đưa bánh ngay khi bấm nút."*
- Trong lúc thẻ mở: **đóng băng** `patience` + `certainty` (đây là `blocking: true`).
- "Quay lại sửa" trả về đúng trạng thái khay, không mất gì.

---

### 2.6. Sáu công tắc bắt buộc (CANON §15)

| # | Công tắc | Khoá | Mặc định | Ảnh hưởng hệ nào | Cảnh báo cho người chơi |
|---|---|---|---|---|---|
| **1** | **NPC nhớ nhầm / đổ oan** | `allowFalseMemory` | **BẬT** | `sim/gossip.ts` (mutation graph §12), `sim/memory.ts` (bias theo tính cách §8h). Khi TẮT: `mutation_rate = 0` cho mọi kind, bias nhớ nhầm = 0, tin đồn truyền **đúng nguyên văn**, vẫn giảm `confidence` mỗi hop | **Có, 1 dòng, không doạ:** *"Tin đồn vẫn lan, nhưng không bị kể sai đi nữa. Một vài cảnh của bà Bảy và chị Lan sẽ không xuất hiện."* Không khoá achievement |
| **2** | **Số khách cùng lúc** | `maxConcurrentCustomers` = 1 / 2 / **3** | **3** | `sim/schedule.ts`, `sim/perception.ts` (ít mắt hơn → dễ hơn thật), `econ` (không đổi). Khi = 1 (**"một khách một lượt"**): khách xếp hàng *ngoài khung hình*, chỉ 1 người ở `FRONT_CENTER`, `MADE_THEM_WAIT` theo thời gian vẫn chạy ở `NORMAL` | **Không cảnh báo.** Nhưng **phải ghi rõ**: *"Số khách trong ngày không đổi. Ngày sẽ dài hơn."* — để người chơi biết mình không bị cắt nội dung |
| **3** | **Khách biến mất không chia tay** | `silentDeparture` | **BẬT** | `content/npcs` arc (chị Lan — "người im lặng biến mất"; chú Tư ~ngày 30). Khi TẮT → *"họ để lại lời nhắn"*: một tờ giấy / một dòng qua bà Sáu xuất hiện ở **sổ tay tối** cùng ngày | **Có, và đây là chỗ duy nhất đáng nói thật:** *"Bạn sẽ luôn biết vì sao họ không quay lại. Khoảnh khắc đó sẽ nhẹ đi."* |
| **4** | **Sổ tay cuối ngày** | `eveningNotebook` | **BẬT** | `scenes/EveningScene`. Khi TẮT: bỏ **bước bắt buộc** cuối ngày, đi thẳng ra màn hình sáng hôm sau. **Sổ tay vẫn mở được bất cứ lúc nào** bằng `Tab` → hệ giả thuyết (§22.3 idea) **không bị mất** | Không cảnh báo. Ghi chú: *"Sổ tay vẫn mở được bằng phím Tab."* |
| **5** | **Tiếng ồn đám đông riêng** | `bus.duongPho` + `crowdSubMix` | **70** / **60** | Chỉ âm thanh. `crowdSubMix` tách riêng tiếng người nói lao xao ra khỏi bus đường phố (người tự kỷ/ADHD hay bị chính lớp này làm quá tải, chứ không phải tiếng xe) | Không |
| **6** | **Hiệu ứng khi làm sai (rung, nháy đỏ)** | `errorFeedbackFx` | **BẬT** | `ui/fx`. Khi TẮT: bỏ rung tay cầm, bỏ nháy đỏ toàn màn, bỏ shake. **Thay bằng**: xung viền trung tính 250ms `#8A9AA3` + mục trong Nhật ký. **Không được bỏ trắng** | Không cảnh báo, nhưng menu ghi: *"Bạn vẫn được báo là có chuyện, chỉ là nhẹ hơn."* |

**Luật chung cho cả 6:** **không công tắc nào khoá achievement, khoá ending, khoá arc, hay đánh dấu save là "chế độ dễ".** Ghi câu này nguyên văn lên đầu trang cài đặt.

---

### 2.7. Thiết kế icon phân biệt được bằng HÌNH DÁNG

**Vấn đề:** dưa leo, ngò rí, hành lá **đều xanh**. Với protanopia/deuteranopia chúng là ba mảng xám giống hệt nhau. Với loạn thị ở 24px chúng là ba vệt nhoè.

**Nguyên tắc:** *nhận ra được ở 24px, hoàn toàn đen trắng, hoàn toàn mất nét trong.* Nghĩa là **silhouette phải đủ khác nhau**.

#### 2.7.1. Bảng hình dáng

| Nguyên liệu | Silhouette (mô tả tạo hình) | Đặc trưng nhận dạng | Màu chính |
|---|---|---|---|
| **Dưa leo** | **Ê-líp dài nằm ngang, hai đầu cắt phẳng** (tỉ lệ 3:1), 3 chấm hạt ở giữa | Dài, ngang, đầu vuông | `#7FA86A` |
| **Ngò rí** | **Chùm quạt hình tam giác** — 3 lá tròn thuỳ toả từ một cuống dưới | Tam giác, mép răng cưa | `#4E7A47` |
| **Hành lá** | **Hai nét thẳng đứng song song**, gốc phình trắng ở đáy | Dọc, hai nét, gốc trắng | `#5E9150` + `#E8EDE6` |
| **Ớt** | **Móc cong hình dấu phẩy**, có cuống ngắn trên đỉnh | Cong, nhọn đuôi | `#C0392B` |
| **Đồ chua** | **Gò sợi đan chéo** (cross-hatch) thành ụ thấp | Đan chéo, ụ thấp, ngang | `#E0A34B` + `#F2EDE0` |
| **Pate** | **Khối chữ nhật bo góc**, một góc chảy mềm | Khối đặc, góc bo | `#8A5E48` |
| **Thịt nguội** | **3 đĩa tròn mỏng chồng lệch** | Ba vòng tròn chồng | `#D68B8B` |
| **Chả lụa** | **Hình tròn dày khuyết một múi tư** | Tròn có khuyết | `#EFE4D2` |
| **Heo quay** | **Chữ nhật, cạnh trên khía răng lược** (da giòn) | Cạnh trên khía | `#B4703A` |
| **Xíu mại** | **Hai viên cầu đặt trên nền sốt lượn sóng** | Hai cầu + sóng dưới | `#B8503C` |
| **Cá** | **Ô-van có khuyết đuôi hình chữ V** | Khuyết chữ V | `#C7BBA6` |
| **Gà xé** | **Ba dải lượn sóng rời nhau** | Ba sợi rời | `#E0CFA8` |
| **Ốp la** | **Tròn nhỏ nằm trong mảng bất định** | Tròn trong blob | `#F5D04A` + `#FBF7EE` |
| **Nước sốt** | **Giọt nước** đơn | Giọt | `#6B4A2E` |
| **Xì dầu** | **Giọt nước có nắp vuông trên đỉnh** (chai) | Giọt + vuông | `#3A2A1E` |
| **Bơ** | **Khối thang (hình thang) dày** | Hình thang | `#F0D98A` |
| **Sữa đặc** | **Xoáy ốc 2 vòng** | Xoáy | `#F6EEDC` |
| **Muối tiêu** | **Tam giác lọ rắc + 5 chấm rơi** | Tam giác + chấm | `#8A8E88` |
| **Bánh mì** | **Hình thoi dài (torpedo) + 3 vạch chéo** | Vạch chéo | `#C98A4B` |
| **Trà đá** | **Ly hình thang ngược + 2 khối vuông đá** | Thang ngược | `#B7C9CE` |

#### 2.7.2. Luật kiểm chứng silhouette (tự động, chạy trong CI)

```ts
// tools/icon-silhouette-check.ts
// 1. Render mọi icon ở 24×24, alpha -> mặt nạ nhị phân
// 2. Với mọi cặp (i, j):
//      IoU(i, j)            phải < 0.60
//      huMomentDist(i, j)   phải > 0.18
// 3. Với mọi icon: tỉ lệ khung bao (bbox aspect) phải rơi vào >= 3 nhóm khác nhau
//      trong nhóm "rau xanh" {dưa leo, ngò, hành lá}  -> bắt buộc 3 nhóm khác nhau
// Fail build nếu vi phạm.
```

Ngưỡng `IoU < 0,60` và `huMomentDist > 0,18` là **giá trị khởi điểm**, tune ở §5.

#### 2.7.3. Mô phỏng mù màu — 3 loại + 1

`ART-1` và `QA-A11Y` phải duyệt mọi icon qua **4 bộ lọc**, ship sẵn shader mô phỏng trong dev build (`ui/settings/cbSim.ts`, bật bằng `F9`):

| Loại | Tỉ lệ dân số (nam) | Kiểm gì |
|---|---|---|
| **Protanopia** (mù đỏ) | ~1% | Ớt vs nước sốt vs thịt nguội; **bảng hiệu đỏ chữ vàng** |
| **Deuteranopia** (mù lục) | ~1% | **Dưa leo vs ngò vs hành lá** — ca nặng nhất |
| **Tritanopia** (mù lam) | hiếm | Trà đá vs nước; xanh xám nền vs bóng đổ |
| **Grayscale** (bổ sung) | — | Lưới an toàn: nếu qua được grayscale thì qua được cả 3 loại trên |

Tiêu chí pass: **5 người test, mỗi người xem 20 icon ở 24px dưới từng bộ lọc, gọi tên đúng ≥ 85%.** Với riêng cụm 3 rau xanh: **100%**.

#### 2.7.4. Tuỳ chọn hiện chữ dưới icon

| Khoá | Giá trị | Hành vi |
|---|---|---|
| `showIngredientLabels` | **BẬT** (mặc định) | Tên nguyên liệu, 1 dòng, cỡ "chú thích" của mức chữ hiện tại, dưới icon |
| | TẮT | Chỉ icon; tên hiện khi hover/giữ 400ms |
| `ingredientPanelMode` | `GRID` (mặc định) / `LIST` | `LIST` = hàng ngang cao `2,2 × lineHeight`, icon 48px bên trái + tên. **Tự động chuyển sang `LIST` khi mức chữ ≥ 3** |

Luật chữ nhãn: **không cắt bằng `...`**. Tên dài thì **xuống 2 dòng**, ô cao thêm, lưới bớt 1 hàng. Không bao giờ thu nhỏ chữ để vừa.

---

### 2.8. Typography tiếng Việt

#### 2.8.1. Vì sao line-height chật là hỏng

Tiếng Việt có **dấu chồng dấu**: `ề` `ộ` `ỡ` `ữ` `ẩ` `ặ` `ệ` `ợ` — dấu thanh nằm **trên** dấu phụ nguyên âm. Chiều cao thật của một dòng chữ Việt cao hơn chữ Anh khoảng **18–22%**. Với `line-height` 1,2 (mặc định của rất nhiều engine), phần dấu thanh của dòng dưới **đâm vào** phần descender của dòng trên, hoặc bị **cắt cụt** bởi khung clip.

Luật:
- `line-height` **≥ 1,50** ở mọi nơi, **≥ 1,60** ở cỡ chữ mức 3–4.
- Padding **trên** của mọi vùng chữ ≥ `0,35em`; padding **dưới** ≥ `0,25em`.
- Trong Phaser: `Text.setLineSpacing(px)` cộng thêm khoảng cách; **đồng thời** đặt `style.padding = { top: ceil(0.35*fontSize), bottom: ceil(0.25*fontSize) }` vì Phaser clip theo `canvas` tự tính và **bỏ sót dấu thanh cao**.
- Đặt `Text.resolution = window.devicePixelRatio` — thiếu dòng này là dấu bị nhoè ở màn hình HiDPI.
- **Không dùng BitmapText cho tiếng Việt.** Atlas phải chứa đủ 134 glyph tiếng Việt × 4 cỡ × 2 weight → phình và vẫn nhoè khi scale. Dùng web font + `Phaser.GameObjects.Text`, cache nhãn tĩnh vào `RenderTexture`.

#### 2.8.2. Font — có đủ dấu, giấy phép thương mại

| Vai trò | Font | Giấy phép | Vì sao |
|---|---|---|---|
| **Chính (thoại, UI, nhãn)** | **Be Vietnam Pro** | **SIL OFL 1.1** — dùng thương mại tự do, nhúng vào game tự do, không cần trả phí, không cần ghi công (nên ghi) | Do người Việt thiết kế (Be Group), **dựng riêng cho tiếng Việt** — vị trí dấu thanh được vẽ tay chứ không phải ghép tự động. Có 9 weight. Đây là lựa chọn đúng nhất hiện có |
| **Dự phòng 1** | **Inter** | SIL OFL 1.1 | Phủ Vietnamese subset đầy đủ, x-height cao, đọc tốt ở cỡ nhỏ |
| **Dự phòng 2** | **Noto Sans** | SIL OFL 1.1 | Lưới an toàn cuối, Google bảo đảm phủ Unicode |
| **Số / bảng giá / sổ** | **Be Vietnam Pro** với `font-variant-numeric: tabular-nums` | OFL | Số thẳng cột trong sổ nợ và bảng chợ |
| **Chữ trong texture (bảng hiệu, bao bì)** | `ART-1` **vẽ tay** | Tự vẽ | Không phải chuỗi đọc được → không tính vào a11y, nhưng vẫn không được viết hoa toàn bộ |

Weight dùng: **400** thân, **600** nhấn, **700** tiêu đề. **Cấm weight ≤ 300** (nét mảnh + dấu nhỏ = mất dấu với mắt cận/loạn).

**Font bị cấm dùng cho chữ đọc được:**
- Mọi font **condensed / narrow** (dấu chồng lên nhau theo chiều ngang).
- Mọi font **display / handwriting / pixel** cho thân chữ.
- Mọi font **thiếu glyph tiếng Việt** — có test tự động, xem dưới.
- **Chữ nghiêng (italic) cho thân chữ tiếng Việt** — dấu bị nhoè và lệch. Nhấn mạnh bằng **weight 600** hoặc **màu**, không bằng nghiêng.

**Test glyph tự động (CI):**
```ts
const VN_PROBE = "ăâđêôơư ĂÂĐÊÔƠƯ àáảãạ ằắẳẵặ ầấẩẫậ èéẻẽẹ ềếểễệ " +
                 "ìíỉĩị òóỏõọ ồốổỗộ ờớởỡợ ùúủũụ ừứửữự ỳýỷỹỵ"
// Với mỗi font: render VN_PROBE, assert không có glyph .notdef (ô vuông),
// và assert chiều cao ink của "ữ" <= (lineHeight - paddingTop)
```

#### 2.8.3. Không viết hoa toàn bộ

**Lý do không phải thẩm mỹ:** VIẾT HOA TOÀN BỘ làm mất hình dáng từ (word shape) — thứ mà người khó đọc dựa vào — **và tiếng Việt viết hoa thì dấu bị đẩy lên cao hơn nữa, dễ bị cắt hơn nữa** (`Ữ` `Ộ` `Ằ`).

- Nhãn nút: **sentence case** — "Đưa bánh", "Quay lại sửa", "Bắt đầu ngày mới".
- Tiêu đề mục: sentence case, phân cấp bằng **cỡ và weight**, không bằng viết hoa.
- Cho phép viết hoa: **tên riêng**, **từ viết tắt đã là viết tắt** (QR, TP.HCM), **chữ trên texture bảng hiệu** (vì đó là hình, không phải chuỗi).
- **Lint bắt buộc (CI):**
```ts
// Với mọi chuỗi s trong content/**/*.json:
if (s.length > 3 && s === s.toUpperCase() && /\p{L}/u.test(s) && !ALLOWLIST.has(s))
  fail(`ALL-CAPS bị cấm: "${s}"`)
```
- **Cấm `text-transform: uppercase` trong toàn bộ style.** Có grep check trong CI.

#### 2.8.4. Vài luật chữ khác

| Luật | Giá trị |
|---|---|
| Độ dài dòng tối đa | **62 ký tự** (tiếng Việt), **66** (tiếng Anh). Dài hơn thì ngắt dòng |
| Canh chữ | **Canh trái.** Không canh đều (justify) — khoảng trắng co giãn phá nhịp đọc |
| Tương phản chữ/nền | **≥ 7:1** cho thân chữ, **≥ 4,5:1** cho chữ phụ. Không có ngoại lệ |
| Màu không phải kênh duy nhất | Mọi trạng thái phân biệt bằng màu **phải** kèm hình dáng / icon / chữ |
| Ngắt dòng tiếng Việt | Ngắt theo **khoảng trắng**, không ngắt giữa từ, không hyphenation |
| Đại từ xưng hô | Giữ nguyên "cô / con / chú / chị / anh / em" trong bản Anh (CANON §2). Giải thích một lần ở đầu game, **và có lại trong menu Trợ giúp** |

---

### 2.9. Mục accessibility trên trang Steam — nội dung viết sẵn

> `PROD` dán nguyên văn. Tiếng Anh ở trên (Steam đọc EN trước), tiếng Việt ở dưới.

```
────────────────────────────────────────────────────────────
ACCESSIBILITY

We wrote this section before we wrote the game's marketing copy.
Everything below is in the shipping build. Nothing here is
"planned" or "coming soon".

TEXT
  • 4 text sizes (100% / 130% / 160% / 200%), previewed live in the menu
  • Fully opaque dialogue background (never transparent)
  • Dialogue boxes grow to fit; text is never clipped or truncated
  • Text NEVER auto-advances. You tap to continue. Always.
  • Optional persistent bark log (nothing disappears before you read it)
  • Sans-serif typeface built for Vietnamese diacritics; line-height >= 1.5
  • No ALL-CAPS anywhere in the interface
  • Body text contrast >= 7:1 (WCAG AAA)

TIME AND PACE
  • Pause anywhere — mid-drag, mid-sentence, mid-bake
  • Pausing freezes customer patience AND how much they've noticed
  • Unlimited Time mode: customers can still leave because you got it
    WRONG. They will never leave because you were SLOW.
  • "One customer at a time" mode
  • No achievements, endings or story content are locked behind any
    accessibility setting

MOTION
  • Reduce Motion master switch, plus 15 individual toggles
  • Turn off: passing motorbikes, background crowds, falling leaves,
    screen shake, sliding scene transitions, camera parallax,
    camera punch, typewriter text, weather intensity
  • NPC body language is never removed (it is how the game tells you
    things) — it is reduced in amplitude and held longer instead
  • Optional posture captions: "Chú Tư takes half a step back"

AUDIO
  • 5 independent volume channels: music / street / NPC voices /
    hands & cooking / interface
  • Separate "no negative audio cues" switch — no error buzz, no sad
    music sting when a customer walks away
  • Separate crowd-chatter submix
  • Mono audio option, adjustable ducking
  • Captions for non-speech sounds
  • Full subtitles for all voiced lines, with speaker names
  • Human voice actors. No AI-generated voices anywhere in this game.

INPUT
  • Tap-to-place as a full alternative to drag-and-drop (both always on)
  • Undo button, 10 steps deep, unlimited uses
  • A confirmation step before handing over the food — it reads back
    what YOU did; it does not tell you whether you got it right
  • Full keyboard and gamepad support; visible focus ring
  • All touch targets >= 44 px; no hold-to-confirm anywhere
  • No quick-time events, no timed button presses, no rhythm inputs

COLOUR AND ICONS
  • Ingredients are distinguished by SHAPE, not only colour
    (cucumber, cilantro and spring onion are all green — they are an
    ellipse, a fan and two vertical strokes)
  • Optional labels under every icon; optional list view
  • Verified under protanopia, deuteranopia, tritanopia and greyscale

SAFETY SWITCHES
  • NPCs misremembering / blaming you unfairly: can be turned off
  • Customers leaving without saying goodbye: optional "they leave a note"
  • End-of-day notebook: optional
  • Damage feedback (shake, red flash): can be turned off, replaced by a
    neutral outline pulse

WHAT WE DO NOT HAVE
  • No flashing lights, no strobe, no rapid red flashes
  • No stamina bar, no daily login, no timers that run while you are away
  • No jump scares, no gore, no war content
────────────────────────────────────────────────────────────
```

**Bản tiếng Việt** đặt ngay dưới, cùng cấu trúc, cùng 8 nhóm, dịch sát — `PROD` viết, `QA-A11Y` đối chiếu từng gạch đầu dòng với build thật trước khi page live.

**Luật cứng:** **không được viết một gạch đầu dòng nào mà build chưa có.** Gate ở §6.

---

## 3. Dữ liệu & schema

```ts
// ui/settings/accessibility.ts

export type TextScaleLevel = 1 | 2 | 3 | 4
export type TimeMode = 'NORMAL' | 'THONG_THA' | 'KHONG_GIOI_HAN'
export type PlacementMode = 'DRAG' | 'TAP' | 'BOTH'
export type BarkHoldMode = 'AUTO' | 'HOLD' | 'LOG_ONLY'
export type PanelMode = 'GRID' | 'LIST'

export type AccessibilitySettings = {
  version: 1

  text: {
    scale: TextScaleLevel          // 1
    boxOpacity: number             // 1.00  (clamp 0.92..1.00)
    barkHold: BarkHoldMode         // 'AUTO'
    subtitles: boolean             // true  (không tắt được cho dòng có VO)
    speakerNames: boolean          // true
    soundCaptions: boolean         // false
    postureCaptions: boolean       // false
  }

  time: {
    mode: TimeMode                 // 'NORMAL'
    pauseFreezesCertainty: true    // HẰNG SỐ, không sửa được
  }

  motion: {
    master: boolean                // false = không giảm
    strictTransitions: boolean     // false
    passingVehicles: boolean       // true
    backgroundCrowd: boolean       // true
    particles: boolean             // true
    screenShake: boolean           // true
    sceneSlide: boolean            // true
    parallax: boolean              // true
    typewriter: boolean            // true
    cameraPunch: boolean           // true
    ovenSmokeScale: number         // 1.0  -> 0.2 khi giảm
    weatherDensity: number         // 1.0  -> 0.25 khi giảm
    bodyLanguageAmp: number        // 1.0  -> 0.40 khi giảm
    bodyLanguageHold: number       // 1.0  -> 1.80 khi giảm
  }

  audio: {
    bus: {
      nhac: number                 // 55
      duongPho: number             // 70
      giongNPC: number             // 100
      thaoTac: number              // 85
      amBao: number                // 80
    }
    crowdSubMix: number            // 60
    master: number                 // 90
    mono: boolean                  // false
    duckingStrength: number        // 70
    disableNegativeAudioCues: boolean  // false
    a11yPerceptionPing: boolean        // false  (xem P5-03 §5)
  }

  input: {
    placement: PlacementMode       // 'BOTH'
    undoEnabled: true              // HẰNG SỐ
    undoDepth: number              // 10
    confirmBeforeServe: boolean    // true
    holdToConfirm: false           // HẰNG SỐ: không bao giờ dùng giữ-để-xác-nhận
    minTouchTargetPx: 44           // HẰNG SỐ
    focusRing: boolean             // true
  }

  icons: {
    showLabels: boolean            // true
    panelMode: PanelMode | 'AUTO'  // 'AUTO'  (AUTO -> LIST khi scale >= 3)
    colorBlindSim: 'OFF' | 'PROTAN' | 'DEUTER' | 'TRITAN' | 'GRAY'  // 'OFF' (dev)
  }

  switches: {
    allowFalseMemory: boolean          // true
    maxConcurrentCustomers: 1 | 2 | 3  // 3
    silentDeparture: boolean           // true
    eveningNotebook: boolean           // true
    errorFeedbackFx: boolean           // true
  }
}
```

**Ví dụ content thật — cấu hình mặc định + preset "Linh":**

```json
{
  "presets": {
    "MAC_DINH": { "label": "Mặc định", "patch": {} },

    "DE_DOC": {
      "label": "Dễ đọc",
      "note": "Chữ lớn, hộp đục, không có gì tự chạy.",
      "patch": {
        "text.scale": 3,
        "text.barkHold": "HOLD",
        "motion.typewriter": false,
        "icons.showLabels": true,
        "icons.panelMode": "LIST"
      }
    },

    "IT_NHIEU": {
      "label": "Ít nhiễu",
      "note": "Bớt chuyển động và tiếng ồn, giữ nguyên độ khó.",
      "patch": {
        "motion.master": true,
        "audio.bus.duongPho": 35,
        "audio.crowdSubMix": 15,
        "switches.errorFeedbackFx": false
      }
    },

    "THONG_THA": {
      "label": "Thong thả",
      "note": "Không bị hối. Khách vẫn giận nếu bạn làm sai.",
      "patch": {
        "time.mode": "KHONG_GIOI_HAN",
        "switches.maxConcurrentCustomers": 1,
        "input.confirmBeforeServe": true
      }
    },

    "LINH": {
      "label": "Tất cả",
      "note": "Bật hết mọi hỗ trợ. Không khoá nội dung nào.",
      "patch": {
        "text.scale": 4,
        "text.barkHold": "HOLD",
        "text.soundCaptions": true,
        "text.postureCaptions": true,
        "time.mode": "KHONG_GIOI_HAN",
        "motion.master": true,
        "motion.strictTransitions": true,
        "audio.disableNegativeAudioCues": true,
        "audio.crowdSubMix": 0,
        "icons.showLabels": true,
        "icons.panelMode": "LIST",
        "switches.allowFalseMemory": false,
        "switches.maxConcurrentCustomers": 1,
        "switches.silentDeparture": false,
        "switches.errorFeedbackFx": false
      }
    }
  }
}
```

**Preset là điểm khởi đầu, không phải cái khoá.** Bấm preset → mọi công tắc lẻ vẫn chỉnh tiếp được.

**Lưu trữ:** `AccessibilitySettings` nằm **ngoài** file save game (`localStorage['bmcb.a11y']` riêng). Xoá save không mất cài đặt trợ năng. Bắt đầu game mới cũng giữ.

---

## 4. UI/UX hai thiết bị

| Khía cạnh | **PC (chuột + phím + tay cầm)** | **Cảm ứng (demo web trên tablet/điện thoại, và mobile v2)** |
|---|---|---|
| Vào cài đặt trợ năng | `ESC` → tab đầu tiên **là** "Trợ năng" (không phải tab thứ 4) | Nút bánh răng 56×56 góc trên-phải, luôn hiện |
| Hỏi lần đầu | Màn hình **thứ hai** khi mở game lần đầu (sau chọn ngôn ngữ) hiện 3 câu: cỡ chữ? giảm chuyển động? không giới hạn thời gian? — với preview sống | Y hệt |
| Đặt nguyên liệu | Kéo-thả **và** chạm-để-đặt song song. Bàn phím: mũi tên + `Enter` | Chạm-để-đặt là chính; kéo-thả vẫn chạy |
| Hoàn tác | `Backspace` / `B` / nút cạnh khay | Nút 56×56 **cố định** cạnh khay, không nằm trong menu con |
| Pause | `ESC` / `P` / `Start` | Nút 56×56 góc trên-phải |
| Qua dòng thoại | Chuột trái / `Space` / `A` — **vùng chạm = cả hộp** | Chạm cả hộp |
| Cỡ chữ mức 4 | Chân dung thu 64px, hộp full width | Y hệt; thêm: bảng nguyên liệu chuyển `LIST`, cuộn dọc bằng ngón |
| Tiêu điểm | Vòng tiêu điểm 3px + đọc được bằng screen reader nhãn ARIA (demo web) | Không có tiêu điểm; vùng chạm ≥ 44px là hợp đồng thay thế |
| Rung | Tay cầm (tắt được) | Haptic (tắt được) |
| Điểm đau riêng | Chuột run → **không** dùng double-click ở bất kỳ đâu; mọi thao tác là single-click | Ngón cái che khay → nút "Đưa bánh" đặt ở **cạnh phải-dưới**, khay ở giữa-trên |
| Demo web (itch.io) | Thêm `lang="vi"`, `<title>` đúng, nhãn ARIA cho nút chính. Không claim hỗ trợ screen reader đầy đủ (game không phải web app) | Y hệt |

**Luật chung hai thiết bị:** **không thao tác nào cần giữ nút, không thao tác nào cần double-tap, không thao tác nào cần vuốt chính xác, không QTE.** Mọi thứ làm được bằng **một chạm đơn**.

---

## 5. Tham số cần tune

| Tên | Khởi điểm | Khoảng an toàn | Cách đo | Ai |
|---|---|---|---|---|
| `text.scale` mức 4 hệ số | 200% | 175–225% | Test layout 24 tổ hợp; vỡ ở đâu thì hạ | `DEV-UI` |
| `dialogBox.maxHeight` | 0,45 × H | 0,40–0,55 | Ở mức 4 + câu dài nhất, đếm % dòng phải cuộn. Mục tiêu < 15% số câu | `DEV-UI` |
| `lineSpacing` mức 1 | 11px | 9–14px | Chụp `Ữ` `ộ` `ỡ` ở 4 mức, đo pixel ink bị cắt = **0** | `DEV-UI` |
| `barkHoldMs` (`AUTO`) | 3200ms | 2400–4500ms | Playtest: % người nói "có câu nó biến mất trước khi tôi đọc xong". Mục tiêu 0/10 | `QA-A11Y` |
| `undoGraceMs` | 1200ms | 800–2000ms | Đếm số lần undo hợp lệ bị tính là "khách đã thấy". Mục tiêu < 5% | `DEV-GP` |
| `undoCostSeconds` (NORMAL) | 0,6s | 0,3–1,2s | Nếu > 8 undo/ổ ở playtest → chi phí quá rẻ hoặc UI quá khó | `DEV-GP` |
| `undoDepth` | 10 | 8–20 | % lần người chơi chạm đáy stack. Mục tiêu < 3% | `DEV-GP` |
| `bodyLanguageAmp` khi giảm chuyển động | 0,40 | 0,30–0,55 | *Cần đo*: người bật giảm chuyển động có đọc đúng tâm trạng NPC không (playtest vòng 3, ≥ 7/10) | `DEV-GP` + `ART-1` |
| `bodyLanguageHold` khi giảm chuyển động | 1,80× | 1,4–2,4× | Cùng test trên | `DEV-GP` |
| `reduceMotion` ngưỡng dịch chuyển nền | < 3%/s | 2–5%/s | Script đo pixel-shift trên video 60s | `QA-A11Y` |
| `icon.IoU` trần | 0,60 | 0,50–0,68 | Nếu CI fail quá nhiều icon hợp lệ → nới. Nếu người test nhầm → siết | `ART-1` |
| `icon.huMomentDist` sàn | 0,18 | 0,12–0,26 | Cùng trên | `ART-1` |
| `minTouchTargetPx` | 44 | **không xuống dưới 44** | Đo bằng script quét hitbox | `DEV-UI` |
| `duckingStrength` | 70 | 50–85 | *Cần đo*: % người nói "không nghe rõ NPC" ở playtest | `SND` |
| `patienceDrainRate` (THONG_THA) | 0,50× | 0,35–0,70× | Xem P5-04 §3 | `DEV-GP` |
| `maxConcurrentCustomers` mặc định | 3 | 2–4 | *Cần đo*: thời lượng ngày thật (P5-04 §3 bước 1) | `DEV-GP` |
| Tương phản thân chữ | 14,8:1 | **≥ 7:1** | Script tính tỉ lệ tương phản cho mọi cặp màu chữ/nền trong theme | `DEV-UI` |

---

## 6. Tiêu chí đạt

**Gate A5 — không đạt thì không lên Steam page.** `QA-A11Y` chạy, `PROD` ký.

### 6.1. Checklist đo được

| # | Tiêu chí | Cách đo | Pass |
|---|---|---|---|
| A1 | 4 mức chữ hoạt động, preview sống | Thủ công, 4 mức | 4/4 |
| A2 | Không glyph tiếng Việt nào bị `.notdef` hoặc bị cắt | Script `VN_PROBE` × 3 font × 4 mức | 0 lỗi |
| A3 | Hộp thoại đục alpha ≥ 0,92 ở mọi scene | Script quét `alpha` mọi `DialogBox` | 0 vi phạm |
| A4 | Không có chuỗi nào tràn / bị `...` | Script chụp 24 tổ hợp × 40 màn hình, so bbox chữ với bbox container | 0 tràn |
| A5 | Text không bao giờ tự chạy tiếp | Bot chạy 30 phút **không bấm gì**, assert không có dòng nào tự qua | 0 |
| A6 | Pause hoạt động ở cả 6 trạng thái §2.2.1 | Test tự động, 6 ca | 6/6 |
| A7 | Pause đóng băng đủ 11 hệ trong `PAUSABLE` | Unit test: pause 10s, assert mọi biến không đổi | 11/11 |
| A8 | `KHONG_GIOI_HAN`: không khách nào rời đi vì thời gian | Bot đứng yên 20 phút in-game với 1 khách đang chờ | 0 khách rời |
| A9 | `KHONG_GIOI_HAN`: khách VẪN rời đi vì làm sai | Kịch bản: bỏ ớt vào ổ của người cấm ớt, 5 lần | 5/5 phản ứng đúng |
| A10 | 15 mục giảm chuyển động tắt được riêng lẻ | Thủ công | 15/15 |
| A11 | Dịch chuyển nền < 3%/s khi `reduceMotion` | Script phân tích video 60s giờ cao điểm | Pass |
| A12 | 5 bus âm thanh độc lập, kéo về 0 không rò rỉ | Đo RMS từng bus khi 4 bus kia = 0 | 5/5 |
| A13 | "Tắt âm báo tiêu cực" bỏ đúng 5 mục, giữ đúng 4 mục | Checklist thủ công 9 mục | 9/9 |
| A14 | Tap-to-place làm được **mọi** thao tác mà kéo-thả làm được | Danh sách 18 thao tác | 18/18 |
| A15 | Undo 10 bước, không undo được 6 mục cấm | Unit test 16 ca | 16/16 |
| A16 | Thẻ xác nhận **không** tiết lộ đúng/sai | Đọc mã + review thủ công | Pass |
| A17 | Mọi vùng chạm ≥ 44px, cách nhau ≥ 8px | Script quét hitbox toàn bộ scene | 0 vi phạm |
| A18 | Không có double-click / giữ-để-xác-nhận / QTE ở đâu cả | Grep mã + review | 0 |
| A19 | Icon: `IoU < 0,60` và `huMoment > 0,18` mọi cặp | CI | Pass |
| A20 | Icon: 5 người × 20 icon × 4 bộ lọc, gọi đúng ≥ 85%; cụm 3 rau xanh 100% | Test người | Pass |
| A21 | Không có ALL-CAPS trong content và style | CI lint | 0 |
| A22 | Tương phản thân chữ ≥ 7:1 ở mọi theme | Script | 0 vi phạm |
| A23 | 6 công tắc bắt buộc đều hoạt động và **không** khoá nội dung | Thủ công + assert danh sách achievement | 6/6 |
| A24 | Cài đặt trợ năng sống sót qua "New Game" và "Xoá save" | Thủ công | Pass |
| A25 | Không có flash > 3 Hz, không vùng đỏ nhấp nháy | Script phân tích video (chuẩn PEAT về nguyên tắc) | 0 |
| A26 | Mọi gạch đầu dòng trong mục Steam §2.9 đều đúng với build | Đối chiếu từng dòng, 2 người ký | 100% |

### 6.2. Test với người thật

| Vòng | Khi nào | Ai | Nhiệm vụ | Pass |
|---|---|---|---|---|
| **A-1** | Cuối P1 (tuần 8) | 2 người: 1 cận nặng/loạn, 1 ADHD | Chơi 20 phút vertical slice ở cài đặt mặc định | Không ai phải hỏi "chữ ghi gì vậy". Ghi lại mọi lần dừng vì khó đọc |
| **A-2** | Giữa P5 | 4 người: + 1 mù màu, + 1 hạn chế vận động tay | Chơi 3 ngày in-game, tự chỉnh cài đặt trước | Tự tìm ra cài đặt hợp mình trong **< 4 phút**, không cần hướng dẫn |
| **A-3** | Cuối P5, trước khi page live | 6 người (4 nhóm trợ năng + 2 người chơi thường) | Chơi 40 phút, sau đó **đọc mục Steam §2.9 và chấm từng dòng đúng/sai** | ≥ 24/26 dòng được xác nhận đúng; 0 dòng bị chấm "sai" |
| **A-4** | Cùng lúc với playtest vòng 3 (P5-04 §7) | 4 người nhóm trợ năng, nằm trong 20 người | Trả lời câu hỏi cổng: *"Bạn có biết vì sao khách đó giận không?"* | **≥ 3/4** — nếu nhóm trợ năng tụt dưới tỉ lệ chung 7/10 thì T5 chưa đạt cho họ |

**Tiêu chí A-4 là tiêu chí nghiêm nhất của cả tài liệu.** Nó nói: *hệ thống đọc được* phải đọc được **cho cả Linh**, chứ không chỉ cho người mắt tốt.

---

## 7. Rủi ro & cách bịt

| # | Rủi ro | Hậu quả | Cách bịt |
|---|---|---|---|
| R1 | **Thẻ xác nhận biến thành máy dò lỗi** — ai đó sẽ đề xuất "tô đỏ chỗ thiếu cho thân thiện" | Giết delivery-time diff (CANON §6) và giết **T1** cùng lúc | Ghi vào mã một comment cấm + test A16. Luật: thẻ đọc lại **hành động của người chơi**, không đọc **đơn của khách trừ nguyên văn** |
| R2 | **Chế độ không giới hạn thời gian thành dominant strategy** | Vi phạm P5-04 §4 | Kinh tế không đổi một đồng nào; áp lực chuyển từ *giây* sang *tồn kho / hạn dùng / nghĩa vụ*. Đo ở playtest vòng 2 |
| R3 | **Undo dùng để né perception** — spam undo tới khi khách nhìn đi chỗ khác | Đi thẳng vào §8(a) "farm cửa sổ điện thoại" | `undoCostSeconds` 0,6s ở chế độ thường; undo **không** tiết lộ gaze; và undo sau `undoGrace` vẫn không rút lại được `CONFIRMED` |
| R4 | **`allowFalseMemory = false` thành chế độ dễ** | Người chơi bật để tránh bị oan → mất cả một trục cảm xúc | Tắt nó **không** giảm hệ quả của lỗi thật; chỉ bỏ phần *bị kể sai*. Tin đồn đúng vẫn lan. P5-04 §2(h) kiểm chứng |
| R5 | **`maxConcurrentCustomers = 1` phá kinh tế** (ít khách → ít tiền) | Người cần trợ năng bị phạt bằng tiền | Số khách/ngày **không đổi**, họ xếp hàng ngoài khung. Ngày dài hơn về phút thật. Test A23 |
| R6 | **Giảm chuyển động xoá mất ngôn ngữ cơ thể** → mất kênh T3 duy nhất | Người bật giảm chuyển động không đọc được quan hệ | Không bao giờ xoá rig: biên độ ×0,40, giữ ×1,80, + `postureCaptions`. Đo ở A-4 |
| R7 | **Font thiếu dấu lọt vào build** qua một asset/texture mới | Chữ vuông trong bản phát hành | CI `VN_PROBE` + preview trong menu dùng đúng chuỗi khó |
| R8 | **Mục Steam hứa thứ build không có** | Refund + mất niềm tin đúng nhóm khán giả quan tâm nhất | A26: hai người ký từng dòng. Nếu một tính năng bị cắt → **xoá dòng đó khỏi Steam trước khi cắt khỏi build** |
| R9 | **Trợ năng bị đẩy xuống cuối lịch rồi bị cắt** | Cắt hết | Gate A5 nằm **trước** gate "Steam page live" (tuần 9 theo idea §23). Không có page nếu không có A5 |
| R10 | **`postureCaptions` lộ chỉ số ẩn** → vi phạm T3 | Giết cảm giác người | Caption chỉ mô tả **pose đang render**, sinh từ `poseId` chứ không từ `trustPoints`. Review mã bắt buộc |
| R11 | Phaser clip mất dấu thanh ở HiDPI | Chữ nhoè/cụt trên máy 4K, máy Mac | `Text.resolution = devicePixelRatio` + padding top 0,35em. Test A2 chạy ở 3 DPR (1, 1.5, 2) |
| R12 | Bot test A5 không bắt được auto-advance trong cutscene arc | Lọt lưới | Bot chạy **cả** cutscene; danh sách scene phải liệt kê đủ trong test |

---

## 8. Truy vết

| Nội dung | `idea.md` | `CANON.md` |
|---|---|---|
| 5 nhóm bắt buộc, persona Linh | §20 (dòng 994–1012) | §15.1–15.5 |
| 6 công tắc bắt buộc | §20 | §15 |
| Icon khác nhau về hình dáng, chữ dưới icon | §20 | §15 |
| Font sans, line-height rộng, không viết hoa toàn bộ | §20 | §15 |
| "Vào Steam xem mục accessibility trước khi bấm mua" | §20 mở đầu | §15 (tinh thần) |
| Pause đóng băng kiên nhẫn khách | §20.2 | §15.2 |
| Perception `certainty` tích luỹ (thứ pause phải đóng băng) | §17 / HT1 | §5 |
| `MADE_THEM_WAIT` salience 100 | — | §3.1 |
| Delivery-time diff (lý do thẻ xác nhận không được tiết lộ đúng/sai) | §17 | §6 |
| Không hiện chỉ số quan hệ | Phần I §3 bảng bẫy | §1 T3 |
| Cao điểm 6h30–8h, đông khách = nhiều mắt | §22.3 | §13.3 |
| Ngôn ngữ cơ thể bằng spring rig (thứ không được xoá) | §18.6 Đừng-4 | §16 Đừng-4 |
| Đại từ xưng hô không dịch | §19.5 | §2 |
| Lồng tiếng người thật, phụ đề | §19.5 | §2 |
| Cổng "≥7/10 trả lời đúng vì sao khách giận" | §23 tuần 5–8 | §17 P1 |

---

## 9. Đề xuất sửa CANON

| # | Mục CANON | Hiện tại | Đề xuất | Lý do |
|---|---|---|---|---|
| **C1** | **§15.2** | *"Pause đóng băng **cả sự kiên nhẫn của khách**"* | Sửa thành: *"Pause đóng băng **cả sự kiên nhẫn của khách và `certainty` của mọi observation**"* | Nếu `certainty` vẫn tích luỹ (hoặc vẫn decay) trong lúc pause thì bấm pause = bị phạt, và T5 ("đọc được rủi ro **trước** khi hành động") mất nghĩa. Đây là điều kiện để §2.2.1 đứng được |
| **C2** | **§15** (danh sách công tắc) | 6 công tắc | Thêm công tắc **thứ 7: `soundCaptions`** — phụ đề cho âm thanh không phải lời nói (`[tiếng bánh rớt]`, `[xe máy chạy qua]`) | Game có **âm thanh mang thông tin gameplay** (bánh rớt, ruồi, bánh cháy). Không có caption thì người khiếm thính mất hẳn một kênh sự kiện — mà §3 có 3 sự kiện phụ thuộc âm thanh (`WRONG_NAME` "là âm thanh", `DROPPED_FOOD` "có tiếng động", `BURNT_OR_COLD`) |
| **C3** | **§15** | — | Thêm: **`postureCaptions`** — phụ đề cho ngôn ngữ cơ thể | T3 đẩy toàn bộ chỉ số vào mặt/dáng. Người giảm chuyển động hoặc thị lực kém mất kênh đó mà **không có kênh thay thế nào khác tồn tại trong thiết kế** |
| **C4** | **§15** | — | Thêm một dòng luật: *"Không công tắc trợ năng nào được khoá achievement, ending, arc, hay đánh dấu save là chế độ dễ."* | Đang là luật ngầm trong doc này; nên nằm ở CANON để không ai sửa sau |
| **C5** | **§2** (định danh kỹ thuật) | — | Thêm hàng: **Font — Be Vietnam Pro (SIL OFL 1.1), dự phòng Inter → Noto Sans. Cấm condensed, cấm weight ≤ 300, cấm italic cho thân chữ Việt** | Font là hằng số dùng chung của mọi doc UI; để ở CANON thì P6 (Steam page, trailer) dùng đúng luôn |
| **C6** | **§15.5** | *"Chạm-để-đặt **thay** kéo-thả"* | Làm rõ: *"Chạm-để-đặt **song song với** kéo-thả — cả hai luôn bật"* | "Thay" đọc ra có thể hiểu là loại trừ. Bắt người quen kéo-thả phải đổi cách chơi là một rào cản mới, không phải trợ năng |
