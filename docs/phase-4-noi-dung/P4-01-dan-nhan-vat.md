# P4-01 — Dàn nhân vật: 12 NPC + cô Ba + người chơi

**Thuộc phase:** P4 — Nội dung
**Phụ thuộc:** `CANON.md` §4 (4 chiều tính cách) · §9 (12 NPC — tên và chỉ số **cố định**) · §11 (kiến trúc thoại) · §12 (trí nhớ & đồn thổi) · §14 + §14.1 (cơ chế Việt Nam & lằn ranh đỏ) · §16 Đừng-1 và Đừng-4 (layered sprite) · P4-02 (lịch 40 ngày) · P4-03 (sự kiện & arc)
**Trạng thái:** **Chốt** phần định danh, chỉ số, đơn hàng quen, lịch sinh hoạt, arc. **Cần đo** số dòng thoại thực tế mỗi NPC sau vertical slice. **Còn mở** 2 chỗ đánh dấu 🟡.

---

## 1. Mục tiêu

Biến 12 dòng bảng của `CANON.md` §9 thành 14 hồ sơ đủ để **artist vẽ được, voice actor đọc được, writer viết được, và lập trình viên nhập JSON được** mà không phải hỏi lại.

- Phục vụ **T1** (khách chấm quá trình): mỗi NPC có một *cách nhìn* riêng — vị trí đứng quen, thói quen bấm điện thoại, hướng mắt — để cùng một lỗi cho ra kết quả khác nhau tuỳ ai đang đứng đó.
- Phục vụ **T2** (món ăn là lựa chọn hội thoại): mỗi NPC có **đơn hàng quen** (nói ra) và **khẩu vị ẩn** (không bao giờ nói ra). Khẩu vị ẩn chính là "câu thoại" mà người chơi được phép nói bằng tay.
- Phục vụ **T3** (không hiện chỉ số): mọi thứ người chơi biết về quan hệ phải đến từ hồ sơ này — mặt, lời, dáng, thứ tự đến — không đến từ một con số nào.
- Phục vụ **T4** (một mùa có điểm kết): mỗi NPC có arc 40 ngày **có kết**, không có ai lơ lửng.
- Thi hành `idea.md` §19.5 (chống rập khuôn) ở mức **bắt buộc**, không phải mức "nên".

---

## 2. Cơ chế

### 2.0. Luật viết hồ sơ (áp dụng cho cả 14 người)

| Luật | Nội dung | Vì sao |
|---|---|---|
| **L1** | **Tên và 4 chỉ số là bất biến.** Lấy nguyên từ `CANON.md` §9. Doc này không được sửa, doc khác cũng không | Chỉ số đã được cân với công thức `traitMul` ở §5 |
| **L2** | **Mỗi người phải có đúng một "thứ không liên quan tới nghề hay hoàn cảnh"** | `idea.md` §19.5 — chống rập khuôn. Không có mục này thì hồ sơ bị trả lại |
| **L3** | **Không ai trong hẻm được định nghĩa bằng sự thiếu thốn** | §14.1 "hạ thấp nghề". Nghèo có thể là *hoàn cảnh*, không được là *tính cách* |
| **L4** | **Không một chữ về chiến tranh.** Không hồi tưởng, không "hồi đó", không đạo cụ gợi nhắc | §14.1 — lằn ranh đỏ tuyệt đối |
| **L5** | **Đừng-1:** không mô phỏng đời sống NPC ngoài quầy. Chuyện nhà họ **được NÓI RA + một prop hình ảnh**, không được simulate | §16 Đừng-1 (Jeff Orkin) |
| **L6** | Mọi hồ sơ phải trả lời được: *"Nếu người chơi làm sai trước mặt người này, chuyện gì xảy ra trong 3 ngày tới?"* | Đây là toàn bộ giá trị của game |

### 2.1. Khung dựng hình cho artist — layered sprite (§16 Đừng-4)

Không frame-by-frame. Mỗi NPC là một **bộ lớp**:

```
npc_<id>/
  base_body.png        1 file   — thân + trang phục, tư thế trung tính
  head_base.png        1 file   — đầu + tóc + tai
  brow_01..06.png      6 file   — lông mày
  eye_01..06.png       6 file   — mắt (gồm 1 trạng thái "liếc xuống tay người chơi")
  mouth_01..06.png     6 file   — miệng
  prop_a / prop_b      0–3 file — đạo cụ nhận dạng (xem từng hồ sơ)
```

→ **18 file ảnh = 216 trạng thái mặt.** Chuyển động thân dùng kỹ thuật Rain World: 4 node (đầu / ngực / tay trái / tay phải) + spring/lerp → nghiêng người, nhún vai, chồm tới xem, lùi ra xa. **Không tốn thêm sprite.**

**Bảng màu:** mọi NPC phải đứng được trong bảng **xanh xám + nắng gắt trắng** của Sài Gòn buổi sáng (§14). Không ai mặc màu vàng nghệ. Màu nhận dạng của từng người ghi trong hồ sơ.

**Ba trạng thái mắt bắt buộc có ở mọi NPC** (vì hệ perception đọc chúng):
`eye_gaze_hands` (nhìn tay) · `eye_gaze_face` (nhìn mặt) · `eye_gaze_phone` (nhìn điện thoại/vé số/sổ).

### 2.2. Cách đọc mục "hệ quả cụ thể của chỉ số"

4 chiều của §4 là số trừu tượng. Mỗi hồ sơ dịch chúng ra **hành vi nhìn thấy được**:

| Chiều | Cao nghĩa là | Thấp nghĩa là | Nơi người chơi thấy |
|---|---|---|---|
| `soi` | `traitMul` lớn → `certainty` lên nhanh | Nhìn mà không thấy | Tốc độ NPC chuyển `GLIMPSED → NOTICED` |
| `nongTinh` | Nói to, nói ngay | Im, ghi nhớ, xử sau | Âm lượng bark, có bark hay không |
| `deTha` | Memory decay nhanh | Nhớ dai, hạ trần tin tưởng | Ngày thứ 3 sau lỗi họ còn nhắc không |
| `thanThien` | Quan hệ lên nhanh + lan tin mạnh | Chậm thân, ít kể | Số hop tin đồn xuất phát từ người này |

---

## 2.A. HỒ SƠ 12 NPC

---

### NPC-01 · **BÀ BẢY** — bán vé số

> ⚠️ **Nhân vật nguy hiểm nhất trong game.** `idea.md` §19.5: *"trong mọi media về VN, bà ấy tồn tại để người xem thương hại."* Hồ sơ này được viết với một luật riêng: **bà Bảy không bao giờ ở trong cảnh mà cảm xúc chính là thương hại.** Nếu một dòng thoại của bà làm người chơi muốn cho tiền — dòng đó bị cắt.

| | |
|---|---|
| **Tuổi** | 71 |
| **Nghề** | Bán vé số dạo, đi vòng 4 hẻm quanh khu, mỗi ngày ~150 tờ |
| **Nơi ở** | Nhà trong hẻm nhánh, cách xe 60m, **ngay đối diện nhà cô Ba** — đó là lý do mối bất hoà 15 năm không né được |
| **Chỉ số** | `soi 0.9` / `nongTinh 0.6` / `deTha 0.8` / `thanThien 0.7` |

**Ngoại hình (cho artist).** Nhỏ người, lưng hơi còng nhưng **đi nhanh** — đây là chi tiết chống-thương-hại quan trọng nhất: bà đi nhanh hơn mọi người trong hẻm. Áo bà ba màu **tím than bạc màu** (mã `#5B5470`), quần đen, dép lê quai hậu. Tóc búi thấp, kẹp ba lá. Màu nhận dạng: **tím than**.
- `prop_a`: xấp vé số cầm ở tay trái, **quạt ra như quạt bài** — động tác này là chữ ký hình ảnh của bà.
- `prop_b`: **tai nghe có dây, một bên nhét tai, một bên thả** — đang nghe cải lương. Người chơi sẽ mất ~5 ngày mới hiểu bà nghe gì.
- `prop_c`: túi vải đeo chéo, cũ nhưng **sạch và được vá cẩn thận** (không rách — vá cẩn thận ≠ nghèo khổ).
- Mắt: bộ `eye` của bà cần 1 trạng thái riêng — **"nheo mắt nhìn tay từ xa"**, vì bà nhận ra lỗi từ vị trí `QUEUE_3` (soi 0.9).

**Hệ quả cụ thể của từng chỉ số:**

| Chỉ số | Hệ quả trong game với bà Bảy |
|---|---|
| `soi 0.9` (cao nhất hẻm) | `traitMul` = **1.28** (CANON §4: `0.65 + 0.70·soi`). Bà **bắt được `DIRTY_HANDS` ngay cả từ `QUEUE_3`** — nơi visibility chỉ 0.20. Bà là NPC duy nhất làm được vậy. Người chơi học được rằng khoảng cách không cứu mình |
| `nongTinh 0.6` | Bà **nói ra**, nhưng nói kiểu nửa đùa, không gắt: *"Ờ tay con dơ kìa."* Có bark, âm lượng trung bình, không làm khách khác quay đầu |
| `deTha 0.8` | Memory decay nhanh. Hôm sau bà **không nhắc lại**. → Đây là lý do bà là **NPC an toàn để học luật**: bị bắt lỗi nhưng không bị phạt kéo dài |
| `thanThien 0.7` | Bà kể lại — nhưng vì `deTha` cao, tin bà kể **đã mất cạnh sắc**: *"con nhỏ đó nó làm gì đó tui quên rồi, mà nó dễ thương"* |

**Đơn hàng quen (`REMEMBERED_USUAL`).** Nguyên văn:
> *"Cho bà ổ thịt, ít rau thôi con, bà nhai không nổi."*

Thực tế bà **không gọi mỗi ngày** — bà mua thứ Hai, thứ Tư, thứ Sáu. Ngày khác bà chỉ đi ngang, chào.

**Khẩu vị ẩn (không bao giờ nói ra):**
1. **Bánh phải nướng lại cho giòn vỏ nhưng ruột mềm** — bà nhai không nổi vỏ cứng, nhưng bà sẽ không bao giờ than. Nếu đưa bánh nguội, bà vẫn cảm ơn, ăn được nửa ổ, và **phần còn lại người chơi sẽ thấy trong sọt rác cuối hẻm hôm sau**.
2. **Không ớt.** Bà chưa từng nói. Bà chỉ gỡ ra, từ tốn, đặt lên tờ giấy gói.
3. **Cắt đôi.** Bà ăn nửa buổi sáng, nửa buổi trưa. Người chơi cắt đôi và gói riêng hai nửa → `REMEMBERED_USUAL` bắn với salience đầy đủ.

**Lịch sinh hoạt:**

| Ngày | Giờ | Ghi chú |
|---|---|---|
| T2 · T4 · T6 | **6h20** — người đầu tiên trong ngày | Bà **là "mở hàng" mặc định** của cả mùa (xem P4-05 §2.1) |
| T3 · T5 | ~7h50, chỉ đi ngang, không mua | Vẫn nhận `CARED_FOR_THEM` nếu được mời ly trà đá |
| T7 | 6h20, mua **hai ổ** | Ổ thứ hai bà không ăn. Xem mốc arc M2 |
| CN | **Không xuất hiện** | 🟡 Lý do được giữ kín tới ngày 21 |
| Lệch lịch | Ngày mưa to: bà tới **trễ 25–40 phút**, áo ướt vai. Ngày 18 và ngày 35: bà **không tới** (xem arc) |

**Arc 40 ngày — "Bà Bảy và cái radio":**

| Mốc | Ngày | Chuyện gì xảy ra |
|---|---|---|
| **M1 — Cái tai nghe** | ~**Ngày 6** | Người chơi đưa ly trà đá đúng lúc bà đang nghe. Bà **rút tai nghe ra đưa cho người chơi một bên**, không nói gì. Trong tai nghe: một đoạn vọng cổ. Từ đây `prop_b` có ý nghĩa. Không có UI nào giải thích |
| **M2 — Ổ thứ hai** | ~**Ngày 13** (T7) | Người chơi nhận ra bà mua 2 ổ vào thứ Bảy nhưng chỉ ăn 1. Nếu người chơi **gói riêng hai ổ khác nhau** (một ít rau cho bà, một đầy đủ), bà lặng một giây rồi nói: *"Con này khôn."* Ổ kia là cho cô Ba — **bà vẫn gửi bánh cho người bà không nói chuyện suốt 15 năm** |
| **M3 — Cái bất hoà** | ~**Ngày 21** | Cả hẻm chuẩn bị buổi đờn ca tài tử ở sân đình (P4-03 SK-24). Bà Bảy không đi. Cô Ba cũng không đi. **Không ai giải thích.** Bé Su là người duy nhất hỏi thẳng và bị cả hai lơ |
| **M4 — Ngày 35** | **Ngày 35** | Bà không tới. Không báo. Không phải vì bệnh — hôm sau bà tới bình thường, tay cầm một tờ chương trình cải lương ở nhà hát. **Bà đi coi hát.** Đó là chỗ tiền vé số của bà đi tới. Đây là chi tiết chống-thương-hại mạnh nhất của cả game |
| **M5 — Kết** | **Ngày 40** | Bà tới sớm nhất, mở hàng lần cuối. Bà **tự nhắc giá cao hơn** rồi tự cười (xem P4-05, achievement *"Quen mặt đắt hàng"*). Bà không nói lời chia tay. Bà nói: *"Mai bà lại mua nghen."* Và điều đó có thể đúng |

**Thứ hoàn toàn không liên quan tới nghề hay hoàn cảnh (bắt buộc — L2):**
> **Bà Bảy mê cải lương tới mức thuộc lòng.** Bà theo dõi các bản dựng khác nhau của *Đời cô Lựu* và *Lan và Điệp*, và bà có ý kiến gay gắt về việc "đào bây giờ ca không có hơi". Mỗi vài tháng bà đi coi một suất ở nhà hát — **mua vé đàng hoàng, ngồi ghế đàng hoàng**. Bà nghe bằng tai nghe có dây suốt ngày đi bán.
>
> **Và:** bà có mối bất hoà 15 năm với cô Ba. **Sự thật nội bộ — KHÔNG BAO GIỜ HIỆN TRONG GAME:** năm đó hai người cùng trong nhóm đờn ca tài tử của hẻm; bà Bảy được phân vai đào chánh cho buổi cúng đình, rồi **tự ý đổi bài đã tập chung** vì bà thấy bài kia hợp hơi bà hơn. Cô Ba đàn kìm cho bà, bị hụt nhịp trước cả xóm. Chuyện nhỏ tới mức buồn cười. Hai người không ai chịu nhắc lại, và **game cũng không nhắc lại**. Người chơi chỉ thấy: hai bà không nói chuyện, nhưng bà Bảy vẫn mua ổ bánh thứ hai vào thứ Bảy.

**Vai trò trong hệ gossip:** **nút trung bình-mạnh, độ chính xác THẤP.**
- Bà tiếp xúc nhiều người nhất hẻm (đi bán dạo) → `spread_reach` cao.
- Nhưng `deTha 0.8` làm tin bà kể **mất intensity nhanh**: `mutation_rate` cho `ORDER_DEFECT` khi qua bà chỉ 0.18 (so với mức nền 0.35).
- **Bà kể cho:** cô Mai (mỗi ngày, đứng ở tạp hoá), bà Sáu (gặp giữa hẻm), thầy Phúc (buổi chiều).
- **Bà KHÔNG kể cho:** cô Ba (không nói chuyện), chú Kiệt (bà không ưa, xem SK-11).
- Đặc quyền duy nhất: **tin tốt qua bà thì phóng đại thêm**, đúng luật §12 "tin tốt lan mạnh hơn tin xấu". Bà là cỗ máy PR của người chơi.

**3–5 câu thoại đặc trưng (giọng miền Nam, cho VA):**
1. *"Cho bà ổ thịt, ít rau thôi con, bà nhai không nổi."* — nhịp chậm, hơi khàn, cuối câu nhẹ hẫng.
2. *"Ờ... tay con dơ kìa."* — **không gắt, hơi buồn cười**. Đây là dòng dạy luật vệ sinh đầu tiên của cả game. VA phải đọc nó như đang nhắc cháu, không như đang bắt lỗi.
3. *"Con nhỏ này làm ăn được à nghen."* — lên giọng ở chữ "được", dùng khi `REMEMBERED_USUAL`.
4. *"Bà nói thiệt, đào bây giờ ca không có hơi."* — đột ngột, không ăn nhập gì, giữa lúc người chơi đang làm bánh. **Đây là dòng hay nhất của nhân vật.**
5. *"Mai bà lại mua nghen."* — dòng ngày 40. Đọc bình thường. Tuyệt đối không đọc kiểu chia tay.

---

### NPC-02 · **CHÚ TƯ** — bảo vệ công ty

| | |
|---|---|
| **Tuổi** | 54 |
| **Nghề** | Bảo vệ ca ngày cho một công ty in ở đường lớn, cách hẻm 1,2km |
| **Nơi ở** | Nhà thuê cuối hẻm, ở với vợ; con gái lấy chồng ở Long An |
| **Chỉ số** | `soi 0.3` / `nongTinh 0.3` / `deTha 0.9` / `thanThien 0.6` |

**Ngoại hình.** Cao vừa, bụng hơi phệ, dáng đứng thẳng vì nghề. **Đồng phục bảo vệ xanh đen** (`#2E3A52`), phù hiệu bên ngực, giày đen bóng — **giày lúc nào cũng được lau**, chi tiết này quan trọng: chú tự trọng về nghề. Tóc cắt ngắn, hớt cao, hơi hoa râm hai bên. Màu nhận dạng: **xanh đen đồng phục**.
- `prop_a`: **nón bảo vệ cầm ở tay**, không đội khi ăn.
- `prop_b`: **lồng chim phủ vải** — chỉ xuất hiện sáng Chủ Nhật. Đây là prop tiết lộ nhân vật.
- `prop_c`: bình nước nhựa 1,5 lít nhét túi quần sau.
- Mắt: `eye_gaze_face` là mặc định của chú — **chú nhìn mặt người chơi, không nhìn tay**. Đó là `soi 0.3` được vẽ ra.

**Hệ quả cụ thể của từng chỉ số:**

| Chỉ số | Hệ quả trong game với chú Tư |
|---|---|
| `soi 0.3` | `traitMul` = **0.86**. Chú **hầu như không bắt được lỗi ở quầy**. Nhưng `ORDER_DEFECT` vẫn nổ ở **tầng delivery-diff** (§6) khi chú cắn miếng đầu → luôn ra biến thể `DISCOVERED`, không bao giờ `ANTICIPATED`. Cái đau riêng của chú: chú không thấy mình bị lừa, chú chỉ thấy bánh hôm nay không ngon |
| `nongTinh 0.3` | Không bao giờ to tiếng. Phản ứng mạnh nhất của chú là **im rồi gật đầu** |
| `deTha 0.9` (cao nhất hẻm) | Decay cực nhanh. **Chú là lưới an toàn của người chơi mới.** Sai với chú gần như không có hậu quả dài hạn — cho tới ngày 30, khi hoá ra hậu quả dài hạn là thứ khác hẳn |
| `thanThien 0.6` | Chú kể chuyện nhà đều đặn (đây là nguồn `REMEMBERED_STORY` chính của Hồi 1) nhưng **không lan tin xấu về người chơi** |

