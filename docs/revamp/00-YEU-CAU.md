# REVAMP — Yêu cầu gốc (bản viết lại)

> Đây là **đề bài**, không phải bản thiết kế. Viết lại từ prompt thô của chủ dự án để plan từng phase.
> Quy mô: đập phần lớn game cũ, sửa cả `CANON.md`.

---

## ⚠️ Lưu ý bắt buộc khi triển khai

**1. Mọi con số trong file này chỉ là ước tính — không dùng thẳng.**
Khi triển khai phải chạy agent **tính toán + mô phỏng thật** để cân bằng game. Áp dụng cho:
- Số tiền: giá bánh, giá topping, giá nguyên liệu, mốc thắng 50tr.
- 3 mốc giá mỗi loại bánh và các `%` đi kèm (được 4–5★, bỏ đi, bị chê giá).
- Thứ tự và ngày mở khoá topping (kể cả mốc "ngày 10 mở hết").
- Xác suất đau bụng từng nguyên liệu.
- Ngưỡng game over: sao trung bình + số review xấu tối thiểu.
- Hệ số `R`, nhiễu `ε`, công thức số khách.

Kết quả phải ra **bảng số + công thức + bằng chứng mô phỏng** (thời gian tới 50tr, tỉ lệ thua, chiến lược nào thống trị). Số nào lệch thì sửa, không giữ vì "đề bài ghi vậy".

**2. Review và lời thoại phải research văn phong thật.**
Trước khi viết nội dung, research cách người Việt comment thật trên **TikTok, Facebook, Google Maps, ShopeeFood/GrabFood**: dataset công khai (vd. bộ review tiếng Việt, comment mạng xã hội) + bài viết/thread thật.
Rút ra: từ lóng, viết tắt, teencode, emoji, câu cụt không chủ ngữ, kiểu cà khịa, kiểu khen/chê lẫn lộn. **Ưu tiên văn phong đó** cho review và hội thoại. Không tự bịa giọng.

---

## 0. Tinh thần

Game **kinh doanh hiện đại**, không hoài cổ. Số liệu minh bạch, người chơi tự quyết giá — chất lượng — nguồn hàng, và chịu hậu quả qua **đánh giá sao**.

Ba thứ bỏ hẳn:
- Hệ **cảm tình** (quan hệ ngầm với khách).
- **Order "như bữa hôm qua"**.
- Giới hạn **40 ngày**.

Một thứ thay thế tất cả: **sao và review**.

---

## 1. Phase 0 — Canon & hạ tầng

**T0.1 — Sửa CANON.** Bỏ T3 (giấu chỉ số quan hệ) và T4 (mùa 40 ngày). Thêm trụ mới: *sao là chỉ số công khai duy nhất*. Rà các doc phase cũ, đánh dấu phần chết.

**T0.2 — Bổ sung `.claude/`.** ✅ Đã làm: `.claude/CLAUDE.md` (luật plan, kiểm bằng mắt cho 3D + UI) và skill `research-giong-viet`.

---

## 1a. Phase 0.1 — Dọn code chết

> Làm ngay sau Phase 0, trước Phase 0.5. Mục tiêu: game **đơn giản lại**, các phase sau xây trên nền sạch.

**T0.1.1 — Gỡ hẳn hệ đã chết.** Xoá module, content, test, trường save, UI, event, telemetry của mọi thứ CANON đánh ☠️:

| Hệ | Ví dụ chỗ phải gỡ (rà đủ khi làm) |
|---|---|
| Trí nhớ / quan hệ / tip | `sim/memory`, `sim/recall`, bucket + trust trong `save`, tip |
| Đồn thổi / nghe lỏm | `sim/gossip`, `sim/overhear`, `ui/stall/GossipCorner` |
| Sổ tay | `sim/notebook`, `ui/notebook` (Phase 0.5 làm app Note mới, không tái dùng) |
| Mùa 40 ngày / arc / ending | `content/season`, `content/arcs`, `sim/story` phần arc, `sim/ending`, `EndingScene` |
| Cô Ba | `CO_BA` trong attention/NPC, `content/lines/co-ba-*`, intro cũ |
| Nghĩa vụ chết | hụi, tiền học trong `sim/obligations` |
| Sự kiện chết | `WRONG_NAME`, `REMEMBERED_USUAL`, `REMEMBERED_STORY`, order "như mọi bữa" |

