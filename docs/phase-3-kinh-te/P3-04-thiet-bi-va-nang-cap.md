# P3-04 — Thiết bị và nâng cấp

**Thuộc phase:** P3 (Kinh tế) · **Phụ thuộc:** `phu-luc/A-quyet-dinh-co-che-moi.md` §2.3 · `P2-01` (perception) · `P3-01` (vòng một ngày) · **`P3-03` (nền số học)** · `P3-02` (nguồn hàng) · `P3-05` (chỗ đứng) · `P3-06` (nghĩa vụ & cân đối) · **Trạng thái:** **Chốt** (các con số: **Cần đo**)

> ### ⚠️ Nền số học — doc này tiêu thụ, không định nghĩa lại
>
> | Khoá | Giá trị chốt | Nguồn |
> |---|---|---|
> | Cầu chuẩn | **51,7 ổ/ngày** · băng ngày 13–22 = **54 ổ** | P3-03 §2.4 |
> | Giá bán / COGS / lãi gộp mỗi ổ | **28,0k / 15,4k / 12,6k** | P3-03 §2.5.2 |
> | **Chi phí cố định nền** | **100k/ngày → 115k từ ngày 33** | P3-01 §2.7, P3-03 §2.5.3 |
> | Lãi ròng (chơi tốt) | **≈ 552k/ngày** | P3-03 §2.5.2 |
> | **Nghĩa vụ** | **Rút về nhà 150k/ngày · thuê chỗ 42k/ngày · hụi 500k × 8 kỳ · tiền học 1.200k × 2 (ngày 18, 38)** | **P3-06 §9.5** (bảng hợp nhất) — thay cho con số 2.200k/kỳ trong `P3-01`/`P3-03` |
>
> **Quy ước quan trọng về `dailyCost`:** con số 100k/ngày của `P3-01` **đã bao gồm** chi phí vận hành của một cấu hình thiết bị **giữa mùa**. Cột "/ngày" trong doc này là **thành phần cấu thành** con số đó, không phải chi phí cộng thêm lên trên nó. Xem §2.5.1.

> **Trục B** của `idea.md` §3:
> *"Vòng nâng cấp công cụ trên một đống bừa bộn nhìn thấy được. Mỗi công cụ mới khiến cái cũ thành ký ức của một game chậm hơn. Thành tựu ở đây **cảm nhận được bằng mắt và bằng tay**, không cần bảng achievement."*

---

## 1. Mục tiêu

1. Dựng **bể chứa tiền duy nhất đáng tin** của game. Không có nó, hệ kinh tế P3 không có đáy: tới ngày 15 người chơi hết lý do để tối ưu.
2. Hiển thị **toàn bộ tiến trình 40 ngày bằng chính cái xe** — không bảng achievement, không thanh tiến trình, không popup. Ngày 40 nhìn khác ngày 1, và đó là tất cả.
3. Biến ba hệ đang "phiền" thành ba hệ "xử lý được": `DIRTY_HANDS` (bồn rửa), `BURNT_OR_COLD` (lò gas + lồng bàn), hạn dùng (tủ mát) — **mà không xoá thao tác nào của người chơi**.
4. Cho ba lối chơi khác nhau (vệ sinh / thông lượng / tiếp khách) **đều đi được trọn 40 ngày**, và không lối nào mua hết được mọi thứ.

**Trụ cột phục vụ:** **T1** (thiết bị nằm trên xe, khách nhìn thấy; bồn rửa chuyển việc rửa tay từ chỗ khuất ra chỗ sáng) · **T3** (tiến trình không cần con số) · **T4** (cây thiết bị hữu hạn, kết gọn trong 40 ngày) · **T5** (mỗi thiết bị đổi một con số người chơi cảm được ngay lần dùng đầu).

---

## 2. Cơ chế

### 2.1. Bốn luật gốc (lấy từ PL-A §2.3, chép lại nguyên văn để doc này tự đứng được)

> **Luật TB-1.** Mỗi thiết bị phải thoả đủ 3 điều: (a) **nhìn thấy được trên xe**, (b) **đổi cảm giác thao tác**, (c) **giao nhau với ít nhất một hệ khác** (perception / hạn dùng / thông lượng / quan hệ). **Thiết bị chỉ cộng một con số là thiết bị sai — cắt.**
>
> **Luật TB-2.** **Không thiết bị nào được XOÁ một thao tác của người chơi.** Được rút ngắn, được mở rộng cửa sổ timing, được giảm xác suất hỏng — **không được tự chạy**. (Hàng rào chống "thuê nhân viên trá hình dưới dạng máy móc".)
>
> **Luật TB-3.** **Không có thiết bị thuần lợi.** Mỗi món phải có mặt trái đọc được.
>
> **Luật TB-4.** **Sức chứa xe hữu hạn.** Không mua hết được.

**Kiểm tra TB-1 cho từng món:** cột "Hệ giao nhau" trong các bảng §2.4 là **bắt buộc điền**. Một món không điền được cột đó thì không vào game.

---

### 2.2. Sức chứa xe — điều kiện để cây thiết bị là **quyết định**, không phải **checklist**

```ts
// craft/equipment.ts
export type CartCapacity = {
  baseSlots: number;        // 12
  addedSlots: number;       // từ giá treo (+2) và khung gia cố (+2)
  get total() { return this.baseSlots + this.addedSlots; }   // trần 16
};

export type Equipment = {
  id: EquipId;
  group: 'LAM_BANH' | 'BAO_QUAN' | 'VE_SINH' | 'TIEP_KHACH' | 'VAN_HANH' | 'CAI_XE';
  price_k: number;
  slots: number;               // 0 = nằm trong hộc đồ nghề, không chiếm chỗ mặt xe
  dailyCost_k: number;         // chi phí cố định hằng ngày
  unlock: UnlockCondition;
  replaces?: EquipId;          // mua cái mới thì cái cũ nhường slot
  visual: string;              // BẮT BUỘC — phải vẽ được trên xe
};
```

| Khoản | Giá trị |
|---|---|
| Slot mặt xe ngày 1 (`baseSlots`) | **12** |
| Đã bị chiếm ngày 1 | lò than (2) + thùng xốp (2) = **4** → **còn 8 slot trống** |
| Trần tuyệt đối | **16** (F1 giá treo +2, F2 khung gia cố +2) → **tối đa 12 slot trống** |
| Tổng slot mà 17 món mua được đòi hỏi | **19** |
| ⇒ **Tỉ lệ mua được theo slot** | **12 / 19 ≈ 63%** |

**Hai luật thay thế (quan trọng — nếu thiếu thì bảng trên sai):**

| Món mới | Thay món cũ | Slot ròng |
|---|---|---|
| **A1 lò gas 2 tầng** (3 slot) | **A0 lò than** (2 slot) — bán lại 0k, lò của cô Ba, không bán | **+1** |
| **B1 tủ mát** (3 slot) | **B0 thùng xốp** (2 slot) — bán lại 60k | **+1** |

Tức hai món đắt nhất cây **chỉ ăn thêm 1 slot mỗi món**, chứ không phải 3. Đây là điều khiến chúng **mua được**, và cũng là lý do một lối chơi mua cả hai vẫn còn chỗ cho 6 món khác.

**Slot 0 là có thật, và cố ý:** dao, kẹp gắp, khăn lau, bảng QR nằm trong hộc đồ nghề / treo mép xe — không chiếm mặt xe. Đây là các món **rẻ, hiệu quả cao, không tốn slot**: người chơi mua hết chúng từ tuần 1. Chúng tồn tại để tuần 1 có gì đó để mua, và để dạy người chơi rằng "thiết bị = đổi cảm giác tay", trước khi họ gặp quyết định đắt tiền đầu tiên.

**Gỡ thiết bị:** được, bán lại **60% giá**. Đây là cửa thoát cho người chơi lỡ mua sai, và là **cơ chế của fail mềm** (P3-06): không trả nổi tiền hụi → *"phải bán cái tủ mát"* (`idea.md` §22).

---

### 2.3. Cách một thiết bị được phép ảnh hưởng hệ thống

```ts
// Mọi hiệu ứng thiết bị đi qua đúng 6 kênh này. Không có kênh thứ 7.
type EquipEffect =
  | { kind: 'TIME';        op: OperationId; deltaMs: number }        // rút ngắn/kéo dài thao tác
  | { kind: 'WINDOW';      op: OperationId; deltaMs: number }        // nới cửa sổ timing (FLOURISH…)
  | { kind: 'PERCEPTION';  slot: Slot; zone: Zone; mul: number }     // đổi bảng visibility
  | { kind: 'DECAY';       good: GoodId; mul: number }               // hạn dùng / tốc độ ỉu
  | { kind: 'FLOW';        stat: 'traffic' | 'conversion'; mul: number }
  | { kind: 'STATE';       stat: 'cleanliness' | 'handsSoil' | 'neighborAnnoyance'; mul: number };
```

> **Không có kênh `{ kind: 'AUTO' }`.** Đó là Luật TB-2 viết thành type system.

---

### 2.4. **Cây thiết bị — 17 món mua được + 2 món có sẵn**

Giá tính bằng **nghìn đồng**. `dailyCost` = chi phí cố định hằng ngày, chạy kể cả ngày bạn nghỉ bán (bịt lỗ hổng ăn gian (l), CANON §8).

---

#### **NHÓM A — LÀM BÁNH**

| Món | Giá | Slot | /ngày | Mở khoá |
|---|---|---|---|---|
| **A0. Lò nướng than** *(có sẵn)* | — | 2 | 25k than | — |
| **A1. Lò gas 2 tầng** | **1.800k** | 3 *(thay A0, net +1)* | 27k gas | Ngày ≥ 12 · quan hệ anh Tuấn (S10) ≥ `Acquaintance` |
| **A2. Dao bén** (dao rạch bánh tốt) | **180k** | 0 | — | Ngày ≥ 3 |
| **A3. Bộ thớt riêng sống/chín** | **120k** | 1 | — | Ngày ≥ 5 · sau lần `STALL_CLEANLINESS` cao đầu tiên |
| **A4. Bộ kẹp gắp inox (3 cái)** | **95k** | 0 | — | Ngày ≥ 2 |

**A1 — Lò gas 2 tầng**

| | Lò than (A0) | Lò gas 2 tầng (A1) |
|---|---|---|
| Nướng lại 1 ổ | **55 s** | **28 s** |
| Nướng cùng lúc | 1 ổ | **2 ổ** |
| Cửa sổ trước khi cháy | **12 s** (rất dễ cháy) | **30 s** |
| `BURNT_OR_COLD` do cháy (đo 40 ngày) | ~**14 lần** | ~**4 lần** |
| Khởi động sáng | 8 phút nhóm than | **20 giây** |

- **Đổi cảm giác thao tác:** lò than là **canh lửa** — người chơi phải quạt, phải nhìn màu vỉ, phải nhấc ra đúng lúc. Lò gas là **bấm và đặt** — cửa sổ rộng gấp 2,5 lần, tay rảnh ra để làm việc khác. Game **chậm hơn** trở thành ký ức đúng nghĩa.
- **Hệ giao nhau:** *thông lượng* (giờ cao điểm) + *P3-02* (ổ ỉu của lò rẻ nay nướng lại được mà không vỡ nhịp) + *quan hệ anh Tuấn*.
- **⚠️ Mặt trái — mất mùi than:**

