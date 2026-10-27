# Giọng tin hẻm / thành phố trên VietSoci — research

> Dùng cho `src/content/vietsoci.part-hem.json` (tin `hem`, `thanhpho`, và 2 bài đặc biệt `xu-huong`, `huy-sa-thai`).
> Viết lại theo pattern, **không chép nguyên văn**. Nền chung: `vietsoci-clip.md` (corpus FB/Threads/Maps cùng đợt), `review-quan-an.md`, `hoang-huy-va-tin-nhan.md`.

## 1. Nguồn

Xem 2026-10-27 bằng Claude in Chrome, tab riêng, chỉ đọc. Chỉ bấm nút có `aria-label="Viết bình luận"` (đã kiểm selector trước khi bấm) để mở hộp bình luận; không Thích/bình luận/chia sẻ/theo dõi, không mở trang cá nhân. Bỏ tên, avatar, tag, sđt, địa chỉ; người được tag → `[tag]`, quán/đường thật → `[quán]`/`[đường]`.

| Nền tảng | Nguồn | Mẫu đọc |
|---|---|---|
| **Facebook** (chính) | Trang khu vực `facebook.com/ToiLaDanQuanGoVap`: bài taxi bị "tương tác" (30 bl), bài mưa ngập "Ngán quá trời ngán kkkk" (69 bl, đọc 38), bài tai nạn (84 bl, chỉ lấy khuôn, không dùng nội dung) · Group `facebook.com/groups/219499848640636/permalink/825559584701323` (group review ăn uống SG 786K tv, review bánh mì chảo, 372 bl, đọc 73) · Trang `facebook.com/thanthonoicongso` (hóng chuyện công sở 252K theo dõi, bài 61 bl, đọc 33 + 6 caption) · caption các Trang `saigonhongbien`, `hongsaigon.news`, "Made In Sài Gòn" · bổ sung corpus `vietsoci-clip.md` FB3–FB5 (group cư dân cúp nước, mèo lạc; group review bánh canh 373 bl) | **~180** (riêng đợt này ~190 dòng, đã bỏ chửi/chính trị) |
| **Threads** | Tìm `bị cho nghỉ việc`, `hàng xóm karaoke`, `hẻm nhà tui`, `mất dép`, `Sài Gòn mưa ngập`; trả lời dưới `@p.thuan_n8/post/DYE-q6xj7rF` (lý do bị cho nghỉ), `@hthy96/post/Dbf_ONHCUjI` ("cứu kaooo" dép), `@xichtholacquan/post/DePNmHpGr2S` (xe chết máy giữa nước, 11,7K views), `@nybeibi/post/DeMYbrVkvAu` (mưa + ngập + cúp điện, 50,9K views) | **~50** |
| **Google Maps** | "Hẻm Ăn Vặt 76" Q1 (~1.361 đánh giá, 3,8★), tab Bài đánh giá, cuộn 14 lần, đọc 130 | **130** (ghi lại 30) |

Đạt chỉ tiêu: ≥ 30 mẫu, mỗi nền tảng ≥ 10, đủ Maps + Threads + Facebook.
Ghi chú: Facebook tìm bài (`search/posts`) với từ khoá hẻm/cúp nước/karaoke ra 0 kết quả hoặc toàn quảng cáo nhà đất → vào thẳng Trang "Tôi là dân <quận>" và group lớn mới có bài nhiều bình luận. Threads search chỉ trả 3–8 bài mỗi từ khoá.

## 2. Mẫu đã ẩn danh (rút gọn)

