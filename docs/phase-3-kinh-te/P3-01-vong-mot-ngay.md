# P3-01 — Vòng một ngày: 4 pha, thông lượng giờ cao điểm, mở hàng

> ## ⚡ REVAMP 2026-10-20 — ⚠️ CHẾT MỘT PHẦN
> Căn cứ: [`CANON.md`](../CANON.md) bản revamp. Phần ☠️ không dùng làm căn cứ.
>
> | Mục | Trạng thái | Lý do / thay bằng |
> |---|---|---|
> | §2.1 Pha Sáng "đi chợ 4 sạp" (cô Ba đi chợ) | 🔁 | Thành đặt hàng nhà cung cấp 3 mức chất lượng (R3); cô Ba ☠️ (R0.5) |
> | §2.1, §4 Pha Chiều/Tối: sổ nợ, sổ tay, hụi, tiền học, cảnh cô Ba đếm tiền + tiền thuốc cô Ba | ☠️ | Sổ tay/sổ nợ/fail mềm chết; cô Ba bỏ (R0.5). Pha Tối còn: chi phí cố định + mua thiết bị, bối cảnh viết lại theo quán của Phương Anh (R0.5) |
> | §2.2–§2.3 Ngân sách thời gian, đồng hồ co giãn; "chỗ đứng đầu hẻm" | ⏳ | Đo lại khi map thu nhỏ (R1), số khách mới (R5); xe → quán (R0.5) |
> | §2.4.3–§2.4.4 Đường cong lưu lượng, bảng thời tiết | ⏳ | Tổng khách giờ theo `Y(x)` × sao (R5). Đường cong trong ngày giữ hình, số chờ mô phỏng |
> | §2.4.3, §2.4.5, §2.5.3 Lịch NPC có tên, cửa sổ nghe lỏm, grace theo `relationTier`/Friend, ghi `memory` | ☠️ | Lịch NPC, đồn thổi, quan hệ, trí nhớ chết. Kiên nhẫn chỉ còn theo tính cách |
> | §2.6 Mở hàng / đốt vía | 🔁 | Bỏ điểm `tier === "Friend"`. Đang dựa vào niềm tin cô Ba (☠️) → giữ/bỏ, ai đảm nhận: chốt R0.5 |
> | §2.7 (3)–(4) Đóng cửa sớm: `streakDays`, `gossip.seed`, `reputation.alleyDelta` | 🔁 | Hệ quả thành review/sao (R4). Số khách hôm sau chỉ đi qua sao (T6) |
> | §2.7 (1) Chi phí cố định 100k/ngày, §2.8 EV lịch mưa | ⏳ | Giữ cơ chế, số mô phỏng lại (R2/R5). "Mutation rate" ở §2.8 ☠️ |
> | §3, §5 `day: 1..40`, mọi số tune | ⏳ | Bỏ trần 40 ngày (R5). Số chờ mô phỏng |
>
> **Còn dùng được:** perception theo hàng đợi (§2.4.5), kiên nhẫn riêng từng người + trợ năng (§2.5), luật "áp lực là vật thể" (§4), chống đóng cửa sớm — cho R1/R4/R5.

**Thuộc phase:** P3 — Kinh tế
**Phụ thuộc:** `CANON.md` §1 (T1–T5), §5 (perception), §8 (a, c, l), §13.3, §14, §15 · `P3-03` (tồn kho & dự báo cầu) · `P3-04` (thiết bị & chỗ đứng) · `P2-*` (rule DB, trí nhớ)
**Trạng thái:** **Cần đo** — toàn bộ ngân sách thời gian thật ở §2.2 là **giả thiết phải đo ở P0**, không phải con số đã chốt. Các cơ chế ở §2.3–§2.7 là **Chốt**.

---

## 1. Mục tiêu

Vá trực tiếp **HT4**. Minh nói đúng: *"vòng kinh tế của bạn có đúng 1 quyết định — pate ngon hay pate rẻ. Tôi ra quyết định đó 1 lần vào ngày 3 rồi lặp lại 37 ngày."* Doc này biến một ngày từ **1 quyết định** thành **18 quyết định, trong đó 6 cái đổi mỗi ngày**, mà không thêm một phím bấm nào ngoài những cái đã có.

Nó cũng cài đặt **ràng buộc kinh tế số 3 của CANON §13 — thông lượng giờ cao điểm — thứ CANON tự ghi là "quan trọng nhất và đang thiếu hoàn toàn"**. Thông lượng là cái cầu nối kinh tế vào perception: **đông khách = nhiều mắt nhìn hơn (T1) + áp lực làm nhanh = dễ ẩu**. Và theo Minh: *"Chill không phải là 'không có áp lực', chill là 'áp lực do mình tự tạo ra vì tham'."* → mọi nguồn áp lực trong doc này đều bắt đầu bằng **một nút người chơi tự bấm**, không bao giờ bằng một timer game tự chạy.

Trụ cột phục vụ: **T1** (sai sót trước mặt khách, mật độ mắt nhìn là biến kinh tế) · **T4** (một ngày là một màn có điểm kết, không stamina, không daily login) · **T5** (mọi áp lực phải đọc được trước khi hành động).

---

## 2. Cơ chế

### 2.1. Bốn pha — người chơi làm gì, quyết định gì, dừng ở đâu

| Pha | Giờ game | Người chơi làm gì | Quyết định | Phút thật (mục tiêu) | Điểm dừng an toàn |
|---|---|---|---|---|---|
| **Sáng — đi chợ** | 4h30–5h30 | Đi 4 sạp (lò bánh bà Tám, sạp pate, sạp thịt, sạp rau) + ghé cô Mai đổi tiền lẻ | ① bao nhiêu ổ bánh ② pate ngon/rẻ/lượng ③ mua sỉ hay lẻ theo giá hôm nay ④ có ngâm hũ đồ chua mới không ⑤ bao nhiêu tiền lẻ ⑥ đặt trước cho mai (cam kết cứng) | **1,5–2,0** | **Sau mỗi sạp.** Rời game ở đây = giữ nguyên giỏ, chưa trừ tiền |
| **Trưa — bán** | 5h30–11h00 (nán tới 12h00) | Mở hàng, làm bánh, xếp hàng đợi, ghi sổ nợ | ⑦ mở hàng mấy giờ ⑧ nhận đơn gom hay từ chối ⑨ nướng trước một mẻ hay nướng theo đơn ⑩ ghi sổ nợ hay bỏ qua ⑪ phục vụ ai trước ⑫ có nán sau 11h không | **4,0–5,5** | **Sau mỗi khách** (trùng với autosave, CANON §2). Không bao giờ dừng giữa lúc đang lắp bánh |
| **Chiều — dọn xe, đếm tiền, ghi sổ** | 11h00–12h30 | Dọn quầy, kiểm kho, đối chiếu sổ nợ, gõ ghi chú khách | ⑬ bán xổ hay giữ hàng ⑭ dọn kỹ hay dọn nhanh ⑮ ghi gì vào sổ tay | **1,0–1,5** | **Bất kỳ lúc nào.** Pha này không có đồng hồ |
| **Tối — một cảnh yên tĩnh** | 19h00–21h00 | Cô Ba ngồi đếm tiền, radio cải lương, mưa ngoài hẻm | ⑯ trả nghĩa vụ nào trước ⑰ mua thiết bị hay để dành ⑱ có gửi tiền thuốc cô Ba không | **0,5–1,0** | **Cuối pha = cuối ngày.** Điểm dừng chính thức |

**Luật cứng của pha Chiều và pha Tối: không có đồng hồ, không có khách, không có ai nhìn.** T1 nghỉ ở đây. Nếu người chơi muốn ngồi 10 phút đọc sổ tay thì được ngồi 10 phút. Toàn bộ áp lực của game nằm gọn trong pha Trưa và **một phần** pha Sáng (giá chợ thay đổi theo giờ — xem `P3-03` §2.5).

**Vì sao đúng 4 pha mà không phải 3 hay 5:** mỗi pha ứng với một **loại quyết định khác nhau về chân trời thời gian** — Sáng là dự báo (nhìn tới mai), Trưa là phản xạ (nhìn tới 30 giây tới), Chiều là đối chiếu (nhìn lại hôm nay), Tối là đầu tư (nhìn tới 10 ngày tới). Bỏ pha nào cũng mất một chân trời.

### 2.2. Ngân sách thời gian thật — **câu hỏi phải ĐO, không phải đoán**

> ⚠️ **Đây là số giả thiết.** CANON §17 ghi mục tiêu của P0 là *"đo được một ngày = bao nhiêu phút thật"*. Không doc nào được coi bảng dưới đây là đã chốt cho tới khi có 10 phiên chơi thật được bấm giờ.

**Giả thiết khởi điểm:**

| | Phút thật |
|---|---|
| Sáng | 1,7 |
| Trưa | 4,7 |
| Chiều | 1,2 |
| Tối | 0,7 |
| **Một ngày thường** | **8,3** |
| Ngày vắng (mưa dầm, CN) | 5,5 |
| Ngày sự kiện (arc nhân vật, hụi, nghĩa vụ lớn) | 12–14 |

**40 ngày:** 31 ngày thường × 8,3 + 5 ngày vắng × 5,5 + 4 ngày sự kiện × 13 = **5,0 giờ lõi**.
Cộng mở đầu + 3 cảnh arc dài + kết game ≈ **0,8 giờ** → **~5,8 giờ tổng cho một mùa.**

**Cách đo (bắt buộc làm ở P0, không phải P5):**

```ts
// core/clock.ts — bật mặc định trong build nội bộ
telemetry.phase("MORNING" | "SELLING" | "AFTERNOON" | "EVENING", realMs)
telemetry.day(dayIndex, totalRealMs, customersServed, loavesSold)
```
Xuất CSV. Đo trên **10 người lạ**, không phải trên team. Lấy **trung vị**, không lấy trung bình (một người lạc vào menu 4 phút sẽ kéo lệch trung bình).

