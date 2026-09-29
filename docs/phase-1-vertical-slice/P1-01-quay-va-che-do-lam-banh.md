# P1-01 — Quầy và chế độ làm bánh

**Thuộc phase:** P1 — Vertical slice
**Phụ thuộc:** `P0-01-khung-scene-save-rng` (dự kiến) · `P0-02-dong-ho-va-nhip-ngay` (dự kiến) · `P1-02-tang-nhan-thay` (dự kiến) · `P1-04-ui-ux-hai-thiet-bi`
**Trạng thái:** **Chốt** phần zone / quy trình / phán quyết vệ sinh · **Cần đo** bảng thời gian thao tác, ngưỡng `grip`, ngân sách cao điểm · **Còn mở** số slot lò sau nâng cấp (thuộc P3)

---

## 1. Mục tiêu

Chế độ làm bánh là **trái tim thao tác** của game và là nơi duy nhất T1 được hiện thực hoá: mọi sai sót phải xảy ra **trước mặt khách**, trong một zone có giá trị `visibility` tra được. Doc này định nghĩa quầy thành 4 zone của CANON §5, quy trình 11 bước làm một ổ bánh mì Sài Gòn, và ba sự kiện sinh ra từ thao tác (`DROPPED_FOOD`, `DIRTY_HANDS`, `BURNT_OR_COLD`).

Doc này cũng biến việc làm bánh từ **thao tác lặp** thành **bài toán tuning**: hệ công thức tham số hoá + 3 preset mỗi sáng cho 12 khẩu vị ẩn (idea.md §22 mục 1). Đó là thứ giữ cho vòng lặp còn đáng chơi ở ngày 30.

Phục vụ trụ cột: **T1** (khách chấm quá trình), **T2** (chọn nguyên liệu thay vì chọn câu nói), **T5** (rủi ro rớt bánh phải **đọc được trước khi hành động**, không roll xúc xắc).

---

## 2. Cơ chế

### 2.1. Bốn zone của quầy — cái gì đặt ở đâu và vì sao

CANON §5 khoá cứng 4 zone. Mọi vật thể, mọi thao tác phải khai báo mình đang **lộ ra ở zone nào** tại từng thời điểm. Không có zone thứ 5.

| Zone | Là cái gì về mặt vật lý | Cái gì sống ở đây | Vì sao đặt ở đây |
|---|---|---|---|
| `HANDS` | Hai bàn tay người chơi, cao ngang ngực, **không có gì che** | Ổ bánh đang cầm, con dao, nguyên liệu đang kẹp, tiền, cái khăn | Zone lộ nhất (`0.95` với `FRONT_CENTER`). Đây là nơi `DIRTY_HANDS` và `DROPPED_FOOD` sinh ra. **Mọi thứ đi qua tay đều bị thấy** — đó là toàn bộ luận điểm của game |
| `BOARD` | Mặt thớt kính/inox nằm ngang, ngay sau quầy kính | Ổ bánh đang lắp ráp, khay nguyên liệu mở, vũng sốt, vụn bánh | Thấp hơn tầm mắt một chút (`0.85`). Người đứng `FRONT_CENTER` cúi nhìn được; người ở `QUEUE_3` gần như không (`0.18`) |
| `OVEN` | Lò than / lò điện nhỏ đặt lệch **bên trái** xe, có cửa | Ổ bánh đang nướng lại, chảo ốp la | Che khuất một phần bằng thân lò → `0.60` từ chính diện nhưng **`0.75` từ bên hông** (nghịch đảo so với `HANDS`). Zone duy nhất có nghịch đảo này → tạo ra quyết định "đứng bên nào" của §5.4 |
| `UNDER_COUNTER` | Ngăn dưới mặt quầy: rổ bánh, thùng đá, bồn rửa, thùng rác | Ổ bánh chưa lấy ra, đồ dự trữ, bồn rửa tay, thùng rác | Gần như vô hình (`0.05` / `0.00`). **Đây là chỗ duy nhất làm được việc mà không bị chấm.** Cũng chính vì vậy nó **không được phép chứa bất kỳ thao tác nào ảnh hưởng chất lượng món** — nếu không, lỗ hổng §8 mục (g) sẽ mở toang |

> **Luật zone bất di:** một thao tác chỉ được đặt ở `UNDER_COUNTER` nếu **kết quả của nó không làm ổ bánh tốt hơn hay tệ hơn**. Lấy ổ bánh ra, vứt rác, rửa tay — được. Quết pate lén dưới quầy — **không bao giờ**.

**Nghịch đảo `OVEN` có ý nghĩa gì khi chơi:** nướng là thao tác duy nhất an toàn hơn khi khách đứng **chính diện**, và nguy hiểm hơn khi khách đứng **bên hông**. Lắp ráp trên `BOARD` thì ngược lại. Người chơi giỏi sẽ học cách **xếp thứ tự công việc theo chỗ đứng của khách đang soi nhất**, không phải theo thứ tự công thức.

### 2.2. Sơ đồ bố cục quầy

**Nhìn từ trên xuống (top-down) — đây là sơ đồ chuẩn để đặt toạ độ logic:**

```
                             ╔═══════════════════════════════════════════════════╗
                             ║            H Ẻ M   —   mặt đường                  ║
                             ╚═══════════════════════════════════════════════════╝

        ○ SEATED_FAR                ○ QUEUE_3     ○ QUEUE_2
        (ghế nhựa, hũ đũa)              │             │
                                        └──── hàng ───┘
                                                 │
                              ○ FRONT_SIDE   ○ FRONT_CENTER
                              (bên hông)      (sát quầy, ~0,5 m)
      ───────────────────────────────────────────────────────────────────────────
                          ▲ tấm kính quầy (occluder cố định)
      ┌────────────┬──────────────────────────────────────┬─────────────────────┐
      │            │                                      │                     │
      │   [OVEN]   │        [ B O A R D ]                 │   khay nguyên liệu  │
      │   lò + cửa │   thớt lắp ráp · vũng sốt · vụn      │   (nắp mở = lộ)     │
      │   chảo ốp  │                                      │                     │
      │     la     │        ╭──────────────╮              │                     │
      │            │        │   [HANDS]    │              │                     │
      │            │        │ (vùng bay)   │              │                     │
      └────────────┴────────╰──────────────╯──────────────┴─────────────────────┘
      ┌───────────────────────────────────────────────────────────────────────────┐
      │  [ U N D E R _ C O U N T E R ]                                            │
      │   rổ bánh nguội │ bồn rửa tay │ thùng đá │ thùng rác │ khay preset 1·2·3   │
      └───────────────────────────────────────────────────────────────────────────┘
                         ▼ người chơi đứng ở đây (không di chuyển tự do)
```

**Nhìn thẳng (front elevation) — đây là cái khách thấy, và là cái camera game thấy:**

```
        ┌───────────────────────────────────────────────────────┐
        │   bảng hiệu đỏ chữ vàng:  B Á N H   M Ì   C Ô   B A   │
        └───────────────────────────────────────────────────────┘
             ░░░ khói lò ░░░
        ┌──────────┐                                    ┌─────────────┐
        │  ▓▓▓▓▓▓  │        ╭─────────────────╮         │ ▣ ▣ ▣ ▣ ▣ ▣ │
        │  ▓ OVEN  │        │     H A N D S   │         │ ▣ ▣ ▣ ▣ ▣ ▣ │
        │  ▓▓▓▓▓▓  │        ╰─────────────────╯         │  khay liệu  │
        └──────────┘   ══════════════════════════════   └─────────────┘
         vis 0.60      ▬▬▬▬▬  B O A R D  ▬▬▬▬▬▬▬▬▬       vis 0.85
         (0.75 bên)     vis 0.85                          (đi theo BOARD)
        ═══════════════ tấm kính ══════════════════════════════════════
        ╳╳╳╳╳╳╳╳╳ UNDER_COUNTER — vis 0.05 ╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳╳
```

Bảng `visibility` **không lặp lại ở đây** — dùng đúng bảng CANON §5, không sao chép để tránh lệch số.

### 2.3. Quy trình làm một ổ bánh mì — 11 bước

Đây là quy trình thật của xe bánh mì Sài Gòn, không phải quy trình game hoá. Thứ tự **không được đảo tuỳ tiện**: rạch trước khi nướng làm ổ bánh khô ruột; bỏ rau trước pate làm rau ngập sốt và nhũn.

