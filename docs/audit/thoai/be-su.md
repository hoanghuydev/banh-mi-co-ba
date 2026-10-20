# Rà thoại — BÉ SU (`src/content/talks/be-su.json`)

> ## ⚡ REVAMP 2026-10-20 — ☠️ CHẾT TOÀN BỘ
> Rà thoại theo giọng cũ + hệ trí nhớ/quan hệ đã chết. Toàn bộ thoại viết lại giọng Nam gen Z ở R6 (CANON §9, §17.1). Chỉ giữ để truy vết nội dung cũ.

**Hợp đồng:** `docs/phase-2-he-npc/P2-07-neo-thoai-vao-the-gioi.md` (đã gồm §4.1 · §4bis ·
§4ter) · **9 cuộc · 134 nút**
**Từ vựng:** chỉ §3. Khoá nào thiếu thì nằm ở mục *Đề xuất khoá mới* cuối file.

**Trạng thái đo được ở file này:** `act` **2 lần** (cả hai là `DISCOUNT 2.000` ở
`su.toan` 5.1.1.2 và 5.1.2 — **và cả hai đều không nổ được**, xem dưới), `needEquip`
**1 lần** (`GHE_BAN`), `flag` **7 lần**, `while` **2 lần** (vừa thêm ở 3.1.2 · 3.1.4, cả
hai dùng `p.hasTea` — **khoá này không có trong §3.1**, đúng ra là `p.holdsTea`),
`forSec` **0 lần**, `needCash` **0 lần**.

**Tính cách (quyết định nấc phạt §4bis):** `soi 0.4 · nongTinh 0.4 · deTha 0.9 ·
thanThien 1.0 · patience 70`. Con bé **dễ tha nhất hẻm và thân thiện tuyệt đối** ⇒ nuốt
lời với nó **không có nấc "nói nặng"**: nó nhắc rụt rè một câu, rồi im, rồi **buồn và
vẫn nhớ**. Đó là nấc phạt đau nhất của cả game — một đứa nhỏ không trách mình.

**Bốn luật đọc dùng cho cả file:**
1. *Xã giao thuần không phải free word.*
2. *Câu hứa một việc làm* mà hệ chưa có `does` cho nó ⇒ `CẦN CODE`.
3. **§4.1 — `need` hay `while`:** tĩnh (`p.holdsTea`, `p.handsEmpty`, `t.served`,
   `needEquip`, `m.remembers`) ⇒ **`need`**. Động (`w.queue`, `t.impatient`,
   `w.shadeFree`) ⇒ **`while`**.
4. **Riêng của người này:** bé Su **quay phim** suốt — và *quay phim* là một **hành động
   có thời lượng, nhìn thấy được**. Mỗi câu cho phép / cấm / bảo ngưng quay là một câu
   `does`, không phải xã giao. Đây là cụm `CẦN CODE` lớn nhất file.

---

### su.quay — con quay cái lò cô được hông (SHORT · NPC_ONLY · w14)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| S:chao.1 | "Ừ, con quay đi. Cô làm tiếp đây." | — | — | **thiếu** `FILM · 10–20 s` (khoá mới) | **CẦN CODE** — cho phép quay mà trong cảnh **không ai giơ máy lên**; reply "Dạ con quay lẹ thôi cô" nói là đang quay |
| S:chao.2 | "Quay xong cho cô coi với nghen con." | — | — | **thiếu** `PROMISE_DEED(chiều gửi clip)` + cờ · hạn **1 ngày** | **CẦN CODE** — `rel +3` + ký ức 40 cho một cái hẹn **không cờ, không cuộc nào nhận** |
| S:chao.3 | "Thôi đủ rồi con, cô mỏi tay." | **thiếu** `c.filming` / `v.filming` | — | **thiếu** `STOP_FILM · ngay` | **CẦN CODE** — bảo ngưng quay trong lúc **không có việc quay nào đang diễn ra** |
| 1.1 | "Được chớ. Đợi cô lau cái thớt cái đã." | **thiếu** `p.handsEmpty` *(tĩnh)* | — | **thiếu** `WIPE_BOARD · ~3 s` + `FILM · forSec` · hạn **~10 s** | **CẦN CODE** — hứa lau thớt; **thớt không được lau**, mà độ sạch của thớt LÀ trạng thái game mô phỏng (CANON §8) |
| 1.1.1 | "Con quay cái này chi vậy con?" | — | — | — | ĐÚNG |
| 1.1.1.1 | "Hai ngàn người lận hả? Dữ vậy con." | — | — | — | ĐÚNG |
| 1.1.1.2 | "Con quay hẻm mình chi, có gì đâu mà coi." | — | — | — | ĐÚNG |
| 1.1.1.3 | "Con ráng học đi, mấy cái đó chơi thôi." | — | — | — | ĐÚNG |
| 1.1.1.4 | "Mai cô dọn quầy sạch cho con quay." | — | — | `flag: suQuaySach` ✓ (đọc ở `su.buon` S:ui.2) · **thiếu** `PROMISE_DEED` · hạn **1 ngày** · kiểm độ sạch quầy sáng hôm sau | **CẦN CODE** — `rel +4` + ký ức 45; cờ bật **bằng lời nói**. Độ sạch quầy là thứ game mô phỏng được ⇒ đây là lời hứa **kiểm được**, chỉ chưa ai nối |
| 1.1.2 | "Quay thì quay, mà đừng quay mặt cô nghen." | — | — | — | ĐÚNG |
| 1.1.3 | "Con quay rồi cô nổi tiếng cô bán hổng kịp đó." | — | — | — | ĐÚNG |
| 1.1.4 | "Đứng xa cái lò ra con, nóng." | **thiếu** `t.nearOven` (khoá mới) | — | **thiếu** `STEP_ASIDE · ngay` (**ĐÃ CÓ CODE**) | **SỬA** — bảo lùi ra mà **không ai lùi**, và không kiểm con bé **có đang đứng sát lò hay không** (cùng họ với lỗi *"chị chen hàng"*) |
| 1.2 | "Quay gì mà quay. Lo ăn đi con." | **thiếu** `t.served` *(tĩnh)* | — | — | **SỬA** — giục ăn khi con bé **chưa có ổ nào trong tay** |
| 1.2.1 | "Ăn xong rồi quay nghen, cô hổng cấm." | **thiếu** `t.served` | — | **thiếu** `FILM · forSec` | **CẦN CODE** |
| 1.2.2 | "Ăn xong đi học, đừng la cà." | **thiếu** `t.served` | — | **thiếu** `WALK_ON` | **CẦN CODE** — bảo đi học, con bé vẫn đứng đó tới hết lịch |
| 1.2.3 | "Ngày nào cũng quay, chán thiệt chớ." (GAT · lá cuối) | **thiếu** `m.visits(5)` | — | — | **SỬA** — "ngày nào cũng" đòi một lịch sử ghé; cuộc này **không khai `minVisits`** nên câu nói được ngay lần đầu gặp (§4ter) |
| 1.3 | "Con quay cô xấu là cô hổng bán cho con nữa đó." | — | — | — | ĐÚNG — giỡn, `reply` giỡn lại |
| 1.3.1 | "Nói dóc. Đẹp nhất hẻm là cô Mai chớ." | — | — | — | ĐÚNG |
| 1.3.2 | "Ừ, quay đi con." | — | — | **thiếu** `FILM · forSec` | **CẦN CODE** |
| 1.3.3 | "Con nịnh cô chi vậy con." | — | — | — | ĐÚNG |
| 1.4 | "Thôi con. Cô hổng thích lên mạng." | — | — | — | ĐÚNG |
| 1.4.1 | "Hổng phải tại con đâu. Cô ngại thôi." | — | — | — | ĐÚNG |
| 1.4.2 | "Ừ." (LANH · silent) | — | — | — | ĐÚNG |

