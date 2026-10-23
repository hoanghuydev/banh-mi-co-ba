# Đánh giá — toàn bộ lời sẽ xuất hiện trong game

> File này **sinh tự động** từ `src/content/reviews/lines.json` — chạy `npm run dump:reviews`. Sửa nội dung thì sửa file JSON, đừng sửa file này.
> Giọng rút từ `docs/research/giong-noi/review-quan-an.md` (corpus 26.170 review quán ăn thật).

## Cách một đánh giá được ghép

```
[dẫn] + CÂU LÕI (tình huống × giọng) + [VẾ TRÁI CHIỀU] + [vế phụ] + [dấu persona] + [lời kết]
```

### Một lượt phục vụ có nhiều yếu tố thì sao

Game gom **tất cả** thứ đáng nhắc của lượt đó — cả điểm cộng lẫn điểm trừ — rồi:

1. **Vế chính** = yếu tố nặng nhất **cùng chiều với số sao**. Chấm ≥4★ thì mở bằng điểm cộng, ≤3★ thì mở bằng điểm trừ.
2. **Vế trái chiều** = lấy từ phía còn lại, nối bằng `mỗi tội` / `có điều` / `nhưng` / `mà` (khen rồi bẻ) hoặc `được cái` / `bù lại` (chê rồi vớt). Chỉ chen vào **45%** số lần — người thật không phải lúc nào cũng kể hết.

**Hai luật chặn mâu thuẫn:**

| Luật | Nghĩa |
|---|---|
| Đã nói ra một lời chê thì **không còn là 5★** | Không có chuyện "5★ — ngon, mà bánh sém một bên" |
| Trần sao tính trên **mọi** thứ đáng phàn nàn, không chỉ lỗi của ổ | Cho thêm nhân mà quên rửa tay vẫn **≤2★** |

Chuyện nặng tới mức nhắc điểm cộng là vô duyên — **chỉ một vế**, không trái chiều: `dau-bung` · `co-san`.
Cho thêm nhân rồi làm khách đau bụng thì review chỉ nói chuyện đau bụng.

Ví dụ thật do game sinh ra:

```
2★  gọi bánh mì đầy đủ, thấy chủ quán bốc đồ mà chưa rửa tay, ăn không yên tâm
2★  được cho thêm nhân nha mọi người, ưng cái bụng, mỗi tội cái vụ tay chưa rửa thì chịu
4★  vừa ăn vừa làm ly trà đá, đúng bài, mà nhân hơi ít
1★  mua bánh mì đầy đủ, ăn xong nằm cả ngày, mọi người đừng ghé
5★  bánh mì đầy đủ ở đây, có trà đá free nữa chứ, ưng quá, ai gần đây thì thử đi
```

| Mảnh | Khi nào có |
|---|---|
| dẫn | 18% |
| vế phụ | 35% nếu ≥4★, 60% nếu <4★ — bỏ nếu trùng ý câu lõi, hoặc tình huống nặng |
| dấu persona | 22% — bỏ nếu tình huống nặng |
| lời kết | 40% nếu ≥4★, 45% nếu <4★ |

Tình huống nặng (không chêm vế vặt): `dau-bung` · `co-san` · `do-cu` · `tay-ban` · `het-banh`.

Giọng **Nhạt** chỉ dùng mỗi câu lõi, không ghép gì thêm.

## Câu lõi theo tình huống — 172 câu

### Ổ ngon, không lỗi gì

*Kích hoạt khi:* Phục vụ không lỗi, khách chấm ≥4★

**Chân thật**

- bánh nóng giòn, pate thơm, ăn no tới trưa
- ổ chắc tay, nhân đầy đặn, rau tươi
- pate béo vừa, không bị ngấy
- bánh giòn vỏ mềm ruột, đúng kiểu mình thích
- ăn sáng ở đây mấy hôm rồi, hôm nào cũng đều tay

**Vui tính**