| # | Bước | Thao tác vào | Zone lộ ra | Thời gian cơ sở | Lỗi có thể xảy ra |
|---|---|---|---|---|---|
| 1 | **Lấy ổ bánh** | Kéo/chạm rổ bánh → ổ lên tay | `UNDER_COUNTER` → `HANDS` | 0,6 s | Lấy nhầm ổ nguội cuối rổ (khởi điểm `warmth` thấp → khó cứu bằng nướng) |
| 2 | **Nướng lại** | Đặt ổ vào lò, **thời gian nướng là một trục liên tục** | `OVEN` (vào/ra) + lò chạy nền | 8–14 s (xem §2.4) | Non → ruột nguội. Quá tay → **`BURNT_OR_COLD`**, có mùi |
| 3 | **Rạch** | Một đường dao dọc thân ổ | `HANDS` + `BOARD` | 1,0 s | Rạch đứt đôi (`ORDER_DEFECT` nhẹ: ổ không giữ nhân) · rạch lệch làm nhân tràn khi gói · **cơ hội `FLOURISH`** |
| 4 | **Quết pate** | Kéo dao pate dọc lòng ổ | `BOARD` | 1,4 s | Quết lem ra vỏ (bẩn `BOARD`, cộng `STALL_CLEANLINESS`) · thiếu/thừa so với preset · **cơ hội `FLOURISH`** |
| 5 | **Xếp nhân** | Kẹp thịt / heo quay / xíu mại / chả lụa / cá / gà / ốp la | `HANDS` → `BOARD` | 0,9 s / loại | Bốc bằng tay bẩn → **`DIRTY_HANDS`** · rớt miếng nhân → **`DROPPED_FOOD`** · thiếu món khách gọi → `ORDER_DEFECT` |
| 6 | **Đồ chua** | Kẹp cà rốt + củ cải ngâm | `BOARD` | 0,6 s | Vắt không ráo → ướt bánh · lấy đồ chua ngâm quá 7 ngày (chua gắt, CANON §13.1) |
| 7 | **Dưa leo** | Xếp lát dưa | `BOARD` | 0,6 s | Lát dày mỏng không đều (chỉ ảnh hưởng `FLOURISH`, không ra sự kiện) |
| 8 | **Hành lá HOẶC ngò rí** | Rắc | `BOARD` | 0,5 s | **Đây là cặp loại trừ.** Bỏ ngò cho người đã nói *"đừng bỏ ngò"* → `ORDER_DEFECT` nặng nhất nhóm rau |
| 9 | **Ớt** | Rắc vài khoanh | `BOARD` | 0,4 s | Quá tay với người không dặn → lệch khẩu vị (không phải defect) · bỏ ớt cho người cấm → `ORDER_DEFECT` |
| 10 | **Nước sốt / xì dầu** | Rưới | `BOARD` | 0,6 s | Rưới lố → sốt chảy ra tay → chuyển `handState` sang `GREASE` · lẫn hai loại |
| 11 | **Muối tiêu** | Rắc | `BOARD` | 0,4 s | Quên (khách sành ăn nhận ra lúc cắn) |
| 12 | **Gói** | Giấy/bịch, 3 nhịp: gập – cuốn – xoắn | `HANDS` | 1,6 s | Gói ẩu → nhân rớt lúc trao · **cơ hội `FLOURISH`** · *"cho xin bịch"* mà quên bịch → `ORDER_DEFECT` |
| 13 | **Xác nhận + đưa** | Một bước xác nhận bắt buộc (CANON §15.5) | `HANDS` | 0,8 s | Đưa nhầm ổ của người khác → `MADE_THEM_WAIT` cho cả hai |

*(Bước 12–13 nằm ngoài "11 bước làm bánh" theo nghĩa nấu nướng nhưng bắt buộc trong vòng lặp — giữ đánh số liền mạch cho code.)*

**Thao tác xen kẽ, không nằm trong chuỗi:**

| Thao tác | Zone | Thời gian | Ghi chú |
|---|---|---|---|
| Rửa tay | `UNDER_COUNTER` (bồn) nhưng **động tác nâng lên `HANDS`** | **3,0 s — không rút ngắn được bằng kỹ năng** | Cố ý đắt. Xem §2.8 |
| Nhận tiền / thối tiền | `HANDS` | 2,0 s | Chuyển `handState` → `MONEY` |
| Đưa ly trà đá | `HANDS` | 1,2 s | Đồng thời là `CARED_FOR_THEM` + hạ `gazeFactor` (CANON §5.4) |
| Chiên ốp la | `OVEN` (chảo) | 22 s chạy nền | Chiếm slot lò. Ổ ốp la là ổ chậm nhất, nhớ khi tính cao điểm |
| Lau thớt | `BOARD` | 2,5 s | Hạ `STALL_CLEANLINESS` tích luỹ |
| Vứt bánh rớt | `HANDS` → `UNDER_COUNTER` | 1,0 s | **Bắt buộc sau `DROPPED_FOOD`.** Không có lựa chọn nào khác |

```ts
type StepId =
  | 'TAKE_LOAF' | 'BAKE_IN' | 'BAKE_OUT' | 'SCORE' | 'SPREAD_PATE'
  | 'FILL' | 'PICKLE' | 'CUCUMBER' | 'HERB' | 'CHILI' | 'SAUCE' | 'SEASON'
  | 'WRAP' | 'CONFIRM_HANDOVER'
  | 'WASH_HANDS' | 'TAKE_MONEY' | 'GIVE_TEA' | 'FRY_EGG' | 'WIPE_BOARD' | 'DISCARD'

type Step = {
  id: StepId
  zone: Zone                  // HANDS | BOARD | OVEN | UNDER_COUNTER
  baseSec: number
  skillFloorSec: number       // không bao giờ nhanh hơn mức này, kể cả skill max
  occupiesHands: boolean      // true => nối tiếp; false => chạy nền song song
  flourish?: FlourishId
  requiresCleanHands: boolean // true => chạm vào thức ăn
}
```

### 2.4. Nướng lại — trục liên tục, và cách `BURNT_OR_COLD` sinh ra

Ổ bánh có hai đại lượng, cả hai đều **liên tục và deterministic** (T5: không roll):

```ts
type Loaf = {
  warmth: number     // 0..1  — nguội dần theo thời gian kể từ lúc ra lò
  crust:  number     // 0..1+ — độ giòn/sém, chỉ tăng khi ở trong lò, KHÔNG giảm
}
```

**Trong lò:** `crust += crustRate * ovenHeat * dt`, `warmth → 1` theo hàm mũ.
**Ngoài lò:** `warmth -= coolRate * dt` (nhanh hơn nếu mưa / gió / đã rạch), `crust` đứng yên.

| `crust` | Tên trong game | Hệ quả |
|---|---|---|
| `< 0,45` | *chưa tới* | Không sự kiện. Chất lượng −, khách sành ăn (`soi` ≥ 0,7) nói tier-1 |
| `0,45 – 0,88` | **giòn** | Vùng tốt. Rộng 0,43 — rộng có chủ ý, đây không phải game canh giờ |
| `0,88 – 1,00` | *sém cạnh* | Chất lượng −−. Vẫn **không** ra sự kiện. Vùng đệm cho người chơi mới |
| `> 1,00` | **cháy** | → **`BURNT_OR_COLD`** bắn **ngay tại lò**, không đợi lúc đưa |

Và nhánh nguội:

| `warmth` lúc **CONFIRM_HANDOVER** | Hệ quả |
|---|---|
| `≥ 0,55` | Bình thường |
| `< 0,55` | → **`BURNT_OR_COLD`** bắn **lúc đưa**, salience 80, dạng *"bánh nguội ngắt"* |

**Mùi làm bán kính nhận thấy rộng hơn** (CANON §3.1). Về kỹ thuật, mùi **không** thêm zone mới — nó đặt **sàn** cho `visibility`:

```ts
// Chỉ áp dụng cho BURNT_OR_COLD nhánh cháy. Khói nhìn thấy + mùi khét.
function effVisibility(ev: EventId, slot: Slot, zone: Zone): number {
  const v = VISIBILITY[slot][zone]
  if (ev === 'BURNT_OR_COLD' && loaf.crust > 1.0) return Math.max(v, 0.55)
  return v
}
```

Hệ quả kiểm tra: khách ở `QUEUE_3` bình thường nhìn `OVEN` được `0.30`; khi bánh cháy thì thành `0.55` → **cháy bánh là lỗi duy nhất cả hàng cùng biết**. Đó đúng là điều xảy ra ngoài đời.

**Hàng đợi lò:**

```ts
type Oven = {
  slots: (Loaf | null)[]      // v1: 3 slot. Nâng cấp lò là Trục B (CANON §10) — thuộc P3
  heat: number                // 0..1, tụt mỗi lần mở cửa, hồi lại sau ~6 s
}
```

Mở cửa lò để lấy ổ ra làm `heat` tụt `0,12` → **ổ đang nướng dở bên trong bị kéo dài thời gian**. Đây là nguồn áp lực cao điểm thật sự: càng thò tay vào lò nhiều lần, cả hàng đợi càng chậm. Người chơi giỏi sẽ **nướng theo lô**, không nướng theo khách.

### 2.5. Mô hình thao tác — hai đường vào, một hành động

**Ràng buộc kiến trúc (không thương lượng):** kéo-thả và chạm-để-đặt **không phải hai code path**. Cả hai chỉ là bộ sinh ra cùng một `ActionIntent`. Mọi luật (thời gian, `grip`, `FLOURISH`, zone lộ ra, sự kiện) sống ở tầng dưới, **không biết người chơi dùng chuột hay ngón tay**.

```
   ┌───────────────┐        ┌────────────────────┐
   │  PC: kéo-thả  │──┐     │ Mobile/trợ năng:   │
   │  (pointer)    │  │     │ chạm-chọn → chạm   │──┐
   └───────────────┘  │     │ đích (tap-to-place)│  │
                      │     └────────────────────┘  │
                      ▼                             ▼
              ┌──────────────────────────────────────────┐
              │   ActionIntent { step, source, target,   │
              │                  tempo, precision }      │
              └──────────────────────────────────────────┘
                                   │
                      ┌────────────┴────────────┐
                      ▼                         ▼
           ┌─────────────────┐        ┌────────────────────┐
           │ AssemblyMachine │        │  GripModel (§2.7)  │
           │  (thời gian,    │        │  → DROPPED_FOOD    │
           │   zone, defect) │        └────────────────────┘
           └─────────────────┘
                      │
                      ▼
           ┌─────────────────────────────┐
           │ EventBus → perception (§5)  │
           └─────────────────────────────┘
```

