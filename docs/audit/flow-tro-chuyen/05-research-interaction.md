# 05 — RESEARCH: hệ tương tác, input và chỉ báo (RESEARCHER #2)

> Phạm vi: phím tương tác, chọn mục tiêu, chỉ báo, thông báo không chặn, trợ năng đầu vào,
> modal vs diegetic. KHÔNG bàn nội dung thoại (đó là researcher khác).
>
> Quy ước nguồn: **[S]** = có link thật, đã đọc. **[M]** = theo trí nhớ của tôi, CHƯA xác
> minh được bằng nguồn trong lần rà này — đừng trích vào tài liệu thiết kế mà không kiểm lại.
> **[C]** = đọc thẳng từ code trong repo này (có số dòng).

---

## 0. TRẠNG THÁI THẬT CỦA CODE (đọc trước khi đọc phần sau)

### 0.1 Sơ đồ phím hiện tại — `src/scenes/StallScene.ts:958–995` [C]

```
kb.addKeys("W,A,S,D,UP,LEFT,DOWN,RIGHT,E,SPACE,Q,R,ESC,SHIFT,C,F,P")
```

| Phím | Ở đâu xử lý | Làm gì |
|---|---|---|
| W A S D / ↑↓←→ | `update().input` (dòng ~1025) | đi; bị khoá cứng khi `handsBusy \|\| busy` |
| Shift | như trên | chạy — **vô hiệu khi đang giữ C** |
| E / Space | `press()` dòng 1504 | làm việc ở `this.near` (trạm gần nhất) |
| R | `liftFromBoard()` 1617 | nhấc ổ trơn trên thớt |
| Q | `discard()` 1988 | đặt xuống sàn / nhặt lên / bỏ thùng |
| G | `writeDebt()` 1421 | ghi sổ nợ (có hàng đợi nếu tay bận) |
| F | `askFront()` 2108 | `Service.openTalk()` |
| C | đọc `isDown` trực tiếp | giữ để che tay; làm mọi thao tác chậm 1,3× |
| Tab | handler `keydown` | mở sổ tay |
| P | handler `keydown` | pause / resume |
| Esc | handler `keydown-ESC` riêng | **3 nghĩa**: gác ổ (bảng kẹp nhân) → overlayBack → pause/resume |
| 1–9, Backspace, Enter | `AssemblyPanel.handleKey()` 546 | bỏ nhân / hoàn tác / gói |
| 1–4, ↑↓, Enter, Esc | `TalkPanel.bindKeys()` | chọn câu / **Esc = làm thinh, CÓ GIÁ** |

### 0.2 Hình học thật của cái quầy — `src/world/map.ts` [C]

```
y1  hàng trạm:  kệ x4 · lò x7 · thùng rác x10 · trà x13 · bồn rửa x15
y2–y5          LỐI ĐI CỦA NGƯỜI CHƠI  ← người chơi chỉ ở được 4 hàng này
y6  QUẦY (đặc) thớt x4 · rổ x8 · chỗ đưa hàng x12  — lối ra duy nhất ở x21–22
y7,6           QUEUE_SLOTS: x = 12,5 / 11,0 / 9,5 / 8,0 / 6,5 / 5,0
y9,6 + y12,4   hai dải NGƯỜI QUA ĐƯỜNG
```

Ba hệ quả tính ra được, rất quan trọng cho mọi đề xuất bên dưới:

1. **Người chơi không bao giờ xuống dưới y≈5,5.** Khoảng cách dọc tối thiểu tới khách
   ở quầy luôn ≈ **2,1 ô**, gần như HẰNG SỐ. Nên trong công thức chọn mục tiêu, trục y
   gần như không phân biệt được ai; **chỉ trục x mới phân biệt được**.
2. **Người qua đường nằm ngoài tầm khi người chơi còn ở sau quầy**: Δy ≥ 4,1 ô >
   `TALK_REACH = 3` (`src/sim/service.ts:98`). Họ chỉ với tới được khi người chơi đi vòng
   ra cửa x21–22. Đây là một bảo đảm HÌNH HỌC, không phải may rủi — tận dụng nó.
3. **Hai người xếp hàng cạnh nhau cách nhau 1,5 ô = 45 px màn hình** (`toScreen`:
   Δsx = 1,5 × 30). Nhân `ZOOM = 1,28` ra ~57 px. Thân người ~26 px. → **bàn chân của
   họ KHÔNG BAO GIỜ chồng nhau trên màn hình, kể cả khi thân và đầu chồng.**
   `CustomerActor.ts:276–294` đã khai thác đúng điều này để đặt chip tên **ở chân**.

### 0.3 Bốn lỗi cụ thể tôi tìm thấy trong code (ngoài 7 lỗi chủ dự án báo)

**(a) `?` và `!` trên đầu NPC ĐÃ BỊ CHIẾM** — `CustomerActor.ts:304`:
```ts
const glyph = st?.state === "GLIMPSED" ? "?" : st?.state === "CONFIRMED" ? "!" : "";
```
Đó là hệ ÁNH NHÌN (perception). Thêm một dấu `!` kiểu JRPG cho "muốn nói chuyện" là
**đụng trực tiếp** vào ký hiệu quan trọng nhất của T1/T5. Loại bỏ phương án này ngay.

**(b) Dòng nhắc của trạm bị cú F cướp mất** — `StallScene.promptLine():1251` trả dòng
`"F — nói chuyện với X"` ở nhánh CUỐI, và `Hud.drawPrompt()` dùng
`this.prompt.setText(override ?? (why ...))` — **override THAY THẾ hoàn toàn** dòng trạm.
Đứng ở quãng x≈9,7–10,9 (ngoài tầm cả rổ lẫn chỗ đưa hàng) không sao, nhưng ở mép tầm
với của rổ mà có người xếp hàng gần hơn thì dòng "E — để bánh xuống" biến mất.

**(c) Người đứng ĐẦU QUẦY không bao giờ có dòng nhắc nói chuyện** —
`Service.nearbyToTalk():2399` trả `c !== this.front ? c : null`. Tức là mục tiêu PHỔ BIẾN
NHẤT của phím F là mục tiêu DUY NHẤT không có chỉ báo nào. Đây chính là lõi của lỗi #7.

**(d) Esc có giá** — `TalkPanel` bắt Esc ở pha capture, gọi `onClose` → `ignoreTalk()` →
`Service.closeTalk()` → `applyIgnore()` (rel −1) khi khách mở lời trước. **Phím "thoát UI"
phổ quát bị gán một hình phạt trong trò chơi.** Đây là một lỗi trợ năng thật, xem §5.

---

## 1. MỘT PHÍM NGỮ CẢNH vs NHIỀU PHÍM CHUYÊN DỤNG

### Kết luận ngắn
**Gộp F vào E.** Game này đã có một hệ "một phím theo ngữ cảnh" rất tốt rồi — chỉ là nó
dừng ở ĐỒ VẬT và không chịu nhận NGƯỜI. `stationNear()` đã có bán kính (1,6 ô), có
**stickiness** (`STICKY = 0.62`), và có một dòng nhắc nói trước E sẽ làm gì. Phím F là một
hệ tương tác THỨ HAI chạy song song với **luật khác** (bán kính 3 ô, euclid, không sticky,
không chỉ báo). Hai hệ tương tác cho cùng một ý định "tác động vào cái trước mặt" là chỗ
người chơi phải tự dịch ý định của mình sang hai ngôn ngữ.

### Khi nào NÊN gộp — quy tắc rút ra từ khảo sát

| Tiêu chí | Gộp một phím | Giữ phím riêng |
|---|---|---|
| Hai hành động có **xảy ra đồng thời** không? | Không bao giờ → gộp | Có → tách |
| Người chơi có **đọc được trước** cái sẽ xảy ra không? | Có (dòng nhắc/highlight) → gộp | Không → tách |
| Hai hành động có **trái ngược hệ quả** không? | Không → gộp | Có → tách |
| Hành động có **gấp / lặp nhiều** không? | Không → gộp | Có → tách (độ trễ của hold/double-tap giết cảm giác) |

Hai dòng đầu là chốt chặn. Nguồn tổng hợp: *Context-Sensitive Button* (TV Tropes) ghi
đúng cái đánh đổi — nút ngữ cảnh "giải phóng các nút khác cho hành động dùng thường
xuyên hơn"; và điểm quan trọng: **"khi các thao tác là song song thì không thể dùng ngữ
cảnh để gán nhiều thao tác lên một nút"** [S]. Nguyên tắc ngược lại ("one button, one
function" cho cảm giác phản hồi tức thì, hold/double-press thêm độ trễ hệ thống) cũng
nằm trong cùng nhóm nguồn [S].

### Khảo sát

