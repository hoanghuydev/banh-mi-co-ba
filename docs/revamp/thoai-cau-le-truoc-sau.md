# Thoại câu lẻ — trước / sau

> R6.15. Gồm `lines/generic.json`, `lines/tam.json`, `reviews/lines.json` (rà giọng, sửa tối thiểu). **In đậm = có đổi.** Câu giữ nguyên vẫn liệt kê.
> Bỏ qua: `_note`, mảng `ids`/`ky`/`nghiem` (id, khoá khớp), `ten` (tên người đăng). Placeholder `{mon}` `{me}` `{call}` `{you}` giữ nguyên.

> Tổng **410** câu · đổi **7** · giữ **403**.

> - `lines/generic.json`: 87 câu · đổi 5
> - `lines/tam.json`: 32 câu · đổi 1
> - `reviews/lines.json`: 291 câu · đổi 1


### lines/generic.json · `pools[0]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `pools[0]/id` | promiseKept | giữ |
| `pools[0]/vars[0]` | mon | giữ |
| `pools[0]/variants[0]` | Ờ, có bỏ thiệt nha. Cảm ơn con. | giữ |
| `pools[0]/variants[1]` | Con nói sao làm vậy. Hiếm à nha. | giữ |
| `pools[0]/variants[2]` | Có {mon} nè. Ờ. | giữ |
| `pools[0]/variants[3]` | Vậy mới nói chuyện được. | giữ |

### lines/generic.json · `pools[1]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `pools[1]/id` | promiseBroken | giữ |
| `pools[1]/vars[0]` | mon | giữ |
| `pools[1]/variants[0]` | Ủa… hồi nãy nói có {mon} mà. | giữ |
| `pools[1]/variants[1]` | Thôi khỏi. Mà lần sau đừng hứa. | giữ |
| `pools[1]/variants[2]` | Hứa rồi quên hả. Ờ. | giữ |
| `pools[1]/variants[3]` | Nói thì dễ hả con. | giữ |

### lines/generic.json · `pools[2]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `pools[2]/id` | promiseWrong | giữ |
| `pools[2]/vars[0]` | mon | giữ |
| `pools[2]/variants[0]` | Cái này đâu phải {mon}. | giữ |
| `pools[2]/variants[1]` | Ủa, nói {mon} mà sao cái này. | giữ |
| `pools[2]/variants[2]` | Thôi cũng được. Mà đâu phải thứ con nói. | giữ |
| `pools[2]/variants[3]` | Con bỏ nhầm rồi. | giữ |

### lines/generic.json · `pools[3]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `pools[3]/id` | chaoNhau | giữ |
| `pools[3]/variants[0]` | Đi đâu đó? | giữ |
| `pools[3]/variants[1]` | Ăn gì chưa đó? | giữ |
| `pools[3]/variants[2]` | Nắng dữ ha. | giữ |
| `pools[3]/variants[3]` | Lâu quá không thấy mặt. | giữ |
| `pools[3]/variants[4]` | Đi chợ hả? | giữ |
| `pools[3]/variants[5]` | Ủa. Đi lối này gì vậy? | giữ |
| `pools[3]/variants[6]` | Khoẻ không? | giữ |
| `pools[3]/variants[7]` | Nay rảnh dữ ta. | giữ |
| `pools[3]/variants[8]` | Về sớm dữ. | giữ |
| `pools[3]/variants[9]` | Trời này đi đứng cực thấy mồ. | **Trời này đi đứng cực quá.** |
| `pools[3]/variants[10]` | Chút ghé chơi nha. | giữ |
| `pools[3]/variants[11]` | Chèn ơi. Lâu quá. | giữ |

### lines/generic.json · `pools[4]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `pools[4]/id` | chaoDap | giữ |
| `pools[4]/variants[0]` | Đi chút hà. | **Đi chút thôi.** |
| `pools[4]/variants[1]` | Rồi rồi. | giữ |
| `pools[4]/variants[2]` | Nắng muốn xỉu. | giữ |
| `pools[4]/variants[3]` | Ờ hen. | **Ờ nhỉ.** |
| `pools[4]/variants[4]` | Có chút chuyện. | giữ |
| `pools[4]/variants[5]` | Bận quá trời. | giữ |
| `pools[4]/variants[6]` | Thường thôi hà. | **Thường thôi.** |
| `pools[4]/variants[7]` | Cũng vậy hà. | **Cũng vậy thôi.** |
| `pools[4]/variants[8]` | Ừa. Thôi đi nha. | giữ |
| `pools[4]/variants[9]` | Chút nữa ghé. | giữ |

### lines/generic.json · `pools[5]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `pools[5]/id` | extraOffer | giữ |
| `pools[5]/vars[0]` | mon | giữ |
| `pools[5]/vars[1]` | me | giữ |
| `pools[5]/vars[2]` | call | giữ |
| `pools[5]/variants[0]` | {me} thêm {mon} cho {call} nè. | giữ |
| `pools[5]/variants[1]` | Có thêm {mon} nha {call}. | giữ |
| `pools[5]/variants[2]` | Thêm {mon} cho {call}, {me} mời. | giữ |
| `pools[5]/variants[3]` | {me} bỏ thêm {mon} cho {call} rồi nha. | giữ |
| `pools[5]/variants[4]` | Hôm nay {mon} ngon, {me} thêm cho {call} á. | giữ |
| `pools[5]/variants[5]` | Tặng {call} thêm {mon} nè. | giữ |
| `pools[5]/en[0]` | Added some extra {mon} for you. | giữ |
| `pools[5]/en[1]` | Hey, I put in a bit more {mon}. | giữ |
| `pools[5]/en[2]` | Extra {mon} for you there. | giữ |
| `pools[5]/en[3]` | Giving you some extra {mon}. | giữ |
| `pools[5]/en[4]` | Got {mon} today, so I added some. | giữ |
| `pools[5]/en[5]` | Here, a little extra {mon}. | giữ |

