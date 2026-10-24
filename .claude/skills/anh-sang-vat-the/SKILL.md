---
name: anh-sang-vat-the
description: Luật ánh sáng, bóng đổ, AO, phản chiếu sàn bóng, bóng lá và độ phân giải cho đạo cụ trên sàn quán Bánh Mì Cô Ba. Dùng khi thêm hoặc đổi chỗ đạo cụ, đổi chất liệu sàn, gen lại ảnh đạo cụ, hoặc đụng bất kỳ thứ gì liên quan nắng, bóng, phản chiếu.
---

# Ánh sáng đạo cụ

Nền tảng: `docs/revamp/ANH-SANG-VA-HINH-ANH.md` (số đo, lý do). Cài đặt tham chiếu chạy được: `tools/light-demo.py` (`python3 tools/light-demo.py after|before`, ra `art-raw/_duyet/anh-sang-demo/`).
Phần dựng trong game chưa làm; skill này là luật để mọi đạo cụ mới và mọi lần dời chỗ giữ cùng một kiểu.

## 0. Phân tích trước khi làm (bắt buộc, ghi ra rồi mới dựng)

Với mỗi vật và mỗi chất liệu sàn, điền phiếu này. Không có phiếu thì không chỉnh bóng hay phản chiếu.

| Câu hỏi | Quyết định gì |
|---|---|
| Sàn dưới chân là chất liệu gì, bề mặt bóng hay nhám, khô hay ướt? | Có phản chiếu không, đậm bao nhiêu, nhoè bao nhiêu (bảng chất liệu bên dưới) |
| Vật làm bằng gì: kính, kim loại, nhựa, gỗ, vải? | Kính: bóng nhạt, phản chiếu mang trong ảnh. Kim loại: bóng đậm, có highlight. Nhựa/gỗ: bóng đậm vừa, nhoè ở đuôi |
| Vật đặc hay có phần rỗng, chân hay đáy phẳng, có mái nhô? | Hình dạng đường chạm đất (mục 3) và `side` |
| Vật cao bao nhiêu so với ô? | Độ dài bóng = `SUN_K` × cao; đuôi dài quá thì cắt ở `side` hoặc ở mép sàn |
| Chỗ đặt nằm trong nắng, trong vạt bóng tường, hay dưới lá? | Đốm lá lên vật, bóng vật chặn đốm lá |
| Có đèn gần không? | Chỉ cộng quầng sáng ấm; không đẻ bóng thứ hai |
| Giờ nào, mưa hay nắng? | `sunAt()` đổi tone; mưa bỏ bóng nắng và đốm lá, giữ AO; sàn ướt đổi độ bóng |
| Có đồ khác ngay cạnh hoặc trước mặt không? | Bóng và phản chiếu không đè lên đồ khác; ranh chất liệu cắt phản chiếu |

Bảng chất liệu sàn (độ bóng quyết định phản chiếu; cột "Phản chiếu" ghi rõ đã dựng hay mới là đề xuất):

| Chất liệu | Độ bóng | Phản chiếu gần chân → đuôi | Loá vạt nắng | Ghi chú |
|---|---|---|---|---|
| Gạch men bóng | Cao | 0,34 → 0,07 (**đã dựng, user duyệt**) | Có | Khe vữa không phản chiếu |
| Đá mài, đá hoa bóng | Rất cao | đề xuất 0,45 → 0,10 (chưa dựng) | Có, gắt | Nhoè ít |
| Gỗ đánh vecni | Vừa | đề xuất 0,10 → 0,02, nhoè nhiều (chưa dựng) | Nhẹ | |
| Đường nhựa ướt | Vừa | đề xuất ≤ 0,15, kéo dài, nhoè (chưa dựng) | Có | Chỉ khi mưa |
| Gạch đỏ, xi măng, nhựa khô, đất | Không | **0** (đã dựng ở dải gạch đỏ thử) | Không | Vẫn có bóng đổ và AO |

Nguyên tắc: độ bóng tăng thì phản chiếu đậm lên và nhoè xuống; vật phản chiếu không bao giờ sắc hơn vật thật; bề mặt nhám không phản chiếu nhưng vẫn có bóng đổ.
Chất liệu chưa có trong bảng: phân tích theo phiếu, đề xuất số, dựng thử, duyệt bằng mắt rồi mới thêm vào bảng.

## 0b. Chất liệu bề mặt vật (lớp bóng `PropSheen`)

