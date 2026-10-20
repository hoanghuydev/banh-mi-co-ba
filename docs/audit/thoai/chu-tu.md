# Rà thoại — `src/content/talks/chu-tu.json`

> ## ⚡ REVAMP 2026-10-20 — ☠️ CHẾT TOÀN BỘ
> Rà thoại theo giọng cũ + hệ trí nhớ/quan hệ đã chết. Toàn bộ thoại viết lại giọng Nam gen Z ở R6 (CANON §9, §17.1). Chỉ giữ để truy vết nội dung cũ.

**Hợp đồng:** `docs/phase-2-he-npc/P2-07-neo-thoai-vao-the-gioi.md` · **8 cuộc · 104 nút**

Chú Tư — bảo vệ công ty, 58 tuổi, nuôi chào mào *Sáu Ngón*, vợ gói cơm mỗi sáng. NPC **có
tên** (`kindOf` → `CHUYEN`). Chú là **khách sáng đều đặn, luôn sắp trễ ca**.

---

## 0. Đọc trước khi đọc bảng

Trạng thái code lúc rà (bản đầy đủ ở `docs/audit/thoai/walkin.md` §0):

1. **`while` đã chạy thật** (`TalkNode.while` → `snapshot()` → `allHold()` → `"?"` + `rel −1`).
   File này có **0/104 nút khai `while`** — file duy nhất trong bốn file không có nút nào.
2. **`need` chưa đi qua `holds()`** — vẫn chỉ tra cờ chuyện. **Nhưng file này dùng `need`
   nhiều nhất và đúng nhất cả bốn file: 5 nút**, trong đó **ba nút đọc cờ của NPC KHÁC**
   (`maiSoNo` · `maiDayGhiSo` của cô Mai · `suSoThi` của bé Su).
3. `t.cutLine` · `t.inShade` · `w.shadeFree` · `t.purpose/state` **khai rồi mà vĩnh viễn `false`**.
4. `TalkAct` 7 loại, **không có `forSec`**. `GIVE_BREAD` · `OFFER_TEA` · `WALK_ON` chưa có.

Cột `need` / `while` dưới đây **đã xếp theo §4.1**: TĨNH → `need` (ẩn hẳn) · ĐỘNG → `while`
(ra `?`). Xem §4 cuối file.

**Quy ước phán:** `SỬA` = chữa được bằng JSON (khoá/act đã có) · `CẦN CODE` = phải viết thêm
act/khoá/đạo cụ · `ĐÚNG` = xã giao hoặc câu hỏi thuần, không hứa gì không khẳng định gì ·
`XOÁ` = hứa chuyện không làm được và không đáng làm. Nhánh cha đã bảo đảm điều kiện thì con
không khai lại `need`.

**Ba điểm riêng của file này:**

* **(T-1) MẠNG CỜ CHÉO NPC — LÀM ĐÚNG, VÀ LÀ MẪU CHO CẢ GAME.** `tu.quenvi` 2 đọc `maiSoNo`,
  2.1.1 đọc `maiDayGhiSo` (cô Mai dạy ghi sổ nợ), `tu.consu` 1.3 đọc `suSoThi` (bé Su sợ bị
  bắt ôn thi), `tu.congty` 3 đọc `tuCamOnVo` (đặt ở `tu.com`). **Bốn chuyện của bốn người
  chạm vào nhau bằng cờ.** Đây đúng là chỗ chủ dự án dặn soi kỹ với cô Mai — và kết quả là
  **sạch**: người chơi chỉ nhắc chuyện cô Mai dạy khi **đã thật sự được cô dạy**.
* **(T-2) CÁI THỦNG LỚN NHẤT LÀ MỘT ACT GẮN SAI, KHÔNG PHẢI MỘT ACT THIẾU.** `tu.quenvi` 2
  — *"Dạ con **ghi sổ, mai chú trả** nghen chú"* — gắn `act: FREE_LOAF`. `FREE_LOAF` nghĩa là
  **ổ này không bao giờ thu tiền**. Ghi nợ nghĩa là **một khoản phải thu**. Hai chuyện kinh
  tế ngược nhau, và nhánh con còn nói tiếp *"con ghi rồi nè. Chú Tư, bữa nay, một ổ"* — ghi
  vào một cuốn sổ không tồn tại, cho một món nợ đã được xoá ngay lúc nói.
* **(T-3) CHÚ TƯ LÀ NGƯỜI HAY HỨA, VÀ KHÔNG LỜI HỨA NÀO CÓ HẠN.** *"Mai chú mua hai ổ bù"* ·
  *"Tháng sau nó hót được là chú khao con một chầu"* · *"Mai chú ghé chú đưa con"* ·
  *"Chú nhớ bữa nay nghen con. Chú nhớ lâu lắm."* — bốn lời hứa, **không cờ nào, không hạn
  nào**. Xem §5.2.

---

### tu.chim — Sáu Ngón đi thi lại thua (15 nút)
`NPC_ONLY · SHORT · day 4–29` · opener *"**Chủ nhật rồi** chú đem Sáu Ngón đi thi. Thua nữa con ơi."*

