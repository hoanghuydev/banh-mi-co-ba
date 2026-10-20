# Rà thoại — CHÚ KIỆT (`src/content/talks/chu-kiet.json`)

> ## ⚡ REVAMP 2026-10-20 — ☠️ CHẾT TOÀN BỘ
> Rà thoại theo giọng cũ + hệ trí nhớ/quan hệ đã chết. Toàn bộ thoại viết lại giọng Nam gen Z ở R6 (CANON §9, §17.1). Chỉ giữ để truy vết nội dung cũ.

**Hợp đồng:** `docs/phase-2-he-npc/P2-07-neo-thoai-vao-the-gioi.md` (đã gồm §4.1 · §4bis ·
§4ter) · **9 cuộc · 119 nút**
**Từ vựng:** chỉ §3. Khoá nào thiếu thì nằm ở mục *Đề xuất khoá mới* cuối file.

**Trạng thái đo được ở file này:** `act` **1 lần** (`STEP_ASIDE` ở `kiet.mua` 4.3),
`needEquip` **0 lần**, `needCash` **0 lần**, `while` **0 lần**, `forSec` **0 lần**,
`flag` **6 lần**, `need` **5 lần**. Tức **118/119 nút nói xong thế giới không đổi gì**
ngoài `rel`/`flag` — tỉ lệ `act` thấp nhất trong năm file được giao.

**Tính cách (quyết định nấc phạt §4bis):** `soi 0.7 · nongTinh 0.6 · **deTha 0.3** ·
thanThien 0.4 · patience 45`. Chú là **người khó tha nhất trong năm người này**, kiên
nhẫn thấp nhất ⇒ theo §4bis, chú **bỏ nấc một**: không nhắc, **nói nặng một câu rồi đi
luôn**. Và chú **nhớ lâu** (`deTha 0.3`).

**Bốn luật đọc dùng cho cả file:**
1. *Xã giao thuần không phải free word.* Chú Kiệt là một cây chuyện đời rất dày — phần
   lớn 119 nút là hỏi tiếp một mạch chuyện, và được chấm `ĐÚNG`.
2. *Câu hứa một việc làm* mà hệ chưa có `does` cho nó ⇒ `CẦN CODE`.
3. **§4.1 — `need` hay `while`:** tĩnh (`needEquip`, `m.remembers`, `p.price`) ⇒
   **`need`**. Động (`w.queue`, `w.shadeFree`, `w.rain`, `t.blocking`) ⇒ **`while`**.
4. **Riêng của người này:** chú Kiệt là **một cái XE ĐẨY**, không phải một người đứng.
   Mọi câu bảo chú *đẩy xe vô*, *kéo xe sát vô*, *đẩy xe đi* là câu bảo **một vật thể
   trong cảnh di chuyển** — mà trong `world/map.ts` **không có xe của chú Kiệt**. Đây là
   cụm `CẦN CODE` lớn nhất file.

---

### kiet.lo — lò mày nóng chưa (SHORT · NPC_ONLY · day 5–40 · w13)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1.1 | "Dạ nóng rồi chú. Chú ngó chi vậy chú?" | — | **thiếu** `w.ovenHot` (khoá mới) | — | **SỬA** — khẳng định lò nóng trong khi lò có thể **chưa nhen than**; cả cuộc nói về một trạng thái lò **thật** mà không đọc nó |
| 1.1.1 | "Chú lo gì mà lo chú?" | — | — | — | ĐÚNG |
| 1.1.1.1 | "Chú nói thiệt vậy con nể chú đó." | — | — | — | ĐÚNG |
| 1.1.1.2 | "Hẻm này đủ chỗ cho hai xe mà chú." | — | — | — | ĐÚNG |
| 1.1.1.3 | "Vậy chú ráng lo đi chú." | — | — | — | ĐÚNG |
| 1.1.1.4 | "Chú rảnh thì về đẩy xe chú đi." (GAT · `rel −5` · `anger 40` · lá cuối) | — | — | **thiếu** `WALK_ON · ngay` (hoặc `MOVE_CART`) | **CẦN CODE** — đuổi chú về mà chú **vẫn đứng y chỗ cũ**; với `deTha 0.3` thì đây đúng là câu chú phải bỏ đi thật |
| 1.1.2 | "Chú coi giùm con luôn đi chú." | — | — | — | ĐÚNG |
| 1.1.3 | "Dạ." (LANH · silent) | — | — | — | ĐÚNG |
| 1.2 | "Dạ con nướng chưa tới chú à." | — | **thiếu** `!w.ovenHot` | — | **SỬA** — **ngược hẳn với 1.1** ("nóng rồi") mà hai câu **cùng hiện một nhịp**, không khoá nào tách. Người chơi chọn cái nào cũng có thể nói dối về chính cái lò của mình |
| 1.2.1 | "Chú chỉ con cách canh lò với chú." | — | — | — | ĐÚNG |
| 1.2.1.1 | "Dạ con cảm ơn chú." | — | — | `flag: kietChiLo` ✓ (dùng ở `when.needFlag` của `kiet.gundam`) | ĐÚNG — khuôn mẫu đúng: một câu cảm ơn **mở khoá cả một cuộc sâu về sau** |
| 1.2.1.2 | "Chú chỉ con chi vậy chú? Con là đối thủ mà." | — | — | — | ĐÚNG |
| 1.2.1.3 | "Chú nói vậy chớ chú gạt con hả." (GAT · lá cuối) | — | — | — | ĐÚNG |
| 1.2.2 | "Dạ con biết rồi chú." | — | — | — | ĐÚNG |
| 1.3 | "…" (IM) | — | — | — | ĐÚNG — reply "Tao cũng có hỏi đâu" đáp đúng cái im lặng |

### kiet.gia — mày bán hai lăm hả (SHORT · NPC_ONLY · day 8–40 · w12)

