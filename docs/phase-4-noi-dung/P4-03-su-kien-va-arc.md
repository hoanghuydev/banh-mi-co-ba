# P4-03 — Thư viện sự kiện nội dung, cơ chế "món ăn là lựa chọn hội thoại", và arc 12 NPC

> ## ⚡ REVAMP 2026-10-20 — ⚠️ CHẾT MỘT PHẦN
> Căn cứ: [`CANON.md`](../CANON.md) bản revamp + [`revamp/00-YEU-CAU.md`](../revamp/00-YEU-CAU.md). Phần ☠️ không dùng làm căn cứ.
>
> | Mục | Trạng thái | Lý do / thay bằng |
> |---|---|---|
> | §1 Mục tiêu T3 · luật E3 "khác nhau ở ai còn ở đó" | ☠️ | T3 và ending "ai còn ở lại" chết. Hệ quả giờ đổ về sao/review |
> | §2.0 khung SK: "Ngày" theo lịch P4-02, "hệ quả dài → cuối mùa" | 🔁 | Kích theo thành tích hoặc ngẫu nhiên; hệ quả = yếu tố review + sao (R4) |
> | §2.1 SK gắn arc / cô Ba / sổ / nghe lỏm (vd SK-05, 13, 15, 20, 21, 24–30, 32–36, 40) | ☠️ | Sống nhờ arc, trí nhớ NPC, đồn thổi, sổ nợ, sổ tay, cô Ba |
> | §2.1 SK đời sống (vd SK-01, 06, 07, 09, 10, 17, 19, 31, 38, 39) | 🔁 | Giữ làm tình huống ngẫu nhiên/vui hiếm, bỏ mốc ngày, đầu ra → review (R4) |
> | §2.1 SK bé Su / chú Kiệt (SK-04, 11, 12, 14, 16, 37) · SK-22 mối hàng | 🔁 | Clip bé Su → review lan rộng; chú Kiệt → review ác ý (R4). Mối hàng → nhà cung cấp (R3) |
> | §2.2 12 tình huống "món ăn là câu thoại" | 🔁 | T2 còn sống. Bỏ bước "ghi sổ tay" và tình huống dựa khách quen nhớ nhiều ngày; phản ứng → review (R4/R6) |
> | §2.3 arc 12 NPC | ☠️ | Chết theo mùa 40 ngày |
> | §2.4 lớp phụ "được tin giao thứ quý giá" | ☠️ | Dựa T3 + quan hệ + lịch mùa. Có thể hồi sinh thành sự kiện vui hiếm ở R4 |
> | §2.5 tiếng rao | 🔁 | R1–R3 giữ làm ambience. Mốc ngày 5/9/21/35/40 chết. Rao của người chơi còn dùng, số ⏳ |
> | §5 tham số | ⏳ | Chờ mô phỏng R2/R5 |
>
> **Còn dùng được:** luật E1/E2 (không ô chọn thoại), §2.2 làm khung T2, các tình huống đời sống làm kho sự kiện ngẫu nhiên cho review (R4), tiếng rao làm ambience.

**Thuộc phase:** P4 — Nội dung
**Phụ thuộc:** `CANON.md` §1 (**T2** — không dialogue tree) · §3 (11 sự kiện **cơ chế** — khác với sự kiện **nội dung** ở đây) · §5 (perception) · §6 (delivery-diff) · §11 (rule DB) · §12 (trí nhớ & đồn thổi) · §14 (cơ chế Việt Nam) · P4-01 (dàn nhân vật) · P4-02 (lịch 40 ngày) · P4-04 (kết game)
**Trạng thái:** **Chốt** 40 sự kiện nội dung, 12 tình huống "món ăn là câu thoại", 12 arc. **Cần đo** tỉ lệ người chơi hiểu được hệ quả của mỗi sự kiện. **Còn mở** 🟡 3 chỗ đánh dấu.

---

## 1. Mục tiêu

**Phân biệt hai thứ dễ nhầm:**

| | **Sự kiện CƠ CHẾ** (CANON §3) | **Sự kiện NỘI DUNG** (doc này) |
|---|---|---|
| Có bao nhiêu | **11** (5 tích cực, 6 tiêu cực) + 1 trạng thái | **40** (`SK-01` → `SK-40`) |
| Là gì | Nguyên tử của hệ perception: `DROPPED_FOOD`, `REMEMBERED_USUAL`… | Tình huống kể chuyện: *khách tự đứng bán hộ*, *đám cưới trong hẻm* |
| Ai kích hoạt | Người chơi, mọi lúc | Lịch 40 ngày (P4-02) + điều kiện |
| Chấm điểm bởi | `salience × visibility × gaze × traitMul` | Không chấm điểm. **Chúng tạo ra ngữ cảnh để sự kiện cơ chế xảy ra trong đó** |

**Mục tiêu:**
- **T2 là trụ cột chính của doc này.** *"Không có dialogue tree. Người chơi không bao giờ chọn câu nói. Họ chọn nguyên liệu."* §2.2 là phần quan trọng nhất — 12 tình huống chứng minh rằng món ăn làm được việc mà cây hội thoại làm.
- **T1:** mỗi sự kiện phải đặt người chơi vào tình thế mà **cái họ làm bằng tay bị nhìn thấy**.
- **T3:** không sự kiện nào kết thúc bằng một con số. Hệ quả luôn là: mặt, lời, dáng, hành động, **hệ quả trễ**.
- Cấp đủ 40 tình huống để lịch P4-02 có nội dung thật, và để `~520 dòng thoại v1 / ~2.980 dòng full` (CANON §11) có chỗ bám.

---

## 2. Cơ chế

### 2.0. Khung của một sự kiện nội dung

```
SK-xx · <TÊN>
  Ngày        : khi nào trong lịch P4-02
  Điều kiện   : cờ / quan hệ / hành vi trước đó — KHÔNG BAO GIỜ là "điểm"
  Diễn biến   : 3–6 dòng, dựng cảnh
  Người chơi làm gì : CHỈ qua MÓN ĂN và HÀNH ĐỘNG. Không có ô lựa chọn thoại (T2)
  Hệ quả ngắn : trong ngày
  Hệ quả dài  : 3 ngày → cuối mùa
```

**Ba luật cứng cho mọi sự kiện trong doc này:**

| # | Luật |
|---|---|
| **E1** | **Không có ô lựa chọn hội thoại.** Nếu một sự kiện chỉ giải được bằng việc chọn câu nói → viết lại hoặc bỏ. Kiểm tra bằng grep: 0 kết quả cho `choices:` trong `content/events/` |
| **E2** | **Mọi lựa chọn của người chơi phải là một trong bốn:** (a) làm món gì / làm thế nào · (b) đưa hay không đưa một vật (trà đá, khăn, bịch, tiền lẻ) · (c) đứng ở đâu / làm gì bằng thân thể · (d) **không làm gì** — và (d) luôn là một lựa chọn hợp lệ, có hệ quả riêng |
| **E3** | **Không sự kiện nào có "đáp án đúng" duy nhất được thưởng rõ.** Mọi nhánh đều dẫn tới một thứ. Khác nhau về **ai còn ở đó**, không về điểm (§15) |

---

### 2.1. THƯ VIỆN 40 SỰ KIỆN NỘI DUNG

#### HỒI I — Học luật (ngày 1–8)

---

**`SK-01` · HẾT TIỀN THỐI LÚC 6H30** — *ngày 2*
**Điều kiện:** tự động, ngày 2. (Về sau có thể tái diễn nếu người chơi không đổi tiền lẻ ở chợ.)
**Diễn biến:** khách thứ hai trong ngày đưa tờ **500.000₫** cho một ổ 20.000₫. Người chơi mở hộp tiền: không đủ thối. **Theo luật ngầm của người bán hàng Việt, đầu ngày mà không có tiền thối là điềm xấu** (`idea.md` §19.1) — cô Ba nhíu mày, nhưng cô nhíu mày kiểu buồn cười, không kiểu lo sợ.
**Người chơi làm gì:**
| Hành động | Hệ quả ngắn | Hệ quả dài |
|---|---|---|
| Chạy qua tiệm cô Mai đổi | Mất 25 giây → hàng chờ dài ra, khách sau bắt đầu `MADE_THEM_WAIT` | **Cô Mai M1** mở. Từ ngày 3, cô Mai **tự mang tiền lẻ qua mỗi sáng** mà không ai nhờ |
| Ghi sổ nợ / cho nợ | `CARED_FOR_THEM` nhẹ. Nhưng chưa có hệ sổ nợ (mở ngày 9) → chỉ ghi giấy, và người chơi sẽ quên | Nếu quên → ngày 9, cô Mai nhắc, và đó là cách hệ sổ nợ được giới thiệu bằng một sai lầm có thật |
| Từ chối bán | 🔴 Bắn `REFUSED_SERVICE` (salience **85**, CANON §3.4) — người bị từ chối **kể cho cả hẻm**, hệ số lan truyền cao nhất game. Khách đi. Không ai ở quầy giận | Điềm xấu theo tông trìu mến: cô Ba nói *"Thôi, bữa nay bán chậm chút."* Và ngày đó **bán chậm thật** — nhưng vì người chơi mới, không vì hệ thống phạt. Xem P4-05 §2.1 |
**Vì sao sự kiện này ở ngày 2:** nó dạy ba thứ cùng lúc — tiền lẻ là tài nguyên, hàng chờ là áp lực, và cô Mai là người giúp.

---

**`SK-02` · BÀ SÁU RỦ ĐỔI** — *ngày 3 (và nhắc lại ngày 6)*
**Điều kiện:** bà Sáu đi vòng 1.
**Diễn biến:** gánh tàu hũ dừng trước xe. *"Đổi hôn con? Chén tàu hũ lấy ổ bánh."*
**Người chơi làm gì:** đổi · từ chối. Không có ô thoại — người chơi **đưa ổ bánh hoặc không đưa**.
**Hệ quả:** đổi → `BARTER` vào ledger, mất nguyên liệu, được một chén tàu hũ (cô Ba ăn, hoặc người chơi ăn — một khoảnh khắc nghỉ 8 giây, không có buff). Từ chối → bà cười, đi. **Từ chối lần hai (ngày 6) → bà không bao giờ hỏi lại.** Và bà Sáu là `softensNegative 0.30` của người chơi trong hệ gossip (P4-01 NPC-11). Người chơi mất lớp bảo hiểm đó **và không bao giờ được thông báo**.

---

**`SK-03` · THẦY PHÚC MÔ TẢ THAY VÌ TRÁCH** — *ngày 4*
**Điều kiện:** người chơi phạm bất kỳ sự kiện cơ chế tiêu cực nào trước mặt thầy Phúc. Nếu ngày 4 không phạm → cửa sổ mở tới ngày 7.
**Diễn biến:** thầy `NOTICED`. Ông nói **nhỏ, chỉ người chơi nghe**: *"Con vừa cầm tiền xong đó."* Không dấu chấm than. Không ai khác quay đầu.
**Người chơi làm gì:** rửa tay (hoặc không). **Hành động duy nhất.**
**Hệ quả ngắn:** nếu rửa → `certainty` của mọi khách về `DIRTY_HANDS` decay ngay. Nếu không → thầy không nói lần hai **trong ngày đó**.
**Hệ quả dài:** đây là **sự kiện dạy người chơi rằng hệ perception có thật và đọc được**. Nếu vertical slice chỉ giữ được 3 NPC, giữ thầy Phúc vì sự kiện này.

---

**`SK-04` · CHÚ KIỆT MỞ XE CẠNH TRANH** — *ngày 5* 🔴 *(bắt buộc)*
**Điều kiện:** tự động.
**Diễn biến:** 6h10, một cái xe đẩy **inox mới, có đèn LED, có bảng menu in decal** dừng cách xe cô Ba 40 mét. Không chào hỏi. Người đàn ông mở nắp, bật đèn, và rao: *"Bánh mì nóng đây! Mười lăm ngàn thôi bà con ơi!"* — rẻ hơn 2.000₫.
Cô Ba nhìn qua, không nói gì. Bà Bảy nói: *"Cha đó ở đâu tới vậy ta."*
**Người chơi làm gì (không có ô thoại — bốn đường bằng hành động):**
| Hành động | Hệ quả ngắn | Hệ quả dài |
|---|---|---|
| **Hạ giá theo** | Giữ được khách vãng lai ngày 5–9 | Biên lợi nhuận mỏng cả mùa. **Và chú Kiệt hạ tiếp ngày 8.** Đây là cuộc đua người chơi không thắng được |
| **Giữ giá, làm kỹ hơn** (`FLOURISH` nhiều hơn) | Mất **25% khách vãng lai** trong 5 ngày | **Khách quen không đổi một người nào.** Ngày 10 (clip bé Su) hồi phục hoàn toàn. Đây là đường "đúng", nhưng game không nói |
| **Rao to hơn / rao đè** | Ăn được vài khách | Bà Bảy và thầy Phúc thấy khó chịu (`STALL_CLEANLINESS` không đổi, nhưng *"ồn quá"* là một bark mới). Chú Kiệt `deTha 0.3` → **nhớ dai**, M3 (ngày 31) bị khoá |
| **Không làm gì** | Như đường 2 | Như đường 2 |
**Bài học kinh tế của game, phát biểu một lần và không lặp lại:** *danh tiếng không bảo vệ bạn khỏi cạnh tranh giá ở nhóm khách vãng lai — nhưng nó giữ nguyên 100% nhóm khách quen.* Người chơi học điều này bằng cách nhìn con số khách tụt rồi thấy chú Tư, chị Lan, thầy Phúc vẫn tới đúng giờ.

---

**`SK-05` · TRÚ MƯA DƯỚI MÁI HIÊN — CẢNH NGHE LỎM MẪU** — *ngày 16 (lần đầu), rồi mọi ngày mưa từ ngày 9*
**Điều kiện:** trời mưa **và** ngày ≥ 9 (sau khi gossip mở).
**Diễn biến:** bà Sáu đặt gánh, trú dưới mái hiên nhà cô Mai — **cách xe 9 mét, trong tầm nghe, bị che một phần bởi tiếng mưa**. Hai bà nói chuyện trong 40–70 giây. Người chơi vẫn đang làm bánh.
**Người chơi làm gì:** (a) **đứng yên nghe** — nhưng khách trước mặt đang chờ, `MADE_THEM_WAIT` bắt đầu leo · (b) làm bánh bình thường và **nghe được ~60%** · (c) đi vào trong lấy đồ → nghe được 0%.
**Đây là hiện thân của §12 ràng buộc 4** (*"Người chơi phải NGHE LỎM được… Không có nghe lỏm thì bỏ luôn cả nhớ nhầm lẫn đồn thổi"*) **và nó có giá**: nghe rõ hơn = phục vụ chậm hơn.
**Hệ quả dài:** mọi tin đồn trong game đều có **ít nhất một cảnh nghe lỏm khả dĩ**. Không có ngoại lệ. Một tin không nghe lỏm được là một tin không được phép tồn tại.

---

