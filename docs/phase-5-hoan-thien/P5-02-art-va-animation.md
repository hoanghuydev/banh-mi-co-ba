# P5-02 — Art và Animation

> ## ⚡ REVAMP 2026-10-20 — ✅ CÒN SỐNG
> Căn cứ: [`CANON.md`](../CANON.md) bản revamp + [`revamp/00-YEU-CAU.md`](../revamp/00-YEU-CAU.md). Phần ☠️ không dùng làm căn cứ.
>
> | Mục | Trạng thái | Lý do / thay bằng |
> |---|---|---|
> | §2.2.2 danh sách asset: xe bánh mì, nhà cô Ba cảnh tối, chợ | 🔁 | Xe → quán thật (biển hiệu, mặt tiền) (R0.5). Cảnh nhà cô Ba ☠️. Chợ → nhà cung cấp (R3). Bỏ quầy thừa (R1). Thêm UI app điện thoại (R4) |
> | §2.3.6 ánh xạ sự kiện → mặt: `WRONG_NAME`, `REMEMBERED_*` | ☠️ | Ba sự kiện đã chết (CANON §3) |
> | §2.5.3 người chơi không có mặt · ngoại lệ cô Ba có rig | 🔁 | Cô Ba bị bỏ (R0.5). Phương Anh là nhân vật có tên, có mặt trong intro/kết — chưa chốt có hiện mặt trong quán không |
> | §2.6 cảnh kết ngày 40 (3 tranh tĩnh) | 🔁 | → màn thắng (chi nhánh 2, tường review) / thua (niêm phong) (R5/R0.5) |
> | §2.7 key art + capsule (xe ở 1/3 trái, tên game) | 🔁 | Quán thay xe; tên game → "Bye Sếp, Em Bán Bánh Mì" (R0.5) |
> | §5.2 ngân sách art "mùa 40 ngày", 13 NPC (12 + cô Ba), UI sổ tay/bảng chợ | ⏳ | Tính lại sau R1/R4/R6/R0.5 |
> | §7 R0.5 (kênh T3) | 🔁 | T3 chết |
>
> **Còn dùng được:** bảng màu theo khung giờ, layered sprite + Rain World + Celeste, luật không frame-by-frame (+ ngoại lệ model 3D), lằn ranh đỏ art, chính sách gen-AI.

**Thuộc phase:** P5 — Hoàn thiện
**Phụ thuộc:** `CANON.md` §14 (bảng màu, chi tiết môi trường) · §14.1 (lằn ranh đỏ) · §16 Đừng-4 (layered sprite, Rain World, Celeste) · §5 (perception — art phải làm `certainty` đọc được) · `P5-01` (icon, tương phản, giảm chuyển động) · `P5-03` (đồng bộ mặt ↔ VO)
**Trạng thái:** **Chốt** về nguyên tắc và kỹ thuật · **Cần đo** ở ngân sách giờ (§5) và ở gate key art (§6)

---

## 1. Mục tiêu

Art của game này có **một việc duy nhất phải làm đúng**: làm cho **T1** (*khách chấm QUÁ TRÌNH*) và **T5** (*attention phải NHÌN THẤY ĐƯỢC*) trở thành thứ người chơi đọc được bằng mắt trong nửa giây. Mọi thứ khác là trang trí.

Cụ thể, art gánh ba chức năng cơ học:
1. **Mặt NPC** là bảng chỉ số duy nhất của game (T3 cấm số) → phải phân biệt được 4 state perception (`UNAWARE` / `GLIMPSED` / `NOTICED` / `CONFIRMED`) **bằng mắt, không cần chữ**.
2. **Ngôn ngữ cơ thể** là kênh thứ hai của cùng bảng chỉ số đó — và là kênh **rẻ nhất** (spring rig, 0 sprite thêm).
3. **Bối cảnh** phải khiến người Việt tin ngay trong 3 giây. Đây là lợi thế cạnh tranh duy nhất không ai copy được, và là thứ quyết định wishlist ở tuần 12.

Và art có **một ràng buộc ngân sách tuyệt đối**: **0 giờ frame-by-frame animation** (CANON §16 Đừng-4).

---

## 2. Cơ chế

### 2.1. Bảng màu — Sài Gòn buổi sáng là XANH XÁM + NẮNG GẮT TRẮNG

> **Luật một dòng, dán lên tường chỗ artist ngồi:**
> **Nắng Sài Gòn là TRẮNG, không phải VÀNG. Bóng đổ là XANH, không phải NÂU.**

Sai lầm mặc định của mọi game về Việt Nam do người ngoài làm: đổ một lớp LUT vàng nghệ lên toàn khung (kiểu *Apocalypse Now* / phim Mỹ về Đông Nam Á). **Cấm.** Quy tắc số:
- **Không xoay hue toàn cục quá 15° về phía vàng.**
- **Không dùng LUT cam/teal.**
- **Chroma của ambient phải thấp** (LCh: `C ≤ 14`). Chroma cao chỉ được nằm ở **prop** (ghế nhựa, bảng hiệu, bạt xanh, ớt), không nằm ở không khí.
- Sài Gòn buổi sáng **có sương mù ô nhiễm** — nó làm giảm độ tương phản ở xa và đẩy nền về phía **xanh lam nhạt**, không phải vàng.

#### 2.1.1. Khung giờ 1 — TỜ MỜ (5:30–6:30)

Xe vừa dựng, đèn đường sodium còn sáng, trời xanh mực.

| Vai trò | Hex | Ghi chú |
|---|---|---|
| Trời | `#3E4A57` | Xanh mực pha xám |
| Ambient xa | `#556472` | |
| Bóng đổ | `#2A3238` | Sâu nhất trong ngày |
| Tường / vách | `#5C6870` | |
| Bê tông / mặt đường | `#4A5258` | |
| Highlight chung | `#8E9AA0` | Chưa có highlight trắng |
| **Đèn đường sodium** | `#E0A857` | **Nguồn sáng điểm duy nhất được phép ấm.** Bán kính nhỏ |
| Đèn lò than | `#E2663A` | Rất nhỏ, chỉ quanh lò |
| Bảng hiệu đỏ | `#8E3A32` | Đỏ bị trời xanh kéo xuống |
| Chữ vàng bảng hiệu | `#B08A3C` | |
| Da người (trung gian) | `#8A6A55` | |
| Vỏ bánh mì | `#A8743E` | |

Đặc trưng: **tương phản thấp, giá trị nén xuống dưới**, chỉ 2 điểm sáng ấm trong khung.

#### 2.1.2. Khung giờ 2 — CAO ĐIỂM (6:30–8:00) — **đây là khung key art**

Nắng vừa lên, chiếu ngang, gắt và **trắng**. Bóng dài, lạnh, xanh.

| Vai trò | Hex | Ghi chú |
|---|---|---|
| **Nắng trực tiếp / cháy sáng** | `#F6F4EE` | Gần trắng, hơi ngả xanh, **không ngả vàng** |
| Specular đỉnh | `#FFFFFF` | Chỉ ở mép kim loại, mép ly, mép mũ bảo hiểm |
| Trời | `#8FA3AD` | Xanh xám sương |
| Ambient / nửa tối | `#7C8A90` | |
| **Bóng đổ** | `#4A5A63` | **Xanh lam. Đây là màu quan trọng nhất của game** |
| Bóng sâu (gầm xe, khe vách) | `#33404A` | |
| Tường stucco | `#9EA6A0` | |
| Bê tông / mặt đường | `#8A8E88` | |
| Vữa loang / mốc | `#7A8278` | Không thể thiếu, Sài Gòn ẩm |
| **Bảng hiệu đỏ** | `#C0392B` | |
| **Chữ vàng bảng hiệu** | `#F0C419` | Cặp đỏ-vàng này là **dấu vân tay thị giác** của game |
| Ghế nhựa đỏ | `#C94B3B` | |
| Ghế nhựa xanh | `#2E7D8F` | |
| Bạt che xanh | `#2F6F8F` | |
| Trầu bà (lá sáng) | `#6E9A54` | |
| Trầu bà (lá tối) | `#3F6A3E` | |
| Vỏ bánh mì | `#C98A4B` | |
| Ruột bánh | `#F2E4C9` | |
| Da người (sáng) | `#C79A79` | |
| Da người (trung gian) | `#A97A5B` | |
| Da người (bóng) | `#6E4E3E` | |
| Inox / hũ đũa | `#B8BDBC` + spec `#FFFFFF` | |

**Luật ánh sáng khung này:** nguồn chính từ **sau-trái camera, góc cao 18–24°**. Bóng đổ dài gấp **2,4×** chiều cao vật. Mọi vật đứng đều có **rim light lạnh** `#C6D2D6` ở mép hướng nguồn.

#### 2.1.3. Khung giờ 3 — NẮNG ĐỨNG (8:00–10:30)

Mặt trời lên cao, bóng ngắn và cứng, mọi thứ bạc màu.

| Vai trò | Hex |
|---|---|
| Nắng trực tiếp | `#FFFFFF` (cháy sáng thật, cho phép clip) |
| Trời | `#B4C0C4` |
| Ambient | `#C9CBC4` |
| Bóng đổ | `#5E6A6E` (ít xanh hơn khung 2 — ánh sáng khuếch tán nhiều hơn) |
| Tường | `#B2B4AC` |
| Bê tông | `#A8A8A0` |
| Bảng hiệu đỏ | `#CE4A3B` (bị nắng làm nhạt) |
| Chữ vàng | `#F7D45C` |

Đặc trưng: **desaturate toàn cục thêm 12%**, bóng đổ **ngắn còn 0,6×** chiều cao vật, **rìa vật bị ăn sáng** (bloom nhẹ 0,08). Hơi nóng bốc (heat shimmer) — **hiệu ứng chuyển động → tắt được** theo P5-01 §2.3.

#### 2.1.4. Khung giờ 4 — CHIỀU (15:00–17:30) — khung của ông Hải

**Đây là chỗ dễ trượt vào vàng nghệ nhất. Không được.** Chiều Sài Gòn là **nâu xám + hồng bụi**, đục vì bụi và khói xe, không phải "golden hour" kiểu quảng cáo.

| Vai trò | Hex |
|---|---|
| Ánh sáng trực tiếp | `#E4D8C6` (kem xám, **không** `#E8B04B`) |
| Trời | `#A9A498` |
| Ambient | `#7E7468` |
| Bóng đổ | `#4A443E` |
| Tường | `#8C8378` |
| Bê tông | `#837C72` |
| Lớp bụi lơ lửng (overlay) | `#C8B8A8` ở alpha 0,10 |
| Hồng bụi ở chân trời | `#B08A80` |
| Bảng hiệu đỏ | `#A8443A` |

**Luật cấm:** không đẩy hue toàn cục vượt `#E4D8C6`; không dùng overlay cam; không dùng bloom vàng. Nếu nhìn khung chiều mà thấy "ấm áp dễ chịu" → đã sai; chiều Sài Gòn là **mệt và bụi**.

#### 2.1.5. MƯA (đè lên bất kỳ khung giờ nào)

Mưa **nén dải giá trị** và **rút chroma**, trừ đúng một thứ: **tấm bạt xanh**.

| Vai trò | Hex |
|---|---|
| Ambient | `#5A646A` |
| Highlight | `#A8B2B5` |
| Bóng đổ | `#343C40` |
| Trời | `#6F787C` |
| Nhựa đường ướt | `#2F3A3E` |
| Phản chiếu trên nhựa đường | `#8FA0A6`, vệt dọc, alpha 0,35 |
| **Bạt che xanh** | `#2F6F8F` | **Thứ bão hoà duy nhất trong mưa** — đây là điểm nhìn của khung |
| Bảng hiệu đỏ qua mưa | `#8E3A32` |
| Ánh đèn lò qua hơi nước | `#D8703E` alpha 0,5 |