- **Zelda (Twilight Princess → BotW)** — A theo ngữ cảnh: nói chuyện, mở cửa, đẩy, kéo,
  ném; màn hình hiện sẵn A sẽ làm gì. Cơ chế này có từ Twilight Princess, BotW chỉ kế
  thừa [S]. **Bài học thất bại cũng quan trọng ngang**: BotW đi qua một vũ khí rơi khi
  túi đầy thì dòng nhắc vẫn ghi "Take", bấm A thì chỉ báo "hết chỗ" rồi thôi — tức là
  *dòng nhắc nói dối về kết quả* [S]. Repo này **đã làm đúng chỗ đó**: `blockedReason()`
  (`stations.ts`) nói thẳng lý do chứ không để người chơi bấm vào khoảng không. Giữ
  nguyên tắc đó khi gộp người vào.
- **Half-Life: Alyx — Gravity Gloves, 3 nhịp** [S]: *selection* (vật sáng lên → "đây là
  cái đang được nhắm"), *lock-on* (bóp cò → **khoá mục tiêu, có cử động tay cũng không
  đổi sang vật khác nữa**), *confirmation* (động tác kéo). Luận điểm của tác giả:
  "it ensures that both the player and the game are on the same page before the object
  is pulled". **Đây là nguồn mạnh nhất cho §2**: giai đoạn lock-on chính là STICKINESS.
- **Hitman / RDR2 / Monster Hunter / Assassin's Creed** — nhóm game "nhiều hành động hơn
  số nút": một nút làm gì phụ thuộc vào thứ đang nhìn, thứ đang làm, trang bị, đang
  chiến đấu hay không [S]. Hitman 3 trả giá: review trợ năng của *Can I Play That?* chê
  thẳng "players also cannot adjust the interaction long presses and rapid button mashing
  is still required and unchangeable" và không có remap trên console [S]. → Gộp ngữ cảnh
  thì được, nhưng **đừng gộp bằng cách nhét thêm ngữ nghĩa vào NHỊP GIỮ**.
- **Dead Space** — chỉ thị thiết kế "mọi thành phần giao diện phải nằm TRONG thế giới
  game"; RIG trên lưng Isaac là HUD, hologram là cái cớ để mọi thứ diegetic [S]. Liên
  quan ở §6 hơn §1, nhưng hệ quả cho §1: nếu chỉ báo nằm trong thế giới thì một phím ngữ
  cảnh mới đọc được — vì cái "ngữ cảnh" đang được tô sáng ngay tại chỗ.
- **Deus Ex** — tôi KHÔNG xác minh được nguồn trong lần rà này. Theo trí nhớ: Deus Ex
  (2000) tách "Use" (frob) khỏi "Attack", và DX:HR dùng một phím ngữ cảnh + prompt;
  nhưng đừng trích con số nào [M].

### Khuyến nghị cụ thể cho game này

1. **E/Space là PHÍM TƯƠNG TÁC DUY NHẤT.** Trạm và người đi chung một hàng đợi ứng viên,
   phân giải bằng 4 dòng ở §2.
2. **Giữ F làm ALIAS "ép nói chuyện"**, không bỏ. Lý do: (a) người đã chơi không phải học
   lại; (b) nó là *lối thoát* của quy tắc "trạm thắng người" — đứng ở chỗ đưa hàng, tay
   cầm ổ đã gói, mà muốn nói một câu trước khi đưa thì F làm được còn E thì không.
   Nhưng F **không được là đường duy nhất** tới bất cứ thứ gì.
3. **Giữ nguyên R.** Comment ở `liftFromBoard():1617` lập luận đúng theo tiêu chí
   "hai hành động trái ngược hệ quả" (nướng lại vs kẹp tiếp). Đừng gộp lại.
4. **Esc chỉ còn MỘT nghĩa: "đóng cái đang mở; không có gì mở thì pause".** Ba nghĩa hiện
   tại thực ra đã là một nghĩa duy nhất rồi — trừ cái nghĩa thứ tư lén lút là "làm thinh
   có giá". Bỏ nghĩa đó đi (§5) là Esc hết nhập nhằng mà không mất tính năng nào.

---

## 2. CHỈ BÁO "CÁI GÌ SẼ ĐƯỢC TƯƠNG TÁC" — target disambiguation

### Kết luận ngắn
Ba thứ, theo đúng thứ tự quan trọng:
**(1) điểm số có HYSTERESIS** (không phải "gần nhất thắng"), **(2) chỉ báo vẽ DƯỚI CHÂN**
(không phải trên đầu — chỗ đó đã hết), **(3) cách đổi mục tiêu là BƯỚC ĐI**, không phải
một phím mới.

### Cách tính điểm chọn mục tiêu — khảo sát

Dòng nghiên cứu đúng tên gọi là **score-based selection** trong VR/HCI:

- **IntenSelect** (Haan, Koutek & Post) — thay tia bằng một **hình nón**, mỗi vật được
  chấm điểm theo **góc chắn giữa tâm vật và trục nón, có bù theo khoảng cách**; chọn vật
  điểm cao nhất; và **điểm được TÍCH LUỸ theo thời gian** để giữ ổn định khi tay người
  dùng rung [S].
- **IntenSelect+** (Krüger et al., IEEE VR 2024) — cải tiến: snap về **điểm gần nhất của
  vật** so với tia, thay vì tâm vật; nêu rõ IntenSelect gốc "khó chỉnh tham số" và kém
  linh hoạt [S]. (Tôi tải được PDF nhưng không trích xuất được công thức — đừng chép số
  từ tôi, hãy mở bản IEEE/RWTH nếu cần hằng số gốc.)
- **Direct vs. Score-based Selection** (arXiv 2602.01061) — tổng kết: các kỹ thuật chấm
  điểm "gán một **điểm ý định** cho từng mục tiêu rồi snap về cái người dùng muốn";
  IntenSelect và StickyRay chấm theo góc, hướng mở rộng hiện đại ("focal-based") **đưa
  khoảng cách không gian vào mô hình ý định** [S].
- **Dot product** là công cụ chuẩn để lấy thành phần "góc": tích vô hướng của hai vector
  đơn vị = cos của góc giữa chúng [S].

→ **Công thức chuẩn ngành là: điểm = f(khoảng cách) + g(góc so với hướng nhắm), cộng một
cơ chế tích luỹ / bám dính theo thời gian.** Đúng ba thành phần đó.

Và quan trọng nhất, **repo này đã có sẵn đúng cơ chế đó cho TRẠM** —
`stations.ts: stationNear(wx, wy, current)` + `STICKY = 0.62`, với một khối chú thích giải
thích chính xác triệu chứng mà `nearestTalkable()` đang mắc phải:

> *"đứng ở quãng giữa thì nhích nửa bước là trạm được chọn nhảy qua lại, và cú E vừa bấm
> rơi vào trạm KHÁC với trạm người chơi đang đọc tên trên dòng nhắc."*

`Service.nearestTalkable():2422` thì **không có `current`, không có sticky, không có góc**.
Sửa lỗi #7 phần lớn chỉ là *áp đúng bài học đã học được ở file bên cạnh*.

Alyx bổ sung tầng thứ hai: **lock-on** [S]. Dịch sang game này: khi một cuộc trò chuyện
đã mở, mục tiêu **khoá cứng** — người chơi có đi đâu, có ai bước tới, mục tiêu không đổi.

### Vì sao KHÔNG dùng mấy phương án kia

| Phương án | Vì sao không hợp game này |
|---|---|
| Icon nổi trên đầu (`!`) | **Đụng `?`/`!` của hệ ánh nhìn** (`CustomerActor.ts:304`). Và quest-marker bị chê đúng cái điểm "người chơi đuổi theo dấu chứ không nhìn thế giới" [S] — trong khi lõi game là NHÌN mặt khách. |
| Outline / viền phát sáng | Nhân vật là sprite ảnh thật (`art/photo.ts`), không có shader outline; và ở 2.5D đứng chồng nhau thì viền của người sau nằm lọt trong thân người trước — không đọc ra. |
| Con trỏ hướng / reticle | Game không có chuột nhắm; thêm một con trỏ là thêm một thứ phải điều khiển. Trái CANON §15 (giảm độ phức tạp đầu vào). |
| Danh sách xoay vòng bằng Tab | Tab đã là SỔ TAY. Và quan trọng hơn: xoay vòng là một thao tác TRỪU TƯỢNG — người chơi phải xây một mô hình "thứ tự danh sách" trong đầu, trong lúc hai tay đang bận. |
| Chọn theo hướng mặt, một mình | Hướng mặt (`facingOf8`) đổi theo phím đi vừa bấm, nên nó **rung** đúng lúc người chơi dừng chân. Dùng được, nhưng chỉ như một **số hạng cộng thêm**, không phải tiêu chí chính. |

### Phương án đề xuất — "VÒNG DƯỚI CHÂN + BƯỚC DỌC QUẦY"