```ts
type ActionIntent = {
  step: StepId
  source: NodeId          // khay nguyên liệu, rổ bánh, lò…
  target: NodeId          // ổ bánh, lò, bồn rửa, thùng rác…
  tempo: number           // 0..1 — nhanh/chậm so với baseSec. Cả hai đường đều sinh được
  precision: number       // 0..1 — chọn đúng đích ngay lần đầu, không tap sửa
  path?: PathSample[]     // CHỈ có ở kéo-thả; dùng cho FLOURISH dạng nét
}
```

**Parity bắt buộc — ba luật:**

1. **Trần rủi ro bằng nhau.** `grip` tính từ `tempo` (tốc độ ra lệnh) + `handState`, **không** tính từ vận tốc con trỏ. Kéo-thả có thêm một số hạng "giật nét" (`jerk`) nhưng bị clamp để **tổng không bao giờ vượt trần của tap mode**. Kéo-thả không được phép nguy hiểm hơn.
2. **Trần phần thưởng bằng nhau.** Mỗi `FlourishId` có **hai cách đạt**: đường nét (kéo-thả) hoặc độ chính xác lựa chọn (tap). Xem §2.9.
3. **Hoàn tác giống hệt nhau.** Cùng một stack, cùng một nút, cùng một phím.

**Nút Hoàn tác (CANON §15.5 — ba cái đi chung):**

```ts
type UndoEntry = { intent: ActionIntent; snapshot: LoafState; tAt: number }

const UNDO_DEPTH = 5
// Hoàn tác được:  mọi bước lắp ráp (SCORE → SEASON), WRAP, chọn preset
// KHÔNG hoàn tác được (vì đã xảy ra trước mặt khách — T1):
//   - BAKE_OUT sau khi crust vượt 1.0   (bánh cháy rồi thì cháy rồi)
//   - DROPPED_FOOD                       (§7.2 — không có nút nhặt lên, cũng không có nút quay ngược)
//   - CONFIRM_HANDOVER                   (đã đưa là đã đưa)
//   - TAKE_MONEY                         (tay đã dính tiền)
```

> **Luật quan trọng:** Hoàn tác **trả lại nguyên liệu và trả lại trạng thái ổ bánh, nhưng KHÔNG trả lại thời gian**. Đồng hồ vẫn chạy, hàng vẫn chờ. Nó sửa lỗi ngón tay, không sửa lỗi quyết định. Đúng tinh thần idea.md §20 mục 5: *"bị NPC trách vì lỗi ngón tay thì cay lắm"* — nhưng cũng không được thành nút tua ngược.

**Một bước xác nhận trước khi đưa bánh:** ổ bánh gói xong nằm ở ô *"sắp đưa"*. Dải **"đã bỏ"** (chuỗi icon nhỏ, luôn hiện — không hover) nằm ngay dưới. Người chơi đọc lại rồi bấm **Đưa**. Không có đếm ngược ở bước này, kể cả chế độ thường. Ở chế độ không giới hạn thời gian, khách vẫn đứng đợi nhưng kiên nhẫn đóng băng.

### 2.6. Công thức tham số hoá + preset — biến thao tác thành tuning

*(Đề xuất của Minh, idea.md §22 mục 1. Đây là hệ thống chống nhàm quan trọng nhất của P1.)*

**Vấn đề nó giải:** đến ngày 10, người chơi đã thuộc 11 bước. Nếu làm bánh chỉ là thao tác, game chết ở đó. Preset biến câu hỏi từ *"tôi bấm đúng chưa"* thành *"sáng nay tôi nên chuẩn bị cái gì"*.

**Công thức nhà = một vector 7 chiều.** Không phải danh sách nguyên liệu — là **tỉ lệ**.

```ts
type TasteVector = {
  pate:  number   // 0..1  ít ↔ dày
  meat:  number   // 0..1  mỏng ↔ đầy
  veg:   number   // 0..1  "cho ít rau" ↔ ngập rau
  chili: number   // 0..1  không ớt ↔ "nhiều ớt"
  salt:  number   // 0..1  nhạt ↔ đậm (muối tiêu + xì dầu)
  sauce: number   // 0..1  khô ↔ ướt
  crust: number   // 0..1  mềm ↔ giòn rụm (ánh xạ sang thời gian nướng)
}

type Preset = {
  id: 'P1' | 'P2' | 'P3'
  name: string            // người chơi tự đặt: "ổ chú Tư", "đậm cay", "nhẹ"
  taste: TasteVector
  fill: FillId[]          // nhân mặc định, tối đa 2 loại
  preppedCount: number    // số phần đã chia sẵn còn lại trong khay
}
```

**Mỗi NPC có một `TasteVector` ẩn** + một `weight` cho biết chiều nào họ để ý. Không bao giờ hiện số (T3). Người chơi suy ra qua bark, qua sổ tay, qua việc họ ăn hết hay bỏ dở.

```ts
type NpcTaste = {
  ideal: TasteVector
  weight: TasteVector     // chị Lan weight.veg = 0.9 → cực kỳ để ý rau
  tolerance: number       // 0.08..0.30 — suy ra từ personality.soi
}

function satisfaction(n: NpcTaste, served: TasteVector): number {
  let err = 0, wsum = 0
  for (const k of DIMS) {
    const w = n.weight[k]
    err  += w * Math.max(0, Math.abs(n.ideal[k] - served[k]) - n.tolerance)
    wsum += w
  }
  return clamp01(1 - err / wsum)      // 0..1, KHÔNG bao giờ hiển thị
}
```

**Ràng buộc buổi sáng — đây là chỗ bài toán nằm:**

- Mỗi sáng chuẩn bị được **đúng 3 preset**. Con số 3 là cứng ở v1 (nâng lên 4 là một upgrade Trục B ở P3).
- Một preset cần **prep**: chia phần pate, trộn sẵn khay rau theo tỉ lệ, canh sẵn mẻ nướng.
- Mỗi ngày có **~12 khách quen** với 12 khẩu vị khác nhau, cộng khách vãng lai.

| Chi phí | Giá | Ghi chú |
|---|---|---|
| **Chuẩn bị 1 preset buổi sáng** | 45 s thời gian sáng + khoá `prepUnits` nguyên liệu | Thời gian sáng là tài nguyên có hạn, cạnh tranh với đi chợ |
| **Phục vụ theo preset** (fast path) | **3,2 s** thay cho 4,5 s chuỗi bước 4→11 | Một thao tác duy nhất "áp preset". Nhanh hơn ~29% |
| **Tuỳ biến nhẹ trên preset** (±1 chiều) | +1,1 s, không phá khay | *"nhiều ớt"* trên nền preset — vẫn rẻ |
| **Tuỳ biến nặng** (≥2 chiều hoặc đổi nhân) | +3,8 s, **thoát fast path**, làm tay từng bước | Bằng làm thủ công hoàn toàn |
| **Đổi preset đang gắn khay giữa buổi** | **22 s + bỏ `ceil(preppedCount * 0.4)` phần đã chia** | Phạt thật. Không ai đổi preset lúc 7h |
| **Preset hết `preppedCount`** | Tự động rơi về làm thủ công, có báo một dòng | Không chặn, chỉ chậm |

**Bài toán người chơi thật sự phải giải** — và không có đáp án đúng:

```
12 khẩu vị, 3 preset. Đây là k-medoids với k=3 trên không gian 7 chiều,
CÓ TRỌNG SỐ theo mức độ quan trọng của từng khách đối với bạn.

Chiến lược A — "phủ rộng":  3 preset đặt ở 3 trọng tâm cụm
        → ai cũng ~0.70 satisfaction, không ai ghét, không ai nhớ.
Chiến lược B — "bốn khách ruột": 1 preset khớp gần hoàn hảo 4 người
        → 4 người ~0.95 (kích REMEMBERED_USUAL, salience 90),
          8 người ~0.45 (chưa thành ORDER_DEFECT nhưng lạt lòng dần).
Chiến lược C — "một preset rỗng": để P3 ở giữa và luôn tuỳ biến nặng
        → chất lượng cao nhất, THÔNG LƯỢNG THẤP NHẤT → MADE_THEM_WAIT (salience 100).
```

Chiến lược C phải **thua rõ ràng lúc cao điểm và thắng rõ ràng lúc vãn** — nếu không, hệ preset không có răng. Đây là tham số cần tune số 1.

> **Ranh giới không được lẫn:** lệch preset ≠ `ORDER_DEFECT`.
> Khách **nói ra** *"không hành"* → hành là **ràng buộc cứng**, vi phạm là `ORDER_DEFECT` (20 tại quầy → 100 lúc ăn).
> Khách **không nói** nhưng vốn thích ít rau → chỉ là `satisfaction` thấp, im lặng, tích luỹ. Không có bark tức thì.
> Preset **luôn bị ghi đè** bởi ràng buộc cứng. Nếu preset có hành mà khách dặn không hành, hệ thống **không tự bỏ hộ** — người chơi phải nhớ. Đó là T2.

**`REMEMBERED_USUAL` nối vào đây như thế nào:** khi một khách quen tới và người chơi áp đúng preset khớp `ideal` của họ **mà không cần họ nói**, bắn `REMEMBERED_USUAL` (salience 90 — khoảnh khắc chữa lành lõi của game). Preset không chỉ là tối ưu hoá; nó là **cách người chơi thể hiện rằng mình nhớ**.

### 2.7. `DROPPED_FOOD` — kịch bản đầy đủ

**Ràng buộc T5 trước tiên:** rớt bánh **không được là xác suất**. Người chơi phải **đọc được rủi ro trước khi hành động**. Vì vậy có một đại lượng hiện ra: `grip` — độ chắc tay của vật đang cầm.

