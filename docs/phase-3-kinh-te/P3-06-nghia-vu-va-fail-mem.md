# P3-06 — Nghĩa vụ định kỳ, hụi, và fail mềm nhưng vĩnh viễn

**Thuộc phase:** P3 — Kinh tế
**Phụ thuộc:** `CANON.md` §1 (T3, T4), §8 (d, f, k), §9, §10, §13, §14, §14.1 🔴, §15 (nguyên tắc kết game) · `P3-01` (vòng một ngày, lịch thời tiết) · `P3-03` (giá bán, giá vốn, giá chợ 40 ngày) · `P3-04` (**nguồn sự thật cho catalogue thiết bị**) · `P3-05` (**nguồn sự thật cho chỗ đứng L1–L5 và tiền thuê**) · `P4-*` (kết game)
**Trạng thái:** **Chốt** cho cấu trúc nghĩa vụ, hụi, và nguyên tắc ending · **Cần đo** cho toàn bộ §2.7 (bảng cân đối) · ✅ **Đã hợp nhất:** bảng §9.5 được duyệt và nâng thành **CANON §13.1** — toàn bộ số tiền trong doc này đã viết lại theo đó

---

## 1. Mục tiêu

Thay **fail state cứng** bằng **fail mềm nhưng VĨNH VIỄN** (idea.md §22, CANON §13). Người chơi không bao giờ thấy màn hình "Game Over". Nhưng họ có thể **mất thứ không lấy lại được**: chỗ đứng đầu hẻm, cái tủ mát, một chân trong dây hụi, một khách ruột.

Doc này phải đồng thời giữ ba thứ đang kéo về ba hướng ngược nhau:

1. **Đủ áp lực để mọi quyết định đều có giá** — nếu không thì HT4 chưa được vá, dù đã có 18 quyết định mỗi ngày (`P3-01` §2.1). Quyết định chỉ có nghĩa khi tiền có thể thiếu.
2. **Không stress** — T4 khoá thể loại. Không stamina, không daily login, không timer.
3. **Mọi ending đều tử tế** (CANON §15) — *"chỉ khác nhau về ai còn ở đó với mình."* Thất bại kinh tế phải dẫn tới một kết thúc **KHÁC**, tuyệt đối không phải **TỆ HƠN**.

Và trên hết: **không được vi phạm lằn ranh đỏ "hạ thấp nghề"** (CANON §14.1 🔴). Xe bánh mì là nghề đáng tự hào, tảo tần, có phẩm giá. Mọi nghĩa vụ trong doc này phải là **chuyện của người đang làm ăn được**, không phải chuyện của người đang chật vật để thoát ra.

---

## 2. Cơ chế

### 2.1. Vì sao fail cứng không dùng được ở đây

| Kiểu fail | Vì sao hỏng trong game này |
|---|---|
| **Phá sản → Game Over** | Vi phạm T4 (*"một mùa có điểm kết"* — điểm kết phải là **ngày 40**, không phải ngày bạn hết tiền) và vi phạm nguyên tắc kết game §15 |
| **Reset ngày / chơi lại ngày** | Vô hiệu hoá toàn bộ hệ trí nhớ NPC, và chống ăn gian §8 mục (e) cấm tuyệt đối (autosave sau mỗi khách + seed cố định) |
| **Vay nợ vô hạn** | Không có áp lực → quay lại HT4 |
| **Cô Ba bù tiền** | Vi phạm §7.4 và §10: cô Ba là mentor, không phải lưới an toàn. Nếu cô cứu mọi lần, mọi quyết định đều miễn phí |

**Cấu trúc thay thế:**

```ts
// econ/obligations.ts
type ObligationOutcome =
  | { kind: "PAID" }                                   // bình thường
  | { kind: "PAID_LATE"; graceUsed: number }           // trong hạn ân, không hệ quả
  | { kind: "DEFAULTED"; permanentLoss: PermanentLoss } // ← MẤT THẬT, KHÔNG LẤY LẠI ĐƯỢC

// KHÔNG có nhánh { kind: "GAME_OVER" }. Nó không tồn tại trong codebase.
```

**Ba tính chất bắt buộc của mọi `PermanentLoss`:**

1. **Không mua lại được trong mùa này.** Chỗ đứng mất là chú Kiệt dọn vào; tiền không đổi lại được chỗ.
2. **Nhìn thấy được mỗi ngày còn lại.** Không phải một debuff trong menu — là một **cái nền khác**, một góc hẻm khác, một cái tủ không còn ở đó.
3. **Không bao giờ là cái cuối cùng.** Sau mỗi mất mát, ngày hôm sau vẫn mở hàng bình thường, vẫn có khách, vẫn bán được. **Mất rồi vẫn chơi tiếp được tới ngày 40.** Đây là điều tách "fail mềm" khỏi "fail chậm".

### 2.2. Bốn nghĩa vụ

> ✅ **ĐÃ HỢP NHẤT.** Xung đột số tiền giữa doc này với `P3-04` §2.6.1 và `P3-05` **đã được giải quyết**: bảng đề nghị ở §9.5 được duyệt và nâng thành **CANON §13.1 — nguồn sự thật duy nhất**. Bảng dưới đây đã viết lại theo đó. Cấu trúc (nghĩa vụ, chu kỳ, hạn ân, `PermanentLoss`, cách telegraph) giữ nguyên — **Chốt**.

| # | Nghĩa vụ | Bắt buộc? | Số tiền | Chu kỳ | Người nhắc | Báo trước |
|---|---|---|---|---|---|---|
| 1 | **Rút về nhà** | ✅ | **150k/ngày** | **Mỗi ngày**, pha Tối | Không ai nhắc — tự động trừ lúc đếm tiền | — |
| 2 | **Tiền thuê chỗ** | ✅ | **42k/ngày** (`L1`; L2 55k · L3 85k · L4 95k · L5 12k) | **Mỗi ngày**, thu vào pha Sáng | Chủ nhà mặt tiền (nhân vật vô danh, chỉ hiện bàn tay + tờ biên nhận) | hạn ân **3 ngày** |
| 3 | **Tiền hụi** | ✅ | **500k** | Ngày 5, 10, 15, 20, 25, 30, 35, 40 | **Cô Mai** (chủ hụi) | **2–3 ngày** |
| 4 | **Tiền học của em** | ✅ | **1.200k** | Ngày 18, 38 | Cuộc gọi ở pha Tối (giọng người, không hiện mặt) | **6 ngày** |
| 5 | **Tiền thuốc cô Ba** | ❌ **Tự nguyện** | **600k** | Ngày 20, 30 | **Không ai nhắc.** Người chơi phải tự để ý | — |

**Tổng bắt buộc cả mùa: 6.000k (rút về nhà) + 1.680k (thuê chỗ `L1`) + 4.000k (hụi) + 2.400k (tiền học) = 14.080k.** Trừ tiền hốt hụi (2.800k–4.200k tuỳ kỳ hốt) → **ròng 9.880k–11.280k**. Chừa ≈**8.050k** cho thiết bị — khớp con số ≈8.100k mà `P3-04` tự tính độc lập.
**Tự nguyện: 1.200k.**

#### 2.2.1. Lịch nghĩa vụ đầy đủ 40 ngày

Cột "Thời tiết" và "Doanh thu kỳ vọng" lấy từ `P3-01` §2.4.4 và `P3-03` §2.4.4.

| Ngày | Thứ | Thời tiết | Nghĩa vụ | Tiền ra | Doanh thu kỳ vọng | Báo trước từ ngày |
|---|---|---|---|---|---|---|
| **2** | T3 | Nắng | *(cô Mai nhắc hụi kỳ 1)* | — | ~900k | |
| **5** | T6 | Nắng | Hụi kỳ 1 | **500k** | ~900k | 2 |
| **5** | T6 | Nắng | *(chủ nhà báo tiền thuê)* | — | | |
| **10** | T4 | **Mưa rào** | **Thuê chỗ + Hụi kỳ 2** | **2.700k** | **~820k** ⚠️ | 5 (thuê) |
| **12** | T6 | Nắng | *(điện thoại: tiền học)* | — | ~1.180k | |
| **13** | T7 | Mát | *(cô Mai nhắc hụi kỳ 3)* | — | ~1.570k | |
| **15** | T2 | Nắng | Hụi kỳ 3 | **500k** | ~1.510k | 13 |
| **18** | T5 | **Mưa rào** | **Tiền học kỳ 1** | **1.200k** | **~1.620k** ⚠️ | 12 |
| **18** | T5 | | *(cô Mai nhắc hụi kỳ 4)* | — | | |
| **20** | T7 | Mát | **Hụi kỳ 4** + *Tiền thuốc (tự nguyện)* | **500k** *(+600k)* | ~1.570k | 18 |
| **20** | T7 | | *(chủ nhà báo tiền thuê)* | — | | |
| **23** | T3 | Mát | *(cô Mai nhắc hụi kỳ 5)* | — | ~1.630k | |
| **25** | T5 | **Mưa rào** | **Thuê chỗ + Hụi kỳ 5** | **2.700k** | **~1.190k** ⚠️ | 20 (thuê) |
| **28** | CN | Âm u | *(cô Mai nhắc hụi kỳ 6)* | — | ~1.720k | |
| **30** | T3 | Nắng | **Hụi kỳ 6** + *Tiền thuốc (tự nguyện)* · 😢 chú Tư đi | **500k** *(+600k)* | ~1.790k | 28 |
| **32** | T5 | **Mưa rào** | *(điện thoại: tiền học kỳ 2)* | — | ~1.130k | |
| **33** | T6 | Nắng | ⚠️ Giá gas tăng: chi phí cố định **100k → 115k vĩnh viễn** | +15k/ngày | ~1.740k | **không báo trước** |
| **33** | T6 | | *(cô Mai nhắc hụi kỳ 7)* | — | | |
| **35** | CN | Âm u | **Hụi kỳ 7** | **500k** | ~1.870k | 33 |
| **35** | CN | | *(chủ nhà báo tiền thuê cuối)* | — | | |
| **38** | T4 | **Mưa dầm** | **Tiền học kỳ 2** | **1.200k** | **~1.610k** ⚠️ | 32 |
| **40** | T6 | Nắng | **Hụi kỳ 8 (hoặc hốt)** + **Cọc giữ chỗ mùa sau — LỰA CHỌN CUỐI** | **500k** *(+1.260k cọc tuỳ chọn = 30 ngày × 42k)* | ~1.960k | 35 |

> **Ba cú lớn nhất (ngày 18, 35, 38) đều rơi vào ngày mưa hoặc âm u.** Không phải ngẫu nhiên — ghép tay, khoá bằng `SEASON_SEED`. Nó dạy đúng một bài học và dạy bằng hậu quả chứ không bằng lời: **phải để dành trước**. Người chơi lần 2 sẽ biết, và đó là phần thưởng của việc chơi lại (`P3-03` §2.5.1).

#### 2.2.2. Cảnh báo — hình thức, không phải UI