### su.drama.mang — vụ quán chè Vườn Chuối (SHORT · BOTH · day 8–40 · minVisits 3 · w12)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| S:ket.1 | "Thôi ăn đi con, nguội bánh." | **thiếu** `t.served` | — | — | **SỬA** — giục ăn một ổ con bé chưa mua |
| S:ket.2 | "Mấy chuyện đó nghe rồi quên đi con." | — | — | — | ĐÚNG |
| S:ket.3 | "Con kể chuyện người ta hoài coi chừng đó." | — | — | — | ĐÚNG |
| 2.1 | "Chè Vườn Chuối sao con?" | **thiếu** `c.openedBy(NPC)` (khoá mới) | — | — | **SỬA** — cuộc `BOTH`: khi người chơi bấm phím thì đây là câu mở lời ⇒ mình hỏi về một quán chè **chưa ai nhắc** (P2-06 §2.15) |
| 2.1.1 | "Trời. Một con ruồi mà dẹp luôn cái quán hả con." | — | — | — | ĐÚNG |
| 2.1.1.1 | "Vậy là người ta dựng chuyện hả con?" | — | — | — | ĐÚNG |
| 2.1.1.2 | "Con coi kỹ dữ ha. Con làm thám tử luôn đi." | — | — | — | ĐÚNG |
| 2.1.1.3 | "Con đừng có nói ra nghen, mệt lắm." | — | — | — | ĐÚNG |
| 2.1.1.4 | "Chuyện người ta, con xía vô chi." | — | — | — | ĐÚNG |
| 2.1.2 | "Vậy chắc quán đó dơ thiệt rồi con." | — | — | — | ĐÚNG |
| 2.1.2.1 | "Vậy mà một cái clip là xong. Ghê thiệt." | — | — | — | ĐÚNG |
| 2.1.2.2 | "Nên cô mới hổng muốn con quay đó con." | **thiếu** `m.remembers(suQuayTuChoi)` | — | — | **SỬA** — viện lại một chuyện (**mình đã từ chối cho quay**) có thể **chưa bao giờ xảy ra**: `su.quay` 1.4 là một nhánh trong một cuộc riêng, chạy độc lập (§4ter — nhớ nhầm nặng hơn quên) |
| 2.1.2.3 | "Kệ người ta đi con." | — | — | — | ĐÚNG |
| 2.1.3 | "Cô bận lắm con, để bữa khác nghen." | — | **thiếu** `w.queue >= 1` *(động)* | — | **SỬA** |
| 2.2 | "Cô hổng có coi mấy cái đó con." | **thiếu** `c.openedBy(NPC)` | — | — | **SỬA** (§2.15) |
| 2.2.1 | "Ai cũng xấu hả? Con nói cô nghe coi." | — | — | — | ĐÚNG |
| 2.2.2 | "Vậy bớt coi lại đi con." | — | — | — | ĐÚNG |
| 2.2.3 | "Ừ." (LANH · silent) | — | — | — | ĐÚNG |
| 2.3 | "Con hóng drama dữ ha con." | — | — | — | ĐÚNG — đọc được cả khi là câu mở lời |
| 2.3.1 | "Bà Bảy mà nghe câu đó là con chết nghen." | — | — | — | ĐÚNG — đùa, không hứa |
| 2.3.2 | "Con nói xấu người lớn vậy hả con." | — | — | — | ĐÚNG |
| 2.3.3 | "Hóng chi cho mệt. Lo học đi." (GAT · lá cuối) | — | — | — | ĐÚNG |
| 2.4 | "Cô đang làm con. Chút nữa nghen." | **thiếu** `c.openedBy(NPC)` | **thiếu** `w.queue >= 1` | — | **SỬA** |

