# P0-02 — Thời gian, RNG và Save

> ## ⚡ REVAMP 2026-10-20 — ⚠️ CHẾT MỘT PHẦN
> Căn cứ: [`CANON.md`](../CANON.md) bản revamp. Phần ☠️ không dùng làm căn cứ.
>
> | Mục | Trạng thái | Lý do / thay bằng |
> |---|---|---|
> | §2.1 Tổng một mùa (40 ngày ≈ 6,8 giờ) · `SEASON_DAYS` · tiêu chí "40 ngày ≥ 4 giờ" | ☠️ | Bỏ trần ngày. Thay bằng thời gian chơi tới mốc thắng, chốt bằng mô phỏng (R5) |
> | §2.1 Khung ngày: chợ → bán → tối (sổ tay) | 🔁 | Chợ → nhà cung cấp (R3); cảnh tối bỏ sổ tay. Số phút/ngày ⏳ đo lại |
> | §2.3 Stream `gossip` + lập luận "đốt RNG reroll tin đồn" · `GOSSIP_UNLOCK_MINUTES` | 🔁 | Đồn thổi chết. Stream đổi vai thành `review` (R4); luật tách stream vẫn giữ |
> | §2.3 Stream `market` | 🔁 | Thành giá nhà cung cấp biến động (R3) |
> | §2.5 Save: `relationPoints`, `tier`, `trustCeiling`, `memory`, `arcState`, `usualOrder`, `gossip`, `notebook`, `debtsOwedToPlayer` (sổ nợ), lịch sử "40 dòng cuối mùa" | ☠️ | Quan hệ, trí nhớ, arc, "như mọi bữa", sổ tay, sổ nợ chết. Thêm sao + review + nhà cung cấp + mở khoá topping (R2–R4) |
> | §2.6 Trigger autosave `gossip:seeded`, `relationship:tierChanged` · §2.7 ví dụ migration `trustCeiling` | ☠️ | Thay bằng trigger review mới / sao đổi (R4) |
> | §2.8 Nút "Chơi lại ngày này" | 🔁 | Phải xét lại khi có thua ATTP vĩnh viễn (R4). Câu giải thích "đúng giọng cô Ba" ☠️ — Cô Ba bị bỏ (R0.5) |
> | §5 Hằng số kích thước save, `TIME_SCALE_*`, `REAL_MIN_PER_DAY` | ⏳ | Đo lại sau khi schema mới chốt |
>
> **Còn dùng được:** đồng hồ một nguồn, pause đóng băng kiên nhẫn + certainty, RNG seed theo ngày + tách stream, shuffle-bag, autosave sau mỗi khách, double-buffer A/B, migration, chống save-scum — dùng nguyên cho R1–R5.

**Thuộc phase:** P0 — Nền tảng
**Phụ thuộc:** `P0-01` (kiến trúc, EventBus, `GameContext`) · `CANON.md` §2 (save/localStorage/autosave), §5 (certainty), §8e (save-scum), §11 (shuffle-bag), §12 (memory/gossip), §13 (kinh tế, cao điểm 6h30–8h), §15.2 (pause đóng băng kiên nhẫn)
**Trạng thái:** **Chốt** về cơ chế · **Cần đo** các hằng số `TIME_SCALE_*` (xem `P0-03`)

---

## 1. Mục tiêu

Ba thứ hạ tầng mà mọi hệ khác đứng lên: **một đồng hồ duy nhất**, **một nguồn ngẫu nhiên tất định duy nhất**, **một save ghi sau mỗi khách**.

Chúng phục vụ trực tiếp **T5** (attention nhìn thấy được — `certainty` tích luỹ theo `dt`, nên `dt` phải là một khái niệm được kiểm soát chứ không phải `delta` của trình duyệt) và **T4** (một mùa có điểm kết — phải trả lời được bằng con số *40 ngày = bao nhiêu giờ thật*).

Và chúng là cách bịt lỗ hổng ăn gian **§8e (save-scum)**, thứ mà `idea.md` gọi là *"giết game nhanh nhất, đặc biệt trên web nơi save nằm ở localStorage"*.

---

## 2. Cơ chế

### 2.1. Đồng hồ game

**Khung một ngày:** chợ (theo lượt) → bán 06:00–11:00 (theo đồng hồ) → tối (theo lượt).

Đồng hồ **chỉ trôi trong `StallScene`**. `MarketScene` và `EveningScene` chạy theo lượt: người chơi cân nhắc bao lâu tuỳ ý, không bị đuổi. Đây là quyết định thiết kế, không phải tiện tay: áp lực thời gian là **đặc sản của giờ cao điểm** (§13.3 *"đông khách = nhiều mắt nhìn hơn + áp lực làm nhanh = dễ ẩu"*), còn đi chợ là lúc **suy nghĩ**. Cho đồng hồ chạy ở chợ là đem áp lực sai chỗ.

**Quy đổi:** `TIME_SCALE` = số **phút game** trôi trong **1 phút thật**.

| Khung (`TimeBand`) | Giờ game | Dài (phút game) | `TIME_SCALE` khi **có khách** | `TIME_SCALE` khi **quầy trống** | Phút thật ước tính |
|---|---|---|---|---|---|
| `PRE_OPEN` | 06:00–06:30 | 30 | 30 | 30 | **1,0** |
| `PEAK` | **06:30–08:00** | 90 | **30** | 30 | **3,0** |
| `MID` | 08:00–09:30 | 90 | 30 | **60** | **≈2,25** |
| `LULL` | 09:30–11:00 | 90 | 30 | **120** | **≈1,5** |
| | | **300** | | | **≈7,75 phút thật** |

**Luật đơn giản đằng sau bảng:** `TIME_SCALE_BASE = 30` (1 giây thật = 30 giây game) **bất cứ khi nào có ít nhất một khách đang ở quầy hoặc đang trong hàng chờ**. Chỉ khi **quầy trống hoàn toàn** thì giờ vắng mới tua nhanh. Không có nút "tua nhanh" thủ công — nó tự tua, và nó chỉ tua khi không có gì để bỏ lỡ.

```ts
function currentScale(ctx: GameContext): number {
  if (ctx.clock.paused) return 0;
  if (ctx.world.stall.customerCount > 0) return TIME_SCALE_BASE;   // 30
  switch (ctx.clock.band) {
    case 'PRE_OPEN': return 30;
    case 'PEAK':     return 30;    // cao điểm KHÔNG BAO GIỜ tua — kể cả lúc trống,
                                   // vì khách kế tiếp tới trong vài giây
    case 'MID':      return 60;
    case 'LULL':     return 120;
  }
}
```

**Cao điểm 6h30–8h chậm lại** không phải vì `TIME_SCALE` nhỏ hơn, mà vì **cao điểm luôn có khách** → không bao giờ vào nhánh tua nhanh. Đây là cách cài đặt trung thực hơn: nhịp chậm lại vì *có việc để làm*, không vì đồng hồ bị bóp.

