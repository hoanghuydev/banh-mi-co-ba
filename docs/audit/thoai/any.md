# Rà thoại — KHO DÙNG CHUNG `ANY` (`src/content/talks/any.json`)

**Hợp đồng:** `docs/phase-2-he-npc/P2-07-neo-thoai-vao-the-gioi.md` (đã gồm §4.1 · §4bis ·
§4ter) · **6 cuộc · 33 nút**
**Từ vựng:** chỉ §3. Khoá nào thiếu thì nằm ở mục *Đề xuất khoá mới* cuối file.

**Trạng thái đo được ở file này:** `act` **0 lần**, `forSec` **0 lần**, `need` **0 lần**,
`needEquip` **0 lần**, `while` **1 lần** (vừa được thêm ở `any.banh` 4.1.1). Tức 32/33 nút
nói xong thế giới không đổi gì ngoài `rel`.

**Bốn luật đọc dùng cho cả file:**
1. *Xã giao thuần không phải free word.* Câu không hứa gì chỉ cần `while`/`need` đúng cảnh.
2. *Câu hứa một việc làm* mà hệ chỉ có `PROMISE` cho món kẹp vô ổ bánh ⇒ `CẦN CODE`.
3. **§4.1 — `need` hay `while`:** sự thật **TĨNH** (tay người chơi, vai vế, mục đích —
   không đổi được khi thẻ đang mở) ⇒ **`need`**, ẩn hẳn. Sự thật **ĐỘNG** (hàng chờ, chỗ
   mát, kiên nhẫn, thời tiết — đổi giữa lúc đang đọc) ⇒ **`while`**, ra `?`.
   **Mặc định ưu tiên `need`.** Ở file này tỉ lệ đúng là **13 `need` / 7 `while`**.
4. **§4.3 riêng của kho này, nặng hơn mọi file khác:** `ANY` được rút cho **cả 14 vai** và
   ở **mọi trạng thái** — kể cả người **đang xếp hàng mua bánh** (`t.queueing`), **đang
   gọi món** (`t.ordering`), **đang đợi ổ** (`t.waiting`). Một câu ở đây không chỉ phải
   đọc được với mọi vai, nó còn phải đọc được ở mọi `t.*`. Đó chính là chỗ lỗi `any.banh`
   của chủ dự án nằm.

> **Ghi chú §2.15 cho cả file.** Cả 6 cuộc đều `source: PLAYER_ONLY`. Theo P2-06 §2.15,
> trên đường người chơi chủ động thì `opener` **không nổ nữa**, và **nhịp đầu của `tree`
> CHÍNH LÀ câu mở lời của người chơi**. Sáu `opener` ở đây (`"Ơ. Kêu hả. Chi đó {you}?"`,
> `"Ủa. Tưởng ai. Chi hông {you}?"` — chính là câu chủ dự án chỉ ra) giờ là **chữ chết**,
> và mọi nút nhịp-đầu nào viết như một câu ĐÁP đều là lỗi vai: có **4 nút** như vậy
> (2.3, 3.3, 4.3, 5.3), được chấm `SỬA` ngay trong bảng.

---

### any.chao — kêu chơi một tiếng (SHORT · PLAYER_ONLY)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1.1 | "Thấy {call} đi ngang nên kêu chơi." | **thiếu** `t.passing` *(tĩnh ⇒ ẩn hẳn)* | — | — | **SỬA** — nói "thấy đi ngang" với người đang đứng thứ hai trong hàng mua bánh |
| 1.1.1 | "Nay {call} ra sớm ha." | **thiếu** `m.visits(3)` *(tĩnh)* | **thiếu** `w.band(SOM)` (khoá mới) | — | **SỬA** — "ra sớm" nói được lúc mười một giờ trưa, và nói được với người chưa gặp bao giờ (§4ter) |
| 1.1.2 | "{call} đứng đây cho mát cái đã." | — | **thiếu** `w.hot` + `w.shadeFree` *(động)* | **thiếu** `STAND_IN_SHADE · 20–30 s` → `LEAVE_SHADE`, về đúng mục đích cũ | **CẦN CODE** — chỗ chủ dự án chỉ đích danh: *không có chỗ nào để đứng*, và reply "Đứng chút thôi nghen. Còn đi nữa" đã tự thú rằng họ gật xong vẫn đi tiếp |
| 1.1.3 | "Thôi {me} làm tiếp đây." | — | — | — | ĐÚNG — đường ra, không hứa gì |
| 1.2 | "{call} đi đâu mà dòm quanh dữ vậy?" | **thiếu** `t.glanced` *(tĩnh — đã xảy ra rồi)* | — | — | **SỬA** — hỏi "dòm quanh dữ vậy" một người không hề ngoái nhìn cái xe |
| 1.3 | "Thôi. Hổng có gì." | — | — | — | ĐÚNG — đường ra hợp lệ ngay cả khi là câu mở lời |

