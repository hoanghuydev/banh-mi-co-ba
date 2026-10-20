# Rà thoại — CÔ MAI (`src/content/talks/co-mai.json`)

> ## ⚡ REVAMP 2026-10-20 — ☠️ CHẾT TOÀN BỘ
> Rà thoại theo giọng cũ + hệ trí nhớ/quan hệ đã chết. Toàn bộ thoại viết lại giọng Nam gen Z ở R6 (CANON §9, §17.1). Chỉ giữ để truy vết nội dung cũ.

**Hợp đồng:** `docs/phase-2-he-npc/P2-07-neo-thoai-vao-the-gioi.md` · **8 cuộc · 104 nút**
**Từ vựng:** chỉ §3. Khoá nào thiếu thì nằm ở mục *Đề xuất khoá mới* cuối file.

**Trạng thái đo được ở file này:** `while` xuất hiện **0 lần**, `forSec` **0 lần**,
`needEquip` **0 lần**, `act` **1 lần** (`PAY` ở 6.1.1.3). Tức 103/104 nút nói xong thế
giới không đổi gì ngoài `rel`/`flag`.

**Ba luật đọc dùng cho cả file:**
1. *Xã giao thuần không phải free word.* Câu không hứa gì chỉ cần `while` đúng cảnh.
2. *Kiến thức nền* (cô Mai sưu lan, cô Mai nhiều chuyện, cô Mai chạy bộ) — hàng xóm biết,
   không cần `need`. *Sự kiện cụ thể* (chậu lan 4 triệu chết, trang nợ chưa xé, vụ nhà
   số 14) — phải có `need` cờ do chính cuộc kể ra chuyện đó đặt.
3. Câu **hứa một việc làm** mà hệ chỉ có `PROMISE` cho *món kẹp vô ổ bánh* ⇒ `CẦN CODE`,
   không phải `SỬA`: từ vựng `does` để diễn đạt nó chưa tồn tại.

---

### mai.tieutam — chuyện tiêu tám nhà số 14 (FULL · day 10–40 · minVisits 4 · notFlag `maiNeNguoiChoi`)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1S:ket.1 | "Thôi cô, chuyện nhà người ta." | — | — | — | ĐÚNG — xã giao thuần, không hứa gì |
| 1S:ket.2 | "Cô kể nữa đi cô, con nghe nè." | — | — | — | ĐÚNG — "để bữa khác cô kể tiếp" có cuộc khác đỡ |
| 1S:ket.3 | "Cô ăn đi cô, nguội bánh rồi." | — | **thiếu** `t.served` | — | **SỬA** — mời ăn khi cô chưa cầm ổ nào; thêm `while: t.served` |
| 1.1 | "Nhà số 14 sao hả cô?" | — | — | — | ĐÚNG |
| 1.1.1 | "Trời đất. Rồi chị vợ biết chưa cô?" | — | — | — | ĐÚNG |
| 1.1.1.1 | "Tội chị đó quá cô." | — | — | — | ĐÚNG |
| 1.1.1.1.1 | "Hay mình qua coi chị đó sao cô?" | — | — | `flag maiQuaNha14` (đọc lại ở 5S:ket.3) | **CẦN CODE** — người chơi nhận lời "con đi với cô nghen" mà game không có buổi chiều đi hẻm; cần `PROMISE` loại việc |
| 1.1.1.1.2 | "Hồi nãy cô nói nhỏ mà giờ cả hẻm biết rồi cô." | **thiếu** `maiKeLan`/`maiKeTiep` | — | — | **SỬA** — buộc tội cô đi kể trong khi trong cuộc này cô mới kể cho mình |
| 1.1.1.1.3 | "Vậy mà cô còn đem đi kể khắp nơi." (GAT) | **thiếu** `maiKeLan`/`maiKeTiep` | — | `anger 30` | **SỬA** — cùng lỗi 1.1.1.1.2, nặng hơn vì tốn 30 giận |
| 1.1.1.1.4 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 1.1.1.2 | "Thằng đó mất dạy thiệt chớ." (CHUI) | — | — | — | ĐÚNG — CHUI đúng nghĩa: chửi người thứ ba, hợp tần số cô Mai |
| 1.1.1.3 | "Chuyện nhà người ta cô ơi, mình xía vô chi." | — | — | — | ĐÚNG |
| 1.1.1.4 | "Cô kể cho ai nữa chưa cô?" | — | — | — | ĐÚNG |
| 1.1.2 | "Cô thấy tận mắt hả cô?" | — | — | — | ĐÚNG |
| 1.1.3 | "Con hổng dám nghe đâu cô. Lỡ miệng chết." | — | — | — | ĐÚNG |
| 1.1.4 | "Cô ơi, con đang bán mà." | — | **thiếu** `w.queue >= 1` | — | **SỬA** — viện cớ bận bán khi ngoài quầy không có ai |
| 1.2 | "Thôi cô, con hổng muốn nghe chuyện nhà người ta." | — | — | — | ĐÚNG |
| 1.2.1 | "Hổng phải nghiêm đâu cô. Con sợ nói ra người ta khổ." | — | — | — | ĐÚNG |
| 1.2.2 | "Cô kể chuyện lan của cô đi, con nghe cái đó." | — | — | — | ĐÚNG — lan là nền tính cách, không phải sự kiện |
| 1.2.3 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 1.3 | "Cô mà nói nhỏ thì cả hẻm nghe rồi cô ơi." (DUA) | — | — | — | ĐÚNG |
| 1.3.1 | "Tại con thương cô con mới dám nói." | — | — | **thiếu** — "cô bớt lại, cô hứa" | **SỬA** — cô hứa bớt kể mà trọng số cuộc tiêu tám không đổi; thêm `flag maiBotKe` |
| 1.3.2 | "Con nói thiệt chớ con hổng giỡn cô." | — | — | — | ĐÚNG |
| 1.3.3 | "Cô nhiều chuyện nhất hẻm này đó cô." (GAT) | — | — | `anger 25` · lá cuối | ĐÚNG — xúc phạm đúng nền tính cách, và GAT kết thúc cuộc nên không vướng §3.3 |

