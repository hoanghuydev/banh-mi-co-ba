# Rà thoại — ANH BẢO (`src/content/talks/anh-bao.json`)

> ## ⚡ REVAMP 2026-10-20 — ☠️ CHẾT TOÀN BỘ
> Rà thoại theo giọng cũ + hệ trí nhớ/quan hệ đã chết. Toàn bộ thoại viết lại giọng Nam gen Z ở R6 (CANON §9, §17.1). Chỉ giữ để truy vết nội dung cũ.

**Hợp đồng:** `docs/phase-2-he-npc/P2-07-neo-thoai-vao-the-gioi.md` (kể cả §4.1 · §4bis ·
§4ter mới thêm) · **8 cuộc · 94 nút**

**Trạng thái đo được:** `while` **1 lần** (5.2.2, dùng **sai tên khoá**) · `forSec` **0** ·
`needEquip` **0** · `act` **5 lần**: `PROMISE` ×4 (1.1.1.1 pate · 1.2.2 chả lụa ·
5.1.1.1 chả lụa · 6.2.1 ớt) và `STEP_ASIDE` ×1 (1.3).

**Đây là file neo TỐT NHẤT trong sáu file.** Nó giữ cả bốn nút `PROMISE` của toàn bộ kho
thoại, là file duy nhất dùng `when.tier`, và 6.2.1 là **nút hoàn hảo duy nhất tôi tìm
thấy**: có `need` (`baoDuocCho`), có `act` (`PROMISE ot`), và `flag` của nó
(`baoAsksChili`) được **`arcs.ts:143` đọc để đổi hẳn câu gọi món của anh từ hôm sau** —
lời nói đổi thế giới, và người chơi nghe ra nó ở sáng hôm sau.

**Nhân vật:** `deTha 0,8` · `nongTinh 0,2` · `patience 75` — người **dễ tha nhất** trong
sáu người. Nói lắp, rụt rè, mở câu bằng "Dạ…". Đơn quen (`arcs.ts:142`): **ổ đầy đủ**
(pate + thịt + chả lụa), và `ot: 2` sau khi `baoAsksChili` bật.

**Ba chỗ hỏng rõ nhất:**
* **Giá viết cứng và SAI.** 3.2.2 nói *"Hai ổ, bốn chục"*. `econ.json:8` khai
  `menu_k.dayDu = 32`, nên hai ổ đầy đủ là **64 k**, không phải 40 k. Tệ hơn: cuộc này mở
  ngày 17–23, trùng đúng đợt `dich_heo` (`calendar.json:23`, ngày 19–23, pate ×1,40,
  thịt ×1,25) nên giá thật còn cao hơn nữa.
* **Nhận đơn hai ổ bằng lời.** 3.1.3 và 3.2 ("Ừ, hai ổ đầy đủ") không có `does` nào.
  `arcs.ts:271` chỉ phát đơn hai ổ ở **ngày 19–21**, còn cuộc mở **17–23** — bốn ngày
  trong bảy, người chơi xác nhận một đơn không tồn tại.
* **Giả định sai đơn quen.** 5.1.1 nói *"ba tiếng ngủ mà ăn bánh mì không"* — nhưng đơn
  quen của anh là **ổ đầy đủ**; "bánh mì không" chỉ đúng ở `bao.hettien` và ở ngày 29
  (SK-31).

---

