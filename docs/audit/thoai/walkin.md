# Rà thoại — `src/content/talks/walkin.json`

**Hợp đồng:** `docs/phase-2-he-npc/P2-07-neo-thoai-vao-the-gioi.md` · **11 cuộc · 133 nút**

---

## 0. Đọc trước khi đọc bảng

**Bốn sự thật về code, đúng lúc rà** (`src/sim/talk.ts`, `src/sim/service.ts`,
`src/sim/worldfacts.ts`, `src/sim/customer.ts` — code đang được sửa song song, đây là ảnh
chụp lúc rà):

1. **`while` ĐÃ CÓ THẬT.** `TalkNode.while?: string[]`, và `Service.chooseTalk()` gọi
   `snapshot()` → `allHold()` trước khi áp bất cứ hệ quả nào; hỏng thì hiện `"?"`, `rel −1`,
   không `anger`, không rẽ xuống `then` — đúng §4. **Cả bốn file cộng lại mới có 3 nút khai `while`** (`walkin.chemac` 1.1 ·
   `dung.chaymua` 2.1.1 · `sau.ganh` 1.2 — đều vừa được thêm giữa lúc rà). Cột "LÚC NÓI" dưới đây là thứ phải viết vào, không phải thứ chưa làm được.
2. **`need` thì CHƯA.** `visibleOptions()` vẫn chỉ tra `need` vào `gate.flags` (cờ chuyện).
   Viết `need: "t.cutLine"` vào JSON hôm nay thì nó im lặng trả `false` và **nút biến mất hẳn**.
   Phải cho `need` đi qua `holds()` giống `while` trước khi dùng được một chữ nào của §3.2.
3. **Bốn khoá của §3 đã khai nhưng KHÔNG CÓ GÌ NUÔI — chúng vĩnh viễn `false`:**

   | khoá | chỗ khai | ai gán `true` |
   |---|---|---|
   | `t.cutLine` | `Customer.cutLine = false` | **không ai** |
   | `t.inShade` | `Customer.inShade = false` | **không ai** |
   | `w.shadeFree` | `Service.shadeFree = false` | **không ai** |
   | `t.purpose(X)` · `t.state(Y)` | `c.purpose = null` · `c.purposeState = null` | **không ai** — `sim/purpose.ts` có `rollPurpose()` và `content/npcs/purposes.json` có đủ 60 × 34, nhưng chưa chỗ nào gọi |

   Nên câu *"Có người tới trước chị"* gắn `need: t.cutLine` hôm nay sẽ **không bao giờ hiện**.
   Chữa đủ phải là: ghi sự kiện chen hàng vào `c.cutLine` **rồi** mới gắn khoá.
4. `TalkAct` vẫn **đúng 7 loại**: `PAY` `DISCOUNT` `FREE_LOAF` `PROMISE` `STEP_ASIDE` `REFUSE`
   `INVITE`. Không có `forSec`. `GIVE_BREAD` · `OFFER_TEA` · `STAND_IN_SHADE` · `LEAVE_SHADE` ·
   `LOOK_INSIDE` · `WALK_ON` **chưa tồn tại**.

**Quy ước phán trong file này** (để `SỬA` và `CẦN CODE` không lẫn vào nhau):

* `SỬA` — chữa được **chỉ bằng cách sửa JSON**: thêm khoá đã có trong `worldfacts.ts`, thêm
  `act` đã có trong `TalkAct`, hoặc bỏ một con số bịa.
* `CẦN CODE` — neo đúng, nhưng phải **viết thêm** act / khoá / đạo cụ / ô bản đồ.
* `ĐÚNG` — xã giao thuần hoặc câu hỏi thuần: **không hứa gì, không khẳng định gì về thế giới**
  nên không nợ gì. Nhánh cha đã bảo đảm điều kiện thì con **không** phải khai lại `need`.
* `XOÁ` — hứa một chuyện thế giới không làm được và không đáng làm.

**Hai lỗi cấu trúc ăn cả file** (ghi ở đây, không lặp lại 133 lần):

* **(W-1) `opener` của cuộc `PLAYER_ONLY` KHÔNG BAO GIỜ HIỆN.** `okSource()` chỉ cho
  `PLAYER_ONLY` đi đường người chơi mở lời, mà `openTalk()` khi người chơi mở lời trả
  `talkView("")` — **không phát `opener`**. Năm cuộc `walkin.cay` · `lame` · `nang` ·
  `dienthoai` · `chen` đều viết cây như một câu TRẢ LỜI cho `opener` đó. Bỏ `opener` đi thì
  nhịp đầu thành người chơi tự nói một mình về một chuyện chưa ai nhắc — **đúng chỗ chủ dự án
  gọi là "trong khi chính mình là người bắt chuyện trước"**. Cách chữa duy nhất đúng: cái
  `opener` đang khẳng định (họ đang bấm điện thoại / đang ngó bảng giá / trời đang nắng) phải
  thành **`while` của nhịp đầu**, không phải một câu thoại bị nuốt.
* **(W-2) `walkin` là kho khách ĐANG MUA** (`kindOf()` → `MUA`). Mọi nút ở đây đều ngầm cần
  `t.buying`. Nên mọi câu giả định họ rảnh, họ đang đi ngang, hay mình đã quen họ đều sai —
  đánh dấu riêng từng chỗ bên dưới.

---

### walkin.chemac — chê mắc, so giá với bên kia (12 nút)
`NPC_ONLY · FULL` · opener *"Hai lăm ngàn? Bên kia có mười lăm à chị."*

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Dạ bánh em nhân nhiều hơn anh à." | — | `t.ordering` | `PROMISE(nhan-day)` · kiểm lúc đưa bánh | **SỬA**: khoe nhân nhiều rồi đưa ổ trơn vẫn không sao — thiếu `does: PROMISE` |
| 1.1 | "Anh ăn thử đi. Không ngon em không lấy tiền." | ✅ `p.holdsBread` **đã có** → siết thành `p.holdsFilled` | — | `GIVE_BREAD` · tới khi ăn xong **+** `FREE_LOAF` | **CẦN CODE**: là **nút duy nhất của file đã khai `while`**. `FREE_LOAF` chỉ miễn tiền — không ai ăn, mà cả nhánh con nói như đã ăn. `p.holdsBread` còn lọt ổ chưa kẹp nhân |
| 1.1.1 | "Dạ anh ăn từ từ nghen." | (nhánh cha) | `t.eating` | — | **CẦN CODE**: thiếu khoá `t.eating` |
| 1.1.2 | "Ngon thì anh ghé nữa nghen anh." | (nhánh cha) | `t.eating` | — | **CẦN CODE**: như trên |
| 1.1.3 | "Thấy chưa. Mười lăm làm gì có cái này." | (nhánh cha) | `t.eating` | — | **CẦN CODE**: như trên |
| 1.2 | "Vậy anh qua bên kia mua đi anh." | — | `t.ordering` | `REFUSE` · ngay | **SỬA**: đuổi khách bằng mồm; `traigia` 2.2 cùng ý thì có `REFUSE`, chỗ này không |
| 1.3 | "Anh chê thì anh đừng mua, nói nhiều." | — | `t.ordering` | `REFUSE` · ngay | **SỬA**: như 1.2 — `anger=60` chỉ ăn vào sức chờ, khách vẫn đứng đó mua |
| 2 | "Dạ bên kia mười lăm thiệt anh. Mà bánh khác nhau." | — | — | — | **ĐÚNG** (nhắc lại chính câu họ vừa nói) |
| 2.1 | "Chú Kiệt bán cũng đàng hoàng mà anh." | `t.toldMe(kietLaDoiThu)` | — | — | **SỬA**: khách chỉ nói *"bên kia"*; người chơi tự gọi đích danh chú Kiệt cho một người lạ |
| 2.2 | "Anh ăn bên nào cũng được mà anh." | — | — | — | **ĐÚNG** |
| 2.3 | "Dạ." (im) | — | — | — | **ĐÚNG** (đường ra) |
| 3 | "Giá đó đó anh. Mua thì mua." | — | `t.ordering` | — | **ĐÚNG** (nói thẳng giá, không hứa gì) |