Luật: **dải giá trị nén về 30–70%** (không có gì đen thật, không có gì trắng thật). Độ tương phản toàn cục **×0,72**. Chroma toàn cục **×0,55**, trừ bạt xanh và ớt.

#### 2.1.6. Luật màu phục vụ gameplay (bắt buộc, không phải thẩm mỹ)

| # | Luật | Vì sao |
|---|---|---|
| M1 | Mọi sprite **liên quan gameplay** (nguyên liệu, tay, bánh, NPC) phải có **độ tương phản độ chói ≥ 3:1** so với lớp nền ngay sau nó, ở **cả 5 bảng màu** | Không đọc được = T1 chết. Bake nền xong phải chạy script kiểm |
| M2 | **Nền được bake vào `RenderTexture`** (CANON §2) → giảm chroma nền thêm **8%** so với bảng, để prop gameplay nổi lên | Tách tầng thông tin bằng chroma, không bằng outline |
| M3 | Khu vực **`HANDS`** (nơi `visibility` cao nhất, 0,95 ở `FRONT_CENTER`) phải là vùng **sáng nhất và tương phản nhất** của khung | Mắt người chơi tự đi về đó. T1 |
| M4 | 4 state perception phân biệt được **khi grayscale** | P5-01 §2.7.3 |
| M5 | **Không dùng màu làm kênh duy nhất** cho bất cứ thông tin gì | P5-01 §2.8.4 |
| M6 | Bảng màu lưu thành **file duy nhất** `content/art/palette.json`, mọi shader/tint đọc từ đó | Đổi một chỗ, đổi cả game |

---

### 2.2. Chi tiết môi trường bắt buộc + danh sách asset đầy đủ

Người chơi *Phở Anh Hai* nêu **đích danh** những thứ này là lý do game "chạm" (idea §19.5). Đây không phải gợi ý — đây là **danh sách phải có trong khung key art và trong scene quầy**.

#### 2.2.1. Sáu thứ bắt buộc (CANON §14)

| # | Thứ | Đặc tả tạo hình |
|---|---|---|
| 1 | **Ghế nhựa** | Loại ghế đẩu thấp ~25cm, có lỗ ở mặt ngồi, chân loe. **Đỏ `#C94B3B` và xanh `#2E7D8F`, xếp chồng 3–5 cái ở góc.** Ghế đã cũ: mờ mặt, mép xước |
| 2 | **Hũ đũa** | Ống inox `#B8BDBC` đựng đũa tre + **một hũ nhựa trong** đựng muỗng nĩa, nắp mất. Đặt trên mặt xe, phía khách |
| 3 | **Bảng hiệu đỏ chữ vàng** | Nền `#C0392B`, chữ `#F0C419`, **viền vàng 1 nét**, kiểu chữ kẻ tay — **`ART-1` vẽ tay từng chữ**, không dùng font. Có vệt bạc màu ở góc trên-phải (phía nắng) |
| 4 | **Xe máy dựng sát vách nhường lối đi** | 2–4 chiếc, **dựng chân chống nghiêng, bánh trước xoay vào vách**, để chừa lối đi ~1m. Số xe Wave/Dream/Sirius, **không vẽ logo hãng thật** — tự thiết kế dáng gần giống. Yên bọc nilon, gương lệch, móc treo túi nilon |
| 5 | **Chậu trầu bà treo ngoài cửa sổ** | 2–3 chậu, dây leo rủ xuống 40–70cm, chậu nhựa trắng ngả vàng hoặc **chai nhựa cắt đôi**. Treo bằng dây kẽm vào song sắt |
| 6 | **(CANON §14 ngầm)** Không khí hẻm | Dây điện chằng chịt cắt ngang khung trời — **đây là đường nét bố cục quan trọng nhất của key art** |

#### 2.2.2. Danh sách asset môi trường đầy đủ

`P0` = cần cho key art (tuần 3–4) · `P1` = cần cho vertical slice (tuần 5–8) · `P2` = trước Steam page · `P3` = trước ship

| Nhóm | Asset | Số lượng | Ưu tiên |
|---|---|---|---|
| **Xe bánh mì** | Thân xe đẩy (khung kính + bánh xe) | 1 + 3 biến thể nâng cấp | **P0** |
| | Tủ kính đựng nhân (8 khay) | 1 | **P0** |
| | Mặt thớt / khu làm bánh | 1 | **P0** |
| | Lò than / lò nướng bánh | 1 + 2 nâng cấp | **P0** |
| | Rổ bánh mì (đầy / vơi / hết) | 3 | **P0** |
| | Khăn lau vắt thành xe | 2 | P1 |
| | Bịch nilon treo thành xe | 1 cụm | P1 |
| | Cuộn giấy gói + hộp tăm | 2 | P1 |
| | Chai tương ớt / xì dầu / lon sữa đặc mở nắp (**nhãn tự vẽ, không brand thật**) | 4 | P1 |
| | Thau nhôm rửa tay + ca nhựa | 2 | P1 |
| | Thùng đá + ly trà đá xếp chồng | 2 | P1 |
| | Hộp tiền lẻ / khay tiền | 1 | P1 |
| | **Sổ nợ** (mở / đóng) | 2 | P2 |
| | **Bảng QR** (nâng cấp) | 1 | P2 |
| | **Loa rao** (nâng cấp) | 1 | P2 |
| | Tủ mát (nâng cấp) | 1 | P2 |
| | Quạt máy cũ (nâng cấp) | 1 | P2 |
| | Dù / ô lệch cắm cạnh xe | 2 | P1 |
| | Bạt xanh căng khi mưa | 1 | P1 |
| **Bắt buộc §14** | Ghế nhựa đỏ / xanh (rời + xếp chồng) | 4 | **P0** |
| | Hũ đũa inox + hũ nhựa | 2 | **P0** |
| | Bảng hiệu đỏ chữ vàng (chính + 1 của chú Kiệt) | 2 | **P0** |
| | Xe máy dựng sát vách | 4 dáng | **P0** |
| | Chậu trầu bà treo | 3 | **P0** |
| **Hẻm — kiến trúc** | Vách tường stucco (3 module lát ngang) | 3 | **P0** |
| | Cửa cuốn (đóng / hé / mở) | 3 | **P0** |
| | Cửa sắt xếp + ổ khoá | 2 | P1 |
| | Song sắt ban công | 2 | **P0** |
| | Cầu thang sắt ngoài trời | 1 | P1 |
| | Mái tôn / mái hiên chắp vá | 3 | **P0** |
| | Dây điện chằng chịt (4 lớp độ sâu) | 4 | **P0** |
| | Đồng hồ điện + hộp điện gỉ | 2 | P1 |
| | Cột điện + loa phường (**không vẽ nội dung tuyên truyền**) | 1 | P2 |
| | Nắp cống / rãnh thoát nước | 2 | P1 |
| **Hẻm — đồ đạc** | Thùng xốp (xếp chồng, có chữ viết tay) | 3 | P1 |
| | Can nhựa 20L | 2 | P1 |
| | Két nước ngọt rỗng | 2 | P1 |
| | Bình gas mini | 1 | P2 |
| | Chổi + ky hốt rác | 2 | P1 |
| | Xô nước + giẻ lau | 2 | P1 |
| | Gạch kê chân bàn | 1 | P1 |
| | Thùng rác nhựa (có nắp / mất nắp) | 2 | P1 |
| | Dây phơi quần áo + 6 món đồ phơi | 1 cụm | P1 |
| | Lồng chim treo (nhà hàng xóm) | 1 | P2 |
| | Bảng "giữ xe" viết tay | 1 | P2 |
| | Chậu vạn niên thanh / lưỡi hổ dưới đất | 3 | P1 |
| | Cây bàng / cây trứng cá vươn qua tường | 1 | **P0** |
| **Sinh vật** | Mèo hẻm (nằm / đi / ngồi) | 3 pose | P2 |
| | Chó hẻm (nằm) | 1 | P2 |
| | Chim sẻ (đậu / bay) | 2 | P2 |
| | **Ruồi** (chỉ số `STALL_CLEANLINESS` dạng diegetic) | 1 + 3 mật độ | P1 |
| **Đối thủ** | Xe bánh mì chú Kiệt (bên kia hẻm) | 1 | P2 |
| **Chợ** | Sạp rau / sạp thịt / sạp pate | 3 | P2 |
| | Cân đồng hồ, rổ nhựa, bao tải | 4 | P2 |
| **Nhà cô Ba (cảnh tối)** | Bàn gỗ, đèn huỳnh quang, quạt trần, bàn thờ (**tông nhẹ, không phô**) | 5 | P2 |
| **Nền bake** | Hẻm × 4 khung giờ + mưa + tối | 6 | **P0** (1) / P2 (5) |
| | Chợ × 1, Nhà × 1 | 2 | P2 |
| **Thời tiết / FX** | Vệt mưa (3 mật độ), nước đọng, hơi nước, khói lò, bụi nắng, heat shimmer | 8 | P1–P2 |
| | ↳ **ĐÃ LÀM** — mưa dựng bằng particle procedural, không tốn asset nào: `world/rain.ts` (hình học + mật độ), `ui/stall/Rain.ts` (vệt mưa · vòng nước · giọt mái · tấm phủ §2.1.5), `TILE.wet` (nền ướt nướng sẵn), `ui/stall/ShopLight.ts` (hai cây đèn tuýp trong quán). Hai texture hạt mới: `FX.drop`, `FX.ripple` | 0 | — |
| | **Biến thể TĨNH của từng FX** (cho `reduceMotion`) | 8 | **P1** — làm cùng lúc, không để sau |

**Tổng asset môi trường: ~140 file.** Chi tiết ngân sách ở §5.

#### 2.2.3. Chi tiết "bốc mùi thật" — danh sách nhỏ nhưng quyết định

Những thứ này rẻ về công nhưng là thứ người Việt nhận ra ngay:
- **Vữa loang, vệt nước mưa chảy dọc tường** — không có tường nào sạch trơn.
- **Nilon buộc vào yên xe máy** (chống nắng / chống mưa).
- **Số điện thoại "khoan cắt bê tông" sơn xịt trên tường** — viết tay, `#1A1A1A`, lệch.
- **Băng keo dán vá** trên ghế nhựa, trên tủ kính.
- **Vết dầu mỡ đen ở chân lò.**
- **Đũa cắm vào hũ theo nhiều hướng**, không đều.
- **Một chiếc dép rơi lạc** ở góc hẻm.
- **Nước mưa đọng trong nắp chậu cây.**
- **Bóng đèn compact treo lủng lẳng** bằng dây điện, không có chụp.

---

### 2.3. Layered sprite cho NPC — 216 trạng thái từ 18 file

CANON §16 Đừng-4. Đây là kỹ thuật thay thế frame-by-frame cho **toàn bộ biểu cảm** của game.

#### 2.3.1. Cấu trúc file và kích thước

| Lớp | Nội dung | Số file / NPC | Canvas tác giả | Canvas ship |
|---|---|---|---|---|
| `base` | Đầu + tóc + tai + cổ + nền da mặt (không mắt/mày/miệng) | **1** | 256×256 | **128×128** |
| `brow` | Lông mày (cả hai bên cùng file) | **6** | 256×256 | 128×128 |
| `eye` | Mắt (cả hai bên cùng file, gồm tròng + mí) | **6** | 256×256 | 128×128 |
| `mouth` | Miệng | **6** | 256×256 | 128×128 |
| `extra` | Kính / mồ hôi / má ửng / khẩu trang kéo xuống cằm | 0–4 | 256×256 | 128×128 |
| `body` | `torso`, `armL`, `armR`, `hip`, `prop` | **5** | 384×512 | **192×256** |

