# R4 — Review & hệ đánh giá

> **Trạng thái: ✅ XONG (2026-10-22).** Số đã chốt bằng `npm run probe:review` — xem §12.

> Đề bài: `00-YEU-CAU.md` §5 (T4.1–T4.4). Khung app Đánh giá + thẻ **Hồi Tâm Chuyển Ý** đã dựng ở R0.5 — phase này **đổ dữ liệu thật**.
> Số có `⏳` chốt bằng `npm run probe:review`.

## 0. Hiện trạng

| Đã có | Chưa có |
|---|---|
| `sim/reviews.ts`: `addReview`, `average`, `applyFix` | **Không chỗ nào gọi `addReview`** → list luôn rỗng |
| App Đánh giá: sao to, list, nút Hồi Tâm, trang sửa | Badge review mới, phản hồi, thông báo trong game |
| `HOI_TAM` trên vòng quay, `system.fix`, cap 3 | Chưa test được vì không có review |
| `service.ts`: `silentScore`, `sat`, `praise`/`overpriced`, `sick` | Không nối sang review |
| `flags.sickTotal` cộng dồn vĩnh viễn | Cửa sổ trượt 14 ngày, game over ATTP |

## 1. Flow

```
Phục vụ xong → tính sao của khách đó → lăn "có viết review không"
  có → xếp hàng, hiện sau 2–8 phút trong ngày → badge app Đánh giá + toast góc màn hình
Mỗi ngày thêm review nhiễu: nhầm quán hủ tiếu · đối thủ ác ý · spam
Tối: tổng kết hiện sao trung bình + số review mới
Sao TB ≤3 & >10 review đau bụng (14 ngày), hoặc >12 → điều tra ATTP → đóng cửa
```

## 2. Sao của một khách ⏳

Lấy sẵn từ `serveDish`, không thêm hệ mới.

```
sao = 5 − silentScore/S + (sat − 0,6)×W + priceStar[pick] − waitStage×P + ε
đau bụng → sao = 1–2 (lăn), food = true, không sửa được
```

| Hệ số | Đã chốt | Nghĩa |
|---|---|---|
| `S` | **35** (khởi điểm 25 — xem §12) | lỗi (sai món, rớt, sạn, thiếu nhân, nguội, sém) chia ra sao |
| `W` | 1,2 | khớp khẩu vị |
| `priceStar` | rẻ +0,3 · thường 0 · đắt −0,35 | thay `PRICE_FX.praise/overpriced` của R2 |
| `P` | 0,3 | mỗi bậc chờ lâu |
| `ε` | ±0,4 theo tính cách (`soi`, `nongTinh`) | khách khó tính chấm gắt hơn |

## 2b. Một lượt có nhiều yếu tố (T4.2)

Gom **tất cả** thứ đáng nhắc của lượt đó, rồi:

1. **Vế chính** = yếu tố nặng nhất *cùng chiều với số sao*. ≥4★ mở bằng điểm cộng, ≤3★ mở bằng điểm trừ.
2. **Vế trái chiều** = từ phía còn lại, nối bằng `mỗi tội` / `có điều` / `nhưng` / `mà`, hoặc `được cái` / `bù lại`. Chen vào **45%** số lần.

| Luật chặn mâu thuẫn | Nghĩa |
|---|---|
| Đã nói ra một lời chê thì **không còn 5★** | Không có "5★ — ngon, mà bánh sém một bên" |
| Trần sao tính trên **mọi** thứ đáng phàn nàn, không chỉ `defect` | Cho thêm nhân mà quên rửa tay vẫn ≤2★ |
| Lời kết không lặp ý câu lõi | Không có "không bao giờ quay lại, không quay lại nữa" |

`dau-bung` và `co-san` **không nhận vế trái chiều** — nhắc "được cho thêm nhân" cạnh "tôi nằm cả ngày" là vô duyên. Chốt với chủ dự án 2026-10-22: **bỏ bớt yếu tố là hợp lý**, khách thật cũng chỉ kể cái nặng nhất.

Trần sao: `co-san` 2★ · `tay-ban` 2★ · `do-cu` 3★ · `het-banh` 3★ · `dau-bung` 1–2★.

## 3. Ai chịu viết review ⏳

J-curve như đời thật: rất tệ và rất ngon mới viết, ở giữa thì im.

| Sao | 1 | 2 | 3 | 4 | 5 | đau bụng |
|---|---|---|---|---|---|---|
| Tỉ lệ viết | 0,50 | 0,35 | 0,12 | 0,18 | 0,30 | **0,40** (R0.7 đã chốt) |

