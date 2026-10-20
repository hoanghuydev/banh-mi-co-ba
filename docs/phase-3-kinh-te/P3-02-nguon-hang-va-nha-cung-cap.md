# P3-02 — Nguồn hàng và nhà cung cấp

> ## ⚡ REVAMP 2026-10-20 — ⚠️ CHẾT MỘT PHẦN
> Căn cứ: [`CANON.md`](../CANON.md) bản revamp. Phần ☠️ không dùng làm căn cứ.
>
> | Mục | Trạng thái | Lý do / thay bằng |
> |---|---|---|
> | Khối "Nền số học" đầu doc | ⏳ | 28k/ổ, 51,7 ổ/ngày, hụi, tiền học… — giá do người chơi chọn 3 mốc (R2), số mô phỏng lại |
> | §1, §2.1–§2.2 Nhà cung cấp là NPC, tái dùng trí nhớ/bucket/đồn thổi | ☠️ | Hệ quan hệ, trí nhớ, đồn thổi chết. Thay bằng nhà cung cấp 2–3 mức chất lượng, 3 thanh *độ ngon · chất lượng · giá* (R3) |
> | §2.3 `visibility[MARKET]` — nhà cung cấp nhìn bạn | ☠️ | Đầu ra cũ là quan hệ; nhà cung cấp không chấm sao |
> | §2.4 Cast 11 nhà cung cấp có tên | 🔁 | Có thể giữ làm tên/mặt cho từng mức chất lượng, chốt ở R3; tên đổi ở R6 |
> | §2.5 Ổ bánh nhiều nguồn (4 thuộc tính, 5 lò) | 🔁 | Thuộc tính `q0`/`kStale` gom vào 3 mức chất lượng + xác suất đau bụng (R3) |
> | §2.6 Bốn đòn bẩy: cho nợ, streak, giữ hàng theo bucket | ☠️ | Sống nhờ quan hệ. Đặt trước (§2.6.3) 🔁 có thể giữ, không phụ thuộc bucket |
> | §2.7 Nhà cung cấp đồn thổi | ☠️ | Đồn thổi chết |
> | §2.8–§2.9 Mười trục quyết định, ba ngày mẫu | ⏳ | Trục D5 (ghi nợ) ☠️. Phần còn lại tính lại theo giá biến động (R3) |
> | §2.10 Khan hiếm (KH-1…KH-4) | ⏳ | Giữ ý, số lò/giờ chợ chờ R3 |
> | §4 UI "không có điểm chất lượng" | ☠️ | Đề bài yêu cầu hiện 3 thanh công khai (R3) |
>
> **Còn dùng được:** luật "không có nút nhặt bánh lên" + khan hiếm thật (§2.10), đặt trước cam kết cứng, delivery-diff đảo chiều khi mở thùng hàng — cho R3.

**Thuộc phase:** P3 (Kinh tế) · **Phụ thuộc:** `phu-luc/A-quyet-dinh-co-che-moi.md` §2.4 · `P2-01` (perception) · `P2-02` (trí nhớ) · `P2-04` (đồn thổi) · `P3-01` (vòng một ngày, lịch thời tiết) · **`P3-03` (tồn kho, hạn dùng, bảng giá — NỀN SỐ HỌC)** · `P3-04` (thiết bị) · `P3-05` (chỗ đứng) · `P3-06` (nghĩa vụ & cân đối) · **Trạng thái:** **Chốt** (các con số: **Cần đo**)

> ### ⚠️ Nền số học — doc này KHÔNG được tự đặt lại
>
> Mọi con số kinh tế gốc thuộc về **`P3-03` §2.5**. Doc này **tiêu thụ** chúng, không định nghĩa lại:
>
> | Khoá | Giá trị chốt | Nguồn |
> |---|---|---|
> | Cầu chuẩn | **51,7 ổ/ngày bình quân** · băng ngày 13–22 = **54 ổ** | P3-03 §2.4, P3-01 §2.4 |
> | Giá bán bình quân / ổ | **28,0k** | P3-03 §2.5.2 |
> | COGS bình quân / ổ | **15,4k** (55%) | P3-03 §2.5.2 |
> | Lãi gộp / ổ | **12,6k** | P3-03 §2.5.2 |
> | Chi phí cố định | **100k/ngày** (→ 115k từ ngày 33) | P3-01 §2.7, P3-03 §2.5.3 |
> | Lãi ròng | **≈ 552k/ngày** (chơi tốt) | P3-03 §2.5.2 |
> | **Ổ bánh — mỏ neo bất biến** | **3,5k, lò bà Tám, giá KHÔNG đổi theo thứ** | P3-03 §2.5.2 |
> | Hạn dùng ổ bánh | **1 ngày** — ổ ế là 3,5k bốc hơi | P3-03 §2.1 |
> | Pate bà Tám / pate thường | 95k / 60k mỗi phần 30 suất → **3,17k / 2,00k mỗi ổ** | P3-03 §2.5.2 |
> | Lịch thời tiết & 6 sự kiện giá 40 ngày | Cố định, seed khoá | P3-01 §2.4.4, P3-03 §2.5.3–2.5.4 |
> | Nghĩa vụ | **Rút về nhà 150k/ngày** · **thuê chỗ 42k/ngày** (`L1`) · hụi **500k × 8 kỳ** · tiền học **1.200k × 2** (ngày 18, 38) | **CANON §13.1** (bảng hợp nhất) |
>
> **Việc của doc này** là mở rộng **một** ô trong bảng đó — *"ổ bánh 3,5k của lò bà Tám"* — thành một **hệ nhà cung cấp là NPC**, mà không đụng vào mỏ neo.

> Đây là cơ chế **vá trực tiếp HT4**: *"vòng kinh tế của bạn có đúng 1 quyết định — pate ngon hay pate rẻ. Tôi ra quyết định đó 1 lần vào ngày 3 rồi lặp lại 37 ngày."* (Minh)
> Và **trả lời Sarah**: *"tại sao tôi lại muốn nhặt ổ bánh dưới đất lên? Nếu tôi lấy ổ mới miễn phí thì cả hệ thống của bạn không bao giờ kích hoạt."*

---

## 1. Mục tiêu

1. Biến buổi sáng đi chợ từ **một menu giá** thành **một buổi giao tiếp với người**, bằng cách **tái dùng y nguyên** engine tính cách + trí nhớ + đồn thổi của P2 → chi phí phát triển gần bằng 0 (`idea.md` §22).
2. Biến vòng kinh tế từ **1 trục quyết định** thành **10 trục giao nhau**, và **chứng minh bằng ba ngày mẫu cho ra ba lời giải tối ưu khác nhau** (§2.9).
3. Tạo **khan hiếm thật** ở cấp nguyên liệu — đặc biệt là **ổ bánh mì** — để mọi rủi ro vận hành (`DROPPED_FOOD`, hết hàng, giao trễ) có **giá thật** (§2.10). Vẫn **KHÔNG có nút nhặt lên** (CANON §7.2).
4. Cho người chơi trải nghiệm chính trụ cột **T1 từ phía bên kia quầy**: **bạn cũng là khách của người khác, và họ cũng đang chấm bạn.**

**Trụ cột phục vụ:** **T1** (chất lượng ổ bánh hiện ra trước mặt khách; và người chơi bị nhà cung cấp nhìn) · **T2** (chọn nguyên liệu lùi thêm một bước — chọn ngay từ chợ) · **T3** (quan hệ nhà cung cấp cũng ẩn hoàn toàn) · **T5** (mọi rủi ro nguồn hàng có dấu hiệu đọc được từ sáng, không roll ngầm).

---

## 2. Cơ chế

### 2.1. Nhà cung cấp **là NPC**, không phải menu giá

**Nguyên tắc gốc:** một nhà cung cấp trong game này là một `Npc` đầy đủ — có 4 chiều tính cách, có trí nhớ 3 tầng, có bucket quan hệ, có bark, có mặt thay đổi theo tâm trạng. Sự khác biệt duy nhất so với khách: **bảng hàng và bảng giá gắn kèm**.

```ts
// econ/supplier.ts
import type { Npc, Personality, MemorySlots, RelationTier } from '../sim/types';

export type SupplierNpc = Npc & {
  goods: GoodId[];
  price: Record<GoodId, PriceProfile>;
  minOrder: Record<GoodId, number>;
  deliveryWindow: [number, number] | null;   // null = phải tự đi lấy
  reliability: number;                        // 0..1 — xác suất giao đúng giờ, đúng chất
  streak: { consecutiveDays: number; lastBuyDay: number; lastSkipDay: number };
  credit: { allowed: boolean; ceiling_k: number; outstanding_k: number; dueDay: number | null };
  preorder: { discountPct: number; commitmentHard: boolean };
};
```

### 2.2. Tái dùng engine nào, tái dùng thế nào

> **Luật tái dùng:** doc này **không được phép** yêu cầu viết một hệ thống mới nào. Mọi thứ dưới đây là **content + một bảng tra mới**, chạy trên code đã có ở P2.

| Engine P2 | Tái dùng ở chợ như thế nào | Code phải sửa |
|---|---|---|
| **Tính cách 4 chiều** (CANON §4) | Y nguyên. `soi` = chủ hàng để ý bạn chọn hàng kiểu gì · `nongTinh` = phản ứng khi bạn chê hàng · `deTha` = bạn trả tiền trễ một lần thì nhớ bao lâu · `thanThien` = tốc độ lên quan hệ + xác suất kể cho nhà cung cấp khác | **0 dòng** |
| **Bucket quan hệ 3 bậc** (CANON §4) | Y nguyên: `Rival → Acquaintance → Friend`. Không có bậc 4 (giữ T4 — xem PL-A §2.2) | **0 dòng** |
| **Trí nhớ 3 tầng** (CANON §12) | Y nguyên. Short-term 6–8 slot, long-term 3–4, **core 1 slot** (*"thằng nhỏ này hồi đó nợ tui hai tuần"*) | **0 dòng** |
| **Đồn thổi** (CANON §12, P2-04) | **Đồ thị lan tin mở rộng**: nhà cung cấp là một cụm node mới trong cùng graph. Cap 2 hop, `confidence *= 0.7–0.85`, nguồn truy vết được | **Chỉ thêm node + cạnh vào file content** |
| **Rule DB thoại** (CANON §11) | Y nguyên. Concept mới: `MARKET_GREET`, `MARKET_HAGGLE`, `MARKET_COMPLAIN`, `DELIVERY_LATE`, `CREDIT_ASK` | **0 dòng**, chỉ thêm rule |
| **Perception** (CANON §5) | **Đây là chỗ đẹp nhất.** Bảng `visibility` thứ hai — `MARKET` — để nhà cung cấp **nhìn thấy bạn đang làm gì với hàng của họ**. Xem §2.3 | **Chỉ thêm một bảng tra tĩnh** |
| **Delivery-time diff** (CANON §6) | Đảo chiều: **bạn** là người phát hiện lỗi của **họ** khi mở thùng hàng. Dùng đúng cấu trúc `diff(spec, delivered)` | **0 dòng**, đổi tham số |
| **Shuffle-bag + bark 3 tầng** (CANON §11) | Y nguyên | **0 dòng** |

**Kết luận chi phí:** một bảng `visibility` tĩnh (~30 số), một nhóm node trong gossip graph, và content. Không có hệ thống mới. Đúng như `idea.md` §22 đã hứa.

---

### 2.3. Bạn cũng bị nhìn — bảng `visibility[MARKET]`

Ở quầy, khách nhìn **tay** bạn. Ở chợ, chủ hàng nhìn **cách bạn đối xử với hàng của họ**. Cùng một công thức CANON §5, đổi bảng tra:

```
rate = salience * visibility[action][supplierZone] * gazeFactor * traitMul / 100
```