```ts
type Grip = { value: number }    // 0..1, khởi điểm 1.0 mỗi lần nhấc vật lên

const SAFE_TEMPO = 0.75          // ra lệnh chậm hơn mức này => hồi grip

function tickGrip(g: Grip, it: HeldItem, hand: HandState, tempo: number, dt: number) {
  const over  = Math.max(0, tempo - SAFE_TEMPO)          // ẩu tới đâu
  const slip  = it.slipperiness * HAND_SLIP_MUL[hand]    // trơn tới đâu
  const drain = (over * 2.4 + slip * 0.35) * dt
  const gain  = (over === 0 ? 0.55 : 0) * dt
  g.value = clamp01(g.value - drain + gain)
  if (g.value <= 0) emit('DROPPED_FOOD', { item: it, zone: 'HANDS' })
}
```

| `HandState` | `HAND_SLIP_MUL` | Sinh ra từ |
|---|---|---|
| `CLEAN` | 0,00 | Sau `WASH_HANDS` |
| `MONEY` | 0,45 | `TAKE_MONEY` |
| `GREASE` | 1,00 | Rưới sốt lố, bốc heo quay, chạm chảo |
| `RAW` | 0,80 | Chạm trứng sống / cá sống |

**Bốn nguyên nhân rớt — tất cả đều đọc được trước:**

| Nguyên nhân | Người chơi thấy gì **trước khi** rớt | Ghi chú |
|---|---|---|
| **Thao tác quá nhanh** | Vòng `grip` quanh vật cầm co lại, viền chuyển cam ở 0,45, rung nhẹ + tiếng "trượt tay" ở 0,25 | Tự tạo áp lực, đúng tinh thần Minh: *"chill là áp lực do mình tự tạo ra vì tham"* |
| **Tay đang bẩn** | Icon tay ở HUD đổi hình (**hình dáng**, không chỉ màu) ngay lúc dính. `grip` bắt đầu ở 1.0 nhưng rút liên tục | Nối trực tiếp `DIRTY_HANDS` ↔ `DROPPED_FOOD` |
| **Đụng phải** | Vật cản (chồng ổ đã xong, cửa lò đang mở, ly trà đá) có **viền chấm cảnh báo** khi đường kéo đi qua | Va chạm chỉ trừ `grip` một cục `0.30`, không rớt tức thì — phải đang ẩu sẵn mới rớt |
| **Nhận vật khi tay đã đầy** | Ô `HANDS` hiện "đầy" (2 slot). Slot thứ 3 **không nhận được**, không phải rớt | Chủ động chặn chứ không phạt. Rớt phải luôn là hệ quả của hành động, không phải của UI |

**Hệ quả — bắt buộc, không thương lượng (CANON §7.2):**

```ts
on('DROPPED_FOOD', (e) => {
  // 1. KHÔNG có lựa chọn nào khác. Không có nút "nhặt lên dùng tiếp".
  loaf.state = 'MUST_DISCARD'
  lockAllSteps(exceptStep: 'DISCARD')

  // 2. Chi phí NGUYÊN LIỆU
  inventory.consume(e.item)              // mất thật, không hoàn
  if (e.item.kind === 'LOAF') inventory.loaves -= 1

  // 3. Chi phí THỜI GIAN — đây mới là cái đau
  //    1,0 s vứt + làm lại toàn bộ ổ từ bước 1 (≈10,4 s) + có thể phải nướng lại (≈9 s)
  //    => 11–20 s. Ở cao điểm, bằng 1–2 khách bị đẩy lùi.

  // 4. Chi phí VỆ SINH
  stall.cleanliness += DROP_MESS         // vũng sốt trên đất, ruồi tới sau ~40 s

  // 5. Rủi ro dây chuyền
  //    Hàng dài thêm -> MADE_THEM_WAIT (salience 100) cho người kế tiếp.
  //    Ổ đang trong lò tiếp tục chín -> BURNT_OR_COLD nếu quên.
  //    ĐÂY LÀ ĐIỂM THIẾT KẾ: rủi ro chuyển từ ĐẠO ĐỨC sang VẬN HÀNH (CANON §7.2).
})
```

**Kiểm tra hiệu chỉnh (khớp CANON §5):** `DROPPED_FOOD` salience 75, xảy ra ở `HANDS`, khách `FRONT_CENTER` nhìn thẳng → `CONFIRMED` sau **~1,4 giây**. Cùng sự kiện khi khách bấm điện thoại (Anh Bảo, `gazeFactor` 0,05) → **~28 giây** → thực tế không bao giờ bị bắt. Nhưng **tiếng động** thì vẫn có: rơi phát ra âm thanh, nên nó nâng `gazeFactor` của mọi khách trong bán kính lên trong 1,2 s. Người chơi học được: rớt lúc cả hàng đang nhìn điện thoại vẫn **có thể** thoát, nhưng tiếng động là thứ phản bội bạn.

**Phản ứng của cô Ba (CANON §7.4) — người dạy, không phải hệ thống phạt:**

| Tình huống | Cô Ba làm gì |
|---|---|
| Cô đang đứng tiếp khách lúc bạn làm rớt | Cô **không la**. Cô cúi xuống lượm giùm, bỏ vô thùng, rồi nói khẽ: *"Bánh đó con để cô ăn."* — rồi cô **thật sự để riêng ra**, và buổi tối trong cảnh đếm tiền có cái ổ đó trên bàn. Không có con số nào bị trừ |
| Cô không có mặt | Không có gì xảy ra tại quầy. **Tối, lúc ghi sổ**, cô nhìn số ổ: *"Bữa nay hụt hai ổ hả con?"* — một dòng, không trách, rồi chuyển chuyện |
| Rớt ≥3 lần trong một ngày | Sáng hôm sau cô để sẵn cái khăn khô cạnh thớt. **Không nói gì cả.** Đây là cách dạy đúng kiểu Việt và là khoảnh khắc mạnh nhất của hệ thống này |

**Không đưa cảnh nhặt bánh vào trailer** (CANON §7.6). Trailer dẫn đầu bằng `DIRTY_HANDS`.

**Đồn thổi:** `DROPPED_FOOD --0.30--> "bán đồ rơi xuống đất"` (CANON §12). Lưu ý hệ quả tréo ngoe **cố ý giữ lại**: bạn làm đúng luật (vứt đi) nhưng tin đồn vẫn biến nó thành *"bán đồ rơi xuống đất"*. Bạn không gian dối, nhưng cái hẻm không biết điều đó. Đó là chất liệu kịch hay nhất mà hệ thống này tạo ra — và nó **không được phép bịt**.

### 2.8. `DIRTY_HANDS` — sự kiện dẫn đầu trailer

CANON §3.1: salience 40, loại vệ sinh, **sự kiện dẫn đầu trailer** (phán quyết §24). Vì nó là bộ mặt marketing của game, nó phải **đọc được trong một ảnh tĩnh**.

```ts
type HandState = 'CLEAN' | 'MONEY' | 'GREASE' | 'RAW'

type Hands = {
  left:  HandState
  right: HandState        // hai tay riêng biệt — đây là chỗ có chiều sâu
  holding: HeldItem[]     // tối đa 2
}
```

**Hai tay tách riêng là quyết định thiết kế, không phải chi tiết thừa.** Người bán bánh mì thật sự làm chính xác việc này: cầm tiền bằng tay trái, gắp đồ bằng kẹp ở tay phải. Người chơi khám phá ra mẹo đó là một khoảnh khắc "à!" miễn phí — và nó là **mẹo thật ngoài đời**, không phải mẹo game.

| `HandState` | Sinh ra từ | Điều kiện kích `DIRTY_HANDS` |
|---|---|---|
| `CLEAN` | Rửa tay (3,0 s) | — |
| `MONEY` | Nhận / thối tiền | Chạm trực tiếp vào **thức ăn** hoặc vào **lòng ổ bánh** |
| `GREASE` | Sốt lố, heo quay, chảo | Như trên. Cộng `slip` cao nhất |
| `RAW` | Trứng sống, cá sống | Như trên, **và** chạm vào món **đã chín** → nặng hơn (dùng `traitMul` cao hơn cho khách `soi`) |

**Ba hành vi kích sự kiện** (CANON §3.1 liệt kê đúng ba):

```ts
const DIRTY_TRIGGERS = [
  { id: 'MONEY_THEN_FOOD', when: () => hand.state !== 'CLEAN' && intent.requiresCleanHands },
  { id: 'SCRATCH_HEAD',    when: () => intent.step === 'IDLE_SCRATCH' },   // idle animation, người chơi bấm
  { id: 'TOUCH_FACE',      when: () => intent.step === 'IDLE_WIPE_BROW' }, // trời nóng, quệt mồ hôi
]
```

Hai cái sau là **idle có chủ ý**: khi đứng không quá 8 s, nhân vật tự quệt trán / gãi đầu **trừ khi** người chơi bấm "để tay yên". Nghe có vẻ ác — nhưng nó chính là chi tiết khiến ai từng đứng bán hàng phải bật cười. Và nó **luôn có một cách né**: rửa tay, hoặc để tay lên thành quầy.

**Bồn rửa là một thao tác tốn thời gian — cố ý:**