### any.troi — nói chuyện trời (SHORT · PLAYER_ONLY)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 2.1 | "Sáng nay mát ha {call}." | — | **thiếu** `!w.hot` + `!w.rain` *(động — mưa tạnh giữa chừng)* | — | **SỬA** — chào "mát ha" giữa trưa nắng gắt hoặc giữa cơn mưa |
| 2.1.1 | "Mát vầy đứng bán cũng đỡ {call} à." | — | **thiếu** `!w.hot` | — | **SỬA** — `while` của nút cha không truyền xuống nút con; nút này nhắc lại cảnh nên phải khai lại |
| 2.1.2 | "{call} có đem theo nón hông đó." | — | **thiếu** `w.hot` | — | **SỬA** — và nó **ngược với nút cha**: cha vừa nói trời mát, con lại lo nắng |
| 2.1.3 | "…" (IM) | — | — | — | ĐÚNG |
| 2.2 | "Chút nữa chắc nắng gắt {call} ơi." | — | **thiếu** `!w.rain` + `w.band(SOM)` (khoá mới) | — | **SỬA** — dự báo nắng trong lúc đang mưa |
| 2.3 | "Hỏi cho có thôi {call}." | — | — | — | **SỬA** — đây là câu **ĐÁP**, không phải câu mở lời. Trên đường `PLAYER_ONLY` nó là nhịp đầu ⇒ người chơi mở miệng bằng một lời thú nhận về câu mình chưa hỏi (P2-06 §2.15) |

### any.hoitham — hỏi thăm (SHORT · PLAYER_ONLY)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 3.1 | "{call} ăn gì chưa đó?" | — | — | — | ĐÚNG — xã giao thuần, không hứa gì |
| 3.1.1 | "Ăn miếng gì đi rồi hẵng đi {call}." | **thiếu** `!t.queueing` · `!t.ordering` · `!t.waiting` · `p.holdsBread` · `!p.soldOut` · `!v.gaveFood` *(tất cả đều tĩnh)* | — | **thiếu** `GIVE_BREAD` · hạn **~15 s** · giữ lời ⇒ `PROMISE_KEPT`; nuốt lời ⇒ nhắc một câu → bỏ đi | **CẦN CODE** — câu HỨA một miếng ăn, trả `rel +3` và `calm 12`, rồi không có miếng nào. `calm` là một nhượng bộ thật của đồng hồ chờ — ở đây nó được mua bằng chữ |
| 3.1.2 | "Bỏ bữa riết là đau đó {call}." | — | — | — | ĐÚNG — khuyên, không hứa |
| 3.1.3 | "Vậy thôi {call}." | — | — | — | ĐÚNG |
| 3.2 | "Mấy bữa nay {call} coi bộ mệt ha." | **thiếu** `m.visits(3)` *(tĩnh)* | — | — | **SỬA** — "mấy bữa nay" là một quan sát nhiều ngày, nói với một người qua đường **không có trí nhớ** (`touchesRelationship` = false cho `MOI`). Xem §5 cuối file |
| 3.3 | "Thôi khỏi." | — | — | — | **SỬA** — câu đáp dùng làm câu mở lời (§2.15) |

### any.banh — khoe bánh mới ra lò (SHORT · PLAYER_ONLY) ⚠ chỗ chủ dự án chỉ đích danh

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 4.1 | "Mới ra lò nè {call}. Cầm còn phỏng tay." | **thiếu** `p.holdsBread` + `!p.soldOut` *(tĩnh ⇒ ẩn hẳn, đừng để ra `?`)* | — | — | **SỬA** — khoe một ổ "cầm còn phỏng tay" trong khi tay có thể trống trơn, hoặc trong khi đã hết sạch bánh |
| 4.1.2 | "Bữa nay {me} nướng kỹ hơn bữa trước đó." | **thiếu** `m.visits(2)` *(tĩnh)* + `p.holdsBread` | — | — | **SỬA** — so với "bữa trước" đòi người ta đã ghé bữa trước; với người lạ đi ngang thì không có bữa trước nào (§4ter) |
| 4.1.3 | "…" (IM) | — | — | — | ĐÚNG |
| 4.1.1 | "Bẻ miếng ăn thử cho biết {call}." | **thiếu** `!t.queueing` · `!t.ordering` · `!t.waiting` · `!v.gaveFood` | `p.holdsBread` *(vừa được thêm — nhưng đây là sự thật **TĨNH**, theo §4.1 phải chuyển sang `need` để ẩn hẳn, không để ra `?`)* | **thiếu** `GIVE_BREAD · tới khi ăn xong` | **XOÁ khỏi kho `ANY`** — xem khối phân tích ngay dưới |
| 4.2 | "{call} coi cái xe {me} dọn vầy được hông." | — | — | — | ĐÚNG — xin ý kiến, không hứa gì |
| 4.3 | "Hổng có gì đâu." | — | — | — | **SỬA** — câu đáp dùng làm câu mở lời (§2.15) |

