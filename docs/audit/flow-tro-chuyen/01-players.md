# 01 — PANEL NGƯỜI CHƠI: 4 phiên chơi thật với flow trò chuyện

> Đọc code trước khi viết: `src/sim/talk.ts`, `src/ui/stall/TalkPanel.ts`,
> `src/sim/service.ts` (§trò chuyện 2285–2470, `applyAct`/`invite` 2577–2680,
> `offerTalk` 2845, `smalltalk` 1480–1490, `leave` 1615, `talkKey`/`talkCtx` 2530–2555),
> `src/scenes/StallScene.ts` (`bindInput` 957–995, `promptLine` 1251–1287, `drainService`
> 1365–1410, `askFront`/`openTalkPanel`/`pickTalk`/`ignoreTalk` 2108–2155),
> `src/sim/passersby.ts`, `src/sim/overhear.ts`, `src/ui/Hud.ts` (toast 296–330, feed
> 340–386), `src/ui/AssemblyPanel.ts` (`handleKey` 546, `park` 530),
> `src/world/map.ts`, `src/content/days/day_index.json`, cả 14 file
> `src/content/talks/*.json`.

**Khung thời gian của một phiên.** Ngày game 6:00 → 11:00, `timeScaleBase = 30` →
1 giây thật = 30 giây game. Một ngày trọn = ~10 phút thật. PEAK 6:30–8:00 = ~3 phút
thật. Nên "một phiên 10–15 phút" ≈ đúng một ngày rưỡi trong game. Mọi mốc giờ dưới đây
là giờ GAME, mọi con số giây là giây THẬT.

**Một con số cần biết trước khi đọc.** Trong hai ngày đầu, cả kho 14 file chỉ có **ĐÚNG
MỘT** cuộc mà NPC có thể tự mở lời: `bay.veso` của bà Bảy, `initiates: 0.3`. Mọi cuộc
`initiates` còn lại đều khoá sau `day ≥ 5` (1 cuộc), `day ≥ 9` + `minVisits ≥ 4` (14
cuộc còn lại). `walkin.json` và `qua-duong.json` có **0 cuộc** `initiates`. Nghĩa là:
suốt tuần đầu tiên — đúng cái tuần người chơi hình thành toàn bộ mô hình về game — thế
giới này **gần như không bao giờ nói trước**. Bốn phiên dưới đây đều chơi trong tuần đó.

---

# 1 · MINH, 28 tuổi — dân cozy-sim

> *Stardew 400 giờ. Unpacking hai lần. Dave the Diver đang dở. Mua game này vì cái
> screenshot con hẻm và vì đọc được chữ "khách đứng cách nửa mét và nhìn thấy mọi thứ
> bạn làm". Chơi buổi tối, đèn vàng, tai nghe. Không thích bị giật mình.*

## Phiên: Ngày 1 → nửa Ngày 2 (~13 phút thật)

### 6:04 — "Ủa, cái hẻm này đẹp thiệt"
Chưa có khách. Mình đi loanh quanh, đọc nhãn trạm: kệ bánh, lò than, thớt, bồn rửa.
Có người đi ngang ngoài đường — một chị đeo khẩu trang, đi từ trái qua phải, không ngó.
Mình thích chuyện này. Game nào cũng để đường phố trống trơn, game này có người đi.

Mình thử đi ra gần chị đó. Dưới màn hình hiện: `F — nói chuyện với chị đeo khẩu trang`.
**Sướng.** Lần đầu tiên trong một game nấu ăn mình thấy cái gợi ý đó.

Bấm F. Panel mở. Chị đó nói: *"Anh ơi, hẻm 54 đi lối nào vậy?"*

…Khoan. **Mình** đi tới. **Mình** bấm F. Sao **chị ấy** lại là người hỏi đường?

> **Minh:** "Ơ. Tôi đi tới gạ chuyện mà sao thành bả bắt chuyện tôi? Vậy nãy giờ bả đứng
> chờ tôi lại gần để hỏi đường hả?"

Mình chọn "Dạ chú đi thẳng, tới cây me quẹo phải." Chị ấy đáp một câu. Hết. Panel đóng.
Dễ thương. Mình vẫn lăn tăn cái chỗ ai mở lời.

### 6:31 — khách đầu tiên, và cái phản xạ sai đầu tiên
Bà Bảy tới, đứng slot đầu, nói nguyên văn câu gọi món, phiếu ghim lên góc phải. Mình đi
lấy ổ, bỏ lò. Trong lúc chờ lò, mình nghĩ: "chơi cozy mà, nói chuyện với bà cái."

Bấm F. **Không có gì xảy ra.** Màn hình đứng im hoàn toàn, không toast, không âm thanh,
không nhúc nhích.

> **Minh:** "Phím hỏng hả? …À không, tại tay đang bận."

Đúng — `askFront()` ở `StallScene.ts:2109` là
`if (this.handsBusy || this.paused || this.closed || this.talk.isOpen) return;` — **return
câm**. Trong khi phím G ngay cạnh đó (`writeDebt`, dòng 1420) thì **xếp hàng cú bấm lại**
và HUD còn ghi rõ "(ghi ngay khi rảnh tay)". Hai phím nằm cạnh nhau, hai triết lý ngược
nhau, và cái câm là cái duy nhất người chơi bấm thường xuyên.

### 6:33 — panel mở ra, và cái hẻm biến mất
Lò xong, tay rảnh. Bấm F. Panel trượt lên từ đáy màn hình.

Nó **to**. Rộng 620px trên khung 1024, cao tới 56% chiều cao màn hình. Nó che mất cái
thớt, che mất chân khách, và — chỗ này mới đau — nó che luôn **ô nhật ký lời người ở
góc trái dưới**. Mình chọn một câu, câu mình nói bay xuống ô đó (`routeLine` →
`hud.say`, `Hud.ts:367`, ô nằm ở `(26, GAME_H-100)` = y 476), mà panel có `depth
9_400_000` còn HUD có `depth 9_000_000` (`Hud.ts:12`). **Panel nằm đè lên.** Cái
`dockFeed()` dời ô nhật ký sang phải thì chỉ được gọi cho bảng kẹp nhân thôi
(`StallScene.ts:1174` — grep cả repo chỉ có đúng một chỗ gọi).

Nên: mình chọn câu → panel vẽ lại → mình chỉ thấy **câu bà Bảy đáp**. Câu **mình** vừa
nói thì nằm dưới gầm cái panel đang che nó.

> **Minh:** "Ủa tui vừa nói gì vậy ta? Tui bấm số 2 mà tui quên mất dòng số 2 nó ghi gì
> rồi. Giờ bả đang trả lời cái gì tui cũng không chắc."

Cái này giết đúng thứ mình tới đây để lấy: **nhịp hội thoại**. Một cuộc nói chuyện là
"tôi nói — họ đáp". Ở đây là "họ đáp — họ đáp — họ đáp", còn phần mình nói thì bị xoá
ngay khi vừa bấm.

### 6:48 — cái mặt nhỏ xíu, và mình thích nó
Bà Bảy đáp một câu buồn, bên trái câu nói có một cái mặt vẽ ba lớp (mày/mắt/miệng) và
dưới nó một chữ: "rưng rưng". **Rất hay.** Đây là chi tiết đắt nhất của cả hệ thống.
Mình ngồi nhìn nó 3 giây.

Rồi mình nhận ra: mình đang nhìn một **cái huy hiệu 22px** thay vì nhìn **mặt bà Bảy
đang đứng cách mình nửa mét**. Panel cao 56% màn hình, bà Bảy ở y=7.6 trên bản đồ iso —
tuỳ camera, thường thì chỉ còn thấy từ vai lên. Game quảng cáo "a game about being
watched while you work" rồi lúc nói chuyện thì lấy một cái icon nhỏ xíu thay cho khuôn
mặt thật.

### 7:12 — Esc, và cái giá mình không hề biết
Hai người đứng quầy. Mình mở F với người thứ nhất, đọc 3 lựa chọn, thấy lựa chọn nào
cũng không giống mình, nên bấm **Esc** để đóng ra làm bánh tiếp.

Không có gì hiện ra. Game chạy tiếp bình thường.

Nhưng trong `Service.closeTalk()` (`service.ts:2366`): nếu `engaged` (mình đã chọn một
câu rồi) hoặc `npcOpened` thì `applyIgnore()` chạy → `rel: -1` mặc định
(`DEFAULT_IGNORE_REL`). Và T3 cấm hiện số, nên **mình vừa mất điểm với một người mà
mình không hề biết là mình mất**. Mình chỉ muốn đóng cái bảng ra.

> **Minh:** "Tôi tưởng Esc là nút đóng. Mọi game đều vậy. Ở đây Esc là một **câu trả
> lời**? Mà nó không nói cho tôi biết?"