> **Lỗi cấp CUỘC:** opener nói *"chủ nhật rồi"* — tức hôm nay phải là **thứ hai**. `TalkWhen`
> **đã có trường `weekday`** và cuộc này không dùng. Rút trúng thứ tư thì câu mở lời sai ngay
> từ chữ đầu. Sửa tốn một dòng: `"weekday": ["MON"]`.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Sáu Ngón là con chim hả chú?" | — | — | — | **ĐÚNG** |
| 1.1 | "Ủa sao kỳ vậy chú?" | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.1 | "Vậy chú đừng cho nó đi thi nữa chú." | (nhánh cha) | — | — | **ĐÚNG** (`CARED 40`) |
| 1.1.2 | "Giống chú chỗ nào hả chú?" | (nhánh cha) | — | — | **ĐÚNG** (`REMEMBERED_STORY 45`) |
| 1.1.3 | "Nuôi sáu năm mà hổng hót được, uổng ghê chú." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.4 | "Chú rảnh ghê chú ha." | (nhánh cha) | — | — | **ĐÚNG** (`rel −3 · anger 20 · RUDE 45` — có giá) |
| 1.2 | "Chú đem nó ra đây hót thử coi chú." → `ref: ket` | — | — | — | **ĐÚNG** — chú **từ chối** (*"Đem ra đây nó sợ cái lò nhà con luôn"*), nên câu mời không nợ act nào. Cách viết đúng |
| 1.3 | "Con chim thi hót là thi cái gì vậy chú?" → `ref: ket` | — | — | — | **ĐÚNG** |
| 1.4 | "Dạ. Ổ chú đây chú." | `p.holdsFilled` | — | `GIVE_BREAD` · ngay | **CẦN CODE**: kể chuyện đưa bánh trong khi việc đưa bánh nằm ở `deliver()`; nói lúc tay không là nói dối |
| 2 | "Thi hoài thua hoài mà chú còn đi chú." | **`m.remembers(tuChim) >= 2`** | — | — | **SỬA**: *"thi **hoài** thua **hoài**"* — buộc tội một thói quen ngay lần đầu nghe |
| 2.1 | "Vậy mới đúng chú." → `ref: ket` | (nhánh cha) | — | — | **ĐÚNG** |
| 2.2 | "Chú đi riết vợ chú cằn nhằn chú ha." | (nhánh cha) | — | — | **ĐÚNG** — nhánh cha vừa lộ chuyện vợ chú (*"Con nói y như vợ chú"*), nên **không** phải nhớ nhầm |
| 3 | "Dạ chú đợi chút con làm liền." | — | `t.waiting` | `PROMISE(lam-le)` · 30 s | **SỬA**: hứa nhanh không có mặt trái |
| ket:1 | "Thôi chú vô ca đi, trễ rồi." | — | `w.nearShift(CHU_TU)` | — | **SỬA**: *"trễ rồi"* nói lúc sáu giờ sáng. `sim/schedule.ts` biết giờ vào ca của chú, thoại thì không |
| ket:2 | "Tháng sau chú kể con nghe nữa nghen chú." | — | — | `flag: tuHuaKhao` | **SỬA**: chú đáp *"Tháng sau nó hót được là chú **khao con một chầu**"* — lời hứa của NPC, không cờ nào ghi. Mùa chỉ 40 ngày nên "tháng sau" còn có thể rơi ra ngoài game |

---

### tu.congty — công ty dời qua Bình Dương (14 nút)
`NPC_ONLY · SHORT · day 16–29 · minVisits 6 · initiates 0,25` · có `ignore` ✓

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Rồi chú tính sao hả chú?" | — | — | — | **ĐÚNG** |
| 1.1 | "Năm mươi tám thì kiếm chỗ khác khó hả chú?" | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.1 | "Chú đừng lo. Thế nào cũng có đường chú." | (nhánh cha) | — | — | **ĐÚNG** (`CARED 45`) |
| 1.1.2 | "Chú đi theo đi chú. Còn hơn ở không." | (nhánh cha) | — | `flag: tuKhuyenDiTheo` | **SỬA**: đây là **quyết định lớn nhất đời chú trong mùa này**, và lời khuyên của người chơi không để lại dấu. Chú đáp *"chắc vậy quá"* rồi mai vẫn ghé như chưa có gì |
| 1.1.3 | "Con hổng biết nói sao chú ơi." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.4 | "Vậy thì chú ráng chịu thôi chú." | (nhánh cha) | — | — | **ĐÚNG** (`rel −2`) |
| 1.2 | "Chú làm ở đó lâu chưa chú?" | — | — | — | **ĐÚNG** |
| 1.3 | "Sáng nào chú cũng ghé đây mà chú đi thì con nhớ chú." | `tuNoBanh` ✓ → nên là **`m.visits(10)`** | — | — | **SỬA**: `need` **có chạy**, nhưng **khoá sai chuyện**. `tuNoBanh` bật khi người chơi cho chú một ổ không lấy tiền (`tu.quenvi` 1.1). Câu này nói về **số lần chú ghé**, không phải về một ổ bánh miễn phí — người chơi có thể rất thân với chú mà chưa bao giờ cho chú thiếu một ổ nào |
| 2 | "Bình Dương cũng gần mà chú." | — | — | — | **ĐÚNG** |
| 2.1 | "Chú dậy bốn giờ quen thiệt hả chú?" | (nhánh cha) | — | — | **ĐÚNG** |
| 2.2 | "Vậy chú đi được đó chú." | (nhánh cha) | — | — | **ĐÚNG** |
| 2.3 | "Dạ." (im) | — | — | — | **ĐÚNG** |
| 3 | "Chú nói cảm ơn bà xã chú chưa chú?" | `tuCamOnVo` ✓ | — | — | **ĐÚNG** — mẫu chuẩn: cờ đặt ở `tu.com` 2.1.1, đọc lại ở đây. (Xem §5.2: cờ đang bật **ngay lúc người chơi khuyên**, chứ không phải lúc chú thật sự nói) |
| 4 | "Dạ con đang đông khách chú ơi." | — | `w.queue >= 2` | — | **SỬA**: *"đang đông khách"* nói giữa hẻm trống |

---

### tu.trom — công ty mất xe máy (13 nút)
`NPC_ONLY · SHORT · day 6–29` · opener *"Hồi đêm công ty chú mất cái xe máy."*

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Trời. Rồi người ta có trách chú hông chú?" | — | — | — | **ĐÚNG** |
| 1.1 | "Chú có giữ cái giấy báo hông chú?" | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.1 | "Chú kỹ ghê chú. Vậy là chú thoát rồi." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.2 | "Chú dạy con ghi sổ với chú." | (nhánh cha) | — | `flag: tuDayGhiSo` | **SỬA**: chú dạy thật (*"Ghi ngày giờ, ghi ai nói, ghi mình trả lời gì"*) nhưng không cờ nào ghi. Cô Mai dạy cùng một chuyện **thì có cờ** (`maiDayGhiSo`) — hai nguồn cùng một kỹ năng, một bên có cờ một bên không |
| 1.1.3 | "Vậy mà chú còn lo chi chú." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.2 | "Camera hư mà người ta còn trách chú hả chú?" → `ref: ket` | — | — | — | **ĐÚNG** (`CHUI` vào người thứ ba, đúng chỗ) |
| 1.3 | "Tại chú ngủ gục chớ gì chú." | — | — | — | **ĐÚNG** (`rel −4 · anger 25 · RUDE 55` — câu xóc có giá, và chú vừa kể rõ là chú ngồi ngay cổng, nên đây là **cố ý nói ác**, không phải nói bừa) |
| 2 | "Mất xe là chú phải đền hả chú?" | — | — | — | **ĐÚNG** |
| 2.1 | "Có gì chú nói con nghe với nghen chú." → `ref: ket` | (nhánh cha) | — | `flag: tuKeTiepVuTrom` | **SỬA**: chú đang **chờ công ty họp**. Người chơi xin được nghe kết quả, chú cảm ơn — rồi **không bao giờ có kết quả nào**. Một arc hai nhịp bị bỏ dở ở nhịp một |
| 2.2 | "Chắc hổng sao đâu chú." → `ref: ket` | (nhánh cha) | — | — | **ĐÚNG** |
| 3 | "Dạ." | — | — | — | **ĐÚNG** |
| ket:1 | "Thôi chú ăn đi, hết giờ rồi chú." | `p.holdsFilled` | `w.nearShift(CHU_TU)` | — | **SỬA**: bảo chú ăn khi ổ chưa rời tay; và *"hết giờ rồi"* nói lúc còn sớm |
| ket:2 | "Chú đừng để bụng nghen chú." | — | — | — | **ĐÚNG** |