- ngon xỉu nha mọi người, 10 điểm
- ổ này đỉnh thật sự, cắn phát là biết liền
- trời ơi thơm quá trời, ăn hết sạch luôn
- hơi bị ngon á nha, chấm 10 điểm không có nhưng
- ngon quá nên mua luôn hai ổ, chốt đơn

**Hài hước**

- ăn xong đứng dậy thấy đời dễ thở hẳn
- định ăn một ổ, kết cục đứng ăn luôn ổ thứ hai
- cắn miếng đầu là biết hôm nay ngày đẹp trời
- ổ bánh này cứu cả buổi sáng deadline của tôi
- mua cho bạn một ổ rồi ăn mất, bạn tự hiểu

**Nhạt**

- ngon
- ổn
- được
- ngon, sạch
- ăn được

### Ổ không lỗi nhưng cũng không có gì hay

*Kích hoạt khi:* Không lỗi nhưng khách chấm 3★

**Chân thật**

- ăn tạm được, không có gì đặc biệt
- bình thường, giống mấy xe khác thôi
- cũng được nhưng chưa thấy có gì để nhớ
- ổn, không chê mà cũng không khen nổi

**Nhạt**

- bình thường
- cũng được
- tạm
- được của nó
- ok

**Hài hước**

- ăn xong quên mất mình vừa ăn gì
- không dở, mà kể lại cho bạn cũng không biết kể gì

### Chê giá đắt

*Kích hoạt khi:* Mốc giá **đắt** và khách chấm ≤3★

**Chân thật**

- ăn được nhưng giá hơi chát so với quanh đây
- ngon thật mà mắc, ổ này chừng đó là quá tay
- chất lượng ổn, mỗi tội giá cao hơn mặt bằng chung
- ổ bình thường mà tính giá như ổ đặc biệt

**Hài hước**

- nhìn giá xong tưởng mình gọi nhầm món hải sản
- ăn thì ngon, trả tiền thì hơi rát tay
- giá này chắc pate dát vàng

**Hãm**

- chặt chém vừa thôi, ổ bánh mì chứ có gì đâu
- giá kiểu này thì mọi người cân nhắc, quanh đây thiếu gì chỗ
- mắc mà chẳng hơn ai, phí tiền

**Nhạt**

- đắt
- mắc quá
- giá chát

### Khen giá rẻ

*Kích hoạt khi:* Mốc giá **rẻ** và khách chấm ≥4★

**Chân thật**

- giá mềm mà nhân vẫn đầy, hiếm đó
- rẻ hơn mấy chỗ gần đây mà ăn không thua
- giá sinh viên, no tới chiều

**Vui tính**

- ngon bổ rẻ, còn đòi gì nữa trời
- giá này mà chất lượng này thì ủng hộ dài dài nha
- rẻ muốn xỉu mà ăn ngon thiệt

**Hài hước**

- giá này thì tôi ăn cả tuần không chớp mắt

**Nhạt**

- rẻ, ngon
- giá ổn

### Chờ lâu mới tới lượt

*Kích hoạt khi:* Khách phải chờ qua 2 bậc kiên nhẫn trở lên

**Chân thật**

- bánh ngon mà chờ hơi lâu
- đứng chờ muốn trễ làm, mọi thứ còn lại thì ổn
- ngon nhưng mỗi tội đợi

**Hài hước**

- chờ lâu tới mức kịp đọc hết một chương truyện
- gọi xong chờ miết, tưởng quán đi xay bột luôn

**Hãm**

- chờ gần chết mới có ổ bánh, làm ăn kiểu gì vậy
- một ổ bánh mì mà để khách đứng như vậy thì thôi

**Nhạt**

- lâu
- chờ lâu

### Thiếu hẳn một thứ nhân khách gọi

*Kích hoạt khi:* `MISSING` — thiếu hẳn một nhân có trong món

**Chân thật**

- gọi có nhân mà mở ra thiếu, phải quay lại nói
- thiếu mất một thứ, dặn rõ ràng rồi mà
- mở ổ ra hụt hẫng, không đúng cái mình gọi

**Hãm**

