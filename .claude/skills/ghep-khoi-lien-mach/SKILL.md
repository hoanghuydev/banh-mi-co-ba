---
name: ghep-khoi-lien-mach
description: Dựng và gắn đồ ghép hàng nhiều ô (tường, nhà xóm, cửa, đường nhựa, mọi sprite đứng cạnh nhau) sao cho nối liền một khối, không có đường kẻ ở mối nối. Dùng khi thêm hay đổi ảnh tường/cửa/đạo cụ ghép hàng, khi người dùng thấy vạch, bậc, khe giữa các ô, hoặc khi làm khối ghép mới.
---

# Ghép khối liền mạch

Mục tiêu: nhiều ô đặt cạnh nhau nhìn ra **một khối**, ở độ phóng người chơi thấy. Vạch ở mối nối là lỗi, không phải "bước hình học thường thấy". Nhật ký vì sao phải dẫn nhiều vòng: `.claude/learning-loop/tuong-nhat-ky.md`. Quy tắc chung: `docs/QUY-TAC-CANVAS.md`.

## Nguyên tắc (đúc từ năm vòng sửa)

| # | Nguyên tắc | Vì sao |
|---|---|---|
| 1 | **Mọi ô dùng chung một bề mặt.** Vữa, dải gạch, nắp là texture tuần hoàn lấy từ ô tường trơn (`tools/wall_surface.py`); ảnh riêng của từng ô chỉ giữ ở vùng chi tiết (`DETAIL`: tờ rơi, cửa sổ, công tơ). Ngoài `DETAIL` không được lẫn một pixel nào của ảnh gen | Ghép ảnh riêng rồi vá mép: vá chỗ này lộ chỗ khác (tông, mép, độ cao dải gạch, vân) |
| 2 | **Gối mép rộng hơn bề rộng phần mờ.** Sau khi game thu nhỏ texture, 1–2 texel sát mép bán trong suốt; nếu chỗ đó đè lên gờ giữa của ô kề thì gờ sáng lộ qua thành vạch. `FACE_EXT` ≥ 16 px ảnh (≈ 2,5 px thiết kế) cho mặt đứng | Số đo thật: bướu +8 độ sáng, rộng ~1 px thiết kế, đúng chỗ mép mờ |
| 3 | **Nắp trên không gối rộng** (`CAP_EXT` = 5). Mỗi ô có lớp bóng lá riêng (`dappleN`) phủ theo alpha sprite; gối rộng thì vùng chồng bị phủ hai lần thành lưới vạch có răng cưa | Thử `CAP_EXT` = 16 ra ngay lưới vạch trên nắp |
| 4 | **Tông vữa mọi cột/hàng như nhau.** Texture dùng chung phải san sáng tối ngang mặt (`_flat_field`), không thì bản lặp mỗi ô thành sọc | Bản lặp theo bước ô thì mọi chênh lệch tông lặp theo |
| 5 | **Dải vữa ngay trên dải gạch lấy hoàn toàn từ texture chung.** Mép gạch của ảnh gen hay dốc cao hơn lưới | Ra vệt xanh mảnh chạy chéo trên dải gạch |
| 6 | **Chấm ở môi trường thật.** Ghép thử ở 6,4 px/px chưa đủ: vạch chỉ hiện sau khi game thu nhỏ, làm tròn vị trí, chồng lớp sáng | Ảnh ghép thử liền nhưng game còn vạch (vòng 4 và vòng 5) |
| 7 | **Số đo bổ sung cho mắt, không thay mắt.** Đo hồ sơ độ sáng ngang mối nối (`do-moi-noi.py`), rồi nhìn ảnh phóng | Lần nào chỉ nhìn mắt trên ảnh nhỏ cũng bỏ sót; lần nào chỉ tin số cũng sai chỗ |

## Quy trình thêm một ô mới