> **Lỗi cả cuộc:** `opener` khai cứng *"Mày bán hai lăm hả? Tao bán mười lăm đó."* — giá
> bán là một **biến người chơi điều khiển** (`sim/econ`). Nếu người chơi đang bán 20k hay
> 30k thì câu mở lời **sai ngay từ chữ đầu**. Cần `when` đọc giá thật (`p.price == 25`).

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| S:ket.1 | "Dạ chú đẩy xe đi chú, trễ rồi." | — | — | **thiếu** `MOVE_CART` / `WALK_ON · ngay` | **CẦN CODE** — tiễn chú đi, chú đứng nguyên |
| S:ket.2 | "Mai gặp chú nghen chú." | — | — | **thiếu** `WALK_ON · ngay` | **CẦN CODE** |
| 2.1 | "Dạ bánh con nhiều nhân hơn chú." | **thiếu** một khoá đọc **công thức kẹp thật** (`p.fillLevel`, khoá mới) | — | — | **SỬA** — khoe "nhiều nhân hơn" mà không đọc ổ mình đang kẹp; người chơi kẹp ít nhân vẫn nói câu này được |
| 2.1.1 | "Dạ cũng đủ sống chú." | — | — | — | ĐÚNG |
| 2.1.1.1 | "Dạ con hổng muốn nói chú à." | — | — | — | ĐÚNG |
| 2.1.1.2 | "Chú bán nhiêu ổ mà chú hỏi con?" | — | — | — | ĐÚNG |
| 2.1.1.3 | "Dạ bảy chục ổ chú." | **thiếu** `p.soldToday >= 70` (khoá mới) | — | — | **SỬA** — khai một **con số doanh thu game biết chính xác**, không đối chiếu: nói "bảy chục ổ" lúc mới bán được bốn ổ. Và reply *"Tao hỏi số, mày trả lời chữ"* cho thấy người viết biết con số này quan trọng |
| 2.1.1.4 | "Chuyện của con, mắc gì chú hỏi." (GAT · lá cuối) | — | — | — | ĐÚNG |
| 2.1.2 | "Chú bán mười lăm mà chú lời nổi hả chú?" | — | — | — | ĐÚNG |
| 2.1.3 | "Dạ." (LANH · silent) | — | — | — | ĐÚNG |
| 2.2 | "Chú bán rẻ vậy chú sống sao chú?" | — | — | — | ĐÚNG |
| 2.2.1 | "Vậy là hai xe hổng đụng nhau chú ha." | — | — | — | ĐÚNG |
| 2.2.2 | "Thợ hồ ăn no mới quan trọng chú ha." | — | — | — | ĐÚNG |
| 2.2.3 | "Dạ." (LANH · silent) | — | — | — | ĐÚNG |
| 2.3 | "Chú có nghe tui rao hồi sáng hông chú?" | `sauRaoThu` ✓ | — | — | ĐÚNG — **khuôn mẫu đúng của §4ter**: chỉ hỏi được khi mình đã thật sự tập rao với bà Sáu |
| 2.4 | "Chú qua đây dò giá con hả chú." (GAT · lá cuối) | — | — | — | ĐÚNG |

### kiet.bienhieu — ai viết cái bảng hiệu (FULL · NPC_ONLY · day 12–40 · w12)

> **Lỗi cả cuộc — loại nặng nhất của P2-06 §2.17:** `opener` là *"Cái bảng hiệu xe mày.
> Chữ đỏ viền vàng đó. Ai viết?"* Nhưng `BANG_HIEU` là **thiết bị phải mua**: 750k, mở từ
> **ngày 14**, và **không nằm trong `CART.start`** (`src/content/econ/equipment.json`).
> Cuộc này chạy từ **ngày 12** — tức nó có thể nổ ra **trước ngày người chơi được phép
> mua**. Cả một cuộc `FULL` 20 nút nói về một vật **không có trên cái xe**.
> **Sửa một dòng:** thêm `when.needEquip: "BANG_HIEU"`.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| S:ket.1 | "Chú đẩy xe đi chú, trễ rồi chú." | — | — | **thiếu** `MOVE_CART` / `WALK_ON · ngay` | **CẦN CODE** |
| S:ket.2 | "Mai gặp chú nghen chú." | — | — | **thiếu** `WALK_ON · ngay` | **CẦN CODE** |
| 3.1 | "Dạ chú Hải viết đó chú. Hồi xưa chú viết bảng hiệu mướn." | **thiếu** `needEquip: BANG_HIEU` · **thiếu** `m.remembers(haiVeBang)` | — | — | **SỬA** — hai lỗi: nói về cái bảng chưa mua (xem khối trên), và khai lai lịch chú Hải mà **có thể chưa nghe ai kể** |
| 3.1.1 | "Chú rành chữ nghĩa ghê chú." | — | — | — | ĐÚNG |
| 3.1.1.1 | "Chú muốn có cái bảng cho xe chú hả chú?" | — | — | `flag: kietMuonBang` ✓ (đọc ở `ong-hai.json:hai.pano`) | ĐÚNG |
| 3.1.1.1.1 | "Để tui nói chú Hải một tiếng giùm chú nghen chú." | — | — | `flag: kietNhoNoi` ✓ (đọc ở `ong-hai.json:hai.pano`) | ĐÚNG — **khuôn mẫu đúng nhất của cả file**: một lời hứa *"nói giùm"* mà **cuộc của chú Hải thật sự nhận lấy**. `rel +4` + ký ức 55 được trả cho một chuyện có hậu quả thật |
| 3.1.1.1.2 | "Chú qua hỏi chú đi chú. Chú đâu có ăn thịt chú." | — | — | — | ĐÚNG |
| 3.1.1.1.3 | "Bảng in rẻ hơn mà chú. Chú tiếc tiền chi." | — | — | — | ĐÚNG |
| 3.1.1.2 | "Chú ngó cái bảng chớ hổng phải ngó cái lò hả chú." | — | — | — | ĐÚNG |
| 3.1.1.3 | "Chú ngó hoài vậy tui bán hổng được chú ơi." (GAT · lá cuối) | **thiếu** `t.blocking` (khoá mới) | **thiếu** `w.queue >= 1` | **thiếu** `STEP_ASIDE` (**ĐÃ CÓ CODE**) | **SỬA** — trách chú cản việc bán **lúc không có ai mua**, và chú **không dạt đi** |
| 3.1.2 | "Chú thích cái bảng đó hả chú?" | **thiếu** `needEquip: BANG_HIEU` | — | — | **SỬA** |
| 3.1.3 | "Dạ." (LANH · silent) | — | — | — | ĐÚNG |
| 3.2 | "Dạ cái bảng đó của cô Ba để lại chú." | **thiếu** `needEquip: BANG_HIEU` | — | — | **SỬA** — và nó **MÂU THUẪN với 3.1** ("chú Hải viết"): **hai lai lịch khác hẳn nhau cho cùng một cái bảng, cùng một nhịp, không khoá nào tách**. Người chơi tự chọn quá khứ của chính mình |
| 3.2.1 | "Chú nói nghe chí lý ghê chú." | — | — | — | ĐÚNG |
| 3.2.1.1 | "Vậy xe chú nên có một cái bảng đàng hoàng chú." | — | — | `flag: kietMuonBang` ✓ | ĐÚNG |
| 3.2.1.2 | "Mười năm mà chú còn đứng ngó xe người ta hả chú." | — | — | — | ĐÚNG |
| 3.2.1.3 | "Dạ." (LANH · silent) | — | — | — | ĐÚNG |
| 3.2.2 | "Chú nhớ mặt khách hông chú?" | — | — | — | ĐÚNG |
| 3.2.3 | "Dạ tui hổng rành mấy cái đó chú." | — | — | — | ĐÚNG |
| 3.3 | "…" (IM) | — | — | — | ĐÚNG |