---

### tu.consu — bé Su hay đứng ngó lồng chim (20 nút)
`NPC_ONLY · SHORT · day 8–29`

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Dạ bé Su đó chú. Nó mê con chim của chú hả chú?" | **`m.remembers(suQuen)`** | — | — | **SỬA**: chú chỉ tả *"con nhỏ mặc đồng phục"*; người chơi **gọi đúng tên bé Su** mà không ai kiểm đã quen con bé chưa |
| 1.1 | "Chú mở vải cho nó coi đi chú." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.1 | "Vậy chú kêu nó đứng xa xa rồi chú mở chú." | (nhánh cha) | — | `flag: tuMoLong` ✓ | **ĐÚNG** — mẫu chuẩn: `rel +4 · CARED 50`, cờ đặt và được `be-su.json` đọc lại. Một câu nói **thay đổi buổi sáng của một đứa khác** |
| 1.1.2 | "Con chim của chú khó tính y chú luôn chú ha." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.3 | "Thi hoài hổng được chắc tại vậy đó chú." | **`m.remembers(tuChim)`** | — | — | **SỬA**: nhắc vụ thi hót — chỉ có trong `tu.chim` (ngày 4+), cuộc này ngày 8+. Không kiểm đã nghe chưa |
| 1.1.4 | "Chim với chả chim. Chú rảnh ghê chú." | (nhánh cha) | — | — | **ĐÚNG** (`rel −4 · anger 25 · RUDE 55`) |
| 1.2 | "Nó hay kể chú nghe chuyện gì hông chú?" → `ref: ket` | — | — | — | **ĐÚNG** |
| 1.3 | "Nó sợ bị bắt đi ôn thi đó chú. Nên nó mới đứng ngó chim." | `suSoThi` ✓ | — | — | **ĐÚNG** — ***mẫu đẹp nhất cả bốn file***: người chơi kể cho chú Tư một chuyện **bé Su đã tâm sự riêng với mình**, và cổng `need` bảo đảm mình **thật sự đã nghe nó** |
| 1.4 | "Chú canh cổng mà chú rành học sinh ghê chú." → `ref: ket` | (nhánh cha) | — | — | **ĐÚNG** |
| 2 | "Dạ nó trễ học là tại chú đó nghen chú." | — | — | — | **ĐÚNG** (opener đã nói rõ *"rồi nó chạy, trễ học hoài"*) |
| 2.1 | "Thì con chim của chú kêu hay quá mà chú." | (nhánh cha) | — | — | **ĐÚNG** |
| 2.1.1 | "Chú rầy con chim. Nghe thương ghê chú." | (nhánh cha) | — | — | **ĐÚNG** (`REMEMBERED_STORY 40`) |
| 2.1.2 | "Mai chú nói nó hót nhỏ nhỏ lại nghen chú." | (nhánh cha) | — | — | **ĐÚNG** (giỡn, không hứa) |
| 2.1.3 | "Dạ con giỡn thôi chú." | (nhánh cha) | — | — | **ĐÚNG** |
| 2.2 | "Chú nói nó đi học đi, đừng đứng nữa chú." → `ref: ket` | (nhánh cha) | — | — | **ĐÚNG** — chú **từ chối** (*"Chú hổng nỡ"*), nên không nợ act |
| 2.3 | "Dạ." (im) | — | — | — | **ĐÚNG** |
| 3 | "Dạ chú vô ca đi chú, trễ rồi." | — | `w.nearShift(CHU_TU)` | — | **SỬA**: *"trễ rồi"* không kiểm giờ |
| ket:1 | "Chú đi kịp ca hông chú? Con gói lẹ nè." | — | `w.nearShift(CHU_TU)` | `PROMISE(goi-le)` · 30 s | **SỬA** |
| ket:2 | "Dạ ổ của chú đây chú." | `p.holdsFilled` | — | `GIVE_BREAD` · ngay | **CẦN CODE** |
| ket:3 | "Dạ." (im) | — | — | — | **ĐÚNG** |

---

### tu.quenvi — chú quên ví ở nhà (18 nút)
`NPC_ONLY · FULL · day 7–29` · opener *"Chết cha. Con ơi… chú để cái ví ở nhà rồi."*

