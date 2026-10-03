# P2-10 — Kế hoạch rà nội dung thoại: còn 14 file, đây là cách làm

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
| `FILM` / `STOP_FILM` | bé Su | 13 | quay phim là lý do tồn tại của nhân vật |
| `MOVE_CART` | chú Kiệt | 11 | hai cái xe tranh chỗ là arc của ông |
| `CARRY_GANH` · `MOVE_GANH` | bà Sáu | 11 | cái gánh là vật thể trung tâm |
| `RAO` | bà Sáu dạy | 7 | ba mảnh đã có, chưa ai nối |
| `LEND_ITEM` / `CLEAR_DEBT` | anh Dũng · chị Lan | 5 | arc áo mưa |
| `TAKE_CASH` | bé Su · thầy Phúc | 5 | `PAY` có chiều ra, chưa có chiều vào |
| `BARTER` | bà Sáu | 5 | không act nào nhận một món VÀO |
| `ORDER_CHANGE` | anh Bảo · chị Lan | 4 | sửa đơn từ một nút thoại |
| `OVERHEARD_BY` | bà Sáu | 2 | `overhear.ts` có sẵn, hệ thoại chưa nối |

Và **hai item** chưa có: cái gánh · áo mưa. (Ghế ngồi được: ✅ `world/map.SEAT_SPOT`.) (Ô hóng mát **đã có**:
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