**(a) Chỉ báo = một vòng ellipse iso (2:1) dưới chân người đang được nhắm.**
Lý do kỹ thuật, không phải thẩm mỹ: ở phép chiếu này **bàn chân là bộ phận duy nhất không
bao giờ bị chồng** khi ba người đứng chụm — hai chỗ xếp hàng cách nhau 45 px ngang (×1,28
zoom) trong khi thân chỉ rộng ~26 px. `CustomerActor.ts:276–294` đã dựa vào đúng lập luận
này để đặt chip tên ở chân, và chú thích ở đó nói thẳng: *"ở chân thì chip đi theo đúng
nhịp hàng chờ nên hai chip KHÔNG BAO GIỜ chồng nhau, và không chip nào che mặt ai"*.
→ Vòng chân thừa hưởng toàn bộ bảo đảm đó **miễn phí**, và không tốn một pixel nào ở vùng
trên đầu (nơi đã có `?`/`!`, huy hiệu mặt, bong bóng, và `bang()` của việc nhà).

**(b) Kênh thứ hai: chip tên sẵn có đổi trạng thái.** `tag` hiện vẽ với alpha 0,9 màu
muted. Khi là mục tiêu: alpha 1,0, màu ink, tiền tố `E ·`. Hai kênh (hình + chữ) chứ không
chỉ màu — đúng P1-04 §4.1. **Bonus:** người qua đường hiện KHÔNG có chip tên (chú thích ở
`:291` giải thích vì sao). Cho chip hiện ra **đúng lúc họ trở thành mục tiêu** — khớp y
nguyên câu chú thích đã viết: *"Tên họ chỉ hiện lúc người chơi thật sự bắt chuyện"*.

**(c) Cách ĐỔI mục tiêu = bước sang trái/phải dọc quầy.** Không phím mới. Đây là thao tác
đúng về mặt diegetic (người bán bước qua chỗ người mình đang nói), dùng kỹ năng người
chơi đã có (WASD), và khớp hình học ở §0.2 (chỉ trục x phân biệt được ai). Để dạy luật
này mà không viết tutorial: khi còn ứng viên khác trong tầm, vẽ **hai mũi nhọn nhỏ** ở hai
mép vòng chân, chỉ về phía người kế tiếp.

**(d) Hai bảo đảm "không bao giờ chọn nhầm" do hình học tặng không:**
- Người đi ngang (y 9,6) **không thể** là mục tiêu khi người chơi còn sau quầy (Δy ≥ 4,1 >
  3). Không cần luật đặc biệt nào.
- Lò (y1) và khách (y7,6) cách nhau 6,6 ô; không có chỗ đứng nào vừa với tới lò vừa với
  tới khách. Xung đột trạm↔người **chỉ xảy ra ở hàng quầy y6** (thớt, rổ, chỗ đưa hàng).
  Đó là ba trạm, không phải tám — quy tắc phân giải chỉ cần đúng ở ba chỗ.

---

## 3. THÔNG BÁO KHÔNG CHẶN CHO HỘI THOẠI

### Kết luận ngắn
Bỏ toast. Dùng **bong bóng TỰ XẸP DẦN trên chính người nói** làm thông báo, không dùng
chrome. Người chơi không bỏ lỡ vì nó ở ngay chỗ người đó đứng; không bị làm phiền vì nó
không chiếm chỗ nào của cái quán và tự tắt.

### Nghiên cứu nền

**"Notification decay" trong game — tôi KHÔNG tìm thấy công trình nào mang đúng tên đó.**
Nói thẳng ra để không ai đi trích một thứ không tồn tại. Ba dòng nghiên cứu THẬT và dùng
được:

1. **Interruption coordination modes** (Applied Sciences 8(10):1780, MDPI 2018) [S]. Bốn
   chế độ: *immediate · negotiated · scheduled · mediated*. Kết quả: **negotiated** (hệ
   thống chỉ BÁO, người nhận tự quyết khi nào chấp nhận) cho **tỉ lệ lỗi thấp nhất** và
   người dùng **ít cảm thấy áp lực thời gian nhất**. Khái niệm *interruption lag* (thời
   gian để bắt đầu việc chen ngang) và *resumption lag* (thời gian quay lại việc cũ) đều
   "rút cạn tài nguyên chú ý và trí nhớ của việc chính" [S].
   → **Chính xác là lỗi #1 và #3 của chủ dự án, viết bằng ngôn ngữ HCI.** Panel modal +
   đóng băng đồng hồ = chế độ *immediate*. Phải chuyển sang *negotiated*.
2. **Banner blindness** (Benway & Lane, 1998; tổng kết lại bởi NN/g) [S]: người dùng học
   cách bỏ qua những phần tử **đoán trước được** — "não không đánh giá từng quảng cáo một,
   nó khớp một mẫu thị giác rồi bỏ qua". Hệ quả cho game: **một dấu `!` bền, luôn giống
   nhau, trên đầu NPC sẽ bị mù sau chừng một tuần chơi.** Thứ chống lại nó là *thay đổi*
   (chuyển động, biến dạng), không phải *độ bền*.
3. **Notification blindness** — có mô tả trong tài liệu sáng chế: người dùng mù với một
   badge thông báo nếu nó hiện **quá nhiều lần** hoặc nội dung **không đủ thú vị** [S].
   Nguồn yếu (patent, không peer-review) nhưng cơ chế khớp với (2).

### So sánh bốn phương án

| Phương án | Không bỏ lỡ? | Không phiền? | Hợp game này? |
|---|---|---|---|
| **Toast trôi (hiện tại)** | ✗ 3,4 s ở cột PHẢI trong khi mắt đang ở lò/thớt giữa màn hình | ✓ | **✗ và nó vi phạm chính luật của Hud.ts** |
| **Bong bóng neo trên đầu NPC** | ~ (phải nhìn về phía đó) | ✓✓ tự tắt | **✓✓ hạ tầng đã có** (`BubblePool`) |
| **Icon bền `!` / `...`** | ✓✓ | ✗ phiền, và bị mù dần | **✗ đụng `?`/`!` ánh nhìn** |
| **Hàng đợi ở rìa màn hình** | ✓ | ✗✗ | **✗ chính là "switch content"** |

**Lập luận nội bộ mạnh nhất, lấy từ chính `src/ui/Hud.ts:84–96`** — file tự khai hai kênh
chữ KHÔNG ĐƯỢC TRỘN:

> *"`say()` — LỜI NGƯỜI. Khách nói, mình nói. Ở góc dưới trái. `toast()` — VIỆC MÁY BÁO.
> 'lau thớt', 'khét rồi!'. Ở đỉnh màn hình."*

Và `StallScene.ts:1405` lại đẩy **"\<tên\> bắt chuyện — bấm F để trả lời"** vào `toast()`.
Một người đang nói với bạn **không phải việc máy báo**. Hiện tại đang vi phạm luật do
chính dự án đặt ra. Đó là lý do nó vừa bị bỏ lỡ (sai chỗ) vừa gây phiền (sai loại).

### Đề xuất: BONG BÓNG BA NHỊP TỰ XẸP (không chrome, không phím)

```
nhịp A  0 – ~2,5 s      Khách quay mặt về phía người chơi + bong bóng ĐẦY, nguyên câu opener.
                        (= "announce" của negotiated interruption)
nhịp B  ~2,5 s – hết    Bong bóng KHÔNG tắt; nó XẸP lại thành một bong bóng tí hon chứa
        (hoặc ~25 s)    đúng "…", neo ở CHÍNH CHỖ đuôi bong bóng cũ (vai dưới-trái của đầu).
                        Đây là "người ta còn đang chờ bạn trả lời", chiếm ~24×18 px.
nhịp C  5 s cuối        "…" rụng từng chấm một: "…" → ".." → "." → tắt.
                        Một cái đếm ngược ĐỌC ĐƯỢC mà không phải thanh kiên nhẫn (T3),
                        và thoả T5: cái giá của làm thinh phải đọc được TRƯỚC khi nó xảy ra.
```

Vì sao nhịp B là "xẹp" chứ không "tắt rồi hiện icon khác": nó là **cùng một vật thể biến
dạng**, nên mắt theo dõi được liên tục; và nó **không đụng vùng trên đỉnh đầu** nơi `?`/`!`
và huy hiệu mặt đang ở. Vì sao nhịp C chống banner blindness: nó **thay đổi**, không bền
đơn điệu [S].

**Tiền lệ cho "mã hoá mức khẩn bằng HÌNH DẠNG, không bằng màu":** The Sims — bong bóng
**mượt = chưa gấp, bong bóng răng cưa = gấp**; nội dung bong bóng (nhà vệ sinh, mặt một
sim có gạch chéo…) là cách game cho người chơi **đoán trước hành vi NPC** [S]. Rất khớp
CANON §15 ("icon phải khác nhau về HÌNH DÁNG, không chỉ màu") và §16 Đừng-1 (Orkin:
*vocalizing intentions* đủ rồi, khỏi mô phỏng).