- 3,0 s, **không rút ngắn được bằng kỹ năng**, không có nâng cấp làm nó nhanh hơn ở v1.
- Chiếm **cả hai tay**. Không làm gì khác được.
- Ở `UNDER_COUNTER` về vị trí, nhưng **động tác nâng lên `HANDS`** — khách **thấy bạn rửa tay**. Đây là tin tốt: rửa tay là hành động duy nhất mà *bị nhìn* lại có lợi.
- **Không bắn sự kiện tích cực.** Danh mục vệ sinh đã đủ 3/3 (CANON §7.1). Rửa tay là kỳ vọng cơ bản, không phải thành tích. Cùng lắm cô Ba gật đầu một cái.

**Vì sao đây là sự kiện dẫn đầu trailer:** nó đọc được trong 1 giây, không cần lời thoại, phổ quát ở mọi văn hoá, hài mà không hạ thấp nghề (CANON §14.1 — lằn ranh đỏ "hạ thấp nghề"). Shot trailer: cận cảnh tay cầm tờ 20k → cắt sang **mắt bà Bảy** → cắt sang bàn tay đang khựng lại giữa không trung. Hết. Không cần một chữ nào.

### 2.9. Kỹ năng tay và `FLOURISH`

CANON §3.2: salience 15, **"thưởng cho kỹ năng tay, không thưởng cho tiền"**. Hai ràng buộc suy ra từ câu đó:

> **R1. `FLOURISH` KHÔNG bao giờ được tăng tip, giá bán, hay bất kỳ con số tiền nào.**
> **R2. `FLOURISH` KHÔNG bao giờ có trạng thái thất bại.** Không có "miss". Không có prompt đòi bấm. Không phải QTE.

**Phần thưởng là gì, nếu không phải tiền:**

| Phần thưởng | Chi tiết |
|---|---|
| **Kỹ năng nở ra** | `handSkill[technique] += 1`. Kỹ năng làm **cửa sổ dung sai rộng thêm** và **hạ `baseSec` về phía `skillFloorSec`**. Tự thưởng bằng chính sự thành thạo |
| **Một sự kiện tích cực salience 15** | Đủ thấp để không "farm" được, đủ cao để khách `FRONT_CENTER` thỉnh thoảng thốt lên *"gọn dữ ha"* |
| **Cô Ba để ý** | Ngưỡng 20 flourish cùng loại → một dòng của cô ở cảnh tối. Một lần duy nhất mỗi kỹ thuật |
| **Âm thanh** | Tiếng dao cắt "rẹt" một nhịp thay vì hai nhịp lưỡng lự. Đây là phần thưởng thật sự với đa số người chơi |

**Ba kỹ thuật, không nhiều hơn:**

```ts
type FlourishId = 'SCORE_ONE_STROKE' | 'SPREAD_CLEAN' | 'WRAP_FAST'
```

| Kỹ thuật | Bước | Chấm thế nào (kéo-thả) | Chấm thế nào (chạm-để-đặt) |
|---|---|---|---|
| `SCORE_ONE_STROKE` — *rạch một đường* | 3 | **Một** nét liên tục (không nhấc), lệch trục ổ ≤ 12°, tốc độ nằm trong dải `[0.6, 1.0]` của `tempo`, không đảo chiều | Chạm **đúng ổ bánh ngay lần đầu**, không có tap sửa, và **không** tap lại trong 0,4 s sau đó (không cuống) |
| `SPREAD_CLEAN` — *quết pate gọn* | 4 | Phủ ≥ 85% chiều dài lòng ổ, **0 mẫu path** vượt ra ngoài biên vỏ bánh | Chọn đúng mức pate khớp preset **không cần mở bảng tuỳ chỉnh** |
| `WRAP_FAST` — *gói nhanh* | 12 | 3 nhịp **gập – cuốn – xoắn** với độ lệch nhịp giữa các cặp ≤ 18% (đo **tính đều**, không đo tốc độ tuyệt đối) | 3 tap liên tiếp đúng thứ tự, cùng luật đều nhịp |

**Vì sao đây không phải QTE — bốn khoá:**

1. **Không có prompt.** Không có vòng tròn thu nhỏ, không có "PRESS NOW". Cửa sổ chấm **chính là khoảng thời gian tự nhiên của thao tác đó**. Người chơi không biết mình đang bị chấm cho tới khi được khen.
2. **Không có hình phạt.** Không đạt = hành động vẫn hoàn tất bình thường, mất 0 điểm, không có âm thanh tiêu cực (nối §15.4 — nút "tắt âm báo tiêu cực").
3. **Đo tính ĐỀU, không đo tốc độ tuyệt đối.** Quan trọng với chế độ không giới hạn thời gian (CANON §15.2): người chơi chậm vẫn đạt `WRAP_FAST` miễn ba nhịp của họ đều nhau. Người run tay, người dùng switch, người chơi một ngón — vẫn với tới được.
4. **Kỹ năng làm cửa sổ rộng thêm, không hẹp lại.** Ngược chiều với mọi hệ QTE.

```ts
function scoreFlourish(f: FlourishId, i: ActionIntent, skill: number): boolean {
  const tol = BASE_TOL[f] * (1 + 0.06 * skill)     // càng giỏi, càng dễ — CỐ Ý
  return i.path
    ? evalStroke(f, i.path, tol)                    // đường vào kéo-thả
    : evalPrecision(f, i.precision, i.tempo, tol)   // đường vào chạm-để-đặt
}
// KHÔNG có nhánh else nào emit sự kiện tiêu cực. Không tồn tại 'FLOURISH_FAILED'.
```

**Chống farm (nối CANON §8 mục i — diminishing returns):** `FLOURISH` dùng `norepeat` trong cửa sổ 90 s cho **cùng một khách**. Rạch đẹp 12 ổ liên tiếp trước mặt bà Bảy thì bà khen **một** lần, lần thứ hai bà chỉ nhướng mày. Salience 15 cũng đã quá thấp để bù lại bất cứ lỗi nào — không có đường "đẹp tay bù cho bẩn tay".

### 2.10. Thông lượng giờ cao điểm

CANON §13.3: **1 lò, 2 tay, cao điểm 6h30–8h.** *"Đông khách = nhiều mắt nhìn hơn + áp lực làm nhanh = dễ ẩu."* Đây là ràng buộc kinh tế quan trọng nhất và trước doc này nó **thiếu hoàn toàn**.

**Hai tay = đúng một hành động thủ công tại một thời điểm.** Không có hàng đợi hành động, không có tự động hoá. Song song **chỉ** đến từ ba nguồn:

```
     TRỤC THỦ CÔNG (tuần tự, chiếm tay)
     ──[lấy ổ]──[rạch]──[pate]──[nhân]──[rau]──[sốt]──[gói]──[đưa]──▶

     TRỤC LÒ (chạy nền, 3 slot)
     ──[ổ A nướng ████████]────────
     ─────[ổ B nướng ████████]─────
     ──────────[ổ C nướng ████████]

     TRỤC CHẢO (chạy nền, chiếm 1 slot lò)
     ──[ốp la ██████████████████████]──   ← ổ ốp la là ổ chậm nhất

     TRỤC NGUỘI (chạy nền, KHÔNG ai điều khiển, luôn chống lại bạn)
     ──[ổ đã ra lò: warmth ↓↓↓ ]──────▶ dưới 0,55 = BURNT_OR_COLD
```

**Nút thắt thật sự không phải cái lò — mà là `warmth`.** Nướng sẵn 3 ổ nghe có vẻ khôn, nhưng ổ nướng sẵn nguội trong lúc bạn lắp ráp ổ trước đó. Bài toán là **canh lô**: nướng bao nhiêu ổ cùng lúc để ổ cuối lô chưa kịp nguội.

```ts
// Ngân sách nguội — công thức người chơi phải cảm được (không bao giờ hiện ra):
// t_nguoi ≈ (1 - 0.55) / coolRate      ≈ 26 s ở thời tiết chuẩn
// t_lapráp ≈ 10,4 s / ổ (thủ công) hoặc 7,5 s / ổ (fast path preset)
// => Lô an toàn = floor(t_nguoi / t_lapráp) = 2 ổ thủ công, 3 ổ nếu dùng preset.
```

**Đây là chỗ preset trả công lớn nhất:** fast path không chỉ nhanh hơn 29% — nó **nâng kích thước lô an toàn từ 2 lên 3**, tức nâng thông lượng thực tế lên ~40%. Người chơi cảm được điều đó mà không cần ai giải thích.

**Ngân sách cao điểm (cần đo, không phải số cứng):**

| Đại lượng | Giá trị khởi điểm | Ghi chú |
|---|---|---|
| Số ổ phát sinh trong 6h30–8h | **18–24 ổ** | Do lịch sinh hoạt NPC sinh ra (P2), không phải spawn ngẫu nhiên |
| Thời gian thao tác cần, thủ công hoàn toàn | 24 × 10,4 s ≈ **250 s** | |
| Thời gian thao tác cần, 80% fast path | ≈ **190 s** | |
| **Ngân sách thời gian thật của cao điểm** | phải **≥ 1,35 ×** con số trên | 1,35 là biên an toàn: đủ chỗ cho một lần rớt bánh + một lần rửa tay + trò chuyện |
| Hệ số nén ngày → phút thật | **do `P0-02` quyết định**, doc này không đặt số | Không bịa |

Nếu biên tụt dưới 1,0 thì người chơi không thể nào không trễ → `MADE_THEM_WAIT` (salience 100) bắn liên tục → game thành trừng phạt. Nếu biên trên 2,0 thì cao điểm không còn là cao điểm. **Đây là con số quan trọng nhất phải đo ở P1.**

