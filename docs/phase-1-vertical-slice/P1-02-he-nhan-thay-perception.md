# P1-02 — Hệ NHẬN THẤY (perception): certainty tích luỹ, không roll xúc xắc

**Thuộc phase:** P1 — Vertical slice
**Phụ thuộc:** `P1-01` (vòng lặp một khách ở quầy) · `P0-02` (clock & fixed-step tick) · `P0-03` (rng seed theo ngày) · `P0-04` (save/autosave)
**Cung cấp cho:** `P1-03` (delivery diff) · `P2-01` (rule DB thoại) · `P2-02` (trí nhớ 3 tầng) · `P2-03` (đồn thổi)
**Trạng thái:** **Chốt** về cơ chế và công thức. **Cần đo** các hằng số tune (bảng §5).

---

## 1. Mục tiêu

Tầng NHẬN THẤY quyết định **ai thấy bạn làm gì**. Nó là tầng đầu tiên trong chuỗi 4 tầng (`idea.md` §9) và là tầng duy nhất mà nếu làm sai thì ba tầng sau (diễn giải, phản ứng, ghi nhớ) đều vô nghĩa — vì NPC sẽ phản ứng với những thứ người chơi không hiểu tại sao.

Doc này phục vụ trực tiếp:

- **T5 — Attention phải NHÌN THẤY ĐƯỢC.** Không roll xúc xắc. `certainty` tích luỹ theo thời gian, và mọi nhân tử của tốc độ tích luỹ đều có **biểu hiện hình ảnh trên màn hình trước khi người chơi hành động**.
- **T1 — Khách chấm QUÁ TRÌNH.** Đây là cơ chế biến "quá trình" thành dữ liệu: mỗi thao tác sinh ra một `Stimulus`, mỗi khách trong tầm sinh ra một `Observation`.
- **T3 — Không hiện chỉ số quan hệ.** `certainty` **không bao giờ** hiện ra dưới dạng số hay thanh bar. Nó hiện ra dưới dạng **hướng đầu, nét mặt, dấu `?`, tiếng động**.

Một câu kiểm tra doc này: *nếu người chơi làm rớt ổ bánh và không bị ai bắt, họ phải chỉ được vào màn hình và nói "vì lúc đó bả đang cúi xuống uống trà đá"*.

---

## 2. Cơ chế

### 2.1. Vì sao BỎ HOÀN TOÀN xác suất roll mỗi frame

Đây không phải sở thích. Đây là hội tụ của bốn nguồn độc lập (`idea.md` §16 HT1), cộng hai tiền lệ công nghiệp.

**(a) Lập luận kỹ thuật — Steve Rabin, *Game AI Pro 2*, chương 4:**

> *"If the die is rolled often enough, eventually the object will be seen... it's more unpredictable and probably inexplicable to the player."*

Toán học của nó: nếu mỗi frame roll một lần với `p` nhỏ, xác suất **không** bị thấy sau `n` frame là `(1-p)^n`. Ở 30fps, chỉ cần `p = 0.02` thì sau 2 giây (60 frame) xác suất bị thấy đã là `1 - 0.98^60 = 70%`. Người chơi không cảm nhận được đường cong này. Họ chỉ cảm nhận được: *"lúc thì bị bắt, lúc thì không, tao không biết tại sao"*. Tệ hơn nữa: **cùng một hành động, cùng một bối cảnh, hai kết quả khác nhau** — đó là định nghĩa của thứ không học được.

**(b) Tiền lệ 1 — The Last of Us.** Naughty Dog ban đầu mô phỏng tầm nhìn chính xác: raycast từ mắt NPC tới **mọi joint** của Joel, thấy ≥60% số joint thì tính là phát hiện. Họ **vứt bỏ toàn bộ** và thay bằng **một điểm duy nhất** trên người chơi. Lý do: với mô hình chính xác, người chơi không đoán được chỗ nấp nào an toàn — nửa cái vai thò ra sau cái thùng có thể đủ hoặc không đủ, tuỳ tư thế animation ở frame đó. Với một điểm, người chơi đoán được ngay. Thay vào chỗ của xác suất, họ dùng **timer hai chiều ~1–2 giây**: nhìn thấy → đồng hồ chạy lên; mất dấu → đồng hồ chạy xuống.

**(c) Tiền lệ 2 — Martin Walsh (Splinter Cell Blacklist):**

> *"in the case of player perception versus simulation accuracy, **player perception should win**."*

**(d) Bốn persona cùng đòi một thứ, bằng bốn ngôn ngữ khác nhau** (`idea.md` §16 HT1). Đây mới là lý do quyết định — vì bốn người này không nói chuyện với nhau và không cùng động cơ:

| Persona | Câu nói | Động cơ thật đằng sau |
|---|---|---|
| **Minh** (người tối ưu hoá) | *"coin flip độc lập mỗi lần là thứ người chơi hệ thống ghét nhất — tôi làm đúng mà vẫn thua và không học được gì."* | Anh ấy cần **mô hình dự đoán được**. Xác suất độc lập mỗi frame làm mô hình của anh ấy không hội tụ → anh ấy bỏ game và viết lên Reddit |
| **Sarah** (designer) | *"tôi phải ĐỌC ĐƯỢC attention trước khi quyết định. Nếu không, hệ thống của bạn là xúc xắc."* | Cô ấy nói về **thứ tự nhân quả**: thông tin phải đến TRƯỚC quyết định, không phải sau |
| **Ngọc Ánh** (người chơi thường) | *"đừng để em thua mà không biết vì sao."* | Cô ấy nói về **cảm xúc sau thất bại**. Thua có lý do = học. Thua không lý do = bị sỉ nhục |
| **Linh** (ADHD) | (ở HT3) *"bị đổ oan mà không có cách giải thích = mang cảm giác bất lực ra khỏi game"* | Cô ấy nói về **thứ còn lại sau khi tắt máy**. Xác suất ẩn để lại dư vị bất lực |

Bốn người đòi bốn thứ — mô hình dự đoán được, thứ tự nhân quả, phẩm giá sau thất bại, dư vị sau khi tắt máy — và **cả bốn đều được thoả mãn bởi đúng một thay đổi kỹ thuật**: thay roll bằng tích luỹ. Khi một thay đổi kỹ thuật thoả mãn bốn nhu cầu không liên quan nhau, đó không còn là lựa chọn thiết kế nữa.

**(e) Phản biện đã được xét và bác bỏ.** Phản biện dẫn XCOM: Firaxis phải **giấu** bộ điều chỉnh độ khó và **streak-breaker**, vì người chơi đọc phần trăm *"theo nghĩa cảm xúc chứ không phải toán học"* — mà XCOM **còn hiện số ra màn hình**. Kết luận rút ra: nếu ngay cả khi hiện số 85% mà người chơi vẫn cảm thấy bị lừa, thì một hệ ẩn hoàn toàn bằng xác suất là tự sát. → Chốt theo **CANON §16 Đừng-2**.

> **Hệ quả cứng cho lập trình viên:** trong `sim/perception.ts` **không được có một lời gọi `rng()` nào**. Nếu review thấy `Math.random()` hoặc `rng.next()` trong file này, đó là bug thiết kế, không phải bug code. Ngẫu nhiên chỉ được phép ở **độ trễ phản ứng 0,2–0,4s** (CANON §11, chống twinning) và ở **chọn biến thể thoại** (shuffle-bag) — cả hai đều nằm ở tầng khác, sau khi `CONFIRMED` đã được quyết định một cách tất định.

---

### 2.2. Công thức certainty tích luỹ — giải thích từng nhân tử

```
rate = salience * visibility[slot][zone] * occluderMul * gazeFactor * traitMul / 100

obs.certainty += rate * dt          // TÍCH LUỸ, không roll xúc xắc mỗi frame
obs.certainty -= decayRate * dt     // khi kích thích biến mất (kiểu capacitor)
```
*(CANON §5 — copy nguyên văn)*

`rate` có đơn vị **certainty / giây**. Vì ngưỡng `CONFIRMED` là `1.0`, ta có ngay công thức tra ngược dùng cho mọi bảng tune trong doc này:

```
t_confirm = 1 / rate = 100 / (salience × visibility × occluderMul × gazeFactor × traitMul)
```

| Nhân tử | Miền | Nguồn | Ý nghĩa một câu | Ai điều khiển nó |
|---|---|---|---|---|
| `salience` | 15–100 | CANON §3 (cố định) | **Việc này đáng chú ý tới mức nào**, độc lập với ai đang nhìn | Nhà thiết kế. Người chơi **không** đổi được |
| `visibility[slot][zone]` | 0.00–0.95 | Bảng tra tĩnh §2.3 | **Từ chỗ khách đứng, có nhìn tới chỗ đó được không** | Người chơi (chọn làm ở zone nào) + hàng chờ (khách đứng slot nào) |
| `occluderMul` | 0.15–1.00 | Bảng §2.6 | **Có cái gì chắn giữa không** | Người chơi — đây là **công cụ chủ động** chính |
| `gazeFactor` | 0.05–1.00 | Máy trạng thái §2.5 | **Khách đang nhìn cái gì** | Một phần NPC tự quyết, một phần người chơi lái được |
| `traitMul` | 0.65–1.45+ | Công thức §2.7 | **Người này soi tới mức nào** | NPC. Người chơi chỉ **biết trước** chứ không đổi |
| `dt` | ~0.0333 s | Clock | Bước tích phân | Engine |

**Vì sao chia 100:** để `salience` giữ nguyên thang 0–100 quen thuộc của CANON §3 mà không phải viết số thập phân trong content JSON. `100` là hằng số chuẩn hoá, **không** phải tham số tune. Đừng đụng vào nó; muốn game nhạy hơn thì chỉnh `traitMul` hoặc bảng `visibility`.

**Vì sao nhân chứ không cộng:** mọi nhân tử đều là **điều kiện cần**. Khách đứng ở `QUEUE_3` nhìn xuống `UNDER_COUNTER` (visibility `0.00`) thì dù có soi tới đâu, dù gaze bằng `1.0`, `rate` vẫn bằng `0`. Cộng sẽ phá tính chất này — một bà Bảy `traitMul` cao sẽ "thấy xuyên gầm tủ". Nhân giữ được luật: **một nhân tử bằng 0 là chặn tuyệt đối**, và đó là cái người chơi cần tin được.

**Hệ quả quan trọng nhất của tích luỹ:** rủi ro trở thành **tích phân theo thời gian**, không phải sự kiện điểm. Nghĩa là câu hỏi của người chơi đổi từ *"tao có may không?"* thành *"tao có kịp không?"*. Đó chính là chuyển dịch từ **xổ số** sang **trò chơi vị trí và timing** (`idea.md` §18.2).

---

### 2.3. Bảng `visibility` tĩnh — copy từ CANON §5

| | `HANDS` | `BOARD` | `OVEN` | `UNDER_COUNTER` |
|---|---|---|---|---|
| `FRONT_CENTER` | **0.95** | 0.85 | 0.60 | 0.05 |
| `FRONT_SIDE` | 0.70 | 0.65 | 0.75 | 0.05 |
| `QUEUE_2` | 0.45 | 0.40 | 0.50 | 0.02 |
| `QUEUE_3` | **0.20** | 0.18 | 0.30 | 0.00 |
| `SEATED_FAR` | 0.10 | 0.10 | 0.25 | 0.00 |

**Đọc bảng này cho đúng.** Ba đặc điểm đáng chú ý, mỗi cái là một quyết định thiết kế:

1. **Cột `OVEN` không giảm đều theo khoảng cách.** `FRONT_SIDE` (0.75) > `FRONT_CENTER` (0.60), và `SEATED_FAR` (0.25) > `QUEUE_3` `HANDS` (0.20). Vì cái lò nằm lệch một bên xe và **cao hơn mặt thớt** — người đứng chính diện bị chính cái nắp tủ kính che, người đứng chéo và người ngồi xa nhìn thấy rõ hơn. Đây là chỗ người chơi học được rằng **không có một vị trí nào an toàn cho mọi thứ**. Muốn giấu tay thì lộ lò; muốn giấu lò thì lộ tay.
2. **Cột `UNDER_COUNTER` gần như bằng 0 ở mọi slot.** Đây là **van an toàn** của cả hệ thống. Phải có một chỗ mà người chơi biết chắc là kín, nếu không thì mọi quyết định đều là đánh cược. Nhưng thao tác dưới gầm tủ **chậm hơn 1,8×** (xem `P1-01`) — nên nó là một đánh đổi rõ ràng, không phải một lỗ hổng.
3. **`QUEUE_3` × `HANDS` = 0.20** in đậm trong CANON vì nó là con số định nghĩa "hàng chờ dài thì thêm mắt nhìn, nhưng mắt ở xa thì yếu". Với `DROPPED_FOOD` (75), một người ở `QUEUE_3` nhìn chằm chằm cần **6,7 giây** mới chắc — dài hơn vòng đời của kích thích. Nghĩa là: **hàng chờ dài không làm tăng rủi ro tuyến tính**, nó chỉ tăng ở hai slot đầu. Đây là điều cần thiết để ràng buộc kinh tế "thông lượng giờ cao điểm" (CANON §13.3) không biến giờ cao điểm thành chết chắc.

**Vì sao bảng tra tĩnh đúng hơn viewcone ở bối cảnh này — ba lý do, không phải một:**

- **Lý do vật lý:** ở quầy bánh mì, **khoảng cách và góc đều là hằng số**. Khách không đi lại tự do. Họ đứng vào một trong 5 chỗ có sẵn (`FRONT_CENTER`, `FRONT_SIDE`, `QUEUE_2`, `QUEUE_3`, `SEATED_FAR`) và đứng yên ở đó cho tới khi tới lượt. Một viewcone đầy đủ sẽ dành 100% chi phí tính toán để tính lại đúng cùng một con số mỗi frame. Bảng tra là **memoization của một hàm hằng**.
- **Lý do trải nghiệm:** viewcone chính xác nghĩa là kết quả phụ thuộc vào frame animation hiện tại (đầu NPC đang xoay tới đâu, vai người chơi đang che tới đâu). Đó chính xác là thứ Naughty Dog vứt bỏ. Với bảng tra, người chơi nhìn thấy khách ở `QUEUE_2` là biết ngay con số, lần nào cũng vậy.
- **Lý do sản xuất:** bảng 5×4 = **20 số**, tune được bằng tay trong một buổi chiều, và ai cũng đọc hiểu được. Một viewcone cần tune bán kính, góc, suy giảm theo góc, peripheral falloff, raycast layer mask — và không ai trong team đọc được tại sao khách đó thấy.

> **Cấm mở rộng:** không thêm chiều thứ ba vào bảng này (ví dụ `[slot][zone][lighting]`). Nếu cần yếu tố ánh sáng/thời tiết, nó phải đi vào `occluderMul` như một nhân tử riêng. Bảng phải giữ được tính chất "20 số, in ra một tờ A4 là tune được".

---

### 2.4. Cơ chế nạp/xả kiểu capacitor — ba nguồn công nghiệp, một mô hình

`idea.md` §18.2 dẫn ba nguồn cho cùng một hình dạng đường cong:

| Nguồn | Điều họ làm | Điều ta lấy |
|---|---|---|
| **Thief** (Looking Glass) | Awareness là **chuỗi state rời rạc**. Tăng thì **nhảy thẳng** lên state mới; giảm thì **tụt dần kiểu capacitor** | 4 state rời rạc + bất đối xứng lên/xuống |
| **Crytek TTP** (Target Tracking Perception) | **ADSR envelope**: Attack / Decay / Sustain / Release, các peak ở 25 / 50 / 100 | Có giai đoạn **hold** giữa lúc kích thích tắt và lúc bắt đầu xả |
| **The Last of Us** | **Timer hai chiều**, ngưỡng ~1–2 giây | Con số 1,4s của hiệu chỉnh gốc, và luật "lên nhanh xuống chậm" |

**Mô hình hợp nhất — ADSR đầy đủ:**

