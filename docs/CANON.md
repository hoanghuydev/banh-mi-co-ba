# CANON — Hằng số thiết kế dùng chung

> **Đây là nguồn sự thật duy nhất cho mọi tài liệu trong `docs/`.**
> Mọi agent viết doc PHẢI đọc file này trước và PHẢI dùng đúng tên định danh, đúng con số ở đây.
> Nếu một doc cần đổi con số trong này → không tự đổi, ghi vào mục "Đề xuất sửa CANON" ở cuối doc đó.
> Nguồn gốc: `idea.md` (Phần I §1–6, Phần II §7–14, Phần III §15–25). Phần III **thắng** khi mâu thuẫn với I/II.

---

## 0. Một câu

> Bạn bán bánh mì ở đầu hẻm Sài Gòn. Khách đứng cách bạn nửa mét và **nhìn thấy mọi thứ bạn làm**.

**Tagline marketing:** *"Món ăn chính là lựa chọn hội thoại."*
**Dẫn đầu bằng:** *"a game about being watched while you work"* — **không** dẫn đầu bằng chữ "cozy".

**Tên tạm:** *Bánh Mì Cô Ba*.

---

## 1. Năm trụ cột — vi phạm trụ nào là sai thiết kế, không phải tranh luận

| # | Trụ cột | Hệ quả bắt buộc |
|---|---|---|
| **T1** | **Khách chấm QUÁ TRÌNH, không chỉ chấm kết quả** | Mọi sai sót phải xảy ra **trước mặt khách**, trong tầm nhìn có thể đọc được |
| **T2** | **Món ăn LÀ lựa chọn hội thoại** | **Không có dialogue tree.** Người chơi không bao giờ chọn câu nói. Họ chọn nguyên liệu |
| **T3** | **Không hiện chỉ số quan hệ** | Không `+3 trust`, không thanh tình cảm, không màu tên. Chỉ mặt, lời, dáng, hành động, hệ quả trễ |
| **T4** | **Một mùa có điểm kết** | 40 ngày. Ship trọn vẹn. **Không** Early Access, **không** daily login, **không** stamina, **không** cây chết khi offline |
| **T5** | **Attention phải NHÌN THẤY ĐƯỢC** | Không roll xúc xắc. Certainty tích luỹ. Người chơi phải đọc được rủi ro **trước** khi hành động |

---

## 2. Định danh kỹ thuật cố định

| Khoá | Giá trị |
|---|---|
| Engine | **Phaser 3** + **Vite** + **TypeScript** |
| Kiến trúc v1 | **Client-only, offline-first.** Không server, không Colyseus, không netcode |
| Save | localStorage (web) / file JSON (desktop). **Autosave sau mỗi khách**, không phải sau mỗi ngày |
| Desktop wrapper | **Electron** (KHÔNG Tauri — WebView hệ thống render khác nhau mỗi máy, Steam Overlay/Input hay lỗi) |
| Nền tảng v1 | **PC (Steam) + demo web itch.io**. Mobile là **v2**, sau khi bán 30k bản |
| Giá v1 | **$9.99 / 59.000₫** + demo web miễn phí. ($12.99–14.99 **chỉ nếu** có publisher trả tiền marketing) |
| Độ phân giải thiết kế | 2.5D isometric/cận-2D, 30fps mục tiêu, nền bake vào RenderTexture |
| Ngôn ngữ | **Tiếng Việt giọng miền Nam** (gốc) + **phụ đề tiếng Anh**. Lồng tiếng **người thật**, không AI voice |
| Đại từ xưng hô | **KHÔNG dịch.** Giữ nguyên "cô / con / chú / chị / anh / em" trong bản Anh. Giải thích một lần ở đầu game |

**Cấu trúc thư mục đề xuất (mọi doc dùng chung đường dẫn này):**

```
client/src/
  core/        clock.ts  rng.ts  save.ts  eventbus.ts  flags.ts
  sim/         perception.ts  memory.ts  gossip.ts  reputation.ts  schedule.ts
  dialog/      ruledb.ts  query.ts  shufflebag.ts  barks.ts
  craft/       recipe.ts  assembly.ts  diff.ts  equipment.ts
  econ/        market.ts  inventory.ts  supplier.ts  ledger.ts  obligations.ts
  content/     npcs/  rules/  lines/  days/  recipes/
  ui/          stall/  notebook/  market/  settings/
  scenes/      BootScene  DayScene  StallScene  MarketScene  EveningScene
```

---

## 3. 11 sự kiện xương sống

> Hội đồng chốt "10 sự kiện" (HT7). Ở đây là **11**, vì luật §9.7 bắt buộc **số sự kiện tích cực ≥ số sự kiện tiêu cực trong trải nghiệm thực tế**; 5 tích cực / 6 tiêu cực là cấu hình nhỏ nhất giữ được cả hai ràng buộc. `MESSY_STALL` bị hạ xuống thành **trạng thái quầy**, không tính là sự kiện — nên **số lỗi vệ sinh = 3/11**, dưới trần 4 của phán quyết XĐ1.

### 3.1. Tiêu cực (6)

