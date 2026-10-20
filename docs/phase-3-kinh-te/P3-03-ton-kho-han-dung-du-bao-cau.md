# P3-03 — Tồn kho, hạn dùng, dự báo cầu, giá chợ, sổ nợ

> ## ⚡ REVAMP 2026-10-20 — ⚠️ CHẾT MỘT PHẦN
> Căn cứ: [`CANON.md`](../CANON.md) bản revamp. Phần ☠️ không dùng làm căn cứ.
>
> | Mục | Trạng thái | Lý do / thay bằng |
> |---|---|---|
> | §2.1 Hạn dùng, bảng `Q(d)`, đồ chua | ⏳ | Cơ chế giữ; số chờ R3 (thêm trục chất lượng hàng) |
> | §2.2 Chiết khấu, sức chứa, mua thiếu/thừa | ⏳ | Giữ, càng cần vì giá biến động (CANON §8j). Số chờ R3 |
> | §2.3 Hết hàng giữa buổi — hệ quả quan hệ | 🔁 | Hệ quả thành review/sao (R4), không còn quan hệ |
> | §2.4 Dự báo cầu bằng sổ tay + lịch 12 NPC + công thức ẩn | ☠️ | Thay bằng công thức công khai `Y(x) = base(x) × R(sao) × (1+ε)` (R5) |
> | §2.5.1–§2.5.4 Giá chợ: pattern thứ, 6 sự kiện, bảng 40 ngày | 🔁 | Thành giá nhà cung cấp biến động (R3). Lịch tĩnh 40 ngày ☠️ — game chơi vô hạn |
> | §2.5.5 Giá đổi trong buổi chợ | ⏳ | Còn nghĩa hay không tuỳ UI nhà cung cấp (R3) |
> | §2.6 Sổ nợ (toàn mục) | ☠️ | Sổ nợ chết (cần trí nhớ khách) |
> | §2.7 Bảng QR, §2.8 Tiền lẻ | ⏳ | Giữ; bỏ nhánh "QR xoá sổ nợ". Số chờ R2/R5 |
> | §3–§5 Schema, UI chợ, tham số | 🔁 | Bỏ phần sổ tay/sổ nợ/lịch NPC; UI chợ đổi theo R3 |
>
> **Còn dùng được:** hạn dùng + đồ chua, tồn kho/sức chứa chống tích trữ, QR và tiền lẻ — cho R3/R5.

**Thuộc phase:** P3 — Kinh tế
**Phụ thuộc:** `CANON.md` §8 (b, e, f, h, j), §12 (trí nhớ), §13.1, §13.2, §13.4, §14 · `P3-01` (vòng một ngày, lưu lượng khách, thời tiết) · `P3-04` (thiết bị: tủ mát, bảng QR, loa báo) · `P3-06` (nghĩa vụ) · `P2-*` (trí nhớ 3 tầng, sổ tay)
**Trạng thái:** **Chốt** cho cơ chế và cấu trúc bảng · **Cần đo** cho giá trị tuyệt đối ở §2.5 và §5

---

## 1. Mục tiêu

Ba ràng buộc kinh tế của CANON §13 — **hạn dùng (13.1)**, **dự báo cầu (13.2)**, **giá chợ biến động (13.4)** — giao nhau ở đúng một câu hỏi mà người chơi phải trả lời mỗi sáng: ***"sáng mai cần bao nhiêu ổ, và mua của ai?"***. Doc này làm cho câu hỏi đó **không có đáp án cố định**, và làm cho việc trả lời sai **đau theo hai cách khác nhau** (hết hàng giữa buổi = mất quan hệ; thừa hàng = mất tiền).

Đây là chỗ CANON §13.2 nói *"đây mới là chỗ hệ trí nhớ NPC có ích thật sự"* — và doc này phải biến câu đó thành cơ chế, chứ không để nó là một lời hứa. Cơ chế: **người chơi quan sát NPC → tự suy ra lịch → tự viết dự báo → sáng mai mua theo dự báo của mình → chiều nay đối chiếu.** Sổ tay ghi **dữ liệu thô**, không bao giờ ghi kết luận.

Đồng thời doc này cài **đồ chua** — cơ chế hay nhất trong cả hệ kinh tế, vì nó là thứ duy nhất **thưởng cho việc lên kế hoạch xa** thay vì chỉ phạt cho việc quên.

Trụ cột phục vụ: **T1** (hàng dở nhìn thấy được: rau héo, bánh ỉu, đồ chua nhạt — khách thấy trước khi ăn) · **T3** (không có thanh "độ tươi", chỉ có màu sắc và lời) · **T5** (mọi rủi ro tồn kho đọc được trước khi mua).

---

## 2. Cơ chế

### 2.1. Hạn dùng và đường cong chất lượng

#### 2.1.1. Bảng đầy đủ

`Q(d)` = hệ số chất lượng ở ngày thứ `d` kể từ lúc mua (d=0 là ngày mua). `Q` đi vào `dishQuality`, và `dishQuality` đi vào **delivery-diff** (CANON §6) như một `ORDER_DEFECT` ngầm khi lệch quá ngưỡng.

| Nguyên liệu | Đơn vị mua | Suất/đơn vị | Hạn | Q(0) | Q(1) | Q(2) | Q(3) | Q(4) | Q(5) | Q(6) | Q(7) | Q(8) | Q(9) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Ổ bánh mì** (lò bà Tám) | ổ | 1 | **1 ngày** | 1,00 | 0,50 | ✖ | | | | | | | |
| **Pate** | phần (300g) | **30** | **2 ngày** | 1,00 | 0,95 | 0,75 | ✖ | | | | | | |
| **Thịt nguội / jambon** | phần (500g) | **30** | **3 ngày** | 1,00 | 1,00 | 0,90 | 0,70 | ✖ | | | | | |
| **Chả lụa** | phần (500g) | **30** | **3 ngày** | 1,00 | 0,98 | 0,88 | 0,68 | ✖ | | | | | |
| **Xíu mại** (nấu sáng) | nồi | **24** | **1 ngày** | 1,00 | ✖ | | | | | | | | |
| **Heo quay** (mua nóng) | phần | **20** | **1 ngày** | 1,00 | ✖ | | | | | | | | |
| **Gà xé** | phần | **28** | **2 ngày** | 1,00 | 0,92 | 0,70 | ✖ | | | | | | |
| **Cá hộp** | hộp | 10 | **30 ngày** | 0,72 | 0,72 | 0,72 | 0,72 | … | | | | | |
| **Trứng (ốp la)** | vỉ 20 | 20 | **7 ngày** | 1,00 | 1,00 | 1,00 | 0,98 | 0,95 | 0,92 | 0,88 | 0,80 | ✖ | |
| **Rau** (dưa leo, ngò, hành lá) | phần | **36** | **1 ngày** | 1,00 | 0,55 | ✖ | | | | | | | |
| **Ớt tươi** | lạng | 60 | **3 ngày** | 1,00 | 0,96 | 0,90 | 0,78 | ✖ | | | | | |
| **🟢 Đồ chua** (cà rốt + củ cải ngâm) | hũ | **40** | **9 ngày** | **0,55** | **0,75** | **0,92** | **1,00** ⭐ | **0,98** | **0,90** | **0,78** | **0,60** | **0,40** | **0,22** → ✖ |
| **Nước sốt / xì dầu / tương** | phần | **90** | **14 ngày** | 1,00 | … không đổi tới d13, ✖ d14 | | | | | | | | |
| **Bơ + sữa đặc** | hũ | **80** | **7 ngày** | 1,00 | 1,00 | 0,98 | 0,96 | 0,92 | 0,88 | 0,82 | ✖ | | |
| **Đá cây** | cây | — | **trong ngày** | 1,00 | ✖ | | | | | | | | |
| **Nước trà (nấu)** | bình | 40 ly | **1 ngày** | 1,00 | ✖ | | | | | | | | |

`✖` = **hỏng, không được dùng.** Không có nút "dùng liều". Cô Ba sẽ nói một câu và nguyên liệu bị khoá — đây là một trong ba chỗ game **không cho** người chơi ăn gian vệ sinh (CANON §7 XĐ1.2).

**Hiệu chỉnh nắng gắt:** ngày `NANG_GAT`, rau và xíu mại **rớt Q sớm hơn trong ngày**: `Q_intraday(rau) = 1,00 → 0,82` lúc 10h thay vì 0,92. Bánh mì cũng vậy: ổ bánh để ngoài rổ 3 giờ ở nắng gắt xuống 0,88 — **nướng lại phục hồi về 0,97**, và không nướng lại là đường dẫn thẳng tới `BURNT_OR_COLD` (salience 80).

#### 2.1.2. 🟢 Đồ chua — cơ chế hay nhất trong hệ, vì nó THƯỞNG chứ không chỉ PHẠT

Mọi nguyên liệu khác đều là một đồng hồ đếm ngược. Đồ chua là một **cái đồng hồ đếm lên rồi mới đếm xuống**, và điều đó đổi hoàn toàn loại quyết định:

- Nguyên liệu thường: *"mua bao nhiêu để không thừa?"* → bài toán **né thiệt hại**
- Đồ chua: *"hôm nay ngâm hũ nào để ngày kia nó chín đúng lúc đông khách nhất?"* → bài toán **săn đỉnh**

```ts
// econ/inventory.ts
interface PickleJar {
  id: string
  jarredOnDay: number
  sizePortions: number        // 40 với hũ thường, 64 với hũ lớn (P3-04)
  remaining: number
}

const PICKLE_CURVE = [0.55, 0.75, 0.92, 1.00, 0.98, 0.90, 0.78, 0.60, 0.40, 0.22]

function pickleQuality(jar: PickleJar, today: number): number {
  const age = today - jar.jarredOnDay
  return age >= PICKLE_CURVE.length ? 0 : PICKLE_CURVE[age]
}

// Người chơi CHỌN hũ nào múc ra, mỗi sáng, khi xếp khay
function selectJarForToday(jars: PickleJar[], today: number): PickleJar {
  return ui.askPlayer(jars.map(j => ({
    jar: j,
    ageLabel: `ngâm ngày ${j.jarredOnDay}`,     // ← hiện NGÀY NGÂM, không hiện điểm chất lượng
    look: visualOf(pickleQuality(j, today)),     // ← màu + độ trong của nước ngâm. T3.
    left: j.remaining
  })))
}
```

> **T3 áp lên tồn kho:** UI **không bao giờ** hiện "Q = 0,92". Nó hiện **ngày ngâm** (dữ liệu thô, người chơi tự tính) và **hình ảnh** (nước ngâm ngày 0 còn đục và cà rốt còn cứng màu cam chói; ngày 3 nước trong, cà rốt hơi trong; ngày 7 nước đục lại, cà rốt nhũn). Người chơi học bằng mắt.

**Đường ống đồ chua — bài toán lên kế hoạch thật:**

Hũ thường chứa **40 suất**. Ngày bán tốt dùng **~54 suất**. → **Một hũ không đủ một ngày.** Để lúc nào cũng có đồ chua ở đỉnh (Q ≥ 0,98, tức tuổi 3–4 ngày), cần **ngâm một hũ mới mỗi 2 ngày**, và luôn có **3 hũ trong kho** ở ba độ tuổi khác nhau.