---

### walkin.quayclip — khách đòi quay clip review (17 nút)
`NPC_ONLY · SHORT · day 9–40`

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Dạ anh quay đồ ăn thôi nghen, đừng quay mặt em." | — | `t.ordering` | `FILM_CLIP(do-an)` · tới hết cuộc | **CẦN CODE**: cả cuộc 17 nút không một `act` — quay hay không quay, ngày mai y hệt nhau |
| 1.1 | "Dạ em không muốn lên hình anh à." | (nhánh cha) | — | `FILM_CLIP(huy)` · ngay | **CẦN CODE**: như trên |
| 1.1.1 | "Dạ em cảm ơn anh." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.2 | "Anh quay xong gửi em coi với nghen." | (nhánh cha) | — | — | **ĐÚNG** (ước, không phải hứa của mình) |
| 1.1.3 | "Dạ." (im) | — | — | — | **ĐÚNG** (đường ra) |
| 1.2 | "Anh quay rồi người ta vô chửi em thì sao anh?" | — | — | — | **ĐÚNG** (câu hỏi thuần) |
| 1.3 | "Quay cái gì mà quay. Tắt máy đi." | — | — | `REFUSE` · ngay | **SỬA**: ra lệnh tắt máy, máy vẫn chạy, khách vẫn đứng mua |
| 2 | "Dạ thôi anh. Em không thích quay." | — | — | `FILM_CLIP(huy)` · ngay | **CẦN CODE** |
| 2.1 | "Dạ em bán được rồi anh, em không cần nổi tiếng." | (nhánh cha) · `!p.soldOut` | — | — | **SỬA**: *"em bán được rồi"* nói lúc ế trắng là câu nói dối thấy bằng mắt |
| 2.2 | "Anh quay là chuyện của anh, em không ký gì hết." | (nhánh cha) | — | — | **ĐÚNG** |
| 2.3 | "Anh mà quay là em gọi công an đó anh." | — | — | `REFUSE` · ngay | **SỬA**: doạ gọi công an, không ai tới, khách vẫn mua xong đi về |
| 2.4 | "…" (im) → `ref: di` | — | — | `WALK_ON` · ngay | **SỬA**: khách đáp *"Ờ, thôi. Tui đi chỗ khác."* rồi nhánh `di` lại là **nhánh kết sổ bán hàng** (`"Dạ hai lăm ngàn anh."`) — đi chỗ khác xong vẫn trả tiền |
| 3 | "Dạ được anh. Anh quay đi." | — | `t.ordering` | `FILM_CLIP(do-an)` · tới hết cuộc | **CẦN CODE** |
| 3.1 | "Dạ em cười hổng được đâu anh." | (nhánh cha) | — | — | **ĐÚNG** |
| 3.2 | "Dạ anh quay lẹ giùm em nghen." → `ref: di` | (nhánh cha) | `w.queue >= 1` | — | **SỬA**: *"quay lẹ giùm"* chỉ có nghĩa khi đang có người chờ |
| di:1 | "Dạ anh ăn ngon miệng nghen." | — | `t.served` | — | **SỬA**: chúc ăn ngon khi ổ chưa rời tay |
| di:2 | "Dạ hai lăm ngàn anh." | — | `t.served` | `COLLECT(priceOf)` | **SỬA**: **hard-code 25.000₫** trong khi `econ.priceOf(g, day)` đổi theo ngày và theo sự kiện |

---

### walkin.cau — khách cáu vì chờ lâu (14 nút)
`NPC_ONLY · FULL · day 6–40` · opener *"Sao lâu vậy em? Tui đứng đây nãy giờ nè."*

> **Lỗi cấp CUỘC:** `when` chỉ có `day`. Cuộc này rút được cho một người **vừa mới tới**, và
> họ mở miệng cáu vì "đứng nãy giờ". Phải khoá `t.impatient` (`waitRatio ≥ 0,6`) — khoá này
> **đã có sẵn** trong `worldfacts.ts`.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Dạ em xin lỗi anh. Em làm liền nè." | `t.impatient` | `t.waiting` | — (`calm=25` là hệ quả thật) | **SỬA**: thiếu `need: t.impatient` ở cấp cuộc; *"làm liền"* nói lúc tay không, lò nguội |
| 1.1 | "Anh gặp chuyện gì hả anh?" | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.1 | "Vậy chắc anh mệt lắm rồi." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.2 | "Sếp gì mà chửi nhân viên trước mặt người ta." | (nhánh cha) | — | — | **ĐÚNG** (`CHUI` vào người thứ ba) |
| 1.1.3 | "Dạ anh ngồi xuống ghế đợi em chút." `needEquip: GHE_BAN` · `act: STEP_ASIDE` | (nhánh cha) · `p.atCounter` | ghế trống | `SIT_DOWN` · tới khi phục vụ xong | **CẦN CODE**: `STEP_ASIDE` là **nhường chỗ trong hàng** (`yieldSlot`), không phải ngồi xuống. Act gắn sai nghĩa, không có `SIT_DOWN` |
| 1.1.4 | "Thì anh về anh chửi lại sếp anh đi." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.2 | "Dạ anh đợi em một phút nữa thôi." → `ref: di` | `t.impatient` | `t.waiting` | `PROMISE(mot-phut)` · 60 s | **SỬA**: hứa đúng một con số rồi không ai bấm giờ |
| 2 | "Dạ anh mới đứng có một phút à anh." | **`!t.impatient`** | `t.waiting` | — | **SỬA**: ***đây là "chị chen hàng" phiên bản thời gian*** — cãi lại người đã chờ thật 40 giây mà không ai kiểm `waitRatio` |
| 2.1 | "Dạ đúng rồi anh. Em xin lỗi." → `ref: di` | (nhánh cha) | — | — | **ĐÚNG** |
| 2.2 | "Dạ ai cũng phải chờ hết anh à." | — | `w.queue >= 2` | — | **SỬA**: *"ai cũng phải chờ"* nói khi sau lưng họ không có ai là câu rỗng |
| 2.3 | "Anh gấp thì anh đi chỗ khác đi anh." | — | — | `REFUSE` · ngay | **SỬA**: đuổi bằng mồm |
| 3 | "…" (im) | — | — | — | **ĐÚNG** (đường ra, `anger=20` là giá thật) |
| di:1 | "Dạ ổ của anh đây. Anh đi mạnh giỏi." | `p.holdsFilled` | — | `GIVE_BREAD` · ngay | **CẦN CODE**: lời thoại kể chuyện đưa bánh trong khi việc đưa bánh nằm ở `deliver()` — nói câu này lúc tay không là một lời nói dối |
| di:2 | "Dạ anh thông cảm giùm em." | (nhánh cha) | — | — | **ĐÚNG** |