> **18 file biến thiên (6+6+6) + 1 base + 5 body = 24 file cho MỘT NPC có đầy đủ 216 biểu cảm.**
> So sánh: 216 frame vẽ tay × 25 phút (số của Cuphead) = **90 giờ cho một NPC**. Ở đây: ~14 giờ.

#### 2.3.2. Anchor — luật một dòng để không bao giờ lệch

> **Mọi lớp mặt được vẽ trên ĐÚNG MỘT canvas 256×256 chung, đầy đủ vùng trống.**
> → Anchor của mọi lớp là `(0, 0)` góc trên-trái. **Không có offset riêng cho lớp nào.**

- **Mốc canh (registration cross)** ở `(128, 128)` của canvas tác giả = **điểm giữa hai mắt**. Artist vẽ mốc này ở layer riêng trong file nguồn, tắt khi export.
- Container `FaceRig` đặt origin ở `(0.5, 0.5)` của canvas 128×128 ship → xoay/nghiêng đầu quanh **giữa hai mắt**, đúng như xoay đầu thật.
- Đầu gắn vào `body/torso` tại node `neck` ở toạ độ cố định `(96, 42)` của canvas body.
- **Hệ quả:** không có một dòng code offset nào. Mọi lỗi lệch mặt đều là lỗi export, bắt được bằng test tự động (§6).

#### 2.3.3. Naming convention

```
assets/art/npc/<npcId>/face/base.png
assets/art/npc/<npcId>/face/brow_01.png  ... brow_06.png
assets/art/npc/<npcId>/face/eye_01.png   ... eye_06.png
assets/art/npc/<npcId>/face/mouth_01.png ... mouth_06.png
assets/art/npc/<npcId>/face/extra_<name>.png
assets/art/npc/<npcId>/body/torso.png | armL.png | armR.png | hip.png | prop_<name>.png
```

- `<npcId>` dùng đúng tên CANON §9, snake_case không dấu: `ba_bay` · `chu_tu` · `anh_dung` · `chi_lan` · `be_su` · `ong_hai` · `co_mai` · `thay_phuc` · `chi_hanh` · `anh_bao` · `ba_sau` · `chu_kiet` · `co_ba`.
- Khách vãng lai: `generic_<archetype>_<n>` với archetype ∈ `{nu_tre, nam_tre, nu_lon, nam_lon}`.
- Index **luôn 2 chữ số**, `01`–`06`. Không có `brow_1.png`.
- Đóng gói: **một texture atlas cho mỗi NPC**, `assets/art/npc/<npcId>.atlas` + `.png` 512×512 (đủ chứa 24 lớp ở 128px). → mọi lớp của một NPC nằm cùng texture → **Phaser batch thành 1 draw call**.

#### 2.3.4. Từ vựng 6 × 6 × 6

| Index | `brow` — lông mày | `eye` — mắt | `mouth` — miệng |
|---|---|---|---|
| **01** | Trung tính | Trung tính, nhìn thẳng | Trung tính, khép |
| **02** | Nhướn cả hai (ngạc nhiên) | Mở to | Cười nhẹ (khoé môi lên) |
| **03** | Nhướn đầu trong (thương / chạnh lòng) | Nheo lại (soi) | Cười hở răng / bật cười |
| **04** | Chau lại (khó chịu) | **Liếc ngang — nhìn vào TAY bạn** | Mím phẳng (nén) |
| **05** | Một bên nhướn (hoài nghi) | Cụp xuống (buồn / tránh) | Trễ khoé môi xuống |
| **06** | Hạ phẳng, xa cách (khép lòng) | **Nhắm** (chớp mắt / cam chịu) | Mở — **đang nói** |

Ba lớp này **độc lập hoàn toàn** → 6×6×6 = **216 tổ hợp**. Trong đó ta **đặt tên trước ~40 preset** trong JSON; 176 tổ hợp còn lại vẫn hợp lệ và đến được bằng luật.

`eye_04` (**liếc vào tay**) là lớp quan trọng nhất của cả bộ: nó là hiện thân thị giác của `visibility[HANDS][FRONT_CENTER] = 0.95`. **Người chơi phải thấy được khách đang nhìn tay mình.**

#### 2.3.5. Compose lúc chạy

```ts
// ui/stall/faceRig.ts
export class FaceRig extends Phaser.GameObjects.Container {
  private base: Image; private brow: Image; private eye: Image; private mouth: Image

  constructor(scene: Scene, npcId: string) {
    super(scene)
    const key = `npc_${npcId}`                 // 1 atlas
    this.base  = scene.add.image(0, 0, key, 'base').setOrigin(0)
    this.brow  = scene.add.image(0, 0, key, 'brow_01').setOrigin(0)
    this.eye   = scene.add.image(0, 0, key, 'eye_01').setOrigin(0)
    this.mouth = scene.add.image(0, 0, key, 'mouth_01').setOrigin(0)
    this.add([this.base, this.eye, this.brow, this.mouth])  // thứ tự z: base < eye < brow < mouth
    this.setSize(128, 128)
  }

  setFace(b: FaceIdx, e: FaceIdx, m: FaceIdx) {
    this.brow.setFrame(`brow_${pad2(b)}`)
    this.eye.setFrame(`eye_${pad2(e)}`)
    this.mouth.setFrame(`mouth_${pad2(m)}`)
  }
}
```

**Chi phí:** 4 `Image` cùng texture → **1 draw call** sau batching. 13 NPC trên màn hình cùng lúc = 13 draw call, không đáng kể ở mục tiêu 30fps (CANON §2).

**Chớp mắt** (miễn phí, làm mặt "sống"):
```ts
// Poisson, trung bình 4.2s; đóng mắt 90–140ms bằng eye_06
nextBlink = now + expRandom(mean = 4200)
blinkDurMs = rand(90, 140)
// KHÔNG chớp khi: đang ở CONFIRMED tiêu cực (nhìn chằm chằm),
//                 đang nói dòng blocking, hoặc reduceMotion.strict
```

**Miệng khi nói** (không phải lip-sync, chỉ là "đang nói"):
```ts
// Luân phiên mouth_06 (mở) <-> mouth hiện tại, 8 Hz, jitter ±20%
// reduceMotion: hạ còn 4 Hz.  reduceMotion.strict: giữ tĩnh mouth_06.
// Đồng bộ với VO: chỉ chạy khi audio đang phát (P5-03 §7)
```

#### 2.3.6. Ánh xạ (sự kiện × cường độ) → tổ hợp

Nguồn: `sim/perception.ts` phát ra `{ eventId, state, intensity, npc }`. `intensity` = `certainty` đã clamp, hoặc `memory.intensity` khi phản ứng trễ.

**Bảng gốc — theo state perception** (áp cho mọi sự kiện tiêu cực):

| State | `certainty` | brow | eye | mouth | Ghi chú CANON §5 |
|---|---|---|---|---|---|
| `UNAWARE` | < 0,35 | 01 | 01 hoặc 04*| 01 | *04 nếu đang ở `FRONT_CENTER` và rảnh: họ vốn đang nhìn tay bạn |
| `GLIMPSED` | 0,35–0,70 | **02** | **04** | 01 | "Quay đầu, dấu `?` nhỏ" — pose `tilt_head` (§2.4) |
| `NOTICED` | 0,70–1,0 | **04** | **03** | **04** | "Nhíu mày, bark tier-1" |
| `CONFIRMED` | ≥ 1,0 | theo bảng dưới | theo bảng dưới | theo bảng dưới | "Phản ứng đầy đủ + ghi memory" |

**Bảng `CONFIRMED` — theo sự kiện × cường độ × tính cách:**

| Sự kiện (CANON §3) | Cường độ thấp (0,3) | Cường độ vừa (0,6) | Cường độ cao (1,0) |
|---|---|---|---|
| `WRONG_NAME` | `03 / 05 / 04` (chạnh lòng) | `03 / 05 / 05` | `06 / 05 / 04` **+ pose `lean_back`** — khép lòng, đây là sự kiện salience 100 |
| `MADE_THEM_WAIT` | `04 / 01 / 04` | `04 / 03 / 05` | `04 / 02 / 06` + pose `glance_watch` ×2 |
| `BURNT_OR_COLD` | `02 / 02 / 04` | `04 / 03 / 05` | `04 / 02 / 03` (bật cười khó tin) |
| `DROPPED_FOOD` | `02 / 02 / 01` | `02 / 02 / 06` | `02 / 02 / 06` + pose `step_back_half` |
| `ORDER_DEFECT` (lúc ăn) | `05 / 04 / 04` | `04 / 03 / 05` | `04 / 03 / 06` |
| `DIRTY_HANDS` | `05 / 04 / 04` | `04 / 03 / 04` | `04 / 03 / 05` + pose `lean_back` |
| `REMEMBERED_USUAL` | `01 / 01 / 02` | `03 / 05 / 02` (cảm động, nhìn xuống) | `03 / 06 / 03` **+ pose `nod`** — khoảnh khắc chữa lành lõi |
| `REMEMBERED_STORY` | `02 / 02 / 02` | `02 / 02 / 03` | `03 / 02 / 03` + pose `lean_in` |
| `CARED_FOR_THEM` | `01 / 05 / 02` | `03 / 05 / 02` | `03 / 06 / 02` |
| `FREE_EXTRA` | `02 / 02 / 02` | `02 / 02 / 03` | `05 / 03 / 02` (nghi ngờ — xem §8(i) diminishing) |
| `FLOURISH` | `02 / 02 / 01` | `02 / 02 / 02` | `02 / 03 / 03` |

**Ba bộ biến điệu theo tính cách** (CANON §4), áp **sau** bảng trên:

```ts
function modulate(combo: FaceCombo, p: Personality, ev: EventCat): FaceCombo {
  // 1. nongTinh cao -> đẩy miệng lên một nấc "to tiếng"
  if (p.nongTinh > 0.7 && ev === 'NEG') combo.mouth = up(combo.mouth, ['04','05','06'])
  // 2. thanThien thấp -> mắt cụp / mày hạ phẳng (im lặng rồi biến mất, CANON §4)
  if (p.thanThien < 0.35 && ev === 'NEG') { combo.eye = '05'; combo.brow = '06' }
  // 3. soi cao -> mắt nheo thay vì mở to, ở MỌI state
  if (p.soi > 0.7) combo.eye = combo.eye === '02' ? '03' : combo.eye
  return combo
}
```

Ví dụ kiểm chứng: **chị Lan** (`soi 0.9 / nongTinh 0.1 / deTha 0.2 / thanThien 0.3`) gặp `ORDER_DEFECT` cường độ cao → bảng cho `04/03/06`, biến điệu 2 đổi thành `06/05/06`, biến điệu 3 giữ `05`. Kết quả **`brow_06 / eye_05 / mouth_06`** = mày hạ phẳng, mắt cụp, miệng đang nói — chính xác chân dung "người im lặng biến mất". Hệ thống ra đúng nhân vật mà không cần viết riêng.

**Lưu preset:**

```json
{
  "facePresets": {
    "NEUTRAL":          { "brow": "01", "eye": "01", "mouth": "01" },
    "WATCHING_HANDS":   { "brow": "01", "eye": "04", "mouth": "01" },
    "GLIMPSED":         { "brow": "02", "eye": "04", "mouth": "01" },
    "NOTICED":          { "brow": "04", "eye": "03", "mouth": "04" },
    "HURT_QUIET":       { "brow": "03", "eye": "05", "mouth": "04" },
    "SHUT_DOWN":        { "brow": "06", "eye": "05", "mouth": "04" },
    "WARM":             { "brow": "03", "eye": "05", "mouth": "02" },
    "SEEN_AND_HELD":    { "brow": "03", "eye": "06", "mouth": "03" },
    "SKEPTICAL":        { "brow": "05", "eye": "03", "mouth": "04" },
    "DISBELIEF_LAUGH":  { "brow": "04", "eye": "02", "mouth": "03" }
  }
}
```

