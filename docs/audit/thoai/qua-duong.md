# Rà thoại — NGƯỜI QUA ĐƯỜNG (`src/content/talks/qua-duong.json`)

> ## ⚡ REVAMP 2026-10-20 — ☠️ CHẾT TOÀN BỘ
> Rà thoại theo giọng cũ + hệ trí nhớ/quan hệ đã chết. Toàn bộ thoại viết lại giọng Nam gen Z ở R6 (CANON §9, §17.1). Chỉ giữ để truy vết nội dung cũ.

**Hợp đồng:** `docs/phase-2-he-npc/P2-07-neo-thoai-vao-the-gioi.md` (đã gồm §4.1 · §4bis ·
§4ter) · **8 cuộc · 49 nút**
**Từ vựng:** chỉ §3. Khoá nào thiếu thì nằm ở mục *Đề xuất khoá mới* cuối file.

**Trạng thái đo được ở file này:** `act` **8 lần** (tất cả là `INVITE` — đây là file có
mật độ `act` cao nhất kho), `needEquip` **1 lần** (`DU_CHE`), `while` **2 lần** (vừa được
thêm, cả hai là `p.holdsBread`), `forSec` **0 lần**, `need` **0 lần**.

**Bốn luật đọc dùng cho cả file:**
1. *Xã giao thuần không phải free word.*
2. *Câu hứa một việc làm* mà hệ chưa có `does` cho nó ⇒ `CẦN CODE`, không phải `SỬA`.
3. **§4.1 — `need` hay `while`:** tĩnh (`p.holdsBread`, `p.soldOut`, `t.passing`,
   `t.glanced`, `t.purpose`) ⇒ **`need`**, ẩn hẳn. Động (`w.queue`, `w.shadeFree`,
   `w.rain`, `t.lookingInside`, `t.impatient`) ⇒ **`while`**, ra `?`.
   **Hai `while: p.holdsBread` vừa thêm ở 2.1.1 và 6.2.1 đang đặt sai phía** — đó là sự
   thật tĩnh, phải là `need`, nếu không người chơi vẫn thấy nút rồi ăn một dấu `?`.
4. **Kho này KHÔNG CÓ TRÍ NHỚ.** `kindOf()` trả `MOI`/`CHAO`, `touchesRelationship` =
   false, và `memKey` dùng chung cho **tám dáng người suốt cả mùa**. Mọi câu nhắc quá khứ
   ở đây đều không có chỗ đứng — xem §5.

---

## ⚠ Lỗi CẤU TRÚC của cả file — chỗ chủ dự án chỉ đích danh

> *"Người qua đường: ba lựa chọn 'chú Sáu dọn đi 2 năm', 'tôi mới dọn tới' — trong khi
> chính mình là người bắt chuyện trước."*

Cả **8/8 cuộc** khai `source: "BOTH"`. Theo §10.1 của P2-06 đó là cố ý — `NPC_ONLY` sẽ
khoá chết cơ chế mời khách. Nhưng P2-06 §2.15 nói tiếp: **người chơi chủ động ⇒ người chơi
nói trước**, và với đường đó **nhịp đầu của `tree` CHÍNH LÀ câu mở lời của người chơi**.

Đếm thật: **21/49 nút** (và **21/26 nút nhịp đầu**) được viết như một câu **ĐÁP** cho
`opener`. Dấu hiệu nhìn ra ngay: **26/49 nút mở miệng bằng chữ "Dạ"** — "dạ" là tiếng đáp
lại ai đó. Khi người chơi là người bấm phím, chuỗi thành ra:

| | hiện tại (người chơi bấm phím) | đúng ra |
|---|---|---|
| nhịp 1 | *mình* nói "Dạ. Chú Sáu dọn đi hai năm rồi {call}." | *mình* mở lời |
| nhịp 2 | họ đáp "Ờ há. Lâu quá {self} hổng có ghé lại." | họ đáp |

Tức **mình tự dưng kể lai lịch một tiệm sửa xe cho một người không hỏi gì** — đúng câu
chủ dự án chỉ. Và ở `duong.hoiduong` còn tệ hơn: mình **chỉ đường** cho người không hỏi.