**Đơn hàng quen (`REMEMBERED_USUAL`).** Nguyên văn:
> *"Như mọi bữa nghen con."*

Chú là **NPC dạy người chơi câu "như mọi bữa"**. Ngày 1 chú nói đầy đủ: *"Cho chú ổ đầy đủ, nhiều ớt, cho xin bịch."* Từ ngày 4 trở đi chú rút gọn thành "như mọi bữa". Nếu người chơi làm đúng → `REMEMBERED_USUAL` salience 90.

Cụ thể "như mọi bữa" = **ổ đầy đủ · nhiều ớt · nhiều đồ chua · gói giấy + bịch nilon riêng · KHÔNG ăn tại chỗ**.

**Khẩu vị ẩn:**
1. **Chú thích cay thật, không phải cay xã giao.** Bỏ 5 khoanh ớt thay vì 3 → chú không nói gì, nhưng hôm sau chú tới sớm hơn 3 phút.
2. **Chú cần bịch nilon RIÊNG, không phải gói chung** — vì chú treo lên móc xe máy. Gói chung → bánh bị ép, chú vẫn ăn, vẫn cảm ơn, và `ORDER_DEFECT` ngầm cộng vào `silentScore`.
3. **Từ ngày 22, khẩu vị ẩn đổi:** chú bắt đầu **bớt ớt**. Chú không nói. Nếu người chơi vẫn bỏ nhiều ớt, chú vẫn ăn. Nếu người chơi **tự bớt**, chú nhìn lên một giây. → Xem arc M2, đây là tín hiệu báo trước đầu tiên và tinh vi nhất.

**Lịch sinh hoạt:**

| Ngày | Giờ | Ghi chú |
|---|---|---|
| **T2 → T6** | **6h45**, sai số ±3 phút | Đồng hồ sống của người chơi. Chú là NPC dạy `MADE_THEM_WAIT` *ngược*: chú không giận khi chờ, nhưng chú **trễ ca**, và hôm sau chú nói ra |
| T7 · CN | **Không tới** | CN chú ở nhà với con chim |
| Lệch lịch | Mưa: chú tới **sớm hơn 5 phút** (đi sớm cho kịp). Ngày 26, 29: **tới 7h10** — trễ 25 phút, không giải thích ngay |

**Arc 40 ngày — "Chú Tư và công ty dời chỗ":**

> **Đây là arc chịu trách nhiệm thi hành phanh #1 của phán quyết XĐ3** (`idea.md` §17): *báo trước 3–4 ngày*. Chi tiết tín hiệu từng ngày nằm ở **P4-02 §2.5**. Ở đây chỉ ghi mốc.

| Mốc | Ngày | Chuyện gì xảy ra |
|---|---|---|
| **M1 — Cái đồng hồ** | Ngày 1–20 | Chú là hằng số. 6h45. Mỗi ngày. Người chơi **bắt đầu chuẩn bị ổ của chú từ 6h42** — đây là khoảnh khắc game dạy xong bài "dự báo cầu" (§13.2) mà không có tutorial nào |
| **M2 — Bớt ớt** | **Ngày 22** | Chú lần đầu bớt ớt. Không nói lý do. (Lý do thật: chú đi khám, men gan cao. Chú **không bao giờ nói ra trong game** — người chơi chỉ có thể suy ra từ việc chú cũng bỏ nhậu chiều với ông Hải từ ngày đó) |
| **M3 — Than chuyện công ty** | **Ngày 26** | *"Công ty chú nó tính dời qua bên Bình Dương đó con."* Nói một lần, giọng bình thường, rồi đổi chủ đề. **Không có prompt, không có dấu chấm than trên đầu.** |
| **M4 — Mua ít đi** | **Ngày 29** | Chú mua **nửa ổ**. Lần đầu trong 29 ngày. *"Bữa nay chú ăn ít."* Đây là tín hiệu cuối |
| **M5 — Ghế trống** | **Ngày 30** | 6h45. Không ai tới. 6h50. 7h00. **Game không nói gì cả.** Sổ tay cuối ngày của cô Ba: *"Bữa nay chú Tư không ghé."* Hết |
| **M6 — Hộp bánh** | **Ngày 33** | Vợ chú ghé một lần duy nhất, mua 2 ổ, nói: *"Ổng gửi lời hỏi thăm con. Ổng đi làm xa, sáu giờ đã phải ra bến xe rồi."* Đây là **lời giải thích duy nhất** người chơi nhận được. Nó đủ |
| **M7 — Kết** | **Ngày 40** | Chú **không quay lại**. Đây là chủ ý. Chỉ một người quay lại ngày 40 (chị Lan), và sự quý giá của cú quay lại đó đến từ việc những người khác thì không |

**Thứ hoàn toàn không liên quan tới nghề hay hoàn cảnh (L2):**
> **Chú Tư chơi chim chào mào.** Chú có một con tên **"Sáu Ngón"** (vì hồi mới mua chú đếm nhầm), đi thi hót ở câu lạc bộ trong quận mỗi tháng một lần. Chú nói về giọng chim bằng thuật ngữ mà người chơi không hiểu — *"nó đổ bốn, năm giọng"*, *"con này ché hay mà nết chưa già"* — và chú **không giải thích**, vì chú giả định ai cũng biết. Chú thua hoài. Chú vẫn đi.
> Prop Chủ Nhật (`prop_b`) là cái lồng phủ vải — nhưng **Chủ Nhật chú không ghé xe**, nên người chơi chỉ thấy nó **một lần duy nhất**, ở SK-24 (buổi đờn ca tài tử). Đó là lý do nó đáng nhớ.

**Vai trò trong hệ gossip:** **nút YẾU, độ chính xác CAO.**
- `thanThien 0.6` + `deTha 0.9` → chú kể ít, và kể đúng. `mutation_rate` qua chú = **0.10** (thấp nhất hẻm).
- **Chú kể cho:** ông Hải (nhậu chiều, tới ngày 22), anh Dũng (gặp ở đầu hẻm).
- **Giá trị thiết kế:** chú là **nguồn tin sạch**. Khi người chơi nghe một tin qua chú Tư, tin đó đúng. Cả hệ gossip cần đúng một nút như vậy để người chơi có cơ sở so sánh.

**3–5 câu thoại đặc trưng:**
1. *"Như mọi bữa nghen con."* — nhanh, gọn, không nhìn lên. Đây là câu được nghe nhiều nhất game.
2. *"Cho chú nhiều ớt. Ớt mà, ăn cho nó tỉnh."* — cười nhẹ ở cuối.
3. *"Con này nó nhớ chú ăn gì nè. Giỏi."* — nói với **người bên cạnh**, không nói với người chơi. `REMEMBERED_USUAL` của chú Tư là một lời khoe, không phải một lời cảm ơn.
4. *"Công ty chú nó tính dời qua bên Bình Dương đó con."* — **VA chú ý: đọc câu này như đang than thời tiết.** Nếu đọc nặng, cả phanh XĐ3 sụp: người chơi biết ngay là cutscene.
5. *"Bữa nay chú ăn ít."* — ngày 29. Ngắn hơn bình thường nửa nhịp.

---

### NPC-03 · **ANH DŨNG** — tài xế Grab (trước là xe ôm truyền thống)

> `idea.md` §19.5: *"Chú xe ôm → Grab: câu chuyện thật của 10 năm qua. Khai thác."* Arc của anh Dũng là **arc kinh tế hiện đại duy nhất** trong dàn, và nó không được bi kịch hoá.

| | |
|---|---|
| **Tuổi** | 41 |
| **Nghề** | Tài xế Grab (2 bánh + giao hàng). Trước 2017 là xe ôm đứng ở đầu hẻm 11 năm |
| **Nơi ở** | Nhà trong hẻm, tầng trệt, có con gái 9 tuổi và con trai 4 tuổi |
| **Chỉ số** | `soi 0.2` / `nongTinh 0.5` / `deTha 0.7` / `thanThien 0.5` |

**Ngoại hình.** Người rắn, da sạm nửa mặt (đeo khẩu trang chạy nắng → **ranh giới da rõ ở gò má** — chi tiết này artist phải vẽ, nó kể cả nghề nghiệp lẫn 10 năm). Áo khoác đồng phục xanh lá, mũ bảo hiểm **cầm tay chứ không bao giờ để xuống đất**. Màu nhận dạng: **xanh lá đồng phục** — và đây là điểm mấu chốt: **ngày 1–3, artist vẽ anh mặc áo khoác gió cũ màu nâu đất, KHÔNG phải đồng phục.** Anh mới chuyển hẳn.
- `prop_a`: **hai điện thoại** — một kẹp trên giá xe, một cầm tay. App lúc nào cũng sáng.
- `prop_b`: **túi giữ nhiệt giao hàng** đeo sau lưng.
- `prop_c`: 🟡 **hũ nhựa nhỏ trong cốp** — xuất hiện từ ngày 12. Xem L2.
- Dáng: node thân của anh có **một trạng thái riêng: "một chân vẫn gác lên xe"**. Anh gần như không bao giờ xuống xe hẳn.

**Hệ quả cụ thể của từng chỉ số:**

| Chỉ số | Hệ quả trong game với anh Dũng |
|---|---|
| `soi 0.2` (thấp nhất trong nhóm người lớn) | `traitMul` = **0.79** — thấp nhất dàn. Anh **không thấy gì hết** — mắt anh ở trên điện thoại. Nhưng đây là bẫy: anh không chấm *quá trình*, anh chấm **thời gian** |
| `nongTinh 0.5` | Anh **thở dài nghe thấy được**, gõ ngón tay lên yên xe. Cường độ trung bình. Anh không chửi, anh **huỷ chờ** |
| `deTha 0.7` | Tha nhanh nếu lần sau nhanh. Nhưng `MADE_THEM_WAIT` với anh tạo memory `intensity` cao hơn người khác **1.4×** — vì mỗi phút chờ của anh là tiền thật |
| `thanThien 0.5` | Trung tính. Anh kể cho đồng nghiệp tài xế (**ngoài màn hình** — đây là cách game có gossip "ngoài hẻm" mà không phải mô phỏng, đúng §16 Đừng-1) |

**Đơn hàng quen (`REMEMBERED_USUAL`).** Nguyên văn:
> *"Ổ xíu mại, gói lẹ giùm anh, anh có cuốc."*

**Khẩu vị ẩn:**
1. **Anh không cần bánh ngon, anh cần bánh CẦM ĐƯỢC MỘT TAY.** Gói chặt, gấp đầu giấy vào — anh ăn khi dừng đèn đỏ. Gói lỏng → bánh rơi nhân vào lòng. Anh không quay lại than. `silentScore` cộng ngầm.
2. **Không nước sốt nhiều.** Anh chưa từng nói. Anh chỉ **lau tay vào quần** — người chơi thấy được.
3. **Anh thích trà đá hơn bánh.** Đưa ly trà đá đúng lúc anh vừa dừng xe → `CARED_FOR_THEM` (50) và `gazeFactor` của anh tụt xuống 0.05 trong 3 giây — **anh là NPC tốt nhất để tập kỹ thuật hạ attention** (§5.4) trong Hồi 1.

**Lịch sinh hoạt:**

| Giai đoạn | Giờ | Ghi chú |
|---|---|---|
| **Ngày 1–17** | **7h20 ± 12 phút**, mọi ngày kể cả T7/CN | Giờ của anh **không cố định** — đối lập có chủ ý với chú Tư. Người chơi không thể chuẩn bị trước cho anh, chỉ có thể phản ứng nhanh |
| **Ngày 18–40** | **19h40 ± 20 phút** — ca đêm | Anh biến mất khỏi buổi sáng. **Không phải mất — chuyển.** Nếu người chơi có mở ca tối (upgrade đèn, xem P4-02), anh vẫn là khách |
| Lệch lịch | Mưa: anh tới **đông hơn** (mưa = nhiều cuốc giao đồ ăn = anh chạy ngang nhiều hơn). **Anh là NPC duy nhất mà mưa làm TĂNG tần suất** — dùng để bịt lỗ hổng (c) ở §8 |

**Arc 40 ngày — "Anh Dũng đổi ca":**

| Mốc | Ngày | Chuyện gì xảy ra |
|---|---|---|
| **M1 — Cái áo** | **Ngày 3** | Anh tới, lần đầu mặc đồng phục xanh. Chú Tư chọc: *"Ê, đầu quân rồi hả Dũng?"* Anh cười: *"Đứng đầu hẻm giờ ai kêu nữa anh Tư."* **Đây là toàn bộ 10 năm, gói trong hai câu.** Không có flashback, không có monologue |
| **M2 — App khoá** | **Ngày 11** | Anh tới, không gọi món, ngồi im 40 giây nhìn điện thoại. Tài khoản anh bị khoá tạm 24h do khách "bom hàng" báo xấu. Anh **không kể** nếu người chơi không đưa trà đá. Nếu đưa → anh kể, và mở khoá `REMEMBERED_STORY` của anh cho cả mùa |
| **M3 — Báo trước** | **Ngày 15, 16, 17** | Xem P4-02 §2.5. Tóm tắt: ngày 15 anh hỏi *"quán em mấy giờ dọn?"*; ngày 16 anh tới trễ hơn mọi khi 25 phút, mắt đỏ; ngày 17 anh nói thẳng *"chắc anh chạy đêm, ngày đông tài xế quá."* |
| **M4 — Ca đêm** | **Ngày 18** | 7h20 không có anh. **Người chơi ĐÃ được báo.** Nếu người chơi mở ca tối (upgrade bóng đèn + bình giữ nhiệt, mua được từ ngày 14) → 19h40 anh tới. Nếu không → anh mất hẳn khỏi game cho tới ngày 34 |
| **M5 — Cuốc cuối** | **Ngày 34** | Anh ghé ban ngày một lần, không chạy app, chở **con gái** đi học. Con bé gọi món: *"Cho con ổ như ba."* Lần duy nhất trong game có trẻ con gọi món thay người lớn |
| **M6 — Kết** | **Ngày 40** | Anh tới, tắt app, **để mũ bảo hiểm xuống ghế nhựa** — lần đầu tiên trong 40 ngày anh để mũ xuống. Ngồi ăn tại chỗ |

**Thứ hoàn toàn không liên quan tới nghề hay hoàn cảnh (L2):**
> **Anh Dũng nuôi cá lia thia (cá betta).** Anh có một kệ 14 hũ ở nhà, anh lai giống, và anh bán trên một nhóm Facebook với giá mà người chơi sẽ ngạc nhiên. Anh nói về màu cá — *"con này koi galaxy nè, cái đuôi nó lên tới ba màu"* — với đúng cái nhiệt tình mà anh **không** có khi nói về chạy xe. Từ ngày 12, `prop_c` (hũ nhựa nhỏ trong cốp) xuất hiện: anh đang đi giao một con cá cho khách, tiện đường.
> **Luật thi hành:** không bao giờ để anh nói *"nuôi cá kiếm thêm"*. Anh nuôi cá vì anh thích cá.

**Vai trò trong hệ gossip:** **nút HƯỚNG RA NGOÀI.**
- Anh là NPC duy nhất mang tin **ra khỏi hẻm** và mang tin **từ ngoài hẻm vào**.
- Cơ chế: anh không kể cho NPC nào trong danh sách. Thay vào đó, từ ngày 20, **khách vãng lai vô danh** bắt đầu xuất hiện với dòng: *"Nghe mấy ông tài xế nói ở đây bánh mì được lắm."* — đó là output của anh Dũng.
- `mutation_rate` qua anh: 0.28. Tin đồn đi ra rồi quay về **đã mất tên người chơi** nhưng giữ nguyên nội dung.
- **Đây là cách game thưởng cho danh tiếng mà không cần một thanh progress nào** (§19.2).

**3–5 câu thoại đặc trưng:**
1. *"Ổ xíu mại, gói lẹ giùm anh, anh có cuốc."* — nói trong lúc vẫn nhìn điện thoại. Nhanh, không thô.
2. *"Đứng đầu hẻm giờ ai kêu nữa anh Tư."* — cười, nhún vai. **Không được đọc cay đắng.** Đây là câu quan trọng nhất về lằn ranh "hạ thấp nghề".
3. *"Thôi khỏi, anh đứng đây ăn cũng được."* — khi người chơi định gói. Dấu hiệu anh đang có một ngày dễ thở.
4. *"Con này koi galaxy nè, cái đuôi nó lên tới ba màu."* — đột nhiên rất hào hứng. Đổi hẳn tông giọng. VA cần đọc như người khác.
5. *"Chắc anh chạy đêm. Ngày giờ đông tài xế quá."* — ngày 17. Bình thản. **Không thở dài.**

---

### NPC-04 · **CHỊ LAN** — nhân viên văn phòng

> **NPC quan trọng nhất về mặt cảm xúc của cả game.** Chị là "người im lặng biến mất" (XĐ3) và là người **quay lại ngày 40**. Xem P4-04 §2.2 để có cảnh chi tiết.

| | |
|---|---|
| **Tuổi** | 33 |
| **Nghề** | Nhân viên phòng kế hoạch, công ty xây dựng ở quận 1 |
| **Nơi ở** | Thuê căn hộ dịch vụ ở hẻm bên, đi bộ ngang xe mỗi sáng |
| **Chỉ số** | `soi 0.9` / `nongTinh 0.1` / `deTha 0.2` / `thanThien 0.3` |

**Ngoại hình.** Gọn, áo sơ mi màu nhạt (trắng ngà / xanh phấn `#C7D3DC`), quần tây, giày bệt cầm ở túi và **mang dép đi bộ ra tới xe rồi mới đổi** — chi tiết nhỏ, rất Sài Gòn, rất chị. Tóc buộc thấp. Màu nhận dạng: **xanh phấn nhạt**.
- `prop_a`: **thẻ nhân viên đeo dây, bị lật mặt sau** — không bao giờ đọc được tên công ty.
- `prop_b`: túi tote vải, trong có **cuộn len và một cây kim móc** — chỉ thấy khi chị lục túi tìm tiền lẻ. Người chơi phải **tự để ý**.
- Mắt: chị cần bộ `eye` chính xác nhất dàn. `eye_gaze_hands` của chị **không chớp**. Đó là cách `soi 0.9` + `nongTinh 0.1` được vẽ: chị thấy hết và không nói gì.

**Hệ quả cụ thể của từng chỉ số:**

| Chỉ số | Hệ quả trong game với chị Lan |
|---|---|
| `soi 0.9` | `traitMul` = **1.28**, ngang bà Bảy. Chị bắt được mọi thứ. **Nhưng khác bà Bảy ở chỗ chị không nói.** Cặp bà Bảy / chị Lan là bài học thiết kế lớn nhất của game: *cùng một mức "thấy", hai kết quả hoàn toàn khác* |
| `nongTinh 0.1` (thấp nhất hẻm) | **Gần như không bao giờ có bark.** Rơi vào đúng 35% "nhận thấy mà không nói gì" của §11. Với chị, tỉ lệ đó là **~85%**. Biểu hiện duy nhất: một nhịp ngừng, mắt hạ xuống rồi ngẩng lên |
| `deTha 0.2` (thấp nhất hẻm) | Memory **gần như không decay**. Lỗi ngày 6 còn nguyên ở ngày 30. Đây là nguồn duy nhất của cảm giác *"mình đã làm gì sai từ lâu rồi"* |
| `thanThien 0.3` | Chậm thân. Nhưng — nghịch lý chủ ý — **chị là nút lan tin MẠNH NHẤT** (CANON §9). Xem mục gossip |

