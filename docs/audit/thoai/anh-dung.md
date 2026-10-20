# Rà thoại — `src/content/talks/anh-dung.json`

> ## ⚡ REVAMP 2026-10-20 — ☠️ CHẾT TOÀN BỘ
> Rà thoại theo giọng cũ + hệ trí nhớ/quan hệ đã chết. Toàn bộ thoại viết lại giọng Nam gen Z ở R6 (CANON §9, §17.1). Chỉ giữ để truy vết nội dung cũ.

**Hợp đồng:** `docs/phase-2-he-npc/P2-07-neo-thoai-vao-the-gioi.md` · **8 cuộc · 111 nút**

Anh Dũng — xe ôm công nghệ, NPC **có tên** (`kindOf` → `CHUYEN`: có trí nhớ, có cờ chuyện,
có arc nhiều ngày). Anh là **khách đang mua**, luôn gấp, và gần như luôn ở `t.waiting`.

---

## 0. Đọc trước khi đọc bảng

Trạng thái code lúc rà — xem `docs/audit/thoai/walkin.md` §0 cho bản đầy đủ. Bốn điểm phải
nhớ khi đọc bảng dưới:

1. **`while` đã chạy thật** (`TalkNode.while`, `Service.chooseTalk()` → `snapshot()` →
   `allHold()` → `"?"` + `rel −1`). Trong 111 nút của file này **đúng 1 nút khai `while`**
   (`chaymua` 2.1.1, vừa thêm giữa lúc rà).
   Cột `need` / `while` trong bảng dưới **đã xếp theo §4.1** (TĨNH → `need` ẩn hẳn ·
   ĐỘNG → `while` ra `?`) — xem §4 cuối file.
2. **`need` chưa đi qua `holds()`** — nó vẫn chỉ tra cờ chuyện (`gate.flags`). File này
   dùng `need` **đúng cách duy nhất đang chạy được**: `basau` 3.2 `need: sauNhoNoi`.
3. **Bốn khoá §3 khai rồi nhưng vĩnh viễn `false`**: `t.cutLine`, `t.inShade`, `w.shadeFree`,
   `t.purpose/​t.state` — không chỗ nào gán giá trị.
4. `TalkAct` vẫn 7 loại, **không có `forSec`**. `GIVE_BREAD` · `OFFER_TEA` · `STAND_IN_SHADE` ·
   `WALK_ON` chưa tồn tại.

**Hai điểm riêng của file này:**

* **(D-1) Trí nhớ TRONG cuộc: file này SẠCH.** Mọi nút `GAT` đều `silent` và **không có
  `then`** — cuộc chết tại đó, nên không có đường nào "vừa chửi xong rồi khen". Bốn nút `CHUI`
  cũng vậy. Mấy chỗ `anger` nhẹ (`chaymua` 3, `anger 10`) có con là câu xin lỗi, và câu đáp
  đọc ra là **người ta chưa nguôi** (*"Anh cũng gắt. Mưa anh quạu."* · `MET`) — đúng tinh thần
  §3.3. **Không nút nào cần `need: "!c.angered"`.** Nhưng cũng phải nói thẳng: nó sạch nhờ
  **hình dạng của cây**, không nhờ một cái cổng nào. `c.angered` chưa được một nút nào trong
  bốn file đọc tới.
* **(D-2) Trí nhớ GIỮA các cuộc: file này THỦNG.** `dung.moiloi` (ngày 10+) cho người chơi
  gọi tên *"hũ số bảy"*, *"con nhỏ hát trên xe"*, *"mấy đứa đặt đồ rồi tắt máy"* — ba chi
  tiết **chỉ có trong `dung.ca`, `dung.congai`, `dung.mottsao`** — mà không một `need` nào
  kiểm người chơi đã nghe chưa. Đây là *"chú Sáu dọn đi 2 năm"* phiên bản anh Dũng: người
  chơi biết một chuyện chưa ai kể.

---

### dung.app — chiết khấu app lên 32% (15 nút)
`NPC_ONLY · SHORT · day 3–17` · opener *"…cái app nó mới nâng chiết khấu lên ba mươi hai phần trăm."*

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Ba mươi hai phần trăm lận hả anh?" | — | — | — | **ĐÚNG** |
| 1.1 | "Vậy anh còn lại nhiêu một ngày anh?" | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.1 | "Mười hai tiếng lận anh. Anh ngủ lúc nào?" | (nhánh cha) | — | — | **ĐÚNG** (`mem: CARED_FOR_THEM 45` là hệ quả thật) |
| 1.1.2 | "Sao anh không chuyển qua app khác anh?" | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.3 | "Tụi nó ăn dày thiệt chớ." | (nhánh cha) | — | — | **ĐÚNG** (`CHUI` vào người thứ ba, hợp tần số anh Dũng) |
| 1.1.4 | "Thì anh nghỉ đi, ai bắt anh chạy." | (nhánh cha) | — | — | **ĐÚNG** (`rel −5 · anger 35 · RUDE_TO_THEM 60` — `GAT` có giá thật) |
| 1.2 | "Anh làm bao lâu rồi anh?" → `ref: ket` | — | — | — | **ĐÚNG** |
| 1.3 | "Đâu có ai bắt anh làm đâu anh." | — | — | — | **ĐÚNG** |
| 2 | "Em bán bánh mì em cũng đâu có khá gì anh." | `p.revenueBelow(N)` | — | — | **SỬA**: game **có** con số doanh thu hôm nay; câu này than nghèo được cả vào ngày bán kỷ lục |
| 2.1 | "Nói vậy chớ em cũng trừ đủ thứ anh ơi." → `ref: ket` | (nhánh cha) | — | — | **ĐÚNG** |
| 2.2 | "Anh ráng nghen anh." → `ref: ket` | (nhánh cha) | — | — | **ĐÚNG** |
| 2.3 | "Dạ." (im) | — | — | — | **ĐÚNG** |
| 3 | "Anh ơi em đang gấp nè." | — | `w.queue >= 1` | — | **SỬA**: *"em đang gấp"* nói giữa một cái hẻm trống trơn |
| ket:1 | "Thôi anh chạy đi, em làm lẹ nè." | — | `t.waiting` | `PROMISE(lam-le)` · 30 s | **SỬA**: hứa nhanh, ăn `calm +15`, rồi thủng thẳng cũng không sao |
| ket:2 | "Anh chạy cẩn thận nghen anh." | — | — | — | **ĐÚNG** (xã giao thuần — không hứa gì nên không nợ gì) |