> **`any.banh` 4.1.1 — vì sao XOÁ chứ không SỬA.** Chủ dự án: *"Họ đang xếp hàng mua bánh
> mì mà?"* Bốn lỗi chồng lên nhau trong một dòng:
> 1. **Sai người.** Kho `ANY` rút được cho người đang `t.queueing` / `t.ordering` /
>    `t.waiting`. Mời một người **sắp trả tiền mua** ăn thử miễn phí không phải là một câu
>    nói vụng — nó là một câu không ai nói ngoài đời.
> 2. **Sai tay.** Câu mời ăn mà nút không khai `p.holdsBread`.
> 3. **Sửa nửa vời sẽ không ăn thua.** `while: ["p.holdsBread"]` vừa được thêm, nhưng
>    `p.holdsBread` là sự thật **TĨNH** (§4.1): để nó ở `while` thì nút vẫn hiện ra rồi
>    NPC trả về `?` — đúng cái chủ dự án vừa bảo *"hạn chế hiện câu gợi ý trả lời lạc đề"*.
>    Phải là `need`. Và dù chuyển đúng, nó vẫn không chữa lỗi 1.
> 4. **Lời mời được viết để KHÔNG BAO GIỜ phải thực hiện.** `reply` cố định là
>    *"Thôi thôi, không ăn đâu."* — người viết đã biết thế giới không đưa nổi miếng bánh
>    nào, nên viết sẵn một lời từ chối để khỏi phải làm. Đó đúng là định nghĩa free word.
>
> **Nếu muốn giữ ý này:** chuyển dòng sang `qua-duong` (người chưa hỏi mua gì), gắn
> `does: GIVE_BREAD` thật kèm hạn và đường nuốt lời của §4bis, và để `yes/no` do thế giới
> quyết như `INVITE` — chứ không phải một lời từ chối viết cứng.

### any.hem — nói chuyện hẻm (SHORT · PLAYER_ONLY)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 5.1 | "Sáng nay hẻm đông ha {call}." | — | **thiếu** `w.queue >= 2` *(động)* | — | **SỬA** — khen hẻm đông lúc không một bóng người |
| 5.1.1 | "Đông vầy {me} mừng chớ sao {call}." | — | **thiếu** `w.queue >= 2` | — | **SỬA** |
| 5.1.2 | "Mà đông quá làm hổng kịp {call} à." | — | **thiếu** `w.queue >= 3` | — | **SỬA** — than làm không kịp trong lúc hai tay không có gì |
| 5.1.3 | "…" (IM) | — | — | — | ĐÚNG |
| 5.2 | "Hẻm mình yên ghê ha {call}." | — | **thiếu** `w.queue == 0` + `!w.peak` | — | **SỬA** — và nó là **anh em cùng nhịp** với 5.1 ("hẻm đông"): hai câu ngược hẳn nhau cùng hiện một lúc, không khoá nào tách. Người chơi chọn cái nào cũng có thể trật |
| 5.3 | "Thôi bỏ đi {call}." | — | — | — | **SỬA** — câu đáp dùng làm câu mở lời (§2.15) |

### any.imlang — đứng im một chút (BARK · PLAYER_ONLY)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 6.1 | "{me} đứng đây chút thôi {call}." | **thiếu** `p.onStreet` *(tĩnh)* | — | — | **SỬA** — xin đứng nhờ trong lúc mình đang đứng sau quầy của chính mình |
| 6.2 | "…" (IM) | — | — | — | ĐÚNG |
| 6.3 | "{call} xích qua chút giùm {me} cái." | — | **thiếu** `w.queue >= 1` *(động)* | **thiếu** `STEP_ASIDE · tới khi tới lượt` (**ĐÃ CÓ CODE**) | **SỬA** — đúng lỗi §1 của chủ dự án: *"bảo người ta dạt ra mà không ai dạt"*. Act `STEP_ASIDE` đã tồn tại, chỉ là không ai gắn vào |

