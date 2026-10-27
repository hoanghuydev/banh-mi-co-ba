# Ánh sáng, bóng đổ, chất lượng hình ảnh cảnh quán

So sánh ảnh game hiện tại với ảnh tối ưu (`/home/hoanghuy/Downloads/game/normal-quality.png` và `enhance-quality.png`), kèm phương án sửa.
Chưa làm gì trong code. Mọi con số "đo" dưới đây lấy từ `public/art/`, `src/world/`, `src/ui/stall/Daylight.ts`.

## 1. Hiện trạng đo được

| Thứ | Số đo | Hệ quả |
|---|---|---|
| Engine | Phaser 3.90, 2D, lưới iso 2:1 (`TW 60 / TH 30`), camera `ZOOM 1.28` × `RENDER_SCALE` 1–2 | Không có 3D thật, không có đèn thật |
| Ảnh đạo cụ (21 cái) | rộng 116–448 px, cao 288–568 px, hiển thị ~46–60 px thiết kế | Dư nét 2–3 lần, nén xuống nên sắc |
| **Ô sàn `f_walk*`, `f_road*`** | **62 × 38 px** cho 1 ô, hiển thị 77–154 px | **Phóng 1,2–2,5 lần → gạch bị mờ.** Đây là nguyên nhân chính |
| Sàn | Mỗi ô có 4 biến thể riêng, mỗi biến thể tự có mạch gạch | Hoa văn xương cá đứt ở mép ô → "cắt khúc, không vạt mép" |
| Hướng sáng trong ảnh đạo cụ | 20/21 ảnh mặt phải sáng hơn mặt trái (STYLE: key light phải-trên) | Đã nhất quán, **không cần tạo lại để sửa hướng sáng**. Ngoại lệ: `prop_sink` (sáng đều hai nửa) |
| Nhân vật | Render Blender, 2 đèn cố định trong thế giới, model xoay 8 hướng (`tools/render-character.py`) | Ánh sáng nướng sẵn vẫn đúng khi đi, vì nguồn sáng không đổi |
| Lớp ánh sáng hiện có | `Daylight.ts`: màu nhân (multiply) cả cảnh + vignette + vạt nắng cộng (ADD) có mặt nạ | Có chỗ để gắn thêm lớp, không phải dựng mới |
| Bóng đổ | Không có. Chỉ có `PAL.shadow` dùng cho màu | Vật như dán lên nền |

## 2. Chốt ánh sáng (đề xuất, chờ duyệt)

Mục tiêu: mỗi vật chỉ có đúng các bóng dưới đây, không đẻ thêm.

| Nguồn | Vai | Bóng | Cách vẽ |
|---|---|---|---|
| **Nắng** | Ánh sáng chính | Bóng **dài, cứng đầu, mờ dần về đuôi**, đổ về **dưới-trái màn hình** | Ảnh bóng riêng, nướng bằng script (mục 3) |
| **Trời (ambient)** | Sáng nền, hơi lạnh | Bóng **đậm, ngắn, mềm** sát chân vật (AO) | Ảnh AO riêng, hình theo diện tích chân |
| **Đèn tường** | Đèn vàng ấm | **Không đổ bóng.** Chỉ quầng sáng | Sprite quầng, blend SCREEN |
| **Lò nướng** | Đỏ cam từ lòng lò | Không bóng. Chỉ phát sáng ở cửa lò | Sprite phát sáng, bật khi đang nướng |