**Cách chữa, cả file một lần:** thêm khoá `c.openedBy(NPC)` / `c.openedBy(PLAYER)` (§3.3
hiện **không có khoá nào nói ai mở lời**), rồi:
* mọi nút "Dạ…" khai `need: "c.openedBy(NPC)"`;
* mỗi cuộc thêm **1–2 nút nhịp đầu kiểu MỞ LỜI** cho đường `PLAYER` — và đó chính là chỗ
  để `INVITE` sống: *"{call} ăn thử ổ bánh mới ra lò nghen?"* là một câu mở lời thật.

---

### duong.hoiduong — hỏi đường hẻm 54 (BARK · BOTH)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1.1 | "Dạ {call} đi thẳng, tới cây me quẹo phải." | **thiếu** `c.openedBy(NPC)` (khoá mới) | — | — | **SỬA** — §2.15: khi người chơi bấm bắt chuyện, câu này thành câu MỞ LỜI ⇒ mình chỉ đường cho người không hỏi |
| 1.1.1 | "Dạ {call} đi mạnh giỏi nghen." | — | — | **thiếu** `WALK_ON · ngay` | **CẦN CODE** — chào tiễn mà người ta vẫn đứng nguyên đó tới hết đường đi |
| 1.1.2 | "{call} kiếm nhà ai trong đó vậy?" | — | — | — | ĐÚNG |
| 1.1.3 | "Dạ." (LANH · silent) | — | — | — | ĐÚNG |
| 1.2 | "{me} cũng mới ra đây bán, hổng rành lắm {call} ơi." | **thiếu** `c.openedBy(NPC)` | — | — | **SỬA** — §2.15; và cuộc không khai `when.day` nên "mới ra đây bán" vẫn nói được ở ngày 40 |
| 1.3 | "{me} đang bận {call} ơi." | — | **thiếu** `w.queue >= 1` *(động)* | **thiếu** `WALK_ON` | **SỬA** — viện cớ bận lúc ngoài quầy không một ai |

### duong.mui — ngửi thấy mùi bánh (FULL · BOTH)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 2.1 | "Dạ bánh mới ra lò đó {call}." | **thiếu** `c.openedBy(NPC)` · `!p.soldOut` | **thiếu** `w.ovenHot` (khoá mới) | — | **SỬA** — khoe "mới ra lò" lúc lò nguội hoặc lúc hết sạch bánh |
| 2.1.1 | "{call} ăn thử một ổ cho biết nghen?" | **thiếu** `!p.soldOut`; và `p.holdsBread` *(vừa thêm ở `while` — theo §4.1 phải chuyển sang `need`)* | **thiếu** `w.queue == 0` *(động — không ai được mời mà chịu xếp hàng dài)* | `INVITE` ✓ **đã có** | **SỬA** — **lời hứa và hành động LỆCH nhau**: câu nói là *"ăn thử cho biết"* (miễn phí), còn `yes` lại là *"Cho {self} một ổ đi"* (mua). Hoặc sửa chữ thành mời mua, hoặc đổi `does` thành `GIVE_BREAD`. Đây là bản sao của lỗi `any.banh` mà chủ dự án chỉ |
| 2.1.2 | "Dạ {call} đi đường cẩn thận nghen." | — | — | **thiếu** `WALK_ON · ngay` | **CẦN CODE** |
| 2.1.3 | "Dạ." (IM) | — | — | — | ĐÚNG |
| 2.2 | "Lò mới nhen than đó {call}." | **thiếu** `c.openedBy(NPC)` | **thiếu** `w.ovenHot` (khoá mới) | — | **SỬA** |
| 2.3 | "Dạ." (LANH · silent) | **thiếu** `c.openedBy(NPC)` | — | — | **SỬA** — mở lời một cuộc trò chuyện bằng đúng chữ "Dạ." |