---

### dung.ca — cá lia thia, hũ số bảy (13 nút)
`NPC_ONLY · SHORT · day 7–17 · minVisits 3`

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Hũ số bảy là gì vậy anh?" | — | — | — | **ĐÚNG** |
| 1.1 | "Anh tự lai được luôn hả anh?" | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.1 | "Anh nói chuyện cá mà giọng anh khác hẳn luôn anh." | (nhánh cha) | — | — | **ĐÚNG** (`rel 4 · CARED 50`) |
| 1.1.2 | "Anh bán được nhiêu một con anh?" | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.3 | "Bữa nào anh cho em coi với anh." | (nhánh cha) | — | `flag: dungHuaKhoeCa` | **SỬA**: anh đáp *"Mai anh chụp hình anh đưa em coi"* — **một lời hứa của NPC** mà không có cờ nào ghi lại, nên mai không ai đòi được |
| 1.1.4 | "Nuôi cá chi cho mất thời gian anh." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.2 | "Mười bốn hũ để đâu cho hết anh?" | — | — | — | **ĐÚNG** |
| 1.3 | "Dạ em hổng rành cá anh ơi." | — | — | — | **ĐÚNG** |
| 2 | "Xanh ánh đỏ là đẹp hả anh?" | — | — | — | **ĐÚNG** |
| 2.1 | "Anh chăm dữ ha anh." | (nhánh cha) | — | — | **ĐÚNG** |
| 2.2 | "Anh chăm cá kỹ hơn chăm anh đó anh." | (nhánh cha) | — | — | **ĐÚNG** |
| 2.3 | "Dạ anh đợi chút nghen." | — | `t.waiting` | — | **SỬA**: bảo đợi một người đã cầm ổ trong tay (`t.served`) |
| 3 | "Dạ." (im) | — | — | — | **ĐÚNG** |

---

### dung.mottsao — bị một sao, khách bùng hai trăm (14 nút)
`NPC_ONLY · SHORT · day 5–17 · initiates 0,25` · có `ignore` khai sẵn ✓

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Tắt máy là sao anh?" | — | — | — | **ĐÚNG** |
| 1.1 | "Vậy hai trăm đó anh chịu hả anh?" | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.1 | "Vậy là mất tiền mà còn mang tiếng hả anh." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.2 | "Thằng đó khốn nạn thiệt." | (nhánh cha) | — | — | **ĐÚNG** (`CHUI` đúng chỗ) |
| 1.1.3 | "Anh khiếu nại đi anh, có bằng chứng mà." | (nhánh cha) | — | `flag: dungKhieuNai` | **SỬA**: anh đáp *"Chờ bảy ngày"* — bảy ngày đó không có chỗ nào trôi qua; không cờ, không cuộc trả lời |
| 1.1.4 | "Anh hổng kiểm tra trước là anh dở rồi anh." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.2 | "Đồ ăn đó giờ anh để đâu anh?" → `ref: ket` | — | — | — | **ĐÚNG** |
| 1.3 | "Hai trăm là anh chạy mấy cuốc hả anh?" → `ref: ket` | — | — | — | **ĐÚNG** |
| 2 | "Ngày nào anh cũng có chuyện hết anh ha." | **`t.toldMe(dungKeKho) >= 2`** | — | — | **SỬA**: *"ngày nào cũng"* nói được ngay lần đầu anh than. `when.minVisits` không thay được — **ghé** không phải **đã nghe** |
| 2.1 | "Em xin lỗi anh. Em nói hơi vô duyên." | (nhánh cha) | — | — | **ĐÚNG** |
| 2.2 | "Thì đời nó vậy anh ơi." | (nhánh cha) | — | — | **ĐÚNG** |
| 3 | "Dạ em đang làm anh ơi." | `!p.handsEmpty` | — | — | **SỬA**: *"em đang làm"* nói lúc hai tay không |
| ket:1 | "Thôi bỏ qua đi anh. Ngày còn dài." | — | `w.slot(SOM)` | — | **SỬA**: *"ngày còn dài"* nói lúc gần dẹp hàng |
| ket:2 | "Anh ăn đi rồi chạy tiếp anh." | — | `t.served` | — | **SỬA**: bảo người ta ăn khi ổ chưa rời tay mình |

---

### dung.basau — bà Sáu nói gì anh (19 nút)
`NPC_ONLY · SHORT · day 12–17 · needFlag: sauMangDung` ✓ — **cuộc duy nhất của file khoá bằng cờ chuyện, và khoá đúng**