---

### walkin.traigia — trả giá, mua ba ổ (11 nút)
`NPC_ONLY · FULL` · opener *"Cô bớt tui năm ngàn đi. Tui mua ba ổ lận."*

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Dạ ba ổ em bớt cô năm ngàn được." `act: DISCOUNT 5000` | `t.orderSize >= 3` | — | `DISCOUNT 5.000₫` · lúc tính tiền | **SỬA**: act đúng, nhưng không ai kiểm họ có mua ba ổ thật — bớt 5k cho một ổ cũng trôi |
| 1.1 | "Dạ cô ghé nữa nghen cô." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.2 | "Dạ cô nhớ ghé thiệt đó nghen." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.3 | "Dạ." (im) | — | — | — | **ĐÚNG** |
| 2 | "Dạ em bán đúng giá cô à." | — | — | — | **ĐÚNG** |
| 2.1 | "Dạ em bớt là em lỗ cô ơi." | `p.margin <= N` | — | — | **SỬA**: game **có** số liệu giá vốn (`econ.ts`); câu này nói dối được mà không ai bắt |
| 2.1.1 | "Dạ cô tính thử coi: bánh, pate, thịt, rau…" | (nhánh cha) | — | — | **ĐÚNG** |
| 2.1.2 | "Dạ thôi em bớt cô ba ngàn vậy." `act: DISCOUNT 3000` | (nhánh cha) | — | `DISCOUNT 3.000₫` · lúc tính tiền | **ĐÚNG** |
| 2.1.3 | "Cô không biết thì cô đừng nói cô." | (nhánh cha) | — | — | **ĐÚNG** (`GAT` có giá: `rel −3 · anger 65`) |
| 2.2 | "Dạ vậy thôi cô mua chỗ khác đi cô." `act: REFUSE` | — | — | `REFUSE` · ngay | **ĐÚNG** — mẫu chuẩn cho mọi câu đuổi khách trong file |
| 3 | "Dạ không bớt được đâu cô." | — | — | — | **ĐÚNG** |

---

### walkin.nhamquan — khách gọi hủ tiếu (16 nút)
`NPC_ONLY · FULL` · opener *"Cho tui tô hủ tiếu, ít hành nghen."*

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Dạ anh ơi, đây bán bánh mì anh." | — | — | — | **ĐÚNG** |
| 1.1 | "Dạ hổng sao anh. Ngày nào cũng có người nhầm hà." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.1 | "Dạ anh ăn gì anh? Đầy đủ nghen anh?" | (nhánh cha) · `!t.hasOrder` | — | `SET_ORDER(day-du)` | **SỬA**: hỏi món một người đã có món trong đầu; và câu chốt món không chốt món nào |
| 1.1.2 | "Anh ăn bánh mì rồi chút qua hủ tiếu cũng được anh." | `w.hasQuanHuTieu` | — | — | **CẦN CODE**: không có quán hủ tiếu nào trong `src/world/map.ts` |
| 1.1.3 | "Dạ hủ tiếu đầu hẻm kìa anh, anh đi thẳng chút là tới." → `ref: ket` | `w.hasQuanHuTieu` | — | — | **CẦN CODE**: chỉ đường tới một chỗ không tồn tại — đúng kiểu *"vào đứng cho mát"* |
| 1.2 | "Dạ anh coi lại cái bảng hiệu giùm em anh." | `p.hasBangHieu` | — | — | **CẦN CODE**: thiếu khoá/đạo cụ bảng hiệu (`StallScene` có lớp nhãn, nhưng không có cờ nội dung đọc được) |
| 1.2.1 | "Dạ em xin lỗi anh. Em nói nhanh quá." → `ref: ket` | (nhánh cha) | — | — | **ĐÚNG** |
| 1.2.2 | "Dạ cái bảng to chình ình kìa anh." `act: REFUSE` | `p.hasBangHieu` | — | `REFUSE` · ngay | **CẦN CODE**: act đúng, khoá bảng hiệu thiếu |
| 1.3 | "Dạ." (im) | — | — | — | **ĐÚNG** |
| 2 | "Dạ hủ tiếu hết rồi anh, còn mỗi bánh mì hà." | `!p.soldOut` | — | — | **SỬA**: *"còn mỗi bánh mì"* nói lúc `p.soldOut` là nói dối ngay trước mặt |
| 2.1 | "Dạ hổng có. Em giỡn với anh thôi anh." → `ref: ket` | (nhánh cha) | — | — | **ĐÚNG** |
| 2.2 | "Dạ em giỡn anh. Đây bán bánh mì không hà anh." → `ref: ket` | (nhánh cha) | — | — | **ĐÚNG** |
| 2.3 | "Dạ anh đọc bảng đi anh." | `p.hasBangHieu` | — | — | **CẦN CODE** |
| 3 | "Anh đi chỗ khác mua giùm em, chỗ em bán bánh mì." `act: REFUSE` | — | — | `REFUSE` · ngay | **ĐÚNG** |
| ket:1 | "Dạ ổ của anh đây anh. Anh đi mạnh giỏi nghen." | `p.holdsFilled` | — | `GIVE_BREAD` · ngay | **CẦN CODE** |
| ket:2 | "Dạ bữa sau anh ghé nữa nghen anh." | — | `t.served` | — | **SỬA**: chào tạm biệt khi họ chưa cầm được ổ nào |

---

### walkin.donvp — đơn văn phòng tám ổ (19 nút)
`NPC_ONLY · FULL · day 4–40` · opener *"Chị ơi cho em tám ổ. Đợi em chút, em hỏi lại cả phòng cái đã."*