### mai.lan — chậu lan 4 triệu chết (SHORT · day 5–40)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 2.1 | "Bốn triệu một chậu lận hả cô?" | — | — | — | ĐÚNG |
| 2.1.1 | "Ai nói với cô vậy cô?" | — | — | — | ĐÚNG |
| 2.1.1.1 | "Vậy là cô bị gạt rồi cô." | — | — | — | ĐÚNG |
| 2.1.1.2 | "Cô kể con nghe nè, con giữ giùm cho." | — | — | **thiếu** cờ bí mật | **SỬA** — nhận giữ bí mật mà không có cờ nào để sau này bẻ được; thêm `flag maiBiGat` |
| 2.1.1.3 | "Bốn triệu mà cô tin người ta ngoài chợ hả cô." (GAT) | — | — | `anger 30` · lá cuối | ĐÚNG |
| 2.1.1.4 | "Thôi của đi thay người cô ơi." | — | — | — | ĐÚNG |
| 2.1.2 | "Cô tưới nhiều quá chắc nó úng rồi cô." | — | — | — | ĐÚNG |
| 2.1.3 | "Chắc nó nhớ nhà nó quá nó đi cô ơi." (DUA) | — | — | — | ĐÚNG |
| 2.1.4 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 2.2 | "Trời ơi cô. Tiếc quá cô ha." | — | — | — | ĐÚNG |
| 2.2.1 | "Cô còn cây nào sống hông cô?" | — | — | — | ĐÚNG |
| 2.2.2 | "Thôi cô trồng trầu bà đi cô, nó hổng chết đâu." | — | — | **thiếu** — "để cô ngắt cho con một nhánh" | **CẦN CODE** — NPC hứa đưa vật; không có `GIVE_ITEM` nào trong §3.5 |
| 2.2.3 | "Cô mua chi cho mắc vậy cô." | — | — | — | ĐÚNG |
| 2.3 | "Quanh đây có ai cho mướn phòng nhỏ hông cô?" | `lanHoiPhong` ✓ | — | **thiếu** cờ trả lời | **SỬA** — `need` đúng, nhưng hỏi giùm chị Lan xong câu trả lời rơi vào hư không; thêm `flag maiChiPhongTro` để nhánh chị Lan đọc lại |
| 2.4 | "Dạ con hổng rành cây cối đâu cô." | — | — | — | ĐÚNG |

### mai.sotay — dạy ghi sổ nợ (SHORT · day 8–40 · minVisits 3)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 3.1 | "Dạ con có ghi cô. Mà con hay quên." | — | — | — | ĐÚNG |
| 3.1.1 | "Cô bị quỵt nhiều hông cô?" | — | — | — | ĐÚNG |
| 3.1.1.1 | "Người quen quỵt rồi cô làm sao cô?" | — | — | `mem REMEMBERED_STORY` | ĐÚNG |
| 3.1.1.2 | "Con cũng đang bị y vậy nè cô." | **thiếu** — người chơi có người mua chịu chưa? | — | — | **SỬA** — khai một sự thật về két mà game không kiểm; cần khoá `p.owed >= 1` |
| 3.1.1.3 | "Vậy thì đừng bán chịu nữa cô." | — | — | — | ĐÚNG |
| 3.1.1.4 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 3.1.2 | "Cô chỉ con ghi sao cho gọn đi cô." | — | — | `flag maiDayGhiSo` (đọc ở `chu-tu.json`) | ĐÚNG |
| 3.1.3 | "Dạ con nhớ trong đầu được mà cô." (DUA) | — | — | — | ĐÚNG |
| 3.2 | "Dạ cô khỏi lo, con tính kỹ lắm." | — | — | — | ĐÚNG |
| 3.2.1 | "Con giỡn thôi cô. Cô chỉ con đi." | — | — | **thiếu** `flag maiDayGhiSo` | **SỬA** — cùng nội dung 3.1.2 mà không đặt cờ: hai đường cùng học một bài, một đường mất bài |
| 3.2.2 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 3.3 | "Cô lo tiệm cô đi cô, con tự biết." (GAT) | — | — | `anger 30` · lá cuối | ĐÚNG |