### su.buon — con bị chửi trên mạng (SHORT · NPC_ONLY · day 12–40 · minVisits 6 · tier ACQ/FRIEND · `initiates 0.3`)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| S:ui.1 | "Hẻm này cô sống mười mấy năm. Nó hổng dơ." | — | — | — | ĐÚNG |
| S:ui.2 | "Mai con quay tiếp. Cô lau quầy sạch cho con." | `suQuaySach` ✓ | — | **thiếu** `PROMISE_DEED` · hạn **1 ngày** · kiểm độ sạch quầy | **CẦN CODE** — lặp lại đúng lời hứa của `su.quay` 1.1.1.4, lại `rel +4` + ký ức 50, lại không ai kiểm. Tức **một lời hứa được trả công hai lần mà chưa từng phải giữ** |
| S:ui.3 | "Thôi nghỉ quay đi con, đỡ mệt." | — | — | — | ĐÚNG |
| S:ui.4 | "Ăn đi rồi đi học, trễ rồi." | **thiếu** `t.served` | — | **thiếu** `WALK_ON` | **CẦN CODE** |
| 3.1 | "Ủa. Có chuyện gì hả con?" | — | — | — | ĐÚNG |
| 3.1.1 | "Người ta nói gì con?" | — | — | — | ĐÚNG |
| 3.1.1.1 | "Tụi đó ngồi nhà gõ phím thôi con. Kệ nó." | — | — | — | ĐÚNG |
| 3.1.1.2 | "Con đọc mấy cái đó chi cho khổ con." | — | — | — | ĐÚNG |
| 3.1.1.3 | "Vậy thì đừng đăng nữa. Đơn giản mà." | — | — | — | ĐÚNG |
| 3.1.1.4 | "Con còn nhỏ mà bày đặt lên mạng chi." (GAT · `rel −6` · lá cuối) | — | — | — | ĐÚNG — câu nặng nhất file, và nó **kết thúc cuộc** nên không vướng §3.3 |
| 3.1.2 | "Con ngồi xuống ghế đi. Cô rót con ly trà." | `needEquip: GHE_BAN` ✓ · **thiếu** `p.holdsTea` · **thiếu** `!v.gaveTea` | `p.hasTea` *(vừa thêm — **tên khoá không có trong §3.1**, phải là `p.holdsTea`; và là sự thật **tĩnh** nên §4.1 đòi để ở `need`)* | **thiếu** `THEY_SIT · 30–60 s` + `OFFER_TEA · ~8 s` · hạn rót **~25 s** | **CẦN CODE** — `rel +4` · `calm 28` · ký ức 50 cho **hai lời hứa cùng lúc** (ghế + trà) mà không cái nào xảy ra |
| 3.1.3 | "Ai làm gì con? Nói cô nghe." | — | — | — | ĐÚNG |
| 3.1.4 | "Con vô trong này đứng với cô. Cô rót con ly trà đá." | **thiếu** `p.holdsTea` · **thiếu** `!v.gaveTea` | `p.hasTea` *(sai tên + sai phía như 3.1.2)* · **thiếu** `w.shadeFree` | **thiếu** `STAND_IN_SHADE (vô trong quầy) · forSec` + `OFFER_TEA` | **CẦN CODE** — ⚠ chỗ chủ dự án chỉ: *"vào đứng cho mát — không có chỗ nào để đứng"*. `world/map.ts` y2–y5 là **khu người chơi làm việc**; không có ô nào cho khách đứng sau quầy. Con bé gật xong **vẫn đứng nguyên chỗ cũ** |
| 3.2 | "Hứng gì mà hứng. Ăn đi con." | **thiếu** `t.served` | — | — | **SỬA** |
| 3.2.1 | "…Mà có chuyện gì thì nói cô nghe nghen." | — | — | — | ĐÚNG |
| 3.2.2 | "Ăn lẹ đi, trễ học rồi." | **thiếu** `t.served` | — | **thiếu** `WALK_ON` | **CẦN CODE** |
| 3.2.3 | "Mặt mày vầy cô nhìn mệt quá con." (GAT · lá cuối) | — | — | — | ĐÚNG |
| 3.3 | "Chú bảo vệ có con chim đó. Chú nói mai chú mở lồng cho con coi." | `tuMoLong` ✓ | — | — | ĐÚNG — **khuôn mẫu đúng của §4ter**: chỉ nói được khi chú Tư đã thật sự kể |
| 3.4 | "Vậy thôi con về đi, cô đông khách." (`rel −4` · `anger 20`) | — | **thiếu** `w.queue >= 2` | **thiếu** `WALK_ON · ngay` | **CẦN CODE** — đuổi một đứa nhỏ đang buồn về vì "đông khách" **lúc hẻm vắng tanh**, và nó **không về** |