> **Cuộc có nhiều `act` nhất cả bốn file (4/18).** Hai cái đúng, hai cái gắn sai nghĩa — và
> chỗ sai nghĩa là chỗ đắt nhất (T-2).

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Dạ chú cứ lấy đi chú. Bữa nay con hổng lấy tiền chú." `act: FREE_LOAF` ✓ | — | `t.ordering` | `FREE_LOAF` · lúc tính tiền | **ĐÚNG** — ***mẫu chuẩn cho cả bốn file***: một câu tử tế **tốn tiền thật** (`pricedAfterPledge` trả 0), nên nó là một quyết định kinh tế chứ không phải một nút cộng điểm |
| 1.1 | "Một bữa mà chú. Chú ăn sáng rồi đi làm cho khoẻ." | (nhánh cha) | — | `flag: tuNoBanh` ✓ | **ĐÚNG** (đọc lại ở `tu.congty` 1.3 — dù chỗ đọc đang khoá nhầm chuyện, xem `congty` 1.3) |
| 1.1.1 | "Chú nhớ chi cho mệt chú. Ăn đi chú." | `p.holdsFilled` | — | — | **SỬA**: *"ăn đi chú"* khi ổ chưa rời tay |
| 1.1.2 | "Vậy mai chú mua hai ổ bù cho con nghen chú." | (nhánh cha) | — | `flag: tuMaiMuaHai` → **đơn hàng của chú ngày mai = 2 ổ** | **SỬA**: chú gật (*"Mai chú mua hai. Chú ăn một, Sáu Ngón một"*) rồi **mai vẫn mua một ổ như mọi bữa**. `Customer.rollOrder()` có thể đọc cờ này — sửa rẻ, thấy ngay |
| 1.1.3 | "Dạ thôi chú đi đi, trễ ca rồi chú." | — | `w.nearShift(CHU_TU)` | — | **SỬA**: *"trễ ca rồi"* không kiểm giờ |
| 1.2 | "Chú đừng kể ai nghen chú, con sợ người ta cũng quên ví." → `ref: ket` | (nhánh cha) | — | `SUPPRESS_GOSSIP(choBanhMienPhi)` · cả ngày | **CẦN CODE**: *"đừng kể ai"* là một **yêu cầu bịt tin đồn**, và `sim/gossip.ts` + bộ đếm `freebies` **có thật**. Hiện câu này không chặn gì — ai thấy cũng kể, y như không nói |
| 1.3 | "Dạ chú lấy rồi chú đi giùm con, con còn hàng." | — | `w.queue >= 1` | — | **SỬA**: giục chú đi vì "còn hàng" trong khi sau lưng chú không có ai |
| 2 | "Dạ con **ghi sổ, mai chú trả** nghen chú." `need: maiSoNo` ✓ · `act: FREE_LOAF` | `maiSoNo` ✓ · `p.hasSoTay` | — | **`CREDIT_LOAF(CHU_TU, 1 ổ)`** · thu ở lần ghé sau | **CẦN CODE**: ***act gắn sai nghĩa, và sai ngược chiều*** (T-2). `FREE_LOAF` = **không bao giờ thu**; câu nói = **một khoản phải thu**. Phần `need: maiSoNo` thì **đúng mẫu** — người chơi chỉ nghĩ ra chuyện ghi sổ sau khi cô Mai chỉ |
| 2.1 | "Dạ con ghi rồi nè. Chú Tư, bữa nay, một ổ." | `p.hasSoTay` | — | `WRITE_DEBT(CHU_TU, 1 ổ, hôm nay)` | **CẦN CODE**: ghi vào một cuốn sổ không tồn tại (`sim/notebook.ts` có, nhưng nội dung không có cờ nào đọc được là mình đang cầm sổ), cho một món nợ vừa bị `FREE_LOAF` xoá ở nút cha |
| 2.1.1 | "Dạ cô Mai cũng biểu con ghi sổ đó chú." | `maiDayGhiSo` ✓ | — | — | **ĐÚNG** — mẫu chuẩn chéo NPC |
| 2.1.2 | "Chú đàng hoàng ghê chú." | (nhánh cha) | — | — | **ĐÚNG** (`CARED 40`) |
| 2.1.3 | "Mai chú quên nữa là con xoá tên chú đó nghen." | (nhánh cha) | — | — | **ĐÚNG** (giỡn) |
| 2.2 | "Dạ thôi khỏi ghi chú, một ổ hà." → `ref: ket` | (nhánh cha) | — | — | **ĐÚNG** |
| 2.3 | "Dạ." (im) | — | — | — | **ĐÚNG** |
| 3 | "Dạ chú chạy về lấy kịp hông chú?" `act: REFUSE` | — | `w.nearShift(CHU_TU)` | `WALK_ON` · ngay | **SỬA**: act **đúng chiều, sai nhãn**. `REFUSE` ghi log *"chú Tư **bị mời đi**"* và `leave(c, "refused")` — trong khi đây là một câu hỏi nhẹ và chú **tự quyết định về lấy ví**. Chú đáng được đi về bằng chân của chú |
| 4 | "Chú hổng có tiền thì chú đứng đây chi chú." `act: REFUSE` ✓ | — | — | `REFUSE` · ngay | **ĐÚNG** — `rel −6 · anger 50 · RUDE 75`, act đúng nghĩa. Nút nặng nhất file và cũng là nút neo chắc nhất |
| ket:1 | "Mai chú ghé chú đưa con nghen chú." | — | — | `CREDIT_LOAF` thu ở lần ghé sau | **CẦN CODE**: cùng gốc với nút 2 — chú đáp *"Chú hổng quỵt con đâu"* và **không có gì để quỵt** |
| ket:2 | "Chú đi lẹ đi chú, kẻo trễ." | — | `w.nearShift(CHU_TU)` | — | **SỬA** |

---