**Liên hệ với `dialog/ruledb.ts` đã có trong repo:** đó là kiến trúc của Elan Ruskin,
*"AI-driven Dynamic Dialog through Fuzzy Pattern Matching"*, GDC 2012 (Valve; TF2, L4D2) —
khớp mờ hàng trăm fact về thế giới với một CSDL hàng ngàn câu, **ưu tiên luật CỤ THỂ nhất,
luật kém cụ thể làm dự phòng** [S]. Đây là động cơ đúng cho **bark không chặn**: nó sinh
ra câu nói để **phát ra bong bóng**, không phải để mở panel. Dùng đúng công cụ đã có.

### Khuyến nghị cụ thể

1. **Xoá hoàn toàn nhánh `ev.kind === "talkOffer"` khỏi `toast()`** (`StallScene.ts:1405`).
2. Mở rộng `Bubble` (`src/ui/stall/BubblePool.ts`) thêm trạng thái `deflated` và `dots`.
   Pool 8 cái là đủ: `Service` đã giữ tối đa 2 bong bóng ĐẦY cùng lúc; bong bóng "…" chiếm
   chỗ nhưng không chiếm *chú ý* — nếu cần, nâng `BUBBLE_POOL_SIZE` lên 12.
3. Dòng nhắc đáy màn hình **tự lo phần "không bỏ lỡ"**: khi người có `offerOpen` lọt vào
   tầm, §2 cho họ điểm thắng tuyệt đối → dòng nhắc ghi `E — trả lời cô Bảy` kèm vòng chân
   nhấp nháy chậm. Người chơi không cần nhớ gì.
4. Nếu người đó **ngoài tầm** mà đang chờ trả lời: dùng lại `ui/chorePin.ts` (đã có, đã có
   test quét ngàn vị trí) để ghim bong bóng "…" vào mép khung theo đúng hướng họ đứng.
   Không mũi tên — chú thích ở `chorePin.ts` đã lập luận rồi và lập luận đó đúng.

---

## 4. HOLD vs TAP vs DOUBLE-TAP để phân tầng ý định

### Kết luận ngắn
**Không.** Đừng phân tầng "chào qua loa / nói chuyện đàng hoàng" bằng NHỊP BẤM.
Phân tầng bằng **NGỮ CẢNH ĐỌC ĐƯỢC** — đó vừa là T5, vừa là trợ năng, vừa rẻ hơn.

### Đính chính một dữ kiện trong brief

Brief ghi *"RDR2 (tap = Greet, hold = Antagonize)"*. **Không đúng.** Theo wiki RDR2 [S]:
- **Giữ L2/LT** = *vào chế độ tương tác* (khoá người, mở menu phản hồi).
- Rồi **TAP**: Square/X = Greet · Circle/B = Antagonize · Triangle/Y = Rob · Square/X =
  Defuse.

Tức là **hold là CHẾ ĐỘ, không phải Ý ĐỊNH**; ý định luôn là một cú tap riêng biệt. Đây là
một phân biệt quan trọng, vì nó nói rằng cả Rockstar cũng không gán ý định xã hội vào thời
lượng giữ. Thêm nữa: **bấm Greet lặp lại thì Arthur nói tiếp** (chuyện thời tiết, NPC đáp)
[S] — tức là tầng "nói lâu hơn" = **TAP LẶP**, không phải GIỮ.

Và RDR2 ship sẵn **Tap Assist**: Off / 2× / 3× / 4× / **Hold** trong Settings → Controls →
Accessibility [S]. Nghĩa là ngay cả cái nhịp bấm cũng là một tuỳ chọn, không phải luật.

### Vì sao hold đặc biệt sai ở *game này*

1. **Ngân sách "giữ" của E đã dùng hết.** `holdMs` đã là một cơ chế có thật của trạm: lò
   1500 ms với vạch cháy ở 2300 ms, bồn rửa 1500 ms, thùng trà 600 ms (`stations.ts`).
   Thêm "giữ E ở người = nói chuyện sâu" là làm cho **cùng một phím, cùng một nhịp giữ,
   có nghĩa hoàn toàn khác tuỳ chỗ đứng** — mà chỗ đứng thì người chơi đang di chuyển liên
   tục. Đây đúng là thứ CANON T5 cấm: không đọc được rủi ro trước khi hành động.
2. **Shift và C đã là hai phím giữ.** Thêm cái thứ ba là ba ngón phải giữ trong một trò
   chơi mà hai tay đã bận.
3. **XAG 107** nói thẳng: *"Avoid introducing mechanics where a key or button should be
   held down for an extended period before the input is registered"*, và lưu ý rằng rào
   cản **thời lượng** không hề được gỡ bằng remap [S].

### Phân tầng ĐÚNG: theo ngữ cảnh, không theo nhịp

| Tầng | Kích hoạt (người chơi ĐỌC ĐƯỢC trước) | UI |
|---|---|---|
| **Chào qua loa** | E vào người **không có gì đang chờ** (không `offerOpen`, không đơn đang treo) | KHÔNG mở panel. Một bong bóng của mình + một bong bóng của họ. **Đồng hồ KHÔNG dừng.** |
| **Nói chuyện đàng hoàng** | E vào người **đang có bong bóng chờ trả lời**, hoặc người qua đường mình muốn mời | Mở bảng lựa chọn (§6). Đóng băng đồng hồ. |
| **Nói tiếp** | Bấm E **lần nữa** trong lúc bảng đang mở, hoặc chọn dòng "còn chuyện nữa…" | Thêm một nhịp. **Lặp TAP, y như Greet của RDR2** [S]. |

Người chơi phân biệt hai tầng bằng mắt: **có bong bóng "…" treo trên đầu người đó hay
không**. Không có đồng hồ bấm giờ nào trong ngón tay họ.

---

## 5. TRỢ NĂNG ĐẦU VÀO — persona cô Hạnh, 52 tuổi, tay chậm

### Kết luận ngắn
Hold có hại, và **lỗi trợ năng nghiêm trọng nhất hiện tại không phải hold — là Esc có giá.**

### Nguồn

- **Game Accessibility Guidelines**, mục *"Avoid / provide alternatives to requiring
  buttons to be held down"* — mức **intermediate**, nhóm **motor** [S]. Trích: giữ nút gây
  **đau**, nhất là nút cần lực (L3/R3); *"For many hold vs toggle is preference. For
  disabled gamers is just vital."* Ba thay thế được nêu: **một cú bấm thay vì giữ · một
  gạt (toggle) thay vì giữ · bấm đúp thay vì giữ**. Và: **nên cho người chơi CHỌN**, vì
  toggle chậm hơn giữ một chút. Ví dụ tốt: Battlefield 4, Titanfall, Uncharted 4.
- **Xbox Accessibility Guideline 107** — "operate the gaming interface through input
  mechanisms of their choice" [S]. Ba rào cản được tách riêng và **không cái nào gỡ được
  bằng remap**: **Speed · Complexity · Duration**. Câu hỏi soát xét có sẵn:
  *"Are there areas in your game where a player must press buttons quickly or hold them
  for prolonged periods (2–3 seconds or more)?"*. Khuyến nghị: **"Toggles and 'auto'
  holds"**; và **remap theo HÀNH ĐỘNG, không theo phím**.
- **The Long Dark** — tính năng *"accessible interactions"*: *"converts all press and hold
  actions into press actions, for people with CTS or similar considerations"* (XAG 107
  trích làm ví dụ mẫu) [S]. **Đây là mô hình chính xác nên copy.**
- **The Last of Us Part II** — 60+ tuỳ chọn; có tuỳ chọn **đổi từng cú giữ thành toggle và
  từng cú bấm liên tục thành giữ**, riêng lẻ cho ngắm / nghe / chạy / chế đồ / đổi vũ khí
  / nín thở; preset "motor accessibility" bật sẵn *Repeated Button Presses → Hold* [S].
- **Hitman 3** — phản ví dụ: không remap trên console, long-press không chỉnh được, mash
  không bỏ được; *Can I Play That?* kết luận game "fail[ed] to … keep in line with what I
  think is fair to call accessibility standards of next-gen games" [S].
- **XAG 107, phần con trỏ** — hai câu đáng dán lên tường cho dự án này [S]:
  > *"The down click … doesn't automatically activate that item. Activation occurs on the
  > up event."*
  > *"A mechanism is available to cancel the action before completion … If a mechanism to
  > cancel the action isn't available, a simple mechanism to undo the action is provided."*

### Sáu việc cụ thể