| Ngày | Ngâm hũ | Múc từ hũ (tuổi) | Q hiệu dụng | Ghi chú |
|---|---|---|---|---|
| 1 | Hũ A | — (mua sẵn 1 hũ từ cô Ba, tuổi 3) | 1,00 | Mở màn được tặng, để dạy cảm giác đỉnh |
| 2 | — | Hũ mua sẵn (4) | 0,98 | |
| 3 | Hũ B | Hũ mua sẵn (5) → hết | 0,90 | ⚠️ Đây là ngày người chơi **thấy** chất lượng tụt |
| 4 | — | Hũ A (3) ⭐ | **1,00** | Nếu ngày 1 có ngâm |
| 5 | Hũ C | Hũ A (4) | 0,98 | |
| 6 | — | Hũ B (3) ⭐ | **1,00** | Đường ống đã chạy |
| … | mỗi 2 ngày | luôn múc hũ tuổi 3–4 | ≥0,98 | |

**Chi phí đường ống:** 35k/hũ × 20 hũ trong mùa = **700k** cho cả 40 ngày. Rẻ như cho. **Cái đắt là phải nhớ.** Và vì `Q` đồ chua nhân vào `dishQuality` của **mọi ổ bánh có đồ chua** (tức ~94% số ổ), chênh lệch giữa người có đường ống và người không có là:

| | Q đồ chua bình quân | `dishQuality` bình quân | Hệ quả |
|---|---|---|---|
| Có đường ống | 0,99 | 0,97 | Trong vùng an toàn. Thỉnh thoảng có bark khen: *"đồ chua bữa nay ngon dữ."* |
| Ngâm bừa, hết thì ngâm | 0,72 | 0,86 | Lai rai lọt ngưỡng `tasteDefect` với người `soi` cao |
| Không bao giờ ngâm, mua đồ chua làm sẵn ngoài chợ (55k/hũ, Q cố định **0,70**) | 0,70 | 0,85 | Đắt hơn **và** dở hơn. Nhưng **hợp lệ** — đây là lối thoát cho người không muốn quản lý đường ống |

**Luật quan trọng:** đồ chua ngon **không sinh ra một sự kiện tích cực mới** (CANON §3 khoá 11 sự kiện). Nó làm ba việc trong hệ đã có:
1. Nhân vào `dishQuality` → tránh `ORDER_DEFECT` ngầm.
2. Mở khoá một nhóm bark tích cực tier-1 (*"đồ chua bữa nay thấm dữ ta"*) — là **bark**, không phải sự kiện, không ghi memory riêng.
3. Tăng `+0,08` xác suất `REMEMBERED_USUAL` "đậu" trọn vẹn với khách ruột (vì "như mọi bữa" của họ bao gồm cả vị đồ chua).

Và đồ chua **quá chua** (tuổi ≥7, Q ≤0,60) sinh `ORDER_DEFECT` subtype `TASTE_OFF`, **phát hiện lúc ăn** (salience 100), không phải lúc nhìn — cùng đường dẫn với pate rẻ ở `P3-01` §2.8.

#### 2.1.3. Hạn dùng nối vào `dishQuality` và delivery-diff

```ts
// craft/recipe.ts
function dishQuality(dish: Dish, today: number): number {
  let q = 1.0
  for (const ing of dish.ingredients) {
    const w = RECIPE_WEIGHT[ing.id]              // pate 0.28, thịt 0.24, bánh 0.20, đồ chua 0.14, rau 0.10, sốt 0.04
    q -= w * (1 - qualityOf(ing.lot, today))
  }
  return clamp(q, 0, 1)
}

// craft/diff.ts — nối vào CANON §6
function qualityDefect(dish: Dish, npc: NPC) {
  const gap = 1.0 - dishQuality(dish, clock.day)
  const threshold = 0.18 - 0.10 * npc.soi        // soi 0.9 → ngưỡng 0.09; soi 0.2 → ngưỡng 0.16
  if (gap < threshold) return null
  return {
    kind: "ORDER_DEFECT",
    subtype: gap > 0.30 ? "SPOILED" : "TASTE_OFF",
    salienceAtCounter: 20,                        // rau héo, bánh ỉu NHÌN thấy được → chịu gazeFactor
    salienceAtEating: 100 * traitMul(npc.soi),    // không chịu gazeFactor
    delaySec: 90 + rng(0, 120)
  }
}
```

**Chị Lan (`soi 0.9`) có ngưỡng 0,09 — cô ấy nhận ra rau héo.** Anh Bảo (`soi 0.3`) có ngưỡng 0,15 — cậu ấy không. Đó chính là lỗ hổng §8 mục (b) **phân tầng khách**, và nó được bịt ở §2.6 bên dưới.

### 2.2. Bài toán tồn kho — chiết khấu, sức chứa, chống ăn gian (j)

#### 2.2.1. Chiết khấu theo số lượng

```ts
// econ/market.ts
const BULK_TIERS = [
  { qty: 1,  discount: 0.00, label: "lẻ" },
  { qty: 2,  discount: 0.06, label: "hai phần" },
  { qty: 4,  discount: 0.12, label: "bốn phần" },
  { qty: 8,  discount: 0.18, label: "tám phần — giá sỉ nhỏ" },
  { qty: 12, discount: 0.22, label: "sỉ — PHẢI ĐẶT TRƯỚC HÔM QUA" },
]

function unitPrice(base: number, qty: number, supplier: Supplier): number {
  const tier = BULK_TIERS.filter(t => qty >= t.qty).pop()!
  let p = base * (1 - tier.discount)
  p *= 1 - supplier.loyaltyDiscount      // 0 → 0.10, mua đều 7 ngày liên tiếp (P3-02)
  return Math.round(p)
}
```

**Trần chiết khấu 22% là cố ý.** Nó phải nhỏ hơn thiệt hại của một lô hỏng: mua 8 phần pate bà Tám với −18% tiết kiệm **137k**, nhưng pate hạn **2 ngày** và ngày 54 ổ chỉ dùng hết **~1,6 phần/ngày** → trong 2 ngày dùng được 3,2 phần, **phần thứ 4 đến 8 chắc chắn hỏng (−456k)**. **Số học tự nó dạy người chơi**, không cần tutorial.

**Bậc `qty ≥ 12` đòi đặt trước hôm qua** — đó là một cam kết cứng. Giá rẻ nhất trong game gắn liền với việc **dự báo đúng từ hôm trước**, tức là gắn thẳng vào §2.4. Nếu hôm sau mưa, bạn vẫn phải lấy hàng. Chi tiết ở `P3-02` (quan hệ nhà cung cấp).

#### 2.2.2. Sức chứa — chốt chặn của §8 mục (j)

```ts
interface StorageTier {
  id: string
  coldSlots: number          // 1 slot = 1 "phần hàng" (~20 suất)
  drySlots: number
  shelfLifeDelta: Record<string, number>   // cộng/trừ NGÀY hạn dùng theo nhóm
  price: number              // nghìn đồng
}

const STORAGE: StorageTier[] = [
  { id: "thung_xop",  coldSlots: 8,  drySlots: 6,  price: 0,
    shelfLifeDelta: { thit: -1, pate: -1, rau: 0 } },       // ⚠️ thùng xốp + đá: pate chỉ còn 1 NGÀY
  { id: "tu_mat_mini", coldSlots: 20, drySlots: 10, price: 2800,
    shelfLifeDelta: {} },                                    // giữ đúng hạn chuẩn ở §2.1
  { id: "tu_mat_lon",  coldSlots: 36, drySlots: 16, price: 6500,
    shelfLifeDelta: { thit: +1 } },                          // CHỈ thịt nguội. Không pate, không rau
]
```

**Ba lớp khoá lỗ hổng "tích trữ khi giá đáy":**

| Lớp | Cơ chế | Hiệu lực |
|---|---|---|
| **Hạn dùng** | Pate 2 ngày là trần tuyệt đối, **không thiết bị nào nâng được** | Ngày rẻ nhất là **thứ Năm**. Mua thứ Năm chỉ phủ được thứ Năm + thứ Sáu. **Không bao giờ phủ tới thứ Hai** — ngày đắt nhất |
| **Sức chứa** | Tủ lớn nhất: 36 slot lạnh. Một ngày 54 ổ dùng ~1,6 pate + 1,6 chả + 0,6 thịt nguội + 0,8 xíu mại + 1,5 rau + 0,6 hũ đồ chua ≈ **6,7 slot/ngày** | Trần lý thuyết 5,4 ngày hàng. Nhưng hạn dùng đã cắt xuống 2–3 → **sức chứa không phải là ràng buộc chặt nhất; hạn dùng mới là**. Sức chứa là lớp dự phòng, và là lớp duy nhất chặn được việc tích trữ đồ khô + đồ chua |
| **Vốn lưu động** | Tiền dồn vào hàng tồn là tiền không dùng trả nghĩa vụ. Ngày 10 và 25 có cú nghĩa vụ lớn (**2.700k**, đang chờ hợp nhất — `P3-06` §9.5) | Mua 8 phần pate bà Tám ngày 4 (rẻ nhất tuần) = **624k kẹt trong tủ** đúng tuần cần tiền mặt. **Đây là chốt chặn hiệu quả nhất và nó miễn phí** |

**Kiểm chứng:** bot chơi "chỉ mua thứ Năm, mua tối đa" phải có lợi nhuận **thấp hơn** bot "mua vừa đủ mỗi ngày theo dự báo". Tính thử: mua thứ Năm giá index 0,92 (pate) thay vì bình quân tuần 1,03 → tiết kiệm 10,7%. Nhưng chỉ phủ được 2/7 ngày, và ~22% lô thứ hai hỏng. Tiết kiệm thực = `10,7% × 2/7 − 22% × 2/7` = **−3,2%**. **Âm.** Chốt chặn hoạt động.

#### 2.2.3. Mua thiếu vs mua thừa — bảng thiệt hại bất đối xứng

| | Mua thiếu 10 ổ | Mua thừa 10 ổ |
|---|---|---|
| Tiền vốn bỏ ra | 0 | `10 × 15,4k` = **154k** |
| Lãi gộp mất | `10 × 12,6k` = **126k** | 0 |
| Gỡ lại được | — | Bán xổ 10h30 (−40% giá = 16,8k/ổ). Nhưng **chỉ có 4–6 khách vét**, gỡ được ~5 ổ ≈ **84k** |
| **Thiệt hại tiền thuần** | **126k** | **70k** |
| **Thiệt hại quan hệ** | **2–4 khách ruột ăn `MADE_THEM_WAIT(OUT_OF_STOCK)`, intensity 55–110** | **0** |
| Hệ quả lâu dài | Đứt `streakDays`. Gossip *"bữa đó hết hàng sớm"*. Nếu mất hẳn một khách ruột: **550–900k** (xem `P3-06` §2.5) | Cô Ba nói một câu tiếc: *"Ăn hết nghen con, đừng bỏ."* Không có hệ quả nào khác |

> **Về tiền, bất đối xứng chỉ 1,8 lần — nhỏ.** Nếu chỉ có tiền, mua thiếu và mua thừa gần như ngang nhau và bài toán tồn kho sẽ nhạt.
> **Toàn bộ sức nặng nằm ở cột quan hệ**, và cột đó **không quy ra tiền được** (T3: không có chỉ số). Đó chính xác là định hướng chống ăn gian §8 mục (f): *"phần hay không nằm ở EV mà nằm ở quan hệ."* Một bảng Excel sẽ khuyên bạn mua sát nhu cầu. Một người đã làm mất chú Tư một lần sẽ mua dư 6 ổ.
> **Điểm tối ưu theo cảm nhận nằm ở dư 5–8%** — và game không bao giờ nói ra con số đó.

### 2.3. Hết hàng giữa buổi — hệ quả quan hệ, không chỉ mất doanh thu