### tu.com — hộp cơm bà xã gói (18 nút)
`NPC_ONLY · SHORT · day 12–29 · minVisits 5 · initiates 0,2` · có `ignore` ✓
opener *"Con đừng nói ai nghen. Trong cặp chú có hộp cơm bà xã gói."*

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Ủa vậy chú mua bánh mì con chi vậy chú?" | — | — | — | **ĐÚNG** |
| 1.1 | "Chú nói thiệt đi chú. Con hổng cười chú đâu." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.1 | "Vậy chú cứ đứng đi chú. **Hai phút con có mà.**" | (nhánh cha) | `w.queue == 0` | `WAIT_WITH_THEM` · **120 s** giờ bán thật | **CẦN CODE**: ***câu hay nhất file, và là free word đắt nhất file***. `rel +4 · CARED 60` cho việc **cho chú hai phút của mình** — mà hai phút đó **không tốn một giây bán nào**. Chính nút 1.1.3 ngay dưới nói ra cái giá của nó, và cái giá đó cũng không tồn tại |
| 1.1.2 | "Ở công ty chú hổng ai nói chuyện với chú hả chú?" | (nhánh cha) | — | — | **ĐÚNG** (`REMEMBERED_STORY 50`) |
| 1.1.3 | "Chú đứng đây hai phút là con mất một khách đó chú." | — | `w.queue >= 1` | — | **SỬA**: `rel −3 · anger 20 · RUDE 50` cho một câu **nói dối được**: không có ai đứng sau chú thì chẳng mất khách nào. Đây là **mặt kia của 1.1.1** — một cặp lựa chọn rất hay mà **cả hai vế đều không neo** |
| 1.1.4 | "Dạ." (im) | — | — | — | **ĐÚNG** |
| 1.2 | "Dạ hộp cơm bà xã chú gói, chú để nguội uổng lắm chú." → `ref: ket` | (nhánh cha) | — | — | **ĐÚNG** |
| 1.3 | "Vậy bữa nay chú khỏi mua đi chú, để dành tiền." → `ref: ket` | (nhánh cha) | — | — | **ĐÚNG** — chú **từ chối** (*"Thôi. Chú mua. Mua rồi chú mới có cớ đứng."*), nên không nợ act |
| 2 | "Bà xã chú gói cho chú mỗi sáng hả chú?" | — | — | — | **ĐÚNG** |
| 2.1 | "Chú có nói cảm ơn bả lần nào chưa chú?" | (nhánh cha) | — | — | **ĐÚNG** |
| 2.1.1 | "Chú nói thử một lần đi chú. Nghe xa chút cũng được." | (nhánh cha) | — | `flag: tuCamOnVo` ✓ → **nên dời sang lần ghé sau, kèm roll theo tính cách** | **SỬA**: `need` phía đọc (`tu.congty` 3) **đúng mẫu**, nhưng cờ bật **ngay lúc người chơi KHUYÊN**, nên việc chú nói cảm ơn vợ là **chắc chắn xảy ra**. Chú vừa nói rõ *"chú ngượng thấy mồ"* — phải có đường **chú không dám nói**, nếu không thì lời khuyên nào cũng thành công và nó hết là một lời khuyên |
| 2.1.2 | "Vậy chú mua ổ bánh về cho bả đi chú." | (nhánh cha) | `!p.soldOut` | `UPSELL(+1 ổ)` · lúc chốt đơn | **SỬA**: chú gật (*"nghe cũng được đó"*) và **đơn hàng vẫn một ổ**. Đây là câu bán hàng duy nhất trong file — chính chú khen *"Con này bán hàng giỏi ghê"* — mà nó không bán được gì |
| 2.1.3 | "Dạ thôi, chuyện nhà chú con hổng dám nói." | (nhánh cha) | — | — | **ĐÚNG** |
| 2.2 | "Dậy bốn giờ rưỡi cực quá chú." → `ref: ket` | (nhánh cha) | — | — | **ĐÚNG** |
| 2.3 | "Dạ." (im) | — | — | — | **ĐÚNG** |
| 3 | "Chú đem cơm rồi chú còn kể con nghe chi chú." | — | — | — | **ĐÚNG** (`rel −5 · anger 35 · RUDE 60` — có giá thật) |
| ket:1 | "Dạ con kín miệng mà chú." | — | — | `KEEP_SECRET(tuCom)` · cả mùa | **CẦN CODE**: `rel +3` cho một lời hứa giữ bí mật **không ai kiểm được**. `sim/gossip.ts` có thật; phải có đường **bí mật bị lộ** (người chơi kể cho người khác, hoặc có người đứng gần nghe thấy), nếu không thì *"con kín miệng"* chỉ là ba chữ |
| ket:2 | "Dạ ổ của chú đây chú. Chú đi kịp nghen." | `p.holdsFilled` | `w.nearShift(CHU_TU)` | `GIVE_BREAD` · ngay | **CẦN CODE** |

---

### tu.moiloi — người chơi bắt chuyện (3 nút)
`PLAYER_ONLY · SHORT · day 5–29` · opener *"Ờ. Con kêu chú hả."* — **opener này không bao giờ
hiện**: `openTalk()` khi người chơi mở lời trả `talkView("")`

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "**Sáu Ngón** nay có chịu hót hông chú?" | **`m.remembers(tuChim)`** | — | — | **SỬA**: *"Sáu Ngón"* là **tên riêng con chim**, chỉ có trong `tu.chim` (ngày 4+). Cuộc này mở **ngày 5**, không `minVisits` — nên người chơi gọi tên con chim của chú từ ngày thứ năm mà chưa chắc đã nghe |
| 2 | "Đêm qua **cổng công ty** chú yên hông chú?" | **`m.remembers(tuTrom)`** | — | — | **SỬA**: việc chú gác cổng và vụ mất xe chỉ có trong `tu.trom` (ngày **6**+) — tức **ngày 5 câu này chắc chắn là nhớ nhầm**, không phải có thể |
| 3 | "Thôi. Hổng có gì đâu chú." | — | — | — | **ĐÚNG** |

---

### tu.moiloi2 — hỏi thăm ngắn (3 nút)
`PLAYER_ONLY · SHORT · day 13–29 · minVisits 5` · opener **không bao giờ hiện**

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Bữa nay trong cặp chú có **hộp cơm** hông chú?" | **`m.remembers(tuCom)`** | `w.queue == 0` | — | **SỬA**: hai lỗi. (a) hộp cơm chỉ có trong `tu.com` (ngày 12+, minVisits 5) và cuộc này ngày 13+ cùng `minVisits 5` — **cửa sổ chồng nhau**. (b) **đó là một BÍ MẬT chú nhờ mình giữ** — hỏi to giữa quầy lúc có người đứng cạnh phải khác lúc chỉ có hai người. Chú đáp *"Con đừng nói ai nghen"* lần nữa, tức chính lời thoại biết nó là bí mật |
| 2 | "Chú ngủ được mấy tiếng vậy chú? **Bốn giờ** đã dậy rồi." | **`m.remembers(tuDaySom)`** | — | — | **SỬA**: giờ dậy của chú chỉ có trong `tu.com` 2 (ngày 12+) và `tu.congty` 2 (ngày **16**+). Ngày 13–15 là cửa sổ nhớ nhầm |
| 3 | "Thôi chú. Con hỏi cho có." | — | — | — | **ĐÚNG** |

---

## 1. Thống kê

| | số nút |
|---|---|
| **Tổng** | **104** |
| `ĐÚNG` | 68 |
| `SỬA` | 27 |
| `CẦN CODE` | 9 |
| `XOÁ` | 0 |

Bốn con số:

* **0/104 nút có `while`** — file duy nhất trong bốn file không có nút nào.
* **5/104 nút có `need` chạy được** — **nhiều nhất cả bốn file**, và **ba trong số đó đọc cờ
  của NPC KHÁC** (cô Mai × 2, bé Su × 1). Đây là chỗ cả dự án nên lấy làm mẫu.
* **4/104 nút có `act`** — hai đúng nghĩa (`quenvi` 1 `FREE_LOAF` · `quenvi` 4 `REFUSE`), hai
  **gắn sai nghĩa** (`quenvi` 2 `FREE_LOAF` cho một món **nợ**; `quenvi` 3 `REFUSE` cho một
  câu hỏi nhẹ, ghi log *"bị mời đi"*).
