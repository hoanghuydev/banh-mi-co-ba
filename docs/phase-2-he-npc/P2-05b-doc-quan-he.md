# P2-05b — Đọc quan hệ trong sổ tay

**Thuộc phase:** P2 — Hệ NPC đầy đủ
**Phụ thuộc:** `P2-05` (sổ tay — đây là phụ lục của nó) · `P2-03` §2.5 bucket, §2.8 trần tin · `P2-04` (đồn thổi)
**Giọng:** sổ của chính người bán, ngôi thứ nhất — **không có cô Ba** (quán là của người chơi; cô Ba chỉ ở màn mở đầu P4-06)
**Trạng thái:** **Đã dựng** (`sim/notebook`, `sim/memory`, `ui/notebook`, `content/lines/so-tay.json`) · **Cần đo** ngưỡng `KNOWN_AFTER_VISITS` và `CEIL_PRESS` bằng playtest · **Còn mở** phương án C (§6)

---

## 1. Mục tiêu

Người chơi phải đọc được **mình đang đứng ở đâu với mười hai người trong hẻm**, mà không biến mười hai người đó thành mười hai cái thanh phải farm.

Yêu cầu gốc của chủ dự án là *"trái tim có số, hoặc thanh progress"*. Thứ đó **T3 cấm đích danh**, và `P2-05` §2.2 cấm nó kể cả khi đổi tên. Nhưng **nhu cầu phía sau yêu cầu thì đúng**, và nó đúng theo chính `P2-05` §2.1: hai trong ba persona của cuốn sổ — **Ngọc Ánh** (chơi 5 phút/lần, không nhớ nổi mặt khách gặp 5 ngày trước) và **Linh** (cần một điểm đóng) — là đúng loại người chơi mà trạng thái tường minh phục vụ. Bỏ qua họ cũng là sai thiết kế.

> **Một câu:** cái gì **đếm được** thì cho đếm — tường minh, có số. Cái gì là **tình cảm** thì ghi bằng chữ.

---

## 2. Chẩn đoán — game có phản hồi DÒNG, thiếu phản hồi TỒN

Quan hệ **đã** có kênh ra trước tài liệu này. Chỗ hổng không phải "không có gì"; chỗ hổng là **mọi thứ đang có đều tức thời**.

| Kênh có trước | Ở đâu | Dạng | Vấn đề |
|---|---|---|---|
| Toast *"quý hẳn lên / phật ý"* | `StallScene` nghe `relationship:moved` | **dòng** · trôi sau vài giây | Ngọc Ánh đóng game giữa ngày là mất sạch |
| *"Lâu rồi không thấy"* | `NotebookView` cột trái | tồn · nhưng một chiều | Chỉ nói ai vắng, không nói ai đang ấm lên / đang nguội |
| Trang cuối ngày | `composeEvening` | tồn · theo ngày | 2–3 dòng cho cả hẻm, không tra được theo người |
| Dải mặt trong sổ | `NotebookView.right()` | **chỉ để chọn** | **Đây là chỗ trống** — 12 cái mặt không mang một thông tin nào |
| `tier` · `relationPoints` · `trustCeiling` | `dev/overlay` | **chỉ có ở dev build** | Bản bán ra: không kênh nào, kể cả gián tiếp |

Trong UX đó là khác nhau giữa một **notification** và một **status** — và Nielsen #1 (*visibility of system status*) nói về cái thứ hai. Nghĩa là: **thêm trạng thái vào sổ tay không phải nhượng bộ T3, nó là bịt một lỗ hổng thật.** Vấn đề chỉ còn là hiện *dạng gì*.

---

## 3. Cơ chế — hai trục rời nhau

Cái người chơi thật sự cần không phải **độ lớn**. Họ cần ba câu trả lời, và độ lớn là câu ít dùng nhất trong ba:

1. **Đang đi lên hay đi xuống?** → hướng, không phải trị số
2. **Có chuyện gì chưa xong không?** → hành động được ngay: còn vết nào để chuộc
3. **Có cái gì đang chặn mình không?** → trần tin (§5)

Một trái tim có số trả lời đúng câu **thứ tư**, câu không ai hành động được bằng.

### 3.1. Trục ĐỘ HIỂU — tường minh, có số, có ô trống

```ts
export type Known = { done: number; total: number; vignette: boolean };
export function knownOf(nb: Notebook, id: NpcId): Known
```