```
     certainty
        1.0 ┤        ╭────── CONFIRMED (latch, không xả nữa)
            │       ╱
       0.70 ┤   ╭──╯ ─────────╮                NOTICED
            │  ╱               ╲___
       0.35 ┤ ╱                     ╲____      GLIMPSED
            │╱                           ╲____
        0.0 ┼──────────┬──────┬──────────────── UNAWARE
            A (attack)  S(hold) R (release)
            kích thích  1,5s    decayRate
            còn sống    giữ     theo band
```

- **A — Attack.** Trong khi `stim.alive == true`: `certainty += rate * dt`. Tốc độ do §2.2 quyết định. Không có "attack boost" — attack chính là `rate`.
- **S — Hold (Sustain).** Khi `stim.alive` chuyển thành `false` (bạn nhặt ổ bánh lên, bạn rửa tay, bạn gói xong cái bánh), `certainty` **giữ nguyên** trong `HOLD_TIME = 1.5s`. Đây là chi tiết của Crytek và là chi tiết quan trọng nhất về mặt cảm giác: nó tạo ra khoảnh khắc *"mình vừa giấu kịp, nhưng bả vẫn còn đang nhíu mày"*. Không có hold, kích thích tắt là mặt NPC giãn ra ngay lập tức → trông như máy.
- **R — Release.** Sau `HOLD_TIME`, xả theo band:

| Band certainty | `decayRate` (/s) | Thời gian xả về 0 từ đỉnh band | Lý do |
|---|---|---|---|
| `[0.70, 1.00)` — NOTICED | **0.06** | 5,0s xuống 0.70 rồi tiếp | Đã gần chắc thì khó quên. Đây là chỗ căng thẳng nhất |
| `[0.35, 0.70)` — GLIMPSED | **0.12** | 2,9s | Liếc thấy thì quên được |
| `[0.00, 0.35)` — UNAWARE | **0.25** | 1,4s | Về 0 nhanh, giải phóng object |
| `>= 1.00` — CONFIRMED | **0** | không bao giờ | **Latch.** Xem §2.9 |

Tổng thời gian xả từ `0.95` về `0`: `1.5 (hold) + 4.2 (0.95→0.70) + 2.9 (0.70→0.35) + 1.4 (0.35→0)` = **10,0 giây**. Đối chiếu: tăng từ 0 lên 0.95 ở kịch bản `DROPPED_FOOD` nhìn thẳng mất **1,33 giây**. Tỉ lệ lên/xuống ≈ **1 : 7,5**. Đó là con số "tăng nhanh, giảm chậm" mà Thief mô tả, và nó có hệ quả gameplay trực tiếp:

> **Đừng gây hai lỗi liên tiếp.** Vì `certainty` chưa xả hết, lỗi thứ hai bắt đầu tích luỹ từ một nền cao. Người chơi sẽ tự phát hiện ra luật này sau 2–3 ngày chơi mà không cần tutorial. Đây là chỗ hệ thống "dạy" mà không giảng.

**Nạp có nền — `residue`.** Khi một `Observation` chết (certainty về 0), NPC giữ lại một `residue` rất nhỏ theo **kind**:

```ts
npc.residue[kind] = min(0.20, npc.residue[kind] + 0.05)   // mỗi lần suýt bị bắt cùng loại lỗi
// residue tự xả 0.02/phút trong ngày, và reset về 0 mỗi sáng
```
`certainty` của observation mới cùng kind khởi tạo bằng `npc.residue[kind]` thay vì `0`. Hệ quả: lần đầu làm rớt bánh trước mặt bà Bảy thì an toàn nếu bả đang bấm điện thoại; lần thứ tư trong cùng một buổi sáng thì không. **Đây là cầu nối trực tiếp sang chống ăn gian (g)** — xem §2.12.

---

### 2.5. `gazeFactor` — máy trạng thái ánh nhìn

Đây là nhân tử duy nhất **thay đổi nhanh theo thời gian thực**, và vì vậy là nhân tử mà người chơi phải đọc liên tục. **Điều kiện bắt buộc (`idea.md` §18.2): gaze phải được VẼ RA.** Nếu khách bấm điện thoại rồi bạn làm rớt bánh mà không sao, người chơi phải **nhìn thấy lý do** — không phải suy ra sau.

#### 2.5.1. Bảng trạng thái

| State | `gazeFactor` | Thời lượng (s) | Biểu hiện hình ảnh bắt buộc | Âm thanh |
|---|---|---|---|---|
| `LOOK_HANDS` — nhìn tay bạn | **1.00** | 2,5–6,0 | Đầu cúi ~15°, con ngươi khoá vào sprite tay người chơi, **chấm sáng nhỏ ở khoé mắt** | — |
| `LOOK_FACE` — nhìn mặt bạn | **0.35** | 1,5–4,0 | Đầu ngẩng ngang, con ngươi khoá vào mặt người chơi | — |
| `IDLE_SCAN` — nhìn lơ đãng quanh hẻm | **0.45** | 2,0–5,0 | Đầu quét chậm trái–phải, biên độ 20°, **không khoá vào gì** | tiếng đường phố nổi lên |
| `PHONE` — bấm điện thoại | **0.05** | **2,0–3,0** (cứng) | Cúi 35°, sprite điện thoại trong tay, **ánh xanh hắt lên mặt** | tiếng notification khẽ khi bắt đầu |
| `COMPANION` — nói chuyện với người đi cùng | **0.15** | 3,0–8,0 | Xoay thân 40° khỏi quầy, miệng mấp máy, NPC kia gật | murmur hai giọng, pan sang bên |
| `WATCH` — nhìn đồng hồ / điện thoại xem giờ | **0.20** | 1,0–2,0 | Lật cổ tay, **đầu lắc nhẹ một cái** | tiếng tặc lưỡi |
| `AWAY_RAIN` — quay đi trú mưa | **0.10** | 4,0–12,0 | Xoay lưng 120°, so vai, tay che đầu hoặc kéo áo | mưa to lên |
| `DRINKING` — cúi uống trà đá | **0.08** | **2,0–3,0** | Ngửa cổ, ly che mặt | tiếng đá lanh canh |

> **`PHONE` và `DRINKING` bị khoá cứng 2–3 giây.** Đây là bịt lỗ ăn gian **(a) Farm cửa sổ điện thoại** (CANON §8a). Chi tiết ở §7.1.

#### 2.5.2. Đồ thị chuyển trạng thái

```
                    ┌──────────────────────────────────────┐
                    │                                      │
        ┌───────────▼──────────┐   khách gọi món /         │
        │      IDLE_SCAN       │   người chơi hỏi          │
        │      gaze 0.45       │──────────────┐            │
        └──┬────┬────┬────┬────┘              ▼            │
           │    │    │    │            ┌─────────────┐     │
  tiếng    │    │    │    │ chờ>8s     │  LOOK_FACE  │     │
  động ────┤    │    │    └───────────▶│  gaze 0.35  │─────┤
  gần quầy │    │    │                 └──────┬──────┘     │
           ▼    │    │    ┌───────────────────┘            │
    ┌───────────▼──┐ │    │ hết câu                        │
    │  LOOK_HANDS  │ │    ▼                                │
    │  gaze 1.00   │ │  ┌──────────┐  hết 1–2s             │
    └───────┬──────┘ │  │  WATCH   │──────────────────────▶┤
            │        │  │gaze 0.20 │                       │
    hết 2.5–6s       │  └──────────┘                       │
            │        │                                     │
            └────────┤  ┌──────────┐  hết 2–3s (CỨNG)      │
                     ├─▶│  PHONE   │──────────────────────▶┤
       phoneBudget>0 │  │gaze 0.05 │                       │
                     │  └──────────┘                       │
                     │  ┌──────────┐  hết 3–8s             │
     có người đi cùng├─▶│COMPANION │──────────────────────▶┤
                     │  │gaze 0.15 │                       │
                     │  └──────────┘                       │
                     │  ┌──────────┐  tạnh mưa             │
     mưa && !có dù   ├─▶│AWAY_RAIN │──────────────────────▶┤
                     │  │gaze 0.10 │                       │
                     │  └──────────┘                       │
                     │  ┌──────────┐  hết 2–3s (CỨNG)      │
     nhận trà đá ────┴─▶│ DRINKING │──────────────────────▶┘
                        │gaze 0.08 │
                        └──────────┘
```

#### 2.5.3. Luật chuyển trạng thái — đầy đủ

```ts
const GAZE_TABLE: Record<GazeState, { g: number; dur: [number, number]; hard?: true }> = {
  LOOK_HANDS: { g: 1.00, dur: [2.5, 6.0] },
  LOOK_FACE:  { g: 0.35, dur: [1.5, 4.0] },
  IDLE_SCAN:  { g: 0.45, dur: [2.0, 5.0] },
  PHONE:      { g: 0.05, dur: [2.0, 3.0], hard: true },
  COMPANION:  { g: 0.15, dur: [3.0, 8.0] },
  WATCH:      { g: 0.20, dur: [1.0, 2.0] },
  AWAY_RAIN:  { g: 0.10, dur: [4.0, 12.0] },
  DRINKING:   { g: 0.08, dur: [2.0, 3.0], hard: true },
};

function gazeTick(npc: Npc, dt: number, ctx: StallCtx) {
  npc.gazeTimer -= dt;

  // --- 1. Ngắt ƯU TIÊN CAO: không đợi hết timer ---
  //     Tiếng động gần quầy kéo mắt về tay. Đây là cách DROPPED_FOOD "tự lộ".
  if (ctx.loudCueThisFrame && npc.gazeState !== 'PHONE' && npc.gazeState !== 'DRINKING') {
    return enterGaze(npc, 'LOOK_HANDS', ctx);
  }
  //     Người chơi hỏi một câu → khách nhìn MẶT (công cụ chủ động §2.8)
  if (npc.pendingQuestion) {
    npc.pendingQuestion = false;
    return enterGaze(npc, 'LOOK_FACE', ctx);
  }
  //     Trạng thái CỨNG không bị ngắt bởi bất cứ gì — kể cả tiếng động
  if (GAZE_TABLE[npc.gazeState].hard && npc.gazeTimer > 0) return;

  if (npc.gazeTimer > 0) return;

  // --- 2. Chọn state kế tiếp theo BẢNG TRỌNG SỐ TẤT ĐỊNH ---
  //     Không roll. Dùng shuffle-bag theo NPC (core/shufflebag.ts) với seed ngày.
  const bag = npc.gazeBag;              // đã nạp sẵn theo profile bên dưới
  let next = bag.draw();

  // --- 3. Lọc theo điều kiện cứng ---
  if (next === 'PHONE'     && npc.phoneBudget <= 0) next = 'IDLE_SCAN';
  if (next === 'COMPANION' && !npc.companion)       next = 'IDLE_SCAN';
  if (next === 'AWAY_RAIN' && !(ctx.raining && !npc.hasUmbrella)) next = 'IDLE_SCAN';
  if (next === 'WATCH'     && npc.patience > 0.6)   next = 'IDLE_SCAN';
  if (ctx.raining && !npc.hasUmbrella && !ctx.playerOfferedUmbrella) next = 'AWAY_RAIN';

  enterGaze(npc, next, ctx);
}

function enterGaze(npc: Npc, s: GazeState, ctx: StallCtx) {
  const e = GAZE_TABLE[s];
  npc.gazeState = s;
  // Thời lượng lấy tất định từ seed ngày + index lần chuyển, KHÔNG phải rng runtime
  npc.gazeTimer = lerp(e.dur[0], e.dur[1], ctx.dayNoise(npc.id, npc.gazeTransitionCount++));
  npc.gazeFactor = e.g;
  if (s === 'PHONE') npc.phoneBudget -= 1;
  playGazeAnim(npc, s);          // BẮT BUỘC — không có anim thì không được đổi state
}
```

#### 2.5.4. `gazeBag` theo NPC — tính cách nổi lên từ mật độ, không cần code riêng

Mỗi NPC có một túi 20 vé. Đây là toàn bộ "AI" của tầng gaze:

| NPC | LOOK_HANDS | LOOK_FACE | IDLE_SCAN | PHONE | COMPANION | WATCH | `phoneBudget`/lượt |
|---|---|---|---|---|---|---|---|
| **Bà Bảy** (soi 0.9) | 9 | 4 | 5 | 0 | 2 | 0 | **0** |
| **Chị Lan** (soi 0.9, khép kín) | 8 | 1 | 4 | 5 | 0 | 2 | 2 |
| **Thầy Phúc** (soi 0.8) | 7 | 5 | 6 | 0 | 2 | 0 | 0 |
| **Chú Kiệt** (soi 0.7) | 8 | 3 | 7 | 0 | 0 | 2 | 0 |
| **Cô Mai** (soi 0.6) | 5 | 5 | 6 | 2 | 2 | 0 | 1 |
| **Ông Hải** (soi 0.5) | 4 | 6 | 8 | 0 | 2 | 0 | 0 |
| **Chị Hạnh** (soi 0.5) | 5 | 4 | 7 | 3 | 0 | 1 | 1 |
| **Bé Su** (soi 0.4) | 3 | 3 | 5 | **7** | 2 | 0 | 3 |
| **Bà Sáu** (soi 0.4) | 4 | 6 | 8 | 0 | 2 | 0 | 0 |
| **Chú Tư** (soi 0.3) | 3 | 4 | 7 | 2 | 0 | **4** | 1 |
| **Anh Bảo** (soi 0.3) | 2 | 1 | 4 | **11** | 0 | 2 | **4** |
| **Anh Dũng** (soi 0.2) | 2 | 3 | 5 | 4 | 0 | **6** | 2 |

Đọc bảng này là đọc cả dàn nhân vật:
- **Bà Bảy `phoneBudget = 0`** — bả không xài điện thoại. Không có cửa sổ nào để farm. Nhưng bả `deTha 0.8`, nên bị bắt cũng không chết. **Đó là lý do bả là NPC an toàn để học luật** (CANON §9).
- **Anh Bảo 11/20 vé `PHONE` + budget 4** — `gazeFactor` thấp nhất dàn, đúng vai trò "sandbox để người chơi học hệ perception" (CANON §9).
- **Anh Dũng 6/20 vé `WATCH`** — anh luôn vội. Cái `WATCH` của anh không chỉ hạ gaze, nó còn là **tín hiệu hình ảnh cho `MADE_THEM_WAIT`** (§2.11). Hai hệ thống dùng chung một animation.
- **Chị Lan có `PHONE`** nhưng `LOOK_HANDS` 8/20 và `soi 0.9` — cửa sổ có, nhưng hẹp và đắt. Chị là NPC nguy hiểm nhất.

---

### 2.6. `occluderMul` — vật chắn

| Vật chắn | `occluderMul` | Người chơi chủ động được? | Ghi chú |
|---|---|---|---|
| Không có gì | **1.00** | — | Mặc định |
| Khách khác đứng chen phía trước (chỉ áp cho slot sau) | 0.70 | Không (do hàng chờ) | `QUEUE_3` bị `QUEUE_2` che một phần |
| Hơi nước / khói từ lò đang nóng | 0.80 | Gián tiếp (bật lò) | Chỉ áp cho zone `OVEN` và `BOARD` |
| Ổ bánh / xấp giấy gói dựng đứng trên thớt | **0.60** | **Có** | Đặt 1 thao tác, 0,4s |
| Nắp tủ kính hạ xuống một nửa | 0.55 | **Có** | Nhưng lấy đồ trong tủ chậm hơn 1,4× |
| Thân người chơi xoay nghiêng che tay | **0.45** | **Có** | Giữ phím/nút; **thao tác chậm 1,3×** khi đang che |
| Cái dù che nghiêng lúc mưa | 0.35 | **Có** | Chỉ khả dụng khi trời mưa. Đồng thời là `CARED_FOR_THEM` nếu che cho khách |
| **Cô Ba đứng tiếp khách, chắn giữa** | **0.25** | Bán chủ động | Chỉ 1 khách, 20–40s, 2 lần/ngày (§2.8) |

**Luật cộng gộp:**