### bao.hettien — cuối tháng hết tiền (FULL · day 6–40)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1S:ket.1 | "Dạ. Em ăn đi nghen." | — | **thiếu** `t.served` | — | **SỬA** — mời ăn khi chưa đưa ổ |
| 1S:ket.2 | "Mai em ghé nữa nghen." | — | — | — | ĐÚNG — xã giao thuần |
| 1.1 | "Cuối tháng rồi hả em?" | **thiếu** — ngày trong tháng | — | — | **SỬA** — cuộc mở suốt 35 ngày; câu này chỉ đúng khoảng một phần tư trong số đó, mà anh vẫn đáp *"sao cô biết hay vậy cô"* |
| 1.1.1 | "Cô bán ở đây lâu rồi em. Cô nhìn là biết." | — | — | — | ĐÚNG |
| 1.1.1.1 | "Để cô bỏ chút pate, cô hổng tính tiền." | — | — | `PROMISE pate` ✓ · `flag baoDuocCho` · kiểm lúc đưa bánh | **ĐÚNG** — chính câu `talk.ts` lấy làm ví dụ lỗi của bản cũ, nay đã neo đủ |
| 1.1.1.2 | "Ba bữa thì em ăn gì hả em?" | — | — | — | ĐÚNG |
| 1.1.1.3 | "Em ghi sổ đi, mai mốt trả cô." | — | — | — | ĐÚNG — anh **từ chối** ("thôi cô, em ngại lắm"), nên không món nợ nào bị bỏ lửng |
| 1.1.1.4 | "Hổng có tiền thì đừng ăn sáng em." (GAT) | — | — | `anger 25` · `rel −6` · lá cuối | ĐÚNG |
| 1.1.2 | "Ba má em gửi tháng nhiêu hả em?" | — | — | `rel −1` | ĐÚNG |
| 1.1.3 | "Mười ngàn em." | — | — | — | ĐÚNG — khớp `econ.json` `menu_k.khong = 10` |
| 1.2 | "Mười ngàn em. Mà em ăn vậy no hông?" | — | — | — | ĐÚNG |
| 1.2.1 | "Quen là quen sao em?" | — | — | `mem REMEMBERED_STORY` | ĐÚNG |
| 1.2.2 | "Thôi cô bỏ cho em miếng chả." | — | — | `PROMISE chalua` ✓ | ĐÚNG |
| 1.2.3 | "Ừ. Mười ngàn." (LANH) | — | — | — | ĐÚNG |
| 1.3 | "Mười ngàn. Em đứng qua bên cho cô bán nghen." (LANH) | — | **thiếu** `w.queue >= 1` | `STEP_ASIDE` ✓ | **SỬA** — act đúng, nhưng "cho cô bán" khi **không có ai đứng sau**; đúng khuôn lỗi "bảo người ta dạt ra mà không ai cần chỗ" |

### bao.tiengnhat — dịch truyện tiếng Nhật (SHORT · day 14–40 · minVisits 6 · tier ACQUAINTANCE/FRIEND)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 2.1 | "Nó nói em đọc chữ gì ngoằn ngoèo đó em." | **thiếu** cờ bé Su đã kể | — | — | **SỬA** — khai một chuyện bé Su nói mà bé Su có thể chưa nói. Ngay cạnh 2.3 **có** `need` cho đúng loại việc đó |
| 2.1.1 | "Em dịch cho ai vậy em?" | — | — | — | ĐÚNG |
| 2.1.1.1 | "Hổng có tiền mà em làm chi vậy em?" | — | — | — | ĐÚNG |
| 2.1.1.2 | "Em giỏi quá em. Cô hổng biết luôn." | — | — | `mem CARED_FOR_THEM` | ĐÚNG |
| 2.1.1.3 | "Vậy em học tiếng Nhật được bao lâu rồi em?" | — | — | `mem REMEMBERED_STORY` | ĐÚNG |
| 2.1.1.4 | "Lo học đi em, dịch truyện chi." (GAT) | — | — | `anger 25` · lá cuối | ĐÚNG |
| 2.1.2 | "Truyện gì vậy em? Cô có biết hông?" | — | — | — | ĐÚNG |
| 2.1.3 | "Ờ." (LANH) | — | — | — | ĐÚNG |
| 2.2 | "Hổng có em. Nó có nói gì đâu." | **thiếu** phủ định cờ ở 2.1 | — | — | **SỬA** — nếu bé Su **đã** kể thì đây là nói dối một người rụt rè đang hỏi về mình, và không bị tính gì |
| 2.2.1 | "Mà em muốn nói gì thì nói đi em." | — | — | — | ĐÚNG |
| 2.2.2 | "Ừ." (LANH) | — | — | — | ĐÚNG |
| 2.3 | "Nó nói nó tính chào em một tiếng đó em." | `suChaoBao` ✓ (đặt ở `be-su.json:1089`) | — | **thiếu** cờ | **SỬA** — `need` đúng, nhưng anh đáp *"Để em chào trước. Em tập trong phòng hai bữa rồi"* mà không đặt cờ nào cho `be-su.json` đọc lại. Một nửa cây cầu |
| 2.4 | "Em hỏi gì kỳ vậy em." (GAT) | — | — | `anger 20` · lá cuối | ĐÚNG |

### bao.thi — đi thi cuối kỳ (BARK · day 17–23)