- Ảnh enhance có 2 bóng ở thùng rác (đậm + nhạt) vì ảnh AI tự tính. Ta làm **cố ý**: AO đậm ngắn + bóng nắng nhạt dài. Đèn không đẻ bóng thứ ba.
- **Hướng nắng:** bóng đổ theo vector màn hình (−2, +1). Đó đúng là trục thế giới +y của lưới (`sx = (wx−wy)·30`, `sy = (wx+wy)·15`; đi +1 theo wy → (−30, +15)). Bóng chạy dọc mép ô nên khớp lưới, không lệch.
- **Độ cao nắng:** hệ số `SUN_K` (độ lệch bóng theo mỗi px chiều cao vật). Khởi điểm 0,35, chỉnh bằng mắt. Thử 0,5 thấy dài quá, 0,9 vô lý (ảnh thử bên dưới).
- **Cả ngày:** hướng và độ dài bóng cố định (nướng sẵn); sáng → trưa chỉ đổi độ đậm và màu qua `sunAt()`. Trời mưa (`OVERCAST`): bỏ bóng nắng, giữ AO.
- Vạt nắng hiện có trượt ngang theo giờ còn bóng đứng yên → lệch nhẹ. Chấp nhận; nếu thấy vướng mắt thì cho cả lớp bóng trượt vài px.
- Đèn tường chỗ bàn thớt: 2 đèn, bán kính ~2 ô mỗi đèn, cường độ theo giờ (sáng rõ lúc 6h, mờ dần khi nắng lên, gần tắt trưa). Dùng SCREEN để chỗ hai quầng chồng nhau không cháy trắng.

## 3. Trả lời từng câu hỏi

