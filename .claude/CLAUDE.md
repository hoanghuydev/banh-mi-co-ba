# Bánh Mì Cô Ba — Luật làm việc cho agent

Đọc trước: `docs/CANON.md`, `docs/VAN-PHONG-UI.md`; làm canvas thì thêm `docs/QUY-TAC-CANVAS.md`. Đang revamp → `docs/revamp/00-YEU-CAU.md` thắng khi mâu thuẫn.
Phase revamp gọi là **R0–R6 (+R0.1, R0.5, R0.7)** — R0.7 = nhà cung cấp (trước là R3) (CANON §17.1). Doc cũ có banner ☠️/⚠️/✅ ở đầu — phần ☠️ không dùng làm căn cứ.

## 0. Nhận task

- **Chưa rõ yêu cầu → hỏi trước khi làm.** Không đoán.
- **Hai yêu cầu xung đột → hỏi user chọn** (AskUserQuestion), không tự quyết.
- **Không chắc → truy nguồn (code, doc, ảnh chụp) lấy bằng chứng rồi mới làm.** Cấm suy luận suông.
- **Ví dụ user đưa ra là mẫu, không phải toàn bộ phạm vi.** Mơ hồ "chỉ mấy chỗ này hay tất cả" → hỏi.
- **Hai việc không chạm file/dữ liệu của nhau → ưu tiên tạo sub agent làm song song** (Agent tool), tự làm phần còn lại. Giao rõ file được sửa và giao diện chung; việc phụ thuộc nhau thì làm tuần tự.

## 1. Viết plan

- Ngắn, dễ hiểu, **chỉ flow chính**. User đọc để duyệt nhanh.
- Câu gọn, bớt chủ ngữ. Viết được 1 câu thì đừng viết 3.
- Bullet + bảng thay cho đoạn văn. Không liệt kê phương án không theo.

## 2. Con số cân bằng game

Số trong đề bài là **ước tính**. Trước khi chốt: chạy agent tính toán + mô phỏng (`tools/sim.ts`), ra bảng số + công thức + kết quả mô phỏng. Không dùng thẳng số cho sẵn.

## 3. Kiểm tra bằng MẮT, không bằng code

Code chạy đúng ≠ nhìn đúng. Kết luận "xong" chỉ sau khi **đã xem ảnh chụp**.

### 3.1. Model 3D
- **Mỗi step** (import, xoay, scale, rig, texture, cắt, render, đóng atlas…) → render/chụp ảnh → mở ảnh ra xem.
- Dùng `tools/render-character.py`, Blender render, hoặc chụp trong game.
- Soi: đúng hướng không, đúng tỉ lệ không, texture có lên không, có méo/lủng/lệch không, có giống ảnh tham chiếu không.
- Sai thì sửa rồi chụp lại. Không đi step sau khi step trước chưa nhìn đạt.

### 3.2. UI trong game
- Chạy game (`npm run dev`), chụp màn hình thật (Chrome hoặc headless), mở ảnh ra xem.
- Checklist mỗi lần:
  - **Vị trí** — đúng chỗ thiết kế? Lệch, đè lên cái khác?
  - **Logic** — người chơi nhìn có hiểu ngay? Thứ tự đọc có hợp lý?
  - **Trống** — có khoảng trắng vô nghĩa, panel rỗng, thiếu dữ liệu?
  - **Chìm** — chữ/icon có lẫn vào nền? Đủ tương phản?
  - **Tràn/cắt** — chữ bị cắt, tràn khung, xuống dòng xấu?
  - **Kích thước** — xem cả PC và màn hẹp mobile.
- Báo kết quả kèm đường dẫn ảnh đã chụp.

### 3.3. Canvas game
Mọi việc đụng canvas (đạo cụ, sàn, tường, biển, chữ vẽ trong cảnh, độ sâu, bản đồ ô): đọc `docs/QUY-TAC-CANVAS.md` (các mẫu lỗi chung và vì sao) rồi tự suy ra chỗ cần soi; chụp phóng to ở chỗ đặt thật trước khi báo xong.
Thêm hoặc dời đạo cụ, đổi chất liệu sàn, hoặc đụng nắng/bóng/phản chiếu: đọc skill `anh-sang-vat-the`.

## 4. Code

- **Code chết phải xoá hẳn** — không comment out, không cờ tắt, không `old/`, không `@deprecated`. Git giữ lịch sử.
- **Không ghi quá trình vào code.** Cấm comment kiểu "đã bỏ X", "revamp", "trước đây…", mã phase. Comment chỉ mô tả code hiện tại.
- Mục tiêu revamp là **đơn giản lại**: phân vân giữ hay bỏ một cơ chế → bỏ.
- **Comment: chỉ khi cần và có ích.** Áp cả khi viết mới lẫn khi đọc/sửa code cũ.
  - Code đơn giản, không logic phức tạp → không comment. Comment dài dòng ở code đơn giản → xoá.
  - Nói được trong 1 câu → **tuyệt đối không quá 1 câu**. Được bỏ chủ ngữ.
  - Đụng file cũ thì cắt comment thừa trong vùng đang sửa.

## 5. Văn phong

- UI: tiếng phổ thông (`docs/VAN-PHONG-UI.md`).
- **UI hiện cái đó, không kể cái đó** (`VAN-PHONG-UI.md` §6). Không dắt tay ("hãy note vào đây"), không tự thuật ("chủ quán đã phản hồi"), không kể lại thứ khách vừa diễn ra trước mắt ("giá đắt nên 15% khách bỏ đi"). Trống thì để trống.
  **Nhưng hiệu ứng ngầm thì PHẢI ghi kèm số** — buff cộng dồn, +1 giây kiên nhẫn, thời hạn, điều kiện mở khoá: người chơi không đo nổi bằng mắt thì giấu đi là phần thưởng thành vô nghĩa. Phép thử: người chơi ngồi xuống có tự thấy không?
- Thoại, review, comment trong game: **phải research giọng thật trước** → dùng skill `research-giong-viet`.
- Lời của Hệ thống (app Hệ thống, hướng dẫn, thưởng): dùng skill `giong-he-thong`.