~17 ổ/ngày → ~3 review/ngày → 14 ngày ≈ 45 review. Đủ để sao TB đứng yên mà vẫn nhúc nhích.

## 4. Nguồn review

| Nguồn | Tỉ lệ | Sao |
|---|---|---|
| Việc làm thật (§2) | phần còn lại | 1–5 |
| Nhầm quán hủ tiếu kế bên | 2% | 1–3 |
| Chủ xe bánh mì đối thủ chơi xấu | 5% | 1–2 |
| Spam vô nghĩa | 1% | ngẫu nhiên |
| Chỉ sao, không chữ | 18% | theo §2 |
| Tình huống hiếm (easter egg) | ~1% | tuỳ |

**Tám tình huống quanh quán** (thêm 2026-10-22, chủ dự án duyệt): không rửa tay · bị chen hàng · loa rao ồn · được cho thêm nhân · có trà đá · trời mưa vẫn mở · quán sắm đồ nghề mới · tới nơi hết bánh.
Mỗi cái móc vào cơ chế đã có (`DIRTY_HANDS`, `wasCut`, `LOA_RAO`, `freeExtra`, `visit.gaveTea`, lịch thời tiết, đơn đồ nghề, `turnAway`). Danh sách đầy đủ kèm điều kiện kích hoạt: `R4-DANH-GIA.md`.

- Đối thủ chỉ xuất hiện sau khi quán có tiếng (≥20 review ⏳) — mới có cớ chơi xấu.
- Mỗi review gộp **nhiều yếu tố** (ngon + đắt, rẻ + thiếu topping…) — lấy 1–2 lỗi nặng nhất + 1 điểm cộng.

## 5. Nội dung & văn phong

Chạy skill `research-giong-viet` **trước khi viết câu nào**. Ra `docs/revamp/R4-GIONG-REVIEW.md`: từ lóng, viết tắt, teencode, emoji, câu cụt, kiểu khen chê lẫn lộn.

Dữ liệu: `content/reviews/*.json` — mảnh câu theo `(yếu tố × persona × sao)`, ghép lại. Persona: sinh viên, dân công sở, cô chú lớn tuổi, food reviewer tự phong, khách quen. Tên người viết: khách có tên riêng thì giữ tên, khách vãng lai (gọi theo dáng trong quán) mượn một tên trong pool; avatar chữ cái (`chat.ts: avatar`).

## 5b. Danh sách review — kiểu Google Maps

Chơi 300 ngày là hàng nghìn review. **Không render hết.**

| Phần | Làm |
|---|---|
| Đầu trang | sao to, tổng số đánh giá, **biểu đồ phân bố 5→1★** (bấm vào thanh nào là lọc sao đó) |
| Lọc | chip: `Tất cả` · `Mới nhất` · `Cao nhất` · `Thấp nhất` · `5★ 4★ 3★ 2★ 1★` |
| Danh sách | render **20 review**, cuối trang nút `Xem thêm` → +20 |
| Trạng thái lọc | giữ trong `ctx.route`, không giữ qua lần mở app sau |

Lọc và sắp xếp chạy trên `reviews.list` (đã `unshift` nên sẵn thứ tự mới nhất) → `slice(0, n)`. Phân bố sao tính một lần mỗi lần render, không lưu.

## 6. Phản hồi (T4.3)

Như rep comment trên app social: comment khách, ngay dưới là comment của mình — thụt vào, avatar quán, không nhãn, không câu "đã phản hồi". Chỉ hiển thị, **không ảnh hưởng sao**. Lưu trong `Review.reply`.

Theo `VAN-PHONG-UI.md` §6 (V6: UI hiện cái đó, không kể cái đó). Cùng luật này phải dọn luôn trong phase:

| Chỗ | Hiện tại | Sửa |
|---|---|---|
| `reviewIntro.ts` | câu dắt tay khi chưa có đánh giá | khung rỗng của chính trang: tên quán, chỗ sao chưa có số, `0 đánh giá` |
| `noteApp.ts` | câu dắt tay khi chưa có note | danh sách rỗng |
| `system.ts` `NHAN_SAC` | kể cơ chế `kiên nhẫn của khách +1 giây, cộng dồn…` | chỉ `nhan sắc +1 (cấp n/12)` |

## 7. Thẻ sửa đánh giá — Hồi Tâm Chuyển Ý

Đã có `applyFix` + trang sửa. R4 làm nốt:

| Việc | Chi tiết |
|---|---|
| Nối vào review thật | Hiện chỉ sửa được review không `food` và chưa `edited` — giữ |
| Chặn lạm dụng | Sửa tự do 1–5★, nhưng **chỉ review trong 7 ngày gần nhất** (chốt 2026-10-22) |
| Cân bằng | `win: 2 / ~110` ≈ 2%/lượt quay, cap 3 thẻ. Đo lại ở §9: sửa 3 review 1★→5★ kéo sao TB lên bao nhiêu |
| Giọng | Lời Hệ thống theo skill `giong-he-thong` — đã viết, rà lại |

## 8. Game over ATTP (T4.4)

```
sickWindow = số review food trong 14 ngày gần nhất
thua nếu  (sao TB ≤ 3 và sickWindow > 10)  hoặc  sickWindow > 12
```

- Sao TB là trung bình trọn đời như Google Maps, nên quán lâu năm gần như chỉ chết bởi vế cứng — vế cứng hạ 15 → **12** (chốt 2026-10-23).
- Bỏ `flags.sickTotal` cộng dồn vĩnh viễn.
- Cảnh báo đọc được: sickWindow = 6 → tin nhắn "có người đăng bài"; = 10 → "phường xuống kiểm tra".
- Màn thua: dùng lại `BrokeScene` + `BrokeView` với `reason: "attp"` — quán niêm phong, mở laptop nộp lại CV (R0.5 T0.5.4). Cờ `flags.shutdown`, `shutdownDay`.

## 9. Việc làm

| # | Việc | File chính |
|---|---|---|
| 1 | Research giọng review | `R4-GIONG-REVIEW.md` |
| 2 | Chấm sao + tỉ lệ viết; bỏ `PRICE_FX.praise/overpriced` | `sim/reviews.ts`, `sim/service.ts` |
| 3 | Mảnh câu + ghép câu + persona + pool tên | `content/reviews/*.json`, `sim/reviews.ts` |
| 4 | Review nhiễu (hủ tiếu, đối thủ, spam, easter egg) | `sim/reviews.ts` |
| 5 | Hàng chờ hiện review trong ngày + toast + badge app | `sim/reviews.ts`, `PhoneView`, `StallScene` |
| 5b | Danh sách: phân bố sao, chip lọc, `Xem thêm` 20/lần | `reviewApp.ts` |
| 6 | Phản hồi kiểu rep comment | `reviewApp.ts`, `sim/reviews.ts` |
| 7 | Siết Hồi Tâm 7 ngày | `sim/reviews.ts`, `reviewApp.ts` |
| 7b | Dọn chữ thừa theo V6 (§6) | `reviewIntro.ts`, `noteApp.ts`, `sim/system.ts` |
| 8 | ATTP: cửa sổ 14 ngày, cảnh báo, màn đóng cửa | `sim/reviews.ts`, `day.ts`, `DayScene`, `BrokeView` |
| 9 | Tổng kết tối: sao TB + review mới | `EveningView` |
| 10 | Mô phỏng `npm run probe:review` | `tools/probe-review.ts` |
| 11 | Test | `tests/` |
| 12 | Chụp màn hình kiểm bằng mắt | — |

Mô phỏng phải ra: sao TB theo lối chơi (sạch / bẩn / đắt / rẻ), thời gian tới mốc sao 4★, tỉ lệ thua ATTP khi mua dỏm, mức sao Hồi Tâm kéo được.

## 10. Breaking

| Vỡ | Xử lý |
|---|---|
| `PRICE_FX.praise/overpriced`, `today.praise/overpriced` | Thay bằng `priceStar` trong công thức sao; sửa `EveningView`, `probe-price` |
| `flags.sickTotal` | Bỏ; đếm từ `reviews.list` |
| `ReviewState` thiếu `reply` | Thêm trường tuỳ chọn, save cũ mặc định rỗng |
| `ReviewState` thêm `rolls` (số lượt đã lăn) và `seen` (mã đánh giá cuối đã xem, cho badge) | `normalize()` điền 0 cho save cũ, không tăng `SCHEMA_VERSION` |
| `BrokeView` chỉ biết phá sản | Thêm `reason` |

## 11. Chưa làm ở phase này

| Việc | Vì sao |
|---|---|
| Sao → số khách `Y(x)` | R5 |
| Mốc truyện theo sao (tin tức, sếp cũ comment) | R0.5 T0.5.7 đã có hệ tin nhắn; nối mốc ở R5 cùng mô phỏng |
| Mốc tiền thắng | R5 |

---

## 12. Kết quả mô phỏng (`npm run probe:review -- 30 5`)