| Câu hỏi | Trả lời | Vì sao |
|---|---|---|
| Viên gạch lệch tông có phải do ánh sáng không? | **Phần lớn đúng**: mảng sáng/tối lớn là do nắng và bóng. Nhưng từng viên khác nhau chút ít là vật liệu, nằm trong ảnh gạch | Mức lệch từng viên chỉ ±4–6% (đề xuất trước nói ±8–12% là quá tay) |
| Tủ kính bánh mì, lò nướng: tạo lại ảnh hay code ánh sáng? | **Giữ ảnh. Thêm ánh sáng bằng code chỉ ở phần động**: phát sáng lòng lò khi nướng, bóng, AO. Phản chiếu và highlight bên trong kính là chi tiết của ảnh nên **tạo lại ảnh chỉ khi** nhìn thấy kính trơ | Đồ này đã có ánh sáng đúng hướng. Code chỉ phủ được lớp phẳng, chồng lên kính thì giả hơn |
| Bóng tán cây: code hay tạo ảnh? | **Tạo ảnh** 2–3 tấm tán lá (trắng-đen, mềm, ghép liền), phủ multiply, trôi chậm. Không sinh bằng noise code | Noise code ra đốm tròn, không ra hình lá |
| Đổ bóng: kéo dài vật thể hay code? | **Kéo dài vật thể, nhưng bằng phép nghiêng + bẹp (affine) từ chính ảnh alpha, nướng bằng script lúc build**, không tính lúc chạy. Không dùng kéo giãn thẳng | Phaser Sprite không có skew nên không nghiêng được lúc chạy. Ảnh thử bên dưới cho thấy hình thùng rác đúng |
| Sợ code đổ bóng dở còn giả hơn | Đúng. Quy tắc để không giả: một hướng duy nhất; độ dài theo chiều cao thật; đuôi mờ hơn gốc; AO theo hình chân (thoi), không phải elip; bóng chỉ nằm trên sàn, cắt bỏ phần chui vào tường/quầy; màu tím-xanh nhạt, không đen | |
| Gạch đỏ vỉa hè, gạch đường: tạo lại ảnh? | **Có. Tạo lại.** Chi tiết ở mục 4 | Ô hiện tại 62×38 px là gốc của việc mờ |
| Gạch đường: thành một khối hay giữ viên? | **Giữ viên, giữ lưới ô cho logic.** Ảnh nguồn là **một tấm liền** nhiều ô; script cắt theo ô theo toạ độ thế giới | Hoa văn nối liền qua ô, hết cắt khúc. Vẫn giữ ô nên không đổi bản đồ |
| Đèn gắn tường: tạo bóng đèn rồi code ánh sáng? | **Đúng.** Ảnh bóng đèn (thân đèn, chao, bóng tắt/bật). Quầng sáng, vệt sáng lên tường và sàn là sprite blend SCREEN, cường độ theo giờ | Quầng sáng lên tường phải theo mặt phẳng tường iso nên dùng ảnh elip méo sẵn, không dùng tròn |
| Ánh sáng code sao cho không giả? | Ít lớp, mỗi lớp có vai (mục 2). SCREEN không dùng ADD. Không bao giờ có hai nguồn cùng đổ bóng cứng. Cường độ đổi chậm theo giờ | Giả thường do chồng quá nhiều quầng và bóng ngược hướng |
| Gạch men bóng: xử lý phản chiếu? | **Giả có kiểm soát**, ba tầng, tầng sau làm sau cùng: (1) ảnh men sạch, khe vữa rõ, không nướng sáng; (2) vạt nắng sáng gắt hơn trên men, mờ hơn trên gạch đỏ (hệ số theo loại sàn); (3) thử phản chiếu mờ của quầy, tủ, lò bằng chính sprite lật dọc, alpha ~0,12, mờ dần. Tầng 3 chỉ giữ nếu nhìn ảnh chụp thấy đẹp | Phản chiếu thật cần 3D. Giả (1)+(2) đủ rẻ và an toàn |
| Xe, bồn rửa… có cần tạo lại để enhance? | **Không cần để sửa ánh sáng** (20/21 đúng hướng). Chỉ gen lại nếu mắt thấy mờ hoặc `prop_sink` thấy phẳng. Việc cần làm là thêm bóng + AO | Ảnh đạo cụ đã dư nét; thứ thiếu là tiếp đất |
| Biển hiệu dẹt: làm nổi? | **Nổi nhẹ, không extrude chữ.** Tạo lại ảnh khung biển có độ dày ~3–4 px thiết kế, viền sáng cạnh trên-phải. Chữ vẫn vẽ bằng code trên mặt phẳng biển (đúng luật canvas). Thêm bóng đổ mềm xuống tường về phía dưới-trái | Chữ 3D tốn nhiều, lợi ít |
| Tường | **Hoãn.** Khi tạo lại tường mới làm các việc ở cột "phụ thuộc tường" mục 5 | Tường đổi thì chỗ đèn, bóng biển, bóng lá lên tường đổi theo |
| Nhân vật có nướng sẵn ánh sáng được không, vì nó di chuyển? | **Được, và đã vậy.** Đèn cố định trong thế giới, model xoay → luôn khớp nắng. Cái thiếu là **bóng của nhân vật**: nướng thêm một atlas bóng bằng cùng phép nghiêng cho mọi frame (cộng ~0,5–1 MB mỗi nhân vật, tính theo `player.webp` 1,0 MB) | Dùng elip tròn thì lệch với bóng dài của đạo cụ, nhìn giả |
| Chuyển game sang 3D thật? | **Không nên.** Xem mục 6 | |

## 4. Gạch: ảnh mới nên thế nào