### kiet.mua — mưa vầy mà mày mở hàng hả (FULL · NPC_ONLY · day 6–40 · `when.rain: true` · w13)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| S:diyen.1 | "Chú đứng tới chừng nào tạnh cũng được chú." | — | **thiếu** `w.rain` + `w.shadeFree` *(động)* | **thiếu** `STAND_IN_SHADE (trú) · tới khi tạnh` → `LEAVE_SHADE` | **CẦN CODE** — `rel +3` · `calm 26` · ký ức 50 cho một chỗ trú **không có trên bản đồ** |
| S:diyen.2 | "Chú kéo xe sát vô đây đi chú." | — | **thiếu** `w.shadeFree` + chỗ trống **cho cả cái xe** | **thiếu** `MOVE_CART · tới khi tạnh` (khoá mới) | **CẦN CODE** — câu bảo **một cái xe đẩy di chuyển**. `world/map.ts` không có xe của chú Kiệt, không có mái, không có ô nào kéo vô được |
| S:diyen.3 | "Dạ." (LANH · silent) | — | — | — | ĐÚNG |
| 4.1 | "Chú đẩy xe vô dưới mái này đi chú. Rộng mà chú." | — | `w.rain` ✓ (ở `when`) · **thiếu** `w.shadeFree` | **thiếu** `MOVE_CART · tới khi tạnh` | **CẦN CODE** — *"cái mái này"* **không tồn tại**: `src/world/map.ts` (26×17) không có ký tự mái nào, và `DU_CHE` chỉ là một hình vẽ ở `StallScene.ts:3071` |
| 4.1.1 | "Chú che tay chớ bánh chú ai che chú." | — | — | — | ĐÚNG |
| 4.1.1.1 | "Kỳ gì chú. Hai cái xe đứng chung một cái mái thôi mà chú." | — | **thiếu** `w.shadeFree` | **thiếu** `MOVE_CART · tới khi tạnh` → về chỗ cũ | **CẦN CODE** — ⚠ **free word nặng nhất năm file**: `rel +4` + ký ức `CARED_FOR_THEM 60` + cờ `kietDungChung`, và reply nói **thẳng ra** là *"Thôi. Tao đẩy vô. Mưa tạnh tao đi liền nghen."* — một câu mô tả chính xác một chuyển động mà **không có gì nhúc nhích**. Với một người `deTha 0.3`, đây là lần mềm lòng duy nhất của chú — và nó xảy ra trong tưởng tượng |
| 4.1.1.2 | "Chú sợ người ta nói chú qua xin xỏ tui hả chú?" | — | — | — | ĐÚNG |
| 4.1.1.2.1 | "Vậy tui đứng qua xe chú, chú đứng bên này. Huề." | **thiếu** `p.onStreet` | — | **thiếu** `MOVE_CART` + **người chơi rời quầy** | **CẦN CODE** — hứa **đổi chỗ đứng với một người bán khác giữa buổi bán**; thế giới không có cửa đó, và không ai đổi |
| 4.1.1.2.2 | "Chú muốn ướt thì chú ướt chú." | — | — | — | ĐÚNG |
| 4.1.1.3 | "Chú hổng vô thì thôi chú. Tui mời một lần hà." | — | — | — | ĐÚNG — lời rút lại, không hứa gì |
| 4.1.2 | "Dạ chú lấy cái bạt này che tạm đi chú." | **thiếu** một cổng đạo cụ cho **tấm bạt** | — | **thiếu** `LEND_TARP · tới chiều` (khoá mới) | **CẦN CODE** — cho mượn **một tấm bạt không có trong `src/content/econ/equipment.json`** (21 món, không món nào là bạt); reply *"Chiều tao trả"* hẹn một lần trả **không ai kiểm**. `rel +3` + ký ức 50 |
| 4.1.3 | "Dạ chú tính sao thì tính chú." | — | — | — | ĐÚNG |
| 4.2 | "Mưa vầy chú bán cho ai hả chú?" | — | `w.rain` ✓ | — | ĐÚNG |
| 4.2.1 | "Vậy mưa là chú hên hả chú?" | — | — | — | ĐÚNG |
| 4.2.1.1 | "Vậy chú đứng đây đợi tạnh đi chú." | — | **thiếu** `w.rain` + `w.shadeFree` | **thiếu** `STAND_IN_SHADE · tới khi tạnh` | **CẦN CODE** — `calm 25` trả trước cho một chỗ đứng không có |
| 4.2.1.2 | "Chú lỗ mà chú còn ra đường hả chú." | — | — | — | ĐÚNG |
| 4.2.1.3 | "Dạ." (LANH · silent) | — | — | — | ĐÚNG |
| 4.2.2 | "Chú bán cho thợ hồ, tui bán cho dân văn phòng. Hổng đụng mà chú." | **thiếu** `m.remembers(kietHaiXe)` — vì **`reply` khai một trí nhớ** | — | — | **SỬA** — `reply` nói *"Mày nói câu đó **lần thứ hai** rồi đó"*, nhưng **không ai đếm**. Nếu đây là lần đầu người chơi nói câu đó thì câu đáp **sai sự thật** — và nó là một lời trách. §4ter: nhớ nhầm nặng hơn quên |
| 4.2.3 | "Dạ chuyện của chú chú lo chú." (LANH · silent) | — | — | — | ĐÚNG |
| 4.3 | "Chú đứng chắn hết lối rồi chú ơi." (GAT · `rel −5` · `anger 40` · lá cuối) | **thiếu** `t.blocking` (khoá mới) | **thiếu** `w.queue >= 1` | `act: STEP_ASIDE` ✓ **đã có** | **SỬA** — **act duy nhất của cả file, và nó đúng** — nhưng thiếu `need`: trách chú chắn lối **trong khi chú không hề chắn**. Đây đúng chữ của chủ dự án: *"bảo có người tới trước chị, chị chen hàng — trong khi bà ấy không hề chen"* |