> Đây cũng là **vòng arc khép kín duy nhất trong bốn file**: `sau.omcua` 1 đặt `sauMangDung`
> → mở cuộc này; `basau` 1.1.1 đặt `dungHoiSau`, `basau` 3.1 đặt `dungNhoNoi` → hai cờ đó
> được `sau.xetai` 2.2 và 2.3 đọc lại bằng `need`. Mẫu này nên nhân ra cả file.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Dạ bà nói anh ôm cua gắt quá đó anh." | `sauMangDung` (cấp cuộc) ✓ | — | — | **ĐÚNG** |
| 1.1 | "Bà chạy xe tải ba năm đó anh. Tuyến Mỹ Tho." | **`t.toldMe(sauXeTai)`** | — | — | **SỬA**: chuyện lái xe tải của bà Sáu chỉ có trong `sau.xetai` (**ngày 15+, minVisits 5**), mà cuộc này mở từ **ngày 12** — người chơi kể một bí mật chưa ai kể cho mình. Và `sau.xetai` **không đặt cờ nào** |
| 1.1.1 | "Bữa nào anh hỏi bà một câu đi anh. Bà chỉ cho." | (nhánh cha) | — | `flag: dungHoiSau` ✓ | **ĐÚNG** — mẫu chuẩn: đặt cờ, và `sau.xetai` 2.3 đọc lại |
| 1.1.2 | "Anh bị bà cụ bắt bài rồi anh ơi." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.3 | "Bà già rồi, bà nói cho vui thôi anh." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.4 | "Bà rảnh ghê, lo chuyện người ta." | (nhánh cha) | `!t.nearBy(BA_SAU)` | `OVERHEARD_BY(BA_SAU)` · ngay | **CẦN CODE**: nói xấu bà Sáu **ngay giữa hẻm bà đang gánh đi qua**, và `src/sim/overhear.ts` có sẵn cơ chế nghe lỏm mà thoại không nối vào. Hiện chỉ mất `rel −3` với anh Dũng, bà Sáu không biết gì |
| 1.2 | "Anh ôm cua gắt thiệt mà anh. Em đứng đây em thấy." → `ref: ket` | **`p.sawDungCorner`** | — | — | **SỬA**: khẳng định **chính mình đã nhìn thấy** một chuyện game không hề diễn ra trước mắt người chơi |
| 1.3 | "Dạ bà nói chơi thôi anh." → `ref: ket` | — | — | — | **ĐÚNG** (nói dối cho êm — cố ý, và có giá ở nhánh 2.1) |
| 2 | "Dạ bà có nói gì đâu anh." | — | — | `flag: dungBiNoiDoi` | **SỬA**: nói dối trắng mà không để lại dấu; nếu sau đó anh đi hỏi bà (`dungHoiSau`) thì lời nói dối này phải lòi ra |
| 2.1 | "Mà anh chạy chậm lại chút cũng được đó anh." | (nhánh cha) | — | — | **ĐÚNG** — câu đáp *"Vậy là bả có nói hả em"* bắt được lời nói dối **ngay trong cuộc**. Đúng tinh thần §3.3 |
| 2.2 | "Dạ ổ xíu mại của anh đây." | **`t.order(xiu-mai)`** · `p.holdsFilled` | — | `GIVE_BREAD` · ngay | **CẦN CODE**: **hard-code tên món** — anh gọi pate thì câu này đưa nhầm ổ; và nó kể chuyện đưa bánh trong khi việc đưa bánh nằm ở `deliver()` |
| 3 | "Chuyện của bà với anh, anh hỏi bà đi anh." | — | — | — | **ĐÚNG** |
| 3.1 | "Vậy để em nói giùm anh một tiếng." | (nhánh cha) | — | `flag: dungNhoNoi` ✓ | **ĐÚNG** — mẫu chuẩn |
| 3.2 | "Bà dặn em nói lại với anh: thắng trước khi vô cua nghen anh." | `sauNhoNoi` ✓ | — | — | **ĐÚNG** — **nút duy nhất của cả file có `need` chạy được**. Đây là hình mẫu cho 30 nút còn thiếu |
| 3.3 | "Ngại thì thôi anh, chạy tiếp đi anh." | (nhánh cha) | — | — | **ĐÚNG** |
| 4 | "Anh hỏi chi mấy cái đó, em đang bán nè anh." | — | `w.queue >= 1` | — | **SỬA**: *"em đang bán nè"* với `rel −5 · anger 40` ném ra giữa lúc không có khách nào |
| ket:1 | "Anh chạy từ từ nghen anh." | — | — | — | **ĐÚNG** |
| ket:2 | "Dạ ổ của anh đây anh." | `p.holdsFilled` | — | `GIVE_BREAD` · ngay | **CẦN CODE** |
| ket:3 | "Dạ." (im) | — | — | — | **ĐÚNG** |

---