**Đơn hàng quen (`REMEMBERED_USUAL`).** Nguyên văn:
> *"Cho em ổ chả lụa, không ớt, không hành. Gói mang về."*

Chị gọi **giống hệt nhau, từng chữ, 23 ngày liền**. Sự bất biến đó chính là cách game cho người chơi biết chị đã đổi, khi chị đổi.

**Khẩu vị ẩn:**
1. **Chị đếm.** Chị không nói, nhưng chị biết hôm nay có 4 lát chả hay 3 lát. `soi 0.9` áp dụng cho cả món ăn, không chỉ cho tay người chơi. → **Đây là NPC bịt lỗ hổng (g)** ở §8 (micro-cheat lặp vô hạn): ăn bớt với chị Lan bị phát hiện **ở lần thứ 2**, không phải lần thứ N.
2. **Chị muốn đồ chua ráo nước.** Không bao giờ nói. Nếu ướt, gói giấy thấm, chị cầm bằng hai ngón tay. Người chơi thấy được.
3. **Khẩu vị ẩn thật sự của chị không nằm ở bánh.** Nằm ở chỗ: **chị muốn được gọi đúng tên mà không phải nhắc.** `WRONG_NAME` (salience 100, bỏ qua `gazeFactor`) với chị Lan là sự kiện tàn phá nhất trong game — nó **hạ trần tin tưởng vĩnh viễn** (§8 mục d) và là nguyên nhân số một khiến chị biến mất sớm.

**Lịch sinh hoạt:**

| Ngày | Giờ | Ghi chú |
|---|---|---|
| **T2 → T6** | **7h05 ± 2 phút** | Còn đúng giờ hơn chú Tư |
| T7 | ~9h30, thỉnh thoảng, mặc đồ thường | Chị ở lại lâu hơn. Đây là cửa sổ duy nhất để quan hệ với chị tiến triển |
| CN | Không |
| Lệch lịch | **Ngày 19 trở đi lịch bắt đầu rạn** — xem arc. Mưa: chị vẫn tới, có dù, **không nán lại** (khác mọi người, xem SK-05) |

**Arc 40 ngày — "Chị Lan và chỗ trống ở 7h05":**

| Mốc | Ngày | Chuyện gì xảy ra |
|---|---|---|
| **M1 — Bất biến** | Ngày 1–18 | Chị đến đúng giờ, gọi đúng chữ, trả đúng tiền, không nói thêm gì. Người chơi **chán chị**. Đó là chủ ý |
| **M2 — Miếng lót ly** | **Ngày 14** | Chị để lại trên nắp thùng đá **một miếng lót ly móc len màu xanh phấn**, không nói gì, đi thẳng. Không có thông báo, không có `+1`. Nếu người chơi **dùng nó** (kê ly trà đá lên) và chị thấy vào ngày 15 → chị **gọi thêm một câu** lần đầu tiên trong game |
| **M3 — Rạn** | **Ngày 19 → 23** | Tín hiệu hành vi, không phải lời. Chi tiết từng ngày ở P4-02 §2.5. Tóm: đơn nhỏ dần, không cầm bịch đồ chua, đứng xa hơn một bước, ngày 23 **không đổi giày** |
| **M4 — Trống** | **Ngày 24** | 7h05. Không ai. Trời mưa lớn. **Game không đánh dấu gì cả** — không sting nhạc, không ghi chú tự động. Chỉ có: sổ tay cô Ba tối đó, hai dòng: *"Bữa nay mưa từ sớm. Cô thấy con cứ nhìn ra đầu hẻm hoài."* |
| **M5 — Khoảng trống dài** | **Ngày 25 → 39** | **15 ngày không có chị.** Đây là khoảng trống dài nhất và cần thiết nhất của game. Trong 15 ngày đó, mỗi lần đồng hồ chỉ 7h05, hệ thống **không làm gì cả**. Người chơi tự làm phần còn lại |
| **M6 — Quay lại** | **Ngày 40** | Xem **P4-04 §2.2**. Chị quay lại. **Không giải thích đi đâu. Chỉ mua ổ bánh cuối cùng.** Đây là trái tim của cả game (`idea.md` §17 XĐ3 phanh 4 — *giữ nguyên, không sửa*) |

**Thứ hoàn toàn không liên quan tới nghề hay hoàn cảnh (L2):**
> **Chị Lan móc len.** Không phải để bán — chị có bán vài món trên Shopee nhưng lời không đáng kể và chị biết điều đó. Chị móc vì tay chị cần có việc làm khi đầu chị đang nghĩ. Chị móc trên xe buýt, móc trong giờ nghỉ trưa, móc lúc họp online. Chị đã móc **một cái chăn suốt hai năm chưa xong**.
> **Luật thi hành:** miếng lót ly ngày 14 **không bao giờ được giải thích bằng lời**. Nếu có một dòng thoại nói "chị móc cho em nè" thì cắt dòng đó. Cả nhân vật nằm ở chỗ chị không nói.

**Vai trò trong hệ gossip:** **nút LAN TIN MẠNH NHẤT — và đó là nghịch lý cố ý.**
- `thanThien 0.3` nghĩa là chị không thân với ai. Nhưng chị **làm văn phòng**, chị có nhóm chat công ty, và công ty chị có 40 người **cùng đi ngang hẻm này**.
- Cơ chế: chị không kể cho NPC nào. Chị tạo ra **sóng khách vãng lai**. Một `ORDER_DEFECT` mà chị chứng kiến ở ngày 8 → ngày 10–12 xuất hiện 2–3 khách lạ **không gọi món, chỉ nhìn rồi đi**. Người chơi không bao giờ được cho biết nguyên nhân.
- `mutation_rate` qua chị: **0.05** — gần như không méo. Chị kể đúng. Đó mới đáng sợ.
- Chiều ngược lại cũng mạnh: `REMEMBERED_USUAL` với chị Lan 5 lần liên tiếp → từ ngày 16 xuất hiện khách lạ nói: *"Chị Lan bên công ty em kêu qua đây mua."* — **nguồn truy vết được**, đúng §12 ràng buộc 3.

**3–5 câu thoại đặc trưng:**
1. *"Cho em ổ chả lụa, không ớt, không hành. Gói mang về."* — đều, rõ, không nhìn lên. 23 ngày y hệt. VA phải đọc **giống hệt nhau**, dùng đúng một bản thu, cố ý.
2. *"...Dạ."* — dùng khi có gì đó không ổn. Một chữ. Có một nhịp ngừng trước nó. **Đây là "bark tier-1" duy nhất của chị.**
3. *"Không sao đâu em."* — nói khi rõ ràng là có sao. Dùng đúng **hai lần** trong cả game.
4. *"Hôm nay có đồ chua mới hả?"* — ngày 15, nếu M2 thành công. **Câu dài nhất chị từng nói trong 20 ngày đầu.** Trọng lượng của nó đến từ độ dài.
5. *"Còn ổ nào không em?"* — **ngày 40**. Xem P4-04. Đây là dòng thoại đắt nhất của dự án; nếu chỉ thu được một dòng VO hoàn hảo trong cả game, thu dòng này.

---

### NPC-05 · **BÉ SU** — học sinh lớp 8, quay TikTok

| | |
|---|---|
| **Tuổi** | 13 |
| **Nghề** | Học sinh lớp 8 trường gần hẻm |
| **Nơi ở** | Nhà giữa hẻm, ở với ba mẹ và bà ngoại |
| **Chỉ số** | `soi 0.4` / `nongTinh 0.4` / `deTha 0.9` / `thanThien 1.0` |

**Ngoại hình.** Nhỏ con, đồng phục áo trắng váy xanh đen, ba lô to quá khổ. Tóc buộc hai bên hoặc một búi lệch **tuỳ ngày** (artist làm 3 biến thể tóc — rẻ, và là cách duy nhất trong game thể hiện "hôm nay bé có tâm trạng"). Màu nhận dạng: **trắng + xanh đen đồng phục**, điểm một sợi dây buộc tóc màu vàng chanh.
- `prop_a`: **điện thoại cầm ngang, quay dọc** — tư thế quay video.
- `prop_b`: **cái gimbal nhỏ rẻ tiền** — xuất hiện từ ngày 17, bé để dành mua.
- `prop_c`: **quyển vở nháp toán**, bìa dán đầy sticker.

**Hệ quả cụ thể của từng chỉ số:**

| Chỉ số | Hệ quả trong game với bé Su |
|---|---|
| `soi 0.4` | Bé không soi. Nhưng **camera của bé thì soi.** Cơ chế riêng: khi bé đang quay (`prop_a` giơ lên), mọi sự kiện xảy ra được **ghi lại** và có thể bị "phát hiện muộn" — ngày hôm sau, qua clip. Đây là cách duy nhất trong game mà một lỗi bị bắt **sau khi đã xảy ra** |
| `nongTinh 0.4` | Bé la lên vì **hào hứng**, không vì giận: *"Ê ê quay lại cái đó đi!"* |
| `deTha 0.9` | Không giận quá một ngày |
| `thanThien 1.0` (cao nhất tuyệt đối) | **Hệ số lan tin ×2.0.** Bé là bộ khuếch đại. Chuyện tốt qua bé thành huyền thoại, chuyện xấu qua bé thành meme |

**Đơn hàng quen (`REMEMBERED_USUAL`).** Nguyên văn (từ ngày 14, sau khi xe có bình trà sữa — xem P4-02):
> *"Cô ơi cho con ly trà sữa, 70 đường, 100 đá. Với ổ bánh mì không nha cô."*

Trước ngày 14: *"Cho con ổ bánh mì không, chấm sữa á cô."*

**Khẩu vị ẩn:**
1. **"Bánh mì không" của bé là bánh mì không thật** — ổ bánh trống, chấm sữa đặc. Nếu người chơi bỏ nhân vào vì nghĩ bé quên, bé sẽ **ăn và không nói gì**, nhưng không quay clip hôm đó. Đây là một trong những tình huống "món ăn là câu thoại" quan trọng nhất (P4-03 §2.2, ML-04).
2. **Bé muốn ly trà sữa nhìn đẹp.** Đá xếp gọn, trân châu không nổi lều bều. `FLOURISH` (salience 15) với bé Su được nhân **×3** vì bé quay lại.
3. **Bé đang để dành tiền.** Bé sẽ **không bao giờ nói**. Nhưng từ ngày 9, bé bắt đầu gọi ít đá hơn để... không, sai — bé bắt đầu **chỉ mua bánh mì không, bỏ trà sữa**, vài ngày liền. Ngày 17 bé xuất hiện với cái gimbal. Người chơi tự nối hai chuyện đó.

**Lịch sinh hoạt:**

| Ngày | Giờ | Ghi chú |
|---|---|---|
| **T2 → T7** | **6h35** (đi học) và **~11h20** (về, chỉ T7) | Bé đi học buổi sáng |
| CN | ~9h00, đi chơi, **ở lại lâu**, quay nhiều | Cửa sổ chính để tương tác với bé |
| Lệch lịch | Thi học kỳ (ngày 20, 21): bé **không quay clip**, chỉ mua rồi đi, mặt căng. Ngày 28: bé tới với **huy chương** — xem arc |

**Arc 40 ngày — "Bé Su và cái clip 400 nghìn view":**

| Mốc | Ngày | Chuyện gì xảy ra |
|---|---|---|
| **M1 — Cái điện thoại giơ lên** | **Ngày 5** | Lần đầu bé quay người chơi làm bánh. Không xin phép. Người chơi có ba cách phản ứng (**bằng hành động, không bằng lựa chọn thoại**): che tay lại · làm bình thường · **làm đẹp hẳn lên** (`FLOURISH`). Ba cách dẫn tới ba nhánh quan hệ với bé |
| **M2 — Clip nổ** | **Ngày 10** | Một clip của bé đạt view. Hệ quả **ngày 11–13: +40% khách vãng lai**, chủ yếu người trẻ, gọi món lạ, không biết luật hẻm. Áp lực thông lượng (§13.3) tăng đột ngột → đây là chỗ người chơi mắc nhiều lỗi nhất Hồi 2. **Thành công gây ra khủng hoảng** — cấu trúc này quan trọng hơn cả bản thân sự kiện |
| **M3 — Clip xấu** | ~**Ngày 23** (điều kiện) | Nếu người chơi có ≥2 sự kiện tiêu cực salience ≥75 trước mặt bé trong Hồi 2 → bé đăng clip đó (**không ác ý, bé không hiểu hậu quả**). Hệ quả: 3 ngày `STALL_CLEANLINESS` bị soi, chú Kiệt được lợi. **Bé không bao giờ bị game trừng phạt vì chuyện này** |
| **M4 — Huy chương** | **Ngày 28** | Bé tới, đeo **huy chương đồng kỳ thi học sinh giỏi Toán cấp quận**, và **không quay clip về nó**. Bé chỉ khoe với người chơi. Đây là mốc chống rập khuôn của nhân vật |
| **M5 — Kết** | **Ngày 40** | Bé quay clip cuối. Lần này bé **xin phép**. *"Con quay được hông cô?"* — cả arc của bé nằm trong việc bé học cách hỏi |

**Thứ hoàn toàn không liên quan tới nghề hay hoàn cảnh (L2):**
> **Bé Su giỏi toán thật.** Không phải "học giỏi" kiểu trang trí — bé đi thi học sinh giỏi cấp quận và được giải. Bé **nhẩm tiền thối nhanh hơn người chơi**, và nếu người chơi thối sai, bé là người đầu tiên biết — nhưng bé nói nhỏ, đưa lại, không làm lớn chuyện. Bé cũng **không quay clip về chuyện học của mình** vì "cái đó chán thấy mồ".
> Đây là chi tiết trực tiếp phản bác khuôn mẫu "đứa nhỏ suốt ngày quay TikTok = đứa nhỏ hời hợt".

**Vai trò trong hệ gossip:** **BỘ KHUẾCH ĐẠI — hệ số cao nhất, hop xa nhất.**
- `spread_multiplier = 2.0`, được phép đi **3 hop** (mọi NPC khác cap 2).
- **Bé kể cho:** tất cả mọi người, và cả ngoài hẻm (qua clip).
- `mutation_rate` qua bé: **0.45 cho tin tốt, 0.30 cho tin xấu** — bé phóng đại cái hay hơn cái dở. Điều này thi hành ràng buộc §12.5 (*tin tốt lan mạnh hơn tin xấu*) một cách có nhân vật, không phải bằng một hằng số.
- **Nguồn truy vết:** khách vãng lai qua bé luôn nói *"em coi TikTok thấy chỗ này nè"* — người chơi biết chính xác tin từ đâu.

**3–5 câu thoại đặc trưng:**
1. *"Cô ơi cho con ly trà sữa, 70 đường, 100 đá. Với ổ bánh mì không nha cô."* — nhanh, một hơi, giọng cao.
2. *"Ê ê quay lại cái đó đi! Cái lúc cô rạch bánh á!"* — la lên. Không ai trong hẻm phản ứng, họ quen rồi.
3. *"Cái này lên xu hướng là cô đông khách luôn đó."* — tự tin tuyệt đối. Và bé đúng.
4. *"Cái đó chán thấy mồ."* — khi được hỏi sao không quay chuyện thi toán. Nhún vai.
5. *"Con quay được hông cô?"* — ngày 40. **Chậm hơn mọi câu khác của bé.**

---

### NPC-06 · **ÔNG HẢI** — khách buổi chiều, hay nhậu

> ⚠️ **Lằn ranh thi hành (`idea.md` §19.5):** *"Ông chú nhậu: nếu chỉ là comic relief say xỉn thì rẻ tiền. Ngoài đời ông ấy thường là người **trước 10 giờ sáng rất tử tế** — và đó mới là cái đau."*
> **Luật riêng cho nhân vật này: ông Hải KHÔNG BAO GIỜ là cú punchline.** Không có sự kiện nào mà tiếng cười đến từ việc ông say. Nếu một sự kiện làm người chơi bật cười *vì* ông say — cắt sự kiện.

| | |
|---|---|
| **Tuổi** | 58 |
| **Nghề** | Thợ điện lạnh (sửa máy lạnh, quạt, tủ lạnh) — nhận việc lẻ trong khu |
| **Nơi ở** | Nhà đầu hẻm, cửa sắt kéo, bên trong treo đầy quạt cũ chờ sửa |
| **Chỉ số** | `soi 0.5` / `nongTinh 0.9` / `deTha 0.5` / `thanThien 0.6` |

**Ngoại hình.** Người tầm thước, tay to, **móng tay có vết dầu máy không rửa hết** — chi tiết nhận dạng chính. Áo sơ mi ngắn tay kẻ sọc mờ, bỏ ngoài quần, dép nhựa. Màu nhận dạng: **nâu đất + xám nhạt**.
- **Bộ sprite của ông Hải cần HAI base_body**, không phải một:
  - `base_body_am.png` — **trước 10h**: lưng thẳng, vai mở, `eye_gaze_face`, tay cầm đồ nghề.
  - `base_body_pm.png` — **sau 15h**: vai trùng, đầu hơi đưa ra trước, `eye` mí nặng một mức, bước chân node lệch pha.
  - **Cùng một cái áo, cùng một khuôn mặt.** Sự khác biệt phải đủ nhỏ để không thành trò hề và đủ rõ để người chơi nhận ra ngay từ ngày 4.
- `prop_a`: **túi đồ nghề vải bạt** (sáng) / **bịch nilon đựng đồ nhắm** (chiều).
- `prop_b`: **cây cọ vẽ bảng hiệu nhỏ, cắm sau túi áo** — xuất hiện 3 lần trong cả game. Xem L2.

**Hệ quả cụ thể của từng chỉ số:**

| Chỉ số | Hệ quả trong game với ông Hải |
|---|---|
| `soi 0.5` | `traitMul` = **1.000** — CANON §4 chọn hằng số để `soi 0.5` cho đúng 1.000, nên **ông Hải chính là "khách chuẩn"** của mọi bảng hiệu chỉnh. Buổi sáng ông thấy nhiều hơn 1 bậc (ông nhìn mặt, nhìn tay, nhìn quầy). Buổi chiều `gazeFactor` của ông tụt còn 0.4 — **ông thấy ít hơn, nhưng cái ông thấy thì ông nói to gấp đôi** |
| `nongTinh 0.9` (cao nhất hẻm) | Bark tier-1 của ông **được nghe thấy bởi mọi NPC trong bán kính 8m**. Một lỗi trước mặt ông chiều = một lỗi trước mặt cả hẻm. Ông là **bộ khuếch đại tại chỗ**, khác bé Su (khuếch đại qua thời gian) |
| `deTha 0.5` | Trung bình. Nhưng có luật riêng: **cái ông nói lúc chiều, sáng hôm sau ông không nhớ** — và ông **xin lỗi vì không nhớ**, điều đó còn nặng hơn |
| `thanThien 0.6` | Ông thân thật. Ông là người **đầu tiên trong hẻm gọi người chơi bằng tên** (ngày 3) |

