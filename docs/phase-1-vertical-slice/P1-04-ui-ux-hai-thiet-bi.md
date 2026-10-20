# P1-04 — UI/UX hai thiết bị

> ## ⚡ REVAMP 2026-10-20 — ⚠️ CHẾT MỘT PHẦN
> Căn cứ: [`CANON.md`](../CANON.md) bản revamp. Phần ☠️ không dùng làm căn cứ.
>
> | Mục | Trạng thái | Lý do / thay bằng |
> |---|---|---|
> | §1, §2.10, §7, §9 Lý do theo T3 (giấu chỉ số quan hệ) | 🔁 | T3 chết, hết quan hệ để giấu. Luật mới: sao là chỉ số công khai duy nhất (T6) |
> | §2.10 CẤM "điểm số / sao cuối ngày" | 🔁 | Đảo chiều: sao + review hiện công khai trên app điện thoại (R4) |
> | §2.1–2.2 Node `notebook` (cột phải / tấm trượt) · §3 layout `notebook` | ☠️ | Sổ tay chết. Chỗ trống dành cho tab điện thoại + badge (R4) |
> | §2.1–2.2 Thẻ đơn mẫu "như mọi bữa" | ☠️ | Order này chết |
> | §2.4 Hàng 4, 13 (sổ tay, nhật ký lời) · hàng 10 "ai thường tới giờ này" | ☠️ | Sổ tay, lịch NPC chết |
> | §2.10 "Tên khách chỉ khi đã ghi sổ tay" · nội dung sổ tay | ☠️ | `WRONG_NAME`, sổ tay chết. Tên NPC đổi (R6) |
> | §2.10 Thông báo "khách X nghe đồn Y" | ☠️ | Thay bằng thông báo review mới (R4) |
> | §2.7 Ca 4 "nghe lỏm" · đi chợ ~5 phút · cảnh tối/sổ tay ~6 phút | ☠️ / 🔁 | Nghe lỏm chết; chợ → nhà cung cấp (R3) |
> | §2.7, §5 Độ dài phiên, khung giờ ca, ngưỡng đo | ⏳ | Đo lại sau R1 |
> | §2.1–2.2 Bố cục quầy · §2.7 "dọn xe" | 🔁 | Map thu nhỏ (R1); xe → quán (art R0.5) |
> | §2.7 Ca 1 "dòng cô Ba" · §8 công cụ "cô Ba" | ☠️ | Bỏ hẳn nhân vật Cô Ba (R0.5) |
>
> **Còn dùng được:** một scene + layout là data, không hover, vùng chạm 44pt, hiển thị attention PA-B, icon theo hình dáng, bark bubble, phím tắt, trợ năng — dùng cho R1, R4.

**Thuộc phase:** P1 — Vertical slice
**Phụ thuộc:** `P1-01-quay-va-che-do-lam-banh` · `P1-02-tang-nhan-thay` (dự kiến) · `P1-03-bark-va-rule-db` (dự kiến) · `P0-01-khung-scene-save-rng` (dự kiến)
**Trạng thái:** **Chốt** mô hình layout data-driven, phương án hiển thị attention, danh sách HUD cấm/cho · **Cần đo** ngưỡng đọc 0,5 s, độ dài ca mobile · **Còn mở** bộ icon cuối (đang là đặc tả hình dáng, chưa phải art)

---

## 1. Mục tiêu

Game này sống hay chết ở chỗ **người chơi có đọc được ánh mắt khách trong nửa giây hay không**. T5 nói *"attention phải NHÌN THẤY ĐƯỢC"* — đó là một yêu cầu UI, không phải yêu cầu sim. Doc này biến nó thành đặc tả vẽ được.

Đồng thời doc này khoá kiến trúc layout: **một scene Phaser duy nhất, layout mô tả bằng data, đổi profile theo orientation, không fork code** (idea.md §12.3). Mọi thứ hiện ra khi rê chuột đều phải có đường khác trên mobile (idea.md §7.1). Mobile là v2 theo CANON §2, nhưng **các ràng buộc phải vào từ P1** — đó đúng là chỗ đa số game web chết khi lên mobile.

Phục vụ trụ cột: **T5** (attention nhìn thấy được), **T3** (không hiện chỉ số quan hệ — doc này giữ danh sách cấm), **T1** (người chơi phải thấy được mình đang bị thấy).

---

## 2. Cơ chế

### 2.1. Bố cục PC — ngang

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ▸ HUD_TOP: 6h47 ·  ổ còn: 14  ·  hàng: 3 người        [⏸] [⚙]              │  8%
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                         S T A G E  —  hẻm, khách, mưa                        │
│                                                                              │
│      ╭─ bark ──────────╮                                                     │
│      │ "cho ổ như mọi  │        ◉ chú Tư          ◉ bà Bảy      ◉ anh Bảo    │
│      │  bữa nha con"   │      FRONT_CENTER       FRONT_SIDE      QUEUE_2     │  46%
│      ╰────────▽────────╯         ╲                  ╲              ·         │
│                                   ╲ tia nhìn         ╲          (nhìn phone) │
│                                    ╲                  ╲                      │
│                               ═════▼══════════════════▼════════ kính ════════│
├──────────────────┬───────────────────────────────────────┬───────────────────┤
│   [OVEN]         │        [ B O A R D ]                  │  ĐƠN HIỆN TẠI     │
│  ◔ 0:06          │   ╭───────────────────────────╮       │  ┌──────────────┐ │
│  ▣ slot 1 ████   │   │   ổ bánh đang làm         │       │  │"như mọi bữa" │ │
│  ▣ slot 2 ██     │   │   ░░░░░░░░░░░░░░░░░░░     │       │  │ · không hành │ │
│  ▢ slot 3 —      │   ╰───────────────────────────╯       │  └──────────────┘ │  32%
│                  │   đã bỏ: ◧ ▤ ✕ ◍ ≡ ✿ ◗             │  SỔ TAY chú Tư    │
│  ✋trái: sạch    │                                       │  · T2–T6, 6h45    │
│  ✋phải: tiền    │   [P1 đầy đủ ●●○] [P2 đậm cay ●○○]    │  · thích giòn     │
│                  │   [P3 nhẹ ●●●]                        │  · con gái thi ĐH │
├──────────────────┴───────────────────────────────────────┴───────────────────┤
│  KHAY NGUYÊN LIỆU   ◧1 ▤2 ⬟3 ◉4 ✕5 ◍6 ≡7 ✿8 ◗9   │ [↶ Hoàn tác] [✓ ĐƯA] │  14%
└──────────────────────────────────────────────────────────────────────────────┘
```

Ghi chú: mọi nút thao tác nằm ở **hai dải dưới cùng** — trên PC là để tay không phải bay lên bay xuống, và để **cùng một cây layout** dùng lại được cho portrait.

### 2.2. Bố cục mobile — dọc

```
┌─────────────────────────────┐
│ 6h47 · 14 ổ · hàng 3  [⏸]  │  7%
├─────────────────────────────┤
│  ╭─ bark ──────────╮        │
│  │"cho ổ như mọi   │        │
│  │ bữa nha con"    │        │
│  ╰───────▽─────────╯        │
│                             │
│    ◉ chú Tư                 │  30%
│     ╲ tia nhìn              │
│      ╲        ◉ bà Bảy      │
│       ╲          ·          │
│  ══════▼═══════════ kính ═══│
├─────────────────────────────┤
│ ĐƠN: "như mọi bữa"·không hành│  6%
├─────────────────────────────┤
│ [OVEN ◔0:06] ▣▣▢  ✋sạch/tiền│  7%
├─────────────────────────────┤
│      ╭───────────────╮      │
│      │  B O A R D    │      │
│      │  ░░░░░░░░░░   │      │  20%
│      ╰───────────────╯      │
│  đã bỏ: ◧ ▤ ✕ ◍ ≡ ✿ ◗      │
├─────────────────────────────┤
│ [P1 ●●○][P2 ●○○][P3 ●●●]   │  9%
├─────────────────────────────┤
│  ◧   ▤   ⬟   ◉   ✕         │
│  ◍   ≡   ✿   ◗   ▽         │  15%   ← vùng ngón cái
├─────────────────────────────┤
│  [ ↶ Hoàn tác ] [ ✓ ĐƯA ]  │  6%    ← thấp nhất = an toàn nhất
└─────────────────────────────┘
```

**Nguyên tắc đối chiếu hai bố cục:**

| Nút logic | PC (landscape) | Mobile (portrait) | Ghi chú |
|---|---|---|---|
| `hud.top` | dải trên, ngang | dải trên, gọn hơn | Cùng node |
| `stage` | 46% giữa | 30% trên | Khách nhỏ hơn → **đây là lý do phải có tia nhìn**, §2.5 |
| `order.card` | cột phải | dải riêng dưới stage | Chuyển từ cột sang dải — **chỉ đổi `flow`**, không đổi node |
| `notebook` | cột phải | **ẩn**, mở bằng chạm mặt khách | Node tồn tại ở cả hai, khác `visible` |
| `oven` + `hands` | cột trái | dải ngang mỏng | `flow: column → row` |
| `board` | giữa | giữa | Luôn là trọng tâm |
| `presets` | dưới board | dải riêng | |
| `tray` | dải đáy 1 hàng | lưới 2 hàng | `flow: row → grid` |
| `undo` + `confirm` | góc phải đáy | dải đáy riêng, full width | Thấp nhất trong cả hai |

### 2.3. Kỹ thuật: một scene, layout là data

**Quy tắc cứng: không một dòng code scene nào được đọc `game.scale.width`.** Scene hỏi `layout.rect(nodeId)` và nhận về một hình chữ nhật. Đổi orientation = đổi **bảng dữ liệu**, không đổi code.

```ts
// ui/layout/types.ts
type Len =
  | { pct: number }              // % của vùng cha
  | { pt: number }               // point tuyệt đối (dùng cho vùng chạm)
  | { aspect: number }           // theo cạnh kia