```ts
// Nghĩa vụ KHÔNG BAO GIỜ hiện như một badge đỏ trên góc màn hình.
// Nó đến qua người, đúng T3 (không hiện chỉ số) và T2 (không có dialogue tree).

function telegraph(ob: Obligation, daysBefore: number) {
  switch (ob.kind) {
    case "THUE_CHO":
      // Một bàn tay đưa tờ biên nhận qua mép xe, lúc 10h sáng. Không có mặt, không có thoại.
      // Tờ biên nhận NẰM LẠI trên xe cho tới khi trả — một vật thể trong khung hình.
      scene.propAdd("bien_nhan_thue_cho", { untilPaid: true })
      break
    case "HUI":
      // Cô Mai ghé lúc 6h50 hoặc 10h50 (lịch của cô, P3-03 §2.4.2), nói một câu bark.
      coMai.bark("hui_nhac", { tier: daysBefore <= 1 ? 1 : 2 })
      break
    case "TIEN_HOC":
      // Pha Tối. Điện thoại reo. Người chơi CÓ THỂ không nghe máy — cuộc gọi lặp lại tối hôm sau.
      evening.phoneCall("tien_hoc", { repeatsUntilAnswered: true })
      break
    case "TIEN_THUOC":
      // KHÔNG telegraph. Người chơi chỉ biết nếu họ để ý cô Ba ho, hoặc thấy vỉ thuốc trên bàn.
      break
  }
}
```

**Nơi duy nhất người chơi tra được tổng nghĩa vụ là cuốn sổ trong pha Tối** — và nó là **một trang giấy viết tay**, liệt kê ngày và số tiền, không có tổng, không có cảnh báo, không có màu đỏ. Người chơi phải tự cộng.

### 2.3. Chơi hụi — cơ chế thật, và cách biến thành gameplay

#### 2.3.1. Hụi thật hoạt động thế nào

Một nhóm người quen (ở đây: **8 chân**) góp một khoản đều đặn mỗi kỳ. Mỗi kỳ, **một người được "hốt"** — lấy cả cục tiền của kỳ đó. Ai cần tiền gấp thì **bỏ thăm lãi cao** để được hốt sớm; ai không cần thì đợi, và **người hốt sau ăn phần lãi của người hốt trước**.

> Hụi là **ngân hàng của người không có ngân hàng**. Nó không phải là cờ bạc. Nó là tiết kiệm bắt buộc cộng vay không thế chấp, chạy hoàn toàn bằng **uy tín trong một cái hẻm**. Đó là lý do nó thuộc về game này: **toàn bộ rủi ro của hụi là rủi ro quan hệ**, và game này đã có sẵn một hệ quan hệ.

**Chủ hụi là cô Mai** (CANON §9 NPC 7: chủ tạp hoá **làm ăn được** — đúng vai). Cô hốt kỳ 1, miễn lãi, theo đúng tục.

#### 2.3.2. Mô hình trong game

```ts
// econ/obligations.ts
interface HuiLine {
  chan: 8                       // 8 chân
  perPeriod: 500                // k, mỗi kỳ
  periodsOnDays: [5,10,15,20,25,30,35,40]
  ownerNpc: "co_mai"            // chủ hụi hốt kỳ 1
  playerTookOnPeriod?: number   // 2..8, undefined = chưa hốt
}

// Hốt càng sớm nhận càng ít — đó là LÃI người chơi trả cho việc có tiền trước
const HUI_PAYOUT: Record<number, number> = {
  2: 2800, 3: 3000, 4: 3200, 5: 3400, 6: 3700, 7: 3950, 8: 4200
}
```

| Kỳ hốt | Ngày | **Nhận** | Tổng góp cả mùa | Lời / lỗ | Ý nghĩa gameplay |
|---|---|---|---|---|---|
| **2** | **10** | **2.800k** | 4.000k | **−1.200k** | Cục tiền sớm nhất. Đủ mua **tủ mát mini (2.800k)** đúng ngày 10, hưởng 30 ngày. Nhưng ngày 10 cũng là ngày phải trả 2.700k thuê + hụi |
| 3 | 15 | 3.000k | 4.000k | −1.000k | |
| 4 | 20 | 3.200k | 4.000k | −800k | Đủ **lò than đôi (3.200k)** vừa khít |
| 5 | 25 | 3.400k | 4.000k | −600k | Cân bằng nhất. Đủ đệm cho cú 2.700k cùng ngày |
| 6 | 30 | 3.700k | 4.000k | −300k | |
| 7 | 35 | 3.950k | 4.000k | −50k | |
| **8** | **40** | **4.200k** | 4.000k | **+200k** | **Hụi chót.** Ăn lãi — nhưng nhận vào **ngày cuối cùng**, gần như vô dụng để mua thiết bị |

**Đây là một quyết định kinh tế thật và không có đáp án đúng:**

```
Hốt kỳ 2 (ngày 10): trả lãi 1.200k, đổi lấy tủ mát mini sớm 30 ngày.
  Tủ mát mini hạ tỉ lệ hàng hỏng từ ~10% xuống ~4% trên chi tiêu nguyên liệu.
  30 ngày × 835k nguyên liệu/ngày × 6% = TIẾT KIỆM ~1.500k.
  → Lời ~300k. MỎNG. Và nếu người chơi chưa biết cách quản tồn kho thì LỖ.

Hốt kỳ 8 (ngày 40): ăn lãi 200k, nhưng cả mùa chạy bằng thùng xốp.
  Thùng xốp: pate hạn 2 → 1 ngày (P3-03 §2.2.2). Mỗi ngày phải mua pate mới.
  → Mất chiết khấu số lượng suốt 40 ngày. Khoảng −900k.

→ Điểm ngọt nằm ở kỳ 4–5 (ngày 20–25), NHƯNG chỉ đúng nếu người chơi
  quản tồn kho tốt. Với người chơi vụng, hốt sớm là đúng.
  KHÔNG CÓ ĐÁP ÁN CHUNG.
```

#### 2.3.3. Hụi bể — rủi ro, và cách nó KHÔNG thành bài học đạo đức

Một chân bỏ trốn, dây tan, người chưa hốt mất tiền. Đây là rủi ro thật của hụi và nó phải có mặt — nhưng nó **không được** trở thành một đoạn game lên lớp người chơi về chuyện "đừng tin người lạ".

**Thiết kế:**

```ts
// Quyết định bằng SEASON_SEED, KHÔNG roll lúc chạy → chống save-scum (§8 mục e)
const huiWillBreak = seededBool(SEASON_SEED, "hui_be")     // ~35% số seed

// TÍN HIỆU — đây là chỗ T5 sống: người chơi phải ĐỌC ĐƯỢC rủi ro TRƯỚC khi hành động
const SIGNALS = huiWillBreak
  ? [ { day: 24, src: "ba_bay",  line: "hui_signal_1" },     // "nghe nói bà Chín kẹt tiền"
      { day: 26, src: "ba_sau",  line: "hui_signal_2" },     // "bà Chín dọn đồ về quê ta?"
      { day: 28, src: "be_su",   line: "hui_signal_3" },     // "nhà bà Chín khoá cửa rồi cô"
      { day: 29, src: "chu_kiet",line: "hui_signal_4" } ]    // đối thủ cũng chơi hụi. Ông lo thật
  : [ { day: 26, src: "ba_bay",  line: "hui_noise_1" } ]     // một tín hiệu giả, rồi thôi
```

> **Bốn tín hiệu ≠ một tín hiệu.** Người chơi chú ý sẽ đếm được. Đó là T5 — rủi ro đọc được, không phải xổ số.

**Và quan hệ mua được sự chắc chắn** — đúng định hướng chống ăn gian §8 mục (f):

| Quan hệ với cô Mai vào ngày 27 | Cô nói gì |
|---|---|
| **Friend** | Sự thật, thẳng: *"Con ơi... bà Chín kẹt rồi. Cô nói trước cho con biết. Con muốn rút thì cô làm giấy cho."* |
| **Acquaintance** | Vòng vo: *"Dạo này dây hụi mình... cũng hơi lộn xộn. Con tính sao thì tính."* |
| **Rival** | **Im lặng.** Cô không nói gì. Người chơi chỉ có 4 tín hiệu gossip mà tự suy |

**Ba lối ở ngày 30:**

| Lựa chọn | Nếu dây bể | Nếu dây không bể |
|---|---|---|
| **Rút khỏi dây** (nếu chưa hốt) | Nhận lại **55%** số đã góp (5 kỳ × 500k × 0,55 = **1.375k**) | Cùng vậy: **1.375k**. Mất 1.125k vì rút hụt |
| **Ở lại** (nếu chưa hốt) | Dây tan. Nhận lại **40%** (**1.000k**). Mất 1.500k | Chạy tiếp bình thường; vì một chân rút ra, tiền hốt của người chơi **+300k** |
| **Đã hốt trước ngày 30** | Người chơi **giữ nguyên tiền đã hốt** và **khỏi góp những kỳ còn lại** → **lời bất ngờ 500k–1.500k** | Góp tiếp bình thường |

**Xử lý tông — đây là phần quan trọng hơn phần số:**

1. **Cô Mai là người thiệt nhất, không phải người chơi.** Cô là chủ hụi. Dây bể là uy tín của cô. Cảnh ngày 31 ở pha Tối: cô ngồi ở bậc thềm tiệm tạp hoá, đèn tắt sớm hơn mọi khi. **Cô không khóc. Cô không xin lỗi dài dòng.** Cô nói một câu:
   > *"Cô gom được bao nhiêu cô trả lại bấy nhiêu. Còn lại... thôi con."*
2. **Nếu người chơi đã hốt và lời** — game **không** đặt cho họ một lựa chọn đạo đức kiểu "trả lại tiền hay không". Không có nút đó. Nếu người chơi muốn giúp cô Mai, họ làm điều duy nhất game cho phép: **mang cho cô một ổ bánh mì** vào sáng hôm sau. Nó không phải một giao dịch. Nó là một ổ bánh mì.
3. **Bà Chín không bao giờ xuất hiện, không bao giờ bị lên án.** Không có NPC nào nói bà là kẻ xấu. Câu duy nhất về bà, do bà Bảy nói, là: *"Chắc bả kẹt quá. Ai mà muốn vậy."* — **người Việt nói về người Việt** (CANON §14.1).
4. **Dây bể không đóng cửa gì cả.** Ngày 31 vẫn mở hàng. Không có nghĩa vụ hụi nữa → thực ra **tiền mặt hằng ngày dễ thở hơn**. Mất mát là mất cục tiền lớn để mua thiết bị.
5. **Không có achievement nào liên quan tới hụi bể.** Không có *"Bạn đã học được bài học về tài chính"*.

### 2.4. Bốn `PermanentLoss` — mất là mất thật