Đau nhất là chỗ này: cái hint cuối panel có ghi `Esc làm thinh`. Chữ "làm thinh" đó rất
hay về mặt văn, nhưng ở cỡ 11px, màu `UI.muted`, nằm ở dòng cuối cùng — nó đọc ra như
một chú thích phím tắt, không ra như một cảnh báo. Và nó **không nói là có giá**.

### 7:40 — "hết chuyện để nói… bữa nay"
Bấm F với bà Bảy lần thứ tư trong ngày. Toast: **"hết chuyện để nói với bà Bảy bữa nay
rồi"**.

OK, fair. Mai nói tiếp.

Mai không nói tiếp được. `talkCtx.usedSeason = m.talksDone` (`service.ts:2545`) là danh
sách **cả mùa**, không reset theo ngày. File `ba-bay.json` có **6 cuộc**. Hết 6 cuộc là
hết, vĩnh viễn, 40 ngày. Mà câu thông báo thì ghi "**bữa nay**".

> **Minh:** "Nó nói 'bữa nay rồi' nên tôi bấm F với bà Bảy mỗi sáng suốt bốn ngày. Bốn
> ngày liền cùng một dòng chữ. Tôi tưởng tôi làm sai cái gì đó."

Đây là chỗ hệ thống **phản bội thẳng** người cozy. Mình chơi game này để **thân dần với
người ta**. Hệ thống thì ngược lại: càng nói chuyện nhiều, càng nhanh hết chuyện, và
càng sớm tới cái ngày bà Bảy vĩnh viễn không còn gì nói với mình. Nói chuyện ở đây là
một **tài nguyên tiêu hao**, không phải một **mối quan hệ**.

### Ngày 2, 6:50 — người qua đường, và 4 giây
Quán vắng. Mình thấy một bà cụ đi ngang, có ngoái nhìn cái xe. Mình bước ra, bấm F.
Cuộc `duong.mui`: *"Thơm dữ ta. Bánh mì hả cô?"* Mình chọn "Dạ bánh mới ra lò đó bà."
Nhịp 2 hiện ra, có một dòng mép vàng/xanh: **"Bà ăn thử một ổ cho biết nghen?"** — đây
là `act: INVITE`.

Mình bấm. Cái mặt đổi sang "cười gượng". *"Thôi, tui ăn sáng rồi. Bữa khác nghen."*
Nhật ký: "bà cụ đi tiếp."

Buồn, nhưng hay. Đúng kiểu cozy. Mình chịu.

Rồi mình quay lại quầy. Và nhận ra: **lời mời nằm ở độ sâu 2** — tất cả 8 `INVITE` trong
`qua-duong.json` đều ở `depth 2`. Nghĩa là muốn mời ai, mình phải chịu ít nhất một nhịp
nói chuyện trước. Hợp lý về văn. Nhưng kết hợp với `PASSER_TALK_STAY = 4`
(`service.ts:105`) — mời xong họ chỉ còn 4 giây trong hẻm — và với việc chỉ 30% người đi
ngang dừng lại (`GLANCE_CHANCE`), thì cái việc "bước ra mời khách lúc vắng" là một thao
tác **canh me** chứ không phải một hành động thư thái.

### Minh học được luật sai nào
1. **"Đừng bấm F lúc tay bận"** — không phải vì nó phạt, mà vì nó **không phản hồi gì
   cả**, nên mình học rằng phím này hên xui.
2. **"Esc là nút nguy hiểm"** — nên mình **không bao giờ mở panel nữa trừ khi chắc chắn
   sẽ đi hết cây**. Tức là mình **giảm** số lần nói chuyện, đúng ngược ý đồ.
3. **"Nói chuyện là thứ dùng hết thì thôi"** — nên từ ngày 3 mình **tiết kiệm** nó. Mình
   không bấm F với bà Bảy nữa để "dành". Một game cozy mà dạy người chơi **tiết kiệm sự
   thân thiết** là hỏng ở gốc.

### Minh bỏ tính năng lúc nào
**Không bỏ hẳn — tệ hơn: dùng dè.** Khoảng cuối ngày 2 (~phút thứ 11), Minh chuyển từ
"bấm F mỗi khi rảnh" sang "bấm F 1–2 lần/ngày, chọn người". Tới ngày 4–5 (ngoài phiên
này) khi 3–4 NPC quen đã cạn cuộc, Minh sẽ bỏ hẳn với những người đó và chỉ còn bấm F
với người lạ — tức là chính xác **ngược** với đường cong gắn bó mà một cozy sim cần.

---

# 2 · TRANG, 34 tuổi — dân tối ưu

> *Overcooked 2 toàn 4 sao. PlateUp 20 ngày. Diner Dash từ hồi Flash. Mở game mới là mở
> luôn notepad. Câu hỏi đầu tiên của Trang với bất kỳ cơ chế nào: "cái này có lời không?"*

## Phiên: Ngày 1 (~10 phút thật), chơi lại Ngày 1 lần hai

### 6:00 — lập bản đồ phím trong 40 giây
WASD · E · Q · R · F · G · Tab · P · Esc. Trang bấm thử từng phím ở trạng thái rảnh tay,
ghi notepad.

`F` → toast: **"chưa có ai để nói chuyện"**. Ghi: *F = chat, cần target.*

### 6:34 — câu hỏi số một
Bà Bảy đứng quầy, phiếu ghim. Trang bấm F. Panel mở, **đồng hồ đứng im** — Trang nhìn
HUD, thấy số phút không nhảy. Mắt sáng.

> **Trang:** "Khoan. Nó **pause** hả? Vậy bấm F là **free pause**?"

Trang Esc ra ngay. Kiểm chứng: `openTalkPanel` (`StallScene.ts:2125`) set
`this.clock.paused = true`, và `Clock.advance()` (`clock.ts:99`) trả `dt = 0` khi pause →
**mọi thứ đứng**: kiên nhẫn khách, độ nguội ổ, độ cháy lò, timer rửa tay. Và
`closeTalk()` không phạt gì nếu chưa `engaged` và NPC không mở lời trước
(`service.ts:2375`).

Trang thử: F (mở) → Esc (đóng) → F → Esc. 5 lần liên tiếp. **Không mất gì cả.** Cuộc
thoại vẫn còn (comment ở `openTalk` dòng 2306 ghi rõ: cố ý chưa `markTalkUsed` lúc mở).

> **Trang:** "Vậy F là nút 'tạm dừng để suy nghĩ' miễn phí. Ghi vô sổ. Lò sắp cháy mà
> tay đang kẹt? Bấm F, đọc, Esc."

Ghi chú: P cũng pause thật và cũng đóng băng kiên nhẫn (CANON §15.2), nên đây không phải
exploit kinh tế. Nhưng nó làm cho **cái giá của việc trò chuyện bằng 0** — và với Trang,
thứ gì có giá bằng 0 thì cũng không có **trọng lượng** bằng 0. Trang không bao giờ cảm
thấy "có nên dừng lại nói chuyện không" — câu hỏi đó không tồn tại.

### 6:41 — câu hỏi số hai: nó có ra tiền không?
Trang chơi hết một cây thoại với bà Bảy, 3 nhịp. Nhìn HUD: tiền **không đổi**. Số khách
phục vụ **không đổi**. Không có "+3 thiện cảm", không có thanh gì, không có màu tên gì
(T3 — Trang không biết T3 là gì, Trang chỉ thấy **không có feedback**).

> **Trang:** "Tui vừa bấm 6 cái nút và màn hình **không thay đổi một con số nào**. Cái
> này để làm gì?"

Đây là chỗ T3 (không hiện chỉ số) đụng thẳng vào người tối ưu. T3 đúng về mặt thiết kế.
Nhưng T3 **chỉ sống được nếu hậu quả thấy bằng mắt**. Ở đây hậu quả có thật (`rel`,
`anger`, `waitSec`, `pledges`) mà **không có một cái nào hiện ra trong 10 phút đầu**:
- `anger` chỉ thấy khi đã chửi đủ nặng;
- `rel` chỉ đổi tier sau nhiều ngày;
- `PROMISE` chỉ vỡ lúc giao bánh;
- `DISCOUNT`/`FREE_LOAF` thì có — nhưng là **mất tiền**, và Trang nhìn ra ngay.

Nên bảng kê của Trang sau 10 phút là: **trò chuyện = tốn thao tác, không ra tiền, có
nhánh làm MẤT tiền.**

### 6:52 — cú bấm F tệ nhất trong đời Trang
Ba người đứng quầy: bà Bảy (slot 1, x=12.5), một anh lạ (slot 2, x=11.0), chú Tư (slot
3, x=9.5). Trang đang đứng ở lò, x≈10. Bấm F để hỏi bà Bảy — người đứng **đầu quầy**,
người có phiếu đang ghim trên HUD.