type Anchor = {
  x: number; y: number           // 0..1 trong vùng cha
  ax: 0 | 0.5 | 1                // điểm neo trên chính node
  ay: 0 | 0.5 | 1
}

type FlexZone = {
  id: NodeId
  parent: NodeId | 'ROOT'
  anchor: Anchor
  size: { w: Len; h: Len }
  minTouch?: { w: number; h: number }   // pt — ép ≥ 44×44, xem §2.6
  flow: 'row' | 'column' | 'grid' | 'free'
  gap: number                            // pt
  pad: [number, number, number, number]
  order: number
  visible: boolean
  safeArea: boolean                      // né notch / thanh home
}

type LayoutProfile = 'PC_LANDSCAPE' | 'MOBILE_PORTRAIT' | 'MOBILE_LANDSCAPE'

// MỘT tập NodeId duy nhất. Ba bảng FlexZone. Không có node nào chỉ tồn tại ở một profile.
const LAYOUTS: Record<LayoutProfile, Record<NodeId, FlexZone>> = { ... }
```

```ts
// ui/layout/resolve.ts — chạy một lần lúc boot và mỗi lần resize/xoay máy
function resolveLayout(p: LayoutProfile, screen: Rect, inset: Inset): Map<NodeId, Rect> {
  const out = new Map<NodeId, Rect>()
  const root = applyInset(screen, inset)
  for (const z of topoSort(LAYOUTS[p])) {
    const parent = z.parent === 'ROOT' ? root : out.get(z.parent)!
    let r = place(parent, z.anchor, z.size, z.pad)
    if (z.minTouch) r = growTo(r, z.minTouch)     // vùng chạm không bao giờ bị ép nhỏ
    out.set(z.id, r)
  }
  return out
}

function pickProfile(w: number, h: number, hasPointer: boolean): LayoutProfile {
  if (h > w) return 'MOBILE_PORTRAIT'
  return hasPointer && w >= 1024 ? 'PC_LANDSCAPE' : 'MOBILE_LANDSCAPE'
}
```

```ts
// scenes/StallScene.ts — scene KHÔNG biết mình đang ở profile nào
class StallScene extends Phaser.Scene {
  create() {
    this.layout = new LayoutService(this.scale)
    this.layout.on('relayout', (m) => this.applyRects(m))   // gọi cả lúc boot
    this.board = this.add.container(0, 0)
    this.register('board', this.board)
    // ...
  }
  applyRects(m: Map<NodeId, Rect>) {
    for (const [id, node] of this.nodes) node.fitInto(m.get(id)!)   // mỗi node tự co giãn
  }
}
```

**Ba luật chống fork code:**

1. **Không có `if (isMobile)` trong `scenes/` hay `sim/`.** Nếu cần khác biệt, khác biệt đó thuộc về bảng `LAYOUTS` hoặc bảng `INPUT_MAP`. Enforce bằng lint rule chặn identifier `isMobile` ngoài `ui/layout/` và `ui/input/`.
2. **Không có asset riêng cho mobile.** Cùng texture atlas, khác `scale`. Icon vẽ ở 96px, dùng ở 24–72px (§2.8).
3. **Đổi orientation giữa chừng không mất trạng thái.** `resolveLayout` chỉ trả toạ độ; `LoafState`, `grip`, `certainty` của mọi NPC không chạm tới. Test: xoay máy giữa lúc đang kéo nguyên liệu → ngón tay giữ nguyên nguyên liệu đó.

### 2.4. Không có hover — kiểm kê từng chỗ và giải pháp thay

idea.md §7.1: *"Mọi thứ hiện ra khi rê chuột phải có đường khác trên mobile."* Đây là danh sách đầy đủ những chỗ prototype hiện đang (hoặc sẽ) dùng hover.

| # | Chỗ dùng hover | Hiện làm gì | **Thay bằng** | Áp dụng cho cả PC? |
|---|---|---|---|---|
| 1 | Rê lên icon nguyên liệu → tooltip tên | Tooltip theo con trỏ | **Nhãn chữ luôn hiện dưới icon** (tuỳ chọn bật/tắt, CANON §15 — *"tuỳ chọn hiện chữ dưới icon"*). Cộng long-press 350 ms mở thẻ chi tiết (hạn dùng, giá) | ✅ Cùng một thẻ, mở bằng giữ chuột |
| 2 | Rê nguyên liệu qua ổ bánh → ô đích sáng | Highlight theo con trỏ | **Ngay khi CẦM nguyên liệu, mọi ô đích hợp lệ sáng lên đồng loạt**, ô không hợp lệ xám đi. Không phụ thuộc vị trí con trỏ | ✅ Tốt hơn cả bản hover |
| 3 | Rê lên khách → xem đơn của họ | Popup theo con trỏ | **Thẻ đơn cố định** ở `order.card`. Chạm mặt khách để **ghim/bỏ ghim** khách đang xem | ✅ |
| 4 | Rê lên tên khách → xem sổ tay | Tooltip | **Chạm mặt khách** mở dock sổ tay (PC: cột phải; mobile: tấm trượt lên từ đáy, đóng bằng vuốt xuống) | ✅ |
| 5 | Rê lên lò → xem thời gian còn lại | Tooltip số giây | **Vòng tiến trình vẽ thẳng trên cửa lò**, có khắc vạch ở 0,45 / 0,88 / 1,00 (P1-01 §2.4). Luôn hiện | ✅ |
| 6 | Rê lên nút preset → preview công thức | Tooltip 7 chiều | **Trên nút luôn có:** tên người chơi tự đặt + **3 chấm mức prep còn lại** + 2 icon nhân. Long-press mở bảng 7 chiều đầy đủ | ✅ |
| 7 | Rê lên nút bị disable → tooltip lý do | Tooltip | **Không có nút disable im lặng.** Nút luôn bấm được; bấm vào thì một dòng lý do hiện ở dải đáy 2,5 s (*"hết pate rồi con"*) | ✅ |
| 8 | Con trỏ đổi hình báo "kéo được" | `cursor: grab` | **Viền chấm mảnh trên mọi thứ kéo được**, luôn hiện. Giữ thêm `cursor: grab` trên PC như bonus, không phải nguồn thông tin duy nhất | ✅ |
| 9 | Rê lên ổ bánh → xem "đã bỏ gì rồi" | Tooltip danh sách | **Dải "đã bỏ"** — chuỗi icon nhỏ ngay dưới ổ, **không bao giờ ẩn**. Bắt buộc, vì nó cũng là nội dung của bước xác nhận (CANON §15.5) | ✅ |
| 10 | Rê lên đồng hồ → xem lịch trong ngày | Tooltip | Chạm đồng hồ → mở tấm "hôm nay" (ca nào, ai thường tới giờ này nếu đã ghi sổ) | ✅ |
| 11 | Rê lên icon tay → xem tay bẩn vì gì | Tooltip | **Icon tay phân biệt bằng hình dáng** (§2.8): sạch = bàn tay trơn · tiền = bàn tay có tờ giấy chéo · dầu mỡ = có 3 giọt · sống = có vệt gợn. Đọc được không cần chữ | ✅ |
| 12 | Rê lên khách để xem họ đang nhìn đâu | — | **Tia nhìn vẽ thường trực** (§2.5). Đây là lý do cả hệ attention không được phép nằm sau hover | ✅ **Bắt buộc** |
| 13 | Rê lên bark cũ để đọc lại | — | Bark không đọc lại được. Thay vào đó: **nhật ký lời** trong sổ tay cuối ngày (CANON §15 — công tắc "sổ tay cuối ngày") | ✅ |
| 14 | Rê lên ô tồn kho → số lượng | Tooltip số | Số **in thẳng** trên khay, cỡ nhỏ, luôn hiện | ✅ |

> **Luật tổng:** nếu một thông tin cần để **ra quyết định trong lúc đang làm bánh**, nó **luôn hiện**. Nếu nó chỉ để tra cứu, nó nằm sau **một cử chỉ rõ ràng** (chạm hoặc long-press), không bao giờ sau hover. Không có ngoại lệ.

### 2.5. Hiển thị attention — điều kiện bắt buộc của T5

Đây là mục quan trọng nhất của doc. CANON §5 cho 4 state (`UNAWARE` / `GLIMPSED` / `NOTICED` / `CONFIRMED`) và ghi *"biểu hiện hình ảnh bắt buộc"*. Nhưng biểu hiện đó phải trả lời **ba câu hỏi trong 0,5 giây**:

```
   AI đang nhìn?  →  NHÌN VÀO ĐÂU?  →  BIẾT TỚI ĐÂU RỒI?
```

**Bốn phương án đã cân nhắc:**

---

**PA-A — Ngôn ngữ cơ thể thuần** (không overlay)
Quay đầu, nhíu mày, nghiêng người, dấu `?`. Dùng layered sprite + spring/lerp theo kỹ thuật Rain World (CANON §16 Đừng-4).

```
   ◉ ‿    →    ◉ ?    →    ◉ ︵    →    ◉ !
 UNAWARE    GLIMPSED    NOTICED    CONFIRMED
