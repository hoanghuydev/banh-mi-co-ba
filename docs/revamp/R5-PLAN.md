# R5 — Vòng đời & số khách

> **Trạng thái: ✅ XONG (2026-10-23).** Số đã chốt bằng `npm run probe:life` — xem §6.
> Đề bài: `00-YEU-CAU.md` §6 (T5.1, T5.2) + ba việc R4 để lại (`R4-PLAN.md` §13).

## 0. Hiện trạng trước R5 (đo 2026-10-23, `npm run sim -- --days 60 --policy greedy`)

| Thứ | Số đo |
|---|---|
| Khách/ngày | 16–20, **phẳng** từ ngày 1 tới 60 — `service.buildSchedule` rải lượt theo khoảng thời gian, không đọc sao |
| Lời/ngày | ~300k (hàng thường, giá thường) |
| Tiền ngày 60 | 15,7tr → **50tr ≈ ngày 170 ≈ 29 giờ chơi** |
| Trần phục vụ | bot ăn 7,7 trong 10 phút thật của một ngày để bán 19 ổ → **~25 ổ/ngày là trần**, cầu hơn mức đó chỉ thành khách bỏ đi |
| Trần 40 ngày | đã bỏ. Nhưng `CAL.weather` có 40 phần tử và `calDay` **quay vòng** → thời tiết + sự kiện lặp lại mỗi 40 ngày |
| Mốc thắng | **chưa có** — không chỗ nào đọc `money.cash` để kết ván |
| `average(w)` | trung bình **trọn đời**; chưa có đánh giá nào thì trả `0` |

## 1. Flow

```
Sáng: sao (cửa sổ 30 ngày) → R → Y(ngày) lượt khách → lịch khách của buổi bán
Tối:  tiền ≥ mốc thắng → màn thắng, hết ván
Mốc sao / số đánh giá → tin nhắn (Linh, Huy, sếp cũ)
```

## 2. T5.2 — Số khách theo sao

Giữ hình dạng công thức đề bài, **nền và độ dốc đo lại**:

```
Y(x) = min(CAP, B0 + floor((x−1)/K)) × R(sao) × wx × gear × crowdMul × (1 + ε)
```

| Tham số | Ghi chú |
|---|---|
| `B0` | **14** — giữ kinh tế đã cân ở R2/R0.7/R4; số đề bài (5) kéo sập cả bảng giá |
| `K` | **5** — ngày 60 chạm trần |
| `CAP` | **25** — quầy chỉ phục vụ nổi chừng đó một buổi; cầu hơn mức đó thành khách bỏ đi |
| Trần khách quen | **60%** số khách của ngày — không thì có ngày 10/13 NPC ghé, khách lạ còn một người |
| `wx`, `gear`, `crowdMul` | hệ số thời tiết / đồ nghề / sự kiện đã có trong `buildSchedule`, giữ nguyên |
| `ε` | ±10% |

**R theo sao** — bảng đề bài, nội suy thẳng giữa hai mốc (3,7★ → 0,90):

| Sao | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| R | 0,2 | 0,4 | 0,7 | 1,2 | 1,3 |

- Dưới **10 đánh giá** → `R = 1`: quán mới chưa ai biết, không phạt cũng không thưởng. (`average` trả 0 ⇒ nếu đọc thẳng thì ngày 1 có 1 khách.)
- Sao nuôi R lấy từ **cửa sổ 30 ngày gần nhất**, không phải trọn đời — trọn đời thì sau ~200 đánh giá sao đứng cứng, sửa chất lượng không thấy khách lên. App Đánh giá vẫn hiện sao trọn đời kiểu Google Maps.
- Sáu ngày đầu đã có `easeOf` làm nhẹ; `B0` phải tính kèm, không cộng dồn hai lớp giảm.

**Chỗ nối:** `service.buildSchedule` — vòng rải theo khoảng thời gian đổi thành rải **đúng Y lượt**: chia đều trong ba khung (mới dọn hàng 10% · cao điểm 60% · vãn 30%) rồi lắc nhẹ, không để cao điểm có lỗ trống hai mươi phút. Lượt NPC quen giữ `rollVisit`, tính vào Y, trần 60%.

## 3. T5.1 — Mốc thắng

- `src/sim/win.ts`: `winCheck(w)` — `money.cash >= WIN_VND` → `flags.won`, `flags.wonDay`. Gọi ở `DayScene` `evening:done`, **trước** `markShutdown`/`markBroke`.
- Mốc phải cao hơn tiền kiếm được tới ngày 16 (`LAST_UNLOCK_DAY`) — không thắng trước khi mở hết món.
- Màn thắng: `WinScene` + `ui/win/WinView.ts` theo khuôn `BrokeScene`/`BrokeView`: số tổng kết (ngày, tổng ổ, sao, số đánh giá), vài tin nhắn sáng hôm sau, nút **Về menu** / **Chơi lại**.

**Mốc: 30tr** (`econ.json: win_k`, không nhân `scale`). Đo thật ở §6: 97–131 ngày, 15–21 giờ. Thắng là **hết ván**, không có nút bán tiếp.

