# 06 — LÝ THUYẾT: tại sao flow trò chuyện của *Bánh Mì Cô Ba* đau, và luật nào suy ra từ đó

> Vai: GAME UX THEORIST. Tài liệu này **không đề xuất tính năng**. Nó giải thích cơ chế
> nhận thức đằng sau 7 lỗi người chơi báo, rồi chưng cất ra **15 luật thiết kế** dùng làm
> bộ lọc duyệt mọi đề xuất của các agent khác.
>
> Mọi con số trong tài liệu đo từ code thật trong repo, không ước lượng.

---

## 0. Ba con số quyết định toàn bộ phần còn lại

Đo trực tiếp từ `src/content/talks/*.json` (14 file, 86 cuộc, 1.615 nút):

| Đại lượng | Giá trị đo được | Nguồn |
|---|---|---|
| Nút trong cây thoại | **1.615** | 86 cuộc, độ sâu 1=273 · 2=525 · 3=755 · 4=62 |
| Dòng thoại tổng (`say` + `reply`) | **2.995** dòng · **25.660 từ** | 1.615 `say` + 1.380 `reply` + 227 `silent` cố ý |
| Ngân sách thoại CANON §11 cho **bản full release** | **~2.980 dòng · ~30.000 từ** | `docs/CANON.md` §11 |
| Nút có `act` (thay đổi thật ở thế giới) | **47 / 1.615 = 2,9 %** | PROMISE 4 · STEP_ASIDE 8 · PAY 5 · DISCOUNT 6 · REFUSE 13 · FREE_LOAF 3 · INVITE 8 |
| Nút chỉ sinh ra một con số ẩn `rel` | **1.450 / 1.615 = 89,8 %** | `rel` là thứ CANON **T3 cấm hiện ra màn hình** |
| Phần `say` người chơi **được nhìn thấy** trong cả một mùa 40 ngày, nếu mọi cuộc đều nổ | **32,0 %** | tính kỳ vọng theo xác suất đường đi |
| Phần `say` người chơi **thực sự nói ra** trong một mùa | **~16 %** (≈258/1.615) | 86 cuộc × ~3 nhịp |

Ba câu kết luận rút thẳng từ bảng này, trước khi vào lý thuyết:

1. **Cây thoại một mình đã tiêu hết ngân sách nội dung của bản phát hành đầy đủ** (2.995 /
   2.980 dòng), cho đúng cái hệ thống mà CANON T2 tuyên bố là không được tồn tại.
2. **90 % số lựa chọn trong cây giải quyết bằng một con số mà CANON T3 cấm hiện ra.**
   Người chơi bấm 1.450 cái nút và theo hiến pháp của chính trò chơi, không bao giờ được
   phép biết mình vừa bấm cái gì. Đây không phải lỗi cân bằng — đây là mâu thuẫn logic
   giữa hai trụ cột.
3. **84 % nội dung đã viết sẽ không bao giờ được đọc trong một lần chơi.** Chi phí viết
   đã trả rồi; chi phí *nhận thức* thì chỉ trả cho 16 % — nhưng chi phí *tải* (đọc để loại
   bỏ) thì trả cho 32 %. Tỉ lệ tín hiệu/tạp của kho nội dung này là 1:2.

---

## 1. Chẩn đoán LỖI #1 — "switch content quá nhiều"

### 1.1. Gọi đúng tên: đây không phải chuyển cảnh, đây là **task switch** với **attention residue**

Người chơi không mô tả một vấn đề thẩm mỹ. Họ mô tả **chi phí chuyển nhiệm vụ**.

Sophie Leroy (2009) đặt tên cho hiện tượng: khi người ta rời một nhiệm vụ **chưa xong** để
sang nhiệm vụ khác, một phần chú ý **vẫn ở lại** nhiệm vụ cũ — *attention residue* — và
hiệu suất ở nhiệm vụ mới sụt. Hiệu ứng **mạnh nhất** khi nhiệm vụ bị bỏ dở là nhiệm vụ
(a) **chưa hoàn tất**, (b) **có áp lực thời gian**, (c) **có ràng buộc cảm xúc**.

Vòng lặp làm bánh mì trong game này trúng **cả ba**:

- **(a) chưa hoàn tất** — ổ bánh là một object có trạng thái dở dang suốt cả vòng:
  `loaf_cold → loaf_hot → loaf_filled`. Không có khoảnh khắc nào "ổ này xong rồi, quên nó đi"
  cho tới lúc nó rời tay ở `handoff`.
- **(b) áp lực thời gian** — `src/sim/loaf.ts`: `COOL_RATE = 0.0173`, `WARM_OK = 0.55` →
  **26 giây** từ lúc ra lò tới lúc ổ bị chấm `BURNT_OR_COLD`. Và `src/sim/oven.ts`: băng
  SÉM→CHÁY chỉ **5,8 giây**. Hai cái đồng hồ này chạy **cùng lúc**, trên **những ổ khác nhau**.
- **(c) ràng buộc cảm xúc** — trụ cột T1 của chính game: *"khách chấm QUÁ TRÌNH"*. Sai sót
  xảy ra **trước mặt người**. Đây là định nghĩa sách giáo khoa của một nhiệm vụ có tải
  cảm xúc.

Nghĩa là: **cú bấm F trong game này là trường hợp xấu nhất mà Leroy mô tả**, không phải
trường hợp trung bình. Chi phí của "làm bánh + nói chuyện" **lớn hơn tổng** chi phí của
làm bánh và chi phí của nói chuyện, vì chi phí thứ ba — tái dựng lại ngữ cảnh ổ bánh sau
khi quay về — không hề nhỏ và không ai thiết kế cho nó.

**Đo chi phí đọc.** Từ dữ liệu thật: mỗi nhịp hội thoại hiện ra trung bình **1 câu đáp
(9,7 từ) + 2,97 lựa chọn (7,6 từ/dòng) = 32,3 từ**. Ở tốc độ đọc tiếng Việt 180–260 wpm:

| | 1 nhịp | 1 cuộc (3 nhịp) |
|---|---|---|
| 180 wpm | 10,8 s | **32,3 s** |
| 220 wpm | 8,8 s | **26,4 s** |
| 260 wpm | 7,5 s | **22,4 s** |

Đối chiếu với chính game: một vòng phục vụ nhanh nhất là **7,4–8,5 s** (`src/sim/oven.ts`
docstring, đo thật). **Một cuộc trò chuyện tốn bằng 3–4 ổ bánh về mặt chú ý.** Và vì
`clock.paused = true`, nó tốn **0 giây game**. Chi phí chú ý và chi phí trong trò chơi bị
**tách rời hoàn toàn** — đó chính là định nghĩa của một cơ chế mà người chơi học được là
"đắt mà không đáng", rồi bỏ.

> Docstring trong `TalkPanel.ts` tự nhận "đọc bốn dòng tiếng Việt mất 6–10 giây". Số thật
> là **22–32 giây cho cả cuộc**. Lệch 3–4 lần, và cái lệch đó đúng bằng khoảng cách giữa
> "một nhịp nghỉ" và "một lần bỏ việc".

### 1.2. Cognitive Load Theory (Sweller) — phân loại từng thành phần UI hiện có

Sweller chia tải nhận thức làm ba:
- **Tải nội tại (intrinsic)** — độ khó không thể bỏ của chính nhiệm vụ. Muốn giảm thì
  phải đổi nhiệm vụ.
- **Tải ngoại lai (extraneous)** — tải do **cách trình bày** gây ra, không đóng góp gì cho
  việc học. **Phải cắt sạch.**
- **Tải hữu ích (germane)** — tải dành cho việc xây lược đồ (schema), tức việc **học cách chơi**.

Phân loại từng thành phần hiện có:

| Thành phần | Loại | Lý do |
|---|---|---|
| Nghe khách gọi món bằng lời, **không có checklist** (`StallScene` docstring §phiếu đơn) | **NỘI TẠI — giữ nguyên** | Chính là T2. Việc "nghe và nhớ" LÀ trò chơi |
| Vạch nướng trên cửa lò, băng CRISP/SINGED | **HỮU ÍCH** | Dạy luật nhân quả có thể đọc trước (T5) |
| Khói trên ổ tắt khi nguội (`loaf.ts` §4) | **HỮU ÍCH** | Một tín hiệu analog thay cho một con số |
| Ba nấc độ chắc tay (SAFE/WARN/SHAKE) | **HỮU ÍCH** | Rủi ro đọc được trước (T5) |
| `AssemblyPanel` — bảng kẹp nhân | **NỘI TẠI** | Là T2 được hiện thân. Panel này đúng chỗ |
| `AssemblyPanel` **không** đóng băng đồng hồ | **HỮU ÍCH** | Áp lực là một phần của bài toán |
| **`TalkPanel` — 4 dòng chữ, modal, đáy màn hình** | **NGOẠI LAI** | Xem dưới |
| **`clock.paused` khi TalkPanel mở** | **NGOẠI LAI, loại nặng nhất** | Xem dưới |
| **Mép màu theo `TalkTone` (8 màu)** | **NGOẠI LAI** | Một bảng mã 8 màu phải học thuộc, để biểu thị một đại lượng (giọng) mà chính câu chữ đã nói rõ. Mã hoá kép |
| **Huy hiệu mặt + phụ đề mood trong panel** | **NGOẠI LAI trong ngữ cảnh này** | Khuôn mặt THẬT của khách đang ở trên màn hình, cách đó 200 px. Vẽ khuôn mặt thứ hai trong panel là *split attention effect* kinh điển: buộc mắt tích hợp hai nguồn mô tả cùng một thứ |
| **Toast `"<tên> bắt chuyện — bấm F"`** | **NGOẠI LAI** | Nó mô tả một *phím*, không mô tả *thế giới*. Xem §4 |
| **Dòng nhắc `"F — nói chuyện với <tên>"`** | **HỮU ÍCH nhưng không bao giờ hiện** | Xem §1.3 |

Tại sao `TalkPanel` là ngoại lai mà `AssemblyPanel` là nội tại, dù cả hai đều là panel?