| ID | Sự kiện | Salience | Loại | Ghi chú |
|---|---|---|---|---|
| `WRONG_NAME` | Gọi sai tên / quên tên khách quen | **100** | Quan hệ | **FLAGSHIP.** Là âm thanh, nhắm thẳng vào khách → **bỏ qua gazeFactor**, luôn bị nghe thấy |
| `MADE_THEM_WAIT` | Bắt chờ quá lâu / phục vụ sai thứ tự | **100** | Dịch vụ | Không cần gaze. Leo thang theo giây |
| `BURNT_OR_COLD` | Bánh cháy, hoặc bánh nguội không nướng lại | **80** | Công thức | Có mùi → bán kính nhận thấy rộng hơn |
| `DROPPED_FOOD` | Làm rớt nguyên liệu/ổ bánh xuống đất | **75** | Vệ sinh | Có tiếng động. **Bắt buộc bỏ, không được nhặt** — xem §7 |
| `ORDER_DEFECT` | Sai công thức: thiếu món đã gọi / bỏ thứ khách cấm / sai tỉ lệ | **20 tại quầy → 100 lúc ăn** | Công thức | Họ **sự kiện**, không phải một sự kiện. Chạy qua delivery-diff (§6) |
| `DIRTY_HANDS` | Cầm tiền rồi bốc đồ ăn, gãi đầu, chạm mặt | **40** | Vệ sinh | Sự kiện dẫn đầu trailer (phán quyết §24) |

### 3.2. Tích cực (5)

| ID | Sự kiện | Salience | Ghi chú |
|---|---|---|---|
| `REMEMBERED_USUAL` | Làm đúng "như mọi bữa" mà khách không phải nói | **90** | Khoảnh khắc chữa lành lõi của game |
| `REMEMBERED_STORY` | Hỏi thăm đúng chuyện họ kể hôm trước | **70** | Dùng memory slot làm đầu vào |
| `CARED_FOR_THEM` | Ly trà đá, kéo ghế, che dù lúc mưa, gói kỹ cho khỏi ướt | **50** | **Đồng thời là công cụ hạ attention** (§5.4) |
| `FREE_EXTRA` | Cho thêm đồ chua / thêm ớt / bớt tiền lẻ | **25** | Có diminishing returns — xem §8 mục (i) |
| `FLOURISH` | Thao tác đẹp: rạch bánh một đường, quết pate gọn, gói nhanh | **15** | Thưởng cho kỹ năng tay, không thưởng cho tiền |

### 3.3. Trạng thái (không phải sự kiện)

| ID | Trạng thái | Cơ chế |
|---|---|---|
| `STALL_CLEANLINESS` | Độ sạch quầy: rác, ruồi, dầu mỡ, nước đọng | Tích luỹ trong ngày. **Không sinh bark tức thì.** Ảnh hưởng: `traitMul` của mọi khách +, và **giảm số khách ngày hôm sau** |

### 3.4. Sự kiện CHỦ Ý (không tính vào cân bằng tích cực/tiêu cực của §3.1–3.2)

Đây không phải lỗi người chơi *có thể mắc* — đây là hành động người chơi **cố tình chọn**. Vì vậy nó không nằm trong luật cân bằng 6/5 ở trên.

| ID | Sự kiện | Salience | Ghi chú |
|---|---|---|---|
| `REFUSED_SERVICE` | Từ chối phục vụ một khách | **85** | Bịt lỗ hổng ăn gian §8k — trước đây §8k **không có sự kiện nào biểu diễn nó**, nên không thực sự được bịt. Người bị từ chối **kể cho cả hẻm** (hệ số lan truyền cao nhất trong game) |

---

## 4. Tính cách — đúng 4 chiều

```ts
type Personality = {
  soi: number        // 0..1  kỹ tính ↔ xuề xoà   → traitMul ở tầng nhận thấy
  nongTinh: number   // 0..1  dễ nổi  ↔ điềm đạm  → cường độ phản ứng, âm lượng
  deTha: number      // 0..1  dễ bỏ qua ↔ để bụng → tốc độ decay của memory
  thanThien: number  // 0..1  mở lòng ↔ khép kín  → tốc độ lên quan hệ + xác suất lan tin
}
```

**Công thức chuẩn (P1-02, chốt):** `traitMul = 0.65 + 0.70 · soi` — chọn hằng số để `soi = 0.5` cho đúng `1.000`, nhờ đó "khách chuẩn" trong mọi bảng hiệu chỉnh là một NPC có thật (Ông Hải / Chị Hạnh).

**Quy tắc suy ra hành vi (không có chiều "nói thẳng" riêng):**
`nói thẳng ra miệng` ≈ `nongTinh` cao **hoặc** `thanThien` cao.
`im lặng rồi biến mất` ≈ `soi` cao **và** `nongTinh` thấp **và** `thanThien` thấp.

**Hai ràng buộc kỹ thuật (đừng "tối ưu" đi trong một lần refactor):**
1. **`deTha` và `thanThien` phải giữ ĐỘC LẬP.** 6/12 NPC rơi vào ô *"dễ tha nhưng nói nhiều"* — gồm **cả hai nút khuếch đại** (bà Sáu, bé Su). Đây chính là cơ chế bịt lỗ hổng ăn gian §8b (phân tầng khách), và nó hoạt động **mà không cần một dòng code nào**: người dễ tha không giận, nhưng vẫn vô tư kể lại cho người soi. Gộp hai chiều này = mở lại §8b.
2. **Ô "im lặng biến mất" (`soi+ / nongTinh− / deTha− / thanThien−`) chỉ được cấp cho ĐÚNG MỘT người** — chị Lan. Ba người im lặng biến mất = người chơi không học được luật nào, chỉ thấy khách rụng dần.

**Ba bucket quan hệ, bất đối xứng** (theo RimWorld, không làm 7 bậc):
`Rival` → `Acquaintance` → `Friend`.
**KHÔNG bê vòng xoáy tiêu cực của RimWorld** (opinion thấp → hệ số bị xúc phạm ×6). Cozy không sống nổi với "một lần sai → cả phố tẩy chay".

---

## 5. Tầng NHẬN THẤY (perception) — công thức chuẩn

```
rate = salience * visibility[slot][zone] * occluderMul * gazeFactor * traitMul / 100
obs.certainty += rate * dt          // TÍCH LUỸ, không roll xúc xắc mỗi frame
obs.certainty -= decayRate * dt     // khi kích thích biến mất (kiểu capacitor)
```

