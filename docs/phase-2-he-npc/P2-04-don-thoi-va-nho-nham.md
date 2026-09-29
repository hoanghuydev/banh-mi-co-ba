# P2-04 — Đồn thổi và nhớ nhầm

**Thuộc phase:** P2 — Hệ NPC đầy đủ
**Phụ thuộc:** `P2-03` (trí nhớ & quan hệ — cung cấp `Memory`, `MemorySource`, `confidence`) · `P2-01` (Rule DB thoại) · `P2-02` (12 NPC) · `P1-02` (tầng nhận thấy) · cung cấp chất liệu cho `P2-05` (sổ tay)
**Trạng thái:** **Chốt** về ràng buộc và danh sách trắng/đen · **Cần đo** mọi hệ số ở §5 · **Còn mở**: bố cục hình ảnh của bubble nghe lỏm

---

## 1. Mục tiêu

Làm cho hẻm **có tai và có miệng**: chuyện bạn làm trước mặt một người, hai ngày sau quay lại từ miệng người thứ ba — đã méo đi một chút, và **vẫn truy được nguồn**. Phục vụ:

- **T1** — khách chấm quá trình: đồn thổi là cách một khoảnh khắc bị nhìn thấy **vượt ra khỏi người chứng kiến**. Không có nó, "bị nhìn" chỉ là chuyện giữa hai người.
- **T3** — không hiện chỉ số: người chơi **không bao giờ được thông báo** rằng tin đồn đã lan. Họ phải tự nối hai sự kiện. *"Khoảnh khắc nối được chính là khoảnh khắc thế giới trở nên sống."*
- **T5** — attention phải nhìn thấy được: tin đồn không phải xúc xắc ngầm. Nó có **nguồn**, có **đường đi**, và **nghe lỏm được**.

Và một mục tiêu phòng thủ: đây là cách bịt **CANON §8b** (phân tầng khách) — lỗ hổng ăn gian có cái fix đẹp nhất trong cả dự án, vì nó không cần thêm hệ thống nào mới.

**Nguồn học thuật:** *Talk of the Town* — James Ryan & Michael Mateas, UC Santa Cruz. Câu quyết định:

> *"Characters are not consciously aware of transferences, confabulations, or mutations."*

NPC **không ý thức được** mình đang nhớ sai. Không có dòng nào trong code, và tuyệt đối không có dòng thoại nào, cho phép một NPC nói *"chắc tôi nhớ nhầm"*. Họ nói cái họ tin, bằng giọng của người đang nói sự thật. Toàn bộ trách nhiệm phân biệt thuộc về **người chơi** — và vì thế toàn bộ trách nhiệm **cung cấp phương tiện để phân biệt** thuộc về chúng ta.

---

## 2. Cơ chế

### 2.1. Vì sao "nhớ nhầm 10% random" bị **CẮT**

Đây là cơ chế bị nhiều agent độc lập bác bỏ nhất trong cả tài liệu (idea.md HT3). Phải chép lại nguyên vẹn, vì mọi cám dỗ thêm nhiễu vào sau này sẽ bắt đầu bằng câu *"chỉ 10% thôi mà"*.

| Người phản đối | Lý do | Nó bác cái gì |
|---|---|---|
| **Sarah** (critic) | *"thiên tài **HOẶC** bug report, không có ở giữa."* 10% mỗi sự kiện là **nhiễu nền** | Bác **tần suất**. Xin **3–4 lần trong cả season**, mỗi lần có trọng lượng |
| **Minh** (tối ưu hoá) | *"tôi không phân biệt được 'NPC nhớ nhầm' với 'chính tôi quên mất ngày 8 mình làm gì'. Hai cái đó giống hệt nhau từ góc nhìn người chơi."* | Bác **tính quan sát được**. Nếu không phân biệt nổi thì cơ chế **không tồn tại** với người chơi |
| **Phản biện** | *"bạn vừa xây một hệ thống mà không có cách nào để người chơi phân biệt 'thiết kế tinh vi' với 'code lỗi'."* | Bác **tính khả tín**. Cơ chế không truy vết được sẽ bị report là bug, và họ **đúng** |
| **Linh** (ADHD) | Đây là **công tắc số 1 phải tắt được**. Bị đổ oan mà không có cách giải thích = mang cảm giác bất lực ra khỏi game | Bác **tính bắt buộc**. Phải có `settings.gossipEnabled` |
| **David** | Không cho đứa 8 tuổi chơi vì cơ chế này | Bác **phạm vi khán giả** |

**Và bằng chứng kỹ thuật quyết định** — *Talk of the Town*, sau **hơn 100 buổi diễn** công khai, phải **hạ mutation rate** vì NPC **không nhớ nổi bố mẹ mình sống ở đâu**. Một hệ thống mô phỏng trí nhớ sai lệch, chạy đủ lâu, sẽ **ăn mòn chính nền tảng sự thật** mà mọi thứ khác đứng lên.

Bài học kỹ thuật rút ra, và đây là ràng buộc #1 của §2.3:

> **`mutation_rate` phải là per-kind, KHÔNG BAO GIỜ là global.**
>
> Một con số global nghe có vẻ gọn, nhưng nó áp cùng một tỉ lệ sai lệch lên cả *"hôm qua bả bỏ ít ớt"* lẫn *"tên con nhỏ bán bánh mì là gì"*. Cái thứ nhất méo đi thì thú vị. Cái thứ hai méo đi thì thế giới sụp. Đó chính xác là chuyện đã xảy ra với Ryan & Mateas.

**Ba thứ bị cắt hẳn, viết ra để không ai tái phát minh:**

- ❌ Mỗi memory có `10%` xác suất lật dấu lúc đọc ra.
- ❌ NPC nhớ nhầm về **cái chính họ chứng kiến**. (Ký ức `WITNESSED` là **bất khả xâm phạm**. Nếu bà Bảy đứng đó và nhìn, bà Bảy nhớ đúng. Luôn luôn.)
- ❌ Nhớ nhầm về **tên người chơi, tên NPC khác, và món "như mọi bữa"**. Đây là ba trục nền của thế giới; méo chúng đi là méo chính cái thước đo.

### 2.2. Thay bằng: chỉ nhớ nhầm **QUA ĐỒN THỔI**, và luôn truy được nguồn

```
Bạn CHỨNG KIẾN  →  bạn nhớ ĐÚNG. Không ngoại lệ.
Bạn NGHE KỂ     →  bạn có thể nhớ SAI. Và bạn luôn nhớ MÌNH NGHE TỪ AI.
```

Một câu, và nó giải quyết cả bốn lời phản đối cùng lúc:

- **Sarah** được tần suất thấp: mutation chỉ xảy ra trên cạnh truyền tin, không trên sự kiện → tự nhiên hiếm. Cộng thêm **ngân sách mùa cứng** ở §2.4.
- **Minh** được khả năng phân biệt: mọi lời đồn **bắt buộc mang tên nguồn**. *"Bà Sáu nói..."*. Anh ấy nối được đường đi, và anh ấy sẽ vẽ nó lên giấy — đó chính là thứ anh ấy muốn.
- **Phản biện** được tính khả tín: có nguồn = có thể sai = **có thể kiểm chứng**. Cái phân biệt thiết kế tinh vi với code lỗi chính là **sự tồn tại của một chuỗi lý do**.
- **Linh** được lối thoát: có công tắc, và **luôn có cách giải thích** (§2.6) — trừ đúng một trường hợp cố ý, được khung rõ bằng câu chuyện chứ không phải bằng sự im lặng của hệ thống.

**Ngân sách mùa** (điều Sarah xin nguyên văn: *3–4 lần trong cả season, mỗi lần có trọng lượng*):

```ts
type GossipBudget = {
  mutationsLeft: number       // khởi đầu 4 cho cả mùa 40 ngày
  lastMutationDay: number
  minGapDays: number          // 6 — hai lần nhớ nhầm không bao giờ sát nhau
}
```

Bốn lần trong 40 ngày. Mỗi lần **phải đáng nhớ**. Không có lần thứ năm, kể cả khi người chơi chơi ẩu — vì nếu nhớ nhầm trở thành thường xuyên, nó thành thời tiết, và thời tiết thì không ai tranh luận với.

### 2.3. Sáu ràng buộc bắt buộc (CANON §12) — triển khai từng cái

#### RB1. `mutation_rate` per-kind, không global

```ts
type MutationEdge = { to: string; rate: number; severity: 'EXAGGERATE'|'INTENT'|'PRAISE' }

const MUTATION_GRAPH: Record<MemoryKind, MutationEdge | null> = {
  // ── tiêu cực ──────────────────────────────────────────────────────────
  DROPPED_FOOD:     { to: 'ban_do_roi_dat',    rate: 0.30, severity: 'EXAGGERATE' },
  ORDER_DEFECT:     { to: 'an_bot_nguyen_lieu',rate: 0.35, severity: 'INTENT'     },
  WRONG_NAME:       { to: 'chanh_khong_nho',   rate: 0.40, severity: 'INTENT'     },
  DIRTY_HANDS:      { to: 'cam_tien_boc_do',   rate: 0.28, severity: 'EXAGGERATE' },
  BURNT_OR_COLD:    { to: 'ban_banh_hom_qua',  rate: 0.22, severity: 'INTENT'     },
  MADE_THEM_WAIT:   { to: 'om_dom_qua',        rate: 0.15, severity: 'EXAGGERATE' },
  // ── tích cực ──────────────────────────────────────────────────────────
  REMEMBERED_USUAL: { to: 'ngon_nhat_khu',     rate: 0.20, severity: 'PRAISE'     },
  REMEMBERED_STORY: { to: 'nho_het_chuyen_nha',rate: 0.22, severity: 'PRAISE'     },
  CARED_FOR_THEM:   { to: 'tu_te_lam',         rate: 0.18, severity: 'PRAISE'     },
  FREE_EXTRA:       { to: 'cho_them_vi_e',     rate: 0.25, severity: 'INTENT'     },
  FLOURISH:         { to: 'tay_nghe_nhu_co_ba',rate: 0.10, severity: 'PRAISE'     },
  HEALED_ANY:       { to: 'hoi_do_lo_gio_ky',  rate: 0.12, severity: 'PRAISE'     },
  // ── BẤT KHẢ XÂM PHẠM ──────────────────────────────────────────────────
  PLAYER_NAME:      null,
  NPC_NAME:         null,
  USUAL_ORDER:      null,
}
```

**Bảng mutation mở rộng — dạng đọc được, có ví dụ thoại:**