### lines/generic.json · `pools[6]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `pools[6]/id` | thanksExtra | giữ |
| `pools[6]/vars[0]` | you | giữ |
| `pools[6]/variants[0]` | Ờ, cảm ơn {you} nha. | giữ |
| `pools[6]/variants[1]` | Cảm ơn {you}. | giữ |
| `pools[6]/variants[2]` | Ừ, {you} có lòng. | giữ |
| `pools[6]/variants[3]` | Chà, có thêm. Cảm ơn. | giữ |
| `pools[6]/variants[4]` | Thôi được, cảm ơn nha. | giữ |
| `pools[6]/variants[5]` | Biết {you} thương. | giữ |
| `pools[6]/en[0]` | Thanks for that. | giữ |
| `pools[6]/en[1]` | Thank you. | giữ |
| `pools[6]/en[2]` | That's kind of you. | giữ |
| `pools[6]/en[3]` | Oh, extra. Thank you. | giữ |
| `pools[6]/en[4]` | All right, thank you. | giữ |
| `pools[6]/en[5]` | I know you mean well. | giữ |

### lines/generic.json · `pools[7]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `pools[7]/id` | crustTail | giữ |
| `pools[7]/vars[0]` | mon | giữ |
| `pools[7]/vars[1]` | you | giữ |
| `pools[7]/variants[0]` | Với lại ổ {mon} rồi nè {you}. | giữ |
| `pools[7]/variants[1]` | Mà ổ bánh {mon} nữa đó. | giữ |
| `pools[7]/variants[2]` | Với lại cái vỏ {mon} nha. | giữ |
| `pools[7]/variants[3]` | Ổ này {mon} nữa nha. | giữ |
| `pools[7]/variants[4]` | Mà {mon} nữa nè {you}. | giữ |
| `pools[7]/variants[5]` | Với lại hôm nay ổ {mon} à. | giữ |
| `pools[7]/en[0]` | And the loaf's off, too. | giữ |
| `pools[7]/en[1]` | Plus the bread isn't right. | giữ |
| `pools[7]/en[2]` | And the crust, too. | giữ |
| `pools[7]/en[3]` | This one's off as well. | giữ |
| `pools[7]/en[4]` | And that too, dear. | giữ |
| `pools[7]/en[5]` | The loaf's like that today, too. | giữ |

### lines/tam.json · `canh[0]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `canh[0][0]` | Chị mua cá ở sạp nào mà tươi vậy? | giữ |
| `canh[0][1]` | Sạp đầu chợ Vườn Chuối đó. Mà phải đi trước bảy giờ. | giữ |
| `canh[0][2]` | Bảy giờ tui còn chưa dậy nổi. | giữ |
| `canh[0][3]` | Thì ăn cá ươn thôi chứ sao giờ. | giữ |

### lines/tam.json · `canh[1]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `canh[1][0]` | Ê, con nhỏ nhà bà thi đậu chưa? | giữ |
| `canh[1][1]` | Đậu rồi! Mà trường xa quá, nó phải ở trọ. | giữ |
| `canh[1][2]` | Xa cũng được. Miễn là đậu. | giữ |
| `canh[1][3]` | Ừ… mà nhà vắng ghê lắm chị ơi. | giữ |

### lines/tam.json · `canh[2]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `canh[2][0]` | Tháng này tiền điện nhà chị nhiêu? | giữ |
| `canh[2][1]` | Tám trăm. Tui nhìn cái hoá đơn tui muốn xỉu. | giữ |
| `canh[2][2]` | Nhà tui chín trăm lận. Cái máy lạnh đó. | giữ |
| `canh[2][3]` | Thì tắt bớt đi. Nóng chút cũng không chết ai. | giữ |

### lines/tam.json · `canh[3]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `canh[3][0]` | Cái hẻm mình sắp làm lại đường hả anh? | giữ |
| `canh[3][1]` | Nghe nói vậy. Mà nghe từ năm ngoái rồi. | giữ |
| `canh[3][2]` | Làm thiệt thì tui dọn hàng đi đâu. | giữ |
| `canh[3][3]` | Thì tính sau. Chưa chắc đã làm. | giữ |

### lines/tam.json · `canh[4]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `canh[4][0]` | Bà có thấy ông Tư dạo này ốm hẳn đi không? | giữ |
| `canh[4][1]` | Thấy chứ. Nghe nói bả nằm viện cả tháng. | **Thấy chứ. Nghe nói ổng nằm viện cả tháng.** |
| `canh[4][2]` | Trời. Vậy mà ổng không nói gì hết. | giữ |
| `canh[4][3]` | Đàn ông mà. Có gì cũng nuốt vô trong. | giữ |

### lines/tam.json · `canh[5]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `canh[5][0]` | Nay chị đi sớm dữ ha. | giữ |
| `canh[5][1]` | Đi gửi tiền cho thằng con ngoài Huế. Nó kêu hết tiền trọ. | giữ |
| `canh[5][2]` | Tháng nào cũng gửi hả chị? | giữ |
| `canh[5][3]` | Tháng nào cũng gửi. Mà nó có gọi về đâu. | giữ |