### Facebook
```
== FB Page "Tôi Là Dân Gò Vấp" (facebook.com/ToiLaDanQuanGoVap) 27/10/2026
CAP: Đường Quang Trung, phường An Hội Tây :))) Tài xế taxi bị người đi xe máy tương tác
CAP: Có tý vitamin gái là nó khác biệt quá kkkk :))))
CAP: Ngoài kia, thế giới yêu nhau kiểu gì...!!!! Sự việc được cho xảy ra trên ... Clip: MXH
C: Khi nào bố lên phường | Lại lên phường | Còn 3 tháng nữa tết! Txe tính hết rồi | hổ báo dữ vậy ta | tx quá kinh nghiệm | Kinh kinh quá | Clm âm thanh k lệch đi đâu đc :)) Đã vậy con biển đó kk | Rồi bế lên phường chưa. dạo này ra đường có nhiều người muốn nổi tiếng quá | Rồi rồi rồi
C (bài tai nạn): Chốt câu cuối chuẩn đấy bro | T chỉ biết cười | Đăng Xuất luôn | Cũng hên có clip | Tội ông tài xế | chuyện của hai đứa bây thì liên quan gì đến chiếc xe khách.... | Giận quá mất khôn | Có đc trọng sinh ko ta | Có chuyện gì cứ bình tĩnh mà hành động ...
== FB Page Sài Gòn Hóng Biến (saigonhongbien) CAP: Chợ truyền thống xưa đã vắng khách, nay lại còn vắng cả tiểu thương #TNN | Rùng mình chất đặc kỳ lạ được phát hiện trong cá lóc khiến cộng đồng mạng nháo nhào
== FB Page Hóng Sài Gòn (hongsaigon.news) CAP: Nước ngập trôi cả xe luôn #TPHCM #tintuc | Thả [tim] để 2 mẹ con mau bình phục nhé mọi người
== FB Page Made In Sài Gòn CAP: TRIỀU CƯỜNG ĐẠT ĐỈNH GIỜ TAN LÀM...
== FB Group "Ăn Sập Sài Gòn" (groups/219499848640636) bài review bánh mì chảo Q1, 372 bình luận
CAP: Một địa điểm bánh mì chảo ăn sáng siêu mờ lem tại quận 1 ... Nhiều bạn hay inbox hỏi mình địa điểm ... tui lên bài review liền ... bán cũng khá nhanh nên không cần đợi quá lâu hen.
C: ngon quá à | [tag] bùn k | [tag] lưu mốt đi | [tag] mai đi | nghe bảo thứ 6 bà hem đi học Dậy đi ăn i | thử chỗ mới ki | bữa nào đi ăn sáng sớm bữa | aluuuu | cũng muốn ăn lắm mà chưa bao giờ dậy sớm để ăn lun á | đi ăn bánh mì chảoooo | th cbi lăn r | Nhìn ngonn | hỉu ý hong | quất | cho cái hẹn đi | ngon a gần trường | tiếp tục chuyên mục mỗi ngày một món ngon i | bữa nào lên đây ăn sáng ik | t3 đi ăn xong đi học=)))) | thay vì ăn hộp nui 28k "có như kh" thì ăn dĩa mì 30k ở đây hợp lý hơn nhiều | aloooooo đồng chí eiii | quận 1 xa nhà a k | đi ăn mậy | nhìn bén hơn nè | Đổi hệ đi chơi buổi sáng đi | cần mụt ai đó | Ăn nựa ko | Hình như gần nhà bà | Ko bán tối hả, tiếc | cách nhà mình 4 căn za t cá m chưa phát hiện ra | tr ơi đói | nào thử nhen | tag z th | Ủa địa chỉ quen quen :))) | alo baa liền haha | alo alo | này đúng chất bánh mì chảo nè :))) | saved | wàoo
== FB Page "Than Thở Nơi Công Sở" (facebook.com/thanthonoicongso, 252K theo dõi) captions: "Lương thấp nhưng nhu cầu cao" (222 bl) | "Trước khi tự trách bản thân, tại sao chúng ta không đổ lỗi cho người khác trước?" (124) | "Còn chưa tới cuối tháng nữa đó" | "Chúc mọi người cuối tuần vui vẻ"
== FB Page "Than Thở Nơi Công Sở" bài "Ngủ sớm dậy sớm cho khoẻ" (meme nỗ lực/ngủ, 61 bl, đọc 33)
C: Tôi cũng ngủ luôn vì bạn nói chí phải | Ông ad Fan MU chắc xem xong chán nên mới đi ngủ chứ gì :)))) | Tôi nỗ lực cũng ko thắng nổi họ. Thôi thì tôi cũng ngủ đây. Kệ đời đi. | Chạy ko kịp zới ng ta..... | Bạn phải biết là có nhiều người đang phải nổ lực để được ngủ. Bạn ngủ được dễ như vậy là đã hơn người ta rồi. Yên tâm ngủ đi nha. | Mai là thứ 2 nên t cố thức | Nỗ lực ngủ sớm | Mới thứ 2 đầu tuần | Bao giờ người ta không cố gắng nữa thì mình mới bắt đầu | [tag] thông điệp đi ngủ sớm haha | [tag] lượng sức mình chị ạ… | [tag] z đi | [tag] khoẻ | (nhiều comment chỉ tag tên)
CAP khác: "Lương 5tr ngồi chê thiết kế của căn hộ 5 tỷ" | "Quá lạm quyền"
== FB Page "Tôi Là Dân Gò Vấp" bài "Đường [tên] sau cơn mưa chiều, tối nay 7/10 :))) Ngán quá trời ngán kkkk" (69 bl, đọc 38)
C: 20/30 chục năm nữa nghề đóng ghe chắc có lẽ giàu | Lên núi ở là sướng, chẳng bao giờ ngập | Hiện tại [đường A] rút nước..mà [đường B] vẫn chưa | Nước MẠNH Dân sẽ Giàu kkk | Cảnh nước lềnh bềnh rất đẹp và lãng mạn. | Ô đây ngập tương đối nhẹ | tối 1 2h ko bt bên đó s nhưng bên tân phú mưa hơi bị dữ | Khúc nào vậy | Giờ mưa là có bãi giữa trong thành phố khỏi cần ra biển | Lần đầu tiên lịch sử | Quay về thời thơ ấu chơi với nước | Tam tai tôi rồi bán nhà đi gấp thôi | Học nghề sửa xe, chắc làm k hết việc. | [tag] biết bơi chưa | 3 tiếng [đường] vẫn không rút | Mát quá rồi, chẳng phải tiền vô như nước hay sao | ...nước vẫn chưa rút, con tôi phải nghỉ học | đường [X] có ngập đâu. đè đường ngập mà quay thôi | Ở Sài Gòn vầy thấy chán | Cảnh thục địa luôn | Nắng tốt Dưa! Mưa tốt Lúa! | Nhìn đàn cá tung tăng vui đùa thấy thương gì đâu á
(bỏ: comment chính trị/chửi tên người thật, nói tục "Đ..Ề..U")
```

