# Rà thoại — CHỊ HẠNH (`src/content/talks/chi-hanh.json`)

> ## ⚡ REVAMP 2026-10-20 — ☠️ CHẾT TOÀN BỘ
> Rà thoại theo giọng cũ + hệ trí nhớ/quan hệ đã chết. Toàn bộ thoại viết lại giọng Nam gen Z ở R6 (CANON §9, §17.1). Chỉ giữ để truy vết nội dung cũ.

**Hợp đồng:** `docs/phase-2-he-npc/P2-07-neo-thoai-vao-the-gioi.md` · **8 cuộc · 101 nút**

**Trạng thái đo được:** `while` **0** · `forSec` **0** · `needEquip` **0** · **`act` 0** —
file duy nhất trong sáu file không có **một** hành động nào. 101/101 nút chỉ đổi `rel`,
`mem`, `calm` và cờ chuyện.

**Ba chỗ soi kỹ riêng của chị Hạnh:**
* **Mời đứng (3.2, 3.2.1)** — đúng nguyên văn lỗi chủ dự án nêu: *"Vào đứng cho mát —
  không có chỗ nào để đứng, và họ gật xong vẫn đi tiếp."* Nút 3.2.1 còn nói thẳng
  *"Chị đứng bao lâu cũng được chị"* — tức là **cố ý không có `forSec`**, đúng thứ hợp
  đồng cấm (*"không phải bảo họ vào đứng mát là họ đứng đó cả ngày"*).
* **Bốn câu đưa bánh** (1S:ket.2 · 4S:ket.1 · 5S:ket.1 · 6S:ket.3) đưa ổ bánh **bằng lời**:
  không `while: p.holdsFilled`, không `GIVE_BREAD`. 5S:ket.1 còn khẳng định *"Em bỏ ít ngò
  rồi"* — một lời về **nội dung ổ bánh** mà `settlePayment` kiểm được, nhưng câu thoại
  không hề đọc. Người chơi bỏ đầy ngò rồi nói câu này vẫn được +2 `rel`.
* **Con số trong lời thoại không khớp lịch.** 1.1.3 trả "bảy tháng" trong khi 5.2.3, 6 và
  7.1 trả "tám tháng" với các khoảng ngày chồng lên nhau; 4.1 nói "hai mươi mấy bữa" và
  chị đáp "mười bảy hôm" trong một cuộc mở từ **ngày 14** — lúc đó chị Lan nhiều nhất
  mới ghé 13 lần.

---

### hanh.giong — giọng Bắc giữa hẻm Nam (SHORT · day 4–40)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1S:ket.1 | "Chị nói sao cũng được chị. Em hiểu hết." | — | — | — | ĐÚNG |
| 1S:ket.2 | "Dạ ổ chị đây chị." | — | **thiếu** `p.holdsFilled` | **thiếu** `GIVE_BREAD` · tới khi ăn xong | **CẦN CODE** |
| 1.1 | "Dạ em hiểu hết mà chị." | — | — | — | ĐÚNG |
| 1.1.1 | "Trong này kêu là chén chị ơi." | — | — | — | ĐÚNG |
| 1.1.1.1 | "Chị ghi vô sổ luôn hả chị?" | — | — | `mem REMEMBERED_STORY` | ĐÚNG |
| 1.1.1.2 | "Chị cứ nói giọng chị đi, mắc gì phải đổi." | — | — | — | ĐÚNG |
| 1.1.1.3 | "Chị ở đây lâu rồi quen hà chị." | — | — | — | ĐÚNG |
| 1.1.1.4 | "Chị nói vậy ai mà hiểu được chị." (GAT) | — | — | `anger 30` · lá cuối | ĐÚNG |
| 1.1.2 | "Người ta nhìn vậy thôi chớ hổng có ý gì đâu chị." | — | — | — | ĐÚNG |
| 1.1.3 | "Chị vô đây lâu chưa chị?" | — | — | — | **SỬA** — câu đáp viết cứng "bảy tháng", trong khi 5.2.3 / 6 / 7.1 (khoảng ngày chồng lên) nói "tám tháng". Phải suy từ `day`, hoặc thống nhất một con số |
| 1.2 | "Dạ có mấy từ em hổng hiểu chị à." | — | — | — | ĐÚNG |
| 1.2.1 | "Chị khỏi đổi. Em học từ của chị cũng được mà." | — | — | `mem CARED_FOR_THEM` | ĐÚNG — không hứa một việc, chỉ nói một thái độ |
| 1.2.2 | "Dạ chị nói chậm chậm là em hiểu chị." | — | — | — | ĐÚNG |
| 1.2.3 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 1.3 | "Dạ em đang làm chị ơi." | — | **thiếu** `w.queue >= 1` | `rel −2` | **SỬA** |

### hanh.mayanh — máy ảnh film nhặt chợ Nhật Tảo (SHORT · day 10–40 · minVisits 4)