### kiet.khachchung — có thằng sáng nào cũng mua tao (SHORT · NPC_ONLY · day 18–40 · w11)

> **Lỗi cả cuộc:** `opener` khai *"Bữa nay nó qua mua mày."* — một **sự kiện cụ thể**
> (một khách quen của chú Kiệt hôm nay chuyển sang mua bên mình) mà **hệ khách hoàn toàn
> không mô phỏng**. Cả cuộc 19 nút dựng trên một chuyện chưa bao giờ xảy ra.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| S:ket.1 | "Chú đẩy xe đi chú. Mai gặp chú." | — | — | **thiếu** `MOVE_CART` / `WALK_ON · ngay` | **CẦN CODE** |
| S:ket.2 | "Chú đừng để bụng nghen chú." | — | — | — | ĐÚNG |
| 5.1 | "Dạ tui hổng biết ảnh là khách chú chú." | **thiếu** `w.kietLostCustomer` (khoá mới) | — | — | **SỬA** — xem khối trên |
| 5.1.1 | "Vậy chú nói tui chi vậy chú?" | — | — | — | ĐÚNG |
| 5.1.1.1 | "Chú nói ra được là đỡ rồi chú. Chú nói đi." | `kietDungChung` ✓ | — | — | ĐÚNG — khuôn đúng: chỉ an ủi được nếu hôm mưa mình đã kéo chú vô |
| 5.1.1.2 | "Mai tui nói ảnh ghé chú một bữa nghen chú." | — | — | `flag: kietKeoKhach` ✓ **nhưng chỉ dùng để KHOÁ `kiet.gundam`** · **thiếu** `PROMISE_DEED(đẩy một khách qua xe chú)` · hạn **1 ngày** | **CẦN CODE** — hứa **đẩy một khách sang xe đối thủ**: hệ khách không có cửa nào làm việc đó. Cờ hiện chỉ dùng để **chặn một cuộc khác**, tức lời hứa chỉ có hậu quả **âm** |
| 5.1.1.3 | "Khách ai nấy giữ chú. Chú tức tui chi." | — | — | — | ĐÚNG |
| 5.1.1.4 | "Chú bán dở thì khách đi chớ sao chú." (GAT · `rel −6` · `anger 50` · lá cuối) | — | — | — | ĐÚNG — câu nặng nhất file, kết thúc cuộc |
| 5.1.2 | "Ảnh ăn chú mười năm mà chú biết ảnh tên gì hông chú?" | — | — | — | ĐÚNG |
| 5.1.2.1 | "Vậy chắc tại cái đó đó chú." | — | — | — | ĐÚNG |
| 5.1.2.2 | "Chú hỏi tên ảnh đi chú. Chưa trễ đâu chú." | — | — | — | ĐÚNG — khuyên chú, không hứa gì về phía mình |
| 5.1.2.3 | "Dạ." (LANH · silent) | — | — | — | ĐÚNG |
| 5.1.3 | "Dạ." (LANH · silent) | — | — | — | ĐÚNG |
| 5.2 | "Dạ mai ảnh qua, tui nói ảnh ghé chú trước nghen chú." | — | — | **thiếu** cả `flag` lẫn `PROMISE_DEED` · hạn **1 ngày** | **CẦN CODE** — **cùng một lời hứa như 5.1.1.2 nhưng KHÔNG đặt cờ nào**: `rel +3` hoàn toàn miễn phí. Hai nút cùng file, cùng lời hứa, hai mức neo khác nhau |
| 5.2.1 | "Tui hổng muốn lấy khách của ai hết chú." | — | — | `flag: kietNeNguoiChoi` ✓ (đọc ở `kiet.gundam` 6.2.1) | ĐÚNG |
| 5.2.2 | "Tui giỡn thôi chú. Khách ai nấy giữ." | **thiếu** một đường **trả lại** điểm vừa ăn của nút cha 5.2 | — | — | **SỬA** — nút cha 5.2 vừa trả `rel +3` cho một lời hứa, nút con này **rút lại lời hứa đó** mà **không trả lại gì**. Đó là một đường ăn điểm: hứa → lấy điểm → bảo là giỡn |
| 5.2.3 | "Dạ thôi, tui nói vậy thôi chú." | — | — | — | ĐÚNG — rút lại nhưng không ăn điểm trước |
| 5.3 | "Chú Hải có qua xe chú hông chú?" | `haiKietNoi` ✓ | — | — | ĐÚNG |
| 5.4 | "Chú qua đây nói chuyện khách khứa chi vậy chú." (GAT · `rel −5` · `anger 40` · lá cuối) | — | — | **thiếu** `WALK_ON · ngay` | **CẦN CODE** — đuổi chú, chú không đi; `deTha 0.3` ⇒ đây đúng là chỗ chú phải bỏ đi thật |