### Threads
```
== Threads search "bị cho nghỉ việc" 27/10/2026 (threads.com/search?q=bị cho nghỉ việc)
ê mấy bà có từng xin nghỉ việc chỉ vì người đồng nghiệp thân thiết với mình xin nghỉ chưa | T sắp mất việc. Chưa tới hai tháng thử việc... | kiểm chứng cho câu kẻ mạnh nhất là kẻ sắp nghỉ việc | CTY NÀO DỄ XIN NGHỈ THÌ LÀ CÔNG TY TỐT =))) | Topic: Những lý do bị cho nghỉ việc mà cả đời bạn [chửi] nghĩ là nó có thể xảy ra.
== Threads post p.thuan_n8/post/DYE-q6xj7rF replies
Nhắn lại bảo: "chị tưởng mỗi chị có quyền chọn à?" =)))) | Ý là người ta không thích mình rồi | Bị ghéc rồi | Xét xong rồi vẫn mún đuổi 🤧 | Phong cách quản lý của bạn là gì? | (bỏ 1 câu chửi)
== Threads search "hàng xóm karaoke"
Hàng xóm bán cơm vỉa hè bên cạnh thường bật nhạc hát rất ồn, đỉnh điểm là hôm nay nó ồn như kiểu mấy bố bật nhạc đùng đùng ở trong nhà ý | Hàng xóm tui….kưng xỉu 😍🥰😘 | Hàng xóm ở Nhật là một cái gì đó vô cùng ố dề!
== Threads search "hẻm nhà tui": Kiếp nạn tới. T thuê chung cư ... Ổng đang giữ của t 16tr bây ơi | Có ní nào gu giống tui k về làm hàng xóm với tui luôn | Vì ô cửa chỗ này mà tui ghé tiệm liền | Tui dọn bà sạch sẽ, nấu xíu mại nóng hổi tươi ngon, đợi mấy khách yêu qua ăn rồi nè ✨
== Threads post hthy96/post/Dbf_ONHCUjI ("cứu kaooo" ngồi cạnh người cởi dép trên tàu) replies
Ui, mùi quá em ơi, không ổn, thôi nhé hay là vầy đi... cho anh xin fb | Cùng giới ní ơi, xin fb hơi kì :))))) | thề luôn mẹ t có 1 đôi giống đôi này và đi bị mùi rất kinh luôn ấy | Thực sự khủng khiếp bro ạ 🥲 | Cái mũi bị tra tấn trên 1h đồng hồ...🤦🏻‍♀️ | Ai khóc nỗi đau này 🥲 | Vậy cũng đăng | Mình ghé qua coi thời sự đi ní :)))) | Giấu dép đi fen | Bà nói thiệc hả bà thơ :)))) | tr ơi t nhìn đôi dép là t biết ))) | Xinh thì thơm hết
== Threads search "Sài Gòn mưa ngập" (8 bài)
Đêm qua ngồi canh nhà từ 2h đến sáng luôn, sợ mưa trôi cái mất cái nhà cái xe 😂 | Combo Mưa + Ngập + Cúp điện ⛈️ Thấy thương luôn | 8 năm sống ở Sài Gòn và đây là lần đầu bị ngập ám ảnh nhất với t | Nửa dân số SG hum nay bị mắc kẹt ở [đường] Bình Thạnh🥲 | Mưa to từ 2h00 sáng đến gần 8h00 vẫn chưa ngớt... | Kinh nghiệm 16 năm SG cho thấy mưa gió ntn là rất bềnh thường ạ :))) | [trang tin] Cầu ... bắt đầu ngập chân cầu, thoát nước chưa kịp sau trận mưa lớn.
== Threads post xichtholacquan/post/DePNmHpGr2S (xe chết máy giữa nước, 11,7K views) replies
Thiệt đó b. Tủi thân lắm. | Mình rất thấu hiểu cảm giác đó | Hixxx hôm nay bạn vất vả rồi, ngủ sớm nhé 🫂 | Tr ơi tui đứng đợi dưới mưa khóc lun mà 🥹 xong về tới nhà khóc típ 🥹 | Chúc bạn chân cứng đá mềm và luôn bình an nè | bthg cái xe nặng quá dắt ra ko nỗi đã thấy ớn ... lúc đó đúng kiểu 0 ai cứu mình ngoài chính mình ấy 🥹 | Đúng rồi á bạn bất lực thật sự luôn á | Ký ức ko bao giờ quên, bị 1 lần trên chỗ cổng chung cư...
== Threads post nybeibi/post/DeMYbrVkvAu (Combo mưa ngập cúp điện, 50,9K views) replies
có điện lại chưa mọi người ơi | Sáng thì gặp mệnh Mộc, chiều thì gặp mệnh Thủy. ... Bên này chưa kẹt xe, chưa ngập nha mọi người, đi chậm thôi. ❤ Chúc mọi người về nhà bình an nha | Kinh nghiệm mưa lớn nên ở lại chỗ làm... | Tui vừa từ [quán cà phê] về lại nhà đây, full combo ngập full quán + cúp điện. | gò vấp nè | Quán Mê mở cửa khuya lắm, chắc chờ nước rút hết kịp đó nè | Thấy thương mn quá 🥹 | Nữa hoài luôn á | (bỏ: câu "nghiệp báo", câu réo vùng miền)
```