**Đơn hàng quen (`REMEMBERED_USUAL`).** Ông có **hai đơn hàng quen**, và đó là toàn bộ nhân vật:

| Khung giờ | Nguyên văn |
|---|---|
| **Sáng (trước 10h)** | *"Cho chú ổ ốp la, hai trứng. Chú ăn tại chỗ. Cho xin ly trà đá."* |
| **Chiều (sau 15h)** | *"Ổ gì cũng được con ơi. Ờ... đầy đủ. Đầy đủ đi."* |

> **Thiết kế cốt lõi:** `REMEMBERED_USUAL` (salience 90) **chỉ bắn được với đơn buổi sáng.** Buổi chiều ông không có "như mọi bữa" — vì buổi chiều ông không nhớ ông thích gì. Người chơi muốn có khoảnh khắc chữa lành với ông Hải thì **phải gặp ông lúc sáng**. Và ông chỉ tới sáng vào một số ngày nhất định.

**Khẩu vị ẩn:**
1. **Ông thích trứng lòng đào.** Ông không bao giờ nói. Buổi sáng, nếu lòng đỏ còn chảy, ông ngừng một giây rồi nói *"ngon"* — và đó là lần duy nhất trong game ông dùng chữ đó.
2. **Buổi chiều ông cần bánh MỀM.** Ông không nói. Vỏ cứng → ông bỏ dở, gói lại mang về. Người chơi thấy cái gói đó ở thùng rác.
3. **Khẩu vị ẩn thật sự: ông muốn có người nói chuyện lúc chiều.** Nhưng `CARED_FOR_THEM` buổi chiều **không** làm ông vui lên — nó làm ông ở lại lâu hơn, nói to hơn, và làm khách khác khó chịu. **Người chơi phải tự tìm ra rằng tử tế với ông Hải buổi chiều là một quyết định có giá.** Không có UI nào nói điều này.

**Lịch sinh hoạt:**

| Ngày | Giờ | Ghi chú |
|---|---|---|
| **Mọi ngày** | **16h30 ± 45 phút** | Đây là ông Hải mà người chơi gặp 80% thời gian |
| **T3 · T5 · T7** | **7h30** — bản "sáng" | 3 ngày/tuần. **Người chơi phải tự phát hiện ra pattern này.** Không ai nói |
| CN | Sáng: có. Chiều: **không** (ông về Bình Dương thăm con gái 2 CN/tháng) | |
| Lệch lịch | Ngày 12, 27: ông tới sáng **ngoài lịch** — vì có việc sửa máy lạnh gấp. Ngày 34: xem arc |

**Arc 40 ngày — "Ông Hải và cái bảng hiệu":**

| Mốc | Ngày | Chuyện gì xảy ra |
|---|---|---|
| **M1 — Hai người** | **Ngày 3 → 7** | Người chơi gặp ông chiều ngày 3 (ồn, khó chịu), rồi gặp ông sáng ngày 5 (**tử tế, hỏi thăm, sửa giùm cái quạt của cô Ba không lấy tiền**). Đây là twist nhân vật, và nó tới **sớm**, trong Hồi 1, vì nó là bài học về việc "đừng đóng khung ai trong một lần gặp" — bài học mà cả game sẽ dùng lại |
| **M2 — Cái bảng** | **Ngày 16** | Người chơi phát hiện: **chữ đỏ viền vàng trên bảng hiệu xe cô Ba là ông Hải viết tay, 20 năm trước.** Không phải qua cutscene — qua việc bà Sáu nói một câu tình cờ. Từ đây `prop_b` (cây cọ) có nghĩa |
| **M3 — Cái bảng bị tróc** | **Ngày 24** | Mưa lớn ngày 24 làm bảng hiệu tróc sơn. Người chơi có hai đường: **thuê làm bảng mới** (tốn tiền, đẹp, vô hồn) hoặc **nhờ ông Hải** (rẻ, và ông chỉ làm được **vào buổi sáng**). → Người chơi phải canh đúng ngày ông tới sáng. **Đây là lần đầu game bắt người chơi dùng kiến thức về lịch sinh hoạt của một NPC để đạt được một việc** |
| **M4 — Tay run** | **Ngày 26–27** | Nếu chọn nhờ ông: ông tới sáng, ngồi vẽ. **Tay ông run.** Ông vẽ chậm, vẽ lại hai lần. Ông không xin lỗi, ông chỉ nói *"lâu quá không cầm cọ."* Nét chữ cuối cùng **không đẹp bằng nét cũ** — và cái bảng đó vẫn được treo lên. **Không có phiên bản "chơi giỏi thì ông vẽ đẹp".** Đây là chỗ game từ chối cơ chế hoá lòng thương |
| **M5 — Kết** | **Ngày 38–40** | Con gái ông từ Bình Dương lên, đón ông về ở chung. Ngày 38 ông tới **buổi sáng**, tỉnh, mặc áo mới, và gọi đúng đơn hàng sáng. Ngày 40 ông không có mặt — **nhưng cái bảng thì có** |

**Thứ hoàn toàn không liên quan tới nghề hay hoàn cảnh (L2):**
> **Ông Hải viết bảng hiệu bằng tay.** Suốt thập niên 90 và 2000, ông là người vẽ bảng hiệu cho gần như cả khu: *chữ đỏ viền vàng, bo tròn, có bóng đổ bên phải* — cái phong cách mà bây giờ người ta gọi là "vintage" và bán poster trên mạng. Ông bỏ nghề khi máy in decal rẻ đi. Ông không cay đắng về chuyện đó; ông chỉ **không nhắc tới nó nữa**, và đó là một dạng khác của cay đắng.
> **Luật thi hành:** không bao giờ để ông tự nói *"hồi xưa chú vẽ bảng"*. Người khác nói. Ông chỉ xác nhận bằng một chữ.

**Vai trò trong hệ gossip:** **nút ỒN — bán kính rộng, độ chính xác thấp, HAI CHẾ ĐỘ.**
- **Sáng:** `mutation_rate` 0.15, kể đúng, kể ít.
- **Chiều:** `mutation_rate` **0.50** — cao nhất hẻm sau bé Su. Ông kể sai, kể to, kể cho người ngồi bàn bên. Nhưng — quan trọng — **NPC khác BIẾT ông đang nói lúc chiều** và tự hạ `confidence` xuống 0.5 khi nhận tin từ ông. Ông là nút lan tin mà cả hẻm đã tự trang bị bộ lọc.
- **Ông kể cho:** chú Tư (tới ngày 22), chú Kiệt (hai người nhậu chung — **đây là đường rò rỉ thông tin nguy hiểm nhất của người chơi**), khách vãng lai.

**3–5 câu thoại đặc trưng:**
1. **[Sáng]** *"Cho chú ổ ốp la, hai trứng. Chú ăn tại chỗ. Cho xin ly trà đá."* — rõ ràng, ấm, có nhịp. **VA: đây là giọng thật của nhân vật.**
2. **[Sáng]** *"Cái quạt của bà Ba hư hả? Để chú coi cho, khỏi tiền."* — dứt khoát, không chờ trả lời.
3. **[Chiều]** *"Ổ gì cũng được con ơi. Ờ... đầy đủ. Đầy đủ đi."* — chậm nửa nhịp, chữ cuối kéo dài. **Không nhè. Không lảo đảo.** Chỉ chậm.
4. **[Chiều]** *"Ê! Cái bánh đó! Con làm gì kỳ vậy!"* — to đột ngột. Đây là bark `nongTinh 0.9`. Nó làm 3 NPC khác quay đầu.
5. **[Sáng hôm sau]** *"Hôm qua chú có nói gì bậy không con?"* — nhỏ, ngượng. **Đây là dòng thoại làm nhân vật này không phải comic relief.** Người chơi không được phép trả lời bằng thoại (T2) — người chơi trả lời bằng cách **vẫn làm ổ ốp la hai trứng như thường**.

---

### NPC-07 · **CÔ MAI** — chủ tạp hoá đối diện, làm ăn được

> `idea.md` §19.5: *"Cái hẻm mà ai cũng nghèo giống nhau là cái hẻm giả."* Cô Mai là nhân vật chịu trách nhiệm cho câu đó. **Cô phải rõ ràng là khá giả**, và game **không được** biến cô thành kẻ trưởng giả để bù lại.

| | |
|---|---|
| **Tuổi** | 47 |
| **Nghề** | Chủ tạp hoá **Mai Hương** đối diện xe. Kiêm: đại lý thu hộ hoá đơn, bán sỉ nước ngọt cho 6 quán trong khu, đổi tiền lẻ |
| **Nơi ở** | Nhà 3 tầng, tầng trệt là tiệm. Chồng làm kỹ thuật viên, con gái năm 2 đại học Dược |
| **Chỉ số** | `soi 0.6` / `nongTinh 0.4` / `deTha 0.6` / `thanThien 0.8` |

**Ngoại hình.** Người đậm, khoẻ, tóc nhuộm nâu cắt ngắn gọn, **đeo kính gọng mảnh**. Áo thun cotton có cổ, quần lửng, dép quai — **quần áo đơn giản nhưng mới và vừa vặn**; đây là cách artist thể hiện "khá giả" mà không dùng vàng đeo đầy tay (sáo). Màu nhận dạng: **cam đất + trắng**.
- `prop_a`: **điện thoại có ốp lưng gắn ví** — cô mở ra là có xấp tiền lẻ đã cột dây thun theo mệnh giá.
- `prop_b`: **cuốn sổ nợ bìa carton**, gáy dán băng keo, trang giấy caro. Đây là prop quan trọng nhất của game về mặt cơ chế (xem P4-05 §2.3).
- `prop_c`: **cái đồng hồ thể thao trên cổ tay** — luôn có. Xem L2.

**Hệ quả cụ thể của từng chỉ số:**

| Chỉ số | Hệ quả trong game với cô Mai |
|---|---|
| `soi 0.6` | `traitMul` = **1.07**. Cô đứng ở **bên kia hẻm** (`SEATED_FAR`, visibility 0.10) nên hiếm khi bắt lỗi thao tác. **Nhưng cô soi TIỀN.** Cơ chế riêng: cô là NPC duy nhất kiểm tra `ledger` — sai sổ nợ, thối nhầm, ghi thiếu → cô phát hiện với certainty ×3 |
| `nongTinh 0.4` | Cô nói thẳng nhưng không gắt. Cô là người **hỏi thẳng**: *"Ủa hôm qua con ghi mấy ổ vậy?"* |
| `deTha 0.6` | Trung bình. Nhưng với **sai sót tiền bạc**, `deTha` hiệu dụng của cô tụt còn **0.25** — chuyện tiền cô nhớ dai |
| `thanThien 0.8` | Thân nhanh, lan tin mạnh. Cô là **nút gossip trung tâm của hẻm** vì tiệm cô là chỗ ai cũng đi qua |

**Đơn hàng quen (`REMEMBERED_USUAL`).** Nguyên văn:
> *"Cho cô hai ổ, một đầy đủ một không hành. Cô ăn với con Hương."*

(Hương = con gái cô. Từ ngày 30, khi Hương đi thực tập xa, đơn đổi thành **một ổ** — một thay đổi nhỏ mà `soi` của người chơi phải bắt được.)

**Khẩu vị ẩn:**
1. **Cô ghét ớt, nhưng con gái cô thích.** Cô sẽ không nói ổ nào của ai. Người chơi phải nhớ: **ổ không hành là của cô, ổ đầy đủ là của Hương, và Hương ăn cay.** Làm đúng ba biến số này = `REMEMBERED_USUAL` nhân 1.5.
2. **Cô muốn gói riêng hai ổ.** Không nói. Gói chung → cô tự tách ở tiệm, và hôm sau cô **tự mang theo hai cái bịch**.
3. **Cô thích được hỏi về giá nguyên liệu.** Cô biết giá sỉ mọi thứ trong khu. Hỏi cô → mở khoá **thông tin giá chợ ngày mai** (§13.4). Đây là cơ chế gắn quan hệ với kinh tế, và nó chỉ mở khi quan hệ đủ thân — không có nút "hỏi", chỉ có việc cô **tự nói** khi cô thấy đáng.

**Lịch sinh hoạt:**

| Ngày | Giờ | Ghi chú |
|---|---|---|
| **Mọi ngày trừ CN** | **8h10** — sau giờ cao điểm, khi người chơi đã rảnh | Cô cố tình tránh giờ đông. **Đó là một hành động tử tế mà game không bao giờ giải thích** |
| CN | Cô nghỉ tiệm nửa ngày, không mua | |
| **Ngoài giờ** | Cô có mặt ở tiệm **cả ngày**, luôn nhìn thấy được ở nền — đây là NPC duy nhất luôn hiện diện | |
| Lệch lịch | Ngày 4h30 sáng cô chạy bộ → **ngày 1, 8, 15, 22, 29, 36 (thứ Hai)** người chơi thấy cô chạy ngang lúc mở hàng. Cô vẫy tay. Không mua |

**Arc 40 ngày — "Cô Mai và cuốn sổ nợ":**

| Mốc | Ngày | Chuyện gì xảy ra |
|---|---|---|
| **M1 — Tiền lẻ** | **Ngày 2** | Người chơi hết tiền thối (khách đưa 500k lúc 6h30 — điềm xấu, xem P4-05 §2.1). Cô Mai **chạy qua đưa tiền lẻ trước khi được hỏi**. Đây là cách game giới thiệu cô: không phải bằng lời, bằng việc cô đã đứng sẵn ở đó |
| **M2 — Mở sổ nợ** | **Ngày 9** | Cô đề nghị: *"Con ghi sổ đi, cuối tháng tính một lần. Cô cũng ghi vậy."* → **Mở khoá hệ sổ nợ.** Từ đây người chơi có thể bán chịu — và có thể quên ghi (§19.2: *chỗ duy nhất "nhớ nhầm" hoàn toàn hợp trực giác*) |
| **M3 — Bảng QR** | **Ngày 14** | Cô cho người chơi biết cô đã gắn QR từ lâu và **khách trẻ bỏ đi khi biết chỉ nhận tiền mặt**. → Mở khoá upgrade **bảng QR**. Cô giúp đăng ký. Không tốn tiền, tốn **một buổi sáng không bán được** |
| **M4 — Cô Mai bị lỗ** | **Ngày 27** | Cô kể cô vừa lỗ một khoản — **không phải lỗ vì buôn bán, mà vì một chậu lan cô mua 4 triệu đã chết**. Cô bực mình thật sự. Đây là mốc chống-rập-khuôn: người khá giả cũng có thất bại, và thất bại của họ trông khác |
| **M5 — Một ổ** | **Ngày 30** | Hương đi thực tập. Cô mua một ổ. Nếu người chơi **tự động chỉ làm một ổ** mà không hỏi → `REMEMBERED_STORY` bắn, và cô im một lúc rồi nói: *"Ừ. Còn một thôi."* |
| **M6 — Kết** | **Ngày 40** | Cô **chốt sổ nợ**. Nếu người chơi ghi sổ cẩn thận suốt mùa → con số khớp, cô gật đầu. Nếu lệch → cô **không đòi**, cô xé trang đó. Cả hai đều là kết tử tế, chỉ khác nhau về việc người chơi biết mình đã làm gì (§15) |

**Thứ hoàn toàn không liên quan tới nghề hay hoàn cảnh (L2):**
> **Cô Mai chạy bộ.** 5 km mỗi sáng thứ Hai, 4h30, trước khi mở tiệm. Cô có **ba cái huy chương giải chạy phong trào treo trong tiệm**, giữa đống mì gói và dầu ăn — artist phải vẽ cái đó, nó là chi tiết đắt nhất của bối cảnh. Cô đang tập để chạy half-marathon và cô nói về nhịp tim, về pace, về cái đồng hồ, với đúng giọng của một người có sở thích tốn tiền.
> **Và:** cô sưu tầm lan. Cô lỗ vì lan chứ không lỗ vì buôn bán. Cô sẽ cho người chơi **một nhánh trầu bà** ở ngày 12 — chậu trầu bà treo ngoài cửa sổ trong §14 chính là từ cô.

**Vai trò trong hệ gossip:** **NÚT TRUNG TÂM — degree cao nhất, mutation trung bình, và là nơi người chơi NGHE LỎM.**
- Tiệm cô đối diện xe → **đây là địa điểm vật lý của cơ chế nghe lỏm** (§12 ràng buộc 4: *"Người chơi phải NGHE LỎM được hai khách nói chuyện ở góc hẻm. Không có nghe lỏm thì bỏ luôn cả nhớ nhầm lẫn đồn thổi."*). Mọi cuộc nói chuyện gossip mà người chơi cần nghe được đều diễn ra **trước tiệm cô Mai**, trong tầm nghe, bị che một phần bởi tiếng xe.
- `mutation_rate` qua cô: 0.30 (mức nền). Cô kể có trách nhiệm nhưng cô kể nhiều.
- **Cô kể cho:** mọi người. **Cô nhận tin từ:** bà Bảy, bà Sáu, chị Hạnh, khách vãng lai.
- **Cô KHÔNG kể cho chú Kiệt** — cô không ưa cách chú làm ăn. Đây là bức tường lửa duy nhất bảo vệ người chơi.

**3–5 câu thoại đặc trưng:**
1. *"Cho cô hai ổ, một đầy đủ một không hành. Cô ăn với con Hương."* — rành mạch, giọng người quen ra lệnh.
2. *"Cần tiền lẻ hôn? Cô có nè."* — nói trước khi được hỏi. **Luôn luôn.**
3. *"Con ghi sổ đi, cuối tháng tính một lần. Cô cũng ghi vậy."* — thực tế, không ban ơn.
4. *"Bốn triệu đó con. Bốn triệu một chậu mà nó chết queo."* — bực thật. Đây là lúc VA được thả.
5. *"Ừ. Còn một thôi."* — ngày 30. Ngắn, và có một nhịp lặng sau đó.

---

### NPC-08 · **THẦY PHÚC** — giáo viên hưu trí

| | |
|---|---|
| **Tuổi** | 68 |
| **Nghề** | Giáo viên Toán cấp 3, nghỉ hưu 8 năm. Dạy kèm miễn phí cho 4 đứa nhỏ trong hẻm, tối thứ Ba và thứ Năm |
| **Nơi ở** | Nhà nhỏ giữa hẻm, có gác lửng, cửa sổ luôn mở, **có chậu trầu bà treo** |
| **Chỉ số** | `soi 0.8` / `nongTinh 0.2` / `deTha 0.7` / `thanThien 0.5` |

**Ngoại hình.** Gầy, cao, lưng thẳng. **Áo sơ mi trắng bỏ trong quần, luôn luôn** — kể cả đi mua bánh mì lúc 7 giờ sáng. Kính lão gọng đồi mồi. Dép da. Màu nhận dạng: **trắng + nâu kính**.
- `prop_a`: **tờ báo giấy gấp tư** — ông là người duy nhất trong hẻm còn mua báo giấy.
- `prop_b`: **bình giữ nhiệt inox nhỏ** — cà phê ông tự pha ở nhà. Xem L2.
- `prop_c`: **xe đạp cuốc** dựng gần đó vào sáng T7/CN — khung nhôm, có đồng hồ tốc độ.
- Dáng: node của ông **rất ít chuyển động**. Ông đứng yên. Đó là cách `nongTinh 0.2` được vẽ.

