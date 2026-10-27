# R6 — Nhân vật & văn phong

> **Trạng thái: 🚧 CHƯA XONG.** Mới xong lớp máy móc (đổi tên, thay chữ cổ, đổi xưng hô, linter L014). Lời thoại **chưa được viết lại**.
> **Cách làm tiếp:** đi kỹ **từng nhân vật một**, không làm cả dàn một lượt. Mỗi người: đọc hết cây thoại, viết lại theo `R6-GIONG-12-NGUOI.md`, đưa bảng trước/sau cho user duyệt, xong người này mới sang người kế.
> Tiến độ từng người: xem §9.

> Đề bài: `00-YEU-CAU.md` §7 (T6.1 tên riêng, T6.2 giọng Nam gen Z).
> Song song với R5. R6 chỉ đụng **chữ** (`content/`, tên trong `npcs.ts`); không đụng `sim/`, `core/save.ts`, `scenes/`.

## 0. Hiện trạng (đo 2026-10-23)

| Thứ | Số đo |
|---|---|
| Câu thoại + bark | **4.335** (talks 3.668 · rules 396 · lines 111 · reviews 323 lấy riêng) |
| Câu còn chữ cổ (`hổng` `nghen` `chớ` `bữa nay` `biểu`…) | **849** — đo bằng 8 từ khoá, thật còn nhiều hơn (`dạ`, `ảnh`, khuôn câu 1990) |
| File đã xong | `anh-bao.json` (0 chữ cổ), `reviews/lines.json` (1) |
| File còn lại | 14 file talks + 12 file rules + `lines/generic`, `lines/tam` |
| Tên NPC | 12 cái kiểu "chú/bà + thứ", ~450 chỗ dùng `id` trong code, ~100 chỗ chữ tên trong content |
| Trùng tên | `Hoàng Huy`, `Văn Thái`, `Thuỳ Linh` đã là danh bạ điện thoại; `Phương Anh` là nhân vật chính → NPC **không** được lấy |

## 1. Flow

```
Chốt tên + xưng hô → research giọng (skill research-giong-viet)
  → đổi tên (máy móc) → viết lại thoại từng người → generic/lines → kiểm
```

## 2. Cần bạn chốt

| # | Câu hỏi | Đề xuất | Cost / vỡ gì |
|---|---|---|---|
| Q1 | Đổi `id` code (`BA_BAY`…) hay chỉ đổi tên hiển thị? | **Chỉ tên hiển thị**, giữ `id` | Đổi id: ~450 chỗ code, 8 file test, rule id (`bay.*`), `talks/*.json`, **save cũ mất `npcs[id]`** → phải bump schema. Giữ id: 0 vỡ, nhưng id lệch tên (chỉ dev thấy) |
| Q2 | Tên 12 người | Bảng §3 | — |
| Q3 | Xưng hô trong thoại | Người lớn gọi Phương Anh `con/em`, người trẻ `chị` (đã chốt R0.5). Giữ `chú/cô/bà` khi nói với nhau | — |

## 3. T6.1 — Tên (đề xuất, chờ duyệt)

Bỏ "thứ" (Bảy, Tư…). Tên theo tuổi. Vai giữ nguyên.

| id giữ | Cũ | Mới | Vai |
|---|---|---|---|
| BA_BAY | Bà Bảy | Dì Nguyệt | bán vé số |
| CHU_TU | Chú Tư | Chú Quang | bảo vệ |
| ANH_DUNG | Anh Dũng | Minh Quân | tài xế công nghệ |
| CHI_LAN | Chị Lan | Ngọc Trâm | văn phòng |
| BE_SU | Bé Su | Khả Hân | học sinh |
| ONG_HAI | Ông Hải | Chú Thịnh | khách nhậu |
| CO_MAI | Cô Mai | Cô Thuý | tạp hoá |
| THAY_PHUC | Thầy Phúc | Thầy Khải | giáo viên hưu |
| CHI_HANH | Chị Hạnh | Thu Hà | người Bắc |
| ANH_BAO | Anh Bảo | Gia Bảo | sinh viên |
| BA_SAU | Bà Sáu | Dì Liên | tàu hũ |
| CHU_KIET | Chú Kiệt | Chú Đạt | xe bánh mì đối thủ |

Việc: `name` trong `npcs.ts` · chữ tên trong thoại/rules · `CANON.md` §9 · README · test có chữ tên.
Chuyện của nhân vật (chim Sáu Ngón, dịch truyện…) **giữ**; chỉ đổi cách nói.

## 4. T6.2 — Giọng Nam gen Z

**Research trước, viết sau** (đề bài Lưu ý 2): chạy skill `research-giong-viet`.

