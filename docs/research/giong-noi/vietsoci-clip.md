# Giọng clip trên VietSoci (giao diện Facebook) — research

> Dùng cho `src/content/vietsoci.part-clip.json`: `kenh`, `clip` (bé Khả Hân / trang review × `sach` / `ruoi` / `tay`), `danhGia` (người lạ xem clip rồi chấm sao), `tinNhan` (Linh/Huy nhắn kèm link).
> Viết lại theo pattern, **không chép nguyên văn**. Nền chung: `review-quan-an.md`, `quay-do-ruoi.md`, `hoang-huy-va-tin-nhan.md`.

## 1. Nguồn

Xem 2026-10-26/27 bằng Claude in Chrome, chỉ đọc (không Thích/bình luận/chia sẻ/theo dõi; chỉ bấm nút có `aria-label="Viết bình luận"` để mở hộp bình luận, đã kiểm selector trước khi bấm). Bỏ hết tên, avatar, tag, sđt, địa chỉ; tên người được tag thay bằng `[tag]`, tên quán thật thay bằng `[quán]`.

| Nền tảng | Nguồn (URL) | Mẫu |
|---|---|---|
| **Facebook** (chính) | FB1 `facebook.com/canthotv/posts/pfbid026qs7c…` (Trang đài địa phương, tin chuỗi bánh mì gây ngộ độc, 410 bl) · FB2 `facebook.com/reel/935060816070194` (Trang reviewer ăn uống, xe bánh mì lâu năm, 53 bl) · FB3/FB4 `facebook.com/groups/303109391457175` (group cư dân) · FB5 `facebook.com/groups/219499848640636/permalink/630303964226887` (group review ăn uống SG 786K tv, 373 bl) · FB6 `facebook.com/groups/595344497162334/permalink/29669762939293770` (drama bị bán đắt, 186 bl) · FB7/FB10 caption trong kết quả tìm `găng tay bánh mì`, `bán đồ ăn ruồi bu` · FB8/FB9 Trang tin giải trí 13 triệu theo dõi, `facebook.com/reel/1760149772783321` (449 bl) · FB11 `facebook.com/groups/955726618598582/permalink/2088867515284481` (phốt chả có ruồi, 87 bl) | **~190** |
| **Threads** | Tìm `cầm tiền bốc đồ ăn`, `quán ăn mất vệ sinh`, `xe bánh mì`, `quán sạch sẽ`, `quán viral`, `quán dơ`; đọc trả lời dưới post `DDO8B6DSkCR`, `Dbrk3RQCco3`, `DZpddmik_g_` ("xin duyên" cho quán của mẹ), `Dea5gXwkvI4`, `DemTcgVlBM1` | **~70** |
| **Google Maps** | Tiệm bánh mì nổi tiếng Q1 (~7.800 đánh giá): lọc `tiktok`, `bao tay`, `cầm tiền` · tiệm bánh mì lâu đời Q1 (~1.800 đánh giá): lọc `vệ sinh`, `dơ` | **~30** |
| TikTok (phụ) | Tìm `review bánh mì vỉa hè` (5 caption + lượt xem) · `tiktok.com/@lengochieuu/video/7699841304322116871` · `@yan45giay/video/7638876164164979985` (quán kém vệ sinh, bốc tay) · `@sapduoiruoi.obsvietnam/video/7374630312401292552` | **~30** |

**Tổng ~320 mẫu.** Chia theo tình huống:

| Tình huống | FB | Threads | Maps | TikTok | Ghi chú |
|---|---|---|---|---|---|
| Clip khen quán sạch/ngon (`sach`) | ~85 (FB5, FB9, FB2) | ~30 (TH3, TH4, TH5) | ~12 | ~10 | đủ |
| Clip ruồi (`ruoi`) | ~15 (FB10, FB11) + 27 ở `quay-do-ruoi.md` | ~10 (TH2 + 15 ở `quay-do-ruoi.md`) | ~3 + 14 ở `quay-do-ruoi.md` | 5 | đủ khi gộp research cũ |
| Clip bốc tay/cầm tiền (`tay`) | ~8 (FB2, FB7, FB1) | **~3** | ~10 | 13 | **Threads thiếu**: tìm `bốc tay không đeo bao tay`, `cầm tiền bốc đồ ăn` ra toàn bài không liên quan |
| Xem clip rồi chấm sao (`danhGia`) | ~10 (FB1, FB2 "nể người ăn", hỏi địa chỉ để né) | ~6 (TH5, TH6 "đi theo review") | ~7 (lọc `tiktok`) | 2 | dạng "chưa ăn mà chấm" hiếm thấy thật; viết theo lời người *đã đi vì clip* |
| Giọng FB chung / drama (tham khảo cho phần tin) | ~80 (FB3, FB4, FB6, FB8, FB9) | ~20 | — | — | |