> **Lỗi cấp CUỘC:** cuộc này rút được cả lúc trong khay còn hai ổ. Một đơn tám ổ phải khoá
> `!p.soldOut` **và** tồn kho ≥ 8 — nếu không thì cả cây mười chín nút là một lời hứa không
> giữ được ngay từ `opener`.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Dạ em cứ hỏi đi, chị làm mấy ổ chắc chắn trước." | `!p.soldOut` | tồn ≥ 5 | `SET_ORDER(5 ổ)` + `WAIT_FOR_THEM` · ~30 s | **CẦN CODE**: nhận đơn năm ổ bằng mồm; đơn thật không đổi, và quãng đứng chờ họ hỏi phòng không tốn một giây bán nào |
| 1.1 | "Em đứng qua bên này chút cho người ta mua nghen em." `act: STEP_ASIDE` | **`w.queue >= 2`** | `t.queueing` | `STEP_ASIDE` · tới lượt | **SỬA**: act **đúng và có code** (`askStepAside`) — chỉ thiếu `need`: bảo người ta dạt ra khi sau lưng trống trơn là một câu vô nghĩa |
| 1.1.1 | "Hổng sao em. Đông quá thôi." | (nhánh cha) | `w.peak` hoặc `w.queue >= 2` | — | **SỬA**: *"đông quá"* phải đúng mới nói được |
| 1.1.2 | "Phòng em ăn sáng trễ dữ ha em." | (nhánh cha) | `w.slot(TRUA)` | — | **SỬA**: nói lúc 6 giờ sáng là trật |
| 1.1.3 | "Em hỏi lẹ giùm chị, chị còn hàng." | (nhánh cha) · `!p.soldOut` | — | — | **SỬA**: *"chị còn hàng"* phải đúng |
| 1.2 | "Phòng em mấy người vậy em?" | — | — | — | **ĐÚNG** |
| 1.2.1 | "Vậy chị làm một ổ chay, một ổ không pate nghen." (`rel=4`) | (nhánh cha) | — | `PROMISE(chay)` + `PROMISE(khong-pate)` · kiểm lúc đưa bánh | **SỬA**: ***free word nặng nhất cuộc*** — `rel +4` cho hai lời hứa về nhân bánh mà `deliver()` không hề biết. `PROMISE` **đã có code** |
| 1.2.1.1 | "Chị bán mấy năm rồi em." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.2.1.2 | "Chị ghi vô sổ đây nè em, khỏi lộn." | (nhánh cha) · `p.hasSoTay` | — | `WRITE_NOTE(don)` | **CẦN CODE**: có `src/sim/notebook.ts` nhưng nội dung không có cờ nào đọc được là đang cầm sổ |
| 1.2.1.3 | "Em ghi giấy mà em còn lộn hả em." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.2.2 | "Đứa chưa trả lời thì khỏi mua cho nó em." → `ref: ket` | (nhánh cha) | — | `SET_ORDER(7 ổ)` | **CẦN CODE**: cắt đơn tám xuống bảy bằng mồm, nhánh `ket:1` vẫn đưa **tám** ổ |
| 1.2.3 | "Em gọi lại đi em, chị chờ." → `ref: ket` | (nhánh cha) | — | `WAIT_FOR_THEM` · ~30 s | **CẦN CODE**: *"chị chờ"* là một quyết định kinh tế (mất giờ bán) mà không tốn gì |
| 1.3 | "Dạ em đứng đó chờ chút nghen em." → `ref: ket` | — | — | — | **ĐÚNG** |
| 2 | "Em chốt đơn rồi hẵng kêu nghen em. Chị làm rồi hổng đổi được." | — | — | — | **ĐÚNG** (nói thẳng luật nhà, không hứa gì) |
| 2.1 | "Chị nói vậy thôi. Em cứ hỏi đi em." → `ref: ket` | (nhánh cha) | — | — | **ĐÚNG** |
| 2.2 | "Ừ. Chốt rồi kêu chị." | (nhánh cha) | — | — | **ĐÚNG** |
| 3 | "Tám ổ mà em còn chưa biết ăn gì hả em. Qua chỗ khác đi em." `act: REFUSE` | — | — | `REFUSE` · ngay | **ĐÚNG** |
| ket:1 | "Dạ tám ổ của em đây nghen." | `p.holdsFilled` × 8 | — | `GIVE_BREAD` × 8 · ngay | **CẦN CODE**: tám ổ rời tay bằng một dòng chữ |
| ket:2 | "Bữa sau em chốt đơn rồi hẵng qua nghen em." | — | `t.served` | — | **ĐÚNG** |

---

### walkin.cay — hỏi ăn cay / ăn hành (9 nút)
`PLAYER_ONLY · SHORT` · opener *"Ủa. Kêu {self} hả?"* — **xem (W-1): opener này không bao giờ hiện**

> Cả chín nút là **câu chốt nhân bánh**, và không một nút nào chạm vào đơn hàng thật.
> Đây là cuộc đáng sửa nhất file theo tỉ lệ: nó nằm ngay cạnh cơ chế đã có (`PROMISE`).

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "{call} ăn cay được hông? Ớt {me} xắt sẵn nè." | `!t.hasOrder` | `t.ordering` | — | **SỬA**: hỏi nhân cho người đã gọi xong (`t.waiting`) hoặc đã cầm ổ (`t.served`) |
| 1.1 | "Để {me} bỏ nguyên trái ớt hiểm cho {call} nghen." | (nhánh cha) | — | `PROMISE(ot-hiem)` · kiểm lúc đưa bánh | **SỬA**: hứa một món vào ổ, `deliver()` không biết |
| 1.2 | "Ăn cay vầy chắc {call} quen từ nhỏ ha." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.3 | "Ừ. Một khoanh. {me} làm đây." | (nhánh cha) | — | `PROMISE(ot-mot-khoanh)` · kiểm lúc đưa bánh | **SỬA**: như 1.1 |
| 2 | "{call} ăn hành được hông? Nhiều người gắp ra lắm." | `!t.hasOrder` | `t.ordering` | — | **SỬA**: như nút 1 |
| 2.1 | "Vậy {me} làm đầy đủ cho {call} nghen." | (nhánh cha) | — | `SET_ORDER(day-du)` hoặc `PROMISE(day-du)` | **SỬA**: chốt nguyên một ổ đầy đủ bằng mồm; đưa ổ trơn ra vẫn không ai kêu |
| 2.2 | "Dễ ăn vầy đi đâu cũng sướng {call} ha." | (nhánh cha) | — | — | **ĐÚNG** |
| 2.3 | "Ừ. Vậy khỏi hỏi nữa." | (nhánh cha) | — | — | **ĐÚNG** |
| 3 | "{call} đứng chờ chút. {me} làm theo thường." | **`t.tier(QUEN)`** | `t.ordering` | `SET_ORDER(theo-thuong)` | **SỬA**: *"làm theo thường"* nói với một khách vãng lai — người **không có "thường"** nào hết (W-2) |

---