### kiet.gundam — chú rớt cái cánh tay mô hình (FULL · NPC_ONLY · day 20–40 · `needFlag: kietChiLo` · `notFlag: kietKeoKhach` · w10)

> **Lỗi cả cuộc:** `opener` là *"Tao rớt cái này. Mày lượm giùm."* — một **vật thể rơi
> xuống đất** mà thế giới không có. Người chơi "lượm" bằng lời, "đưa lại" bằng lời; tay
> không bao giờ cầm gì.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| S:ket.1 | "Dạ tui kín miệng mà chú." | — | — | — | ĐÚNG |
| S:ket.2 | "Chú đẩy xe đi chú, trễ rồi." | — | — | **thiếu** `MOVE_CART` / `WALK_ON · ngay` | **CẦN CODE** |
| 6.1 | "Cái gì mà nhỏ xíu vầy chú? Cánh tay hả chú?" | **thiếu** `p.handsEmpty` *(tĩnh — phải rảnh tay mới lượm được)* | — | **thiếu** `PICK_UP(cánh tay mô hình) · ngay` (khoá mới) | **CẦN CODE** — xem khối trên |
| 6.1.1 | "Chú ráp mô hình hả chú?" | — | — | — | ĐÚNG |
| 6.1.1.1 | "Tui cười gì chú. Chú sơn khéo quá trời chú." | — | — | — | ĐÚNG |
| 6.1.1.1.1 | "Hai tuần cho một con hả chú. Chú kiên nhẫn ghê chú." | — | — | — | ĐÚNG |
| 6.1.1.1.2 | "Bữa nào chú đem qua tui coi đi chú." | — | — | **thiếu** `flag: kietDemMoHinh` + `PROMISE_DEED` · hạn **1–3 ngày** · và **một cuộc nhận lấy nó** | **CẦN CODE** — free word nặng: `rel +4` + ký ức `CARED_FOR_THEM 60`, reply *"Để tao đem một con. Con đó tao ưng nhất."* — **không cờ, và không cuộc nào ở `day 21–40` nhận**. Với `deTha 0.3`, đây là lần thứ hai chú mở lòng và cũng rơi vào trống không |
| 6.1.1.1.3 | "Chú mà chơi mấy cái đó, ai mà tin chú." | — | — | — | ĐÚNG |
| 6.1.1.2 | "Chú giấu chi vậy chú? Có gì đâu mà giấu." | — | — | — | ĐÚNG |
| 6.1.1.3 | "Dạ tui hổng ngó nữa nè chú." | — | — | — | ĐÚNG |
| 6.1.2 | "Dạ của con chú hả chú?" | — | — | — | ĐÚNG |
| 6.1.3 | "Dạ tui đưa chú nè. Tui hổng hỏi gì hết." | **thiếu** `p.handsEmpty` / đang cầm món đồ | — | **thiếu** `GIVE_ITEM · ngay` (khoá mới) | **CẦN CODE** — trả lại món đồ **không có món đồ nào trong tay để trả** |
| 6.2 | "Dạ tui lượm rồi nè chú. Chú cất đi chú." | **thiếu** `p.handsEmpty` | — | **thiếu** `PICK_UP` + `GIVE_ITEM · ngay` | **CẦN CODE** |
| 6.2.1 | "Chú biểu đừng ngó thì tui đừng ngó chú." | `kietNeNguoiChoi` ✓ | — | — | ĐÚNG — khuôn đúng: chỉ nói được nếu trước đó mình đã thật sự nhường khách cho chú |
| 6.2.2 | "Chú muốn tui hỏi hả chú?" | — | — | — | ĐÚNG |
| 6.2.3 | "Dạ." (LANH · silent) | — | — | — | ĐÚNG |
| 6.3 | "Chú rớt đồ tùm lum trước xe tui chú ơi." (GAT · `rel −6` · `anger 45` · lá cuối) | — | — | — | ĐÚNG — không hứa gì; giá đã trả bằng `rel`/`anger`/`mem` |

### kiet.moiloi — người chơi bắt chuyện (SHORT · PLAYER_ONLY · day 5–40 · w25)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 7.1 | "Bữa nay chú bán được hông chú?" | — | — | — | ĐÚNG |
| 7.1.1 | "Tui hỏi cho có chớ tui đâu có rình chú." | — | — | — | ĐÚNG |
| 7.1.2 | "Lò chú sáng giờ ra mấy mẻ rồi chú?" | — | — | — | ĐÚNG |
| 7.1.3 | "Thôi. Hỏi cho có hà chú." | — | — | — | ĐÚNG |
| 7.2 | "Thằng cha hồi nãy trả giá xong nó quạu với tui đó chú." (CHUI · lá cuối) | **thiếu** `d.hadHaggler` (khoá mới) | — | — | **SỬA** — kể một chuyện **vừa xảy ra** mà có thể **chưa xảy ra**: hẻm có thể chưa có khách nào trả giá hôm nay (§4ter tầng `d.*`) |
| 7.3 | "Chú đứng ngó xe tui hoài vậy chú." (GAT · `anger 20`) | **thiếu** `t.glanced` / `t.lookingInside` | — | **thiếu** `STEP_ASIDE` hoặc `WALK_ON` | **SỬA** — trách chú ngó, không kiểm chú có ngó không, và chú không dạt |

