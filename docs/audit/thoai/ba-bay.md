# Rà thoại — BÀ BẢY (`src/content/talks/ba-bay.json`)

**Hợp đồng:** `docs/phase-2-he-npc/P2-07-neo-thoai-vao-the-gioi.md` (đã gồm §4.1 · §4bis ·
§4ter) · **8 cuộc · 149 nút**
**Từ vựng:** chỉ §3. Khoá nào thiếu thì nằm ở mục *Đề xuất khoá mới* cuối file.

**Trạng thái đo được ở file này:** `act` **4 lần** (toàn bộ là `PAY` mua vé số —
1.1 · 1.1.1 · 1.2.1 · 6.2.1), `needCash` **4 lần**, `needEquip` **2 lần** (`GHE_BAN`),
`flag` **5 lần**, `while` **1 lần** (vừa được thêm ở 1.4.1, dùng `p.hasTea` — **khoá này
không có trong §3.1**, đúng ra là `p.holdsTea`), `forSec` **0 lần**.

**Tính cách (quyết định nấc phạt §4bis):** `soi 0.9 · nongTinh 0.6 · deTha 0.8 ·
thanThien 0.7 · patience 90`. Bà **dễ tha** ⇒ nuốt lời với bà là **nhắc hai lần, rồi
thôi, nhưng vẫn nhớ** — không bỏ đi ngay.

**Bốn luật đọc dùng cho cả file:**
1. *Xã giao thuần không phải free word.* Phần lớn 149 nút là bà kể chuyện đời — những câu
   hỏi tiếp trong một mạch chuyện **không nợ gì**, và được chấm `ĐÚNG`.
2. *Câu hứa một việc làm* mà hệ chỉ có `PROMISE` cho món kẹp vô ổ bánh ⇒ `CẦN CODE`.
3. **§4.1 — `need` hay `while`:** tĩnh (`p.holdsTea`, `p.handsEmpty`, `needEquip`,
   `m.remembers`) ⇒ **`need`**, ẩn hẳn. Động (`w.queue`, `w.shadeFree`, `w.rain`) ⇒
   **`while`**, ra `?`.
4. *Kiến thức nền* (bà bán vé số, bà bảy mươi tư, bà mê cải lương, bà hay soi) — hàng xóm
   biết, không cần `need`. *Sự kiện cụ thể* (bà đã kể tuồng, bà đã soi mình, chú Hải vẽ
   pano) — phải có `need` cờ do chính cuộc kể ra chuyện đó đặt.

---