### walkin.lame — làm quen, khách mới tới khu (9 nút)
`PLAYER_ONLY · SHORT` · opener *"Hả? …À. {self} đang ngó cái bảng giá."* — **không bao giờ hiện (W-1)**

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "{call} mới tới khu này hả?" | **`t.firstTime`** | `t.lookingInside` | — | **CẦN CODE**: `visits` của khách vãng lai đếm theo **dáng người** (`walkin0..7`) nên người này đã ghé mười lần vẫn bị hỏi "mới tới hả" — thiếu khoá `t.firstTime` |
| 1.1 | "Vậy {call} ghé hoài nghen. {me} bán tới trưa." | (nhánh cha) | `w.slot(SOM)` | — | **SỬA**: *"bán tới trưa"* nói lúc 11 giờ là nói hớ |
| 1.2 | "Hẻm này hiền lắm {call}. Ở riết là quen hà." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.3 | "Mới hay cũ gì cũng một giá {call}." | (nhánh cha) | — | — | **SỬA**: khách đáp *"Thì {self} có hỏi giá đâu"* — trong khi `opener` nói rõ họ **đang ngó bảng giá**. Hai câu cãi nhau |
| 2 | "{call} đi làm sớm ha. Mới hơn sáu giờ hà." | — | `w.slot(SOM)` | — | **SỬA**: ***hard-code đồng hồ*** — `when` không có `slot`, nên câu này nổ được lúc 10 giờ |
| 2.1 | "Vậy {me} làm lẹ cho {call} nghen." | (nhánh cha) | `t.waiting` | `PROMISE(lam-le)` · 30 s | **SỬA**: hứa nhanh rồi thủng thẳng vẫn không sao (`calm=14` là lợi, không có mặt trái) |
| 2.2 | "Dậy sớm riết chắc tối {call} ngủ gục sớm ha." | (nhánh cha) | — | — | **ĐÚNG** |
| 2.3 | "…" (im) | — | — | — | **ĐÚNG** (đường ra) |
| 3 | "Thôi {call}. Hổng có gì đâu." | — | — | — | **ĐÚNG** (`rel −1`, khách đáp *"Kỳ ghê. Kêu rồi thôi"* — đúng người thật) |

---

### walkin.nang — nắng, kẹt xe (9 nút)
`PLAYER_ONLY · SHORT` · opener *"Nóng muốn xỉu. Đứng chút mà áo ướt nhẹp."* — **không bao giờ hiện (W-1)**

> **Lỗi cấp CUỘC:** `when` không có `rain: false` và không có khoá nóng. Cả cuộc nổ được
> giữa cơn mưa. `w.hot` **đã có sẵn** trong `worldfacts.ts`.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Nắng gắt quá {call} ha. Nhích vô trong cho đỡ." | — | `w.hot` · `w.shadeFree` | `STAND_IN_SHADE` · 20–30 s rồi về đúng chỗ cũ | **CẦN CODE**: ***đúng câu chủ dự án chỉ đích danh*** — *"vào đứng cho mát"* mà **không có ô nào để đứng** (`src/world/map.ts` không có ký tự chỗ mát), và họ gật xong đứng y chỗ cũ |
| 1.1 | "{call} uống miếng trà đá cho mát cái bụng." | (nhánh cha) · `p.hasTea` (`teaLeft > 0`) | — | `OFFER_TEA` · ~8 s | **CẦN CODE**: ***free word nặng*** — `serveTea()` có thật, trừ `teaLeft`, tốn `TEA_COST`, có đường **từ chối** (`refuseTea`); câu thoại này **không gọi gì cả**, chỉ ăn `rel +2 · calm +12` miễn phí |
| 1.2 | "Trưa còn gắt hơn nữa {call} à." | — | `w.hot` · `w.slot(SOM)` | — | **SỬA**: nói lúc 12 giờ trưa thì "trưa còn gắt hơn" là vô nghĩa |
| 1.3 | "Nắng thì ai cũng chịu chớ riêng gì {call}." | — | `w.hot` | — | **SỬA**: thiếu `while: w.hot` (xã giao thuần, nhưng khẳng định thời tiết) |
| 2 | "Ngoài ngã tư kẹt dữ hông {call}?" | — | — | — | **ĐÚNG** (câu hỏi thuần) |
| 2.1 | "Mấy ông đào đường đào cả năm hổng xong, chèn ơi." | `w.event(DAO_DUONG)` | — | — | **CẦN CODE**: khẳng định một sự kiện ngoài đường mà hệ sự kiện (`src/content/events`) không có cờ nào tương ứng |
| 2.2 | "Vậy chắc {call} dậy sớm lắm mới kịp giờ." | (nhánh cha) | — | — | **ĐÚNG** |
| 2.3 | "Đường sá vậy đó {call}. Than hoài cũng vậy hà." | (nhánh cha) | — | — | **ĐÚNG** |
| 3 | "Nóng thì nóng chung. {call} đứng chờ như người ta đi." | **`t.impatient`** | `w.hot` · `w.queue >= 2` | — | **SỬA**: ***họ hàng của "chị chen hàng"*** — mắng người ta không chịu xếp hàng tử tế trong khi **không ai kiểm họ có càu nhàu hay không** |

---

### walkin.dienthoai — khách cắm mặt vô điện thoại (9 nút)
`PLAYER_ONLY · SHORT` · opener *"Hả? …À. Chờ chút, {self} coi cái tin nhắn."* — **không bao giờ hiện (W-1)**

> **Cả cuộc này là "chị chen hàng" đội lốt khác:** chín nút buộc tội một người đang bấm điện
> thoại, mà **không có khoá nào ghi lại việc họ có bấm điện thoại hay không**. Bỏ `opener` đi
> (W-1) thì người chơi tự nhiên quay sang một người đang đứng yên và nói *"Coi gì mà say sưa vậy"*.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Coi gì mà say sưa vậy {call}? Kể {me} nghe với." | **`t.onPhone`** | `t.ordering` | — | **CẦN CODE**: thiếu khoá `t.onPhone` |
| 1.1 | "Tào lao mà {call} coi quên cả ăn sáng." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.2 | "Cất máy đi rồi ăn cho ngon {call}." | (nhánh cha) | `t.onPhone` | `PUT_PHONE_AWAY` · tới hết lượt ghé | **CẦN CODE**: bảo cất máy, máy không cất, và `t.onPhone` vẫn đúng ở nút sau |
| 1.3 | "Thôi. {call} coi tiếp đi." | (nhánh cha) | `t.onPhone` | — | **CẦN CODE**: thiếu khoá |
| 2 | "{call} ngó lên cái. Nãy giờ {me} hỏi hoài." | **`t.onPhone`** · `c.askedTwice` | `t.ordering` | — | **CẦN CODE**: *"nãy giờ hỏi hoài"* — chưa hỏi câu nào cũng nói được |
| 2.1 | "Hổng sao {call}. Cái máy nó hút hồn mà." | (nhánh cha) | — | — | **ĐÚNG** |
| 2.2 | "{call} kêu món đi. {me} còn người sau." | **`!t.hasOrder`** | `w.queue >= 2` | `SET_ORDER` | **SỬA**: giục gọi món một người đã gọi món; *"còn người sau"* nói lúc hẻm trống |
| 2.3 | "Cắm mặt vô cái máy hoài. {call} có mua hông vậy?" | **`t.onPhone`** · **`!t.hasOrder`** | `t.ordering` | `REFUSE` · ngay | **CẦN CODE**: ***câu buộc tội nặng nhất cuộc*** — `rel −3 · anger 60` ném vào một người có thể đã gọi món xong và chưa từng mở điện thoại |
| 3 | "{call} coi máy đi. Xong {me} kêu." | — | `t.onPhone` | `WAIT_FOR_THEM` · tới khi họ cất máy | **CẦN CODE**: hứa sẽ gọi họ, không có gì gọi |

