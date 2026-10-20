# P2-03 — Trí nhớ 3 tầng, quan hệ 3 bucket và lịch sinh hoạt NPC

> ## ⚡ REVAMP 2026-10-20 — ☠️ CHẾT TOÀN BỘ
> Căn cứ: [`CANON.md`](../CANON.md) bản revamp. Phần ☠️ không dùng làm căn cứ.
>
> Trí nhớ NPC 3 tầng, bucket Rival/Acquaintance/Friend, trần tin tưởng, chuộc lỗi, T3 — chết (CANON §4, §12, T3). Hệ quả hành vi đổ về **sao + review công khai** (T6). Dự báo cầu §2.9–§2.10 thay bằng `Y(x)` theo sao (R5).
>
> **Còn dùng được:** `visitCount` (CANON §11) · ý lịch giờ ghé §2.9 (ai tới khung giờ nào) có thể tham khảo khi rải khách trong ngày ở R5 — mọi số ⏳.

**Thuộc phase:** P2 — Hệ NPC đầy đủ
**Phụ thuộc:** `P2-01` (Rule DB thoại) · `P2-02` (12 NPC & tính cách) · `P1-02` (tầng nhận thấy / `certainty`) · cung cấp đầu vào cho `P2-04` (đồn thổi), `P2-05` (sổ tay cô Ba), `P3-01` (dự báo cầu & tồn kho)
**Trạng thái:** **Chốt** về cấu trúc và luật · **Cần đo** với mọi con số trong §5

---

## 1. Mục tiêu

Làm cho 12 NPC của CANON §9 **nhớ như người nhớ**: nhớ có chọn lọc, quên có đường cong, giận có sàn, và tha thứ có giá. Trực tiếp phục vụ:

- **T1** — khách chấm quá trình: memory là nơi "quá trình" được **lưu lại qua đêm**, biến một khoảnh khắc bị nhìn thấy thành hệ quả trễ ngày hôm sau.
- **T3** — không hiện chỉ số: toàn bộ hệ này chạy ngầm; người chơi **chỉ đọc được nó qua 8 tín hiệu gián tiếp** ở §2.11. Không có một con số nào lên màn hình. Không bao giờ.
- **T4** — một mùa có điểm kết: decay đếm theo **lần ghé bị bỏ lỡ trong game**, **không** đếm theo thời gian thật → không có daily login, không có "cây chết khi offline".

Và một mục tiêu không cảm xúc chút nào, nhưng là lý do thật sự để hệ này tồn tại: **trí nhớ NPC là đầu vào của bài toán tồn kho** (§2.10). Nếu cắt nó ra khỏi kinh tế, nó chỉ là màu mè cảm xúc và đáng bị cắt.

---

## 2. Cơ chế

### 2.1. Ba tầng slot

```
SHORT  6–8 slot   ·  sống bằng đường cong decay, cạnh tranh slot
LONG   3–4 slot   ·  promote lên từ SHORT, decay chậm hơn ~3×
CORE   1 slot     ·  ghi MỘT LẦN duy nhất trong cả mùa, không decay, không ghi đè
```

Mỗi NPC có bộ slot riêng. Kích thước slot **không cố định giữa các NPC** — nó là một mặt của tính cách:

| NPC (CANON §9) | SHORT | LONG | Lý do |
|---|---|---|---|
| Bà Bảy (soi 0.9 / deTha 0.8) | **8** | 4 | Để ý nhiều thứ, nhưng phai nhanh |
| Chị Lan (soi 0.9 / deTha 0.2) | 6 | **4** | Nhớ ít chuyện, nhưng chuyện nào vô là ở lại |
| Chú Tư (soi 0.3 / deTha 0.9) | 6 | 3 | Xuề xoà, không để bụng |
| Anh Bảo (soi 0.3 / gaze thấp) | 6 | 3 | Nhận thấy được ít → ít thứ để nhớ |
| Thầy Phúc (soi 0.8 / nongTinh 0.2) | 7 | 4 | Thấy hết, nói ít, nhớ lâu |
| Mặc định 8 NPC còn lại | 7 | 3 | — |

```ts
function slotCount(p: Personality) {
  return {
    short: Math.round(6 + 2 * p.soi),
    long:  Math.round(3 + 1 * (1 - p.deTha)),
    core:  1,
  }
}
```

### 2.2. Luật ghi đè: **`intensity` thấp nhất**, không phải cũ nhất

Khi SHORT đầy và cần chỗ cho memory mới:

```ts
function insertShort(npc: Npc, m: Memory) {
  const same = npc.short.find(x => x.kind === m.kind && sameSubject(x, m))
  if (same) {                              // CANON §12: cùng kind → giữ cái MẠNH HƠN
    if (m.intensity > same.intensity) {
      same.intensity  = m.intensity        // nâng cấp tại chỗ
      same.intensity0 = m.intensity
      same.dayLastReinforced = m.dayCreated
      same.occurrences += 1
    } else {
      same.occurrences += 1                // vẫn đếm, để §2.6 và §8g dùng
      same.dayLastReinforced = m.dayCreated
    }
    return
  }

  if (npc.short.length < slotCount(npc.personality).short) {
    npc.short.push(m); return
  }

  // ĐÂY LÀ DÒNG QUAN TRỌNG NHẤT CỦA CẢ FILE
  const victim = minBy(npc.short, x => currentIntensity(x, today))
  if (currentIntensity(victim, today) >= m.intensity) return   // không đủ mạnh để chen vào
  replace(npc.short, victim, m)
}
```

**Vì sao "thấp nhất" chứ không "cũ nhất" — và vì sao nó quyết định cả cảm giác của game:**

1. **FIFO biến trí nhớ thành cái xô thủng.** Nếu ghi đè cái cũ nhất, người chơi có một chiến lược thắng tầm thường: gây lỗi nặng xong **spam 8 chuyện vặt** (`FLOURISH`, `FREE_EXTRA`) để đẩy lỗi nặng ra khỏi bộ nhớ trong một buổi sáng. Cả hệ chuộc lỗi ở §2.7 chết ngay tại chỗ, và cái chết đó là một exploit rẻ tiền đúng kiểu Minh sẽ tìm ra trong 20 phút.
2. **Người thật không quên theo thứ tự thời gian.** Bạn quên bữa trưa thứ Ba tuần trước, nhưng bạn không quên lần bị gọi sai tên trước mặt đồng nghiệp năm ngoái. Đây chính là chi tiết của Dwarf Fortress mà CANON §12 chỉ đích danh: **quên là hàm của cường độ, không phải hàm của tuổi**.
3. **Nó làm cho lỗi nặng tự động "dính" mà không cần cờ đặc biệt.** `WRONG_NAME` (salience 100) sẽ không bao giờ là `minBy` trong 8 slot. Không cần viết luật riêng "lỗi nặng thì bảo vệ". Cấu trúc tự lo.
4. **Nó cho người chơi một đòn bẩy đọc được.** Muốn chuyện xấu trôi đi? **Phải tạo chuyện tốt MẠNH HƠN nó**, chứ không phải tạo nhiều chuyện tốt yếu. `REMEMBERED_USUAL` (90) đẩy được `DROPPED_FOOD` (75) ra; 6 lần `FLOURISH` (15) thì không. Đây là bài học duy nhất của hệ trí nhớ mà người chơi cần học, và nó đúng với đời.

> Hệ quả cần viết vào test: **không có cách nào làm trôi một `WRONG_NAME` bằng cách ghi đè.** Chỉ có `redeem` (§2.7) hoặc chịu đựng đường cong decay (§2.4).

### 2.3. Promote lên LONG và ghi CORE

```ts
const PROMOTE_AFTER_DAYS = 3

function nightlyPromote(npc: Npc, day: number) {
  for (const m of npc.short) {
    const age = day - m.dayCreated
    const survived = currentIntensity(m, day) >= PROMOTE_FLOOR[m.kind]  // mặc định 45
    const reinforced = m.occurrences >= 2 || m.kind === 'WRONG_NAME'

    if (age >= PROMOTE_AFTER_DAYS && survived && reinforced) {
      promote(npc, m)          // chuyển sang LONG, decayRate *= 0.33, tier='LONG'
    }
  }
  trimLong(npc)                // LONG đầy → vẫn ghi đè theo intensity thấp nhất
}
```

**Điều kiện kép là cố ý:** phải **vừa sống sót qua 3 ngày vừa được lặp lại**. Một lần lỡ tay không thành ký ức dài hạn. Hai lần thì có. Đây là chỗ hệ phát hiện **pattern** chứ không phát hiện **sự kiện đơn lẻ** — nối thẳng vào CANON §8 mục (g), lỗ hổng ăn gian lớn nhất.

**CORE — 1 slot, ghi một lần, không bao giờ decay, không bao giờ bị ghi đè.**

