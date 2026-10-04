# P2-07 — Neo thoại vào thế giới: không còn một chữ nào miễn phí

**Thuộc phase:** P2 — Hệ NPC · **Phụ thuộc:** `P2-06` (flow trò chuyện v2), `CANON` §1 (T1, T5), §8 (ăn gian), §16
**Trạng thái:** **Hợp đồng chốt** · đang rà 1.534 nút

---

## 1. Mục tiêu

Chủ dự án, nguyên văn:

> *"Tôi đang muốn nó giống như một thế giới thật. Mọi cuộc hội thoại, mọi hướng đi đều
> đúng."* — và liệt kê sáu chỗ nó đang sai:
>
> · Khách **đang xếp hàng mua bánh** mà thoại mời *"mới ra lò, ăn thử cho biết"* rồi khách
>   không ăn. *"Họ đang xếp hàng mua bánh mì mà?"*
> · Ra đường **spam mời khách** quá trời.
> · Trong một cuộc, **không có trí nhớ**: vừa chửi họ xong rồi khen, họ vẫn đáp tử tế và
>   vẫn vào mua.
> · *"Bảo có người tới trước chị, chị chen hàng"* — **trong khi bà ấy không hề chen**.
> · *"Vào đứng cho mát"* — **không có chỗ nào để đứng**, và họ gật xong vẫn đi tiếp.
> · Người qua đường: ba lựa chọn *"chú Sáu dọn đi 2 năm"*, *"tôi mới dọn tới"* — **trong
>   khi chính mình là người bắt chuyện trước**.

Đo được: **1.534 nút thoại, chỉ 47 nút (3,1%) có `act`**. Tức **96,9% lời nói không làm gì
cả** — nói xong thế giới không đổi một chút nào.

Đó không phải thiếu nội dung. Đó là thoại **không có móc neo**: nó nói về một thế giới mà
game không mô phỏng, nên nó đúng hay sai là do may.

---

## 2. HỢP ĐỒNG BA PHẦN — mỗi câu phải trả lời đủ ba câu hỏi

Từ nay mọi nút thoại phải khai được ba thứ. Thiếu phần nào thì hoặc bổ sung, hoặc **xoá câu**.

| | Câu hỏi | Trường | Không thoả thì |
|---|---|---|---|
| **TRƯỚC** | *Cần chuyện gì đã xảy ra rồi?* | `need` | **không hiện** lựa chọn đó |
| **LÚC NÓI** | *Cần gì đang đúng ngay lúc này?* | `while` | hiện, nhưng NPC đáp **"?"** rồi bỏ qua |
| **SAU** | *Nói xong thì thế giới đổi gì, trong bao lâu?* | `does` + `forSec` | là một **free word** — phải xoá hoặc gắn hệ quả |

Vì sao `need` thì ẩn còn `while` thì ra dấu "?" — hai loại sai khác hẳn nhau:

* `need` sai = **câu đó vô nghĩa với người này**. Bày ra rồi chặn là trêu người chơi.
* `while` sai = **vừa nãy còn đúng, giờ hết đúng** (mình đặt ổ bánh xuống, họ đã được
  phục vụ, trời tạnh mưa). Người chơi có lý do để bấm, nên không ẩn — nhưng thế giới
  không giả vờ hiểu: NPC **hiện `?` và bỏ qua**, như một người thật nghe một câu lạc đề.

---

## 3. TỪ VỰNG — chỉ được dùng những khoá trong ba bảng này

Người rà **không được tự đặt khoá mới**. Thiếu thì ghi vào mục "đề xuất khoá mới" của
chính file rà, kèm lý do.

### 3.1. Người chơi đang thế nào (`while`)

| khoá | nghĩa | đọc từ |
|---|---|---|
| `p.handsEmpty` | tay không | `player.hand === "empty"` |
| `p.holdsBread` | đang cầm ổ (bất kỳ) | `loaf_*` |
| `p.holdsFilled` | đang cầm ổ **đã kẹp nhân** | `loaf_filled` |
| `p.holdsTea` | đang cầm ly trà đá | `hand === "tea"` |
| `p.handsDirty` | tay dính tiền chưa rửa | `handsDirty` |
| `p.atCounter` | đứng sau quầy | vị trí |
| `p.onStreet` | đã bước ra khỏi quầy | vị trí |
| `p.soldOut` | hết sạch bánh | `soldOut` |
| `p.cash(N)` | két còn ngần đó | `till.floatLeft` |
| `p.hasTea` | **thùng trà còn nước** (khác `p.holdsTea`: chưa cầm, nhưng rót được) | `teaLeft > 0` |