Panel mở ra: **anh lạ** đang nói. *"Hai lăm ngàn? Bên kia có mười lăm à chị."*

> **Trang:** "ĐM. Tui bấm F cho bà Bảy. Nó mở ra cái thằng ở giữa hàng. Tui đâu có bấm
> vô nó."

Nguyên nhân, chính xác: `talkTarget()` (`service.ts:2435`) ưu tiên
`nearestTalkable()` — **gần người chơi nhất trong `TALK_REACH = 3` ô** — trước
`this.front`. Trang đứng x≈10, anh lạ ở x=11 (cách 1 ô), bà Bảy ở x=12.5 (cách 2.5 ô).
Cả hai trong tầm, anh lạ gần hơn → anh lạ thắng.

Nghĩa là: **target của F phụ thuộc vào vị trí bàn chân của người chơi** — một biến mà
người chơi đang di chuyển liên tục để làm bánh, và **không có một chỉ báo nào trên màn
hình** nói ai sẽ được chọn. Dòng nhắc `F — nói chuyện với X` (`StallScene.ts:1285`) chỉ
hiện khi `nearbyToTalk()` trả non-null, mà hàm đó (`service.ts:2404`) **trả null nếu
người gần nhất chính là `front`** — và nó là dòng **cuối cùng** trong `promptLine()`,
nên đứng ở lò/thớt/kệ thì prompt của trạm thắng và dòng kia **không bao giờ hiện**.

Trang đứng ở lò. Trang không thấy gì. Trang bấm F mù.

### 6:53 — và nó còn tính tiền
Trang Esc ra ngay lập tức, chưa chọn câu nào. Không mất gì (chưa `engaged`, anh lạ không
mở lời trước). May.

Nhưng Trang không biết là may. Trang không biết có cái luật đó. Trang chỉ biết: **F là
một cú roulette.**

### 7:05 — `walkin.nhamquan`
Một anh khách đứng quầy chờ bánh. Trang bấm F (lúc này Trang đã học: đứng sát người mình
muốn nói thì mới trúng). Panel mở: *"Cho tui tô hủ tiếu, ít hành nghen."*

> **Trang:** "Hả?? Thằng này nó **đã gọi món rồi**. Phiếu nó còn ghim trên màn hình tui
> nè. Giờ tui bắt chuyện thì nó gọi hủ tiếu?"

Chuẩn xác là lỗi #2 của chủ dự án, và nó không phải một cuộc cá biệt. Nhìn cả
`walkin.json`: **6/6 opener đều là câu của một người đang MỞ MIỆNG TRƯỚC** —
"Hai lăm ngàn? Bên kia có mười lăm à chị" · "Ê, cho tui quay cái này cái" · "Sao lâu vậy
em?" · "Cô bớt tui năm ngàn đi" · "Cho tui tô hủ tiếu" · "Chị ơi cho em tám ổ". Và
`qua-duong.json`: **8/8** cũng vậy — "{you} ơi, hẻm 54 đi lối nào vậy?" · "Mấy giờ rồi
{you} ơi?" · "Cho {self} đứng nhờ chút nghen". Không một file nào trong hai file này có
`initiates`. Nên **100% nội dung được viết cho NPC mở lời, và 100% nội dung đó chỉ bật ra
khi người chơi bấm F.**

Đây không phải lỗi của một dòng thoại. Đây là **cả kho `WALKIN` và `QUA_DUONG` bị cắm
nhầm cổng.**

### 7:30 — kết luận của Trang
Trang mở lại ngày 1 lần hai. Lần này Trang **không bấm F một lần nào**. Phục vụ nhiều
hơn 3 ổ, không mất ổ nào vì cháy, không có cú nào bị route sai.

> **Trang:** "Rồi. Chốt: **F là nút không bấm.** Nó không ra tiền, nó mở nhầm người, và
> nó có nhánh làm mất tiền. Pause thì tui có phím P rồi."

### Trang học được luật sai nào
1. **"F là free pause"** — đúng về mặt cơ học, sai về mặt ý đồ. Trang dùng F như một nút
   tiện ích chứ không như một hành động xã hội.
2. **"Đừng bao giờ bấm F khi có hơn 1 người ở quầy"** — vì không biết nó sẽ mở ai.
3. **"Trò chuyện không ảnh hưởng throughput"** — Trang KHÔNG học được rằng `anger` đốt
   kiên nhẫn, rằng `PROMISE` tạo nợ phải trả lúc giao bánh, rằng `rel` ảnh hưởng tip và
   `STEP_ASIDE`. Tất cả những thứ đó CÓ trong code, và **không một cái nào đọc được từ
   màn hình trong 10 phút đầu.**

### Trang bỏ tính năng lúc nào
**Phút thứ 7–8 của phiên đầu**, ngay sau cú route nhầm ở 6:52. Sang phiên hai thì bỏ
sạch. Trang là persona bỏ nhanh nhất, và lý do bỏ không phải "nó phiền" mà là **"nó
không nằm trong bảng tính"** — tệ hơn nhiều, vì nó nghĩa là 12.600 dòng JSON không tồn
tại với kiểu người chơi này.

---

# 3 · KHOA, 19 tuổi — dân narrative

> *Disco Elysium hai lần, lần hai đọc hết mọi nhánh. Firewatch. Night in the Woods.
> Kentucky Route Zero. Tới game này vì đọc được một dòng review nói "thoại tiếng Việt
> viết thật". Không quan tâm doanh thu trong game. Quan tâm chữ.*

### 6:02 — Khoa mở game và đi tìm chữ
Việc đầu tiên: bấm Tab mở sổ tay. Rồi đi quanh đọc nhãn. Rồi bấm F.
"chưa có ai để nói chuyện". Khoa chờ.

### 6:33 — dòng thoại đầu tiên và Khoa gật đầu
Bà Bảy gọi món bằng **lời nói nguyên văn**, không checklist. Phiếu ghim giữ đúng câu đó.

> **Khoa:** "Ờ. Ờ ờ ờ. Cái này **đúng**. Đây mới là cái tui muốn."

Khoa thích ngay. Khoa bấm F.

### 6:34 — và cái panel ăn mất màn hình
Panel bật lên che 56% chiều cao. Bà Bảy — người mà cả game nói là "khách đứng cách nửa
mét và nhìn thấy mọi thứ bạn làm" — giờ chỉ còn thấy từ vai lên, và bên trái câu thoại
có một cái mặt vẽ lại bằng 3 nét ở cỡ 22px.

> **Khoa:** "Sao lại vẽ **lại** cái mặt? Mặt bả đang ở trên kia kìa. Mấy ông vừa che
> mất người thật rồi dán một cái icon lên chỗ che."

Khoa nói đúng về mặt thiết kế: cái `mood` badge (`TalkPanel.ts`, `MOOD_FACE`) là một
giải pháp rất tốt cho một vấn đề **do chính cái panel tạo ra**.

### 6:36 — Khoa mất câu nói của chính mình
Khoa chọn dòng 2: *"Dạ bà uống trà đá hông, con rót cho bà."*
Panel vẽ lại. Trên panel chỉ còn: tên bà Bảy + câu bà đáp + 3 lựa chọn mới.

Câu Khoa vừa nói **biến mất khỏi panel**. Nó đi xuống `hud.say()` ở góc trái dưới — ô giữ
đúng **3 dòng** (`Hud.ts:374`: `if (this.feed.length > 3) this.feed.shift()`) — và ô đó
**nằm dưới gầm panel** vì `dockFeed()` không bao giờ được gọi cho TalkPanel.

> **Khoa:** "Tui đang đọc một cuộc hội thoại mà tui **không thấy được nửa của mình**.
> Giống như xem phim bị tắt tiếng một nhân vật."

Với Khoa đây là lỗi **chí mạng**. Disco Elysium để cả cuộn transcript bên phải và bạn
cuộn lên đọc lại được bất cứ lúc nào. Ở đây, một cây sâu 4 nhịp sinh ra 8 dòng (4 của
mình, 4 của họ) đổ vào một ô 3 dòng bị che. Sau cuộc đó, **không có cách nào đọc lại**.
Không log, không lịch sử, không nhật ký trong ngày.

### 6:55 — rồi Khoa phát hiện cây thoại không phải cây
Khoa bấm F với chú Tư. Cuộc mở, 3 lựa chọn. Khoa chọn 1. Nhịp 2: 3 lựa chọn. Khoa chọn
1. Nhịp 3: **hết**. `done`. Hint đổi thành "Enter — thôi nói chuyện".