> `arcs.ts:271` phát đơn hai ổ **chỉ ở ngày 19–21**. Cuộc mở **17–23**. Bốn trong bảy ngày,
> cả cuộc nói về một đơn không có.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 3.1 | "Thi gì vậy em? Cô chúc em làm bài tốt nghen." | — | — | — | ĐÚNG |
| 3.1.1 | "Em học nguyên đêm hả em? Mắt em đỏ kìa." | — | — | `mem CARED_FOR_THEM` | ĐÚNG |
| 3.1.2 | "Hai ổ lận hả em? Em ăn hết nổi hông?" (DUA) | — | **thiếu** `t.hasOrder` = 2 ổ | — | **SỬA** — hỏi về một đơn hai ổ chỉ có ở ngày 19–21 |
| 3.1.3 | "Ừ, hai ổ đầy đủ." | — | **thiếu** như 3.1.2 | **thiếu** — không đơn nào được tạo/sửa | **SỬA** |
| 3.2 | "Ừ. Hai ổ." (LANH) | — | **thiếu** như 3.1.2 | **thiếu** | **SỬA** |
| 3.2.1 | "…Mà em thi tốt nghen em." | — | — | — | ĐÚNG |
| 3.2.2 | "Hai ổ, bốn chục. Em gửi tiền." (LANH) | — | — | **thiếu** — tiền không vào két | **SỬA** — **giá sai**: `menu_k.dayDu = 32` ⇒ hai ổ là **64 k**. Và ngày 19–23 còn trúng `dich_heo` (`calendar.json:23`) nên giá thật cao hơn nữa. Giá viết cứng vào lời thoại là một lời hứa với người chơi mà hệ kinh tế không giữ |

### bao.clip — bé Su quay trúng anh (SHORT · day 14–40 · minVisits 5 · needFlag `suXoaClip`)

> Cuộc duy nhất của file dùng `when.needFlag` — cả cuộc chỉ mở sau khi `be-su.json:1005`
> đặt `suXoaClip`. Đây là cách neo đúng ở tầng cuộc.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 4S:ket.1 | "Em khỏi lo. Nó vui tính lắm." | — | — | — | ĐÚNG |
| 4S:ket.2 | "Ổ của em đây nghen." | — | **thiếu** `p.holdsFilled` | **thiếu** `GIVE_BREAD` | **CẦN CODE** |
| 4S:ket.3 | "Ừ." (LANH) | — | — | — | ĐÚNG |
| 4.1 | "Nó hổng giận đâu em. Nó xoá liền đó." | `suXoaClip` (ở `when`) ✓ | — | — | ĐÚNG |
| 4.1.1 | "Sao em kỳ? Em có quyền mà em." | — | — | — | ĐÚNG |
| 4.1.1.1 | "Em chỉ gì? Em nói hết câu đi em." | — | — | `mem CARED_FOR_THEM` | ĐÚNG — và hợp tính cách nhất file: kéo một người nói lắp nói hết câu |
| 4.1.1.2 | "Em hổng khó chịu mà em xin lỗi nó ba lần đó em." (DUA) | **thiếu** — ba lần xin lỗi có thật? | — | — | **SỬA** — con số cụ thể mà không ai đếm |
| 4.1.1.3 | "Vậy bữa nào em nói với nó một tiếng đi em." | — | — | **thiếu** cờ | **SỬA** — anh nhận lời ("em sẽ nói. Chắc vậy") mà `be-su.json` không đọc được gì; trùng đích với 2.3 |
| 4.1.1.4 | "Em nghĩ nhiều quá đó em." (LANH) | — | — | `rel −2` | ĐÚNG |
| 4.1.2 | "Nó còn khen cái đoạn đó đẹp nữa đó em." (DUA) | **thiếu** cờ bé Su khen | — | — | **SỬA** — cùng lỗi 2.1 |
| 4.1.3 | "Ừ. Chuyện qua rồi em." | — | — | — | ĐÚNG |
| 4.2 | "Cuốn truyện em cầm bữa đó là truyện gì vậy em?" | `suXoaClip` (ở `when`) ✓ | — | — | ĐÚNG |
| 4.2.1 | "Em đọc được bản gốc luôn hả em?" | — | — | `mem REMEMBERED_STORY` | ĐÚNG |
| 4.2.1.1 | "Tự học mà đọc được là giỏi lắm đó em." | — | — | `flag baoRespect` (đọc ở `arcs.ts:277` và `ending.ts:42`) | ĐÚNG — một trong rất ít cờ đi thẳng vào **màn kết** |
| 4.2.1.2 | "Vậy em dịch giùm cô cái hộp bánh tiếng Nhật kia đi em." (DUA) | — | **thiếu** — cái hộp đó có thật? | — | **SỬA** — trò đùa trỏ vào một vật không có trong `StallScene`; anh còn đính chính "đó là tiếng Hàn cô ơi" nên vật đó phải nhìn thấy được |
| 4.2.1.3 | "Ừ. Hay." (LANH) | — | — | — | ĐÚNG |
| 4.2.2 | "Em đọc chậm mà em đọc hoài là được rồi em." | — | — | — | ĐÚNG |
| 4.2.3 | "Ừ." (LANH) | — | — | — | ĐÚNG |
| 4.3 | "Cô bận lắm em ơi. Chuyện đó em tự lo đi em." (LANH) | — | **thiếu** `w.queue >= 1` | `rel −3` · `mem RUDE_TO_THEM` | **SỬA** |