### bay.veso — mua giùm bà tờ vé số (FULL · NPC_ONLY · `initiates 0.3` · w14)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| S:tiep.1 | "Trưa bà ghé nghen, con để phần ổ bánh." | **thiếu** `!p.soldOut` | — | **thiếu** `RESERVE_LOAF` · hạn **tới trưa (tầm giờ)** · giữ lời ⇒ `PROMISE_KEPT`; nuốt lời ⇒ bà nhắc hai lần rồi thôi **nhưng nhớ cả mùa** | **CẦN CODE** — free word nặng: `rel +3` + ký ức `CARED_FOR_THEM 45` cho một ổ bánh **không được giữ chỗ**, và trưa không ai kiểm bà có ghé |
| S:tiep.2 | "Dạ bà đi mạnh giỏi nghen bà." | — | — | **thiếu** `WALK_ON · ngay` | **CẦN CODE** — chào tiễn mà bà vẫn đứng y chỗ cũ |
| S:tiep.3 | "Mai bà kể con nghe cái tuồng bữa trước đi bà." | — | — | `flag: bayCaiLuongTalk` ✓ (đọc lại ở `ong-hai.json:hai.pano`) | ĐÚNG — lời hẹn có chỗ đáp thật |
| S:tiep.4 | "Dạ." (LANH · silent) | — | — | — | ĐÚNG |
| 1.1 | "Dạ bà cho con hai tờ. Chiều con dò." | `needCash 20000` ✓ | — | `PAY 20.000` ✓ | ĐÚNG — **khuôn mẫu của cả kho**: tiền rời két ngay, nút ẩn khi không đủ |
| 1.1.1 | "Bà còn nhiêu tờ nữa bà? Con lấy hết cho." | `needCash 90000` ✓ | — | `PAY 90.000` ✓ | ĐÚNG |
| 1.1.2 | "Trúng rồi con chia bà một nửa nghen." | — | — | — | ĐÚNG — câu giỡn; `reply` cũng giỡn lại. Không hứa chuyện hôm nay |
| 1.1.3 | "Bà bán từ mấy giờ sáng vậy bà?" | — | — | — | ĐÚNG |
| 1.1.4 | "Dạ thôi, con bận rồi bà." | — | **thiếu** `w.queue >= 1` *(động)* | — | **SỬA** — viện cớ bận lúc ngoài quầy không một ai |
| 1.2 | "Dạ để con coi đã bà." | — | — | — | ĐÚNG |
| 1.2.1 | "Dạ thôi bà đưa đây một tờ." | `needCash 10000` ✓ | — | `PAY 10.000` ✓ | ĐÚNG |
| 1.2.2 | "Mười ngàn là một tô hủ tiếu đó bà." | — | — | — | ĐÚNG |
| 1.2.3 | "Bà bán vầy một ngày lời nhiêu bà?" | — | — | — | ĐÚNG |
| 1.2.3.1 | "Trăm tờ… bà đi bộ bao xa mới hết vậy bà?" | — | — | — | ĐÚNG |
| 1.2.3.2 | "Vậy là hơn trăm ngàn một ngày hả bà." | — | — | — | ĐÚNG |
| 1.2.3.3 | "Ít quá bà ơi. Bà kiếm việc khác đi." | — | — | — | ĐÚNG |
| 1.2.3.4 | "Bà kể chuyện tiền nong chi hoài vậy bà." (GAT · `anger 25`) | **thiếu** `c.saidTone` đếm lượt, hoặc `d.toldMe(bayTien)` | — | — | **SỬA** — trách bà "kể hoài" trong khi đây là **lần đầu** bà nhắc tới tiền trong cuộc này; `anger 25` bị tính cho một lời buộc tội sai sự thật |
| 1.2.4 | "Con hổng có chơi mấy cái đó bà." | — | — | — | ĐÚNG |
| 1.3 | "Bà bán vé số mà bà trúng bao giờ chưa bà?" | — | — | — | ĐÚNG |
| 1.3.1 | "Trúng rồi bà tính làm gì hả bà?" | — | — | — | ĐÚNG |
| 1.3.1.1 | "Vậy bà để dành tiền đi coi hát đi, khỏi mua vé." | — | — | — | ĐÚNG |
| 1.3.1.2 | "Bà rủ con đi coi với nghen." | — | — | **thiếu** `PROMISE_DEED(đi coi hát)` + `flag: bayRuCoiHat` · hạn **nhiều ngày** | **CẦN CODE** — `rel +4` + ký ức 45 cho một cuộc hẹn **không cờ, không cuộc nào nhận**. Reply "để bà coi lịch" mà không có cái lịch nào |
| 1.3.1.3 | "Coi hát xong rồi sao nữa bà?" | — | — | — | ĐÚNG |
| 1.3.1.4 | "Mơ vậy thôi bà. Trúng đâu mà trúng." | — | — | — | ĐÚNG |
| 1.3.2 | "Bà bán mà bà hổng tin hả bà?" | — | — | — | ĐÚNG |
| 1.3.3 | "Vậy bà bán đồ xui cho người ta hả bà?" (GAT · lá cuối) | — | — | — | ĐÚNG — xúc phạm đúng nền tính cách, và GAT kết thúc cuộc nên không vướng §3.3 |
| 1.3.4 | "Dạ con giỡn thôi bà." | — | — | — | ĐÚNG — là **anh em cùng nhịp** với 1.3.3, không phải nút SAU nó ⇒ không có chỗ "chửi xong rồi khen" |
| 1.4 | "Dạ thôi bà, con hổng có chơi." | — | — | — | ĐÚNG |
| 1.4.1 | "Mà bà ngồi nghỉ chút đi bà, con rót bà ly trà." | **thiếu** `needEquip: GHE_BAN` (chính file này có khai ở 6.3 và 7.1.1) · **thiếu** `p.holdsTea` · **thiếu** `!v.gaveTea` | `p.hasTea` *(vừa thêm — **khoá này không có trong §3.1**, phải là `p.holdsTea`; và vì là sự thật tĩnh, §4.1 đòi để ở `need`)* | **thiếu** `THEY_SIT · forSec` + `OFFER_TEA · ~8 s` · hạn **~25 s** · nuốt lời ⇒ bà nhắc hai lần rồi thôi, vẫn nhớ | **SỬA** — hai lỗi sửa được **ngay hôm nay** không cần code: (a) thiếu cổng ghế ⇒ mời ngồi khi sân chưa có cái ghế nào (P2-06 §2.17); (b) `while` mới thêm dùng sai tên khoá và sai phía |
| 1.4.2 | "Bữa khác con mua nghen bà." | — | — | **thiếu** `PROMISE_DEED(mua vé bữa sau)` · hạn **1 ngày** · nuốt lời ⇒ bà nhắc, rồi thôi, vẫn nhớ | **CẦN CODE** — hẹn mai mua, không cờ, không ai kiểm |
| 1.4.3 | "Bà đứng hoài trước xe con khách hổng vô được." (GAT · `rel −5` · `anger 40`) | **thiếu** `t.blocking` (khoá mới) | **thiếu** `w.queue >= 1` *(động)* | **thiếu** `STEP_ASIDE · tới khi xong` (**ĐÃ CÓ CODE**) | **SỬA** — đúng lỗi §1 của chủ dự án: *"bảo người ta dạt ra mà không ai dạt"*. Thêm nữa: trách "khách hổng vô được" nói được lúc hẻm vắng tanh, cùng họ với lỗi *"chị chen hàng trong khi bà ấy không hề chen"* |
| 1.4.4 | "…" (IM) | — | — | — | ĐÚNG |

### bay.cailuong — đào bây giờ ca không có hơi (SHORT · BOTH · day 6–40 · minVisits 3)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| S:chao.1 | "Bữa nào bà kể tiếp nghen bà." | — | — | — | ĐÚNG — `bay.moiloi2` 8.1 nhận lại lời hẹn này |
| S:chao.2 | "Dạ con làm tiếp đây bà." | — | — | — | ĐÚNG |
| S:chao.3 | "Bà nói hoài con rối tay quá bà." | — | **thiếu** `w.queue >= 1` | — | **SỬA** — "rối tay" lúc hai tay trống không |
| 2.1 | "Hồi xưa ca sao hả bà?" | **thiếu** `c.openedBy(NPC)` (khoá mới) | — | — | **SỬA** — cuộc `BOTH`: nếu người chơi bấm phím thì đây là câu mở lời, mà nó đang là câu đáp lại ý kiến bà vừa nêu ở `opener` (P2-06 §2.15) |
| 2.1.1 | "Bà thích tuồng nào nhất bà?" | — | — | — | ĐÚNG |
| 2.1.1.1 | "Khóc chỗ nào hả bà?" | — | — | — | ĐÚNG |
| 2.1.1.2 | "Bà mở loa ngoài con nghe ké với bà." | — | **thiếu** `w.queue == 0` | **thiếu** `PLAY_CAILUONG · 30–60 s` (khoá mới) | **CẦN CODE** — reply "Để bà mở nhỏ thôi, sợ phiền hàng xóm" hứa một thứ **người chơi nghe được**; hẻm vẫn im. Nếu không đáng làm ⇒ chuyển thành `XOÁ` |
| 2.1.1.3 | "Khóc chi dữ vậy bà, tuồng mà." | — | — | — | ĐÚNG |
| 2.1.1.4 | "Dạ." (LANH · silent) | — | — | — | ĐÚNG |
| 2.1.2 | "Bà ca thử một câu coi bà." | — | — | — | ĐÚNG — bà **từ chối ngay** ("Bà ca là con bỏ chạy đó") nên không nợ hành động nào |
| 2.1.3 | "Bà có đi coi hát nữa hông bà?" | — | — | — | ĐÚNG |
| 2.1.4 | "Dạ con hổng rành mấy cái đó bà." | — | — | — | ĐÚNG |
| 2.2 | "Con nghe hổng ra đâu bà, con dở lắm." | **thiếu** `c.openedBy(NPC)` | — | — | **SỬA** (§2.15) |
| 2.2.1 | "Bà chỉ con nghe đi bà." | — | — | **thiếu** `PROMISE_DEED(bà dạy nghe cải lương lúc vắng khách)` + cờ · hạn **1 ngày** | **CẦN CODE** — reply hẹn "bữa nào vắng khách bà chỉ"; không cờ, không cuộc nào nối |
| 2.2.2 | "Chắc tại con còn trẻ quá bà ha." | — | — | — | ĐÚNG |
| 2.2.3 | "Dạ." (LANH · silent) | — | — | — | ĐÚNG |
| 2.3 | "Bà chê người ta hoài vậy bà." | **thiếu** `c.openedBy(NPC)` | — | — | **SỬA** (§2.15) |
| 2.3.1 | "Bà nói nghe thấm ghê bà." | — | — | — | ĐÚNG |
| 2.3.2 | "Vậy bà soi con hoài là bà thương con hả bà?" | **thiếu** `m.remembers(baySoi)` | — | — | **SỬA** — "bà soi con hoài" đòi bà **đã soi mình**; `bay.soi` là một cuộc riêng có thể chưa bao giờ chạy (§4ter: nhớ nhầm nặng hơn quên) |
| 2.3.3 | "Bà già rồi khó tính thôi bà." (GAT · lá cuối) | — | — | — | ĐÚNG |
| 2.4 | "Dạ con đang làm bà, bà nói chuyện khác đi." | **thiếu** `c.openedBy(NPC)` | **thiếu** `w.queue >= 1` | — | **SỬA** |