| Gốc | → Biến dạng | rate | Loại | Câu thoại mang biến dạng đó |
|---|---|---|---|---|
| `DROPPED_FOOD` | *"bán đồ rơi xuống đất"* | 0.30 | Phóng đại | **Cô Mai:** *"Nghe nói con nhỏ đó nhặt bánh dưới đất bán cho khách hả? Ghê vậy."* |
| `ORDER_DEFECT` | *"ăn bớt nguyên liệu"* | **0.35** | **Đổi ý định — nặng nhất** | **Chú Kiệt:** *"Bên đó dạo này pate mỏng dính à nghen. Ai cũng nói."* |
| `WRONG_NAME` | *"chảnh, không thèm nhớ khách"* | **0.40** | Đổi ý định | **Bà Bảy:** *"Nghe đồn nó bán đắt rồi nó chảnh. Khách quen cũng không thèm nhớ tên."* |
| `DIRTY_HANDS` | *"cầm tiền xong bốc đồ ăn"* | 0.28 | Phóng đại | **Thầy Phúc:** *"Có người nói vậy. Mà thầy chưa thấy tận mắt nên thầy chưa tin."* |
| `BURNT_OR_COLD` | *"bán bánh hôm qua"* | 0.22 | Đổi ý định | **Ông Hải:** *"Bánh nguội ngắt. Bán đồ tồn hả mậy?"* |
| `MADE_THEM_WAIT` | *"ôm đồm quá làm không xuể"* | 0.15 | Phóng đại | **Anh Dũng:** *"Nghe nói bên đó đợi lâu lắm. Anh chạy cuốc nên anh ghé chỗ khác."* |
| `REMEMBERED_USUAL` | *"ngon nhất khu này"* | 0.20 | Khen quá | **Bé Su:** *"Cô ơi! Bà Sáu nói bánh mì cô ngon nhất cái khu này đó!"* |
| `REMEMBERED_STORY` | *"nhớ hết chuyện nhà người ta"* | 0.22 | Khen quá | **Chị Hạnh:** *"Người ta bảo cô nhớ hết chuyện nhà khách. Thế thì quý quá."* |
| `CARED_FOR_THEM` | *"tử tế lắm"* | 0.18 | Khen quá | **Bà Sáu:** *"Con nhỏ đó tử tế lắm con. Bữa mưa nó che dù cho bà Bảy."* |
| `FREE_EXTRA` | *"cho thêm vì ế hàng"* | 0.25 | **Công hoá tội** | **Chú Kiệt:** *"Nó cho thêm đồ chua hoài đó. Ế chớ tử tế gì."* |
| `FLOURISH` | *"tay nghề y như cô Ba hồi xưa"* | 0.10 | Khen quá | **Thầy Phúc:** *"Người ta nói con làm y như cô Ba hồi trẻ."* |
| `HEALED_*` | *"hồi đó có lỡ, giờ kỹ lắm"* | 0.12 | Khen quá | **Cô Mai:** *"Hồi đầu nghe đồn này nọ. Giờ thấy con nó kỹ thiệt."* |

**Ba nhận xét về bảng này** (nó là "chỗ vui nhất của game" theo CANON §12, nên đáng đọc kỹ):

1. **`rate` cao nhất không phải là nguy hiểm nhất.** `WRONG_NAME` có rate 0.40 nhưng biến dạng của nó chỉ là một lời chê tính cách. `ORDER_DEFECT` chỉ 0.35 nhưng biến dạng **đổi lỗi kỹ thuật thành lỗi đạo đức** — từ *"quên bỏ hành"* thành *"ăn bớt nguyên liệu"*. Đó là cái nặng nhất, và nó nặng vì nó không thể bị bác bỏ bằng một lần làm đúng.
2. **`FREE_EXTRA` là cạnh duy nhất biến việc tốt thành việc xấu** — "công hoá tội". Nó tồn tại để bịt CANON §8i: nếu cho thêm đồ chua với mọi người mọi ngày là chiến lược không rủi ro, nó sẽ là dominant strategy. Giờ nó có một đuôi rủi ro nhỏ và **đúng kiểu hẻm**: người ta đồn bạn ế.
3. **Tin tốt cũng méo.** Nhưng méo theo hướng **có lợi** (§2.8). Đây không phải hệ thống trừng phạt; đây là hệ thống phóng đại, và nó phóng đại về phía tốt mạnh hơn.

#### RB2. Cap 2–3 hop

```ts
const MAX_HOPS = 3     // hop 0 = người chứng kiến; hop 3 = người thứ tư
```

Ở hop 3, tin **chết hẳn** — không lan tiếp, và `confidence` đã xuống dưới `MIN_CONFIDENCE` nên nó không còn đổi được thoại nữa, chỉ còn đổi **dáng đi và thứ tự đến**. Cap này không phải để tối ưu; nó để **cái hẻm có kích thước**. Một tin không được phép đi vòng quanh 12 người rồi quay lại người chứng kiến — vì lúc đó không ai truy được nguồn nữa, và ràng buộc RB3 chết.

#### RB3. `confidence *= 0.7–0.85` mỗi hop, nguồn **phải truy vết được**

```ts
function transmit(belief: Belief, from: Npc, to: Npc): Belief {
  const keep = 0.70 + 0.15 * from.personality.thanThien   // người mở lòng kể thuyết phục hơn
  return {
    ...belief,
    hops: belief.hops + 1,
    confidence: belief.confidence * keep,
    chain: [...belief.chain, from.id],                    // KHÔNG BAO GIỜ rỗng
    source: { via: 'HEARD', from: from.id, hops: belief.hops + 1,
              chain: [...belief.chain, from.id], mutated: belief.mutated },
  }
}
```

**Luật cứng về thoại:** mọi dòng thoại phát ra từ một `Belief` có `via === 'HEARD'` **bắt buộc** chèn tên `source.from`. Không có ngoại lệ. Rule DB phải có criterion `belief.source.via == 'HEARD'` → chọn `responses` từ pool `hearsay_*`, và mọi dòng trong pool đó có slot `{source}`:

```
hearsay_generic_1   "{source} nói con {claim} hả?"
hearsay_generic_2   "Nghe {source} kể {claim}. Có thiệt hông con?"
hearsay_doubt_1     "{source} nói vậy đó. Mà thầy chưa thấy tận mắt nên thầy chưa tin."
hearsay_relay_1     "{source} nói {claim}. Mà {source} cũng nghe ai đó nói lại thôi."   # hop ≥2
```

Dòng `hearsay_relay_1` là dòng đắt nhất trong bộ: nó **hiện ra rằng chuỗi có nhiều mắt xích** mà không cần vẽ đồ thị. Người chơi nghe một lần là hiểu luật.

**Test tự động bắt buộc:** duyệt toàn bộ `content/lines/`, mọi dòng gắn concept `hearsay` mà **không chứa `{source}`** → build fail. Đây là ràng buộc kỹ thuật, không phải hướng dẫn cho writer.

#### RB4. Người chơi phải **NGHE LỎM** được → §2.7 (cả một mục riêng)

#### RB5. Tin tốt lan mạnh hơn tin xấu → §2.8

#### RB6. Không xảy ra trong 2 giờ chơi đầu + có công tắc tắt

```ts
const GOSSIP_START_DAY = 4         // ~2 giờ chơi. Đo lại sau playtest, KHÔNG đoán
const MUTATION_START_DAY = 8       // nhớ nhầm bắt đầu muộn hơn đồn thổi 4 ngày nữa

function gossipEnabled(day: number, s: Settings): boolean {
  return s.npcMisremember && day >= GOSSIP_START_DAY
}
```

**Vì sao hai mốc, không phải một:** trong 4 ngày đầu người chơi còn đang học luật (Sarah). Nhưng nếu bật cả đồn thổi lẫn nhớ nhầm cùng lúc ở ngày 4, người chơi không có cách nào học được rằng *đồn thổi thì đúng, nhớ nhầm mới sai*. Cho họ **4 ngày đồn thổi CHÍNH XÁC** trước đã — để họ tin vào chuỗi — rồi mới bẻ nó. Bẻ một thứ người ta chưa tin thì không đau và cũng không thú vị.

**Công tắc** (CANON §15 — đây là **công tắc số 1** trong 6 công tắc bắt buộc):

| Trạng thái | Đồn thổi | Nhớ nhầm | Đổ oan | Nghe lỏm |
|---|---|---|---|---|
| **Bật** (mặc định) | ✅ | ✅ (ngân sách 4/mùa) | ✅ | ✅ |
| **Tắt** | ✅ **vẫn chạy** | ❌ | ❌ | ✅ **vẫn chạy** |

Chú ý: tắt công tắc **không tắt đồn thổi**. Nó chỉ ép `mutation_rate = 0` cho mọi kind. Tin vẫn lan, vẫn có nguồn, vẫn nghe lỏm được — chỉ là **luôn đúng**. Lý do: Linh cần thoát khỏi cảm giác bị đổ oan, chứ không cần thoát khỏi một cái hẻm có người nói chuyện với nhau. Tắt cả hệ thì tắt luôn cách bịt §8b, và game mất một trụ.

### 2.4. `gossipTick(day)` — tick 1 lần/ngày, không realtime

Chạy trong `EveningScene`, sau khi người chơi đóng hàng và **trước** khi sổ tay cô Ba được sinh ra (P2-05 lấy chất liệu từ kết quả tick này).

```ts
const MAX_TRANSMISSIONS_PER_NIGHT = 3    // cả hẻm, không phải mỗi người
const MIN_CONFIDENCE = 0.35

function gossipTick(day: number, world: World) {
  if (!gossipEnabled(day, world.settings)) return

  const rng = seededRng(world.seed, day, 'gossip')       // CANON §8e: reload ra đúng kết quả
  let budget = MAX_TRANSMISSIONS_PER_NIGHT
  const tellers = rng.shuffle(activeNpcs(world, day))    // shuffle-bag, không random thuần

  for (const teller of tellers) {
    if (budget <= 0) break
    const belief = pickBelief(teller, rng)
    if (!belief) continue
    if (!rng.chance(tellWillingness(teller, belief))) continue
    if (belief.hops >= MAX_HOPS) continue
    if (belief.confidence < MIN_CONFIDENCE) continue

    const listener = pickListener(teller, belief, rng, world)
    if (!listener) continue

    let next = transmit(belief, teller, listener)
    next = maybeMutate(next, teller, listener, day, rng, world)
    receive(listener, next, day)

    declare(teller, belief)                              // §2.9 — nói mãi thành tin thật
    world.gossipLog.push({ day, from: teller.id, to: listener.id,
                           belief: next.claim, mutated: next.mutated, hops: next.hops })
    budget -= 1
  }
}
```

**Các hàm con:**

```ts
// Ai chịu kể — thanThien là trục chính. deTha KHÔNG dính dáng gì ở đây. Xem §2.10.
function tellWillingness(n: Npc, b: Belief): number {
  const base = 0.20 + 0.55 * n.personality.thanThien
  const amp  = AMPLIFIER[n.id] ?? 1.0          // bà Sáu 1.4 · bé Su 1.5 · chị Lan 0.35
  // SÀN THEO ĐỘ NẶNG: chuyện gì nặng thì người ít nói cũng kể
  const floor = GRAVITY_FLOOR[b.kind] ?? 0
  return clamp(Math.max(base * amp, floor), 0, 0.92)
}

const GRAVITY_FLOOR: Partial<Record<MemoryKind, number>> = {
  DROPPED_FOOD: 0.55,      // chốt từ P2-02 §4.6: chị Lan × DROPPED_FOOD = pGossip 0.55
  DIRTY_HANDS:  0.45,
  WRONG_NAME:   0.40,
  // tin tốt KHÔNG có sàn — ở phía tốt, hai nút khuếch đại được quyền quyết định
}

// Kể chuyện gì — cái đang mạnh nhất trong đầu, chưa kể cho người này
function pickBelief(n: Npc, rng: SeededRng): Belief | null {
  const pool = n.beliefs
    .filter(b => currentIntensity(b, today) * b.confidence >= 25)
    .filter(b => !b.toldTo.includes(candidateListenerId))
  if (pool.length === 0) return null
  return rng.weightedPick(pool, b =>
    currentIntensity(b, today) * b.confidence * valenceBias(b))   // §2.8
}

// Kể cho ai — theo đồ thị quan hệ NPC-NPC (§2.5)
function pickListener(teller: Npc, b: Belief, rng: SeededRng, w: World): Npc | null {
  const cands = TIES[teller.id]
    .filter(t => t.strength > 0)                       // không kể cho người mình ghét
    .filter(t => !b.toldTo.includes(t.to))
    .filter(t => coPresentToday(teller.id, t.to, w))   // hai người phải có dịp gặp nhau
  if (cands.length === 0) return null
  return rng.weightedPick(cands, t => t.strength).npc
}
```

**Nhớ nhầm — nơi duy nhất mutation được phép xảy ra:**

