# P1-03 — Đơn hàng và delivery-time diff

> ## ⚡ REVAMP 2026-10-20 — ⚠️ CHẾT MỘT PHẦN
> Căn cứ: [`CANON.md`](../CANON.md) bản revamp. Phần ☠️ không dùng làm căn cứ.
>
> | Mục | Trạng thái | Lý do / thay bằng |
> |---|---|---|
> | §2.2E Tham chiếu "như mọi bữa", "y chang bữa qua" (`usualRef`, `lastOrderRef`) · §2.3 nhánh "bình thường" theo `usual` | ☠️ | Đề bài bỏ order "như bữa hôm qua" |
> | §2.11 `REMEMBERED_USUAL` (cả mục) | ☠️ | Sự kiện đã chết |
> | §2.4 Câu vòng vo là "memory hook" cho `REMEMBERED_STORY` | ☠️ | Hết trí nhớ NPC; câu vòng vo chứa thông tin đơn vẫn giữ |
> | §2.2A Danh sách nhân, giá theo cỡ | 🔁 | Topping mở dần + 3 mốc giá (R2) |
> | §2.5.2 `hiddenTaste` → "tốc độ lên quan hệ" | ☠️→🔁 | Bỏ phần quan hệ; lệch khẩu vị → yếu tố review (R4) |
> | §2.7.4 Ghi chú cặp thoại: seed gossip, giá trị quan hệ · giọng thoại | ☠️ / ⏳ | Đồn thổi, quan hệ chết; thoại viết lại gen Z (R6) |
> | §2.8 Phản ứng trễ: ghi memory, nhân chứng cho gossip, sổ tay cô Ba | ☠️ | Khách không quay lại → để lại review (R4) |
> | §2.9 `silentScore` "ngầm" chỉ vào tip | 🔁 | Lỗi còn lại vào sao, có thể hiện thành chữ trong review (CANON §6, R4) |
> | §2.10 Dị ứng: `trustCeiling −0.15`, "tối đa 3/12 cả mùa", quay lại +3/+6 ngày | 🔁 | Hệ quả → 1★ / review; bỏ trần theo mùa (R4) |
> | §2.12 Tip theo bucket quan hệ | ☠️→⏳ | Bucket chết; tip còn hay bỏ chốt ở R4 |
> | §3 Schema `usualRef`, memory, tier | ☠️ | Như trên |
>
> **Còn dùng được:** không parse ngôn ngữ, bảng câu nói → thuộc tính, `OrderSpec`, `diff()` 5 loại defect, liên kết ANTICIPATED/DISCOVERED, phản ứng lúc ăn, `take(1)` cho lời tại quầy — lõi của review ở R4.

**Thuộc phase:** P1 — Vertical slice
**Phụ thuộc:** `P1-02` (hệ nhận thấy — **bắt buộc đọc trước**) · `P1-01` (vòng lặp một khách) · `P0-04` (save)
**Cung cấp cho:** `P2-01` (rule DB thoại) · `P2-02` (trí nhớ) · `P2-03` (đồn thổi) · `P3-01` (kinh tế)
**Trạng thái:** **Chốt** về cơ chế và thuật toán. **Cần đo** hằng số tip và ngưỡng similarity của `usual`.

---

## 1. Mục tiêu

Doc này mô tả toàn bộ đường đi của một đơn hàng: **khách nói gì → người chơi hiểu gì → người chơi làm gì → hệ thống so sánh → khách nói gì tiếp**.

Nó phục vụ ba trụ cột:

- **T2 — Món ăn LÀ lựa chọn hội thoại.** Không có dialogue tree. Người chơi không bao giờ chọn câu nói; họ chọn nguyên liệu, và **nguyên liệu chính là câu trả lời**. Cái `diff()` ở §2.6 là chỗ câu trả lời đó được "đọc".
- **T1 — Khách chấm QUÁ TRÌNH.** Hiện thân kỹ thuật là §2.7: mỗi defect mang một `stimId`, và lúc giao bánh ta tra `npc.observations[stimId].state`. **Cùng một lỗi, hai câu thoại hoàn toàn khác nhau** tuỳ khách có chứng kiến hay không. CANON §6 gọi đây là *"kỹ thuật lõi, ROI cao nhất trên mỗi dòng thoại"*.
- **T3 — Không hiện chỉ số.** Đơn quen của khách (`usual`) game **biết** nhưng **không hiện ra**. Tip không có breakdown. Điểm số không tồn tại.

Một câu kiểm tra doc này: *nếu người chơi quên bỏ hành, và bà Bảy đang nhìn tay họ lúc đó, thì câu bà Bảy nói phải khác hẳn câu bà nói khi bà đang bấm điện thoại — và người chơi phải nhận ra sự khác biệt đó mà không cần ai giải thích.*

---

## 2. Cơ chế

### 2.1. Luật nền: **game KHÔNG parse ngôn ngữ tự nhiên lúc runtime**

Đây là quyết định kiến trúc quan trọng nhất của doc, và nó phải được nói trước mọi thứ khác.

Khách gọi món bằng tiếng Việt đời thường (CANON §14): *"cho một ổ đầy đủ"*, *"cho ít rau"*, *"đừng bỏ ngò"*. Cám dỗ rất lớn là viết một parser. **Không.** Cấu trúc thật là:

```
          NGƯỜI CHƠI PARSE                    GAME CHỈ LƯU
┌────────────────────────────────┐   ┌──────────────────────────────┐
│  utterance (tiếng Việt, có     │   │  spec (OrderSpec, ẩn)        │
│  giọng, có dấu, có vòng vo)    │   │  — tác giả viết tay cùng lúc │
│  ↓ phát ra loa + hiện chữ      │   │  ↓ không bao giờ hiện ra     │
│  ↓ NGƯỜI CHƠI nghe và hiểu     │   │  ↓ chỉ dùng cho diff()       │
└────────────────────────────────┘   └──────────────────────────────┘
```

Mỗi dòng gọi món trong `content/orders/*.json` là một **cặp đã ghép sẵn**: `utterance` (thứ người chơi nghe) và `spec` (thứ `diff()` dùng). Tác giả viết cả hai cùng lúc. Không có bước suy luận nào lúc chạy.

**Ba hệ quả:**

1. **Người parse là não người chơi.** Đó chính là gameplay. Nếu máy parse hộ rồi hiện ra checklist, thì T2 chết — món ăn không còn là lựa chọn hội thoại, nó thành một cái đơn hàng trong Overcooked.
2. **Không bao giờ có lỗi parse.** Không có trường hợp "khách nói X mà hệ thống hiểu Y". Mọi khác biệt giữa `utterance` và `spec` là **lỗi tác giả**, bắt được bằng lint (xem §6).
3. **Bản dịch tiếng Anh dễ.** Chỉ cần dịch `utterance`. `spec` không đổi. Đại từ xưng hô **không dịch** (CANON §2).

**Công cụ lint bắt buộc** (`tools/lint-orders.ts`): với mỗi cặp, kiểm tra mọi từ khoá trong `utterance` có mặt trong `spec` theo một từ điển ánh xạ (bảng §2.2), và ngược lại mọi mục `required`/`forbidden` của `spec` đều có căn cứ trong `utterance` **hoặc** được đánh dấu `implicit: true`. Chạy trong CI. Đây là thứ thay cho parser.

---

### 2.2. Bảng câu nói → thuộc tính đơn hàng

Nguyên văn 9 câu của CANON §14 được in đậm. Phần còn lại mở rộng theo cùng giọng.

#### A. Chọn nhân

| Câu khách nói | Thuộc tính `spec` |
|---|---|
| **"cho một ổ đầy đủ"** | `required: [thit_nguoi, cha_lua, pate]` + toàn bộ rau chuẩn + sốt · `ratios` mặc định 1.0 |
| **"bánh mì không"** | `required: [banh_mi]` · `forbidden: [*]` — chỉ ổ bánh trần, không nhân. **Đây là cái bẫy dịch: không phải "không có gì đặc biệt"** |
| "cho ổ thịt" / "ổ thịt nguội" | `required: [banh_mi, thit_nguoi]` + rau chuẩn |
| "ổ heo quay nha con" | `required: [banh_mi, heo_quay]` + rau chuẩn |
| "cho cô ổ pate thôi" | `required: [banh_mi, pate]` · `forbidden: [thit_nguoi, cha_lua, heo_quay, xiu_mai, ga, ca]` — chữ **"thôi"** là dấu hiệu cấm |
| "xíu mại nha con" | `required: [banh_mi, xiu_mai]` |
| "ổ chả lụa" | `required: [banh_mi, cha_lua]` |
| "cho ổ cá" / "bánh mì cá mòi" | `required: [banh_mi, ca]` |
| "ổ gà xé" | `required: [banh_mi, ga]` |
| "cho ổ ốp la" | `required: [banh_mi, op_la]` · `qtyOf.op_la = 1` |
| "ốp la hai trứng" | `qtyOf.op_la = 2` |
| "thịt với pate" / "thịt pate" | `required: [banh_mi, thit_nguoi, pate]` — **hai nhân, không phải "đầy đủ"** |

#### B. Rau, ớt, sốt — chỉnh tỉ lệ

| Câu khách nói | Thuộc tính `spec` |
|---|---|
| **"cho ít rau"** | `ratios.rau = 0.5` |
| "nhiều rau vô con" | `ratios.rau = 1.5` |
| "ít đồ chua thôi" | `ratios.do_chua = 0.5` |
| "cho nhiều đồ chua nghen" | `ratios.do_chua = 1.5` |
| **"nhiều ớt"** | `ratios.ot = 2.0` |
| "cho chút ớt thôi" | `ratios.ot = 0.5` |
| "cay cay chút" | `ratios.ot = 1.3` — **mơ hồ, xem §2.3** |
| "thêm xì dầu" | `required += [xi_dau]` · `ratios.xi_dau = 1.5` |
| "nhiều sốt vô" | `ratios.sot = 1.5` |
| "khô khô chút nghen, đừng ướt" | `ratios.sot = 0.5` · `ratios.xi_dau = 0.5` — **một câu, hai thuộc tính** |
| "mặn mặn chút" | `ratios.muoi_tieu = 1.5` |

#### C. Cấm — đây là nhóm nguy hiểm nhất

| Câu khách nói | Thuộc tính `spec` | Mức |
|---|---|---|
| **"không hành"** | `forbidden += [hanh_la]` | Thường |
| **"đừng bỏ ngò"** | `forbidden += [ngo_ri]` | Thường |
| "khỏi ớt nha" | `forbidden += [ot]` | Thường |
| "cô hổng ăn được dưa leo" | `forbidden += [dua_leo]` | Thường |
| "đừng bỏ ngò nghen, chị dị ứng" | `forbidden += [ngo_ri]` · `allergy += [ngo_ri]` | **DỊ ỨNG** — xem §2.10 |
| "cho xin đừng có hành nha, em ăn vô là nổi mề đay" | `forbidden += [hanh_la]` · `allergy += [hanh_la]` | **DỊ ỨNG** |
| "chú kiêng đồ chua, bác sĩ dặn" | `forbidden += [do_chua]` · `medical: true` | **DỊ ỨNG** (cùng cơ chế) |

> **Luật tác giả cứng:** một mục chỉ vào `allergy` khi `utterance` **nói rõ** lý do sức khoẻ (dị ứng / bác sĩ / nổi mề đay / kiêng). *"Không hành"* đơn thuần **không phải** dị ứng. Lý do: hệ quả của dị ứng nặng gấp 3 (§2.10), và người chơi phải **nghe được** sự khác biệt trong câu nói.

#### D. Đóng gói, nhiệt độ, số lượng

| Câu khách nói | Thuộc tính `spec` |
|---|---|
| **"cho xin bịch"** | `packaging: TAKEAWAY_BAG` — giấy **và** bịch nilon |
| **"gói mang về"** | `packaging: TAKEAWAY` — giấy gói kín |
| **"ăn tại chỗ"** | `packaging: EAT_IN` — giấy mỏng nửa ổ + **cần có ghế trống** |
| "nướng lại giùm cô" | `temp: HOT` · `mustReheat: true` |
| "cho nóng nha" | `temp: HOT` |
| "để nguội cũng được, cô đem về" | `temp: ANY` |
| "cho hai ổ" | `qty: 2` |
| "hai ổ, một ổ không hành" | **`qty: 2` + tách thành 2 `OrderSpec` con.** Xem §2.5.3 |
| "cho ổ nhỏ thôi" | `size: SMALL` · giá ×0.75 |
| "gói kỹ giùm chị, trời mưa" | `packaging: TAKEAWAY_BAG` · `wrapCare: true` → làm đúng thì sinh `CARED_FOR_THEM` |

#### E. Tham chiếu — nhóm đắt giá nhất

| Câu khách nói | Thuộc tính `spec` |
|---|---|
| **"như mọi bữa"** / "như mọi khi" | `usualRef: true` — resolve từ `npc.usual`. **KHÔNG hiện ra.** Xem §2.11 |
| "cho cô cái thường lệ" | `usualRef: true` |
| "y chang bữa qua" | `lastOrderRef: true` — resolve từ đơn **gần nhất** của chính NPC đó (khác `usual`!) |
| "làm giống hôm qua đi con" | `lastOrderRef: true` |
| "cho ổ giống chị kia kìa" | `copyRef: <npcId khách vừa phục vụ>` — resolve từ đơn liền trước |
| "vậy đi, giống bữa trước" (sau khi đã đổi món) | `lastOrderRef: true` — **cái bẫy**: "bữa trước" ≠ "như mọi bữa" nếu bữa trước họ đổi món |

---

### 2.3. Cách gọi mơ hồ — và luật xử lý

Mơ hồ **không phải bug, là nội dung**. Nhưng nó phải mơ hồ theo cách **học được**, không phải theo cách đánh đố.

| Câu mơ hồ | Vùng mơ hồ | Luật giải quyết |
|---|---|---|
| **"đầy đủ"** | Có ngò không? Có ớt không? Có xì dầu không? | `spec` ghi 3 thứ này là **`optional`** — không tính defect dù bỏ hay không bỏ. **Nhưng `hiddenTaste` của NPC vẫn chấm** (§2.5.2). Bà Bảy thích có ngò; chị Lan không |
| **"cho ít rau"** | "Ít" là bao nhiêu? | `ratios.rau = 0.5`, nhưng **dung sai ±0.25** (§2.6.3). Bỏ 0.3 hay 0.7 đều không sao. Bỏ 0.1 hoặc 1.0 thì có |
| "cay cay chút" | Bao nhiêu ớt? | `ratios.ot = 1.3`, dung sai **±0.5** — rộng hơn, vì chính câu nói cũng mơ hồ hơn |
| "làm ngon ngon giùm cô" | Không có thông tin gì | `spec` **không thêm gì**. Nhưng bật cờ `raiseHiddenTasteWeight: 1.5` — khẩu vị ẩn được chấm nặng hơn. Đây là câu nói của người tin bạn |
| "sao cũng được" | Không có thông tin | `usualRef: true` nếu có `usual`, ngược lại dùng `defaultSpec` của archetype. **Và nếu làm sai thì defect nhẹ hơn ×0.5** — họ đã nói sao cũng được |
| "cho ổ gì nhanh nhất" | — | `spec = fastestBuildable(inventory)` · `temp: ANY` · **`patienceBaseSec` ×0.7** |
| "bình thường" | Giống "như mọi bữa" hay "đầy đủ"? | **Phụ thuộc `visitCount`:** `< 3` lần ghé → `= đầy đủ`; `≥ 3` lần → `usualRef: true`. Đây là chỗ hệ thống thưởng cho người chơi nhớ mặt khách |

> **Luật vàng về mơ hồ:** *mơ hồ phải nghiêng về phía người chơi.* Mỗi mục mơ hồ hoặc là `optional` (không tính defect), hoặc có **dung sai rộng hơn** mục nói rõ, hoặc có **hệ số defect ×0.5**. Người chơi không bao giờ bị phạt vì một câu nói không rõ. Họ chỉ **bỏ lỡ cơ hội** ghi điểm khẩu vị ẩn.