---

### 2.4. Kỹ thuật Rain World — ngôn ngữ cơ thể bằng node + spring

**Không tốn thêm một sprite nào.** Đây là kênh chỉ số thứ hai của T3, và là thứ khiến 24 file tĩnh trông như có hồn.

#### 2.4.1. Cấu trúc rig

| Node | Cha | Sprite gắn | Bậc tự do | `maxOffset` (px logic) | `maxRot` |
|---|---|---|---|---|---|
| `hip` | (gốc) | `hip.png` | x, y | ±4 | ±3° |
| `chest` | `hip` | `torso.png` | x, y, rot | ±7 | ±8° |
| `head` | `chest` | `FaceRig` | x, y, rot | ±10 | ±14° |
| `armL` | `chest` | `armL.png` | rot | — | ±25° |
| `armR` | `chest` | `armR.png` | rot | — | ±25° |
| `prop` | `armR` | `prop_*.png` | (theo armR) | — | — |

#### 2.4.2. Tham số spring

Mô hình lò xo giảm chấn, tích phân semi-implicit Euler, `dt` cố định 1/60 (chạy độc lập với 30fps render):

```ts
// sim/springRig.ts
type Spring = { k: number; c: number; m: number; x: number; v: number; target: number }

function step(s: Spring, dt: number) {
  const F = -s.k * (s.x - s.target) - s.c * s.v
  s.v += (F / s.m) * dt
  s.x += s.v * dt
}
// zeta = c / (2 * sqrt(k*m));  zeta < 1 = còn nảy;  zeta = 1 = tới thẳng
```

| Node | `k` (độ cứng) | `c` (giảm chấn) | `m` | `zeta` | Cảm giác |
|---|---|---|---|---|---|
| `head` (x, y) | **160** | **22** | 1,0 | 0,87 | Nhanh, nảy nhẹ một cái — mắt người rất nhạy với đầu |
| `head` (rot) | **190** | **26** | 1,0 | 0,94 | Gần tới thẳng, không lắc |
| `chest` (x, y) | **90** | **18** | 1,4 | 0,80 | Chậm hơn đầu → tạo độ trễ liên đốt (secondary motion) |
| `chest` (rot) | **110** | **21** | 1,4 | 0,84 | |
| `hip` | **60** | **16** | 1,8 | 0,77 | Chậm nhất, gần như chỉ dịch trọng tâm |
| `armL` / `armR` (rot) | **120** | **20** | 0,8 | 1,02 | Tới thẳng, không lắc tay |

**Luật độ trễ liên đốt:** `hip` bắt đầu chuyển, `chest` trễ **60ms**, `head` trễ **110ms**. Đây là toàn bộ bí quyết làm 24 file tĩnh trông như cơ thể thật.

**Thở** (luôn chạy, nền):
```
chest.y += sin(2π * 0.25 * t) * 1.5     // 0,25 Hz, biên độ 1,5px
head.y  += sin(2π * 0.25 * t - 0.4) * 0.8
// reduceMotion: biên độ ×0.40
```

**Dịch trọng tâm vô thức** (chống đứng như tượng):
```
mỗi rand(6.0, 11.0) giây: hip.target.x += choice([-2, +2]); giữ, rồi đổi bên
```

#### 2.4.3. Danh sách pose

Mỗi pose = **một bộ `target` cho các node** + `holdMs` + `returnTo`. Springs tự lo phần chuyển động.

| `poseId` | `head` (x,y,rot) | `chest` (x,y,rot) | `hip` (x) | tay | `holdMs` | Dùng khi |
|---|---|---|---|---|---|---|
| `idle` | 0,0,0 | 0,0,0 | 0 | rủ | — | Mặc định |
| `lean_in` | +5,+2,+3° | +4,+1,+4° | +1 | — | 1400 | Tò mò, `REMEMBERED_STORY`, khách quan tâm |
| `lean_back` | −6,−1,−4° | −5,0,−5° | −2 | co nhẹ | 1100 | Lùi lại, `DIRTY_HANDS`, `WRONG_NAME` nặng |
| `step_back_half` | −8,0,−3° | −7,0,−4° | **−4** | — | 900 | `DROPPED_FOOD` cường độ cao — **lùi nửa bước** |
| `tilt_head` | +2,0,**+12°** | 0,0,+2° | 0 | — | 1200 | `GLIMPSED` — "quay đầu, dấu ?" |
| `tilt_head_far` | +3,0,**−13°** | 0,0,−2° | 0 | — | 1200 | Biến thể (shuffle-bag, chống lặp) |
| `nod` | 0,**+4→−4→0**,0 | 0,0,0 | 0 | — | 700 | Gật đầu — dùng `target` đổi 3 lần, spring lo nội suy |
| `shake` | **−4→+4→0**,0,0 | 0,0,0 | 0 | — | 800 | Lắc đầu |
| `shrug` | 0,−2,0 | 0,**−4**,0 | 0 | **cả hai +18°** | 650 | **Nhún vai** — "hửm", bark tier-3 |
| `look_at_hands` | +2,+4,**+9°** | 0,+1,0 | 0 | — | giữ | **Quan trọng nhất**: `eye_04` + pose này = "đang soi tay bạn" |
| `look_away` | −4,0,−10° | 0,0,−2° | 0 | — | 1600 | `gazeFactor` ↓ — khách bấm điện thoại, uống trà đá |
| `check_phone` | +1,**+6**,+14° | 0,+2,+3° | 0 | `armR` **−40°** (đưa lên) | 2000–3000 | **Cửa sổ 2–3s của CANON §5.4/§8(a)** — phải đọc được rất rõ |
| `drink_tea` | 0,+5,+8° | 0,+2,0 | 0 | `armR` −55° | 2200 | Công cụ hạ attention (§5.4) |
| `glance_watch` | +1,+3,+6° | 0,0,0 | 0 | `armL` −30° | 800 | Sốt ruột, dẫn tới `MADE_THEM_WAIT` |
| `arms_cross` | 0,0,0 | 0,−1,0 | 0 | cả hai gập | giữ | Khép lòng, `thanThien` thấp |
| `point` | +2,0,+4° | +2,0,+3° | 0 | `armR` −30° duỗi | 900 | Chỉ vào ổ bánh khi `ANTICIPATED` (CANON §6) |
| `weight_shift` | 0,0,±1° | ±2,0,±1° | **±2** | — | 1500 | Idle biến thiên |
| `slump` | 0,**+3**,−2° | 0,**+4**,−3° | 0 | rủ thấp | giữ | Mệt — ông Hải buổi chiều, cuối ngày mưa |
| `perk_up` | 0,**−3**,0 | 0,−2,0 | 0 | — | 600 | Nghe tiếng rao, thấy món mình thích |
| `turn_to_leave` | −2,0,**−22°** | −3,0,−10° | **−5** | — | 1000 | Bỏ đi — **đi kèm `silentDeparture`** |

**Blend:** tối đa **2 pose cùng lúc**, cộng `target` theo trọng số. Ví dụ `look_at_hands` (0,7) + `lean_in` (0,3).
**Chống "twinning" (CANON §11):** mỗi NPC có `poseDelayMs = rand(200, 400)` **và** `poseAmpJitter = rand(0.88, 1.12)` riêng → không bao giờ hai người vào pose giống hệt cùng frame.

#### 2.4.4. Giảm chuyển động (nối P5-01 §2.3 mục 12)

```
bodyLanguageAmp  = 0.40   // mọi target × 0.40
bodyLanguageHold = 1.80   // mọi holdMs × 1.80
breath.amp       × 0.40
weight_shift     tắt
```
**Không bao giờ tắt rig.** Pose nhỏ hơn nhưng **đứng lâu hơn** để đọc kịp. Kèm `postureCaptions` (P5-01).

---

### 2.5. Bài học Celeste — biến dạng 1–2 frame, chênh một hàng pixel

#### 2.5.1. Luật squash/stretch

Ở 30fps, **1 frame = 33ms, 2 frame = 66ms**. Sau đó **phải về 1,0 tuyệt đối**.

```ts
// ui/fx/squash.ts
const SQUASH_2F = [ {sx: 1.06, sy: 0.94}, {sx: 0.98, sy: 1.02} ]  // rồi 1.0
const SQUASH_1F = [ {sx: 1.04, sy: 0.96} ]                        // rồi 1.0
// KHÔNG tween. Gán thẳng từng frame. Tween là đường dẫn tới frame-by-frame.
```

Với sprite 64px, `sx 1.06` = lệch **~2px**, `sy 0.94` = lệch ~2px. Với sprite 32px = **1 pixel**. Đúng tinh thần Celeste: **chênh một hàng pixel, không ai thấy, ai cũng cảm được.**

#### 2.5.2. Áp vào đâu

| Thời điểm | Đối tượng biến dạng | Preset | Ghi chú |
|---|---|---|---|
| Nguyên liệu chạm mặt bánh | Nguyên liệu | `SQUASH_2F` | Cái "cảm giác tay" của toàn bộ gameplay |
| Dao chạm vỏ bánh (rạch) | **Ổ bánh** | `SQUASH_1F` theo trục X | Kèm SFX `dao_rach` (P5-03) |
| Đặt bánh xuống thớt | Bánh + thớt (thớt 0,5×) | `SQUASH_2F` | |
| Đóng cửa lò | Cửa lò | `SQUASH_1F` | |
| Đặt ly trà đá xuống | Ly + mặt bàn | `SQUASH_2F` | Hành động `CARED_FOR_THEM` phải có "cảm giác" |
| Khách đặt tiền xuống | Tờ tiền | `SQUASH_1F` | |
| Bấm nút UI | Nút | `SQUASH_1F` | 1 frame, 1px |
| Gói giấy xong | Gói bánh | `SQUASH_2F` | |
| `DROPPED_FOOD` chạm đất | Ổ bánh | `SQUASH_2F` mạnh hơn: `{1.14, 0.86}` | **Duy nhất được vượt mức**, vì nó là sự kiện |
| Mở/đóng tủ mát | Cửa tủ | `SQUASH_1F` | |
| Đầu NPC khi `perk_up` | `FaceRig` | `SQUASH_1F` | Rất nhẹ, sub-perceptual |

**Cấm:** squash/stretch kéo dài > 2 frame; squash/stretch có easing; squash/stretch trên **chữ** (dấu tiếng Việt méo).

#### 2.5.3. Madeline cố tình không có mặt → **người chơi không có mặt**

Celeste dồn toàn bộ cảm xúc của Madeline vào **tư thế thân**, không vào mặt. Áp vào game này thành một quyết định thiết kế mạnh:

> **Người chơi (cháu cô Ba) KHÔNG BAO GIỜ được nhìn thấy mặt.**
> Camera ở sau/bên vai. Người chơi là **hai bàn tay, hai cẳng tay, và một phần vai**.

Ba lý do, theo đúng thứ tự tầm quan trọng:
1. **T1 nói game này là "being watched while you work".** Bạn là **người bị nhìn**, không phải người được nhìn. Cho thấy mặt bạn là đổi ngôi máy quay, và đổi luôn chủ đề.
2. **Tiết kiệm thật:** không có rig mặt người chơi = không có 24 file + không có bảng ánh xạ + không có đồng bộ VO cho nhân vật chính. Ước tính tiết kiệm **~40 giờ art + ~18 giờ code**.
3. **Ai cũng nhận mình vào được.** Không giới tính hiển thị, không tuổi hiển thị.

**Cảm xúc người chơi thể hiện bằng gì:**