> `npcs.ts`: chị Hạnh chỉ ghé **thứ Bảy ~10h00 với xác suất 0,6**, và `arcs.ts` cho chị
> **vắng ngày 9–10**. Nên câu mở *"Em có thấy chị cầm cái máy ảnh hôm thứ Bảy không?"*
> có thể hỏi về một buổi sáng chưa từng xảy ra.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 2.1 | "Có chị. Máy phim hả chị?" | **thiếu** — đã gặp chị thứ Bảy vừa rồi | — | — | **SỬA** — khẳng định đã thấy một chuyện có thể chưa xảy ra (lịch T7 chỉ 0,6) |
| 2.1.1 | "Chị tự sửa được luôn hả chị?" | — | — | `mem REMEMBERED_STORY` | ĐÚNG |
| 2.1.1.1 | "Chị chụp rồi chị đăng ở đâu chị?" | — | — | — | ĐÚNG |
| 2.1.1.2 | "Ủa sao chị không cho ai coi hết chị?" | — | — | — | ĐÚNG |
| 2.1.1.3 | "Chị chụp cái xe của em một tấm đi chị." | — | — | **thiếu** cờ | **SỬA** — `arcs.ts` ngày 40 **đã có** cảnh chị xin chụp cái xe (M6, màn kết). Đặt `flag hanhChupXe` ở đây là nối được ngay, không cần code mới |
| 2.1.1.4 | "Chụp rồi cất thì chụp chi vậy chị." | — | — | `rel −2` | ĐÚNG |
| 2.1.2 | "Chị tráng phim ở đâu chị?" | — | — | — | ĐÚNG |
| 2.1.3 | "Dạ em hổng rành máy ảnh chị ơi." (LANH) | — | — | — | ĐÚNG |
| 2.2 | "Em có thấy mà em tưởng máy hư chị." (DUA) | **thiếu** — như 2.1 | — | — | **SỬA** |
| 2.2.1 | "Chị hay ghê chị." | — | — | — | ĐÚNG |
| 2.2.2 | "Chị mua đồ hư chi cho mất công chị." | — | — | `rel −1` | ĐÚNG |
| 2.3 | "Dạ em hổng để ý chị à." (LANH) | — | — | — | ĐÚNG — đường ra trung thực, đúng dù chị có ghé T7 hay không |

### hanh.nhonha — mẹ gọi, nhớ nhà (SHORT · day 12–40 · minVisits 5)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 3S:ket.1 | "Chị ăn đi chị, nguội mất." | — | **thiếu** `t.served` | — | **SỬA** — mời ăn khi chị chưa nhận ổ nào |
| 3S:ket.2 | "Bữa nào chị kể em nghe tiếp nghen chị." | — | — | — | ĐÚNG |
| 3.1 | "Bác có sao hông chị?" | — | — | — | ĐÚNG |
| 3.1.1 | "Chị nhớ nhà hả chị?" | — | — | — | ĐÚNG |
| 3.1.1.1 | "Chị về chơi mấy bữa đi chị." | — | — | — | ĐÚNG |
| 3.1.1.2 | "Chị khóc được thì chị khóc đi chị." | — | — | `mem CARED_FOR_THEM` | ĐÚNG |
| 3.1.1.3 | "Ai xa nhà cũng vậy hết chị ơi." | — | — | — | ĐÚNG |
| 3.1.1.4 | "Vậy chị về quê đi, ở đây chi cho khổ." | — | — | `rel −3` | ĐÚNG |
| 3.1.2 | "Chị kể em nghe nè, em nghe được mà." | — | — | — | ĐÚNG |
| 3.1.3 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 3.2 | "Dạ chị đứng nghỉ chút đi chị." | — | **thiếu** `w.shadeFree` / `needEquip: DU_CHE` | **thiếu** `STAND_IN_SHADE` · `forSec` | **CẦN CODE** — mời đứng khi **không có chỗ nào để đứng**; chị gật rồi vẫn đứng y chỗ cũ |
| 3.2.1 | "Chị đứng bao lâu cũng được chị." | — | **thiếu** như 3.2 | **thiếu** — và câu nói **từ chối có `forSec`** | **CẦN CODE** — "bao lâu cũng được" là chính cái hợp đồng cấm; phải thành một `forSec` có thật rồi chị quay lại mục đích cũ |
| 3.2.2 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 3.3 | "Chị kể chuyện nhà chi với em vậy chị." (GAT) | — | — | `anger 30` · `rel −6` · lá cuối | ĐÚNG |

### hanh.chilan — chị Hạnh để ý chị Lan (SHORT · day 14–40 · minVisits 5)