```ts
// Sự kiện mới, chỉ tồn tại sau khi mua A1
const MISSING_CHARCOAL_AROMA: StimDef = {
  id: 'MISSING_CHARCOAL_AROMA',
  salience: 25,
  kind: 'ORDER_DEFECT',              // họ sự kiện ORDER_DEFECT, chạy qua delivery-diff
  condition: (npc) => npc.visitCount >= 12 && npc.personality.soi >= 0.6,
  oddsPerServe: 0.18,
};
```
  Khách quen `soi` cao **nhận ra**, và họ không giận — họ **tiếc**:
  > Thầy Phúc: *"Ủa… bánh hôm nay không có mùi khói hả con?"*
  > Bà Bảy: *"Hồi đó cái lò than của cô Ba thơm lắm. Mà thôi, nhanh cũng được."*

  Không có hình phạt số. Chỉ có một bark tiếc nuối, và người chơi phải sống với nó. **Đây là mặt trái đúng kiểu game này.**
- Mặt trái thứ hai: bình gas 12kg **hết giữa cao điểm ~1 lần/mùa** nếu người chơi không theo dõi → 0 ổ nướng lại trong 20 phút.

**A2 — Dao bén**

| | Dao cũ | Dao bén |
|---|---|---|
| Cửa sổ timing `FLOURISH` | **0,22 s** | **0,38 s** (+73%) |
| Xác suất rạch rách ruột (ổ hỏng) | 8% | **2%** |
| Âm thanh | rẹt khô | **một tiếng "rắc" gọn** |

- **Đổi cảm giác:** `FLOURISH` (salience 15) là sự kiện **thưởng cho kỹ năng tay, không thưởng cho tiền** (CANON §3.2). Dao bén không cho điểm — nó cho **cửa sổ**. Người chơi mới thỉnh thoảng trúng; người chơi đã quen thì **trúng gần như mọi lần**, và họ tự biết điều đó.
- **Hệ giao nhau:** *perception* (`FLOURISH` chỉ tính khi khách đang nhìn — dao bén + khách `FRONT_CENTER` = cặp đôi) + *P3-02* (ổ `density` cao của lò cô Nhàn rạch đẹp hơn; ổ rỗng của Tân Phát thì dao nào cũng như nhau).
- **⚠️ Mặt trái:** dao bén **cắt tay** — nếu người chơi thao tác khi `handsSoil` cao hoặc đang vội (hàng chờ ≥ 4), xác suất 1,5%/ổ sinh sự kiện `CUT_FINGER`: mất 25 giây băng lại, và **phải rửa tay lại từ đầu**. Trước mặt khách. Phải mài dao mỗi 10 ngày (90 giây buổi tối) — không mài thì cửa sổ tụt dần về 0,26 s.

**A3 — Bộ thớt riêng sống/chín**

- `STALL_CLEANLINESS` tăng chậm lại **×0,88**.
- Mở khoá **bark tích cực hiếm** từ khách `soi ≥ 0,8`: bà Bảy, thầy Phúc, chị Lan, cô Thắm (nếu ghé). *"Con này làm ăn sạch sẽ à nghen."* → `CARED_FOR_THEM` biến thể, salience 50, **nhưng chỉ kích hoạt một lần cho mỗi NPC trong cả mùa**.
- **Hệ giao nhau:** *perception* (khách thấy bạn đổi thớt) + *đồn thổi* (bark này lan với hệ số tin tốt 1,3).
- **⚠️ Mặt trái:** đổi thớt tốn **1,8 giây mỗi lần chuyển giữa đồ sống và đồ chín**. Ở cao điểm, với 54 ổ, đó là **~1,6 phút** — tức ~2 ổ. Và nếu người chơi **quên đổi** trong lúc vội, khách `soi` cao thấy → hiệu ứng **âm**, nặng hơn cả việc không có thớt riêng: *"Ủa con, cái thớt đó con vừa để thịt sống mà?"*

> **Đây là mẫu thiết kế quan trọng của cả doc:** một thiết bị tốt có thể **thêm một cách để sai**. Đó không phải lỗi thiết kế — đó là định nghĩa của chiều sâu.

**A4 — Bộ kẹp gắp inox**

- Bốc rau/đồ chua bằng tay: `handsSoil += 0,15` mỗi lần. Dùng kẹp: **+0**.
- **⚠️ Mặt trái:** kẹp chậm hơn tay **+0,4 s** mỗi lần gắp, và mỗi ổ đầy đủ có 3–4 lần gắp → **+1,4 s/ổ**. Với 54 ổ = **+1,3 phút** cao điểm. Ngoài ra kẹp **rơi** nếu thao tác vội (hàng chờ ≥ 5): 2%/lần → kẹp rơi xuống đất = **phải rửa hoặc lấy cái khác** (vì sao mua bộ 3).

---

#### **NHÓM B — BẢO QUẢN**

| Món | Giá | Slot | /ngày | Mở khoá |
|---|---|---|---|---|
| **B0. Thùng xốp + đá** *(có sẵn)* | — | 2 | 18k đá | — |
| **B1. Tủ mát mini 100L** | **3.200k** | 3 *(thay B0, **ròng +1**)* | **22k điện** | Ngày ≥ 18 · đã có **A3 hoặc C1** (game không bán tủ mát cho cái xe còn bẩn) |
| **B2. Nồi ủ xíu mại** | **450k** | 1 | 6k | Ngày ≥ 9 · đã bán ≥ 40 ổ xíu mại |
| **B3. Lồng bàn / tủ kính chắn bụi** | **260k** | 1 | — | Ngày ≥ 6 |

**B1 — Tủ mát mini 100L** *(món đắt nhất game)*

| Mặt hàng | Hạn dùng thùng xốp | Hạn dùng tủ mát |
|---|---|---|
| Pate | 2 ngày | **4 ngày** (×2,0) |
| Thịt nguội / chả lụa | 3 ngày | **6 ngày** (×2,0) |
| Rau, dưa leo | 1 ngày | **2 ngày** (×2,0) |
| Đồ chua ngâm | (không đổi — đồ chua càng lâu càng ngon tới ngày 3) | quản lý được **7 hũ** thay vì 3 |
| Sức chứa | 3 khay | **6 khay** |

- **Hệ giao nhau:** *hạn dùng* (CANON §13.1) + *P3-02 trục D6* (mua gộp nhiều ngày) + *P3-06* (chi phí cố định).
- **Vì sao nó đổi cả chiến lược mua hàng:** trước tủ mát, trục D6 gần như luôn trả lời "mua từng ngày". Sau tủ mát, **ngày thịt rẻ (thứ Năm) đáng ôm 5 ngày**, và tin đồn "sắp có dịch heo" trở thành **cơ hội đầu tư** chứ không phải tin buồn. Một món đồ **mở khoá một chiến thuật**, không phải cộng một con số.
- **⚠️ Mặt trái (ba cái):**
  1. **22k/ngày tiền điện**, chạy kể cả ngày mưa, ngày lễ, ngày nghỉ. Trong 22 ngày còn lại của mùa = **484k**.
  2. **Chiếm 3 slot** — nhiều nhất trong cây. Mua tủ mát ≈ từ bỏ ghế + bàn + dù.
  3. **Tiếng máy nén.** `overhearRadius × 0,80` — người chơi **khó nghe lỏm** hai khách nói chuyện ở góc xe hơn. Mà nghe lỏm là ràng buộc bắt buộc của hệ đồn thổi (CANON §12.4). **Cái tủ làm bạn giàu hơn và điếc hơn.**

**B2 — Nồi ủ xíu mại**

- Xíu mại giữ nóng: **1,5 h → 4 h**. Mở khoá bán xíu mại tới ~10h thay vì tắt lúc 8h.
- **Hệ giao nhau:** *dự báo cầu* (xíu mại là món cầu lệch giờ) + *P3-05* (chỗ *Chợ sáng* cầu xíu mại gấp đôi).
- **⚠️ Mặt trái:** ủ quá **3 giờ** thì nước sốt cạn và mặn lại — `sauceQuality` tụt 0,25/giờ sau mốc đó. Khách `soi ≥ 0,7` nhận ra: *"Bữa nay xíu mại mặn hơn hả con?"* → `ORDER_DEFECT` nhẹ. Tức nồi ủ **không phải là giấy phép nấu một nồi cho cả ngày** — nó chỉ dời cái hạn ra xa hơn.

**B3 — Lồng bàn / tủ kính chắn bụi**

- `STALL_CLEANLINESS` ×0,80 · **`kStale` của ổ bánh ×0,85** — tức ổ ỉu chậm lại ~15% (nối thẳng P3-02 §2.5.1: ổ bà Tám chạm ngưỡng 0,80 lúc **10h55** thay vì 10h15) · chặn sự kiện ruồi ở chỗ *Chợ sáng*.
- **⚠️ Mặt trái:** mỗi lần lấy ổ bánh phải mở/đậy → **+0,6 s/ổ**. Ở 54 ổ = +32 giây. Và nếu **quên đậy** (người chơi vội), toàn bộ lợi ích về 0 trong khoảng thời gian đó — **và khách nhìn thấy cái lồng bàn mở toang**, `soi` cao có bark.

---

#### **NHÓM C — VỆ SINH**

| Món | Giá | Slot | /ngày | Mở khoá |
|---|---|---|---|---|
| **C1. Vòi nước gắn xe + bồn rửa nhỏ** | **680k** | 2 | 8k nước | Ngày ≥ 7 · **sau lần `DIRTY_HANDS` đạt `CONFIRMED` đầu tiên** |
| **C2. Thùng rác có nắp đạp chân** | **150k** | 1 | — | Ngày ≥ 4 |
| **C3. Bộ khăn lau riêng 3 màu** | **60k** | 0 | 3k giặt | Ngày ≥ 5 |

**C1 — Vòi nước gắn xe + bồn rửa nhỏ** — ⭐ **thiết bị quan trọng nhất về mặt thiết kế**

Lý do nó quan trọng nhất **không phải** vì con số. Là vì nó **đổi ô trong bảng `visibility`**.

| | Trước C1 (chậu nước dưới gầm) | Sau C1 (bồn gắn mép xe) |
|---|---|---|
| Thao tác rửa tay | **7,0 s** | **2,5 s** |
| Slot diễn ra | `UNDER_COUNTER` | **`HANDS`** |
| `visibility[slot][FRONT_CENTER]` | **0,05** | **0,95** |
| Nước sạch tới lần thứ | 12 (sau đó chỉ giảm 60% `handsSoil`) | **luôn sạch** |
| `handsSoil` sau khi rửa | 0,40 × giá trị cũ | **0** |

**Đây là cả thiết kế, trong một câu:** trước khi có bồn rửa, người chơi **trả giá 7 giây và khách không nhìn thấy gì cả** — họ bỏ tiền và không được công nhận. Sau khi có bồn, người chơi **trả 2,5 giây và khách nhìn thấy rõ ràng**.

```ts
// Sự kiện tích cực mới, chỉ tồn tại sau khi mua C1
const WASHED_HANDS_VISIBLY: StimDef = {
  id: 'WASHED_HANDS_VISIBLY',
  salience: 30,
  kind: 'POSITIVE',
  // Chạy qua đúng công thức perception CANON §5 — không có đường tắt
  // visibility[HANDS][FRONT_CENTER] = 0.95  →  CONFIRMED sau ~3,5s với khách nhìn thẳng
  effect: { traitMulDelta: -0.12, durationSec: 120 },   // khách bớt soi trong 2 phút
};
```