| Trạng thái | Biểu hiện (không có mặt) |
|---|---|
| Bình tĩnh | Tay chuyển động đều, vai thấp, `chest.rot` = 0 |
| Vội (hàng dài) | Tốc độ tay ×1,15, vai nhô lên 3px, `chest` hơi chúi trước |
| Vừa làm sai | Tay **khựng lại 200ms** rồi tiếp — không có animation "hốt hoảng", chỉ có nhịp bị vỡ |
| Cuối ngày mệt | Vai rủ, `hip.y` +3px, tốc độ ×0,9 |
| Làm được việc đẹp (`FLOURISH`) | Một nhịp dừng nhỏ 120ms sau thao tác — giống như tự ngắm |

**Ngoại lệ có chủ ý: cô Ba CÓ mặt, và có rig đầy đủ.** Cô là mỏ neo cảm xúc (CANON §7.4). Sự bất đối xứng này là cố ý: bạn không thấy mặt mình, nhưng bạn thấy mặt người dạy bạn.

**Bộ sprite tay người chơi** (toàn bộ):

| Sprite | Số | Ghi chú |
|---|---|---|
| Bàn tay mở | 2 (L/R) | |
| Bàn tay nhúm (cầm rau/đồ chua) | 2 | |
| Bàn tay nắm (cầm ổ bánh) | 2 | |
| Cầm dao | 1 (R) | |
| Cầm kẹp gắp | 1 (R) | |
| Cầm muỗng quết pate | 1 (R) | |
| Lau khăn | 2 | |
| Đếm tiền | 2 | |
| Cẳng tay | 2 | |
| Vai/lưng (tiền cảnh) | 1 | |
| **Tổng** | **16 file** | Cộng spring rig ở `armL`/`armR` → đủ toàn bộ thao tác |

---

### 2.6. KHÔNG frame-by-frame animation — ngân sách bằng chữ

**Số của Cuphead** (CANON §16, idea §18.6): **hơn 25 phút công cho MỘT frame**, **~10 giờ cho 1 giây** animation.

**Quy đổi vào dự án này:**

| Nếu làm FBF cho... | Số giây | Giờ công | Quy ra tháng artist ($2.000/tháng, 160h) |
|---|---|---|---|
| Một chu kỳ làm bánh (rạch, quết, xếp, gói) | ~12s | **~120h** | 0,75 tháng = **$1.500** |
| Biểu cảm đầy đủ cho 1 NPC (216 trạng thái) | — | **~90h** | **$1.125** / NPC → **$14.600 cho 13 NPC** |
| Một chu kỳ đi bộ cho 12 NPC | 12 × 1s | **~120h** | **$1.500** |
| Intro 30 giây | 30s | **~300h** | 1,9 tháng = **$3.750** |

**Tổng nếu đi đường FBF: ~$21.000 và ~5 tháng-người — cho riêng animation.** Toàn bộ ngân sách art dự kiến (§5) là **~$15.000**. Con số tự nói.

> **NGÂN SÁCH FRAME-BY-FRAME CỦA DỰ ÁN: 0 GIỜ. KHÔNG CÓ NGOẠI LỆ.**

Bao gồm cả những chỗ người ta hay xin ngoại lệ:
- **Cảnh kết ngày 40** → **3 tranh tĩnh** (still illustration), chuyển bằng cross-fade, không animation.
- **Intro game** → 1 tranh tĩnh + chữ + tiếng rao (P5-03).
- **Minigame đốt vía** (idea §19.1) → **hạt lửa procedural + spring rig**, không vẽ từng frame lửa.
- **Trailer** → dựng từ gameplay thật, không làm cut-scene vẽ riêng (idea §24).

**Cái gì được dùng thay:**

| Nhu cầu | Giải pháp | Chi phí |
|---|---|---|
| Biểu cảm | Layered sprite 6×6×6 (§2.3) | 18 file/NPC |
| Chuyển động cơ thể | Spring rig (§2.4) | **0 file** |
| "Cảm giác tay" | Squash/stretch 1–2 frame (§2.5) | **0 file** |
| Lửa, khói, mưa, hơi nước, bụi | **Particle procedural** (Phaser emitter) | 4–6 texture hạt |
| Nước sốt chảy, pate quết | **Mask reveal** trên texture tĩnh (tăng dần `crop`) | 1 texture/nguyên liệu |
| Bánh nướng chuyển màu | **Tint nội suy** giữa 3 màu mốc | 0 file |
| Chuyển cảnh | Cross-fade / cắt cứng | 0 file |
| Đi bộ của NPC nền | **Bóng người tĩnh + spring bob + đổi pose bằng cross-fade** | 4 silhouette |

---

### 2.7. Key art tuần 3–4 và Capsule art

#### 2.7.1. Key art — brief giao cho `ART-1`

> **Một khung. Hẻm Sài Gòn, 6 giờ sáng. Không làm gì khác cho tới khi khung đó đẹp.** (idea §23, tuần 3–4)

| Mục | Yêu cầu |
|---|---|
| **Khung giờ** | `CAO_DIEM` (§2.1.2). Nắng vừa lên, chiếu ngang từ sau-trái, góc 21° |
| **Tỉ lệ** | 16:9, tối thiểu 3840×2160 (để cắt được mọi kích thước Steam) |
| **Bố cục** | Xe bánh mì ở **1/3 trái**, hẻm hút sâu về phải. **Dây điện cắt ngang 1/3 trên.** Vệt nắng chéo từ trên-trái xuống, chạm đúng **khu vực `HANDS`** |
| **Bắt buộc có trong khung** | 1) Xe bánh mì · 2) **Bảng hiệu đỏ chữ vàng** · 3) **Ghế nhựa** (ít nhất 2 cái, 1 chồng) · 4) **Hũ đũa** trên mặt xe · 5) **Xe máy dựng sát vách nhường lối** · 6) **Chậu trầu bà treo** · 7) **Ít nhất một người khách có mắt hướng về phía tay người bán** · 8) Dây điện · 9) Mái tôn chắp vá |
| **Cấm có trong khung** | Bản đồ, quả địa cầu, poster du lịch, lịch có hình, nón cối, bất cứ gì liên quan quân sự, chữ tiếng Anh, filter vàng |
| **Chữ trong ảnh** | **Không**. Key art phải đứng được trước khi có logo |
| **Nhân vật chính** | Chỉ **tay + cẳng tay + vai**, không mặt (§2.5.3) |
| **Tông** | Không "cozy dễ thương". Tông đúng là **sáng, gắt, đông, có người đang nhìn** |

#### 2.7.2. "Đứng được một mình" — tiêu chí đo được

Khung key art **pass** khi qua đủ **6 cửa**:

| # | Cửa | Cách đo | Ngưỡng |
|---|---|---|---|
| **K1** | **Thử 3 giây** | Cho 10 người lạ (ngoài nhóm phát triển) xem **3 giây**, hỏi: *"Đây là đâu?"* | **≥ 7/10** trả lời "Việt Nam" hoặc "Sài Gòn" — **không được nhắc trước** |
| **K2** | **Thử "ai đang nhìn"** | Cùng 10 người, hỏi tiếp: *"Trong hình có chuyện gì đang xảy ra?"* | **≥ 5/10** nhắc tới việc **có người đang nhìn / đang quan sát** |
| **K3** | **Thử thu nhỏ** | Thu về **231×87** (capsule nhỏ nhất của Steam), nhìn trên điện thoại | Vẫn đọc ra: có một cái xe, có người, có màu đỏ-vàng |
| **K4** | **Thử đen trắng** | Chuyển grayscale | Bố cục vẫn đọc được; vùng `HANDS` vẫn là vùng sáng nhất |
| **K5** | **Thử mù màu** | 3 bộ lọc (protan/deuter/tritan) | Bảng hiệu vẫn nổi bật khỏi tường ở cả 3 |
| **K6** | **Thử người Việt ở TP.HCM** | 5 người Việt sống ở Sài Gòn, hỏi: *"Có gì sai không?"* | **0 lỗi nghiêm trọng**; mọi góp ý chi tiết phải được sửa hoặc được ghi lý do không sửa |

**Không đạt K1 hoặc K2 → làm lại, không đi tiếp.** Đây là cổng của idea §23 ("khung hình đó đứng được một mình") và nó **quan trọng hơn lịch**.

#### 2.7.3. Capsule art — thuê riêng

> **Cận cảnh đôi mắt khách nhìn thẳng vào tay bạn trong lúc bạn đang làm bánh.**
> Thuê riêng **$800–1.200** (idea §23 tuần 9). **Đừng để artist chính làm.**

**Vì sao không để `ART-1` làm:**
1. Capsule là **bài toán marketing**, không phải bài toán nhất quán thế giới. Kỹ năng khác hẳn.
2. `ART-1` đã "nhìn quen" thế giới này 6 tuần → mất khả năng thấy nó như người lạ lướt Steam thấy.
3. Đường tới hạn: tuần 9 `ART-1` **phải** đang làm NPC. Một tuần làm capsule là một tuần trễ vertical slice.
4. $800–1.200 cho thứ quyết định tỉ lệ click trên Steam là rẻ nhất trong toàn bộ ngân sách.

**Brief capsule:**

| Mục | Yêu cầu |
|---|---|
| Chủ thể | **Đôi mắt** của một người khách Việt, chiếm **2/3 trên** khung, nhìn **xuống-chéo** — hướng nhìn phải trỏ đúng vào tay ở tiền cảnh |
| Tiền cảnh | **Tay đang làm bánh mì** (dao đang rạch, hoặc đang quết pate), **mờ nhẹ**, chiếm 1/3 dưới |
| Ánh sáng | Bảng màu `CAO_DIEM`. Nắng trắng gắt từ sau-trái. Mắt có **catchlight trắng** rõ |
| Cảm xúc của đôi mắt | **Không giận, không vui — đang ĐÁNH GIÁ.** Đây là toàn bộ game trong một biểu cảm |
| Không có | Chữ, logo, khung viền, nền gradient, bất cứ gì ở §2.8 |
| Đầu ra bắt buộc | `1920×620` (hero) · `616×353` (main) · `467×181` (small) · `231×87` (**tiny — test ở đây trước**) · `374×448` (vertical) · `374×448` (library) · `1232×706` (library hero) |

**Tiêu chí pass:** thu về **231×87**, đặt xen giữa 9 capsule game cozy khác trên một hàng Steam giả lập, cho 10 người xem 5 giây → **≥ 6/10 nhớ được capsule này** khi hỏi lại sau 1 phút.

---

### 2.8. Lằn ranh đỏ art (CANON §14.1) — cơ chế thi hành

Đây không phải danh sách để đọc rồi nhớ. Đây là **cơ chế chặn ở build**.

#### 2.8.1. Danh sách cấm