**4 state, mỗi state có biểu hiện hình ảnh bắt buộc:**

| Certainty | State | Biểu hiện |
|---|---|---|
| `< 0.35` | `UNAWARE` | — |
| `0.35–0.70` | `GLIMPSED` | Quay đầu, dấu `?` nhỏ |
| `0.70–1.0` | `NOTICED` | Nhíu mày, bark tier-1 |
| `≥ 1.0` | `CONFIRMED` | Phản ứng đầy đủ + ghi memory + ảnh hưởng tip |

**Bảng `visibility` là bảng tra tĩnh, O(1)** — ở quầy hàng khoảng cách và góc đều là hằng số:

| | `HANDS` | `BOARD` | `OVEN` | `UNDER_COUNTER` |
|---|---|---|---|---|
| `FRONT_CENTER` | **0.95** | 0.85 | 0.60 | 0.05 |
| `FRONT_SIDE` | 0.70 | 0.65 | 0.75 | 0.05 |
| `QUEUE_2` | 0.45 | 0.40 | 0.50 | 0.02 |
| `QUEUE_3` | **0.20** | 0.18 | 0.30 | 0.00 |
| `SEATED_FAR` | 0.10 | 0.10 | 0.25 | 0.00 |

**Hiệu chỉnh kiểm tra (phải khớp khi tune):**
- `DROPPED_FOOD` (75) × khách nhìn thẳng → `CONFIRMED` sau **~1,4 giây**.
- Cùng sự kiện khi khách bấm điện thoại (`gazeFactor` 0.05) → cần **~28 giây** → thực tế không bao giờ.

**Duyệt loop từ phía SỰ KIỆN, không từ phía NPC.** (Bài học Mark of the Ninja: polling từ phía NPC làm cả nhóm cùng chạy tới một bóng đèn vỡ.)

### 5.4. Công cụ chủ động hạ attention — BẮT BUỘC có, nếu không cơ chế thành cờ bạc

| Công cụ | Hiệu ứng |
|---|---|
| Đưa ly trà đá | Khách cúi xuống uống → `gazeFactor` ↓ trong 2–3s. **Đồng thời là `CARED_FOR_THEM`** |
| Hỏi một câu | Khách nhìn **mặt** bạn thay vì nhìn **tay** |
| Đặt thân mình / ổ bánh che tầm nhìn | `occluderMul` ↓ |
| Chọn đứng bên trái / bên phải xe | Đổi `zone` đang lộ |
| Cô Ba đứng tiếp khách | Chuyển gaze của **một** khách sang cô Ba (§7.4) |

> Cửa sổ khách bấm điện thoại **chỉ 2–3 giây** — đủ để dùng nếu đã chuẩn bị sẵn, không đủ để "farm". Xem §8 mục (a).

---

## 6. Delivery-time diff — kỹ thuật lõi, ROI cao nhất trên mỗi dòng thoại

```
for each defect in diff(order.spec, dish):
    if npc.observations[defect.stimId].state >= NOTICED:
        line = ANTICIPATED    // "tôi thấy con quên bỏ hành rồi đó"
    else:
        line = DISCOVERED     // "ủa... thiếu hành rồi"
visible = defects.sortBySalience().take(1)   // TỐI ĐA 1 lỗi được NÓI RA
silentScore = sum(all defects)               // các lỗi còn lại vẫn ảnh hưởng tip ngầm
```

**Luật `take(1)`** lấy từ Lucas Pope (*Papers, Please*): nhiều lỗi cùng lúc làm game **dễ hơn**, không khó hơn.
**Cùng một lỗi, hai câu thoại hoàn toàn khác nhau tuỳ khách có chứng kiến hay không** — đây là hiện thân kỹ thuật của trụ cột **T1**.

---

## 7. Phán quyết vệ sinh — không thương lượng (XĐ1)

1. **Tối đa 3–4 sự kiện vệ sinh** trong toàn bộ danh mục. (Hiện tại: 3 — `DROPPED_FOOD`, `DIRTY_HANDS`, `STALL_CLEANLINESS`.)
2. **KHÔNG BAO GIỜ thưởng cho hành vi gian dối vệ sinh.** Bánh rớt = **bắt buộc bỏ, làm lại**. Mất nguyên liệu + mất thời gian → hàng chờ dài ra → khách sau cau có. **Rủi ro chuyển từ đạo đức sang vận hành.**
   → Hệ quả: **không có nút "nhặt lên dùng tiếp"**. Ý tưởng gốc ở Phần II đã bị bác bỏ.
3. **Người phán xét vệ sinh LUÔN LUÔN là người Việt.** Không bao giờ để nhân vật nước ngoài nhăn mặt chê vệ sinh.
4. **Người dạy là cô Ba, không phải hệ thống phạt.** Cô buồn chứ không la: *"Bánh đó con để cô ăn."*
5. **Kẻ gian dối vệ sinh là NPC đối thủ (chú Kiệt), không phải người chơi.**
6. **Không đưa cảnh nhặt bánh vào trailer.** Trailer dẫn đầu bằng `DIRTY_HANDS`.

### 7.4. Cô Ba — mentor, không phải nhân viên

Người chơi là **cháu của cô Ba**, đang trông xe giúp cô. Cô Ba xuất hiện buổi sáng (đi chợ) và buổi tối (đếm tiền, ghi sổ), thỉnh thoảng đứng tiếp khách vài phút. Cô **không bao giờ làm bánh thay người chơi** — xem §10.

---

## 8. Mười hai lỗ hổng ăn gian — mọi doc có cơ chế liên quan phải bịt