```

- ✅ Đẹp nhất, "thật" nhất, không có UI đè lên thế giới, trọn vẹn tinh thần T3.
- ✅ Rẻ: nằm sẵn trong hệ 216 trạng thái từ 18 file.
- ❌ **Hỏng câu hỏi thứ hai.** Quay đầu 15° không nói được là họ nhìn `HANDS` hay `BOARD` — hai zone cách nhau 30 cm trên màn hình 2.5D.
- ❌ **Hỏng ở mobile.** Ở portrait, stage chỉ chiếm 30% chiều cao, mặt NPC ~40 px. Nét lông mày biến mất.
- ❌ Không đạt 0,5 s khi có 4 khách cùng lúc.

---

**PA-B — Tia nhìn + bậc tư thế** *(PA-A làm nền, cộng một lớp vẽ được)*
Một **tia nhìn** mờ đi từ mắt NPC xuống **đúng zone họ đang theo dõi**, với **4 bậc rời rạc** khớp 1:1 với 4 state.

```
    ◉ chú Tư                 ◉ bà Bảy              ◉ anh Bảo
     ╲                        ┃                        ·
      ╲ (mảnh, 15%)           ┃ (dày, 70%)         (không tia)
       ╲                      ┃  + viền zone
        ▼ BOARD               ▼ HANDS               UNAWARE
       GLIMPSED              CONFIRMED
```

- ✅ Trả lời **cả ba** câu hỏi cùng lúc: gốc tia = ai, đích tia = zone nào, độ dày/độ đục = bậc nào.
- ✅ **Rời rạc 4 bậc**, không phải thanh trượt liên tục → mắt phân loại nhanh hơn nhiều so với đọc độ dài.
- ✅ Co giãn tốt: ở mobile tia vẫn dài vài chục pixel dù mặt chỉ 40 px.
- ✅ Nhiều khách cùng lúc vẫn đọc được — các tia hội tụ về zone nào thì **zone đó đang nóng**, đây là thông tin gộp miễn phí.
- ⚠️ Rủi ro rối khi 5 tia. Bịt: chỉ vẽ tia từ bậc `GLIMPSED` trở lên; `UNAWARE` không có tia. Thực tế hiếm khi quá 3 tia.
- ⚠️ Rủi ro "gamey". Bịt bằng art: tia là **vệt mờ có hạt, bo mềm, cùng tông xanh xám của bảng màu Sài Gòn buổi sáng** (CANON §14), không phải đường laser.

---

**PA-C — Vòng cung certainty trên đầu NPC**
Một arc lấp đầy theo `certainty` 0→1.

- ✅ Chính xác tuyệt đối, dễ debug.
- ❌ **Loại thẳng.** Đây là một **cái thanh số trên đầu người**. Nó phá đúng thứ mà T3 bảo vệ: *"Chỉ mặt, lời, dáng, hành động, hệ quả trễ."* Dù T3 nói về chỉ số **quan hệ**, một thanh certainty biến việc đọc người thành việc đọc đồng hồ — và khi người chơi đã quen đọc thanh trên đầu, họ sẽ **ngừng nhìn mặt vĩnh viễn**. Mất luôn cả T1.
- ❌ Không trả lời câu hỏi "nhìn vào đâu".

---

**PA-D — Tô sáng zone đang bị nhìn** (không vẽ gì ở phía NPC)
Zone nào đang bị theo dõi thì sáng lên, độ sáng theo tổng `certainty`.

- ✅ Trả lời rất tốt câu "chỗ nào đang nguy hiểm" — hữu ích lúc cao điểm.
- ❌ **Mất câu hỏi thứ nhất.** Không biết ai đang nhìn → không dùng được công cụ §5.4 (đưa trà đá cho **ai**? hỏi **ai** một câu?). Cả hệ công cụ hạ attention sụp.
- ❌ Gộp mất thông tin: 3 người mỗi người 0,4 nhìn khác nhau ≠ 1 người 1,0.

---

#### Chốt: **PA-B (tia nhìn + bậc tư thế)**, với PA-D làm lớp phụ trợ tuỳ chọn.

**Vì sao:** PA-B là phương án duy nhất trả lời trọn vẹn ba câu hỏi mà không đặt một con số nào lên màn hình. PA-A giữ nguyên làm **nền** (mặt vẫn diễn, vẫn là thứ đọc được ở cự ly gần và là thứ vào trailer). Tia nhìn là **lớp đọc nhanh**, không thay thế mặt. PA-C bị loại vì lý do trụ cột, không phải lý do kỹ thuật. PA-D xuống thành công tắc trợ năng *"tô sáng vùng đang bị nhìn"* — có ích cho người khó phân biệt độ đục, tắt mặc định.

**Đặc tả vẽ:**

```ts
type GazeRayStyle = {
  state: 'GLIMPSED' | 'NOTICED' | 'CONFIRMED'
  widthPt: number        // đầu NPC -> đầu zone, thuôn nhẹ
  alpha: number
  dash: [number, number] | null
  headMark: '?' | 'brow' | '!' | null
  zoneRing: boolean      // vẽ viền quanh zone đích
  headTiltDeg: number    // độ nghiêng đầu sprite, spring lerp
}

const GAZE: Record<string, GazeRayStyle> = {
  UNAWARE:   { widthPt: 0,   alpha: 0.00, dash: null,   headMark: null,   zoneRing: false, headTiltDeg: 0  },
  GLIMPSED:  { widthPt: 2,   alpha: 0.15, dash: [6, 8], headMark: '?',    zoneRing: false, headTiltDeg: 6  },
  NOTICED:   { widthPt: 4,   alpha: 0.38, dash: [10,4], headMark: 'brow', zoneRing: false, headTiltDeg: 11 },
  CONFIRMED: { widthPt: 7,   alpha: 0.70, dash: null,   headMark: '!',    zoneRing: true,  headTiltDeg: 16 },
}
```

**Năm chi tiết quyết định việc đọc được trong 0,5 giây:**

1. **Bậc rời rạc, không nội suy giữa các bậc.** `certainty` liên tục nhưng tia **nhảy** giữa 4 style. Mắt người phân loại 4 hạng nhanh hơn đo một độ dài. Chuyển bậc dùng lerp 120 ms để không giật — nhưng chỉ 120 ms, không phải theo dõi liên tục.
2. **Nét đứt → nét liền là tín hiệu thứ hai, độc lập với độ đục.** Người mù màu / màn hình chói vẫn phân biệt được. `CONFIRMED` là tia **liền, dày, cộng viền zone** — ba tín hiệu chồng lên nhau, không thể bỏ sót.
3. **Độ nghiêng đầu chạy song song.** 0° → 6° → 11° → 16°. Dùng spring/lerp trên node đầu (CANON §16 Đừng-4, kỹ thuật Rain World), **không tốn thêm sprite**. Đây là thứ đọc được kể cả khi người chơi đã tắt tia.
4. **Viền zone chỉ ở `CONFIRMED`.** Nếu vẽ viền từ `NOTICED` thì lúc cao điểm mọi zone đều sáng và tín hiệu chết. Viền = *"cái này họ biết chắc rồi"*.
5. **Dấu trên đầu: `?` → nhíu mày → `!`.** Ba hình **khác nhau về hình dáng**, khớp luật icon CANON §15. Dấu vẽ ở kích thước cố định theo point, **không co theo sprite** → ở mobile nó vẫn to bằng ở PC.

**Kiểm tra 0,5 giây (cách đo, không phải cảm tính):**

```
Dựng 12 ảnh tĩnh: 1–4 khách, các state trộn ngẫu nhiên, hai profile.
Cho 10 người chưa từng chơi xem MỖI ẢNH 0,5 s rồi trả lời 2 câu:
   (1) "Ai đang để ý nhất?"        → ≥8/10 đúng
   (2) "Họ đang nhìn chỗ nào?"      → ≥7/10 đúng
Không đạt thì tăng widthPt của CONFIRMED trước, KHÔNG thêm số lên màn hình.
```

**Liên kết với công cụ hạ attention (CANON §5.4):** khi người chơi đưa trà đá, tia nhìn phải **gãy xuống ly trà rồi mờ đi trong 2–3 s** — chuyển động đó *chính là* phản hồi cho biết công cụ đã ăn. Không cần thông báo, không cần số. Khi cô Ba đứng tiếp khách, tia của **một** khách chuyển sang cô — nhìn thấy được ngay là ai được chuyển.

### 2.6. Vùng chạm 44×44pt và thiết kế cho ngón cái

**Quy tắc cứng:** mọi node có `onTap` phải có `minTouch: { w: 44, h: 44 }`. `resolveLayout` **ép** kích thước này (hàm `growTo`) — vùng chạm được phép **lớn hơn vùng vẽ**. Icon nguyên liệu vẽ 32×32 pt nhưng ăn chạm 48×48 pt, tràn vào `gap`.

```ts
// ui/layout/resolve.ts
function growTo(r: Rect, min: { w: number; h: number }): Rect {
  const w = Math.max(r.w, min.w), h = Math.max(r.h, min.h)
  return { x: r.x - (w - r.w) / 2, y: r.y - (h - r.h) / 2, w, h }   // nở ra từ tâm
}
// Test tự động: duyệt cả 3 profile ở 6 kích thước màn hình,
// assert mọi node có onTap đều >= 44x44 VÀ không chồng lấn vùng chạm của node khác.
```

**Bản đồ ngón cái — portrait, máy 6,1":**

```
   ┌───────────────────────────┐
   │ ▒▒▒▒▒▒▒ KHÓ VỚI ▒▒▒▒▒▒▒▒ │  ← HUD, stage, bark: CHỈ ĐỌC, không có nút
   │ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │
   ├───────────────────────────┤
   │ ░░░░░ VỚI ĐƯỢC ░░░░░░░░░ │  ← board, đơn, lò: chạm được nhưng không gấp
   ├───────────────────────────┤
   │ ███████ THOẢI MÁI ███████ │  ← preset, khay nguyên liệu
   │ ███████████████████████████│
   │ ███ Hoàn tác │ ĐƯA ███████│  ← hai nút quan trọng nhất, thấp nhất
   └───────────────────────────┘