### mai.chaybo — chạy bộ sáng thứ Hai (BARK · MON · day 8–40)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 4.1 | "Năm cây lận hả cô? Cô giỏi quá cô." | — | — | — | ĐÚNG |
| 4.1.1 | "Ủa con có thấy đâu cô?" | — | — | — | ĐÚNG |
| 4.1.2 | "Cô dạy con chạy với đi cô." | — | — | **không có gì** — "thứ Hai sau con dậy sớm nghen. Bốn rưỡi." | **CẦN CODE** — hẹn một buổi sáng thứ Hai mà game không có; free word nặng nhất file này: không cờ, không act, không ai đòi |
| 4.1.3 | "Chạy chi cho mệt vậy cô." | — | — | — | ĐÚNG |
| 4.2 | "Rồi cô chạy xong cô ăn bánh mì hả cô?" (DUA) | — | **thiếu** `t.ordering` | **thiếu** — "con cho cô hai ổ nghen" | **CẦN CODE** — khách đổi đơn giữa cuộc; không có `ORDER_CHANGE` trong §3.5, và cuộc này chạy lúc `t.waiting` nên cô đã gọi món rồi |
| 4.2.1 | "Vậy chạy chi nữa cô." (DUA) | — | — | — | ĐÚNG |
| 4.2.2 | "Dạ hai ổ liền cô." | — | **thiếu** `t.ordering` | **thiếu** — "ổ thứ hai hổng hành nghen con" | **CẦN CODE** — người chơi nhận một đơn 2 ổ + một yêu cầu BỚT nhân; `PROMISE` hiện chỉ treo được món THÊM vô ổ |
| 4.3 | "Dạ." (LANH) | — | — | — | ĐÚNG |

### mai.kelan — cô Mai kể chuyện chị Lan (SHORT · day 12–40 · minVisits 4)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 5S:ket.1 | "Dạ cô ăn đi cô, nguội mất." | — | **thiếu** `t.served` | — | **SỬA** — mời ăn khi cô chưa nhận ổ nào |
| 5S:ket.2 | "Dạ cô đừng kể ai nữa nghen cô." | — | — | **thiếu** — "con nói vậy thì cô im" | **SỬA** — cô nhận lời im mà kho tiêu tám không đổi; thêm `flag maiBotKe` |
| 5S:ket.3 | "Chị nhà số 14 bữa đó bả có đỡ hông cô?" | `maiQuaNha14` ✓ | — | — | ĐÚNG — mẫu neo đúng của cả file |
| 5S:ket.4 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 5.1 | "Dạ chị Lan. Chị ấy sao hả cô?" | — | — | `flag maiKeLan` (mở cuộc ở `chi-lan.json`) | ĐÚNG |
| 5.1.1 | "Dạ cô ơi, chuyện của chị ấy mà." | — | — | — | ĐÚNG |
| 5.1.1.1 | "Cô lo thiệt thì cô đừng kể. Cô hỏi chị ấy một tiếng." | — | — | **thiếu** `flag maiBotKe` | **SỬA** — câu chạm nhất cuộc mà không đổi gì ở cô Mai ngày mai |
| 5.1.1.2 | "Dạ con biết rồi cô. Con để ý chị ấy giùm cô." | — | — | `flag maiNhoLan` (đọc ở `chi-lan.json`) | **CẦN CODE** — hứa "để ý giùm" mà không ai kiểm người chơi có tử tế với chị Lan thật không; cần `PROMISE` loại việc có hạn ngày |
| 5.1.1.3 | "Cô rảnh ghê. Cô lo chuyện người ta hoài." (GAT) | — | — | `anger 30` · lá cuối | ĐÚNG |
| 5.1.2 | "Cô biết hết trơn ha cô…" (DUA) | — | — | — | ĐÚNG |
| 5.1.3 | "Rồi còn gì nữa cô? Cô kể tiếp đi cô." | — | — | `flag maiKeTiep` (đọc ở `thay-phuc.json`) | **SỬA** — neo đúng nhưng **tone sai**: khai `CHUI` trong khi đây là hùa theo hóng chuyện, không chửi ai; phải là `DUA` |
| 5.2 | "Dạ con hổng muốn nghe chuyện riêng của khách cô." | — | — | — | ĐÚNG |
| 5.2.1 | "Hổng phải con chê cô đâu. Tại khách tin con." | — | — | `flag maiNeNguoiChoi` (tắt `mai.tieutam`) | ĐÚNG |
| 5.2.2 | "Dạ cô kể chuyện khác đi cô. Chuyện lan của cô nè." | — | — | — | ĐÚNG |
| 5.2.3 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 5.3 | "Cô kể cô nhỏ nhỏ giùm con. Chị ấy sắp tới rồi đó cô." | **thiếu** — chị Lan sắp tới thật? | — | **thiếu** — "cô đi cô đi" | **CẦN CODE** — khai một sự thật về lịch người khác (không có khoá) và bắt cô Mai rời đi (`WALK_ON` chưa có) |
| 5.3.1 | "Dạ cô đi lẹ đi cô." (DUA) | — | — | **thiếu** `WALK_ON` — "cô xách giỏ cô dọt" | **CẦN CODE** — cô nói dọt rồi vẫn đứng đó |
| 5.3.2 | "Dạ cô cầm ổ bánh rồi hẵng đi cô." | — | **thiếu** `p.holdsFilled` | **thiếu** `GIVE_BREAD` + `WALK_ON` | **CẦN CODE** — mời cầm bánh khi tay mình không có ổ nào |
| 5.3.3 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 5.4 | "Cô đừng kể chuyện khách của con nghen cô." (GAT) | — | — | **thiếu** `flag maiNeNguoiChoi` | **SỬA** — cùng yêu cầu với 5.2.1 mà không đặt cờ; cấm xong hôm sau cô kể lại y như cũ |