> `arcs.ts`: **chị Lan vắng hẳn từ ngày 24** (ngày 20 nếu người chơi gọi sai tên), nên cả
> cuộc phải có `when.notFlag` / `need` "chị Lan còn ghé". Hiện không có — cuộc này nói về
> một người đã biến mất.
> Mặt đúng: `npcs.ts` cho chị Hạnh 7h15 **ngay sau chị Lan** 7h05, nên "chị đứng sau" là
> sự thật của lịch, không phải bịa.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 4S:ket.1 | "Dạ ổ pate ít ngò của chị đây chị." | — | **thiếu** `p.holdsFilled` + ổ đúng là pate ít ngò | **thiếu** `GIVE_BREAD` | **CẦN CODE** — và `arcs.ts` **có** đơn quen của chị (pate, `rau: "it"`): khẳng định sai nội dung ổ hiện không bị bắt |
| 4S:ket.2 | "Bữa nào chị thử chào chị ấy một tiếng đi chị." | — | — | `flag hanhChaoLan` (đọc ở `chi-lan.json:380`, và `arcs.ts` M4 ngày 22) | ĐÚNG — mẫu neo chéo tốt nhất file |
| 4S:ket.3 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 4.1 | "Dạ chị Lan. Hai mươi mấy bữa nay y một câu đó chị." | **thiếu** số lần ghé thật của chị Lan | — | — | **SỬA** — cuộc mở từ **ngày 14**; chị Lan nhiều nhất mới ghé 13 lần. "Hai mươi mấy bữa" và câu đáp "mười bảy hôm" đều **không thể đúng** |
| 4.1.1 | "Chị đếm luôn hả chị?" (DUA) | — | — | — | ĐÚNG |
| 4.1.1.1 | "Vậy chị cũng đứng im như chị ấy thôi hả chị." | — | — | `mem REMEMBERED_STORY` | ĐÚNG |
| 4.1.1.2 | "Chị với chị ấy giống nhau ghê chị." | — | — | — | ĐÚNG |
| 4.1.1.3 | "Dạ hai chị nói chuyện với nhau đi cho vui chị." | — | — | — | ĐÚNG — chị **từ chối** ngay, nên không hứa chuyện gì |
| 4.1.1.4 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 4.1.2 | "Chị ấy ít nói lắm chị. Chị đừng để bụng nghen chị." | — | — | — | ĐÚNG |
| 4.1.3 | "Chị để ý chị ấy chi vậy chị?" | — | — | — | ĐÚNG |
| 4.2 | "Chị thuộc luôn câu của chị ấy rồi hả chị?" (DUA) | — | — | — | ĐÚNG — câu đáp trích **đúng từng chữ** đơn của chị Lan trong `arcs.ts:117` |
| 4.2.1 | "Chị đọc giọng Nam nghe được ghê chị." | `hanhToGiay` ✓ | — | `mem CARED_FOR_THEM` | ĐÚNG |
| 4.2.1.1 | "Chị tập hồi nào mà em hổng hay chị." | — | — | — | ĐÚNG |
| 4.2.1.2 | "Chị nói giọng nào cũng được mà chị." | — | — | `mem CARED_FOR_THEM` | ĐÚNG |
| 4.2.1.3 | "Dạ chị tập làm chi cho mệt chị." (LANH) | — | — | `rel −2` | ĐÚNG |
| 4.2.2 | "Chị nhớ dai ghê chị." (DUA) | — | — | — | ĐÚNG |
| 4.2.3 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 4.3 | "Chị đứng xếp hàng mà chị nghe chuyện người ta hả chị." (GAT) | **thiếu** `t.queueing` từng đúng hôm nay | — | `anger 25` | **SỬA** — câu buộc tội; chị Lan có thể vắng và chị Hạnh có thể là người đầu hàng. Cùng họ với lỗi "bảo chị chen hàng trong khi chị không chen" |

### hanh.rau — ngò gai và rau mùi (SHORT · day 5–40)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 5S:ket.1 | "Dạ ổ của chị đây chị. Em bỏ ít ngò rồi." | — | **thiếu** `p.holdsFilled` + ổ **thật sự** ít ngò | **thiếu** `GIVE_BREAD` | **CẦN CODE** — câu dối rẻ nhất cả sáu file: khẳng định về nội dung ổ, được `+2 rel`, và `settlePayment` biết sự thật nhưng thoại không hỏi |
| 5S:ket.2 | "Bữa nào chị đi chợ em dẫn chị đi nghen chị." | — | — | **không có gì** — "Mà chị đồng ý" | **CẦN CODE** — hứa dẫn người ta đi chợ; không cờ, không hạn, không ai đòi. Free word nặng nhất file |
| 5S:ket.3 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 5.1 | "Trong này rau mùi gọi là ngò chị. Ngò gai khác, nó có răng cưa." | — | — | — | ĐÚNG |
| 5.1.1 | "Trời ơi chị. Rồi chị có ăn hông chị?" (DUA) | — | — | — | ĐÚNG |
| 5.1.1.1 | "Chị ăn ba bữa luôn hả chị. Chị gan ghê." (DUA) | — | — | — | ĐÚNG |
| 5.1.1.2 | "Lần sau chị hỏi em trước đi chị, em chỉ cho." | — | — | `flag hanhHoiTu` (đọc ở 6S:ket.2) | ĐÚNG |
| 5.1.1.3 | "Chị kể em nghe em cười muốn chết chị ơi." (DUA) | — | — | — | ĐÚNG |
| 5.1.1.4 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 5.1.2 | "Trong này còn nhiều từ lạ lắm chị. Chị ghi lại đi chị." | — | — | — | ĐÚNG |
| 5.1.3 | "Dạ chị gọi sao cũng được, người ta hiểu mà chị." | — | — | — | ĐÚNG |
| 5.2 | "Dạ chị đưa tờ giấy đó em coi được hông chị?" | — | — | — | ĐÚNG |
| 5.2.1 | "Xấu hổ gì chị. Em thấy chị siêng ghê." | — | — | `flag hanhToGiay` (đọc ở 4.2.1) | ĐÚNG |
| 5.2.1.1 | "Dạ chỗ này nè chị. 'Bắp' chớ hổng phải 'ngô' chị." | — | — | — | ĐÚNG |
| 5.2.1.2 | "Chị ghi cả cách đọc nữa hả chị. Dễ thương ghê chị." (DUA) | — | — | — | ĐÚNG |
| 5.2.1.3 | "Dạ em coi sau nghen chị, giờ em bận." (LANH) | — | **thiếu** `w.queue >= 1` | **thiếu** — "em coi sau" không bao giờ tới | **SỬA** — vừa viện cớ bận không kiểm, vừa hoãn một việc không ai nhắc lại |
| 5.2.2 | "Dạ thôi chị. Chị giữ đi chị." | — | — | — | ĐÚNG |
| 5.2.3 | "Chị ghi chi cho cực. Ở riết rồi quen chị." | — | — | `rel −2` | ĐÚNG |
| 5.3 | "Dạ chị nói giọng gì cũng được, em bán bánh mì hà chị." (LANH) | — | — | `rel −3` · `mem RUDE_TO_THEM` · lá cuối | ĐÚNG |