### su.thaygia — ông già hỏi con một bài toán (SHORT · NPC_ONLY · day 14–40 · minVisits 5 · `needFlag: phucThayBeSu`)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| S:ket.1 | "Con đi học đi, trễ rồi đó." | — | — | **thiếu** `WALK_ON` | **CẦN CODE** |
| S:ket.2 | "Mai con kể cô nghe tiếp nghen." | — | — | — | ĐÚNG — `su.moiloi*` có chỗ nhận lời hẹn này |
| S:ket.3 | "Ừ." (LANH · silent) | — | — | — | ĐÚNG |
| 4.1 | "Thầy Phúc hả con? Rồi con làm ra không?" | `phucThayBeSu` ✓ | — | — | ĐÚNG |
| 4.1.1 | "Ủa sao vậy con? Con làm ra mà." | — | — | — | ĐÚNG |
| 4.1.1.1 | "Vậy con sợ bị bắt đi thi nữa hả con?" | — | — | `flag: suSoThi` ✓ (đọc ở `chu-tu.json:tu.consu`) | ĐÚNG |
| 4.1.1.2 | "Mà con nói trật, thầy có tin không con?" | — | — | — | ĐÚNG |
| 4.1.1.3 | "Giỏi mà giấu uổng lắm con." | — | — | — | ĐÚNG |
| 4.1.1.4 | "Ừ. Chuyện của con." (LANH · silent) | — | — | — | ĐÚNG |
| 4.1.2 | "Thầy đó hồi xưa dạy toán đó con." | **thiếu** `m.remembers(phucDayToan)` | — | — | **SỬA** — người chơi khai một chuyện về lai lịch thầy Phúc mà **có thể chưa ai kể cho mình** (§4ter) |
| 4.1.3 | "Lần sau con cứ nói thiệt đi con, hổng ai bắt con đâu." | `phucDeYen` ✓ | — | — | ĐÚNG |
| 4.2 | "Bài gì mà khó dữ vậy con?" | — | — | — | ĐÚNG |
| 4.2.1 | "Con nhẩm được thiệt hả? Cô tính giấy còn sai nữa." | — | — | — | ĐÚNG |
| 4.2.1.1 | "Cái đó là giỏi đó con. Giỏi thiệt chớ hổng phải giỡn." | — | — | — | ĐÚNG |
| 4.2.1.2 | "Vậy chút nữa con tính tiền giùm cô luôn nghen." | — | — | **thiếu** `SU_HELPS_TILL · forSec` (khoá mới) hoặc `PROMISE_DEED` · hạn **tới cuối buổi** | **CẦN CODE** — hứa nhờ con bé tính tiền "chút nữa"; **không cờ, không ai tới tính giùm** |
| 4.2.1.3 | "Ừ, hay. Mà con đi học đi." (LANH · silent) | — | — | **thiếu** `WALK_ON` | **CẦN CODE** |
| 4.2.2 | "Vậy con trả lời ổng đại cái gì?" | — | — | — | ĐÚNG |
| 4.2.3 | "Ừ." (LANH · silent) | — | — | — | ĐÚNG |
| 4.3 | "Cô đang đông khách nè con. Chút nữa nghen." | — | **thiếu** `w.queue >= 2` | — | **SỬA** |

### su.toan — cô thối dư con hai ngàn (FULL · NPC_ONLY · day 5–40 · w13)

> **Lỗi cả cuộc, hai tầng:**
> 1. Cuộc mở ra **không kiểm người chơi CÓ thối dư hay không**. `opener` khẳng định
>    *"cô thối dư con hai ngàn nè cô. Đúng ra là năm ngàn à."* — một con số **game tính
>    được chính xác** (`settlePayment` / `makeChange`), mà cuộc không đọc. Đây đúng loại
>    lỗi *"bảo chị chen hàng trong khi bà ấy không hề chen"*.
> 2. **Cả hai `act` của file này không nổ được.** `DISCOUNT` trừ tiền vào **hoá đơn của
>    lượt ghé** ở `settlePayment`; nhưng trong cảnh này con bé **đã trả tiền rồi** và đang
>    trả lại tiền thừa — không còn hoá đơn nào để trừ. Tức hai nút duy nhất có `act` trong
>    cả 134 nút là **free word đội lốt act**. Phải đổi sang `PAY 2.000` (có `needCash`).

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| S:ket.1 | "Ừ. Cảm ơn con nghen." | — | — | — | ĐÚNG |
| S:ket.2 | "Ừ, con đi học đi." | — | — | **thiếu** `WALK_ON` | **CẦN CODE** |
| S:ket.3 | "Ừ." (LANH · silent) | — | — | — | ĐÚNG |
| 5.1 | "Ủa thiệt hả con? Cô đưa con rồi mà." | **thiếu** `c.overpaid` (khoá mới) + `t.served` | — | — | **SỬA** — xem khối trên |
| 5.1.1 | "Con tính nhanh ghê. Cô chưa kịp nghĩ nữa." | — | — | — | ĐÚNG |
| 5.1.1.1 | "Vậy từ mai con đứng đây tính tiền giùm cô luôn nghen." | — | — | `flag: suGiuTien` ✓ (đọc ở `thay-phuc.json:phuc.betoan`) · **thiếu** `PROMISE_DEED` · hạn **1 ngày** | **CẦN CODE** — hứa một **đứa cấp hai đứng quầy tính tiền từ mai**; thế giới không có chỗ cho nó, cờ chỉ mở một câu thoại khác |
| 5.1.1.2 | "Hai ngàn đó cô cho con. Con giữ đi." | **thiếu** `needCash 2000` | **thiếu** `t.waiting` *(chưa thanh toán)* | `act: DISCOUNT 2.000` — **SAI ACT**, phải là `PAY 2.000` | **SỬA** — act có mà **không bao giờ nổ**: hoá đơn đã thanh toán xong rồi. Tiền **không rời két** |
| 5.1.1.3 | "Cô già rồi con ơi. Đầu óc cô chậm." | — | — | — | ĐÚNG |
| 5.1.1.4 | "Ừ. Cô cầm lại." (LANH · silent) | — | — | **thiếu** `TAKE_CASH 2.000` vô két | **SỬA** — nhận lại hai ngàn mà **két không nhích một đồng** |
| 5.1.2 | "Thôi con cầm đi con, coi như cô gửi." | **thiếu** `needCash 2000` | **thiếu** `t.waiting` | `act: DISCOUNT 2.000` — **SAI ACT** | **SỬA** — cùng lỗi 5.1.1.2 |
| 5.1.3 | "Con trả lại cô, con ngoan ghê." | — | — | **thiếu** `TAKE_CASH 2.000` | **SỬA** |
| 5.2 | "Con tính lại coi, cô thấy cô đưa đúng mà." | **thiếu** `c.overpaid` | — | — | **SỬA** — và câu này còn **cãi lại một phép tính game biết chắc**: nếu người chơi thối đúng thì chính người chơi mới là người nói sai, mà reply vẫn ép mình sai |
| 5.2.1 | "…Ừ ha. Cô sai thiệt. Cô xin lỗi con." | — | — | — | ĐÚNG |
| 5.2.1.1 | "Con nói nghe lọt tai ghê. Ai dạy con nói vậy?" | — | — | — | ĐÚNG |
| 5.2.1.2 | "Mai mốt cô sai nữa con nhắc cô nghen." | — | — | **thiếu** `PROMISE_DEED` + cờ · hạn **cả mùa** · và **một lần nhắc THẬT ở lượt thối tiền sau** | **CẦN CODE** — free word nặng: `rel +4` + ký ức 55 cho một **cơ chế trợ giúp** mà hệ tiền của game **đã mô phỏng được** (sai số tiền thối là một sự kiện có thật), chỉ là không ai nối |
| 5.2.1.3 | "Ừ ừ. Con đi học đi." (LANH · silent) | — | — | **thiếu** `WALK_ON` | **CẦN CODE** |
| 5.2.2 | "Con này tính nhanh hơn cái máy nữa." | — | — | — | ĐÚNG |
| 5.2.3 | "Thôi con cầm rồi đi học đi, cô bận." | — | **thiếu** `w.queue >= 1` | **thiếu** `WALK_ON` | **CẦN CODE** |
| 5.3 | "Con lo chuyện tiền bạc chi vậy, đi học đi con." (GAT · lá cuối) | — | — | **thiếu** `WALK_ON` | **CẦN CODE** |