### mai.sobay — trang sổ nợ của bà Bảy (FULL · day 10–40 · minVisits 3)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 6S:ket.1 | "Dạ con hiểu rồi cô." | — | — | — | ĐÚNG |
| 6S:ket.2 | "Cô tốt thiệt đó cô." | — | — | — | ĐÚNG |
| 6S:ket.3 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 6.1 | "Trang của ai vậy cô?" | — | — | — | ĐÚNG |
| 6.1.1 | "Sao cô hổng đòi hả cô?" | — | — | — | ĐÚNG |
| 6.1.1.1 | "Cô nói vậy mà cô nói cô hổng tốt." | — | — | `mem CARED_FOR_THEM` | ĐÚNG |
| 6.1.1.2 | "Cô ghi vô rồi cô để đó hoài hả cô?" | — | — | — | ĐÚNG |
| 6.1.1.3 | "Vậy con trả giùm cô một phần nghen cô." | `needCash 50 000` ✓ | ✓ két đủ (ẩn nút nếu không) | `PAY 50 000` · ngay · `flag maiTraGiumBay` (đọc ở `ba-bay.json`) | **ĐÚNG** — nút duy nhất của cả file thoả đủ ba phần |
| 6.1.1.4 | "Bả quỵt cô đó cô. Cô hiền quá bị người ta ăn hiếp." (CHUI) | — | — | `rel −3` | ĐÚNG — CHUI đúng nghĩa, và cô Mai bênh lại là hệ quả đọc được |
| 6.1.2 | "Dạ con cũng có mấy người mua chịu cô." | **thiếu** `p.owed >= 1` | — | — | **SỬA** — cùng lỗi 3.1.1.2 |
| 6.1.3 | "Cô kể con nghe chi, con biết rồi con kỳ lắm cô." | — | — | — | ĐÚNG |
| 6.2 | "Dạ con chưa có cô. Con nhớ trong đầu thôi." | **thiếu** `!maiSoNo` | — | — | **SỬA** — vẫn nói "con chưa có sổ" sau hôm đã hứa mua sổ; `need` hiện chưa phủ định được |
| 6.2.1 | "Dạ chiều nay con ra mua cuốn sổ nghen cô." | — | — | `flag maiSoNo` (đọc ở `chu-tu.json`) | **CẦN CODE** — hứa một việc có hạn ("chiều nay") mà cuốn sổ không tồn tại trong game và không ai đòi |
| 6.2.1.1 | "Dạ cô chỉ con ghi sao cho đúng đi cô." | — | — | — | ĐÚNG |
| 6.2.1.2 | "Ghi cảm nghĩ là sao cô?" (DUA) | — | — | — | ĐÚNG |
| 6.2.1.3 | "Dạ con biết rồi cô." | — | — | — | ĐÚNG |
| 6.2.2 | "Dạ con nhớ dai lắm cô. Con hổng cần sổ đâu." (DUA) | — | — | — | ĐÚNG |
| 6.2.3 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 6.3 | "Chuyện sổ sách của con để con lo cô." (GAT) | — | — | `anger 25` · lá cuối | ĐÚNG |