### lines/tam.json · `canh[6]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `canh[6][0]` | Chị ơi chợ hôm nay có bán đồ cúng chưa? | giữ |
| `canh[6][1]` | Có rồi. Mà mắc hơn năm ngoái gần gấp rưỡi. | giữ |
| `canh[6][2]` | Cái gì cũng mắc. Chỉ có tiền là không lên. | giữ |
| `canh[6][3]` | Thôi, có sao cúng vậy. Ông bà không rầy đâu. | giữ |

### lines/tam.json · `canh[7]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `canh[7][0]` | Ê bà, cái tiệm sửa xe góc kia dẹp rồi hả? | giữ |
| `canh[7][1]` | Dẹp rồi. Ông Chín về quê nuôi cháu. | giữ |
| `canh[7][2]` | Vậy xe hư biết đem đâu. | giữ |
| `canh[7][3]` | Ra ngoài đường lớn. Mắc gấp đôi đó nha. | giữ |

### reviews/lines.json · `loi/ngon`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `loi/ngon/chanthat[0]` | bánh nóng giòn, pate thơm, ăn no tới trưa | giữ |
| `loi/ngon/chanthat[1]` | ổ chắc tay, nhân đầy đặn, rau tươi | giữ |
| `loi/ngon/chanthat[2]` | pate béo vừa, không bị ngấy | giữ |
| `loi/ngon/chanthat[3]` | bánh giòn vỏ mềm ruột, đúng kiểu mình thích | giữ |
| `loi/ngon/chanthat[4]` | ăn sáng ở đây mấy hôm rồi, hôm nào cũng đều tay | giữ |
| `loi/ngon/vuitinh[0]` | ngon xỉu nha mọi người, 10 điểm | giữ |
| `loi/ngon/vuitinh[1]` | ổ này đỉnh thật sự, cắn phát là biết liền | giữ |
| `loi/ngon/vuitinh[2]` | trời ơi thơm quá trời, ăn hết sạch luôn | giữ |
| `loi/ngon/vuitinh[3]` | hơi bị ngon á nha, chấm 10 điểm không có nhưng | giữ |
| `loi/ngon/vuitinh[4]` | ngon quá nên mua luôn hai ổ, chốt đơn | giữ |
| `loi/ngon/haihuoc[0]` | ăn xong đứng dậy thấy đời dễ thở hẳn | giữ |
| `loi/ngon/haihuoc[1]` | định ăn một ổ, kết cục đứng ăn luôn ổ thứ hai | giữ |
| `loi/ngon/haihuoc[2]` | cắn miếng đầu là biết hôm nay ngày đẹp trời | giữ |
| `loi/ngon/haihuoc[3]` | ổ bánh này cứu cả buổi sáng deadline của tôi | giữ |
| `loi/ngon/haihuoc[4]` | mua cho bạn một ổ rồi ăn mất, bạn tự hiểu | giữ |
| `loi/ngon/nhat[0]` | ngon | giữ |
| `loi/ngon/nhat[1]` | ổn | giữ |
| `loi/ngon/nhat[2]` | được | giữ |
| `loi/ngon/nhat[3]` | ngon, sạch | giữ |
| `loi/ngon/nhat[4]` | ăn được | giữ |

### reviews/lines.json · `loi/nhat-nheo`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `loi/nhat-nheo/chanthat[0]` | ăn tạm được, không có gì đặc biệt | giữ |
| `loi/nhat-nheo/chanthat[1]` | bình thường, giống mấy xe khác thôi | giữ |
| `loi/nhat-nheo/chanthat[2]` | cũng được nhưng chưa thấy có gì để nhớ | giữ |
| `loi/nhat-nheo/chanthat[3]` | ổn, không chê mà cũng không khen nổi | giữ |
| `loi/nhat-nheo/nhat[0]` | bình thường | giữ |
| `loi/nhat-nheo/nhat[1]` | cũng được | giữ |
| `loi/nhat-nheo/nhat[2]` | tạm | giữ |
| `loi/nhat-nheo/nhat[3]` | được của nó | giữ |
| `loi/nhat-nheo/nhat[4]` | ok | giữ |
| `loi/nhat-nheo/haihuoc[0]` | ăn xong quên mất mình vừa ăn gì | giữ |
| `loi/nhat-nheo/haihuoc[1]` | không dở, mà kể lại cho bạn cũng không biết kể gì | giữ |

### reviews/lines.json · `loi/gia-dat`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `loi/gia-dat/chanthat[0]` | ăn được nhưng giá hơi chát so với quanh đây | giữ |
| `loi/gia-dat/chanthat[1]` | ngon thật mà mắc, ổ này chừng đó là quá tay | giữ |
| `loi/gia-dat/chanthat[2]` | chất lượng ổn, mỗi tội giá cao hơn mặt bằng chung | giữ |
| `loi/gia-dat/chanthat[3]` | ổ bình thường mà tính giá như ổ đặc biệt | giữ |
| `loi/gia-dat/haihuoc[0]` | nhìn giá xong tưởng mình gọi nhầm món hải sản | giữ |
| `loi/gia-dat/haihuoc[1]` | ăn thì ngon, trả tiền thì hơi rát tay | giữ |
| `loi/gia-dat/haihuoc[2]` | giá này chắc pate dát vàng | giữ |
| `loi/gia-dat/ham[0]` | chặt chém vừa thôi, ổ bánh mì chứ có gì đâu | giữ |
| `loi/gia-dat/ham[1]` | giá kiểu này thì mọi người cân nhắc, quanh đây thiếu gì chỗ | giữ |
| `loi/gia-dat/ham[2]` | mắc mà chẳng hơn ai, phí tiền | giữ |
| `loi/gia-dat/nhat[0]` | đắt | giữ |
| `loi/gia-dat/nhat[1]` | mắc quá | giữ |
| `loi/gia-dat/nhat[2]` | giá chát | giữ |