### bao.lamthem — bưng bàn tới hai giờ sáng (FULL · day 12–40 · minVisits 4)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 5S:ket.1 | "Em ráng giữ sức nghen em." | — | — | `mem CARED_FOR_THEM` | ĐÚNG |
| 5S:ket.2 | "Ổ của em đây nghen." | — | **thiếu** `p.holdsFilled` | **thiếu** `GIVE_BREAD` | **CẦN CODE** |
| 5S:ket.3 | "Ừ." (LANH) | — | — | — | ĐÚNG |
| 5.1 | "Hai giờ sáng lận hả em? Rồi em có kịp lên trường hông em?" | — | — | — | ĐÚNG |
| 5.1.1 | "Em ăn sáng tử tế chút đi em. Ba tiếng ngủ mà ăn bánh mì không." | — | **thiếu** `t.orderIs(KHONG)` | — | **SỬA** — đơn quen của anh là **ổ đầy đủ** (`arcs.ts:142`); "bánh mì không" chỉ đúng ở `bao.hettien` và ngày 29 |
| 5.1.1.1 | "Bữa nay cô bỏ thêm miếng chả cho em nghen." | — | — | `PROMISE chalua` ✓ | ĐÚNG |
| 5.1.1.2 | "Em bưng bàn một đêm được nhiêu em?" | — | — | — | ĐÚNG |
| 5.1.1.3 | "Hồi cô bằng tuổi em cô cũng vậy hà." | — | — | — | ĐÚNG |
| 5.1.1.4 | "Ừ, em biết lo là tốt." | — | — | — | ĐÚNG |
| 5.1.2 | "Em làm chi cho cực vậy em. Để dành tiền làm gì?" | — | — | — | ĐÚNG |
| 5.1.2.1 | "Máy tính để làm gì hả em?" | — | — | `mem REMEMBERED_STORY` | ĐÚNG |
| 5.1.2.2 | "Em nói nửa chừng hoài vậy em." (DUA) | — | — | — | ĐÚNG |
| 5.1.2.3 | "Ừ. Tiền em em lo." (LANH) | — | — | `rel −2` | ĐÚNG |
| 5.1.3 | "Ba tiếng là hổng đủ đâu em. Em nghỉ bớt đi em." | — | — | — | ĐÚNG |
| 5.2 | "Em đứng ngủ gục ở đây luôn kìa em." (DUA) | — | **thiếu** dáng ngủ gục có thật | — | **SỬA** — tả một dáng người mà `reaction.ts` không có; anh còn xác nhận "dạ chắc em có" |
| 5.2.1 | "Em ngồi ghế kia đi, cô kêu em dậy." | **thiếu** `needEquip: GHE_BAN` | — | `calm 28` · **thiếu** `THEY_SIT · tới khi phục vụ xong` | **CẦN CODE** — mời ngồi lên cái ghế 320 k có thể chưa mua, và anh đáp "Dạ. Em ngồi" rồi vẫn đứng. Kèm một lời hứa ("cô kêu em dậy") không có hạn |
| 5.2.2 | "Em uống ly trà đá cho tỉnh nghen em." | **thiếu** `needEquip: BINH_TRA` | `p.hasTea` ✗ **sai tên** → `p.holdsTea` | `calm 20` · **thiếu** `OFFER_TEA · ~8 s` | **SỬA** — nút `while` duy nhất của file, khai một khoá không có trong §3.1 |
| 5.2.3 | "Ừ, em tỉnh lại rồi mua đi em." (LANH) | — | — | `rel −1` | ĐÚNG |
| 5.3 | "Em kể chuyện em hoài cô làm hổng kịp nè em." (GAT) | — | **thiếu** `w.queue >= 1` | `anger 25` · lá cuối | **SỬA** — gắt một người rụt rè vì "làm hổng kịp" trong khi có thể quầy không có ai |