```ts
type CoreTrigger =
  | { type: 'FIRST_REMEMBERED_USUAL', minVisit: 5 }    // "con nhỏ này nhớ tui"
  | { type: 'CARED_IN_RAIN' }                          // che dù / gói kỹ hôm mưa
  | { type: 'REPEATED_WRONG_NAME', count: 3 }          // sai tên 3 lần → "nó không coi tui ra gì"
  | { type: 'SERVED_ON_BAD_DAY' }                      // phục vụ đúng hôm đời họ có chuyện
  | { type: 'REFUSED_SERVICE' }                        // CANON §8k
```

CORE không cộng điểm. CORE **đổi pool thoại của NPC trong phần còn lại của mùa** và đổi hệ số sẵn sàng lan tin (P2-04 §5). Ví dụ chú Tư có CORE = `CARED_IN_RAIN` thì từ đó trở đi, mọi lời chào của chú dùng pool `warm`, kể cả những ngày `points` đang tụt.

> Đây là chỗ ăn khớp với nguyên tắc kết game của CANON §15: *"mọi ending đều tử tế, chỉ khác nhau về ai còn ở đó với mình."* CORE chính là danh sách "ai còn ở đó".

### 2.4. Decay **tapering**, không cliff

**Cảnh báo phải chép vào test:** RimWorld vanilla giữ nguyên **full offset** suốt vòng đời memory rồi **biến mất đột ngột** ở ngày hết hạn. Hôm nay một NPC còn ghét bạn đúng 30 điểm; sáng mai đúng 0. Mod **"All Memories Fade"** tồn tại **chính vì** điều đó — người chơi cảm nhận được cái vách đứng và thấy nó giả. Chúng ta không được lặp lại.

Đường cong dùng: **giữ — dốc mượt — sàn ngang**, với đạo hàm bằng 0 ở **cả hai đầu** (không có góc gãy ở đâu hết):

```ts
function currentIntensity(m: Memory, day: number): number {
  const t = day - m.dayLastReinforced
  const { hold, taper, floor } = DECAY[m.kind]
  const tHold  = hold
  const tTaper = taper * temperFactor(m)          // tính cách vặn ở đây

  if (t <= tHold) return m.intensity0             // pha GIỮ: còn nóng, chưa phai

  const u = Math.min(1, (t - tHold) / tTaper)
  const ease = 0.5 * (1 + Math.cos(Math.PI * u))  // 1 → 0, mượt hai đầu
  return floor + (m.intensity0 - floor) * ease    // pha DỐC → pha SÀN
}

function temperFactor(m: Memory): number {
  const p = m.ownerPersonality
  return m.valence < 0
    ? 1 / (0.4 + 1.6 * p.deTha)  // NGHỊCH ĐẢO của decayMul — deTha 0.2 → ×1.39 (nhớ dai nhất hẻm) · 0.9 → ×0.54 (mau quên)
    : (0.8 + 0.6 * p.thanThien)  // người mở lòng nhớ ơn lâu hơn
}
```

> ### ⚠️ SỬA MỘT LỖI DẤU CỦA BẢN TRƯỚC — nhánh âm là NGHỊCH ĐẢO, không phải chính `decayMul`
>
> Bản trước của doc này viết `tTaper = taper × (0.4 + 1.6·deTha)` kèm chú thích *"deTha 0.2 → ×0.72 (nhớ dai nhất hẻm)"*. Chú thích đúng ý định, công thức thì làm ngược lại — và nó ngược theo kiểu đọc doc không thấy được:
>
> * `decayMul = 0.4 + 1.6·deTha` là một **TỐC ĐỘ QUÊN**: `deTha` cao ⇒ quên nhanh ⇒ số LỚN.
> * `taper` là một **ĐỘ DÀI** đoạn dốc: số LỚN ⇒ dốc thoải ⇒ phai **CHẬM**.
>
> Nhân thẳng một tốc độ vào một độ dài là lộn ngược hai đại lượng. Hậu quả đo được trên bản cũ (`WRONG_NAME` intensity 90, tạo ngày 1):
>
> | | ngày 6 | ngày 10 | ngày 16 | ngày 24 |
> |---|---|---|---|---|
> | **chị Lan** `deTha 0.2` — để bụng nhất hẻm | 76 | 37 | **23** | 23 |
> | **bé Su** `deTha 0.9` — mau quên nhất hẻm | 88 | 78 | **56** | 28 |
>
> Suốt hơn hai tuần — gần hết một mùa — người mau quên giận dai hơn người để bụng, tức đúng cái tính cách mà cả P2-02 lẫn doc này dựng lên bị đảo chiều ở chỗ nó đáng kể nhất.
>
> **Nghịch đảo** là phép đổi đúng giữa "tốc độ" và "độ dài", và nó bị chặn hai đầu sẵn: `decayMul ∈ [0.4 · 2.0]` ⇒ hệ số `∈ [0.5 · 2.5]`. (`2.0 − decayMul` thì `deTha = 1` ra 0 và chia cho 0.)
>
> Con số nền `0.4 + 1.6·deTha` vẫn là **đúng** con số đã chốt ở `P2-02 §4.6` — chỗ sai nằm ở cách DÙNG nó, không ở giá trị. Hai doc vẫn dùng chung một con số; nếu tune, tune ở **một chỗ** rồi đồng bộ.
>
> Tìm ra lúc dựng `P2-09` (truy hồi ký ức đọc thẳng `currentIntensity`). Sửa ở `sim/memory.temperFactor`; lưới canh chiều ở `tests/p2-recall.test.ts` → `R-4b`.

**Bảng `DECAY` per-kind** (ngày; `floor` tính theo % của `intensity0`, quy ra điểm tuyệt đối lúc tạo):

| kind | valence | `hold` | `taper` | `floor` | Ý nghĩa thiết kế |
|---|---|---|---|---|---|
| `WRONG_NAME` | − | 2 | 14 | **25** | Không bao giờ tự về 0. Chỉ `redeem` mới gỡ |
| `DROPPED_FOOD` | − | 2 | 12 | **20** | Không bao giờ tự về 0 |
| `DIRTY_HANDS` | − | 1 | 8 | 10 | Phai gần hết, còn một vệt |
| `BURNT_OR_COLD` | − | 1 | 6 | 0 | Lỗi tay nghề, tha được |
| `MADE_THEM_WAIT` | − | 0 | 4 | 0 | Bực tức tức thì, tan nhanh |
| `ORDER_DEFECT` | − | 1 | 5 | 0 | Nhưng `occurrences` không phai → §8g |
| `REMEMBERED_USUAL` | + | 3 | **20** | 15 | Tin tốt bền hơn tin xấu — luật cozy |
| `REMEMBERED_STORY` | + | 3 | 16 | 10 | |
| `CARED_FOR_THEM` | + | 2 | 12 | 5 | |
| `FREE_EXTRA` | + | 0 | 4 | 0 | Rẻ thì phai nhanh — chống §8i |
| `FLOURISH` | + | 0 | 3 | 0 | Thưởng cho kỹ năng tay, không tích luỹ |

**Ba chỗ đường cong này khác RimWorld, và ba chỗ đó là điểm khác biệt của game:**

- Có **pha GIỮ**: 1–3 ngày đầu memory không suy giảm chút nào. Người thật mới giận thì giận nguyên. Nó cũng cho người chơi một cửa sổ để **cảm nhận hậu quả** trước khi nó bắt đầu tan.
- Có **pha SÀN dương**: `WRONG_NAME` không bao giờ tụt dưới 25 nếu không chuộc. Đó không phải là trừng phạt vĩnh viễn — điểm quan hệ vẫn lên được — mà là **một vết** vẫn ảnh hưởng tới pool thoại và xác suất lan tin.
- **Không có ngày hết hạn.** Không có `if (age > maxAge) delete`. Memory rời hệ thống **chỉ** qua ba đường: bị ghi đè bởi cái mạnh hơn (§2.2), được chuộc (§2.7), hoặc chìm dưới `EPSILON = 2` và bị dọn lúc save.

### 2.5. Ba bucket quan hệ bất đối xứng + sàn theo bucket đã đạt

`points ∈ [−100, +100]`, nhưng **không bao giờ hiện ra**. Đây là biến sim, không phải biến UI.

**Ngưỡng vào/ra bất đối xứng** (hysteresis — chống nhấp nháy bucket và chống vòng xoáy tiêu cực):

| Bucket | Điều kiện **VÀO** | Điều kiện **RA** | Băng hysteresis |
|---|---|---|---|
| **Friend** | `points ≥ 60` **và** `visitCount ≥ 6` **và** có ≥1 memory dương ở LONG **và** `points ≤ trustCeiling` | `points < 45` | 15 điểm |
| **Acquaintance** | `points ≥ 25` (đi lên) hoặc `points ≥ −10` (đi lên từ Rival) | `points < 10` (đi xuống) hoặc `points ≤ −35` | 15 điểm |
| **Rival** | `points ≤ −35` **và** có ≥1 memory âm ở LONG | `points ≥ −10` | **25 điểm — cố ý rộng nhất** |