- **Hệ giao nhau:** *perception* (đổi slot) + *thông lượng* (−4,5 s/lần rửa × ~18 lần/buổi = **−81 giây**, tức **+1,4 ổ** ≈ **+18k lãi gộp/ngày**, tức nó tự trả hết 680k trong **~38 ngày** — và đó **chưa phải** lý do mua nó) + *quan hệ* (`traitMul` giảm tạm thời) + *P3-04 khác* (bình trà đá C-nhóm-D cần chỗ rửa ly).
- **Chuyển `DIRTY_HANDS` từ "phiền" thành "có thể xử lý":** trước C1, người chơi cầm tiền xong thì **kẹt** — rửa thì mất 7 giây giữa cao điểm, không rửa thì `handsSoil` tích lên. Họ chọn không rửa, rồi bị bắt. Sau C1, rửa tay **rẻ tới mức thành thói quen**, và thói quen đó **được nhìn thấy**.
- **⚠️ Mặt trái:**
  1. Can nước 20L **hết giữa buổi** nếu rửa >40 lần/ngày → phải đi xách nước (rời quầy 8 phút) hoặc mua thêm can (+1 slot).
  2. **Nước thải.** Bồn có ống xả xuống xô — xô đầy thì **nước tràn ra đất**, `STALL_CLEANLINESS` tăng **gấp 2,2 lần** cho tới khi đổ. Và nước đọng ở hẻm là thứ **hàng xóm để ý** (nối P3-05: `neighborAnnoyance`).
  3. 2 slot.

**C2 — Thùng rác có nắp đạp chân**

- `STALL_CLEANLINESS` ×0,85. Chặn sự kiện ruồi. Bỏ ổ bánh rớt vào thùng có nắp = **không ai nhìn thấy cái ổ bánh nằm đó nữa** → `DROPPED_FOOD` mất **decay tail** (certainty giảm nhanh hơn 1,6×). Cái ổ bánh nằm chình ình dưới đất là thứ nhắc khách nhớ.
- **⚠️ Mặt trái:** đạp chân **+0,3 s**; và thùng đầy sau ~55 ổ → phải đi đổ (rời quầy 3 phút) giữa buổi, hoặc chịu `STALL_CLEANLINESS` ×1,4.

**C3 — Bộ khăn lau riêng 3 màu** (xanh: tay · vàng: thớt · đỏ: bàn)

- Lau tay bằng khăn chuyên: `handsSoil −0,25` trong **0,8 s** — rẻ hơn rửa, không sạch bằng. Là **lựa chọn giữa** rửa (2,5 s, về 0) và không làm gì.
- **⚠️ Mặt trái — thiết bị này THÊM một cách để sai:** dùng **nhầm màu** (khăn đỏ lau bàn → lau tay) thì `handsSoil` **tăng** +0,3, và khách `soi ≥ 0,7` **nhìn thấy màu khăn**:
  > Chị Lan: *(không nói gì. Nhìn. Ngày mai không tới.)*

  Ở cao điểm, ba cái khăn ba màu nằm cạnh nhau là một bài toán thật cho bàn tay đang vội. **60 nghìn đồng mua về một cách để tự làm hỏng ngày của mình** — và đó là món đáng tiền nhất trong game nếu bạn chơi cẩn thận.

---

#### **NHÓM D — TIẾP KHÁCH**

| Món | Giá | Slot | /ngày | Mở khoá |
|---|---|---|---|---|
| **D1. Ghế nhựa (4) + bàn con** | **320k** | 2 *(treo gầm xe)* | — | Ngày ≥ 5 |
| **D2. Dù che lớn kẹp xe** | **540k** | 1 | — | Ngày ≥ 8 · **sau ngày mưa đầu tiên** |
| **D3. Bình trà đá 10L + ly** | **210k** | 1 | **18k đá + 6k trà** | Ngày ≥ 4 |

**D1 — Ghế nhựa + bàn con** — *vừa tốt vừa là công cụ hạ attention*

```
Khách đứng ăn tại quầy      →  zone = FRONT_CENTER  →  visibility[HANDS] = 0.95
Khách ngồi ghế ăn tại chỗ   →  zone = SEATED_FAR    →  visibility[HANDS] = 0.10
```

**Giảm 9,5 lần.** Đây là **công cụ hạ attention mạnh nhất trong game**, mạnh hơn cả cô Ba (PL-A §2.7.2) — vì nó **không tốn charge, không tốn thao tác, và kéo dài suốt bữa ăn**.

- Và nó đồng thời là `CARED_FOR_THEM` (salience 50) khi người chơi **chủ động kéo ghế** cho khách lớn tuổi.
- **Hệ giao nhau:** *perception* (đổi zone) + *quan hệ* (`CARED_FOR_THEM`) + **đồn thổi** — xem mặt trái.
- **⚠️ Mặt trái (hay nhất trong cây):**
  1. Khách ngồi ăn tại chỗ **ở lại 6–11 phút** thay vì đi ngay. Hai khách ngồi cạnh nhau = **một hop gossip xảy ra ngay tại quầy**, và người chơi phải đứng đó nghe. *"Ghế làm khách bớt nhìn bạn, nhưng làm họ bắt đầu nói chuyện với nhau."*
  2. `STALL_CLEANLINESS` **+40% mỗi khách ngồi** (vụn bánh, giấy, ly).
  3. Ghế chiếm lối đi hẻm → `neighborAnnoyance +1/ngày` nếu bày quá 4 ghế (nối P3-05).
  4. 2 slot.

**D2 — Dù che lớn**

| | Không dù | Có dù |
|---|---|---|
| Lượng khách ngày mưa | **−40%** (CANON §8c) | **−28%** |
| `CARED_FOR_THEM` lúc mưa | phải gói kỹ (thao tác 3 s) | **tự động khi khách đứng dưới dù** (salience 50) |
| `kStale` ngày mưa (P3-02 §2.5.1) | ×1,25 | **×1,10** |

- **Hệ giao nhau:** *thời tiết* + *quan hệ* + *P3-02* (tốc độ ỉu) + *P3-05* (chỗ *Chợ sáng* đã có mái, dù vô dụng ở đó — **một thiết bị có thể vô dụng ở một chỗ đứng**, đó là chiều sâu của hai hệ giao nhau).
- **⚠️ Mặt trái:**
  1. Ngày nắng, dù che mất tầm nhìn từ xa: **−8% khách vãng lai**. Người chơi phải **thu dù mỗi sáng nắng** (thao tác 20 giây) — và **quên thu** là chuyện thường xảy ra.
  2. Gió lớn (~3 lần/mùa) **lật dù**: 40 giây dựng lại, và nếu đang có khách thì đó là 40 giây `MADE_THEM_WAIT`.
  3. 1 slot.

**D3 — Bình trà đá 10L**

CANON §5.4 đã ghi ly trà đá là công cụ hạ attention. Bình 10L là thứ biến nó từ **một cử chỉ hiếm** thành **một chiến thuật dùng được**.

| | Không bình | Có bình |
|---|---|---|
| Số ly phục vụ được/ngày | ~8 | **~40** |
| Thao tác rót | 4,5 s (lấy đá, pha) | **1,6 s** (mở vòi) |
| `gazeFactor` khi khách uống | ×0,35 trong **2–3 s** | như cũ |

- **Hệ giao nhau:** *perception* (§5.4) + *quan hệ* (`CARED_FOR_THEM`, salience 50) + *C1* (rửa ly!) + *P3-02* (đá của chú Lâm S11).
- **⚠️ Mặt trái:**
  1. **24k/ngày** đá + trà.
  2. **Rửa ly.** 40 ly/ngày. Không có C1 → `STALL_CLEANLINESS` ×1,35 và tốn 7 giây/lượt rửa. **D3 gần như bắt buộc phải đi kèm C1.** Đây là cặp thiết bị **giao nhau** đúng nghĩa.
  3. **Diminishing returns** (CANON §8i): đưa trà đá quá 3 lần cho cùng một khách trong 5 ngày → người tinh ý nhận ra bạn đang mua chuộc → **phản tác dụng**. Bà Bảy: *"Con cứ rót nước hoài, bộ định lấy lòng cô hả?"*

---

#### **NHÓM E — VẬN HÀNH**

| Món | Giá | Slot | /ngày | Mở khoá |
|---|---|---|---|---|
| **E1. Standee QR ngân hàng** | **0k tiền mặt** *(mất một buổi sáng)* | 0 | — | Ngày ≥ 8 · cô Mai chỉ chỗ |
| **E2. Loa rao** | **380k** | 1 | 4k pin | Ngày ≥ 10 |
| **E3. Bảng hiệu đỏ chữ vàng** | **750k** | 1 | — | Ngày ≥ 14 · danh tiếng hẻm ≥ mốc 2 |
| **E4. Đèn LED + ắc quy** | **420k** | 1 | 15k sạc | Ngày ≥ 11 |

**E1 — Standee QR ngân hàng** *(CANON §14, `idea.md` §19.2 — chi tiết kinh tế ở `P3-03` §2.7)*

Cơ sở thật: người Việt trung bình có **11 ngày liên tiếp mỗi tháng không tiêu một đồng tiền mặt**.

**Đây là thiết bị duy nhất trong cây KHÔNG tốn tiền mặt — và nó vẫn đắt.**

| | Không QR | Có QR |
|---|---|---|
| **Giá** | — | **0k tiền mặt.** Nhưng phải **nghỉ bán một buổi sáng** đi làm thủ tục ở ngân hàng: **−650k lãi gộp** + **100k chi phí cố định vẫn mất** = **−750k** |
| `shortOfCashRate` (khách không đủ tiền mặt) | **8%** | **2%** |
| `walkAwayRate` (bỏ đi vì không trả được) | **3,5%** | **0,6%** |
| Nhu cầu tiền lẻ đầu ngày | Cao — *"khách đưa tiền lớn mà mình không có tiền thối là điềm xấu"* (`idea.md` §19.1) | Giảm ~55% |
| Thời gian mỗi lượt thanh toán | tiền mặt ~2,2 s | **QR 3,0 s** — **chậm hơn** (phải kiểm điện thoại) |

**Giá trị kinh tế** (nền 54 ổ/ngày, dùng từ ngày 9): `walkAwayRate` 3,5% → 0,6% cứu **~1,6 ổ/ngày** = **20k lãi gộp/ngày** × 32 ngày = **640k**. Cộng phần "âm tiền vốn" do sổ nợ nhớ nhầm (`P3-03` §2.6: **450–700k cả mùa**) được cắt phần lớn. **Hoà vốn khoảng ngày 22.**

- **Hệ giao nhau:** *chuyển đổi* + *sổ nợ* + *mở hàng/đốt vía* (CANON §14) + *P3-02* (tiền mặt sáng mai) + *P3-05* (cơ cấu khách theo chỗ đứng).
- **⚠️ Mặt trái 1 — chậm hơn:** +0,8 giây mỗi lượt QR. Ở cao điểm, khi `MADE_THEM_WAIT` leo thang theo giây, **cái tiện lợi lại làm hàng chờ dài ra**.
- **⚠️ Mặt trái 2 — đổi tiền lấy quan hệ:** sổ nợ là **chỗ duy nhất "nhớ nhầm" hợp trực giác** (CANON §14) và là một kênh quan hệ sâu: cho ai đó ghi sổ là nói *"tôi tin anh"*. QR **xoá bớt kênh đó**:
  - Số lần ghi sổ nợ mỗi mùa: **~26 → ~9** (từ ~2,7 lần/ngày xuống ~0,7).
  - Mất ~17 dịp sinh memory quan hệ.
- **⚠️ Mặt trái 3 — không phải ai cũng dùng:** bà Bảy, thầy Phúc, ông Hải **không quét QR** (0%). Bé Su, anh Bảo, chị Lan **gần như chỉ dùng QR** (85%). Chú Tư, anh Dũng: 50/50. Tức giá trị của QR phụ thuộc **chỗ đứng** (P3-05): rất mạnh ở *L2 cổng trường* và *L4 khu văn phòng*, gần vô dụng ở *L3 chợ sáng*.