**Ngưỡng phản ứng:**

| Tổng đo được | Phán quyết |
|---|---|
| **< 4,0 giờ** | Vòng lặp quá mỏng. **Thứ tự sửa: (1) tăng mật độ quyết định mỗi ngày** — thêm khách có tên vào giờ cao điểm, thêm đơn gom, hạ trần thông lượng để hàng đợi thật sự hình thành. **(2) Chỉ khi (1) thất bại** mới đề xuất giảm 40 → 32 ngày, và việc đó **phải đi qua mục "Đề xuất sửa CANON"** vì T4 khoá con số 40 |
| 4,0–5,0 giờ | Chấp nhận được. Kiểm tra riêng: **2 giờ đầu có đủ hook chưa** (cửa sổ refund của Steam) |
| 5,0–7,0 giờ | **Vùng mục tiêu** |
| 7,0–9,0 giờ | Cắt thao tác lặp ở pha Sáng (gộp 4 sạp thành 2 màn hình), **không** cắt pha Tối |
| **> 9,0 giờ** | Ngày quá dài cho một game "một ngày = một màn". Cắt pha Sáng xuống 1 phút bằng preset "mua như hôm qua" |

> ⚠️ Con số nghĩa vụ ở đoạn dưới (**2.700k ngày 10**) đang chờ hợp nhất với `P3-04`/`P3-05` — xem `P3-06` **§9.5**. Nếu phương án hợp nhất được chốt, áp lực ngày 10 giảm còn ~1.000k nhưng **mỗi ngày** phải rút 150k về nhà. Luận điểm thiết kế của mục này không đổi: cú tiền lớn đầu tiên nằm trong cửa sổ refund.

**Ràng buộc chéo:** 2 giờ chơi đầu ≈ **ngày 1–14**. CANON §12 cấm đồn thổi xuất hiện trong 2 giờ đầu → toàn bộ ngày 1–14 phải hấp dẫn **chỉ bằng** perception + trí nhớ + kinh tế. Doc này gánh phần kinh tế của 2 giờ đó: **ngày 10 là cú nghĩa vụ lớn đầu tiên (2.700k) và rơi đúng ngày mưa rào** — xem `P3-06` §2.3. Đó là hook kinh tế nằm trong cửa sổ refund, cố ý.

### 2.3. Đồng hồ co giãn — vì sao 315 phút game nằm gọn trong 4,7 phút thật

Không dùng một tỉ lệ cố định. Đồng hồ chạy theo **việc đang làm**, không theo giây thật.

```ts
// core/clock.ts
const SPEED = {
  IDLE:     300,  // không khách, hàng đợi rỗng → 1s thật = 5 phút game
  APPROACH:  60,  // khách đang đi tới quầy
  QUEUE:     12,  // có người chờ, chưa tới lượt
  SERVING:    6,  // khách đứng trước mặt, đang làm bánh → 1s thật = 6s game
  PAUSED:     0,  // CANON §15.2: pause đóng băng CẢ sự kiên nhẫn của khách
} as const

function tick(dtReal: number) {
  const s = SPEED[stall.state]
  clock.gameSec += dtReal * s
  if (stall.state !== "IDLE") perception.step(dtReal)   // certainty chỉ tích luỹ khi có mắt nhìn
  patience.step(dtReal)                                  // kiên nhẫn đo bằng GIÂY THẬT, không phải giây game
}
```

**Hai quyết định quan trọng nằm ở đây:**

1. **`certainty` và `patience` đều đo bằng giây THẬT, không phải giây game.** Nếu đo bằng giây game thì một giây thật ở pha IDLE bằng 5 phút game và mọi khách sẽ bốc hơi. CANON §5 hiệu chỉnh *"`DROPPED_FOOD` × khách nhìn thẳng → CONFIRMED sau ~1,4 giây"* — **1,4 giây thật**.
2. **`IDLE` không phải là "tua nhanh" người chơi bấm.** Nó tự chạy khi hàng đợi rỗng, và **tự dừng** ngay khi có khách bước vào khung hình. Người chơi không bao giờ phải bấm "skip". Tua nhanh có nút bấm = người chơi cảm thấy mình đang bỏ qua nội dung.

**Kiểm chứng ngân sách pha Trưa** (ngày thường, 34 lượt khách, 54 ổ):
- Thời gian game phải phủ: 5h45 → 11h00 = **315 phút game**
- SERVING: 34 lượt × ~62s game/lượt ≈ **35 phút game** → tốn `35×60/6` = **350 giây thật**
- QUEUE: ~22 phút game → `22×60/12` = 110 giây thật
- IDLE: 315 − 35 − 22 = 258 phút game → `258×60/300` = **52 giây thật**
- **Tổng ≈ 512 giây ≈ 8,5 phút thật.** Cao hơn mục tiêu 4,7.

→ **Chốt sửa:** `SERVING = 10` (1s thật = 10s game), `QUEUE = 20`, `IDLE = 420`. Tính lại: 210 + 66 + 37 = **313 giây ≈ 5,2 phút**. Nằm trong khoảng. **Ba con số này là ba núm tune quan trọng nhất của cả game** — xem §5.

### 2.4. Thông lượng giờ cao điểm — 1 lò, 2 tay

#### 2.4.1. Trần năng lực

```ts
type Throughput = {
  handSlots: 1          // BẤT BIẾN. Người chơi chỉ lắp được MỘT ổ tại một thời điểm.
                        // Không có upgrade nào tăng số này — tăng là giết T1 (CANON §10: từ chối thuê nhân viên)
  ovenSlots: 2          // → 4 với "lò than đôi" (P3-04). Nướng chạy SONG SONG với lắp
  assemblySec: 40       // giây game để lắp 1 ổ đầy đủ, người chơi thao tác thật
  bakeSec: 35           // giây game, chạy nền
  handoffSec: 12        // đưa bánh + thối tiền + (nếu có) ghi sổ nợ
}
```

Trần lý thuyết = `3600 / (40 + 12)` ≈ **69 ổ/giờ game** nếu nướng luôn kịp.
Với `ovenSlots = 2`, nướng trở thành nút cổ chai khi nhịp gọi > `2 × 3600/35` = 205 ổ/giờ → không bao giờ. **Nút cổ chai thật là hai bàn tay, đúng như CANON §13.3 mô tả.**
Trần thực tế sau ma sát (khách nói vòng vo, đổi ý, tìm tiền lẻ): **≈ 42 ổ/giờ game.**

Cầu giờ cao điểm (xem §2.4.3): **28 ổ trong khung 6h30–7h30** → **67% công suất**. Đủ để hàng đợi hình thành và tan tự nhiên, **không** đủ để game tự tạo ra thất bại. Áp lực phải do người chơi thêm vào.

#### 2.4.2. Ba cái nút người chơi tự bấm để tự làm khổ mình

| Nút | Được gì | Mất gì | Vì sao đây là "áp lực do mình tự tạo" |
|---|---|---|---|
| **Nhận đơn gom** (khách văn phòng hỏi 5–8 ổ, xuất hiện 1–2 lần/tuần, **luôn rơi vào 6h30–7h30**) | **140–280k** một lần, bằng 10–19% doanh thu ngày | Khoá tay **5–7 phút game** đúng giờ đông nhất → 3–5 khách kế phải chờ hoặc bỏ đi (`balk`) | Game **hỏi**, người chơi **trả lời**. Từ chối không mất gì ngoài 1 dòng tiếc rẻ. Nhận là tự chọn |
| **Mở sớm 5h15** thay vì 5h45 | +2–4 khách ca sớm ≈ **+85k**, và **cơ hội chọn khách mở hàng** (§2.6) | `prepCompleteness` < 1,0: đồ chua chưa xếp ra khay, dao chưa mài, rau chưa rửa xong → `assemblySec` **+35%** trong 30 phút game đầu, và `ORDER_DEFECT` cơ bản ×1,4 (với tay không quen, hay quên) | Không có stamina (T4 cấm). Cái giá là **thao tác chậm hơn**, đọc được ngay trên màn hình: khay đồ chua trống, người chơi phải với tay ra hũ |
| **Nán lại sau 11h00** | Vét nốt hàng ế, +1–3 ổ nguyên giá thay vì bán xổ −35% | Ông Hải sau 11h **không còn là ông Hải trước 10 giờ** (CANON §9: *"trước 10 giờ sáng rất tử tế"*). `nongTinh` của ông hiệu dụng 0,9. Và `STALL_CLEANLINESS` chỉ còn nửa thời gian để dọn → ảnh hưởng số khách **hôm sau** | Người chơi tham 55k, đổi lấy một cuộc trò chuyện khó và một cái quầy bẩn |

> **Luật tông:** **không bao giờ** có một thanh timer đếm ngược trên màn hình pha Trưa. Không bao giờ có "còn 30 giây nữa hết giờ". Giờ đóng cửa là một cái nút người chơi bấm. Cái gây căng thẳng là **hàng đợi đang dài ra** và **số ổ bánh còn lại đang tụt** — cả hai đều là vật thể trong khung hình, không phải UI.

#### 2.4.3. Đường cong lưu lượng — bảng gốc

**Ngày chuẩn:** T2–T6 · nắng gắt · danh tiếng trung bình · băng ngày 13–22 (54 ổ) · chỗ đứng đầu hẻm · `viaMood = 0`.

