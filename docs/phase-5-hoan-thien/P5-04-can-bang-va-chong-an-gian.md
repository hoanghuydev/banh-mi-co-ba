# P5-04 — Cân bằng và chống ăn gian

> ## ⚡ REVAMP 2026-10-20 — ⚠️ CHẾT MỘT PHẦN
> Căn cứ: [`CANON.md`](../CANON.md) bản revamp + [`revamp/00-YEU-CAU.md`](../revamp/00-YEU-CAU.md). Phần ☠️ không dùng làm căn cứ.
>
> | Mục | Trạng thái | Lý do / thay bằng |
> |---|---|---|
> | §1 + §2.10 ba lối chơi (L3 "tối ưu quan hệ"), "đi hết 40 ngày" | 🔁 | Thay bằng 3 lối của đề bài T5.1: ổn định / bẩn / xịn; đo thời gian tới mốc thắng + tỉ lệ thua ATTP bằng `tools/sim.ts` (R2/R5) |
> | §2.0 từ vựng `trustCeiling`, bucket | ☠️ | Hệ quan hệ chết |
> | (d) đốt NPC rồi để nguội · (h) nhớ nhầm chiều ngược | ☠️ | CANON §8 d/h chết |
> | (b) phân tầng khách · (i) spam `FREE_EXTRA` · (k) từ chối phục vụ | 🔁 | Bịt bằng review: người dễ tha vẫn kể lỗi; diminishing returns trên sao; bị từ chối → 1★ chắc chắn (R4) |
> | (g) micro-cheat §2.7 — bộ đếm theo NPC | 🔁 | Lộ ra thành review "dạo này bánh nhạt…". Không còn mốc 40 ngày nên lỗ lớn hơn (R4) |
> | (e) autosave `MEMORY_WRITTEN`, stream `gossip` · (f) "phần hay ở quan hệ" | 🔁 | Stream → `review` (CANON L1). Bảng số công khai có chủ ý |
> | Thiếu lỗ hổng mới m/n/o (né ngưỡng ATTP, phá giá mua sao, farm sao bằng bán ít) | 🔁 | Phải thêm (CANON §8, R3/R2/R5) |
> | §2.8 metric 13–15, bước tune 6–8 (trí nhớ, đồn thổi, đường cong 40 ngày) | ☠️ | Thêm metric sao TB, review xấu/ngày, thời gian tới mốc thắng, tỉ lệ ATTP |
> | §2.11 đường cong khó 40 ngày | ☠️ | Thay bằng `Y(x)` theo sao (R5) |
> | §2.9, §5 mọi con số | ⏳ | Mô phỏng lại ở R2/R5 |
> | §6.3 playtest theo cổng P1/P3/P4 | 🔁 | Đổi sang mốc R |
>
> **Còn dùng được:** cơ chế bịt (a)(c)(j)(l), nguyên tắc tune theo tầng + điều kiện dừng + luật ≤3 tham số/lần (§2.8.2–2.8.3), §2.12 chill, §2.13 cảnh báo số Good Pizza (40%).

**Thuộc phase:** P5 — Hoàn thiện
**Phụ thuộc:** `CANON.md` §8 (12 lỗ hổng) · §5 (perception) · §12 (trí nhớ, đồn thổi) · §13 (4 ràng buộc kinh tế) · §3 (11 sự kiện + salience) · §4 (tính cách) · §17 (cổng P1) · `P5-01` §2.2.2 (chế độ không giới hạn thời gian) · `P5-02` (đọc được bằng mắt) · `P5-03` (đọc được bằng tai)
**Trạng thái:** **Chốt** về cơ chế bịt và quy trình · **Cần đo** ở mọi giá trị số trong §5 (đó là bản chất của cân bằng)

---

## 1. Mục tiêu

Ba việc, theo đúng thứ tự:

1. **Bịt 12 lỗ hổng của CANON §8** bằng cơ chế có tham số và có kịch bản test — không phải bằng lời hứa. Minh *"sẽ thử hết, và sẽ viết lên Reddit"* (idea §21).
2. **Chứng minh không có dominant strategy**: ba lối chơi (cẩu thả-nhanh / kỹ-chậm / tối ưu quan hệ) đều đi được hết 40 ngày, chênh nhau ≤ 15% về kết quả kinh tế, và **khác nhau về ai còn ở lại với mình** — chứ không khác nhau về điểm số.
3. **Giữ được "chill" theo đúng nghĩa của nó**, đo được bằng số: **chill ≠ buồn ngủ** (*"There's a fine line between calm and boring"*) và **chill ≠ không có áp lực** (Minh: *"chill là áp lực do mình tự tạo ra vì tham"*).

Ràng buộc trùm lên tất cả: **T3 cấm hiện chỉ số**. Nghĩa là **mọi hình phạt trong tài liệu này phải biểu hiện ra bằng mặt, lời, dáng, hành động, hoặc hệ quả trễ** — không bao giờ bằng một con số đỏ. Đây là điều làm việc cân bằng game này khó hơn bình thường, và cũng là điều làm nó đáng làm.

---

## 2. Cơ chế

### 2.0. Từ vựng dùng chung

| Khoá | Nghĩa |
|---|---|
| `serving` | Một lượt phục vụ một khách (một ổ bánh giao đi) |
| `defect` | Một sai lệch giữa `order.spec` và `dish`, theo `craft/diff.ts` (CANON §6) |
| `microDefect` | `defect` có `salience < 25` **và** chưa bao giờ chạm `NOTICED` ở lượt đó |
| `ledger` | Bộ đếm trượt lưu theo NPC, xem §2.7 |
| `dayNet` | Doanh thu − giá vốn − chi phí cố định − nghĩa vụ đến hạn, tính cuối ngày |
| `trustCeiling` | Trần tin tưởng vĩnh viễn của một NPC. **Không hiện ra.** Chỉ biểu hiện qua việc họ không bao giờ thân lại như cũ |
| `walkIn` | Khách vãng lai vô danh (pool generic), khác 12 NPC có tên |
| `specCheckRate` | Tỉ lệ khách nói rõ yêu cầu thay vì để mặc ("cho nhiều rau nha") |

---

### 2.1–2.6 + 2.8–2.12. Mười hai lỗ hổng — triển khai đầy đủ

> Mỗi mục có 4 phần: **cách khai thác chi tiết** · **cơ chế bịt** · **tham số** · **kịch bản test**.
> Mã test `TC-<chữ cái><số>`. Mọi test đều chạy được bằng bot hoặc bằng quy trình thủ công viết ra được.

---

#### (a) Farm cửa sổ điện thoại

**Cách khai thác chi tiết.**
`gazeFactor` của một khách đang bấm điện thoại là **0,05**. Theo hiệu chỉnh CANON §5, `DROPPED_FOOD` (salience 75) cần **~28 giây** để chạm `CONFIRMED` ở mức gaze đó — nghĩa là **thực tế không bao giờ**. Người chơi khôn sẽ:
1. Chuẩn bị sẵn pate rẻ / thịt ít / rau bớt trong tay, **không đặt**.
2. Đứng chờ. Nhìn NPC. Chờ pose `check_phone` (P5-02 §2.4.3).
3. Thả hết trong 2–3 giây đó.
4. Lặp lại với mọi khách, mọi ngày.

Nếu **chờ không mất gì**, đây là **dominant strategy tuyệt đối** và toàn bộ cơ chế attention sụp — perception biến thành một minigame bấm đúng lúc.

**Cơ chế bịt.**
1. **Câu giờ có giá.** Ba loại giá, cùng chạy:
   - `patience` tụt → tiến tới `MADE_THEM_WAIT` (**salience 100**, CANON §3.1 — không cần gaze, leo thang theo giây).
   - Hàng chờ dài thêm → khách sau vào trạng thái chờ sớm hơn → lan sang cả dây.
   - Bánh nguội → `BURNT_OR_COLD` (salience 80, có mùi → bán kính nhận thấy rộng hơn).
2. **Cửa sổ ngắn và có cooldown.** Trung bình **2,4 giây**. Một lần đặt nguyên liệu mất **0,45–0,60s** → lọt tối đa **3–4 thao tác**, và **chỉ khi đã chọn sẵn**. Đúng tinh thần CANON §5.4: *"đủ để dùng nếu đã chuẩn bị sẵn, không đủ để farm"*.
3. **`certainty` là capacitor, không phải công tắc.** Nếu đã leo lên `GLIMPSED` (0,35–0,70) trước khi cửa sổ mở, việc chờ **không xoá** nó: `decayRate` 0,18/s nghĩa là từ 0,69 về 0 mất **~3,8 giây** — dài hơn cả cửa sổ. Không "tẩy sạch" được bằng cách đứng im.
4. **Cửa sổ không được báo trước.** Pose `check_phone` bắt đầu bằng động tác đưa tay lên (~250ms) → người chơi phải **phản ứng**, không **đếm nhịp**.
5. **Undo không phải máy dò.** Undo không tiết lộ `gazeFactor`; và có chi phí 0,6s (P5-01 §2.5.2).

**Tham số.**

