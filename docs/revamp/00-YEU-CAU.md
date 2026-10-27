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

**T4.4 — Game over an toàn thực phẩm.** Tổng sao xuống **≤3★** *và* có **>10 review 1–2★ do đau bụng** → bị điều tra ATTP, đóng cửa, thua. Hoặc tổng review đau bụng trên 12 (chốt 2026-10-23, trước là 15), bất kể tổng số sao cũng sẽ thua do ATTP
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

> ✅ Xong 2026-10-23. Chốt: kho dạng lưới ô như game (icon · số lượng · thanh độ tươi xanh → vàng → đỏ, ô cuối hạn có dấu `!`), mỗi ô = một món + một mức chất lượng + một ngày nhập; panel bên phải hiện chi tiết. Code: `sim/stock.ts`, `ui/stall/StorageView.ts`, trạm `kho` ở `world/stations.ts`. Bỏ `NOI_U` nên xe còn thiếu 1 ô ròng; `BANG_HIEU` tăng lên 2 ô để TB-4 vẫn đúng.
>
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

## 7b. Phase 8 — Danh hiệu

> Phase cuối. Làm sau R7. Không đụng cân bằng kinh tế: danh hiệu **chỉ để trưng**.
> (Mã R7 đã thuộc Kho đồ lạnh ở §7a, nên phase này là **R8**.)

**Mục tiêu.** Chạm sự kiện hoặc làm được việc gì đó thì được một danh hiệu; app **Danh hiệu** trong điện thoại bày thành lưới ô để sưu tập.
Vui ở chỗ **không ai nói trước** — ô xám trong lưới là lời mời thử, và vài cái chỉ lộ ra khi đã đạt.

### T8.1 — Bảng danh hiệu (51 cái)

Dữ liệu: `src/content/ach.ts` (`ACH_LIST`). Hạng Đồng 15 · Bạc 20 · Vàng 11 · Kim cương 5. ✗ = danh hiệu thất bại (13). (ẩn) = che tên và điều kiện tới khi đạt (17).
Điều kiện chỉ đọc dữ liệu có sẵn; chỗ cần đếm thì có bộ đếm trong `SaveFile.ach`.