| # | Ăn gian | Cách bịt (đã chốt) |
|---|---|---|
| a | Farm cửa sổ điện thoại | Câu giờ có giá: kiên nhẫn tụt, hàng dài thêm, bánh nguội. Cửa sổ chỉ **2–3s** |
| b | Phân tầng khách (dồn đồ xịn cho người "soi") | Người "dễ tha" không giận nhưng **vẫn vô tư kể lại** → dùng chính hệ đồn thổi |
| c | Lịch mưa (nhập hàng rẻ ngày mưa) | Mưa cũng giảm **~40% lượng khách** → tự cân bằng |
| d | Đốt NPC rồi để nguội | Grudge decay được nhưng **hạ trần tin tưởng vĩnh viễn** |
| e | Save-scum | **Autosave ngay khi sự kiện xảy ra** + **seed cố định theo ngày** + **6 stream RNG tách rời** (xem luật L1 dưới) |
| f | Datamine + spreadsheet | Không bịt. Đảm bảo phần hay **không nằm ở EV** mà nằm ở quan hệ |
| g | **Micro-cheat lặp vô hạn** (bớt 1 thứ nhỏ với 100% khách, 40 ngày) | **Phát hiện theo PATTERN, không chỉ theo sự kiện đơn lẻ** — sau N lần: *"ê, dạo này bánh nhạt hơn hay tại tao?"*. **Đây là lỗ hổng lớn nhất hiện tại** |
| h | Khai thác nhớ nhầm chiều ngược | Bias nhớ nhầm **theo tính cách**: `soi` cao lệch xấu, `thanThien` cao lệch tốt |
| i | Spam hành vi tăng trust giá rẻ | Diminishing returns + người tinh ý nhận ra bạn đang mua chuộc → **phản tác dụng** |
| j | Tích trữ khi giá đáy | **Hạn dùng + sức chứa tủ** |
| k | Từ chối phục vụ người "soi" | Từ chối tốn kém nặng về xã hội; người bị từ chối kể cho cả hẻm |
| l | Đóng cửa sớm | **Chi phí cố định hằng ngày** + khách đến mà hết hàng thì mất lòng |

### 8.1. Bốn luật kỹ thuật — vi phạm là bug chặn phát hành, không phải góp ý

| Luật | Nội dung | Vì sao là LUẬT chứ không phải khuyến nghị |
|---|---|---|
| **L1** | **Cấm `Math.random()` ngoài `core/rng.ts`.** Sáu stream tách rời: `market` · `npcSchedule` · `dialogShufflebag` · `gossip` · `perceptionJitter` · `cosmetic` | Không phải chuyện gọn gàng — là **điều kiện sống của §8e**. Với một stream chung, người chơi reload rồi "hỏi thêm một câu" (công cụ hạ attention hoàn toàn hợp lệ) sẽ tiêu thêm vài số → dịch chuỗi → **reroll được tin đồn tối đó** |
| **L2** | **Cấm hiện `certainty` dạng số hoặc thanh trong bản bán ra.** Chỉ được hiện qua tia nhìn, tư thế, nét mặt | Đây là cách vi phạm **T5 và T3 cùng lúc** mà không ai nghĩ là vi phạm — một thanh trên đầu người sẽ khiến người chơi **ngừng nhìn mặt vĩnh viễn** |
| **L3** | **Không NPC nào được gọi `assembly.commit()`** (Luật NV-0 của `phu-luc/A`) | Là hàng rào kỹ thuật duy nhất giữ phán quyết "từ chối thuê nhân viên" khỏi bị mở lại bằng một PR |
| **L4** | **`stimId` sinh từ đúng MỘT hàm ở `core/stimid.ts`**, có test round-trip, cộng cảnh báo runtime khi một ngày chơi có **0 ANTICIPATED** | Điểm hỏng nguy hiểm nhất dự án: hai module sinh chuỗi khác format → `witness` luôn ra DISCOVERED → **nửa hay nhất của game biến mất im lặng**, không crash, không log |

---

## 9. Dàn nhân vật — 12 NPC có tên (cố định, mọi doc dùng đúng tên này)

| # | Tên | Vai | soi / nongTinh / deTha / thanThien | Chức năng thiết kế |
|---|---|---|---|---|
| 1 | **Bà Bảy** | Bán vé số | 0.9 / 0.6 / 0.8 / 0.7 | Người soi nhất hẻm nhưng dễ tha — an toàn để học luật. **Mê cải lương**; có mối bất hoà 15 năm với cô Ba không ai chịu nhắc (§19.5: không được tồn tại để bị thương hại) |
| 2 | **Chú Tư** | Bảo vệ công ty, khách 6h45 T2–T6 | 0.3 / 0.3 / 0.9 / 0.6 | Dạy người chơi **lịch sinh hoạt**. Arc: công ty dời chỗ → **biến mất ~ngày 30, có báo trước 3–4 ngày** |
| 3 | **Anh Dũng** | Tài xế Grab (trước là xe ôm truyền thống) | 0.2 / 0.5 / 0.7 / 0.5 | Luôn vội → dạy `MADE_THEM_WAIT`. Arc: đổi ca đêm giữa mùa |
| 4 | **Chị Lan** | Nhân viên văn phòng | 0.9 / 0.1 / 0.2 / 0.3 | **Người im lặng biến mất.** Đồng thời là nút lan tin đồn mạnh nhất |
| 5 | **Bé Su** | Học sinh cấp 2, quay TikTok | 0.4 / 0.4 / 0.9 / 1.0 | Bộ khuếch đại danh tiếng: chuyện tốt lẫn xấu đều lan qua bé |
| 6 | **Ông Hải** | Khách buổi chiều, hay nhậu | 0.5 / 0.9 / 0.5 / 0.6 | **Trước 10 giờ sáng rất tử tế** — đó mới là cái đau. Không phải comic relief |
| 7 | **Cô Mai** | Chủ tạp hoá đối diện — **làm ăn được** | 0.6 / 0.4 / 0.6 / 0.8 | §19.5: "cái hẻm mà ai cũng nghèo là cái hẻm giả". Nguồn đổi tiền lẻ + sổ nợ |
| 8 | **Thầy Phúc** | Giáo viên hưu trí | 0.8 / 0.2 / 0.7 / 0.5 | Điềm đạm + soi → NPC **dạy người chơi đọc hệ thống** mà không phạt nặng |
| 9 | **Chị Hạnh** | Người Bắc mới vô Sài Gòn | 0.5 / 0.3 / 0.6 / 0.4 | Gọi món bằng từ Bắc; bị chọc giọng. Arc hoà nhập |
| 10 | **Anh Bảo** | Sinh viên, cắm mặt điện thoại | 0.3 / 0.2 / 0.8 / 0.4 | `gazeFactor` thấp nhất — **sandbox để người chơi học hệ perception** |
| 11 | **Bà Sáu** | Gánh tàu hũ đi ngang hẻm | 0.4 / 0.3 / 0.8 / 0.9 | Đồng nghiệp + nút gossip. Mốc tiến trình: *"nhà tui gần chỗ bán tàu hũ"* → đổi thành *"gần xe bánh mì cô Ba"* |
| 12 | **Chú Kiệt** | **Xe bánh mì đối thủ bên kia hẻm** | 0.7 / 0.6 / 0.3 / 0.4 | Người gian dối vệ sinh (XĐ1.5). Vừa là đối thủ vừa là người duy nhất hiểu nghề của bạn |