### kiet.moiloi2 — bắt chuyện lần hai (SHORT · PLAYER_ONLY · day 9–40 · w20)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 8.1 | "Chú đi chợ bốn giờ sáng thiệt hả chú?" | **thiếu** `m.remembers(kietDiCho)` | — | — | **SỬA** — hỏi lại một chuyện chú kể ở `kiet.gia` 2.1.2; cuộc đó **có thể chưa chạy** và **không đặt cờ nào** (§4ter) |
| 8.2 | "Cái đám sáng giờ chê bánh tui mắc đó chú." (CHUI) | **thiếu** `d.hadPriceComplaint` (khoá mới) | — | — | **SỬA** — than về những người chê mắc **khi chưa ai chê**. Game **có** mô phỏng chuyện chê mắc (`walkin.json` có cả một cuộc trả giá) nên đây là chuyện kiểm được |
| 8.3 | "Chú qua đây chi. Lo xe chú đi chú." (GAT · `anger 20`) | — | — | **thiếu** `WALK_ON · ngay` | **CẦN CODE** — đuổi chú về xe chú; chú đứng nguyên và reply còn cãi lại *"Tao đứng đường tao"* — nhưng cái "đường tao" đó không có trên bản đồ |

### kiet.moiloi3 — bắt chuyện lần ba (SHORT · PLAYER_ONLY · day 9–40 · w18)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 9.1 | "Chú ăn gì chưa chú? Trưa trờ trưa trật rồi." | — | **thiếu** `w.band(TRUA)` (khoá mới) | — | **SỬA** — "trưa trờ trưa trật" nói được lúc **sáu giờ sáng**; và cuộc chỉ khai `day >= 9`, không khai `slot` |
| 9.2 | "Mai chú bán mười lăm nữa thôi hả chú?" | **thiếu** `m.remembers(kietGia15)` | — | — | **SỬA** — nhắc giá 15k mà chú **có thể chưa nói**: `kiet.gia` là cuộc riêng, mở từ ngày 8, có thể chưa chạy |
| 9.3 | "Chú nói chuyện với tui thì bỏ cái giọng đó đi chú." (GAT · `anger 25`) | **thiếu** `c.saidTone(...)` của **chú** trong cuộc này | — | — | **SỬA** — trách *"cái giọng đó"* ở **nhịp ĐẦU của một cuộc do người chơi mở**: chú **chưa nói câu nào**. Đây là bản mẫu của lỗi *"không có trí nhớ trong một cuộc"* lật ngược — trách một chuyện chưa xảy ra thay vì quên một chuyện đã xảy ra |

---

## 1. Thống kê

| | số nút | tỉ lệ |
|---|---|---|
| **Tổng** | **119** | 100 % |
| `ĐÚNG` | 78 | 66 % |
| `SỬA` | 19 | 16 % |
| `XOÁ` | 0 | 0 % |
| `CẦN CODE` | 22 | 18 % |

Chia theo cuộc: `kiet.lo` 12/2/0/1 · `kiet.gia` 12/2/0/2 · `kiet.bienhieu` 14/4/0/2 ·
`kiet.mua` 11/2/0/7 · `kiet.khachchung` 13/2/0/4 · `kiet.gundam` 12/0/0/5 ·
`kiet.moiloi` 4/2/0/0 · `kiet.moiloi2` 0/2/0/1 · `kiet.moiloi3` 0/3/0/0
(theo thứ tự ĐÚNG/SỬA/XOÁ/CẦN CODE).

**Ba cuộc `moiloi` là chỗ tệ nhất: 4/12 đạt.** Lý do giống hệt các file khác: chúng **hỏi
lại những chuyện cuộc khác kể**, mà cuộc kể **không đặt cờ nào**. Riêng 9.3 còn nặng hơn —
nó trách một giọng nói **chưa được nói ra**, ở ngay nhịp đầu.

**Cuộc tệ nhất về hành động: `kiet.mua` — 7/20 nút `CẦN CODE`.** Cả cuộc là một chuỗi câu
bảo **một cái xe đẩy di chuyển** vào một **cái mái không tồn tại**.

**Trí nhớ trong một cuộc (§3.3): file này SẠCH.** Cả 10 nút `GAT` (1.1.1.4, 1.2.1.3,
2.1.1.4, 2.4, 3.1.1.3, 4.3, 5.1.1.4, 5.4, 6.3, 7.3, 8.3, 9.3) và 2 nút `CHUI` (7.2, 8.2)
đều là **lá cuối**. Không nút nào cần `need: "!c.angered"`.
**Một chỗ cần để ý tuy không đúng §3.3:** 5.2.2 (*"Tui giỡn thôi chú"*) là một **lời rút
lại sau khi đã ăn `rel +3`** của nút cha — không phải lỗi trí nhớ, mà là một lỗ hổng tính điểm.

**Phân loại `need` / `while` (§4.1):** 20 khoá nên là `need`, 9 nên là `while`. File này
**chưa có `while` nào**, nên không có nút nào đặt sai phía — nhưng cũng nghĩa là chưa có
nút nào đọc thế giới.

## 2. Đề xuất khoá mới