### duong.nang — nắng gắt (FULL · BOTH · `when.rain: false`)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| S:moi.1 | "Nắng vầy ăn miếng bánh rồi hãy đi {call}." | **thiếu** `!p.soldOut` | **thiếu** `w.hot` *(cuộc chỉ khai `rain: false`, không khai nắng)* | `INVITE` ✓ | **SỬA** |
| S:moi.2 | "Mua một ổ ủng hộ {me} đi {call}." | **thiếu** `!p.soldOut` | **thiếu** `w.queue == 0` | `INVITE` ✓ | **SỬA** — mời mua lúc đã hết sạch bánh |
| S:moi.3 | "Dạ {call} đứng nghỉ chút đi." | — | **thiếu** `w.shadeFree` *(động)* | **thiếu** `STAND_IN_SHADE · 20–30 s` → `LEAVE_SHADE`, về đúng mục đích cũ | **CẦN CODE** |
| 3.1 | "Dạ. Mới sáng mà đã rát mặt rồi {call}." | **thiếu** `c.openedBy(NPC)` | **thiếu** `w.hot` | — | **SỬA** |
| 3.2 | "{call} đứng nhờ cái dù cho mát cái đã." | `needEquip: DU_CHE` ✓ **đã có** | **thiếu** `w.hot` + `w.shadeFree` | **thiếu** `STAND_IN_SHADE · forSec` → `LEAVE_SHADE` | **CẦN CODE** — ⚠ chỗ chủ dự án chỉ: cổng đạo cụ đã đúng, nhưng **không có ô nào để đứng** dưới cái dù, và reply "Ờ, cảm ơn {you} nghen" xong họ vẫn đi tiếp |
| 3.3 | "Dạ." (LANH · silent) | **thiếu** `c.openedBy(NPC)` | — | — | **SỬA** |
| 3.4 | "{call} nhích vô bóng xe cho đỡ rát cái đã." | — | **thiếu** `w.hot` + `w.shadeFree` | **thiếu** `STAND_IN_SHADE · forSec` | **CẦN CODE** — "bóng xe" cũng là một ô hóng mát chưa tồn tại; và nút này **không** có `needEquip` nên nó là bản không-cần-mua-gì của 3.2, tức lỗi hiện ở mọi save |

### duong.mua — xin đứng trú mưa (BARK · BOTH · `when.rain: true`)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 4.1 | "Dạ {call} đứng vô trong cho khỏi ướt." | — | **thiếu** `w.shadeFree` | **thiếu** `STAND_IN_SHADE (trú) · tới khi tạnh` → `LEAVE_SHADE` + `WALK_ON` | **CẦN CODE** — trả `rel +3` cho một chỗ đứng không tồn tại: `src/world/map.ts` không có mái quán, không có ô trú |
| 4.1.1 | "{call} đi đâu mà gặp mưa vậy?" | — | — | — | ĐÚNG — và đây là **nút duy nhất của cả kho chạm tới `t.purpose`** (§5 của hợp đồng); nên giữ làm khuôn |
| 4.1.2 | "Mưa này chút là tạnh hà {call}." | — | **thiếu** `w.rain` *(động — mưa tạnh giữa lúc đang đọc là chuyện thường)* | — | **SỬA** — `when.rain` của cuộc chỉ kiểm lúc MỞ, không kiểm lúc NÓI |
| 4.1.3 | "Dạ." (IM) | — | — | — | ĐÚNG |
| 4.2 | "Dạ {call} đứng đại đi." | — | **thiếu** `w.shadeFree` | **thiếu** `STAND_IN_SHADE · tới khi tạnh` | **CẦN CODE** |
| 4.3 | "Chỗ này chật lắm {call} ơi." | **thiếu** `c.openedBy(NPC)` | **thiếu** `w.queue >= 2` *(chật vì CÓ người đứng)* | **thiếu** `WALK_ON · ngay` | **SỬA** — §2.15 (từ chối một lời xin mà chính mình vừa mở lời); "chật lắm" nói được lúc vỉa hè trống trơn; và reply "{self} đi đại" mà họ không đi |