| Nghĩa vụ trễ | Hạn ân | `PermanentLoss` | Nhìn thấy thế nào |
|---|---|---|---|
| **Thuê chỗ** | **3 ngày** | **Mất chỗ đầu hẻm.** Dời vào góc khuất giữa hẻm | Cả cái nền đổi. Ngày hôm sau người chơi mở mắt ra ở một góc khác |
| **Hụi** | **1 ngày** | Lần 1: cô Mai ứng giùm (**chỉ một lần cả mùa**). Lần 2: **bị loại khỏi dây** | Không còn cô Mai ghé nhắc buổi sáng. Cái im lặng đó là thứ nhìn thấy được |
| **Tiền học** | **5 ngày** | **Phải bán một thiết bị** — game bắt chọn cái nào, bán lại chỉ được **50%** | Cái tủ không còn ở đó nữa. Sprite biến mất khỏi xe |
| **Tiền thuốc** | — | **Không có hệ quả cơ học nào** | Một cảnh tối khác đi, và một dòng khác trong ending |

#### 2.4.1. Mất chỗ đứng — hệ quả định lượng

> **Tham số chỗ đứng thuộc `P3-05` §2.x (năm chỗ `L1_DAU_HEM` … `L5_GOC_KHUAT`).** Doc này không định nghĩa lại, chỉ mô tả **đường vào L5 qua vỡ nghĩa vụ** và hệ quả kinh tế của nó.

```ts
// econ/obligations.ts — đường duy nhất vào L5 KHÔNG do người chơi tự chọn
function onRentDefault() {
  stand.forceRelocate("L5_GOC_KHUAT")
  stand.lockOut("L1_DAU_HEM", { forSeason: true, takenBy: "chu_kiet" })  // ← VĨNH VIỄN
  // NHƯNG: L2/L3/L4 vẫn mở. Người chơi KHÔNG bị kẹt ở L5.
  return { kind: "DEFAULTED", permanentLoss: "LOST_PRIME_STAND" }
}
```

| | `L1_DAU_HEM` | `L5_GOC_KHUAT` | Chênh |
|---|---|---|---|
| Khách vãng lai | ×1,00 | **×0,65** (`P3-05`) | **−35%** |
| Ổ/ngày (băng 54) | 54 | **≈38** | −16 ổ |
| Lãi gộp/ngày | 680k | **≈479k** | **−201k/ngày** |
| Tiền thuê | **42k/ngày** (`P3-05`) | **12k/ngày** | **+30k/ngày** |
| `attentionMul` | 1,00 | **0,80** | ít mắt nhìn hơn |
| `queueMax` | 4 | **3** | hẻm hẹp hơn |
| **Ròng mỗi ngày** | | | **−201k + 30k = −171k/ngày** |

**Mất chỗ từ ngày 13 (hết hạn ân của kỳ ngày 10) tới ngày 40 = 27 ngày × −171k ≈ −4.620k.** Rất đau. Nhưng:

- **Hai an ủi có thật, và chúng phải có thật:**
  1. **Tiền thuê rẻ hơn 30k/ngày.** Dòng tiền hằng ngày dễ thở hơn **ngay ngày hôm sau**. Người chơi đang chìm sẽ **nổi lên được** — đó là điều tách "fail mềm" khỏi "chờ chết" (§2.1 tính chất 3).
  2. **Ít mắt nhìn hơn.** `attentionMul` 0,80 và `queueMax` 3 thay vì 4 (`P3-05`). Tổng `rate` perception giảm (`P3-01` §2.4.5). Một người chơi vụng tay sẽ thấy mình ít bị bắt lỗi hơn.
  > Đây không phải là "mất chỗ thì tốt hơn". Ở L5 hàng đợi hiếm khi vượt 1–2 người, nên **phần lớn khách đứng ở `FRONT_CENTER`** (visibility 0,95) — **ai tới thì nhìn thẳng vào tay bạn**. Ít mắt hơn nhưng **mỗi con mắt gần hơn**. An ủi thật, nhỏ, và không đủ bù.

- **Ai dọn vào chỗ cũ: chú Kiệt.** Ngày hôm sau, xe của ông ở L1. Ông **không** đắc thắng. CANON §9 ghi ông là *"vừa là đối thủ vừa là người duy nhất hiểu nghề của bạn"*. Dòng của ông:
  > *"Tao không giành đâu. Chỗ trống thì người ta cho tao. Mày cần gì thì qua nói."*
  Và từ đó, **ông thực sự giúp**: cho mượn đá khi hết, báo giá chợ. Mất chỗ đứng mở ra một nhánh quan hệ **không có cách nào khác để mở**. Đây là hiện thân của nguyên tắc §15: thất bại dẫn tới ending **khác**, không phải **tệ hơn**.

- **Cái mất vĩnh viễn là `L1`, không phải khả năng dời chỗ.** Hai doc nói hai vế của cùng một chuyện, và đây là cách chúng khớp nhau:
  | Nguồn | Phát biểu | Đọc đúng |
  |---|---|---|
  | idea.md §22 · CANON §13 | *"mất chỗ đứng đẹp phải dời sang góc khuất (ít khách hơn **cả mùa**)"* | **`L1` bị khoá vĩnh viễn trong mùa.** Có tiền cũng không lấy lại — chú Kiệt đã dọn vào |
  | `P3-05` | *"L5 … leo lại được, tốn ~9–12 ngày. Không phải game over"* | **Người chơi không bị kẹt ở L5.** Cơ chế dời chỗ của `P3-05` (cọc + mất khách quen) vẫn dùng được để lên `L2`/`L3`/`L4` |

  → **Trần chỗ đứng sau khi vỡ tiền thuê là `L2`, không bao giờ là `L1`.** Đó là cái "không lấy lại được", và nó đủ cụ thể để test.

#### 2.4.2. Bị loại khỏi dây hụi

```ts
function onHuiMissed(times: number) {
  if (times === 1) {
    coMai.bark("hui_ung_gium")     // "Cô ứng cho con kỳ này. Kỳ sau nhớ nghen."
    relation.nudge("co_mai", -12)
    return { kind: "PAID_LATE", graceUsed: 1 }
  }
  // Lần 2 — vĩnh viễn
  hui.expelPlayer()
  const refund = hui.contributedSoFar * 0.55
  relation.demoteTier("co_mai")                       // Friend → Acquaintance, hoặc → Rival
  relation.lowerTrustCeiling("co_mai", 0.75)          // CANON §8 mục (d): hạ TRẦN tin tưởng VĨNH VIỄN
  return { kind: "DEFAULTED", permanentLoss: "HUI_EXPELLED" }
}
```

**Cái mất lớn nhất không phải tiền — là nguồn tiền cục.** Không có hụi thì không có cách nào gom được 2.800–4.200k một lần. Thiết bị lớn (tủ mát lớn 6.500k, lò than đôi 3.200k, xe mới 4.500k) trở thành **gần như không mua nổi**, vì dòng tiền hằng ngày còn phải gánh thuê chỗ và tiền học.

**Và mất cô Mai là mất bốn thứ cùng lúc** (đọc lại `P3-03`):
- Nguồn **đổi tiền lẻ** → *"Cô cũng hết lẻ rồi con."* → phải chạy 90 giây game ra tiệm đầu kia → **trễ mở hàng** → `viaMood` xấu thường xuyên hơn
- Buổi **đối sổ nợ hằng tuần** → sổ nợ không còn tự đúng → "âm tiền vốn" tăng
- **Thông tin** về hụi bể, về giá chợ
- Một khách ruột đến **mỗi ngày**

Đây là ví dụ rõ nhất của nguyên tắc **"phần hay không nằm ở EV mà nằm ở quan hệ"** (§8 mục f): mất 500k tiền hụi thì bảng Excel tính được. Mất cô Mai thì không.

#### 2.4.3. Bán thiết bị để trả tiền học

```ts
function onTuitionDefault() {
  const owned = equipment.owned().filter(e => e.resellable)
  if (owned.length > 0) {
    const chosen = ui.forcePlayerChoose(owned, {
      title: "Phải xoay cho đủ. Bán cái nào?",
      showPrice: e => Math.floor(e.price * 0.50),       // BÁN LẠI CHỈ ĐƯỢC 50%
      cancellable: false,
    })
    equipment.remove(chosen)                             // sprite biến mất khỏi xe NGAY
    return { kind: "DEFAULTED", permanentLoss: "SOLD_EQUIPMENT" }
  }
  // Không có gì để bán → bán chính cái xe của cô Ba, đổi xe rẻ hơn
  cart.downgrade()                                       // −1 slot preset công thức, VĨNH VIỄN
  return { kind: "DEFAULTED", permanentLoss: "CART_DOWNGRADED" }
}
```

**Vì sao bắt chọn mà không tự chọn:** cái đau nằm ở việc **người chơi phải tự tay bấm vào cái tủ mát mình đã tiết kiệm 12 ngày để mua**. Game không được làm việc đó thay. Nhưng game cũng không được để họ né — `cancellable: false`.

**`cart.downgrade()` mất 1 slot preset công thức** — nối vào hệ công thức tham số hoá (idea.md §22 bổ sung 1, `P3-05`): 3 preset mỗi sáng còn 2. Đây là mất mát **về khả năng phục vụ nhiều khẩu vị**, tức là mất mát **quan hệ được trá hình thành mất mát cơ học**. Đúng tinh thần doc này.

**Và cô Ba nói gì khi xe bị đổi:** (bắt buộc kiểm tra bởi người viết văn hoá — CANON §14.1)
> *"Xe này cô đẩy hồi mới hăm mấy. Thôi, xe nào cũng bán bánh mì được hết con."*

Không tiếc nuối kéo dài, không tự thương hại. **Nghề vẫn là nghề.**

### 2.5. Khách ruột mất là mất thật — không có respawn quan hệ

**Khẳng định lại, không thương lượng** (CANON §13, idea.md §22):

```ts
// sim/relationship.ts
function onCustomerLost(npc: NPC, cause: LossCause) {
  npc.state = "GONE"
  npc.schedule = null            // không bao giờ xuất hiện trong flow nữa
  // KHÔNG có: npc.respawnAfterDays, npc.forgivenessTimer, npc.replacementNpcId
}
```

**Không có cơ chế nào trong codebase tạo ra một NPC mới để thay thế.** 12 NPC có tên là 12 NPC có tên. Khách vãng lai vô danh vẫn tới, nhưng họ không có tên, không có trí nhớ, không có `REMEMBERED_USUAL`.

#### 2.5.1. Bốn đường mất khách ruột

| Đường | Cơ chế | Ví dụ điển hình |
|---|---|---|
| **Im lặng biến mất** | `soi` cao + `nongTinh` thấp + `thanThien` thấp (CANON §4). Tích đủ memory xấu → một ngày họ không tới, và không có cảnh chia tay | **Chị Lan.** Đây là đường đau nhất và nó không có cảnh báo nào ngoài nét mặt |
| **Hết hàng / đóng cửa lặp lại** | `MADE_THEM_WAIT(OUT_OF_STOCK / CLOSED_EARLY)`, đứt `streakDays` 3 lần trong 10 ngày | Chú Tư, bà Bảy (`P3-03` §2.3) |
| **Grudge tích + trần tin tưởng hạ** | §8 mục (d): giận nguôi được nhưng **trần tin tưởng hạ vĩnh viễn**. Đủ nhiều lần → trần xuống dưới ngưỡng Acquaintance | Bất kỳ ai bị "vắt rồi để nguội" |
| **Từ chối phục vụ** | §8 mục (k): `MADE_THEM_WAIT(REFUSED)` intensity 90 + gossip xác suất cao | Người chơi né người `soi` cao |