**E2 — Loa rao**

Tiếng rao (thu sẵn, giọng thật, **không AI voice** — CANON §2):

> *"Bánh mì Sài Gòn, đặc ruột thơm bơ, một ngàn một ổ…"*

| | Tắt loa | Bật loa |
|---|---|---|
| Khách vãng lai | — | **+18%** |
| Khách quen | — | +0% (họ tới vì bạn, không vì loa) |
| `overhearRadius` (nghe lỏm gossip) | — | **×0,70** |
| `neighborAnnoyance` | — | **+1 / ngày bật** |

- **Hệ giao nhau:** *lưu lượng* + *đồn thổi* (loa át tiếng → bạn nghe lỏm kém đi) + *P3-05* (`neighborAnnoyance` → mất chỗ đứng).
- **⚠️ Mặt trái — cơ chế đánh đổi đầy đủ:**

```ts
// world/neighbors.ts
function tickNeighborAnnoyance(st: DayState) {
  if (st.equip.has('LOA_RAO') && st.loaOn) st.neighborAnnoyance += 1;
  if (st.equip.has('GHE_BAN') && st.chairsOut > 4) st.neighborAnnoyance += 1;
  if (st.wasteWaterSpilled) st.neighborAnnoyance += 2;
  st.neighborAnnoyance -= 0.5;          // nguội dần
}
```

| `neighborAnnoyance` | Chuyện gì xảy ra |
|---|---|
| **≥ 7** | Cô Mai (tạp hoá đối diện) nói nhẹ, đùa: *"Con mở nhỏ nhỏ chút nghen, bà Tư nhà trên ngủ trưa."* |
| **≥ 12** | Một NPC hàng xóm vô danh phàn nàn thẳng. Khách nghe được → bark: *"Ồn quá con."* |
| **≥ 18** | **Bị nhắc nhở**: phải tắt loa **5 ngày**, hoặc chịu `+1 bậc rủi ro mất chỗ đứng` ở P3-05 |

- Và với khách `soi ≥ 0,8`, loa rao có bark nhẹ tiêu cực: *"Hồi đó cô Ba đâu cần cái loa."*

**E3 — Bảng hiệu đỏ chữ vàng**

Đây là **chi tiết môi trường bắt buộc** của CANON §14 — bảng hiệu đỏ chữ vàng nằm trong danh sách. Mua nó là làm cái xe **trở thành một địa điểm**.

| | Trước | Sau |
|---|---|---|
| Khách vãng lai | — | **+12%** |
| Mốc *"nhà tui gần xe bánh mì cô Ba"* (CANON §9 bà Sáu) | ngày ~34 | **sớm hơn ~5 ngày** |
| Nhận diện ở chỗ đứng mới (P3-05) | chậm | nhanh hơn 30% |

- **⚠️ Mặt trái — không phải là số:** người chơi phải **chọn tên trên bảng**.

| Lựa chọn | Hệ quả |
|---|---|
| **"BÁNH MÌ CÔ BA"** | Cô Ba không nói gì. Nhưng tối hôm đó, lúc đếm tiền, cô nhìn cái bảng hơi lâu. Một cảnh 20 giây. Mốc danh tiếng dùng đúng câu của bà Sáu |
| **Tên người chơi** | Cô Ba nói: *"Ờ. Cũng tới lúc rồi."* — và **cô cười**. Nhưng bà Bảy, thầy Phúc, những người biết cô Ba 20 năm, có bark riêng: *"Ủa, xe cô Ba mà?"* trong ~6 ngày đầu. Mốc danh tiếng đổi thành *"nhà tui gần xe bánh mì thằng..."* |
| **Để trống, chỉ vẽ ổ bánh** | Không ai nói gì. +12% vẫn có. **Không mở khoá cảnh nào cả.** |

  Không lựa chọn nào **đúng**. Không lựa chọn nào bị phạt. Đây là cái bảng hiệu đắt nhất 750k trong game, và giá trị lớn nhất của nó là **một câu hỏi**.

**E4 — Đèn LED + ắc quy**

- Mở khung bán **18h00–20h00** (chỉ ở chỗ có khách tối: *Đầu hẻm*, *Góc khuất*). Thêm ~**8–12 ổ/ngày** (≈ +110–150k lãi gộp) — nó tự trả hết 420k trong **~4 ngày**, và đó là lý do mặt trái phải nặng.
- **Hệ giao nhau:** *thời gian* + *cơ cấu khách* (khách tối ≠ khách sáng) + *P3-05*.
- **⚠️ Mặt trái:**
  1. Ngày dài thêm 2 giờ → `STALL_CLEANLINESS` cuối ngày **+45%**, và nó **mang sang ngày hôm sau** (giảm số khách sáng mai).
  2. **Khách tối là khách nhậu.** Ông Hải (`nongTinh` 0,9) — CANON §9 ghi rõ: *"trước 10 giờ sáng rất tử tế — đó mới là cái đau"*. Bán buổi tối nghĩa là gặp phiên bản kia của ông. Đây không phải comic relief, và người chơi mua cái đèn là **tự chọn gặp điều đó**.
  3. Ắc quy phải sạc, 15k/ngày, và **hết giữa chừng ~1 lần/mùa** → tắt đèn lúc 19h10, khách đang ăn dở.

---

#### **NHÓM F — CÁI XE**

| Món | Giá | Slot | /ngày | Mở khoá |
|---|---|---|---|---|
| **F1. Giá treo nóc xe** | **620k** | **+2** | — | Ngày ≥ 13 |
| **F2. Khung gia cố + thay bánh xe** | **1.100k** | **+2** | — | Ngày ≥ 20 |

**F1 — Giá treo nóc xe**

- **+2 slot.** Đồ để trên cao: bao bì, ly, khăn, đồ khô.
- **⚠️ Mặt trái:** lấy đồ trên cao **+1,2 s**; ngày mưa đồ trên giá **bị ướt** nếu không có D2 (dù); xe cao hơn → **dời chỗ chậm hơn +8 phút** (P3-05).

**F2 — Khung gia cố + thay bánh xe**

- **+2 slot** · thời gian dời chỗ **45 phút → 25 phút** (P3-05) · xe không rung khi có xe máy chạy qua → **`DROPPED_FOOD` −15%**.
- **Hệ giao nhau:** *P3-05* (đổi chỗ) + *perception* (giảm tần suất `DROPPED_FOOD`, salience 75).
- **⚠️ Mặt trái:** **1.100k mà gần như không làm gì cho ngày thường** nếu người chơi không bao giờ dời chỗ — chỉ còn `DROPPED_FOOD` −15% và +2 slot. Đây là món **đắt nhất tính trên mỗi slot** (550k/slot, so với F1 310k/slot). Người chơi mua nó vì hết chỗ, rồi mới phát hiện nó cũng giúp dời xe.

---

### 2.5. Bảng tổng hợp — 17 món mua được

| Món | Giá (k) | Slot | /ngày (k) | Hệ giao nhau chính | Mặt trái một dòng |
|---|---:|---:|---:|---|---|
| A1 Lò gas 2 tầng | 1.800 | +1 | 27 | Thông lượng · P3-02 | Mất mùi than, khách quen tiếc |
| A2 Dao bén | 180 | 0 | — | Perception (`FLOURISH`) | Cắt tay khi vội · phải mài |
| A3 Thớt riêng | 120 | 1 | — | Vệ sinh · đồn thổi | +1,8 s/lần đổi · quên đổi thì tệ hơn không có |
| A4 Kẹp gắp | 95 | 0 | — | `handsSoil` · thông lượng | +1,4 s/ổ · rơi kẹp khi vội |
| B1 **Tủ mát 100L** | **3.200** | **3** | **22** | Hạn dùng · P3-02 D6 | Tiền điện · 3 slot · **làm bạn điếc** (nghe lỏm ×0,8) |
| B2 Nồi ủ xíu mại | 450 | 1 | 6 | Dự báo cầu · P3-05 | Ủ >3h thì mặn, khách soi nhận ra |
| B3 Lồng bàn | 260 | 1 | — | `STALL_CLEANLINESS` · tốc độ ỉu | +0,6 s/ổ · quên đậy = vô ích |
| C1 **Vòi + bồn rửa** | **680** | 2 | 8 | **Perception (đổi slot)** · thông lượng | Hết nước giữa buổi · **nước thải tràn** |
| C2 Thùng rác nắp | 150 | 1 | — | `STALL_CLEANLINESS` · `DROPPED_FOOD` decay | +0,3 s · đầy thì phải đi đổ |
| C3 Khăn 3 màu | 60 | 0 | 3 | `handsSoil` · perception | **Dùng nhầm màu thì phản tác dụng** |
| D1 Ghế + bàn | 320 | 2 | — | **Perception (đổi zone)** · đồn thổi | Khách ngồi lại → **gossip tại quầy** · bẩn · chiếm hẻm |
| D2 Dù che | 540 | 1 | — | Thời tiết · quan hệ · P3-02 | Ngày nắng che tầm nhìn · gió lật |
| D3 Bình trà đá | 210 | 1 | 24 | Perception (§5.4) · quan hệ · C1 | 40 ly phải rửa · diminishing returns |
| E1 Standee QR | **0** *(−650k lãi gộp bỏ lỡ)* | 0 | — | Chuyển đổi · sổ nợ · đốt vía | **+3,0 s mỗi lượt** · **xoá bớt kênh quan hệ sổ nợ** |
| E2 Loa rao | 380 | 1 | 4 | Lưu lượng · đồn thổi · P3-05 | `neighborAnnoyance` · nghe lỏm ×0,7 |
| E3 Bảng hiệu | 750 | 1 | — | Danh tiếng · P3-05 | **Phải chọn để tên ai** |
| E4 Đèn + ắc quy | 420 | 1 | 15 | Thời gian · cơ cấu khách | Ngày dài → bẩn · **gặp ông Hải buổi tối** |
| F1 Giá treo | 620 | **+2** | — | Sức chứa · P3-05 | +1,2 s lấy đồ · dời chỗ chậm |
| F2 Khung gia cố | 1.100 | **+2** | — | P3-05 · `DROPPED_FOOD` | **Vô dụng nếu không dời chỗ** |
| **TỔNG** | **11.335** *(+ một buổi sáng nghỉ bán)* | **21** | **109** | | |

---

### 2.6. **Đường cong mua sắm 40 ngày**

#### 2.6.1. Ngân sách thực tế — **theo bảng hợp nhất `P3-06` §9.5**

> ✅ **Nguồn sự thật cho nghĩa vụ là CANON §13.1** (nâng lên từ `P3-06` §9.5), không phải doc này. `P3-06` đã phát hiện xung đột giữa bốn doc P3 viết song song và đề xuất một bảng duy nhất; doc này **chép lại bảng đó**. Nếu `P3-06` §9.5 đổi, mục này đổi theo.

| Khoản | Số chốt | Cả mùa (k) |
|---|---|---|
| Vốn khởi điểm | | **+3.500** |
| Lãi ròng 40 ngày (trước nghĩa vụ, sau COGS) | ~508k/ngày | **+20.330** |
| − **Rút về nhà** | **150k/ngày** | **−6.000** |
| − **Thuê chỗ `L1` đầu hẻm** | **42k/ngày** | **−1.680** |
| − **Hụi** | 500k × 8 kỳ | **−4.000** *(hốt lại 2.800–4.200k)* |
| − **Tiền học** | 1.200k × 2 (ngày **18**, **38**) | **−2.400** |
| − *Tiền thuốc cô Ba (tự nguyện)* | 600k × 2 | *−1.200* |
| − `dailyCost` thiết bị tích luỹ | trung bình ~70k/ngày | **−2.800** |
| − Vốn lưu động phải giữ | ≥1 ngày hàng + đệm | **−1.100** |
| **CÒN LẠI CHO THIẾT BỊ** | | **≈ 8.050k** |