```

**Bốn luật ngón cái:**

1. **Không có nút nào ở 35% trên màn hình portrait.** Stage chỉ để nhìn. Chạm mặt khách là ngoại lệ duy nhất, và nó **không bao giờ là thao tác gấp** (mở sổ tay).
2. **Nút phá huỷ và nút xác nhận không bao giờ cạnh nhau dưới 12 pt.** `Hoàn tác` và `ĐƯA` cách nhau `gap: 16`, kích thước khác nhau rõ rệt, **màu và hình dáng khác nhau**.
3. **Nút `ĐƯA` có xác nhận (CANON §15.5)** → chạm nhầm không gây hậu quả. Đây là lý do nó được phép nằm ở chỗ ngón cái hay quơ trúng nhất.
4. **Không dùng vuốt cạnh màn hình** cho bất kỳ chức năng nào (xung đột với back gesture của OS).

**Trên PC luật này vẫn giữ** — không phải vì chuột mỏi, mà vì **một cây layout**. Nếu PC đặt nút ở đâu tuỳ thích, portrait sẽ phải fork.

### 2.7. Phiên chơi hai độ dài

idea.md §7.1: *"Mobile: một ca bán 3–5 phút phải kết thúc trọn vẹn. PC: chơi liền 30–40 phút vẫn có nhịp."*

**Một ngày = 5 ca. Mỗi ca là một điểm dừng an toàn.**

| Ca | Giờ trong game | Nội dung | Mục tiêu phút thật | Kết ca bằng |
|---|---|---|---|---|
| **1 — Mở hàng** | 5h45 – 6h30 | 2–4 khách. Mở hàng / đốt vía (CANON §14). Chuẩn bị 3 preset | **3–4** | Một dòng cô Ba trước khi cô đi chợ |
| **2 — Cao điểm A** | 6h30 – 7h15 | 8–12 ổ. Chú Tư 6h45. Hàng bắt đầu dài | **4–5** | Hàng vãn tự nhiên xuống 0 người |
| **3 — Cao điểm B** | 7h15 – 8h00 | 8–12 ổ. Đông nhất. Chị Lan, Bé Su | **4–5** | Như trên |
| **4 — Vãn sáng** | 8h00 – 9h30 | 3–5 khách lai rai. Bà Sáu đi ngang. Cơ hội lau dọn | **3** | Đếm tiền lẻ, một khoảng lặng |
| **5 — Chiều** | 15h30 – 17h00 | 3–5 khách. Ông Hải. Tông khác hẳn | **3** | Dọn xe → cảnh tối |

Tổng bán ≈ **17–20 phút thật**, cộng đi chợ (~5) và cảnh tối / sổ tay (~6) → **28–31 phút một ngày trên PC**. Khớp mục tiêu 30–40 phút.

**Điểm dừng an toàn — ba cấp:**

```ts
type StopPoint = 'HARD' | 'SOFT' | 'NONE'

function stopPointNow(): StopPoint {
  if (queue.length === 0 && oven.isEmpty && hands.holding.length === 0) return 'HARD'
  if (queue.length === 0 && !oven.isEmpty) return 'SOFT'
  return 'NONE'
}
```

| Cấp | Điều kiện | Cái gì xảy ra |
|---|---|---|
| `HARD` | Hàng trống, lò trống, tay trống. **Ranh giới giữa hai ca** | Nút **"Kết ca"** hiện ra ở dải đáy. Bấm → tóm tắt 1 màn hình (số ổ, tiền, một câu của ai đó) → thoát sạch. Đây là chỗ mobile được thiết kế để dừng |
| `SOFT` | Hàng trống nhưng lò còn bánh | Thoát được, nhưng có một dòng: *"còn hai ổ trong lò đó"*. Save đầy đủ, quay lại đúng trạng thái đó |
| `NONE` | Đang có khách / đang cầm đồ | **Vẫn thoát được** (không bao giờ khoá người chơi lại). Save trạng thái giữa chừng. Quay lại: khách vẫn đứng đó, kiên nhẫn **đóng băng từ lúc thoát** — không trừng phạt người phải nghe điện thoại |

**Autosave sau mỗi khách** (CANON §2) làm ba cấp trên khả thi mà không cần cơ chế save riêng.

**Nhịp trên PC đến từ đâu, nếu chơi liền 5 ca:** không phải từ độ khó tăng dần, mà từ **đổi hình thái**:

```
  ca 1: chậm, ít khách, nhiều thoại     ← tông "sáng sớm"
  ca 2: nhanh dần, hàng bắt đầu dài
  ca 3: đông nhất, ít thoại, nhiều tay  ← đỉnh
  ca 4: chậm lại, dọn dẹp, gossip       ← đây là chỗ NGHE LỎM (CANON §12 ràng buộc 4)
  ca 5: một mình, tông khác, ông Hải    ← coda
```

Ca 4 là chỗ đặt nghe lỏm **có chủ ý**: nó cho người chơi một việc để làm trong lúc vắng, và nó đòi người chơi **đứng yên nghe** — nghỉ ngơi về mặt thao tác nhưng căng về mặt thông tin.

### 2.8. Icon nguyên liệu — phân biệt bằng HÌNH DÁNG

CANON §15: *"dưa leo / ngò / hành lá đều xanh → phải khác nhau về HÌNH DÁNG, không chỉ màu."*

**Luật kiểm chứng (bắt buộc trước khi chốt art):**
> Render toàn bộ bộ icon ở **24 px**, **khử màu về xám**, in ra. 3 người chưa từng chơi phải phân biệt được **mọi cặp**. Không đạt → sửa hình dáng, không được sửa bằng cách tăng độ tương phản màu.

**Nhóm xanh — nhóm nguy hiểm nhất:**

| Nguyên liệu | Ký hiệu | **Hình dáng** | Silhouette một từ |
|---|---|---|---|
| Đồ chua (cà rốt + củ cải) | `◧` | **Hai sợi bắt chéo hình chữ X**, một sợi đậm (cà rốt) một sợi nhạt (củ cải), đầu cắt vát | **CHÉO** |
| Dưa leo | `◉` | **Lát tròn dày**, vành vỏ đậm bao ngoài, giữa có 3 chấm hạt xếp tam giác | **TRÒN** |
| Hành lá | `≡` | **Ba khúc ống thẳng song song**, cắt vát hai đầu, có lỗ ruột rỗng ở mặt cắt | **QUE THẲNG** |
| Ngò rí | `✿` | **Chùm lá răng cưa toả ra hình quạt** từ một cuống chung, mép lá lượn | **CHÙM TOẢ** |
| Ớt | `◗` | **Giọt cong hình lưỡi liềm**, có cuống nhỏ nhọn ở đầu to | **LƯỠI LIỀM** |

Bốn thứ xanh: **chéo / tròn / que thẳng / chùm toả** — bốn hình học không nhầm được, kể cả ở 16 px xám.

**Nhóm nhân:**

| Nguyên liệu | Ký hiệu | Hình dáng | Silhouette |
|---|---|---|---|
| Pate | `▤` | Khối vuông bo góc, mặt có **vệt dao ngang** | KHỐI VUÔNG |
| Thịt nguội | `⬭` | Lát bầu dục mỏng, viền có **chấm mỡ** rải rác | BẦU DỤC |
| Heo quay | `▦` | Khối chữ nhật, mặt trên **gạch chéo ô vuông** (bì giòn) | KHỐI KẺ Ô |
| Xíu mại | `⬤` | **Viên tròn nổi khối**, nằm trong một vũng sốt bầu dục | VIÊN + VŨNG |
| Chả lụa | `⬡` | Lát tròn **dày**, mặt phẳng mịn, viền lá chuối mỏng | TRÒN DÀY |
| Cá | `⬦` | **Hình thoi** (khúc fillet), có 2 vạch xương chéo | HÌNH THOI |
| Gà | `〰` | **Bó sợi xé** 4–5 dải lượn song song | SỢI |
| Ốp la | `◍` | Tròn trắng, **tâm vàng lệch khỏi giữa** | TRÒN LỆCH TÂM |

**Nhóm nước & gia vị:**

| Nguyên liệu | Ký hiệu | Hình dáng | Silhouette |
|---|---|---|---|
| Nước sốt | `⬯` | Chai bóp **mũi nhọn**, thân phình, đang nghiêng | CHAI NHỌN |
| Xì dầu | `⬰` | Chai **cổ thẳng có vòi rót nhỏ**, thân vuông | CHAI VUÔNG |
| Muối tiêu | `⣿` | **Hũ tròn thấp, nắp có 5 lỗ chấm** | HŨ CHẤM |

**Nhóm trạng thái tay** (cũng phải khác nhau về hình dáng):

| State | Hình dáng |
|---|---|
| `CLEAN` | Bàn tay viền liền, trong rỗng |
| `MONEY` | Bàn tay + **một tờ giấy chữ nhật gác chéo** ngang lòng bàn tay |
| `GREASE` | Bàn tay + **3 giọt tròn** ở đầu ngón |
| `RAW` | Bàn tay + **vệt gợn sóng** phủ lòng bàn tay |

**Chữ và font:**

```css
/* ui/theme/type.css */
--font-ui: "Be Vietnam Pro", "Inter", system-ui, sans-serif;   /* sans, đủ dấu tiếng Việt */
--lh-tight: 1.45;      /* mức chật NHẤT được phép — dưới mức này dấu ề/ộ/ỡ/ữ bị cắt */
--lh-body:  1.65;
--lh-bark:  1.70;      /* bark hay có dấu chồng dấu + chữ nghiêng */
--tracking: 0.01em;
```

- **Không viết hoa toàn bộ** ở bất kỳ đâu, kể cả nút (CANON §15). Nút là `ĐƯA` — một từ, in hoa **một chữ cái đầu là đủ**; nếu cần nhấn thì dùng đậm, không dùng uppercase. *(Ngoại lệ duy nhất: chữ trên bảng hiệu trong thế giới — đó là art, không phải UI.)*
- **4 mức cỡ chữ** (100 / 125 / 150 / 200%), preview ngay trong menu, **hộp thoại tự giãn** ở 200% (CANON §15.1). Ở 200% portrait, bark bubble được phép **chiếm tối đa 40% chiều cao stage** rồi mới cuộn.
- **Nền hộp thoại đục** — không phải nền mờ. `opacity` của nền bark là 1.0, không phải 0.85.
- **Tuỳ chọn "hiện chữ dưới icon"** — mặc định **bật ở 3 ngày đầu**, sau đó game hỏi một lần *"tắt chữ dưới icon cho gọn nha?"*. Không tự tắt.

### 2.9. Bark bubble

```ts
type Bark = {
  npcId: string
  text: string
  tier: 1 | 2 | 3            // Splinter Cell Blacklist, CANON §11
  salience: number
  bornAt: number
  lifeMs: number
}
```

| Thuộc tính | Giá trị | Lý do |
|---|---|---|
| **Vị trí** | Neo trên đầu NPC, đuôi bubble chỉ xuống **vai** (không chỉ vào mặt — che mặt là mất T3) | Mặt phải luôn thấy được |
| **Chống tràn mép** | Bubble bị đẩy vào trong `stage` nếu chạm mép; **đuôi kéo dài** thay vì bubble dịch theo | Ở portrait hẹp, chuyện này xảy ra liên tục |
| **Thời gian sống** | `clamp(1600 + 45 * charCount, 1600, 4500)` ms | Câu dài đọc lâu hơn. Trần 4,5 s để không đọng |
| **Fade** | Vào 120 ms, ra 260 ms | Ra chậm hơn vào — êm hơn |
| **Text không tự chạy tiếp** | Bubble **hội thoại** (không phải bark) đợi chạm (CANON §15.1). Bark thì tự tắt — bark là tiếng động môi trường, không phải hội thoại | Phân biệt rõ hai loại |
| **Tối đa hiện cùng lúc** | **2** trên PC, **1** trên portrait | Quá 2 là không đọc kịp |
| **Vượt quá** | Vào hàng đợi, phát sau. Hàng đợi **hết hạn sau 2,5 s** — bark cũ không bao giờ phát muộn | Bark muộn tệ hơn bark mất |
| **Ưu tiên khi tranh chỗ** | `salience` giảm dần → tier tăng dần → ai đến trước | |
| **Chống twinning** | Mỗi bark bị trễ **0,2–0,4 s ngẫu nhiên** (CANON §11). **Không bao giờ hai NPC phát cùng một frame** — cưỡng chế ở tầng lập lịch, không phải ở dữ liệu | |
| **35% im lặng** | 35% số lần "nhận thấy" **không sinh bark**, chỉ đổi nét mặt + tia nhìn (CANON §11) | Im lặng làm phần còn lại đáng tin |
| **Cooldown tier-1** | 20 s / NPC. Hết cooldown thì tụt xuống tier-2, rồi tier-3 (*"Hửm."*) | |

**Luật `take(1)` hiện lên màn hình như thế nào** (CANON §6):

```ts
// Lúc đưa bánh, dù có 4 defect, CHỈ MỘT được nói ra.
const spoken = defects.sortBySalience().take(1)
const silent = defects.slice(1)       // vẫn ảnh hưởng tip, KHÔNG có UI nào cho chúng

