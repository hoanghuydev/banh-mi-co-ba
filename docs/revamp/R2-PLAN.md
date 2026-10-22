# R2 — Topping, giá bán, mở khoá

> **Trạng thái: ✅ XONG (2026-10-21)**, trừ phần chờ R4 / R5 ở §8.

> Đề bài: `00-YEU-CAU.md` §3 (T2.1–T2.4). Chốt với chủ dự án 2026-10-21: **giữ pate ở mọi ổ** · khách **bỏ đi vì giá thật**, phần 4–5★ / chê giá **ghi sổ** (R4 nối review) · mở khoá **theo ngày**, xong ngày 10.
> Số có `⏳` chốt bằng `npm run probe:price`.

## 1. Flow

```
Sáng: món mới tới ngày thì mở → báo trên màn hình → món vào bảng menu, hàng của món vào Thực phẩm
Bảng menu (E ở vách): mỗi món chọn một trong ba giá (UI chỉ hiện số tiền, không ghi tác động)
Khách ghé → thấy món + giá → có thể bỏ đi vì giá (bong bóng giá trên đầu) → ăn → ghi sổ: khen (4–5★) / chê giá
Tối: tổng kết hiện số khách bỏ đi vì giá
```

## 2. Mở khoá ⏳

Món sau mở thì giá cao hơn → thứ tự mở theo giá nhân tăng dần.

| Ngày | 1 | 2 | 4 | 6 | 8 | 10 |
|---|---|---|---|---|---|---|
| Mở | ốp la | pate | xíu mại | chả lụa | thịt nguội | đầy đủ · bánh mì không |

- Hàng của món chưa mở **ẩn** khỏi Thực phẩm và khỏi rổ tối thiểu. Mở rồi là tuỳ chọn nhập.
- Thay `sim/ease.ts` (mở 6 món / 6 ngày) bằng bảng này; bỏ phần còn lại của ease nếu không ai dùng.

## 3. Ba mốc giá (nghìn đồng)

Rẻ = thường ×0,8 · Đắt = thường ×1,25 (đề bài ví dụ ×0,75 / ×1,5 làm đắt thống trị — xem §7).

| Món | Rẻ | Thường | Đắt |
|---|---|---|---|
| ốp la | 16 | 20 | 25 |
| pate | 18 | 22 | 28 |
| xíu mại | 20 | 25 | 31 |
| chả lụa | 22 | 27 | 34 |
| thịt nguội | 23 | 29 | 36 |
| đầy đủ | 27 | 34 | 43 |
| bánh mì không | 8 | 10 | 12 |

Xin thêm nhân trên ổ đầy đủ: **+8k** (cũ: bậc "đặc biệt"). Bỏ `Tier`, `menu_k`.

## 4. Tác động của giá

| Mốc | Bỏ đi vì giá | Thêm khả năng 4–5★ | Bị chê giá (1–2★) |
|---|---|---|---|
| Rẻ | 0% | +20% | 0% |
| Thường | 5% | +5% | 0% |
| Đắt | 15% | 0% | 12% |

- Bỏ đi: lăn lúc khách tới (dòng số riêng `price:`, không lệch dãy số cũ). Không tính `lost`.
- 4–5★ / chê giá: lăn lúc phục vụ xong, cộng `today.praise` / `today.overpriced`. R4 đổi thành review.

## 5. Việc làm

| # | Việc | File chính |
|---|---|---|
| 1 | Data: `unlockDay` + 3 giá mỗi món; bảng tác động giá | `menu.json`, `econ.json` |
| 2 | Mở khoá theo ngày; lọc rổ khách, hàng, rổ tối thiểu | `sim/unlock.ts`, `order.ts`, `shopApp.ts`, `day.ts` |
| 3 | Lưu mốc giá đã chọn; tính giá theo mốc | `core/save.ts`, `sim/econ.ts` |
| 4 | Khách bỏ đi vì giá, ghi sổ khen / chê giá | `sim/service.ts` |
| 5 | UI: chọn mốc giá trên bảng menu; tin mở món; dòng tổng kết tối | `MenuBoardView`, `EveningView`, `StallScene` |
| 6 | Tour ngày 1: đặt hàng cho ốp la (bỏ thịt nguội, thêm trứng) | `sim/tour.ts` |
| 7 | Mô phỏng 3 mốc giá + số khách theo sao (proxy) — `npm run probe:price` | `tools/probe-price.ts` |
| 8 | Sửa / thêm test | `tests/` |

## 6. Breaking

| Vỡ | Xử lý |
|---|---|
| `Tier`, `tierOf`, `loafPriceVnd(tier)`, `menu_k` | Thay bằng `dishPriceVnd(intent, pick)`; sửa `p3-econ`, `p1-menu` |
| `ease.mon` | Thay bằng `unlock.ts`; sửa `p5-tap-tay` |
| Tour ngày 1 đặt thịt nguội | Đổi sang trứng; sửa `tour`, `r07-suppliers` |
| Save cũ | Thiếu `menu.price` → mặc định Thường. Không bump schema |

## 7. Kết quả mô phỏng (`npm run probe:price -- 20 6`, đã mở hết món, bot greedy)

Sao chưa có thật nên dùng proxy: sao ≈ 3,2 + 2,5 × (khen − chê) · số khách nhân `R(sao)` theo bảng đề bài T5.2.

| Mốc | Bán/ngày | Bỏ đi vì giá | Khen | Chê giá | Lời thô | Lời theo sao |
|---|---|---|---|---|---|---|
| Rẻ | 16,5 | 0 | 21% | 0% | 59k | **124k** |
| Thường | 15,9 | 0,7 | 5% | 0% | 132k | **154k** |
| Đắt | 14,5 | 2,2 | 0% | 12% | 205k | **148k** |

- Số đề bài (đắt bỏ đi 10%, chê 10%, giá ×1,5): đắt thắng rõ (196k vs 154k vs 128k) → thu hẹp khoảng giá, nâng bỏ đi / chê lên 15% / 12%.
- Hiện: Thường ≈ Đắt (đắt lời thô cao hơn nhưng sao tụt), Rẻ thấp hơn ~19%. Không mốc nào thống trị.
- Vào game từ ngày 1 (bot greedy, mốc Thường): lời ~104k → 134k → 174k … ~270k khi mở hết món (ngày 10–12). Có lời từ ngày 1.

## 8. Chờ R4 / R5

| Việc | Vì sao |
|---|---|
| Sao thật từ `praise` / `overpriced` | Cần hệ review (R4) |
| Rẻ đang thấp hơn Thường ~19% | Rẻ chỉ lời khi sao kéo khách tích luỹ (R5 `Y(x)`); đo lại khi có sao thật |
| Mốc ngày mở khoá + mốc thắng | Chốt lại cùng mô phỏng R5 (đề bài: không thắng trước khi mở hết) |
| `sim/ease.ts` còn khoá độ khó 6 ngày đầu (lời dặn, sức chờ, quay đầu) | Không còn khoá món; chỉnh nhịp cùng R5 |