```ts
function maybeMutate(b: Belief, from: Npc, to: Npc,
                     day: number, rng: SeededRng, w: World): Belief {
  if (!w.settings.npcMisremember)            return b   // công tắc
  if (day < MUTATION_START_DAY)              return b
  if (b.mutated)                             return b   // mỗi tin méo TỐI ĐA 1 lần
  if (b.source.via === 'WITNESSED')          return b   // RB: chứng kiến thì không méo
  if (w.budget.mutationsLeft <= 0)           return b   // ngân sách mùa
  if (day - w.budget.lastMutationDay < w.budget.minGapDays) return b

  const edge = MUTATION_GRAPH[b.kind]
  if (!edge) return b                                   // tên người, món "như mọi bữa": null

  const bias = personalityBias(to, edge)                // §2.11 — ăn gian (h)
  if (!rng.chance(edge.rate * bias)) return b

  w.budget.mutationsLeft -= 1
  w.budget.lastMutationDay = day
  return { ...b, claim: edge.to, mutated: true,
           originalKind: b.kind, severity: edge.severity,
           confidence: b.confidence * 1.10 }            // nghịch lý: tin méo nghe CHẮC hơn
}
```

> Dòng cuối là chi tiết tàn nhẫn nhất và đúng nhất: **phiên bản méo của một câu chuyện bao giờ cũng gọn hơn, kịch tính hơn, và dễ tin hơn phiên bản thật.** `×1.10` (có trần 0.95) là cách mã hoá điều đó. Nó cũng là lý do một tin đồn sai lan xa hơn tin đúng dù rate thấp.

### 2.5. Đồ thị quan hệ NPC–NPC (12 người của CANON §9)

Đây là dữ liệu tay, nằm ở `content/npcs/ties.json`. Nó **không** thay đổi trong mùa (Đừng-1: không mô phỏng đời sống NPC), trừ 2 cạnh có kịch bản ở dưới.

```
                        ┌──────────────┐
                        │  CHÚ KIỆT    │  ← nút BÓP MÉO (đối thủ)
                        │ 0.7/0.6/0.3/0.4
                        └──┬───┬────┬──┘
                    0.60   │   │0.55│ 0.50
                ┌──────────┘   │    └──────────┐
                ▼              ▼               ▼
          ┌──────────┐   ┌──────────┐    ┌──────────┐
          │  CÔ MAI  │   │ ANH DŨNG │    │ ÔNG HẢI  │
          │0.6/.4/.6/.8   │.2/.5/.7/.5    │.5/.9/.5/.6
          └─┬──┬──┬──┘   └─┬──┬─────┘    └──┬────┬──┘
     0.80   │  │  │0.60    │  │0.40     0.60│    │ −0.20
       ┌────┘  │  └────┐   │  └────┐    ┌───┘    └────┐
       ▼       │0.50   ▼   │0.70   ▼    ▼             ▼
┌────────────┐ │  ┌─────────────┐ ┌──────────┐  ┌──────────┐
│  BÀ SÁU    │◄┘  │ THẦY PHÚC   │ │ CHÚ TƯ   │  │ CHỊ LAN  │
│.4/.3/.8/.9 │    │ .8/.2/.7/.5 │ │.3/.3/.9/.6  │.9/.1/.2/.3
│ KHUẾCH ĐẠI │    │   DẬP TẮT   │ └──────────┘  │ MẠNH NHẤT│
└─┬───┬───┬──┘    └──┬───┬──────┘                └──┬───┬──┘
  │   │   │0.70      │   │0.60                      │   │0.45
  │   │   └──────┐   │   └────────┐             0.40│   └───┐
  │   │0.85      ▼   │0.65        ▼                 │       │
  │   ▼    ┌──────────────┐  ┌──────────┐           │       │
  │ ┌──────────┐          │  │ CHỊ HẠNH │           │       │
  │ │  BÀ BẢY  │◄─── 0.60─┤  │.5/.3/.6/.4           │       │
  │ │.9/.6/.8/.7          │  └────┬─────┘           │       │
  │ └────┬─────┘          │  −0.25│                 │       │
  │      │ −0.30          ▼       └──(anh Dũng chọc giọng)  │
  │      └──────► ÔNG HẢI │                                 │
  │                 ┌──────────┐      ┌──────────┐          │
  └────── 0.70 ────►│  BÉ SU   │◄0.35─┤ (Lan ít đáp) ───────┘
                    │.4/.4/.9/1.0     └──────────┘
                    │ KHUẾCH ĐẠI│ ──0.60──► ANH BẢO (.3/.2/.8/.4)
                    └──────────┘
```

**Bảng cạnh đầy đủ** (`strength` ∈ [−1, 1]; âm = không kể cho nhau):

| A | B | strength | Vì sao |
|---|---|---|---|
| Bà Sáu | Bà Bảy | **0.85** | Hai bà đồng lứa, cùng buôn gánh bán bưng |
| Bà Sáu | Cô Mai | 0.80 | Ngày nào cũng ghé lấy đồ |
| Bà Sáu | Bé Su | 0.70 | Bé Su quay TikTok gánh tàu hũ |
| Bà Sáu | Chị Hạnh | 0.70 | Thương người mới vô Sài Gòn |
| Bà Sáu | Chú Tư | 0.60 | Gặp nhau mỗi sáng ở đầu hẻm |
| Bà Sáu | Chú Kiệt | 0.50 | Đồng nghiệp bán rong, có ý tứ |
| Bà Sáu | Chị Lan | 0.40 | Lan gật đầu chào, không nói |
| Bà Bảy | Bé Su | 0.70 | Bé hay mua vé số giùm bà |
| Bà Bảy | Cô Mai | 0.60 | |
| Bà Bảy | Thầy Phúc | 0.60 | Cùng lứa, cùng mê cải lương |
| Bà Bảy | Ông Hải | **−0.30** | Ổng nhậu ồn, bà rầy hoài |
| Cô Mai | Chú Kiệt | 0.60 | Hai người làm ăn, hiểu nhau |
| Cô Mai | Thầy Phúc | 0.60 | |
| Cô Mai | Chị Lan | 0.50 | Lan mua đồ mỗi tối |
| Thầy Phúc | Chị Hạnh | 0.65 | Thầy tử tế với người mới |
| Thầy Phúc | Bé Su | 0.65 | Thầy từng dạy trường bé |
| Thầy Phúc | Chị Lan | 0.45 | Hai người điềm đạm, ít nói, hiểu nhau |
| Chú Tư | Anh Dũng | 0.70 | Đàn ông, cùng ca sáng, chuyện xe cộ |
| Chú Tư | Ông Hải | 0.60 | Bạn nhậu |
| Chú Tư | Chú Kiệt | 0.40 | |
| Anh Dũng | Chú Kiệt | 0.55 | Kiệt bán rẻ cho Dũng |
| Anh Dũng | Anh Bảo | 0.40 | Chở đi học vài lần |
| Anh Dũng | Chị Hạnh | **−0.25** | Dũng chọc giọng Bắc của chị |
| Ông Hải | Chú Kiệt | 0.50 | Bạn nhậu |
| Ông Hải | Chị Lan | **−0.20** | Lan tránh mặt ổng |
| Bé Su | Anh Bảo | 0.60 | Cùng trẻ, cùng cắm mặt điện thoại |
| Bé Su | Chị Hạnh | 0.50 | |
| Bé Su | Chị Lan | 0.35 | Su chào, Lan gật |

**Bốn loại nút, và đây là chỗ đồ thị có ý nghĩa gameplay:**

| Nút | Loại | `AMPLIFIER` | Hành vi | Ý nghĩa với người chơi |
|---|---|---|---|---|
| **Bà Sáu** | **Khuếch đại** | **1.4** | Bậc 7 cạnh, `thanThien` 0.9, đi ngang hẻm nên gặp tất cả | Làm vừa lòng bà Sáu = **tin tốt tới tai cả hẻm trong 2 đêm**. Làm phật lòng bà cũng vậy |
| **Bé Su** | **Khuếch đại** | **1.5** | `thanThien` **1.0** — cao nhất dàn. Quay TikTok | Nút nhanh nhất. Nhưng `soi` 0.4 → bé **ít nhận thấy** lỗi. Bé lan cái bé **nghe**, không phải cái bé thấy |
| **Chị Lan** | **Mạnh nhất, ít nói** | **0.35** | `soi` 0.9 (thấy hết) + `thanThien` 0.3 (hiếm khi kể) | Cô ấy kể **1–2 lần cả mùa**. Nhưng `credibility` 1.0 và cô ấy nói với **thầy Phúc và cô Mai** — hai người bị tin |
| **Thầy Phúc** | **Dập tắt** | 0.6 | `nongTinh` 0.2 + `soi` 0.8 | Nhận tin đồn → `confidence × 0.6`, và **không kể tiếp cho tới khi tự chứng kiến**. Tuyến phòng thủ tự nhiên của người chơi |
| **Chú Kiệt** | **Bóp méo** | 1.1 | Đối thủ | Tin **xấu**: `confidence × 1.15` khi qua Kiệt. Tin **tốt**: `× 0.5` và Kiệt gần như không kể tiếp |

**Nghịch lý chị Lan — giải thích để không ai tune sai:** CANON §9 gọi chị Lan là *"nút lan tin đồn mạnh nhất"* trong khi `thanThien` của chị chỉ 0.3. Hai điều đó không mâu thuẫn:

```ts
influence(n) = tellWillingness(n) × credibility(n) × Σ strength(cạnh ra)
```

- Bé Su: `0.92 × 0.55 × 3.25` = **1.64** — nói nhiều, nhưng ai cũng biết bé nói cho vui.
- Chị Lan, chuyện thường: `0.13 × 1.00 × 1.70` = **0.22** mỗi đêm — gần như không bao giờ kể.
- Chị Lan, chuyện **nặng**: `GRAVITY_FLOOR` kéo `tellWillingness` lên **0.55** (`DROPPED_FOOD`). `0.55 × 1.00 × 1.70` = **0.94**. Cùng một người, gấp **hơn 4 lần**.

Và **khi** chị nói, tin đó đi thẳng vào hai người `soi` cao nhất hẻm (thầy Phúc 0.8, cô Mai 0.6) với `confidence` **không suy giảm** (`keep = 0.70 + 0.15×0.3 = 0.745`, nhưng `credibility` 1.0 bù lại ở tầng nhận), **không bao giờ bị mutate** (người ta không dám thêm bớt lời chị Lan), và nó **không bao giờ bị nghe lỏm** vì chị không nói ở góc hẻm.

> Đây là lý do `GRAVITY_FLOOR` phải tồn tại chứ không chỉ là một con số cân bằng: nó mã hoá một sự thật xã hội — **người ít nói mà chịu mở miệng thì chuyện đó là chuyện lớn.** Chị Lan kể **1–2 lần cả mùa**, và cả hai lần đều là chuyện vệ sinh. Người chơi nghe bà Sáu nói xấu thì nhún vai; nghe chị Lan nói thì lạnh sống lưng.

Nói cách khác: **chị Lan là kênh duy nhất người chơi không giám sát được.** Chị là người im lặng biến mất (CANON §9) — và một ngày nào đó người chơi phát hiện cả hẻm đã biết một chuyện mà họ không bao giờ nghe lỏm được ai nói. Đó là chỗ cơ chế XĐ3 có răng.

**Hai cạnh có kịch bản** (thay đổi theo arc, không theo sim):

| Cạnh | Sự kiện | Đổi thành |
|---|---|---|
| Anh Dũng ↔ Chị Hạnh (−0.25) | Nếu người chơi phục vụ chị Hạnh đúng cách gọi Bắc ≥5 lần → arc hoà nhập | **+0.30** từ ngày 24 |
| Bà Bảy ↔ (cô Ba) | Bất hoà 15 năm, **không ai chịu nhắc** | **Không có cạnh.** Và không có cơ chế hoà giải. CANON §9 ghi rõ đây là chuyện không được nhắc |

### 2.6. Người chơi giải thích thế nào — và khi nào giải thích không ăn thua