### 3.2. Người kia đang thế nào (`need` hoặc `while`)

| khoá | nghĩa |
|---|---|
| `t.passing` | đang đi ngang, chưa hỏi mua gì |
| `t.queueing` | đã đứng vào hàng, **chưa tới lượt** |
| `t.ordering` | đang gọi món |
| `t.waiting` | đã gọi xong, **đang đợi ổ bánh** |
| `t.served` | đã nhận bánh, còn nán lại |
| `t.leaving` | đang quay lưng đi |
| `t.cutLine` | **đã thật sự chen hàng** (có sự kiện ghi lại) |
| `t.glanced` | đã ngoái nhìn cái xe |
| `t.lookingInside` | **đang** nhìn vào trong quầy |
| `t.impatient` | `waitRatio ≥ 0,6` |
| `t.inShade` | đang đứng ở chỗ hóng mát |
| `t.hasOrder` | đã có món trong đầu |
| `t.purpose(X)` | mục đích hôm nay là X (xem §5) |
| `t.state(Y)` | tâm trạng hôm nay là Y (xem §5) |
| `t.tier(Z)` | độ thân |
| `t.toldMe(F)` | họ đã kể mình chuyện F (cờ chuyện) |

### 3.3. Trong CHÍNH cuộc này (`need` — đây là chỗ chữa "không có trí nhớ")

| khoá | nghĩa |
|---|---|
| `c.saidTone(GAT)` | mình **đã gắt** với họ trong cuộc này |
| `c.saidTone(CHUI)` | mình đã chửi đổng cùng họ |
| `c.saidTone(AM)` | mình đã nói tử tế |
| `c.warmth >= N` | điểm ấm kiếm được trong cuộc này |
| `c.angered` | họ đã bị chọc giận trong cuộc này |

> **Luật cứng:** mọi câu giọng `AM` mà đi SAU một câu `GAT`/`CHUI` trong cùng cuộc thì
> **phải khai `need: "!c.angered"`** — hoặc nếu người viết cố ý để người chơi làm lành thì
> câu đáp phải đọc ra là **người ta chưa nguôi**, không được đáp như chưa có gì xảy ra.
> Đây là chỗ chủ dự án gọi là *"vừa chửi xong rồi khen mà họ vẫn vào mua, nghe rất ảo"*.

### 3.4. Thế giới

`w.hot` · `w.rain` · `w.peak` · `w.queue >= N` · `w.shadeFree` (còn chỗ hóng mát trống)

### 3.5. HÀNH ĐỘNG — `does`, và mọi hành động đều phải CÓ THẬT

> ⚠️ **Bảng này đã HẾT NỢ** — cập nhật sau `P2-10` §6sedecies. 28 act khai trong `TalkAct`,
> **28/28 có `case`** trong `applyAct`, và `assertActHandled(act: never)` biến một act thiếu
> nhánh thành lỗi BIÊN DỊCH chứ không phải một lời nói miễn phí. Giữ bảng lại vì cột "xảy
> ra gì" vẫn là hợp đồng; cột cuối thì không còn chỗ nào ghi CHƯA.

| khoá | xảy ra gì | kéo dài | đã có code chưa |
|---|---|---|---|
| `GIVE_BREAD` | ổ rời tay người chơi, họ cầm lấy, ăn | tới khi ăn xong | CÓ |
| `OFFER_TEA` | tốn một ly; họ nhận **hoặc từ chối** theo tính cách + tâm trạng + mục đích | ~8 s | CÓ (`refuseTea`) |
| `STEP_ASIDE` | họ **bước hẳn ra khỏi hàng**, đứng nép ở `ASIDE_SPOT` (lề bên phải quầy); cả hàng sau lưng dồn lên một bậc, người kế lên trước quầy | tới khi người được nhường đi khỏi (không có ai để nhường: `ASIDE_HOLD_SEC` = 6 s) | CÓ |
| `STAND_IN_SHADE` | họ **đi tới ô hóng mát** và đứng đó | `forSec`, rồi **đi tiếp đúng mục đích cũ** | CÓ (`world/map.SHADE_SPOT`, và cái dù vẽ ĐÚNG chỗ đó) |
| `LEAVE_SHADE` | họ rời chỗ mát, đi tiếp | ngay | CÓ — nhưng **chưa câu thoại nào gọi**; hết `shadeUntil` thì `leaveShade()` tự chạy |
| `LOOK_INSIDE` | họ quay nhìn vào quầy | `forSec` | CÓ |
| `INVITE` | roll `inviteChance` | ngay | CÓ |
| `REFUSE` / `PAY` / `DISCOUNT` / `PROMISE` / `FREE_LOAF` | như cũ | — | CÓ |
| `WALK_ON` | họ đi tiếp, kết thúc cuộc | ngay | CÓ |
| `THEY_SIT` · `FILM` · `STOP_FILM` · `CARRY_GANH` · `MOVE_GANH` · `BARTER` · `MOVE_CART` · `RAO` · `LEND_ITEM` · `CLEAR_DEBT` · `ORDER_CHANGE` · `TAKE_CASH` · `OVERHEARD_BY` · `PROMISE_DEED` · `CREDIT_LOAF` | thêm sau `P2-07` — xem `P2-10` §6octies→§6sedecies | — | CÓ |