| khoá đề xuất | nghĩa | nút cần | vì sao §3 không đủ |
|---|---|---|---|
| `t.blocking` | người này **đang đứng chắn** lối vào / che mặt xe | 3.1.1.3 · 4.3 · 7.3 | §3.2 có `t.cutLine` (đã chen hàng) nhưng không có "đang chắn lối". 4.3 là **act duy nhất đúng của cả file** mà vẫn buộc tội không bằng chứng — đúng lỗi chủ dự án chỉ |
| `p.price == N` · `p.fillLevel` | giá bán hiện tại · mức nhân đang kẹp | opener `kiet.gia` · 2.1 | §3.1 chỉ có `p.cash`. Cả cuộc `kiet.gia` là **một cuộc so giá**, mà giá là biến người chơi chỉnh |
| `p.soldToday >= N` | hôm nay đã bán mấy ổ | 2.1.1.3 | §3.1 chỉ có `p.soldOut` |
| `w.ovenHot` | lò đã nóng / đang nhen | 1.1 · 1.2 | §3.4 không có khoá nào về cái lò, trong khi `kiet.lo` là **một cuộc nói về cái lò** |
| `w.kietLostCustomer` | hôm nay có khách quen của chú Kiệt mua bên mình | opener `kiet.khachchung` · 5.1 | §3.2 chỉ mô tả **người đang đứng trước mặt**; không có khoá nào cho một sự kiện về người thứ ba. Cả một cuộc 19 nút treo trên đó |
| `d.hadHaggler` · `d.hadPriceComplaint` | hôm nay đã có khách trả giá / chê mắc | 7.2 · 8.2 | §4ter tầng `d.*` chưa có khoá nào. Hai chuyện này **game mô phỏng thật** (`walkin.json` có cuộc trả giá) |
| `m.remembers(E)` | cả mùa: chuyện E đã thật sự xảy ra | 3.1 · 4.2.2 · 8.1 · 9.2 | `need` hiện chỉ đọc **cờ chuyện**, và **không chỗ nào trong bốn chỗ này có cờ** |
| `c.saidTone(X)` đọc được **giọng của NPC** | §3.3 chỉ ghi giọng **người chơi** đã nói | 9.3 | 9.3 trách *giọng của chú*; không có khoá nào ghi NPC đã nói giọng gì |
| `w.band(X)` | khung giờ | 9.1 | §3.4 không có giờ |

**Cờ nội dung cần thêm:** `kietDiCho` (đặt ở `kiet.gia` 2.1.2, cho 8.1 đọc) ·
`kietGia15` (đặt ở opener/2.1.2 của `kiet.gia`, cho 9.2 đọc) ·
`kietDemMoHinh` (đặt ở 6.1.1.1.2, cần một cuộc ở `day 21–40` nhận) ·
`haiVeBang` (đặt ở cuộc của ông Hải, cho 3.1 đọc).

## 3. Hành động cần code

| hành động | nút cần | thời lượng đề xuất | thiếu gì trong game |
|---|---|---|---|
| `MOVE_CART{ tới đâu }` — **xe đẩy của chú Kiệt di chuyển** | 4.1 · 4.1.1.1 · S:diyen.2 · 4.1.1.2.1 (và là phương án đúng cho mọi "chú đẩy xe đi chú") | tới khi tạnh mưa (trần ~90 s), rồi **về chỗ cũ** | **Không có trong §3.5, và nặng hơn thế: `src/world/map.ts` không có xe của chú Kiệt.** Chú hiện là một NPC đứng, không có xe. Cần: một thực thể xe · ô đậu của nó · ô trống dưới mái để kéo vào. Nếu không làm được ⇒ **đổi chữ cả cụm**: mời chú **đứng** chứ đừng mời chú **đẩy xe** |
| `STAND_IN_SHADE` + `LEAVE_SHADE` | S:diyen.1 · 4.2.1.1 | tới khi tạnh, rồi đi tiếp | §3.5 ghi **CHƯA — cần ô mới**. Không có mái, không có ô trú trên bản đồ |
| `WALK_ON` | 1.1.1.4 · S:ket.1/S:ket.2 (×3 cuộc) · 5.4 · 8.3 | ngay, kết thúc cuộc | §3.5 ghi **CHƯA**. Chú Kiệt `deTha 0.3`, `patience 45` — theo §4bis chú là người **bỏ đi sớm nhất**, mà hiện chú không bao giờ đi |
| `PICK_UP{ món }` + `GIVE_ITEM{ món }` | 6.1 · 6.1.3 · 6.2 | ngay | Không có trong §3.5 và **không có vật thể rơi** trong cảnh; `player.hand` chỉ nhận `loaf_*` và `tea` (`world/stations.ts`). Cần thêm một loại vật cầm tay "đồ của người khác" |
| `LEND_TARP` (hoặc `LEND_ITEM` tổng quát) | 4.1.2 | tới chiều (một buổi) | **Không có tấm bạt nào trong `src/content/econ/equipment.json`** (21 món). Hoặc thêm một món, hoặc **đổi chữ**: đừng cho mượn cái mình không có |
| `PROMISE_DEED{ việc, hạn }` | 5.1.1.2 · 5.2 (nói giùm với khách) · 6.1.1.1.2 (chú đem mô hình qua) | 1–3 ngày | `TalkAct.PROMISE` chỉ treo **món kẹp vô ổ**. Hai lời hứa "nói giùm khách" còn đòi một cửa **đẩy khách sang xe khác** mà hệ khách không có — nếu không làm ⇒ **đổi chữ** |
| `STEP_ASIDE` | 3.1.1.3 · 7.3 | tới khi xong | **ĐÃ CÓ CODE** (`service.ts:3232`); 4.3 đã dùng đúng. Việc cần làm là gắn thêm vào hai nút kia, **và** thêm `need: t.blocking` cho cả ba |
| `need` / `while` nói chung | 19 nút `SỬA` | — | `need` chỉ đọc **cờ chuyện** (`gate.flags`); `while` chưa được `visibleOptions` đọc; cơ chế `?` của §4 chưa có |

## 4. Lời hứa có hạn (§4bis)