### dung.congai — con gái sáu tuổi hát trên xe (20 nút)
`NPC_ONLY · SHORT · day 9–17 · minVisits 4`

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Bé nhà anh mấy tuổi rồi anh?" | — | — | — | **ĐÚNG** |
| 1.1 | "Nó hát bài gì vậy anh?" | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.1 | "Anh hát thử một câu coi anh." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.2 | "Vậy là anh chở nó đi mỗi sáng hả anh?" | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.3 | "Chở nó xong rồi anh mới chạy hả anh? Cực ghê." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.4 | "Dạ." (im) | — | — | — | **ĐÚNG** |
| 1.2 | "Bé ăn sáng chưa anh? Em gói thêm ổ nhỏ cho bé." → `ref: ket` | `!p.soldOut` | — | `PROMISE(o-nho)` + `FREE_LOAF` · kiểm lúc đưa bánh | **SỬA**: ***free word nặng nhất cuộc*** — anh gật (*"thôi, em gói đi"*), rồi **không ổ nào được gói, không ổ nào rời kho, không đồng nào mất**. `PROMISE` và `FREE_LOAF` đều đã có code |
| 1.3 | "Sáu tuổi là quậy dữ lắm đó anh." → `ref: ket` | (nhánh cha) | — | — | **ĐÚNG** |
| 2 | "Nghe anh kể em thấy anh khác hẳn mọi bữa đó anh." | `minVisits 4` (cấp cuộc) ✓ | — | — | **ĐÚNG** |
| 2.1 | "Mọi bữa anh gấp lắm. Bữa nay anh nói chậm." | (nhánh cha) | — | — | **ĐÚNG** (`rel 4 · calm 25 · CARED 55`) |
| 2.2 | "Bữa nay anh hổng chửi cái app." | **`t.toldMe(dungApp)`** | — | — | **SỬA**: nhắc lại một chuyện chỉ có trong `dung.app` mà không kiểm đã nghe chưa (D-2) |
| 2.3 | "Dạ hổng có gì anh." | (nhánh cha) | — | — | **ĐÚNG** |
| 3 | "Dạ anh đợi chút nghen anh, em làm liền." | — | `t.waiting` | `PROMISE(lam-le)` · 30 s | **SỬA** |
| 3.1 | "Anh ngồi ghế đợi đi anh." `needEquip: GHE_BAN` | — | ghế trống | — | **ĐÚNG** — **cách viết đúng nhất cả bốn file**: anh **từ chối** (*"Thôi anh đứng. Ngồi rồi lười"*), nên câu mời không nợ thế giới một hành động nào. Đây là cách xử lý mẫu cho mọi câu mời mà game chưa làm nổi |
| 3.2 | "Anh gấp thì em làm trước cho anh." | — | `w.queue >= 2` | — | **SỬA**: ưu tiên anh lên trước **khi sau lưng không có ai** là câu rỗng. (Anh từ chối sẵn nên không nợ `act` — xem 3.1) |
| 3.3 | "Anh nhích vô trong cho đỡ nắng đi anh." | — | `w.hot` · `w.shadeFree` | `STAND_IN_SHADE` · 20–30 s rồi về chỗ cũ | **CẦN CODE**: ***"vào đứng cho mát" — nguyên văn chỗ chủ dự án chỉ***. Anh gật thật (*"Đứng trong này mát hơn thiệt"*) và **đứng y chỗ cũ**. Không có ô hóng mát trong `src/world/map.ts`, `w.shadeFree` vĩnh viễn `false` |
| 4 | "Anh kể chuyện nhà anh hoài em rối tay quá anh." | — | `w.queue >= 2` | — | **SỬA**: *"rối tay"* với `rel −5 · anger 45` nói lúc tay không và hẻm trống |
| ket:1 | "Anh đi nghen anh. Chạy cẩn thận." | — | — | — | **ĐÚNG** |
| ket:2 | "Dạ ổ của anh đây anh." | `p.holdsFilled` | — | `GIVE_BREAD` · ngay | **CẦN CODE** |
| ket:3 | "Dạ." (im) | — | — | — | **ĐÚNG** |

---

### dung.chaymua — áo mưa rách, chạy giữa mưa (21 nút)
`NPC_ONLY · SHORT · day 3–17 · rain: true` ✓ — **cuộc duy nhất của file khoá đúng thời tiết ở cấp cuộc**

> Cuộc giàu nhất và **thủng nhiều nhất** cả file: sáu nút xoay quanh **một cái áo mưa không
> tồn tại trong game**, và ba nút nữa xoay quanh **đứng trú mưa ở một chỗ không có**.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Anh lấy cái áo mưa này của em đi anh. Em có hai cái." | `p.hasAoMua(2)` | — | `LEND_ITEM(AO_MUA)` · tới khi trả | **CẦN CODE**: ***free word nặng nhất cả bốn file*** — `rel +4 · calm 28 · CARED 60` cho một món đồ **không có trong kho, không rời tay ai, không ai nợ ai**. Không có đạo cụ áo mưa, không có sổ mượn đồ |
| 1.1 | "Khỏi trả anh. Anh khô người là được rồi." | (nhánh cha) | — | `CLEAR_DEBT(AO_MUA)` · ngay | **CẦN CODE**: xoá một món nợ chưa từng được ghi |
| 1.1.1 | "Anh ướt vầy chạy cả ngày là bệnh đó anh." | (nhánh cha) | `w.rain` ✓ (cấp cuộc) | — | **ĐÚNG** |
| 1.1.2 | "Mai anh trả cũng được, mà đừng rách nữa nghen." | (nhánh cha) | — | `LEND_ITEM(AO_MUA)` hạn mai | **CẦN CODE** |
| 1.1.3 | "Dạ anh đi đi, trễ cuốc rồi anh." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.2 | "Mai anh trả nghen anh. Em nhớ mặt anh rồi đó." → `ref: ket` | (nhánh cha) | — | `LEND_ITEM(AO_MUA)` hạn mai | **CẦN CODE** |
| 1.3 | "Dạ anh mặc vô lẹ đi anh." → `ref: ket` | (nhánh cha) · `t.hasAoMua` | — | — | **CẦN CODE** |
| 2 | "Anh đứng đụt chút cho ráo rồi hẵng chạy anh." | `p.hasEquip(DU_CHE)` | `w.rain` ✓ | `STAND_UNDER_COVER` · `forSec` | **CẦN CODE**: *"đứng đụt"* — **không có chỗ đụt**. `DU_CHE` (dù che, 540k) **là thiết bị mua được có thật**, nên chỗ này chữa được bằng `needEquip: DU_CHE` + một act mới, không phải vẽ bản đồ mới |
| 2.1 | "Tiền thì ngày nào cũng có. Anh đứng năm phút đi anh." | (nhánh cha) · `p.hasEquip(DU_CHE)` | `w.rain` | `STAND_UNDER_COVER` · **300 s** rồi đi tiếp đúng mục đích cũ | **CẦN CODE**: anh **nhận lời** (*"Năm phút. Em đếm giùm anh nghen"*) rồi đi đúng lúc anh vốn đi. Đây đúng là chỗ chủ dự án nói *"không phải bảo họ vào đứng mát là họ đứng luôn cả ngày"* — nhưng ngược lại: **không đứng một giây nào** |
| 2.1.1 | "Dạ em đếm. Anh uống ly trà nóng cái đã." | (nhánh cha) · ✅ `p.hasTea` **đã có** | — | `OFFER_TEA` · ~8 s | **CẦN CODE**: nút **duy nhất của file đã khai `while`** — nhưng (a) `p.hasTea` đếm **trà ĐÁ** (`teaLeft`, `TEA_COST`, `BINH_TRA`), còn câu thoại mời **trà NÓNG**, game không có; (b) vẫn không gọi `serveTea()` nên **không trừ ly nào** và anh **không có quyền từ chối** (`refuseTea` có sẵn mà không ai gọi). `rel +4 · calm 30 · CARED 55` miễn phí |
| 2.1.2 | "Năm phút thôi đó nghen anh. Em đuổi đó." | (nhánh cha) | — | (phụ thuộc 2.1) | **CẦN CODE** |
| 2.1.3 | "Anh tự lo đi anh, em hổng rảnh đếm." | (nhánh cha) | — | — | **ĐÚNG** |
| 2.2 | "Mưa vầy chạy ẩu là nằm viện đó anh." → `ref: ket` | (nhánh cha) | `w.rain` ✓ | — | **ĐÚNG** |
| 2.3 | "Dạ vậy anh đi đi." (im) | (nhánh cha) | — | — | **ĐÚNG** |
| 3 | "Dạ anh đợi chút, bánh còn trong lò anh." | **`p.ovenBusy`** | — | — | **SỬA**: khẳng định một chuyện game **đo được** (`src/sim/oven.ts`) — nói lúc khay đầy bánh chín là nói dối, và nó tốn của anh `anger 10` |
| 3.1 | "Dạ em xin lỗi anh. Em lấy ra liền nè." | (nhánh cha) · `p.ovenBusy` | — | — | **SỬA** |
| 3.2 | "Dạ bánh sống anh ăn hổng nổi đâu anh." | (nhánh cha) · `p.ovenBusy` | — | — | **SỬA** |
| 3.3 | "Anh gấp thì anh khỏi mua cũng được anh." | (nhánh cha) | — | `REFUSE` · ngay | **SỬA**: đuổi khách bằng mồm (`REFUSE` đã có code) |
| 4 | "…" (im) | — | — | — | **ĐÚNG** (`rel −1 · anger 15` là giá thật) |
| ket:1 | "Anh chạy cẩn thận nghen anh. Đường trơn lắm." | — | `w.rain` ✓ | — | **ĐÚNG** |
| ket:2 | "Dạ ổ của anh đây anh." | `p.holdsFilled` | — | `GIVE_BREAD` · ngay | **CẦN CODE** |