---

### 2.4. Cách gọi vòng vo — thông tin quan trọng nằm giữa câu

Đây là nơi game khó nhất, và cũng là nơi nó giống đời nhất. Người Việt không gọi món bằng cú pháp. Họ **nói chuyện**, và cái đơn hàng rơi ra ở giữa.

#### 2.4.1. Ba dạng vòng vo

**Dạng 1 — chôn giữa (`buried`).** Thông tin cấm nằm giữa một câu dài về chuyện khác.

> **Bà Bảy:** *"Trời ơi bữa nay nắng dữ con ơi, cô đi từ hồi năm giờ tới giờ... ủa mà cô nói trước nghe, cô hổng có ăn ngò được đâu nha, dị ứng đó, rồi cho cô ổ thịt thường thôi, chiều cô còn đi bán nữa."*

| Thứ tự nghe | Nội dung | Vào `spec`? |
|---|---|---|
| 1 | "nắng dữ, đi từ năm giờ" | Không — đây là **memory hook** cho `REMEMBERED_STORY` |
| 2 | **"hổng ăn ngò được, dị ứng"** | **`forbidden += ngo_ri` · `allergy += ngo_ri`** ← thông tin nặng nhất, nằm giữa |
| 3 | "ổ thịt thường thôi" | `required: [banh_mi, thit_nguoi]` · chữ "thôi" → `forbidden += [pate, cha_lua]` |
| 4 | "chiều còn đi bán" | Không — memory hook |

**Dạng 2 — đổi ý giữa chừng (`revised`).** Khách nói một thứ rồi sửa.

> **Ông Hải:** *"Cho chú ổ đầy đủ... à khoan, bữa nay chú uống rồi, cho ổ xíu mại đi, mà nhiều ớt vô nghen."*

Luật: **mục sau ghi đè mục trước cùng khoá.** `spec` cuối = `xiu_mai` + `ot 2.0`. Cờ `revised: true` → nếu người chơi làm theo câu **đầu**, defect được đánh dấu `fromRevision: true` và **salience ×0.6** (khách biết mình có đổi ý, họ bớt gắt). Nhưng **vẫn là defect**.

**Dạng 3 — nói hộ người khác (`proxy`).** Khách mua giùm người khác, nên có hai bộ yêu cầu.

> **Chị Lan:** *"Cho chị hai ổ. Một ổ chị, y chang mọi bữa. Còn một ổ cho nhỏ đồng nghiệp — nó ăn chay, em coi làm gì đó không có thịt giùm chị."*

→ `qty: 2`, tách 2 spec con: `[0] usualRef: true`, `[1] forbidden: [thit_nguoi, cha_lua, heo_quay, xiu_mai, pate, ca, ga]` (tức chay). Đây là đơn khó nhất trong game và nó chỉ xuất hiện sau ngày 15.

#### 2.4.2. Ba luật viết thoại vòng vo bắt buộc

1. **Thông tin cấm không bao giờ nằm ở từ cuối cùng.** Người chơi hay bấm bỏ qua ở cuối câu. Đặt cấm ở giữa (55–75% độ dài câu). Lint kiểm cái này.
2. **Mỗi câu vòng vo có tối đa 2 mục đi vào `spec`.** Quá 2 là đánh đố trí nhớ ngắn hạn, không phải thiết kế. (Ngoại lệ: dạng `proxy`, tối đa 3.)
3. **Luôn có một từ đệm báo hiệu trước mục quan trọng**: *"mà"*, *"nói trước nghe"*, *"nhớ"*, *"à"*, *"nghen"*, *"khoan"*. Người chơi học được các từ đệm này sau ~5 ngày và bắt đầu nghe có chủ đích. Đây là kỹ năng thật mà game dạy được.

#### 2.4.3. Trợ năng — bắt buộc

- **Text không bao giờ tự chạy tiếp** (CANON §15.1). Câu gọi món đứng trên màn hình cho tới khi người chơi bấm tiếp hoặc bắt đầu thao tác.
- **Nút "nghe lại"** — phát lại audio + hiện lại chữ. **Không giới hạn số lần.** Nhưng mỗi lần bấm tốn **1,5 giây** thời gian trong game (`waitSec` vẫn chạy). Đó là giá đúng: không giấu thông tin, chỉ tính thời gian.
- **Câu gọi món được ghim lại dưới dạng chữ nguyên văn** ở góc màn hình suốt lượt khách. **Chỉ chữ nguyên văn — không phải `spec` đã phân tích.** Đây là ranh giới T3 và nó rất quan trọng: game được phép lặp lại **dữ liệu thô nó đã nói ra**, không được phép **diễn giải hộ**.

---

### 2.5. `OrderSpec` — schema

#### 2.5.1. Cấu trúc

```ts
type Requirement = 'REQUIRED' | 'FORBIDDEN' | 'OPTIONAL';

type OrderSpec = {
  id: string;                     // `${npcId}:d${day}:${seq}`
  npcId: NpcId;
  day: number;

  // ── thứ NGƯỜI CHƠI nghe ─────────────────────────────────────
  utterance: string;              // nguyên văn tiếng Việt
  utteranceEn: string;            // phụ đề — đại từ KHÔNG dịch
  vo: string;                     // đường dẫn file lồng tiếng
  style: 'plain' | 'buried' | 'revised' | 'proxy';

  // ── thứ diff() dùng, KHÔNG BAO GIỜ hiện ra ──────────────────
  required:  ItemId[];
  forbidden: ItemId[];
  optional:  ItemId[];            // bỏ hay không bỏ đều không tính defect
  allergy:   ItemId[];            // tập con của forbidden, hệ quả ×3
  ratios:    Partial<Record<ItemId | RatioGroup, number>>;  // 1.0 = chuẩn
  tolerance: Partial<Record<ItemId | RatioGroup, number>>;  // mặc định 0.25

  temp: 'HOT' | 'WARM' | 'ANY';
  mustReheat: boolean;
  packaging: 'EAT_IN' | 'TAKEAWAY' | 'TAKEAWAY_BAG';
  wrapCare: boolean;
  size: 'SMALL' | 'REGULAR';
  qty: number;
  children?: OrderSpec[];         // khi qty > 1 và các ổ khác nhau

  // ── tham chiếu ──────────────────────────────────────────────
  usualRef: boolean;
  lastOrderRef: boolean;
  copyRef?: NpcId;

  // ── hệ số ───────────────────────────────────────────────────
  leniency: number;               // 1.0 chuẩn; 0.5 với "sao cũng được"
  revised: boolean;
  hiddenTasteWeight: number;      // 1.0 chuẩn; 1.5 với "làm ngon ngon giùm"

  price: number;                  // ₫, tính từ nhân + size
};
```

#### 2.5.2. Khẩu vị ẩn — `hiddenTaste`

> Đây là thứ NPC **không bao giờ nói ra**. Người chơi phải tự đoán qua nét mặt lúc cắn miếng đầu, qua tip, qua việc họ có quay lại không. (`idea.md` §22: *"Mỗi NPC có khẩu vị riêng ẩn"*.)

```ts
type TasteProfile = {
  manDam:  number;   // −1 nhạt  ..  +1 mặn đậm
  cay:     number;   // −1 không cay .. +1 rất cay
  rauNhieu:number;   // −1 ít rau .. +1 nhiều rau
  sotNhieu:number;   // −1 khô .. +1 ướt
  nuongKy: number;   // −1 mềm .. +1 giòn cháy cạnh
};
```

12 NPC + khẩu vị ẩn (không bao giờ hiện ra ở bất kỳ UI nào):

| NPC | `manDam` | `cay` | `rauNhieu` | `sotNhieu` | `nuongKy` | Câu duy nhất hé lộ (nếu làm đúng) |
|---|---|---|---|---|---|---|
| Bà Bảy | +0.3 | +0.6 | +0.4 | −0.2 | +0.5 | *"Ổ này giòn nè. Cô thích vậy đó."* |
| Chú Tư | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | — (chú xuề xoà thật) |
| Anh Dũng | +0.5 | +0.4 | −0.5 | +0.3 | −0.3 | *"Ừ đậm đà, ăn cho có sức chạy."* |
| Chị Lan | −0.4 | −0.6 | +0.6 | −0.6 | +0.2 | *"...Bữa nay vừa miệng."* (rất hiếm) |
| Bé Su | +0.2 | −0.3 | −0.6 | +0.5 | −0.4 | *"Ủa ngon dữ, để con quay cái!"* |
| Ông Hải | +0.7 | +0.8 | −0.3 | +0.2 | +0.3 | *"Cay vầy mới đã chớ!"* |
| Cô Mai | 0.0 | +0.2 | +0.3 | 0.0 | +0.2 | *"Ngon. Mai chị lấy hai ổ."* |
| Thầy Phúc | −0.3 | −0.4 | +0.5 | −0.4 | 0.0 | *"Thanh đạm vầy hợp với thầy."* |
| Chị Hạnh | −0.2 | −0.5 | +0.2 | −0.3 | 0.0 | *"Ừ, hợp khẩu vị chị."* (giọng Bắc) |
| Anh Bảo | +0.4 | +0.3 | −0.7 | +0.6 | −0.2 | *"Ngon anh ơi."* (không ngẩng lên) |
| Bà Sáu | +0.1 | +0.3 | +0.3 | 0.0 | 0.0 | *"Ngon nghen. Mai tui ghé nữa."* |
| Chú Kiệt | +0.4 | +0.5 | 0.0 | −0.2 | +0.6 | *"Được. Mày nướng khá đó."* |

**Cách chấm:**

```ts
function tasteScore(spec: OrderSpec, dish: Dish, npc: Npc): number {
  const t = npc.hiddenTaste;
  const d = dishTasteVector(dish);         // cùng 5 chiều, suy ra từ nguyên liệu thực tế
  let s = 0;
  for (const k of TASTE_KEYS) {
    const gap = Math.abs(t[k] - d[k]);     // 0..2
    s += Math.max(0, 1 - gap);             // 0..1 mỗi chiều
  }
  return (s / 5) * spec.hiddenTasteWeight; // 0..1 (hoặc tới 1.5)
}
```

**Ba luật cứng về khẩu vị ẩn:**

1. **Không bao giờ sinh defect.** `tasteScore` chỉ ảnh hưởng `tip` (§2.12) và **tốc độ lên quan hệ**. Người chơi không thể "làm sai khẩu vị" — họ chỉ chưa làm đúng.
2. **Không bao giờ hiện ra.** Không icon, không sao, không "khẩu vị: ưa cay". T3.
3. **Chỉ hé lộ qua đúng một câu thoại**, và câu đó chỉ phát khi `tasteScore ≥ 0.85` **và** `visitCount ≥ 4`. Nghĩa là: bạn phải làm đúng nhiều lần rồi mới được nghe. Đó là phần thưởng, không phải hướng dẫn.

#### 2.5.3. Đơn nhiều ổ

Khi `qty > 1`:
- Các ổ **giống nhau** → một `OrderSpec` với `qty: n`. `diff()` chạy `n` lần, defect gộp theo `max`, không cộng.
- Các ổ **khác nhau** → `children: OrderSpec[]`, mỗi con có `qty: 1`. `diff()` chạy độc lập từng con, `take(1)` áp cho **toàn đơn**, không phải từng ổ. Lý do: `take(1)` bảo vệ độ rõ tín hiệu (§2.9), và hai ổ hai lỗi vẫn là một lần đưa bánh.

---

### 2.6. `diff(order.spec, dish)` — thuật toán

#### 2.6.1. Năm loại defect

| `DefectKind` | Nghĩa | `baseSalience` tại quầy | Zone kích thích | Thời điểm sinh kích thích |
|---|---|---|---|---|
| `MISSING` | Thiếu thứ khách đã gọi | **20** | `BOARD` | Khi người chơi **rời giai đoạn** mà món đó thuộc về |
| `UNWANTED` | Bỏ thứ khách cấm | **24** | `BOARD` | **Ngay khi đặt** món đó vào bánh |
| `WRONG_RATIO` | Sai tỉ lệ ngoài dung sai | **12** | `BOARD` | Khi rời giai đoạn |
| `WRONG_TEMP` | Bánh nguội / không nướng lại | **18** | `OVEN` | Khi bắt đầu gói |
| `WRONG_PACKAGING` | Sai kiểu gói | **10** | `HANDS` | Khi gói xong |

Cộng một loại **không sinh kích thích, không bao giờ được nói ra**:

| `TASTE_OFF` | Lệch khẩu vị ẩn | — | — | Chỉ vào `silentScore` và `tip` |

#### 2.6.2. Giai đoạn ráp bánh — nền của `MISSING`

`MISSING` cần một mốc thời gian để "phạm lỗi". Mốc đó là **rời giai đoạn**. Quy trình ráp có 6 giai đoạn tuyến tính (`P1-01`):

```
  1 RACH ──→ 2 PATE ──→ 3 NHAN ──→ 4 RAU ──→ 5 SOT ──→ 6 GOI
  rạch bánh   quết pate  thịt/chả   đồ chua   sốt/xì    gói giấy
                         heo quay   dưa leo   dầu/muối  + bịch
                         xíu mại    hành/ngò  tiêu
                                    ớt
```

Khi người chơi bấm sang giai đoạn kế, mọi `required` thuộc giai đoạn vừa rời mà chưa có → sinh `MISSING` **ngay lúc đó**. Kích thích sống từ đó tới lúc trao bánh.

**Hệ quả quan trọng:** lỗi ở giai đoạn 3 (nhân) có kích thích sống lâu hơn lỗi ở giai đoạn 5 (sốt). Nhìn bảng hiệu chỉnh `P1-02` §5.1 hàng 4: `ORDER_DEFECT` tại `FRONT_CENTER` + nhìn tay cần **5,88s**. Nên:

| Giai đoạn phạm lỗi | Kích thích sống (s) | `FRONT_CENTER` + nhìn tay | `QUEUE_2` |
|---|---|---|---|
| 2 (pate) | 9–14 | 🟩 gần như luôn bị thấy | 🟥 |
| 3 (nhân) | 7–11 | 🟩 thường bị thấy | 🟥 |
| 4 (rau) | 5–8 | 🟨 khoảng một nửa | 🟥 |
| 5 (sốt) | 3–5 | 🟥 hiếm khi | 🟥 |
| 6 (gói) | 1–2 | 🟥 không bao giờ tại quầy | 🟥 |

→ **Quên pate thì bị bắt tại chỗ. Quên ớt thì bị phát hiện lúc ăn.** Người chơi học được luật này bằng cách chơi, và nó đúng với trực giác: thứ bỏ sớm thì lộ lâu hơn. Đây là chỗ hệ thống có chiều sâu **mà không cần thêm một dòng code nào** — nó rơi ra từ việc ghép `diff()` với `perception`.

#### 2.6.3. Thuật toán đầy đủ

