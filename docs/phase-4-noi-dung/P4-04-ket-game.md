# P4-04 — Kết game: ngày 40, cú quay lại, và những thứ không được giải thích

> ## ⚡ REVAMP 2026-10-20 — ☠️ CHẾT TOÀN BỘ
> Căn cứ: [`CANON.md`](../CANON.md) bản revamp + [`revamp/00-YEU-CAU.md`](../revamp/00-YEU-CAU.md). Phần ☠️ không dùng làm căn cứ.
>
> Cả doc dựng trên T3 + T4: cảnh ngày 40, cô Ba nghỉ hẳn, bảng tổng kết mùa, rẽ nhánh theo "ai còn ở đó", phán quyết NG+ theo T4. Thay bằng (R5 + R0.5): **thắng** = đủ mốc tiền → mở chi nhánh 2, tường review, biển hiệu mới; **thua** = ATTP → quán niêm phong, Phương Anh nộp lại CV.
>
> **Còn dùng được:** §2.5 mục 3 thứ tự credits (người Việt viết văn hoá đứng đầu — LR §14.1); nguyên tắc màn kết tử tế, không chế giễu nghề (CANON §15).

**Thuộc phase:** P4 — Nội dung
**Phụ thuộc:** `CANON.md` §1 (**T3** không hiện chỉ số quan hệ · **T4** một mùa có điểm kết) · §7.4 (cô Ba) · §14 (tiếng rao, sổ nợ) · §14.1 (lằn ranh đỏ) · **§15 (nguyên tắc kết game)** · P4-01 (dàn nhân vật) · P4-02 (lịch 40 ngày) · P4-03 (sự kiện, tiếng rao)
**Trạng thái:** **Chốt** nguyên tắc, cảnh ngày 40, sự kiện đóng lại, bảng tổng kết, phán quyết New Game+. **Cần đo** phản ứng playtest ở cảnh chị Lan. **Còn mở** 🟡 2 chỗ.

---

## 1. Mục tiêu

> 🔴 **Nguyên tắc tuyệt đối** — `CANON.md` §15 (cuối mục), `idea.md` §20 (cuối mục), nguyên văn:
> *"**Đừng làm ending dựa trên 'bạn đã làm tốt tới đâu'. Cho mọi ending đều tử tế, chỉ khác nhau về AI CÒN Ở ĐÓ VỚI MÌNH.**"*

Doc này thiết kế cái kết sao cho:
- **Không có ending "tệ". Chỉ có ending "khác".** Không có màn hình thua, không có xếp hạng, không có "bạn đạt 73%".
- **T3 được giữ tới dòng cuối cùng.** Màn hình tổng kết **không được hiện một chỉ số quan hệ nào** — đây là nơi cám dỗ vi phạm T3 lớn nhất trong cả dự án.
- **T4:** mùa đóng lại trọn vẹn. Không cliffhanger, không teaser phần 2, không "tiếp tục chơi".
- **Thi hành phanh #4 của phán quyết XĐ3** (`idea.md` §17) — **giữ nguyên, không sửa**: *"Chính cơ chế này là thứ sẽ làm anh khóc — nếu người đó quay lại ngày 40, không giải thích đi đâu, chỉ mua ổ bánh cuối cùng."* **Đó là trái tim của cả game.**
- Dùng **tiếng rao đang mất dần** (`idea.md` §19.3, bài *"Tiếng rao… lặng yên"*) làm chất liệu cảm xúc của cảnh cuối.

---

## 2. Cơ chế

### 2.1. Nguyên tắc: thiết kế để không có ending "tệ"

**Cách thông thường (và bị từ chối):**
```
if (reputation >= 80) → ending A "tốt"
else if (reputation >= 50) → ending B "trung bình"
else → ending C "buồn"
```
❌ Bị từ chối vì: (a) nó chính là *"ending dựa trên bạn đã làm tốt tới đâu"*; (b) nó đòi một `reputation` số, mà số đó phải hiện ra đâu đó để người chơi hiểu → **vi phạm T3**; (c) nó biến 40 ngày quan hệ thành một bài thi.

**Cách được chốt:**
```
Ending KHÔNG phải một nhánh được chọn.
Ending là DANH SÁCH NGƯỜI CÓ MẶT ở buổi sáng ngày 40.

Mỗi NPC trả lời độc lập MỘT câu hỏi:
    "Người này có ghé sáng ngày 40 không?"
Câu trả lời đến từ ARC của họ (P4-01) và từ hành động của người chơi (P4-03 §2.3).
Không có tổng. Không có ngưỡng. Không có so sánh.
```

**Ba hệ quả của cách này:**

| # | Hệ quả | Vì sao quan trọng |
|---|---|---|
| **1** | **Người chơi tệ nhất vẫn có ít nhất 6 người ghé.** Bà Bảy (`deTha 0.8`) luôn tới. Cô Ba luôn ở đó. Cô Mai luôn tới. Thầy Phúc luôn tới. Bà Sáu luôn tới. Chú Kiệt luôn đi ngang. **Chị Lan luôn quay lại** | Không có đáy. Không có màn hình *"cả hẻm đã bỏ bạn"* |
| **2** | **Người chơi giỏi nhất vẫn mất chú Tư.** Không có hành động nào giữ chú | Không có đỉnh. Không có "ending hoàn hảo" để tra wiki |
| **3** | **Khác biệt giữa hai lần chơi không phải nhiều/ít, mà là AI** | *"chỉ khác nhau về ai còn ở đó với mình"* — thi hành theo nghĩa đen |

**Cái tuyệt đối không có ở cuối game:**

| ❌ Không có | Vì sao |
|---|---|
| Màn hình *"Ending 3/7"* | Biến quan hệ thành bộ sưu tập |
| Phần trăm hoàn thành | T3 |
| Xếp hạng (S/A/B/C) | §15 |
| *"Bạn đã bỏ lỡ 2 nhân vật"* | Biến thiếu vắng thành lỗi của người chơi |
| Nhạc buồn khi ít người ghé / nhạc vui khi đông | §15 · "mọi ending đều tử tế" |
| Cảnh chú Tư quay lại nếu chơi giỏi | Phá phanh XĐ3 ngược: biến bi kịch thành phần thưởng |
| Teaser phần 2 / *"Mùa sau..."* | T4 |
| Nút "Tiếp tục chơi sau ngày 40" | T4 |

---

### 2.2. 🔴 CÚ QUAY LẠI NGÀY 40 — cảnh chi tiết

> `idea.md` §17 XĐ3, phanh #4 (nguyên văn): *"**Cú quay lại ngày 40** (David) — **giữ nguyên, không sửa. Đó là trái tim của cả game.**"*
> Điều kiện của David, nguyên văn: *"nếu người đó quay lại ngày 40, **không giải thích đi đâu, chỉ mua ổ bánh cuối cùng**."*

**Ba ràng buộc tuyệt đối của cảnh này:**

| # | Ràng buộc | Nếu vi phạm |
|---|---|---|
| **R1** | 🔴 **Chị Lan KHÔNG giải thích chị đi đâu.** Không một chữ. Không "em bận", không "em đổi chỗ làm", không "em có chuyện" | Cả cảnh sụp. Lời giải thích biến một con người thành một cái cốt truyện |
| **R2** | 🔴 **Chị mua ổ bánh CUỐI CÙNG.** Phải là ổ cuối thật — hết hàng sau đó | Nếu còn hàng, cảnh mất tính một-lần-duy-nhất |
| **R3** | 🔴 **Cảnh này xảy ra DÙ NGƯỜI CHƠI CHƠI THẾ NÀO.** Không điều kiện, không phần thưởng | Nếu là phần thưởng → trở thành "ending tốt" → vi phạm §15 |

**Thời điểm:** ngày 40, **10h20**. Sau giờ cao điểm. Sau khi mọi khách quen đã tới. Khi người chơi đang bắt đầu dọn.

**Dựng cảnh — nguyên văn:**

```
10h18   Hẻm vắng. Nắng gắt trắng đã lên. Bóng đổ ngắn lại.
        Tiếng quạt lò còn chạy. Không còn tiếng rao nào.
        Trên khay: CÒN MỘT Ổ.

10h20   Một bóng người ở đầu hẻm.
        Màu xanh phấn nhạt.  ← màu nhận dạng của chị Lan (P4-01 NPC-04)
        Camera KHÔNG zoom. KHÔNG cắt cận. Không có nhạc.
```