### bao.noi — anh nói được trọn câu (FULL · day 26–40 · minVisits 9 · tier ACQUAINTANCE/FRIEND)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 6S:ket.1 | "Ừ. Mai em nói nữa nghen." | — | — | — | ĐÚNG |
| 6S:ket.2 | "Ổ của em đây nghen." | — | **thiếu** `p.holdsFilled` | **thiếu** `GIVE_BREAD` | **CẦN CODE** |
| 6.1 | "Ủa. Bữa nay em hổng có 'dạ' đầu câu luôn ha em." (DUA) | — | — | — | **ĐÚNG** — và neo vào chính **văn bản của `opener`** (câu mở cuộc này là câu duy nhất của anh không bắt đầu bằng "Dạ"). Neo rẻ nhất, chắc nhất, không cần một dòng code nào |
| 6.1.1 | "Em tập nói hả em?" | — | — | — | ĐÚNG |
| 6.1.1.1 | "Em tập ở đây cũng được mà em. Cô nghe." | — | — | `mem CARED_FOR_THEM` | ĐÚNG |
| 6.1.1.2 | "Cái tường nó trả lời em hông em?" (DUA) | — | — | — | ĐÚNG |
| 6.1.1.3 | "Tập chi vậy em? Em nói sao cũng được mà." | — | — | — | ĐÚNG |
| 6.1.1.4 | "Ừ, hay." (LANH) | — | — | `rel −2` · lá cuối | ĐÚNG |
| 6.1.2 | "Hai tuần để nói một câu. Em kiên trì ghê em." | — | — | `mem CARED_FOR_THEM` | ĐÚNG |
| 6.1.3 | "Ừ, em gọi gì cô cũng làm được hết." | — | **thiếu** `!p.soldOut` | — | **SỬA** — hứa làm được mọi thứ khi có thể đã hết sạch bánh |
| 6.2 | "Nhiều ớt hả em? Em ăn cay được hả?" | — | — | — | ĐÚNG |
| 6.2.1 | "Phiền gì em. Cô bỏ chút ớt có mất gì đâu." | `baoDuocCho` ✓ | — | `PROMISE ot` ✓ · `flag baoAsksChili` → **`arcs.ts:143` đổi hẳn câu gọi món của anh từ hôm sau** | **ĐÚNG** — **nút hoàn hảo duy nhất của cả sáu file**: đủ `need` + `act` + hệ quả nghe ra được ở sáng hôm sau |
| 6.2.2 | "Em sợ phiền cô mà em đứng đây mỗi sáng đó em." (DUA) | — | — | — | ĐÚNG |
| 6.2.3 | "Em nói sớm thì cô bỏ sớm rồi em." | — | — | — | ĐÚNG |
| 6.3 | "Ừ. Một ổ đầy đủ." (LANH) | — | — | `rel −2` | ĐÚNG — lạnh nhạt với câu anh tập hai tuần mới nói ra; `rel −2` là hệ quả đủ |

### bao.moiloi — người chơi bắt chuyện (PLAYER_ONLY · SHORT · day 7–40)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 7.1 | "Em ăn sáng chưa em?" | — | **thiếu** `!t.served` | — | **SỬA** — hỏi khi anh đang cầm ổ mình vừa đưa |
| 7.2 | "Em nói từ từ nghen em. Cô hổng có gấp đâu." | — | — | — | ĐÚNG — câu hợp tính cách nhất cả file; câu đáp ("Cô là người đầu tiên nói với em câu đó") đáng giá hơn mọi `act` |
| 7.3 | "Em muốn gì thì nói lẹ giùm em. Cô làm hổng kịp nè." (GAT) | — | **thiếu** `w.queue >= 1` | `anger 25` | **SỬA** — giục một người nói lắp vì "làm hổng kịp" mà không kiểm quầy có ai |

### bao.moiloi2 — người chơi bắt chuyện, lớp sau (PLAYER_ONLY · SHORT · day 15–40 · minVisits 6)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 8.1 | "Em dịch tới đâu rồi em?" | **thiếu** cờ đã nghe `bao.tiengnhat`/`bao.clip` | — | — | **SỬA** — cuộc mở ngày 15, `bao.tiengnhat` mở ngày 14 và chưa chắc đã chạy |
| 8.2 | "Tối qua em ngủ được mấy tiếng em?" (DUA) | **thiếu** cờ đã nghe `bao.lamthem` | — | — | **SỬA** |
| 8.3 | "Thôi em. Cô hỏi cho có." (LANH) | — | — | — | ĐÚNG |

---

## 1. Thống kê

| phán | số nút | % |
|---|---|---|
| `ĐÚNG` | **66** | 70,2 % |
| `SỬA` | **24** | 25,5 % |
| `XOÁ` | **0** | 0 % |
| `CẦN CODE` | **4** | 4,3 % |
| **tổng** | **94** | |

Theo cuộc (ĐÚNG/SỬA/XOÁ/CẦN CODE): `bao.hettien` 12/3/0/0 · `bao.tiengnhat` 10/3/0/0 ·
`bao.thi` **3/4/0/0** · `bao.clip` 13/5/0/1 · `bao.lamthem` 13/4/0/2 · `bao.noi` 13/1/0/1 ·
`bao.moiloi` 1/2/0/0 · `bao.moiloi2` 1/2/0/0.

`bao.thi` là **cuộc duy nhất trong cả sáu file có số nút `SỬA` nhiều hơn `ĐÚNG`** — vì nó
nói về tiền và về đơn hàng, hai thứ game đo được chính xác và thoại thì đoán.