### su.anhbao — con quay trúng mặt anh nón kết (SHORT · NPC_ONLY · day 12–40 · minVisits 4 · w11)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| S:ket.1 | "Ừ. Con làm vậy là phải đó con." | — | — | — | ĐÚNG |
| S:ket.2 | "Ừ, con đi học đi." | — | — | **thiếu** `WALK_ON` | **CẦN CODE** |
| S:ket.3 | "Ừ." (LANH · silent) | — | — | — | ĐÚNG |
| 6.1 | "Rồi con xoá chưa con?" | — | — | — | ĐÚNG |
| 6.1.1 | "Con xoá liền vậy là con tử tế đó con." | — | — | `flag: suXoaClip` ✓ (`anh-bao.json:bao.clip` dùng ở `when.needFlag`) | ĐÚNG |
| 6.1.1.1 | "Lần sau con hỏi trước rồi quay nghen con." | — | — | — | ĐÚNG |
| 6.1.1.2 | "Ảnh ngại chớ hổng phải ảnh ghét con đâu." | **thiếu** `m.remembers(baoNgai)` | — | — | **SỬA** — khẳng định tính cách anh Bảo như thể mình đã biết rõ; có thể **chưa nói với ảnh câu nào** (§4ter) |
| 6.1.1.3 | "Tiếc gì. Đoạn khác quay lại được mà con." | — | — | — | ĐÚNG |
| 6.1.1.4 | "Ừ. Chuyện của con." (LANH · silent) | — | — | — | ĐÚNG |
| 6.1.2 | "Con quay người ta mà hổng xin phép là hổng được đó con." | — | — | — | ĐÚNG |
| 6.1.3 | "Đoạn đó đẹp sao con? Kể cô nghe coi." | — | — | — | ĐÚNG |
| 6.2 | "Ảnh nói gì với con hả con?" | — | — | — | ĐÚNG |
| 6.2.1 | "Ảnh kiểu vậy đó con. Ảnh nói gì cũng xin lỗi trước." | **thiếu** `m.remembers(baoNgai)` | — | — | **SỬA** — như 6.1.1.2 |
| 6.2.1.1 | "Con để ý người ta ghê ta." | — | — | — | ĐÚNG |
| 6.2.1.2 | "Bữa nào con chào ảnh một tiếng đi con." | — | — | `flag: suChaoBao` ✓ (đọc ở `anh-bao.json:bao.tiengnhat`) | ĐÚNG — lời hẹn **có chỗ đáp thật**, đây là khuôn nên chép |
| 6.2.1.3 | "Thôi kệ ảnh đi con." (LANH · silent) | — | — | — | ĐÚNG |
| 6.2.2 | "Ảnh hiền mà con. Đừng chọc ảnh nghen." | **thiếu** `m.remembers(baoNgai)` | — | — | **SỬA** |
| 6.2.3 | "Con kể chuyện người ta hoài vậy con." | **thiếu** `d.toldMe(...)` / `m.visits(N)` | — | — | **SỬA** — "hoài" đòi một lịch sử kể chuyện **không ai đếm** |
| 6.3 | "Con đừng quay khách của cô nữa nghen con." (GAT · lá cuối) | — | **thiếu** `w.queue >= 1` *(phải CÓ khách để mà quay)* | **thiếu** `STOP_FILM` | **SỬA** |

