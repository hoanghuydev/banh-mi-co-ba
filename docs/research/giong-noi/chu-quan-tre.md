# Research — Giọng chủ quán trẻ nói với khách

> Làm theo skill `research-giong-viet`. Phục vụ `docs/revamp/plan-thoai-nguoi-choi.md` §3.
> Ngày thu: **2026-10-20**. Bảng giọng dùng để viết: `giong-phuong-anh.md`.
> Mẫu đã ẩn danh (bỏ tên, tên quán, tag). Mẫu chỉ để rút pattern, **không chép vào game**.

---

## 0. Kết luận nhanh

| # | Phát hiện | Bằng chứng |
|---|---|---|
| 1 | **`nghen` gần như không ai gõ nữa, `nha` thì rất nhiều.** Câu người chơi hiện tại thì ngược hẳn. | Dataset: `nha` 27/1.000 câu, `nghen` **0**. Câu người chơi: `nghen` 187, `nha` **0** (§3) |
| 2 | `hổng` gần như không còn. `hông` có nhưng ít. Mặc định là `không/ko/k`. | Dataset: `hổng` 0,8 · `hông` 2,5 · `không+ko+k` ~130 trên 1.000 câu |
| 3 | Chủ quán trả lời khách mà **được khen** đi theo khuôn: cảm ơn/xin lỗi → **nêu một sự thật cụ thể** → mời lần sau. | Trả lời 5 sao kiểu "tô đó 750ml… lần sau chị ghi chú nhiều cháo" (§2.A) |
| 4 | Chủ quán trả lời mà **bị ném đá** đều dính một trong ba lỗi: mỉa khách, chê ngoại hình/trình độ, "mua thì mua". Bị ghét vì thái độ chứ không vì cái giá. | 5 vụ báo đưa tin (§2.A, §2.C) |
| 5 | Chất "cựu công sở" thật nằm ở **vài nỗi khổ quen thuộc**: việc gì cũng "gấp", tin nhắn sếp lúc khuya, lương thấp mà việc như lương cao, "hết giờ là hết giờ". | ~60 comment VnExpress (§2.D) |
| 6 | Người trẻ mở quán khi trả lời phỏng vấn tự xưng **`mình`**, nói thẳng, thực tế, tự giễu nhẹ. Khi nói với khách thì xưng theo vai vế (em/con/chị). | Phỏng vấn trên Thanh Niên, Dân trí (§2.B) |

---

## 1. Câu người chơi hiện có — tone & tình huống

Đo trên `ba-bay.json`, `walkin.json`, `be-su.json` (574 câu `say`). Cột tổng là toàn bộ 15 file.

| Tone | 3 file | Tổng | Nghĩa (suy từ câu) | Ví dụ đang có |
|---|---|---|---|---|
| `AM` | 198 | 836 | ấm: mời, chừa phần, cảm ơn, hỏi chuyện | Trưa bà ghé nghen, con để phần ổ bánh. |
| `THUONG` | 92 | 370 | thương: hỏi thăm, nhường, dặn dò, xuống nước | Dạ anh đợi em một phút nữa thôi. |
| `LANH` | 107 | 351 | lạnh: cụt, từ chối, "Dạ." | Dạ thôi, con bận rồi bà. |
| `THANG` | 72 | 255 | thẳng: hỏi thẳng, cứng giá, ranh giới | Dạ em không muốn lên hình anh à. |
| `DUA` | 69 | 237 | đùa: giỡn, phóng đại, cà khịa nhẹ | Trúng rồi con chia bà một nửa nghen. |
| `GAT` | 27 | 87 | gắt: bực, đuổi, nói nặng | Giá đó đó anh. Mua thì mua. |
| `IM` | 5 | 35 | im (`…`) | … |
| `CHUI` | 3 | 14 | bênh khách, chửi người thứ ba | Sếp gì mà chửi nhân viên trước mặt người ta. |
| `NGAC_NHIEN` | 1 | 1 | ngạc nhiên | Ủa con quay thiệt hả con. |

**Tình huống điển hình**