```ts
// econ/inventory.ts
function onCustomerArrives(npc: NPC, order: Order) {
  const missing = inventory.shortfall(order)
  if (missing.length === 0) return serve(npc, order)

  // Lối thoát 1: đề nghị món thay thế — đây là một HÀNH ĐỘNG XÃ HỘI, không phải menu
  const alt = suggestAlternative(order, inventory)
  if (alt && ui.playerOffers(alt)) {
    const accepted = npc.accepts(alt)             // phụ thuộc soi + tier + họ có gọi "như mọi bữa" không
    if (accepted) {
      // Thay thế cho khách ruột đang gọi "như mọi bữa" = CHẶN được REMEMBERED_USUAL hôm đó
      memory.suppress(npc, "REMEMBERED_USUAL")
      return serve(npc, alt)
    }
  }

  // Lối thoát 2: không còn gì
  const base = 55
  const intensity = base * (1 + 0.5 * Math.min(npc.streakDays, 20) / 10)
  memory.write(npc, { kind: "MADE_THEM_WAIT", reason: "OUT_OF_STOCK", intensity })
  npc.streakDays = 0
  if (rng.chance(0.25 + 0.4 * npc.thanThien)) gossip.seed(npc, "bữa đó hết hàng sớm")
}
```

**Vì sao hết hàng với khách ruột đau hơn hết hàng với khách lạ:**

| Khách | `streakDays` khi hết hàng | `intensity` | Cái mất thêm |
|---|---|---|---|
| Khách vãng lai | 0 | 55 | Không gì. Họ đi mua chỗ chú Kiệt |
| **Chú Tư** ngày 19 (đến đều từ ngày 1) | 18 | **104** | Đứt chuỗi 18 ngày. Và hôm sau ông **vẫn tới** — đó mới là cái đau |
| **Bà Bảy** ngày 30 | 20 (trần) | **110** | Bà là nút gossip mạnh; `thanThien 0,7` → 53% lan tin |
| **Chị Lan** ngày 25 | 20 | **110** | `thanThien 0,3` → 37% lan tin, **nhưng** `soi 0,9 / nongTinh 0,1` = *"người im lặng biến mất"* (CANON §9). Cô ấy không nói gì và ngày 26 không tới |

**Cảnh bắt buộc phải có:** khi khách ruột tới mà hết hàng, **cô Ba không có ở đó** (cô về từ 6h30). Người chơi đứng một mình với cái rổ trống. Không có nhạc buồn, không có sting (CANON §15.4: nút tắt âm báo tiêu cực). Chỉ có một dòng của họ và họ quay đi.

**Chú Tư:** *"Ờ... thôi bữa khác cô. Chú qua bển vậy."* — "qua bển" là qua chỗ chú Kiệt, và **người chơi biết điều đó**.

**Lối thoát có phẩm giá — "gói cho chú ổ bánh không":** nếu còn ổ bánh nhưng hết nhân, người chơi có thể đưa **bánh mì không** (chấm sữa đặc — cách gọi chuẩn, idea.md §19.3) miễn phí. Nó **không xoá** `MADE_THEM_WAIT` nhưng hạ `intensity` xuống 30 và sinh `CARED_FOR_THEM` (salience 50). Chi phí: 3,5k. Đây là lựa chọn 3,5k đắt giá nhất trong game, và nó không nằm trong bất kỳ menu nào — người chơi phải **tự nghĩ ra**.

### 2.4. Dự báo cầu — chỗ hệ trí nhớ NPC thật sự có ích

#### 2.4.1. Nguyên tắc: sổ tay ghi DỮ LIỆU THÔ, người chơi rút KẾT LUẬN

CANON §13.2 nói người chơi phải **suy ra lịch từ quan sát**. Nếu game tự tổng hợp thành "chú Tư: T2–T6, 6h45" thì không còn gì để suy ra và cả ràng buộc chết. Nên:

| Game ghi tự động (thô) | Game **KHÔNG BAO GIỜ** ghi |
|---|---|
| Ngày, giờ, ai tới, mua gì, bao nhiêu ổ, trả bao nhiêu | *"Chú Tư thường tới thứ 2–6"* |
| *"Ngày 7 — 06:45 — chú Tư — 2 ổ đầy đủ — 50k"* | *"Dự báo mai: 56 ổ"* |
| Tổng ổ bán ra, tổng thu, tổng chi, số ổ còn lại | *"Bạn nên mua thêm pate"* |
| Thời tiết hôm đó | Bất kỳ đồ thị, xu hướng, mũi tên nào |

```ts
// ui/notebook/ledger.ts
interface SaleEntry {
  day: number
  gameTime: string          // "06:45"
  npcId?: string            // undefined = khách vãng lai vô danh
  items: { recipeId: string; qty: number }[]
  paid: number              // nghìn đồng
  credit?: number           // ghi sổ nợ, xem §2.6
}

interface DayLedger {
  day: number
  weather: Weather["kind"]
  entries: SaleEntry[]
  loavesBought: number
  loavesSold: number
  loavesWasted: number
  revenue: number
  cogs: number
  fixedCost: number
  // ↓ Ô NGƯỜI CHƠI TỰ GÕ. Game không điền, không gợi ý, không kiểm tra chính tả.
  playerForecastTomorrow?: number
  playerNotes: string
}
```

**Vòng đối chiếu tự chấm:**

```
Chiều ngày N:  người chơi gõ "mai: 58 ổ"  → lưu vào playerForecastTomorrow
Sáng ngày N+1: màn hình mua bánh hiện "hôm qua con ghi: 58" (mờ, góc dưới)
Chiều ngày N+1: sổ tay hiện đúng hai dòng cạnh nhau:
                  "con ghi:  58"
                  "bán được: 54"
                Không có chữ "sai". Không có phần trăm. Không có điểm.
```

**Đó là toàn bộ hệ dự báo.** Không có UI phức tạp hơn. Người chơi tự thấy mình đang giỏi lên.

#### 2.4.2. Lịch sinh hoạt 12 NPC — bảng tĩnh (CANON §16 Đừng-1: không mô phỏng)

| NPC | Ngày trong tuần | Giờ | Ổ | Độ ổn định | Đổi lịch trong mùa |
|---|---|---|---|---|---|
| **Chú Tư** | T2–T6 | 6h45 (±4′) | **2** | **0,96** — cao nhất, cố ý: ông là giáo cụ dạy khái niệm "lịch" | **Biến mất ~ngày 30.** Báo trước 3–4 ngày (CANON §9) |
| **Chị Lan** | T2–T7 | 7h20 (±6′) | 1 | 0,90 | Không. Nhưng có thể **im lặng biến mất** nếu bị làm phật ý |
| **Anh Dũng** | Mỗi ngày | 6h05 (±12′) | 1 | 0,78 — nghề Grab, giờ trôi nổi | **Đổi ca đêm từ ngày ~18** → giờ chuyển sang 10h30 |
| **Bé Su** | T2–T6 | 6h25 (±3′) | 1 | 0,94 | Không |
| **Bà Bảy** | Mỗi ngày | 9h10 (±15′) | 1 | 0,82 | Không. Ngồi lại lâu — đây là nguồn nghe lỏm |
| **Thầy Phúc** | **T3, T5, T7** | 8h50 (±5′) | 1 | 0,92 | Không. Lịch 3 ngày/tuần là câu đố khó thứ hai |
| **Chị Hạnh** | T2–T6 | 7h05 (±7′) | 1 | 0,86 | Arc hoà nhập: từ ngày ~22 đổi cách gọi món |
| **Anh Bảo** | T2–T7 | 10h15 (±20′) | 1 | 0,62 — **thấp nhất**, sinh viên dậy trễ | Mùa thi (~ngày 26–31): tới 6h30 |
| **Ông Hải** | Mỗi ngày | 10h40 (±25′) · **CN 8h30** | 1–2 | 0,70 | **Chủ Nhật ông tới sớm và rất tử tế** — câu đố hay nhất trong bảng |
| **Bà Sáu** | **T2, T4, T6** | 9h30 (±10′) | 1 (đổi hàng) | 0,88 | Mốc tiến trình: đổi câu "nhà tui gần chỗ bán tàu hũ" |
| **Cô Mai** | Mỗi ngày | 6h50 **hoặc** 10h50 | 1 | 0,84 (giờ: 50/50) | Không |
| **Chú Kiệt** | ~2 lần/tuần | 11h00 | **0** | 0,45 | Ghé nói chuyện, không mua. Cố ý: ông là dữ liệu nhiễu trong sổ |

**Tổng NPC có tên:** 9–11 ổ/ngày thường (~20% doanh thu).
**Khách vãng lai:** ~43 ổ (~80%), theo đường cong `P3-01` §2.4.3 × thời tiết × danh tiếng.

> **Cấu trúc bài toán:** phần **học được** (NPC có tên, deterministic, 20%) và phần **thống kê** (vãng lai, nhiễu ±18%, 80%). Người chơi giỏi nhất cũng chỉ thu hẹp sai số dự báo từ ±22% xuống **±9%**, không bao giờ xuống 0. **Dự báo cầu là một kỹ năng, không phải một câu đố có đáp án.**

#### 2.4.3. Ba câu đố lịch được cài cố ý, theo thứ tự khó

| # | Câu đố | Dạy gì | Ngày người chơi thường vỡ ra |
|---|---|---|---|
| 1 | **Chú Tư không tới cuối tuần** | Khái niệm "lịch tồn tại" | Ngày 6–7 (T7/CN đầu tiên). Nếu mua như ngày thường → thừa 6–8 ổ, rất rõ |
| 2 | **Thầy Phúc chỉ T3/T5/T7** | Lịch không nhất thiết là "đi làm" | Ngày 12–16. Khó hơn vì chỉ 1 ổ — sai số nhỏ, phải chú ý mới thấy |
| 3 | **Ông Hải Chủ Nhật tới lúc 8h30 và tử tế** | Cùng một người có **hai phiên bản**, và phiên bản nào phụ thuộc **giờ** chứ không phải **ngày** | Ngày 21–28. Đây là câu đố kết nối lịch sinh hoạt với hệ tính cách — và là cảnh cảm động nhất trong hệ kinh tế |

**Phần thưởng cho việc đoán đúng** (nối vào hệ giả thuyết sổ tay, idea.md §22.3): đoán đúng 3 điều về một NPC → **mở một cảnh nhỏ**. Ở đây, "đoán đúng lịch" tính là **một** trong ba điều. Không có thưởng tiền. Phần thưởng là **cảnh**, và là việc dự báo của bạn chính xác hơn — thưởng gián tiếp qua kinh tế, không qua một con số.

#### 2.4.4. Công thức cầu — cái người chơi đang cố suy ra

```ts
// sim/demand.ts — KHÔNG BAO GIỜ hiện công thức này cho người chơi
function expectedLoaves(day: DayConfig): number {
  const named = NAMED_SCHEDULE
    .filter(n => n.weekdays.includes(day.weekday) && day.day < n.leavesOnDay)
    .reduce((s, n) => s + n.loaves * n.reliability, 0)          // ~9–11

  const NAMED_NOMINAL = 10                                       // ~10 ổ/ngày thường từ NPC có tên
  const walkIn = (day.baselineLoaves - NAMED_NOMINAL)            // ← baseline là TỔNG; trừ phần NPC có tên
    * WEATHER[day.weather].walkInMul                             // 0.45 … 1.05 — chỉ áp lên khách vãng lai
    * econ.tomorrowWalkInMul                                     // danh tiếng hẻm, 0.75 … 1.30
    * (1 + 0.03 * viaMood)                                       // ±3%, dưới nhiễu (P3-01 §2.6.2)
    * standLocationMul                                           // 1.00 đầu hẻm · 0.65 góc khuất (P3-06)
    * (day.marketEvent?.crowdMul ?? 1)

  return named + poisson(walkIn)                                 // ← nhiễu Poisson, σ ≈ ±15%
}

// Băng cơ sở theo ngày — TỔNG số ổ ở điều kiện trung tính, phản ánh việc hẻm dần biết tới xe
const BASELINE = [
  { days: [1, 5],   loaves: 32 },
  { days: [6, 12],  loaves: 42 },
  { days: [13, 22], loaves: 54 },
  { days: [23, 33], loaves: 64 },
  { days: [34, 40], loaves: 70 },
]
```