**(1) ⚠️ Esc phải MIỄN PHÍ, luôn luôn. Đây là việc gấp nhất.**
Hiện tại: khách mở lời → người chơi bấm Esc → `applyIgnore()` → rel −1. Cô Hạnh lỡ tay,
hoặc đọc chưa kịp mà hoảng, hoặc chỉ muốn đóng bảng để nhìn cái lò — đều bị phạt. Điều này
vi phạm thẳng câu XAG 107 vừa trích.
**Sửa:** tách hai thứ đang bị gộp.
- `Esc` = **đóng bảng, không hậu quả, mọi lúc**. Cuộc trò chuyện vẫn còn đó để mở lại.
- "Làm thinh" trở thành **một DÒNG trong danh sách lựa chọn**, giọng `IM` (giá trị
  `TalkTone.IM` **đã tồn tại** trong `sim/talk.ts`), chữ hiển thị `…` hoặc `(không nói gì)`.
  Chọn nó thì mất rel — vì đó là một **lựa chọn**, không phải một thao tác UI.
- Bonus: nó khớp T2 hơn (im lặng trở thành nội dung được viết ra, không phải tác dụng phụ
  của giao diện) và khớp T5 (giá nằm ngay trên dòng người ta bấm).
Lưu ý thực thi: nếu khách mở lời rồi **đi mất** mà người chơi chưa trả lời — cái đó vẫn
tính là làm thinh, đúng như hiện tại. Phạt vì **hết giờ**, không phạt vì **bấm Esc**.

**(2) Tuỳ chọn "Thao tác giữ → bấm" (một dòng trong menu trợ năng).**
Theo mô hình The Long Dark [S]. Bật lên thì: lò / bồn rửa / thùng trà đổi từ *giữ liên tục*
sang *bấm bắt đầu — bấm lần nữa để dừng*. **Thanh tiến trình và vạch đỏ giữ nguyên y
hệt** → T5 không mất gì; thực ra còn ĐỌC ĐƯỢC HƠN, vì người chơi không phải vừa canh vạch
đỏ vừa chống mỏi ngón.

**(3) Phím C (che tay) cần một tuỳ chọn gạt.** Nó là phím giữ **lâu nhất** trong game —
giữ suốt cả một thao tác, mà còn làm thao tác chậm 1,3×. Đúng cái GAG mô tả là "giữ suốt
cả trò chơi" [S].

**(4) Kích hoạt ở nhịp NHẢ, không ở nhịp BẤM, cho mọi lựa chọn trong panel** (XAG 107) [S].
`TalkPanel.makeRow` đã dùng `pointerup` — đúng rồi. Đường bàn phím cũng nên theo: bấm số
để **trỏ**, nhả/Enter để **chọn**? Không — việc đó làm chậm người chơi bình thường. Thay
vào đó: giữ `1–4` chọn thẳng, nhưng thêm tuỳ chọn **"xác nhận hai bước cho lựa chọn thoại"**
cho ai cần (mặc định TẮT).

**(5) Một bước xác nhận cho các `TalkAct` KHÔNG ĐẢO NGƯỢC** — CANON §15.5 đã bắt "một bước
xác nhận trước khi đưa bánh"; áp đúng nguyên tắc đó cho `PAY · DISCOUNT · FREE_LOAF ·
PROMISE · REFUSE`. **Không** cho hoàn tác hệ quả xã hội (sẽ giết T3/T5), mà **chặn trước**
khi nó xảy ra. `INVITE` thì không cần — nó chỉ là một lời mời, và đã deterministic.

**(6) Remap theo HÀNH ĐỘNG, không theo phím** (XAG 107) [S]. Hiện `addKeys("W,A,S,D,...")`
cứng chuỗi. Rút ra một bảng `ACTION → code[]` đọc từ settings. Việc này còn là điều kiện
cần cho người dùng bàn phím không-QWERTY (AZERTY: W/A nằm chỗ khác) — một thị trường
Steam có thật, không chỉ chuyện trợ năng.

**Về AbleGamers:** tôi không mở được tài liệu APX (Accessible Player Experiences) trong lần
rà này. Theo trí nhớ, APX đóng gói các mẫu theo bốn "trụ" (motor/cognitive/vision/hearing)
và có mẫu *"Clear Signal"* / *"Simple Input"* rất hợp ở đây [M] — **hãy kiểm lại trước khi
trích**. Hai nguồn GAG và XAG ở trên đã đủ sức nặng để quyết định mọi thứ trong mục này.

---

## 6. MODAL vs DIEGETIC UI TRONG GAME ISOMETRIC

### Kết luận ngắn — kèm số đo, không phải cảm tính
Bảng hiện tại **che TRỌN người đang nói chuyện với bạn**, head to toe. Tôi tính được chứ
không đoán. Chữa bằng cách **tách bảng làm hai**: *lời họ nói* → bong bóng trên đầu họ
(hạ tầng đã có); *câu mình chọn* → một dải nhỏ neo cạnh họ.

### Phép tính (GAME_W 1024 × GAME_H 576, ZOOM 1,28, camera bám chân người chơi)

```
Người chơi ở (12,5 · 5,5) → chân họ ở TÂM màn hình (512, 288).
Khách đầu quầy ở (12,5 · 7,6):
   Δworld = (0 · 2,1)
   Δscreen = ((Δx−Δy)·30 , (Δx+Δy)·15) × 1,28 = (−80,6 , +40,3)
   → chân khách ở (431, 328);  BODY_H 64 × 1,28 = 82 px
   → ĐỈNH ĐẦU khách ở y ≈ 246 ;  MẶT khách ở y ≈ 268

TalkPanel: MAX_H_RATIO 0,56 → h ≤ 322 ; cy = 576 − h/2 − 10 → MÉP TRÊN BẢNG = 244.
PANEL_W 620, canh giữa → bảng phủ x = 202 … 822.

431 ∈ [202, 822]  và  246 ≥ 244   ⇒  BẢNG PHỦ KÍN KHÁCH TỪ ĐỈNH ĐẦU TỚI BÀN CHÂN.
```

Và chiều cao **gần như luôn chạm trần**: nameH 20 + 2 dòng câu nói ≈ 54 + 4 dòng lựa chọn
≈ 184 + hint 24 + PAD 32 = **314 px**, so với trần 322. Tức cái "tối đa" là cái **thường
ngày**, không phải trường hợp xấu nhất.

→ Chú thích ở đầu `TalkPanel.ts` viết: *"khách đứng ở giữa–phải và người chơi phải còn
thấy MẶT họ … Cả game là chuyện bị nhìn; che mặt người đang nói chuyện với mình thì mất
luôn thứ duy nhất đáng xem."* **Ý định đúng, số đo sai.** Và đây là nguyên nhân cơ học của
lỗi #1 ("switch content"): bảng che mất cái quán, nên bắt buộc phải đóng băng đồng hồ, nên
mỗi cuộc trò chuyện là một lần chuyển cảnh.

### Khảo sát các lối thay thế

- **Disco Elysium** — CRPG thường để hộp thoại ở **một phần ba dưới**; Disco **cố ý không
  làm vậy**, đặt nó thành **một CỘT DỌC ở phía dưới-phải**, chữ "lăn lên như lướt
  Twitter"; Robert Kurvitz: *"We want to build a dialogue engine that's as addictive and
  as snappy as Twitter"* [S]. Ngoài ra game dùng **orb** rải trong môi trường và quanh đầu
  nhân vật để báo "có gì đáng để ý ở đây" [S] — tức là *chỉ báo nằm trong thế giới, nội
  dung nằm trong chrome*. Đây là tiền lệ trực tiếp và mạnh nhất cho "bỏ đáy màn hình".
- **Dead Space** — chỉ thị "mọi thành phần UI phải ở trong thế giới game", RIG hologram
  trên lưng; mục tiêu là **không có gì che cảnh** [S]. Đồng thời là bài học về giới hạn:
  bản đồ 3D holographic đầy tham vọng **thất bại** và phải thay bằng cái locator vạch
  đường (lời Glen Schofield) [S] → *diegetic tới mức khó đọc thì thua một cái chrome
  tầm thường*.
- **The Sims** — pie menu / radial ngay tại đối tượng. Hợp với **ít lựa chọn, nhãn CỰC
  NGẮN**. Tiếng Việt có dấu, nhãn ngắn mà đọc được ở 11–13 px là khó; radial là phương án
  **chỉ dùng được nếu nội dung bị rút ngắn trước**.
- **Hud.ts của chính dự án** đã có một học thuyết bố cục rồi [C]: *"trái-dưới là LỜI NGƯỜI,
  phải là SỔ SÁCH CỦA MÁY (tiền · phiếu đơn · thông báo), giữa để nguyên cho cái quán."*
  Bất cứ đề xuất nào cũng phải sống được trong học thuyết đó, **hoặc sửa học thuyết một
  cách có ý thức** — không được âm thầm vi phạm (đó chính là điều `talkOffer` toast đang
  làm, §3).

### Xếp hạng cho 2.5D isometric có quầy

**Hạng 1 — "Bong bóng + dải lựa chọn neo cạnh người" (đề xuất chính).**
```
Họ nói gì   → BubblePool, trên đầu họ. ĐÃ CÓ. Diegetic, tự tắt, có né chồng
               (`bubbleBoxes`), có pool chống GC.