**Hệ quả cụ thể của từng chỉ số:**

| Chỉ số | Hệ quả trong game với thầy Phúc |
|---|---|
| `soi 0.8` | `traitMul` = **1.21**. Ông thấy gần hết. **Nhưng ông là NPC DẠY NGƯỜI CHƠI ĐỌC HỆ THỐNG** (CANON §9): khi ông `NOTICED`, ông không trách — ông **mô tả**: *"Con vừa cầm tiền xong đó."* Câu đó không phải lời chê, nó là **bản dịch của cơ chế ra tiếng Việt** |
| `nongTinh 0.2` | Không bao giờ to tiếng. Bark của ông luôn ở âm lượng thấp nhất, và **không ai khác nghe thấy** — ông cố tình nói nhỏ để không làm người chơi mất mặt trước khách khác. **Đây là thiết kế: ông là kênh phản hồi RIÊNG TƯ duy nhất trong game** |
| `deTha 0.7` | Tha, nhưng nhớ đủ lâu để nhận ra pattern. Ông là NPC bịt lỗ hổng (g) ở tầng *lời nói*: sau 4–5 lần cùng một kiểu ẩu, ông nói: *"Cô thấy dạo này con hay quên rửa tay sau khi thối tiền. Không phải cô rầy, cô nói để con biết."* — xin lỗi, **ông tự xưng là "thầy"**, sửa lại: *"Thầy thấy dạo này..."* |
| `thanThien 0.5` | Trung tính. Ông không lan tin. **`spread_probability` của ông = 0.10, thấp nhất hẻm** |

**Đơn hàng quen (`REMEMBERED_USUAL`).** Nguyên văn:
> *"Cho thầy ổ pate, ít rau, đừng bỏ ngò. Ăn tại chỗ."*

**Khẩu vị ẩn:**
1. **Ông đếm thời gian nướng.** Ông biết bánh nướng đủ 40 giây khác bánh nướng 20 giây. Ông không nói, ông **cắn rồi đặt xuống nửa giây** — tín hiệu hình ảnh duy nhất.
2. **Ông không ăn ngò vì ngò có mùi xà phòng với ông** (gen OR6A2 — có thật, và tuyệt đối không giải thích trong game). Bỏ nhầm một cọng → ông gỡ ra, không nói, và **hôm sau ông nhắc lại yêu cầu đầy đủ** thay vì nói "như mọi bữa". Đó là hình phạt: **mất quyền được nói tắt.**
3. **Khẩu vị ẩn thật sự: ông muốn có chỗ ngồi.** Ông ăn tại chỗ mỗi ngày. Nếu ghế nhựa bẩn hoặc bị chiếm, ông đứng ăn, và `STALL_CLEANLINESS` với ông có trọng số **×2**.

**Lịch sinh hoạt:**

| Ngày | Giờ | Ghi chú |
|---|---|---|
| **Mọi ngày** | **7h40**, sai số ±5 phút | Sau giờ cao điểm, trước cô Mai |
| T7 · CN | **6h00** — sớm hơn hẳn, mặc đồ xe đạp, mua **mang theo** | Ông đạp 40km rồi mới về. Người chơi mất vài tuần để hiểu tại sao |
| Lệch lịch | T3 · T5: ông về sớm hơn để dạy kèm → ghé thêm buổi chiều 17h mua ổ thứ hai cho tụi nhỏ. Mưa: ông **không đi xe đạp**, nhưng vẫn tới đúng giờ |

**Arc 40 ngày — "Thầy Phúc và cái sổ tay":**

| Mốc | Ngày | Chuyện gì xảy ra |
|---|---|---|
| **M1 — Người dịch** | **Ngày 4** | Lần đầu ông `NOTICED` một lỗi và **mô tả thay vì trách**. Đây là lúc game dạy người chơi rằng hệ perception có thật và đọc được. **Nếu chỉ giữ được một NPC trong vertical slice ngoài 3 NPC bắt buộc, giữ thầy Phúc** |
| **M2 — Ông đưa cây bút** | **Ngày 11** | Ông thấy người chơi loay hoay nhớ đơn. Ông **đưa một cây bút bi và nói một câu duy nhất**: *"Ghi đi con. Trí nhớ là thứ mình tưởng mình có."* → **Mở khoá sổ tay khách hàng** (người chơi tự ghi chú, `idea.md` §12.2). Cơ chế quan trọng nhất của Hồi 2 được trao bởi một nhân vật, không bởi một popup |
| **M3 — Ông vắng 2 ngày** | **Ngày 20–21** | Ông không tới. Lý do: ông đi giải xe đạp phong trào ở Vũng Tàu. **Người chơi sẽ lo.** Đó là chủ ý — đây là "bài tập" cho cú biến mất thật của chị Lan bốn ngày sau. Ngày 22 ông về, da cháy nắng, kể chuyện đèo. **Giả báo động có đạo đức: game cho người chơi một lần hoảng sợ rồi trả lại** |
| **M4 — Ông đọc sổ** | **Ngày 32** | Ông xin xem sổ tay của người chơi. Ông đọc, gật gù, rồi nói: *"Con ghi kỹ hơn thầy tưởng."* — hoặc, nếu sổ trống: *"Không sao. Có người nhớ bằng tay, có người nhớ bằng bụng."* **Cả hai đều tử tế.** §15 thi hành ở mức vi mô |
| **M5 — Kết** | **Ngày 40** | Ông tới lúc 6h00 (như T7), mặc đồ xe đạp, dù là thứ Sáu. Ông mua **hai ổ**: một cho mình, một *"để dành"*. Ông không nói để dành cho ai |

**Thứ hoàn toàn không liên quan tới nghề hay hoàn cảnh (L2):**
> **Thầy Phúc là dân cà phê pha phin cực đoan.** Ông có **cân tiểu ly**, ông cân 22 gam bột cho 120ml nước, ông biết vườn cà phê ở Cầu Đất khác Buôn Ma Thuột thế nào, và ông sẽ nói về chuyện đó lâu hơn mức người chơi muốn nghe. Bình giữ nhiệt (`prop_b`) là cà phê ông tự pha — ông **không bao giờ mua cà phê ngoài**, và ông có ý kiến về chuyện đó.
> **Và:** ông đạp xe đường trường 40km mỗi cuối tuần, ở tuổi 68.
> **Luật thi hành:** không bao giờ để ông nói một câu triết lý về cuộc đời. Ông nói về cà phê và về líp xe. Sự khôn ngoan của ông phải rò rỉ ra **qua cách ông sửa lỗi cho người chơi**, không qua lời dạy.

**Vai trò trong hệ gossip:** **KÊNH RIÊNG TƯ — gần như không lan.**
- `spread_probability` 0.10. Ông biết nhiều nhất và kể ít nhất.
- **Giá trị thiết kế:** ông là **nơi an toàn**. Người chơi có thể sai trước mặt thầy Phúc mà không sợ cả hẻm biết. Hệ gossip cần một vùng an toàn, nếu không cảm giác bị theo dõi sẽ thành ngộp và người chơi bỏ game (đúng cảnh báo của Linh trong `idea.md` §17).
- Ngoại lệ duy nhất: ông **nói thẳng với cô Ba**, một lần, ở ngày 33, nếu người chơi đang trượt dốc. Và cô Ba sẽ không rầy — cô sẽ chỉ đứng quầy chung một buổi sáng.

**3–5 câu thoại đặc trưng:**
1. *"Cho thầy ổ pate, ít rau, đừng bỏ ngò. Ăn tại chỗ."* — chậm, rõ từng chữ, thói quen nghề giáo.
2. *"Con vừa cầm tiền xong đó."* — **nhỏ**, gần như chỉ người chơi nghe. Không có dấu chấm than.
3. *"Ghi đi con. Trí nhớ là thứ mình tưởng mình có."* — ngày 11.
4. *"Cà phê ngoài tiệm giờ người ta pha bằng máy hết rồi. Thầy không chê, thầy chỉ không uống."* — lan man, dài, hơi buồn cười.
5. *"Không sao. Có người nhớ bằng tay, có người nhớ bằng bụng."* — ngày 32, nhánh sổ trống. **Không được đọc kiểu an ủi.** Đọc như một nhận xét.

---

### NPC-09 · **CHỊ HẠNH** — người Bắc mới vô Sài Gòn

> **NPC duy nhất nói giọng Bắc.** `idea.md` §19.5 liệt kê "một người Bắc mới vô Sài Gòn bị chọc giọng" là thành phần bắt buộc để cái hẻm không giả. Arc của chị là **arc hoà nhập**, và nó được đo bằng **từ vựng gọi món**, không bằng cảm xúc.

| | |
|---|---|
| **Tuổi** | 28 |
| **Nghề** | Kế toán cho một công ty logistics nhỏ; bán thêm đồ gia dụng online buổi tối |
| **Nơi ở** | Thuê phòng trọ gác lửng trong hẻm, vô ở từ trước ngày 1 khoảng 5 tuần |
| **Chỉ số** | `soi 0.5` / `nongTinh 0.3` / `deTha 0.6` / `thanThien 0.4` |

**Ngoại hình.** Tầm thước, da sáng hơn mặt bằng chung của dàn (mới vô, chưa nắng). Áo khoác chống nắng dài tay **mặc kể cả lúc 6 giờ sáng** — đây là chi tiết nhận dạng người mới: chưa quen nắng Sài Gòn, mặc thừa. Màu nhận dạng: **be + hồng đất**.
- `prop_a`: **khẩu trang vải kéo xuống cằm** khi nói.
- `prop_b`: **máy ảnh film compact** đeo cổ tay vào cuối tuần. Xem L2.
- `prop_c`: từ ngày 25 — **một cái nón lá hoặc nón vành rộng** thay cho áo khoác. Tín hiệu hình ảnh của arc hoà nhập.

**Hệ quả cụ thể của từng chỉ số:**

| Chỉ số | Hệ quả trong game với chị Hạnh |
|---|---|
| `soi 0.5` | Mức nền. Nhưng chị soi **cái khác**: chị để ý xem người chơi có **hiểu chị nói gì không**. Cơ chế riêng: nếu người chơi làm sai vì **hiểu nhầm từ vùng miền**, `ORDER_DEFECT` của chị không tạo memory tiêu cực — nó tạo memory kind `MISUNDERSTOOD`, một loại riêng, decay theo `thanThien` chứ không theo `deTha` |
| `nongTinh 0.3` | Chị không cáu. Chị **giải thích lại, chậm hơn**, và chị ngượng khi phải giải thích |
| `deTha 0.6` | Trung bình |
| `thanThien 0.4` | Chậm thân — không phải vì khép kín, mà vì **chị chưa biết luật xã giao ở đây**. Đây là `thanThien` thấp có lý do, và lý do đó là thứ người chơi có thể thay đổi |

**Đơn hàng quen (`REMEMBERED_USUAL`) — và nó THAY ĐỔI theo arc:**

| Giai đoạn | Nguyên văn |
|---|---|
| **Ngày 1–12** | *"Chị lấy một cái bánh mì pa-tê. Cho chị xin ít rau mùi. Với một cốc trà đá."* |
| **Ngày 13–26** | *"Cho chị một ổ pa-tê... à, cho ít ngò. Ly trà đá nữa em."* — chị **tự sửa giữa câu**. Đây là mốc M2 |
| **Ngày 27–40** | *"Cho chị ổ pate, ít ngò, ly trà đá. Cảm ơn em nghen."* — chữ **"nghen"** là đích đến của cả arc |

> **Bảng đối chiếu từ vựng — writer PHẢI dùng đúng:**
>
> | Chị Hạnh nói (Bắc) | Người trong hẻm nói (Nam) | Bẫy gameplay |
> |---|---|---|
> | **cái** bánh mì | **ổ** bánh mì | Không có bẫy, chỉ khác |
> | rau **mùi** | **ngò rí** | **Bẫy thật.** Người chơi mới dễ bỏ nhầm hành lá |
> | **cốc** trà đá | **ly** trà đá | — |
> | **lạc** | **đậu phộng** | Xuất hiện ở SK-19 |
> | **quả** ớt | **trái** ớt | — |
> | **bát** | **chén** | — |
> | trứng **ốp lết** | trứng **ốp la** | **Bẫy thật** ở ngày 6 |
> | **bảo** em một câu | **nói** em một câu | — |

**Khẩu vị ẩn:**
1. **Chị ăn cay kém hơn mức chị thừa nhận.** Chị gọi "cho ít ớt" nhưng "ít" của chị = 1 khoanh, "ít" của Sài Gòn = 3 khoanh. Người chơi phải học rằng **cùng một chữ, hai người nghĩa khác nhau** — đây là bài học `T2` ở dạng tinh tế nhất.
2. **Chị muốn bánh nóng.** Chị mang lên phòng trọ ăn sau 15 phút. Nướng lại kỹ → chị không nói gì, nhưng chị bắt đầu tới sớm hơn 5 phút để bánh còn nóng.
3. **Khẩu vị ẩn thật sự: chị muốn được coi là người ở đây.** Cơ chế: nếu người chơi **dùng đúng từ Bắc khi nói với chị** trong Hồi 1 (game tự làm việc này qua barks, người chơi không chọn), chị thân nhanh hơn nhưng **arc hoà nhập chậm lại**. Nếu người chơi dùng từ Nam và **chị hiểu được nhờ ngữ cảnh** (tức là người chơi làm đúng món), chị hoà nhập nhanh hơn. **Đây là arc mà lòng tốt sai cách sẽ giữ người ta ở ngoài.**

**Lịch sinh hoạt:**

| Ngày | Giờ | Ghi chú |
|---|---|---|
| **T2 → T6** | **7h15 ± 6 phút** | Ngay sau chị Lan. Hai người **không nói chuyện với nhau** trong 20 ngày đầu |
| T7 | ~10h, mang máy ảnh, **đi chụp hẻm** | Cửa sổ tương tác dài |
| CN | Không (chị về Biên Hoà thăm người quen, hoặc ở phòng) |
| Lệch lịch | Ngày 8: chị bị **chọc giọng** (SK-18) → ngày 9, 10 chị **mua ở chỗ khác**. Ngày 11 chị quay lại. **Có báo trước, có quay lại** — arc thu nhỏ của cả game |

**Arc 40 ngày — "Chị Hạnh và chữ 'nghen'":**

| Mốc | Ngày | Chuyện gì xảy ra |
|---|---|---|
| **M1 — Rau mùi** | **Ngày 2** | Chị gọi "rau mùi". Nếu người chơi bỏ hành lá → `ORDER_DEFECT` kind `MISUNDERSTOOD`. Chị không giận, chị **gỡ ra và giải thích**, ngượng. Đây là lần đầu game dạy rằng "sai" có nhiều loại |
| **M2 — Bị chọc** | **Ngày 8** | Một khách vãng lai nhại giọng chị. **Ông Hải (buổi sáng, tức là bản tử tế) là người chặn lại.** Chị không nói gì, trả tiền, đi. **Người chơi không có lựa chọn thoại nào ở đây** (T2). Người chơi chỉ có thể: hôm sau, khi chị quay lại, **làm đúng ổ của chị mà không hỏi lại một chữ** |
| **M3 — Tự sửa** | **Ngày 13** | Lần đầu chị nói "ổ" rồi lại nói "ngò". Điều kiện: ≥3 lần `REMEMBERED_USUAL` trước đó. Nếu chưa đủ → mốc này dời tới ngày 20 |
| **M4 — Cái nón** | **Ngày 25** | Chị bỏ áo khoác chống nắng, đội nón vành. Chị cũng bắt đầu **nói chuyện với chị Lan** — đúng một câu, ở hàng chờ, ngày 22. Đó là cuộc trò chuyện duy nhất giữa hai người, và nó xảy ra **hai ngày trước khi chị Lan biến mất** |
| **M5 — Nghen** | **Ngày 27** | *"Cảm ơn em nghen."* Không có fanfare. Không có achievement popup. **Chỉ có một chữ mới trong câu quen thuộc** — và nếu người chơi đã chú ý suốt 27 ngày, người chơi sẽ nghe ra |
| **M6 — Kết** | **Ngày 40** | Chị mang máy ảnh. Chị xin chụp một tấm cái xe. Tấm ảnh đó xuất hiện lại ở màn hình kết thúc (P4-04 §2.5) |

**Thứ hoàn toàn không liên quan tới nghề hay hoàn cảnh (L2):**
> **Chị Hạnh sưu tầm và sửa máy ảnh film cũ.** Chị có bốn cái, chị tự thay foam, tự chỉnh màn trập, chị mua phim trên mạng và tự tráng đen trắng trong nhà tắm phòng trọ. Chị chụp hẻm — **không phải để đăng, chị không đăng gì cả**. Chị chụp rồi cất trong hộp. Khi được hỏi tại sao, chị nói *"để sau này nhớ"*, và câu đó **không được kịch tính hoá**.
> **Luật thi hành:** máy ảnh không bao giờ trở thành minigame. Nó là một prop và một lý do để chị đứng lại lâu hơn vào thứ Bảy.

**Vai trò trong hệ gossip:** **nút CHẬM, ĐỘ TIN CAO, và là NGƯỜI NHẬN chứ không phải người phát.**
- `spread_probability` 0.25. Chị **nghe nhiều hơn kể** — chị đang học cách cái hẻm này vận hành.
- **Giá trị thiết kế riêng:** chị là NPC duy nhất **hỏi lại nguồn tin**. Khi nhận một tin xấu về người chơi, chị không truyền đi ngay; chị **quan sát để tự kiểm chứng** trong 2 ngày. Nếu quan sát mâu thuẫn với tin → tin **chết tại chị**, không đi tiếp. Chị là **bộ lọc duy nhất trong mạng**, và việc chị có lọc hay không phụ thuộc vào việc người chơi có làm đúng trong 2 ngày đó không.
- Chị nhận tin từ: cô Mai, bà Sáu. Chị kể cho: cô Mai (ít), khách vãng lai Bắc (từ ngày 30 xuất hiện — bạn của chị).

**3–5 câu thoại đặc trưng (giọng Bắc — VA phải là người Bắc thật):**
1. *"Chị lấy một cái bánh mì pa-tê. Cho chị xin ít rau mùi. Với một cốc trà đá."* — rõ, hơi nhanh, âm cuối gọn.
2. *"Ơ... cái này là hành à em? Chị xin lỗi, chị hỏi rau mùi cơ."* — **ngượng, không trách**. Chữ "xin lỗi" là của chị, dù chị không sai.
3. *"Ở đây nắng thật đấy."* — nói với không ai cả, ngày 3.
4. *"Cho chị một ổ pa-tê... à, cho ít ngò."* — ngày 13. **Chỗ tự sửa phải có một khoảng hở nửa nhịp.**
5. *"Cảm ơn em nghen."* — ngày 27. **Chữ "nghen" phát âm chưa chuẩn giọng Nam, và đó chính là điều hay.** Ghi âm đúng như vậy, đừng sửa.

---

### NPC-10 · **ANH BẢO** — sinh viên, cắm mặt điện thoại