1. **Gen** theo skill `tao-anh-game`: khối xám `blockout.py --w 1 --d 1 --h 2.2 --front left`, ảnh mẫu `wall_plain-Photoroom.png`, prompt chỉ mô tả chi tiết ở mặt trái, mặt phải trơn. Chữ trong ảnh: nói rõ đúng chính tả và chỗ đặt.
2. **Cắt nền**: Photoroom, hoặc `scripts/cat-nen-trang.py vao.png art-raw/wall_<tên>-Photoroom.png` (đủ cho khối tường vì `normalise` lấp lại bên trong).
3. **Vùng giữ ảnh gốc**: dựng mặt phẳng (`to_plane` ở `wall_surface.py`), vẽ thước u/v, đọc khung `(u0, u1, v0, v1)` bao chi tiết kể cả băng keo và bóng đổ, thêm biên 4–6 px. Ghi vào `DETAIL`. Vùng không được chạm u < 10 hoặc u > 182 và không được chạm dải gạch (v < 205).
4. **Khai báo**: `tools/prep-art.py` (`BLOCKS` và `PROPS`), `src/art/photo.ts` (`STANDING`, dùng chung `WALL_PHOTO`), `src/art/building.ts` (`WALL_COUNT`). Không đặt `h`, `dx`, `dy` riêng cho từng ảnh.
5. **Dựng**: `python3 tools/prep-art.py <các khoá tường>` rồi `python3 tools/optimize-art.py`. Đổi `wall_surface.py` thì dựng lại **cả 11 khoá** (`BLOCKS`), không chỉ ô mới, vì chung bề mặt.
6. **Ghép thử**: `scripts/ghep-hang.py /tmp/ra plain <ô mới> meter ... plain`; xem `hang.png` rồi từng mối nối trong `moi-noi.png`.
7. **Chụp game** bằng `scripts/chup-game.sh <thư mục> x,y ...` (toạ độ thế giới lấy từ vị trí các sprite tường `b_wall*`); mở ảnh, soi từng mối nối; chạy `scripts/do-moi-noi.py ảnh x [y0 y1]` ở mối nối.
8. **Báo**: đường dẫn tuyệt đối ảnh chụp game, kết quả đo mối nối, mục chưa kiểm (xem "Còn mở").

## Bẫy khi chụp game (đã mất cả buổi vì chúng)

- Cảnh có camera thế giới là **`stall`**, không phải `day`. `getScene('stall').cameras.cameras[0]` zoom 1,28; camera `day` zoom 1 phóng ra thấy sàn trống.
- **Dev server tự tải lại trang mỗi lần có file đổi** (người khác hoặc agent khác sửa) nên ảnh headless hay ra màn menu. Dùng bản build tĩnh (`vite build --mode development`, vẫn có `window.__game`), như `chup-game.sh`.
- Cửa sổ 2732 px dựng chậm: chờ ≥ 20 s sau khi tải trang, ≥ 8 s sau mỗi lần đổi camera, rồi mới chụp.
- Không chạy `pkill -f remote-debugging-port` trong lệnh có chứa chuỗi đó: nó giết luôn shell đang chạy lệnh.
- Tắt lớp ánh sáng để cô lập: ẩn mọi ảnh có key `light/…`; ẩn mọi thứ trừ sprite `b_wall*` để biết lỗi nằm ở sprite hay ở lớp phủ.
- Đọc texture game đã dựng: `scene.textures.get('b_wall0').getSourceImage()` (canvas), đọc từng cột bằng `getImageData`. Phân biệt lỗi trong ảnh với lỗi do thu nhỏ.

## Lỗi đã gặp

| Triệu chứng | Gốc | Cách sửa |
|---|---|---|
| Vạch sáng dọc tại mối nối mặt đứng, chỉ thấy trong game | `FACE_EXT` quá nhỏ (3 px ảnh), phần mờ rơi lên gờ giữa của ô kề | `FACE_EXT` = 16 |
| Lưới vạch sáng và răng cưa trên nắp | `CAP_EXT` quá lớn, bóng lá phủ đôi | `CAP_EXT` = 5 |
| Vệt xanh mảnh chạy chéo trên dải gạch | Mép gạch ảnh gen dốc cao hơn lưới, vữa giữ lại từ ảnh gen lộ ra | Dải 32 px ngay trên dải gạch chỉ dùng vữa chung, rồi bỏ hẳn phần vữa lấy từ ảnh gen |
| Dải sáng sát mép mỗi ô (+4 độ sáng) | Vữa chung sát mép khác tông phần giữa mặt | `_flat_field` san tông theo hàng; bỏ phối vữa ảnh gen ở giữa mặt |
| Ra màn menu khi chụp | Dev server tải lại trang | Build tĩnh |

## Còn mở

- Nắp trên còn vài vạch rất mảnh ở mối nối nắp khi có bóng lá: lớp bóng `dappleOverlay` (`src/art/light/dapple.ts`) dựng riêng từng ô theo alpha sprite. Muốn hết hẳn phải dựng bóng cho cả hàng một lần. Chưa làm.
- Chưa chụp ở màn có `devicePixelRatio` 2 và GPU thật (mọi ảnh ở đây là Chrome headless phần mềm).

## Đồ ghép hàng phẳng (ô sàn, đường nhựa)

Cùng nguyên tắc 1, 2, 4, 6; chi tiết triển khai ghi ở `docs/QUY-TAC-CANVAS.md` và sẽ bổ sung vào đây sau mỗi lần làm.
