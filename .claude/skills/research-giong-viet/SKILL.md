---
name: research-giong-viet
description: Research cách người Việt thật nói chuyện, comment, đánh giá trên mạng (Facebook, TikTok, Instagram, Threads, Google Maps, ShopeeFood/GrabFood…) trước khi viết thoại, review, comment, bark trong game. Dùng khi viết hoặc sửa bất kỳ câu nào do nhân vật/khách nói ra, nhất là app đánh giá sao.
---

# Research giọng nói người Việt thật

Mục tiêu: câu trong game nghe như **người thật đang gõ comment hôm nay**, không như nhà văn viết, không như phim năm 1990.

## 1. Nguyên tắc giọng

- **Tiếng Việt đời thường, hiện đại.** Không bắt buộc đúng giọng miền Nam — người Sài Gòn bây giờ gõ comment lẫn đủ vùng miền.
- Giọng Nam chỉ giữ phần **còn dùng thật** (`nha`, `nè`, `hông`, `dzậy`, `quá trời`, `xỉu`…).
- **Cấm giọng Nam cổ, ít dùng:** `biểu` (= bảo), `mần`, `đặng`, `hổm rày`, `thiệt tình hổng biết`, `ăn nói chi kỳ`… Phép thử: *người 18–30 ở TP.HCM giờ có gõ câu này không?* Không chắc → bỏ.
- Comment thật thường: thiếu chủ ngữ, câu cụt, viết tắt, teencode, emoji, sai chính tả có chủ ý, khen chê lẫn lộn, cà khịa, kể lể, tag bạn bè.

## 2. Nguồn — ưu tiên theo thứ tự

1. **Comment thật dưới bài/video về đồ ăn:**
   - Facebook: fanpage quán ăn, group review ăn uống (vd. các group review ăn uống Sài Gòn), bài phốt quán.
   - TikTok: video food review, mukbang, "ăn thử quán…", video phốt quán. Đọc phần comment.
   - Instagram, Threads: post quán ăn, reel review.
2. **Review nền tảng:** Google Maps (quán bánh mì, xe bánh mì), ShopeeFood, GrabFood, Foody.
3. **Dataset công khai** (bổ sung số lượng, không thay nguồn 1):
   - AIVIVN 2019 — review Foody (sentiment).
   - UIT-ViHSD, UIT-ViCTSD — comment mạng xã hội.
   - ViSpamReviews — review TMĐT.
   - Tìm thêm trên Hugging Face / GitHub với từ khoá `vietnamese review`, `vietnamese comment`, `vietnamese social media`.
4. Bài viết phân tích ngôn ngữ mạng, teencode, trend từ lóng năm hiện tại.

Công cụ: WebSearch/WebFetch cho trang công khai. Trang cần đăng nhập (Facebook, TikTok, Insta) → dùng Chrome (skill `claude-in-chrome`), mở post, mở/cuộn comment, đọc.

## 3. Quy trình

1. **Xác định nhu cầu**: viết cho tình huống gì (review bánh ngon, chê giá, đau bụng, rớt bánh, nhầm quán hủ tiếu, đối thủ chơi xấu, phản hồi chủ quán…), persona nào (sinh viên, dân văn phòng, shipper, mẹ bỉm, ông chú, Gen Z…).
2. **Thu mẫu**: mỗi tình huống ≥ **30 comment thật**, từ ≥ **3 nền tảng**. Ghi nguồn (URL, nền tảng, ngày xem).
3. **Ẩn danh**: bỏ tên, avatar, tag người thật. Không lưu thông tin cá nhân.
4. **Rút pattern** thành bảng:
   - Từ/cụm hay dùng (khen, chê, cà khịa, cảm thán).
   - Viết tắt, teencode, emoji đi kèm.
   - Cấu trúc câu (cụt, đảo, gộp nhiều ý: "ngon mà mắc", "đã mắc còn ít nhân").
   - Độ dài điển hình, cách mở/kết.
   - Khác biệt theo persona và theo số sao.
5. **Viết nội dung game**: viết lại theo pattern, **không copy nguyên văn** comment của người thật.
6. **Tự chấm**: đọc to từng câu — giống comment thật không? có từ cổ không? có trùng khuôn không? Nhiều câu cùng 1 khuôn → viết lại cho đa dạng.
7. **Kiểm lằn ranh**: không chửi tục nặng, miệt thị vùng miền/giới/dân tộc vượt `src/content/redlines.json` và `tools/lr4-blocklist.txt`. Chạy `tools/lint-lines.ts` nếu nội dung nằm trong `content/`.

## 4. Đầu ra

- Corpus + bảng pattern: `docs/research/giong-noi/<chu-de>.md` (nguồn, mẫu đã ẩn danh, bảng pattern, danh sách từ cấm).
- Nội dung game viết xong ghi rõ đã dựa trên file research nào.