Khoa đếm: **3 nhịp**. `MAX_DEPTH = 6` nhưng cây thực tế của mấy file này nông hơn nhiều.
Và mỗi NPC có **đúng 6 cuộc cho CẢ MÙA 40 NGÀY** (đếm `src/content/talks/*.json`: 6 cuộc
/file, trừ `qua-duong.json` 8 cuộc).

> **Khoa:** "Sáu cuộc. Cho một người. Cho bốn mươi ngày. Vậy là từ ngày thứ bảy trở đi
> chú Tư là một cái máy bán bánh mì à?"

Và `usedSeason` không bao giờ reset (`service.ts:2545`). Và câu thông báo lúc cạn là
**"hết chuyện để nói với chú Tư bữa nay rồi"** — nói dối, vì nó là **cả mùa**.

### 7:10 — khoảnh khắc hay nhất của phiên, và nó bị hỏng ngay sau đó
Bà Bảy **tự bắt chuyện** (`bay.veso`, cuộc duy nhất có thể initiate ở ngày 1). Bong bóng
trên đầu bà: *"Con mua giùm bà tờ vé số nghen…"* Toast góc phải: **"bà Bảy bắt chuyện —
bấm F để trả lời"**.

Khoa đang kẹp bánh — **bảng kẹp nhân đang mở**.

Khoa bấm F. **Không có gì.**

Vì `bindInput` (`StallScene.ts:983`): `if (this.assembly.isOpen) { this.assembly.handleKey(ev.code); return; }` — và
`AssemblyPanel.handleKey` (`AssemblyPanel.ts:546`) **không xử lý `KeyF`**, nó trả `false`
và rơi xuống đất. Muốn trả lời bà Bảy, Khoa phải Esc (= `park()` ổ bánh dở) **rồi mới**
bấm F được.

Trong lúc Khoa loay hoay, cái toast hết hạn. Tuổi thọ toast = `min(6000, max(2600, 1800 +
ký_tự × 55))` (`Hud.ts:323`); chuỗi `"bà Bảy bắt chuyện — bấm F để trả lời"` ≈ 36 ký tự →
**~3,8 giây**. Và `TOAST_MAX = 3` — nếu có toast khác chen vào ("ổ này sém cạnh rồi",
"hết tiền lẻ"), nó bị **đẩy ra sớm hơn nữa** vì `toast()` ghi đè vào slot cũ nhất
(`Hud.ts:309-310`).

Cái toast là **dấu vết duy nhất** rằng bà Bảy đang chờ Khoa trả lời. Trên đầu bà **không
có gì cả** — không dấu chấm than, không icon bong bóng, không viền. Bong bóng lời bà thì
cũng tắt sau 2 giây (`this.say(c, ..., 2, ...)`, `service.ts:2857`).

Bà Bảy mua xong, đi. Và ở `leave()` (`service.ts:1615`):
`if (this.offer?.c === c) { this.applyIgnore(c, this.offer.talk); this.offer = null; }`
→ **Khoa bị phạt vì làm thinh.** Im lặng. Không thông báo. Không có gì.

> **Khoa:** "Tui ĐÂU CÓ làm thinh. Tui đang kẹp bánh cho bả. Game khoá phím F lại rồi
> phạt tui vì không bấm F."

Đây là khoảnh khắc **phản bội kỳ vọng** nặng nhất trong cả bốn phiên. Hệ thống dựng một
cái bẫy: nó mời bạn trả lời, rồi nó khoá cái phím trả lời, rồi nó tính tiền việc bạn
không trả lời. Và vì T3 cấm hiện số, bạn **không bao giờ biết**.

### 7:35 — Khoa thử một thứ và nó hỏng theo kiểu buồn cười
Khoa quen tay giữ phím (dân visual novel hay giữ Enter để chạy nhanh qua đoạn đã đọc).
Khoa **giữ Space** trong lúc panel mở.

`TalkPanel.bindKeys` (`TalkPanel.ts`) bắt `keydown` ở pha capture trên `window` và
**không kiểm `ev.repeat`** (StallScene thì có kiểm, dòng 981: `if (ev.code === "Escape"
|| ev.repeat || this.paused) return;`). Nên key-repeat của trình duyệt (~30/giây) bắn
liên tục vào `pick(this.cursor)` → `chooseTalk` → `talk.show(next)` → `bindKeys` lại →
pick tiếp…

**Cả cây thoại chạy hết trong khoảng một phần mười giây.** Khoa chọn dòng 1 ở mọi nhịp,
không đọc gì, và `applyTalkOption` áp đủ mọi `rel`/`anger`/`act` dọc đường.

> **Khoa:** "Tui vừa giữ phím cách một cái và nó **chơi giùm tui hết cuộc nói chuyện**.
> Tui còn không kịp thấy chữ."

Tương tự với **giữ F**: cú F đầu được `intents.push` → frame sau mở panel → `bindKeys`
gắn listener → các `repeat` tiếp theo rơi vào nhánh
`if (ev.code === "Escape" || ev.code === "KeyF") { ev.preventDefault(); this.close(); }`
→ panel **vừa mở đã đóng**, và nếu NPC là người mở lời thì **ăn luôn `applyIgnore`**.
Giữ F = tự phạt mình.

### Khoa học được luật sai nào
1. **"Đừng mở bảng kẹp nhân nếu đang chờ ai bắt chuyện"** — một luật hoàn toàn phi lý mà
   hệ thống dạy rất rõ.
2. **"Đọc kỹ là thiệt"** — vì cái toast mời trả lời sống 3,8 giây, còn Khoa đọc chậm.
3. **"Nội dung là tài nguyên hữu hạn, dùng là mất"** — nên Khoa bắt đầu **save-scum bằng
   cách không chơi**: không bấm F để "giữ" nội dung cho sau. Một người tới vì chữ mà học
   được cách **không đọc chữ**.

### Khoa bỏ tính năng lúc nào
**Khoa không bỏ — Khoa spam.** Khoảng phút thứ 9, sau khi phát hiện F+Esc không mất gì
và cuộc thoại không bị tiêu, Khoa chuyển sang **mở F với mọi người, mọi lúc, chỉ để đọc
opener rồi Esc ra**. Khoa đang dùng F như một nút "xem trước nội dung". Đây là hành vi
tệ nhất có thể cho hệ thống này: nó biến hội thoại thành **gallery**, và nó đổ hết
`applyIgnore` lên đầu những NPC mà Khoa thực ra đang rất quan tâm.

---

# 4 · CÔ HẠNH, 52 tuổi — không rành game

> *Con gái cài game cho. Chơi trên laptop 14", bàn phím lọt thỏm, không có chuột rời.
> Đọc chậm, mỗi dòng đọc hai lần cho chắc. Tay chậm, hay giữ phím hơi lâu. Chưa từng
> chơi game nào có WASD. Từng chơi Candy Crush.*

### 6:01 — WASD đã là một bài toán
Cô Hạnh mất 90 giây thật (= 45 phút game) chỉ để đi được từ lò ra thớt. Trong 45 phút
game đó không có khách nên không sao. Cô thấy có mấy người đi ngang. Cô thích.

### 6:30 — bà Bảy tới, và cô Hạnh đọc phiếu
Phiếu đơn ghim góc phải. Cô đọc. Đọc lại. Gật. Đi lấy bánh.

### 6:38 — cô bấm nhầm F
Cô định bấm D (đi phải) nhưng tay trượt xuống F. Panel bật lên **chiếm nửa dưới màn
hình**, chữ to, 3 dòng có số 1 2 3.

Cô Hạnh **hoảng**.

> **Cô Hạnh:** "Ơ. Cái gì đây con? Sao tự nhiên hiện cái bảng này? Cô có bấm gì đâu."

Cô tìm nút X. **Không có nút X.** Cả panel không có một cái nút đóng nào — chỉ có dòng
chữ 11px màu xám nhạt ở đáy: `1–4 hoặc ↑↓ + Enter · Esc làm thinh`.

Cô Hạnh không biết "làm thinh" trong ngữ cảnh này nghĩa là gì. Cô đọc nó như một lựa
chọn nữa.

### 6:39 — cô bấm Esc, và cô bị phạt
Cô bấm Esc vì đó là phím cô biết để "thoát ra". Panel đóng. `closeTalk()` chạy. Vì bà Bảy
**chưa** mở lời trước và cô **chưa** chọn câu nào → may, không phạt.

Nhưng nếu đó là lần bà Bảy tự bắt chuyện thì cô đã bị `applyIgnore` → `rel: -1`. Và cô
sẽ không bao giờ biết.

> **Cô Hạnh:** "Esc là thoát mà. Ở đâu cũng vậy. Esc là thoát."