### Google Maps
```
== Google Maps "Hẻm Ăn Vặt 76" (hẻm ăn vặt Q1, ~1.361 đánh giá, 3,8★), tab Bài đánh giá, cuộn 14 lần, đọc 130 — 27/10/2026
5★ Hẻm ... là điểm đến không thể bỏ qua với những ai mê ăn vặt ... phù hợp với học sinh, sinh viên và dân văn phòng
4★ Gửi xe bên trong hẻm 10k, nếu ăn bên trong phải gọi thêm nc để uống vì không có chỗ ngồi. Chị bán phá lấu dễ thương, phá lấu ngon, đậm vị.
5★ Đồ ăn ngon giá hợp lý trong bối cảnh quận 1, cô chú phục vụ niềm nở dễ thương, trời buổi trưa hơi nóng, bà chị mình ngoài Bắc vào mê cái bánh canh cua oh lá la luôn
3★ Hẻm hơi kiểu cổ ... Như kiểu chợ tập trung món ăn vậy, đa dạng nhiều lựa chọn.
3★ ... trước mình học ở gần đây nên chiều nào cũng ghé qua ăn trước khi đi học thêm
3★ Đến hẻm lúc hơn 18h00 (vì đói quá ...). Giờ này cũng ko còn nhiều gian hàng bán (~3-4 gian à). Nó là 1 con hẻm khá ẩm thấp, nhiều vật dụng lụp xụp
2★ Hẻm khá là nhỏ, đi vào giờ đông là vào được cũng khó ... quận 1 mà, giá cũng không rẻ
3★ Trong hẻm nên giá rẻ hơn bên ngoài chút ... tranh thủ đi từ chiều không sẽ hết sớm. Mua đồ ăn ra kêu nước để có bàn ngồi nha. Mới đầu vô nhìn hơi ghê, nên mặc giản dị khi đến thôi nhé!
3★ Đồ ăn không ngon lắm nhưng được cái đầy đặn. Giá ổn chứ không rẻ ...
4★ Giá ổn. Ăn được. Bắp xào trứng: 15k/hộp Bún thịt nướng: 20k/hộp
2★ Phần bột chiên 30k. Muốn chỉ ngồi ăn nhưng ép kêu thêm nước chanh muối 15k. Không gian bụi bụi
3★ Nghe nói nhiều, vào ăn thử ... gửi xe tốn 10k, muốn ngồi phải mua nước. Bản thân không ham quay lại
4★ Hẻm ăn vặt nổi tiếng nhất nhì sài gòn, lúc nào cũng đông đúc ... ngon mà rẻ
5★ Hẻm này thì quá quen với học sinh gần đó rồi, mình ăn suốt ba năm ... đồ ăn đầy ú ụ ăn hoài không hết
5★ Đồ ăn ở đây rất ngon nhưng chỉ bán từ 2h30-3h đến khoảng 6 7h là hết à.
3★ đông đúc, vui vẻ, hiểm hóc, cũng là nét trong hành trình du lịch
3★ Chỗ gửi xe chậc, ra vào khó. Trong hẻm bán nhiều đồ ăn nhưng ko ngon lém. Chấp nhận được.
5★ Khu này kế văn phòng quận 1 giá cả phải chăng. Món bánh canh cua siêu ngon siêu rẻ.
4★ Nhiều món, rẻ, tầm 20k/phần
5★ Ở đây nhiều món giá lại phải chăng ngon lắm 🤩🤩🤩
4★ Hẻm ăn vặt. Đồ ăn ngon, không khí náo nhiệt. Có điều không biết chất lượng và vệ sinh an toàn thực phẩm ra sao thôi.
2★ Xe gỏi cuốn trước hẻm ăn rất dở nha mn ơi, nước chấm pha rất kỳ luôn á 🥹🥹🥹
1★ Bán hàng thái độ, Đồ ăn không ngon, Mất vệ sinh do đồ rác nhiều :((
4★ Món ngon, giá hợp lý, các cô chủ dễ thương
5★ Ngon bổ rẻ: Gỏi cuốn, bò bía, bún mắm, bún riêu ... Ẹc ẹc quá chời!
5★ hẻm nhỏ nhưng có nhiều đồ ăn ngon
5★ Đồ ăn ngon nhưng cũng khá đông
4★ Rẻ, nhiều đồ ăn, gửi xe pải vô trong
1★ TRẢI NGHIỆM TỆ TẠI HẺM ... NGÀY ĐẦU NĂM ... (mở bài kiểu tiêu đề in hoa)
```