```ts
// ────────────────────────────────────────────────────────────────
// craft/diff.ts
// ────────────────────────────────────────────────────────────────

type Defect = {
  kind: DefectKind;
  itemId?: ItemId;
  group?: RatioGroup;
  stimId: string;            // ← KHOÁ LIÊN KẾT NGƯỢC VỚI P1-02
  salienceCounter: number;   // thang 0..100, dùng cho perception tại quầy
  salienceEat: number;       // thang 0..100, dùng lúc ăn
  magnitude: number;         // 0..1 — mức độ lệch, dùng cho silentScore
  isAllergy: boolean;
  fromRevision: boolean;
  stage: Stage;              // giai đoạn phạm lỗi
};

const BASE: Record<DefectKind, number> = {
  MISSING: 20, UNWANTED: 24, WRONG_RATIO: 12, WRONG_TEMP: 18, WRONG_PACKAGING: 10,
};

// Trọng số theo món — thứ đắt/đặc trưng thì lỗi nặng hơn
const ITEM_WEIGHT: Record<ItemId, number> = {
  pate: 1.4, thit_nguoi: 1.3, heo_quay: 1.4, xiu_mai: 1.3, cha_lua: 1.2,
  op_la: 1.3, ca: 1.2, ga: 1.2,
  do_chua: 1.0, dua_leo: 0.8, hanh_la: 0.7, ngo_ri: 0.7, ot: 0.8,
  sot: 1.0, xi_dau: 0.8, muoi_tieu: 0.6,
  banh_mi: 2.0,                                  // quên cả ổ bánh thì thôi rồi
};

function diff(spec: OrderSpec, dish: Dish, npc: Npc): Defect[] {
  const out: Defect[] = [];
  const resolved = resolveRefs(spec, npc);       // §2.11 — giải "như mọi bữa"

  // ── 1. MISSING ────────────────────────────────────────────────
  for (const item of resolved.required) {
    if (dish.has(item)) continue;
    out.push(mk('MISSING', item, resolved, {
      magnitude: 1.0,
      stage: stageOf(item),
    }));
  }

  // ── 2. UNWANTED ───────────────────────────────────────────────
  for (const item of dish.items()) {
    if (!resolved.forbidden.includes(item)) continue;
    const isAllergy = resolved.allergy.includes(item);
    out.push(mk('UNWANTED', item, resolved, {
      magnitude: 1.0,
      isAllergy,
      stage: stageOf(item),
    }));
  }

  // ── 3. WRONG_RATIO ────────────────────────────────────────────
  for (const [key, want] of Object.entries(resolved.ratios)) {
    if (resolved.optional.includes(key as ItemId)) continue;   // mơ hồ → bỏ qua
    const got = dish.ratioOf(key);
    if (got === undefined) continue;                            // đã tính ở MISSING
    const tol  = resolved.tolerance[key] ?? DEFAULT_TOLERANCE;  // 0.25
    const gap  = Math.abs(got - want);
    if (gap <= tol) continue;
    out.push(mk('WRONG_RATIO', key as ItemId, resolved, {
      magnitude: clamp01((gap - tol) / 1.0),                    // lệch 1.25 → 1.0
      stage: stageOf(key as ItemId),
    }));
  }

  // ── 4. WRONG_TEMP ─────────────────────────────────────────────
  if (resolved.temp === 'HOT' && dish.tempC < TEMP_HOT_MIN) {
    out.push(mk('WRONG_TEMP', undefined, resolved, {
      magnitude: clamp01((TEMP_HOT_MIN - dish.tempC) / 25),
      stage: 'GOI',
    }));
  }
  if (resolved.mustReheat && !dish.wasReheated) {
    out.push(mk('WRONG_TEMP', undefined, resolved, { magnitude: 1.0, stage: 'GOI' }));
  }

  // ── 5. WRONG_PACKAGING ────────────────────────────────────────
  if (dish.packaging !== resolved.packaging) {
    // Gói kỹ hơn yêu cầu KHÔNG phải lỗi. Gói sơ hơn mới là lỗi.
    if (PACK_RANK[dish.packaging] < PACK_RANK[resolved.packaging]) {
      out.push(mk('WRONG_PACKAGING', undefined, resolved, {
        magnitude: 1.0, stage: 'GOI',
      }));
    }
  }
  if (resolved.packaging === 'EAT_IN' && !hasFreeChair()) {
    out.push(mk('WRONG_PACKAGING', undefined, resolved, { magnitude: 0.6, stage: 'GOI' }));
  }

  // ── 6. TASTE_OFF — không sinh kích thích, không bao giờ nói ra ─
  const ts = tasteScore(resolved, dish, npc);
  if (ts < 0.55) {
    out.push({
      kind: 'TASTE_OFF', stimId: '', salienceCounter: 0,
      salienceEat: 0, magnitude: 1 - ts, isAllergy: false,
      fromRevision: false, stage: 'GOI',
    });
  }

  return out;
}

function mk(kind: DefectKind, item: ItemId | undefined, spec: OrderSpec, x: Partial<Defect>): Defect {
  const w    = item ? (ITEM_WEIGHT[item] ?? 1.0) : 1.0;
  const alg  = x.isAllergy ? ALLERGY_MUL : 1.0;                 // 3.0
  const rev  = spec.revised ? REVISION_MUL : 1.0;               // 0.6
  const len  = spec.leniency;                                   // 1.0 hoặc 0.5
  const mag  = x.magnitude ?? 1.0;

  const sCounter = clamp(BASE[kind] * w * alg * rev * len * mag, 0, 100);
  const sEat     = clamp(sCounter * EAT_MULTIPLIER, 0, 100);    // ×5

  return {
    kind, itemId: item,
    stimId: `ORDER_DEFECT:${spec.id}:${kind}:${item ?? '_'}`,   // ỔN ĐỊNH, TÁI TẠO ĐƯỢC
    salienceCounter: sCounter,
    salienceEat: sEat,
    magnitude: mag,
    isAllergy: x.isAllergy ?? false,
    fromRevision: spec.revised,
    stage: x.stage ?? 'GOI',
  };
}
```

**Hằng số `EAT_MULTIPLIER = 5.0`** được chọn để khớp CANON §3.1: `ORDER_DEFECT` *"20 tại quầy → 100 lúc ăn"*. `20 × 5 = 100`. ✓

#### 2.6.4. Bảng salience đã tính sẵn — dùng để tune

`revised = false`, `leniency = 1.0`, `magnitude = 1.0`.

| Defect | Món | `w` | Dị ứng? | Tại quầy | Lúc ăn | `t_confirm` @FRONT_CENTER+nhìn tay |
|---|---|---|---|---|---|---|
| `MISSING` | `banh_mi` | 2.0 | — | 40,0 | 100 | 2,94 s |
| `MISSING` | `pate` | 1.4 | — | 28,0 | 100 | 4,20 s |
| `MISSING` | `thit_nguoi` | 1.3 | — | 26,0 | 100 | 4,52 s |
| `MISSING` | `do_chua` | 1.0 | — | 20,0 | 100 | **5,88 s** ← chuẩn CANON |
| `MISSING` | `ngo_ri` | 0.7 | — | 14,0 | 70,0 | 8,40 s |
| `MISSING` | `muoi_tieu` | 0.6 | — | 12,0 | 60,0 | 9,80 s |
| `UNWANTED` | `hanh_la` | 0.7 | không | 16,8 | 84,0 | 7,00 s |
| `UNWANTED` | `ngo_ri` | 0.7 | **có** | **50,4** | **100** | **2,33 s** |
| `UNWANTED` | `ot` | 0.8 | **có** | **57,6** | **100** | **2,04 s** |
| `WRONG_RATIO` | `rau` (lệch 1.25) | 1.0 | — | 12,0 | 60,0 | 9,80 s |
| `WRONG_RATIO` | `ot` (lệch 0.75) | 0.8 | — | 4,8 | 24,0 | 24,5 s |
| `WRONG_TEMP` | — | 1.0 | — | 18,0 | 90,0 | — (lộ lúc chạm tay) |
| `WRONG_PACKAGING` | — | 1.0 | — | 10,0 | 50,0 | — (lộ lúc trao) |

**Ba điều bảng này nói ra:**

1. **Dị ứng bị bắt tại quầy gần như chắc chắn** (2,0–2,3 s). Đúng thiết kế — xem §2.10. Người chơi phải có cơ hội sửa **trước khi** trao bánh.
2. **Quên ổ bánh là lỗi nặng nhất** (40 tại quầy) và cũng buồn cười nhất. Giữ.
3. **`WRONG_RATIO` gần như không bao giờ bị bắt tại quầy.** Đó là cửa cho micro-cheat, và đó chính là lý do `P1-02` §2.13 (phát hiện theo PATTERN) phải tồn tại. Hai doc bịt hai đầu của cùng một lỗ.

---

### 2.7. Liên kết ngược với perception — kỹ thuật hay nhất của cả dự án

> `idea.md` §18.3: *"Cùng một lỗi, hai câu thoại hoàn toàn khác nhau tuỳ khách có chứng kiến hay không. Đây là ROI cao nhất trên mỗi dòng thoại viết ra — và nó chính là hiện thân kỹ thuật của toàn bộ ý tưởng 'NPC chấm quá trình'."*

#### 2.7.1. Cơ chế — sáu dòng

```ts
for (const defect of diff(order.spec, dish, npc)) {
  const obs = npc.observations[defect.stimId];
  defect.witness = (obs && RANK[obs.state] >= RANK['NOTICED'])
    ? 'ANTICIPATED'     // họ đã thấy bạn làm sai từ trước
    : 'DISCOVERED';     // họ chỉ vừa phát hiện lúc này
}
```

Toàn bộ sức mạnh nằm ở **`defect.stimId`**. Nó là khoá chung giữa hai hệ thống:

```
  craft/diff.ts                       sim/perception.ts
  ─────────────                       ─────────────────
  mk() sinh ra                        spawnStimulus() dùng
  stimId = "ORDER_DEFECT:             stim.id = <cùng chuỗi>
     ba_bay:d7:1:MISSING:hanh_la"           ↓
        │                             npc.observations[stim.id]
        │                                   ↓
        └──────── tra cứu lúc trao ────→ .state
```

`stimId` phải **ổn định và tái tạo được**: cùng đơn + cùng loại lỗi + cùng món = cùng chuỗi, dù sinh ở thời điểm nào. Không dùng số tăng dần toàn cục, không dùng `uuid()`. Nếu `stimId` không khớp, `witness` luôn ra `DISCOVERED` và **toàn bộ nửa hay của game biến mất trong im lặng** — không crash, không log, chỉ là thoại nhạt đi. Đây là bug nguy hiểm nhất trong doc này, và nó có test riêng ở §6.

#### 2.7.2. Vì sao ngưỡng là `NOTICED` chứ không phải `CONFIRMED`

CANON §6 viết `>= NOTICED`. Đúng, và lý do đáng nói:

- `CONFIRMED` (≥1.0) nghĩa là khách **chắc chắn** và đã phản ứng đầy đủ **tại quầy** — họ đã nói rồi. Lúc trao bánh thì đó là chuyện cũ.
- `NOTICED` (0.70–1.0) nghĩa là khách **ngờ ngợ mà chưa chắc**. Đó chính xác là trạng thái làm cho câu *"tôi thấy con quên bỏ hành rồi đó"* trở nên hay: họ **đã nghi**, và cái bánh **xác nhận** điều họ nghi.
- Ngưỡng `GLIMPSED` (0.35) thì quá lỏng — "liếc thấy gì đó" không đủ để nói một câu khẳng định.

Nói cách khác: `NOTICED` là trạng thái *"tôi tưởng tôi thấy"*, và `ANTICIPATED` là câu nói của người vừa được chứng minh là mình đúng. Đó là một cảm xúc rất cụ thể và rất người.

#### 2.7.3. Ba khác biệt bắt buộc giữa hai loại thoại

Không phải chỉ đổi chữ. Viết thoại theo ba luật này thì cặp nào cũng ra đúng:

| | `ANTICIPATED` | `DISCOVERED` |
|---|---|---|
| **Thì** | Quá khứ — *"cô **thấy** con..."*, *"nãy tao **ngó** thấy..."* | Hiện tại — *"ủa...", "cái này..."* |
| **Hướng chú ý** | Nhắm vào **bạn** — họ nói về việc bạn làm | Nhắm vào **ổ bánh** — họ nói về vật trước mặt |
| **Ngữ điệu** | Bình tĩnh hơn, có khi còn **thương**. Họ đã có thời gian tiêu hoá | Bật ra, có dấu **"ủa"**, cao độ nhảy lên rồi rơi |

Và một luật thứ tư quan trọng về cân bằng cảm xúc:

> **`ANTICIPATED` phải nhẹ hơn `DISCOVERED` về mặt hệ quả.** Cụ thể: `tipPenaltyMul` của `ANTICIPATED` là **0,80**, của `DISCOVERED` là **1,00**. Lý do: nếu bị thấy lúc làm mà còn bị phạt nặng hơn, người chơi sẽ học cách **giấu** thay vì học cách **làm đúng** — và đó là bài học sai. Bị thấy rồi vẫn đưa ra là **thành thật**; giấu được rồi mới bị phát hiện là **may rủi hết hạn**.

#### 2.7.4. Tám cặp thoại — tiếng Việt miền Nam, đúng giọng CANON §9

---

**Cặp 1 — `MISSING: hanh_la` · Bà Bảy** (soi 0.9 / nóng 0.6 / dễ tha 0.8 / thân thiện 0.7 — nói thẳng nhưng hiền)

> **ANTICIPATED:** *"Cô thấy rồi nha con. Nãy con bốc qua luôn cái hành, cô ngó thấy mà cô hổng nói. Thôi khỏi, đưa đây cô ăn, cô cũng hổng có ăn hành nhiều đâu."*
>
> **DISCOVERED:** *"Ủa... hành đâu con? Ủa mà thôi, kệ. Con làm nhiều quá quên chớ gì."*

Ghi chú diễn xuất: ANTICIPATED — bà nhìn **mặt người chơi** khi nói câu đầu, rồi mới cúi xuống bánh. DISCOVERED — bà nhìn **vô ổ bánh** suốt câu, không ngẩng lên.

---

**Cặp 2 — `UNWANTED: ngo_ri` (DỊ ỨNG) · Bà Bảy**

> **ANTICIPATED:** *"Con ơi con! Nãy cô đã nói rồi mà — cô thấy con nhón cọng ngò bỏ vô rồi kìa. Con lấy ra giùm cô nghen, cô ăn vô là nổi đỏ hết mặt à."*
>
> **DISCOVERED:** *"Ngò! Trời đất ơi... con ơi cô có dặn mà con. Thôi... thôi con làm lại giùm cô ổ khác đi. Cô hổng có giận đâu, mà cô ăn vô là cô đi bệnh viện đó con."*

Ghi chú: ANTICIPATED xảy ra **trước khi trao bánh** (bà đã NOTICED từ lúc bạn bốc ngò) → người chơi **còn kịp sửa**. DISCOVERED xảy ra lúc trao → phải làm lại, mất nguyên liệu và thời gian. Xem §2.10.

---

**Cặp 3 — `MISSING: do_chua` · Chị Lan** (soi 0.9 / nóng 0.1 / dễ tha 0.2 / thân thiện 0.3 — **người im lặng biến mất**)

> **ANTICIPATED:** *"Chị thấy rồi."* — ba chữ. Nói xong nhận bánh, trả tiền đúng, **không tip**, quay đi.
>
> **DISCOVERED:** — **không có câu nào.** Chị mở giấy ra, nhìn vô ổ bánh **đúng hai giây**, gấp giấy lại, trả tiền, đi. Camera giữ ở lưng chị thêm một nhịp.

Ghi chú bắt buộc: **cặp này là cặp quan trọng nhất trong game.** `idea.md` §9.3: *"phản ứng im lặng phải nguy hiểm hơn phản ứng ồn ào."* Với chị Lan, `DISCOVERED` nặng hơn `ANTICIPATED` về cảm giác đúng như nó nặng hơn về hệ quả: `visitInterval` giãn từ 1 ngày lên **5 ngày**, và người chơi **không có cách nào biết tại sao** trừ khi họ tự nhớ ra.

---

**Cặp 4 — `WRONG_RATIO: rau` (bỏ quá ít) · Ông Hải, TRƯỚC 10 giờ sáng** (nóng 0.9, nhưng CANON §9: *"Trước 10 giờ sáng rất tử tế — đó mới là cái đau"*)

> **ANTICIPATED:** *"Ờ... nãy chú có ngó thấy con bốc hơi ít rau. Thôi không sao con, chú ăn vầy cũng được. Làm ăn sáng sớm cực hả con."*
>
> **DISCOVERED:** *"Ủa rau ít vậy con? ...Ờ thôi, chắc rau lên giá. Chú hiểu mà."*