Mình nói gì → một DẢI DỌC 2–4 dòng, neo ở VAI PHẢI của người đang được nhắm,
               kẹp vào khung bằng đúng phép kẹp của `ui/chorePin.ts`.
```
Số đo: khách đầu quầy ở (431, 328). Dải neo tại x ≈ 491, mở xuống–phải. Chỗ trống còn lại:
533 px ngang × 248 px dọc — **thừa** cho 4 dòng × 40 px = 160 px. Và vùng đó là **vỉa hè +
lòng đường trống**, không phải mặt ai, không phải cái lò, không phải tay mình.

Điều kiện bắt buộc để phương án này chạy: **mỗi dòng ≤ ~24 ký tự.** Hiện các dòng là câu
hoàn chỉnh (`wordWrap: w − 50` ≈ 536 px). Đây **không phải là nhược điểm, nó là đòn bẩy**:
chính yêu cầu "rút ngắn dòng lựa chọn" là bước đi đầu tiên về phía CANON T2
(*"người chơi không bao giờ chọn câu nói"*) — người chơi chọn một **thái độ/cử chỉ** ngắn,
còn câu đầy đủ thì phát ra thành **bong bóng** sau khi chọn. 12.600 dòng nội dung không
mất đi; chúng chuyển từ *nhãn nút* thành *lời thoại*.

**Hạng 2 — cột dọc bên phải (Disco Elysium) [S].** 320 px × ~470 px, bám mép phải.
Kiểm tra va chạm: ở tư thế camera điển hình, khách đầu quầy (x 431), khách xếp hàng
(x ≈ 373), lò (x ≈ 474), thớt (x ≈ 166) — **đều nằm trái của x = 688**. Che mất ~1/3 phải,
tức khoảng 4,4 ô về phía dưới-phải người chơi (bồn rửa khi đứng gần đó). Chấp nhận được,
và **tốt hơn hẳn hiện tại**. Dùng phương án này nếu quyết định GIỮ nguyên văn các câu dài.

**Hạng 3 — radial quanh nhân vật.** Chỉ khả thi sau khi nhãn đã rút còn 1–3 chữ. Thêm rủi
ro: vị trí nút đổi theo góc → trí nhớ cơ bắp kém → trái tinh thần §5.

**Hạng 4 (bỏ) — đáy màn hình 56%.** Đã chứng minh ở trên là che kín người đang nói.

### Ba điều kiện kèm theo

1. **Vị trí bảng đổi theo mục tiêu ⇒ phải có neo bất biến cho trí nhớ cơ bắp.** Giữ
   **1–4 và ↑↓+Enter** y nguyên — đó mới là thứ ngón tay nhớ, không phải toạ độ pixel.
2. **Thêm một tuỳ chọn bố cục** trong menu: *cạnh người · cột phải · đáy màn hình (cũ)*.
   TLOU2 là tiền lệ cho "cho người chơi chọn thay vì ép một bố cục" [S], và CANON §15 vốn
   đã bắt 4 mức cỡ chữ — bố cục phải sống được ở 200%, nên tuỳ chọn này gần như bắt buộc
   về mặt kỹ thuật chứ không chỉ về trợ năng.
3. **Chỉ TẦNG "nói chuyện đàng hoàng" mới đóng băng đồng hồ** (§4). Tầng "chào qua loa"
   không có panel, không đóng băng → giảm thẳng *resumption lag* [S], tức giảm thẳng lỗi
   #1. Và khi có đóng băng thì phải **thấy được** nó (viền tối nhẹ + kim đồng hồ xám lại),
   nếu không người chơi vẫn cảm thấy bị giật khỏi cái quán.

---

## 7. SƠ ĐỒ PHÍM ĐỀ XUẤT

Nguyên tắc: **không thêm phím nào mới. Bỏ bớt một phím bắt buộc (F → tuỳ chọn). Bỏ một
nghĩa lén lút của Esc.**

| Phím | Ngữ cảnh | Hành vi | Xung đột đã giải quyết |
|---|---|---|---|
| **W A S D** / ↑↓←→ | luôn | Đi. **Đồng thời là cách CHỌN người sẽ nói chuyện** — bước dọc quầy. | Không cần phím cycle-target, không cần Tab-để-xoay-vòng. |
| **Shift** | đang đi | Chạy. Vô hiệu khi giữ C. | giữ nguyên |
| **E / Space** ① | **có người đang chờ mình trả lời** (bong bóng "…") và trong tầm | Trả lời → mở dải lựa chọn | Thắng tuyệt đối. Giải lỗi #2/#3: câu "nhầm quán" do NPC nói ra, người chơi chỉ **đáp**. |
| | ② ở trạm và tay làm được việc đó | Làm việc ở trạm (giữ nếu `holdMs>0`) | **Trạm thắng người** — tay đang bận là việc chính. Chỉ xảy ra ở 3 trạm trên hàng quầy y6. |
| | ③ không có ② nhưng có người trong tầm | Nói chuyện với mục tiêu đang được tô vòng chân | Thay thế đúng chỗ của F cũ |
| | ④ có trạm nhưng tay sai | Không làm gì; dòng nhắc ghi `blockedReason` | giữ nguyên hành vi hiện tại |
| | ⑤ bảng kẹp nhân đang mở | Gói lại | giữ nguyên |
| | ⑥ dải lựa chọn thoại đang mở | Chọn dòng đang trỏ (= Enter) | Thêm một lối vào, không bỏ 1–4 / ↑↓ |
| **F** | luôn (TUỲ CHỌN, không bắt buộc) | **Alias "ép nói chuyện"** — bỏ qua quy tắc ②, chọn thẳng người | Lối thoát khi muốn nói trước lúc đưa bánh. Người cũ không phải học lại. |
| **R** | ở thớt, tay không, ổ trơn | Nhấc ổ lên | Giữ riêng — "nướng lại" và "kẹp tiếp" là hai hệ quả trái ngược |
| **Q** | cầm đồ / sàn có đồ trong tầm | Đặt xuống sàn / nhặt lên | giữ nguyên |
| **G** | có nợ đang chờ ghi | Ghi sổ (có hàng đợi nếu tay bận) | giữ nguyên |
| **C** | giữ | Che tay (chậm 1,3×) | **BẮT BUỘC thêm tuỳ chọn gạt** (§5.3) |
| **Tab** | luôn | Sổ tay | Giữ nguyên — và vì vậy **không được** dùng Tab để xoay vòng mục tiêu |
| **1–9** | bảng kẹp nhân | Bỏ nguyên liệu | giữ nguyên (CANON §15.5: chạm-để-đặt) |
| **1–4** | dải lựa chọn thoại | Chọn câu | Vị trí dải đổi theo mục tiêu, nhưng **phím thì không đổi** |
| **Backspace** | bảng kẹp nhân | Hoàn tác | giữ nguyên |
| **Esc** | có bảng/overlay đang mở | **Đóng. LUÔN MIỄN PHÍ.** | **Bỏ hẳn nghĩa "làm thinh có giá"** (§5.1) |
| | không có gì mở | Pause | giữ nguyên |
| **P** | luôn | Pause / resume | giữ nguyên (CANON §15.2) |
| *(dòng `…` trong danh sách)* | dải lựa chọn thoại | **Làm thinh — CÓ GIÁ** | Tách "thoát giao diện" khỏi "hành động xã hội". Dùng `TalkTone.IM` đã có. |

**Thay đổi ròng:** 0 phím mới · 1 phím chuyển từ bắt buộc sang tuỳ chọn (F) · 1 nghĩa bị
xoá (Esc-có-giá) · 1 dòng nội dung mới (`…`) · 2 tuỳ chọn trợ năng mới (giữ→bấm; C-gạt).

---

## 8. THUẬT TOÁN CHỌN MỤC TIÊU (pseudocode)

Chạy ở bước `input` của `runFrame`, **ngay sau** `stationNear()`. Trả về **đúng một** thứ
mà phím E sẽ tác động, cộng với cách vẽ chỉ báo.

```
// ═══════════════════════════════════════════════════════════════════════
// HẰNG SỐ
// ═══════════════════════════════════════════════════════════════════════
TALK_REACH       = 3.0    // ô, euclid — GIỮ NGUYÊN (service.ts:98). Đây là CỔNG VÀO.
TALK_STICKY      = 0.62   // CÙNG hằng số với stations.STICKY. Chống rung mục tiêu.
W_LATERAL        = 1.00   // trọng số |Δx| — trục DỌC QUẦY, trục duy nhất phân biệt được ai
W_DEPTH          = 0.45   // trọng số |Δy| — gần như hằng số (≈2,1) ở quầy, nên nhẹ hơn
B_FACING         = 0.80   // giảm giá khi người đó nằm trong nón mặt 90° của người chơi
B_FRONT          = 0.90   // người đứng đầu quầy = người đang được phục vụ
B_ADDRESSED      = 99.0   // người đang CHỜ MÌNH TRẢ LỜI: thắng tuyệt đối
P_NPC_BUSY       = 1.20   // đang quay sang nói với NPC khác: chen ngang phải đắt
P_REFUSED        = 1.20   // hôm nay đã từ chối lời mời: không còn là mục tiêu mặc định

