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

7b. **Kiểm độ phân giải trước khi duyệt**: cạnh ảnh phải ≥ cạnh thiết kế × 3,2 (màn 27" QHD; mục tiêu ×4,8 cho 4K). Bảng ở `docs/QUY-TAC-CANVAS.md` mục "Độ phân giải tối thiểu". Thấp hơn thì gen lại, không phóng to.

8. **Đặt vào game rồi mới báo xong**: đọc **cả** `docs/QUY-TAC-CANVAS.md` (gồm mục "Lịch sử sai"), chụp phóng 4–5× mối nối và chân đồ ở chỗ đặt thật rồi nhìn. Ảnh AI lệch hình học nhiều thì gen lại với khối xám, đừng cố kéo. Khối 1 ô ghép hàng (tường, cửa, nhà xóm) thêm vào `BLOCKS` của `tools/prep-art.py` để `tools/wall_block.py` chuẩn hoá rồi `tools/wall_surface.py` dựng bề mặt chung (vữa, gạch men, nắp) và chỉ giữ chi tiết (khai vùng ở `DETAIL`); cả bộ cùng một tông, cùng một bộ `h`/`dy`.

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

## Nâng chất lượng ảnh đạo cụ (HD): quy trình đã được duyệt

Dùng khi ảnh đạo cụ mềm, thiếu highlight, hoặc cần phản chiếu trên kính. Đã chạy cho tủ kính, thùng rác và 14 món khác; ví dụ nằm ở `art-raw/_duyet/tu_kinh_hd/`, `thung_rac_hd/`, `hd_*/`.

1. **Đầu vào**: `goc.png` = ảnh đạo cụ hiện tại phóng 3× trên nền trắng vuông (`public/art/prop_*.webp`); `mau.png` = ảnh mẫu chất lượng (một ảnh render đẹp, chỉ lấy độ nét, vật liệu, ánh sáng, không lấy hình).
2. **Prompt** (tiếng Anh, một đoạn, image 1 = `goc.png`, image 2 = `mau.png`): "Generate an image. Image 1 is a game prop: <mô tả>. Image 2 is the quality target (look only at the quality, crispness and lighting; do NOT copy its shapes). Redraw exactly the object of image 1: same camera angle, same proportions, same layout, every part in the same position. Raise the quality to match image 2: crisp sharp edges, fine detail, realistic materials with warm sunlit highlights on the right-facing surfaces. Warm sunlight from the upper right: right faces lighter and warmer, left faces slightly darker and cooler. Stylized cozy 3D game render, no outlines. Background: pure flat white (#FFFFFF) only: no floor, no tiles, no shadow on the ground, no reflection on the ground, no leaf shadows on the object, no text. Single object, centered, fully inside the frame with a small margin, nothing cropped. Square image."
3. **Chất liệu thêm vào mô tả** (bắt buộc nói rõ, nếu không ảnh ra mềm và phẳng): kính: "clear glass panes with soft bright reflections and a faint sky and tree-leaf reflection on the glass, green-tinted glass shelf edge"; kim loại: "brushed stainless steel with warm sunlit highlights"; sứ/men: "glossy glazed ceramic with soft specular highlight"; nhựa: "satin plastic with soft specular highlights on the lid top and right-facing edges".
4. **Không nướng vào ảnh**: bóng đổ xuống sàn, sàn, phản chiếu xuống sàn, bóng lá. Các lớp này do code (skill `anh-sang-vat-the`). Ánh sáng nướng trong ảnh chỉ để tô khối từ phải-trên.
5. **Xoá nền**: Photoroom (`quy-trinh-trinh-duyet.md`). Gặp CAPTCHA "Verify you are human" hoặc popup chặn tải: DỪNG Photoroom, không vượt; nền đã trắng thuần nên dùng `python3 tools/cut-white.py chatgpt-best.png final-Photoroom.png` (loang từ mép, viền mềm, bỏ nhiễm trắng), mở ảnh trên nền màu để soi viền, kính còn trong suốt một phần.
6. **Kiểm sau xoá nền**: có alpha, 4 góc trong suốt; tỉ lệ rộng/cao bbox đục lệch ≤ 8% so với ảnh cũ (nếu lệch hơn thì chỉnh `h`/`dx`/`dy` trong `STANDING` của `photo.ts`); cạnh dài ≥ cạnh thiết kế × 3,2 (xem `docs/QUY-TAC-CANVAS.md`).
7. **Cài vào game**: copy thành `art-raw/<tên>-Photoroom.png`, sửa dòng trong `PROPS` của `tools/prep-art.py` (cạnh dài 640, dù/vật lớn 768; không đặt vào `ISO_FIX`, ảnh gen ra từ ảnh đã ép iso nên đã đúng góc), chạy `python3 tools/prep-art.py <key>` rồi `npm run optimize:art`, dựng game và soi ở chỗ đặt thật.
8. **Đồ cắt ghép theo toạ độ** (bàn thớt, bàn bench, bàn dài, quầy order, `prepFromLong`, `bench()`): KHÔNG gen lại bằng quy trình này, ranh cắt đã chỉnh theo ảnh cũ.
9. **Sàn**: ảnh top-down, lưới 4×4 ô phủ kín khung, khe vữa đều, albedo phẳng (không highlight, không bóng, không gradient), `prep-art.py` cắt ô và dựng khung 248×152 (`FLOOR_SS` 4); gạch đỏ xếp so le thì dùng cả ảnh làm một ô và lật/xoay 180° để có 4 biến thể.
10. **Ảnh bóng (tán lá, mặt tiền)**: không qua quy trình này; theo mục 8 của skill `anh-sang-vat-the` (xám trên nền trắng, độ nét vừa, đặt theo ô thế giới).