| | |
|---|---|
| **Tuổi** | 20 |
| **Nghề** | Sinh viên năm 2 ngành Cơ khí |
| **Nơi ở** | Ở trọ với 2 bạn cùng phòng, cuối hẻm, gác lửng |
| **Chỉ số** | `soi 0.3` / `nongTinh 0.2` / `deTha 0.8` / `thanThien 0.4` |

**Ngoại hình.** Gầy, cao lêu nghêu, tóc để dài che trán. Áo thun in chữ, quần jean, dép lê, **ba lô một quai**. Tai nghe không dây **lúc nào cũng đeo ít nhất một bên**. Màu nhận dạng: **xám than + đen**.
- `prop_a`: **điện thoại cầm dọc, cúi đầu 30 độ** — tư thế mặc định, không đổi.
- `prop_b`: **cuốn sổ tay nhỏ có chữ Nhật** dán ở bìa — xuất hiện từ ngày 13. Xem L2.
- Mắt: bộ `eye` của anh Bảo **chủ yếu dùng `eye_gaze_phone`**. Trạng thái `eye_gaze_hands` của anh cực hiếm — và vì thế nó **đáng sợ khi xuất hiện**.

**Hệ quả cụ thể của từng chỉ số:**

| Chỉ số | Hệ quả trong game với anh Bảo |
|---|---|
| `soi 0.3` | `traitMul` = **0.86**. Nhưng **cái quyết định là `gazeFactor` = 0.05** — thấp nhất game. Kiểm tra theo §5: `DROPPED_FOOD` (salience 75) trước mặt anh Bảo cần **~28 giây** để `CONFIRMED` → **thực tế không bao giờ**. Anh là **sandbox để người chơi học hệ perception** (CANON §9) |
| `nongTinh 0.2` | Không phản ứng ồn. Kể cả khi anh thấy, anh chỉ *"À..."* |
| `deTha 0.8` | Tha nhanh |
| `thanThien 0.4` | Ít kể. Nhưng anh có **một kênh riêng**: nhóm chat trọ và diễn đàn — xem gossip |

> **Bẫy thiết kế bắt buộc phải có:** người chơi sẽ học được rằng "làm ẩu trước mặt anh Bảo thì không sao". Đó là bài học **đúng nhưng nguy hiểm**, vì nó dạy người chơi một thói quen. Cơ chế bịt (§8 mục g + b): anh Bảo `deTha` cao nên không giận — **nhưng anh vẫn vô tư kể lại**, và ngày 17 anh ngẩng lên đúng lúc. Xem M3.

**Đơn hàng quen (`REMEMBERED_USUAL`).** Nguyên văn:
> *"Dạ... ổ đầy đủ. Dạ."* — nói vào điện thoại nhiều hơn nói với người chơi.

Từ ngày 14 (có trà sữa): *"Cho em ly trà sữa 50 đường, 50 đá. Với ổ đầy đủ."*

**Khẩu vị ẩn:**
1. **Anh không ăn ngay.** Anh mang về phòng, ăn sau 40 phút, **vừa ăn vừa học**. Gói kỹ chống ỉu là thứ duy nhất anh cần — và anh không biết để mà yêu cầu.
2. **Anh ăn cay được nhiều hơn anh gọi.** Anh gọi "đầy đủ" mặc định. Tự bỏ thêm ớt → lần sau anh tự nói *"cho em nhiều ớt chút"*. **Người chơi dạy khẩu vị cho một NPC** — cơ chế này chỉ có với anh Bảo, và nó đáng giá.
3. **Anh đói thật.** Cuối tháng (ngày 28–33) anh gọi bánh mì không. Xem SK-08 và M4.

**Lịch sinh hoạt:**

| Ngày | Giờ | Ghi chú |
|---|---|---|
| **T2 → T6** | **8h30–9h00** — lệch pha hoàn toàn với giờ cao điểm | Anh là khách của khoảng lặng. Đây là chỗ người chơi được thở |
| T7 | ~13h, hoặc không. Thất thường |
| CN | Thường không. Trừ mùa thi |
| Lệch lịch | **Ngày 19–21 (mùa thi)**: anh tới **6h20**, mắt thâm, mua 2 ổ, đi ngay. Hoàn toàn khác. **Ngày 28–33**: cuối tháng, đơn nhỏ lại |

**Arc 40 ngày — "Anh Bảo ngẩng đầu lên":**

| Mốc | Ngày | Chuyện gì xảy ra |
|---|---|---|
| **M1 — Không ai nhìn** | **Ngày 2 → 16** | Anh là vùng an toàn. Người chơi thử nghiệm, làm ẩu, học cơ chế. `gazeFactor` 0.05 |
| **M2 — Dạy khẩu vị** | ~**Ngày 12** | Nếu người chơi đã tự thêm ớt cho anh ≥4 lần → anh **tự nói** *"cho em nhiều ớt chút"*. Người chơi nhận ra mình vừa **thay đổi một con người bằng cách im lặng làm đúng**. Đây là hiện thân đẹp nhất của T2 trong game |
| **M3 — Anh ngẩng lên** | **Ngày 17** | **Sự kiện quan trọng nhất của nhân vật.** Đúng lúc người chơi làm một việc ẩu (bất kỳ sự kiện tiêu cực salience ≥75), điện thoại anh **hết pin**. Anh cất điện thoại. `gazeFactor` nhảy lên **0.8** trong 20 giây. Và anh thấy. Anh không nói gì — `nongTinh 0.2`. Anh chỉ **nhìn**, rồi nhìn xuống, rồi nhận bánh. **Không có memory tiêu cực nào được ghi.** Nhưng người chơi sẽ không bao giờ ẩu trước mặt anh Bảo nữa. *(Nếu người chơi không ẩu ngày 17 → sự kiện dời sang lần ẩu kế tiếp, cửa sổ mở tới ngày 26.)* |
| **M4 — Hết tiền** | **Ngày 29** | Anh gọi *"cho em ổ bánh mì không thôi"*, mắt vẫn ở điện thoại, giọng nhỏ hơn nửa mức. Xem SK-08. Người chơi có thể: làm đúng ổ không · lén bỏ pate · ghi sổ nợ · cho thêm. **Ba trong bốn cách đều làm anh xấu hổ.** Cách duy nhất không làm anh xấu hổ là **làm đúng ổ bánh mì không, và làm nó thật ngon** |
| **M5 — Kết** | **Ngày 40** | Anh tới, **không cầm điện thoại**. Anh đứng đợi. Anh nói cảm ơn và gọi người chơi bằng tên — lần đầu và duy nhất |

**Thứ hoàn toàn không liên quan tới nghề hay hoàn cảnh (L2):**
> **Anh Bảo dịch truyện tranh từ tiếng Nhật.** Anh trong một nhóm dịch trên mạng, anh làm không công, anh tự học tiếng Nhật ba năm qua anime và app, và **tiếng Nhật của anh khá hơn tiếng Anh**. Cái anh cắm mặt vào điện thoại suốt không phải game — phần lớn thời gian là **tra từ điển và soát bản dịch**. Sổ tay (`prop_b`) đầy chữ Nhật viết tay.
> **Luật thi hành:** tiết lộ này **không bao giờ được nói thẳng bởi anh Bảo**. Nó rò rỉ: bé Su nhìn qua vai anh và kêu lên *"Ủa anh biết tiếng Nhật hả?"* ở ngày 13. Anh trả lời *"Dạ chút chút"* và đó là hết.

**Vai trò trong hệ gossip:** **nút NGẦM — không nói, nhưng có mặt.**
- `spread_probability` 0.20 trong hẻm. **Nhưng** anh là nguồn của một loại khách vãng lai riêng: **sinh viên cùng trọ**, xuất hiện từ ngày 15, đi theo nhóm 2–3 người, gọi nhanh, ăn tại chỗ, làm tăng áp lực thông lượng.
- `mutation_rate` qua anh: 0.20. Anh kể ít nhưng kể chính xác **vì anh không quan tâm đủ để phóng đại**.
- **Điểm thiết kế:** anh là bằng chứng sống cho lỗ hổng (b) ở §8 — *"Người dễ tha không giận nhưng vẫn vô tư kể lại."* Người chơi nghĩ anh không thấy gì; nhưng bạn cùng phòng anh biết chỗ này làm bánh thế nào.

**3–5 câu thoại đặc trưng:**
1. *"Dạ... ổ đầy đủ. Dạ."* — lí nhí, hai chữ "dạ" ở hai chỗ không cần thiết. Rất sinh viên.
2. *"Dạ chút chút."* — ngày 13, khi bị bé Su phát hiện biết tiếng Nhật.
3. *"À..."* — dòng bark duy nhất của anh. Dùng cho **mọi** tình huống anh nhận thấy điều gì đó. Một âm. Thu 4 biến thể.
4. *"Cho em ổ bánh mì không thôi."* — ngày 29. **Nhỏ hơn bình thường nửa mức. Không run giọng.** Nếu VA đọc tội nghiệp thì hỏng.
5. *"Cảm ơn cô. Cô \<tên\> nha."* — ngày 40. Ngập ngừng ở chỗ gọi tên. 🟡 Xem §2.C về tên người chơi.

---

### NPC-11 · **BÀ SÁU** — gánh tàu hũ đi ngang hẻm

> Bà Sáu chịu **rủi ro rập khuôn thứ hai** sau bà Bảy (người bán hàng rong lớn tuổi). Luật riêng: **bà Sáu là ĐỒNG NGHIỆP, không phải nền cảnh.** Bà và người chơi cùng một nghề. Mọi cảnh có bà phải có ít nhất một chi tiết nghề nghiệp mà chỉ hai người bán hàng mới hiểu.

| | |
|---|---|
| **Tuổi** | 63 |
| **Nghề** | Gánh tàu hũ nước đường, đi tuyến cố định 5 hẻm, 2 vòng/ngày |
| **Nơi ở** | Nhà ở hẻm bên, đi bộ qua mỗi ngày |
| **Chỉ số** | `soi 0.4` / `nongTinh 0.3` / `deTha 0.8` / `thanThien 0.9` |

**Ngoại hình.** Nhỏ, chắc, **vai lệch một bên vì gánh 30 năm** — artist phải vẽ node vai bất đối xứng, và nó phải thấy được cả khi bà không gánh. Áo bà ba nâu, quần đen, khăn rằn vắt vai. Nón lá. Màu nhận dạng: **nâu + trắng ngà**.
- `prop_a`: **đôi quang gánh** — một đầu nồi tàu hũ, một đầu chén và nước đường.
- `prop_b`: **cái muỗng dẹt hớt tàu hũ** — động tác hớt của bà là chữ ký hình ảnh, giống động tác quạt vé số của bà Bảy.
- `prop_c`: từ ngày 35 — **ghế nhựa và cái bàn gấp**, không còn quang gánh. Xem arc.

**Hệ quả cụ thể của từng chỉ số:**

| Chỉ số | Hệ quả trong game với bà Sáu |
|---|---|
| `soi 0.4` | Bà không soi tay người chơi. **Bà soi quầy.** `STALL_CLEANLINESS` với bà có trọng số ×2.5 — bà là người bán hàng, bà biết chỗ nào ruồi đậu. Và bà **không chê, bà chỉ cho khăn**: *"Nè, lau cái đó đi con."* |
| `nongTinh 0.3` | Điềm. Không bao giờ bark to |
| `deTha 0.8` | Tha nhanh, nhớ chuyện vui lâu hơn chuyện buồn |
| `thanThien 0.9` | **Nút gossip mạnh thứ hai sau bé Su.** Bà đi 5 hẻm, bà nói chuyện với mọi người ở mọi hẻm |

**Đơn hàng quen (`REMEMBERED_USUAL`).** Bà hiếm khi mua — **bà ĐỔI**:
> *"Đổi hôn con? Chén tàu hũ lấy ổ bánh."*

**Đây là cơ chế riêng:** giao dịch với bà Sáu **không đi qua tiền**. Nó đi qua `ledger` như một dòng riêng kind `BARTER`. Hệ quả kinh tế: người chơi mất nguyên liệu, được một chén tàu hũ (hồi thể lực/tinh thần — thực chất là một `CARED_FOR_THEM` ngược, bà chăm sóc người chơi). Ai từ chối đổi hai lần → bà không hỏi nữa. Vĩnh viễn.

**Khẩu vị ẩn:**
1. **Bà thích ổ bánh mì không, nóng, không nhân.** Bà chấm nước đường. Người chơi sẽ nghĩ bà khách sáo nên gọi món rẻ — **không phải**, bà thích thật. Làm ổ đầy đủ cho bà = làm sai.
2. **Bà muốn được hỏi hôm nay bán được không.** Không phải hỏi thăm sức khoẻ. **Hỏi chuyện làm ăn.** Đó là cách hai người bán hàng nói chuyện với nhau. Cơ chế: `REMEMBERED_STORY` với bà chỉ bắn khi nội dung hỏi thăm thuộc nhóm `TRADE`, không thuộc nhóm `HEALTH`.
3. **Bà giấu chuyện đau chân.** Từ ngày 28 bà đặt gánh xuống sớm hơn, nghỉ lâu hơn. Bà **luôn nói là "nắng quá"**.

**Lịch sinh hoạt:**

| Ngày | Giờ | Ghi chú |
|---|---|---|
| **Mọi ngày** | **Vòng 1: ~8h50** · **Vòng 2: ~15h30** | Bà đi ngang, tiếng rao của bà là **chất liệu âm thanh mốc giờ** của game (xem P4-03 §2.5) |
| CN | Chỉ vòng sáng |
| Lệch lịch | Mưa: **bà trú dưới mái hiên nhà cô Mai** — đây là sự kiện nghe lỏm tốt nhất game (SK-05). Ngày 31–34: vòng 2 **mất dần**. Ngày 35: xem arc |

**Arc 40 ngày — "Bà Sáu đặt gánh xuống":**

| Mốc | Ngày | Chuyện gì xảy ra |
|---|---|---|
| **M1 — Đổi** | **Ngày 3** | Bà đề nghị đổi lần đầu. Người chơi chưa hiểu luật, có thể từ chối. Nếu từ chối → bà cười, đi. Ngày 6 bà hỏi lại **một lần nữa**. Từ chối lần hai → mất vĩnh viễn |
| **M2 — Thước đo** | ~**Ngày 19** (điều kiện: danh tiếng hẻm đủ) | **Mốc tiến trình đẹp nhất của game** (`idea.md` §19.2). Bà dẫn một người lạ tới và chỉ đường: *"Nhà tui gần chỗ bán tàu hũ á"* → đổi thành *"...à thôi, nói nhà tui gần **xe bánh mì cô Ba** cho dễ."* **Không có thanh progress, không có con số, không có popup.** Chỉ có một câu nói đổi. Xem P4-05 §2.6 |
| **M3 — Nắng quá** | **Ngày 28 → 34** | Vòng 2 của bà mất dần: ngày 28 trễ 20 phút, ngày 31 không có vòng 2, ngày 33 bà ngồi nghỉ ở ghế nhựa của xe **10 phút** (chưa từng), ngày 34 bà nhờ người chơi **giữ giùm cái gánh** 15 phút (xem P4-03 §2.4 — lớp "được tin giao") |
| **M4 — Cái bàn gấp** | **Ngày 35** | Bà **không gánh nữa**. Bà bán cố định ở đầu hẻm bên, có bàn gấp, có ghế. Bà không buồn — **bà khoe**: *"Ngồi một chỗ mà bán được y chang. Tui ngu ghê, làm chi cực ba chục năm."* Và bà cười. **Đây KHÔNG phải một mất mát. Đây là một NPC giải quyết được vấn đề của mình.** Cần có ít nhất một arc như vậy để §9.7 (tích cực ≥ tiêu cực) đúng ở tầng cảm xúc, không chỉ ở tầng đếm sự kiện |
| **M5 — Kết** | **Ngày 40** | Bà không đi ngang nữa (bà bán cố định chỗ khác). **Nhưng bà tới.** Bà đi bộ tới, không mang gì, và bà đổi lần cuối: *"Bữa nay tui hết tàu hũ. Đổi bằng cái gì giờ ta."* Rồi bà ngồi xuống ghế nhựa |

**Thứ hoàn toàn không liên quan tới nghề hay hoàn cảnh (L2):**
> **Bà Sáu có bằng lái xe tải.** Hồi 24 tuổi bà lái xe tải nhẹ chở hàng cho một vựa trái cây, chạy tuyến Sài Gòn – Mỹ Tho, **ba năm**. Bà bỏ vì có con. Bà vẫn giữ cái bằng trong bóp, đã hết hạn từ lâu, và bà **lôi ra cho người chơi coi ở ngày 22** với vẻ khoái chí. Bà có ý kiến về xe tải, về đường quốc lộ, và bà chê cách anh Dũng ôm cua.
> **Luật thi hành:** không bao giờ để chi tiết này biến thành *"giá mà hồi đó bà không bỏ nghề"*. Bà không tiếc. Bà chỉ thấy nó vui.

**Vai trò trong hệ gossip:** **nút TRUYỀN DẪN — degree cao, mutation trung bình cao, PHỦ NGOÀI HẺM.**
- Bà đi **5 hẻm**. `spread_reach` cao nhất về mặt địa lý. `mutation_rate` 0.35 (mức nền).
- **Bà kể cho:** cô Mai (hằng ngày), bà Bảy, chị Hạnh, và **các hẻm khác** (sinh ra khách vãng lai từ ngày 16).
- **Bà nhận tin từ:** tất cả.
- **Đặc điểm riêng — bà làm MỀM tin xấu.** Vì bà là đồng nghiệp, khi tin xấu về nghề đi qua bà, bà thêm một mệnh đề bào chữa: *"Mà bữa đó nó đông quá trời, tui thấy."* → `intensity` giảm 30%. **Bà là bảo hiểm nghề nghiệp của người chơi.** Mất quan hệ với bà Sáu = mất lớp bảo hiểm đó, và người chơi sẽ không bao giờ được thông báo về chuyện này.

**3–5 câu thoại đặc trưng:**
1. **[Tiếng rao]** *"Ai... tàu hũ nước đường hông..."* — kéo dài, lên ở giữa, tắt dần ở cuối. **Đây là một trong 3 âm thanh nhận diện của game.** Xem P4-03 §2.5.
2. *"Đổi hôn con? Chén tàu hũ lấy ổ bánh."* — nhanh, vui, đã hỏi cả trăm lần.
3. *"Nè, lau cái đó đi con."* — không chê, chỉ tay, đưa khăn.
4. *"Bữa nay bán được hôn con?"* — **câu hỏi mà hai người bán hàng hỏi nhau.** Không phải "khoẻ không".
5. *"Ngồi một chỗ mà bán được y chang. Tui ngu ghê, làm chi cực ba chục năm."* — ngày 35. **Cười. Phải cười.**

---

### NPC-12 · **CHÚ KIỆT** — xe bánh mì đối thủ bên kia hẻm

> CANON §9: *"Vừa là đối thủ vừa là người duy nhất hiểu nghề của bạn."* Và XĐ1.5: **kẻ gian dối vệ sinh là chú Kiệt, không phải người chơi.**
> **Luật riêng: chú Kiệt không bao giờ được làm phản diện.** Chú làm điều người chơi bị cấm làm, và chú có lý do mà người chơi hiểu được. Nếu người chơi ghét chú vào ngày 40 thì thiết kế đã thất bại.