### bay.soi — bà soi cái thớt (SHORT · NPC_ONLY · `initiates 0.25` · day 3–40 · w12)

> **Lỗi cả cuộc:** `opener` khai *"cái thớt con để sát cái thùng rác kìa"* — một **sự thật
> về thế giới** (vị trí thớt, vị trí thùng rác đều có trong `world/stations.ts` và
> `world/map.ts`) mà cuộc **không đọc**. Bà buộc tội mình dù thớt đang để đúng chỗ. Đây
> chính là loại lỗi *"bảo chị chen hàng trong khi bà ấy không hề chen"*.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 3.1 | "Dạ con dời liền. Cảm ơn bà nghen." | **thiếu** `w.boardNearBin` (khoá mới) | — | **thiếu** `MOVE_BOARD · ngay` · hạn **~20 s** · nuốt lời ⇒ bà nhắc lại hai lần, rồi thôi, vẫn nhớ | **CẦN CODE** — nói "con dời liền" mà **cái thớt không nhúc nhích một ô nào** |
| 3.1.1 | "Bà còn thấy gì nữa hông bà? Bà nói con sửa." | — | — | — | ĐÚNG |
| 3.1.1.1 | "Dạ. Mai con đem thêm cái khăn." | — | — | `flag: bayKhanRieng` ✓ (đọc ở `bay.mua` 6.1.1.1) nhưng **thiếu** `PROMISE_DEED` · hạn **1 ngày** · kiểm `needEquip: KHAN_3_MAU` sáng hôm sau | **CẦN CODE** — cờ bật **bằng lời nói**; reply *"Bà coi mai con có đem thiệt hông nghen"* hứa thẳng một cuộc kiểm **không tồn tại**. `KHAN_3_MAU` là thiết bị mua được (mở ngày 5), nên chuyện này kiểm được thật |
| 3.1.1.2 | "Bà soi kỹ hơn thanh tra nữa bà." | — | — | — | ĐÚNG |
| 3.1.1.3 | "Dạ con biết rồi bà." | — | — | — | ĐÚNG |
| 3.1.2 | "Cô Ba hồi đó bà có nói vậy hông bà?" | — | — | — | ĐÚNG — cô Ba là nền chung, không phải sự kiện |
| 3.1.3 | "Dạ." (LANH · silent) | — | — | — | ĐÚNG |
| 3.2 | "Dạ con biết rồi bà." | — | — | — | ĐÚNG |
| 3.2.1 | "Dạ con dời nè bà." | **thiếu** `w.boardNearBin` | — | **thiếu** `MOVE_BOARD · ngay` | **CẦN CODE** — như 3.1 |
| 3.2.2 | "Chút nữa vắng khách con dời bà." | — | — | **thiếu** `PROMISE_DEED(dời thớt)` · hạn **tới lúc `w.queue == 0` + 60 s** · nuốt lời ⇒ bà nhắc, rồi thôi, vẫn nhớ | **CẦN CODE** — reply *"Bà nhắc một lần thôi đó nghen"* đã viết sẵn nấc một của §4bis, chỉ là không có nấc nào nổ |
| 3.2.3 | "Bà nói nhiều quá bà ơi." (GAT · lá cuối) | — | — | — | ĐÚNG |
| 3.3 | "Bà soi dữ ha bà." | — | — | — | ĐÚNG |
| 3.3.1 | "Vậy bà soi tiếp đi bà, con nghe." | — | — | — | ĐÚNG — đồng hồ vẫn chạy (`clock.busy`) nên "con nghe" đã có giá thật |
| 3.3.2 | "Bà làm quản lý luôn đi bà." | — | — | — | ĐÚNG |
| 3.3.3 | "Dạ." (LANH · silent) | — | — | — | ĐÚNG |
| 3.4 | "Bà lo chuyện bà đi được hông bà." (GAT · `rel −6` · `anger 45` · lá cuối) | — | — | — | ĐÚNG — không hứa gì; giá đã trả bằng `rel`/`anger`/`mem` |