* **3 nút đặt `flag`** (`tuMoLong`, `tuNoBanh`, `tuCamOnVo`) — cả ba đều được đọc lại ở nơi
  khác. Tỉ lệ cờ **được dùng** cao nhất cả bốn file.

Tỉ lệ `CẦN CODE` thấp nhất (8,7%) vì chú Tư hầu như **không đòi hỏi vật gì**: chú không có
gánh, không có áo mưa, không đổi chác. Cái chú cần là **hai phút đứng nói chuyện** — và đúng
cái đó là free word.

---

## 2. Đề xuất khoá mới

| khoá | vì sao cần | nút nào đòi |
|---|---|---|
| `m.remembers(E)` **chạy được** | bảy nút nhắc lại chuyện người chơi chưa chắc đã nghe — trong đó **hai nút chắc chắn sai** (`moiloi` 2 mở ngày 5 nhưng nguồn mở ngày 6; `moiloi2` 2 mở ngày 13 nhưng nguồn mở ngày 16) | moiloi 1 · 2 · moiloi2 1 · 2 · consu 1 · 1.1.3 · chim 2 |
| `m.visits(N)` ở **cấp nút** | `congty` 1.3 (*"sáng nào chú cũng ghé"*) đang mượn tạm cờ `tuNoBanh` — khoá sai chuyện. `TalkWhen.minVisits` chỉ khoá được **cả cuộc** | congty 1.3 |
| `w.nearShift(NPC)` | **tám nút** nói *"trễ rồi"* · *"hết giờ rồi"* · *"trễ ca rồi"* · *"đi kịp nghen"*. `sim/schedule.ts` **biết giờ vào ca của chú**, thoại thì không — nên câu nào cũng nổ được lúc sáu giờ sáng | chim ket:1 · trom ket:1 · consu 3 · ket:1 · quenvi 1.1.3 · 3 · ket:2 · com ket:2 |
| `p.hasSoTay` | hai nút ghi sổ nợ; `sim/notebook.ts` có, cờ đọc được thì không | quenvi 2 · 2.1 |
| `w.queue == 0` | *"hai phút con có mà"* chỉ đúng khi **thật sự rảnh**; `w.queue >= N` chỉ chặn được chiều ngược | com 1.1.1 · moiloi2 1 |
| `TalkWhen.weekday` **dùng cho `tu.chim`** | không phải khoá mới — **trường đã có** và cuộc này không dùng, nên *"chủ nhật rồi"* nói được vào thứ tư | chim (cấp cuộc) |

---

## 3. Hành động cần code

| hành động | câu nào đòi | thời lượng đề xuất | thiếu gì trong game |
|---|---|---|---|
| **`need` đi qua `holds()`** | 7 nút `m.remembers(...)` + 2 nút `p.hasSoTay` + `congty` 1.3 | — | `visibleOptions()` vẫn chỉ tra `gate.flags`. **Việc đầu tiên.** Kèm: `tu.chim` 1 và `tu.trom` 1 phải **đặt cờ** thì `tu.moiloi` mới có gì để đọc |
| **`CREDIT_LOAF` — sổ nợ khách** | quenvi 2 · 2.1 · ket:1 | thu ở **lần ghé sau** | ***chỗ đắt nhất file***. Hiện dùng `FREE_LOAF` — **ngược chiều kinh tế**. Cần: một khoản phải thu gắn vào `memKey`, một dòng trong sổ tay, và hai đường ra ở lần ghé sau (**chú trả** / **chú quên**). `sim/obligations.ts` lo nghĩa vụ của *người chơi*, không có chiều khách nợ mình |
| `GIVE_BREAD` | chim 1.4 · consu ket:2 · com ket:2 | ngay | ổ phải rời `player.hand`; thoại không với tới `deliver()` |
| `WAIT_WITH_THEM` | com 1.1.1 | **120 s** giờ bán thật (`clock.busy`) | *"hai phút con có mà"* — câu tử tế nhất file, và nó **miễn phí**. Chính nút anh em của nó (1.1.3) nói ra cái giá, nên cặp lựa chọn này chỉ thành một lựa chọn thật khi hai phút kia tốn thật |
| `KEEP_SECRET` / `SUPPRESS_GOSSIP` | com ket:1 (giữ bí mật hộp cơm) · quenvi 1.2 (*"đừng kể ai"* vụ cho bánh) | cả ngày / cả mùa | `sim/gossip.ts` và bộ đếm `freebies` **có thật**. Thiếu đường **lộ bí mật** — không có đường lộ thì lời hứa giữ kín chỉ là ba chữ |
| `UPSELL(+1 ổ)` | com 2.1.2 | lúc chốt đơn | chú gật mua thêm một ổ cho vợ, đơn hàng không đổi. `Customer.rollOrder()` / `c.more` có sẵn chỗ nhận |
| `flag → đơn hàng ngày mai` | quenvi 1.1.2 (*"mai chú mua hai ổ"*) | ngày hôm sau | cần `rollOrder()` đọc được cờ chuyện. Sửa rẻ, người chơi **thấy ngay sáng hôm sau** |
| `WALK_ON` (thay `REFUSE` gắn sai) | quenvi 3 | ngay | `REFUSE` ghi log *"bị mời đi"* và `leave(c, "refused")` — sai hẳn sắc thái cho một câu hỏi nhẹ |
| **`flag` cho lời hứa của NPC** | chim ket:2 (*"chú khao con một chầu"*) · trom 2.1 (kết quả cuộc họp) · congty 1.1.2 (chú quyết đi hay ở) · trom 1.1.2 (chú dạy ghi sổ) | ngày hôm sau / nhiều ngày | bốn arc hai nhịp **bị bỏ dở ở nhịp một**. Chú hứa, chú chờ họp, chú sắp quyết — rồi mai ghé lại như chưa có gì |
| **`forSec`** | mọi act có thời lượng ở trên | — | `TalkAct` không có trường thời lượng |

---

## 4. §4.1 — chia `need` / `while` theo TĨNH hay ĐỘNG

> `?` là lưới an toàn, không phải đường đi chính. Mốc: dưới 5% số nhịp kết bằng `?`.

