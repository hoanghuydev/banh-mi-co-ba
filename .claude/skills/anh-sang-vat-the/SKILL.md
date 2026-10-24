---
name: anh-sang-vat-the
description: Luật ánh sáng, bóng đổ, bóng tán lá, bóng toà nhà, bóng người, nắng ấm, phản chiếu sàn bóng và độ phân giải cho cảnh quán Bánh Mì Cô Ba. Dùng khi thêm hoặc dời đạo cụ, đổi chất liệu sàn, gen lại ảnh đạo cụ hoặc ảnh bóng, hoặc đụng bất kỳ thứ gì liên quan nắng, bóng, phản chiếu.
---

# Ánh sáng và bóng

Đã chạy trong game. Lịch sử và lý do các lần sai: `.claude/learning-loop/anh-sang-nhat-ky.md` (đọc trước khi đổi cách làm). Phân tích gốc: `docs/revamp/ANH-SANG-VA-HINH-ANH.md`; kiến trúc: `docs/revamp/ANH-SANG-TICH-HOP.md`.

## 0. Nguyên tắc dựng (quan trọng nhất)

1. **Ghép đơn giản trước.** Hiệu ứng ánh sáng = ảnh nguồn nét nhân lên sàn. Dựng demo ngoại tuyến bằng phép ghép đơn giản nhất cho khớp ảnh đích, thấy đúng rồi mới đưa vào engine. Engine chỉ phức tạp hơn khi cần động theo giờ, mưa, người đi qua.
2. **Không làm mất thông tin ảnh nguồn.** Cấm ép ngưỡng đen-trắng, cấm nhoè, cấm lấy mẫu độ phân giải thấp rồi phóng. Giá trị xám của ảnh bóng được dùng nguyên; độ mềm là một tham số riêng (`soft`) chỉnh được.
3. **Một hiệu ứng, một nguồn dữ liệu.** Hai lớp cùng đọc một trường đã nhoè là dấu hiệu cộng trùng. Lỗi nhìn thấy thì tìm nguồn, đừng chồng lớp vá.
4. **Quyết định theo điểm ảnh, không theo ô** (ranh chất liệu, ranh trong/ngoài, chỗ bóng chồng bóng).
5. **Ảnh đích thật thắng lời mô tả.** Người dùng đưa ảnh tham chiếu (bóng lá, bóng toà nhà, gạch sau chỉnh): so đúng khung cắt, không so tổng thể.
6. **Ảnh gen cho cái hình, code cho độ mềm và cường độ.** ChatGPT dùng để gen ảnh nguồn; không dùng để xin hệ số.
7. **Kiểm giả thuyết trước khi sửa:** chụp hai lần cùng cấu hình để biết có ngẫu nhiên không (tường nhà bên cạnh đổi kiểu mỗi lần tải).

## 1. Các lớp và file

| Lớp | Việc | File |
|---|---|---|
| Lõi thuần TS | Bóng đổ vật, AO, phản chiếu, lightmap, trường nắng | `src/art/light/*` (`compose.ts`, `shadow.ts`, `reflect.ts`, `constants.ts`, `types.ts`, `env.ts`) |
| Cảnh | Lightmap (MULTIPLY), phản chiếu, nắng ấm (SCREEN), tường, đốm lá lên đạo cụ | `src/world/lightLayers.ts`, `lightTint.ts`, `lightParams.ts` |
| Bóng bề mặt vật | Kim loại, sứ, men xanh | `src/world/propSheen.ts`, `sheenParams.ts`, `src/art/light/sheen.ts` |
| Đèn | 3 đèn tường, ánh lò | `src/ui/stall/Lamps.ts`, `src/world/lampSpots.ts` |
| Người và khách | Bóng, AO, phản chiếu, nhuộm nắng | `src/art/light/actor.ts` |

Lightmap chỉ nhân (tối đa 1,0). Muốn sáng thêm, ấm thêm: lớp SCREEN hoặc NORMAL riêng. Tên lớp phải khác tên lớp của Daylight (`tone`, `patch`).

## 2. Hằng số hiện hành (`src/art/light/constants.ts`)

| Hạng mục | Giá trị |
|---|---|
| Hướng nắng | Bóng đổ về dưới-trái = trục thế giới +y; `SUN_K = 0,45` |
| Ánh sáng sàn | `AMB (0,90; 0,91; 0,96)`, `SUN (0,10; 0,09; 0,04)`; mất nắng thì còn `AMB` |
| Bóng đổ vật | Cắt ambient `CAST_AMB_CUT 0,40`; AO `0,95`, rộng `1,4` |
| Bóng lá / bóng nhà | Độ tối riêng theo kênh `LEAF_DARK (0,37; 0,40; 0,43)` (màu nâu ấm kiểu `#554638`), không cộng vào số hạng nắng |
| Nắng ấm | Một lớp SCREEN `#FFE0A0`, độ đậm 32% (`WARM` trong `lightTint.ts`), nhân mặt nạ nắng sắc nét; đường nhựa 16% |
| Trời mưa | Bỏ bóng nắng và bóng lá, giữ AO |