**Một khách = bao nhiêu:** ở `TIME_SCALE 30`, một lượt khách ~25 giây thật ≈ **12,5 phút game**. 300 phút game/ngày ⇒ trần ~24 lượt khách/ngày. Khớp với dàn 12 NPC có tên + khách vãng lai.

**Tổng một ngày và tổng một mùa** (con số phải trả lời được — §23 tuần 1–2):

| Khung | Phút thật |
|---|---|
| `MarketScene` (theo lượt) | ~1,5 |
| `StallScene` | ~7,75 |
| `EveningScene` (đếm tiền + sổ tay) | ~1,0 |
| **Một ngày thường** | **≈10,25** |
| Ngày 1–3 (dạy luật, ×1,6) | ≈16,4 |
| **40 ngày** | **≈6,8 giờ** (ước tính thiết kế) |

> ⚠️ **6,8 giờ là con số TÍNH RA, không phải con số ĐO ĐƯỢC.** `P0-03` có nhiệm vụ đo thật. Ngưỡng §23: **dưới 4 giờ tổng → giảm số ngày, tăng mật độ**. Nếu đo ra > 9 giờ → giảm `TIME_SCALE` tua nhanh hoặc cắt số ngày, vì một game cozy $9.99 dài quá 9 giờ sẽ có người bỏ dở trước khi tới cú quay lại ngày 40 — và **cú quay lại ngày 40 là toàn bộ điểm kết** (§23 "Giữ nguyên").

**Cài đặt:**

```ts
// core/clock.ts — NGUỒN THỜI GIAN DUY NHẤT.
// Không hệ nào khác được đọc `delta` của Phaser, được gọi Date.now(),
// hay được tự giữ một bộ đếm giây.
export class Clock {
  private gameMin = 6 * 60;        // 06:00
  paused = false;
  band: TimeBand = 'PRE_OPEN';

  /** Gọi đúng 1 lần/frame, ở bước 0 của StallScene.update (P0-01 §2.4). */
  advance(rawDeltaMs: number): number {
    if (this.paused) return 0;                       // ← đóng băng TẤT CẢ
    const dt = Math.min(rawDeltaMs, 100) / 1000;     // kẹp: tab bị nền lại không nhảy 5 giây
    const before = this.band;
    this.gameMin += dt * (currentScale(ctx) / 60);
    this.band = bandOf(this.gameMin);
    if (this.band !== before) bus.emit('clock:bandChanged', { from: before, to: this.band });
    bus.emit('clock:tick', { dt, gameMinutes: this.gameMin, hhmm: fmt(this.gameMin) });
    return dt;                                       // ← dt THẬT (giây), chưa nhân scale
  }
}
```

**Hai loại `dt`, không được nhầm:**

| | Dùng cho | Giá trị |
|---|---|---|
| `dt` (giây thật) | `certainty` tích luỹ, kiên nhẫn khách, tween, delay bark, nướng bánh | `advance()` trả về |
| `gameMin` (phút game) | Lịch NPC, hạn dùng, khung giờ, giá chợ, sổ cái | Trạng thái nội bộ của `Clock` |

`certainty` **phải** dùng `dt` thật, không dùng phút game. Lý do: CANON §5 hiệu chỉnh *"`DROPPED_FOOD` (75) × khách nhìn thẳng → `CONFIRMED` sau ~1,4 giây"* — 1,4 **giây người chơi ngồi trước màn hình**, khớp với con số phản ứng go/no-go 0,38 s của Rabin và với timer hai chiều ~1–2 s của The Last of Us. Nếu đem nhân với `TIME_SCALE` thì nó thành 42 giây game và mọi hiệu chỉnh sụp.

### 2.2. Pause — đóng băng CẢ sự kiên nhẫn khách

CANON §15.2: *"Pause được mọi lúc, kể cả giữa lúc kéo nguyên liệu và giữa lúc khách đang nói. Pause đóng băng **cả sự kiên nhẫn của khách**."*

Cách bảo đảm điều đó không bao giờ hỏng: **có đúng một điểm trả `dt = 0`** (§2.1). Mọi hệ nhận `dt` từ trên xuống và tự đứng im. **Không hệ nào được tự hỏi "có đang pause không"** — nếu có 12 chỗ kiểm tra cờ pause thì sớm muộn có một chỗ quên, và cái quên đó sẽ là "khách vẫn bực dần trong lúc mình đang đọc menu trợ năng".

Danh sách phải đóng băng, kiểm từng mục:

| Thứ | Đóng băng bằng |
|---|---|
| Đồng hồ game | `advance()` return 0 |
| `obs.certainty` (tích luỹ **và** decay) | `perception.tick(dt=0)` |
| Kiên nhẫn khách → `MADE_THEM_WAIT` | `npc.tick(dt=0)` |
| Bộ đếm rời quầy (`SILENT_EXIT`) | `npc.tick(dt=0)` |
| Delay bark 0,2–0,4 s | `dialog.tick(dt=0)` |
| Bánh đang nướng → `BURNT_OR_COLD` | `craft.apply(dt=0)` |
| `gazeFactor` đang đếm ngược (cửa sổ điện thoại 2–3 s) | `npc.tick(dt=0)` |
| Tween Phaser | `scene.tweens.pauseAll()` |
| Âm thanh vòng lặp đường phố | fade, không dừng khựng |

**Không** đóng băng: menu, con trỏ, nút cuộn sổ tay, preview cỡ chữ.

**Chế độ không giới hạn thời gian** (CANON §15.2 — khách vẫn bỏ đi vì bạn làm **sai**, không bao giờ vì bạn **chậm**):

```ts
if (flags.a11y.noTimePressure) {
  patienceDrainMul = 0;                 // kiên nhẫn không tụt
  salienceOf.MADE_THEM_WAIT = 0;        // sự kiện này tắt hẳn
  clock.scaleMul = 0.5;                 // đồng hồ vẫn trôi, chậm một nửa
  // certainty VẪN chạy bình thường — lỗi vẫn là lỗi, mắt vẫn là mắt.
}
```
Tắt `MADE_THEM_WAIT` không làm sụp §8a (farm cửa sổ điện thoại): ở chế độ này, "câu giờ" vẫn tốn **bánh nguội** và vẫn tốn **hàng chờ dài ra** (khách sau đến gần hơn = slot tốt hơn = `visibility` cao hơn). Giá của việc chờ đổi từ *kiên nhẫn* sang *vận hành* — đúng tinh thần XĐ1.2.

### 2.3. RNG — seed cố định theo ngày, tách stream

**Hạt giống:**

```ts
daySeed = hash32(`${saveId}|${dayIndex}`)          // FNV-1a 32-bit
streamSeed(name) = splitmix32(daySeed ^ hash32(name))
```

`saveId` là UUID sinh **một lần** lúc tạo save mới và **không bao giờ đổi**. Hai người chơi khác nhau có ngày 7 khác nhau; cùng một người chơi, ngày 7 luôn là ngày 7 đó.

**Sáu stream độc lập** — mỗi stream là một PRNG riêng với bộ đếm riêng:

| Stream | Quyết định cái gì | Vì sao phải tách |
|---|---|---|
| `market` | Giá chợ hôm nay, hàng có/hết, sự kiện (dịch heo → pate +40% trong 5 ngày) | Người chơi đi chợ lâu hay nhanh **không được** làm đổi giá |
| `npc-schedule` | Ai đến, giờ nào (variance quanh giờ chuẩn), thứ tự, tâm trạng nền (§9.2 mục 20: *khách vừa bị sếp mắng*) | Người chơi phục vụ nhanh hay chậm **không được** làm đổi việc chú Tư có ra hay không |
| `dialog-shufflebag` | Trộn bag biến thể thoại, roll `odds` của rule, `norepeat` | Hệ tiêu thụ nhiều số nhất — phải bị cô lập |
| `gossip` | Ai kể cho ai, hop nào mutate, `confidence` mỗi hop | **Đây là hệ dễ bị ăn gian nhất.** Xem bên dưới |
| `ambient` | Xe máy chạy qua, tiếng rao, mây, nhịp mưa | Thuần trang trí. Tách ra để tắt "giảm chuyển động" (§15.3) không làm lệch bất cứ thứ gì |
| `event` | Sự kiện ngày hiếm (khách tự đứng bán hộ, mở hàng nặng vía) | Ít lần gọi, cần tuyệt đối ổn định |

**Vì sao tách stream là ĐIỀU KIỆN của việc chống save-scum (§8e), không phải chuyện gọn gàng:**

Giả sử dùng **một** stream chung. Người chơi bị đồn xấu ở tối ngày 12. Họ reload đầu ngày 12 và chơi lại **y hệt**, chỉ khác một chỗ: hỏi bà Bảy thêm **một** câu ("hỏi một câu" là công cụ hạ attention hợp lệ, CANON §5.4). Câu hỏi đó tiêu thêm 2–3 số từ stream chung → **toàn bộ chuỗi số sau đó dịch đi** → tối hôm đó `gossip` roll ra kết quả khác.

Kết quả: người chơi khám phá ra rằng **một hành động vô hại có thể reroll tin đồn**, và §8e sụp — không phải qua reload, mà qua "đốt RNG". Đây đúng là kiểu lỗ hổng mà `idea.md` §21 nói Minh *"sẽ thử hết, và sẽ viết lên Reddit"*.

Tách stream bịt điều đó: số mà `dialog-shufflebag` tiêu **vô hình** với `gossip`. Muốn đổi kết quả đồn thổi thì phải đổi **cái thực sự gây ra nó** — tức là đừng làm rớt bánh trước mặt bà Bảy.

Ràng buộc phụ, quan trọng không kém: **stream `gossip` chỉ được tiêu số ở đúng một thời điểm trong ngày** — tick 1 lần/ngày lúc `evening:done` (CANON §12, §18.5). Một hệ chỉ tiêu RNG ở một thời điểm cố định thì số lần gọi không phụ thuộc vào cách người chơi chơi, nên **tất định tuyệt đối**.

```ts
// core/rng.ts
export type StreamName = 'market'|'npc-schedule'|'dialog-shufflebag'|'gossip'|'ambient'|'event';

export class RngHub {
  private streams = new Map<StreamName, Splitmix32>();

  /** Gọi lúc 'day:started'. Reset TẤT CẢ stream về đầu ngày. */
  beginDay(saveId: string, dayIndex: number) {
    const daySeed = hash32(`${saveId}|${dayIndex}`);
    for (const name of ALL_STREAMS)
      this.streams.set(name, new Splitmix32(splitmix32(daySeed ^ hash32(name))));
  }

  next(s: StreamName): number { return this.streams.get(s)!.nextFloat(); }   // [0,1)
  int (s: StreamName, n: number) { return Math.floor(this.next(s) * n); }
  pick<T>(s: StreamName, xs: readonly T[]): T { return xs[this.int(s, xs.length)]; }

  /** Bộ đếm phải vào save — reload giữa ngày không được reset về đầu ngày. */
  toJSON() { return [...this.streams].map(([k, v]) => [k, v.counter]); }
  fromJSON(saveId, dayIndex, counters) { this.beginDay(saveId, dayIndex);
    for (const [k, c] of counters) this.streams.get(k)!.skipTo(c); }
}
```

`skipTo(counter)` là lý do chọn **splitmix32** thay vì xorshift: splitmix là counter-based, nhảy tới lần gọi thứ *n* là **O(1)**, không phải quay lại chạy *n* bước. Reload giữa ngày trở nên rẻ và chính xác.

**Luật tuyệt đối (CANON §12, Đừng-3):** ngẫu nhiên và tin đồn được đổi **thoại, dáng đi, món gọi, tip, thứ tự đến**. **KHÔNG** được đổi: công thức có ra đúng món không, tiền có vào túi không, cốt truyện có unlock được không. Nghĩa là: `rng` **không bao giờ** được gọi trong `craft/`, `econ/ledger.ts`, hay bất cứ nhánh nào quyết định hệ quả. CI chặn bằng grep.

### 2.4. Shuffle-bag

**Toán học — vì sao đây là đòn bẩy rẻ nhất dự án** (CANON §11, `idea.md` §18.7):

Với **8 biến thể** và random thuần, bài toán sinh nhật cho: xác suất nghe lại một dòng đã nghe đạt **~50% sau chỉ ~3,4 lần** ( E[số lần tới khi trùng] ≈ √(π·8/2) + 2/3 ≈ **3,5** ). Người chơi nghe 4 câu và đã cảm thấy game lặp.

Shuffle-bag biến 8 biến thể thành **8 lần phát chắc chắn không trùng**. Cảm giác thu được tương đương **~25–30 dòng random**. Đổi lại: **không viết thêm một dòng nào**.

Sarah (§16 HT6): *"nghe lại một dòng thoại trong 2 giờ đầu → tôi biết hệ thống của bạn nông... Refund."* Shuffle-bag là thứ rẻ nhất ngăn điều đó.

**Cài đặt chuẩn:**

```ts
// dialog/shufflebag.ts
export class ShuffleBag {
  private order: number[] = [];      // hoán vị còn lại của [0..n-1]
  private lastDrawn = -1;            // chống "trùng qua mép túi"
  refills = 0;

  constructor(readonly id: string, readonly n: number) {}

  draw(rng: RngHub): number {
    if (this.order.length === 0) this.refill(rng);
    return (this.lastDrawn = this.order.pop()!);
  }

  private refill(rng: RngHub) {
    this.order = [...Array(this.n).keys()];
    // Fisher–Yates, LUÔN dùng stream 'dialog-shufflebag'
    for (let i = this.n - 1; i > 0; i--) {
      const j = rng.int('dialog-shufflebag', i + 1);
      [this.order[i], this.order[j]] = [this.order[j], this.order[i]];
    }
    // Mép túi: nếu phần tử sẽ rút đầu tiên trùng phần tử vừa rút cuối túi trước,
    // đổi chỗ nó với phần tử kế. Không refill lại (refill lại làm lệch phân phối
    // VÀ tiêu số RNG không xác định được -> hỏng tính tất định).
    if (this.n > 1 && this.order[this.n - 1] === this.lastDrawn)
      [this.order[this.n - 1], this.order[this.n - 2]] =
      [this.order[this.n - 2], this.order[this.n - 1]];
    this.refills++;
  }

  toJSON() { return { o: this.order, l: this.lastDrawn, r: this.refills }; }
}
```