**Bình quân 40 ngày (chơi tốt, thời tiết thật theo lịch `P3-01` §2.4.4): ≈ 51,7 ổ/ngày — tổng 2.066 ổ cả mùa.**
Với giá bán bình quân **28,0k** → **doanh thu bình quân 1.448k/ngày**, cả mùa **≈ 57.850k**. Con số này là gốc của toàn bộ bảng cân đối ở `P3-06` §2.7.

### 2.5. Giá chợ biến động — pattern học được + sự kiện

#### 2.5.1. Nguyên tắc

CANON §13.4: pattern học được (**thịt đắt thứ 2, rẻ thứ 5**) + sự kiện (**dịch heo → pate tăng 40% trong 5 ngày**).
CANON §8 mục (e): **seed cố định theo ngày**. → Lịch giá là **bảng tra tĩnh, giống hệt qua mọi lần chơi lại**. Người chơi lần 2 biết trước ngày 8 pate sẽ tăng — **và đó là thiết kế, không phải lỗ hổng**. Nó là phần thưởng cho việc chơi lại, giống việc nhớ lịch tàu trong *Majora's Mask*.

#### 2.5.2. Giá nền và chỉ số theo thứ

**Giá nền** (nghìn đồng, 1 "phần hàng"):

| Mặt hàng | Đơn vị | Suất | Giá nền | k/suất | Q(0) |
|---|---|---|---|---|---|
| Pate **thường** | phần 300g | 30 | **60** | 2,00 | 0,82 |
| Pate **bà Tám** (tự làm) | phần 300g | 30 | **95** | 3,17 | **1,00** |
| Chả lụa | phần 500g | 30 | **110** | 3,67 | 1,00 |
| Thịt nguội / jambon | phần 500g | 30 | **120** | 4,00 | 1,00 |
| Xíu mại | nồi | 24 | **70** | 2,92 | 1,00 |
| Heo quay | phần | 20 | **150** | 7,50 | 1,00 |
| Gà xé | phần | 28 | **85** | 3,04 | 0,94 |
| Cá hộp | hộp | 10 | **55** | 5,50 | 0,72 |
| Trứng | vỉ 20 | 20 | **50** | 2,50 | 1,00 |
| Rau tổng hợp | phần | 36 | **45** | 1,25 | 1,00 |
| Đồ chua (nguyên liệu 1 hũ) | hũ 40 suất | 40 | **35** | 0,88 | theo đường cong |
| Đồ chua **làm sẵn** | hũ 40 suất | 40 | **55** | 1,38 | 0,70 cố định |
| Sốt + bơ + xì dầu | phần | 90 | **40** | 0,44 | 1,00 |
| **Ổ bánh mì** | ổ | 1 | **3,5** | 3,50 | 1,00 |

> **Pate thường Q(0) = 0,82** là mấu chốt của quyết định gốc "pate ngon hay pate rẻ". Chênh 35k/phần = **1,17k/ổ**, đổi lấy `dishQuality` thấp hơn 0,050 (0,28 × 0,18). Với chị Lan (`soi 0,9`, ngưỡng 0,09), pate rẻ **một mình** chưa đủ lọt ngưỡng. **Pate rẻ + rau ngày 2 + đồ chua ngày 7 mới lọt.** → Đó là lý do quyết định pate không còn là một quyết định độc lập: nó **phụ thuộc vào ba thứ khác trong tủ**. Đây là câu trả lời kỹ thuật cho HT4.

**Giá BÁN và giá vốn mỗi ổ** — bảng gốc của mọi phép tính doanh thu trong `P3-01`, `P3-03`, `P3-06`:

| Món | Thành phần | Giá bán | Giá vốn | Lãi gộp | Tỉ trọng mix |
|---|---|---|---|---|---|
| **Bánh mì không** (chấm sữa đặc) | bánh + bơ/sữa | **8** | 3,9 | 4,1 | **10%** |
| **Ổ thường** | bánh + pate bà Tám + chả lụa + rau + đồ chua + sốt | **25** | 12,9 | 12,1 | **48%** |
| **Ổ đầy đủ** | ổ thường + thịt nguội + xíu mại | **32** | 19,8 | 12,2 | **34%** |
| **Ổ đặc biệt** | ổ thường + heo quay + ốp la + xíu mại | **40** | 25,8 | 14,2 | **8%** |
| *Trà đá (kèm)* | nước trà + đá | *3* | *0,4* | *2,6* | *~25% lượt khách* |
| **Bình quân một ổ** | | **≈ 28,0** | **≈ 15,4** | **≈ 12,6** | **COGS 55%** |

**Ba hệ quả thiết kế của bảng này:**

1. **Lãi gộp tuyệt đối của ổ thường và ổ đầy đủ gần bằng nhau (12,1 vs 12,2).** Cố ý. Nếu ổ đắt lãi nhiều hơn hẳn, người chơi sẽ tìm cách đẩy mọi người mua ổ đắt — mà **T2 cấm người chơi chọn câu nói**, nên "upsell" sẽ biến thành một cơ chế ép buộc gượng gạo. Ở đây, bán được ổ đắt là **hệ quả của việc khách tin bạn**, không phải một chiến thuật.
2. **Ổ đặc biệt lãi nhất nhưng chỉ 8% mix**, vì heo quay hạn **1 ngày** và hũ 20 suất. Muốn tăng tỉ trọng ổ đặc biệt thì phải dự báo cầu chính xác hơn — nối thẳng vào §2.4.
3. **Bánh mì không lãi 4,1k** — thấp nhất, nhưng nó là lối thoát có phẩm giá khi hết nhân (§2.3). Cho không một ổ bánh mì không tốn **3,9k**.

**Thu bình quân một ngày (chơi tốt, 51,7 ổ):** `51,7 × 28,0` ≈ **1.448k**. Giá vốn hàng bán ≈ **796k**. Chi phí cố định **100k** (115k từ ngày 33). **Lãi ròng trước hao hụt ≈ 552k/ngày.**
Cộng hao hụt (hàng hỏng ~5% với người chơi tốt, `P3-06` §2.7.1) ≈ 40k/ngày → **lãi ròng thực ≈ 508k/ngày, cả mùa ≈ 20.330k.** Đây là con số gốc của bảng cân đối `P3-06` §2.7.

**Chỉ số theo thứ** (nhân vào giá nền):

| Thứ | Thịt / chả / heo quay | Pate | Rau / đồ chua | Ổ bánh | Ghi nhớ dân gian |
|---|---|---|---|---|---|
| **T2** | **1,18** | 1,12 | 1,05 | 1,00 | *"Thứ hai chợ đắt, ai cũng đi làm lại"* |
| T3 | 1,08 | 1,04 | 1,00 | 1,00 | |
| T4 | 1,00 | 1,00 | 0,98 | 1,00 | Ngày chuẩn |
| **T5** | **0,88** | **0,92** | 0,95 | 1,00 | **Rẻ nhất tuần.** Lò mổ đổ hàng |
| T6 | 0,95 | 0,98 | 1,02 | 1,00 | |
| T7 | 1,10 | 1,06 | 1,10 | 1,00 | Người ta mua về nấu cuối tuần |
| CN | 1,14 | 1,10 | **1,12** | 1,00 | Rau đắt nhất |

**Ổ bánh giá cố định 3,5k** — lò bà Tám không lên xuống theo chợ. Cố ý: cần ít nhất **một** mỏ neo bất biến để người chơi có gốc so sánh.

#### 2.5.3. Sáu sự kiện giá trong mùa

| # | Ngày | Sự kiện | Ảnh hưởng | Báo trước |
|---|---|---|---|---|
| 1 | **8–12** | **Dịch heo tai xanh** | Pate **×1,40** · chả lụa/thịt nguội **×1,25** · heo quay **×1,35** | Ngày 6–7: bà Bảy và cô Mai nhắc tới trong bark. Người chơi **có thể** trữ pate ngày 7 (T7, index 1,06) — nhưng pate hạn 2 ngày, chỉ cứu được ngày 8–9 |
| 2 | **17–19** | **Mưa lớn miền Tây** | Rau **×1,30** | Ngày 16: tin trên radio ở pha Tối. Rau hạn 1 ngày → **không trữ được**. Phải chịu, hoặc bán ổ ít rau và chịu lời khách |
| 3 | **22–23** | **Rằm — nhiều người ăn chay** | Khách **×0,85** · rau **×1,15** · pate **×0,95** (ế) | Cả hẻm nói về nó từ ngày 20. Đây là ngày nên **mua ít** — bài kiểm tra dự báo rõ nhất mùa |
| 4 | **28–30** | **Lò bà Tám nghỉ giỗ** | Ổ bánh **4,2k** (+20%) từ lò khác, **Q(0) = 0,90** | Ngày 25: bà Tám tự nói. Người chơi có thể đặt trước lò khác (rẻ hơn 3,9k) hoặc chịu giá cao |
| 5 | **33 →** | **Giá gas tăng** | Chi phí cố định **100k → 115k/ngày, VĨNH VIỄN** | Không báo trước. Một cú sốc nhỏ không né được — dạy rằng có thứ chỉ chịu chứ không tối ưu được |
| 6 | **36–37** | **Hội chợ gần hẻm** | Khách **×1,25** | Ngày 33: bé Su nói. Cơ hội lớn nhất mùa — nhưng ngày 35 phải mua nhiều và ngày 35 chi phí vừa tăng |

#### 2.5.4. Bảng giá đầy đủ 40 ngày

Giá đã nhân đủ (chỉ số thứ × sự kiện), làm tròn nghìn. Cột **Ổ** là giá một ổ bánh.

