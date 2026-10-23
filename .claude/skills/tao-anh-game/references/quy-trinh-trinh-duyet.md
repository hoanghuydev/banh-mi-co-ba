# Thao tác trình duyệt, chấm ảnh, sửa lỗi

Đọc skill `claude-in-chrome` trước. Bắt đầu bằng `tabs_context_mcp`, mở tab mới cho mỗi trang. Không bật hộp thoại alert/confirm.

## ChatGPT (tối đa 3 lượt)

1. Mở `https://chatgpt.com` trong tab mới. Chưa đăng nhập thì dừng và báo user.
2. Mỗi lượt là **cuộc trò chuyện mới**. Không gửi câu sửa ngắn vào chat cũ: AI chỉ sửa trên ảnh vừa ra, quên ảnh khối và ảnh mẫu nên hình bóng giữ nguyên, chỉ đổi màu.
3. Đính kèm bằng `find` ô "Attach files" rồi `file_upload`: ảnh khối trước, ảnh mẫu sau. Gói free chỉ nhận **2 ảnh**; ảnh thứ ba bị từ chối kèm thông báo hạn mức. Không bấm Upgrade.
4. **Xóa sạch khung chat trước khi gõ**: click vào khung, `ctrl+a`, `Delete`, chụp màn hình xác nhận khung trống (có thể còn bản nháp cũ). Rồi `type` prompt đầy đủ viết thành một đoạn, bắt đầu bằng `Generate an image.`, nói đúng "Image 1 / Image 2" theo số ảnh đã đính kèm. Chụp màn hình kiểm tra rồi mới nhấn Return.
5. Chờ ảnh ra (khoảng 20–30 giây). Lấy địa chỉ `blob:` của ảnh "Generated image" bằng `javascript_tool`, tải bằng thẻ `<a download="chatgpt-N.png">`, rồi lấy file mới nhất trong `~/Downloads` chép vào `art-raw/_duyet/<ten>/chatgpt-N.png`.
6. Hết hạn mức ảnh free: dừng, báo user.

## Photoroom (xóa nền)

1. Mở `https://www.photoroom.com/tools/background-remover`.
2. Tải ảnh tốt nhất lên (`file_upload`). Chờ xử lý xong.
3. Chụp màn hình xem viền và chi tiết nhỏ (tay nắm, chân, mép trong suốt) có bị ăn mất không.
4. Tải về, chép thành `art-raw/_duyet/<ten>/final-Photoroom.png`. Tải bản PNG, không tải bản có watermark.
5. Đòi đăng nhập hay trả tiền mới cho tải: dừng, báo user.
6. Kiểm tra bằng Python: ảnh có kênh alpha, góc ảnh trong suốt. Xong mở ảnh ra xem.

## Checklist chấm ảnh (mở file bằng Read, nhìn bằng mắt)

| # | Kiểm tra | Đạt khi |
|---|---|---|
| 1 | Góc | Mặt trên là hình thoi dẹt 2:1, thấy đúng 2 mặt đứng, cạnh đứng thẳng đứng. Vật tròn dẹt: chạy `python3 scripts/do-goc.py <ảnh>`, phải ra ĐẠT (sai số khoảng 0,05) |
| 2 | Hướng | Mặt trước nằm đúng bên đã chọn (đầu xe, cửa, tay nắm) |
| 3 | Tỉ lệ | Bám khung ảnh khối: dài, rộng, cao đúng như phiếu |
| 4 | Style | Cạnh bo tròn, chất liệu satin, sáng từ phải; đặt cạnh ảnh mẫu không thấy lạc |
| 5 | Nền | Trắng thuần, không bóng đổ, không mặt sàn |
| 6 | Sạch | Không chữ, logo, dấu mờ, không bóng ma của khối xám hay mũi tên đỏ |
| 7 | Khung | Vật nằm trọn trong ảnh, không cắt, một vật duy nhất |
| 8 | Chi tiết | Đủ các bộ phận trong phiếu, không thừa bộ phận lạ |
| 9 | T-pose (chỉ nhân vật) | Nhìn thẳng chính diện, hai tay dang ngang thẳng, hai chân thẳng hơi tách, đối xứng trái phải, thấy đủ từ đầu đến chân, tay không cầm gì |

Đạt tất cả mục thì sang Photoroom. Ghi kết quả từng mục vào `log.md`.

## Bảng sửa lỗi (chèn câu vào prompt gốc đầy đủ, sửa đúng một lỗi mỗi lượt)

| Lỗi | Câu thêm vào prompt |
|---|---|
| Góc quá dốc hoặc quá phẳng | `Keep exactly the camera angle of image 1. The top face must be a rhombus twice as wide as tall.` |
| Có phối cảnh | `Orthographic only: parallel edges must stay parallel, no perspective convergence.` |
| Mặt trước ngược | `Rotate the object 180 degrees around its vertical axis. The front must point to the lower <right/left> of the image, exactly like the red arrow in image 1.` |
| Nhìn thẳng chính diện hoặc từ trên xuống | `Not a front view and not a top-down view. Turn the object 45 degrees and show the top face and two side faces.` |
| Lệch style (ảnh thật, tranh vẽ, hoạt hình) | `Match the render style of image 2 exactly: soft clay-like 3D render, same rounding, same material softness and lighting. No photo, no illustration, no outlines.` |
| Sai tỉ lệ | `Match the footprint and height of image 1 exactly: <W> by <D> by <H> units.` |
| Không phải T-pose (tay buông, nghiêng người, chân bắt chéo) | `Strict T-pose: standing straight facing the camera, both arms stretched out horizontally to the sides at shoulder height, palms down, legs straight and slightly apart, perfectly symmetric front view.` |
| Còn nền, bóng, sàn | `Pure white background only. No shadow and no ground under the object.` |
| Còn khối xám hoặc mũi tên | `Do not draw the gray blockout or the red arrow. Draw only the real object.` |
| Thừa chữ, logo | `No text, no logo, no writing on the object.` |
| Mất bộ phận | `Include: <bộ phận bị thiếu>.` |

Cùng một lỗi lặp hai lượt liên tiếp thì đổi cách nói hoặc đổi công cụ, đừng lặp lại nguyên câu.

## Tripo (tối đa 1 lượt, chỉ khi user đồng ý)

Điều kiện: ChatGPT 3 lượt vẫn chưa đạt. Hỏi user bằng một câu: ảnh nào gần đạt nhất, lỗi còn lại là gì, có muốn thử Tripo (tốn credit) không. User đồng ý mới làm.

1. Mở `https://studio.tripo3d.ai`, tạo model từ ảnh tốt nhất trong `_duyet/<ten>/` (image-to-3D). Một lượt duy nhất.
2. Lấy file GLB bằng `tripo-download/tripo_sniffer.js` + `download_tripo.py` (không bấm Export, không tốn thêm credit).
3. Render bằng camera cố định, ortho, nâng 30°, xoay 45°, nền trong suốt. Dùng `setup_camera` và `ISO_ELEV` trong `tools/render-character.py` làm gốc; xoay mô hình sao cho mặt trước hướng đúng bên đã chọn. Xem ảnh render rồi chấm lại checklist.
4. Ảnh render có alpha sẵn nên bỏ qua Photoroom.
5. Chưa đạt thì dừng, báo user. Không gen lại.