### duong.voi — hỏi giờ, đang trễ (FULL · BOTH · `when.slot: PEAK`)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 5.1 | "Dạ gần bảy giờ rồi {call}." | **thiếu** `c.openedBy(NPC)` | **thiếu** `w.clock ≈ 7h` (khoá mới) | — | **SỬA** — §2.15; và câu khai **cứng một giờ cụ thể** trong khi `slot: PEAK` trải dài nhiều giờ ⇒ nói "gần bảy giờ" lúc đồng hồ chỉ tám rưỡi |
| 5.1.1 | "{call} cầm một ổ ăn dọc đường cho kịp." | **thiếu** `!p.soldOut` | — | `INVITE` ✓ | **SỬA** — neo rất đúng với `t.purpose(DI_LAM_TRE)` và `hurry` cao (§5 hợp đồng), chỉ thiếu cổng hết-bánh |
| 5.1.2 | "Bữa nào cũng trễ hả {call}?" | **thiếu** `m.visits(3)` — **và khoá này không khai được cho kho này** | — | — | **SỬA** — "bữa nào cũng" nhắc một quá khứ mà hệ **cố ý không lưu** cho người qua đường. Xem §5 |
| 5.1.3 | "Dạ." (LANH · silent) | — | — | — | ĐÚNG |
| 5.2 | "{me} hổng có đồng hồ {call} ơi." | **thiếu** `c.openedBy(NPC)` | — | — | **SỬA** |
| 5.3 | "Dạ." (IM) | **thiếu** `c.openedBy(NPC)` | — | — | **SỬA** |

### duong.hem — hồi xưa chỗ này tiệm sửa xe (FULL · BOTH) ⚠ chỗ chủ dự án chỉ đích danh

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 6.1 | "Dạ. Chú Sáu dọn đi hai năm rồi {call}." | **thiếu** `c.openedBy(NPC)` (khoá mới) | — | — | **SỬA** — **câu chủ dự án chỉ đích danh.** Khi chính người chơi bắt chuyện trước thì đây là lời tự dưng kể lai lịch tiệm sửa xe cho một người không hỏi |
| 6.2 | "{me} cũng mới ra đây bán thôi {call}." | **thiếu** `c.openedBy(NPC)` + `when.day: [1, 7]` | — | — | **SỬA** — **câu thứ hai chủ dự án chỉ**; thêm nữa: "mới ra đây bán" vẫn nói được ở ngày 40 |
| 6.2.1 | "Dạ cũng đắp đổi. {call} ăn thử ổ nghen?" | **thiếu** `!p.soldOut`; `p.holdsBread` *(vừa thêm ở `while` — chuyển sang `need`)* | **thiếu** `w.queue == 0` | `INVITE` ✓ | **SỬA** — lại "ăn thử" mà `yes` là mua một ổ, y như 2.1.1 |
| 6.2.2 | "Dạ đông khách lắm {call}." | — | **thiếu** `w.queue >= 2` | — | **SỬA** — khoe đông khách lúc hẻm không một bóng người. `reply` đã mỉa ("Nói nghe sướng lỗ tai ghê") nhưng đó là chữ viết sẵn, không phải thế giới bắt được lời nói dối |
| 6.2.3 | "Dạ." (LANH · silent) | — | — | — | ĐÚNG |
| 6.3 | "Dạ." (LANH · silent) | **thiếu** `c.openedBy(NPC)` | — | — | **SỬA** |

### duong.cuoibuoi — giờ này còn bán hả (FULL · BOTH · `when.slot: LULL`)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 7.1 | "Dạ còn mấy ổ cuối {call}." | **thiếu** `c.openedBy(NPC)` · `!p.soldOut` · `p.stock <= 5` (khoá mới) | — | — | **SỬA** — nói "còn mấy ổ cuối" lúc còn bốn mươi ổ, hoặc lúc đã hết sạch |
| 7.1.1 | "Dạ cũng thường thôi {call}." | — | — | — | ĐÚNG |
| 7.1.2 | "Sáng bán hết rồi, đây là mẻ sau {call}." | **thiếu** `p.soldToday >= N` (khoá mới) | — | — | **SỬA** — khoe một con số doanh thu **game biết rõ** mà không ai đối chiếu |
| 7.1.3 | "{call} ăn giùm {me} ổ cuối nghen." | **thiếu** `!p.soldOut` · `p.stock <= 2` | — | `INVITE` ✓ | **SỬA** |
| 7.2 | "Dạ hết rồi {call} ơi." | **thiếu** `c.openedBy(NPC)` · `p.soldOut` | — | **thiếu** `WALK_ON` | **SỬA** — và nó là **anh em cùng nhịp** với 7.1 ("còn mấy ổ cuối"): hai câu ngược hẳn nhau hiện cùng một lúc, không khoá nào tách |
| 7.3 | "Dạ." (LANH · silent) | **thiếu** `c.openedBy(NPC)` | — | — | **SỬA** |