Giữ và nối lại: `sim/broke` (hết vốn) → **game over phá sản**.

**T0.1.2 — Luật dọn.**
- Code chết **biến mất hoàn toàn** — không comment out, không cờ tắt, không file `old/`, không `@deprecated`. Git giữ lịch sử.
- **Không ghi quá trình vào code**: không comment kiểu "đã bỏ X", "revamp", "trước đây…", "R0.1". Comment chỉ nói code hiện tại làm gì.
- Sau khi dọn: `tsc` sạch, test còn lại xanh, game chạy được tới hết một ngày (chụp màn hình kiểm bằng mắt).
- Tạm thiếu intro / sổ tay là chấp nhận được — Phase 0.5 dựng lại.

---

## 1b. Phase 0.5 — Cốt truyện, màn vào game & điện thoại

> Bỏ nhân vật Cô Ba. Làm ngay sau Phase 0, trước mọi phase khác — vì đổi CANON, tên game, màn đầu tiên người chơi thấy.

**T0.5.1 — Nhân vật chính mới.** Cô gái **23–26 tuổi**, nghỉ việc công ty, mở **quán bánh mì thật** (có mặt bằng, biển hiệu, tên quán). Năng động, vui vẻ, lì.
Tên: **Phương Anh** (cố định). Tên quán mặc định *Bánh Mì Phương Anh*, người chơi đổi được.

**T0.5.2 — Phản diện: sếp cũ.** Hãm, bào nhân viên, OT không lương, phúc lợi kém. Lý do Phương Anh nghỉ, và là người ai chơi cũng muốn thắng.

**T0.5.2b — Nam phụ: Hoàng Huy.** Đồng nghiệp cùng cấp, phản diện đi xuyên suốt cùng nữ chính. Tự cao, khinh thường người chơi, hay cà khịa, cố tình đánh giá xấu (R4). Mất não: tự tin sai, logic ngược. Sếp chỉ xuất hiện thưa, Huy mới là người bám.
- Quán nổi tiếng (lên tin tức) → Huy bị sa thải, thất nghiệp, quay sang xin việc. Thua thì Huy khịa tiếp.

**T0.5.3 — Chủ đề: làm điều người ta không dám làm.**
Ai đi làm cũng từng nghĩ *"nghỉ quách, mở quán cho rồi"* — nhưng không dám. Game cho người chơi **dám**: đặt cược hết tiền tiết kiệm, tự làm chủ, và thấy nó thành.
Thoả mãn nằm ở 3 chỗ: **dám bắt đầu** · **được công nhận** (tin tức, comment trên điện thoại) · **lớn lên** (từ quán nhỏ thành thương hiệu).

**T0.5.4 — Cốt truyện.**

| Nhịp | Truyện | Khớp cơ chế |
|---|---|---|
| Trước game | Làm văn phòng, bị sếp bào: OT không lương, phúc lợi kém. Một hôm nộp đơn nghỉ. Dồn hết tiền tiết kiệm + mẹ cho thêm → thuê mặt bằng nhỏ, ký hợp đồng thuê. | Vốn ít, có rủi ro thật |
| Khai trương | Quán mới, menu chỉ có **ốp la**. Bạn bè tới ủng hộ, review đầu tiên. | Chỉ ốp la |
| Lên món | Tự học công thức, chọn nhà cung cấp → thêm pate, thịt nguội, xíu mại… | Mở khoá topping, nhà cung cấp |
| Bị thử thách | Xe bánh mì lâu năm bên kia hẻm chơi xấu. Quán hủ tiếu kế bên tên na ná → bị review nhầm. Giá nguyên liệu lên xuống. | Review ác ý, review nhầm, giá biến động |
| Được công nhận | Kể **chỉ qua điện thoại**: tin tức/bài đăng về quán hiện trên feed, **đồng nghiệp cũ vào comment ủng hộ, sếp cũ vào comment mỉa** ("được mấy tháng"). Càng lên sao, sếp càng cứng họng. Không thêm nhân vật tới quán. | Thông báo điện thoại, kích theo mốc sao/review |
| Thắng | Đủ tiền → **mở chi nhánh 2**, quán thành thương hiệu. Màn kết: tường review, biển hiệu mới. | Mốc tiền thắng (50tr chỉ là gợi ý — xem T5.1) |
| Thua | Bị đóng cửa vì ATTP → quán niêm phong, mở laptop **nộp lại CV**. | Game over ATTP |