### hanh.ve — ở tiếp hay về quê (SHORT · day 24–40 · minVisits 8)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 6S:ket.1 | "Chị cứ từ từ chị. Hổng ai bắt chị quyết bữa nay." | — | — | `calm 22` ✓ · `mem CARED_FOR_THEM` | ĐÚNG |
| 6S:ket.2 | "Chị còn chỗ nào hổng hiểu nữa hông chị? Em chỉ cho." | `hanhHoiTu` ✓ | — | — | ĐÚNG |
| 6S:ket.3 | "Dạ ổ của chị đây chị." | — | **thiếu** `p.holdsFilled` | **thiếu** `GIVE_BREAD` | **CẦN CODE** |
| 6.1 | "Chị tính về thiệt hả chị?" | — | — | — | ĐÚNG |
| 6.1.1 | "Chị ở đây chị có gì mà chị chưa muốn về hả chị?" | — | — | — | ĐÚNG |
| 6.1.1.1 | "Vậy thì chị còn một thứ rồi đó chị." | — | — | `mem CARED_FOR_THEM` | ĐÚNG |
| 6.1.1.2 | "Một ổ bánh mì mà giữ người ta lại hả chị." | **thiếu** — đã làm đúng đơn ít ngò ≥ N lần | — | — | **SỬA** — câu đáp ("chỗ người ta **nhớ chị không ăn được ngò**") khai một sự thật `arcs.ts` **đo được** (`c.count("usual:CHI_HANH")`). Người chơi bỏ sai ngò suốt mùa vẫn nghe câu này |
| 6.1.1.3 | "Chị về đi chị. Ở nhà sướng hơn." | — | — | `rel −2` | ĐÚNG |
| 6.1.1.4 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 6.1.2 | "Dạ chị về chị có tiếc hông chị?" | — | — | — | ĐÚNG |
| 6.1.3 | "Chị hỏi em chi chị, em đâu biết gì đâu chị." | — | — | — | ĐÚNG |
| 6.2 | "Em cũng hổng biết chị ơi. Mà chị hỏi em là chị chưa quyết." | — | — | — | ĐÚNG |
| 6.2.1 | "Người quyết rồi thì người ta hổng hỏi ai hết chị." | — | — | `mem REMEMBERED_STORY` | ĐÚNG |
| 6.2.2 | "Chị cứ ghé em mỗi sáng đi, tính sau chị." | — | — | `calm 20` · **thiếu** cờ quyết định | **SỬA** — đây là **điểm rẽ của cả arc** ("ở tiếp hay về"), chị đáp "Mai chị lại ghé", mà không cờ nào ghi lại. `calm 20` chỉ sống trong lượt ghé này |
| 6.2.3 | "Dạ chuyện lớn vậy chị đừng hỏi em chị." (LANH) | — | — | `rel −2` | ĐÚNG |
| 6.3 | "Chị hỏi em mấy chuyện đó em biết đường nào mà trả lời chị." (GAT) | — | — | `anger 25` · lá cuối | ĐÚNG |

### hanh.moiloi — người chơi bắt chuyện (PLAYER_ONLY · SHORT · day 5–40)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 7.1 | "Chị quen trong này chưa chị?" | — | — | — | ĐÚNG |
| 7.2 | "Bữa nay chị kêu chén được chưa chị?" (DUA) | **thiếu** cờ đã nghe `hanh.giong` | — | — | **SỬA** — trò đùa về chữ "chén/bát" chỉ có nghĩa sau `hanh.giong`, mà cuộc đó không đặt cờ |
| 7.3 | "Thôi chị. Em hỏi vu vơ hà." (LANH) | — | — | — | ĐÚNG |