Đọc bảng này theo hướng thiết kế: **vào Rival rất khó (−35 và phải có ký ức dài hạn), ra khỏi Rival rất dễ (−10)**. Ngược hẳn với Friend (vào khó 60, ra ở 45). Đó là lựa chọn có chủ đích: game này khoan dung với người chơi ở phía dưới và khó tính với người chơi ở phía trên.

**Sàn theo bucket ĐÃ ĐẠT** (Stardew — công thức đúng nhất cho cozy, CANON §12):

```ts
points = Math.max(points - decay, floorOfTier(npc.highestBucketReached))
```

| `highestBucketReached` | Sàn | Nghĩa trong hẻm |
|---|---|---|
| (chưa từng) | **0** | Người lạ vẫn là người lạ |
| `Acquaintance` (từng chạm 25) | **+12** | *"con nhỏ bán bánh mì đầu hẻm"* — người ta vẫn biết mặt |
| `Friend` (từng chạm 60) | **+35** | *"con nhỏ đó tui quen"* — nghỉ cả tuần cũng không thành người dưng |

**Decay mạnh dần khi càng thân** — theo dải điểm hiện tại, **không** phải theo bucket (để giữ đúng "3 bucket" của CANON §4):

| Dải `points` hiện tại | Decay / lần ghé bị lỡ | Kiểm chứng cảm giác |
|---|---|---|
| `< 25` | **−2** | Quen sơ sơ thì vắng cũng chẳng sao |
| `25 … 59` | **−10** | Đã thân thì bắt đầu thấy thiếu |
| `≥ 60` | **−20** | Khách ruột vắng bạn 3 bữa là **tụt khỏi Friend**. Càng thân càng phải chăm |

**Decay đếm "lần ghé bị lỡ", KHÔNG đếm ngày lịch.** Đây là điều kiện sống còn của T4:

```ts
function nightlyDecay(npc: Npc, day: number) {
  if (!wasExpectedToday(npc, day)) return       // T7 chú Tư không ra → không trừ gì hết
  if (npc.servedToday) { npc.missStreak = 0; return }

  npc.missStreak += 1
  if (npc.missStreak <= GRACE_MISSES) return    // GRACE_MISSES = 1, lỡ một bữa là chuyện thường

  const d = npc.points < 25 ? 2 : npc.points < 60 ? 10 : 20
  npc.points = Math.max(npc.points - d, floorOfTier(npc.highestBucketReached))
}
```

**Kiểm chứng số** (chú Tư, Friend, `points` 70, người chơi mở hàng nhưng không phục vụ chú 5 buổi sáng T2–T6 liên tiếp):

| Buổi lỡ | Trước | Decay | Sau | Bucket |
|---|---|---|---|---|
| 1 (grace) | 70 | 0 | 70 | Friend |
| 2 | 70 | −20 | 50 | Friend (chưa dưới 45) |
| 3 | 50 | −10 | 40 | **rớt Acquaintance** |
| 4 | 40 | −10 | 35 (chạm sàn) | Acquaintance |
| 5 | 35 | −10 | 35 (sàn) | Acquaintance |

Nghỉ hai tuần nữa: vẫn **35**. Không bao giờ về 0. Nhưng để quay lại Friend phải leo từ 35 lên 60 — và điều đó tốn khoảng 5–6 buổi sáng làm đúng. **Nghỉ không bị phạt tàn nhẫn, nhưng không miễn phí.**

**KHÔNG bê vòng xoáy tiêu cực của RimWorld.** RimWorld nhân hệ số "bị xúc phạm" lên tới **×6** khi opinion xuống đáy: bạn càng bị ghét thì mỗi lỗi càng nặng, và hệ thống tự khoá bạn vào một cái hố. Trong một game bán đồ ăn ở hẻm, nó đọc ra là **"một lần sai → cả phố tẩy chay"**. Cozy không sống nổi với điều đó — mà chính xác hơn: nó không chỉ khó chịu, nó **giết vòng học tập**, vì người chơi mất luôn khả năng sửa sai bằng chính kỹ năng vừa học được.

Thay bằng **nghịch đảo có chủ ý**:

```ts
const offenseMul = 1.0                                   // HẰNG SỐ. Không phụ thuộc bucket.
const kindnessMul = npc.bucket === 'Rival' ? 1.25 : 1.0  // đang giận mà được tử tế thì cảm động hơn
```

Chỉ `soi`, `nongTinh`, `deTha` được vặn cường độ phản ứng — **bucket thì không**. Và ở bucket Rival, việc tử tế có giá trị **cao hơn** bình thường. Điều này đúng với đời (người đang có định kiến về bạn mà thấy bạn tử tế thì họ nhớ lâu hơn), và nó làm cho Rival là **một trạng thái để thoát ra**, không phải một cái hố.

### 2.6. Chống chồng chất: memory thứ *n* cùng kind chỉ góp `0.75^(n-1)`

Áp ở **tầng tác dụng**, không ở tầng lưu trữ. Vẫn lưu đủ để P2-04 và §8g dùng.

```ts
function effectiveContribution(npc: Npc, kind: MemoryKind, day: number): number {
  const list = allMemories(npc)
    .filter(m => m.kind === kind)
    .map(m => currentIntensity(m, day))
    .sort((a, b) => b - a)                       // mạnh nhất trước
  return list.reduce((sum, v, i) => sum + v * Math.pow(0.75, i), 0)
}
```

| n | Hệ số | Cộng dồn |
|---|---|---|
| 1 | 1.000 | 1.00 |
| 2 | 0.750 | 1.75 |
| 3 | 0.563 | 2.31 |
| 4 | 0.422 | 2.73 |
| 5 | 0.316 | 3.05 |
| ∞ | — | **→ 4.00** (trần tiệm cận) |

**Vì sao 0.75 và vì sao phải có:**

1. **Chống §8i (spam hành vi tăng trust giá rẻ).** Cho thêm đồ chua cho 100% khách, mỗi ngày: `FREE_EXTRA` thứ 5 chỉ còn góp 31% giá trị, và trần là 4× một lần. Không có cách nào "farm" quan hệ bằng việc lặp một hành vi rẻ.
2. **Đúng tâm lý thật (habituation).** Lần đầu bạn được nhớ tên là một sự kiện. Lần thứ mười là mặc định. Con người đo **độ lệch so với kỳ vọng**, không đo tổng.
3. **Nó cân đối tự nhiên giữa "sâu" và "rộng".** Vì tổng của một kind bị chặn ở 4×, cách duy nhất để lên Friend nhanh là **đa dạng kind** — nhớ tên (90) + nhớ chuyện (70) + che dù hôm mưa (50) — chứ không phải lặp một chiêu. Và bốn kind khác nhau chính là bốn kỹ năng khác nhau của game.
4. **Nó cũng chặn phía âm.** Bốn lần `MADE_THEM_WAIT` không bằng một `WRONG_NAME`. Tránh cái bẫy "chết vì nghìn nhát cắt" — đúng tinh thần chống vòng xoáy ở §2.5.

> Ngoại lệ **duy nhất**: `occurrences` dùng cho việc phát hiện **pattern** ở CANON §8g thì **đếm thẳng, không giảm dần**. Ăn gian nhỏ lặp 40 ngày phải bị bắt bằng bộ đếm tuyến tính, không phải bằng bộ đếm tiệm cận. Hai bộ đếm sống song song và có mục đích ngược nhau.

### 2.7. Chuộc lỗi phải **tốn công hơn** gây lỗi

Nguyên tắc từ idea.md §9.6 mục 1: *"Chuộc lỗi phải tốn công hơn gây lỗi, giống ngoài đời."*

**Đối chiếu chi phí — bảng này là lý do cả cơ chế tồn tại:**

| Lỗi | Chi phí GÂY ra | Chi phí CHUỘC lại |
|---|---|---|
| `WRONG_NAME` | **0 giây.** Một cú bấm nhầm | ≥ **3 buổi sáng riêng biệt**, mỗi buổi phải làm đúng "như mọi bữa" mà khách không phải nói |
| `DROPPED_FOOD` | 1 giây vụng tay | ≥ **3 buổi** + bắt buộc có ≥1 `CARED_FOR_THEM` (không chuộc được bằng bánh ngon) |
| `DIRTY_HANDS` | 0 giây | ≥ **2 buổi** có `FLOURISH` hoặc quầy sạch được nhìn thấy |

**Công thức:**

