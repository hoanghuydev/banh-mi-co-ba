# Plan — Viết lại thoại Anh Bảo

> Làm theo skill `research-giong-viet`. Thuộc task **T6.2** (`00-YEU-CAU.md`).
> Mục tiêu: Bảo nghe như **sinh viên hướng nội năm 2026**, không như phim năm 1990.

---

## 1. Phạm vi

| File | Có gì | Số câu |
|---|---|---|
| `src/content/talks/anh-bao.json` | 10 cuộc thoại | 10 câu mở · 124 câu người chơi · 114 câu Bảo |
| `src/content/rules/anh-bao.json` | Bark phản ứng | 4 câu (còn lại im lặng có chủ ý — giữ im) |
| `src/content/arcs.ts` (`ANH_BAO`) | Câu gọi món theo ngày | 7 câu |
| `src/content/season/knowledge.json` (ML-11, ML-12) | Câu nói gắn tri thức | 2 câu |

**Không đụng:** chuyện của nhân vật (hết tiền cuối tháng, dịch truyện tiếng Nhật, làm thêm tới 2 giờ sáng, nói chậm, ăn cay giỏi). Chỉ đổi **cách nói**.

---

## 2. Cần chốt trước khi viết

| # | Câu hỏi | Đề xuất |
|---|---|---|
| Q1 | Bảo gọi chủ quán là gì? Revamp có "chị chủ", "bé bán bánh mì" → chủ quán trẻ | Đổi **"cô" → "chị"** |
| Q2 | Viết lại luôn **câu của người chơi** trong cây thoại? (đang "nghen", "hổng", "chớ") | **Có** — cùng file, cùng lỗi |
| Q3 | Revamp Phase 4 bỏ cảm tình (`rel`, `mem`, `tier`) | Lần này **chỉ đổi chữ, giữ cấu trúc**. Cấu trúc sửa ở Phase 4 |
| Q4 | Tật "Dạ" đầu câu | **Giữ** nhưng bớt — arc `bao.noi` ("hông có dạ đầu câu") sống nhờ nó. Bỏ kiểu chồng "Dạ. Dạ em…" |

---

## 3. Research

### 3.1. Đã làm (khảo sát nhanh)
- Slang trend chết nhanh: "6-7" vừa là từ của năm 2025 đã bị xếp đầu danh sách "nên bỏ" 2026.
  → **Không nhét trend vào thoại.** Game sống nhiều năm, trend sống vài tháng.
- Thứ bền hơn trend: viết tắt `ko/j/hok`, từ đệm `á, nha, ha, luôn, ghê`, pha tiếng Anh (`deadline dí`, `sorry`), câu tối giản ("Mệt, khỏi đi").
- Cụm hợp Bảo nhưng **chỉ dùng tối đa 1 lần**: "hướng nội hết phần đời còn lại" (ngượng quá muốn biến mất), "+1 máy bị deadline dí".
- Báo/blog chỉ cho danh sách từ, **không cho câu thật** → phải lấy comment thật (bước 3.2).

### 3.2. Còn phải làm
| Nguồn | Tìm gì | Mẫu tối thiểu |
|---|---|---|
| TikTok | Video "sinh viên cuối tháng", "đi làm thêm", "người hướng nội đi mua đồ ăn" → đọc comment | 30 |
| Facebook | Group/confession sinh viên, post "cuối tháng ăn mì" → đọc comment | 30 |
| Threads / Instagram | Post than thở deadline, ngại giao tiếp | 20 |
| Google Maps | Review xe bánh mì do sinh viên viết | 15 |
| Dataset | UIT-ViHSD (33K comment mạng xã hội, nhãn CLEAN) — lọc câu ngắn, đời thường | 50 |

Trang cần đăng nhập → mở Chrome của bạn, Claude đọc comment. Ẩn danh hết.