---

### walkin.chen — chen hàng (8 nút)
`PLAYER_ONLY · SHORT` · opener *"Ủa. {self} đứng đây nãy giờ mà."* — **không bao giờ hiện (W-1)**

> **ĐÂY LÀ CUỘC CHỦ DỰ ÁN CHỈ ĐÍCH DANH.** Tám nút, tám câu nhắc/mắng về thứ tự hàng,
> **`need` = ∅ ở cả tám**. `t.cutLine` đã nằm sẵn trong `worldfacts.ts` và vẫn chưa ai dùng.
> Và `STEP_ASIDE` — act **đã có code chạy được** (`service.askStepAside`, có cả đường họ
> **không nhúc nhích**) — không được gắn vào một nút nào trong cuộc này.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Có người tới trước {call} đó. {me} làm theo thứ tự nghen." | **`t.cutLine`** | `w.queue >= 2` | `STEP_ASIDE` · tới lượt | **SỬA**: ***nguyên văn câu chủ dự án kêu*** — *"trong khi bà ấy có chen hàng thật đâu"* |
| 1.1 | "Hổng sao {call}. Đứng chút xíu là tới hà." | (nhánh cha) | `w.queueAtMost(2)` | — | **SỬA**: hứa "chút xíu là tới" khi trước mặt còn năm người |
| 1.2 | "{call} nhớ giùm {me}. Chỗ này ai cũng phải chờ." | **`t.cutLine`** | `w.queue >= 2` | — | **SỬA**: dạy đời về hàng lối khi không có hàng |
| 1.3 | "Vậy {call} chờ tới lượt." | **`t.cutLine`** | `w.queue >= 2` | `STEP_ASIDE` · tới lượt | **SỬA**: thiếu cả `need` lẫn `act` |
| 2 | "{call} chen cái gì mà chen vậy? Ra sau xếp hàng đi." | **`t.cutLine`** | `w.queue >= 2` | `STEP_ASIDE` · tới lượt | **SỬA**: ***nút tệ nhất cả bốn file*** — `rel −3 · anger 65` ném vào mặt một người xếp hàng ngay ngắn, và sau khi mắng xong **không ai lùi một bước nào** |
| 3 | "Thôi. Tới đâu hay tới đó {call}." | **`t.cutLine`** | `w.queue >= 2` | `LET_CUT` · tới lượt (người sau bị đẩy xuống) | **CẦN CODE**: cho người ta chen bằng mồm; thứ tự hàng không đổi, người bị chen không biết gì |
| 3.1 | "{call} ăn đầy đủ nghen?" | `!t.hasOrder` | `t.ordering` | `SET_ORDER(day-du)` | **SỬA** |
| 3.2 | "Ai lẹ chân nấy được {call} ha." | **`t.cutLine`** | — | — | **SỬA**: giỡn về chuyện chen hàng mà không ai chen |

---

## 1. Thống kê

| | số nút |
|---|---|
| **Tổng** | **133** |
| `ĐÚNG` | 54 |
| `SỬA` | 47 |
| `CẦN CODE` | 32 |
| `XOÁ` | 0 |

Không có nút nào đáng `XOÁ`: nội dung của `walkin.json` viết chắc tay, vấn đề nằm đúng chỗ
hợp đồng nói — **nó nói về một thế giới game chưa mô phỏng**. 79/133 nút (59,4%) phải động vào.

Ba con số đáng nhớ:
* **0/133 nút có `need`.** Cả kho khách vãng lai không có một cái cổng điều kiện nào.
* **1/133 nút có `while`** (`chemac` 1.1, vừa được thêm giữa lúc rà).
* **9/133 nút có `act`** (6,8%) — và sáu trong số đó là `REFUSE`/`DISCOUNT`, tức là chỉ hai
  nhóm hệ quả được nối dây thật.

---

## 2. Đề xuất khoá mới

| khoá | vì sao cần | nút nào đòi |
|---|---|---|
| `t.eating` | sau `GIVE_BREAD`, cả nhánh con nói chuyện với một người đang nhai | chemac 1.1.1 · 1.1.2 · 1.1.3 |
| `t.onPhone` | chín nút của `walkin.dienthoai` buộc tội một chuyện không ai ghi lại | dienthoai 1 · 1.2 · 1.3 · 2 · 2.3 · 3 |
| `t.firstTime` | `visits` đếm theo **dáng người** nên khách ghé mười lần vẫn bị hỏi "mới tới hả" | lame 1 |
| `t.orderSize >= N` | bớt tiền theo số lượng mà không ai kiểm số lượng | traigia 1 |
| `w.queueAtMost(N)` | `w.queue >= N` chỉ chặn được một chiều; "đứng chút xíu là tới" cần chiều kia | chen 1.1 |
| `w.slot(X)` | sáu nút hard-code giờ (*"mới hơn sáu giờ"*, *"bán tới trưa"*, *"trưa còn gắt hơn"*) trong khi `TalkWhen.slot` chỉ khoá được **cả cuộc**, không khoá được **một nút** | lame 1.1 · 2 · nang 1.2 · donvp 1.1.2 |
| `w.event(X)` | khẳng định một sự kiện ngoài đường (đào đường) | nang 2.1 |
| `p.hasTea` | **đã có trong `worldfacts.ts`**, chỉ chưa ai dùng — ghi ở đây để không ai đi đặt lại | nang 1.1 |
| `p.hasBangHieu` · `p.hasSoTay` | thoại chỉ tay vào hai đạo cụ không có cờ nào đọc được | nhamquan 1.2 · 1.2.2 · 2.3 · donvp 1.2.1.2 |
| `p.margin <= N` | *"em bớt là em lỗ"* — game có số liệu giá vốn, thoại thì nói dối tự do | traigia 2.1 |
| `w.hasQuanHuTieu` | chỉ đường tới một quán không có trên bản đồ | nhamquan 1.1.2 · 1.1.3 |
| `c.askedTwice` | *"nãy giờ hỏi hoài"* nói được ngay câu đầu tiên | dienthoai 2 |

---

## 3. Hành động cần code