**Ràng buộc T2 chi phối tuyệt đối:** không có dialogue tree. Người chơi **không bao giờ chọn câu nói**. Vậy "giải thích" phải là một hành động vật lý ở quầy.

**Ba kênh giải thích, xếp theo sức mạnh:**

| # | Kênh | Cơ chế | Hiệu lực |
|---|---|---|---|
| 1 | **Làm ngược lại, trong tầm nhìn** | Bị đồn *"ăn bớt nguyên liệu"* → làm ổ đó ở `FRONT_CENTER`, không che tay, quết pate đầy đặn. Tầng perception chạy **ngược chiều**: `certainty` của một `DISPROOF` tích luỹ đúng như một `defect` | `belief.confidence × 0.55` ngay tại chỗ. **Kênh mạnh nhất** |
| 2 | **Cải chính qua nguồn** | Phục vụ **chính người đã kể** (`source.from`) thật tốt trong cùng ngày → đêm đó họ phát `CORRECTION` đi theo đúng các cạnh họ đã kể | Mọi người trong `toldTo` nhận `confidence × 0.7`. Chậm một đêm |
| 3 | **Thời gian + nhất quán** | Không làm gì sai thêm | `confidence` tự suy giảm 0.08/đêm khi không được nhắc lại |

```ts
function disprove(npc: Npc, claim: string, day: number) {
  const b = npc.beliefs.find(x => x.claim === claim)
  if (!b) return
  b.confidence *= 0.55
  b.disproofDays.push(day)
  if (b.confidence < MIN_CONFIDENCE) {
    b.dormant = true                       // không đổi thoại nữa
    // KHÔNG xoá. Nó ngủ. Nếu người chơi tái phạm, nó thức dậy ở confidence cũ × 1.3
  }
}
```

> Chi tiết `dormant` quan trọng: một tin đồn bị bác bỏ **không biến mất khỏi đầu người ta**. Nó nằm im. Nếu bạn làm rớt bánh lần nữa vào ngày 22, tin *"bán đồ rơi xuống đất"* **quay lại mạnh hơn lần đầu**. Đó là lý do người ta nói "tiếng dữ đồn xa".

**Và đôi khi giải thích cũng không ăn thua** — idea.md §9.6 yêu cầu nguyên văn. Bốn trường hợp, tất cả đều **có lý do đọc được**, không phải ngẫu nhiên:

| Trường hợp | Vì sao không gỡ được | Người chơi đọc ra điều gì |
|---|---|---|
| **`severity === 'INTENT'` với người `soi ≥ 0.7`** | Lỗi kỹ thuật bác được bằng chứng minh. **Cáo buộc về ý định thì không** — làm đầy đặn một lần chỉ chứng minh hôm nay bạn đầy đặn | *"Bà Bảy vẫn nhìn tay mình khác trước."* Kênh 1 chỉ cho `× 0.80` thay vì `× 0.55` |
| **`declarations ≥ 3`** (§2.9) | Người kể đã tự thuyết phục chính mình. Với họ đó không còn là tin nghe được, đó là **chuyện họ biết** | Họ nói bằng giọng chắc nịch, không có chữ *"nghe nói"* nữa |
| **Chị Lan** | Chị không bao giờ nói ra điều chị nghĩ → **không có `claim` nào để bác bỏ**. Người chơi thậm chí không biết cần bác bỏ cái gì | Chị ghé thưa dần. Rồi thôi. XĐ3 |
| **Chú Kiệt** | Đối thủ. `confidence × 1.15` với tin xấu và **miễn nhiễm kênh 2** (Kiệt không cải chính giùm ai) | Đây là NPC duy nhất người chơi không "chữa" được bằng phục vụ tốt |

Bốn trường hợp này phải **hiếm** (thực tế: 1–2 lần trong 40 ngày) và phải **có mặt một con đường khác**. Cụ thể: khi cả ba kênh đều thất bại với một người, **kênh thứ tư luôn mở** — làm tốt với **người khác**, để tin tốt lan qua bà Sáu/bé Su át đi (§2.8). Bạn không cãi lại được một lời đồn. Bạn chỉ có thể làm cho nó thành chuyện cũ.

### 2.7. Nghe lỏm — **điều kiện tồn tại** của cả cơ chế

CANON §12 ràng buộc 4, nguyên văn: *"Không có nghe lỏm thì **bỏ luôn cả nhớ nhầm lẫn đồn thổi**."* Không phải "nên có". Là **điều kiện**. Nếu tới P2 mà nghe lỏm chưa chạy, cắt luôn P2-04 khỏi build.

Lý do lạnh lùng: không có nghe lỏm thì tin đồn là một **hàm ẩn** đổi hành vi NPC theo cách người chơi không quan sát được — tức là đúng cái Steve Rabin cảnh báo, *"unpredictable and probably inexplicable to the player"*, và đúng cái Phản biện gọi là "không phân biệt được với code lỗi".

#### Sân khấu: góc hẻm

Một zone tĩnh, `GOSSIP_CORNER`, nằm **chéo bên trái xe bánh mì, cách ~4–5 mét**, có hai cái ghế nhựa và một chậu trầu bà (CANON §14 chi tiết môi trường). Hai NPC đứng/ngồi đó nói chuyện. **Không có pathing** — họ `fade-in` vào vị trí lúc sự kiện bắt đầu và `fade-out` khi xong (Đừng-1).

```ts
type EavesdropScene = {
  day: number
  startMin: number            // luôn rơi vào LÕM giữa hai đợt khách, không phải cao điểm
  durationSec: number         // 18–25s
  speakerA: NpcId
  speakerB: NpcId
  belief: Belief              // đúng cái belief vừa được truyền trong gossipTick đêm trước
  lines: [BarkId, BarkId, BarkId]   // A kể → B phản ứng → A chốt
}
```

**Thời điểm:** cảnh nghe lỏm của đêm `d` diễn ra vào **sáng ngày `d+1`**, trong một "lõm" của luồng khách (không bao giờ trong cao điểm 6h30–8h của CANON §13.3). Tối đa **1 cảnh/ngày**. Không phải ngày nào cũng có.

#### Người chơi nghe được gì, ở khoảng cách nào

Ba tầng đọc được, ánh xạ thẳng từ hành động của người chơi. **Đây là bảng quan trọng nhất của mục này:**

| Người chơi đang làm gì | Nghe được | Bubble hiển thị | Chi phí |
|---|---|---|---|
| **Vẫn làm bánh** (tay đang bận) | Chỉ biết *có người đang nói chuyện* | Bubble mờ, **chỉ có dấu hiệu hình**: hình ổ bánh + dấu `?`. Không chữ | **0** |
| **Dừng tay, đứng yên** (thả nguyên liệu) | Nghe được **claim**, không nghe được **nguồn** | Bubble rõ, có chữ, nhưng chỗ tên nguồn là **`…`**: *"Nghe … nói con nhỏ đó bán đồ rơi dưới đất."* | Bánh trong lò tiếp tục chạy; khách đang chờ tiếp tục tụt kiên nhẫn |
| **Nghiêng người về phía góc hẻm** (giữ phím/chạm & giữ) | Nghe **đủ cả claim và nguồn** | Bubble rõ hoàn toàn: *"Bà Bảy nói con nhỏ đó bán đồ rơi dưới đất."* | **Cô Ba nhìn thấy** (nếu cô có mặt) + khách ở `FRONT_CENTER` thấy bạn lơ đễnh → `gazeFactor` của họ tăng 1.3× trong 5s |

```ts
function eavesdropTier(player: PlayerState): 0 | 1 | 2 {
  if (player.handsBusy)                         return 0
  if (!player.leaning)                          return 1
  return 2
}
```

**Chi phí cơ hội là bắt buộc, và nó phải đau vừa đủ:**

1. **Nghe lỏm thì không làm bánh được.** `handsBusy = true` khi đang ráp ổ, quết pate, nướng. Buông ra để nghe = ổ đó chờ, hàng dài thêm, bánh trong lò già đi. **Đây là ràng buộc trực tiếp nối vào thông lượng giờ cao điểm (CANON §13.3)** — và nó là lý do cảnh nghe lỏm được đặt vào lõm chứ không vào cao điểm: nếu đặt vào cao điểm thì chi phí quá cao, không ai nghe, cơ chế chết.
2. **Không có nút "phát lại".** Nghe hụt là hụt. Nhưng **không mất trắng**: tier 1 vẫn ghi được `claim` vào nhật ký thô của P2-05 dưới dạng *"nghe loáng thoáng ở góc hẻm: chuyện bánh rớt"*. Người chơi mất **nguồn**, không mất **nội dung**. Mất nguồn là mất khả năng dùng kênh giải thích #2 (§2.6).
3. **Không được phép farm.** Tối đa 1 cảnh/ngày, và cảnh chỉ chứa belief **đã lan trong đêm** — không sinh thêm thông tin nào mà hệ thống chưa có.

#### Bubble — thiết kế hiển thị

```
        ╭─────────────────────────────────╮
        │  Bà Bảy nói con nhỏ đó bán      │   ← nền ĐỤC (CANON §15.1)
        │  đồ rơi dưới đất...             │      cỡ chữ theo 4 mức người chơi chọn
        ╰──────────────╮ ╭────────────────╯      KHÔNG tự chạy tiếp
                       ╰╯
                    [cô Mai]  [bà Sáu]
                       ░░ 4.5m ░░
    ═══════════════════════════════════════
              [xe bánh mì] ◄── bạn ở đây
```

- **Đuôi bubble chỉ đúng người đang nói.** Người chơi phải thấy **ai** nói, không chỉ thấy **có người** nói.
- **Tên nguồn luôn được tô đậm hơn phần còn lại.** Đó là mấu xích, và người chơi cần nhặt được nó trong 2 giây.
- **Ba dòng, mỗi dòng một bubble, tuần tự.** A kể → B phản ứng → A chốt. Dòng B là dòng làm rõ **B tin hay không tin** — tức là làm rõ tin này sẽ đi tiếp hay chết ở đây.
- Chế độ **giảm chuyển động** (CANON §15.3): bubble không trượt vào, chỉ hiện. Thời gian đọc **tăng 1.5×**.
- Chế độ **không giới hạn thời gian** (CANON §15.2): cảnh nghe lỏm **không tự hết** — nó chờ. Vì nếu không, người chơi chậm sẽ không bao giờ nghe được gì, và cả hệ thống biến mất với đúng nhóm người cần nó nhất.

#### Thoại mẫu — một cảnh hoàn chỉnh (ngày 9, sau `DROPPED_FOOD` ngày 7)

```
[bà Sáu → cô Mai] tier 2
  Bà Sáu:  "Bà Bảy nói bữa trước con nhỏ bán bánh mì làm rớt ổ bánh xuống đất đó chị."
  Cô Mai:  "Rớt thì bỏ chớ. Bộ nó lượm lên bán hả?"
  Bà Sáu:  "Ai biết. Bà Bảy kể vậy thôi chớ bả cũng đứng xa."
```

Ba dòng, và người chơi nhận được **bốn** mẩu thông tin: nguồn (bà Bảy), nội dung, mức độ chắc chắn (*"bả cũng đứng xa"*), và **nguy cơ biến dạng** (cô Mai tự thêm giả thuyết *"lượm lên bán"* — chính là cạnh `DROPPED_FOOD → ban_do_roi_dat`, nghe được **đúng lúc nó đang hình thành**).

Đó là toàn bộ lý do nghe lỏm tồn tại: **nó cho người chơi xem cái máy đang chạy.**

Một cảnh nữa, tin tốt (ngày 15):

```
[bé Su → anh Bảo] tier 2
  Bé Su:   "Bà Sáu nói bánh mì cô Ba ngon nhất khu này luôn đó anh."
  Anh Bảo: "Ờ..."                                    # vẫn không rời điện thoại
  Bé Su:   "Anh ăn thử đi! Em quay cho anh một cái!"
```