| nhóm | khoá trong file này | xếp | vì sao |
|---|---|---|---|
| **TĨNH → `need`** | `p.holdsFilled` · `p.hasSoTay` · `m.remembers(X)` · `m.visits(N)` · cờ chuyện (`maiSoNo`, `maiDayGhiSo`, `suSoThi`, `tuCamOnVo`, `tuNoBanh`) | **18 nút** | tay người chơi và sổ quá khứ đứng yên suốt lúc thẻ mở |
| **ĐỘNG → `while`** | `t.ordering` · `t.waiting` · `w.queue(N)` · `w.queue == 0` · `w.nearShift(CHU_TU)` · `!p.soldOut` | **16 nút** | đồng hồ vẫn chạy: giờ vào ca của chú tới gần **trong lúc đang đọc**, hàng dài ra, hết bánh |

**Ba chỗ dễ xếp nhầm:**

1. **`w.nearShift(CHU_TU)` là ĐỘNG, và đây là chỗ `?` **đáng** xảy ra nhất cả bốn file.**
   Chú sắp trễ ca là một cái đồng hồ **đang chạy**. Đọc ba dòng lựa chọn mất 8–12 giây game,
   và câu *"chú đi kịp ca hông chú"* **vừa nãy còn đúng, giờ hết đúng** — đúng nguyên văn ví
   dụ §4.1. Để `while`, ra `?`.
2. **Cờ chuyện là TĨNH** ⇒ `need`, ẩn hẳn. Năm nút đang làm đúng rồi (`quenvi` 2 · 2.1.1 ·
   `consu` 1.3 · `congty` 1.3 · 3) — giữ nguyên cách đó.
3. **`w.queue == 0` ở `com` 1.1.1 là ĐỘNG.** Nếu có người bước vào hàng đúng lúc người chơi
   đang đọc, thì *"hai phút con có mà"* phải ra `?` — và đó là một khoảnh khắc **rất đúng với
   câu chuyện**: cái hai phút của chú Tư là thứ **lúc nào cũng có thể bị ai đó lấy mất**.

**Rủi ro `?` quá 5%:** `tu.moiloi` và `tu.moiloi2` có 4/6 nút cần `m.remembers(X)`. Chúng là
**TĨNH** ⇒ `need`, ẩn hẳn — không đẩy tỉ lệ `?` lên. Nhưng phải kiểm: ẩn hết thì `moiloi`
chỉ còn nút 3 (`LANH`), và `trimKeepingExit()` giữ được đường ra. Đúng luật 3 của `talk.ts`.

---

## 5. §4bis — LỜI HỨA CÓ HẠN

> *"Nếu đi rót trà mà họ không rót, bắt người ta đợi, thì họ cũng bỏ đi hay ít nhất chửi rồi bỏ đi."*

Chú Tư `nongTinh` thấp và **`FORBIDDEN_SELF` cấm chú xưng "tao"** — chú là người hiền, không
chửi. Theo §4bis chú thuộc nhóm **"nhắc hai lần, rồi thôi, nhưng VẪN NHỚ"**. Với chú, nấc ba
không phải là bỏ đi mà là **thôi kể chuyện** — chú rút về làm một người khách im lặng, và đó
là mất mát nặng hơn.

### 5.1. Hứa LÀM NGAY TẠI CHỖ — hạn tính bằng giây thật

| nút | hứa gì | hạn | giữ lời | **NUỐT LỜI** |
|---|---|---|---|---|
| `com` 1.1.1 | ***"hai phút con có mà"*** — cho chú hai phút đứng nói chuyện | **120 s** giờ bán thật | `WAIT_WITH_THEM` chạy đủ 120 s → `CARED 60` như đang khai | bỏ đi làm việc khác giữa chừng: chú **không nói gì**, chú đi vô ca. Nấc hai: lần ghé sau chú **không mở lời nữa** (`initiates` về 0 một ngày). Đây là nấc ba của một người hiền |
| `chim` 3 · `consu` ket:1 · `quenvi` 1.1.3 | *"con làm liền / gói lẹ nè"* | **30 s** | `calm 15–18` giữ nguyên | quá 30 s: `calm` vừa ăn **bị thu lại**; chú trễ ca thật thì `anger` nhẹ + chú đi |
| `chim` 1.4 · `consu` ket:2 · `com` ket:2 | *"ổ của chú đây chú"* | **ngay** | `GIVE_BREAD` | tay không mà nói: phải **ẩn hẳn** (`need: p.holdsFilled`) — không phải hứa, mà là một câu không được phép nói |
| `trom` ket:1 · `quenvi` 1.1.1 | *"chú ăn đi"* | **ngay** | — | như trên: `need: p.holdsFilled` |

### 5.2. Hứa CHO NGÀY KHÁC — kiểm ở lần ghé sau (phần nặng nhất của chú Tư)

**Bảy lời hứa, không cái nào có hạn.** Bốn cái là **chú hứa với mình** — và đó mới là chỗ
đau: chú là người *"chú nghèo mà chú hổng thiếu ai"*, nên một lời hứa chú nuốt phải là một
chuyện lớn, không phải một dòng chữ rơi xuống đất.

| nút | ai hứa | hứa gì | kiểm khi nào | giữ lời | **NUỐT LỜI** |
|---|---|---|---|---|---|
| `quenvi` 2 · ket:1 | **người chơi ghi nợ** | *"con ghi sổ, mai chú trả"* | **lần ghé sau của chú** | chú đưa tiền → `rel +`, và cuốn sổ của cô Mai hoá ra có ích | **hai đường**: chú quên (chú vừa tự nhận *"chú hay quên"*) → người chơi **đòi hay tha**; hoặc người chơi quên ghi → mất tiền thật, không ai nhắc |
| `quenvi` 1.1.2 | **chú** | *"mai chú mua hai ổ, chú ăn một, Sáu Ngón một"* | ngày mai | `rollOrder()` đọc `tuMaiMuaHai` → chú mua 2 ổ, **người chơi thấy bằng mắt** | chú mua một ổ như cũ → người chơi nhắc được, chú ngượng. Hiện **mặc định là nuốt lời, và không ai biết** |
| `chim` ket:2 | **chú** | *"tháng sau nó hót được là chú khao con một chầu"* | ~ngày +30 | một cảnh khao thật | mùa chỉ 40 ngày — nếu hứa sau ngày 10 thì **không bao giờ tới hạn**. Phải đổi mốc, hoặc đổi lời |
| `trom` 2.1 | **chú** | *"có gì chú nói con nghe"* (kết quả cuộc họp) | **ngày +2 … +5** | một cuộc `tu.trom2` trả lời: chú bị đền, hay chú thoát | chú không bao giờ kể → người chơi hỏi lại được, và chú đáp *"ờ… chú quên nói"* — vẫn phải là một câu có thật |
| `congty` 1.1.2 | **chú** | *"chắc vậy quá"* (chú theo công ty qua Bình Dương) | **cuối mùa** | arc kết: chú đi, hay chú ở | hiện không có kết nào. Lời khuyên lớn nhất người chơi cho chú **không đi tới đâu** |
| `com` 2.1.1 | **chú** | chú sẽ nói cảm ơn vợ | **lần ghé sau** | `congty` 3 đã viết sẵn câu trả lời ✓ (*"Nói rồi. Bả hỏi chú bị gì."*) | **chưa có đường chú KHÔNG DÁM nói** — mà chú vừa tự nói *"chú ngượng thấy mồ"*. Cờ đang bật ngay lúc **khuyên**, phải dời sang lúc **chú làm**, kèm một roll theo tính cách |
| `trom` 1.1.2 | **chú** | chú dạy người chơi ghi sổ | lần ghé sau | cần `flag: tuDayGhiSo` (cô Mai có cờ cho đúng việc này) | — |