Lớp SCREEN nướng một lần (`src/world/propSheen.ts`, bảng `src/world/sheenParams.ts`, lõi `src/art/light/sheen.ts`). Vùng bóng tự lấy theo màu điểm ảnh sprite nên gen lại ảnh vẫn dùng được; thêm vật mới = thêm một dòng vào `sheenParams.ts`, ảnh không có vùng đúng màu thì không dựng gì.

| Chất liệu | Vật | Chọn vùng theo màu | Hình bóng | Cường độ |
|---|---|---|---|---|
| Kim loại | lò than, lò điện, tủ kính (khung, nắp) | xám, bão hoà thấp | dải chéo sắc, dải mềm phụ, viền sáng cạnh trên-phải, nền lạnh trên ấm dưới rất nhạt | 0,34–0,4 |
| Sứ | bồn rửa | trắng, bão hoà rất thấp, trong vùng thân bồn | quầng mềm phải-trên, đốm sắc ở mép, viền sáng; chỉ thấy trên phần ngả xám vì SCREEN lên trắng không đổi | 0,5 |
| Men xanh đậm | mặt quầy, bàn bench/prep/order | xanh teal, bão hoà vừa, tối | hai dải chéo (một sắc), quầng đèn trần, viền sáng cạnh trên | 0,5 |
| Men trắng sơn | tủ lạnh | trắng | một dải dọc, quầng mềm | 0,32 |
| Nhựa trong | bình nước | xanh lam nhạt | một vệt dọc mảnh, viền | 0,32 |
| Gỗ, vải, gạch, nhựa đặc, xốp | thân quầy, khăn, tường lò, thùng | không chọn | không có bóng | 0 |

Cường độ nhân `0,35 + 0,65 × env.sun` tại chân (trong bóng nhạt), mưa còn 40%. Soi: vệt phải có hình dạng và nằm trong vùng chất liệu, không phủ thành màn sương.

## 1. Hằng số ánh sáng (đã chốt)

| Hạng mục | Giá trị |
|---|---|
| Hướng nắng | Bóng đổ về dưới-trái màn hình, vector (−2, +1) = trục thế giới +y. Không đổi theo giờ |
| Độ cao nắng | `SUN_K = 0.45`: điểm cao `z` px thì bóng lệch (−2·K·z, +K·z) so với điểm chạm đất |
| Nguồn | 1 nắng (bóng dài), 1 trời (AO đậm ngắn sát chân), đèn tường (chỉ quầng sáng, **không đổ bóng**) |
| Công thức sàn | `màu = albedo × (AMB·(1 − 0,42·bóng vật)·AO + SUN·sáng)`; `sáng = lá × (1 − bóng vật)`; `AMB = (0,88; 0,82; 0,88)`, `SUN = (0,20; 0,20; 0,12)` |
| Tone cả cảnh | Nhân `TONE` theo `sunAt()` (`src/world/daylight.ts`) rồi vignette |
| Trời mưa (`OVERCAST`) | Bỏ bóng nắng và bóng lá, giữ AO |

## 2. Mỗi đạo cụ phải khai

| Trường | Ý nghĩa |
|---|---|
| `h` | Cao thiết kế (px) |
| `dy` | Độ tụt đáy so với tâm ô (`SIT`, `photo.ts`) |
| `fw`, `fh` | Cỡ chân theo ô (hình thoi) cho AO |
| `side` | Phần chiều cao ảnh là mặt bên (không tính mặt trên): thùng 0,62, tủ 0,64, bồn 0,85 |
| Chất liệu sàn dưới chân | Quyết định có phản chiếu không (mục 5) |

Thêm đạo cụ mới = điền bảng này rồi chạy lại cùng đường ống. Không viết riêng cho từng vật.

## 3. Đường chạm đất (gốc của bóng và phản chiếu)

- Mỗi cột ảnh lấy điểm đục thấp nhất (alpha > 128). Đường chạm đất là **bao lõm trên** của các điểm đó: đi đúng qua đáy từng chân và nối thẳng giữa hai chân.
- Không ép dốc 0,5: ảnh AI dốc 0,55–0,65 nên ép sẽ làm phản chiếu hở khỏi chân.
- **Mái nhô ra ngoài chân (nắp thùng rộng hơn thân):** những cột đó không là chỗ chạm đất. Bỏ các đoạn dốc > 0,9 khỏi tập điểm tựa, rồi kéo dài đường đáy theo độ dốc ở rìa. Quên bước này thì phản chiếu mái hiện thành hai thanh dọc bên hông vật.
- Vật treo, chỉ một điểm chạm (bồn rửa): lùi về nón dốc 0,5 từ điểm thấp nhất.