Nguồn: giả thuyết đã `CONFIRMED` trên `NpcPage.hypotheses` (0–6) + `vignetteUnlocked`.

**Vì sao nó không đụng T3:** đây là thước đo **người chơi**, không phải thước đo NPC. Nó không dẫn một chút nào từ `relationPoints` — test *"hai trục rời nhau thật"* chặn đúng đường đó. `P2-05` §2.3 còn tự nói ra ý này: *"danh sách lớn dần đúng theo hiểu biết của người chơi — nó* là *thanh tiến trình, và nó không có số."* Tài liệu này đi thêm một bước nhỏ: cho nó cái số, vì trang sổ **đã** hiện `đang đoán 2/5` ngay dưới ô Cô đoán từ trước.

⚠️ `total` trả ra để chỗ gọi vẽ **cả ô trống**, không chỉ vẽ phần đã điền. Vòng lặp chưa đóng mới là thứ kéo người chơi ra quầy để ý tiếp (Zeigarnik) — và đó cũng đúng là cách lưới Bombers' Notebook hoạt động (`P2-05` §1).

### 3.2. Trục TÌNH CẢM — định tính, một câu tự ghi

```ts
export type RelReadState =
  | "RIVAL" | "VET_CHUA_LANH" | "TRAN_TIN" | "MOI_GHE" | "FRIEND" | "DANG_XUONG" | "DANG_LEN" | "QUEN_MAT";
export function relReadState(s: RelState): RelReadState
export function relWords(s: RelState, name: string, rng: Rng): { state: RelReadState; line: string }
```

Một dòng **bút đỏ**, **luôn ở cùng một vị trí** — trên cùng trang mỗi người. Glanceable đến từ **vị trí + màu mực**, không đến từ độ dài một cái thanh.

**MỘT GIỌNG, HAI CÂY BÚT.** Quán là của người chơi, nên cả cuốn sổ là chữ của một người. Phân công lao động của §2.2 giữ nguyên, chỉ đổi cách kể: trái là *"ghi vội lúc bán"* (máy ghi, không sửa được), phải là *"ngồi nghĩ lại"* (chữ tay, sửa tự do). Dấu khoanh bút đỏ lúc tối vẫn là **cùng một người, khác cây bút** — không phải ai khác công nhận giùm.

**Thứ tự dò là ƯU TIÊN VIỆC LÀM ĐƯỢC, không phải ưu tiên độ lớn:**

| # | Trạng thái | Dẫn từ | Vì sao nó ở hạng này |
|---|---|---|---|
| 1 | `RIVAL` | `tier === "RIVAL"` | Điều to nhất người chơi cần biết |
| 2 | `VET_CHUA_LANH` | LONG/CORE còn `valence === -1` | **Làm được gì đó ngay** — còn vết để chuộc |
| 3 | `TRAN_TIN` | `trustCeiling < 100` **và** đang đụng trần | Cái tường vô hình (§5) |
| 4 | `MOI_GHE` | `visits < 3` | Chưa có gì để nói, và trang sổ ghi thẳng là chưa có gì |
| 5 | `FRIEND` | `tier === "FRIEND"` | Cột mốc |
| 6 | `DANG_XUONG` | `trail` có ≥2 `DOWN` | Hướng |
| 7 | `DANG_LEN` | `trail` có ≥2 `UP` | Hướng |
| 8 | `QUEN_MAT` | mặc định | Im lặng cũng là một câu trả lời |

Lời nằm ở `content/lines/so-tay.json` → `quanHe`, **6 biến thể mỗi trạng thái**, qua `fill()` như mọi dòng khác. Người viết lời giữ quyền; không một câu nào hardcode trong TS.

⚠️ Giọng bị **khoá bằng test**: `tests/p2-doc-quan-he.test.ts` quét cả `notes` · `confirm` · `quanHe` và chặn `cô Ba`, chặn `con` (người thứ hai xưng hô với người chơi), chặn `cô thấy / cô nghe / cô nói…`. Sửa lời mà vô tình để cô Ba bò lại vào thì đỏ ngay.

**Ba luật viết của `P2-05` §2.4 vẫn nguyên** (và cũng có test): không tự chấm điểm, không giải thích cơ chế (không bao giờ có chữ *"trần tin"*, *"điểm quan hệ"*, *"bucket"*), giọng miền Nam ngắn — trần 110 ký tự một dòng.

### 3.3. `trail` — hướng đếm theo LƯỢT GHÉ, không theo ngày