| Khung giờ game | Lượt khách | Ổ | Loại khách chủ đạo | NPC có tên | Hàng đợi đỉnh | Ghi chú thiết kế |
|---|---|---|---|---|---|---|
| 5h30–5h45 | 0 | 0 | — | — | 0 | Dọn hàng, nhóm lò. `IDLE`, cô Ba nói chuyện |
| **5h45–6h15** | 3 | 4 | Công nhân ca sớm, người tập thể dục | **Anh Dũng** 6h05 (1 ổ, luôn vội) | 1 | **Khách MỞ HÀNG ở đây** (§2.6) |
| 6h15–6h30 | 3 | 4 | Học sinh đi sớm | **Bé Su** 6h25 (1 ổ, quay TikTok) | 2 | Mật độ bắt đầu lên |
| **6h30–7h00** | 8 | 15 | Học sinh + công nhân | **Chú Tư** 6h45 (2 ổ: 1 ăn + 1 cho đồng nghiệp), **Cô Mai** 6h50 | **4** | **ĐỈNH 1.** 4 người chờ = 4 cặp mắt = `visibility` bảng CANON §5 kín cả 4 hàng |
| **7h00–7h30** | 7 | 13 | Văn phòng | **Chị Hạnh** 7h05, **Chị Lan** 7h20 | **4** | **ĐỈNH 2.** Chị Lan `soi 0.9 / nongTinh 0.1` đứng ở `QUEUE_2` là tình huống nguy hiểm nhất ngày |
| 7h30–8h00 | 4 | 7 | Văn phòng trễ, shipper | — | 3 | Đuôi đỉnh |
| 8h00–9h00 | 3 | 4 | Nội trợ, giao hàng | **Thầy Phúc** 8h50 (T3/T5/T7) | 1 | Thưa. Cửa sổ dọn quầy, ngâm đồ chua |
| 9h00–10h00 | 3 | 4 | Hưu trí | **Bà Bảy** 9h10 (ngồi lại lâu), **Bà Sáu** 9h30 (T2/T4/T6) | 1 | Cửa sổ nghe lỏm gossip (CANON §12 ràng buộc 4) |
| 10h00–11h00 | 3 | 3 | Sinh viên, nhậu sáng | **Anh Bảo** 10h15, **Ông Hải** 10h40 | 1 | Vét / bán xổ |
| **Tổng** | **34** | **54** | | 9–11 NPC có tên | | |

**Đọc ra điều gì:** 15 lượt / 28 ổ — **52% cả ngày — dồn vào một giờ game từ 6h30 đến 7h30.** Đó là ràng buộc CANON §13.3. Chín NPC có tên chiếm ~11 ổ (20%); 43 ổ còn lại là khách vãng lai đi theo đường cong. → **Phần học được của dự báo cầu nằm ở NPC có tên; phần thống kê nằm ở khách vãng lai.** Chi tiết ở `P3-03` §2.4.

#### 2.4.4. Bảng chéo đầy đủ: giờ × lưu lượng × loại khách × thời tiết

Hệ số nhân, áp lên **lượt khách vãng lai** của từng khung giờ. NPC có tên **không** bị thời tiết đuổi đi (họ vẫn đi làm), chỉ **đến trễ hơn 5–15 phút game** và `gazeFactor` của họ đổi.

| Khung giờ | Nắng gắt | Mát | Âm u | Mưa rào | Mưa dầm | Oi trước mưa |
|---|---|---|---|---|---|---|
| 5h45–6h15 | 1,00 | 1,05 | 0,95 | **0,45** | **0,35** | 0,95 |
| 6h15–6h30 | 1,00 | 1,05 | 0,95 | 0,50 | 0,40 | 0,95 |
| **6h30–7h00** | 1,00 | 1,08 | 0,96 | **0,65** | **0,50** | 0,92 |
| **7h00–7h30** | 1,00 | 1,08 | 0,96 | **0,70** | **0,52** | 0,92 |
| 7h30–8h00 | 1,00 | 1,05 | 0,95 | 0,60 | 0,45 | 0,90 |
| 8h00–9h00 | 1,00 | 1,00 | 0,95 | 0,55 | 0,40 | 0,88 |
| 9h00–10h00 | 0,98 | 1,00 | 0,95 | 0,55 | 0,40 | 0,85 |
| 10h00–11h00 | 0,95 | 1,00 | 0,92 | 0,50 | 0,38 | 0,80 |
| **Bình quân ngày** | **1,00** | **1,05** | **0,95** | **0,60** | **0,45** | **0,90** |

> Giờ cao điểm **co lại ít nhất** khi mưa (0,65–0,70 so với 0,45–0,55 ở giờ thưa): người đi làm vẫn phải đi làm. Đây là chi tiết thật và nó làm ngày mưa **không** thành ngày nghỉ — nó thành ngày mà **toàn bộ doanh thu dồn vào một giờ đông nghẹt dưới mái dù**.

**Bảng thời tiết đầy đủ:**

| Thời tiết | Số ngày/40 | Hệ số khách | `gazeFactor` toàn cục | Hiệu ứng khác |
|---|---|---|---|---|
| **Nắng gắt** | 20 | ×1,00 | ×1,00 | Rau héo nhanh hơn: hạn rau −20% trong ngày. Trà đá bán chạy (`CARED_FOR_THEM` dễ hơn) |
| **Nắng nhẹ / mát** | 8 | ×1,05 | ×1,00 | Không gì đặc biệt. Ngày "sạch" để đo cân bằng |
| **Âm u** | 5 | ×0,95 | ×0,95 | Ánh sáng dịu → art nhìn khác, không có hiệu ứng cơ học đáng kể |
| **Mưa rào sáng** (15–30 phút) | 4 | ×0,60 | ×0,78 | Mở ô/dù cho khách = `CARED_FOR_THEM` (salience 50). Gói kỹ cho khỏi ướt = cùng sự kiện. Bánh dễ ỉu: `BURNT_OR_COLD` cơ bản ×1,3 |
| **Mưa dầm cả buổi** | 2 | ×0,45 | ×0,62 | Như trên, mạnh hơn. Quầy ướt → `STALL_CLEANLINESS` tụt nhanh gấp đôi |
| **Oi trước mưa** | 1 | ×0,90 | ×1,00 | **`nongTinh` hiệu dụng của MỌI NPC +0,10 trong ngày.** Cả hẻm cáu. Ngày duy nhất trong mùa như vậy — và nó đến **không báo trước**, chỉ có một cảnh sáng: trời vàng đục, không có gió |

**Lịch thời tiết 40 ngày** (cố định theo `SEASON_SEED`, CANON §8 mục e — chống save-scum; trùng khớp với `P3-03` §2.5 và `P3-06` §2.3):

| Ngày | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| | Mát | Nắng | Nắng | Âm u | Nắng | Nắng | Mát | Nắng | **Oi** | **Mưa rào** |

| Ngày | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 |
|---|---|---|---|---|---|---|---|---|---|---|
| | Nắng | Nắng | Mát | Âm u | Nắng | Nắng | **Mưa dầm** | **Mưa rào** | Âm u | Mát |

| Ngày | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 |
|---|---|---|---|---|---|---|---|---|---|---|
| | Nắng | Nắng | Mát | Nắng | **Mưa rào** | Nắng | Nắng | Âm u | Mát | Nắng |

| Ngày | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 |
|---|---|---|---|---|---|---|---|---|---|---|
| | Nắng | **Mưa rào** | Nắng | Mát | Âm u | Nắng | Nắng | **Mưa dầm** | Mát | Nắng |

> **Cố ý:** ngày 10 (**hụi 500k**) là **mưa rào**. Ngày 18 (**tiền học 1.200k**) là **mưa rào**. Ngày 38 (**tiền học 1.200k**) là **mưa dầm**. Ba cú tiền lớn nhất rơi vào ba ngày doanh thu thấp nhất.
>
> ⚠️ **Đã hợp nhất theo CANON §13.1.** Bản đầu của doc này ghi *"thuê chỗ 2.200k ngày 10/25/40"*; mô hình đó **bị thay** bằng **thuê chỗ theo NGÀY** (`L1` = 42k/ngày) cộng **rút về nhà 150k/ngày**, vì tiền thuê theo ngày nối được vào cơ chế dời chỗ của `P3-05`. Áp lực đổi hình dạng từ *ba cú lớn* sang *một dòng chảy đều cộng vài cú vừa*. Đây là bài học **"phải để dành trước"**, và vì seed cố định, nó học được và học một lần là nhớ suốt các lần chơi lại. Xem `P3-06` §2.3.

#### 2.4.5. Nối vào perception: đông khách = nhiều mắt

Đây là chỗ kinh tế và T1 giao nhau, và là lý do ràng buộc §13.3 quan trọng nhất.

```ts
// sim/perception.ts — duyệt từ phía SỰ KIỆN (CANON §5, bài học Mark of the Ninja)
function onStimulus(stim: Stimulus) {
  for (const npc of queue.occupants()) {         // 0..4 người, KHÔNG phải cả hẻm
    const zone = queue.zoneOf(npc)               // FRONT_CENTER | FRONT_SIDE | QUEUE_2 | QUEUE_3 | SEATED_FAR
    const rate = stim.salience
              * VISIBILITY[stim.slot][zone]
              * occluderMul(npc)
              * gazeFactor(npc) * weather.gazeMul
              * traitMul(npc.soi)
              / 100
    npc.obs[stim.id].certainty += rate * dtReal
  }
}
```

**Số người trong `queue.occupants()` CHÍNH LÀ số hạng của tổng này.** Không có nhân tố bí mật nào khác.

| Số người đang chờ | Tổng `rate` tương đối cho một `DROPPED_FOOD` (salience 75, slot `HANDS`) | Ý nghĩa |
|---|---|---|
| 1 (`FRONT_CENTER`) | 0,95 → `CONFIRMED` sau ~1,4s | Mức chuẩn CANON §5 |
| 2 (+`FRONT_SIDE`) | 0,95 + 0,70 | Hai người, hai câu thoại khác nhau, `take(1)` chọn người nặng nhất |
| 3 (+`QUEUE_2`) | + 0,45 | |
| **4 (+`QUEUE_3`)** | + 0,20 → **tổng 2,30** | **Xác suất ít nhất một người `CONFIRMED` tăng ~2,4×** so với một mình |

**Đồng thời**, cùng cái hàng đợi đó ép người chơi làm nhanh:

```ts
// Áp lực KHÔNG phải là một debuff hệ thống áp lên người chơi.
// Nó là một con số người chơi NHÌN THẤY và tự phản ứng:
hud.showQueueLength()          // 4 cái bóng người, không phải chữ "4"
hud.showLoavesRemaining()      // đếm ổ bánh thật trong rổ, không phải thanh
// Không có: hud.showStressBar(), hud.showComboMultiplier(), hud.showTimer()
```

**Đó là toàn bộ cơ chế.** Game không bao giờ tăng tốc độ yêu cầu; game chỉ để 4 người đứng đó. Việc vội là quyết định của người chơi. **Đúng định nghĩa của Minh về chill.**

**Công cụ hạ attention khi đông** (CANON §5.4) trở nên đắt đỏ đúng lúc cần nhất — và đó là điểm hay:

| Công cụ | Giá lúc vắng | Giá lúc 4 người chờ |
|---|---|---|
| Ly trà đá | 8s game, gần như miễn phí | 8s game = 1/5 một ổ bánh = hàng đợi dài thêm |
| Hỏi một câu | Miễn phí, còn được `REMEMBERED_STORY` | Tốn 10–15s game, và người đứng sau nghe thấy bạn đang tán gẫu trong khi họ chờ |
| Cô Ba đứng tiếp khách | Chuyển gaze của **một** khách | Vẫn chỉ **một** khách. Không scale theo hàng đợi. **Cố ý** |

### 2.5. Hàng đợi — kiên nhẫn RIÊNG từng người

#### 2.5.1. Vì sao không dùng thanh chung như PlateUp

PlateUp dùng một đồng hồ chung cho cả bàn: nó tạo **áp lực**, và áp lực là thứ đúng cho game đó. Game này cần **cảm xúc**: *"chị Lan chờ 50 giây rồi bỏ đi, còn bà Bảy đứng đó 4 phút vẫn cười."* Một thanh chung xoá sạch sự khác biệt ấy — và sự khác biệt ấy **chính là** hệ tính cách (CANON §4). Thanh chung cũng vi phạm **T3** theo đường vòng: nó là một chỉ số tổng hợp hiển thị trên màn hình.

#### 2.5.2. Cơ chế

```ts
type QueueSlot = {
  npcId: string
  zone: "FRONT_CENTER" | "FRONT_SIDE" | "QUEUE_2" | "QUEUE_3"
  arrivedAtRealMs: number
  patienceSec: number        // TÍNH RIÊNG cho từng người, đo bằng giây THẬT
  waitedSec: number
}

// Kiên nhẫn suy ra từ 4 chiều tính cách + vai, KHÔNG phải một tham số tự do
function patienceOf(npc: NPC): number {
  const base = 55                                   // giây thật
  let p = base
  p *= 1 - 0.45 * npc.nongTinh                      // dễ nổi → chờ kém
  p *= 1 + 0.30 * npc.deTha                         // dễ tha → chờ giỏi
  p *= 1 + 0.25 * relationTierBonus(npc)            // Friend +0.25, Acquaintance 0, Rival −0.15
  p *= npc.role.hurryMul ?? 1.0                     // anh Dũng (Grab): 0.45 — nghề ép chứ không phải tính
  p *= settings.unlimitedTime ? Infinity : 1
  return p
}
```

| NPC | `nongTinh` | `deTha` | `hurryMul` | `patienceSec` (Acquaintance) |
|---|---|---|---|---|
| **Anh Dũng** | 0,5 | 0,7 | **0,45** | **22s** — dạy `MADE_THEM_WAIT`, đúng chức năng CANON §9 |
| **Chị Lan** | 0,1 | 0,2 | 1,0 | **55s** — chờ được, nhưng `soi 0.9` nên trong 55s đó cô ấy **nhìn thấy mọi thứ** |
| **Bà Bảy** | 0,6 | 0,8 | 1,0 | **47s** — và bà có `hurryMul` ngược ở `AFTER_SERVED`: bà **ở lại** |
| **Chú Tư** | 0,3 | 0,9 | 1,0 | **66s** |
| **Ông Hải** (sau 10h) | 0,9 | 0,5 | 1,0 | **22s** |
| **Ông Hải** (trước 10h) | 0,3 | 0,5 | 1,0 | **51s** — cùng một người |
| **Anh Bảo** | 0,2 | 0,8 | 1,0 | **62s** — cắm mặt điện thoại, không để ý mình đang chờ |
| Khách vãng lai | 0,4 | 0,6 | 1,0 | **48s** |

#### 2.5.3. `MADE_THEM_WAIT` leo thang

CANON §3.1: salience **100**, loại Dịch vụ, *"không cần gaze. Leo thang theo giây."*

```ts
function waitSalience(slot: QueueSlot): number {
  const r = slot.waitedSec / slot.patienceSec
  if (r < 0.40) return 0                         // vùng im lặng — KHÔNG có phản hồi nào
  if (r < 0.70) return 30                        // đổi tư thế, nhìn đồng hồ. 35% không nói gì (CANON §11)
  if (r < 1.00) return 65                        // bark tier-1 cụ thể: "ê còn lâu hông em"
  return 100                                     // đủ certainty tức thì → CONFIRMED + ghi memory
}

// Bỏ đi: KHÔNG tự động ở r >= 1.0. Có một cửa sổ ân hạn.
function maybeBalk(slot: QueueSlot) {
  const r = slot.waitedSec / slot.patienceSec
  if (r < 1.0) return
  const grace = 1.0 + 0.6 * npc.deTha + 0.5 * relationTierBonus(npc)   // Friend deTha cao → tới 1.8
  if (r > grace) queue.leave(slot, reason: "WAITED_TOO_LONG")
}
```

**Ba luật bắt buộc:**

1. **Vùng im lặng `r < 0.40` là bắt buộc.** Không có phản hồi nào trong 40% đầu của kiên nhẫn. Nếu khách bắt đầu sốt ruột ngay giây thứ 2, người chơi sẽ học được rằng **mọi** khách đều đang sốt ruột, và cả hệ thống thành nhiễu nền.
2. **`MADE_THEM_WAIT` bỏ qua `gazeFactor` (đúng CANON), nhưng KHÔNG bỏ qua `traitMul`.** Người `soi` cao vẫn để bụng chuyện chờ nặng hơn.
3. **Phục vụ sai thứ tự nặng hơn chờ lâu.** Nếu người chơi làm cho người đứng sau trước, người bị vượt nhận `MADE_THEM_WAIT` ở salience **80 ngay lập tức**, không leo thang. Cắt hàng là một hành động, không phải một sự chậm trễ. Đây là chỗ duy nhất trong game có phạt tức thời.

**Sức chứa hàng đợi và `balk` tại chỗ:**

```ts
const QUEUE_VISIBLE_MAX = 4       // 4 chỗ hiển thị. Đầu hẻm chỉ đứng được 4 người.
                                  // Góc khuất (sau khi mất chỗ, P3-06): 3

function onWalkInArrive(npc: NPC) {
  if (queue.length >= QUEUE_VISIBLE_MAX) {
    if (npc.isRegular) queue.pushOverflow(npc)     // khách ruột ĐỨNG ĐỢI NGOÀI KHUNG, kiên nhẫn chạy chậm hơn 0.6×
    else { npc.walkPast(); stats.balked++ }        // khách lạ thấy đông → đi luôn. KHÔNG có sự kiện, không ai giận
  }
}
```

`balked` là **thiệt hại vô hình** — người chơi chỉ thấy một người đi ngang rồi đi tiếp. Cuối ngày, sổ tay ghi *"hôm nay có mấy người ghé rồi đi"* — **không** ghi con số. Người chơi phải tự thấy. Đó là T3 áp lên kinh tế.

#### 2.5.4. Hai chế độ trợ năng (CANON §15 — bắt buộc, không phải "nice to have")

| Chế độ | Làm gì | Cái gì **không** đổi |
|---|---|---|
| **"Một khách một lượt"** | `QUEUE_VISIBLE_MAX = 1`. Khách kế **không sinh ra** cho tới khi khách hiện tại rời quầy. Đường cong §2.4.3 được **nén lại** — tổng số khách/ngày giữ nguyên, chỉ là không bao giờ chồng lên nhau | Doanh thu, giá cả, hạn dùng, nghĩa vụ **y hệt**. Chế độ trợ năng **không** được làm game dễ hơn về kinh tế — làm vậy là biến trợ năng thành "easy mode" và người dùng sẽ từ chối bật |
| **"Không giới hạn thời gian"** | `patienceSec = Infinity`. `MADE_THEM_WAIT` **tắt hoàn toàn** | **Khách vẫn bỏ đi vì bạn làm SAI** (CANON §15.2 nguyên văn). `ORDER_DEFECT`, `DROPPED_FOOD`, `WRONG_NAME`, `DIRTY_HANDS` hoạt động bình thường. Hết hàng vẫn là hết hàng |

**Hệ quả đối với perception ở chế độ "một khách một lượt":** mất đi tầng `QUEUE_2`/`QUEUE_3`, tức là người chơi **luôn** ở tình huống `FRONT_CENTER` (visibility 0,95) — **khó hơn**, không dễ hơn. Cân bằng lại bằng: ở chế độ này, `traitMul` toàn cục ×0,90. Ghi vào `P5` (cân bằng).

### 2.6. Mở hàng và đốt vía

#### 2.6.1. Vì sao mục này nguy hiểm và phải thiết kế cụ thể để không chết

CANON §14 và idea.md §19.1 đều dán ⚠️ lên đây: *"Giữ tông trìu mến / tự trào. Là niềm tin của cô Ba, KHÔNG phải hệ ma thuật có tác dụng cơ học rõ ràng."* VOZ từng tố *Bad Parenting* "tuyên truyền mê tín dị đoan".