### hanh.moiloi2 — người chơi bắt chuyện, lớp sau (PLAYER_ONLY · SHORT · day 13–40 · minVisits 5)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 8.1 | "Cái máy ảnh chị nhặt ngoài chợ sửa xong chưa chị?" (DUA) | **thiếu** cờ đã nghe `hanh.mayanh` | — | — | **SỬA** — cuộc này mở từ ngày 13, `hanh.mayanh` mở từ ngày 10 và chưa chắc đã chạy |
| 8.2 | "Nhà ngoài kia còn gọi chị hoài hông chị?" | **thiếu** cờ đã nghe `hanh.nhonha` | — | — | **SỬA** — chữ "còn… hoài" giả định đã biết chuyện mẹ gọi |
| 8.3 | "Thôi chị. Em hỏi vòng vo quá." (LANH) | — | — | — | ĐÚNG |

---

## 1. Thống kê

| phán | số nút | % |
|---|---|---|
| `ĐÚNG` | **80** | 79,2 % |
| `SỬA` | **14** | 13,9 % |
| `XOÁ` | **0** | 0 % |
| `CẦN CODE` | **7** | 6,9 % |
| **tổng** | **101** | |

Theo cuộc (ĐÚNG/SỬA/XOÁ/CẦN CODE): `hanh.giong` 12/2/0/1 · `hanh.mayanh` 9/3/0/0 ·
`hanh.nhonha` 11/1/0/2 · `hanh.chilan` 16/2/0/1 · `hanh.rau` 16/1/0/2 · `hanh.ve` 13/2/0/1 ·
`hanh.moiloi` 2/1/0/0 · `hanh.moiloi2` 1/2/0/0.

Tỉ lệ `ĐÚNG` cao nhất sáu file — vì chị Hạnh gần như **không hứa gì**: cuộc của chị là
chuyện kể, không phải chuyện nhờ. Nhưng đó cũng là lý do `act` bằng **0**: chị là nhân
vật dễ viết đúng hợp đồng nhất mà lại được neo ít nhất.

**Trí nhớ trong một cuộc (§3.3): SẠCH.** Bốn nút `GAT` (1.1.1.4, 3.3, 4.3, 6.3) và hai
nút nặng `LANH` + `RUDE_TO_THEM` (5.3) đều là **lá cuối**. Không nút `CHUI` nào — hợp
tính cách: chị Hạnh là người ngoài, chị không chửi đổng cùng ai.

**Tính cách:** không nút nào bắt chị cư xử ngược tính (dè dặt, lễ phép, hay xin lỗi).
Chỗ gần nhất là 3.2.1 — nhưng sai ở **thế giới** (không có chỗ đứng), không ở tính cách.

**Cơ hội bỏ lỡ:** `arcs.ts` cho chị Hạnh gọi **ly trà đá mỗi sáng** và hệ đã có
`OFFER_TEA` (một phần, `refuseTea`). **Không một nút nào trong 101 nút nhắc tới ly trà đá.**

## 2. Đề xuất khoá mới

| khoá đề xuất | nghĩa | nút cần | vì sao §3 không đủ |
|---|---|---|---|
| `t.visitsOf(X) >= N` | người **khác** X đã ghé ngần đó lần | 4.1 | §3.2 chỉ mô tả người đang đứng trước mặt; mọi câu "chị ấy ngày nào cũng…" đều cần khoá này |
| `t.stillComing(X)` | người X chưa biến mất khỏi mùa | cả cuộc `hanh.chilan` | chị Lan vắng hẳn từ ngày 24 (`arcs.ts:207`); `when.notFlag` hiện chỉ đọc cờ chuyện, không đọc trạng thái "đã đi" |
| `t.usualKept >= N` | đã làm đúng đơn quen của họ ngần đó lần | 6.1.1.2 · 5S:ket.1 · 4S:ket.1 | `arcs.ts` đã đếm (`c.count("usual:CHI_HANH")`) nhưng thoại không đọc được con số đó |
| `p.loafMatches(spec)` | ổ **đang cầm** đúng yêu cầu vừa nói | 5S:ket.1 ("em bỏ ít ngò rồi") | §3.1 chỉ có `p.holdsFilled` (có nhân), không biết **nhân gì** |
| `w.shadeFree` dùng được thật | còn chỗ hóng mát trống | 3.2 · 3.2.1 | khoá đã có tên trong §3.4 nhưng `src/world/map.ts` **không có ký tự nào cho ô hóng mát** (§7 hợp đồng xác nhận) |

**Cờ nội dung cần thêm:** `hanhChupXe` (2.1.1.3 → nối vào M6 ngày 40) ·
`hanhKeGiong` / `hanhKeMayAnh` / `hanhKeNhaNgoai` — ba cờ "đã kể" cho 7.2 · 8.1 · 8.2 ·
`hanhOLai` (6.2.2 — chị quyết ở lại, cho arc đọc).