**`SK-06` · ĐƯA NHẦM ĐƠN CỦA NGƯỜI KHÁC** — *ngày 13 (kịch bản), rồi mọi lúc (cơ hội)* 🔴 *(bắt buộc)*
**Điều kiện:** ≥2 khách cùng lúc, cả hai đã gọi.
**Diễn biến:** người chơi đưa ổ của A cho B. **Điểm thiết kế: hai người phản ứng khác nhau, và hai phản ứng đó là bài kiểm tra xem người chơi đã hiểu 12 NPC tới đâu.**

Cặp mẫu ngày 13 — **chị Lan (`soi 0.9`, `nongTinh 0.1`) và ông Hải chiều (`soi 0.5`, `nongTinh 0.9`)**:

| | Nhận nhầm ổ | Phản ứng |
|---|---|---|
| **Chị Lan** nhận ổ đầy đủ (có ớt, có hành) | Chị **nhìn vào ổ bánh 2 giây** | Chị **không nói gì.** Chị nhận, trả tiền, đi. Và chị **không ăn** — nếu người chơi nhìn ra đầu hẻm, ổ bánh nằm trên nắp thùng rác. `deTha 0.2` → memory này **không decay** |
| **Ông Hải** nhận ổ chả lụa không ớt không hành | Ông giơ ổ bánh lên | *"Ê! Cái này của ai vậy? Trống trơn vậy nè!"* — **to.** Ba NPC quay đầu. Nhưng `deTha 0.5` → hôm sau ông quên |
**Người chơi làm gì:** đổi lại ngay (mất 15 giây, hai người đều phải chờ) · làm lại ổ mới cho cả hai (mất nguyên liệu + 50 giây) · **để vậy**.
**Hệ quả dài:** ông Hải la to nhưng tha. Chị Lan im nhưng nhớ. **Nếu sự kiện này xảy ra sau ngày 19, nó đẩy nhanh mốc rạn của chị Lan lên 1 ngày.**

---

**`SK-07` · KHÁCH CÁU VÔ CỚ — VÀ BẠN KHÔNG LÀM GÌ SAI** — *ngày 15* 🔴 *(bắt buộc)*
**Điều kiện:** tự động ngày 15. Nhân vật: **khách vãng lai vô danh**, ~35 tuổi, áo sơ mi công sở nhàu, tai nghe bluetooth một bên.
**Diễn biến:** anh ta gọi món. Người chơi làm **đúng hoàn toàn** — `diff(order.spec, dish)` trả về **rỗng**. Anh ta cầm ổ bánh, và nói:
> *"Sao lâu vậy em? Tui đứng đây nãy giờ nè."*
Anh ta đứng 90 giây. Chú Tư đứng 4 phút hôm qua và không nói gì.
> *"Thôi. Cảm ơn."* — rồi đi, nhanh.
**Người chơi làm gì:** **không có gì để sửa.** Đây là điểm của sự kiện. Các hành động hợp lệ: đưa ly trà đá (anh ta không cầm) · xin lỗi bằng cách gói thêm đồ chua (anh ta không nhìn) · **không làm gì**.
**Hệ quả ngắn:**
- ❌ **KHÔNG có sự kiện cơ chế tiêu cực nào được ghi.** `MADE_THEM_WAIT` **không** bắn. Không có memory tiêu cực. Không có tin đồn.
- ✅ Nhưng **có một điều xảy ra:** thầy Phúc (hoặc bà Bảy, nếu có mặt) nhìn theo anh ta rồi nói với người chơi: *"Chắc ổng có chuyện gì rồi."*
**Hệ quả dài:** **không có.** Tuyệt đối không có. Sự kiện này tồn tại để dạy một điều mà không game quản lý quán nào dám dạy: **đôi khi người ta cáu với bạn và đó không phải lỗi của bạn, và không có gì để làm cho đúng.**
> ⚠️ **Luật thi hành:** nếu một phiên bản nào đó của sự kiện này có nhánh "làm đúng thì anh ta dịu lại" → **cắt nhánh đó**. Sự dịu lại phá huỷ toàn bộ ý nghĩa.
> ⚠️ Anh ta **quay lại ngày 21**, bình thường, lịch sự, không nhắc gì. Đó là phần còn lại của bài học.

---

**`SK-08` · ANH BẢO NGẨNG ĐẦU LÊN** — *ngày 17* 🔴
**Điều kiện:** ngày ≥17 **và** người chơi vừa phạm một sự kiện cơ chế salience ≥75 (`DROPPED_FOOD`, `BURNT_OR_COLD`, `MADE_THEM_WAIT`, `WRONG_NAME`) trong khi anh Bảo có mặt. Cửa sổ mở tới ngày 26.
**Diễn biến:** điện thoại anh Bảo **hết pin** (màn hình tối, anh bấm hai lần, cất vào túi). `gazeFactor` của anh nhảy từ **0.05 → 0.80** trong **20 giây**. Và trong 20 giây đó, lỗi xảy ra.
Anh nhìn. `nongTinh 0.2` → **anh không nói gì.** Anh nhìn xuống. Anh nhận bánh. Anh nói *"Dạ, cảm ơn cô."* và đi.
**Người chơi làm gì:** **không có gì.** Đã xong rồi.
**Hệ quả ngắn:** `certainty` đạt `CONFIRMED`. **Nhưng không memory tiêu cực nào được ghi** — đây là ngoại lệ được hard-code, vì `deTha 0.8` của anh cộng với việc anh không quan tâm.
**Hệ quả dài:** **không có hệ quả cơ chế nào.** Hệ quả duy nhất nằm trong đầu người chơi. Playtest phải đo: **8/10 người phải nhớ được khoảnh khắc này khi hỏi ở ngày 40.**
> Đây là sự kiện chứng minh luận điểm của cả game: **hệ quả mạnh nhất không cần phải là hệ quả cơ chế.**

---

**`SK-09` · MƯA LỚN, KHÁCH NÁN LẠI** — *ngày 19 (kịch bản), rồi mọi ngày mưa* 🔴 *(bắt buộc)*
**Điều kiện:** mưa + có mái che (mua được từ ngày 12, hoặc dùng tạm dù của cô Ba).
**Diễn biến:** mưa đổ lúc 7h40. Khách **−40%** (§8 c) — nhưng những người đang ở đó **không đi được**. Ba, bốn người đứng chen dưới mái, ướt vai, và **họ bắt đầu nói chuyện**.
**Đây là cửa sổ nội dung lớn nhất trong game.** Tất cả `REMEMBERED_STORY` (salience 70) được sinh ra ở đây: chú Tư kể về con chim; bà Sáu kể chuyện lái xe tải; chị Hạnh kể chuyện phòng trọ dột; ông Hải (nếu là buổi sáng) kể chuyện bảng hiệu.
**Người chơi làm gì:**
| Hành động | Hệ quả |
|---|---|
| **Kéo thêm ghế nhựa ra** | `CARED_FOR_THEM` ×3 người cùng lúc. Và họ ngồi xuống → nói lâu hơn → **nhiều memory slot hơn** |
| Đưa trà đá vòng quanh | `CARED_FOR_THEM` + hạ `gazeFactor` toàn bộ → **đây là cửa sổ an toàn duy nhất để làm việc ẩu**, và người chơi sẽ nhận ra điều đó, và nó là một lỗ hổng **được phép tồn tại** vì nó tốn ghế, tốn trà, tốn thời gian |
| Bán bình thường | Không sao. Họ vẫn nói chuyện |
| Gói kỹ chống ướt (`CARED_FOR_THEM`) | Với người sắp đi ra mưa: salience 50 → **nhân 1.5** vào ngày mưa |
**Hệ quả dài:** mọi chuyện nghe được ở đây vào **sổ tay khách** (nếu người chơi tự ghi) và trở thành đầu vào cho `REMEMBERED_STORY` suốt phần còn lại của mùa. **Ngày mưa là ngày lỗ về tiền và lời về quan hệ.** Đó là toàn bộ thiết kế.

---

**`SK-10` · CÚP ĐIỆN** — *ngày 24* 🔴 *(bắt buộc)*
**Điều kiện:** ngày 24 (mưa lớn, ngập lối vào).
**Diễn biến:** 7h15, cả khu mất điện. **Lò điện tắt. Đèn tắt. Máy xay tắt. Bảng QR vô dụng** (ai cũng còn 4G, nhưng người chơi không nhìn được màn hình xác nhận vì điện thoại để trong nhà đang sạc).
Chú Kiệt bên kia hẻm có **bình ga**. Xe chú vẫn chạy.
**Người chơi làm gì (chỉ bằng hành động):**
| Hành động | Hệ quả |
|---|---|
| **Bán bánh nguội** | `BURNT_OR_COLD` (80) với mọi khách `soi` ≥0.5. Bà Bảy sẽ nói. Thầy Phúc sẽ để ổ bánh xuống nửa giây |
| **Nhóm bếp than / bếp ga mini** (nếu đã mua ở Trục B) | Được. Nhưng **chậm hơn 3×** → hàng chờ dài → `MADE_THEM_WAIT` |
| **Đóng cửa sớm** | §8 mục (l): chi phí cố định vẫn mất, và khách tới mà hết hàng thì mất lòng. Chú Tư tới 6h45 hôm đó — **nếu đóng trước 6h45, người chơi mất buổi sáng cuối cùng tử tế với chú Tư trước tín hiệu ngày 26** |
| **Qua mượn bình ga của chú Kiệt** | 🟡 Chỉ mở nếu chú Kiệt M2 nhánh (b) đã xảy ra — nhưng M2 ở ngày 25, sau ngày 24. **Nên ở lần chơi đầu, đường này LUÔN đóng.** Đó là chủ ý: người chơi sẽ nghĩ về nó ở ngày 25 |
**Hệ quả dài:** ngày 24 là **đáy của mùa** (P4-02 §2.4). Cúp điện + mưa ngập + chị Lan biến mất, cùng một ngày. Cả ba đều không phải lỗi người chơi. **Đó là lý do ngày 26–28 là ba ngày tích cực liên tiếp.**

---

**`SK-11` · CÁI KHĂN CỦA CHÚ KIỆT** — *ngày 25*
**Điều kiện:** ngày 25, sau mưa lớn ngày 24 (hàng của chú hư).
**Diễn biến:** người chơi — và **bà Bảy** (`soi 0.9`, `QUEUE_3` vẫn thấy) và **thầy Phúc** — nhìn thấy chú Kiệt **lau dao bằng cái khăn vắt vai**, rồi thấy chú lấy khay thịt hôm trước ra bán. `DIRTY_HANDS` của chú, ở mức nhìn thấy được từ 40 mét.
**Người chơi làm gì:**
| Hành động | Hệ quả ngắn | Hệ quả dài |
|---|---|---|
| **Không làm gì** | Chuyện tự lan qua bà Bảy → cô Mai → cả hẻm, **2 hop** | Ngày 28–30 xe chú vắng. Người chơi được lợi. **Và chú Kiệt M3 bị khoá vĩnh viễn** — người chơi không bao giờ biết ông ta ráp mô hình Gundam |
| **Đem qua cho chú một hũ đồ chua mới** (vì chú hết hàng thật) | Chú không cảm ơn. Chú nói *"Ờ. Cảm ơn."* — hai chữ, cộc lốc | 🔴 **Mở khoá chú Kiệt M3 (SK-32, ngày 31).** Và `spread_probability` tin xấu của chú tụt từ 0.45 → **0.15 vĩnh viễn**. Người chơi không bao giờ được thông báo |
| **Kể cho khách** | Nhanh, hiệu quả. Chú vắng ngày 27 luôn | Bà Sáu, cô Mai, thầy Phúc đều `NOTICED` việc người chơi nói xấu đối thủ. **Không ai trách.** Nhưng thầy Phúc không nhắc tới chuyện đó ở ngày 32 khi ông đọc sổ tay, và khoảng lặng đó là hệ quả |
> **Luật (XĐ1.5):** kẻ gian dối vệ sinh là chú Kiệt. **Game không bao giờ trừng phạt chú bằng tay của hệ thống.** Mọi hệ quả đến từ hẻm, và hẻm cũng là thứ quyết định người chơi có được biết chú là ai không.

---

#### HỒI II — Mở rộng (ngày 9–20)

**`SK-12` · ĐIỆN THOẠI GIƠ LÊN** — *ngày 5*
**Điều kiện:** bé Su có mặt, lần đầu.
**Diễn biến:** bé giơ điện thoại quay dọc, cách mặt người chơi 1,2 mét. Không xin phép.
**Người chơi làm gì:** (a) **che tay lại / quay lưng** → bé hạ máy, *"Ủa, con xin lỗi"*; `thanThien 1.0` nên bé không giận, nhưng bé **không quay nữa trong 6 ngày** → **SK-14 bị dời tới ngày 16** · (b) **làm bình thường** → bé quay, clip trung bình · (c) 🔴 **làm đẹp hẳn lên** (`FLOURISH`: rạch bánh một đường, quết pate gọn, gói nhanh) → bé kêu lên *"Ê ê quay lại cái đó đi!"*; `FLOURISH` với bé Su **nhân ×3**; SK-14 đến **sớm hơn, ngày 9**.
**Hệ quả dài:** đây là lần đầu game cho người chơi thấy rằng **kỹ năng tay có giá trị xã hội**, không chỉ giá trị chất lượng.

---

**`SK-13` · TAI NGHE CỦA BÀ BẢY** — *ngày 6*
**Điều kiện:** người chơi đã đưa bà Bảy ly trà đá ít nhất 1 lần trước đó.
**Diễn biến:** bà đang nghe gì đó, một bên tai. Người chơi đưa ly trà đá. Bà **rút một bên tai nghe ra và đưa cho người chơi**, không nói gì.
Trong 6 giây: một đoạn vọng cổ, hơi rè, giọng một đào chánh.
Rồi bà lấy lại, nhét vào tai, và nói: *"Bà nói thiệt, đào bây giờ ca không có hơi."*
**Người chơi làm gì:** nhận tai nghe hoặc không. **Đó là tất cả.**
**Hệ quả dài:** mở `prop_b` của bà. Và mở nhóm `REMEMBERED_STORY` kind `CAI_LUONG` — từ đây, mỗi ~5 ngày bà sẽ nói một câu về tuồng nào đó, và **những câu đó không phục vụ cơ chế gì hết**. Chúng tồn tại để bà Bảy không phải là bà bán vé số.

---

**`SK-14` · CLIP CỦA BÉ SU NỔ VIEW** — *ngày 10 (hoặc 9 / 16 tuỳ SK-12)*
**Diễn biến:** bé chạy tới, giơ điện thoại: *"Cô ơi! Bốn trăm ngàn view nè cô! Cái này lên xu hướng là cô đông khách luôn đó!"*
**Hệ quả ngắn:** ngày 11–13, **khách vãng lai +40%**. Đỉnh cao điểm tăng từ 2 lên **4 người cùng lúc** (P4-02 §2.7).
**Người chơi làm gì:** không có gì để chọn. **Chuyện xảy ra với họ.**
**Hệ quả dài — và đây là điểm:** khách mới **không biết luật hẻm**. Họ gọi món lạ, họ trả bằng QR khi chưa có QR, họ không biết bà Bảy hay đứng chỗ nào. Áp lực thông lượng tăng đột ngột → **người chơi phạm nhiều lỗi nhất Hồi II ở đây**.
> **Cấu trúc quan trọng hơn sự kiện: THÀNH CÔNG GÂY RA KHỦNG HOẢNG.** Nếu game chỉ thưởng cho thành công, nó là một game quản lý. Vì nó phạt cả thành công, nó là một game về nghề.