| # | Cấm | Mức | Ghi chú |
|---|---|---|---|
| **1** | **Mọi bản đồ, quả địa cầu, poster du lịch, tờ lịch có hình → TỰ VẼ** | **LẰN RANH ĐỎ** | *Âm Dương Sư* bị **dừng phát hành hẳn tại VN**. Đây là rủi ro **chết**, không phải rủi ro PR |
| **2** | **KHÔNG BAO GIỜ mua asset pack bản đồ thế giới từ marketplace** | **LẰN RANH ĐỎ** | Không kiểm soát được nội dung trong pack. Mua một lần là mất cả dự án |
| **3** | **Chiến tranh — không một chữ, không một hình** | **LẰN RANH ĐỎ** | **Không nón cối**, không quân phục, không vỏ đạn, không xe tăng, không flashback, không huân chương trên tường, không ảnh liệt sĩ trên bàn thờ |
| **4** | Hạ thấp nghề bán bánh mì | **LẰN RANH ĐỎ** | Xe bánh mì vẽ **gọn gàng, có phẩm giá, được chăm sóc**. Bừa bộn thì được; bẩn thỉu tội nghiệp thì không |
| **5** | Bà Bảy không được vẽ để gây thương hại | **LẰN RANH ĐỎ** | idea §19.5. Bà có xấp vé số **và** có radio cải lương. Lưng thẳng. Áo bà ba sạch |
| **6** | Không brand thật | Nghiêm | Logo xe máy, chai tương ớt, lon sữa đặc, bao thuốc → **tự thiết kế nhãn gần giống** |
| **7** | Nội dung trên loa phường / băng rôn / khẩu hiệu | Nghiêm | Nếu vẽ loa phường thì **không có chữ nào trên đó**. Không vẽ băng rôn, không khẩu hiệu |
| **8** | Quốc kỳ | **Vàng — tránh là chính** | Mặc định **không vẽ**. Nếu buộc phải có: đúng tỉ lệ 2:3, sao 5 cánh đều, đỏ `#DA251D`, vàng `#FFFF00`, **và phải có người Việt duyệt riêng**. Vẽ sai quốc kỳ còn tệ hơn không vẽ |
| **9** | Bàn thờ / đồ thờ | Vàng | Được có, **tông nhẹ**, không cận cảnh, không dùng làm điểm nhấn kịch tính (CANON §14 "tâm linh giữ tông nhẹ/tự trào") |
| **10** | Tiền Việt Nam thật | Vàng | Vẽ **cách điệu**, không sao chép mặt tờ tiền. Đủ nhận ra màu và mệnh giá là được |
| **11** | Chữ trên texture sai chính tả hoặc thiếu dấu | Nghiêm | Mọi chữ trong hình phải **có dấu đầy đủ** và được người Việt đọc duyệt |

#### 2.8.2. Thi hành bằng cơ chế, không bằng trí nhớ

1. **`assets/PROVENANCE.csv` bắt buộc.** Mọi file trong `assets/art/` phải có một dòng: đường dẫn, tác giả, giấy phép, `self_drawn` (Y/N), người duyệt, ngày.
   → **CI fail** nếu có file không có dòng, hoặc có dòng mà file không tồn tại.
2. **Blocklist tên file** trong CI: `map`, `world`, `globe`, `atlas_world`, `flag`, `travel`, `poster`, `military`, `soldier`, `helmet`, `calendar` — mọi khớp phải có dòng `self_drawn=YES` **và** trường `reviewed_by` khác rỗng.
3. **Cổng duyệt thủ công `RED-LINE REVIEW`**: trước mỗi milestone (vertical slice, Steam page, ship), **một người Việt sống ở Việt Nam** duyệt **mọi** asset môi trường mới, ký vào `docs/phu-luc/red-line-signoff.md`.
4. **Không có asset pack nào được mua cho môi trường Việt Nam.** Ngoại lệ duy nhất cho phép mua: **brush/texture nền trung tính** (giấy, nhiễu, vết bẩn) **không có hình cụ thể**. Phải ghi vào PROVENANCE.
5. **Credits:** người Việt viết văn hoá đứng **ĐẦU** credits (CANON §14.1), không phải dòng "cultural consultant" ở cuối. Layout credits do `PROD` viết và `QA-A11Y` kiểm ở gate P6.

---

### 2.9. Khai báo gen-AI trên Steam

**Sự thật đã kiểm chứng (idea §10):** rủi ro AI thật sự nằm ở **ASSET**, không nằm ở NPC dialogue. Hai con số đã bị đánh sập (chi phí LLM/hội thoại; "3 game phải gỡ vì NPC AI nói bậy") — **đừng dùng lại chúng ở đâu cả**. Những vụ thật đều là **AI art**: một dev tự gỡ game vì dùng AI vẽ card art; *Clair Obscur* bị Indie Game Awards **tước 2 giải vì AI art**.

Và: số game khai báo dùng gen-AI trên Steam nhảy từ **~1.000 (cả năm 2024)** lên **gần 8.000 chỉ trong 6 tháng đầu 2025** → **gen-AI không còn là lợi thế khác biệt**, chỉ còn là rủi ro.

#### Khuyến nghị chính sách asset của dự án

> **Chính sách: KHÔNG có gen-AI trong bất kỳ asset nào được ship. Khai báo "No" trên Steam, và biến điều đó thành một điểm bán.**

| Hạng mục | Chính sách | Lý do |
|---|---|---|
| **Art 2D (mọi sprite, nền, UI, icon, capsule, key art)** | **Cấm tuyệt đối** | Đây là rủi ro thật. Và game bán bằng **tính xác thực văn hoá** — asset AI mâu thuẫn trực tiếp với luận điểm bán hàng |
| **Lồng tiếng** | **Cấm tuyệt đối** | *"Tôi nghe ra AI voice trong 2 giây và tôi sẽ refund"* (idea §19.5) |
| **Nhạc** | **Cấm tuyệt đối** | Cùng lý do |
| **SFX** | **Cấm** | Thu thật hoặc mua thư viện có giấy phép rõ (ghi PROVENANCE) |
| **Thoại / văn bản trong game** | **Cấm dùng lúc chạy.** Viết tay 95%+ | idea §10: *"95% thoại viết tay, LLM chỉ dùng OFFLINE để sinh nội dung, không dùng lúc chạy"*. **Và cả nội dung sinh offline cũng phải được người viết lại toàn bộ trước khi vào build** — nếu không, nó là asset sinh bởi AI và phải khai báo |
| **Moodboard / tham khảo nội bộ** | Được, **không bao giờ trace, không bao giờ ship** | Sống trong `/scratch/` — thư mục **trong `.gitignore`**, không có đường nào từ build tới đó |
| **Hỗ trợ viết mã** | Được | Không phải "nội dung game" theo định nghĩa khai báo của Steam; vẫn ghi rõ trong doc nội bộ để minh bạch |
| **Placeholder / greybox** | Được, **phải xoá hết trước khi kết thúc P1** | Có checklist ở gate P1 |

**Cơ chế thi hành:**
- `assets/PROVENANCE.csv` có cột `license`. Giá trị hợp lệ: `work-for-hire` · `SIL OFL 1.1` · `CC0` · `<tên thư viện> commercial` · `self-recorded`. **Giá trị `ai-generated` không nằm trong danh sách hợp lệ → CI fail.**
- Hợp đồng với `ART-1`, `SND`, và mọi diễn viên lồng tiếng có **điều khoản: không sử dụng công cụ sinh nội dung AI cho sản phẩm bàn giao**, và **không cho phép dùng bản ghi/bản vẽ để huấn luyện AI**.
- Thư mục `/scratch/` nằm trong `.gitignore`; CI fail nếu có `import`/`require`/đường dẫn nào trỏ vào đó.

**Trên trang Steam (P6 dùng nguyên văn):**

```
AI GENERATED CONTENT DISCLOSURE
  Pre-generated:  No
  Live-generated: No

Every drawing, every sound, every line of dialogue and every voice in
this game was made by a person. The Vietnamese writers and cultural
consultants are credited at the TOP of the credits, not the bottom.
```

---

## 3. Dữ liệu & schema

```ts
// content/art/palette.json  -> types
export type TimeOfDay = 'TO_MO' | 'CAO_DIEM' | 'NANG_DUNG' | 'CHIEU'
export type Weather   = 'KHO' | 'MUA'

export type PaletteSlot =
  | 'sunDirect' | 'spec' | 'sky' | 'ambient' | 'shadow' | 'shadowDeep'
  | 'wall' | 'concrete' | 'mold' | 'signRed' | 'signYellow'
  | 'chairRed' | 'chairBlue' | 'tarpBlue' | 'plantLight' | 'plantDark'
  | 'crust' | 'crumb' | 'skinLight' | 'skinMid' | 'skinShadow' | 'steel'

export type Palette = Record<PaletteSlot, `#${string}`> & {
  globalChromaMul: number     // CAO_DIEM 1.00 · NANG_DUNG 0.88 · MUA 0.55
  globalContrastMul: number   // CAO_DIEM 1.00 · MUA 0.72
  shadowLengthMul: number     // CAO_DIEM 2.40 · NANG_DUNG 0.60 · CHIEU 3.10
  sunAngleDeg: number         // CAO_DIEM 21 · NANG_DUNG 68 · CHIEU 24
  hueRotateMaxDeg: 15         // HẰNG SỐ — không bao giờ vượt
}

// ui/stall/faceRig.ts
export type FaceIdx = '01'|'02'|'03'|'04'|'05'|'06'
export type FaceCombo = { brow: FaceIdx; eye: FaceIdx; mouth: FaceIdx }