### su.moiloi — người chơi bắt chuyện (SHORT · PLAYER_ONLY · day 3–40 · w25)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 7.1 | "Dạo này có vụ gì mới hông con? Kể cô nghe coi." | — | — | — | ĐÚNG |
| 7.1.1 | "Kể đi con. Cô vừa làm cô vừa nghe." | — | — | — | ĐÚNG |
| 7.1.2 | "Con hóng chi dữ vậy con. Mệt đầu." | — | — | — | ĐÚNG |
| 7.1.3 | "Thôi. Cô đang làm nghen con." | — | **thiếu** `w.queue >= 1` | — | **SỬA** |
| 7.2 | "Bài vở con sao rồi? Có bài nào khó hông con?" | — | — | — | ĐÚNG |
| 7.3 | "Ngày nào cũng cầm cái điện thoại. Chán con ghê." (GAT · `anger 20`) | **thiếu** `m.visits(5)` | — | — | **SỬA** — "ngày nào cũng" ở một cuộc **chỉ khai `day >= 3`, không khai `minVisits`** ⇒ trách một thói quen nhiều ngày ngay lần đầu gặp (§4ter) |

### su.moiloi2 — bắt chuyện lần hai (SHORT · PLAYER_ONLY · day 13–40 · minVisits 5 · w20)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 8.1 | "Nay con quay được cái gì hay chưa con?" | — | — | — | ĐÚNG |
| 8.2 | "Cái clip bữa trước người ta còn vô nói nữa hông con?" | **thiếu** `m.remembers(suBiChui)` | — | — | **SỬA** — nhắc cái clip bị chửi; `su.buon` là cuộc kể chuyện đó và **nó không đặt cờ nào**, nên câu này nói được dù chưa bao giờ nghe (§4ter) |
| 8.3 | "Con đứng sát cái lò quá. Lùi ra coi con." (GAT nhẹ · `anger 15`) | **thiếu** `t.nearOven` (khoá mới) | — | **thiếu** `STEP_ASIDE · ngay` (**ĐÃ CÓ CODE**) | **SỬA** — bảo lùi mà không ai lùi, và không kiểm con bé có đứng sát lò thật không. Bản sao của `su.quay` 1.1.4 |

### su.moiloi3 — bắt chuyện lần ba (SHORT · PLAYER_ONLY · day 6–40 · minVisits 3 · w18)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 9.1 | "Chừng nào con nổi tiếng con nhớ cô nghen con." | — | — | — | ĐÚNG |
| 9.2 | "Con ăn sáng chưa đó con?" | — | — | — | ĐÚNG |
| 9.3 | "Thôi con. Cô làm hổng kịp nè." | — | **thiếu** `w.queue >= 1` | — | **SỬA** |

---

## 1. Thống kê

| | số nút | tỉ lệ |
|---|---|---|
| **Tổng** | **134** | 100 % |
| `ĐÚNG` | 82 | 61 % |
| `SỬA` | 28 | 21 % |
| `XOÁ` | 0 | 0 % |
| `CẦN CODE` | 24 | 18 % |

Chia theo cuộc: `su.quay` 12/3/0/8 · `su.drama.mang` 17/6/0/0 · `su.buon` 12/1/0/6 ·
`su.thaygia` 14/2/0/3 · `su.toan` 7/6/0/6 · `su.anhbao` 13/5/0/1 · `su.moiloi` 4/2/0/0 ·
`su.moiloi2` 1/2/0/0 · `su.moiloi3` 2/1/0/0 (theo thứ tự ĐÚNG/SỬA/XOÁ/CẦN CODE).

**Cuộc tệ nhất: `su.toan` — 7/19 đạt.** Lý do không phải chữ nghĩa mà là **hai `act` duy
nhất của cả file đều sai loại** (`DISCOUNT` sau khi đã thanh toán), cộng với việc cả cuộc
không kiểm người chơi có thối dư hay không. Đây là cuộc **đáng sửa trước nhất** của file:
nó nói về tiền, mà tiền là thứ game mô phỏng chính xác nhất.

**Cuộc tốt nhất: `su.drama.mang` — 17/23 đạt, 0 `CẦN CODE`.** Vì nó thuần kể chuyện: con
bé kể, mình nghe, không ai hứa gì. Khuôn nên giữ.

**Trí nhớ trong một cuộc (§3.3): file này SẠCH.** Cả 8 nút `GAT` (1.2.3, 2.3.3, 3.1.1.4,
3.2.3, 5.3, 6.3, 7.3, 8.3) đều là **lá cuối**; không có nút `CHUI` nào. Không nút nào cần
`need: "!c.angered"`. **Một chỗ cần để ý tuy không vi phạm:** 3.4 (`LANH`, `rel −4`,
`anger 20`) đuổi con bé về, cũng là lá cuối.

**Phân loại `need` / `while` (§4.1):** 26 khoá nên là `need` (chủ yếu `t.served` và
`m.remembers`), 11 nên là `while` (chủ yếu `w.queue`). Hai `while` đang có trong file
(3.1.2 · 3.1.4) **sai cả tên khoá lẫn phía**.

## 2. Đề xuất khoá mới