**Cặp 4b — cùng lỗi, cùng người, SAU 10 giờ** (đã nhậu)

> **ANTICIPATED:** *"Ê! Nãy tao đứng đây tao ngó thấy hết á! Bốc có nhiêu đó rau mà kêu là đầy đủ hả?! Bây làm ăn kiểu gì vậy?"*
>
> **DISCOVERED:** *"Cái gì đây?! Rau đâu?! Mở ra coi! Bây coi lại coi có phải rau không!"*

Ghi chú: hai cặp này là **cùng một `defect`, cùng một `witness`, cùng một `salience`** — chỉ khác giờ trong ngày. Đây là bằng chứng rằng tầng 2 (diễn giải) và tầng 3 (phản ứng) tách bạch khỏi tầng 1 và tầng `diff`. Và nó là chỗ người chơi học được bài học buồn nhất của game: **cùng một con người, hai thời điểm, hai người khác nhau.**

---

**Cặp 5 — `WRONG_TEMP` (bánh nguội, khách dặn nướng lại) · Thầy Phúc** (soi 0.8 / nóng 0.2 — *"NPC dạy người chơi đọc hệ thống mà không phạt nặng"*)

> **ANTICIPATED:** *"Nãy thầy thấy con lấy ổ ở dưới ra mà hổng có đưa vô lò. Không sao đâu con, thầy nói để lần sau con nhớ thôi. Bánh nguội thì vỏ nó dai, ăn mất ngon chớ không phải dở."*
>
> **DISCOVERED:** *"Ủa... nguội rồi nè con. Thầy có dặn nướng lại mà... Thôi, thầy cầm về hâm cũng được. Mà lần sau con nhớ nghen."*

Ghi chú: thầy Phúc là NPC duy nhất mà `ANTICIPATED` **dài hơn và có nội dung dạy**. Đó là chức năng thiết kế của ông. Mọi cặp thoại của thầy Phúc phải có một câu giải thích **tại sao** lỗi đó là lỗi.

---

**Cặp 6 — `MISSING: ot` · Anh Bảo** (soi 0.3, `gazeFactor` thấp nhất dàn — *"sandbox để người chơi học hệ perception"*)

> **ANTICIPATED** (hiếm — chỉ khi người chơi làm quá chậm hoặc anh hết `phoneBudget`): *"Ờ... nãy em có ngước lên đúng lúc anh bỏ qua chỗ ớt á. Thôi khỏi anh, em ăn đại."*
>
> **DISCOVERED:** *"Ơ... hổng có ớt hả anh? ...Thôi kệ."* — nói mà mắt vẫn không rời điện thoại.

Ghi chú: anh Bảo tồn tại để cho người chơi **thấy sự khác biệt**. Với anh, `DISCOVERED` xảy ra ~92% số lần. Sau vài ngày người chơi sẽ tự nói: *"thằng này hiền, làm gì nó cũng hổng thấy"* — và đó chính là lúc họ **đã học xong hệ perception** mà chưa từng đọc một dòng hướng dẫn nào.

---

**Cặp 7 — `UNWANTED: dua_leo` · Bé Su** (thân thiện 1.0 / dễ tha 0.9 — bộ khuếch đại danh tiếng)

> **ANTICIPATED:** *"Ơ chị ơiii em thấy chị bỏ dưa leo rồi nè! Em hổng ăn dưa leo đâu á! ...Thôi được rồi, để em lượm ra, chị làm lại chi cho cực."*
>
> **DISCOVERED:** *"Ủa?? Dưa leo?! Chị ơi em nói em hổng ăn dưa leo mà!"* — rồi cười — *"Thôi hong sao, em gỡ ra nè. Ê mà chị cho em quay cái xe chị chút đi."*

Ghi chú: bé Su **không bao giờ giận thật**, nhưng bé **kể lại hết** — cả hai câu đều seed gossip với `confidence 1.0`. `deTha 0.9` nghĩa là bé quên nhanh; `thanThien 1.0` nghĩa là bé kể cho mọi người. Đây là bịt lỗ ăn gian (b): *"người dễ tha không giận nhưng vẫn vô tư kể lại"*.

---

**Cặp 8 — `MISSING: pate` (lỗi nặng, giai đoạn 2, kích thích sống lâu) · Chú Kiệt** (đối thủ, soi 0.7 / dễ tha 0.3 — *"vừa là đối thủ vừa là người duy nhất hiểu nghề của bạn"*)

> **ANTICIPATED:** *"Tao đứng đây nãy giờ tao coi mày làm. Mày quên pate rồi con. ...Tao hổng có méc ai đâu, mà mày làm vầy hoài là người ta bỏ mày đó. Làm lại đi."*
>
> **DISCOVERED:** *"Ủa? Pate đâu?"* — mở ổ bánh ra coi kỹ — *"Hết pate hả, hay mày quên? Nói thiệt đi. Tao hỏi thiệt chớ hổng có ý gì."*

Ghi chú: chú Kiệt là NPC duy nhất mà `ANTICIPATED` **có giá trị dương về quan hệ** — vì ông chỉ ra lỗi như một người trong nghề. `DISCOVERED` của ông thì nguy hiểm: câu hỏi *"hết pate hả"* là ông đang **dò tình hình kinh tế của bạn**, và nếu bạn đang thiếu hàng thật, đó là thông tin ông dùng được.

---

#### 2.7.5. Ngân sách thoại

| | Số dòng |
|---|---|
| 5 `DefectKind` × 2 `witness` × 12 NPC, nếu viết riêng hết | 120 |
| **Thực tế viết** | **~46** |

Cách cắt (CANON §11, ba đòn bẩy):

1. **Pool generic dùng chung** cho `WRONG_PACKAGING` và `WRONG_RATIO` nhẹ — 2 kind × 2 witness × 4 biến thể = **16 dòng** dùng cho cả 12 NPC, chỉ thay đại từ xưng hô và ngữ khí từ cuối câu (*nghen / nha / hen / đó / à*).
2. **Dòng riêng chỉ viết cho 6 NPC có chức năng thiết kế rõ** trong bảng §2.7.4 (Bà Bảy, Chị Lan, Ông Hải, Thầy Phúc, Anh Bảo, Chú Kiệt) và chỉ cho 3 kind nặng (`MISSING` món chính, `UNWANTED` dị ứng, `WRONG_TEMP`) = 6 × 3 × 2 = **36**, cắt xuống **30** bằng cách gộp Bé Su / Bà Sáu / Chị Hạnh vào pool generic "thân thiện".
3. **Shuffle-bag 8 biến thể ≈ cảm giác 25–30 dòng random** — áp cho pool generic.

**35% số lần `NOTICED` không nói gì cả** (CANON §11) — áp cho cả `ANTICIPATED` lẫn `DISCOVERED`, trừ dị ứng (luôn nói).

---

### 2.8. Phản ứng trễ — `ORDER_DEFECT` salience 20 tại quầy → 100 lúc ăn

CANON §3.1 định nghĩa `ORDER_DEFECT` là *"họ sự kiện, không phải một sự kiện"*, với salience **20 tại quầy → 100 lúc ăn**. Mục này thiết kế nửa sau.

#### 2.8.1. Vì sao phải có phản ứng trễ

`idea.md` §9.2 mục 8: *"Thiếu topping đã gọi | 0.2 lúc đưa → **1.0 khi uống** | Quay lại phàn nàn — *phản ứng trễ*"*.

Ba lý do nó là thứ đáng làm:

1. **Nó làm T1 có răng.** Nếu mọi lỗi đều lộ tại quầy, người chơi chỉ cần canh lúc trao bánh. Phản ứng trễ nghĩa là **bạn không bao giờ thoát hẳn** cho tới khi khách đi khuất.
2. **Nó tạo nhân chứng.** Khách ăn ở góc hẻm, trước mặt 1–2 người khác. Đó là đầu vào tự nhiên nhất cho hệ đồn thổi (`P2-03`) — tin đồn có **nguồn truy vết được** (CANON §12.3) vì người chơi **nhìn thấy ai đứng đó**.
3. **Nó tạo một nhịp nghỉ có sức căng.** Trong lúc người chơi phục vụ khách kế tiếp, có một người đang cắn miếng đầu ở góc màn hình. Không cần âm nhạc, không cần timer.

#### 2.8.2. Thời gian, khoảng cách, chỗ ngồi

```
        XE BÁNH MÌ                  ┌─ EAT_SPOT_A: ghế nhựa, 3,2 m, LUÔN thấy
            ▓▓▓                     │  (2 ghế — CANON §14 "ghế nhựa")
         ┌───────┐                  │
   ══════│  bạn  │══════ hẻm ═══════┼─ EAT_SPOT_B: đứng dựa tường, 5,5 m
         └───────┘                  │  (mép khung hình, còn thấy dáng)
            ▲                       │
       FRONT_CENTER                 └─ EAT_SPOT_C: đi khuất góc hẻm, 8 m+
                                       KHÔNG thấy → giải quyết hôm sau
```

| `packaging` | Chỗ ăn | Xác suất | `t_walk` (s) | `t_unwrap` (s) | `t_firstBite` tổng |
|---|---|---|---|---|---|
| `EAT_IN` | `EAT_SPOT_A` (ghế) | 100% (nếu còn ghế) | **3,0–4,5** | 1,5–2,5 | **4,5–7,0** |
| `TAKEAWAY` | `EAT_SPOT_B` | 55% | 5,0–7,0 | 2,0–3,0 | **7,0–10,0** |
| `TAKEAWAY` | `EAT_SPOT_C` (khuất) | 45% | — | — | **hôm sau** |
| `TAKEAWAY_BAG` | `EAT_SPOT_C` | 85% | — | — | **hôm sau** |

> Chọn chỗ ăn **không phải random**: nó là hàm của `packaging` (khách gói bịch là khách đem đi), `schedule` (chú Tư 6h45 luôn đi thẳng — anh phải đi làm), `thoiTiet` (mưa → không ai ngồi ghế), và `patience` (khách vội đi luôn). Tất định, và người chơi đọc được: **"gói bịch = mình không thấy phản ứng"**.

#### 2.8.3. Quay lại hay không quay lại

```ts
function onFirstBite(npc: Npc, order: Order, ctx: StallCtx) {
  // Chấm lại toàn bộ defect ở THANG ĂN
  const eaten = order.defects.map(d => ({ ...d, salience: d.salienceEat }));
  const worst = eaten.filter(d => d.kind !== 'TASTE_OFF')
                     .sort((a, b) => b.salience - a.salience)[0];

  // Lỗi lộ lúc ăn = lỗi chưa được nói ra tại quầy
  const isNew = worst && !order.spokenDefectIds.includes(worst.stimId);
  if (!worst || !isNew) { onQuietMeal(npc, order, eaten); return; }

  // ── Ghi memory NGAY, bất kể có quay lại hay không ──────────────
  writeMemory(npc, {
    tier: 'SHORT', kind: 'ORDER_DEFECT_EATEN',
    intensity: worst.salience * (npc.personality.deTha < 0.5 ? 1.2 : 0.85),
    traceable: { item: worst.itemId, day: ctx.day },
  });

  // ── Nhân chứng — đầu vào cho gossip ───────────────────────────
  const witnesses = ctx.npcsWithin(npc.eatSpot, WITNESS_RADIUS)   // 4,0 m
                       .concat(ctx.queue.filter(n => hasLOS(n, npc.eatSpot)))
                       .filter(n => n.id !== npc.id)
                       .slice(0, MAX_WITNESSES);                  // 2
  for (const w of witnesses) {
    seedGossip(w, { from: npc.id, kind: 'ORDER_DEFECT',
                    confidence: 1.0, item: worst.itemId, day: ctx.day });
  }

  // ── Có quay lại không? TẤT ĐỊNH, không roll ───────────────────
  const speaksUp = npc.personality.nongTinh > 0.40
                || npc.personality.thanThien > 0.55;
  const closeEnough = npc.eatSpot.dist <= RETURN_MAX_DIST;        // 6,0 m
  const roomToCome  = ctx.queue.length <= RETURN_MAX_QUEUE;       // 2
  const bigEnough   = worst.salience >= RETURN_MIN_SALIENCE;      // 60

  if (speaksUp && closeEnough && roomToCome && bigEnough) {
    scheduleReturn(npc, worst, RETURN_WALK_SEC);                  // 3,0–6,0 s
  } else {
    // KHÔNG quay lại. Đây là nhánh nguy hiểm hơn.
    npc.silentGrudge += worst.salience / 100;
    npc.visitIntervalDays += silentPenaltyDays(npc, worst);        // bảng §2.8.4
  }
}
```

#### 2.8.4. Ai quay lại, ai không

| NPC | `nongTinh` | `thanThien` | Quay lại? | Nếu không quay lại thì gì |
|---|---|---|---|---|
| Ông Hải | 0.9 | 0.6 | **Luôn** | — |
| Bà Bảy | 0.6 | 0.7 | **Luôn** | — |
| Bé Su | 0.4 | 1.0 | **Luôn** (vui vẻ) | — |
| Bà Sáu | 0.3 | 0.9 | **Luôn** (nhẹ nhàng) | — |
| Anh Dũng | 0.5 | 0.5 | Có, **nếu chưa chạy đi** | `visitInterval` +1 ngày |
| Cô Mai | 0.4 | 0.8 | Có | — |
| Chú Kiệt | 0.6 | 0.4 | Có | — |
| Chú Tư | 0.3 | 0.6 | **Không** (phải đi làm) | +1 ngày, và **hôm sau nhắc**: *"Bữa qua ổ bánh chú ăn thiếu đồ chua đó con."* |
| Chị Hạnh | 0.3 | 0.4 | **Không** | +2 ngày |
| Thầy Phúc | 0.2 | 0.5 | **Không** | +1 ngày, **hôm sau dạy** |
| Anh Bảo | 0.2 | 0.4 | **Không** | +2 ngày |
| **Chị Lan** | **0.1** | **0.3** | **Không bao giờ** | **+5 ngày.** Không nói gì, không bao giờ nói gì |

> **Luật bắt buộc — người không quay lại phải để lại một dấu vết nhìn thấy được.** Nếu không, người chơi không có cách nào nối nguyên nhân với hệ quả, và ta rơi đúng vào cảnh báo của Linh (`idea.md` §16 HT3). Dấu vết tối thiểu, **luôn luôn xảy ra dù có quay lại hay không**:
>
> - Khách **dừng lại một nhịp** sau miếng đầu (0,6 s), hạ tay cầm bánh xuống, rồi mới đi tiếp. Một animation, 12 frame.
> - Nếu `EAT_SPOT_A` hoặc `B` (còn trong khung hình): khách **nhìn về phía quầy một lần** trước khi đi.
> - Cuối ngày, sổ tay của cô Ba (`P2-04`) ghi **dữ liệu thô**: *"Chị Lan — ổ thịt, không hành. Chị ăn ở đằng kia rồi về."* **Không** ghi diễn giải, không ghi "chị không hài lòng". Người chơi tự viết diễn giải (`idea.md` §16 HT2).
>
> Với chị Lan, tuỳ chọn trợ năng *"họ để lại lời nhắn"* (CANON §15, công tắc 3) biến cái này thành một dòng rõ ràng hơn ở sổ tay. Mặc định **TẮT**.

#### 2.8.5. Khi khách quay lại

```
t=0        trao bánh
t=4,5–7,0  cắn miếng đầu          ← animation dừng một nhịp, nhìn về quầy
t=+3,0–6,0 đi ngược về quầy       ← dáng đi khác dáng đi thường (nhanh hơn 1,2×)
t=+0,3     bark DISCOVERED        ← độ trễ chống twinning 0,2–0,4 s
```

Khi khách quay lại, họ **chen ngang hàng chờ** — đứng vào `FRONT_CENTER` bất kể ai đang ở đó. Hệ quả dây chuyền: khách đang được phục vụ bị đẩy sang `FRONT_SIDE`, `waitSec` của cả hàng tiếp tục chạy. **Một lỗi công thức trở thành một sự cố vận hành.** Đúng tinh thần XĐ1.2.