```ts
function occluderMul(npc: Npc, zone: Zone, ctx: StallCtx): number {
  let m = 1.0;
  for (const o of ctx.occluders) {
    if (!o.blocks(npc.slot, zone)) continue;
    m *= o.value;
  }
  return Math.max(0.15, m);     // SÀN CỨNG 0.15 — không bao giờ tàng hình hoàn toàn
}
```

**Vì sao có sàn 0.15:** nếu chồng ba vật chắn cho ra `0.45 × 0.60 × 0.25 = 0.0675`, `DROPPED_FOOD` trước mặt khách nhìn thẳng sẽ cần **20,8 giây** — tức là tàng hình. Một chiến thuật làm người chơi **bất khả xâm phạm** sẽ giết cả cơ chế nhanh hơn là một chiến thuật quá yếu, vì nó biến phần còn lại của game thành thừa. Sàn `0.15` giữ cho trường hợp tốt nhất là **9,4 giây** — đủ để xử lý một lỗi, không đủ để sống trong đó. Ngoài ra mọi occluder chủ động đều **làm chậm thao tác**, nên "trốn trong góc kín" tự trả giá bằng `MADE_THEM_WAIT` (salience 100, bỏ qua gaze).

---

### 2.7. `traitMul` — suy ra từ `soi`

CANON §4: `soi: 0..1 — kỹ tính ↔ xuề xoà → traitMul ở tầng nhận thấy`. Công thức:

```ts
const TRAIT_BASE = 0.65;
const TRAIT_SPAN = 0.70;

function traitMul(npc: Npc, ctx: StallCtx): number {
  let t = TRAIT_BASE + TRAIT_SPAN * npc.personality.soi;   // 0.65 .. 1.35

  // (1) Quầy bẩn làm MỌI khách soi hơn — CANON §3.3
  t *= 1 + 0.35 * ctx.stallDirt;                           // dirt 0..1

  // (2) Tâm trạng ngoài tầm kiểm soát của người chơi (idea.md §9.2 mục 20)
  //     Vừa bị sếp mắng → soi hơn. Vừa trúng số → xuề xoà hơn.
  t *= npc.moodSoiMul;                                     // 0.85 .. 1.25

  // (3) Quan hệ: người thân quen KHÔNG soi hơn, nhưng cũng không soi kém hơn.
  //     Đây là chỗ KHÔNG được đụng vào — xem ghi chú bên dưới.

  // (4) Nghi ngờ tích luỹ từ phát hiện PATTERN (§2.12)
  t *= 1 + 0.40 * npc.suspicion;                           // suspicion 0..1

  return clamp(t, 0.50, 2.20);
}
```

Giá trị cho 12 NPC ở điều kiện chuẩn (`dirt = 0`, `mood = 1.0`, `suspicion = 0`):

| NPC | `soi` | `traitMul` | `t_confirm` cho DROPPED_FOOD, FRONT_CENTER, nhìn tay |
|---|---|---|---|
| Bà Bảy | 0.9 | **1.280** | 1,10 s |
| Chị Lan | 0.9 | **1.280** | 1,10 s |
| Thầy Phúc | 0.8 | 1.210 | 1,16 s |
| Chú Kiệt | 0.7 | 1.140 | 1,23 s |
| Cô Mai | 0.6 | 1.070 | 1,31 s |
| Ông Hải | 0.5 | **1.000** | **1,40 s** ← khách chuẩn |
| Chị Hạnh | 0.5 | **1.000** | **1,40 s** ← khách chuẩn |
| Bà Sáu | 0.4 | 0.930 | 1,51 s |
| Bé Su | 0.4 | 0.930 | 1,51 s |
| Chú Tư | 0.3 | 0.860 | 1,63 s |
| Anh Bảo | 0.3 | 0.860 | 1,63 s |
| Anh Dũng | 0.2 | **0.790** | 1,78 s |

> **Hằng số được chọn để `soi = 0.5` cho `traitMul = 1.000` đúng bằng 1.** Nhờ vậy "khách chuẩn" trong mọi bảng hiệu chỉnh của doc này là một NPC có thật trong game (Ông Hải, Chị Hạnh), không phải một con số tưởng tượng. Khi tune, mở game, cho Ông Hải đứng `FRONT_CENTER`, làm rớt bánh → phải đúng **1,4 giây**.

**Ghi chú cứng — không nối `traitMul` với quan hệ.** Cám dỗ rất lớn: "khách thân thì bỏ qua cho mình, `traitMul` thấp hơn". **Không.** Hai lý do:
1. Nó biến quan hệ thành **tài nguyên để tiêu**, đúng thứ mà chống ăn gian (d) *"đốt NPC rồi để nguội"* muốn chặn.
2. Nó sai về mặt con người: người thân với bạn **thấy rõ hơn**, không mờ hơn. Cái khác là **họ phản ứng thế nào sau khi thấy** — và đó là việc của tầng 2 (`deTha`), không phải tầng 1.

---

### 2.8. Công cụ chủ động hạ attention — BẮT BUỘC có

> **Không có mục này thì cơ chế lõi là cờ bạc.** Nói chính xác hơn: nếu `gazeFactor` chỉ do NPC tự quyết và người chơi chỉ được *chờ*, thì chiến thuật tối ưu duy nhất là **đứng im chờ khách rút điện thoại** — tức là biến một game về tay nghề thành một game về **kiên nhẫn bấm nút đúng lúc**, và biến mọi thất bại thành *"xui"*. Yêu cầu của Minh (`idea.md` §18.2): phải có **công cụ chủ động**, để cơ chế chuyển từ **xổ số** sang **trò chơi vị trí và timing**.

CANON §5.4 liệt kê 5 công cụ. Đây là thiết kế đầy đủ từng cái.

#### Công cụ 1 — Đưa ly trà đá

| Thuộc tính | Giá trị |
|---|---|
| Thao tác | Kéo ly từ thùng đá → thả lên mặt quầy trước khách. **1 thao tác, 1,1 giây** |
| Chi phí vật chất | 1 ly trà đá = **~350₫** (đá + trà + ly nhựa). Nguồn hữu hạn: **18 ly/ngày** từ thùng đá buổi sáng |
| Hiệu ứng | Khách vào `DRINKING`, `gazeFactor = 0.08`, **2,0–3,0 giây** (khoá cứng) |
| Độ trễ | **0,6 giây** từ lúc thả ly tới lúc khách bắt đầu cúi. Phải tính vào timing |
| Cooldown | **45 giây / NPC**. Đưa ly thứ hai trong cooldown → khách không uống, chỉ gật cảm ơn (`gazeFactor` không đổi) |
| Tác dụng phụ | Đồng thời sinh `CARED_FOR_THEM` (salience 50, tích cực) |
| Diminishing returns | Lần 1 trong ngày: `CARED_FOR_THEM` đầy đủ. Lần 2: ×0.6. Lần 3+: ×0.25 **và** nếu `soi ≥ 0.7`, kích hoạt rule *"mua chuộc"* → xem §7.4 (chống ăn gian (i)) |
| **Cách người chơi học ra** | **Ngày 1, cô Ba làm mẫu.** Cô đưa ly trà cho bà Bảy rồi nói: *"Trời nóng vầy đưa người ta ly trà đá đi con. Mà lúc người ta uống thì con tranh thủ làm cho lẹ."* — Đúng một câu, dạy cả hai công dụng, không có tooltip |

#### Công cụ 2 — Hỏi một câu

| Thuộc tính | Giá trị |
|---|---|
| Thao tác | Nút "hỏi thăm" (nút duy nhất trên màn hình không phải nguyên liệu). **Người chơi không chọn nội dung câu hỏi** — T2: không có dialogue tree. Rule DB chọn câu theo context |
| Chi phí vật chất | **0₫** |
| Chi phí thật | **Thời gian: 2,2–3,5 giây** người chơi không thao tác được (tay đang nói chuyện). Trong giờ cao điểm đây là chi phí nặng |
| Hiệu ứng | Khách chuyển `LOOK_FACE`, `gazeFactor = 0.35` (từ 1.00 nếu đang `LOOK_HANDS` → **giảm 65%**), 1,5–4,0 giây |
| Điểm tinh tế | **Đây là công cụ duy nhất KHÔNG giấu được gì hoàn toàn.** `0.35` vẫn là con số thật. Nó **kéo dài thời gian an toàn**, không tạo vùng an toàn. Đúng tinh thần "không có tàng hình" |
| Tác dụng phụ | Nếu câu hỏi khớp memory slot → `REMEMBERED_STORY` (salience 70). Nếu hỏi trật (hỏi chuyện của NPC khác) → **phản tác dụng**: khách nhíu mày, `traitMul` ×1.15 trong 30s |
| Cooldown | **60 giây / NPC**, và `speakonce` theo từng chủ đề |
| **Cách người chơi học ra** | **Bằng tai nạn.** Ngày 2, hệ thống cho chú Tư kể một chuyện ngắn khi người chơi bấm nút. Trong lúc chú kể, tay người chơi rảnh và một `DIRTY_HANDS` đang tích luỹ **dừng lại rõ rệt** (dấu `?` trên đầu chú mờ đi). Camera **không** highlight. Người chơi nào không thấy lần đầu sẽ thấy lần thứ ba |

#### Công cụ 3 — Đặt thân mình / ổ bánh che tầm nhìn

| Thuộc tính | Giá trị |
|---|---|
| Thao tác | **Giữ nút phụ** (chuột phải / L1) → nhân vật xoay nghiêng 40°. Hoặc kéo ổ bánh/xấp giấy dựng đứng lên thớt (1 thao tác, 0,4s) |
| Chi phí | **Thao tác chậm 1,3×** khi đang xoay nghiêng. Ổ bánh dựng đứng chiếm 1 ô thớt |
| Hiệu ứng | `occluderMul` = 0.45 (thân) hoặc 0.60 (ổ bánh). Chồng được: `0.27` |
| Điều kiện | Chỉ chắn zone `HANDS` và `BOARD`. **Không chắn `OVEN`** — đó là lý do cột `OVEN` tồn tại |
| Giới hạn | Chỉ chắn được khách ở `FRONT_CENTER` và `FRONT_SIDE`. Khách `QUEUE_2` đứng lệch → `blocks()` trả `false`. **Che được người này là lộ ra với người kia** |
| **Cách người chơi học ra** | **Bằng thất bại có thông tin.** Lần đầu người chơi xoay nghiêng che bà Bảy thì chị Lan ở `QUEUE_2` lên tiếng. Bark tier-1 của chị Lan trong tình huống này nói thẳng vị trí: *"...chị đứng đây chị thấy nha."* Đó là tutorial |

#### Công cụ 4 — Chọn đứng bên trái / bên phải xe

| Thuộc tính | Giá trị |
|---|---|
| Thao tác | Di chuyển người chơi sang trái/phải xe. **1,2 giây** đi bộ. Không tức thì |
| Chi phí | Mỗi bên chỉ với tới **một số zone**: bên trái = `OVEN` + `BOARD`; bên phải = `BOARD` + `UNDER_COUNTER`. Đứng giữa = với được hết nhưng **lộ nhất** |
| Hiệu ứng | Đổi `zone` đang lộ, **không** đổi `visibility` — chính là đổi **cột** trong bảng §2.3 |
| Điểm tinh tế | Đây là công cụ duy nhất có hiệu lực **vô thời hạn**, không cooldown. Đổi lại nó **chậm nhất** và **ràng buộc nhất**. Đây là công cụ của người chơi biết nghĩ trước, không phải của người chơi phản xạ nhanh |
| **Cách người chơi học ra** | Bố cục xe **dạy bằng hình**: cái lò nằm lệch trái, có khói bốc; gầm tủ nằm bên phải, có rèm vải. Người chơi thử là thấy. Không có dòng chữ nào |

#### Công cụ 5 — Cô Ba đứng tiếp khách

| Thuộc tính | Giá trị |
|---|---|
| Thao tác | **Không phải nút bấm.** Cô Ba tự bước ra khi: (a) hàng chờ ≥ 3, **hoặc** (b) người chơi đứng yên ≥ 4 giây ở chế độ "đang rối" |
| Chi phí | **Không có chi phí tiền.** Nhưng **tần suất giới hạn: 2 lần/ngày**, và **cô không bao giờ làm bánh** (CANON §7.4, §10) |
| Hiệu ứng | Chuyển gaze của **đúng MỘT** khách (người ở `FRONT_CENTER`) sang cô Ba. `occluderMul = 0.25` + `gazeFactor` khoá ở `0.15` trong **20–40 giây** |
| Ràng buộc thiết kế | Cô chỉ tiếp khách — hỏi thăm, thối tiền, đưa trà. Nếu người chơi cố đưa bánh chưa xong cho cô, cô đẩy lại: *"Con làm đi, cô đứng nói chuyện với bả thôi."* |
| **Cách người chơi học ra** | Không cần học. Nó là **lưới an toàn cho người chơi đang rối**, và là món quà chứ không phải công cụ tối ưu. Nếu người chơi bắt đầu cố tình gây rối để triệu hồi cô Ba, điều kiện (b) sẽ không thoả vì nó yêu cầu **đứng yên** — tức là mất thời gian thật |

#### 2.8.1. Vì sao 5 công cụ này, và không thêm

Kiểm tra phủ: mỗi công cụ hạ **một nhân tử khác nhau** của công thức, và mỗi công cụ trả **một loại giá khác nhau**.

| Công cụ | Hạ nhân tử | Trả giá bằng | Thời gian hiệu lực |
|---|---|---|---|
| Trà đá | `gazeFactor` → 0.08 | **Tiền + tài nguyên hữu hạn** | 2–3 s |
| Hỏi một câu | `gazeFactor` → 0.35 | **Thời gian tay người chơi** | 1,5–4 s |
| Che thân/bánh | `occluderMul` → 0.45/0.60 | **Tốc độ thao tác** | Vô hạn (trong lúc giữ) |
| Đổi chỗ đứng | `visibility` (đổi cột) | **Tầm với — không làm được việc khác** | Vô hạn |
| Cô Ba | `occluderMul` + `gazeFactor` | **Tần suất (2 lần/ngày)** | 20–40 s |

Không có công cụ nào hạ `salience` (nhà thiết kế giữ) và không có công cụ nào hạ `traitMul` (NPC giữ). Đó là ranh giới: **người chơi điều khiển được bối cảnh, không điều khiển được bản chất việc mình vừa làm, cũng không điều khiển được con người khách**.

---

### 2.9. Bốn state và biểu hiện hình ảnh bắt buộc

CANON §5. **"Bắt buộc" ở đây nghĩa là: không có asset thì không được bật state.** Một state không vẽ ra được là một state không tồn tại đối với người chơi — và đó chính là vi phạm T5.

| Certainty | State | Sprite / Animation | Âm thanh | Kéo dài | Ghi chú kỹ thuật |
|---|---|---|---|---|---|
| `< 0.35` | `UNAWARE` | Không có gì. Giữ nguyên gaze anim hiện tại | — | — | **Không** allocate `Observation` nếu `rate == 0` |
| `0.35 – 0.70` | `GLIMPSED` | **(a)** Đầu quay về zone kích thích trong **0,35s** (tween ease-out), **(b)** dấu `?` nhỏ 12px hiện phía trên vai, fade-in 0,2s, **giữ nguyên** trong suốt band, **(c)** lông mày layer `brow_03` (hơi nhướng) | **Tiếng vải áo sột soạt** khi quay đầu. −18 dB, chỉ nghe được nếu khách ở `FRONT_*` | Cho tới khi đổi band | Dấu `?` dùng **hình dáng khác nhau** cho 3 loại kích thích: `?` (thị giác) / `♪?` (âm thanh) / `~?` (mùi) — CANON §15, phân biệt bằng hình không phải màu |
| `0.70 – 1.00` | `NOTICED` | **(a)** Nhíu mày `brow_05`, **(b)** mắt `eye_04` (hơi nheo), **(c)** **thân nghiêng về trước 6px** (spring, kỹ thuật Rain World — không tốn sprite), **(d)** dấu `?` đổi thành `!` mờ | **Bark tier-1** sau độ trễ **0,2–0,4 s** (chống twinning, CANON §11). **35% số lần KHÔNG nói gì** — chỉ đổi mặt | Cho tới khi đổi band | Bark tier-1 có cooldown riêng theo (npc × kind). Hết cooldown → tier-2 → tier-3 (*"Hửm."*) |
| `≥ 1.00` | `CONFIRMED` | **(a)** Phản ứng đầy đủ do tầng 3 quyết định (nét mặt + ngôn ngữ cơ thể + bark + hành động), **(b)** dấu `!` đặc, **(c)** **latch** — certainty khoá ở 1.0, không xả | Bark tier-1 đầy đủ + âm báo tuỳ loại (có nút tắt riêng, CANON §15.4) | **Vĩnh viễn trong lượt khách này** | Ghi `Memory`, ảnh hưởng `tip`, có thể seed gossip |