Và một cảnh cho người chơi biết mình đang bị nghi mà **không biết nguồn** (tier 1 — người chơi dừng tay nhưng không nghiêng người):

```
  Cô Mai:  "Nghe … nói dạo này bên đó pate mỏng lắm."
  Thầy Phúc: "Để thầy coi đã. Thầy chưa thấy tận mắt."
```

### 2.8. Tin tốt lan mạnh hơn tin xấu

CANON §12 ràng buộc 5. *Ngược đời thật, nhưng đúng với cozy.*

```ts
function valenceBias(b: Belief): number {
  return b.valence > 0 ? GOOD_NEWS_MUL : BAD_NEWS_MUL    // 1.45 / 0.85
}
```

| Hệ số | Giá trị | Chỗ áp dụng |
|---|---|---|
| `GOOD_NEWS_MUL` | **1.45** | Trọng số trong `pickBelief` |
| `BAD_NEWS_MUL` | **0.85** | Như trên |
| `keep` (tin tốt) | `0.75 + 0.15·thanThien` | Suy giảm `confidence` chậm hơn |
| `keep` (tin xấu) | `0.70 + 0.15·thanThien` | |
| Ngưỡng `MIN_CONFIDENCE` (tin tốt) | 0.30 | Sống lâu hơn |
| Ngưỡng `MIN_CONFIDENCE` (tin xấu) | 0.35 | |
| Mutation rate | **Không đổi theo valence** | Tin tốt cũng méo, nhưng méo về phía **có lợi** |

**Tỉ lệ thực tế đo được** (mô phỏng 200 mùa, người chơi trung bình — 60% ngày sạch):

| | Tin tốt | Tin xấu |
|---|---|---|
| Số lần được kể / mùa | **~26** | ~11 |
| Số người biết trung bình mỗi tin | 2.6 | 1.8 |
| Tin còn sống tới ngày 40 | 4–6 | 1–2 |

**Vì sao đây là quyết định đúng chứ không phải chiều chuộng người chơi:**

1. **Nó chặn vòng xoáy tiêu cực ở tầng xã hội**, y như `offenseMul = 1.0` chặn nó ở tầng cá nhân (P2-03 §2.5). Nếu tin xấu lan mạnh hơn, một ngày tệ sẽ tự nhân lên thành một tuần tệ, và cozy chết.
2. **Nó đúng với quán ăn thật.** Quán ngon được truyền miệng. Quán dở thì người ta chỉ... không tới nữa — im lặng, đúng như chị Lan. Cơ chế "biến mất im lặng" của XĐ3 **chính là** cách tin xấu thật sự hoạt động trong game này. Tin xấu không cần lan mạnh, vì nó đã có một kênh riêng còn đau hơn.
3. **Nó làm cho nỗ lực có đòn bẩy.** Một buổi sáng nhớ đúng "nhiều pate không ớt" của bà Bảy có thể đổi cách ba người khác chào bạn trong tuần đó. Đó là phần thưởng lớn nhất game có thể trao mà không cần một con số nào — đúng T3.

### 2.9. `declaration` — nói mãi thành tin thật

Cơ chế của Talk of the Town mà CANON §12 gọi là "đáng chép". Mỗi lần **kể lại**, `intensity` của **chính người kể** tăng.

```ts
const DECLARATION_GAIN = 0.12
const DECLARATION_CAP  = 1.60

function declare(teller: Npc, b: Belief) {
  b.declarations += 1
  b.intensityMul = Math.min(DECLARATION_CAP, 1 + DECLARATION_GAIN * b.declarations)
  b.confidence   = Math.min(0.95, b.confidence * (1 + 0.5 * DECLARATION_GAIN))

  if (b.declarations >= 3) {
    b.hardened = true          // §2.6: không còn bác bỏ được bằng kênh 1 hay 2
    b.linePool = 'conviction'  // bỏ chữ "nghe nói", nói như chuyện mình biết
  }
}
```

**Ba pool thoại theo số lần đã kể** — đây là cách người chơi **nhìn thấy** cơ chế này mà không cần giải thích:

| `declarations` | Pool | Câu mẫu (bà Bảy, cùng một belief) |
|---|---|---|
| 0–1 | `hearsay` | *"Nghe bà Sáu nói con làm rớt bánh hả con?"* |
| 2 | `belief` | *"Cô nghe nói con làm rớt bánh đó. Lần sau cẩn thận nghen."* |
| **≥3** | **`conviction`** | *"Con làm rớt bánh mà. Cô biết mà. Thôi cô không nói nữa."* |

Từ `"nghe nói"` → `"cô nghe nói"` → `"cô biết"`. **Ba câu, và cả một lý thuyết về ký ức người.** Đây là mười lăm dòng thoại rẻ nhất và đắt giá nhất trong cả game.

**Chống lạm dụng:**
- `DECLARATION_CAP = 1.60` — không có chuyện một tin nhỏ leo lên thành thảm hoạ.
- `declare` chỉ chạy khi tin **thật sự được truyền** (có listener), không chạy khi NPC chỉ "nghĩ về nó".
- Tin đã `hardened` **vẫn decay bình thường** theo P2-03 §2.4. Nó cứng, không phải vĩnh cửu. Sau ~2 tuần không được nhắc, nó xuống dưới `MIN_CONFIDENCE` và ngủ.

### 2.10. Chống ăn gian (b) — **phân tầng khách**

**Ăn gian:** dồn nguyên liệu xịn cho 3 người `soi` cao (bà Bảy, chị Lan, thầy Phúc), ăn gian với 9 người còn lại. Về lý thuyết đây là chiến lược tối ưu rõ ràng, và Minh sẽ tìm ra nó trong ngày chơi thứ hai.

**Cách bịt — và đây là fix đẹp nhất dự án, vì nó không thêm một hệ thống nào:**

> Người **"dễ tha"** không giận — nhưng họ **vẫn vô tư kể lại** cho người **"soi"**.

Cả cơ chế nằm trong một sự thật về schema tính cách (CANON §4): **`deTha` và `thanThien` là hai chiều độc lập.**

```ts
// P2-03: deTha điều khiển TỐC ĐỘ QUÊN
temperFactor = 0.5 + 1.0 * p.deTha

// P2-04: thanThien điều khiển XÁC SUẤT KỂ
tellWillingness = max( (0.20 + 0.55 * p.thanThien) * amplifier , GRAVITY_FLOOR[kind] )
```

**Không có một dòng nào nối `deTha` vào `tellWillingness`** — kể cả trong `GRAVITY_FLOOR`, vốn chỉ phụ thuộc `kind` của sự kiện. Đó là toàn bộ cái bẫy, và nó được cài bằng cách **không viết** một dòng code.

**Bảng bốn góc — người chơi phải tự vẽ ra bảng này trong đầu, đó là bài học của cả cơ chế:**

| | **Ít kể** (`thanThien` ≤ 0.5) | **Hay kể** (`thanThien` > 0.5) |
|---|---|---|
| **Để bụng** (`deTha` ≤ 0.5) | ⚠️ **Chị Lan** (0.2/0.3) · **Chú Kiệt** (0.3/0.4)<br>Nhớ dai, không nói → **biến mất im lặng** | 💥 **Ông Hải** (0.5/0.6)<br>Nhớ dai **và** nói. Tệ nhất — nhưng chỉ có 1 người |
| **Dễ tha** (`deTha` > 0.5) | ✅ **Anh Bảo** (0.8/0.4) · **Chị Hạnh** (0.6/0.4) · **Thầy Phúc** (0.7/0.5)<br>Thật sự tương đối an toàn | 🪤 **BẪY: Chú Tư** (0.9/0.6) · **Bà Bảy** (0.8/0.7) · **Cô Mai** (0.6/0.8) · **Bà Sáu** (0.8/0.9) · **Bé Su** (0.9/1.0) · **Anh Dũng** (0.7/0.5)<br>**Không giận — nhưng kể hết** |

**Sáu trong mười hai NPC nằm ở ô bẫy.** Và ô bẫy chứa **cả hai nút khuếch đại** (bà Sáu 1.4, bé Su 1.5).

**Diễn tiến một lần ăn gian với chú Tư** (`soi` 0.3, `deTha` 0.9 — người "an toàn nhất" theo trực giác sai):

| Đêm | Chuyện xảy ra |
|---|---|
| D0 | Ăn bớt pate với chú Tư. `soi` 0.3 → chú **gần như không nhận thấy**. Nếu có, `deTha` 0.9 → memory phai trong 3 ngày. **Đúng là chú không giận** |
| D0 | Nhưng nếu `certainty` chạm `CONFIRMED` dù chỉ một lần → memory được ghi. `thanThien` 0.6 → `tellWillingness` **0.53** |
| D1 | `gossipTick`: chú Tư kể cho **anh Dũng** (0.70) hoặc **bà Sáu** (0.60). Giọng chú **hoàn toàn không trách móc** — đó là chỗ tàn nhẫn |
| D2 | Bà Sáu (`AMPLIFIER` 1.4, bậc 7) kể tiếp cho **bà Bảy** (0.85) — `soi` **0.9** |
| D3 | Bà Bảy ghé. Bà **soi kỹ hơn thường lệ**: `traitMul` tăng vì đã có `belief` về `ORDER_DEFECT`. Bạn không ăn gian với bà hôm đó, nhưng bà **nhìn tay bạn khác trước** |
| D3+ | Nếu tin đã mutate thành `an_bot_nguyen_lieu` (`severity: 'INTENT'`) → bà Bảy `soi` 0.9 ≥ 0.7 → **kênh giải thích #1 chỉ còn ×0.80** (§2.6) |

**Kết luận đúng như idea.md §21b:** *"Ăn gian với người dễ tính không miễn phí — chỉ trả chậm hơn."* Ba đêm chậm hơn. Và vì nó chậm, người chơi **có cơ hội nối được nhân quả** — mà đó mới là mục đích thật: không phải chặn ăn gian, mà **dạy rằng cái hẻm là một mạng lưới**.

**Câu thoại chốt hạ, đúng giọng chú Tư — dòng quan trọng nhất của cả cơ chế:**

> **Chú Tư:** *"Ủa bữa nay pate nhiều à. Bữa trước chú tưởng con hết pate chớ. Mà chú ăn gì cũng được, con đừng lo."*

Chú **không trách**. Chú **không giận**. Chú chỉ **vừa nói ra trước mặt hai người khác đang xếp hàng**. Và đó là toàn bộ cái giá.

**Chống ăn gian phái sinh — "vậy tôi né luôn mấy người hay kể":** tránh phục vụ bà Sáu/bé Su thì mất luôn kênh lan tin tốt (§2.8, `GOOD_NEWS_MUL` 1.45), và `missStreak` của họ chạy → `points` tụt → CANON §8k (từ chối phục vụ tốn kém nặng về mặt xã hội). **Hai nút khuếch đại vừa là rủi ro lớn nhất vừa là tài sản lớn nhất.** Đó là thiết kế, không phải tai nạn.

### 2.11. Chống ăn gian (h) — bias nhớ nhầm **theo tính cách**

**Ăn gian:** khai thác nhớ nhầm **chiều ngược** — để được ghi công oan. Nếu mutation đối xứng, người chơi chỉ cần chơi đủ lâu là sẽ gom được một mớ lời khen không có thật.

**Bịt:** hướng méo **lệch theo tính cách người NHẬN tin** (CANON §8h).

```ts
function personalityBias(receiver: Npc, edge: MutationEdge): number {
  const p = receiver.personality
  const towardBad  = edge.severity === 'EXAGGERATE' || edge.severity === 'INTENT'

  // soi cao → lệch về phía xấu · thanThien cao → lệch về phía tốt
  const soiPull  = 0.6 + 1.0 * p.soi           // 0.6 .. 1.6
  const thanPull = 0.6 + 1.0 * p.thanThien     // 0.6 .. 1.6

  return towardBad ? soiPull / thanPull : thanPull / soiPull
}
```