**"Nhiều mắt nhìn" hiện thực hoá như thế nào:** không cần cơ chế mới. Hàng dài ra một cách tự nhiên lấp đầy `QUEUE_2`, `QUEUE_3` — và duyệt perception **từ phía sự kiện** (CANON §5) có nghĩa mỗi sự kiện giờ phải đối chiếu với 4–5 quan sát viên thay vì 1. Cùng một cú rớt bánh, lúc 6h00 thì một người thấy, lúc 7h15 thì năm người thấy, ba người kể lại. **Áp lực tăng lên mà không cần thêm một dòng code luật nào.**

**Vòng xoáy mà thiết kế này cố ý tạo ra:**

```
   hàng dài  →  người chơi tăng tempo  →  grip tụt nhanh hơn
        ↑                                        │
        │                                        ▼
   khách chờ lâu thêm  ←  làm lại 11–20 s  ←  DROPPED_FOOD
        │
        └──▶ và lúc này có 5 người nhìn thay vì 1 → CONFIRMED thay vì GLIMPSED
```

Quan trọng: vòng xoáy này **có phanh, và phanh nằm trong tay người chơi**. Chậm lại → `grip` hồi (0,55/s) → hết rớt. Trả giá bằng một chút kiên nhẫn của khách, nhưng `MADE_THEM_WAIT` leo thang **tuyến tính theo giây**, còn `DROPPED_FOOD` là một cục 75 salience + 20 s. Chậm lại **luôn là nước đi đúng** về mặt toán. Người chơi tham sẽ không tin điều đó — và đó chính là *"áp lực do mình tự tạo ra vì tham"*.

### 2.11. Bảng thời gian chuẩn — để tune

Tất cả tính bằng **giây thật**. `skillFloor` là mức nhanh nhất có thể đạt ở `handSkill` tối đa.

| StepId | Tên | Zone | `baseSec` | `skillFloor` | Chiếm tay | Flourish |
|---|---|---|---|---|---|---|
| `TAKE_LOAF` | Lấy ổ bánh | `UNDER_COUNTER`→`HANDS` | 0,6 | 0,4 | ✅ | — |
| `BAKE_IN` | Đưa vào lò | `OVEN` | 0,5 | 0,4 | ✅ | — |
| *(nướng)* | Chạy trong lò | `OVEN` | **8,0–14,0** | — | ❌ | — |
| `BAKE_OUT` | Lấy ra lò | `OVEN` | 0,5 | 0,4 | ✅ | — |
| `SCORE` | Rạch | `HANDS`+`BOARD` | 1,0 | 0,6 | ✅ | `SCORE_ONE_STROKE` |
| `SPREAD_PATE` | Quết pate | `BOARD` | 1,4 | 0,9 | ✅ | `SPREAD_CLEAN` |
| `FILL` | Xếp nhân (mỗi loại) | `HANDS`→`BOARD` | 0,9 | 0,6 | ✅ | — |
| `PICKLE` | Đồ chua | `BOARD` | 0,6 | 0,4 | ✅ | — |
| `CUCUMBER` | Dưa leo | `BOARD` | 0,6 | 0,4 | ✅ | — |
| `HERB` | Hành lá / ngò rí | `BOARD` | 0,5 | 0,35 | ✅ | — |
| `CHILI` | Ớt | `BOARD` | 0,4 | 0,3 | ✅ | — |
| `SAUCE` | Nước sốt / xì dầu | `BOARD` | 0,6 | 0,4 | ✅ | — |
| `SEASON` | Muối tiêu | `BOARD` | 0,4 | 0,3 | ✅ | — |
| `WRAP` | Gói | `HANDS` | 1,6 | 1,0 | ✅ | `WRAP_FAST` |
| `CONFIRM_HANDOVER` | Xác nhận + đưa | `HANDS` | 0,8 | 0,8 | ✅ | — |
| **Tổng một ổ thủ công** | | | **≈ 10,4** | ≈ 7,0 | | |
| `APPLY_PRESET` | Áp preset (thay bước 4→11) | `BOARD` | **3,2** | 2,4 | ✅ | `SPREAD_CLEAN` |
| **Tổng một ổ fast path** | | | **≈ 7,5** | ≈ 5,4 | | |
| `WASH_HANDS` | Rửa tay | `HANDS` | **3,0** | **3,0** | ✅✅ | — |
| `TAKE_MONEY` | Nhận / thối tiền | `HANDS` | 2,0 | 1,4 | ✅ | — |
| `GIVE_TEA` | Đưa ly trà đá | `HANDS` | 1,2 | 1,0 | ✅ | — |
| `FRY_EGG` | Chiên ốp la | `OVEN` | 22,0 | — | ❌ | — |
| `WIPE_BOARD` | Lau thớt | `BOARD` | 2,5 | 2,0 | ✅ | — |
| `DISCARD` | Vứt bánh rớt | `HANDS`→`UNDER_COUNTER` | 1,0 | 1,0 | ✅ | — |
| `SWAP_PRESET` | Đổi preset giữa buổi | `UNDER_COUNTER` | **22,0** | 22,0 | ✅✅ | — |

---

## 3. Dữ liệu & schema

```ts
// ─────────────────────────── craft/assembly.ts ───────────────────────────
type Zone = 'HANDS' | 'BOARD' | 'OVEN' | 'UNDER_COUNTER'
type FillId = 'thit' | 'heo_quay' | 'xiu_mai' | 'cha_lua' | 'ca' | 'ga' | 'op_la'
type HerbId = 'hanh_la' | 'ngo_ri'       // loại trừ nhau
type SauceId = 'nuoc_sot' | 'xi_dau'

type LoafState = {
  id: string
  warmth: number
  crust: number
  scored: boolean
  pate: number                   // 0..1 lượng thực tế đã quết
  fills: FillId[]
  pickle: number
  cucumber: number
  herb: HerbId | null
  chili: number
  sauces: SauceId[]
  season: number
  wrapped: 'none' | 'giay' | 'giay_bich'
  presetUsed: 'P1' | 'P2' | 'P3' | null
  flourishes: FlourishId[]
  mustDiscard: boolean
}

// ─────────────────────────── craft/recipe.ts ─────────────────────────────
type OrderSpec = {
  hard: HardConstraint[]         // khách NÓI RA -> vi phạm = ORDER_DEFECT
  soft: Partial<TasteVector>     // khẩu vị ẩn -> chỉ ảnh hưởng satisfaction
  takeaway: boolean              // "gói mang về" / "ăn tại chỗ"
  needBag: boolean               // "cho xin bịch"
}
type HardConstraint =
  | { kind: 'MUST_HAVE'; what: FillId | HerbId | 'do_chua' }
  | { kind: 'MUST_NOT';  what: FillId | HerbId | 'ot' | 'do_chua' }
  | { kind: 'LEVEL';     what: 'rau' | 'ot'; level: 'it' | 'nhieu' }
  | { kind: 'PLAIN' }            // "bánh mì không" — chỉ ổ bánh, không nhân
```

**Ví dụ content thật — `content/recipes/presets.default.json`:**

```json
{
  "presets": [
    {
      "id": "P1",
      "name": "đầy đủ nhà mình",
      "taste": { "pate": 0.62, "meat": 0.70, "veg": 0.55, "chili": 0.30,
                 "salt": 0.50, "sauce": 0.48, "crust": 0.66 },
      "fill": ["thit", "cha_lua"],
      "prepCostSec": 45,
      "prepUnits": { "pate": 12, "thit": 12, "cha_lua": 12, "rau_tron": 12 }
    },
    {
      "id": "P2",
      "name": "đậm cay",
      "taste": { "pate": 0.75, "meat": 0.80, "veg": 0.35, "chili": 0.85,
                 "salt": 0.72, "sauce": 0.66, "crust": 0.78 },
      "fill": ["heo_quay"],
      "prepCostSec": 45,
      "prepUnits": { "pate": 8, "heo_quay": 8, "rau_tron": 8 }
    },
    {
      "id": "P3",
      "name": "nhẹ, ít rau",
      "taste": { "pate": 0.35, "meat": 0.55, "veg": 0.25, "chili": 0.05,
                 "salt": 0.35, "sauce": 0.30, "crust": 0.55 },
      "fill": ["cha_lua"],
      "prepCostSec": 45,
      "prepUnits": { "pate": 8, "cha_lua": 8, "rau_tron": 8 }
    }
  ]
}
```

**Ví dụ khẩu vị ẩn — `content/npcs/taste.json`** (3 NPC của vertical slice):

```json
{
  "chu_tu": {
    "ideal":  { "pate": 0.60, "meat": 0.75, "veg": 0.50, "chili": 0.35,
                "salt": 0.55, "sauce": 0.50, "crust": 0.70 },
    "weight": { "pate": 0.4, "meat": 0.8, "veg": 0.3, "chili": 0.4,
                "salt": 0.3, "sauce": 0.3, "crust": 0.9 },
    "tolerance": 0.24,
    "note_for_writers": "soi 0.3 -> dễ tính, NHƯNG bánh phải giòn. Ổ mềm là ổ duy nhất chú nói."
  },
  "chi_lan": {
    "ideal":  { "pate": 0.30, "meat": 0.55, "veg": 0.22, "chili": 0.00,
                "salt": 0.30, "sauce": 0.25, "crust": 0.60 },
    "weight": { "pate": 0.7, "meat": 0.4, "veg": 0.95, "chili": 1.0,
                "salt": 0.6, "sauce": 0.7, "crust": 0.4 },
    "tolerance": 0.09,
    "note_for_writers": "soi 0.9 / nongTinh 0.1 -> KHÔNG BAO GIỜ nói gì. Chỉ ngày một ít lại."
  },
  "ba_bay": {
    "ideal":  { "pate": 0.70, "meat": 0.60, "veg": 0.70, "chili": 0.55,
                "salt": 0.60, "sauce": 0.60, "crust": 0.62 },
    "weight": { "pate": 0.8, "meat": 0.5, "veg": 0.8, "chili": 0.6,
                "salt": 0.5, "sauce": 0.5, "crust": 0.5 },
    "tolerance": 0.14,
    "note_for_writers": "soi 0.9 + deTha 0.8 -> bà thấy HẾT và bà nói HẾT, nhưng bà không giận. NPC để học luật."
  }
}
```