### reviews/lines.json · `loi/gia-re`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `loi/gia-re/chanthat[0]` | giá mềm mà nhân vẫn đầy, hiếm đó | giữ |
| `loi/gia-re/chanthat[1]` | rẻ hơn mấy chỗ gần đây mà ăn không thua | giữ |
| `loi/gia-re/chanthat[2]` | giá sinh viên, no tới chiều | giữ |
| `loi/gia-re/vuitinh[0]` | ngon bổ rẻ, còn đòi gì nữa trời | giữ |
| `loi/gia-re/vuitinh[1]` | giá này mà chất lượng này thì ủng hộ dài dài nha | giữ |
| `loi/gia-re/vuitinh[2]` | rẻ muốn xỉu mà ăn ngon thiệt | giữ |
| `loi/gia-re/haihuoc[0]` | giá này thì tôi ăn cả tuần không chớp mắt | giữ |
| `loi/gia-re/nhat[0]` | rẻ, ngon | giữ |
| `loi/gia-re/nhat[1]` | giá ổn | giữ |

### reviews/lines.json · `loi/cho-lau`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `loi/cho-lau/chanthat[0]` | bánh ngon mà chờ hơi lâu | giữ |
| `loi/cho-lau/chanthat[1]` | đứng chờ muốn trễ làm, mọi thứ còn lại thì ổn | giữ |
| `loi/cho-lau/chanthat[2]` | ngon nhưng mỗi tội đợi | giữ |
| `loi/cho-lau/haihuoc[0]` | chờ lâu tới mức kịp đọc hết một chương truyện | giữ |
| `loi/cho-lau/haihuoc[1]` | gọi xong chờ miết, tưởng quán đi xay bột luôn | giữ |
| `loi/cho-lau/ham[0]` | chờ gần chết mới có ổ bánh, làm ăn kiểu gì vậy | giữ |
| `loi/cho-lau/ham[1]` | một ổ bánh mì mà để khách đứng như vậy thì thôi | giữ |
| `loi/cho-lau/nhat[0]` | lâu | giữ |
| `loi/cho-lau/nhat[1]` | chờ lâu | giữ |

### reviews/lines.json · `loi/thieu-nhan`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `loi/thieu-nhan/chanthat[0]` | gọi có nhân mà mở ra thiếu, phải quay lại nói | giữ |
| `loi/thieu-nhan/chanthat[1]` | thiếu mất một thứ, dặn rõ ràng rồi mà | giữ |
| `loi/thieu-nhan/chanthat[2]` | mở ổ ra hụt hẫng, không đúng cái mình gọi | giữ |
| `loi/thieu-nhan/ham[0]` | làm thiếu đồ cho khách, dặn cũng không thèm nghe | giữ |
| `loi/thieu-nhan/ham[1]` | thiếu nhân mà vẫn tính đủ tiền, hay thật | giữ |
| `loi/thieu-nhan/haihuoc[0]` | mở ra tưởng đang chơi trò tìm điểm khác nhau | giữ |
| `loi/thieu-nhan/nhat[0]` | thiếu nhân | giữ |

### reviews/lines.json · `loi/sai-mon`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `loi/sai-mon/chanthat[0]` | gọi một đằng đưa một nẻo | giữ |
| `loi/sai-mon/chanthat[1]` | không phải ổ mình gọi, chắc lộn với khách khác | giữ |
| `loi/sai-mon/chanthat[2]` | bỏ thêm thứ mình đã dặn bỏ ra | giữ |
| `loi/sai-mon/ham[0]` | làm sai món, nói lại thì tỉnh bơ | giữ |
| `loi/sai-mon/ham[1]` | nghe khách gọi mà làm cho đúng cũng không xong | giữ |
| `loi/sai-mon/haihuoc[0]` | cắn miếng đầu là biết ổ này không dành cho mình | giữ |
| `loi/sai-mon/nhat[0]` | sai món | giữ |

### reviews/lines.json · `loi/it-nhan`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `loi/it-nhan/chanthat[0]` | nhân lèo tèo, chủ yếu là bánh | giữ |
| `loi/it-nhan/chanthat[1]` | ít nhân quá, cắn ba miếng mới gặp thịt | giữ |
| `loi/it-nhan/chanthat[2]` | so với lần trước thì nhân mỏng hẳn | giữ |
| `loi/it-nhan/ham[0]` | nhân có tí teo mà giá vẫn vậy, bớt lại từ từ ai cũng thấy | giữ |
| `loi/it-nhan/ham[1]` | ăn bánh không chứ nhân đâu | giữ |
| `loi/it-nhan/haihuoc[0]` | pate mỏng tới mức phải soi đèn mới thấy | giữ |
| `loi/it-nhan/nhat[0]` | ít nhân | giữ |

### reviews/lines.json · `loi/nguoi`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `loi/nguoi/chanthat[0]` | bánh nguội ngắt, ăn mất ngon | giữ |
| `loi/nguoi/chanthat[1]` | ổ lạnh như để sẵn từ sớm | giữ |
| `loi/nguoi/chanthat[2]` | giá mà nóng thì ngon hơn nhiều | giữ |
| `loi/nguoi/ham[0]` | bán bánh nguội cho khách, chán | giữ |
| `loi/nguoi/haihuoc[0]` | cầm ổ bánh mà tưởng cầm cục đá, ấm tay chút nữa thôi mà | giữ |
| `loi/nguoi/nhat[0]` | nguội | giữ |