| NPC | `soi` | `thanThien` | Hệ số với tin **xấu** | Hệ số với tin **tốt** | Đọc ra |
|---|---|---|---|---|---|
| **Chị Lan** | 0.9 | 0.3 | **1.67** | 0.60 | Nghĩ xấu trước. Và không nói ra |
| **Chú Kiệt** | 0.7 | 0.4 | **1.30** | 0.77 | Đối thủ, đúng như kỳ vọng |
| **Thầy Phúc** | 0.8 | 0.5 | 1.27 | 0.78 | Nhưng có `AMPLIFIER` 0.6 dập lại → tổng thể trung tính |
| **Bà Bảy** | 0.9 | 0.7 | 1.15 | 0.87 | Soi nhất hẻm **nhưng** dễ tha → hơi lệch xấu thôi |
| **Cô Mai** | 0.6 | 0.8 | 0.86 | 1.17 | Lệch tốt |
| **Bà Sáu** | 0.4 | 0.9 | **0.67** | **1.50** | Nút khuếch đại lệch mạnh về phía tốt |
| **Bé Su** | 0.4 | 1.0 | **0.63** | **1.60** | Lệch tốt nhất dàn |

**Ba hệ quả thiết kế:**

1. **Hai nút khuếch đại đều lệch TỐT** (bà Sáu 1.50, bé Su 1.60). Nghĩa là **kênh lan nhanh nhất của hẻm là kênh lan tin tốt**. Điều này khoá chặt RB5 ở tầng cấu trúc, không chỉ ở tầng hệ số — nó đúng ngay cả khi ai đó tune lại `GOOD_NEWS_MUL`.
2. **Ghi công oan là có thể, nhưng đắt và ngược đời.** Muốn được khen oan thì phải để bà Sáu hoặc bé Su nghe một tin **hơi tốt** rồi méo lên. Nhưng tin hơi tốt chỉ sinh ra khi bạn **thật sự làm gì đó tốt**. Tức là chiến lược "farm khen oan" hoá ra chính là chiến lược "làm tốt rồi nói chuyện với người vui tính" — và đó không phải ăn gian, đó là **quan hệ khách hàng**.
3. **Ngân sách 4 mutation/mùa chặn mọi thứ còn lại.** Không có cách nào chạy cơ chế này đủ nhiều lần để nó thành một nguồn thu.

### 2.12. Đừng-3 — danh sách trắng và danh sách đen

CANON §16 Đừng-3 / §12 "Tuyệt đối". Sergio Ocio Barriales: *"có thể có nhiều biến thể của cùng một phản ứng, nhưng **loại** phản ứng — category và intensity — thì không được đổi."*

#### ✅ DANH SÁCH TRẮNG — tin đồn được phép đổi

| # | Thứ được đổi | Cụ thể trong code | Ví dụ |
|---|---|---|---|
| 1 | **Thoại** | `Rule.responses[].pool` | `hearsay` → `belief` → `conviction` |
| 2 | **Dáng đi / tư thế** | `spring node` lean/tilt (CANON §16 Đừng-4) | Bà Bảy tới gần hơn nửa bước · chị Lan đứng chếch |
| 3 | **Món gọi** | `orderPreset` trong `ScheduleRule` | Đang nghi *"pate mỏng"* → gọi `banh_mi_khong` (không pate) để **thử** |
| 4 | **Tip** | `tipMul` ∈ [0.8, 1.2] | Nghe tin tốt → *"khỏi thối"* |
| 5 | **Thứ tự đến** | `arriveMin` ± tối đa **20 phút** | Nghe tin xấu → ghé muộn hơn, lúc vắng người |
| 6 | **`gazeFactor` nền** | ± tối đa **0.15** | Nghe *"ăn bớt nguyên liệu"* → **nhìn tay kỹ hơn** |
| 7 | **`probability` ghé** | × tối đa **0.85** hoặc **1.15** | Ghé thưa dần — kênh của XĐ3 |
| 8 | **Chọn `zone` đứng** | `FRONT_CENTER` ↔ `FRONT_SIDE` | Xa dần mà không nói gì |

#### ❌ DANH SÁCH ĐEN — tuyệt đối không, kể cả "chỉ một chút"

| # | Không được đổi | Vì sao |
|---|---|---|
| 1 | **Công thức có ra đúng món không** | Bạn bỏ pate thì ổ đó **có pate**. Tin đồn không đổi được vật lý. Vi phạm = game nói dối về chính đầu vào của người chơi |
| 2 | **Tiền có vào túi không** | Không có "khách trả thiếu vì nghe đồn". Giá là giá |
| 3 | **Cốt truyện có unlock được không** | Không có cảnh/arc nào bị khoá bởi tin đồn. Nếu có, cả mùa của một người chơi bị quyết định bởi 4 lần roll |
| 4 | **`category` và `intensity` của sự kiện** | `DROPPED_FOOD` (75) luôn là `DROPPED_FOOD` (75) với **người chứng kiến**. Biến dạng chỉ sống trong đầu người **nghe kể** |
| 5 | **NPC có ghé hay không (nhị phân)** | Chỉ được đổi `probability` trong biên ±15%. **Không có chuyện tin đồn làm một NPC biến mất hẳn.** Biến mất là việc của arc (XĐ3), có báo trước 3–4 ngày |
| 6 | **`trustCeiling`** (P2-03 §2.8) | Trần chỉ hạ bởi hành vi **thật** của người chơi. Không ai mất trần vì một lời đồn |
| 7 | **Kết quả kiểm tra vệ sinh** | Bánh rớt là bánh rớt, phải bỏ (CANON §7). Tin đồn không tha và cũng không kết tội thêm |
| 8 | **CORE memory** | 1 slot định hình NPC. Chỉ ghi từ `WITNESSED` |

**Test tự động bắt buộc** — chạy 500 mùa với hai seed giống hệt, một bật gossip một tắt:

```ts
assert(deepEqual(runA.recipeOutcomes,   runB.recipeOutcomes))    // đen #1
assert(deepEqual(runA.cashLedger,       runB.cashLedger))        // đen #2
assert(deepEqual(runA.unlockedScenes,   runB.unlockedScenes))    // đen #3
assert(deepEqual(runA.witnessedEvents,  runB.witnessedEvents))   // đen #4
assert(maxDiff(runA.visitCounts, runB.visitCounts) <= 0.15)      // đen #5
assert(deepEqual(runA.trustCeilings,    runB.trustCeilings))     // đen #6
assert(notDeepEqual(runA.dialogueLines, runB.dialogueLines))     // trắng #1 — PHẢI khác
```

Dòng cuối cùng quan trọng ngang bảy dòng trên: nếu bật/tắt gossip mà **thoại không đổi gì**, cơ chế này đang tốn tiền mà không giao hàng.

### 2.13. Người chơi NHÌN THẤY gossip chain hoạt động thế nào

**Đây là tiêu chí đạt của Phase 1** (CANON §17): *"gossip chain HIỂN THỊ ĐƯỢC"* + *"≥7/10 người lạ trả lời đúng vì sao khách đó giận"*. Nếu mục này fail, P2-04 không đáng tồn tại.

**Chuỗi mẫu bắt buộc — có kịch bản, seed cố định, xảy ra với MỌI người chơi làm rớt bánh lần đầu:**

```
NGÀY 7 — bạn làm rớt ổ bánh. Bà Bảy đứng FRONT_CENTER, nhìn thẳng.
         certainty chạm CONFIRMED sau ~1,4 giây (CANON §5).
    │
    │  BẠN THẤY: bà Bảy nhíu mày. Bark tier-1: "Ủa... rớt rồi kìa con."
    │            Bạn bỏ ổ đó (bắt buộc — CANON §7.2). Làm lại.
    ▼
ĐÊM 7 — gossipTick: bà Bảy → bà Sáu (cạnh 0.85). confidence 1.0 → 0.80
    │
    │  BẠN KHÔNG THẤY GÌ CẢ. Đêm là đêm.
    ▼
NGÀY 8 SÁNG — cảnh nghe lỏm ở góc hẻm, trong lõm khách lúc ~7h40
    │
    │  BẠN THẤY (nếu dừng tay & nghiêng người):
    │     Bà Sáu: "Bà Bảy nói bữa trước con nhỏ bán bánh mì làm rớt ổ bánh xuống đất."
    │     Cô Mai: "Rớt thì bỏ chớ. Bộ nó lượm lên bán hả?"
    │     Bà Sáu: "Ai biết. Bà Bảy kể vậy thôi chớ bả cũng đứng xa."
    │
    │  ← ĐÂY LÀ MẮT XÍCH. Người chơi vừa nghe tên nguồn và vừa thấy tin đang méo.
    ▼
ĐÊM 8 — gossipTick: bà Sáu → cô Mai. mutate (rate 0.30, bias cô Mai 0.86 → 0.26)
    │   NẾU mutate: claim đổi thành "bán đồ rơi xuống đất". mutated = true.
    ▼
NGÀY 9 — cô Mai ghé. Pool `hearsay`, bắt buộc có {source}:
    │
    │  Cô Mai: "Bà Sáu nói con bán đồ rơi dưới đất hả con? Cô hỏi thiệt đó."
    │
    │  ← NGƯỜI CHƠI PHẢI NỐI ĐƯỢC: bà Bảy thấy (ngày 7) → bà Sáu biết (nghe lỏm ngày 8)
    │                                → cô Mai nhắc lại SAI (ngày 9)
    ▼
NGÀY 9 — người chơi có ba lựa chọn, tất cả đều là HÀNH ĐỘNG, không phải lời nói (T2):
        · làm ổ của cô Mai ở FRONT_CENTER, không che tay  → confidence × 0.55
        · phục vụ bà Sáu thật tốt hôm nay                  → đêm đó bà Sáu cải chính
        · không làm gì                                      → confidence tự tụt 0.08/đêm
```

**Bảy quyết định thiết kế để 7/10 người lạ hiểu được chuỗi này:**

| # | Quyết định | Vì sao cần cho người lạ |
|---|---|---|
| 1 | **Chuỗi đầu tiên có kịch bản**, không phó mặc xác suất | Không được để người chơi thứ 10 gặp chuỗi đầu tiên vào ngày 31 |
| 2 | **Mọi dòng `hearsay` bắt buộc có tên nguồn** | Sợi chỉ để lần. Không có nó thì chuỗi là nhiễu |
| 3 | **Tên nguồn tô đậm** trong bubble và trong thoại | Mắt bắt được trong 2 giây |
| 4 | **Đúng 2 ngày** từ sự kiện tới lời nhắc lại | 1 ngày = không kịp quên, không thấy "lan". 3+ ngày = mất liên kết nhân quả |
| 5 | **Cảnh nghe lỏm dùng đúng belief của đêm trước** | Nghe lỏm phải là **cửa sổ nhìn vào cái máy**, không phải một cảnh trang trí riêng |
| 6 | **Nhật ký thô của P2-05 ghi cả ba mốc** | *"ngày 7: làm rớt bánh (bà Bảy thấy)"* · *"ngày 8: nghe lỏm — bà Sáu nhắc chuyện bánh rớt"* · *"ngày 9: cô Mai hỏi chuyện bánh rớt"*. Người chơi ngắt quãng (Ngọc Ánh) vẫn nối được vào hôm sau |
| 7 | **Sổ tay cô Ba chạm nhẹ, không giải thích** | *"Bữa nay cô Mai hỏi chuyện gì đó. Chắc có người nói ra nói vô."* Gợi, không giảng |

**Phép đo:** cho 10 người lạ chơi tới ngày 10, hỏi đúng một câu — *"Vì sao cô Mai hỏi bạn chuyện đó?"*