**Bảng trơn trượt — `content/recipes/slipperiness.json`:**

```json
{
  "loaf_plain": 0.10, "loaf_wrapped": 0.05, "loaf_sauced": 0.55,
  "thit": 0.35, "heo_quay": 0.70, "xiu_mai": 0.80, "cha_lua": 0.30,
  "ca": 0.65, "ga": 0.40, "op_la": 0.75,
  "dao": 0.25, "kep": 0.10, "ly_tra_da": 0.45, "tien": 0.15
}
```

---

## 4. UI/UX hai thiết bị

Chi tiết đầy đủ ở **`P1-04-ui-ux-hai-thiet-bi.md`**. Ở đây chỉ nêu các ràng buộc **do cơ chế làm bánh sinh ra**, mà UI bắt buộc phải đáp ứng:

| Ràng buộc | Vì sao | Yêu cầu UI |
|---|---|---|
| `grip` phải nhìn thấy | T5 — đọc được rủi ro trước khi hành động | Vòng cung quanh vật đang cầm, 3 bậc rời rạc (an toàn / cam 0,45 / rung + tiếng 0,25). **Không** phải thanh mượt |
| `handState` phải nhìn thấy | `DIRTY_HANDS` dẫn đầu trailer | Icon **hai tay riêng**, phân biệt bằng **hình dáng**, không chỉ màu (CANON §15) |
| `crust` phải nhìn thấy | `BURNT_OR_COLD` không được là bất ngờ | Vòng tiến trình vẽ **thẳng trên cửa lò**, đổi khắc vạch ở 0,45 / 0,88 / 1,00. Không hover |
| `warmth` phải nhìn thấy | Ổ nguội là lỗi thầm lặng nhất | Hơi khói nhỏ trên ổ đã ra lò, **tắt hẳn** khi `warmth < 0,55` — tắt khói là tín hiệu, không phải thiếu hiệu ứng |
| Dải "đã bỏ" luôn hiện | Bước xác nhận (§15.5) + không có hover | Chuỗi icon nhỏ dưới ổ, không bao giờ ẩn |
| Ba nút preset ở nửa dưới màn hình | Thiết kế cho ngón cái | `P1`/`P2`/`P3` + nhãn tên người chơi tự đặt + 3 chấm mức prep còn lại |
| Hoàn tác + Xác nhận cùng tầm ngón cái | §15.5 ba cái đi chung | Không đặt ở góc trên |

---

## 5. Tham số cần tune

| Tên | Khởi điểm | Khoảng | Cách đo |
|---|---|---|---|
| `SAFE_TEMPO` | 0,75 | 0,60–0,90 | Người chơi mới **không** được rớt trong 10 khách đầu; người chơi tham **phải** rớt ít nhất 1 lần trong 3 ngày đầu |
| `gripDrainMul` (hệ số 2,4) | 2,4 | 1,5–4,0 | Từ `grip` 1,0 → 0 khi `tempo` = 1,0, tay `GREASE`: mục tiêu **2,6 s** liên tục ẩu |
| `gripRecover` | 0,55 /s | 0,3–0,9 | Chậm lại 2 s phải hồi đủ an toàn |
| `coolRate` | 0,0173 /s | 0,012–0,025 | Cho `t_nguội ≈ 26 s`. Nhân 1,4 khi mưa |
| `crustRate` | 0,073 /s | 0,05–0,10 | Cửa sổ giòn (0,45→0,88) dài **≈ 5,9 s** — đủ rộng để không phải canh giờ |
| Cửa sổ giòn | 0,45–0,88 | rộng 0,30–0,50 | ≥7/10 tester không bao giờ vô tình cháy bánh trong ngày 1 |
| `ovenSlots` | 3 | 2–4 | 2 làm cao điểm bất khả thi; 4 làm lò hết là nút thắt |
| `ovenHeatDrop` mỗi lần mở cửa | 0,12 | 0,05–0,20 | Nướng theo lô phải **thắng rõ** nướng theo khách |
| `APPLY_PRESET` giây | 3,2 | 2,5–4,2 | Fast path phải nhanh hơn thủ công **25–35%**, không hơn |
| `SWAP_PRESET` giây | 22,0 | 15–35 | Không ai được đổi preset trong cao điểm; đổi lúc vãn thì chấp nhận được |
| `presetWasteRatio` | 0,40 | 0,25–0,60 | Đổi preset phải đau về nguyên liệu, không chỉ về giây |
| `prepCostSec` mỗi preset | 45 | 30–70 | 3 preset = 135 s sáng, phải **cạnh tranh thật** với thời gian đi chợ |
| Số preset/ngày | **3** | cố định v1 | Nâng lên 4 chỉ qua upgrade ở P3 |
| `tolerance` theo `soi` | `0,30 − 0,23·soi` | — | Chị Lan (`soi` 0,9) = 0,09; Anh Dũng (`soi` 0,2) = 0,25 |
| Biên ngân sách cao điểm | **1,35×** | 1,15–1,8 | **Tham số quan trọng nhất P1.** Dưới 1,0 = trừng phạt; trên 2,0 = không có cao điểm |
| `FLOURISH` `norepeat` window | 90 s | 60–180 | Không được khen quá 1 lần / khách / kỹ thuật |
| `BASE_TOL.SCORE_ONE_STROKE` góc | 12° | 8–20° | ≥5/10 tester đạt lần đầu mà **không biết mình đang bị chấm** |
| `handSkill` mở dung sai | +6% /cấp | 3–10% | Cấp 10 phải cảm rõ là "quen tay" |
| `WASH_HANDS` | 3,0 s | 2,5–4,5 | Phải đủ đau để người chơi cân nhắc dùng hai tay khác nhau, không đủ đau để bỏ rửa |
| `DROP_MESS` | +0,08 `cleanliness` | 0,04–0,15 | 3 lần rớt/ngày phải thấy ruồi |
| Số ổ cao điểm | 18–24 | 14–30 | Do lịch NPC sinh ra; chỉ tune gián tiếp |

---

## 6. Tiêu chí đạt

- [ ] Mỗi thao tác khai báo đúng **một** zone trong 4 zone CANON §5; không có thao tác ảnh hưởng chất lượng nào nằm ở `UNDER_COUNTER` (kiểm bằng test tĩnh duyệt bảng `Step`).
- [ ] `DROPPED_FOOD` ở `HANDS` với khách `FRONT_CENTER` nhìn thẳng đạt `CONFIRMED` trong **1,3–1,5 s** (khớp hiệu chỉnh CANON §5).
- [ ] Cùng sự kiện với `gazeFactor` = 0,05 **không bao giờ** đạt `CONFIRMED` trong một phiên chơi thật.
- [ ] Không tồn tại đường code nào cho phép dùng lại đồ đã rớt. Grep `'MUST_DISCARD'` → chỉ có đúng một nhánh, dẫn tới `DISCARD`.
- [ ] Chạm-để-đặt và kéo-thả đi qua **cùng một** `AssemblyMachine`. Kiểm bằng test: phát cùng chuỗi `ActionIntent` từ hai bộ sinh → `LoafState` cuối **bằng nhau từng bit**.
- [ ] Người chơi chỉ dùng chạm-để-đặt đạt được **cả ba** `FlourishId` trong một phiên 20 phút.
- [ ] Chơi hết một ngày ở **chế độ không giới hạn thời gian** vẫn đạt được `FLOURISH` (chứng minh flourish không phụ thuộc tốc độ tuyệt đối).
- [ ] 10 tester lạ: ≥7 người **giải thích đúng vì sao mình làm rớt bánh** ngay sau khi rớt, không cần đọc doc.
- [ ] 10 tester lạ: ≥6 người, sau 3 ngày trong game, **tự thay đổi cấu hình 3 preset** ít nhất một lần và nói được lý do.
- [ ] Không có preset nào thắng tuyệt đối: qua 200 lượt mô phỏng với 12 NPC, khoảng cách giữa chiến lược "phủ rộng" và "4 khách ruột" về tổng `satisfaction` ≤ 12%.
- [ ] Ngân sách cao điểm đo được và nằm trong **1,15–1,8×**.
- [ ] `FLOURISH` không nối tới bất kỳ biến tiền nào. Grep: không có đường từ `FlourishId` tới `ledger` / `tip` / `price`.
- [ ] Không có event id nào tên `*_FAILED` sinh từ hệ flourish.
- [ ] Autosave bắn **sau mỗi khách** và **ngay tại thời điểm** `DROPPED_FOOD` / `DIRTY_HANDS` / `BURNT_OR_COLD` (CANON §8 mục e).
- [ ] Pause được **giữa lúc đang kéo nguyên liệu** (CANON §15.2), và `grip` đóng băng khi pause.

---

## 7. Rủi ro & cách bịt