| # | Tên | Hạng | Điều kiện | Nguồn dữ liệu |
|---|---|---|---|---|
| 1 | Đầu xuôi đuôi lọt | Đồng | Bán ổ đầu tiên | tổng ổ (ledger + `today.served`) |
| 2 | Có tiếng có tăm | Đồng | Nhận đánh giá đầu tiên | `reviews.list` |
| 3 | Học ăn học nói | Đồng | Xong hướng dẫn ngày đầu | `tourStep === XONG` |
| 4 | Trời xui đất khiến | Đồng | Liên kết Hệ thống | `system.stage` |
| 5 | Vui lòng khách đến | Đồng | 1 đánh giá 5★ (khách thật) | `reviews.list`, bỏ `noise` |
| 6 | Năng nhặt chặt bị | Đồng | 100 ổ cộng dồn | tổng ổ |
| 7 | Một nắng hai sương | Đồng | Sống qua ngày 30 | `dayIndex >= 31` |
| 8 | Lửa thử vàng ✗ | Đồng | 5 ổ cháy trong 1 ngày | `today.burnt` |
| 9 | Ngựa có lúc sẩy chân ✗ | Đồng | Đánh giá đau bụng đầu tiên | `review.food` |
| 10 | Chín người mười ý ✗ | Đồng | Đánh giá 1★ đầu tiên | `reviews.list` |
| 11 | Vắng như chùa Bà Đanh ✗ | Đồng | Mở cả ngày, bán 0 ổ (không tính đóng quầy sớm) | `ledger.served`, `econ.today.closedAtMin` |
| 12 | Thắt lưng buộc bụng ✗ | Đồng | Lỗ 3 ngày liền | `ledger` revenue < cost |
| 13 | Giá cắt cổ ✗ | Đồng | 5 khách bỏ vì giá trong 1 ngày | `today.priceLost` |
| 14 | Ở hiền gặp lành | Đồng | Đãi 20 ly trà đá | `ach.tea` (`attention:toolUsed` TRA_DA) |
| 15 | Của bền tại người | Đồng | Bán được 1 đồ cũ | `ach.resold` (`resell.morning`) |
| 16 | Kiến tha lâu đầy tổ | Bạc | 1.000 ổ | tổng ổ |
| 17 | Đứng mũi chịu sào | Bạc | Sống qua ngày 60 | `dayIndex >= 61` |
| 18 | Của ăn của để | Bạc | Có 10 triệu tiền mặt | `money.cash` |
| 19 | Đắt như tôm tươi | Bạc | Hết sạch bánh khi còn khách đến | `econ.today.soldOut > 0` |
| 20 | Có qua có lại | Bạc | Trả lời 10 đánh giá | `review.reply` |
| 21 | Lời ra tiếng vào | Bạc | 100 đánh giá | `reviews.list` |
| 22 | Tai bay vạ gió ✗ | Bạc | 5 đánh giá 1★ | `reviews.list` |
| 23 | Quay đầu là bờ | Bạc | Dùng thẻ sửa đánh giá lần đầu | `review.edited` |
| 24 | Lò Bát Quái ✗ (ẩn) | Bạc | 10 ổ cháy trong 1 ngày | `today.burnt` |
| 25 | Nước đổ lá khoai ✗ (ẩn) | Bạc | 10 khách bỏ vì ổ rơi | `ach.soiled` (`npc:left` SOILED_FOOD) |
| 26 | Bệnh từ miệng vào ✗ (ẩn) | Bạc | Bị đóng cửa vì ATTP | `flags.shutdown` |
| 27 | Nhà tan cửa nát ✗ (ẩn) | Bạc | Phá sản | `flags.broke` |
| 28 | Ngồi chờ sung rụng ✗ (ẩn) | Bạc | 3 ngày liền bán dưới 5 ổ | `ledger.served` |
| 29 | Lấy công làm lãi (ẩn) | Bạc | Cả ngày mọi món giá rẻ nhất, bán ≥ 25 ổ | `ach.low` (lấy mẫu `menu.price`) |
| 30 | Quen mặt đắt hàng | Bạc | 1 khách ghé 50 lần | `npcs[id].visits` |
| 31 | Tiền nào của nấy | Bạc | Mua tủ mát | `equipment.owned` |
| 32 | Ăn ngon ngủ yên | Bạc | 30 ngày liền không ai đau bụng | `ledger.sick` |
| 33 | Buôn có bạn bán có phường | Bạc | Đặt hàng đủ 7 nhà cung cấp | `ach.sup` (`placeOrder`) |
| 34 | Râu ông cằm bà (ẩn) | Bạc | Nhận đánh giá nhầm quán | `review.noise === nham` |
| 35 | Trên trời rơi xuống (ẩn) | Bạc | Quay trúng đồ nghề miễn phí | `ach.baoKhi` (`spin`) |
| 36 | Góp gió thành bão | Vàng | 1.600 ổ | tổng ổ |
| 37 | Tiền vào như nước | Vàng | Có 20 triệu tiền mặt | `money.cash` |
| 38 | Mở mày mở mặt | Vàng | Đạt mốc tiền thắng | `flags.won` |
| 39 | Buôn may bán đắt | Vàng | Thắng trước ngày 100 | `flags.wonDay` |
| 40 | Trăm hoa đua nở | Vàng | 120 đánh giá 5★ (khách thật) | `reviews.list` |
| 41 | Đắt xắt ra miếng (ẩn) | Vàng | Cả ngày mọi món giá đắt nhất, bán ≥ 10 ổ, `lost` = 0 | `ach.high`, `today.lost` |
| 42 | Thêm bạn bớt thù (ẩn) | Vàng | Nói chuyện sâu với đủ 12 nhân vật có tên | `npcs[id].talksDone` |
| 43 | Đâu vào đấy | Vàng | Lắp kín 14 chỗ trên xe | `equipment` capacity/used |
| 44 | Mệnh ta do ta (ẩn) | Vàng | Từ chối Hệ thống 2 lần | `system.stage === unlinked` |
| 45 | Dã tràng xe cát (ẩn) | Vàng | Trúng LUCK 8 lượt quay liền | `ach.luckRun` (`spin`) |
| 46 | Chim sa cá lặn (ẩn) | Vàng | Nhan sắc đạt cấp 10 | `system.beauty >= 10` |
| 47 | Một vốn bốn lời (ẩn) | Kim cương | Thắng trước ngày 90 | `flags.wonDay` |
| 48 | Tiếng lành đồn xa | Kim cương | Sao TB ≥ 4,2 với ≥ 50 đánh giá | `average(w)` |
| 49 | Sạch như lau như li (ẩn) | Kim cương | Thắng mà cả ván 0 ổ cháy, 0 ổ rơi | `ach.burnt`, `ach.soiled` |
| 50 | Hai bàn tay trắng (ẩn) | Kim cương | Thắng mà không liên kết Hệ thống | `system.stage` |
| 51 | Phá gia chi tử ✗ (ẩn) | Kim cương | Phá sản trong 3 ngày đầu | `flags.brokeDay <= 3` |