---

### dung.moiloi — người chơi bắt chuyện (6 nút)
`PLAYER_ONLY · SHORT · day 10–17 · minVisits 4` · opener *"Ủa. Em kêu anh hả."* —
**opener này không bao giờ hiện** (`openTalk()` khi người chơi mở lời trả `talkView("")`)

> **Cuộc này là tâm chấn của (D-2).** Bốn trong sáu nút gọi tên một chi tiết riêng của anh
> Dũng, và **không nút nào kiểm người chơi đã nghe chưa**.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Bữa nay cái app nó cho anh sống hông anh?" | **`t.toldMe(dungApp)`** | — | — | **SỬA**: chuyện chiết khấu chỉ có trong `dung.app` |
| 1.1 | "Hũ số bảy lên màu tới đâu rồi anh?" | **`t.toldMe(dungCa)`** | — | — | **SỬA**: ***"hũ số bảy"*** là một cái tên riêng chỉ có trong `dung.ca`. Người chơi gọi đúng tên một cái hũ chưa ai kể |
| 1.2 | "Sáng nay con nhỏ có hát trên xe hông anh?" | **`t.toldMe(dungConGai)`** | `w.slot(SOM)` | — | **SỬA**: chuyện con gái chỉ có trong `dung.congai`; và *"sáng nay"* nói lúc 11 giờ là trật |
| 1.3 | "Vậy thôi. Em làm tiếp đây." | — | — | — | **ĐÚNG** |
| 2 | "Mấy đứa đặt đồ rồi tắt máy đó. Thứ gì đâu." | **`t.toldMe(dungMotSao)`** | — | — | **SỬA**: vụ bùng hai trăm chỉ có trong `dung.mottsao` |
| 3 | "Anh dựng xe sát quầy em quá. Lùi ra coi anh." | **`t.bikeBlocking`** · `t.onBike` | — | `MOVE_BIKE` · tới hết lượt ghé | **CẦN CODE**: ***họ hàng ruột của "chị chen hàng"*** — buộc tội người ta đậu xe chắn quầy **trong khi không có trạng thái nào ghi chỗ cái xe**; và sau khi anh nói *"Ờ. Anh lùi"*, **cái xe không nhúc nhích** |

---

### dung.moiloi2 — hỏi thăm ngắn (3 nút)
`PLAYER_ONLY · SHORT · day 3–17` · opener *"Ờ. Chi đó em."* — **không bao giờ hiện**

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Trưa nay anh ăn gì chưa anh?" | — | `w.slot(TRUA)` | — | **SỬA**: hỏi *"trưa nay"* lúc sáu giờ sáng; `when` không khoá `slot` |
| 2 | "Anh ngồi trên xe mà mắt anh sụp xuống rồi kìa anh." | **`t.onBike`** | — | — | **CẦN CODE**: khẳng định anh đang **ngồi trên xe** trong khi game vẽ anh đứng xếp hàng như mọi khách |
| 3 | "Thôi. Em hỏi cho có hà." | — | — | — | **ĐÚNG** |

---

## 1. Thống kê

| | số nút |
|---|---|
| **Tổng** | **111** |
| `ĐÚNG` | 66 |
| `SỬA` | 28 |
| `CẦN CODE` | 17 |
| `XOÁ` | 0 |

Bốn con số đáng nhớ:

* **1/111 nút có `while`** — `chaymua` 2.1.1, và chính nó vẫn sai (trà **nóng** gác bằng khoá
  trà **đá**).