## 3. Pattern

### 3.1. Caption Trang tin khu vực / hóng
| Pattern | Ví dụ thật (rút gọn) | Dùng trong game |
|---|---|---|
| Địa danh + chuyện + mặt cười cuối câu | "Đường [X], phường [Y] :))) Tài xế taxi bị người đi xe máy tương tác" | `:)))`, `😂`, `🥲` cuối caption |
| Chuyện + 1 câu cảm thán của admin | "...sau cơn mưa chiều, tối nay 7/10 :))) Ngán quá trời ngán kkkk" | caption 2–4 câu, câu cuối là twist/cảm thán |
| Tiêu đề giật, kể ngắn, không kết luận | "Nẹt pô và cái kết", "Còn chưa tới cuối tháng nữa đó" | tiêu đề in hoa cho bài review |
| Hashtag địa danh | "#TPHCM #tintuc" | 1 hashtag ở tin thành phố |
| Lời dặn bà con cuối bài | "Bà con nhớ kê đồ cao..." | tin thời sự nhẹ |

### 3.2. Caption group cư dân / review
- Xưng `tui`/`mình`, kể chuyện có trình tự, bẻ lái cuối bài (corpus FB7 "à, thì ra…").
- Group review: **TIÊU ĐỀ IN HOA + 🔥**, giá, giờ bán, "ai ở gần thì đi sớm nha", "bán cũng khá nhanh".
- Group cư dân: "Thông báo…", "Kết thúc vụ…", "Cập nhật…", hỏi "mọi người có bị… không".