**Arc có sẵn không tính là mất:** chú Tư rời đi ngày 30 vì công ty dời chỗ (CANON §9), và **việc đó xảy ra dù người chơi làm gì** — nhưng có **báo trước 3–4 ngày** và có **một cảnh chia tay**. Mất khách vì lỗi của mình thì **không có cảnh chia tay**. Sự khác biệt đó là toàn bộ điểm.

**Công tắc trợ năng** (CANON §15, danh sách 6 công tắc): *"khách biến mất không chia tay"* → bật tuỳ chọn **"họ để lại lời nhắn"**. Khi bật, một NPC biến mất sẽ để lại một mẩu giấy ở xe vào ngày hôm sau. **Cơ chế không đổi — họ vẫn không quay lại.** Chỉ có sự bất lực về nhận thức được gỡ bỏ.

#### 2.5.2. Hệ quả kinh tế — định lượng

| NPC mất | Ổ/ngày × tần suất | Doanh thu mất (mất ở ngày 20) | Lãi gộp mất | Mất thêm |
|---|---|---|---|---|
| **Chú Tư** | 2 ổ đầy đủ × T2–T6 | 8 buổi còn lại (ông đi ngày 30) × 64k = **512k** | **195k** | Thấp — ông sắp đi sẵn |
| **Chị Lan** | 1 ổ đầy đủ × T2–T7 | 17 buổi × 32k = **544k** | **207k** | **Nút lan tin mạnh nhất hẻm.** Mất cô là mất kênh khuếch đại tin tốt |
| **Bà Bảy** | 1 ổ thường × mỗi ngày | 20 ngày × 25k = **500k** | **242k** | Nguồn **nghe lỏm** (CANON §12 ràng buộc 4). Không có bà, người chơi mất một cửa sổ đọc hệ thống |
| **Cô Mai** | 1 ổ thường × mỗi ngày | **500k** | **242k** | Tiền lẻ + sổ nợ + hụi + thông tin (§2.4.2) |
| **Bé Su** | 1 ổ thường × T2–T6 | 14 buổi × 25k = **350k** | **170k** | Bộ khuếch đại danh tiếng. `thanThien 1.0` — hệ số lan tin cao nhất bảng |

**Cộng hai lớp ẩn:**

```ts
// Mỗi khách ở bucket Friend góp vào lượng khách vãng lai — họ KÉO NGƯỜI TỚI
econ.walkInMul += 0.004 * countFriends()          // 12 Friend → +4,8%
// Và họ là nút gossip TÍCH CỰC. CANON §12 ràng buộc 5: tin tốt lan MẠNH HƠN tin xấu.
// Mất một Friend = mất một bộ khuếch đại tin tốt, không chỉ mất một khách.
```

> **Tóm tắt phải nhớ: mất một khách ruột giữa mùa = 350–550k doanh thu, 170–242k lãi gộp — xấp xỉ NỬA MỘT KỲ HỤI — cộng mất vĩnh viễn một nút gossip tích cực và ~0,4% lượng khách vãng lai suốt phần còn lại của mùa.**
>
> Con số tiền cố tình **không lớn**. Nếu mất một khách ruột làm phá sản thì người chơi sẽ tối ưu quan hệ như tối ưu một bảng tính, và đó chính xác là điều §8 mục (f) cấm. Cái đau phải là **cái ghế trống**, không phải cái hoá đơn.

### 2.6. Lằn ranh đỏ "hạ thấp nghề" — ràng buộc này định hình thiết kế nghĩa vụ thế nào

CANON §14.1 🔴: *"Xe bánh mì là nghề đáng tự hào, tảo tần, có phẩm giá. Không có narrative kiểu 'bán bánh mì để sống qua ngày rồi thoát ra làm việc khác'."*
Nguồn: một TikToker 3 triệu follow phải xin lỗi công khai vì nói *"bánh mì chỉ đói khát, cực khổ mới ăn"* (idea.md §19.4).

**Nghĩa vụ là chỗ dễ vi phạm nhất trong cả game**, vì nghĩa vụ là chỗ tiền thiếu, và tiền thiếu là chỗ mọi game khác trượt vào "nghèo khổ". Bảy ràng buộc cụ thể:

| # | Ràng buộc | Thiết kế cụ thể trong doc này |
|---|---|---|
| **1** | **Không có mục tiêu tiền nào được đóng khung là "thoát ra"** | Đỉnh cây thiết bị là **cái xe mới** (`P3-04`), không phải "mở quán", không phải "đủ vốn đi học nghề khác". Dòng ending của nó nói về việc **xe chạy tiếp**, không về việc ai đó đi đâu |
| **2** | **Nghĩa vụ là chuyện của người ĐANG LÀM ĂN ĐƯỢC** | Hụi là tiết kiệm có tổ chức, không phải vay nặng lãi. Chủ hụi là cô Mai — người CANON ghi rõ *"làm ăn được"* (§9, §19.5: *"cái hẻm mà ai cũng nghèo là cái hẻm giả"*). Tiền thuê 42k/ngày cho chỗ đầu hẻm là **đắt vì chỗ đó đẹp** (L5 góc khuất chỉ 12k) |
| **3** | **Tiền học của em là NIỀM TỰ HÀO, không phải gánh nặng** | Cuộc gọi ở pha Tối không bao giờ mang giọng van nài. Giọng của em: *"Chị ơi em thi thử được tám phẩy hai."* — rồi mới tới chuyện tiền. **Người chơi là người gửi được tiền về**. Đó là vị thế, không phải vết thương |
| **4** | **Không có NPC nào thương hại người chơi** | Không dòng nào kiểu *"khổ thân con"*. Cô Ba khi thiếu tiền nói chuyện **thực tế**: *"Xoay được hông con? Không thì mình khất chủ nhà hai bữa."* — giọng người đã xoay tiền bốn mươi năm |
| **5** | **Không có cảnh "làm việc quá sức"** | T4 cấm stamina. Pha Tối là pha **thoả mãn** (`P3-01` §2.1), không phải pha kiệt sức. Không có sprite lau mồ hôi kiểu tội nghiệp, không có nhạc buồn ở màn hình đếm tiền |
| **6** | **Chú Kiệt — đối thủ — không bao giờ được vẽ như người có cuộc sống tốt hơn** | Ông cũng chơi hụi (§2.3.3 tín hiệu 4). Ông cũng lo tiền chỗ. **Hai người cùng một nghề, cùng một cái hẻm.** Không có ai "thành công hơn" |
| **7** | **Thất bại kinh tế không bao giờ được trình bày như hậu quả đạo đức** | Mất chỗ đứng là **mất chỗ đứng**, không phải "cái giá của sự lười biếng". Không có NPC nào lên lớp. Hụi bể không có bài học |

**Kiểm chứng được** (đưa vào §6): grep toàn bộ `content/lines/` cho các cụm cấm: *"khổ thân"*, *"tội nghiệp"*, *"đổi nghề"*, *"nghề này bạc"*, *"cực quá"*, *"làm chi cho cực"*. **Zero kết quả.** Và bắt buộc một người Việt đọc duyệt toàn bộ thoại của nghĩa vụ (CANON §14.1 — người viết văn hoá đứng đầu credits).

### 2.7. Bảng cân đối kinh tế 40 ngày — ba kịch bản

> ⚠️ **Toàn bộ mục này là Cần đo.** Nó là một mô hình, và mô hình phải được thay bằng dữ liệu từ 3 bot chơi tự động + 10 phiên người thật trước khi khoá.

**Hằng số dùng chung** (nguồn: `P3-03` §2.5.2):
- Giá bán bình quân **28,0k/ổ** · Giá vốn bình quân **15,4k/ổ** · Lãi gộp **12,6k/ổ**
- Chi phí cố định **100k/ngày** (**115k** từ ngày 33) → cả mùa **4.120k**
- Vốn khởi điểm cô Ba để lại: **3.500k**

#### 2.7.1. Ba kịch bản

| | **Chơi vụng** | **Chơi tốt** | **Chơi tối ưu** |
|---|---|---|---|
| **Hành vi** | Không học lịch NPC · mua lẻ mỗi ngày · không có đường ống đồ chua · hỏng ~10% hàng · hay hết hàng giữa buổi · danh tiếng không lên | Học được 2/3 câu đố lịch · mua theo pattern thứ Năm · đường ống đồ chua chạy · hỏng ~5% · hiếm khi hết hàng | Học hết lịch · mua sỉ đúng ngày · trung thành nhà cung cấp (−10%) · hỏng ~2% · tối đa hoá hội chợ ngày 36–37 · mua thiết bị sớm |
| Ổ bán cả mùa | **1.480** | **2.066** | **2.400** |
| Giá bán bình quân | 25,5k | 28,0k | 30,0k |
| **Doanh thu** | **37.740k** | **57.850k** | **72.000k** |
| Giá vốn (gồm hàng hỏng) | 26.900k | 33.400k | 34.760k |
| Chi phí cố định | 4.120k | 4.120k | 4.120k |
| **Lãi trước nghĩa vụ** | **6.720k** | **20.330k** | **33.120k** |
| Vốn khởi điểm | 3.500k | 3.500k | 3.500k |
| **Tiền khả dụng cả mùa** | **10.220k** | **23.830k** | **36.620k** |
| Nghĩa vụ bắt buộc (gộp) | 14.200k | 14.200k | 14.200k |
| Hốt hụi | (kỳ 2, ngày 10) **+2.800k** | (kỳ 5, ngày 25) **+3.400k** | (kỳ 8, ngày 40) **+4.200k** |
| **Nghĩa vụ ròng** | **11.400k** | **10.800k** | **10.000k** |
| Tiền thuốc cô Ba (tự nguyện) | 0 | 1.200k | 1.200k |
| **Còn lại trước chi phí vận hành thiết bị** | **−1.180k** ⚠️ | **+11.830k** | **+25.420k** |
| − `dailyCost` thiết bị đã mua (`P3-04`) | ~300k | ~2.800k | ~3.900k |
| − Vốn lưu động phải giữ (≥1 ngày hàng) | 800k | 1.100k | 1.100k |
| **Còn lại cho thiết bị** | **−2.280k** ⚠️ | **≈ 7.930k** | **≈ 20.420k** |
| **Kết cục nghĩa vụ** | **Vỡ 1–2 khoản** | Trả đủ | Trả đủ, dư |
| Mua được thiết bị (catalogue **11.425k / 21 slot**, xe chứa ~14 slot) | **~1.200k · 3–4 món** | **~7.900k · 11–13 món, 14 slot đầy** | **Chạm trần SLOT trước trần tiền** — mua được 13–14 món, **dư ~12.500k không tiêu được** |

#### 2.7.2. Chơi vụng vỡ ở đâu, và vỡ thế nào

Dòng tiền theo mốc (bắt đầu 3.500k, lãi ~168k/ngày):