**Chi tiết bắt buộc về `GLIMPSED`:** dấu `?` **không nhấp nháy**. Nhấp nháy đọc như "đang loading". `?` hiện ra và **đứng yên** — nghĩa là *"người này đang phân vân"*. Nó chỉ biến mất khi certainty tụt xuống dưới `0.35`, và nó biến mất bằng **fade 0,4s**, không phải pop.

**Chi tiết bắt buộc về chuyển band:** chuyển **lên** band là **nhảy thẳng** (Thief). Chuyển **xuống** band là **fade 0,4s**. Bất đối xứng này là thứ làm người chơi cảm thấy *"bị bắt"* thay vì *"đang bị theo dõi"*.

**Chi tiết bắt buộc về latch:** khi `certainty >= 1.0`, đặt `obs.latched = true` và **ngừng gọi `tick`** cho observation đó. Một `CONFIRMED` không thể quay về `NOTICED`. Người ta không quên cái mình vừa thấy rõ trong vòng ba mươi giây. Việc "quên" là việc của tầng trí nhớ (`P2-02`, decay theo ngày), không phải tầng này.

---

### 2.10. `perceptionTick(dt)` — duyệt loop từ phía SỰ KIỆN

#### 2.10.1. Bài học Mark of the Ninja

Bản đầu của *Mark of the Ninja* (Klei) polling **từ phía NPC**: mỗi frame, mỗi guard quét xem "có gì đáng chú ý quanh tôi không". Hệ quả quan sát được trong playtest: **cả nhóm guard cùng chạy tới một bóng đèn vỡ**, vì tất cả cùng chạy cùng một truy vấn trên cùng một dữ liệu trong cùng một frame và cùng ra một kết quả.

Vấn đề không phải hiệu năng. Vấn đề là **ngữ nghĩa**: khi NPC là chủ thể của vòng lặp, kích thích trở thành **dữ liệu toàn cục** mà ai cũng truy vấn được như nhau → mất tính cá nhân của việc "ai thấy".

Đảo lại: **sự kiện là chủ thể**. Mỗi `Stimulus` **tự giữ danh sách khán giả của nó** và tự quyết định nó chạm tới ai, với cường độ nào. Ba lợi ích:

1. **Ngữ nghĩa đúng.** Một `DROPPED_FOOD` ở zone `HANDS` biết rằng nó chỉ chạm tới người nhìn thấy `HANDS`. Nó **không** tồn tại đối với người ở `SEATED_FAR`.
2. **Chi phí đúng.** Không có kích thích nào sống thì **vòng lặp không chạy**. Trong game này, phần lớn thời gian là không có gì đang xảy ra.
3. **Debug đúng.** Muốn biết "tại sao bả thấy" → mở `stim.audience`, in ra 5 nhân tử. Một dòng log giải thích được toàn bộ.

Cộng thêm, từ `P1-01`: **danh sách khán giả được cache**, chỉ rebuild khi có khách đổi slot (vào hàng / rời hàng / bước lên) — trung bình **2–4 lần / khách**, không phải mỗi frame.

#### 2.10.2. Pseudocode đầy đủ

```ts
// ────────────────────────────────────────────────────────────────
// sim/perception.ts  —  KHÔNG ĐƯỢC CÓ MỘT LỜI GỌI rng() NÀO Ở ĐÂY
// ────────────────────────────────────────────────────────────────

const HOLD_TIME = 1.5;
const DECAY = { NOTICED: 0.06, GLIMPSED: 0.12, UNAWARE: 0.25 };
const BAND = { GLIMPSED: 0.35, NOTICED: 0.70, CONFIRMED: 1.00 };

const MAX_LIVE_STIMULI = 8;      // chặn trên cứng
const MAX_AUDIENCE     = 6;      // chặn trên cứng

function perceptionTick(dt: number, ctx: StallCtx): void {
  // ── 0. Cập nhật gaze của mọi NPC trong tầm (M ≤ 6) ─────────────
  for (const npc of ctx.audienceAll) gazeTick(npc, dt, ctx);

  // ── 1. Duyệt TỪ PHÍA SỰ KIỆN (N ≤ 8) ───────────────────────────
  for (let i = ctx.stimuli.length - 1; i >= 0; i--) {
    const stim = ctx.stimuli[i];

    // 1a. Kênh BYPASS: âm thanh / thời gian / hướng thẳng vào khách
    if (stim.channel !== 'VISUAL') { tickBypass(stim, dt, ctx); continue; }

    // 1b. Kích thích còn sống không?
    stim.age += dt;
    if (stim.alive && stim.age >= stim.lifetime) {
      stim.alive = false;
      stim.diedAt = ctx.now;
    }

    // 1c. Khán giả — cache, chỉ rebuild khi hàng chờ đổi
    if (stim.audienceDirty || ctx.queueVersion !== stim.queueVersion) {
      stim.audience = ctx.audienceAll
        .filter(n => visibility(n.slot, stim.zone) > 0)
        .slice(0, MAX_AUDIENCE);
      stim.queueVersion  = ctx.queueVersion;
      stim.audienceDirty = false;
    }

    // 1d. Với mỗi người trong khán giả (N × M ≤ 48)
    let anyAlive = false;
    for (const npc of stim.audience) {
      const obs = getOrCreateObs(npc, stim);      // lazy, xem 1f
      if (obs === null) continue;                 // rate == 0 → chưa allocate
      if (obs.latched) { anyAlive = true; continue; }

      if (stim.alive) {
        // ── ATTACK ──────────────────────────────────────────────
        const rate =
            stim.salience
          * visibility(npc.slot, stim.zone)       // O(1) tra bảng
          * occluderMul(npc, stim.zone, ctx)
          * npc.gazeFactor
          * traitMul(npc, ctx)
          / 100;

        obs.certainty += rate * dt;
        obs.lastRate   = rate;                    // để debug overlay
        obs.holdUntil  = ctx.now + HOLD_TIME;
      } else if (ctx.now >= obs.holdUntil) {
        // ── RELEASE ─────────────────────────────────────────────
        const band = obs.certainty >= BAND.NOTICED  ? 'NOTICED'
                   : obs.certainty >= BAND.GLIMPSED ? 'GLIMPSED'
                   : 'UNAWARE';
        obs.certainty -= DECAY[band] * dt;
      }
      // ── SUSTAIN: giữa diedAt và holdUntil thì không làm gì ────

      obs.certainty = clamp(obs.certainty, 0, 1.0);
      obs.peak = Math.max(obs.peak, obs.certainty);

      // ── Chuyển band + phát biểu hiện hình ảnh ─────────────────
      const next = bandOf(obs.certainty);
      if (next !== obs.state) {
        const goingUp = RANK[next] > RANK[obs.state];
        obs.state = next;
        emitPerceptionVisual(npc, obs, stim, goingUp);   // §2.9
        if (next === 'CONFIRMED') {
          obs.latched = true;
          bus.emit('PERCEPTION_CONFIRMED', { npc, stim, obs });
          // → tầng 2 (diễn giải) và tầng 4 (ghi nhớ) nghe event này
        }
      }

      if (obs.certainty > 0 || obs.latched) anyAlive = true;
      else killObs(npc, stim.id);                 // GC, ghi residue
    }

    // 1e. Thu hồi kích thích đã chết và không còn ai giữ observation
    if (!stim.alive && !anyAlive) ctx.stimuli.splice(i, 1);
  }

  // ── 2. Trạng thái tích luỹ (không phải kích thích) ──────────────
  tickStallCleanliness(dt, ctx);                  // §2.12
  tickPatternDetector(dt, ctx);                   // §2.13
}

// 1f. Lazy allocation — không tạo object cho người không thể thấy
function getOrCreateObs(npc: Npc, stim: Stimulus): Observation | null {
  let obs = npc.observations[stim.id];
  if (obs) return obs;
  if (!stim.alive) return null;

  const v = visibility(npc.slot, stim.zone);
  if (v === 0 || npc.gazeFactor * v * stim.salience < 0.5) return null;   // ngưỡng tối thiểu

  obs = {
    stimId: stim.id, npcId: npc.id, kind: stim.kind,
    certainty: npc.residue[stim.kind] ?? 0,        // ← nền từ §2.4
    state: 'UNAWARE', peak: 0, latched: false,
    firstSeenAt: nowSec(), holdUntil: 0, lastRate: 0,
    payload: stim.payload,
  };
  npc.observations[stim.id] = obs;
  return obs;
}
```

#### 2.10.3. Chi phí tính toán — chặn trên và budget

| Đại lượng | Chặn trên cứng | Lý do chặn ở đó | Xử lý khi vượt |
|---|---|---|---|
| **N** — kích thích đang sống | **8** | Thực tế cao nhất quan sát được: 1 `DIRTY_HANDS` + 1 `STALL` + 3 `ORDER_DEFECT` (3 bánh song song) + 1 `BURNT` + 1 `FLOURISH` = 7 | Kích thích mới **thay thế cái có `salience` thấp nhất**. Không queue, không drop im lặng — ghi warn vào console dev |
| **M** — khách trong tầm | **6** | `FRONT_CENTER` + `FRONT_SIDE` + `QUEUE_2` + `QUEUE_3` + 2 × `SEATED_FAR` | Khách thứ 7+ vào `PASSERBY`, không có `Observation`, chỉ nhận gossip |
| **N × M** | **48 cặp / frame** | — | — |
| Phép tính / cặp | ~14 flops + 1 tra mảng 2 chiều + 0 cấp phát | Không có sqrt, không có raycast, không có atan2 | — |
| **Tổng / giây @30fps** | 48 × 30 = **1.440 lượt cập nhật/s** | — | — |

**Budget đo được:**

| Chỉ số | Mục tiêu | Trần cứng | Cách đo |
|---|---|---|---|
| `perceptionTick` trung bình | **≤ 0,25 ms** / frame | **0,80 ms** | `performance.now()` bao quanh, log p50/p95/p99 mỗi 300 frame |
| `perceptionTick` p99 | ≤ 0,50 ms | **1,00 ms** | Đo ở kịch bản xấu nhất: 8 stim × 6 khách × mưa |
| Cấp phát / frame | **0 byte** ở trạng thái ổn định | — | `Observation` lấy từ **object pool 64 slot**; `stim.audience` là mảng tái dùng |
| Tỉ lệ ngân sách frame (33,3 ms @30fps) | **0,75 %** | 3 % | — |

**Vì sao budget thừa thãi tới mức này là đúng:** phần lớn ngân sách frame của game đi vào **layered sprite** (CANON §16 Đừng-4: 6 lông mày × 6 mắt × 6 miệng), tween ngôn ngữ cơ thể, và nền hẻm. Tầng perception phải rẻ tới mức **không bao giờ là lý do để cắt tính năng**. Nếu có lúc nào đó thấy cần tối ưu `perceptionTick`, gần như chắc chắn là ai đó đã lén nhét raycast vào.

---

### 2.11. `MADE_THEM_WAIT` và `WRONG_NAME` — hai kênh bỏ qua `gazeFactor`

CANON §3.1 ghi rõ cả hai đều salience **100**, và `WRONG_NAME` *"là âm thanh, nhắm thẳng vào khách → bỏ qua gazeFactor, luôn bị nghe thấy"*. Lý do chung: **`gazeFactor` mô hình hoá ánh nhìn**. Âm thanh không đi qua mắt, và thời gian chờ không đi qua giác quan nào cả — nó là thứ khách **cảm thấy trong người**.

Cả hai dùng chung nhánh `tickBypass()`, nhưng cơ chế khác hẳn nhau.

#### 2.11.1. `WRONG_NAME` — kênh AUDIO_DIRECTED

```ts
function tickBypassAudio(stim: Stimulus, dt: number, ctx: StallCtx) {
  const target = ctx.npcById(stim.targetNpcId);
  const obs = getOrCreateObs(target, stim);
  // visibility = 1.0, occluderMul = 1.0, gazeFactor = 1.0 — BỎ QUA HẾT
  // Chỉ traitMul được áp, và bị kẹp lại để không ai "điếc"
  const t = clamp(traitMul(target, ctx), 0.90, 1.10);
  obs.certainty += (stim.salience * t / 100) * dt;     // 100 × 1.0 / 100 = 1.0 /s
  // ...band transition như thường
}
```

- `rate ≈ 1,0 /s` → `CONFIRMED` sau **1,0 giây**. Câu gọi tên mất khoảng 0,8–1,2 giây để nói. **Nghĩa là: gọi sai tên thì bị bắt trước khi nói hết câu.** Đó là cảm giác đúng.
- **Không có công cụ chủ động nào hạ được nó.** Không trà đá, không che thân, không cô Ba. Đây là lỗi duy nhất trong game **không có cách nào giấu**. Cố ý: nó là FLAGSHIP (CANON §3.1), và nó phải là thứ người chơi sợ nhất.
- **Khán giả phụ.** Ngoài NPC bị gọi sai, mọi NPC ở `FRONT_*` và `QUEUE_2` nhận một `Observation` phụ với `salience = 45` và `gazeFactor = 1.0` (nghe được), zone ảo `AUDIO`. Họ không giận, nhưng họ **nhớ và kể lại** — nối thẳng vào mutation `WRONG_NAME --0.40--> "chảnh, không thèm nhớ khách"` (CANON §12).
- **Cửa sửa sai — 2,5 giây.** Nếu người chơi gọi lại đúng tên trong 2,5s kể từ lúc gọi sai, sinh `NAME_CORRECTED`: `certainty` của observation chính bị kẹp trần ở **0,85** (NOTICED, không lên CONFIRMED), bark đổi sang tier "tha thứ": *"Bà Tám nào? ...À thôi được rồi con, bà Bảy nè."* Đây là van an toàn bắt buộc cho một sự kiện salience 100 không giấu được.

#### 2.11.2. `MADE_THEM_WAIT` — kênh TIME, có leo thang theo giây

Đây không phải kích thích. Đây là một **đồng hồ chạy trong người khách**. Không có `visibility`, không có `occluderMul`, không có `gazeFactor`, và **`traitMul` cũng không áp** — vì soi hay không soi thì đợi lâu vẫn là đợi lâu. Thay vào đó nó dùng một chiều tính cách khác.

```ts
function tickWait(npc: Npc, dt: number, ctx: StallCtx) {
  if (!npc.isBeingServed && !npc.inQueue) return;

  // Ngưỡng kiên nhẫn CÁ NHÂN, suy ra từ lịch sinh hoạt + tính cách
  const base   = npc.patienceBaseSec;                 // bảng bên dưới
  const rush   = npc.schedule.isRushing(ctx.clock) ? 0.65 : 1.0;
  const bond   = { Rival: 0.8, Acquaintance: 1.0, Friend: 1.35 }[npc.tier];
  const T      = base * rush * bond;

  npc.waitSec += dt;
  const r = npc.waitSec / T;                          // 0..∞

  // Leo thang theo 4 nấc — mỗi nấc CÓ ANIMATION RIÊNG
  const step = r < 0.60 ? 0 : r < 0.85 ? 1 : r < 1.00 ? 2 : 3;
  if (step !== npc.waitStep) {
    npc.waitStep = step;
    switch (step) {
      case 1: playAnim(npc, 'shift_weight');  break;  // đổi chân trụ
      case 2: forceGaze(npc, 'WATCH');                // nhìn đồng hồ — DÙNG CHUNG anim §2.5
              playAnim(npc, 'sigh');          break;  // thở dài, nghe được
      case 3: bus.emit('PERCEPTION_CONFIRMED', {
                npc, stim: makeWaitStim(npc), obs: { certainty: 1.0, state: 'CONFIRMED' }
              });                             break;  // salience 100
    }
  }

  // Quá 1.6×T → BỎ ĐI. Đây là hệ quả vận hành, không phải bark.
  if (r >= 1.60 && !npc.isBeingServed) leaveQueueAngry(npc, ctx);
}
```