**Vấn đề thật sự ở đây:** trong lúc panel mở, `TalkPanel` gắn listener ở **pha capture
trên window** và gọi `ev.stopPropagation()` cho **MỌI phím**. Nghĩa là trong lúc panel
mở:
- **P không pause được** (CANON §15.2: "pause mọi lúc" — vi phạm);
- **Tab không mở sổ tay được**;
- **Esc không mở menu tạm dừng được** — Esc trở thành một **câu trả lời có giá**.

Cô Hạnh là người test trợ năng. Với cô, **"nút thoát an toàn" là thứ cô cần nhất trên
đời**, và màn hình này là màn hình duy nhất trong cả game **không có nút thoát an toàn**.

### 6:52 — cỡ chữ 200%, và chữ chui ra ngoài bảng
Con gái dặn: "Mẹ vô Cài đặt chỉnh cỡ chữ cho dễ đọc." Cô Hạnh chỉnh lên **200%**
(`MenuScene.ts:292` — 4 mức: 1 / 1.25 / 1.5 / 2).

Quay lại. Bấm F với một người lạ. Panel mở.

**Dòng lựa chọn thứ 3 và thứ 4 nằm ngoài cái nền giấy, và dòng 4 bị cắt mất nửa dưới ở
mép màn hình.**

Tính lại từ code, `TalkPanel.show()`:
- `sz = min(textScale(), 1.35) = 1.35`
- `rowH = round(buttonHeight(1.35) × 0.92) = round(62 × 0.92) = 57`
- chiều cao **cần** cho tên + câu nói 2 dòng + 4 lựa chọn + hint
  ≈ `32 + 27 + 65 + 4×63 + 30 = 406`
- chiều cao **được cấp**: `h = min(GAME_H × 0.56, 406) = min(322, 406) = 322`

Nhưng các hàng vẫn được đặt bằng `y += rowH + 6` **không bị kẹp theo `h`**. `top ≈ 243`,
hàng 4 tâm ở y ≈ **569**, mép dưới ≈ **598** — trong khi `GAME_H = 576` và nền panel kết
thúc ở y ≈ **566**.

Tệ hơn: dòng hint được đặt ở `top + h - PAD/2 - hintH/2` ≈ **543**, tức **đè lên chính
hàng lựa chọn thứ 4**.

Và chuyện này **không chỉ xảy ra ở 200%**: ngay ở **cỡ chữ mặc định 100%**, một câu đáp
dài 3 dòng (rất thường gặp với tiếng Việt có dấu, wrap ở 554px) + 4 lựa chọn đã cần
~332px > 322px. **Cái trần `MAX_H_RATIO = 0.56` cắt nội dung chứ không co nội dung.**

> **Cô Hạnh:** "Chữ nó chạy ra ngoài cái khung rồi con ơi. Cô đọc không được dòng cuối.
> Mà cô đâu biết dòng cuối nó nói gì để mà bấm."

Đây là **lỗi trợ năng cứng**: người chơi chỉnh cỡ chữ để đọc được hơn, và kết quả là **mất
luôn lựa chọn thứ 4**.

### 7:05 — cô giữ phím, và game chơi giùm cô
Cô Hạnh bấm số `1` nhưng giữ hơi lâu — tay chậm, quen gõ điện thoại. Key-repeat bắn
~30 lần/giây vào `pick(0)`. Vì `TalkPanel` không chặn `ev.repeat`, **cả cây thoại chạy
hết trong một chớp mắt**, mỗi nhịp chọn dòng 1.

Màn hình nhấp nháy một cái. Panel biến mất. Góc trái dưới có mấy dòng chữ cô chưa kịp
nhìn.

> **Cô Hạnh:** "Ủa? Nó đâu rồi? Cô mới bấm có một cái mà. Cô chưa đọc xong mà."

Và cô **không có cách nào đọc lại**. Ô nhật ký giữ 3 dòng, cuộc vừa rồi sinh 6–8 dòng,
và ô đó nằm dưới gầm panel lúc nãy. Nội dung đó, với NPC đó, với `usedSeason` — **mất
vĩnh viễn cả mùa**.

### 7:20 — "cô không biết nó đang nói với ai"
Hai người đứng quầy. Cô Hạnh bấm F. Panel mở. Trên đầu panel có một cái tên nhỏ màu xám
13px: "chị đeo khẩu trang".

Cô Hạnh nhìn lên màn hình. Có hai người. Cô không biết ai là "chị đeo khẩu trang" — trên
đầu họ **không có chip tên** (comment trong `passersby.ts` ghi rõ: cố ý không có), và
cái panel đang **che mất thân dưới của cả hai**.

> **Cô Hạnh:** "Cô đang nói với ai vậy con? Cô nhìn không ra."

### 7:45 — cô bỏ
Cô Hạnh ngừng bấm F. Không phải vì bực — cô không bực, cô chỉ **sợ**. Phím này mở ra một
cái bảng che nửa màn hình, không có nút đóng, chữ tràn ra ngoài, và đôi khi nó tự chạy
hết rồi tự tắt.

> **Cô Hạnh:** "Thôi cô bán bánh thôi. Cái bảng đó cô không đụng vô nữa."

### Cô Hạnh học được luật sai nào
1. **"Phím F là phím hỏng, đừng bấm"** — luật đơn giản nhất và dính nhất.
2. **"Chỉnh cỡ chữ to lên thì game bị bể"** — nên cô chỉnh **xuống lại 100%** và đọc
   không nổi cả ngày. Đây là một lỗi trợ năng **tự huỷ**: tính năng trợ năng làm hỏng
   game, nên người cần nó nhất lại tắt nó đi.
3. **"Esc không chắc ăn"** — nên trong panel cô không dám bấm gì cả, cô chỉ ngồi nhìn.

### Cô Hạnh bỏ tính năng lúc nào
**Phút thứ 6 thật** (~7:45 giờ game), sau sự cố giữ phím. Nhanh thứ nhì sau Trang, nhưng
vì lý do hoàn toàn khác: Trang bỏ vì **tính toán**, cô Hạnh bỏ vì **sợ**.

---

# TỔNG HỢP A — XẾP HẠNG 7 LỖI CHỦ DỰ ÁN THEO MỨC ĐAU THẬT

Tiêu chí xếp hạng: **bao nhiêu persona gặp**, **gặp sớm cỡ nào**, **có dạy luật sai
không**, **có làm người chơi BỎ tính năng không**. Không xếp theo mức khó sửa.