**Ba lựa chọn của người chơi khi khách quay lại:**

| Lựa chọn | Thao tác | Chi phí | Hệ quả |
|---|---|---|---|
| **Làm lại** | Ráp ổ mới đúng spec | 1 ổ bánh + nhân + **14–22 giây** | Defect chuyển sang `RESOLVED`. Memory intensity ×0.35. **Không xoá hẳn** |
| **Xin lỗi + bớt tiền** | Nút trả lại tiền | Toàn bộ `price` | Memory ×0.55. Với `thanThien` cao thì tốt hơn làm lại; với `soi` cao thì tệ hơn |
| **Cho thêm để bù** | Đưa đồ chua/trà đá | ~500₫ + 2 s | Memory ×0.75. **Nhưng nếu đã spam `FREE_EXTRA` hôm nay → phản tác dụng** (CANON §8i) |

Không có lựa chọn "cãi". Người chơi không bao giờ chọn câu nói (T2).


---

### 2.9. Luật `take(1)` và `silentScore`

```ts
// CANON §6
visible     = defects.sortBySalience().take(1);   // TỐI ĐA 1 lỗi được NÓI RA
silentScore = sum(all defects);                   // các lỗi còn lại vẫn ảnh hưởng tip ngầm
```

#### 2.9.1. Vì sao nhiều lỗi làm game DỄ HƠN — lập luận của Lucas Pope

*Papers, Please*. Pope phát hiện trong playtest rằng khi một hộ chiếu có **ba** thứ sai, người chơi quyết định **nhanh hơn và chính xác hơn** so với khi nó có **một** thứ sai. Ông chốt: *"each immigrant will have at most one thing wrong"*.

Cơ chế tâm lý đằng sau, và vì sao nó áp thẳng vào game này:

| Với **nhiều** lỗi | Với **một** lỗi |
|---|---|
| Người chơi chỉ cần tìm **bất kỳ** lỗi nào → dừng tìm → quyết định. Bài toán thành **tìm kiếm có thoát sớm** | Người chơi phải kiểm **toàn bộ** để chắc chắn. Bài toán thành **kiểm tra đầy đủ** |
| Xác suất bỏ sót thấp (3 cơ hội để nhận ra) | Xác suất bỏ sót cao (1 cơ hội) |
| Phản hồi mơ hồ: *"tôi làm sai ba thứ"* → không biết sửa cái nào trước | Phản hồi sắc: *"tôi quên hành"* → biết chính xác phải sửa gì |

**Trong game này còn có lý do thứ ba, mạnh hơn cả hai lý do trên: độ rõ của tín hiệu cảm xúc.**

Nếu bà Bảy nói ba câu liền — *"thiếu hành, mà pate ít quá, mà sao bánh nguội vậy con"* — thì bà không còn là một con người đang thất vọng, bà là **một bảng lỗi biết nói**. Một câu duy nhất, nói về đúng một thứ, giữ được bà là người. Và nó khớp trực tiếp với `idea.md` §9.1: *"Nếu mọi lỗi đều bị bắt, game thành 'mô phỏng bị cằn nhằn'."*

#### 2.9.2. Nhưng `take(1)` một mình tạo ra lỗ hổng — và `silentScore` bịt nó

Nếu chỉ có `take(1)`, chiến thuật tối ưu là: **đã sai một thứ rồi thì sai luôn cho đủ.** Chi phí biên của lỗi thứ hai bằng 0. Đó là một dominant strategy, và là lỗ hổng lớn hơn cả (g).

`silentScore` bịt: **mọi defect đều tính, kể cả cái không được nói ra.**

```ts
function computeSilentScore(defects: Defect[], order: Order): number {
  let s = 0;
  const byKind = new Map<DefectKind, number>();

  for (const d of defects) {
    // Dùng thang ĂN nếu khách đã ăn, thang QUẦY nếu chưa
    const base = order.wasEaten ? d.salienceEat : d.salienceCounter;

    // (1) Lỗi ĐÃ ĐƯỢC NÓI RA thì nhẹ hơn — đã trả giá bằng thoại
    const spokenMul = order.spokenDefectIds.includes(d.stimId) ? 0.70 : 1.00;

    // (2) Chống chồng chất theo KIND (như memory, CANON §12)
    const n = (byKind.get(d.kind) ?? 0) + 1;
    byKind.set(d.kind, n);
    const stackMul = Math.pow(0.75, n - 1);

    // (3) ANTICIPATED nhẹ hơn DISCOVERED — §2.7.3
    const witMul = d.witness === 'ANTICIPATED' ? 0.80 : 1.00;

    s += base * spokenMul * stackMul * witMul * d.magnitude;
  }

  // (4) Điểm tích cực TRỪ vào silentScore — game phải thưởng được
  s -= positiveScore(order) * 0.60;

  return Math.max(0, s);
}

function positiveScore(order: Order): number {
  let p = 0;
  for (const obs of order.confirmedPositives) {     // các CONFIRMED tích cực
    p += POSITIVE_SALIENCE[obs.kind] * diminish(obs.kind, order.npc);
  }
  p += tasteScore(order.spec, order.dish, order.npc) * 35;   // khẩu vị ẩn đúng
  return p;
}
```

**Kiểm tra: chi phí biên của lỗi thứ hai có thật sự dương không?**

Ví dụ: đơn "đầy đủ, không hành", người chơi (a) quên đồ chua, (b) quên đồ chua **và** bỏ ít pate.

| | Defect | `salienceEat` | `stackMul` | Đóng góp |
|---|---|---|---|---|
| **(a)** | `MISSING do_chua` (nói ra) | 100 | 1.00 | 100 × 0.70 = **70,0** |
| | | | | **silentScore = 70,0** |
| **(b)** | `MISSING do_chua` (nói ra) | 100 | 1.00 | 100 × 0.70 = 70,0 |
| | `WRONG_RATIO pate` (im) | 60 | **0.75** (khác kind → 1.00) | 60 × 1.00 × 1.00 = 60,0 |
| | | | | **silentScore = 130,0** |

Chi phí biên = **+60**, tức tip gần như về 0 (§2.12). **Dương rõ rệt.** Nhưng người chơi **không nghe thấy** lỗi thứ hai — họ chỉ thấy tip tệ hơn mong đợi, và họ phải tự nghĩ ra tại sao. Đó là đúng thiết kế.

**Nếu hai lỗi cùng kind** (quên đồ chua + quên dưa leo, cả hai `MISSING`): lỗi thứ hai chỉ góp `×0.75`. Chống chồng chất, khớp CANON §12.

#### 2.9.3. Chọn lỗi nào để nói — và ba ngoại lệ

```ts
function pickSpoken(defects: Defect[], npc: Npc, order: Order): Defect | null {
  const speakable = defects.filter(d => d.kind !== 'TASTE_OFF');
  if (speakable.length === 0) return null;

  // NGOẠI LỆ 1: dị ứng LUÔN thắng, bất kể salience
  const allergy = speakable.find(d => d.isAllergy);
  if (allergy) return allergy;

  // NGOẠI LỆ 2: ANTICIPATED thắng DISCOVERED khi salience chênh < 15
  //   Lý do: câu "tôi thấy con làm rồi" hay hơn nhiều câu "ủa thiếu cái này"
  const sorted = speakable.sort((a, b) => scoreOf(b, order) - scoreOf(a, order));
  const top = sorted[0];
  const ant = sorted.find(d => d.witness === 'ANTICIPATED');
  if (ant && scoreOf(top, order) - scoreOf(ant, order) < 15) return ant;

  // NGOẠI LỆ 3: 35% số lần KHÔNG nói gì cả — chỉ đổi nét mặt (CANON §11)
  //   Shuffle-bag theo NPC, KHÔNG phải rng. Bag 20 vé: 7 im / 13 nói.
  if (npc.silenceBag.draw() === 'SILENT' && !allergy) return null;

  return top;
}

function scoreOf(d: Defect, order: Order): number {
  return (order.wasEaten ? d.salienceEat : d.salienceCounter) * d.magnitude;
}
```

> **Ngoại lệ 2 là chỗ kiếm được nhiều giá trị nhất trên mỗi dòng thoại viết ra.** Nó cố tình thiên vị về phía loại thoại hay hơn. Vì `ANTICIPATED` là thứ chứng minh cho người chơi rằng **NPC đang thật sự nhìn** — và đó là toàn bộ luận điểm bán hàng của game (*"a game about being watched while you work"*). Nếu để salience thuần quyết định, `ANTICIPATED` sẽ hiếm hơn đáng có.

---

### 2.10. Dị ứng — phản ứng NẶNG, và ràng buộc để không thành tàn nhẫn

`idea.md` §9.2 mục 10: *"Bỏ thứ khách dặn không bỏ (hành, ngò, ớt) | 0.3 → 1.0 khi ăn | **Người dị ứng = phản ứng nặng**"*.

#### 2.10.1. Ba khác biệt cơ học so với `UNWANTED` thường

| | `UNWANTED` thường | `UNWANTED` + dị ứng |
|---|---|---|
| `salience` tại quầy | `24 × w` (VD: hành 16,8) | **`24 × w × 3.0`** (hành 50,4) |
| `t_confirm` @FRONT_CENTER | 7,00 s | **2,38 s** — bị bắt gần như chắc |
| `take(1)` | Cạnh tranh theo salience | **Luôn thắng.** Không bao giờ bị nuốt |
| Luật im lặng 35% | Áp dụng | **Không áp dụng.** Luôn nói ra |
| Nếu đã ăn phải | Memory `SHORT`, intensity theo salience | Memory **`LONG`** ngay, intensity **85**, `kind: ALLERGY_HIT` |
| Gossip | mutation 0.35 | **mutation 0.55**, và mutate thành *"bán đồ làm người ta dị ứng"* |
| `trustCeiling` | Không đổi | **−0.15 vĩnh viễn** (CANON §8d) |

#### 2.10.2. Bốn ràng buộc thiết kế để không thành tàn nhẫn

Đây là mục quan trọng hơn phần cơ chế. Một cơ chế dị ứng làm sai sẽ biến một game cozy thành một game về sợ hãi, và nó động tới **§14.1 lằn ranh đỏ "hạ thấp nghề"** — nghề bán bánh mì phải giữ được phẩm giá, không phải một bãi mìn.

**Ràng buộc 1 — Luôn có cửa sổ sửa sai TRƯỚC khi trao bánh.**

`t_confirm = 2,38 s` ở `FRONT_CENTER` nghĩa là khách nhận ra **trong lúc bạn còn đang ráp**, không phải lúc trao. Và khi `ANTICIPATED` với dị ứng, bark phát **ngay lập tức** ở trạng thái `NOTICED` (không chờ `CONFIRMED`), kèm một chỉ dẫn hành động rõ ràng: *"con lấy ra giùm cô nghen"*.

Cài đặt cứng: nếu `defect.isAllergy` và `obs.state >= NOTICED` và bánh **chưa gói** → bark tier-1 phát ngay, và **nếu người chơi gỡ món đó ra trong 6 giây**, defect bị xoá hoàn toàn, sinh `CARED_FOR_THEM` (salience 50) thay thế. **Sửa kịp thì thành điểm cộng.**

**Ràng buộc 2 — Không bao giờ có hậu quả y tế trên màn hình.**

Không ai ngất, không xe cứu thương, không mặt sưng, không cảnh bệnh viện. Hậu quả nặng nhất được phép hiện ra là: khách **không ăn**, gói lại, và nói một câu buồn. Lý do: hậu quả y tế đẩy tông game ra khỏi cozy vĩnh viễn, và nó không thêm được thông tin gì cho người chơi.

**Ràng buộc 3 — Dị ứng phải được báo trước, rõ, và LẶP LẠI.**

- Lần đầu NPC có dị ứng ghé, `utterance` **bắt buộc** nói rõ lý do (*"cô dị ứng"*, *"nổi mề đay"*, *"bác sĩ dặn"*) — không bao giờ chỉ *"không ngò"*.
- Từ lần thứ hai trở đi, NPC **vẫn nhắc**, nhưng ngắn hơn: *"nhớ nghen con, đừng ngò."* — và lần thứ tư trở đi thì chỉ còn *"như mọi bữa nha"* + `usual` đã chứa `allergy`. **Sự tin tưởng tăng dần là phần thưởng, và cũng là rủi ro.** Đây là một trong những chỗ cảm động nhất của game: khi bà Bảy thôi nhắc, nghĩa là bà tin bạn.
- **Số NPC có dị ứng trong cả mùa: tối đa 3 trong 12.** Đề xuất: Bà Bảy (ngò), Chị Hạnh (ớt — *"chị người Bắc, chị ăn cay không được"*, nối vào arc hoà nhập của chị), và **một** khách vãng lai xuất hiện 2–3 lần. Nhiều hơn 3 thì nó thành cơ chế, không còn là con người.

**Ràng buộc 4 — Tha thứ phải có thật, và phải tới sớm.**

Sau một `ALLERGY_HIT`:
- NPC **vẫn quay lại**, chỉ là muộn hơn (+3 ngày với `deTha ≥ 0.6`, +6 ngày với `deTha < 0.6`). **Không có NPC nào biến mất vĩnh viễn vì một lần dị ứng.** (Biến mất vĩnh viễn chỉ dành cho khách vãng lai vô danh — `idea.md` §9.3.)
- Lần ghé đầu tiên sau đó, họ nói một câu mở đường: **Bà Bảy:** *"Cô hổng có giận con đâu nghen. Mà bữa nay con nhớ giùm cô nha."* — và nếu người chơi làm đúng lần đó, memory `ALLERGY_HIT` bị hạ từ `LONG` xuống `SHORT` và intensity ×0.5.
- `trustCeiling` **không** hồi (đúng CANON §8d) — nhưng −0.15 trên thang 1.0 vẫn để `Friend` đạt được. **Trần hạ, không phải cửa đóng.**

> **Kiểm tra tông giọng bắt buộc:** đọc to mọi dòng thoại dị ứng. Nếu có dòng nào nghe như **buộc tội**, viết lại. Người Việt trong hoàn cảnh này gần như luôn mở đầu bằng cách **giảm nhẹ cho người kia**: *"thôi con làm nhiều quá quên chớ gì"*, *"cô hổng có giận đâu"*. Đó không phải là làm game dễ — đó là viết người Việt cho đúng.

---

### 2.11. `REMEMBERED_USUAL` — salience 90, khoảnh khắc chữa lành lõi

CANON §3.2: *"Làm đúng 'như mọi bữa' mà khách không phải nói | **90** | Khoảnh khắc chữa lành lõi của game"*.

#### 2.11.1. Xây `npc.usual` — và không bao giờ hiện nó ra

```ts
type Usual = {
  spec: OrderSpec;        // spec đã hợp nhất
  strength: number;       // 0..1 — độ ổn định của thói quen
  builtFrom: number[];    // các ngày đóng góp — để debug, KHÔNG hiện ra
};

function rebuildUsual(npc: Npc): Usual | null {
  const hist = npc.orderHistory.slice(-10);          // 10 đơn gần nhất
  if (hist.length < 3) return null;

  // Trọng số theo độ mới — usual TRÔI theo mùa (anh Dũng đổi ca đêm, chú Tư dời chỗ)
  const w = hist.map((_, i) => Math.pow(RECENCY_DECAY, hist.length - 1 - i));  // 0.85

  // Bỏ phiếu có trọng số trên từng khoá
  const spec = weightedModeSpec(hist, w);

  // strength = mức đồng thuận
  const sim = hist.map(h => specSimilarity(h.spec, spec));
  const strength = weightedMean(sim, w);

  return strength >= USUAL_MIN_STRENGTH ? { spec, strength, builtFrom: hist.map(h => h.day) } : null;
}

function specSimilarity(a: OrderSpec, b: OrderSpec): number {
  const jReq = jaccard(a.required, b.required);              // trọng số 0.40
  const jFor = jaccard(a.forbidden, b.forbidden);            // trọng số 0.25
  const rat  = 1 - meanAbsDiff(a.ratios, b.ratios) / 1.5;    // trọng số 0.20
  const pack = a.packaging === b.packaging ? 1 : 0;          // trọng số 0.10
  const temp = a.temp === b.temp ? 1 : 0;                    // trọng số 0.05
  return 0.40*jReq + 0.25*jFor + 0.20*rat + 0.10*pack + 0.05*temp;
}
```