**Ba chi tiết dễ làm sai:**

1. **Luật mép túi.** Không có nó, hai túi liền nhau có thể cho ...`5` | `5`... — đúng cái người chơi để ý nhất. Sửa bằng **hoán vị tại chỗ**, không bằng trộn lại: trộn lại tiêu thêm số RNG với số lần không đoán trước được → mất tất định.
2. **Trộn lúc *refill*, không lúc *draw*.** Số lần gọi RNG trên mỗi túi là hằng số `n-1`. Đây là điều kiện để `skipTo()` ở §2.3 đúng.
3. **Khoá bag.** `bagId = ${ruleId}:${responseId}` cho biến thể thoại; `bagId = generic:${concept}:${npcId}` cho pool generic dùng chung 12 NPC (CANON §11 đòn bẩy 2). **Bag là per-NPC**, không dùng chung — nếu chung thì bà Bảy "dùng hết" biến thể của chú Tư.

**Persist:** toàn bộ bag vào save, **không reset theo ngày**. Bag phải sống qua ngày, nếu không thì mỗi sáng đều nghe lại đúng các dòng quen thuộc và cả cơ chế vô nghĩa. Ước tính ~250 bag × ~50 B ≈ **12 KB** — chấp nhận được.

Dọn rác: bag không được chạm trong **7 ngày game** thì xoá khỏi save (state của nó sẽ được dựng lại rỗng, không ai nhận ra). Giữ save không phình theo thời gian.

### 2.5. Save schema

```ts
// core/save.ts
export const SCHEMA_VERSION = 1;

export type SaveFile = {
  schemaVersion: number;
  saveId: string;                     // UUID, cố định đời đời — hạt giống của mọi RNG
  createdAt: string;  savedAt: string;
  buildId: string;                    // git sha — để lọc bug report
  checksum: string;                   // FNV-1a của payload. Phát hiện HỎNG, không chống SỬA (§8f)

  progress: {
    dayIndex: number;                 // 1..40
    band: TimeBand;
    gameMinutes: number;              // vị trí đồng hồ trong ngày
    scene: SceneKey;                  // reload vào đúng chỗ đang đứng
    weather: Weather;
    standPoint: StandPointId;         // CHỖ ĐỨNG của cái xe (CANON §10)
    dayStartSnapshotRef: string | null;// khoá của bản chụp đầu ngày (§2.7)
  };

  rng: {
    counters: [StreamName, number][]; // vị trí từng stream — reload giữa ngày không reset
  };

  money: {
    cash: number;
    debtsOwedToPlayer: { npcId: NpcId; amount: number; sinceDay: number }[];  // sổ nợ (§14)
    debtsPlayerOwes:   { kind: ObligationKind; amount: number; dueDay: number }[];
    qrEnabled: boolean;
  };

  inventory: {
    items: { itemId: ItemId; qty: number; boughtOnDay: number;
             quality: number; supplierId: string }[];   // boughtOnDay → tính hạn dùng
    fridgeCapacity: number;                              // §8j: hạn dùng + sức chứa tủ
  };

  equipment: { owned: EquipId[]; installed: EquipId[]; wear: Record<EquipId, number> };

  suppliers: Record<string, {                            // tái dùng engine tính cách (§22.2)
    personality: Personality; relationPoints: number; tier: RelTier;
    memory: MemorySlot[]; lastBoughtDay: number; streakDays: number;
  }>;

  /** 12 NPC — state đầy đủ. Đây là phần nặng nhất và quan trọng nhất của save. */
  npcs: Record<NpcId, {
    personality: Personality;                            // soi / nongTinh / deTha / thanThien
    relationPoints: number;
    tier: RelTier;                                       // RIVAL | ACQUAINTANCE | FRIEND
    trustCeiling: number;                                // §8d: đốt rồi để nguội -> HẠ TRẦN VĨNH VIỄN
    visitCount: number; lastSeenDay: number;
    memory: {
      short: MemorySlot[];                               // 6–8 slot
      long:  MemorySlot[];                               // 3–4 slot
      core:  MemorySlot | null;                          // 1 slot, một lần duy nhất
    };
    schedule: { baseHhmm: string; daysOfWeek: number[];
                arcState: string; arcDayOffset: number }; // chú Tư biến mất ~ngày 30
    knownFacts: { factId: string; confidence: number;
                  source: NpcId | 'WITNESSED'; hop: number; learnedOnDay: number }[];
    usualOrder: OrderSpec | null;                        // "như mọi bữa"
    microCheatCounter: Record<ItemId, number>;            // §8g — phát hiện theo PATTERN
    gone: boolean; goneReason?: 'ARC'|'SILENT_EXIT'|'MOVED';
  }>;

  gossip: {
    inFlight: { factId: string; origin: NpcId; holders: NpcId[];
                hop: number; confidence: number; mutatedFrom?: string;
                createdOnDay: number }[];
    unlockedAtMinutes: number;                            // §12r6: không xảy ra trong 2 GIỜ CHƠI ĐẦU
  };

  shuffleBags: Record<string, { o: number[]; l: number; r: number }>;

  dialogState: {
    spokenOnce: string[];                                 // speakonce
    norepeat:   Record<string, number>;                   // ruleId -> dayIndex lần cuối
    appliedContext: { key: string; value: unknown; expiresAtMinutes: number }[];  // applycontext có duration
    barkCooldowns: Record<string, number>;
  };

  /** Sổ tay NGƯỜI CHƠI tự ghi — HT2, "mặt phẳng để người chơi NHẬN RA hệ thống" */
  notebook: {
    entries: { npcId: NpcId; field: string; value: string;
               writtenOnDay: number; byPlayer: true }[];
    hypotheses: { id: string; npcId: NpcId; text: string;
                  status: 'OPEN'|'CONFIRMED'|'WRONG'; resolvedOnDay?: number }[];
    pinned: NpcId[];
  };

  stall: { cleanliness: number; layoutSide: 'LEFT'|'RIGHT'; presets: RecipePreset[] };  // tối đa 3 preset

  ledger: { day: number; revenue: number; cost: number;
            served: number; lost: number }[];             // 40 dòng, để vẽ biểu đồ cuối mùa

  /** MỌI công tắc trợ năng — CANON §15 */
  a11y: {
    fontScale: 1 | 1.25 | 1.5 | 2;                        // 4 mức
    opaqueDialogBg: boolean;
    textNeverAutoAdvance: true;                           // hằng số, không cho tắt
    reduceMotion: { bikes: boolean; crowd: boolean; leaves: boolean;
                    screenShake: boolean; sceneSlide: boolean };
    volume: { music: number; street: number; voice: number; foley: number; ui: number };
    muteNegativeCues: boolean;
    tapToPlace: boolean; undoEnabled: boolean; confirmBeforeServe: boolean;  // ba cái đi chung
    noTimePressure: boolean;
    /* 6 công tắc bắt buộc */
    npcMisremember: boolean;
    oneCustomerAtATime: boolean;
    leaveNote: boolean;                                   // khách biến mất -> "họ để lại lời nhắn"
    eveningNotebook: boolean;
    crowdNoiseSeparate: boolean;
    errorFeedback: boolean;                               // rung, nháy đỏ
    /* phụ */
    iconLabels: boolean; subtitleEn: boolean;
  };

  telemetry: { optedIn: boolean; sessionCount: number; totalPlayMs: number };  // P0-03
  flags: Record<string, boolean | number | string>;       // cờ cốt truyện, tutorial đã qua
};

export type MemorySlot = {
  id: string; kind: StimId; intensity: number;
  createdOnDay: number; lastTouchedDay: number;
  stackIndex: number;                                     // n -> góp 0.75^(n-1)
  source: 'WITNESSED' | 'TOLD_BY';  toldBy?: NpcId; confidence: number;
};
```