---

**`SK-15` · APP KHOÁ TÀI KHOẢN ANH DŨNG** — *ngày 11*
**Diễn biến:** anh Dũng dừng xe, không gọi món, ngồi trên yên nhìn điện thoại **40 giây**. Không ai hỏi.
**Người chơi làm gì:** (a) **đưa ly trà đá** → anh cầm, uống, rồi kể: khách bom hàng, báo xấu, khoá 24 giờ, mất một ngày tiền. Mở `REMEMBERED_STORY` của anh cho cả mùa · (b) **hỏi món** (bấm vào anh) → anh giật mình, gọi đại, đi · (c) để yên → anh đi sau 40 giây.
**Hệ quả dài:** nhánh (a) là **điều kiện mềm** cho ngày 34 (anh chở con gái tới). Nếu chưa từng có `REMEMBERED_STORY` với anh Dũng, ngày 34 anh vẫn tới nhưng **con gái anh không gọi món** — bé chỉ ngồi trên xe.

---

**`SK-16` · CLIP XẤU** — *ngày 23 (điều kiện)*
**Điều kiện:** ≥2 sự kiện cơ chế salience ≥75 xảy ra trước mặt bé Su trong Hồi II.
**Diễn biến:** bé đăng. **Bé không ác ý** — bé nghĩ nó buồn cười. Clip có 60.000 view.
**Hệ quả ngắn:** ngày 24–26, khách nhìn quầy kỹ hơn (`STALL_CLEANLINESS` trọng số ×1.5 với mọi khách vãng lai). Chú Kiệt được lợi.
**Người chơi làm gì:** không thể yêu cầu bé gỡ (không có ô thoại). Cách duy nhất: **làm sạch quầy, và làm đẹp trước mặt bé** cho tới khi bé quay một clip mới (~4 ngày).
**Hệ quả dài:** 🔴 **Bé Su KHÔNG BAO GIỜ bị game trừng phạt vì chuyện này.** Không có nhánh nào bé bị mắng, bị hối hận, bị "học được bài học". Bé 13 tuổi, bé không hiểu hậu quả, và đó là đủ. Arc của bé (học cách hỏi trước khi quay) tiến triển vì **bé lớn lên**, không vì bé bị phạt.

---

**`SK-17` · KHÁCH DẪN NGƯỜI MỚI TỚI KHOE** — *ngày 28* 🔴 *(bắt buộc)*
**Điều kiện:** ≥6 lần `REMEMBERED_USUAL` với một NPC bất kỳ, và NPC đó `thanThien` ≥0.6. Mặc định: **ông Hải** (sáng) hoặc **cô Mai**.
**Diễn biến:** ông Hải tới, kéo theo một người đàn ông khác. Và ông nói — **không nói với người chơi, nói với người kia**:
> *"Quán này tao ăn hoài. Bà đây làm ổ ốp la hai trứng, tao khỏi cần kêu nữa, bả biết rồi."*
Rồi ông quay qua người chơi: *"Làm cho ổng một ổ giống tao nghen."*
**Người chơi làm gì:** làm ổ ốp la hai trứng cho người lạ. **Nhưng người lạ có khẩu vị của người lạ** — ông ta ăn cay không nổi, và không ai nói cho người chơi biết.
| Hành động | Hệ quả |
|---|---|
| Làm y hệt ổ của ông Hải | Người lạ ăn, không nói gì, không quay lại. Ông Hải vui |
| **Làm giống nhưng bớt ớt** (vì người lạ nhìn cái ổ và hơi ngập ngừng — tín hiệu hình ảnh 1 giây) | Người lạ quay lại ngày 33 và ngày 37. `FLOURISH` của việc **đọc được một người chưa từng gặp** |
| Hỏi lại người lạ | Ông Hải hơi cụt hứng (*"thì làm giống tao thôi mà"*). Không hại gì |
**Hệ quả dài:** đây là `REMEMBERED_USUAL` đạt tầng cao nhất — **khi đơn hàng quen trở thành thứ người ta khoe.** Và nó mở ra thước đo tiến trình ở SK-27/§19.2.

---

**`SK-18` · NHẠI GIỌNG CHỊ HẠNH** — *ngày 8*
**Điều kiện:** tự động.
**Diễn biến:** chị Hạnh gọi: *"Chị lấy một cái bánh mì pa-tê, cho chị xin ít rau mùi."*
Một **khách vãng lai vô danh** đứng sau bật cười và nhại: *"Cái bánh mì! Rau mùi! Ha ha, ngoài Bắc mới dzô hả chị?"*
**Ông Hải (buổi sáng — bản tử tế) chặn lại:** *"Ê, kỳ vậy cha nội."* Ba chữ. Rồi thôi.
Chị Hạnh **không nói gì.** Chị trả tiền, cầm bánh, đi.
**Người chơi làm gì:** ❌ **KHÔNG CÓ Ô THOẠI.** Không có nút "bênh vực". Người chơi không kịp.
Cái người chơi làm được là **ngày 11, khi chị quay lại: làm đúng ổ của chị mà không hỏi lại một chữ.** Đó là toàn bộ câu trả lời mà game cho phép.
**Hệ quả ngắn:** ngày 9–10 chị **mua chỗ khác** (mua của chú Kiệt). Chị vắng 2 ngày.
**Hệ quả dài:** ngày 11 chị quay lại. **Đây là arc thu nhỏ của cả game: có tín hiệu, có biến mất, có quay lại** — đặt ở ngày 8–11 để dạy người chơi cái khuôn trước khi khuôn đó được dùng cho chú Tư (ngày 30) và chị Lan (ngày 24 → 40).
> ⚠️ **Lằn ranh (§14.1):** người nhại là **khách vãng lai vô danh**, không bao giờ là một NPC có tên. Người chặn lại là **người Việt trong hẻm**. *Người Việt cười người Việt — và người Việt cũng là người bênh.* Không có nhân vật nước ngoài nào trong sự kiện này.

---

**`SK-19` · KHÁCH TỰ ĐỨNG BÁN HỘ** — *ngày 32* 🔴🔴 *(bắt buộc — CANON §14: "sự kiện ngẫu nhiên hay nhất có thể có")*
**Điều kiện:** ngày ≥30, quan hệ với ≥3 NPC đã ở bucket `Friend`, và người chơi **phải rời quầy** (hết pate giữa giờ cao điểm → phải chạy ra chợ đầu hẻm 6 phút).
**Diễn biến:** người chơi chạy đi. Khi quay lại: **bà Sáu đang đứng sau xe, bán.** Có ba người đang chờ. Bà đã bán được **4 ổ**.
Và bà đang nói với một khách: *"Tui hổng phải người làm ở đây nghen. Tui bán giùm thôi. Con nhỏ nó chạy đi lấy đồ."* — **đúng như báo chí mô tả** (`idea.md` §19.2): người bán hộ chủ động khai báo mình không phải nhân viên.
**Tiền trong hộp:** người chơi đếm. Ba khả năng, chọn theo seed cố định của ngày:
| Kết quả | Tần suất | Ý nghĩa |
|---|---|---|
| **Đủ chính xác** | 60% | Bà nhẩm đúng |
| **Thừa 5.000₫** | 25% | Có người trả dư và không chờ thối. Bà không biết |
| **Thiếu 10.000₫** | 15% | Bà bán rẻ cho một đứa nhỏ. Bà không nói. Bà sẽ không bao giờ nói |
**Người chơi làm gì:**
- Đếm tiền trước mặt bà → **bà thấy.** `soi 0.4` nhưng chuyện này thì ai cũng thấy. Không có hệ quả cơ chế; có một khoảng lặng.
- Không đếm → cất hộp, cảm ơn. Người chơi **không bao giờ biết** con số. (Trừ khi đối chiếu sổ ledger buổi tối — và lúc đó bà đã về.)
- Đưa bà một ổ bánh / một chén tiền công → bà **từ chối**, hơi phật ý: *"Trời ơi, chòm xóm mà con."*
**Hệ quả dài:** đây là **đỉnh của trục cảm xúc "được tin giao"** (`idea.md` §11 + §12.1). Không phải người chơi được tin — mà **người chơi tin người khác**, một cách bắt buộc, vì không còn lựa chọn nào. Và điều đó hoá ra là cùng một thứ.
> **Biến thể ngày 39 (tuỳ chọn, nếu người chơi đã đủ thân):** người đứng bán hộ là **chú Kiệt**. Không lời giải thích. Xe của chú vẫn để bên kia, tắt đèn.

---

**`SK-20` · CÔ MAI MỞ SỔ NỢ** — *ngày 9*
**Diễn biến:** một khách quen hết tiền mặt. Cô Mai đứng bên kia đường, thấy, đi qua, và nói: *"Con ghi sổ đi, cuối tháng tính một lần. Cô cũng ghi vậy."* Cô đưa một cuốn sổ caro cũ.
**Mở khoá:** hệ **sổ nợ** (P4-05 §2.3). Và **đây là chỗ duy nhất trong game mà cơ chế "nhớ nhầm" hoàn toàn hợp trực giác** (`idea.md` §19.2) — vì người chơi **biết mình đã quên ghi**.
**Hệ quả dài:** mỗi lần người chơi bán chịu mà không ghi, `ledger` lệch. Cuối mùa (ngày 40) cô Mai chốt sổ. Xem P4-04 §2.4.

---

**`SK-21` · THẦY PHÚC ĐƯA CÂY BÚT** — *ngày 11*
**Diễn biến:** thầy thấy người chơi loay hoay — hỏi lại một khách quen họ ăn gì. Thầy đợi tới khi vắng, rồi đặt một **cây bút bi** lên quầy.
> *"Ghi đi con. Trí nhớ là thứ mình tưởng mình có."*
**Mở khoá:** **sổ tay khách** — người chơi **tự gõ ghi chú**, game không tự điền gì cả (T3).
**Vì sao là thầy Phúc và vì sao là ngày 11:** hệ thống quan trọng nhất của game được trao bởi một nhân vật, ở đúng thời điểm người chơi vừa nhận ra mình đang quên (2 ngày sau cú lộ). **Không có popup nào nói "Đã mở khoá: Sổ tay".**

---

**`SK-22` · MỐI HÀNG MỚI** — *ngày 12*
**Diễn biến:** cô Ba đưa một số điện thoại viết trên mẩu giấy. *"Chỗ này pate ngon hơn. Mắc hơn ba ngàn. Con tính đi."*
**Mở khoá:** nhà cung cấp nhiều mức giá (§10). Và — điểm quan trọng — **nhà cung cấp dùng lại nguyên engine tính cách/trí nhớ/đồn thổi** (§10): ông chủ mối pate có `soi`, `deTha`, và **ông ta nhớ người chơi có trả tiền đúng hẹn không**.
**Hệ quả dài:** trễ tiền hàng 2 lần → ông giao hàng muộn → bánh chậm → `MADE_THEM_WAIT`. **Chuỗi nhân quả đi từ kinh tế sang quan hệ sang perception mà không cần một hệ thống mới nào.**

---

**`SK-23` · MUA BẢNG QR VÀ BÌNH TRÀ SỮA** — *ngày 14*
**Diễn biến:** buổi tối, cô Ba đếm tiền. Cô Mai qua chơi. Bé Su nì nèo đòi trà sữa. Ba chuyện gặp nhau.
**Mở khoá:** bảng **QR** (P4-05 §2.4) · **bình trà sữa** → toàn bộ ngôn ngữ gọi món *"70 đường, 100 đá"* (P4-05 §2.7) · **đèn ca tối** (giữ anh Dũng).
**Chi phí:** không chỉ tiền — **một buổi sáng không bán được** (đi đăng ký QR). Người chơi mất ~18 khách. Chú Tư tới, thấy xe không mở, và hôm sau chú nói: *"Bữa qua chú đi ngang, không thấy con."* Một câu. Không trách.
**Người chơi làm gì:** mua cả ba, mua một, mua hai, hoặc không mua gì. **Không mua QR** → ngày 36 chú Kiệt gắn POS và người chơi mất khách trẻ 3 ngày. **Không mua đèn** → mất anh Dũng từ ngày 18 tới 34.

---

**`SK-24` · CHUYỆN CÁI BẢNG HIỆU** — *ngày 16*
**Diễn biến:** bà Sáu trú mưa, nhìn lên bảng hiệu xe cô Ba, và nói với cô Mai (người chơi **nghe lỏm**):
> *"Cái bảng đó ông Hải viết đó. Hồi xưa ổng viết bảng cho cả xóm. Chữ đẹp thấy mồ."*
**Không ai nói thêm.** Người chơi vừa biết một điều về ông Hải mà ông sẽ không bao giờ tự nói.
**Hệ quả dài:** điều kiện tiên quyết cho **SK-29** (ngày 26). Nếu người chơi không nghe được đoạn này (đang bận, hoặc vào trong lấy đồ), SK-29 vẫn xảy ra nhưng **bà Sáu nói lại ở ngày 25** — hệ thống luôn cho một cơ hội thứ hai cho mọi thông tin cần thiết cho một nhánh.

---

**`SK-25` · BÁN MỘT MÌNH** — *ngày 18*
**Điều kiện:** ngày 18 (cô Ba không xuống được — đầu gối, trùng ngày nghĩa vụ tiền thuốc).
**Diễn biến:** cô Ba không ở đó. Không ai để hỏi. Không ai đứng tiếp khách để chuyển `gaze` (§5.4 mất một công cụ). Và anh Dũng cũng vừa biến mất khỏi buổi sáng (ngày 18 là ngày anh đổi ca).
**Hệ quả:** ngày khó nhất Hồi II về mặt vận hành. **Nhưng không có sự kiện tiêu cực kịch bản nào** — khó khăn đến từ việc thiếu công cụ, không từ việc game ném đá.
**Hệ quả dài:** buổi tối, cô Ba viết sổ: *"Bữa nay cô nằm suốt. Con bán được hả? Cô nghe tiếng con dọn tới chín giờ."*

---

**`SK-26` · NGƯỜI CHUYỂN NHÀ ĐI KHÔNG BÁO** — *ngày 20* 🔴 *(bắt buộc)*
**Điều kiện:** tự động. Nhân vật: **một khách vãng lai đã ghé đều 11 ngày liền** — không có tên, không có hồ sơ, chỉ có một cái áo khoác màu cam và một đơn hàng cố định (*"ổ xíu mại, không rau"*).
**Diễn biến:** ngày 20, căn nhà cuối hẻm có xe ba gác chở đồ ra. Người áo cam không tới. Ngày 21 cũng không. Ngày 22 cũng không.
**Không ai nhắc tới chuyện này. Không một NPC nào.** Không có sổ tay nào ghi. Người áo cam **chưa bao giờ có tên**, nên hệ thống không có gì để ghi.
**Người chơi làm gì:** không có gì.
**Hệ quả dài:** **không có hệ quả cơ chế.** Sự kiện này tồn tại vì một lý do duy nhất: **nó xảy ra bốn ngày trước khi chị Lan biến mất**, và nó dạy người chơi rằng người ta biến mất, và đôi khi không có gì để đọc, không có tín hiệu nào, và đó cũng là đời.
> ⚠️ Nhưng luật phanh XĐ3 vẫn được giữ: **người áo cam KHÔNG PHẢI khách quen có tên.** Mất một NPC có tên mà không báo trước là trò đểu. Mất một người lạ quen mặt mà không báo trước là **đời sống**. Ranh giới nằm đúng ở chỗ hệ thống đã cho bạn ghi tên người đó hay chưa.