Vì **nội dung của `AssemblyPanel` LÀ nhiệm vụ**. Mở nó ra là đang làm bánh. Nội dung của
`TalkPanel` là **một bản dịch chữ của một việc đang diễn ra bằng hình trên màn hình**:
người đó đang đứng đấy, đang có mặt mũi, đang có dáng đứng. Panel không thêm thông tin —
nó **di dời** thông tin từ sân khấu xuống một cái hộp, rồi che mất 56 % sân khấu để làm
việc đó. Sweller gọi cái này là **redundancy effect**: trình bày lại cùng một nội dung ở
dạng thứ hai làm *giảm* hiệu quả học, không tăng.

Và đây là chỗ đau nhất: **CANON §0 nói trò chơi là "a game about being watched while you
work"**. `TalkPanel` chiếm 56 % màn hình và `clock.paused` đóng băng thế giới. Trong lúc
bảng mở, **không ai đang nhìn, và không có việc nào đang diễn ra**. Cái panel này tạm thời
tắt cả hai nửa của câu định nghĩa trò chơi.

### 1.3. Mode error (Norman) — bảng ma trận phím

Norman định nghĩa **mode error**: cùng một hành động của người dùng gây ra kết quả khác
nhau tuỳ trạng thái ẩn của hệ, mà trạng thái đó không hiển thị đủ rõ. Đây là ma trận thật,
đọc từ `StallScene.bindInput()` và `TalkPanel.bindKeys()`:

| Phím | Ngoài panel | `AssemblyPanel` mở | `TalkPanel` mở |
|---|---|---|---|
| **Esc** | mở **menu tạm dừng** | **gác ổ** (đóng bảng, giữ ổ) | **làm thinh — mất `rel −1`** |
| **F** | **mở** cuộc trò chuyện | (rơi vào `handleKey`) | **đóng** cuộc = làm thinh, **mất `rel −1`** |
| **W / S** | **đi lên / xuống** | (tuỳ bảng) | **di con trỏ** lựa chọn |
| **P** | tạm dừng | tạm dừng | **bị nuốt** (`stopPropagation`) — không tạm dừng được |
| **Enter/Space** | thao tác trạm (E/Space) | — | **chọn / đóng** |

Ba kết luận:

1. **Esc mang 3 nghĩa, và một trong ba nghĩa có giá tiền.** Hai nghĩa kia miễn phí. Người
   chơi học "Esc = thoát ra, không mất gì" từ 2/3 ngữ cảnh, rồi bị phạt ở ngữ cảnh thứ ba.
   Đây là **mode error có hậu quả bất đối xứng** — kiểu tệ nhất, vì nó dạy sai rồi mới phạt.
2. **F vừa mở vừa đóng, và cú đóng có giá.** Double-tap F — một phản xạ hoàn toàn bình
   thường khi phím không phản hồi ngay — **tự động trả tiền phạt làm thinh**. Người chơi
   không có cách nào biết điều đó (T3 cấm hiện số).
3. **`P` bị nuốt → vi phạm CANON §15.2** *"pause mọi lúc, kể cả giữa lúc khách đang nói"*.
   `TalkPanel` bắt `keydown` ở pha capture trên `window` và `stopPropagation()` **mọi phím**.
   Trong lúc bảng mở, người chơi **không vào được menu tạm dừng / trợ năng**. Đây là một
   vi phạm trợ năng cứng, không phải góp ý.

Thêm một tầng Norman nữa: **gulf of evaluation**. Người chơi bấm một nút, nhận lại một câu
đáp và một khuôn mặt. 89,8 % trường hợp, thứ thật sự xảy ra là một con số `rel` mà T3 cấm
hiện. Nên **không có cách nào học được luật**. Mà một lựa chọn không học được từ đó thì
không phải lựa chọn — nó là một cú tung đồng xu có lời thoại đẹp.

### 1.4. Flow (Csikszentmihalyi) và cái mà modal pause làm với nó

Ba điều kiện vào flow của Csikszentmihalyi: **mục tiêu rõ ràng**, **phản hồi tức thì**,
**cân bằng thách thức/kỹ năng**. Hai hệ quả kèm theo: **hợp nhất hành động và ý thức**, và
**mất cảm giác thời gian**.

`clock.paused = true` tấn công thẳng vào hệ quả thứ hai. Flow sống nhờ dòng thời gian liên
tục; một cú đóng băng cứng là một **sự kiện phá vỡ (flow break)** chứ không phải một nhịp
nghỉ. Và tệ hơn: nó đổi **loại** hoạt động. Làm bánh là hoạt động **vận động — thị giác —
nhịp điệu**. Chọn câu thoại là hoạt động **ngôn ngữ — phân tích — tuần tự**. Đây là hai hệ
nhận thức khác nhau. Chuyển giữa chúng không phải "đổi việc", nó là **đổi chế độ tư duy** —
và đó là lý do người chơi dùng đúng chữ "**switch content**" chứ không dùng chữ "nhiều việc".

Lưu ý một nghịch lý quan trọng: `clock.paused` **được đưa vào vì một lý do đúng** — docstring
nói rõ *"đọc bốn dòng mà khách vẫn hết kiên nhẫn thì người chơi học được đúng một bài:
đừng bao giờ bấm F"*. Chẩn đoán đúng, **thuốc sai**. Vấn đề không phải "đọc mất thời gian",
vấn đề là **có 32 từ để đọc**. Giải pháp đúng là cắt xuống còn 0–8 từ, không phải đóng
băng vũ trụ để có chỗ đọc 32 từ.

### 1.5. Interruption science — ranh giới nhiệm vụ nằm ở ĐÂU, chính xác

Adamczyk & Bailey (CHI 2004) chứng minh bằng thực nghiệm: **ngắt quãng tại ranh giới
nhiệm vụ con (subtask boundary) rẻ hơn hẳn ngắt quãng giữa chừng** — đo bằng thời gian
hoàn thành, tỉ lệ lỗi, và **trạng thái cảm xúc** (annoyance/frustration). Iqbal & Bailey
(CHI 2007) tinh chỉnh thành **ba cấp ranh giới**: **Coarse** (hết một khối lớn) ·
**Medium** · **Fine** (hết một động tác nhỏ nhất). Chi phí hồi phục tăng dần khi ranh giới
mịn dần, vì sau ngắt quãng người ta phải khôi phục thêm *vị trí của mình trong khối*.

Áp vào vòng lặp một ổ bánh. Mọi số dưới đây là **giây thật**, đo từ code:

```
TRỤC THỜI GIAN MỘT Ổ BÁNH — và các cửa sổ ngắt quãng

 t(s) 0      2      4      6      8     10     12     14     16     18     20     22
      |------|------|------|------|------|------|------|------|------|------|------|
 [A]  ■ lấy ổ ở kệ (x=4, tức thì)
      └─1,8s đi kệ→lò──┐
 [B]              ■ bỏ vô lò (E)          ← ◆ RANH GIỚI COARSE #1 · tay rảnh
                   ╞══════ nướng, tay RẢNH ══════╡
                   ├──6,5s──→ READY
                   │          ╞═ CRISP 5,9s ═╡      ╞ SÉM 5,8s ╡  → CHÁY ở 18,2s
 [C]                          ■ nhấc ổ ra (E)       ← ◆ RANH GIỚI COARSE #2
                               ⟵⟵⟵ ĐỒNG HỒ NGUỘI 26s BẮT ĐẦU ⟶⟶⟶
                               └─1,2s lò→thớt─┐
 [D]                                   ■ đặt lên thớt → MỞ AssemblyPanel
                                        ╞ chọn nhân · panel KHÔNG pause ╡
                                        ╞ FLOURISH: 900 ms kể từ miếng cuối ╡
 [E]                                            ■ gói (1 cú bấm)  ← ◇ RANH GIỚI MEDIUM
                                                 └──2,9s thớt→quầy──┐
 [F]                                                          ■ đưa (E) → khách phản ứng
 [G]                                                           ■ nhận tiền 0,8s → tay = MONEY
                                                                ← ◆ RANH GIỚI COARSE #3 ★
                                                                 └─1,85s quầy→bồn rửa─┐
 [H]                                                                          ■ rửa tay 1,5s
                                                                               ← ◆ COARSE #4
```

**CỬA SỔ NGẮT QUÃNG AN TOÀN (xanh) — xếp theo độ rẻ:**

| # | Cửa sổ | Độ dài | Vì sao rẻ |
|---|---|---|---|
| **★1** | **Ngay sau khi đưa bánh, trong và sau lúc nhận tiền** `[G]` | tới khi người chơi tự đi rửa tay — **không giới hạn** | Tay dính tiền → **không được chạm đồ ăn** (`DIRTY_HANDS`). Không có trạng thái nào hỏng được. Và khách **còn đứng đó** vừa cầm ổ bánh — đây là **ranh giới Coarse đồng thời là thời điểm hợp lý về mặt xã hội** để nói chuyện. Đây là cửa sổ tốt nhất trong cả trò chơi, và hiện tại **không có cơ chế nào dùng nó** |
| ★2 | Ổ đang nằm trong lò, băng trước-READY + CRISP `[B]→[C]` | **~12,4 s** | Tay rảnh hẳn, không cầm gì, nguy cơ đọc được trước bằng vạch trên cửa lò (T5) |
| ★3 | Đang rửa tay + ngay sau `[H]` | 1,5 s + mở | Tay bị khoá bởi `handsBusy`, không thể làm gì khác — thời gian chết sẵn có |
| ★4 | Đi bộ tay không giữa hai trạm | 1,2–2,9 s mỗi đoạn | Không trạng thái dở dang |
| ★5 | Quầy trống hoàn toàn (LULL) | dài | **Nhưng đồng hồ tua 120× khi trống** — ngắt ở đây rẻ về nhận thức, **đắt về thời gian game**. Chỉ dùng cho nội dung dài |

**CỬA SỔ CẤM (đỏ) — không bao giờ được ngắt:**