| Ngày | Thứ | Thời tiết | Sự kiện | Pate thường | Pate bà Tám | Chả lụa | Rau | Ổ | Ghi |
|---|---|---|---|---|---|---|---|---|---|
| 1 | T2 | Mát | — | 67 | 106 | 130 | 47 | 3,5 | |
| 2 | T3 | Nắng | — | 62 | 99 | 119 | 45 | 3,5 | |
| 3 | T4 | Nắng | — | 60 | 95 | 110 | 44 | 3,5 | |
| **4** | **T5** | Âm u | — | **55** | **87** | **97** | 43 | 3,5 | ⬇ **Đáy tuần 1** |
| 5 | T6 | Nắng | — | 59 | 93 | 105 | 46 | 3,5 | Hụi kỳ 1 |
| 6 | T7 | Nắng | — | 64 | 101 | 121 | 50 | 3,5 | |
| 7 | CN | Mát | — | 66 | 105 | 125 | 50 | 3,5 | Chú Tư nghỉ |
| **8** | T2 | Nắng | **Dịch heo** | **94** | **148** | **163** | 47 | 3,5 | ⬆ Cú sốc 1 |
| 9 | T3 | **Oi** | Dịch heo | 87 | 138 | 149 | 45 | 3,5 | Cả hẻm cáu |
| **10** | T4 | **Mưa rào** | Dịch heo | 84 | 133 | 138 | 44 | 3,5 | 💸 **Hụi kỳ 2 — 500** |
| **11** | **T5** | Nắng | Dịch heo | **77** | **122** | **121** | 43 | 3,5 | ⬇ Vẫn là đáy tuần |
| 12 | T6 | Nắng | Dịch heo | 83 | 131 | 131 | 46 | 3,5 | Hết dịch từ mai |
| 13 | T7 | Mát | — | 64 | 101 | 121 | 50 | 3,5 | |
| 14 | CN | Âm u | — | 66 | 105 | 125 | 50 | 3,5 | |
| 15 | T2 | Nắng | — | 67 | 106 | 130 | 47 | 3,5 | Hụi kỳ 3 |
| 16 | T3 | Nắng | — | 62 | 99 | 119 | 45 | 3,5 | |
| **17** | T4 | **Mưa dầm** | **Rau tăng** | 60 | 95 | 110 | **57** | 3,5 | Ngày tệ nhất nửa đầu |
| **18** | **T5** | **Mưa rào** | Rau tăng | **55** | **87** | **97** | **56** | 3,5 | 💸 **Tiền học 1.200** |
| 19 | T6 | Âm u | Rau tăng | 59 | 93 | 105 | **60** | 3,5 | |
| 20 | T7 | Mát | — | 64 | 101 | 121 | 50 | 3,5 | Hụi kỳ 4 |
| 21 | CN | Nắng | — | 66 | 105 | 125 | 50 | 3,5 | |
| 22 | T2 | Nắng | **Rằm** | 64 | 101 | 130 | 54 | 3,5 | Khách ×0,85 |
| 23 | T3 | Mát | Rằm | 59 | 94 | 119 | 52 | 3,5 | Khách ×0,85 |
| 24 | T4 | Nắng | — | 60 | 95 | 110 | 44 | 3,5 | |
| **25** | **T5** | **Mưa rào** | — | **55** | **87** | **97** | 43 | 3,5 | 💸 **Hụi kỳ 5 — 500** |
| 26 | T6 | Nắng | — | 59 | 93 | 105 | 46 | 3,5 | |
| 27 | T7 | Nắng | — | 64 | 101 | 121 | 50 | 3,5 | |
| 28 | CN | Âm u | **Lò nghỉ** | 66 | 105 | 125 | 50 | **4,2** | |
| 29 | T2 | Mát | Lò nghỉ | 67 | 106 | 130 | 47 | **4,2** | |
| **30** | T3 | Nắng | Lò nghỉ | 62 | 99 | 119 | 45 | **4,2** | 😢 **Chú Tư đi.** Hụi kỳ 6 |
| 31 | T4 | Nắng | — | 60 | 95 | 110 | 44 | 3,5 | |
| **32** | **T5** | **Mưa rào** | — | **55** | **87** | **97** | 43 | 3,5 | ⬇ Đáy |
| 33 | T6 | Nắng | **Gas tăng** | 59 | 93 | 105 | 46 | 3,5 | Chi phí cố định → **115k/ngày** |
| 34 | T7 | Mát | — | 64 | 101 | 121 | 50 | 3,5 | |
| 35 | CN | Âm u | — | 66 | 105 | 125 | 50 | 3,5 | Hụi kỳ 7. Nên mua nhiều cho mai |
| **36** | T2 | Nắng | **Hội chợ** | 67 | 106 | 130 | 47 | 3,5 | 🎉 Khách ×1,25 |
| **37** | T3 | Nắng | Hội chợ | 62 | 99 | 119 | 45 | 3,5 | 🎉 Khách ×1,25 |
| **38** | T4 | **Mưa dầm** | — | 60 | 95 | 110 | 44 | 3,5 | 💸 **Tiền học 1.200** |
| **39** | **T5** | Mát | — | **55** | **87** | **97** | 43 | 3,5 | ⬇ Đáy cuối |
| **40** | T6 | Nắng | — | 59 | 93 | 105 | 46 | 3,5 | 🏁 Ngày cuối. **Hụi kỳ 8 + lựa chọn thuê chỗ mùa sau** |

**Pattern người chơi phải học ra, theo thứ tự dễ → khó:**

1. **Thứ Năm rẻ nhất, thứ Hai đắt nhất** — thấy được sau 2 tuần. Đúng cả trong lúc có dịch heo (*"vẫn là đáy, chỉ là cả tuần đều cao"*) → dạy rằng pattern và sự kiện là **hai lớp cộng vào nhau**, không phải một.
2. **Sự kiện có báo trước, trừ một cái** — 5/6 sự kiện có cảnh báo trong bark 2–3 ngày trước. Giá gas (ngày 33) thì không. Dạy rằng luôn phải có đệm tiền mặt.
3. **Ba ngày nghĩa vụ lớn đều là ngày mưa** (10, 25, 38) — pattern độc ác nhất và dạy bài học lớn nhất. Xem `P3-06` §2.3.
4. **Không có ngày nào vừa rẻ nguyên liệu vừa đông khách.** Kiểm chứng: thứ Năm rẻ nhất, nhưng 4/6 thứ Năm trong mùa (ngày 18, 25, 32 + ngày 4 âm u) là ngày thời tiết xấu. Hai thứ này được ghép tay, không phải ngẫu nhiên. **Bạn không bao giờ có một ngày dễ trọn vẹn.**

#### 2.5.5. Giá thay đổi **trong buổi chợ** — áp lực duy nhất của pha Sáng

```ts
// econ/market.ts — chợ đầu mối, 4h30–5h30
function priceAtHour(base: number, gameSec: number): number {
  const t = (gameSec - HOUR(4.5)) / HOUR(1)      // 0 → 1
  // Đi sớm: hàng tươi, giá cao. Đi trễ: hàng còn lại, giá rẻ nhưng CHẤT LƯỢNG thấp
  return base * (1.06 - 0.14 * t)
}
function qualityAtHour(gameSec: number): number {
  const t = (gameSec - HOUR(4.5)) / HOUR(1)
  return 1.00 - 0.12 * t                          // rau chót chợ là rau người ta lựa còn lại
}
```

Đi trễ 1 giờ: rẻ **12,6%**, chất lượng thấp **12%**. **Gần như hoà** — cố ý, để nó là một lựa chọn về **phong cách** chứ không phải về EV. Nhưng: đi trễ thì **về trễ**, và về trễ thì **mở hàng trễ** (mất cửa sổ 5h15–5h45 ở `P3-01` §2.4.2). Cái giá thật của việc đi chợ trễ nằm ở pha sau, không nằm ở pha này. **Đây là kiểu ràng buộc chéo mà HT4 đang thiếu.**

### 2.6. Sổ nợ — chỗ DUY NHẤT "nhớ nhầm" hợp trực giác

#### 2.6.1. Vì sao chỗ này hợp mà chỗ khác không

HT3 gần như giết cơ chế nhớ nhầm. Minh: *"tôi không phân biệt được 'NPC nhớ nhầm' với 'chính tôi quên mất ngày 8 mình làm gì'."* Phản biện: *"bạn vừa xây một hệ thống mà không có cách nào để người chơi phân biệt 'thiết kế tinh vi' với 'code lỗi'."*

**Sổ nợ giải quyết trọn vẹn cả hai, vì người chơi CÓ ground truth về hành vi của chính mình:** họ biết họ đã quên bấm nút ghi sổ. Khi khách nói *"bữa đó hai ổ, bốn mươi lăm"*, người chơi **biết** là mình không ghi, và **biết** là mình không chắc. Cái bất lực Linh cảnh báo (*"bị đổ oan mà không có cách giải thích"*) biến mất — vì nó không phải bị đổ oan, mà là **hậu quả của việc mình không ghi**.

#### 2.6.2. Cơ chế

```ts
// econ/ledger.ts
interface DebtRecord {
  npcId: string
  day: number
  gameTime: string
  trueAmount: number          // GAME luôn biết. KHÔNG BAO GIỜ hiện cho người chơi nếu chưa ghi
  playerWrote: number | null  // null = người chơi quên ghi
  settledOnDay?: number
  settledAmount?: number
}

// Bán chịu: một nút xuất hiện khi khách không đủ tiền mặt
function onCustomerShort(npc: NPC, amount: number) {
  const choice = ui.ask([
    "GHI_SO",        // 2,0 giây thật để mở sổ + chạm tên + chạm số
    "CHO_LUON",      // 0 giây. → FREE_EXTRA (salience 25). Có diminishing returns, §8 mục (i)
    "TU_CHOI",       // 0 giây. → §8 mục (k): tốn kém xã hội nặng
  ])
  if (choice === "GHI_SO") {
    const wrote = ui.debtBook.awaitEntry(2000 /*ms thật*/)   // ← ĐÂY LÀ CHI PHÍ THẬT
    debts.push({ npcId: npc.id, trueAmount: amount, playerWrote: wrote ?? null, ... })
  }
}
```

**2,0 giây thật là toàn bộ cơ chế.** Lúc vắng, 2 giây là không có gì. Lúc 4 người đứng chờ và `patienceSec` của anh Dũng là 22 giây, **2 giây là 9% kiên nhẫn của người kế tiếp**. Người chơi sẽ bỏ ghi sổ, và họ sẽ làm vậy **có ý thức**. Đó là thiết kế.

```ts
// ui/debtbook — có nút "ghi sau", tốn 0 giây tại chỗ
// nhưng phải điền ở pha CHIỀU, và lúc đó người chơi chỉ còn TRÍ NHỚ CỦA CHÍNH MÌNH
function deferredEntry(): DebtRecord {
  // Pha Chiều hiện: "Hôm nay có 3 người mua chịu mà con chưa ghi."
  // KHÔNG hiện là ai. KHÔNG hiện bao nhiêu. Chỉ hiện SỐ LƯỢNG.
  return ui.askPlayerToRecall()
}
```

#### 2.6.3. Khi khách quay lại trả — bias theo tính cách (§8 mục h)

```ts
function recallAmount(npc: NPC, rec: DebtRecord): number {
  const days = clock.day - rec.day
  const drift = 0.04 * Math.min(days, 10)                 // trí nhớ mờ dần, trần ở 10 ngày
  // Bias THEO TÍNH CÁCH — CANON §8 mục (h). Không phải random.
  const bias = (0.5 - npc.soi) * 0.10                      // soi 0.9 → −0.04 (nhớ chính xác, hơi thấp)
             + (npc.thanThien - 0.5) * 0.12                // thanThien cao → nhớ CÓ LỢI CHO NGƯỜI CHƠI
  const noise = seededRng(rec.npcId, rec.day).normal(0, drift)
  return round5k(rec.trueAmount * (1 + bias + noise))
}
```

| NPC | `soi` | `thanThien` | Nợ thật 45k, 6 ngày sau họ nói | Hướng lệch |
|---|---|---|---|---|
| **Chị Lan** | 0,9 | 0,3 | **43k** (±1k) | Chính xác gần như tuyệt đối. Bạn không lời được gì |
| **Bà Sáu** | 0,4 | 0,9 | **48k** (±3k) | **Nhớ CAO hơn — có lợi cho bạn.** Và nhận lấy đúng số đó là một quyết định |
| **Chú Kiệt** | 0,7 | 0,4 | **42k** (±2k) | Nhớ thấp. Đối thủ mà |
| **Anh Bảo** | 0,3 | 0,4 | **45k** (±5k) | Sai số lớn nhất, không thiên về ai |

**Ba luật chống khai thác chiều ngược:**

1. **Nếu người chơi ĐÃ ghi sổ, trận đấu kết thúc ngay.** Người chơi mở sổ, đọc số thật, khách gật đầu. **Không có tranh cãi.** → Ghi sổ luôn là chiến thuật đúng. Cơ chế nhớ nhầm chỉ sống ở nơi người chơi **chọn** không ghi.
2. **Nhận số cao hơn thực tế là một hành động, và nó bị nhìn thấy.** Nếu người chơi nhận 48k khi đã ghi sổ 45k, đó là `ORDER_DEFECT`-adjacent... **không** — CANON khoá 11 sự kiện. Thay vào đó: chỉ có thể xảy ra khi **không ghi sổ**, và khi đó người chơi cũng không biết số thật. **Game không cho phép người chơi ăn gian có chủ ý ở đây**, vì để ăn gian có chủ ý họ phải biết số thật, mà biết số thật nghĩa là đã ghi sổ.
3. **Công tắc trợ năng số 1** (CANON §15): tắt "NPC nhớ nhầm/đổ oan" → mọi con nợ luôn nói đúng `trueAmount`. Sổ nợ vẫn còn, chỉ mất tầng nhớ nhầm. **Cơ chế không sụp khi tắt** — đó là tiêu chuẩn cho mọi công tắc.