---

#### HỒI III — Áp lực và mất mát (ngày 21–33)

**`SK-27` · BUỔI ĐỜN CA TÀI TỬ Ở SÂN ĐÌNH** — *ngày 21*
**Diễn biến:** cả hẻm đi. Chú Tư mang **lồng chim** (lần duy nhất `prop_b` của chú xuất hiện). Thầy Phúc mang bình cà phê. Cô Mai đeo huy chương chạy bộ **nhầm** (cô quên tháo) và ai cũng chọc.
**Bà Bảy không đi. Cô Ba không đi.** Không ai giải thích.
Bé Su là người duy nhất hỏi thẳng: *"Ủa sao bà Bảy hổng đi? Bà thuộc hết mấy bài mà."* — **và cả hai người lớn đều lơ bé.**
**Người chơi làm gì:** bán ở sân đình (đổi chỗ đứng — mở khoá ngày 16) hoặc ở lại hẻm.
| Hành động | Hệ quả |
|---|---|
| **Đẩy xe ra sân đình** | Bán được nhiều nhất mùa (+70% doanh thu ngày). Nhưng **cô Ba ở nhà một mình**, và **bà Bảy cũng** |
| **Ở lại hẻm** | Bán ế. Nhưng bà Bảy ghé vào buổi chiều — **lần duy nhất bà ghé buổi chiều trong cả mùa** — và bà ngồi xuống ghế nhựa, và bà nghe cải lương bằng loa ngoài thay vì tai nghe. **Bà không nói gì về cô Ba.** Người chơi ngồi đó với bà 3 phút |
**Hệ quả dài:** nhánh "ở lại" mở một `memory` kind `CORE` cho bà Bảy (§12: Core 1 slot, **một lần duy nhất định hình NPC**). Không có gì khác đổi. Không có điểm. Chỉ là từ đó, khi người chơi làm sai trước mặt bà, bà tha nhanh hơn một bậc.
> 🔴 **Mối bất hoà 15 năm KHÔNG BAO GIỜ được giải thích trong game.** Không ở đây, không ở ngày 40, không ở màn hình kết. Xem P4-01 NPC-01 và P4-04 §2.6.

---

**`SK-28` · BÀ SÁU KHOE BẰNG LÁI XE TẢI** — *ngày 22*
**Diễn biến:** anh Dũng (nếu có ca tối) hoặc một khách nói chuyện xe cộ. Bà Sáu chen vào, lôi bóp ra, rút một tấm bằng lái **hạng C đã hết hạn từ 1997**, và đưa ra khoe. *"Tui chạy xe tải ba năm đó nghen. Tuyến Mỹ Tho."*
Rồi bà chê cách ai đó ôm cua.
**Người chơi làm gì:** nhìn hoặc không nhìn. **Nếu người chơi bấm vào tấm bằng để xem kỹ** → bà kể thêm 20 giây, và một `memory` kind `STORY` được ghi → `REMEMBERED_STORY` với bà Sáu mở khoá cho cả mùa.
**Vì sao sự kiện này tồn tại:** L2 của P4-01. Bà Sáu là rủi ro rập khuôn thứ hai của game. Tấm bằng lái là câu trả lời.

---

**`SK-29` · ÔNG HẢI VẼ LẠI BẢNG HIỆU** — *ngày 26–27*
**Điều kiện:** bảng hiệu tróc sơn (ngày 24, mưa lớn) **và** người chơi biết chuyện ông Hải viết bảng (SK-24).
**Diễn biến:** người chơi có hai đường, **và cả hai đều bằng hành động**:
| Hành động | Diễn biến | Hệ quả |
|---|---|---|
| **Thuê tiệm decal** | Ngày 26 có bảng mới. In sắc nét, chữ đều, có đổ bóng vector | Bảng đẹp. Bà Sáu nhìn một giây rồi không nói gì. **Cô Ba cũng không nói gì.** `STALL_CLEANLINESS` +5% vĩnh viễn (bảng mới nhìn sạch hơn). Đây là nhánh hoàn toàn hợp lý và không ai trách người chơi |
| 🔴 **Nhờ ông Hải** | **Nhưng ông chỉ làm được buổi sáng.** Ông tới sáng T3/T5/T7 → người chơi phải **canh đúng ngày 27 (T7)**. Nếu người chơi nhờ ông vào buổi chiều, ông nhận lời rất hăng hái và **hôm sau không nhớ** | Ngày 27, ông ngồi vẽ. **Tay ông run.** Ông vẽ chậm. Ông vẽ lại **hai lần**. Ông nói: *"Lâu quá không cầm cọ."* Và nét cuối cùng **không đẹp bằng nét cũ** |
> 🔴 **KHÔNG CÓ phiên bản "chơi giỏi thì ông vẽ đẹp".** Không có điều kiện quan hệ nào làm tay ông hết run. Đây là chỗ game **từ chối cơ chế hoá lòng thương**. Cái bảng hơi xấu đó được treo lên và nó ở đó tới ngày 40, và ở màn hình kết nó xuất hiện trong khung hình cuối.

---

**`SK-30` · CHẬU LAN BỐN TRIỆU** — *ngày 27*
**Diễn biến:** cô Mai qua mua bánh, đang bực. *"Bốn triệu đó con. Bốn triệu một chậu mà nó chết queo. Tui tưới đúng bài mà."*
**Người chơi làm gì:** không có gì. Nghe.
**Vì sao sự kiện này tồn tại (§19.5):** *"Cái hẻm mà ai cũng nghèo giống nhau là cái hẻm giả."* Đây là **thất bại của một người khá giả**, và nó trông hoàn toàn khác với thất bại của người khác trong hẻm. Nó tốn tiền hơn và nó buồn cười hơn.
**Hệ quả dài:** cô cho người chơi **một nhánh trầu bà** (chi tiết môi trường bắt buộc, §14) — *"cái này thì không chết được đâu con, yên tâm."*

---

**`SK-31` · CUỐI THÁNG, KHÁCH HẾT TIỀN** — *ngày 29* 🔴 *(bắt buộc)*
**Điều kiện:** ngày 29 (cuối tháng). Nhân vật: **anh Bảo**.
**Diễn biến:** anh tới giờ thường lệ. Anh không gọi "ổ đầy đủ". Anh nói — **mắt vẫn ở điện thoại, giọng nhỏ hơn nửa mức**:
> *"Cho em ổ bánh mì không thôi."*
**Ổ bánh mì không** = chỉ ổ bánh, chấm sữa đặc hoặc không chấm gì. **10.000₫ thay vì 25.000₫.**
Anh không giải thích. Anh không nhìn lên.
**Người chơi làm gì — bốn đường, và ba trong bốn làm anh xấu hổ:**
| Hành động | Hệ quả |
|---|---|
| **Lén bỏ pate vào** | Anh mở giấy ra ở ngoài kia, thấy pate. Anh **quay lại trả tiền** vào ngày 31, và anh **không tới ngày 30**. `thanThien 0.4` + sinh viên + 20 tuổi = lòng tự trọng. **Lòng tốt sai cách** |
| **Cho thêm miễn phí, nói rõ** (`FREE_EXTRA`) | Anh nói *"dạ thôi cô"* hai lần rồi nhận. Anh ngượng. `FREE_EXTRA` có diminishing returns (§8 i) và **ở đây nó âm** |
| **Ghi sổ nợ** | Anh đồng ý nhanh — quá nhanh. Anh trả đủ ngày 33. Nhưng anh **không gọi trà sữa** cho tới hết mùa |
| 🔴 **Làm đúng ổ bánh mì không — và làm nó thật ngon** | Nướng lại cho giòn, rạch một đường gọn, quết sữa đặc đều, gói đẹp. `FLOURISH` bắn. **Không `FREE_EXTRA`, không thương hại.** Anh cầm, đi. Ngày 40 anh tới **không cầm điện thoại**, và anh gọi tên người chơi |
> **Đây là tình huống dạy luật quan trọng nhất của cả game về lòng tốt: tôn trọng không phải là cho thêm. Tôn trọng là làm đúng cái người ta gọi, và làm nó tử tế.**
> **Biến thể:** nếu bà Bảy có mặt (T2/T4/T6 — ngày 29 là T2, nên bà **có** mặt), bà nhìn thấy, và bà **không nói gì cả**. Sau khi anh đi, bà nói với người chơi: *"Hồi đó con Hương nhà cô Mai cũng vậy đó."* Rồi thôi.

---

**`SK-32` · HAI NGƯỜI CÙNG NGHỀ** — *ngày 31* 🔴 *(nhánh — mở nếu SK-11 chọn đường (b))*
**Diễn biến:** chiều, mưa, vắng. Chú Kiệt đóng nắp xe sớm, đi bộ qua, đứng cạnh xe người chơi dưới mái. Chú không mua gì.
Và chú **nói về nghề**, 4 phút:
> *"Cái lò đó bên trái nó yếu. Con để khay lệch qua phải chừng hai lóng tay là đều."*
> *"Pate bên chợ Bà Chiểu mắc hơn ba ngàn mà nó để được ba ngày. Chỗ rẻ để hai ngày là hôi liền. Tính ra không rẻ."*
> *"Trời ẩm vầy bánh nó mềm nhanh. Con đừng nướng sẵn. Nướng từng ổ thôi, cực mà bán được giá."*
Rồi, đúng một lần, chú nói về mình:
> *"Tui làm công cho lò bánh chín năm. Chín năm mới dám ra riêng."*
Rồi chú lôi điện thoại ra khoe **một tấm hình mô hình Gundam chú mới ráp xong**, giữa lúc đang nói chuyện làm ăn, và chú hơi ngượng về việc đó. Rồi chú về.
**Người chơi làm gì:** nghe. Và — nếu muốn — **làm một ổ đưa chú**. Chú nhận. Chú không cảm ơn lần hai.
**Hệ quả dài:**
- `spread_probability` tin xấu của chú: 0.45 → **0.15 vĩnh viễn**. **Người chơi không bao giờ được thông báo.** Người chơi chỉ thấy hẻm bớt dò xét từ ngày 31 và không hiểu vì sao.
- Mọi lời khuyên của chú **có tác dụng cơ chế thật**: để khay lệch phải → nướng đều hơn; mua pate mắc → hạn dùng 3 ngày thay vì 2; không nướng sẵn ngày ẩm → `BURNT_OR_COLD` giảm.
- **Mở nhánh SK-19 biến thể ngày 39** (chú Kiệt đứng bán hộ).
> Đây là 4 phút hay nhất về viết của cả dự án. Nếu ngân sách VO chỉ đủ thu 10 cảnh, thu cảnh này.

---

**`SK-33` · LỜI NHẮN CỦA CHÚ TƯ** — *ngày 33*
**Diễn biến:** một người phụ nữ ~50 tuổi, chưa từng xuất hiện, tới lúc 7h. Bà mua **hai ổ đầy đủ, nhiều ớt**.
> *"Ổng gửi lời hỏi thăm con. Ổng đi làm xa, sáu giờ đã phải ra bến xe rồi."*
Rồi bà trả tiền và đi.
**Người chơi làm gì:** không có gì. Làm hai ổ. **Nếu người chơi bỏ nhiều ớt mà không cần hỏi** → bà dừng lại nửa giây, rồi nói: *"Ờ. Ổng nói con nhớ."*
**Hệ quả dài:** **đây là lời giải thích duy nhất người chơi nhận được về chú Tư trong cả game.** Nó đủ. Không có thêm gì. Chú không quay lại ngày 40.
> ⚠️ Lưu ý về lằn ranh: chú Tư đi **Bình Dương, làm bảo vệ ở chỗ mới**. Không có chi tiết nào về hoàn cảnh bi đát. Ông có việc, ông đi xa hơn, ông dậy sớm hơn. **Đó là đời sống lao động bình thường và nó được kể với phẩm giá** (§14.1).

---

#### HỒI IV — Khép lại (ngày 34–40)

**`SK-34` · CÔ BA NÓI CÔ NGHỈ HẲN** — *ngày 34* 🔴🔴
Xem **P4-04 §2.3** — đây là sự kiện đóng lại được chọn làm chính.

---

**`SK-35` · BÀ SÁU NHỜ GIỮ GIÙM CÁI GÁNH** — *ngày 34*
Xem **§4** (lớp "được tin giao thứ quý giá").

---

**`SK-36` · BÀ SÁU ĐẶT GÁNH XUỐNG** — *ngày 35*
**Diễn biến:** bà xuất hiện với **bàn gấp, ghế nhựa, và nồi đặt trên bàn** thay vì quang gánh. Bà bán cố định ở đầu hẻm bên.
Bà không buồn. **Bà khoe:**
> *"Ngồi một chỗ mà bán được y chang. Tui ngu ghê, làm chi cực ba chục năm."*
Và bà cười.
**Người chơi làm gì:** không có gì.
**Vì sao sự kiện này tồn tại:** §9.7 ở tầng cảm xúc. Hồi III toàn mất mát. **Cần ít nhất một arc kết thúc bằng việc một người giải quyết được vấn đề của mình.** Nếu không có SK-36, Hồi IV bắt đầu bằng ba ngày buồn liên tiếp và người chơi sẽ không còn muốn tới ngày 40.
**Hệ quả dài:** bà không đi ngang hẻm nữa. **Tiếng rao của bà biến mất khỏi mốc giờ 8h50 và 15h30.** Xem §5 — đây là mất mát **âm thanh** đầu tiên của game, và nó là mất mát duy nhất trong một sự kiện vui.

---

**`SK-37` · CHÚ KIỆT GẮN POS** — *ngày 36*
**Diễn biến:** xe chú có thêm **bảng QR treo và một cái máy POS nhỏ**. Chú rao thêm một câu: *"Quẹt thẻ, chuyển khoản đều được nghen bà con!"*
**Hệ quả:** nếu người chơi **chưa mua QR** (SK-23) → ngày 36–38 mất ~30% khách trẻ. Họ tới, hỏi *"có chuyển khoản không cô?"*, nghe "không", và **đi qua bên kia**. Không ai giận. Họ chỉ đi.
**Vì sao sự kiện này tồn tại:** chú Kiệt phải **thắng ít nhất một trận bằng cách làm ăn giỏi**, không bằng gian lận. Nếu mọi thành công của chú đều đến từ việc chú bẩn, chú thành phản diện và XĐ1.5 sụp.
> Số liệu nền (`idea.md` §19.2): người Việt trung bình có **11 ngày liên tiếp mỗi tháng không tiêu một đồng tiền mặt**. Quán chỉ nhận tiền mặt thì khách bỏ đi chỗ khác. Đây không phải cơ chế bịa.