| | `CHU_HANG_DUNG_DO` | `CHU_HANG_QUAY_LUNG` | `NGUOI_LAM_DUNG_DO` |
|---|---|---|---|
| `BOI_HANG` (bới tung sạp để chọn) | **0.90** | 0.35 | 0.70 |
| `NGUI_HANG` (cầm lên ngửi) | **0.85** | 0.30 | 0.60 |
| `CHE_HANG` (chê ra miệng) | **1.00** | **1.00** | **1.00** |
| `SO_GIA_NOI_TIENG` (so giá với lò khác ra miệng) | **1.00** | 0.80 | 0.90 |
| `DEM_LAI_TIEN` (đếm lại tiền thối trước mặt) | 0.60 | 0.15 | 0.40 |
| `MUA_CUA_DOI_THU_NGAY_KE_BEN` | **0.95** | 0.55 | 0.85 |

**Sự kiện phía chợ (salience):**

| ID | Sự kiện | Salience | Ghi chú |
|---|---|---|---|
| `HAGGLED_TOO_HARD` | Trả giá gắt, kỳ kèo quá lâu | 60 | Với người `nongTinh` cao → bark tier-1 ngay |
| `CRITICIZED_GOODS` | Chê hàng ra miệng | **90** | Là âm thanh → **bỏ qua gazeFactor**, y như `WRONG_NAME` |
| `PAID_LATE` | Trả nợ trễ hạn | **100** | Lan mạnh nhất trong cụm nhà cung cấp |
| `CANCELLED_PREORDER` | Huỷ / không lấy đủ đơn đặt trước | **100** | Mất uy tín cứng |
| `BOUGHT_FROM_RIVAL_IN_FRONT` | Mua hàng của sạp kế bên ngay trước mặt | 70 | Rất Việt Nam, rất đau |
| `PAID_EARLY` | Trả trước hạn / trả gọn không cần nhắc | 55 | **Tích cực** |
| `BOUGHT_STEADY` | Mua đều, không kỳ kèo | 40 | **Tích cực** — nuôi `streak` |
| `SPOKE_WELL_OF_THEM` | Khen hàng của họ với người khác, họ nghe được | 50 | **Tích cực** — lan qua gossip |

> **Luật đối xứng:** giống CANON §12.5, **tin tốt về bạn lan trong giới nhà cung cấp mạnh hơn tin xấu**. Không có vòng xoáy tiêu cực.

---

### 2.4. Danh sách nhà cung cấp — 11 NPC có tên

> **Ghi chú định danh:** đây là **cast thứ hai**, tách khỏi 12 NPC khách của CANON §9. Không trùng tên. Xem đề xuất sửa CANON ở §9.

> **Khớp với `P3-01` §2.1:** buổi sáng người chơi đi **4 sạp** — *lò bà Tám · sạp pate · sạp thịt · sạp rau*. Bốn sạp đó là **S1, S6, S7, S9** dưới đây. Bảy nhà cung cấp còn lại là **tuỳ chọn**: hoặc giao tận nơi (S10, S11), hoặc chỉ ghé khi cần (S2–S5, S8). Doc này **không làm pha Sáng dài thêm** — nó làm pha Sáng **có nhiều đường đi hơn**.

#### 2.4.1. Lò bánh mì (5 lò — mặt hàng quan trọng nhất, chi tiết ở §2.5)