### reviews/lines.json · `loi/banh-song`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `loi/banh-song/chanthat[0]` | vỏ chưa tới, cắn vào mềm oặt | giữ |
| `loi/banh-song/chanthat[1]` | bánh nướng chưa đủ, ruột còn ỉu | giữ |
| `loi/banh-song/ham[0]` | bánh sống nhăn vậy mà cũng bán | giữ |
| `loi/banh-song/haihuoc[0]` | vỏ bánh mềm tới mức nghi ngờ cái lò có bật không | giữ |
| `loi/banh-song/nhat[0]` | bánh chưa chín | giữ |

### reviews/lines.json · `loi/banh-khet`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `loi/banh-khet/chanthat[0]` | vỏ cháy sém, ăn đắng miệng | giữ |
| `loi/banh-khet/chanthat[1]` | bánh khét một bên, phải gỡ bỏ | giữ |
| `loi/banh-khet/ham[0]` | bánh khét thui mà vẫn gói cho khách | giữ |
| `loi/banh-khet/haihuoc[0]` | ổ bánh này chắc vừa đi qua một mùa hè khắc nghiệt | giữ |
| `loi/banh-khet/nhat[0]` | bánh khét | giữ |

### reviews/lines.json · `loi/nhoi-nhet`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `loi/nhoi-nhet/chanthat[0]` | nhồi nhiều quá, cắn cái rớt hết ra ngoài | giữ |
| `loi/nhoi-nhet/chanthat[1]` | đầy tới mức không gói nổi, ăn tèm lem | giữ |
| `loi/nhoi-nhet/haihuoc[0]` | nhân nhiều tới mức ăn xong phải lau bàn phím | giữ |
| `loi/nhoi-nhet/nhat[0]` | nhiều quá | giữ |

### reviews/lines.json · `loi/do-cu`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `loi/do-cu/chanthat[0]` | nhân không được tươi lắm | giữ |
| `loi/do-cu/chanthat[1]` | pate nhạt hơn mấy lần trước | giữ |
| `loi/do-cu/chanthat[2]` | rau hơi héo, chắc để từ sáng | giữ |
| `loi/do-cu/chanthat[3]` | vị không bằng hôm trước | giữ |
| `loi/do-cu/ham[0]` | đồ để lâu rồi mà vẫn bán, chán | giữ |
| `loi/do-cu/ham[1]` | nhân cũ thấy rõ, quán làm ăn kiểu gì | giữ |
| `loi/do-cu/haihuoc[0]` | nhân này chắc cũng có tuổi rồi | giữ |
| `loi/do-cu/nhat[0]` | nhân không tươi | giữ |

### reviews/lines.json · `loi/co-san`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `loi/co-san/chanthat[0]` | cắn phải sạn, phải bỏ nửa ổ | giữ |
| `loi/co-san/chanthat[1]` | trong ổ có gì đó cứng cứng, ghê | giữ |
| `loi/co-san/ham[0]` | ăn phải sạn, vệ sinh kiểu gì vậy | giữ |
| `loi/co-san/ham[1]` | đồ rơi xuống đất rồi vẫn gói cho khách thì thôi, mọi người tránh ra | giữ |

### reviews/lines.json · `loi/tay-ban`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `loi/tay-ban/chanthat[0]` | thấy chủ quán bốc đồ mà chưa rửa tay, ăn không yên tâm | giữ |
| `loi/tay-ban/chanthat[1]` | đứng chờ nhìn thấy tay chưa rửa đã cầm bánh luôn | giữ |
| `loi/tay-ban/chanthat[2]` | mong quán rửa tay trước khi bốc nhân | giữ |
| `loi/tay-ban/ham[0]` | bốc đồ bằng tay trần vậy ai dám ăn | giữ |
| `loi/tay-ban/ham[1]` | vệ sinh kiểu này sớm muộn cũng có chuyện, mọi người tự cân nhắc | giữ |
| `loi/tay-ban/haihuoc[0]` | nhìn chủ quán bốc nhân xong tôi thấy mình vừa tập thể dục cho hệ miễn dịch | giữ |
| `loi/tay-ban/nhat[0]` | không rửa tay | giữ |

### reviews/lines.json · `loi/chen-hang`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `loi/chen-hang/chanthat[0]` | có người tới sau mà được lấy bánh trước, hơi kì | giữ |
| `loi/chen-hang/chanthat[1]` | đứng xếp hàng đàng hoàng mà bị chen, quán cũng không nói gì | giữ |
| `loi/chen-hang/ham[0]` | ai chen cũng cho lấy trước, vậy xếp hàng gì | giữ |
| `loi/chen-hang/ham[1]` | quán nên để ý ai tới trước ai tới sau | giữ |
| `loi/chen-hang/haihuoc[0]` | đứng xếp hàng ở đây cần thêm kỹ năng giữ chỗ | giữ |
| `loi/chen-hang/nhat[0]` | bị chen hàng | giữ |

### reviews/lines.json · `loi/loa-on`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `loi/loa-on/chanthat[0]` | bánh ổn mà cái loa rao to quá, đứng chờ nhức đầu | giữ |
| `loi/loa-on/chanthat[1]` | loa mở lớn từ sáng, nhà bên chắc cũng mệt | giữ |
| `loi/loa-on/ham[0]` | mở loa inh ỏi cả xóm, bán buôn gì kì vậy | giữ |
| `loi/loa-on/haihuoc[0]` | cái loa rao thuộc bài hơn tôi thuộc bảng cửu chương | giữ |
| `loi/loa-on/nhat[0]` | loa ồn | giữ |