// ═══════════════════════════════════════════════════════════════════════
// A. CHẤM ĐIỂM MỘT NGƯỜI  (điểm = CHI PHÍ, thấp hơn = thắng)
// ═══════════════════════════════════════════════════════════════════════
function costOf(P, c):
    dx = c.x - P.x ;  dy = c.y - P.y
    d  = hypot(dx, dy)
    if d > TALK_REACH:            return +INF        // cổng vào: euclid thuần
    if not talkable(c):           return +INF        // balking; leaving và không phải `pass`

    // Thành phần KHOẢNG CÁCH, có TRỌNG SỐ THEO TRỤC.
    // Vì sao không dùng euclid thuần (hiện tại service.ts đang dùng): ở quầy mọi người
    // đều cách người chơi ~2,1 ô theo y, nên y chỉ làm NHIỄU phép so sánh. Ép trọng số
    // về trục x biến "ai gần nhất" thành "mình đang đứng trước mặt ai" — đúng thứ người
    // chơi điều khiển được và đúng thứ họ nhìn thấy.
    cost = W_LATERAL * abs(dx) + W_DEPTH * abs(dy)

    // Thành phần GÓC (dot product — chuẩn ngành, xem IntenSelect/StickyRay).
    // Nón 90°: cos(45°) = 0,707. Chỉ GIẢM GIÁ, không bao giờ loại — vì facing8 đổi theo
    // phím vừa bấm nên nó rung ngay lúc người chơi dừng chân; dùng nó làm tiêu chí cứng
    // là tự chuốc cái bug mà stations.STICKY đã phải đi chữa.
    if dot(normalize(dx, dy), vecOf(P.facing8)) >= 0.707:
        cost -= B_FACING

    // Ưu tiên XÃ HỘI — ba cái, đọc được hết từ màn hình.
    if c == service.front:            cost -= B_FRONT        // người đang được phục vụ
    if c.inNpcChat:                   cost += P_NPC_BUSY     // đang nói với NPC khác (lỗi #4)
    if c.refusedInviteToday:          cost += P_REFUSED      // chống spam mời (lỗi #5)
    if c.offerOpen:                   cost -= B_ADDRESSED    // đang chờ mình đáp (lỗi #2,#3)

    return cost

// ═══════════════════════════════════════════════════════════════════════
// B. CHỌN MỤC TIÊU NGƯỜI, CÓ BÁM DÍNH
// ═══════════════════════════════════════════════════════════════════════
function pickPerson(P, people, prevPerson):
    best = null ; bestCost = +INF
    for c in people:
        k = costOf(P, c)
        if k < bestCost: bestCost = k ; best = c

    // BÁM DÍNH — y hệt stations.stationNear(). Mục tiêu của frame trước chỉ bị thay khi
    // có người RẺ HƠN HẲN (21% quãng đường). Không có bước này thì nhích nửa bước là tên
    // trên chỉ báo nhảy qua lại, và cú E rơi vào NGƯỜI KHÁC với người đang được tô vòng.
    // Tương đương giai đoạn "lock-on" của Gravity Gloves trong Half-Life: Alyx.
    if prevPerson != null:
        kPrev = costOf(P, prevPerson)
        if kPrev < +INF and bestCost > kPrev * TALK_STICKY:
            best = prevPerson

    return best

// ═══════════════════════════════════════════════════════════════════════
// C. PHÂN GIẢI TRẠM ↔ NGƯỜI  — bốn dòng, theo đúng thứ tự
// ═══════════════════════════════════════════════════════════════════════
function pickInteraction(P, prev):
    // KHOÁ CỨNG: cuộc trò chuyện đã mở thì không có gì đổi được mục tiêu.
    if talkSession.open:
        return Talk(talkSession.partner, locked = true)

    st            = stationNear(P.x, P.y, prev.station)          // đã có sticky
    stationAction = (st != null and blockedReason(st, P.hand) == null) ? st : null
    person        = pickPerson(P, service.customers, prev.person)

    // ① người đang CHỜ MÌNH TRẢ LỜI thắng tất cả — kể cả đang đứng ở trạm.
    //    Làm lơ người đang nói với mình để đi lau thớt là một câu trả lời, và nó phải là
    //    một lựa chọn CÓ Ý THỨC, không phải hệ quả của luật ưu tiên.
    if person != null and person.offerOpen:
        return Talk(person)

    // ② tay có việc làm được ở trạm → trạm thắng. Vòng lặp chính là làm bánh.
    if stationAction != null:
        return Work(stationAction)

    // ③ rảnh tay (hoặc trạm chặn) + có người trong tầm → E là nói chuyện.
    //    Hệ quả hay: đứng ở chỗ đưa hàng với TAY KHÔNG thì E = nói chuyện với khách —
    //    vì "đưa cho khách" đang bị chặn bởi blockedReason("chưa có gì để đưa").
    //    Đúng như ngoài đời: đứng trước mặt khách mà tay không thì mình nói chuyện.
    if person != null:
        return Talk(person)

    // ④ có trạm mà tay sai → nói lý do, không im.
    if st != null:
        return Blocked(st)

    return null

// ═══════════════════════════════════════════════════════════════════════
// D. CHỈ BÁO  — vẽ cái sẽ bị tác động, mỗi frame
// ═══════════════════════════════════════════════════════════════════════
function renderIndicator(it, P, people):
    switch it:
      case Work(st) | Blocked(st):
          drawRing(st)                                    // đã có: StallScene.drawRing
          prompt = (it is Work) ? "E — " + st.verb
                                : blockedReason(st, P.hand)
          return

      case Talk(c):
          // 1. VÒNG DƯỚI CHÂN — ellipse iso 2:1, rộng ~34 px, tâm = footY(toScreen(c)),
          //    depth = depthOf(c.x, c.y) + 1.
          //    Vì sao dưới chân chứ không trên đầu:
          //      · trên đầu ĐÃ CÓ `?`/`!` của hệ ánh nhìn (CustomerActor.ts:304),
          //        huy hiệu mặt, bong bóng, và dấu `!` việc nhà (StallScene.bang).
          //      · bàn chân là bộ phận DUY NHẤT không bao giờ chồng: hai chỗ xếp hàng
          //        cách nhau 1,5 ô = 45 px màn hình, thân người chỉ ~26 px.
          //        (CustomerActor.ts:280 đã dựa vào đúng tính chất này cho chip tên.)
          drawFootRing(c, pulse = c.offerOpen, dashed = c.inNpcChat)

          // 2. CHIP TÊN sẵn có đổi trạng thái — kênh CHỮ, không phải chỉ màu (P1-04 §4.1).
          //    Người QUA ĐƯỜNG vốn không có chip; cho nó hiện ra đúng lúc họ thành mục
          //    tiêu — khớp nguyên văn chú thích ở CustomerActor.ts:289.
          tagOf(c).text  = "E · " + label(c)
          tagOf(c).ink   = true

          // 3. DẠY LUẬT "bước dọc quầy để đổi người", không tốn phím nào.
          others = [o for o in people if costOf(P,o) < +INF and o != c]
          if any(o.x < c.x for o in others): drawChevron(c, LEFT)
          if any(o.x > c.x for o in others): drawChevron(c, RIGHT)

          prompt = c.offerOpen ? ("E — trả lời " + label(c))
                               : ("E — nói chuyện với " + label(c))
          return

      case null:
          prompt = null