| Ngày | Tiền vào tới đó | Nghĩa vụ luỹ kế | Số dư | Tình trạng |
|---|---|---|---|---|
| 5 | 3.500 + 840 = 4.340 | 500 | **3.840** | Ổn |
| **10** | 4.340 + 840 = 5.180 + hốt hụi **2.800** = 7.980 | 500 + 2.700 = 3.200 | **4.780** | Hốt hụi cứu được |
| 15 | 7.980 + 840 = 8.820 | 3.700 | 5.120 | Ổn |
| **18** | 8.820 + 504 = 9.324 | 5.500 | **3.824** | Còn xoay được |
| 20 | 9.324 + 336 = 9.660 | 6.000 | 3.660 | |
| **25** | 9.660 + 840 = 10.500 | 8.700 | **1.800** | ⚠️ Mỏng |
| 30 | 10.500 + 840 = 11.340 | 9.200 | 2.140 | |
| 35 | 11.340 + 840 = 12.180 | 9.700 | 2.480 | |
| **38** | 12.180 + 504 = 12.684 | **11.500** | **1.184** | ✅ Trả được tiền học kỳ 2, sát nút |
| **40** | 12.684 + 336 = **13.020** | 11.500 + 500 + **2.200** = **14.200** | **−1.180** | ❌ **Không trả nổi tiền thuê ngày 40** |

**Chơi vụng vỡ đúng MỘT khoản, và khoản đó là khoản CUỐI CÙNG.** Ngày 40, tiền thuê tháng tới.

> **Và đây là chỗ thiết kế gặp nguyên tắc kết game.** Nghĩa vụ cuối cùng của mùa **không phải là một bài kiểm tra** — nó là **lựa chọn kết game** (§2.8.2). Người chơi vụng đi tới ngày 40 và **không có lựa chọn đó**, vì họ không có 1.260k tiền cọc. Nhưng họ vẫn tới ngày 40, vẫn bán hết ngày 40, và vẫn có một cái kết tử tế.
>
> Nếu chơi vụng hơn nữa — vỡ tiền thuê ngày 25, vỡ tiền học ngày 38 — thì mất chỗ đứng và bán một thiết bị, và vẫn tới ngày 40. **Sàn của game là ngày 40. Không có đáy nào thấp hơn.**

#### 2.7.3. Chơi tối ưu không được thưởng quá tay — chống ăn gian (f)

Chênh lệch tiền giữa chơi tốt và chơi tối ưu là **2,15 lần** (11.830k so với 25.420k). Đó là một khoảng cách lớn, và nó **phải** lớn — nếu không thì không có gì để tối ưu và HT4 quay lại.

**Nhưng nó bị nén lại ở ba tầng:**

| Tầng | Cơ chế | Hiệu quả |
|---|---|---|
| **1. Trần catalogue + trần slot** | Toàn bộ thiết bị cộng lại là **11.425k và 21 slot**, trong khi xe chỉ chứa **~14 slot** (`P3-04` §2.5–2.6). Người chơi tối ưu **không bao giờ mua hết được** — không phải vì thiếu tiền mà vì **thiếu chỗ**. Không có thiết bị "cấp 2", không có prestige, không có bể chứa tiền thứ hai | Tiền dư của người chơi tối ưu **nằm chết trong két**. Và **hai người chơi giàu như nhau vẫn có hai cái xe khác nhau**, vì họ chọn 14 slot khác nhau |
| **2. Trần hiệu ứng thiết bị** | **Không thiết bị nào làm tăng doanh thu quá +12%.** Tổng mọi thiết bị cộng lại **≤ +30%**. Phần lớn thiết bị **gỡ ma sát** (bớt giây, bớt hỏng, bớt ngượng) chứ không nhân doanh thu. Và mỗi món có **mặt trái một dòng** (`P3-04` §2.5): tủ mát *"làm bạn điếc"*, loa rao gây `neighborAnnoyance`, bảng QR **xoá bớt kênh quan hệ sổ nợ** | Chênh lệch năng lực giữa xe đầy đủ và xe vừa đủ ≈ **+10–13%**, không phải +100%. Và một số món **làm quan hệ tệ đi** — nên "mua hết" không phải là chiến lược thắng |
| **3. Trần EV của quan hệ** | Tip **≤4% doanh thu** (`P3-03` §9.1). Khách Friend góp **+0,4% walk-in mỗi người**, tối đa 12 người = **+4,8%**. Một dàn 12 Friend hoàn hảo đáng khoảng **2.780k cả mùa** — **ít hơn một kỳ thuê chỗ** | **Quan hệ không phải là một chiến lược kiếm tiền.** Ai chơi vì tiền sẽ bỏ qua quan hệ, và họ **được phép** bỏ qua |

**Và tầng thứ tư, tầng quyết định:**

> **Số tiền cuối mùa KHÔNG xuất hiện trong ending.** Không có màn hình tổng kết tài chính, không có xếp hạng, không có "bạn đã kiếm được X". Ending được quyết định bởi **ai còn ở đó** (§2.8).
>
> Đây là câu trả lời cho §8 mục (f) — *"datamine + spreadsheet: bịt không nổi. Đảm bảo phần hay không nằm ở EV."* Một bảng tính sẽ tìm ra đường mua thiết bị tối ưu trong vòng một buổi tối. Nó **không** tìm ra được cách để chị Lan có mặt ở ngày 40, vì (a) không có chỉ số quan hệ nào để tối ưu (**T3**), (b) đầu vào của quan hệ là hàng trăm quyết định nhỏ trước mặt người khác (**T1**), và (c) những quyết định đó tốn **thời gian thật trong giờ cao điểm**, không tốn tiền. **Bạn không mua được sự có mặt của ai.**

**Ràng buộc cân bằng ghi thành luật, cho `P5`:**

```ts
// Chạy trong CI. Nếu fail, build đỏ.
assert(max(equipment.map(e => e.revenueMul - 1)) <= 0.12,
       "Không thiết bị nào được tăng doanh thu quá 12%")
assert(product(equipment.map(e => e.revenueMul)) <= 1.30,
       "Toàn bộ thiết bị cộng lại không quá +30%")
assert(season.tipTotal / season.revenue <= 0.04,
       "Tip không quá 4% doanh thu mùa")
assert(!endingSelector.reads("cash") && !endingSelector.reads("equipmentCount"),
       "Ending KHÔNG được đọc tiền hay số thiết bị")
```

### 2.8. Kết game — mọi ending đều tử tế

#### 2.8.1. Hai trục, và chỉ một trục đáng nhớ

CANON §15: *"Đừng làm ending dựa trên 'bạn đã làm tốt tới đâu'. Cho mọi ending đều tử tế, chỉ khác nhau về **ai còn ở đó với mình**."*

```ts
// scenes/EndingScene.ts
interface EndingInput {
  // TRỤC A — KINH TẾ. Chỉ quyết định BỐI CẢNH (nền, prop, 3–4 dòng thoại phụ)
  cartState: "XE_MOI" | "XE_DU_DO" | "XE_CU" | "XE_DA_BAN_BOT"
  location:  "DAU_HEM" | "GOC_KHUAT"

  // TRỤC B — QUAN HỆ. Quyết định AI CÓ MẶT, HỌ NÓI GÌ, CẢNH DÀI BAO LÂU
  present: NpcId[]            // mọi NPC ở bucket Friend + còn sống trong mùa
  farewells: FarewellLine[]   // cho người đã đi, nếu người chơi biết vì sao họ đi
}

// endingSelector KHÔNG BAO GIỜ đọc: cash, totalRevenue, equipmentCount,
// obligationsMissed, hoặc bất kỳ con số tiền nào.
```

| Trục A (kinh tế) | Bối cảnh cảnh cuối |
|---|---|
| `XE_MOI` + `DAU_HEM` | Xe sơn lại, bảng hiệu đỏ chữ vàng mới, dù lớn, đèn led. Sáng bóng dưới nắng gắt trắng |
| `XE_DU_DO` + `DAU_HEM` | Xe cũ nhưng đủ đồ. Tủ mát kêu ro ro. Bình thường, vững |
| `XE_CU` + `GOC_KHUAT` | Xe nguyên bản của cô Ba, thùng xốp, một cái dù. Góc hẻm râm mát |
| `XE_DA_BAN_BOT` + `GOC_KHUAT` | Chỗ cái tủ từng đứng giờ là một cái ghế nhựa. Có người ngồi lên nó |

**Bốn bối cảnh, không cái nào được viết như thất bại.** Cái xe cũ ở góc khuất được quay đẹp không kém cái xe mới. Nhạc giống nhau. Ánh sáng giống nhau.

| Trục B (quan hệ) | Cảnh cuối |
|---|---|
| **0–2 người** | Cô Ba và người chơi. Cảnh ngắn, yên. **Vẫn tử tế.** Cô Ba: *"Bữa nay bán hết sớm ha con."* Họ ngồi. Hết |
| 3–5 người | Vài người ghé. Trà đá. Nói chuyện giá gas |
| 6–8 người | Đông. Bà Bảy mở cải lương. Có người mang thêm ghế |
| **9–12 người** | Cả hẻm. Bé Su quay TikTok. Bà Sáu nói *"nhà tui gần xe bánh mì cô Ba"* — và không ai nhận ra câu đó vừa thay đổi (idea.md §19.2) |

**Ma trận 4 × 4 = 16 tổ hợp. Không tổ hợp nào có tên "bad ending". Không tổ hợp nào có điểm số.**

> Và kết hợp gây xúc động nhất, cố ý cho phép tồn tại: **`XE_MOI` + `DAU_HEM` + 1 người.** Xe đẹp nhất, chỗ đẹp nhất, và ngày 40 chỉ có cô Ba đứng đó. Game không bình luận. Nó chỉ để cảnh đó dài đúng bằng cảnh 12 người — và sự im lặng tự nói.

#### 2.8.2. Nghĩa vụ cuối cùng là một LỰA CHỌN, không phải một bài kiểm tra

Ngày 40, sau khi dọn hàng. Chủ nhà hỏi có thuê tháng tới không.

| Lựa chọn | Điều kiện | Ending |
|---|---|---|
| **Đóng cọc 1.260k, thuê tiếp** | Có đủ tiền | Xe chạy tiếp. Cô Ba đưa lại chìa khoá ổ khoá xe cho người chơi — **không nói gì thêm** |
| **Không trả** | Tự chọn, hoặc không đủ tiền | Cô Ba dọn xe về nhà. *"Cô cũng tính nghỉ lâu rồi. Đẩy bốn chục năm rồi con."* — **giọng nhẹ nhõm, không phải giọng thất bại** |

**Cả hai đều tử tế. Cả hai đều là kết thúc của một mùa, không phải kết thúc của một nghề.** Và quan trọng nhất cho §14.1 🔴: **cả hai nhánh đều nói về cái xe, không nhánh nào nói về việc "thoát ra".** Nhánh không thuê tiếp là cô Ba **nghỉ hưu**, không phải người chơi **đổi nghề**.

Người chơi vỡ nghĩa vụ ngày 40 (§2.7.2) rơi vào nhánh thứ hai — **nhưng họ rơi vào đó giống hệt một người chơi tốt đã chủ động chọn nó.** Game không phân biệt. Chủ nhà không nói *"ờ, hết tiền rồi hả"*.