---

**`SK-38` · TRẺ CON NHẶT ĐƯỢC VÍ** — *ngày 37* 🔴 *(bắt buộc)*
**Diễn biến:** hai đứa nhỏ ~8–9 tuổi (không phải bé Su) chạy tới, cầm một cái ví da đã sờn, mở ra: có **CMND, vài tờ tiền, và một tấm ảnh cũ**. Chúng đưa cho người chơi.
> *"Cô ơi cô, tụi con lượm được ở đằng kia nè."*
**Người chơi làm gì — bốn đường:**
| Hành động | Hệ quả ngắn | Hệ quả dài |
|---|---|---|
| **Để ví lên quầy, nhìn thấy được** | Ai đi ngang cũng thấy | **Chiều hôm đó chủ ví tới** — một người đàn ông lạ. Ông cảm ơn, mua 3 ổ, và ông quay lại ngày 39 và ngày 40 |
| Cất vào ngăn kéo | An toàn | Chủ ví tới ngày 38, hỏi, người chơi đưa. Cùng kết quả, chậm một ngày |
| **Cho hai đứa nhỏ mỗi đứa một ổ bánh mì không** | Tụi nó chạy đi khoe cả hẻm | Ngày 38–40 **ba đứa nhỏ khác cũng tới**. Không mang ví. Chỉ tới. `STALL_CLEANLINESS` hơi khó giữ hơn (tụi nhỏ làm đổ) và **hẻm nhìn đông vui hơn ở màn hình cuối** |
| Bảo tụi nó đem ra công an phường | Đúng. Không ai trách | Không có gì xảy ra. Đây là nhánh hoàn toàn hợp lệ và hoàn toàn không có thưởng |
> **E3 thi hành:** không nhánh nào được thưởng rõ. Nhánh "cho bánh" không tốt hơn nhánh "công an phường"; nó chỉ **đông hơn**.

---

**`SK-39` · ĐÁM CƯỚI TRONG HẺM** — *ngày 38* 🔴 *(bắt buộc)*
**Diễn biến:** nhà giữa hẻm dựng rạp từ 5h sáng. **Rạp chiếm 2/3 lối đi.** Loa thùng mở từ 6h. Bàn ghế đỏ. Người ta bưng mâm ra vô.
**Hệ quả vận hành — đây là một sự kiện VUI mà làm khó người chơi:**
- Lối vào xe bị chắn → khách phải lách → **hàng chờ đổi hình dạng**, `zone` của khách lệch hết (`FRONT_SIDE` thay vì `FRONT_CENTER`) → **bảng visibility đổi, mọi thói quen perception của người chơi sai một nhịp**.
- Loa thùng → **mọi bark tier-1 bị át**. Người chơi không nghe được khách nói gì. `WRONG_NAME` không được nghe thấy (lần duy nhất trong game nó bị chặn).
- Chú Kiệt **không dọn hàng được** vì rạp chắn phía chú → chú nghỉ một ngày.
- Khách vãng lai **tăng 50%** (khách đi đám cưới, đói, ghé mua).
**Người chơi làm gì:**
| Hành động | Hệ quả |
|---|---|
| **Đẩy xe ra đầu hẻm** (đổi chỗ đứng, mở từ ngày 16) | Bán được nhiều. Nhưng khách quen tới chỗ cũ, không thấy, và **bà Bảy phải đi thêm 80 mét** |
| **Ở nguyên chỗ** | Bán ít hơn. Nhưng nhà đám **mang ra cho một mâm** lúc 10h — xôi, thịt kho, và một lon bia mà cô Ba đẩy qua cho ông Hải |
| **Đóng cửa đi ăn cưới** | Hợp lệ. Mất doanh thu cả ngày. Cô Ba đi cùng. **Và đây là lần duy nhất trong game người chơi thấy cô Ba cười lớn** |
**Hệ quả dài:** 🟡 nhánh "đi ăn cưới" mở một cảnh ngắn ở màn hình kết (P4-04 §2.5) — một tấm ảnh chụp chung, chụp bằng máy film của chị Hạnh.
> ⚠️ **Lằn ranh (§14.1):** trang trí đám cưới trong hẻm — chữ **Song Hỷ**, rạp đỏ, bảng tên hai họ — **tất cả TỰ VẼ**. Không mua asset pack "Asian wedding". Xem P4-05 §2.5.

---

**`SK-40` · NGÀY BÁN BÌNH THƯỜNG CUỐI CÙNG** — *ngày 39*
**Diễn biến:** không có gì đặc biệt. Đó là điểm.
Hẻm vắng hơn (bà Sáu không đi ngang nữa, chú Tư không tới nữa, ông Hải đang dọn đồ). Trời mưa chiều. Người chơi dọn xe. Cô Ba **ghi sổ sớm hơn mọi khi** và cô ngồi lâu hơn ở trang cuối.
**Người chơi làm gì:** mua hàng cho ngày mai. **Số lượng người chơi mua cho ngày 40 là quyết định kinh tế cuối cùng của game** — và nó quyết định **có còn ổ bánh cuối cùng cho chị Lan hay không** (P4-04 §2.2).
> 🔴 **Đây là ràng buộc thiết kế tinh vi nhất của cả game.** Xem P4-04 §2.2, mục "nếu hết hàng".

---

### 2.2. 🔴 MÓN ĂN **LÀ** LỰA CHỌN HỘI THOẠI — 12 tình huống cụ thể

> `idea.md` §9.5 (bài học VA-11 HALL-A, được gọi là *"insight thiết kế mạnh nhất tìm được vòng này"*):
> *"Trong VA-11 HALL-A **không có bảng lựa chọn hội thoại nào cả**. Cách bạn pha ly rượu chính là lựa chọn hội thoại… Áp vào game của bạn: **không cần dialogue tree.** Bạn không chọn 'nói gì với chú Tư'. Bạn chọn **bỏ thêm ớt vì biết chú thích cay**, hoặc **bớt đường vì nghe chú nói đang bị tiểu đường tuần trước**. Món ăn là lời nói."*
>
> CANON **T2**: *"Không có dialogue tree. Người chơi không bao giờ chọn câu nói. Họ chọn nguyên liệu."*

**Vì sao điều này cắt được chi phí chứ không phải thêm chi phí:**

| | Dialogue tree | Món ăn là câu thoại |
|---|---|---|
| Chi phí viết | 3–5 nhánh × mỗi tình huống × mỗi NPC | **1 phản ứng, chọn bởi `diff(order.spec, dish)`** |
| Gameplay và narrative | Hai lớp dán vào nhau | **Cùng một thứ** |
| "NPC dễ thương nhưng giả" | Không giải được | Giải trực tiếp — người chơi **chứng minh** mình nhớ bằng tay, không bằng cách bấm dòng "Tôi nhớ bạn thích cay" |
| Hệ perception (T1) | Không liên quan | **Là chính nó** — vì hành động ở tầng nguyên liệu là hành động *nhìn thấy được* |

**Cấu trúc của một tình huống "món ăn là câu thoại":**
```
1. THÔNG TIN được nói ra ở ngày X, một lần, không nhấn mạnh, không ghi tự động
2. NGƯỜI CHƠI có thể ghi vào sổ tay (tuỳ họ)
3. Ở ngày X+n, tình huống nấu ăn cho phép ÁP DỤNG hoặc BỎ QUA thông tin đó
4. Áp dụng → NPC phản ứng như thể bạn vừa NÓI một câu mà bạn không nói
5. Bỏ qua → KHÔNG BỊ PHẠT. Chỉ là câu đó không được nói
```
**Luật (4) và (5) là trái tim.** Nếu bỏ qua mà bị phạt, cơ chế biến thành một bài kiểm tra trí nhớ và người chơi sẽ căng thẳng thay vì thân mật.

---

| Mã | Tình huống | Thông tin (ngày) | Hành động bằng món ăn | Tương đương câu thoại | Phản hồi NPC |
|---|---|---|---|---|---|
| **ML-01** | **Chú Tư và ớt** | Ngày 1: *"Cho chú nhiều ớt. Ớt mà, ăn cho nó tỉnh."* | Bỏ **5 khoanh** thay vì 3 (mức "nhiều" mặc định) | *"Con biết chú thích cay thiệt, không phải cay xã giao."* | Chú không nói gì. **Hôm sau chú tới sớm hơn 3 phút** |
| **ML-02** | 🔴 **Chú Tư bớt ớt (ngày 22)** | Ngày 22: chú nói *"Thôi khỏi ớt con. Bữa nay chú ăn lạt."* — **một lần, không giải thích** | Ngày 23 trở đi: **tự bớt ớt mà không hỏi** | *"Con có nghe hôm qua chú nói gì."* | Chú **nhìn lên một giây** rồi nhìn xuống. Đó là tất cả. **Không có `REMEMBERED_USUAL` nào bắn** — vì việc này quá riêng tư để thành một sự kiện có salience |
| **ML-03** | **Bà Bảy và cái răng** | Không ai nói. Người chơi phải **quan sát**: bà nhai chậm, bà gỡ vỏ cứng ra | Nướng đủ độ để **vỏ giòn mà ruột mềm**; **cắt đôi và gói riêng hai nửa** | *"Con để ý bà ăn làm sao."* | `REMEMBERED_USUAL` đầy đủ + bà nói *"Con này khôn."* |
| **ML-04** | 🔴 **Bé Su và ổ bánh mì không** | Ngày 1: bé gọi *"ổ bánh mì không, chấm sữa á cô"* | **Làm đúng ổ trống.** Không bỏ nhân vì nghĩ bé quên | *"Cô tin là con biết con muốn gì."* | Nếu bỏ nhân vào: bé **ăn và không nói gì**, nhưng **không quay clip hôm đó**. Một đứa nhỏ 13 tuổi bị người lớn cho là không biết mình muốn gì |
| **ML-05** | **Thầy Phúc và cọng ngò** | Ngày 1: *"đừng bỏ ngò"* | Không bỏ ngò. **Và không bỏ cả hành lá** — vì hai thứ đó nằm cạnh nhau trong khay và tay dễ quơ trúng | *"Con biết chỗ nào dễ nhầm."* | Bỏ nhầm 1 cọng → ông gỡ ra, không nói. **Nhưng hôm sau ông nhắc lại yêu cầu đầy đủ thay vì nói tắt.** Hình phạt là **mất quyền được nói tắt** |
| **ML-06** | 🔴 **Cô Mai và hai ổ ba biến số** | Ngày 2: *"một đầy đủ một không hành. Cô ăn với con Hương."* — không nói ổ nào của ai, không nói Hương ăn cay | Người chơi phải suy ra: **ổ không hành = cô Mai, ổ đầy đủ = Hương, và Hương ăn cay** (suy từ việc cô ghét ớt nhưng con gái cô thì không — quan sát được ở ngày 6) | *"Con biết nhà cô ăn uống ra sao."* | `REMEMBERED_USUAL` ×1.5. Cô không cảm ơn — cô **bắt đầu nói giá sỉ nguyên liệu** cho người chơi nghe. Quan hệ mở ra thông tin kinh tế |
| **ML-07** | 🔴 **Cô Mai ngày 30 — một ổ** | Ngày 30: Hương đi thực tập xa. **Cô không nói.** Cô chỉ gọi *"Cho cô một ổ."* | **Làm một ổ không hành. Không hỏi.** Không làm hai ổ rồi sửa | *"Con biết con Hương đi rồi."* | Cô im một lúc rồi nói *"Ừ. Còn một thôi."* `REMEMBERED_STORY` (70). **Nếu người chơi hỏi lại *"ủa còn ổ của Hương?"*** → không có hình phạt, nhưng cô phải nói ra thành lời, và cô không muốn |
| **ML-08** | **Anh Dũng và cái gói** | Không ai nói. Quan sát: anh **ăn khi dừng đèn đỏ**, anh **lau tay vào quần** | **Gói chặt, gấp đầu giấy vào, bớt nước sốt** | *"Con biết anh ăn kiểu gì."* | Anh không nói gì. Nhưng từ đó anh **không lau tay vào quần nữa**, và đó là tín hiệu hình ảnh duy nhất |
| **ML-09** | 🔴 **Chị Hạnh và chữ "ít"** | Ngày 4: chị gọi *"cho ít ớt"*. Ngày 5: chị **gỡ hai khoanh ra**. Không nói gì | "Ít" của chị = **1 khoanh**, "ít" của Sài Gòn = 3. Điều chỉnh xuống 1 | *"Con hiểu 'ít' của chị khác 'ít' của người ở đây."* | Chị không nhận ra ngay. Sau 3 lần, chị **bắt đầu không gỡ nữa**, và chị nói *"em làm vừa miệng chị ghê"* — và không ai giải thích tại sao |
| **ML-10** | **Chị Lan và số lát chả** | Không ai nói. Chị **đếm**, và người chơi không biết chị đếm | Giữ đúng **4 lát** mỗi ngày, kể cả ngày giá thịt lên | *"Con không ăn bớt của chị."* | Không có phản hồi tích cực nào. **Nhưng ăn bớt 1 lát → chị phát hiện ở lần thứ 2** (không phải lần thứ N) → `soi 0.9` + `deTha 0.2` = memory không decay. **Đây là NPC bịt lỗ hổng §8 (g)** |
| **ML-11** | 🔴 **Anh Bảo — dạy khẩu vị** | Không ai nói. Anh gọi "đầy đủ" mặc định vì anh **không biết mình được phép yêu cầu** | Tự bỏ thêm ớt cho anh, **4 lần liên tiếp** | *"Cô nghĩ em ăn được cay hơn thế."* | Ngày ~12, anh **tự nói**: *"Cho em nhiều ớt chút."* — **người chơi vừa thay đổi một con người bằng cách im lặng làm đúng.** Đây là hiện thân đẹp nhất của T2 trong game |
| **ML-12** | 🔴 **Anh Bảo ngày 29 — ổ bánh mì không** | Ngày 29: *"Cho em ổ bánh mì không thôi."* Giọng nhỏ hơn nửa mức | **Làm đúng ổ bánh mì không — và làm nó thật ngon.** Nướng lại giòn, rạch một đường, quết sữa đặc đều, gói đẹp. **Không thêm gì** | *"Cô không thấy em đang thiếu. Cô thấy em đang gọi món."* | Xem SK-31. **Ba cách "tốt bụng" khác đều làm anh xấu hổ.** Đây là bài học lớn nhất của game về lòng tốt |

**Ba tình huống dự phòng (nếu cần thêm khối lượng ở bản full):**

| Mã | Tình huống | Hành động | Tương đương |
|---|---|---|---|
| ML-13 | **Bà Sáu — ổ bánh mì không, nóng** | Bà thích thật, không phải khách sáo. Làm ổ đầy đủ cho bà = **làm sai** | *"Con không nghĩ bà đang ngại."* |
| ML-14 | **Ông Hải buổi sáng — trứng lòng đào** | Canh lửa để lòng đỏ còn chảy | *"Con nhớ chú buổi sáng."* → ông nói *"ngon"*, lần duy nhất trong game |
| ML-15 | **Ông Hải buổi chiều — bánh mềm** | Không nướng lại quá giòn | *"Con biết chiều chú nhai khó."* → ông **không nói gì và ăn hết**. Không có phản hồi. Đó là đúng |