### duong.ngo — ngó chút thôi, hổng mua đâu (FULL · BOTH)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 8.1 | "Dạ {call} cứ ngó thoải mái." | **thiếu** `c.openedBy(NPC)` · `t.glanced` | **thiếu** `t.lookingInside` *(động)* | **thiếu** `LOOK_INSIDE · forSec` (có một phần: `gaze`) | **SỬA** |
| 8.1.1 | "{call} cầm một ổ cho chắc bụng." | **thiếu** `!p.soldOut` | — | `INVITE` ✓ | ĐÚNG — lời mời thật, act thật, cái kết do roll quyết |
| 8.1.2 | "Ngó rồi mua luôn cho rồi {call}." | **thiếu** `t.glanced` · `!p.soldOut` | **thiếu** `t.lookingInside` | `INVITE` ✓ | **SỬA** — câu chỉ có nghĩa với người ĐANG ngó; không có cổng nào |
| 8.1.3 | "Dạ {call} đi mạnh giỏi." | — | — | **thiếu** `WALK_ON · ngay` | **CẦN CODE** |
| 8.2 | "Hổng mua thì ngó chi {call}." (GAT · `rel −3`) | **thiếu** `t.glanced` | **thiếu** `t.lookingInside` | **thiếu** `WALK_ON · ngay` | **SỬA** — đuổi một người có thể chưa hề ngó; và `reply` nói thẳng "Thôi {self} đi" mà họ không đi |
| 8.3 | "Dạ." (LANH · silent) | **thiếu** `c.openedBy(NPC)` | — | — | **SỬA** |

---

## 1. Thống kê

| | số nút | tỉ lệ |
|---|---|---|
| **Tổng** | **49** | 100 % |
| `ĐÚNG` | 9 | 18 % |
| `SỬA` | 32 | 65 % |
| `XOÁ` | 0 | 0 % |
| `CẦN CODE` | 8 | 16 % |

Chia theo cuộc: `duong.hoiduong` 2/3/0/1 · `duong.mui` 1/4/0/1 · `duong.nang` 0/4/0/3 ·
`duong.mua` 2/2/0/2 · `duong.voi` 1/5/0/0 · `duong.hem` 1/5/0/0 · `duong.cuoibuoi` 1/5/0/0 ·
`duong.ngo` 1/4/0/1 (theo thứ tự ĐÚNG/SỬA/XOÁ/CẦN CODE).

**18% đạt — thấp nhất trong năm file được giao.** Một mình lỗi §2.15 đã chiếm **21/49
nút**; chữa nó bằng `c.openedBy()` kéo tỉ lệ đạt lên khoảng 60% mà không phải viết lại
một chữ nào.

**Trí nhớ trong một cuộc (§3.3): file này SẠCH.** Nút `GAT` duy nhất (8.2) là **lá cuối**,
không có nhánh `AM` nào nối sau. Không nút nào cần `need: "!c.angered"`.

**Phân loại `need` / `while` (§4.1):** 31 khoá nên là `need` (ẩn hẳn — phần lớn là
`c.openedBy` và `!p.soldOut`), 13 nên là `while`. Hai `while` đang có trong file
(2.1.1 · 6.2.1, đều `p.holdsBread`) **đặt sai phía**: đó là sự thật tĩnh.

**Ba cụm lỗi lặp lại:**
* **21 nút** là câu ĐÁP bị dùng làm câu MỞ LỜI (§2.15).
* **8 nút** mời mua / mời ăn mà **không nút nào khai `!p.soldOut`** — tám cơ hội mời một
  người ghé vô cái xe không còn gì để bán.