> **`forSec` là bắt buộc với mọi hành động có thời lượng.** Chủ dự án nói thẳng:
> *"không phải bảo họ vào đứng mát là họ vào đó đứng luôn cả ngày, cả game"*. Hết giờ thì
> họ **quay lại đúng mục đích ban đầu** — không bốc hơi, không đứng mãi.

---

## 4. "?" — khi người chơi nói một câu lạc

Yêu cầu nguyên văn: *"Khi player nói câu không liên quan gì thì npc nêu hiện ? rồi bỏ qua luôn."*

Cơ chế: nút có `while` mà điều kiện **hỏng ngay lúc bấm** ⇒ NPC không đáp câu viết sẵn,
mà hiện bong bóng **`?`** (hoặc một câu rất cụt theo tính cách: *"Hả?"* · *"Gì?"* ·
*"…"*), rồi **nhịp đó kết thúc** — không rẽ xuống `then`.

Giá của nó: **nhẹ nhưng không bằng không** — `rel −1`, vì nói lạc đề với người đang đứng
trước mặt mình là một chuyện có thật, chỉ là không nặng. Không `anger`.

Và đây **không phải cái cớ để lười**: nếu một câu thường xuyên rơi vào `?`, đó là dấu
hiệu nó thiếu `need`, chứ không phải người chơi bấm bậy.

### 4.1. "?" là LƯỚI AN TOÀN, không phải đường đi chính

Bổ sung sau khi chủ dự án xem bản đầu: *"hạn chế hiện câu gợi ý trả lời lạc đề"*.

Đúng. Nếu một câu thường xuyên rơi vào `?` thì lỗi nằm ở chỗ **nó được bày ra**, không
phải ở chỗ người chơi bấm. Nên có một luật phân loại dứt khoát:

| Loại sự thật | Ví dụ | Dùng | Vì sao |
|---|---|---|---|
| **TĨNH** — người chơi không đổi được trong lúc thẻ đang mở | `p.holdsBread` · `p.holdsTea` · `p.handsDirty` · `t.passing` · `t.tier` · `t.purpose` | **`need`** → **ẩn hẳn** | Lúc dựng thẻ đã biết chắc. Bày ra rồi chặn là trêu người chơi. |
| **ĐỘNG** — đổi được GIỮA LÚC đang đọc, vì đồng hồ vẫn chạy | `t.waiting` · `t.impatient` · `t.leaving` · `w.queue(N)` · `w.shadeFree` · `t.inShade` | **`while`** → **"?"** | Vừa bày ra còn đúng; đọc tới dòng thứ ba thì họ hết kiên nhẫn, hoặc có người tới chiếm chỗ mát. |

Ranh giới chính là **ai thay đổi được nó**: thứ thuộc về tay người chơi thì đứng yên
(thẻ khoá phím), thứ thuộc về người khác và về thế giới thì không.

> **Mốc đo:** tỉ lệ nhịp kết bằng `?` phải **dưới 5%**. Trên mức đó là dấu hiệu có câu
> đang khai `while` cho một sự thật tĩnh — đổi nó sang `need`.

---

## 4bis. LỜI HỨA CÓ HẠN — hứa mà không làm thì phải có chuyện xảy ra

Chủ dự án, nguyên văn:

> *"Nếu đi rót trà mà họ không rót, bắt người ta đợi, thì họ cũng bỏ đi hay ít nhất chửi
> rồi bỏ đi."*

Hiện `act: PROMISE` chỉ treo một món nợ rồi **kiểm lúc đưa bánh**. Nhưng nhiều lời hứa
không gắn với ổ bánh nào — rót ly trà, bưng gánh vô, lấy giùm cuốn sổ — và người ta thì
đứng đó đợi. Không có hạn thì lời hứa cũng là một free word, chỉ là loại tinh vi hơn.