### mai.moiloi — người chơi bắt chuyện (PLAYER_ONLY · SHORT · day 4–40)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 7.1 | "Sáng giờ hẻm mình có gì mới hông cô?" (DUA) | — | — | **thiếu** — "để cô kể" rồi cuộc hết | **SỬA** — cô hứa kể rồi im; nối sang một cuộc tiêu tám, hoặc đổi lời đáp |
| 7.2 | "Hàng họ cô sao rồi cô? Có thiếu món gì hông?" | — | — | — | ĐÚNG |
| 7.3 | "Cô bớt kể chuyện người ta lại giùm con cái cô." (GAT) | **thiếu** `maiKeLan`/`maiKeTiep` | — | `anger 25` | **SỬA** — nhắc nhở một chuyện cô có thể chưa hề làm, mà vẫn tính 25 giận |

### mai.moiloi2 — người chơi bắt chuyện, lớp sau (PLAYER_ONLY · SHORT · day 11–40 · minVisits 3)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 8.1 | "Tuần này cô chạy được mấy bữa rồi cô?" (DUA) | **thiếu** cờ đã nghe `mai.chaybo` | — | — | **SỬA** — `mai.chaybo` không đặt cờ nào, nên câu này hỏi về một chuyện có thể chưa ai kể |
| 8.2 | "Cuốn sổ nợ của cô còn trang nào chưa xoá hông cô?" | **thiếu** cờ đã nghe `mai.sobay` | — | — | **SỬA** — sự kiện cụ thể, phải có cờ; `mai.sobay` chưa đặt cờ nào |
| 8.3 | "Cô đứng nói chuyện mà khách con đi hết rồi cô." (GAT) | **thiếu** — có khách bỏ đi thật? | **thiếu** `w.queue >= 2` | `anger 25` | **SỬA** — đúng loại lỗi chủ dự án nêu ("bảo chị chen hàng trong khi chị không chen") |

---

## 1. Thống kê

| phán | số nút | % |
|---|---|---|
| `ĐÚNG` | **73** | 70,2 % |
| `SỬA` | **21** | 20,2 % |
| `XOÁ` | **0** | 0 % |
| `CẦN CODE` | **10** | 9,6 % |
| **tổng** | **104** | |

Chia theo cuộc: `mai.tieutam` 18/5/0/1 · `mai.lan` 12/2/0/1 · `mai.sotay` 10/2/0/0 ·
`mai.chaybo` 5/0/0/3 · `mai.kelan` 11/5/0/4 · `mai.sobay` 16/2/0/1 · `mai.moiloi` 1/2/0/0 ·
`mai.moiloi2` 0/3/0/0 (theo thứ tự ĐÚNG/SỬA/XOÁ/CẦN CODE).

Hai cuộc `moiloi` (PLAYER_ONLY) là chỗ tệ nhất tỉ lệ: **1/6 nút đạt**. Lý do giống nhau:
chúng hỏi lại những chuyện cuộc khác kể, mà cuộc kể **không đặt cờ nào**.

**Trí nhớ trong một cuộc (§3.3): file này SẠCH.** Cả 8 nút `GAT` (1.1.1.1.3, 1.3.3,
2.1.1.3, 3.3, 5.1.1.3, 5.4, 6.3, 7.3, 8.3) và 3 nút `CHUI` (1.1.1.2, 5.1.3, 6.1.1.4) đều
là **lá cuối** — không có nhánh `AM` nào nối sau chúng. Không nút nào cần `need: "!c.angered"`.
Đây là khuôn nên giữ khi sửa các file khác.

## 2. Đề xuất khoá mới

| khoá đề xuất | nghĩa | nút cần | vì sao §3 không đủ |
|---|---|---|---|
| `p.owed >= N` | sổ nợ của chính người chơi còn ngần đó chưa thu | 3.1.1.2 · 6.1.2 | §3.1 chỉ có `p.cash >= N` (tiền trong két), không có tiền người ta nợ mình |
| `w.npcDue(X)` | người X sắp tới quầy theo lịch (trong ~N phút game) | 5.3 | §3.2 chỉ mô tả **người đang đứng trước mặt**; không có khoá nào nói về người thứ ba sắp tới |
| `w.lostCustomer` | có khách bỏ hàng đi trong N giây vừa rồi | 8.3 | `w.queue >= N` chỉ đếm người ĐANG đứng, không ghi người ĐÃ bỏ đi — mà câu buộc tội nói về chuyện đã xảy ra |
| `need` nhận dấu `!` | phủ định một cờ | 6.2 (`!maiSoNo`) | `visibleOptions` hiện chỉ làm `!!gate.flags[o.need]`; không viết được "chỉ hiện khi CHƯA có" |
| `need` nhận `A\|B` | một trong hai cờ | 1.1.1.1.2 · 1.1.1.1.3 · 7.3 (`maiKeLan\|maiKeTiep`) | cùng một lời buộc tội có hai nguồn sự thật, hiện phải chép đôi nút |