| khoá đề xuất | nghĩa | nút cần | vì sao §3 không đủ |
|---|---|---|---|
| `c.overpaid` (hoặc `v.overpaid`) | lượt thanh toán vừa rồi **thối dư/thiếu bao nhiêu** | opener + 5.1 + 5.2 của `su.toan` | §3 không có khoá nào về giao dịch tiền, trong khi `settlePayment`/`makeChange` tính chính xác số đó. Thiếu nó thì **cả một cuộc FULL buộc tội người chơi sai** |
| `t.nearOven` | người này đang đứng sát lò | `su.quay` 1.1.4 · `su.moiloi2` 8.3 | §3.2 không có khoá vị trí; hai câu "lùi ra coi con" đang nói với người đứng cách lò ba ô |
| `m.remembers(E)` | cả mùa: chuyện E đã thật sự xảy ra | 2.1.2.2 · 4.1.2 · 6.1.1.2 · 6.2.1 · 6.2.2 · 8.2 | `need` hiện chỉ đọc **cờ chuyện**, và **bốn trong sáu chỗ này chưa có cờ nào được đặt** |
| `c.openedBy(NPC)` | cuộc này ai mở lời | 2.1 · 2.2 · 2.4 (cuộc `BOTH` duy nhất của file) | §3.3 không có khoá nào nói ai mở lời |
| `v.gaveTea` · `v.offeredSeat` | trong lượt ghé này đã mời trà / mời ngồi rồi | 3.1.2 · 3.1.4 | §4ter tầng `v.*` chưa có khoá nào; **3.1.2 và 3.1.4 mời trà hai lần trong cùng một nhịp lựa chọn** |
| `d.toldMe(X)` · `m.visits(N)` | trong ngày / cả mùa | 1.2.3 · 6.2.3 · 7.3 | ba câu "ngày nào cũng…" / "hoài…" đang nói được ngay lần gặp đầu |
| `!` và `==` trong `need`/`while` | `w.queue == 0`, `!v.gaveTea` | nhiều | `visibleOptions` chỉ làm `!!gate.flags[o.need]` |

**Cờ nội dung cần thêm:** `suQuayTuChoi` (mình đã từ chối cho quay — đặt ở `su.quay` 1.4,
cho 2.1.2.2 đọc) · `suBiChui` (đặt ở `su.buon` 3.1, cho `su.moiloi2` 8.2 đọc) ·
`baoNgai` (đặt ở cuộc của anh Bảo, cho 6.1.1.2 / 6.2.1 / 6.2.2 đọc) ·
`phucDayToan` (đặt ở cuộc của thầy Phúc, cho 4.1.2 đọc).

## 3. Hành động cần code

| hành động | nút cần | thời lượng đề xuất | thiếu gì trong game |
|---|---|---|---|
| `FILM` + `STOP_FILM` | S:chao.1 · S:chao.3 · 1.2.1 · 1.3.2 · 6.3 | 10–20 s | **Không có trong §3.5.** Quay phim là việc bé Su làm ở 4/9 cuộc, và là lý do tồn tại của nhân vật. Thiếu: một `PoseId` giơ điện thoại (bảng `MOOD_POSE` hiện không có), và một cờ `v.filming` để câu "thôi đủ rồi con" có cái để tắt |
| `WALK_ON` | S:ui.4 · S:ket.1 (×3 cuộc) · S:ket.2 (×2 cuộc) · 1.2.2 · 3.2.2 · 3.4 · 4.2.1.3 · 5.2.1.3 · 5.2.3 · 5.3 | ngay, kết thúc cuộc | §3.5 ghi **CHƯA**. Bé Su là **học sinh đang trên đường đi học**: "đi học đi con" xuất hiện **11 lần** trong file và **không lần nào con bé đi** |
| `THEY_SIT` | 3.1.2 | 30–60 s | Không có trong §3.5; ô ghế gắn với `GHE_BAN` chưa tồn tại (hiện chỉ là hình vẽ ở `StallScene.ts:3076`) |
| `STAND_IN_SHADE` (biến thể *vô trong quầy*) | 3.1.4 | 30–60 s rồi ra lại | §3.5 ghi **CHƯA — cần ô mới**. `world/map.ts` y2–y5 là khu người chơi làm việc; cho một NPC vào đó sẽ chắn đường chính người chơi ⇒ cần một ô **riêng**, không phải cho mượn ô làm việc |
| `OFFER_TEA` | 3.1.2 · 3.1.4 | ~8 s nhận/từ chối · hạn rót **~25 s** | §3.5 ghi **một phần** (`refuseTea`). Thiếu: trừ `TEA_COST`, ly rời tay, dáng uống, và **ba nấc nuốt lời** — với bé Su là nhắc rụt rè một câu rồi im rồi buồn |
| `PAY` thay cho `DISCOUNT` | 5.1.1.2 · 5.1.2 | ngay | **Act này ĐÃ CÓ CODE.** Đây là việc **sửa nội dung**, không phải viết code: đổi `DISCOUNT 2000` → `PAY 2000` + `needCash: 2000`. Nhưng ghi vào đây vì nó là lỗi `act` duy nhất kiểu này trong năm file được giao |
| `TAKE_CASH{ vnd }` — tiền **vào** két từ một câu thoại | 5.1.1.4 · 5.1.3 | ngay | `TalkAct` có `PAY` (ra) nhưng **không có chiều ngược lại**. Hai nút này nhận lại hai ngàn mà két không nhích |
| `PROMISE_DEED{ việc, hạn }` | S:chao.2 (chiều gửi clip) · 1.1.1.4 + S:ui.2 (mai dọn quầy sạch) · 4.2.1.2 (chút nữa tính tiền giùm) · 5.1.1.1 (mai con giữ tiền) · 5.2.1.2 (mai mốt con nhắc cô) | hạn **giây** trong buổi, **ngày** qua đêm | `TalkAct.PROMISE` chỉ treo **món kẹp vô ổ**. Hai lời hứa ở đây **kiểm được ngay bằng dữ liệu đã có**: độ sạch quầy (CANON §8) và sai số tiền thối (`makeChange`) |
| `WIPE_BOARD` | 1.1 | ~3 s | Lau thớt là thao tác người chơi làm được bằng tay; chỉ thiếu đường cho một câu thoại kích hoạt nó |
| `SU_HELPS_TILL` | 4.2.1.2 · 5.1.1.1 | một lượt khách | Không có chỗ cho NPC đứng sau quầy (xem `STAND_IN_SHADE` ở trên). Nếu không làm ⇒ **đổi chữ**, đừng hứa |
| `STEP_ASIDE` | 1.1.4 · 8.3 | ngay | **ĐÃ CÓ CODE** — việc cần làm là gắn act vào nội dung |