### T8.2 — App Danh hiệu trong điện thoại

Dựng theo mẫu `src/ui/phone/apps/sellApp.ts` (danh sách + trang con theo `route.id`), thẻ chi tiết theo `systemApp.ts`.

| Chỗ nối | Việc |
|---|---|
| `src/ui/phone/ctx.ts` | Thêm `"ach"` vào `Route["app"]`; chi tiết dùng `{ app: "ach", id }` |
| `src/ui/phone/PhoneView.ts` | Thêm dòng vào `APPS`: `key: "ach"`, `label: "Danh hiệu"`, `icon: ICON.medal`, `bg` vàng đồng; `badge` = số danh hiệu đạt chưa xem; thêm `case "ach"` trong `go()` |
| `src/ui/phone/dom.ts` | Thêm `ICON.medal` (huy chương tròn + dải ruy băng) vào `ICON` |
| `src/ui/phone/phoneStyle.ts` | Thêm `.ph-ach-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px 10px;padding:12px 14px}` và `.ph-ach.off` (xám) |
| `src/ui/phone/apps/achApp.ts` | **File mới** — lưới + trang chi tiết |

**Lưới (3 cột).**

| Trạng thái | Ô hiện gì |
|---|---|
| Đã đạt | Huy hiệu màu + tên đầy đủ |
| Chưa đạt | Khung xám nét đứt, hình huy hiệu dạng bóng, tên mờ |
| Chưa đạt + ẩn | Khung xám, dấu `?` to, tên cũng là `?` |

Đầu danh sách một dòng `ph-sec`: `Đã đạt 7/51`.

**Trang chi tiết** (bấm vào một ô): huy hiệu to · tên · mô tả một câu · điều kiện · `Ngày đạt: ngày 14`.
Ô chưa đạt vẫn bấm được: hiện điều kiện, không có ngày. Ô ẩn chưa đạt: `?` và một dòng `Chưa rõ`.

### T8.3 — Chỗ lưu

`src/sim/ach.ts` giữ luật chấm; `src/content/ach.ts` giữ bảng.

| Gì | Ở đâu | Vì |
|---|---|---|
| Danh hiệu đã đạt (`id → ngày`) và `seen` | Theo máy: `platform`, khoá `byesep.ach`, như `core/rewinds.ts` | Thắng/phá sản gọi `save.clear()` xoá `SaveFile` |
| Bộ đếm cộng dồn theo ván (`SaveFile.ach`: trà đá, ổ rơi, ổ cháy, đồ cũ đã bán, nhà cung cấp, chuỗi LUCK, từng nợ, cờ giá cả ngày) | `SaveFile` | Thuộc về ván đó |

- `normalize()` điền `s.ach = { ...d.ach, ...s.ach }` như `s.system`. Save cũ thiếu trường → bộ đếm 0. **Không tăng `SCHEMA_VERSION`**, không chấm ngược.
- Chấm: `checkLive` (mỗi giây khi bán, và sau khi chốt thắng/thua) · `checkEvening` (lúc `evening:done`, TRƯỚC `markWin`/`markShutdown`/`markBroke` ở `DayScene`).
- Sự kiện không qua bus (`spin()`, `placeOrder`, `resell.morning`) tăng bộ đếm thẳng.

### T8.4 — Lúc đạt thì hiện gì

Hai chỗ, không chặn thao tác, không mở điện thoại giùm:

1. **Toast trong lúc bán** — `Hud.toast` (`src/ui/Hud.ts:203`), tone `good`, một dòng: `Danh hiệu: Lửa thử vàng`. Nhiều cái cùng lúc thì xếp hàng, mỗi lần một dòng.
2. **Một dòng trong app Hệ thống** — gọi `say(w, …)` (`sim/system.ts`), chỉ khi `linked(w)`. Badge app Danh hiệu +1.

Mẫu ba dòng, giọng Hệ thống (skill `giong-he-thong`):

```
Keng! Chúc mừng ký chủ thu được danh hiệu 【Lửa Thử Vàng】(Đồng).
Hiệu quả: không có. Danh hiệu chỉ để trưng.
Mô tả: Lửa thử vàng, gian nan thử sức.
```

Tên danh hiệu giữ nguyên chữ gốc ở mọi chỗ (Hệ thống, toast, app Danh hiệu).

### T8.5 — Không được làm gì

