# Rà thoại — CHỊ LAN (`src/content/talks/chi-lan.json`)

**Hợp đồng:** `docs/phase-2-he-npc/P2-07-neo-thoai-vao-the-gioi.md` (kể cả §4.1 · §4bis ·
§4ter mới thêm) · **8 cuộc · 88 nút**

**Trạng thái đo được:** `while` **2 lần** (3.1.1.2 và 6.1.2 — cả hai **sai tên khoá**) ·
`forSec` **0** · `needEquip` **0** · `act` **5 lần**: `REFUSE` ×4 (4.1.3, 4.3, 5.2.2, 5.3)
và `STEP_ASIDE` ×1 (6.3).

**Nhân vật:** `soi 0,9` (tinh ý nhất hẻm) · `nongTinh 0,1` · **`deTha 0,2` — ít tha thứ
nhất** · `patience 45` (thấp nhất). Đơn quen 23 ngày không đổi một chữ (`arcs.ts:117`):
*"Cho em ổ chả lụa, không ớt, không hành. Gói mang về."* Chị **biến mất từ ngày 24**
(ngày 20 nếu người chơi gọi sai tên) — và **cả 8 cuộc đều khai `when.day` kết thúc ở 23**.
Đó là chỗ `when` được dùng đúng nhất trong cả sáu file.

**Bốn chỗ hỏng rõ nhất:**
* **`REFUSE` dùng ngược chiều.** `talk.ts` khai `REFUSE` = *"**không bán nữa**; khách đi
  ngay"* — tức **người chơi** từ chối bán. Nhưng cả 4 lần dùng ở đây là **chị tự bỏ đi**
  ("Thôi em, chị đi" · "Hôm nay chị không mua nữa"). Hệ quả trên màn hình giống nhau,
  nhưng `mem`/`rel` quy trách nhiệm sai người. Cần một act riêng cho "khách bỏ mua".
* **`STEP_ASIDE` cũng dùng sai nghĩa.** 6.3 bảo chị **đi chỗ khác trú mưa**, trong khi act
  này nghĩa là *"dạt qua cho người sau lên trước"*. Và "hàng hiên kia" không có trong `map.ts`.