| Mục | Yêu cầu |
|---|---|
| Kiểu ảnh | **Nhìn thẳng từ trên (top-down)**, phẳng, không iso. Script mới dựng sang iso (đã có `unwrap` / `floor_tile` trong `tools/prep-art.py`) |
| Liền mạch | Ghép liền tấm lớn ≈ 8×8 ô, mép trái khớp mép phải, mép trên khớp mép dưới |
| **Không nướng sáng/tối** | Ảnh thuần màu vật liệu, không bóng, không vạt nắng, không highlight. Ánh sáng và bóng do lớp code phủ (đổi theo giờ được) |
| Cỡ viên | Giảm số viên mỗi ô khoảng một nửa so với hiện tại; mỗi viên ≥ 24 px khi lên iso. Số cụ thể đo trên ảnh chụp trước khi gen |
| Khe vữa | Tối hơn viên, rõ, đều |
| Màu | 3–4 sắc đỏ-cam lệch nhẹ ±4–6%, vài viên sứt hoặc ố, rêu nhẹ ở khe. Gạch đường nhựa: có hạt, vết bánh xe |
| Cỡ xuất | Mỗi ô ≥ 192×96 px (sàn 27" QHD, ×3,2), mục tiêu 288×144 (4K). Hiện 62×38. Xem `QUY-TAC-CANVAS.md` mục "Độ phân giải tối thiểu" |
| Mép vỉa hè | Ảnh riêng: bó vỉa có độ dày liền, thay phần đầu dầm lòi ra. Có trong danh sách (mục 5, #13) |
| Sàn men tiệm | Cùng quy tắc; khe vữa rõ; thêm lớp gloss ở mục 3 |

## 5. Danh sách việc (24 mục) — kèm loại việc

Loại: **Ảnh** = tạo/ gen lại ảnh · **Script** = tool nướng lúc build · **Code** = lớp chạy trong game.
Cột T = phụ thuộc tường (làm sau khi tạo lại tường).

| # | Việc | Loại | T | Ưu tiên |
|---|---|---|---|---|
| 1 | Bóng nắng cho mọi đạo cụ (nghiêng + bẹp từ alpha, đuôi mờ) | Script | | 1 |
| 2 | AO tiếp đất theo diện tích chân (kể cả nhân vật, xe, thùng rác) | Script | | 1 |
| 3 | Chốt ánh sáng: hướng, `SUN_K`, màu theo giờ (mục 2) | Code | | 1 |
| 4 | Bóng tán lá phủ đường, vỉa hè, sàn (2–3 tấm ảnh) + lớp nhạt phủ lên vật và người | Ảnh + Code | | 2 |
| 5 | Đèn tường phát sáng, SCREEN, theo giờ | Ảnh + Code | ✔ | 2 |
| 6 | Tách độ sáng ba mặt tường: mặt trên, mặt trái, mặt phải | Ảnh | ✔ | 3 |
| 7 | **Gạch vỉa hè: tạo lại** (mục 4) | Ảnh + Script | | 1 |
| 8 | Lệch tông từng viên ±4–6% (nằm trong ảnh gạch ở #7) | Ảnh | | 1 |
| 9 | **Đường nhựa: tạo lại**, vạch sơn mòn, lá rụng | Ảnh + Script | | 2 |
| 10 | Sàn men tiệm: ảnh sạch + khe + lớp gloss theo vạt nắng | Ảnh + Code | | 2 |
| 11 | Tường: ố, nứt, gờ mũ tường | Ảnh | ✔ | Hoãn |
| 12 | Kính, kim loại: rim light, highlight (chỉ khi nhìn thấy trơ) | Ảnh | | 3 |
| 13 | Bịt mép vỉa hè, bó vỉa liền | Ảnh | | 1 |
| 14 | Dải chuyển tiếp đường — vỉa hè — ngưỡng cửa tiệm | Ảnh | | 2 |
| 15 | Bo mép / viền sáng cạnh cho khối tường, quầy | Ảnh | ✔ | 3 |
| 16 | Căn lưới gạch theo kích thước ô, rìa dùng viên nguyên | Script | | 1 |
| 17 | Thêm decor tường: đèn, hộp điện, ống, bảng | Ảnh | ✔ | 3 |
| 18 | Cây nhiều lá hơn, thêm lá rụng trên đất | Ảnh | | 3 |
| 19 | Bóng nhỏ dưới vật gắn tường (cửa sổ, bảng, tranh) | Code | ✔ | 3 |
| 20 | Biển hiệu nổi nhẹ + bóng xuống tường | Ảnh + Code | ✔ | 2 |
| 21 | Màu: ấm ở vùng sáng, lạnh ở vùng bóng, tăng bão hoà và tương phản | Code | | 2 |
| 22 | Nền ngoài cảnh: vignette, phủ bóng lá, tối dần ra rìa | Code | | 2 |
| 23 | Độ nét: kiểm tra `RENDER_SCALE`, mipmap/lọc texture sàn (sau khi sàn có ảnh mới) | Code | | 2 |
| 24 | Hạt: lá rụng, bụi trong nắng, chuyển động chậm | Code | | 3 |
| – | Ba vòng tròn đen giữa HUD ở ảnh hiện tại: xác định có phải slot rỗng không | Soi | | 1 |
| – | Atlas bóng nhân vật (mục 3) | Script | | 1 |
| – | Phản chiếu mờ trên sàn men (tầng 3 mục 3) | Code | | Cuối, thử rồi giữ/bỏ |

## 6. Có nên chuyển game sang 3D thật?

**Không.** Lợi: bóng, phản chiếu, đèn đúng tự động. Hại đo được:

- Mọi thứ trong `src/art/`, `scenes/StallScene.ts` (2564 dòng), `ui/stall/`, `entities/`, độ sâu theo `x+y`, chọn bằng chuột trên lưới iso, hạt hơi nước và mưa đều phải viết lại.
- ~21 đạo cụ + sàn + tường hiện là ảnh 2D; 3D cần model từng cái (Tripo) và đo lại mọi kích thước ô.
- Giữ nguyên được: `sim/`, `content/`, `dialog/`, `core/`, `audio/` — nhưng việc đi ngược mục tiêu revamp "đơn giản lại".
- Rủi ro hiệu năng trên máy yếu (hiện có trần 33 ms/frame).

Phương án trung gian có thể cân nhắc cho đạo cụ lớn: **Tripo → Blender render đúng camera iso và nắng cố định**, như pipeline nhân vật hiện có. Cho ra bóng, AO, phản chiếu men chính xác, khớp hình học 0,5 (ảnh AI hay lệch 0,58–0,65 như `QUY-TAC-CANVAS.md` đã ghi). Tốn credit Tripo và thời gian Blender cho từng vật. Không làm nếu phương án chính (ảnh AI + script bóng) đã đạt.

## 7. Phương án để chọn

| | Phương án A (đề xuất) | Phương án B |
|---|---|---|
| Đạo cụ | Giữ ảnh AI hiện có. Thêm bóng + AO bằng script | Đạo cụ chính (quầy, tủ, lò, xe) làm lại bằng Tripo → Blender |
| Sàn | Tạo lại ảnh sàn (mục 4) | Giống A |
| Công sức | 1 script bóng + 3–4 loại ảnh sàn/tán lá/quầng + chỉnh `Daylight.ts` | A + khoảng 10 model 3D |
| Rủi ro | Hình học lệch ở vài đạo cụ vẫn còn | Tốn credit, model Tripo có thể kém nét hơn ảnh ChatGPT |
| Bóng, phản chiếu | Giả có kiểm soát | Chính xác |

## 8. Kiểm tra khi làm

Theo `CLAUDE.md` §3: chụp game thật, phóng 4–5× vào chân đồ, mối nối sàn, mép vỉa hè, bóng lá; xem cả PC và mobile; xem ngày nắng và ngày mưa; xem bóng có chui vào tường hoặc quầy.

Ảnh thử nghiệm phép nghiêng bóng trên thùng rác (không đổi; trái: không bóng, giữa: `SUN_K` 0,5, phải: 0,9):
`/tmp/claude-1000/-home-hoanghuy-Work-BackupData-Freelancer-Game/53fefc9f-cd6c-44db-bafb-8fcc022aff60/scratchpad/shadow_proto.png`.
Kết luận từ ảnh: hình bóng đúng, đuôi mờ ổn. Cần chỉnh: AO phải theo hình thoi của chân (đang là elip, nhìn thùng rác hơi lơ lửng), bóng còn quá dài ở 0,5.

## 9. Demo đã dựng (27" QHD, ×3,2)

Thư mục `art-raw/_duyet/anh-sang-demo/`: `scene_before.png`, `scene_after.png`, `sosanh_truoc_sau.png`, `can_canh_sau_x2.png`, `gach_goc_1-1.png`; dựng bằng `demo.py`. Ảnh nguồn: `art-raw/_duyet/gach_men/final.png` (gạch men, 1254 px, 4×4 ô), `art-raw/_duyet/tan_la/final.png` (tán lá, 1254 px).

| Kết quả | Nhận xét |
|---|---|
| Bóng nắng | Mỗi cột ảnh lấy điểm chạm đất thấp nhất làm gốc, bóng lệch theo (−2, +1) × `SUN_K` 0,45. Bám đúng chân vật, đuôi mờ dần. Cách "bẹp + nghiêng quanh một hàng" cho bóng bị cắt phẳng ở đỉnh nên bỏ |
| AO | Hình thoi theo chân, đậm; hết cảm giác lơ lửng |
| Sàn men | Vạt nắng + quầng sáng + phản chiếu mờ của quầy/thùng. Đọc được là sàn bóng |
| Tán lá | Phủ multiply, mạnh trong vạt nắng, nhạt ngoài. Lá nhìn giống lá phong, chấp nhận |
| Thùng rác | Ảnh gốc 294 px cao so với mức sàn 147 px → **không cần gen lại** |
| **Kính tủ** | Phủ vệt sáng bằng code chỉ ra màn sương trắng trên ổ bánh, giả. Bản gọn nhất để lại rất nhạt. **Nên gen lại ảnh tủ kính có phản chiếu** |
| Cạnh bóng | Cần thêm khử răng cưa ở mép bóng khi làm bản dùng thật |

**Phát hiện ngoài phạm vi ảnh:** `MAX_SCALE = 2` trong `src/core/render.ts` giữ canvas ở 2048 px. Màn 27" QHD rộng 2560 px nên canvas bị trình duyệt phóng ~1,25×, 4K phóng ~1,9×. Ảnh nguồn đủ nét cũng bị mờ ở bước này. Nâng trần cần đo lại ngân sách 33 ms/frame.

### Bản v2 (`demo2.py`, `v2_after.png`)

| Thay đổi | Kết quả |
|---|---|
| Gen lại tủ kính và thùng rác bằng ChatGPT từ ảnh cũ + ảnh tham khảo (1 lượt mỗi cái, Photoroom xoá nền): `art-raw/_duyet/tu_kinh_hd/final-Photoroom.png`, `art-raw/_duyet/thung_rac_hd/final-Photoroom.png` | Nét hơn rõ (853×1127 và 848×1088 px, mức sàn 250 và 147 px). Kính có phản chiếu lá, thép có highlight ấm, thùng có highlight nắp. Thùng hơi cao và hẹp hơn ảnh cũ, màu hơi vàng hơn |
| Phản chiếu lật qua điểm chạm đất của từng cột ảnh | Gốc phản chiếu dính chân vật, chân tủ phản chiếu liền chân thật |
| Ánh sáng tính một lần: `sáng = lá × (1 − bóng vật)`, dùng chung cho sàn và vật; điểm trên vật tra ánh sáng tại điểm chạm đất của tia nắng (cùng phép chiếu với bóng đổ) | Bóng tủ đậm hơn bóng lá, bóng vật chặn luôn đốm sáng lá |
| Bóng tủ lấy theo độ trong của ảnh | Phần kính cho bóng nhạt, khung và thân thép cho bóng đậm |

Còn tồn: ảnh tán lá hiện mờ biên, lên sàn thành mảng loang chứ chưa ra hình lá rõ như ảnh tham khảo; đốm lá trên vật chưa thấy rõ vì hai vật đặt ở chỗ sáng nhiều.

### Phản chiếu sàn bóng (chốt cách làm)

- Cạnh đứng của vật vẫn thẳng đứng trong iso, nên **lật dọc ảnh qua đường chạm đất là đúng hình học**; không cần gen ảnh ngược bằng AI, không cần xoay.
- Chỉ lật **mặt bên**: cao `side` × chiều cao ảnh (thùng 0,62, tủ 0,64). Mặt trên không hiện trong gương nên cắt bỏ; lật cả ảnh thì nắp thùng lòi ra cuối bóng.
- Đường chạm đất = bao dưới của đáy ảnh bằng nón dốc 0,5 (cạnh đáy iso). Gốc phản chiếu dính chân vật, kể cả tủ có chân.
- Độ đậm 0,62 ở gốc → 0,16 ở đuôi, mờ dần theo khoảng cách. Lấy mẫu dưới điểm ảnh để mép dốc không răng cưa.
- Đường chạm đất này cũng dùng cho bóng đổ.

## 10. Tổng hợp việc đã làm

| # | Việc | Kết quả |
|---|---|---|
| 1 | So sánh ảnh hiện tại và ảnh enhance, liệt kê 24 nguyên nhân kèm loại việc (ảnh / script / code) | Mục 5 |
| 2 | Đo trong code: ô sàn chỉ 62×38 px (phóng 1,2–2,5×), 20/21 ảnh đạo cụ đã sáng từ phải, nhân vật nướng đèn cố định | Mục 1 |
| 3 | Chốt ánh sáng: nắng đổ về dưới-trái (= trục +y của lưới), `SUN_K` 0,45, một nắng + một trời + đèn không đổ bóng | Mục 2, skill mục 1 |
| 4 | Rule độ phân giải màn 27": ảnh nguồn ≥ cạnh thiết kế × 3,2 (4K: ×4,8) | `QUY-TAC-CANVAS.md`, skill `tao-anh-game` bước 7b |
| 5 | Phát hiện `MAX_SCALE = 2` làm canvas bị phóng ~1,25× trên màn 27" QHD | Mục 9; chưa sửa |
| 6 | Gen ảnh gạch men 4×4 và ảnh tán lá bằng ChatGPT (2 sub-agent, 1 lượt mỗi ảnh) | `art-raw/_duyet/gach_men/`, `tan_la/` |
| 7 | Gen lại tủ kính và thùng rác ở chất lượng cao từ ảnh cũ + ảnh tham khảo, xoá nền Photoroom | `tu_kinh_hd/`, `thung_rac_hd/` |
| 8 | Bóng đổ: chiếu từng điểm ảnh theo đường chạm đất, kính nhạt, thép đậm, đuôi nhoè | `tools/light-demo.py` |
| 9 | AO hình thoi theo chân | idem |
| 10 | Ánh sáng nắng qua lá tính một lần cho sàn lẫn vật; bóng vật chặn đốm lá | idem |
| 11 | Phản chiếu sàn bóng: lật mặt bên qua đường chạm đất, bỏ mặt trên, mờ dần, 0,34 → 0,07 | idem |
| 12 | Đường chạm đất = bao lõm trên của đáy cột; mái nhô được kéo dài theo độ dốc rìa | Sửa hở chân tủ dưới trái và hai thanh dọc ở góc thùng rác |
| 13 | Phản chiếu chỉ trên chất liệu bóng: dải gạch đỏ thử không phản chiếu, vẫn có bóng đổ | `MATTE_FROM_V` trong tool |
| 14 | Thêm bồn rửa vào cảnh demo | Dùng ảnh cũ, đường chạm đất lùi về nón dốc 0,5 vì chỉ có một chân ống |
| 15 | Viết skill `anh-sang-vat-the` và nối vào `.claude/CLAUDE.md`, `QUY-TAC-CANVAS.md` | `.claude/skills/anh-sang-vat-the/SKILL.md` |

Chưa làm: dựng vào game thật (`StallScene`, `Daylight.ts`), gạch đỏ và nhựa ảnh mới, tường, đèn tường, biển hiệu nổi, tăng `MAX_SCALE`, ảnh tán lá rõ hình lá, gen lại bồn rửa.