```ts
trail?: ("UP" | "DOWN")[];   // RelState, ring 3 phần tử, mới nhất ở CUỐI
```

Đẩy ở `Service.settleRelMoved` — đúng chỗ đã tính `dir` sẵn cho toast, nên toast và `trail` không bao giờ lệch nhau.

Hai quyết định cần giữ:

- **Đếm theo lượt ghé**, cùng lý do như `extraStreak`: mười hai người trong hẻm không ai ghé đủ bốn mươi bữa, nên *"ba ngày qua"* với phần lớn họ là một cái cửa sổ rỗng.
- **Chỉ ghi lượt CÓ CHUYỂN ĐỘNG ròng.** Ngày phục vụ trơn không có gì xảy ra thì không đẩy vào, vì nó không phải một tín hiệu. `settleRelMoved` vốn đã im khi ròng gần 0 — *"im lặng cũng là tin"*.

⚠️ `trail` là **hướng**, không phải độ lớn. Không bao giờ cộng nó lại thành một con số.

### 3.4. Con số phải NÓI RA nó đếm cái gì

`3/6` là một tỉ số không nói nó đo cái gì. Người chơi mở sổ lần đầu nhìn vào **không hiểu gì hết** — và sáu cái vạch dưới mỗi khuôn mặt còn tệ hơn. Cùng con số đó, viết thành câu, thì tự nó giải thích nó mà vẫn đếm được y như cũ.

```ts
knownWords({done: 0, total: 6})  →  "chưa chắc được điều nào"
knownWords({done: 3, total: 6})  →  "chắc 3 điều · còn 3 điều chưa rõ"
knownWords({done: 6, total: 6})  →  "chắc hết 6 điều rồi"
```

Ba chỗ dùng chung một hàm, nên không bao giờ lệch nhau: **tiêu đề ô "Mình đoán"**, **nhãn trợ năng của từng mặt** trong dải, và **một dòng chú giải dưới dải** — *"mỗi vạch = một điều mình đã chắc về người đó"* — dạy cả cái dải bằng một câu.

Vế *"còn n điều chưa rõ"* không phải cho đẹp: ô trống mới là thứ kéo người chơi ra quầy để ý tiếp (§3.1 — Zeigarnik). Bỏ nó là bỏ mất nửa tác dụng của cả cái thước.

Cùng luật đó áp cho dòng trần giả thuyết ở cuối ô, và ở đây nó còn phải **nói ra việc phải làm**:

```
chưa đoán điều nào — đoán được 5 điều một lúc
đang đoán 2 điều · còn đoán thêm được 3
đang đoán 5 điều — hết chỗ rồi, muốn đoán cái khác thì xoá bớt
```

Dòng thứ ba là dòng đáng giá nhất: không có nó, người chơi bấm hoài không hiểu sao kẹt.

### 3.5. Đổi giọng kéo theo: sổ không được gọi tên mình chưa học

Hồi cuốn sổ còn là của cô Ba, nó gọi đúng tên thật mọi người — hợp lý, bả biết cả hẻm. Khi sổ thành chữ của chính người bán thì **không còn hợp lý nữa**, và nó hỏng hai thứ cùng lúc: vỡ fiction, và **phát không cái tên** mà `nameCheck` / `WRONG_NAME` đang bắt người chơi phải nghe ra.

```ts
export function penName(nb: Notebook | undefined, npcId: NpcId): string
//  đã ghi tên  → đúng chữ người chơi viết (kể cả viết SAI — sổ chép đúng cái sai của họ)
//  chưa ghi    → NpcDef.asName: "chú bảo vệ" · "bà bán vé số" · "cậu sinh viên"
```

Khác `displayName` (trả `—`): `penName` đi vào **giữa câu**, nên phải là một cụm gọi được. Mọi dòng văn xuôi trong sổ — trang cuối ngày, dấu khoanh bút đỏ, dòng quan hệ — đều đi qua nó. Hai test chặn: mỗi NPC phải có `asName`, và `asName` không được lộ tên thật.

### 3.6. Ranh giới giọng: nhãn phổ thông, thoại giọng Nam

Theo [`VAN-PHONG-UI.md`](../VAN-PHONG-UI.md), cuốn sổ có **hai thứ chữ** và không được trộn:

| | Ở đâu | Giọng |
|---|---|---|
| **Nhãn hệ thống** — tiêu đề cột, tên ô, dòng trạng thái, nút | hardcode trong `ui/notebook/NotebookView.ts` | **phổ thông**, danh ngữ, không sở hữu |
| **Chữ có người viết ra** — nhận xét về người, trang cuối ngày, dấu khoanh đỏ | `content/lines/so-tay.json` | **giọng miền Nam** |

Ranh giới trùng khớp với ranh giới file, nên dễ giữ: **không một câu giọng Nam nào hardcode trong view, và không một nhãn nào nằm trong JSON.**

```
(bản ghi tại quầy)   (nhận xét cuối ngày)   Phỏng đoán
đã xác nhận 3 · chưa rõ 3        ← nhãn, phổ thông
"Chú bảo vệ có vẻ mến mình. Cứ vậy đi."   ← thoại, giọng Nam
```

`lint:lines` **không** quét `src/ui/**` (VAN-PHONG-UI §6), nên test *"nhãn trong sổ viết tiếng phổ thông"* rút chuỗi thẳng từ source của view và dò bảng đổi từ §4. Nó chỉ canh đúng cuốn sổ — **cả `src/ui/**` vẫn chưa có ai canh.**

---

## 4. Dải mặt — từ thanh CHỌN thành thanh ĐỌC

`.nb-faces` mang **ba dấu, và không một dấu nào về tình cảm**:

| Dấu | Nghĩa | Nguồn |
|---|---|---|
| 6 gạch, đặc/rỗng | độ hiểu | `knownOf().done / .total` |
| viên kim cương đỏ | đã mở được chuyện riêng | `knownOf().vignette` |
| badge `!` đỏ | có ghi chú mới ở người này | `freshTicks()` — tick của trang tối **mới nhất có** |
| mặt mờ | đang vắng | `missStreak >= 2` |

**Luật của dải, giữ cho cứng:** dải chỉ mang cái **đếm được**. Tình cảm nằm trên trang của từng người, bằng chữ. Dán một dấu tình cảm vào dải là đi đúng vào cái L2 cảnh báo.

**Hai chi tiết thi công đáng giữ:**

- **Gạch vẽ bằng hộp CSS, không bằng ký tự `▮▯`.** Cùng lý do như khối 🔴 FONT trong `NotebookView`: glyph hình học không có trong Be Vietnam Pro, máy nào có bộ nào thì ra bộ đó.
- **`freshTicks()` đọc trang tối MỚI NHẤT CÓ, không đọc trang của hôm nay.** Người đóng game lúc đi ngủ rồi mở lại sáng sau vẫn phải thấy nó — đó đúng là người chơi mà cả cuốn sổ tồn tại vì họ.

**RNG của dòng bút đỏ phải TIỀN ĐỊNH** theo `(saveId, npcId, ngày)`. Cột phải dựng lại sau **mỗi chữ** người chơi gõ vào ô ghi chú; rút ngẫu nhiên thật thì câu đó nhảy chữ dưới ngón tay họ.

---

## 5. Trần tin — một luật người chơi không có đường nào học được

**Đây là thứ đáng nhất trong cả tài liệu, và nó độc lập với câu hỏi trái-tim-hay-không.**

`P2-03` §2.8 hạ trần vĩnh viễn, hoàn toàn im lặng:

```
CEILING_STEP = 12 · CEILING_MAX_BURNS = 4   →  4 burn ⇒ trustCeiling = 52
nextTier:  p >= 60 && p <= trustCeiling     →  FRIEND
```

**52 < 60. Nghĩa là sau 4 burn, người đó VĨNH VIỄN không thành FRIEND được nữa — và bản bán ra không có một kênh nào nói điều đó.** Người chơi có thể phục vụ tử tế thêm hai chục bữa, đập vào một cái tường vô hình, rồi kết luận là game hỏng.

Đây **không phải** cái mơ hồ có chủ ý mà T3 bảo vệ. T3 cấm hiện **chỉ số**; nó không cấp phép cho một luật **không học được**. Và T5 thì đòi ngược lại: *"người chơi phải đọc được rủi ro trước khi hành động."*

**Cách bịt — một dòng chữ, đúng kênh T3 cho phép (*lời*):**

| Mốc | Rule | Khi nào |
|---|---|---|
| Hạ trần lần đầu | `notes.trustCeil` · priority 7 | `nightly()` trả `burn` lần đầu của người đó |
| Tới mốc trần thấp nhất | `notes.trustCeilHard` · priority 8 | `burnCount >= CEILING_MAX_BURNS` |