**Hai ràng buộc, cắn gần bằng nhau:**

| Ràng buộc | Mua được / Tổng | Tỉ lệ |
|---|---|---|
| **Tiền** | 8.050k / **11.335k** | **71%** |
| **Slot** | 12 / **19** | **63%** |

Không ràng buộc nào thừa. Và vì hai ràng buộc **không cùng thứ tự ưu tiên** (tủ mát đắt *và* chiếm slot; standee QR miễn phí *và* 0 slot; khung gia cố đắt nhưng *cho* +2 slot), người chơi không thể tối ưu cả hai bằng một chiến lược duy nhất.

**Hình dạng của áp lực — và vì sao nó tốt hơn ba cú lớn:**

`P3-06` §9.5 chỉ ra rằng khi thêm dòng **rút về nhà 150k/ngày**, áp lực kinh tế **chuyển từ ba cú lớn sang một dòng chảy đều cộng vài cú vừa**. Với cây thiết bị, đó là khác biệt quyết định:

| Mô hình áp lực | Hệ quả lên quyết định mua thiết bị |
|---|---|
| Ba cú lớn (2.700k, mô hình cũ) | Người chơi **chỉ phải nghĩ 3 lần cả mùa**. Giữa các cú thì tiêu thoải mái |
| Dòng chảy đều + cú vừa | **Mỗi tối đều có câu hỏi "mua hay để dành".** Đúng pha Tối mà `P3-01` §2.1 thiết kế: *"⑰ mua thiết bị hay để dành"* |

Ba mốc vẫn đau, chỉ là đau vừa và đau nhiều lần hơn:

| Ngày | Khoản | Trời (lịch `P3-01`) |
|---|---|---|
| **5, 10, 15, 20, 25, 30, 35, 40** | Hụi **500k** | ngày 10 và 25 **mưa rào** |
| **18** | Tiền học **1.200k** | ngày 17 **mưa dầm**, ngày 18 **mưa rào** — và `P3-05` E-2 ngập chợ |
| **38** | Tiền học **1.200k** | **mưa dầm** |
| **mỗi ngày** | Rút về nhà **150k** + thuê chỗ **42k** + cố định **100k** | không bao giờ ngừng |

> **Luật vàng của pha Tối:** *đừng mua gì trong 2 ngày trước ngày 18 hoặc ngày 38.* Game không nói câu đó. Ngày 18 nói hộ.

#### 2.6.2. Mốc và nhịp

Nhịp mua bị ép bởi **ba cú nghĩa vụ** (ngày 10, 25, 38) chứ không phải bởi một đường tiền đều.

| Giai đoạn | Ngày | Mua được | Tiền dư tích được | Cảm giác |
|---|---|---|---|---|
| **Giai đoạn đồ nghề** | 1–8 | 3–5 món slot-0 / rẻ (A2 180, A4 95, C3 60, C2 150, D3 210, **E1 0k**) | ~**900k** (vốn khởi điểm 3.500k − vốn lưu động) | "Mỗi ngày mua được một thứ" — nhịp nhanh, thưởng liên tục, rủi ro thấp |
| ⛔ **Ngày 10** | 10 | — | **−500k** hụi, mưa rào | Cú đầu tiên. Nhỏ, nhưng dạy nhịp |
| **Quyết định đầu tiên** | 11–17 | **C1 vòi+bồn (680k)** hay **D1+D2 ghế+dù (860k)**? | ~**2.100k** | Quyết định lớn đầu tiên, và nó **định hướng cả lối chơi** |
| **Trung cuộc** | 18–24 | 1 món lớn: **A1 lò gas (1.800k)** *hoặc* **E3 bảng hiệu (750k) + 2 món vừa** | ~**2.900k** | Xe bắt đầu nhìn khác đi rõ rệt |
| ⛔ **Ngày 18** | 18 | — | **−1.200k** tiền học + hụi ngày 20, mưa rào + ngập chợ | **Không được mua gì ngày 16–17.** Ai lỡ mua là ai không trả nổi |
| **Quyết định lớn nhất** | 20–32 | **B1 tủ mát (3.200k)** — hay **không bao giờ**? | ~**3.400k** | Mua = 6–7 ngày không mua được gì khác. Không mua = 4 món vừa + đóng trục D6 của P3-02 cả mùa |
| **Hoàn thiện** | 31–36 | 1–2 món còn thiếu + F1/F2 nếu đã hết slot | ~**1.400k** | Lấp chỗ trống. Chi phí cố định vừa lên 115k từ ngày 33 |
| ⛔ **Ngày 38** | 38 | — | **−1.200k** tiền học, mưa dầm | Cú cuối. Và ngày 40 còn hụi kỳ 8 |
| **Tuần cuối** | 37–40 | Thường **không mua gì** — dồn tiền cho tiền học ngày 38 và hụi kỳ 8 ngày 40 | — | Đúng: cuối mùa là lúc nhìn lại, không phải lúc mua sắm |

> **Nhịp có chủ ý:** dày ở tuần 1 (để học cơ chế), một quyết định đau ở ngày 11–17, một quyết định rất đau ở ngày 20–32, rồi thưa dần. **Không có món nào mở khoá sau ngày 20** — vì T4: mùa phải kết được, không được treo cà rốt ở ngày 45.
>
> **Đòn bẩy lớn nhất không nằm trong bảng này:** hốt hụi. `P3-06` §2.3 ghi hốt **kỳ 2 (ngày 10)** cho **2.800k tiền mặt** đổi lấy 1.200k lãi — tức **mua được cái tủ mát sớm 12 ngày**. Đó là quyết định tài chính lớn nhất của mùa, và nó thuộc về `P3-06`, không phải doc này.

#### 2.6.3. Ba lối chơi — cả ba đều đi được

> Cột **Slot** = tổng slot đã dùng cho đồ mua thêm. Trần: **8** (ngày 1) → **10** nếu có F1 → **12** nếu có cả F1 và F2.
> A1 và B1 chỉ ăn **+1 slot ròng** vì chúng thay lò than / thùng xốp (§2.2).
> Ngân sách: **≈ 8.050k** (§2.6.1, theo bảng hợp nhất `P3-06` §9.5).

**LỐI 1 — Đầu tư VỆ SINH** *("cái xe sạch nhất hẻm")*

| Ngày | Mua | Giá (k) | Cộng dồn (k) | Slot |
|---|---|---|---|---|
| 2 | A4 kẹp gắp | 95 | 95 | 0 |
| 4 | C2 thùng rác có nắp | 150 | 245 | 1 |
| 5 | C3 khăn 3 màu · A3 thớt riêng | 60 + 120 | 425 | 2 |
| 6 | B3 lồng bàn | 260 | 685 | 3 |
| 8 | E1 standee QR | **0** *(−750k một buổi sáng)* | 685 | 3 |
| **12** | **C1 vòi + bồn rửa** ⭐ | 680 | **1.365** | **5** |
| 15 | A2 dao bén | 180 | 1.545 | 5 |
| 19 | F1 giá treo | 620 | 2.165 | 5 *(trần → 10)* |
| **22** | **B1 tủ mát** *(thay thùng xốp, ròng +1)* | 3.200 | **5.365** | **6** |
| 29 | D1 ghế + bàn | 320 | 5.685 | 8 |
| 33 | D3 bình trà đá | 210 | 5.895 | 9 |
| — | *(không mua E3 bảng hiệu — hết tiền)* | | **5.895** | **9 / 10** |

**Đặc trưng:** `STALL_CLEANLINESS` gần như không bao giờ chạm ngưỡng · `DIRTY_HANDS` **~3 lần cả mùa** (so với ~22 ở lối 2) · khách `soi` cao (bà Bảy, thầy Phúc, chị Lan) **lên `Friend` sớm nhất** · có tủ mát → trục D6 của P3-02 mở.
**Cái mất:** **không có A1 lò gas** → cao điểm luôn căng, `BURNT_OR_COLD` ~14 lần/mùa, và ổ ỉu của lò rẻ không nướng lại kịp. Không có bảng hiệu → khách vãng lai thấp nhất.

---

**LỐI 2 — Đầu tư THÔNG LƯỢNG** *("bán được nhiều nhất")*

| Ngày | Mua | Giá (k) | Cộng dồn (k) | Slot |
|---|---|---|---|---|
| 2 | A4 kẹp gắp | 95 | 95 | 0 |
| 3 | A2 dao bén | 180 | 275 | 0 |
| 8 | E1 standee QR | **0** | 275 | 0 |
| 9 | B2 nồi ủ xíu mại | 450 | 725 | 1 |
| **13** | **A1 lò gas 2 tầng** ⭐ *(thay lò than, ròng +1)* | 1.800 | **2.525** | **2** |
| 18 | E2 loa rao | 380 | 2.905 | 3 |
| **22** | **B1 tủ mát** *(ròng +1)* | 3.200 | **6.105** | **4** |
| 31 | C1 vòi + bồn rửa | 680 | 6.785 | 6 |
| — | *(không mua ghế, dù, bảng hiệu, đèn)* | | **6.785** | **6 / 8** |

**Đặc trưng:** bán **~62–68 ổ/ngày** ở đầu hẻm (so với 54 chuẩn) vì thông lượng cao điểm không còn là nút cổ chai · biên lợi nhuận cao nhất · **mua được cả tủ mát lẫn lò gas** — lối duy nhất làm được điều đó · còn dư 2 slot mà không cần F1/F2.
**Cái mất:** C1 mua muộn (ngày 31) → **30 ngày sống với `DIRTY_HANDS`**; không ghế, không dù → ngày mưa mất đủ 40% khách; `neighborAnnoyance` leo vì loa rao; **chị Lan (`soi` 0,9, `deTha` 0,2) rất dễ im lặng biến mất trước ngày 20**.

---

**LỐI 3 — Đầu tư TIẾP KHÁCH** *("ai cũng muốn ngồi lại")*

| Ngày | Mua | Giá (k) | Cộng dồn (k) | Slot |
|---|---|---|---|---|
| 2 | A4 kẹp · 3: A2 dao bén | 95 + 180 | 275 | 0 |
| 4 | D3 bình trà đá · C2 thùng rác | 210 + 150 | 635 | 2 |
| 5 | D1 ghế + bàn · C3 khăn 3 màu | 320 + 60 | 1.015 | 4 |
| 8 | E1 standee QR | **0** | 1.015 | 4 |
| **12** | **C1 vòi + bồn** *(bắt buộc — 40 ly/ngày phải rửa)* | 680 | **1.695** | **6** |
| 14 | D2 dù che lớn | 540 | 2.235 | 7 |
| 17 | F1 giá treo | 620 | 2.855 | 7 *(trần → 10)* |
| **20** | **E3 bảng hiệu đỏ chữ vàng** ⭐ | 750 | **3.605** | **8** |
| 24 | E4 đèn + ắc quy | 420 | 4.025 | 9 |
| 28 | E2 loa rao | 380 | 4.405 | 10 |
| 32 | F2 khung gia cố | 1.100 | 5.505 | 10 *(trần → 12)* |
| 35 | B3 lồng bàn · A3 thớt riêng | 260 + 120 | **5.885** | **12 / 12** |

