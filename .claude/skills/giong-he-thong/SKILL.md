---
name: giong-he-thong
description: Viết lời của "Hệ thống Bán Bánh Mì" theo đúng giọng truyện hệ thống (bản dịch convert truyện mạng Trung Quốc) — thông báo, nhiệm vụ, phần thưởng, tên kỹ năng/vật phẩm, vòng quay điểm danh. Dùng khi viết hoặc sửa bất kỳ chữ nào Hệ thống nói trong app Hệ thống, hướng dẫn ngày 1, thông báo thưởng.
---

# Giọng Hệ thống

Mục tiêu: người từng đọc truyện hệ thống đọc là **nhận ra liền**, rồi bật cười vì cái giọng hoành tráng đó đang nói về… ổ bánh mì.
Công thức hài: **khuôn hệ thống nghiêm trang + nội dung đời thường nhỏ xíu.**

## 1. Khuôn bắt buộc

| Thứ | Viết | Ví dụ |
|---|---|---|
| Tiếng báo | `Keng!` (hoặc `Đinh!`) mở đầu mọi thông báo | `Keng!` |
| Gọi người chơi | **ký chủ** (không "bạn", không "em", không tên) | `Chúc mừng ký chủ…` |
| Nhận thưởng | `Chúc mừng ký chủ thu được [tên] ×[số].` | `Chúc mừng ký chủ thu được Thần Hành Phù ×1.` |
| Tên vật/kỹ năng | Trong `【】` | `【Thần Hành Phù】` |
| Liệt kê | `Phần thưởng một: … / Phần thưởng hai: …` | |
| Hỏi | Kiểu convert: `…, phải chăng [làm]?` | `Mở ra vòng quay vận khí, phải chăng quay?` |
| Điểm danh | `đánh dấu thành công` | `Ký chủ đánh dấu thành công ngày 3.` |
| Lượng từ | `một trương` (thẻ), `một khỏa` (viên), `một phần` | `Thẻ giảm giá một trương` |
| Phẩm cấp | Trong `( )` sau tên | `(Sơ cấp)` `(Phổ thông)` `(Hiếm)` |
| Nhiệm vụ | `Nhiệm vụ: … · Phần thưởng: … · Thất bại: …` | `Thất bại: quay lại xin việc.` |

## 2. Thẻ kỹ năng / vật phẩm

```
Keng! Chúc mừng ký chủ thu được kỹ năng bị động 【Tên Hán Việt】(Phẩm cấp).
Hiệu quả: [con số cụ thể].
Thời hạn: [hôm nay / dùng một lần].
Mô tả: [MỘT câu ngắn, kiểu châm ngôn / câu truyện mạng].
```

- **Tên:** Hán Việt kêu, 3–5 chữ, nghe như võ công/bảo vật. Càng kêu so với tác dụng càng vui.
  Ví dụ: Bất Nhiễm Trần Thể · Thần Hành Phù · Hồi Tâm Chuyển Ý · Tiểu Kim Khố · Mỹ Nhân Đứng Quầy.
- **Hiệu quả:** luôn là **số trần trụi**: `+2 giây`, `10 → 20 ổ`, `−10%`. Hệ thống không giải thích cảm xúc.
- **Mô tả:** châm ngôn/meme truyện mạng, hoặc câu khô khan kiểu máy. Một câu.

## 3. Tính cách Hệ thống

- **Lạnh, như máy, như văn bản hành chính.** Nói số, không nói cảm xúc.
- **Hài nằm ở chỗ nghiêm túc quá mức**, không ở chỗ pha trò. Thỉnh thoảng một câu tỉnh bơ: `Hệ thống đã cố gắng.` · `Hệ thống không tiếp nhận khiếu nại.`
- Gọi việc nhỏ bằng từ lớn: rửa tay = `tẩy trần`, nhập hàng = `thu thập tài nguyên`, chi nhánh 2 = `mục tiêu tối thượng`.
- Không dỗ dành, không động viên kiểu dễ thương.

## 4. Cấm — dấu hiệu "AI viết"

| Đừng | Vì |
|---|---|
| "toả ra năng lượng", "có cảm tình", "chịu chờ thêm chút", "hôm nay vận khí bình thường" | Văn mô tả mềm, giải thích cảm xúc → không phải giọng máy |
| Câu giải thích lý do cơ chế ("vì… nên…") | Hệ thống chỉ báo kết quả |
| Tính từ dễ thương, "nha", "nè", emoji | Hệ thống không phải người |
| Câu dài hơn ~20 chữ | Thông báo hệ thống ngắn, cụt |
| Đổi khuôn liên tục | Khuôn lặp lại **là** chất hệ thống — giữ khuôn, đổi nội dung |

Phép thử: *bỏ chữ "bánh mì" đi, câu này có đặt được vào một truyện tu tiên không?* Được → đúng giọng.

## 5. Văn phong

- Đây là **giọng của một nhân vật** (Hệ thống), nên được phép lệch `docs/VAN-PHONG-UI.md`. Nút bấm và nhãn quanh nó vẫn viết phổ thông.
- Không giọng Nam, không teencode.
- Kiểm lằn ranh như mọi nội dung: `src/content/redlines.json`.

## 6. Nguồn khuôn

Truyện hệ thống bản dịch trên các trang truyện mạng (metruyenchu, bachngocsach…): "keng", "túc chủ/ký chủ", "Chúc mừng túc chủ thu được…", "khen thưởng một:", "phải chăng lựa chọn mở ra", "đánh dấu thành công", "thẻ một trương", "tân thủ đại lễ bao".
Muốn thêm khuôn → đọc thêm chương đầu các truyện thể loại *hệ thống đánh dấu / rút thưởng*, trích khuôn, **không chép nguyên văn**.

## 7. Khuôn thêm (đã dùng trong game)

| Tình huống | Khuôn |
|---|---|
| Chạm giới hạn cấp | `Keng! [Chỉ số] ký chủ đã đạt cảnh giới [Tên Cảnh Giới] (+[số]). Không thể [động từ] hơn nữa.` rồi `Tự động chuyển hoá thành 【…】.` — vd. `Nhan sắc ký chủ đã đạt cảnh giới Nghiêng Nước Nghiêng Thành (+15 giây). Không thể xinh hơn nữa.` |
| Thẻ đầy | `Thẻ đã đạt giới hạn 3 trương. Tự động chuyển hoá thành 【Tiền Lẻ Trong Túi Áo】.` |
| Cộng dồn | `Hiệu quả: [chỉ số] +1 (cấp N/tối đa). … vĩnh viễn, cộng dồn.` |
| Quà vật chất | `Hiệu quả: Nhận ngay [số] [đơn vị] [món].` · `Mô tả: Của trời cho.` |
| Miễn phí trong ngày | `Hiệu quả: Chi phí cố định hôm nay: 0đ.` · `Thời hạn: hôm nay.` |

> Ghi chú: công cụ tìm kiếm không tra được truyện Việt cho các khuôn này (2026-10-21), khuôn dựa trên giọng convert đã có ở mục 1–4.