### reviews/lines.json · `loi/cho-them`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `loi/cho-them/chanthat[0]` | được cho thêm miếng nhân mà không tính tiền, quý | giữ |
| `loi/cho-them/chanthat[1]` | xin thêm chút nhân chủ quán cho liền, không khó chịu gì | giữ |
| `loi/cho-them/vuitinh[0]` | được cho thêm nhân nha mọi người, ưng cái bụng | giữ |
| `loi/cho-them/vuitinh[1]` | chủ quán hào phóng ghê, cho thêm mà cười tươi nữa | giữ |
| `loi/cho-them/haihuoc[0]` | xin thêm nhân mà được cho thiệt, hôm nay chắc trúng số | giữ |
| `loi/cho-them/nhat[0]` | được cho thêm nhân | giữ |

### reviews/lines.json · `loi/tra-da`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `loi/tra-da/chanthat[0]` | có trà đá miễn phí, đứng chờ đỡ khát | giữ |
| `loi/tra-da/chanthat[1]` | uống ly trà đá trong lúc chờ, nhỏ mà dễ chịu | giữ |
| `loi/tra-da/vuitinh[0]` | có trà đá free nữa chứ, ưng quá | giữ |
| `loi/tra-da/vuitinh[1]` | vừa ăn vừa làm ly trà đá, đúng bài | giữ |
| `loi/tra-da/haihuoc[0]` | ly trà đá miễn phí làm tôi thấy mình quan trọng hẳn | giữ |
| `loi/tra-da/nhat[0]` | có trà đá | giữ |

### reviews/lines.json · `loi/troi-mua`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `loi/troi-mua/chanthat[0]` | mưa vậy mà quán vẫn mở, mua được ổ nóng là mừng | giữ |
| `loi/troi-mua/chanthat[1]` | trời mưa ghé đại, không ngờ bánh vẫn nóng giòn | giữ |
| `loi/troi-mua/vuitinh[0]` | mưa gió mà vẫn đứng bán, thương quá trời | giữ |
| `loi/troi-mua/vuitinh[1]` | ngày mưa có ổ bánh nóng là hết sầu | giữ |
| `loi/troi-mua/haihuoc[0]` | đội mưa đi mua bánh, về tới nhà bánh còn khô hơn tôi | giữ |
| `loi/troi-mua/nhat[0]` | mưa vẫn bán | giữ |

### reviews/lines.json · `loi/do-nghe-moi`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `loi/do-nghe-moi/chanthat[0]` | quán mới sắm đồ, bánh ra giòn hơn hồi trước | giữ |
| `loi/do-nghe-moi/chanthat[1]` | thấy quán thay đồ nghề mới, nhìn sạch sẽ hẳn | giữ |
| `loi/do-nghe-moi/vuitinh[0]` | quán nâng cấp rồi nha mọi người, ăn khác hẳn | giữ |
| `loi/do-nghe-moi/haihuoc[0]` | quán sắm đồ mới, ổ bánh cũng ra dáng hẳn | giữ |
| `loi/do-nghe-moi/nhat[0]` | quán có đồ mới | giữ |

### reviews/lines.json · `loi/het-banh`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `loi/het-banh/chanthat[0]` | tới nơi thì hết bánh, tiếc | giữ |
| `loi/het-banh/chanthat[1]` | đi một đoạn tới nơi hết sạch, lần sau phải đi sớm | giữ |
| `loi/het-banh/chanthat[2]` | hết bánh sớm quá, chưa kịp mua | giữ |
| `loi/het-banh/haihuoc[0]` | tới nơi thấy tấm bảng hết bánh, đứng hình mất mấy giây | giữ |
| `loi/het-banh/haihuoc[1]` | hết bánh rồi, về ăn mì gói, cũng là một loại trải nghiệm | giữ |
| `loi/het-banh/ham[0]` | bán có nhiêu đó rồi nghỉ, khách đi xa tới thì sao | giữ |
| `loi/het-banh/nhat[0]` | hết bánh | giữ |

### reviews/lines.json · `loi/dau-bung`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `loi/dau-bung/chanthat[0]` | ăn sáng xong trưa ôm bụng, phải xin nghỉ nửa buổi | giữ |
| `loi/dau-bung/chanthat[1]` | về nhà là đau bụng, chắc chắn do ổ bánh này | giữ |
| `loi/dau-bung/chanthat[2]` | cả nhà ăn, cả nhà đau bụng | giữ |
| `loi/dau-bung/ham[0]` | ăn xong nằm cả ngày, mọi người đừng ghé | giữ |
| `loi/dau-bung/ham[1]` | đồ không đảm bảo, tôi đi viện vì ổ bánh này | giữ |
| `loi/dau-bung/ham[2]` | bán đồ kiểu này là hại người, phải có ai xuống kiểm tra | giữ |
| `loi/dau-bung/ham[3]` | ôm bụng từ trưa tới tối, không bao giờ quay lại | giữ |
| `loi/dau-bung/haihuoc[0]` | ổ bánh 20k, tiền thuốc 200k, lời to | giữ |
| `loi/dau-bung/nhat[0]` | ăn xong đau bụng | giữ |

