---
name: tao-anh-game
description: Tạo ảnh item/đạo cụ/ô sàn/nguyên liệu/nhân vật (T-pose) cho Bánh Mì Cô Ba bằng ChatGPT qua Claude in Chrome, xóa nền ở Photoroom, tải về và trình user duyệt. Dùng khi user nhờ "tạo ảnh", "gen ảnh", "làm sprite", "viết prompt ảnh" cho món đồ hay nhân vật trong game.
---

# Tạo ảnh cho game

Mục tiêu: ra ảnh **đúng style, đúng góc, đúng hình khối** của game isometric 2:1 (ô 60×30 px, camera ortho nâng 30°). Ba lỗi hay gặp và cách chặn:

| Lỗi | Cách chặn |
|---|---|
| Style lúc đúng lúc sai | Dán nguyên khối STYLE (`references/style-camera.md`) + gửi ảnh mẫu cùng chất liệu |
| Góc và hướng sai | Gửi ảnh khối xám `scripts/blockout.py` làm khung, ghi rõ mặt trước hướng xuống-phải hay xuống-trái; đo góc bằng `scripts/do-goc.py` |
| Không tả được đồ | Điền phiếu mô tả (`references/mo-ta-vat.md`): kích thước theo ô, hình khối, chất liệu |

## Quy trình

0. **Hỏi logic game trước khi tả hình**: ai đứng ở đâu, đồ này ai dùng, từ phía nào (mục "Logic game" ở `references/mo-ta-vat.md`). Mặt trước phải theo logic đó, không theo cảm giác "mặt đẹp hướng camera".
1. **Chốt phiếu mô tả.** Từ lời user, điền phiếu ở `references/mo-ta-vat.md`. Thiếu kích thước hoặc hướng mặt trước thì hỏi 1 lần, gộp mọi câu hỏi. Lấy số theo ô từ `src/world/map.ts` / `photo.ts` nếu đồ đã có chỗ trong game.
2. **Chuẩn bị file** trong `art-raw/_duyet/<ten_snake_case>/`:
   - Ảnh khối: `python3 .claude/skills/tao-anh-game/scripts/blockout.py --w W --d D --h H --front right|left --out art-raw/_duyet/<ten>/khoi.png`. Vật tròn thêm `--shape cylinder`. Mở ảnh ra xem trước khi dùng.
   - **1** ảnh mẫu trong `art-raw/` (bảng chọn ở `references/style-camera.md`). ChatGPT free chỉ cho đính kèm 2 ảnh, nên tổng cộng khối + 1 mẫu.
3. **Viết prompt** bằng tiếng Anh theo mẫu ở `references/style-camera.md`. Lưu vào `art-raw/_duyet/<ten>/prompt-N.txt`.
4. **Gen ảnh** trên ChatGPT theo `references/quy-trinh-trinh-duyet.md`.
5. **Xem bằng mắt** (mở file ảnh bằng Read) và chấm theo checklist ở `references/quy-trinh-trinh-duyet.md`. Sai thì chèn câu sửa vào prompt đầy đủ theo bảng sửa lỗi, chỉ sửa đúng lỗi đó.
6. **Xóa nền** ở Photoroom, tải về `art-raw/_duyet/<ten>/final-Photoroom.png`.
6b. **Đồ hình hộp (bàn, tủ, quầy)**: ảnh AI hay dốc ~31° thay vì 26,6° nên lệch đường kẻ sàn và chân tường. Chạy `python3 .claude/skills/tao-anh-game/scripts/ep-iso.py <final-Photoroom.png> <ra.png> --w W --d D --body <px>` để ép về 2:1, rồi lưu bản ép vào `art-raw/`. Chép `w`, `h`, `foot` in ra vào `src/art/photo.ts`.
7. **Trình user**: đường dẫn **đầy đủ** (tuyệt đối) của ảnh, xong hết thì hỏi user có muốn mở thư mục không (không tự `xdg-open`), số lượt đã dùng, lỗi còn lại nếu có. Chờ user duyệt. Khi duyệt mới chép vào `art-raw/<ten>-Photoroom.png` và nhắc thêm vào `tools/prep-art.py`.

## Hạn mức lượt gen (chống đốt tiền)

| Công cụ | Tối đa | Ghi chú |
|---|---|---|
| ChatGPT | **3** | Gói free khoảng 5 ảnh/ngày |
| Tripo | **1** | **Phải hỏi user trước.** Chỉ hỏi sau khi ChatGPT đã hết 3 lượt mà chưa đạt |

- Một lượt = một lần AI trả ảnh mới (kể cả bấm tạo lại).
- Ghi số lượt vào `art-raw/_duyet/<ten>/log.md` sau mỗi lượt.
- Gặp màn hình nâng cấp, hết hạn mức hoặc đòi trả tiền: **dừng**, báo user. Không bấm nâng cấp hay mua credit.
- Hết 3 lượt mà ảnh vẫn chưa đạt: trình ảnh tốt nhất kèm lỗi còn lại, hỏi user có muốn thử Tripo không. Cách làm Tripo ở `references/quy-trinh-trinh-duyet.md` mục Tripo.

## Quy tắc

- Mọi prompt gửi AI viết bằng tiếng Anh. Báo cáo cho user viết tiếng Việt.
- Đồ vật: nền trắng thuần, không bóng đổ xuống đất, không chữ, không logo.
- **Nhân vật luôn T-pose**, nhìn thẳng chính diện (mục Nhân vật ở `references/style-camera.md`).
- Mỗi lượt là cuộc trò chuyện mới, đính kèm lại ảnh, prompt đầy đủ. Không gửi câu sửa ngắn vào chat cũ.
- Chỉ thao tác trên ChatGPT, Photoroom (và Tripo khi user cho phép). Cần đăng nhập mà chưa đăng nhập thì dừng, nhờ user đăng nhập.
- Trước khi dùng Chrome, đọc skill `claude-in-chrome`.