* **Cuộc mưa (`lan.mua`) là cuộc hỏng nặng nhất sáu file: 4/14 nút đạt.** Nó hứa một cái
  áo mưa không tồn tại, một ly **trà nóng** không tồn tại (`BINH_TRA` là *"Bình trà **đá**
  10 lít"*), một chỗ đứng không tồn tại, và một món nợ phải trả **sáng mai**.
* **`mem: REMEMBERED_USUAL` được tặng không kiểm.** 3.1.2 đọc đúng từng chữ đơn quen rồi
  cộng ký ức "nhớ đơn quen" — **mà không kiểm ổ trên tay có đúng chả lụa không ớt không
  hành hay không**.

---

### lan.sep — chuyện sếp ở chỗ làm (SHORT · day 12–23 · minVisits 6)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1S:ket.1 | "Chị kể là em nghe thôi. Em không nói ai đâu." | — | — | **thiếu** cờ bí mật | **SỬA** — nhận giữ bí mật mà không có cờ nào để **bẻ**. Trong chính file này đã có mẫu bẻ bí mật (4.1.3, `rel −8` + `REFUSE`); thêm `flag lanKeSep` là dùng lại được ngay |
| 1S:ket.2 | "Dạ. Ổ chị đây chị." | — | **thiếu** `p.holdsFilled` | **thiếu** `GIVE_BREAD` | **CẦN CODE** |
| 1.1 | "Chị kể đi chị. Em nghe." | — | — | — | ĐÚNG |
| 1.1.1 | "Rồi chị tính sao chị?" | — | — | — | ĐÚNG |
| 1.1.1.1 | "Chị không cần giả vờ với em đâu chị." | — | — | `mem CARED_FOR_THEM` | ĐÚNG |
| 1.1.1.2 | "Chị nói ra đi chị. Im riết mệt lắm." | — | — | — | ĐÚNG |
| 1.1.1.3 | "Chị kệ đi chị. Chuyện người ta." (LANH) | — | — | `rel −2` · im | ĐÚNG |
| 1.1.1.4 | "Mấy người đó sống kiểu gì không biết." (CHUI) | — | — | `rel −2` | **ĐÚNG** — đúng y điều `talk.ts` nói: *"với chị Lan thì `CHUI` là mất điểm"*. Câu đáp từ chối hùa ("Em không muốn nói nặng ai cả") |
| 1.1.2 | "Cả phòng biết mà không ai nói gì hả chị?" | — | — | — | ĐÚNG |
| 1.1.3 | "Chuyện này chị kể ai nữa chưa chị?" | — | — | — | ĐÚNG |
| 1.2 | "Dạ chị cứ nói, em đang rảnh tay." | — | **thiếu** `p.handsEmpty` + `w.queue == 0` | — | **SỬA** — nói "em đang rảnh tay" trong khi tay đang kẹp ổ bánh và ba người đứng chờ; đây là loại nói sai cảnh mà §4 gọi là "câu lạc" |
| 1.2.1 | "Không kỳ đâu chị. Hôm nào chị muốn thì kể." | — | — | — | ĐÚNG |
| 1.2.2 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 1.3 | "Chị kể nhanh giùm em, em đang đông khách." (LANH) | — | **thiếu** `w.queue >= 2` | `rel −4` · `mem RUDE_TO_THEM` | **SỬA** — giục một người rụt rè vừa mở miệng, bằng một cái cớ không ai kiểm |

### lan.len — chị móc chăn len hai năm (SHORT · day 8–23 · minVisits 4)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 2.1 | "Chị móc len hả chị?" | — | — | — | ĐÚNG |
| 2.1.1 | "Hai năm lận hả chị?" | — | — | — | ĐÚNG |
| 2.1.1.1 | "Chị làm cho ai vậy chị?" | — | — | `mem REMEMBERED_STORY` | ĐÚNG |
| 2.1.1.2 | "Hai năm thì mua cái chăn cho rồi chị." | — | — | `rel −2` | ĐÚNG |
| 2.1.1.3 | "Em thích cái kiểu không vội của chị." | — | — | `mem CARED_FOR_THEM` | ĐÚNG |
| 2.1.1.4 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 2.1.2 | "Cô Mai bên kia có bán đó chị." | — | — | — | ĐÚNG — chỉ chỗ, không hứa; chị còn tự từ chối ("Em ngại hỏi") |
| 2.1.3 | "Chị móc cho em cái gì đi chị." (DUA) | — | — | — | ĐÚNG — chị **né** ("Để em xem. Em làm chậm lắm"), không nhận lời |
| 2.2 | "Dạ em không biết chị ơi." | — | — | — | ĐÚNG |
| 2.2.1 | "Để em hỏi giùm chị nghen." | — | — | **thiếu** cờ | **SỬA** — **y hệt từng chữ** câu 4S:ket.1, mà câu kia đặt `flag lanHoiPhong` còn câu này không đặt gì. Cùng một lời hứa, hai số phận |
| 2.2.2 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 2.3 | "Chị ăn sáng chưa chị? Em hỏi thiệt đó chị." | `maiNhoLan` ✓ | — | — | **ĐÚNG** — mẫu neo chéo đẹp nhất file: lời người chơi hứa với cô Mai (*"con để ý chị ấy giùm cô"*) **mở ra** một câu mới với chị Lan. Đây là cách một lời hứa nên sống |
| 2.4 | "Chị hỏi gì kỳ vậy chị, đây bán bánh mì mà." (GAT) | — | — | `anger 30` · `rel −6` · lá cuối | ĐÚNG |

### lan.imlang — chị đứng im không nói gì (SHORT · day 4–23)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 3.1 | "Chị hôm nay ổn không chị?" | — | — | — | ĐÚNG |
| 3.1.1 | "Chị nói ổn mà mặt chị không ổn chị ơi." | — | — | — | ĐÚNG |
| 3.1.1.1 | "Vậy chị đứng đây chút đi. Em không hỏi nữa." | — | **thiếu** `w.shadeFree` / chỗ đứng | **thiếu** `STAND_IN_SHADE · forSec` | **CẦN CODE** — *"vào đứng cho mát — không có chỗ nào để đứng, và họ gật xong vẫn đi tiếp"*, đúng nguyên văn lỗi chủ dự án nêu. Chị đáp đúng một chữ "…Vâng." rồi không có gì xảy ra |
| 3.1.1.2 | "Chị uống ly trà đá đi chị." | **thiếu** `needEquip: BINH_TRA` | `p.hasTea` ✗ **sai tên** → `p.holdsTea` | **thiếu** `OFFER_TEA · ~8 s` | **SỬA** — mời uống mà không tốn một ly nào |
| 3.1.1.3 | "Chị nói ra cho nhẹ đi chị." | — | — | `rel −1` · im | ĐÚNG |
| 3.1.2 | "Dạ. Ổ chả lụa không ớt không hành của chị đây." | — | **thiếu** `p.holdsFilled` + ổ **đúng** chả lụa / không ớt / không hành | **thiếu** `GIVE_BREAD` · `mem REMEMBERED_USUAL` **được tặng không kiểm** | **CẦN CODE** — câu đắt nhất của nhân vật (chị đọc một câu y hệt 23 hôm, mình đọc lại giùm chị) và nó **không đọc ổ bánh**. Người chơi đưa ổ đầy ớt vẫn được ký ức "nhớ đơn quen" |
| 3.1.3 | "Dạ vậy thì tốt chị." | — | — | — | ĐÚNG |
| 3.2 | "Chị đứng đó nãy giờ mà không nói gì chị." | — | **thiếu** `t.waiting` + quãng chờ thật | — | **SỬA** — "nãy giờ" là một con số có thật trong `waitSec` mà câu này không đọc |
| 3.2.1 | "Không sao đâu chị. Em cũng hay vậy." | — | — | — | ĐÚNG |
| 3.2.2 | "Chị kỳ ghê." (GAT) | — | — | `anger 25` · `rel −6` · lá cuối | ĐÚNG |
| 3.3 | "Chị Hạnh đứng sau chị có chào chị một tiếng hông chị?" | `hanhChaoLan` ✓ | — | — | **ĐÚNG** — neo chéo `chi-hanh.json` (4S:ket.2) và khớp `arcs.ts` M4 ngày 22 |
| 3.4 | "…" (IM) | — | — | `rel +1` | **ĐÚNG** — nút hay nhất của cả nhân vật: im lặng là lựa chọn **được thưởng**, và câu đáp giải thích tại sao ("Không ai bắt em phải nói"). Đây là cách §3.3 nên hiểu: thoại phải biết mình vừa làm gì |

### lan.doncu — chị kiếm phòng trọ (FULL · day 14–23 · minVisits 5 · needFlag `maiKeLan`)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 4S:ket.1 | "Để em hỏi giùm chị nghen chị." | — | — | `flag lanHoiPhong` (mở `co-mai` 2.3) · **thiếu hạn** | **CẦN CODE** — lời hứa làm giùm **duy nhất trong sáu file có người đọc lại**, nhưng không có hạn và không ai kiểm người chơi có hỏi thật không. Chị còn dặn thêm một điều kiện ("Em đừng nói ai là em hỏi giùm chị nhé") mà cũng không cờ nào giữ |
| 4S:ket.2 | "Dạ ổ của chị đây chị." | — | **thiếu** `p.holdsFilled` | **thiếu** `GIVE_BREAD` | **CẦN CODE** |
| 4.1 | "Dạ để em để ý giùm chị. Chị cần gấp hông chị?" | — | — | **thiếu** `flag lanHoiPhong` | **SỬA** — cùng lời hứa với 4S:ket.1 mà không đặt cờ |
| 4.1.1 | "Chị nói không gấp mà chị hỏi em lúc bảy giờ sáng chị." | — | — | — | ĐÚNG — và khớp lịch thật: chị tới 7h05 (`npcs.ts`) |
| 4.1.1.1 | "Chị khỏi xin lỗi. Em hỏi giùm chị **bữa nay luôn**." | — | — | `flag lanHoiPhong` · **thiếu hạn trong ngày** | **CẦN CODE** — lời hứa **có hạn ghi rõ trong chính câu nói** ("bữa nay luôn") và không có gì kiểm lúc đóng cửa |
| 4.1.1.2 | "Chị cứ nói thẳng với em, em hổng kể ai đâu chị." | — | — | — | ĐÚNG |
| 4.1.1.3 | "Dạ." (LANH) | — | — | `rel −2` | ĐÚNG |
| 4.1.2 | "Chị kiếm phòng rẻ hơn hả chị?" | — | — | — | ĐÚNG |
| 4.1.3 | "Dạ cô Mai có nói chị khất tiền nhà bà Tám đó chị." | `maiKeLan` (ở `when`) ✓ | — | `REFUSE` · `rel −8` · `anger 30` · `mem RUDE_TO_THEM` | **ĐÚNG** — **nút nặng hệ quả nhất trong cả sáu file**. Bán một bí mật của chị → chị bỏ đi ngay. Đây là chỗ duy nhất chứng minh hệ thoại **có thể** làm được điều hợp đồng đòi |
| 4.2 | "Dạ em hổng biết chị ơi. Chỗ này em cũng mới." | — | — | — | ĐÚNG |
| 4.2.1 | "Hỏi vu vơ mà chị hỏi kỹ ghê chị." (DUA) | — | — | — | ĐÚNG |
| 4.2.2 | "Em hỏi cô Mai giùm chị được hông chị?" | — | — | — | ĐÚNG — chị **cấm** ("Thôi em. Đừng. Cô ấy nói nhiều lắm"), nên không lời hứa nào bị treo |
| 4.2.3 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 4.3 | "Chị hỏi chuyện nhà cửa ở quán bánh mì hả chị." (GAT) | — | — | `REFUSE` · `anger 35` · `rel −7` · lá cuối | ĐÚNG |

### lan.chuot — con chuột chạy qua thùng đá (FULL · day 6–23)

> **`opener` khai một con chuột.** `src/sim` không có hệ vệ sinh nào sinh ra chuột —
> `grep` cho "chuột" chỉ ra đúng file thoại này. Cả cuộc treo trên một sự kiện thế giới
> không mô phỏng, và bốn nhánh trả lời đều **hứa dọn**.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 5S:ket.1 | "Chị nói nhỏ giùm em, em cảm ơn chị nhiều." | — | — | `mem CARED_FOR_THEM` | ĐÚNG |
| 5S:ket.2 | "Dạ ổ của chị đây chị." | — | **thiếu** `p.holdsFilled` | **thiếu** `GIVE_BREAD` | **CẦN CODE** |
| 5.1 | "Dạ em dẹp liền chị. Chị đứng lui ra chút nghen chị." | — | — | **thiếu** hành động dọn + chị không lui | **CẦN CODE** — hai lời trong một câu, không lời nào xảy ra. Phần "lui ra" đáng lẽ là `STEP_ASIDE` (đã có code) |
| 5.1.1 | "Chị thấy mà chị hổng la tiếng nào hả chị?" (DUA) | — | — | — | ĐÚNG |
| 5.1.1.1 | "Chị nói câu đó nghe thương ghê chị." | — | — | `mem REMEMBERED_STORY` | ĐÚNG |
| 5.1.1.2 | "Vậy chị với con chuột ai sợ ai hơn chị?" (DUA) | — | — | — | ĐÚNG |
| 5.1.1.2.1 | "Chị cũng biết giỡn ha chị." (DUA) | — | — | `mem CARED_FOR_THEM` | ĐÚNG — và **đúng tính cách**: chị đùa một câu rồi tự rút về ("Thỉnh thoảng. Ít người nghe nên chị ít nói"). Không có chỗ nào bắt chị cư xử ngược tính |
| 5.1.1.2.2 | "Dạ em dọn đây chị." | — | — | **thiếu** hành động dọn | **SỬA** |
| 5.1.1.3 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 5.1.2 | "**Bữa nay** em bịt kín cái thùng đó lại chị." | — | — | **thiếu** — không cờ, không hạn, không ai đòi | **CẦN CODE** — lời hứa có hạn trong ngày ("bữa nay"), về một việc vệ sinh mà hệ đã có nhóm thiết bị `VE_SINH` để đo |
| 5.1.3 | "Hẻm nào mà chẳng có chuột chị ơi." | — | — | `rel −3` · `mem RUDE_TO_THEM` | ĐÚNG |
| 5.2 | "Dạ em hổng thấy gì hết chị." (LANH) | — | — | `rel −4` · `mem RUDE_TO_THEM` | **ĐÚNG** — nói dối trước mặt người `soi 0,9`, và chị bắt được ("Vậy chắc chị nhìn nhầm") |
| 5.2.1 | "Dạ… thôi chị, em nói dối. Em dẹp liền nè." | — | — | **thiếu** hành động dọn | **SỬA** — **đúng §3.3** ở phần trí nhớ (câu `AM` sau một câu `RUDE_TO_THEM`, và chị đáp *"Em nói thật thì chị còn ghé"* — chưa nguôi hẳn), nhưng vẫn hứa dọn mà không dọn |
| 5.2.2 | "Dạ chị mua bánh của em đây mà chị." | — | — | `REFUSE` ✗ **sai chiều** · `anger 20` · `rel −4` | **SỬA** — `talk.ts` khai `REFUSE` = *người chơi* không bán nữa. Ở đây **chị** không mua nữa. Cần act riêng cho "khách bỏ mua", nếu không thì `mem` quy trách nhiệm sai người |
| 5.3 | "Chị nói vậy khách em nghe thấy thì sao chị." (GAT) | — | — | `REFUSE` · `anger 30` · `rel −6` · lá cuối | ĐÚNG |

### lan.mua — chị quên áo mưa (FULL · day 5–23 · `when.rain: true`)

> `when.rain: true` là **cổng thời tiết duy nhất trong cả sáu file**, và nó đúng. Đáng
> tiếc là toàn bộ nội dung bên trong lại treo trên những thứ không tồn tại.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 6S:ket.1 | "Chị đứng tới chừng nào tạnh cũng được chị." | — | **thiếu** `w.shadeFree` | `calm 25` · **thiếu** `STAND_IN_SHADE · tới khi tạnh` | **CẦN CODE** — và đây là chỗ hiếm hoi **`forSec` tự nhiên có sẵn**: "tới chừng nào tạnh" chính là thời lượng, chỉ cần hệ đọc `w.rain` |
| 6S:ket.2 | "Dạ ổ của chị đây chị." | — | **thiếu** `p.holdsFilled` | **thiếu** `GIVE_BREAD` | **CẦN CODE** |
| 6.1 | "Dạ chị đứng đi chị. Chị vô sát trong này cho khỏi tạt." | — | **thiếu** `needEquip: DU_CHE` / chỗ đứng | `calm 24` · **thiếu** `STAND_IN_SHADE · forSec` | **CẦN CODE** — `DU_CHE` (540 k, ngày 8, cần `rainyDaySeen`) là **đúng thiết bị** cho câu này, và cuộc mở từ ngày 5 — tức ba ngày trước khi cái dù mở khoá |
| 6.1.1 | "Chị lấy cái áo mưa này đi chị. Em có hai cái." | — | **thiếu** — mình có áo mưa không? | **thiếu** `GIVE_ITEM` | **CẦN CODE** — không có áo mưa nào trong `equipment.json`, `goods.json`, hay túi đồ nào |
| 6.1.1.1 | "Chị cứ lấy đi chị. **Mai chị trả em cũng được.**" | — | — | **thiếu** — món nợ qua đêm | **CẦN CODE** — **nghĩa vụ qua đêm rõ ràng nhất trong cả sáu file**: chị còn dặn *"Chị trả đúng ngày mai nhé, **em nhớ nhắc chị**"* — chị **xin được nhắc** và không có gì để nhắc |
| 6.1.1.2 | "Chị ướt rồi vô chỗ làm ngồi máy lạnh là bệnh đó chị." | — | — | — | ĐÚNG |
| 6.1.1.3 | "Dạ thôi, chị hổng lấy thì thôi chị." (LANH) | — | — | `rel −2` · im | ĐÚNG |
| 6.1.2 | "Chị uống ly **trà nóng** cho ấm chị." | — | `p.hasTea` ✗ sai tên | **thiếu** — không có trà nóng | **XOÁ** — `BINH_TRA` là *"Bình trà **đá** 10 lít"*. Chị còn ngạc nhiên ra mặt ("Em có cả trà nóng à"). Thêm một dây chuyền đồ uống nóng cho **một câu** là không đáng; mời trà đá để sưởi ấm thì vô nghĩa. Xoá, giữ 6.1.1 làm nhánh ấm |
| 6.1.3 | "Chị quên áo mưa mà chị nhớ hết đơn hàng của chị ha chị." (DUA) | — | — | — | **SỬA** — câu đáp viết cứng *"cái gì chị đọc **hai mươi ba hôm**"*, khớp `arcs.ts:116` nhưng cuộc mở từ **ngày 5**, lúc chị mới đọc 4 lần. Phải suy từ `m.visits` |
| 6.2 | "Chị đứng đó chị, mà chị lui vô chút, nước nhỏ ngay đầu chị." | — | **thiếu** — chỗ dột có thật? | — | **SỬA** — một vị trí dột cụ thể mà `StallScene`/`map.ts` không mô phỏng; chị còn xác nhận ("Chị đứng ngay chỗ dột mà chị không biết") |
| 6.2.1 | "Chị đứng im re chịu dột luôn chị ha." (DUA) | — | — | — | ĐÚNG |
| 6.2.2 | "Dạ chị lui qua trái là khô chị." | — | **thiếu** — như 6.2 | `calm 18` · **thiếu** chị không nhúc nhích | **SỬA** — chỉ một hướng cụ thể ("qua trái") trong một thế giới không có bản đồ khô/ướt |
| 6.2.3 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 6.3 | "Mái em nhỏ lắm chị. Chị đứng qua bên hàng hiên kia đi chị." (LANH) | — | — | `STEP_ASIDE` ✗ **sai nghĩa** · `rel −5` · `mem RUDE_TO_THEM` | **SỬA** — `STEP_ASIDE` nghĩa là "dạt qua cho người sau lên trước", không phải "đi chỗ khác trú mưa"; và "hàng hiên kia" không có trong `map.ts`. Đuổi một người đang mắc mưa là một hành động thật — nó xứng đáng có act riêng |

### lan.moiloi — người chơi bắt chuyện (PLAYER_ONLY · SHORT · day 4–23)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 7.1 | "Chị ăn gì chưa chị?" | — | **thiếu** `!t.served` | — | **SỬA** — và với chị Lan thì nó còn sai hơn: chị **gói mang về**, nên "ăn chưa" ở quầy gần như luôn lạc |
| 7.2 | "Chị ngủ được hông chị?" | — | — | — | ĐÚNG |
| 7.3 | "…" (IM) | — | — | im | ĐÚNG — đường ra bằng im lặng, hợp nhân vật và đúng luật 3 của `talk.ts` |

### lan.moiloi2 — người chơi bắt chuyện, lớp sau (PLAYER_ONLY · SHORT · day 13–23 · minVisits 6)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 8.1 | "Cái chăn len của chị tới đâu rồi chị?" | **thiếu** cờ đã nghe `lan.len` | — | — | **SỬA** — `lan.len` không đặt cờ nào |
| 8.2 | "Chỗ chị bữa nay đỡ hông chị?" | **thiếu** cờ đã nghe `lan.sep` | — | — | **SỬA** — "chỗ chị" chỉ có nghĩa sau khi chị kể chuyện sếp |
| 8.3 | "Thôi chị. Em làm tiếp đây." (LANH) | — | — | — | ĐÚNG |

---

## 1. Thống kê

| phán | số nút | % |
|---|---|---|
| `ĐÚNG` | **56** | 63,6 % |
| `SỬA` | **17** | 19,3 % |
| `XOÁ` | **1** | 1,1 % |
| `CẦN CODE` | **14** | 15,9 % |
| **tổng** | **88** | |

Theo cuộc (ĐÚNG/SỬA/XOÁ/CẦN CODE): `lan.sep` 10/3/0/1 · `lan.len` 12/1/0/0 ·
`lan.imlang` 8/2/0/2 · `lan.doncu` 10/1/0/3 · `lan.chuot` 9/3/0/3 ·
**`lan.mua` 4/4/1/5** · `lan.moiloi` 2/1/0/0 · `lan.moiloi2` 1/2/0/0.

Chị Lan có **tỉ lệ `CẦN CODE` cao nhất sáu file (15,9 %)** và là file duy nhất có một nút
`XOÁ`. Lý do không phải viết dở — ngược lại, đây là file viết **đậm hành động nhất**:
đưa áo mưa, dọn chuột, bịt thùng, mời đứng trú mưa, hỏi giùm phòng trọ. Nó đòi thế giới
nhiều nhất nên nó hụt nhiều nhất.

**Trí nhớ trong một cuộc (§3.3): SẠCH, và có một mẫu TỐT.** Năm nút `GAT` (2.4, 3.2.2,
4.3, 5.3) đều là lá cuối. Nút `CHUI` duy nhất (1.1.1.4) **mất điểm** đúng như `talk.ts`
mô tả cho chị Lan. Và **5.2 → 5.2.1** là mẫu đúng của điều khoản thoát §3.3: câu `AM`
đi sau một câu `RUDE_TO_THEM`, nhưng lời đáp đọc ra là chị **chưa nguôi** ("Em nói thật
thì chị **còn** ghé" — một lời cảnh cáo, không phải tha thứ).

**Tính cách (rụt rè):** **không có nút nào bắt chị cư xử ngược tính.** Ba chỗ dễ sai nhất
đều được viết đúng: 5.1.1.2.1 (chị đùa rồi tự rút về), 2.1.3 (chị né lời nhờ), 3.4 (im
lặng được thưởng `rel +1`). Chỗ gần ngược tính nhất là 6.1.1.1 — chị nhận một cái áo mưa —
nhưng chị bù lại bằng việc **tự đặt hạn trả** ngay trong câu đáp, đúng người `soi 0,9`.

## 2. Đề xuất khoá mới

| khoá đề xuất | nghĩa | nút cần | vì sao §3 không đủ |
|---|---|---|---|
| `p.loafMatches(spec)` | ổ **đang cầm** đúng yêu cầu | 3.1.2 | §3.1 chỉ có `p.holdsFilled` (có nhân), không biết **nhân gì**. Thiếu nó thì `mem REMEMBERED_USUAL` là một huy chương phát không |
| `p.has(item)` | người chơi có một vật ngoài ổ bánh (áo mưa…) | 6.1.1 | không có túi đồ, không có khoá nào |
| `w.leakSpot` | vị trí dột dưới mái khi mưa | 6.2 · 6.2.2 | §3.4 có `w.rain` nhưng không có bản đồ khô/ướt |
| `v.owes(X)` | khách đang nợ mình một vật, phải trả ngày mai | 6.1.1.1 | §4ter mới đề nghị tầng `v.*`; "mai chị trả" vượt khỏi cả `v.*` — cần `m.*` |
| `m.visits(N)` đọc được từ nội dung | số lần chị đã ghé | 6.1.3 ("hai mươi ba hôm") | `mem.visits` **đã có trong code** (P2-03) nhưng thoại không có đường đọc, nên con số bị viết cứng |
| `t.takesAway` | khách gói mang về, không ăn tại chỗ | 7.1 | đơn quen của chị là "gói mang về" (`arcs.ts:117`); mọi câu mời ăn/mời ngồi với chị đều sai từ gốc |

**Sửa từ vựng:** `p.hasTea` → **`p.holdsTea`** (3.1.1.2, 6.1.2 — và 6 file khác trong kho).

**Cờ nội dung cần thêm:** `lanKeSep` (1S:ket.1 — để bí mật bẻ được) · `lanHoiLen` (2.2.1) ·
`lanKeLen` / `lanKeSep` (cho 8.1 · 8.2).

## 3. Hành động cần code

| hành động | nút cần | thời lượng đề xuất | thiếu gì trong game |
|---|---|---|---|
| `GIVE_BREAD` | 1S:ket.2 · 4S:ket.2 · 5S:ket.2 · 6S:ket.2 · 3.1.2 (5 nút) | tới khi ăn xong / tới khi chị cầm đi | §3.5 ghi **CHƯA**; với chị Lan còn cần kiểm **nội dung ổ** (3.1.2) |
| `STAND_IN_SHADE` + `LEAVE_SHADE` | 3.1.1.1 · 6S:ket.1 · 6.1 | **tới khi tạnh mưa** (6S:ket.1 đã tự khai thời lượng) · 45–90 s cho 3.1.1.1 | §3.5 ghi **CHƯA — cần ô mới**. `DU_CHE` tồn tại nhưng chỉ là hình vẽ (`StallScene:3076`), không phải chỗ đứng được |
| `GIVE_ITEM{ món }` + `BORROW{ hạn ngày }` | 6.1.1 · 6.1.1.1 | trả **ngày hôm sau** | không có áo mưa, không có túi đồ, không có sổ nợ vật |
| `CLEAN_UP` (hoặc một cờ vệ sinh) | 5.1 · 5.1.1.2.2 · 5.1.2 · 5.2.1 | 5–15 s tại chỗ; 5.1.2 ("bịt kín cái thùng") là **hạn trong ngày** | không có hệ vệ sinh/chuột nào trong `src/sim`; nhóm thiết bị `VE_SINH` đã có, chỉ thiếu đường nối |
| **`CUSTOMER_LEAVES`** — khách tự bỏ mua (ngược chiều `REFUSE`) | 4.1.3 · 4.3 · 5.2.2 · 5.3 | ngay | cả 4 nút đang mượn `REFUSE`, mà `REFUSE` nghĩa là *người chơi* không bán. `mem`/`rel` quy trách nhiệm sai người |
| `SEND_AWAY` — đuổi khách đi chỗ khác | 6.3 | ngay | đang mượn `STEP_ASIDE` (nghĩa là "dạt cho người sau"), và "hàng hiên kia" không có trong `map.ts` |
| `PROMISE_DEED{ việc, hạn }` | 4S:ket.1 · 4.1.1.1 ("bữa nay luôn") · 5.1.2 ("bữa nay") | **trong ngày** với 4.1.1.1 và 5.1.2 — kiểm lúc đóng cửa | `PROMISE` chỉ treo món kẹp vô ổ |
| `OFFER_TEA` (hoàn thiện) | 3.1.1.2 | ~8 s, có đường từ chối | §3.5 ghi "một phần"; thiếu phần tốn một ly thật |
| **`while` nói chung** | 13 nút | — | `TalkNode.while` có kiểu nhưng `visibleOptions()`/`talkGate()` không đọc. Bằng chứng: **cả hai** nút `while` của file này viết sai tên khoá mà không ai báo |

---

## 4. §4.1 — "?" là lưới an toàn: xếp lại TĨNH vs ĐỘNG

| sự thật đề xuất | nút | TĨNH / ĐỘNG | khai bằng | lý do |
|---|---|---|---|---|
| `needEquip: BINH_TRA` · `DU_CHE` | 3.1.1.2 · 6.1 | **TĨNH** | **`needEquip`** → ẩn hẳn | mua rồi là mua. 6.1 còn phải chặn ở `when` vì cuộc mở ngày 5 mà `DU_CHE` mở khoá ngày 8 |
| `p.holdsTea` · `p.holdsFilled` · `p.handsEmpty` · `p.has(áo mưa)` · `p.loafMatches` | 3.1.1.2, 6.1.2, 5 nút đưa bánh, 1.2, 6.1.1, 3.1.2 | **TĨNH** | **`need`** → ẩn hẳn | thẻ thoại khoá phím; tay người chơi đứng yên suốt thẻ |
| `t.takesAway` | 7.1 | **TĨNH** | **`need`** → ẩn hẳn | đơn chốt trước khi thẻ mở |
| `m.visits(N)` · `m.remembers(…)` | 6.1.3, 8.1, 8.2, 1S:ket.1 | **TĨNH** | **`need`** → ẩn hẳn | quá khứ không đổi |
| `w.queue >= 2` · `w.queue == 0` | 1.3 · 1.2 | **ĐỘNG** | **`while`** → "?" | hàng người đổi trong lúc đọc |
| `t.served` / `!t.served` | 7.1 (phần "ăn chưa") | **ĐỘNG** | **`while`** → "?" | đổi đúng lúc mình đưa ổ |
| `t.waiting` + quãng chờ | 3.2 | **ĐỘNG** | **`while`** → "?" | chị hết kiên nhẫn giữa cuộc — `patience 45`, thấp nhất hẻm, nên chuyện này **hay xảy ra** |
| `w.shadeFree` · `w.leakSpot` | 3.1.1.1, 6S:ket.1, 6.2, 6.2.2 | **ĐỘNG** | **`while`** → "?" | có người chiếm chỗ, mưa đổi hướng |
| `w.rain` | cả `lan.mua` | **ĐỘNG** nhưng chặn ở tầng cuộc | **`when.rain`** ✓ **đã đúng** | tạnh giữa cuộc thì `6S:ket.1` tự hết hạn, không cần "?" |

**Tổng: 24 dòng đề xuất → 16 nên là `need`/`needEquip`/`when` (ẩn hẳn), 8 nên là `while`
(ra "?").** Chị Lan là người có tỉ lệ `while` hợp lệ **cao nhất** sáu file — vì cuộc của
chị gắn với mưa, với hàng người, với quãng chờ, tức những thứ **thật sự đổi trong lúc đọc**.
Nhưng `patience 45` nghĩa là "?" với chị **tốn hơn** với người khác: mỗi lần "?" là
`rel −1` trên một người `deTha 0,2`.

## 5. §4bis — LỜI HỨA CÓ HẠN

Chị Lan `deTha 0,2` · `nongTinh 0,1` · `patience 45` · `soi 0,9`. **Chị không nằm vừa
khuôn nào trong hai khuôn §4bis mô tả.** Chị không nóng tính nên chị **không chửi**; chị
không dễ tha nên chị **không tha**. Nấc của chị phải là:

```
nấc 1  im lặng — chị KHÔNG nhắc một tiếng nào (soi 0,9: chị thấy hết, chị không nói)
nấc 2  chị bỏ đi, không mua          (rel −, mem, hết lượt ghé)
nấc 3  chị KHÔNG GHÉ NỮA             (arcs.ts:207 đã có sẵn đường này)
```

Và `arcs.ts:207` đã dựng đúng cơ chế đó cho chuyện gọi sai tên: *"đi sớm được, giữ lại
không được — gọi sai tên → biến mất từ ngày 20"*. Lời hứa nuốt phải chảy vào **cùng một
đường ống** đó.

| nút | hứa gì | hạn | giữ lời thì sao | NUỐT LỜI thì sao (im lặng → bỏ đi → không ghé nữa) |
|---|---|---|---|---|
| 4S:ket.1 / 4.1 "Để em hỏi giùm chị" | hỏi cô Mai chỗ trọ | **2–3 ngày** | `co-mai` 2.3 mở ra; chị có chỗ ở ⇒ **arc đổi** | nấc 1: chị không hỏi lại lần nào · nấc 2: chị thôi mở lời (khoá `lan.doncu`) · nấc 3: tới ngày 24 chị đi và **không ai biết chị đi đâu** |
| 4.1.1.1 "Em hỏi giùm chị **bữa nay luôn**" | như trên, **trong ngày** | **tới khi đóng cửa hôm nay** | như trên, `rel +4` giữ nguyên | nặng hơn 4S:ket.1 một nấc, vì chính mình đặt hạn: sáng mai chị tới, chị **không hỏi** — và đó là câu trả lời |
| 6.1.1.1 "Mai chị trả em cũng được" + "em nhớ nhắc chị" | cho mượn áo mưa, chị trả **sáng mai** | **1 ngày** | chị trả, `rel +`, và chị **tin thêm một bậc** | **chị là người phải giữ lời**, không phải người chơi — nên nuốt lời ở đây là **game nuốt lời với người chơi**: không có gì nhắc, không có gì trả. Nếu không làm được thì **đổi lời đáp**, đừng để chị tự hứa |
| 5.1 / 5.1.1.2.2 / 5.2.1 "em dẹp liền" | dọn chỗ con chuột chạy qua | **15 s** | `calm`, chị yên tâm | nấc 1: chị im, **nhìn** · nấc 2 @30 s: chị bỏ đi không mua (`rel −3`) · nấc 3: `lan.chuot` không bao giờ mở lại — chị không kể chuyện quán cho mình nữa |
| 5.1.2 "**Bữa nay** em bịt kín cái thùng đó lại" | bịt thùng đá, **trong ngày** | **tới khi đóng cửa** | cờ vệ sinh, chị ghé tiếp | hôm sau chị thấy cái thùng y nguyên ⇒ `soi 0,9` **chắc chắn** thấy. Nấc 2 ngay, bỏ nấc 1 |
| 1S:ket.1 "Em không nói ai đâu" | giữ bí mật chuyện sếp | **cả mùa** | chị kể tiếp (`lan.sep` lớp sau) | **đã có mẫu**: 4.1.3 (`rel −8` + bỏ đi). Chỉ cần cờ `lanKeSep` để bí mật này bẻ được như bí mật kia |
| 3.1.1.1 "chị đứng đây chút đi" | cho chị một chỗ đứng | **45–90 s** | `rel +4`, `mem` | chị gật rồi vẫn đứng chỗ cũ ⇒ hiện tại **không ai biết lời hứa đã bị nuốt**, kể cả game |
| 6S:ket.1 "đứng tới chừng nào tạnh cũng được" | chỗ trú **tới khi tạnh** | **tới khi `w.rain` tắt** | `calm 25` | nếu không có chỗ trú thật thì chị đứng ngoài mưa nghe mình nói "đứng đi chị" — tệ hơn là không mời |

**Tám lời hứa, không lời nào có hạn.** Ba trong số đó (`4.1.1.1`, `5.1.2`, `6.1.1.1`) **tự
ghi hạn ra trong chính lời thoại** — "bữa nay luôn", "bữa nay", "mai chị trả" — nên người
viết đã biết hạn là bắt buộc; chỉ là hệ không có chỗ đựng.

**Thiếu trong game:** chỉ báo "đang treo một lời hứa". Với chị Lan thì nó là **bắt buộc
tuyệt đối**: chị ở nấc 1 **không kêu một tiếng**, nên nếu game không hiện gì thì người
chơi mất chị ở ngày 24 mà không bao giờ biết tại sao. CANON T5: rủi ro phải đọc được trước.

## 6. §4ter — TRÍ NHỚ BỐN TẦNG

| tầng | chỗ file này cần | nút |
|---|---|---|
| **`c.*` trong cuộc** | **không thiếu chỗ nào, và có một mẫu TỐT**: 5.2 → 5.2.1 là câu `AM` đi sau `RUDE_TO_THEM` với lời đáp đọc ra là chị **chưa nguôi** ("Em nói thật thì chị **còn** ghé"). Mọi `GAT` khác đều là lá cuối | 5.2 → 5.2.1 |
| **`v.*` trong lượt ghé** | **`v.gaveTea` — thiếu, và hỏng thật.** 3.1.1.2 (`lan.imlang`, day 4–23) và 6.1.2 (`lan.mua`, day 5–23, mưa) **cùng mời một ly trà**; hai cuộc mở chồng nhau nên trong một lượt ghé mưa, người chơi mời trà được **hai lần**, chị nhận cả hai | 3.1.1.2 ↔ 6.1.2 |
| | **`v.promised(dọn)` — hỏng rõ.** `lan.chuot` có **bốn** nhánh cùng hứa dọn (5.1, 5.1.1.2.2, 5.1.2, 5.2.1); đi hai nhánh trong một cuộc là hứa hai lần cùng một việc | 5.1 · 5.1.1.2.2 · 5.1.2 · 5.2.1 |
| | **`v.promised(hỏi phòng)`** — 4S:ket.1, 4.1, 4.1.1.1 cùng hứa hỏi chỗ trọ; `lanHoiPhong` được đặt **hai lần** mà cờ chỉ là boolean | 4S:ket.1 · 4.1 · 4.1.1.1 |
| **`d.*` trong ngày** | `d.toldMe(len)` — `lan.len` và 8.1 trùng nội dung; trong một ngày chị kể chuyện chăn len hai lần như lần đầu | 2.x ↔ 8.1 |
| | `d.toldMe(sep)` — `lan.sep` và 8.2 trùng. Nặng hơn ở đây: chuyện sếp là **bí mật chị phải lấy can đảm mới kể**, kể lại lần hai trong cùng buổi sáng là hỏng đúng cái hay của nhân vật | 1.x ↔ 8.2 |
| | `d.metToday` — 7.1 "Chị ăn gì chưa chị" hỏi được **sau khi** đã đưa ổ cho chị sáng nay | 7.1 |
| **`m.*` cả mùa** | **`when.day` dùng đúng nhất sáu file**: cả 8 cuộc khoá `[x, 23]`, khớp đúng ngày chị biến mất (`arcs.ts:207`). `when.minVisits` dùng ở 4/8 cuộc | — |
| | **`m.visits(N)` — thiếu, và thấy được**: 6.1.3 viết cứng "hai mươi ba hôm" trong một cuộc mở từ **ngày 5**. Phải đọc `mem.visits` (đã có trong code P2-03) | 6.1.3 |
| | `m.remembers(E)` thiếu ở 8.1 · 8.2 · 1S:ket.1 | |
| | `!m.visits(2)` — **không nút nào** giả định "lần đầu gặp". Mọi cuộc đều `minVisits` hoặc `day >= 4` | — |

**Kết luận tầng trí nhớ:** chỗ thủng nặng nhất của chị Lan là **`v.*` (trong lượt ghé)** —
**bốn** nhánh cùng hứa dọn con chuột, **hai** nhánh cùng mời trà, **ba** nhánh cùng hứa hỏi
phòng. Với một người `soi 0,9`, hứa đi hứa lại cùng một việc trong một lượt ghé không phải
là tử tế gấp đôi; nó là dấu hiệu mình không nhớ mình vừa nói gì.

> **Ghi chú phạm vi:** phần được giao cho tôi là 6 file NPC có tên
> (`co-mai`, `thay-phuc`, `chi-hanh`, `ong-hai`, `anh-bao`, `chi-lan`).
> **`walkin.json` không nằm trong phần này** — luật §4ter *"với `walkin.json` thì ngược
> lại: mọi câu giả định ĐÃ QUEN đều SAI"* phải được rà bởi người cầm
> `walkin.json`/`qua-duong.json`.