| # | Lỗi chủ dự án nêu | Đau thật | Gặp ở phút | Ai gặp | Vì sao đau cỡ đó |
|---|---|---|---|---|---|
| **1** | **#7 — Nhiều người đứng đó, bấm F không biết sẽ nói với ai** | **★★★★★** | 3–7 | Trang, cô Hạnh, Minh | Đây là lỗi **nền móng**, không phải lỗi bề mặt. Nó phá **lòng tin vào phím**. Một khi người chơi không đoán được kết quả của một cú bấm, họ ngừng bấm — và mọi lỗi còn lại trở thành học thuật vì không ai mở panel nữa. Nó cũng **đẻ ra lỗi #2 và #5**: route nhầm người là lý do bạn thấy `walkin.nhamquan`, và không biết đang nói với ai là lý do bạn spam mời lại. Nguồn: `talkTarget()` ưu tiên khoảng cách chân người chơi trước `front`, và prompt báo target là **dòng cuối cùng** trong `promptLine()` nên gần như không bao giờ hiện. |
| **2** | **#3 — Đang bán mà có người bắt chuyện là rất phiền** | **★★★★★** | 7–9 | Khoa (nặng nhất), Minh | Không chỉ "phiền" — nó là một **cái bẫy có tính tiền**. Toast sống 3,8 giây, trên đầu NPC không có dấu gì, bảng kẹp nhân **nuốt mất phím F**, và lúc NPC đi thì `leave()` phạt `rel −1` lặng lẽ. Người chơi bị phạt vì một việc hệ thống **không cho họ làm**. Đây là lỗi duy nhất trong 7 lỗi mà hậu quả là **mất điểm thật mà người chơi không biết**. |
| **3** | **#6 — Câu "hết chuyện để nói với abc bữa nay rồi"** | **★★★★☆** | 8–12 | Minh (chí mạng), Khoa | Chủ dự án xếp đây là lỗi **câu chữ**. Thực tế nó là lỗi **nói dối**: `usedSeason` không reset, 6 cuộc/NPC/mùa, nên "bữa nay" là **cả mùa**. Minh bấm F bốn ngày liên tiếp để kiểm chứng. Sửa câu chữ **không** chữa được cái đau này — cái đau nằm ở chỗ nội dung cạn sau ~6 ngày và hệ thống giấu chuyện đó. Với persona cozy, đây là lỗi **làm hỏng lý do chơi**. |
| **4** | **#2 — Phải chủ động bấm F mới có gì xảy ra / `walkin.nhamquan`** | **★★★★☆** | 4–9 | Cả 4 | Đau rộng nhất nhưng không phải đau sâu nhất, vì nó đau theo kiểu "thế giới chết" chứ không theo kiểu "tôi bị lừa". Số liệu: **ngày 1–2 chỉ có ĐÚNG 1 cuộc** trên toàn bộ game có thể NPC-initiated (`bay.veso`). `walkin.json` 0/6 và `qua-duong.json` 0/8 có `initiates`, trong khi **14/14 opener của hai file đó được viết cho người mở lời trước**. Đây không phải "một số câu thoại bắt buộc phải do NPC nói" — đây là **cả hai kho bị cắm nhầm cổng**. |
| **5** | **#1 — Switch content quá nhiều** | **★★★☆☆** | 6–10 | Khoa, Minh | Thật, nhưng nó là **triệu chứng**, không phải bệnh. Hai modal (TalkPanel pause đồng hồ, AssemblyPanel KHÔNG pause) với hai luật thời gian ngược nhau, hai bộ phím chồng nhau (số 1–9 có nghĩa khác nhau ở hai bảng), và một cái **khoá mất phím của cái kia**. Xếp hạng 5 vì nếu sửa #7/#3/#2 thì phần lớn cú switch này tự biến mất — người chơi sẽ không còn bị kéo vào panel ngoài ý muốn. |
| **6** | **#5 — Spam mời khách qua đường** | **★★☆☆☆** | — | Không ai trong 4 phiên gặp trong 15 phút | Lỗi **thật** về mặt logic nhưng **gần như không ai chạm tới trong phiên đầu**, vì để spam được bạn phải: (a) biết là có cơ chế mời, (b) biết nó nằm ở **depth 2** của cây, (c) bắt kịp một người đi ngang trong `TALK_REACH = 3` ô. Minh mới chỉ mời được **một lần** trong 13 phút. Roll đã deterministic (`invite:<id>`) nên spam không ra kết quả khác — cái sai là **cảm giác**, không phải cái lợi. Đau thấp, nhưng đáng sửa vì nó rẻ. |
| **7** | **#4 — Thiếu NPC-với-NPC** | **★☆☆☆☆** (nhưng ★★★★☆ về *giá trị thêm vào*) | — | Không ai **thiếu** nó; Minh **mong** nó | Đây không phải một **lỗi** — không persona nào bực vì nó. Nhưng nó là thứ duy nhất trong 7 mục mà **thêm vào sẽ sửa gốc cho #2**: nếu hẻm có đời sống thì người chơi không còn phải bấm F để thế giới nhúc nhích. `overhear.ts` đã làm được một nửa (1 cảnh/ngày, 8h15–10h30, dùng tin đêm trước, 3 tầng nghe theo việc tay đang làm) và nó là **đoạn code đẹp nhất của cả hệ trò chuyện**. Xếp cuối theo **đau**, nhưng xếp **nhì theo đòn bẩy**. |