* **3 câu "ăn thử"** (2.1.1 · 6.2.1 và `any.banh` 4.1.1 ở file khác) nói *mời ăn* nhưng
  `act` là *mời mua*. Chữ và hành động lệch nhau — cùng họ với lỗi chủ dự án chỉ.

## 2. Đề xuất khoá mới

| khoá đề xuất | nghĩa | nút cần | vì sao §3 không đủ |
|---|---|---|---|
| `c.openedBy(NPC)` · `c.openedBy(PLAYER)` | cuộc này ai mở lời | **21 nút** (xem khối ⚠ đầu file) | §3.3 có `c.saidTone` · `c.warmth` · `c.angered` nhưng **không có khoá nào nói ai mở lời** — mà đó là biến quyết định toàn bộ kho `BOTH`. Thông tin đã có sẵn ở runtime (`TalkOpenBy`), chỉ chưa có đường cho nội dung đọc |
| `p.stock <= N` · `p.soldToday >= N` | còn mấy ổ · hôm nay đã bán mấy ổ | 7.1 · 7.1.2 · 7.1.3 | §3.1 chỉ có `p.soldOut` (hết sạch) và `p.cash`. "Còn mấy ổ cuối" không phải hết sạch, nó là một ngưỡng |
| `w.ovenHot` | lò đang nhen / mẻ vừa ra | 2.1 · 2.2 | §3.4 không có khoá nào về cái lò, trong khi mùi bánh là lý do tồn tại của cả cuộc `duong.mui` |
| `w.clock` hoặc `w.band(X)` | giờ thật / khung giờ | 5.1 | `slot: PEAK` ở `when` chỉ lọc lúc MỞ cuộc và trải nhiều giờ; câu "gần bảy giờ rồi" cần số |
| `!` trước `p.*` / `t.*` | phủ định (`!p.soldOut`) | 8 nút `INVITE` | `visibleOptions` chỉ làm `!!gate.flags[o.need]` |
| `t.named` | người này có tên (một trong 12) hay là vai ẩn danh | 5.1.2 | Cần để **chặn** những câu nhắc quá khứ khỏi rơi vào kho không-trí-nhớ. Xem §5 |

## 3. Hành động cần code

| hành động | nút cần | thời lượng đề xuất | thiếu gì trong game |
|---|---|---|---|
| `STAND_IN_SHADE` + `LEAVE_SHADE` | S:moi.3 · 3.2 · 3.4 · 4.1 · 4.2 | nắng 20–30 s · mưa **tới khi tạnh** (trần ~90 s), rồi **về đúng mục đích cũ** | §3.5 ghi **CHƯA — cần ô mới**. Xác nhận trên `src/world/map.ts`: không có ký tự ô hóng mát, không có mái quán, không có ô trú mưa. `DU_CHE` chỉ là một hình vẽ ở `StallScene.ts:3071`, không phải một ô đứng được. Thiếu: ô bản đồ · cờ `w.shadeFree` · đường quay lại `Purpose` |
| `WALK_ON` | 1.1.1 · 2.1.2 · 8.1.3 (rõ nhất) — và **mọi nút lá của cả 8 cuộc**: người qua đường nói xong là phải đi tiếp, không được đứng lại vĩnh viễn | ngay, kết thúc cuộc | §3.5 ghi **CHƯA**. Đây là hành động **đúng mặc định** cho cả kho này: họ là người ĐI NGANG, trạng thái nghỉ của họ là đi, không phải đứng |
| `GIVE_BREAD` | 2.1.1 · 6.2.1 (nếu chọn giữ nguyên chữ "ăn thử" thay vì đổi thành mời mua) | tới khi ăn xong; hạn trao tay ~15 s | §3.5 ghi **CHƯA** |
| `LOOK_INSIDE` | 8.1 | 4–8 s | §3.5 ghi **một phần** (`gaze`); thiếu `forSec` và thiếu đường về |
| `INVITE` | 8 nút đã có | ngay | **ĐÃ CÓ CODE** (`service.ts:3245`, roll ở `passersby.inviteChance`, chống spam bằng `inviteRefused`). Đây là mảng **làm đúng nhất** của cả kho thoại — giữ làm khuôn |
| `need` / `while` nói chung | 32 nút `SỬA` | — | `need` hiện chỉ đọc **cờ chuyện** (`gate.flags`); `while` chưa được `visibleOptions` đọc; cơ chế `?` của §4 chưa có |

