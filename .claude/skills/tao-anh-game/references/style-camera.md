# Style, camera, mẫu prompt

## Khối STYLE (dán nguyên văn, không sửa chữ)

```
STYLE: cozy stylized 3D render, like a polished toy or soft clay model. Rounded bevelled edges, clean simple forms, matte-satin materials with gentle subtle texture, slightly saturated warm colors. Soft studio lighting: key light from the upper right, so faces turned to the right are lighter and faces turned to the left are darker, with soft ambient occlusion. No outlines, no photo realism, no painterly brush strokes, no flat 2D vector look.
BACKGROUND: pure flat white (#FFFFFF), nothing else. No ground, no floor, no cast shadow, no reflection, no text, no logo, no watermark.
```

Ánh sáng từ phải-trên khớp `floor_tile()` trong `tools/prep-art.py` (mặt trái 0.68, mặt phải 0.84).

## Khối CAMERA (dán nguyên văn)

```
CAMERA: true isometric view, orthographic, no perspective distortion. Camera is raised 30 degrees above the horizon and the object is turned 45 degrees, so you see the TOP face and TWO vertical faces (left face and right face). Check: a square top face must look like a flat rhombus exactly twice as wide as it is tall, and a circle on the ground must look like an ellipse twice as wide as tall. Vertical edges are perfectly vertical.
```

## Hướng mặt trước

Chọn một dòng, dán sau khối CAMERA:

| `--front` | Dòng dán |
|---|---|
| `right` | `FACING: the front of the object (doors, handles, face, headlight, open side) is on the RIGHT visible vertical face, pointing toward the lower right of the image. The left visible face is the side.` |
| `left` | `FACING: the front of the object (doors, handles, face, headlight, open side) is on the LEFT visible vertical face, pointing toward the lower left of the image. The right visible face is the side.` |

Đồ không có mặt trước (bàn tròn, thùng, cây) bỏ dòng FACING.

## Mẫu prompt (đồ đứng / đạo cụ)

Gửi kèm đúng 2 ảnh (ChatGPT free): ảnh khối + 1 ảnh mẫu. Dòng đầu đặt đúng vai từng ảnh.

```
Image 1 is a gray blockout showing the exact camera angle, footprint and proportions to use. Image 2 shows the art style to match (material, rounding, lighting, colour saturation). Draw the object below in the exact camera angle and proportions of image 1, in the art style of image 2. The gray blockout, its edges and the red arrow are guides only: do not draw them.

OBJECT: <phiếu mô tả: tên, kích thước, các bộ phận, chất liệu và màu>

<STYLE>
<CAMERA>
<FACING>
Single object, centered, fully inside the frame with a small margin, nothing cropped. Square image.
```

## Mẫu prompt khác

| Loại | Thay đổi |
|---|---|
| Ô sàn | Khối `--w 1 --d 1 --h 0.15`. Thêm: `One single flat slab one tile in size, the top face is the pattern. Pattern must fill the whole top face edge to edge, tileable, no border, no props on top.` Bỏ FACING. Mặt trên phải là hình thoi 2:1 vì `prep-art.py` trải phẳng từ mặt trên |
| Nguyên liệu, món nhỏ | Bỏ ảnh khối. Dùng cùng CAMERA nhưng nói rõ `small food item lying on the ground, seen from above at 30 degrees`. Mẫu: `fried_egg`, `ham_slice`, `baked_baguette` |
| Nhân vật | Xem mục **Nhân vật (T-pose)** bên dưới |

## Nhân vật (T-pose)

Không dùng khối xám và không dùng camera iso. Nhân vật cuối cùng đi qua model 3D rig nên cần ảnh T-pose nhìn thẳng chính diện. Gửi 2 ảnh ref nhân vật có sẵn trong `art-raw/` (`anh-bao-list.png`, `anh-dung-list.png`, `ba-bay-list.png`, `driver_char_list.png`, `character_model_list.png`) hoặc 1 ref nhân vật + 1 ref style.

```
Image 1 (and image 2) are existing characters of the game: match their art style, face style, proportions, colour saturation and level of detail. Draw a NEW character below in that same style.

CHARACTER: <phiếu: tuổi, giới tính, dáng người, tóc, mặt, trang phục từng món + màu, giày>

POSE: strict T-pose. Standing straight facing the camera, both arms stretched out horizontally to the sides at shoulder height, palms down, fingers straight, legs straight and slightly apart, feet flat, head level, neutral calm face, mouth closed. Perfectly symmetric front view. Nothing in the hands, no props, no bag.
CAMERA: orthographic front view at eye level, no perspective, no tilt. The full body from the top of the head to the soles of the feet is visible with a small margin, nothing cropped.

<STYLE>
Single character, centered. Square image.
```

Tay không che thân, tóc và quần áo không che khớp vai, khuỷu, gối (để rig không méo). Cần thêm góc lưng thì gen lượt riêng, vẫn T-pose, `back view`.

## Chọn ảnh mẫu theo loại

Chọn các ảnh dưới đây vì đúng góc iso 30° và đúng style; không dùng `cutting_board.png` làm mẫu vì nó là ảnh chụp thật.

| Loại | Ảnh mẫu trong `art-raw/` |
|---|---|
| Đồ kim loại, tủ, máy | `bread_display_cabinet-removebg-preview.png`, `refrigerator-Photoroom.png`, `water_dispenser-removebg-preview.png` |
| Đồ nhựa, đồ gia dụng nhỏ | `plastic_table_and_stools-removebg-preview.png`, `recycling_bin-removebg-preview.png`, `red_round_stool-removebg-preview.png` |
| Xe, đồ có hướng rõ | `vintage_motorbike-removebg-preview.png`, `vespa_scooter-removebg-preview.png` |
| Ô sàn | `brick_pavement-removebg-preview.png`, `asphalt_ground_tile-removebg-preview.png` |
| Đồ ăn | `baked_baguette-removebg-preview.png`, `fried_egg-removebg-preview.png`, `banh_mi_on_paper_tray-removebg-preview.png` |
| Cây, đồ trang trí | `potted_plant-removebg-preview.png`, `wooden_a_frame_sign-removebg-preview.png` |

Mỗi lần chọn 1 ảnh **cùng chất liệu** với món cần làm, ưu tiên ảnh có mặt trước cùng hướng với món mới.