### bay.pano — rạp hát hồi xưa (SHORT · NPC_ONLY · day 10–40 · minVisits 4 · `needFlag: haiPano`)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| S:ket.1 | "Bà kể nữa đi bà, con nghe được mà." | — | — | — | ĐÚNG |
| S:ket.2 | "Dạ ổ của bà đây bà." | **thiếu** `t.waiting` — **và bà Bảy KHÔNG BAO GIỜ gọi món**: bà bán vé số, không xếp hàng | **thiếu** `p.holdsFilled` | **thiếu** `GIVE_BREAD` | **CẦN CODE** — câu giả vờ một giao dịch **không hề xảy ra**: không có đơn nào của bà, không có ổ nào trong tay, và không có gì rời tay |
| S:ket.3 | "Dạ." (LANH · silent) | — | — | — | ĐÚNG |
| 4.1 | "Dạ cái pano đó hả bà? Chú Hải nói hồi xưa chú vẽ mấy cái đó đó bà." | `haiPano` ✓ (ở `when.needFlag`) | — | — | ĐÚNG — **khuôn mẫu đúng của §4ter**: cuộc chỉ mở khi mình đã thật sự nghe chú Hải kể |
| 4.1.1 | "Dạ đúng chú đó bà. Chú vẽ cái bảng hiệu xe con luôn." | `haiBietBay` ✓ · **thiếu** `needEquip: BANG_HIEU` | — | — | **SỬA** — nhắc *"cái bảng hiệu xe con"*, mà `BANG_HIEU` là **thiết bị mua được** (750k, mở ngày 14) và **không nằm trong `CART.start`**. Cuộc chạy từ ngày 10 ⇒ nói về một cái bảng chưa tồn tại (P2-06 §2.17) |
| 4.1.1.1 | "Bữa nào bà qua nói với chú một tiếng đi bà." | — | — | `flag: bayHaiGap` ✓ (đọc ở `ong-hai.json:hai.congai`) | ĐÚNG |
| 4.1.1.2 | "Bà qua khen chú một câu coi, chú nở mũi liền bà." | — | — | — | ĐÚNG |
| 4.1.1.3 | "Đời nó vòng vo vậy đó bà." | — | — | — | ĐÚNG |
| 4.1.1.4 | "Dạ chuyện cũ rồi bà." | — | — | — | ĐÚNG |
| 4.1.2 | "Bà còn giữ tấm vé nào hông bà?" | — | — | — | ĐÚNG |
| 4.1.3 | "Dạ con cũng mới nghe chú nói hôm bữa thôi bà." | `haiPano` ✓ | — | — | ĐÚNG |
| 4.2 | "Tấm hình bự cỡ nào hả bà?" | — | — | — | ĐÚNG |
| 4.2.1 | "Bà nhớ kỹ ghê bà." | — | — | — | ĐÚNG |
| 4.2.1.1 | "Nhịn ba bữa để coi một tuồng hả bà." | — | — | — | ĐÚNG |
| 4.2.1.2 | "Con bạn bà giờ sao rồi bà?" | — | — | — | ĐÚNG |
| 4.2.1.3 | "Bà hồi đó chắc đẹp lắm ha bà." | — | — | — | ĐÚNG |
| 4.2.1.4 | "Dạ con làm tiếp đây bà." | — | — | — | ĐÚNG |
| 4.2.2 | "Rạp đó giờ còn hông bà?" | — | — | — | ĐÚNG |
| 4.2.3 | "Bà kể cái gì cũng quay về hát hò hết trơn bà." | **thiếu** `m.remembers(bayCaiLuong)` | — | — | **SỬA** — "cái gì cũng quay về hát hò" đòi bà đã kể chuyện cải lương ít nhất một lần; `bay.cailuong` có thể chưa chạy (§4ter) |
| 4.3 | "Dạ con sanh sau, con hổng biết cái rạp đó bà." | — | — | — | ĐÚNG |
| 4.3.1 | "Bà kể con nghe, con biết thì sao." | — | — | — | ĐÚNG |
| 4.3.2 | "Dạ bà kể ngắn ngắn giùm con nghen bà." | — | **thiếu** `w.queue >= 1` | — | **SỬA** — xin kể ngắn vì bận, lúc không bận |
| 4.4 | "Bà ơi con đang đông khách quá bà." | — | **thiếu** `w.queue >= 2` | — | **SỬA** — "đang đông khách" lúc hẻm vắng |

### bay.dienthoai — cái điện thoại con gái gửi (FULL · NPC_ONLY · day 15–40 · minVisits 6 · `initiates 0.22`)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| S:ket.1 | "Mai bà đem ra con chỉ cho bà nghen." | — | — | **thiếu** `PROMISE_DEED(chỉ bà xài điện thoại)` + cờ · hạn **1 ngày** · nuốt lời ⇒ bà nhắc hai lần, rồi thôi, **vẫn nhớ** | **CẦN CODE** — **free word nặng nhất file**: `rel +4` + ký ức `CARED_FOR_THEM 55` cho một buổi hướng dẫn **không cờ, không cuộc nối, không ai kiểm**. Reply "…Thiệt hả con. Ờ. Mai bà đem." làm lời hứa thành một cái hẹn rõ ràng — rồi mai không có gì |
| S:ket.2 | "Bà hỏi con gái bà đi bà, nó chỉ cho." | — | — | — | ĐÚNG |
| S:ket.3 | "Dạ." (LANH · silent) | — | — | — | ĐÚNG |
| 5.1 | "Sao bà hổng xài bà?" | — | — | — | ĐÚNG |
| 5.1.1 | "Hổng hư đâu bà. Con bấm thử cho bà coi." | **thiếu** `p.handsEmpty` *(tĩnh)* | **thiếu** `w.queue == 0` | — | **SỬA** — mời bấm điện thoại giùm trong khi hai tay đang cầm ổ bánh. Bà **từ chối ngay** ("Thôi để bữa khác") nên không nợ hành động |
| 5.1.1.1 | "Bữa khác thiệt nghen bà. Con nhớ đó." | — | — | **thiếu** `PROMISE_DEED` + cờ · hạn **1 ngày** | **CẦN CODE** — lại hẹn "bữa khác", không cờ. Reply "Bà hổng dám hẹn ai lâu" làm chỗ này đau hơn: bà nói thẳng là bà tin |
| 5.1.1.2 | "Bà sợ hư máy hay bà sợ thấy mặt con gái bà hả bà?" | — | — | — | ĐÚNG |
| 5.1.1.2.1 | "Dạ con xin lỗi bà. Con nói đại." | — | — | — | ĐÚNG |
| 5.1.1.2.2 | "Thấy mặt rồi bà lại nhớ, phải hông bà." | — | — | — | ĐÚNG |
| 5.1.1.2.3 | "Vậy thôi bà cứ để trong tủ đi bà." | — | — | — | ĐÚNG |
| 5.1.1.3 | "Con mở lò rồi bà. Chút nữa nghen bà." | — | **thiếu** `w.ovenBusy` (khoá mới) | — | **SỬA** — viện cớ "con mở lò rồi" lúc lò nguội tanh |
| 5.1.2 | "Mấy triệu mà bà để trong tủ, uổng thiệt bà." | — | — | — | ĐÚNG |
| 5.1.3 | "Bà đem bán lại mua vé số bán cho rồi bà." | — | — | — | ĐÚNG |
| 5.2 | "Con gái bà ở đâu hả bà?" | — | — | — | ĐÚNG |
| 5.2.1 | "Vậy bà ở nhà một mình hả bà?" | — | — | — | ĐÚNG |
| 5.2.1.1 | "Vậy bà ghé con mỗi sáng là đúng rồi bà." | `minVisits 6` ✓ ở cấp cuộc | — | — | ĐÚNG — một trong số ít câu nhắc quá khứ **đã có cổng** |
| 5.2.1.2 | "Bà kêu nó về ở với bà đi bà." | — | — | — | ĐÚNG |
| 5.2.1.3 | "Nó cũng tệ ghê, để bà vậy." (CHUI · lá cuối) | — | — | — | ĐÚNG — `CHUI` đúng nghĩa (chửi người thứ ba), và bà bênh con ⇒ mất điểm. Không có nhánh `AM` nối sau |
| 5.2.2 | "Ca đêm cực lắm đó bà." | — | — | — | ĐÚNG |
| 5.2.3 | "Dạ." (LANH · silent) | — | — | — | ĐÚNG |
| 5.3 | "Bà đưa đây con coi thử cái máy." | **thiếu** `p.handsEmpty` | — | — | **SỬA** — đòi cầm máy trong khi tay đang cầm ổ. Bà né ("Bà đâu có đem") nên không nợ hành động |
| 5.3.1 | "Dạ bà cất kỹ cũng phải bà." | — | — | — | ĐÚNG |
| 5.3.2 | "Vậy bà kể con nghe chi bà." | — | — | — | ĐÚNG |
| 5.4 | "Dạ con hổng rành mấy cái đó đâu bà." | — | — | — | ĐÚNG |