**Ngoài danh sách:** **Cô Ba** (mentor, §7.4) và **khách vãng lai vô danh** (dùng pool thoại generic).

---

## 10. Phán quyết về 4 cơ chế được đề xuất thêm

| Cơ chế | Phán quyết | Lý do một dòng |
|---|---|---|
| **Mua thiết bị / nâng cấp** | ✅ **NHẬN** | Chính là Trục B (Phần I §3) — vòng nâng cấp công cụ trên đống bừa bộn nhìn thấy được. Là bể chứa tiền duy nhất đáng tin |
| **Nguồn hàng nhiều mức giá** | ✅ **NHẬN, MỞ RỘNG** | Trực tiếp vá HT4 ("vòng kinh tế có đúng 1 quyết định"). Tái dùng nguyên engine tính cách/trí nhớ/đồn thổi cho nhà cung cấp → chi phí gần bằng 0 |
| **Mở rộng nơi bán** | ⚠️ **NHẬN CÓ ĐIỀU KIỆN** | **Không phải chuỗi cửa hàng.** Chỉ là **đổi CHỖ ĐỨNG của một cái xe duy nhất** trong/quanh hẻm. Nhiều quầy song song = giết T1 |
| **Thuê nhân viên** | ❌ **TỪ CHỐI** (có phương án thay) | Người chơi là người bị nhìn. Nhân viên làm bánh = **không còn ai để nhìn** → T1 và T2 sụp cùng lúc. Phương án thay: **"người phụ việc không chạm vào bánh"** — xem `phu-luc/A-quyet-dinh-co-che-moi.md` |

---

## 11. Số dòng thoại và kiến trúc thoại

| Mốc | Dòng | Từ | Đối chiếu thật |
|---|---|---|---|
| **v1 / demo** | **~520** | ~5.000 | 1/10 Firewatch · 1 writer × 2–3 tuần |
| Beta nội bộ | ~1.200 | ~12.000 | ~20% Firewatch · 6–8 tuần |
| **Full release** | **~2.980** | ~30.000 | 48% Firewatch · 14% Hades · 3–4 tháng |

**Kiến trúc: rule database chấm điểm theo độ cụ thể** (Elan Ruskin, Valve, GDC 2012 — **copy nguyên, không sáng tạo**).

```
Rule {
  id; concept: Symbol;
  criteria: Criterion[];                       // sort alphabet để walk tuyến tính + early reject
  responses: Response[];                       // biến thể NẰM TRONG 1 response, không phải nhiều rule
  applycontext: [(key, value, duration_sec)];  // ĐÂY LÀ TOÀN BỘ CƠ CHẾ TRÍ NHỚ
  followup: (targetNpc|SELF|BROADCAST, concept, delay);
  speakonce: bool; norepeat: bool; odds: int(0..100);
  score: int = criteria.length;                // tính sẵn lúc load
}
```

**Ba thứ phải có từ v0:**
1. `applycontext` có `duration`.
2. `followup` **tra lúc callback, không phải lúc câu đầu bắt đầu** → giữa chừng có biến thì hội thoại **tự chấm dứt**, không cần cơ chế ngắt lời.
3. `norepeat` là thuộc tính **first-class**.

**Scope blackboard (Firewatch, dễ debug hơn pile phẳng của Valve):**
`Global` (ngày, mùa, thời tiết, danh tiếng hẻm) · `Player` (đang cầm gì, combo hiện tại) · `Customer` (archetype, mood, memory, visitCount) · `Session` (đơn hiện tại, thời gian chờ).

**Ba đòn bẩy giảm khối lượng:**
1. **Shuffle-bag thay random thuần** — 8 biến thể shuffle-bag ≈ cảm giác của ~25–30 dòng random. Đòn bẩy rẻ nhất dự án.
2. **Pool generic dùng chung 12 NPC** + chỉ viết dòng riêng cho tình huống đặc trưng. Cắt ~40% khối lượng.
3. **Bark 3 tầng** (Splinter Cell Blacklist): tier-1 rất cụ thể (có cooldown) → tier-2 chung hơn → tier-3 (*"Hửm."*) làm lưới an toàn.