`USUAL_MIN_STRENGTH = 0.80`. Với `RECENCY_DECAY = 0.85`, một NPC đổi món sẽ có `usual` mới sau **4–5 lần ghé** — đủ nhanh để theo kịp arc nhân vật, đủ chậm để một lần đổi ý không phá thói quen.

> **T3 — `usual` KHÔNG BAO GIỜ hiện ra dưới bất kỳ hình thức nào.** Không ô "đơn quen", không gợi ý, không nút "làm như mọi khi", không icon bên cạnh tên, không autofill. Người chơi phải **tự nhớ**, hoặc **tự ghi sổ**.

#### 2.11.2. Cái sổ tay được phép chứa gì

Đây là ranh giới tinh tế nhất của cả doc, và nó đến từ `idea.md` §16 HT2 — Minh: *"game **tự log dữ liệu thô** (đừng bắt chép tay thứ máy đã biết — đó là busywork), **người chơi chỉ viết diễn giải**."*

| Sổ tay ĐƯỢC chứa | Sổ tay KHÔNG ĐƯỢC chứa |
|---|---|
| **Nguyên văn câu khách nói**, theo ngày, theo thứ tự thời gian | Bất kỳ bản tóm tắt / gộp nào |
| Ngày, giờ, tên khách | Dòng "đơn quen: ổ thịt, ít rau" |
| Ghi chú **người chơi tự gõ**, tự do | Gợi ý / highlight / tô màu món hay gọi |
| Danh sách khách "lâu rồi không thấy ghé" (HT2 — Ngọc Ánh) | Số lần ghé đã gộp thành tỉ lệ |
| Lịch sinh hoạt **người chơi tự ghi** | Lịch sinh hoạt hệ thống tự suy |

Nghĩa là: **thông tin có sẵn hết**, nhưng nó nằm rải trên 10 trang theo ngày. Tìm ra quy luật là việc của người chơi. Đó chính là *"suy ra lịch từ quan sát"* (CANON §13.2) áp dụng cho đơn hàng.

#### 2.11.3. Hai bậc, và chỉ bậc hai mới là 90

| Bậc | Điều kiện | `salience` | Cảm giác |
|---|---|---|---|
| **T-A** | Khách **nói** *"như mọi bữa"*, người chơi làm đúng | **70** | *"Ừ, bạn nghe lời."* |
| **T-B** | Người chơi **bắt đầu làm trước khi khách kịp gọi**, và làm đúng | **90** | *"Trời... bạn nhớ tôi."* |

```ts
// Cửa sổ T-B: từ lúc khách bước vào FRONT_CENTER tới lúc ORDER_SPOKEN
const PREEMPT_WINDOW = 3.5;   // giây — đủ ngắn để phải THẬT SỰ nhớ

function onIngredientPlaced(npc: Npc, item: ItemId, ctx: StallCtx) {
  if (npc.orderSpoken) return;
  if (ctx.now - npc.arrivedAt > PREEMPT_WINDOW) return;
  npc.preemptAttempt ??= { startedAt: ctx.now, items: [] };
  npc.preemptAttempt.items.push(item);

  // Khách NGỪNG gọi món khi thấy bạn đã bắt đầu làm
  npc.orderSpoken = true;
  npc.orderSuppressed = true;
  playAnim(npc, 'mouth_opens_then_closes');     // 14 frame — họ định nói rồi thôi
}
```

**Chi tiết diễn xuất bắt buộc:** khi người chơi bắt đầu làm trước, NPC **há miệng định nói rồi ngậm lại**. Đó là một animation 14 frame và nó là **toàn bộ phần thưởng cảm xúc** của cơ chế này. Không có text pop-up, không có `+90`.

#### 2.11.4. Đoán sai thì sao — luật quan trọng nhất của mục này

> **Đoán sai `usual` KHÔNG BAO GIỜ bị phạt về quan hệ.** Chỉ mất nguyên liệu và thời gian.

Nếu không có luật này, không người chơi nào dám thử bậc T-B, và khoảnh khắc chữa lành lõi của game sẽ không bao giờ xảy ra. Cài đặt:

```ts
function onOrderSpokenAfterPreempt(npc: Npc, spec: OrderSpec, ctx: StallCtx) {
  const guess = specFromPartial(npc.preemptAttempt.items);
  const sim = specSimilarity(guess, resolveRefs(spec, npc));

  if (sim >= PREEMPT_HIT) {                    // 0.85
    fireEvent('REMEMBERED_USUAL', { npc, tier: 'T-B', salience: 90 });
  } else {
    // KHÔNG defect. KHÔNG memory tiêu cực. KHÔNG ảnh hưởng tip.
    // Chỉ mất nguyên liệu đã bỏ vào + thời gian làm lại.
    discardPartialDish(ctx);                   // XĐ1.2: rủi ro = vận hành, không phải đạo đức
    fireBark(npc, 'PREEMPT_MISS');
  }
}
```

Thoại `PREEMPT_MISS` — phải **ấm**, không bao giờ chê:

> **Bà Bảy:** *"Ủa... cô bữa nay đổi ý con ơi, cô ăn xíu mại. Mà con nhớ cô ghê hen."* — câu sau quan trọng hơn câu trước.
> **Chú Tư:** *"Ờ... bữa nay chú đổi. Mà thôi con cứ làm cái đó đi, chú ăn cũng được."* — chú `deTha 0.9`, chú nhận luôn. **Đoán sai với chú Tư thì không mất gì cả.**
> **Chị Lan:** *"...Hôm nay chị đổi."* — nhưng `visitInterval` **không** đổi, và có một nhịp im lặng nửa giây trước câu đó. Với chị, được nhớ vẫn là được nhớ.
> **Thầy Phúc:** *"Thầy đổi rồi con. Mà con để ý thầy dữ hen — vậy là con làm nghề được đó."* ← dòng này là **tutorial ẩn** cho cả cơ chế.

#### 2.11.5. Vì sao đây là "khoảnh khắc chữa lành lõi"

Ba thứ hội tụ vào đúng một hành động:

1. Nó là sự kiện **salience cao nhất trong nhóm tích cực** (90 / 100 tối đa của game) — cao hơn cả `REMEMBERED_STORY` (70).
2. Nó là thứ duy nhất **người chơi phải dùng trí nhớ thật của chính mình**, không phải kỹ năng tay hay tối ưu hoá. Không datamine được (CANON §8f), không spreadsheet được — bạn có nhớ bà Bảy ăn gì hay không, thế thôi.
3. Nó **đảo ngược toàn bộ luận điểm của game**. Cả game là *"bạn bị nhìn"*. Khoảnh khắc này là *"bạn đã nhìn họ"*. Đó là câu trả lời, và nó là lý do người ta sẽ nhớ game này.

---

### 2.12. Tip — công thức, và tại sao không hiện breakdown

#### 2.12.1. Hình thức diegetic: tip ở Sài Gòn là "khỏi thối"

Không có nút tip, không có thanh trượt, không có ngôi sao. Tip xuất hiện đúng một cách: khách **đẩy tiền lại** và nói một câu.

| Mức | Biểu hiện | Thoại ví dụ |
|---|---|---|
| Không tip | Nhận đúng tiền thối, bỏ túi | — |
| Nhỏ (1.000–2.000₫) | Xua tay với phần tiền lẻ | *"Khỏi thối con."* · *"Thôi con giữ đi."* |
| Vừa (3.000–5.000₫) | Đưa dư, không chờ thối | *"Nè, khỏi thối nghen."* |
| Lớn (≥ 5.000₫, hiếm) | Đưa tiền chẵn hơn hẳn, nhìn mặt bạn | *"Cầm đi con. Bánh bữa nay ngon."* |
| **Âm** (không tồn tại) | — | **Không có cơ chế trừ tiền.** Tệ nhất là không tip |

#### 2.12.2. Công thức

```ts
function computeTip(order: Order, npc: Npc, silentScore: number): number {
  // (1) Tỉ lệ nền theo bucket quan hệ — 3 bucket, bất đối xứng (CANON §4)
  const R = { Rival: 0.00, Acquaintance: 0.045, Friend: 0.11 }[npc.tier];
  if (R === 0) return 0;

  // (2) Chất lượng — hàm mũ, KHÔNG tuyến tính.
  //     Mũ 1.6 làm "gần hoàn hảo" khác hẳn "hoàn hảo". Đó là chỗ có sức kéo.
  const q = Math.pow(clamp01(1 - silentScore / SILENT_DIVISOR), 1.6);   // divisor 120

  // (3) Điểm tích cực — thưởng, có trần
  const p = clamp01(positiveScore(order) / 100);

  // (4) Tính cách
  const generosity = 0.60 + 0.80 * npc.personality.thanThien;   // 0.60 .. 1.40
  const strictness = 1.00 - 0.50 * npc.personality.soi * (1 - q); // người soi phạt nặng khi có lỗi

  // (5) Bối cảnh ngoài tầm kiểm soát (idea.md §9.2 mục 20, 22)
  const ctxMul = npc.moodTipMul                                  // 0.7 .. 1.3
               * (isEndOfMonth(order.day) ? 0.75 : 1.00)         // cuối tháng hết tiền
               * (order.ctx.raining ? 1.10 : 1.00);              // mưa, khách thương

  let t = order.price * R * q * (1 + 0.45 * p) * generosity * strictness * ctxMul;

  // (6) Thói quen làm tròn — người Việt boa bằng cách khỏi thối
  if (npc.roundUpHabit && t > 0) {
    t = Math.max(t, roundUpTo(order.price, 5000) - order.price);
  }

  // (7) Lượng tử hoá về tiền lẻ thật: 1.000₫
  return Math.round(t / 1000) * 1000;
}
```

#### 2.12.3. Bảng kiểm — đơn 20.000₫

| Tình huống | NPC | `silentScore` | `q` | `p` | tip |
|---|---|---|---|---|---|
| Hoàn hảo + nhớ đơn quen (T-B) | Bà Bảy, Friend | 0 (−54 từ positive → 0) | 1.000 | 0.90 | **4.000₫** |
| Hoàn hảo, không gì đặc biệt | Bà Bảy, Friend | 0 | 1.000 | 0.12 | **2.000₫** |
| Hoàn hảo | Chú Tư, Acquaintance | 0 | 1.000 | 0.10 | **1.000₫** |
| Thiếu đồ chua (đã nói ra, ANTICIPATED) | Bà Bảy, Friend | 39,2 | 0.532 | 0.10 | **1.000₫** |
| Thiếu đồ chua (DISCOVERED lúc ăn) | Bà Bảy, Friend | 70,0 | 0.256 | 0.10 | **0₫** |
| Thiếu đồ chua + bớt pate | Bà Bảy, Friend | 130,0 | 0.000 | 0.10 | **0₫** |
| Hoàn hảo | Chị Lan, Acquaintance | 0 | 1.000 | 0.08 | **1.000₫** |
| Thiếu đồ chua (im lặng) | Chị Lan, Acquaintance | 70,0 | 0.256 | 0.08 | **0₫** |

**Ba điều bảng này nói ra:**

1. **Tip nhỏ về tuyệt đối.** 1.000–4.000₫ trên đơn 20.000₫. Tip **không phải** nguồn thu chính — nó là **tín hiệu**. Nguồn thu là bán được nhiều ổ, và ràng buộc kinh tế nằm ở `P3`.
2. **Chênh lệch giữa "hoàn hảo" và "một lỗi nhỏ" là 50–100% tip.** Sắc, đọc được, đáng để cố.
3. **Bậc T-B của `REMEMBERED_USUAL` nhân đôi tip.** Đó là cách hệ thống nói *"cái này quan trọng"* mà không cần chữ nào.

#### 2.12.4. Vì sao KHÔNG hiện breakdown — bốn lý do

1. **T3.** *"Không `+3 trust`, không thanh tình cảm."* Một bảng `Chất lượng +2.000 / Quan hệ +1.000 / Nhớ đơn quen +1.000` là chỉ số quan hệ trá hình.
2. **Nó phá chính cơ chế `take(1)`.** Nếu hiện breakdown, người chơi đọc được cả những lỗi không được nói ra — và `silentScore` mất hết ý nghĩa "ngầm". Cái hay của §2.9 là người chơi **cảm thấy** tip tệ mà không biết chắc tại sao, rồi tự đi tìm.
3. **Nó biến quan hệ thành bảng tính.** Minh sẽ dựng spreadsheet dù sao (CANON §8f — không bịt nổi), nhưng ta không cần **phát** cho anh ấy. Và với 90% người chơi còn lại, breakdown biến một câu *"cầm đi con, bánh bữa nay ngon"* thành một dòng số.
4. **Nó làm hỏng nhịp.** Tip xảy ra đúng lúc khách quay đi. Đó là khoảnh khắc nên dành cho một câu thoại và một nét mặt, không phải một bảng.

**Cái ĐƯỢC hiện:** sổ cuối ngày của cô Ba ghi **tổng tiền tip hôm nay** như một dòng duy nhất trong sổ (*"Tiền khách cho thêm: 23.000"*), không tách theo khách, không tách theo lý do. Đó là dữ liệu thô, đúng luật §2.11.2.


---

## 3. Dữ liệu & schema

### 3.1. `Order` — object vòng đời một đơn

```ts
type Order = {
  id: string;
  spec: OrderSpec;
  npcId: NpcId;
  day: number;

  // trạng thái
  phase: 'SPOKEN' | 'ASSEMBLING' | 'HANDED' | 'EATING' | 'CLOSED';
  stage: Stage;                     // giai đoạn ráp hiện tại
  dish: Dish;
  price: number;

  // kết quả diff
  defects: Defect[];
  spokenDefectIds: string[];        // các stimId ĐÃ được nói ra (take(1) qua 2 lần: quầy + ăn)
  silentScoreCounter: number;
  silentScoreEaten: number;
  confirmedPositives: Observation[];

  // phản ứng trễ
  eatSpot?: { id: 'A'|'B'|'C'; dist: number };
  handedAt?: number;
  firstBiteAt?: number;
  returned: boolean;
  wasEaten: boolean;

  tip: number;
};
```

### 3.2. Ví dụ JSON content thật

`content/orders/ba-bay.json` — ba dạng: thường, vòng vo (`buried`), tham chiếu.