### bay.mua — bà đứng ké cái mái (FULL · NPC_ONLY · day 4–40 · `when.rain: true` · w13)

> **Lỗi cả cuộc:** `opener` là *"Bà đứng ké cái mái con chút nghen."* — **`src/world/map.ts`
> không có cái mái nào**, và không có ô nào cho một người đứng trú. Cả cuộc dựng trên một
> vật không tồn tại.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| S:ket.1 | "Tạnh rồi bà đi nghen bà. Đừng đi lúc còn mưa." | — | **thiếu** `w.rain` + `w.shadeFree` *(động)* | **thiếu** `STAND_IN_SHADE (trú) · tới khi tạnh` → `LEAVE_SHADE` + `WALK_ON` | **CẦN CODE** — câu hẹn "tạnh rồi bà đi": thế giới không giữ bà lại, cũng không tiễn bà đi. `calm 22` được trả trước |
| S:ket.2 | "Dạ bà cứ đứng đó bà." | — | **thiếu** `w.shadeFree` | **thiếu** `STAND_IN_SHADE` | **CẦN CODE** |
| S:ket.3 | "Dạ." (LANH · silent) | — | — | — | ĐÚNG |
| 6.1 | "Dạ bà đứng đi bà. Vô sát trong này cho khỏi tạt." | — | `w.rain` ✓ (ở `when`) · **thiếu** `w.shadeFree` | **thiếu** `STAND_IN_SHADE · tới khi tạnh` | **CẦN CODE** — `rel +3` và `calm 25` cho một chỗ đứng không có trên bản đồ |
| 6.1.1 | "Trời ơi bà. Mưa mà bà còn soi nữa bà." | — | — | — | ĐÚNG |
| 6.1.1.1 | "Thôi bà soi tiếp đi bà, con dời cái thùng." | `bayKhanRieng` — **cờ lệch chủ đề** (cờ nói chuyện cái khăn, câu nói chuyện cái thùng đá) | — | **thiếu** `MOVE_ICEBOX · ngay` · hạn **~20 s** | **CẦN CODE** — hứa dời thùng đá, thùng không nhúc nhích; và `need` đang khoá nhầm cờ |
| 6.1.1.2 | "Bà làm giám sát công trình được luôn đó bà." | — | — | — | ĐÚNG |
| 6.1.1.3 | "Dạ chút nữa con coi bà." | — | — | **thiếu** `PROMISE_DEED(coi chỗ dột)` · hạn **tới cuối buổi** · nuốt lời ⇒ bà nhắc, rồi thôi, vẫn nhớ | **CẦN CODE** — reply *"Bà nhắc một lần thôi đó nghen"* lại là nấc một của §4bis viết sẵn mà không nổ |
| 6.1.2 | "Dạ con dời liền. Cảm ơn bà nghen." | — | — | **thiếu** `MOVE_ICEBOX · ngay` | **CẦN CODE** |
| 6.1.3 | "Bà đứng trú nhờ mà bà chê con hả bà." (GAT · lá cuối) | **thiếu** `t.inShade` | — | — | **SỬA** — trách bà "đứng trú nhờ" trong khi **chưa có chỗ nào để bà trú**; `t.inShade` đã có trong §3.2 mà không nút nào trong cả kho dùng |
| 6.2 | "Xấp vé của bà ướt hết rồi kìa bà." | — | `w.rain` ✓ | — | ĐÚNG |
| 6.2.1 | "Dạ bà đưa đây một tờ. Ướt con cũng dò được mà." | `needCash 10000` ✓ | — | `PAY 10.000` ✓ | ĐÚNG — nút hay nhất file: act thật, và reply "con là người đầu tiên bữa nay chịu lấy tờ ướt" nối đúng vào `w.rain` |
| 6.2.1.1 | "Ướt khô rồi cũng vậy hà bà." | — | — | — | ĐÚNG |
| 6.2.1.2 | "Bà về sớm đi bà. Mai bán tiếp." | — | — | **thiếu** `WALK_ON / GO_HOME · ngay` | **CẦN CODE** — bảo bà về, bà vẫn đứng đó tới hết lịch. `calm 20` + ký ức 45 trả trước |
| 6.2.1.3 | "Dạ bà cất cho kỹ nghen bà." | — | — | — | ĐÚNG |
| 6.2.2 | "Bà bọc bịch lại đi bà." | — | — | — | ĐÚNG |
| 6.2.3 | "Trời mưa mà bà còn đi chi cho cực vậy bà." | — | `w.rain` ✓ | — | ĐÚNG |
| 6.3 | "Bà ngồi cái ghế này đi bà, con lau rồi." | `needEquip: GHE_BAN` ✓ | **thiếu** ghế đang trống | **thiếu** `THEY_SIT · 30–60 s` (khoá mới) | **CẦN CODE** — cổng đạo cụ đúng rồi, nhưng **không có hành động ngồi**; bà "từ chối" nên lời mời không bao giờ phải thật |
| 6.3.1 | "Bà ngồi đi bà. Con hổng có khách đâu." | **thiếu** `needEquip: GHE_BAN` — **`needEquip` KHÔNG kế thừa từ nút cha** | **thiếu** `w.queue == 0` | **thiếu** `THEY_SIT · forSec` | **SỬA** — mời ngồi cái ghế chưa mua, và khẳng định "con hổng có khách" trong lúc ba người đang đứng chờ |
| 6.3.2 | "Bà đứng hoài chân bà hư đó bà." | — | — | — | ĐÚNG |
| 6.3.3 | "Bà còn ghé tiệm cô Mai mua gạo nữa hông bà?" | `maiTraGiumBay` ✓ | — | — | ĐÚNG |
| 6.3.4 | "Dạ bà muốn đứng thì bà đứng." (LANH · silent) | — | — | — | ĐÚNG |
| 6.4 | "Bà đứng đó khách hổng thấy xe con bà ơi." (GAT · `rel −6` · `anger 45`) | **thiếu** `t.blocking` (khoá mới) | **thiếu** `w.queue >= 1` | **thiếu** `STEP_ASIDE · tới khi xong` (**ĐÃ CÓ CODE**) | **SỬA** — lỗi §1 lần thứ hai trong cùng một file (xem 1.4.3): bảo người ta dạt ra, không ai dạt; trách "khách hổng thấy xe" lúc không có khách nào |