## 3. Hành động cần code

| hành động | nút cần | thời lượng đề xuất | thiếu gì trong game |
|---|---|---|---|
| `GIVE_BREAD` | 1S:ket.2 · 4S:ket.1 · 5S:ket.1 · 6S:ket.3 | tới khi ăn xong (~20–30 s) | §3.5 ghi **CHƯA**. Bốn câu đưa bánh bằng lời là **4 % cả file** |
| `STAND_IN_SHADE` + `LEAVE_SHADE` | 3.2 · 3.2.1 | `forSec` **45–90 s**, hết giờ thì chị đi tiếp đúng mục đích cũ | §3.5 ghi **CHƯA — cần ô mới**. Không có ô hóng mát trong `map.ts`, và `DU_CHE` (540 k, ngày 8) chỉ là hình vẽ ở `StallScene:3076`, không phải một chỗ đứng được |
| `PROMISE_DEED{ việc, hạn ngày }` | 5S:ket.2 ("bữa nào em dẫn chị đi chợ") | 3–7 ngày | như các file khác: `PROMISE` hiện chỉ treo **món kẹp vô ổ** |
| kiểm **nội dung ổ** từ một nút thoại | 5S:ket.1 · 4S:ket.1 | ngay | `settlePayment` biết ổ có bao nhiêu ngò; thoại không có đường hỏi. Không có cái này thì mọi câu "em bỏ ít ngò rồi" là lời nói miễn phí |
| **`while` nói chung** | 11 nút | — | `TalkNode.while` có kiểu trong `talk.ts` nhưng `visibleOptions()`/`talkGate()` không đọc; bong bóng "?" của §4 chưa tồn tại |

---

## 4. §4.1 — "?" là lưới an toàn: xếp lại TĨNH vs ĐỘNG

| sự thật đề xuất | nút | TĨNH / ĐỘNG | khai bằng | lý do |
|---|---|---|---|---|
| `p.holdsFilled` · `p.loafMatches(spec)` | 1S:ket.2 · 4S:ket.1 · 5S:ket.1 · 6S:ket.3 | **TĨNH** | **`need`** → ẩn hẳn | thẻ thoại khoá phím; ổ trên tay không đổi giữa cuộc |
| `t.usualKept >= N` | 6.1.1.2 | **TĨNH** | **`need`** → ẩn hẳn | `arcs.ts` đã đếm (`c.count("usual:CHI_HANH")`); con số chốt từ hôm trước |
| `t.visitsOf(CHI_LAN) >= N` · `t.stillComing(CHI_LAN)` | 4.1 · cả cuộc `hanh.chilan` | **TĨNH** | **`need`** / **`when`** → ẩn hẳn | chị Lan vắng hẳn từ ngày 24 — chuyện này chốt theo ngày, phải chặn ở `when` |
| đã gặp chị Hạnh thứ Bảy vừa rồi | 2.1 · 2.2 | **TĨNH** | **`need`** → ẩn hẳn | quá khứ không đổi; và nên chặn ở `when` luôn |
| các cờ "đã kể" (`hanhKeGiong`…) | 7.2 · 8.1 · 8.2 | **TĨNH** | **`need`** → ẩn hẳn | quá khứ không đổi |
| `t.served` | 3S:ket.1 | **ĐỘNG** | **`while`** → "?" | đổi đúng vào lúc mình đưa ổ |
| `w.queue >= 1` | 1.3 · 5.2.1.3 | **ĐỘNG** | **`while`** → "?" | hàng người đổi trong lúc đọc |
| `t.queueing` (chị Hạnh đang đứng sau chị Lan) | 4.3 | **ĐỘNG** | **`while`** → "?" | chị Lan có thể vừa nhận bánh và đi, làm chị Hạnh thành người đầu hàng |
| `w.shadeFree` · `w.hot` | 3.2 · 3.2.1 | **ĐỘNG** | **`while`** → "?" | có người chiếm chỗ mát, trời đổi |

**Tổng: 17 dòng đề xuất → 11 nên là `need`/`when` (ẩn hẳn), 6 nên là `while` (ra "?").**

Chị Hạnh là người **ngại nhất khi bị hiểu lầm** — cả nhân vật được xây quanh chuyện
*"mở miệng ra là người ta biết chị không phải người ở đây"*. Nên "?" với chị đắt hơn mặt
chữ: một bong bóng `?` từ chị đọc ra như *chị không hiểu tiếng mình nói*, đúng nỗi sợ của
chị. Khuyến nghị: với chị Hạnh, ưu tiên `need` **mạnh hơn** mặc định, và nếu phải "?" thì
câu cụt của chị nên là *"…Vâng?"* chứ không phải *"Hả?"*.

## 5. §4bis — LỜI HỨA CÓ HẠN

Chị Hạnh `deTha 0,6` · `nongTinh 0,3` · `patience 55` · `thanThien 0,4`. Theo §4bis gần
khuôn **người dễ tha: nhắc hai lần rồi thôi, nhưng vẫn nhớ** — nhưng phải sửa một chỗ:
**chị ngại nhắc.** Cả file này chị xin lỗi 7 lần và không đòi ai cái gì bao giờ. Nấc của
chị:

```
nấc 1  chị không nhắc. Chị đứng đợi thêm, và chị tự nghĩ là mình phiền.
nấc 2  chị nói một câu rất nhỏ, nửa xin lỗi:  "…Vâng. Thôi em bận thì thôi em."
nấc 3  chị không nhờ nữa — và đó là mất mát thật, vì cả arc của chị là DÁM NHỜ
```

| nút | hứa gì | hạn | giữ lời thì sao | NUỐT LỜI thì sao |
|---|---|---|---|---|
| 5S:ket.2 "**Bữa nào** chị đi chợ em dẫn chị đi nghen chị" | dẫn chị đi chợ | **3–5 ngày** | `rel +4` · `mem` · và nối thẳng vào arc hoà nhập (`arcs.ts:134`, M3 đo bằng **từ vựng**) | **free word nặng nhất file**: không cờ, không hạn. Chị **đã nói "chị đồng ý"** — với người ngại như chị, đó là một bước rất lớn. Nấc 3 ở đây có giá thật: chị thôi hỏi từ mới (khoá `hanhHoiTu`) |
| 5.1.1.2 "Lần sau chị hỏi em trước đi chị, em chỉ cho" | *(chị hứa sẽ hỏi)* + mình hứa sẽ chỉ | **cả mùa** | `flag hanhHoiTu` ✓ ⇒ 6S:ket.2 mở ra ✓ | **đã có một nửa cây cầu** — chỉ thiếu đường thất bại: nếu người chơi gạt chị ở 5.2.1.3 ("em coi sau nghen chị") thì `hanhHoiTu` nên **tắt** |
| 5.2.1.3 "Dạ **em coi sau** nghen chị, giờ em bận" | xem tờ giấy từ vựng của chị, sau | **cùng lượt ghé** (~60 s) | chị đưa giấy, mình sửa (5.2.1.1) | hiện chị chỉ `rel −2` rồi cất giấy đi. Đúng ra: nếu hết lượt ghé mà chưa coi ⇒ **chị không đưa giấy nữa cả mùa**. Lời hứa duy nhất của file có hạn **trong lượt ghé** |
| 2.1.1.3 "Chị chụp cái xe của em một tấm đi chị" | *(chị chụp)* | **tới ngày 40** | `arcs.ts:265` **đã có sẵn** cảnh M6 ngày 40: *"Cho chị chụp một tấm cái xe nhé"* — tấm ảnh ở màn kết | chỉ cần `flag hanhChupXe`. Không cần nấc phạt: đây là lời hứa **game đã giữ sẵn**, chỉ thiếu sợi dây nối |
| 4S:ket.2 "Bữa nào chị thử chào chị ấy một tiếng đi chị" | *(chị chào chị Lan)* | **tới ngày 22** | `flag hanhChaoLan` ✓ ⇒ `chi-lan` 3.3 ✓ và `arcs.ts:264` M4 ngày 22 ✓ | **mẫu chuẩn nhất file** — có cờ, có người đọc, có cảnh thật trong arc. Không cần sửa |
| 3.2 / 3.2.1 "chị đứng nghỉ chút đi" / "chị đứng bao lâu cũng được" | cho chị một chỗ đứng | **45–90 s** (3.2.1 **cố ý không có hạn** — phải sửa) | `rel +3` | chị gật ("…Vâng… chị đứng một tí thôi") rồi vẫn đứng y chỗ cũ. Không ai biết lời hứa đã bị nuốt, kể cả game |
| 6.2.2 "Chị cứ ghé em mỗi sáng đi, tính sau chị" | giữ chị lại hẻm | **tới hết mùa** | `calm 20` ✓ · **thiếu cờ quyết định** | đây là **điểm rẽ của cả arc** ("ở tiếp hay về"). Nuốt lời = ngày hôm sau chị ghé, mình gọi sai tên / làm sai ngò / lơ chị ⇒ chị về thật. Hiện `calm 20` chỉ sống trong lượt ghé đó |
| 1S:ket.2 / 4S:ket.1 / 5S:ket.1 / 6S:ket.3 "ổ của chị đây chị" | đưa ổ (5S:ket.1 còn khẳng định **ít ngò**) | **ngay** | — | cần `GIVE_BREAD`; 5S:ket.1 còn cần kiểm **nội dung ổ**, nếu không thì nói dối được `+2 rel` |

**Tám lời hứa, không lời nào có hạn.** Nhưng chị Hạnh là nhân vật **gần đích nhất**: hai
trong số tám (`hanhChaoLan`, `hanhChupXe`) đã có **cảnh thật trong `arcs.ts`** chờ sẵn ở
ngày 22 và ngày 40. Nối hai sợi dây đó là việc một dòng cờ, không phải việc code.

**Thiếu trong game:** chỉ báo "đang treo một lời hứa". Với chị Hạnh nó **bắt buộc**, vì
nấc 1 của chị là **không nhắc gì cả**.