> *"Bữa nay cô thấy chú Tư khác. Có mấy chuyện người ta không quên được."*
> *"Chú Tư vẫn ghé. Mà thân như hồi đầu thì... thôi con. Người ta vậy rồi."*

**Khoá `speakonce` phải theo TỪNG NGƯỜI** — `note:trust:<npcId>:first|hard`. Dùng khoá chung `note:trustCeil` là người thứ hai mất tiếng mãi mãi; `composeEvening` nhận `once?: string` để làm đúng việc đó. Test *"người KHÁC thì vẫn còn một lần của họ"* chặn đúng cái lỗi này.

**Không cần sửa CANON.** T3 giữ nguyên nguyên văn: không có chỉ số quan hệ nào lên màn hình, kể cả trong phần này.

---

## 6. Còn mở — phương án C, "chế độ rõ"

Chưa dựng. Nếu dựng, **đúng những điều kiện này**:

- Một công tắc **"Chế độ rõ"** trong Trợ năng, **mặc định tắt**. Lý do nó đáng có: Ngọc Ánh và Linh là persona của chính `P2-05` §2.1, và lộ trạng thái ẩn *như một tuỳ chọn* là thực hành trợ năng chuẩn hiện nay.
- **Pip rời, không phải thanh liền.** Chia bậc chặn được việc đo vi lượng từng ổ bánh.
- **Phải có vạch trần tin.** Một cái thanh không nói được tại sao nó không đầy nổi thì còn tệ hơn không có thanh.
- **Phải có chữ kèm** (*"quen mặt"*, *"đang lên"*) — không phụ thuộc màu (WCAG 1.4.1).
- **Chỉ trong sổ. KHÔNG BAO GIỜ trên đầu người ở quầy** — L2 giữ nguyên trong mọi chế độ.
- Dòng bút đỏ **vẫn ở trên**. Chế độ rõ là thứ cộng thêm, không phải thứ thay thế.

**TODO khi `P4-03` có scene cảnh nhỏ thật:** đổi nguồn badge `!` sang *"đủ 3 điều mà chưa coi cảnh"*, và cộng thêm `needsFarewellHint` (`P2-05` §2.4). Hai cái đó mạnh hơn `freshTicks()`, mà hôm nay chưa có plumbing. Có `TODO` ở `NotebookView.freshTicks`.

---

## 7. Bài học từ thể loại — mười ba game

Sắp theo mức tường minh. Ba kết luận nằm dưới bảng.

| Game | Hiện cái gì | Dạng | Bài học |
|---|---|---|---|
| **The Sims** | thanh −100…+100, hai trục | số | Tường minh phục vụ một **món đồ chơi**: người chơi thử nghiệm chứ không nhập vai |
| **Hades** | Bonds — trái tim rõ + quà | số | Hiện hẳn vẫn ổn khi fiction là tiệm của thần. Hẻm Sài Gòn thì không |
| **Dragon Age II** | thanh friendship/rivalry đôi | số | **Phản ví dụ mạnh nhất.** Người chơi tối ưu về hai đầu mút, nhân vật dẹt lại. Inquisition quay về approval ẩn |
| **Dave the Diver** | cấp từng NPC, hiện số | số | Game quản lý thì con số là ngôn ngữ bản địa. Mình không phải game quản lý |
| **Stardew Valley** | 10 tim, 250 điểm ẩn mỗi tim, rụng 2 điểm/ngày | lượng tử | Chia bậc **không** chặn được tối ưu: vì phần thưởng gắn vào bậc, người chơi biến nó thành danh sách việc mỗi ngày |
| **Fields of Mistria** | tim + dấu "có chuyện muốn kể" | lượng tử | **Cái dấu "muốn kể" làm hệ thống có cảm giác sống hơn hẳn mấy trái tim.** Thứ đáng chép nhất |
| **Persona 5** | Confidant bậc 1–10, không có thanh giữa hai bậc | mốc | Người chơi chỉ cần **cột mốc** và **sắp tới chưa**, không cần độ lớn |
| **Fire Emblem** | Support C/B/A/S, thưởng bằng hội thoại | mốc | Chữ thay số, phần thưởng là **một cảnh** — đúng cơ chế §2.3 đã chốt |
| **Majora's Mask** | Bombers' Notebook: lưới mặt + icon | lưới | Mô hình `P2-05` §1 đã chọn. Tiến trình = lưới **đầy dần** |
| **Papers, Please** | không chỉ số, hồ sơ là bản đọc | tài liệu | Cuốn sổ của mình **đã là** cái hồ sơ đó. Đừng dán HUD lên nó |
| **Disco Elysium** | không gì — quan hệ = câu nào mở ra | ẩn | Mở khoá nội dung tự nó là bản đọc, **nếu** người chơi nhận ra có thứ mới |
| **Spiritfarer** | tâm trạng qua dáng + bóng bóng | ẩn | Dáng người đọc được, nhưng cần người chơi **đang nhìn**. Ngọc Ánh thì không |
| **Animal Crossing** | ẩn tuyệt đối | ẩn | **Vấn đề Oblivion.** Phần lớn người chơi không biết hệ thống tồn tại |