**Đặc trưng:** **mua được nhiều món nhất (14/17)** vì toàn món rẻ · `CARED_FOR_THEM` liên tục · khách quen lên `Friend` nhanh nhất · **gossip chạy mạnh nhất** (khách ngồi lại nói chuyện → 1 hop mỗi 6 phút) → cả tin tốt lẫn tin xấu lan gấp đôi · là lối duy nhất **lấp kín 12/12 slot**.
**Cái mất:** **không bao giờ mua được tủ mát** (3.200k không còn, và slot đã đầy) → **trục D6 của P3-02 đóng cả mùa**: phải mua hàng từng ngày, không ôm được thịt rẻ ngày T5, không đỡ được cú dịch heo ngày 8–12 → chi phí nguyên liệu cao hơn **~6%** ≈ **−1.900k cả mùa**. Và `STALL_CLEANLINESS` cao nhất vì khách ngồi.

---

#### 2.6.4. Kiểm tra: ba lối có thật sự khác nhau?

| | **Lối 1 Vệ sinh** | **Lối 2 Thông lượng** | **Lối 3 Tiếp khách** |
|---|---|---|---|
| Số món mua | 11 | **9** | **14** |
| Tiền tiêu | 5.895k | **6.785k** | 5.885k |
| Slot dùng / trần | 9 / 10 | **6 / 8** | **12 / 12** |
| Ổ bán / ngày cuối mùa | 56 | **66** | 60 |
| `DIRTY_HANDS` cả mùa | **3** | **22** | 6 |
| `BURNT_OR_COLD` cả mùa | **14** | **4** | 11 |
| Số NPC đạt `Friend` ngày 40 | 7 | **4** | **9** |
| Có tủ mát? | ✅ ngày 22 | ✅ ngày 22 | ❌ **không bao giờ** |
| Có lò gas? | ❌ | ✅ ngày 13 | ❌ |
| Có bồn rửa (C1)? | ✅ **ngày 12** | ✅ ngày 31 | ✅ ngày 12 |
| Trục D6 (mua gộp, P3-02) | Mở | Mở | **Đóng cả mùa** |

**Ba lối bị chặn bởi ba thứ khác nhau** — lối 1 hết chỗ, lối 2 hết tiền (phải bán lại một món), lối 3 hết chỗ **dù còn dư 2.165k**. Đó là bằng chứng rằng hai ràng buộc ở §2.2 không thừa cái nào.

**Món trùng ở cả ba lối: A2 dao bén · A4 kẹp gắp · E1 standee QR · C1 vòi + bồn — đúng 4/17.**

Ba lối cho ba con số khác nhau ở **mọi hàng trừ một**, và câu kết game *"ai còn ở đó với mình"* (CANON §15) ra **7 / 4 / 9**.

> **Chú ý hàng quan trọng nhất:** cả ba lối đều mua **C1 vòi + bồn rửa**. Nó là món duy nhất không lối nào bỏ được — và đó là bằng chứng §2.4 nhóm C nói đúng: **C1 là thiết bị quan trọng nhất về mặt thiết kế.** Cái khác nhau giữa ba lối không phải *có mua hay không*, mà là **mua vào ngày 12 hay ngày 31** — và 19 ngày đó là 19 ngày sống với `DIRTY_HANDS`.

---

### 2.7. **Không có bảng achievement** — cái xe LÀ bảng thành tựu

> `idea.md` §3 Trục B: *"Thành tựu ở đây cảm nhận được bằng mắt và bằng tay, không cần bảng achievement."*

**Luật:** game này **không có** màn hình achievement, **không có** popup "Đã mở khoá", **không có** danh sách đánh dấu ✓. Toàn bộ tiến trình đọc bằng ba thứ: **cái xe**, **cách NPC gọi bạn**, và **ai còn ở đó ngày 40**.

#### Cái xe — NGÀY 1

> Một cái xe đẩy inox đã cũ, sơn viền xanh bong tróc ở góc phải. Trên mặt xe: **một lò than nhỏ**, đen sì, tro còn bám mép; **một thùng xốp** dán băng keo vá ở nắp; một cái thớt duy nhất, mặt thớt có vết dao sâu thành rãnh. Một con dao cùn để ngửa trên thớt. Một cái rổ nhựa đựng rau. Ba cái hũ sành: ớt, muối tiêu, xì dầu. Một cái chậu nước **để dưới gầm**, khuất sau tấm bạt.
>
> Bên hông xe treo một bịch nilon làm thùng rác. Không có bảng hiệu — chỉ có một tấm bìa carton viết tay **"BÁNH MÌ"** bằng bút lông, chữ hơi nghiêng, góc bìa quăn vì mưa hôm nào đó.
>
> Không có ghế. Khách đứng.
>
> Đèn đường hẻm hắt xuống một bên xe; bên kia tối.

#### Cái xe — NGÀY 40 *(lối 1 — vệ sinh)*

> Vẫn cái xe đó. Vẫn vết sơn bong ở góc phải — **không ai sửa nó, và đó là chủ ý.**
>
> Trên mặt xe giờ có **một lò than đã lau sạch tro**, một **tủ mát mini** kêu ro ro ở bên trái, **lồng bàn** đậy phần bánh chưa bán, **ba cái thớt xếp chồng** (xanh, đỏ, trắng), một con dao **sáng lưỡi** cắm trong ống tre. Ba cái khăn ba màu treo thành hàng trên thanh ngang, thẳng thớm.
>
> Bên phải xe: **một cái bồn inox nhỏ, có vòi.** Vòi đang nhỏ giọt. Đây là thứ đầu tiên khách nhìn thấy khi bước tới.
>
> Thùng rác **có nắp**, đạp chân, kê sát bánh xe. Bốn cái ghế nhựa đỏ xếp chồng dưới gầm, hai cái đã bày ra, một cái đang có người ngồi.
>
> Trên đầu xe: **bảng hiệu đỏ chữ vàng — "BÁNH MÌ CÔ BA"**. Còn tấm bìa carton cũ? Nó vẫn ở đó, **nhét sau bảng hiệu mới**, không ai vứt.
>
> Bên hông có **mã QR** ép plastic, góc đã hơi mờ vì tay người quẹt qua nhiều lần.

**Không có một con số nào trong hai đoạn mô tả trên.** Người chơi đọc được 40 ngày của mình bằng cách nhìn.

#### Ba mốc "nhìn thấy được" khác (CANON §9, §19.2)

| Mốc | Trước | Sau |
|---|---|---|
| Cách bà Sáu chỉ đường | *"nhà tui gần chỗ bán tàu hũ"* | ***"nhà tui gần xe bánh mì cô Ba"*** |
| Cách bà Tám (lò bánh, P3-02 §2.4) gọi bạn | *"con"* | *"con Ba"* → *"cưng"* |
| Chỗ khách đứng | Đứng chờ ở mép hẻm | Tự kéo ghế ngồi, tự rót trà đá |

---

## 3. Dữ liệu & schema

```ts
// craft/equipment.ts
export type EquipId =
  | 'LO_THAN' | 'LO_GAS' | 'DAO_BEN' | 'THOT_RIENG' | 'KEP_GAP'
  | 'THUNG_XOP' | 'TU_MAT' | 'NOI_U' | 'LONG_BAN'
  | 'VOI_BON' | 'THUNG_RAC' | 'KHAN_3_MAU'
  | 'GHE_BAN' | 'DU_CHE' | 'BINH_TRA'
  | 'BANG_QR' | 'LOA_RAO' | 'BANG_HIEU' | 'DEN_LED'
  | 'GIA_TREO' | 'KHUNG_GIA_CO';

export type Equipment = {
  id: EquipId;
  group: EquipGroup;
  name: string;
  price_k: number;
  resale_k: number;                 // = price_k * 0.6
  slots: number;                    // âm nếu CỘNG slot (giá treo: -2)
  dailyCost_k: number;
  unlock: { minDay: number; requires?: EquipId[]; afterEvent?: StimId; minRelation?: [NpcId, RelationTier] };
  replaces?: EquipId;
  effects: EquipEffect[];
  drawbacks: Drawback[];            // BẮT BUỘC ≥ 1 (Luật TB-3)
  visual: { sprite: string; anchor: CartAnchor; layer: number };   // BẮT BUỘC (Luật TB-1a)
  feelChange: string;               // BẮT BUỘC (Luật TB-1b) — mô tả cho designer, không hiện trong game
  crossSystem: SystemId[];          // BẮT BUỘC ≥ 1 (Luật TB-1c)
};

export type Drawback =
  | { kind: 'DAILY_COST'; amount_k: number }
  | { kind: 'SLOT_COST'; slots: number }
  | { kind: 'TIME_COST'; op: OperationId; deltaMs: number }
  | { kind: 'NEW_FAILURE'; stim: StimId; oddsPerUse: number }
  | { kind: 'SYSTEM_PENALTY'; stat: string; mul: number }
  | { kind: 'RELATION_COST'; npcFilter: NpcFilter; barkPool: string };
```

**Ví dụ content thật** — `content/equipment.json` (trích 2 món):

```json
[
  {
    "id": "VOI_BON",
    "group": "VE_SINH",
    "name": "Vòi nước gắn xe + bồn rửa nhỏ",
    "price_k": 680, "resale_k": 408, "slots": 2, "dailyCost_k": 8,
    "unlock": { "minDay": 7, "afterEvent": "DIRTY_HANDS_CONFIRMED_FIRST" },
    "effects": [
      { "kind": "TIME",       "op": "RUA_TAY", "deltaMs": -4500 },
      { "kind": "PERCEPTION", "slot": "HANDS", "zone": "*", "mul": 1.0,
        "note": "thao tác RUA_TAY chuyển từ slot UNDER_COUNTER sang HANDS" },
      { "kind": "STATE",      "stat": "handsSoil", "mul": 0.0 }
    ],
    "drawbacks": [
      { "kind": "DAILY_COST", "amount_k": 8 },
      { "kind": "SLOT_COST",  "slots": 2 },
      { "kind": "NEW_FAILURE", "stim": "WASTE_WATER_SPILL", "oddsPerUse": 0.0,
        "note": "kích hoạt khi xô nước thải đầy, không phải xác suất" }
    ],
    "visual": { "sprite": "cart/bon_rua.png", "anchor": "RIGHT_EDGE", "layer": 3 },
    "feelChange": "Rửa tay từ 'phải cúi xuống gầm 7 giây, không ai thấy' thành 'quay phải 2,5 giây, cả hàng đều thấy'.",
    "crossSystem": ["PERCEPTION", "THROUGHPUT", "RELATION", "EQUIPMENT_D3"]
  },
  {
    "id": "LOA_RAO",
    "group": "VAN_HANH",
    "name": "Loa rao",
    "price_k": 380, "resale_k": 228, "slots": 1, "dailyCost_k": 4,
    "unlock": { "minDay": 10 },
    "effects": [
      { "kind": "FLOW",  "stat": "traffic", "mul": 1.18, "appliesTo": "VANG_LAI" },
      { "kind": "STATE", "stat": "overhearRadius", "mul": 0.70 }
    ],
    "drawbacks": [
      { "kind": "SYSTEM_PENALTY", "stat": "neighborAnnoyance", "mul": 1.0, "perDay": 1 },
      { "kind": "SYSTEM_PENALTY", "stat": "overhearRadius", "mul": 0.70 },
      { "kind": "RELATION_COST", "npcFilter": { "soiMin": 0.8 }, "barkPool": "LOA_RAO_CHE" }
    ],
    "visual": { "sprite": "cart/loa.png", "anchor": "TOP_LEFT", "layer": 5 },
    "feelChange": "Có tiếng rao chạy nền suốt buổi. Quầy ồn hơn, đông hơn, và bạn nghe lỏm kém hơn.",
    "crossSystem": ["TRAFFIC", "GOSSIP", "LOCATION_P3_05"],
    "audio": {
      "clip": "rao_banh_mi_sai_gon.ogg",
      "text": "Bánh mì Sài Gòn, đặc ruột thơm bơ, một ngàn một ổ…",
      "note": "Thu giọng người thật, miền Nam. KHÔNG AI voice (CANON §2)."
    }
  }
]
```