### reviews/lines.json · `ve`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `ve/ngon[0]` | bánh thì ngon | giữ |
| `ve/ngon[1]` | ăn thì được | giữ |
| `ve/ngon[2]` | vị thì ổn | giữ |
| `ve/gia-re[0]` | giá thì mềm | giữ |
| `ve/gia-re[1]` | được cái rẻ | giữ |
| `ve/cho-them[0]` | được cho thêm nhân | giữ |
| `ve/cho-them[1]` | chủ quán cho thêm nhân | giữ |
| `ve/tra-da[0]` | có trà đá free | giữ |
| `ve/tra-da[1]` | được rót ly trà đá | giữ |
| `ve/troi-mua[0]` | mưa vậy mà vẫn mở | giữ |
| `ve/troi-mua[1]` | ngày mưa còn có chỗ mua | giữ |
| `ve/do-nghe-moi[0]` | quán mới sắm đồ | giữ |
| `ve/do-nghe-moi[1]` | đồ nghề nhìn mới | giữ |
| `ve/gia-dat[0]` | giá hơi chát | giữ |
| `ve/gia-dat[1]` | mắc hơn quanh đây | giữ |
| `ve/cho-lau[0]` | chờ hơi lâu | giữ |
| `ve/cho-lau[1]` | đợi muốn trễ giờ | giữ |
| `ve/thieu-nhan[0]` | thiếu mất một thứ | giữ |
| `ve/thieu-nhan[1]` | hụt mất món đã dặn | giữ |
| `ve/sai-mon[0]` | làm sai món | giữ |
| `ve/sai-mon[1]` | không đúng ổ mình gọi | giữ |
| `ve/it-nhan[0]` | nhân hơi ít | giữ |
| `ve/it-nhan[1]` | nhân mỏng | giữ |
| `ve/nguoi[0]` | ổ hơi nguội | giữ |
| `ve/nguoi[1]` | bánh nguội | giữ |
| `ve/banh-song[0]` | vỏ chưa tới | giữ |
| `ve/banh-song[1]` | bánh nướng chưa đủ | giữ |
| `ve/banh-khet[0]` | vỏ hơi khét | giữ |
| `ve/banh-khet[1]` | bánh sém một bên | giữ |
| `ve/nhoi-nhet[0]` | nhồi hơi nhiều | giữ |
| `ve/nhoi-nhet[1]` | kẹp đầy quá rớt ra ngoài | giữ |
| `ve/do-cu[0]` | nhân không tươi lắm | giữ |
| `ve/do-cu[1]` | vị không bằng hôm trước | giữ |
| `ve/tay-ban[0]` | thấy không rửa tay | giữ |
| `ve/tay-ban[1]` | cái vụ tay chưa rửa thì chịu | giữ |
| `ve/chen-hang[0]` | bị chen hàng | giữ |
| `ve/chen-hang[1]` | người tới sau lấy trước | giữ |
| `ve/loa-on[0]` | cái loa ồn quá | giữ |
| `ve/loa-on[1]` | loa rao nhức đầu | giữ |
| `ve/het-banh[0]` | hết bánh sớm | giữ |
| `ve/het-banh[1]` | tới nơi là hết | giữ |

### reviews/lines.json · `noi`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `noi/totXau[0]` | mỗi tội | giữ |
| `noi/totXau[1]` | có điều | giữ |
| `noi/totXau[2]` | nhưng | giữ |
| `noi/totXau[3]` | mà | giữ |
| `noi/xauTot[0]` | được cái | giữ |
| `noi/xauTot[1]` | bù lại | giữ |
| `noi/xauTot[2]` | mà | giữ |

### reviews/lines.json · `them`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `them/tot[0]` | rau giòn | giữ |
| `them/tot[1]` | đồ chua vừa miệng | giữ |
| `them/tot[2]` | chủ quán vui vẻ | giữ |
| `them/tot[3]` | gói kỹ, cầm đi đường không rớt | giữ |
| `them/tot[4]` | chỗ đứng chờ sạch sẽ | giữ |
| `them/tot[5]` | ra bánh nhanh | giữ |
| `them/tot[6]` | tương ớt đậm đà | giữ |
| `them/xau[0]` | chờ hơi lâu | giữ |
| `them/xau[1]` | chỗ đứng chật | giữ |
| `them/xau[2]` | gói sơ sài | giữ |
| `them/xau[3]` | không có chỗ để xe | giữ |
| `them/xau[4]` | rau hơi ít | giữ |
| `them/xau[5]` | giá nhỉnh hơn quanh đây | giữ |

### reviews/lines.json · `ket`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `ket/tot[0]` | sẽ quay lại | giữ |
| `ket/tot[1]` | ủng hộ quán dài dài | giữ |
| `ket/tot[2]` | recommend nha mọi người | giữ |
| `ket/tot[3]` | mai ghé nữa | giữ |
| `ket/tot[4]` | ai gần đây thì thử đi | giữ |
| `ket/vua[0]` | chắc có dịp ghé lại | giữ |
| `ket/vua[1]` | mong quán làm đều tay hơn | giữ |
| `ket/vua[2]` | lần sau thử món khác xem sao | giữ |
| `ket/xau[0]` | không quay lại nữa | giữ |
| `ket/xau[1]` | mọi người cân nhắc | giữ |
| `ket/xau[2]` | thất vọng | giữ |
| `ket/xau[3]` | lần sau chắc đi chỗ khác | giữ |
| `ket/xau[4]` | mong quán xem lại | giữ |

### reviews/lines.json · `dan[0]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `dan[0]` | ăn {mon} | giữ |

### reviews/lines.json · `dan[1]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `dan[1]` | gọi {mon} | giữ |

### reviews/lines.json · `dan[2]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `dan[2]` | mua {mon} | giữ |

### reviews/lines.json · `dan[3]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `dan[3]` | {mon} ở đây | giữ |