| # | Trạng thái | Vì sao cấm |
|---|---|---|
| ⛔1 | Tay đang cầm `loaf_hot` / `loaf_filled` | Đồng hồ nguội **26 s** đang chạy + `Grip` đang trôi. Ngắt ở đây = phá hỏng một vật thể |
| ⛔2 | `AssemblyPanel` đang mở | Nhiệm vụ con **dở dang** ở mức Fine — đúng trường hợp tệ nhất của Iqbal & Bailey |
| ⛔3 | Trong cửa sổ **FLOURISH 900 ms** sau miếng nhân cuối | Một **đánh giá kỹ năng** đang được đo. Ngắt = trộm mất điểm khéo tay |
| ⛔4 | Ổ trong lò đang ở băng **SÉM** (12,4–18,2 s) | Còn **5,8 s** tới mất trắng |
| ⛔5 | `handsBusy` (lau thớt, ghi sổ, băng tay, rửa tay — có thanh tiến trình) | Người chơi **đã** đang bị khoá. Chồng thêm một modal = hai hàng chờ |
| ⛔6 | Khách đang **gọi món** | Không có checklist — người chơi phải **NGHE**. Đây là nhiệm vụ con tải nội tại cao nhất trong game |
| ⛔7 | Có đồ dưới sàn chưa dọn | `dirt` tăng theo thời gian thực; game đã tự xếp đây là "việc gấp nhất trong quán" |

**Hệ thống hiện tại không biết một chữ nào về bảng này.** `offerTalk()` có đúng ba cái van
— `initiates ≤ 0.6`, `TALK_OFFERS_PER_DAY = 3`, `TALK_OFFER_GAP_SEC = 100` — và **cả ba
đều là van tần suất, không có van nào là van ngữ cảnh**. Một lời bắt chuyện có thể nổ ra
đúng lúc người chơi đang cầm ổ nóng ở giây thứ 22/26. Đó chính là lỗi #3, và nó không phải
lỗi cân bằng số: **nó là lỗi thiếu hẳn một chiều thông tin**.

---

## 2. Lý thuyết hội thoại trong game

### 2.1. Sáu loại, và cái giá chú ý của từng loại

Phân loại theo **cái mà mỗi loại đòi hỏi ở người chơi**, không theo hình thức UI:

| Loại | Dừng tay? | Phải đọc? | Phải quyết định? | Bỏ qua có bị phạt? | Tải Sweller | Chỗ đúng của nó |
|---|---|---|---|---|---|---|
| **Bark** (một chiều, bong bóng, không chờ đáp) | Không | 3–10 từ, **liếc** | Không | Không | Hữu ích (nếu nói về trạng thái thế giới) | Mọi lúc, kể cả ⛔ |
| **Ambient dialogue** (NPC↔NPC nền, không nhắm vào người chơi) | Không | Tuỳ chọn | Không | Không | ~0 nếu làm đúng | Mọi lúc |
| **Responsive bark** (bark + *một* phím đáp tuỳ chọn, không modal) | Không | 3–10 từ | **Tuỳ chọn**, 1 phím | Không (hoặc rất nhẹ) | Hữu ích | Cửa sổ ★2–★5 |
| **Dialogue tree** (nhiều nhánh, modal) | **Có** | **32 từ/nhịp** | **Bắt buộc** | **Có** (`ignore` −1 rel) | **Ngoại lai** phần lớn | Chỉ khi không có nhiệm vụ nào khác đang chạy |
| **Dialogue wheel** (tree + diễn giải tóm tắt) | Có | Ít hơn tree | Bắt buộc | Có | Ngoại lai **+ gulf of evaluation** (nút nói A, nhân vật nói B) | Game có nhân vật chính lồng tiếng. **Không phải game này** |
| **Diegetic conversation** (nói bằng **hành động trong thế giới**) | **Không** — thao tác *là* câu nói | **Không** | **Có** — nhưng quyết định đã nằm trong thao tác | Có, và đọc được | **Nội tại** — bằng đúng tải của việc làm bánh | **Đây là T2** |

Điểm then chốt: ba loại đầu có **chi phí cận biên gần bằng 0** vì chúng **không chiếm kênh
nào mà việc làm bánh đang dùng**. Làm bánh chiếm: tay (bàn phím), mắt (vùng quầy/lò/thớt),
và bộ nhớ làm việc (đơn hàng, các đồng hồ). Một bark chiếm **ngoại vi thị giác + 1 giây
ngôn ngữ**. Một dialogue tree chiếm **toàn bộ ba kênh, cùng lúc, độc quyền**.

### 2.2. "Player agency không bằng số lựa chọn" — khi nào 4 lựa chọn tệ hơn 1 hành động

Agency, trong nghĩa dùng được, cần **ba** thứ cùng lúc, không phải một:

1. **Lựa chọn có ý nghĩa khác nhau** (không phải 4 cách nói cùng một ý)
2. **Người chơi dự đoán được hệ quả TRƯỚC khi chọn** — đây là CANON **T5**
3. **Người chơi quan sát được hệ quả SAU khi chọn** — và T3 cấm cách rẻ nhất để làm điều này

Cây thoại hiện tại hỏng ở (2) và (3) **đồng thời**:

- Hỏng (2): mép màu theo giọng là thứ duy nhất báo trước, mà nó báo **giọng**, không báo
  **hệ quả**. "Giỡn" với ông Hải là bắt được tần số; "giỡn" với chị Lan là mất điểm. Người
  chơi không có cách nào biết trước, nên theo T5, **hệ thống này là một cú roll xúc xắc
  giấu mặt được viết bằng chữ**. Nó vi phạm T5 ở cùng mức mà một bảng xác suất ẩn vi phạm.
- Hỏng (3): 89,8 % nút chỉ sinh `rel`, và T3 cấm hiện `rel`. Không quan sát được.

Đó là **illusion of choice** đúng nghĩa kỹ thuật: không phải "các nhánh rồi cũng về một
chỗ", mà là **người chơi không phân biệt được các nhánh kể cả sau khi đã đi qua**.

Phê bình quen thuộc với dialogue wheel của Mass Effect cho thêm một tầng: nút hiện **bản
tóm tắt**, nhân vật nói **câu đầy đủ** → người chơi cam kết vào một thứ họ chưa đọc. Game
này tránh được cái bẫy đó (`say` là nguyên văn), nhưng **trả bằng tiền mặt**: nguyên văn
nghĩa là 7,6 từ/dòng × 2,97 dòng = **22,6 từ chỉ riêng phần lựa chọn, mỗi nhịp**.

**Chi phí đọc là một đại lượng thiết kế, không phải một chi tiết trình bày.** Hick's law
nói thời gian quyết định tăng theo `log₂(n+1)`; nhưng thời gian **đọc** tăng **tuyến tính**
theo n. Với n = 3–4 dòng tiếng Việt, **chi phí đọc áp đảo chi phí quyết định**. Đó là lý
do "thêm một lựa chọn nữa cho phong phú" luôn là một khoản vay, không phải một món quà.

**Khi nào 4 lựa chọn TỆ HƠN 1 hành động — ba điều kiện, và game này trúng cả ba:**

1. Khi hệ quả của 4 lựa chọn **không quan sát được** → 4 lựa chọn chỉ cộng thêm chi phí đọc
   mà không cộng thêm agency. (Game này: 89,8 %.)
2. Khi người chơi **đang giữ một trạng thái có thể hỏng** → thời gian đọc trở thành rủi ro
   vật chất, và cách chơi tối ưu là **không đọc**. (Game này: đồng hồ 26 s.)
3. Khi **đã tồn tại một kênh khác** truyền đạt cùng ý nghĩa với chi phí thấp hơn. (Game
   này: **cái ổ bánh**.)

### 2.3. ★ LẬP LUẬN TRUNG TÂM: vì sao **chọn hành động** mang nhiều ý nghĩa hơn **chọn câu nói** trong chính game này

CANON T2 không phải một sở thích thẩm mỹ. Nó là một **tuyên bố về kênh truyền**:

> *"Món ăn LÀ lựa chọn hội thoại. Không có dialogue tree. Người chơi không bao giờ chọn
> câu nói. Họ chọn nguyên liệu."*

Năm lý do kỹ thuật, không phải năm lý do thẩm mỹ, vì sao kênh "món ăn" **thắng** kênh
"câu nói" trong **đúng trò chơi này**:

**(1) Kênh món ăn không tranh chấp tài nguyên nhận thức với nhiệm vụ chính — nó LÀ nhiệm vụ chính.**
Chọn bỏ pate cho ông Hải không phải một việc chen vào giữa việc làm bánh. Nó **là** việc
làm bánh. Theo CLT, tải của nó là **nội tại**, và tải nội tại thì không cộng dồn với chính
nó. Chọn một dòng chữ thì cộng dồn một tải **ngoại lai** lên trên tải nội tại đang đầy.
Đây là toàn bộ nội dung của lỗi #1, phát biểu bằng một câu.

**(2) Kênh món ăn đã có sẵn cả hai nửa của vòng phản hồi mà kênh câu nói thiếu.**
Game đã có **delivery-time diff** (CANON §6): cùng một lỗi, hai câu thoại khác nhau tuỳ
khách **có chứng kiến hay không** (`ANTICIPATED` vs `DISCOVERED`), và luật `take(1)` chỉ
nói ra một lỗi. Nghĩa là: một hành động của người chơi (bỏ hay không bỏ pate) đi qua tầng
`perception` (có người thấy không, `certainty` bao nhiêu), qua tầng `memory`, qua tầng
`gossip`, rồi quay về thành **một câu thoại cụ thể, nói ra, nghe được, có nguyên nhân truy
được**. Đó là một vòng phản hồi **hoàn chỉnh và hiện ra ở mặt thế giới chứ không phải mặt
UI** — tức là nó thoả T3 **mà không cần hiện con số nào**.

Kênh câu nói **không có nửa nào trong đó**. `applyTalk()` ghi thẳng `rel` và không đi qua
`Service.remember()` — docstring nói rõ: *"KHÔNG đi qua `Service.remember()` — tức là không
vào tin đồn"*. Nên một câu nói **không bao giờ đi được xa**: bà Sáu không kể lại, chị Lan
không nghe thấy, hẻm không biết. **Lời nói trong game này, theo đúng kiến trúc của nó, là
một ngõ cụt.** Trong khi hành động thì chảy khắp hệ.