- làm thiếu đồ cho khách, dặn cũng không thèm nghe
- thiếu nhân mà vẫn tính đủ tiền, hay thật

**Hài hước**

- mở ra tưởng đang chơi trò tìm điểm khác nhau

**Nhạt**

- thiếu nhân

### Bỏ thứ khách đã dặn bỏ ra, hoặc đưa nhầm ổ

*Kích hoạt khi:* `UNWANTED` — bỏ thêm thứ khách đã dặn bỏ

**Chân thật**

- gọi một đằng đưa một nẻo
- không phải ổ mình gọi, chắc lộn với khách khác
- bỏ thêm thứ mình đã dặn bỏ ra

**Hãm**

- làm sai món, nói lại thì tỉnh bơ
- nghe khách gọi mà làm cho đúng cũng không xong

**Hài hước**

- cắn miếng đầu là biết ổ này không dành cho mình

**Nhạt**

- sai món

### Có đủ nhân nhưng quá ít

*Kích hoạt khi:* `WRONG_RATIO` — lượng nhân lệch quá ngưỡng

**Chân thật**

- nhân lèo tèo, chủ yếu là bánh
- ít nhân quá, cắn ba miếng mới gặp thịt
- so với lần trước thì nhân mỏng hẳn

**Hãm**

- nhân có tí teo mà giá vẫn vậy, bớt lại từ từ ai cũng thấy
- ăn bánh không chứ nhân đâu

**Hài hước**

- pate mỏng tới mức phải soi đèn mới thấy

**Nhạt**

- ít nhân

### Ổ nguội

*Kích hoạt khi:* `WRONG_TEMP` — ổ nguội

**Chân thật**

- bánh nguội ngắt, ăn mất ngon
- ổ lạnh như để sẵn từ sớm
- giá mà nóng thì ngon hơn nhiều

**Hãm**

- bán bánh nguội cho khách, chán

**Hài hước**

- cầm ổ bánh mà tưởng cầm cục đá, ấm tay chút nữa thôi mà

**Nhạt**

- nguội

### Bánh nướng chưa tới

*Kích hoạt khi:* Vỏ bánh dưới ngưỡng chín của lò đang dùng

**Chân thật**

- vỏ chưa tới, cắn vào mềm oặt
- bánh nướng chưa đủ, ruột còn ỉu

**Hãm**

- bánh sống nhăn vậy mà cũng bán

**Hài hước**

- vỏ bánh mềm tới mức nghi ngờ cái lò có bật không

**Nhạt**

- bánh chưa chín

### Bánh nướng khét

*Kích hoạt khi:* Vỏ bánh trên ngưỡng sém của lò đang dùng

**Chân thật**

- vỏ cháy sém, ăn đắng miệng
- bánh khét một bên, phải gỡ bỏ

**Hãm**

- bánh khét thui mà vẫn gói cho khách

**Hài hước**

- ổ bánh này chắc vừa đi qua một mùa hè khắc nghiệt

**Nhạt**

- bánh khét

### Nhồi quá nhiều, rớt ra ngoài

*Kích hoạt khi:* `STUFFED` — quá sức chứa của ổ

**Chân thật**

- nhồi nhiều quá, cắn cái rớt hết ra ngoài
- đầy tới mức không gói nổi, ăn tèm lem

**Hài hước**

- nhân nhiều tới mức ăn xong phải lau bàn phím

**Nhạt**

- nhiều quá

### Nguyên liệu cũ, có mùi

*Kích hoạt khi:* `TASTE_OFF` — chất lượng nguyên liệu dưới ngưỡng khó tính của khách
*Trần sao:* tối đa **3★** — cho thêm nhân hay làm tốt chỗ khác cũng không kéo lên được.

**Chân thật**

- nhân không được tươi lắm
- pate nhạt hơn mấy lần trước
- rau hơi héo, chắc để từ sáng
- vị không bằng hôm trước

**Hãm**

- đồ để lâu rồi mà vẫn bán, chán
- nhân cũ thấy rõ, quán làm ăn kiểu gì