**Luật chống lặp bổ sung:** ~**35% số lần "nhận thấy" KHÔNG nói gì cả** — chỉ đổi nét mặt. Im lặng làm phần còn lại đáng tin.
**Chống "twinning":** random hoá độ trễ phản ứng **0,2–0,4 giây**; không bao giờ cho cả nhóm phản ứng cùng một frame.

---

## 12. Trí nhớ và đồn thổi — ràng buộc cứng

**Trí nhớ 3 tầng slot:**
- **Short-term 6–8 slot.** Cùng kind → giữ cái `intensity` **cao hơn**. Hết slot → ghi đè cái `intensity` **thấp nhất** (*không phải cái cũ nhất* — chi tiết của Dwarf Fortress).
- **Long-term 3–4 slot**, promote sau N ngày. **Core 1 slot**, một lần duy nhất định hình NPC.
- **Decay tapering, không cliff.** **Sàn theo bucket quan hệ đã đạt**: `points = max(points - decay, floor_of_tier)`. Decay mạnh dần khi càng thân (−2 → −10 → −20).
- Chống chồng chất: memory thứ *n* cùng kind chỉ góp `0.75^(n-1)`.

**Đồn thổi — 6 ràng buộc BẮT BUỘC:**
1. `mutation_rate` **per-kind, không global**.
2. **Cap 2–3 hop.**
3. Mỗi hop `confidence *= 0.7–0.85`; **nguồn phải truy vết được** (*"chị Lan bảo tôi…"*).
4. **Người chơi phải NGHE LỎM được** hai khách nói chuyện ở góc hẻm. Không có nghe lỏm thì **bỏ luôn cả nhớ nhầm lẫn đồn thổi**.
5. **Tin tốt có hệ số lan truyền CAO HƠN tin xấu.**
6. **Mốc bắt đầu tính theo NGÀY, không theo giờ chơi.** Có **công tắc tắt**.
   `GOSSIP_START_DAY = 4` · `MUTATION_START_DAY = 8`.
   > **Sửa lỗi số học của bản CANON đầu.** Bản đầu ghi *"không xảy ra trong 2 giờ chơi đầu"*. Với `TIME_SCALE_BASE = 30` (P0-01 → một ngày ≈10,25 phút thật), 2 giờ chơi ≈ **ngày 12** — nghĩa là **bản demo web sẽ không có đồn thổi gì cả**, mà demo web chính là kênh marketing chính và đồn thổi chính là USP. Hai mốc tách rời để người chơi thấy đồn thổi **đúng** vài lần trước khi gặp đồn thổi **sai** — không có đường cơ sở đó thì rơi thẳng vào phản đối của Minh (*"tôi không phân biệt được 'NPC nhớ nhầm' với 'chính tôi quên'"*).

**Mutation graph (author tay, đây là chỗ vui nhất của game):**
```
DROPPED_FOOD    --0.30--> "bán đồ rơi xuống đất"
ORDER_DEFECT    --0.35--> "ăn bớt nguyên liệu"          # đổi ý định — nặng nhất
WRONG_NAME      --0.40--> "chảnh, không thèm nhớ khách"
FREE_EXTRA      --0.25--> "cho thêm vì ế hàng"          # công hoá tội
REMEMBERED_USUAL--0.20--> "ngon nhất khu này"           # tin tốt cũng phóng đại
```

**Tuyệt đối:** ngẫu nhiên và tin đồn được phép đổi **thoại, dáng đi, món gọi, tip, thứ tự đến**. **KHÔNG** được đổi: công thức có ra đúng món không, tiền có vào túi không, cốt truyện có unlock được không.

---

## 13. Bốn ràng buộc kinh tế (không có thì không có gì để tối ưu)

1. **Hạn dùng.** Pate 2 ngày · thịt nguội 3 · rau 1 · **đồ chua ngâm càng lâu càng ngon** (đỉnh ngày 3, chua gắt ngày 7).
2. **Dự báo cầu.** NPC có lịch sinh hoạt; người chơi phải **suy ra lịch từ quan sát** rồi tính "sáng mai cần bao nhiêu ổ". → Đây mới là chỗ hệ trí nhớ NPC **có ích thật sự**.
3. **Thông lượng giờ cao điểm.** 1 lò, 2 tay, cao điểm **6h30–8h**. **Đông khách = nhiều mắt nhìn hơn + áp lực làm nhanh = dễ ẩu.** Ràng buộc quan trọng nhất và đang thiếu hoàn toàn.
4. **Giá chợ biến động** có pattern học được (thịt đắt thứ 2, rẻ thứ 5) + sự kiện (dịch heo → pate tăng 40% trong 5 ngày).

**Fail mềm nhưng vĩnh viễn** (thay cho fail state cứng): nghĩa vụ định kỳ — tiền thuê chỗ, tiền hụi, tiền học. Không trả không chết, nhưng **mất thứ không lấy lại được**. Và **khách ruột mất là mất thật** — không có respawn quan hệ.

### 13.1. BẢNG NGHĨA VỤ HỢP NHẤT — nguồn sự thật duy nhất

> Bốn doc P3 được viết song song và lệch nhau về nghĩa vụ. Đây là bản hợp nhất đã chốt (gốc: `P3-06` §9.5, đã được `P3-04` và `P3-05` áp dụng). **Con số "thuê chỗ 2.200k/kỳ ngày 10/25/40" bị THAY, không được tồn tại song song.**