## 4. Bóng đổ và AO

- Bóng: mỗi điểm ảnh cao `z` so với đường chạm đất của cột nó, đổ tới (x − 2Kz, g + Kz); giá trị = alpha của ảnh. Kính trong cho bóng nhạt, thép cho bóng đậm.
- Đầu gần mép sắc nhẹ, đuôi nhoè dần (`blur` theo `z`); đậm 0,97 → 0,67 theo `z`. Màu bóng `(0,60; 0,58; 0,70)`, nhân, không đen.
- AO: hình thoi theo chân × 1,3, nhoè, đậm, màu `(0,45; 0,42; 0,55)`.
- Bóng chỉ nằm trên sàn (cắt theo vùng sàn). Đuôi bóng không đè lên đồ khác.
- Bóng chặn luôn đốm lá: `sáng = lá × (1 − bóng vật)`.

## 5. Phản chiếu: theo chất liệu

Số theo bảng chất liệu ở mục 0; đang dùng 0,34 → 0,07 cho gạch men và 0 cho sàn nhám.

- Chỉ lật **mặt bên** qua đường chạm đất, dài `side × h`. Mặt trên không hiện trong gương, lật cả ảnh thì nắp lòi ra cuối bóng.
- Lật từ ảnh đã được chiếu sáng (cùng đốm lá), mờ dần theo khoảng cách, nhoè tăng dần về đuôi.
- Nhân với mặt nạ chất liệu **theo điểm ảnh**: phản chiếu đi qua ranh giới men/gạch đỏ phải bị cắt đúng ranh.
- Quầng sáng và loá của vạt nắng cũng chỉ có trên chất liệu bóng.

## 6. Bóng lá

- Ảnh tán lá xám 1254 px (`art-raw/_duyet/tan_la/final.png`), phủ nhân theo mặt phẳng sàn, chu kỳ 6 ô, lật gương ở mép để không thấy đường ghép.
- Vật nhận đốm lá bằng cách tra ánh sáng tại điểm chạm đất của tia nắng (cùng phép chiếu với bóng đổ), không phủ phẳng lên ảnh vật.
- Lá che sàn thì phải che cả vật; chỉ sàn có đốm là sai.

## 7. Ảnh đạo cụ

- **Mức sàn độ phân giải:** cạnh ảnh ≥ cạnh thiết kế × 3,2 (xem `docs/QUY-TAC-CANVAS.md`). Thùng rác cao 46 → ≥ 147 px.
- Ảnh mềm hoặc thiếu highlight: gen lại theo kiểu "nâng chất lượng": đính kèm ảnh cũ (nền trắng, phóng 3×) và một ảnh mẫu chất lượng, prompt giữ nguyên góc, tỉ lệ, bố cục, thêm "crisp sharp edges, specular highlights, warm sunlight from the upper right", **nền trắng thuần, không sàn, không bóng, không bóng lá**. Xoá nền ở Photoroom. Quy trình ở skill `tao-anh-game`.
- Ánh sáng nướng trong ảnh chỉ là tô khối từ phải-trên. **Không nướng bóng đổ, không nướng sàn** vào sprite; bóng, AO, phản chiếu là lớp riêng.
- Ảnh sàn: albedo phẳng, không nướng sáng tối, không highlight.

## 8. Khi đổi chỗ hoặc thêm đồ

1. Điền bảng mục 2.
2. Xác nhận chất liệu sàn dưới chân (mục 5), không đoán.
3. Chạy lại `tools/light-demo.py` với đồ ở chỗ mới, mở ảnh.
4. Soi theo mục 9.

## 9. Soi bằng mắt (phóng 8–12×)

| Chỗ soi | Lỗi hay gặp |
|---|---|
| Chân vật, cả trái lẫn phải | Phản chiếu hoặc bóng hở khỏi chân (đường chạm đất sai) |
| Hai bên hông vật có mái nhô | Thanh dọc mờ từ mái xuống đáy (mục 3) |
| Nắp, đỉnh vật | Mặt trên lòi vào phản chiếu |
| Mép bóng | Bậc thang, răng cưa |
| Ranh men / gạch đỏ | Phản chiếu tràn sang gạch đỏ |
| Vật nằm trong đốm lá | Sàn có đốm mà vật trơn |
| Kính, thép | Bị phủ sương trắng bằng code (kính phải do ảnh gen mang phản chiếu) |
| Tỉ lệ 1:1 trên màn 27" | Mờ, sai độ phân giải |

Báo xong kèm đường dẫn tuyệt đối của ảnh và ảnh phóng.