**Cái làm nó thành tuyên truyền mê tín là một con số.** Nếu game hiện `+8% may mắn` thì game đang **khẳng định** rằng đốt vía có tác dụng. Nếu game cho tác dụng bằng 0 thì game đang **chế nhạo** cô Ba. Lối ra nằm ở giữa, và nó là một lối ra **định lượng được**:

> **Tác dụng cơ học của vía phải NHỎ HƠN nhiễu thống kê tự nhiên của một ngày.**

Nghĩa là: dù người chơi có ghi chép 40 ngày, họ **không thể chứng minh** vía có tác dụng — cũng **không thể chứng minh** nó không có. Chính xác như đời thật. Game không đứng về phía nào.

#### 2.6.2. Toán của sự mơ hồ

```ts
type ViaMood = -1 | 0 | +1        // nặng vía | thường | nhẹ vía

// TOÀN BỘ tác dụng cơ học. Không có gì khác. Không được thêm gì vào đây.
econ.walkInMul      *= 1 + 0.03 * viaMood    // ±3% khách vãng lai
econ.roundUpChance  += 0.02 * viaMood        // ±2% khả năng khách bảo "khỏi thối"
```

**Nhiễu nền của một ngày:**

| Nguồn nhiễu | Biên độ |
|---|---|
| Poisson trên ~43 lượt khách vãng lai | σ ≈ √43/43 ≈ **±15%** |
| Ngẫu nhiên cỡ đơn (1 ổ / 2 ổ / 3 ổ) | **±9%** |
| Thời tiết cùng loại, ngày khác ngày | **±5%** |
| **Nhiễu tổng (cộng phương sai)** | **≈ ±18%** |
| **Tín hiệu từ vía** | **±3%** |

Tỉ lệ tín hiệu/nhiễu = **0,17**. Để phát hiện một hiệu ứng cỡ đó ở mức tin cậy 95% cần **n ≈ 570 ngày**. Mùa có **40**. → **Không thể chứng minh trong game.** Cố ý, và tính được.

**Bốn luật cứng đi kèm:**

1. **Không có UI nào cho vía.** Không icon buff, không tooltip, không dòng nào trong sổ tay, không mục nào trong màn hình cuối ngày. Nếu một người datamine ra con số 0,03, họ sẽ thấy nó nhỏ tới mức buồn cười — **và đó là câu trả lời của game**.
2. **Đốt vía chỉ đưa `−1 → 0`. Không bao giờ lên `+1`.** Nó gỡ một cái xui, không mua một cái hên. Điều này khớp với niềm tin thật: đốt vía là **giải**, không phải **cầu**.
3. **Bỏ qua đốt vía không bao giờ bị phạt.** Không có NPC nào trách. Cô Ba chỉ nhắc một lần rồi thôi.
4. **Game phải có một người không tin, và người đó phải đáng kính.** → **Thầy Phúc** (giáo viên hưu trí, `soi 0.8 / nongTinh 0.2`). Ông không chế nhạo, ông chỉ nói kiểu khác. Có ông, game không còn đứng ở vị trí người khẳng định.

#### 2.6.3. `viaMood` được quyết định thế nào

Nó **không roll xúc xắc**. Nó đọc ra từ giao dịch đầu tiên — đúng tinh thần T5 (đọc được, không phải xổ số).

```ts
function resolveOpeningLuck(first: Transaction): ViaMood {
  let score = 0
  if (first.walkedAwayWithoutBuying)          score -= 2   // xem rồi bỏ đi
  if (first.haggled)                          score -= 1   // trả giá
  if (first.complained)                       score -= 1   // chê
  if (first.playerHadNoChange)                score -= 2   // CANON §14: khách đưa tiền lớn mình không có tiền thối
  if (first.paidExact)                        score += 1
  if (first.boughtMultiple)                   score += 1
  if (first.smiled || first.roundedUp)        score += 1
  if (first.npc && first.npc.tier === "Friend") score += 1

  return score <= -2 ? -1 : score >= 2 ? +1 : 0
}
```

**Mục `playerHadNoChange` là cái móc nối vía vào kinh tế thật.** Nó biến "đầu ngày không có tiền thối là điềm xấu" — một câu kiêng kỵ — thành **một lý do cơ học để sáng nào cũng ghé cô Mai đổi tiền lẻ**. Cơ chế Việt Nam không nằm trên bề mặt, nó nằm trong bài toán. Chi tiết tiền lẻ ở `P3-03` §2.8.

**Vòng lặp hay nhất ở đây: người chơi có thể CHỌN khách mở hàng.** Mở hàng lúc 5h45 nghĩa là ai đi ngang trước thì người đó mở. Mở lúc 5h15 (§2.4.2) cho người chơi nhìn thấy 3–4 người từ xa và quyết định **kéo tấm bạt lên đúng lúc ai đi tới**. Đó là một quyết định 100% Việt Nam, tốn 0 dòng code mới, và người chơi sẽ tự thấy mình đang làm chuyện buồn cười.

#### 2.6.4. Minigame đốt vía — 5 giây, 5 nhịp

Kích hoạt: **chỉ khi** `viaMood === -1`, và **chỉ khi** cô Ba còn ở quầy (trước 6h30). Một lần mỗi ngày. Có nút bỏ qua ngay từ đầu.

Giới tính nhân vật người chơi chọn ở đầu game quyết định số đếm và tay ném.

| Nhịp | Thao tác | Chi tiết chuẩn (idea.md §19.1 — **không bịa**) | Input |
|---|---|---|---|
| 1 | **Đốt giấy** | Vò tờ báo cũ, châm lửa trước xe | Chạm giữ 0,6s |
| 2 | **Bước qua lửa** | **7 lần (nam) / 9 lần (nữ)** | Chạm theo nhịp. **Đếm sai KHÔNG bị phạt** — cô Ba có thoại riêng cho việc đếm sai |
| 3 | **Rắc muối** | Nắm muối hạt **tay phải (nữ) / tay trái (nam)**, ném **qua vai trái** | Vuốt chéo lên vai trái |
| 4 | **Chanh** | **3 quả cắt làm tư**, đặt quanh xe | Chạm 4 vị trí |
| 5 | **Bồ kết + nhang** | **3–5 quả bồ kết khô** vào lò than nhỏ, xông góc khuất · nhang thắp **số lẻ** (1/3/5) | Chạm chọn số |

**Bài khấn** — cô Ba đọc, lồng tiếng người thật, giọng miền Nam, nói **nhỏ và nhanh**, không trang trọng, không có nhạc nền thiêng liêng:

> *"Đốt vía, đốt van, đốt gan, đốt ruột — vía lành thì ở, vía dữ thì đi."*

**Chi phí:** 40 giây game (không phải giây thật quý giá) + **2k** nguyên liệu (muối, chanh, bồ kết, nhang) trừ thẳng vào két. Hai nghìn đồng. Đó là toàn bộ cái giá — **cố ý rẻ tới mức nó không phải là một quyết định kinh tế**, vì nếu nó là quyết định kinh tế thì người chơi sẽ tính EV của nó, và tính EV của đốt vía là đúng cái game đang tránh.

**Bộ thoại bắt buộc có (tông tự trào — đây là phần chống "tuyên truyền mê tín"):**

| Tình huống | Người nói | Dòng |
|---|---|---|
| Sau khi đốt xong | **Cô Ba** | *"Rồi đó. Cô cũng hổng biết có ăn thua gì không. Nhưng đốt rồi thì thấy nhẹ người, bán mới vô."* |
| Đốt rồi mà ngày vẫn ế | **Cô Ba** | *"Vía nó cứng quá con ơi. Thôi bán tiếp."* — không trách, không đổ lỗi cho người chơi đếm sai |
| Đếm nhầm số bước | **Cô Ba** | *"Bảy chứ mấy con, con đếm tám rồi kìa."* rồi cười. Không làm lại, không phạt |
| Người chơi bỏ qua lần đầu | **Cô Ba** | *"Ừ, con hổng tin thì thôi. Cô đốt giùm cho."* — **và cô đốt thật**, ở nền, không có minigame |
| Người chơi bỏ qua từ lần 2 trở đi | — | **Im lặng.** Cô Ba không nhắc nữa |
| Thầy Phúc thấy | **Thầy Phúc** | *"Hồi xưa má tôi cũng đốt. Tôi thì tôi nghĩ bữa nào bánh ngon thì bữa đó đắt hàng. Mà thôi, đốt cho cổ vui."* |
| Bé Su thấy | **Bé Su** | *"Cô ơi cho con quay cái này! Cái này lên xu hướng nè!"* — và nếu người chơi cho quay, nó đi vào hệ đồn thổi như một **tin tốt** (CANON §12 ràng buộc 5) |
| Chú Kiệt thấy | **Chú Kiệt** | *"Đốt hoài mà có hết ế đâu."* — ông nói về **chính ông**, không nói về người chơi |

**Tuyệt đối không có:** hiệu ứng ánh sáng vàng, tiếng chuông, chữ "Lucky!", số +%, achievement tên kiểu "Master of Fortune", hay bất kỳ NPC nào nói *"nhờ đốt vía mà hôm nay đắt hàng"*. Tin đồn **không được phép** mang nội dung "đốt vía có tác dụng" — đó là ràng buộc nội dung ghi thẳng vào mutation graph.

**Công tắc:** Cài đặt → Nội dung → **"Bỏ qua nghi thức đốt vía"**. Tắt thì minigame không bao giờ hiện, `viaMood` tự về 0 lúc 6h30, và bộ thoại của cô Ba vẫn giữ (vì đó là nhân vật, không phải cơ chế).

### 2.7. Chống ăn gian (l) — đóng cửa sớm

Lỗ hổng: *"đủ tiền hôm nay thì dẹp hàng, né rủi ro."* Nếu đóng sớm miễn phí thì chiến thuật tối ưu là bán 20 ổ đầu giờ rồi về — và toàn bộ giờ cao điểm, tức toàn bộ T1, không bao giờ xảy ra.