### reviews/lines.json · `persona`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `persona/sinhvien[0]` | hợp túi tiền sinh viên | giữ |
| `persona/sinhvien[1]` | sáng nào đi học cũng ghé | giữ |
| `persona/sinhvien[2]` | rẻ là mua | giữ |
| `persona/vanphong[0]` | mua mang lên công ty | giữ |
| `persona/vanphong[1]` | ăn vội trước giờ họp | giữ |
| `persona/vanphong[2]` | cả phòng đặt một lượt | giữ |
| `persona/colon[0]` | bác bán hàng nhanh nhẹn | giữ |
| `persona/colon[1]` | người lớn tuổi ăn thấy vừa miệng | giữ |
| `persona/colon[2]` | giá vậy là được | giữ |
| `persona/reviewer[0]` | chấm 8/10 | giữ |
| `persona/reviewer[1]` | điểm cộng cho phần nhân | giữ |
| `persona/reviewer[2]` | điểm trừ nhỏ thôi | giữ |
| `persona/reviewer[3]` | mình ăn qua kha khá quán bánh mì rồi | giữ |
| `persona/khachquen[0]` | khách quen mấy tháng nay | giữ |
| `persona/khachquen[1]` | tuần nào cũng ghé | giữ |
| `persona/khachquen[2]` | ăn từ hồi quán mới mở | giữ |

### reviews/lines.json · `nhamQuan[0]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `nhamQuan[0]` | hủ tiếu nước lạt, tô nhỏ mà tính giá cao | **hủ tiếu nước nhạt, tô nhỏ mà tính giá cao** |

### reviews/lines.json · `nhamQuan[1]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `nhamQuan[1]` | tô hủ tiếu ít thịt quá, nước dùng nhạt | giữ |

### reviews/lines.json · `nhamQuan[2]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `nhamQuan[2]` | quán hủ tiếu này dọn chậm, ngồi chờ muốn xỉu | giữ |

### reviews/lines.json · `nhamQuan[3]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `nhamQuan[3]` | ăn hủ tiếu ở đây thấy bình thường, không bằng chỗ cũ | giữ |

### reviews/lines.json · `nhamQuan[4]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `nhamQuan[4]` | gọi tô đặc biệt mà có mấy lát thịt | giữ |

### reviews/lines.json · `doiThu[0]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `doiThu[0]` | dở, mọi người đừng ăn | giữ |

### reviews/lines.json · `doiThu[1]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `doiThu[1]` | không ra gì, tránh ra | giữ |

### reviews/lines.json · `doiThu[2]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `doiThu[2]` | quán này không nên tồn tại | giữ |

### reviews/lines.json · `doiThu[3]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `doiThu[3]` | ăn một lần là tởn tới già | giữ |

### reviews/lines.json · `doiThu[4]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `doiThu[4]` | tệ nhất khu này | giữ |

### reviews/lines.json · `spam[0]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `spam[0]` | tốt | giữ |

### reviews/lines.json · `spam[1]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `spam[1]` | đẹp | giữ |

### reviews/lines.json · `spam[2]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `spam[2]` | được | giữ |

### reviews/lines.json · `spam[3]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `spam[3]` | hay | giữ |

### reviews/lines.json · `spam[4]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `spam[4]` | ok | giữ |

### reviews/lines.json · `spam[5]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `spam[5]` | 👍 | giữ |

### reviews/lines.json · `spam[6]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `spam[6]` | ai cần đổ mực máy in liên hệ mình nha | giữ |

### reviews/lines.json · `spam[7]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `spam[7]` | cho mình hỏi quán mấy giờ đóng cửa ạ | giữ |

### reviews/lines.json · `spam[8]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `spam[8]` | quán có tuyển người phụ không | giữ |

### reviews/lines.json · `spam[9]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `spam[9]` | ad ơi inbox mình cái | giữ |

### reviews/lines.json · `hiem[0]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `hiem[0]` | đang ăn thì gặp lại bạn cấp ba cũng đang đứng mua, tự nhiên thấy vui | giữ |

### reviews/lines.json · `hiem[1]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `hiem[1]` | ông chú trước mặt mua giùm luôn ổ của mình rồi đi mất, chưa kịp cảm ơn | giữ |

### reviews/lines.json · `hiem[2]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `hiem[2]` | mua ổ bánh mà được nghe hết một bản bolero từ loa nhà bên, trọn vẹn | giữ |

### reviews/lines.json · `hiem[3]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `hiem[3]` | con mèo quán bên cứ ngồi nhìn mình ăn, áy náy ghê | giữ |

### reviews/lines.json · `hiem[4]`

| Đường dẫn | Trước | Sau |
|---|---|---|
| `hiem[4]` | trời mưa, đứng trú chờ bánh, thấy cũng đáng | giữ |

## Chữ cổ ở `src/content/phone/events.ts` (chỉ báo, không sửa tự động)

| Dòng | Câu | Ghi chú |
|---|---|---|
| 241 | ừ. đủ thì nói mẹ, mẹ coi chỗ giùm con | `giùm` thừa; gợi ý: "mẹ coi chỗ cho con" |
| 221 | em làm bên ngoài cũng giỏi quá ta | trợ từ `ta` kiểu Nam cũ; gợi ý bỏ `ta` |
| 37 | con ăn uống đủ bữa nha | `bữa` ở nghĩa bữa ăn: giữ, không phải lỗi |

## Cần bạn quyết

1. `Ờ hen.` (chaoDap) → `Ờ nhỉ.`: đáp hợp mọi câu chào; hay muốn `Ừ.` cụt hơn?
2. `events.ts` dòng 241 `giùm` và 221 `ta`: bỏ không (file .ts, cần sửa tay)?
3. `lines/generic.json` còn `Chèn ơi.`, `Nay rảnh dữ ta.`, `tui` (Nam, nhưng không nằm trong danh sách cổ): giữ?
4. `reviews/lines.json` giữ `recommend`, `free`, `ok`, `OT`, `deadline` (giọng review thật, người trẻ): giữ?
5. `hủ tiếu` (nhamQuan) giữ nguyên chính tả Nam; chỉ đổi `lạt` → `nhạt`.