#### 2.6.4. Nợ già đi, và "âm tiền vốn"

| Tuổi nợ | Trạng thái | Người chơi làm gì được |
|---|---|---|
| 0–6 ngày | Bình thường | Không cần làm gì. Đa số tự trả |
| **7–13 ngày** | `overdue` | Có thể **nhắc** — một hành động ngượng, tốn 3 giây thật, `intensity −15` quan hệ nếu người đó thuộc `deTha` thấp. Hoặc **im lặng chờ** |
| **≥14 ngày** | `written_off` | Coi như mất. Nhưng người đó **vẫn ghé** — và mỗi lần ghé, người chơi nhớ, và họ cũng nhớ. Nếu người chơi đã nhắc mà họ chưa trả → tần suất ghé **−40%** vì họ né |

**Cuối tháng âm tiền vốn** — đúng vấn đề thật mà idea.md §19.2 nêu:

```ts
// Chạy ở pha Tối ngày 10, 20, 30, 40
function monthlyReconcile() {
  const recorded = debts.filter(d => d.playerWrote !== null).sum(d => d.playerWrote!)
  const actual   = debts.sum(d => d.trueAmount)
  const gap      = actual - recorded
  // Hiện đúng MỘT dòng, giọng cô Ba, không có bảng phân tích:
  if (gap > 150) coBa.say(`Bán chịu nhiều mà ghi ít quá con. Thiếu chừng ${round10(gap)} ngàn đó.`)
}
```

**Quy mô thiết kế:** nợ trung bình **25–60k** (một đến hai ổ). Trước khi có QR, ~**8% giao dịch** phát sinh mua chịu → ~2,7 lần/ngày. Nếu người chơi không bao giờ ghi sổ, "âm tiền vốn" cuối mùa đạt **450–700k**, tức **0,9–1,4 kỳ hụi**. **Đủ đau để phải để ý, không đủ để giết.**

#### 2.6.5. Cô Mai và cuốn sổ nợ đối chiếu

Cô Mai (CANON §9 NPC 7: chủ tạp hoá **làm ăn được**, nguồn đổi tiền lẻ + sổ nợ) giữ sổ nợ của chính cô, và nhiều con nợ trùng nhau.

| Quan hệ với cô Mai | Cô làm gì |
|---|---|
| **Rival** | Không nói gì |
| **Acquaintance** | Mỗi ~10 ngày, cô hỏi vu vơ: *"Bữa nay thằng Bảo có ghé con hông?"* — một gợi ý gián tiếp |
| **Friend** | Mỗi ~7 ngày, một cảnh ngắn ở pha Chiều: hai người ngồi đối sổ. **Mọi `playerWrote === null` được điền lại đúng `trueAmount`** — vì cô có ghi. Đây là **phần thưởng quan hệ lớn nhất trong hệ kinh tế**, và nó không phải tiền |

> Đây là hiện thân trực tiếp của nguyên tắc chống ăn gian §8 mục (f): *"đảm bảo phần hay không nằm ở EV mà nằm ở quan hệ."* Một bảng Excel tính được nợ trung bình là 36k. Nó không tính được rằng thân với cô Mai thì **sổ của bạn tự đúng**.

### 2.7. Bảng QR — một upgrade thật

Người Việt trung bình **11 ngày liên tiếp mỗi tháng không tiêu một đồng tiền mặt** (khảo sát Visa 2023, gấp gần 4 lần 2022 — idea.md §19.2). Quán chỉ nhận tiền mặt thì **khách bỏ đi chỗ khác**.

**Trạng thái trước khi có QR:**

```ts
const CASH_ONLY = {
  shortOfCashRate: 0.08,        // 8% giao dịch: khách không đủ tiền mặt
  walkAwayRate: 0.035,          // 3,5% lượt khách: không có tiền mặt → BỎ ĐI LUÔN, không hỏi
}
```
`walkAwayRate` là thiệt hại **vô hình** — cùng loại với `balk` ở `P3-01` §2.5.3. Người chơi chỉ thấy ai đó mò túi rồi đi. **Không có sự kiện, không có ai giận.** Đây là cái khó chịu đúng kiểu: bạn mất tiền mà không biết mình mất.

**Ba mức thiết bị (chi tiết đầy đủ ở `P3-04`):**

| Mức | Giá | Cách có | Hiệu ứng |
|---|---|---|---|
| **Standee QR ngân hàng** | **0k tiền mặt** — nhưng **mất một buổi sáng đi làm thủ tục** ở ngân hàng (nghỉ bán một ngày ≈ **650k lãi gộp bỏ lỡ**, và chi phí cố định 100k vẫn mất) | Mở từ ngày 8. Cô Mai chỉ chỗ | `shortOfCashRate` 8% → 2% · `walkAwayRate` 3,5% → 0,6% · **nhưng** mỗi lần nhận QR tốn **3,0 giây thật** để kiểm điện thoại |
| **Loa báo chuyển khoản** | **450k** | Mua bất kỳ lúc nào sau standee | Thời gian kiểm 3,0s → **0s**. Và: *"Đã nhận hai mươi lăm nghìn đồng."* — cả hẻm nghe thấy |
| **Máy in bill nhiệt** | 900k | Sau loa | Giảm tranh cãi số tiền (khách ruột có bill) · rút `handoffSec` 12→9 · **không** ảnh hưởng sổ nợ |

**Giá trị kinh tế của standee** (tính ở băng 54 ổ/ngày, dùng từ ngày 10):
- Khách cứu được: `(0,035 − 0,006) × 34 lượt/ngày` ≈ **1,0 lượt/ngày** ≈ 1,5 ổ ≈ **19k lãi gộp/ngày**
- Nợ tránh được: `(0,08 − 0,02) × 34` ≈ 2,0 lần/ngày × 40k trung bình × 22% tỉ lệ mất trắng ≈ **18k/ngày**
- Tổng ≈ **37k/ngày × 31 ngày còn lại = 1.147k**, trừ chi phí cơ hội buổi sáng **750k** → **+397k ròng**.

→ **Đáng, nhưng không hiển nhiên.** Và khoản 3,0 giây thật mỗi lần nhận QR làm nó **tệ hơn trong giờ cao điểm** cho tới khi mua loa. Đó là một chuỗi quyết định thật: mở QR → phát hiện nó làm chậm mình → mua loa → xong. Ba quyết định thay vì một cái nút "upgrade".

**Ràng buộc tông:** loa báo chuyển khoản là **âm thanh biểu tượng của Việt Nam 2023–2025**. Nó phải xuất hiện như một chi tiết đời thật trìu mến, không phải như một chỉ số. Và khi nó đọc số tiền, **cả hàng đợi nghe được** — bà Bảy sẽ có bark về việc đó.

### 2.8. Tiền lẻ và thối tiền

```ts
// econ/cash.ts
interface CashBox {
  smallNotes: number          // nghìn đồng, mệnh giá ≤20k
  largeNotes: number
}

const CHANGE_PER_CASH_TXN = 8          // k, tiêu hao trung bình mỗi giao dịch tiền mặt (ổ 25–40k, khách đưa 50k)
const SMALL_NOTE_RECOVERY = 0.35       // 35% khách đưa lẻ → hoàn lại vào hộp

function onCashPayment(txn: Transaction) {
  const need = txn.changeNeeded
  if (cashBox.smallNotes < need) {
    ui.playerChoose([
      "XIN_KHACH_CHO",     // → MADE_THEM_WAIT +20 salience, chạy đi đổi ở cô Mai (25s game)
      "LAM_TRON_XUONG",    // bớt cho khách 2–5k → FREE_EXTRA (salience 25), diminishing
      "GHI_SO",            // → sổ nợ ngược: MÌNH nợ khách. Cực kỳ ngượng, và khách nhớ rất kỹ
    ])
  }
  cashBox.smallNotes -= need
  if (rng.chance(SMALL_NOTE_RECOVERY)) cashBox.smallNotes += rng.int(5, 20)
}
```

**Quyết định mỗi sáng: mang bao nhiêu tiền lẻ.**

| Mức | Chi phí | Đủ cho | Rủi ro |
|---|---|---|---|
| **100k** | 30 giây game ghé cô Mai | ~19 giao dịch | Hết lẻ khoảng 7h30 ngày đông. 3–4 lần xử lý ngượng |
| **200k** | 40 giây game | ~38 giao dịch | Vừa đủ ngày thường, thiếu ngày đông |
| **300k** | 55 giây game | ~58 giao dịch | An toàn. Nhưng 300k nằm trong hộp = 300k không dùng mua hàng. Đau vào ngày 10, 25 |

**Móc nối vào mở hàng (CANON §14):** nếu **khách đầu tiên trong ngày** đưa tiền lớn mà hộp không đủ lẻ → `first.playerHadNoChange = true` → `−2` điểm → **`viaMood = −1` gần như chắc chắn** (`P3-01` §2.6.3). Đây là chỗ một câu kiêng kỵ dân gian trở thành một lý do cơ học để sáng nào cũng ghé cô Mai. **Cơ chế Việt Nam nằm trong bài toán, không nằm trên bề mặt.**

**Cô Mai và tiền lẻ:**

| Quan hệ | Cô Mai |
|---|---|
| **Friend** | Đổi ngay, và **để sẵn** — tốn 15 giây game thay vì 30. Thỉnh thoảng: *"Cô để sẵn cho con rồi nè."* |
| **Acquaintance** | Đổi bình thường |
| **Rival** | *"Cô cũng hết lẻ rồi con."* — **không đổi được**. Phải chạy ra tiệm tạp hoá đầu kia hẻm: **90 giây game**, và trễ mở hàng |

Và "khỏi thối" — hình thức tip duy nhất trong game:

```ts
function roundUpChance(npc: NPC): number {
  return 0.06                                  // nền, rất thấp. Người Việt ít tip
       + 0.10 * relationTierBonus(npc)         // Friend +0.10
       + 0.02 * viaMood
       + (dishQuality > 0.96 ? 0.04 : 0)
}
```

**Trần tip toàn mùa ≈ 3,5% doanh thu.** Cố ý thấp: **giá trị kinh tế của quan hệ KHÔNG nằm ở tip.** Nó nằm ở **tần suất ghé, số ổ mỗi lần, và việc họ kéo người khác tới**. Đây là định hướng cân bằng trung tâm, và lý do ở `P3-06` §2.8.

---

## 3. Dữ liệu & schema

```ts
// econ/inventory.ts
export interface Lot {
  id: string
  ingredientId: string
  boughtOnDay: number
  portions: number
  remaining: number
  supplierId: string
  qualityAtPurchase: number     // 1.00 sáng sớm → 0.88 chót chợ
}

export interface Ingredient {
  id: string
  displayVi: string
  unit: "phan" | "hu" | "o" | "noi" | "vi" | "hop" | "lang" | "cay" | "binh"
  portionsPerUnit: number
  shelfLifeDays: number
  qualityCurve: number[]        // index = tuổi theo ngày
  storage: "COLD" | "DRY"
  basePrice: number             // nghìn đồng
  weekdayIndexKey: "thit" | "pate" | "rau" | "fixed"
  recipeWeight: number          // dùng trong dishQuality()
}

// econ/market.ts
export interface MarketDay {
  day: number
  weekday: 0|1|2|3|4|5|6         // 0 = T2
  events: MarketEvent[]
  priceOf(ingredientId: string, gameSec: number, qty: number, supplier: Supplier): number
}

export interface MarketEvent {
  id: string
  fromDay: number; toDay: number
  priceMul: Record<string, number>
  crowdMul?: number
  fixedCostDelta?: number
  telegraphFromDay: number
  telegraphSpeakers: string[]    // npcId nào nói trước
}
```