### 5.3. Phải NHÌN THẤY được lúc đang treo (CANON T5)

Ba thứ phải hiện ra:

* **Món nợ một ổ bánh của chú** (`quenvi` 2) — một dòng trong sổ tay. Phạt người chơi vì quên
  đòi, khi game chưa bao giờ nhắc, là phạt trí nhớ chứ không phải phạt lựa chọn.
* **Cái hẹn "mai chú mua hai ổ"** — người chơi phải nhớ được để mà hụt hẫng nếu chú quên.
* **Lời hứa giữ bí mật hộp cơm** (`com` ket:1) — phải biết mình đang giữ một bí mật thì việc
  lỡ miệng mới là một lựa chọn.

---

## 6. §4ter — TRÍ NHỚ BỐN TẦNG

| tầng | khoá | hiện trạng |
|---|---|---|
| **trong cuộc** `c.*` | `c.angered` · `c.saidTone(X)` | code nuôi thật, **0/104 nút đọc**. File này **không vi phạm §3.3**: cả năm nút nặng (`chim` 1.1.4 · `trom` 1.3 · `consu` 1.1.4 · `quenvi` 4 · `com` 3) đều `silent` và **không có `then`**; `com` 1.1.3 (`anger 20`) cũng kết nhánh. Sạch nhờ hình dạng cây |
| **trong lượt ghé** `v.*` | `v.promised(X)` · `v.toldSecret` | **không tồn tại**. Cần cho §5.1 và cho chuyện bí mật hộp cơm |
| **trong ngày** `d.*` | `d.metToday` · `d.toldMe(X)` | **không tồn tại** |
| **cả mùa** `m.*` | `m.visits(N)` · `m.tier(X)` · `m.remembers(E)` | `mem.visits` / `mem.tier` / `record()` **có đủ**; `TalkWhen.minVisits` dùng được ở cấp cuộc (`congty` và `com` dùng đúng). **Cấp nút không có đường nào** — và `congty` 1.3 đang **mượn tạm một cờ chuyện làm khoá thân sơ**, đúng cái lỗ đó |

### Luật cứng — câu giả định "lần đầu gặp"

File này **không có nút nào** giả định lần đầu gặp. Mọi cuộc khoá `day >= 4`, hai cuộc khoá
thêm `minVisits 5–6`. **Sạch.**

### Luật cứng — câu NHẮC LẠI một chuyện

*Nhớ nhầm một chuyện chưa từng xảy ra là lỗi nặng hơn quên.* **Bảy nút phạm — và hai trong
số đó KHÔNG PHẢI "có thể", mà là CHẮC CHẮN**, vì cửa sổ ngày của cuộc nhắc lại **mở trước**
cuộc kể chuyện:

| nút | nhắc lại chuyện gì | nguồn duy nhất | cửa sổ | phải khai |
|---|---|---|---|---|
| `moiloi` 2 | *"cổng công ty"* — chú gác cổng, vụ mất xe | `tu.trom` (ngày **6**) | cuộc mở ngày **5** ⇒ **ngày 5 là nhớ nhầm chắc chắn** | `need: "m.remembers(tuTrom)"` |
| `moiloi2` 2 | chú dậy lúc bốn giờ | `tu.congty` 2 (ngày **16**) / `tu.com` 2 (ngày 12) | cuộc mở ngày **13** ⇒ **ngày 13–15 nếu chưa nghe `tu.com`** | `need: "m.remembers(tuDaySom)"` |
| `moiloi` 1 | **"Sáu Ngón"** — tên riêng con chim | `tu.chim` (ngày 4) | cuộc mở ngày 5, **không `minVisits`** | `need: "m.remembers(tuChim)"` |
| `moiloi2` 1 | **hộp cơm — một BÍ MẬT** | `tu.com` (ngày 12, minVisits 5) | cuộc mở ngày 13, cùng `minVisits 5` ⇒ chồng cửa sổ | `need: "m.remembers(tuCom)"` **+** `while: w.queue == 0` (hỏi to về bí mật của người ta trước mặt khách khác phải khác) |
| `consu` 1 | gọi đích danh **"bé Su"** từ *"con nhỏ mặc đồng phục"* | quen bé Su | ngày 8 trở đi | `need: "m.remembers(suQuen)"` |
| `consu` 1.1.3 | vụ thi hót | `tu.chim` (ngày 4) | ngày 8 trở đi | `need: "m.remembers(tuChim)"` |
| `chim` 2 | *"thi **hoài** thua **hoài**"* | đã nghe ≥ 2 lần | ngay lần đầu | `need: "m.remembers(tuChim) >= 2"` |

**Chặn ở đầu nguồn cũng thiếu:** `tu.chim`, `tu.trom`, `tu.com` — **không cuộc nào đặt cờ**
cho chính chuyện mình vừa kể. Ba cuộc `PLAYER_ONLY` phía sau lại gọi tên chúng rất cụ thể.
Phải sửa **cả hai đầu**.

**Và một điểm sáng để đối chiếu:** `tu.consu` 1.3 (*"nó sợ bị bắt đi ôn thi đó chú"*) làm
**đúng hệt** việc này — nó đọc `suSoThi`, một cờ do **bé Su** đặt khi con bé tâm sự với người
chơi. Bảy nút ở bảng trên chỉ cần làm giống nút đó.