| hành động | câu nào đòi | thời lượng đề xuất | thiếu gì trong game |
|---|---|---|---|
| **`need` đi qua `holds()`** | **mọi nút có `need: t.*` / `c.*` / `w.*` trong bảng trên (34 nút)** | — | `visibleOptions()` vẫn chỉ tra `gate.flags`. Chưa sửa chỗ này thì mọi `need` của §3.2 viết vào JSON sẽ **ẩn mất nút**, không phải khoá nó đúng cách. **Việc đầu tiên phải làm** |
| **Nuôi `t.cutLine`** | chen 1 · 1.2 · 1.3 · **2** · 3 · 3.2 · nang 3 | cho tới hết lượt ghé | `Customer.cutLine` khai rồi mà **không ai gán `true`**. Cần `assignSlots()`/hàng đợi ghi lại việc một người vượt lên trước người tới trước |
| **`forSec`** | mọi act có thời lượng (`STAND_IN_SHADE`, `SIT_DOWN`, `GIVE_BREAD`, `OFFER_TEA`) | — | `TalkAct` không có trường thời lượng nào; hết giờ phải **về đúng mục đích cũ**, không bốc hơi, không đứng mãi |
| `GIVE_BREAD` | chemac 1.1 · cau di:1 · nhamquan ket:1 · donvp ket:1 | tới khi ăn xong (~20 s) | ổ phải **rời tay** người chơi (`player.hand` → `empty`), khách cầm, có trạng thái đang ăn (`t.eating`). Hiện việc đưa bánh chỉ có một đường duy nhất là `deliver()`, thoại không với tới |
| `OFFER_TEA` | nang 1.1 | ~8 s | **nửa đường đã có**: `serveTea()` trừ `teaLeft`, tính `TEA_COST`, và `refuseTea()` là đường từ chối thật (theo `soi` + `teaSuspect`). Chỉ thiếu một `TalkAct` gọi vào nó |
| `STAND_IN_SHADE` / `LEAVE_SHADE` | nang 1 | 20–30 s rồi **về đúng mục đích cũ** | **không có ô hóng mát** trong `src/world/map.ts`; `w.shadeFree` trong `worldfacts.ts` hiện không có gì nuôi nó |
| `SIT_DOWN` | cau 1.1.3 | tới khi phục vụ xong | `GHE_BAN` là thiết bị mua được và `StallScene` có vẽ, nhưng không có act nào đặt người ngồi xuống. Hiện nội dung mượn tạm `STEP_ASIDE` — **sai nghĩa**: `askStepAside` gọi `yieldSlot()`, tức là *nhường chỗ trong hàng*, không phải *ngồi* |
| `WALK_ON` | quayclip 2.4 | ngay | khách nói *"tui đi chỗ khác"* rồi vẫn đi tiếp xuống nhánh kết sổ |
| `SET_ORDER(X)` / `PROMISE` đúng chỗ | cay 1.1 · 1.3 · 2.1 · 3 · donvp 1 · 1.2.1 · 1.2.2 · nhamquan 1.1.1 · chen 3.1 | kiểm lúc `deliver()` | `PROMISE` **đã có code** (treo vào `pledges`, vỡ thì `BROKEN_PROMISE`). Mười nút chốt nhân/chốt đơn bằng mồm mà không gọi nó — đây là nhóm sửa **rẻ nhất và lời nhất** cả file |
| `LET_CUT` | chen 3 | tới lượt | cho một người chen lên — ngược chiều `yieldSlot()`, và phải để người bị chen **thấy** |
| `WAIT_FOR_THEM` | donvp 1 · 1.2.3 · dienthoai 3 | 20–40 s | *"chị chờ"* phải tốn giờ bán thật (`clock.busy`), nếu không thì đứng chờ khách hỏi phòng là miễn phí |
| `FILM_CLIP` | quayclip 1 · 1.1 · 2 · 3 | tới hết cuộc, hệ quả rơi vào **ngày mai** | cả cuộc 17 nút không một `act`; cho quay hay cấm quay thì hôm sau khách y hệt nhau |
| `PUT_PHONE_AWAY` | dienthoai 1.2 | tới hết lượt ghé | cần `t.onPhone` trước đã |
| `COLLECT(priceOf)` | quayclip di:2 | ngay | lời thoại **hard-code 25.000₫** trong khi `econ.priceOf(g, day)` đổi theo ngày và theo sự kiện |

---

## 4. §4.1 — chia `need` / `while` theo TĨNH hay ĐỘNG

> *"Hạn chế hiện câu gợi ý trả lời lạc đề."* `?` là lưới an toàn, không phải đường đi chính.
> Mốc: dưới 5% số nhịp kết bằng `?`.

Bảng trên **đã được xếp lại theo luật này**: thứ người chơi không đổi được trong lúc thẻ mở
(thẻ khoá phím) nằm ở cột **TRƯỚC (`need`, ẩn hẳn)**; thứ người khác và thế giới đổi được
giữa lúc đang đọc nằm ở cột **LÚC NÓI (`while`, ra `?`)**.

| nhóm | khoá trong file này | xếp | vì sao |
|---|---|---|---|
| **TĨNH → `need`** | `p.holdsBread` · `p.holdsFilled` · `p.hasTea` · `p.handsEmpty` · `p.atCounter` · `!p.soldOut` · `p.hasBangHieu` · `p.hasSoTay` · `p.margin` · `t.cutLine` · `t.hasOrder` · `t.firstTime` · `t.orderSize` · `t.toldMe(X)` · `w.hasQuanHuTieu` · `w.event(X)` | **40 nút** | tay người chơi và sổ ghi quá khứ đứng yên suốt lúc thẻ mở. Bày ra rồi chặn là trêu người chơi |
| **ĐỘNG → `while`** | `t.ordering` · `t.waiting` · `t.served` · `t.eating` · `t.impatient` · `t.onPhone` · `w.queue(N)` · `w.queueAtMost(N)` · `w.hot` · `w.slot(X)` · `w.peak` · `w.shadeFree` · `t.inShade` | **46 nút** | đồng hồ vẫn chạy trong lúc đọc: hàng dài ra, họ hết kiên nhẫn, họ cất điện thoại, chỗ mát bị người khác chiếm |

**Ba chỗ dễ xếp nhầm nhất trong file này — ghi rõ để người sửa khỏi phân vân:**

1. **`p.holdsFilled` là TĨNH.** Bốn câu *"ổ của anh đây"* (`cau` di:1 · `nhamquan` ket:1 ·
   `donvp` ket:1 · `quayclip` di:1) phải **ẩn hẳn** khi tay không — không được bày ra rồi
   trả `?`. Người chơi nhìn tay mình là biết, bày ra là trêu.
2. **`t.cutLine` là TĨNH** (đã chen là đã chen, có sự kiện ghi lại) ⇒ `need`, **ẩn hẳn**.
   Sáu nút của `walkin.chen` vì vậy **biến mất sạch** với một người xếp hàng tử tế — và đó
   đúng là điều phải xảy ra: không có ai chen thì **không có câu nào để nói về chuyện chen**.
3. **`t.impatient` là ĐỘNG** ⇒ `while`. `walkin.cau` 2 (*"anh mới đứng có một phút à anh"*)
   gắn `!t.impatient` dạng `while` là đúng: họ có thể vượt ngưỡng kiên nhẫn **đúng lúc người
   chơi đang đọc ba dòng lựa chọn**, và lúc đó câu cãi lại phải ra `?`, không được ẩn ngược.