```ts
type RedeemSpec = { K: number; minDistinctDays: number; requireKinds?: MemoryKind[] }

const REDEEM: Record<MemoryKind, RedeemSpec> = {
  WRONG_NAME:    { K: 2.5, minDistinctDays: 3, requireKinds: ['REMEMBERED_USUAL','REMEMBERED_STORY'] },
  DROPPED_FOOD:  { K: 2.0, minDistinctDays: 3, requireKinds: ['CARED_FOR_THEM'] },
  DIRTY_HANDS:   { K: 2.2, minDistinctDays: 2 },
  BURNT_OR_COLD: { K: 1.6, minDistinctDays: 2 },
  ORDER_DEFECT:  { K: 1.5, minDistinctDays: 2 },
  MADE_THEM_WAIT:{ K: 1.2, minDistinctDays: 1 },
}

function applyRedeem(npc: Npc, positive: Memory, day: number) {
  for (const w of woundsOf(npc)) {                 // memory âm còn sống (kể cả đang nằm ở sàn)
    const spec = REDEEM[w.kind]
    if (w.redeemDays.includes(day)) continue                    // 1 đóng góp / ngày / vết thương
    if (spec.requireKinds && !spec.requireKinds.includes(positive.kind)) continue

    const need = w.intensity0 * spec.K                           // "công" phải bỏ ra
    w.redeemPaid += positive.intensity
    w.redeemDays.push(day)

    if (w.redeemPaid >= need && w.redeemDays.length >= spec.minDistinctDays) {
      heal(npc, w)
    }
  }
}

function heal(npc: Npc, w: Memory) {
  remove(npc, w)
  insertLong(npc, {                                 // KHÔNG xoá trắng — đổi dấu
    kind: 'HEALED_' + w.kind, valence: +1,
    intensity0: w.intensity0 * 0.35, intensity: w.intensity0 * 0.35,
    dayCreated: today, source: { via: 'WITNESSED' }, tier: 'LONG',
  })
}
```

**Bốn chi tiết làm cho nó không thành một thanh progress trá hình:**

1. **`minDistinctDays` — không dồn được trong một buổi.** Không có cách nào "mua lại" lòng tin bằng cách làm 5 việc tốt liên tiếp cho cùng một người trong 10 phút. Phải **quay lại nhiều ngày**. Thời gian là một phần của cái giá, và đó chính là chỗ đời thật nằm.
2. **`requireKinds` — chuộc phải ĐÚNG TRỤC.** Làm rớt ổ bánh xuống đất thì không chuộc bằng bánh ngon hơn được; phải bằng **sự chăm sóc** (ly trà đá, gói kỹ, che dù). Sai tên thì phải chuộc bằng **nhớ đúng**. Đây là chỗ hệ thống dạy người chơi một điều mà không cần một dòng tutorial nào.
3. **`heal` không xoá, nó đổi dấu.** Vết thương đã lành **vẫn ở trong LONG**, dưới dạng memory dương yếu (`HEALED_*`). Nó mở pool thoại riêng — dòng đẹp nhất trong cả game là dòng khách nhắc lại chuyện cũ bằng giọng đã tha thứ:
   > **Bà Bảy:** *"Hồi đó cô còn tưởng con làm ăn cẩu thả chớ. Giờ thấy con kỹ hơn cô luôn."*
   > **Chú Tư:** *"Hồi đầu con kêu chú là 'chú Bảy' đó nhớ hông. Thôi kệ, giờ nhớ rồi."*
4. **`intensity0` đóng băng.** Mẫu số là cường độ **lúc gây ra**, không phải cường độ hiện tại. Không có exploit "chờ nó phai xuống còn 20 rồi mới chuộc cho rẻ". Chờ chỉ làm mất thời gian chứ không làm giảm giá.

### 2.8. Chống ăn gian (d) — **đốt NPC rồi để nguội**: hạ **trần** tin tưởng vĩnh viễn

**Ăn gian:** vắt kiệt một NPC 3 ngày (ăn bớt, bắt chờ, làm ẩu), né 5 ngày cho grudge decay hết, rồi quay lại vắt tiếp. Vì decay có sàn và có thời gian, chiến lược này về lý thuyết **có lời**.

**Bịt bằng một biến mới, không đụng gì tới decay:**

```ts
type TrustCeiling = {
  value: number        // khởi đầu 100
  burnCount: number    // số lần bị đốt, không bao giờ giảm
  history: { day: number; reason: BurnReason }[]   // để sổ tay cô Ba có chất liệu
}

type BurnReason = 'HEAVY_DAY' | 'BIG_DROP' | 'COOL_OFF_CYCLE'

function detectBurn(npc: Npc, day: number): BurnReason | null {
  const negToday = npc.todayEvents.filter(e => e.valence < 0)
  if (negToday.filter(e => SALIENCE[e.kind] >= 75).length >= 2) return 'HEAVY_DAY'
  if (npc.pointsAtDawn - npc.points >= 30)                       return 'BIG_DROP'
  // chính xác cái vòng lặp của ăn gian (d):
  if (npc.wasRivalOnDay != null
      && npc.missStreakSinceRival >= 3
      && npc.servedToday
      && npc.points >= npc.pointsAtRival + 20)                   return 'COOL_OFF_CYCLE'
  return null
}

function applyBurn(npc: Npc, reason: BurnReason, day: number) {
  npc.ceiling.burnCount += 1
  npc.ceiling.history.push({ day, reason })
  npc.ceiling.value = 100 - 12 * Math.min(npc.ceiling.burnCount, 4)   // 100→88→76→64→52
  npc.points = Math.min(npc.points, npc.ceiling.value)
}
```

| `burnCount` | `trustCeiling` | Hệ quả cứng |
|---|---|---|
| 0 | 100 | Bình thường |
| 1 | 88 | Vẫn lên Friend được. Chỉ mất đỉnh |
| 2 | 76 | Vẫn Friend, nhưng không bao giờ vào dải decay −20 êm nữa |
| 3 | 64 | Chỉ còn hơn ngưỡng Friend 4 điểm — mong manh |
| **4+** | **52** | **Dưới ngưỡng vào Friend (60). Vĩnh viễn không bao giờ là bạn nữa** |

**Vì sao đây là cách bịt đúng chứ không phải một hình phạt:**

- Grudge **vẫn decay bình thường**. NPC **thật sự hết giận** — thoại ấm lại, họ vẫn mua, vẫn cười, vẫn trả tiền. Không có gì "nhớ mãi" theo kiểu nhân vật bị lập trình để thù dai.
- Cái mất là **trần**, không phải sàn. Hết giận nhưng **không bao giờ thân lại như cũ**. Đó đúng là điều xảy ra ngoài đời, và nó là một câu thoại mà không ai cần nói ra.
- **Nó không thể bị farm ngược.** Không có hành động nào nâng `trustCeiling` lên lại. Đây là thứ duy nhất trong toàn bộ hệ trí nhớ **không thể phục hồi** — cố ý, và nó song chiếu với "fail mềm nhưng vĩnh viễn" của CANON §13.

**Tín hiệu gián tiếp bắt buộc (T3 — không được hiện `trustCeiling`):** trần bị hạ phải **nhìn thấy được** qua hành vi, nếu không nó chỉ là một hình phạt ẩn và người chơi có quyền gọi nó là bug.

| `burnCount` | Tín hiệu quan sát được |
|---|---|
| ≥1 | Khách **không bao giờ đứng `FRONT_CENTER` nữa** — luôn lệch sang `FRONT_SIDE`. Khoảng cách xã hội, không cần chú thích |
| ≥2 | **Không bao giờ giới thiệu người khác** tới xe (mất kênh khách mới — có giá kinh tế thật, xem P3) |
| ≥3 | Không kể chuyện đời mình nữa → **`REMEMBERED_STORY` không bao giờ trigger được với NPC này** |
| 4 | Câu chào chuyển vĩnh viễn sang pool `polite_distant`: *"Cho một ổ."* — không "con", không "cô", không tên |

> Câu thoại chẩn đoán để người chơi tự nối được (bà Sáu, nút gossip, nói với người chơi ở P2-04):
> *"Chú Tư hả? Ổng nói ổng vẫn mua chớ. Mà nói chi đâu á con, giọng ổng khác hồi trước rồi."*

### 2.9. Lịch sinh hoạt NPC — đầu vào cho dự báo cầu

**Ranh giới với CANON §16 Đừng-1 (không mô phỏng sâu đời sống NPC ngoài quầy):** chúng ta **không** mô phỏng chú Tư đi làm. Chúng ta lưu **một hàm xác suất xuất hiện tại quầy** + **một danh sách câu để chú NÓI RA lý do** + **tối đa một prop hình ảnh**. Đúng nguyên tắc Jeff Orkin: *"Vocalizing intentions can sometimes even be enough, without any actual implementation."*