| NPC | `patienceBaseSec` | Ghi chú |
|---|---|---|
| **Anh Dũng** (tài xế Grab) | **28** | Ngắn nhất. Đúng vai trò *"luôn vội → dạy `MADE_THEM_WAIT`"* (CANON §9) |
| Chú Tư (6h45 T2–T6) | 35 | Nhưng `rush = 0.65` trong khung 6h30–7h00 → thực tế **23 s**. Ngắn hơn cả anh Dũng |
| Chị Lan | 45 | Không nói gì, nhưng `deTha 0.2` → nhớ rất lâu |
| Bé Su | 70 | Có điện thoại, không thấy thời gian trôi |
| Bà Bảy | 90 | Dài nhất. Bả ngồi bán vé số cả ngày |
| Mặc định (khách vãng lai) | 50 | — |

**Ba ràng buộc bắt buộc, nối thẳng sang trợ năng (CANON §15.2):**
1. **Pause đóng băng `npc.waitSec`.** Không có ngoại lệ.
2. **Chế độ "không giới hạn thời gian"**: `tickWait` bị vô hiệu hoàn toàn. Khách vẫn bỏ đi vì bạn làm **sai**, không bao giờ vì bạn **chậm**.
3. Nấc 2 (thở dài + nhìn đồng hồ) phải xảy ra **ít nhất 8 giây trước** nấc 3 ở mọi cấu hình. Kiểm tra: `T × (1.00 − 0.85) ≥ 8` → `T ≥ 53,3`. **Không thoả với anh Dũng (28s → chỉ 4,2s cảnh báo).** → Sửa: nấc 2 kích hoạt ở `max(0.85 × T, T − 8)`. Ghi vào bảng tune §5.

---

### 2.12. `STALL_CLEANLINESS` — trạng thái tích luỹ, không sinh bark tức thì

CANON §3.3: *"Tích luỹ trong ngày. **Không sinh bark tức thì.** Ảnh hưởng: `traitMul` của mọi khách +, và **giảm số khách ngày hôm sau**."*

Đây là sự kiện vệ sinh thứ 3 trong 3 (XĐ1.1), và là cái duy nhất **không phạt ngay**. Nó là **nợ**, không phải **phạt**.

#### 2.12.1. Biến trạng thái

```ts
type StallState = {
  dirt: number;          // 0.0 .. 1.0
  fliesSpawned: boolean;
  remarkedToday: boolean;
};

// Đầu ngày: mang theo 40% của hôm trước. Không bao giờ về 0 miễn phí.
stall.dirt = prevDayEndDirt * 0.40;
```

#### 2.12.2. Tăng — theo thao tác, không theo thời gian

| Thao tác | `+dirt` | Ghi chú |
|---|---|---|
| `DROPPED_FOOD` (mỗi lần rớt) | **+0.060** | Cú nặng nhất. Rớt 5 lần = +0.30 |
| Đổ / văng nước sốt, xì dầu | +0.010 | |
| Cắt thịt, chặt heo quay trên thớt | +0.004 | Thao tác thường xuyên nhất |
| Gói một ổ bánh (vụn bánh rơi) | +0.002 | |
| Thối tiền (tay chạm quầy) | +0.002 | |
| Mưa tạt vào quầy | +0.020 / phút | Chỉ khi không hạ bạt |
| Khách ngồi ăn tại chỗ rồi đi | +0.008 | Giấy gói, ly trà để lại |
| **Trôi theo thời gian** | **+0.0015 / phút** | Ruồi, bụi đường. Nền rất thấp — dirt phải chủ yếu do người chơi |

Một buổi sáng 25 khách, không dọn, không rớt gì: `25 × (0.004 + 0.002 + 0.002) + 180 phút × 0.0015` = `0.20 + 0.27` = **0.47**. Đúng ngưỡng khó chịu. Có dọn 2 lần thì về ~0.17.

#### 2.12.3. Giảm — dọn phải tốn thời gian thật

| Thao tác dọn | Thời gian | `−dirt` | Tác dụng phụ |
|---|---|---|---|
| Lau mặt quầy (giẻ) | **3,5 s** | −0.15 | Tay bẩn → sinh `DIRTY_HANDS` nếu không rửa sau |
| Đổ rác / thay bịch rác | **5,0 s** | −0.25 | Phải bước khỏi quầy 2 bước |
| Rửa tay + tráng thớt | **4,0 s** | −0.10 | **Đồng thời xoá kích thích `DIRTY_HANDS` đang sống** |
| Quét đất quanh xe | **7,0 s** | −0.30 | Chỉ làm được khi hàng chờ = 0 |
| Cô Ba dọn giúp (buổi tối) | — | `dirt × 0.5` | Tự động, miễn phí, **nhưng cô có nói một câu** |

**Chốt quan trọng:** tổng thời gian để đưa `dirt` từ 0.47 về ~0 là **~19 giây**, luôn luôn lấy từ thời gian phục vụ khách. Đây chính là *"rủi ro chuyển từ đạo đức sang vận hành"* (XĐ1.2): giữ quầy sạch **không phải lựa chọn đạo đức, là bài toán lịch trình**.

#### 2.12.4. Hệ quả

```ts
// (1) traitMul toàn cục — áp cho MỌI khách, mọi sự kiện, mọi lúc
traitMulGlobal = 1 + 0.35 * stall.dirt;          // dirt 1.0 → mọi người soi hơn 35%

// (2) Số khách ngày hôm sau
nextDayCustomers = baseCount * (1 - 0.30 * Math.pow(dirtAtClose, 1.5));
// dirt 0.5 → −10,6 %   |   dirt 0.8 → −21,5 %   |   dirt 1.0 → −30 %

// (3) Visual escalation — BẮT BUỘC, đây là cách người chơi ĐỌC được dirt
//     T3: không có thanh bar. Chỉ có cái nhìn thấy trên quầy.
```

| `dirt` | Biểu hiện trên màn hình | Âm thanh |
|---|---|---|
| < 0.20 | Quầy sạch. Mặt thớt sáng | — |
| 0.20 | Vài vụn bánh trên thớt, 1 vệt sốt | — |
| 0.35 | **1 con ruồi** bay vòng quanh (sprite 3 frame, loop) | vo ve rất khẽ, −24 dB |
| 0.50 | 3 con ruồi + **ánh dầu bóng** trên mặt quầy (overlay alpha 0.15) | vo ve −20 dB |
| 0.70 | 5 con ruồi + **vũng nước đọng** phản chiếu + bịch rác đầy nghiêng | vo ve −16 dB |
| 0.85 | Ruồi đậu **lên thớt**. Giấy gói rơi dưới đất | — |

> **Luật tuyệt đối: ruồi phải khác nhau về HÀNH VI, không chỉ số lượng.** Ở `0.35` ruồi bay vòng và không đậu. Ở `0.85` ruồi **đậu lên thớt rồi bay lên khi tay người chơi tới gần**. Đó là thứ người chơi thấy và tự nói *"thôi dọn đi"* — không cần một con số nào.

#### 2.12.5. Vì sao "không sinh bark tức thì", và ngoại lệ duy nhất

Nếu `STALL_CLEANLINESS` sinh bark mỗi khi tăng, nó sẽ thành **sự kiện vệ sinh thứ 4, 5, 6...** và phá trần 3–4 của XĐ1.1. Tệ hơn: nó biến game thành "mô phỏng bị cằn nhằn" (`idea.md` §9.1).

**Ngoại lệ duy nhất — lời dạy một lần mỗi ngày.** Khi `dirt ≥ 0.80` và `remarkedToday == false`, NPC có `soi` cao nhất đang ở `FRONT_CENTER` nói **đúng một câu**, ở tier ôn hoà nhất, **và không ghi memory tiêu cực**:

- **Thầy Phúc**: *"Con ơi, cái thớt... thầy nói vậy thôi nghe, không có ý gì đâu."*
- **Bà Bảy**: *"Con lau cái bàn đi con, ruồi bu kìa. Cô nói cho con biết chớ cô hổng có chê."*
- **Cô Ba** (buổi tối, luôn luôn nếu `dirt ≥ 0.6` lúc đóng cửa): *"Mai con dọn sớm chút nghen. Xe sạch thì người ta mới dám ăn."*

Đây không phải bark phạt. Đây là **người dạy là cô Ba, không phải hệ thống phạt** (XĐ1.4) áp dụng cho trạng thái quầy. Đặt `remarkedToday = true` và không bao giờ nói lại trong ngày.

---

### 2.13. Chống ăn gian (g) — micro-cheat lặp vô hạn

> CANON §8g: *"Bớt 1 thứ nhỏ với 100% khách, 40 ngày. Từng lần không bị bắt, cộng dồn tiết kiệm to."* — **"Đây là lỗ hổng lớn nhất hiện tại."**

#### 2.13.1. Vì sao hệ perception một mình KHÔNG bịt được

Tính thử. Bỏ ngò (một `MISSING` nhỏ, salience tại quầy **12**) với mọi khách:

- Khách chuẩn `FRONT_CENTER` nhìn tay: `t_confirm = 100 / (12 × 0.85 × 1.0) = 9,8 s`. Kích thích `MISSING` sống ~6–9 s → **hiếm khi bị bắt tại quầy**.
- Lúc ăn, salience lên 100 — nhưng **ngò là thứ optional**, không nằm trong `required` nếu khách không dặn. Nếu khách chỉ nói *"cho ổ đầy đủ"* thì "đầy đủ" có ngò hay không là **chỗ mờ** — và người chơi khai thác đúng chỗ mờ đó.
- Tiết kiệm: ~120₫/ổ × 25 ổ/ngày × 40 ngày = **120.000₫**. Không to. Nhưng nhân lên 4–5 nguyên liệu nhỏ (ngò, ớt, bớt 20% đồ chua, bớt nửa muỗng sốt, nướng thiếu 3 giây) → **~600.000₫/mùa**, bằng một cái tủ mát. Và quan trọng hơn: **nó là dominant strategy**, mà dominant strategy giết game trước khi con số kịp quan trọng.

Kết luận: **hệ tích phân theo từng sự kiện không thể phát hiện một chiến lược trải trên 1.000 sự kiện.** Cần một tầng khác hẳn.

#### 2.13.2. Nguyên tắc: phát hiện theo PATTERN, và phải TRUY VẾT ĐƯỢC

Ràng buộc từ HT3 (`idea.md` §16): *"thiên tài HOẶC bug report, không có ở giữa"*. Một bộ phát hiện pattern mà người chơi không hiểu được sẽ bị đọc là **NPC đổ oan** — đúng thứ Linh (ADHD) nói là *"công tắc số 1 phải tắt được"*. Nên bộ phát hiện này phải:

1. **Đếm thứ cụ thể** (nguyên liệu nào, bao nhiêu lần), không đếm "độ tệ" mờ ảo.
2. **Gọi tên thứ đó ra miệng** khi kích hoạt. *"Bánh nhạt"* là câu mở; câu thứ hai phải là *"hổng thấy ngò"*.
3. **Reset được bằng hành động đúng** — nếu làm đúng trở lại, nghi ngờ phải giảm. Nếu không, nó là án chung thân và người chơi sẽ tắt game.

#### 2.13.3. Hai bộ đếm trượt

```ts
type SkimTally = {
  // Theo NGƯỜI — cửa sổ 7 lần ghé gần nhất của chính NPC đó
  perNpc: Map<NpcId, RingBuffer<DeliveryRecord>>;      // capacity 7

  // Theo TOÀN CỤC — cửa sổ 40 lần giao bánh gần nhất, bất kể ai
  global: RingBuffer<DeliveryRecord>;                  // capacity 40

  // Theo NGUYÊN LIỆU — đây là chỗ khiến bark gọi tên được
  perItem: Map<ItemId, { hits: number; window: number }>;
};

type DeliveryRecord = {
  day: number; npcId: NpcId;
  skimmedItems: ItemId[];      // các defect MISSING / WRONG_RATIO(<1.0) KHÔNG bị nói ra
  wasSpoken: boolean;          // có defect nào được take(1) nói ra không
  cleanDelivery: boolean;      // không defect nào cả
};
```

Một lần giao bánh được ghi là **micro-cheat** khi và chỉ khi:

```ts
function isMicroCheat(d: DeliveryRecord): boolean {
  return d.skimmedItems.length > 0    // có bớt thứ gì đó
      && !d.wasSpoken;                // mà không bị bắt tại chỗ
}
```

Chú ý: **bị bắt rồi thì không tính là micro-cheat**. Bạn đã trả giá rồi. Bộ đếm này chỉ nhắm vào cái **thoát**.

#### 2.13.4. Công thức và ngưỡng khởi điểm

```ts
const W_GLOBAL = 40;          // cửa sổ toàn cục (số lần giao bánh)
const W_NPC    = 7;           // cửa sổ theo NPC (số lần ghé)

const TH_GLOBAL_RATE  = 0.35; // ≥35% số lần giao bánh trong cửa sổ là micro-cheat
const TH_GLOBAL_COUNT = 12;   // VÀ ít nhất 12 lần tuyệt đối
const TH_NPC_COUNT    = 4;    // HOẶC: một NPC bị bớt 4/7 lần ghé gần nhất
const TH_ITEM_RATE    = 0.50; // để bark GỌI TÊN được nguyên liệu

function tickPatternDetector(dt: number, ctx: StallCtx) {
  const g = tally.global;
  if (g.length < 20) return;                 // chưa đủ dữ liệu, không kết tội

  const cheats = g.filter(isMicroCheat);
  const globalRate = cheats.length / g.length;
  const globalHit  = globalRate >= TH_GLOBAL_RATE && cheats.length >= TH_GLOBAL_COUNT;

  for (const npc of ctx.knownNpcs) {
    const buf = tally.perNpc.get(npc.id);
    if (!buf || buf.length < 4) continue;
    const npcHits = buf.filter(isMicroCheat).length;
    const npcHit  = npcHits >= TH_NPC_COUNT;

    if (!globalHit && !npcHit) continue;
    if (npc.patternFiredOnDay === ctx.day) continue;      // tối đa 1 lần/NPC/ngày
    if (npc.personality.soi < 0.4) continue;              // người xuề xoà không để ý

    // Ai nói? Người soi nhất trong số bị ảnh hưởng, ghé nhiều nhất.
    firePatternSuspicion(npc, ctx, cheats);
  }
}

function firePatternSuspicion(npc: Npc, ctx: StallCtx, cheats: DeliveryRecord[]) {
  // Nguyên liệu bị bớt nhiều nhất trong cửa sổ — đây là "nguồn truy vết được"
  const counts = countBy(cheats.flatMap(c => c.skimmedItems));
  const [topItem, topN] = argmax(counts);
  const itemRate = topN / cheats.length;

  npc.patternFiredOnDay = ctx.day;
  npc.suspicion = Math.min(1.0, npc.suspicion + 0.25);    // → traitMul ×(1+0.4×suspicion)

  // Kích thích BYPASS: đây là một KẾT LUẬN, không phải một cái nhìn thấy.
  // Không qua visibility / occluder / gaze. Nhưng salience dưới WRONG_NAME.
  spawnStimulus({
    kind: 'PATTERN_SUSPECTED', channel: 'CONCLUSION',
    salience: 85, targetNpcId: npc.id, lifetime: 1.2,
    payload: { itemId: itemRate >= TH_ITEM_RATE ? topItem : null },
  });

  // Ghi thẳng vào LONG-TERM, không qua short-term (P2-02)
  writeMemory(npc, {
    tier: 'LONG', kind: 'SUSPECTED_SKIMPING', intensity: 70,
    traceable: { item: topItem, count: topN, window: cheats.length },  // ← HT3
  });

  // Seed gossip với mutation nặng nhất trong đồ thị (CANON §12)
  seedGossip(npc, { kind: 'ORDER_DEFECT', mutateTo: 'ăn bớt nguyên liệu', p: 0.35 });
}
```