## 4. Lời hứa có hạn (§4bis)

Kho này **không có lời hứa "làm giùm" nào** — cố ý và đúng: người đi ngang không nhờ vả.
Nhưng nó có **8 lời MỜI**, và lời mời cũng phải có hạn, vì người ta đang đi.

| nút | hứa / mời gì | hạn (giây thật) | giữ lời | NUỐT LỜI |
|---|---|---|---|---|
| 2.1.1 · 6.2.1 | "ăn thử một ổ" — nếu giữ chữ này thì đó là **cho**, không phải bán | ~15 s trao tay | `PROMISE_KEPT` | Người qua đường **không có trí nhớ** ⇒ **bỏ cả ba nấc, đi luôn**. Đó cũng là hình phạt đủ: mất một khách |
| S:moi.1 · S:moi.2 · 5.1.1 · 7.1.3 · 8.1.1 · 8.1.2 | mời ghé mua (`INVITE`) | roll ngay, không treo | khách ghé vô hàng | **đã có đường thất bại thật**: `no` + cờ `inviteRefused` ẩn mọi `INVITE` sau đó. Đây là mẫu §4bis nên chép sang các act khác |
| 3.2 · 3.4 · S:moi.3 · 4.1 · 4.2 | "đứng nhờ cho mát / cho khỏi ướt" | **tới khi hết `forSec`** rồi đi tiếp | họ đứng thật, đồng hồ của họ dừng, rồi họ **về đúng mục đích cũ** | nếu chỗ mát bị chiếm giữa chừng ⇒ `w.shadeFree` hỏng ⇒ `?` + họ đi tiếp. **Không được phép** đứng cả ngày — đúng lời chủ dự án |

## 5. Trí nhớ bốn tầng (§4ter)

| tầng | nút vi phạm | giả định sai | khoá cần |
|---|---|---|---|
| `c.*` trong cuộc | — | — | sạch |
| `v.*` trong lượt ghé | 8 nút `INVITE` | mời hai lần trong một lượt | **đã có**: cờ `inviteRefused` trên `Customer` làm đúng việc của `v.*`. Giữ |
| `d.*` trong ngày | 1.2 · 6.2 ("{me} cũng mới ra đây bán") | nói với một người có thể vừa đi ngang sáng nay | `d.metToday` |
| `m.*` cả mùa | 5.1.2 ("Bữa nào cũng trễ hả {call}?") | nhắc một thói quen nhiều ngày của một người **không có hồ sơ** | `m.visits(N)` — **nhưng không khai được, xem dưới** |

> **Lỗi cấu trúc §4ter — không sửa bằng khoá được, cần chủ dự án chốt.**
> `kindOf(QUA_DUONG)` trả `MOI`/`CHAO`, nên `touchesRelationship` = **false**: kho này cố
> ý **không ghi trí nhớ và không ghi điểm quan hệ**, vì `memKey` dùng chung cho **tám dáng
> người suốt cả mùa** (ghi vào đó là ghi lên sổ của người khác — `talk.ts`, khối `TalkKind`).
>
> Nghĩa là 5.1.2 *"Bữa nào cũng trễ hả {call}?"* và 1.2 / 6.2 *"{me} cũng mới ra đây bán"*
> **không có cách nào khai `m.visits` cho đúng**. Hai đường ra:
> 1. **Viết lại** ba câu đó thành câu không nhắc quá khứ (rẻ, làm được ngay); hoặc
> 2. thêm `t.named` và chỉ bày chúng cho 12 người CÓ TÊN — nhưng kho này không bao giờ
>    gặp người có tên, nên thực chất là **xoá**.
>
> Khuyến nghị: **đường 1**. Và ghi thẳng vào `_note` của file: *kho này không có hôm qua.*