| | |
|---|---|
| **Tuổi** | 46 |
| **Nghề** | Bán bánh mì xe đẩy, mở **ngày 5**, cách xe cô Ba 40m về phía đầu hẻm |
| **Nơi ở** | Không ở trong hẻm. Chú ở quận khác, đẩy xe tới |
| **Chỉ số** | `soi 0.7` / `nongTinh 0.6` / `deTha 0.3` / `thanThien 0.4` |

**Ngoại hình.** Người gọn, nhanh, **tay làm nhanh hơn người chơi** — animation của chú phải rõ ràng là thành thạo hơn. Áo thun polo có cổ, tạp dề **sạch sẽ ở mặt trước, dơ ở mặt hông** (chi tiết quan trọng: chú giữ cái người ta nhìn thấy). Màu nhận dạng: **xanh dương đậm**.
- `prop_a`: **xe đẩy mới hơn**, inox sáng, có đèn LED, có bảng menu in decal (**đối lập với bảng hiệu vẽ tay của cô Ba** — đây là toàn bộ chủ đề của game gói trong hai cái bảng).
- `prop_b`: **điện thoại có bảng tính** — chú ghi doanh thu.
- `prop_c`: **cái khăn vắt vai** mà chú dùng lau tay, lau bàn, và lau cả dao. Đây là `DIRTY_HANDS` của chú, thấy được từ xa.

**Hệ quả cụ thể của từng chỉ số:**

| Chỉ số | Hệ quả trong game với chú Kiệt |
|---|---|
| `soi 0.7` | `traitMul` = **1.14**. Chú thấy nhiều. **Và chú là người duy nhất hiểu ý nghĩa của cái chú thấy** — chú biết tại sao người chơi đặt hũ đồ chua ở đó, chú biết cái lò đó nướng không đều. Nhận xét của chú **chính xác về mặt nghề nghiệp**, và vì thế nó cắt sâu hơn mọi lời chê khác |
| `nongTinh 0.6` | Chú nói. Không chửi, nhưng **nói đúng lúc đông khách** |
| `deTha 0.3` | Nhớ dai. Chú nhớ ngày người chơi lấy mất một khách quen của chú |
| `thanThien 0.4` | Không thân. **Nhưng có một ngoại lệ:** trong 40 ngày có đúng **một buổi** chú và người chơi nói chuyện như hai người cùng nghề. Xem M3 |

**Đơn hàng quen.** Chú **không mua**. Nhưng chú có một thứ tương đương:
> Mỗi sáng khoảng 6h10, chú đẩy xe ngang, và chú **liếc vào lò của người chơi**. Nếu lò đã nóng, chú gật đầu một cái rất nhỏ. Nếu chưa, chú không gật.
> **Đó là `REMEMBERED_USUAL` của chú Kiệt.** Không có món ăn, chỉ có sự công nhận nghề nghiệp. Người chơi sẽ bắt đầu nhóm lò sớm hơn chỉ để được cái gật đầu đó, và game sẽ không bao giờ nói cho người chơi biết điều đó có ý nghĩa gì.

**Lịch sinh hoạt:**

| Ngày | Giờ | Ghi chú |
|---|---|---|
| **Ngày 1–4** | Không có mặt | |
| **Ngày 5 →** | Đẩy xe tới **6h10**, dọn về **~11h30**, mở lại **16h–19h** | Chú bán **nhiều giờ hơn người chơi**. Đây là áp lực nền |
| CN | Chú nghỉ. **Chủ Nhật là ngày người chơi bán được nhất — và người chơi sẽ tự hiểu tại sao** |
| Lệch lịch | Ngày 24 (mưa lớn): chú không dọn kịp, hàng hư. Ngày 25: chú bán đồ hôm trước — xem M2 |

**Arc 40 ngày — "Chú Kiệt và cái khăn":**

| Mốc | Ngày | Chuyện gì xảy ra |
|---|---|---|
| **M1 — Xe mới** | **Ngày 5** | Chú xuất hiện. Không chào, không gây sự. Chú chỉ **mở hàng và bán rẻ hơn 2.000₫**. Hệ quả: ngày 5–9, khách vãng lai giảm **25%**. Khách quen **không đổi** — đó là bài học kinh tế lớn nhất của game: *danh tiếng không bảo vệ bạn khỏi cạnh tranh về giá ở nhóm khách vãng lai, nhưng nó giữ nguyên nhóm khách quen* |
| **M2 — Cái khăn** | **Ngày 25** | Người chơi (và bà Bảy, và thầy Phúc) thấy chú **lau dao bằng cái khăn vắt vai**, rồi thấy chú **bán lại hàng hôm trước**. Người chơi có hai đường, **cả hai đều bằng hành động, không bằng thoại**: (a) **không làm gì** → chuyện tự lan qua bà Bảy, 3 ngày sau xe chú vắng; (b) **đem qua cho chú một hũ đồ chua mới** (vì chú hết hàng thật, không phải vì chú tham) → chú không cảm ơn, nhưng M3 mở khoá |
| **M3 — Hai người cùng nghề** | **Ngày 31** (chỉ mở nếu chọn (b)) | Một buổi chiều vắng. Chú qua, đứng cạnh xe người chơi, và **nói về nghề**: giá pate, lò nào tốt, cách giữ bánh giòn khi trời ẩm, chuyện chú từng làm công cho một lò bánh mì 9 năm. Chú nói **một câu duy nhất về bản thân** rồi thôi. Đây là 4 phút hay nhất về viết của cả game |
| **M4 — Chú thắng một trận** | **Ngày 36** | Chú gắn **bảng QR và máy POS**. Nếu người chơi **chưa** có QR (P4-05 §2.4) → 3 ngày liền mất khách trẻ. Đây là hệ quả kinh tế thật, không phải trừng phạt đạo đức. Chú thắng vì chú làm ăn giỏi, không vì chú gian |
| **M5 — Kết** | **Ngày 40** | Chú đẩy xe ngang lúc 6h10 như mọi ngày. Chú thấy lò nóng. **Chú gật đầu.** Rồi chú dừng lại — lần đầu trong 36 ngày — và nói một câu. Xem P4-04 §2.3 |

**Thứ hoàn toàn không liên quan tới nghề hay hoàn cảnh (L2):**
> **Chú Kiệt ráp mô hình Gundam.** Chú có một tủ kính ở nhà, chú ráp bằng tay, chú sơn bằng cọ nhỏ chứ không có airbrush, và chú theo dõi mấy nhóm mô hình trên mạng. Chi tiết này lộ ra **ở ngày 31** qua đúng một câu: chú lôi điện thoại ra khoe một tấm hình, giữa lúc đang nói chuyện làm ăn, và chú hơi ngượng về việc đó.
> **Luật thi hành:** chi tiết này chỉ xuất hiện ở nhánh (b). **Người chơi chọn cách đối xử với đối thủ, và phần thưởng là được biết ông ta là một con người.** Đó là cách game thưởng cho lòng rộng lượng mà không cần cộng một điểm nào.

**Vai trò trong hệ gossip:** **nút ĐỐI NGHỊCH — chú phát tin về người chơi, và chú NHẬN tin về người chơi từ ông Hải.**
- `spread_probability` 0.45 với **tin xấu**, 0.05 với tin tốt. Chú là nút duy nhất có độ lệch tiêu cực.
- `mutation_rate` 0.40, và chú mutate theo hướng nghề: `ORDER_DEFECT` → *"nó làm không tới, bánh nó nướng non"* (đổi từ đạo đức sang tay nghề — **kiểu nói xấu của người trong nghề**).
- **Chú nhận tin từ:** ông Hải (nhậu chiều — **đường rò rỉ nguy hiểm nhất**), khách vãng lai.
- **Chú KHÔNG nhận tin từ:** cô Mai (tường lửa), thầy Phúc, chú Tư.
- **Nếu M3 mở khoá:** `spread_probability` tin xấu của chú tụt từ 0.45 → **0.15**, vĩnh viễn. Người chơi không bao giờ được cho biết. Người chơi chỉ thấy cả hẻm bớt dò xét từ ngày 31, và không hiểu vì sao.

**3–5 câu thoại đặc trưng:**
1. *"Bánh mì nóng đây! Mười lăm ngàn thôi bà con ơi!"* — rao to, chuyên nghiệp, **át tiếng rao của người chơi**. Đây là áp lực âm thanh, không chỉ là cạnh tranh số.
2. *"Lò đó nướng không đều đâu. Bên trái nó yếu."* — nói đúng. Và chú nói mà không nhìn người chơi.
3. *"Ờ. Cảm ơn."* — ngày 25, nhánh (b). Cộc lốc. **Và đó là chú Kiệt cảm ơn thật.**
4. *"Tui làm công cho lò bánh chín năm. Chín năm mới dám ra riêng."* — ngày 31. Nói một lần. Không nói lại.
5. *"Nóng rồi hả."* — ngày 40, về cái lò. Ba chữ. Xem P4-04.

---

## 2.B. **CÔ BA** — mentor, chủ xe (ngoài danh sách 12)

| | |
|---|---|
| **Tuổi** | 64 |
| **Nghề** | Chủ xe bánh mì đầu hẻm, 26 năm. Trước đó là **thợ may áo dài** 12 năm |
| **Nơi ở** | Nhà đối diện nhà bà Bảy. Đó là lý do mối bất hoà 15 năm không né được |
| **Chỉ số** | **Không có.** Cô Ba **không chạy qua hệ perception**. Cô là mentor, không phải khách (§7.4) |