```ts
type Weekday = 'MON'|'TUE'|'WED'|'THU'|'FRI'|'SAT'|'SUN'

type ScheduleRule = {
  days: Weekday[]
  arriveMin: number        // phút từ 00:00 — 6*60+45 = 405
  jitterMin: number        // ±, phân phối tam giác quanh arriveMin
  probability: number      // 0..1 — không ai ghé 100% số ngày
  zone: Zone               // FRONT_CENTER | FRONT_SIDE | QUEUE_2 | ...
  orderPreset: string      // id preset trong content/recipes
  loaves: number           // số ổ — ĐẦU VÀO TRỰC TIẾP CỦA §2.10
}

type ScheduleOverride = {
  fromDay: number
  toDay?: number           // không có = vĩnh viễn
  reason: 'SHIFT_CHANGE'|'COMPANY_MOVE'|'SICK'|'FAMILY'|'EXAM'|'RAIN'|'PAYDAY'
  effect: ('SHIFT_TIME'|'SKIP'|'LOWER_PROB'|'SMALLER_ORDER'|'CHANGE_ZONE')[]
  deltaMin?: number
  probMul?: number
  loavesDelta?: number
  announce: BarkId[]       // Đừng-1: NÓI RA. Bắt buộc ≥1 dòng, phát TRƯỚC khi hiệu lực
  announceLeadDays: number // báo trước bao nhiêu ngày — XĐ3 phanh #1 đòi 3–4
  prop?: 'BANDAGED_HAND'|'WET_SHIRT'|'NEW_UNIFORM'|'HELMET_IN_HAND'|'PHONE_DEAD'
}

type Schedule = { base: ScheduleRule[]; overrides: ScheduleOverride[] }
```

**Lịch thật của 3 NPC dạy hệ thống** (`content/npcs/*.json`):

```json
{
  "id": "chu_tu",
  "schedule": {
    "base": [
      { "days": ["MON","TUE","WED","THU","FRI"], "arriveMin": 405, "jitterMin": 7,
        "probability": 0.95, "zone": "FRONT_CENTER", "orderPreset": "day_du_nhieu_ot", "loaves": 1 }
    ],
    "overrides": [
      { "fromDay": 26, "reason": "COMPANY_MOVE", "effect": ["LOWER_PROB","SMALLER_ORDER"],
        "probMul": 0.6, "loavesDelta": 0, "announceLeadDays": 4,
        "announce": ["tu_companymove_1","tu_companymove_2","tu_companymove_3"] },
      { "fromDay": 30, "reason": "COMPANY_MOVE", "effect": ["SKIP"],
        "probMul": 0.0, "announceLeadDays": 0, "announce": [] }
    ]
  }
}
```

```json
{
  "id": "anh_dung",
  "schedule": {
    "base": [
      { "days": ["MON","TUE","WED","THU","FRI","SAT"], "arriveMin": 440, "jitterMin": 22,
        "probability": 0.7, "zone": "FRONT_SIDE", "orderPreset": "thit_goi_mang_ve", "loaves": 1 }
    ],
    "overrides": [
      { "fromDay": 18, "reason": "SHIFT_CHANGE", "effect": ["SHIFT_TIME"],
        "deltaMin": 660, "announceLeadDays": 3,
        "announce": ["dung_canight_1","dung_canight_2"], "prop": "HELMET_IN_HAND" }
    ]
  }
}
```

**Thoại `announce` — đúng giọng nhân vật, phát rải trong 3–4 ngày trước:**

```
tu_companymove_1  "Con biết gì hông, công ty chú tính dời qua bển. Chưa biết chừng nào."
tu_companymove_2  "Chắc chú đi sớm hơn bữa nay. Đường xa hơn rồi."
tu_companymove_3  "Thôi cho chú nửa ổ thôi con. Dạo này chú ăn sáng ở bển."
tu_companymove_4  "Con nhớ giữ gìn sức khoẻ nghen. Chú nói vậy thôi."      # ngày cuối
dung_canight_1    "Anh tính chạy đêm em à. Ngày đông xe quá, chạy hoài không có cuốc."
dung_canight_2    "Mai mốt sáng không thấy anh thì đừng có tưởng anh giận nghen."
```

**Lệch lịch vì đời họ** — mỗi ngày, đúng **một** NPC được rút để có một `lifeEvent` nhỏ (không phải mô phỏng, chỉ là một bản ghi + một dòng thoại + tối đa một prop):

```ts
function rollLifeEvent(day: number, rng: SeededRng): LifeEvent | null {
  if (day < 4) return null                                 // 2 giờ đầu: thế giới phải đứng yên
  if (rng.chance(0.35) === false) return null              // ~1 sự kiện / 3 ngày
  const npc = rng.pick(activeNpcs(day))
  const ev  = rng.pick(LIFE_EVENTS[npc.id])
  return { npc: npc.id, kind: ev.kind, announce: ev.bark, prop: ev.prop, shiftMin: ev.shiftMin }
}
```

| NPC | `lifeEvent` | Hiệu ứng lịch | Câu nói ra |
|---|---|---|---|
| Bà Bảy | Đi coi cải lương tối qua | +25 phút, mệt | *"Tối qua cô coi tuồng tới khuya. Nay dậy trễ."* |
| Chú Tư | Trực đêm thay ca | Không ghé, hôm sau ghé sớm 20 phút | *"Hôm qua chú trực thế cho thằng Hùng."* |
| Anh Dũng | Xe thủng lốp | −1 ổ, trễ 15 phút, prop `WET_SHIRT` | *"Xẹp bánh giữa đường em ơi. Dắt bộ cả cây số."* |
| Chị Lan | Họp sớm | Ghé sớm 30 phút, `zone` → `QUEUE_2` | (không nói gì — đúng tính cách) |
| Bé Su | Kiểm tra giữa kỳ | 3 ngày không ghé | *"Con thi xong con ghé quay tiếp nha cô!"* |
| Ông Hải | Nhậu tối qua | Ghé chiều thay vì sáng → gặp phiên bản khó chịu | *"Ê nhỏ. Cho chú ổ."* |
| Chị Hạnh | Mẹ ở quê vô chơi | +1 ổ trong 2 ngày | *"Cho chị hai cái nhé, mẹ chị mới vào."* |
| Anh Bảo | Hết pin điện thoại | `gazeFactor` **tăng vọt** hôm đó, prop `PHONE_DEAD` | *"Dạ... hết pin rồi cô."* |

> Sự kiện cuối cùng là món quà cho người chơi hệ thống: **hôm anh Bảo hết pin là hôm duy nhất anh ta nhìn bạn làm bánh.** Không có tutorial nào dạy hệ perception tốt bằng nó.

**Người chơi phải SUY RA lịch từ quan sát — game không bao giờ hiện lịch.**

Bảng ranh giới này là hợp đồng với P2-05 và không được phá:

| Game LÀM | Game **KHÔNG BAO GIỜ** làm |
|---|---|
| Ghi nhật ký thô: *ai · mấy giờ · gọi gì · lần thứ mấy* | Hiện `probability`, `arriveMin`, `jitterMin` |
| Cho NPC **nói ra** khi lịch sắp đổi (≥3 ngày trước) | Hiện dòng "Chú Tư: T2–T6, 6h45" ở đâu đó |
| Cho một prop hình ảnh gợi ý | Hiện lịch tuần dạng bảng / calendar view |
| Cho dòng *"lâu rồi không thấy ghé"* trong sổ | Tính giùm "mai cần bao nhiêu ổ" |
| Cho sổ tay cô Ba nhắc một câu cảm tính | Cảnh báo *"chú Tư sắp rời đi"* |

Kiến thức về lịch phải nằm **trong đầu người chơi**, được ghi bằng **chữ của người chơi** vào cột diễn giải của sổ tay (P2-05 §2.2). Đó là toàn bộ vốn liếng họ mang sang bài toán tồn kho.

### 2.10. Trí nhớ có ích thật sự ở đâu — nối vào bài toán tồn kho

Không được để hệ này chỉ là trang trí cảm xúc. CANON §13.2 nói thẳng: *"Đây mới là chỗ hệ trí nhớ NPC có ích thật sự."*

Chuỗi nhân quả đầy đủ, viết ra để P3 cắm vào:

```
lịch sinh hoạt (2.9)
    → người chơi QUAN SÁT (nhật ký thô, P2-05)
        → người chơi SUY RA "sáng mai ai ghé, mỗi người mấy ổ"
            → quyết định nhập hàng tối nay (P3-01)
                → hạn dùng (pate 2 ngày, rau 1 ngày) phạt cả hai chiều
                    → nhập dư = lỗ · nhập thiếu = hết hàng giữa buổi
                        → hết hàng = MADE_THEM_WAIT / khách đến mà không có hàng (§8l)
                            → memory âm (2.4)
                                → points tụt (2.5)
                                    → NPC ghé thưa hơn (probability giảm theo bucket)
                                        → lịch của chính người đó thay đổi
                                            → vòng lặp đóng
```