```json
{
  "npcId": "ba_bay",
  "orders": [
    {
      "id": "ba_bay.plain_01",
      "style": "plain",
      "minVisit": 1,
      "utterance": "Cho cô ổ thịt, ít rau thôi con. Nhiều ớt nghen.",
      "utteranceEn": "Cho cô one with cold cuts, go easy on the veg. Lots of chili, nghen.",
      "vo": "vo/ba_bay/plain_01.ogg",
      "spec": {
        "required": ["banh_mi", "thit_nguoi", "do_chua", "dua_leo", "sot"],
        "forbidden": [],
        "optional": ["ngo_ri", "xi_dau"],
        "allergy": [],
        "ratios": { "rau": 0.5, "ot": 2.0 },
        "tolerance": { "rau": 0.25, "ot": 0.4 },
        "temp": "WARM", "mustReheat": false,
        "packaging": "TAKEAWAY", "wrapCare": false,
        "size": "REGULAR", "qty": 1,
        "leniency": 1.0, "hiddenTasteWeight": 1.0,
        "price": 20000
      }
    },
    {
      "id": "ba_bay.buried_allergy_01",
      "style": "buried",
      "minVisit": 1,
      "firstTimeOnly": true,
      "utterance": "Trời ơi bữa nay nắng dữ con ơi, cô đi từ hồi năm giờ tới giờ... ủa mà cô nói trước nghe, cô hổng có ăn ngò được đâu nha, dị ứng đó, rồi cho cô ổ thịt thường thôi, chiều cô còn đi bán nữa.",
      "utteranceEn": "Trời ơi it's brutal out today con... oh, let me say this first — cô can't have cilantro, cô's allergic. Then just a regular one with cold cuts. Cô's still got the afternoon round.",
      "vo": "vo/ba_bay/buried_allergy_01.ogg",
      "buriedAt": 0.62,
      "memoryHooks": ["di_ban_tu_5h", "nang_gat"],
      "spec": {
        "required": ["banh_mi", "thit_nguoi", "do_chua", "dua_leo", "sot"],
        "forbidden": ["ngo_ri", "pate", "cha_lua"],
        "optional": ["hanh_la", "xi_dau"],
        "allergy": ["ngo_ri"],
        "ratios": {},
        "temp": "WARM", "mustReheat": false,
        "packaging": "TAKEAWAY", "wrapCare": false,
        "size": "REGULAR", "qty": 1,
        "leniency": 1.0, "hiddenTasteWeight": 1.0,
        "price": 20000
      }
    },
    {
      "id": "ba_bay.usual_01",
      "style": "plain",
      "minVisit": 4,
      "requiresUsualStrength": 0.80,
      "utterance": "Như mọi bữa nghen con.",
      "utteranceEn": "Như mọi bữa, con.",
      "vo": "vo/ba_bay/usual_01.ogg",
      "spec": { "usualRef": true, "leniency": 1.0, "hiddenTasteWeight": 1.0 }
    }
  ]
}
```

`content/rules/order-defect.json` — rule DB (Elan Ruskin, CANON §11):

```json
[
  {
    "id": "defect.missing.anticipated.ba_bay",
    "concept": "DELIVER_DEFECT",
    "criteria": [
      ["npcId", "==", "ba_bay"],
      ["defect.kind", "==", "MISSING"],
      ["defect.witness", "==", "ANTICIPATED"],
      ["defect.itemId", "in", ["hanh_la", "ngo_ri", "ot"]]
    ],
    "score": 4,
    "responses": [
      { "line": "Cô thấy rồi nha con. Nãy con bốc qua luôn cái {item}, cô ngó thấy mà cô hổng nói. Thôi khỏi, đưa đây cô ăn.", "anim": "look_at_player_then_bag" },
      { "line": "Cô có thấy á con. Mà thôi, cô ăn vầy cũng được.", "anim": "look_at_player_then_bag" }
    ],
    "applycontext": [["ba_bay.forgave_today", 1, 86400]],
    "norepeat": true
  },
  {
    "id": "defect.missing.discovered.ba_bay",
    "concept": "DELIVER_DEFECT",
    "criteria": [
      ["npcId", "==", "ba_bay"],
      ["defect.kind", "==", "MISSING"],
      ["defect.witness", "==", "DISCOVERED"]
    ],
    "score": 3,
    "responses": [
      { "line": "Ủa... {item} đâu con? Ủa mà thôi, kệ. Con làm nhiều quá quên chớ gì.", "anim": "look_into_bag" }
    ],
    "norepeat": true
  },
  {
    "id": "defect.allergy.any",
    "concept": "DELIVER_DEFECT",
    "criteria": [["defect.isAllergy", "==", true]],
    "score": 1,
    "priority": "OVERRIDE",
    "followup": ["SELF", "ALLERGY_FOLLOWUP", 2.5]
  }
]
```

### 3.3. Lưu save

```ts
type OrderSave = {
  // Lịch sử đơn — DỮ LIỆU THÔ, dùng cho usual VÀ cho sổ tay
  orderHistory: Array<{
    day: number; specId: string; utterance: string;
    resolvedSpecHash: string;      // để rebuildUsual không cần lưu cả spec
    hadDefect: boolean; tip: number;
  }>;                              // giữ 40 đơn gần nhất / NPC

  usual: { specHash: string; strength: number } | null;   // tính lại lúc load
  visitIntervalDays: number;
  silentGrudge: number;
  allergyHitCount: number;
};
```

**Không lưu:** `Defect[]`, `Observation`, `silentScore`. Tất cả đều là kết quả trung gian trong một lượt khách, và autosave chạy **sau mỗi khách** (CANON §2) nên chúng đã được thu hoạch thành `Memory` + `orderHistory` trước khi save chạy. Xem `P1-02` §3.2.

---

## 4. UI/UX hai thiết bị

| Yếu tố | PC | Mobile (v2) | Ràng buộc |
|---|---|---|---|
| Câu gọi món | Hộp thoại **nền đục**, tự giãn khi chữ ≥200%, **không tự chạy tiếp** | Giống, hộp chiếm tối đa 35% chiều cao | CANON §15.1 |
| Ghim câu nguyên văn | Dải chữ nhỏ góc trên-trái suốt lượt khách | Thu gọn thành icon `"`, chạm để mở | **Chỉ nguyên văn, không diễn giải** |
| Nghe lại | Nút loa cạnh dải ghim, phím `R` | Chạm icon `"` hai lần | Tốn 1,5 s thời gian game |
| Chọn nguyên liệu | Kéo–thả **hoặc** chạm-để-đặt | Chạm-để-đặt | CANON §15.5 — ba cái đi chung |
| Hoàn tác | `Ctrl+Z` / nút mũi tên | Nút mũi tên | Bắt buộc |
| Xác nhận trước khi đưa | Một bước: kéo bánh ra mép quầy → **ngừng 0,4 s** → thả | Chạm bánh → chạm khách | Bắt buộc |
| Giai đoạn ráp | Thanh 6 chấm dưới thớt (`RACH → PATE → NHAN → RAU → SOT → GOI`) | Giống, chấm to hơn | Chấm **khác nhau về hình dáng**, không chỉ màu |
| Icon nguyên liệu | Dưa leo / ngò / hành lá đều xanh → **khác nhau về HÌNH DÁNG** | Giống + tuỳ chọn hiện chữ dưới icon | CANON §15 |
| Tip | Animation tay đẩy tiền + một câu thoại | Giống | **Không số nổi, không breakdown** |
| Sổ tay | Trang theo ngày, gõ tự do | Giống | §2.11.2 |

**Ba thứ tuyệt đối không có trên màn hình:**

1. **Checklist đơn hàng có tick.** Đó là parser hộ người chơi (§2.1) và nó giết T2.
2. **Thanh "độ chính xác" / phần trăm khớp.** T3.
3. **Bất kỳ chỉ báo nào cho `usual`.** §2.11.1.

**Trợ năng bổ sung của doc này:**

- **"Hiện lại câu khách nói dưới dạng chữ, luôn luôn"** — mặc định **BẬT**. Đây là hỗ trợ nghe, không phải hỗ trợ chơi.
- **"Chế độ một khách một lượt"** (CANON §15, công tắc 2) làm `t_firstBite` chạy **sau khi** khách hiện tại rời đi, để phản ứng trễ không chồng lên nhau.
- **"Khách để lại lời nhắn"** (công tắc 3) — với NPC không quay lại (§2.8.4), thêm một dòng vào sổ tay cuối ngày: *"Chị Lan có vẻ không vui."* Mặc định **TẮT**, vì nó là diễn giải chứ không phải dữ liệu thô.

---

## 5. Tham số cần tune

| Tên | Giá trị khởi điểm | Khoảng | Cách đo |
|---|---|---|---|
| `BASE.MISSING` | **20** | **KHÓA** | CANON §3.1 — "20 tại quầy" |
| `BASE.UNWANTED` | 24 | 18 – 30 | Phải ≥ `MISSING` (bỏ thứ bị cấm tệ hơn thiếu thứ đã gọi) |
| `BASE.WRONG_RATIO` | 12 | 8 – 18 | Phải đủ thấp để hiếm khi bị bắt tại quầy (§2.6.4 điểm 3) |
| `BASE.WRONG_TEMP` | 18 | 12 – 24 | — |
| `BASE.WRONG_PACKAGING` | 10 | 6 – 15 | — |
| `EAT_MULTIPLIER` | **5.0** | **KHÓA** | CANON §3.1 — "→ 100 lúc ăn". `20 × 5 = 100` |
| `ALLERGY_MUL` | **3.0** | 2.5 – 4.0 | Kiểm: `t_confirm` dị ứng @FRONT_CENTER phải < 3 s |
| `REVISION_MUL` | 0.6 | 0.5 – 0.8 | Khách đổi ý thì bớt gắt |
| `DEFAULT_TOLERANCE` | 0.25 | 0.15 – 0.35 | Kiểm: "ít rau" bỏ 0.3 hoặc 0.7 đều không sao |
| `ITEM_WEIGHT.banh_mi` | 2.0 | — | Quên cả ổ bánh |
| `ITEM_WEIGHT` nhân chính | 1.2 – 1.4 | — | pate/heo quay/thịt cao nhất |
| `ITEM_WEIGHT` rau gia vị | 0.6 – 1.0 | — | — |
| `SILENT_DIVISOR` | **120** | 90 – 160 | Kiểm: một lỗi `MISSING` đã nói ra phải cho `q ≈ 0.5` |
| Mũ chất lượng | **1.6** | 1.2 – 2.2 | Cao hơn → "gần hoàn hảo" bị phạt nặng hơn |
| `spokenMul` | 0.70 | 0.6 – 0.85 | Lỗi đã bị nói ra thì nhẹ hơn |
| `stackMul` cơ số | **0.75** | — | Khớp CANON §12 (chống chồng chất memory) |
| `witMul` ANTICIPATED | **0.80** | 0.70 – 0.90 | §2.7.3 — thành thật rẻ hơn may rủi |
| `positiveScore` trừ vào silent | ×0.60 | 0.4 – 0.8 | Kiểm: hoàn hảo + nhớ đơn quen phải ra `silentScore = 0` |
| `R.Acquaintance` | 0.045 | 0.03 – 0.06 | — |
| `R.Friend` | 0.11 | 0.08 – 0.15 | Kiểm: tip Friend hoàn hảo ≈ 2.000₫ / đơn 20.000₫ |
| `generosity` span | 0.60 + 0.80·thanThien | — | — |
| `strictness` span | 1 − 0.50·soi·(1−q) | 0.3 – 0.7 | — |
| `WITNESS_RADIUS` | **4,0 m** | 3 – 6 | §2.8.3 |
| `MAX_WITNESSES` | **2** | 1 – 3 | Cap gossip seed |
| `RETURN_MAX_DIST` | **6,0 m** | 5 – 8 | Xa hơn thì không quay lại |
| `RETURN_MAX_QUEUE` | **2** | 1 – 3 | Hàng dài thì họ ngại chen |
| `RETURN_MIN_SALIENCE` | **60** | 45 – 75 | Dưới ngưỡng thì im lặng đi luôn |
| `RETURN_WALK_SEC` | 3,0 – 6,0 | — | — |
| `t_walk` EAT_SPOT_A | 3,0 – 4,5 s | — | — |
| `t_unwrap` | 1,5 – 3,0 s | — | — |
| `USUAL_MIN_STRENGTH` | **0.80** | 0.70 – 0.88 | Quá thấp → "như mọi bữa" xuất hiện sớm và sai |
| `RECENCY_DECAY` | **0.85** | 0.75 – 0.92 | Kiểm: NPC đổi món có `usual` mới sau 4–5 lần ghé |
| `PREEMPT_WINDOW` | **3,5 s** | 2,5 – 5,0 | Đủ ngắn để phải thật sự nhớ |
| `PREEMPT_HIT` | **0.85** | 0.78 – 0.90 | Ngưỡng similarity để tính T-B |
| `REMEMBERED_USUAL` T-A | **70** | — | §2.11.3 |
| `REMEMBERED_USUAL` T-B | **90** | **KHÓA** | CANON §3.2 |
| Luật im lặng 35% | **7/20 vé** | 5 – 9 | CANON §11 |
| Ngoại lệ 2 — ngưỡng chênh | **15** | 10 – 25 | Thiên vị `ANTICIPATED` |
| Số NPC có dị ứng | **3 / 12** | **KHÓA trần** | §2.10.2 ràng buộc 3 |
| Cửa sổ sửa dị ứng | **6,0 s** | 4 – 8 | §2.10.2 ràng buộc 1 |
| Làm lại: memory ×  | 0.35 | 0.25 – 0.5 | — |
| Bớt tiền: memory × | 0.55 | 0.4 – 0.7 | — |
| Cho thêm: memory × | 0.75 | 0.6 – 0.9 | — |

---

## 6. Tiêu chí đạt

**A. Đúng thuật toán (unit test, chạy CI):**

- [ ] `diff()` với `dish` khớp hoàn toàn `spec` → trả về mảng rỗng (trừ `TASTE_OFF` nếu khẩu vị lệch).
- [ ] `MISSING do_chua` → `salienceCounter = 20.0`, `salienceEat = 100.0`. ← khớp CANON §3.1.
- [ ] `UNWANTED ngo_ri` với `allergy` → `salienceCounter = 50.4`, và `pickSpoken()` **luôn** chọn nó kể cả khi có defect salience cao hơn.
- [ ] `take(1)` không bao giờ trả về quá 1 defect, kể cả với `children` (đơn nhiều ổ).
- [ ] `silentScore` của 2 defect cùng kind < tổng của 2 defect khác kind cùng salience (kiểm `stackMul`).
- [ ] Chi phí biên của defect thứ hai luôn **dương**: `silentScore([a,b]) > silentScore([a])` với mọi cặp.
- [ ] `specSimilarity(x, x) === 1.0` với mọi spec.
- [ ] `computeTip()` không bao giờ trả về số âm.

**B. Đúng liên kết ngược (test quan trọng nhất của doc này):**

- [ ] **Test round-trip `stimId`:** tạo đơn có defect → `spawnStimulus()` với `stimId` từ `mk()` → `npc.observations[stimId]` tồn tại. **Assert bằng chuỗi, không phải bằng object reference.**
- [ ] Test: khách `FRONT_CENTER` + `gaze 1.0` + defect `MISSING pate` (stage 2, kích thích 9–14 s) → `witness === 'ANTICIPATED'` trong **≥ 95%** số lần.
- [ ] Test: khách `QUEUE_3` + `gaze 0.05` + cùng defect → `witness === 'DISCOVERED'` trong **100%** số lần.
- [ ] Test: đổi `stimId` format ở một phía → test round-trip **phải fail**. (Nếu không fail, test vô dụng.)
- [ ] Test kịch bản: chạy 200 đơn có đúng 1 defect mỗi đơn, phân bố khách đều 5 slot → tỉ lệ `ANTICIPATED` toàn cục nằm trong **22–38%**. Ngoài khoảng này thì hoặc thoại `ANTICIPATED` bị lãng phí, hoặc `DISCOVERED` không bao giờ xảy ra.

**C. Đúng content (lint, chạy CI — `tools/lint-orders.ts`):**

- [ ] Mọi `utterance` có từ khoá trong từ điển §2.2 đều có mục tương ứng trong `spec`.
- [ ] Mọi mục `required`/`forbidden` trong `spec` đều truy được về một cụm trong `utterance`, hoặc có `implicit: true`.
- [ ] Mọi mục trong `allergy` đều là tập con của `forbidden`.
- [ ] Mọi `utterance` có `allergy` đều chứa ít nhất một trong: *dị ứng · nổi mề đay · bác sĩ · kiêng · ăn vô là*.
- [ ] Với `style: "buried"`, vị trí cụm quan trọng nhất nằm trong khoảng **55–75%** độ dài câu (trường `buriedAt`).
- [ ] Mọi `utterance` vòng vo có **≤ 2** mục đi vào `spec` (≤ 3 với `proxy`).
- [ ] Không có `utterance` nào vượt **45 từ**.
- [ ] Mọi câu có `vo` file tồn tại và độ dài audio khớp ±20% với ước lượng từ số từ.
- [ ] Số NPC có `allergy` trong toàn bộ content ≤ **3**.