Nên mọi lời hứa phải khai đủ bốn phần:

```
hứa gì · trong bao lâu · làm xong thì sao · KHÔNG làm thì sao
```

| | |
|---|---|
| **Hạn** | giây THẬT, tính từ lúc nói. Trà đá ~25 s, bưng đồ ~15 s, chạy đi lấy ~40 s |
| **Giữ lời** | hệ quả tích cực (đã có: `PROMISE_KEPT`) |
| **Nuốt lời** | **ba nấc theo tính cách**: nhắc một câu → nói nặng → **bỏ đi** |
| **Người nóng tính** | bỏ nấc một, nói nặng rồi đi luôn |
| **Người dễ tha** | nhắc hai lần, rồi thôi, nhưng **vẫn nhớ** |

Và lời hứa phải **nhìn thấy được lúc đang treo** — một chỉ báo trên đầu họ, hoặc một dòng
ở khung nhắc. Phạt một người vì quên một chuyện mà game không nhắc là phạt trí nhớ của
người chơi, không phải phạt lựa chọn của họ (CANON T5: rủi ro phải đọc được).

---

## 4ter. TRÍ NHỚ THẬT — không phải chỉ trong một cuộc

§3.3 lo phần trí nhớ **trong một cuộc** (`c.angered`, `c.saidTone`). Nhưng chủ dự án đòi
nhiều hơn: *"có trí nhớ thật sự logic"*.

Bốn tầng, tầng nào cũng phải có khoá đọc được từ nội dung:

| Tầng | Sống bao lâu | Khoá | Dùng để |
|---|---|---|---|
| **Trong cuộc** | tới khi đóng thẻ | `c.angered` · `c.saidTone(X)` | câu tử tế nói sau câu nặng không được đáp như chưa có gì |
| **Trong lượt ghé** | tới khi họ đi | `v.gaveTea` · `v.promised(X)` · `v.apologised` | không mời trà hai lần; không hứa lại thứ vừa hứa |
| **Trong ngày** | tới khi đóng cửa | `d.metToday` · `d.toldMe(X)` | không chào hỏi lại như người lạ; không hỏi lại chuyện vừa nghe sáng nay |
| **Cả mùa** | vĩnh viễn | `m.visits(N)` · `m.tier(X)` · `m.remembers(E)` | người ghé 20 lần không được chào như lần đầu |

**Luật cứng:** mọi câu mở lời giả định *"lần đầu gặp"* phải khai `need: "!m.visits(2)"`.
Và mọi câu nhắc lại một chuyện phải khai `need: "m.remembers(<chuyện đó>)"` — nhớ nhầm
một chuyện chưa từng xảy ra là lỗi nặng hơn quên.

Đã có sẵn trong code: `mem.visits`, `mem.tier`, `mem.talksDone`, hệ `record()`/`decay()`
của P2-03. Cái thiếu là **đường cho nội dung đọc chúng**.

---

## 5. MỤC ĐÍCH và TÂM TRẠNG — 60 × 30

Mỗi người đi ngang **phải có một lý do để đi**, chứ không phải là một hình di chuyển.

Mỗi `Purpose` khai:

```ts
type Purpose = {
  id: string; label: string;            // "DI_LAM_TRE" · "đi làm trễ"
  /** Mời được không: 0 = không đời nào · 1 = rất dễ. Nhân vào `inviteChance`. */
  buyable: number;
  /** Vội tới mức nào: 0 thong thả · 1 cuống. Ăn vào sức chờ và vào việc họ có dừng không. */
  hurry: number;
  /** Những tâm trạng HỢP LÝ với mục đích này. Cặp sai là lỗi nội dung. */
  states: StateId[];
  /** Giờ nào hay gặp mục đích này. */
  bands?: TimeBand[];
};
```

Luật cặp đôi, nguyên văn yêu cầu: *"trúng số thì có thể vui, có thể đi với lo lắng do số
tiền lớn, nhưng không thể là dạng tức giận hoặc buồn"*. Nên **`states` là danh sách TRẮNG**
— không khai thì không ghép được.

Mục đích + tâm trạng cùng quyết ba thứ: **mời được không** · **chờ được bao lâu** ·
**dễ cáu hay dễ cười**.

---

## 6. CÁCH RÀ — mỗi nút một dòng, không chừa nút nào

Mỗi file thoại ra một file rà `docs/audit/thoai/<npc>.md`:

```
### <talk.id> — <chủ đề>
| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1.1 | "Bà ngồi cái ghế này đi bà" | — | `p.atCounter` | `THEY_SIT · tới khi phục vụ xong` | SỬA: thêm `needEquip` |
| 1.2 | "Nắng quá bà ha" | — | `w.hot` | — | **FREE WORD → giữ** (xã giao thuần, không hứa gì) |
| 1.3 | "Có người tới trước chị kìa" | `t.cutLine` | `w.queue >= 2` | `STEP_ASIDE · tới lượt` | **SỬA: thiếu `t.cutLine`** |
```

Cột **phán** chỉ được nhận một trong bốn giá trị:

| phán | nghĩa |
|---|---|
| `ĐÚNG` | đã neo đủ, không phải sửa |
| `SỬA` | thiếu `need`/`while`/`does` — ghi rõ thiếu gì |
| `XOÁ` | câu hứa một chuyện thế giới không làm được và không đáng làm |
| `CẦN CODE` | neo đúng nhưng hành động/khoá chưa tồn tại — ghi vào danh sách cuối file |

> **Xã giao thuần KHÔNG phải free word.** *"Nắng quá bà ha"* không hứa gì nên không nợ
> gì — nó chỉ cần `while` đúng cảnh (`w.hot`). Free word là câu **hứa một chuyện rồi
> không có chuyện đó**: mời ngồi khi không có ghế, mời ăn khi tay không có bánh, bảo
> người ta dạt ra mà không ai dạt.

---

## 6bis. BA CHỖ ĐÃ KIỂM LẠI VÀ KẾT LUẬN KHÁC VỚI BẢN RÀ

Người rà đọc được JSON và `.ts`, nhưng **không thấy được lớp vẽ**. Ba chỗ dưới đây là
chỗ kết luận của họ lệch, ghi lại để không ai đi sửa một thứ đang đúng.

**1. `kiet.bienhieu` KHÔNG thiếu `needEquip`.** Bản rà báo cuộc này chạy từ ngày 12 mà
nói về cái bảng hiệu `BANG_HIEU` (750k, mở ngày 14). Nhưng `src/art/sign.ts` dòng 9 ghi
rõ: *"Bảng hiệu đỏ chữ vàng (CANON §14), gắn trên MẶT VÁCH của tường sau quán"*, và
`StallScene:848` gọi `createSign()` **vô điều kiện**. Cái xe có bảng đỏ chữ vàng **từ
ngày đầu**; `BANG_HIEU` chỉ là bản nâng cấp thêm khung. Nên câu *"Chữ đỏ viền vàng đó.
Ai viết?"* đúng ngay từ ngày 12 — và chính nó là cái móc cho arc ông Hải.

**2. `p.hasTea` là khoá CÓ THẬT.** Bản rà báo nó không có trong §3.1 nên phải đổi thành
`p.holdsTea`. Khoá thì có thật trong `worldfacts.ts`, chỉ là **tôi quên ghi nó vào bảng
§3.1** — lỗi lệch giữa code và doc, đã bổ sung ở trên. Và hai khoá này **không thay thế
nhau được**: *"con rót bà ly trà"* là một lời hứa SẼ đi rót, nên cổng đúng là **còn nước
trong thùng**, không phải **đang cầm ly trên tay**.

**3. Trí nhớ trong một cuộc (§3.3) sạch nhờ HÌNH DẠNG CÂY, không nhờ cổng nào.** Quét cả
kho: **100/101 nút `GAT`/`CHUI` là lá cuối**, không có nhánh nào nối sau. Ngoại lệ duy
nhất là `tu.trom` — và đó là `CHUI` (chửi đổng một người thứ ba *cùng với* chú Tư), tức
là bắt được tần số chứ không phải xúc phạm ông, nên đi tiếp là đúng.

Nghĩa là `c.angered` **không sửa một lỗi nào đang có** — nó là lưới cho nội dung VIẾT SAU.
Giữ, nhưng đừng tính nó vào phần việc chữa cháy.

---

## 7. Truy vết

| Khẳng định | Nguồn |
|---|---|
| 1.534 nút · 47 nút có `act` | đếm trực tiếp `src/content/talks/*.json` |
| `TalkAct` hiện có 7 loại | `src/sim/talk.ts` |
| `inviteChance` và các hệ số | `src/sim/passersby.ts` |
| Ô hóng mát chưa tồn tại | `src/world/map.ts` — không có ký tự nào cho nó |
| Luật "lời nói phải có hành động thật" | `P2-06` §2.3, và `talk.ts` khối `TalkAct` |