```json
// content/econ/ingredients.json — trích
[
  { "id": "pate_thuong", "displayVi": "pate thường", "unit": "phan",
    "portionsPerUnit": 30, "shelfLifeDays": 2, "qualityCurve": [1.00, 0.95, 0.75],
    "storage": "COLD", "basePrice": 60, "weekdayIndexKey": "pate",
    "recipeWeight": 0.28, "baseQuality": 0.82 },

  { "id": "pate_ba_tam", "displayVi": "pate bà Tám", "unit": "phan",
    "portionsPerUnit": 30, "shelfLifeDays": 2, "qualityCurve": [1.00, 0.95, 0.75],
    "storage": "COLD", "basePrice": 95, "weekdayIndexKey": "pate",
    "recipeWeight": 0.28, "baseQuality": 1.00 },

  { "id": "do_chua", "displayVi": "đồ chua", "unit": "hu",
    "portionsPerUnit": 40, "shelfLifeDays": 9,
    "qualityCurve": [0.55, 0.75, 0.92, 1.00, 0.98, 0.90, 0.78, 0.60, 0.40, 0.22],
    "storage": "COLD", "basePrice": 35, "weekdayIndexKey": "rau",
    "recipeWeight": 0.14, "baseQuality": 1.00, "isFermented": true },

  { "id": "rau_tong_hop", "displayVi": "rau (dưa leo, ngò, hành lá)", "unit": "phan",
    "portionsPerUnit": 36, "shelfLifeDays": 1, "qualityCurve": [1.00, 0.55],
    "storage": "COLD", "basePrice": 45, "weekdayIndexKey": "rau",
    "recipeWeight": 0.10, "baseQuality": 1.00, "hotWeatherDecayMul": 1.6 }
]
```

```json
// content/econ/market-events.json
[
  { "id": "dich_heo", "fromDay": 8, "toDay": 12, "telegraphFromDay": 6,
    "telegraphSpeakers": ["ba_bay", "co_mai"],
    "priceMul": { "pate_thuong": 1.40, "pate_ba_tam": 1.40,
                  "cha_lua": 1.25, "thit_nguoi": 1.25, "heo_quay": 1.35 } },

  { "id": "mua_mien_tay", "fromDay": 17, "toDay": 19, "telegraphFromDay": 16,
    "telegraphSpeakers": ["radio_toi"],
    "priceMul": { "rau_tong_hop": 1.30, "do_chua": 1.30 } },

  { "id": "ram", "fromDay": 22, "toDay": 23, "telegraphFromDay": 20,
    "telegraphSpeakers": ["ba_bay", "thay_phuc", "ba_sau"],
    "crowdMul": 0.85,
    "priceMul": { "rau_tong_hop": 1.15, "pate_thuong": 0.95, "pate_ba_tam": 0.95 } },

  { "id": "lo_ba_tam_nghi", "fromDay": 28, "toDay": 30, "telegraphFromDay": 25,
    "telegraphSpeakers": ["ba_tam"],
    "priceMul": { "o_banh_mi": 1.20 }, "qualityMul": { "o_banh_mi": 0.90 } },

  { "id": "gas_tang", "fromDay": 33, "toDay": 40, "telegraphFromDay": -1,
    "telegraphSpeakers": [], "fixedCostDelta": 15 },

  { "id": "hoi_cho", "fromDay": 36, "toDay": 37, "telegraphFromDay": 33,
    "telegraphSpeakers": ["be_su"], "crowdMul": 1.25 }
]
```

---

## 4. UI/UX hai thiết bị

**Pha Sáng — màn hình chợ:**

```
┌──────────────────────────────────────────────────────────┐
│  Chợ Bà Hoa  ·  4h48  ·  hôm nay thứ Năm                 │
├──────────────┬──────────────┬──────────────┬─────────────┤
│  Lò bà Tám   │  Sạp pate    │  Sạp thịt    │  Sạp rau    │
│  ổ  3,5      │  thường  55  │  chả lụa 97  │  rau   43   │
│  (hôm qua 3,5)│ (hôm qua 60)│ (hôm qua 110)│(hôm qua 44) │
│              │  bà Tám  87  │              │  ớt     8   │
│              │ (hôm qua 95) │              │             │
└──────────────┴──────────────┴──────────────┴─────────────┘
   trong tủ: pate 0,4 phần · chả 1,1 · rau 0 · đồ chua: hũ A (ngâm ngày 1), hũ B (ngày 3)
   hôm qua con ghi:  58        ·        hôm qua bán được:  54
                                            [ mua như hôm qua ]
```

**Năm luật UI của màn hình này:**
1. **Giá hôm qua luôn hiện mờ bên cạnh giá hôm nay.** Đây là cơ chế duy nhất giúp học pattern giá mà không cần Excel — và nó là **dữ liệu thô**, không phải mũi tên "↓ rẻ hơn".
2. **Tồn kho hiện bằng số phần thập phân** (0,4 phần), không phải thanh. Đồ chua hiện bằng **ngày ngâm**, không phải chất lượng.
3. **"Hôm qua con ghi / hôm qua bán được"** luôn ở đó, cạnh nhau, không bình luận.
4. **Không có tổng tiền dự kiến cho tới khi bấm xác nhận.** Người chơi phải nhẩm. (Có công tắc trợ năng **"hiện tổng khi đang chọn"** — bật mặc định ở chế độ trợ giúp.)
5. **Nút "mua như hôm qua"** rút pha Sáng xuống ~25 giây khi người chơi đã ổn định. Nó **không** tính toán gì — nó sao chép đúng giỏ hôm qua, kể cả khi hôm nay là Chủ Nhật. Nó là một cái bẫy trìu mến.

**Pha Trưa — sổ nợ:** một cuốn sổ nhỏ dán ở thành xe. Chạm mở → danh sách tên + ô số. Trên mobile (v2) là bottom sheet 2 dòng. **Phải mở và điền được trong 2 giây** — nếu UI chậm hơn thì cơ chế biến thành một bài kiểm tra ngón tay, đúng cái Linh cảnh báo (idea.md §20.5).

**Pha Chiều — sổ tay:**

```
┌────────────────────── SỔ TAY · NGÀY 13 · T7 · mát ──────────────────┐
│ GAME GHI                          │ CON GHI                          │
│ 05:52  khách lạ     1 ổ    22     │ ┌──────────────────────────────┐ │
│ 06:05  anh Dũng     1 ổ    22     │ │                              │ │
│ 06:25  bé Su        1 ổ    18     │ │  (gõ tự do)                  │ │
│ 06:45  chú Tư       2 ổ    50     │ │                              │ │
│ 06:50  cô Mai       1 ổ    25     │ └──────────────────────────────┘ │
│ ...                               │                                  │
│ ─────────────────────────────     │  Mai cần bao nhiêu ổ?  [ ___ ]   │
│ mua 58 · bán 54 · bỏ 4            │                                  │
│ thu 1.190 · hàng 566 · cố định 100│                                  │
│ còn 3 người mua chịu chưa ghi     │                                  │
└─────────────────────────────────────────────────────────────────────┘
```

**Trợ năng chạm vào doc này:** cỡ chữ 4 mức — bảng giá và sổ tay là nơi chữ nhiều nhất, phải test ở 200% (hộp tự giãn, CANON §15.1) · icon nguyên liệu **khác nhau về HÌNH DÁNG** (dưa leo / ngò / hành lá đều xanh — CANON §15) · công tắc **"sổ tay cuối ngày"** tắt được: tắt thì pha Chiều rút còn màn hình tổng kết 1 trang, và `playerForecastTomorrow` chuyển thành một câu hỏi duy nhất ở màn hình mua hàng.

---

## 5. Tham số cần tune

| Tham số | Khởi điểm | Khoảng | Cách đo |
|---|---|---|---|
| `PICKLE_CURVE` đỉnh | ngày **3** = 1,00 | ngày 2–4 | CANON §13.1 khoá "đỉnh ngày 3". **Không đổi** nếu không sửa CANON |
| `PICKLE_CURVE` ngày 7 | **0,60** | 0,50–0,70 | CANON khoá "chua gắt ngày 7". Đo: ngày 7 phải lọt `tasteDefect` với `soi ≥ 0,7` |
| Hũ đồ chua = suất | 40 | 32–56 | Đo: buộc ngâm mỗi **2 ngày** ở băng 54 ổ. Nếu hũ quá to thì đường ống biến mất |
| `BULK_TIERS` trần | 22% @ qty 12 | 15–28% | **Đo bằng bot:** bot mua sỉ tối đa phải có lợi nhuận **thấp hơn** bot mua vừa đủ |
| `shelfLife` pate | **2 ngày** | — | CANON §13.1. Bất biến. Không thiết bị nào nâng |
| `tu_mat_lon.shelfLifeDelta.thit` | **+1** | 0 hoặc +1 | Đo: có làm bot tích trữ thắng không. Nếu có → về 0 |
| `qualityDefect` ngưỡng | `0,18 − 0,10·soi` | hệ số 0,06–0,14 | Đo: pate rẻ **một mình** không lọt ngưỡng với chị Lan; pate rẻ + 2 thứ nữa thì lọt |
| `BASELINE` băng ngày | 32/42/54/64/70 | ±20% | Đo: tổng doanh thu mùa khớp `P3-06` §2.7 trong ±8% |
| Sai số dự báo người giỏi | ±9% | 6–14% | Đo qua telemetry `|forecast − actual| / actual`, 10 ngày cuối |
| `priceAtHour` biên độ | 1,06 → 0,92 | ±0,10–0,20 | Đo: đi sớm/trễ phải gần hoà về EV |
| `CASH_ONLY.walkAwayRate` | 0,035 | 0,02–0,05 | Đo: standee QR phải hoà vốn trong **8–14 ngày** |
| QR kiểm điện thoại | **3,0s thật** | 2,0–4,5 | Đo: loa báo (450k) phải là mua tiếp theo hiển nhiên sau standee |
| `shortOfCashRate` | 0,08 → 0,02 | 0,05–0,12 | Đo: sổ nợ phát sinh 2–4 lần/ngày trước QR |
| Ghi sổ nợ | **2,0s thật** | 1,5–3,0 | **Núm quan trọng:** đo tỉ lệ người chơi bỏ ghi sổ trong giờ cao điểm — mục tiêu **35–60%** |
| `recallAmount` drift | 0,04/ngày, trần 10 | 0,02–0,06 | Đo: chênh lệch trung bình 6 ngày phải ở 5–12%, không hơn |
| `recallAmount` bias `thanThien` | 0,12 | 0,06–0,18 | Đo: người chơi **cảm thấy** bà Sáu tử tế, chứ không thấy mình đang lời |
| `CHANGE_PER_CASH_TXN` | 8k | 6–11 | Đo: 200k lẻ đủ cho một ngày thường, thiếu cho ngày đông |
| Giá bán bình quân một ổ | **28,0k** | 25–31 | Đo: mix thực tế của người chơi. Nếu >32k thì hoặc giá phi thực tế, hoặc upsell đang bị ép |
| COGS bình quân một ổ | **15,4k** (55%) | 50–60% | Đo bằng bot. Trên 60% thì không đủ tiền mua thiết bị; dưới 50% thì nghĩa vụ không còn sức ép |
| `roundUpChance` nền | 0,06 | 0,03–0,10 | Đo: tip toàn mùa **≤ 4%** doanh thu. Trên 4% là quan hệ đang trả bằng tiền |
| Mức "âm tiền vốn" tối đa | 450–700k/mùa | 300–900 | Đo: bằng 1–2 kỳ hụi. Đủ đau, không giết |