// UI TUYỆT ĐỐI KHÔNG ĐƯỢC LÀM:
//   ✗ hiện danh sách "3 lỗi khác"
//   ✗ hiện dấu chấm than nhỏ cho các lỗi im lặng
//   ✗ tổng kết cuối ngày liệt kê đủ lỗi
// Người chơi chỉ được biết đúng những gì NPC nói ra. Đó là toàn bộ điểm của luật này.
```

**Bark của khách đang xếp hàng (`QUEUE_2`, `QUEUE_3`):** hiện nhỏ hơn 15%, alpha 0,85, và **đứng sau** bark của `FRONT_CENTER` trong thứ tự ưu tiên bất kể salience. Người đứng trước mặt luôn được nghe trước — đúng như ngoài đời.

**Ở portrait khi stage chỉ 30%:** nếu có >1 bark, bark thứ hai **không** xếp chồng mà **dock xuống dải mỏng ngay dưới stage** dưới dạng một dòng có tên: `bà Bảy: "ủa..."`. Vẫn là 1 bubble, nhưng không mất thông tin.

### 2.10. HUD tối thiểu — danh sách ĐƯỢC và CẤM

**T3 là ràng buộc trực tiếp lên doc này.** Danh sách dưới đây là quy ước code review: thêm bất cứ thứ gì vào cột trái cần một mục ở §9.

#### ✅ ĐƯỢC hiện

| Thứ | Ở đâu | Ghi chú |
|---|---|---|
| Giờ trong ngày | `hud.top` | Dạng `6h47`, kiểu Việt |
| Số ổ bánh còn | `hud.top` | Sự thật vật lý, đếm được |
| Số người đang chờ + **thứ tự** | `hud.top` + stage | Thứ tự là thông tin công bằng (`MADE_THEM_WAIT` phạt sai thứ tự) |
| Đơn hiện tại — **nguyên văn lời khách nói** | `order.card` | *"như mọi bữa · không hành"*. **Không** phải checklist có tick |
| Tên khách — **chỉ nếu đã ghi sổ tay** | Dưới sprite | Chưa ghi thì hiện `—`. Đây là cách `WRONG_NAME` có răng |
| Nội dung sổ tay của khách | dock | Là chữ **người chơi tự ghi**, không phải dữ liệu hệ thống |
| Trạng thái lò: slot, vòng tiến trình, khắc vạch | Trên cửa lò | P1-01 §2.4 |
| Trạng thái **hai tay** riêng biệt | Cạnh lò | P1-01 §2.8 |
| `grip` của vật đang cầm — **3 bậc rời rạc** | Quanh vật | T5 bắt buộc |
| Dải "đã bỏ" | Dưới ổ bánh | Bắt buộc, không ẩn được |
| 3 nút preset + tên + 3 chấm prep còn lại | `presets` | |
| Tồn kho từng nguyên liệu | Trên khay | Số nhỏ |
| Tiền mặt & tiền lẻ | `hud.top` (PC) / tấm dọn ca (mobile) | Sự thật vật lý |
| Tia nhìn + dấu đầu + nghiêng đầu | Stage | §2.5 |
| Nút Hoàn tác, nút Đưa, nút Pause | Dải đáy | §15.5 |

#### ❌ CẤM hiện — vi phạm là sai thiết kế, không phải tranh luận

| Thứ | Vì sao cấm |
|---|---|
| **Thanh/điểm quan hệ, tình cảm, trust** | T3 trực tiếp |
| **`+3 trust`, `-5 mood`, mọi số nổi lên khi làm gì đó** | T3 |
| **Màu tên theo mức thân** (xanh = thân, đỏ = ghét) | T3 nêu đích danh |
| **% hài lòng / `satisfaction`** | T3 + phá luôn hệ khẩu vị ẩn (P1-01 §2.6) |
| **Số `certainty` hoặc thanh certainty** | §2.5 PA-C đã loại |
| **Thanh kiên nhẫn của khách** | Biến việc đọc người thành đọc đồng hồ. Thay bằng: dáng đứng, đổi chân, nhìn đồng hồ tay, thở dài |
| **Tick xanh / X đỏ khi bỏ đúng/sai nguyên liệu** | Phá T1 và T2: món ăn **là** lựa chọn, không phải câu đố có đáp án |
| **Danh sách các lỗi khách không nói ra** | Phá luật `take(1)` (CANON §6) |
| **Điểm số / sao cuối ngày** | Nguyên tắc kết game: *"mọi ending đều tử tế, chỉ khác ai còn ở đó"* |
| **Mũi tên/highlight chỉ "làm bước tiếp theo ở đây"** sau 3 ngày đầu | Dạy xong thì thôi. Onboarding được phép, HUD vĩnh viễn thì không |
| **Đồng hồ đếm ngược trên đầu khách** | Như thanh kiên nhẫn |
| **Combo / streak counter** | Kéo game về phía arcade, kéo `FLOURISH` về phía tiền |
| **Thông báo "khách X đã nghe đồn Y"** | Đồn thổi phải **nghe lỏm được** (CANON §12 ràng buộc 4), không được thông báo |

**Hai công tắc trợ năng được phép mở ngoại lệ có kiểm soát** (mặc định **tắt**, ghi rõ trong menu là hỗ trợ):

1. **"Hiện đồng hồ chờ"** — số giây mỗi khách đã đứng đợi. Đây là một **sự thật đo được**, không phải một phán xét. Người chơi không đọc được ngôn ngữ cơ thể (hoặc đã tắt chuyển động) cần nó để công bằng.
2. **"Tô sáng vùng đang bị nhìn"** — PA-D ở §2.5, cho người khó phân biệt độ đục.

Không có công tắc nào mở ra chỉ số quan hệ. Không bao giờ.

### 2.11. Phím tắt PC và cử chỉ mobile tương đương

**Nguyên tắc:** cả hai bảng ánh xạ vào **cùng một `ActionIntent`** (P1-01 §2.5). Prototype đang dùng `WASD + E + Q + 1-5` để **đi lại tự do** — bỏ hẳn (idea.md §7.1): game phục vụ quầy hàng gần như không cần đi lại. Thay bằng **tap-to-interact**.

| Hành động | Phím PC | Cử chỉ mobile | Ghi chú |
|---|---|---|---|
| Chọn nguyên liệu 1–9 | `1`…`9` | Chạm icon trong khay | Số in nhỏ trên icon ở PC |
| Đặt nguyên liệu đang chọn lên ổ | `Space` | Chạm ổ bánh | Đây là tap-to-place |
| Kéo-thả nguyên liệu | Giữ chuột trái + kéo | Kéo bằng ngón | **Cùng intent**, chỉ thêm `path` cho `FLOURISH` |
| Lấy ổ bánh mới | `Q` | Chạm rổ bánh | |
| Rạch | `R` | Vuốt dọc thân ổ | Vuốt sinh `path` → cơ hội `SCORE_ONE_STROKE` |
| Đưa vào lò / lấy ra lò | `F` | Chạm slot lò | Chạm slot trống = đưa vào; chạm slot có bánh = lấy ra |
| Gói | `G` | Chạm ổ đã xong **3 lần** theo nhịp | 3 nhịp gập–cuốn–xoắn, cơ hội `WRAP_FAST` |
| Áp preset 1/2/3 | `Z` `X` `C` | Chạm nút `P1`/`P2`/`P3` | |
| Mở bảng tuỳ biến preset | `Shift` + `Z/X/C` | Long-press nút preset (350 ms) | |
| **Hoàn tác** | `Ctrl+Z` **và** `Backspace` | Chạm nút `↶` **hoặc** vuốt trái 2 ngón | Hai đường vào ở cả hai thiết bị — nút này phải rất dễ với tới |
| **Xác nhận đưa bánh** | `Enter` | Chạm nút `✓ ĐƯA` | Không có phím nào khác làm việc này |
| Rửa tay | `W` | Chạm bồn rửa | |
| Nhận / thối tiền | `E` | Chạm tay khách đang chìa | |
| Đưa ly trà đá | `T` | Chạm ly trà trên quầy | Công cụ hạ attention (CANON §5.4) |
| Lau thớt | `V` | Long-press thớt | |
| Vứt đồ đã rớt | `Del` | Chạm thùng rác | Sau `DROPPED_FOOD` đây là **thao tác hợp lệ duy nhất** |
| Xem sổ tay khách | `Tab` (chu kỳ) | Chạm mặt khách | |
| Ghim / bỏ ghim khách đang xem | `Tab` giữ 0,4 s | Chạm mặt lần thứ hai | |
| Để tay yên (chặn idle gãi đầu) | `Shift` giữ | Hai ngón chạm giữ vùng board | Chống `DIRTY_HANDS` do idle (P1-01 §2.8) |
| **Pause** | `Esc` **và** `P` | Chạm `⏸` | Pause được **giữa lúc đang kéo** (CANON §15.2) |
| Cỡ chữ +/− | `Ctrl` `+` / `−` | Trong menu | |
| Kết ca (khi `HARD`) | `Enter` ở màn kết ca | Chạm "Kết ca" | §2.7 |

**Ba luật của bảng phím:**

1. **Không có phím nào không có cử chỉ tương đương, và ngược lại.** Bảng này là một ánh xạ song ánh — test tự động kiểm.
2. **Mọi phím đổi được.** Bao gồm cả `Esc`. Có preset "một tay trái" và "một tay phải".
3. **Không có tổ hợp nào cần 3 phím.** `Shift`+phím là trần.

---

## 3. Dữ liệu & schema

```ts
// ui/layout/nodes.ts — TẬP NODE DUY NHẤT, dùng chung cả 3 profile
type NodeId =
  | 'hud.top' | 'stage' | 'order.card' | 'notebook'
  | 'oven' | 'hands.status' | 'board' | 'assembled.strip'
  | 'presets' | 'tray' | 'actionbar' | 'toast'