* **1/111 nút có `need` chạy được** — `basau` 3.2 (`need: sauNhoNoi`). Hình mẫu cho 12 nút
  đang thiếu `need`.
* **0/111 nút có `act`.** Cả file anh Dũng không một câu nói nào đổi được thế giới — kể cả
  câu cho mượn áo mưa, câu gói thêm ổ bánh cho con gái anh, câu mời anh đứng trú mưa năm phút.
* **4/111 nút đặt `flag`** (`dungHoiSau`, `dungNhoNoi`) — đều nằm trong `dung.basau`.
  Toàn bộ phần còn lại của file **không để lại dấu vết nào sang ngày mai**.

Tỉ lệ `ĐÚNG` cao (59%) **không có nghĩa là file này ổn**: nó cao vì anh Dũng là người **kể
chuyện**, và phần lớn nút là *câu hỏi thuần* — thứ không hứa gì nên không nợ gì. Đúng ba chỗ
anh Dũng **nhận một cái gì đó** (áo mưa · ổ bánh cho con · ly trà) thì **cả ba đều là free word**.

---

## 2. Đề xuất khoá mới

| khoá | vì sao cần | nút nào đòi |
|---|---|---|
| `t.toldMe(F)` **chạy được** | §3.2 có khai khoá này, nhưng `need` chưa đi qua `holds()` nên không dùng được; và **các cuộc nguồn không đặt cờ** (`dung.ca`, `dung.congai`, `dung.mottsao`, `sau.xetai` đều không có `flag`). Phải làm cả hai đầu | moiloi 1 · 1.1 · 1.2 · 2 · congai 2.2 · basau 1.1 · mottsao 2 |
| `t.onBike` · `t.bikeBlocking` | anh Dũng đi xe máy, mà game không có trạng thái nào về cái xe — hai nút nói thẳng về nó | moiloi 3 · moiloi2 2 |
| `p.ovenBusy` | *"bánh còn trong lò"* — `src/sim/oven.ts` **có** trạng thái này, thoại chỉ chưa với tới | chaymua 3 · 3.1 · 3.2 |
| `w.slot(X)` ở cấp NÚT | `TalkWhen.slot` chỉ khoá được cả cuộc. Năm nút hard-code giờ (*"trưa nay"*, *"sáng nay"*, *"ngày còn dài"*) | moiloi2 1 · moiloi 1.2 · mottsao ket:1 |
| `p.revenueBelow(N)` | *"em bán bánh mì em cũng đâu có khá gì"* — game biết con số, thoại thì không | app 2 |
| `p.hasAoMua(N)` · `t.hasAoMua` | sáu nút nói về một cái áo mưa | chaymua 1 · 1.3 |
| `p.sawDungCorner` | *"em đứng đây em thấy"* — khẳng định chính mình đã chứng kiến một chuyện chưa từng hiện ra trước mắt người chơi | basau 1.2 |
| `t.order(X)` | *"ổ xíu mại của anh đây"* hard-code tên món | basau 2.2 |
| `t.nearBy(NPC)` | nói xấu bà Sáu lúc bà đang đi ngang phải khác lúc bà đi khỏi | basau 1.1.4 |
| `p.hasTea` phân biệt **nóng/đá** | khoá hiện có chỉ đếm trà đá; game không có trà nóng | chaymua 2.1.1 |

---

## 3. Hành động cần code

| hành động | câu nào đòi | thời lượng đề xuất | thiếu gì trong game |
|---|---|---|---|
| **`need` đi qua `holds()`** | 12 nút `t.toldMe(...)` trong bảng trên | — | `visibleOptions()` vẫn chỉ tra `gate.flags`. **Việc đầu tiên.** Kèm theo: bốn cuộc nguồn (`dung.ca`, `dung.congai`, `dung.mottsao`, `sau.xetai`) phải **đặt cờ** thì mới có gì cho `need` đọc |
| `GIVE_BREAD` | basau 2.2 · basau ket:2 · congai ket:2 · chaymua ket:2 | ngay (rồi `t.eating` ~20 s) | ổ phải rời `player.hand`; hiện chỉ `deliver()` làm được, thoại không với tới |
| `OFFER_TEA` | chaymua 2.1.1 | ~8 s | `serveTea()` / `refuseTea()` **đã có đủ** (trừ `teaLeft`, tính `TEA_COST`, từ chối theo `soi` + `teaSuspect`). Chỉ thiếu một `TalkAct` gọi vào. **Và cần một thứ "trà nóng" thật, hoặc sửa lời thoại thành trà đá** |
| `STAND_IN_SHADE` / `STAND_UNDER_COVER` + `forSec` | congai 3.3 (nắng) · chaymua 2 · 2.1 · 2.1.2 (mưa) | 20–30 s (nắng) · **300 s** (mưa, anh nói rõ "năm phút") | không có ô hóng mát trong `src/world/map.ts`; `w.shadeFree` vĩnh viễn `false`. **Đường rẻ hơn cho cảnh mưa**: `DU_CHE` (540k) là thiết bị đã có — gác bằng `needEquip` rồi cho họ đứng dưới dù. Hết giờ phải **đi tiếp đúng mục đích cũ** |
| `LEND_ITEM` / `CLEAR_DEBT` (đạo cụ) | chaymua 1 · 1.1 · 1.1.2 · 1.2 · 1.3 | tới khi trả (sang ngày hôm sau) | **không có đạo cụ áo mưa**, không có sổ mượn đồ, không có đường "anh quên trả". Đây là arc đẹp nhất của anh Dũng và nó đang là sáu dòng chữ |
| `PROMISE` / `FREE_LOAF` đúng chỗ | congai 1.2 (ổ nhỏ cho bé) · app ket:1 · ca 2.3 · congai 3 (hứa làm lẹ) | kiểm lúc `deliver()` | **cả hai act đã có code chạy được** (`pledges`, `BROKEN_PROMISE`, `pricedAfterPledge`). Đây là nhóm sửa rẻ nhất file |
| `MOVE_BIKE` | moiloi 3 | tới hết lượt ghé | không có trạng thái vị trí xe máy; cũng không có khoá nào ghi *"xe đang chắn quầy"* — nên câu buộc tội này **luôn luôn nói bừa** |
| `OVERHEARD_BY(NPC)` | basau 1.1.4 | ngay | `src/sim/overhear.ts` có sẵn cơ chế nghe lỏm; hệ thoại chưa nối vào. Nói xấu một người ngay lúc người đó đi ngang phải có giá |
| **`flag` cho lời hứa của NPC** | ca 1.1.3 (*"mai anh chụp hình đưa em coi"*) · mottsao 1.1.3 (*"chờ bảy ngày"*) | sang ngày hôm sau | NPC hứa với người chơi mà không cờ nào ghi; mai không có cuộc nào trả lời, và người chơi không đòi được |
| **`forSec`** | mọi act có thời lượng ở trên | — | `TalkAct` không có trường thời lượng nào |

