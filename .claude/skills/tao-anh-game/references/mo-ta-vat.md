# Mô tả đồ vật cho AI

User không cần tả được. Claude điền phiếu này từ lời user, rồi đưa phần OBJECT vào prompt.

## Phiếu

| Mục | Điền |
|---|---|
| Tên | tên tiếng Anh ngắn, `snake_case` cho tên file |
| Loại | đồ đứng / ô sàn / nguyên liệu / nhân vật |
| Chân đế | `W × D` ô (W: cạnh chạy xuống-phải, D: cạnh chạy xuống-trái) |
| Cao | `H` ô |
| Mặt trước | `right` / `left` / không có |
| Hình khối | các bộ phận, mỗi bộ phận một dòng, kèm hình cơ bản (hộp, trụ, tấm, vòm) |
| Chất liệu và màu | mỗi bộ phận: chất liệu + màu |
| Chi tiết | tay nắm, nút, họa tiết; những gì **không** có |

Từ phiếu ra lệnh `blockout.py`: `--w W --d D --h H --front ...`.

## Logic game (làm trước phiếu)

Camera nhìn từ (−x, −y): +x chạy xuống-phải, +y chạy xuống-trái. Phía người chơi (trong quán) là y nhỏ = **lên-phải, camera chỉ thấy mặt lưng**. Phía khách là y lớn = xuống-trái, **camera thấy mặt này**.

| Bộ phận | Hướng đúng |
|---|---|
| Màn hình, ngăn kéo tiền, tay nắm, cửa tủ, thứ người chơi bấm hoặc lấy | Về phía người chơi (lên-phải) → camera thấy mặt lưng |
| Mặt khách nhìn (xuống-trái) | Phẳng, bàn phím máy quẹt thẻ, chuông, chỗ đặt đồ khách nhận |
| Đồ chỉ để trưng cho khách (bảng, menu) | Hướng khách |

Đối chiếu `src/world/map.ts`: ô khách đứng (`QUEUE_SLOTS`, `CUSTOMER_GATE`) và ô người chơi đứng. Đồ khác (tủ kính, lò, thớt) cũng hỏi: ai thao tác, đứng bên nào. Prompt phải ghi rõ "facing AWAY from the camera, toward the upper right" khi đồ quay lưng.

Ví dụ lỗi đã gặp: bàn order gen lượt đầu để màn hình và ngăn tiền hướng ra khách, sai vì người chơi mới là người bấm.

## Đồ nhiều ô nối liền

Gen **một** ảnh cho cả cụm (`blockout.py --w 1 --d 2`), tả rõ từng nửa nằm ở đâu (`the half toward the upper right has…`). Trong game cắt đôi theo ranh giới ô bằng canvas clip, hai nửa vẽ chồng cùng một chỗ nên không có khe (`bench()` trong `src/art/photo.ts`). Đỉnh dưới ảnh phải trùng góc gần của ô gần; đo vị trí ngang của nó sau khi `prep-art.py` cắt sát và ghi vào `foot`.

## Đổi kích thước

| Cần | Con số |
|---|---|
| 1 ô sàn | rộng 60 px, cao 30 px trên màn hình |
| 1 ô chiều cao | khoảng 37 px |
| Người chơi | cao khoảng 2 ô |
| Bàn thấp (`prop_table`) | khoảng 1,5 ô |
| Tủ lạnh | khoảng 2,5 ô |

Khi user nói "1 ô", "2 ô", "cao ngang người" thì đổi theo bảng. Nếu user nói đồ có sẵn trong game, đọc kích thước thật ở `src/art/photo.ts` (bảng `h`) và `src/world/map.ts`.

## Từ vựng hình khối

| Ý | Viết |
|---|---|
| Khối chữ nhật | `rounded box with small bevelled edges` |
| Tấm dày | `thick slab`, nói độ dày theo tỉ lệ (`a quarter of its width`) |
| Trụ tròn | `short cylinder, height one third of its diameter` |
| Phẳng | `flat`, `low-profile` |
| Có hốc, rãnh | `shallow groove`, `recessed panel` |
| Chân | `four short stubby legs`, `solid base, no visible legs` |
| Khối tường | `solid wall block, one tile wide, flat top, plain painted plaster faces, no door or window` |

## Từ vựng chất liệu

| Ý | Viết |
|---|---|
| Nhựa cứng | `matte hard plastic` |
| Gỗ | `warm light wood with soft grain, satin finish` |
| Inox | `brushed stainless steel, soft highlights` |
| Sơn | `satin painted metal` |
| Vải, bạt | `soft canvas fabric` |
| Gạch, xi măng | `rough fired clay`, `matte cement plaster` |
| Kính | `clear glass with soft highlights` |

Luôn thêm màu cụ thể (`dusty teal`, `warm cream`), không viết "đẹp", "cổ điển" chung chung.

## Ví dụ

**Thớt tròn** (1 ô, đồ không có mặt trước):

| Mục | Điền |
|---|---|
| Chân đế | 1 × 1 ô |
| Cao | 0,3 ô |
| Hình khối | thick round slab, shallow groove around the rim on top |
| Chất liệu | light wood, satin finish |

Lệnh: `blockout.py --w 1 --d 1 --h 0.3 --shape cylinder` (w là đường kính; vật tròn dùng khối trụ, không dùng hộp vuông). Prompt thêm: `Match the silhouette of image 1 exactly: the top ellipse is exactly twice as wide as tall, the visible side wall is about 0.27 of the width.`

**Khối tường**:

| Mục | Điền |
|---|---|
| Chân đế | 1 × 1 ô |
| Cao | 2,5 ô |
| Hình khối | rounded box, flat top, no openings |
| Chất liệu | matte cream plaster, thin dark skirting at the bottom |

Lệnh: `blockout.py --w 1 --d 1 --h 2.5`. Muốn tường nối liền nhau thì thêm: `left and right vertical faces must be plain so several blocks can sit edge to edge`.

**Xe máy** (có hướng):

| Mục | Điền |
|---|---|
| Chân đế | 1 × 2 ô, dài dọc theo W |
| Cao | 1,2 ô |
| Mặt trước | `right`: đầu xe hướng xuống-phải |
| Chi tiết | headlight and handlebars at the front end, seat and rear rack at the back end |

Prompt thêm: `the headlight faces the lower right of the image; the rear rack faces the upper left`.