### bay.moiloi — người chơi bắt chuyện (SHORT · PLAYER_ONLY · day 3–40 · w25)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 7.1 | "Bữa nay bà ế hông bà?" | — | — | — | ĐÚNG |
| 7.1.1 | "Bà ngồi cái ghế này nghỉ chút đi bà." | `needEquip: GHE_BAN` ✓ | **thiếu** ghế đang trống | **thiếu** `THEY_SIT · 30–60 s` · hạn — · nuốt lời không áp dụng (bà tự quyết) | **CẦN CODE** — `calm 10` trả cho một chỗ ngồi không có hành động nào |
| 7.1.2 | "Cái chân bà đi nổi tới chiều hông bà?" | — | — | — | ĐÚNG |
| 7.1.3 | "Bà đứng ké bóng cái xe cho đỡ nắng bà." | — | **thiếu** `w.hot` + `w.shadeFree` | **thiếu** `STAND_IN_SHADE · 20–30 s` → `LEAVE_SHADE`, về mục đích cũ | **CẦN CODE** — ⚠ chỗ chủ dự án chỉ đích danh: *"vào đứng cho mát"*. Reply *"Ờ. Bà dời qua đó chút vậy."* nói thẳng là bà dời — **bà không dời đi đâu hết**, và `calm 10` đã được trả |
| 7.1.4 | "Thôi bà. Con làm tiếp đây." | — | — | — | ĐÚNG |
| 7.2 | "Bà đi hết mấy vòng rồi bà?" | — | — | — | ĐÚNG |
| 7.3 | "Bà soi gì nữa bà. Con sửa hết rồi nè." (GAT · `anger 20`) | **thiếu** `c.saidTone(...)` của bà trong cuộc này, **và** `w.boardNearBin == false` | — | — | **SỬA** — cuộc này do **người chơi mở**, bà chưa soi câu nào ⇒ cãi một lời chưa ai nói; và "con sửa hết rồi" không đối chiếu với trạng thái sạch/bẩn thật |

### bay.moiloi2 — bắt chuyện lần hai (SHORT · PLAYER_ONLY · day 7–40 · minVisits 3 · w20)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 8.1 | "Cái tuồng bữa trước bà coi tới đâu rồi bà?" | **thiếu** `bayCaiLuongTalk` **hoặc** `m.remembers(bayCaiLuong)` | — | — | **SỬA** — hỏi "cái tuồng bữa trước" khi bà chưa kể tuồng nào. **Cờ đã có sẵn** (`bayCaiLuongTalk`, đặt ở `bay.veso` S:tiep.3) mà nút không dùng — sửa được ngay, một dòng |
| 8.2 | "Bữa qua có tờ nào trúng hông bà?" | **thiếu** `m.remembers(muaVeSo)` | — | — | **SỬA** — hỏi kết quả một tờ vé **mình chưa bao giờ mua**. Game biết rõ chuyện này: `act: PAY` ở 1.1/1.1.1/1.2.1/6.2.1 là chỗ đặt cờ |
| 8.3 | "Hổng có gì đâu bà. Con lộn người." | — | — | — | ĐÚNG |

---

## 1. Thống kê

| | số nút | tỉ lệ |
|---|---|---|
| **Tổng** | **149** | 100 % |
| `ĐÚNG` | 103 | 69 % |
| `SỬA` | 23 | 15 % |
| `XOÁ` | 0 | 0 % |
| `CẦN CODE` | 23 | 15 % |

Chia theo cuộc: `bay.veso` 24/4/0/4 · `bay.cailuong` 13/6/0/2 · `bay.soi` 12/0/0/4 ·
`bay.pano` 18/4/0/1 · `bay.dienthoai` 19/3/0/2 · `bay.mua` 12/3/0/8 · `bay.moiloi` 4/1/0/2 ·
`bay.moiloi2` 1/2/0/0 (theo thứ tự ĐÚNG/SỬA/XOÁ/CẦN CODE).