## 4. Lời hứa có hạn (§4bis)

**Nấc phạt của bé Su** (`deTha 0.9`, `thanThien 1.0`, `patience 70`): **không có nấc "nói
nặng"**. Nó **nhắc rụt rè một câu** → **im** → **buồn, bỏ đi, và vẫn nhớ**
(`mem` âm nhẹ, không `anger`). Chủ dự án nói *"ít nhất chửi rồi bỏ đi"* — với một đứa cấp
hai thì nấc "chửi" phải thay bằng **không nói gì nữa**, và đó nặng hơn.

| nút | hứa gì | hạn (giây thật / ngày) | giữ lời | NUỐT LỜI |
|---|---|---|---|---|
| 3.1.2 | mời ngồi ghế **+ rót ly trà** | **~25 s** | `PROMISE_KEPT`, giữ `rel +4` · `calm 28` · ký ức 50 | nhắc 1 (rụt rè): *"Dạ… cô bận thì thôi cô."* → **im, rồi đi**. Không `anger`. **Đây chính là câu chủ dự án nói**: đi rót trà mà không rót thì nó bỏ đi |
| 3.1.4 | mời vô trong đứng **+ rót trà đá** | **~25 s** | như trên (`rel +3` · `calm 24`) | như trên |
| 1.1 | "đợi cô lau cái thớt cái đã" rồi cho quay | **~10 s** | con bé quay thật | nhắc 1 rồi thôi quay, cất máy — và **không hỏi lại ở cuộc sau** |
| S:chao.2 | chiều gửi clip cho coi | **1 ngày** | `PROMISE_KEPT` | hôm sau nó không nhắc, nhưng `su.moiloi2` 8.1 nên đổi giọng |
| 1.1.1.4 · S:ui.2 | **mai dọn quầy sạch cho con quay** | **1 ngày** — kiểm độ sạch quầy sáng hôm sau | giữ `suQuaySach`, con bé quay thật | gỡ cờ + một câu buồn. **Lời hứa kiểm được dễ nhất file** |
| 4.2.1.2 | "chút nữa con tính tiền giùm cô" | **tới cuối buổi** | — | — |
| 5.1.1.1 | "từ mai con đứng đây tính tiền giùm cô" | **1 ngày** | — | — |
| 5.2.1.2 | "mai mốt cô sai nữa con nhắc cô nghen" | **cả mùa** — nổ ở lượt thối tiền sai kế tiếp | con bé nhắc thật ⇒ cứu người chơi một lần | không bao giờ nhắc ⇒ lời hứa chết lặng. Hiện **đang là trường hợp này** |

> **Chỗ nguy nhất của §4bis trong file này:** `calm 28` (3.1.2) và `calm 24` (3.1.4) là
> mức **cao nhất cho phép** (`talk.ts` cấm quá 30). Hai mức đó đang được trả **trước** cho
> hai lời hứa chưa có hạn, chưa có hành động. Nếu chưa code kịp `OFFER_TEA`/`THEY_SIT`,
> việc **gỡ `calm` khỏi hai nút đó** phải làm trước — nếu không, cách chơi tối ưu đúng là
> "hứa rót trà rồi quên", đúng cái `TalkEffect.calm` đã cảnh báo trong `talk.ts`.

## 5. Trí nhớ bốn tầng (§4ter)

| tầng | tình trạng | nút liên quan |
|---|---|---|
| `c.*` **trong cuộc** | **SẠCH** — 8 `GAT` đều là lá cuối, không `CHUI` | — |
| `v.*` **trong lượt ghé** | **1 chỗ hở rõ**: 3.1.2 và 3.1.4 là **hai lời mời trà nằm cùng một nhịp lựa chọn**; thêm nữa bé Su ghé một lần có thể chạy `su.toan` rồi `su.moiloi` trong cùng lượt | cần `v.gaveTea` · `v.offeredSeat` |
| `d.*` **trong ngày** | **chỗ hở**: ba cuộc `moiloi` là ba chủ đề khác nhau ⇒ chạy được cả ba trong một ngày, và cả ba `opener` đều chào như mới gặp (*"Cô kêu con hả cô?"* · *"Dạ? Cô kêu con hả cô?"* · *"Cô ơi con nè cô."*) | cần `d.metToday` |
| `m.*` **cả mùa** | **6 chỗ nhớ nhầm** + **3 chỗ giả định quen biết mà không có cổng** | nhớ nhầm: 2.1.2.2 · 4.1.2 · 6.1.1.2 · 6.2.1 · 6.2.2 · 8.2 · giả định quen: 1.2.3 · 6.2.3 · 7.3 |

> **Điểm sáng cần giữ làm khuôn:** `su.thaygia` khai `when.needFlag: "phucThayBeSu"`, nút
> 4.1.3 khai `need: "phucDeYen"`, nút 3.3 khai `need: "tuMoLong"`, và 6.2.1.2 **đặt** cờ
> `suChaoBao` cho `anh-bao.json` đọc lại. Bốn chỗ đó đúng chuẩn §4ter: **chuyện chỉ nói
> được khi nó đã thật sự xảy ra**. Sáu chỗ nhớ nhầm ở trên chỉ cần chép đúng khuôn này —
> và bốn trong sáu chỗ còn **phải đi đặt cờ ở cuộc nguồn trước** (xem §2).