## 6. §4ter — TRÍ NHỚ BỐN TẦNG

| tầng | chỗ file này cần | nút |
|---|---|---|
| **`c.*` trong cuộc** | **không thiếu chỗ nào** — bốn `GAT` (1.1.1.4, 3.3, 4.3, 6.3) và nút nặng 5.3 đều là lá cuối. Không `CHUI` nào, hợp tính cách: chị là người ngoài, chị không chửi đổng cùng ai | — |
| **`v.*` trong lượt ghé** | **`v.invitedStand` — thiếu, và hỏng thật.** 3.2 và 3.2.1 là **hai câu mời đứng liên tiếp trong cùng một nhánh**: mời chị đứng, rồi mời chị đứng "bao lâu cũng được". Hai lần mời cho một chỗ đứng không tồn tại | 3.2 → 3.2.1 |
| | `v.promised(X)` — tám lời hứa ở §5, không chỗ nào treo | xem §5 |
| | **`v.gaveTea` — chỗ trống lớn nhất file.** `arcs.ts:136–138` cho chị gọi **ly trà đá mỗi sáng**, cả ba biến thể của đơn. Hệ đã có `OFFER_TEA` (một phần) và `BINH_TRA`. **Không một nút nào trong 101 nút nhắc tới ly trà đá** — nên không có lỗi mời hai lần, nhưng cũng không có một móc neo rẻ nhất mà file này lẽ ra phải có | — |
| **`d.*` trong ngày** | **`d.toldMe(thangO)` — hỏng rõ, và thành ra sai số.** Chị kể "chị ở đây bao lâu" ở **bốn chỗ**: 1.1.3 ("bảy tháng"), 5.2.3 ("tám tháng"), `hanh.ve` opener ("tám tháng"), 7.1 ("Tám tháng rồi"). Khoảng ngày chồng nhau, nên trong một buổi sáng chị trả lời cùng một câu hỏi hai lần — **với hai con số khác nhau** | 1.1.3 ↔ 5.2.3 ↔ 6.x ↔ 7.1 |
| | `d.toldMe(mayAnh)` — `hanh.mayanh` và 8.1 trùng ("chị lắp lại hôm qua") | 2.x ↔ 8.1 |
| | `d.toldMe(meGoi)` — `hanh.nhonha` 3.1 và 8.2 trùng **nguyên câu** *"Bà ấy chỉ hỏi chị ăn uống thế nào mà chị nghẹn"* | 3.1 ↔ 8.2 |
| | `d.toldMe(soTu)` — 1.1.1.1 ("bốn chục từ"), 5.1.2 ("hơn bốn chục từ"), 7.2 ("bốn chục từ cơ") — ba lần một con số trong một ngày | 1.1.1.1 ↔ 5.1.2 ↔ 7.2 |
| **`m.*` cả mùa** | `when.minVisits` dùng ở 5/8 cuộc (4, 5, 5, 5, 8) · `when.day` ở 8/8. Không cuộc nào dùng `when.tier` | — |
| | **`!m.visits(2)` — VI PHẠM LUẬT CỨNG, hai chỗ.** 1.1.3 *"Chị vô đây lâu chưa chị?"* (`hanh.giong`, day 4–40, **không `minVisits`**) và 7.1 *"Chị quen trong này chưa chị?"* (`hanh.moiloi`, day 5–40, **không `minVisits`**) là hai câu **làm quen lần đầu**. Người chơi đã bán cho chị 25 buổi sáng vẫn hỏi được "chị vô đây lâu chưa". Phải khai `need: "!m.visits(2)"` — hoặc đổi lời | **1.1.3 · 7.1** |
| | `m.remembers(E)` thiếu ở **5 nút**: 2.1, 2.2 (thấy chị hôm thứ Bảy), 7.2, 8.1, 8.2 | |
| | `m.visits` đọc được từ nội dung — "bảy tháng / tám tháng" phải suy từ ngày, không viết cứng | 1.1.3 · 5.2.3 · 7.1 |

**Kết luận tầng trí nhớ:** chị Hạnh là **nhân vật duy nhất trong sáu file vi phạm luật
cứng `!m.visits(2)`** — hai câu làm quen lần đầu mở suốt 36 ngày không có `minVisits` nào
chặn. Và chỗ thủng nặng nhất là **`d.*`**: bốn chỗ hỏi "chị ở đây bao lâu rồi" trả về hai
con số khác nhau. Với một nhân vật mà cả arc là **đếm thời gian mình chưa quen được**
(*"Chị ở đây tám tháng rồi em. Chị chưa quen."*), để con số đó sai là hỏng đúng cái đồng
hồ của nhân vật.

> **Ghi chú phạm vi:** phần được giao cho tôi là 6 file NPC có tên. **`walkin.json` không
> nằm trong phần này** — luật §4ter *"với `walkin.json` thì ngược lại: mọi câu giả định
> ĐÃ QUEN đều SAI"* phải được rà bởi người cầm `walkin.json`/`qua-duong.json`.