---

## 4. §4.1 — chia `need` / `while` theo TĨNH hay ĐỘNG

Bảng trên đã được xếp lại theo luật này.

| nhóm | khoá trong file này | xếp | vì sao |
|---|---|---|---|
| **TĨNH → `need`** | `p.holdsFilled` · `p.hasTea` · `!p.handsEmpty` · `p.hasAoMua(N)` · `p.hasEquip(DU_CHE)` · `p.revenueBelow(N)` · `p.sawDungCorner` · `t.toldMe(X)` · `t.order(X)` · `t.hasAoMua` · `t.onBike` · `t.bikeBlocking` | **28 nút** | tay người chơi, kho đồ, và sổ quá khứ không đổi trong lúc thẻ mở |
| **ĐỘNG → `while`** | `t.waiting` · `t.served` · `t.nearBy(BA_SAU)` · `w.queue(N)` · `w.rain` · `w.hot` · `w.shadeFree` · `w.slot(X)` · `p.ovenBusy` | **19 nút** | đồng hồ vẫn chạy: lò chín, mưa tạnh, bà Sáu gánh đi khỏi, hàng dài ra |

**Hai chỗ dễ xếp nhầm:**

1. **`p.ovenBusy` là ĐỘNG, không phải tĩnh.** Ba nút của `chaymua` 3 (*"bánh còn trong lò"*)
   phải ra `?` chứ **không** được ẩn: lò chín **đúng trong lúc người chơi đang đọc ba dòng**
   là chuyện xảy ra thật, và lúc đó câu *"bánh còn trong lò"* đã thành câu nói dối — đúng ví
   dụ §4.1 nêu (*"vừa nãy còn đúng, giờ hết đúng"*).
2. **`t.nearBy(BA_SAU)` là ĐỘNG.** `basau` 1.1.4 (nói xấu bà Sáu) không được ẩn theo vị trí
   bà — bà đi ngang giữa lúc đang đọc là tình huống **đáng giá nhất** của nút đó.

**Rủi ro `?` quá 5%:** `dung.moiloi` có 4/6 nút cần `t.toldMe(X)`. Nếu để dạng `while` thì
người chơi mở thẻ ra và bấm gì cũng ra `?`. Chúng **là TĨNH** ⇒ `need`, ẩn hẳn — và nếu ẩn
hết thì `trimKeepingExit()` vẫn còn nút 1.3 (`LANH`) làm đường ra. Đúng luật 3 của `talk.ts`.

---

## 5. §4bis — LỜI HỨA CÓ HẠN

### 5.1. Hứa LÀM NGAY TẠI CHỖ — hạn tính bằng giây thật

| nút | hứa gì | hạn | giữ lời | **NUỐT LỜI** |
|---|---|---|---|---|
| `chaymua` 2.1.1 | rót ly trà (nóng — game chỉ có đá) | **25 s** | `CARED_FOR_THEM 55` như đang khai | nấc 1 anh nhắc *"Ly trà đâu em?"* → nấc 2 `anger 25` → nấc 3 **anh chạy luôn**. Anh Dũng vốn gấp ⇒ **rút còn hai nấc** |
| `chaymua` 2 · 2.1 | *"anh đứng đụt chút / năm phút đi anh"* | anh nói rõ: **300 s** | `STAND_UNDER_COVER` 300 s rồi đi tiếp đúng cuốc của anh | hết 300 s mà người chơi không làm gì: anh đi, **không giận** — anh đã được cái anh cần. Nhưng nếu người chơi **không dựng được chỗ đụt** (chưa mua `DU_CHE`) thì câu này phải **ẩn hẳn** (`need: p.hasEquip(DU_CHE)`), chứ không phải hứa rồi thất hứa |
| `chaymua` 2.1.2 | *"em đếm giùm anh"* | **300 s**, đếm thật | — | bỏ đếm giữa chừng: `rel −2`, anh đi sớm |
| `congai` 1.2 | **gói thêm một ổ nhỏ cho con gái anh** | **tới lúc đưa bánh** (cùng nhịp `deliver`) | `PROMISE(o-nho)` + `FREE_LOAF` → `PROMISE_KEPT` | đưa ổ mà không có ổ nhỏ: `BROKEN_PROMISE` — và đây là lời hứa **về con anh**, nên phải nặng hơn mức thường (đề xuất `RUDE_TO_THEM` 50 thay vì phạt chuẩn) |
| `app` ket:1 · `congai` 3 · `ca` 2.3 | *"em làm lẹ nè / anh đợi chút"* | **30 s** | `calm 15` giữ nguyên | quá 30 s: `calm` vừa ăn **bị thu lại**. Hiện lời ngon ngọt là lãi ròng không có mặt trái |
| `basau` 2.2 · ket:2 · `congai` ket:2 · `chaymua` ket:2 | *"ổ của anh đây"* | **ngay** | `GIVE_BREAD` | nói mà tay không: phải **ẩn hẳn** (`need: p.holdsFilled`), không phải hứa |