---

## 1. Thống kê

| | số nút | tỉ lệ |
|---|---|---|
| **Tổng** | **33** | 100 % |
| `ĐÚNG` | 10 | 30 % |
| `SỬA` | 20 | 61 % |
| `XOÁ` | 1 | 3 % |
| `CẦN CODE` | 2 | 6 % |

Chia theo cuộc: `any.chao` 2/3/0/1 · `any.troi` 1/5/0/0 · `any.hoitham` 3/2/0/1 ·
`any.banh` 2/3/1/0 · `any.hem` 1/5/0/0 · `any.imlang` 1/2/0/0
(theo thứ tự ĐÚNG/SỬA/XOÁ/CẦN CODE).

**Trí nhớ trong một cuộc (§3.3): file này SẠCH** — không có nút `GAT`, không có nút `CHUI`.
Không nút nào cần `need: "!c.angered"`.

**Phân loại `need` / `while` (§4.1):** 13 khoá nên là `need` (ẩn hẳn), 7 nên là `while`
(ra `?`). Nút duy nhất đang có `while` (`any.banh` 4.1.1) đang đặt **sai phía**.

**Hai cụm lỗi lớn nhất của file, cả hai đều do CHÍNH TÍNH CHẤT của kho `ANY`:**
* **13/33 nút nhắc một trạng thái thế giới mà không đọc nó** (trời, hẻm đông, bánh trong
  tay, người đang đi ngang). Vì kho này rút cho mọi người ở mọi cảnh, xác suất trật cao
  hơn hẳn mọi file riêng.
* **4/33 nút là câu ĐÁP bị dùng làm câu MỞ LỜI.** Kho `PLAYER_ONLY` duy nhất của game mà
  nhịp đầu viết như đang trả lời ai đó — `opener` chết thì chỗ hổng lộ ra.

## 2. Đề xuất khoá mới

| khoá đề xuất | nghĩa | nút cần | vì sao §3 không đủ |
|---|---|---|---|
| `w.band(X)` | khung giờ hiện tại (`SOM` · `PEAK` · `LULL` · `TRUA`) | 1.1.1 · 2.2 | §3.4 chỉ có `w.hot` `w.rain` `w.peak` `w.queue` `w.shadeFree` — **không có giờ**. `w.peak` là mật độ khách, không phải buổi |
| `!` trước một khoá `t.*` / `p.*` | phủ định (`!t.queueing`, `!p.soldOut`) | 3.1.1 · 4.1 · 4.1.1 · 5.2 | `visibleOptions` hiện chỉ làm `!!gate.flags[o.need]`; không viết được "chỉ hiện khi KHÔNG phải đang xếp hàng" — mà đó chính là khoá cứu `any.banh` |
| `v.gaveFood` · `v.gaveTea` | trong **lượt ghé này** đã mời ăn / mời uống rồi (§4ter tầng `v.*`) | 3.1.1 · 4.1.1 | Kho `ANY` không bao giờ cạn và rút lại được trong cùng một lượt ghé ⇒ mời ăn hai lần với cùng một người là chuyện xảy ra được |
| `m.visits(N)` đọc được cho **mọi** vai | số lần ghé cả mùa | 1.1.1 · 3.2 · 4.1.2 | `mem.visits` đã có trong P2-03 nhưng **`QUA_DUONG`/`WALKIN` dùng chung một `memKey` cho tám dáng người** (`touchesRelationship` = false cho `MOI`). Nghĩa là với họ, khoá này **không thể đúng** — xem §5 |

## 3. Hành động cần code