**(3) Kênh món ăn thoả T5, kênh câu nói vi phạm T5.**
T5: *"Rủi ro phải ĐỌC ĐƯỢC TRƯỚC khi hành động."* Người chơi **nhìn thấy** ổ bánh thiếu
pate — nó nằm ngay đó, trong `AssemblyPanel`, có hình, đếm được. Rủi ro là **vật chất và
quan sát được**. Còn "giọng DUA với người này ăn hay trật" là thông tin **giấu trong tính
cách NPC**, không hiện ở đâu, và T3 cấm hiện. Cây thoại vì thế **không thể đồng thời thoả
T3 và T5**. Đây là một mâu thuẫn cấu trúc, không phải một chỗ cần tune.

**(4) Một hành động có thể BỊ NHÌN THẤY; một câu nói thì không.**
CANON §0: *"a game about being watched while you work."* Toàn bộ engine `perception`
(`rate = salience · visibility[slot][zone] · occluderMul · gazeFactor · traitMul`) áp dụng
cho **việc tay làm**. Bỏ thêm pate cho người quen trong lúc ba người khác đang xếp hàng
**là một hành động công khai có `visibility` đo được**. Chọn một dòng chữ thì không có
`zone`, không có `occluderMul`, không có người thứ ba nào nhìn thấy. **Cây thoại đứng
ngoài hệ thống trung tâm của trò chơi.** Nó là cái duy nhất trong game mà không ai nhìn.

**(5) Kênh món ăn đắt gấp ~60 lần về mặt nội dung-trên-mỗi-ý-nghĩa.**
47/1.615 nút có `act`. Nếu mỗi quyết định có ý nghĩa cần một `act`, thì cây thoại chi
**2.995 dòng để sinh ra 47 quyết định**: ~64 dòng/quyết định. Một quyết định trong
`AssemblyPanel` tốn **0 dòng** — nó là một miếng pate.

**→ PHÁN QUYẾT VỀ SỐ PHẬN 12.600 DÒNG JSON.**

Không phải "bỏ". Không phải "giữ". Là **đổi vai trò của nó** — từ *bề mặt tương tác* thành
*kho nguyên liệu phát ngôn*:

| Hạng mục | Số lượng | Số phận | Lý do |
|---|---|---|---|
| **`opener`** | 86 | **GIỮ 100 %, nâng cấp thành bark NPC chủ động** | Đây là thứ duy nhất trong kho đã sẵn sàng làm việc đúng: một câu NPC nói ra, không đòi gì cả. Lỗi #2 (`walkin.nhamquan` — *"Cho tui tô hủ tiếu"*) **chứng minh** điều này: `walkin.json` có **0/6** cuộc khai `initiates`, nên câu đó chỉ tới được người chơi qua phím F. Một câu mà NPC **phải** nói trước lại chỉ nói khi được hỏi |
| **`reply`** (1.380 dòng) | 1.380 | **GIỮ phần lớn, đổi khoá tra** — từ "đáp câu người chơi vừa chọn" sang "đáp **hành động** người chơi vừa làm" | Phần lớn `reply` là phản ứng với một **ý**, không phải với một **câu cụ thể**. Cùng cái ý đó phát sinh được từ một hành động: *"Con nhớ chú không ăn hành ha"* không cần người chơi bấm nút nào — nó cần người chơi **không bỏ hành** |
| **227 nút `silent`** | 227 | **GIỮ nguyên tinh thần, chuyển thành phản ứng mặt/dáng** | `silent` đã là thiết kế đúng: im lặng là một câu trả lời. Nó không cần một cây để tồn tại |
| **47 nút có `act`** | 47 | **GIỮ 100 % — đây là phần đáng giá nhất của cả kho** | PAY/DISCOUNT/FREE_LOAF/PROMISE/STEP_ASIDE/REFUSE/INVITE là những chỗ duy nhất lời nói **buộc thế giới phải giữ lời**. Chuyển thành **hành động trực tiếp** (một phím ngữ cảnh, một cử chỉ), không qua cây |
| **130 nút có `flag`** | 130 | **GIỮ**, treo vào mốc chuyện thay vì vào nhánh cây | Arc nhiều ngày không cần cây sâu, nó cần cờ |
| **~1.450 nút chỉ có `rel`** | **1.450** | **ĐÂY LÀ CHỖ CẮT** | Mỗi nút là một cú bấm sinh ra một con số mà hiến pháp của game cấm hiện ra. Cắt ở đây không mất nội dung — mất **những cái nút**. Chữ nằm trong `say`/`reply` được tái dụng ở hai hàng trên |

Nói gọn: **kho 25.660 từ không chết, cái cây chết.** `say` (1.615 dòng, 7,6 từ/dòng) là
phần mất nhiều nhất, và đó cũng là phần duy nhất mà **CANON T2 chỉ đích danh**: *"Người
chơi không bao giờ chọn câu nói."*

Một con số để quyết định cho dễ: nếu cắt cây và giữ `opener` + `reply` + `silent`, kho còn
**~1.700 dòng** — vừa khít mốc **"Beta nội bộ ~1.200"** và trong tầm **"Full release
~2.980"** của CANON §11, **còn chỗ trống cho barks, ambient, NPC-NPC**, tức là ba hệ thống
mà hiện tại không có ngân sách nào cả. Cây thoại đang ăn hết chỗ của chính những thứ sẽ
chữa lỗi #3 và #4.

---

## 3. Chẩn đoán LỖI #3 và #5

### 3.1. Lỗi #3 — bị bắt chuyện lúc bận. **Thuyết mặt mũi (Brown & Levinson)**

Brown & Levinson (1987), nối tiếp Goffman (1967): mọi người có **mặt âm** (negative face —
quyền không bị quấy rầy, quyền tự do hành động) và **mặt dương** (positive face — nhu cầu
được chấp nhận, được để ý). Mọi lời bắt chuyện là một **hành vi đe doạ mặt** (FTA). Mức độ
đe doạ:

```
W = D(người nói, người nghe) + P(người nghe trên người nói) + R(mức áp đặt của chính hành vi)
```

Và người nói **chọn chiến lược theo W**: W thấp → nói thẳng (bald on-record); W cao →
**lịch sự âm** (rào đón, xin lỗi trước, cho sẵn đường từ chối) hoặc **nói bóng gió** (off
record) hoặc **không nói gì cả**.

**Thiết kế hiện tại đúng ở nguyên tắc, sai ở thi hành:**

**Đúng:** *"làm thinh có giá"* là **chính xác về mặt lý thuyết**. Không đáp lại một FTA là
một hành vi đe doạ mặt dương của người kia. Nó phải có giá. CANON T1/T3 cũng đòi hệ quả
nằm ở quan hệ chứ không ở một con số.

**Sai, ba chỗ:**

1. **Hệ thống không mô hình hoá R.** Trong đời thật, R — mức áp đặt — **phụ thuộc vào việc
   người kia đang bận gì**. Bắt chuyện một người đang hai tay bưng nồi nước sôi có R rất
   cao; bắt chuyện cùng người đó lúc họ đang lau tay có R rất thấp. **`offerTalk()` không
   đọc một bit nào về trạng thái tay người chơi.** Ba cái van của nó (`initiates`,
   `TALK_OFFERS_PER_DAY = 3`, `TALK_OFFER_GAP_SEC = 100`) đều là van **tần suất**, không
   phải van **ngữ cảnh**. Nên NPC trong game này cư xử như một người **không biết nhìn** —
   mà toàn bộ trò chơi lại dựng trên tiền đề rằng họ **nhìn thấy mọi thứ** (T1). Đây là
   một mâu thuẫn tính cách, không chỉ một vấn đề nhịp độ.

2. **NPC không được cấp chiến lược lịch sự nào ngoài "nói thẳng rồi chờ".** Người thật có
   cả một thang: liếc nhìn → đằng hắng → *"Bận hả con?"* → nói nguyên câu → bỏ qua. Game
   chỉ có **một nấc** (opener đầy đủ + toast đòi bấm F) và một nấc **phạt** (im lặng =
   −1 rel). Thiếu hẳn các nấc lịch sự âm ở giữa. Mà chính mấy nấc giữa đó là nơi **tính
   cách** sống: ông Hải (nongTinh 0,9) **nói thẳng**; chị Lan (soi cao, thanThien thấp)
   **ngó rồi thôi** — và cái "ngó rồi thôi" đó, theo §4 bảng tính cách của CANON, **là**
   đặc tả của chị Lan. Hiện tại nó không thể hiện ra được, vì hệ chỉ có một chế độ.

3. **Hình phạt đến trước khi người chơi kịp hiểu rằng mình đang bị tính điểm.** Toast nói
   *"bấm F để trả lời"* — nó nói về **phím**, không nói về **người**. Nó không truyền đạt
   rằng đây là một FTA đang chờ được đáp. Người chơi đọc nó như một thông báo hệ thống
   (kiểu "có mail mới"), rồi bị phạt như đã phớt lờ một con người.

**Hướng đúng, suy từ lý thuyết:** chuyển thang FTA từ **nhị phân** (bắt chuyện / không)
sang **leo thang nhiều nấc**, với **R đọc từ trạng thái tay người chơi**, và **phí làm
thinh chỉ tính ở nấc cao nhất** — tức chỉ khi NPC đã thực sự nói một câu đầy đủ **vào một
cửa sổ an toàn** mà vẫn bị lơ. Lơ một cái liếc thì không phải lơ ai cả.

### 3.2. Lỗi #5 — spam mời khách. **Điều kiện hoá thao tác (operant conditioning)**

Hỏi đúng câu hỏi Skinner: **hành vi nào đang được củng cố, bằng cái gì, với độ trễ bao nhiêu?**

Hạch toán hệ hiện tại:

| Yếu tố | Giá trị thật trong code | Tác động hành vi |
|---|---|---|
| **Phần thưởng** | Một khách thật (≈25.000₫ + một lượt phục vụ) | Lớn, **cụ thể**, tức thì |
| **Lịch củng cố** | `inviteChance` 0,2–0,8 → **tỉ lệ biến thiên (variable ratio)** từ góc nhìn người chơi | VR là **lịch sinh ra tỉ lệ phản ứng cao nhất và chống dập tắt tốt nhất** trong toàn bộ tâm lý học hành vi. Đây là lịch của máy đánh bạc |
| **Chi phí thời gian game** | **0 giây.** `clock.paused = true` khi `TalkPanel` mở; "Pause = đồng hồ trả `dt = 0` → không hệ nào chạy" (`StallScene.update`) | **Không có chi phí nào để cân lại phần thưởng** |
| **Chi phí quan hệ** | `ignore` chỉ tính khi NPC mở lời trước **hoặc** người chơi đã nói rồi. Mời hụt rồi đóng bảng: `closeTalk()` → `if (npcOpened \|\| engaged)`. Mời hụt thì **đã** engaged → có tính. Nhưng chỉ **−1 rel** với một `memKey` dùng chung cho 8 dáng người lạ | Gần như bằng 0 về mặt chủ quan |
| **Hình phạt khi bị từ chối** | Một dòng log *"… đi tiếp."* | Không đọc ra là hình phạt |
| **Nguồn cung mục tiêu** | ~**75–95 người đi ngang mỗi ngày** (từ `GAP_SEC` × độ dài các band, trần đồng thời `PASSERS_MAX = 5`) | Gần như vô hạn |
| **Hàng rào chống save-scum** | `hub.derive('invite:<c.id>')` — tất định **theo lượt đi ngang** | Chặn đúng việc mở lại **cùng một người**. **Không chặn** việc thử người kế tiếp — mà có 80 người kế tiếp mỗi ngày |

**Hệ thống này đang dạy chính xác điều người chơi đang làm.** Phần thưởng lớn, lịch biến
thiên, chi phí bằng không, nguồn cung vô hạn. Hành vi spam **không phải là người chơi lách
luật — nó là phản ứng tối ưu với lịch củng cố đã được cài đặt.** Trách người chơi ở đây là
trách sai đối tượng.

Thêm: điều này **phá vỡ hợp đồng mà chính `passersby.ts` tự viết ra**:

> *"Một ngày có họ và một ngày không có họ, nếu người chơi cứ đứng sau quầy, phải ra đúng
> cùng một con số bán được — nếu không thì đây không còn là cái nền nữa, nó là một hệ."*

Mệnh đề điều kiện *"nếu người chơi cứ đứng sau quầy"* chính là chỗ thủng. Bước ra khỏi
quầy, cái nền **trở thành một vòi nước nhu cầu theo yêu cầu** mà không tốn một giây game nào.

**Diminishing returns / soft gating — cách chặn mà không hiện con số (T3).**
Nguyên tắc: **hình phạt phải nằm ở MẶT THẾ GIỚI, không nằm ở mặt UI.** Ba cơ chế thoả T3:

1. **Chi phí phải trả bằng thời gian và vị trí, không bằng điểm.** Mời ai thì phải **bước
   ra khỏi quầy tới chỗ người đó** — và trong lúc đó đồng hồ **chạy**, hàng **dài ra**, ổ
   trong lò **sém dần**. Đây là soft gating tự nhiên nhất: nó dùng những đồng hồ đã có sẵn,
   và nó đọc được trước (T5). *Điều kiện bắt buộc: cuộc mời **không được** đóng băng đồng hồ.*
2. **Giảm dần qua ánh mắt của người thứ ba, không qua một bộ đếm.** Mời người thứ ba trong
   vòng một phút trước mặt cùng một hàng khách thì **hàng khách** là thứ phản ứng — một
   bark *"Cô ơi bán đi cô"*, một cái nhíu mày. Đây là **đúng cùng kênh mà T1 đã dựng sẵn**
   (`perception` + `audience`), và nó không cần một con số nào lên màn hình.
3. **Người từ chối phải NHỚ.** `memKey` của người đi ngang là `walkin<style>` — dùng chung
   8 ô nhớ. Ghi một dấu "vừa bị mời và đã từ chối" vào đúng ô đó, hiệu lực trong ngày, và
   để nó hiện ra bằng **hành vi** (người đó **đi nhanh hơn**, **không ngoái nhìn** nữa, hoặc
   không còn là mục tiêu hợp lệ của `talkTarget`). Người chơi đọc ra "người này không muốn"
   từ **dáng đi**, không từ một thông báo. Đây đúng là nguyên tắc Orkin ở §5.2: diễn đạt
   bằng biểu hiện, khỏi phải mô phỏng gì thêm.

> Luật chung rút ra: **một cơ chế có phần thưởng ở lịch biến thiên BẮT BUỘC phải có một
> chi phí nằm trên cùng một trục với phần thưởng.** Ở đây phần thưởng là *một khách*, nên
> chi phí phải là *thời gian phục vụ* — không phải một con số thiện cảm mà T3 cấm hiện.

---

## 4. Chẩn đoán LỖI #6 — câu *"hết chuyện để nói với abc bữa nay rồi"*

### 4.1. Lý thuyết: diegetic vs non-diegetic feedback