**Hài hước**

- nhân này chắc cũng có tuổi rồi

**Nhạt**

- nhân không tươi

### Ổ dính sạn / đồ đã rơi xuống đất

*Kích hoạt khi:* Ổ rơi xuống đất mà vẫn gói, và khách **không kịp thấy** (thấy thì họ từ chối nhận, không có đánh giá)
*Trần sao:* tối đa **2★** — cho thêm nhân hay làm tốt chỗ khác cũng không kéo lên được.

**Chân thật**

- cắn phải sạn, phải bỏ nửa ổ
- trong ổ có gì đó cứng cứng, ghê

**Hãm**

- ăn phải sạn, vệ sinh kiểu gì vậy
- đồ rơi xuống đất rồi vẫn gói cho khách thì thôi, mọi người tránh ra

### Khách thấy chủ quán chưa rửa tay

*Kích hoạt khi:* Khách quan sát tới mức `CONFIRMED` stimulus `DIRTY_HANDS`
*Trần sao:* tối đa **2★** — cho thêm nhân hay làm tốt chỗ khác cũng không kéo lên được.

**Chân thật**

- thấy chủ quán bốc đồ mà chưa rửa tay, ăn không yên tâm
- đứng chờ nhìn thấy tay chưa rửa đã cầm bánh luôn
- mong quán rửa tay trước khi bốc nhân

**Hãm**

- bốc đồ bằng tay trần vậy ai dám ăn
- vệ sinh kiểu này sớm muộn cũng có chuyện, mọi người tự cân nhắc

**Hài hước**

- nhìn chủ quán bốc nhân xong tôi thấy mình vừa tập thể dục cho hệ miễn dịch

**Nhạt**

- không rửa tay

### Khách bị người khác chen lên trước

*Kích hoạt khi:* Khách bị chen lượt (`wasCut`) và chấm ≤3★
*Chuyện bên lề:* chỉ chen vào 45% số lần đủ điều kiện.

**Chân thật**

- có người tới sau mà được lấy bánh trước, hơi kì
- đứng xếp hàng đàng hoàng mà bị chen, quán cũng không nói gì

**Hãm**

- ai chen cũng cho lấy trước, vậy xếp hàng chi
- quán nên để ý ai tới trước ai tới sau

**Hài hước**

- đứng xếp hàng ở đây cần thêm kỹ năng giữ chỗ

**Nhạt**

- bị chen hàng

### Loa rao mở to

*Kích hoạt khi:* `LOA_RAO` đang bật và khách chấm ≤3★
*Chuyện bên lề:* chỉ chen vào 45% số lần đủ điều kiện.

**Chân thật**

- bánh ổn mà cái loa rao to quá, đứng chờ nhức đầu
- loa mở lớn từ sáng, nhà bên chắc cũng mệt

**Hãm**

- mở loa inh ỏi cả xóm, bán buôn gì kì vậy

**Hài hước**

- cái loa rao thuộc bài hơn tôi thuộc bảng cửu chương

**Nhạt**

- loa ồn

### Khách được cho thêm nhân

*Kích hoạt khi:* Được cho thêm nhân (`freeExtra`) và khách chấm ≥4★
*Chuyện bên lề:* chỉ chen vào 45% số lần đủ điều kiện.

**Chân thật**

- được cho thêm miếng nhân mà không tính tiền, quý
- xin thêm chút nhân chủ quán cho liền, không khó chịu gì

**Vui tính**

- được cho thêm nhân nha mọi người, ưng cái bụng
- chủ quán hào phóng ghê, cho thêm mà cười tươi nữa

**Hài hước**

- xin thêm nhân mà được cho thiệt, hôm nay chắc trúng số

**Nhạt**

- được cho thêm nhân

### Khách được rót trà đá

*Kích hoạt khi:* Được rót trà đá (`visit.gaveTea`) và khách chấm ≥4★
*Chuyện bên lề:* chỉ chen vào 45% số lần đủ điều kiện.

**Chân thật**