**Luật kỹ thuật để 15 tình huống này chạy trên rule DB (CANON §11) mà không bùng nổ số dòng thoại:**

```ts
// Không phải 15 cây hội thoại. Là 15 dòng trong bảng tri thức + 1 rule chung.
type KnowledgeItem = {
  id: 'ML-02';
  npc: 'chu_tu';
  learnedOn: { day: 22, source: 'spoken_line' | 'observation' };
  appliesTo: (spec: RecipeSpec) => RecipeSpec;      // spec.chili = 1
  concept: 'PLAYER_APPLIED_KNOWLEDGE';
};

// MỘT rule duy nhất, dùng chung cho cả 15:
Rule {
  concept: 'PLAYER_APPLIED_KNOWLEDGE',
  criteria: [ npc == $npc, knowledgeId == $id, visitCount > learnedOnVisit ],
  responses: [ /* 2–4 biến thể riêng cho từng NPC, shuffle-bag */ ],
  applycontext: [('player_remembers_' + $id, true, FOREVER)],
  score: 3
}
```

> **Chi phí thật:** 15 `KnowledgeItem` (dữ liệu, ~15 dòng JSON) + ~40 dòng thoại phản hồi. Một dialogue tree cho cùng 15 tình huống với 3 nhánh/tình huống × 12 NPC = **>500 dòng**. Đây là đòn bẩy giảm khối lượng lớn nhất của dự án, lớn hơn cả shuffle-bag (§11).

---

### 2.3. ARC CHI TIẾT 12 NPC — dòng thời gian, điều kiện, điểm rẽ

**Bảng tổng: ai ở lại, ai đi, người chơi tác động được tới ai**

| NPC | Rời đi? | Ngày | Người chơi tác động được? | Cách tác động | Có mặt ngày 40? |
|---|---|---|---|---|---|
| **Bà Bảy** | Không | — | ⚠️ Một phần | SK-13 (tai nghe) · SK-27 (ở lại hẻm ngày 21) → mở `CORE` memory | ✅ **Mở hàng lần cuối** |
| **Chú Tư** | 🔴 **Có, vĩnh viễn** | **30** | ❌ **KHÔNG** | Không có hành động nào giữ chú lại. **Chủ ý tuyệt đối** | ❌ **Không quay lại** |
| **Anh Dũng** | ⚠️ Đổi ca | **18** | ✅ **Có** | Mua **đèn + bình giữ nhiệt** (SK-23, ngày 14) → giữ anh ở ca tối | ✅ **Tắt app, để mũ xuống ghế** |
| **Chị Lan** | 🔴 **Có** | **24** | ⚠️ **Đẩy sớm được, giữ lại KHÔNG được** | `WRONG_NAME` hoặc ăn bớt → biến mất sớm nhất **ngày 20**. Làm tốt → muộn nhất **ngày 26**. **Không có nhánh nào chị ở lại** | ✅ 🔴 **QUAY LẠI — trái tim của game** |
| **Bé Su** | Không | — | ✅ Có | SK-12 (ngày 5) quyết định nhánh clip. SK-16 (clip xấu) tránh được | ✅ **Xin phép quay** |
| **Ông Hải** | ⚠️ Về ở với con gái | **38** | ⚠️ Một phần | SK-29 nhánh (b) → cái bảng hiệu do ông vẽ ở lại | ❌ **Vắng — nhưng cái bảng thì còn** |
| **Cô Mai** | Không | — | ✅ Có | Ghi sổ nợ đúng/sai → ngày 40 chốt sổ khác nhau | ✅ **Chốt sổ** |
| **Thầy Phúc** | ❌ Giả báo động | 20–21 | ✅ Có | Ghi sổ tay → SK ngày 32 khác nhánh | ✅ **Tới 6h00, mua 2 ổ** |
| **Chị Hạnh** | ❌ Vắng 2 ngày | 10–11 | ✅ **Có, mạnh nhất** | ML-09 + không hỏi lại ngày 11 → arc hoà nhập nhanh/chậm. Chữ *"nghen"* ngày 27 hoặc ngày 35 | ✅ **Chụp tấm ảnh cuối** |
| **Anh Bảo** | Không | — | ✅ **Có, mạnh nhất** | ML-11 (dạy khẩu vị) · ML-12 (ngày 29) | ✅ **Không cầm điện thoại, gọi tên** |
| **Bà Sáu** | ⚠️ Đổi cách bán | **35** | ❌ Không | Không có hành động nào ngăn được — **và đó là tin tốt** | ✅ **Đi bộ tới, ngồi ghế nhựa** |
| **Chú Kiệt** | Không | — | ✅ **Có, quyết định nhất** | SK-11 nhánh (a)/(b) → SK-32 mở hay khoá | ✅ **Gật đầu rồi dừng lại** |

> **Đọc bảng — ba luật ẩn:**
> **1. Đúng một người mà người chơi không cứu được và không giải thích được: chú Tư.** Mọi người khác hoặc ở lại, hoặc người chơi tác động được, hoặc quay lại. Nếu có hai người như chú Tư, game thành bi quan. Nếu không có ai, game thành giả.
> **2. Người chơi không giữ được chị Lan — chỉ đẩy nhanh hoặc làm chậm.** Đây là điều quan trọng nhất: **cú quay lại ngày 40 không phải phần thưởng.** Nó xảy ra dù người chơi chơi thế nào. Nếu nó là phần thưởng, nó trở thành một ending "tốt", và §15 bị vi phạm.
> **3. Người chơi tác động mạnh nhất tới ba người: chị Hạnh, anh Bảo, chú Kiệt** — và không ai trong ba người đó rời đi. **Quyền năng của người chơi nằm ở việc làm người ta nở ra, không nằm ở việc giữ người ta lại.**

**Dòng thời gian gộp — 12 arc chạy song song:**

```
NGÀY   1    5    9   13   17   21   25   29   33   37  40
──────────────────────────────────────────────────────────
Bà Bảy ●────M1────M2──────────M3────────────────M4───●KẾT
                (tai nghe)  (ổ 2)     (bất hoà)  (đi coi hát)
Chú Tư ●═══════════════════════════M2──M3─M4─✖
                                (ớt)(nói)(nửa ổ)[30: TRỐNG]  ...M6 ngày 33
Dũng   ●──M1────────M2────S1S2S3✖/19h40──────────────M5──●KẾT
          (áo)     (app)  (báo trước) [18: đổi ca]  (con gái)
Chị Lan ●═════════════════M2════════S1S2S3S4✖                ●KẾT◀◀ QUAY LẠI
                      (lót ly)   (rạn)   [24: TRỐNG]  ...15 ngày im lặng
Bé Su  ●────M1────M2────────────────M3──────M4──────────●KẾT
          (quay) (clip nổ)      (clip xấu)(huy chương)
Ông Hải ●──M1──────────M2────────────M3─M4──────────M5──✖(38)
       (2 người)   (bảng hiệu)  (tróc)(vẽ)      (áo mới)
Cô Mai ●M1──────M2────M3──────────────M4────M5──────────●KẾT
      (tiền lẻ)(sổ nợ)(QR)        (chậu lan)(một ổ)
T.Phúc ●───M1──────M2────────✖✖────────────M4──────────●KẾT
          (dịch) (cây bút) (giả báo động)  (đọc sổ)
Chị Hạnh ●M1──M2──✖✖──────M3────────M4──M5─────────────●KẾT
        (mùi)(chọc)(vắng)(tự sửa) (nón)(nghen)
Anh Bảo ●══════════M2──────M3══════════════M4──────────●KẾT
              (dạy khẩu vị)(ngẩng đầu)  (hết tiền)
Bà Sáu ●─M1──────────────────M2──────────M3───M4───────●KẾT
        (đổi)          (nhà tui gần xe)(nắng)(bàn gấp)
Chú Kiệt      ●M1══════════════════════M2─M3────M4─────●KẾT
            (mở xe)                 (khăn)(nghề)(POS)
──────────────────────────────────────────────────────────
       ●=xuất hiện  ═=trạng thái ổn định  ✖=vắng  M=mốc arc
```

**Điểm rẽ — 6 quyết định của người chơi có hệ quả xa nhất:**

| # | Ngày | Quyết định | Rẽ thành |
|---|---|---|---|
| **1** | 5 | SK-12: che tay / bình thường / **làm đẹp hẳn** | Ngày clip nổ (9 / 10 / 16) → toàn bộ nhịp áp lực Hồi II |
| **2** | 3 & 6 | SK-02: nhận đổi với bà Sáu hay từ chối **hai lần** | Mất/giữ `softensNegative 0.30` cả mùa. **Không bao giờ được thông báo** |
| **3** | 14 | SK-23: mua QR / trà sữa / đèn — hay không | Mất anh Dũng (18→34) · mất khách trẻ (36→38) · bé Su không có `REMEMBERED_USUAL` |
| **4** | 25 | SK-11: **không làm gì** / **đem hũ đồ chua qua** / kể cho khách | Khoá hay mở SK-32 → `spread_probability` tin xấu của chú Kiệt 0.45 hay 0.15 |
| **5** | 26–27 | SK-29: thuê decal hay **nhờ ông Hải** | Cái bảng ở khung hình cuối là bảng in hay bảng tay run |
| **6** | 39 | SK-40: mua bao nhiêu hàng cho ngày mai | 🔴 **Còn hay không còn ổ bánh cuối cùng cho chị Lan.** Xem P4-04 §2.2 |

---

### 2.4. LỚP PHỤ "ĐƯỢC TIN GIAO THỨ QUÝ GIÁ"

> `idea.md` §11 (cuối mục): *"Đừng vứt ý tưởng tiệm ảnh. Nó vẫn là trục cảm xúc mạnh nhất Phần I. Cách dùng tốt nhất: **làm lớp phụ** — trong xe bánh mì, thỉnh thoảng một khách quen nhờ bạn giữ giùm/sửa giùm thứ gì đó có kỷ niệm."*

**🔴 Ràng buộc thiết kế cứng — đây KHÔNG được thành minigame thứ hai:**

| # | Luật | Vì sao |
|---|---|---|
| **G1** | **Tối đa 5 lần trong cả mùa.** Không hơn | Lớp phụ; nếu nhiều hơn nó thành trục chính và T1/T2 bị chia đôi sự chú ý |
| **G2** | **Không có màn hình riêng, không có UI riêng, không có thanh tiến độ** | Vật được giao **nằm trên quầy hoặc trong ngăn kéo, nhìn thấy được**. Hết |
| **G3** | **Người chơi không "sửa" gì cả.** Người chơi **giữ**, hoặc **giao lại**, hoặc **quên** | Sửa = minigame. Giữ = trách nhiệm. Chỉ cái thứ hai phục vụ chủ đề |
| **G4** | **Không có điểm, không có phần thưởng vật chất** | §15 · T3 |
| **G5** | **Rủi ro phải là RỦI RO THẬT và phải nhìn thấy được** | Vật để trên quầy có thể bị **ướt** (mưa), bị **dính dầu**, bị **rơi**, hoặc bị **quên mất** khi dọn xe |

**5 lần trong mùa:**

| # | Ngày | Ai | Vật | Nhờ gì | Rủi ro thật | Trả lại |
|---|---|---|---|---|---|---|
| **1** | **11** | **Bé Su** | **Cái điện thoại** (bé đi thi, không được mang vô phòng) | *"Cô giữ giùm con 40 phút nghen cô!"* | Nó **đổ chuông liên tục** (mẹ bé gọi). Nó nằm trên quầy, cạnh khay pate. Nếu người chơi để gần lò → nóng máy. Nếu để dưới quầy → bé về, không thấy, hoảng | Bé chạy về, thở hổn hển. Nếu máy dính dầu: bé lau vào áo, *"Hổng sao đâu cô"*, và bé **nói thật** |
| **2** | **17** | **Thầy Phúc** | **Cặp kính lão** (ông đi khám mắt, được nhỏ thuốc giãn đồng tử, không nhìn được) | *"Con giữ giùm thầy. Chút thầy về lấy."* | Kính **dễ vỡ**. Và người chơi sẽ quên nó ở đó trong giờ cao điểm 4 khách | Ông về 10h30. Nếu kính còn nguyên: ông đeo vào, nhìn quanh, và nói *"Ờ. Thấy rồi."* Nếu trầy: ông **không nói gì**, đeo vào, đi |
| **3** | **22** | **Bà Bảy** | **Xấp vé số 32 tờ** — trị giá **320.000₫**, gần bằng cả ngày lời | *"Bà chạy về thay áo cái, ướt hết rồi. Con giữ giùm bà xấp này."* | 🔴 **Đây là vật đắt nhất và rủi ro thật nhất.** Mưa. Vé số ướt là **vé số mất giá trị hoàn toàn**. Nếu người chơi để trên quầy mà mưa tạt → 320.000₫ biến mất, và **người chơi phải tự đền hoặc tự nói ra** | Bà về. Nếu ướt: bà nhìn, im 2 giây, rồi nói *"Thôi. Tại trời."* Và bà **không cho người chơi đền**. Người chơi phải sống với chuyện đó |
| **4** | **34** | **Bà Sáu** | 🔴 **Cả cái gánh tàu hũ** — nồi, chén, quang gánh | *"Con coi giùm tui mười lăm phút. Tui qua bển cái."* (Bà đi coi chỗ bán cố định — người chơi chưa biết) | Có người tới **hỏi mua tàu hũ**. Người chơi không biết giá, không biết múc bao nhiêu, không biết tỉ lệ nước đường. **Và người chơi phải quyết định: bán hay không bán** | Bà về. Nếu người chơi đã bán được: bà **cười lớn**, đếm tiền, và bà đưa lại **đúng số tiền đó cho người chơi**, và người chơi phải **từ chối** — và đó là cả một đoạn hội thoại không có một dòng thoại nào được chọn |
| **5** | **37** | **Chị Hạnh** | **Một cuộn phim đã chụp, chưa tráng** | *"Em giữ giùm chị. Chị đi công tác ba ngày, để phòng trọ chị sợ nóng."* | Phim **sợ nóng và sợ sáng**. Cạnh lò. Người chơi phải **chủ động cất chỗ mát** — và không có UI nào nhắc | Ngày 40 chị lấy lại. Trong cuộn phim đó có tấm ảnh xuất hiện ở màn hình kết (P4-04 §2.5) |

**Cơ chế thi hành (đơn giản tới mức gần như không có cơ chế):**

```ts
type EntrustedItem = {
  id; from: NpcId; day: number;
  slot: 'quay' | 'ngan_keo' | 'trong_nha' | 'canh_lo';
  hazards: { rain?: boolean; heat?: boolean; oil?: boolean; drop?: boolean };
  condition: 'nguyen_ven' | 'hu_nhe' | 'hu_nang' | 'quen_mat';
  returnDay: number;
};
// Không có tick, không có timer UI. Kiểm tra condition chỉ 3 lúc:
//   (1) khi trời bắt đầu mưa   (2) khi lò bật quá 20 phút   (3) khi dọn xe cuối ngày
```