| Nghĩa vụ | Giá trị | Cả mùa 40 ngày |
|---|---|---|
| **Rút về nhà** | **150k/ngày** (bắt buộc — xe bánh mì nuôi một cái nhà; tiền không nằm hết trong két) | **6.000k** |
| **Thuê chỗ** | **theo NGÀY**, không theo kỳ. `L1` **42k** · `L2` 55k · `L3` 85k · `L4` 95k · `L5` **12k**. Cọc = 3 ngày tiền thuê | `L1` = **1.680k** |
| **Hụi** | **500k × 8 kỳ** (mỗi 5 ngày), chủ hụi là cô Mai | **4.000k** |
| **Tiền học** | **1.200k × 2** — ngày 18 và ngày 38 | **2.400k** |

**Nền đơn vị đi kèm (ba doc P3 đều đã khớp):** 28,0k/ổ · 15,4k giá vốn · **12,6k lãi gộp** · 51,7–54 ổ/ngày · ổ bánh 3,5k (lò bà Tám).
**Kiểm chứng chéo:** bảng này chừa ≈**8.050k** cho thiết bị cả mùa, trùng gần khít con số ≈**8.100k** mà `P3-04` tự tính độc lập từ cây thiết bị.

**Vì sao mô hình theo ngày thắng mô hình theo kỳ:** tiền thuê theo ngày **nối được vào cơ chế dời chỗ** của `P3-05` (mỗi chỗ một giá/ngày), còn ba cú 2.200k thì không. Và nó đổi hình dạng áp lực từ *ba cú lớn* sang *một dòng chảy đều cộng vài cú vừa* — hợp với cozy hơn hẳn.

---

## 14. Cơ chế Việt Nam

**Mở hàng / đốt vía** — khách đầu tiên trong ngày quyết định vận may cả ngày. "Nặng vía" ↔ "nhẹ vía".
Đốt vía (chi tiết chuẩn): đốt giấy bước qua **7 lần (nam) / 9 lần (nữ)** · muối hạt **tay phải (nữ) / tay trái (nam)** ném **qua vai trái** · **3 quả chanh cắt tư** · **3–5 quả bồ kết** khô · nhang **số lẻ**.
Bài khấn: *"Đốt vía, đốt van, đốt gan, đốt ruột — vía lành thì ở, vía dữ thì đi."*
⚠️ **Giữ tông trìu mến / tự trào. Là niềm tin của cô Ba, KHÔNG phải hệ ma thuật có tác dụng cơ học rõ ràng.**

**Bảng QR** là một upgrade thật (người Việt trung bình 11 ngày/tháng không tiêu tiền mặt). **Sổ nợ** là chỗ duy nhất "nhớ nhầm" hợp trực giác. **Khách tự đứng bán hộ** là sự kiện ngẫu nhiên hay nhất có thể có.

**Ngôn ngữ gọi món (dùng nguyên văn):** *"cho một ổ đầy đủ"* · *"bánh mì không"* · *"cho ít rau"* · *"nhiều ớt"* · *"không hành"* · *"đừng bỏ ngò"* · *"cho xin bịch"* · *"gói mang về"* · *"ăn tại chỗ"*.
Nhân: thịt / heo quay / pate / xíu mại / chả lụa / cá / gà / ốp la. Rau chuẩn Sài Gòn: đồ chua (cà rốt + củ cải ngâm), dưa leo, hành lá hoặc ngò rí, vài khoanh ớt, nước sốt, xì dầu, chút muối tiêu.

### 14.1. LẰN RANH ĐỎ — vi phạm là chết, không phải là bị chê

- 🔴 **Bản đồ / chủ quyền.** Mọi bản đồ, quả địa cầu, poster du lịch, tờ lịch có hình → **TỰ VẼ**. Không bao giờ mua asset pack bản đồ từ marketplace.
- 🔴 **Làm sai món Việt.** Nếu cho kết hợp bậy, phải khung rõ là **đùa có chủ ý**, và NPC Việt phản ứng đúng kiểu Việt. **Người Việt cười người Việt, không phải game cười người Việt.**
- 🔴 **Hạ thấp nghề.** Xe bánh mì là **nghề đáng tự hào, tảo tần, có phẩm giá**. Không có narrative kiểu "bán bánh mì để sống qua ngày rồi thoát ra làm việc khác".
- 🔴 **Chiến tranh — KHÔNG MỘT CHỮ.** Không flashback, không cụ già kể chuyện lính, không nón cối trong background.
- 🔴 **Credits.** Người Việt viết văn hoá phải đứng **ĐẦU** credits, không phải dòng "cultural consultant" ở cuối.
- 🟡 **Tâm linh:** giữ tông nhẹ / tự trào.

**Bảng màu:** Sài Gòn buổi sáng là **xanh xám + nắng gắt trắng**, KHÔNG phải màu vàng nghệ kiểu phim Mỹ.
**Chi tiết môi trường bắt buộc:** ghế nhựa, hũ đũa, bảng hiệu đỏ chữ vàng, xe máy dựng sát vách nhường lối đi, vài chậu trầu bà treo ngoài cửa sổ.

---

## 15. Trợ năng — bắt buộc, không phải "nice to have"

1. **Cỡ chữ 4 mức + hộp thoại nền ĐỤC**, preview ngay trong menu, hộp **tự giãn** khi chữ ≥200%. Text **không bao giờ tự chạy tiếp**.
2. **Pause mọi lúc**, kể cả giữa lúc kéo nguyên liệu và giữa lúc khách đang nói. Pause đóng băng **cả sự kiên nhẫn của khách**. Cộng **chế độ không giới hạn thời gian** (khách vẫn bỏ đi vì bạn làm **sai**, nhưng không bao giờ vì bạn **chậm**).
3. **Giảm chuyển động**: tắt xe máy chạy qua, đám đông nền, lá bay, rung màn hình, chuyển cảnh trượt.
4. **Âm thanh tách 5 kênh** (nhạc / đường phố / giọng NPC / thao tác / âm báo) + nút riêng **"tắt âm báo tiêu cực"**.
5. **Chạm-để-đặt thay kéo-thả** + **nút Hoàn tác** + **một bước xác nhận trước khi đưa bánh**. Ba cái đi chung, không tách.