**Ngoại hình.** Nhỏ, tóc búi, **tay rất khéo** — animation tay của cô là bản "đúng" mà animation tay người chơi được so sánh với. Áo bà ba màu xanh cổ vịt bạc (`#4A6B6B`), tạp dề vải, dép lê. Đeo kính lão khi ghi sổ. Màu nhận dạng: **xanh cổ vịt**.
- `prop_a`: **cuốn sổ ghi tay, bìa da giả, chữ viết đẹp** — chữ của thợ may cũ. Đây là prop mang cả cơ chế "sổ tay cuối ngày" (phanh #2 của XĐ3).
- `prop_b`: **cây kéo cắt vải cũ** dùng để cắt giấy gói — cô chưa từng bỏ nó.
- `prop_c`: **con mèo mướp tên Bơ** ngủ trên nắp thùng đá. Bơ xuất hiện 60% số ngày, ngẫu nhiên, và **không có cơ chế gì cả**.
- Dáng: **đầu gối trái của cô yếu**. Node chân có lệch nhẹ khi cô đứng lâu. Không bao giờ nhắc tới bằng lời sau ngày 1.

**Vai trò cơ chế (§7.4 + XĐ1.4):**

| Chức năng | Chi tiết |
|---|---|
| **Sáng** | Cô đi chợ cùng người chơi (ngày 1–6), rồi để người chơi đi một mình (từ ngày 7). Cô **dạy giá**, không dạy công thức |
| **Đứng quầy** | Vài phút mỗi ngày. Chuyển `gaze` của **một** khách sang cô (§5.4). **Cô KHÔNG BAO GIỜ làm bánh thay người chơi** (§10) |
| **Người dạy vệ sinh** | XĐ1.4: cô buồn chứ không la. *"Bánh đó con để cô ăn."* — và **cô ăn thật**. Người chơi nhìn cô ăn ổ bánh mình làm hỏng. Đó là hình phạt |
| **Tối** | Đếm tiền, ghi sổ. **Sổ tay cuối ngày: 2–3 dòng chữ viết tay, không phán đúng sai** (phanh #2, XĐ3) |
| **Đốt vía** | Cô là người tin. Người chơi là người làm theo. Xem P4-05 §2.1 — tông trìu mến/tự trào, **không phải hệ ma thuật có tác dụng cơ học** |

**Arc 40 ngày — "Cô Ba và cái đầu gối":**

| Mốc | Ngày | Chuyện gì xảy ra |
|---|---|---|
| **M1 — Giao xe** | **Ngày 1** | Cô mổ gối tuần trước. Cô cần người đứng. **Cô không nói "tạm thời".** Không ai nói. |
| **M2 — Buông tay** | **Ngày 7** | Cô không đi chợ nữa. *"Con đi đi. Cô đứng coi xe."* Đây là lúc game gỡ bánh phụ |
| **M3 — Cô không xuống được** | **Ngày 18** | Cô không xuống xe cả ngày (nghĩa vụ "tiền thuốc" đến hạn — P4-02). Người chơi bán một mình lần đầu, **không có ai để hỏi**. Ngày khó nhất Hồi 2 |
| **M4 — Cô quyết định** | **Ngày 34** | Cô nói cô nghỉ hẳn. **Không bi luỵ.** *"Cô sáu mươi bốn rồi con. Cô bán hai mươi sáu năm. Đủ rồi."* Xem P4-04 §2.3 — đây là **sự kiện đóng lại được chọn làm chính** |
| **M5 — Dòng cuối** | **Ngày 40** | Cô viết dòng cuối vào sổ. Người chơi đọc được. Xem P4-04 §2.5 |

**Thứ không liên quan tới nghề (L2):** **Cô Ba từng may áo dài**, và cô vẫn còn cái thước gỗ, cái kéo, và một ý kiến rất gắt về đường tà. Khi cô nhìn người chơi rạch ổ bánh, cô **không nói về bánh** — cô nói: *"Đường dao phải một lần thôi con. Cắt hai lần là thấy liền."* Đó là lời của thợ may, không phải lời của người bán bánh mì.
Và cô **không ưa cải lương nữa** — cô từng đàn kìm trong nhóm đờn ca tài tử của hẻm. Cô bỏ 15 năm trước. Cô không nói tại sao.

**5 câu thoại đặc trưng:**
1. *"Con đi đi. Cô đứng coi xe."* — ngày 7. Nhẹ, dứt khoát.
2. *"Bánh đó con để cô ăn."* — **không giận, hơi buồn.** VA: đây là dòng khó nhất của nhân vật. Nếu nghe ra trách móc thì hỏng cả XĐ1.4.
3. *"Đường dao phải một lần thôi con. Cắt hai lần là thấy liền."*
4. *"Vía lành thì ở, vía dữ thì đi."* — bài khấn đốt vía. **Đọc nửa đùa.** Cô biết là mê tín. Cô vẫn làm.
5. *"Cô sáu mươi bốn rồi con. Cô bán hai mươi sáu năm. Đủ rồi."* — ngày 34. **Không run. Không nghẹn.**

---

## 2.C. **NGƯỜI CHƠI** — cháu cô Ba

| | |
|---|---|
| **Tuổi** | 24 |
| **Quan hệ** | Cháu ruột cô Ba (con của em gái cô) |
| **Tên** | 🟡 **Đề xuất: người chơi tự nhập, mặc định để trống.** Xem §9 |
| **Giới tính** | Người chơi chọn ở màn đầu. Ảnh hưởng đúng **một** thứ: **số lần bước qua lửa khi đốt vía (7 nam / 9 nữ) và tay cầm muối (tay trái nam / tay phải nữ)** — §14. Không ảnh hưởng gì khác |

**Ngoại hình.** Người chơi chọn từ 3 bộ tóc × 4 màu áo. Tạp dề là cố định (tạp dề của cô Ba, hơi rộng). **Bàn tay là bộ sprite chi tiết nhất trong game** — vì cả game là về việc người ta nhìn bàn tay đó.

**Vì sao người chơi ở đây — và LẰN RANH ĐỎ về nghề (§14.1):**

> **Cấm tuyệt đối:** narrative kiểu *"bán bánh mì tạm thời rồi thoát ra làm việc khác"*.
>
> **Bối cảnh được chốt:** người chơi vừa nghỉ việc ở một công ty (không nói rõ ngành, **không bao giờ nhắc lại sau ngày 2**) và về giúp cô Ba sau ca mổ gối. Trong 40 ngày, câu hỏi *"khi nào con về lại công ty"* được hỏi **đúng một lần, ở ngày 2, bởi cô Mai**, và người chơi không trả lời. Không ai hỏi lại.
>
> Ở ngày 34, khi cô Ba nói cô nghỉ hẳn, **lựa chọn không phải "ở lại hay đi"**. Lựa chọn là **ai sẽ giữ cái xe** (P4-04 §2.3). Không có ending nào trong game mô tả việc bán bánh mì như một thứ cần thoát khỏi.

**Người chơi được gọi bằng gì:**

| Ai | Gọi người chơi là |
|---|---|
| Cô Ba, bà Bảy, bà Sáu, thầy Phúc, ông Hải, chú Tư, cô Mai | **"con"** |
| Chú Kiệt | **"cô"/"cậu"** (giữ khoảng cách nghề nghiệp) — cho tới ngày 31 |
| Anh Dũng, chị Lan, chị Hạnh | **"em"** |
| Bé Su, anh Bảo | **"cô"/"chú"** (nhỏ hơn) |

> **Đây là lý do `idea.md` §19.5 nói không được dịch đại từ.** Bảng trên là **bản đồ quan hệ đầy đủ của người chơi trong hẻm**, và nó tồn tại hoàn toàn trong đại từ. Dịch hết thành "you" là xoá sạch bảng này. Xem P4-05 §2.8.

**"Chỉ số" của người chơi:** **không có.** Người chơi không có `soi`, `nongTinh`, `deTha`, `thanThien`. Người chơi có **hai tay, một cái lò, và trí nhớ của chính người ngồi trước màn hình.** Đó là toàn bộ nhân vật.

---

## 3. Dữ liệu & schema

```ts
type NpcId =
  | 'ba_bay' | 'chu_tu' | 'anh_dung' | 'chi_lan' | 'be_su' | 'ong_hai'
  | 'co_mai' | 'thay_phuc' | 'chi_hanh' | 'anh_bao' | 'ba_sau' | 'chu_kiet';

type Npc = {
  id: NpcId;
  displayName: string;          // "Bà Bảy" — dùng nguyên văn CANON §9
  age: number;
  job: string;
  personality: Personality;     // CANON §4 — BẤT BIẾN, có test khoá giá trị
  addressPlayerAs: 'con' | 'em' | 'cô' | 'chú' | 'cậu';
  playerAddressesAs: string;    // "bà Bảy", "chú Tư" — dùng cho WRONG_NAME

  usual: UsualOrder;
  hiddenTastes: HiddenTaste[];  // 2–3 cái, KHÔNG BAO GIỜ hiện trên UI
  schedule: ScheduleEntry[];
  arc: ArcBeat[];               // ≥3 mốc
  quirk: { key: string; reveals: ArcBeatId[] };   // L2 — bắt buộc, không null được

  gossip: {
    spreadProbability: number;        // 0..1
    spreadMultiplier: number;         // bé Su = 2.0
    maxHops: 2 | 3;                   // bé Su = 3, còn lại 2
    mutationRateByKind: Record<StimKind, number>;   // §12 ràng buộc 1: PER-KIND
    tellsTo: NpcId[];
    neverTellsTo: NpcId[];
    negativeBias?: number;            // chỉ chú Kiệt có
    softensNegative?: number;         // chỉ bà Sáu có (0.30)
    verifiesBeforeSpreading?: boolean;// chỉ chị Hạnh
  };

  art: {
    identityColor: string;            // hex
    baseBodies: string[];             // ông Hải có 2
    props: { id: string; showWhen: string }[];
    extraEyeStates?: string[];        // bà Bảy: 'squint_far'; anh Bảo: 'phone_dead'
  };

  voice: { region: 'nam' | 'bac'; notes: string };  // chị Hạnh là 'bac'
};
```

**Ví dụ JSON content thật** — `content/npcs/chu_tu.json` (rút gọn):

```json
{
  "id": "chu_tu",
  "displayName": "Chú Tư",
  "age": 54,
  "job": "Bảo vệ công ty in",
  "personality": { "soi": 0.3, "nongTinh": 0.3, "deTha": 0.9, "thanThien": 0.6 },
  "addressPlayerAs": "con",
  "playerAddressesAs": "chú Tư",

  "usual": {
    "sayLine": "Như mọi bữa nghen con.",
    "fullLineBeforeDay4": "Cho chú ổ đầy đủ, nhiều ớt, cho xin bịch.",
    "spec": {
      "base": "banh_mi",
      "fillings": ["thit", "pate", "cha_lua"],
      "veggies": ["do_chua_nhieu", "dua_leo", "hanh_la"],
      "chili": 3,
      "sauce": "normal",
      "packaging": "giay_plus_bich_rieng",
      "eatIn": false
    }
  },

  "hiddenTastes": [
    { "id": "cay_that",      "effect": "chili>=5 → arrivesEarlier(180s) nextDay", "neverSpoken": true },
    { "id": "bich_rieng",    "effect": "packaging!=bich_rieng → silentScore += 12", "neverSpoken": true },
    { "id": "bot_ot_tu_d22", "effect": "fromDay 22: spec.chili → 1; player matching → gazeUp(1s)", "neverSpoken": true }
  ],

  "schedule": [
    { "days": ["T2","T3","T4","T5","T6"], "time": "06:45", "jitterSec": 180 },
    { "days": ["T7","CN"], "absent": true },
    { "condition": "weather==rain", "timeShift": -300 },
    { "condition": "day in [26,29]", "time": "07:10", "note": "trễ, không giải thích" }
  ],

  "arc": [
    { "id": "M1", "dayRange": [1, 20], "beat": "hằng số 6h45" },
    { "id": "M2", "day": 22, "beat": "bớt ớt, không nói lý do", "telegraph": true },
    { "id": "M3", "day": 26, "beat": "than công ty dời chỗ", "telegraph": true,
      "line": "Công ty chú nó tính dời qua bên Bình Dương đó con.",
      "deliveryNote": "đọc như đang than thời tiết" },
    { "id": "M4", "day": 29, "beat": "mua nửa ổ", "telegraph": true },
    { "id": "M5", "day": 30, "beat": "VẮNG. Không sự kiện, không âm thanh, không thông báo." },
    { "id": "M6", "day": 33, "beat": "vợ chú ghé, mua 2 ổ, giải thích duy nhất" },
    { "id": "M7", "day": 40, "beat": "KHÔNG quay lại — chủ ý" }
  ],

  "quirk": { "key": "chim_chao_mao_sau_ngon", "reveals": ["SK-24"] },

  "gossip": {
    "spreadProbability": 0.30,
    "spreadMultiplier": 1.0,
    "maxHops": 2,
    "mutationRateByKind": { "ORDER_DEFECT": 0.10, "DROPPED_FOOD": 0.10, "WRONG_NAME": 0.10, "REMEMBERED_USUAL": 0.15 },
    "tellsTo": ["ong_hai", "anh_dung"],
    "neverTellsTo": ["chu_kiet"]
  },

  "art": {
    "identityColor": "#2E3A52",
    "baseBodies": ["base_body"],
    "props": [
      { "id": "non_bao_ve", "showWhen": "always" },
      { "id": "long_chim",  "showWhen": "event==SK-24" },
      { "id": "binh_nuoc",  "showWhen": "always" }
    ]
  },

  "voice": { "region": "nam", "notes": "trầm, gọn, không bao giờ to tiếng" }
}
```

**Test khoá giá trị (bắt buộc có trong CI):**

```ts
// content/npcs/__tests__/canon.lock.test.ts
const CANON_PERSONALITY: Record<NpcId, Personality> = { /* copy nguyên bảng CANON §9 */ };
it('không doc nào được đổi chỉ số tính cách', () => {
  for (const id of ALL_NPC_IDS) expect(loadNpc(id).personality).toEqual(CANON_PERSONALITY[id]);
});
it('mọi NPC phải có quirk (luật L2 chống rập khuôn)', () => {
  for (const id of ALL_NPC_IDS) expect(loadNpc(id).quirk?.key).toBeTruthy();
});
```

---

## 4. UI/UX hai thiết bị

| | **PC (ngang)** | **Mobile (v2, dọc)** |
|---|---|---|
| **Mặt NPC** | Khung trên, cao ~38% màn hình. Mắt phải đọc được ở 1080p | Khung trên, cao ~30%. **Mắt phóng to 1.4×** vì màn nhỏ |
| **Nhận dạng ai đang tới** | Bóng + màu nhận dạng hiện ở mép hẻm **trước** khi mặt rõ → người chơi có ~2 giây chuẩn bị | Chỉ có màu nhận dạng ở mép trên |
| **Sổ tay khách** | Panel phải, luôn mở được bằng `Tab` | Tab riêng, vuốt từ mép |
| **Tên NPC** | **Chỉ hiện trong sổ tay, KHÔNG hiện trên đầu NPC.** Vì `WRONG_NAME` là sự kiện flagship — nếu game hiện tên thì người chơi không bao giờ gọi sai | Như PC |
| **Chỉ số quan hệ** | **KHÔNG CÓ Ở ĐÂU CẢ** (T3). Sổ tay chỉ chứa **chữ người chơi tự gõ** + ngày ghé gần nhất | Như PC |

**Trang sổ tay của một NPC — đây là toàn bộ UI quan hệ trong game:**

```
┌──────────────────────────────────────┐
│  CHÚ TƯ                              │
│  ghé gần nhất: hôm nay, 6h45         │
│  ──────────────────────────────────  │
│  [ghi chú của bạn]                   │
│  > đầy đủ, nhiều ớt, bịch riêng      │
│  > 6h45 T2-T6. đúng giờ kinh khủng   │
│  > nuôi chim. tên Sáu Ngón???        │
│  > d22: bớt ớt??? ko nói gì          │
│  ──────────────────────────────────  │
│  [+ thêm ghi chú]                    │
└──────────────────────────────────────┘
```

Không có thanh. Không có sao. Không có màu tên. **Chỉ có chữ người chơi tự viết** — kể cả dòng `ghé gần nhất` cũng là dữ kiện, không phải đánh giá.

**Trợ năng riêng của doc này (§15):**
- Icon nhận dạng NPC phải **khác nhau về hình dáng**, không chỉ màu (nón bảo vệ / quang gánh / xấp vé số / ba lô…) — cùng luật với icon rau.
- Công tắc **"NPC nhớ nhầm / đổ oan"** tắt được → khi tắt, mọi `mutation_rate` trong doc này = 0, nhưng `spread_probability` giữ nguyên (tin vẫn lan, chỉ không méo).

---

## 5. Tham số cần tune

| Tham số | Khởi điểm | Khoảng | Cách đo |
|---|---|---|---|
| `traitMul` từ `soi` | 🔒 **`0.65 + 0.70 · soi`** — CANON §4, đã CHỐT, không tune | — | Kiểm tra chuẩn §5: `DROPPED_FOOD` trước bà Bảy (`QUEUE_3`) phải `CONFIRMED` trong **4–6 giây**; trước anh Bảo phải **không bao giờ** |
| `gazeFactor` anh Bảo | **0.05** | 0.03–0.10 | Nếu >0.10, sandbox học perception sụp |
| `gazeFactor` anh Bảo sau M3 (hết pin) | **0.80**, 20 giây | 15–30s | Playtest: 8/10 người phải nhớ được khoảnh khắc này khi được hỏi ở ngày 40 |
| `spread_multiplier` bé Su | **2.0** | 1.5–2.5 | Đo số khách vãng lai ngày 11–13 sau clip nổ. Mục tiêu **+40%** |
| `mutation_rate` chị Lan | **0.05** | 0.0–0.10 | Tin qua chị phải gần như không méo |
| `softensNegative` bà Sáu | **0.30** | 0.2–0.4 | So `reputation` cuối mùa của 2 build: có/không quan hệ với bà Sáu. Chênh lệch nên ~1 bucket |
| Số ngày chú Tư báo trước | **4** (ngày 22, 26, 29 + vắng 30) | 3–5 | **Tiêu chí XĐ3**: ≥7/10 playtester trả lời *"tôi đã có thể đoán ra"*, <2/10 trả lời *"game cướp của tôi"* |
| Độ dài khoảng trống chị Lan | **15 ngày** (24→39) | 12–18 | Nếu ngắn hơn 12, cú quay lại mất trọng lượng. Nếu dài hơn 18, người chơi quên chị |
| Số dòng thoại riêng / NPC | **~28** (v1) | 20–40 | Tổng ~520 dòng v1 (CANON §11): 12 NPC × 28 = 336 riêng + 184 pool generic |
| Tỉ lệ "nhận thấy mà im" của chị Lan | **0.85** | 0.75–0.92 | Mức nền toàn game là 0.35 (§11) |

---

## 6. Tiêu chí đạt

- [ ] **12 file JSON** trong `content/npcs/` load được, và **test khoá chỉ số CANON §9 xanh**.
- [ ] **Mọi NPC có `quirk` không rỗng** (L2). CI fail nếu thiếu một cái.
- [ ] Tìm trong toàn bộ content: **0 kết quả** cho mọi từ khoá liên quan chiến tranh (danh sách khoá ở P4-05 §2.7). CI chạy grep này mỗi commit.
- [ ] **Bà Bảy:** cho 10 người lạ chơi tới ngày 20, hỏi *"mô tả bà Bảy bằng 3 từ"*. **Nếu ≥3/10 nói "tội nghiệp" / "đáng thương" → nhân vật FAIL, viết lại.** Mục tiêu: ≥6/10 nhắc tới cải lương.
- [ ] **Ông Hải:** hỏi *"ông Hải là người thế nào?"* ở ngày 20. **Nếu ≥4/10 mô tả ông chỉ bằng chuyện nhậu → FAIL.** Mục tiêu: ≥6/10 nhắc tới việc ông khác nhau sáng/chiều.
- [ ] **Cô Mai:** ≥8/10 nhận ra cô khá giả mà **không** mô tả cô là người khoe của.
- [ ] **Anh Dũng:** ≥7/10 nhắc được việc anh từng là xe ôm. ≥5/10 nhắc tới cá.
- [ ] Người chơi phân biệt được **chị Lan và bà Bảy** ở tầng cơ chế: hỏi *"ai soi hơn?"* → chấp nhận cả hai đáp án, nhưng **≥8/10 phải nói được rằng một người nói ra và một người thì không**.
- [ ] Mỗi NPC có **≥3 mốc arc** đã implement và trigger đúng ngày trong 3 lần chạy liên tiếp với seed khác nhau.
- [ ] **T3 audit:** tìm trong toàn bộ UI — 0 thanh quan hệ, 0 con số điểm, 0 màu tên theo thiện cảm.
- [ ] VO: **12 giọng người thật**, trong đó **chị Hạnh do người Bắc thu** (không giả giọng).

---

## 7. Rủi ro & cách bịt

| Rủi ro | Mức | Cách bịt | Nối tới |
|---|---|---|---|
| **Bà Bảy trượt về khuôn mẫu đáng thương** | 🔴 Cao | Luật riêng ở đầu hồ sơ + tiêu chí đạt định lượng (≥3/10 nói "tội nghiệp" = viết lại). Ngày 35 (bà đi coi hát) là chốt chặn | `idea.md` §19.5 |
| **Ông Hải thành comic relief** | 🔴 Cao | Hai `base_body`. Dòng *"Hôm qua chú có nói gì bậy không con?"* bắt buộc có trong v1. Cấm mọi sự kiện mà punchline là ông say | §19.5 · §14.1 |
| **Người chơi học được "ẩu trước mặt anh Bảo thì không sao" rồi mang thói quen đó đi** | 🟠 | M3 (ngày 17, hết pin) + lỗ hổng (b) §8: anh vẫn vô tư kể lại | CANON §8 b, g |
| **Micro-cheat: bớt 1 lát chả với 100% khách suốt 40 ngày** | 🔴 Lỗ hổng lớn nhất (§8 g) | **Chị Lan đếm** (phát hiện ở lần 2) + **thầy Phúc nói theo pattern** (lần 4–5) + bark *"dạo này bánh nhạt hơn hay tại tao?"* | CANON §8 g |
| **Ông Hải → chú Kiệt là đường rò rỉ chết người, người chơi không biết** | 🟠 | Đúng ý đồ. Nhưng phải **nghe lỏm được** ít nhất 1 lần (SK-11) để người chơi có cơ hội suy ra | CANON §12 rb.4 |
| **12 NPC quá nhiều cho v1 / demo** | 🟠 | Thứ tự cắt khi cần: giữ **chú Tư, bà Bảy, thầy Phúc** (3 NPC vertical slice P1) → thêm chị Lan, bé Su, anh Dũng (P2 đợt 1) → phần còn lại | CANON §17 |
| **NPC nói chuyện nhà nhiều quá → trượt vào mô phỏng đời sống** | 🟠 | Đừng-1: mọi chuyện ngoài quầy chỉ được **NÓI RA + 1 prop**. Cấm mọi scene ngoài khúc hẻm | CANON §16 Đừng-1 |
| **Chị Hạnh thành trò đùa vùng miền** | 🔴 | Người chọc là **khách vãng lai vô danh**, không bao giờ là NPC có tên. Người chặn lại là ông Hải. Arc kết thúc ở chỗ chị thuộc về, không ở chỗ chị bị sửa | §14.1 "người Việt cười người Việt" |
| **Chú Kiệt thành phản diện → người chơi thấy game đang dạy đạo đức** | 🟠 | M3 (ngày 31). Và M4: **chú thắng một trận bằng cách làm ăn giỏi**, không bằng gian lận | XĐ1.5 |
| **Quá nhiều mất mát ở Hồi 3 → người chơi bỏ game** | 🔴 | Bà Sáu M4 là **arc giải quyết được vấn đề**, không phải mất mát. Bảng cân bằng đầy đủ ở P4-02 §2.6 | CANON §3 ghi chú §9.7 |

---

## 8. Truy vết

| Nội dung trong doc này | `CANON.md` | `idea.md` |
|---|---|---|
| Tên + 4 chỉ số của 12 NPC | **§9** (nguyên văn, bất biến) | §18 |
| 4 chiều tính cách và cách suy ra hành vi | §4 | §23 "6 chiều → 4" |
| `traitMul`, `gazeFactor`, bảng visibility | §5 | §9.x |
| `REMEMBERED_USUAL`, `REMEMBERED_STORY`, `CARED_FOR_THEM`, `FLOURISH` | §3.2 | — |
| `WRONG_NAME` salience 100, bỏ qua gaze | §3.1 | — |
| Delivery-diff `ANTICIPATED` / `DISCOVERED` | §6 | — |
| Cô Ba là mentor, không làm bánh thay | §7.4 · §10 | — |
| Vệ sinh: cô Ba buồn chứ không la; chú Kiệt là kẻ gian dối | §7 (XĐ1.4, XĐ1.5) | §17 XĐ1 |
| Trí nhớ 3 tầng, đồn thổi 6 ràng buộc, mutation graph | §12 | §18 |
| Lỗ hổng (b), (d), (g), (i) | §8 | §21 |
| Ngôn ngữ gọi món nguyên văn | §14 | §19.3 |
| **Chống rập khuôn: bà Bảy / ông Hải / cô Mai / anh Dũng** | §9 (ghi chú) | **§19.5** |
| Không dịch đại từ xưng hô | §2 | §19.5 |
| Layered sprite 18 file = 216 trạng thái | §16 Đừng-4 | — |
| Không mô phỏng đời sống NPC ngoài quầy | §16 Đừng-1 | — |
| Bảng màu xanh xám + nắng gắt trắng | §14 | §19.5 |
| Lằn ranh đỏ (chiến tranh, hạ thấp nghề) | §14.1 | §19.4 |
| Phanh XĐ3: báo trước 3–4 ngày, sổ tay cô Ba, cú quay lại ngày 40 | — | **§17 XĐ3** |
| Nguyên tắc kết game | §15 (cuối mục) | §20 (cuối mục) |
| "Được tin giao thứ quý giá" (bà Sáu ngày 34) | — | §11 (cuối mục) |

---

## 9. Đề xuất sửa CANON

**Đ1 — Bổ sung, không sửa: người chơi không có tên hiển thị.**
Đề xuất ghi vào CANON §2 (khối Ngôn ngữ / Đại từ xưng hô): *NPC gọi người chơi bằng đại từ quan hệ, không bao giờ bằng tên.* Lý do: (a) củng cố trực tiếp luật "không dịch đại từ" — nếu NPC gọi tên thì đại từ mất vai trò định vị quan hệ; (b) tiết kiệm toàn bộ chi phí VO chèn tên; (c) `WRONG_NAME` là sự kiện một chiều (người chơi quên tên NPC), nên việc NPC không gọi tên người chơi giữ cho cơ chế đó không bị đối xứng hoá.
**Ngoại lệ đề xuất:** đúng **hai** dòng trong cả game có gọi tên người chơi — anh Bảo ngày 40 và ông Hải ngày 3 — và cả hai dùng **tên người chơi tự nhập**, thu VO bằng cách để một khoảng lặng ở chỗ tên nếu người chơi không nhập. Nếu hội đồng không duyệt ngoại lệ này thì cắt cả hai dòng, arc vẫn đứng.

**Đ2 — Bổ sung §3: cho phép một `memory.kind` mới là `MISUNDERSTOOD`.**
Dùng riêng cho chị Hạnh (và cho bất kỳ `ORDER_DEFECT` nào có nguyên nhân là **khác biệt từ vựng vùng miền**). Lý do: nếu "bỏ nhầm hành lá thay ngò rí" đi vào cùng một kind với "cố tình ăn bớt nhân", thì arc hoà nhập của chị Hạnh **bị trừng phạt bởi chính hệ thống lẽ ra phải kể nó**. Kind mới decay theo `thanThien` thay vì `deTha`, và **không bao giờ được vào mutation graph** (tin đồn không được phép biến "hiểu nhầm giọng" thành "khinh người Bắc" — đó là vi phạm §14.1 gián tiếp).

**Đ3 — Ghi chú, không phải sửa:** CANON §9 mô tả anh Dũng là *"Luôn vội → dạy `MADE_THEM_WAIT`"* và *"Arc: đổi ca đêm giữa mùa"*. Doc này thi hành cả hai và bổ sung một hệ quả chưa có trong CANON: **anh là NPC duy nhất mà mưa làm TĂNG tần suất ghé**. Hệ quả này giúp bịt lỗ hổng (c) ở §8 (lịch mưa). Nếu hội đồng thấy đáng, thêm một dòng vào §8 mục (c).