**Và luật quan trọng nhất của toàn bộ lớp phụ này:**
> 🔴 **Không một NPC nào trách người chơi khi vật bị hỏng.** Không một lần. Bà Bảy nói *"Thôi. Tại trời."* Thầy Phúc không nói gì. Bé Su nói *"Hổng sao đâu cô."*
> **Toàn bộ trọng lượng cảm xúc đến từ việc họ KHÔNG trách.** Nếu có một NPC trách, cơ chế biến thành một bài kiểm tra và người chơi sẽ save-scum.

---

### 2.5. TIẾNG RAO — chất liệu âm thanh và cảm xúc

> CANON §14 · `idea.md` §19.3: *"**Tiếng rao** (chất liệu âm thanh): 'Bánh mì Sài Gòn, đặc ruột thơm bơ, một ngàn một ổ…' · 'Bánh mì nóng giòn đê... ê...' — rao qua loa, giọng ghi âm sẵn. SGGP có bài **'Tiếng rao… lặng yên'** về việc tiếng rao đang mất dần — **chất liệu cảm xúc cho cái kết**."*

**Ba tiếng rao trong game — đây là bộ nhận diện âm thanh:**

| # | Của ai | Nguyên văn | Tính chất | Vai trò |
|---|---|---|---|---|
| **R1** | **Bà Sáu** (người) | *"Ai... tàu hũ nước đường hông..."* | **Giọng thật, không loa.** Kéo dài, lên ở giữa, tắt dần ở cuối. Xa → gần → xa | **Mốc giờ 8h50 và 15h30.** Người chơi dùng nó để biết đã tới đâu trong ngày mà không cần nhìn đồng hồ |
| **R2** | **Chú Kiệt** (loa) | *"Bánh mì nóng đây! Mười lăm ngàn thôi bà con ơi!"* | **Loa kéo, giọng ghi âm sẵn, lặp vòng, biên độ nén.** Không có hơi người trong đó | **Áp lực.** Nó át tiếng rao của người chơi. Nó là âm thanh của việc bị cạnh tranh |
| **R3** | **Xe bánh mì dạo đi ngang** (loa, vô danh) | *"Bánh mì Sài Gòn, đặc ruột thơm bơ, một ngàn một ổ..."* | Loa rè, chạy ngang, Doppler | **Nền.** Xuất hiện ngẫu nhiên 1–2 lần/ngày. **Đây là tiếng rao mà ai chơi game cũng từng nghe ngoài đời** |

**Và tiếng rao của người chơi — đây là một cơ chế, không phải một hiệu ứng:**

| Giai đoạn | Cái gì |
|---|---|
| **Ngày 1–8** | **Không có.** Người chơi không rao. Cô Ba cũng không rao. Xe đứng một chỗ, khách tự tới |
| **Ngày 5** | Chú Kiệt bắt đầu rao (R2). **Đây là lần đầu người chơi nghe thấy sự thiếu vắng của tiếng rao mình.** |
| **Ngày 9+** | Người chơi **có thể rao** — một nút, giữ 1 giây, giọng của chính người chơi (**VO người thật**). Hiệu ứng: khách vãng lai đi ngang có **xác suất dừng lại +25%** trong 30 giây |
| **Giá của nó** | Rao **làm khách đang đứng nhìn mình** (một dạng gaze tự tạo). `gazeFactor` của mọi khách trong bán kính +0.2 trong 5 giây. **Rao là tự chiếu đèn vào mình.** Người chơi phải chọn giữa đông khách và ít bị soi |
| **Ngày 21+** | Nếu người chơi rao đều, **bé Su bắt chước** và rao theo, cười, rồi chạy đi. Một lần. Không có hệ quả |
| **Ngày 35** | 🔴 **Tiếng rao R1 của bà Sáu biến mất** (bà bán cố định). Mốc giờ 8h50 và 15h30 **không còn âm thanh nào đánh dấu**. Game không nói gì. Người chơi mất một cái đồng hồ mà họ không biết mình đang dùng |
| **Ngày 40** | Xem dưới |

**🔴 Tiếng rao ở ngày 40 — dùng cho cái kết (P4-04):**

Sáng ngày 40, hẻm có đủ ba tiếng rao trong khoảng 6h00–8h00:
- R3 (xe dạo vô danh) đi ngang lúc 6h05 — như mọi ngày, không biết gì.
- R2 (chú Kiệt) — nhưng **chú tắt loa sớm hơn mọi khi**, lúc 7h.
- R1 **không có.** Bà Sáu không đi ngang nữa từ ngày 35.

Và ở cảnh cuối cùng, khi người chơi bán ổ bánh cuối, **âm thanh duy nhất còn lại trong hẻm là tiếng rao của chính người chơi** — nếu người chơi từng dùng nó. Nếu chưa bao giờ rao, **cảnh đó im lặng**, và đó cũng đúng.

> **Chỉ đạo âm thanh cho ngày 40:** không thêm nhạc. Không swell. Layer mất dần theo thứ tự: xe máy (6h30) → tiếng người (7h20) → loa chú Kiệt (7h) → quạt gió lò (khi tắt lò). **Cái cuối cùng tắt là tiếng quạt lò.** Sau đó là tiếng hẻm trống, thu thật, 40 giây.

**Ghi chú sản xuất:**
- **Tất cả tiếng rao thu bằng người thật**, ngoài trời, có tiếng nền. **Không AI voice** (§14.1 · `idea.md` §19.5: *"tôi nghe ra AI voice trong 2 giây và tôi sẽ refund"*).
- R1 (bà Sáu) thu **3 khoảng cách** (xa 40m / gần 8m / ngang qua 2m) để dựng Doppler thật thay vì lọc số.
- R2 (chú Kiệt) thu **một lần rồi phát lặp qua mô phỏng loa kéo** — vì ngoài đời nó đúng là một file ghi âm phát lặp. Sự vô hồn đó là nội dung.

---

## 3. Dữ liệu & schema

```ts
type EventId = `SK-${number}`;

type ContentEvent = {
  id: EventId;
  name: string;
  act: 1 | 2 | 3 | 4;
  day: number | { from: number; to: number };   // cửa sổ, nếu có điều kiện
  mandatory: boolean;                            // 11 sự kiện bắt buộc của brief

  trigger: {
    auto?: boolean;
    requires?: Condition[];        // KHÔNG BAO GIỜ là "điểm >= n"
    weather?: Weather;
    npcPresent?: NpcId[];
  };

  // T2: KHÔNG CÓ TRƯỜNG `choices` VỚI NỘI DUNG LÀ CÂU NÓI.
  playerActions: {
    id: string;
    kind: 'mon_an' | 'dua_vat' | 'than_the' | 'khong_lam_gi';   // E2 — đúng 4 loại
    label: string;                 // mô tả cho design doc, KHÔNG hiện trên UI
    shortTerm: string;
    longTerm: string;
    setsFlags?: string[];
    unlocks?: EventId[];
    locks?: EventId[];
  }[];

  soundNotes?: string;
  redLineNotes?: string;           // ghi chú lằn ranh nếu sự kiện có rủi ro văn hoá
};

// CI — thi hành E1:
it('không sự kiện nào có cây hội thoại (T2)', () => {
  for (const e of ALL_EVENTS) {
    expect(e).not.toHaveProperty('choices');
    expect(e).not.toHaveProperty('dialogueTree');
    for (const a of e.playerActions)
      expect(['mon_an','dua_vat','than_the','khong_lam_gi']).toContain(a.kind);
  }
});
it('mọi sự kiện đều có nhánh "không làm gì" (E2.d)', () => {
  for (const e of ALL_EVENTS)
    expect(e.playerActions.some(a => a.kind === 'khong_lam_gi')).toBe(true);
});
```

**Ví dụ thật — `content/events/SK-31.json`:**

```json
{
  "id": "SK-31",
  "name": "Cuối tháng, khách hết tiền",
  "act": 3, "day": 29, "mandatory": true,
  "trigger": { "auto": true, "npcPresent": ["anh_bao"] },

  "setup": {
    "npcLine": "Cho em ổ bánh mì không thôi.",
    "deliveryNote": "nhỏ hơn bình thường nửa mức, mắt vẫn ở điện thoại. KHÔNG run giọng. Nếu VA đọc tội nghiệp thì hỏng.",
    "witness": { "npc": "ba_bay", "condition": "day % 2 == 1", "line": "Hồi đó con Hương nhà cô Mai cũng vậy đó." }
  },

  "playerActions": [
    { "id": "len_bo_pate", "kind": "mon_an",
      "label": "Lén bỏ pate vào ổ bánh mì không",
      "shortTerm": "Anh không biết ngay.",
      "longTerm": "Anh mở giấy ngoài kia, thấy pate. VẮNG ngày 30. Quay lại ngày 31 TRẢ TIỀN. Lòng tốt sai cách.",
      "setsFlags": ["anh_bao_xau_ho"] },

    { "id": "free_extra", "kind": "dua_vat",
      "label": "Cho thêm miễn phí, nói rõ",
      "shortTerm": "Anh nói 'dạ thôi cô' hai lần rồi nhận.",
      "longTerm": "FREE_EXTRA diminishing returns (§8 i) và ở đây nó ÂM.",
      "setsFlags": ["anh_bao_xau_ho"] },

    { "id": "ghi_so_no", "kind": "dua_vat",
      "label": "Ghi sổ nợ",
      "shortTerm": "Anh đồng ý quá nhanh.",
      "longTerm": "Trả đủ ngày 33. Nhưng không gọi trà sữa cho tới hết mùa." },

    { "id": "lam_dung_va_lam_ngon", "kind": "mon_an",
      "label": "Làm đúng ổ bánh mì không — nướng giòn, rạch một đường, quết sữa đặc đều, gói đẹp",
      "shortTerm": "FLOURISH. Không FREE_EXTRA. Anh cầm, đi.",
      "longTerm": "Ngày 40: anh tới KHÔNG cầm điện thoại, gọi tên người chơi.",
      "setsFlags": ["anh_bao_duoc_ton_trong"],
      "unlocks": ["SK-ENDING-BAO"] },

    { "id": "khong_lam_gi", "kind": "khong_lam_gi",
      "label": "Làm ổ bánh mì không bình thường, không nghĩ gì thêm",
      "shortTerm": "Không có gì xảy ra.",
      "longTerm": "Không có gì xảy ra. Đây là nhánh hợp lệ." }
  ],

  "designNote": "Ba trong bốn cách 'tốt bụng' đều làm anh xấu hổ. Tôn trọng không phải là cho thêm; tôn trọng là làm đúng cái người ta gọi và làm nó tử tế.",
  "redLineNotes": "§14.1 hạ thấp nghề: KHÔNG có dòng nào gợi ý sinh viên nghèo là bi kịch. Anh hết tiền vì cuối tháng. Chuyện bình thường."
}
```

**Schema cho lớp "được tin giao" và cho bảng tri thức ML:**

```ts
type KnowledgeItem = {
  id: `ML-${number}`;
  npc: NpcId;
  learnedFrom: { day: number; source: 'spoken_line' | 'observation'; text?: string };
  apply: (spec: RecipeSpec) => RecipeSpec;
  equivalentLine: string;         // CHỈ DÙNG CHO DESIGN DOC — không bao giờ hiện trên UI
  npcResponse: { concept: string; variants: string[] };
  ignorePenalty: 'none';          // LUÔN LUÔN 'none' — luật (5) của §2.2
};

it('bỏ qua một ML không bao giờ bị phạt', () => {
  for (const k of ALL_KNOWLEDGE) expect(k.ignorePenalty).toBe('none');
});
```

---

## 4. UI/UX hai thiết bị

**Nguyên tắc: sự kiện nội dung KHÔNG CÓ UI RIÊNG.** Không khung sự kiện, không popup, không "Sự kiện mới!".

| Thứ | PC | Mobile (v2) |
|---|---|---|
| **Sự kiện bắt đầu** | Không dấu hiệu nào. Chuyện chỉ xảy ra trong khung hẻm | Như PC |
| **Nghe lỏm (SK-05)** | Bong bóng thoại nhỏ hơn 60%, mờ hơn, **ở vị trí xa trong khung hẻm**. Chữ bị khuyết nếu người chơi ở xa: *"...cái con nhỏ bên xe bánh mì đó..."* | Bong bóng ở mép trên, có thể chạm để phóng to **nhưng phóng to thì mất thời gian phục vụ** |
| **Trang "Người ta kể"** (mở ngày 9) | Tab thứ hai trong sổ tay. Chữ viết tay. **Ghi cả nguồn** | Như PC |
| **Vật được tin giao** | **Nằm trên quầy, vẽ ra, nhìn thấy được.** Không có ô inventory | Như PC. Slot quầy có 3 vị trí nhìn thấy được |
| **Nút rao** | Phím `R`, giữ 1 giây. Có phản hồi hình: sóng âm nhỏ lan ra + **mắt khách trong bán kính chuyển sang `gaze_face`** — người chơi *thấy* được cái giá của việc rao (T5) | Nút tròn góc dưới phải, giữ |
| **Lựa chọn của người chơi** | ❌ **Không có ô lựa chọn nào, ở đâu, bao giờ.** Người chơi hành động bằng cách làm | ❌ |
| **Tiếng rao mất (ngày 35)** | Không thông báo | Không thông báo |

**Trang "Người ta kể" — mẫu:**
```
┌───────────────────────────────────────────────┐
│  NGƯỜI TA KỂ                                  │
│  ───────────────────────────────────────────  │
│  ngày 9   "làm rớt cái gì đó xuống đất"       │
│           nghe từ: bà Sáu · nguồn: bà Bảy     │
│                                               │
│  ngày 16  "cái bảng đó ông Hải viết"          │
│           nghe từ: bà Sáu · nguồn: bà Sáu     │
│                                               │
│  ngày 27  "bánh nó nướng non"                 │
│           nghe từ: khách lạ · nguồn: ???      │
└───────────────────────────────────────────────┘
```
Không có nút "phản bác". Không có chỉ số "độ tin". Chỉ có **chuỗi nguồn** (§12 ràng buộc 3) — và dấu `???` khi chuỗi đứt quá 2 hop.

**Trợ năng (§15):**
- **Công tắc "NPC nhớ nhầm / đổ oan"**: tắt → mọi `mutation_rate` = 0. Trang "Người ta kể" vẫn có, **nhưng mọi dòng đều đúng sự thật**. Người chơi vẫn thấy tin lan (USP giữ nguyên), chỉ không bao giờ bị đổ oan.
- **Công tắc "tiếng ồn đám đông riêng"**: SK-39 (đám cưới) là ngày loa to nhất game → kênh riêng cho loa thùng, hạ được về 0 mà **không mất bark của khách**.
- **Chế độ không giới hạn thời gian**: SK-05 (nghe lỏm) mất cái giá của nó (không còn `MADE_THEM_WAIT`) — **chấp nhận được**, người chơi được nghe trọn vẹn 100%.
- **Pause mọi lúc**: kể cả giữa SK-19 (đang đếm tiền bà Sáu bán hộ) và giữa SK-39.

---

## 5. Tham số cần tune