```

**`ui/layout/profiles.json` (trích — cho thấy chỉ có DATA khác nhau):**

```json
{
  "PC_LANDSCAPE": {
    "hud.top":  { "parent": "ROOT",  "anchor": {"x":0,"y":0,"ax":0,"ay":0},
                  "size": {"w":{"pct":100},"h":{"pct":8}},  "flow":"row", "order":0, "visible":true },
    "stage":    { "parent": "ROOT",  "anchor": {"x":0,"y":0.08,"ax":0,"ay":0},
                  "size": {"w":{"pct":100},"h":{"pct":46}}, "flow":"free", "order":1, "visible":true },
    "oven":     { "parent": "ROOT",  "anchor": {"x":0,"y":0.54,"ax":0,"ay":0},
                  "size": {"w":{"pct":20},"h":{"pct":32}},  "flow":"column", "order":2, "visible":true },
    "board":    { "parent": "ROOT",  "anchor": {"x":0.20,"y":0.54,"ax":0,"ay":0},
                  "size": {"w":{"pct":55},"h":{"pct":32}},  "flow":"free", "order":3, "visible":true },
    "order.card":{"parent": "ROOT",  "anchor": {"x":0.75,"y":0.54,"ax":0,"ay":0},
                  "size": {"w":{"pct":25},"h":{"pct":14}},  "flow":"column", "order":4, "visible":true },
    "notebook": { "parent": "ROOT",  "anchor": {"x":0.75,"y":0.68,"ax":0,"ay":0},
                  "size": {"w":{"pct":25},"h":{"pct":18}},  "flow":"column", "order":5, "visible":true },
    "tray":     { "parent": "ROOT",  "anchor": {"x":0,"y":0.86,"ax":0,"ay":0},
                  "size": {"w":{"pct":70},"h":{"pct":14}},  "flow":"row",
                  "minTouch": {"w":48,"h":48}, "gap":10, "order":6, "visible":true },
    "actionbar":{ "parent": "ROOT",  "anchor": {"x":0.70,"y":0.86,"ax":0,"ay":0},
                  "size": {"w":{"pct":30},"h":{"pct":14}},  "flow":"row",
                  "minTouch": {"w":72,"h":48}, "gap":16, "order":7, "visible":true }
  },

  "MOBILE_PORTRAIT": {
    "hud.top":  { "parent":"ROOT","anchor":{"x":0,"y":0,"ax":0,"ay":0},
                  "size":{"w":{"pct":100},"h":{"pct":7}},"flow":"row","order":0,"visible":true,"safeArea":true },
    "stage":    { "parent":"ROOT","anchor":{"x":0,"y":0.07,"ax":0,"ay":0},
                  "size":{"w":{"pct":100},"h":{"pct":30}},"flow":"free","order":1,"visible":true },
    "order.card":{"parent":"ROOT","anchor":{"x":0,"y":0.37,"ax":0,"ay":0},
                  "size":{"w":{"pct":100},"h":{"pct":6}},"flow":"row","order":2,"visible":true },
    "oven":     { "parent":"ROOT","anchor":{"x":0,"y":0.43,"ax":0,"ay":0},
                  "size":{"w":{"pct":100},"h":{"pct":7}},"flow":"row","order":3,"visible":true },
    "board":    { "parent":"ROOT","anchor":{"x":0,"y":0.50,"ax":0,"ay":0},
                  "size":{"w":{"pct":100},"h":{"pct":20}},"flow":"free","order":4,"visible":true },
    "presets":  { "parent":"ROOT","anchor":{"x":0,"y":0.70,"ax":0,"ay":0},
                  "size":{"w":{"pct":100},"h":{"pct":9}},"flow":"row",
                  "minTouch":{"w":88,"h":48},"gap":8,"order":5,"visible":true },
    "tray":     { "parent":"ROOT","anchor":{"x":0,"y":0.79,"ax":0,"ay":0},
                  "size":{"w":{"pct":100},"h":{"pct":15}},"flow":"grid",
                  "minTouch":{"w":48,"h":48},"gap":10,"order":6,"visible":true },
    "actionbar":{ "parent":"ROOT","anchor":{"x":0,"y":0.94,"ax":0,"ay":0},
                  "size":{"w":{"pct":100},"h":{"pct":6}},"flow":"row",
                  "minTouch":{"w":120,"h":48},"gap":16,"order":7,"visible":true,"safeArea":true },
    "notebook": { "parent":"ROOT","anchor":{"x":0,"y":0.25,"ax":0,"ay":0},
                  "size":{"w":{"pct":100},"h":{"pct":70}},"flow":"column","order":8,"visible":false }
  }
}
```

> Lưu ý `notebook` **tồn tại ở cả hai profile**, chỉ khác `visible`. Không có node nào chỉ có ở một bên — đó là cách đảm bảo không fork.

**`ui/theme/icons.json` (trích — đặc tả hình dáng, đầu vào cho hoạ sĩ):**

```json
{
  "do_chua":  { "shape": "CROSS_STRIPS", "strokes": 2, "colorA": "#D98A3C", "colorB": "#EFE6D2",
                "grayTest": "pass", "label": "đồ chua" },
  "dua_leo":  { "shape": "DISC_SEEDED",  "seeds": 3,   "rim": "#3D6B3A", "fill": "#C9E4B8",
                "grayTest": "pass", "label": "dưa leo" },
  "hanh_la":  { "shape": "TUBES_PARALLEL","count": 3,  "cut": "bevel",   "fill": "#57A44A",
                "grayTest": "pass", "label": "hành lá" },
  "ngo_ri":   { "shape": "FAN_SERRATED", "leaves": 5,  "fill": "#6FBF5B",
                "grayTest": "pass", "label": "ngò rí" },
  "ot":       { "shape": "CRESCENT_STEM","fill": "#C4342A",
                "grayTest": "pass", "label": "ớt" }
}
```

**`ui/theme/gaze.json`:** bảng `GAZE` ở §2.5, xuất nguyên dạng.

---

## 4. UI/UX hai thiết bị

*(Toàn bộ doc này **là** mục đó. Không lặp lại. Xem §2.1–2.11.)*

Hai điểm tổng kết không nằm gọn trong mục nào ở trên:

1. **Bảng màu.** Sài Gòn buổi sáng = **xanh xám + nắng gắt trắng** (CANON §14) — **không** vàng nghệ. UI đi theo: nền HUD xám đá `#2B2F31` ở `opacity` 1.0, chữ trắng ngà `#F2EFE9`, điểm nhấn duy nhất là **đỏ bảng hiệu** `#C4342A` dùng **chỉ cho** nút `ĐƯA` và viền zone `CONFIRMED`. Tia nhìn dùng trắng xanh `#CFD8DA`, không dùng vàng/đỏ (tránh đọc nhầm thành "cảnh báo").
2. **Giảm chuyển động** (CANON §15.3). Công tắc tắt: xe máy chạy qua, đám đông nền, lá bay, rung màn hình, chuyển cảnh trượt. **Không được tắt:** tia nhìn, nghiêng đầu, đổi nét mặt, vòng `grip` — đó là thông tin, không phải trang trí. Khi bật chế độ giảm chuyển động, chuyển bậc tia nhìn từ lerp 120 ms thành **cắt thẳng**, và độ nghiêng đầu giảm biên độ một nửa nhưng **vẫn còn**.