**Ước tính kích thước (Cần đo):**

| Phần | ~KB |
|---|---|
| `npcs` (12 × ~1,2 KB) | 15 |
| `shuffleBags` (~250 bag) | 12 |
| `notebook` | 8 |
| `inventory` + `equipment` + `suppliers` | 6 |
| `gossip` + `dialogState` | 4 |
| `ledger` + `a11y` + `flags` + `progress` + `rng` | 3 |
| **Tổng JSON** | **≈48 KB** |

`localStorage` cho phép ~5 MB/origin ⇒ 48 KB × (A + B + meta + 1 manual) ≈ 150 KB, thoải mái. **Cảnh báo khi vượt 512 KB**, **chuyển sang IndexedDB khi vượt 1 MB** (phòng trường hợp `notebook` phình do người chơi ghi nhiều).

### 2.6. Autosave sau mỗi khách — ghi không giật frame

**Vì sao sau mỗi khách chứ không sau mỗi ngày** (CANON §2, §8e): autosave theo ngày cho người chơi một cửa sổ cả ngày để reload. Autosave **ngay khi sự kiện xảy ra** làm cửa sổ đó biến mất.

**Kích hoạt:**

| Sự kiện | Lý do |
|---|---|
| `npc:left` (mọi `reason`) | Mốc "sau mỗi khách" chính |
| `perception:confirmed` | **Ngay khi bị bắt quả tang.** Đây là cú ghi quan trọng nhất của cả §8e |
| `gossip:seeded`, `relationship:tierChanged` | Hệ quả không lấy lại được |
| `scene:transition`, `money:changed` (≥ ngưỡng), `obligation:due` | Mốc lớn |
| Mất focus cửa sổ / `beforeunload` / thoát app | Ghi đồng bộ, ép ngay |

**Chi phí đo được (Cần đo trên máy chuẩn):**

| Bước | Ước tính | Trần cứng |
|---|---|---|
| Dựng snapshot (gom object thuần) | 0,4 ms | 1,0 ms |
| `JSON.stringify` 48 KB | 0,3–0,8 ms | 2,0 ms |
| `localStorage.setItem` 48 KB (**đồng bộ**) | 0,5–2,0 ms | 3,0 ms |
| `fs.writeFile` + `rename` (Electron) | bất đồng bộ | — |
| **Tổng chặn main thread** | **≈1–3 ms** | **5 ms** |

3 ms trên ngân sách 33,3 ms là 9% — không chết ngay, nhưng nó rơi **đúng lúc khách vừa rời đi và khách sau vừa tới**, tức là đúng lúc đông nhất. Nên tách ra:

```ts
// core/save.ts
class SaveService {
  private pending: SaveFile | null = null;
  private idleHandle = 0;
  private slot: 'A' | 'B' = 'A';

  request(reason: AutosaveReason) {
    // 1) Chụp NGAY trong frame (rẻ, và phải chụp đúng khoảnh khắc này)
    this.pending = buildSnapshot(ctx);                       // ≤ 1 ms
    bus.emit('save:autosaveRequested', { reason });

    // 2) Gộp: nhiều request trong <500 ms -> chỉ giữ snapshot mới nhất
    if (this.idleHandle) return;

    // 3) Ghi lúc rảnh
    this.idleHandle = requestIdleCallback(
      (dl) => this.flush(dl),
      { timeout: 3000 }                                       // idle không tới -> ép ghi
    );
  }

  private flush(dl?: IdleDeadline) {
    const snap = this.pending; this.pending = null; this.idleHandle = 0;
    if (!snap) return;
    const t0 = performance.now();
    const json = JSON.stringify(snap);
    snap.checksum = fnv1a(json);

    const next: 'A'|'B' = this.slot === 'A' ? 'B' : 'A';      // GHI LUÂN PHIÊN
    platform.writeSlot(next, json);                            // localStorage | fs tmp+rename
    platform.writeMeta({ activeSlot: next, schemaVersion: SCHEMA_VERSION,
                         savedAt: snap.savedAt, checksum: snap.checksum });
    this.slot = next;
    bus.emit('save:written', { bytes: json.length, ms: performance.now() - t0, slot: next });
  }
}
```

**Bốn quyết định trong đoạn trên:**

1. **Chụp trong frame, ghi lúc rảnh.** Chụp phải xảy ra ngay tại khoảnh khắc sự kiện, nếu không `requestIdleCallback` chạy 200 ms sau sẽ chụp một thế giới đã khác. Việc đắt (`stringify` + ghi) mới là việc hoãn được.
2. **Double-buffer A/B + meta.** Nếu mất điện/crash giữa lúc ghi slot B thì slot A vẫn nguyên và `meta` vẫn trỏ A. Không bao giờ có trạng thái "save hỏng, mất 12 ngày chơi" — với một game 40 ngày về **quan hệ không respawn được** (§22), mất save là mất người chơi vĩnh viễn.
3. **`timeout: 3000`.** `requestIdleCallback` có thể không bao giờ được gọi ở giờ cao điểm. Timeout ép trình duyệt chạy nó.
4. **Trên Electron: ghi file tạm rồi `rename`.** `rename` cùng filesystem là thao tác nguyên tử — không có cửa sổ nào để đọc ra file viết dở.

**Đo được, nằm trong telemetry (`P0-03`):** `save:written` ghi `bytes` + `ms`. Cổng: **p99 của `ms` ≤ 5**, **0 lần** ghi rơi vào cùng frame với một `perception:stateChanged`.

### 2.7. Versioning và migration