| Tham số | Khởi điểm | Khoảng | Cách đo |
|---|---|---|---|
| Số sự kiện nội dung / mùa | **40** | 30–48 | Brief yêu cầu ≥30. 40 khớp với lịch P4-02 |
| Độ nghe rõ khi nghe lỏm (SK-05) | **60%** từ vị trí quầy | 45–75% | ≥7/10 playtester thuật lại đúng **nội dung**, ≤4/10 thuật đúng **từng chữ** |
| `MADE_THEM_WAIT` khi dừng nghe lỏm | leo sau **12 giây** | 8–18s | Phải đủ để việc nghe có giá, không đủ để người chơi bỏ hẳn |
| Tăng khách sau clip bé Su | **+40%**, 3 ngày | +25…+55% | Đo số lỗi người chơi phạm ngày 11–13: mục tiêu **tăng 2–3× so với ngày 8–10** |
| `FLOURISH` ×n khi bé Su quay | **×3** | ×2…×4 | — |
| `gazeFactor` +n khi rao | **+0.2**, 5 giây | +0.1…+0.3 | Người chơi phải **thấy** cái giá (T5). Playtest: ≥6/10 nhận ra rao làm mình bị nhìn |
| Xác suất khách dừng khi rao | **+25%**, 30 giây | +15…+35% | Đủ để rao đáng làm |
| ML — số ngày giữa "học" và "áp dụng được" | **≥1 ngày** | 1–3 | Không bao giờ 0: phải ngủ một đêm rồi mới được thưởng cho trí nhớ |
| Số lần "được tin giao" / mùa | **5** | 4–6 | G1. Nếu >6, đo lại xem có bị đọc như minigame không |
| Xác suất SK-19 ra kết quả tiền | 60 / 25 / 15 | — | Seed cố định theo ngày (§8 e) + stream `npcSchedule` tách riêng (**§8.1 L1** — 6 stream RNG) → **không reroll được bằng cách reload rồi hỏi thêm một câu** |
| Thời lượng SK-32 (chú Kiệt nói nghề) | **4 phút** | 3–5 | Playtest: ≤2/10 bỏ qua/skip |
| Độ dài im lặng cuối ngày 40 | **40 giây** | 25–60s | Đo tỉ lệ người chơi ngồi yên tới hết. Mục tiêu ≥7/10 |

---

## 6. Tiêu chí đạt

- [ ] **40 file `content/events/SK-xx.json`** load được; **11 sự kiện bắt buộc** của brief đều có `mandatory: true` và đều tồn tại:
      SK-19 (tự đứng bán hộ) · SK-07 (cáu vô cớ) · SK-09 (mưa nán lại) · SK-31 (hết tiền cuối tháng) · SK-17 (dẫn người mới khoe) · SK-04 (chú Kiệt cạnh tranh) · SK-06 (đưa nhầm đơn) · SK-38 (nhặt ví) · SK-39 (đám cưới) · SK-10 (cúp điện) · SK-26 (chuyển nhà không báo).
- [ ] 🔴 **Test E1 xanh:** grep `content/events/` → **0 kết quả** cho `choices`, `dialogueTree`, `dialogue_options`.
- [ ] 🔴 **Test E2 xanh:** mọi `playerActions[].kind` ∈ 4 loại; **mọi sự kiện có nhánh `khong_lam_gi`**.
- [ ] **Test ML xanh:** mọi `KnowledgeItem.ignorePenalty === 'none'`.
- [ ] **≥12 `KnowledgeItem`** implement và chạy được (ML-01 → ML-12).
- [ ] 🔴 **Nghiệm thu T2 (quan trọng nhất của doc này).** Cho 10 người lạ chơi tới ngày 25, rồi hỏi:
      *"Bạn nói chuyện với chú Tư bằng cách nào?"* → **≥7/10 phải mô tả một hành động nấu ăn**, không phải một câu nói. Nếu ai trả lời *"tôi chọn câu thoại"* → có bug hoặc có UI sai ở đâu đó.
- [ ] **SK-07 (cáu vô cớ):** hỏi ngay sau đó *"bạn làm sai gì?"* → **≥6/10 trả lời "không có gì"**. Nếu ≥5/10 nghĩ mình làm sai, tăng độ rõ của `diff` rỗng (hiện ổ bánh đúng spec trong 1 giây trước khi anh ta nói).
- [ ] **SK-08 (anh Bảo ngẩng đầu):** hỏi ở ngày 40 *"có khoảnh khắc nào bạn nhớ nhất không?"* → **≥5/10 tự nhắc tới sự kiện này mà không được gợi ý**.
- [ ] **SK-19 (bán hộ):** ≥8/10 mô tả được rằng bà Sáu đã tự khai mình không phải nhân viên.
- [ ] **SK-11 → SK-32:** trong 10 người, **≥3 người phải chọn nhánh (b)** (đem đồ chua qua). Nếu 0/10 chọn, tín hiệu "chú hết hàng thật" chưa đủ rõ ở ngày 24–25.
- [ ] **Lớp được tin giao:** ≤1/10 mô tả nó như một "nhiệm vụ phụ" hay "minigame". Nếu >1, cắt bớt còn 4 lần.
- [ ] **Tiếng rao:** ở ngày 36, hỏi *"có gì khác không?"* → **≥3/10 nhận ra tiếng rao bà Sáu đã mất**. (Ngưỡng thấp là chủ ý — mất mát này được thiết kế để phần lớn người chơi chỉ *cảm thấy*, không *nhận ra*.)
- [ ] **Grep lằn ranh:** 0 kết quả cho danh sách từ khoá chiến tranh (P4-05 §2.7) trong toàn bộ `content/events/`.
- [ ] Mọi sự kiện có **ít nhất một cảnh nghe lỏm khả dĩ** nếu nó sinh ra tin đồn (§12 rb.4). Kiểm bằng danh sách, không bằng test.

---

## 7. Rủi ro & cách bịt

| Rủi ro | Mức | Cách bịt | Nối tới |
|---|---|---|---|
| 🔴 **Ai đó thêm một ô lựa chọn thoại "cho nhanh"** vào một sự kiện | **Cao nhất** | Test E1 trong CI. Schema **không có trường** `choices`. Ghi chú `designNote` trong mỗi file | CANON **T2** · §16 |
| 🔴 **SK-07 bị "sửa" thành có nhánh làm anh ta dịu lại** | Cao | Ghi rõ trong file: *"nếu có nhánh dịu lại, cắt nhánh đó"*. Đây là sự kiện dễ bị hiểu nhầm là thiếu sót thiết kế | Brief · §15 |
| **Lớp "được tin giao" phình thành minigame thứ hai** | Cao | G1–G5. Đặc biệt **G2 (không UI riêng)** và **G3 (không sửa, chỉ giữ)** | `idea.md` §11 |
| **NPC trách người chơi khi vật bị hỏng → save-scum** | Cao | Luật: **không một NPC nào trách**. Cộng autosave ngay + seed cố định (§8 e) | CANON §8 e |
| 🔴 **Người chơi bỏ qua một ML rồi thấy bị phạt → cơ chế thành bài kiểm tra trí nhớ** | Cao | `ignorePenalty: 'none'` có test. Và luật (5) của §2.2 | `idea.md` §9.5 |
| **Micro-cheat: bớt 1 lát chả với 100% khách** | Cao (§8 g) | ML-10 (chị Lan đếm, phát hiện lần 2) + thầy Phúc nói theo **pattern** sau 4–5 lần + bark *"dạo này bánh nhạt hơn hay tại tao?"* | CANON §8 g |
| **Spam `FREE_EXTRA` để mua chuộc** | Trung | §8 (i): diminishing returns + **SK-31 chứng minh nó phản tác dụng** với một người có lòng tự trọng | CANON §8 i |
| **Đồn thổi làm người lo âu rumination** | Cao | Công tắc "nhớ nhầm/đổ oan" · trang "Người ta kể" **có nguồn truy vết được** (biết được tin từ đâu làm giảm rumination) · sổ tay cô Ba mỗi tối | `idea.md` §17 XĐ3 (Linh) |
| **SK-18 (nhại giọng) bị đọc là game chế nhạo người Bắc** | 🔴 Lằn ranh | Người nhại là **khách vãng lai vô danh**; người chặn là **ông Hải, người Việt trong hẻm**; chị Hạnh **quay lại** và arc kết thúc ở chỗ chị thuộc về. **Không có nhân vật nước ngoài nào** | §14.1 |
| **SK-39 (đám cưới) dùng asset pack trang trí** | 🔴 Lằn ranh | Chữ Song Hỷ, rạp, bảng hai họ, mọi thứ có chữ hoặc có hình → **TỰ VẼ**. Checklist ở P4-05 §2.5 | §14.1 |
| **Chú Kiệt bị đọc là phản diện** | Trung | SK-32 (4 phút nói nghề, có Gundam) + SK-37 (chú thắng bằng làm ăn giỏi). Nếu playtest cho thấy ≥5/10 ghét chú ở ngày 40 → **tăng tần suất chú gật đầu buổi sáng** | XĐ1.5 |
| **40 sự kiện là quá nhiều để ship** | Cao | Ưu tiên: **11 sự kiện `mandatory`** + SK-32 + SK-13 + SK-27 + SK-36 = **15 sự kiện lõi**. 25 cái còn lại là nội dung mở rộng, cắt được mà lịch P4-02 vẫn đứng | CANON §11 · §17 |
| **Sự kiện tạo tin đồn mà không nghe lỏm được** | Trung | Luật: tin nào không có cảnh nghe lỏm khả dĩ thì **không được tồn tại**. Kiểm bằng danh sách đối chiếu | CANON §12 rb.4 |

---

## 8. Truy vết

| Nội dung | `CANON.md` | `idea.md` |
|---|---|---|
| 🔴 **Món ăn LÀ lựa chọn hội thoại, không dialogue tree** | **§1 T2** | **§9.5** (VA-11 HALL-A) · §23 "Giữ nguyên" |
| 11 sự kiện cơ chế (khác 40 sự kiện nội dung ở đây) | §3 | — |
| Delivery-diff, `take(1)`, `ANTICIPATED`/`DISCOVERED` | §6 | — |
| Rule DB chấm điểm theo độ cụ thể, `applycontext`, shuffle-bag | §11 | §18.1 |
| Trí nhớ 3 tầng, `CORE` 1 slot | §12 | §18 |
| Đồn thổi: cap 2–3 hop, nguồn truy vết được, **nghe lỏm là bắt buộc**, tin tốt lan mạnh hơn | §12 (6 ràng buộc) | §18 |
| Mutation graph (`ORDER_DEFECT` → *"ăn bớt nguyên liệu"*) | §12 | §18 |
| Không mở gossip trong 2 giờ đầu | §12 rb.6 | — |
| Lỗ hổng (b), (g), (i), (e), (l) | §8 | §21 |
| Kẻ gian dối vệ sinh là chú Kiệt, không phải người chơi | §7 XĐ1.5 | §17 XĐ1 |
| Cô Ba là người dạy, không phải hệ thống phạt | §7 XĐ1.4 | §17 XĐ1 |
| **Khách tự đứng bán hộ** — *"sự kiện ngẫu nhiên hay nhất có thể có"* | **§14** | **§19.2** |
| **Sổ nợ** — chỗ duy nhất "nhớ nhầm" hợp trực giác | §14 | §19.2 |
| **Bảng QR** là một upgrade thật; 11 ngày/tháng không tiêu tiền mặt | §14 | §19.2 |
| **"Nhà tui gần xe bánh mì cô Ba"** — thước đo tiến trình | §14 | §19.2 |
| Ngôn ngữ gọi món nguyên văn | §14 | §19.3 |
| 🔴 **Tiếng rao** + *"Tiếng rao… lặng yên"* (SGGP) — chất liệu cho cái kết | **§14** | **§19.3** |
| Lằn ranh đỏ: bản đồ tự vẽ, làm sai món Việt, hạ thấp nghề, chiến tranh, credits | §14.1 | §19.4 |
| Chống rập khuôn nhân vật | §9 | §19.5 |
| 🔴 **Lớp phụ "được tin giao thứ quý giá"** | — | **§11** (cuối mục) |
| Lồng tiếng người thật, không AI voice | §2 | §19.5 |
| Trợ năng: công tắc nhớ nhầm, tiếng ồn riêng, không giới hạn thời gian, pause | §15 | §20 |

---

## 9. Đề xuất sửa CANON

**Đ1 — Bổ sung §14: ghi nhận TIẾNG RAO CỦA NGƯỜI CHƠI là một cơ chế, không chỉ là chất liệu âm thanh.**
CANON §14 hiện liệt kê tiếng rao gián tiếp qua `idea.md` §19.3 như "chất liệu âm thanh". Doc này biến nó thành cơ chế có đánh đổi: **rao làm khách dừng lại nhiều hơn (+25%) nhưng làm `gazeFactor` của mọi khách trong bán kính tăng (+0.2 trong 5 giây)** — tức là **rao là tự chiếu đèn vào mình**. Đề xuất ghi một dòng vào §14 vì: (a) nó là một công cụ **ngược** với §5.4 (các công cụ *hạ* attention), và bộ công cụ cần có cả hai chiều để T5 có chiều sâu; (b) nó cho tiếng rao một lý do gameplay để tồn tại, nên khi nó **mất** ở ngày 40 thì sự mất mát đó có trọng lượng cơ chế chứ không chỉ trọng lượng thẩm mỹ.

**Đ2 — Bổ sung §3 hoặc §12: cho phép một `memory.kind` tồn tại mà KHÔNG sinh sự kiện có salience.**
Tình huống ML-02 (chú Tư bớt ớt ngày 22) cần một loại ghi nhận **không bắn `REMEMBERED_USUAL`**: người chơi làm đúng một điều rất riêng tư, và NPC phản ứng bằng một cái nhìn lên một giây, **không phải bằng một sự kiện tích cực salience 90**. Nếu buộc phải dùng `REMEMBERED_USUAL`, khoảnh khắc đó bị đánh đồng với việc nhớ đơn hàng thường ngày và mất hết trọng lượng. Đề xuất: thêm khái niệm **`QUIET_ACKNOWLEDGEMENT`** — ghi memory, ảnh hưởng quan hệ, **salience = 0**, không bark, không tip, chỉ một animation mắt. Dùng cho ~5 khoảnh khắc riêng tư nhất trong game.

**Đ3 — Ghi chú, không phải sửa:** §8 mục (g) gọi micro-cheat lặp vô hạn là *"lỗ hổng lớn nhất hiện tại"*. Doc này bịt nó bằng **ba lớp nhân vật** thay vì một cơ chế phát hiện: ML-10 (chị Lan đếm, `soi 0.9` + `deTha 0.2`, phát hiện ở lần **thứ 2**), thầy Phúc (nói theo pattern sau 4–5 lần, **nói nhỏ và riêng tư**), và bark chung *"ê, dạo này bánh nhạt hơn hay tại tao?"*. Nếu hội đồng thấy đúng hướng, đề xuất §8 (g) ghi rõ rằng **cách bịt là một NPC cụ thể có chỉ số phù hợp, không phải một bộ đếm toàn cục** — vì bộ đếm toàn cục sẽ bị datamine (§8 f) còn một người phụ nữ đếm số lát chả thì không.