| # | Tên | Vai | soi / nongTinh / deTha / thanThien | Chức năng thiết kế |
|---|---|---|---|---|
| **S1** | **Lò bà Tám** ⭐ | **Lò nhà, hẻm kế bên. Vừa làm bánh vừa làm pate.** Mặc định từ ngày 1 | 0.5 / 0.3 / 0.8 / 0.9 | **MỎ NEO** (P3-03): ổ **3,5k cố định**, `Q(0) = 1,00`. Và là **người cho nợ** — `thanThien` 0.9, nút lan tin tốt mạnh nhất cụm chợ. **Nghỉ giỗ ngày 28–30** (P3-03 sự kiện giá #4) |
| S2 | **Lò Tân Phát** (ông Đức) | Lò công nghiệp, bỏ mối cả quận | 0.2 / 0.2 / 0.9 / 0.2 | Ổ **3,0k**, bền nhất, nhưng **min 100 ổ** — trên cầu chuẩn 54 ổ. **Chỉ dùng được ở L3/L4 hoặc ngày hội chợ**. Quan hệ gần như không tồn tại: rẻ + tin cậy = lạnh lẽo |
| S3 | **Lò cô Nhàn** | Lò nhà làm, mỗi sáng 1 mẻ | 0.9 / 0.4 / 0.4 / 0.6 | Ổ **4,2k** — đúng con số P3-03 ghi cho "lò khác" ngày 28–30. `Q(0) = 1,00`, **ỉu nhanh nhất game**. Là **một cái bẫy đẹp** |
| S4 | **Lò Vĩnh Ký** (chú A Lộc) | Lò người Hoa, bỏ mối hai đợt | 0.7 / 0.3 / 0.6 / 0.4 | Ổ **3,9k** — đúng con số P3-03 ghi cho "đặt trước lò khác". Người duy nhất có **đợt giao thứ hai**, phải đặt từ 21h hôm trước |
| S5 | **Tiệm bánh Thuận Ký** | Tiệm bán lẻ ngoài mặt đường | 0.4 / 0.4 / 0.8 / 0.7 | Ổ **5,0k**, **tối đa 15 ổ**, phải **tự đi lấy** → van xả khẩn cấp, và thường kích hoạt sự kiện "khách bán hộ" (PL-A §2.7.4) |

> **Vì sao bà Tám vừa bán bánh vừa bán pate:** vì `P3-01` gọi sạp đầu tiên là *"lò bánh bà Tám"* và `P3-03` gọi loại pate đắt là *"pate bà Tám"*. Đây là **một người**, và điều đó tốt về thiết kế: **nhà cung cấp quan trọng nhất của bạn nắm hai mặt hàng chiếm 42% COGS** → cắt quan hệ với bà là một quyết định rất đắt, và cú "bà Tám nghỉ giỗ ngày 28–30" đánh vào **cả hai** mặt hàng cùng lúc.

#### 2.4.2. Nhân và phụ liệu (6 nhà cung cấp)

| # | Tên | Mặt hàng | soi / nongTinh / deTha / thanThien | Chức năng thiết kế |
|---|---|---|---|---|
| **S6** | **Cô Nhung** | **Sạp pate**: pate thường (60k/phần) + **ký gửi pate bà Tám** (95k/phần) | 0.4 / 0.5 / 0.7 / 0.7 | Người bán loại rẻ **và** loại đắt cạnh nhau → cô là **nơi quyết định gốc "pate ngon hay pate rẻ" diễn ra**, và là người chứng kiến bạn chọn gì, mỗi ngày, suốt 40 ngày |
| **S7** | **Chú Chín** | **Sạp thịt**: thịt nguội, chả lụa, heo quay, xíu mại | 0.4 / 0.7 / 0.5 / 0.5 | **Người thưởng lòng trung thành**: mua đều 7 ngày → giảm 10%. `nongTinh` 0.7 → chê hàng của chú là hỏng ngay |
| S8 | **Cô Thắm** | **Chả lụa, chả chiên** (sạp kế chú Chín) | 0.8 / 0.2 / 0.6 / 0.5 | `soi` cao + `nongTinh` thấp = **người im lặng ngưng bán cho bạn**. Bản sao chị Lan ở phía chợ |
| **S9** | **Dì Năm** | **Sạp rau**: rau, dưa leo, ngò, hành, ớt + **đồ chua làm sẵn** | 0.3 / 0.6 / 0.9 / 0.9 | Nói nhiều, tha thứ nhanh. Bán cả **đồ chua làm sẵn 55k/hũ (Q cố định 0,70)** — cám dỗ tắt của đường ống ngâm ở P3-03 §2.2. **Nguồn tin tình báo về chú Kiệt** (P3-05) |
| S10 | **Anh Tuấn** | **Than, gas** | 0.3 / 0.4 / 0.7 / 0.6 | Nối thẳng vào P3-04 (lò than → lò gas). **Là người báo tin giá gas tăng ngày 33** (P3-03 sự kiện #5) — nhưng chỉ nếu quan hệ ≥ `Acquaintance`, nên hầu hết người chơi **không** được báo |
| S11 | **Chú Lâm đá** | **Đá cây, nước, ly nhựa, bịch, giấy gói** | 0.2 / 0.3 / 0.9 / 0.8 | Hàng rẻ nhưng **không thể thiếu**; hết đá = mất công cụ hạ attention "ly trà đá" (CANON §5.4) |

**Đọc bảng:** bốn chiều tính cách không phải trang trí. Chúng quyết định **cách bạn được phép làm ăn với người đó**:

```ts
// Suy ra hành vi từ 4 chiều — tái dùng đúng quy tắc CANON §4
function supplierBehavior(s: SupplierNpc) {
  return {
    noiThangRaMieng: s.personality.nongTinh > 0.6 || s.personality.thanThien > 0.6,
    imLangRoiBienMat: s.personality.soi > 0.7
                   && s.personality.nongTinh < 0.35
                   && s.personality.thanThien < 0.55,   // ← cô Thắm (S8)
    choNoDuoc:      s.personality.thanThien > 0.75,     // ← bà Tám, dì Năm, chú Lâm
    nhoLau:         1 - s.personality.deTha,            // ← cô Thắm nhớ lâu nhất
    lanTinNhanh:    s.personality.thanThien,            // ← bà Tám & dì Năm
  };
}
```

---

### 2.5. **Ổ bánh mì nhiều nguồn** — trục quan trọng nhất

Ổ bánh là mặt hàng duy nhất **khách nhìn thấy, sờ thấy, nghe thấy** (tiếng giòn khi rạch). Nó cũng là mặt hàng **có hạn dùng tính bằng giờ, không phải ngày**. Vì vậy nó là trục kinh tế nặng nhất của game.

#### 2.5.1. Bốn thuộc tính mô tả một ổ bánh

`P3-03` §2.1 đã định nghĩa `Q` (chất lượng nguyên liệu, 0..1) và hiệu chỉnh nắng gắt: *"ổ bánh để ngoài rổ 3 giờ ở nắng gắt xuống 0,88 — nướng lại phục hồi về 0,97"*. Doc này **không thay mô hình đó** — nó **tách hằng số suy giảm `kStale` theo từng lò**, và hiệu chỉnh `Q0` lúc giao.

```ts
type BreadProfile = {
  price_k: number;       // nghìn đồng / ổ  — MỎ NEO: bà Tám = 3,5k cố định
  q0: number;            // Q lúc vừa giao (0..1)
  density: number;       // 0..1 độ đặc ruột (cao = đặc, thơm bơ; thấp = rỗng ruột)
  kStale: number;        // TỐC ĐỘ ỈU — Q rớt bao nhiêu mỗi giờ ở NANG_GAT
  deliverAt: string;
  reliability: number;
  minOrder: number;
  maxOrder: number;
};
```

**Công thức ỉu — tuyến tính, đọc được, không roll:**

```ts
// Hiệu chỉnh thời tiết dùng lại đúng hệ số của P3-03 §2.1
const WEATHER_STALE_MUL = { NANG_GAT: 1.00, NANG: 0.92, MAT: 0.80, AM_U: 0.85,
                            MUA_RAO: 1.25, MUA_DAM: 1.32 };

function qBread(b: BreadProfile, hoursInBasket: number, w: Weather): number {
  let k = b.kStale * WEATHER_STALE_MUL[w];
  if (hasEquipment('LONG_BAN')) k *= 0.85;    // P3-04 B3
  return Math.max(0, b.q0 - k * hoursInBasket);
}

// Hiệu chỉnh kiểm tra BẮT BUỘC KHỚP với P3-03 §2.1:
//   bà Tám (q0 1,00 · kStale 0,040) sau 3 giờ NANG_GAT  →  Q = 0,88  ✅

const Q_REHEAT_THRESHOLD = 0.80;
// Q < 0,80  →  ổ tính là "ỉu"
//   • KHÔNG nướng lại  →  BURNT_OR_COLD (salience 80)
//   • CÓ nướng lại     →  Q phục hồi về 0,97 (P3-03), nhưng tốn 55 giây lò than
//                          (28 giây nếu có lò gas A1 — P3-04), ăn vào thông lượng cao điểm
```

**Giờ mỗi lò chạm ngưỡng 0,80** (ngày nắng gắt, không lồng bàn):

| Lò | `q0` | `kStale` | Giờ giao | Chạm 0,80 lúc | Ý nghĩa |
|---|---|---|---|---|---|
| S2 Tân Phát | 0,90 | **0,018** | 4h45 | **10h20** | Bền nhất — nhưng khởi điểm thấp nhất |
| **S1 bà Tám** | **1,00** | 0,040 | 5h15 | **10h15** | Mỏ neo. Vừa ngon vừa đủ bền — **và đó là lý do nó là mặc định** |
| S4 Vĩnh Ký | 0,96 | 0,035 | 5h00 | **9h35** | |
| S5 Thuận Ký | 0,98 | 0,050 | ~6h00 | **9h40** | |
| S3 cô Nhàn | **1,00** | **0,072** | 5h45 | **8h30** | Ngon nhất, ỉu nhanh nhất |

> **Vì sao "tốc độ ỉu" là trục quan trọng nhất:** giờ đóng cửa thực tế ở chỗ đầu hẻm là **10h00–10h30** (P3-01 §2.3). Tức **ổ bà Tám vừa đủ sống tới cuối buổi, ổ cô Nhàn thì không.** Chất lượng ổ bánh không phải một con số tốt/xấu — nó là **một hàm của việc bạn bán nhanh tới đâu**, mà tốc độ bán phụ thuộc chỗ đứng (P3-05), thời tiết (lịch cố định P3-01 §2.4.4) và danh tiếng.
>
> **Và vì sao mỏ neo không bị phá:** bà Tám thắng ở ngày thường. Doc này **không làm người chơi bỏ bà Tám** — nó làm người chơi **biết vì sao mình ở lại với bà**, và cho họ 4 lý do cụ thể để thỉnh thoảng đi chỗ khác.

#### 2.5.2. Bảng so sánh 5 lò

| | **S1 bà Tám** ⭐ | **S2 Tân Phát** | **S3 cô Nhàn** | **S4 Vĩnh Ký** | **S5 Thuận Ký** |
|---|---|---|---|---|---|
| Giá / ổ | **3,5k** *(cố định)* | **3,0k** | **4,2k** | **3,9k** | **5,0k** |
| `q0` lúc giao | **1,00** | 0,90 | **1,00** | 0,96 | 0,98 |
| `density` (đặc ruột) | 0,80 | **0,38** | **0,92** | 0,70 | 0,78 |
| `kStale` (Q rớt/giờ) | 0,040 | **0,018** | **0,072** | 0,035 | 0,050 |
| Chạm ngưỡng 0,80 lúc | 10h15 | **10h20** | **8h30** | 9h35 | 9h40 |
| Giờ giao | 5h15 | **4h45** | **5h45** | 5h00 (+ **đợt 2: 9h30**) | — (tự lấy, 5h30–7h00) |
| `reliability` | 0,96 | **0,98** | **0,78** | 0,94 | 1,00 (có giới hạn) |
| Tối thiểu / tối đa | 30 / 90 | **100** / 300 | **20** / 45 | 40 / 120 | **0 / 15** |
| Cho nợ | **Có, trần 400k** | **Không bao giờ** | Sau `Friend` | Sau `Acquaintance` | Không |
| Đặt trước giảm | 6% | 10% | 4% | **12%** | — |
| Ghi chú | **Mỏ neo.** Lò than, mùi khói nhẹ khách quen nhận ra. **Nghỉ giỗ 28–30** | Đều như máy. **Ruột rỗng.** Min 100 ổ **> cầu chuẩn 54** | 1 mẻ/sáng, hết là hết. **Cháy mẻ ~1 lần/9 ngày** | Đợt 2 đặt trước **21h hôm trước**, cam kết cứng | Phải **rời quầy 25 phút** để lấy |

#### 2.5.3. **Không lò nào đúng tuyệt đối** — chứng minh bằng kịch bản

> Cầu chuẩn là **54 ổ/ngày** (P3-03). Min order của S2 là **100 ổ**. Đây là ràng buộc quyết định phần lớn bảng dưới.

| Kịch bản | Lò thắng | Vì sao | Lò thua và thua ở đâu |
|---|---|---|---|
| **Ngày thường ở đầu hẻm, 54 ổ, bán tới 10h15** | **S1 bà Tám** | `q0` 1,00 và chạm 0,80 đúng lúc đóng cửa. Min 30 ổ vừa vặn. Giá 3,5k | S2 buộc mua 100 ổ → **ế 46 ổ = mất 138k vốn** (hạn 1 ngày). S3 ỉu từ 8h30 |
| **Chỗ đứng cao cầu** (L3 chợ sáng ~62 ổ, L4 văn phòng ~65 ổ) hoặc **ngày hội chợ 36–37** (khách ×1,25 → ~68 ổ) | **S2 Tân Phát** | Đây là các ngày **duy nhất** min 100 ổ gần chạm được (mua 100, bán 65–70, ế 30 — vẫn đau). Lãi thêm 0,5k/ổ | Chỉ đáng khi kết hợp **bán xổ cuối buổi** (P3-03 §2.3) |
| **Ngày có khách `soi` cao dày đặc** (thầy Phúc + chị Lan + bà Bảy) | **S3 cô Nhàn** | `density` 0,92 → **mở khoá bark tích cực hiếm**: *"Bánh bữa nay đặc ruột thấy thương."* Mua **25 ổ cô Nhàn + 30 ổ bà Tám**, bán ổ cô Nhàn trước 8h30 | S2 kích `ORDER_DEFECT` kiểu "ổ rỗng" với `soi ≥ 0,8` |
| **Mưa rào / mưa dầm** (ngày 10, 17, 18, 25, 32, 38 — lịch cố định P3-01) | **S1 bà Tám**, mua ít (~34 ổ) | Mưa `×1,25` tốc độ ỉu, khách ×0,60. Cần **ít ổ mà bền**, và min 30 của bà Tám là min thấp thứ hai | S3 min 20 rẻ hơn về min nhưng `kStale × 1,25 = 0,090` → chạm 0,80 lúc **7h55** |
| **Ngày 28–30 — lò bà Tám nghỉ giỗ** (P3-03 sự kiện #4) | **S4 Vĩnh Ký** (3,9k, đặt trước từ ngày 27) | Rẻ hơn cô Nhàn 0,3k/ổ và bền hơn nhiều. **Đây đúng là con số P3-03 đã ghi** | Không đặt trước → phải mua **cô Nhàn 4,2k** (+20%) và chịu ỉu sớm |
| **Ngày dự đoán sai, cháy hàng lúc 8h** | **S4** (nếu đã đặt đợt 2 9h30) hoặc **S5 Thuận Ký** | Hai nguồn duy nhất có bánh sau 6h | S1/S2/S3 **không giao thêm — hết là hết** |
| **Ngày 9–11 và 24, tiền mặt cạn trước cú 2.700k ngày 10 và 25** | **S1 bà Tám** | Lò **duy nhất cho nợ trần 400k**. Một đêm trước ngày 10, khoản nợ 300k tiền bánh là thứ giữ bạn không phải bán tủ mát | S2 không cho nợ. S3/S4 trần thấp |
| **Đang `streak` 6 ngày với bà Tám, hôm nay cô Nhàn có mẻ đẹp** | **Giữ bà Tám** | Bỏ 1 ngày = reset `streak` (bà Tám `deTha` 0,8 → ân hạn 1 ngày, nhưng đây đã là ngày ân hạn) | Bẫy tham lam — §2.6.2 |

**Hệ quả thiết kế:** 8 kịch bản, **5 lò thắng ở 5 nhóm khác nhau**, và **S1 thắng ở 4/8** — đúng vai trò mỏ neo mà P3-03 giao cho nó. Không tồn tại chiến lược "bỏ bà Tám luôn"; cũng không tồn tại chiến lược "không bao giờ đi đâu khác". Điều kiện của Minh được thoả **mà không phá nền số học**.

#### 2.5.4. Lò **cô Nhàn** là một cái bẫy đẹp — thiết kế có chủ ý

Ổ ngon nhất: `q0` 1,00, `density` **0,92** (cao nhất game). Người chơi lần đầu thử thấy ngay — khách bark tích cực, `FLOURISH` dễ ăn hơn (vỏ giòn thì đường rạch đẹp hơn), thầy Phúc nhận xét.

Rồi hôm sau họ mua **45 ổ** của cô Nhàn.

`kStale` = 0,072/giờ. Giao 5h45. Chạm ngưỡng 0,80 lúc **8h30**. Ở đầu hẻm, tới 8h30 người chơi mới bán được khoảng **32/45 ổ** (đường cong lưu lượng P3-01 §2.4.3). **13 ổ còn lại** hoặc thành `BURNT_OR_COLD` (salience 80), hoặc phải **nướng lại 55 giây/ổ** — mà 13 × 55 giây = **12 phút lò** cắm ngay vào đuôi cao điểm, đúng ràng buộc thông lượng CANON §13.3.

**Số học của cái bẫy:**

| | Mua 45 ổ cô Nhàn | Mua 25 cô Nhàn + 30 bà Tám |
|---|---|---|
| Tiền ổ bánh | 45 × 4,2 = **189k** | 25 × 4,2 + 30 × 3,5 = **210k** |
| Ổ phải nướng lại | **13** | **0** (ổ cô Nhàn bán hết trước 8h30) |
| Phút lò bị chiếm | **12 phút** | 0 |
| Ổ có `density ≥ 0,90` bán ra | 45 | 25 |
| Rủi ro `BURNT_OR_COLD` | **Cao** | Gần 0 |
| Ế cuối buổi (hạn 1 ngày) | 0–2 | 1 |

> Bài học tự dạy, không cần tutorial: **"ngon nhất" không có nghĩa là "đúng nhất".**
> Lời giải không phải "đừng mua cô Nhàn". Lời giải là **mua vừa đủ số ổ cô Nhàn để bán hết trước 8h30**, và con số đó **đổi theo chỗ đứng, thời tiết và danh tiếng** — tức nó là một quyết định thật, mỗi sáng.

---

### 2.6. Quan hệ nhà cung cấp — bốn đòn bẩy

> Nguồn: `idea.md` §22 — *"bà bán pate cho nợ nếu thân; ông bán thịt giảm 10% nếu mua đều 7 ngày; đặt trước rẻ hơn nhưng cam kết cứng."*

#### 2.6.1. Đòn bẩy 1 — **Cho nợ** (bà Tám, và mọi NPC `thanThien > 0.75`)

```ts
type CreditState = {
  allowed: boolean;
  ceiling_k: number;       // trần nợ, nghìn đồng
  outstanding_k: number;
  dueDay: number | null;   // hạn — luôn là "cuối tuần" hoặc "ngày mùng 10"
  lateCount: number;
};

function creditCeiling(s: SupplierNpc): number {
  if (!supplierBehavior(s).choNoDuoc) return 0;
  const base = { Rival: 0, Acquaintance: 120, Friend: 400 }[s.relation];
  const trustMul = 1 - 0.25 * s.credit.lateCount;   // trả trễ → hạ trần VĨNH VIỄN
  return Math.max(0, base * Math.max(0, trustMul));
}
```

| Bucket | Trần nợ (bà Tám) | Cách mở | Cách mất |
|---|---|---|---|
| `Rival` | 0k | — | — |
| `Acquaintance` | **120k** | Mua đủ 5 ngày không kỳ kèo | — |
| `Friend` | **400k** | ~14 ngày mua đều + ≥1 lần `PAID_EARLY` | Trả trễ 1 lần → trần ×0,75 **vĩnh viễn** (CANON §8d) |

**Vì sao đây là quyết định, không phải phần thưởng:**
Nợ tiền pate hôm nay = mua được nhiều ổ bánh hơn hôm nay = bán được nhiều hơn. Nhưng nợ có **hạn**, và hạn rơi vào **cùng tuần với tiền thuê chỗ / tiền hụi** (P3-06). Nếu người chơi dùng hết trần nợ vào tuần có nghĩa vụ lớn, họ **kẹt**. Và người chơi **nhìn thấy trước** cả hai con số → đây là quyết định T5 hợp lệ.

**Và cái đau riêng:** bà Tám `deTha = 0.8`, `nongTinh = 0.3` — bà **không la bạn** khi trễ. Bà chỉ nói:

> *"Ừ thôi, khi nào có con đưa cô. Cô biết dạo này khó."*

Rồi trần nợ **âm thầm** rớt xuống 300k. Không có thông báo. Người chơi phát hiện ra hai tuần sau, khi cần tới.

#### 2.6.2. Đòn bẩy 2 — **Streak mua đều** (chú Chín: −10% sau 7 ngày)

```ts
function updateStreak(s: SupplierNpc, day: number, bought: boolean) {
  if (bought) {
    s.streak.consecutiveDays = (s.streak.lastBuyDay === day - 1)
      ? s.streak.consecutiveDays + 1 : 1;
    s.streak.lastBuyDay = day;
  } else {
    s.streak.lastSkipDay = day;
    // Ân hạn theo tính cách: người deTha cao bỏ qua 1 ngày
    const grace = s.personality.deTha >= 0.7 ? 1 : 0;
    if (day - s.streak.lastBuyDay > grace) s.streak.consecutiveDays = 0;
  }
}

function loyaltyDiscount(s: SupplierNpc): number {
  const d = s.streak.consecutiveDays;
  if (d >= 21) return 0.14;
  if (d >= 14) return 0.12;
  if (d >= 7)  return 0.10;
  if (d >= 4)  return 0.04;
  return 0;
}
```

| Nhà cung cấp | Ân hạn (`deTha`) | Chiết khấu trần | Ghi chú |
|---|---|---|---|
| Chú Chín (S7, `deTha` 0.5) | **0 ngày** | 14% | Nghỉ 1 ngày là mất sạch. Đòn bẩy nặng nhất, dễ vỡ nhất |
| Cô Nhung (S6, `deTha` 0.7) | 1 ngày | 9% | Áp dụng cho **pate** — mặt hàng 3,17k/ổ, tức chiết khấu 9% ≈ **15k/ngày** |
| Lò bà Tám (S1, `deTha` 0.8) | 1 ngày | 10% | Tha thứ được — nhưng chỉ 1 ngày |
| Lò Tân Phát (S2, `deTha` 0.9) | 2 ngày | **3%** | Rẻ sẵn rồi nên không thưởng thêm. "Lạnh lẽo" là đặc tính, không phải lỗi |
| Cô Thắm (S8, `deTha` 0.6) | 0 ngày | 8% | + **memory riêng**: nghỉ 2 lần trong 10 ngày → cô **không nói gì** nhưng lần sau *"hết chả rồi con"* dù sạp còn hàng |

**Bẫy tham lam có chủ ý** (tính trên nền 54 ổ/ngày, COGS thịt ≈ **5,4k/ổ** → ~292k thịt mỗi ngày):
lấy một mối thịt rẻ ngoài hôm nay = tiết kiệm **~45k**. Mất `streak` 12 ngày với chú Chín = mất 12% × 292k × 25 ngày còn lại ≈ **876k**, tức **gần hai kỳ hụi**. Người chơi phải **tự tính** — và game **không hiện con số đó ra** (T3). Dấu hiệu duy nhất là chú Chín nói ít hơn.

#### 2.6.3. Đòn bẩy 3 — **Đặt trước: rẻ hơn, cam kết cứng**

```ts
type Preorder = {
  supplier: SupplierId;
  good: GoodId;
  qty: number;
  placedDay: number;
  forDay: number;              // luôn là placedDay + 1
  discountPct: number;
  cancelFeePct: number;        // phí huỷ nếu báo trước
  cancelDeadline_h: number;    // giờ trong ngày, sau giờ này thì KHÔNG huỷ được
};
```

| Nhà cung cấp | Giảm | Huỷ trước hạn | Không lấy đủ |
|---|---|---|---|
| S4 Vĩnh Ký | **12%** | Trước 6h00: phí 3% | `CANCELLED_PREORDER` (salience 100) + **cấm đặt trước 5 ngày** |
| S2 Tân Phát | 10% | Trước 3h00: miễn phí | Ông Đức không giận (`nongTinh` 0.2) — nhưng **tính tiền đủ**. Lạnh và sòng phẳng |
| S1 bà Tám | 6% | Trước 4h00: miễn phí | Không phạt tiền. Nhưng `streak` reset và có bark: *"Tưởng con lấy, cô để dành đó."* — đau hơn phạt tiền |
| S7 Chú Chín | 8% | Trước 5h00: phí 5% | `nongTinh` 0.7 → **bark tier-1 ngay, trước mặt các sạp khác** → lan sang S6, S8, S9 trong 1 hop |

**Giao nhau với dự báo cầu (CANON §13.2) và hạn dùng (CANON §13.1):**

Đặt trước phải làm **tối hôm trước**, tức **trước khi biết thời tiết sáng mai**. Người chơi có:
- Dự báo thời tiết **có sai số** (chính xác ~75%, xem P3-01);
- Lịch sinh hoạt NPC **phải tự suy ra từ quan sát** — chú Tư thứ 2–6 lúc 6h45, cuối tuần không ra;
- Sổ tay ghi lại số ổ bán được 7 ngày trước.

→ Đặt trước 12% là phần thưởng cho việc **đọc hệ thống đúng**. Đoán sai thì hoặc ôm hàng (hạn dùng!), hoặc huỷ (uy tín!). **Đây là chỗ hệ trí nhớ NPC có ích thật sự**, đúng như `idea.md` §22.2 đã hứa.

#### 2.6.4. Đòn bẩy 4 — **Giữ hàng** (không có trong đề xuất gốc, thêm vào vì nó rẻ)

Từ bucket `Friend`, nhà cung cấp **tự động để dành** cho bạn khi hàng khan:

| Tình huống | `Rival` | `Acquaintance` | `Friend` |
|---|---|---|---|
| **Dịch heo ngày 8–12** (P3-03 sự kiện #1: pate ×1,40) | Không có hàng | Mua được 50% nhu cầu | **Giữ giá cũ 2 ngày đầu (ngày 8–9)** — tiết kiệm ~76k, đúng tuần trước cú 2.700k ngày 10 |
| **Bà Tám nghỉ giỗ ngày 28–30** (sự kiện #4) | — | Phải tự tìm lò khác | **Bà báo từ ngày 25 và giới thiệu thẳng chú A Lộc (S4) với giá quen 3,9k** |
| Cô Nhàn cháy mẻ, chỉ còn 20 ổ | Không bán cho bạn | Chia đều với chú Kiệt: 10 ổ | **Bạn 20, chú Kiệt 0** — và chú Kiệt **biết** (→ P3-05) |
| **Mưa lớn miền Tây ngày 17–19** (sự kiện #2: rau ×1,30) | — | Giá thị trường | Dì Năm **giữ giá cũ cho phần rau đầu tiên mỗi ngày** |

> **Luật T3:** không có UI nào hiện "bạn đang ở bucket Friend với bà Tám". Người chơi biết bằng việc **hôm khan hàng vẫn có hàng**, và bằng cách bà gọi bạn khác đi: *"con"* → *"con Ba"* → *"cưng"*.

---

### 2.7. **Nhà cung cấp cũng đồn thổi về bạn**

Đây là chỗ tái dùng đắt giá nhất. Gossip graph của P2-04 nhận thêm **một cụm node**, với **hai cạnh cầu** nối sang cụm khách.

```
        ┌──────────── CỤM CHỢ ─────────────┐
        │  S1 bà Tám ◄────► S6 cô Nhung    │  ← bà ký gửi pate ở sạp cô Nhung
        │      ▲   ▲                ▲      │
        │      │   │                │      │
        │      │   └──► S9 dì Năm ◄─┘      │  ← nói chuyện cả buổi sáng
        │      │                           │
        │      └──► S4 Vĩnh Ký             │  ← hai lò cạnh tranh, vẫn nói chuyện
        │                                  │
        │  S7 chú Chín ◄────► S8 cô Thắm   │  ← sạp kế nhau
        │  S10 anh Tuấn ◄──► S11 chú Lâm   │  ← hai người giao hàng, gặp nhau suốt
        │  S2 Tân Phát  (node cô lập)      │  ← thanThien 0.2, không lan gì
        │  S3 cô Nhàn   (node cô lập)      │  ← soi 0.9 nhưng khép kín
        └────────┬─────────────────┬───────┘
                 │                 │
        CẠNH CẦU 1              CẠNH CẦU 2
        dì Năm ──► bà Sáu       bà Tám ──► cô Mai
        (gánh tàu hũ)           (tạp hoá đối diện)
                 │                 │
        ┌────────▼─────────────────▼───────┐
        │        CỤM KHÁCH (P2-04)          │
        └───────────────────────────────────┘
```

**Mutation graph phía chợ (author tay — CANON §12):**

```
PAID_LATE           --0.30--> "nó đang kẹt tiền, coi chừng"
CANCELLED_PREORDER  --0.40--> "nó đặt rồi bỏ, đừng để dành cho nó"
CRITICIZED_GOODS    --0.35--> "nó chê hàng chợ mình"          # đổi ý định — nặng nhất
HAGGLED_TOO_HARD    --0.25--> "nó kỳ kèo dữ lắm"
BOUGHT_FROM_RIVAL   --0.30--> "nó bỏ mối cũ rồi"
PAID_EARLY          --0.20--> "thằng nhỏ đó sòng phẳng"        # tin tốt cũng phóng đại
BOUGHT_STEADY       --0.15--> "nó mua đều, làm ăn được"
```

**Sáu ràng buộc CANON §12 áp dụng nguyên văn:**

1. `mutation_rate` **per-kind** — bảng trên, không có số global.
2. **Cap 2 hop.** Tin xấu từ chú Chín tới được cô Thắm (1 hop) và bà Tám (2 hop), **không tới được** cụm khách qua đường chợ.
3. Mỗi hop `confidence *= 0.7–0.85`; **nguồn truy vết được**: *"Chú Chín nói con đặt rồi hổng lấy hả?"*
4. **Người chơi phải nghe lỏm được.** Ở chợ, hai sạp kế nhau nói chuyện — người chơi đứng chọn rau, nghe được. **Không có nghe lỏm thì bỏ luôn cơ chế này.**
5. **Tin tốt lan mạnh hơn tin xấu** — hệ số lan 1,3 vs 0,85.
6. Không xảy ra trong **2 giờ chơi đầu** — theo `P3-01` §2.2 là **ngày 1–14**. Cụm gossip chợ mở từ **ngày 15**. Có **công tắc tắt**.

**Hệ quả cụ thể khi mang tiếng xấu trong cụm chợ:**

| Mức `marketRep` | Biểu hiện (không có số hiện ra) |
|---|---|
| Tốt | Có người **gọi bạn lại**: *"Ê, bữa nay cá về ngon nè."* · Được ưu tiên giao sớm 15 phút |
| Bình thường | Giao đúng giờ, giá niêm yết |
| Hơi xấu | Giao **cuối tuyến** (trễ 20–35 phút) · Trần nợ đóng băng · Đặt trước bị hỏi lại *"chắc lấy hông đó?"* |
| Xấu | Trần nợ về 0 ở **toàn cụm** · Không giữ hàng ngày khan · Lò cô Nhàn *"hết rồi con"* · Chỉ còn S2 Tân Phát (node cô lập, không nghe tin đồn) chịu bán bình thường |

> **Chi tiết thiết kế đắt nhất của cả doc:** khi cả chợ quay lưng, bạn vẫn mua được hàng — **từ cái lò lạnh lẽo, rẻ, ruột rỗng**. Bạn không chết. Bạn chỉ bán ổ bánh dở hơn, và khách quen ở hẻm **nhận ra**. Fail mềm nhưng vĩnh viễn, đúng CANON §13.

---

### 2.8. **Mười trục quyết định độc lập, mỗi sáng**

| # | Trục | Miền lựa chọn | Giao nhau với |
|---|---|---|---|
| **D1** | **Lò nào** (hoặc pha trộn mấy lò) | 5 lò × tỉ lệ pha | Chỗ đứng (P3-05), thời tiết, cơ cấu khách hôm nay |
| **D2** | **Bao nhiêu ổ** | 0–140 | Dự báo cầu (CANON §13.2), min order, tiền mặt |
| **D3** | **Pate xịn hay thường, tỉ lệ bao nhiêu** | 0–100% pate nhà làm | Khách `soi` cao hôm nay, hạn dùng 2 ngày |
| **D4** | **Mua tươi sáng nay hay đặt trước tối qua** | Mỗi mặt hàng độc lập | Dự báo thời tiết (sai số 25%), uy tín |
| **D5** | **Trả tiền ngay hay ghi nợ** | Mỗi nhà cung cấp độc lập | Lịch nghĩa vụ P3-06, trần nợ, `lateCount` |
| **D6** | **Mua gộp nhiều ngày (rẻ) hay mua từng ngày** | 1–3 ngày | **Hạn dùng** (pate 2, thịt nguội 3, rau 1) + **sức chứa tủ** (P3-04) — CANON §8j |
| **D7** | **Có đổi nhà cung cấp không** | Giữ / đổi | `streak` đang xây, `marketRep`, gossip |
| **D8** | **Hôm nay có sự kiện giá không, phản ứng sao** | Ôm hàng / né / kệ | Pattern học được (thịt đắt T2, rẻ T5) + sự kiện (dịch heo +40% trong 5 ngày) |
| **D9** | **Đồ chua ngâm hôm nay để ăn ngày nào** | Ngày +1 … +7 | **Đỉnh ngày 3, chua gắt ngày 7** (CANON §13.1) — trục duy nhất thưởng cho việc lên kế hoạch dài |
| **D10** | **Tự đi lấy hay trả phí giao** | Mỗi đơn | Thời gian rời quầy (→ sự kiện "khách bán hộ", PL-A §2.7.4) |

**Tại sao 10 trục này KHÔNG sụp về 1:**

Một trục sụp khi nó có **một lời giải trội** (dominant) không phụ thuộc trạng thái. Kiểm tra từng cặp:

- D1 phụ thuộc **tốc độ bán** → phụ thuộc D2, chỗ đứng, thời tiết. Không có lò trội (§2.5.3).
- D2 phụ thuộc dự báo, mà dự báo **thay đổi mỗi ngày** vì lịch NPC + thời tiết + arc nhân vật (chú Tư biến mất ~ngày 30 → mất một khách cố định 6h45).
- D4 vs D8: đặt trước rẻ 12% nhưng **khoá bạn** trước khi biết sự kiện giá. Ngày có tin đồn "sắp có dịch heo" → đặt trước thịt là thắng lớn; ngày thường → đặt trước thịt là rủi ro vô ích.
- D5 vs D6: nợ được nhiều tiền hơn để mua gộp — nhưng mua gộp thì hạn dùng ăn mất, và nợ thì hạn trả ăn mất. **Hai cái hạn khác nhau, đè lên nhau.**
- D7 vs D1: lò tốt nhất hôm nay có thể không phải lò bạn đang xây `streak`.
- D9 độc lập hoàn toàn với 9 trục còn lại — nó là trục **duy nhất** nhìn 3 ngày về sau.

---

### 2.9. **Ba ngày, ba lời giải tối ưu khác nhau** — phản bác trực tiếp Minh

> *"Tôi ra quyết định đó 1 lần vào ngày 3 rồi lặp lại 37 ngày."*

Ba ngày dưới đây là **ba ngày có thật trong lịch 40 ngày đã chốt** của `P3-01` §2.4.4 và `P3-03` §2.5.4 — không phải ba ngày tự bịa cho tiện lập luận. Cùng một người chơi, cùng một chỗ đứng (*L1 đầu hẻm*), cùng một trình độ. **Không có hai ngày nào cho ra cùng một giỏ hàng.**

---

#### **NGÀY 11 — T5 · Nắng · dịch heo ngày 4/5 · một ngày sau cú 2.700k**

**Thông tin người chơi có từ tối ngày 10:**
- Hôm qua trả **hụi 500k**, cộng thuê chỗ và rút về nhà như mọi ngày. Tiền mặt còn **310k**.
- Giá hôm nay (bảng P3-03 §2.5.4): pate thường **77k**/phần · pate bà Tám **122k** · chả lụa **121k** · rau **43k** · ổ **3,5k**.
  → Pate đang **+28%** so với ngày thường; rau thì **không đắt**.
- T5 là **đáy tuần** cho thịt (index 0,88) — nhưng dịch heo ×1,25 nuốt hết phần rẻ đó.
- Thời tiết **Nắng**, cầu ~**54 ổ**.
- Quan hệ bà Tám: `Acquaintance`, trần nợ **120k**.

**Suy luận:** đây **không phải** ngày tối ưu chất lượng. Đây là **ngày sống sót bằng tiền mặt**. Ràng buộc trội là 310k, không phải khẩu vị khách.

| Trục | Quyết định | Con số |
|---|---|---|
| D1 lò | **S1 bà Tám, 54 ổ** — min 30, giá cố định 3,5k **không bị dịch heo đụng tới** | 189k |
| D2 số lượng | 54 (đúng cầu, không dám dư — hạn 1 ngày) | |
| D3 pate | **Pate thường 100%** (77k/phần × 2 phần) | 154k |
| D4 đặt trước | **Không** — không có tiền đặt cọc | |
| D5 nợ | **Ghi nợ bà Tám 120k (kịch trần)** tiền bánh + một phần pate | |
| D6 mua gộp | **Không.** Tuyệt đối không ôm hàng khi tiền mặt 310k | |
| D8 sự kiện giá | **Né bằng cơ cấu**: tăng đồ chua + rau (rau 43k, không tăng giá), giảm pate mỗi ổ 15% | |
| D9 đồ chua | Ngâm **2 hũ** cho ngày 14 (đỉnh ngày 3) — 70k, rẻ và là đòn bẩy chất lượng duy nhất còn lại | 70k |

**Kết quả:** vốn ~**640k** (trong đó 120k là nợ) → tiền mặt thực chi **520k**, còn lại ~**-210k**… không đủ. Người chơi buộc phải cắt tiếp: **mua 46 ổ thay vì 54**, hoặc **bán 1 hũ đồ chua cũ**, hoặc **xin dì Năm cho nợ rau**.
**Ngày này không có lời giải đẹp — chỉ có lời giải ít tệ nhất.** Và đó là bài học kinh tế lớn nhất của 2 giờ chơi đầu (`P3-01` §2.2 gọi ngày 10 là "hook kinh tế nằm trong cửa sổ refund").

---

#### **NGÀY 18 — T5 · Mưa rào · mưa lớn miền Tây (rau ×1,30) · chốt mốc `streak`**

**Thông tin:**
- Mưa rào → **khách ×0,60** → cầu ~**32 ổ**. Và mưa làm `kStale ×1,25`.
- Rau **56k** (+30%, sự kiện giá #2, `P3-03` ngày 17–19). **Rau hạn 1 ngày → không trữ được.**
- T5 → thịt **rẻ nhất tuần** (index 0,88), và **không có sự kiện nào đụng vào thịt**.
- `streak` với chú Chín: **6 ngày**. Mua hôm nay = chạm mốc 7 → **−10% vĩnh viễn từ mai**.
- Nghĩa vụ kế tiếp: **2.700k ngày 25** — còn 7 ngày. Tiền mặt **1.480k**.

**Suy luận:** cầu thấp, rau đắt, thịt rẻ. Ngày để **mua ít bánh, ôm nhiều thịt, và chốt `streak`**.

| Trục | Quyết định | Con số |
|---|---|---|
| D1 lò | **S1 bà Tám, 32 ổ** — min 30 vừa lọt. Mưa nên cần ổ **bền**, `kStale` 0,040 × 1,25 = 0,050 → chạm 0,80 lúc **9h15**, vẫn kịp | 112k |
| D2 số lượng | **32** — chưa bằng 2/3 ngày thường | |
| D3 pate | **Pate bà Tám 100%** — hôm nay ít khách, đánh vào chất lượng để nuôi quan hệ | 122k |
| D4 đặt trước | **Không** — dự báo thời tiết chỉ đúng ~75%, và mai (ngày 19) là Âm u, biên giới | |
| D5 nợ | **Trả sạch 120k nợ cũ trước hạn** → `PAID_EARLY` (salience 55) | |
| D6 mua gộp | **CÓ — ôm thịt nguội 3 ngày** (hạn 3 ngày, T5 rẻ nhất, không dịch) | 3 × 292k × 0,90 = **788k** |
| D7 đổi NCC | **Không đổi chú Chín** — chốt mốc 7 ngày | |
| D8 sự kiện giá | Rau đắt → **giảm lượng rau mỗi ổ 20%**, tăng đồ chua từ hũ đang ở đỉnh ngày 3 | 56k |
| D10 tự lấy | **Có** — mưa, xe giao trễ, tự chạy đi lấy lúc 5h10 | |

**Kết quả:** vốn ~**1.078k** cho một ngày bán ~**32 × 28k = 896k**. **Lỗ trên sổ sách của riêng ngày 18.**
**Thắng nằm ở hai chỗ khác:**
1. `streak` chú Chín chạm 7 → từ ngày 19, tiết kiệm **~29k/ngày** × 22 ngày = **638k**.
2. Kho thịt rẻ chạy hết ngày 20, che luôn hai ngày trước cú 2.700k.
3. `PAID_EARLY` đúng lúc bà Tám đang ế vì mưa → **core memory slot**, và trần nợ giữ nguyên 400k suốt mùa dù sau này có trễ một lần.

---

#### **NGÀY 29 — T2 · Mát · lò bà Tám nghỉ giỗ (ngày 2/3)**

**Thông tin:**
- **Bà Tám nghỉ giỗ ngày 28–30** (`P3-03` sự kiện giá #4). Bà **báo từ ngày 25**.
  → Mất **cả ổ bánh 3,5k LẪN pate bà Tám**. Nhà cung cấp quan trọng nhất biến mất 3 ngày.
- T2 → **mọi thứ đắt nhất tuần**: thịt ×1,18, pate ×1,12, rau ×1,05.
- Thời tiết **Mát** → cầu tốt, ~**56 ổ**, và `kStale` chỉ ×0,80.
- Tiền mặt **2.240k**. Nghĩa vụ kế: hụi **500k ngày 30**, tiền học **1.200k ngày 38**.
- **Nếu người chơi đã đọc trước từ ngày 25**, họ đã làm hai việc vào ngày 27: đặt trước S4 Vĩnh Ký, và ôm pate bà Tám.

| Trục | Quyết định (người chơi đã chuẩn bị) | Con số |
|---|---|---|
| D1 lò | **S4 Vĩnh Ký 56 ổ, đã đặt trước từ ngày 27** → 3,9k **−12%** = **3,43k/ổ** — **rẻ hơn cả giá bà Tám ngày thường** | 192k |
| D2 số lượng | 56. `kStale` Vĩnh Ký 0,035 × 0,80 (Mát) = 0,028 → chạm 0,80 lúc **10h40**, dư sức | |
| D3 pate | **Pate bà Tám ôm từ ngày 27** (hạn 2 ngày → phủ đúng ngày 28 và 29) | đã trả 0k hôm nay |
| D4 đặt trước | Đã đặt. **Cam kết cứng — hôm nay trời Mát nên không phải hối hận** | |
| D5 nợ | Trả tiền ngay — đang dư tiền, và muốn giữ trần nợ sạch trước ngày 38 | |
| D6 mua gộp | **Không mua thêm gì** — T2 là ngày đắt nhất tuần, chờ T5 (ngày 32, nhưng ngày 32 mưa rào…) | |
| D7 đổi NCC | **Tạm thời đổi lò, KHÔNG đổi lòng.** `streak` bà Tám được **đóng băng** trong 3 ngày nghỉ giỗ (luật §2.6.2: `lastSkipDay` không tính khi nhà cung cấp tự nghỉ) | |
| D9 đồ chua | Ngâm 2 hũ cho ngày 32 | 70k |

**Kết quả:** vốn ~**920k**, doanh thu 56 × 28k = **1.568k**, **lãi gộp 648k — ngày lãi cao nhất trong ba ngày.**
**Và nó lãi cao nhất vì một lý do duy nhất: người chơi đã nghe bà Tám nói từ ngày 25.**

**Người chơi KHÔNG chuẩn bị thì sao?** Không có game over. Họ mua **S3 cô Nhàn 4,2k** (đắt hơn 0,77k/ổ = **−43k**), dùng **pate thường** (khách `soi` cao nhận ra, `dishQuality` tụt 0,050 — đủ để chị Lan lọt ngưỡng nếu cộng thêm rau ngày 2), và ổ cô Nhàn **chạm 0,80 lúc 8h50** nên 15 ổ cuối phải nướng lại. Lãi gộp còn **~520k**. Chênh lệch giữa hai người chơi: **128k trong một ngày, và một câu bark của chị Lan.**

---

#### Tổng kết ba ngày

| | **Ngày 11** | **Ngày 18** | **Ngày 29** |
|---|---|---|---|
| Ràng buộc trội | **Tiền mặt 310k** | **Cầu thấp + rau đắt** | **Nhà cung cấp biến mất** |
| Lò | S1 bà Tám | S1 bà Tám | **S4 Vĩnh Ký (đặt trước)** |
| Số ổ | 46–54 | **32** | 56 |
| Pate | **Thường 100%** | **Bà Tám 100%** | Bà Tám **(ôm từ ngày 27)** |
| Đặt trước | Không | Không | **Có, quyết định từ ngày 27** |
| Nợ | **Kịch trần 120k** | **Trả sớm** | Trả ngay |
| Mua gộp | Không | **Có (thịt 3 ngày, 788k)** | Không |
| Vốn | ~640k | ~1.078k | ~920k |
| Lãi gộp ngày đó | ~650k | **~−180k** | **~648k** |
| Thắng ở đâu | **Sống sót** | **`streak` + quan hệ dài hạn** | **Đã đọc trước 4 ngày** |

> **Ba giỏ hàng khác nhau hoàn toàn, ba ràng buộc trội khác nhau hoàn toàn, và ngày lãi âm lại là ngày chơi hay nhất.**
> Không ngày nào trong ba ngày này giải được bằng cách nhớ lời giải của ngày trước, vì đầu vào đổi mỗi ngày: thời tiết (lịch cố định), sự kiện giá (6 cái), `streak` đang ở mốc nào, tiền mặt còn bao nhiêu so với nghĩa vụ kế tiếp, và **nhà cung cấp có mặt hay không**.
>
> **Lời phê HT4 được đóng.**

---

### 2.10. **Khan hiếm phải thật** — trả lời Sarah

> *"Tại sao tôi lại muốn nhặt ổ bánh dưới đất lên? Nếu tôi lấy ổ mới miễn phí thì cả hệ thống của bạn không bao giờ kích hoạt."*

Sarah đúng về **chẩn đoán**, và CANON §7.2 đã chọn **lời giải khác với lời giải bà gợi ý**:

> **KHÔNG có nút "nhặt lên dùng tiếp".** Bánh rớt = **bắt buộc bỏ, làm lại**. **Rủi ro chuyển từ đạo đức sang vận hành.**

Nghĩa là: người chơi không bao giờ phải chọn giữa "sạch" và "lời". Họ chỉ phải sống với hậu quả. **Để hậu quả có sức nặng, khan hiếm phải thật.** Đây là phần việc của doc này.

#### 2.10.1. Bốn luật khan hiếm

> **Luật KH-1.** **Ổ bánh mua từ sáng. Hết là hết.** Không lò nào giao thêm giữa buổi.
> **Ngoại lệ duy nhất:** đợt 2 của S4 Vĩnh Ký lúc 9h30 — nhưng **phải đặt trước 21h hôm trước**, tức vẫn là quyết định của ngày hôm trước, không phải phao cứu sinh giữa buổi.
>
> **Luật KH-2.** Van xả duy nhất là **S5 Thuận Ký**: tối đa **15 ổ**, giá **5,0k** (đắt hơn mỏ neo 43%), **phải tự đi lấy 25 phút**, và **chỉ còn hàng tới ~7h00**. Đi lấy = rời quầy giữa cao điểm.
>
> **Luật KH-3.** Không có "mua thêm nguyên liệu online". Không có menu tiếp tế. Chợ **đóng cửa lúc 8h**.
>
> **Luật KH-4.** Mỗi ổ rớt = **một ổ ít hơn để bán**, và nếu ngày đó bán hết hàng thì đó là **một đơn hàng mất thật** — cộng thêm thời gian làm lại đè vào hàng chờ.

#### 2.10.2. Con số chứng minh áp lực có thật

**Kịch bản chuẩn — ngày 22, chỗ *L1 đầu hẻm*, nền số học `P3-03`:**

| Thông số | Giá trị | Nguồn |
|---|---|---|
| Ổ mua sáng | **54** | P3-03 §2.4 (băng ngày 13–22) |
| Dự báo cầu (sổ tay người chơi) | 54 ± 7 | P3-03 §2.4 |
| Giá bán bình quân / ổ | **28,0k** | P3-03 §2.5.2 |
| COGS / ổ | **15,4k** | P3-03 §2.5.2 |
| **Lãi gộp / ổ** | **12,6k** | P3-03 §2.5.2 |
| Riêng giá ổ bánh | **3,5k** | P3-03 §2.5.2 |
| Thời điểm cháy hàng dự kiến | **~9h40** | P3-01 §2.4.3 |
| Khách tới sau khi cháy hàng | ~5 người, trong đó **2 khách quen** | |

**Tác động của việc làm rớt ổ bánh, theo thời điểm:**

| Rớt lúc | Còn | Tác động trực tiếp | Tác động dây chuyền |
|---|---|---|---|
| **5h40** (chưa mở hàng) | 53 | **−3,5k** (giá ổ) | Gần như không. Đây là "vùng an toàn" — và người chơi **học được điều đó** |
| **6h40** (đầu cao điểm) | 53 | −3,5k + **làm lại mất 40–55 giây** | Hàng chờ dài thêm 1 người · `MADE_THEM_WAIT` leo thang cho 2 người phía sau · **3–4 cặp mắt ở `QUEUE_2`/`QUEUE_3` nhìn thấy** (`visibility[HANDS][QUEUE_2]` = 0,45) |
| **7h30** (đỉnh) | 53 | −3,5k + 55 giây | **Nặng nhất.** 5 người trong hàng · gần như chắc chắn một người đạt `CONFIRMED` · dây chuyền `MADE_THEM_WAIT` |
| **9h20** (sắp cháy hàng) | 53 | −3,5k + **mất một đơn hàng thật: −28k doanh thu, −12,6k lãi gộp** | **Khách cuối không có bánh.** Nếu là khách quen → lỗ hổng (l): *"khách đến mà hết hàng thì mất lòng"* → memory tiêu cực + họ kể lại |

**Đọc bảng:** cùng một sai sót, chi phí tiền mặt chênh nhau **8 lần** (3,5k → 28k), và chi phí **xã hội** chênh nhau còn nhiều hơn. Người chơi không cần ai giải thích — họ **cảm thấy** nó ở lần thứ hai làm rớt ổ bánh lúc 9h20.

> **Đối chiếu để thấy con số này lớn tới đâu:** một ổ mất lúc 9h20 = **12,6k lãi gộp**. Chi phí cố định cả ngày là **100k**. Tức **tám ổ rớt sai giờ là bay nguyên chi phí cố định của một ngày**, và **40 ổ rớt cả mùa là một kỳ hụi**.

**Mở rộng — chọn sai số lượng mua:**

| Số ổ mua | Cháy hàng lúc | Khách hụt | Ổ ế (hạn 1 ngày) | Lãi gộp ngày đó |
|---|---|---|---|---|
| **40** | 8h20 | ~14 | 0 | 40 × 12,6 = **504k** · mất **176k** cơ hội |
| **48** | 9h00 | ~7 | 0 | **605k** · mất 88k |
| **54** ⭐ | 9h40 | ~2 | 0 | **680k** |
| **62** | không cháy | 0 | **8** | 54 × 12,6 − 8 × 15,4 = **557k** |
| **75** | không cháy | 0 | **21** | 54 × 12,6 − 21 × 15,4 = **357k** |

> Tồn tại một điểm tối ưu, nó **nằm giữa**, và nó **đổi mỗi ngày** theo thời tiết (lịch cố định), sự kiện giá, chỗ đứng và danh tiếng. Đó là định nghĩa của một quyết định.
>
> Và chú ý đường cong **bất đối xứng**: mua thiếu 14 ổ mất **176k**; mua dư 21 ổ mất **323k**. **Mua dư đau gần gấp đôi mua thiếu**, vì ổ bánh hạn 1 ngày. Đây là lý do người chơi giỏi luôn mua **hơi thiếu**, và đó chính là lý do sự kiện `DROPPED_FOOD` có răng.

#### 2.10.3. Hệ thống của Sarah **có** kích hoạt

Kiểm tra lại logic của bà: *"nếu tôi lấy ổ mới miễn phí thì hệ thống không bao giờ kích hoạt."*

| Điều kiện Sarah nêu | Trong thiết kế này |
|---|---|
| Ổ mới có **miễn phí** không? | **Không.** **3,5k** tiền mặt + 40–55 giây thông lượng cao điểm — và **12,6k lãi gộp** nếu hôm đó cháy hàng |
| Ổ mới có **sẵn** không? | **Không chắc.** Sau 8h30 thì gần như không còn |
| Người chơi có **lựa chọn đạo đức** không? | **Không, cố ý.** CANON §7.2. Rủi ro là **vận hành** |
| Hệ thống có kích hoạt không? | **Có** — nhưng nó kích hoạt ở hàng chờ, ở đồng hồ, ở 4 cặp mắt phía sau, ở khách cuối ngày về tay không |

**Kết luận:** lời phê của Sarah được giải quyết bằng **khan hiếm + thông lượng**, không bằng cách thêm một nút bẩn thỉu vào game. Cả hai người phê bình được trả lời bằng **cùng một cơ chế**.

---

## 3. Dữ liệu & schema

```ts
// econ/supplier.ts
export type GoodId =
  | 'O_BANH' | 'PATE_NHA' | 'PATE_THUONG' | 'THIT_NGUOI' | 'CHA_LUA'
  | 'HEO_QUAY' | 'XIU_MAI' | 'RAU' | 'DO_CHUA' | 'THAN' | 'GAS'
  | 'DA_CAY' | 'BAO_BI';

export type PriceProfile = {
  base_k: number;
  weekdayMul: number[];          // [CN,T2..T7] — thịt đắt T2, rẻ T5
  eventMul: number;              // dịch heo, lễ…
  volumeBreaks: { qty: number; mul: number }[];
};

export type SupplierNpc = Npc & {
  goods: GoodId[];
  price: Record<GoodId, PriceProfile>;
  bread?: BreadProfile;          // chỉ 5 lò có
  minOrder: Partial<Record<GoodId, number>>;
  maxOrder: Partial<Record<GoodId, number>>;
  deliveryWindow: [string, string] | null;
  secondDelivery?: { at: string; orderBefore: string; commitHard: true };
  reliability: number;
  streak: { consecutiveDays: number; lastBuyDay: number; graceDays: number };
  credit: CreditState;
  preorder: { discountPct: number; cancelFeePct: number; cancelDeadline_h: number };
  marketNode: { neighbors: SupplierId[]; bridgeTo?: NpcId[] };
};

export type MarketRep = {
  perSupplier: Record<SupplierId, number>;   // ẩn, KHÔNG hiện ra (T3)
  cluster: number;                            // trung bình có trọng số theo thanThien
};
```

**Ví dụ content thật** — `content/npcs/suppliers.json` (trích 2 nhà cung cấp):

```json
[
  {
    "id": "LO_CO_NHAN",
    "name": "Lò cô Nhàn",
    "display": "cô Nhàn",
    "personality": { "soi": 0.9, "nongTinh": 0.4, "deTha": 0.4, "thanThien": 0.6 },
    "goods": ["O_BANH"],
    "bread": {
      "price_k": 4.2, "q0": 1.00, "density": 0.92,
      "kStale": 0.072, "reliability": 0.78
    },
    "minOrder": { "O_BANH": 20 },
    "maxOrder": { "O_BANH": 45 },
    "deliveryWindow": ["05:40", "05:55"],
    "preorder": { "discountPct": 4, "cancelFeePct": 0, "cancelDeadline_h": 4 },
    "credit": { "allowed": true, "ceiling_k": 0, "outstanding_k": 0, "dueDay": null },
    "streak": { "consecutiveDays": 0, "lastBuyDay": -1, "graceDays": 0 },
    "marketNode": { "neighbors": ["LO_BA_TAM"], "bridgeTo": [] },
    "failureModes": [
      { "id": "CHAY_ME", "oddsPerDay": 0.11, "effect": "qty -= 40%, q0 -= 0.12",
        "warnedAt": "04:50", "line": "Con ơi bữa nay cô cháy mẻ, còn có hai chục ổ hà." }
    ]
  },
  {
    "id": "LO_BA_TAM",
    "name": "Lò bà Tám",
    "display": "bà Tám",
    "personality": { "soi": 0.5, "nongTinh": 0.3, "deTha": 0.8, "thanThien": 0.9 },
    "goods": ["O_BANH", "PATE_NHA"],
    "bread": {
      "price_k": 3.5, "q0": 1.00, "density": 0.80,
      "kStale": 0.040, "reliability": 0.96,
      "priceIsAnchor": true,
      "note": "MỎ NEO P3-03 §2.5.2 — 3,5k, KHÔNG nhân weekdayMul, KHÔNG nhân eventMul."
    },
    "price": {
      "O_BANH":   { "base_k": 3.5, "weekdayMul": [1,1,1,1,1,1,1], "eventMul": 1.0, "volumeBreaks": [] },
      "PATE_NHA": { "base_k": 95, "unit": "phan_30_suat",
                    "weekdayMul": [1.10,1.12,1.04,1.00,0.92,0.98,1.06], "eventMul": 1.0,
                    "volumeBreaks": [{ "qty": 4, "mul": 0.94 }, { "qty": 8, "mul": 0.88 }],
                    "note": "Trần chiết khấu khớp P3-03 §2.2: pate hạn 2 ngày, 54 ổ dùng ~1,8 phần/ngày" }
    },
    "minOrder": { "O_BANH": 30, "PATE_NHA": 1 },
    "maxOrder": { "O_BANH": 90 },
    "deliveryWindow": ["05:10", "05:25"],
    "credit": { "allowed": true, "ceiling_k": 120, "outstanding_k": 0, "dueDay": null, "lateCount": 0 },
    "preorder": { "discountPct": 6, "cancelFeePct": 0, "cancelDeadline_h": 4 },
    "marketNode": { "neighbors": ["CO_NHUNG", "DI_NAM", "LO_VINH_KY"], "bridgeTo": ["CO_MAI"] },
    "absences": [
      { "id": "NGHI_GIO", "days": [28, 29, 30], "warnedOnDay": 25,
        "line": "Ba bữa nữa nhà cô có giỗ, cô nghỉ lò ba ngày. Con qua chú A Lộc bên Vĩnh Ký, cô dặn rồi, lấy giá quen ba chín.",
        "note": "P3-03 sự kiện giá #4. Mất CẢ ổ bánh LẪN pate nhà làm cùng lúc." }
    ]
  }
]
```

**Rule thoại** — `content/rules/market.json` (trích):

```json
[
  {
    "id": "TAM_LIEN_NO_TRE_LAN1",
    "concept": "CREDIT_OVERDUE",
    "criteria": [
      { "key": "supplier.id", "op": "==", "val": "LO_BA_TAM" },
      { "key": "credit.daysLate", "op": ">=", "val": 1 },
      { "key": "credit.lateCount", "op": "==", "val": 0 }
    ],
    "responses": [
      { "speaker": "LO_BA_TAM", "line": "Ừ thôi, khi nào có con đưa cô. Cô biết dạo này khó.", "face": "cuoi_nhe" }
    ],
    "applycontext": [["baTamLien.ceilingMul", 0.75, 3456000]],
    "norepeat": true, "speakonce": true, "odds": 100
  },
  {
    "id": "NGHE_LOM_CHU_CHIN_VE_MINH",
    "concept": "MARKET_OVERHEARD",
    "criteria": [
      { "key": "player.atMarket", "op": "==", "val": true },
      { "key": "gossip.about", "op": "==", "val": "PLAYER" },
      { "key": "gossip.kind", "op": "==", "val": "CANCELLED_PREORDER" },
      { "key": "gossip.hop", "op": "<=", "val": 2 }
    ],
    "responses": [
      { "speaker": "CHU_CHIN", "to": "CO_THAM",
        "line": "Thằng nhỏ bánh mì đầu hẻm đó, nó đặt rồi hổng lấy. Bà để dành cho nó chi." },
      { "speaker": "CO_THAM", "to": "CHU_CHIN",
        "line": "Ủa vậy hả. Tui thấy nó hiền mà." }
    ],
    "followup": ["CO_THAM", "HOLD_STOCK_OFF", 0],
    "odds": 100
  }
]
```

---

## 4. UI/UX hai thiết bị

**Màn `MarketScene`** — nguyên tắc: **không phải bảng tính**. Là một con hẻm chợ nhìn nghiêng, mỗi sạp là một người đứng đó.

| Yếu tố | PC | Mobile (v2) |
|---|---|---|
| Duyệt sạp | Đi ngang bằng `A/D`, đứng trước sạp thì hiện bảng hàng | Vuốt ngang |
| Bảng hàng | Giá, số lượng, **giờ giao** — **không có "điểm chất lượng"**. Chất lượng đọc bằng **hình ảnh ổ bánh vẽ ra** (vỏ nứt sâu/nông, ruột đặc/rỗng) | Như PC |
| Tốc độ ỉu | **Không hiện số.** Hiện bằng câu của chủ lò: *"Bánh cô ngon nhưng phải bán liền nghen con, để trưa nó xìu."* | Như PC |
| Quan hệ | **Không có thanh, không có số** (T3). Đọc bằng: cách gọi bạn, có mời ngồi không, có tự động gói dư không | Như PC |
| Nợ | Một cuốn **sổ nợ vẽ tay**, chữ của họ, không phải bảng | Như PC |
| Đặt trước | Làm ở màn `EveningScene` — cùng chỗ với ghi sổ và đếm tiền, **cố ý**: bạn đặt hàng lúc đang nhìn con số hôm nay | Như PC |
| Nghe lỏm | Khi đứng im ≥3 giây gần hai sạp đang nói chuyện → bong bóng thoại hiện, **có chỉ nguồn** | Như PC |
| So sánh 5 lò | **Sổ tay người chơi tự ghi** (P2-06), không phải bảng hệ thống sinh ra. Người chơi ghi *"lò cô Nhàn — ngon, xìu sớm"* | Như PC |

**Trợ năng (CANON §15):**
- Cỡ chữ 4 mức áp dụng cho bảng hàng và sổ nợ.
- **Chế độ không giới hạn thời gian**: chợ không đóng cửa lúc 8h — nhưng **giá và tồn kho vẫn theo giờ game**, tức quyết định vẫn còn nguyên, chỉ bỏ áp lực thao tác.
- Icon mặt hàng: dưa leo / ngò / hành lá phải khác nhau về **hình dáng** (CANON §15).
- Công tắc **tắt đồn thổi** cũng tắt luôn cụm gossip chợ.

---

## 5. Tham số cần tune

| Tên | Khởi điểm | Khoảng | Cách đo |
|---|---|---|---|
| `Q_REHEAT_THRESHOLD` | **0,80** | 0,76–0,84 | Ngưỡng ổ tính là "ỉu". Đo: với S1 bà Tám + ngày nắng gắt, ổ cuối phải **vừa chạm ngưỡng** lúc đóng cửa (~10h15) |
| `kStale` S1 bà Tám | **0,040** | **khoá** | **Hiệu chỉnh gốc:** 3 giờ NANG_GAT phải cho `Q = 0,88` — khớp `P3-03` §2.1. Không được đổi mà không sửa P3-03 |
| `kStale` S3 cô Nhàn | 0,072 | 0,060–0,090 | Phải khiến "mua 45 ổ cô Nhàn" **thua rõ ràng** nhưng "mua 25 ổ" **thắng rõ ràng** |
| `kStale` S2 Tân Phát | 0,018 | 0,014–0,026 | Không được thấp tới mức S2 trội tuyệt đối ở chỗ cao cầu |
| `Q_REHEAT_THRESHOLD` | **0,80** | 0,76–0,84 | Ổ bà Tám phải chạm ngưỡng **đúng lúc đóng cửa** (~10h15) ngày nắng gắt |
| Min order S2 | **100 ổ** | 80–130 | Phải **lớn hơn cầu chuẩn 54** — đó là toàn bộ lý do S2 không trội |
| Giá ổ S2 / S3 / S4 | 3,0 / 4,2 / 3,9 k | ±0,4k | S3 = **4,2k** và S4 = **3,9k** là con số `P3-03` §2.5.3 đã chốt cho sự kiện ngày 28–30. **Không đổi tự do** |
| `reliability` S3 | 0,78 | 0,70–0,88 | ~1 lần cháy mẻ mỗi 9 ngày. Phải **có báo trước lúc 4h50** (T5) |
| Chiết khấu `streak` trần | 10% (7 ngày) | 8–14% | Phải đủ lớn để "bỏ 1 ngày" là quyết định đau, không đủ lớn để khoá cứng người chơi vào 1 NCC |
| Trần nợ `Friend` | 400k | 250–550k | ≈ 1/3 vốn nguyên liệu 1 ngày đỉnh. Lớn hơn → mất áp lực; nhỏ hơn → vô dụng |
| `ceilingMul` khi trễ | ×0,75 | 0,65–0,85 | Vĩnh viễn. Kiểm: trễ 3 lần → trần về ~0 |
| Giảm giá đặt trước S4 | 12% | 8–15% | Phải bù được rủi ro thời tiết sai 25% |
| Tỉ lệ dự báo thời tiết đúng | 75% | 65–85% | Dưới 65% → đặt trước thành cờ bạc (vi phạm T5) |
| `gossipSpreadGood/Bad` | 1,30 / 0,85 | — | Ràng buộc CANON §12.5 |
| `MARKET_GOSSIP_HOP_CAP` | 2 | 2–3 | CANON §12.2 |
| Giá bán bình quân / ổ | **28,0k** | **khoá** | Thuộc `P3-03` §2.5.2. Doc này không được đổi |
| COGS bình quân / ổ | **15,4k** (55%) | **khoá** | Thuộc `P3-03` §2.5.2 |
| Cầu chuẩn | **51,7 ổ/ngày** | **khoá** | Thuộc `P3-03` §2.4 |
| S5 Thuận Ký: số ổ tối đa / giá | 15 ổ / 5,0k | 10–20 / 4,6–5,6k | Đủ để cứu một tình huống, không đủ để thành chiến lược |
| S5: thời gian rời quầy | 25 ph | 18–35 | Phải đủ dài để **sự kiện "khách bán hộ"** có cửa kích hoạt |

---

## 6. Tiêu chí đạt

- [ ] **Không có lò trội.** Chạy 200 ngày sim với 6 profile người chơi khác nhau: **không lò nào chiếm >45%** tổng số ổ mua toàn bộ.
- [ ] **Không có ngày lặp.** Với 40 ngày của một seed, **≥30 ngày** có giỏ hàng tối ưu khác ngày liền trước ở **≥2 trục** trong D1–D10.
- [ ] **Playtest — câu hỏi kiểm tra:** sau 5 ngày chơi, hỏi *"sáng mai bạn định mua gì, vì sao?"* → **≥7/10 nêu được ≥3 lý do khác nhau**. (Nếu đa số trả lời "mua như hôm qua" → HT4 chưa được vá, dừng lại.)
- [ ] **Khan hiếm đọc được:** ≥8/10 người chơi, sau ngày 10, **biết trước** mình sẽ cháy hàng lúc mấy giờ, sai số <45 phút.
- [ ] **Làm rớt ổ bánh có sức nặng:** đo phản ứng người chơi ở 3 thời điểm (5h50 / 7h30 / 8h50). **≥7/10 phản ứng khác nhau rõ rệt** giữa 5h50 và 8h50.
- [ ] **Quan hệ NCC đọc được mà không có số:** hỏi *"bà Tám có quý bạn không?"* → **≥7/10 trả lời đúng hướng**, và **≥7/10 nêu được bằng chứng hành vi**, không phải cảm tính.
- [ ] **Nghe lỏm hoạt động:** ≥6/10 người chơi tự phát hiện ít nhất một tin đồn về chính mình trong cụm chợ, **không cần hướng dẫn**.
- [ ] **Không có hệ thống mới nào được viết.** Code review xác nhận: chỉ có 1 bảng tra `visibility[MARKET]`, các node gossip mới, và content JSON.
- [ ] **Vẫn không có nút nhặt lên.** Grep codebase: 0 kết quả cho hành động `PICK_UP_DROPPED`.

---

## 7. Rủi ro & cách bịt

### 7.1. Bảng 6 câu hỏi (bắt buộc theo PL-A §2.8)

| # | Câu hỏi | Trả lời |
|---|---|---|
| Q1 | Người chơi còn bị nhìn? | **Có** — và bị nhìn **nhiều hơn**: thêm một bảng `visibility` ở chợ. Chất lượng ổ bánh cũng hiện ra trước mặt khách |
| Q2 | Còn nói chuyện bằng nguyên liệu? | **Có** — trục này **kéo dài** T2: chọn nguyên liệu bắt đầu từ 5h sáng ở chợ, không phải lúc khách đứng trước mặt |
| Q3 | Quyết định mới mỗi sáng? | **Có** — 10 trục, chứng minh bằng 3 ngày mẫu ở §2.9 |
| Q4 | Có hiện số quan hệ? | **Không.** `MarketRep` là biến ẩn. Đọc bằng cách gọi, bằng việc có giữ hàng không |
| Q5 | Kết trong 40 ngày? | **Có.** 3 bucket quan hệ (không có bậc 4), `streak` trần ở 21 ngày, cây quan hệ đạt đỉnh ~ngày 28 |
| Q6 | Rủi ro đọc được trước? | **Có.** Cháy mẻ báo lúc 4h50 · giao trễ có dấu hiệu từ `marketRep` · tốc độ ỉu là hàm tất định · dự báo thời tiết có sai số **công bố** |

### 7.2. Lỗ hổng ăn gian (CANON §8)

| # | Ăn gian | Cách bịt |
|---|---|---|
| **b** | Phân tầng: mua ổ xịn chỉ cho khách `soi` cao, ổ rẻ cho người dễ tha | Người dễ tha **vẫn vô tư kể lại**: bé Su `thanThien` 1.0 ăn ổ S2 rỗng ruột và nói với cả hẻm *"bánh bữa nay nhẹ hều"*. Dùng chính hệ đồn thổi |
| **c** | Lịch mưa: nhập hàng rẻ ngày mưa | Mưa cũng **−40% khách** (P3-01: ×0,60) → tự cân bằng. Thêm: mưa làm `kStale × 1,25` → ổ ỉu càng nhanh, và `P3-01` §2.7 đã chứng minh tỉ lệ rủi ro trên mỗi đồng tiết kiệm là **như nhau** ngày mưa lẫn ngày nắng |
| **d** | Đốt quan hệ NCC rồi để nguội | `ceilingMul` hạ **vĩnh viễn** theo `lateCount`. Grudge decay được, trần tin tưởng thì không |
| **e** | Save-scum để xem lò nào cháy mẻ | **Seed cố định theo ngày** + autosave ngay khi sự kiện xảy ra. Cháy mẻ của S3 được quyết định bởi `rng(seed, day)`, tải lại không đổi |
| **f** | Datamine + spreadsheet | Không bịt. Phần hay không nằm ở EV: một người tối ưu hoàn hảo vẫn mất chú Tư ngày 30 |
| **g** | **Micro-cheat**: bớt 1 lát thịt với 100% khách | Phát hiện theo **pattern** (P2-05), độc lập với perception. Và ở doc này: **nhà cung cấp cũng để ý** — mua thịt ít đi trong khi bán số ổ như cũ → chú Chín `soi` 0.4 vẫn nhận ra sau ~8 ngày: *"Ủa bán nhiêu đó mà lấy có bây nhiêu thịt?"* |
| **j** | **Tích trữ khi giá đáy** | **Hạn dùng + sức chứa tủ.** Pate 2 ngày, thịt nguội 3, rau 1. Tủ mát (P3-04) mở rộng nhưng có trần và tốn điện mỗi ngày. Thịt ngày 19 chỉ chạy được tới ngày 21 |
| **l** | Đóng cửa sớm | Chi phí cố định vẫn chạy + khách tới mà hết hàng thì mất lòng (bảng §2.10.2) |

### 7.3. Rủi ro thiết kế

| Rủi ro | Mức | Cách bịt |
|---|---|---|
| **Màn chợ thành bảng tính Excel** — người chơi mở ra, nhìn 11 sạp × 13 mặt hàng, tê liệt | **Cao** | (1) Ngày 1–5 **chỉ mở 4 nhà cung cấp** (S1, S6, S9, S11), mở dần theo arc. (2) Mặc định có **"mua như hôm qua"** một nút — nhưng nó **không bao giờ tối ưu**, chỉ là điểm xuất phát để sửa. (3) Bảng hàng vẽ bằng **hình ảnh hàng hoá**, không bằng bảng số |
| **10 trục quá tải nhận thức** | Cao | Chỉ **3–4 trục hoạt động mỗi ngày**: mỗi ngày game "ấn" 1–2 trục lên trước bằng sự kiện (mưa, dịch heo, chạm mốc `streak`). Người chơi không phải cân 10 thứ cùng lúc, họ phải nhận ra **hôm nay trục nào đang nóng** |
| **Ba tầng nhiễu chồng nhau** (Minh: *"6 chiều × nhớ nhầm × đồn thổi = người chơi không phân giải được cái nào gây ra cái gì"*) | **Cao** | Gossip chợ **cap 2 hop và không vượt cạnh cầu tới cụm khách bằng tin xấu** — chỉ tin tốt được qua cầu. Nghĩa là: tiếng xấu ở chợ **chỉ hại bạn ở chợ**. Một hệ, một vùng hậu quả, người chơi phân giải được |
| Người chơi không bao giờ thử lò khác | Trung bình | Ngày 6, cô Ba đưa một ổ cô Nhàn: *"Nè con, bữa nay cô mua thử lò con Nhàn. Con coi."* Một lần, không lặp |
| Quan hệ NCC bị đọc là "grind" | Trung bình | `streak` trần ở **21 ngày**, chiết khấu trần **14%**. Sau đó không còn gì để cày. Và phần thưởng lớn nhất (giữ hàng ngày khan) đến từ **bucket**, không từ số ngày |
| S5 Thuận Ký thành phao dùng mỗi ngày | Thấp | Đắt 41% + rời quầy 25 phút giữa cao điểm + tối đa 15 ổ + hết hàng sau 7h |
| Lỗi văn hoá khi viết thoại chợ | **Cao** | Bắt buộc: **phỏng vấn 3–5 chủ xe bánh mì thật ở TP.HCM** (`idea.md` §23) trước khi viết pool thoại chợ. Người phán xét hàng hoá **luôn là người Việt** (CANON §7.3) |
| Vô tình hạ thấp nghề | **Cao** | Lằn ranh đỏ CANON §14.1. **Không nhà cung cấp nào bán hàng ôi thiu cho bạn.** Chất lượng thấp = **rẻ và khác**, không phải **bẩn**. S2 Tân Phát làm ổ rỗng ruột vì **công nghiệp**, không vì gian |
| Chợ nhiều NPC quá, ngân sách thoại vỡ | Trung bình | 11 NCC dùng **pool generic dùng chung** (CANON §11 đòn bẩy 2) + chỉ ~28 dòng riêng mỗi người cho tình huống đặc trưng. Tổng **~380 dòng**, nằm trong khoản "nội dung P3" của ngân sách 2.980 |

---

## 8. Truy vết

| Nội dung | `idea.md` | `CANON.md` | Doc khác |
|---|---|---|---|
| HT4 — vòng kinh tế 1 quyết định (Minh) | §16 HT4, dòng 680–682 | §10 hàng 2 | PL-A §2.4 |
| Lời phê Sarah — thiếu khan hiếm | §16 HT4, dòng 683–684 | §7.2 | §2.10 |
| Quan hệ nhà cung cấp, tái dùng engine | §22, dòng 1045 | §10 hàng 2 | — |
| 4 ràng buộc kinh tế (hạn dùng, dự báo cầu, thông lượng, giá biến động) | §22, dòng 1034–1039 | §13 | P3-01, P3-03 |
| Fail mềm nhưng vĩnh viễn | §22, dòng 1041 | §13 | P3-06 |
| Sổ nợ · khách tự đứng bán hộ | §19.2, dòng 941–955 | §14 | PL-A §2.7.4 |
| Ngôn ngữ gọi món, danh sách nhân & rau | §19.3 | §14 | — |
| 12 lỗ hổng ăn gian | §21 | §8 | §7.2 |
| Perception — công thức + bảng visibility | — | §5 | P2-01 |
| Trí nhớ 3 tầng · đồn thổi 6 ràng buộc | — | §12 | P2-02, P2-04 |
| Rule DB + shuffle-bag + bark 3 tầng | — | §11 | P2-03 |
| Lằn ranh đỏ (không hạ thấp nghề) | — | §14.1 | — |
| Phỏng vấn chủ xe bánh mì thật | §23 | — | — |
| Phán quyết NHẬN, MỞ RỘNG | — | §10 hàng 2 | PL-A §2.4 |
| **Nền số học** (54 ổ · 28,0k · 15,4k · 100k/ngày · ổ bánh 3,5k lò bà Tám) | — | §13 | **P3-03 §2.4–2.5** |
| Lịch thời tiết 40 ngày · 6 sự kiện giá · 3 cú nghĩa vụ | — | §13.4 | **P3-01 §2.4.4 · P3-03 §2.5.3–2.5.4** |
| 4 sạp buổi sáng · nút "mua như hôm qua" | — | — | **P3-01 §2.1, §4** |
| Đường ống ngâm đồ chua · chiết khấu số lượng trần 22% | §22 | §13.1 | **P3-03 §2.2, §2.3** |

---

## 9. Đề xuất sửa CANON

1. **Thêm mục §9.1 "Cast thứ hai — nhà cung cấp"** vào CANON, với 11 tên ở §2.4 của doc này. Hiện §9 chỉ có 12 NPC khách + cô Ba, và các doc sau sẽ bịa tên nhà cung cấp nếu không chốt ở CANON.

2. **Bổ sung §5** một dòng: *"Có hai bảng `visibility`: `STALL` (§5) và `MARKET` (P3-02 §2.3). Cùng công thức, khác bảng tra."*

3. **Bổ sung §12 (Đồn thổi)** ràng buộc thứ 7:
   > **7.** Gossip có **vùng hậu quả**. Tin xấu sinh ra trong cụm chợ **không vượt cạnh cầu** sang cụm khách; chỉ tin tốt được qua. Lý do: chống ba tầng nhiễu chồng nhau (HT7 — Minh).

4. **Bổ sung §13.1 (Hạn dùng)** dòng cho ổ bánh — hiện CANON chỉ ghi hạn dùng theo **ngày**, còn ổ bánh có hạn tính bằng **giờ**:
   > Ổ bánh: hạn **1 ngày**, nhưng trong ngày `Q` suy giảm **tuyến tính** với `kStale` **0,018–0,072 mỗi giờ tuỳ lò** (`P3-02` §2.5.1). Dưới `Q = 0,80` → `BURNT_OR_COLD` nếu không nướng lại; nướng lại phục hồi về 0,97.

5. **Bổ sung §8 hàng (g)** — mở rộng phạm vi phát hiện micro-cheat: *"Nhà cung cấp cũng là một bộ dò pattern: tỉ lệ nguyên liệu mua / số ổ bán lệch kéo dài sẽ bị nhận ra."*
