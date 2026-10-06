# P4-06 — Màn mở đầu (script)

> Viết TRƯỚC khi gõ một dòng thoại nào. Lời thoại ở `src/content/intro.ts` là bản dựng của
> script này; sửa thoại mà không sửa ở đây là lần sau không ai biết câu đó để làm gì.

---

## 1. Tiền đề (chốt bởi chủ dự án)

Người chơi là **một đứa con gái hăm mấy tuổi tự ra bán**, không phải cháu ai, không được ai
giao xe. Cô **mua lại cái xe cũ của cô Ba** — người bán bánh mì ở cái hẻm này ba chục năm,
giờ nghỉ bán. Tiền là tiền của cô, lời lỗ là của cô, **chi phí cô phải tự tính**.

Cô Ba ở lại trong game đúng vai cũ (CANON §7.4): người chỉ nghề, không phải nhân viên, không
bao giờ làm bánh thay. Chỉ khác một chữ: **không phải bà cô ruột, mà là bà bán bánh mì cũ**.

Bảng hiệu mang **tên người chơi** — "BÁNH MÌ \<tên\>". Cô Ba đã cạo tên cô ra khỏi tấm tôn
trước khi bán cái xe.

## 2. Vì sao cảnh này tồn tại

Ba việc, không có việc thứ tư:

| # | Việc | Làm bằng cách nào |
|---|---|---|
| 1 | Đặt người chơi vô chỗ: 4 rưỡi sáng, đầu hẻm, cái xe cũ | cô Ba nhận ra cái xe của mình |
| 2 | Dựng **cái đồng hồ chi phí** chạy trước khi bán được ổ nào | cô Ba hỏi, người chơi tự nhẩm ra con số |
| 3 | Gieo T1 — khách thấy hết — **bằng một chuyện cũ, không bằng lời dạy** | chuyện ông khách bỏ đi hai chục năm |

Không có việc "dạy phím". Không có "cố lên con nghen". Không có lời hứa.

## 3. Tư liệu văn phong

Giọng lấy từ lời **nói thật** của mấy bà bán bánh mì lâu năm ở TP.HCM, không lấy từ văn viết:

- *"Có bí quyết gì đâu con…"*, *"Hai chỉ làm như lúc ăn cơm ở nhà thôi"* — bà Hai, xe bánh
  mì 30 năm trong hẻm ([Thanh Niên](https://thanhnien.vn/xe-banh-mi-30-nam-trong-hem-sai-gon-an-bao-ngon-cua-ba-cu-72-tuoi-185857972.htm)).
  Rút ra: **người già xưng bằng vai của mình** ("bà Hai", "cô"), **đệm "con" cuối câu**, và
  **gạt phăng lời khen** thay vì nhận.
- Khởi nghiệp xe bánh mì đời thật toàn kể bằng **con số trần trụi**: 2 triệu vốn, mua xe cũ
  1 triệu, tân trang 1,5 triệu, ôm nợ 500 ngàn, ngày đầu hết 100 ổ
  ([ZNews](https://znews.vn/chong-ngu-nuong-9x-sai-gon-khoi-nghiep-voi-banh-mi-post541990.html) ·
  [Bánh Mì Má Hải](https://banhmimahai.vn/khoi-nghiep-ban-banh-mi-cua-ong-chu-banh-mi-ma-hai/)).
  Rút ra: **chỗ nào nói được bằng số thì đừng nói bằng tính từ.**

### Bốn luật viết, rút từ chỗ bản nháp trước bị chê "AI quá"

1. **Cấm bộ ba.** "Tay dơ người ta thấy. Bánh khét người ta ngửi. Quên tên người ta nhớ."
   — không ai ngoài đời nói ba vế cân nhau như vậy. Đó là văn quảng cáo.
2. **Cấm châm ngôn đứng một mình.** Câu rút ra bài học chỉ được đứng SAU một chuyện cụ thể,
   và phải nghe như lời kết của chuyện đó, không phải lời đề từ.
3. **Số thật, tên thật.** Tiền trong thoại phải khớp `content/econ/econ.json`: tiền chỗ
   17.000₫/bữa (L1), chi phí cố định 40.000₫/bữa, ổ thường 25.000₫, vốn đầu 1.400.000₫.
   Người được nhắc phải có trong CANON §9 (chú Kiệt), không bịa thêm người.
4. **Người chơi được phép cãi.** Một câu. Không cãi thì cô ấy là cái loa, không phải người.

## 4. Nhịp (beat sheet)

| # | Beat | Ai đẩy | Kết thúc ở |
|---|---|---|---|
| 1 | Cô Ba đi bộ ngang, nhận ra cái xe cũ của mình | cô Ba | "Cô hỏi cho có chuyện thôi." |
| 2 | Cái xe sơn lại → bắc cầu qua chuyện tiền | cô Ba | "Còn nhiêu?" |
| 3 | **Bắt tự nhẩm chi phí** — than, đá, bịch, xăng, tiền chỗ | người chơi trả lời | "Bốn chục. Chưa bán được ổ nào đã mất rồi đó." |
| 4 | Giá bán — so với chú Kiệt bên kia hẻm | cô Ba hỏi, người chơi cãi | "Ờ thì bán thử coi." |
| 5 | **Chuyện ông khách** — gãi đầu, bốc đồ chua, hai chục năm | cô Ba kể | "Ổng nhớ, vậy thôi." |
| 6 | Cô Ba bỏ đi, ngoái lại nhắc cái bảng hiệu trống | cô Ba | → ô nhập tên |
| 7 | Đọc lại cái tên, cụt một câu, rồi về | cô Ba | "Nhóm lò đi con." |

Beat 5 là beat duy nhất được phép dài. Cắt beat nào cũng được trừ beat 3 và 5 — nút "Bỏ qua"
nhảy thẳng tới beat 6 vì **cái tên thì không bỏ qua được**.

## 5. Ràng buộc kỹ thuật

- Tên đi vô `SaveFile.playerName` lúc `newGame()`, tức phải xong TRƯỚC ngày 1 (`IntroScene`).
- Tên hiện ở: bảng hiệu trên vách (`art/sign.ts`), bảng menu bấm E (`ui/menu/MenuBoardView`),
  dòng phụ nút "Chơi tiếp" ở sảnh.
- Để trống được: bảng hiệu còn trơ chữ "BÁNH MÌ", và cô Ba có một câu riêng cho trường hợp đó.
- Trợ năng: xem đầu file `ui/intro/IntroView.ts`.

---

## 6. Đề xuất sửa CANON

> Theo luật ở đầu `docs/CANON.md`: doc con **không tự sửa** CANON, chỉ ghi đề xuất ở đây.

**CANON §7.4 — "Người chơi là cháu của cô Ba, đang trông xe giúp cô."**

Đề xuất đổi thành: *"Người chơi là một cô gái hăm mấy tuổi **tự ra bán**. Cô mua lại cái xe
cũ của cô Ba — bà bán bánh mì ba chục năm ở hẻm này, giờ nghỉ. Cô Ba vẫn là **người chỉ nghề**
(xuất hiện buổi sáng, buổi tối, thỉnh thoảng đứng tiếp khách vài phút) và **không bao giờ làm
bánh thay người chơi**."*

Lý do (chủ dự án chốt khi duyệt màn mở đầu): "trông xe giùm" thì **tiền không phải của người
chơi**, mà cả Phase 3 (tự tính chi phí, vỡ hụi, tiền học, bán đồ nghề) chỉ có sức nặng khi lỗ
là lỗ của chính mình. Bảng hiệu mang tên người chơi là hệ quả trực tiếp của chỗ sửa này.

Cái **không** đổi: cô Ba vẫn đúng vai mentor của §7.4 và §7 mục 4 ("người dạy là cô Ba, không
phải hệ thống phạt"); mọi lời thoại cô Ba đang có vẫn đúng, kể cả
`CART_DOWNGRADED` — *"Xe này cô đẩy hồi mới hăm mấy"* — vì đó đúng là cái xe cô bán lại.

---

## 7. Dẫn bữa đầu (`sim/tour.ts` + `ui/tour/TourCoach.ts`)

Màn mở đầu giao cái xe; phần dẫn giao CÁI VIỆC. Bảy việc của ngày 1, mỗi lúc một việc, hiện
ra bằng **bong bóng dẫn kiểu tour của web**: khoanh tròn thứ cần bấm, phần còn lại tối đi,
cô Ba hiện lên cạnh đó nói một câu, và luôn có nút **Bỏ qua**.

| Việc | Khoanh cái gì | Xong khi |
|---|---|---|
| 1 `CHO` | dấu **+** ở sạp → rồi nút **Mua xong** → rồi **Trả tiền** | rời chợ ra quán |
| 2 `MENU` | chỗ đứng đọc bảng menu | mở bảng menu (E ở vách) |
| 3 `BANH` | kệ bánh | trên tay có ổ nguội |
| 4 `LO` | lò than (hoặc thùng rác / kệ, tuỳ đang cầm gì) | lấy được ổ **chín** ra khỏi lò |
| 5 `THOT` | thớt | bảng kẹp nhân mở ra |
| 6 `NHAN` | khay nhân trong bảng | ổ đủ **ba phần**: pate · nhân mặn · rau |
| 7 `GOI` | nút **Gói lại** | ổ rời thớt lên tay |

Hai bước có lời dẫn ĐỔI THEO TRẠNG THÁI, không nói một câu rồi thôi:

- **Lò** — ba nhịp, và cái phải học là **BA CÁI VÒNG** trên lò (`drawOven`), không phải cái lò:
  1. *"Tới lò, bấm E bỏ ổ vô."* — khoanh cái lò.
  2. Ổ còn non: khoanh **ba cái vòng**, *"Ba cái vòng là ba ngăn lò. Vòng chạy tới khúc vàng
     mới là giòn — chờ đã."* Và cú E lấy ổ ra bị **CHẶN** (*"chưa giòn — chờ vòng vàng đã"*):
     người mới bỏ vô cái là bấm lấy ra liền, rồi không hiểu vì sao khách chê ổ nguội.
  3. Ổ vừa chạm khúc vàng **và người chơi đang đứng ngay lò**: **game đứng lại một nhịp**
     (`tourFreeze` → `runFrame` nhận dt = 0, đồng hồ lẫn độ giòn đều ngừng), vòng sáng lên,
     *"Khúc vàng rồi, bánh được. Bấm E lấy ra."* Cú E đó vừa thả băng vừa lấy ổ.
     Qua khúc cam / hết vòng thì không đóng băng nữa, chỉ đổi câu.

  ⚠️ Vế **"đang đứng ngay lò"** không phải cho đẹp, nó chống KẸT: đóng băng là tắt luôn pha
  `input`, nên đứng xa lò mà bị đóng băng thì không đi tới lò được nữa, mà cú E ở xa lò lại
  không lấy được ổ — thả xong frame sau đóng lại ngay. Ổ cháy KHÔNG tính là xong bước lò (nó
  không gác lên thớt được): vòng khoanh chuyển sang thùng rác rồi quay về kệ.

- **Nhân** — dạy cái KHUNG của một ổ, không đếm số: *"Ổ nào cũng ba phần: pate, một thứ nhân
  mặn, rồi rau."* → *"Giờ tới nhân mặn…"* → *"Còn rau nữa…"* → *"Đủ rồi — bấm Gói lại."*
  Luật nằm ở `fillGap()` (`sim/tour.ts`, thuần, có test). Đây là KHUNG của ổ bánh, không phải
  công thức chấm điểm — chấm điểm là việc của `diffDish`, và nó so với đơn của người đang chờ.

Ba quyết định:

1. **Một lớp DOM duy nhất, không phải hai.** Bữa đầu đi qua cả trang chợ (DOM) lẫn cái quán
   và bảng kẹp nhân (canvas Phaser). `TourCoach` nhận cả hai kiểu mốc — một phần tử DOM
   (`pointEl`) hoặc một ô trong khung thiết kế 1024 × 576 (`pointDesign`) — nên chỉ có một
   bản để sửa, và vòng khoanh ở chợ với vòng khoanh trong quán là cùng một thứ.
2. **Không nuốt chuột.** `pointer-events: none` ở mọi chỗ trừ đúng cái bong bóng: người chơi
   bấm thẳng vào thứ đang được khoanh — đó là cả ý nghĩa của việc khoanh nó.
3. **Vòng khoanh ôm đúng cái vật.** Tâm và bán kính đo bằng `spriteEdges` (mép pixel ĐỤC,
   không phải mép khung texture) — lấy mốc của dấu ❗ (nằm ở mép trên vật) làm tâm thì vòng
   trôi lên nóc, chỗ cao chỗ thấp tuỳ vật cao thấp.
4. **Chỉ ngày 1, bỏ qua một cú bấm.** Qua ngày 2 là im luôn, dù làm tới đâu. Nút Bỏ qua nằm
   ngay trên bong bóng chứ không nằm trong Cài đặt.

Ở chợ, ba chặng đọc thẳng từ trạng thái của trang (giỏ trống / có đồ / đang xác nhận) chứ
không từ một bộ đếm riêng — bấm lung tung cỡ nào cái vòng cũng không lạc.

Chi tiết và lý do: đầu file `src/sim/tour.ts` và `src/ui/tour/TourCoach.ts`.
Test: `tests/tour.test.ts`.