Ghi chú tìm kiếm: Facebook tìm từ khoá dài ra 0 kết quả hoặc toàn quảng cáo; ra bài tốt nhất khi **tìm trong group** (`/groups/<id>/search?q=`) rồi mở bài nhiều bình luận nhất. Kết quả tìm lẫn bài trang cá nhân — đã bỏ một bài lỡ mở (drama người thật) và một video cá nhân, không ghi lại.

## 2. Mẫu đã ẩn danh (rút gọn)

### Facebook
| # | Mẫu |
|---|---|
| F1 | nể nhất là khách vẫn dí đầu vô ăn =)) · Nể chủ 1, nể mấy người đến ăn 10 · Bao lần.. vẫn nể người ăn · Vậy mà vẫn cho bán, vậy mà vẫn có người ăn |
| F2 | Lần đầu sự cố, lần 2 ráng cố, lần 3 hết cố là hết cứu · Nhất quá tam kkk · Thôi nghỉ ăn lun vừa r kk · [tag] nhịn luôn, kkkk · Dẹp |
| F3 | (reel review xe bánh mì) nhìn thấy cột dây ni lông là ớn rồi · 5 ngón tay bấu nhìn gớm · Bao tay? · Sao ko bao tay khẩu trang cho vệ sinh · Xin địa chỉ. · Có ship ko · Ăn cũng đc, chứ o ngon lắm · Bình thường thôi chứ không ngon như giới thiệu |
| F4 | (group review, bài khen) [tag] chiều đi hong?? · [tag] muốn ăn · [tag] ụiiiii nhìn ngon dữ · [tag] lưu gấpppp · Ngon thiệt á mn · Có ship hông ạ · mlem mlem · Bán đến mấy giờ vậy chị ơi · [tag] Thứ 7 đi không :))) · hôm bữa em dẫn anh đi ăn này nè mà hết mất tiêu |
| F5 | (caption reviewer) TIÊU ĐỀ IN HOA + giá · "• Mình đã review chỗ này 1 lần rồi, cơ mà hôm qua ghé lại ăn tiếp ngon quá nên review tiếp nè" · "Giá bình dân mà topping chất lượng" · "xỉu chưa" · "nha mọi ngườiii" |
| F6 | (caption cá nhân) "Thấy cô bán bánh mì … đeo đôi bao tay, thầm nghĩ 'vệ sinh quá nha' … rồi cũng chính đôi tay đeo găng ấy lấy bánh mì, lấy thịt, lấy tiền của khách. À, thì ra … đeo găng tay để bảo vệ bàn tay ngọc ngà" |
| F7 | (caption group) "Mình không có ý phốt ai... nhưng … bày bánh ra bán 1 bàn không che đậy rồi có ruồi bu nữa, tự nhiên hết muốn mua" |
| F8 | (phốt ruồi) Video thứ 2 mình thấy b khẩy ruồi ra r vẫn cắt ra đấy · Cuối cùng phốt nhau giờ ai dám ăn, sợ thật · Câu chuyện chưa có hồi kết · thôi mn cứ tự làm tự ăn ở nhà đi |
| F9 | (drama đời sống) Đơn giản là sẽ không bao giờ quay lại. Thế thoai · bán đc 1 lần ko có lần 2 · Bán vậy khách đến 1 lần · Chắc câu like thôi · Tui đi mua đồ mà ng bán hậm hực ko vui là tui rồ ga phóng đi luôn :))) |
| F10 | (reel cô chú giận nhau) Nhìn hai người ăn cơm mà tôi tưởng đang xem phim tình cảm, ai ngờ là phim tài liệu về sinh tồn! · [tag] nx em với anh về già giống dị á kkk · Y chang vk ck nhà tui nha · Ok! Lưu lại mỗi khi cần =)) · Tội cậu vàng chưa biết chọn phe nào |