---

## 5. Tham số cần tune

| Tên | Khởi điểm | Khoảng | Cách đo |
|---|---|---|---|
| `stage` % chiều cao (portrait) | 30% | 26–38% | Mặt NPC ≥ 40 px ở máy 6,1"; tia nhìn dài ≥ 60 px |
| `GAZE.CONFIRMED.widthPt` | 7 | 5–11 | Bài test 0,5 s (§2.5) đạt ≥8/10 |
| `GAZE.CONFIRMED.alpha` | 0,70 | 0,55–0,85 | Không được đè mất mặt NPC |
| `GAZE.GLIMPSED.alpha` | 0,15 | 0,08–0,25 | Phải **thấy được** nhưng **không gây lo** |
| `headTiltDeg` bậc cao nhất | 16° | 10–22° | Trên 22° thành hoạt hình |
| Lerp chuyển bậc tia | 120 ms | 80–200 ms | Không giật, không "trôi" |
| `bark.lifeMs` hệ số/ký tự | 45 ms | 35–60 ms | Người đọc chậm nhất đọc kịp ở cỡ chữ 100% |
| `bark.lifeMs` trần | 4500 ms | 3500–6000 | |
| Bark tối đa cùng lúc (PC) | 2 | 1–3 | |
| Bark queue hết hạn | 2500 ms | 1500–4000 | |
| Twinning delay | 0,2–0,4 s | cố định theo CANON §11 | Không tune, chỉ kiểm |
| Tỉ lệ "nhận thấy" im lặng | 35% | cố định theo CANON §11 | Không tune, chỉ kiểm |
| Cooldown bark tier-1 / NPC | 20 s | 12–35 s | |
| `minTouch` | 44×44 pt | **sàn cứng**, chỉ được tăng | Test tự động ở 6 kích thước màn hình |
| `minTouch` khay nguyên liệu | 48×48 pt | 44–56 | Tỉ lệ chạm nhầm < 3% qua 200 lượt |
| `gap` giữa `Hoàn tác` và `ĐƯA` | 16 pt | 12–24 | Chạm nhầm < 1% |
| Long-press mở chi tiết | 350 ms | 280–500 | Không xung đột với bắt đầu kéo |
| Độ dài ca mobile (ca 2/3) | 4–5 phút | 3–6 | Đo thật 20 phiên; ≥80% phiên kết ở `HARD` |
| Số ca / ngày | 5 | 4–6 | Tổng 28–31 phút PC |
| Ngưỡng `HARD` stop | hàng 0 + lò rỗng + tay rỗng | — | Phải xuất hiện ≥1 lần giữa mỗi cặp ca |
| Cỡ chữ mức 4 | 200% | cố định theo CANON §15.1 | Hộp tự giãn, không tràn, không cắt dấu |
| `--lh-tight` | 1,45 | ≥1,40 | Chụp màn hình các chữ `ề ộ ỡ ữ ẫ ặ` — không cắt một pixel nào |
| Alpha nền hộp thoại | **1,0** | cố định | CANON §15.1 nói "nền ĐỤC" |
| Ngày tự hỏi tắt chữ dưới icon | ngày 4 | 3–7 | |

---

## 6. Tiêu chí đạt

**Kiến trúc**
- [ ] Grep toàn repo: không có `isMobile` / `isPortrait` / `window.innerWidth` ngoài `ui/layout/` và `ui/input/`. Lint rule bật, CI chặn.
- [ ] `LAYOUTS` có **cùng tập `NodeId`** ở cả 3 profile (test so sánh khoá).
- [ ] Xoay máy **giữa lúc đang kéo nguyên liệu**: nguyên liệu vẫn nằm trong tay, `LoafState` và mọi `certainty` không đổi.
- [ ] Đổi cỡ chữ 100%→200% không làm node nào tràn ra ngoài `safeArea` ở cả 3 profile.

**Không hover**
- [ ] Chạy toàn bộ một ngày với `pointerover` bị vô hiệu hoá ở tầng input → **không mất một thông tin nào cần để chơi**. Đây là test chấp nhận của mục §2.4.
- [ ] 14 mục ở bảng §2.4 đều có đường thay và đường đó hoạt động trên **cả PC lẫn mobile**.

**Vùng chạm**
- [ ] Test tự động: mọi node có `onTap`, ở 3 profile × 6 kích thước màn hình, đều ≥44×44 pt **và** vùng chạm không chồng lấn nhau.
- [ ] Portrait: **không có node có `onTap`** nào nằm trong 35% trên màn hình, trừ `stage` (chạm mặt khách).

**Attention — quan trọng nhất**
- [ ] Bài test 0,5 s (§2.5): ≥8/10 trả lời đúng "ai để ý nhất", ≥7/10 đúng "họ nhìn chỗ nào", ở **cả hai** profile.
- [ ] 10 tester lạ chơi 20 phút: **≥7/10 trả lời đúng "vì sao khách đó giận"** — đây là cổng của cả phase P1 (CANON §17).
- [ ] Người chơi chỉ nhìn ảnh tĩnh phân biệt được 4 state mà **không cần màu** (in xám).
- [ ] Đưa trà đá → tia nhìn gãy xuống ly rồi mờ, nhìn thấy rõ trong ≤0,5 s.

**Bark**
- [ ] Không bao giờ có hai bark khởi phát trong cùng một frame (assert ở tầng lập lịch).
- [ ] Không bao giờ quá 2 bubble (PC) / 1 bubble (portrait) hiện cùng lúc.
- [ ] Khi có 4 defect, đúng **1** được nói ra; không có bất kỳ phần tử UI nào cho 3 cái còn lại (kiểm bằng snapshot cây UI).
- [ ] Bubble không bao giờ che mặt NPC đang nói.

**Icon & chữ**
- [ ] Bài test xám 24 px: 3 người phân biệt được **mọi cặp** trong bộ icon, đặc biệt `dưa leo / ngò rí / hành lá / đồ chua`.
- [ ] Không có chuỗi UI nào viết hoa toàn bộ (grep + lint trên file `lines/`).
- [ ] Chụp màn hình `ề ộ ỡ ữ ẫ ặ` ở cả 4 cỡ chữ, cả 3 profile: không dấu nào bị cắt.

**HUD**
- [ ] Danh sách CẤM ở §2.10 được viết thành test: snapshot cây UI không chứa node nào khớp `*trust*`, `*relationship*`, `*satisfaction*`, `*patience*`, `*streak*`, `*certainty*` (trừ trong `debug/`).
- [ ] Build release **không** kèm overlay debug.

**Phiên chơi**
- [ ] 20 phiên mobile mô phỏng: ≥80% kết thúc ở điểm `HARD` trong 3–6 phút.
- [ ] Thoát ở `NONE` rồi vào lại: khách vẫn đứng đó, kiên nhẫn đúng bằng lúc thoát.
- [ ] Một ngày PC liền mạch đo được 28–31 phút.

**Phím & cử chỉ**
- [ ] Test song ánh: mọi hàng trong bảng §2.11 có đủ cả hai cột.
- [ ] Chơi trọn một ngày **chỉ bằng chạm** (không bàn phím) — đạt cả 3 `FlourishId`.
- [ ] Chơi trọn một ngày **chỉ bằng bàn phím** (không chuột) — đạt cả 3 `FlourishId`.
- [ ] Đổi được mọi phím, kể cả `Esc`.

---

## 7. Rủi ro & cách bịt

