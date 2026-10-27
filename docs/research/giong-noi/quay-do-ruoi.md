# Giọng chê quầy dơ, ruồi bay quanh thớt — research

> Dùng cho topic `ruoi` trong `src/content/reviews/lines.json` và mảng `say` của rule `gen.quaydo` (`src/content/rules/generic.json`).
> Viết lại theo pattern, **không chép nguyên văn**. Nền chung: `review-quan-an.md`.

## 1. Nguồn

Xem 2026-10-26 bằng Claude in Chrome, chỉ đọc. Bỏ hết tên, avatar, tag.

| Nền tảng | Cách tìm | Mẫu lấy |
|---|---|---|
| Google Maps | Ô "Tìm bài đánh giá" = `ruồi` trên quán đông review: Bánh Mì Như Lan; Cơm Tấm Sà Bì Chưởng (Trần Bình Trọng); ~10 quán bún bò Huế Q1/Q3/Q7/Q10/Tân Phú. Bánh mì Huỳnh Hoa, Bà Huynh, Chim Chạy, Mẹ Ỉn, Tăng, Minh Châu: 0 review nhắc ruồi | 14 |
| Facebook | Tìm bài `quán ăn dơ ruồi phốt`, `bánh mì có ruồi`, `ruồi nhặng thức ăn đường phố` → mở bình luận 2 bài phốt quán (84 và 23 bình luận) | 27 |
| Threads | Tìm `quán ăn ruồi bu`, `con ruồi`, `đồ ăn vỉa hè mất vệ sinh` → đọc trả lời dưới post `DCEutD4SMkO`, `DBA1cbsyUeb`, `DeTKfB8k997`, `DRT91xzjzoI` | 15 |
| TikTok | Trang tìm kiếm báo lỗi máy chủ — bỏ | 0 |

**Tổng 56 mẫu.** Tình huống 1 (review chê) dùng cả 56. Tình huống 2 (khách nhắc trực tiếp) chỉ có **~12 mẫu** đúng dạng lời nói với người bán (F3, F20–F27, T1, G11 và các câu kể lại lời khách) — **thiếu so với chuẩn 30**: trên mạng gần như không ai gõ lại câu mình nói với cô bán hàng. Phần thoại bù bằng giọng khách generic đã có trong `generic.json`.

Ghi chú tìm kiếm: Google Maps hiếm review nhắc ruồi ở tiệm bánh mì lớn (ruồi nằm nhiều ở review bún bò, cơm tấm). Threads tìm `ruồi` ra toàn `nốt ruồi` — phải lọc.

## 2. Mẫu đã ẩn danh

### Google Maps

| # | Sao | Mẫu (cắt gọn) |
|---|---|---|
| G1 | 5 | Góp ý: có ruồi trâu, quán tiêu diệt nha |
| G2 | 5 | dạo này bị xuất hiện ruồi vo ve khiến mình bị phân tâm tại lo đuổi ruồi ạ |
| G3 | 5 | ăn ngon … nhưng có điều khó chịu là con ruồi cứ vo ve trước mặt mãi. Ruồi dai như đỉa |
| G4 | 5 | có con ruồi bay vòng vòng ☺️, mà cơm vẫn ngon |
| G5 | 4 | có ruồi |
| G6 | 5 | có ruồi |
| G7 | 1 | lúc mình mua đã thấy có ruồi ở trong tủ rồi. Thực phẩm bây giờ nguy hiểm thật |
| G8 | 4 | Điểm trừ: - cơm đắt - vệ sinh hơi kém, có ruồi |
| G9 | 1 | bún cũ, có ruồi mà vẫn bưng cho khách |
| G10 | 5 | nhiều tiệm bún bò lại hơi dơ và có ruồi nên thường phải thấy sạch mới dám ăn |
| G11 | 1 | thấy có con ruồi chết trong tô. Gọi nhân viên ra hỏi, câu trả lời nhận được là "có khi con ruồi bay vô…" |
| G12 | 1 | ruồi bay tùm lum, đang ăn mà nhân viên ra bàn nói chuyện hô hố |
| G13 | 1 | một trải nghiệm thảm hoạ … nhìn quán cũng sạch sẽ ai ngờ chỉ là vỏ bọc |
| G14 | 1 | ruồi bu khá nhiều rất khó chịu. MỘT TRẢI NGHIỆM QUÁ TỆ |

### Facebook