| hành động | nút cần | thời lượng đề xuất | thiếu gì trong game |
|---|---|---|---|
| `STAND_IN_SHADE` + `LEAVE_SHADE` | 1.1.2 | 20–30 s rồi **về đúng mục đích cũ** | §3.5 ghi **CHƯA — cần ô mới**. Xác nhận: `src/world/map.ts` (26×17) không có ký tự nào cho ô hóng mát, cũng không có mái quán. Thiếu: ô bản đồ · cờ `w.shadeFree` · đường quay lại `Purpose` sau khi hết `forSec` |
| `GIVE_BREAD` | 3.1.1 · (4.1.1 nếu chuyển sang `qua-duong` thay vì xoá) | tới khi ăn xong (hạn trao tay ~15 s) | §3.5 ghi **CHƯA**. Thiếu: ổ rời tay người chơi, NPC cầm lấy, dáng ăn, và đường nuốt lời của §4bis |
| `STEP_ASIDE` | 6.3 | tới khi tới lượt | **Act này ĐÃ CÓ CODE** (`service.ts:3232`) — đây không phải việc code, mà là việc **gắn act vào nội dung**. Ghi vào đây vì nó nằm đúng danh sách sáu lỗi của chủ dự án |
| `while` / `need` nói chung | 20 nút `SỬA` của file này | — | `TalkNode.while` **chưa được đọc** ở `visibleOptions`/`talkGate`; `need` thì chỉ đọc được **cờ chuyện** (`gate.flags`), không đọc được `p.*` `t.*` `w.*` `c.*` `v.*` `d.*` `m.*`. Cơ chế `?` của §4 cũng chưa có. Mọi dòng trong bảng trên là **đề xuất** |

## 4. Lời hứa có hạn (§4bis)

File này chỉ có **hai** lời hứa thật — phần còn lại là xã giao. Cả hai đều chưa có hạn.

| nút | hứa gì | hạn (giây thật) | giữ lời | NUỐT LỜI |
|---|---|---|---|---|
| 3.1.1 "Ăn miếng gì đi rồi hẵng đi" | đưa một miếng/một ổ cho họ ăn | **~15 s** (trao tay; không phải đi nướng) | `PROMISE_KEPT`, giữ nguyên `rel +3` và `calm 12` | Kho `ANY` dùng cho **cả 14 vai** ⇒ nấc phạt phải tra theo `personality.nongTinh`/`deTha` của người đang đứng đó, không viết cứng được. Mặc định cho người lạ: **bỏ nấc một, đi luôn** (họ không có trí nhớ để nhắc) |
| 4.1.1 "Bẻ miếng ăn thử cho biết" | như trên | ~15 s | — | — (nút này đề nghị **XOÁ**) |

> **Chỗ nguy nhất của §4bis trong file này:** `calm` ở 3.1.1 (12) và 3.1.2 (8) là **giảm
> thật đồng hồ chờ**. Một lời hứa chưa có hạn mà đã trả trước phần thưởng chống-cáu chính
> là cách chơi tối ưu "hứa rồi quên" mà `TalkEffect.calm` đã cảnh báo trong `talk.ts`.
> Nếu chưa code được `GIVE_BREAD`, việc **gỡ `calm` khỏi hai nút đó** phải làm trước.

## 5. Trí nhớ bốn tầng (§4ter)

| tầng | nút vi phạm | giả định sai | khoá cần |
|---|---|---|---|
| `c.*` trong cuộc | — | — | sạch (không có `GAT`/`CHUI`) |
| `v.*` trong lượt ghé | 3.1.1 · 4.1.1 | mời ăn **lần thứ hai trong cùng một lượt ghé**: `eligible()` bỏ qua `usedSeason` cho `npc: ANY` và chỉ chặn theo **chủ đề trong ngày**, nên `any.hoitham` và `any.banh` **cùng chạy được với cùng một người trong một lượt ghé** — hai lời mời ăn liên tiếp | `v.gaveFood` |
| `d.*` trong ngày | 1.1.1 "Nay {call} ra sớm ha" | hỏi như mới gặp lần đầu hôm nay, trong khi người đó có thể đã ghé sáng nay rồi | `d.metToday` |
| `m.*` cả mùa | 1.1.1 · 3.2 · 4.1.2 | **ba câu nhắc quá khứ nhiều ngày** ("ra sớm", "mấy bữa nay", "bữa trước") nói được với một người **chưa từng gặp** | `m.visits(N)` · `m.remembers(E)` |

> **Lỗi cấu trúc nặng nhất của §4ter ở file này — không sửa bằng khoá được.**
> Kho `ANY` rút cho cả `QUA_DUONG` và `WALKIN`, mà hai kho đó **cố ý không có trí nhớ**:
> `touchesRelationship(t) === false` cho `MOI`, và `memKey` dùng chung cho **tám dáng
> người suốt cả mùa** (`talk.ts`, khối `TalkKind`). Nên ba câu 1.1.1 · 3.2 · 4.1.2 **không
> có cách nào khai `m.visits` cho đúng**: hoặc chúng chỉ được bày ra cho 12 người CÓ TÊN
> (thêm một cổng `t.named`), hoặc phải viết lại thành câu không nhắc quá khứ.
> Đây là lựa chọn thiết kế, không phải lỗi chính tả — cần chủ dự án chốt.