Các mốc truyện kích theo **thành tích** (số review, sao, tiền), không theo ngày — vì game không giới hạn ngày. Mốc cụ thể chạy mô phỏng mới chốt (xem Lưu ý 1).

**T0.5.5 — Màn giới thiệu kể bằng điện thoại.** Ngắn, bỏ qua được, dạy luôn app sao.
1. Tin nhắn sếp lúc 23h giao việc gấp, *"mai nộp nha em"* → Phương Anh gửi đơn nghỉ việc.
2. Nhóm chat đồng nghiệp: người chúc, người ghen tị, người xin theo.
3. Tin nhắn mẹ: lo, nhưng vẫn chuyển khoản thêm.
4. Ký hợp đồng thuê mặt bằng → đứng trước quán trống → **đặt tên quán**.
5. Treo biển → mở app sao: *"Quán mới — chưa có đánh giá"* → vào ngày khai trương.

**T0.5.6 — Điện thoại: 3 app dựng sẵn.** Nhấn `Tab` mở điện thoại (khung lấy từ `art-raw/phone.png`, màn xanh là vùng hiển thị). Màn chính có 3 icon, mỗi icon có **badge số chưa đọc**.

| App | Làm gì | Giao diện |
|---|---|---|
| **Note** | Thay chỗ **sổ tay** hiện tại | Kiểu app ghi chú: danh sách note → mở ra đọc |
| **Message** | Tin nhắn với sếp cũ, đồng nghiệp, bạn bè, mẹ. **Xem lại tin cũ**, kể cả tin của màn giới thiệu | Kiểu app nhắn tin: danh sách cuộc chat → bong bóng chat |
| **Đánh giá** | Số sao hiện tại + danh sách review của quán | Kiểu trang review: sao to ở đầu, list review bên dưới |

Thêm 3 app (thiết kế ở `R0.5-HE-THONG.md`):

| App | Làm gì |
|---|---|
| **Hệ thống** | Đầu ngày tự điểm danh → vòng quay thưởng (tiền nhỏ, buff 1 ngày, thẻ sửa đánh giá…). Dẫn hướng dẫn ngày 1 |
| **Thực phẩm** | Thay màn đi chợ. Kiểu sàn TMĐT: đặt đơn trừ tiền ngay, giao lúc mở cửa / sáng mai, xem đơn cũ |
| **Đồ nghề** | Mua đồ nghề (lò, tủ mát, ghế, quạt…), trả tiền ngay, lắp sáng mai |
| **Rao bán** | Đăng bán đồ cũ, xác suất có người mua theo món + giá. Giới hạn để không bán tràn lan |

App Đánh giá ở phase này chỉ dựng **khung + dữ liệu có sẵn**. Review thật (đa yếu tố, phản hồi, ATTP) làm ở Phase 4.

**T0.5.7 — Tin nhắn theo sự kiện.** Đạt điều kiện (quán lỗ, quán lên xu hướng, lên/xuống sao…) → ngoài comment, **đồng nghiệp/bạn bè/sếp nhắn tin**.
Mỗi tin có 1 trong 3 kiểu:
- Có lựa chọn trả lời: **cảm ơn** hoặc **chửi lại/cà khịa lại**.
- Không cần trả lời (không có lựa chọn).
Điều kiện cụ thể chốt cùng mô phỏng (Lưu ý 1).

**T0.5.8 — Màn vào game + hướng dẫn.** Sửa theo truyện mới:
- Màn menu: tên game mới, hình quán thay cho xe.
- Màn giới thiệu: kể bằng **app Message** (T0.5.5), lưu lại để xem lại sau.
- Hướng dẫn ngày đầu: theo quán mới (chỉ ốp la, Phương Anh tự làm, không có cô Ba), có luật rửa tay mỗi 10 ổ, dạy mở điện thoại.

