# Bảng ký lằn ranh đỏ — P4-05 §2.8

> ## ⚡ REVAMP 2026-10-20 — ✅ CÒN SỐNG
> Lằn ranh đỏ giữ nguyên. Thêm việc ở R4: **review** (kể cả review ác ý, nhầm quán, spam) cũng phải qua bảng ký này.

> 🔴 **PM không được tạo build phát hành nếu một ô "trước mỗi build" còn trống.**
> 🔴 **Dự án CHƯA có Chủ biên văn hoá (VH) là người Việt với quyền phủ quyết** — đây là hạng mục chặn duy nhất của cả P4 (P4-05 §6). Bảng dưới để trống có chủ ý: bản dựng không tự ký thay người.

| Vai | Ai | Ghi chú |
|---|---|---|
| **VH** — Chủ biên văn hoá (người Việt, phủ quyết tuyệt đối, đứng ĐẦU credits) | _(chưa có — vị trí tuyển đầu tiên)_ | |
| **AD** — Art director | _(chưa có)_ | |
| **PM** — Producer | _(chưa có)_ | |
| **QA** | `npm run ci` (tự động) | xem cột "máy kiểm" |

| Lằn ranh | Máy kiểm (mỗi commit) | Mốc P4 | Trước Steam page | Trước mỗi build | VH | AD | PM |
|---|---|---|---|---|---|---|---|
| LR-1 Bản đồ / chủ quyền | — (chưa có asset art ngoài; mọi hình vẽ bằng code) | ☐ | ☐ | ☐ | | | |
| LR-2 Làm sai món Việt | — | ☐ | ☐ | — | | — | |
| LR-3 Hạ thấp nghề | `tests/p4-redlines.test.ts` (grep chặn) | ☐ | ☐ | — | | — | |
| LR-4 Chiến tranh | `tests/p4-redlines.test.ts` + `tools/lr4-blocklist.txt` (**chặn build**) | ☐ | ☐ | ☐ | | | |
| LR-5 Credits | `tests/p4-ending.test.ts` (VH đứng đầu, không "cultural consultant") | ☐ | — | ☐ | | ☐ | ☐ |
| LR-6 Tâm linh | `tests/p4-redlines.test.ts` (đốt vía: cùng seed ra cùng ngày) | ☐ | — | — | | — | — |
| LR-7 Chủ đề xã hội có thật | — (tin "đo đạc" chỉ là một cảnh nghe lỏm, không hệ quả — `tests/p4-events.test.ts`) | ☐ | ☐ | — | | — | |

## Việc máy KHÔNG làm được (phải có người)

- Phỏng vấn 3–5 chủ xe bánh mì ở TP.HCM (P4-05 §2.10) — **chưa làm**. 0% câu thoại truy được về phỏng vấn.
- Duyệt từng dòng `// viết thêm` trong `src/content/arcs.ts` và `src/sim/story.ts`.
- Lồng tiếng người thật (13 giọng; chị Hạnh do người Bắc thu) — **chưa có**; không dùng AI kể cả placeholder.
- Kiểm tra thủ công 8 mục "không bao giờ được giải thích" (P4-04 §2.6) trên toàn bộ nội dung.