// sim/springRig.ts
export type NodeId = 'hip' | 'chest' | 'head' | 'armL' | 'armR'
export type SpringCfg = { k: number; c: number; m: number; maxOffset: number; maxRotDeg: number }
export type PoseTarget = Partial<Record<NodeId, { x?: number; y?: number; rot?: number }>>
export type Pose = {
  id: string
  target: PoseTarget
  holdMs: number | 'HOLD'
  blendWeight?: number          // mặc định 1.0
  exclusive?: boolean           // pose này không blend với pose khác
}
```

**Ví dụ content thật — `content/art/npc/ba_bay.art.json`:**

```json
{
  "npcId": "ba_bay",
  "atlas": "npc_ba_bay",
  "face": {
    "base": "base",
    "browCount": 6, "eyeCount": 6, "mouthCount": 6,
    "extras": ["non_la", "kinh_lao"],
    "blink": { "meanMs": 4200, "durMsMin": 90, "durMsMax": 140 },
    "speakHz": 8
  },
  "body": {
    "parts": ["torso", "armL", "armR", "hip"],
    "props": ["xap_ve_so"],
    "neckAnchor": { "x": 96, "y": 42 }
  },
  "spring": {
    "head":  { "k": 160, "c": 22, "m": 1.0, "maxOffset": 10, "maxRotDeg": 14 },
    "chest": { "k": 90,  "c": 18, "m": 1.4, "maxOffset": 7,  "maxRotDeg": 8  },
    "hip":   { "k": 60,  "c": 16, "m": 1.8, "maxOffset": 4,  "maxRotDeg": 3  },
    "armL":  { "k": 120, "c": 20, "m": 0.8, "maxOffset": 0,  "maxRotDeg": 25 },
    "armR":  { "k": 120, "c": 20, "m": 0.8, "maxOffset": 0,  "maxRotDeg": 25 }
  },
  "personalityBias": {
    "soi": 0.9, "nongTinh": 0.6, "deTha": 0.8, "thanThien": 0.7,
    "idlePosePool": ["weight_shift", "look_at_hands", "tilt_head", "look_away"],
    "idlePoseWeights": [3, 4, 2, 1]
  },
  "faceMap": {
    "GLIMPSED":  { "brow": "02", "eye": "04", "mouth": "01", "pose": "tilt_head" },
    "NOTICED":   { "brow": "04", "eye": "03", "mouth": "04", "pose": "look_at_hands" },
    "CONFIRMED.DROPPED_FOOD.hi": { "brow": "02", "eye": "02", "mouth": "06", "pose": "step_back_half" },
    "CONFIRMED.REMEMBERED_USUAL.hi": { "brow": "03", "eye": "06", "mouth": "03", "pose": "nod" }
  },
  "notes": "soi 0.9 -> mắt luôn nheo (03) thay vì mở to (02). Prop xấp vé số ở armR. KHÔNG dùng prop này làm chi tiết gợi thương hại (idea §19.5)."
}
```

**`assets/PROVENANCE.csv`** — bắt buộc, xem §2.8 lằn ranh đỏ:

```csv
path,author,license,self_drawn,reviewed_by,date
art/env/bang_hieu_do.png,Nguyễn V. A,work-for-hire,YES,PROD,2026-04-12
art/env/xe_may_01.png,Nguyễn V. A,work-for-hire,YES,PROD,2026-04-12
art/ui/icon_hanh_la.png,Nguyễn V. A,work-for-hire,YES,QA-A11Y,2026-04-20
font/BeVietnamPro-Regular.ttf,Be Group,SIL OFL 1.1,NO,PROD,2026-03-02
```

---

## 4. UI/UX hai thiết bị

| Khía cạnh | **PC** | **Cảm ứng** |
|---|---|---|
| Độ phân giải thiết kế | Canvas logic 1280×720, `Phaser.Scale.FIT` | Y hệt, letterbox ở tỉ lệ lạ |
| Kích thước mặt NPC trên màn hình | 128×128 logic ở `FRONT_CENTER`, 96 ở `QUEUE_2`, 72 ở `QUEUE_3` | **Không nhỏ hơn 108** ở `FRONT_CENTER` — ngón tay che nhiều hơn |
| Đọc được `eye_04` (liếc vào tay) | Ở 72px vẫn phải đọc được | Ở 108px |
| Bố cục | Khách bên trái-trên, tay + khay giữa-dưới, bảng nguyên liệu phải | Khay đẩy lên trên để ngón cái không che; bảng nguyên liệu ở **cạnh dưới** |
| Biến thể asset tĩnh (`reduceMotion`) | Cùng bộ | Cùng bộ — **làm một lần, dùng hai nơi** |
| Mipmap / lọc | `NEAREST` nếu chốt pixel-art; `LINEAR` + mipmap nếu chốt vector-ish | Bắt buộc mipmap (màn hình DPR 3) |
| Ngân sách texture | ≤ **96 MB** VRAM | ≤ **48 MB** (thiết bị web tầm trung) → atlas nén, 2 mức LOD cho nền bake |
| Bake nền | `RenderTexture` 2560×1440 | `RenderTexture` 1920×1080 |

**Luật chung:** art **không** có phiên bản riêng cho mobile. Một bộ asset, hai mức LOD. Mobile là v2 (CANON §2) nhưng demo web chạy trên tablet ngay từ v1 → phải tính từ đầu.

---

## 5. Tham số cần tune

### 5.1. Tham số kỹ thuật

| Tên | Khởi điểm | Khoảng | Cách đo | Ai |
|---|---|---|---|---|
| `spring.head.k` | 160 | 120–220 | Quay 10s, xem đầu có "nảy" quá không. `zeta` giữ trong 0,80–0,95 | `DEV-GP` |
| `spring.head.c` | 22 | 16–30 | Cùng trên | `DEV-GP` |
| `spring.chest.k` | 90 | 70–130 | Độ trễ `chest` sau `hip` phải cảm được nhưng ≤ 90ms | `DEV-GP` |
| Độ trễ liên đốt `hip→chest→head` | 60 / 110 ms | 40–140 ms | Nếu > 140ms thì trông như cao su | `DEV-GP` |
| `breath.amp` | 1,5px | 1,0–2,5px | > 2,5px thì trông như thở dốc | `ART-1` |
| `blink.meanMs` | 4200 | 3000–6000 | < 3000 trông lo lắng; > 6000 trông như tượng | `ART-1` |
| `speakHz` (miệng khi nói) | 8 Hz | 6–11 Hz | So với VO thật, P5-03 §7 | `SND` + `DEV-GP` |
| `SQUASH_2F` biên độ | 1,06 / 0,94 | 1,03–1,10 | Ở 32px phải ra **đúng 1 hàng pixel** lệch | `ART-1` |
| `poseDelayMs` (chống twinning) | 200–400ms | 150–500ms | CANON §11. Quay 3 NPC cùng phản ứng, không được cùng frame | `DEV-GP` |
| `bodyLanguageAmp` khi giảm chuyển động | 0,40 | 0,30–0,55 | P5-01 §5 | `DEV-GP` |
| `globalChromaMul` mưa | 0,55 | 0,45–0,70 | Nếu mưa trông "đẹp" quá thì tăng độ xám | `ART-1` |
| `shadowLengthMul` cao điểm | 2,40 | 2,0–3,0 | So với ảnh tham chiếu chụp thật 6:45 sáng | `ART-1` |
| Tương phản sprite gameplay / nền | 3:1 | **≥ 3:1** | Script quét, mọi bảng màu | `QA-A11Y` |
| Kích thước atlas / NPC | 512×512 | 512 hoặc 1024 | Nếu 512 không đủ ở 128px thì cắt `extra` trước khi lên 1024 | `DEV-UI` |

### 5.2. Ngân sách art cho một mùa 40 ngày

**Đơn vị công (giá trị khởi điểm, `Cần đo` sau 2 tuần đầu làm việc thật với `ART-1`):**

| Loại asset | Giờ / đơn vị |
|---|---|
| Lớp mặt (brow/eye/mouth) | 0,75h |
| `base` mặt + thiết kế nhân vật | 5,0h |
| Bộ body (4 part) | 3,5h |
| Prop NPC | 1,0h |
| Prop môi trường (nhỏ) | 1,5h |
| Prop môi trường (lớn: xe đẩy, tủ, xe máy) | 5,0h |
| Module kiến trúc | 4,0h |
| **Nền bake một khung giờ** | 12,0h |
| Icon nguyên liệu (3 trạng thái) | 2,0h |
| Khung UI / nút / khung sổ | 1,0h |
| Texture hạt / FX | 1,5h |
| Biến thể tĩnh cho `reduceMotion` | 0,5h |
| Tranh tĩnh (kết game, intro) | 14,0h |

**Bảng khối lượng:**

| Hạng mục | Số lượng | Giờ/đv | **Tổng giờ** |
|---|---|---|---|
| 13 NPC có tên (12 + cô Ba): `base` + design | 13 | 5,0 | **65** |
| 13 NPC: 18 lớp mặt | 13 × 18 = 234 | 0,75 | **176** |
| 13 NPC: body 4 part | 13 | 3,5 | **46** |
| 13 NPC: prop | ~20 | 1,0 | **20** |
| 4 archetype khách vãng lai (base + 18 lớp + body) | 4 | 18,5 | **74** |
| Tay người chơi (16 sprite) | 16 | 0,9 | **14** |
| Prop môi trường nhỏ | 105 | 1,5 | **158** |
| Prop môi trường lớn | 14 | 5,0 | **70** |
| Module kiến trúc | 16 | 4,0 | **64** |
| Nền bake (hẻm ×4 giờ + mưa + tối, chợ, nhà) | 8 | 12,0 | **96** |
| Icon nguyên liệu × 3 trạng thái | 24 | 2,0 | **48** |
| Bánh mì 5 giai đoạn nướng + 6 giai đoạn lắp | 11 | 1,2 | **13** |
| Thiết bị nâng cấp (12 món × 2 trạng thái) | 24 | 2,5 | **60** |
| UI (nút, khung, sổ tay, bảng chợ, menu) | 90 | 1,0 | **90** |
| Texture hạt / FX | 12 | 1,5 | **18** |
| **Biến thể tĩnh cho `reduceMotion`** | 20 | 0,5 | **10** |
| Tranh tĩnh (3 kết + 1 intro) | 4 | 14,0 | **56** |
| Style guide + pass sửa + tích hợp (15%) | — | — | **162** |
| **TỔNG** | **~830 file** | | **≈ 1.240 giờ** |

**Chuyển thành người và tiền** (dùng đúng số của idea §23: artist VN **$1.500–2.500/tháng**, 160h/tháng):

| Kịch bản | Nhân sự | Tháng | Chi phí art |
|---|---|---|---|
| **Tối thiểu (vertical slice + Steam page, tuần 3–12)** | 1 artist chính | 2,5 tháng × 160h = 400h | $1.500–2.500 × 2,5 = **$3.750–6.250** |
| **Full release** | 1 chính (5,5 tháng) + 1 phụ bán thời gian (3 tháng × 80h) | 880h + 240h = 1.120h | chính $8.250–13.750 + phụ $2.250–3.750 = **$10.500–17.500** |
| **+ Capsule thuê riêng** | 1 illustrator | — | **$800–1.200** |
| **TỔNG ART, full release** | | | **$11.300 – $18.700** |

> **Gap cần biết trước:** 1.240h ÷ 160h/tháng = **7,75 tháng-người**, trong khi lộ trình idea §23 chỉ có ~9 tháng tổng và artist ký ở tuần 3. → **Không đủ cho một người.** Hai lối thoát, phải chọn ở tuần 4:
> 1. **Thêm artist phụ** từ tuần 12 (đã tính ở bảng trên).
> 2. **Cắt scope art**: giảm 13 NPC → 9 NPC có rig đầy đủ, 4 người còn lại dùng bộ mặt **rút gọn 4×4×4 = 64 trạng thái** (12 file thay vì 18). Tiết kiệm ~90h. Cộng bỏ 2 khung giờ (giữ CAO_DIEM + MUA + TO_MO, bỏ NANG_DUNG và CHIEU làm bằng tint từ CAO_DIEM). Tiết kiệm thêm 24h.
>
> **Khuyến nghị: làm cả hai.** Không được cắt: danh sách 6 thứ bắt buộc §2.2.1, biến thể `reduceMotion`, và key art.

### 5.3. Thứ tự giao việc (ưu tiên nghiêm ngặt)

| # | Việc | Tuần | Điều kiện để sang bước sau |
|---|---|---|---|
| **1** | **KEY ART — một khung hẻm Sài Gòn 6h sáng** | **3–4** | **Khung đó đứng được một mình** (§6.2). Không làm gì khác cho tới khi đạt |
| 2 | **Style guide 1 trang** rút ra từ key art: chip màu, độ dày nét, luật bóng đổ, luật rim light, luật chroma | 4 | `PROD` duyệt |
| 3 | Nền bake hẻm `CAO_DIEM` (chính là key art, tách lớp) | 5 | Chạy được trong `RenderTexture` |
| 4 | **Xe bánh mì + quầy + thớt + lò + tủ kính** | 5 | Đây là thứ người chơi nhìn 90% thời gian |
| 5 | **Tay người chơi (16 sprite)** | 5 | |
| 6 | **Bánh mì 5 giai đoạn + 12 nguyên liệu lõi** (icon + trên bánh) | 5–6 | Qua test silhouette P5-01 §2.7.2 |
| 7 | **NPC #1: Bà Bảy — rig đầy đủ, làm mẫu chuẩn** | 6 | Là template cho 12 người còn lại. Duyệt kỹ, sai ở đây là sai 13 lần |
| 8 | **NPC #2, #3** (đề xuất: **Chú Tư** — dạy lịch; **Anh Bảo** — `gazeFactor` thấp nhất, sandbox học perception) | 6–7 | Chốt cuối cùng thuộc doc P1 |
| 9 | **6 thứ bắt buộc §2.2.1 + 30 prop hẻm ưu tiên P0/P1** | 7 | |
| 10 | **Biến thể tĩnh `reduceMotion`** cho mọi FX đã làm | 7 | **Không để sang P5.** Làm cùng lúc với FX |
| 11 | UI vertical slice + icon còn lại | 7–8 | |
| 12 | *(song song, artist khác)* **Capsule art** | 9 | §2.7 |
| 13 | 10 NPC còn lại | 10–16 | |
| 14 | Nền bake `TO_MO` / `MUA` / tối / chợ / nhà | 12–18 | |
| 15 | Thiết bị nâng cấp | 16–20 | |
| 16 | `NANG_DUNG` / `CHIEU` (hoặc tint nếu cắt scope) | 20–22 | |
| 17 | 3 tranh tĩnh kết game + intro | 22–24 | |
| 18 | Pass đánh bóng + sửa theo playtest | 24–26 | |

---

## 6. Tiêu chí đạt

### 6.1. Checklist kỹ thuật

| # | Tiêu chí | Cách đo | Pass |
|---|---|---|---|
| B1 | Bảng màu nằm trong **một** file, mọi tint đọc từ đó | Grep hex hard-code trong `src/` | **0** hex ngoài `palette.json` |
| B2 | `hueRotate` toàn cục ≤ 15° ở mọi khung giờ | Đọc config | Pass |
| B3 | Không có LUT cam/teal, không overlay vàng | Review shader | Pass |
| B4 | 6 thứ bắt buộc §2.2.1 đều có mặt trong scene quầy | Checklist thủ công | 6/6 |
| B5 | Sprite gameplay tương phản ≥ 3:1 với nền, **5 bảng màu** | Script | 0 vi phạm |
| B6 | 4 state perception phân biệt được **khi grayscale** | 10 người xem 40 ảnh chụp, đoán state | **≥ 8/10** đúng ≥ 34/40 |
| B7 | Mọi NPC có đủ 18 lớp mặt, đúng naming, đúng canvas 128×128 | Script quét atlas | 13/13 |
| B8 | **Không lệch anchor**: chồng 216 tổ hợp, tâm hai mắt không dịch quá 0px | Script so pixel mốc canh | **0px** |
| B9 | Atlas mỗi NPC = 1 texture → 1 draw call | Phaser debug | 13/13 |
| B10 | Spring rig: `zeta` mọi node trong 0,75–1,05 | Tính từ config | 5/5 node |
| B11 | Chống twinning: 3 NPC cùng phản ứng không cùng frame | Quay 20 lần | 0 lần trùng frame |
| B12 | Squash/stretch **không** kéo dài quá 2 frame ở đâu cả | Grep + review | 0 vi phạm |
| B13 | **0 giờ frame-by-frame** trong toàn bộ dự án | Kiểm timesheet + kiểm asset (không có thư mục sprite sheet animation nào) | 0 |
| B14 | Mặt người chơi không xuất hiện ở bất kỳ đâu (kể cả key art, capsule, trailer) | Review thủ công mọi art marketing | 0 |
| B15 | Biến thể tĩnh `reduceMotion` tồn tại cho **mọi** FX chuyển động | Đối chiếu danh sách 15 mục P5-01 §2.3 | 15/15 |
| B16 | `PROVENANCE.csv` phủ 100% file trong `assets/art/` | CI | 100% |
| B17 | Blocklist tên file: 0 khớp chưa duyệt | CI | 0 |
| B18 | `RED-LINE REVIEW` có chữ ký cho mọi milestone | Đọc `red-line-signoff.md` | Đủ |
| B19 | Không có giá trị `license = ai-generated` | CI | 0 |
| B20 | Không có đường dẫn build nào trỏ vào `/scratch/` | CI | 0 |
| B21 | VRAM texture ≤ 96 MB (PC) / 48 MB (web) | Đo runtime | Pass |
| B22 | 30fps ổn định với 3 NPC + rig + FX ở giờ cao điểm, trên máy tầm trung | Đo 5 phút | ≥ 30fps ở p95 |

### 6.2. Cổng key art (tuần 4) và cổng capsule (tuần 9)

| Cổng | Tiêu chí | Ai ký |
|---|---|---|
| **KEY ART** | K1–K6 ở §2.7.2 đều pass | `PROD` + 1 người Việt ở TP.HCM |
| **CAPSULE** | Test 231×87 giữa 9 capsule khác: ≥ 6/10 nhớ lại | `PROD` |
| **Không đạt** | **Làm lại. Không đi tiếp.** idea §23: *"Không làm gì khác cho tới khi khung đó đẹp"* | |

---

## 7. Rủi ro & cách bịt

| # | Rủi ro | Hậu quả | Cách bịt |
|---|---|---|---|
| R1 | **Artist trượt vào vàng nghệ** — đây là phản xạ mặc định, sẽ xảy ra | Mất tính xác thực; người Việt nhận ra ngay và nói ra trên mạng | Chip màu in ra dán tường; luật số `hueRotateMaxDeg = 15`; review **mọi** bake bằng cách đặt cạnh ảnh chụp thật 6:45 sáng |
| R2 | **Mua nhầm asset pack có bản đồ** | Có thể bị **dừng phát hành tại VN** — rủi ro chết dự án | `PROVENANCE.csv` + blocklist CI + RED-LINE REVIEW. **Chính sách: không mua asset pack môi trường, chấm hết** |
| R3 | **Ngân sách art vỡ** (1.240h > 1 artist trong lịch) | Trễ ship hoặc art dở dang | Đã nêu ở §5.2. Quyết định ở **tuần 4**, không để tới tuần 20 |
| R4 | **Ai đó xin ngoại lệ frame-by-frame** cho "một cảnh thôi" | 10h công cho 1 giây; và tạo tiền lệ | B13 là tiêu chí nhị phân. Mọi nhu cầu animation có giải pháp thay ở §2.6 bảng cuối |
| R5 | **Lệch anchor giữa các lớp mặt** | 216 tổ hợp đều hỏng, phát hiện muộn thì phải vẽ lại | Một canvas chung, anchor `(0,0)`, mốc canh ở `(128,128)`, test B8 chạy mỗi commit |
| R6 | **Spring rig thành "cao su"** (quá nảy) | NPC trông như đồ chơi, giết tông | `zeta` khoá trong 0,75–1,05 (B10); độ trễ liên đốt ≤ 140ms |
| R0.5 | **Giảm chuyển động làm mất ngôn ngữ cơ thể** → mất kênh T3 | Người bật a11y không đọc được quan hệ | §2.4.4: giảm biên độ, tăng thời gian giữ. Không bao giờ tắt rig. Đo ở P5-01 §6.2 A-4 |
| R8 | **Biến thể `reduceMotion` bị để tới cuối rồi bị cắt** | Vi phạm CANON §15.3 | Đưa vào **bước 10** của thứ tự giao việc (tuần 7), không phải cuối |
| R9 | **`ART-1` làm luôn capsule vì "tiện"** | Trễ vertical slice + capsule kém | Ghi vào hợp đồng phạm vi công việc; $800–1.200 đã có trong ngân sách |
| R10 | **Bà Bảy bị vẽ thành hình ảnh thương hại** | Vi phạm idea §19.5, và là lỗi dễ mắc nhất vì nó "tự nhiên" | Luật vẽ: lưng thẳng, áo sạch, radio cải lương luôn trong khung của bà. RED-LINE REVIEW kiểm riêng nhân vật này |
| R11 | **Chữ tiếng Việt trên texture thiếu dấu** | Lỗi xấu hổ nhất có thể có với game về VN | Mọi texture có chữ đều qua người Việt đọc duyệt; ghi vào `PROVENANCE.reviewed_by` |
| R12 | **Placeholder AI lọt vào build** | Phải khai báo gen-AI, mất điểm bán, mất giải thưởng | `/scratch/` gitignore + CI B19/B20 + checklist xoá placeholder ở gate P1 |
| R13 | Atlas 512×512 không đủ cho NPC có nhiều `extra` | Phình VRAM | Cắt `extra` trước khi tăng lên 1024. `extra` tối đa 4 |
| R14 | Nền bake quá nặng cho web demo | Demo itch.io lag → mất kênh phát hành chính | 2 mức LOD; ngân sách VRAM 48MB cho web (B21) đo từ tuần 8 |

---

## 8. Truy vết

| Nội dung | `idea.md` | `CANON.md` |
|---|---|---|
| Bảng màu xanh xám + nắng gắt trắng, không vàng nghệ | §19.5 (cảnh báo Ngọc Ánh) | §14 |
| Ghế nhựa, hũ đũa, bảng hiệu đỏ chữ vàng, xe máy sát vách, trầu bà treo | §19.5 (người chơi *Phở Anh Hai*) | §14 |
| Layered sprite 6×6×6 = 216 từ 18 file | §18.6 Đừng-4 | §16 Đừng-4 |
| Rain World: node + spring/lerp, không tốn sprite | §18.6 Đừng-4 | §16 Đừng-4 |
| Celeste: biến dạng 1–2 frame, chênh 1 hàng pixel; Madeline không có mặt | §18.6 Đừng-4 | §16 Đừng-4 |
| Cuphead: >25 phút/frame, ~10h cho 1 giây | §18.6 Đừng-4 | §16 Đừng-4 |
| Artist VN $1.500–2.500/tháng | §23 tuần 3–4 | — |
| Key art hẻm Sài Gòn 6h sáng, "đứng được một mình" | §23 tuần 3–4 | §17 |
| Capsule thuê riêng $800–1.200, đừng để artist chính làm | §23 tuần 9 | — |
| Lằn ranh đỏ: bản đồ tự vẽ, không mua asset pack, không chiến tranh, credits | §19.4 | §14.1 |
| Bà Bảy không tồn tại để bị thương hại | §19.5 | §9 (#1) |
| Rủi ro AI nằm ở asset; ~1.000 → ~8.000 game khai báo gen-AI | §10 | — |
| 95% thoại viết tay, LLM chỉ dùng offline | §10 | §11 |
| Chống twinning 0,2–0,4s | §18.7 | §11 |
| 4 state perception và biểu hiện hình ảnh bắt buộc | §17 | §5 |
| `visibility[HANDS][FRONT_CENTER] = 0.95` | §17 | §5 |
| Engine Phaser 3, 30fps, nền bake `RenderTexture` | §23 | §2 |

---

## 9. Đề xuất sửa CANON

| # | Mục CANON | Hiện tại | Đề xuất | Lý do |
|---|---|---|---|---|
| **C1** | **§16 Đừng-4** | Mô tả kỹ thuật thay thế | Thêm câu số: *"**Ngân sách frame-by-frame của dự án: 0 giờ. Không có ngoại lệ**, kể cả cảnh kết, intro và trailer."* | "Đừng làm" mà không có con số thì sẽ bị xin ngoại lệ "một cảnh thôi". Có con số 0 thì đó là tiêu chí nhị phân, kiểm được (B13) |
| **C2** | **§14 / §16** | — | Thêm: **"Người chơi (cháu cô Ba) không bao giờ được nhìn thấy mặt. Camera sau vai. Người chơi là hai bàn tay."** (áp dụng bài học Madeline) | Đây là quyết định ảnh hưởng **T1** (bạn là người bị nhìn), ảnh hưởng key art, capsule, trailer và ngân sách (~58h). Nó quá nền tảng để nằm ở một doc phase |
| **C3** | **§14.1** | *"Mọi bản đồ, quả địa cầu, poster du lịch, tờ lịch có hình → TỰ VẼ"* | Thêm 3 mục vào danh sách cấm: **quốc kỳ (mặc định không vẽ)**, **nội dung chữ trên loa phường / băng rôn / khẩu hiệu**, **brand thật (logo xe máy, chai tương ớt, lon sữa)** | Ba thứ này cùng loại rủi ro với bản đồ nhưng chưa được liệt kê → artist sẽ vẽ vì chúng "có thật ngoài đời" |
| **C4** | **§14.1** | Lằn ranh đỏ là danh sách | Thêm **cơ chế thi hành**: *"`assets/PROVENANCE.csv` bắt buộc cho mọi asset; CI fail nếu thiếu; RED-LINE REVIEW do một người Việt sống ở VN ký trước mỗi milestone."* | Lằn ranh đỏ dựa vào trí nhớ sẽ bị vi phạm ở tuần 20 khi mọi người mệt. Phải là cơ chế |
| **C5** | **§2** (định danh kỹ thuật) | — | Thêm hàng: **"Gen-AI: KHÔNG có trong bất kỳ asset ship nào (art / nhạc / SFX / VO / thoại). Khai báo Steam: No / No."** | idea §10 nói rõ rủi ro nằm ở asset, và ~8.000 game đã khai báo trong H1/2025 → khai báo "No" là **điểm bán**, không phải hạn chế. Cần nằm ở CANON để mọi doc và mọi hợp đồng dùng chung |
| **C6** | **§14** | Bảng màu nêu bằng lời | Thêm **4 khung giờ + mưa với mã hex**, hoặc trỏ tới `content/art/palette.json` là nguồn sự thật | Hiện mỗi doc có thể tự diễn giải "xanh xám" thành màu khác nhau |