#### 2.13.5. Thoại — hai tầng, tầng hai phải gọi tên được

**Tầng 1 — câu mở, khi `itemRate < 0.50`** (bớt lung tung, không có pattern rõ một món):

> **Bà Bảy:** *"Ê con... dạo này bánh nhạt hơn hay tại cô?"*
> **Chú Kiệt** (đối thủ, hiểu nghề): *"Hồi trước mày làm đầy hơn mà. Tao nói vậy thôi, hổng có ý gì."*
> **Thầy Phúc:** *"Thầy ăn ở đây lâu rồi... bữa nay thầy thấy hơi khác. Chắc thầy già rồi."*
> **Chị Lan:** — **không nói gì.** Nhưng `visitInterval` của chị giãn từ 1 ngày lên 3 ngày. Im lặng nguy hiểm hơn ồn ào (`idea.md` §9.3).

**Tầng 2 — câu gọi tên, khi `itemRate ≥ 0.50`** (bớt đúng một món, lặp đi lặp lại):

> **Bà Bảy:** *"Ủa sao dạo này cô hổng thấy ngò nữa vậy con? Hết ngò hả, hay con quên hoài?"*
> **Chú Kiệt:** *"Ngò lên giá hả mày? Tao thấy mày bỏ có mấy cọng à."*
> **Cô Mai:** *"Chị nói thiệt nghe em — mấy bữa nay đồ chua ít hẳn. Em tính toán lại giùm chị đi."*
> **Ông Hải** (sau 10 giờ, nongTinh 0.9): *"Trời ơi ớt đâu?! Tao ăn ở đây cả tháng, tuần này tuần nào cũng lạt nhách!"*

**Vì sao tầng 2 quan trọng hơn tầng 1:** tầng 1 là *"có gì đó không ổn"* — người chơi có thể đọc nhầm thành bug. Tầng 2 nói **chính xác cái người chơi đã làm** — và khoảnh khắc đó, người chơi biết hệ thống thật sự đang theo dõi. Đó là chỗ chiến thắng của thiết kế: **không phải vì bị phạt, mà vì bị nhìn thấy.** Đúng tagline: *"a game about being watched while you work"*.

#### 2.13.6. Xả — làm đúng lại thì họ nguôi

Không có xả thì đây là án chung thân, và người chơi sẽ đọc nó như bug.

```ts
// Sau mỗi lần giao bánh SẠCH (không defect nào):
npc.suspicion = Math.max(0, npc.suspicion - 0.06);
// → 5 lần giao sạch liên tiếp xoá hết 1 lần bị nghi (0.25)

// Cuối mỗi ngày:
npc.suspicion *= (0.88 + 0.10 * npc.personality.deTha);
// deTha 0.9 (chú Tư) → ×0.97/ngày, nhưng anh không soi nên ít khi kích hoạt
// deTha 0.2 (chị Lan) → ×0.90/ngày, nguôi chậm nhất

// SÀN VĨNH VIỄN — móc nối với chống ăn gian (d)
npc.trustCeiling = Math.min(npc.trustCeiling, 1.0 - 0.08 * npc.patternFireCount);
// Mỗi lần bị bắt pattern hạ trần tin tưởng 8%, KHÔNG hồi lại.
// Giận thì nguôi được. Nhưng không bao giờ thân lại như cũ. Đúng với đời.
```

#### 2.13.7. Vì sao bộ ngưỡng này, và cách chỉnh nếu sai

| Ngưỡng | Giá trị | Nếu người chơi kêu "bị oan" | Nếu người chơi ăn gian thoát |
|---|---|---|---|
| `W_GLOBAL` | 40 | ↑ lên 60 (cần bằng chứng dài hơn) | ↓ xuống 25 |
| `TH_GLOBAL_RATE` | 0.35 | ↑ lên 0.45 | ↓ xuống 0.25 |
| `TH_GLOBAL_COUNT` | 12 | ↑ lên 18 | ↓ xuống 8 |
| `TH_NPC_COUNT` | 4 / 7 | ↑ lên 5 / 7 | ↓ xuống 3 / 7 |
| `suspicion` +/lần | +0.25 | ↓ xuống 0.15 | ↑ lên 0.35 |

**Kiểm tra vô hại (false positive) bắt buộc:** một người chơi **chơi bình thường, không cố ý ăn gian**, làm sai vì vội trong giờ cao điểm, phải **không bao giờ** chạm ngưỡng. Đo: chạy bot mô phỏng "người chơi vụng" với tỉ lệ lỗi 15% ngẫu nhiên phân bố đều trên nguyên liệu, 40 ngày × 25 khách = 1.000 lần giao. Kỳ vọng: `globalRate ≈ 0.15 < 0.35` → **không kích hoạt**. Và `itemRate` phân bố đều ≈ `1/8 = 0.125 < 0.50` → **không bao giờ lên tầng 2**. Nếu bot này kích hoạt được, ngưỡng sai.

---

## 3. Dữ liệu & schema

### 3.1. `Stimulus`

```ts
type StimChannel =
  | 'VISUAL'            // qua đủ 5 nhân tử
  | 'AUDIO_DIRECTED'    // WRONG_NAME — bỏ qua visibility/occluder/gaze
  | 'AUDIO_AMBIENT'     // tiếng rớt, tiếng cháy xèo — có gazeFloor
  | 'SMELL'             // BURNT — có gazeFloor
  | 'TIME'              // MADE_THEM_WAIT — đồng hồ riêng
  | 'CONCLUSION'        // PATTERN_SUSPECTED — suy luận, không phải giác quan
  | 'DELIVERY';         // lộ ra lúc trao bánh — xem P1-03

type Stimulus = {
  id: string;                 // `${kind}:${orderId}:${seq}` — ổn định, dùng làm stimId
  kind: EventId;              // 1 trong 11 ID của CANON §3
  channel: StimChannel;
  salience: number;           // CANON §3, KHÔNG được sửa lúc runtime
  zone: Zone;                 // HANDS | BOARD | OVEN | UNDER_COUNTER | AUDIO
  gazeFloor?: number;         // sàn gazeFactor cho kênh SMELL/AUDIO_AMBIENT
  targetNpcId?: NpcId;        // chỉ với AUDIO_DIRECTED / CONCLUSION
  lifetime: number;           // giây; kích thích sống bao lâu
  age: number;
  alive: boolean;
  diedAt: number;
  payload?: { itemId?: ItemId; defectKind?: DefectKind; ratio?: number };

  // cache khán giả — KHÔNG serialize
  audience: Npc[];
  audienceDirty: boolean;
  queueVersion: number;
};
```

**Bảng `lifetime` và `gazeFloor` cho 11 sự kiện:**

| Kind | Channel | Zone | `salience` | `lifetime` (s) | `gazeFloor` | Ghi chú |
|---|---|---|---|---|---|---|
| `WRONG_NAME` | `AUDIO_DIRECTED` | `AUDIO` | 100 | 1,2 | — | Bỏ qua hết. Cửa sửa sai 2,5s |
| `MADE_THEM_WAIT` | `TIME` | — | 100 | ∞ | — | Đồng hồ riêng, §2.11.2 |
| `BURNT_OR_COLD` | `SMELL` + `VISUAL` | `OVEN` | 80 | **12,0** | **0.40** | Mùi khét lan; xem §2.14 |
| `DROPPED_FOOD` | `AUDIO_AMBIENT` + `VISUAL` | `HANDS` | 75 | **3,5** | **—** | **Không** có `gazeFloor` (giữ hiệu chỉnh 28s của CANON). Tiếng động **kéo gaze** về `LOOK_HANDS`, trừ khi khách đang `PHONE`/`DRINKING` — xem §9.1 |
| `ORDER_DEFECT` (quầy) | `VISUAL` | `BOARD` | 20 (×mức) | 4,0–12,0 | — | Sống từ lúc phạm tới lúc gói xong. Xem `P1-03` |
| `ORDER_DEFECT` (ăn) | `DELIVERY` | — | 100 | — | — | Không qua perception. Xem `P1-03` §2.8 |
| `DIRTY_HANDS` | `VISUAL` | `HANDS` | 40 | **tới khi rửa tay** | — | Kích thích **bền**, không tự chết |
| `REMEMBERED_USUAL` | `DELIVERY` | — | 90 | — | — | Luôn nhận thấy. Xem `P1-03` §2.11 |
| `REMEMBERED_STORY` | `AUDIO_DIRECTED` | `AUDIO` | 70 | 2,5 | — | `rate = 0,70/s` → 1,43s |
| `CARED_FOR_THEM` | `AUDIO_DIRECTED` | `AUDIO` | 50 | 3,0 | — | `rate = 0,50/s` → 2,0s |
| `FREE_EXTRA` | `VISUAL` + `DELIVERY` | `HANDS` | 25 | 3,0 | — | Thấy tại quầy **hoặc** phát hiện lúc ăn |
| `FLOURISH` | `VISUAL` | `HANDS` | 15 | **liên tục suốt lúc ráp bánh** | — | Xem §2.14 |

### 3.2. `Observation` — schema, vòng đời, lưu save

```ts
type PerceptionState = 'UNAWARE' | 'GLIMPSED' | 'NOTICED' | 'CONFIRMED';

type Observation = {
  stimId: string;            // khoá liên kết ngược với P1-03 — QUAN TRỌNG NHẤT
  npcId: NpcId;
  kind: EventId;
  certainty: number;         // 0.0 .. 1.0
  state: PerceptionState;
  peak: number;              // đỉnh đã đạt — dùng cho bark "suýt thấy"
  latched: boolean;          // true khi CONFIRMED, ngừng tick
  firstSeenAt: number;       // giây trong ngày
  holdUntil: number;         // ADSR sustain
  lastRate: number;          // chỉ để debug overlay
  payload?: { itemId?: ItemId; defectKind?: DefectKind };
};
```

**Vòng đời — 5 mốc:**

| Mốc | Khi nào | Việc xảy ra |
|---|---|---|
| **Sinh** | Lần đầu `rate` vượt ngưỡng tối thiểu `0.5` trong `getOrCreateObs` | Lấy object từ **pool 64 slot**. `certainty` khởi tạo bằng `npc.residue[kind]`, **không** phải 0 |
| **Sống** | Mỗi frame có kích thích còn sống **hoặc** certainty > 0 | ADSR §2.4 |
| **Latch** | `certainty >= 1.0` | `latched = true`, phát `PERCEPTION_CONFIRMED`, **ngừng tick vĩnh viễn** |
| **Chết** | `certainty <= 0` **và** `!latched` **và** `!stim.alive` | Ghi `npc.residue[kind] += 0.05` (cap 0.20), trả object về pool |
| **Thu hoạch** | Cuối lượt khách (`CUSTOMER_LEFT`) | Mọi observation `latched` chuyển thành `Memory` (`P2-02`); **toàn bộ** `npc.observations` bị xoá |

**Lưu vào save — luật rất ngắn:**

> **`Observation` KHÔNG BAO GIỜ được serialize.**

Ba lý do:

1. **CANON §2: autosave sau mỗi khách**, không phải sau mỗi hành động. Nên không tồn tại trạng thái save nào nằm *giữa* một lượt khách. Mọi `Observation` đều đã được thu hoạch thành `Memory` hoặc đã chết trước khi save chạy.
2. **CANON §8e: chống save-scum.** Reload đưa người chơi về đầu lượt khách kế tiếp. Lượt vừa rồi **không chơi lại được**. Nếu serialize observation, ta vô tình tạo ra điểm save giữa lượt.
3. **Tính tất định.** Cùng seed ngày + cùng thao tác = cùng kết quả. Không cần lưu trạng thái trung gian của một quá trình tất định.

**Cái ĐƯỢC lưu** (trong `npc` của save):

```ts
type NpcPerceptionSave = {
  residue: Partial<Record<EventId, number>>;   // 0..0.20, reset mỗi sáng
  suspicion: number;                            // 0..1, §2.13.6
  patternFireCount: number;                     // không bao giờ giảm
  trustCeiling: number;                         // không bao giờ tăng
  patternFiredOnDay: number;
};

type StallPerceptionSave = {
  dirt: number;
  tallyGlobal: DeliveryRecord[];    // ring buffer 40 phần tử, đã phẳng hoá
  tallyPerNpc: Record<NpcId, DeliveryRecord[]>;   // ring 7
};
```

### 3.3. Ví dụ JSON content thật

`content/stimuli/events.json`:

```json
{
  "DROPPED_FOOD": {
    "salience": 75,
    "channels": ["AUDIO_AMBIENT", "VISUAL"],
    "zone": "HANDS",
    "lifetime": 3.5,
    "pullsGazeTo": "LOOK_HANDS",
    "dirtDelta": 0.060,
    "mustDiscard": true,
    "barkConcept": "saw_drop",
    "sfx": "drop_bread_asphalt",
    "glyph": "?"
  },
  "BURNT_OR_COLD": {
    "salience": 80,
    "channels": ["SMELL", "VISUAL"],
    "zone": "OVEN",
    "lifetime": 12.0,
    "gazeFloor": 0.40,
    "pullsGazeTo": null,
    "barkConcept": "smelled_burnt",
    "sfx": "sizzle_burn",
    "glyph": "~?"
  },
  "DIRTY_HANDS": {
    "salience": 40,
    "channels": ["VISUAL"],
    "zone": "HANDS",
    "lifetime": -1,
    "persistUntil": "WASH_HANDS",
    "barkConcept": "saw_dirty_hands",
    "glyph": "?"
  }
}
```

`content/npcs/ba-bay.json` (phần perception):

```json
{
  "id": "ba_bay",
  "ten": "Bà Bảy",
  "personality": { "soi": 0.9, "nongTinh": 0.6, "deTha": 0.8, "thanThien": 0.7 },
  "perception": {
    "traitMul": 1.280,
    "patienceBaseSec": 90,
    "phoneBudget": 0,
    "gazeBag": {
      "LOOK_HANDS": 9, "LOOK_FACE": 4, "IDLE_SCAN": 5,
      "PHONE": 0, "COMPANION": 2, "WATCH": 0
    }
  }
}
```

---

## 4. UI/UX hai thiết bị

Tầng perception **không có UI riêng**. Đó là điểm quan trọng nhất của mục này. Toàn bộ "giao diện" của nó là **cơ thể của NPC**.

| Yếu tố | PC (chuột + bàn phím) | Mobile (v2, chạm) | Ghi chú trợ năng |
|---|---|---|---|
| Đọc `gazeFactor` | Hướng đầu + con ngươi + prop (điện thoại / ly / đồng hồ) | Giống hệt, nhưng **sprite prop to hơn 1,25×** vì màn nhỏ | Có tuỳ chọn **"viền sáng quanh vật khách đang nhìn"** cho người khó phân biệt hướng đầu |
| Đọc `occluderMul` | Thấy trực tiếp: ổ bánh dựng, thân xoay | Giống | — |
| Đọc state | `?` / `!` + nét mặt + nghiêng người | Giống | `?` và `!` **khác nhau về hình dáng**, không chỉ màu (CANON §15) |
| Che thân chủ động | **Giữ chuột phải** hoặc **giữ Shift** | **Chạm và giữ nút góc phải** | Có tuỳ chọn **toggle thay vì giữ** |
| Đưa trà đá | Kéo–thả ly, **hoặc chạm ly rồi chạm khách** (CANON §15.5) | Chạm–để–đặt | Bắt buộc có **nút Hoàn tác** |
| Hỏi một câu | Phím `E` / nút tròn dưới màn hình | Nút tròn | — |
| Đổi chỗ đứng | `A` / `D` | Chạm vùng trái / phải xe | — |