Nắng ấm: chỉ một lớp, bám mặt nạ nắng. Đã thử mảng nắng nhiễu và điểm rực: nhìn giả và lem, đã xoá.

## 3. Bóng tán lá và bóng mặt tiền (ảnh xám đặt theo ô thế giới)

Cấu hình ở `canopiesOf()` trong `src/world/lightLayers.ts`; mỗi mảng là `{ img, x, y, w, h, flipY?, soft?, alpha?, feather? }` theo ô.

| Mảng | Ảnh | Vai trò |
|---|---|---|
| Mặt tiền | `leaf_eave` (D3, ảnh rộng) | Bóng toà nhà và đồ gắn vào (nồi, cột, tam giác, chữ nhật…) chạy hết chiều dài dọc quầy; `soft 0,08`, `feather: false` |
| C | `leaf_c` | Cành lá to, lật dọc, đổ từ góc dưới-trái |
| B | `leaf_b` | Lá to, tán ngắn, lấp khoảng giữa C và A |
| A | `leaf_a` | Tán thòng, từ giữa tới hết cuối đường |

- Trắng = nắng, xám trung bình = bóng đầy (`(1 − xám/255 − 0,03)/0,42`, chặn 0–1). Ảnh mới gen phải theo quy ước này.
- Trong tiệm gần như không có bóng lá (`LEAF_INDOOR 0,07`); ngoài trời đủ. Đường nhựa nhận bóng lá nhưng giảm 45%.
- Thêm mảng mới: gen ảnh (xem mục 8), `tools/prep-art.py` mục `CANOPIES`, `photo.ts` (`LEAF_*_KEY` và danh sách tải), `canopiesOf()`. Chỉnh dài/ngắn bằng `h` (giữ mép dưới bằng cách đổi `y`).
- Bóng toà nhà không đều: nhiều hình đồ vật, độ nét vừa (nét ở ảnh, mềm ở `soft`).

### Bóng lá lên mặt không nằm trên sàn (nóc tường)

- Dùng đúng đường của sàn: `leafCover(canopies)` đọc ảnh xám nguyên giá trị, không nhoè thêm; nóc lấy mẫu tại điểm sàn ngay dưới nó (`worldAt`), nên tường liền nhau cùng một trường bóng, không lệch ở mối nối.
- Màu bóng = `SHADOW_RGB` (nhân), chỗ nắng = lớp SCREEN ấm theo `1 − lá`. Không tự gõ hệ số tối riêng: tông nâu ấm của bóng sàn đến từ đây.
- Ảnh bóng riêng cho nóc (`wallCanopies()` trong `lightLayers.ts`) đặt **đúng tỉ lệ ảnh**: `w/h` của mảng = rộng/cao ảnh, không kéo giãn một chiều. Kéo giãn làm lá thành vệt nhoè, đây từng là lỗi "bóng mềm".
- Chỉ nóc; thân tường không nhận bóng lá.

## 4. Bóng đổ đạo cụ, AO, phản chiếu

- Đường chạm đất = bao lõm trên của các điểm đục thấp nhất mỗi cột; bỏ đoạn dốc > 0,9 (mái nhô), kéo dài theo độ dốc ở rìa. Vật treo một điểm chạm: nón dốc 0,5.
- Bóng: điểm cao `z` đổ tới `(x − 2Kz, g + Kz)`, giá trị = alpha ảnh; đầu gần sắc, đuôi nhoè; màu bóng nhân.
- Phản chiếu: chỉ lật mặt bên qua đường chạm đất, dài `side × h`, mờ dần; nhân mặt nạ chất liệu **theo điểm ảnh** nên đi qua ranh men/gạch phải bị cắt.
- Gạch men (shop): phản chiếu 0,16 → 0,03. Gạch đỏ, nhựa: 0.

Phiếu chất liệu (điền trước khi chỉnh, theo từng vật và từng loại sàn):

| Câu hỏi | Quyết định gì |
|---|---|
| Sàn dưới chân bóng hay nhám, khô hay ướt? | Có phản chiếu không, đậm và nhoè bao nhiêu |
| Vật làm bằng gì (kính, kim loại, nhựa, gỗ, vải, sứ, men)? | Có lớp bóng bề mặt không (mục 5) |
| Vật cao bao nhiêu, có phần rỗng, mái nhô? | Hình chạm đất, `side`, độ dài bóng |
| Chỗ đặt: nắng, bóng nhà, hay dưới lá? | Bóng và lá chồng nhau như thế nào |
| Có đèn gần? | Chỉ cộng quầng ấm; không đẻ bóng thứ hai |
| Mưa, giờ nào? | Mưa bỏ bóng nắng, giữ AO |

Mỗi đạo cụ khai ở `lightParams.ts`: `side`, `fw`, `fh` (cỡ chân theo ô cho AO).

## 5. Bóng bề mặt vật (`PropSheen`)