Chị đi tới. Chị **mặc đồ thường**, không phải sơ mi công sở. Chị **không đeo thẻ nhân viên**. Chị **không mang túi tote**.
Chị đứng ở `FRONT_CENTER` — vị trí chị đã đứng suốt 23 ngày.

Và chị nói:

> **CHỊ LAN:** *"Còn ổ nào không em?"*

*(Đây là dòng thoại đắt nhất của dự án. Nếu chỉ thu được một dòng VO hoàn hảo trong cả game, thu dòng này. Không run giọng. Không nghẹn. Đọc như một người hỏi mua bánh mì.)*

**Người chơi làm gì:** làm ổ bánh. **Không có ô lựa chọn thoại.** Không có nút "hỏi chị đi đâu". T2 được giữ tới giây cuối cùng.

**Và đây là chỗ 40 ngày được trả về:**

| Người chơi làm | Chị Lan |
|---|---|
| 🔴 **Làm đúng: chả lụa, không ớt, không hành, gói mang về, đồ chua ráo nước, 4 lát chả** | Chị nhìn ổ bánh. Một giây rưỡi. Rồi chị nói: *"...Em còn nhớ."* — **`nongTinh 0.1`, nên câu này rất nhỏ.** Rồi chị cười. **Đây là lần duy nhất trong cả game chị Lan cười** |
| **Làm sai một thứ** (có hành, hoặc 3 lát chả) | Chị nhận. Chị không nói gì. Chị trả tiền. **Không có hình phạt nào.** Cảnh vẫn diễn ra trọn vẹn |
| **Hỏi lại chị ăn gì** (bấm vào chị) | Chị nói lại đơn hàng, đầy đủ, đều, như ngày 1. Rồi chị nhận bánh và đi. **Không ai trách người chơi.** Nhưng người chơi sẽ biết |

**Sau khi nhận bánh:**

> **CHỊ LAN:** *"Cảm ơn em."*

Chị trả tiền. **Chị đưa đúng tiền, không chờ thối** — chi tiết này đã được gieo từ ngày 21 (P4-02 §2.5 B-B).
Chị quay đi. Đi được bốn bước, chị **dừng lại**, và chị nói, **không quay đầu**:

> **CHỊ LAN:** *"Em bán ở đây tới chừng nào?"*

Người chơi **không trả lời được** (T2). Có một khoảng lặng **3 giây**.
Rồi chị đi tiếp. Ra khỏi khung hình.

> 🔴 **Câu *"Em bán ở đây tới chừng nào?"* là câu duy nhất trong game mà người chơi muốn trả lời và không thể.** Đó là chủ ý. Nó cũng là câu hỏi mà cả game đã hỏi người chơi trong 40 ngày.
> 🟡 **Còn mở:** có nên để người chơi trả lời bằng một hành động không (ví dụ: gói thêm một bịch đồ chua đưa theo)? Đề xuất **KHÔNG** — im lặng ở đây mạnh hơn. Quyết định sau playtest.

**Và sau khi chị đi:**

```
Khay trống.
Cô Ba, đang ngồi ghế nhựa, nói MỘT câu:
```
> **CÔ BA:** *"Hết rồi hả con."*

Không phải câu hỏi. Không có dấu hỏi trong phụ đề.

**Nếu người chơi hết hàng TRƯỚC 10h20** (quyết định mua hàng ở ngày 39 — P4-03 SK-40):