**Trí nhớ trong một cuộc (§3.3): SẠCH.** Năm nút `GAT` (1.1.1.4, 2.1.1.4, 2.4, 5.3, 7.3)
đều là lá cuối hoặc kết nhịp. Không nút `CHUI` nào — đúng tính cách: anh Bảo không chửi ai.

**Tính cách:** không nút nào bắt anh cư xử ngược tính. Ngược lại, nhiều nút **dùng** tính
nói lắp làm chất liệu (4.1.1.1 "em nói hết câu đi em", 5.1.2.2 "em nói nửa chừng hoài",
6.1 cả cuộc, 7.2). Đây là file viết tính cách tốt nhất trong sáu file.

## 2. Đề xuất khoá mới

| khoá đề xuất | nghĩa | nút cần | vì sao §3 không đủ |
|---|---|---|---|
| `t.orderIs(X)` | đơn hôm nay đúng là X | 5.1.1 · 3.1.2 · 3.1.3 · 3.2 | §3.2 có `t.hasOrder` (đã có món trong đầu) nhưng không nói **món gì** và **mấy ổ** |
| `w.dayOfMonth >= N` | hôm nay là ngày thứ mấy trong tháng | 1.1 ("cuối tháng rồi hả em") | §3.4 không có khoá lịch; `when.day` là ngày trong mùa 40 ngày, không phải ngày trong tháng |
| `t.pose(X)` | họ đang ở dáng X (ngủ gục, ôm bụng, nhìn đồng hồ) | 5.2 | `reaction.ts` có hệ dáng (`PoseId`) nhưng thoại không đọc được dáng hiện tại |
| `p.price(X)` | giá thật của món X hôm nay | 3.2.2 | giá đang viết cứng vào lời thoại, trong khi `econ.json` + `calendar.json` đổi giá theo ngày |
| `need` nhận dấu `!` | phủ định cờ | 2.2 · 6.2 (`!baoAsksChili`) | `visibleOptions` hiện chỉ `!!gate.flags[o.need]` |

**Cờ nội dung cần thêm:** `baoSeChaoSu` (2.3 và 4.1.1.3 → cho `be-su.json` đọc) ·
`suKeBao` / `suKhenBao` (do `be-su.json` đặt → cho 2.1 và 4.1.2) ·
`baoKeDich` / `baoKeLamThem` (cho 8.1 · 8.2).

## 3. Hành động cần code

| hành động | nút cần | thời lượng đề xuất | thiếu gì trong game |
|---|---|---|---|
| `GIVE_BREAD` | 4S:ket.2 · 5S:ket.2 · 6S:ket.2 | tới khi ăn xong | §3.5 ghi **CHƯA** |
| `THEY_SIT` | 5.2.1 | tới khi phục vụ xong, rồi đứng dậy | **không có trong §3.5**; `GHE_BAN` chỉ là hình vẽ ở `StallScene:3081` |
| `ORDER_CHANGE{ sl }` | 3.1.3 · 3.2 | ngay | không có đường sửa đơn từ một nút thoại |
| `TAKE_CASH` / đọc giá thật | 3.2.2 | ngay | giá hai ổ đầy đủ phải lấy từ `econ.json` × hệ số `calendar.json`, không viết cứng "bốn chục" |
| `OFFER_TEA` (hoàn thiện) | 5.2.2 | **~8 s**, có đường từ chối | §3.5 ghi "một phần (`refuseTea`)"; thiếu phần tốn một ly thật và `forSec` |
| **`while` nói chung** | 11 nút | — | `TalkNode.while` có kiểu nhưng không ai đọc; "?" của §4 chưa có |

---

## 4. §4.1 — "?" là lưới an toàn: xếp lại TĨNH vs ĐỘNG