**Bốn chốt chặn, cộng dồn:**

#### (1) Chi phí cố định trừ vào cuối ngày bất kể bán được bao nhiêu

| Khoản | k/ngày | Ghi chú |
|---|---|---|
| Than + gas lò | 25 | Đã nhóm lò từ 5h30. Không hoàn |
| Đá cây (trà đá, giữ lạnh) | 15 | Mua sáng, tan trong ngày |
| Túi giấy + bịch nylon + dây thun | 20 | |
| Xăng xe đi chợ | 15 | |
| Gửi xe + tiền rác + điện nhờ nhà cô Mai | 15 | |
| Khấu hao xe + dù + bàn | 10 | |
| **Tổng** | **100** | Tăng lên **115** từ ngày 33 (giá gas lên — xem `P3-03` §2.5) |

Đóng cửa lúc 8h00 với 24 ổ bán ra: doanh thu `24 × 28k` ≈ **672k**. **Nhưng nguyên liệu mua cho cả 54 ổ đã trả rồi**: `54 × 15,4k` ≈ **832k**, và **ổ bánh + rau + xíu mại + heo quay hết hạn trong ngày** (`P3-03` §2.1.1). Lãi thực: `672 − 832 − 100` = **−260k**. Bán xổ lúc 10h30 gỡ lại nhiều nhất ~85k, nhưng đóng cửa lúc 8h thì không có cả bán xổ. **Đóng sớm là lỗ, không phải "né rủi ro".**

#### (2) Hàng đã mua, hạn dùng không chờ

Chi tiết ở `P3-03` §2.1. Điểm cần nhớ ở đây: **rau, xíu mại, heo quay, ổ bánh đều hạn 1 ngày.** Mọi ổ bánh chưa bán là 3,5k bốc hơi. Người chơi đóng sớm là người chơi tự đổ bỏ hàng của mình.

#### (3) Khách đến mà hết hàng / đóng cửa → **dùng lại `MADE_THEM_WAIT`, không tạo sự kiện thứ 12**

> CANON §3 khoá đúng **11 sự kiện**. Doc này **không** thêm sự kiện mới. Việc bị hụt hàng là một **biến thể lý do** của `MADE_THEM_WAIT` (salience 100, loại Dịch vụ, không cần gaze — khớp hoàn hảo: khách không cần nhìn thấy gì, họ chỉ cần đứng trước một cái xe không có bánh).

```ts
type WaitReason = "SLOW" | "SKIPPED_IN_LINE" | "OUT_OF_STOCK" | "CLOSED_EARLY"

function onArriveToNothing(npc: NPC, reason: "OUT_OF_STOCK" | "CLOSED_EARLY") {
  const base = reason === "OUT_OF_STOCK" ? 55 : 70   // đóng cửa nặng hơn hết hàng: hết hàng là bán đắt, đóng cửa là bỏ rơi
  const intensity = base * (1 + 0.5 * npc.streakDays / 10)  // càng đến đều càng đau
  memory.write(npc, { kind: "MADE_THEM_WAIT", reason, intensity })
  npc.streakDays = 0                                  // ĐỨT CHUỖI — xem P3-06 §2.5
  if (rng.chance(0.25 + 0.4 * npc.thanThien)) gossip.seed(npc, "hôm đó tới mà dẹp hàng rồi")
}
```

**`streakDays` là thứ thật sự bị mất.** Chú Tư đến đều 18 ngày liên tiếp; ngày 19 người chơi đóng cửa lúc 6h30. `intensity` = 70 × (1 + 0,9) = **133**. Đó là một trong những đòn nặng nhất game, và nó không đến từ một lỗi tay nghề — nó đến từ một quyết định kinh tế. Đúng chỗ.

#### (4) Danh tiếng hẻm — số khách hôm sau

```ts
// Chạy lúc kết ngày
reputation.alleyDelta -= 0.015 * countClosedEarlyRegulars    // mỗi khách ruột bị hụt
reputation.alleyDelta -= 0.010 * (cleanliness < 0.5 ? 1 : 0) // CANON §3.3
econ.tomorrowWalkInMul = clamp(1 + reputation.alleyDelta, 0.75, 1.30)
```

Ba ngày đóng sớm liên tiếp với 2 khách ruột mỗi ngày → `−0,09` → khách vãng lai hôm sau **−9%**. Tích luỹ, hồi chậm (`+0,004/ngày` khi bán đủ giờ). **Không hiện số này ở đâu** (T3). Người chơi chỉ thấy hẻm vắng hơn.

**Nhưng — đóng cửa sớm phải VẪN LÀ một lựa chọn hợp lệ trong vài tình huống.** Nếu nó luôn sai thì nó không phải quyết định:

| Tình huống | Đóng sớm là đúng |
|---|---|
| Mưa dầm, đã bán 80% hàng lúc 9h | Doanh thu biên của 2 giờ còn lại < chi phí cơ hội của việc dọn quầy kỹ (ảnh hưởng khách hôm sau) |
| Ngày có nghĩa vụ + cần đi gặp cô Mai trước khi cửa hàng đóng | Trễ hụi mất nhiều hơn 3 ổ bánh |
| Hết sạch bánh lúc 10h20, còn 40 phút | Đứng đó với cái rổ trống **tệ hơn** dọn về: khách đến thấy rổ trống vẫn ăn `OUT_OF_STOCK` |

### 2.8. Chống ăn gian (c) — lịch mưa

Lỗ hổng: *"mưa giảm attention → nhập pate rẻ đúng ngày mưa."* CANON bịt bằng *"mưa cũng giảm ~40% lượng khách → tự cân bằng."* Doc này phải **chứng minh** con số đó đủ, chứ không chỉ khẳng định.

#### Chứng minh bằng EV

Giả định kẻ ăn gian: đổi pate bà Tám (95k/phần, 30 suất → 3,17k/ổ) sang pate thường (60k/phần → 2,00k/ổ). **Tiết kiệm 1,17k mỗi ổ.**

| | Ngày nắng | Ngày mưa rào | Ngày mưa dầm |
|---|---|---|---|
| Ổ bán ra | 54 | 32 (×0,60) | 24 (×0,45) |
| **Tiết kiệm gộp** | **63k** | **37k** | **28k** |
| Doanh thu (28k/ổ) | 1.512k | 896k | 672k |
| Chi phí cố định | 100k | 100k | 100k |
| `gazeFactor` toàn cục | 1,00 | 0,78 | 0,62 |
| Số khách ở `FRONT_CENTER` (nhìn tay) | 54 | 32 | 24 |
| **Số lượt có cơ hội `ORDER_DEFECT` lúc ĂN** | **54** | **32** | **24** |

**Chốt chặn thật không phải là mưa che mắt — mà là pate rẻ bị phát hiện lúc ĂN, không phải lúc nhìn.**

CANON §3.1: `ORDER_DEFECT` — **20 tại quầy → 100 lúc ăn**. Mưa hạ `gazeFactor`, mà `gazeFactor` chỉ tác động ở **tầng quầy** (salience 20). Tầng **lúc ăn** (salience 100) **không đi qua `gazeFactor` chút nào** — người ta cắn miếng bánh ở góc đường, mưa hay nắng thì vị pate vẫn thế.

```ts
// craft/diff.ts
function tasteDefect(dish: Dish, npc: NPC) {
  const gap = recipe.expectedQuality - dish.quality
  if (gap < 0.12) return null                          // dưới ngưỡng, không ai nhận ra
  return {
    kind: "ORDER_DEFECT", subtype: "INGREDIENT_DOWNGRADE",
    salienceAtCounter: 20,                              // ← chịu gazeFactor, mưa giúp ở đây
    salienceAtEating: 100 * traitMul(npc.soi),          // ← KHÔNG chịu gazeFactor. Mưa không giúp gì
    delaySec: 90 + rng(0, 120)                          // phản ứng trễ, ở góc đường (T1)
  }
}
```

→ Ngày mưa, kẻ ăn gian tiết kiệm **37k** và phơi mình trước **32 lượt kiểm tra vị giác không bị mưa che**. Ngày nắng, tiết kiệm **63k** trước 54 lượt. **Tỉ lệ rủi ro trên mỗi đồng tiết kiệm là NHƯ NHAU.** Mưa không phải là cửa sổ ăn gian; nó chỉ là một ngày ít tiền hơn. Và 37k là **hơn một phần ba** chi phí cố định của chính ngày hôm đó — tiết kiệm được nhưng vẫn lỗ nặng hơn ngày nắng.

Và còn một lớp nữa: `ORDER_DEFECT` có mutation rate **0,35 → "ăn bớt nguyên liệu"** (CANON §12) — **cao nhất bảng, vì nó đổi Ý ĐỊNH**. Ngày mưa ít khách hơn nhưng khách ngày mưa **đứng nán lại dưới dù lâu hơn** → cửa sổ nghe lỏm và tán gẫu **dài hơn** → hệ số lan tin ngày mưa ×1,25. Ghi vào `P2` (gossip).

#### Bảng tổng: mưa cho gì, lấy gì

| | Được | Mất |
|---|---|---|
| Ngày mưa rào | `gazeFactor` ×0,78 · nhiều cơ hội `CARED_FOR_THEM` (che dù, gói kỹ) · giá rau ở chợ **không** rẻ hơn | Khách ×0,60 · chi phí cố định không đổi · `BURNT_OR_COLD` ×1,3 (bánh ỉu) · hệ số lan tin ×1,25 |
| Ngày mưa dầm | `gazeFactor` ×0,62 | Khách ×0,45 · `STALL_CLEANLINESS` tụt gấp đôi → ảnh hưởng khách **hôm sau** · rau mua sáng có nguy cơ ế nguyên |