**Debug overlay (chỉ build dev, phím `F9`):** hiện trên đầu mỗi NPC: `gazeState`, `gazeFactor`, và với mỗi observation: `kind`, `certainty` (3 chữ số), `lastRate`, 5 nhân tử tách riêng. Đây là công cụ tune chính. **Không bao giờ ship.**

**Tuỳ chọn trợ năng riêng của doc này** (bổ sung vào 6 công tắc của CANON §15):

- **"Hiện vòng tròn chú ý"** — vẽ một vòng cung mờ từ mắt NPC tới zone họ đang nhìn. Mặc định **TẮT**. Bật lên làm game dễ hơn đáng kể — đó là chủ đích, đây là công tắc cho người không đọc được ngôn ngữ cơ thể.
- **"Tắt âm báo tiêu cực"** — đã có ở CANON §15.4; áp cho mọi sfx của `NOTICED`/`CONFIRMED`.

---

## 5. Tham số cần tune

| Tên | Giá trị khởi điểm | Khoảng | Cách đo |
|---|---|---|---|
| `TRAIT_BASE` | **0.65** | 0.55 – 0.75 | Cố định sao cho `soi=0.5 → 1.000`. Đổi cái này phải đổi `TRAIT_SPAN` |
| `TRAIT_SPAN` | **0.70** | 0.50 – 0.90 | Playtest: bà Bảy phải "khó chơi rõ rệt" nhưng không "không thể chơi" |
| `HOLD_TIME` | **1,5 s** | 0,8 – 2,5 | Đo cảm giác: người chơi phải kịp thấy mặt NPC còn nhíu sau khi đã giấu xong |
| `DECAY.NOTICED` | **0.06** /s | 0.03 – 0.12 | Nếu quá thấp: NPC "giận dai" vô lý. Quá cao: mất căng thẳng |
| `DECAY.GLIMPSED` | **0.12** /s | 0.08 – 0.20 | — |
| `DECAY.UNAWARE` | **0.25** /s | 0.15 – 0.40 | Chỉ ảnh hưởng GC, ít quan trọng |
| `residue` +/lần | **+0.05** (cap 0.20) | 0.02 – 0.10 | Kiểm: lỗi thứ 4 cùng loại trong một buổi phải cảm thấy "khó thoát hơn" |
| `PHONE` duration | **2,0–3,0 s** | **KHÔNG ĐỔI** | CANON §5.4 + §8a. Muốn đổi → viết vào mục 9 |
| `DRINKING` duration | **2,0–3,0 s** | 2,0 – 3,5 | — |
| `occluder` sàn | **0.15** | 0.10 – 0.25 | Kiểm: `t_confirm` tốt nhất cho DROPPED_FOOD phải ≥ 8s và ≤ 12s |
| Thân xoay `occluderMul` | **0.45** | 0.35 – 0.60 | — |
| Thân xoay — hệ số chậm | **1,3×** | 1,15 – 1,5 | Kiểm: che cả buổi phải dẫn tới `MADE_THEM_WAIT` |
| `traitMulGlobal` từ dirt | **1 + 0.35·dirt** | 0.20 – 0.50 | — |
| Khách hôm sau từ dirt | **1 − 0.30·dirt^1.5** | 0.20 – 0.45 | Kiểm: người chơi cẩu thả 3 ngày phải thấy hẻm vắng đi rõ |
| `dirt` đầu ngày | **prev × 0.40** | 0.25 – 0.60 | — |
| `W_GLOBAL` | **40** | 25 – 60 | §2.13.7 |
| `TH_GLOBAL_RATE` | **0.35** | 0.25 – 0.45 | Bot "người chơi vụng" 15% lỗi phải KHÔNG kích hoạt |
| `TH_GLOBAL_COUNT` | **12** | 8 – 18 | — |
| `TH_NPC_COUNT` | **4 / 7** | 3–5 / 7 | — |
| `TH_ITEM_RATE` | **0.50** | 0.40 – 0.65 | Ngưỡng để bark **gọi tên** nguyên liệu |
| `suspicion` +/lần | **+0.25** | 0.15 – 0.35 | — |
| `suspicion` xả/giao sạch | **−0.06** | 0.04 – 0.10 | Kiểm: 5 lần sạch phải xoá hết 1 lần bị nghi |
| `trustCeiling` /lần bắt | **−0.08** | 0.05 – 0.12 | **Vĩnh viễn.** CANON §8d |
| `patienceBaseSec` (mặc định) | **50 s** | 35 – 70 | Bảng riêng §2.11.2 |
| Nấc cảnh báo chờ | `max(0.85·T, T−8)` | — | **Phải ≥ 8s trước nấc 3 ở mọi NPC** |
| `MAX_LIVE_STIMULI` | **8** | 6 – 12 | Log warn khi chạm trần |
| `MAX_AUDIENCE` | **6** | 5 – 8 | — |
| `perceptionTick` budget | **0,25 ms** p50 | trần 0,80 ms | §2.10.3 |

### 5.1. BẢNG HIỆU CHỈNH BẮT BUỘC — 11 sự kiện × 3 mức gaze × 3 vị trí

Điều kiện chuẩn: `occluderMul = 1.00`, `traitMul = 1.000` (Ông Hải / Chị Hạnh, `soi = 0.5`), `dirt = 0`, `suspicion = 0`.
Số trong ô là **`t_confirm` (giây)** = `100 / (salience × visibility × gazeFactor)`.
🟩 = bị bắt chắc (`t_confirm < lifetime`) · 🟨 = biên (`lifetime ≤ t < 2×lifetime`) · 🟥 = thực tế không bao giờ.

| # | Sự kiện (zone, salience, lifetime) | Vị trí | `LOOK_HANDS` 1.00 | `IDLE_SCAN` 0.45 | `PHONE` 0.05 |
|---|---|---|---|---|---|
| 1 | **`DROPPED_FOOD`** (HANDS, 75, 3,5s) | `FRONT_CENTER` | 🟩 **1,40** ← *hiệu chỉnh gốc* | 🟩 3,12 | 🟥 **28,07** ← *hiệu chỉnh gốc* |
| | | `QUEUE_2` | 🟩 2,96 | 🟨 6,58 | 🟥 59,3 |
| | | `QUEUE_3` | 🟨 6,67 | 🟥 14,8 | 🟥 133,3 |
| 2 | **`DIRTY_HANDS`** (HANDS, 40, tới khi rửa) | `FRONT_CENTER` | 🟩 2,63 | 🟩 5,85 | 🟨 52,6 |
| | | `QUEUE_2` | 🟩 5,56 | 🟩 12,35 | 🟥 111,1 |
| | | `QUEUE_3` | 🟩 12,50 | 🟨 27,8 | 🟥 250,0 |
| 3 | **`BURNT_OR_COLD`** (OVEN, 80, 12s) — có `gazeFloor 0.40` | `FRONT_CENTER` | 🟩 2,08 | 🟩 4,63 | 🟩 **5,21**† |
| | | `QUEUE_2` | 🟩 2,50 | 🟩 5,56 | 🟩 **6,25**† |
| | | `QUEUE_3` | 🟩 4,17 | 🟩 9,26 | 🟩 **10,42**† |
| 4 | **`ORDER_DEFECT`** tại quầy (BOARD, 20, 4–12s) | `FRONT_CENTER` | 🟩 5,88 | 🟨 13,1 | 🟥 117,6 |
| | | `QUEUE_2` | 🟨 12,50 | 🟥 27,8 | 🟥 250,0 |
| | | `QUEUE_3` | 🟥 27,8 | 🟥 61,7 | 🟥 555,6 |
| 5 | **`FREE_EXTRA`** (HANDS, 25, 3s) | `FRONT_CENTER` | 🟨 4,21 | 🟥 9,36 | 🟥 84,2 |
| | | `QUEUE_2` | 🟥 8,89 | 🟥 19,75 | 🟥 177,8 |
| | | `QUEUE_3` | 🟥 26,7 | 🟥 59,3 | 🟥 533,3 |
| 6 | **`FLOURISH`** (HANDS, 15, suốt lúc ráp ~7–12s) | `FRONT_CENTER` | 🟩 **7,02** | 🟨 15,6 | 🟥 140,4 |
| | | `QUEUE_2` | 🟨 14,81 | 🟥 32,9 | 🟥 296,3 |
| | | `QUEUE_3` | 🟥 33,3 | 🟥 74,1 | 🟥 666,7 |
| 7 | **`WRONG_NAME`** (AUDIO_DIRECTED, 100) | mọi vị trí | 🟩 **1,00** | 🟩 **1,00** | 🟩 **1,00** |
| 8 | **`MADE_THEM_WAIT`** (TIME, 100) | mọi vị trí | *đồng hồ riêng — xem §2.11.2* | | |
| 9 | **`REMEMBERED_STORY`** (AUDIO_DIRECTED, 70) | mọi vị trí | 🟩 **1,43** | 🟩 **1,43** | 🟩 **1,43** |
| 10 | **`CARED_FOR_THEM`** (AUDIO_DIRECTED, 50) | mọi vị trí | 🟩 **2,00** | 🟩 **2,00** | 🟩 **2,00** |
| 11 | **`REMEMBERED_USUAL`** (DELIVERY, 90) | mọi vị trí | 🟩 **tức thì** | 🟩 **tức thì** | 🟩 **tức thì** |

† Nhờ `gazeFloor = 0.40`: mùi khét không đi qua mắt. `gazeFactor` thực tế `= max(0.05, 0.40) = 0.40`.

#### 5.1.1. Đọc bảng này để tune — 7 điều bảng nói ra

1. **Hàng 1 khớp CANON §5 chính xác.** `1,40` và `28,07`. Nếu build ra số khác, sai ở `TRAIT_BASE`/`TRAIT_SPAN` hoặc ở bảng `visibility`. **Đây là bài test đầu tiên phải pass.**
2. **Hàng 3 (`BURNT_OR_COLD`) toàn 🟩.** Đúng ý đồ: *"có mùi → bán kính nhận thấy rộng hơn"* (CANON §3.1). Bánh cháy **không giấu được**, kể cả khi cả hẻm đang bấm điện thoại. Đây là sự kiện dạy người chơi rằng **không phải lỗi nào cũng chơi được trò trốn tìm**.
3. **Hàng 4 (`ORDER_DEFECT` tại quầy) là trục chính của `P1-03`.** `FRONT_CENTER` + nhìn tay = `5,88s`, vừa khít vòng đời 4–12s → **đôi khi** bị bắt. Mọi ô khác 🟥. Đó chính xác là thứ tạo ra tỉ lệ ANTICIPATED / DISCOVERED khác nhau theo vị trí khách — kỹ thuật lõi của doc B.
4. **Hàng 5 (`FREE_EXTRA`) gần như toàn 🟥 tại quầy.** Đúng: người ta không nhìn thấy bạn *cho thêm*, người ta **phát hiện lúc ăn**. Nên `FREE_EXTRA` phải có kênh `DELIVERY`. Nếu không có, salience 25 thành vô dụng và cả nhóm sự kiện tích cực mất một chân.
5. **Hàng 6 (`FLOURISH`) chỉ 🟩 ở đúng một ô.** Đó là **thiết kế, không phải bug**: thao tác đẹp chỉ được ghi nhận khi có người **thật sự đứng nhìn tay bạn**. Điều kiện sống của nó là `lifetime` = cả quá trình ráp bánh (7–12s), không phải một động tác 1s. Nếu build ra `lifetime = 1,2s` thì `FLOURISH` sẽ **không bao giờ** kích hoạt và cân bằng tích cực/tiêu cực (5/6) sụp. **Đây là cái bẫy cài đặt dễ mắc nhất trong doc này.**
6. **Cột `PHONE` gần như toàn 🟥** — trừ `BURNT_OR_COLD` (mùi) và 4 kênh bypass. Đó là bảng chứng minh rằng cửa sổ điện thoại **có giá trị thật**, và đồng thời giải thích vì sao nó phải bị khoá 2–3 giây (§7.1).
7. **Hàng 7–11 không phụ thuộc vị trí hay gaze.** Năm sự kiện này là **xương sống cảm xúc** của game: gọi sai tên, bắt chờ, nhớ chuyện, chăm sóc, nhớ đơn quen. Chúng đi thẳng vào người khách, không qua trò trốn tìm. **Nếu bạn phải cắt tính năng, cắt từ hàng 1–6 trước, không bao giờ cắt hàng 7–11.**

---

## 6. Tiêu chí đạt

**A. Đúng công thức (test tự động, chạy trong CI):**

- [ ] `grep -c "rng\|Math.random" sim/perception.ts` trả về **0**.
- [ ] Unit test: `DROPPED_FOOD` × `FRONT_CENTER` × `gaze 1.0` × `traitMul 1.0` → `CONFIRMED` ở `1,40 s ± 0,05`.
- [ ] Unit test: cùng trên với `gaze 0.05` → `28,07 s ± 0,5`.
- [ ] Unit test: mọi ô của bảng §5.1 khớp `100/(S×V×G)` sai số ≤ 1%.
- [ ] Unit test: chạy `perceptionTick` 10.000 lần với cùng input → **output byte-identical**.
- [ ] Unit test: `occluderMul` với 3 vật chắn chồng nhau trả về đúng `0.15` (sàn).
- [ ] Unit test: `traitMul(soi=0.5)` = `1.000 ± 0.001`.

**B. Đúng hiệu năng:**

- [ ] `perceptionTick` p50 ≤ **0,25 ms**, p99 ≤ **0,50 ms** ở kịch bản 8 stim × 6 khách × mưa.
- [ ] **0 byte cấp phát** / frame ở trạng thái ổn định (đo bằng Chrome heap snapshot diff qua 600 frame).
- [ ] 30 fps ổn định trên máy chuẩn (tham chiếu `P0-01`) với đủ 6 khách + hiệu ứng mưa.

**C. Đúng trải nghiệm (playtest, 10 người lạ — cổng P1 của CANON §17):**

- [ ] **≥ 7/10** trả lời đúng câu *"vì sao khách đó giận"*. ← đây là cổng cứng của cả phase.
- [ ] **≥ 8/10** trả lời được *"làm sao để khách không thấy bạn làm rớt bánh"* sau 20 phút chơi, **không đọc hướng dẫn**.
- [ ] **≥ 6/10** tự phát hiện ra ít nhất **2 trong 5** công cụ chủ động (§2.8) mà không được chỉ.
- [ ] **0/10** người dùng từ "hên", "xui", "random" khi mô tả vì sao bị bắt. Nếu có bất kỳ ai dùng → **thiết kế sai, không phải người chơi sai**.
- [ ] Khi hỏi *"bà Bảy và anh Bảo khác nhau chỗ nào"*, **≥ 8/10** nói được ý "bả nhìn suốt / thằng kia cắm mặt điện thoại".

**D. Đúng chống ăn gian:**

- [ ] Bot "người chơi vụng" (15% lỗi ngẫu nhiên phân bố đều, 1.000 lần giao) → **không** kích hoạt `PATTERN_SUSPECTED` lần nào.
- [ ] Bot "micro-cheat" (bỏ ngò 100%, 40 ngày) → kích hoạt tầng 2 (gọi tên "ngò") **trong vòng 3 ngày chơi đầu tiên** của hành vi.
- [ ] Bot "farm điện thoại" (đứng chờ `PHONE` rồi mới thao tác) → **doanh thu thấp hơn** bot chơi thẳng, do `MADE_THEM_WAIT` và hàng chờ. Đo trên 10 ngày.
- [ ] Không tồn tại tổ hợp occluder nào cho `t_confirm(DROPPED_FOOD, FRONT_CENTER, gaze 1.0)` > **12 giây**.

**E. Đúng trợ năng:**