### Threads
| # | Mẫu |
|---|---|
| T1 | Cmay ơi quán này siêu rẻ siêu sạch sẽ mà ăn siêu ngon luôn ý huhu · Quán local chưa bao giờ làm ta thất vọng · quán này hot lâu lắm r mà giờ mới được đi thử, fomo theo cdm đúng là k làm tui thất vọng 😋 |
| T2 | (trả lời "xin duyên") Viral nha ~ chúc cô đắt hànggg · Note lại để cuối tuần mình ghéee · Ngon đấy, nào có dịp qua test mới đc · Đã note lại, chúc quán đông khách nhé · chấm để cuối tuần thử · Sao k thấy quán này trên map nhỉ 🤔 |
| T3 | Tôi ko muốn quán viral nhưng tôi không muốn quán sập :( · khiếp cái quán này đông ác r á b ơi · quán tên gì dị bạn |
| T4 | Cho mình xin số ban quản lý vệ sinh an toàn thực phẩm với ạ … bán có 2 bịch bánh tráng mà lòi ra con gián khổng lồ :)) · chời ơi 🤣🤣 · toi ở quán ăn đc rv trên tiktok … · Ko ngon lắm🥲 |
| T5 | (bánh mì) trời mưa nên cô đứng ngoài nhận order phải hét ngược vô trong quán "LẤY MỘT Ổ EM BÉ" · Tui dặn chú đừng bỏ ớt, chú quay ra hỏi "thêm miếng ớt cho the the k con" · tr ơi ko ăn cả dưa leo thì phải là ổ mới đẻ ấy nhé =)))) |

### Google Maps
| # | Sao | Mẫu |
|---|---|---|
| G1 | 1 | Sai lầm của tôi khi chạy theo trào lưu TikTok. Giá quá cao, quảng cáo quá mức … |
| G2 | 1 | Tại mấy videos trên tiktok nên cố ham hố đi ăn thử, cuối cùng lại chẳng ra gì |
| G3 | 5 | Cuối cùng thì mình cũng đến đây sau khi thấy nhiều người khen ngợi trên TikTok và quả thật không làm mình thất vọng!! |
| G4 | 5 | đến quán vì thấy trên vài video … Chúng tôi rất ngạc nhiên vì đó là sự thật |
| G5 | 5 | Tiệm cũng cho bao tay nylon nên rất sạch sẽ 🥰 |
| G6 | 1 | nhận bánh xong không bao tay, không khăn giấy |
| G7 | 3 | Cần cải thiện lại vệ sinh. Bánh mì nhân viên cầm tay trực tiếp không có bao tay. |
| G8 | 1 | nhìn bà chị nhân viên 2 tay không từ mở tủ, bốc thức ăn, cắt giò… CỰC KỲ BỬN VÀ MẤT VỆ SINH 😡😡 |
| G9 | 4 | Điểm trừ: -Cơm đắt -Vệ sinh hơi kém, có ruồi. |
| G10 | 5 | Bánh mì thịt ngon và hợp vệ sinh · Chuyên nghiệp, vệ sinh, giá hợp lý. |

### TikTok
| # | Mẫu |
|---|---|
| K1 | (caption) Chỗ này bán gần trường tiểu học nên tui thấy giá hạt dẻ chứ không đắt … Ai ăn ở đây rồi thì cho tui xin cảm nhận nha · Nghe danh đã lâu, nay mới được thử👀🔥 |
| K2 | (quán bốc tay) Nể người ăn luôn · Thấy gớm vậy 😭😭😭 · Đôi găng tay làm đủ thứ · có đeo bao tay mà · Kiểm tra an toàn thực phẩm ngay và luôn |
| K3 | Thèm nữa òiiiii · Mới ăn hồi sáng luon · ở đâu vậy · Ai đã ăn rồi cho xin ý kiến đi ạ |

## 3. Pattern