```ts
const MIGRATIONS: Record<number, (s: any) => any> = {
  // 1 -> 2 : ví dụ, khi tách trustCeiling ra khỏi relationPoints
  1: (s) => { for (const n of Object.values<any>(s.npcs)) n.trustCeiling ??= 100;
              s.schemaVersion = 2; return s; },
};

function load(raw: string): SaveFile {
  let s = JSON.parse(raw);
  if (s.schemaVersion > SCHEMA_VERSION)
    throw new SaveTooNewError();            // build cũ KHÔNG được đoán mò save mới
  if (s.schemaVersion < SCHEMA_VERSION) {
    platform.backup(`pre-migrate-v${s.schemaVersion}`, raw);   // luôn giữ bản gốc
    while (s.schemaVersion < SCHEMA_VERSION) s = MIGRATIONS[s.schemaVersion](s);
  }
  if (fnv1a(JSON.stringify(stripChecksum(s))) !== s.checksum)
    bus.emit('telemetry:mark', { key: 'save.checksum_mismatch', value: 1 });  // CẢNH BÁO, không chặn
  return s;
}
```

**Bốn luật:**

1. **Chỉ tiến, không lùi.** `schemaVersion` lớn hơn build hiện tại → từ chối, hiện thông báo *"bản lưu này của phiên bản game mới hơn"*, không đoán.
2. **Migration chạy tuần tự** 1→2→3, mỗi bước thuần và test được. Không viết migration nhảy cóc.
3. **Backup trước khi migrate**, giữ 3 bản gần nhất.
4. **Checksum sai thì cảnh báo, không chặn.** §8f: datamine bịt không nổi, và **cố chống là tự bắn vào chân** — người chơi sửa save của mình là chuyện của họ; nhưng một save hỏng thật (localStorage bị cắt cụt) thì cần biết để không mất dữ liệu âm thầm.

**Thêm field mới:** luôn có giá trị mặc định qua `??=`, và **không bao giờ đổi ý nghĩa của field cũ** — thêm field mới rồi bỏ field cũ ở phiên bản sau.

### 2.8. Chống save-scum — và cái gì KHÔNG bị khoá

**Cơ chế, hai vế khoá vào nhau (CANON §8e):**

```
Autosave ngay khi sự kiện xảy ra   →  không còn cửa sổ "quay lại trước khi bị bắt"
      ×
Seed cố định theo ngày + stream tách →  reload ra ĐÚNG kết quả cũ
```

Vế nào thiếu vế kia cũng vô dụng: autosave mà seed ngẫu nhiên thì reload đầu ngày vẫn reroll được; seed cố định mà autosave theo ngày thì vẫn có cửa sổ cả ngày.

**Cụ thể, ba đường ăn gian và cách nó chết:**

| Đường | Người chơi làm | Kết quả |
|---|---|---|
| Reload sau khi bị bắt | Đóng tab, mở lại | Save đã ghi ở `perception:confirmed`. Vào lại **sau** khoảnh khắc đó |
| Reload đầu ngày rồi chơi lại y hệt | Xoá save ngày, chơi lại | `daySeed` không đổi → giá chợ, lịch NPC, gossip tick giống hệt. **Chơi giống thì được kết quả giống** |
| Đốt RNG để reroll | Làm một hành động vô hại để "xáo" số | Stream tách (§2.3) → hành động ở hệ A không dịch chuỗi số của hệ B |

**Cái KHÔNG khoá — ghi rõ, vì đây là ranh giới giữa "chống ăn gian" và "làm phiền":**

| Được phép | Vì sao |
|---|---|
| **Chơi lại cả ngày từ đầu** — và có **nút chính thức "Chơi lại ngày này"** trong menu | Người chơi sẽ làm điều này bằng cách nào đó (xoá save, sao lưu file). Cho nút chính thức thì trung thực hơn, và **quan trọng hơn: nó khôi phục đúng `dayStartSnapshot` + đúng vị trí RNG đầu ngày**, tức là biến việc chơi lại thành *chơi lại*, không phải *reroll* |
| Thoát bất cứ lúc nào, vào lại đúng chỗ | Trợ năng, và game cozy không được phạt vì phải đứng dậy |
| Manual save slot để chuyển máy / sao lưu | Không có gì để bảo vệ |
| Sửa file save bằng tay | §8f: bịt không nổi. Phần hay không nằm ở EV mà nằm ở quan hệ |
| **Chơi lại và ra kết quả KHÁC vì chơi khác** | Đây là mục tiêu, không phải lỗ hổng. Cái bị khoá là *reroll cùng một hành động*, không phải *học rồi làm tốt hơn* |

**Quan trọng — một dòng phải nói thẳng ra cho người chơi:** trong menu "Chơi lại ngày này" có một câu giải thích:

> *"Chơi lại ngày này sẽ đưa mọi thứ về sáng sớm. Chợ vẫn bán giá đó, khách vẫn tới giờ đó — chỉ có con là biết trước."*

Nói trước thì người chơi không phí một giờ thử reroll rồi bực. Và câu đó đúng giọng cô Ba.

**Không làm:** khoá xoá save, phát hiện sửa file rồi phạt, DRM. `idea.md` §23: *"Game sẽ bị crack. Đừng đầu tư vào DRM. Đầu tư vào lý do cảm xúc để mua."*

---

## 3. Dữ liệu & schema

Schema đầy đủ ở §2.5. Bổ sung phần khung ngày và bản chụp đầu ngày:

```ts
export type DayStartSnapshot = {
  key: string;                 // `${saveId}:${dayIndex}`
  dayIndex: number;
  payload: SaveFile;           // trạng thái lúc 'day:started', TRƯỚC khi đi chợ
};
// Giữ tối đa 2 bản (ngày hiện tại + ngày trước) -> ~96 KB. Xoá bản cũ hơn.
```

**Ví dụ content thật** — `content/days/day_index.json` (khung thời gian, P0 chốt):

```json
{
  "openHhmm": "06:00",
  "closeHhmm": "11:00",
  "bands": [
    { "id": "PRE_OPEN", "fromHhmm": "06:00", "toHhmm": "06:30", "scaleBusy": 30, "scaleIdle": 30 },
    { "id": "PEAK",     "fromHhmm": "06:30", "toHhmm": "08:00", "scaleBusy": 30, "scaleIdle": 30 },
    { "id": "MID",      "fromHhmm": "08:00", "toHhmm": "09:30", "scaleBusy": 30, "scaleIdle": 60 },
    { "id": "LULL",     "fromHhmm": "09:30", "toHhmm": "11:00", "scaleBusy": 30, "scaleIdle": 120 }
  ],
  "timeScaleBase": 30,
  "rainCustomerMultiplier": 0.6,
  "note": "PEAK không bao giờ tua nhanh kể cả lúc trống — khách kế tiếp tới trong vài giây."
}
```

---

## 4. UI/UX hai thiết bị