- có trà đá miễn phí, đứng chờ đỡ khát
- uống ly trà đá trong lúc chờ, nhỏ mà dễ chịu

**Vui tính**

- có trà đá free nữa chứ, ưng quá
- vừa ăn vừa làm ly trà đá, đúng bài

**Hài hước**

- ly trà đá miễn phí làm tôi thấy mình quan trọng hẳn

**Nhạt**

- có trà đá

### Trời mưa mà quán vẫn mở

*Kích hoạt khi:* Thời tiết mưa rào / mưa dầm và khách chấm ≥4★
*Chuyện bên lề:* chỉ chen vào 45% số lần đủ điều kiện.

**Chân thật**

- mưa vậy mà quán vẫn mở, mua được ổ nóng là mừng
- trời mưa ghé đại, không ngờ bánh vẫn nóng giòn

**Vui tính**

- mưa gió mà vẫn đứng bán, thương quá trời
- ngày mưa có ổ bánh nóng là hết sầu

**Hài hước**

- đội mưa đi mua bánh, về tới nhà bánh còn khô hơn tôi

**Nhạt**

- mưa vẫn bán

### Quán vừa lắp đồ nghề mới

*Kích hoạt khi:* Có đơn đồ nghề đã lắp trong 3 ngày gần đây và khách chấm ≥4★
*Chuyện bên lề:* chỉ chen vào 45% số lần đủ điều kiện.

**Chân thật**

- quán mới sắm đồ, bánh ra giòn hơn hồi trước
- thấy quán thay đồ nghề mới, nhìn sạch sẽ hẳn

**Vui tính**

- quán nâng cấp rồi nha mọi người, ăn khác hẳn

**Hài hước**

- quán sắm đồ mới, ổ bánh cũng ra dáng hẳn

**Nhạt**

- quán có đồ mới

### Khách tới nơi thì hết bánh

*Kích hoạt khi:* Khách tới quầy mà kho hết bánh — đi qua `turnAway`, không có ổ nào được chấm
*Trần sao:* tối đa **3★** — cho thêm nhân hay làm tốt chỗ khác cũng không kéo lên được.

**Chân thật**

- tới nơi thì hết bánh, tiếc
- đi một đoạn tới nơi hết sạch, lần sau phải đi sớm
- hết bánh sớm quá, chưa kịp mua

**Hài hước**

- tới nơi thấy tấm bảng hết bánh, đứng hình mất mấy giây
- hết bánh rồi, về ăn mì gói, cũng là một loại trải nghiệm

**Hãm**

- bán có nhiêu đó rồi nghỉ, khách đi xa tới thì sao

**Nhạt**

- hết bánh

### Khách đau bụng sau khi ăn

*Kích hoạt khi:* Lăn trúng xác suất đau bụng của hàng dỏm trong ổ

**Chân thật**

- ăn sáng xong trưa ôm bụng, phải xin nghỉ nửa buổi
- về nhà là đau bụng, chắc chắn do ổ bánh này
- cả nhà ăn, cả nhà đau bụng

**Hãm**

- ăn xong nằm cả ngày, mọi người đừng ghé
- đồ không đảm bảo, tôi đi viện vì ổ bánh này
- bán đồ kiểu này là hại người, phải có ai xuống kiểm tra
- ôm bụng từ trưa tới tối, không bao giờ quay lại

**Hài hước**

- ổ bánh 20k, tiền thuốc 200k, lời to

**Nhạt**

- ăn xong đau bụng

## Mảnh ghép thêm

### Dẫn

*Chèn trước câu lõi, 18%. `{mon}` thay bằng tên món.*

- ăn {mon}
- gọi {mon}
- mua {mon}
- {mon} ở đây

### Từ nối — khen rồi bẻ

*Câu lõi là điểm cộng, vế sau là điểm trừ.*

- mỗi tội
- có điều
- nhưng
- mà

### Từ nối — chê rồi vớt

*Câu lõi là điểm trừ, vế sau là điểm cộng.*

- được cái
- bù lại
- mà