**Cờ nội dung cần thêm (không phải khoá mới, chỉ là `flag` chưa ai đặt):**
`maiBotKe` (cô hứa bớt kể — 1.3.1, 5S:ket.2, 5.1.1.1, 5.4) ·
`maiBiGat` (cô kể chuyện bị gạt 4 triệu — 2.1.1.2, và để 8.x hỏi lại) ·
`maiChayBo` (đã nghe chuyện chạy bộ — cho 8.1) ·
`maiTrangNo` (đã nghe chuyện trang nợ — cho 8.2) ·
`maiChiPhongTro` (cô đã chỉ chỗ trọ — 2.3, cho nhánh chị Lan đọc lại).

## 3. Hành động cần code

| hành động | nút cần | thời lượng đề xuất | thiếu gì trong game |
|---|---|---|---|
| `PROMISE_DEED{ việc, hạn }` — hứa làm một việc ngoài ổ bánh, treo lại và **kiểm đúng hạn**; lỡ hạn ⇒ `BROKEN_PROMISE` | 1.1.1.1.1 (đi cùng cô chiều nay) · 4.1.2 (chạy bộ thứ Hai 4h30) · 5.1.1.2 (để ý chị Lan) · 6.2.1 (chiều nay mua sổ) | hạn tính bằng **ngày** (1–7 ngày), không phải giây | `TalkAct.PROMISE` hiện chỉ treo **món kẹp vô ổ** và kiểm ở `settlePayment`/lúc đưa bánh. Không có chỗ treo lời hứa qua đêm, không có đường `BROKEN_PROMISE` cho việc |
| `ORDER_CHANGE{ sl, bớt/thêm }` — khách đổi đơn giữa cuộc trò chuyện | 4.2 (thành 2 ổ) · 4.2.2 (ổ thứ hai không hành) | ngay, áp vào đơn của lượt ghé này | đơn hàng chốt ở `phase: ordering`; không có đường sửa đơn từ một nút thoại. `PROMISE` chỉ THÊM món, không BỚT |
| `GIVE_BREAD` | 5.3.2 | tới khi ăn xong | §3.5 ghi **CHƯA**; và cần `while: p.holdsFilled` thì câu mời mới không rỗng |
| `WALK_ON` | 5.3 · 5.3.1 · 5.3.2 | ngay, kết thúc cuộc | §3.5 ghi **CHƯA**. Cô Mai nói "cô dọt" ba lần ở ba nhánh rồi vẫn đứng nguyên |
| `GIVE_ITEM{ món }` — NPC đưa người chơi một vật ngoài đồ ăn | 2.2.2 (nhánh trầu bà) | ngay | không có trong §3.5 và không có túi đồ để nhận. Nếu không làm thì **sửa lời đáp**, đừng hứa |
| `while` nói chung | 6 nút ở file này (1S:ket.3, 5S:ket.1, 1.1.4, 4.2, 4.2.2, 5.3.2) | — | **`while` chưa tồn tại trong `src/sim/talk.ts` lẫn `src/sim/service.ts`**: `TalkNode.while` đã khai kiểu nhưng `visibleOptions`/`talkGate` không đọc nó, và cơ chế "?" của §4 chưa có. Mọi dòng `while` trong file rà này là **đề xuất**, chưa chạy được |

---

## 4. §4.1 — "?" là lưới an toàn: xếp lại TĨNH vs ĐỘNG

Áp luật bổ sung (*"hạn chế hiện câu gợi ý trả lời lạc đề"*, mốc: nhịp kết bằng `?` phải
dưới 5 %) cho mọi dòng `while`/`need` đề xuất ở trên.

| sự thật đề xuất | nút | TĨNH / ĐỘNG | khai bằng | lý do |
|---|---|---|---|---|
| `p.cash >= N` (qua `needCash`) | 6.1.1.3 | **TĨNH** | **`needCash`** ✓ đã đúng | két không đổi trong lúc thẻ mở |
| `p.holdsFilled` · `p.owed >= 1` | 5.3.2 · 3.1.1.2 · 6.1.2 | **TĨNH** | **`need`** → ẩn hẳn | thẻ thoại khoá phím; tay và sổ nợ của người chơi đứng yên |
| `!maiSoNo` · `maiKeLan\|maiKeTiep` · các cờ "đã kể" | 6.2 · 1.1.1.1.2 · 1.1.1.1.3 · 7.3 · 8.1 · 8.2 | **TĨNH** | **`need`** → ẩn hẳn | quá khứ không đổi |
| `t.served` | 1S:ket.3 · 5S:ket.1 | **ĐỘNG** | **`while`** → "?" | đổi đúng vào lúc mình đưa ổ ra |
| `w.queue >= 1` · `>= 2` | 1.1.4 | **ĐỘNG** | **`while`** → "?" | hàng người đổi trong lúc đọc |
| `w.lostCustomer` | 8.3 | **ĐỘNG** | **`while`** → "?" | xảy ra giữa cuộc được |
| `t.ordering` (chưa chốt đơn) | 4.2 · 4.2.2 | **ĐỘNG** | **`while`** → "?" | cô Mai chuyển từ `ordering` sang `waiting` ngay giữa cuộc |
| `w.npcDue(CHI_LAN)` | 5.3 | **ĐỘNG** | **`while`** → "?" | chị Lan tới thật giữa lúc đang đọc — và đó chính là điểm của câu |