| # | Mẫu |
|---|---|
| F1 | khiếp toàn trúng ruồi k à |
| F2 | rất giàu protein |
| F3 | ghê vậy à em |
| F4 | dính 1 lần r khiếp đen |
| F5 | tính ra quán này t có bh thấy ai ghé đâu kk |
| F6 | quán này bị phốt hoài luôn á. Kh hiểu sao cứ bán hoài |
| F7 | đạm đó chứ đâu haha |
| F8 | quán ni c ko khi nào mua cả |
| F9 | nơi này mua 1 lần ko có lần 2 |
| F10 | phải bà có quầy tủ nhôm nhìn bẩn bẩn kế bên nhà … k |
| F11 | mua lần sợ tới già |
| F12 | (kể dài) mua về ăn đi ngoài cả đêm … phốt miết |
| F13–F15 | ăn v nó mới béo ngậy · ngậy thật kkk · vừa ăn vừa lúc nhúc vui nhộn |
| F16 | quán nào v / quán mô rứa — hỏi địa chỉ để né, rất nhiều |
| F17 | (nhóm người bán) … xác định ngồi đuổi ruồi luôn ← nghĩa bóng **ế khách** |
| F18 | (nhóm người bán) có loại thuốc xịt ruồi nào công dụng tốt ko |
| F19 | vừa ăn mà ruồi nhặng bay vo ve quá trời lun nè :(( |
| F20 | (chủ quán) khách mua về chưa ăn thì đậy kĩ giúp e, nó chỉ cần vào 1 giây là cho 1 ổ |
| F21 | trứng ruồi này là do để không đậy |
| F22 | con ruồi nó bay ngang đậu vô cái là có liền. Nhiều khi khách k hiểu nói mình k vệ sinh |
| F23 | nay tới mùa ruồi đó e. Ở đâu cũng nhiều lắm |
| F24 | mới để con cá ra đó 30 giây là có. E đốt nhang muỗi liên tục |
| F25 | để thịt ra ngoài không che chắn là ruồi đậu vô đẻ |
| F26 | chị chịu khó lấy màng bọc kính lại là hết bị |
| F27 | một phút lơ là là bị liền |

### Threads

| # | Mẫu |
|---|---|
| T1 | (kể làm phục vụ) khách bảo "em ơi trong này khuyến mãi thêm thịt ruồi" … "có gì đâu, nhặt ra là đc. Lần sau chú ý nhá" |
| T2 | phát hiện ruồi trong nước uống bằng vị giác chứ không phải bằng thị giác |
| T3 | ăn … bị 1 con ruồi bay vào thoi đấy =)) |
| T4–T5 | (trả lời) thấy thằn lằn bò lên tường · bị gián bò lên chân |
| T6 | chạy grab, thấy rất nhiều quán mất vệ sinh vô cùng |
| T7 | cảm quan nhìn cũng sạch sẽ … quán vỉa hè sẽ ko tránh khỏi vụ vệ sinh |
| T8 | quán nào cũng như quán nấy, tự nấu ăn là lành nhất |
| T9 | nhè ra đen thui với mấy cái chân mà hãi điên luôn |
| T10–T14 | chắc do cốc đó chua rồi · topping ruồi · mỗi loại ruồi lại khác ha · \*nhăn mặt\* · khóc =)))) |
| T15 | chửi thề kèm `sợ` — ghi nhận, không dùng |

## 3. Pattern