| Tên | Khởi điểm | Khoảng | Ghi chú |
|---|---|---|---|
| `phoneWindowMs` | **2400** | 1800–3200 | Phân phối chuẩn, σ = 400 |
| `phoneWindowCooldownMs` (mỗi NPC) | **45000** | 30000–70000 | Không farm liên tiếp trên một người |
| `phoneWindowRatePerMin` (chuẩn) | **0,8** | 0,4–1,4 | |
| `phoneWindowRatePerMin` (anh Bảo) | **2,6** | 1,8–3,4 | Sandbox học perception (CANON §9 #10) |
| `gazeFactorPhone` | **0,05** | cố định | CANON §5 |
| `phoneWindowTellMs` | **250** | 180–350 | Thời gian "ra dấu" trước khi gaze tụt |
| `decayRate` | **0,18/s** | 0,10–0,26 | Phải để `0,70 → 0` mất > `phoneWindowMs` |
| `placeDurationMs` | **450–600** | — | Đặt nguyên liệu tốn thời gian thật |
| `patienceDrainRate` | **1,0/s** | 0,7–1,4 | |
| `dishColdRate` | **1,0** | 0,6–1,5 | |

**Kịch bản test.**

| Mã | Kịch bản | Kỳ vọng |
|---|---|---|
| **TC-A1** | Bot "kiên nhẫn tuyệt đối": mỗi khách, **chờ tới đúng cửa sổ điện thoại** rồi mới bỏ nguyên liệu rẻ. Chạy 40 ngày | `dayNet` trung bình **≤ baseline** (bot chơi thẳng). Số `MADE_THEM_WAIT` ≥ **2,5×** baseline |
| **TC-A2** | Bot cố thả **5 nguyên liệu** trong một cửa sổ | **Không lọt.** Tối đa 4 thao tác vừa `phoneWindowMs`, thao tác thứ 5 bị bắt |
| **TC-A3** | Đưa `certainty` lên 0,65, rồi đứng im chờ cửa sổ (2,4s) | `certainty` khi cửa sổ mở **≥ 0,22** — không về 0 |
| **TC-A4** | Chạy 200 lượt, đo phân bố thời điểm cửa sổ | Không có chu kỳ đoán được (test tự tương quan < 0,15) |

---

#### (b) Phân tầng khách

**Cách khai thác chi tiết.**
12 NPC có `soi` từ 0,2 (anh Dũng) tới 0,9 (bà Bảy, chị Lan). Người chơi lập bảng: 3 người "soi" được phục vụ hoàn hảo; 9 người còn lại bị ăn bớt. Trực giác của người chơi: *"người dễ tha thì không giận, vậy ăn gian với họ là miễn phí."*

**Cơ chế bịt — fix đẹp nhất vì nó dùng chính hệ đồn thổi đã có.**

Tách hai thứ mà trực giác hay gộp làm một:

| Chiều tính cách | Điều khiển cái gì | **KHÔNG** điều khiển cái gì |
|---|---|---|
| `deTha` | Tốc độ **decay** của memory, mức độ **giận** | **Không** điều khiển việc có kể lại hay không |
| `thanThien` | **Xác suất kể lại** + tốc độ lên quan hệ | Không điều khiển mức giận |

→ Người `deTha` cao (chú Tư 0,9; anh Bảo 0,8; bé Su 0,9) **không giận** — nhưng `thanThien` của họ (0,6 / 0,4 / **1,0**) khiến họ **vô tư kể lại**. Bé Su (`deTha` 0,9 + `thanThien` 1,0) là trường hợp cực đoan: em **hoàn toàn không giận** và **kể cho cả hẻm**, kèm quay TikTok.

Và đích đến của tin đồn là người `soi` cao. Ăn gian với người dễ tính **không miễn phí — chỉ trả chậm hơn**, và trả cho đúng người mình đang cố tránh.

```ts
// sim/gossip.ts
tellChance = 0.25 + 0.55 * npc.thanThien       // KHÔNG có deTha trong công thức
// bé Su: 0.80   chú Tư: 0.58   anh Bảo: 0.47   chị Lan: 0.42
```

**Tham số.**

| Tên | Khởi điểm | Khoảng |
|---|---|---|
| `tellChanceBase` | 0,25 | 0,15–0,35 |
| `tellChanceThanThienMul` | 0,55 | 0,40–0,70 |
| `gossipDelayDays` | 1–3 (uniform) | 1–4 |
| `confidencePerHop` | 0,78 | 0,70–0,85 (CANON §12.3) |
| `hopCap` | **2** | 2–3 (CANON §12.2) |
| `goodNewsSpreadMul` | **1,35** | 1,2–1,6 (CANON §12.5: tin tốt lan mạnh hơn) |
| `listenerSoiWeight` | 1,4 | 1,0–1,8 | Người `soi` cao **tiếp nhận** tin xấu mạnh hơn |

**Kịch bản test.**

| Mã | Kịch bản | Kỳ vọng |
|---|---|---|
| **TC-B1** | Bot "phân tầng": phục vụ hoàn hảo bà Bảy / chị Lan / thầy Phúc; ăn bớt 9 người còn lại. 40 ngày | Tới **ngày ≤ 14**, bà Bảy hoặc chị Lan phải phát ra ít nhất một dòng có nguồn truy vết được (*"con Su nó nói…"*). `dayNet` cuối mùa ≤ baseline |
| **TC-B2** | Chỉ ăn bớt với bé Su (deTha cao nhất, thanThien cao nhất) | Tin lan **nhanh nhất** trong 12 NPC — đo `daysUntilFirstHop` ≤ 3 |
| **TC-B3** | Chỉ ăn bớt với chị Lan (soi cao, thanThien thấp) | Chị Lan **không kể** (42%), nhưng **giận và ghi nhớ** — và có thể biến mất im lặng. Hai đường phạt khác nhau, cả hai đều phải chạy |

---

#### (c) Lịch mưa

**Cách khai thác chi tiết.**
Mưa làm khách cầm dù, nhìn xuống, đứng nép → `gazeFactor` giảm. Người chơi lập lịch: xem dự báo, nhập pate rẻ đúng ngày mưa, ăn gian ngày mưa, làm sạch ngày nắng.

**Cơ chế bịt — tự cân bằng, gần như không cần code thêm.**
Mưa cũng **giảm ~40% lượng khách** (CANON §8c). Ngày ăn gian = ngày ít doanh thu nhất. Số tiền tiết kiệm được từ ăn gian tỉ lệ với **số ổ bán ra**, mà số ổ đã bị cắt 40%.

Toán:
```
Lợi ích ăn gian ngày mưa = (số khách × 0,60) × (tiết kiệm/ổ)
Lợi ích ăn gian ngày nắng = (số khách × 1,00) × (tiết kiệm/ổ)
→ Ngày mưa luôn là ngày TỆ NHẤT để ăn gian nếu tính theo tuyệt đối.
```
Và rủi ro **không** giảm 40% tương ứng: `rainGazeMul` chỉ là **0,75**, không phải 0,60.
Cộng thêm: **mưa không có tiếng rao** và ambience yên hơn (P5-03 §3.1) → **tiếng động** của `DROPPED_FOOD` nổi bật hơn, không bị che.

**Tham số.**

| Tên | Khởi điểm | Khoảng |
|---|---|---|
| `rainCustomerMul` | **0,60** | 0,50–0,72 |
| `rainGazeMul` | **0,75** | 0,68–0,88 |
| `rainMarketPriceMul` | 0,92 | 0,88–1,00 |
| `rainDishColdMul` | **1,25** | 1,1–1,4 | Mưa làm bánh nguội nhanh hơn |
| `rainAmbienceGainDb` | −5 dB | — | Âm thao tác nổi hơn |
| Số ngày mưa / mùa | **6 / 40** | 5–8 | Xem §2.14 |

**Kịch bản test.**

| Mã | Kịch bản | Kỳ vọng |
|---|---|---|
| **TC-R1** | Bot "chỉ ăn gian ngày mưa", 40 ngày, so với bot baseline | `seasonNet` chênh **≤ +3%** so với baseline. Nếu > +8% → giảm `rainGazeMul` |
| **TC-R2** | Bot "chỉ nhập hàng rẻ ngày mưa" | Bị chặn bởi hạn dùng (mục j): pate 2 ngày → không tích được qua ngày nắng |

---

#### (d) Đốt NPC rồi để nguội

**Cách khai thác chi tiết.**
Vắt kiệt một NPC 3 ngày (ăn bớt tối đa, không chăm sóc), rồi **né 5 ngày** cho grudge decay hết, rồi quay lại vắt tiếp. Nếu quan hệ hồi phục hoàn toàn, đây là vòng lặp vô hạn.

**Cơ chế bịt — grudge decay được, nhưng hạ TRẦN tin tưởng vĩnh viễn.**

```ts
// sim/reputation.ts
onConfirmedNegative(npc, intensity) {
  npc.points -= impact(intensity)
  if (intensity >= 0.70) {
    const pen = CEILING_PENALTY_BASE * (1 - npc.deTha)   // dễ tha -> hạ ít
    npc.trustCeiling = Math.max(TRUST_CEILING_FLOOR, npc.trustCeiling - pen)
  }
}
// Hồi phục:  points = min(points + gain, npc.trustCeiling)
// Decay:     points = max(points - decay, floor_of_tier)   // CANON §12
```

Hệ quả đúng với đời: **hết giận nhưng không bao giờ thân lại như cũ.** Và vì T3 cấm hiện số, người chơi chỉ nhận ra qua việc: những dòng thoại thân mật nhất **không còn xuất hiện nữa**, dù họ đã hết giận.

**Cửa thứ hai: né 5 ngày cũng tốn.**
Không phục vụ một khách ruột nhiều ngày liên tiếp có giá riêng — họ đi chỗ khác, và **chỗ khác là chú Kiệt** (CANON §9 #12).

```ts
if (npc.daysSinceLastServed >= ABSENCE_TRIGGER_DAYS)
  switchChancePerDay = SWITCH_BASE * (1 - npc.thanThien * 0.5)
// Đã chuyển sang chú Kiệt -> visitFrequency *= 0.5 cho phần còn lại của mùa
```

**Tham số.**

| Tên | Khởi điểm | Khoảng |
|---|---|---|
| `CEILING_PENALTY_BASE` | **6,0** điểm | 4–9 |
| `TRUST_CEILING_FLOOR` | **35** | 30–45 | Không bao giờ về 0 — **cozy không sống nổi với "một lần sai → tẩy chay"** (CANON §4) |
| `grudgeDecayPerDay` (Rival) | 2,0 | 1–4 | CANON §12: decay tapering |
| `grudgeDecayPerDay` (Acquaintance) | 1,2 | — |
| `ABSENCE_TRIGGER_DAYS` | **4** | 3–6 |
| `SWITCH_BASE` | **0,12/ngày** | 0,06–0,20 |
| `switchedVisitFreqMul` | **0,50** | 0,4–0,7 |

**Kịch bản test.**

| Mã | Kịch bản | Kỳ vọng |
|---|---|---|
| **TC-D1** | Bot chạy chu kỳ **3 ngày vắt + 5 ngày né** × 5 lần trên chú Tư (deTha 0,9) | `trustCeiling` cuối mùa ≤ **70**. Không bao giờ đạt `Friend` lần thứ hai |
| **TC-D2** | Cùng chu kỳ trên chị Lan (deTha 0,2) | `trustCeiling` chạm sàn 35 sau ≤ **3 chu kỳ**; chị Lan biến mất im lặng trước ngày 30 |
| **TC-D3** | Né chú Tư 8 ngày liên tiếp, không ăn gian gì | Xác suất tích luỹ chuyển sang chú Kiệt ≈ **1−0,88⁵ ≈ 47%** (tính từ ngày 4) — phải quan sát được ở ≥ 2/5 lần chạy |
| **TC-D4** | Vắt kiệt rồi chăm sóc liên tục 15 ngày | `points` hồi lên **đúng `trustCeiling`, không vượt** |

---

#### (e) Save-scum

**Cách khai thác chi tiết.**
Bị bắt quả tang → tải lại ngày → làm lại không sai. Trên web (localStorage) việc này còn dễ hơn: sao lưu cả key rồi dán lại. Đây là cách **giết game nhanh nhất**, vì nó xoá bỏ hoàn toàn khái niệm "hệ quả".

**Cơ chế bịt — hai lớp, cả hai bắt buộc.**

1. **Autosave ngay khi sự kiện xảy ra**, không phải cuối ngày, không phải cuối khách.
```ts
eventbus.on('PERCEPTION_CONFIRMED', e => save.write({ reason: 'EVENT', eventId: e.id }))
eventbus.on('MEMORY_WRITTEN',      () => save.write({ reason: 'MEMORY' }))
eventbus.on('SERVING_COMPLETE',    () => save.write({ reason: 'SERVING' }))  // CANON §2
```
2. **Seed cố định theo ngày.** Mọi thứ không do người chơi quyết định đều **thuần tuý suy ra được từ `(saveId, dayIndex)`**:

```ts
// core/rng.ts — nhiều luồng độc lập, không dùng chung con trỏ
const streams = {
  arrival:   mulberry32(hash(saveId, day, 'arrival')),
  market:    mulberry32(hash(saveId, day, 'market')),
  weather:   mulberry32(hash(saveId, day, 'weather')),
  gossip:    mulberry32(hash(saveId, day, 'gossip')),
  barkPick:  mulberry32(hash(saveId, day, 'bark')),
  misremember: mulberry32(hash(saveId, day, 'misrem')),
}
```
**Vì sao phải tách luồng:** nếu dùng một con trỏ RNG chung, việc người chơi làm thêm/bớt một hành động sẽ **đẩy lệch con trỏ** → tải lại + làm khác đi một chút = giá chợ đổi, thứ tự khách đổi → **câu cá được**. Tách luồng thì giá chợ ngày 12 **luôn luôn** là giá đó, dù người chơi làm gì.

3. **Không có nút "chơi lại ngày".** Không có menu nào cho phép quay lại đầu ngày.
4. **Không chống crack.** idea §23: *"Game sẽ bị crack. Đừng đầu tư vào DRM."* Tương tự, không làm mã hoá save phức tạp — người muốn sửa save sẽ sửa được. Mục tiêu là **loại bỏ động cơ**, không phải dựng hàng rào: nếu tải lại cho **đúng kết quả cũ**, save-scum không còn lợi gì.

**Tham số.**

| Tên | Khởi điểm |
|---|---|
| `autosaveTriggers` | `CONFIRMED` · `MEMORY_WRITTEN` · `SERVING_COMPLETE` · `DAY_END` · `PURCHASE` |
| `autosaveDebounceMs` | 250 (gộp nhiều sự kiện sát nhau) |
| Số slot save | **1** (+ 1 backup tự động chống hỏng file) |
| `rngStreams` | 6 luồng như trên |

**Kịch bản test.**

| Mã | Kịch bản | Kỳ vọng |
|---|---|---|
| **TC-E1** | Chơi ngày 12, ghi lại giá chợ + thứ tự 20 khách + thời tiết. Tải lại, chơi **khác hoàn toàn**. So lại | **Trùng 100%** giá chợ, thứ tự khách, thời tiết |
| **TC-E2** | Làm rớt bánh trước mặt bà Bảy → `CONFIRMED`. Tắt game **không lưu tay**. Mở lại | Memory của bà Bảy **vẫn còn** |
| **TC-E3** | Sửa tay `localStorage` lùi 1 ngày | Game chạy bình thường (không chặn), nhưng ngày đó ra **đúng kết quả cũ** → không lợi |
| **TC-E4** | Chạy cùng `(saveId, day)` 1.000 lần với chuỗi hành động khác nhau | 6 luồng RNG cho đúng cùng dãy giá trị nền |

---

#### (f) Datamine + spreadsheet

**Cách khai thác chi tiết.**
Mở file `content/`, đọc hết bảng `visibility`, `salience`, giá chợ, lịch NPC, ngưỡng micro-cheat. Lập bảng tính. Chơi tối ưu tuyệt đối.

**Cơ chế bịt — KHÔNG BỊT.** (CANON §8f)

Chính sách công khai: **đảm bảo phần hay không nằm ở EV mà nằm ở quan hệ.** *"Biết hết công thức mà vẫn muốn chơi = bạn thắng."*

Nhưng "không bịt" không có nghĩa là "không đo". Phải có **một con số** chứng minh phần hay không nằm ở EV:

```
oracleAdvantage = (seasonNet của bot biết MỌI THỨ) / (seasonNet của bot dùng heuristic người chơi giỏi)
```

| Tên | Mục tiêu | Ghi chú |
|---|---|---|
| `oracleAdvantage` | **≤ 1,18** | Nếu > 1,30 → có một bí mật nào đó quá đáng giá, phải làm nó **quan sát được** thay vì ẩn |

Và một luật thiết kế đi kèm: **mọi thông tin đáng giá phải suy ra được từ quan sát trong game.** Lịch chú Tư (§13.2 CANON) không nên là bí mật — nó là một **bài toán quan sát**. Nếu datamine cho lợi thế lớn, đó là dấu hiệu ta đã giấu thứ lẽ ra nên cho thấy.

**Kịch bản test.**

| Mã | Kịch bản | Kỳ vọng |
|---|---|---|
| **TC-F1** | Chạy `oracleBot` vs `heuristicBot` 40 ngày × 20 seed | `oracleAdvantage` ≤ 1,18 |
| **TC-F2** | Hỏi 5 người chơi đã đọc hết wiki: *"bạn còn muốn chơi tiếp không?"* | ≥ 4/5 trả lời có |

---

#### (g) **Micro-cheat lặp vô hạn — lỗ hổng LỚN NHẤT** → §2.7 (mục riêng)

---

#### (h) Khai thác nhớ nhầm chiều ngược

**Cách khai thác chi tiết.**
Nếu NPC nhớ nhầm theo cả hai chiều với xác suất đều, người chơi có thể **cố tình tạo tình huống mơ hồ** để được ghi công oan: làm gần đúng, để khách tự nhớ thành "làm hoàn hảo"; hoặc để tin đồn tốt bị phóng đại (CANON §12: `REMEMBERED_USUAL --0.20--> "ngon nhất khu này"`).

**Cơ chế bịt — bias nhớ nhầm theo TÍNH CÁCH, không theo xác suất đều.**

```ts
// sim/memory.ts
// Xác suất một lần nhớ nhầm rơi về phía CÓ LỢI cho người chơi:
favorBias = clamp(0.50 - 0.45 * npc.soi + 0.35 * npc.thanThien, 0.08, 0.92)
```

| NPC | soi | thanThien | `favorBias` | Nghĩa |
|---|---|---|---|---|
| Bà Bảy | 0,9 | 0,7 | **0,34** | Soi → lệch xấu, nhưng thân thiện kéo lại |
| Chị Lan | 0,9 | 0,3 | **0,20** | Lệch xấu mạnh nhất |
| Thầy Phúc | 0,8 | 0,5 | **0,32** | |
| Chú Kiệt | 0,7 | 0,4 | **0,33** | |
| Chú Tư | 0,3 | 0,6 | **0,58** | Lệch tốt |
| Anh Bảo | 0,3 | 0,4 | **0,51** | |
| Bé Su | 0,4 | 1,0 | **0,67** | Lệch tốt mạnh nhất |
| Bà Sáu | 0,4 | 0,9 | **0,64** | |

→ **Người mà lời nói có trọng lượng nhất (`soi` cao) lại là người lệch xấu nhất.** Muốn farm được ghi công oan thì chỉ farm được từ bé Su và chú Tư — những người mà ai cũng biết là dễ tính. Và tin tốt từ người dễ tính có `listenerSoiWeight` thấp khi tới tai người soi.

**Hai chặn phụ:**
1. Memory tích cực do nhớ nhầm có `intensity × 0,60` so với memory tích cực **thật**, và **không được promote lên long-term** (CANON §12).
2. Khi người chơi **có mặt** và biết rõ mình không làm điều đó, một số NPC `soi` cao sẽ tự sửa: *"À không, hình như bữa đó là hàng bên kia."* — dùng `followup` tra lúc callback (CANON §11).

**Tham số.**

| Tên | Khởi điểm | Khoảng |
|---|---|---|
| `favorBiasBase` | 0,50 | cố định |
| `favorBiasSoiMul` | **−0,45** | −0,35 … −0,55 |
| `favorBiasThanThienMul` | **+0,35** | 0,25–0,45 |
| `favorBiasClamp` | 0,08–0,92 | | Không bao giờ 0 hoặc 1 |
| `falsePositiveIntensityMul` | **0,60** | 0,45–0,75 |
| `falsePositivePromotes` | **false** | cố định |
| `selfCorrectChance` (soi ≥ 0,7) | 0,25 | 0,15–0,40 |

**Kịch bản test.**

| Mã | Kịch bản | Kỳ vọng |
|---|---|---|
| **TC-H1** | Bot tạo 300 tình huống mơ hồ, trải đều 12 NPC | Tỉ lệ nhớ nhầm **có lợi** tương quan **âm** với `soi` (Pearson ≤ −0,60) |
| **TC-H2** | Farm ghi công oan chỉ từ bé Su + chú Tư, 40 ngày | `seasonNet` chênh ≤ **+4%** so với baseline |
| **TC-H3** | Tắt công tắc `allowFalseMemory` | Hệ quả của **lỗi thật** không đổi (so 40 ngày bot làm lỗi thật: `seasonNet` chênh ≤ 2%) |

---

#### (i) Spam hành vi tăng trust giá rẻ

**Cách khai thác chi tiết.**
`FREE_EXTRA` (salience 25) và `CARED_FOR_THEM` (salience 50) là sự kiện tích cực. Người chơi cho thêm đồ chua **với tất cả mọi người, mỗi lần**, và đưa trà đá cho mọi khách. Chi phí nguyên liệu nhỏ, lợi quan hệ cộng dồn.

**Cơ chế bịt — hai lớp.**

1. **Diminishing returns.** Lần thứ *n* trong cửa sổ 7 ngày với **cùng một NPC**:
```ts
value = BASE * Math.pow(DIMINISH_RATE, n - 1)      // 0.70^(n-1)
// n=1: 1.00 | n=2: 0.70 | n=3: 0.49 | n=4: 0.34 | n=5: 0.24
```

2. **Người tinh ý nhận ra bạn đang mua chuộc → phản tác dụng.**
```ts
if (n >= BRIBE_TRIGGER_N && npc.soi >= BRIBE_SOI_THRESHOLD) {
  emit('SUSPECT_BRIBE', { npc, intensity: 0.35 + 0.08 * (n - BRIBE_TRIGGER_N) })
  // -> thoại: "Con cho cô hoài vậy rồi lời lóm gì. Bán đàng hoàng đi con."
  // -> biểu cảm P5-02: brow_05 / eye_03 / mouth_02  (hoài nghi nhưng không giận)
}
```
Đây không phải hình phạt nặng — nó là **sự mất giá**: hành động tử tế biến thành giao dịch, và cả hai bên đều biết.

3. **Chi phí vật chất thật.** Đồ chua, trà đá, đá đều là mặt hàng có giá và có **hạn dùng** (rau 1 ngày). Cho thêm với 30 khách/ngày × 40 ngày là một khoản thật trong sổ.

**Tham số.**

| Tên | Khởi điểm | Khoảng |
|---|---|---|
| `DIMINISH_RATE` | **0,70** | 0,60–0,82 |
| `diminishWindowDays` | **7** | 5–10 |
| `BRIBE_TRIGGER_N` | **4** | 3–6 |
| `BRIBE_SOI_THRESHOLD` | **0,60** | 0,50–0,75 |
| `bribeIntensityBase` | 0,35 | 0,25–0,50 |
| `freeExtraMaterialCostRatio` | ~2,5% giá vốn một ổ | — |
| `traDaCost` + `traDaTimeMs` | có giá + **1,1s thao tác** | — | Trà đá **cũng tốn thời gian**, nối vào (a) |

**Kịch bản test.**

| Mã | Kịch bản | Kỳ vọng |
|---|---|---|
| **TC-I1** | Bot cho thêm đồ chua **với 100% khách, mọi lượt**, 40 ngày | Tới ngày ≤ **12**, ≥ 3 NPC có `soi` ≥ 0,6 phát `SUSPECT_BRIBE`. `seasonNet` **thấp hơn** baseline (vì chi phí nguyên liệu) |
| **TC-I2** | Bot đưa trà đá cho mọi khách | Thông lượng giờ cao điểm giảm ≥ **12%** → `MADE_THEM_WAIT` tăng. Đánh đổi thật |
| **TC-I3** | Bot cho thêm **đúng lúc, đúng người** (khách ruột, sau một lần làm dở) | `seasonNet` ≥ baseline **và** quan hệ tốt hơn → đây là cách dùng đúng, phải thưởng |

---

#### (j) Tích trữ khi giá đáy

**Cách khai thác chi tiết.**
Giá chợ có pattern học được (thịt đắt thứ 2, rẻ thứ 5 — CANON §13.4). Người chơi mua sạch vào thứ 5, dùng cả tuần.

**Cơ chế bịt — hạn dùng + sức chứa tủ.** (CANON §8j)

| Nguyên liệu | Hạn dùng | Ghi chú |
|---|---|---|
| Pate | **2 ngày** | Mặt hàng đắt nhất → cũng hỏng nhanh nhất. Cố ý |
| Thịt nguội / chả lụa | **3 ngày** | |
| Rau (dưa leo, ngò, hành) | **1 ngày** | Không tích được, chấm hết |
| **Đồ chua** | **Càng ngâm càng ngon: đỉnh ngày 3, chua gắt ngày 7** | Mặt hàng **duy nhất** thưởng cho việc mua trước — một ngoại lệ có chủ ý để bài toán không đơn điệu |
| Bánh mì | Trong ngày | Mua từ lò mỗi sáng |
| Ớt, gia vị, xì dầu | 14+ ngày | Rẻ, không đáng tích |

**Sức chứa:**

| Cấp tủ | Sức chứa | Mở khoá |
|---|---|---|
| Không tủ (thùng xốp + đá) | **28** đơn vị | Bắt đầu |
| Tủ mát nhỏ | **52** | Nâng cấp 1 |
| Tủ mát lớn | **84** | Nâng cấp 2 |

Sức chứa **dùng chung cho mọi mặt hàng cần lạnh** → tích pate thì không còn chỗ cho thịt. Bài toán phân bổ, không phải bài toán trữ.

**Lớp bịt thứ ba — nối vào perception, và đây là chỗ hay:**
Nguyên liệu **gần hết hạn có ngoại hình khác** (P5-02: đổi tint + độ bóng). Dùng chúng sinh ra một `microDefect` `STALE_IN_GREDIENT` (salience 18) — **chạy qua ledger của (g)**. Nghĩa là tích trữ quá tay không bị phạt bằng một dòng chữ "hàng hỏng", mà bị phạt bằng việc **khách bắt đầu nghi ngờ theo pattern**.

**Tham số.**

| Tên | Khởi điểm | Khoảng |
|---|---|---|
| `shelfLife.pate` | 2 ngày | 2–3 |
| `shelfLife.thitNguoi` | 3 | 3–4 |
| `shelfLife.rau` | 1 | cố định |
| `doChuaPeakDay` / `doChuaSourDay` | 3 / 7 | — |
| `fridgeCapacity` | 28 / 52 / 84 | ±20% |
| `priceAmplitude` (biên độ dao động tuần) | **±22%** | 15–30% |
| `staleStimSalience` | 18 | 12–24 |

**Kịch bản test.**

| Mã | Kịch bản | Kỳ vọng |
|---|---|---|
| **TC-J1** | Bot mua tối đa mọi thứ vào ngày rẻ nhất, 40 ngày | Tỉ lệ hao hụt ≥ **26%** giá vốn. `seasonNet` ≤ baseline |
| **TC-J2** | Bot mua đúng nhu cầu ngày, dự báo từ lịch NPC | `seasonNet` ≥ baseline × 1,04 → dự báo cầu **phải** là chiến lược tốt hơn tích trữ |
| **TC-J3** | Bot tích đồ chua từ ngày 1, dùng ở ngày 3 | Được thưởng (đúng thiết kế). Dùng ở ngày 7 → bị phạt |

---

#### (k) Từ chối phục vụ người "soi"

**Cách khai thác chi tiết.**
Nếu từ chối bán là miễn phí, chiến lược tối ưu là lọc khách: chỉ bán cho người `soi` thấp.

**Cơ chế bịt — từ chối tốn kém nặng về mặt xã hội.**

1. Từ chối phát ra **`REFUSED_SERVICE`, salience 85**, và giống `WRONG_NAME`, nó **bỏ qua `gazeFactor`** — vì nó là lời nói, ai đứng gần cũng nghe.
2. **Mọi người ở `FRONT_SIDE` và `QUEUE_2` đều chứng kiến**, không cần gaze.
3. `gossipSeedChance = 0,90` với mutation `--0.40--> "chảnh, không thèm bán"` (cùng họ với `WRONG_NAME` trong CANON §12).
4. `trustCeiling` của người bị từ chối **−18** ngay lập tức (gấp 3 lần một lỗi thường).
5. **Phân biệt với lý do chính đáng:** *hết hàng* không phải *từ chối*. Hết hàng có đường thoại riêng, chỉ phạt nhẹ (`SOLD_OUT`, salience 20) và chỉ khi khách đó là khách ruột (nối vào mục l).

**Tham số.**

| Tên | Khởi điểm | Khoảng |
|---|---|---|
| `REFUSED_SERVICE.salience` | **85** | 75–95 |
| `refuseIgnoresGaze` | **true** | cố định |
| `refuseWitnessZones` | `FRONT_CENTER`, `FRONT_SIDE`, `QUEUE_2` | — |
| `refuseCeilingPenalty` | **18** | 12–24 |
| `refuseGossipSeedChance` | **0,90** | 0,8–1,0 |
| `SOLD_OUT.salience` | 20 | 12–30 |

**Kịch bản test.**

| Mã | Kịch bản | Kỳ vọng |
|---|---|---|
| **TC-K1** | Bot từ chối bà Bảy, chị Lan, thầy Phúc mỗi khi họ tới, 40 ngày | `walkIn`/ngày giảm ≥ **20%** tới ngày 20. `seasonNet` ≤ baseline × 0,88 |
| **TC-K2** | Từ chối 1 lần duy nhất, ngày 5 | Ít nhất **2 NPC khác** nhắc lại chuyện đó trong vòng 4 ngày |
| **TC-K3** | Hết hàng thật (không từ chối) | Phạt **≤ 1/4** so với từ chối. Không sinh tin đồn "chảnh" |

---

#### (l) Đóng cửa sớm

**Cách khai thác chi tiết.**
Đạt mục tiêu tiền hôm nay → dẹp hàng, né rủi ro. Nếu không có chi phí duy trì, "chơi ít" luôn là chiến lược an toàn nhất, và game tự biến thành một bài toán tối thiểu hoá thời gian mở cửa.

**Cơ chế bịt — hai phía.**

1. **Chi phí cố định hằng ngày** (không phụ thuộc bán được bao nhiêu): tiền chỗ phân bổ ngày, than, điện, đá, nước. Đặt ở mức **≈ 38% doanh thu gộp trung vị** → đóng cửa ở 60% ngày là gần như hoà vốn.
2. **Khách đến mà hết hàng / đóng cửa thì mất lòng.** Mỗi NPC có lịch (CANON §13.2). Nếu họ tới mà quầy đóng:
```ts
emit('MISSED_VISIT', { npc, intensity: 0.35 })    // không phải sự kiện trong §3 — là memory nhẹ
npc.visitFrequency *= MISSED_VISIT_FREQ_MUL       // 0.94
// 3 lần liên tiếp -> chuyển sang chú Kiệt theo cùng luật với (d)
```
3. **Không có "đóng cửa sớm" như một nút.** Có "hết hàng" (tự nhiên) và "dọn hàng" (chủ động). Dọn hàng chủ động khi còn khách trong lịch → phạt theo trên.

**Tham số.**

| Tên | Khởi điểm | Khoảng |
|---|---|---|
| `dailyFixedCostRatio` | **0,38** doanh thu gộp trung vị | 0,30–0,45 |
| `MISSED_VISIT.intensity` | 0,35 | 0,25–0,50 |
| `MISSED_VISIT_FREQ_MUL` | **0,94** | 0,90–0,97 |
| `missedVisitsBeforeSwitch` | **3** liên tiếp | 2–4 |
| `closeEarlyAllowed` | true (luôn cho phép) | — | Không chặn hành động, chỉ tính giá |

**Kịch bản test.**

| Mã | Kịch bản | Kỳ vọng |
|---|---|---|
| **TC-L1** | Bot đóng cửa ngay khi `dayNet` ≥ chi phí cố định, 40 ngày | `seasonNet` ≤ baseline × **0,80**. Mất ≥ 3 khách ruột |
| **TC-L2** | Bot mở đủ ngày nhưng hết hàng lúc 7:30, 10 ngày liên tiếp | Chú Tư (khách 6h45) không bị ảnh hưởng; ông Hải (chiều) chuyển sang chú Kiệt |
| **TC-L3** | Bot đóng cửa sớm **1 ngày** vì lý do arc | Phạt nhỏ, hồi lại được. **Không phạt một-lần-là-chết** |

---

### 2.7. Micro-cheat (g) — phát hiện theo PATTERN

> *"Quên 1 hạt trân châu với 100% khách, mỗi ngày, 40 ngày. Từng lần không bị bắt, cộng dồn tiết kiệm to."*
> **CANON §8g: "Đây là lỗ hổng lớn nhất hiện tại."**

#### 2.7.1. Vì sao hệ sự kiện hiện tại **không** bắt được

Hệ perception ở CANON §5 chạy **theo sự kiện đơn lẻ**. Một `microDefect` có `salience < 25`:
```
rate = 18 × 0.95 (HANDS/FRONT_CENTER) × 1.0 × 0.6 (gaze thường) × 1.0 / 100 = 0.103/s
```
→ cần **~9,7 giây** liên tục nhìn để chạm `CONFIRMED`. Nhưng thao tác "bớt một nhúm rau" chỉ tốn **0,5 giây**. `certainty` chạm ~0,05 rồi decay về 0.

**Kết luận: đúng theo thiết kế, một lần micro-cheat là KHÔNG bao giờ bị bắt. Và đúng như vậy mới đúng.**
Vấn đề không nằm ở một lần. Vấn đề nằm ở **lần thứ 200**. Con người không nhận ra bạn bớt rau trong một ổ bánh — con người nhận ra rằng **dạo này bánh nhạt hơn**.

→ Cần một hệ **thứ hai, song song**, chạy **theo pattern trên trục thời gian**, không theo sự kiện.

#### 2.7.2. Định nghĩa `microDefect`

```ts
const MICRO_KINDS = [
  'SKIP_SMALL_VEG',     // bớt/bỏ một loại rau nhỏ (ngò, hành lá)
  'UNDER_PORTION',      // ít hơn định lượng chuẩn nhưng không rỗng
  'SKIP_SAUCE_DASH',    // thiếu một đường sốt
  'SKIP_PEPPER',        // quên muối tiêu
  'THIN_PATE',          // quết pate mỏng
  'ONE_FEWER_CHILI',    // bớt một khoanh ớt
  'STALE_INGREDIENT',   // dùng nguyên liệu gần hết hạn (nối mục j)
] as const

function isMicroDefect(d: Defect, obs: Observation): boolean {
  return d.salience < MICRO_SALIENCE_CAP          // 25
      && obs.state < NOTICED                       // chưa bị bắt tại chỗ
      && MICRO_KINDS.includes(d.kind)
}
```

**Bốn luật công bằng — không đếm là ăn gian khi:**
1. **Người chơi không có hàng.** `inventory[ing] === 0` tại thời điểm đó → "hết hành thiệt", không phải ăn bớt. *(Luật quan trọng nhất. Thiếu nó, người chơi bị phạt vì nghèo.)*
2. **Khách chủ động yêu cầu bớt.** `"cho ít rau"`, `"đừng bỏ ngò"`, `"không hành"` → đó là làm đúng đơn.
3. **Đã bị bắt tại chỗ** (`obs.state >= NOTICED`) → đi đường sự kiện thường, **không** vào ledger. Không phạt hai lần.
4. **Nguyên liệu hỏng đã bị loại đúng cách** → không tính.

#### 2.7.3. Bộ đếm trượt theo NPC

Vòng đệm **12 lượt phục vụ gần nhất của riêng NPC đó**, trọng số giảm dần — gần đây nặng hơn.

```ts
// sim/microLedger.ts
const W = 12
const DECAY = 0.92

type MicroLedger = { ring: (0 | 1)[]; cleanStreak: number }

function microScore(l: MicroLedger): number {
  let s = 0
  for (let i = 0; i < l.ring.length; i++) s += Math.pow(DECAY, i) * l.ring[i]   // i = 0 là mới nhất
  return s
}
// Trần lý thuyết: Σ 0.92^i, i=0..11 = (1 - 0.92^12) / 0.08 = 7.90
```

**Ngưỡng theo tính cách:**

```ts
function threshold(p: Personality): number {
  return TH_BASE + TH_SOI * (1 - p.soi) + TH_DETHA * p.deTha
}
// TH_BASE = 3.2 · TH_SOI = 2.6 · TH_DETHA = 1.4
```

| NPC | soi | deTha | `threshold` | Tỉ lệ ăn gian cần để bị nghi | Đọc ra |
|---|---|---|---|---|---|
| **Chị Lan** | 0,9 | 0,2 | **3,74** | **47%** | Soi và để bụng → nghi sớm nhất |
| **Bà Bảy** | 0,9 | 0,8 | **4,58** | **58%** | Soi nhất hẻm, nhưng dễ tha → cho bạn nhiều cơ hội hơn |
| **Thầy Phúc** | 0,8 | 0,7 | **4,70** | **59%** | NPC dạy người chơi đọc hệ thống |
| **Chú Kiệt** | 0,7 | 0,3 | **4,40** | **56%** | Người duy nhất hiểu nghề của bạn → biết bạn đang làm gì |
| **Cô Mai** | 0,6 | 0,6 | **4,68** | 59% | |
| **Ông Hải** | 0,5 | 0,5 | **5,20** | 66% | |
| **Chị Hạnh** | 0,5 | 0,6 | **5,34** | 68% | |
| **Bà Sáu** | 0,4 | 0,8 | **5,88** | 74% | |
| **Bé Su** | 0,4 | 0,9 | **6,02** | 76% | |
| **Anh Bảo** | 0,3 | 0,8 | **6,14** | 78% | Sandbox — gần như không bao giờ nghi |
| **Anh Dũng** | 0,2 | 0,7 | **6,26** | 79% | |
| **Chú Tư** | 0,3 | 0,9 | **6,28** | 79% | Tin bạn nhất → đau nhất khi cuối cùng cũng nghi |

Bảng này **tự nó là thiết kế nhân vật**: cùng một hành vi ăn gian, mỗi người phát hiện ở một thời điểm khác nhau, và **thứ tự phát hiện khớp đúng với tính cách của họ**.

#### 2.7.4. Ba nấc leo thang

| Nấc | Điều kiện | Cái gì xảy ra | **KHÔNG** xảy ra |
|---|---|---|---|
| **A — Nghi ngờ** | `microScore ≥ threshold` | Phát concept **`SUSPECT_PATTERN`**. Một dòng thoại nghi ngờ. `cooldown` 4 ngày | **Không** trừ quan hệ. **Không** ghi memory tiêu cực. Đây là **cảnh báo** |
| **B — Soi thật** | `microScore ≥ threshold × 1,35` | **`gazeFloor` của NPC đó nâng lên 0,45** trong **5 ngày**, và `specCheckRate` của riêng họ lên **0,85** → họ **nói rõ yêu cầu** ("cho nhiều rau nha") | Vẫn không trừ quan hệ **trực tiếp** |
| **C — Lan ra hẻm** | `globalMicroRate > 0,45` trong **2 ngày liên tiếp** | Gieo tin đồn `ORDER_DEFECT --0.35--> "ăn bớt nguyên liệu"` (CANON §12) từ NPC có `thanThien` cao nhất đã trải nghiệm. `walkIn` −8%/nấc, trần −25%. `specCheckRate` toàn cục 0,15 → 0,45 | Không có màn hình "bạn bị phát hiện". Không có số |

> **Điểm cốt lõi của toàn bộ thiết kế này:**
> **Hình phạt không phải là một con số bị trừ. Hình phạt là họ bắt đầu NHÌN bạn.**
>
> Nấc B nâng `gazeFloor` → micro-cheat **không còn vô hình nữa**: nó quay về chạy qua hệ perception bình thường (CANON §5) và bị bắt bằng chính cơ chế lõi của game. Và nấc B khiến khách **nói rõ yêu cầu** → `microDefect` biến thành `ORDER_DEFECT` thật (**salience 20 tại quầy → 100 lúc ăn**, CANON §3.1).
>
> Không có hệ thống mới nào bị thêm vào. Chỉ có một cái van mở ra.

#### 2.7.5. Đường tha thứ — bắt buộc phải có

Không có đường ra thì đây là cái bẫy, không phải cơ chế.

```ts
onCleanServing(npc) {
  l.cleanStreak++
  if (l.cleanStreak >= FORGIVE_STREAK) {          // 4
    l.ring.fill(0)                                 // xoá sạch vòng đệm
    l.cleanStreak = 0
    if (npc.suspicionStage > 0) {
      npc.suspicionStage--
      emit('SUSPICION_EASED', { npc })             // thoại: "Ờ, bữa nay ngon nè con."
    }
  }
}
```
- **4 lượt phục vụ sạch liên tiếp** với NPC đó → xoá vòng đệm, hạ một nấc.
- Vòng đệm còn tự trôi: dừng ăn gian thì sau 12 lượt, `microScore` về 0 dù không đạt streak.
- `gazeFloor` nấc B hết sau 5 ngày **nếu không tái phạm**.
- Nấc C: `walkIn` hồi **+3%/ngày** khi `globalMicroRate < 0,15`.

#### 2.7.6. Thoại — đúng người, đúng giọng

Dòng gốc của CANON §8g: *"ê, dạo này bánh nhạt hơn hay tại tao?"* Viết lại theo giọng từng nhân vật (CANON §9), **không dùng chung một câu cho 12 người**:

| NPC | Dòng nấc A |
|---|---|
| **Bà Bảy** | *"Ủa, bữa nay bánh nhạt nhạt sao á con. Hay tại cô già rồi ăn hổng ra vị."* |
| **Chú Tư** | *"Dạo này ổ bánh nhẹ tay hơn hả con? Hay tại chú ăn quen rồi."* |
| **Thầy Phúc** | *"Thầy thấy dạo này con bỏ rau ít hơn hồi trước. Không sao, thầy hỏi vậy thôi."* |
| **Chị Lan** | *(không nói gì — mở ổ bánh ra nhìn hai giây, gói lại, đi)* — pose `look_at_hands` → `turn_to_leave` |
| **Ông Hải** | *"Ê nhỏ, bánh bữa nay sao á. Hay tao say?"* |
| **Bé Su** | *"Ủa chị, sao bữa nay ít rau hơn hôm bữa em quay clip ta?"* |
| **Chú Kiệt** | *"Tao biết mày đang làm gì. Tao làm rồi."* |
| **Cô Mai** | *"Bán buôn thì ai cũng phải tính, chị hiểu. Mà khách người ta cũng tính đó em."* |
| **Anh Dũng** | *"Ủa bữa nay ổ này nhỏ hơn hả em? Thôi kệ, anh gấp."* |
| **Bà Sáu** | *"Tui bán tàu hũ tui biết. Bữa nào mệt là bữa đó tay mình nó tự bớt."* |
| **Chị Hạnh** | *"Em ơi, hôm nay bánh hơi ít nhân so với mọi hôm nhỉ?"* |
| **Anh Bảo** | *(ngẩng lên khỏi điện thoại 1 giây)* *"...ủa."* → cúi xuống tiếp |

**Chị Lan không nói gì là dòng đắt nhất trong bảng.** Nó là hiện thân của "người im lặng biến mất" (CANON §9 #4) và của luật CANON §11 (*~35% số lần nhận thấy không nói gì cả*).

#### 2.7.7. Tham số (g)

| Tên | Khởi điểm | Khoảng | Cách đo |
|---|---|---|---|
| `MICRO_SALIENCE_CAP` | **25** | 20–30 | Trên ngưỡng này thì đi đường sự kiện thường |
| `W` (cửa sổ vòng đệm) | **12** lượt | 8–16 | Ngắn quá → bắt oan; dài quá → bắt quá muộn |
| `DECAY` | **0,92** | 0,86–0,96 | Trần = `(1−DECAY^W)/(1−DECAY)` |
| `TH_BASE` | **3,2** | 2,6–4,0 | |
| `TH_SOI` | **2,6** | 2,0–3,2 | |
| `TH_DETHA` | **1,4** | 1,0–2,0 | |
| `STAGE_B_MUL` | **1,35** | 1,20–1,55 | |
| `gazeFloorStageB` | **0,45** | 0,35–0,60 | |
| `stageBDays` | **5** | 3–8 | |
| `specCheckRateStageB` | **0,85** | 0,70–1,00 | |
| `GLOBAL_MICRO_WINDOW` | **20** lượt | 15–30 | |
| `GLOBAL_MICRO_THRESHOLD` | **0,45** | 0,35–0,55 | |
| `globalStageDaysRequired` | **2** liên tiếp | 1–3 | |
| `walkInPenaltyPerStage` | **−8%** | −5…−12% | |
| `walkInPenaltyCap` | **−25%** | −18…−32% | |
| `specCheckRateGlobal` | 0,15 → **0,45** | — | |
| `FORGIVE_STREAK` | **4** | 3–6 | Phải tồn tại. Không được bỏ |
| `suspectCooldownDays` | **4** | 3–7 | Chống lặp thoại |
| `walkInRecoveryPerDay` | +3% | 2–5% | |

**Giá trị khởi điểm của (g) được tune SAU CÙNG** (§2.8 bước 9) — vì nó phụ thuộc vào mọi thứ khác.

#### 2.7.8. Kịch bản test (g)

| Mã | Kịch bản | Kỳ vọng |
|---|---|---|
| **TC-G1** | Bot bớt **đúng một** nhúm hành lá với **100% khách**, mọi lượt, 40 ngày | Chị Lan nghi (nấc A) ở **ngày ≤ 6**. Bà Bảy ở **ngày ≤ 8**. Chú Tư ở **ngày ≤ 12**. Nấc C kích hoạt **ngày ≤ 10** |
| **TC-G2** | Bot ăn gian **50%** số lượt, ngẫu nhiên | Chị Lan nghi (47% < 50%); anh Bảo/chú Tư **không** nghi. Đúng bảng §2.7.3 |
| **TC-G3** | Bot ăn gian **40%** số lượt | **Không NPC nào** chạm nấc A trong 40 ngày. (Đây là "ăn gian trong giới hạn chấp nhận được" — phải tồn tại, nếu không thì hệ thống là một cái bẫy) |
| **TC-G4** | **Fairness**: bot hết hành lá thật 15 ngày liên tiếp (không mua được) | **`microScore` = 0 với mọi NPC.** Không ai nghi. *Test quan trọng nhất của mục này* |
| **TC-G5** | **Fairness**: khách nói *"đừng bỏ ngò"*, bot làm đúng, 40 ngày | `microScore` = 0 |
| **TC-G6** | **Tha thứ**: bot ăn gian tới nấc B với bà Bảy, rồi phục vụ sạch 4 lượt | `microScore` về 0, nấc hạ xuống A, có thoại `SUSPICION_EASED`. `gazeFloor` trở lại bình thường sau ≤ 5 ngày |
| **TC-G7** | **Leo thang đúng cách**: bot tiếp tục ăn gian sau khi đạt nấc B | `microDefect` bây giờ bị bắt bằng hệ perception thường (`gazeFloor` 0,45) → chuyển thành `ORDER_DEFECT` có `CONFIRMED`. Số lần bị bắt tại chỗ tăng ≥ **4×** |
| **TC-G8** | **Không phạt hai lần**: bot bị bắt tại chỗ (`CONFIRMED`) một lỗi nhỏ | Lỗi đó **không** vào ledger |
| **TC-G9** | **Kinh tế**: so `seasonNet` của bot ăn gian 100% vs baseline | Ăn gian 100% phải **THẤP HƠN** baseline (tiết kiệm nguyên liệu < mất khách + mất walkIn) |
| **TC-G10** | **Đọc được**: 10 người chơi thật, bot-script ăn gian trong 10 ngày, hỏi *"có chuyện gì đang xảy ra với hàng của bạn?"* | **≥ 7/10** nói được ý "khách bắt đầu nghi/soi mình" mà **không** cần bất kỳ con số nào |

**TC-G9 là tiêu chí cứng.** Nếu ăn gian 100% vẫn có lợi về tiền thì toàn bộ mục này chưa xong, bất kể thoại hay tới đâu.

---

### 2.8. Quy trình cân bằng

#### 2.8.1. Đo cái gì

Telemetry **cục bộ** (CANON §2: client-only, không server). Dev build ghi CSV vào `./telemetry/<seed>_<date>.csv`, một hàng mỗi ngày + một hàng mỗi lượt phục vụ. **Build phát hành không ghi gì.**

| # | Metric | Đơn vị | Mục tiêu khởi điểm |
|---|---|---|---|
| 1 | `realMinutesPerDay` | phút thật | **7,0** (khoảng 5,5–9,0) |
| 2 | `seasonRealHours` | giờ | **≥ 4,0** (idea §23 tuần 1–2) |
| 3 | `customersServedPerDay` | người | theo §2.14 |
| 4 | `defectsPerServing` | lỗi/ổ | 0,25–0,55 |
| 5 | `microDefectsPerServing` | lỗi/ổ | < 0,15 với người chơi trung thực |
| 6 | `confirmedNegativePerDay` | lần | **1,2–2,6** |
| 7 | `confirmedPositivePerDay` | lần | **≥ `confirmedNegativePerDay`** (CANON §9.7 / bẫy Phần I §3) |
| 8 | `avgWaitSeconds` | giây | 12–26 |
| 9 | `undosPerServing` | lần | 0,4–1,8 |
| 10 | `attentionToolUsesPerDay` | lần | **≥ 2,0** — nếu 0 thì người chơi không biết công cụ tồn tại (CANON §5.4) |
| 11 | `dayNet` | tiền | xem §2.10 |
| 12 | `cashEndOfDay` | tiền | không bao giờ âm ≥ 3 ngày liên tiếp |
| 13 | `regularsLostPermanently` | người | ≤ 2 trong 40 ngày với người chơi trung bình |
| 14 | `gossipHopsPerDay` | lần | 0,5–2,0 |
| 15 | `overheardEventsPerDay` | lần | **≥ 1,0** — nghe lỏm là điều kiện tồn tại của tin đồn (CANON §12.4) |
| 16 | `decisionsPerMinute` | quyết định có đánh đổi | **≥ 0,7** (§2.12) |
| 17 | `deadTimeRatio` | % | **< 8%** |
| 18 | `inputsPerMinute` | thao tác | **≤ 28** |
| 19 | `peakStressRatio` | % thời lượng ngày | **≤ 22%** |
| 20 | `musicPlayingRatio` | % | 52–65% (P5-03 §6.5) |

#### 2.8.2. Tune theo thứ tự nào — nghiêm ngặt

Mỗi tầng đứng trên tầng dưới. Tune tầng trên trước khi tầng dưới ổn định là **vứt công đi làm lại**.

| Bước | Tune cái gì | Vì sao ở vị trí này | Chốt khi |
|---|---|---|---|
| **1** | **Thời lượng một ngày** (phút thật) | *"Nếu bạn chưa đo, bạn chưa thiết kế"* (idea §23 tuần 1–2). Mọi thứ khác tính theo đơn vị này | `realMinutesPerDay` trong 5,5–9,0 **và** `seasonRealHours` ≥ 4,0 |
| **2** | **Thông lượng**: tốc độ thao tác, số tay, thời gian lò, tốc độ khách tới | Quyết định "một ngày cảm thấy như thế nào" | `customersServedPerDay` khớp §2.14 ±10% |
| **3** | **Perception**: `visibility`, `gazeFactor`, `salience`, `decayRate` | Phải khớp **hai hiệu chỉnh kiểm tra của CANON §5** | `DROPPED_FOOD` + nhìn thẳng → `CONFIRMED` sau **~1,4s**; cùng sự kiện + gaze 0,05 → **~28s** |
| **4** | **Kiên nhẫn**: `patienceDrainRate`, ngưỡng `MADE_THEM_WAIT` | Đứng trên (2) và (3) | Ngưỡng phạt ở **40**, không phải 80 (§2.13) |
| **5** | **Kinh tế**: giá chợ, giá bán, chi phí cố định, hạn dùng, sức chứa | Đứng trên (2): doanh thu = khách × ticket | `dayNet` dương ở ≥ 90% ngày khi chơi tối thiểu (§2.12) |
| **6** | **Trí nhớ + quan hệ**: decay, sàn bucket, `trustCeiling` | Đứng trên (3): memory ghi từ `CONFIRMED` | `regularsLostPermanently` ≤ 2 |
| **7** | **Đồn thổi**: `tellChance`, `mutation_rate`, `hopCap`, `goodNewsSpreadMul` | Đứng trên (6) | `gossipHopsPerDay` 0,5–2,0; `overheardEventsPerDay` ≥ 1,0 |
| **8** | **Đường cong 40 ngày** (§2.14) | Đứng trên tất cả | Không có 3 ngày NẶNG liên tiếp; `hardScore` giảm ≥ 5 lần |
| **9** | **Ngưỡng micro-cheat (g)** | **Cuối cùng.** Phụ thuộc vào thông lượng, perception, kinh tế và đường cong | TC-G1…G10 pass |

#### 2.8.3. Dừng khi nào

Điều kiện dừng cho **mỗi bước** (thoả **một trong hai**):

1. **Hội tụ:** 3 vòng tune liên tiếp không đổi được metric mục tiêu quá **±5%**.
2. **Đạt và ổn định:** metric nằm trong khoảng mục tiêu ở **3 phiên playtest liên tiếp với 3 người khác nhau**.

Điều kiện dừng cho **toàn bộ quá trình**:
- Mọi metric §2.8.1 nằm trong khoảng.
- Mọi test `TC-*` pass.
- Playtest vòng 3 pass (§6.3).

**Luật chống tune vô hạn:** mỗi lần tune chỉ được đổi **≤ 3 tham số**, và phải ghi vào `docs/phu-luc/tune-log.md`: ngày, tham số, giá trị cũ → mới, lý do, metric quan sát sau đó. **Không ghi log thì không được tune.**

**Luật ưu tiên:** khi một thay đổi cải thiện metric nhưng làm **người chơi thật đọc kém đi** (tiêu chí ≥7/10 của §6.3), **người thật thắng**. Số liệu phục vụ trải nghiệm, không ngược lại.

---

### 2.9. Bảng mọi tham số tune được

*(Bảng tổng hợp; giá trị chi tiết của từng lỗ hổng nằm ở mục tương ứng §2.1–2.7)*

| Nhóm | Tham số | Khởi điểm | Khoảng an toàn | Ảnh hưởng chính |
|---|---|---|---|---|
| **Thời gian** | `realMinutesPerDay` | 7,0 | 5,5–9,0 | Tổng thời lượng game |
| | `dayStartHour` / `dayEndHour` | 5:30 / 10:30 (+ ca chiều) | — | Khung giờ (P5-02 §2.1) |
| | `peakStart` / `peakEnd` | 6:30 / 8:00 | cố định (CANON §13.3) | Thông lượng |
| **Thông lượng** | `placeDurationMs` | 450–600 | 350–750 | Cảm giác tay + cửa sổ (a) |
| | `bakeTimeSec` | 55 | 40–80 | Lò là nút cổ chai |
| | `ovenSlots` | 1 | cố định (CANON §13.3) | |
| | `maxConcurrentCustomers` | 3 | 1–4 | Cũng là công tắc trợ năng |
| | `arrivalIntervalPeak` | 22s | 15–35s | |
| **Perception** | `salience.*` | CANON §3 | ±10% | **Đổi phải sửa CANON** |
| | `visibility[slot][zone]` | CANON §5 | ±0,05 | **Đổi phải sửa CANON** |
| | `gazeFactorPhone` | 0,05 | cố định | (a) |
| | `gazeFactorNormal` | 0,60 | 0,45–0,75 | |
| | `decayRate` | 0,18/s | 0,10–0,26 | (a) |
| | `traitMulSoi` | `0,7 + 0,6·soi` | — | CANON §4 |
| | `dirtyStallTraitBonus` | +0,05/nấc bẩn | 0,03–0,10 | `STALL_CLEANLINESS` |
| **Kiên nhẫn** | `patienceMax` | 100 | — | |
| | `patienceDrainRate` | 1,0/s | 0,7–1,4 | |
| | `patiencePenaltyThreshold` | **40** | **35–45** | **§2.13 — không phải 80** |
| | `patienceQueueMul` | 1,25/người chờ | 1,1–1,5 | |
| **Kinh tế** | `dailyFixedCostRatio` | 0,38 | 0,30–0,45 | (l) |
| | `priceAmplitude` | ±22% | 15–30% | (j) |
| | `fridgeCapacity` | 28/52/84 | ±20% | (j) |
| | `shelfLife.*` | CANON §13.1 | cố định | (j) |
| | `tipBase` / `tipMax` | 4% / 14% | — | §2.13 |
| | `supplierLoyaltyDiscount` | 10% sau 7 ngày mua đều | 5–15% | Lối chơi L3 |
| **Quan hệ** | `CEILING_PENALTY_BASE` | 6,0 | 4–9 | (d) |
| | `TRUST_CEILING_FLOOR` | 35 | 30–45 | (d) |
| | `grudgeDecayPerDay` | 2,0 / 1,2 / 0,6 | — | CANON §12 tapering |
| | `memoryStackMul` | 0,75^(n−1) | cố định | CANON §12 |
| | `shortTermSlots` / `longTermSlots` | 7 / 4 | 6–8 / 3–4 | CANON §12 |
| **Đồn thổi** | `tellChanceBase` | 0,25 | 0,15–0,35 | (b) |
| | `confidencePerHop` | 0,78 | 0,70–0,85 | CANON §12.3 |
| | `hopCap` | 2 | 2–3 | CANON §12.2 |
| | `goodNewsSpreadMul` | 1,35 | 1,2–1,6 | CANON §12.5 |
| | `gossipUnlock` | **hết ngày 6** hoặc 2h chơi, cái nào tới trước | — | **§9 C1** |
| **Nhớ nhầm** | `favorBiasSoiMul` | −0,45 | −0,35…−0,55 | (h) |
| | `falsePositiveIntensityMul` | 0,60 | 0,45–0,75 | (h) |
| **Micro-cheat** | Toàn bộ bảng §2.7.7 | | | (g) |
| **Đường cong** | `baseCustomers(day)` | §2.14 | ±10% | |
| | `soiShare(day)` | §2.14 | ±0,05 | |
| | `hardScore` ngưỡng | 0,35 / 0,62 | — | §2.14 |
| **Chill** | `decisionsPerMinute` sàn | 0,7 | 0,6–1,0 | §2.12 |
| | `deadTimeRatio` trần | 8% | 5–12% | §2.12 |
| | `selfImposedLoadRatio` sàn | 0,70 | 0,60–0,80 | §2.12 |
| | `greedCeilingRatio` sàn | 2,6× | 2,2–3,2× | §2.12 |

---

### 2.10. Ba lối chơi phải đều đi được

**Yêu cầu:** không có dominant strategy. Ba lối chơi đều hoàn thành được 40 ngày, chênh nhau **≤ 15%** về kết quả kinh tế, và mỗi lối **thắng rõ ràng ở ít nhất một loại ngày**.

#### 2.10.1. Ba hồ sơ

| | **L1 — Cẩu thả nhưng nhanh** | **L2 — Kỹ nhưng chậm** | **L3 — Tối ưu quan hệ** |
|---|---|---|---|
| Triết lý | Bán số lượng. Lỗi nhỏ chấp nhận được | Không bao giờ sai. Phục vụ ít người, phục vụ đúng | Ít người hơn L1, nhưng họ **quay lại và kể cho người khác** |
| Khách phục vụ/ngày (giữa mùa) | **30** | **21** | **25** |
| Giá trị đơn trung bình (chỉ số) | 1,00 | **1,10** | 1,05 |
| Tip | 3% | **11%** | 8% |
| Hao hụt nguyên liệu | 4% | **9%** (mua dư để không thiếu) | **3%** (nhà cung cấp cho đặt lẻ) |
| Giá vốn / doanh thu | 52% | 58% | **49%** (giảm 10% nhờ quan hệ nhà cung cấp) |
| Chi khuyến khích (`FREE_EXTRA`, trà đá) | 0% | 1% | **3%** |
| `microDefectsPerServing` | 0,35 | **0,02** | 0,08 |
| **Chỉ số `seasonNet`** | **1,05** | **1,00** | **1,10** |

Chênh lệch max/min = **1,10 / 1,00 = 1,10 → 10%**, dưới trần 15%. *(Đây là **mục tiêu thiết kế**; giá trị thật do playtest vòng 2 xác nhận.)*

#### 2.10.2. Mỗi lối bị chặn bởi cái gì (chứng minh không có dominant)

| Lối | Bị chặn bởi | Cơ chế | Mục |
|---|---|---|---|
| **L1** | Micro-cheat bị phát hiện theo pattern | `microScore` → nấc B → `gazeFloor` 0,45 → lỗi thành `ORDER_DEFECT` thật | (g) |
| | Tin đồn từ người dễ tính | `tellChance` theo `thanThien`, không theo `deTha` | (b) |
| | Quầy bẩn vì làm nhanh | `STALL_CLEANLINESS` → `traitMul` mọi khách + **giảm số khách ngày sau** | CANON §3.3 |
| | Khách ruột mất là mất thật | Không có respawn quan hệ | CANON §13 |
| **L2** | Chi phí cố định hằng ngày | 38% doanh thu gộp trung vị — phục vụ ít vẫn phải trả đủ | (l) |
| | `MADE_THEM_WAIT` salience **100** | Cao nhất cùng `WRONG_NAME`. Chậm là lỗi nặng nhất trong game | CANON §3.1 |
| | Hao hụt | Mua dư để "không bao giờ thiếu" → rau 1 ngày, pate 2 ngày | (j) |
| | Giờ cao điểm là lúc có tiền | 6:30–8:00, 1 lò, 2 tay. Bỏ cao điểm = bỏ phần lớn doanh thu | CANON §13.3 |
| **L3** | Diminishing returns | `0,70^(n−1)`, và `SUSPECT_BRIBE` khi n ≥ 4 với người soi | (i) |
| | Cho thêm tốn tiền thật | 3% doanh thu | (i) |
| | Quan hệ không trả tiền thuê chỗ | Nghĩa vụ định kỳ đến đúng hạn, bất kể ai thương mình | CANON §13 |
| | Đưa trà đá tốn thời gian | 1,1s/lần → giảm thông lượng giờ cao điểm ≥ 12% | (i) TC-I2 |

#### 2.10.3. Mỗi lối thắng ở đâu

| Loại ngày | Lối thắng | Vì sao |
|---|---|---|
| Ngày khách đông, ít người `soi` (§2.14 loại "VỪA-đông") | **L1** | Thông lượng là tất cả; rủi ro phát hiện thấp |
| **Ngày mưa** (khách −40%) | **L2** | Ít khách → thời gian dư → làm kỹ, tip cao bù lượng |
| **Ngày có nghĩa vụ đến hạn** | **L3** | Cô Mai cho nợ, nhà cung cấp cho khất — chỉ khi có quan hệ |
| **Ngày giá chợ tăng đột biến** (dịch heo) | **L3** | Giảm 10% từ nhà cung cấp thân là chênh lệch quyết định |
| **Ngày đầu mùa (1–8)** | **L2** | Chưa có quan hệ, chưa có danh tiếng → làm đúng là chiến lược duy nhất |
| **Ngày cuối mùa (33–40)** | **L1 hoặc L3** | L1 vì hệ quả không kịp phát tác; L3 vì thu hoạch cả mùa gieo |

> **Kết luận thiết kế:** chiến lược tối ưu thật sự là **đổi lối chơi theo loại ngày**. Đó chính là kỹ năng mà game muốn dạy — và nó không đọc được từ spreadsheet, vì nó phụ thuộc vào **bạn đã xây được quan hệ với ai**.

#### 2.10.4. Test

| Mã | Kịch bản | Kỳ vọng |
|---|---|---|
| **TC-S1** | 3 bot L1 / L2 / L3 chạy 40 ngày × 20 seed | `max(seasonNet) / min(seasonNet)` ≤ **1,15** |
| **TC-S2** | Cùng dữ liệu, đếm số loại ngày mà mỗi lối thắng | Mỗi lối thắng ở **≥ 1** loại ngày |
| **TC-S3** | Bot "hỗn hợp" đổi lối theo loại ngày | `seasonNet` ≥ **1,12 ×** lối đơn tốt nhất → kỹ năng có giá trị |
| **TC-S4** | So **kết thúc** của 3 lối | Khác nhau về **ai còn ở lại**, **không** khác nhau về "điểm". Mọi kết đều tử tế (CANON §15) |
| **TC-S5** | Chạy L1/L2/L3 ở `KHONG_GIOI_HAN` (P5-01) | Tỉ lệ vẫn ≤ 1,15 → chế độ trợ năng **không** tạo dominant strategy |

---

### 2.11. Đường cong khó theo 40 ngày

#### 2.11.1. Luật hình dạng

> **Không được dốc lên đều.** Dốc đều = grind. Phải có nhịp nghỉ.

```ts
// tools/validateCurve.ts — chạy trong CI
hardScore(d) = 0.40*norm(customers[d])
             + 0.30*soiShare[d]
             + 0.30*(obligationDue[d] ? 1 : 0)
             + 0.20*(majorEvent[d] ? 1 : 0)

dayType(d) = hardScore < 0.35 ? 'NHẸ' : hardScore <= 0.62 ? 'VỪA' : 'NẶNG'
```

| # | Luật | Kiểm |
|---|---|---|
| **V1** | Không bao giờ có **3 ngày NẶNG liên tiếp** | assert |
| **V2** | Mỗi block 5 ngày có **≥ 1 ngày NHẸ** | assert |
| **V3** | Sau mỗi ngày NẶNG, trong vòng **2 ngày** phải có 1 ngày NHẸ hoặc VỪA-thấp (`hardScore < 0,45`) | assert |
| **V4** | `hardScore` phải **giảm ≥ 5 lần** trong 40 ngày, mỗi lần biên độ **≥ 0,18** → đường răng cưa, không phải dốc | assert |
| **V5** | `hardScore` trung bình của 10 ngày cuối **≤ 1,45×** của 10 ngày đầu → không leo thang vô hạn | assert |
| **V6** | **Ngày 40 không phải ngày khó nhất.** Ngày khó nhất là **ngày 30** | assert |
| **V7** | Mưa (−40% khách) **luôn** rơi vào hoặc ngay sau một cụm ngày nặng | kiểm tay |
| **V8** | Không có 2 nghĩa vụ đến hạn cùng ngày, **trừ ngày 30** (cố ý — đỉnh của mùa) | assert |

#### 2.11.2. Bảng 40 ngày

`%soi` = tỉ lệ khách có `soi ≥ 0,6` · `Loại`: N = Nhẹ, V = Vừa, **Ng** = Nặng

| Ngày | Thứ | Thời tiết | Khách | %soi | Sự kiện / arc | Nghĩa vụ | Loại |
|---|---|---|---|---|---|---|---|
| 1 | T2 | Khô | 13 | 0,20 | Mở hàng. Cô Ba đứng cùng. Chỉ 3 NPC | — | **N** |
| 2 | T3 | Khô | 14 | 0,22 | Anh Dũng lần đầu (dạy `MADE_THEM_WAIT`) | — | **N** |
| 3 | T4 | Khô | 15 | 0,25 | Bà Bảy kể chuyện cải lương → memory slot đầu tiên | — | **N** |
| 4 | T5 | Khô | 16 | 0,28 | Chị Lan lần đầu (không nói gì) | — | **V** |
| 5 | T6 | Khô | 18 | 0,30 | Chú Kiệt dựng xe bên kia hẻm | — | **V** |
| 6 | T7 | **Mưa** | 11 | 0,28 | Cô Ba đứng quầy 10 phút (dạy `gazeFactor`) | — | **N** |
| 7 | CN | Khô | 15 | 0,25 | Bé Su. **Đồn thổi mở khoá từ đây** | — | **N** |
| 8 | T2 | Khô | 19 | 0,32 | Nghe lỏm lần đầu ở góc hẻm | — | **V** |
| 9 | T3 | Khô | 20 | 0,33 | Cô Mai: đổi tiền lẻ + mở sổ nợ | — | **V** |
| 10 | T4 | Khô | 21 | 0,36 | Thầy Phúc lần đầu | **Tiền chỗ 1** | **Ng** |
| 11 | T5 | Khô | 19 | 0,33 | Bà Sáu gánh tàu hũ đi ngang | — | **V** |
| 12 | T6 | Khô | 22 | 0,35 | Ông Hải buổi chiều lần đầu | — | **V** |
| 13 | T7 | **Mưa** | 13 | 0,30 | Che dù cho khách (`CARED_FOR_THEM`) | — | **N** |
| 14 | CN | Khô | 17 | 0,30 | Ngày nhẹ. Cô Ba nấu cơm | — | **N** |
| 15 | T2 | Khô | 23 | 0,38 | Chị Hạnh lần đầu (gọi món bằng từ Bắc) | **Tiền hụi 1** | **Ng** |
| 16 | T3 | Khô | 24 | 0,40 | **Dịch heo bắt đầu — pate +40% trong 5 ngày** | — | **Ng** |
| 17 | T4 | Khô | 24 | 0,40 | Chú Kiệt hạ giá | — | **V** |
| 18 | T5 | **Mưa** | 14 | 0,36 | Giữa dịch heo + mưa | — | **V** |
| 19 | T6 | Khô | 25 | 0,42 | Anh Dũng đổi ca đêm (arc) | — | **Ng** |
| 20 | T7 | Khô | 23 | 0,40 | Hết dịch heo | **Tiền chỗ 2** | **Ng** |
| 21 | CN | Khô | 18 | 0,32 | **Khách tự đứng bán hộ** (sự kiện hay nhất, idea §19.2) | — | **N** |
| 22 | T2 | Khô | 26 | 0,42 | Bé Su quay TikTok → `walkIn` + | — | **V** |
| 23 | T3 | Khô | 27 | 0,43 | Bà Sáu đổi câu định vị nhà (nếu đủ danh tiếng) | — | **V** |
| 24 | T4 | **Mưa** | 16 | 0,38 | Nhịp nghỉ giữa Act 2 | — | **N** |
| 25 | T5 | Khô | 27 | 0,44 | Chị Lan có nguy cơ biến mất im lặng | **Tiền học** | **Ng** |
| 26 | T6 | Khô | 28 | 0,45 | **Chú Tư báo trước: công ty sắp dời** | — | **V** |
| 27 | T7 | Khô | 25 | 0,42 | Chú Tư nhắc lại | — | **V** |
| 28 | CN | Khô | 20 | 0,35 | Ngày nhẹ trước cơn bão | — | **N** |
| 29 | T2 | Khô | 29 | 0,45 | Chú Tư ngày gần cuối | — | **V** |
| 30 | T3 | Khô | 30 | **0,48** | **CHÚ TƯ BIẾN MẤT** | **Tiền chỗ 3 + Tiền hụi 2** | **Ng** (đỉnh mùa) |
| 31 | T4 | **Mưa** | 17 | 0,38 | **Nhịp nghỉ bắt buộc ngay sau đỉnh** | — | **N** |
| 32 | T5 | Khô | 26 | 0,42 | Cô Ba hỏi thăm | — | **V** |
| 33 | T6 | Khô | 28 | 0,44 | (Tuỳ chọn) tiền thuốc cô Ba | *(tuỳ chọn)* | **V** |
| 34 | T7 | Khô | 27 | 0,43 | **Chú Kiệt bị bắt quả tang gian dối vệ sinh** (XĐ1.5) | — | **V** |
| 35 | CN | Khô | 21 | 0,35 | Ngày nhẹ | — | **N** |
| 36 | T2 | Khô | 29 | 0,44 | Cô Ba nói chuyện tương lai cái xe | — | **V** |
| 37 | T3 | **Mưa** | 18 | 0,38 | Nhịp nghỉ cuối | — | **N** |
| 38 | T4 | Khô | 30 | 0,42 | Khách ruột quay lại đông | — | **V** |
| 39 | T5 | Khô | 29 | 0,40 | Ngày chuẩn bị | — | **V** |
| 40 | T6 | Khô | 28 | **0,34** | **Cú quay lại ngày 40 — kết mùa** | **Tiền chỗ 4** | **V** |

**Đọc đường cong:**
- **Act 1 (1–10):** học luật. Khách 13 → 21. Đỉnh nhỏ ở ngày 10.
- **Act 2 (11–25):** áp lực chồng lớp. Hai đỉnh (15–16, 19–20), hai nhịp nghỉ (13–14, 21, 24). Dịch heo là bài toán kinh tế 5 ngày.
- **Act 3 (26–40):** đỉnh ở **ngày 30** (mất chú Tư + hai nghĩa vụ cùng ngày) rồi **thả dốc**. Ngày 40 có `%soi` **thấp nhất từ ngày 15** và không có sự kiện áp lực mới — cố ý: **ngày cuối phải là ngày để nhìn lại, không phải ngày để chịu đựng.**
- **6 ngày mưa** (6, 13, 18, 24, 31, 37) rải đều, **mỗi ngày mưa đều đứng ngay sau hoặc trong một cụm nặng** (V7).
- **Nghĩa vụ** ở ngày 10, 15, 20, 25, 30(×2), 40 — nhịp 5 ngày, dồn ở ngày 30.

#### 2.11.3. Test

| Mã | Kịch bản | Kỳ vọng |
|---|---|---|
| **TC-N1** | Chạy `validateCurve()` trên bảng §2.11.2 | V1–V8 đều pass |
| **TC-N2** | Bot baseline chạy 40 ngày | Không có 3 ngày liên tiếp `cashEndOfDay` âm |
| **TC-N3** | Đồ thị `hardScore(d)` | Ít nhất 5 đáy có biên độ ≥ 0,18; đỉnh toàn cục ở **d30** |
| **TC-N4** | Hỏi playtester sau 40 ngày: *"có lúc nào bạn thấy mệt mà không thấy vui không?"* | ≤ 3/10 nói có, và không ai chỉ vào cùng một đoạn |

---

### 2.12. Chill ≠ buồn ngủ, và chill ≠ không có áp lực

Hai câu này kéo về hai phía ngược nhau. Cân bằng game này **chính là** giữ được cả hai cùng lúc.

#### 2.12.1. "Chill ≠ buồn ngủ"

> idea.md Phần I §2 mục 1: **"Nhầm 'thư giãn' với 'lê thê'. There's a fine line between calm and boring."**

| Tiêu chí đo được | Định nghĩa vận hành | Mục tiêu | Nếu trượt |
|---|---|---|---|
| **`decisionsPerMinute`** | Số **quyết định có đánh đổi** (chọn A thì mất B) mà người chơi thực hiện | **≥ 0,7** (≥ 1 mỗi 90 giây) | Thêm ràng buộc, **không** thêm tốc độ |
| **`deadTimeRatio`** | % thời lượng ngày mà người chơi **không có gì để làm** và **không có gì đáng nhìn** | **< 8%** | Lấp bằng **quan sát** (khách nói chuyện với nhau, nghe lỏm), không bằng minigame |
| **`maxDeadStretchSec`** | Khoảng chết liên tục dài nhất | **≤ 12s** | |
| **`observableEventsPerMinute`** | Số thứ **đáng nhìn** (ai đó đến, ai đó nhìn bạn, ai đó nói chuyện với nhau) | ≥ 1,2 | |
| **`inputsPerMinute`** | Số thao tác | **≤ 28** | Trên 28 thì đây là action game, không phải chill |

**Định nghĩa "quyết định có đánh đổi"** — đếm những thứ này, **không** đếm click điều hướng:
đặt nguyên liệu nào trước · phục vụ ai trước · dùng công cụ hạ attention nào · nướng lại hay đưa nguội · dùng pate gần hết hạn hay bỏ · cho thêm hay không · đưa trà đá hay làm nhanh · đứng bên trái hay bên phải xe · mua bao nhiêu ở chợ · trả nghĩa vụ hay để trễ · ghi sổ nợ hay đòi tiền mặt.

#### 2.12.2. "Chill ≠ không có áp lực"

> Minh: **"Chill không phải là 'không có áp lực', chill là 'áp lực do mình tự tạo ra vì tham'."** (idea §22.3)

Điều này chuyển thành **hai bất đẳng thức**, và chúng là tiêu chí cân bằng quan trọng nhất của cả tài liệu:

**BĐT 1 — sàn phải an toàn.**
```
minimumViableDay:  chơi ở mức TỐI THIỂU
  (chỉ phục vụ khách theo lịch, làm đúng đơn, không nâng cấp, không mạo hiểm)
  => dayNet >= 1.08 * dailyFixedCost   ở >= 90% số ngày
```
Đây là ranh giới tách **cozy** khỏi **bẫy mobile đội lốt cozy** (idea Phần I §2 mục 4). Nếu chơi tối thiểu mà lỗ, áp lực không còn là "do mình tham" — nó là do hệ thống ép.

**BĐT 2 — trần phải đáng thèm.**
```
greedCeilingRatio = seasonNet(chơi tối ưu, mạo hiểm) / seasonNet(chơi tối thiểu)  >= 2.6
```
Nếu trần quá gần sàn thì không có gì để tham, và "áp lực tự tạo" không tồn tại.

**Chỉ số chính:**
```
selfImposedLoadRatio = (số phút áp lực đến từ LỰA CHỌN của người chơi)
                     / (tổng số phút có áp lực)
```
Áp lực **do người chơi chọn**: nhận thêm khách trong lúc đang bận · mua nhiều hàng hơn dự báo để đón cao điểm · làm preset khó để ăn tip cao · cho nợ · đứng ở chỗ đông hơn · mua nâng cấp bằng tiền chưa có.
Áp lực **do hệ thống áp**: nghĩa vụ đến hạn · giờ cao điểm · mưa · dịch heo.

| Tiêu chí | Mục tiêu |
|---|---|
| `selfImposedLoadRatio` | **≥ 0,70** |
| `peakStressRatio` (thời gian hàng chờ ≥ 3 **và** lò đang chạy **và** có khách ở nguy cơ `CONFIRMED`) | **≤ 22%** thời lượng ngày |
| Số ngày trong 40 ngày mà người chơi **không thể** thoát khỏi áp lực bằng lựa chọn | **≤ 4** (các ngày đỉnh cố ý: 10, 20, 25, 30) |
| Có hành động nào **kết thúc ván ngay lập tức** không | **KHÔNG.** Fail phải mềm và vĩnh viễn, không cứng (CANON §13) |

#### 2.12.3. Test

| Mã | Kịch bản | Kỳ vọng |
|---|---|---|
| **TC-CH1** | Bot "tối thiểu" chạy 40 ngày × 20 seed | `dayNet ≥ 1,08 × dailyFixedCost` ở ≥ 90% ngày |
| **TC-CH2** | Bot "tối ưu tham" vs bot "tối thiểu" | `greedCeilingRatio` ≥ 2,6 |
| **TC-CH3** | Đo `deadTimeRatio` trên 10 phiên người thật | < 8%, không khoảng chết nào > 12s |
| **TC-CH4** | Đo `decisionsPerMinute` trên 10 phiên người thật | ≥ 0,7 |
| **TC-CH5** | Hỏi sau phiên: *"lúc bạn căng nhất là vì bạn chọn làm gì đó, hay vì game bắt bạn?"* | **≥ 7/10** trả lời "vì tôi chọn" |
| **TC-CH6** | Hỏi sau phiên: *"có lúc nào bạn thấy chán không? lúc nào?"* | ≤ 3/10 nói có; nếu ≥ 2 người chỉ vào **cùng một đoạn** → sửa đoạn đó |

---

### 2.13. Đối chiếu tham số với game tham khảo — **cảnh báo số sai**

#### 2.13.1. Good Pizza, Great Pizza: ngưỡng thật là **40%**, không phải 80%

> **Số này đã bị hội đồng sửa lại.** Bản nháp trước của tài liệu gốc ghi *"Good Pizza phạt 80% happiness"*. **Sai.**
> **Ngưỡng phạt thật là 40% happiness. Trên 40% thì KHÔNG bị phạt gì cả.**
> (idea.md dòng 227 và dòng 640 — bảng "số đã bị kiểm chứng sửa lại")

**Hậu quả nếu copy số sai, nguyên văn từ idea.md:**
> *"Copy số sai → hệ thống khắc nghiệt gấp đôi tham chiếu → phá đúng cái 'cozy'."*

Cụ thể điều đó nghĩa là gì: nếu ta đặt ngưỡng phạt ở 80, thì **vùng an toàn của người chơi co từ 60% xuống 20%** của thang đo. Người chơi sống gần như cả ván trong vùng bị phạt. Một game như vậy **vẫn có thể vui** — nhưng nó không còn là cozy, và nó phản bội đúng lời hứa trên trang Steam.

#### 2.13.2. Áp vào game này

Ta **không có thanh happiness** (T3 cấm). Nhưng ta **có** một đại lượng tương đương ẩn: `serviceScore` 0–100 cho mỗi lượt phục vụ, dùng để tính tip và để quyết định có phát sự kiện tiêu cực hay không.

**Luật 40, không phải 80:**

| Vùng `serviceScore` | Hệ quả |
|---|---|
| **100–41** | **KHÔNG phạt gì cả.** Tip theo đường cong phẳng dần (`tipBase` 4% → `tipMax` 14%). Không sự kiện tiêu cực từ điểm phục vụ |
| **40–21** | Phạt **xã hội trước, kinh tế sau**: bark tier-1/2, nét mặt đổi. Tip về `tipBase`. Chưa ghi memory dài hạn |
| **20–0** | Phạt đủ: ghi memory, ảnh hưởng `trustCeiling`, có thể sinh tin đồn |

Và cùng luật đó áp cho `patience`:

| Tên | Giá trị | **Không được đặt là** |
|---|---|---|
| `patiencePenaltyThreshold` | **40** | ~~80~~ |
| `serviceScorePenaltyThreshold` | **40** | ~~80~~ |
| `tipFlatAboveScore` | **40** | ~~80~~ |

**Ghi chú cho người sau:** nếu ai đó đề xuất nâng ngưỡng lên 60 hay 80 vì "game dễ quá", **câu trả lời không phải là nâng ngưỡng.** Câu trả lời là tăng **mật độ quyết định** (§2.12.1) hoặc **độ dốc của đường cong** (§2.11) — tức là cho nhiều thứ để làm hơn, không phải phạt nhiều hơn.

#### 2.13.3. Ba khác biệt khiến **không thể** copy số Good Pizza nguyên si

| | Good Pizza | Game này |
|---|---|---|
| Chấm cái gì | **Kết quả cuối** (đúng/sai topping) | **QUÁ TRÌNH** (T1) — lỗi phải xảy ra trước mặt khách |
| Phản hồi qua đâu | **Bảng review "Pie Chart" app** | **Mặt người, giọng người, dáng người** (T3) |
| Khách có nhìn bạn làm không | **Không** | **Có, và đó là toàn bộ game** |

→ Số 40% dùng làm **trần độ khắc nghiệt**, không dùng làm **công thức**. Ta lấy của họ **mức độ tha thứ**, không lấy **cấu trúc chấm điểm**.

#### 2.13.4. Các số tham chiếu khác và cách dùng

| Nguồn | Số | Dùng thế nào |
|---|---|---|
| **Papers, Please** (Lucas Pope) | Nhiều lỗi cùng lúc làm game **dễ hơn**, không khó hơn | Luật `take(1)`: **tối đa 1 lỗi được nói ra**; các lỗi còn lại vào `silentScore` (CANON §6). Đã là hằng số |
| **RimWorld** | Opinion thấp → hệ số bị xúc phạm ×6 (vòng xoáy tiêu cực) | **KHÔNG bê sang.** CANON §4: *"Cozy không sống nổi với 'một lần sai → cả phố tẩy chay'"*. Thay bằng `TRUST_CEILING_FLOOR = 35` |
| **Dwarf Fortress** | Hết slot memory → ghi đè cái `intensity` **thấp nhất**, không phải cũ nhất | Đã là hằng số (CANON §12) |
| **Splinter Cell Blacklist** | Bark 3 tầng, tier-1 có cooldown | Đã là hằng số (CANON §11) |
| **Cuphead** | >25 phút/frame | Ngân sách FBF = 0 (P5-02 §2.6) |

---

## 3. Dữ liệu & schema

```ts
// sim/microLedger.ts
export type MicroKind =
  | 'SKIP_SMALL_VEG' | 'UNDER_PORTION' | 'SKIP_SAUCE_DASH'
  | 'SKIP_PEPPER' | 'THIN_PATE' | 'ONE_FEWER_CHILI' | 'STALE_INGREDIENT'

export type MicroLedger = {
  ring: (0 | 1)[]          // dài <= W, phần tử 0 là lượt mới nhất
  cleanStreak: number
  stage: 0 | 1 | 2         // 0 = bình thường, 1 = nghi ngờ (A), 2 = soi thật (B)
  stageUntilDay: number
  lastSuspectDay: number
}

export type BalanceConfig = {
  time:  { realMinutesPerDay: number; peakStart: string; peakEnd: string }
  flow:  { placeDurationMs: [number, number]; bakeTimeSec: number; ovenSlots: 1
           arrivalIntervalPeakSec: number; maxConcurrentCustomers: 1 | 2 | 3 }
  perc:  { gazeFactorNormal: number; gazeFactorPhone: 0.05; decayRate: number
           phoneWindowMs: number; phoneWindowCooldownMs: number
           phoneWindowRatePerMin: Record<string, number> }
  pat:   { max: 100; drainRate: number; penaltyThreshold: 40; queueMul: number }
  econ:  { dailyFixedCostRatio: number; priceAmplitude: number
           fridgeCapacity: [number, number, number]
           shelfLifeDays: Record<string, number>
           tipBase: number; tipMax: number; tipFlatAboveScore: 40
           supplierLoyaltyDiscount: number }
  rel:   { ceilingPenaltyBase: number; trustCeilingFloor: number
           grudgeDecayPerDay: [number, number, number]
           absenceTriggerDays: number; switchBase: number; switchedVisitFreqMul: number }
  goss:  { tellChanceBase: number; tellChanceThanThienMul: number
           confidencePerHop: number; hopCap: 2 | 3; goodNewsSpreadMul: number
           unlockDay: number; unlockPlayHours: number }
  misrem:{ favorBiasBase: number; favorBiasSoiMul: number
           favorBiasThanThienMul: number; falsePositiveIntensityMul: number }
  bribe: { diminishRate: number; windowDays: number
           triggerN: number; soiThreshold: number; intensityBase: number }
  micro: { salienceCap: number; W: number; decay: number
           thBase: number; thSoi: number; thDeTha: number
           stageBMul: number; gazeFloorStageB: number; stageBDays: number
           specCheckRateStageB: number
           globalWindow: number; globalThreshold: number; globalDaysRequired: number
           walkInPenaltyPerStage: number; walkInPenaltyCap: number
           forgiveStreak: number; suspectCooldownDays: number
           walkInRecoveryPerDay: number }
  refuse:{ salience: number; ignoresGaze: true; ceilingPenalty: number
           gossipSeedChance: number; witnessZones: Zone[] }
  close: { missedVisitIntensity: number; missedVisitFreqMul: number
           missedVisitsBeforeSwitch: number }
  curve: { days: DaySpec[] }
}

export type DaySpec = {
  day: number
  weekday: 'T2'|'T3'|'T4'|'T5'|'T6'|'T7'|'CN'
  weather: 'KHO' | 'MUA'
  customers: number
  soiShare: number
  events: string[]
  obligations: string[]
  expectedType: 'NHE' | 'VUA' | 'NANG'   // validateCurve() so lại với hardScore tính ra
}
```

**Ví dụ content thật — `content/balance/curve.json` (trích 6 ngày quanh đỉnh):**

```json
{
  "days": [
    { "day": 28, "weekday": "CN", "weather": "KHO", "customers": 20, "soiShare": 0.35,
      "events": ["CO_BA_NAU_COM"], "obligations": [], "expectedType": "NHE" },
    { "day": 29, "weekday": "T2", "weather": "KHO", "customers": 29, "soiShare": 0.45,
      "events": ["CHU_TU_GAN_CUOI"], "obligations": [], "expectedType": "VUA" },
    { "day": 30, "weekday": "T3", "weather": "KHO", "customers": 30, "soiShare": 0.48,
      "events": ["CHU_TU_BIEN_MAT"], "obligations": ["TIEN_CHO_3", "TIEN_HUI_2"],
      "expectedType": "NANG", "note": "Đỉnh mùa. Ngoại lệ duy nhất của luật V8." },
    { "day": 31, "weekday": "T4", "weather": "MUA", "customers": 17, "soiShare": 0.38,
      "events": [], "obligations": [], "expectedType": "NHE",
      "note": "Nhịp nghỉ BẮT BUỘC ngay sau đỉnh. Không được thêm sự kiện vào ngày này." },
    { "day": 32, "weekday": "T5", "weather": "KHO", "customers": 26, "soiShare": 0.42,
      "events": ["CO_BA_HOI_THAM"], "obligations": [], "expectedType": "VUA" },
    { "day": 33, "weekday": "T6", "weather": "KHO", "customers": 28, "soiShare": 0.44,
      "events": [], "obligations": ["TIEN_THUOC_CO_BA_OPTIONAL"], "expectedType": "VUA" }
  ]
}
```

**`content/balance/micro-lines.json` (trích):**

```json
{
  "concept": "SUSPECT_PATTERN",
  "rules": [
    {
      "id": "r0901", "criteria": ["npc=ba_bay", "microStage=1"], "speakonce": false,
      "norepeat": true, "odds": 100,
      "responses": [{ "variants": [
        "Ủa, bữa nay bánh nhạt nhạt sao á con. Hay tại cô già rồi ăn hổng ra vị.",
        "Con ơi, dạo này cô ăn thấy hổng đậm đà bằng hồi trước á."
      ]}],
      "applycontext": [["ba_bay.suspects_player", true, 345600]],
      "face": { "brow": "05", "eye": "03", "mouth": "04" },
      "pose": "look_at_hands"
    },
    {
      "id": "r0904", "criteria": ["npc=chi_lan", "microStage=1"], "odds": 100,
      "responses": [{ "variants": ["<SILENT>"] }],
      "silentAction": { "pose": ["look_at_hands", "turn_to_leave"], "holdMs": 2000 },
      "applycontext": [["chi_lan.suspects_player", true, 604800]],
      "note": "Chị Lan KHÔNG nói gì. Đây là dòng đắt nhất của bảng."
    },
    {
      "id": "r0907", "criteria": ["npc=chu_kiet", "microStage=1"], "odds": 100,
      "responses": [{ "variants": ["Tao biết mày đang làm gì. Tao làm rồi."] }],
      "face": { "brow": "05", "eye": "03", "mouth": "02" }
    }
  ]
}
```

---

## 4. UI/UX hai thiết bị

Cân bằng không có UI riêng — **theo T3, nó không được có UI riêng.** Nhưng nó **phải đọc được**, và đó là một yêu cầu UI.

| Thứ cần truyền đạt | **Không được làm** | **Phải làm (PC)** | **Phải làm (cảm ứng)** |
|---|---|---|---|
| Khách đang nghi mình ăn gian (g) nấc A | Biểu tượng cảnh báo, thanh nghi ngờ, số | **Một dòng thoại + nét mặt `brow_05 / eye_03`** (P5-02) | Y hệt, chữ theo cỡ P5-01 |
| Khách đã chuyển sang soi (g) nấc B | Hiện `gazeFloor` | **Pose `look_at_hands` giữ lâu** + khách **nói rõ yêu cầu** ("cho nhiều rau nha") | Y hệt; `postureCaptions` nếu bật |
| Cả hẻm bắt đầu nghi (g) nấc C | Thanh danh tiếng | **Ít khách lạ hơn** + nhiều khách nói rõ yêu cầu hơn + nghe lỏm ở góc hẻm | Y hệt |
| `trustCeiling` đã bị hạ (d) | Số, màu tên | **Những dòng thân mật nhất không xuất hiện nữa**. Người chơi chỉ nhận ra khi nhớ lại | Y hệt |
| Quầy đang bẩn | Thanh sạch sẽ | **Nhìn thấy rác + nghe thấy ruồi** (P5-03 `sfx_ruoi`) | Y hệt; caption `[tiếng ruồi]` |
| Nguyên liệu gần hết hạn (j) | Số ngày còn lại trên icon | **Đổi tint + độ bóng của sprite** (P5-02) | Icon lớn hơn → dễ thấy hơn |
| Nghĩa vụ sắp đến hạn | Pop-up đòi tiền | **Cuốn sổ của cô Ba ở cảnh tối** — người chơi tự đọc | Sổ mở toàn màn |
| Hôm nay lời hay lỗ | HUD tiền realtime | **Đếm tiền ở cảnh tối** — biết vào cuối ngày, như đời thật | Y hệt |

**Ngoại lệ duy nhất được hiện số:** **sổ tay do chính người chơi tự ghi** (CANON Phần I §3) và **sổ nợ / tiền mặt** — vì tiền là con số trong đời thật, và người bán hàng có đếm tiền. Quan hệ thì không.

---

## 5. Tham số cần tune

Xem **bảng tổng hợp §2.9**. Bổ sung phần quy trình:

| Tên | Khởi điểm | Khoảng | Cách đo | Ai |
|---|---|---|---|---|
| `oracleAdvantage` | — | **≤ 1,18** | TC-F1 | `DEV-GP` |
| `seasonNet` chênh 3 lối chơi | — | **≤ 1,15** | TC-S1 | `DEV-GP` |
| `greedCeilingRatio` | — | **≥ 2,6** | TC-CH2 | `DEV-GP` |
| `selfImposedLoadRatio` | — | **≥ 0,70** | Telemetry + TC-CH5 | `QA` |
| `decisionsPerMinute` | — | **≥ 0,7** | Telemetry người thật | `QA` |
| `deadTimeRatio` | — | **< 8%** | Telemetry | `QA` |
| `confirmedPositivePerDay / confirmedNegativePerDay` | — | **≥ 1,0** | Telemetry | `DEV-GP` |
| `attentionToolUsesPerDay` | — | **≥ 2,0** | Telemetry | `DEV-GP` |
| `overheardEventsPerDay` | — | **≥ 1,0** | Telemetry | `DEV-GP` |
| `regularsLostPermanently` | — | **≤ 2** / 40 ngày | Telemetry | `DEV-GP` |
| Số tham số đổi mỗi vòng tune | — | **≤ 3** | `tune-log.md` | `PROD` |

---

## 6. Tiêu chí đạt

### 6.1. Ma trận test chống ăn gian

**Cổng: 100% pass. Không có ngoại lệ, không có "chấp nhận được".**

| Lỗ hổng | Test | Pass |
|---|---|---|
| (a) Cửa sổ điện thoại | TC-A1 … A4 | 4/4 |
| (b) Phân tầng khách | TC-B1 … B3 | 3/3 |
| (c) Lịch mưa | TC-R1 … R2 | 2/2 |
| (d) Đốt rồi để nguội | TC-D1 … D4 | 4/4 |
| (e) Save-scum | TC-E1 … E4 | 4/4 |
| (f) Datamine | TC-F1 … F2 | 2/2 |
| **(g) Micro-cheat** | **TC-G1 … G10** | **10/10** — TC-G4 (công bằng) và TC-G9 (kinh tế) là bắt buộc tuyệt đối |
| (h) Nhớ nhầm chiều ngược | TC-H1 … H3 | 3/3 |
| (i) Spam trust giá rẻ | TC-I1 … I3 | 3/3 |
| (j) Tích trữ | TC-J1 … J3 | 3/3 |
| (k) Từ chối phục vụ | TC-K1 … K3 | 3/3 |
| (l) Đóng cửa sớm | TC-L1 … L3 | 3/3 |
| **Tổng** | **44 test** | **44/44** |

### 6.2. Checklist cân bằng

| # | Tiêu chí | Cách đo | Pass |
|---|---|---|---|
| D1 | Hai hiệu chỉnh kiểm tra của CANON §5 khớp | Unit test | `DROPPED_FOOD` + nhìn thẳng → `CONFIRMED` **1,3–1,5s**; + gaze 0,05 → **26–30s** |
| D2 | `realMinutesPerDay` trong khoảng | Telemetry 20 phiên | 5,5–9,0 |
| D3 | `seasonRealHours` | Tính | **≥ 4,0** |
| D4 | Sự kiện tích cực ≥ sự kiện tiêu cực **trong trải nghiệm thực tế** | Telemetry | Tỉ lệ ≥ 1,0 |
| D5 | Ba lối chơi chênh ≤ 15% | TC-S1 | Pass |
| D6 | Mỗi lối chơi thắng ≥ 1 loại ngày | TC-S2 | 3/3 |
| D7 | Bot hỗn hợp ≥ 1,12× lối đơn tốt nhất | TC-S3 | Pass |
| D8 | `validateCurve()` V1–V8 | CI | 8/8 |
| D9 | Ngày khó nhất là **ngày 30**, không phải ngày 40 | CI | Pass |
| D10 | `patiencePenaltyThreshold` = **40** | Đọc config | **= 40** |
| D11 | Không có tham số ngưỡng phạt nào đặt ở 80 | Grep config | **0** |
| D12 | Chơi tối thiểu có lãi ở ≥ 90% ngày | TC-CH1 | Pass |
| D13 | `greedCeilingRatio` ≥ 2,6 | TC-CH2 | Pass |
| D14 | Không có hành động nào kết thúc ván ngay | Review mã | **0** |
| D15 | `TRUST_CEILING_FLOOR` > 0 (luôn còn đường quay lại) | Đọc config | ≥ 30 |
| D16 | `FORGIVE_STREAK` tồn tại và hoạt động | TC-G6 | Pass |
| D17 | Không có chỉ số quan hệ nào hiện ra màn hình | Review UI toàn bộ | **0** |
| D18 | Chế độ `KHONG_GIOI_HAN` không tạo dominant strategy | TC-S5 | Pass |
| D19 | `tune-log.md` đầy đủ cho mọi thay đổi | Đọc | 100% |
| D20 | Telemetry **không** có trong build phát hành | Grep + kiểm build | **0** |

### 6.3. Playtest protocol — 3 vòng

#### Vòng 1 — **Cổng P1** (cuối tuần 8)

| Mục | Chi tiết |
|---|---|
| **Số người** | **10 người lạ** — không quen ai trong nhóm, chưa nghe về game |
| Nội dung | Vertical slice 20 phút: 1 quầy, 3 NPC có tên và mặt, 11 sự kiện, **gossip chain hiển thị được** |
| Cách chạy | Quay màn hình + quay mặt. **Không nói gì trong lúc chơi.** Không ngồi cạnh. Không giải thích luật |
| **Câu hỏi cổng** | **"Bạn có biết vì sao khách đó giận không?"** |
| **Tiêu chí PASS** | **≥ 7/10 trả lời ĐÚNG** |
| Nếu < 7/10 | **Hệ thống chưa đọc được. Không lượng thoại nào cứu được nó.** Quay lại P5-02 (mặt, pose, biểu cảm), không quay lại viết thêm thoại |
| Câu hỏi phụ | 1. "Có ai đang nhìn bạn làm không?" (kỳ vọng ≥ 8/10 có) · 2. "Bạn có làm gì để họ đừng nhìn không?" (≥ 4/10 nói được ít nhất một công cụ §5.4) · 3. "Kể lại một chuyện xảy ra" (≥ 6/10 kể được một chuỗi nhân-quả) · 4. "Bạn có muốn chơi tiếp không?" (≥ 7/10 có) |
| Ghi nhận | Mọi lần người chơi **dừng lại bối rối** ≥ 3 giây — ghi timestamp, phân loại nguyên nhân |
| **Điều kiện huỷ** | Nếu fail **hai lần liên tiếp** sau khi đã sửa → vấn đề nằm ở **art/animation**, không nằm ở cân bằng. Chuyển sang P5-02 §6 |

#### Vòng 2 — **Cân bằng** (giữa P3/P4)

| Mục | Chi tiết |
|---|---|
| **Số người** | **12 người**: 6 quen game cozy, 4 chơi game phổ thông, **2 người từng bỏ game cozy vì chán** (nhóm này đắt nhất) |
| Nội dung | 5 ngày in-game (~40 phút) |
| **Đo** | 1. **≥ 6/12** tự suy ra được lịch của chú Tư từ quan sát (không được nhắc) · 2. **≥ 8/12** dùng ít nhất một công cụ hạ attention · 3. **0/12** tìm ra dominant strategy (hỏi: *"nếu chơi lại, bạn sẽ làm gì khác?"* — nếu ≥ 3 người mô tả **cùng một** chiến lược tối ưu thì có dominant) · 4. **≥ 9/12** muốn chơi tiếp ngày 6 |
| Hỏi thêm | *"Lúc bạn căng nhất là vì bạn chọn làm gì đó, hay vì game bắt bạn?"* → **≥ 7/12 "vì tôi chọn"** (TC-CH5) |
| | *"Có lúc nào bạn thấy chán không? Lúc nào?"* → ≤ 4/12; **không ai chỉ vào cùng một đoạn** |
| | *"Bạn nghĩ game này chấm bạn theo cái gì?"* → **không ai** nhắc tới một con số hay một thanh |
| Telemetry | Thu đủ 20 metric §2.8.1 |

#### Vòng 3 — **Toàn diện** (cuối P5, trước khi Steam page live)

| Mục | Chi tiết |
|---|---|
| **Số người** | **20 người**, 2 buổi, phân bổ bắt buộc: |
| | **4 người nhóm trợ năng** — ≥ 1 thị lực kém, ≥ 1 ADHD, ≥ 1 hạn chế vận động tay, ≥ 1 mù màu (P5-01 §6.2 A-4) |
| | **4 người Việt đang sống ở TP.HCM** — kiểm tính xác thực |
| | **3 người nước ngoài chưa biết gì về Việt Nam** — kiểm "có hiểu được không mà không cần chú thích" |
| | **3 người đã chơi Good Pizza / Stardew / Papers Please** — kiểm so sánh |
| | **6 người phổ thông** |
| Nội dung | Tối thiểu 10 ngày in-game (~75 phút); 5 người chơi trọn 40 ngày trong 2 buổi |
| **Tiêu chí PASS** | |
| P1 | Câu hỏi cổng *"vì sao khách đó giận"*: **≥ 14/20** đúng; và trong nhóm trợ năng **≥ 3/4** |
| P2 | *"Bạn nghĩ game chấm bạn theo cái gì?"*: **0/20** nhắc tới con số / thanh chỉ số |
| P3 | Người Việt TP.HCM: **0 lỗi nghiêm trọng** về văn hoá, bối cảnh, ngôn ngữ |
| P4 | Người nước ngoài: **≥ 2/3** hiểu được hệ thống quan hệ **mà không cần giải thích đại từ xưng hô** lần hai |
| P5 | *"Có ai bỏ bạn mà bạn không hiểu vì sao không?"*: nếu có, người chơi phải **kể được** lý do (dù họ đã đoán sai) — không được là "không biết, tự nhiên mất" |
| P6 | `selfImposedLoadRatio` đo được ≥ 0,70 |
| P7 | **≥ 16/20** nói sẽ giới thiệu cho một người bạn |
| P8 | Nhóm trợ năng: A-3 của P5-01 §6.2 pass (≥ 24/26 dòng Steam được xác nhận đúng) |
| Ghi nhận | Mọi lỗi phân loại: **chặn phát hành** / **sửa trước phát hành** / **sửa sau** / **không sửa (có lý do ghi ra)** |

#### Luật chung cho cả 3 vòng

1. **Không giải thích. Không bào chữa. Không ngồi cạnh.** Người quan sát ngồi sau, im lặng.
2. **Không hỏi câu dẫn.** Hỏi *"có chuyện gì xảy ra?"*, không hỏi *"bạn có thấy bà Bảy giận vì bạn làm rớt bánh không?"*
3. **Người test không phải là người thiết kế test.** `QA` viết bảng câu hỏi, một người khác chạy phiên.
4. **Ghi âm/quay lại toàn bộ**, có xin phép.
5. **Không tuyển người quen trong ngành.** Bạn bè làm game sẽ nói về thiết kế thay vì nói về trải nghiệm.
6. **Mỗi vòng có một câu hỏi duy nhất là cổng.** Các câu còn lại là chẩn đoán, không phải cổng.

---

## 7. Rủi ro & cách bịt

| # | Rủi ro | Hậu quả | Cách bịt |
|---|---|---|---|
| R1 | **(g) bắt oan người chơi nghèo** — hết hàng thật bị tính là ăn gian | Trải nghiệm tệ nhất có thể có: bị NPC trách vì một thứ mình không làm | 4 luật công bằng §2.7.2. **TC-G4 là test bắt buộc tuyệt đối** |
| R2 | **(g) trở thành cái bẫy không lối ra** | Người chơi bị dán nhãn vĩnh viễn → bỏ game | `FORGIVE_STREAK = 4`, vòng đệm tự trôi sau 12 lượt, `walkInRecoveryPerDay` +3%. D16 |
| R3 | **Ngưỡng (g) quá nhạy** → người chơi trung thực vẫn bị nghi | Phá lòng tin vào hệ thống | TC-G3: ăn gian **40%** phải **không** ai nghi. Tune cuối cùng (§2.8.2 bước 9) |
| R4 | **Copy số 80% của Good Pizza** | *"Hệ thống khắc nghiệt gấp đôi tham chiếu → phá đúng cái cozy"* | §2.13 viết rõ. **D11: grep config, 0 ngưỡng phạt nào ở 80** |
| R5 | **Cửa sổ điện thoại thành dominant strategy** | *"Cả cơ chế attention sụp"* (idea §21a) | TC-A1: bot farm phải **≤ baseline** |
| R6 | **Tune vô hạn** — mỗi lần đổi lại phá thứ khác | Không bao giờ xong | Thứ tự 9 bước §2.8.2 + điều kiện dừng §2.8.3 + luật ≤3 tham số/vòng |
| R0.5 | **Cân bằng cho bot, không cân bằng cho người** | Số đẹp, chơi chán | Luật ưu tiên §2.8.3: **người thật thắng số liệu**. Playtest vòng 2 và 3 là cổng, không phải tham khảo |
| R8 | **Chế độ `KHONG_GIOI_HAN` phá cân bằng** | Người dùng trợ năng bị coi là "chơi dễ" | Kinh tế không đổi một đồng (P5-01 §2.2.2). TC-S5 + D18 |
| R9 | **Đường cong thành dốc đều** — dễ trôi vào khi thêm nội dung | Grind | `validateCurve()` chạy trong CI. V1–V8 |
| R10 | **Ngày 40 bị làm thành ngày khó nhất** (phản xạ tự nhiên của designer) | Kết mùa thành bài kiểm tra thay vì khoảnh khắc nhìn lại | V6 assert: đỉnh ở **d30**. Ngày 40 `%soi` thấp nhất từ d15 |
| R11 | **Telemetry lọt vào build phát hành** | Vi phạm quyền riêng tư + mâu thuẫn CANON §2 (client-only) | D20: grep + kiểm build. Telemetry nằm sau cờ `__DEV__` |
| R12 | **Hệ (g) hiện thành số trên màn hình** vì "người chơi không hiểu" | Vi phạm **T3** | D17. Nếu người chơi không hiểu → sửa **thoại và nét mặt**, không thêm UI |
| R13 | **Đồn thổi mở khoá quá muộn** — CANON §12.6 ghi "2 giờ chơi đầu", mà 2 giờ ≈ **ngày 17** | Người chơi không bao giờ thấy hệ thống hay nhất của game trong demo | **§9 C1**: đổi thành `min(2 giờ chơi, hết ngày 6)` |
| R14 | **`trustCeiling` hạ quá nhanh** → vòng xoáy tiêu cực kiểu RimWorld | *"Cozy không sống nổi với một lần sai → cả phố tẩy chay"* | `TRUST_CEILING_FLOOR = 35`, `CEILING_PENALTY_BASE` chỉ kích hoạt ở `intensity ≥ 0,70`. D15 + TC-D4 |
| R15 | **Playtest vòng 1 fail rồi sửa bằng cách thêm thoại** | Thoại không sửa được vấn đề đọc hiểu thị giác | Điều kiện huỷ của vòng 1: fail 2 lần → sang **P5-02**, không sang viết thoại |
| R16 | **Tuyển playtester là bạn trong ngành** | Nhận được góp ý thiết kế thay vì dữ liệu trải nghiệm | Luật chung §6.3 mục 6 |

---

## 8. Truy vết

| Nội dung | `idea.md` | `CANON.md` |
|---|---|---|
| 12 cách ăn gian (a)–(l) | **§21** (dòng 1013–1033) | **§8** |
| (g) micro-cheat là **lỗ hổng lớn nhất**, phát hiện theo PATTERN | §21 mục g | §8 mục g |
| Thoại *"ê, dạo này bánh nhạt hơn hay tại tao?"* | §21 mục g | §8 mục g |
| Cửa sổ điện thoại 2–3s, câu giờ có giá | §21 mục a · §17 (HT1) | §8a · §5.4 |
| Mưa giảm 40% lượng khách | §21 mục c | §8c |
| Grudge decay nhưng hạ trần tin tưởng vĩnh viễn | §21 mục d | §8d |
| Autosave ngay khi sự kiện + seed cố định theo ngày | §21 mục e | §8e · §2 |
| Bias nhớ nhầm theo tính cách | §21 mục h | §8h · §12 |
| Diminishing returns + phản tác dụng | §21 mục i | §8i |
| Hạn dùng + sức chứa tủ; đồ chua đỉnh ngày 3, gắt ngày 7 | §22.1 | §8j · §13.1 |
| Chi phí cố định hằng ngày | §21 mục l | §8l |
| **Good Pizza: ngưỡng thật 40%, không phải 80%** | **dòng 227 và dòng 640** (bảng số đã bị sửa) | — |
| Papers, Please: `take(1)` | §17 | §6 |
| RimWorld: không bê vòng xoáy tiêu cực ×6 | §18 | §4 |
| 4 ràng buộc kinh tế + fail mềm vĩnh viễn | §22 | §13 |
| Cao điểm 6h30–8h; đông khách = nhiều mắt = dễ ẩu | §22.3 | §13.3 |
| **"Chill là áp lực do mình tự tạo ra vì tham"** | §22.3 (Minh) | — |
| **"There's a fine line between calm and boring"** | Phần I §2 mục 1 | — |
| Bẫy mobile đội lốt cozy | Phần I §2 mục 4 | §1 T4 |
| Sự kiện tích cực ≥ sự kiện tiêu cực | Phần I §3 (bảng bẫy) | §3 (ghi chú §9.7) |
| Không hiện chỉ số quan hệ | Phần I §3 | §1 T3 |
| Cổng **≥7/10 người lạ trả lời đúng "vì sao khách đó giận"** | **§23 tuần 5–8** | **§17 P1** |
| *"Nếu bạn chưa đo, bạn chưa thiết kế"* | §23 tuần 1–2 | — |
| Game sẽ bị crack, đừng đầu tư DRM | §23 | — |
| Chú Tư biến mất ~ngày 30, báo trước 3–4 ngày | §19 / dàn nhân vật | §9 (#2) |
| Chị Lan — người im lặng biến mất | — | §9 (#4) |
| Chú Kiệt — người gian dối vệ sinh, người duy nhất hiểu nghề của bạn | §19.4 / XĐ1 | §9 (#12) · §7.5 |
| Mọi ending đều tử tế, chỉ khác "ai còn ở đó với mình" | §20 (cuối) | §15 |

---

## 9. Đề xuất sửa CANON

| # | Mục CANON | Hiện tại | Đề xuất | Lý do |
|---|---|---|---|---|
| **C1** | **§12** (đồn thổi, ràng buộc 6) | *"Không xảy ra trong **2 giờ chơi đầu**."* | Sửa thành: *"Không xảy ra trước **min(2 giờ chơi, hết ngày 6)**."* | **Mâu thuẫn số học nghiêm trọng.** Mục tiêu ngày là ~7 phút thật (idea §23 tuần 1–2, "40 ngày = bao nhiêu giờ"). 2 giờ chơi ≈ **ngày 17** — nghĩa là người chơi mất **43% mùa** mới gặp hệ thống hay nhất của game, và **bản demo sẽ không có đồn thổi gì cả**. Mà demo web itch.io là kênh phát hành số 1 (idea §23) |
| **C2** | **§8** (bảng 12 lỗ hổng) | Cột "Cách bịt" là mô tả | Thêm một dòng ghi chú dưới bảng: **"Mọi ngưỡng phạt trong dự án đặt ở 40, không phải 80. Đối chiếu: Good Pizza phạt từ 40% happiness trở xuống; trên 40% không phạt gì. Copy số 80 → hệ thống khắc nghiệt gấp đôi tham chiếu → phá đúng cái cozy."** | Con số này **đã bị hội đồng sửa lại một lần** (idea dòng 640). Nó sẽ bị copy sai lần nữa nếu không nằm ở CANON. Đây là loại lỗi rẻ để phòng, đắt để sửa |
| **C3** | **§8 mục g** | *"sau N lần: [thoại]"* | Ghi rõ cấu trúc: **"Bộ đếm trượt theo NPC (cửa sổ 12 lượt, trọng số 0,92^i) + bộ đếm toàn cục (20 lượt). Ngưỡng theo tính cách. **Ba nấc: nghi ngờ → nâng `gazeFloor` → gieo tin đồn.** Bắt buộc có đường tha thứ (4 lượt sạch liên tiếp)."** | "sau N lần" quá mơ hồ cho lỗ hổng được CANON gọi là **lớn nhất**. Và nấc B (nâng `gazeFloor`) là quyết định kiến trúc: nó nối (g) ngược về hệ perception §5 thay vì dựng một hệ phạt thứ hai |
| **C4** | **§3.1** | 6 sự kiện tiêu cực | Thêm **`REFUSED_SERVICE`** (salience **85**, loại Xã hội, **bỏ qua `gazeFactor`** như `WRONG_NAME`) | §8k nói "từ chối tốn kém nặng về mặt xã hội" nhưng **không có sự kiện nào biểu diễn nó**. Không có sự kiện thì không có salience, không có memory, không có tin đồn → lỗ hổng (k) thực tế **chưa được bịt** |
| **C5** | **§5** | 4 state + bảng `visibility` | Thêm khái niệm **`gazeFloor`**: *"Một NPC ở trạng thái nghi ngờ có sàn `gazeFactor` (mặc định 0,45) — họ chủ động nhìn, không phụ thuộc vào việc đang làm gì."* | Là cơ chế nấc B của (g). Hiện `gazeFactor` chỉ được suy ra từ hành vi; cần một đường để **trạng thái tâm lý** tác động ngược lại |
| **C6** | **§13** | 4 ràng buộc kinh tế | Thêm ràng buộc thứ 5 dạng bất đẳng thức: **"Chơi ở mức tối thiểu phải có lãi ở ≥ 90% số ngày (`dayNet ≥ 1,08 × dailyFixedCost`), và trần tham phải ≥ 2,6× sàn."** | Đây là định nghĩa **vận hành** của *"chill là áp lực do mình tự tạo ra vì tham"* (idea §22.3). Không có nó, "cozy" là một lời hứa marketing không kiểm được — và ranh giới với "bẫy mobile đội lốt cozy" (Phần I §2 mục 4) không đo được |
| **C7** | **§17** | Bản đồ phase, cổng P1 | Thêm vào P5: **"Cổng P5: 44/44 test chống ăn gian pass + playtest vòng 3 (20 người) pass, trước khi Steam page live."** | Cổng P1 đã có số; P5 chưa có. Mà P5 là phase cuối trước phát hành |