| Trục | Người thật viết |
|---|---|
| **Comment FB = tag + 2–5 chữ** | `[tag] chiều đi hong??`, `[tag] lưu gấp`, `[tag] coi nè`. Ở bài nhiều người xem, > 50% comment là tag. Game: dùng tên giả (Gia Bảo, Thanh Trúc…) đứng đầu câu, không có `@` |
| **Khen clip** | `nhìn ngon dữ`, `ngon thiệt á mn`, `lưu lại`, `xin địa chỉ`, `có ship không`, `bán tới mấy giờ`, `mai đi ăn đi`, `mới ăn hôm qua, chuẩn` |
| **Chê vệ sinh** | `nể người ăn` (rất dày, cả FB lẫn TikTok), `vẫn có người mua mới hay`, `quán nào vậy, để né`, `mua 1 lần không có lần 2`, `bao tay đâu?`, `đôi tay làm đủ thứ`, `nhìn gớm/ớn` |
| **Hài ruồi** | `giàu đạm`, `ruồi cũng biết chỗ ngon` (từ `quay-do-ruoi.md`) |
| **Chỉ thời điểm trong clip** | `video thứ 2 mình thấy…`, `giây 0:12` — người xem clip hay chỉ khung hình làm bằng chứng |
| **Caption reviewer FB** | TIÊU ĐỀ IN HOA → gạch đầu dòng `•` → giá → điểm `9/10` → lời kết `nha mọi người`, `recommend`. Bài chê mở bằng `Mình không có ý phốt ai…` hoặc `Review thật:` |
| **Caption trẻ con / cá nhân** | chữ thường đầu câu, kể "đi học về ghé…", emoji 1–2 cái, `10 điểm`, `ngon quá trời`; bẻ lái hài ở cuối (F6) |
| **Đánh giá vì clip (Maps)** | lộ nguồn bằng `thấy trên video`, `chạy theo trào lưu`, `thấy nhiều người khen trên…`; 1★ thì `sai lầm của tôi`, 5★ thì `quả thật không làm mình thất vọng` |
| **Teencode** | gõ tắt (`k`, `r`, `đc`, `mn`, `dị`), kéo vần (`hànggg`, `ghéee`, `ụiiii`), `=))`, `kkk`; không teencode cute |
| **Độ dài** | comment 2–12 từ; caption reviewer 40–70 từ; caption bé 10–20 từ |

## 4. Từ cấm / tránh

- Chửi thề có trong corpus (`đm`, `vcl`, `bỏ mẹ`, `moá`, `lz`, `dkm`, `bố con thằng nào`) — không dùng.
- Miệt thị vùng miền (`ngoài đó`, `gu ẩm thực ngoài đó`) — có trong corpus TikTok, không dùng.
- `chiến tranh lạnh` (F10) — dính `tools/lr4-blocklist.txt`; `ngon quãi đạn` (T1) — dính `đạn`.
- Tên app thật trong câu chữ game (`tiktok`, `reels`, `threads`) → đổi thành `VietSoci` hoặc `clip trên mạng`.
- Giọng Nam cổ trong `redlines.json` → `archaic` (`hông`, `nghen`, `chớ`, `dzậy`); `vào` → `vô` (L008).
- Kể chuyện ruồi rơi vô ổ, `trứng ruồi`, `topping ruồi` — game không có cảnh đó (xem `quay-do-ruoi.md` §4).
- Không nhắc tên quán, thương hiệu, người nổi tiếng thật.

## 5. Đã viết

`src/content/vietsoci.part-clip.json`:

| Khoá | Số câu | Giọng chủ đạo |
|---|---|---|
| `kenh.su` / `kenh.review` | `Khả Hân ăn vặt 🍡` / `Ghé Là Mê - Review Ăn Uống SG` | trang bé tự đặt / trang review FB |
| `clip.su.*` | 3–4 caption + 6 comment mỗi trạng thái | bé 13 tuổi: ngây thơ, quay cái thấy được mà không phán; comment là bạn học + người lạ ít ỏi |
| `clip.review.*` | 3–4 caption + 8 comment | reviewer FB (§3); comment đông, nhiều tag, "nể người ăn", "để né" |
| `danhGia.sach/ruoi/tay` | 10 / 9 / 9 | mỗi câu lộ `coi clip`, `lướt trúng clip`, `chưa ăn`, `clip trên VietSoci`, `bên trang review` |
| `tinNhan.*` | 3 mỗi trạng thái | Linh (bà/tui, 🥹🔥😭) báo tin và giục sửa; Huy (😏🙄) khịa, "dân văn phòng", không tục |