| sự thật đề xuất | nút | TĨNH / ĐỘNG | khai bằng | lý do |
|---|---|---|---|---|
| `needEquip: GHE_BAN` · `BINH_TRA` | 5.2.1 · 5.2.2 | **TĨNH** | **`needEquip`** → ẩn hẳn | mua rồi là mua |
| `p.holdsTea` · `p.holdsFilled` · `!p.soldOut` | 5.2.2, 4S/5S/6S:ket, 6.1.3 | **TĨNH** | **`need`** → ẩn hẳn | thẻ thoại khoá phím; tay người chơi không đổi giữa cuộc |
| `t.orderIs(…)` · `t.hasOrder` = 2 ổ | 5.1.1, 3.1.2, 3.1.3, 3.2 | **TĨNH** | **`need`** → ẩn hẳn | đơn chốt ở `phase: ordering`, trước khi thẻ mở |
| `w.dayOfMonth` | 1.1 | **TĨNH** | **`when.day`** (tầng cuộc) | ngày không đổi giữa cuộc — và nên chặn ở `when`, đừng để cuộc mở rồi mới ẩn nút |
| `t.pose(ngủ gục)` | 5.2 | **TĨNH** trong một nhịp | **`need`** → ẩn hẳn | anh không bừng tỉnh giữa lúc đọc; nếu có thì câu đó vốn không nên bày ra |
| `m.remembers(…)` các cờ "đã kể" | 2.1, 2.2, 4.1.1.2, 4.1.2, 8.1, 8.2 | **TĨNH** | **`need`** → ẩn hẳn | quá khứ không đổi |
| `w.queue >= 1` | 1.3, 4.3, 5.3, 7.3 | **ĐỘNG** | **`while`** → "?" | người xếp hàng tới và đi trong lúc mình đọc |
| `t.served` / `!t.served` | 1S:ket.1, 7.1 | **ĐỘNG** | **`while`** → "?" | đổi đúng vào lúc mình đưa ổ ra |
| cái hộp bánh ở quầy | 4.2.1.2 | **ĐỘNG** (đạo cụ trên quầy) | **`while`** → "?" | đồ trên quầy bị dọn đi được |

**Tổng: 21 dòng đề xuất → 17 nên là `need`/`needEquip`/`when` (ẩn hẳn), 4 nên là `while`
(ra "?").** Hơn **tám phần mười** chỗ hỏng của anh Bảo xử bằng ẩn nút — đúng tinh thần
*"hạn chế hiện câu gợi ý trả lời lạc đề"*. Điều này **đặc biệt đúng với anh Bảo**: một
người rụt rè bị đáp "?" mất mát nhiều hơn người khác, vì anh vốn đã sợ nói sai.

## 5. §4bis — LỜI HỨA CÓ HẠN

Anh Bảo `deTha 0,8` · `nongTinh 0,2` · `patience 75` ⇒ theo bảng §4bis là **người dễ tha:
nhắc hai lần, rồi thôi, nhưng VẪN NHỚ**. Và anh nói lắp — nên "nhắc" của anh phải nhỏ
tới mức gần như không nhắc: *"Dạ… cô ơi… dạ thôi cô, hổng sao đâu cô."*
Đó chính là chỗ nguy: **anh là người dễ bị nuốt lời nhất mà kêu ít nhất.**

| nút | hứa gì | hạn (giây thật) | giữ lời thì sao | NUỐT LỜI thì sao (dễ tha — 3 nấc, nấc cuối không bỏ đi) |
|---|---|---|---|---|
| 1.1.1.1 "Để cô bỏ chút pate, cô hổng tính tiền" | bỏ pate vô ổ, không tính tiền | **tới lúc đưa bánh** (đã đúng) | `PROMISE_KEPT` +45 · `mem CARED_FOR_THEM` | **đã có đường thất bại thật** (`BROKEN_PROMISE` −85 / −55 nếu bỏ thứ khác). **Mẫu chuẩn.** Chỉ thiếu: `need` kiểm **còn pate trong kho** — hứa một món đã hết là tự đặt bẫy cho mình |
| 1.2.2 / 5.1.1.1 "cô bỏ cho em miếng chả" | bỏ chả lụa vô ổ | tới lúc đưa bánh | như trên | như trên; thiếu `need` còn chả lụa |
| 6.2.1 "Cô bỏ chút ớt có mất gì đâu" | bỏ nhiều ớt | tới lúc đưa bánh | như trên **+ `arcs.ts` đổi câu gọi món hôm sau** | mẫu chuẩn nhất; nếu nuốt lời thì anh **rụt lại**, và nên **xoá `baoAsksChili`** — anh vừa mới dám xin |
| 5.2.1 "Em ngồi ghế kia đi, **cô kêu em dậy**" | gọi anh dậy khi ổ xong | **~60 s** (ngủ gật thì lâu hơn) | `calm 28` như đã khai | **nấc 1 @60 s**: anh tự giật mình, "Dạ… em ngủ quên" · **nấc 2 @90 s**: `rel −2`, anh đi mà không lấy ổ · **anh KHÔNG chửi** — và đó là lý do nó phải bị phạt bằng `mem`, không bằng `anger` |
| 5.2.2 "Em uống ly trà đá cho tỉnh nghen em" | rót một ly trà đá | **25 s** | `calm 20` như đã khai | **nấc 1 @25 s**: anh đứng đó, không nhắc · **nấc 2 @40 s**: "Dạ… thôi cô, em hổng khát đâu cô" (nói dối cho mình đỡ ngại) · `rel −2`, `mem` **nhớ** |
| 1.1.1.3 "Em ghi sổ đi, mai mốt trả cô" | cho mua chịu | — | — | **không cần hạn**: anh từ chối tại chỗ. Mẫu đúng |
| 2.3 / 4.1.1.3 "bữa nào em nói với nó một tiếng đi em" | *(anh hứa, không phải người chơi)* | — | — | lời hứa của NPC với chính mình; cần một **cờ** để `be-su.json` đọc, không cần hạn giây |