### Vế trái chiều — dạng rút gọn của từng tình huống

*Dùng làm vế thứ hai khi một lượt phục vụ có cả hai chiều.*

| Tình huống | Các cách nói |
|---|---|
| Ổ ngon, không lỗi gì | bánh thì ngon · ăn thì được · vị thì ổn |
| Khen giá rẻ | giá thì mềm · được cái rẻ |
| Khách được cho thêm nhân | được cho thêm nhân · chủ quán cho thêm nhân |
| Khách được rót trà đá | có trà đá free · được rót ly trà đá |
| Trời mưa mà quán vẫn mở | mưa vậy mà vẫn mở · ngày mưa còn có chỗ mua |
| Quán vừa lắp đồ nghề mới | quán mới sắm đồ · đồ nghề nhìn mới |
| Chê giá đắt | giá hơi chát · mắc hơn quanh đây |
| Chờ lâu mới tới lượt | chờ hơi lâu · đợi muốn trễ giờ |
| Thiếu hẳn một thứ nhân khách gọi | thiếu mất một thứ · hụt mất món đã dặn |
| Bỏ thứ khách đã dặn bỏ ra, hoặc đưa nhầm ổ | làm sai món · không đúng ổ mình gọi |
| Có đủ nhân nhưng quá ít | nhân hơi ít · nhân mỏng |
| Ổ nguội | ổ hơi nguội · bánh nguội |
| Bánh nướng chưa tới | vỏ chưa tới · bánh nướng chưa đủ |
| Bánh nướng khét | vỏ hơi khét · bánh sém một bên |
| Nhồi quá nhiều, rớt ra ngoài | nhồi hơi nhiều · kẹp đầy quá rớt ra ngoài |
| Nguyên liệu cũ, có mùi | nhân không tươi lắm · vị không bằng hôm trước |
| Khách thấy chủ quán chưa rửa tay | thấy không rửa tay · cái vụ tay chưa rửa thì chịu |
| Khách bị người khác chen lên trước | bị chen hàng · người tới sau lấy trước |
| Loa rao mở to | cái loa ồn quá · loa rao nhức đầu |
| Khách tới nơi thì hết bánh | hết bánh sớm · tới nơi là hết |

### Vế phụ — khi khen

*Nối sau câu lõi bằng dấu phẩy.*

- rau giòn
- đồ chua vừa miệng
- chủ quán vui vẻ
- gói kỹ, cầm đi đường không rớt
- chỗ đứng chờ sạch sẽ
- ra bánh nhanh
- tương ớt đậm đà

### Vế phụ — khi chê

*Nối sau câu lõi bằng dấu phẩy.*

- chờ hơi lâu
- chỗ đứng chật
- gói sơ sài
- không có chỗ để xe
- rau hơi ít
- giá nhỉnh hơn quanh đây

### Lời kết — ≥4★

*Câu chốt cuối đánh giá.*

- sẽ quay lại
- ủng hộ quán dài dài
- recommend nha mọi người
- mai ghé nữa
- ai gần đây thì thử đi

### Lời kết — 3★

*Câu chốt cuối đánh giá.*

- chắc có dịp ghé lại
- mong quán làm đều tay hơn
- lần sau thử món khác xem sao

### Lời kết — ≤2★

*Câu chốt cuối đánh giá.*

- không quay lại nữa
- mọi người cân nhắc
- thất vọng
- lần sau chắc đi chỗ khác
- mong quán xem lại

### Dấu persona — sinhvien

*Chèn cuối, cho biết người viết là ai.*

- hợp túi tiền sinh viên
- sáng nào đi học cũng ghé
- rẻ là mua

### Dấu persona — vanphong

*Chèn cuối, cho biết người viết là ai.*

- mua mang lên công ty
- ăn vội trước giờ họp
- cả phòng đặt một lượt

### Dấu persona — colon

*Chèn cuối, cho biết người viết là ai.*

- bác bán hàng nhanh nhẹn
- người lớn tuổi ăn thấy vừa miệng
- giá vậy là được