**T0.5.9 — Đồng bộ toàn game.**
- Xưng hô theo tuổi NPC: người lớn gọi `con/em/bé`, người trẻ gọi `chị`. Anh Bảo đã đổi sang `chị`.
- Đổi tên game → **Bye Sếp, Em Bán Bánh Mì** (bỏ "Cô Ba"). Tên tiếng Anh: Bye Boss, I'll Sell Banh Mi.
- Art xe → quán (biển hiệu, mặt tiền), intro, ending, CANON.
- Bỏ chi tiết đời Cô Ba trong thoại các NPC.

---

## 2. Phase 1 — Map & quầy

**T1.1 — Thu nhỏ map.** Bỏ hết quầy phía trước không có tác dụng.

| Trạm | Kích thước |
|---|---|
| Bàn thớt (kẹp nhân) | 1–2 ô |
| Bàn order | 1 ô, đặt máy tính tiền |
| Chỗ để bánh sau nướng | 1 ô |

**T1.2 — Rửa tay theo lô.** Bán **10 ổ** mới phải rửa tay một lần, không phải mỗi ổ. Ghi vào hướng dẫn.

> ✅ Xong 2026-10-21: map 23×16 → 18×16, quầy còn 3 bàn lẻ (thớt x4 · để bánh x6 · order x8), trạm sau lưng dồn lại; rửa tay mỗi 10 ổ + dòng hướng dẫn bước TAY.

---

## 3. Phase 2 — Topping, giá bán, mở khoá

**T2.1 — Mở khoá topping dần.** Mở đầu chỉ có **bánh mì ốp la**. Lần lượt mở: pate → thịt nguội → xíu mại → … Chậm nhất **ngày 10** mở hết.
Mỗi topping mở khoá xong là **tuỳ chọn nhập hàng**, không bắt buộc.

**T2.2 — Topping mở sau thì giá cao hơn, lời nhiều hơn.** Ví dụ bánh mì thịt nguội đắt hơn xíu mại. Đây là động lực mở khoá.

**T2.3 — Người chơi tự chọn giá.** Mỗi loại bánh có **3 mốc giá**: rẻ / thường / đắt.

Ví dụ ốp la 15 / 20 / 30k:

| Mốc | Tác động |
|---|---|
| Rẻ (15k) | +20% khả năng được 4–5★, lời ít |
| Thường (20k) | +5% khả năng 4–5★, 5% khách bỏ đi vì giá |
| Đắt (30k) | 10% bị đánh giá thấp vì giá, 10% khách bỏ đi |

> ✅ Xong 2026-10-21 (xem `R2-PLAN.md`): mở khoá theo ngày 1·2·4·6·8·10, ba mốc giá rẻ ×0,8 / đắt ×1,25, khách bỏ đi vì giá thật; khen / chê giá ghi sổ chờ R4.

**T2.4 — Tự lập bảng cân bằng.** Thứ tự mở khoá, giá từng topping, 3 mốc giá cụ thể của từng loại bánh, và các con số `+% 4–5★ / +% bỏ đi / −% 4–5★` → **tự thiết kế thành bảng + công thức**, không để số lệch cân bằng. Các số trên chỉ là ví dụ.

---

## 4. Phase 0.7 — Nhà cung cấp (trước là Phase 3)

> Làm ngay sau Phase 0.5, trước Phase 1: app **Thực phẩm** (R0.5) là chỗ đặt hàng nên nhà cung cấp gắn thẳng vào đó. Các mã `T3.x` giữ nguyên để khỏi lệch tham chiếu.

**T3.1 — Đổi "đi chợ" thành "nhà cung cấp".** Mỗi món có **2–3 mức chất lượng**: hàng bẩn/bỏ thuốc giá cực rẻ · hàng thường · hàng cực ngon nhưng đắt.

UI mỗi món hiện **3 thanh**: độ ngon · chất lượng · giá. Người chơi tự quyết.

**T3.2 — Hàng kém thì khách đau bụng.** Mỗi nguyên liệu có xác suất gây đau bụng riêng khi dùng hàng kém (ví dụ pate 40%, thịt nguội 35%, ớt 10%). Khách đau bụng → review xấu. Bảng xác suất tự thiết kế.

**T3.3 — Giá biến động.** Giá nhà cung cấp lên xuống theo thị trường, không cố định.