**69% đạt — cao nhất trong năm file được giao**, và lý do rất cụ thể: 4 trong 8 cuộc là
**bà kể chuyện đời**, mà hỏi tiếp một mạch chuyện thì không nợ gì. Lỗi dồn vào đúng hai
chỗ: **cuộc mưa** (`bay.mua`, 8/23 nút cần code) và **mọi câu mời ngồi / mời đứng mát**.

**Trí nhớ trong một cuộc (§3.3): file này SẠCH.** Cả 8 nút `GAT` (1.2.3.4, 1.3.3, 1.4.3,
2.3.3, 3.2.3, 3.4, 6.1.3, 6.4, 7.3) và nút `CHUI` duy nhất (5.2.1.3) đều là **lá cuối** —
không có nhánh `AM` nào nối sau chúng. Không nút nào cần `need: "!c.angered"`.
**Lưu ý đọc:** 1.3.4 *"Dạ con giỡn thôi bà"* trông như một câu làm lành sau 1.3.3 (GAT),
nhưng hai nút là **anh em cùng nhịp**, chọn cái này thì không chọn được cái kia. Không vi phạm.

**Phân loại `need` / `while` (§4.1):** 16 khoá nên là `need`, 17 nên là `while`. Nút duy
nhất đang có `while` (1.4.1) sai cả hai mặt: tên khoá (`p.hasTea` không có trong §3.1,
phải là `p.holdsTea`) và phía (sự thật tĩnh phải để ở `need`).

## 2. Đề xuất khoá mới

| khoá đề xuất | nghĩa | nút cần | vì sao §3 không đủ |
|---|---|---|---|
| `t.blocking` | người này **đang đứng chắn** lối vào / che mặt xe | 1.4.3 · 6.4 | §3.2 có `t.cutLine` (đã chen hàng) nhưng không có "đang chắn lối". Hai câu nặng nhất file (`rel −5`, `rel −6`) đang buộc tội không bằng chứng — đúng loại lỗi *"chị chen hàng trong khi bà ấy không hề chen"* |
| `w.boardNearBin` (hoặc chung hơn: `w.hygiene(X)`) | thớt/khăn/thùng rác đang để sai chỗ | opener của `bay.soi` · 3.1 · 3.2.1 · 7.3 | Cả cuộc `bay.soi` là một lời buộc tội về vệ sinh; `world/stations.ts` biết vị trí thớt, `map.ts` biết vị trí thùng rác — chỉ thiếu đường cho nội dung đọc |
| `w.ovenBusy` · `w.ovenHot` | lò đang nướng / lò đã nóng | 5.1.1.3 | §3.4 không có khoá nào về cái lò |
| `m.remembers(E)` | cả mùa: chuyện E đã thật sự xảy ra giữa hai người | 2.3.2 · 4.2.3 · 8.1 · 8.2 | §3.2 có `t.toldMe(F)` nhưng `need` hiện chỉ đọc **cờ chuyện** (`gate.flags`); và ba trong bốn chỗ này **chưa có cờ nào được đặt** |
| `v.gaveTea` | trong lượt ghé này đã mời trà rồi | 1.4.1 | §4ter tầng `v.*` chưa có khoá nào |
| `c.openedBy(NPC)` | cuộc này ai mở lời | 2.1 · 2.2 · 2.3 · 2.4 (cuộc `BOTH` duy nhất của file) | §3.3 không có khoá nào nói ai mở lời |
| `!` và `==` trong `need`/`while` | `!p.soldOut`, `w.queue == 0` | 6.3.1 · S:tiep.1 … | `visibleOptions` chỉ làm `!!gate.flags[o.need]` |

**Cờ nội dung cần thêm (không phải khoá mới):** `bayRuCoiHat` (1.3.1.2) · `bayChiNghe`
(2.2.1) · `bayDayDienThoai` (S:ket.1 của `bay.dienthoai`, 5.1.1.1) · `bayMuaVeSo` (đặt ở
bốn nút `PAY`, cho 8.2 đọc lại).

## 3. Hành động cần code

| hành động | nút cần | thời lượng đề xuất | thiếu gì trong game |
|---|---|---|---|
| `THEY_SIT` | 1.4.1 · 6.3 · 6.3.1 · 7.1.1 | 30–60 s rồi đứng dậy đi tiếp | **Không có trong §3.5** (bảng hành động) dù §6 lấy chính nó làm ví dụ. Thiếu: ô ghế gắn với `GHE_BAN` (hiện chỉ là hình vẽ ở `StallScene.ts:3076`), dáng ngồi, đường đứng dậy |
| `STAND_IN_SHADE` + `LEAVE_SHADE` | 7.1.3 · 6.1 · S:ket.1 · S:ket.2 (của `bay.mua`) | nắng 20–30 s · mưa tới khi tạnh; rồi **về đúng mục đích cũ** | §3.5 ghi **CHƯA — cần ô mới**. `src/world/map.ts` không có ô hóng mát **và không có mái quán**, trong khi `bay.mua` mở đầu bằng "bà đứng ké cái mái con" |
| `OFFER_TEA` | 1.4.1 | ~8 s nhận/từ chối · hạn rót **~25 s** | §3.5 ghi **một phần** (`refuseTea` ở `service.ts:2589`). Thiếu: trừ `TEA_COST` khỏi két, ly rời tay người chơi, dáng uống, và ba nấc nuốt lời của §4bis |
| `WALK_ON` / `GO_HOME` | S:tiep.2 · 6.2.1.2 | ngay, kết thúc cuộc | §3.5 ghi **CHƯA**. Bà Bảy là người **đi bộ bán rong**: trạng thái nghỉ của bà là đi, không phải đứng |
| `PROMISE_DEED{ việc, hạn }` — hứa một việc ngoài ổ bánh, treo lại và **kiểm đúng hạn** | S:tiep.1 (để phần ổ) · 1.3.1.2 (đi coi hát) · 1.4.2 (mai mua vé) · 2.2.1 (bà chỉ nghe) · 3.1.1.1 (mai đem khăn) · 3.2.2 (chút nữa dời thớt) · S:ket.1 + 5.1.1.1 (mai chỉ điện thoại) · 6.1.1.3 (chút nữa coi chỗ dột) | hạn **giây** cho việc trong buổi (20–60 s), hạn **ngày** cho việc qua đêm (1 ngày) | `TalkAct.PROMISE` hiện chỉ treo **món kẹp vô ổ** và kiểm lúc đưa bánh. Không có chỗ treo lời hứa qua đêm, không có đường `BROKEN_PROMISE` cho việc, và **không có chỉ báo lời hứa đang treo** (§4bis đòi: phạt một người vì quên mà game không nhắc là phạt trí nhớ người chơi — CANON T5) |
| `MOVE_BOARD` · `MOVE_ICEBOX` | 3.1 · 3.2.1 · 6.1.1.1 · 6.1.2 | ngay (hoặc ~20 s nếu đang bận tay) | Thớt và thùng đá là **trạm cố định** trong `world/stations.ts`; không có đường dời chúng. Nếu không làm được thì bốn câu này phải đổi chữ: đừng hứa dời |
| `GIVE_BREAD` | S:ket.2 (của `bay.pano`) | tới khi ăn xong | §3.5 ghi **CHƯA**; và riêng nút này còn sai người — bà Bảy không gọi món bao giờ |
| `PLAY_CAILUONG` | 2.1.1.2 | 30–60 s | Không có nguồn phát, không có âm nền. Nếu không đáng làm ⇒ **XOÁ** nút đó |
| `STEP_ASIDE` | 1.4.3 · 6.4 | tới khi xong | **ĐÃ CÓ CODE** (`service.ts:3232`) — việc cần làm là **gắn act vào nội dung**, không phải viết code |
| `need` / `while` nói chung | 23 nút `SỬA` | — | `need` chỉ đọc cờ chuyện; `while` chưa được `visibleOptions` đọc; cơ chế `?` của §4 chưa có |