**D. Đúng trải nghiệm (playtest 10 người lạ — cổng P1):**

- [ ] **≥ 7/10** trả lời đúng *"vì sao khách đó giận"* (cổng cứng CANON §17).
- [ ] **≥ 6/10** nhận ra rằng *"có khi khách nói 'tôi thấy rồi', có khi khách chỉ 'ủa'"* — và **nói được vì sao khác nhau**.
- [ ] **≥ 5/10** thử đoán `usual` (bắt đầu làm trước khi khách gọi) ít nhất một lần trong 40 phút chơi.
- [ ] **≥ 8/10** mô tả đúng luật *"gói bịch mang đi thì mình không thấy họ phản ứng"*.
- [ ] **0/10** hỏi *"tại sao game không cho tôi xem đơn hàng"* theo nghĩa bực bội. Nếu có ≥ 2 người hỏi → cân nhắc tăng thời lượng ghim câu nói, **không** thêm checklist.
- [ ] Khi được hỏi *"tip tính kiểu gì"*, người chơi trả lời bằng **mô tả định tính** (*"làm đúng thì họ cho thêm"*), không phải bằng con số. Nếu ai đó đọc được công thức chính xác → có chỗ nào đó đang lộ breakdown.

**E. Đúng tông:**

- [ ] Đọc to toàn bộ dòng thoại dị ứng — **0 dòng** nghe như buộc tội (§2.10.2).
- [ ] Người Việt miền Nam đọc 46 dòng thoại defect: **≥ 42/46** được đánh giá "nghe tự nhiên, đúng giọng".
- [ ] Không có dòng nào trong game dùng từ "điểm", "score", "chính xác %", "đạt/không đạt".

---

## 7. Rủi ro & cách bịt

### 7.1. Rủi ro số một — `stimId` lệch và hệ thống im lặng hỏng

Nếu `craft/diff.ts` và `sim/perception.ts` sinh `stimId` theo hai format khác nhau, `witness` luôn ra `DISCOVERED`. **Không crash, không log, không ai biết** — chỉ là game mất đi nửa hay nhất và không ai giải thích được tại sao thoại nhạt.

Bịt bằng ba lớp:

1. **Một hàm duy nhất, một chỗ duy nhất:** `core/stimid.ts` export `makeOrderDefectStimId(specId, kind, itemId)`. Cả hai module **phải** import từ đây. Lint cấm tự nối chuỗi `"ORDER_DEFECT:"` ở bất kỳ file nào khác.
2. **Test round-trip** ở §6.B, chạy mỗi commit.
3. **Cảnh báo runtime ở build dev:** nếu trong một ngày chơi có **0** defect nào ra `ANTICIPATED` trong khi có ≥ 10 defect và ≥ 3 khách ở `FRONT_CENTER`, in `console.error("STIMID LINK LIKELY BROKEN")`.

### 7.2. Ăn gian (g) — micro-cheat lặp vô hạn

Doc này bịt **đầu kinh tế** của lỗ hổng; `P1-02` §2.13 bịt **đầu phát hiện**. Ba đóng góp của doc này:

- **`silentScore` làm chi phí biên luôn dương** (§2.9.2). Bớt một thứ nhỏ mỗi ổ vẫn ăn vào tip mỗi ổ, dù không ai nói gì.
- **`DeliveryRecord.skimmedItems`** — mỗi lần `diff()` chạy, các defect `MISSING`/`WRONG_RATIO(<1.0)` **không được nói ra** được ghi vào bộ đếm trượt của `P1-02`. Đây là cầu nối dữ liệu giữa hai doc.
- **`TASTE_OFF`** — bớt đều đặn làm `dishTasteVector` trôi khỏi `hiddenTaste` của mọi NPC, `tasteScore` tụt, `positiveScore` tụt → tip tụt thêm một lớp nữa mà người chơi không nhìn thấy nguồn.

Tính thử: bớt ngò (w 0.7) + bớt 30% sốt + bớt 25% đồ chua với mọi khách. `silentScore ≈ 14×0.75 + 12×0.75×0.75 + 0 = 17,3` (đồ chua trong dung sai). `q = (1 − 17.3/120)^1.6 = 0.78`. Tip tụt **22%** mỗi đơn, vĩnh viễn, ngay từ ngày đầu. Tiết kiệm nguyên liệu ~180₫/ổ; mất tip ~440₫/ổ với khách Friend. **Lỗ.** Và đó là trước khi bộ phát hiện pattern kịp kích hoạt.

### 7.3. Ăn gian (b) — phân tầng khách

*Dồn đồ xịn cho 3 người "soi", ăn gian với 9 người còn lại.* Doc này đóng góp hai chỗ:

- **`positiveScore` trừ vào `silentScore` có trần** (`p` bị `clamp01`). Không "mua" được điểm hoàn hảo bằng cách cho thêm đồ chua.
- **Nhân chứng lúc ăn (§2.8.3)** không lọc theo `soi`. Bé Su (`soi 0.4`, `thanThien 1.0`) đứng cạnh chị Lan lúc chị mở gói bánh thiếu đồ chua → bé **seed gossip với `confidence 1.0`** dù bé chẳng quan tâm. Đúng CANON §8b: *"người dễ tha không giận nhưng vẫn vô tư kể lại"*.

### 7.4. Ăn gian (i) — spam `FREE_EXTRA`

`positiveScore()` gọi `diminish(kind, npc)` — cùng hệ số 1.0 / 0.6 / 0.25 của `P1-02` §2.8. Và từ lần thứ 3 trong ngày với NPC `soi ≥ 0.7`, rule `suspect_bribery` kích hoạt, `positiveScore` đóng góp **âm**.

### 7.5. Rủi ro §16 Đừng-3 — ngẫu nhiên chạm vào hệ quả

Kiểm tra: ngẫu nhiên trong doc này xuất hiện ở **hai chỗ**, cả hai đều là shuffle-bag tất định theo seed ngày:

| Chỗ | Đổi | KHÔNG đổi |
|---|---|---|
| `npc.silenceBag` (luật im lặng 35%) | **Có nói hay không nói** | Không đổi defect, không đổi `silentScore`, không đổi tip |
| Chọn biến thể trong `responses[]` | **Câu chữ** | Không đổi category, không đổi intensity |
| `t_walk`, `t_unwrap` | Thời điểm | Không đổi có phản ứng hay không |

**`diff()` hoàn toàn tất định.** Cùng `spec` + cùng `dish` = cùng `Defect[]`, byte-identical. `witness` phụ thuộc `observations`, cũng tất định (`P1-02` §7.3). `tip` tất định. Tức là: **công thức có ra đúng món không, tiền có vào túi không — không bị ngẫu nhiên chạm vào.** Đúng ràng buộc CANON §12.

### 7.6. Rủi ro §16 Đừng-1 — mô phỏng sâu chuyện ngoài quầy

Cám dỗ: mô phỏng NPC thật sự ăn, thật sự tiêu hoá, thật sự về nhà kể cho vợ. **Không.**

`EAT_SPOT_C` (đi khuất góc hẻm) **không mô phỏng gì cả**. Khách biến mất khỏi màn hình, và sáng hôm sau họ **nói một câu** về ổ bánh hôm qua. Nguyên tắc Jeff Orkin: *"Vocalizing intentions can sometimes even be enough, without any actual implementation."* Toàn bộ "chuyện xảy ra ngoài kia" là **một dòng thoại + một cờ boolean**.

### 7.7. Rủi ro tông — dị ứng thành tàn nhẫn

Xem §2.10.2 (4 ràng buộc). Kiểm tra bổ sung ở §6.E. Nếu playtest cho thấy người chơi **sợ** phục vụ bà Bảy thay vì **muốn** phục vụ bà, thì `ALLERGY_MUL` quá cao hoặc cửa sổ sửa sai quá ngắn — **sửa bằng cách nới cửa sổ, không phải bằng cách hạ salience.** Salience cao là đúng; không có đường thoát mới là sai.

### 7.8. Rủi ro sản xuất — nổ khối lượng thoại

5 kind × 2 witness × 12 NPC × 6 biến thể = **720 dòng** nếu viết ngây thơ. Ngân sách v1 cho **toàn bộ game** là ~520 dòng (CANON §11). Bịt bằng §2.7.5: pool generic + chỉ 6 NPC có dòng riêng + shuffle-bag 8 biến thể. **Trần cứng cho nhóm `DELIVER_DEFECT` ở v1: 46 dòng.** Nếu vượt, cắt NPC ra khỏi danh sách "có dòng riêng", **không** cắt số biến thể (biến thể là thứ chống lặp).

### 7.9. Rủi ro T2 — "chỉ cho tôi xem cái đơn thôi mà"

Áp lực này sẽ đến từ playtest, và nó sẽ nghe rất hợp lý. Trả lời: câu nói **đã** được ghim nguyên văn suốt lượt khách và **nghe lại được không giới hạn** (§2.4.3). Thứ người chơi xin thật ra là **bản đã phân tích**, và bản đã phân tích chính là thứ giết T2. Nếu ≥ 2/10 người bực bội (§6.D), phương án được duyệt là: **tăng cỡ chữ và thời lượng của dải ghim**, thêm tuỳ chọn *"luôn hiện chữ"*. Phương án **không** được duyệt: checklist có tick.

---

## 8. Truy vết

| Nội dung trong doc này | `idea.md` | `CANON.md` |
|---|---|---|
| Delivery-time diff liên kết ngược | **§18.3 (dòng 839–853)** | **§6** |
| `take(1)` — Lucas Pope, *Papers, Please* | §18.3 (dòng 847, 853) | §6 |
| `silentScore` ảnh hưởng tip ngầm | §18.3 (dòng 848) | §6 |
| ANTICIPATED vs DISCOVERED | §18.3 (dòng 843–846, 851) | §6 |
| `ORDER_DEFECT` 20 tại quầy → 100 lúc ăn | §9.2 mục 8 (dòng 307) | §3.1 |
| Phản ứng trễ — quay lại phàn nàn | §9.2 mục 8 (dòng 307) | §3.1 |
| Dị ứng = phản ứng nặng | §9.2 mục 10 (dòng 309) | §3.1 |
| Thừa topping → khách vui (`FREE_EXTRA`) | §9.2 mục 11 (dòng 310) | §3.2 |
| `REMEMBERED_USUAL` — khoảnh khắc chữa lành | §9.2 mục 19 (dòng 322) | §3.2 |
| Ngôn ngữ gọi món nguyên văn | §9 · §14 | **§14** |
| Nhân + rau chuẩn Sài Gòn | — | §14 |
| Khẩu vị ẩn + công thức tham số hoá | **§22 mục 1 (dòng 1044)** | §10 |
| "khách gọi vòng vo, có khi 'như mọi bữa'" | §12 (dòng 499) | — |
| Phản ứng im lặng nguy hiểm hơn ồn ào | §9.3 (dòng 356, 361) | §4 |
| 6 người phản ứng 6 kiểu cùng một lỗi | §9.3 (dòng 350–360) | §4 · §9 |
| Ông Hải trước/sau 10 giờ | — | §9 (NPC 6) |
| Chị Lan im lặng biến mất | §9.3 (dòng 356) | §9 (NPC 4) |
| Rule DB Elan Ruskin + `applycontext` + `norepeat` | §18.1 (dòng 805–811) | §11 |
| Shuffle-bag, pool generic, bark 3 tầng | — | §11 |
| 35% "nhận thấy" không nói gì | — | §11 |
| Chống chồng chất `0.75^(n-1)` | §18.4 (dòng 863) | §12 |
| 3 bucket quan hệ, bất đối xứng | §18.4 (dòng 862) | §4 |
| Mutation `ORDER_DEFECT → "ăn bớt nguyên liệu"` | — | §12 |
| Tin đồn không chạm hệ quả | §19 Đừng-3 (dòng 897) | §16 Đừng-3 |
| Sổ tay: game log thô, người chơi viết diễn giải | **§16 HT2 (dòng 667)** | §17 (P2) |
| Ăn gian (b) phân tầng khách | §21b (dòng 1020) | §8b |
| Ăn gian (d) hạ trần tin tưởng vĩnh viễn | §21d (dòng 1022) | §8d |
| Ăn gian (g) micro-cheat | §21g (dòng 1025) | §8g |
| Ăn gian (i) spam trust | §21i (dòng 1027) | §8i |
| Vệ sinh: rủi ro chuyển sang vận hành | — | §7 (XĐ1.2) |
| Trợ năng: text không tự chạy, hộp đục, chạm-để-đặt | §20 | §15 |
| Lằn ranh đỏ: không hạ thấp nghề | — | §14.1 |
| Đại từ xưng hô không dịch | — | §2 |

---

## 9. Đề xuất sửa CANON

Ba đề xuất. Không đề xuất nào đổi con số đã chốt.

### 9.1. Thêm `TASTE_OFF` vào danh mục defect của §6 — **đề nghị nhận**

CANON §6 mô tả `diff()` trả về defect nhưng không liệt kê loại. Doc này định nghĩa 5 loại nói ra được (`MISSING` / `UNWANTED` / `WRONG_RATIO` / `WRONG_TEMP` / `WRONG_PACKAGING`) cộng một loại **không bao giờ nói ra** là `TASTE_OFF` (lệch khẩu vị ẩn).

`TASTE_OFF` đến từ `idea.md` §22 mục 1 (*"Mỗi NPC có khẩu vị riêng ẩn"*), đã được CANON §10 duyệt dưới dạng "công thức tham số hoá". Đề nghị ghi vào §6 rằng nó tồn tại và rằng nó **chỉ vào `silentScore`, không bao giờ vào `visible`** — để không doc nào sau này lỡ cho nó sinh bark.

### 9.2. Ghi `EAT_MULTIPLIER = 5.0` vào §3.1 — **đề nghị nhận**

CANON §3.1 viết `ORDER_DEFECT`: *"20 tại quầy → 100 lúc ăn"*. Con số này chỉ đúng cho `MISSING` với `itemWeight = 1.0`. Với `UNWANTED` dị ứng (`24 × 0.7 × 3.0 = 50.4`) thì "100 lúc ăn" phải hiểu là **trần**, không phải giá trị.

Đề nghị sửa dòng CANON §3.1 thành: *"Salience tại quầy = `base × itemWeight × modifiers`; lúc ăn = `min(100, × 5)`. Trường hợp chuẩn (`MISSING`, weight 1.0): **20 → 100**."*

### 9.3. Làm rõ ranh giới "dữ liệu thô" cho §1 T3 — **cần duyệt**

CANON §1 T3 viết *"Không hiện chỉ số quan hệ… Chỉ mặt, lời, dáng, hành động, hệ quả trễ"*. Doc này cần một ranh giới sắc hơn, vì §2.4.3 cho phép **ghim lại nguyên văn câu khách vừa nói** và §2.11.2 cho phép **sổ tay log đơn theo ngày** — hai thứ này có thể bị đọc là vi phạm T3.

Đề nghị thêm một dòng vào §1 T3:

> **Ranh giới:** game **được phép lặp lại nguyên văn dữ liệu thô nó đã phát ra** (câu khách nói, ngày, giờ, tên, tổng tiền). Game **không được phép diễn giải, gộp, xếp hạng hay suy ra** từ dữ liệu đó (đơn quen, mức độ hài lòng, tỉ lệ đúng, điểm quan hệ). Diễn giải là việc của người chơi. (Nguồn: `idea.md` §16 HT2 — Minh.)

Lý do cần ở CANON chứ không ở doc này: ranh giới này sẽ bị thử thách ở **mọi** doc có UI (`P2-04` sổ tay, `P3-02` chợ, `P5-01` trợ năng), và mỗi doc sẽ tự kẻ một chỗ khác nhau nếu CANON không kẻ sẵn.

---

*Hết P1-03.*