Một thông báo trong game có thể nói về **hệ thống** (non-diegetic — *"Không còn nội dung
hội thoại khả dụng"*) hoặc về **thế giới** (diegetic — *"Chú ấy đang mải nhìn ra đường"*).
Luật chọn:

> **Thông báo nên nói về HỆ THỐNG khi nguyên nhân là của hệ thống và người chơi có thể tác
> động vào hệ thống đó. Thông báo nên nói về THẾ GIỚI khi nguyên nhân là của thế giới —
> hoặc khi nguyên nhân là của hệ thống nhưng người chơi KHÔNG tác động được.**

Chữa cháy sai ở đâu: *"hết chuyện để nói với abc bữa nay rồi"* lấy một sự thật **của hệ
thống** (`pickTalk()` trả `null` vì `usedSeason`/`usedToday`/`when` đã lọc sạch) rồi **mặc
cho nó bộ áo của thế giới** — nó nói như thể đó là một sự thật về quan hệ giữa hai con
người. Đây là loại thông báo tệ nhất: **non-diegetic đội lốt diegetic**.

**Vì sao nó phá vỡ hiện thân (presence).** Hiện thân vỡ khi người chơi buộc phải suy ra
rằng **mô hình trong đầu họ về thế giới khác mô hình thật của hệ thống**. Câu này ép đúng
cái suy luận đó: trong thế giới, hai người quen **không bao giờ hết chuyện** — ngôn ngữ
người có vô hạn câu xã giao, và chính người chơi biết rõ điều đó. Nên câu này không đọc ra
là "chú Tư không muốn nói", nó đọc ra là **"kho dữ liệu đã cạn"**. Đúng một giây đó, chú
Tư thôi làm một con người và trở lại làm một hàng trong file JSON.

Thêm một tầng xúc phạm nhỏ nhưng thật: nó **đổ lỗi sai hướng**. Câu đổ lỗi cho **quan hệ**
(*hai ta hết chuyện*) trong khi nguyên nhân là **lịch nội dung**. Người chơi, đang được
dạy suốt 40 ngày rằng mọi thứ họ làm đều ảnh hưởng tới quan hệ (T1), sẽ **đọc nó như một
lời trách**.

Hai câu còn lại của `talkUnavailable()` cũng sai, nhẹ hơn:
- `"chưa có ai để nói chuyện"` — chấp nhận được, nhưng vẫn là giọng hệ thống.
- `"…"` — ba chấm khi nội dung chưa nạp xong. Người chơi không phân biệt được "đang tải"
  với "người ta không đáp". Đây là một **trạng thái hệ thống đang giả vờ làm một trạng thái
  cảm xúc** — tệ hơn cả im lặng.

### 4.2. Luật chọn câu: phân loại theo **nguyên nhân thật**, không theo mã lỗi

Nguyên tắc: **ánh xạ mỗi nguyên nhân kỹ thuật sang một lý do CON NGƯỜI nhất quán, rồi luôn
luôn dùng đúng lý do đó.** Nhất quán quan trọng hơn hay: người chơi phải học được rằng
"chú ấy đang nhìn ra đường" **luôn** nghĩa là một điều cụ thể.

| # | Nguyên nhân kỹ thuật | Lý do con người | Câu (tiếng Việt Sài Gòn) | Kèm biểu hiện bắt buộc |
|---|---|---|---|---|
| 1 | `handsBusy` hoặc đang ở cửa sổ ⛔ | **MÌNH đang bận** (không phải họ) | *"Tay còn đang dính, để lát."*  ·  *"Đang dở tay, chút nữa."* | Không có bong bóng của NPC — đây là lời của chính người chơi |
| 2 | `pickTalk()` cạn vì `usedToday` (**đã nói chủ đề này hôm nay**) | **Mình vừa hỏi rồi** | *"Nãy hỏi rồi mà con."*  ·  *"Hồi nãy nói chuyện đó rồi ha."* | NPC cười nhẹ, `CUOI_KHAN` |
| 3 | `usedSeason` cạn + `tier` thấp (**chưa thân**) | **Chưa thân đủ** | *"Dạ."* (gật đầu, hết)  ·  *"Ờ."* rồi nhìn đi chỗ khác | `LANH`, `TURN_AWAY_QUARTER`. **Im lặng là câu trả lời đúng ở đây** |
| 4 | `usedSeason` cạn + `tier` FRIEND | **Nói chuyện bình thường, không có tin gì mới** | *"Bữa nay cũng vậy à con."*  ·  *"Cũng y như hôm qua thôi."* | `CUOI`, `NOD`. Ấm, không phải từ chối |
| 5 | NPC đang ở `queueing` sau người khác, chưa tới lượt | **Họ đang chờ tới lượt** | *"Để {self} chờ chút đã."*  ·  *"Có người trước kìa con."* | `NGHIEM` |
| 6 | NPC `waitRatio` cao (sắp hết kiên nhẫn) | **Họ đang gấp** | *"Thôi con làm đi, {self} vội."*  ·  *"Nói sau nghen, {self} trễ rồi."* | `BUC`, `ARMS_CROSS` |
| 7 | `dayMood` xấu / có `memory` buồn đang hoạt động | **Hôm nay họ có chuyện** | *"Bữa nay {self} hổng có tâm trạng."*  ·  *"Để bữa khác nghen con."* | `BUON` hoặc `MET`, `IDLE`. **Không** cười |
| 8 | `tier === RIVAL` hoặc `anger` còn tồn | **Họ không muốn nói chuyện với MÌNH** | *"Bán đi, khỏi nói nhiều."*  ·  *"{self} không có gì để nói."* | `LANH`, `FREEZE`. Đây là câu duy nhất trong bảng **đúng** là một lời từ chối, và nó phải **đã được kiếm ra** |
| 9 | `c.ambient` (người đi ngang) đã từ chối lời mời hôm nay | **Họ đã trả lời rồi** | *"Nói rồi mà cô."*  ·  (không nói gì, chỉ bước nhanh hơn) | Bước nhanh hơn, không ngoái |
| 10 | Nội dung chưa nạp xong (`!talks.has(key)`) | **Không có lý do con người nào** | **KHÔNG hiện câu nào.** Phím không phản hồi trong ~200 ms rồi mở bình thường | Đây là một tình huống kỹ thuật; nói dối về nó là làm hỏng 9 câu trên |
| 11 | Không có ai trong `TALK_REACH` | **Không có ai ở đó** | *"Chưa có ai."* — hoặc, tốt hơn, **không hiện gì cả và không có mục tiêu nào được tô sáng** | Nếu luật #13 (chỉ báo mục tiêu) được thi hành thì dòng này **thừa**: người chơi đã thấy là không ai được tô sáng |

**Luật chọn:** duyệt theo thứ tự **1 → 9**, dừng ở điều kiện đầu tiên khớp. Thứ tự đó
không phải tuỳ tiện: nó đi từ **nguyên nhân thuộc về người chơi** (1) ra **nguyên nhân
thuộc về hoàn cảnh** (5,6,7) rồi mới tới **nguyên nhân thuộc về quan hệ** (8). Quan hệ
luôn là lời giải thích **cuối cùng**, không bao giờ là lời giải thích mặc định — vì theo
T3, người chơi không kiểm chứng được nó, nên nói bừa về nó là nói dối một thứ người ta
không cãi lại được.

**Một ghi chú về câu #3 và #4.** Chúng xử lý cùng một mã lỗi kỹ thuật (`usedSeason` cạn)
nhưng rẽ theo `tier`. Đó là điểm then chốt: **"hết nội dung" không phải một sự thật về thế
giới, nên nó phải mượn một sự thật có thật về thế giới để mặc vào** — và `tier` là sự thật
sẵn có gần nhất. Người lạ thì **cụt lủn**; người thân thì **rỗi rãi mà không có tin gì** —
và cả hai đều là những điều hoàn toàn bình thường giữa người với người.

---

## 5. Chẩn đoán LỖI #4 — NPC với NPC

### 5.1. Nghịch lý "thế giới không xoay quanh bạn"

Hai thất bại đối xứng:

- **NPC sống quá** → người chơi thấy mình **thừa**. Thế giới tự chạy, mình chỉ xem. Đây là
  thất bại của Radiant AI mà CANON §16 **Đừng-1** đã chỉ đích danh: *"mỗi lần cải thiện lại
  làm nó ít được nhận ra hơn"*.
- **NPC chết quá** → thế giới **giả**. Mọi người tồn tại chỉ để đứng xếp hàng. Đây là
  trạng thái hiện tại, và `passersby.ts` đã tự chẩn đoán đúng: *"người chơi học được một
  phản xạ sai và rất bền: thấy bóng người = sắp có đơn."*

**Điểm cân bằng, phát biểu chính xác:**

> NPC phải có đời sống **đủ để người chơi tin là nó tồn tại ngoài khung hình**, và **không
> nhiều hơn**. Mọi thứ vượt quá mức đó là ngân sách đổ vào thứ **cạnh tranh** với người chơi
> về sự chú ý, chứ không **chứng thực** cho họ.

**Đo bằng gì — ba chỉ số, với ngưỡng đề xuất:**

| Chỉ số | Định nghĩa | Ngưỡng | Vì sao |
|---|---|---|---|
| **Tỉ lệ chứng thực** (witness ratio) | % cảnh NPC-NPC mà **người chơi là chủ đề hoặc là người được nhắm tới** | **≤ 25 %** | Trên ngưỡng này, thế giới xoay quanh người chơi → giả. Dưới 10 % thì nghe lỏm không còn đáng |
| **Tần suất môi trường** | Số trao đổi NPC-NPC **trong khung hình** mỗi 10 phút thật (≈ một ngày chơi) | **6–10** | Dưới 5: hẻm chết. Trên 12: mắt bắt đầu đi theo họ thay vì theo tay mình — chính là Đừng-1 |
| **Tỉ lệ "có thể bỏ qua"** | % cảnh mà bỏ qua **không mất gì cả** | **≥ 85 %** | Nếu bỏ qua là mất mát, nó không còn là nền — nó là một nhiệm vụ. Xem §5.3 |

Ba chỉ số này có thể kiểm chứng tự động (bộ đếm trong một lần chạy `tools/sim.ts`), nên
chúng là luật, không phải khẩu hiệu.

### 5.2. Orkin — "vocalizing intentions", và vì sao nó rẻ

Jeff Orkin, *Three States and a Plan: The A.I. of F.E.A.R.* (GDC 2006), và chi tiết hơn ở
*Combat Dialogue in F.E.A.R.: The Illusion of Communication* (Game AI Pro 2): các NPC trong
F.E.A.R. **không hề giao tiếp với nhau**. Một squad manager gom họ theo khoảng cách rồi gán
mục tiêu; từng NPC hoàn toàn không biết về đồng đội. **Cảm giác phối hợp hoàn toàn đến từ
việc họ nói ra điều mình sắp làm.** Orkin kết luận: *"Dialogue can be used to create the
illusion of behavior that has never even been implemented."*

**Vì sao nó rẻ, nói bằng cơ chế nhận thức chứ không bằng giai thoại:**

Người chơi không quan sát được **trạng thái bên trong** của NPC — họ chỉ quan sát được
**đầu ra**. Khi hai đầu ra (một câu nói + một hành vi đơn giản) **nhất quán với nhau**, bộ
máy suy diễn ý định của người xem **tự dựng nốt** cái trạng thái bên trong, và nó dựng ra
một thứ phong phú hơn nhiều so với bất cứ cái gì được cài đặt. Đây là **gán ý định** (một
quá trình tự động, không tốn cố gắng của người xem) — và nó **miễn phí** đối với nhà phát
triển, vì toàn bộ công việc do người chơi làm.

Áp vào game này — CANON §16 đã nêu đúng ví dụ: *"Đừng mô phỏng cái xe thủng lốp của chú Tư.
Cho chú NÓI RA + một prop hình ảnh (tay băng, áo ướt)."* Mở rộng sang NPC-NPC:

> Hai người gặp nhau ở đầu hẻm, một người nói *"Ê, chở giùm cái thùng qua chợ cái"*, người
> kia nói *"Chờ chút"*, rồi **cả hai cùng đi về một hướng**. Chi phí: 2 dòng thoại + một
> vector đi chung. Thứ người chơi tin: hai người đó có một mối quan hệ, một công việc, và
> một buổi sáng tiếp diễn ngoài khung hình. **Không một dòng nào của chuyện đó được cài đặt.**

Đây cũng là đòn bẩy nội dung rẻ nhất còn lại: `shuffle-bag` (CANON §11, Elan Ruskin, GDC
2012) cho 8 biến thể một cảnh ≈ cảm giác của 25–30 dòng random. **8 cảnh × 8 biến thể = 64
tổ hợp ≈ cảm giác ~200 dòng, với chi phí ~64 dòng** — rẻ hơn **một** cuộc trong cây thoại
hiện tại (trung bình 35 dòng/cuộc, dùng được một lần cả mùa).

### 5.3. Eavesdropping as reward — nghe lỏm chỉ đáng giá khi nó MẤT GÌ ĐÓ

**Nguyên lý:** thông tin có được **miễn phí** không được xử lý như thông tin — nó được xử
lý như trang trí. Giá trị cảm nhận của một mẩu tin tỉ lệ với **cái người chơi đã trả để có
nó**. Đây là lý do tiếng động trong game lén lút có sức nặng mà subtitle thì không: nghe
được tiếng chân nghĩa là bạn đã **đứng yên và đánh đổi thời gian lấy thông tin**.

**Đánh giá `sim/overhear.ts` — đây là phần thiết kế TỐT NHẤT của toàn bộ hệ trò chuyện.**
Ba tầng nghe:

```
tier 0 — tay đang bận              → chỉ biết CÓ người nói ("· · ·")
tier 1 — dừng tay, đứng yên         → nghe NỘI DUNG, tên nguồn thành "…"
tier 2 — đứng yên + nghiêng người   → nghe ĐỦ cả nguồn
         ↳ giá: service.playerLeaning() → front.watchedIdleUntil = now + 5
```

Vì sao nó đúng, theo bốn tiêu chí:

1. **Giá là CÓ THẬT và nằm trong kênh của trò chơi.** Tier 2 không tốn một "điểm" nào —
   nó tốn **việc khách trước mặt thấy mình lơ đễnh 5 giây**. Đây chính là T1 (bị nhìn) được
   dùng làm đơn vị tiền tệ. Thanh lịch.
2. **Giá là liên tục và đọc được trước (T5).** Ba tầng là ba mức đánh đổi mà người chơi tự
   chọn, bằng **tư thế** chứ không bằng một cái nút.
3. **Nó không phát minh ra thông tin.** Dùng **đúng** tin đã lan đêm trước (`gossip.ts`) —
   nên không farm được, và nó đóng vai trò **xác nhận** chứ không phải **nguồn**.
4. **Nó tôn trọng CANON §12 RB4** (*"không có nghe lỏm thì bỏ luôn cả nhớ nhầm lẫn đồn thổi"*)
   và **§4 quy tắc 1**: báo hiệu duy nhất là **hai chấm `..`** ở góc hẻm. Không badge, không
   popup "tin đồn mới!". Hoàn toàn diegetic.

**Hai điểm yếu:**

- **Mỗi ngày đúng 1 cảnh, trong khung 8h15–10h30, và bị bỏ lỡ nếu đông khách** (`ctx.quiet`).
  Nghĩa là trên một ngày đông khách — **tức là một ngày chơi tốt** — người chơi bị **phạt**
  bằng cách mất đi tin tức. Đó là một khuyến khích ngược (ngày tốt → biết ít hơn).
- **Nó là kênh NPC-NPC duy nhất, nên nó phải gánh cả hai vai**: vừa là *nền sống* vừa là
  *cửa thông tin*. Hai vai này có yêu cầu đối nghịch — nền phải **thường xuyên và bỏ qua
  được**, cửa thông tin phải **hiếm và đáng trả giá**.

**Cách mở rộng sang tán gẫu thường ngày mà KHÔNG làm loãng:** **tách hai vai ra, bằng hai
hạng có tín hiệu khác nhau tuyệt đối.**

| | **Tán gẫu** (mới) | **Cảnh nghe lỏm** (đã có) |
|---|---|---|
| Tần suất | 6–10 lần/ngày | **đúng 1**/ngày |
| Vị trí | **bất kỳ đâu**, trên đường đi | **cố định ở góc hẻm** (`GOSSIP_CORNER`) |
| Báo hiệu | **không có** — chỉ là bong bóng, như mọi bark | **hai chấm `..`** ở góc hẻm |
| Nội dung | thời tiết · giá cả · than vãn · chào hỏi — **không bao giờ chạm `claim`** | **đúng** một `claim` vừa lan đêm trước |
| Có tầng nghe? | **Không.** Nghe được là nghe, bỏ qua là bỏ qua | **Có — 3 tầng, có giá** |
| Bỏ qua mất gì? | **Không gì cả** (≥ 85 % của chỉ số §5.1) | Mất một mẩu tin có thật |

Luật phân biệt một câu: **chỉ những gì mang một `claim` của hệ đồn thổi mới được quyền đòi
người chơi trả giá để nghe. Mọi thứ khác là nền, và nền thì miễn phí.** Giữ ranh giới này
tuyệt đối thì "hai chấm ở góc hẻm" vẫn giữ nguyên sức nặng dù hẻm có ồn ào thêm bao nhiêu —
vì người chơi học được rằng **chỉ cái dấu đó mới đáng dừng tay**, còn nói chuyện thường
thì nghe lúc đi ngang là đủ.

---

## 6. MƯỜI LĂM LUẬT THIẾT KẾ

Mỗi luật: **một câu mệnh lệnh · kiểm chứng được · một dòng cơ sở lý thuyết.** Dùng làm bộ
lọc duyệt mọi đề xuất.

---

**L1. Không bao giờ mở một modal, hay đòi người chơi đọc quá 8 từ, khi hai tay đang giữ
một trạng thái có thể hỏng (ổ nóng, ly trà đang rót, bảng kẹp nhân đang mở, ổ trong lò ở
băng SÉM).**
*Cơ sở:* Adamczyk & Bailey 2004 — ngắt quãng giữa chừng một nhiệm vụ con đắt hơn hẳn ngắt
ở ranh giới, đo được cả ở thời gian, lỗi, lẫn mức bực bội.
*Kiểm chứng:* test chạy một ngày, khẳng định không có `TalkPanel.show()` nào xảy ra khi
`hand ∈ {loaf_hot, loaf_filled, tea}` hoặc `assembly.isOpen` hoặc `handsBusy`.

**L2. Mọi lời bắt chuyện có chi phí (tức là có thể bị phạt nếu lơ) chỉ được phát ra tại
một trong bốn cửa sổ Coarse: sau khi đưa bánh / tay đang dính tiền · trong lúc ổ nằm trong
lò trước băng SÉM · trong và sau khi rửa tay · lúc tay không và không có ổ nào đang nguội.**
*Cơ sở:* Iqbal & Bailey 2007 — chi phí hồi phục tăng dần từ ranh giới Coarse xuống Fine.
*Kiểm chứng:* `offerTalk()` nhận một tham số ngữ cảnh tay/ổ/lò và trả `false` ngoài bốn
cửa sổ. Test đếm: 0 lời mời rơi vào cửa sổ ⛔1–⛔7.

**L3. Một phím không bao giờ được vừa MỞ vừa ĐÓNG cùng một thứ, khi một trong hai chiều có
giá.**
*Cơ sở:* Norman — mode error; và hậu quả bất đối xứng biến một thói quen vô hại (bấm lại)
thành một hình phạt không học được.
*Kiểm chứng:* `F` chỉ mở. Đóng là một phím khác, hoặc là một hành động khác hẳn. Bấm `F`
hai lần liên tiếp không bao giờ làm thay đổi `rel`.

**L4. `Esc` chỉ được mang MỘT nghĩa trong toàn bộ game: "lùi ra khỏi lớp trên cùng mà không
mất gì". Không bao giờ được là một nước đi có giá.**
*Cơ sở:* Norman — tính nhất quán của mode là điều kiện để người dùng xây được mô hình đúng.
*Kiểm chứng:* grep toàn repo, không có đường nào từ `Escape` dẫn tới `applyIgnore` / thay
đổi `rel` / thay đổi `anger`.

**L5. Không một lớp UI nào được nuốt phím tạm dừng. Người chơi phải vào được menu tạm dừng
từ MỌI trạng thái, kể cả giữa lúc khách đang nói.**
*Cơ sở:* CANON §15.2 (trợ năng, bắt buộc). Hiện `TalkPanel.bindKeys` gọi `stopPropagation()`
trên **mọi** `keydown` → `P` không tới được `StallScene`. Đây là vi phạm, không phải góp ý.
*Kiểm chứng:* test bắn `keydown P` khi mỗi overlay đang mở, khẳng định `scene.paused === true`.

**L6. Hội thoại không bao giờ được đóng băng đồng hồ. Nếu một đoạn nội dung cần đóng băng
để đọc kịp, thì đoạn đó quá dài — cắt nội dung, đừng dừng thế giới.**
*Cơ sở:* Csikszentmihalyi — mất cảm giác thời gian là một điều kiện của flow, và một cú
đóng băng cứng là một sự kiện phá vỡ; cộng với §3.2 — chi phí bằng 0 là nguyên nhân gốc
của hành vi spam.
*Kiểm chứng:* `clock.paused` chỉ được đặt bởi menu tạm dừng thật. Test: không có đường nào
từ hệ trò chuyện tới `clock.paused = true`.

**L7. Ngân sách đọc cho một lần tương tác trong lúc đang bán: tối đa 12 từ hiện cùng lúc,
và tối đa 1 quyết định.**
*Cơ sở:* CLT — tải ngoại lai chồng lên tải nội tại đã đầy thì tràn; đo thật: 32,3 từ/nhịp
= 7,5–10,8 s, so với vòng phục vụ 7,4–8,5 s.
*Kiểm chứng:* linter đếm từ trên mọi bề mặt hội thoại hiện được trong lúc `band !== LULL`.
Nội dung dài hơn chỉ được phép ở `LULL`, lúc quầy trống, hoặc ở màn hình tối.

**L8. Người chơi không bao giờ chọn câu nói. Mọi quyết định mang ý nghĩa quan hệ phải đi
qua một hành động có thể BỊ NHÌN THẤY ở thế giới — nguyên liệu, giá tiền, thứ tự phục vụ,
một ly trà, một cái chờ.**
*Cơ sở:* CANON T2, và §2.3 ở trên: chỉ kênh hành động mới đi qua `perception` →
`memory` → `gossip` và quay về thành lời; kênh lời nói là ngõ cụt (`applyTalk` cố tình
không gọi `remember()`).
*Kiểm chứng:* không còn `TalkNode.say` nào trên màn hình trong lúc bán. 47 nút `act` được
chuyển thành hành động trực tiếp.

**L9. Mỗi lựa chọn phải hoặc (a) đọc được hệ quả TRƯỚC, hoặc (b) quan sát được hệ quả SAU
ở mặt thế giới. Lựa chọn không có cả hai thì xoá — nó không phải lựa chọn.**
*Cơ sở:* CANON T5 + T3 cùng lúc; 1.450/1.615 nút hiện tại trượt cả hai.
*Kiểm chứng:* với mỗi lựa chọn còn lại, chỉ ra được **một** biểu hiện cụ thể (mặt, dáng,
lời, giá, thứ tự, một thứ xuất hiện sau N ngày). Không chỉ ra được = xoá.

**L10. Không bao giờ hiện cùng một thông tin ở hai kênh cùng lúc.**
*Cơ sở:* Sweller — redundancy effect + split attention. Hiện tại: khuôn mặt thật của khách
ở trên sân khấu **và** huy hiệu mặt trong panel **và** chữ `MOOD_LABEL` dưới huy hiệu — ba
lần cùng một thông tin, cách nhau 200 px.
*Kiểm chứng:* khuôn mặt chỉ vẽ trên người. Không có huy hiệu mặt thứ hai ở bất cứ UI nào.

**L11. Một lời bắt chuyện chỉ "có giá" khi NPC đã nói trọn một câu VÀO MỘT CỬA SỔ AN TOÀN
và người chơi vẫn không đáp. Mọi nấc dưới (liếc nhìn, đằng hắng, nửa câu) đều miễn phí.**
*Cơ sở:* Brown & Levinson — mức đe doạ mặt `W` phụ thuộc `R` (mức áp đặt), mà `R` phụ thuộc
việc người kia đang bận gì. Một FTA phát ra lúc người ta hai tay bận thì chính người nói
mới là người vi phạm.
*Kiểm chứng:* `applyIgnore` chỉ gọi được từ nấc cao nhất, và chỉ khi lời mời đã đi qua
kiểm tra cửa sổ của L2.

**L12. Mọi cơ chế có phần thưởng ở lịch tỉ lệ biến thiên phải có một chi phí nằm TRÊN CÙNG
MỘT TRỤC với phần thưởng, và chi phí đó phải tăng dần.**
*Cơ sở:* Skinner — VR là lịch sinh ra tỉ lệ phản ứng cao nhất và chống dập tắt tốt nhất;
không có chi phí cùng trục thì spam là hành vi tối ưu, không phải hành vi sai.
*Kiểm chứng:* mời khách phải tốn **thời gian game và vị trí** (bước ra khỏi quầy, đồng hồ
chạy). Test: mời 5 lần liên tiếp phải làm hàng chờ dài ra hoặc một ổ trong lò sém.

**L13. Khi có từ hai người trở lên trong tầm, mục tiêu của phím tương tác phải được tô
sáng Ở TRÊN NGƯỜI ĐÓ, trước khi bấm, không bao giờ chỉ ở một dòng chữ dưới chân màn hình.**
*Cơ sở:* Norman — gulf of execution; hành động không được cam kết vào một mục tiêu vô hình.
*Kiểm chứng của lỗi #7:* `talkTarget()` ưu tiên (1) `this.offer.c` → (2) gần nhất → (3)
`front`; nhưng dòng nhắc `"F — nói chuyện với <tên>"` nằm **cuối** chuỗi `prompt()`, **sau**
mọi nhánh `this.near?.id === "oven" | "basket" | "bin" | "board"`. Đứng ở lò hay ở thớt —
tức là **gần như toàn bộ thời gian chơi** — dòng đó **không bao giờ hiện**. Chỉ báo mục
tiêu hiện tại là không thể tiếp cận về mặt cấu trúc, không phải thiếu rõ ràng.
*Kiểm chứng:* một vòng sáng/một cái ngẩng đầu trên chính NPC mục tiêu, cập nhật mỗi frame,
độc lập hoàn toàn với hệ thống dòng nhắc.

**L14. Một thông báo nói về HỆ THỐNG khi người chơi tác động được vào hệ thống đó; nói về
THẾ GIỚI khi không. Không bao giờ được mặc áo thế giới cho một sự thật của hệ thống.**
*Cơ sở:* diegetic vs non-diegetic feedback; hiện thân vỡ khi người chơi buộc phải suy ra
rằng mô hình trong đầu họ khác mô hình thật của hệ thống.
*Kiểm chứng:* `"hết chuyện để nói với <tên> bữa nay rồi"` và `"…"` bị xoá; thay bằng bảng
11 câu ở §4.2, duyệt theo thứ tự 1→9, với **quan hệ luôn là lời giải thích cuối cùng**.

**L15. Chỉ thứ gì mang một `claim` của hệ đồn thổi mới được quyền đòi người chơi trả giá
để nghe. Mọi lời nói khác giữa hai NPC là nền, và nền thì miễn phí, không báo hiệu, không
mất gì khi bỏ qua.**
*Cơ sở:* eavesdropping as reward — thông tin miễn phí được xử lý như trang trí; cộng
Orkin — nói ra ý định là đủ, khỏi cần cài đặt gì. Giữ ranh giới tuyệt đối thì hai chấm `..`
ở góc hẻm không bao giờ bị loãng.
*Kiểm chứng:* ba chỉ số của §5.1 đo được trong một lần chạy `tools/sim.ts`: tỉ lệ chứng
thực ≤ 25 % · tần suất môi trường 6–10 lần/ngày · tỉ lệ "bỏ qua không mất gì" ≥ 85 %.

---

### Hai luật kèm theo (hệ quả, không đứng riêng)

**L16. NPC phải CHỦ ĐỘNG nói ra mọi câu mô tả ý định hoặc tình huống của chính họ. Không
bao giờ để một câu như vậy chỉ tới được người chơi qua một cú bấm phím.**
*Cơ sở:* Orkin — vocalizing intentions; và bằng chứng trực tiếp trong repo: `walkin.json`
có **0/6** cuộc khai `initiates`, nên `walkin.nhamquan` (*"Cho tui tô hủ tiếu, ít hành
nghen"*) chỉ nổ khi người chơi bấm F — tức là người chơi phải **gợi ý** cho khách nhầm quán.
Toàn kho: chỉ **17/86** cuộc có `initiates`.
*Kiểm chứng:* linter chia kho thành hai hạng — "NPC phải nói trước" (mọi câu mô tả ý định,
tình huống, yêu cầu) và "người chơi có thể gợi" — và bắt mọi câu hạng một phải có đường
chủ động.

**L17. Chi phí chú ý và chi phí trong trò chơi phải đi cùng chiều. Không bao giờ để một
hành động tốn nhiều chú ý mà không tốn gì trong trò chơi, hay ngược lại.**
*Cơ sở:* đây là phát biểu tổng quát của L6 + L12, và là nguyên nhân gốc chung của cả lỗi
#1 lẫn #5: một cuộc trò chuyện tốn **22–32 giây chú ý** và **0 giây game**.
*Kiểm chứng:* với mỗi tương tác, tính tỉ số (giây chú ý ước lượng) / (giây game tiêu thụ).
Tỉ số > 3 hoặc < 0,3 là một cờ đỏ cần giải trình.

---

## 7. Nguồn

**Tâm lý nhận thức / HCI**
- Leroy, S. (2009). *Why is it so hard to do my work? The challenge of attention residue when switching between work tasks.* Organizational Behavior and Human Decision Processes, 109(2), 168–181. — [IDEAS/RePEc](https://ideas.repec.org/a/eee/jobhdp/v109y2009i2p168-181.html) · [Semantic Scholar](https://www.semanticscholar.org/paper/Why-is-it-so-hard-to-do-my-work-The-challenge-of-Leroy/58a602c378da63993ab19b514e1bd57817bc18e5)
- Adamczyk, P. D. & Bailey, B. P. (2004). *If not now, when? The effects of interruption at different moments within task execution.* CHI '04, 271–278. — [ACM DL (dẫn trong)](https://dl.acm.org/doi/10.1145/1054972.1055016)
- Iqbal, S. T. & Bailey, B. P. (2007). *Understanding and developing models for detecting and differentiating breakpoints during interactive tasks.* CHI '07. — [PDF](https://interruptions.net/literature/Iqbal_Bailey-CHI07.pdf) · [ACM DL](https://dl.acm.org/doi/pdf/10.1145/1240624.1240732)
- Sweller, J. — Cognitive Load Theory; tải nội tại / ngoại lai / hữu ích, redundancy effect, split-attention effect.
- Norman, D. A. — *The Design of Everyday Things*; mode error, gulf of execution, gulf of evaluation.
- Csikszentmihalyi, M. — *Flow: The Psychology of Optimal Experience*; mục tiêu rõ, phản hồi tức thì, cân bằng thách thức/kỹ năng, mất cảm giác thời gian.
- Hick, W. E. / Hyman, R. — thời gian quyết định tăng theo `log₂(n+1)`.
- Skinner, B. F. — điều kiện hoá thao tác; lịch củng cố tỉ lệ biến thiên (variable ratio).

**Ngôn ngữ học xã hội**
- Brown, P. & Levinson, S. C. (1987). *Politeness: Some Universals in Language Usage.* Cambridge UP — mặt âm / mặt dương, công thức `W = D + P + R`, các chiến lược lịch sự.
- Goffman, E. (1967). *Interaction Ritual: Essays on Face-to-Face Behavior* — face-work.

**Thiết kế game**
- Orkin, J. (2006). *Three States and a Plan: The A.I. of F.E.A.R.* GDC 2006. — [PDF](https://www.gamedevs.org/uploads/three-states-plan-ai-of-fear.pdf) · [Internet Archive](https://archive.org/details/GDC2006Orkin)
- Orkin, J. *Combat Dialogue in F.E.A.R.: The Illusion of Communication.* Game AI Pro 2, ch. 2. — [PDF](https://www.gameaipro.com/GameAIPro2/GameAIPro2_Chapter02_Combat_Dialogue_in_FEAR_The_Illusion_of_Communication.pdf)
- Ruskin, E. (2012). *AI-driven Dynamic Dialog through Fuzzy Pattern Matching.* GDC 2012 — kiến trúc rule database chấm điểm theo độ cụ thể (CANON §11 bảo copy nguyên).
- Phê bình dialogue wheel / "illusion of choice" (nguồn phê bình, không phải nghiên cứu): [TheGamer — *Mass Effect Has Reminded Me Why I Hate Dialogue Wheels*](https://www.thegamer.com/mass-effect-dialogue-wheels-are-flawed/) · [Game Criticism — *Assessing Mass Effect 2 and Skyrim: collaborative criteria for player agency*](https://gamescriticism.org/2023/07/24/assessing-mass-effect-2-and-elder-scrolls-v-skyrim-using-collaborative-criteria-for-player-agency-in-interactive-narratives/)
- Phân loại thoại trong game (bark / ambient / walla / combat bark / emote): [*Dialogue in video games* — Dialogue Studies](https://www.academia.edu/37187222/Dialogue_in_video_games) · [*World Building With Dialogue Barks*](https://indiegamewriting.com/writing-2-world-building-with-barks/)

**Nguồn trong repo (đo trực tiếp)**
`docs/CANON.md` §0, §1 (T1–T5), §4, §5, §6, §11, §12, §15, §16 ·
`src/sim/talk.ts` · `src/sim/service.ts` (§trò chuyện ~2285–2470, `offerTalk` ~2843, `invite` ~2622) ·
`src/ui/stall/TalkPanel.ts` · `src/ui/AssemblyPanel.ts` · `src/scenes/StallScene.ts`
(`bindInput` ~960, `prompt` ~1260, `askFront`/`openTalkPanel` ~2098–2155, `update` ~1003) ·
`src/sim/loaf.ts` · `src/sim/oven.ts` · `src/sim/grip.ts` · `src/sim/overhear.ts` ·
`src/sim/passersby.ts` · `src/world/stations.ts` · `src/content/days/day_index.json` ·
`src/content/npcs.ts` · `src/content/talks/*.json` (14 file, 86 cuộc, 1.615 nút, 25.660 từ)