| # | Rủi ro | Cách bịt |
|---|---|---|
| R1 | **Tia nhìn trượt thành HUD game-y**, phá tông cozy và phá T3 | Art là vệt mờ có hạt, tông xanh xám của bảng màu (CANON §14), **không** laser, **không** vàng/đỏ. Cộng: tia chỉ xuất hiện từ `GLIMPSED`; ở `UNAWARE` màn hình sạch hoàn toàn. Nếu playtest vẫn thấy game-y → giảm `alpha`, **không** thay bằng con số |
| R2 | **Người chơi ngừng nhìn mặt** vì đã có tia | PA-A giữ nguyên làm nền và là thứ duy nhất vào trailer. Cộng: `CONFIRMED` có **`!` trên đầu + nhíu mày**, tức phần thông tin đắt nhất vẫn nằm ở mặt. Đo: hỏi tester mô tả nét mặt bà Bảy — nếu không ai nhớ, tia đang lấn |
| R3 | **Layout data thành thứ khó sửa hơn cả code** | 3 file JSON, ~12 node, không có kế thừa, không có biểu thức. Nếu có ai muốn thêm biểu thức vào JSON → dừng lại, đó là dấu hiệu nên tách node |
| R4 | **Mobile là v2 (CANON §2) nên portrait không được test** → ràng buộc mục ruỗng dần | Chạy **CI portrait** từ P1 dù không ship: mọi test ở §6 chạy cả 3 profile. Rẻ vì layout là data. Đây là lý do doc này tồn tại ở P1 chứ không ở P5 |
| R5 | **Bark chồng nhau lúc cao điểm** đúng lúc cần đọc nhất | Trần 2/1 + hàng đợi hết hạn 2,5 s + ưu tiên `FRONT_CENTER` + 35% im lặng + tier-3 (*"Hửm."*) làm lưới an toàn (CANON §11) |
| R6 | **Luật `take(1)` bị phá bởi UI thiện chí** ("cho người chơi biết còn lỗi gì nữa") | Ghi thành test snapshot ở §6. Bất kỳ PR nào thêm UI cho defect im lặng đều fail CI. Lý do: nhiều lỗi cùng lúc làm game **dễ hơn** (Lucas Pope, CANON §6) |
| R0.5 | **Chỉ số quan hệ lén vào qua đường trợ năng** ("cho người mù màu thấy mức thân") | Hai công tắc ngoại lệ ở §2.10 là **danh sách đóng**. Thêm công tắc thứ ba cần một mục ở §9 |
| R8 | **44×44 pt bị ép nhỏ trên màn hình bé** | `growTo` nở vùng chạm từ tâm, tràn vào `gap`. Nếu vẫn không đủ → **giảm số icon hiện cùng lúc** (phân trang khay), không bao giờ giảm vùng chạm |
| R9 | **Ca mobile không kết trọn** vì hàng không bao giờ rỗng | Lịch NPC (P2) phải **thiết kế ra khoảng lặng**, không để lịch ngẫu nhiên quyết định. `stopPointNow()` phải trả `HARD` ít nhất một lần giữa mỗi cặp ca — đây là ràng buộc lên P2, ghi vào §8 |
| R10 | **Chữ tiếng Việt bị cắt dấu** ở cỡ 200% hoặc font fallback | `--lh-tight: 1.45` là sàn. Font nhúng, không dựa vào font hệ thống. Test chụp màn hình ở §6 |
| R11 | **Icon vẫn nhầm** dù đã khác hình dáng | Bài test xám 24 px là **cổng chặn trước khi chốt art**, không phải kiểm tra sau. Cộng tuỳ chọn hiện chữ, mặc định bật 3 ngày đầu |
| R12 | **Giảm chuyển động vô tình tắt luôn thông tin** | Danh sách "không được tắt" ở §4. Chuyển bậc tia thành cắt thẳng thay vì tắt hẳn |
| R13 | **Phím tắt thành lợi thế cạnh tranh của PC** → hai thiết bị lệch cân bằng | Bảng §2.11 là song ánh, có test. Mọi thứ phím làm được thì chạm làm được trong **cùng số thao tác**. `FLOURISH` có hai đường đạt (P1-01 §2.9) |
| R14 | **Vuốt cạnh màn hình xung đột back gesture** | Cấm hoàn toàn cử chỉ vuốt từ mép. Vuốt trái 2 ngón (hoàn tác) bắt đầu **ở giữa** màn hình |

**Nối §8 (ăn gian):** mục (f) *"datamine + spreadsheet — không bịt"*. Doc này là lý do bịt không cần thiết: **không có con số nào trên màn hình để lập bảng tính**. Người datamine sẽ tìm thấy `satisfaction` trong code nhưng **không thấy nó trong lúc chơi**, nên phần hay của game không nằm ở EV.

**Nối §16 (Đừng làm):** Đừng-2 — *"player perception should win over simulation accuracy"*. Tia nhìn 4 bậc rời rạc là hiện thân trực tiếp: nó **không** vẽ chính xác `certainty`, nó vẽ cái người chơi cần đọc.

---

## 8. Truy vết

| Nội dung | `idea.md` | `CANON.md` |
|---|---|---|
| Bố cục mobile dọc / PC ngang, "cùng một scene Phaser, đổi layout theo orientation, không fork code" | **§12.3** (dòng 520–535) | §2 |
| Không có hover · 44×44 pt · thiết kế cho ngón cái · phiên chơi 2 độ dài · không dựa bàn phím · tiết kiệm pin | **§7.1** (dòng 208–220) | §2 |
| Attention phải nhìn thấy được, certainty tích luỹ, 4 state + biểu hiện bắt buộc | §21 | **T5, §5** |
| Bảng `visibility`, zone `HANDS`/`BOARD`/`OVEN`/`UNDER_COUNTER` | — | §5 |
| Công cụ chủ động hạ attention (trà đá, hỏi một câu, che tầm nhìn, đổi chỗ đứng, cô Ba) | §21 | §5.4 |
| Luật `take(1)`, hai câu thoại ANTICIPATED/DISCOVERED | — | **§6** |
| Bark 3 tầng, shuffle-bag, 35% im lặng, twinning 0,2–0,4 s | — | **§11** |
| Nghe lỏm bắt buộc (đặt ở ca 4) | §21 | §12 ràng buộc 4 |
| Không hiện chỉ số quan hệ | — | **T3** |
| Cỡ chữ 4 mức, nền hộp thoại đục, text không tự chạy | **§20 mục 1** (dòng 998) | §15.1 |
| Pause mọi lúc, chế độ không giới hạn thời gian | §20 mục 2 | §15.2 |
| Giảm chuyển động | §20 mục 3 | §15.3 |
| Âm thanh 5 kênh, tắt âm báo tiêu cực | §20 mục 4 | §15.4 |
| Chạm-để-đặt + Hoàn tác + xác nhận trước khi đưa | **§20 mục 5** (dòng 1010) | §15.5 |
| Icon khác nhau về hình dáng, tuỳ chọn chữ dưới icon, font sans line-height rộng, không viết hoa toàn bộ | **§20** (dòng 1012) | §15 |
| 6 công tắc bắt buộc | §20 | §15 |
| Bảng màu xanh xám + nắng gắt trắng, bảng hiệu đỏ chữ vàng | §19.5 | §14 |
| Layered sprite + spring/lerp (nghiêng đầu không tốn sprite) | — | §16 Đừng-4 |
| "Player perception wins over simulation accuracy" | — | §16 Đừng-2 |
| Cổng P1: ≥7/10 người lạ trả lời đúng "vì sao khách đó giận" | §13 | **§17** |
| Datamine không bịt, phần hay không nằm ở EV | §21 | §8 mục f |
| Chế độ "một khách một lượt" | §20 | §15 (6 công tắc) |

---

## 9. Đề xuất sửa CANON

**Đ1. Ghi phương án hiển thị attention vào CANON §5 như hằng số thiết kế.** §5 hiện liệt kê *"biểu hiện"* cho 4 state (*"Quay đầu, dấu `?` nhỏ"* / *"Nhíu mày, bark tier-1"*) nhưng không nói gì về việc **chỉ ra zone đang bị nhìn**. Không có thông tin đó thì toàn bộ §5.4 (chọn đứng bên trái/phải, đặt thân che tầm nhìn) là mù. Đề xuất thêm một dòng vào §5:

> Mỗi NPC từ `GLIMPSED` trở lên phải vẽ một **tia nhìn** chỉ tới **zone** đang theo dõi, với **4 bậc rời rạc** khớp 4 state. **Cấm** hiển thị `certainty` dưới dạng thanh hoặc số.

**Đ2. Bổ sung một dòng cấm vào T3 cho rõ phạm vi.** T3 hiện nói *"không thanh tình cảm"*. Đề xuất mở rộng thành:

> Không thanh/điểm quan hệ, **không thanh kiên nhẫn, không thanh certainty, không % hài lòng, không điểm số cuối ngày**. Ngoại lệ duy nhất là công tắc trợ năng hiển thị **sự thật đo được** (số giây đã chờ) — không bao giờ hiển thị **phán xét**.

**Đ3. Bổ sung ràng buộc "khoảng lặng thiết kế" vào §13.3.** §13.3 định nghĩa cao điểm 6h30–8h nhưng không nói gì về các khoảng trống. Phiên chơi mobile 3–5 phút (§7.1 idea.md) **chỉ khả thi nếu có điểm dừng `HARD`** giữa các ca. Đề xuất thêm vào §13.3:

> Lịch NPC phải **thiết kế ra** ít nhất 4 khoảng lặng/ngày (hàng rỗng, lò rỗng) ở ranh giới giữa các ca. Khoảng lặng không được để lịch ngẫu nhiên quyết định.

**Đ4. §2 ghi "Mobile là v2".** Doc này đề nghị làm rõ một sắc thái: **ràng buộc mobile vào từ P1, build mobile ship ở v2**. Đề xuất sửa dòng "Nền tảng v1" thành:

> Nền tảng v1: PC (Steam) + demo web itch.io. Build mobile là **v2**. **Nhưng các ràng buộc hai thiết bị (không hover · 44×44 pt · layout data-driven · ca 3–5 phút) là bắt buộc từ P1** — chúng rẻ khi làm sớm và gần như không thể sửa sau.

**Đ5. Thêm `handSkill` / `grip` / `HandState` vào danh sách định danh.** Ba khái niệm này do `P1-01` đặt ra và doc này phụ thuộc vào chúng ở tầng UI. Nếu CANON không ghi, hai doc có thể trôi khỏi nhau. Đề xuất thêm vào §2 hoặc §5.