| Nhóm | Cuộc thoại tiêu biểu |
|---|---|
| Mời / nhận lời mua | `bay.veso` (mua vé số), `walkin.donvp` (đơn 8 ổ) |
| Nói giá / bị chê mắc / trả giá | `walkin.chemac`, `walkin.traigia`, `walkin.thoitien` |
| Xin lỗi / bị hối | `walkin.cau` (đợi lâu) |
| Từ chối | `walkin.quayclip`, `su.quay`, vé số |
| Hỏi thăm / an ủi | `bay.chandau`, `bay.mua`, `su.buon` |
| Đùa / chuyện phiếm | `bay.cailuong`, `bay.pano`, `su.drama.mang` |
| Nhắc / dạy trẻ | `su.toan`, `su.sacnho`, `su.anhbao` |
| Khách lạ nhờ việc | `walkin.chiduong`, `hoigio`, `trumua`, `dungxe`, `nhamquan` |

**Số đo câu hiện có:** trung bình 7,9 từ/câu (trung vị 8, dài nhất 16). **26% câu mở bằng "Dạ"**. Nhiều câu gọi vai **hai lần** ("Bà còn nhiêu tờ nữa bà?").

---

## 2. Nguồn & mẫu

### Tổng số mẫu

| Nhóm | Nền tảng | Mẫu | Đạt chỉ tiêu plan? |
|---|---|---|---|
| A. Chủ quán/shop **nói thẳng với khách** (trả lời review, comment) | Báo trích ảnh chụp Google Maps, app giao đồ ăn, Facebook | **28** | ❌ (plan: 40 Maps + 30 FB) |
| B. Chủ quán trẻ **nói về khách / nghề** (phỏng vấn) | Thanh Niên, Dân trí, Tuổi Trẻ, Kenh14 | ~80 câu | — (bổ trợ) |
| C. Khách / dân mạng **chấm thái độ chủ quán** | Comment trích trên Kenh14, Tuổi Trẻ | 23 | — |
| D. Dân văn phòng than sếp / OT / nghỉ việc | Comment VnExpress (6 bài + 6 bài nghỉ việc mở quán) | 209 comment ngắn, ~60 đúng chủ đề | ✅ (plan: 20) — nhưng không phải Threads |
| E. Dataset | UIT-ViHSD (câu CLEAN), UIT-ViCTSD (câu không độc) | 2.447 + 1.424 câu | ✅ (plan: 50) |
| TikTok, Threads, Facebook page, Google Maps trực tiếp, ShopeeFood | — | **0** | ❌ xem §5 |

### Danh sách nguồn (ngày xem: 2026-10-20)