**Cụ thể hoá bước "NPC ghé thưa hơn"** — đây là khớp nối duy nhất trí nhớ → lịch, và nó phải nhẹ:

```ts
function effectiveProbability(npc: Npc, rule: ScheduleRule): number {
  const bucketMul = { Rival: 0.45, Acquaintance: 1.0, Friend: 1.15 }[npc.bucket]
  const ceilPenalty = npc.ceiling.burnCount >= 2 ? 0.9 : 1.0
  return clamp(rule.probability * bucketMul * ceilPenalty, 0, 0.98)
}
```

Chú ý **trần 0.98**: không bao giờ có NPC ghé 100% số ngày. Người chơi phải xây mô hình **xác suất**, không phải mô hình lịch cứng — và đó chính là chỗ cái sổ tay trở nên có giá trị thật thay vì trở thành một bảng tra.

**Bài toán thật mà người chơi giải mỗi tối** (ví dụ ngày 12, thứ Tư, đêm trước có mưa dự báo):

| NPC | Người chơi quan sát được gì | Ước lượng của họ |
|---|---|---|
| Chú Tư | *"7 ngày liền, T2–T6, luôn 6h45. T7 CN không thấy."* | ~1 ổ, gần chắc |
| Bà Bảy | *"Ngày nào cũng ghé nhưng giờ lung tung."* | ~1 ổ, chắc |
| Anh Dũng | *"Bữa có bữa không."* | ~0.7 ổ |
| Chị Lan | *"5 hôm rồi không thấy."* ← **tín hiệu nguy** | ~0.3 ổ |
| Bé Su | *"Đang mùa thi."* | ~0 |
| **Tổng** | | **~4 ổ + khách vãng lai** |

Và mưa làm giảm ~40% lượng khách (CANON §8c). Người chơi cân nhắc. **Không có nút "tính giùm".** Nếu có, cả hệ này vô nghĩa.

### 2.11. T3 — không hiện chỉ số nào. Danh sách chính xác các tín hiệu thay thế

Đây là danh sách **đóng**. Không có tín hiệu nào khác được phép mang thông tin quan hệ, và không có tín hiệu nào trong đây được phép hiện kèm con số.

| # | Tín hiệu | Rival | Acquaintance | Friend |
|---|---|---|---|---|
| 1 | **Cách chào** | Không chào, hoặc *"Cho một ổ."* | *"Cho cô/chú một ổ đầy đủ."* | Gọi tên + hỏi han: *"Nay khoẻ hông con?"* |
| 2 | **Có gọi tên mình không** | Không bao giờ | Xưng hô chung (*"con"*, *"em"*) | **Gọi đúng tên người chơi** |
| 3 | **Khoảng cách đứng** (`zone`) | `QUEUE_2`/`QUEUE_3`, lệch người | `FRONT_SIDE` | `FRONT_CENTER`, tì tay lên quầy |
| 4 | **Hướng nhìn** (`gazeFactor`) | Nhìn tay, soi | Nhìn bâng quơ | **Nhìn mặt** bạn khi nói |
| 5 | **Có giới thiệu người khác không** | Không | Hiếm | *"Nay tui dắt thằng em qua nè."* → **khách mới** |
| 6 | **Tip / tiền lẻ** | Đếm kỹ, đòi đủ | Lấy lại đủ | *"Khỏi thối."* / bỏ ống heo |
| 7 | **Thứ tự đến trong ngày** | Ghé cuối, hoặc lúc vắng | Giữa buổi | **Ghé đầu** — và nhận "mở hàng" (CANON §14) |
| 8 | **Chịu chờ bao lâu** (kiên nhẫn nền) | Ngắn nhất | Bình thường | *"Từ từ đi con, chú không gấp."* |

**Bốn tín hiệu trễ, chỉ xuất hiện ở Friend và chỉ mỗi mùa một lần** — đây là chỗ người chơi biết mình đã thật sự đi tới đâu:

| Tín hiệu | Biểu hiện |
|---|---|
| **Nhờ vả** | *"Con ngó giùm cái xe cô chút nghen, cô chạy qua bển xíu."* |
| **Kể chuyện nhà** | Mở `REMEMBERED_STORY` cho mùa sau đó |
| **Đặt trước** | *"Mai để cho chú hai ổ nghen, chú đãi khách."* → **thay đổi bài toán tồn kho** |
| **Đổi cách định vị nhà** | *"Nhà tui gần xe bánh mì cô Ba"* — xem P2-05 §2.5 |

**Ba thứ bị cấm tuyệt đối** (nếu thấy trong build, đó là bug P0):

- ❌ `+3 trust` / `-5 mood` / bất kỳ con số bay lên nào.
- ❌ Thanh tình cảm, trái tim, sao, mặt cười, màu tên NPC, badge "Friend".
- ❌ Dòng tooltip kiểu *"Bà Bảy đang giận bạn vì bạn làm rớt bánh hôm qua"*. Nếu người chơi cần biết, **NPC phải nói ra hoặc bà Sáu phải kể lại** (P2-04).

---

## 3. Dữ liệu & schema

```ts
// ---------- Memory ----------
type MemoryKind =
  | 'WRONG_NAME' | 'MADE_THEM_WAIT' | 'BURNT_OR_COLD' | 'DROPPED_FOOD'
  | 'ORDER_DEFECT' | 'DIRTY_HANDS'
  | 'REMEMBERED_USUAL' | 'REMEMBERED_STORY' | 'CARED_FOR_THEM'
  | 'FREE_EXTRA' | 'FLOURISH'
  | `HEALED_${'WRONG_NAME'|'DROPPED_FOOD'|'DIRTY_HANDS'|'BURNT_OR_COLD'|'ORDER_DEFECT'}`

type MemorySource =
  | { via: 'WITNESSED' }                                   // tự chứng kiến
  | { via: 'HEARD'; from: NpcId; hops: number; chain: NpcId[]; mutated: boolean }

type Memory = {
  id: string
  kind: MemoryKind
  valence: -1 | 1
  intensity: number          // giá trị hiện tại, cache lại mỗi đêm
  intensity0: number         // lúc tạo — MẪU SỐ CỦA redeem, không bao giờ đổi
  dayCreated: number
  dayLastReinforced: number
  occurrences: number        // đếm TUYẾN TÍNH (§8g), khác với 0.75^(n-1) của §2.6
  source: MemorySource
  confidence: number         // 1.0 nếu WITNESSED; giảm 0.7–0.85 mỗi hop (P2-04)
  decayRate: number          // suy ra từ kind + personality, lưu để save tương thích ngược
  tier: 'SHORT' | 'LONG' | 'CORE'
  redeemPaid: number
  redeemDays: number[]
  detail?: {                 // slot nội dung để rule DB ráp thoại
    wrongNameUsed?: string
    missingIngredient?: string
    dishPreset?: string
    weather?: 'RAIN' | 'HOT'
  }
}

// ---------- Relationship ----------
type Bucket = 'Rival' | 'Acquaintance' | 'Friend'

type Relationship = {
  npcId: NpcId
  points: number                       // −100..100 — KHÔNG BAO GIỜ LÊN MÀN HÌNH
                                       // (P2-02 gọi trường này là `relPoints` — cùng một biến)
  bucket: Bucket
  highestBucketReached: Bucket | null  // quyết định SÀN
  pointsAtDawn: number
  visitCount: number
  lastVisitDay: number
  missStreak: number
  servedToday: boolean
  knownPrefs: string[]                 // game biết; người chơi phải tự đoán
  short: Memory[]
  long: Memory[]
  core: Memory | null
  ceiling: TrustCeiling
  wasRivalOnDay: number | null
  pointsAtRival: number
  missStreakSinceRival: number
}
```

**Ví dụ content thật** — `content/npcs/ba_bay.json` (trích phần liên quan):

```json
{
  "id": "ba_bay",
  "ten": "Bà Bảy",
  "vai": "Bán vé số",
  "personality": { "soi": 0.9, "nongTinh": 0.6, "deTha": 0.8, "thanThien": 0.7 },
  "slots": { "short": 8, "long": 4, "core": 1 },
  "coreTriggers": ["FIRST_REMEMBERED_USUAL", "CARED_IN_RAIN", "REPEATED_WRONG_NAME"],
  "knownPrefs": ["nhieu_pate", "khong_ot", "banh_nuong_lai"],
  "schedule": {
    "base": [
      { "days": ["MON","TUE","WED","THU","FRI","SAT","SUN"], "arriveMin": 430,
        "jitterMin": 45, "probability": 0.88, "zone": "FRONT_CENTER",
        "orderPreset": "nhieu_pate_khong_ot", "loaves": 1 }
    ],
    "overrides": [
      { "fromDay": 1, "reason": "FAMILY", "effect": ["SHIFT_TIME"], "deltaMin": 25,
        "announceLeadDays": 0, "announce": ["bay_caiuong_1"] }
    ]
  },
  "lifeEvents": [
    { "kind": "CAI_LUONG_KHUYA", "bark": "bay_caiuong_1", "shiftMin": 25 }
  ]
}
```