**T3.4 — Hướng dẫn đặt hàng trong tour ngày đầu.** Xong nhà cung cấp thì bước đầu của tour (nhiệm vụ "Thu thập tài nguyên") phải **dắt người chơi đặt đủ hàng cho ngày 1**, từng món một: mở Thực phẩm → chọn nhà cung cấp/mức chất lượng → bấm thêm **đủ số lần** (vd. cần 10 ổ mà mỗi lần bấm +5 thì chỉ rõ bấm 2 lần) → xem giỏ → Đặt hàng. Mỗi món có vòng khoanh + đếm "đã 1/2". Chỉ xong bước khi giỏ đủ món tối thiểu bán được ngày đầu (ốp la: bánh + trứng + …, số lượng chốt cùng mô phỏng). ✅ Đã làm ở R0.7: tour dắt qua Fresh24, bánh mì bấm + hai lần (0/2 → 2/2), pate, thịt nguội, rau, rồi giỏ và Đặt hàng.

---

## 5. Phase 4 — Điện thoại & hệ đánh giá

**T4.1 — Tab mở điện thoại.** *(Khung điện thoại + 3 app dựng ở T0.5.6 — phase này đổ dữ liệu review thật.)* Màn hình chính có app hình **ngôi sao**, badge số thông báo chưa đọc. Mở app → danh sách review. Có review mới → thông báo trong game.

**T4.2 — Nội dung review đa dạng.** Mỗi review có thể gộp **nhiều yếu tố** (ngon + giá cao, đắt + thiếu topping, dễ thương + rẻ…). Giọng tự nhiên, nhiều persona, hay thiếu chủ ngữ, vui tính — viết theo đúng hệ nói chuyện. Văn phong lấy từ research comment thật (xem Lưu ý 2).

Nguồn review:
- Theo việc làm thật: sai món, rớt bánh, bánh sạn, thiếu tương ớt, thiếu topping, giá, đau bụng, bánh ngon…
- **2%** bị đánh giá nhầm quán hủ tiếu (1–3★).
- **5%** bị chủ xe bánh mì đối thủ đánh giá ác ý.
- **1%** đánh giá không có ý nghĩa gì (người thật cũng hay spam đánh giá).
- đánh giá chỉ có sao, không comment
- và nhiều tình huống trong đời sống khác. Nên có những tình huống vui nhộn với xác xuất thấp để user khám phá như dạng bí ẩn hay điều thú vị

**T4.3 — Phản hồi review.** Người chơi tự nhập trả lời, chỉ cần hiển thị ra.

**T4.4 — Game over an toàn thực phẩm.** Tổng sao xuống **≤3★** *và* có **>10 review 1–2★ do đau bụng** → bị điều tra ATTP, đóng cửa, thua. Hoặc tổng review đau bụng trên 15, bất kể tổng số sao cũng sẽ thua do ATTP
> ✅ Chốt 2026-10-21 (xem `R0.7-PLAN.md` §9): đếm review đau bụng trong **cửa sổ trượt 14 ngày**; giả định ~**40%** khách đau bụng chịu viết review. Chỉnh lại bằng mô phỏng ở R4.

---

## 6. Phase 5 — Vòng đời & số khách

**T5.1 — Bỏ trần 40 ngày.** Bán vô hạn tới khi thua, hoặc đạt **mốc tiền thắng** thì hết game.
**50tr chỉ là gợi ý.** Mốc thật chọn bằng mô phỏng, theo tiêu chí:
- Chơi ổn định (giá thường, hàng thường) thắng trong khoảng thời gian chơi mục tiêu — không quá nhanh, không lê thê.
- Không thắng được **trước khi mở hết topping**.
- Chơi "bẩn" (hàng kém, giá rẻ) lời nhanh hơn nhưng **rủi ro ATTP cao hơn lợi**.
- Chơi "xịn" (hàng ngon, giá cao) phải là đường thắng được, không bị phạt chết.
- Có tỉ lệ thua thật, nhưng thua phải đọc được lý do.
Thời gian chơi mục tiêu và tỉ lệ thua cũng chốt cùng lúc khi mô phỏng.

**T5.2 — Số khách theo sao.**

```
Y(x) = floor(5 + (x-1)/5) × R × (1 + ε)
```

- `x` — ngày; mức cơ sở tăng 1 sau mỗi 5 ngày
- `R` — hệ số theo sao trung bình
- `ε` — nhiễu ngẫu nhiên −10% … +10%
- `Y(x)` — số ổ dự kiến, làm tròn