> 🔴 **Đây là ràng buộc thiết kế tinh vi nhất của cả game.**
>
> Chị Lan vẫn tới. Chị vẫn hỏi *"Còn ổ nào không em?"*. **Và không còn.**
> Người chơi phải nói không — bằng cách **lắc đầu** (một animation, không phải một dòng thoại).
> Chị gật. Chị nói: *"Dạ. Không sao đâu em."* — **một trong hai lần duy nhất chị dùng câu này trong cả game** (lần kia ở P4-01 NPC-04, câu thoại #3).
> Rồi chị đi.
>
> **Đây KHÔNG phải một ending tệ.** Cô Ba vẫn nói *"Hết rồi hả con."* và câu đó vẫn đúng. Màn hình kết vẫn ghi chị Lan **có mặt**. Cái khác duy nhất: người chơi không đưa được ổ bánh.
> **Và người chơi sẽ nhớ điều đó lâu hơn bất cứ thứ gì trong game.**
>
> Tần suất dự kiến: ~20% người chơi rơi vào nhánh này ở lần chơi đầu. Đó là con số đúng.

**Chỉ đạo âm thanh cho cảnh này (P4-03 §2.5):**
- Vào cảnh: chỉ còn **tiếng quạt lò**.
- Khi chị nói: **không thêm gì**.
- Khi chị đi: người chơi **tắt lò** (hành động của người chơi, không tự động). Tiếng quạt chậm lại rồi tắt.
- Sau đó: **hẻm trống, thu thật, 40 giây.** Không nhạc.
- **Nếu người chơi từng dùng tiếng rao** (P4-03 §2.5): ở giây thứ 12 của khoảng lặng, một đoạn tiếng rao của chính người chơi vang lên **rất khẽ** — không phải diegetic, không phải echo. Một lần. Rồi thôi.
- **Nếu người chơi chưa bao giờ rao:** khoảng lặng giữ nguyên 40 giây. **Cũng đúng.**

---

### 2.3. SỰ KIỆN ĐÓNG LẠI — chọn "cô Ba nghỉ hẳn" làm chính

> `idea.md` §12.2 đưa ba lựa chọn: *"Kết thúc bằng một sự kiện đóng lại: **hẻm bị giải toả / cô Ba nghỉ hẳn / bạn truyền xe lại cho người khác**."*

**Phán quyết: chọn CÔ BA NGHỈ HẲN. Hai cái kia thành biến thể.**

| Phương án | Chọn? | Lý do |
|---|---|---|
| 🔴 **Cô Ba nghỉ hẳn** | ✅ **CHÍNH** | (1) **Nó là chuyện của một người, không phải chuyện của một thế lực.** Kết thúc phải đến từ nhân vật mà người chơi quan tâm nhất, không từ một sự kiện bên ngoài. (2) **Nó không đụng lằn ranh nào.** (3) Nó đã được gieo từ ngày 1 (cô mổ gối) và ở mỗi mốc arc của cô. (4) **Nó giữ được cái hẻm.** Hẻm còn, xe còn, người còn — chỉ có một người dừng lại. Đó là loại kết thúc mà §15 đòi hỏi: *tử tế, chỉ khác về ai còn ở đó*. (5) Nó mở ra câu hỏi *"ai giữ cái xe"* — câu hỏi duy nhất mà người chơi được quyết |
| **Hẻm bị giải toả** | ⚠️ **Biến thể phụ, KHÔNG dùng làm chính** | 🔴 **Rủi ro lằn ranh:** giải toả là một chủ đề xã hội nhạy cảm, có thật, đang diễn ra, và liên quan tới chính sách. Một game do người nước ngoài đọc sẽ đọc nó thành phát ngôn chính trị. Và nó **hạ thấp nghề** gián tiếp (nghề này bị xoá sổ bởi một lực lớn hơn). **Chỉ dùng như một tin đồn không xác nhận** — xem dưới |
| **Truyền xe lại cho người khác** | ⚠️ **Biến thể — là HỆ QUẢ của phương án chính** | Nó không phải một sự kiện đóng lại riêng; nó là **cái xảy ra sau** khi cô Ba nghỉ. Dùng làm **nhánh của ngày 40** |

---

#### **SK-34 · CÔ BA NÓI CÔ NGHỈ HẲN** — ngày 34, buổi tối

Buổi tối. Cô Ba ngồi đếm tiền, như 33 buổi tối trước. Nhưng cô **không mở sổ**.

> **CÔ BA:** *"Con ngồi xuống cô nói cái này."*
> *(một nhịp)*
> *"Cô sáu mươi bốn rồi con. Cô bán hai mươi sáu năm. Đủ rồi."*
> *"Cái gối cô nó không có khá hơn đâu. Bác sĩ nói rồi mà cô không chịu nghe."*
> *(cô cười)*
> *"Cô định nói từ bữa mổ lận. Mà cô thấy con làm được, nên cô để coi thêm."*

**VA:** không run, không nghẹn, không thở dài. **Cô đã quyết từ lâu và cô nhẹ nhõm.** Nếu đọc như một bi kịch thì hỏng toàn bộ §14.1 (hạ thấp nghề) — cô không bị ép nghỉ, cô **chọn** nghỉ, và 26 năm đó là một sự nghiệp, không phải một bản án.

Rồi cô nói câu quan trọng nhất:

> **CÔ BA:** *"Ngày mốt cô nói với mấy người trong hẻm. Còn cái xe... con tính sao thì tính."*

**Không có ô lựa chọn.** Không có menu "Nhận xe / Từ chối". Người chơi có **6 ngày** (34 → 40) và **quyết định bằng hành động**:

| Người chơi làm gì trong ngày 35–39 | Hệ thống đọc thành | Ngày 40 |
|---|---|---|
| **Vẫn mua hàng cho ngày mai, mỗi ngày, kể cả ngày 39** | Ở lại | Cô Ba đưa **cây kéo cắt vải** (`prop_b` của cô — P4-01 §2.B) cho người chơi ở cuối ngày |
| **Mua ít dần, ngày 39 mua rất ít** | Dừng lại | Ngày 40 bán hết sớm. Cô Ba **giữ cây kéo**. Cô nói: *"Ừ. Con về nghỉ đi."* |
| **Ngày 39 mua nhiều hơn bình thường** | Ở lại, và có ý định | Cô Ba **không nói gì** cả ngày 40 cho tới dòng cuối trong sổ |
| 🟡 **Nói với chú Kiệt về cái xe** (đem một ổ qua ngày 36–39, chỉ mở nếu SK-32 đã xảy ra) | Truyền xe lại | Ngày 40, chú Kiệt **dừng lại** và nói câu ở dưới |

> 🔴 **KHÔNG có nhánh nào là sai.** Người chơi bỏ nghề cũng tử tế. §14.1 cấm narrative *"bán bánh mì tạm thời rồi thoát ra làm việc khác"* — và nhánh "dừng lại" được viết cẩn thận để **không phải là thoát ra**: nó là **một người dừng một việc**, và game không bình luận.

---

#### Biến thể 1 — **"Hẻm bị giải toả"**: chỉ tồn tại như một TIN ĐỒN không xác nhận

Từ ngày 26, xuất hiện một tin trong hệ gossip, **và nó không bao giờ được xác nhận**:

> **Cô Mai** (nghe lỏm ngày 28, trước tiệm): *"Nghe nói mấy hẻm bên kia người ta đo đạc gì đó."*
> **Bà Sáu** (ngày 31): *"Ai nói vậy?"*
> **Cô Mai:** *"Tui đâu biết. Nghe nói vậy thôi."*

Tin này đi **đúng 2 hop rồi chết** (§12 cap). Nó **không bao giờ xuất hiện lại**. Nó không có trong màn hình kết. Nó không ảnh hưởng một cơ chế nào.

**Vì sao vẫn giữ nó:** vì đó là cách tin đồn về chuyện lớn thật sự vận hành trong một cái hẻm — người ta nghe, người ta kể, rồi người ta quên, và rồi hoặc có hoặc không. **Và vì nó cho người chơi trải nghiệm một nỗi lo mà hoá ra không xảy ra**, đúng bốn ngày trước khi một nỗi mất mát thật xảy ra (chị Lan, ngày 24 — à không, trước đó; xem lịch: tin này ở ngày 28, sau chị Lan, trước chú Tư ngày 30).
🔴 **Cấm tuyệt đối:** không một dòng nào trong game xác nhận, phủ nhận, hay bình luận về chuyện giải toả. Không có nhân vật nào nói chuyện chính sách. Không có cảnh nào có người mặc đồng phục nhà nước.

---

#### Biến thể 2 — **"Truyền xe lại"**: nhánh chú Kiệt, ngày 40

Chỉ mở nếu: SK-11 chọn nhánh (b) → SK-32 đã xảy ra (ngày 31) → người chơi đem bánh qua cho chú Kiệt ít nhất 1 lần trong ngày 36–39.

Ngày 40, 6h10, chú Kiệt đẩy xe ngang. Lò của người chơi đã nóng. **Chú gật đầu** — như 35 buổi sáng trước.
Rồi chú **dừng lại**. Lần đầu trong 36 ngày.

> **CHÚ KIỆT:** *"Nóng rồi hả."*
> *(một nhịp)*
> *"Nghe nói bà Ba nghỉ."*
> *(một nhịp dài hơn)*
> *"Cái xe đó tốt. Đừng bán ve chai."*

Rồi chú đi. Chú không hỏi người chơi có định bán không. Chú không đề nghị mua.
**Đây là cách một người đàn ông 46 tuổi bán bánh mì nói rằng ông ta tôn trọng bạn.**

🟡 **Còn mở:** có nên cho một nhánh mà người chơi thật sự giao xe cho chú Kiệt không? **Đề xuất KHÔNG.** Việc giao xe cho đối thủ là một cái kết quá gọn ghẽ, quá "viết lách". Để câu *"Đừng bán ve chai"* đứng một mình mạnh hơn.

---

### 2.4. BẢNG TỔNG KẾT CUỐI MÙA — cái gì hiện, cái gì tuyệt đối không

> **Đây là nơi T3 dễ bị vi phạm nhất trong cả dự án.** Mọi game đều kết thúc bằng một bảng số. Game này không được.

**❌ TUYỆT ĐỐI KHÔNG HIỆN:**

| Không hiện | Vì sao |
|---|---|
| Chỉ số quan hệ, thanh tình cảm, điểm tin tưởng, bucket (`Rival`/`Acquaintance`/`Friend`) | **T3.** Nếu 40 ngày kết thúc bằng việc lật bài cho xem con số, thì cả 40 ngày đó người chơi đã đúng khi nghi ngờ rằng có một con số |
| Tổng doanh thu, lợi nhuận, xếp hạng tài chính | Biến game về quan hệ thành game quản lý ở giây cuối |
| Số ổ bánh đã bán, số lỗi đã phạm, thống kê | Giống. Và *"bạn đã làm rớt 4 ổ bánh"* là một lời phán xét |
| % hoàn thành · achievement chưa mở · "bạn đã bỏ lỡ" | §15 |
| Bảng "các ending khác" | Biến quan hệ thành bộ sưu tập |

**✅ CÁI ĐƯỢC HIỆN — bốn phần, theo đúng thứ tự:**

---

#### **Phần 1 — AI CÒN GHÉ** (không có tiêu đề, không có chữ nào giới thiệu)

Sau khoảng lặng 40 giây, màn hình chuyển sang **khung hẻm lúc chiều**, vẽ tĩnh, và **những người đã ghé sáng hôm đó xuất hiện trong khung hình, ở đúng chỗ họ hay đứng.**

```
   [khung hẻm, nắng xiên, 16h]

   bà Bảy ngồi ghế nhựa, tai nghe một bên
   cô Mai đứng trước tiệm, tay chống hông
   thầy Phúc dựa xe đạp vào tường
   bà Sáu ngồi cạnh bàn gấp bên kia
   bé Su giơ điện thoại
   anh Bảo (KHÔNG cầm điện thoại)
   chị Hạnh cầm máy ảnh
   anh Dũng, mũ bảo hiểm ĐỂ TRÊN GHẾ
   ...

   [chỗ trống nơi chú Tư hay đứng — không tô đậm, không đánh dấu]
   [ông Hải không có — nhưng BẢNG HIỆU ông vẽ thì có, trong khung]
```

- **Người có mặt được vẽ. Người không có mặt thì không.** Không có bóng mờ, không có dấu `?`, không có tên gạch ngang.
- **Không có danh sách chữ.** Chỉ có một khung hình.
- **Chỗ trống của chú Tư không được đánh dấu.** Nếu người chơi nhận ra, họ nhận ra. Nếu không, không sao.
- Khung hình này **được vẽ tay bởi artist**, một lần, với ~14 lớp bật/tắt được. Chi phí: một khung art.

---

#### **Phần 2 — SỔ TAY CỦA NGƯỜI CHƠI, ĐƯỢC ĐỌC LẠI**

> Đây là phần thay thế cho bảng chỉ số. **Nó không chứa một dữ liệu nào do game sinh ra.**

Màn hình lật qua **sổ tay khách** — cuốn sổ mà chính người chơi đã gõ vào từ ngày 11 (SK-21, thầy Phúc đưa cây bút). Từng trang, từng người, **theo thứ tự người chơi ghi chú lần đầu**.

```
┌──────────────────────────────────────┐
│  CHÚ TƯ                              │
│  ghi lần đầu: ngày 3                 │
│  ghé lần cuối: ngày 29               │
│  ──────────────────────────────────  │
│  > đầy đủ, nhiều ớt, bịch riêng      │
│  > 6h45 T2-T6. đúng giờ kinh khủng   │
│  > nuôi chim. tên Sáu Ngón???        │
│  > d22: bớt ớt??? ko nói gì          │
└──────────────────────────────────────┘
```

- **Chữ là chữ của người chơi.** Kể cả lỗi chính tả, kể cả dấu hỏi, kể cả câu bỏ dở.
- Game chỉ thêm **hai dòng dữ kiện**, không đánh giá: `ghi lần đầu` và `ghé lần cuối`.
- **Trang của người chơi không ghi gì thì trống.** Không có chữ "Không có ghi chú". Trống là trống.
- Người chơi **lật được**, tốc độ do họ. Không tự chạy (§15 luật 1: *text không bao giờ tự chạy tiếp*).

> 🔴 **Đây là lý do SK-21 (cây bút của thầy Phúc) tồn tại.** Toàn bộ bảng tổng kết của game là một cuốn sổ do người chơi tự viết. Nếu người chơi không ghi gì trong 40 ngày, màn hình kết của họ **trống** — và đó là một cái kết hợp lệ, tử tế, và rất buồn theo một cách mà không con số nào làm được.

---

#### **Phần 3 — CHỐT SỔ NỢ VỚI CÔ MAI**

Một trang, ngắn. Cô Mai lật cuốn sổ caro của cô (`prop_b`, P4-01 NPC-07).

| Tình huống | Cảnh |
|---|---|
| **Người chơi ghi sổ đầy đủ, số khớp** | Cô đọc con số. Cô gật đầu. *"Ừ. Khớp."* Hai người trả nhau tiền. Hết |
| **Lệch dưới 100.000₫** | Cô nhíu mày một giây, rồi: *"Thôi kệ. Chắc tui ghi sót."* — **cô nhận phần lỗi về mình dù không phải lỗi cô** |
| **Lệch nhiều, hoặc người chơi gần như không ghi** | Cô nhìn cuốn sổ trống. Cô **xé trang đó ra** và nói: *"Thôi con. Coi như huề."* |

> **Cả ba đều tử tế** (§15). Khác biệt duy nhất: người chơi **biết mình đã làm gì**. Cô Mai không trách, không giảng giải, không cộng trừ gì vào một chỉ số nào. Và đó chính xác là thứ làm nhánh thứ ba khó chịu hơn hai nhánh kia.

---

#### **Phần 4 — CÔ BA VIẾT DÒNG CUỐI**

Màn hình cuối. Cuốn sổ bìa da giả của cô Ba, mở ở trang cuối. Chữ viết tay (font viết tay **vẽ riêng, không mua**).

Cô đã ghi 40 buổi tối. Người chơi đã đọc 39 dòng. Đây là dòng thứ 40.

**Dòng cuối được chọn từ một bảng nhỏ — không theo điểm, mà theo MỘT dữ kiện duy nhất: ai còn ghé.**

| Điều kiện (chỉ một, không cộng dồn) | Dòng cuối của cô Ba |
|---|---|
| **Mặc định** (luôn đúng, dùng khi không khớp nhánh nào dưới) | *"Bữa nay bán hết.*<br>*Cô ngồi coi con dọn.*<br>*Cô không nhớ hồi cô hai mươi bốn tuổi cô có làm được như vậy không."* |
| **Chị Lan nhận được ổ bánh cuối, và người chơi làm đúng đơn** | *"Bữa nay có cô bé hay mua chả lụa ghé.*<br>*Lâu rồi không thấy.*<br>*Cô thấy con nhớ ổ của người ta. Vậy là được rồi con."* |
| **Chị Lan tới mà hết hàng** | *"Bữa nay có cô bé hay mua chả lụa ghé, mà hết bánh rồi.*<br>*Cô thấy con đứng nhìn theo hoài.*<br>*Không sao đâu con. Ngày mai người ta còn đi ngang mà."* |
| **Người chơi đã nhận cây kéo (ở lại)** | *"Cô đưa con cây kéo của cô.*<br>*Cây đó cô cắt vải hai mươi năm trước khi cô bán bánh mì.*<br>*Con giữ đi. Cắt giấy cũng được."* |
| **Người chơi dừng lại** | *"Cô nói con về nghỉ.*<br>*Bốn chục bữa cũng là lâu rồi.*<br>*Mai mốt rảnh ghé cô chơi, đừng ghé mua."* |
| **Chú Kiệt dừng lại nói chuyện** | *"Thằng Kiệt bên kia nó có ghé nói chuyện.*<br>*Cô tưởng nó không ưa mình.*<br>*Cô già rồi mà cô còn đoán sai người ta."* |
| **Sổ tay người chơi trống hoàn toàn** | *"Cô hỏi con nhớ hết người ta hông.*<br>*Con nói nhớ.*<br>*Ừ. Cô cũng không ghi gì hồi cô mới bán."* |

> **Không một dòng nào trong bảng này khen hay chê người chơi.** Đó là điều kiện để nó được duyệt.
> Cô ký tên ở cuối. Rồi cô đóng sổ. **Màn hình tối. Credits.**

---

### 2.5. Màn hình kết và CREDITS

**Sau dòng cuối của cô Ba:**

1. **Một tấm ảnh.** Đen trắng, hạt phim, hơi lệch khung — **tấm ảnh chị Hạnh chụp bằng máy film ngày 40** (P4-01 NPC-09 M6, và cuộn phim ở P4-03 §2.4 mục 5). Nội dung tấm ảnh: **cái xe bánh mì, nhìn từ đầu hẻm, với bảng hiệu**.
   - Nếu SK-29 chọn nhánh **ông Hải vẽ** → trong ảnh là **cái bảng chữ tay hơi run**.
   - Nếu chọn nhánh **decal** → là cái bảng in.
   - **Không có chữ nào giải thích sự khác biệt này.**
   - 🟡 Nếu người chơi chọn nhánh "đi ăn cưới" (SK-39): thay bằng **tấm ảnh chụp chung ở đám cưới**, có người chơi trong khung, mắt nhắm, vì đó là ảnh film.

2. **Một dòng chữ duy nhất, tiếng Việt, không dịch:**
   > *"Cảm ơn cô, chú, anh, chị — và con."*

   (Đây là câu duy nhất trong game chơi trên hệ đại từ ở cấp meta. Trong bản tiếng Anh, **nó không được dịch** — chỉ có một chú thích nhỏ bên dưới, như đã hứa ở đầu game. Xem P4-05 §2.8.)

3. 🔴 **CREDITS — lằn ranh đỏ §14.1:**
   > *"Người Việt viết văn hoá phải đứng **ĐẦU** credits, không phải dòng 'cultural consultant' ở cuối."*

   Thứ tự bắt buộc:
   ```
   1. VIẾT VĂN HOÁ VÀ LỜI THOẠI      ← người Việt, tên đầy đủ, ĐỦ DẤU
   2. LỒNG TIẾNG                      ← 13 người thật, tên + nhân vật
   3. CỐ VẤN NGHỀ                     ← 3–5 chủ xe bánh mì đã phỏng vấn (P4-05 §2.10)
   4. ... phần còn lại
   ```
   Mọi tên tiếng Việt **viết đủ dấu**, font hỗ trợ dấu chồng dấu (§15). **Không viết hoa toàn bộ.**

4. **Sau credits:** màn hình đen, một nút duy nhất: **"Về menu chính"**.
   ❌ Không có "Chơi tiếp". ❌ Không có "New Game+". ❌ Không có teaser.

---

### 2.6. 🔴 NHỮNG THỨ KHÔNG BAO GIỜ ĐƯỢC GIẢI THÍCH

Danh sách này là **ràng buộc thi hành**. Bất kỳ ai thêm một dòng giải thích cho một mục dưới đây đều đang làm hỏng game.

| # | Thứ | Ai sẽ đòi giải thích | Câu trả lời |
|---|---|---|---|
| **1** | 🔴 **Chị Lan đi đâu trong 15 ngày** | Mọi người | **Không.** Phanh #4 XĐ3 ghi rõ: *"không giải thích đi đâu"* |
| **2** | 🔴 **Mối bất hoà 15 năm giữa bà Bảy và cô Ba** | Playtester, reviewer, và chính đội ngũ | **Không.** `idea.md` §19.5: *"cãi nhau chuyện gì đó từ 15 năm trước và hai người không ai chịu nhắc lại"*. **"Không ai chịu nhắc lại" bao gồm cả game.** Sự thật nội bộ có trong P4-01 để writer viết nhất quán, và nó **không bao giờ lên màn hình** |
| **3** | **Lý do chú Tư bớt ớt từ ngày 22** | Người chơi kỹ tính | Không. Có thể suy ra (chú cũng bỏ nhậu chiều). Không bao giờ xác nhận |
| **4** | **Người áo cam (SK-26) chuyển đi đâu** | — | Không. Người đó chưa bao giờ có tên |
| **5** | **Cô Ba có bao giờ đàn kìm lại không** | — | Không. Cô chỉ nhìn cây kéo, không nhìn cây đàn |
| **6** | **Chuyện giải toả có thật không** | Reviewer | **Không, và đây còn là vấn đề lằn ranh.** Xem §2.3 biến thể 1 |
| **7** | **Người chơi sau ngày 40 làm gì** | Publisher | **Không.** T4: ship trọn vẹn, có điểm kết. Không teaser |
| **8** | **Số điện thoại / họ tên đầy đủ / tuổi chính xác của NPC ngoài những gì đã ghi** | — | Không. §16 Đừng-1: chỉ mô phỏng sâu hơn cái người chơi nhìn thấy **đúng một tầng** |

---

### 2.7. ĐIỀU KIỆN RẼ NHÁNH — dựa trên AI CÒN Ở ĐÓ, không dựa trên tiền hay điểm

**Cấu trúc:** 12 câu hỏi độc lập, mỗi câu một NPC. **Không có tổng, không có ngưỡng, không có so sánh giữa các NPC.**

```ts
type EndingState = {
  presentOnDay40: NpcId[];          // ai xuất hiện trong khung hình Phần 1
  lanGotLastBanhMi: boolean;        // ổ bánh cuối có tới tay chị Lan không
  lanOrderCorrect: boolean;         // làm đúng đơn của chị hay không
  playerStays: 'o_lai' | 'dung_lai' | 'chua_ro';
  kietStopped: boolean;
  signboardIsHandPainted: boolean;
  debtBookState: 'khop' | 'lech_nhe' | 'trong';
  notebookEntries: number;          // số ghi chú NGƯỜI CHƠI tự gõ
  usedStreetCall: boolean;          // đã từng rao chưa
};
// KHÔNG CÓ: reputation, money, score, rank, completionPercent
```

**Bảng rẽ nhánh đầy đủ — mỗi dòng độc lập:**

| NPC | Có mặt ngày 40 nếu | Không có mặt nếu | Ghi chú |
|---|---|---|---|
| **Bà Bảy** | **Luôn luôn** | — | Mở hàng lần cuối. `deTha 0.8` |
| **Cô Mai** | **Luôn luôn** | — | Chốt sổ |
| **Thầy Phúc** | **Luôn luôn** | — | Tới 6h00, mua 2 ổ |
| **Bà Sáu** | **Luôn luôn** | — | Đi bộ tới, không mang gì |
| **Chú Kiệt** | **Luôn đi ngang** (gật đầu) | — | **Dừng lại nói chuyện** chỉ nếu SK-32 + đem bánh qua ngày 36–39 |
| 🔴 **Chị Lan** | **LUÔN LUÔN QUAY LẠI** | — | **Vô điều kiện.** R3 của §2.2 |
| **Chú Tư** | **KHÔNG BAO GIỜ** | Luôn | Không có hành động nào thay đổi. Chủ ý tuyệt đối |
| **Anh Dũng** | Nếu đã mua **đèn ca tối** (SK-23) **hoặc** đã có `REMEMBERED_STORY` với anh (SK-15 nhánh trà đá) | Nếu cả hai đều không | Nếu có mặt: tắt app, **để mũ xuống ghế** |
| **Bé Su** | Nếu **không** chọn "che tay" ở SK-12 **hoặc** đã có ≥3 `FLOURISH` trước mặt bé | Nếu bé không quay clip nào cả mùa | Nếu có mặt: **xin phép trước khi quay** |
| **Ông Hải** | **Không có mặt** (về Bình Dương ngày 38) | Luôn | **Nhưng bảng hiệu ông vẽ có mặt** nếu SK-29 chọn nhánh (b) |
| **Chị Hạnh** | Nếu đã đạt mốc M5 (chữ *"nghen"*) trước ngày 36 | Nếu chưa | Nếu có mặt: chụp tấm ảnh cuối. **Nếu không: tấm ảnh ở màn hình kết là ảnh cô Ba chụp bằng điện thoại, mờ, lệch — và đó cũng đẹp** |
| **Anh Bảo** | Nếu ML-12 (ngày 29) chọn *"làm đúng và làm ngon"* **hoặc** ML-11 (dạy khẩu vị) đã xảy ra | Nếu ngày 29 chọn "lén bỏ pate" | Nếu có mặt: **không cầm điện thoại**, gọi tên người chơi |

**Số biến thể thực tế:** 5 NPC có điều kiện (anh Dũng, bé Su, chị Hạnh, anh Bảo, chú Kiệt) × 2 trạng thái = **32 tổ hợp khung hình**, cộng 3 biến thể bảng hiệu / ảnh / kéo. **Chi phí:** một khung art với 14 lớp bật/tắt. Không phải 32 khung.

**Sàn và trần:**
- **Sàn tuyệt đối:** 6 người luôn có mặt (bà Bảy, cô Mai, thầy Phúc, bà Sáu, chú Kiệt, chị Lan) + cô Ba. **Không ai chơi ra được một ngày 40 cô đơn.**
- **Trần tuyệt đối:** 11/12 người. **Chú Tư không bao giờ có.**

> Đây là toàn bộ nội dung của *"mọi ending đều tử tế, chỉ khác nhau về ai còn ở đó với mình"*, viết ra thành bảng.

---

### 2.8. NEW GAME+ — phán quyết: **KHÔNG**

> **T4** (CANON §1): *"Một mùa có điểm kết. 40 ngày. **Ship trọn vẹn.** Không Early Access, không daily login, không stamina, không cây chết khi offline."*

**Phán quyết: KHÔNG có New Game+. Không có vòng lặp nào sau ngày 40.**

**Lý do — bốn cái, theo thứ tự quan trọng:**

| # | Lý do | Giải thích |
|---|---|---|
| **1** | 🔴 **NG+ phá huỷ chính cơ chế lõi** | Giá trị của cả game nằm ở chỗ **người chơi không biết ai sẽ đi và khi nào**. Ở lần chơi thứ hai, người chơi biết chú Tư đi ngày 30. Họ sẽ **tối ưu hoá 29 ngày cuối cùng với chú** — và khoảnh khắc đó biến từ *mất mát* thành *quản lý tài nguyên*. Phanh XĐ3 chỉ hoạt động một lần trên mỗi người. NG+ là một cơ chế **phá huỷ tài sản chính của sản phẩm** |
| **2** | **NG+ đòi một trục tiến bộ mang qua** — tiền, thiết bị, hoặc quan hệ | Mang tiền/thiết bị qua → vòng kinh tế (§13) rỗng ngay ngày 1. Mang quan hệ qua → **vi phạm T3 trực tiếp**, vì "quan hệ mang qua" phải được lưu thành một con số và con số đó phải hiện ra để người chơi hiểu mình được gì |
| **3** | **Người chơi CHƠI LẠI vẫn được, chỉ là không có cơ chế thưởng cho việc đó** | Nút "Chơi lại" có trong menu chính. Lần chơi thứ hai **khác thật** (32 tổ hợp ngày 40, 6 điểm rẽ ở P4-03 §2.3, nhánh chú Kiệt, arc chị Hạnh). Nhưng game **không thúc** người chơi làm việc đó. Sự khác biệt là quà, không phải nhiệm vụ |
| **4** | **Ship được** | NG+ là một hệ thống phải thiết kế, cân bằng, test, và nó luôn được làm cuối cùng bằng ngân sách còn thừa. `idea.md` §23 cắt co-op, cắt mobile, cắt 24 sự kiện còn 10. **NG+ thuộc cùng danh mục đó** |

**Cái được làm thay:**

| Thay vì | Làm |
|---|---|
| New Game+ | **Nút "Chơi lại"** ở menu chính. Xoá sạch. Bắt đầu ngày 1. Không mang gì |
| Endless mode | ❌ Không. T4 |
| Achievement chạy qua nhiều lần chơi | ⚠️ **Có, nhưng ít** — và không cái nào đòi chơi lại. Achievement dựa trên **khoảnh khắc**, không dựa trên tích luỹ. Tên achievement dùng tục ngữ: **"Quen mặt đắt hàng"** (P4-05 §2.6) |
| "Bạn đã gặp 9/12 nhân vật" | ❌ **Không.** Đây chính là thứ biến quan hệ thành bộ sưu tập |
| 🟡 Chế độ "ngày rảnh" (sandbox, không có arc) | **Cân nhắc cho bản cập nhật sau phát hành, KHÔNG cho v1.** Nếu làm, nó phải là một chế độ **riêng biệt hoàn toàn**, mở từ menu chính, **không** là phần thưởng sau khi hoàn thành mùa — vì "phần thưởng sau khi hoàn thành" là chính xác cấu trúc mà T4 từ chối |

> **Và một điều cần nói thẳng với publisher:** T4 cấm Early Access, daily login, stamina. **NG+ là cùng một họ cơ chế**: nó tồn tại để kéo dài thời gian chơi, không để kể thêm chuyện gì. Game này bán $9.99 cho **~7 giờ chơi có kết** (P4-02 §5.1). Đó là một món hàng hoàn chỉnh. Kéo dài nó bằng NG+ không làm nó tốt hơn; nó chỉ làm cái kết yếu đi.

---

## 3. Dữ liệu & schema

```ts
type EndingState = {
  // ===== DỮ KIỆN — ai còn ở đó =====
  presentOnDay40: NpcId[];
  lanReturned: true;                 // hằng số. Luôn true. Không phải biến
  lanGotLastBanhMi: boolean;
  lanOrderCorrect: boolean;
  playerStays: 'o_lai' | 'dung_lai' | 'chua_ro';
  kietStopped: boolean;
  signboard: 've_tay_run' | 'in_decal';
  finalPhoto: 'hanh_film' | 'co_ba_dien_thoai' | 'dam_cuoi';
  debtBook: 'khop' | 'lech_nhe' | 'trong';
  notebookEntries: number;
  usedStreetCall: boolean;
  keptTheScissors: boolean;

  // ===== CẤM =====
  // reputation?: never
  // money?: never  (tiền có trong ledger, nhưng KHÔNG được đọc ở màn hình kết)
  // score?: never
  // rank?: never
  // completionPercent?: never
  // npcAffection?: never
};

// CI — thi hành T3 ở màn hình kết:
const BANNED = ['reputation','score','rank','affection','trust','completionPercent','tier','bucket'];
it('EndingState không chứa chỉ số quan hệ nào (T3)', () => {
  for (const k of Object.keys(sampleEndingState()))
    expect(BANNED.some(b => k.toLowerCase().includes(b))).toBe(false);
});
it('chị Lan luôn quay lại, không điều kiện (R3)', () => {
  for (const save of ALL_TEST_SAVES) expect(computeEnding(save).lanReturned).toBe(true);
});
it('chú Tư không bao giờ có mặt ngày 40', () => {
  for (const save of ALL_TEST_SAVES) expect(computeEnding(save).presentOnDay40).not.toContain('chu_tu');
});
it('sàn: luôn có >= 6 NPC có mặt', () => {
  for (const save of ALL_TEST_SAVES) expect(computeEnding(save).presentOnDay40.length).toBeGreaterThanOrEqual(6);
});
it('không màn hình kết nào có nhạc khác nhau theo số người có mặt', () => {
  expect(new Set(ALL_TEST_SAVES.map(s => endingMusicTrack(s))).size).toBe(1);
});
```

**`content/days/day-40.json`** (rút gọn):

```json
{
  "day": 40, "weekday": "T6", "weather": "xanh_xam_sang_nang", "act": 4,
  "customerTarget": { "total": 12, "peakConcurrent": 2 },
  "absent": ["chu_tu", "ong_hai"],
  "__absent_note": "chú Tư: vĩnh viễn, chủ ý. ông Hải: về Bình Dương ngày 38. KHÔNG ĐƯỢC THÊM ĐIỀU KIỆN NÀO CHO PHÉP CHÚ TƯ QUAY LẠI.",

  "scriptedEvents": ["SK-41-KIET-GAT-DAU", "SK-42-LAN-QUAY-LAI", "SK-43-SO-CUOI"],
  "soundPlan": {
    "0600": ["rao_xe_dao_R3", "xe_may", "ga_ga_xa"],
    "0700": ["loa_kiet_R2_TAT_SOM"],
    "0850": [],
    "__note_0850": "TRỐNG. Tiếng rao bà Sáu (R1) đã mất từ ngày 35. Không thay bằng gì.",
    "1020": ["quat_lo"],
    "1035": ["im_lang_40s", "rao_nguoi_choi_neu_da_tung_rao"]
  },

  "lastLoaf": {
    "reservedFor": "chi_lan",
    "__note": "Nếu người chơi bán hết trước 10h20, KHÔNG tự động giữ lại một ổ. Nhánh 'hết hàng' là nhánh hợp lệ và quan trọng. Tần suất mục tiêu ~20%."
  }
}
```

**`content/lines/co_ba_dong_cuoi.json`** — bảng dòng cuối:

```json
{
  "concept": "CO_BA_DONG_CUOI",
  "rules": [
    { "id": "keo", "criteria": ["keptTheScissors == true"], "score": 1,
      "text": "Cô đưa con cây kéo của cô.\nCây đó cô cắt vải hai mươi năm trước khi cô bán bánh mì.\nCon giữ đi. Cắt giấy cũng được." },

    { "id": "lan_dung", "criteria": ["lanGotLastBanhMi == true", "lanOrderCorrect == true"], "score": 2,
      "text": "Bữa nay có cô bé hay mua chả lụa ghé.\nLâu rồi không thấy.\nCô thấy con nhớ ổ của người ta. Vậy là được rồi con." },

    { "id": "lan_het_hang", "criteria": ["lanGotLastBanhMi == false"], "score": 1,
      "text": "Bữa nay có cô bé hay mua chả lụa ghé, mà hết bánh rồi.\nCô thấy con đứng nhìn theo hoài.\nKhông sao đâu con. Ngày mai người ta còn đi ngang mà." },

    { "id": "kiet", "criteria": ["kietStopped == true"], "score": 1,
      "text": "Thằng Kiệt bên kia nó có ghé nói chuyện.\nCô tưởng nó không ưa mình.\nCô già rồi mà cô còn đoán sai người ta." },

    { "id": "so_trong", "criteria": ["notebookEntries == 0"], "score": 1,
      "text": "Cô hỏi con nhớ hết người ta hông.\nCon nói nhớ.\nỪ. Cô cũng không ghi gì hồi cô mới bán." },

    { "id": "dung_lai", "criteria": ["playerStays == 'dung_lai'"], "score": 1,
      "text": "Cô nói con về nghỉ.\nBốn chục bữa cũng là lâu rồi.\nMai mốt rảnh ghé cô chơi, đừng ghé mua." },

    { "id": "mac_dinh", "criteria": [], "score": 0,
      "text": "Bữa nay bán hết.\nCô ngồi coi con dọn.\nCô không nhớ hồi cô hai mươi bốn tuổi cô có làm được như vậy không." }
  ],
  "__note": "Chấm điểm theo ĐỘ CỤ THỂ (CANON §11, Elan Ruskin), không theo mức độ 'tốt'. Rule score cao thắng. KHÔNG cộng dồn nhiều dòng — chỉ MỘT dòng cuối."
}
```

---

## 4. UI/UX hai thiết bị

| Phần | PC | Mobile (v2) |
|---|---|---|
| **Cảnh chị Lan (10h20)** | Toàn màn hình khung hẻm. **Không UI nào hiện** — ẩn cả đồng hồ, cả sổ tay, cả nút rao. Chỉ còn bàn làm bánh | Như PC. Ẩn toàn bộ thanh trên |
| **Khoảng lặng 40 giây** | **Người chơi vẫn điều khiển được** (dọn quầy, xếp ghế, tắt lò). Không ép ngồi xem. Ai muốn bỏ qua thì **bấm bất cứ nút nào** → sang màn kết | Chạm bất cứ đâu |
| **Phần 1 — khung hẻm** | Tĩnh. Người chơi **rê chuột** qua từng người → tên họ hiện nhỏ ở góc. **Không có gì khác hiện ra** | Chạm vào từng người → tên |
| **Phần 2 — sổ tay** | Lật từng trang bằng `←` `→`. **Không tự chạy** (§15 luật 1) | Vuốt |
| **Phần 3 — sổ nợ** | Một trang | Một trang |
| **Phần 4 — dòng cuối** | Chữ viết tay hiện ra **theo tốc độ viết tay**, ~2,5 ký tự/giây, **và có nút bỏ qua hiện tốc độ đầy đủ ngay** | Như PC |
| **Credits** | Cuộn, có nút tạm dừng, có nút tua nhanh, **có nút "đọc lại credits" ở menu chính** | Như PC |
| **Sau credits** | Một nút: **"Về menu chính"** | Một nút |

**Trợ năng bắt buộc ở màn hình kết (§15):**
- **Cỡ chữ 4 mức áp dụng cho sổ tay và dòng cuối.** Hộp thoại **nền đục**. Hộp **tự giãn** khi chữ ≥200%.
- **Text không bao giờ tự chạy tiếp.** Dòng cuối của cô Ba chờ người chơi bấm.
- **Chữ viết tay phải có công tắc "dùng font thường"** — chữ viết tay là chữ khó đọc nhất với người loạn thị. Công tắc này **bắt buộc**, không phải tuỳ chọn.
- **Giảm chuyển động:** tắt hiệu ứng lật trang, tắt hạt phim trên tấm ảnh, tắt fade.
- **Tắt âm báo tiêu cực** không ảnh hưởng gì ở đây — **vì không có âm báo nào ở màn hình kết.** Không có sting. Không có nhạc buồn.
- **Pause được** kể cả giữa khoảng lặng 40 giây.

> 🔴 **CANON §8.1 L2** (*cấm hiện `certainty` dạng số hoặc thanh trong bản bán ra*) áp dụng luôn ở màn hình kết: không được "tổng kết lại" những gì khách đã nhận thấy dưới dạng số.
>
> 🔴 **Luật UI quan trọng nhất của toàn bộ doc:** ở màn hình kết, **không một pixel nào hiện một con số về quan hệ**. Nếu ai đó đề xuất "chỉ một dòng thống kê nhỏ thôi" — câu trả lời là không, và lý do là T3 đã được giữ suốt 40 ngày và vi phạm nó ở phút cuối còn tệ hơn là không bao giờ có nó.

---

## 5. Tham số cần tune

| Tham số | Khởi điểm | Khoảng | Cách đo |
|---|---|---|---|
| Giờ chị Lan xuất hiện | **10h20** | 10h00–10h45 | Phải **sau** khi mọi khách quen đã tới và **trước** khi người chơi dọn xong |
| Khoảng lặng trước khi chị xuất hiện | **~18 phút game** (sau khách cuối) | 12–25 | Đủ để người chơi tin rằng ngày đã hết |
| Thời gian chị nhìn ổ bánh trước khi nói *"...Em còn nhớ."* | **1,5 giây** | 1,0–2,2 | Playtest: ≥7/10 nhận ra đó là một nhịp có chủ ý |
| Khoảng lặng sau *"Em bán ở đây tới chừng nào?"* | **3 giây** | 2–5 | Nếu dài hơn 5s, người chơi tưởng game treo |
| Im lặng cuối (hẻm trống, thu thật) | **40 giây** | 25–60 | ≥7/10 ngồi hết mà không bấm bỏ qua |
| Tần suất nhánh "hết hàng trước 10h20" | **~20%** người chơi lần đầu | 12–30% | Điều chỉnh bằng số khách buổi sáng ngày 40 và gợi ý mua hàng ngày 39. **Không được ép về 0** |
| Số lớp bật/tắt của khung hẻm Phần 1 | **14** | — | 12 NPC + bảng hiệu + ghế trống |
| Tốc độ viết tay dòng cuối | **2,5 ký tự/giây** | 2–4 | Có nút hiện ngay |
| Số dòng cuối của cô Ba | **7** | 5–9 | Chọn theo độ cụ thể, không theo "tốt" |
| Số tổ hợp khung hình ngày 40 | **32** (5 NPC điều kiện) | — | Không tăng. 32 tổ hợp ≠ 32 khung art |

---

## 6. Tiêu chí đạt

- [ ] 🔴 **Test T3 xanh:** `EndingState` không chứa trường nào khớp danh sách cấm. Grep toàn bộ màn hình kết → **0 chỉ số quan hệ, 0 điểm, 0 phần trăm, 0 xếp hạng**.
- [ ] 🔴 **Test R3 xanh:** `lanReturned === true` trên **100% save test**, kể cả save của người chơi tệ nhất (cố ý phạm mọi lỗi 40 ngày).
- [ ] 🔴 **Test sàn xanh:** mọi save có **≥6 NPC** ở `presentOnDay40`.
- [ ] 🔴 **Test chú Tư xanh:** `presentOnDay40` **không bao giờ** chứa `chu_tu`.
- [ ] **Test nhạc xanh:** chỉ **một** track ở màn hình kết, không đổi theo số người có mặt.
- [ ] **Chơi 3 save khác nhau** (tệ nhất / trung bình / tốt nhất) → **cả ba màn hình kết đều tử tế.** Cho 10 người xem cả ba, hỏi *"cái nào là ending xấu?"* → **≥7/10 trả lời "không có cái nào xấu"**. Nếu ≥4/10 chỉ được một cái là xấu → **thiết kế fail, viết lại dòng cuối của nhánh đó.**
- [ ] 🔴 **Cảnh chị Lan:** quay màn hình 10 người lạ. **≥6/10 phải có phản ứng cảm xúc nhìn thấy được** (ngừng thao tác, ngả người ra, thốt ra tiếng, im lặng >3 giây). Đây là tiêu chí nghiệm thu của **phanh #4 XĐ3** và của cả dự án.
- [ ] **Cảnh chị Lan:** hỏi sau đó *"chị ấy đi đâu?"* → **≥8/10 trả lời "không biết"**, và **≤2/10 tỏ ra bực vì không được biết**. Nếu >2/10 bực → **thêm tín hiệu ở ngày 19–23 (P4-02 §2.5 B-B), KHÔNG thêm lời giải thích ở ngày 40.**
- [ ] **Nhánh hết hàng:** cho 5 người chơi vào nhánh này. Hỏi *"bạn thấy game đối xử với bạn thế nào?"* → **0/5 được phép dùng từ mang nghĩa bị phạt.**
- [ ] **Sổ tay Phần 2:** ≥7/10 người chơi đọc hết sổ tay của mình mà không bỏ qua.
- [ ] **Người chơi không ghi gì:** chạy một save với `notebookEntries = 0`. Màn hình kết phải **chạy trọn vẹn, đẹp, và không có một chữ nào trách người chơi**.
- [ ] **Credits:** người Việt viết văn hoá **ở dòng đầu tiên**. Mọi tên tiếng Việt **đủ dấu**, render đúng ở cỡ chữ 200%. Không viết hoa toàn bộ.
- [ ] **Sau credits: một nút duy nhất.** Grep → 0 kết quả cho "New Game+", "Continue", "Season 2", "Coming soon".
- [ ] **Không giải thích:** 8 mục ở §2.6 được kiểm tra thủ công trên toàn bộ content trước khi khoá bản.
- [ ] Công tắc **"dùng font thường thay chữ viết tay"** hoạt động ở cả sổ tay cô Ba và dòng cuối.

---

## 7. Rủi ro & cách bịt

| Rủi ro | Mức | Cách bịt | Nối tới |
|---|---|---|---|
| 🔴 **Ai đó thêm "một dòng thống kê nhỏ thôi" vào màn hình kết** | **Cao nhất** | Test T3 trong CI + `EndingState` không có trường để đọc + ghi chú trong file. **Đây là cám dỗ lớn nhất của cả dự án** | CANON **T3** |
| 🔴 **Ai đó biến cú quay lại của chị Lan thành phần thưởng** ("chị chỉ quay lại nếu bạn chơi tốt") | **Cao nhất** | Test R3: `lanReturned === true` trên 100% save. Ràng buộc R3 ghi trong file day-40.json | `idea.md` §17 XĐ3 phanh 4 · §15 |
| 🔴 **Ai đó thêm nhánh chú Tư quay lại** | Cao | Test: `presentOnDay40` không chứa `chu_tu`. Ghi chú `__absent_note` trong JSON | §2.7 |
| 🔴 **Ai đó viết lời giải thích cho chị Lan** ("em đổi chỗ làm rồi") | Cao | R1. Và tiêu chí nghiệm thu: ≤2/10 bực vì không được biết. **Cách sửa khi fail là thêm tín hiệu ở ngày 19–23, không phải thêm lời** | `idea.md` §17 XĐ3 |
| 🔴 **Ai đó giải thích mối bất hoà 15 năm** | Cao | §2.6 mục 2. Sự thật nội bộ nằm ở P4-01 **để writer viết nhất quán**, và được đánh dấu *"KHÔNG BAO GIỜ HIỆN TRONG GAME"* | `idea.md` §19.5 |
| 🔴 **"Hẻm bị giải toả" được dùng làm sự kiện chính** | **Lằn ranh** | Phán quyết §2.3: **không.** Chỉ tồn tại như tin đồn chết sau 2 hop. Cấm mọi dòng bình luận chính sách, cấm mọi nhân vật mặc đồng phục nhà nước | §14.1 |
| **Cô Ba nghỉ hẳn bị đọc thành "nghề này không nuôi nổi người"** | **Lằn ranh** | VA đọc SK-34 **nhẹ nhõm, không bi kịch**. Cô nghỉ vì **tuổi và đầu gối**, sau **26 năm**, và cô gọi đó là *"Đủ rồi"*. Không một dòng nào nói nghề này khổ | §14.1 "hạ thấp nghề" |
| **Nhánh "người chơi dừng lại" bị đọc thành "thoát khỏi nghề bán bánh mì"** | **Lằn ranh** | Dòng cuối của nhánh đó (*"Mai mốt rảnh ghé cô chơi, đừng ghé mua."*) không nhắc gì tới tương lai của người chơi. **Game không bình luận.** Và §14.1 cấm narrative "thoát ra làm việc khác" — nên **không có cảnh nào người chơi đi phỏng vấn, đi làm công ty, hay mặc đồ công sở** | §14.1 |
| **Người chơi thấy trống rỗng vì không có gì làm sau ngày 40** | Trung | Đó là T4. Nút "Chơi lại" có sẵn. **Và đây là một cảm giác hợp lệ mà một game có kết thúc nên tạo ra** | CANON §1 T4 |
| **Publisher đòi NG+ / endless / season 2** | Trung | §2.8, bốn lý do. Cộng lập luận thương mại: $9.99 cho ~7 giờ có kết là một món hàng hoàn chỉnh | `idea.md` §17 XĐ2 · §23 |
| **Chữ viết tay không đọc được với người loạn thị** | Cao | Công tắc "dùng font thường" là **bắt buộc**, không phải tuỳ chọn | §15 · `idea.md` §20 (Linh) |
| **Khoảng lặng 40 giây bị đọc là game treo** | Trung | Người chơi **vẫn điều khiển được** (dọn quầy, tắt lò). Và bấm nút bất kỳ là qua | §15 |
| **32 tổ hợp khung hình phình thành 32 khung art** | Trung | Một khung, 14 lớp bật/tắt. Ghi rõ trong brief cho artist | CANON §11 (giảm khối lượng) |
| **Credits bị sắp xếp theo thói quen ngành (đội ngũ trước, consultant sau)** | 🔴 **Lằn ranh** | Thứ tự cứng ở §2.5. **Checklist thi hành ở P4-05 §2.5.** Có người chịu trách nhiệm ký | §14.1 |

---

## 8. Truy vết

| Nội dung | `CANON.md` | `idea.md` |
|---|---|---|
| 🔴 **Nguyên tắc kết game** — *"mọi ending đều tử tế, chỉ khác nhau về ai còn ở đó với mình"* | **§15** (cuối mục) | **§20** (cuối mục) |
| **T3** — không hiện chỉ số quan hệ | **§1** | §23 |
| **T4** — một mùa có điểm kết, ship trọn vẹn, không EA/daily login/stamina | **§1** | §12.2 · §23 |
| **T2** — không dialogue tree (giữ tới cảnh cuối) | §1 | §9.5 |
| 🔴 **Cú quay lại ngày 40 — giữ nguyên, không sửa, "trái tim của cả game"** | — | **§17 XĐ3 phanh 4** |
| Báo trước 3–4 ngày (điều kiện để cú quay lại có nghĩa) | — | §17 XĐ3 phanh 1 |
| Sổ tay cô Ba, 2–3 dòng, không phán đúng sai | §15 | §17 XĐ3 phanh 2 |
| **Sự kiện đóng lại: giải toả / cô Ba nghỉ / truyền xe** | — | **§12.2** |
| Cô Ba là mentor, không làm bánh thay người chơi | §7.4 · §10 | — |
| Rule DB chấm điểm theo độ cụ thể (dùng cho bảng dòng cuối) | §11 | §18.1 |
| Đồn thổi cap 2–3 hop (tin giải toả chết sau 2 hop) | §12 | §18 |
| 🔴 **Credits: người Việt viết văn hoá đứng ĐẦU** | **§14.1** | **§19.4** |
| 🔴 **Hạ thấp nghề — cấm narrative "thoát ra làm việc khác"** | **§14.1** | **§19.4** |
| Không dịch đại từ xưng hô (dòng chữ cuối) | §2 | §19.5 |
| **Tiếng rao đang mất dần** — chất liệu cho cái kết | §14 | **§19.3** (*"Tiếng rao… lặng yên"*, SGGP) |
| Sổ nợ (chốt sổ với cô Mai) | §14 | §19.2 |
| Trợ năng: cỡ chữ 4 mức, nền đục, text không tự chạy, giảm chuyển động, pause | §15 | §20 |
| Lồng tiếng người thật, không AI voice | §2 | §19.5 |
| Giá $9.99 / 59.000₫ (lập luận chống NG+) | §2 | §17 XĐ2 |

---

## 9. Đề xuất sửa CANON

**Đ1 — Bổ sung §15: ghi rõ rằng nguyên tắc kết game áp dụng cho cả MÀN HÌNH TỔNG KẾT, không chỉ cho nội dung ending.**
Hiện §15 phát biểu nguyên tắc ở dạng nội dung (*"ai còn ở đó với mình"*). Doc này phát hiện rằng điểm vi phạm thực tế sẽ không nằm ở nội dung ending mà nằm ở **bảng tổng kết** — nơi mọi game đều hiện số và nơi cám dỗ lớn nhất. Đề xuất thêm một dòng: *"Màn hình tổng kết cuối mùa không được chứa chỉ số quan hệ, điểm, phần trăm hoàn thành, hay xếp hạng. Thay vào đó: ai còn ghé, sổ tay do người chơi tự viết, và một dòng của cô Ba."* Lý do cần ghi vào CANON chứ không chỉ ở doc này: bảng tổng kết sẽ do người làm UI thực hiện ở P5, có thể không đọc P4-04.

**Đ2 — Bổ sung §1 T4: ghi rõ "không New Game+".**
T4 hiện liệt kê: không Early Access, không daily login, không stamina, không cây chết khi offline. **NG+ thuộc cùng họ cơ chế** (kéo dài thời gian chơi mà không kể thêm chuyện) nhưng không được liệt kê, nên nó sẽ được đề xuất lại ở mỗi vòng review và ở mỗi cuộc họp với publisher. Đề xuất thêm vào danh sách của T4. Lập luận đầy đủ ở §2.8 — đặc biệt lý do #1: **NG+ phá huỷ chính cơ chế lõi**, vì người chơi lần hai biết chú Tư đi ngày 30 và sẽ tối ưu hoá 29 ngày với chú.

**Đ3 — Bổ sung §14.1: thêm một lằn ranh 🟡 về CHỦ ĐỀ XÃ HỘI CÓ THẬT ĐANG DIỄN RA.**
§14.1 hiện có 5 lằn ranh đỏ và 1 vàng (tâm linh). Doc này gặp một trường hợp không nằm trong danh sách: **giải toả / quy hoạch**. Nó không phải chủ quyền, không phải chiến tranh, không phải hạ thấp nghề — nhưng nó là một chủ đề xã hội có thật, đang diễn ra, liên quan tới chính sách, và một game nước ngoài chạm vào nó sẽ bị đọc thành phát ngôn chính trị. Đề xuất thêm: *"🟡 **Chủ đề xã hội có thật đang diễn ra** (giải toả, quy hoạch, giá nhà, lao động nhập cư): được phép làm **nền** và làm **tin đồn không xác nhận**; không được làm cốt truyện chính, không có nhân vật đại diện cơ quan, không có bình luận."*