**Tóm một câu:** bốn lỗi đầu bảng (#7, #3, #6, #2) đều là cùng một bệnh —
**hệ thống không bao giờ nói cho người chơi biết chuyện gì đang xảy ra với ai và nó tốn
gì.** Không phải bệnh nội dung, không phải bệnh cây thoại. Bệnh **thông tin**.

---

# TỔNG HỢP B — LỖI CHỦ DỰ ÁN CHƯA NÊU

Sắp theo mức đau giảm dần. Mỗi mục nói rõ hỏng ở đâu trong code.

## B1 ★★★★★ — F cũng là phím ĐÓNG panel, và không chặn key-repeat
`TalkPanel.bindKeys()`:
```
if (ev.code === "Escape" || ev.code === "KeyF") { ev.preventDefault(); this.close(); }
```
và handler **không có `if (ev.repeat) return;`** — trong khi `StallScene.bindInput()`
(dòng 981) thì có.

Ba hậu quả, cả ba đều thấy trong phiên chơi:
1. **Giữ F** = mở panel rồi key-repeat đóng ngay → nếu NPC là người mở lời thì **ăn
   `applyIgnore`**. Tự phạt mình bằng cách giữ phím hơi lâu.
2. **Giữ Space/Enter** = `pick(cursor)` lặp ~30 lần/giây → `unbind` → `fn(i)` →
   `chooseTalk` → `talk.show()` → `bindKeys` → lặp. **Cả cây thoại chạy hết trong một
   phần mười giây**, áp đủ mọi `rel`/`anger`/`act` dọc đường, và cuộc đó bị `markTalkUsed`
   → **mất vĩnh viễn cả mùa**.
3. **Giữ phím số** = y hệt.

Cô Hạnh (tay chậm) gặp cái này ở phút thứ 5. Khoa gặp vì thói quen giữ Enter của dân VN.
Đây là lỗi **mất dữ liệu người chơi** (nội dung không lấy lại được), không chỉ lỗi UX.

## B2 ★★★★★ — Panel che chính cái ô chữ mà nó đang đổ chữ vào
- `TalkPanel`: `setDepth(9_400_000)`
- `Hud`: `const DEPTH = 9_000_000` (dòng 12); `feedText` ở `(26, GAME_H − 100)` = `(26, 476)`
- `Hud.dockFeed(right)` dời ô nhật ký sang phải — **grep cả repo chỉ có một chỗ gọi**:
  `StallScene.ts:1174`, `this.hud.dockFeed(this.assembly.isOpen)`. **Không ai gọi nó cho
  TalkPanel.**

Panel rộng 620–713px, tâm x = 512 → trải từ x≈202 đến x≈822; cao tới y≈566. Ô nhật ký ở
x 26…~346, y 476…~530. **Giao nhau.** Và panel nằm trên.

Nên: câu người chơi vừa nói (`con: "…"`, đẩy qua `routeLine` → `hud.say`) được in vào một
ô **đang bị chính cái panel che**. Người chơi **không bao giờ thấy nửa hội thoại của
mình**. Đây là lỗi làm hỏng cái cảm giác "đây là một cuộc nói chuyện".

Cộng thêm: `Hud.log()` giữ **3 dòng** (`if (this.feed.length > 3) this.feed.shift()`). Một
cây 4 nhịp = 8 dòng. **Không có lịch sử hội thoại ở bất cứ đâu trong game.**

## B3 ★★★★★ — Cỡ chữ lớn làm tràn/cắt lựa chọn (lỗi trợ năng tự huỷ)
`TalkPanel.show()` kẹp **chiều cao bảng** (`h = Math.min(GAME_H * MAX_H_RATIO, …)`) nhưng
**không kẹp vị trí hàng**: `let y = top + PAD + nameH + lineH;` rồi `y += rowH + 6` cho
từng lựa chọn, không liên quan gì tới `h`.

Ở `textScale = 2` (mức cao nhất của 4 mức, `MenuScene.ts:292`): cần ~406px, được cấp
322px → **hàng 3–4 tràn ra ngoài nền giấy, hàng 4 cắt ở mép màn hình (y≈598 > GAME_H 576)**,
và dòng hint (đặt ở `top + h − PAD/2 − hintH/2` ≈ 543) **đè lên hàng 4**.

Ngay ở `textScale = 1`: một câu đáp 3 dòng + 4 lựa chọn đã cần ~332 > 322.

CANON §15 đòi 4 mức cỡ chữ. Cái màn hình **chữ nhiều nhất trong game** là cái duy nhất
không chịu nổi mức cao nhất. Và hậu quả thực tế là người chơi **chỉnh cỡ chữ xuống lại** —
tính năng trợ năng tự vô hiệu hoá chính nó.

## B4 ★★★★★ — Esc vừa là "làm thinh có giá" vừa là pause, và panel KHOÁ pause
`TalkPanel.bindKeys` gắn listener ở **pha capture trên `window`** và gọi
`ev.stopPropagation()` cho **mọi phím** (comment ở đó nói rõ là cố ý, để W/A/S/D không
làm người chơi đi mất).

Hệ quả không nêu trong comment: trong lúc panel mở,
- **P không pause được** → vi phạm thẳng CANON §15.2 "pause mọi lúc";
- **Tab không mở sổ tay được**;
- và **không tồn tại một đường ra trung tính nào**. Esc = "làm thinh" (có giá nếu
  `engaged || npcOpened`). Enter ở nhịp chưa `done` = **chọn** dòng đang trỏ. Phím số =
  chọn. **Mọi lối ra đều là một câu trả lời.**

Với cô Hạnh đây là lỗi nặng nhất: màn hình duy nhất trong cả game không có nút thoát an
toàn, và nó là màn hình cô vô tình mở nhiều nhất.

Ghi chú về cái "đỡ": vì `clock.paused = true` nên không có **áp lực thời gian** khi kẹt.
Nhưng "không bị phạt vì đứng im" không thay thế được "có nút ra".

## B5 ★★★★☆ — Bảng kẹp nhân nuốt phím F; hai modal hai luật thời gian ngược nhau
`StallScene.bindInput()` dòng 983:
```
if (this.assembly.isOpen) { this.assembly.handleKey(ev.code); return; }
```
`AssemblyPanel.handleKey()` (dòng 546) xử lý số, Backspace, Escape, E/Space/Enter —
**không có `KeyF`**, trả `false`, rơi xuống đất.

Nên: đang kẹp nhân mà có người bắt chuyện → **không thể trả lời**. Phải Esc (= `park()`
ổ bánh dở) rồi mới bấm F được. Trong khi đó toast mời sống 3,8 giây.

Thêm một tầng: **AssemblyPanel KHÔNG pause đồng hồ** (grep: không chỗ nào set
`clock.paused` cho nó), **TalkPanel CÓ**. Hai modal, hai luật ngược nhau, phím số `1–9` có
nghĩa khác nhau ở hai bảng. Đây mới là nội dung thật của lỗi #1 "switch content".

## B6 ★★★★☆ — `talkOffer` chỉ là MỘT dòng toast sẽ trôi mất; NPC không mang dấu gì
Đường duy nhất báo "có người đang chờ bạn trả lời":
```
this.hud.toast(`${ev.name} bắt chuyện — bấm F để trả lời`, "info", this.popClock);
```
(`StallScene.ts:1406`). Tuổi thọ `min(6000, max(2600, 1800 + chars×55))` ≈ **3,8 giây**
cho chuỗi đó. `TOAST_MAX = 3` và `toast()` ghi đè slot cũ nhất → có toast khác chen vào là
nó **biến mất sớm hơn**. Bong bóng lời NPC cũng chỉ sống 2 giây
(`this.say(c, …, 2, true, 70)`, `service.ts:2857`).

Trên đầu NPC đó: **không có gì**. Không `!`, không icon bong bóng, không viền, không
highlight. Không có `nearbyToTalk()`-style prompt nào ưu tiên người đang chờ.

Và cái giá của việc bỏ lỡ nằm ở `leave()` dòng 1615:
`if (this.offer?.c === c) { this.applyIgnore(c, this.offer.talk); this.offer = null; }`
— phạt **lặng lẽ**, và T3 cấm hiện số nên người chơi không bao giờ biết.

**Một cái cửa sổ 3,8 giây, không có dấu chỉ bền, phạt khi lỡ.** Đây là định nghĩa của một
cơ chế không công bằng.

## B7 ★★★★☆ — Kho nội dung cạn theo MÙA, và thông báo nói dối rằng nó cạn theo NGÀY
- `talkCtx.usedSeason = m.talksDone ?? []` (`service.ts:2545`) — danh sách **cả mùa**,
  không reset.
- Đếm file: **6 cuộc/NPC có tên** (12 file × 6), `walkin.json` 6, `qua-duong.json` 8.
- `talkUnavailable()`: `` return `hết chuyện để nói với ${this.label(c)} bữa nay rồi`; ``

Toán: một người chơi bấm F mỗi lần gặp bà Bảy sẽ cạn 6 cuộc của bà vào khoảng **ngày
6–8**, rồi **32–34 ngày còn lại** nhận đúng một dòng chữ nói "bữa nay".

Chủ dự án nêu đây là lỗi **câu chữ** (#6). Thực tế câu chữ là phần **nhẹ nhất**: sửa câu
thành "bà Bảy không muốn nói chuyện lúc này" thì nó vẫn sai, vì bà Bảy sẽ **không bao giờ**
muốn nói chuyện nữa, mãi mãi, và câu mới còn gợi ý sai rằng đó là chuyện tâm trạng.

Thêm: `WALKIN` và `QUA_DUONG` dùng chung `memKey = walkin<style>` (`service.ts:957` và
`:1322`), nên `talksDone` cũng chia theo **8 dáng người**, không theo cá nhân. Nói chuyện
với "bà cụ" hôm nay thì "bà cụ" của ngày mai — một người hoàn toàn khác — **đã dùng mất
cuộc đó**.

## B8 ★★★☆☆ — Target của F phụ thuộc bàn chân người chơi, và prompt báo target gần như không bao giờ hiện
(Là nhân của lỗi #7 nhưng cơ chế cụ thể thì chưa được nêu.)

`talkTarget()` (`service.ts:2435`):
```
1. this.offer.c            (người vừa bắt chuyện)
2. nearestTalkable()       (GẦN NHẤT trong TALK_REACH = 3 ô — tính từ CHÂN người chơi)
3. this.front              (người đầu quầy)
```
`QUEUE_SLOTS` cách nhau **1,5 ô** (`map.ts:199`). `TALK_REACH = 3`. Nên **2 người ở quầy
luôn cùng trong tầm**, và ai thắng là do người chơi đang đứng lệch bên nào — một biến
thay đổi liên tục vì người chơi phải chạy giữa kệ / lò / thớt.

Dòng nhắc duy nhất: `StallScene.promptLine()` dòng 1284–1285:
```
const who = this.service.nearbyToTalk();
if (who && !this.talk.isOpen) return `F — nói chuyện với ${this.service.label(who)}`;
```
Hai lưới chặn nó:
- `nearbyToTalk()` (`service.ts:2404`) **trả `null` nếu người gần nhất chính là `front`** —
  tức đúng trường hợp phổ biến nhất thì im;
- nó là **dòng cuối cùng** của `promptLine()`, sau `handsBusy`, sau đồ dưới sàn, sau
  oven/basket/bin/board. Đứng ở **bất kỳ trạm nào** → prompt trạm thắng → **không bao giờ
  thấy dòng này**. Mà đứng ở trạm là trạng thái mặc định của người chơi.

Thêm: `nearestTalkable()` **gồm cả người đi ngang** (`talkable()` trả `true` cho mọi
`c.pass`). Lane "hè" ở `y = 9.6`, khách quầy ở `y = 7.6`. Người chơi bước ra trước quầy
một chút là một người lạ đang đi ngang **giành mất target** của khách đang đứng chờ.

## B9 ★★★☆☆ — Bấm F lúc tay bận: câm hoàn toàn, trong khi phím G ngay cạnh thì xếp hàng
```
private askFront() {
  if (this.handsBusy || this.paused || this.closed || this.talk.isOpen) return;
```
**Return câm** — không toast, không âm, không gì. Mà `promptLine()` lúc đó đang hiện
`"<việc>…"` nên người chơi **có** biết tay đang bận, chỉ là không biết cú F của mình **bị
vứt**.

So với `writeDebt()` (dòng 1420): `if (this.handsBusy) { this.debtQueued = true; return; }`
và prompt ghi rõ `"(ghi ngay khi rảnh tay)"`.

Hai phím cạnh nhau, hai triết lý ngược nhau. Minh học được "F là phím hên xui" ở phút thứ
4 vì chuyện này.

## B10 ★★★☆☆ — Người qua đường: cửa sổ 4 giây, `INVITE` nằm ở depth 2, và chỉ 30% dừng lại
- `PASSER_TALK_STAY = 4` (`service.ts:105`) — mở cuộc với người đi ngang thì ghim họ lại
  **4 giây**. (Đồng hồ pause lúc panel mở nên 4 giây đó bắt đầu đếm **sau khi** cuộc xong —
  đỡ hơn tưởng, nhưng vẫn là 4 giây để làm nốt mọi việc với họ.)
- `GLANCE_CHANCE = 0.3`, `GLANCE_SEC = [1.1, 2.6]` — **70% người đi ngang không bao giờ
  dừng**, và người dừng thì dừng 1,1–2,6 giây. Muốn bấm F trúng một người đang đi, bạn
  phải vào đúng `TALK_REACH = 3` ô của một mục tiêu đang di chuyển.
- Cả **8/8** `act: INVITE` trong `qua-duong.json` nằm ở **depth 2** — phải đi qua ít nhất
  một nhịp thoại mới tới được nút mời.

Cộng lại: "quán vắng thì bước ra mời một câu" — thứ mà `passersby.ts` mô tả là **việc duy
nhất người chơi làm được lúc vắng** — trên thực tế là một thao tác **canh me**. Minh mời
được đúng 1 lần trong 13 phút, và bị từ chối.

## B11 ★★☆☆☆ — `visibleOptions` bỏ qua `needCash` ở nhánh dự phòng
`talk.ts`:
```
const out = nodes.filter((o) => (!o.need || !!gate.flags[o.need])
  && (o.needCash === undefined || (gate.cash ?? Infinity) >= o.needCash));
return out.length ? out : nodes.slice(0, 1);
```
Nếu **mọi** lựa chọn bị lọc sạch, nó trả `nodes.slice(0, 1)` — **không kiểm lại
`needCash`**. Nút bị ẩn vì không đủ tiền có thể quay lại thành **lựa chọn duy nhất**. Rồi
`applyAct` case `PAY`: `const amt = Math.min(act.vnd, have);` — **trả được bao nhiêu trả
bấy nhiêu**, trong khi lời thoại vẫn nói là đã mua xong.

Comment trong code nói rõ ý đồ ("không hứa được cái mình không trả nổi"); nhánh dự phòng
phá đúng ý đồ đó. Hiếm, nhưng khi xảy ra thì nó là một **lời nói dối của hệ thống** — thứ
mà T5 cấm.

## B12 ★★☆☆☆ — `markTalkUsed` và comment của nó nói ngược nhau
Comment ở `service.ts:2549`: *"Ghi 'đã nói chuyện này rồi' NGAY lúc mở, không đợi nói
xong"*. Code thì gọi nó trong `chooseTalk()` (dòng 2347) ở **lần chọn đầu tiên**, không
phải lúc mở — và `openTalk()` (dòng 2306) có hẳn một khối comment giải thích vì sao **cố ý
không** đánh dấu lúc mở.

Comment cũ sót lại. Không phải bug chạy, nhưng nó là chỗ người sửa sau sẽ đọc nhầm — và cái
hành vi thật (mở rồi Esc thì không mất gì) chính là thứ Khoa biến thành **gallery mode**.

## B13 ★★☆☆☆ — `offerTalk` bị khoá sau quá nhiều cửa, nên kênh bị động coi như không tồn tại
`smalltalk()` (`service.ts:1484`) → `offerTalk()` chỉ chạy khi **tất cả** đúng:
`c.phase === "waiting"` · chưa smalltalk lượt này · `nowSec − c.orderedAt ≥ 4` ·
`queue` rỗng · **không ai đang nói** · chưa có `offer` nào treo · `offersToday < 3` ·
`nowSec − lastOfferAt ≥ 100` · NPC có cuộc `initiates` còn lại · roll
`talk:<day>:<id>` < `initiates` (0.18–0.30).

Và bảng `initiates` thực tế:
- **Ngày 1–2: đúng 1 cuộc** khả dĩ trên toàn game (`bay.veso`, 0.3).
- Ngày 3–4: thêm `bay.soi`. Ngày 5: thêm `dung.mottsao`.
- **14/17 cuộc còn lại khoá sau `day ≥ 9` VÀ `minVisits ≥ 4`.**
- `walkin.json`: **0**. `qua-duong.json`: **0**.

Nghĩa là trong **tuần đầu tiên** — đúng cái tuần người chơi học game là gì — xác suất NPC
tự mở lời là **gần như 0**. Lỗi #2 của chủ dự án ("phải chủ động bấm F mới có gì xảy ra")
không phải cảm giác. Nó là **số liệu**.

## B14 ★☆☆☆☆ — Panel vẽ lại một khuôn mặt để thay cho khuôn mặt nó vừa che
Không phải bug, là một **vòng luẩn quẩn thiết kế** đáng ghi: `MAX_H_RATIO = 0.56` che mất
người đang nói → nên phải vẽ `mood` badge 22px + phụ đề một chữ để bù → mà badge thì không
đọc nổi "ngượng" với "rưng rưng" (comment trong code tự thừa nhận) → nên phải thêm phụ đề
chữ → và cả cụm đó lại ăn thêm một cột chiều rộng, làm câu thoại hẹp lại, wrap nhiều dòng
hơn, **đẩy nhanh lỗi tràn B3**. Khoa gọi tên đúng: *"mấy ông vừa che mất người thật rồi
dán một cái icon lên chỗ che."*

---

# TỔNG HỢP C — "NẾU ĐƯỢC ĐỔI MỘT THỨ DUY NHẤT"

Nói bằng ngôn ngữ người chơi. Không phải giải pháp kỹ thuật.

> **1 · MINH (cozy):**
> *"Cho tôi biết tôi đang nói với ai, ngay trên đầu người đó, trước khi tôi bấm. Một
> vòng sáng, một cái gạch dưới chân, gì cũng được — miễn là tôi nhìn thấy nó TRƯỚC khi
> tôi bấm F chứ không phải sau khi cái bảng đã mở ra nhầm người. Và đừng bắt tôi tiết
> kiệm việc nói chuyện. Tôi tới đây để thân với người ta, không phải để tiêu một cái kho."*

> **2 · TRANG (tối ưu):**
> *"Cho tôi thấy nó ĐƯỢC hay MẤT gì, ngay lúc đó, bằng cái gì không phải con số. Bà Bảy
> nghe xong câu đó thì bà **đứng chờ lâu hơn** hay bà **sốt ruột hơn** — cho tôi thấy cái
> đó trên người bà, trong một giây. Còn nếu nói chuyện thật sự không ảnh hưởng gì tới
> việc bán bánh thì nói thẳng ra đi, tôi sẽ không bấm nữa và cả hai cùng khỏe."*

> **3 · KHOA (narrative):**
> *"Để tôi thấy câu của CHÍNH TÔI nằm cạnh câu họ đáp. Và cho tôi cuộn lại đọc được. Mấy
> ông viết mười hai ngàn dòng thoại rồi in nó vào một cái ô ba dòng bị chính cái bảng của
> mấy ông che mất. Tôi không cần nhiều chữ hơn — tôi cần **nhìn thấy** cái chữ mấy ông đã
> viết rồi."*

> **4 · CÔ HẠNH (trợ năng):**
> *"Cho cô cái nút ĐÓNG. Một cái nút thật, có chữ 'Thôi', bấm chuột được, và bấm vô nó thì
> KHÔNG có chuyện gì xấu xảy ra. Cô không cần biết 'làm thinh' là gì. Cô cần biết là nếu
> cô lỡ tay mở cái bảng này thì cô ra được mà không làm hỏng gì hết."*

> **5 · CẢ BỐN NGƯỜI, nói cùng một câu:**
> *"Đừng để NPC nói với tôi rồi phạt tôi vì tôi không nghe thấy. Nếu người ta bắt chuyện
> thì để người ta **cứ đứng đó mà chờ** — có một cái dấu trên đầu họ, bền, không trôi — và
> tôi trả lời lúc tôi rảnh tay. Cái dòng chữ góc phải biến mất sau bốn giây rồi trừ điểm
> tôi là việc tệ nhất mà game này đang làm với người chơi."*

---

## PHỤ LỤC — bảng "đau theo phút" của bốn phiên

| Phút thật | Minh | Trang | Khoa | Cô Hạnh |
|---|---|---|---|---|
| 1–2 | thích hẻm, thích người đi ngang | lập bản đồ phím | đọc nhãn, mở sổ tay | vật lộn với WASD |
| 3–4 | **F câm vì tay bận** (B9) | **phát hiện F = free pause** (B1-adj) | gật đầu vì phiếu đơn nguyên văn | — |
| 5–6 | panel che nhật ký (B2) | "6 nút, 0 con số đổi" | **mất câu nói của mình** (B2) | **mở nhầm panel, không có nút X** (B4) · **giữ phím → tự chạy hết cây** (B1) |
| 7–8 | **Esc có giá mà không báo** (B4) | **route nhầm người** (B8) → **bỏ** | **cạn 6 cuộc/NPC** (B7) | **chữ 200% tràn ra ngoài** (B3) → **bỏ** |
| 9–10 | **"bữa nay rồi" nói dối** (B7) | `walkin.nhamquan` xác nhận kết luận | **bị phạt vì không trả lời được trong lúc kẹp bánh** (B5+B6) → **chuyển sang spam** | — |
| 11–13 | chuyển sang **dùng dè** | chơi lại, 0 lần bấm F | gallery mode | — |

**Thời điểm từ bỏ / đổi hành vi:**
- Trang — **phút 7–8**, bỏ hẳn, bằng tính toán.
- Cô Hạnh — **phút 6**, bỏ hẳn, vì sợ.
- Khoa — **phút 9**, không bỏ mà **spam** (gallery mode) — hành vi tệ nhất cho hệ thống.
- Minh — **phút 11**, không bỏ mà **dùng dè** — và đường cong thân thiết đi **ngược**.

**Không một ai trong bốn người đi tới cuối phiên với cảm giác "tôi đang trò chuyện với
hàng xóm trong hẻm".** Cả bốn đều kết thúc với cảm giác "tôi đang thao tác một cái menu
không đoán được".