30 ngày × 5 hạt giống, bot greedy. Sao là **sao thật** của hệ đánh giá, không còn proxy như R2.

| Lối chơi | Sao | rv/ngày | viết/lượt | 1★ | 2★ | 3★ | 4★ | 5★ | đau bụng | đóng cửa |
|---|---|---|---|---|---|---|---|---|---|---|
| bẩn · giá rẻ | **1,92** | 5,0 | 31% | 50% | 22% | 15% | 13% | 0% | 47% | **100%** |
| sạch · giá thường | 3,74 | 4,5 | 25% | 11% | 8% | 22% | 14% | 45% | 0% | 0% |
| thường · giá rẻ | 3,92 | 4,5 | 25% | 7% | 6% | 16% | 29% | 42% | 0% | 0% |
| xịn · giá đắt | **4,01** | 4,3 | 25% | 6% | 6% | 9% | 39% | 40% | 0% | 0% |

> Đo lại 2026-10-23 sau khi sửa: khách chỉ chê loa khi quán thật sự có loa, và chuyện quanh quán (mưa, trà đá, đồ mới) chỉ 35% số lời khen lấy làm vế chính.

Khớp đề bài T5.1: chơi bẩn **chết 100% trong 30 ngày**, chơi xịn là **đường thắng được, không bị phạt chết**. Không mốc giá nào thống trị.

### Ba lần chỉnh trong quá trình đo

**1. `S` 25 → 35.** Với 25, lối chơi sạch chỉ được 3,34★ — phạt quá tay người làm đúng.

**2. Bỏ trần cứng 3★ của `do-cu`.** Đo ra **54% số ổ** dính `TASTE_OFF` khi mua hàng **thường**:

| Lỗi | % số ổ đã giao |
|---|---|
| `TASTE_OFF` | **54%** |
| `MISSING` | 6% |
| `WRONG_RATIO` | 0% |

Nguyên nhân là **hàng để qua ngày**, không phải hàng thường kém: `tasteThreshold = 0,18 − 0,10×soi`; hàng thường (`taste 0,92`) hụt 0,08 nên không chạm ngưỡng ai, nhưng pate hôm qua (×0,95) hụt **0,126** → vượt ngưỡng của mọi khách `soi ≥ 0,54`. Kho lấy lô cũ trước nên mỗi sáng vài ổ đầu đều dùng hàng tồn.

Cơ chế đúng, **lời viết sai mức**: `do-cu` được viết ở mức ôi thiu trong khi `TASTE_OFF` chỉ nghĩa là *kém tươi*. Đã hạ giọng toàn bộ nhóm câu và bỏ trần cứng → 3★ từ 35% xuống 12%.

**3. Sao bám theo chất lượng, phạt luỹ tiến.** `TASTE_OFF` là lỗi **nhị phân** nên hàng dỏm (0,72) và hàng thường qua đêm (0,87) bị phạt y hệt → hàng dỏm vẫn được 25% khách cho 4★. Không sửa hệ lỗi của P1 (nó còn nuôi phản ứng mặt khách và thoại); thay vào đó cộng thẳng vào công thức sao:

```
sao −= ((1 − chất_lượng − 0,08) / 0,2)² × 2,2
```

Bình phương vì hụt gấp đôi thì khó chịu gấp **bốn**:

| Hàng | Sao TB |
|---|---|
| ngon (1,00) | 4,73 |
| thường mới (0,92) | 4,73 |
| thường qua đêm (0,87) | 4,56 |
| dỏm (0,72) | 2,45 |
| thường để 2 ngày (0,69) | 1,86 |
| dỏm qua đêm (0,65) | 1,00 |

Hàng dỏm xuống còn 13% đạt 4★ (trước 25%). Và **để hàng thường quá 2 ngày còn tệ hơn mua hàng dỏm mới** — tủ mát có giá trị thật.

### Còn phải đo bằng người thật

- **1★ ở lối chơi sạch còn 11%.** Đây là lỗi thật của bot greedy (giao sai món, dùng hàng tồn), không phải lỗi công thức. Người chơi thật sẽ thấp hơn — cần telemetry.
- Lối chơi sạch 3,55★ là mức của **bot**, không phải trần của người chơi.

## 13. Chờ R5

| Việc | Vì sao |
|---|---|
| Sao → số khách `Y(x)` | R5 đã có sao thật để nhân `R` |
| Mốc truyện theo sao / số đánh giá (tin tức, sếp cũ comment) | Nối cùng mô phỏng R5 |
| Mốc tiền thắng | R5 |