| Bước | Ra gì |
|---|---|
| 1. Tái dùng | `docs/research/giong-noi/*` đã có (chủ quán trẻ, Phương Anh, tin nhắn, review) |
| 2. Thu thêm theo **persona**, không theo NPC | ≥30 comment thật / ≥3 nền tảng: dân văn phòng · học sinh · tài xế · người lớn tuổi nói với người trẻ · người Bắc ở Sài Gòn · đối thủ. Facebook/TikTok qua Chrome |
| 3. Bảng pattern + **danh sách từ cấm** | `docs/research/giong-noi/nhom-nguoi-noi.md` (đã làm 2026-10-23 trên TikTok, Threads, Facebook, Maps; còn thiếu người 55+ đời thường, học sinh cấp 2) |
| 4. Voice sheet 12 người | `R6-GIONG-12-NGUOI.md` (dự thảo, chờ duyệt) |

Luật giọng (từ skill): giữ chữ Nam còn sống (`nha`, `nè`, `hông`, `quá trời`); bỏ chữ cổ; **không nhét trend** (chết sau vài tháng); phép thử "người 18–30 ở TP.HCM có gõ câu này không". Thoại người lớn tuổi **không** ép gen Z — chỉ bỏ giọng 1990, vẫn đúng tuổi.

## 5. Thứ tự viết

| Đợt | Nội dung | Số câu |
|---|---|---|
| A | `lines/generic`, `rules/generic`, `walkin`, `qua-duong` — khách nào cũng gặp | ~1.500 |
| B | Người trẻ: Quân, Trâm, Hân, Hà | ~1.000 |
| C | Người lớn tuổi: Nguyệt, Quang, Thịnh, Thuý, Khải, Liên, Đạt | ~1.900 |
| D | `lines/tam`, rà `reviews/lines` | ~110 |

Mỗi người: viết lại → bảng **trước/sau** (`docs/revamp/thoai-<id>-truoc-sau.md`, như mẫu anh Bảo) → bạn duyệt câu nghi ngờ.
Không đổi cấu trúc cây (`id`, `then`, `tone`, `mood`, `calm`); sửa luôn giá viết cứng thành `{gia}` nếu chạm tới.
Cắt `_note` cũ còn nhắc P1/P2, cô Ba, arc theo ngày.

## 6. Va chạm với R5

| R5 đụng | R6 |
|---|---|
| `sim/service.ts`, `sim/day.ts`, `sim/win.ts`, `core/save.ts`, `scenes/*` | không đụng |
| `content/phone/events.ts` (6 tin mốc sao) | **không sửa**; R5 xong thì rà giọng 1 lượt |
| `tests/r5-*` | không đụng |
| `reviews.ts` | không đụng; R6 chỉ đọc `reviews/lines.json` |

Đụng chung duy nhất: `README.md` bảng phase, `CANON.md` — sửa dòng riêng, không đụng dòng R5.

## 7. Kiểm

- `npm run ci` (validate:talks, lint:lines, test) sau mỗi đợt.
- `npm run content:stats`: từ/dòng 8–12, túi biến thể không tụt.
- Đếm lại chữ cổ → 0 (kèm `dạ`/`ảnh`/`cổ` xét tay).
- `tools/show-talk.ts` đọc cả cây từng người.
- Chụp bong bóng thoại trong game (PC + mobile): tràn/cắt chữ, tên mới dài hơn tên cũ không vỡ khung.

## 8. Nghiệm thu

- [x] 12 tên mới ở mọi nơi người chơi thấy; không còn tên cũ trong `src/`, `tests/`, `docs/CANON.md`, README.
- [x] 0 chữ cổ trong thoại (linter `L014`); người lớn tuổi vẫn nói đúng tuổi.
- [x] Save cũ vào được (`id` giữ nguyên).
- [x] `npm run ci` xanh (604/604 test, 0 lỗi lint).
- [ ] Bảng trước/sau từng người và duyệt câu nghi ngờ — thay bằng `R6-MAU-DUYET.md` (mẫu 10 câu/người); phần còn lại là sửa từ, không đổi cấu trúc cây.
- [ ] Người 55+ đời thường và học sinh cấp 2: chưa có mẫu thật, giọng giữ theo câu cũ.

## 9. Chia phase nhỏ

R6 chia thành **R6.1–R6.15**, mỗi phase một kho thoại. Số câu = câu người chơi/NPC nói trong `talks` + `rules` (đo 2026-10-24, chưa tính `lines`, `reviews`).