## 4. Mốc truyện theo sao (R4 §13)

Sáu tin nhắn, `when(w)` như `content/phone/events.ts` đang làm:

| Mốc | Ai nhắn |
|---|---|
| 4★ lần đầu (≥20 đánh giá) | Linh |
| 100 đánh giá | Huy |
| 4,5★ (≥50 đánh giá) | sếp cũ vào comment |
| sao tụt dưới 3★ | Huy cà khịa |
| tiền đạt 80% mốc thắng | mẹ |
| 7 ngày liền không có đánh giá 1–2★ | Linh |

Giọng: skill `research-giong-viet`; lời Hệ thống dùng `giong-he-thong`.

## 5. Việc làm

| # | Việc | File chính |
|---|---|---|
| 1 | `demandOf(w)`: sao cửa sổ 30 ngày → R nội suy → Y | `sim/demand.ts` (mới), `sim/reviews.ts` |
| 2 | `buildSchedule` rải đúng Y lượt, nặng cao điểm | `sim/service.ts` |
| 3 | `dayDeps` đưa Y xuống `Service` | `sim/day.ts` |
| 4 | Mốc thắng + cờ + chặn ở `evening:done` | `sim/win.ts` (mới), `scenes/DayScene.ts` |
| 5 | Màn thắng | `scenes/WinScene.ts`, `ui/win/WinView.ts` |
| 6 | Sáu tin nhắn mốc sao | `content/phone/events.ts` |
| 7 | Bot mua hàng theo Y dự báo (bỏ `buyLoaves: 20` cố định) | `sim/headless.ts` |
| 8 | Mô phỏng chốt số | `tools/probe-life.ts` (mới) |
| 9 | Test | `tests/r5-demand.test.ts`, `tests/r5-win.test.ts` |
| 10 | Chụp màn hình màn thắng, soi theo `.claude/CLAUDE.md` §3.2 | — |

## 6. Kết quả mô phỏng (`npm run probe:life -- 140 2`)

Mốc thắng 30tr · tối đa 140 ngày × 2 hạt giống · bot greedy. Nền khách: n1=14 · n20=17 · n40=21 · n60=25 (trần).

| Lối chơi | Kết | Ngày | Giờ | Sao | ổ/ngày | khách/ngày |
|---|---|---|---|---|---|---|
| xịn · giá đắt | thắng 2/2 | **97** | 15,2 | 3,97 | 17,6 | 22,8 |
| sạch · giá thường | thắng 2/2 | **106** | 16,8 | 3,82 | 19,0 | 21,8 |
| thường · giá rẻ | thắng 2/2 | **131** | 21,1 | 4,02 | 22,2 | 24,5 |
| bẩn · giá rẻ | **đóng cửa 2/2** | 12 | 1,9 | 1,90 | 7,7 | 8,8 |

Khớp T5.1: chơi bẩn chết 100% trước ngày 13 · chơi xịn là đường thắng **nhanh nhất**, không bị phạt chết · không mốc giá nào thống trị (chênh nhau 34 ngày, cả ba đều về đích).

Còn phải đo bằng người thật: giờ chơi là nhịp của **bot**, mỗi ngày ~10 phút máy. Người chơi chậm hơn → cần telemetry.

## 7. Breaking

| Vỡ | Xử lý |
|---|---|
| `buildSchedule` đổi cách rải | `p1-balk` đổi sang **dò ngày** thay vì neo ngày 12 (lịch khách đổi theo cân bằng là lỗi lặp lại); `p2-xe` dời sang ngày 17 |
| Khách bỏ đi vì **giá** đang mượn mã `BALKED` | Tách thành `PRICE_WALK` — hai chuyện khác nhau, và lưới thoại "đông quá" không được nói với người chê giá |
| `average(w)` còn dùng cho ATTP + app | giữ; R đọc hàm mới `recentStars(w, 30)` |
| `POLICIES.greedy.buyLoaves` | bỏ, bot mua theo Y → số của `probe:review`, `probe:price` đo lại |
| `SaveFile` thêm `flags.won`, `flags.wonDay` | `flags` là record tự do nên save cũ vào thẳng, không đụng `normalize()` |
| Lịch 40 ngày quay vòng | giữ (thời tiết + sự kiện lặp lại); không mở rộng ở R5 |

## 8. Nghiệm thu

- [x] Sao thấp kéo khách xuống, sao cao kéo lên — `tests/r5-demand.test.ts`: 5★ ra khách hơn gấp đôi 2★ cùng ngày.
- [x] Ván mới chưa có đánh giá: hệ số 1, không rơi về một hai khách.
- [x] Đánh giá cũ ngoài cửa sổ 30 ngày không khoá quán lại.
- [x] Chạm mốc tiền ở buổi tối → màn thắng, không rơi vào `broke`.
- [x] Load save cũ (không có `flags.won`): vào game được, không lỗi.
- [x] `probe:life` in đủ kết quả ở §6; chơi bẩn chết 2/2.
- [x] Màn thắng chụp cả màn rộng lẫn màn hẹp 390px — số không tràn, nút đủ to.