**Rủi ro đã thấy:** `walkin.cay` (9 nút) và `walkin.dienthoai` (9 nút) nếu gắn `while` cho
`!t.hasOrder` / `t.onPhone` thì tỉ lệ `?` sẽ vọt lên xa quá 5%, vì **cả cuộc chỉ có một chủ
đề**. Hai cuộc này phải khoá ở **cấp cuộc** (`TalkWhen`) chứ không phải cấp nút — không có
ai đang bấm điện thoại thì **đừng rút cuộc `dienthoai` ra**.

---

## 5. §4bis — LỜI HỨA CÓ HẠN

> *"Nếu đi rót trà mà họ không rót, bắt người ta đợi, thì họ cũng bỏ đi hay ít nhất chửi rồi bỏ đi."*

### 5.1. Hứa LÀM NGAY TẠI CHỖ — hạn tính bằng giây thật

| nút | hứa gì | hạn | giữ lời | **NUỐT LỜI** |
|---|---|---|---|---|
| `nang` 1.1 | rót ly trà đá | **25 s** | `CARED_FOR_THEM` theo `takeTea(cup)` (đã có) | nấc 1 *"Ly trà đâu {call}?"* → nấc 2 `anger 20` + nói nặng → nấc 3 **bỏ đi**. Nóng tính bỏ thẳng nấc 1 |
| `nang` 1 | *"nhích vô trong cho đỡ"* | **15 s** để dẫn họ tới chỗ mát | `STAND_IN_SHADE` · 20–30 s | họ đứng y chỗ cũ, `rel −1`, và **câu mời đó cả lượt ghé không nói lại được** (`v.promised(shade)`) |
| `cau` 1.1.3 | *"anh ngồi xuống ghế đợi em chút"* | **15 s** | `SIT_DOWN` tới khi phục vụ xong | đứng mãi giữa lời mời ngồi — `anger 15` rồi thôi |
| `cau` 1.2 | *"đợi em một phút nữa thôi"* | **60 s**, nói rõ con số | giao bánh trong 60 s → `calm` giữ nguyên | quá 60 s: `anger 25` + *"Một phút của em dài ghê"* → quá 120 s **bỏ đi** |
| `cau` 1 · `app` ket:1 · `lame` 2.1 | *"em làm liền / làm lẹ cho"* | **30 s** | `calm` giữ nguyên | quá hạn thì `calm` vừa ăn **bị thu lại** — đây là chỗ hiện tại lời ngon ngọt là lãi ròng |
| `donvp` 1.2.3 | *"em gọi lại đi em, chị chờ"* | **30 s** đứng chờ thật | — | **ngược chiều**: người chơi nuốt lời bằng cách bỏ đi làm việc khác; khách mất mặt, `rel −2` |

### 5.2. Hứa CHO NGÀY KHÁC — kiểm ở lần ghé sau

Kho `walkin` **không có loại này**, và đó là một kết luận chứ không phải chỗ trống:
khách vãng lai dùng chung `memKey` theo **dáng người** (`walkin0..7`), nên không có "lần ghé
sau" của *người này*. Mọi câu kiểu *"bữa sau anh ghé nữa nghen"* (`nhamquan` ket:2 ·
`chemac` 1.1.2 · `traigia` 1.1) vì vậy **đúng là xã giao thuần, không phải lời hứa** — không
ai nợ ai. Giữ nguyên.

**Ngoại lệ duy nhất cần dựng:** `donvp` 1.2.1.2 (*"chị ghi vô sổ đây nè em"* → khách hỏi xin
số điện thoại để **đặt trước**). Đây là lời hứa cho ngày khác thật sự, và hiện không có gì
nhận nó.

### 5.3. Phải NHÌN THẤY được lúc đang treo (CANON T5)

Sáu lời hứa ở §5.1 đều **vô hình**. Phạt người chơi vì quên rót ly trà mà game không nhắc là
phạt trí nhớ, không phải phạt lựa chọn. Cần một chỉ báo trên đầu người đang đợi (ly trà mờ,
cái ghế nhấp nháy) **và** một dòng ở khung nhắc.

---

## 6. §4ter — TRÍ NHỚ BỐN TẦNG

| tầng | khoá | file này dùng được không |
|---|---|---|
| **trong cuộc** `c.*` | `c.angered` · `c.saidTone(X)` | **có `snapshot().convo` nuôi thật** (`talkAngered`, `picked.map(tone)`) — nhưng **0/133 nút đọc tới**. File này không cần: mọi `GAT` đều `silent` + không có `then` nên cuộc chết tại đó |
| **trong lượt ghé** `v.*` | `v.gaveTea` · `v.promised(X)` · `v.apologised` | **không có tầng này trong code**. Cần cho §5.1: không được mời trà hai lần trong một lượt ghé, không được hứa lại thứ vừa hứa |
| **trong ngày** `d.*` | `d.metToday` · `d.toldMe(X)` | **không có**. `usedToday` có theo *chủ đề*, nhưng không có khoá nào cho nội dung đọc |
| **cả mùa** `m.*` | `m.visits(N)` · `m.tier(X)` · `m.remembers(E)` | `mem.visits`, `mem.tier`, `record()`/`decay()` **đã có đủ trong `sim/memory.ts`** — thiếu đúng một đường cho nội dung đọc |

### Luật cứng — câu giả định "lần đầu gặp"

| nút | câu | phải khai | hiện trạng |
|---|---|---|---|
| `lame` 1 | "{call} mới tới khu này hả?" | **`need: "!m.visits(2)"`** | không có gì. Và tệ hơn: `memKey` của khách vãng lai dùng chung theo **dáng người**, nên `m.visits` của *"chị đeo khẩu trang"* là tổng của mọi chị đeo khẩu trang cả mùa. **Khoá này với kho `walkin` chỉ đúng được nếu đổi `memKey`** |
| `lame` 1.2 | "Hẻm này hiền lắm {call}. Ở riết là quen hà." | `need: "!m.visits(2)"` | như trên |
| `cay` 3 | "{me} làm theo thường." | **`need: "m.visits(5)"`** — ngược lại | nói với người lần đầu ghé |
| `chemac` 1.1.2 | "Ngon thì anh ghé nữa nghen anh." | `need: "!m.visits(2)"` | mời người ghé lần thứ mười "ghé nữa" |

### Luật cứng — câu NHẮC LẠI một chuyện

*Nhớ nhầm một chuyện chưa từng xảy ra là lỗi nặng hơn quên.* Trong `walkin.json` có **đúng
một** nút phạm: `chemac` 2.1 (*"Chú Kiệt bán cũng đàng hoàng mà anh"*) — người chơi gọi tên
một người mà cuộc này chưa hề nhắc; phải khai `need: "m.remembers(kietLaDoiThu)"`.

Phần còn lại sạch, **vì một lý do không đáng mừng**: khách vãng lai không có chuyện gì để
nhớ. Tầng `m.*` của kho này rỗng theo thiết kế, và đó chính là lý do `cay` 3 (*"làm theo
thường"*) và `lame` 1 (*"mới tới khu này hả"*) **cùng sai một lúc** — không có `m.visits`
đúng cho từng người thì cả hai đầu của trục "quen hay lạ" đều không neo được.