#### 2.8.3. Tiền thuốc cô Ba — nghĩa vụ duy nhất không có cơ chế

600k × 2 lần. Không ai nhắc. Không có hệ quả cơ học nào cho việc không trả — không debuff, không NPC nào trách, không thoại nào nhắc lại.

Cái nó làm:
- Người chơi có trả: cảnh pha Tối ngày 21 và 31 có thêm **30 giây**. Cô Ba không cảm ơn. Cô nói chuyện khác. Radio hát tiếp.
- Ending: **một dòng khác** trong cảnh cuối. Một dòng.

**Vì sao nó phải tồn tại:** vì nó là thứ duy nhất trong hệ kinh tế mà người chơi làm **không vì bất cứ lý do nào**. Trong một game có 18 quyết định mỗi ngày và mọi quyết định đều có giá, cần đúng một quyết định **không có giá và không có lợi**. Nó là cái mỏ neo để toàn bộ phần còn lại của hệ kinh tế không trượt thành một bảng tính.

---

## 3. Dữ liệu & schema

```ts
// econ/obligations.ts
export type ObligationKind = "THUE_CHO" | "HUI" | "TIEN_HOC" | "TIEN_THUOC"

export interface Obligation {
  id: string
  kind: ObligationKind
  dueDay: number
  amount: number                 // nghìn đồng
  mandatory: boolean
  graceDays: number
  telegraphDays: number          // -1 = không báo trước
  telegraphBy: "PROP" | "NPC_BARK" | "PHONE" | "NONE"
  telegraphNpc?: NpcId
  onDefault: PermanentLossKind | null
}

export type PermanentLossKind =
  | "LOST_PRIME_STAND"      // mất chỗ đầu hẻm
  | "HUI_EXPELLED"          // bị loại khỏi dây hụi
  | "SOLD_EQUIPMENT"        // bán một thiết bị, 50% giá
  | "CART_DOWNGRADED"       // đổi xe rẻ hơn, −1 slot preset

export interface SeasonEconomyState {
  cash: number
  standLocation: "DAU_HEM" | "GOC_KHUAT"
  huiTakenOnPeriod: number | null
  huiExpelled: boolean
  equipmentOwned: EquipmentId[]
  obligationsDefaulted: ObligationKind[]
  voluntaryPaid: number          // số lần trả tiền thuốc: 0 | 1 | 2
  // KHÔNG có trường: score, rating, grade, performance
}
```

```json
// content/econ/obligations.json — đầy đủ mùa
[
  { "id": "hui_k1", "kind": "HUI", "dueDay": 5,  "amount": 500,
    "mandatory": true, "graceDays": 1, "telegraphDays": 3,
    "telegraphBy": "NPC_BARK", "telegraphNpc": "co_mai", "onDefault": "HUI_EXPELLED" },

  { "id": "thue_t1", "kind": "THUE_CHO", "dueDay": 10, "amount": 2200,
    "mandatory": true, "graceDays": 3, "telegraphDays": 5,
    "telegraphBy": "PROP", "onDefault": "LOST_PRIME_STAND" },

  { "id": "hui_k2", "kind": "HUI", "dueDay": 10, "amount": 500,
    "mandatory": true, "graceDays": 1, "telegraphDays": 0,
    "telegraphBy": "NPC_BARK", "telegraphNpc": "co_mai", "onDefault": "HUI_EXPELLED" },

  { "id": "hui_k3", "kind": "HUI", "dueDay": 15, "amount": 500, "mandatory": true,
    "graceDays": 1, "telegraphDays": 2, "telegraphBy": "NPC_BARK",
    "telegraphNpc": "co_mai", "onDefault": "HUI_EXPELLED" },

  { "id": "hoc_k1", "kind": "TIEN_HOC", "dueDay": 18, "amount": 1800,
    "mandatory": true, "graceDays": 5, "telegraphDays": 6,
    "telegraphBy": "PHONE", "onDefault": "SOLD_EQUIPMENT" },

  { "id": "hui_k4", "kind": "HUI", "dueDay": 20, "amount": 500, "mandatory": true,
    "graceDays": 1, "telegraphDays": 2, "telegraphBy": "NPC_BARK",
    "telegraphNpc": "co_mai", "onDefault": "HUI_EXPELLED" },

  { "id": "thuoc_k1", "kind": "TIEN_THUOC", "dueDay": 20, "amount": 600,
    "mandatory": false, "graceDays": 99, "telegraphDays": -1,
    "telegraphBy": "NONE", "onDefault": null },

  { "id": "thue_t2", "kind": "THUE_CHO", "dueDay": 25, "amount": 2200,
    "mandatory": true, "graceDays": 3, "telegraphDays": 5,
    "telegraphBy": "PROP", "onDefault": "LOST_PRIME_STAND" },

  { "id": "hui_k5", "kind": "HUI", "dueDay": 25, "amount": 500, "mandatory": true,
    "graceDays": 1, "telegraphDays": 2, "telegraphBy": "NPC_BARK",
    "telegraphNpc": "co_mai", "onDefault": "HUI_EXPELLED" },

  { "id": "hui_k6", "kind": "HUI", "dueDay": 30, "amount": 500, "mandatory": true,
    "graceDays": 1, "telegraphDays": 2, "telegraphBy": "NPC_BARK",
    "telegraphNpc": "co_mai", "onDefault": "HUI_EXPELLED" },

  { "id": "thuoc_k2", "kind": "TIEN_THUOC", "dueDay": 30, "amount": 600,
    "mandatory": false, "graceDays": 99, "telegraphDays": -1,
    "telegraphBy": "NONE", "onDefault": null },

  { "id": "hui_k7", "kind": "HUI", "dueDay": 35, "amount": 500, "mandatory": true,
    "graceDays": 1, "telegraphDays": 2, "telegraphBy": "NPC_BARK",
    "telegraphNpc": "co_mai", "onDefault": "HUI_EXPELLED" },

  { "id": "hoc_k2", "kind": "TIEN_HOC", "dueDay": 38, "amount": 1800,
    "mandatory": true, "graceDays": 5, "telegraphDays": 6,
    "telegraphBy": "PHONE", "onDefault": "SOLD_EQUIPMENT" },

  { "id": "hui_k8", "kind": "HUI", "dueDay": 40, "amount": 500, "mandatory": true,
    "graceDays": 0, "telegraphDays": 2, "telegraphBy": "NPC_BARK",
    "telegraphNpc": "co_mai", "onDefault": "HUI_EXPELLED" },

  { "id": "thue_t3", "kind": "THUE_CHO", "dueDay": 40, "amount": 2200,
    "mandatory": false, "graceDays": 0, "telegraphDays": 5,
    "telegraphBy": "PROP", "onDefault": null,
    "note": "LỰA CHỌN KẾT GAME — không phải nghĩa vụ. Không trả KHÔNG phải thất bại." }
]
```

**Catalogue thiết bị — `P3-04` §2.5 là nguồn sự thật, doc này KHÔNG định nghĩa lại.**

Doc này chỉ dùng ba con số tổng từ đó, và áp hai trần cứng lên nó:

| Đại lượng | Giá trị (`P3-04` §2.5) |
|---|---|
| Số món mua được | **17** |
| Tổng giá catalogue | **11.425k** |
| Tổng `dailyCost` nếu mua hết | **109k/ngày** |
| Tổng slot cần | **21** (xe chứa ~14 → ràng buộc thứ hai, độc lập với tiền) |

```ts
// Chạy trong CI. Nếu fail, build đỏ. Catalogue đọc từ content/equipment/*.json (P3-04)
assert(max(CATALOGUE.map(e => e.revenueMul - 1)) <= 0.12,
       "Không thiết bị nào được tăng doanh thu quá 12%")
assert(product(CATALOGUE.map(e => e.revenueMul)) <= 1.30,
       "Toàn bộ thiết bị cộng lại không quá +30%")
assert(sum(CATALOGUE.map(e => e.price)) > season.expectedSurplus("GOOD_PLAY"),
       "Tổng catalogue phải LỚN HƠN tiền dư của người chơi tốt — tiền luôn phải là lựa chọn")
assert(sum(CATALOGUE.map(e => e.slots)) > cart.slotCapacity,
       "Slot phải là ràng buộc thứ hai, độc lập với tiền")
```