### Dấu persona — reviewer

*Chèn cuối, cho biết người viết là ai.*

- chấm 8/10
- điểm cộng cho phần nhân
- điểm trừ nhỏ thôi
- mình ăn qua kha khá quán bánh mì rồi

### Dấu persona — khachquen

*Chèn cuối, cho biết người viết là ai.*

- khách quen mấy tháng nay
- tuần nào cũng ghé
- ăn từ hồi quán mới mở

## Đánh giá không đến từ khách thật

| Nguồn | Tỉ lệ trên tổng đánh giá | Số sao |
|---|---|---|
| Nhầm quán hủ tiếu kế bên | 2% | 1–3★ |
| Chủ xe bánh mì đối thủ chơi xấu | 5%, chỉ sau khi quán có ≥20 đánh giá | 1–2★ |
| Spam / lạc đề | 1% | ngẫu nhiên |
| Tình huống hiếm | 1% | 4–5★ |
| Chỉ sao, không chữ | 18% số đánh giá thật | theo lượt phục vụ |

### Nhầm quán hủ tiếu

*Nói về món không có trên menu — dấu hiệu nhận ra.*

- hủ tiếu nước lạt, tô nhỏ mà tính giá cao
- tô hủ tiếu ít thịt quá, nước dùng nhạt
- quán hủ tiếu này dọn chậm, ngồi chờ muốn xỉu
- ăn hủ tiếu ở đây thấy bình thường, không bằng chỗ cũ
- gọi tô đặc biệt mà có mấy lát thịt

### Đối thủ chơi xấu

*Chê chung chung, không chi tiết cụ thể — dấu hiệu nhận ra.*

- dở, mọi người đừng ăn
- không ra gì, tránh ra
- quán này không nên tồn tại
- ăn một lần là tởn tới già
- tệ nhất khu này

### Spam / lạc đề

**

- tốt
- đẹp
- được
- hay
- ok
- 👍
- ai cần đổ mực máy in liên hệ mình nha
- cho mình hỏi quán mấy giờ đóng cửa ạ
- quán có tuyển người phụ không
- ad ơi inbox mình cái

### Tình huống hiếm

*Phần thưởng cho người chơi lâu.*

- đang ăn thì gặp lại bạn cấp ba cũng đang đứng mua, tự nhiên thấy vui
- ông chú trước mặt mua giùm luôn ổ của mình rồi đi mất, chưa kịp cảm ơn
- mua ổ bánh mà được nghe hết một bản bolero từ loa nhà bên, trọn vẹn
- con mèo quán bên cứ ngồi nhìn mình ăn, áy náy ghê
- trời mưa, đứng trú chờ bánh, thấy cũng đáng

### Tên người viết (35)

*Dùng cho đánh giá nhiễu; đánh giá thật lấy tên khách đã phục vụ.*

- Ngọc Hân
- Trần Minh Quân
- Thu Hà
- Phạm Tuấn
- Linh Nhi
- Bảo Trân
- Nguyễn Văn Đức
- Mỹ Duyên
- Hoàng Nam
- Thanh Tùng
- Kim Chi
- Lê Quốc Thịnh
- Hà Vy
- Trọng Nghĩa
- Phương Uyên
- Đặng Hải
- Tú Anh
- Vũ Khánh Linh
- bé Mít
- Tâm Như
- Quang Huy
- Diễm My
- chú Tư
- cô Lan
- Thắng Nguyễn
- Ngân Giang
- Huỳnh Phát
- Trúc Quỳnh
- Đỗ Gia Bảo
- Mai Anh
- hungnguyen2k
- minhthu.ng
- Tèo Sài Gòn
- Ăn Gì Hôm Nay
- Review Dạo

## Còn thiếu

Hai thứ **cố ý chưa làm**, để R5 chốt cùng mô phỏng:

- Đánh giá nhắc tới mốc truyện (quán lên tin tức, sếp cũ vào mỉa).
- Đánh giá đổi giọng theo quy mô quán (quán nhỏ khác quán đã có tiếng).