```

### Bốn ca bắt buộc — kiểm chứng

| Ca | Kết quả | Vì sao |
|---|---|---|
| **Người đứng ĐẦU QUẦY** | Thắng mặc định | `B_FRONT = 0,90` ≈ gần một ô. Người chơi phải bước **hẳn** về phía người khác mới đổi được — chứ không phải nhích nửa bước. Giải **lỗi #7**: và nhờ `renderIndicator` thì họ **lần đầu tiên có chỉ báo** (hiện `nearbyToTalk()` loại họ ra, `service.ts:2400`). |
| **Người XẾP HÀNG SAU** | Chọn được, bằng cách **bước sang trái dọc quầy** | `W_LATERAL = 1,00` làm |Δx| thành yếu tố chính. Đứng ở thớt (x4) thì người ở chỗ số 6 (x5,0) thắng, và chevron chỉ sang phải báo "còn người bên kia". |
| **Người ĐI NGANG ngoài đường** | **Không bao giờ** là mục tiêu khi còn sau quầy | Hình học, không phải luật: y = 9,6 vs người chơi y ≥ 5,5 ⇒ Δy ≥ 4,1 > `TALK_REACH = 3`. Chỉ với tới khi đi vòng ra cửa x21–22 — lúc đó họ là người duy nhất trong tầm nên không có gì để nhầm. |
| **NPC đang bận nói với NPC khác** | Chọn được nhưng **đắt**; vòng chân vẽ NÉT ĐỨT | `P_NPC_BUSY = +1,20` ≈ gần một ô. Nét đứt = "chen ngang". Đây là cái móc để hiện thực hoá **lỗi #4** mà vẫn giữ CANON §16 Đừng-1: NPC chỉ cần **phát ra bong bóng** cho nhau (Orkin: *"Vocalizing intentions can sometimes even be enough, without any actual implementation"*), không cần mô phỏng gì. |

### Ba lỗi code cần sửa kèm theo (xem §0.3)

1. **`promptLine()` phải GỘP chứ không THAY THẾ.** `Hud.drawPrompt` dùng
   `override ?? (station line)` — cú F cướp mất dòng trạm. Sau khi gộp vào E, chỉ còn
   **một** dòng nhắc do `pickInteraction()` sinh ra → bug tự biến mất về mặt kiến trúc.
2. **`nearbyToTalk()` bỏ điều kiện `c !== this.front`.** Người đầu quầy phải có chỉ báo.
3. **`talkTarget()` thay bằng `pickInteraction()`.** Chú ý: `talkTarget()` hiện trả
   `this.offer.c` **không kiểm tra khoảng cách** — người chơi trả lời được từ bên kia hẻm.
   Giữ cho phép, nhưng khi ngoài tầm thì **ghim bong bóng "…" vào mép khung** bằng
   `ui/chorePin.ts` (đã có, đã có test) thay vì cho E với tới từ xa.

---

## 9. THỨ TỰ LÀM (nếu phải cắt phạm vi)

| # | Việc | Công | Giải lỗi nào |
|---|---|---|---|
| 1 | **Esc miễn phí + thêm dòng `…` giọng IM** | nhỏ | trợ năng (nặng nhất), T2, T5 |
| 2 | **Vòng chân + chip tên làm chỉ báo mục tiêu** | nhỏ–vừa | **#7** |
| 3 | **`pickInteraction()` thay `talkTarget()`; gộp F vào E** | vừa | **#7**, một phần #1 |
| 4 | **Bỏ toast `talkOffer`; bong bóng ba nhịp tự xẹp** | vừa | **#3**, **#2** |
| 5 | **Tầng "chào qua loa" không panel, không đóng băng** | vừa | **#1** |
| 6 | **Dải lựa chọn neo cạnh người (thay bảng 56% đáy)** | lớn | **#1**, #3, và mở đường về T2 |
| 7 | **Tuỳ chọn giữ→bấm; C-gạt; remap theo hành động** | vừa | trợ năng, CANON §15 |
| 8 | **`P_REFUSED` + NPC-với-NPC phát bong bóng** | nhỏ mỗi cái | **#5**, **#4** |

---

## NGUỒN

Đã đọc trong lần rà này:

- [Avoid / provide alternatives to requiring buttons to be held down — Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/avoid-provide-alternatives-to-requiring-buttons-to-be-held-down/)
- [Xbox Accessibility Guideline 107 — Microsoft Learn](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/107)
- [VR Design Unpacked: The Incredible Details of 'Half-Life: Alyx' — Road to VR](https://roadtovr.com/these-details-make-half-life-alyx-unlike-any-other-vr-game-inside-xr-design/)
- [IntenSelect+: Enhancing Score-Based Selection in Virtual Reality (Krüger et al., RWTH Aachen / IEEE VR 2024)](https://vr.rwth-aachen.de/media/papers/258/2024-intenselect-plus.pdf) · [IEEE](https://ieeexplore.ieee.org/abstract/document/10459000) · [IntenSelect gốc, ACM](https://dl.acm.org/doi/10.5555/2385984.2386013)
- [Direct vs. Score-based Selection: Understanding the Heisenberg Effect in Target Acquisition Across Input Modalities in VR (arXiv)](https://arxiv.org/pdf/2602.01061)
- [Interruption Cost Evaluation by Cognitive Workload and Task Performance in Interruption Coordination Modes (Applied Sciences 8(10):1780, MDPI 2018)](https://www.mdpi.com/2076-3417/8/10/1780)
- [Banner Blindness Revisited — Nielsen Norman Group](https://www.nngroup.com/articles/banner-blindness-old-and-new-findings/) · [Banner blindness — Wikipedia (nguồn gốc thuật ngữ 1998)](https://en.wikipedia.org/wiki/Banner_blindness)
- [Nonplayable Characters (NPCs) — RDR2 Wiki](https://www.rdr2.org/wiki/nonplayable-characters-npcs/)
- [Enabling the Tap Assist Accessibility Settings in Red Dead Redemption 2 — Rockstar Support](https://support.rockstargames.com/articles/iHuafuI6D4LVge59s82oh/enabling-the-tap-assist-accessibility-settings-in-red-dead-redemption-2)
- [Hitman 3 — Can I Play That? Accessibility Review](https://caniplaythat.com/2021/01/20/hitman-3-can-i-play-that-accessibility-review/)
- [The Last of Us Part II: Accessibility Features Detailed — Naughty Dog](https://www.naughtydog.com/blog/the_last_of_us_part_ii_accessibility_features_detailed) · [PlayStation](https://www.playstation.com/en-us/games/the-last-of-us-part-ii/accessibility/)
- [Context-Sensitive Button — TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/Main/ContextSensitiveButton)
- [A UI/UX analysis of Zelda: Breath of the Wild — Game Developer](https://www.gamedeveloper.com/art/a-ui-ux-analysis-of-zelda-breath-of-the-wilds) · [The Legend of Zelda: Twilight Princess — Wikipedia (nút ngữ cảnh)](https://en.wikipedia.org/wiki/The_Legend_of_Zelda:_Twilight_Princess)
- [Dead Space: The UI art that disappears in the game world](https://medium.com/@lorenzoardeni/dead-space-the-ui-art-that-disappears-in-the-game-world-289718133c29) · [Beyond the HUD: The Power of Diegetic Interfaces — Wayline](https://www.wayline.io/blog/diegetic-interfaces-game-design)
- [Disco Elysium's Text Box Design Is Inspired By How We Use Computers And… Twitter — GamerMatters](https://gamermatters.com/disco-elysiums-text-box-design-is-inspired-by-how-we-use-computers-and-twitter/) · [Disco Elysium: User Interface — gamepressure](https://www.gamepressure.com/disco-elysium/user-interface/z5e3e8)
- [Thought Bubbles and Their Meanings — EA Forums (The Sims 4)](https://forums.ea.com/discussions/the-sims-4-general-discussion-en/thought-bubbles-and-their-meanings-%E2%80%A6/423701/replies/423712) · [Chat bubbles and their meanings — Mod The Sims](https://modthesims.info/t/572131)
- [AI-driven Dynamic Dialog through Fuzzy Pattern Matching (Elan Ruskin, GDC 2012) — slides PDF](https://steamcdn-a.akamaihd.net/apps/valve/2012/GDC2012_Ruskin_Elan_DynamicDialog.pdf) · [Game Developer](https://www.gamedeveloper.com/design/video-valve-s-system-for-creating-ai-driven-dynamic-dialog)
- [Dot Product in Video Games](https://medium.com/@mahmoudelmansari/dot-product-in-video-games-81c7e9b078e7)
- [Elden Ring's NPC quest markers are just a Band-Aid — PC Gamer](https://www.pcgamer.com/elden-rings-npc-quest-markers-are-just-a-band-aid/) · [Thoughts on Quest Markers — HiveWorkshop](https://www.hiveworkshop.com/threads/thoughts-on-quest-markers.331180/)

**Theo trí nhớ, CHƯA xác minh — kiểm lại trước khi trích:**
- Deus Ex (2000) tách "Use"/frob khỏi "Attack"; DX:HR dùng một phím ngữ cảnh + prompt.
- AbleGamers *Accessible Player Experiences* (APX) — các mẫu như "Clear Signal" /
  "Simple Input"; cấu trúc theo bốn trụ motor/cognitive/vision/hearing.
- "Notification decay" **không** là một thuật ngữ nghiên cứu game đã được công nhận; tôi
  không tìm thấy công trình nào. Thứ gần nhất là banner blindness + interruption
  coordination ở trên.