| Cấm | Vì |
|---|---|
| Thưởng tiền, buff, `exp`, thẻ | Phá cân bằng kinh tế đã mô phỏng ở R5 |
| Nhiệm vụ, danh sách việc cần làm, dẫn hướng | Danh hiệu là thứ tự nhặt được, không phải việc phải làm |
| Thanh tiến độ "còn 2 ổ nữa", gợi ý điều kiện chưa đạt của danh hiệu ẩn | Mất phần khám phá |
| Hộp thoại chặn, dừng game, mở điện thoại giùm | Đang bán thì không được cắt ngang |
| Câu dắt tay, khen, cổ vũ (`VAN-PHONG-UI` §5, §6) | Toast chỉ nói trạng thái |
| Chấm ngược cho save cũ | Save cũ không có dữ liệu để chấm đúng |

### T8.6 — Nghiệm thu

- [ ] Ván mới: đạt được #1 · #2 · #3 · #4 trong ngày 1 (Đầu xuôi đuôi lọt, Có tiếng có tăm, Học ăn học nói, Trời xui đất khiến), mỗi cái một toast, không cắt thao tác bán.
- [ ] App Danh hiệu lên lưới 3 cột đúng: ô đã đạt có màu + tên, ô chưa đạt xám + tên mờ, ô ẩn là `?`.
- [ ] Bấm ô đã đạt ra chi tiết có đủ tên · mô tả · điều kiện · ngày đạt; bấm ô ẩn chưa đạt chỉ ra `?`.
- [ ] Mỗi danh hiệu chỉ chấm một lần; thoát ra vào lại không chấm lại, không mất.
- [ ] Load save cũ (không có `ach`): vào game được, lưới hiện 0/51, không lỗi.
- [ ] Tiền, buff, `system.exp` **không đổi** trước và sau khi đạt danh hiệu.
- [ ] Chụp màn hình lưới và trang chi tiết ở cả màn rộng lẫn màn hẹp, soi theo checklist `.claude/CLAUDE.md` §3.2.

---

## 7c. Các phase sau R8

> Ghi từ prompt thô của chủ dự án (2026-10-24). Chỉ là **đề bài**; chưa plan, chưa chốt thứ tự. Số trong đây là ước tính — theo Lưu ý 1.

### R9 — Sự kiện bệnh

- Đi ra ngoài ngày mưa → có **xác suất** bệnh.
- Diễn tiến theo ngày:

| Ngày bệnh | Hậu quả |
|---|---|
| 1 | Giảm 8% tốc độ chạy |
| 2 | Giảm 10% tốc độ chạy |
| 3 | Không chạy được |
| 4 | Chết, game over |

- **Dẹp hàng sớm** 1 ngày (làm không quá 1 tiếng) → xoá trạng thái bệnh.
- Mục đích 3 ngày đệm: để người chơi sắp xếp bán hết hàng tồn.
- *Chưa rõ:* "dẹp hàng sớm" tính từ lúc mở bán hay từ lúc phát bệnh; xác suất bệnh; có báo trước ngày 4 hay không.

### R10 — Giao hàng thật (shipper)

- Hàng nhà cung cấp do **shipper giao thật**, người chơi **nhận thật** (thay vì hàng tự vào kho).
- Luồng: xe chạy từ **mép phải map sang trái** → shipper ngồi xe → xuống xe, bê thùng hàng tới trước cửa quán → hiện bong bóng chat "hàng đến" kèm dấu chấm than → người chơi nhấn **E** nhận.
- Nhận xong hiện thông báo kiểu game khác: `+ 20 [ảnh bánh mì]`, `+ 40 [ảnh ớt]`… (icon + số lượng từng món).
- Cần asset:

| Asset | Ghi chú |
|---|---|
| Model 3D xe | Chạy ngang map phải → trái |
| Model 3D shipper | Ngồi được trên xe |
| Animation | Shipper ngồi xe · di chuyển · tay bê hàng |
| Ảnh thùng hàng | Dùng trong cảnh |

- Làm theo quy trình `tao-anh-game` và `CLAUDE.md` §3.1 (mỗi step render/chụp, xem ảnh).
- Liên quan: R0.7 (nhà cung cấp).

### R11 — Phần thưởng Hệ thống: bánh mì thần thánh

- Vật phẩm trong **vòng quay** của Hệ thống; độ ngon cực cao.
- Hiệu lực: **100% xoá** hiệu ứng bất lợi của các item khác (đau bụng, đồ qua đêm, rớt đất); khách ăn xong **chắc chắn 5★**.
- Dùng **một lần cho một cái**; tỉ lệ xuất hiện trong vòng quay **thấp**, tỉ lệ trúng **thấp**.
- Lời Hệ thống viết bằng skill `giong-he-thong`; hiệu ứng ngầm ghi kèm số (`CLAUDE.md` §5).
- Tỉ lệ + tác động cân bằng phải mô phỏng (Lưu ý 1).