**Nấc phạt của chú Kiệt** (`deTha 0.3`, `nongTinh 0.6`, `patience 45`): theo đúng dòng
*"người nóng tính bỏ nấc một"* của §4bis — chú **không nhắc**. Chú **nói nặng một câu rồi
đi luôn**, và **nhớ lâu** (`deTha 0.3` nghĩa là ký ức âm phai rất chậm). Với chú, nuốt lời
một lần có thể đóng luôn cả nhánh `kiet.gundam` (`needFlag: kietChiLo`).

| nút | hứa gì | hạn (giây thật / ngày) | giữ lời | NUỐT LỜI |
|---|---|---|---|---|
| 4.1 · 4.1.1.1 · S:diyen.2 | kéo xe chú vô dưới mái | **tới khi tạnh** | `PROMISE_KEPT`, giữ `rel +4` · ký ức 60 · cờ `kietDungChung` | **bỏ nấc một**: chú nói một câu nặng (*"Thôi. Tao biết rồi."*) rồi **đẩy xe đi trong mưa**, và **gỡ cờ `kietDungChung`** ⇒ mất luôn nhánh 5.1.1.1 |
| 4.1.2 | cho mượn tấm bạt tới chiều | **tới cuối buổi** | `PROMISE_KEPT` | chú không có bạt ⇒ **đi luôn**, nhớ |
| 4.1.1.2.1 | đổi chỗ đứng với chú | **~20 s** | — | nếu người chơi không bước ra ⇒ chú nói nặng rồi thôi |
| 5.1.1.2 · 5.2 | mai nói khách ghé chú một bữa | **1 ngày** | `PROMISE_KEPT` + một khách thật ghé xe chú | hôm sau không có gì ⇒ chú nói một câu rồi **không nhắc lại nữa cả mùa**. Đây là lời hứa **đau nhất** vì nó chạm đúng chỗ chú tự ti |
| 6.1.1.1.2 | "bữa nào chú đem qua tui coi" | **1–3 ngày** — hạn ở phía **chú**, không phải người chơi | chú đem thật ⇒ một cuộc mới | nếu người chơi không hỏi lại ⇒ chú **không đem**, và im. Hiện **đang là trường hợp này** |
| 3.1.1.1.1 | "để tui nói chú Hải một tiếng giùm chú" | **1 ngày** | **ĐÃ CÓ ĐƯỜNG THẬT**: `ong-hai.json:hai.pano` đọc cờ `kietNhoNoi` | nếu người chơi không nói với chú Hải ⇒ hiện **không có gì xảy ra**; cần thêm nấc nuốt lời |

> **Chỗ nguy nhất của §4bis trong file này:** `calm 26` (S:diyen.1), `calm 25` (4.2.1.1),
> `calm 24` (4.1), `calm 22` (S:diyen.2) — **bốn mức sát trần 30** được trả trước cho bốn
> lời mời trú mưa **không có chỗ trú**. Nếu chưa code kịp `MOVE_CART`/`STAND_IN_SHADE`,
> việc **gỡ `calm` khỏi bốn nút đó** phải làm trước.

## 5. Trí nhớ bốn tầng (§4ter)

| tầng | tình trạng | nút liên quan |
|---|---|---|
| `c.*` **trong cuộc** | **SẠCH về §3.3** (12 `GAT`/`CHUI` đều là lá cuối), nhưng **1 chỗ lật ngược**: 9.3 trách *"cái giọng đó"* ở nhịp đầu, khi chú **chưa nói câu nào** | 9.3 — cần `c.saidTone` đọc được giọng của **NPC** |
| `v.*` **trong lượt ghé** | **1 lỗ hổng tính điểm** (không phải trí nhớ): 5.2 trả `rel +3` cho một lời hứa, 5.2.2 rút lại mà không trả lại | 5.2 ↔ 5.2.2 — cần `v.promised(X)` để nút rút lại biết phải hoàn điểm |
| `d.*` **trong ngày** | **2 chỗ hở**: 7.2 và 8.2 kể chuyện "sáng giờ" mà không đếm; và ba cuộc `moiloi` chạy được cả ba trong một ngày với ba `opener` đều chào như mới gặp (*"Gì. Kêu tao chi."* · *"Nói đi. Tao nghe."* · *"Ờ. Mày kêu tao chi."*) | 7.2 · 8.2 — cần `d.hadHaggler` · `d.hadPriceComplaint` · `d.metToday` |
| `m.*` **cả mùa** | **4 chỗ nhớ nhầm** + **1 chỗ `reply` tự khai trí nhớ sai** | nhớ nhầm: 3.1 · 8.1 · 9.2 · (và `needEquip` thiếu ở 3.1/3.1.2/3.2) · reply sai: **4.2.2** — *"Mày nói câu đó lần thứ hai rồi đó"* trong khi có thể là lần đầu |

> **Điểm sáng cần giữ làm khuôn — file này làm §4ter tốt nhất trong năm file.**
> Năm nút khai `need` cờ thật (2.3 `sauRaoThu` · 5.1.1.1 `kietDungChung` ·
> 5.3 `haiKietNoi` · 6.2.1 `kietNeNguoiChoi`), và `kiet.gundam` khai cả
> `when.needFlag: "kietChiLo"` lẫn `when.notFlag: "kietKeoKhach"` — tức **một cuộc sâu chỉ
> mở ra cho người đã chỉ-lò-giúp và chưa-kéo-khách**. Đó đúng là trí nhớ cả mùa mà §4ter
> đòi, và nó đã chạy được. Bốn chỗ nhớ nhầm ở trên chỉ cần chép khuôn này.
>
> **Ngược lại, chỗ xấu nhất:** 3.1 nói về `BANG_HIEU` — một thiết bị **750k, mở ngày 14**
> — trong một cuộc chạy từ **ngày 12**. Đó không phải lỗi trí nhớ mà là lỗi **thế giới**:
> nhân vật nói về một vật người chơi nhìn quanh không thấy (P2-06 §2.17). Sửa một dòng:
> `when.needEquip: "BANG_HIEU"`.