**Trạng thái runtime một NPC** (ngày 14, sau khi bị gọi sai tên ngày 9 và được chăm sóc ngày 11–13):

```json
{
  "npcId": "ba_bay",
  "points": 41, "bucket": "Acquaintance", "highestBucketReached": "Friend",
  "pointsAtDawn": 38, "visitCount": 12, "lastVisitDay": 14, "missStreak": 0,
  "ceiling": { "value": 100, "burnCount": 0, "history": [] },
  "short": [
    { "id": "m_091", "kind": "WRONG_NAME", "valence": -1,
      "intensity": 62.4, "intensity0": 90, "dayCreated": 9, "dayLastReinforced": 9,
      "occurrences": 1, "source": { "via": "WITNESSED" }, "confidence": 1.0,
      "tier": "SHORT", "redeemPaid": 148, "redeemDays": [11, 13],
      "detail": { "wrongNameUsed": "bà Sáu" } },
    { "id": "m_131", "kind": "CARED_FOR_THEM", "valence": 1,
      "intensity": 50, "intensity0": 50, "dayCreated": 13, "dayLastReinforced": 13,
      "occurrences": 2, "source": { "via": "WITNESSED" }, "confidence": 1.0, "tier": "SHORT" }
  ],
  "long": [
    { "id": "m_004", "kind": "REMEMBERED_USUAL", "valence": 1,
      "intensity": 71, "intensity0": 90, "dayCreated": 4, "dayLastReinforced": 10,
      "occurrences": 5, "source": { "via": "WITNESSED" }, "confidence": 1.0, "tier": "LONG" }
  ],
  "core": { "id": "m_core", "kind": "REMEMBERED_USUAL", "tier": "CORE",
            "intensity": 100, "intensity0": 100, "dayCreated": 6,
            "detail": { "dishPreset": "nhieu_pate_khong_ot" } }
}
```

Đọc trạng thái này: bà Bảy **đã từng là Friend** (sàn +35), bị gọi sai tên ngày 9 làm rớt xuống Acquaintance, người chơi đã chuộc 2/3 ngày cần thiết và trả 148/225 công. **Một buổi sáng nhớ đúng "nhiều pate không ớt" nữa là lành.** Không một con số nào trong đoạn JSON này được phép lên màn hình.

---

## 4. UI/UX hai thiết bị

Hệ trí nhớ **không có UI riêng**. Nó chỉ tồn tại qua ba mặt phẳng đã có:

| Mặt phẳng | PC | Mobile (v2) |
|---|---|---|
| **Người và hành vi** (§2.11) | Layered sprite (CANON §16 Đừng-4): 6 lông mày × 6 mắt × 6 miệng + lean/tilt bằng spring node | Giống hệt. Sprite đã đủ lớn ở 720p |
| **Nhật ký thô** (P2-05) | Bảng cuộn dọc trong scene `EveningScene` | Danh sách card, vùng chạm ≥44pt |
| **Sổ tay cuối ngày** (P2-05) | Trang giấy, chữ viết tay cô Ba | Giống, cỡ chữ theo 4 mức của CANON §15 |

**Ba quy tắc UI phải giữ:**

1. **`zone` của khách là một tín hiệu, nên nó phải đọc được từ xa.** Khoảng cách `FRONT_CENTER` ↔ `FRONT_SIDE` phải đủ lớn để nhận ra ở 720p — đề xuất **≥ 64px** tại độ phân giải thiết kế, không phải vài pixel tinh tế.
2. **Không có hover tooltip nào trên người NPC.** Trỏ chuột vào chú Tư không hiện gì hết. Muốn biết chú nghĩ gì thì nhìn mặt chú.
3. **Chế độ giảm chuyển động (CANON §15.3)** không được làm mất tín hiệu quan hệ: khi tắt animation, `lean`/`tilt` vẫn giữ **tư thế tĩnh** khác nhau giữa 3 bucket. Tín hiệu phải sống sót qua mọi công tắc trợ năng.

---

## 5. Tham số cần tune

| Tên | Khởi điểm | Khoảng | Cách đo |
|---|---|---|---|
| `slotShort` | `6 + 2·soi` | 6–8 | Playtest: người chơi có cảm thấy "nó quên nhanh quá / nhớ dai quá" ở ngày 10 |
| `PROMOTE_AFTER_DAYS` | 3 | 2–5 | Đếm số memory lên LONG trong 40 ngày; mục tiêu **8–14** cho một NPC ruột |
| `PROMOTE_FLOOR` | 45 | 35–60 | Cùng phép đo trên |
| `DECAY[*].hold` | Bảng §2.4 | 0–3 | A/B: tắt pha GIỮ → hỏi "khách có vẻ giận thật không" |
| `DECAY[*].taper` | Bảng §2.4 | ×0.7…×1.5 | Số ngày để `WRONG_NAME` chạm sàn; mục tiêu **12–16 ngày** |
| `DECAY[*].floor` | Bảng §2.4 | 0–30 | Kiểm: memory sàn có còn đổi thoại nhận ra được không |
| `temperFactor` (âm) | `0.5 + 1.0·deTha` | hệ số 0.8–1.2 | Chú Tư (0.9) và chị Lan (0.2) phải cảm thấy **rõ ràng khác nhau** trong 1 buổi chơi |
| Decay bands | −2 / −10 / −20 | ±50% | Playtest nghỉ 3 ngày: có thấy "hơi xa" mà không thấy "mất trắng" |
| `GRACE_MISSES` | 1 | 0–2 | Tỉ lệ người chơi nói *"tôi nghỉ một bữa mà nó phạt"* — mục tiêu **0%** |
| Sàn bucket | 0 / 12 / 35 | ±10 | Sau 7 ngày bỏ bê, Friend cũ phải **vẫn chào bằng tên** |
| Ngưỡng Friend | 60 | 50–70 | Số NPC đạt Friend vào ngày 40 — mục tiêu **3–5 / 12** |
| Băng hysteresis Rival | 25 | 20–35 | Số lần đổi bucket qua lại của 1 NPC trong 40 ngày — mục tiêu **≤ 3** |
| `kindnessMul` (Rival) | 1.25 | 1.0–1.5 | Số ngày trung bình để thoát Rival — mục tiêu **4–6** |
| `0.75` (chồng chất) | 0.75 | 0.6–0.85 | Đo trần tích luỹ: `1/(1−r)` phải nằm trong **2.5–6.7** |
| `REDEEM[*].K` | Bảng §2.7 | 1.2–3.0 | Số ngày thực tế chuộc `WRONG_NAME` — mục tiêu **3–5 ngày** |
| `minDistinctDays` | 1–3 | 1–4 | Không ai chuộc xong trong 1 ngày: phải **0%** |
| `trustCeiling` bước | −12 / lần | −8…−18 | Sau 4 lần đốt, `52 < 60` phải **luôn đúng** |
| `effectiveProbability` bucketMul | 0.45/1.0/1.15 | ±0.2 | Số khách/ngày trung bình dao động **±15%** quanh đường cơ sở |
| `rollLifeEvent` p | 0.35 | 0.2–0.5 | ~**1 sự kiện đời / 3 ngày** — đủ để nhận ra, không đủ để thành nhiễu |
| `announceLeadDays` | 3–4 | 3–5 | XĐ3 phanh #1: **≥7/10 người chơi nói "mình đã có thể đoán ra"** |

---

## 6. Tiêu chí đạt

**Đúng đắn cơ chế (unit test, chạy trong CI):**

- [ ] Ghi đè SHORT luôn chọn `min(currentIntensity)`. Test đối chứng: 7 memory yếu + 1 `WRONG_NAME`, nhét 5 memory mới → `WRONG_NAME` **vẫn còn**.
- [ ] `currentIntensity` liên tục và có đạo hàm liên tục tại `t = tHold` và `t = tHold + tTaper` (sai số < 0.01). **Không có cliff ở bất kỳ đâu.**
- [ ] `points` không bao giờ xuống dưới `floorOfTier(highestBucketReached)`.
- [ ] `points` không bao giờ vượt `ceiling.value`.
- [ ] Không có đường nào trong code làm `ceiling.value` **tăng**.
- [ ] Tổng đóng góp của n memory cùng kind hội tụ về `4.0 × intensity` khi n → ∞ (sai số < 1%).
- [ ] Chuộc `WRONG_NAME` trong **cùng một ngày** là bất khả thi với mọi chuỗi hành động.
- [ ] Bucket không đổi 2 lần trong cùng một ngày (hysteresis giữ được).
- [ ] `nightlyDecay` không chạy khi `wasExpectedToday === false` — chú Tư T7/CN: `points` bất biến.
- [ ] Chạy 200 mùa mô phỏng với người chơi hoàn hảo: **≥1 NPC** chạm CORE trước ngày 12; **không NPC nào** vào Rival.
- [ ] Chạy 200 mùa với người chơi ẩu 50%: **không có NPC nào** rớt xuống dưới sàn đã đạt; **không có** vòng xoáy (một NPC vào Rival rồi ở đó tới ngày 40 quá **10%** số lần chạy).