### 5.2. Hứa CHO NGÀY KHÁC — kiểm ở lần ghé sau

Anh Dũng là NPC **có tên**, nên tầng này **có thật** và đang bị bỏ trống hoàn toàn.

| nút | hứa gì | kiểm khi nào | giữ lời | **NUỐT LỜI** |
|---|---|---|---|---|
| `basau` 3.1 | *"để em nói giùm anh một tiếng"* (nói với bà Sáu giùm anh) | **lần ghé sau của anh Dũng** | đã đặt `flag: dungNhoNoi` ✓, và `sau.xetai` 2.2 đọc lại ✓ — **nhưng không có nhánh nào kiểm người chơi đã THỰC SỰ nói với bà chưa** | phải có: anh hỏi *"Em nói chưa em?"* → chưa nói thì `rel −3` và anh **thôi nhờ** |
| `chaymua` 1.1.2 · 1.2 | cho mượn áo mưa, *"mai anh trả"* | **ngày hôm sau** | anh trả → `rel +`, thành một kỷ niệm | anh quên trả → người chơi đòi được, hoặc tha; cả hai đều phải là một lựa chọn |
| `ca` 1.1.3 | **anh hứa với mình**: *"mai anh chụp hình anh đưa em coi"* | ngày hôm sau | cần `flag: dungHuaKhoeCa` + một cuộc trả lời | anh quên → người chơi nhắc được → đây là chỗ quan hệ sâu thêm. Hiện **bốc hơi sạch** |
| `mottsao` 1.1.3 | anh đi khiếu nại, *"chờ bảy ngày"* | **ngày +7** | cần `flag: dungKhieuNai` + cuộc kết | hiện không có gì |

### 5.3. Phải NHÌN THẤY được lúc đang treo

Lời hứa nặng nhất của file — **cái áo mưa** — treo qua đêm mà không có chỗ nào nhìn thấy nó.
Cần một dòng trong sổ tay / trang tối: *"anh Dũng mượn áo mưa"*.

---

## 6. §4ter — TRÍ NHỚ BỐN TẦNG

| tầng | khoá | hiện trạng trong file này |
|---|---|---|
| **trong cuộc** `c.*` | `c.angered` · `c.saidTone(X)` | code nuôi thật (`talkAngered`, `picked`), **0/111 nút đọc**. File này không vi phạm §3.3 (xem D-1) nhưng cũng không dùng được cái gì |
| **trong lượt ghé** `v.*` | `v.gaveTea` · `v.promised(X)` | **tầng này không tồn tại**. Cần cho §5.1: hiện có thể hứa *"em làm lẹ"* ở `app` ket:1 rồi hứa lại ở `congai` 3 trong cùng một lượt ghé mà không ai thấy lạ |
| **trong ngày** `d.*` | `d.metToday` · `d.toldMe(X)` | **không tồn tại**. Anh Dũng ghé hai lần một ngày thì lần hai vẫn chào như chưa gặp |
| **cả mùa** `m.*` | `m.visits(N)` · `m.tier(X)` · `m.remembers(E)` | `mem.visits`, `mem.tier`, `record()`/`decay()` **đã có đủ**. `TalkWhen.minVisits` và `TalkWhen.tier` dùng được ở **cấp cuộc**, nhưng **cấp nút thì không có đường nào** |

### Luật cứng — câu giả định "lần đầu gặp"

File này **không có nút nào** giả định lần đầu gặp — mọi cuộc đều khoá `day >= 3` và bốn cuộc
khoá thêm `minVisits`. **Sạch.**

### Luật cứng — câu NHẮC LẠI một chuyện (chỗ thủng chính)

*Nhớ nhầm một chuyện chưa từng xảy ra là lỗi nặng hơn quên.* **Bảy nút phạm:**

| nút | nhắc lại chuyện gì | nguồn duy nhất | phải khai |
|---|---|---|---|
| `moiloi` 1.1 | **"hũ số bảy"** — tên riêng một cái hũ cá | `dung.ca` (ngày 7+, minVisits 3) | `need: "m.remembers(dungCa)"` |
| `moiloi` 1.2 | con gái anh hát trên xe | `dung.congai` (ngày 9+, minVisits 4) | `need: "m.remembers(dungConGai)"` |
| `moiloi` 2 | vụ khách bùng hai trăm | `dung.mottsao` (ngày 5+) | `need: "m.remembers(dungMotSao)"` |
| `moiloi` 1 | chiết khấu app | `dung.app` (ngày 3+) | `need: "m.remembers(dungApp)"` |
| `congai` 2.2 | *"bữa nay anh hổng chửi cái app"* | `dung.app` | `need: "m.remembers(dungApp)"` |
| `basau` 1.1 | **bà Sáu lái xe tải ba năm, tuyến Mỹ Tho** | `sau.xetai` (**ngày 15+**, minVisits 5) | `need: "m.remembers(sauXeTai)"` — và cuộc này mở từ **ngày 12**, tức cửa sổ ngày 12–14 là **chắc chắn nhớ nhầm** |
| `mottsao` 2 | *"ngày nào anh cũng có chuyện"* | cần **≥ 2** lần đã nghe anh than | `need: "m.remembers(dungKeKho) >= 2"` |

**Chặn ở đầu nguồn cũng thiếu:** `dung.ca`, `dung.congai`, `dung.mottsao`, `dung.app`,
`sau.xetai` — **không cuộc nào đặt `flag`**. Nên dù `need` có đi qua `holds()` ngày mai thì
vẫn không có gì cho nó đọc. Phải sửa **cả hai đầu**: cuộc kể chuyện đặt cờ, cuộc nhắc lại
đọc cờ.