- [ ] Pause đóng băng `certainty`, `gazeTimer`, `waitSec` — đủ cả ba.
- [ ] Chế độ "không giới hạn thời gian" vô hiệu hoàn toàn `tickWait`, **nhưng không** vô hiệu `perceptionTick`.
- [ ] Mọi dấu hiệu state (`?`, `!`) phân biệt được khi bật **giảm chuyển động** và ở chế độ **mù màu đỏ–lục**.
- [ ] Công tắc "hiện vòng tròn chú ý" hoạt động và mặc định **TẮT**.

---

## 7. Rủi ro & cách bịt

### 7.1. Ăn gian (a) — Farm cửa sổ điện thoại

**Đây là rủi ro số một của doc này.** CANON §8a: nếu chờ không mất gì thì đây là **dominant strategy tuyệt đối và cả cơ chế attention sụp**.

Bốn lớp bịt, độc lập nhau:

| Lớp | Cơ chế | Con số |
|---|---|---|
| **1. Cửa sổ ngắn** | `PHONE` khoá cứng **2,0–3,0 giây** | Đủ cho **một** thao tác đã chuẩn bị sẵn (thả pate: 1,1s; rớt bánh và bỏ: 2,4s). **Không đủ** cho một chuỗi |
| **2. Ngân sách hữu hạn** | `phoneBudget` per-visit: 0–4 tuỳ NPC (§2.5.4) | Bà Bảy = **0**. Không có cửa sổ nào để chờ. Thầy Phúc = 0. Chú Kiệt = 0 |
| **3. Câu giờ có giá** | `tickWait` chạy song song, salience 100, **bỏ qua gaze** | Chờ 28s để farm cửa sổ của anh Dũng = anh Dũng đã `CONFIRMED MADE_THEM_WAIT` |
| **4. Giá dây chuyền** | Hàng chờ dài ra → khách sau cũng `waitSec` tăng → bánh trong lò nguội → `BURNT_OR_COLD` | Một lần farm gây 2–4 sự kiện tiêu cực ở người khác |

**Kiểm tra định lượng bắt buộc:** với `patienceBaseSec` thấp nhất (anh Dũng 28s, chú Tư giờ cao điểm 23s) và `phoneBudget = 2`, thời gian **kỳ vọng** để chờ được một cửa sổ `PHONE` là `~9,5s` (trung bình 3,3 lần chuyển state × ~2,9s/state). Tức `r = 9,5/28 = 0,34` → chưa tới nấc 1. **Một lần farm là chịu được.** Farm 3 lần liên tiếp = `28,5s` → `r = 1,02` → **nấc 3, `CONFIRMED`**. Đúng thiết kế: được dùng, không được sống trong đó.

### 7.2. Ăn gian (c) — Lịch mưa

Mưa cho `AWAY_RAIN` (`gaze 0.10`) và đó là một cửa sổ rất rộng (4–12s). Bịt theo CANON §8c: **mưa cũng giảm ~40% lượng khách**. Ngày ăn gian = ngày ít doanh thu. Cộng thêm hai cái của doc này:

- Mưa làm `dirt` tăng `+0.020/phút` nếu không hạ bạt, và hạ bạt tốn **4 giây**.
- Người chơi **che dù cho khách** (`CARED_FOR_THEM`, salience 50) thì khách **thoát `AWAY_RAIN`** → gaze quay về bình thường. Tức là: **hành động tử tế nhất cũng là hành động tự làm khó mình.** Đây là chỗ đẹp nhất của thiết kế — và phải giữ.

### 7.3. Ăn gian (e) — Save-scum

Bịt bằng hai thứ đã ghi trong doc này:

- **`Observation` không serialize.** Không có điểm save giữa lượt khách.
- **Mọi thứ trong `perceptionTick` là tất định.** `gazeTimer` lấy từ `ctx.dayNoise(npcId, transitionCount)` — hàm băm thuần từ `(seed ngày, npcId, index)`, **không phải PRNG có trạng thái**. Reload → cùng seed → **cùng chuỗi gaze y hệt**. Người chơi reload sẽ thấy chính xác cùng một cơ hội, không phải cơ hội mới.

### 7.4. Ăn gian (i) — Spam trà đá để mua chuộc

Trà đá vừa hạ gaze vừa cho `CARED_FOR_THEM` → cám dỗ spam. Bịt:

- Cooldown 45s/NPC + nguồn hữu hạn 18 ly/ngày.
- Diminishing returns 1.0 / 0.6 / 0.25 (§2.8).
- **Phản tác dụng:** từ ly thứ 3 trong ngày với NPC có `soi ≥ 0.7`, rule DB kích hoạt concept `suspect_bribery`:
  > **Chị Lan:** *"...Sao bữa nay em tử tế dữ vậy?"* — nói bằng giọng bình thường, không mỉa. Và đó là lý do nó đáng sợ.
  > **Thầy Phúc:** *"Con khỏi lo cho thầy quá vậy. Cứ làm bánh cho ngon là được rồi."*

### 7.5. Rủi ro §16 Đừng-1 — mô phỏng sâu đời sống NPC

Cám dỗ: *"để khách thật sự đọc tin nhắn trên điện thoại"*, *"để khách nhìn theo xe máy chạy qua"*. **Không.** Nguyên tắc Jeff Orkin (F.E.A.R.): *"Vocalizing intentions can sometimes even be enough, without any actual implementation."*

Áp dụng cụ thể: NPC **không** có nội dung tin nhắn, **không** có lý do nội tại để rút điện thoại. Họ có một `gazeBag` 20 vé và một câu thoại. Khi anh Bảo vào `PHONE` lần thứ ba, anh nói: *"Ủa nhóm nó nhắn gì mà nhiều dữ..."* — thế là đủ. **Mô phỏng sâu hơn cái người chơi nhìn thấy đúng một tầng, không hơn.**

### 7.6. Rủi ro §16 Đừng-3 — ngẫu nhiên chạm vào hệ quả

Kiểm tra: trong toàn bộ doc này, ngẫu nhiên xuất hiện ở **đúng ba chỗ**, và không chỗ nào chạm vào hệ quả:

| Chỗ | Cái nó đổi | Cái nó KHÔNG đổi |
|---|---|---|
| `gazeTimer` (tất định theo seed ngày) | Thời lượng mỗi state | Không đổi `gazeFactor`, không đổi `salience` |
| `gazeBag.draw()` (shuffle-bag) | **Thứ tự** các state | Không đổi **tỉ lệ** — shuffle-bag đảm bảo 20 vé ra đủ 20 lần |
| Độ trễ bark 0,2–0,4 s | Thời điểm nói | Không đổi **có nói hay không**, không đổi **nói cái gì** |

`certainty` không bao giờ bị ngẫu nhiên chạm vào. **Category và intensity của phản ứng do `certainty` quyết định, và `certainty` là tất định.** Đúng ràng buộc Sergio Ocio Barriales.

### 7.7. Rủi ro sản xuất — "mã màu hoá" các state

Cám dỗ lớn: vẽ vòng tròn vàng/cam/đỏ trên đầu NPC. Đó là **thanh nghi ngờ trá hình** và vi phạm T3. Luật: mọi thông tin perception phải đi qua **cơ thể NPC** (đầu, mắt, mày, thân) hoặc **một glyph nhỏ có hình dáng riêng** (`?` / `♪?` / `~?` / `!`). **Không có bar, không có %, không có gradient màu liên tục.** Công tắc trợ năng ở §4 là ngoại lệ duy nhất, và nó mặc định tắt.

### 7.8. Rủi ro cài đặt — `FLOURISH` chết vì `lifetime` sai

Xem §5.1.1 điểm 5. Nếu ai cài `FLOURISH.lifetime = 1.2` (độ dài animation) thay vì "suốt quá trình ráp bánh", sự kiện tích cực rẻ nhất của game sẽ không bao giờ kích hoạt, và tỉ lệ 5 tích cực / 6 tiêu cực (CANON §3) sẽ sụp trong thực tế chơi. **Thêm một unit test riêng cho cái này.**

---

## 8. Truy vết

| Nội dung trong doc này | `idea.md` | `CANON.md` |
|---|---|---|
| Bỏ xác suất roll mỗi frame | §16 HT1 (dòng 656–663) · §18.2 (813–837) · §19 Đừng-2 | §1 T5 · §16 Đừng-2 |
| Trích Steve Rabin, *Game AI Pro 2* ch.4 | §16 HT1 (dòng 661) | §5 |
| The Last of Us — vứt raycast tới mọi joint | §16 HT1 (dòng 661) · §18.2 (826) | §5 |
| Martin Walsh — *"player perception should win"* | §16 HT1 (dòng 662) | §16 Đừng-2 |
| Bốn persona độc lập cùng đòi | §16 HT1 (657–660) · HT3 (676) | §1 T5 |
| Công thức `rate` | §18.2 (dòng 821–824) | §5 |
| Bảng `visibility` tĩnh 5×4 | §18.2 (dòng 818–819) | §5 |
| Thief / Crytek TTP / TLoU — ADSR + capacitor | §18.2 (dòng 826) | §5 |
| 4 state + biểu hiện hình ảnh | §18.2 (dòng 832–833) | §5 |
| Hiệu chỉnh 1,4s / 28s | §18.2 (dòng 830) | §5 |
| Duyệt từ phía SỰ KIỆN — Mark of the Ninja | §18.2 (dòng 815) | §5 |
| 5 công cụ chủ động | §18.2 (dòng 837) | §5.4 |
| `gazeFactor` các yếu tố (−0.6 phone, −0.4 companion, …) | §9.1 (dòng 269–278) | — |
| 11 sự kiện + salience | §18.2 (dòng 828) · §9.2 | §3 |
| `WRONG_NAME` bỏ qua gaze | §18.2 (dòng 828) | §3.1 |
| `MADE_THEM_WAIT` leo thang | §9.2 mục 14 (dòng 317) | §3.1 |
| `STALL_CLEANLINESS` tích luỹ | §9.2 mục 6 (dòng 301) | §3.3 |
| Ăn gian (a) farm điện thoại | §21a (dòng 1019) | §8a · §5.4 |
| Ăn gian (c) lịch mưa | §21c (dòng 1021) | §8c |
| Ăn gian (g) micro-cheat lặp | §21g (dòng 1025) | §8g |
| Ăn gian (i) spam trust | §21i (dòng 1027) | §8i |
| HT3 — nhớ nhầm phải truy vết được | §16 HT3 (672–678) | §12 |
| Jeff Orkin — vocalizing intentions | §19 Đừng-1 | §16 Đừng-1 |
| Layered sprite / Rain World spring | §19 Đừng-4 | §16 Đừng-4 |
| Trợ năng: pause, không giới hạn thời gian | §20 | §15.2 |
| Vệ sinh: bắt buộc bỏ, cô Ba dạy | — | §7 (XĐ1.2, XĐ1.4) |

---

## 9. Đề xuất sửa CANON

Bốn đề xuất. Cả bốn đều là **bổ sung chi tiết**, không đề xuất nào đổi con số đã chốt.

### 9.1. Bổ sung `gazeFloor` cho kênh mùi và âm thanh nền — **cần duyệt**

CANON §5 viết công thức với `gazeFactor` là nhân tử thuần. Nhưng CANON §3.1 đồng thời viết `BURNT_OR_COLD`: *"Có mùi → bán kính nhận thấy rộng hơn"*, và `DROPPED_FOOD`: *"Có tiếng động"*. Hai câu này **mâu thuẫn** với `gazeFactor` thuần: mùi khét không đi qua mắt, nên khách bấm điện thoại vẫn phải ngửi thấy.

**Đề xuất:** thêm vào CANON §5, ngay dưới công thức:

```
gazeEff = max(gazeFactor, stim.gazeFloor ?? 0)
rate = salience * visibility * occluderMul * gazeEff * traitMul / 100
```

với `gazeFloor`: `BURNT_OR_COLD = 0.40` (mùi), `DROPPED_FOOD = 0.30` (tiếng động).

**Tác động:** không đổi bất kỳ hiệu chỉnh nào đã chốt — hiệu chỉnh `DROPPED_FOOD` 28s dùng `gazeFactor 0.05`, mà `max(0.05, 0.30) = 0.30` sẽ cho **4,68s** chứ không phải 28s. **→ Xung đột trực tiếp với CANON §5.**

**Giải pháp đề xuất:** `gazeFloor` của `DROPPED_FOOD` **chỉ áp trong 0,5 giây đầu** (lúc có tiếng), và tác dụng của nó là **kéo gaze sang `LOOK_HANDS`** (đã có trong §2.5.3, `loudCueThisFrame`) chứ **không** phải nâng sàn `gazeFactor`. Còn khách đang `PHONE` thì **miễn nhiễm với ngắt** (`hard: true`) — nên hiệu chỉnh 28s **giữ nguyên**. Như vậy:

- `DROPPED_FOOD`: **bỏ `gazeFloor`**, chỉ giữ `pullsGazeTo: LOOK_HANDS` với ngoại lệ `PHONE`/`DRINKING`. Hiệu chỉnh CANON được bảo toàn.
- `BURNT_OR_COLD`: **giữ `gazeFloor = 0.40`** — không có hiệu chỉnh CANON nào bị ảnh hưởng.

→ **Xin duyệt: thêm trường `gazeFloor` vào CANON §5, chỉ áp cho kênh `SMELL`.** Bảng §3.1 của doc này **đã áp dụng sẵn phương án trên** (`DROPPED_FOOD` không có `gazeFloor`).

### 9.2. Đưa công thức `traitMul` vào CANON §4 — **đề nghị nhận**

CANON §4 nói `soi → traitMul` nhưng không cho công thức, nên mỗi doc sẽ tự chế một cái khác nhau. Đề nghị thêm vào CANON §4:

```
traitMul_base = 0.65 + 0.70 * soi       // soi=0.5 → 1.000 (khách chuẩn)
traitMul = clamp(base × (1+0.35·dirt) × moodMul × (1+0.40·suspicion), 0.50, 2.20)
```

Lý do cần ở CANON: **mọi bảng hiệu chỉnh trong mọi doc đều giả định `traitMul = 1.0` cho khách chuẩn.** Nếu hằng số này trôi, mọi con số giây trong mọi doc sai theo.

### 9.3. Làm rõ `STALL_CLEANLINESS` — ngoại lệ "một câu dạy mỗi ngày" — **cần duyệt**

CANON §3.3 viết *"Không sinh bark tức thì"*. §2.12.5 của doc này xin một ngoại lệ: **một câu duy nhất mỗi ngày** khi `dirt ≥ 0.80`, ở tier ôn hoà, **không ghi memory tiêu cực**.

Lý do: không có nó, người chơi không có kênh ngôn ngữ nào để biết mình đang tích nợ — chỉ có ruồi, mà ruồi thì dễ bị bỏ qua như trang trí. Và nó khớp XĐ1.4: *"Người dạy là cô Ba, không phải hệ thống phạt."*

Đề nghị sửa §3.3 thành: *"**Không sinh bark tức thì theo từng thao tác.** Được phép **một** lời nhắc ôn hoà mỗi ngày khi vượt ngưỡng, không ghi memory tiêu cực."*

### 9.4. Ghi nhận `FLOURISH.lifetime` là cả quá trình ráp bánh — **đề nghị ghi chú**

CANON §3.2 mô tả `FLOURISH` là *"Thao tác đẹp: rạch bánh một đường, quết pate gọn, gói nhanh"* — nghe như ba động tác rời. Nhưng theo bảng §5.1, với salience 15 thì `t_confirm` tốt nhất là **7,02 giây**. Nếu `lifetime` là độ dài một động tác, sự kiện này **không bao giờ kích hoạt**.

Đề nghị thêm ghi chú vào CANON §3.2: *"`FLOURISH` là kích thích **liên tục suốt quá trình ráp một ổ bánh**, không phải sự kiện điểm. Nó chỉ được nhận thấy khi khách nhìn tay bạn gần như cả quá trình — đó là chủ đích."*

---

*Hết P1-02.*