1. **Lượng tử hoá không cứu được gì nếu phần thưởng gắn vào bậc.** Stardew chia 10 tim, không hiện số — người chơi vẫn farm, vì heart event nằm ở bậc. May là §2.3 đã gắn cảnh nhỏ vào **giả thuyết đoán đúng**, không gắn vào điểm quan hệ. **Giữ nguyên quyết định đó.**
2. **Thứ làm người chơi cảm thấy hệ thống sống không phải độ lớn, mà là "người này có gì mới".** Dấu `!` của Stardew, "có chuyện muốn kể" của Mistria, tín hiệu sắp-lên-bậc của Persona — cả ba đều phi-số và đều hợp T3. Đó là lý do badge `!` ở §4 tồn tại.
3. **Game nào tiến hoá thì tiến hoá theo chiều BỎ thanh đi, không phải thêm thanh vào.** DA2 → Inquisition. Không có ví dụ ngược lại trong bảng.

**Lý thuyết UX đứng sau:** Nielsen #1 *visibility of system status* + #6 *recognition over recall* (12 người × 40 ngày vượt xa bộ nhớ làm việc) · Fagerholt & Lorentzon 2009 taxonomy **diegetic / non-diegetic / spatial / meta** — thanh máu trên sống lưng Isaac trong *Dead Space* là bằng chứng rằng **đọc được hoàn toàn mà vẫn nằm trong truyện**; một dòng chữ trong cuốn sổ của chính nhân vật là diegetic, một pip trái tim thì không · Kivetz/Urminsky/Zheng 2006 **goal-gradient** (thanh gần đầy thì người ta tăng tốc: *tính năng* ở trục độ hiểu, *lỗi* ở trục tình cảm) · **Goodhart / surrogation** — đây là cơ chế có tên khoa học đằng sau nỗi lo của L2 · **Zeigarnik** (§3.1) · **WCAG 1.4.1** (§4, §6).

---

## 8. Bảy câu hỏi trước khi merge bất cứ gì đụng vào phần này

1. Có **một con số nào** trong sổ dẫn từ `relationPoints` không? Có → T3 đã vỡ, lùi lại.
2. Có dấu nào về tình cảm nằm **ngoài** sổ tay — trên đầu người, trên HUD — không? Có → L2 đã vỡ.
3. Mỗi dấu có **khác nhau về hình**, không chỉ khác màu? Có nhãn đọc ra chữ cho screen reader?
4. Giả thuyết sai vẫn tuyệt đối **không có dấu ✗**, không có mực đỏ? (§2.3 — yêu cầu của Linh)
5. Dòng trong sổ có **tự chấm điểm** không? *"Bữa nay mình làm tốt lắm"* là vỡ T1.
6. Mở sổ ngày 1, chưa gặp ai — có thấy ô trống đúng cách, không có số nào gây hiểu lầm?
7. Playtest: hỏi *"ai trong hẻm đang nguội với bạn?"* Trả lời được mà **không mở sổ dò từng trang** → đạt. **Đây là bài kiểm duy nhất đáng tin.**

> Và bài kiểm dài hơn, lấy từ `P2-05` §1: nếu cuối P2 playtest cho thấy người chơi không nhận ra hệ NPC tồn tại — **sửa sổ tay trước, đừng sửa sim.** Tài liệu này là một lần sửa sổ tay.

---

## 9. Đề xuất sửa CANON

**Không có.** T3 và L2 giữ nguyên nguyên văn. Phần này không hiện chỉ số quan hệ nào; con số duy nhất trên trang (`n/6`) đo **người chơi biết gì**, không đo **NPC nghĩ gì** — và `tests/p2-doc-quan-he.test.ts` chặn đường nó dính vào `relationPoints`.