### 3.3. Rút ra
Bảng pattern theo **6 tình huống của Bảo**: ngại nhận đồ cho · than hết tiền · than mệt/thiếu ngủ · bị khen · xin lỗi · cảm ơn.
Mỗi tình huống: cách mở câu · từ đệm · kiểu bỏ lửng · độ dài · từ cấm.

---

## 4. Hướng giọng (nháp — chốt sau research)

**Bảo:** nói ngắn, hay bỏ lửng bằng `…`, đệm `á / ha / ờm`, thỉnh thoảng 1 chữ tiếng Anh, tự giễu nhẹ. Giọng Nam chỉ giữ chữ còn sống (`hông`, `nha`, `á`, `mắc`).

| Đang có | Hướng mới |
|---|---|
| Dạ… sao cô biết hay vậy cô. | Ủa… sao chị biết hay vậy. |
| Dạ… em hơi quê. Mà em còn ba bữa nữa ba má em mới gửi. | Hơi quê ha… Còn ba ngày nữa nhà mới gửi tiền á chị. |
| Dạ… cô đừng khen em. Em nghe khen em hổng biết để tay đâu. | Chị đừng khen… em không biết để tay đâu luôn á. |
| Dạ… đó là tiếng Hàn cô ơi. Dạ. Em xin lỗi. | Ờm… cái đó tiếng Hàn á chị. Sorry chị. |
| Để cô bỏ chút pate, cô hổng tính tiền. *(người chơi)* | Chị thêm chút pate nha, không tính tiền. |

**Bảng đổi từ cổ:**

| Bỏ | Dùng |
|---|---|
| nghen | nha |
| hổng | hông / không |
| chớ | chứ |
| thiệt hả | thật hả / thiệt á (tuỳ câu) |
| bữa nay | hôm nay |
| ba má gửi | nhà gửi / mẹ chuyển khoản |
| cực vậy | cực dữ vậy / mệt ghê |

---

## 5. Các bước

1. Chốt Q1–Q4.
2. Research 3.2 → `docs/research/giong-noi/sinh-vien-huong-noi.md`.
3. Viết lại theo thứ tự: `bao.hettien` → `bao.noi` (2 cuộc trụ cột) → 8 cuộc còn lại → rules → arcs → knowledge.
4. Sửa luôn 2 lỗi cũ trong audit nếu chạm tới: giá viết cứng ("Mười ngàn", "bốn chục") → dùng `{gia}`.
5. Kiểm: `tools/validate-talks.ts`, `tools/lint-lines.ts`, đọc lại cả cây trong game (`tools/show-talk.ts`).
6. Chụp màn hình bong bóng thoại trong game → xem chữ có tràn/cắt không (luật kiểm bằng mắt).

## 6. Đầu ra
- File research + bảng pattern.
- `anh-bao.json` mới + diff trước/sau từng câu để duyệt.
- Danh sách câu nghi ngờ (chưa chắc giống người thật) để bạn duyệt riêng.

---

Nguồn đã đọc: [Kenh14 — Top từ lóng 2025](https://kenh14.vn/top-tu-long-thong-tri-mang-xa-hoi-nam-2025-215251209211355973.chn) · [Thanh Niên — 21/07/2026](https://thanhnien.vn/canh-bao-lam-dung-tieng-long-viet-tat-bien-dang-chinh-ta-tren-khong-gian-mang-185260720151648501.htm) · [VnExpress — "6-7"](https://vnexpress.net/6-7-dung-dau-danh-sach-tu-ngu-gay-uc-che-nhat-nam-5008736.html) · [Tuổi Trẻ — cụm từ hot 2025](https://tuoitre.vn/moi-nha-minh-len-nui-gium-em-he-he-he-diem-danh-nhung-cum-tu-hot-khap-coi-mang-2025-20251216233706892.htm) · [UIT-ViHSD trên Hugging Face](https://huggingface.co/datasets/sonlam1102/vihsd/blob/main/README.md)