**Bốn `PROMISE` của file này là bốn lời hứa duy nhất trong cả sáu file có đường thất bại
thật.** Hai lời hứa còn lại (5.2.1, 5.2.2) là loại §4bis mới nói tới — *"đi rót trà mà họ
không rót, bắt người ta đợi"* — và với anh Bảo thì hậu quả **không phải chửi rồi bỏ đi**,
mà là **im lặng rồi vẫn nhớ**. Đó là nấc đắt nhất, vì người chơi không nghe thấy nó.

**Thiếu trong game:** chỉ báo "đang treo một lời hứa". Với anh Bảo thì nó **bắt buộc**:
anh không kêu, nên nếu game không nhắc thì người chơi không bao giờ biết mình vừa nuốt lời.

## 6. §4ter — TRÍ NHỚ BỐN TẦNG

| tầng | chỗ file này cần | nút |
|---|---|---|
| **`c.*` trong cuộc** | **không thiếu chỗ nào** — mọi `GAT` đều là lá cuối | — |
| **`v.*` trong lượt ghé** | **`v.promised(X)` — thiếu, và hỏng thật.** `bao.hettien` (1.2.2 chả lụa) và `bao.lamthem` (5.1.1.1 chả lụa) **cùng hứa một món** và cùng mở được trong một lượt ghé ⇒ hứa chả lụa hai lần, một miếng chả, hai lần `PROMISE_KEPT` | 1.2.2 ↔ 5.1.1.1 |
| | `v.gaveTea` — 5.2.2 là nút mời trà duy nhất, không lặp trong file. **Nhưng** anh Bảo tới 8h45 (`npcs.ts`), giờ `LULL`, cùng khung với ông Hải: nếu hai người cùng quầy thì ngân sách trà phải tính chung | 5.2.2 |
| | `v.apologised` — không có chỗ lặp | — |
| **`d.*` trong ngày** | **`d.toldMe(tiengNhat)` — hỏng rõ nhất.** `bao.tiengnhat` (2.1.1.3) và `bao.clip` (4.2.1) **cùng tiết lộ "em tự học tiếng Nhật"**, cả hai mở từ ngày 14 với `minVisits` 6 và 5. Trong một ngày, anh kể chuyện tự học tiếng Nhật **hai lần như lần đầu** | 2.1.1.3 ↔ 4.2.1 |
| | `d.toldMe(ngu3tieng)` — 5.1 ("ngủ ba tiếng") và 8.2 ("tối qua em ngủ được mấy tiếng") trùng nội dung trong cùng một ngày | 5.1 ↔ 8.2 |
| | `d.toldMe(dich)` — `bao.tiengnhat` và 8.1 trùng | 2.x ↔ 8.1 |
| **`m.*` cả mùa** | **Đã làm tốt nhất sáu file.** Là file **duy nhất** dùng `when.tier: ["ACQUAINTANCE","FRIEND"]` (cuộc 2 và 6) — đúng tinh thần `m.tier(X)`. `when.minVisits` dùng ở 5/8 cuộc (4, 5, 6, 6, 9) | — |
| | `m.remembers(E)` thiếu ở **6 nút** nhắc lại chuyện cũ: 2.1, 2.2, 4.1.1.2, 4.1.2, 8.1, 8.2 | |
| | `!m.visits(2)` — **không nút nào** giả định "lần đầu gặp". `when.day`/`minVisits` đã chặn đúng | — |

**Kết luận tầng trí nhớ:** chỗ thủng nặng nhất của anh Bảo là **`d.*` (trong ngày)** —
anh tiết lộ bí mật lớn nhất của mình (tự học tiếng Nhật bốn năm, giấu không dám nói với
ai) **hai lần trong một buổi sáng**, lần thứ hai ngượng nghịu y như lần đầu. Với một nhân
vật mà cả arc là "dám nói ra một lần", đó là lỗi làm hỏng đúng cái thứ hay nhất của nhân vật.

> **Ghi chú phạm vi:** phần được giao cho tôi là 6 file NPC có tên. **`walkin.json` không
> nằm trong phần này** — luật "khách vãng lai không có trí nhớ qua ngày, mọi câu giả định
> ĐÃ QUEN đều sai" phải được rà bởi người cầm `walkin.json`/`qua-duong.json`.