**T3 — chống rò chỉ số (test tự động quét tài nguyên):**

- [ ] Grep toàn bộ `ui/` và `content/lines/`: **0 kết quả** cho regex `[+-]\d+\s*(trust|điểm|point|mood)`.
- [ ] **0** asset có tên chứa `heart`, `trustbar`, `relationship_meter`, `friend_badge`.
- [ ] Screenshot diff giữa `points=10` và `points=70` của cùng một NPC: khác nhau ở **≥3 trong 8 tín hiệu §2.11**, và **0 pixel** thuộc HUD.

**Người chơi (playtest 10 người lạ, khớp cổng P1 của CANON §17):**

- [ ] ≥**7/10** trả lời đúng *"vì sao khách đó giận"* khi hỏi ở ngày 8.
- [ ] ≥**6/10** tự phát biểu được một luật lịch đúng (*"chú Tư cuối tuần không ra"*) **mà chưa ai nói cho họ**.
- [ ] ≥**7/10** nói *"mình đã có thể đoán ra"* chứ không phải *"game vừa cướp của mình"* sau khi chú Tư biến mất ngày 30.
- [ ] **0/10** nói được một con số quan hệ nào. Nếu có ai nói *"tôi thấy nó lên 3 điểm"* → hệ đã rò, sửa ngay.
- [ ] ≥**5/10** mô tả đúng ít nhất một trong 8 tín hiệu §2.11 bằng lời của họ (*"bả đứng xa hơn hồi trước"*).

---

## 7. Rủi ro & cách bịt

| # | Rủi ro | Mức | Cách bịt |
|---|---|---|---|
| R1 | **Người chơi không nhận ra hệ thống tồn tại** (bài học Oblivion, idea.md HT2) | **Cao** | P2-05 (sổ tay) là cả một doc dành cho rủi ro này. Nếu playtest §6 fail, **ưu tiên sửa sổ tay trước khi sửa sim** |
| R2 | Decay đọc ra như phạt vì không chơi | Cao | `wasExpectedToday` + `GRACE_MISSES` + sàn bucket. Và không bao giờ đếm theo thời gian thật (T4) |
| R3 | **CANON §8d** — đốt NPC rồi để nguội | Cao | §2.8 `trustCeiling`. Có tín hiệu quan sát được ở mọi bậc |
| R4 | **CANON §8i** — spam hành vi rẻ | Trung | §2.6 `0.75^(n-1)` + `FREE_EXTRA` có `taper` 4 ngày, `floor` 0 |
| R5 | **CANON §8g** — micro-cheat lặp 40 ngày | **Cao nhất** | `occurrences` đếm tuyến tính, **không** giảm dần. Ngưỡng pattern và dòng *"ê, dạo này bánh nhạt hơn hay tại tao?"* thuộc P2-01, nhưng **bộ đếm nằm ở đây** |
| R6 | **CANON §8e** — save-scum | Trung | Autosave ngay khi `insertShort` chạy (không đợi cuối ngày) + seed cố định theo ngày |
| R0.5 | Vòng xoáy tiêu cực kiểu RimWorld lẻn vào lúc tune | Trung | `offenseMul` là **hằng số trong code**, không phải bảng config. Đổi nó phải sửa code + qua review |
| R8 | **CANON §16 Đừng-1** — lịch sinh hoạt phình thành mô phỏng đời sống | Trung | `Schedule` **không có** state vị trí, không có pathing, không có nhu cầu. Chỉ là xác suất + bark + prop. Có test đếm: `ScheduleOverride` không được có trường nào ngoài schema §2.9 |
| R9 | 12 NPC × 40 ngày làm save phình | Thấp | Memory `intensity < 2` bị dọn lúc save. Trần thực tế: 12 × (8+4+1) = **156 memory** |
| R10 | Người chơi cảm thấy bị theo dõi / bị chấm điểm liên tục | Trung | ~35% lần "nhận thấy" **không nói gì** (CANON §11). Im lặng làm phần còn lại đáng tin |

---

## 8. Truy vết

| Nội dung | `idea.md` | `CANON.md` |
|---|---|---|
| Schema `Relationship`, 4 cơ chế "người này thật" | §9.6 (dòng 390–414) | §12 |
| 3 tầng slot, ghi đè `intensity` thấp nhất (Dwarf Fortress) | §18.4 (dòng 855–866) | §12 |
| Decay tapering, cảnh báo RimWorld "All Memories Fade" | §18.4 | §12 |
| Sàn theo bucket (Stardew), decay −2/−10/−20 | §18.4 | §12 |
| 3 bucket bất đối xứng, **không** bê vòng xoáy RimWorld ×6 | §18.4 | §4, §12 |
| Chống chồng chất `0.75^(n-1)` | §18.4 | §12 |
| Chuộc lỗi tốn công hơn gây lỗi | §9.6 mục 1 | §12 |
| Ăn gian (d) đốt NPC rồi để nguội → hạ trần vĩnh viễn | §21 mục d (dòng 1017) | §8d |
| Ăn gian (i) spam trust rẻ | §21 mục i | §8i |
| Ăn gian (g) micro-cheat theo pattern | §21 mục g | §8g |
| Lịch sinh hoạt, suy ra từ quan sát, dự báo cầu | §22 mục 2 (dòng 1046) | §13.2 |
| "Đời họ vẫn trôi khi bạn không nhìn" | §9.6 mục 4 | §9 (arc chú Tư, anh Dũng) |
| Báo trước 3–4 ngày trước khi NPC biến mất | §17 XĐ3 phanh #1 | §9 (chú Tư ~ngày 30) |
| Không hiện chỉ số, sổ do người chơi tự ghi | §9.7 bảng bẫy 2 | §1 T3 |
| Đừng-1: nói ra thay vì mô phỏng (Orkin / F.E.A.R.) | §18.6 | §16 Đừng-1 |
| Tính cách 4 chiều, `deTha` → tốc độ decay | — | §4 |
| 12 NPC có tên, `soi/nongTinh/deTha/thanThien` | §19.5 | §9 |
| Quy ước viết doc | — | §18 |

---

## 9. Đề xuất sửa CANON

1. **§12 — làm rõ ánh xạ decay −2/−10/−20.** CANON viết ba con số cạnh "3 bucket", dễ đọc thành "mỗi bucket một con số", nhưng như vậy sẽ thành 3 bucket + 1 dải Friend rất rộng không phân biệt được khách quen với khách ruột. Doc này ánh xạ decay theo **dải `points`** (`<25` / `25–59` / `≥60`) chứ không theo bucket, giữ nguyên đúng 3 bucket của §4. **Đề nghị thêm một dòng vào §12 để chốt cách đọc này.**

2. **§8d — chốt con số `trustCeiling`.** CANON chỉ nói "hạ trần tin tưởng vĩnh viễn" mà không có con số. Doc này chốt `−12/lần, tối đa 4 lần, sàn 52` — chọn 52 vì nó **dưới ngưỡng vào Friend (60)**, nên lời hứa "không bao giờ thân lại như cũ" là một bất biến kiểm tra được, không phải một câu văn. **Đề nghị đưa cặp số (60, 52) vào §8d để các doc sau không tune lệch nhau.**

3. **§12 — bổ sung tầng `HEALED_*`.** "Chuộc lỗi" ở §12 hiện không nói vết thương lành thì đi đâu. Doc này đề xuất **không xoá mà đổi dấu**, vì nó tạo ra pool thoại có giá trị cảm xúc cao nhất trong game với chi phí gần bằng 0 (5 kind × 3 biến thể = 15 dòng). **Đề nghị thêm `HEALED_*` vào danh mục kind của §12.**

4. **§9 — thêm trường `schedule` vào bảng 12 NPC.** Hiện §9 mô tả lịch bằng văn xuôi (*"khách 6h45 T2–T6"*) nên P3 không cắm vào được. Đề nghị bảng §9 trỏ tới schema `Schedule` ở doc này làm nguồn sự thật cho lịch, và giữ văn xuôi làm mô tả.

5. **§3 — `GRACE_MISSES` cần một dòng trong CANON.** Nó là thứ duy nhất đứng giữa hệ decay và cảm giác "game phạt tôi vì tôi nghỉ", tức là nó bảo vệ trực tiếp **T4**. Một hằng số quan trọng tới vậy không nên chỉ sống trong một doc phase.