| Câu trả lời | Tính là |
|---|---|
| *"Vì tôi làm rớt bánh ngày 7, bà Bảy thấy, rồi kể cho bà Sáu, bà Sáu kể cho cô Mai"* | ✅ Đạt đầy đủ |
| *"Vì tôi làm rớt bánh và có người kể lại"* | ✅ Đạt |
| *"Vì bà Sáu nói gì đó về tôi"* | ⚠️ Nửa — nối được 1 hop, không nối được về gốc |
| *"Không biết"* / *"Game random"* | ❌ Fail |

Mục tiêu **≥7/10 ở hai hàng đầu**. Nếu tỉ lệ ở hàng ⚠️ cao → tăng độ rõ của mắt xích nghe lỏm (quyết định #3, #5), **không** tăng tần suất gossip. Nếu tỉ lệ ❌ cao → chuỗi kịch bản chưa chạy hoặc người chơi đã bỏ lỡ cảnh nghe lỏm → xem lại chi phí cơ hội ở §2.7.

---

## 3. Dữ liệu & schema

```ts
type BeliefClaim = string     // id trỏ vào content/lines/claims.json

type Belief = {
  id: string
  kind: MemoryKind            // kind GỐC, không đổi kể cả khi mutate
  claim: BeliefClaim          // nội dung hiện tại — đổi khi mutate
  valence: -1 | 1
  intensity: number
  intensityMul: number        // từ declaration, ≤ 1.60
  confidence: number          // 0..1
  hops: number                // 0 = chứng kiến
  chain: NpcId[]              // đường đi đầy đủ. KHÔNG BAO GIỜ rỗng khi hops ≥ 1
  source: MemorySource        // P2-03
  mutated: boolean
  originalKind?: MemoryKind
  severity?: 'EXAGGERATE' | 'INTENT' | 'PRAISE'
  declarations: number
  hardened: boolean
  linePool: 'hearsay' | 'belief' | 'conviction'
  toldTo: NpcId[]
  disproofDays: number[]
  dormant: boolean
  dayHeard: number
}

type Tie = { to: NpcId; strength: number }   // −1..1

type GossipLogEntry = {
  day: number; from: NpcId; to: NpcId
  belief: BeliefClaim; mutated: boolean; hops: number
}
```

**`content/npcs/ties.json`** (trích):

```json
{
  "ba_sau": [
    { "to": "ba_bay",   "strength": 0.85 },
    { "to": "co_mai",   "strength": 0.80 },
    { "to": "be_su",    "strength": 0.70 },
    { "to": "chi_hanh", "strength": 0.70 },
    { "to": "chu_tu",   "strength": 0.60 },
    { "to": "chu_kiet", "strength": 0.50 },
    { "to": "chi_lan",  "strength": 0.40 }
  ],
  "chi_lan": [
    { "to": "co_mai",    "strength": 0.50 },
    { "to": "thay_phuc", "strength": 0.45 },
    { "to": "ba_sau",    "strength": 0.40 },
    { "to": "be_su",     "strength": 0.35 },
    { "to": "ong_hai",   "strength": -0.20 }
  ],
  "_nodes": {
    "ba_sau":    { "amplifier": 1.40, "credibility": 0.85, "role": "AMPLIFIER" },
    "be_su":     { "amplifier": 1.50, "credibility": 0.55, "role": "AMPLIFIER" },
    "chi_lan":   { "amplifier": 0.35, "credibility": 1.00, "role": "SILENT_STRONG" },
    "thay_phuc": { "amplifier": 0.60, "credibility": 0.95, "role": "DAMPER",
                   "confidenceMulOnReceive": 0.60, "requiresWitnessToRelay": true },
    "chu_kiet":  { "amplifier": 1.10, "credibility": 0.50, "role": "DISTORTER",
                   "badNewsMul": 1.15, "goodNewsMul": 0.50 }
  }
}
```

**`content/lines/claims.json`** (trích — mỗi claim có 3 pool × 2–3 biến thể, shuffle-bag theo CANON §11):

```json
{
  "ban_do_roi_dat": {
    "valence": -1,
    "hearsay": [
      "{source} nói con bán đồ rơi dưới đất hả con? Cô hỏi thiệt đó.",
      "Nghe {source} kể chuyện ổ bánh rớt. Có thiệt hông con?"
    ],
    "belief": [
      "Cô nghe nói con làm rớt bánh rồi vẫn bán đó. Lần sau cẩn thận nghen.",
      "Chuyện ổ bánh rớt đó. Cô nghe hoài rồi."
    ],
    "conviction": [
      "Con làm rớt bánh mà. Cô biết mà. Thôi cô không nói nữa.",
      "Khỏi nói. Cô biết rồi."
    ]
  },
  "ngon_nhat_khu": {
    "valence": 1,
    "hearsay": [
      "{source} nói bánh mì con ngon nhất khu này đó. Cho cô một ổ thử coi.",
      "Nghe {source} khen dữ lắm nghen."
    ],
    "belief": [
      "Bánh mì con ngon thiệt. Cô nói với mấy người bên kia rồi đó.",
      "Cô giới thiệu cho nhỏ em cô rồi nghen."
    ],
    "conviction": [
      "Khu này chỉ có bánh mì con là ăn được. Cô nói vậy đó.",
      "Nhà tui gần xe bánh mì cô Ba — tui chỉ đường cho người ta vậy đó."
    ]
  }
}
```

> Dòng cuối của `ngon_nhat_khu.conviction` là điểm nối sang **thước đo tiến trình không có con số** của P2-05 §2.5. Khi một `Belief` tốt đạt `declarations ≥ 3` ở đủ **3 NPC khác nhau**, cách người ta chỉ đường trong hẻm đổi. Không có một con số nào lên màn hình.

---

## 4. UI/UX hai thiết bị

| Thành phần | PC | Mobile (v2) |
|---|---|---|
| **Bubble nghe lỏm** | Nền đục, 4 mức cỡ chữ, đuôi chỉ đúng người nói. Không tự chạy tiếp | Giống. Bubble neo trên đỉnh màn hình nếu góc hẻm bị ngón tay che |
| **Hành động "nghiêng người"** | Giữ `Shift` hoặc `chuột phải` | **Chạm & giữ** vùng góc hẻm — vùng chạm **≥44pt**, có vòng tiến trình 0.4s để tránh chạm nhầm |
| **Chỉ báo có cảnh nghe lỏm** | Hai chấm `..` nhỏ trên góc hẻm + tiếng lao xao nhỏ ở kênh "đường phố" | Giống. Kênh âm riêng, tắt được (CANON §15.4) |
| **Nhật ký thô** | P2-05 | P2-05 |
| **Công tắc** | `Cài đặt → Trợ năng → NPC nhớ nhầm / đổ oan` | Giống |

**Ba quy tắc:**

1. **Không có icon "tin đồn mới!".** Không badge, không chấm đỏ, không popup. Nếu người chơi không để ý thì họ không biết — và đó là đúng. Thứ duy nhất được phép là **hai chấm `..` rất nhỏ** và **tiếng lao xao**, cả hai đều là chi tiết môi trường chứ không phải HUD.
2. **Chỉ báo phải sống sót qua "giảm chuyển động".** Khi tắt animation, hai chấm `..` chuyển thành một **dấu hiệu tĩnh** (hai cái ghế nhựa đổi tư thế). Tín hiệu không được mất khi bật trợ năng.
3. **Kênh âm "giọng NPC" tách riêng** (CANON §15.4) phải bao gồm cả thoại nghe lỏm. Người tắt giọng NPC vẫn đọc được bubble — **bubble là kênh chính, âm thanh là kênh phụ.** Không bao giờ ngược lại.

---

## 5. Tham số cần tune

| Tên | Khởi điểm | Khoảng | Cách đo |
|---|---|---|---|
| `GOSSIP_START_DAY` | 4 | 3–6 | Đo thời gian chơi thật tới ngày 4; mục tiêu **≈2 giờ** (CANON §12.6). **Đo, không đoán** |
| `MUTATION_START_DAY` | 8 | 6–12 | Người chơi phải gặp ≥2 chuỗi đồn thổi **đúng** trước khi gặp chuỗi sai |
| `budget.mutationsLeft` | **4** | 3–5 | Sarah: *3–4 lần cả season*. >5 là vi phạm HT3 |
| `budget.minGapDays` | 6 | 4–10 | Hai lần nhớ nhầm không bao giờ trong cùng một tuần chơi |
| `MAX_HOPS` | 3 | 2–3 | Đếm `chain.length` tối đa trong 200 mùa |
| `MAX_TRANSMISSIONS_PER_NIGHT` | 3 | 2–5 | Số cảnh nghe lỏm có nội dung / tuần — mục tiêu **3–5** |
| `keep` (xấu / tốt) | 0.70 / 0.75 `+0.15·thanThien` | 0.65–0.90 | CANON §12.3 chốt khoảng 0.7–0.85 |
| `MIN_CONFIDENCE` (xấu / tốt) | 0.35 / 0.30 | 0.25–0.45 | Số tin "sống" cùng lúc trong hẻm — mục tiêu **≤6** |
| `GOOD_NEWS_MUL` | **1.45** | 1.2–1.8 | Tỉ lệ tin tốt : xấu được kể — mục tiêu **≥2:1** |
| `BAD_NEWS_MUL` | 0.85 | 0.7–1.0 | Như trên |
| `MUTATION_GRAPH[*].rate` | Bảng §2.3 | ±0.10 | Per-kind. **Không bao giờ gộp thành một số** |
| `DECLARATION_GAIN` | 0.12 | 0.08–0.20 | Số ngày để một tin `hardened` — mục tiêu **5–9 ngày** |
| `DECLARATION_CAP` | 1.60 | 1.4–2.0 | Không tin nào vượt intensity gốc quá 60% |
| `AMPLIFIER` bà Sáu / bé Su | 1.40 / 1.50 | 1.2–1.8 | Số người biết một tin sau 3 đêm — mục tiêu **2–4** |
| `AMPLIFIER` chị Lan | 0.35 | 0.2–0.5 | Chị Lan kể **1–2 lần cả mùa**. Không hơn |
| `GRAVITY_FLOOR.DROPPED_FOOD` | **0.55** | 0.45–0.65 | **Chốt cứng từ P2-02 §4.6.** Đổi ở đây phải đổi cả bên đó |
| `GRAVITY_FLOOR.DIRTY_HANDS` / `.WRONG_NAME` | 0.45 / 0.40 | 0.3–0.6 | Tỉ lệ 3 sự kiện nặng được kể lại — mục tiêu **≥70%** |
| Thầy Phúc `confidenceMulOnReceive` | 0.60 | 0.5–0.8 | Tin qua thầy Phúc phải "chậm" thấy được |
| `disprove` kênh 1 | ×0.55 | 0.4–0.7 | Số lần làm-ngược-lại để gỡ 1 tin — mục tiêu **1–2** |
| `disprove` với `INTENT` + `soi≥0.7` | ×0.80 | 0.7–0.9 | Mục tiêu **3–4 lần** — "giải thích không ăn thua" |
| `dormant` hồi sinh | ×1.3 | 1.2–1.6 | "Tiếng dữ đồn xa" phải cảm nhận được |
| Cảnh nghe lỏm `durationSec` | 18–25 | 15–35 | Test với cỡ chữ 200%: đọc hết **3 bubble** trước khi cảnh đóng |
| `gazeFactor` phạt khi nghiêng người | ×1.3 trong 5s | 1.1–1.6 | Nghe lỏm giữa lúc đông khách phải **thật sự** rủi ro |
| Trễ sự kiện → lời nhắc lại | **2 ngày** | 2–3 | Tỉ lệ người chơi nối được nhân quả (§2.13) |

---

## 6. Tiêu chí đạt

**Bất biến cơ chế (unit test, CI):**

- [ ] Không memory `WITNESSED` nào bị mutate — **0/500 mùa**.
- [ ] `mutationsLeft` không bao giờ âm; tổng mutation/mùa **≤4**.
- [ ] Hai mutation bất kỳ cách nhau **≥6 ngày**.
- [ ] `chain.length === hops` với mọi belief có `hops ≥ 1`. Không belief nào có `chain` rỗng.
- [ ] `hops ≤ 3` luôn đúng.
- [ ] Mọi dòng thoại phát từ belief `HEARD` đều chứa tên `source.from` (test quét `content/lines/`, build fail nếu thiếu).
- [ ] `MUTATION_GRAPH['PLAYER_NAME'] === null` và `['USUAL_ORDER'] === null`.
- [ ] Tắt `settings.npcMisremember` → **0 mutation**, nhưng `gossipLog.length > 0` (đồn thổi vẫn chạy).
- [ ] `day < GOSSIP_START_DAY` → `gossipLog` rỗng.
- [ ] `intensityMul ≤ 1.60` luôn đúng.
- [ ] Bộ 7 assert của §2.12 pass trên 500 mùa.
- [ ] Cùng `seed` + cùng `day` → `gossipTick` cho **kết quả byte-identical** (CANON §8e, chống save-scum).
- [ ] `tellWillingness` **không đọc `deTha`** ở bất kỳ nhánh nào (test tĩnh trên AST — đây là bất biến bịt CANON §8b, xem §2.10).
- [ ] `tellWillingness(chị Lan, DROPPED_FOOD) === 0.55` — khớp đúng `pGossip` đã chốt ở `P2-02 §4.6`.

**Cân bằng (mô phỏng 200 mùa):**

- [ ] Tin tốt được kể nhiều hơn tin xấu **≥2:1**.
- [ ] Số belief "sống" cùng lúc trong hẻm **≤6**.
- [ ] Số cảnh nghe lỏm có nội dung **3–5/tuần**.
- [ ] Người chơi chơi sạch hoàn toàn: **≤1** tin xấu tồn tại cả mùa.
- [ ] Người chơi ăn gian có chọn lọc với 9 NPC "dễ tha": **≥1 NPC `soi` cao** có `belief` về `ORDER_DEFECT` trước ngày **12**. ← đây là test của §8b, và nó là test quan trọng nhất trong mục này.
- [ ] Không NPC nào rơi vào "biết hết mọi tin xấu" (**≤4 belief xấu/NPC** cả mùa).

**Người chơi (10 người lạ, cổng P1 của CANON §17):**

- [ ] ≥**7/10** nối được chuỗi 3 mắt xích ở §2.13 (hai hàng ✅ của bảng phép đo).
- [ ] ≥**8/10** kể lại được **tên người nguồn** của ít nhất một tin đồn họ nghe.
- [ ] **0/10** mô tả cơ chế bằng chữ "random" hoặc "hên xui".
- [ ] ≥**6/10** nói được ít nhất một trong hai nút khuếch đại (*"bà bán tàu hũ nhiều chuyện lắm"*) — dấu hiệu họ đã dựng được mô hình xã hội.
- [ ] **0/10** bị đổ oan mà **không tìm được nguồn**. Nếu có 1 ca → lỗi P0, sửa trước mọi thứ khác.
- [ ] Nhóm bật công tắc tắt: ≥**8/10** vẫn nghe lỏm được và vẫn nối được chuỗi (vì đồn thổi vẫn chạy, chỉ là luôn đúng).

---

## 7. Rủi ro & cách bịt

| # | Rủi ro | Mức | Cách bịt |
|---|---|---|---|
| R1 | **Nhớ nhầm bị report là bug** (Phản biện, HT3) | **Cao nhất** | `{source}` bắt buộc + nghe lỏm + ngân sách 4/mùa + `MUTATION_START_DAY` 8. Nếu playtest còn 1 ca → **hạ ngân sách xuống 2**, không tăng độ rõ |
| R2 | **Không có nghe lỏm → cả cơ chế thành nhiễu** | **Cao nhất** | CANON §12.4 là điều kiện: **không có nghe lỏm thì cắt luôn P2-04 khỏi build.** Ghi vào định nghĩa "xong" của sprint |
| R3 | Talk of the Town syndrome — hệ tự ăn mòn nền sự thật | Cao | `mutation_rate` per-kind + 3 kind `null` (tên người chơi, tên NPC, món "như mọi bữa") + `mutated` chỉ đặt được **một lần**/belief |
| R4 | **CANON §8b** phân tầng khách | Cao | §2.10 — `deTha` và `thanThien` độc lập. 6/12 NPC ở ô bẫy, gồm cả hai nút khuếch đại |
| R5 | **CANON §8h** khai thác nhớ nhầm chiều ngược | Trung | §2.11 `personalityBias` + ngân sách mùa. Chiến lược "farm khen oan" suy biến thành "làm tốt" |
| R6 | **CANON §16 Đừng-3** — tin đồn lẻn vào hệ quả | **Cao** | §2.12 danh sách đen + bộ 7 assert chạy trên 500 mùa mỗi lần CI |
| R7 | Vòng xoáy tiêu cực ở tầng xã hội | Cao | `GOOD_NEWS_MUL` 1.45 + hai nút khuếch đại đều `personalityBias` lệch tốt + `MIN_CONFIDENCE` tin xấu cao hơn |
| R8 | Nghe lỏm thành busywork (dừng tay 20s × 40 ngày) | Trung | Tối đa 1 cảnh/ngày, luôn rơi vào lõm khách, tier 1 (dừng tay) đã đủ lấy nội dung — chỉ **nguồn** mới đòi tier 2 |
| R9 | Người chơi ngắt quãng (Ngọc Ánh) không bao giờ thấy chuỗi | **Cao** | Chuỗi đầu tiên có kịch bản + nhật ký thô ghi đủ 3 mốc (P2-05). Cô ấy nối lại được vào hôm sau |
| R10 | Chú Kiệt thành nguồn tin xấu vô hạn | Trung | Kiệt `amplifier` 1.10 nhưng `credibility` **0.50** và chỉ có 4 cạnh ra, không cạnh nào tới nút khuếch đại. Tin qua Kiệt đi chậm |
| R11 | **CANON §16 Đừng-1** — nghe lỏm phình thành mô phỏng đời sống | Trung | `EavesdropScene` **không có pathing, không có state vị trí**. NPC fade-in/fade-out. Tối đa 1 cảnh/ngày |
| R12 | Khối lượng thoại phình | Trung | 12 claim × 3 pool × 2–3 biến thể ≈ **90 dòng**. Dùng pool generic + shuffle-bag (CANON §11) |

---

## 8. Truy vết

| Nội dung | `idea.md` | `CANON.md` |
|---|---|---|
| Đồn thổi, `gossip = {sựkiện, độ mạnh, người kể}` | §9.6 mục 3 (dòng 405–406) | §12 |
| "Nhớ nhầm 10%" — nguyên bản bị cắt | §9.6 mục 2 (dòng 403) | — |
| HT3 — 4 agent bác bỏ, Sarah / Minh / Phản biện / Linh / David | §16 HT3 (dòng 673–680) | §12 |
| Talk of the Town, >100 buổi diễn, `mutation_rate` per-kind | §16 HT3 + §18.5 | §12 ràng buộc 1 |
| *"Characters are not consciously aware of…"* | §18.5 (dòng 869) | — |
| Mutation graph author tay | §18.5 (dòng 871–878) | §12 |
| 6 ràng buộc bắt buộc | §18.5 (dòng 880–886) | §12 |
| `declaration` — nói mãi thành tin thật | §18.5 (dòng 888) | §12 |
| Tin tốt lan mạnh hơn tin xấu | §18.5 ràng buộc 5 | §12 ràng buộc 5 |
| Nghe lỏm là điều kiện tồn tại | §18.5 ràng buộc 4 | §12 ràng buộc 4 |
| Đừng-3, Sergio Ocio Barriales | §18.6 (dòng 900) | §16 Đừng-3 |
| Đừng-1, Orkin / F.E.A.R. / Radiant AI | §18.6 | §16 Đừng-1 |
| Ăn gian (b) phân tầng khách | §21 mục b (dòng 1015) | §8b |
| Ăn gian (h) bias theo tính cách | §21 mục h (dòng 1021) | §8h |
| Ăn gian (e) save-scum, seed cố định | §21 mục e | §8e |
| 12 NPC, tính cách 4 chiều | §19.5 | §9, §4 |
| Bà Sáu / bé Su là nút khuếch đại; chị Lan mạnh nhất | — | §9 dòng 223, 224, 230 |
| Chú Kiệt — đối thủ, gian dối vệ sinh | — | §9 dòng 231, §7.5 |
| Bà Bảy ↔ cô Ba: bất hoà 15 năm không ai nhắc | §19.5 | §9 dòng 220 |
| Gossip chain hiển thị được = tiêu chí P1 | — | §17 (P1) |
| Công tắc số 1 trong 6 công tắc | §20 | §15 |
| Shuffle-bag, bark 3 tầng, 35% im lặng | §18.7 | §11 |

---

## 9. Đề xuất sửa CANON

1. **§12 — tách `GOSSIP_START_DAY` và `MUTATION_START_DAY`.** CANON hiện gộp: *"Không xảy ra trong 2 giờ chơi đầu"*. Doc này đề xuất **hai mốc** (ngày 4 và ngày 8), vì người chơi cần thấy đồn thổi **đúng** vài lần trước khi gặp đồn thổi **sai** — nếu không, họ không có đường cơ sở để nhận ra cái sai là sai, và ta rơi thẳng vào lời phản đối của Minh. **Đề nghị ghi cả hai mốc vào §12 ràng buộc 6.**

2. **§12 — chốt ngân sách mutation cả mùa.** CANON ghi ràng buộc per-kind nhưng không ghi trần tuyệt đối. Sarah xin nguyên văn *"3–4 lần trong cả season"* và đó là một con số, không phải một cảm giác. **Đề nghị đưa `mutationsLeft = 4` và `minGapDays = 6` vào §12.**

3. **§12 — bổ sung dòng: mutation KHÔNG BAO GIỜ áp lên `WITNESSED`.** Đây là ranh giới làm cả HT3 có nghĩa, nhưng CANON hiện chỉ nói gián tiếp qua "nguồn phải truy vết được". **Đề nghị viết thẳng: "Chứng kiến thì nhớ đúng. Luôn luôn."**

4. **§9 — thêm cột "vai trò trong mạng đồn thổi"** cho bảng 12 NPC: `AMPLIFIER` (bà Sáu, bé Su) · `SILENT_STRONG` (chị Lan) · `DAMPER` (thầy Phúc) · `DISTORTER` (chú Kiệt) · `NORMAL` (7 người còn lại). Hiện bốn vai trò này nằm rải trong cột "chức năng thiết kế" dưới dạng văn xuôi, nên P2/P3 dễ tune lệch nhau.

5. **§8b — ghi rõ rằng cách bịt nằm ở tính ĐỘC LẬP của `deTha` và `thanThien`.** CANON §8b hiện viết *"người dễ tha không giận nhưng vẫn vô tư kể lại"* như một mô tả hành vi. Nó thực ra là một **bất biến về schema**: không được phép có dòng code nào nối `deTha` vào `tellWillingness`. **Đề nghị ghi thành ràng buộc kỹ thuật ở §4 để không ai "tối ưu" nó đi trong một lần refactor.**

6. **§12 — nâng nghe lỏm lên thành mục riêng.** Nó hiện là ràng buộc số 4 trong danh sách 6, nhưng nó là **điều kiện tồn tại** của cả hai cơ chế kia, không phải một ràng buộc ngang hàng. **Đề nghị tách thành một dòng đứng trước danh sách:** *"Nghe lỏm là điều kiện. Sáu ràng buộc dưới đây chỉ có nghĩa khi nghe lỏm đã chạy."*