| ID | Nguồn | Ngày bài | Loại |
|---|---|---|---|
| S1 | [2sao — chủ quán cháo trả lời review](https://2sao.vn/bi-review-chao-ngot-vi-mi-chinh-chu-quan-chao-suon-dap-tien-vong-301103.html) | 29/03/2022 | A |
| S2 | [Kenh14 — quán 1,4 sao Hà Nội](https://kenh14.vn/mxh-nin-tho-xem-review-quan-an-14-sao-o-ha-noi-nhan-vien-va-khach-doi-dap-cuc-gat-chu-quan-da-noi-gi-20240319140718616.chn) | 19/03/2024 | A, B |
| S3 | [Tuổi Trẻ Cuối tuần — "nhìn thấy 1 sao…"](https://cuoituan.tuoitre.vn/nhin-thay-1-sao-chung-toi-cay-mat-va-dau-long-qua-1644182.htm) | 13/05/2022 | A (một phần là văn mẫu dịch từ app Trung Quốc) |
| S4 | [Kenh14 — shop bánh trứng 39k/40k](https://kenh14.vn/drama-bung-no-tu-cai-banh-trung-khach-to-shop-khong-chuan-vi-dang-gia-39k-ban-40k-chu-shop-mia-mai-khach-co-1k-cung-ki-keo-20240405115630605.chn) | 05/04/2024 | A, C |
| S5 | [Kenh14 — chủ shop và khách "đổi vai"](https://kenh14.vn/loat-tinh-huong-chu-shop-va-khach-mua-hang-online-doi-vai-thuong-de-cho-nhau-cang-doc-cang-thay-phi-ly-20191121145558707.chn) | 21/11/2019 | A |
| S6 | [Kenh14 — khách hỏi hàng chính hãng](https://kenh14.vn/khach-hoi-co-phai-hang-chinh-hang-khong-chu-shop-tra-loi-mot-cau-dat-10-diem-ca-tinh-nhung-chua-chac-ban-duoc-hang-20190408142643167.chn) | 08/04/2019 | A, C |
| S7 | [Afamily — shop giày trả lời ngọt](https://afamily.vn/khach-binh-luan-hoi-mua-giay-shop-lai-bat-ngo-to-lai-cuc-ngot-khien-dan-mang-khong-nhin-duoc-cuoi-20190814120348946.chn) | 14/08/2019 | A |
| S8 | [Afamily — chủ shop online với khách cộc lốc](https://afamily.vn/man-dap-tra-dich-dang-cua-cac-chu-shop-online-voi-con-ac-mong-coc-loc-vo-duyen-mang-ten-thuong-de-2016120812292512.chn) | 08/12/2016 | B |
| S9 | [Kenh14 — chủ shop khi bị khách chê](https://kenh14.vn/doi-song/cac-chu-shop-noi-gi-khi-khach-che-san-pham-cua-minh-va-dang-len-facebook-20160323005400175.chn) | 23/03/2016 | B |
| S10 | [Thanh Niên — xe bánh mì của cô cử nhân](https://thanhnien.vn/chuyen-dac-biet-dang-sau-xe-banh-mi-cua-co-cu-nhan-185241221123820339.htm) | 21/12/2024 | B |
| S11 | [Thanh Niên — 1 sao hay 5 sao Google Maps](https://thanhnien.vn/danh-gia-1-sao-hay-5-sao-tren-google-maps-chu-quan-o-tphcm-nghi-gi-185251112170934011.htm) | 12/11/2025 | B |
| S12 | [Dân trí — quán bị 1 sao vì nhắc khách trật tự](https://dantri.com.vn/du-lich/nhan-1-sao-vi-nhac-khach-trat-tu-quan-nuoc-dang-ban-tuong-trinh-giai-oan-20250717132846052.htm) | 17/07/2025 | B (có bài Threads của chủ quán) |
| S13 | [Dân trí — quán bị "bão" 1 sao vì cấm trang điểm](https://dantri.com.vn/lao-dong-viec-lam/nhac-khach-khong-trang-diem-chu-quan-ca-phe-sung-nguoi-vi-nhan-bao-1-sao-20260106121553090.htm) | 07/01/2026 | B |
| S14 | [Tuổi Trẻ — reviewer và chủ quán ăn](https://tuoitre.vn/dulichtphcm/thay-gi-tu-cuoc-khau-chien-giua-cac-reviewer-va-chu-quan-an-10736546.htm) | 10/08/2022 | B, C |
| V1–V6 | Comment VnExpress, bài về làm ngoài giờ: [5094616](https://vnexpress.net/lam-viec-ngoai-gio-luong-18-trieu-nhung-9-gio-toi-van-bi-sep-giao-viec-bat-ngo-5094616.html) · [5074682](https://vnexpress.net/gen-z-bi-cong-viec-nuot-chung-vi-tin-nhan-luc-23h-5074682.html) · [5100603](https://vnexpress.net/ap-luc-sep-nhan-la-phai-tra-loi-5100603.html) · [5101820](https://vnexpress.net/nhung-nguoi-chon-mat-tich-sau-gio-lam-5101820.html) · [5102724](https://vnexpress.net/ap-luc-truc-tuyen-thuc-day-xu-huong-ngat-ket-noi-sau-gio-lam-5102724.html) · [5079673](https://vnexpress.net/quyen-ngat-ket-noi-voi-sep-sau-gio-lam-bao-ve-nhan-vien-hay-lam-kho-ca-hai-5079673.html) | 05–08/2026 | D |
| V7–V12 | Comment VnExpress, bài về nghỉ việc mở quán / ra kinh doanh: [4702577](https://vnexpress.net/tinh-mong-sau-10-nam-nghi-viec-ngan-hang-de-mo-quan-ca-phe-4702577.html) · [5051490](https://vnexpress.net/neu-ca-doi-khong-ruc-ro-thi-sao-chau-gai-gen-z-bo-viec-luong-20-trieu-de-khoi-nghiep-5051490.html) · [4887739](https://vnexpress.net/nguoi-tre-bo-viec-luong-cao-de-duoc-song-co-y-nghia-4887739.html) · [5084056](https://vnexpress.net/bo-cong-so-nguoi-tre-lap-cong-ty-mot-nguoi-5084056.html) · [5125320](https://vnexpress.net/cuu-giam-doc-that-nghiep-ban-khoai-nuong-via-he-5125320.html) · [5103084](https://vnexpress.net/tranh-luan-quanh-o-banh-mi-200-000-dong-5103084.html) | 2024–2026 | D |
| E1 | [UIT-ViHSD (bản sao htdung167/ViHSD)](https://huggingface.co/datasets/htdung167/ViHSD) — 3.000 dòng đầu tập train, giữ 2.447 câu CLEAN | ~2019–2020 | E (comment Facebook/YouTube) |
| E2 | [UIT-ViCTSD (tarudesu/ViCTSD)](https://huggingface.co/datasets/tarudesu/ViCTSD) — 1.600 dòng, giữ 1.424 câu không độc | ~2020 | E (comment VnExpress) |

### 2.A — Chủ quán/shop nói thẳng với khách (28 mẫu, ẩn danh, rút gọn)

| # | Tình huống | Câu (rút gọn) | Nguồn | Dân mạng đánh giá |
|---|---|---|---|---|
| A1 | Cảm ơn 5 sao + nêu sự thật | "Tô đó 750ml đó chị. Lần sau chị ghi chú nhiều cháo, quán có tô lớn hơn." | S1 | ổn |
| A2 | Bị chê 3 sao | "Nói luyên thuyên. Tiễn vong" | S1 | bị chê cục súc |
| A3 | Bị nghi làm sẵn | "Ăn thì ăn, không ăn thì thôi…" | S2 | bị chê |
| A4 | Bị nghi câu view | "Em đừng có câu like câu view là không được đâu" | S2 | bị chê |
| A5 | Chủ quán xin lỗi qua báo | "Nếu mình làm sai thì các bạn cho mình xin lỗi và khắc phục." | S2 | ổn |
| A6 | Thấy 1 sao | "Nhìn thấy 1 sao… cay mắt và đau lòng quá. Có vấn đề gì bạn nói ra đi ạ!" | S3 | hài, được khen |
| A7 | Bị chê cơm sống | "Cơm bị sống và cơm hơi cứng là hai khái niệm khác nhau." | S3 | cà khịa |
| A8 | Xin lỗi | "Thành thật xin lỗi vì khiến quý khách không hài lòng." | S3 | trang trọng |
| A9 | Đùa với khách | "Ôi má ơi! Lớn từng này lần đầu gặp người tài như anh." | S3 | hài |
| A10 | Giải thích phần ăn | "Miếng gà to nhỏ là do lấy từ hai con gà khác nhau." | S3 | hài + sự thật |
| A11 | Đền bù vui | "Anh cho địa chỉ, tôi gửi tặng anh một con gà." | S3 | hài |
| A12 | Giải thích định lượng | "Mỗi phần chỉ có 4 miếng thịt, anh thử xem review chỗ khác…" | S3 | thẳng |
| A13–A18 | Bị hỏi vụ 1k | "1k không đáng bao nhiêu, chị không phải nói dài dòng." · "Em không có thời gian đôi co, chị không ưng thì đừng mua." · "Cảm ơn chị đã không ghé…" · "Bye không hẹn gặp lại" + 2 câu xưng mày tao | S4 | **bị ném đá** |
| A19–A24 | Trả lời review xấu | "Ngón út của bạn to thật" · "Khách khó tính!" · "Về soi gương lại đi nha" · sửa chính tả khách rồi "có cũng không bán" (+2 câu) | S5 | **bị ném đá** |
| A25 | Bị hỏi hàng thật | "Thế mà chị cũng phải hỏi…" | S6 | bị chê |
| A26 | Dân mạng gợi ý câu đúng | "Em ơi hàng nhà chị chuẩn nha, chị không bán hàng fake, em yên tâm nhé" | S6 | **mẫu được khen** |
| A27 | Hết hàng, chơi chữ | "Màu trắng bên anh hết rồi, giờ chỉ còn đôi mình thôi ♥" | S7 | được khen dễ thương |
| A28 | Bài đăng của chủ quán (Threads) | "Quán không yên tĩnh… thoải mái nhưng ở mức có chừng mực" | S12 | được ủng hộ |

### 2.B — Chủ quán trẻ nói về khách & nghề (trích chọn, ~80 câu đã đọc)

| Ý | Câu (rút gọn) | Nguồn |
|---|---|---|
| Tự xưng `mình`, nói thật | "8 tháng qua, chưa ngày nào mình thấy hối hận vì đi bán bánh mì." | S10 (chủ xe bánh mì 25 tuổi) |
| So với văn phòng | "Ngày xưa đi làm văn phòng mình chỉ đủ sống…" | S10 |
| Thực tế, không kể khổ | "Mình chọn chỗ này vì có nhiều sinh viên, người đi đường." | S10 |
| Ngại khách khó | "Muốn điên lên không được, vẫn phải cười nói lại từ đầu!" | S8 |
| Lúc đầu nhịn | "Hồi đầu mình trả lời tử tế lắm, kìm nén tức giận để rep lại" | S8 |
| Chủ shop 23 tuổi | "Khách không ưng thì muốn đổi cho đổi, muốn trả cho trả." | S9 |
| Không ép khách | "Mình không thích ép khách mua vì hay đặt mình vào chỗ khách." | S9 |
| Nhắc khách nhẹ | "Mình chỉ nhắc nhẹ nhàng, không hề khó chịu hay nặng lời" | S12 |
| Được an ủi | "Mình thấy vui vì có người hiểu và cảm thông." | S12 |
| Áp lực sao | "Đôi lúc mình cũng thấy áp lực về những đánh giá sao này." | S11 |
| Người bán lớn tuổi (đối chiếu) | "…hữu xạ tự nhiên hương, khách vẫn ủng hộ mình." | S11 (63 tuổi) |

→ Người trẻ: câu ngắn, `mình`, `thôi`, `luôn`, kể thẳng. Người lớn tuổi: thành ngữ, "ủng hộ". Phương Anh nên đi theo kiểu đầu.

### 2.C — Khách chấm thái độ chủ quán (23 mẫu, rút gọn)

| Kiểu | Câu |
|---|---|
| Ghét thái độ, không tiếc tiền | "Không phải tiếc 1k, mà là ghét cái thái độ…" · "Khách không tiếc 1k, tiếc cái thái độ lươn lẹo" |
| Muốn nói nhẹ | "Thà nói nhẹ nhàng tử tế một câu, khéo người ta vẫn mua 40k" |
| "Mua thì mua" làm mất khách | "Cứ hỏi là nói kiểu mua thì mua, bận trả lời." → "từ ấy không mua nữa" |
| Hỏi là bình thường | "Khách hỏi vậy là bình thường, sao phải xồn xồn lên." |
| Khách trẻ đi ăn | "Tò mò, thấy hot thì đi ăn." · "Hợp miệng thì lần sau ghé nữa, không hợp thì thôi" |

### 2.D — Dân văn phòng than (chất "cựu công sở", ~60 mẫu đúng chủ đề, rút gọn)

| Nỗi khổ | Câu (rút gọn) | Số mẫu tương tự |
|---|---|---|
| Việc gì cũng "gấp" | "Chuyện gì cũng gắn mác gấp, thành ra lúc nào cũng phải on" · "email nào cũng GẤP/URGENT" | 6 |
| Tin nhắn lúc khuya | "Đêm về rồi mà tin nhắn còn ting ting" · "Teams, Zalo vẫn nhảy thì khác gì chưa tan làm" | 11 |
| Câu hỏi không phải câu hỏi | "'Em làm ngay được không?' — thật ra không phải câu hỏi!" | 3 |
| Sợ tin nhắn sếp | "Giờ cứ thấy tin nhắn sếp là tim đập thình thịch" | 4 |
| Lương không xứng | "Lương 10 triệu mà làm như lương 100 triệu" · "18 triệu mà làm như 180 triệu" | 7 |
| Đi trễ bị phạt, ở lại thì "cống hiến" | "Trễ 1–2 phút thì phạt, làm quá 30 phút thì gọi là cống hiến" | 4 |
| Hết giờ là hết giờ | "Hết giờ làm là hết giờ làm, khó hiểu lắm hả?" | 9 |
| Đùa sếp | "Tui ngoài giờ chỉ đi nhậu, sếp gọi thì rủ sếp ra nhậu luôn" · "Xe sếp xịn thế, mới mua à sếp" | 5 |
| Làm chủ cũng khổ | "Làm chủ làm cả chủ nhật, thứ 7 làm hết" · "Làm thuê thì mong làm chủ, làm chủ rồi than đủ điều" | 8 |
| Gen Z bị chê | "từ lúc có từ gen Z thì thấy các bạn trẻ cứ sao sao ấy" | 3 |

Lưu ý: comment VnExpress do người 30–50 tuổi viết nhiều, xưng "tôi", giọng nghiêm hơn Threads. Chỉ lấy **nội dung nỗi khổ**, không lấy giọng.

---

## 3. Đo từ đệm — dataset so với câu người chơi hiện có

Tỉ lệ = số câu có từ đó / 1.000 câu.

| Từ | ViHSD (MXH, 2.447) | ViCTSD (VnExpress, 1.424) | Câu người chơi hiện có (1.870) | Kết luận |
|---|---|---|---|---|
| `nha` | **27** | 10 | **0** | dùng chính |
| `nhé` | 27 | 27 | — | giọng Bắc/trung tính, Phương Anh dùng `nha` |
| `nghen` | **0** | 0 | **100** | bỏ |
| `nhen` / `hen` | 0 / 0,8 | 0 | 1,6 / 0,5 | bỏ |
| `nè` | 16 | 3 | 19 | giữ |
| `luôn` | 27 | 45 | 19 | giữ |
| `ghê` | 8 | 7 | 26 | giữ, bớt |
| `á` (cuối câu) | 9 | 3 | 1 | thêm |
| `ha` | 4 | 4 | 32 | giữ, bớt |
| `hông` | 2,5 | 1,4 | 68 | giảm mạnh |
| `hổng` | 0,8 | 1,4 | **81** | bỏ |
| `chớ` / `chứ` | 0,4 / 25 | 1,4 / 55 | 12 / — | `chứ` |
| `thiệt` / `thật` | 5 / 22 | 10 / 73 | 25 / — | `thiệt` ít, chỉ ở "thiệt hả/thiệt luôn" |
| `vậy` / `zậy` / `dị` | 24 / 0,8 / 3 | 74 / 0 / 3 | — | `vậy` |
| `ủa` | 5 | 0,7 | — | thêm (ngạc nhiên) |
| `dạ` | 3 | 0,7 | **26% câu mở đầu** | MXH ít "dạ" vì là comment; nói trực tiếp với khách/người lớn vẫn dùng — nhưng giảm |
| `biểu` / `mần` / `hổm` | 2 / 0,4 / 0 | 3,5 / 0,7 / 0 | 1 / — / — | bỏ (mấy chữ `biểu` trong dataset phần lớn là "biểu tình") |

Từ cổ đếm trong toàn bộ câu người chơi (trừ anh Bảo): `nghen` 187 · `hổng` 151 · `coi` 78 · `bữa` 76 · `giùm` 60 · `chi` 53 · `thiệt` 46 · `vầy` 28 · `bữa nay` 24 · `chớ` 23 · `mạnh giỏi` 7 · `biểu` 2.

---

## 4. Bảng pattern theo tone

| Tone | Mở câu hay gặp | Từ đệm | Độ dài | Khuôn rút từ mẫu | Tránh |
|---|---|---|---|---|---|
| `AM` | Mời thẳng bằng động từ ("Ăn thử…", "Ghé…"), "Để em/con…" | `nha`, `nè` | 5–10 từ | Mời + một chi tiết thật (A1, A27) | sến, "quý khách" |
| `THUONG` | Hỏi thăm có chi tiết ("Chân còn nhức…"), "Không sao đâu" | `nha`, `á` | 5–10 | Hỏi thăm + việc làm được ngay | thương hại, giảng đạo |
| `DUA` | Phóng đại, hứa vui, tự giễu | `luôn`, `á`, `ha` | 5–12 | Đùa bằng sự thật lệch đi (A9–A11), tự giễu chuyện văn phòng (§2.D) | đùa ngoại hình, tuổi, vùng miền (A19–A24) |
| `LANH` | "Dạ.", "Thôi…", nói giá trơn | không có | 1–6 | Cụt, không giải thích | mỉa |
| `THANG` | Nêu sự thật trước: "Giá đó là…", "Em không…" | `nha` (để giữ mềm) | 6–12 | Không + lý do + đường khác (A26, S9 "muốn đổi cho đổi") | "mua thì mua" |
| `GAT` | Mệnh lệnh ngắn: "Tắt máy giùm em.", "Anh qua bên kia đi." | không | 3–8 | Dứt khoát, vẫn giữ xưng hô | chửi tục, mày tao, chê trình độ (A13–A25) |
| `CHUI` | "…gì mà…", "Tệ ghê" | `ghê`, `vậy trời` | 5–10 | Bênh người trước mặt, chửi người vắng mặt | tục |
| `NGAC_NHIEN` | "Ủa…", "Trời…" | `hả`, `lận` | 3–8 | Ủa + nhắc lại điều vừa nghe | "Cha!" |

**Cách lễ phép với người lớn mà vẫn trẻ** (rút từ A5, A26, S10, S12):

| Làm | Ví dụ khuôn |
|---|---|
| Gọi vai **một lần**, ở cuối câu | "… nha bà." (không "Bà … bà") |
| "Dạ" để **đáp lại**, không để mở mọi câu | "Dạ, con lấy liền." |
| Động từ hiện đại, kính ngữ nằm ở xưng hô | "Bà về cẩn thận nha bà" thay "đi mạnh giỏi" |
| Không tiếng Anh với người trên 60 | — |

---

## 5. Chỗ thiếu (chưa đạt chỉ tiêu skill)

| Thiếu | Lý do | Cách bù |
|---|---|---|
| TikTok (chủ quán nói với khách, livestream) | Cần đăng nhập/JS; tool Chrome **chưa kết nối** trong phiên này | Bật extension Claude in Chrome → chạy lại phần TikTok (40 mẫu) |
| Google Maps / ShopeeFood (chủ quán trả lời review) | Maps cần JS + trang consent; API ShopeeFood chặn bot (không vượt). Foody: quét 146 trang quán TP.HCM, **0** câu trả lời của chủ quán | Chrome: mở 10–15 quán bánh mì/ăn vặt trên Maps, đọc "Phản hồi của chủ sở hữu" |
| Facebook page/group quán nhỏ | Cần đăng nhập | Chrome |
| Threads (dân văn phòng than) | Threads chặn crawler của tool | Chrome; tạm dùng comment VnExpress (§2.D) |
| Voz | Cloudflare 403 | — |
| ≥ 30 mẫu **mỗi tình huống** | Chỉ đạt ở §2.D và dataset. A có 28 mẫu chung mọi tình huống; **hỏi thăm / an ủi chưa có mẫu chủ quán nào** | Như trên |
| Nguồn báo (S1–S14) | Phóng viên đã biên tập câu nói → giọng sạch hơn thực tế | Dùng cho **cấu trúc** (khuôn trả lời), không dùng cho từ đệm |

---

## 6. Từ cấm

| Nhóm | Từ | Lý do |
|---|---|---|
| Nam cổ | `nghen`, `nhen`, `hổng`, `chớ`, `biểu` (= bảo), `mần`, `đặng`, `hổm rày`, `mạnh giỏi`, `bữa nay`, `thiệt tình hổng biết`, `ăn nói chi kỳ`, `cha` (thán từ), `chi` (= gì) | 0 hoặc gần 0 trong dataset; phép thử 18–30 tuổi ở TP.HCM |
| Teencode viết | `khum`, `hok`, `dzậy`, `zậy`, `j`, `ko` | Đây là câu nói ra, không phải comment gõ |
| Trend chết nhanh | `6-7`, `ét o ét`, `xu cà na`, `mãi mận`, `chằm Zn`, `slay`, `ối dồi ôi`, "mời bạn lên núi" | Trend sống vài tháng (xem plan anh Bảo §3.1) |
| Lằn ranh repo | `chỉ là bán bánh mì`, `thoát khỏi`, `đổi đời` (`redlines.json` → demeaning) | Chê nghề bán bánh mì / chê văn phòng |
| Lint L008 (giọng Bắc) | `vào`, `mẹ`, `bố`, `mũ`, `bát`, `ngô`, `lạc`, `dứa` | Dùng `vô`, `má`, `ba`, `nón`, `chén`… (lưu ý: plan anh Bảo có "mẹ chuyển khoản" → sẽ dính L008) |
| Thái độ bị ném đá | "mua thì mua", "không ưng thì đừng mua", chê ngoại hình/chính tả khách, mày–tao với khách | §2.A, §2.C |