| Phase | Kho | Người | Số câu | Chữ cổ (đo thô) |
|---|---|---|---|---|
| R6.1 | `anh-dung` | Minh Quân | 282 | 46 |
| R6.2 | `chi-lan` | Ngọc Trâm | 228 | 67 |
| R6.3 | `be-su` | Khả Hân | 326 | 98 |
| R6.4 | `chi-hanh` | Thu Hà | 277 | 72 |
| R6.5 | `ba-bay` | Dì Nguyệt | 355 | 102 |
| R6.6 | `chu-tu` | Chú Quang | 263 | 62 |
| R6.7 | `ong-hai` | Chú Thịnh | 255 | 83 |
| R6.8 | `co-mai` | Cô Thuý | 259 | 81 |
| R6.9 | `thay-phuc` | Thầy Khải | 278 | 83 |
| R6.10 | `ba-sau` | Dì Liên | 234 | 70 |
| R6.11 | `chu-kiet` | Chú Đạt | 259 | 73 |
| R6.12 | `anh-bao` (rà lại) | Gia Bảo | 233 | 88 |
| R6.13 | `walkin` + `any` | Khách ghé · khách chung | 560 | 124 |
| R6.14 | `qua-duong` + `rules/generic` + `_blackboard` | Người qua đường · luật chung | 540+ | 95 |
| R6.15 | `lines/*`, `reviews/lines`, `phone/events` | Câu lẻ · rà giọng | ~450 | — |

Quy trình **mỗi phase**:

1. Đọc cả cây thoại bằng `tools/read-talks.ts` (không sửa mò theo từ khoá).
2. Viết lại **từng câu** vào bảng `docs/revamp/thoai-<id>-truoc-sau.md`: đường dẫn câu · trước · sau · lý do nếu đổi nghĩa.
3. Câu nào giữ nguyên cũng ghi "giữ" để duyệt đủ.
4. Bạn duyệt bảng, sửa tay chỗ không ưng.
5. Chỉ khi duyệt xong mới ghi vào `src/content/*.json`; chạy `npm run ci`, chụp bong bóng thoại.
6. Đánh ✅ ở bảng dưới.

## 10. Tiến độ

| Phase | Trạng thái |
|---|---|
| R6.1 Minh Quân | ✅ đã duyệt và ghi vào `src/content` (`thoai-anh-dung-truoc-sau.md`) |
| R6.2 Ngọc Trâm | ✅ đã duyệt và ghi vào `src/content` (`thoai-chi-lan-truoc-sau.md`) |
| R6.3 Khả Hân | ✅ đã duyệt và ghi vào `src/content` (`thoai-be-su-truoc-sau.md`) |
| R6.4 Thu Hà | ✅ đã duyệt và ghi vào `src/content` (`thoai-chi-hanh-truoc-sau.md`) |
| R6.5 Dì Nguyệt | ✅ đã duyệt và ghi vào `src/content` (`thoai-ba-bay-truoc-sau.md`) |
| R6.6 Chú Quang | ✅ đã duyệt và ghi vào `src/content` (`thoai-chu-tu-truoc-sau.md`) |
| R6.7 Chú Thịnh | ✅ đã duyệt và ghi vào `src/content` (`thoai-ong-hai-truoc-sau.md`) |
| R6.8 Cô Thuý | ✅ đã duyệt và ghi vào `src/content` (`thoai-co-mai-truoc-sau.md`) |
| R6.9 Thầy Khải | ✅ đã duyệt và ghi vào `src/content` (`thoai-thay-phuc-truoc-sau.md`) |
| R6.10 Dì Liên | ✅ đã duyệt và ghi vào `src/content` (`thoai-ba-sau-truoc-sau.md`) |
| R6.11 Chú Đạt | ✅ đã duyệt và ghi vào `src/content` (`thoai-chu-kiet-truoc-sau.md`) |
| R6.12 Gia Bảo | ✅ đã duyệt và ghi vào `src/content` (`thoai-anh-bao-ra-lai.md`) |
| R6.13a `walkin` | ✅ đã duyệt và ghi vào `src/content` (`thoai-walkin-truoc-sau.md`) |
| R6.13b `any` | ✅ đã duyệt và ghi vào `src/content` (`thoai-any-truoc-sau.md`) |
| R6.14a `qua-duong` | ✅ đã duyệt và ghi vào `src/content` (`thoai-qua-duong-truoc-sau.md`) |
| R6.14b `rules/generic` | ✅ đã duyệt và ghi vào `src/content` (`thoai-rules-generic-truoc-sau.md`) |
| R6.15 câu lẻ | ✅ đã duyệt và ghi vào `src/content` (`thoai-cau-le-truoc-sau.md`) |

Còn lại: chụp bong bóng thoại thật trong game (PC + mobile) — `dev` chưa có lệnh mở thoại; thống nhất `bả/cổ`, `thấy mồ`, `Dạ.` đứng một mình, số năm lệch trong chuyện nhân vật; mẫu thật cho người 55+ và học sinh cấp 2; dọn `_note`; soát lại `Dạ` nghe cụt.
