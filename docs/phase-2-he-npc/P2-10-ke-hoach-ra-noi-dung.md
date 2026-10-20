# P2-10 — Kế hoạch rà nội dung thoại: còn 14 file, đây là cách làm

> ## ⚡ REVAMP 2026-10-20 — ⚠️ CHẾT MỘT PHẦN
> Căn cứ: [`CANON.md`](../CANON.md) bản revamp. Phần ☠️ không dùng làm căn cứ.
>
> | Mục | Trạng thái | Lý do / thay bằng |
> |---|---|---|
> | §6quinquies cổng `T016`, 12 cuộc `*.nhochuyen`, `{m.what}`, `retrieve()` | ☠️ | Trí nhớ NPC chết — gỡ cổng và nội dung |
> | §6septies biến thể `m.tier(FRIEND/RIVAL)`; §6decies, §6sedecies thưởng `rel` / ký ức `CARED_FOR_THEM` | ☠️ | Quan hệ + trí nhớ chết. Hệ quả act đổ về sao/review (R4) |
> | §4 đợt F, §5, §6terdecies `LEND_ITEM`/`CLEAR_DEBT` (áo mưa, `RelState.borrowed`), `CREDIT_LOAF`, `notebookEntries` | ☠️ | Arc áo mưa, sổ nợ, sổ tay chết |
> | §6sedecies `OVERHEARD_BY` | ☠️ | Nghe lỏm chết |
> | §6nonies `FILM` → `clipDay`, `storyCrowdMul`, nhánh kịch bản ngày 5 | 🔁 | Lịch theo ngày chết. Clip bé Su → review TikTok, tác động qua sao/`Y(x)` (R4/R5) |
> | §6quaterdecies cảnh tám chuyện, `~cờ` hứa qua đêm | 🔁 | Cảnh tám giữ (nền, không tin đồn). `~cờ` chỉ là cờ chuyện, xét lại ở R6 |
> | §6undecies `KIET_STEAL`, §6duodecies `RAO_TURN` | ⏳ | Cơ chế giữ được; số + vai chú Kiệt (đối thủ review ác ý) chốt ở R4/R5 |
> | §6octies `GHE_BAN` 320k, §6tervicies mở khoá "qua ngày 8, đợi bữa mưa" | ⏳ | Giá + bảng mở khoá chốt bằng mô phỏng (R2) |
> | Số đo theo "mùa", "40 ngày", "ngày 28" rải khắp §6* | 🔁 | Đo lại khi chơi vô hạn (R5) |
> | §2, §4 thứ tự rà theo 12 NPC, toàn bộ nội dung đã viết, chi tiết đời Cô Ba, xưng hô "cô", "xe" trong thoại | ☠️ / ⏳ | Cô Ba ☠️ → Phương Anh, xưng hô theo tuổi NPC, xe → quán (R0.5); tên NPC + giọng Nam gen Z viết lại ở R6 |
>
> **Còn dùng được:** quy trình rà 6 bước (§3), validator `T001–T018`, công cụ `show:talk` / `probe:*`, act chung đã code (`THEY_SIT`, `GIVE_BREAD`, `STAND_IN_SHADE`, `WALK_ON`…), bài học §6bis — dùng lại cho đợt viết lại thoại R6.

**Thuộc phase:** P2 · **Phụ thuộc:** `P2-07` (hợp đồng ba phần) · `P2-08` (năm danh sách) ·
`P2-09` (kiến trúc giao tiếp, **đã thi công**)
**Trạng thái:** đang làm · **1/15 file xong** (`qua-duong`)

---

## 1. Mục tiêu — và nói thẳng chỗ đang đứng

`P2-09` dựng xong **bộ máy**: cổng đọc được thế giới, bảy khung cảnh, trí nhớ có truy hồi,
act có hạn, mười hai lưới chặn lúc build. Nhưng bộ máy không tự sửa chữ trong 1.595 nút
thoại — và chủ dự án chơi thử vẫn gặp đúng mấy câu cũ:

> *"nói chuyện với NPC đi ngoài đường thấy vẫn còn vụ bữa nay hết sớm trong khi player là
> người bắt chuyện, vụ chú Sáu nghỉ 2 năm rồi"*

Đúng. Khoá `c.openedBy` đã có từ đợt 2 mà **chưa gắn vào nút nào** cho tới đợt này. Doc
này là kế hoạch để làm nốt 14 file còn lại, và quan trọng hơn: **cách làm một file**, để
lần sau mở ra là chạy tiếp được, không phải nghĩ lại từ đầu.

---

## 2. Số đo hiện tại — đo lúc viết dòng này

```
npm run validate:talks     # 12 lưới T001–T012, ĐÃ vào `ci` và `build`
npm run show:talk          # in hai đường mở lời cạnh nhau — công cụ chính của đợt rà
npm run probe:talk         # bấm F ở mọi khung cảnh, xem cuộc nào rút được bao nhiêu
```

| file | cuộc | nút | neo | % neo | `openedBy` | cuộc mình mở được |
|---|---:|---:|---:|---:|---:|---:|
| **qua-duong** ✅ | 9 | 107 | 75 | **70,1%** | 37 | 9 |
| ong-hai | 8 | 102 | 15 | 14,7% | 4 | 3 |
| any | 6 | 34 | 5 | 14,7% | 0 | 6 |
| ba-bay | 8 | 154 | 17 | 11,0% | 6 | 3 |
| chi-lan | 8 | 88 | 9 | 10,2% | 0 | 2 |
| chu-tu | 8 | 105 | 9 | 8,6% | 0 | 2 |
| anh-bao | 8 | 94 | 7 | 7,4% | 0 | 2 |
| walkin | 11 | 133 | 9 | 6,8% | 0 | 5 |
| ba-sau | 8 | 111 | 7 | 6,3% | 0 | 2 |
| be-su | 9 | 134 | 8 | 6,0% | 0 | 4 |
| chu-kiet | 9 | 119 | 5 | 4,2% | 0 | 3 |
| co-mai | 8 | 104 | 3 | 2,9% | 0 | 2 |
| thay-phuc | 8 | 104 | 3 | 2,9% | 0 | 2 |
| anh-dung | 8 | 111 | 3 | 2,7% | 0 | 2 |
| chi-hanh | 8 | 101 | 2 | 2,0% | 0 | 2 |
| **TỔNG** | **124** | **1.595** | **166** | **10,4%** | **45** | **49** |

`qua-duong` xong rồi là **70,1%** (40 act: 18 `INVITE` · 16 `WALK_ON` · 5 `STAND_IN_SHADE` · 1 `LOOK_INSIDE`) — đó là con số một file đã rà xong trông như thế nào.
Mười bốn file còn lại đang ở 2–15%.

> **Đọc cột "% neo" cho đúng.** Nó KHÔNG phải mục tiêu phải đạt 100%: một câu xã giao
> thuần (*"Nắng quá bà ha"*) không hứa gì nên không nợ gì, và nó chỉ cần một `while` đúng
> cảnh — có khi không cần gì cả. Mốc hợp lý cho một file đã rà là **50–70%**.

---

## 3. CÁCH RÀ MỘT FILE — sáu bước, theo đúng thứ tự

Thứ tự này không tuỳ tiện: bước 1–2 là chỗ lỗi NẶNG NHẤT nằm (sai vai người nói), và
chúng rẻ. Bước 5–6 tốn nhất nên để sau.

### Bước 1 — `npm run show:talk <KHO>` và ĐỌC HAI ĐƯỜNG CẠNH NHAU

```
npm run show:talk BA_BAY
```

In ra, với mỗi cuộc, đúng cái người chơi thấy ở nhịp đầu trên **cả hai đường**: mình bấm
phím, và họ mở lời. Lỗi gốc của chủ dự án không nổ ra thành bug nào — nó là *đọc lên thấy
sai vai*, và thứ đó chỉ nhìn ra khi hai đường bày cạnh nhau.

Câu hỏi khi đọc cột **MÌNH bấm phím**: *nếu mình đi tới gõ vai một người và nói đúng câu
này, nó có nghĩa không?* Không có nghĩa thì đó là một câu ĐÁP bị dùng làm câu MỞ LỜI.

### Bước 2 — gắn `c.openedBy(NPC)` cho câu đáp, VIẾT câu mở lời cho đường còn lại

Hai việc, và việc thứ hai mới là việc nặng:

```jsonc
// câu ĐÁP: chỉ tồn tại khi HỌ mở lời
{ "say": "Dạ. Chú Sáu dọn đi hai năm rồi {call}.", "need": ["c.openedBy(NPC)"] }

// câu MỞ LỜI: viết mới, và phải có LÝ DO để mình nói ra
{ "say": "Hồi trước chỗ này là tiệm sửa xe đó {call}.",
  "need": ["c.openedBy(PLAYER)", "t.glanced"] }
```

**Mỗi nhánh phải còn ít nhất HAI dòng** kể cả khi mọi cổng khác đóng — lưới `T011` canh.
Nghĩa là mỗi cuộc cần tối thiểu **một câu mở lời không kèm cổng nào khác**, cộng với
đường ra dùng chung.

> **Đường ra không được là một câu đáp.** `"Dạ."` một mình nghĩa là *vâng, tôi nghe rồi* —
> sai hẳn khi chính mình vừa bấm phím. Mà đường ra thì không gắn cổng được (nó đi cả hai
> nhánh). Nên viết lại thành câu đọc được ở cả hai chiều: *"Thôi. Hổng có gì {call}."*

### Bước 3 — `npm run validate:talks` và sửa tới khi sạch

Mười hai lưới. Cái hay bắt nhất khi rà:

| | bắt gì |
|---|---|
| `T001` | khoá cổng không có trong bảng đen |
| `T002` | sự thật TĨNH nằm ở `while` (phải là `need`), hoặc ngược lại |
| `T003` | câu hứa (mời ăn · mời uống · buộc tội chen hàng · mời đứng mát · bảo dời chỗ) mà không có cổng làm được chuyện đó |
| `T004` | nhắc chuyện cũ mà không có bằng chứng nó đã xảy ra |
| `T006` | act có thời lượng mà thiếu `forSec` |
| `T011` | một nhánh teo xuống còn một dòng |
| `T012` | câu mở đầu bằng "Dạ/Ờ/Ừ/Vâng/À" ở nhịp đầu của cuộc mình mở được |

### Bước 4 — gắn `practice` cho cuộc nào chưa có, và kiểm nó ĐÚNG

Nhắc: `GOI_MON` **không phải** chỉ lúc gọi món — nó là *"cái đơn còn đang mở"*, gồm cả
khúc đầu quãng đợi (`ORDER_WINDOW = 0,35`). Pha `ordering` thật sự chỉ chiếm
**165/131.221 frame**; khoá một cuộc vào riêng nó là chôn cuộc đó.

### Bước 5 — neo mấy câu HỨA và mấy câu NHẮC QUÁ KHỨ

* Câu hứa một việc LÀM → `PROMISE_DEED` kèm hạn, **không** trả `rel`/`calm` lúc nói.
* Câu nhắc chuyện cũ → `need: "m.remembers"` + `{m.what}`, hoặc cổng cờ của cuộc nguồn.
  Cuộc nguồn chưa đặt cờ thì **thêm cờ vào cuộc nguồn**, đừng bịa một cái cờ mới.
* Không có chuyện nguồn nào → **viết lại cho không nhắc quá khứ**. Với `walkin`/`qua-duong`
  thì luôn là đường này: **kho đó không có hôm qua**.

### Bước 6 — `npm run probe:talk` đo tỉ lệ `?` và xem người chơi THẬT SỰ thấy gì

Mốc `P2-07` §4.1: **dưới 5%** số nhịp kết bằng một dấu hỏi. Trên mức đó là có câu đang
khai `while` cho một sự thật tĩnh — chuyển nó sang `need`, hoặc nếu cả CHỦ ĐỀ phụ thuộc
vào sự thật đó thì chuyển lên `when.world` của cả cuộc.

`--lines <id>` in từng câu hiện ra mấy lần — đó là cách biết một cuộc rút nhiều có phải
là lặp không, hay là nó đang chìa ra các nhánh khác nhau.

Một cơ chế không bao giờ nổ ra trong một mùa thì nó không tồn tại, dù lưới có xanh.
Probe đếm cuộc nào rút được bao nhiêu lần và **từng câu hiện ra mấy lần**.

---

## 4. THỨ TỰ ĐỀ NGHỊ cho 14 file còn lại

Xếp theo **chủ dự án gặp trước** × **rẻ**, không theo bảng chữ cái.