**6 công tắc bắt buộc:** NPC nhớ nhầm/đổ oan · số khách cùng lúc (chế độ "một khách một lượt") · khách biến mất không chia tay (tuỳ chọn "họ để lại lời nhắn") · sổ tay cuối ngày · tiếng ồn đám đông riêng · hiệu ứng khi làm sai (rung, nháy đỏ).

**Icon:** dưa leo / ngò / hành lá đều xanh → phải khác nhau về **HÌNH DÁNG**, không chỉ màu. Font **sans, line-height rộng** (tiếng Việt có dấu chồng dấu: ề, ộ, ỡ, ữ). **Không viết hoa toàn bộ.**

> **Nguyên tắc kết game:** *"Đừng làm ending dựa trên 'bạn đã làm tốt tới đâu'. Cho mọi ending đều tử tế, chỉ khác nhau về **ai còn ở đó với mình**."*

---

## 16. Ba thứ ĐỪNG làm

**Đừng-1: mô phỏng sâu đời sống NPC ngoài quầy.** (Radiant AI: mỗi lần cải thiện lại làm nó **ít được nhận ra hơn**.) Thay bằng nguyên tắc Jeff Orkin (F.E.A.R.): *"Vocalizing intentions can sometimes even be enough, without any actual implementation."* → **Đừng mô phỏng cái xe thủng lốp của chú Tư. Cho chú NÓI RA + một prop hình ảnh (tay băng, áo ướt).** Chỉ mô phỏng sâu hơn cái người chơi nhìn thấy **đúng một tầng**.

**Đừng-2: roll xác suất mỗi frame + mô phỏng tầm nhìn chính xác.** *"Player perception should win over simulation accuracy."*

**Đừng-3: cho ngẫu nhiên / tin đồn chạm vào HỆ QUẢ.** Được đổi **biến thể** của phản ứng; **không** được đổi **category** và **intensity**.

**Đừng-4: frame-by-frame animation.** Cuphead: >25 phút cho MỘT frame. Thay bằng **layered sprite** (6 lông mày × 6 mắt × 6 miệng = **216 trạng thái từ 18 file**) + kỹ thuật Rain World (vài node đầu/thân/tay + spring/lerp → lean, tilt, nhún vai, **không tốn thêm sprite**). Celeste: biến dạng chỉ tồn tại **1–2 frame**, chênh **một hàng pixel**.

---

## 17. Bản đồ phase

| Phase | Tên | Mục tiêu đạt |
|---|---|---|
| **P0** | Nền tảng | Gỡ Colyseus, dựng khung scene/save/rng/clock, đo được "một ngày = bao nhiêu phút thật" |
| **P1** | Vertical slice | **1 quầy, 3 NPC có tên và mặt, 11 sự kiện, gossip chain HIỂN THỊ ĐƯỢC.** Gửi 10 người lạ chơi: **≥7/10 trả lời đúng "vì sao khách đó giận"** |
| **P2** | Hệ NPC đầy đủ | Rule DB + trí nhớ 3 tầng + đồn thổi + sổ tay, 12 NPC |
| **P3** | Kinh tế | 4 ràng buộc kinh tế giao nhau + thiết bị + nguồn hàng + chỗ đứng + nghĩa vụ |
| **P4** | Nội dung | 40 ngày, arc nhân vật, cơ chế Việt Nam, kết game |
| **P5** | Hoàn thiện | Trợ năng, art, âm thanh, cân bằng, chống ăn gian |
| **P6** | Phát hành | Steam page, demo web, trailer, chiến dịch wishlist |

**Cổng cứng:** tuần 12 chưa đạt **2.000 wishlist** → **dừng lại**. Vấn đề nằm ở hook hoặc art, không nằm ở việc chưa làm đủ nội dung.

---

## 18. Quy ước viết doc (mọi agent tuân thủ)

- **Tiếng Việt.** Thuật ngữ kỹ thuật giữ tiếng Anh (`certainty`, `salience`, rule DB…).
- Pseudocode dùng **TypeScript-ish**, không cần biên dịch được.
- **Mỗi doc có đủ các mục sau, đúng thứ tự:**
  1. `# <Mã doc> — <Tên>`
  2. **Thuộc phase** · **Phụ thuộc** (mã doc khác) · **Trạng thái** (Chốt / Cần đo / Còn mở)
  3. `## 1. Mục tiêu` — 3–5 dòng, nói rõ tính năng này phục vụ trụ cột nào (T1–T5)
  4. `## 2. Cơ chế` — phần chính, chi tiết, có bảng và pseudocode
  5. `## 3. Dữ liệu & schema` — kiểu TS + ví dụ JSON content thật
  6. `## 4. UI/UX hai thiết bị` — nếu có mặt trên màn hình
  7. `## 5. Tham số cần tune` — bảng: tên · giá trị khởi điểm · khoảng · cách đo
  8. `## 6. Tiêu chí đạt` — checklist đo được, không phải cảm tính
  9. `## 7. Rủi ro & cách bịt` — nối thẳng tới §8 (ăn gian) và §16 (đừng làm) nếu liên quan
  10. `## 8. Truy vết` — trỏ về mục nào của `idea.md` và mục nào của `CANON.md`
  11. `## 9. Đề xuất sửa CANON` — để trống nếu không có
- **Không bịa số liệu thị trường mới.** Chỉ dùng số đã có trong `idea.md`.
- **Không tự ý thêm cơ chế vi phạm T1–T5.** Nếu thấy cần, viết vào mục 9.