| Sao | R |
|---|---|
| 1★ | 0,2 |
| 2★ | 0,4 |
| 3★ | 0,7 |
| 4★ | 1,2 |
| 5★ | 1,3 |

---

## 7. Phase 6 — Nhân vật & văn phong

**T6.1 — Đổi hết tên vai thành tên riêng.** Bỏ "chú Ba", "chú Bảy" → Hoàng Huy, Văn Thái… (*Phương Anh* đã dành cho nhân vật chính) cho dễ nhớ.

**T6.2 — Giọng Nam gen Z.** Thoại miền Nam hiện đang như năm 1990. Đổi sang giọng Nam **trẻ, hiện đại, đời thường**.
Văn phong lấy từ research (Lưu ý 2). Giữ nguyên luật cũ: UI viết tiếng phổ thông, giọng Nam chỉ ở lời thoại (`VAN-PHONG-UI.md`).

---

## 7a. Phase 7 — Kho đồ lạnh (thùng xốp / tủ mát)

> Phase bổ sung. Ô kho ở góc trong cùng quán (x=3, y=2) **luôn chặn đường**: lúc đầu là thùng xốp (`prop_cooler`, thấp hơn tủ), mua `TU_MAT` thì đổi thành tủ mát.

**T7.1 — Nhấn E vào kho để xem đồ.** Đứng sát thùng xốp / tủ mát, nhấn **E** → mở danh sách toàn bộ đồ đang có, **gộp chung một kho** (trứng, bánh mì, pate, thịt nguội, chả lụa, xíu mại, rau…). Mỗi dòng: tên · số lượng.

**T7.2 — Tách dòng theo tình trạng.**
- Cùng món nhưng **độ hư khác nhau** (vd. trứng mua hôm qua và hôm nay) → **hiện hai dòng riêng**, mỗi dòng số lượng + tình trạng (còn mấy ngày).
- Cùng món nhưng **độ ngon / mức chất lượng khác nhau** (nhà cung cấp, T3.1) → *đề xuất* cũng tách dòng. Chốt khi làm: tách hẳn, gộp có mở rộng, hay chỉ gắn nhãn.
- Sắp xếp: món sắp hư lên đầu.

**T7.3 — Bỏ món Nồi ủ xíu mại (`NOI_U`).** Xíu mại bảo quản chung kho như mọi món khác. Xoá hẳn món khỏi thiết bị, shop, save, bản vẽ trong quán, gợi ý (`gearHint`), test và doc.

**T7.4 — Thùng xốp → tủ mát khi nâng cấp.** Danh sách giữ nguyên, chỉ đổi dung lượng (8 → 20 phần) và hạn dùng. Danh sách phải hiện **dung lượng đã dùng / tối đa**.

**⚠️ Research UI/UX kỹ trước khi thiết kế.** Không làm theo cảm tính. Cần tổng hợp từ:
- **Người chơi thật** — review, thread, video chơi các game quản lý kho/nhà hàng (Dave the Diver, Cooking Diary, Papa's, Stardew Valley chest, Restaurant Tycoon, Overcooked…): họ khen/chê gì ở màn kho.
- **Người dùng & BA** — nhu cầu: cần biết gì trong 2 giây đầu (còn đủ không · cái gì sắp hư · cái gì thiếu).
- **Lý thuyết UI/UX** — Hick (bớt lựa chọn), Fitts (nút to, dễ bấm), Miller (nhóm ≤7±2), Gestalt (nhóm/ngăn), phân cấp thị giác, nhất quán, phản hồi.
- **Chơi thực tế** — tự chơi các game trên, chụp màn hình, ghi lại điểm hay/dở.
- **Quy tắc UI** — chữ đọc được trên mobile, tương phản, màu không là tín hiệu duy nhất (tình trạng hư cần icon + chữ), thao tác một tay.

Ra **báo cáo research + vài phương án mock** trước, chủ dự án chọn rồi mới code.

---

## 8. Cách làm

Mỗi task `T*` là một đơn vị plan riêng. Task nào cũng **nghĩ sâu, research kỹ** trước khi code — đây là task chiến lược, không phải sửa vặt.