| Đợt | File | Vì sao trước | Việc riêng của file đó |
|---|---|---|---|
| **A** | `walkin` (11 cuộc) | khách vãng lai là người chơi gặp NHIỀU NHẤT, và 5 cuộc mình mở được | `walkin.nhamquan` phải `NPC_ONLY` tuyệt đối (lỗi #2 gốc); 5 cuộc `PLAYER_ONLY` cần câu mở lời thật |
| **B** | `any` (6 cuộc) | tầng dùng chung, rút cho **cả 14 vai** — sai ở đây là sai khắp nơi | 4 nút là câu ĐÁP làm câu mở lời; 13 nút nhắc trạng thái thế giới mà không đọc nó (`any.md` §1) |
| **C** | `ba-bay` · `ong-hai` | đã có `openedBy` một phần (6 và 4 nút) — làm nốt rẻ | bà Bảy 154 nút, nhiều nhất kho |
| **D** | `chu-tu` · `co-mai` · `ba-sau` | hàng xóm, hay gặp lúc quầy vắng | `sau.ganh` cần `CARRY_GANH`/`MOVE_GANH` (P2-08 §2 nhóm C) |
| **E** | `be-su` · `anh-bao` · `anh-dung` | khách quen trẻ | bé Su cần `FILM`/`STOP_FILM` (13 nhắc); `WALK_ON` cho *"đi học đi con"* (11 lần, chưa lần nào nó đi) |
| **F** | `chi-lan` · `chi-hanh` · `thay-phuc` · `chu-kiet` | arc dài, nội dung nặng nhất | chị Lan cần `LEND_ITEM`/`CLEAR_DEBT` (arc áo mưa); thầy Phúc nối `notebookEntries` |

---

## 5. VIỆC CODE CÒN NỢ — gặp thì ghi vào đây, đừng sửa ngang

Mấy act này `P2-08` §2 nhóm C đòi, `P2-09` chưa làm vì chúng là chuyện của TỪNG NHÂN VẬT
chứ không phải của bộ máy. Khi rà tới file tương ứng thì làm luôn:

| Act | Của ai | Nhắc | Ghi chú |
|---|---|---|---|
| ~~`THEY_SIT`~~ | chung | 24 | ✅ **xong** — xem §6octies |
| ~~`FILM` / `STOP_FILM`~~ | bé Su | 13 | ✅ **xong** — xem §6nonies |
| ~~`MOVE_CART`~~ | chú Kiệt | 11 | ✅ **xong** — xem §6undecies |
| ~~`CARRY_GANH` · `MOVE_GANH`~~ | bà Sáu | 11 | ✅ **xong** — xem §6decies |
| ~~`RAO`~~ | bà Sáu dạy | 7 | ✅ **xong** — xem §6duodecies |
| ~~`LEND_ITEM` / `CLEAR_DEBT`~~ | anh Dũng · chị Lan | 5 | ✅ **xong** — xem §6terdecies |
| ~~`TAKE_CASH`~~ | bé Su · thầy Phúc | 5 | ✅ **xong** — xem §6sedecies |
| ~~`BARTER`~~ | bà Sáu | 5 | ✅ **xong** — xem §6decies |
| ~~`ORDER_CHANGE`~~ | anh Bảo · chị Lan | 4 | ✅ **xong** — xem §6quaterdecies |
| ~~`OVERHEARD_BY`~~ | bà Sáu | 2 | ✅ **xong** — xem §6sedecies |

**Bảng nợ act đã TRẢ HẾT.** 28 act khai trong `TalkAct`, 28 act có `case` trong
`applyAct` (ép bằng `assertActHandled(act: never)` — thiếu nhánh là lỗi BIÊN DỊCH, không
phải lỗi im lặng), 27/28 có nội dung gọi tới. Còn đúng một act chưa ai gọi: `LEAVE_SHADE`
— và nó KHÔNG chết, vì `shadeUntil` hết hạn thì `leaveShade()` tự chạy; nó chỉ chưa có
một câu thoại nào bảo người ta đi tiếp SỚM. Không viết thoại chỉ để lấp một act.

Ba item đã xong: ghế ngồi được · cái gánh · áo mưa. (Ghế ngồi được: ✅ `world/map.SEAT_SPOT`.) (Ô hóng mát **đã có**:
`world/map.SHADE_SPOT`.)

---

## 6. CHỖ CẦN THEO DÕI, chưa phải lỗi

* **`duong.docduoc` rút 1.869 lần** so với `duong.hoiduong` 226 (4 ngày probe). Phần lớn
  do `canRun` chặn cuộc `FULL` lúc có người chờ, nên chỉ còn `SHORT`+`BARK` tranh nhau.
  Không hẳn sai — cuộc đó có 14 nhánh theo mục đích nên **người chơi thấy 8 câu khác nhau**,
  không phải một câu lặp 1.869 lần. Theo dõi khi có telemetry người thật.
* **Tỉ lệ `?` đang 1,07%** (mốc < 5%), và chỗ còn lại duy nhất là `w.queue(1)` của câu
  *"xích qua chút giùm"* — đúng loại động thật: hàng vãn giữa lúc đang đọc.
* **`ATT_K` / `ATT_FLOOR` / `DRIVE_DECAY_PER_MIN`** của `sim/drives.ts`, và `OVEN_SMELL_SEC`
  của `sim/service.ts`, là số bản dựng đặt, chưa tune. Xem `P2-09` §5.

---

## 6bis. BỐN LỖI TỰ GÂY — và một lỗi QUY TRÌNH đứng sau cả bốn

### Lỗi quy trình: lấy validator làm định nghĩa "xong"

Đợt đầu của `qua-duong` tôi báo **70,1% neo · validator sạch · 479 test xanh** và coi là
xong. Chủ dự án chơi thử và chỉ ra bốn câu vô lý mà **cả mười hai lưới đều cho qua**:

> *"Cô cần gì cứ nói con nghen / xe mới dọn lại đó cô — họ đâu cần biết, bình thường làm
>  gì có ai bắt chuyện như này đâu?"*

Validator kiểm **cấu trúc**, không kiểm **có ai nói vậy không**. Và tệ hơn: lưới `T011`
đòi mỗi nhánh ≥ 2 dòng, nên tôi **lấp cho đủ chỉ tiêu** bằng mấy câu nhân viên cửa hàng.
Chỉ tiêu được thoả, trải nghiệm thì hỏng.

**Luật rút ra:** `npm run play:passers` (in ra đúng cái người chơi thấy, kèm hoàn cảnh)
phải chạy **trước khi** báo một file là xong. Lấp chỉ tiêu bằng câu vô lý là sai; bỏ hẳn
cái nhánh không có gì để nói mới là đúng.

### 1. Rút số có điều kiện từ dòng dùng chung

`maybeCutLine` nhận thẳng `rng` của `spawn()` rồi gọi `rng.next()` **chỉ khi** đã có người
đứng trước — nên nó dịch mọi lần rút sau đó, nhưng chỉ ở một số lượt. `tests/p1-hollow`
bỗng gặp một NPC khác hẳn ở quầy. Sửa: `hub.derive(...)`. Đã có cổng `npm run gates` canh.

### 2. Một cái tên mang hai nghĩa — `w.ovenHot`

Chi tiết ở `P2-09` §11.4. Bài học: **scene chỉ đưa SỰ THẬT THÔ, kết luận suy ra ở `Service`.**

### 3. Một khoá đọc KẾ HOẠCH thay vì đọc VIỆC ĐÃ XẢY RA — `t.glanced`

Nó đọc `pass.stay > 0`, một cờ đặt lúc spawn, đúng suốt cả quãng đi — kể cả trước và sau
khi họ dừng. Nên mọi cổng gắn lên nó **vô tác dụng**, và câu *"cô ngó gì đó?"* bày ra cho
người đang rảo bước. Cùng họ với lỗi 2, và tôi đã có §11.4 trong tay mà không đi kiểm mấy
khoá còn lại. Sửa: `pass.until >= 0` (mốc họ TỚI chỗ ngó). Thêm `t.lookingInside` cho
người đi ngang (trước đó luôn sai vì chỉ đọc `gazeState`).

### 4. Sàn điểm chặn nhầm chính LỜI MỜI

Thêm `TALK_SCORE_FLOOR` để người đang cuống không bị bắt chuyện — đúng. Nhưng `satisfiesOf`
mô hình `MOI` là **thuần chi phí**, nên lời mời cũng rơi xuống dưới sàn: test bắt được
*"110/110 lần bước ra mời mà cuộc mở ra không có đường mời nào"* — tức **đóng chết cửa duy
nhất để một người đi ngang thành khách**.

Sửa hai bậc: miễn sàn cho cuộc **mở miệng ra đã là mời** (`opensWithInvite`, xét NHỊP ĐẦU
chứ không phải cả cây — một cuộc có lời mời tận nhịp hai thì nhịp đầu vẫn là tán gẫu).
Hai chuyện tách bạch: *mở miệng mời được không* (luôn được) và *họ có ghé không*
(`inviteChance` × `purposeInviteMul` quyết).

---

## 6ter. NGƯỜI QUA ĐƯỜNG — SỐ ĐO SAU KHI LÀM LẠI

```
npm run play:passers    # bản ghi: mỗi lần bấm F thấy gì, kèm hoàn cảnh
npm run probe:score     # điểm drive của từng người, để đặt sàn
```

**Bốn cuộc phản ứng chuyển sang `NPC_ONLY`** — `hoiduong` · `hem` · `mua` · `voi`. Chúng
chỉ tồn tại vì người kia vừa nói một câu; không có câu đó thì không có cuộc. Người chơi
không mở được, và **không cần mở**.

**Cuộc MỜI tách khỏi cuộc ĐỌC NGƯỜI** (`duong.docduoc` / `duong.nhinra`) — gộp chung thì
nhịp đầu vượt trần đọc, và lần trước tôi cắt nhầm lời mời cho vừa trần.

Tỉ lệ người ta chịu ghé, 10 ngày · 76 lời mời — **cơ chế đọc ra được**:

| họ đang đi đâu | chịu ghé |
|---|---|
| ra bến xe về quê | **67%** |
| đi tập về · dắt chó đi dạo | **50%** |
| đi lấy thuốc cho mẹ · đi làm ca sớm | 25% |
| đi lễ chùa · đưa con đi học | 0% |
| **đi làm trễ · chạy đi mua thuốc gấp · đi khám bệnh** | **0%** |

Tổng **16%**. Người chơi học được: mời người đi tập về, đừng mời người đang chạy đi mua
thuốc. Đó là thứ `purposes.json` dựng ra để làm, và đây là lần đầu nó tới được tay người chơi.

## 6quater. KHÁCH LẠ (`walkin`) — ĐỢT LÀM LẠI, VÀ LỖI NGHIÊM TRỌNG NHẤT TỪ TRƯỚC TỚI GIỜ

Chủ dự án chơi thật rồi hỏi thẳng: *"tôi k biết là tôi và bạn có đang chơi cùng game khong
nữa. sao cái của tôi nó trả lời ngu lắm mà. bạn test nó ra cũng hợp lý thế?"* — và câu hỏi
đó đúng. Hai công cụ tôi đang dùng để báo cáo đều **không chơi game**:

* `tools/read-talks.ts` đọc file JSON — nó in CÂY ĐÃ VIẾT, tức trường hợp tốt nhất;
* `tools/play-passers.ts` chỉ in **nhịp đầu** — mà chỗ hỏng nằm từ nhịp hai trở đi.

### Đo lại cho đúng

`tools/play-deep.ts` (mới) bấm cho tới HẾT cuộc, đi đúng hai hàm mà phím F gọi —
`service.openTalk()` → `service.chooseTalk(i)`. Chạy trong trình duyệt cũng ra cùng kết quả.

| | trước | sau |
|---|---|---|
| cuộc chết sau MỘT nhịp (khách lạ) | 56% | **22%** |
| dài trung bình | 2,30 nhịp¹ | **1,89 nhịp** |
| câu khách lạ nói lấy từ túi `any` dùng chung | 56% | 0% |
| cuộc khác nhau người chơi mở được | 3 | **9** |
| khách TỰ mở lời | 0,6 lần/ngày | **1,2 lần/ngày** |

¹ con số cũ còn **đang khen nhầm**: xem "vòng lặp ?" bên dưới.

### Năm lỗi, bốn cái không lưới nào thấy

**1. Túi `any` lấn chỗ.** `scoreTalk()` **bỏ qua `weight` hoàn toàn** — điểm chỉ từ
`satisfiesOf(t)`, mà hàm đó chỉ nhìn `source` + `depth`. Nên `any.troi.nong` và
`walkin.dienthoai` có điểm **y hệt nhau**. Chữa bằng `drives` khai tay cho 7 cuộc `any`
(`DUOC_HOI` 28 → 10): túi dùng chung là ĐƯỜNG LUI, không phải đường chính.

**2. Điểm bằng nhau = thứ tự trong file.** `pickWeighted` sắp xếp rồi `slice(0, TOP_N)`;
`Array.sort` ổn định, nên khi hoà thì top-3 luôn là **ba cuộc đứng đầu mảng** — tức ba
cuộc viết sớm nhất, mãi mãi. Đo được ngay sau khi thêm 4 cuộc mới: `walkin.cay` chiếm
11/19 lần, ba cuộc mới **0 lần** dù cổng của chúng đúng tới 92%. Chữa: xoay danh sách
bằng một số rút từ cùng dòng `dialogRng` (luôn rút, không rút có điều kiện).

**3. Vòng lặp "?" vô tận.** `while` không giữ ⇒ `chooseTalk` trả "?" mà **không đi tiếp**,
nên nhịp cũ hiện lại nguyên si, bấm được vô hạn, mỗi lần −1 điểm quan hệ.
`walkin.dienthoai` khoá TRỌN nhịp đầu sau `t.onPhone` (đúng 5%) ⇒ 95% số lần mở là một
bức tường "?". Bản ghi có 8 nhịp "?" liên tiếp — và bảng thống kê đọc nó thành *"cuộc dài
8 nhịp"*, tức con số còn khen nó. Chữa hai tầng: `TalkSession.strike()` gạch câu đã trật
(hết đường thì đóng phiên), và khoá cả cuộc bằng `when.world`.

**4. Cổng NGƯỢC.** `walkin.cay` hỏi ớt/hành nhưng khai `practice: ["NAN_LAI"]` (trả giá,
đúng 8%) và `need: ["!t.hasOrder"]` (đúng 8%) — hỏi ớt là chuyện của lúc ĐÃ gọi món. Hai
cổng nhân nhau ⇒ cả mùa chạy **0 lần**, còn hai câu luôn hiện thì cụt.

**5. Kho rỗng ở đúng chỗ cần.** 87% lần hệ định cho khách mở lời rớt ở *"không cuộc nào
chạy được"* — vì 5/6 cuộc khách-mở-lời là `FULL`, mà `FULL` phải qua `canOpenDeep()`.
Không có một cuộc `SHORT` nào. Chính chú thích trong `offerTalk` đã nói trước:
*"Câu ngắn thì cứ nói — hẻm phải sống."*

### Hai cổng mới

* **T013** — mọi cổng đóng thì **nhịp đầu vẫn phải còn một nút CÓ NHÁNH**. `T011` chỉ đếm
  còn mấy DÒNG, không hỏi mấy dòng đó đi được tới đâu — và chính nó đẩy tôi nhét câu trần
  cho đủ số, mà câu nhét thêm thì cụt. Miễn `MOI` và `BARK`.
* **T014** — nhịp đầu không được để **mọi** dòng nằm sau `while` (trừ khi `when.world` đã
  khoá sẵn cùng khoá đó).

**Nợ T013: 23 cuộc**, có tên trong `T013_NO` của `tools/validate-talks.ts`. Nằm trong danh
sách = được tha đúng một lần, đếm được; nội dung MỚI vẫn trượt cứng. Phần lớn là 12 cuộc
`*.moiloi*` của người có tên — đó đúng là chỗ chủ dự án gặp bà Bảy (138 câu đã viết) rồi
nhận lại `"…Ờ."`. Trả nợ ở đợt nội dung của từng người.

### Nội dung đã thêm

9 cuộc mới cho `walkin` (11 → 20):

* **khách mở lời** (`SHORT`, lấp đúng chỗ kho rỗng): `thoitien` đổi tờ năm trăm ·
  `chiduong` hỏi đường · `hoigio` hỏi giờ · `trumua` xin đứng nhờ lúc mưa · `dungxe` xin dựng xe;
* **người chơi mở lời**: `meraLo` mẻ vừa ra lò (`w.ovenHot`) · `gukhach` đoán gu
  (`t.hasOrder`, 92%) · `vuamieng` hỏi sau khi đưa bánh (`t.served`, đủ điều kiện 79%) ·
  `dongkhach` xin lỗi vì đông (`w.queue(1)`, 54%).

Khoá tình huống đặt ở `when.world` chứ không rải xuống từng nút — để nhịp đầu để TRẦN và
CÓ NHÁNH. Đó là bài học của cả đợt: **thứ luôn hiện phải là thứ đi được tiếp.**

### Công cụ mới

```
npm run play:deep -- --pool WALKIN --days 10    # bấm tới HẾT cuộc, không dừng ở nhịp đầu
npm run probe:facts -- --pool WALKIN            # mỗi sự thật đúng bao nhiêu % lúc bấm F
```

`probe:facts` là thứ đáng ra phải có từ đầu: viết cổng mà không biết tần suất là viết mò,
và viết mò ra đúng một kiểu hỏng — câu hay khoá tới mức không bao giờ hiện, câu nhạt để
trần nên luôn hiện.

### Giới hạn của lần kiểm này

Trong trình duyệt tôi **không dựng được** cuộc walk-in thật: bot không kẹp bánh phục vụ
được, nên khách tới quầy rồi bỏ đi trước khi nói chuyện. Đường người đi ngang thì chạy
được, và nó xác nhận bản sửa `any.chao` đã lên game (nhịp hai hiện ra). Phần walk-in dựa
trên `play:deep`, vốn gọi đúng hai hàm mà phím F gọi — khác bản chơi tay ở chỗ không có
Phaser vẽ và không có thao tác tay.

## 6quinquies. MƯỜI HAI NGƯỜI CÓ TÊN — HÀNH ĐỘNG, ĐIỀU KIỆN, KÝ ỨC

Chủ dự án hỏi: *"lúc đầu chốt là mọi lời thoại đều có item và hành động thật mà tôi có
thấy bạn code item hay hành động hay điều kiện và trí nhớ gì đâu? hay chưa tới? trong
plan có nói không?"*

**Có trong plan — Bước 5 của chính tài liệu này.** Tôi làm Bước 5 cho `qua-duong`, bỏ nó
ở `walkin` và ở 12 người có tên. Nói "xong walkin" là nói quá: đúng hơn là *xong phần
cấu trúc hội thoại, chưa làm phần hành động và ký ức*.

### Số đo lúc bị hỏi

| | act | cổng đọc thế giới | truy hồi ký ức |
|---|---|---|---|
| `qua-duong` | 50% nút | 54% | — (người lạ không có sổ riêng) |
| `walkin` | 15% | 23% | 1% |
| **12 người có tên** | **2%** | **5%** | **0%** |

Nặng nhất: `sim/recall.ts` — `retrieve()`, `recallFor()`, phần điền `{m.what}` trong
`Service.fill()`, cổng `T004` — **dựng xong từ P2-09 và chạy không tải**. `{m.what}` xuất
hiện **0 lần** trong nội dung; `about` khai ở **0/98** cuộc.

### Hai cổng mới, viết TRƯỚC khi trả nợ

* **T015** — mỗi kho phải có ≥ một nửa số cuộc mang HÀNH ĐỘNG THẬT. `A-1` đã canh "câu
  hứa phải có `act`" nhưng nó đọc từng câu theo mấy lối nói cố định; nó không thấy được
  chuyện cả một con người không có một hành động nào (`thay-phuc` và `chi-hanh`: 0/9).
  CANON T2 — *thức ăn LÀ lựa chọn thoại*; nói chuyện bốn mươi ngày mà không đưa được cái
  gì thì cây thoại đó là một cái menu có giọng.
* **T016** — mỗi người CÓ TÊN phải có ít nhất một cuộc neo ký ức: khai `about` (đầu vào
  relevance của `retrieve()`) **và** có một nút nói `{m.what}` (`T004` đã buộc nút đó mang
  `need: m.remembers`). Không áp cho `WALKIN`/`QUA_DUONG`/`ANY` — `memKey` của họ dùng
  chung nên nhớ hộ nhau là ghi lên sổ người khác.

Hai danh sách nợ để RỖNG ngay từ đầu: trả nợ chứ không ghi nợ.

### Nội dung đã viết

* **22 cuộc `*.moiloi*` mọc nhịp hai** — 78 nút nhịp đầu, 74 cụt. Chữ không dở (mỗi câu
  đáp đều có một chi tiết thật); thiếu đúng một thứ là nhịp sau.
* **12 cuộc `*.nhochuyen`** — mỗi người một cuộc hỏi lại chuyện cũ. Câu đáp của nút
  `{m.what}` phải đúng với MỌI ký ức truy hồi ra được (14 loại, tốt lẫn xấu), nên chi
  tiết cụ thể của nó nói về CON NGƯỜI đó, không nói về chuyện đó.
* **33 cuộc được gắn hành động** — trà đá, đưa bánh, bớt giá, cho nợ, bưng gánh, chạy đi
  lấy sổ, dạt chỗ, ngó vô xe. Thưởng nằm ở `onKept`: trả lúc LÀM, không trả lúc hứa.
* **8 cuộc `NPC_ONLY` ngắn mới** — bà Bảy chân đau · chú Tư xe chết máy · cô Mai xin bịch
  nilông · chị Hạnh hỏi chỗ cắt tóc · thầy Phúc đồng hồ lệch · anh Bảo thiếu hai ngàn ·
  bé Su xin sạc nhờ · ông Hải nhờ mở nắp chai · anh Dũng khách huỷ cuốc · chị Lan xin
  đứng nhờ · chú Kiệt hết hàng qua mua. Vừa trả lưới `V-3` (≥60% nội dung do NPC mở lời)
  vừa lấp đúng chỗ kho rỗng đã đo ở đợt `walkin`.

### Kết quả đo lại

| | trước | sau |
|---|---|---|
| khách TỰ mở lời | 0,6 lần/ngày | **1,8 lần/ngày** (trần 3) |
| rớt vì *"không cuộc nào chạy được"* | 87% | **9,7%** |
| người có tên · cuộc chết sau một nhịp¹ | — | **19%** |
| khách lạ · cuộc chết sau một nhịp¹ | 56% | **3%** |
| `{m.what}` trong nội dung | 0 | **12** |

¹ đo bằng `--engaged`: bot mặc định bấm đều nên một phần ba số lần nó chọn đúng đường ra
(*"Thôi, hổng có gì"*) — và cuộc dừng vì ĐÓ LÀ VIỆC câu đó làm. Đếm chung vào "chết sau
một nhịp" là đổ cho nội dung một chuyện do cách đo.

### Hai lỗi có sẵn lộ ra trong lúc làm

* `tools/lint-lines.ts` L013 lọc biến bằng `\{\w+\}` trong khi ba chỗ khác cùng file
  dùng `[\w.]+` — nên biến có dấu chấm (`{m.what}`) không được lọc, cặp ngoặc sót lại và
  báo "{ ngoài bảng glyph". Nằm im cho tới khi có người đầu tiên viết `{m.what}`.
* `TALK_NPC_IDS` gồm cả `WALKIN`/`QUA_DUONG`/`ANY`, nên bộ lọc `--pool NAMED` của
  `play-deep` khớp tất — số liệu "người có tên" của đợt trước bị trộn.

### Còn lại

Bấm F với một người CÓ TÊN thì trung bình chỉ còn **0,9 cuộc của chính họ** đủ điều kiện,
so với **2,1 cuộc túi chung** — 681/1000 lần bị loại vì `NPC_ONLY`. Đó là hệ quả cố ý của
`V-3`, và nó cân bằng qua cả mùa (1,8 lần/ngày × 40 ngày ≈ 72 lần, so với ~95 cuộc
`NPC_ONLY`), nhưng nó có nghĩa là người chơi **không gọi ra được** chuyện của họ theo ý
muốn. Nếu muốn đổi, chỗ đổi là `TALK_OFFER_GAP_SEC` (100 s, đang chặn 39%) và
`TALK_INITIATE_BASE` (0,3, đang chặn 38%) — hai con số thiết kế, không phải thiếu nội dung.

## 6sexies. `duong.nhinra` — MÓN NỢ CUỐI, VÀ CHỖ NÓI DỐI LỘ LIỄU NHẤT

Hai lỗi chồng lên nhau trong cùng một cuộc, mà nó lại là cuộc `weight` cao nhất kho người
qua đường — tức cuộc người chơi gặp nhiều nhất:

* **cụt** — cả 7 dòng nhịp đầu không dòng nào có nhánh. Đo trong trình duyệt ngày 5: 4/12
  cuộc là nó, dài đúng một nhịp, lần nào cũng vậy.
* **nói dối** — dòng không khoá *"{call} đi đâu đó?"* đáp **"Ra chợ một chút"** cho tất cả.
  Mà `purposes.json` biết rõ họ đi đâu. Bản ghi: *chị đeo khẩu trang · đi làm* → "Ra chợ
  một chút"; *cô xách giỏ · đẩy xe đi sửa* → "Ra chợ một chút"; *bà cụ · đi đón người nhà
  ở bến xe* → "Ra chợ một chút".

Chữa bằng cơ chế đã có sẵn mà chưa chỗ nào dùng tới: `t.purpose` nằm trong `SINGLE_VALUED`
của `beatWidth`, nên **mười hai dòng khoá mười hai mục đích khác nhau chỉ tính là MỘT
dòng** — người chơi thấy đúng một câu, câu hợp với người đang đứng đó. Đây chính là mẫu
thiết kế mà chú thích của `beatWidth` mô tả.

Mười hai mục đích nặng ký nhất của `purposes.json` được viết riêng, mỗi cái một nhánh ba
con. Dòng không khoá giữ lại nhưng thôi bịa chỗ đến — hỏi trống thì đáp trống
(*"Đi có chút chuyện hà."*).

```
[57] anh chạy xe · đi mua đồ ăn sáng cho cả nhà · sốt ruột
  TÔI: "Anh mua đồ ăn sáng cho cả nhà hả?"
  HỌ : "Ừ. Bốn phần. Mà mỗi đứa đòi một kiểu, tui nhớ muốn khùng."
  TÔI: "Nhà anh khó chiều ha."
  HỌ : "Khó thấy mồ. Mà hổng mua là tụi nó nhịn luôn, tui chịu sao nổi."
```

`duong.nhinra`: 1,00 → **1,79 nhịp**. Danh sách nợ T013 rỗng ⇒ đã xoá khỏi validator.

### Sự cố: validator bị xoá mất và phải dựng lại

Lúc gỡ khối `T013_NO`, một `index('])\n')` bắt nhầm dấu đóng ngoặc ở xa hơn và **xoá mất
hai phần ba `tools/validate-talks.ts`** (380 → 100 dòng). File đó **chưa bao giờ được
commit** nên `git` không giữ bản nào — phải dựng lại toàn bộ 16 lưới từ đầu.

Dựng lại xong nó báo "sạch — 0 lỗi", và **đó chính là lúc không được tin nó**: một
validator chết không kêu, nó chỉ lặng lẽ cho mọi thứ đi qua. Đã bị đúng một lần ở cổng
`check-gates` (heredoc nuốt `\b` thành một byte backspace; lưới hết khớp gì mà vẫn in ✔).

Nên có `tests/p2-validator-song.test.ts`: **phá nội dung đúng kiểu từng lưới canh, rồi
hỏi lại validator**. 16 ca, mỗi ca một mã lưới phải kêu lên, cộng một ca đòi nội dung thật
vẫn sạch (lưới nghiêm mà không bắt oan). Hai lỗi của bản dựng lại bị chính nó bắt:

* `LOI_DAP` dùng `\b` sau chữ có dấu — `\b` của JS tính theo ASCII, "ạ" không phải chữ
  ASCII, nên `dạ\b` khớp luôn chữ **"Dạo"** trong *"Dạo này có vụ gì mới hông con?"*, một
  câu mở lời hẳn hoi;
* `T007` bắt rộng hơn bản gốc — nó chỉ canh `PROMISE_DEED` (việc hẹn làm rồi mới làm), chứ
  `PROMISE` (bỏ thêm miếng chả) và `CREDIT_LOAF` (cho cầm ổ đi trước) có hệ quả rơi ngay
  trong lượt, được trả thưởng liền.

## 6septies. THẺ KHUNG CẢNH GẮN NGƯỢC, VÀ TÚI CHUNG HỌC CÁCH ĐỌC NGƯỜI

### Lỗi gắn thẻ mang tính hệ thống

So thẻ đã khai với tần suất đo được (`npm run probe:facts`, 2.769 mẫu lúc bấm F):

| khung cảnh | thực tế ở quầy | 12 người có tên khai |
|---|---|---|
| `GOI_MON` | **37%** | 15% |
| `XEP_HANG` | 30% | 93% |
| `QUAY_VANG` | 18% | 92% |
| `NAN_LAI` (trả giá) | **8%** | **82%** |

Gần như ngược. Bộ ba `[QUAY_VANG, NAN_LAI, XEP_HANG]` lặp y hệt ở **100/121** cuộc — đó là
một giá trị mặc định được chép đi chép lại, không phải một quyết định. Hậu quả đo được:
86 lần một cuộc của chính người đó bị loại khỏi danh sách chỉ vì lệch khung, và chỗ trống
đó rơi vào túi `any`.

Gắn lại theo LÚC câu đó được nói: đa số chuyện trò với khách quen xảy ra trong lúc mình
đang kẹp ổ bánh của họ, tức `GOI_MON`. `NAN_LAI` chỉ giữ ở cuộc thật sự nói về giá;
`DOI_BANH` thêm vào cuộc nói về chính ổ bánh. Sau đó phần còn lại của 86 lỗi hoá ra đều
là `DI_NGANG` — người quen đang ĐI NGANG chứ không đứng quầy; mà *gọi với theo một người
mình quen* chính là việc `*.moiloi*` và `*.nhochuyen` sinh ra để làm, nên 38 cuộc đó được
thêm `DI_NGANG`.

Kết quả: bấm F với người có tên, số cuộc CỦA CHÍNH HỌ còn dùng được **0,9 → 1,4**.

### Túi chung học cách đọc người

`any` chiếm 59% số câu nói với người có tên ở ngày 3, 51% ngày 15, **48% ngày 28** — giảm
dần khi nội dung riêng mở khoá. Đó là đúng thiết kế (`any` là tầng không bao giờ cạn,
P2-06 §3), nên không đi cắt nó. Việc đúng là làm cho chính nó đọc được người đang đứng
trước mặt.

Sáu cuộc `any` giờ có biến thể khoá `m.tier`: câu nói với người đã thành BẠN khác câu nói
với người đang GHÉT mình. `m.tier` đơn-trị nên ba biến thể chỉ tính là MỘT dòng — thêm vào
không vượt trần đọc. T3 giữ nguyên: không con số nào hiện ra, người chơi chỉ nghe giọng
người ta đổi.

Đo trên 30 ngày bot chơi tham lam: chỉ bé Su lên tới `FRIEND`. Đúng như vậy — thân là thứ
phải xây, và câu ấm là phần thưởng chứ không phải mặc định.

### Một lỗi `beatWidth`

`m.tier` và `t.tier` là **cùng một sự thật** (`seasonTier`) dưới hai tên alias, mà
`SINGLE_VALUED` chỉ có `t.tier`. Nên hai biến thể `m.tier(FRIEND)` / `m.tier(RIVAL)` bị
đếm thành hai dòng và vượt trần đọc, dù chỉ một trong hai bao giờ cũng hiện. Soát cả bảng
đen: chín alias trỏ tới một sự thật ordinal/enum, đúng `m.tier` là cái sót
(`c.saidTone` và `v.promised` không thuộc đây — chúng là tập).

### Số đo chốt

| | ngày 3 | ngày 15 | ngày 28 |
|---|---|---|---|
| cuộc chết sau một nhịp (người có tên) | 17% | **13%** | 20% |
| dài trung bình | 1,85 | 1,91 | 1,86 |
| túi `any` chiếm | 59% | 51% | **48%** |

## 6octies. CHƠI TAY BẮT ĐƯỢC MỘT LỖI, VÀ CÁI GHẾ 320 NGHÌN CÓ TÁC DỤNG THẬT

### Lỗi chỉ lộ ra khi chơi: một người đi ngang bị gọi lại năm lần

Bản ghi trong trình duyệt, ngày 1:

```
anh chạy xe · ra bến xe về quê · lo
  #1 duong.docduoc   #2 duong.nhinra   #3 any.troi.mat   #4 any.chao   #5 any.banh
```

Năm cuộc, một lượt đi ngang, một người **đang vội ra bến xe**. Không gì ngăn.

`talkedThisVisit` chỉ chặn mở **lại cùng một cuộc**, không chặn mở cuộc khác. Và nó **cố
ý không ghi cuộc túi dùng chung** (tầng `ANY` không vào sổ của ai, P2-09 §2.4) — mà 3
trong 5 cuộc đó là `any.*`, nên ngay cả khi lấy sổ đó ra đếm thì vẫn chỉ thấy hai.

Chữa bằng `Service.passerTalks` — sổ đếm riêng, đếm MỌI cuộc, trần `PASSER_TALKS_MAX = 2`.
Hai chứ không một: người chơi được tán một câu rồi mới mời, đúng nước đi hai nhịp mà
`duong.docduoc` dựng quanh. Kèm câu nói ra cho người chơi, không im lặng nuốt cú bấm:
*"\<tên\> nói chuyện nãy giờ rồi — người ta còn đi."*

Đo lại trong game: **tối đa 1 cuộc/người** (trước 5).

Đây là loại lỗi không công cụ nào trong repo bắt được — không phải lỗi cấu trúc, không
phải lỗi cổng, không phải lỗi chữ. Nó chỉ hiện ra khi có người ngồi bấm F liên tục vào
cùng một người.

### `THEY_SIT` — món nợ code to nhất, trả xong

`GHE_BAN` ("Ghế nhựa + bàn nhỏ", 320 nghìn) trước đợt này **mua được, vẽ được, và không
nút thoại nào làm ai ngồi xuống**. 19 câu mời ngồi khai `needEquip: "GHE_BAN"` rồi thôi;
một câu (`walkin.cau`) còn gắn nhầm `STEP_ASIDE` — mời ngồi mà hoá ra bảo người ta tránh
đường. Đó là "lời nói miễn phí" ở tầng ACT: lưới `A-1` không thấy vì nó đọc CHỮ, mà chữ
thì không sai.

Làm trọn một vòng, không nửa vời:

| tầng | thêm gì |
|---|---|
| bản đồ | `SEAT_SPOT` + `SEAT_CAPACITY = 2` (đọc từ `slots: 2` của chính món đồ), kèm kiểm không chồng lên `SHADE_SPOT`/`ASIDE_SPOT` |
| khách | `Customer.sitting` · `sitUntil` · `SIT_PATIENCE_MUL = 0,55` |
| sim | `theySit()` / `standUp()`, đi bộ tới ghế, ra khỏi vòng cấp chỗ rồi quay lại |
| sự thật | `w.seatFree` (động) · `t.sitting` |
| cổng | `T003` thêm mẫu "mời ngồi" đòi `w.seatFree` + `GHE_BAN`; `T006` thêm `THEY_SIT` vào nhóm act có thời lượng |
| nội dung | 19 nút nối vào act thật |
| test | `tests/p2-ghe.test.ts`, 4 lưới |

**Cái ghế phải đáng tiền, nên nó có một con số:** ngồi thì đồng hồ chờ trôi còn 55%. Không
phải 0 — ngồi lâu vẫn sốt ruột, và cái ghế không được thành nút tắt kiên nhẫn. Đo trên
`patienceOf` mặc định (~100 giây): người ngồi chịu được ~180 giây trước mốc
`MADE_THEM_WAIT` thay vì ~100.

Đo trong một buổi bán: **chưa mua ghế → mời ngồi thành 0 lần; mua rồi → 8 lần.** Cổng
`w.seatFree` tự kiểm thiết bị trong `tickWorldFacts`, nên người viết nội dung quên khai
`needEquip` cũng không làm câu mời hiện ra ở cái xe chưa có ghế.

Lưới `G-3` bắt được một nút hứa HAI việc một lúc (*"Bà ngồi nghỉ chút đi bà. Con rót bà ly
trà."* mang `OFFER_TEA`) — một nút, một lời hứa; đã tách.

## 6nonies. `FILM` — CÁI CLIP THÔI LÀ MỘT CON SỐ KỊCH BẢN

`storyCrowdMul` đã có sẵn từ lâu: `day > clipDay && day <= clipDay + 3` ⇒ **×1,4 lượng
khách ba ngày**. Nhưng `clipDay` do `endOfDay` đặt cứng ở ngày 5 (che tay → 16, làm đẹp
→ 9, bình thường → 10) — tức cái clip là một mốc lịch, không phải hệ quả của việc bé Su
quay được cái gì. Trong khi đó mười ba câu *"ừ con quay đi"* không làm ai giơ điện thoại
lên.

Nối lại thành một vòng:

```
cho quay (FILM) → máy chạy N giây → cả đoạn bị chấm liên tục
   quầy sạch  → clipDay nhích sớm (chỉ được dời SỚM, không xoá nhánh kịch bản ngày 5)
   quầy dơ    → clipBad = hôm nay, không có clip tốt
cất máy (STOP_FILM) → đoạn huỷ, không ghi gì
```

`DIRT_ON_CAMERA = 0,35` — **thấp hơn ngưỡng khách phàn nàn**: ống kính xoi hơn mắt người
đứng mua, và đó đúng là chuyện người bán hàng sợ khi có người giơ máy lên. Rủi ro đọc
được trước khi bấm (CANON T5): quầy dơ thì nhìn màn hình là thấy.

`CLIP_DUNG_SAU = 4` ngày — bé Su còn phải dựng. Đủ xa để người chơi quên mất mình đã cho
quay, rồi lượng khách tự nhảy lên và họ phải tự nối hai chuyện lại; một hệ quả dạy luật
chơi mà không cần một dòng chữ giải thích.

9 nút nội dung được nối (6 cho quay · 3 cấm quay). Chỉ nối câu CHO PHÉP / CẤM — không nối
câu hỏi (*"con quay cái này chi vậy con?"*) hay câu nhắc chuyện cũ (*"cái clip bữa
trước…"*): một act là một VIỆC XẢY RA, không phải một chủ đề.

`tests/p2-quay.test.ts`, 4 lưới — trong đó `Q-3` canh đúng chỗ dễ mục nhất: clip tới sớm
thì **lượng khách phải nhảy thật**, không phải một con số nằm im trong `flags`.

## 6decies. CÁI GÁNH THÀNH MỘT VẬT THỂ, VÀ ĐỔI HÀNG THÀNH MỘT NƯỚC ĐI

### `CARRY_GANH` / `MOVE_GANH`

Nội dung đã viết sẵn cả **ba vai** của cái gánh từ lâu — nặng vai bà, chắn lối khách, gửi
lại một nồi — mà không có vật thể nào để bám. Câu *"bà để gánh chỗ khác giùm con"* thậm
chí mang `STEP_ASIDE`: bảo **người** dạt ra chứ không dời **cái gánh**.

Cái giá đi qua đúng `balkChance` đã có sẵn, không đẻ thêm đường tính riêng: gánh để ngoài
= **thêm một chỗ mặt tiền bị chiếm**. Và nó **chỉ cắn khi quầy đã đông** — `balkChance` chỉ
khác 0 từ `ahead = 4` trên 6 chỗ — đúng điều lời thoại nói: *"khách con hổng đi qua được"*.
Quầy trống thì cái gánh nằm đó chẳng cản ai; đó là chuyện lối đi, không phải một hình phạt nền.

Hai act chứ không một, vì chúng là hai chuyện khác nhau giữa hai người:

| | lối đi | cái vai bà |
|---|---|---|
| `CARRY_GANH` — mình bưng giùm | thông | được nghỉ |
| `MOVE_GANH` — bảo bà tự dời | thông | vẫn phải nhấc hai chục ký |

Cái gánh theo chân bà Sáu: bà tới thì nó nằm ngoài, bà về thì nó đi theo. Giữa hai mốc
đó, chỗ của nó là việc của người chơi.

### `BARTER`

`P2-08` ghi *"không act nào nhận một món VÀO"*. Cái thiếu thật ra ở chiều kia: **đưa một ổ
bánh mà không lấy tiền và cũng không phải cho không**. `FREE_LOAF` là cho, `PAY` là bán —
đổi là chuyện thứ ba, và nó là cách hai người bán hàng nghèo đối xử với nhau.

Ổ bánh rời kho thật, không có dòng doanh thu nào — hiện ra ở sổ cuối ngày như mọi ổ không
bán được. Thứ nhận lại nằm ở `rel` và ở ký ức `CARED_FOR_THEM`, không ở một con số kho:
một chén tàu hũ không làm mình bán thêm ổ nào, nó làm bà Sáu nhớ mình.

`tests/p2-ganh.test.ts`, 5 lưới. `N-5` canh cái giá: đổi mà tay không cầm ổ nào, hoặc đổi
lúc đã hết bánh, là đổi một thứ mình không có.

Và lại một nút hứa HAI việc (*"Bà ngồi cái ghế này đi bà. Con bưng gánh vô cho."*) — lưới
`G-3` của đợt trước bắt ngay. Một nút, một lời hứa.

## 6undecies. `MOVE_CART` — VÀ MỘT ACT CHẠY KHÔNG TẢI MÀ KHÔNG AI KÊU

### Lỗi nặng nhất của đợt này là của chính tôi

`BARTER` được khai trong `TalkAct`, gắn vào hai nút nội dung, **qua hết `validate:talks`
và 509 test** — mà `switch` của `applyAct` không có nhánh nào cho nó. Bà Sáu đổi chén tàu
hũ lấy ổ bánh, và ổ bánh không đi đâu cả. Tôi đã báo "xong" ở lượt trước; sai.

TypeScript im vì **`switch` thiếu nhánh không phải lỗi kiểu**. Hai lưới mới chặn lại:

* `default: assertActHandled(act)` — tham số `never`. Thêm một `kind` vào `TalkAct` mà
  quên nối thì `npm run check` **trượt ngay tại dòng đó**, không chờ tới lúc chơi.
* `X-5` — mọi `act.kind` có trong nội dung phải có `case` trong `applyAct`.

### `MOVE_CART`

Mười một câu nói về cái xe đều là chữ suông, kể cả *"chú đứng chắn hết lối rồi"* — nó
mang `STEP_ASIDE`, tức bảo NGƯỜI dạt ra chứ không dời CÁI XE.

Cái giá **khác hẳn cái gánh**, và khác vì bản chất khác:

| | cách tính | cắn lúc nào |
|---|---|---|
| gánh bà Sáu | +1 `ahead` (một vật cản) | chỉ khi quầy đã đông |
| xe chú Kiệt | `KIET_STEAL = 0,18` khách lạ đi thẳng qua xe chú | **kể cả lúc vắng** |

Vì chú Kiệt là một **đối thủ đang bán**, không phải một cái thùng. Chỉ ăn khách LẠ:
người có tên tới tìm mình, không tạt ngang vì một cái xe đứng gần hơn. Dòng số riêng
`kiet:` chứ không rút ké `balk:` (P0-02 §2.3).

Đo trên một buổi bán ngày 10: **để yên thì mất 2 khách vào xe chú; bảo chú đẩy đi thì 0.**

### Và một lỗi điều kiện làm cả hai vật thể vô hình

Bản đầu tôi buộc cái gánh và cái xe vào `phase !== "leaving" && !c.pass`. Cả hai **không
bao giờ xuất hiện**: đo ra chú Kiệt **đi ngang** (`pass: true`) chứ không đứng quầy, 13/20
ngày đều vậy — mà đúng ra là thế, cái xe của ông đứng bên kia hẻm cả ngày, ông chỉ tạt
qua nói một câu.

Bốn lưới `X-1`…`X-4` vẫn xanh hết, vì **không lưới nào chạy một buổi bán**. `X-6` và `X-7`
có mặt để chữa đúng chỗ đó: chạy cái hẻm, rồi hỏi cái xe có lấn thật không và có mất khách
thật không.

### Một lưới cũ đỏ, và nó đỏ ĐÚNG

`p6-passersby` — *"đứng ngay cạnh ai thì F nói chuyện với người đó"* — bắt đầu đỏ. Truy ra
không phải lỗi logic (tắt riêng `KIET_STEAL` thì nó xanh lại): đợt P2-10 nâng khách tự mở
lời từ **0,6 lên 1,8 lần/ngày**, nên lưới bắt đầu rơi trúng mấy lúc có người đang chờ mình
trả lời — mà `talkCost` cho người vừa mở lời `TALK_B_ADDRESSED = −99`, thắng tuyệt đối, và
ĐÚNG như vậy. Lưới đo luật KHOẢNG CÁCH thì phải đo lúc luật kia không bật.

## 6duodecies. `RAO` — NƯỚC ĐI NGƯỢC VỚI CÁI XE CHÚ KIỆT

*"Con bán mà con hổng rao. Người ta đi ngang đâu có biết con ơi."* — cả cuộc `sau.rao`
dựng quanh một câu người chơi tự nói ra (*"Bánh mì nóng hông…"*), và tới đợt này nó không
làm một ai ngoái lại. Bà dạy xong rồi thôi.

| | hướng | cắn vào ai |
|---|---|---|
| xe chú Kiệt lấn | **−** ăn bớt người đi ngang | khách lạ |
| tiếng rao | **+** kéo họ quay đầu (`RAO_TURN = 0,45`) | người đang đi thẳng |

Và nó **không tự biến ai thành khách**: ngoái lại chỉ bật `t.glanced` ⇒ `inviteChance`
+0,24 — mở cửa cho câu mời, chứ người chơi vẫn phải mời. Tiếng rao mua sự CHÚ Ý, không
mua đơn hàng.

Đo trên một buổi bán ngày 9: rao 150 lần → **18 người ngoái lại** (0,12/lần). Thưa, và
đúng là phải thưa: phần lớn người đi ngang đã có kế hoạch ngó hay không ngó từ lúc spawn,
`RAO` chỉ với tới những ai đang đi thẳng.

### Hai lỗi của chính tôi, hai lưới bắt được

* **Cổng `never` ăn ngay lần đầu.** Khai `RAO` vào `TalkAct` xong, `npm run check` trượt
  tại đúng dòng `assertActHandled(act)` — không phải chờ tới lúc chơi mới biết act chạy
  không tải. Đây là lần đầu cái cổng dựng ở §6undecies có việc làm.
* **Tôi ghi đè mất một cờ có sẵn.** Nút rao vốn đặt `sauRaoThu`, và `chu-kiet.json` đọc nó
  (*"chú có nghe tui rao hồi sáng hông chú?"*). Tôi thay bằng một cờ tự nghĩ ra, và `F-2`
  (*"cờ đọc mà không ai đặt = một nhánh nội dung không bao giờ mở ra"*) đỏ ngay. Lưới
  `R-3` giờ ghim đúng TÊN cờ, không chỉ kiểm "có cờ nào đó".

### Và một lỗi đọc cờ sai

Bản đầu tôi lấy `pass.spot === null` làm dấu "chưa dừng ngó" — nhưng `spot` **luôn có giá
trị**: lúc spawn nó mặc định là chính lối ra (`plan.spot ?? plan.to`). Nên không ai lọt
qua, và `R-1` báo *"cả buổi không có lúc nào có người đi thẳng ngang qua"*. Đúng cặp cờ là
cặp mà `snapshot.glanced` dùng: `stay > 0 && until >= 0` — cùng một cái bẫy đã bắt ở
§6bis với `t.glanced`, chỉ khác chỗ.

## 6terdecies. ÁO MƯA, VÀ VẼ BẰNG CODE ĐỂ NHÌN THẤY CÁCH CHƠI

### `LEND_ITEM` / `CLEAR_DEBT`

Kho **hai cái** — con số do chính lời thoại khai (*"Em có hai cái."*). Một câu đã nói ra
kho của nó thì đừng để code khai một con số khác.

Ghi vào sổ **MÙA** (`RelState.borrowed`), không sổ lượt ghé: cho mượn hôm nay thì mai họ
mới mang trả, món nợ đó phải sống qua đêm. Chỉ người CÓ TÊN — `memKey` của khách lạ dùng
chung cho tám dáng người cả mùa.

Và tôi viết **chiều còn thiếu**: `dung.traao` / `lan.traao`, khoá `when.world: m.borrowing`
nên chỉ mở khi người ta THẬT SỰ đang giữ đồ của mình. *Cho mượn mà không có đường mang
trả thì nó là `FREE_LOAF` đội lốt.*

### Vẽ bằng code — và nó lộ ra hai chuyện

Chủ dự án: *"vẽ để tôi biết vị trí và hình dung gameplay, thì tôi mới kêu artist vẽ bản
chuẩn"*. Nên ba vật được vẽ bằng `Graphics`, theo đúng bút pháp `art/props.ts` sẵn có, và
chúng là **sprite động** bám theo trạng thái `Service` chứ không phải ô bản đồ — vì chỗ
của chúng LÀ một nước đi của người chơi.

Nhìn lên màn hình xong mới thấy hai chuyện mà đọc code không thấy:

* **Bộ bàn ghế bị vẽ hai lần.** Bản đồ ĐÃ CÓ bàn (`b` x14) và hai ghế (`s` x16–17) ở hàng
  y11 — đúng điều bảng nợ nói: *"`GHE_BAN` hiện CHỈ LÀ HÌNH VẼ"*. Tranh có sẵn, thiếu
  hành vi. Nên `SEAT_SPOT` dời về ngay trước bộ đó, và bỏ hẳn phần vẽ thêm.
* **`drawPendingDeeds()` bị kẹt sau một `return` sớm** — lỗi CÓ SẴN. Nó nằm trong
  `drawPendingTalk()`, mà hàm đó thoát ngay khi không có ai đang chờ mình trả lời. Nên
  mấy chấm "lời hứa còn nợ" chỉ hiện vào những lúc tình cờ có một lời mời chuyện đang
  treo — tức gần như không bao giờ. Mà cả cơ chế lời hứa (P2-07 §4bis) dựa vào cái chấm
  đó để người chơi BIẾT mình đang nợ gì; không thấy chấm thì phạt vì quên là phạt TRÍ
  NHỚ, đúng thứ T5 cấm. Lộ ra vì ba vật động gắn cùng chỗ và không bao giờ hiện.

Bản vẽ hiện tại là **bản để đo**, không phải bản phát hành: hoạ sĩ thay texture sau, toạ
độ và kích thước giữ nguyên.

## 6quaterdecies. CHÍN LỖI CHỦ DỰ ÁN BẮT ĐƯỢC KHI CHƠI — VÀ CUỘC RÀ CẢ KHO SAU ĐÓ

Đợt này không bắt đầu từ kế hoạch. Nó bắt đầu từ một danh sách chủ dự án gõ ra sau khi
ngồi chơi, và câu cuối của danh sách đó là câu phải đọc trước khi đọc phần còn lại:

> *"Nhưng bạn nói đã xong và tôi test thấy bị như vậy nên hơi thất vọng vì lỗi quá nhiều
> và bạn làm khong kĩ."*

Chín lỗi, tất cả đều ở **người đi ngang** — phần tôi đã khai là XONG.

| # | Bắt được | Thật ra là gì | Sửa |
|---|---|---|---|
| 1 | *"bảo em là ổ đầy đủ, npc gật 'ừ đầy đủ khỏi hỏi' mà món vẫn là món cũ"* | câu đó mang `PROMISE { item }` — hứa THÊM MỘT MÓN, không đổi ĐƠN. Giá đi theo `tierOf(order.intent)` nên có đường làm ổ đầy đủ mà thu tiền ổ thường | act `ORDER_CHANGE` đổi `c.order.intent` thật, giá chạy theo. Có roll từ chối (`0,72 − vội×0,55 + 0,2×thân thiện`) đúng ý *"làm đầy đủ thì lâu lâu vẫn từ chối chứ nhỉ"* |
| 2 | *"hỏi người ta chị mua đồ ăn sáng cho nhà hả, rồi order 4 người, đọc món các kiểu, xong ngta đi mất tiêu"* | ba dòng trong `duong.nhinra` cho người đi ngang "nhận lời mua" bằng một `reply` trơn — không `act`, nên không có đơn nào sinh ra | đổi thành `INVITE` thật, có `yes`/`no`, kết cục do `inviteChance` quyết |
| 3 | *"bắt chuyện với npc qua đường mà bảo bữa nay hết sớm rồi anh, xong ngta trả lời ừ mai tui qua. Vô lý quá. Họ là người qua đường mà"* | `duong.cuoibuoi` hứa chuyện ngày mai thay một người KHÔNG CÓ trí nhớ mùa | viết lại hai nút; thêm lưới `tools/audit-loi.ts` lớp M3 quét cả kho |
| 4 | *"kêu người ta đứng đây cho mát mà họ chả thèm chạy lại chỗ cái ô"* | bước đi của người đi ngang bỏ qua `pass.spot` mới | sửa bước đi: `c.now < p.until` thì đi TỚI chỗ mới rồi mới đứng |
| 5 | *"bỏ thời gian chờ phản hồi đổi thành 300ms đi"* | `REPLY_DELAY_SEC` 1,2 s | → 0,3 s |
| 6 | *"bắt chuyện với ngta mà user đi chỗ khác rồi ngta vẫn phản hồi, trong khi 2 người đứng cực kì xa"* | phiên thoại không có đường tự cắt theo khoảng cách | `walkedAwayMidTalk()` — xa quá `TALK_REACH + 1,5` ô là phiên đứt |
| 7 | *"2 npc nói chuyện với nhau ít nhất cũng phải đứng lại nói. đi ngang qua nói thì sao đúng logic"* | chào thì đi chậm lại, mà KỂ CHUYỆN cũng đi chậm lại | `CHAT_STOP_SEC` — ném tin đồn thì ghim `pass.spot` đứng hẳn; chào suông giữ nguyên |
| 8 | *"thà chào nhau còn được"* | — | giữ nguyên mức chào một câu |
| 9 | *"bổ sung thêm npc lâu lâu đứng tám chuyện drama với nhau. NPC này user không cần tương tác"* | chưa có | `content/lines/tam.json` — 8 cảnh, 32 câu, luân phiên A→B→A→B; `chatScene()` ghim cả hai đứng im |

### Cảnh tám chuyện — ba chỗ phải canh

Cái hẻm trước đợt này chỉ có hai mức: ném nhau một câu chào rồi đi, hoặc đứng lại đúng
một câu tin đồn. Mức thứ ba là **đứng tám**, và nó phải chịu ba cái gác:

* **Phải HIẾM.** `CHAT_SCENE_CHANCE = 0,18` trên số lần hai người DỪNG chào nhau — đo
  được **một cảnh một buổi** (`tools/probe-tam.ts`: 101 lần gặp mặt → 22 lần chào → 6
  cảnh trên sáu buổi). Dày hơn thì hẻm thành cái chợ đứng tám.
* **Chỉ nổ lúc hẻm đang im** (`queue.length ≤ 1`). Câu nền mang `pri 18`, quá
  `QUEUE_EXPIRE_SEC` là BỊ BỎ — nổ giữa lúc đông thì hai người đứng chôn chân mà không
  ai nói gì, tệ hơn là không có cảnh.
* **Phải đứng GẦN nhau.** Cái gác này nằm trong chính `chatScene()`, không trông vào chỗ
  gọi — chơi thử trên trình duyệt ngày 8 thấy hai bong bóng nổ ở hai đầu hẻm cách nhau
  **mười bốn ô**, nhìn như hai người hét qua đường. Lưới `TAM-4b`.

Không cảnh nào nói về cái xe bánh mì (lưới `TAM-2`): người ta không đứng giữa đường nói
chuyện của mình, và người chơi KHÔNG cần xen vào.

### Rà cả kho — vì chủ dự án nói đúng chỗ đau

> *"rà soát lại. cái lỗi này tôi chỉ mới test của người qua đường thôi. không biết người
> mua có bị thế không."*

Đó là câu phải trả lời bằng máy. `tools/audit-loi.ts` quét **2.015 nút / 15 kho**, bốn
lớp, mỗi lớp dựng từ một lỗi CÓ THẬT ở trên:

| Lớp | Nghi | Thật | Còn lại |
|---|---|---|---|
| M1 hứa suông — nhận lời mà không act | 81 → 12 sau khi siết regex | **2** | 10 là kể chuyện, không phải giao dịch |
| M2 mời suông — mời dời chỗ mà không ai dời | 19 → 4 | **0** | 4 là câu nói đá, không phải lời mời |
| M3 sai thân phận — người đi ngang nói chuyện mùa vụ | 1 | **1** | 0 |
| M4 hẹn mai mà không ghi gì | 18 → 17 | **5** | 4 là người ngày nào cũng tới |

Hai lỗi M1 thật, và cả hai đều đúng loại chủ dự án đã bắt:

* `bao.moiloi · 1.2` — anh Bảo nói lắp, cuối cùng cũng gọi được món: *"Dạ… cho em ổ đầy
  đủ. Dạ, khỏi ớt cô."* Đơn KHÔNG đổi. Giờ là `ORDER_CHANGE` hai thứ một câu
  (`["dayDu","khongOt"]`) với `aiXin: "HO"` — **họ tự xin thì không roll từ chối**, không
  ai xin đổi món rồi tự từ chối mình.
* `lan.mua · 0.0.0` — *"Chị cứ lấy đi chị. Mai chị trả em cũng được."* Câu y hệt ở
  `lan.dungnho` có `CREDIT_LOAF`; câu này KHÔNG. Tức là cho chịu mà sổ không ghi.

### `~cờ` — lời hứa phải qua đêm thật

Năm chỗ hẹn hôm sau mà không ghi lại gì. Ghi bằng cờ chuyện thì chưa đủ: `need: "cờ"`
đúng NGAY trong buổi, nên người ta vừa hứa xong là cuộc trả bài mở ra liền — đúng cái vô
lý số 3 ở trên, chỉ đổi chỗ.

Nên thêm tiền tố `~`: `~cờ` chỉ đúng khi cờ được đặt từ một NGÀY TRƯỚC. Cờ vốn đã lưu
ngày (`story.flags[cờ] = day`) nên không cần thêm gì vào save. Ba cuộc trả bài mới, mỗi
cuộc là một lời hứa được giữ:

| Hứa | Trả bài |
|---|---|
| `dung.ca · 0.0.2` *"Mai anh chụp hình anh đưa em coi"* | `dung.anhca` — *"Hình con cá nè. Anh hứa anh chụp mà."* |
| `sau.xetai · 0.2` *"Mai tui đem cái bằng ra tui cho con coi"* | `sau.bang` — *"Cái bằng nè. Tui nói tui có mà con hổng tin."* |
| `su.buon · 2` *"Vậy mai con đem máy, con quay con chim"* | `su.chim` — *"Con quay con chim rồi nè cô."* |

Lưới `HM-1`…`HM-4`: có cuộc trả bài · hứa hôm nay thì hôm nay CHƯA mở · qua đêm thì MỞ ·
cờ trơn vẫn ăn ngay (không đổi luật cũ sau lưng) · và một lượt chạy THẬT kiểm rằng
`applyTalkOption` ghi SỐ NGÀY chứ không ghi `true`.

### Số đo đợt này

| | |
|---|---|
| Lưới | 541 → **543**, xanh hết |
| `validate:talks` · `lint:lines` | sạch · 0 ERROR |
| Cảnh tám chuyện | ~1 buổi/cảnh (6 cảnh / 6 buổi) |
| Rà kho | 2.015 nút · 8 lỗi thật · 8 đã sửa |
| Chơi thử trình duyệt | ngày 6 đủ buổi: 18 lượt chào, 1 cảnh tám, **0 lỗi console** |

Một chỗ phải nói thẳng: lỗi số 3 tôi đã sửa MỘT nút rồi khai xong, trong khi
`duong.cuoibuoi` có HAI nút cùng hứa chuyện ngày mai. Nút thứ hai nằm đó tới khi
`audit-loi.ts` quét mới lòi ra. Sửa bằng tay rồi khai xong là cách làm đã hỏng ba lần
trong tài liệu này; cái máy dò phải chạy TRƯỚC khi khai.

## 6quindecies. LẦN THỨ BA CÙNG MỘT LỖI — VÀ CÁI LƯỚI IM LẶNG VÌ MỘT DẤU `\b`

Chủ dự án, ngay sau đợt trên:

> *"Có chỗ nữa là bữa nay con làm mẻ ngon lắm. ngon thiệt ăn rồi biết. ờ cho một ổ. mà
> npc đi mất chứ không mua. vẫn là free word."*

`any.banh · 2.1`. Lần thứ ba cùng một lớp lỗi, và lần này đau hơn hai lần trước vì tôi
VỪA viết xong một cái máy dò cho đúng lớp lỗi đó — `tools/audit-loi.ts` — và nó im.

### Vì sao máy dò im: `\b` sau một chữ có dấu

Mẫu M1 viết `(ổ|cái)\b`. `\b` của JS tính theo bảng ASCII: `cái\b` khớp (chữ `i` là ký tự
từ), còn `ổ\b` **không bao giờ khớp** — `ổ` không phải ký tự từ ASCII nên không có ranh
giới nào ở đó. Cái lưới vẫn in ra mười kết quả trông rất đúng, toàn khớp qua nhánh có
`cái`, và bỏ qua sạch nhóm câu quan trọng nhất: mọi câu có chữ **ổ**.

Sửa `(?![\p{L}])` với cờ `u` thì cùng một kho nhảy từ **10 lên 24** chỗ. Mười bốn chỗ đã
nằm đó suốt, bị một ký tự nuốt mất.

Đây là **lần thứ hai** cái bẫy này cắn trong cùng tài liệu — lần đầu `dạ\b` khớp "Dạo"
trong `validate-talks.ts`. Ghi thẳng vào chỗ khai mẫu, cả hai file.

### Lỗi thật trong 24 chỗ

Rà tay 24 chỗ: 23 là khách ĐÃ đứng mua (nói "lấy một ổ" lúc đang xếp hàng thì không mở ra
giao dịch nào mới — họ mua sẵn rồi). Đúng **một** chỗ thật, và nó đúng chỗ chủ dự án chỉ:

`any.json` là kho **dùng chung**, nghĩa là một người ĐANG ĐI NGANG cũng nghe được. Nút đó
không có act nào, nên người đi ngang gật *"Ờ thì… cho một ổ coi sao"* rồi đi tiếp —
nguyên văn chủ dự án gọi là **free word**.

Tách đôi theo `t.passing`:

* `t.passing` → `INVITE`, kết cục do `inviteChance` quyết, có câu từ chối riêng.
* `!t.passing` → giữ nguyên câu cũ. Với người đã đứng mua thì câu đó vô hại.

Đo trên 282 người đi ngang thật: **7% ghé vô** — đúng dải của 24 lời mời VIẾT SẴN trong
`qua-duong.json` (5–8%, `tools/probe-anybanh.ts`). Tức nút mới không phải nút yếu.

### T017 — để không có lần thứ tư

`qua-duong.json` thì sạch: cả 24 lời mời mua đều có `INVITE` sẵn. Lỗ duy nhất là kho
`ANY`, nơi người viết dễ quên rằng người nghe có thể đang đi ngang. Nên luật thành máy:

> Trong kho `ANY` và `QUA_DUONG`, một nút có câu đáp CHỐT VỤ MUA phải HOẶC mang `INVITE`,
> HOẶC khoá `!t.passing`.

Hai chỗ phải cẩn thận khi viết lưới này, và cả hai đều lộ ra lúc chạy:

* **Mua ở CHỖ KHÁC không phải vụ mua của mình.** `duong.nhinra` có con bé nói *"Tới trường
  {self} mua ổ bánh ở cổng"* — bắt oan. Thêm mẫu loại trừ `ở cổng|bên kia|chỗ khác|…`.
* **`A-6` cấm `INVITE` ngoài kho ẩn danh**, vì `invite()` chỉ chạy cho người đang đi
  ngang; gắn nhầm là một act IM LẶNG. Nới đúng một cửa: kho `ANY` được mời **khi nút khoá
  `t.passing`** — chính là điều kiện `invite()` đòi. Và `invite()` không nuốt nữa: gọi
  nhầm người thì bắn `dialog:silent / INVITE_SAI_NGUOI`.

Lưới sống `tests/p2-validator-song.test.ts` thêm một ca riêng cho T017 (phá
`qua-duong.json` bằng cách gỡ `INVITE` khỏi mọi lời mời) — vì một validator chết thì
không kêu.

### Số đo

| | |
|---|---|
| Lưới | 543 → **547**, xanh hết |
| `validate:talks` | 17 cổng (T001–T017), sạch |
| Máy dò M1 sau khi sửa `\b` | 10 → **24** chỗ · 1 lỗi thật |
| Lời mời mới `any.banh` | 7% ghé vô / 282 người — đúng dải 5–8% của lời mời viết sẵn |

Chỗ phải nói thẳng, lần thứ hai trong hai đợt liền: **cái máy dò sai thì tệ hơn không có
máy dò**, vì nó cấp cho tôi một tờ giấy chứng nhận sạch. Đợt trước tôi khai "rà 2.015 nút,
8 lỗi thật, 8 đã sửa" — con số đúng, kết luận sai, vì mẫu quét đã mù từ đầu. Từ đợt này
mỗi mẫu regex đụng chữ có dấu phải có một ca thử ĐỨNG CẠNH nó.

## 6sedecies. TRẢ NỐT BẢNG NỢ ACT — VÀ HAI MÓN ĐỒ VẼ SAI CHỖ

Chủ dự án hỏi ba câu: *"có làm cái xe, dù, rồi cho các item vào map không? với lại các
act đã làm hết chưa? với lại phase đó còn task nào nữa không"*. Đi kiểm từng câu bằng
máy, và câu thứ nhất lòi ra một lỗi không ai kêu.

### Hai món đồ nghề vẽ cách chỗ nó phục vụ 3,5 và 11,3 ô

Cái xe chú Kiệt và cái gánh bà Sáu thì đúng chỗ — chúng là **sprite động** đọc thẳng
`CART_*` / `GANH_*`. Nhưng hai món ĐỒ NGHỀ thì vẽ bằng số viết cứng, và chúng đã trôi:

| Món | Vẽ ở | Chỗ hệ thống gửi người tới | Lệch |
|---|---|---|---|
| `DU_CHE` | (12,6 · 5,6) — **sau quầy** | `SHADE_SPOT` (15,0 · 8,2) | 3,5 ô |
| `GHE_BAN` | (5,5 · 8,4) — **đầu hẻm** | `SEAT_SPOT` (16,6 · 10,4) | 11,3 ô |

Nghĩa là mười câu *"đứng dưới dù cho mát"* đẩy người ta ra một khoảng vỉa hè **trống
trơn**, và mười bảy câu mời ngồi đặt người ta cách bộ ghế vừa mua 320 nghìn mười một ô.
Đúng cái chủ dự án thấy khi chơi và tôi đã sửa NỬA: *"họ cũng chả thèm chạy lại chỗ cái ô
để đứng hay đang đứng trong bóng mát"* — đợt trước tôi sửa bước đi, mà cái ô thì vẫn ở
chỗ khác, nên sửa xong vẫn không thấy gì.

Sửa: cả hai lấy thẳng toạ độ từ `world/map`, không viết số nữa. Lưới `VD-1`/`VD-2` đọc
CHÍNH mã vẽ và bắt lỗi nếu ai viết số cứng lại — vì viết số cứng là cách nó trôi lần đầu.

### Hai act cuối

`TAKE_CASH` — chiều VÀO của `PAY`, năm nút đòi. Hai chỗ nó đổi hẳn ý nghĩa một nước đi:

* `su.toan` — bé Su thối dư hai ngàn, mình *"Ừ. Cô cầm lại."* Két không nhích một đồng.
* `phuc.quen · 1.1` — *"Dạ hai chục thầy."* là một câu **nói dối**: thầy trả rồi mà mình
  bảo chưa. CANON §8 đòi ăn gian phải có LỢI THẬT thì nó mới là một lựa chọn. Trước đợt
  này nó chỉ mất `rel −3` và không được gì — một nút không ai bấm, tức một nút chết.

⚠️ Vào `floatLeft` (tiền lẻ trong ống), KHÔNG vào doanh thu — lưới `HA-3` canh đúng chỗ
đó, vì nhập nhằng thì trang tối nói dối người chơi.

`OVERHEARD_BY` — *"Bà rảnh ghê, lo chuyện người ta."* nói ngay giữa hẻm **bà Sáu đang gánh
đi qua**. Trước đợt này chỉ mất `rel −3` với anh Dũng; bà Sáu không biết gì. Giờ cái giá
nằm đúng chỗ: vết `RUDE_TO_THEM` vào sổ CỦA BÀ, cộng `witness()` — bà không chỉ giận, bà
có một niềm tin hạng nhất để **kể lại**. Chỉ ăn trong `OVERHEAR_REACH` 4,5 ô, và bà có
đứng đó hay không thì người chơi NHÌN THẤY trước khi bấm (T5) — rủi ro đọc được, không
phải cái bẫy.

### Trả lời câu thứ ba: còn gì trong phase này

| Món | Tình trạng |
|---|---|
| 26 act | khai đủ · 26/26 có `case` · 25/26 có nội dung gọi (`LEAVE_SHADE` tự chạy khi hết hạn) |
| 15 kho thoại | rà xong cả 15 |
| Vật trong map | xe · gánh · dù · ghế · áo mưa — đủ, và giờ đúng chỗ |
| 17 cổng validator | T001–T017 sạch |
| Lưới | 554, xanh hết |

Còn lại là **tune số**, không phải việc thiếu: `ATT_K` / `ATT_FLOOR` /
`DRIVE_DECAY_PER_MIN` (`sim/drives.ts`) và `OVEN_SMELL_SEC` là số bản dựng đặt, phải chờ
telemetry người thật. Và vẽ: bé Su giơ điện thoại lúc `FILM`, dáng người NGỒI thấy được —
hai thứ art, không phải thoại.

## 6septdecies. TUNE SỐ — VÀ BA NÚM HOÁ RA LÀ MÃ CHẾT

Chủ dự án: *"xử lý tune số và vẽ đi"*. `P2-09` §5 ghi ba số của `sim/drives.ts` là "bản
dựng đặt, chưa tune", `P2-10` §6 để lại chờ telemetry người thật. Chờ mãi thì không bao
giờ tune; cái đo được NGAY là hành vi của chính hệ. Dựng `tools/tune-drives.ts` quét từng
núm, giữ hai núm kia.

Kết quả đợt quét đầu — **cả ba núm đổi 8 lần mà KHÔNG đổi một con số nào**:

```
K=250 … 2000          hệt nhau
FLOOR=3 … 22          hệt nhau
DECAY_PER_MIN=0,5 … 8 hệt nhau
```

Đó không phải "đã tune xong", đó là **ba núm không nối vào gì**. Đào từng cái:

### `ATT_K` — vì không điểm nào ÂM nên cái sàn chưa từng cắt

`K` chỉ là hệ số thang; `pickWeighted` chuẩn hoá lại nên nhân bao nhiêu cũng ra cùng lựa
chọn. Chỗ duy nhất nó nói chuyện với một mốc TUYỆT ĐỐI là `TALK_SCORE_FLOOR = −5`.
`tools/probe-diem.ts` đo phân bố điểm: **thấp nhất 0,0** — không một cuộc nào từng xuống
dưới 0, nói gì tới −5. Cái sàn là mã chết, nên `K` cũng chết theo.

Vì sao không bao giờ âm: `scoreSatisfies` chỉ ra âm khi một cuộc làm drive TỆ ĐI, mà
`satisfiesOf` chưa bao giờ sinh ra khoản tệ đi nào.

### Lỗi thật mà cuộc quét lôi ra: luật khai mà không ai giữ

`PRACTICE_PUSH.DOI_BANH` đẩy `DUOC_PHUC_VU` lên 85, kèm lời khai *"không chuyện tán gẫu
nào thắng nổi con số đó"*. Đo ra thì **38% số lần bấm bắt chuyện lúc khách đang đợi bánh
vẫn ra tán gẫu**.

Lý do là một dòng trong `scoreSatisfies`: nó chỉ cộng trên những drive mà cuộc đó ĐỘNG
TỚI. Cuộc tán gẫu không đụng `DUOC_PHUC_VU`, nên con số 85 **không chạm được vào nó**.
Đẩy một drive lên trời không phạt được cái chuyện phớt lờ nó.

Sửa đúng tầng của hệ, không bằng một `if`: cho cuộc KHÔNG dính mua bán một khoản **âm**
trên chính `DUOC_PHUC_VU` — bị bắt chuyện trong lúc chờ làm cái chờ nặng thêm. Hàm
`A(x) = K/x` lo phần còn lại: lúc drive thấp khoản âm gần như không thấy, lúc nó 85 thì
nó đè bẹp. Trị số chọn bằng quét, không bằng cảm giác:

| `CHO_PHIEN` | đợi bánh | gọi món | xếp hàng |
|---|---|---|---|
| 0 (trước) | **38%** | 35% | 28% |
| 3 | 0% | 21% | 21% |
| **6 ←** | **0%** | **6%** | **17%** |
| 10 | 0% | 0% | 7% |
| 24 | 0% | 0% | 0% |

6 là chỗ duy nhất giữ đúng thứ tự thiết kế đòi — đợi bánh < gọi món < xếp hàng — mà không
giết cái cuối. **Đứng xếp hàng LÀ lúc tán gẫu được.**

Và vì điểm giờ xuống âm thật, `K` sống lại: quét lại ra `K=250/500` → sàn cắt 0%,
`K=1000` → 7%. Giữ 1000, giờ có lý do đo được.

### `DRIVE_DECAY_PER_MIN` — không có gì để suy giảm

`bump()` của `sim/drives.ts` **không một ai gọi**. `c.drives` nằm y nguyên ở `driveBase`
suốt buổi, nên `decayDrives` kéo một thứ chưa bao giờ xê dịch. Nghe một người kể chuyện
xong, cái muốn kể của họ y như lúc chưa kể — tức nửa sau của mô hình Zubek chưa bao giờ
chạy.

Nối lại: `markTalkUsed` trừ `satisfiesOf(t)` vào `c.drives`. Trải điểm đo được tăng
1,58 → 1,77. Trị số giữ 2, chọn bằng SỐ HỌC chứ không bằng quét: một cuộc `FULL` thoả
`KE_CHUYEN` chừng 48 điểm, ở 2 điểm/phút thì về nền sau ~24 phút game — dài hơn phần lớn
một lượt ghé, nên "vừa kể xong" kéo hết lượt đó. Lên 8 thì chưa đầy 6 phút: cùng một
người kể lại cùng kiểu chuyện ngay trong một lượt.

### `ATT_FLOOR` và `OVEN_SMELL_SEC` — nói thẳng là KHÔNG tune được

* `ATT_FLOOR = 8` chỉ ăn khi một drive vượt 92. Mức cao nhất `PRACTICE_PUSH` đẩy tới là
  85, nền cao nhất ~55. **Không bao giờ ăn** — đây là chứng minh, không phải quan sát.
  Giữ lại như cái chặn chia-cho-0, và ghi thẳng là *không phải một núm để vặn*.
* `OVEN_SMELL_SEC = 90` nằm sau `ovenBusy ||` trong `get ovenHot`, nên khi lò đang nhen
  thì 90 giây kia không có ý nghĩa gì. Đo ra `w.ovenHot` **100%** ở một bộ chạy và **0%**
  ở bộ khác — khác nhau ở chỗ bot có nhen lò hay không, không ở con số. Hai nút nội dung
  khoá vào nó coi như không khoá gì. Đây là việc của **khoá nội dung**, không phải của
  con số; ghi vào §6 chứ không vặn bừa.

## 6octodecies. VẼ NỐT HAI MÓN — NGỒI, VÀ CÁI MÁY ĐANG QUAY

Hai món art cuối, và cả hai không phải chuyện thẩm mỹ:

* **`THEY_SIT`** làm kiên nhẫn trôi chậm 45% từ đợt `GHE_BAN`, nhưng người ngồi và người
  đứng vẽ **y hệt nhau** — tức bỏ 320 nghìn mua bộ ghế mà màn hình không đổi một pixel.
* **`FILM`** đặt `c.filming`, và clip hỏng nếu quầy dơ lúc máy chạy. Không vẽ gì thì
  người chơi KHÔNG BIẾT máy đang chạy, nên cái giá đó là một **cái bẫy** chứ không phải
  một rủi ro đọc được trước khi hành động (T5).

Không nướng sprite mới, đúng lối "một bộ target cho lò xo, 0 sprite mới" của `P2-02` §3.2:
ngồi thì hạ thân `SIT_DROP` 9 px **và** nén chiều cao 12% (chân gập) qua một lò xo riêng,
cộng một cái ghế nhựa bám theo người. Quay thì một cái điện thoại giơ lên vai, màn hình
sáng, chấm đỏ nhấp nháy, một nét tay nối lên.

Đo trên trình duyệt, ghim toạ độ để phép đo không lẫn với bước đi: ngồi hạ **11,4 px** và
nén đúng **12,0%**. Lưới `VE-1`…`VE-4` đọc thẳng mã vẽ — không dựng được Phaser trong
`node:test`, mà cái cần canh là "có nhánh vẽ cho hai trạng thái đó hay không".

### Số đo

| | |
|---|---|
| Lưới | 556 → **560**, xanh hết |
| Tán gẫu lúc khách đợi bánh | 38% → **0%** |
| Tán gẫu lúc xếp hàng | 28% → 17% (còn sống) |
| Trải điểm chọn chuyện | 1,58 → **1,77** |
| Núm còn là mã chết | `ATT_FLOOR` (có chứng minh) · `OVEN_SMELL_SEC` (lỗi khoá nội dung) |

## 6novodecies. `w.ovenHot` — VÀ BA LỖI TRONG CHÍNH CÁI MÁY ĐO

Đợt trước tôi ghi `OVEN_SMELL_SEC` là "không tune được" rồi để đó. Quay lại làm nốt, và
nó kéo theo ba lỗi nằm trong **chính mấy cái máy đo** tôi vẫn dựa vào.

### Mùi bánh là một KHOẢNH KHẮC, không phải một trạng thái

`get ovenHot()` là `ovenBusy || (vừa ra mẻ trong OVEN_SMELL_SEC)`. Đang bán thì lò gần như
lúc nào cũng nhen, nên vế đầu luôn đúng và 90 giây kia **nằm sau một `||` không bao giờ
sai**. Hai cuộc khoá vào nó — `duong.mui` (*"{call} ngửi thấy mùi than hông?"*) và
`walkin.meraLo` (*"mẻ mới ra lò"*) — vì thế chạy cả lúc mẻ gần nhất ra cách đây nửa tiếng.

Tách `w.meVuaRa` = CHỈ vế thứ hai. `ovenHot` giữ nguyên cho chỗ khác, và bảng đen ghi
thẳng *"KHÔNG dùng nó để khoá câu nói về MÙI"*. Lưới `MB-1`…`MB-3` ghim đúng ranh giới:
lò đang nhen mà chưa ra mẻ ⇒ `ovenHot` đúng, `meVuaRa` SAI.

### Ba lỗi trong máy đo — và cả ba đều là "đo ngắn hơn cái được đo"

Đây là phần đáng ghi hơn cả cái fact.

**1. Ép tay rồi đọc như số thật.** `probe-facts.ts` đặt `svc.ovenBusy = true` ở đầu mỗi
buổi để bot có hàng mà bán. Hệ quả: `w.ovenHot` in ra **100%** — con số của CÁI ÉP, không
phải của ván chơi. Đo lại bằng tay: bot `greedy` **không nhen lò lần nào** trong 120.000
frame, tức mọi fact dính cái lò nó không chạm tới được. Giờ khối ép tay có ghi chú, và
dòng cảnh báo đổi thành "KHÔNG BAO GIỜ ĐÚNG (bot này)".

**2. Mười bảy khoá đòi tham số bị hỏi trần.** `w.queue`, `t.tier`, `m.visits`… hỏi không
có tham số thì bao giờ cũng sai, và cả mười bảy nằm trong cột "KHÔNG BAO GIỜ ĐÚNG". Mười
bảy dòng nhiễu lẫn với mấy dòng nói thật — đúng cái cách một bảng đo biến thành tờ giấy
chứng nhận sạch. Giờ chúng đi riêng một mục.

**3. Phép đo dừng trước khi cái cần đo xảy ra.** Vòng lặp chạy 9.000 frame = tới **8h42**,
mà khung `TRUA` bắt đầu **9h30**. Nên `w.band(TRUA)` in ra *"không bao giờ đúng"* trong
khi nó đúng suốt khúc 9h30–11h00 của **mọi** buổi. Chạy hết buổi thì nó là **92%**.

Và vì lỗi thứ ba, bảng tần suất cũ lệch hẳn ở trục thời gian: `w.band(SOM)` từng ghi 57%,
đo đủ buổi còn **4%**. Thêm một ghi chú vào đầu file, vì con số đúng vẫn dễ đọc sai: bảng
này đo **một khoảnh khắc bất kỳ**, không phải **một cuộc bất kỳ** — khúc vắng khách kéo
dài ăn hết trọng số.

### Số đo

| | |
|---|---|
| Lưới | 560 → **563** |
| `w.ovenHot` lúc mở cuộc | 100% (ép tay) → tách ra `w.meVuaRa`, khoá đúng cái nó nói |
| `w.band(TRUA)` | "không bao giờ đúng" → **92%** |
| `w.band(SOM)` | 57% → **4%** (số cũ đo trên buổi bị cắt) |
| Khoá đòi tham số bị tính nhầm | 17 → 0 |

Ba đợt liền, ba lần cùng một hình dạng: `\b` sau chữ có dấu · vòng đo dừng sớm · giá trị
ép tay đọc thành số thật. Không cái nào làm game crash, cả ba đều làm tôi khai sai. Quy
tắc rút ra cho đợt sau: **mỗi phép đo phải nói được nó KHÔNG đo được cái gì**, và câu đó
phải nằm ngay cạnh con số.

## 6vicies. BOT BIẾT RÓT TRÀ, MỜI NGỒI, MỜI GHÉ

Đợt trước tôi khai mấy fact `v.gaveTea` · `t.sitting` · `m.borrowing` đo ra 0% *"vì bot
`greedy` chỉ biết gói bánh"*. Chủ dự án trả lời đúng một câu: *"viết bot biết rót trà, mời
ngồi, cho mượn áo mưa đi"* — tức là **lời bào chữa đó chỉ thành sự thật khi có cái máy
chứng minh nó**.

### Bot `social`

Đi qua ĐÚNG hai hàm `StallScene` gọi: `openTalk()` → `chooseTalk(i)`. Không gọi tắt
`service.serveTea()` — gọi tắt là đo cái hàm chứ không đo cái game, đúng lỗi chủ dự án bắt
ở đợt đầu (*"bạn có thật sự test như player không hay gọi fake code thế?"*). Lưới `BX-3`
giữ ranh giới đó bằng cách đọc chính thân hàm.

Để bấm trúng nhánh, `Service` thêm một cửa đọc: `optionActs()` trả về act của từng lựa
chọn đang hiện **và** act nằm trong nhánh con của nó. ⚠️ `TalkView.options` vẫn chỉ có
`say` + `tone` — bày tên act ra màn hình là vi phạm T5 theo chiều ngược (nói trước kết cục);
`optionActs()` chỉ dành cho bot và công cụ đo.

Ba chỗ phải sửa mới chạy được, và cả ba đều là bài học cũ:

* **Danh sách săn phải XOAY VÒNG.** Nhận "act nào cũng được" thì bot bấm cái đầu tiên nó
  gặp ⇒ chỉ 10/27 act chạy. Mỗi cuộc săn một act thì act hiếm mới tới lượt.
* **Bot phải BƯỚC RA ĐƯỜNG.** `talkTarget()` không có `playerAt` thì chỉ nhắm được người
  đầu quầy, nên bot không bao giờ nói chuyện với người đi ngang — `INVITE` (25 nhắc) và
  `WALK_ON` (37 nhắc) đo ra **0 lần**, trông y như nội dung chết. Đặt `playerAt` đúng như
  `StallScene` làm lúc người chơi ra lề.
* **Người đi ngang MANG `phase: "leaving"` suốt** — họ đang đi qua mà. Lọc
  `phase !== "leaving"` cho "gọn" là lọc sạch đúng nhóm mình cần, và nó im lặng: `thử 0`.

### Trước / sau

| | bot `greedy` | bot `social` |
|---|---|---|
| act chạy được | 0 (nó không nói chuyện) | **17 / 27** |
| `w.seatFree` | 0% | **85%** |
| `p.onStreet` | 0% | **43%** |
| `v.gaveTea` | 0% | **16%** |
| `INVITE` / `WALK_ON` | 0 lần | **332 / 149** lần (30 buổi) |
| `OFFER_TEA` · `THEY_SIT` · `FILM` · `CARRY_GANH` · `MOVE_CART` | 0 lần | đều **> 0** |

### Và cái bảng phải tự khai nó không đo được gì

`tools/probe-social.ts` in kèm điều kiện của ván chơi: thời tiết gặp phải, đồ nghề mua
được, và dòng nhắc rằng act dính một NGƯỜI cụ thể (`RAO`, `MOVE_GANH`, `BARTER` của bà Sáu;
`OVERHEARD_BY` của anh Dũng) chỉ chạy khi đúng người đó có mặt.

Bản đầu của chính dòng đó **in sai**: nó so thời tiết với chuỗi `"MUA"`, mà mưa có HAI tên
(`MUA_RAO`, `MUA_DAM`), nên nó báo *"không có ngày mưa"* giữa một mùa có mưa — và lời báo
đó sẽ đổ tội cho đúng chỗ không có tội. Sửa thành gọi `isRain()`. Lần thứ tư cùng một hình
dạng trong tài liệu này, và lần này tôi bắt được nó trước khi khai ra.

### Mười act còn đứng yên — và giờ "đứng yên" mới có nghĩa

`BARTER` · `CLEAR_DEBT` · `DISCOUNT` · `GIVE_BREAD` · `LEND_ITEM` · `MOVE_GANH` ·
`OVERHEARD_BY` · `PAY` · `RAO` · `TAKE_CASH`. Mùa 30 buổi NÀY có mưa, có ghế, có bình trà,
có dù — nên không đổ cho điều kiện được nữa. Chúng nằm sâu trong cây của từng người, và
bot xoay vòng chỉ dành cho mỗi act chừng 1/27 số cuộc. Đó là câu hỏi TẦN SUẤT NỘI DUNG,
không phải câu hỏi nhánh chết — và giờ phân biệt được hai cái đó, điều trước đợt này
không làm được.

### Số đo

| | |
|---|---|
| Lưới | 563 → **568** |
| Chính sách bot | thêm `social` (`BUILD_XA_GIAO`: ghế + bình trà + dù mua sớm) |
| Cửa mới của `Service` | `optionActs()` — chỉ cho bot/công cụ, KHÔNG cho `StallScene` |
| `probe-facts.ts` | thêm `--bot social` |

## 6unvicies. "ĐỨNG YÊN" LÀ CHẾT HAY LÀ HIẾM — VÀ MỘT NỬA KHO BOT KHÔNG NGHE THẤY

`probe-social.ts` quét 27 act cùng lúc bằng cách xoay vòng, nên mỗi act chỉ được chừng
1/27 số cuộc. Mười act ra 0 lần, và tới đó thì chưa trả lời được câu đáng hỏi: nhánh đó
**không với tới được**, hay chỉ là **bot chưa đủ lượt**? `tools/probe-act.ts` dồn cả mùa
cho MỘT act, và đếm riêng số lần cuộc chứa nó ĐỦ ĐIỀU KIỆN chạy. Ba dấu:

```
✓ chạy   ·   ~ cuộc CÓ mở ra mà bot không bấm trúng (hiếm)   ·   ✗ cuộc chưa bao giờ đủ điều kiện
```

### Lỗi lớn nhất: bot chỉ nghe được cuộc do CHÍNH NÓ mở

`81/86 cuộc khai `NPC_ONLY`** — người chơi KHÔNG bấm ra được, chúng chỉ tới qua lời mời
của chính NPC. Bot chỉ gọi `openTalk()` ở thế "mình mở lời", nên `okSource` gạt sạch.

Đo tận nơi: `su.toan` rụng **53/53 mẫu** đúng ở cổng `okSource` — không phải vì ngày, vì
khung cảnh, hay vì cờ. Và vì phép đo ban đầu cũng chỉ hỏi `"PLAYER"`, nó **đồng ý với
chính cái lỗi đó** và báo `PAY` · `TAKE_CASH` · `RAO` · `BARTER` là "nhánh chết" trong khi
chúng sống nguyên. Một cái máy đo chia chung giả định với cái nó đo thì nó chỉ xác nhận
giả định.

Sửa hai đầu: bot ưu tiên **trả lời người vừa mở lời** (`Service.hasOffer`) trước khi đi
mời ai; và máy đo hỏi **cả hai chiều** `"PLAYER"` + `"NPC"`.

### Hai lỗi nhỏ hơn, cùng một hình dạng

* **Tay bot lúc nào cũng trống.** `StallScene` gán `playerHand` mỗi frame; bot để nguyên
  `"empty"`, nên `p.holdsFilled`/`p.holdsBread` không bao giờ đúng và `GIVE_BREAD`
  (*"bẻ miếng ăn thử cho biết"*) với `BARTER` (đổi ổ lấy chén tàu hũ) đo ra 0. Bot ĐANG
  làm ổ bánh thật — giờ nó khai đúng cái đang cầm. ⚠️ Mốc "đã có nhân" không phải cờ
  `wrapped` (chỉ bật 3 giây chót ⇒ `loaf_filled` đúng **1/74 lần mở cuộc**), mà là 40%
  chặng cuối.
* **Lấy mẫu thưa hơn cửa sổ cần đo.** Đếm mỗi 211 frame thì không thấy mấy cuộc chỉ sống
  trong khung cảnh rất hẹp (`NAN_LAI` đúng chừng 8% thời gian). Lại là "đo ngắn hơn cái
  được đo", lần thứ năm.

### Kết quả

| | trước mục này | sau |
|---|---|---|
| Cuộc mở được / 20 buổi | 892 | **1.226** |
| act chạy được | 15 | **16**, và `GIVE_BREAD` từ ✗ thành ✓ |
| Chẩn đoán | "10 act nhánh chết" | `PAY`, `LEND_ITEM` là **~ hiếm** (132 và 95 lượt cuộc mở ra được), không chết |

Mấy act còn `✗` — `TAKE_CASH` · `RAO` · `BARTER` · `MOVE_GANH` · `OVERHEARD_BY` ·
`CLEAR_DEBT` — giờ là một danh sách NGẮN và CÓ ĐỊA CHỈ, không phải một cảm giác. Thí dụ
`su.toan` (chứa `TAKE_CASH`) khoá `practice: NAN_LAI`: bé Su trả lại tiền thối dư thì
không ai mặc cả, nên khung cảnh đó không bao giờ tới. Đó là việc của một đợt rà NỘI DUNG,
và nó cần chủ dự án chốt chứ không phải tôi đoán.

| | |
|---|---|
| Lưới | 568 → **569** |
| Máy mới | `tools/probe-act.ts` — dồn cả mùa cho một act, tách CHẾT khỏi HIẾM |
| Cửa mới | `Service.hasOffer` |

## 6duovicies. MƯỜI BA CUỘC BỊ CHÔN — BÀ SÁU VÀ CHÚ KIỆT KHÔNG BAO GIỜ ĐỨNG Ở QUẦY

`tools/probe-khung.ts` so khung cảnh mỗi người CÓ TÊN thật sự ở, với khung cảnh kho thoại
của họ KHAI. Hai dòng làm cả bảng đứng lại:

```
BA_SAU      ở: DI_NGANG 100%
CHU_KIET    ở: DI_NGANG 100%
```

Hai người này là **bạn hàng ngoài đường**, không phải khách: bà Sáu gánh tàu hũ đi qua,
chú Kiệt đẩy xe bánh mì đi qua. Họ KHÔNG BAO GIỜ xếp hàng, gọi món hay đợi bánh. Mà
**13 cuộc của họ** gắn thẻ `GOI_MON` / `XEP_HANG` / `QUAY_VANG` / `DOI_BANH` / `NAN_LAI`
và **không một cuộc nào gắn `DI_NGANG`**:

> `sau.doi` · `sau.xetai` · `sau.omcua` · `sau.ganh` · `sau.rao` · `sau.chonmoi`
> `kiet.lo` · `kiet.gia` · `kiet.bienhieu` · `kiet.mua` · `kiet.khachchung` · `kiet.gundam` · `kiet.hethang`

`okPractice` gạt sạch. Mười ba cuộc — cả arc cái gánh và cả arc tranh chỗ với chú Kiệt —
nằm trong kho mà **không một lần nào rút ra được**, và không có lỗi nào nổ. Thêm
`DI_NGANG` vào thẻ của cả 13: `RAO` · `BARTER` · `MOVE_GANH` từ **✗ chưa bao giờ đủ điều
kiện** thành **~ 285–341 lượt mở ra được**.

### Và một mâu thuẫn TOÁN HỌC: `FULL` + `NAN_LAI`

`su.toan` (bé Su trả lại hai ngàn thối dư) khai `depth: FULL`, `practice: ["NAN_LAI"]`.
Hai dòng trong `Service` loại trừ nhau:

* `practiceOf()` trả `NAN_LAI` **chỉ khi** `someoneWaiting(c)`;
* `canRun()` với `FULL` đòi `canOpenDeep()` = **`!someoneWaiting(c)`**.

Nên cuộc đó không bao giờ chạy được — 22 buổi đo không một lượt nào đủ điều kiện. Không
phải hiếm: **bất khả thi**.

Thêm cổng **T018**: `FULL` mà CHỈ gắn `NAN_LAI` là ERROR; `FULL` có gắn kèm `NAN_LAI` là
WARN (thẻ đó là chữ chết trên cuộc `FULL`) — hiện 6 cuộc dính WARN, để người viết quyết
bỏ thẻ hay hạ `depth`.

### Ba act còn lại — và vì sao chúng KHÔNG phải lỗi

* `OVERHEARD_BY` cần cờ `sauMangDung` + ngày 12–17: nó là **mắt xích thứ hai** của một
  chuỗi, phải có người chơi làm cái thứ nhất trước.
* `CLEAR_DEBT` cần `m.borrowing` — tức phải `LEND_ITEM` (cho mượn áo mưa) trước đã.
* `TAKE_CASH` còn vướng trần `TALK_DEEP_PER_DAY` + cổng `PEAK` của `canOpenDeep`: bot mở
  1.226 cuộc một mùa nên đốt sạch ngân sách cuộc `FULL` vào chuyện khác.

Ba cái đó là **thứ tự sự kiện và ngân sách**, không phải thẻ gắn trật. Khác hẳn 13 cuộc ở
trên, và phân biệt được chúng là toàn bộ giá trị của mấy cái máy đo đợt này.

| | |
|---|---|
| Cuộc được cứu | **13** (toàn bộ arc cái gánh + arc tranh chỗ) |
| `RAO`·`BARTER`·`MOVE_GANH` | ✗ chết → ~ 285–341 lượt mở ra được |
| Cổng mới | **T018** — `FULL` không sống nổi trong `NAN_LAI` |
| Máy mới | `tools/probe-khung.ts` — so khung THẬT với khung KHAI |

## 6tervicies. "TÔI CÓ THẤY CHỖ NÀO MUA ĐÂU" — MÓN CHƯA MỞ KHOÁ KHÔNG TỒN TẠI TRÊN MÀN HÌNH

Tôi bảo chủ dự án *"mua `DU_CHE` ở trang tối là thấy"*. Trả lời:

> *"Ủa mua dù, bàn ghế kiểu gì thế? Tôi có thấy chỗ nào mua đâu?"*

Đi coi `EveningView.gear()` thì thấy đúng một dòng:

```ts
if (!own && (d.starting || !unlocked(id, e, day, w.flags))) continue;
```

Món chưa mở khoá **bị bỏ qua hoàn toàn** — không mờ, không xám, không một dòng chữ. Nên
trước ngày 8 (và trước khi gặp một bữa mưa) cái dù KHÔNG TỒN TẠI ở đâu trên màn hình.
Người chơi không thể muốn một thứ họ chưa từng thấy, mà cái dù là chỗ dựa của mười câu
*"đứng cho mát"*.

Sửa: vẽ mờ 50%, và nói **điều kiện còn thiếu bằng tiếng người** — `"chưa bán — qua ngày 8,
đợi một bữa mưa"`, không phải tên cờ `rainyDaySeen`. Vẫn giữ nguyên luật P3-04 §4: không
bao giờ hiện con số hiệu ứng.

### Và một chỗ tôi nói sai, sửa luôn ở đây

Tôi khai cái dù giá **540.000đ** nên chủ dự án *"chưa đủ tiền"*. Sai: `price_k: 540` là số
THÔ trong `equipment.json`, giá thật đi qua `ECON.scale` ra **216.000đ**. Với 458.000đ
trong két ngày 8, cái dù **mua được ngay**. Đọc dữ liệu thô rồi khai thành giá trong game
là đúng cái lỗi "giá trị ép tay đọc thành số thật" của mấy đợt trước, lần này ở một chỗ
khác.

| | |
|---|---|
| Lưới | 569 → **573** |
| Sửa | `EveningView.gear()` vẽ món bị khoá, kèm điều kiện bằng tiếng người |

## 6quatervicies. DỌN NỢ T018, VÀ KIỂM CHUỖI HAI MẮT XÍCH

### Chín thẻ `NAN_LAI` chết trên cuộc `FULL`

T018 bắt được 9 cuộc `FULL` còn đeo thẻ `NAN_LAI`. Thẻ đó trên một cuộc `FULL` là **chữ
chết** — `practiceOf()` chỉ trả `NAN_LAI` khi còn người chờ, mà `canOpenDeep()` cấm `FULL`
đúng lúc đó. Gỡ cả chín: `bay.dienthoai` · `bay.mua` · `su.toan` · `lan.doncu` ·
`kiet.bienhieu` · `mai.tieutam` · `mai.sobay` · `phuc.quen` · `walkin.chemac`.

Gỡ thẻ chết **không làm mất một câu nào** — mấy cuộc đó vẫn sống ở `GOI_MON`/`XEP_HANG`/
`QUAY_VANG`/`DOI_BANH` như cũ. Nó chỉ làm cái bảng thẻ nói đúng sự thật, để lần sau đọc
`practice` là biết cuộc đó chạy ở đâu, không phải đoán.

### Chuỗi hai mắt xích — "đúng lý thuyết" là chỗ tôi sai nhiều nhất

`probe-act.ts` xếp `CLEAR_DEBT` và `OVERHEARD_BY` vào ô ✗ kèm lời giải thích: chúng là
**mắt xích thứ hai**, phải có người chơi làm cái thứ nhất trước. Lời đó đúng — nhưng một
chuỗi **đứt ở giữa** nhìn y hệt một chuỗi **chưa ai chạm tới**, và mấy đợt vừa rồi tôi sai
đúng ở chỗ nhận ra hai cái đó là một.

Nên kéo chuỗi bằng tay qua đường chạy thật, kiểm từng khớp (`CA-1`…`CA-5`):

| khớp | kiểm |
|---|---|
| cho mượn | sổ CỦA HỌ ghi `borrowed`, áo mưa của mình giảm 1 |
| có nợ | cuộc trả đồ (`when.world: m.borrowing`) MỞ RA; chưa nợ thì ĐÓNG |
| trả xong | sổ sạch, áo mưa về đúng 1 cái |
| trả khi không nợ | **không đẻ thêm áo mưa** — bấm hoài không in ra đồ |
| `OVERHEARD_BY` | cờ nó chờ có người đặt được, chuỗi không đứt giữa |

Chuỗi áo mưa khép kín. Và `CA-1` lộ ra một luật đúng mà tôi suýt viết test sai: `lendItem`
**từ chối người lạ** — tám dáng người lạ dùng chung một `memKey` cả mùa, ghi nợ vào đó là
ghi lên sổ người khác.

| | |
|---|---|
| Lưới | 573 → **578** |
| T018 WARN | 9 → **0** |
| `validate:talks` | sạch |

## 6quinvicies. XẾP THEO ĐỘ HIẾM — VÀ BA CHỖ THẮT NỐI TIẾP NHAU

Chủ dự án: *"hiếm thì cũng được nhưng sắp xếp theo độ hiếm đi. Cho một số xuất hiện
thường xuyên hơn tý."* `tools/rank-act.ts` dựng cái thang đó, và nó lộ ra một **vách**:
chín act "mỗi buổi", rồi rơi thẳng xuống 0. Không có bậc giữa.

Vì chín act dày nằm ở kho người chơi tự mở được (`ANY`, người đi ngang), còn mọi act hiếm
đều là `NPC_ONLY` — chúng tranh nhau **ngân sách lời mời**. Đi tìm chỗ thắt, và phải gỡ
BA chỗ nối tiếp nhau mới thông; mỗi lần gỡ một chỗ thì chỗ sau mới lộ ra.

### Thắt 1 — `TALK_INITIATE_BASE`, cái van thứ hai cho cùng một việc

`tools/probe-offer2.ts` chép lại bảy cổng của `offerTalk()` và đếm chỗ rụng:

```
không cuộc nào chạy được 44,5% · trượt roll 27,3% · chưa giãn 100 giây 21,8%
MỜI ĐƯỢC 6,4%  ⇒  ~0,9 lượt/buổi, trong khi trần là 3
```

Trần **không hề thắt**. Chỗ thắt là cái roll: một cuộc đã qua hết mọi cổng rồi còn bị ném
đi 70% số lần. `TALK_OFFERS_PER_DAY` vốn đã chặn số lượt — roll này là cái van thứ hai cho
đúng việc đó. 0,3 → **0,55**: lượt mời 0,9 → 1,6/buổi, vẫn dưới trần.

### Thắt 2 — hàng xóm đi ngang KHÔNG CÓ ĐƯỜNG NÀO mở miệng

`smalltalk()` — đường **duy nhất** dẫn tới `offerTalk()` — mở đầu bằng
`if (c.phase !== "waiting") return`. Mà bà Sáu và chú Kiệt `DI_NGANG` **100%**: họ gánh,
họ đẩy xe đi qua, không bao giờ xếp hàng. Cộng với `NPC_ONLY` (bấm F không ra), 13 cuộc
của hai người đó **không có đường nào mở được** — kể cả sau khi đã vá thẻ khung cảnh ở
§6duovicies. Cho người CÓ TÊN đang đi ngang dùng chung cửa `offerTalk`, vẫn qua đủ bảy
cổng, không có đường riêng.

### Thắt 3 — và đây là chỗ tôi đoán sai ba lần trước khi chịu đo

Gỡ xong hai cái trên, mấy cảnh đó **vẫn 0 lần**. Tôi đoán: trần ngày? roll? khoảng giãn?
Sai cả ba. Đo đúng bảy cổng riêng cho bà Sáu: **242 lượt chết ở `pickRunnable` trả null**
— trong khi vòng kiểm bên ngoài thấy `sau.doi`/`sau.ganh`/`sau.rao` đủ điều kiện.

Khác nhau ở **sàn điểm** bên trong `pickTalk`. Khung `DI_NGANG` đẩy `VIEC_RIENG` lên 55,
mà `satisfiesOf` mặc định TRỪ `VIEC_RIENG` (nói chuyện = cắt ngang việc của người ta), nên
mọi cuộc của họ rơi xuống dưới sàn. Luật đó đúng cho **người lạ đang vội** — và sai hẳn
cho **một người hàng xóm DỪNG LẠI vì chính họ muốn nói**.

Khai thẳng `drives` cho 13 cuộc (`KE_CHUYEN 42 · DUOC_HOI 18 · VIEC_RIENG −2`): họ dừng vì
họ muốn nói, cắt ngang là chuyện của chính họ. **`CARRY_GANH` · `MOVE_CART` · `RAO` chạy
lần đầu tiên.**

Và chỉ tới lúc này `TALK_OFFERS_PER_DAY` **mới thành** chỗ thắt (357/598 lượt của bà Sáu
chết ở đó) — nên 3 → 4 bây giờ mới có nghĩa. Nâng nó ở bước một là vặn vào không khí.

### Lời hứa "phải HIẾM" đổi chỗ

`L-9` giữ lời hứa đó bằng trần `initiates ≤ 0,35` của từng cuộc. Đó là cái van thứ hai, và
nó bóp chết đúng mấy cảnh hiếm-vì-điều-kiện. Nới lên 0,8, và thay bằng `OF-1` đo **chính
con số người chơi cảm thấy**: 1–4 lượt/buổi, không buổi nào vượt trần.

Chín cuộc vừa được nâng `initiates` nay phải khai `ignore` (L-9 đòi, và đòi đúng: làm thinh
phải có giá). Viết tám đoạn, mỗi người một kiểu — bà Sáu tủi thân, chú Kiệt cay, anh Dũng
đang ướt thì cáu, chị Lan rút vào im lặng.

### Cái thang sau khi gỡ

| bậc | act |
|---|---|
| mỗi buổi | `STEP_ASIDE` 221 · `INVITE` 150 · `STAND_IN_SHADE` 91 · `WALK_ON` 84 · `ORDER_CHANGE` 71 · `PROMISE` 65 · `PROMISE_DEED` 59 · `OFFER_TEA` 33 · `LOOK_INSIDE` 25 |
| vài bữa một lần | `FILM` 9 · `REFUSE` 6 |
| cả mùa một hai lần | `CARRY_GANH` 2 · `MOVE_CART` 2 · `RAO` 1 · `DISCOUNT` 1 · `STOP_FILM` 1 · `FREE_LOAF` 1 |
| còn 0, và BIẾT vì sao | `LEND_ITEM`/`CLEAR_DEBT` (chờ mưa, chuỗi đã kiểm ở `CA-1`…`CA-4`) · `OVERHEARD_BY` (chờ cờ) · `GIVE_BREAD` (`p.holdsFilled`) · `PAY`/`TAKE_CASH`/`THEY_SIT`/`CREDIT_LOAF`/`BARTER`/`MOVE_GANH` (nhánh thứ hai của cuộc đã chạy) |

Ghi lại cho sòng phẳng: đợt này tôi đoán sai ba lần liên tiếp (trần ngày, roll, khoảng
giãn) trước khi chịu chép bảy cổng ra mà đếm. Lần nào cũng có một lý do nghe rất hợp lý.
Cái đếm mất mười phút và trả lời ngay.

| | |
|---|---|
| Lưới | 578 → **579** |
| Số act CHẠY được | 16 → **17** (lần đầu có `RAO`, `CARRY_GANH`) |
| Lượt mời/buổi | 0,9 → **~1,6** (trần 4) |

## 6sexvicies. "XONG HẾT CHƯA" — TRẢ LỜI BẰNG SỐ, KHÔNG BẰNG CẢM GIÁC

### Phần BỘ MÁY: xong

| | |
|---|---|
| Act khai / có `case` | **28 / 28** — thiếu nhánh là lỗi BIÊN DỊCH (`assertActHandled`) |
| Act có nội dung gọi tới | **27 / 28** (`LEAVE_SHADE` tự chạy khi hết hạn, không cần câu thoại) |
| Cổng validator | **T001–T018**, 0 lỗi 0 cảnh báo |
| `lint:lines` · `tsc` | 0 ERROR · sạch |
| Lưới | **579**, xanh hết |
| 15 kho thoại | rà xong cả 15 |
| Vật trong map | xe · gánh · dù · ghế · áo mưa — đủ, và đúng chỗ |

Hai bảng nợ trong tài liệu đã **hết hạn mà vẫn ghi CHƯA**, sửa luôn ở đợt này: `P2-07`
§3.5 còn ghi `GIVE_BREAD`/`STAND_IN_SHADE`/`LEAVE_SHADE`/`WALK_ON` là **CHƯA** (cả bốn
xong từ lâu), và §5 ở trên còn đếm "26 act" (giờ 28). Tài liệu nói sai về chính mình là
một dạng nợ: lần sau đọc nó sẽ làm lại việc đã làm.

### Phần NỐI TỪNG NÚT: chưa, và đây là con số

Mấy tờ rà `docs/audit/thoai/*.md` đánh dấu **246 nút** "câu này đáng ra phải có hành động
thật". Kho hiện có **242 nút mang act / 2.185 nút (11%)**. Hai con số gần bằng nhau, nhưng
**phân bố thì không**:

| act | tờ rà đòi | kho đang có |
|---|---|---|
| `WALK_ON` | 35 | 37 ✓ |
| `GIVE_BREAD` | 31 | **5** |
| `STAND_IN_SHADE` | 22 | **10** |
| `PROMISE_DEED` | 17 | 21 ✓ |
| `MOVE_CART` | 9 | 9 ✓ |
| `OFFER_TEA` | 7 | 21 ✓ |

Nên câu trả lời sòng phẳng cho *"xong hết conversation feature chưa"*:

> **Bộ máy xong. Việc nối từng câu thoại vào hành động thì còn** — đậm nhất ở
> `GIVE_BREAD` (*"bẻ miếng ăn thử cho biết"*, 5/31) và `STAND_IN_SHADE` (10/22).

Và đó là việc **rà nội dung từng file**, không phải việc code: mỗi nút phải đọc câu thoại
rồi quyết nó có đáng mang act không — `tools/audit-loi.ts` dò được chỗ nghi, nhưng quyết
thì phải người đọc.

## 6septvicies. NỐI NỐT `GIVE_BREAD` + `STAND_IN_SHADE` — VÀ TEST THEO LỐI ĐI PHÁ

Chủ dự án: *"làm nốt 2 act đó đi. cuối cùng last test các case để xem nó hoạt động ok
chưa. test theo tư duy counter chứ đừng đồng ý."*

### Không nối đủ 31 — và vì sao KHÔNG nối mới là việc đúng

Tờ rà đòi `GIVE_BREAD` 31 nút. Đọc từng câu thì phần lớn là **câu đưa ổ ĐÃ BÁN** —
*"Dạ ổ của chị đây chị."* Ổ đó đã đi qua `serveDish`; gắn `GIVE_BREAD` lên đó nghĩa là:

* ghi một vết nhớ `CARED_FOR_THEM` (hào phóng) cho một vụ **mua bán bình thường**, và
* đốt luôn cờ `v.gaveFood`, nên lần MỜI ĂN thật sau đó bị khoá (`!v.gaveFood`).

Tức nối đủ 31 là **bán mà hoá ra cho không**. Rà cả kho bằng mắt, còn đúng:

| act | nối thêm | nút |
|---|---|---|
| `STAND_IN_SHADE` | **4** | `dung.congai` · `bay.moiloi` (tờ rà chỉ đích danh) · `hai.say` · `hai.duoi` |
| `GIVE_BREAD` | **2** | `kiet.hethang` · `duong.nhinra` |

Và **gỡ 3 nút** đang gắn sai: `walkin.cau` · `walkin.nhamquan` · `walkin.donvp` — cả ba là
câu đưa hàng. Lưới `PHA-4` giữ ranh giới đó bằng máy để không ai nối lại.

### Chín lưới viết theo lối ĐI TÌM LỖI

Không hỏi "trường hợp thường có chạy không" mà hỏi **"bấm kiểu gì thì nó vỡ"**: bấm hai
lần · bấm khi tay không · chỗ mát đã có người · người đã ăn rồi · mời rồi họ có ĐI tới
không · `forSec` có thiếu không · cổng gắn `need` hay `while`.

**Hai lưới đỏ ngay lần chạy đầu — cả hai là lỗi thật:**

* `PHA-2` — **bấm hai lần thì HAI ổ rời tay bằng một ổ trên tay.** `giveBread` chỉ hỏi
  *"tay có cầm ổ nào không"*, mà `StallScene` gán lại `playerHand` mỗi frame. Vá bằng
  `if (c.eating || c.visit.gaveFood) return` — dùng ĐÚNG cái cờ mà nội dung đã khoá
  (`!v.gaveFood`), nên hai chỗ không thể lệch nhau.
* `PHA-4` — ba câu đưa hàng mang `GIVE_BREAD` như trên.

Nếu viết lưới theo lối "chạy thử một ca thuận rồi gật" thì **cả hai đều lọt**: ca thuận
chạy đúng. Chỉ có câu hỏi "bấm hai lần thì sao" mới lôi được chúng ra.

### Số đo sau cùng

| | |
|---|---|
| Lưới | 579 → **588** |
| `STAND_IN_SHADE` | 10 → **14 nút** · chạy **70 lần / 10 buổi** |
| `GIVE_BREAD` | 5 → **4 nút đúng** (nối 2, gỡ 3 sai) · cuộc chứa nó mở ra 5.007 lượt ⇒ **hiếm, không chết** |
| Lỗi thật bắt được | **2** |

`GIVE_BREAD` còn 0 lần trong lượt chơi của bot vì nó đòi **tay đang cầm ổ ĐÃ CÓ NHÂN**, mà
con bot gói xong là đưa ngay. Người thật hay đứng cầm ổ vừa gói mà nói chuyện, nên con số
của người sẽ khác — và tôi KHÔNG lấy số của bot để kết luận thay cho người.

## 7. Truy vết

| Khẳng định | Nguồn |
|---|---|
| 124 cuộc · 1.595 nút · 166 nút có neo · 45 nút khai `c.openedBy` | đếm trực tiếp `src/content/talks/*.json` |
| pha `ordering` chiếm 165/131.221 frame | `npm run probe:p209 -- --days 10` |
| `duong.docduoc` 1.869 lần · 8 câu khác nhau | `npm run probe:talk -- --lines duong.docduoc` |
| 12 lưới `T001`–`T012` | `tools/validate-talks.ts` |
| Hợp đồng ba phần · tĩnh/động · lời hứa có hạn | `P2-07` §2 · §4.1 · §4bis |
| 374 nút `SỬA` · 202 nút `CẦN CODE` | `P2-08` |
| Bảng đen · khung cảnh · drive · truy hồi | `P2-09` §2.2 · §2.5 · §2.7 · §2.4 |
| *"chính mình là người bắt chuyện trước"* | `P2-07` §1, nguyên văn chủ dự án |