**Kết luận thiết kế:** người chơi *nên* điều chỉnh hành vi theo mưa — nhưng điều chỉnh đúng là **mua ít hàng hơn** và **mang nhiều dù hơn**, không phải **mua hàng dở hơn**. Đó là một quyết định kinh tế thật, và nó là một trong 6 quyết định đổi mỗi ngày.

---

## 3. Dữ liệu & schema

```ts
// core/clock.ts
export type Phase = "MORNING" | "SELLING" | "AFTERNOON" | "EVENING"
export type StallState = "IDLE" | "APPROACH" | "QUEUE" | "SERVING" | "PAUSED"

export interface DayClock {
  day: number                 // 1..40
  phase: Phase
  gameSec: number             // giây từ 00:00 trong ngày game
  realMsElapsed: number       // để telemetry
  openedAtGameSec: number     // người chơi tự chọn: 5h15 = 18900 | 5h45 = 20700
  closedAtGameSec?: number
}

// sim/schedule.ts
export interface FlowBucket {
  fromGameSec: number
  toGameSec: number
  walkInLots: number          // số LƯỢT khách vãng lai kỳ vọng
  loavesPerLot: [number, number, number]   // trọng số cho 1 / 2 / 3 ổ
  archetypes: { id: string; weight: number }[]
  namedArrivals: { npcId: string; atGameSec: number; loaves: number; weekdays: number[] }[]
}

export interface Weather {
  kind: "NANG_GAT" | "MAT" | "AM_U" | "MUA_RAO" | "MUA_DAM" | "OI"
  walkInMulByBucket: number[]   // 8 phần tử, khớp 8 khung giờ §2.4.4
  gazeMul: number
  nongTinhDelta: number
  cleanlinessDecayMul: number
  burntColdMul: number
}

// sim/queue.ts
export interface QueueSlot {
  npcId: string
  zone: "FRONT_CENTER" | "FRONT_SIDE" | "QUEUE_2" | "QUEUE_3"
  arrivedAtRealMs: number
  patienceSec: number
  waitedSec: number
  reason?: WaitReason
}

// content/days/day-013.json — ví dụ thật
{
  "day": 13,
  "weekday": "T7",
  "weather": "MAT",
  "seed": "0x5F3A21C7",
  "marketEvents": [],
  "obligations": [],
  "baselineLoaves": 54,
  "flow": [
    { "from": "05:45", "to": "06:15", "walkInLots": 3,
      "archetypes": [ {"id":"cong_nhan_ca_som","weight":6}, {"id":"tap_the_duc","weight":4} ],
      "named": [ {"npc":"anh_dung","at":"06:05","loaves":1} ] },
    { "from": "06:30", "to": "07:00", "walkInLots": 8,
      "archetypes": [ {"id":"hoc_sinh","weight":5}, {"id":"cong_nhan","weight":5} ],
      "named": [ {"npc":"chu_tu","at":"06:45","loaves":2},
                 {"npc":"co_mai","at":"06:50","loaves":1} ] },
    { "from": "07:00", "to": "07:30", "walkInLots": 7,
      "archetypes": [ {"id":"van_phong","weight":9}, {"id":"shipper","weight":1} ],
      "named": [ {"npc":"chi_hanh","at":"07:05","loaves":1},
                 {"npc":"chi_lan","at":"07:20","loaves":1} ] }
  ],
  "bulkOrderChance": 0.28,
  "bulkOrderWindow": ["06:30", "07:30"]
}
```

```ts
// Khách MỞ HÀNG — không phải một entry riêng, chỉ là cờ trên giao dịch đầu
export interface OpeningResult {
  firstTxnId: string
  viaMood: -1 | 0 | 1
  ritualDone: boolean
  ritualSkippedCount: number   // để cô Ba thôi nhắc từ lần 2
}
```

---

## 4. UI/UX hai thiết bị

**Nguyên tắc bao trùm: mọi áp lực là VẬT THỂ trong khung hình, không phải widget.**

| Thông tin | Cách hiện (PC ngang) | Cách hiện (mobile dọc — v2) | **Cấm** |
|---|---|---|---|
| Hàng đợi | 4 chỗ đứng có thật trong hẻm, người có mặt, có dáng | 4 avatar xếp ngang trên đầu khung | Con số "4", thanh chung |
| Kiên nhẫn từng người | Tư thế + nét mặt + bark tier-1/2/3. Người sắp bỏ đi **nhìn ra đầu hẻm** | Như PC, phóng to mặt người đứng đầu | Thanh đầu người, đồng hồ |
| Số ổ bánh còn | Rổ bánh thật, đếm được bằng mắt | Rổ ở góc dưới phải, luôn hiện | Chữ "54/54" |
| Giờ game | Bóng nắng đổ trên vách + tiếng loa phường 6h30 + tiếng chuông trường 6h50 | Một đồng hồ nhỏ ở thanh trên (mobile không đủ chỗ cho bóng nắng) | Đồng hồ đếm ngược |
| Thời tiết | Trời, âm thanh, người mặc áo mưa | Như PC | Icon thời tiết + hệ số |
| `viaMood` | **Không hiện gì** | **Không hiện gì** | Mọi thứ |
| Tiền trong két | Chỉ hiện ở pha **Chiều/Tối**, không hiện lúc bán | Như PC | Con số chạy lên mỗi lần bán (kiểu game idle) |

**Pha Sáng (đi chợ):** 4 sạp là 4 thẻ ngang, mỗi sạp một màn hình nhỏ. Giá hôm nay hiện rõ, **giá hôm qua hiện mờ bên cạnh** — đây là cách duy nhất người chơi học được pattern giá mà không cần bảng Excel (chi tiết `P3-03` §2.5). Nút **"mua như hôm qua"** để rút pha Sáng xuống ~25 giây khi người chơi đã ổn định.

**Pha Chiều:** sổ tay mở toàn màn hình. Bên trái là **dữ liệu thô game tự ghi**, bên phải là **ô trống người chơi tự gõ**. Không có gợi ý tự động, không có "AI suggest".

**Pha Tối:** tĩnh. Một góc nhìn cố định. Cô Ba, cái đèn, cái radio, tiếng mưa. Menu nghĩa vụ/thiết bị mở bằng cách **chạm vào cuốn sổ trên bàn**, không phải bằng nút góc màn hình.

**Trợ năng bắt buộc chạm vào doc này** (CANON §15): pause mọi lúc kể cả giữa lúc kéo nguyên liệu · chế độ không giới hạn thời gian · chế độ một khách một lượt · tắt âm báo tiêu cực (tiếng thở dài của khách chờ nằm trong nhóm này) · giảm chuyển động (tắt xe máy chạy qua trong pha bán — **kiểm tra riêng**: tắt rồi thì hẻm còn đọc được là đông không?).

---

## 5. Tham số cần tune

| Tham số | Khởi điểm | Khoảng | Cách đo |
|---|---|---|---|
| `SPEED.SERVING` | **10** | 6–16 | **Núm quan trọng nhất game.** Đo: pha Trưa có nằm trong 4–5,5 phút thật không |
| `SPEED.QUEUE` | 20 | 12–30 | Đo: thời gian chờ *cảm thấy* có đáng kể không. Người test có nói "tui thấy tội ổng" không |
| `SPEED.IDLE` | 420 | 240–720 | Đo: giờ thưa có chán không. Nếu người test bấm nút gì đó để tua → quá chậm |
| `assemblySec` | 40 (game) | 30–55 | Đo: trần thông lượng thật, bằng bot chơi tối ưu |
| `QUEUE_VISIBLE_MAX` | 4 | 3–5 | Đo: 5 người có làm mặt ai đó bị che không (T1 đòi mặt phải đọc được) |
| `patience.base` | 55s thật | 40–75 | Đo: tỉ lệ `balk` phải ở **4–9%** lượt khách. Dưới 4% = không có áp lực; trên 9% = ức chế |
| `patience` vùng im lặng | 0,40 | 0,30–0,50 | Đo: người test có nói "khách nào cũng gắt" không |
| `balk` grace | 1,0 + 0,6·deTha | — | Đo: khách Friend gần như không bao giờ bỏ đi; khách lạ thì có |
| `SKIPPED_IN_LINE` salience | 80 tức thời | 60–100 | Đo: cắt hàng có cảm thấy nặng hơn chờ lâu không |
| `bulkOrderChance` | 0,28/ngày | 0,15–0,40 | Đo: xuất hiện 1–2 lần/tuần. Tỉ lệ người chơi **nhận** phải ở 40–65% — nếu >80% thì thưởng quá cao, nếu <20% thì phạt quá nặng |
| `fixedCostPerDay` | 100k (115k từ d33) | 80–140 | Đo: đóng cửa lúc 8h phải **lỗ**, không phải hoà |
| `viaMood` walkInMul | **±0,03** | **0,00–0,05** | **Trần cứng 0,05.** Trên mức đó thì hiệu ứng vượt nhiễu và game trở thành game ma thuật |
| Rain `walkInMul` (rào/dầm) | 0,60 / 0,45 | 0,50–0,70 / 0,35–0,55 | Đo: EV ăn gian ngày mưa **không** được cao hơn ngày nắng (§2.8) |
| Rain `gazeMul` | 0,78 / 0,62 | 0,70–0,90 / 0,55–0,75 | Cùng phép đo |
| `reputation.alleyDelta` bước | −0,015/khách ruột bị hụt | 0,008–0,025 | Đo: 3 ngày đóng sớm phải thấy hẻm vắng đi rõ rệt |
| `openEarly assemblyPenalty` | +35%, 30 phút game | 20–50% | Đo: mở sớm phải hoà vốn khoảng 50/50, không phải luôn đúng |
| `oneCustomerMode traitMul` | ×0,90 | 0,85–1,00 | Đo: chế độ trợ năng **không được** dễ hơn hay khó hơn quá 10% về kết quả kinh tế |

---

## 6. Tiêu chí đạt