**Tổng: 15 dòng đề xuất → 9 nên là `need`/`needCash` (ẩn hẳn), 6 nên là `while` (ra "?").**

Riêng hai cuộc `moiloi` (PLAYER_ONLY) thì **toàn bộ** chỗ hỏng là TĨNH — chúng chỉ hỏi lại
chuyện cũ. Nên cách chữa đúng là **ẩn nút**, không phải "?": người chơi bấm F với cô Mai
mà thấy một câu hỏi về chuyện mình chưa từng nghe là lỗi bày hàng, không phải lỗi bấm.

## 5. §4bis — LỜI HỨA CÓ HẠN

Cô Mai `thanThien 0,8` · `deTha 0,6` · `nongTinh 0,4` · `patience 50`. Theo bảng §4bis là
**người dễ tha: nhắc hai lần, rồi thôi, nhưng VẪN NHỚ** — và vì cô là **cái loa của cả
hẻm**, nấc "vẫn nhớ" của cô có một hình phạt riêng không ai khác có: **cô kể lại**.

| nút | hứa gì | hạn | giữ lời thì sao | NUỐT LỜI thì sao (dễ tha, 3 nấc — nấc cuối: cô kể cho cả hẻm) |
|---|---|---|---|---|
| 1.1.1.1.1 "Hay mình qua coi chị đó sao cô?" | **đi cùng cô** qua nhà số 14 chiều nay | **cùng ngày** (chiều) | `flag maiQuaNha14` ⇒ 5S:ket.3 mở ra | nấc 1 (sáng hôm sau): *"Ủa chiều qua con bận hả?"* · nấc 2: `rel −2` · nấc 3: cô kể cho bà Bảy rằng mình hứa rồi không đi |
| 4.1.2 "Cô dạy con chạy với đi cô" | có mặt **4h30 sáng thứ Hai sau** | **tới thứ Hai kế** | `rel +4`, `mem` | **free word nặng nhất file**: không cờ, không hạn, không ai đòi. Nấc 2 phải là một câu thứ Hai sau: *"Cô đứng chờ con tới năm giờ đó con."* |
| 5.1.1.2 "Con để ý chị ấy giùm cô" | đối tốt với chị Lan | **3 ngày** | `flag maiNhoLan` ⇒ `chi-lan` 2.3 mở ra ✓ | kiểm được thật: nếu trong 3 ngày không có một cuộc `AM` nào với chị Lan (hoặc gọi sai tên chị) ⇒ cô hỏi lại, rồi thôi, rồi **nhớ** |
| 6.2.1 "Dạ chiều nay con ra mua cuốn sổ nghen cô" | mua cuốn sổ **chiều nay** | **cùng ngày** | `flag maiSoNo` ⇒ `chu-tu` 681 mở ra | sáng mai cô hỏi *"Mua sổ chưa con?"*; không có sổ ⇒ nấc 2. Game không có cuốn sổ nào để mua — nên hoặc **làm cái sổ**, hoặc **đổi lời** |
| 2.1.1.2 "Cô kể con nghe nè, con giữ giùm cho" | giữ bí mật chuyện cô bị gạt 4 triệu | **cả mùa** | cô kể tiếp | hiện **không có cách nào bẻ** — thêm `flag maiBiGat` thì bẻ được, đúng mẫu `maiKeLan` → `chi-lan` 4.1.3 |
| 5.3.2 "Dạ cô cầm ổ bánh rồi hẵng đi cô" | đưa ổ **ngay**, trước khi cô dọt | **~10 s** | cô cầm ổ đi, đủ cảnh | quá 10 s cô đi tay không: `rel −2`, và hôm đó **cô không mua** — hậu quả đọc ra ngay ở két |
| 4.2.2 "Dạ hai ổ liền cô" (ổ thứ hai không hành) | hai ổ, ổ thứ hai không hành | **tới lúc đưa bánh** | nên là `PROMISE` + `ORDER_CHANGE` | `PROMISE` hiện chỉ treo món **THÊM**, không treo món **BỚT**. Đưa ổ có hành ⇒ phải `BROKEN_PROMISE` |
| 1.3.1 / 5S:ket.2 / 5.1.1.1 / 5.4 "cô bớt kể đi cô" | *(cô hứa, không phải người chơi)* | **cả mùa** | `flag maiBotKe` ⇒ giảm trọng số cuộc tiêu tám | **game đang nuốt lời với người chơi**: cô hứa bớt kể bốn lần ở bốn nhánh, hôm sau kể y như cũ |