---

## 6. Tiêu chí đạt

- [ ] Bot "mua sỉ tối đa vào thứ Năm" có lợi nhuận mùa **thấp hơn** bot "mua vừa đủ theo dự báo" ít nhất **2%**. (Chống ăn gian (j).)
- [ ] Bot "luôn pate rẻ" bị `ORDER_DEFECT` phát hiện ít nhất **6 lần** trong mùa với nhóm `soi ≥ 0,7`, và kết thúc mùa với **ít hơn ≥2 khách ở bucket Friend** so với bot "luôn pate ngon".
- [ ] Người chơi test **tự phát biểu được** ít nhất **2 trong 3** câu đố lịch ở §2.4.3 khi được hỏi *"bạn nhận ra quy luật gì về khách?"*.
- [ ] Sai số dự báo trung vị của người chơi giảm từ **≥20%** (ngày 1–10) xuống **≤12%** (ngày 30–40). Đây là bằng chứng đo được rằng hệ trí nhớ NPC "có ích thật sự" (CANON §13.2).
- [ ] Ít nhất **8/10** người test nói được *"thứ Năm rẻ"* hoặc *"thứ Hai đắt"* sau khi chơi xong.
- [ ] Đường ống đồ chua: **≥6/10** người test tự thiết lập nhịp ngâm đều trước ngày 20, **không cần tutorial nào ngoài việc thấy chất lượng tụt ở ngày 3**.
- [ ] Trong ngày đông, **35–60%** giao dịch bán chịu **không** được ghi sổ tại chỗ. (Dưới 35% = ghi sổ quá rẻ, cơ chế không kích hoạt. Trên 60% = quá đắt, người chơi bỏ hẳn tính năng.)
- [ ] Khi hỏi *"có lúc nào NPC nhớ sai không? bạn thấy sao?"*, **không ai** dùng chữ "bug", "lỗi", "vô lý". Câu trả lời mong đợi: *"tại tui quên ghi."*
- [ ] Tắt công tắc "NPC nhớ nhầm" → sổ nợ vẫn chơi được đầy đủ, chỉ mất một tầng.
- [ ] Bảng giá 40 ngày ở §2.5.4 **khớp từng đồng** với bảng cân đối `P3-06` §2.7 và lịch thời tiết `P3-01` §2.4.4. Kiểm bằng script.
- [ ] Standee QR hoà vốn trong **8–14 ngày** kể từ khi mở; không sớm hơn (thành hiển nhiên) không muộn hơn (thành bẫy).
- [ ] **Không** có màn hình nào trong game hiện chữ "độ tươi", "chất lượng %", "dự báo", hay bất kỳ đồ thị nào. Kiểm bằng rà UI thủ công.

---

## 7. Rủi ro & cách bịt

| Rủi ro | Nối tới | Cách bịt |
|---|---|---|
| **Tích trữ khi giá đáy** | §8 (j) | §2.2.2 ba lớp: hạn dùng (pate 2 ngày, không thiết bị nào nâng) + sức chứa + **vốn lưu động kẹt đúng ngày nghĩa vụ**. Chứng minh số ở §2.2.2 |
| **Phân tầng khách** (đồ xịn cho người soi) | §8 (b) | Ngưỡng `qualityDefect` phụ thuộc `soi`, nên **có** phân tầng được về mặt phát hiện tại chỗ. Nhưng: (1) một lô hàng dùng cho cả ngày, không thể đổi pate giữa chừng mà không thấy được; (2) người `deTha` cao **vẫn vô tư kể lại** — `ORDER_DEFECT` mutation 0,35 → *"ăn bớt nguyên liệu"*, hệ số lan cao nhất bảng |
| **Micro-cheat lặp vô hạn** | §8 (g) — **lỗ hổng lớn nhất** | Không thuộc doc này về mặt phát hiện (xem `P2` gossip/pattern), nhưng doc này cung cấp **tín hiệu đếm được**: `dishQuality` trung bình 7 ngày trượt. Khi nó dưới 0,90 liên tục 5 ngày, bark pattern *"ê, dạo này bánh nhạt hơn hay tại tao?"* mở khoá. **Đây là móc nối kinh tế → pattern detection** |
| **Datamine + spreadsheet** | §8 (f) — bịt không nổi | §2.6.5 và `P3-06` §2.8: giá trị lớn nhất trong hệ (sổ nợ tự đúng nhờ cô Mai, đồ chua đúng ngày, nhớ đúng tên) **không quy ra được một con số EV**. Bảng giá 40 ngày **cố tình công khai được** — biết trước lịch giá là phần thưởng chơi lại, không phải lỗ hổng |
| **Khai thác nhớ nhầm chiều ngược** | §8 (h) | §2.6.3 luật 1–2: muốn ăn gian có chủ ý phải biết số thật; biết số thật nghĩa là đã ghi sổ; đã ghi sổ thì không có tranh cãi. **Vòng logic tự khoá** |
| **Save-scum để né ngày giá cao** | §8 (e) | `SEASON_SEED` cố định → bảng §2.5.4 y hệt qua mọi lần reload |
| **Sổ nợ thành bài kiểm tra ngón tay** | CANON §15.5, idea.md §20.5 | Chạm-để-đặt · nút Hoàn tác · 2 giây là **mục tiêu thiết kế có đo**, nếu UI không đạt thì sửa UI chứ không tăng tham số |
| **Nhớ nhầm bị đọc là bug** | HT3 | §2.6.1: chỉ tồn tại ở nơi người chơi có ground truth về hành vi của chính mình. Cộng công tắc số 1 |
| **"Ăn bớt nguyên liệu" làm nhân vật trông xấu tính** | CANON §14.1 🔴 hạ thấp nghề | Cô Ba **không bao giờ** gợi ý ăn bớt. Chú Kiệt là người gian dối (XĐ1.5). Và khi người chơi dùng hàng gần hết hạn, cô Ba nói *"Bánh đó con để cô ăn"* — không la |
| Bảng số ba doc lệch nhau | — | Một nguồn duy nhất: `content/econ/*.json`. Script `npm run econ:check` đối chiếu ba doc với JSON. Chạy trong CI |

---

## 8. Truy vết

| Nội dung | `idea.md` | `CANON.md` |
|---|---|---|
| Hạn dùng: pate 2 · thịt 3 · rau 1 · đồ chua đỉnh d3, gắt d7 | §22 mục 1 (dòng 1041) | §13.1 |
| Bài toán tồn kho: mua nhiều rẻ nhưng hỏng, mua ít hết giữa buổi | §22 mục 1 | §13.1 |
| Dự báo cầu: suy ra lịch từ quan sát; chỗ trí nhớ NPC có ích thật | §22 mục 2 (dòng 1042) | §13.2 |
| Chú Tư T2–T6 6h45, cuối tuần không ra | §22 mục 2 | §9 |
| Giá chợ: thịt đắt T2, rẻ T5; dịch heo → pate +40% trong 5 ngày | §22 mục 4 (dòng 1044) | §13.4 |
| Tích trữ khi giá đáy (j) | §21 hàng j | §8 (j) |
| Datamine + spreadsheet (f) | §21 hàng f | §8 (f) |
| Khai thác nhớ nhầm chiều ngược (h) | §21 hàng h | §8 (h) |
| Sổ nợ: bán chịu không ghi → cuối tháng âm tiền vốn; **chỗ duy nhất nhớ nhầm hợp trực giác** | §19.2 (dòng 948) | §14 |
| Bảng QR là upgrade; 11 ngày/tháng không tiêu tiền mặt (Visa 2023) | §19.2 (dòng 946) | §14 |
| Tiền lẻ đầu ngày — điềm xấu | §19.1 (dòng 928) | §14 |
| Cô Mai: chủ tạp hoá làm ăn được, nguồn đổi tiền lẻ + sổ nợ | §19.5 | §9 NPC 7 |
| HT3 — nhớ nhầm chỉ giữ nếu truy vết được nguồn | §16 HT3 (dòng 670–676) | §12 |
| HT4 — vòng kinh tế 1 quyết định | §16 HT4 | §10 hàng 2 |
| Quan hệ nhà cung cấp, đặt trước rẻ hơn nhưng cam kết cứng | §22 mục bổ sung 2 (dòng 1047) | §10 hàng 2 |
| Delivery-diff, `take(1)`, salience lúc ăn | — | §6, §3.1 |
| Trí nhớ 3 tầng, decay tapering, chống chồng chất | — | §12 |
| Ngôn ngữ gọi món, "bánh mì không" chấm sữa đặc | §19.3 | §14 |
| Cỡ chữ, icon khác hình dáng, công tắc sổ tay cuối ngày | §20 | §15 |

---

## 9. Đề xuất sửa CANON

**(9.1) — Ghi rõ tip KHÔNG phải kênh kinh tế của quan hệ.**
CANON §3.2 ghi `FREE_EXTRA` có *"diminishing returns"* và §5 ghi `CONFIRMED` *"ảnh hưởng tip"*, nhưng không ở đâu nói tip **nhỏ tới mức nào**. Doc này chốt trần **≤4% doanh thu mùa** và chuyển toàn bộ giá trị kinh tế của quan hệ sang **tần suất ghé × số ổ × giới thiệu**. Đề nghị thêm một dòng vào §13: *"Giá trị kinh tế của quan hệ nằm ở tần suất và số lượng mua, không nằm ở tip. Trần tip toàn mùa: 4% doanh thu."* Lý do: không có dòng này thì lúc tune sẽ có người tăng tip để "thưởng cho chơi tốt", và làm vậy là biến quan hệ thành tiền — trái §8 mục (f).

**(9.2) — Bổ sung `dishQuality` như một đầu vào first-class của delivery-diff.**
CANON §6 mô tả `diff(order.spec, dish)` chỉ theo **thành phần** (thiếu món, sai tỉ lệ). Doc này thêm một nguồn defect thứ hai: **chất lượng nguyên liệu theo tuổi lô hàng**. Nó đi cùng đường dẫn và cùng luật `take(1)`, nhưng là một trục khác. Đề nghị §6 ghi: *"`diff` chạy trên hai trục: thành phần và chất lượng lô hàng. Cả hai cùng `take(1)`."* Không có dòng này thì cả ràng buộc §13.1 không có đường nối vào phản ứng của NPC.

**(9.3) — Thêm "hũ đồ chua" vào danh sách chi tiết môi trường bắt buộc.**
CANON §14.1 liệt kê *ghế nhựa, hũ đũa, bảng hiệu đỏ chữ vàng, xe máy dựng sát vách, chậu trầu bà*. Với cơ chế đường ống ở §2.1.2, **ba hũ đồ chua ở ba độ tuổi khác nhau, xếp cạnh nhau, nước ngâm ba màu khác nhau** trở thành một vật thể gameplay **và** một chi tiết văn hoá. Đề nghị thêm vào danh sách. Chi phí art: gần bằng 0 (một sprite, ba biến thể màu).

**(9.4) — Ghi nhận "bánh mì không" là một món có chức năng cơ học.**
CANON §14 liệt kê *"bánh mì không"* trong ngôn ngữ gọi món. §2.3 của doc này dùng nó làm **lối thoát có phẩm giá khi hết nhân** (hạ `MADE_THEM_WAIT` 55 → 30, sinh `CARED_FOR_THEM`). Đề nghị ghi nhận để không ai cắt nó khi tinh gọn công thức.