- [ ] **Đo được**, trên 10 người lạ, trung vị một ngày ở **6–10 phút thật**; một mùa **4,5–7 giờ**.
- [ ] Bốn pha đều có ít nhất **3 quyết định** người chơi thực sự cân nhắc (đo bằng thời gian dừng trước khi bấm > 1,5s, qua telemetry).
- [ ] **≥6 trong 18 quyết định đổi đáp án giữa hai ngày liên tiếp** đối với người chơi tốt. (Đây là bài kiểm tra trực tiếp cho HT4 — nếu ≤3 thì vẫn là "pate ngon hay pate rẻ".)
- [ ] Trong khung 6h30–7h30, hàng đợi đạt **4 người ít nhất 2 lần** ở ngày nắng thường.
- [ ] `balk` ở **4–9%** lượt khách vãng lai.
- [ ] **Không một người test nào** mô tả áp lực bằng chữ "timer" hoặc "đếm ngược" khi được hỏi tự do *"có lúc nào bạn thấy căng không, vì sao?"*. Câu trả lời mong đợi: *"lúc tui nhận cái đơn 6 ổ"*, *"lúc còn 3 ổ mà chị Lan chưa tới"*.
- [ ] Bot chơi "đóng cửa lúc 8h mỗi ngày" phải **hết tiền trước ngày 20**.
- [ ] Bot chơi "dùng pate rẻ mọi ngày mưa, pate ngon ngày nắng" phải có **lợi nhuận ≤ 3%** so với bot "pate ngon mọi ngày", và **quan hệ tệ hơn rõ rệt**.
- [ ] Hỏi 10 người test sau khi chơi xong: *"đốt vía có tác dụng không?"* — phân bố câu trả lời phải **chia rẽ** (không quá 70% nghiêng về một phía). Nếu ≥80% nói "có" → hiệu ứng quá to, game đang tuyên truyền. Nếu ≥80% nói "không" → game đang chế nhạo cô Ba.
- [ ] **Không có dòng thoại nào** trong toàn bộ content nói rằng đốt vía làm bán đắt hàng. Kiểm bằng grep trên `content/lines/`.
- [ ] Chế độ "một khách một lượt" cho kết quả kinh tế cuối mùa **trong khoảng ±10%** so với chế độ thường.

---

## 7. Rủi ro & cách bịt

| Rủi ro | Nối tới | Cách bịt |
|---|---|---|
| **Đóng cửa sớm** | §8 (l) | §2.7: chi phí cố định 100k/ngày + hạn dùng 1 ngày + `MADE_THEM_WAIT(CLOSED_EARLY)` đứt `streakDays` + danh tiếng hẻm |
| **Lịch mưa** | §8 (c) | §2.8: khách ×0,45–0,60 · và quan trọng hơn: `ORDER_DEFECT` **lúc ăn** không đi qua `gazeFactor` nên mưa không che được việc đổi nguyên liệu |
| **Farm cửa sổ điện thoại** | §8 (a) | Câu giờ trong lúc có hàng đợi là tự sát: `MADE_THEM_WAIT` leo thang trên **từng người riêng** và người sau cũng tính. Cửa sổ 2–3s giữ nguyên |
| **Từ chối phục vụ người "soi"** | §8 (k) | Từ chối = `MADE_THEM_WAIT(reason:"REFUSED")` intensity 90 + gossip seed xác suất cao (`0,6 + 0,4·thanThien`). Và vì đường cong §2.4.3 cố định, chị Lan **luôn** tới lúc 7h20 — không né được bằng cách mở muộn |
| **Save-scum** | §8 (e) | Autosave sau mỗi khách (CANON §2) + `SEASON_SEED` cố định → lịch thời tiết, lịch giá, lịch khách reload ra y hệt |
| **Tích trữ khi giá đáy** | §8 (j) | Không thuộc doc này — xem `P3-03` §2.2 (hạn dùng + sức chứa tủ) |
| ⚠️ **"Tuyên truyền mê tín dị đoan"** | CANON §14.1 🟡 | §2.6.2: bốn luật cứng + toán chứng minh hiệu ứng nằm dưới nhiễu + Thầy Phúc là người hoài nghi đáng kính + cô Ba **tự nghi ngờ** trong thoại + trần tune cứng 0,05 |
| **Hạ thấp nghề** | CANON §14.1 🔴 | Không có dòng nào khung việc bán bánh mì như "cực chẳng đã". Pha Tối là pha **thoả mãn**, không phải pha kiệt sức. Chi tiết ràng buộc ở `P3-06` §2.6 |
| **Mô phỏng sâu đời sống NPC** | CANON §16 Đừng-1 | Lịch sinh hoạt ở §2.4.3 là **bảng tĩnh**, không phải mô phỏng. Chú Tư đi làm lúc 6h45 vì bảng ghi 6h45, không vì có một công ty được mô phỏng |
| Ngày chơi quá dài → bỏ cuộc giữa mùa | T4 | §2.2 ngưỡng phản ứng + điểm dừng an toàn sau **mỗi khách** + pha Chiều/Tối không có đồng hồ |
| Giờ cao điểm thành game hành động | T4 "cozy" | Trần thông lượng chỉ dùng 67% ở đỉnh. Ba nguồn áp lực đều là **nút người chơi tự bấm**. Không có timer trên màn hình |

---

## 8. Truy vết

| Nội dung | `idea.md` | `CANON.md` |
|---|---|---|
| Cấu trúc 4 pha một ngày | §12.2 (dòng 507–513) | — |
| Thông lượng giờ cao điểm, 1 lò 2 tay, 6h30–8h | §22 mục 3 (dòng 1043) | §13.3 |
| "Chill là áp lực do mình tự tạo ra vì tham" | §22 mục 3, Minh | §13.3 |
| HT4 — vòng kinh tế có đúng 1 quyết định | §16 HT4 (dòng 680–685) | §10 hàng 2 |
| Mở hàng / nặng vía / nhẹ vía | §19.1 (dòng 922–940) | §14 |
| Đốt vía — 7/9 lần, muối, chanh, bồ kết, nhang, bài khấn | §19.1 bảng + dòng 938 | §14 |
| ⚠️ Tông trìu mến, không phải ma thuật, VOZ / *Bad Parenting* | §19.1 dòng 940 | §14, §14.1 🟡 |
| Đầu ngày không có tiền thối là điềm xấu | §19.1 dòng 928 | §14 |
| Đóng cửa sớm (l) | §21 hàng l (dòng 1033) | §8 (l) |
| Lịch mưa (c) | §21 hàng c (dòng 1024) | §8 (c) |
| Perception — công thức, bảng visibility, hiệu chỉnh 1,4s | — | §5, §5.4 |
| `MADE_THEM_WAIT` salience 100, leo thang theo giây | — | §3.1 |
| `ORDER_DEFECT` 20 tại quầy → 100 lúc ăn | — | §3.1, §6 |
| `STALL_CLEANLINESS` giảm khách hôm sau | — | §3.3 |
| Tính cách 4 chiều | §16 HT7, Minh | §4 |
| 12 NPC, lịch chú Tư 6h45 T2–T6 | §19.5 | §9 |
| Pause đóng băng kiên nhẫn · chế độ không giới hạn thời gian · một khách một lượt | §20 mục 2 + danh sách công tắc | §15 |
| Autosave sau mỗi khách, seed cố định theo ngày | §21 hàng e | §2, §8 (e) |
| P0 phải đo "một ngày = bao nhiêu phút thật" | — | §17 |

---

## 9. Đề xuất sửa CANON

**(9.1) — Thêm trường `reason` cho `MADE_THEM_WAIT`, giữ nguyên 11 sự kiện.**
CANON §3.1 mô tả `MADE_THEM_WAIT` là *"bắt chờ quá lâu / phục vụ sai thứ tự"*. Doc này mở rộng thành 4 `reason`: `SLOW` · `SKIPPED_IN_LINE` · `OUT_OF_STOCK` · `CLOSED_EARLY`, với `intensity` cơ bản khác nhau (leo thang / 80 / 55 / 70). **Không thêm sự kiện thứ 12** — chỉ là biến thể trong một sự kiện đã có, đúng kiểu `ORDER_DEFECT` đã được CANON mô tả là *"họ sự kiện, không phải một sự kiện"*. Đề nghị ghi một dòng xác nhận vào §3.1.

**(9.2) — Làm rõ: `certainty` và `patience` đo bằng giây THẬT.**
CANON §5 ghi `obs.certainty += rate * dt` mà không nói `dt` là giây game hay giây thật. Với đồng hồ co giãn ở §2.3, sự khác biệt là 70×. Hiệu chỉnh kiểm tra của chính CANON (*"CONFIRMED sau ~1,4 giây"*) chỉ có nghĩa nếu là **giây thật**. Đề nghị thêm chữ "thật" vào §5.

**(9.3) — Ghi nhận trần cứng cho hiệu ứng vía.**
Đề nghị thêm vào §14, sau dòng ⚠️: *"Trần tuyệt đối cho mọi hiệu ứng cơ học của vía: ±5% trên một biến duy nhất. Không có UI. Không có dòng thoại nào khẳng định đốt vía làm bán đắt hàng."* Lý do: đây là lằn ranh 🟡 duy nhất trong CANON không có con số, và không có con số thì nó sẽ trượt dần trong lúc tune.

**(9.4) — Cảnh báo về T4 nếu ngân sách thời gian đo ra dưới 4 giờ.**
CANON T4 khoá **40 ngày**. Nếu P0 đo ra một mùa < 4 giờ và việc tăng mật độ không cứu được, phương án duy nhất còn lại là giảm số ngày — và đó là sửa T4. Đề nghị CANON §1 ghi trước một dòng: *"40 ngày là mục tiêu nội dung; nếu tổng thời lượng đo được < 4 giờ, số ngày được phép giảm xuống 32 mà không coi là vi phạm T4, miễn là 'một mùa có điểm kết' được giữ."* Ghi trước để tránh tranh luận lúc dữ liệu về.