| # | Rủi ro | Cách bịt |
|---|---|---|
| R1 | **Rớt bánh cảm giác như xui xẻo** → vi phạm T5, người chơi thấy bất công | `grip` là hàm deterministic, hiện ra trước, có 3 bậc cảnh báo rời rạc + âm thanh riêng. Không có `rng` nào trong đường code này. Test: ghi lại 50 lần rớt, mỗi lần phải truy ngược được về một quyết định của người chơi |
| R2 | **Preset thành "bấm P1 cả ngày"** — hệ thống tuning biến thành nút tua nhanh | Ràng buộc cứng (`hard`) **không bao giờ** được preset tự thoả. `preppedCount` cạn. Khẩu vị 12 NPC trải đủ rộng để 1 preset không phủ nổi (kiểm bằng mô phỏng ở §6) |
| R3 | **Micro-cheat lặp vô hạn** — bớt rau 5% cho 100% khách, 40 ngày (CANON §8 mục g — **lỗ hổng lớn nhất**) | Preset làm lỗ hổng này **dễ khai thác hơn** — nên phải bịt ngay tại đây: theo dõi **pattern**, không theo sự kiện đơn. Đếm `driftCount` = số lần `served[k] < ideal[k] - tolerance` cùng một chiều `k` qua N ngày. Ngưỡng N=14 → bark tier-1: *"ê, dạo này bánh nhạt hơn hay tại tao?"*. Đây là **hàng phòng thủ chính**, doc P2 phải nhận tiếp |
| R4 | **Người chơi dùng `UNDER_COUNTER` làm chỗ trốn** | Luật zone bất di (§2.1): `UNDER_COUNTER` không chứa thao tác ảnh hưởng chất lượng. Kiểm bằng test tĩnh ở §6 |
| R5 | **`FLOURISH` trượt thành QTE** trong lúc tune | Bốn khoá ở §2.9 là **ràng buộc kiến trúc, không phải hướng dẫn**: không tồn tại event `FLOURISH_FAILED`, không tồn tại prompt asset. Code review bắt buộc |
| R6 | **`FLOURISH` trở thành đường bù trừ lỗi** | Salience 15 (thấp nhất danh mục) + `norepeat` 90 s + không chạm tiền. Không có công thức nào cộng flourish vào để trừ defect |
| R7 | **Cao điểm thành trừng phạt** → mất chất cozy, phản lại định vị | Biên 1,35×. Cộng: chế độ "một khách một lượt" và chế độ không giới hạn thời gian (CANON §15) **không bị khoá khỏi nội dung nào** |
| R8 | **Rửa tay bị bỏ qua vì quá đắt** → `DIRTY_HANDS` thành thuế cố định | Cho một lối thoát **có kỹ năng**: hai tay riêng biệt. Người chơi giỏi gần như không bao giờ phải rửa. Người chơi mới rửa nhiều. Chênh lệch đó **chính là** đường cong kỹ năng |
| R9 | **Cô Ba trượt thành hệ thống phạt** (vi phạm CANON §7.4) | Mọi phản ứng của cô Ba trong §2.7 là **thoại + prop**, không trừ một con số nào. Không có biến `coBaDisappointment`. Nếu cần trạng thái, dùng `applycontext` có `duration` (CANON §11) |
| R10 | **Trailer vô tình dùng cảnh nhặt bánh** | CANON §7.6. Ghi vào brief P6. Nhân vật **không có animation nhặt đồ từ đất** — asset đó không tồn tại nên không quay được |
| R11 | **Ổ bánh chế bậy bị hiểu là game cười người Việt** (CANON §14.1 lằn ranh đỏ) | Kết hợp bậy bị **chặn ở tầng dữ liệu**: `FillId` là enum đóng, không có nguyên liệu ngoại lai. Không có "sáng tạo món". Người chơi làm bánh mì, không chế bánh mì |
| R12 | **Kéo-thả nguy hiểm hơn chạm-để-đặt** → trợ năng thành "chế độ dễ" | Clamp `jerk` (§2.5 luật 1). Test parity ở §6 |
| R13 | **Thao tác nhàm sau ngày 10** | Chính là lý do tồn tại của §2.6. Nếu tester ngày 10 nói "chỉ lặp lại", vấn đề nằm ở preset chưa đủ răng chứ không phải ở việc thiếu thao tác mới — **không** thêm bước làm bánh thứ 12 |

**Nối §16 (Ba thứ đừng làm):** doc này không mô phỏng gì sâu hơn cái người chơi nhìn thấy một tầng (Đừng-1); không roll xác suất ở bất kỳ tick nào (Đừng-2); `FLOURISH`/`grip` không đổi **category** hay **intensity** của bất kỳ hệ quả nào (Đừng-3); biến dạng ổ bánh lúc gói dùng lerp 2 frame chứ không vẽ frame-by-frame (Đừng-4).

---

## 8. Truy vết

| Nội dung | `idea.md` | `CANON.md` |
|---|---|---|
| Vòng lặp một ca bán, chuỗi thao tác làm bánh | §12.2 (dòng 495–512) | §0, §3 |
| 4 zone + bảng `visibility` + công thức `certainty` | — | **§5** |
| Hiệu chỉnh 1,4 s / 28 s | — | §5 (Hiệu chỉnh kiểm tra) |
| `BURNT_OR_COLD`, `DROPPED_FOOD`, `DIRTY_HANDS`, `ORDER_DEFECT`, `FLOURISH` | §21 | **§3.1, §3.2** |
| Phán quyết vệ sinh: bắt buộc bỏ, không nhặt, không thưởng gian dối | — | **§7.1–7.2, §7.6** |
| Cô Ba là người dạy, không phải hệ thống phạt | §12 | **§7.4** |
| Ngôn ngữ gọi món, danh sách nhân và rau chuẩn Sài Gòn | **§19.3** (dòng 955–958) | **§14** |
| Công thức tham số hoá + preset + khẩu vị ẩn + "3 preset / 12 khẩu vị" | **§22 mục 1** (dòng 1044–1046) | §10 (tinh thần Trục B) |
| Thông lượng cao điểm 1 lò 2 tay 6h30–8h | **§22 mục 3** (dòng 1047) | **§13.3** |
| Hạn dùng (đồ chua đỉnh ngày 3, gắt ngày 7) | §22 mục 1 | §13.1 |
| Chạm-để-đặt + Hoàn tác + xác nhận trước khi đưa — ba cái đi chung | **§20 mục 5** (dòng 1010) | **§15.5** |
| Pause mọi lúc, chế độ không giới hạn thời gian | §20 mục 2 | §15.2 |
| Icon khác nhau về hình dáng | §20 (dòng 1012) | §15 |
| Micro-cheat lặp vô hạn | §21 | **§8 mục g** |
| Diminishing returns khi spam hành vi tăng trust | §21 | §8 mục i |
| Autosave ngay khi sự kiện xảy ra, seed theo ngày | §21 | §8 mục e |
| Mutation `DROPPED_FOOD → "bán đồ rơi xuống đất"` | — | §12 |
| Lằn ranh đỏ: không hạ thấp nghề, không làm sai món Việt | §19.4 | §14.1 |
| Layered sprite, biến dạng 1–2 frame | — | §16 (Đừng-4) |

---

## 9. Đề xuất sửa CANON

**Đ1. Bổ sung sàn `visibility` khi có mùi.** CANON §3.1 ghi `BURNT_OR_COLD` *"có mùi → bán kính nhận thấy rộng hơn"* nhưng không nói rộng bằng cách nào, trong khi §5 khẳng định `visibility` là **bảng tra tĩnh O(1)**. Đề xuất thêm một dòng vào §5:

> *Ngoại lệ mùi:* với `BURNT_OR_COLD` nhánh cháy (`crust > 1.0`), giá trị tra được lấy `max(v, 0.55)` cho mọi slot ở zone `OVEN`. Đây là ngoại lệ **duy nhất** của bảng tra; không mở thêm ngoại lệ nào khác.

**Đ2. Ghi nhận `grip` như một hằng số thiết kế của T5.** T5 nói *"người chơi phải đọc được rủi ro trước khi hành động"* nhưng CANON chưa có cơ chế nào hiện thực hoá điều đó cho các sự kiện **do thao tác sinh ra** (§5 chỉ lo phía NPC quan sát). Đề xuất thêm vào §5 hoặc §3.1 một dòng:

> Rủi ro phía người chơi (rớt, cháy, nguội) phải có **đại lượng liên tục hiện ra trước**, chia bậc rời rạc. Không sự kiện tiêu cực nào được phép xảy ra mà không có tín hiệu cảnh báo đi trước ít nhất 0,8 s.

**Đ3. Làm rõ ranh giới `ORDER_DEFECT` ↔ lệch khẩu vị.** §3.1 định nghĩa `ORDER_DEFECT` là *"thiếu món đã gọi / bỏ thứ khách cấm / sai tỉ lệ"*. Vế **"sai tỉ lệ"** hiện nhập nhằng với hệ preset: nếu mọi lệch tỉ lệ đều là defect thì preset không bao giờ dùng được. Đề xuất sửa §3.1 thành:

> `ORDER_DEFECT` = thiếu món đã gọi / bỏ thứ khách cấm / **sai mức khách đã NÓI RA** (*"cho ít rau"*, *"nhiều ớt"*).
> Lệch **khẩu vị ẩn** (khách chưa từng nói) **không** phải `ORDER_DEFECT` — chỉ hạ `satisfaction` ngầm và tích luỹ qua §8 mục g.

**Đ4. Số preset (3) và số slot lò (3) nên được ghi vào CANON** như hằng số v1 để các doc P3 (nâng cấp thiết bị) không tự ý đổi. Đề xuất thêm hai dòng vào §13.3.