---

## 4. UI/UX hai thiết bị

**Không có "cửa hàng nâng cấp".** Thiết bị mua ở hai chỗ:

| Chỗ | Món | Vì sao ở đó |
|---|---|---|
| **Tiệm tạp hoá cô Mai** (đối diện) | A2, A4, C2, C3, D3, B3, E1 — đồ rẻ, slot 0/1 | Cô Mai là NPC có sẵn (CANON §9 #7), *"làm ăn được"*. Mua đồ ở đó **là một cuộc nói chuyện**, không phải mở menu |
| **Chợ đồ nghề (màn `MarketScene`, khu riêng)** | A1, B1, B2, C1, D1, D2, E2, E3, E4, F1, F2 | Đồ lớn phải đi chọn, phải hỏi giá, phải chở về |

| Yếu tố | PC | Mobile (v2) |
|---|---|---|
| Xem cây thiết bị | Màn `EveningScene` → **nhìn vào chính cái xe**, các chỗ trống trên xe **sáng nhẹ** khi rê chuột | Chạm vào chỗ trống trên xe |
| Thông tin món | Hiện **giá, slot, chi phí/ngày, và MỘT CÂU mô tả cảm giác** — không hiện bảng số hiệu ứng | Như PC |
| Hiệu ứng số | **Không hiện.** Người chơi phải **dùng mới biết**. Sổ tay (P2-06) là nơi họ tự ghi lại *"dao mới rạch dễ hơn hẳn"* | Như PC |
| Slot còn trống | Vẽ bằng **ô bóng mờ trên mặt xe**, đếm được bằng mắt. Không có "8/14" | Như PC |
| Mua | Một nút. Một bước xác nhận (CANON §15.5) | Chạm-để-đặt |
| Gỡ / bán lại | Kéo món ra khỏi xe → hỏi xác nhận + **cảnh báo giá bán lại 60%** | Nhấn giữ |
| Sau khi mua | **Không có popup.** Món xuất hiện trên xe. Sáng hôm sau, cô Ba có thể nhắc một câu | Như PC |

**Trợ năng:**
- Chạm-để-đặt thay kéo-thả + Hoàn tác + xác nhận trước khi mua (CANON §15.5 — ba cái đi chung).
- Các món trên xe phải khác nhau về **HÌNH DÁNG**, không chỉ màu (CANON §15) — đặc biệt ba cái khăn C3: khác màu **và** khác hình gấp.
- Công tắc **giảm chuyển động**: tắt hiệu ứng nhấp nháy khi slot trống.
- Tiếng loa rao E2 nằm ở **kênh "đường phố"** trong 5 kênh âm thanh tách rời (CANON §15.4) → tắt riêng được.

---

## 5. Tham số cần tune

| Tên | Khởi điểm | Khoảng | Cách đo |
|---|---|---|---|
| `baseSlots` | **12** | 10–14 | Ngày 1 phải còn **8 slot trống** — đủ để cảm thấy có chỗ, không đủ để mua bừa |
| `maxSlots` | **16** | 14–18 | Tỉ lệ mua được theo slot phải nằm **60–70%** cây (hiện 63%) |
| Ngân sách thiết bị 40 ngày | **8.050k** | 7.000–9.000k | Nếu >85% người chơi mua được món họ muốn → tăng giá hoặc giảm slot |
| Giá B1 tủ mát | 3.200k | 2.600–3.800k | Phải bằng **~6 ngày lợi nhuận giữa mùa**. Người chơi phải **do dự ≥2 ngày** trước khi mua |
| `TU_MAT` slot (ròng, sau khi bỏ thùng xốp) | **+1** | +1 → +3 | Nếu tủ mát **không** thay được thùng xốp (ròng +3) thì không lối chơi nào mua nổi → cây chết một nhánh |
| Giá C1 vòi + bồn | 680k | 500–850k | Phải mua được **trong tuần 1–2** ở mọi lối chơi. Đây là món **không được đắt** |
| `RUA_TAY` trước / sau C1 | 7,0 s / 2,5 s | 6–8 / 2–3,5 | Đo tỉ lệ người chơi **chủ động rửa tay** trước/sau: mục tiêu **<25% → >75%** |
| `FLOURISH` window A2 | 0,22 → 0,38 s | 0,18–0,45 | Tỉ lệ trúng của playtester: **~28% → ~65%** |
| `MISSING_CHARCOAL_AROMA` odds | 0,18/lượt | 0,10–0,30 | Phải xảy ra **3–6 lần** trong 28 ngày sau khi mua lò gas. Nhiều hơn = phiền |
| `neighborAnnoyance` ngưỡng | 7 / 12 / 18 | ±4 | Bật loa **mỗi ngày** phải chạm 18 vào khoảng **ngày 28** — tức có hậu quả trong mùa |
| `SEATED_FAR` visibility[HANDS] | 0,10 | 0,08–0,15 | CANON §5 — **không được đổi** trừ khi sửa CANON |
| Gossip hop khi khách ngồi | +1 hop/6 phút | 4–10 ph | Đo: có ghế phải làm gossip chạy **nhanh hơn ~1,8×** |
| `overhearRadius` mul (B1 + E2) | 0,80 × 0,70 | — | Mua cả hai → 0,56. Phải **vẫn nghe lỏm được** ở `FRONT_CENTER`, chỉ mất ở góc hẻm |
| `dailyCost` tổng nếu mua nhiều | 109k | 80–140k | Phải khớp mốc **100k/ngày** của `P3-01` ở cấu hình giữa mùa, và **không vượt 140k** ở cấu hình tối đa — tức ≤ **20% lãi gộp ngày (680k)** |
| Tỉ lệ bán lại | 60% | 50–70% | Đủ đau để không mua bừa; đủ cao để fail mềm P3-06 có lối thoát |

---

## 6. Tiêu chí đạt

- [ ] **Luật TB-1 được kiểm tự động.** Mỗi entry trong `equipment.json` có đủ `visual`, `feelChange`, và `crossSystem.length >= 1`. Build fail nếu thiếu.
- [ ] **Luật TB-2 được kiểm tự động.** 0 entry có `EquipEffect` loại `AUTO`. Grep: không có thiết bị nào gọi `assembly.commit()`.
- [ ] **Luật TB-3 được kiểm tự động.** Mỗi entry có `drawbacks.length >= 1`.
- [ ] **Luật TB-4:** sim 40 ngày với chiến lược tối ưu tiền trên nền `P3-03` + nghĩa vụ `P3-06` §9.5 → **không bao giờ** mua được quá **12/19 slot** và quá **8.050k**, tức **≤ 71% cây thiết bị** theo cả hai thước đo.
- [ ] **Ba lối chơi đều đi được:** sim cả ba lối ở §2.6.3 → cả ba **không phá sản**, cả ba trả đủ nghĩa vụ, cả ba có **≥4 NPC đạt `Friend`** ngày 40.
- [ ] **Ba lối chơi khác nhau thật:** ≤5/17 món trùng ở cả ba lối (hiện **4**: A2, A4, E1, C1).
- [ ] **Ba cú nghĩa vụ vẫn trả được ở cả ba lối:** sim ngày 10, 25, 38 → **0/3 lối phá sản**, và **≥1/3 lối phải bán lại một món** ít nhất một lần (nếu 0/3 phải bán thì ngân sách đang quá rộng; nếu 3/3 thì quá chặt).
- [ ] **`dailyCost` không vượt trần:** cấu hình mua nhiều nhất (lối 3) có tổng chi phí cố định **≤ 140k/ngày**, tức ≤ 20% lãi gộp ngày.
- [ ] **C1 đổi hành vi:** playtest — tỉ lệ người chơi chủ động rửa tay **<25% trước C1**, **>75% sau C1**.
- [ ] **Tiến trình đọc được không cần số:** cho 10 người xem ảnh cái xe ngày 1 và ngày 40, không có UI, hỏi *"người này đã làm được gì trong 40 ngày?"* → **≥8/10 kể được ≥3 điều đúng**.
- [ ] **Không có popup achievement nào.** Grep codebase: 0 kết quả cho `achievement`, `unlocked_toast`, `progress_bar`.
- [ ] **Không có thiết bị thuần lợi:** hỏi 10 playtester *"món nào bạn tiếc khi mua?"* → **≥6/10 nêu được ít nhất một món**, và các câu trả lời **không dồn vào cùng một món**.
- [ ] **Quyết định tủ mát là quyết định thật:** trong 10 playtester, **4–7 người mua** B1. (Nếu 9–10 mua hoặc 0–1 mua → giá/slot sai.)

---

## 7. Rủi ro & cách bịt

### 7.1. Bảng 6 câu hỏi (bắt buộc theo PL-A §2.8)

| # | Câu hỏi | Trả lời |
|---|---|---|
| Q1 | Người chơi còn bị nhìn? | **Có — nhiều hơn.** C1 chuyển rửa tay từ `UNDER_COUNTER` (0,05) sang `HANDS` (0,95). Mọi thiết bị đều **nằm trong khung hình** (`visual` bắt buộc) |
| Q2 | Còn nói chuyện bằng nguyên liệu? | **Có.** Luật TB-2 khoá cứng: không thiết bị nào ráp bánh. Thiết bị đổi **cách tay làm**, không đổi **ai làm** |
| Q3 | Quyết định mới mỗi sáng? | **Một phần.** Mua thiết bị là quyết định **mỗi vài ngày**, không mỗi sáng — đúng nhịp của nó. Nhưng **dùng** thiết bị là quyết định mỗi giây (đậy lồng bàn hay không, dùng khăn màu nào, thu dù hay để) |
| Q4 | Có hiện số quan hệ / thanh tiến trình? | **Không.** Không achievement, không progress bar, không "8/14 slot". Slot đếm bằng **ô bóng mờ trên xe** |
| Q5 | Kết trong 40 ngày? | **Có.** Món cuối mở khoá **ngày 20**; không có gì mở sau ngày 22; tuần cuối không ai mua gì |
| Q6 | Rủi ro đọc được trước? | **Có.** Mặt trái của mỗi món **hiện ngay lần dùng đầu tiên** (kẹp chậm hơn ngay lần gắp đầu; lò gas mất mùi than ngay ổ đầu tiên bán cho thầy Phúc) |

### 7.2. Lỗ hổng ăn gian (CANON §8)

| # | Ăn gian | Cách bịt |
|---|---|---|
| **i** | Spam `CARED_FOR_THEM` bằng trà đá / ghế vì đã có thiết bị | **Diminishing returns** đã chốt: >3 lần/5 ngày cho cùng khách → người tinh ý nhận ra đang mua chuộc → **phản tác dụng**. D3 làm hành vi này **rẻ hơn**, không làm nó **hiệu quả hơn** |
| **a** | Dùng D1 (ghế) để dìm `visibility` xuống 0,10 rồi làm ẩu thoải mái | Ghế chỉ áp dụng cho khách **đã nhận bánh và ngồi xuống**. Khách **đang chờ** vẫn ở `FRONT_CENTER`/`QUEUE_*`. Muốn mọi khách ngồi thì phải **không có ai đang chờ** — tức đã hết cao điểm |
| **j** | Tích trữ khi giá đáy nhờ tủ mát | Tủ mát **6 khay** là trần cứng. Và **22k/ngày** tiền điện chạy vĩnh viễn: ôm hàng rẻ mà không bán kịp thì tiền điện ăn hết phần lời |
| **l** | Đóng cửa sớm | `dailyCost` tổng (62k nền → 109k giữa mùa → tới 138k tối đa) chạy **kể cả ngày nghỉ**. Càng nhiều thiết bị, đóng cửa sớm càng đắt. **Thiết bị làm lỗ hổng (l) tự bịt chặt hơn theo thời gian** |
| **g** | Micro-cheat dễ hơn nhờ thiết bị (ghế che mắt) | Hệ phát hiện pattern (P2-05) **không dùng perception** — nó đếm nguyên liệu vs số ổ. Ghế không giúp gì |
| **e** | Save-scum để tránh sự kiện hỏng thiết bị (gió lật dù, hết gas) | Seed cố định theo ngày. Và **mọi sự kiện hỏng đều có cảnh báo trước**: bình gas có vạch, ắc quy có đèn báo, xô nước thải nhìn thấy mực nước |

### 7.3. Rủi ro thiết kế

| Rủi ro | Mức | Cách bịt |
|---|---|---|
| **Thiết bị trượt thành tycoon** — người chơi bắt đầu tối ưu bảng tính thay vì nhìn khách | **Cao** | (1) **Không hiện số hiệu ứng ở đâu cả** — người chơi phải cảm. (2) Không có màn hình "cửa hàng", mua đồ là nói chuyện với cô Mai. (3) `dailyCost` làm "mua nhiều" **không phải luôn tốt** |
| **Người chơi mua sai rồi kẹt cả mùa** | Trung bình | Bán lại 60%. Và mở khoá theo `minDay` **giãn đều** → không ai tiêu sạch tiền ở ngày 8 |
| **Tủ mát trở thành bắt buộc** (mọi lối đều phải mua) | Trung bình | 3 slot + 22k/ngày + `overhearRadius ×0,8`. Lối 3 chứng minh **không mua cũng đi được trọn mùa** |
| **Quá nhiều món, tuần 1 bị ngợp** | Trung bình | `minDay` chặn: ngày 1–3 chỉ có **2 món** mua được (A4, A2). Cây mở dần |
| **Vi phạm Đừng-1** (mô phỏng sâu cái không nhìn thấy) | Trung bình | Mọi thiết bị có `visual` bắt buộc — **nếu không vẽ được trên xe thì không vào game**. Không có thiết bị "trong kho", "ở nhà", "đang bảo trì" |
| **Vi phạm Đừng-4** (chi phí animation) | **Cao** | Thiết bị là **sprite tĩnh xếp lớp** trên xe (layered sprite, CANON §16 Đừng-4). Chỉ 4 món có animation, mỗi món **2–3 frame**: vòi nhỏ giọt, lửa lò, dù lay, đèn hắt. 19 món × ~2 sprite = **~40 file**, không phải 19 bộ animation |
| **Lò gas làm mất chất Việt Nam** | Trung bình | Đó **là** chuyện thật — xe bánh mì Sài Gòn dùng cả hai. Và sự kiện `MISSING_CHARCOAL_AROMA` biến nó thành **một mất mát được thừa nhận**, không phải một sự thay thế im lặng |
| **E3 bảng hiệu: chọn tên mình bị đọc là "phản bội cô Ba"** | **Cao** | Cô Ba **cười và nói "cũng tới lúc rồi"**. Game **không phạt**. Lằn ranh: không lựa chọn nào bị đánh giá — khác biệt chỉ nằm ở **ai nói gì**, đúng nguyên tắc kết game CANON §15 |
| **E4 đèn + ông Hải buổi tối bị đọc là "chê người nhậu"** | Trung bình | CANON §9 đã chốt: ông Hải **không phải comic relief**. Thoại buổi tối của ông phải viết với **phẩm giá**, và *"trước 10 giờ sáng rất tử tế"* là câu mà game phải làm người chơi cảm được, không phải câu để cười |
| **Ngân sách art** | Trung bình | ~40 sprite thiết bị + 2 biến thể xe (ngày/đêm). Nằm trong phạm vi artist VN $1.500–2.500/tháng (`idea.md` §23), nhưng **phải vẽ sau vertical slice**, không phải trước |

---

## 8. Truy vết

| Nội dung | `idea.md` | `CANON.md` | Doc khác |
|---|---|---|---|
| **Trục B** — vòng nâng cấp công cụ, thành tựu bằng mắt và tay | **§3, dòng 36–54** | §10 hàng 1 | PL-A §2.3 |
| Phán quyết NHẬN + 4 luật TB | — | §10 hàng 1 | PL-A §2.3 |
| Bảng `visibility`, 4 state certainty | — | §5 | P2-01 |
| Công cụ chủ động hạ attention (trà đá, che tầm nhìn) | — | §5.4 | PL-A §2.7.2 |
| 11 sự kiện — `DIRTY_HANDS`, `BURNT_OR_COLD`, `FLOURISH`, `CARED_FOR_THEM`, `DROPPED_FOOD` | — | §3 | P1-03 |
| `STALL_CLEANLINESS` là trạng thái, không phải sự kiện | — | §3.3 | — |
| Phán quyết vệ sinh XĐ1 (không thưởng gian dối, không nút nhặt) | — | §7 | P3-02 §2.10 |
| Hạn dùng · thông lượng cao điểm · giá biến động | §22, dòng 1034–1039 | §13 | P3-03, P3-01 |
| Fail mềm — *"phải bán cái tủ mát"* | §22, dòng 1041 | §13 | P3-06 |
| Bảng QR là một upgrade thật · 11 ngày không tiêu tiền mặt | **§19.2, dòng 943** | §14 | — |
| Mở hàng / tiền lẻ đầu ngày là điềm | §19.1, dòng 926 | §14 | P4-02 |
| Mốc *"nhà tui gần xe bánh mì cô Ba"* | §19.2, dòng 955 | §9 (#11), §14 | — |
| Chi tiết môi trường bắt buộc: bảng hiệu đỏ chữ vàng, ghế nhựa, hũ đũa | — | §14 | — |
| Lằn ranh đỏ — không hạ thấp nghề · lồng tiếng người thật | — | §14.1, §2 | — |
| Đừng-1 (mô phỏng sâu) · Đừng-4 (layered sprite) | §16 | §16 | — |
| 12 lỗ hổng ăn gian | §21 | §8 | §7.2 |
| Trợ năng — chạm-để-đặt, hoàn tác, xác nhận, 5 kênh âm thanh | — | §15 | P5-01 |
| Nguyên tắc kết game — *"ai còn ở đó với mình"* | — | §15 | P4-05 |
| **Nền số học** (54 ổ · 12,6k lãi gộp/ổ · 100k→115k chi phí cố định · 552k lãi ròng) | — | §13 | **P3-03 §2.5.2** |
| **Bảng nghĩa vụ hợp nhất** (rút về nhà 150k/ngày · thuê chỗ 42k/ngày · hụi 500k×8 · tiền học 1.200k×2) | §22 | §13 | **P3-06 §9.5** — nguồn sự thật |
| Hốt hụi kỳ 2 = 2.800k tiền mặt ngày 10 → mua tủ mát sớm | §19 | §14 | **P3-06 §2.3** |
| Standee QR: 0k tiền mặt, `shortOfCashRate` 8%→2%, +3,0 s mỗi lượt | §19.2 | §14 | **P3-03 §2.7** |
| Tủ mát mở trục "mua gộp" của nguồn hàng | §22 | §13.1 | **P3-02 §2.8 D6 · P3-03 §2.3** |

---

## 9. Đề xuất sửa CANON

1. **Bổ sung §3.1** một sự kiện tiêu cực **có điều kiện** (chỉ tồn tại sau khi mua lò gas):

   | ID | Sự kiện | Salience | Loại | Ghi chú |
   |---|---|---|---|---|
   | `MISSING_CHARCOAL_AROMA` | Mất mùi than sau khi đổi sang lò gas | **25** | Công thức | Thuộc họ `ORDER_DEFECT`. Chỉ với `visitCount ≥ 12` và `soi ≥ 0,6`. **Là tiếc nuối, không phải lỗi** |

   Lý do phải vào CANON: nó làm **số sự kiện tiêu cực 6 → 7** trong một số bối cảnh, cần đối chiếu với luật §9.7 (số tích cực ≥ số tiêu cực).

2. **Bổ sung §3.2** một sự kiện tích cực **có điều kiện** (chỉ tồn tại sau khi mua C1) để giữ cân bằng của luật §9.7:

   | ID | Sự kiện | Salience | Ghi chú |
   |---|---|---|---|
   | `WASHED_HANDS_VISIBLY` | Rửa tay ở bồn gắn xe, trong tầm nhìn khách | **30** | Chạy qua đúng công thức §5, slot `HANDS`. Giảm `traitMul` tạm thời 2 phút |

3. **Bổ sung §5.4** hai công cụ hạ attention đến từ thiết bị:

   | Công cụ | Hiệu ứng |
   |---|---|
   | **Mời khách ngồi ghế** | Đổi `zone` sang `SEATED_FAR` → `visibility[HANDS]` **0,95 → 0,10**. Mặt trái: khách ngồi lại nói chuyện với nhau → gossip chạy tại quầy |
   | **Bình trà đá** | Biến "ly trà đá" từ cử chỉ hiếm (8 ly/ngày) thành chiến thuật dùng được (40 ly/ngày) |

4. **Bổ sung §14** một mục "Thiết bị của xe bánh mì" liệt kê 19 món ở §2.5 làm định danh cố định, để các doc P4/P5 không bịa thêm thiết bị.

5. **Bổ sung §16 Đừng-4** một dòng về thiết bị: *"Thiết bị trên xe là sprite tĩnh xếp lớp. Tối đa 4 món có animation, mỗi món 2–3 frame."*

6. **✅ Đã hội tụ với `P3-06` §9.5 (xung đột số liệu nghĩa vụ).**
   `P3-06` phát hiện bốn doc P3 viết song song dùng bốn bảng nghĩa vụ khác nhau và đề xuất một bảng hợp nhất. **Doc này đã chép lại bảng đó**, cụ thể:

   | Khoản | Số chốt | Doc này dùng ở |
   |---|---|---|
   | Rút về nhà | **150k/ngày** | §2.6.1 |
   | Thuê chỗ `L1` | **42k/ngày** (không phải 2.200k/kỳ) | §2.6.1 · `P3-05` §2.2.1 |
   | Hụi | **500k × 8 kỳ** | §2.6.1 · §2.6.2 |
   | Tiền học | **1.200k × 2, ngày 18 và 38** | §2.6.1 · §2.6.2 |
   | Ngân sách thiết bị | **≈ 8.050k** | §2.6.1, §2.6.3, §5 |

   **Việc còn lại thuộc về người chốt CANON, không thuộc doc này:** `P3-01` §2.2 và `P3-03` §2.5.4 vẫn ghi *"cú 2.700k ngày 10 / 25"*. Hai doc đó phải đổi theo bảng hợp nhất, hoặc bảng hợp nhất phải đổi theo chúng — **nhưng không được để cả hai cùng tồn tại**. `P3-06` §9.5 đã nêu đúng điều này; doc này chỉ xác nhận mình đứng về phía bảng hợp nhất.