**Tám lời hứa, không lời nào có hạn.** Bốn trong số đó (`maiQuaNha14`, `maiNhoLan`,
`maiSoNo`, `maiKeLan`) **có cờ và có người đọc lại** — tức một nửa cây cầu đã xây. Cái
thiếu đúng là **cái hạn** và **đường thất bại**.

**Thiếu trong game:** chỉ báo "đang treo một lời hứa" ở khung nhắc. Với cô Mai thì nấc 3
(cô kể lại cho cả hẻm) là hình phạt hay nhất và **đã có hạ tầng**: `night.ts:36` đã có
`extraTransmissions` — hệ lan tin của hẻm.

## 6. §4ter — TRÍ NHỚ BỐN TẦNG

| tầng | chỗ file này cần | nút |
|---|---|---|
| **`c.*` trong cuộc** | **không thiếu chỗ nào** — cả 8 `GAT` và 3 `CHUI` đều là lá cuối; không có nhánh `AM` nào nối sau một câu nặng | — |
| **`v.*` trong lượt ghé** | `v.served` — 1S:ket.3 ("cô ăn đi cô, nguội bánh rồi") và 5S:ket.1 ("dạ cô ăn đi cô, nguội mất") là **hai câu mời ăn gần như y hệt** ở hai cuộc cùng mở ngày 10–12 trở đi; trong một lượt ghé nói được cả hai | 1S:ket.3 ↔ 5S:ket.1 |
| | `v.promised(X)` — tám lời hứa ở §5, không chỗ nào treo | xem §5 |
| | `v.gaveTea` — **cô Mai không có nút mời trà nào**. Không lỗi, nhưng là chỗ trống: cô ở lại lâu nhất hẻm (`initiates` 0,3 và 0,25) | — |
| **`d.*` trong ngày** | **`d.toldMe(ghiSo)` — hỏng rõ nhất.** `mai.sotay` 3.1.2 và `mai.sobay` 6.2.1.1 **dạy y hệt một bài** ("ngày, tên, số tiền" / "tên, ngày, món, số tiền"), hai cuộc cùng mở ngày 8–10 trở đi. Trong một ngày cô dạy ghi sổ hai lần như chưa dạy | 3.1.2 ↔ 6.2.1.1 |
| | `d.toldMe(tieuTam)` — `mai.tieutam` và `mai.kelan` là hai cuộc tiêu tám cùng mở từ ngày 10–12; 7.1 ("hẻm mình có gì mới hông cô") lại mở cửa cho lần thứ ba trong cùng một ngày | 1.x ↔ 5.x ↔ 7.1 |
| | `d.toldMe(chayBo)` / `d.toldMe(soNo)` — 8.1 và 8.2 hỏi lại đúng chuyện `mai.chaybo` / `mai.sobay` vừa kể sáng nay | 4.x ↔ 8.1 · 6.x ↔ 8.2 |
| **`m.*` cả mùa** | `when.minVisits` dùng ở 4/8 cuộc (3, 3, 4, 4) · `when.day` ở 8/8 · `when.notFlag` ở 1 (`maiNeNguoiChoi`) | — |
| | `m.remembers(E)` thiếu ở **5 nút**: 1.1.1.1.2, 1.1.1.1.3, 7.3 (buộc tội cô đã đi kể) · 8.1, 8.2 (hỏi lại chuyện cũ) | |
| | `!m.visits(2)` — **không nút nào** giả định "lần đầu gặp"; cô Mai là hàng xóm đối diện, `when.day >= 4` đã chặn đủ | — |

**Kết luận tầng trí nhớ:** chỗ thủng nặng nhất của cô Mai là **`d.*` (trong ngày)** —
hai cuộc dạy ghi sổ và ba cửa vào chuyện tiêu tám đều mở cùng lúc, nên trong một buổi
sáng cô có thể dạy lại một bài cô vừa dạy và kể lại một chuyện cô vừa kể. Với nhân vật
mà cả tính cách là *"cái loa của cả hẻm"*, lặp lại không phải chi tiết nhỏ — nó làm người
chơi tưởng cô lẩn thẩn, trong khi ý đồ là cô **nhiều chuyện**.

> **Ghi chú phạm vi:** phần được giao cho tôi là 6 file NPC có tên. **`walkin.json` không
> nằm trong phần này** — luật §4ter *"với `walkin.json` thì ngược lại: mọi câu giả định
> ĐÃ QUEN đều SAI"* phải được rà bởi người cầm `walkin.json`/`qua-duong.json`.