| Thành phần | PC | Mobile (v2, thiết kế sẵn) |
|---|---|---|
| **Đồng hồ** | Góc trên trái header `DayScene`: `6:47` + tên khung giờ bằng chữ (*"cao điểm"*), **không** dùng thanh tiến trình — thanh tiến trình đọc thành "deadline" và làm hỏng tông cozy | Như PC, cỡ chữ theo `fontScale` |
| **Tua nhanh** | **Không có nút.** Khi quầy trống ở `MID`/`LULL`, kim đồng hồ chạy nhanh thấy được + một chút hiệu ứng nắng dịch — người chơi hiểu ngay mà không cần dạy | Như PC |
| **Pause** | `Esc` hoặc nút ở góc; **mọi lúc**, kể cả giữa lúc kéo nguyên liệu và giữa lúc khách đang nói | Nút ≥ 44×44 pt nửa dưới màn hình |
| **Chỉ báo autosave** | Một chấm nhỏ mờ dần 0,8 s ở góc. **Không** vòng xoay, **không** chặn thao tác | Như PC |
| **"Chơi lại ngày này"** | Trong menu pause, **có câu giải thích ở §2.8**, cần một bước xác nhận | Như PC |
| **Chế độ không giới hạn thời gian** | Trong cài đặt trợ năng, **preview ngay** như cỡ chữ (§15.1) | Như PC |

Đồng hồ và chỉ báo autosave thuộc lớp `DOM_UI` (`P0-01` §2.6) — để cỡ chữ 4 mức hoạt động miễn phí.

---

## 5. Tham số cần tune

| Tên | Giá trị khởi điểm | Khoảng | Nguồn | Cách đo |
|---|---|---|---|---|
| `TIME_SCALE_BASE` | 30 | 20–45 | Suy ra từ §13.3 | Thời gian thật/khách ở `PEAK`. Mục tiêu 20–30 s |
| `TIME_SCALE_IDLE_MID` | 60 | 45–90 | — | Phút thật của khung `MID`. Mục tiêu ~2,25 |
| `TIME_SCALE_IDLE_LULL` | 120 | 60–180 | — | Phút thật của khung `LULL`. Mục tiêu ~1,5. Nếu người chơi thấy "chờ hoài" → tăng |
| `DAY_OPEN_HHMM` / `DAY_CLOSE_HHMM` | 06:00 / 11:00 | — | §13.3 (cao điểm 6h30–8h) | Cố định |
| `PEAK_FROM` / `PEAK_TO` | 06:30 / 08:00 | — | §22.3 | **Cố định — là hằng số thiết kế, không tune** |
| `REAL_MIN_PER_DAY` | 10,25 | 7–14 | §23 | **Đo thật** (`P0-03`). <4 h tổng mùa → giảm số ngày |
| `SEASON_DAYS` | 40 | 30–40 | §12.2, T4 | Hệ quả của dòng trên |
| `CLOCK_DT_CLAMP_MS` | 100 | 50–200 | — | Tab ẩn rồi hiện lại: đồng hồ không được nhảy |
| `SHUFFLEBAG_DEFAULT_N` | 8 | 6–12 | §18.7 | Playtest: người chơi có nghe lại dòng nào trong 2 giờ đầu không (HT6) |
| `SHUFFLEBAG_GC_DAYS` | 7 | 5–14 | — | Kích thước `shuffleBags` trong save |
| `AUTOSAVE_COALESCE_MS` | 500 | 250–1000 | — | Số lần ghi/ngày. Mục tiêu 25–40 |
| `AUTOSAVE_IDLE_TIMEOUT_MS` | 3000 | 1000–5000 | — | Tỉ lệ ghi bị ép (không qua idle). Mục tiêu < 10% |
| `SAVE_WRITE_MS_P99` | ≤ 5 | — | `P0-01` §2.8 | `save:written.ms`, p99 qua một ngày |
| `SAVE_SIZE_WARN_KB` | 512 | 256–1024 | — | `save:written.bytes` |
| `SAVE_SIZE_INDEXEDDB_KB` | 1024 | — | — | Ngưỡng chuyển backend |
| `DAY_SNAPSHOT_KEEP` | 2 | 1–3 | — | Tổng dung lượng save |
| `GOSSIP_UNLOCK_MINUTES` | 120 | 90–180 | §12r6 (2 giờ chơi đầu) | Telemetry: tin đồn đầu tiên xuất hiện ở phút thứ mấy |

---

## 6. Tiêu chí đạt

**Đồng hồ**
- [ ] Đúng **một** nơi trong repo gọi `advance()`. `grep -rn "\.delta" src/ --include=*.ts` ngoài `clock.ts` → 0
- [ ] Pause 60 giây: `gameMinutes`, `certainty` của mọi NPC, `patience`, bộ đếm nướng bánh, delay bark — **không đổi một chữ số thập phân nào**
- [ ] Bật "không giới hạn thời gian": chơi ì 10 phút thật, **không khách nào bỏ đi**; nhưng làm sai công thức thì vẫn bị phản ứng đầy đủ
- [ ] Tab ẩn 5 phút rồi quay lại: đồng hồ không nhảy quá 100 ms game
- [ ] Đo thật: một ngày = **? phút** (điền số), 40 ngày = **? giờ** (điền số). Phải ≥ 4 giờ

**RNG**
- [ ] `grep -rn "Math.random()" src/ --exclude-dir=core` → **0**
- [ ] `grep -rn "rng\." src/craft src/econ/ledger.ts` → **0** (Đừng-3: ngẫu nhiên không chạm hệ quả)
- [ ] **Test tất định:** chạy ngày 7 hai lần cùng `saveId`, cùng chuỗi input → `bus.trace.dump()` **giống hệt từng byte**
- [ ] **Test cô lập stream:** chạy ngày 7 hai lần, lần hai chèn thêm 20 lần "hỏi một câu" → mọi event của stream `market`, `npc-schedule`, `gossip` **vẫn giống hệt**
- [ ] Reload giữa ngày (sau khách thứ 5) → 19 khách còn lại đến đúng thứ tự và đúng giờ như lần chạy không reload

**Shuffle-bag**
- [ ] 8 biến thể, rút 40 lần: mỗi biến thể ra đúng 5 lần; **không** có hai lần liên tiếp trùng nhau
- [ ] Bag sống qua reload: rút 3/8, thoát, vào lại, rút 5 lần nữa → hết đúng túi, không lặp
- [ ] Số lần gọi RNG cho mỗi lần refill là hằng số `n-1` (test)

**Save**
- [ ] Save chứa đủ **11 nhóm** ở §2.5; checklist thủ công từng nhóm
- [ ] Autosave kích hoạt ở cả **7** loại sự kiện §2.6
- [ ] `save:written.ms` p99 ≤ 5 ms; 0 lần ghi rơi cùng frame với `perception:stateChanged`
- [ ] Kill tiến trình giữa lúc ghi 50 lần → **50/50 lần** load lại được save hợp lệ (double-buffer)
- [ ] Migration v1→v2 giả lập chạy được, có backup, save v3 giả lập bị **từ chối** chứ không bị đoán mò
- [ ] Save ≤ 512 KB sau một mùa 40 ngày chơi đầy đủ