## 4. Lời hứa có hạn (§4bis)

**Nấc phạt của bà Bảy** (`deTha 0.8`, `patience 90`): **nhắc hai lần → thôi → nhưng vẫn
nhớ** (một `mem` âm nhẹ, không `anger`). Bà **không bỏ đi**; đó mới đúng người.

| nút | hứa gì | hạn (giây thật / ngày) | giữ lời | NUỐT LỜI |
|---|---|---|---|---|
| 1.4.1 | rót bà ly trà + mời ngồi | **~25 s** | `PROMISE_KEPT`, giữ `rel +3` · `calm 28` | nhắc 1: *"Ly trà con nói đó…"* → nhắc 2: *"Thôi khỏi con, bà đi."* → **bà đi, và nhớ** (`mem BROKEN_PROMISE` nhẹ). Đúng câu chủ dự án: *"đi rót trà mà họ không rót, bắt người ta đợi, thì họ cũng bỏ đi"* |
| S:tiep.1 | để phần một ổ tới trưa | **tới trưa (`w.band(TRUA)`)** | `PROMISE_KEPT` | bà ghé trưa, không có ổ ⇒ nhắc một câu rồi thôi, **nhớ cả mùa** |
| 3.1 · 3.2.1 | "con dời liền" cái thớt | **~20 s** | — | bà soi lại, thấy thớt y chỗ cũ ⇒ nhắc 2 lần (reply đã viết sẵn *"Bà nhắc một lần thôi đó nghen"*) |
| 3.2.2 | dời thớt "chút nữa vắng khách" | **tới `w.queue == 0` + 60 s** | — | như trên |
| 6.1.1.1 · 6.1.2 | dời cái thùng đá chỗ dột | **~20 s** | — | như trên |
| 6.1.1.3 | "chút nữa con coi bà" (chỗ dột) | **tới cuối buổi** | — | như trên |
| 3.1.1.1 | mai đem thêm cái khăn | **1 ngày** — kiểm `needEquip: KHAN_3_MAU` sáng hôm sau | `PROMISE_KEPT` + giữ `bayKhanRieng` | **đây là lời hứa kiểm được dễ nhất cả file** vì khăn là thiết bị mua được. Nuốt lời ⇒ gỡ cờ + bà nói một câu |
| 1.3.1.2 · 1.4.2 · 2.2.1 · S:ket.1 · 5.1.1.1 | các cái hẹn "bữa khác / mai" | **1 ngày** | — | hiện **không có gì cả** — xem §3, `PROMISE_DEED` |

## 5. Trí nhớ bốn tầng (§4ter)

| tầng | tình trạng | nút liên quan |
|---|---|---|
| `c.*` **trong cuộc** | **SẠCH** — 8 `GAT` + 1 `CHUI` đều là lá cuối | — |
| `v.*` **trong lượt ghé** | **1 chỗ hở**: bà Bảy ghé một lần có thể chạy `bay.veso` rồi `bay.moiloi` trong cùng lượt ⇒ mời trà / mời ngồi **hai lần** | 1.4.1 ↔ 7.1.1 (cần `v.gaveTea`, `v.offeredSeat`) |
| `d.*` **trong ngày** | **1 chỗ hở**: `bay.moiloi` và `bay.moiloi2` là hai chủ đề khác nhau nên **chạy được cả hai trong một ngày**, và `opener` của cả hai đều là *"Ơ. Con kêu bà hả con."* / *"Ơ. Con kêu bà nữa hả."* — cái thứ hai có nhận ra, cái thứ nhất thì không | cần `d.metToday` |
| `m.*` **cả mùa** | **4 chỗ nhớ nhầm** — nặng hơn quên, theo luật cứng §4ter | 2.3.2 (*bà soi con hoài*) · 4.2.3 (*cái gì cũng quay về hát hò*) · 8.1 (*cái tuồng bữa trước*) · 8.2 (*bữa qua có tờ nào trúng*) |

> **Điểm sáng cần giữ làm khuôn:** `bay.pano` khai `when.needFlag: "haiPano"` và nút 4.1.1
> khai `need: "haiBietBay"`. Đó đúng là cách §4ter muốn — **cuộc chỉ mở ra khi chuyện kia
> đã thật sự xảy ra**. Bốn chỗ nhớ nhầm ở trên chỉ cần chép đúng khuôn này; **cờ cho 8.1
> thì đã tồn tại sẵn** (`bayCaiLuongTalk`), chỉ là không ai gắn.