| Trục | Người thật viết |
|---|---|
| **Cụm hay dùng** | `có ruồi`, `ruồi bu`, `ruồi bay tùm lum`, `vo ve`, `bay vòng vòng`, `đậu`, `không đậy`, `che chắn`, `dơ`, `bẩn bẩn`, `vệ sinh hơi kém`, `khiếp`, `ghê`, `hãi`, `né` |
| **Mức độ** | nhẹ: `có con ruồi bay vòng vòng, mà vẫn ngon` (4–5★) · vừa: `ruồi bu khá nhiều, khó chịu` · nặng: `ruồi bay tùm lum`, `bu đầy`, `có ruồi mà vẫn bưng cho khách` (1★) |
| **Cấu trúc** | (1) Cụt hai chữ: `có ruồi`. (2) Khen rồi bẻ: `ngon … nhưng con ruồi cứ vo ve`. (3) Liệt kê điểm trừ có số thứ tự. (4) Trách quán **thấy mà vẫn bán**: `có ruồi mà vẫn bưng cho khách` |
| **Hài / cà khịa** | Biến ruồi thành món: `giàu protein`, `đạm đó`, `topping ruồi`, `khuyến mãi thêm thịt ruồi`, `béo ngậy`. Tự giễu: `bị phân tâm vì lo đuổi ruồi` |
| **Hãm** | Hỏi địa chỉ để né, `mua 1 lần không có lần 2`, `bị phốt hoài mà vẫn bán`, chữ in hoa `QUÁ TỆ` |
| **Nhắc trực tiếp** (người bán ↔ khách) | Động từ ra lệnh nhẹ + vật cụ thể: `đậy kĩ`, `lấy màng bọc lại`, `che chắn`. Giải thích kiểu đồng cảm: `tới mùa ruồi`, `một phút lơ là là bị`. Nhắc kèm cười: `lần sau chú ý nhá`, `khuyến mãi thêm thịt ruồi` |
| **Teencode** | Gõ tắt nhanh (`k`, `r`, `bh`, `v`, `nch`), không teencode cute. Emoji ít: `:((`, `=))`, `🤡` |
| **Độ dài** | FB/Threads: 3–15 từ. Maps 1★: dài, kể lể. Maps 4–5★: một vế nhắc ruồi chen giữa lời khen |

Khác theo sao: 4–5★ nhắc ruồi như **góp ý** (`góp ý: có ruồi trâu, quán tiêu diệt nha`); 1★ nhắc như **bằng chứng** quán bẩn.

## 4. Từ cấm / tránh

- Chửi thề trong corpus (`đm`, `vc`, `cmn`, `duma`) — không dùng.
- `cứt` (T-reply) — thô, không dùng.
- `đuổi ruồi` một mình dễ hiểu thành **ế khách** (F17). Trong game chỉ dùng khi rõ nghĩa đen: `đuổi ruồi giùm quán`, `đuổi ruồi cái đi con, nó đậu nãy giờ`.
- `trứng ruồi`, `giòi`, `lúc nhúc` — quá ghê so với ruồi bay quanh thớt; để dành nếu có topic nặng hơn.
- `topping ruồi`, `khuyến mãi thêm thịt ruồi` — đúng giọng nhưng game không cho ruồi rơi vào ổ; dùng là kể sai chuyện.
- Giọng Nam cổ, teencode cute, giọng nhà văn: như `review-quan-an.md` §6.
- Từ giọng Bắc trong thoại (`vào`, `bát`…) — L008, dùng `vô`.

## 5. Đã viết

**`lines.json` → `loi.ruoi`** (topic thuộc `nghiem`, không chêm vế phụ):

| Giọng | Câu |
|---|---|
| chanthat | đứng chờ thấy ruồi bay quanh cái thớt, ăn cứ lấn cấn · khay nhân để không đậy, ruồi đậu lên mấy lần · có con ruồi đậu trên thớt mà chủ quán không để ý · quầy hơi dơ, ruồi bu chỗ khay nhân |
| ham | ruồi bu đầy thớt mà vẫn kẹp bánh bán, chịu luôn · nhìn ruồi đậu khay nhân vậy ai dám ăn, mọi người né ra · quầy dơ, ruồi bay tùm lum, vậy mà cũng bán được · vệ sinh kiểu này thì thua, khỏi quay lại |
| haihuoc | đứng chờ có mấy phút mà đuổi ruồi giùm quán mỏi tay · ruồi ở đây chắc cũng là khách quen |
| nhat | có ruồi · quầy dơ |

Cường độ: chanthat 1–3 con (`có con ruồi`, `đậu lên mấy lần`); ham 3–5 con (`bu đầy`, `tùm lum`).

**`ve.ruoi`**: có ruồi bay quanh thớt · quầy hơi nhiều ruồi · ruồi bu chỗ khay nhân

**`gen.quaydo.say`** (khách generic gọi `con`, không tự xưng để ai nói cũng khớp):
Con, hôm nay ruồi nhiều quá ha. · Quầy hơi dơ rồi á con, lau sơ cái đi. · Ủa, sao hôm nay bề bộn vậy con. · Lau cái thớt chút đi con. · Con ơi, ruồi đậu cái thớt kìa. · Đậy khay nhân lại đi con, ruồi bu kìa. · Đuổi ruồi cái đi con, nó đậu nãy giờ. · Mùa này ruồi dữ lắm, con đậy đồ lại nha. · Ủa con, ruồi nó đậu lên đồ kìa. · Ruồi bay quá trời, con có tấm lưới đậy chưa?