**Chống save-scum**
- [ ] Kịch bản: làm rớt bánh trước mặt bà Bảy → `CONFIRMED` → đóng tab ngay lập tức → mở lại → **bà Bảy vẫn nhớ**
- [ ] Kịch bản: "Chơi lại ngày này" → giá chợ, danh sách khách, giờ đến, gossip tick **giống hệt**
- [ ] Menu "Chơi lại ngày này" hiển thị đúng câu giải thích §2.8

---

## 7. Rủi ro & cách bịt

| # | Rủi ro | Mức | Cách bịt |
|---|---|---|---|
| R1 | **Một `Math.random()` lọt vào** → §8e hỏng âm thầm, không ai biết tới khi người chơi viết lên Reddit | **Rất cao** | CI grep + test tất định (chạy 2 lần so trace). Đây là test **phải chạy mỗi commit**, không phải mỗi release |
| R2 | Một hệ tự giữ bộ đếm giây (`Date.now()`, `setTimeout`) → pause không đóng băng nó → *"khách vẫn bực trong lúc mình đọc menu trợ năng"* | Cao | CI grep `Date.now\|setInterval\|setTimeout` trong `sim/ dialog/ craft/`. Dùng `clock.after(sec, fn)` thay `setTimeout` |
| R3 | **Đốt RNG để reroll tin đồn** (§8e biến thể) | Cao | Tách 6 stream + `gossip` chỉ tick 1 lần/ngày ở thời điểm cố định. Có test cô lập stream ở §6 |
| R4 | Bộ đếm stream không vào save → reload giữa ngày reset về đầu ngày → **reroll được toàn bộ phần còn lại của ngày** | **Rất cao** | `rng.counters` là field bắt buộc; test "reload sau khách thứ 5" ở §6 |
| R5 | Autosave 3 ms rơi đúng frame đông khách → giật đúng lúc T1 quan trọng nhất | Trung bình | Chụp trong frame / ghi lúc idle + gộp 500 ms + đo p99 |
| R6 | Crash giữa lúc ghi → mất cả mùa → mất người chơi vĩnh viễn (quan hệ không respawn, §22) | Cao | Double-buffer A/B + meta + `rename` nguyên tử + backup trước migrate |
| R0.5 | Save phình vì `notebook` / `shuffleBags` | Trung bình | GC bag 7 ngày; cảnh báo 512 KB; chuyển IndexedDB ở 1 MB |
| R8 | Migration viết ẩu làm hỏng save của người đang chơi giữa mùa | Cao | Backup bắt buộc + migration thuần + test snapshot cho từng bước |
| R9 | **6,8 giờ là con số tính ra bị nhầm thành con số đo được** | Cao | Doc này ghi rõ. `P0-03` là cổng. *"Nếu bạn chưa đo, bạn chưa thiết kế"* (§23) |
| R10 | Tua nhanh giờ vắng làm người chơi lỡ khách | Trung bình | Chỉ tua khi quầy **trống hoàn toàn**; khách tới → về `TIME_SCALE_BASE` **ngay frame đó**, kèm một nhịp âm thanh nhẹ |
| R11 | Chống save-scum bị người chơi cảm nhận thành "game không cho tôi chơi lại" | Trung bình | Nút "Chơi lại ngày này" **chính thức** + câu giải thích §2.8. Khoá reroll, không khoá chơi lại |
| R12 | Cám dỗ thêm DRM/obfuscate save | Thấp | §8f + §23. Đã ghi vào §2.7 luật 4 |

---

## 8. Truy vết

| Nội dung | `idea.md` | `CANON.md` |
|---|---|---|
| Autosave ngay khi sự kiện + seed cố định theo ngày | §21 mục (e) | §8e, §2 |
| Save ở localStorage (web) / file JSON (desktop), autosave sau mỗi khách | — | §2 |
| Đo "một ngày = bao nhiêu phút thật → 40 ngày = bao nhiêu giờ"; dưới 4 giờ → giảm số ngày | §23 tuần 1–2 | §17 (P0) |
| Cao điểm 6h30–8h, 1 lò 2 tay, đông khách = nhiều mắt nhìn + dễ ẩu | §22.3 | §13.3 |
| Shuffle-bag: 8 biến thể, random thuần trùng ~50% sau ~3,4 lần, ≈ 25–30 dòng random | §18.7 | §11 |
| Certainty tích luỹ theo `dt`, hiệu chỉnh 1,4 s / 28 s | §18.2 | §5 |
| Pause đóng băng cả sự kiên nhẫn + chế độ không giới hạn thời gian | §20 mục 2 | §15.2 |
| 6 công tắc trợ năng bắt buộc | §20 | §15 |
| Trí nhớ 3 tầng, sàn theo tier, chồng chất `0.75^(n-1)` | §18.4 | §12 |
| Đồn thổi: hop cap, confidence 0.7–0.85, nguồn truy vết được, không xảy ra 2 giờ đầu | §18.5 | §12 |
| Hạ trần tin tưởng vĩnh viễn (đốt NPC rồi để nguội) | §21 mục (d) | §8d |
| Micro-cheat phát hiện theo PATTERN | §21 mục (g) | §8g |
| Hạn dùng + sức chứa tủ | §21 mục (j), §22.1 | §8j, §13.1 |
| Không đầu tư DRM, datamine bịt không nổi | §23, §21 mục (f) | §8f |
| Ngẫu nhiên không chạm hệ quả | §18.6 Đừng-3 | §12, §16 |
| Sổ tay người chơi tự ghi là mặt phẳng nhận ra hệ thống | HT2 (§16), §22.3 | §15 (công tắc), §17 (P2) |

---

## 9. Đề xuất sửa CANON

| # | Đề xuất | Lý do |
|---|---|---|
| 1 | Thêm vào §2 khung giờ chốt: **bán 06:00–11:00, `TIME_SCALE_BASE = 30`, chỉ tua nhanh khi quầy trống** | §13.3 đã chốt cao điểm 6h30–8h nhưng CANON chưa có giờ mở/đóng cửa. Mọi doc P3/P4 (lịch NPC, dự báo cầu) cần con số này và sẽ tự bịa nếu không có |
| 2 | Thêm vào §8e một vế thứ ba: **tách stream RNG theo hệ** | Hiện §8e chỉ ghi "autosave + seed cố định". Thiếu vế tách stream thì có thể reroll bằng cách đốt RNG — tức là §8e chưa thực sự bịt |
| 3 | Thêm vào §2: **save phải double-buffer A/B + meta**, và **`rng.counters` là field bắt buộc** | Đây là hai điểm hỏng âm thầm (R4, R6) mà không có luật ở CANON thì mỗi doc sẽ tự quyết khác nhau |
| 4 | Ghi vào §17 (P0) con số mục tiêu: **một ngày ≈10 phút thật, mùa 40 ngày ≈6,8 giờ (ước tính) — cổng: ≥4 giờ đo thật** | §17 hiện chỉ ghi "đo được một ngày = bao nhiêu phút thật" mà không có giá trị kỳ vọng. Không có kỳ vọng thì đo xong không biết đạt hay không |