### 3.3. Comment
| Kiểu | Ví dụ thật | Tỉ lệ ước |
|---|---|---|
| Tag bạn rủ đi / khoe | "[tag] mai đi", "[tag] lưu mốt đi", "alo alo", "cho cái hẹn đi" | ~50% ở bài review ăn uống |
| Phát hiện gần nhà | "cách nhà mình 4 căn mà chưa phát hiện ra", "Ủa địa chỉ quen quen :)))", "Hình như gần nhà bà" | ít mà rất đặc trưng |
| Than tiếc / hỏi giờ | "Ko bán tối hả, tiếc", "Bán đến mấy giờ vậy chị ơi" | |
| Chơi chữ / khịa nhẹ | "nghề đóng ghe chắc có lẽ giàu", "Giờ mưa là có bãi giữa trong thành phố khỏi cần ra biển", "Nước MẠNH Dân sẽ Giàu" | nhiều ở bài ngập |
| Hỏi vị trí | "Khúc nào vậy", "gò vấp nè", "có điện lại chưa mọi người ơi" | |
| Chia sẻ, thương | "Thấy thương mn quá 🥹", "Hixxx hôm nay bạn vất vả rồi, ngủ sớm nhé 🫂" | |
| Châm ngôn công sở | "Bao giờ người ta không cố gắng nữa thì mình mới bắt đầu", "Ý là người ta không thích mình rồi", "Bị ghéc rồi" | trang hóng công sở |

- Độ dài: 3–15 chữ là chủ đạo; 1/5 dài 20–40 chữ kể chuyện nhà mình.
- Viết tắt: `mn`, `k/ko`, `bt`, `tr ơi`, `r`, `đc`; cười `:)))`, `=))`, `kkk`, `😂`, `🥲`, `🥹`.
- Từ Nam còn dùng: `nha`, `nè`, `á`, `luôn`, `vô`, `tui`, `ghê`, `xỉu`. **Không gặp** `nghen`, `hổng`, `biểu`, `mần`.

### 3.4. Khác biệt
- Trang khu vực: comment ngắn, khịa, có chửi/chính trị (bỏ hết).
- Group review ăn uống: gần như toàn tag bạn + rủ đi.
- Threads: kể lể cảm xúc, `tui/t`, `bà`, `ní`, `fen`, nhiều 🥹.
- Maps (hẻm ăn vặt): chuyện thực tế — gửi xe 10k, phải mua nước mới có chỗ ngồi, "chiều đi sớm không hết".

## 4. Từ cấm / bỏ

- Chửi thề gặp thật (`đm`, `clm`, `vcl`, `địt`, `đ*o`, "Bố mày") → không dùng.
- Chính trị, gọi tên người thật, réo vùng miền ("nghiệp báo", "ngập lụt tệ nạn thì réo SG") → bỏ.
- `redlines.json`: không dùng `hông`, `nghen`, `chớ`, `dzậy`, `biểu`; từ Bắc trong danh sách (`vào`, `mẹ`, `bố`, `mũ`, `lạc`…) → `vô`, `má`, `ba`, `nón`; tránh cả "mèo đi lạc" vì linter khớp chữ `lạc`.
- `lr4-blocklist.txt`: tránh `bom` (kể cả "bom hàng"), `súng`, `đạn`, `pháo`, `lính`, `thống nhất`.
- Không tên thương hiệu, công ty thật, người thật; không trùng tên NPC (Ngọc Trâm, Thu Hà, Khả Hân, Gia Bảo, Minh Quân…).

## 5. Áp vào `vietsoci.part-hem.json`

- 9 tin `hem`, 5 tin `thanhpho`, 2 `dacbiet`. Mỗi tin hẻm có twist ở câu cuối (cúp nước nhầm ngày, dép làm thuyền, vẹt giả chuông xe rác…), tránh trùng `vietsoci.part-drama.json` (karaoke, mèo, chó, xoài).
- Comment mỗi bài trộn: khịa chơi chữ + chuyện nhà mình + hỏi/rủ + 1 câu thương. Game hiện ngẫu nhiên 4 comment nên câu nào cũng đứng một mình được.
- `xu-huong`: theo khuôn group review (tiêu đề in hoa 🔥 + chi tiết món + "đi sớm nha") và comment tag bạn / "gần nhà mà giờ mới biết" / "trưa hết bánh hả, tiếc". Có 1 comment của Thuỳ Linh khớp tin nhắn `ky-luc-linh`.
- `huy-sa-thai`: khuôn trang hóng công sở, chỉ ghi "anh H.", "một công ty quận 1"; comment trộn khịa nhẹ ("đi xin lỗi hay đi xin việc") với thương ("mất việc ai cũng buồn") để không ác. Khớp tin nhắn `huy-bi-duoi-tin` và mở đường cho `huy-xin-viec`.