### R12 — Hình ảnh 3D

| # | Việc | Ghi chú |
|---|---|---|
| 1 | Xem lại **góc quay 3D** | Theo hướng từ điểm gần map nhìn ra điểm xa map |
| 2 | Cho AI "làm real hơn" | Đưa ảnh chụp game vào AI, rồi quan sát xem cần cải thiện gì |
| 3 | **Nóc tường**: tường liền nhau gộp thành 1 ô | Áp cùng quy tắc đổ bóng cây lên mặt trên tường; tạo ảnh bóng cây phù hợp, chỉnh độ sáng. **Chỉ chỉnh nóc**, chưa đụng thân tường |
| 4 | **Viên gạch** thành khối 3D | Hiện là 1 ảnh phẳng → nhìn ngang chỉ thấy lớp mỏng. Thêm cạnh ngang. Dẹp luôn các thanh lòi ra ngoài (không rõ là gì) |

- Ảnh lỗi gạch/sàn: `/home/hoanghuy/Downloads/game/sàn nhà mỏng và có thanh lòi ra ngoài.png`.
- Đọc `QUY-TAC-CANVAS.md` và skill `anh-sang-vat-the` trước khi làm #3, #4.
- *Chưa rõ:* #3 "gộp thành 1 ô" là gộp lúc vẽ hay gộp trong bản đồ ô.

### R13 — Lỗi bong bóng thoại lệch

- Bong bóng hội thoại **nhảy lung tung**, không nằm trên đầu NPC: lúc NPC đang di chuyển, lúc vừa di chuyển vừa đứng lại,…
- Ảnh lỗi: `/home/hoanghuy/Downloads/game/LỆCH CHAT.png`.
- Nghiệm thu: chụp nhiều khoảnh khắc (đi, dừng, quay hướng), bong bóng luôn bám trên đầu.

### R14 — Tiền lẻ & đổi tiền (phase cuối)

> Chốt 2026-10-26. Hiện tại tiền lẻ chỉ là một con số ẩn (`sim/till.ts`); dòng "chạy qua cô Thuý đổi" chỉ là chữ, không có gì xảy ra.

| Phần | Cách làm |
|---|---|
| Tiền game | Thiết kế bộ tờ tiền có mệnh giá (1k, 2k, 5k, 10k, 20k, 50k…), có ảnh riêng |
| Thối tiền | **Tự động trừ** tờ trong két, người chơi không tính |
| Thiếu lẻ ≤ 5k | Bớt luôn cho khách (free) |
| Thiếu lẻ > 5k | Người chơi phải **chạy đi đổi tiền** |
| Đổi tiền | Cô Thúy là **một xe nhỏ** trên map. Chạy tới, nhấn **E** → modal chat → chọn đổi tiền → logic đổi |
| Xem két | Đứng ở quầy thanh toán nhấn **R** → hộc két kéo ra (animation + âm thanh kéo hộc) → xem tờ tiền bên trong |
| Kẹt tiền lẻ | Nhấn **F** chat với khách đang chờ thối. Lúc kẹt lẻ, các lựa chọn chat cũ **được thay** bằng hai lựa chọn dưới |

Hai lựa chọn khi kẹt tiền lẻ (`{npc}` = cách gọi khách, `{me}` = người chơi tự xưng):

| Lựa chọn | Câu người chơi nói | Hệ quả |
|---|---|---|
| Đi đổi | "{npc} đợi {me} xíu, {me} đi đổi tiền lẻ tý nha." | Khách đứng chờ, người chơi chạy qua xe cô Thúy đổi |
| Bớt tiền | "{me} bớt cho {npc} {số tiền} nha." | Bớt phần lẻ xuống tờ chẵn: ổ 28k thì lấy 20k (bớt 8k) |

- Câu thoại trên là ý, viết lại theo skill `research-giong-viet` lúc làm.

- *Chưa rõ:* khách làm gì trong lúc người chơi chạy đi đổi (đứng chờ, mất kiên nhẫn?); cô Thúy đổi tối đa bao nhiêu, có mất phí không; sáng có được đổi sẵn lẻ khi đi chợ không.
- Tỉ lệ khách đưa tờ lớn + số lẻ đầu ngày phải mô phỏng (Lưu ý 1). Canvas xe cô Thúy, hộc két: `QUY-TAC-CANVAS.md`.

---

## 8. Cách làm

Mỗi task `T*` là một đơn vị plan riêng. Task nào cũng **nghĩ sâu, research kỹ** trước khi code — đây là task chiến lược, không phải sửa vặt.