Lớp SCREEN nướng một lần; vùng bóng lấy theo màu điểm ảnh sprite nên gen lại ảnh vẫn dùng được. Thêm vật mới = thêm một dòng vào `sheenParams.ts`.

| Chất liệu | Vật | Vùng chọn theo màu | Cường độ |
|---|---|---|---|
| Kim loại | lò, tủ kính, kệ | xám, bão hoà thấp | 0,34–0,4 |
| Sứ | bồn rửa | trắng, bão hoà rất thấp | 0,5 |
| Men xanh đậm | mặt quầy, bàn | xanh teal tối | 0,16 (bàn nhỏ) – 0,34 |
| Men trắng | tủ lạnh | trắng | 0,32 |
| Nhựa trong | bình nước | xanh lam nhạt | 0,32 |
| Gỗ, vải, gạch, nhựa đặc | thân quầy… | không chọn | 0 |

Vệt phải có hình và nằm trong vùng chất liệu, không phủ thành sương.

## 6. Bóng người và khách (`src/art/light/actor.ts`)

Quy tắc:
1. **Chỗ chung bóng thì cùng màu, không tối thêm.** Bóng người chỉ hiện ở điểm ảnh sàn còn nắng: nhân bóng bake với `env.sunLayer` (alpha = nắng, đã gồm bóng nhà, bóng lá, bóng đạo cụ). Chỗ sàn đã có bóng thì bóng người biến mất, chỗ kề bên liền một màu.
2. **Màu bóng người = màu sàn khi mất nắng**, suy từ hằng số (`SHADOW_RGB` = `AMB·(1 − LEAF_DARK)/(AMB + SUN)`), không gõ tay.
3. **Hình bóng người khác bóng nhà được; màu thì không.**
4. **Chống nhấp nháy:** độ đậm tổng lấy nắng trung bình 9 điểm quanh chân và làm mượt theo thời gian (`areaSun`, `approach`); tán lá chỉ che đúng phần bóng nó phủ, không mờ cả bóng. Bake lại khi người dịch quá 0,25 px.
5. Trong tiệm: bóng ngắn, nhạt, nhoè (`INDOOR_SHADOW`); ngoài trời dài và rõ; chuyển mượt theo `env.indoor`.
6. Phản chiếu người cắt đúng ranh men/gạch bằng mặt nạ hình học theo ô bóng; mưa tắt.

## 7. Đèn và ánh lò

3 đèn: hai ở bàn topping, một giữa bảng menu và biển (`lampSpots.ts`). Đèn chỉ là quầng nhỏ ấm trên tường và lan rất nhẹ lên bàn; nắng là nguồn chính. Lò: tăng sáng ấm khi đang nướng.

## 8. Ảnh nguồn

- Ảnh đạo cụ: cạnh ≥ cạnh thiết kế × 3,2; không nướng bóng, sàn, phản chiếu, bóng lá vào sprite (quy trình HD ở skill `tao-anh-game`).
- **Ảnh bóng (tán lá, mặt tiền)**: gen bằng ChatGPT, kèm ảnh game đích và ảnh bóng thật; prompt nêu rõ: nhìn từ trên xuống, xám trên nền trắng thuần (trắng #FFFFFF là nắng, xám khoảng #808080 là bóng), không màu, không viền, không chữ; hình cụ thể cần có (lá to, cành, nồi, cột…); độ nét **vừa** (mép mềm vài px), để độ mềm cuối do `soft` chỉnh. Ảnh rộng cho dải mặt tiền.
- Ảnh sàn: albedo phẳng, ô đường bake cùng mật độ với sàn khác (`FLOOR_SS` 4, `HD_FLOORS` trong `photo.ts`), cắt sâu khỏi mép vát 3D (`ROAD_INSET`).

## 9. Soi bằng mắt (phóng 8–12×, báo kèm đường dẫn ảnh)

| Chỗ soi | Lỗi hay gặp |
|---|---|
| Chân vật | Phản chiếu hoặc bóng hở khỏi chân |
| Ranh men / gạch đỏ | Phản chiếu tràn sang gạch đỏ |
| Chỗ bóng người chạm bóng nhà, bóng lá | Hai màu khác nhau hoặc tối gấp đôi |
| Bóng lá | Mất cành, lá lẻ (dấu hiệu bị ép ngưỡng hay nhoè) |
| Mép ô đường | Vạch sáng/tối giữa các ô nhựa |
| Mảng nắng | Lem, trắng, nhiễu (xoá, đừng chỉnh) |
| Tường nhà bên cạnh | Đổi kiểu mỗi lần tải là bình thường |
| Mưa, 2560×1440 | Chưa kiểm sau mỗi lần đổi lớn |

Chụp bằng `tools/screenshot.mjs`: chờ popup rồi mới bấm "Bỏ qua" (`--wait-ms 4000 --click 920,182 --wait-ms 1500 --click 920,182 --wait-ms 3000`), kiểm máy chủ xem trước còn sống.