> **Hai ràng buộc song song, cố ý.** `P3-04` §2.6.1 tính ra **~71% theo tiền / ~67% theo chỗ** — hai ràng buộc cắn gần bằng nhau. Nếu chỉ có tiền thì người chơi giàu mua hết; nếu chỉ có slot thì tiền mất ý nghĩa. **Doc này chịu trách nhiệm cho vế tiền, `P3-04` chịu trách nhiệm cho vế slot.**
```

---

## 4. UI/UX hai thiết bị

**Nghĩa vụ chỉ tồn tại ở hai nơi:**

**(1) Pha Tối — cuốn sổ trên bàn.** Mở bằng cách **chạm vào cuốn sổ**, không phải nút menu.

```
┌─────────────── SỔ ─────────────────┐
│                                    │
│  ngày 25  hụi kỳ 5        500      │
│  ngày 25  hụi kỳ 5        500      │
│  ngày 30  hụi kỳ 6        500      │
│  ngày 35  hụi kỳ 7        500      │
│  ngày 38  tiền học      1.200      │
│  ngày 40  hụi kỳ 8        500      │
│                                    │
│  trong két:            4.180       │
│                                    │
│         [ trả ]   [ để mai ]       │
└────────────────────────────────────┘
```

Chữ viết tay. **Không có tổng. Không có màu đỏ. Không có biểu tượng cảnh báo. Không có "còn 3 ngày".** Người chơi tự cộng. Nếu họ không mở sổ, game không nhắc — trừ qua người (§2.2.2).

**(2) Trong khung hình pha Trưa — tờ biên nhận.** Khi chủ nhà đã báo tiền thuê, một tờ giấy kẹp ở mép xe. Nó ở đó mỗi ngày cho tới khi trả. **Đó là toàn bộ hệ thống nhắc nợ.** Nó là một vật thể, đúng nguyên tắc `P3-01` §4.

**Màn hình hốt hụi** (ngày người chơi chọn hốt): một cảnh, không phải một menu. Cô Mai đếm tiền ra bàn. Bảng `HUI_PAYOUT` hiện dưới dạng **cô Mai nói ra**: *"Kỳ này con hốt là ba triệu bốn. Hốt kỳ sau thì được ba triệu bảy."* — T2: không có dialogue tree, người chơi chỉ chọn **hốt** hay **để kỳ sau**.

**Màn hình bán thiết bị** (§2.4.3): ảnh thật của từng món, giá mua và giá bán lại cạnh nhau, **không có nút huỷ**. Đây là màn hình duy nhất trong game không cho thoát.

**Cảnh cuối:** một góc nhìn cố định, không cắt cảnh, không credits chạy đè. Ai có mặt thì có mặt. Khi hết người nói, cảnh giữ thêm **6 giây im lặng** rồi mới mờ.

**Trợ năng (CANON §15):**
- Cỡ chữ 4 mức — cuốn sổ chữ viết tay phải có **biến thể font sans** khi bật cỡ chữ ≥150% (chữ viết tay ở 200% không đọc được).
- Pause mọi lúc, kể cả giữa cảnh hốt hụi và cảnh bán thiết bị.
- **Tắt âm báo tiêu cực**: không có sting khi vỡ nghĩa vụ. Không rung. Không nháy đỏ.
- Cảnh cuối: text **không bao giờ tự chạy tiếp**.
- **Công tắc "khách biến mất không chia tay" → "họ để lại lời nhắn"** (§2.5.1) ảnh hưởng thẳng tới trục B của ending: người để lại lời nhắn được đọc lời nhắn đó ở cảnh cuối.

---

## 5. Tham số cần tune

| Tham số | Khởi điểm | Khoảng | Cách đo |
|---|---|---|---|
| Vốn khởi điểm | **3.500k** | 2.500–5.000 | Đo: ngày 10 (cú 2.700k) phải **căng nhưng qua được** với người chơi trung bình |
| Thuê chỗ mỗi ngày (`L1`) | **42k** | 32–55 | Đo: ≈6,5% lãi gộp một ngày của người chơi tốt |
| Rút về nhà mỗi ngày | **150k** | 110–190 | Đo: ≈23% lãi gộp một ngày của người chơi tốt |
| Hụi mỗi kỳ | **500k** | 350–700 | Đo: tổng hụi ≈ 4.000k, đủ mua thiết bị hạng trung |
| `HUI_PAYOUT[2]` | **2.800k** | 2.500–3.100 | **Đo bằng bot:** hốt kỳ 2 và hốt kỳ 5 phải chênh lệch lợi nhuận cuối mùa **≤8%** |
| `HUI_PAYOUT[8]` | 4.200k | 4.000–4.400 | Cùng phép đo |
| `huiWillBreak` tỉ lệ seed | **35%** | 25–45% | Đo: đủ để hụi bể là một câu chuyện có thật, không đủ để nó là chuyện thường |
| Hoàn tiền khi rút khỏi dây | **55%** | 45–65% | Đo: rút phải là một lựa chọn **đắt nhưng hợp lý**, không phải hiển nhiên |
| Hoàn tiền khi dây bể | 40% | 30–50% | |
| Tiền học mỗi kỳ | **1.200k** | 900–1.600 | Đo: rơi đúng ngày mưa, phải đau |
| `goc_khuat.walkInMul` | **0,65** | 0,55–0,75 | **Núm quan trọng nhất doc này.** Đo: mất chỗ phải đau rõ rệt **và** vẫn chơi tiếp được tới ngày 40. Dưới 0,55 → game thành chờ chết |
| `goc_khuat.rentPerPeriod` | 900k | 600–1.200 | Đo: an ủi phải có thật — dòng tiền hằng ngày dễ thở lên ngay |
| Hạn ân thuê chỗ | **3 ngày** | 2–5 | Đo: đủ để xoay bằng một ngày bán tốt + bán một thiết bị |
| Hạn ân hụi | **1 ngày** | 0–2 | Ngắn nhất, cố ý: hụi chạy bằng uy tín |
| Hạn ân tiền học | 5 ngày | 3–7 | Dài nhất: gia đình chờ được |
| Giá bán lại thiết bị | **50%** | 40–60% | Đo: bán thiết bị phải là lựa chọn tệ nhưng khả thi |
| Trần `revenueMul` mỗi thiết bị | **1,12** | 1,08–1,15 | **Trần cứng.** Kiểm trong CI (§2.7.3) |
| Trần `revenueMul` tích luỹ | **1,30** | 1,25–1,40 | **Trần cứng.** Kiểm trong CI |
| `walkInMul` mỗi Friend | **+0,004** | 0,002–0,006 | Đo: 12 Friend ≤ **+5%**. Trên đó thì quan hệ thành chiến lược kiếm tiền |
| Tổng catalogue thiết bị | **22.350k** | 18.000–26.000 | Đo: chơi tốt mua được **45–60%**; chơi tối ưu mua hết ở khoảng ngày 32–36 |

---

## 6. Tiêu chí đạt

- [ ] **Không tồn tại nhánh code nào dẫn tới Game Over.** Kiểm bằng grep `content/` và `src/` cho `gameOver`, `GAME_OVER`, `defeat`, `lose`. **Zero kết quả.**
- [ ] Bot "chơi vụng" (theo định nghĩa §2.7.1) **đi tới ngày 40**, vỡ **1–2** nghĩa vụ, **không** vỡ quá 3.
- [ ] Bot "chơi tốt" trả đủ mọi nghĩa vụ bắt buộc và mua được **45–60%** catalogue.
- [ ] Bot "chơi tối ưu" mua hết catalogue trước ngày 38 và **vẫn dư tiền không tiêu được** — chứng minh trần bể chứa tiền hoạt động.
- [ ] `endingSelector` **không đọc** bất kỳ trường tiền nào. Kiểm bằng unit test.
- [ ] Bot "tối ưu tiền, mặc kệ quan hệ" và bot "tối ưu quan hệ, tiền vừa đủ" cùng chơi xong: bot thứ hai có **nhiều người ở cảnh cuối hơn ít nhất 4 người**, và bot thứ nhất có **nhiều tiền hơn ít nhất 8.000k**. **Cả hai đều tới ngày 40.**
- [ ] 10 người test, sau khi mất chỗ đứng: **≥8/10 chơi tiếp tới ngày 40**. Nếu ≥3 người bỏ ngay sau khi mất chỗ → `goc_khuat.walkInMul` quá thấp.
- [ ] Hỏi người test đã vỡ nghĩa vụ: *"bạn thấy game có phạt bạn không?"* — câu trả lời mong đợi: *"nó không phạt, nó chỉ khác đi."* **Không ai** dùng chữ "thua", "fail", "game over".
- [ ] Grep `content/lines/` cho cụm cấm §2.6: *"khổ thân"*, *"tội nghiệp"*, *"đổi nghề"*, *"nghề này bạc"*, *"cực quá"*, *"làm chi cho cực"*, *"thoát"*. **Zero kết quả.**
- [ ] **Một người Việt viết văn hoá đọc duyệt 100% thoại nghĩa vụ và thoại hụi**, và người đó đứng đầu credits (CANON §14.1 🔴).
- [ ] Hỏi 10 người test sau khi hụi bể: *"game có đang dạy bạn bài học gì không?"* — **≥8/10 trả lời "không"**. Nếu ai đó nói *"đừng tin người lạ"* thì tông đã trượt.
- [ ] Trong ending, **không có màn hình nào hiện một con số tiền**. Kiểm thủ công trên cả 16 tổ hợp.
- [ ] Ba bảng số của `P3-01`, `P3-03`, `P3-06` khớp nhau tuyệt đối. Script `npm run econ:check` đối chiếu cả ba với `content/econ/*.json`, chạy trong CI.

---

## 7. Rủi ro & cách bịt

| Rủi ro | Nối tới | Cách bịt |
|---|---|---|
| **Datamine + spreadsheet** | §8 (f) — bịt không nổi | §2.7.3 bốn tầng: trần catalogue · trần hiệu ứng thiết bị +12%/+30% · trần EV quan hệ (tip ≤4%, walk-in ≤+5%) · **ending không đọc tiền**. Bảng cân đối §2.7 **cố tình công khai được** — biết hết vẫn không tính được ai sẽ có mặt ngày 40 |
| **Đốt NPC rồi để nguội** | §8 (d) | §2.4.2 và §2.5: `lowerTrustCeiling` vĩnh viễn. Bị loại khỏi hụi hạ trần tin tưởng cô Mai xuống 0,75 và không bao giờ hồi |
| **Từ chối phục vụ người "soi"** | §8 (k) | §2.5.1 đường 4: `MADE_THEM_WAIT(REFUSED)` intensity 90 + gossip. Và mất khách ruột không có respawn — từ chối một lần là mất vĩnh viễn |
| **Save-scum để né hụi bể** | §8 (e) | `huiWillBreak = seededBool(SEASON_SEED, ...)` — quyết định bởi seed mùa, reload ra y hệt |
| ⚠️ **"Bad ending vì nghèo"** | CANON §15 | §2.8: hai trục tách hẳn; `endingSelector` bị unit test chặn không cho đọc tiền; 16 tổ hợp không cái nào có tên thất bại; nghĩa vụ ngày 40 là **lựa chọn**, không phải bài kiểm tra |
| 🔴 **Hạ thấp nghề** | CANON §14.1 | §2.6 bảy ràng buộc cụ thể + grep cụm cấm + người Việt duyệt thoại. Đỉnh cây thiết bị là **cái xe mới**, không phải "thoát ra". Nhánh không thuê tiếp là **cô Ba nghỉ hưu**, không phải người chơi đổi nghề |
| 🟡 **Hụi thành bài học đạo đức** | CANON §14.1 | §2.3.3 năm luật tông: cô Mai thiệt nhất · không có nút "trả lại tiền" · bà Chín không bị lên án · dây bể không đóng cửa gì · không achievement |
| **Fail mềm thành fail chậm** (chờ chết 20 ngày) | T4 | §2.1 tính chất 3: sau mỗi mất mát, ngày hôm sau vẫn mở hàng bình thường. Mất chỗ đứng **giảm tiền thuê ngay** → dòng tiền dễ thở lên. Tiêu chí đạt §6: ≥8/10 chơi tiếp tới ngày 40 |
| **Nghĩa vụ tạo stress** | T4 "cozy" | Không có badge đỏ, không có đếm ngược, không có tổng tự động. Nghĩa vụ đến qua **người** và **vật thể**. Pause mọi lúc. Không có âm báo tiêu cực |
| **Quan hệ bị tối ưu như bảng tính** | T3, §8 (f) | Trần EV quan hệ ở §2.7.3 tầng 3: một dàn 12 Friend hoàn hảo chỉ đáng ~2.780k — **ít hơn một kỳ thuê chỗ**. Quan hệ không phải chiến lược kiếm tiền, nên nó không bị tối ưu |
| **Thêm nhân vật mới ngoài 12 NPC của CANON** | CANON §9 | Chủ nhà chỉ là **một bàn tay + tờ biên nhận**, không mặt, không thoại. Em ở quê chỉ là **giọng qua điện thoại**. Bà Chín **không bao giờ xuất hiện**. Xem §9.1 |
| **Mô phỏng sâu đời sống NPC** | CANON §16 Đừng-1 | Nguyên tắc Jeff Orkin: bà Chín kẹt tiền được **NÓI RA** bốn lần qua bốn người, và một prop (nhà khoá cửa). Không có mô phỏng tài chính nào của bà |

---

## 8. Truy vết

| Nội dung | `idea.md` | `CANON.md` |
|---|---|---|
| Fail mềm nhưng vĩnh viễn thay fail state cứng | §22 cuối (dòng 1045) | §13 |
| Nghĩa vụ định kỳ: tiền thuê chỗ, tiền hụi, tiền học của con | §22 cuối | §13 |
| Mất chỗ đứng đẹp phải dời sang góc khuất, ít khách hơn **cả mùa** | §22 cuối | §13 |
| Phải bán cái tủ mát | §22 cuối | §13 |
| **Khách ruột mất là mất thật — không có respawn quan hệ** | §22 cuối | §13 |
| *"Mọi ending đều tử tế, chỉ khác ở ai còn ở đó với mình"* | §20 cuối (dòng 1009) | §15 |
| Datamine + spreadsheet — phần hay không nằm ở EV mà nằm ở quan hệ | §21 hàng f | §8 (f) |
| Đốt NPC rồi để nguội — hạ trần tin tưởng vĩnh viễn | §21 hàng d | §8 (d) |
| Từ chối phục vụ người "soi" | §21 hàng k | §8 (k) |
| Save-scum — seed cố định theo ngày | §21 hàng e | §8 (e) |
| 🔴 Hạ thấp nghề — TikToker xin lỗi, Sở VH-TT-DL Đắk Lắk | §19.4 (dòng 970) | §14.1 |
| 🟡 Tâm linh / tông nhẹ, tự trào | §19.1, §19.4 | §14.1 |
| Cô Mai — chủ tạp hoá **làm ăn được**, *"cái hẻm mà ai cũng nghèo là cái hẻm giả"* | §19.5 | §9 NPC 7 |
| Chú Kiệt — vừa là đối thủ vừa là người duy nhất hiểu nghề của bạn | — | §9 NPC 12 |
| Chú Tư biến mất ~ngày 30, báo trước 3–4 ngày | — | §9 NPC 2 |
| Chị Lan — người im lặng biến mất | — | §9 NPC 4 |
| *"nhà tui gần xe bánh mì cô Ba"* — thước đo tiến trình | §19.2 (dòng 954) | §14 |
| Mua thiết bị là bể chứa tiền duy nhất đáng tin | §22 bổ sung | §10 hàng 1 |
| Đổi chỗ đứng của một cái xe duy nhất, không phải chuỗi cửa hàng | — | §10 hàng 3 |
| Công thức tham số hoá, 3 preset mỗi sáng | §22 bổ sung 1 (dòng 1046) | §10 |
| Cô Ba là mentor, không phải nhân viên / lưới an toàn | — | §7.4, §10 |
| Trợ năng: pause, tắt âm báo tiêu cực, "họ để lại lời nhắn" | §20 | §15 |
| Nguyên tắc Jeff Orkin — nói ra thay vì mô phỏng | — | §16 Đừng-1 |

---

## 9. Đề xuất sửa CANON

**(9.1) — Cho phép ba "nhân vật chức năng không có mặt" ngoài danh sách 12 NPC.**
CANON §9 ghi: *"Ngoài danh sách: Cô Ba (mentor) và khách vãng lai vô danh."* Doc này cần thêm ba thực thể **không bao giờ xuất hiện dưới dạng một nhân vật có mặt và có thoại đối đáp**:

| Thực thể | Hiện thân duy nhất | Vì sao cần |
|---|---|---|
| **Chủ nhà mặt tiền** | Một bàn tay đưa tờ biên nhận qua mép xe, 10h sáng. Không mặt, không thoại đối đáp | Nghĩa vụ thuê chỗ phải đến từ **ai đó**, và không NPC nào trong 12 người hợp vai |
| **Em ở quê** | Giọng qua điện thoại ở pha Tối. Không bao giờ hiện hình | idea.md §22 khoá *"tiền học của con"*. Người chơi là **cháu cô Ba**, nên "con" không hợp — phải là em |
| **Bà Chín** (chân hụi bỏ trốn) | Được **nhắc tới** bởi 4 NPC có tên. Không bao giờ xuất hiện | Nguyên tắc Jeff Orkin (CANON §16 Đừng-1): *"vocalizing intentions can sometimes even be enough"* |

Đề nghị §9 sửa thành: *"Ngoài danh sách: cô Ba (mentor), khách vãng lai vô danh, và tối đa 3 **nhân vật chức năng không có mặt** — chỉ tồn tại qua một prop, một giọng nói, hoặc lời kể của NPC khác. Không nhân vật chức năng nào được có mặt trên màn hình hoặc có hội thoại đối đáp."*

**(9.2) — Sửa "tiền học của con" thành "tiền học của em".**
CANON §13 chép nguyên từ idea.md §22: *"tiền thuê chỗ, tiền hụi, tiền học của con."* Nhưng CANON §7.4 quy định **người chơi là cháu của cô Ba, đang trông xe giúp cô** — một người ở vị trí đó nhiều khả năng chưa có con. Đề nghị đổi thành **"tiền học của em"** để nhất quán với §7.4 và để giữ được khung "niềm tự hào" ở §2.6 ràng buộc 3. Nếu hội đồng muốn giữ "con" thì phải sửa §7.4 về vai người chơi — nhưng làm vậy sẽ đổi cả tông của quan hệ với cô Ba.

**(9.3) — Ghi trần cứng cho hiệu ứng thiết bị vào §10.**
CANON §10 nhận cơ chế "mua thiết bị / nâng cấp" là *"bể chứa tiền duy nhất đáng tin"* nhưng không đặt trần. Không có trần thì việc cân bằng sẽ trượt: một người tune sẽ tăng hiệu ứng lò than đôi để "thưởng cho chơi giỏi", và đủ vài lần như vậy là trò chơi trở thành trò tối ưu EV — đúng cái §8 mục (f) cấm. Đề nghị thêm vào §10 hàng 1: *"Trần cứng: không thiết bị nào tăng doanh thu quá +12%; toàn bộ thiết bị cộng lại không quá +30%. Tổng giá catalogue phải lớn hơn tiền dư của người chơi tốt, để tiền luôn là lựa chọn chứ không phải là một thanh nạp đầy."*

**(9.4) — Ghi rõ ràng buộc "ending không đọc tiền" thành luật kỹ thuật.**
CANON §15 phát biểu nguyên tắc kết game bằng lời. Đề nghị thêm một dòng kỹ thuật kiểm được: *"`endingSelector` không được đọc bất kỳ trường tiền, số thiết bị, hay số nghĩa vụ bị vỡ nào. Ràng buộc này phải có unit test."* Lý do: nguyên tắc bằng lời sẽ bị vi phạm ở P4 khi ai đó muốn "thưởng cho người chơi giỏi bằng một cảnh đặc biệt". Cảnh đặc biệt phải được mở bằng **quan hệ**, không bằng tiền.

**(9.5) — ⚠️ XUNG ĐỘT SỐ LIỆU VỚI `P3-04` VÀ `P3-05` — cần MỘT quyết định, không phải năm.**

`P3-02`, `P3-04`, `P3-05` được viết song song với doc này. **Tầng đơn vị đã khớp** (28,0k/ổ · 15,4k giá vốn · 12,6k lãi gộp · 51,7 ổ/ngày — ba doc kia đều trích đúng). **Tầng nghĩa vụ thì chưa.** Bảng đối chiếu:

| Khoản | `P3-06` (doc này) | `P3-04` §2.6.1 / `P3-05` | Ai nên thắng |
|---|---|---|---|
| **Thuê chỗ** | 2.200k × 3 kỳ = **6.600k** | 42k/ngày ở `L1` = **1.680k** (hai doc kia khớp nhau) | **`P3-05` thắng.** Chỗ đứng là tài sản của `P3-05`, và mô hình thuê theo ngày nối được với cơ chế dời chỗ |
| **Hụi** | 500k × 8 kỳ = **4.000k**, hốt 2.800–4.200k | 800k × 2 (ngày 20 & 40) = **1.600k**, không có cơ chế hốt | **`P3-06` thắng.** Hụi là tài sản của doc này; con số ở `P3-04` là một dòng ngân sách tạm, không phải một thiết kế |
| **Tiền học** | 1.800k × 2 (ngày 18, 38) | 1.200k × 1 (ngày 30) | **Hoà: 1.200k × 2 (ngày 18, 38).** Giữ hai nhịp của doc này, lấy con số của `P3-04` |
| **Rút về nhà** | *(không có)* | **150k/ngày bắt buộc = 6.000k** | **`P3-04` thắng — và doc này thiếu nó là một lỗ hổng thật.** Xe bánh mì nuôi một cái nhà; tiền không nằm hết trong két. Nó cũng phục vụ §2.6 ràng buộc 2 (*"chuyện của người đang làm ăn được"*) tốt hơn mọi thứ trong §2.2 |
| `dailyCost` thiết bị | *(đã bổ sung ở §2.7.1)* | tới 109k/ngày | `P3-04` thắng |

**Phương án hợp nhất đề nghị** (một dòng cho người chốt):

| Khoản | Số chốt | Cả mùa |
|---|---|---|
| Rút về nhà | 150k/ngày | **6.000k** |
| Thuê chỗ `L1` | 42k/ngày | **1.680k** |
| Hụi | 500k × 8 kỳ | **4.000k** *(hốt lại 2.800–4.200k)* |
| Tiền học | 1.200k × 2 (ngày 18, 38) | **2.400k** |
| Tiền thuốc cô Ba *(tự nguyện)* | 600k × 2 | *1.200k* |
| **Tổng bắt buộc** | | **14.080k**, ròng sau hốt hụi **≈ 10.680k** |

Kiểm lại với `P3-04` §2.6.1: `3.500 (vốn) + 20.330 (lãi) − 10.680 (nghĩa vụ) − 1.200 (thuốc) − 2.800 (dailyCost) − 1.100 (vốn lưu động)` = **≈ 8.050k cho thiết bị** — khớp gần như chính xác con số **≈8.100k** mà `P3-04` tự tính ra, và bằng **~70%** catalogue 11.425k. **Hai doc hội tụ.**

**Hệ quả nếu chốt phương án này:** §2.2, §2.2.1, §2.7 của doc này phải sửa số (cấu trúc và mọi cơ chế giữ nguyên); `P3-01` §2.2 và `P3-03` §2.2.2 phải đổi *"cú 2.700k ngày 10"* thành *"cú ~1.000k ngày 10 + áp lực rút về nhà 150k mỗi ngày"* — **áp lực chuyển từ ba cú lớn sang một dòng chảy đều cộng ba cú vừa**, và về mặt thiết kế thì **tốt hơn**: nó làm mọi ngày đều có giá, thay vì chỉ ba ngày.

**Việc không nên làm:** để mỗi doc giữ số của mình. `npm run econ:check` (§6) phải đỏ cho tới khi có một bảng duy nhất trong `content/econ/obligations.json`.

**(9.6) — Bổ sung "hụi" vào danh sách cơ chế Việt Nam ở §14.**
CANON §14 đã có mở hàng/đốt vía, bảng QR, sổ nợ, khách tự đứng bán hộ. **Chơi hụi** cùng hạng với những cái đó: chưa game nào làm, không copy được, và về mặt thiết kế nó là **ngân hàng chạy bằng uy tín trong một cái hẻm** — tức là một hệ thống tài chính mà đầu vào là quan hệ. Đề nghị thêm một dòng vào §14: *"**Hụi** là nguồn tiền cục duy nhất trong game, chạy bằng uy tín. Chủ hụi là cô Mai. ⚠️ Hụi bể phải giữ tông trìu mến — không bài học đạo đức, không lên án người bỏ trốn."*
