# P2-06 — Flow trò chuyện v2: hai kênh, không đóng băng

> ## ⚡ REVAMP 2026-10-20 — ⚠️ CHẾT MỘT PHẦN
> Căn cứ: [`CANON.md`](../CANON.md) bản revamp. Phần ☠️ không dùng làm căn cứ.
>
> | Mục | Trạng thái | Lý do / thay bằng |
> |---|---|---|
> | §2.9 câu lý do #3, #4 (tier), #7 (ký ức buồn), #8 (tier `RIVAL`/`anger`) | ☠️ | Sống nhờ quan hệ + trí nhớ NPC. Chỉ giữ lý do do người chơi/hoàn cảnh (#1, 2, 5, 6, 9–11) |
> | §2.11 (B) ràng buộc "không `..`, không ghi sổ tay", §6–§8 dòng `GossipCorner` / `GOSSIP_START_DAY` / RB4 | ☠️ | Đồn thổi, nghe lỏm, sổ tay chết. Cảnh chào/tán gẫu NPC↔NPC vẫn giữ, làm nền |
> | §2.12 cột `CHUYEN` "trí nhớ · lời hứa · arc" | 🔁 | Chỉ còn lời hứa trong lượt/ngày. Trí nhớ, arc chết |
> | §3 khoá `usedSeason`, §2.9 "cạn cả mùa" | 🔁 | Không còn mùa → cạn = lặp vô hạn. Cần luật quay vòng (shuffle-bag), chốt ở R6 |
> | §2.6, §5 `TALK_DEEP_PER_DAY`, §6 M3/M5 `seasonTalkCoverage` | ⏳ | Đo theo 40 ngày / 86 cuộc. Trần 2/ngày giữ tạm, đo lại theo độ lặp khi chơi vô hạn (R5) |
> | §1, §4, §8 số "17,2 khách/ngày", "26 giây/ổ" | ⏳ | Số khách đổi theo `Y(x)` (R5) |
> | §1, §6 checklist "`rel` không đổi", nhắc T3 | 🔁 | `rel` chết, T3 chết → luật "không hiện số" giờ theo T6. Checklist đổi thành "không tiêu cuộc" |
> | §2.16 bong bóng trên đầu "cô Ba"; câu mẫu xưng "cô/con" | 🔁 | Cô Ba ☠️ → nhân vật chính Phương Anh, xưng hô theo tuổi NPC (R0.5) |
> | Tên NPC, câu mẫu giọng Nam cũ | ⏳ | Tên riêng + giọng Nam gen Z ở R6 |
>
> **Còn dùng được:** luật hai kênh, `clock.busy`, NPC nói trước, cửa sổ ngắt quãng, ma trận xung đột, phím/mode, 4 loại hội thoại, chặn spam mời, §10–11 — nền T2, giữ nguyên qua R1–R0.5.

**Thuộc phase:** P2 — Hệ NPC đầy đủ (sửa hồi tố hệ đã ship dưới nhãn "P5-01/P5-02" trong code)
**Phụ thuộc:** `CANON.md` §1 (T1–T5) · §6 (delivery-diff) · §11 (kiến trúc thoại) · §12 (trí nhớ, đồn thổi) · §15 (trợ năng) · §16 (ba thứ đừng làm) — và `P2-01` (rule DB), `P2-02` (kênh phản ứng), `P2-04` (đồn thổi, nghe lỏm)
**Trạng thái:** **ĐÃ THI CÔNG** (sim + UI + nội dung + lưới chắn) · **Cần đo** bằng người thật ở §5
**Lệch so với bản thiết kế:** ba chỗ, ghi ở §10 — đọc trước khi sửa tiếp

> **Ghi chú định danh.** `src/sim/talk.ts` và `src/ui/stall/TalkPanel.ts` tự dán nhãn
> "P5-01"/"P5-02". Trong `docs/`, hai mã đó là *Trợ năng* và *Art và animation*. Hệ trò
> chuyện cây nhánh **chưa bao giờ có một doc thiết kế nào**. Doc này là cái quyết định bị
> bỏ sót đó, viết sau khi hệ đã chạy — và việc đầu tiên nó làm là sửa nhãn: hệ trò chuyện
> thuộc **P2**, cùng nhà với rule DB.

---

## 1. Mục tiêu

Gỡ xung đột giữa **nói chuyện** và **làm bánh** — xung đột đang làm người chơi phải chuyển
qua lại giữa hai màn hình trong cùng một phút chơi, và làm `CANON` T2 bị vi phạm trên thực
địa dù vẫn đúng trên giấy.

Nguyên nhân gốc, đo được chứ không phải cảm tính:

| Đo | Hiện tại | Nguồn |
|---|---|---|
| Một cuộc trò chuyện tốn | **22–32 giây** chú ý của người chơi | 410 ký tự/phiên @14 cps + 1,2 s quyết định/nhịp |
| Làm trọn một ổ cho một con người tốn | **26 giây** | 450 s tay làm ÷ 17,2 khách/ngày |
| Một cuộc trò chuyện tiêu tốn | **0 giây game** | `StallScene.openTalkPanel` → `clock.paused = true` |
| Kho thoại được viết cho | **2,15 cuộc/ngày** | 86 cuộc ÷ 40 ngày |
| Hệ thống hiện cho phép | **9–14 cuộc/ngày** | không có trần nào ở đường F |
| Tỉ lệ *đọc chữ : tay làm* khi chơi theo tagline | **1 : 1,5** (39% wall-clock đứng đọc) | §2.4 của `02-pm` |

> **Một câu:** *không phải nội dung sai, mà là cái vòi lắp sai chỗ và mở gấp 4,5 lần bể chứa.*

Doc này phục vụ:

- **T1** — lời của NPC phải tới người chơi **trong lúc họ đang làm việc và đang bị nhìn**,
  chứ không phải trong một hộp chữ đóng băng tách khỏi thế giới.
- **T2** — lần đầu tiên **thi hành được** T2 thay vì chỉ tuyên bố nó: khi có người đang chờ
  bánh, **không có nút chữ nào để bấm ngoài nguyên liệu**.
- **T3** — không một con số nào lên màn hình, kể cả chỉ báo mục tiêu và chỉ báo "đáp được".
- **T5** — chi phí của mỗi thao tác hội thoại **đọc được trước khi bấm**, và từ nay nó là
  một chi phí **thật**: giờ bán.

---

## 2. Cơ chế

### 2.1. Quyết định lõi — HAI KÊNH, chia theo "có ai đang chờ mình không"

Toàn bộ doc này rút gọn được thành một câu luật:

> **Khi có người đang chờ bánh, thứ duy nhất bạn nói được là ổ bánh.**
> **Khi không ai chờ, bạn mới nói được bằng miệng.**

| | **Kênh HÀNH ĐỘNG** | **Kênh LỜI** |
|---|---|---|
| **Điều kiện** | có bất kỳ khách nào `phase === "waiting"` chưa nhận bánh, **hoặc** `queue.length > 0` | không ai trong hai điều kiện đó |
| **NPC nói bằng** | bong bóng neo trên đầu, không chặn gì | bong bóng neo trên đầu, không chặn gì |
| **Người chơi đáp bằng** | **hành động**: nguyên liệu, ly trà, giá, thứ tự phục vụ, một cái chờ, một cái gật | **lời**: dải lựa chọn neo cạnh vai NPC |
| **Đồng hồ** | chạy bình thường | chạy ở `TIME_SCALE_BASE` (**không đóng băng**) |
| **Ngân sách đọc** | ≤ 12 từ hiện cùng lúc, ≤ 1 quyết định | đầy đủ cây, tối đa 3 lựa chọn/nhịp |
| **Trần** | không giới hạn (nó là vòng lặp lõi) | **2 cuộc/ngày · 0 cuộc trong PEAK** |

Hai kênh **dùng chung một kho nội dung**. Không một dòng nào trong 12.600 dòng JSON bị bỏ.
Cái bị bỏ là **thời điểm sai**, không phải chữ.

> **Vì sao chia đúng ở ranh giới "có ai đang chờ".**
> T2 không bảo vệ một sở thích thẩm mỹ. Nó bảo vệ **một thứ cụ thể**: *không được có đường
> tắt bằng lời để sửa thứ mình làm hỏng bằng tay*. Xin lỗi bằng mồm thay vì bỏ thêm ớt.
> Trong khoảng vắng thì **không có gì đang được sửa** — không ai chờ, không có ổ nào nguội,
> không có ai nhìn mình làm. Ở đó T2 không có gì để bảo vệ, và cây thoại không mâu thuẫn
> với nó. Ngược lại, **hiện trạng mới là cái phạm T2 thật**: 46 nút `act`
> (`DISCOUNT` / `FREE_LOAF` / `PROMISE`) cho người chơi mua quan hệ bằng miệng **giữa lúc
> khách đang chờ** — đúng thứ §8(i) cấm.

### 2.2. Quyết định lõi — BỎ `clock.paused`, thay bằng `clock.busy`

Đây là thay đổi một dòng, và nó một mình đóng bốn lỗi.

```ts
// StallScene.openTalkPanel() — CŨ
this.clock.paused = true;          // 0 giây game, 32 giây chú ý

// MỚI
this.talkHoldsClock = true;        // scene báo xuống clock mỗi frame
this.clock.busy = this.service.busy || this.talkHoldsClock || this.finaleAt >= 0;
```

`Clock.currentScale()` đã sẵn có đúng cơ chế cần dùng:

```ts
return (this.busy ? TIME_SCALE_BASE : b.idle) * this.scaleMul * this.devFastForward;
```

Hệ quả bằng số, ở `LULL` (`scaleIdle = 120`, `TIME_SCALE_BASE = 30`):

| | Giây chú ý | Phút game tiêu | % một ngày (300 phút) |
|---|---|---|---|
| Hiện tại (`paused`) | 25 | **0** | 0% |
| Không làm gì (để `idle` 120) | 25 | 50 | 16,7% — quá tàn nhẫn |
| **Đề xuất (`busy` → 30)** | 25 | **12,5** | **4,2%** |
| 2 cuộc/ngày | 50 | 25 | **8,3%** |

**Bốn lỗi bị đóng cùng lúc:**

1. **H-04** — panel hết là "nút dừng giờ miễn phí vô hạn" (lò, trục nguội, kiên nhẫn khách,
   `handWarmth` đều từng đóng băng miễn phí).
2. **L17 / lỗi #5** — chi phí chú ý và chi phí game lần đầu **đi cùng chiều**. Spam thôi là
   hành vi tối ưu, vì mỗi lần spam ăn mất giờ bán thật.
3. **Van tự nhiên thay cho một con số** — người chơi tự học "nói chuyện thì mất giờ" bằng
   cách **nhìn cái đồng hồ treo tường đã có sẵn trên HUD**. Không thêm một chỉ số nào. **T3 an toàn.**
4. **Trợ năng miễn phí** — chế độ không giới hạn thời gian đã đặt `scaleMul = 0.5`, nên nó
   tự động giảm nửa chi phí này, không cần một nhánh `if` nào.

> **Phản đối đã lường trước:** *"đọc không kịp thì sao?"* — Trả lời: **nếu một đoạn cần
> đóng băng để đọc kịp thì đoạn đó quá dài; cắt nội dung, đừng dừng thế giới** (luật L6).
> Trần 3 lựa chọn/nhịp ở §2.5 và nhãn ≤ 24 ký tự ở §4.2 chính là cái cắt đó. Và `P` vẫn
> vào được menu tạm dừng **mọi lúc** — xem §2.7, đó là một vi phạm `CANON` §15.2 đang tồn
> tại phải sửa bất kể doc này.

### 2.3. Quyết định lõi — NPC NÓI TRƯỚC, phím chỉ để TRẢ LỜI

Luật mới, phát biểu bằng một câu: **mọi câu mô tả ý định hoặc tình huống của chính NPC thì
NPC phải tự nói ra; người chơi không bao giờ phải bấm phím để moi nó ra.**

Bằng chứng vì sao luật này bắt buộc — chính là lỗi #2 của chủ dự án, nay đo được thành số:

| | |
|---|---|
| `walkin.nhamquan` (*"Cho tui tô hủ tiếu, ít hành nghen"*) | `src/content/talks/walkin.json:464`, `weight: 12`, không có `when` |
| Xác suất bị rút **khi người chơi bấm F**, ngày 1–3 | **32,4%** |
| Số cuộc trong `walkin.json` khai `initiates` | **0 / 6** |
| Toàn kho | **17 / 86** |

Nghĩa là: câu *"cho tui tô hủ tiếu"* — một câu mà **chỉ NPC mới có lý do nói ra** — hiện
**100% số lần xuất hiện đều đi sai kênh**, vì nó không có đường nào khác để ra.

**Nguyên nhân gốc trong code:** có hai đường vào nhưng chỉ một đường có bộ lọc.

```ts
// service.ts:2851 — offerTalk()  CÓ lọc
pickTalk(this.talks.get(key).filter((t) => !!t.initiates), ...)

// service.ts:2302 — openTalk()   KHÔNG lọc  ← gốc lỗi #2
pickTalk(this.talks.get(key), this.talkCtx(c), this.dialogRng)
```

Và `initiates` **chưa bao giờ** là một bộ lọc — `eligible()` (`talk.ts:398-404`) chỉ xét
`npc` / `usedSeason` / `usedToday` / `when`. Nó chỉ là một *xác suất* mà `offerTalk` tự đọc.

**Sửa — thêm một trường bắt buộc, build fail nếu thiếu:**

```ts
type Talk = {
  /**
   * AI được quyền mở lời. Bắt buộc khai — linter nội dung fail nếu vắng.
   *   NPC_ONLY    câu mô tả ý định / tình huống / yêu cầu CỦA HỌ. Người chơi không moi ra được.
   *               ("Cho tui tô hủ tiếu" · "Bữa nay bán đắt hông con?" · "Thơm dữ ta")
   *   PLAYER_ONLY câu chỉ có nghĩa khi người chơi chủ động gợi. ("Dạo này bà khoẻ hông bà?")
   *   BOTH        ai mở cũng được.
   */
  source: "NPC_ONLY" | "PLAYER_ONLY" | "BOTH";
  // ...
};
```

| Đường vào | Tập được rút |
|---|---|
| Người chơi chủ động (`openTalk`) | `source !== "NPC_ONLY"` |
| NPC tự mở lời (`offerTalk`) | `source !== "PLAYER_ONLY"` **và** qua cổng cửa sổ §2.4 |

**Linter nội dung bắt buộc (`npm run lint:lines`, mã mới L014):** quét `opener`, tìm dấu
hiệu một đơn hàng hoặc một yêu cầu — `"cho tui"`, `"cho con"`, `"lấy cho"`, `"bán cho"`,
`"còn ... hông"` — và **fail** nếu cuộc đó không khai `NPC_ONLY`. Ước **12–18 cuộc** phải
đánh lại cờ, phần lớn nằm ở `walkin.json` và `qua-duong.json`.

**Và bỏ điều kiện `offerTalk` chỉ rút cuộc có `initiates`.** Hiện 17/86 cuộc khai, tổng xác
suất 4,02 — nên thế giới gần như không bao giờ tự mở lời. Từ nay `source: "NPC_ONLY"` là
đường vào thứ hai, không cần `initiates > 0`.

### 2.4. Cửa sổ ngắt quãng — NPC được phép bắt chuyện LÚC NÀO

Ba cái van hiện có (`initiates`, `TALK_OFFERS_PER_DAY = 3`, `TALK_OFFER_GAP_SEC = 100`)
**đều là van tần suất. Không cái nào là van ngữ cảnh.** Nên một lời bắt chuyện vẫn nổ được
đúng lúc người chơi đang cầm ổ nóng.

Bốn **cửa sổ an toàn** (ranh giới nhiệm vụ thô — chỗ ngắt quãng rẻ nhất):

| # | Cửa sổ | Vì sao an toàn |
|---|---|---|
| **✅1** | **Ngay sau khi đưa bánh, lúc tay đang dính tiền** | Không chạm được đồ ăn nên **không gì hỏng được**, mà khách vẫn đứng đó cầm ổ — hợp lý về mặt xã hội. **Cửa sổ tốt nhất, và hiện không cơ chế nào dùng nó.** |
| ✅2 | Ổ nằm trong lò, trước băng SÉM (~12,4 s tay rảnh) | Lò chạy nền, người chơi chỉ đang chờ |
| ✅3 | Trong và ngay sau khi rửa tay | Tay đã bận sẵn vào một việc không hỏng được |
| ✅4 | Tay không, không có ổ nào đang nguội, không ở trạm nào | Rảnh thật |

Bảy **cửa sổ cấm** (`offerTalk()` trả `false`, và lời mời được **hoãn**, không bị bỏ):

⛔ đang cầm `loaf_hot` / `loaf_filled` · ⛔ `AssemblyPanel` đang mở · ⛔ trong cửa sổ
FLOURISH 900 ms của thao tác gói · ⛔ lò đang ở băng SÉM · ⛔ `handsBusy` (rót trà, lau
thớt, nhận tiền, ghi sổ) · ⛔ khách đang gọi món · ⛔ có đồ rơi dưới sàn chưa dọn.

```ts
offerTalk(c: Customer, ctx: HandsCtx): boolean {
  if (!safeWindow(ctx)) { this.deferOffer(c); return false; }   // HOÃN, không bỏ
  // ... các van tần suất như cũ
}
```

> **`hoãn` phải có thời hạn và phải nổ ra.** Một sự kiện bị hoãn mà không bao giờ phát là
> `bỏ` trá hình, và nó đẻ ra đúng cái bẫy "bị phạt vì thứ mình không thấy". Hàng đợi hoãn
> giữ tối đa 2 lời, mỗi lời sống 90 giây thật; quá hạn thì **huỷ im lặng, không phạt**.

### 2.5. Ma trận xung đột — hành vi ĐÚNG cho mọi ô

**Hàng** = người chơi đang làm gì · **Cột** = loại sự kiện hội thoại.
`im` · `bb` bong bóng · `bb+cb` bong bóng + chỉ báo đáp được · `dải` mở dải lựa chọn ·
`hoãn` xếp hàng, phát khi tay rảnh · `bỏ` không sinh sự kiện.

| Người chơi đang… | NPC chào | **NPC gọi món** | NPC bắt chuyện dài | NPC ↔ NPC tán gẫu | Người qua đường |
|---|---|---|---|---|---|
| Đang kẹp nhân | `bb` | **`bb`** | `hoãn` | `bb` (ngoài khung bảng) | `bỏ` |
| Đang nướng (ở lò) | `bb` | `bb` | `bb+cb` | `bb` | `im` |
| Tay cầm ổ nóng | `bb` | `bb` | `hoãn` | `bb` | `bỏ` |
| Đang rửa tay / lau thớt | `bb` | `bb` | `hoãn` | `bb` | `bỏ` |
| Đang ghi sổ (G) | `bb` | `bb` | `hoãn` | `im` | `bỏ` |
| **Đang rảnh** | `bb+cb` | `bb+cb` | `bb+cb` → `dải` nếu người chơi bấm đáp | `bb` | `bb+cb` |
| Đang có 3 khách chờ | `bb` | `bb` | **`bỏ`** | `im` | `bỏ` |

**Sáu luật đọc ma trận:**

1. **Không ô nào là `dải` tự động.** Dải lựa chọn chỉ xuất hiện ở hàng "đang rảnh", và chỉ
   **sau một hành động chủ động của người chơi**. Đây là chỗ đóng lỗi #1 và #3 cùng lúc.
2. **Cột "NPC gọi món" không bao giờ `hoãn`.** Đơn hàng là dữ liệu người chơi **bắt buộc**
   phải nghe (T2 — không có checklist). Hoãn nó là làm hỏng vòng lặp lõi.
3. **`hoãn` phải nổ ra** — xem §2.4.
4. **`bỏ` ≠ `im`.** `bỏ` = sự kiện không được sinh ra (tiết kiệm chú ý). `im` = sự kiện xảy
   ra ở thế giới nhưng không kênh nào báo — NPC vẫn nói với nhau, người chơi đang cắm mặt
   vào lò thì không nghe thấy. Đúng tinh thần ba tầng nghe lỏm của `overhear.ts`.
5. **"3 khách chờ" là trạng thái chặn mạnh nhất** — và luật này **không phải phát minh mới**:
   `inviteChance` (`passersby.ts:203`) đã có `ahead >= slots ⇒ 0`. Đây chỉ là mở rộng một
   luật đã có ra toàn hệ.
6. **Hàng "đang nướng" được `bb+cb` ở cột bắt chuyện dài** vì đứng ở lò là lúc tay rảnh nhất
   trong các trạng thái bận.

### 2.6. Van thời lượng

| Tham số | Cũ | **Mới** |
|---|---|---|
| Trần cuộc **sâu** (có dải lựa chọn) mỗi ngày | không có ở đường F; 3 ở đường NPC | **2** (ngày đặc biệt 3), áp cho **cả hai** đường |
| Cuộc sâu trong khung `PEAK` (6h30–8h) | không giới hạn | **0** |
| Lựa chọn hiện mỗi nhịp | 4 (trung bình 3,17) | **3** |
| Điều kiện cứng mở dải | không có | không ai `waiting` chưa nhận bánh **và** `queue.length === 0` |
| Bong bóng + chào hỏi ngắn | — | **không giới hạn** — đây là thứ phải TĂNG, không giảm |

> **Đây là cái van sửa hai lỗi lớn nhất cùng lúc.** Mô phỏng tiêu thụ kho qua 40 ngày:
>
> | Dùng | Ngày đầu tiên bị hụt | Số lần bấm ra con số không, cả mùa |
> |---|---|---|
> | **2/ngày** | ngày 38 | **5** |
> | 4/ngày | ngày 18 | 85 |
> | **9/ngày (hiện tại)** | **ngày 2** | **285** |
>
> Lỗi #6 (*"hết chuyện để nói với abc bữa nay rồi"*) vì vậy **không phải lỗi câu chữ**. Ở
> vòi hiện tại, cả 86 cuộc bị uống cạn trong 10 ngày đầu và 30 ngày còn lại cái hẻm câm.
> Sửa câu chữ là dán băng cá nhân. **Siết vòi về 2/ngày biến 285 lần thất vọng thành 5 lần
> cả mùa** — đồng thời kéo tỉ lệ đọc/làm từ 39% xuống 11%.

### 2.7. Phím và mode — gỡ ba mode error

Ba lỗi mode đang tồn tại, cả ba đều là lỗi học-không-được:

| Lỗi | Hiện trạng | Sửa |
|---|---|---|
| **`F` vừa mở vừa đóng-có-phạt** | `TalkPanel.ts:225`: `KeyF` gọi `close()` → `applyIgnore` → `rel −1`. Hint **không hề nhắc F**. Và handler **không kiểm `ev.repeat`** → **giữ F hoặc giữ Space chạy hết cả cây trong một phần mười giây**, áp đủ `rel`/`anger`/`act`, rồi `markTalkUsed` ⇒ **mất nội dung vĩnh viễn cả mùa** | `F` **chỉ mở**. Bỏ `KeyF` khỏi `bindKeys`. **Mọi handler hội thoại bỏ qua `ev.repeat`** |
| **`Esc` mang ba nghĩa, một trong ba có giá** | park ổ bánh · đóng panel **và bị phạt** · mở pause | `Esc` **chỉ một nghĩa: lùi ra khỏi lớp trên cùng, luôn miễn phí**. "Làm thinh" thành **một dòng `IM` trong chính dải lựa chọn** — giọng `TalkTone.IM` đã có sẵn |
| **`P` bị nuốt → không vào được pause** | `TalkPanel.bindKeys` `stopPropagation()` trên **mọi** `keydown` | Whitelist: `P`, `Tab`, `F1`–`F8` luôn đi qua. **Đây là vi phạm `CANON` §15.2, phải sửa bất kể doc này** |

> **"Làm thinh" thành một dòng được viết ra, chứ không phải tác dụng phụ của việc đóng UI,
> còn hợp T2 hơn hiện trạng**: im lặng trở thành *nội dung có người viết*, có `mood`, có
> hệ quả khai sẵn — thay vì một hình phạt ẩn sau phím thoát.

**Sơ đồ phím — 0 phím mới.** `E`/`Space` là phím tương tác duy nhất, phân giải bốn dòng:

```
① có người đang chờ mình trả lời (bong bóng "…" còn treo)  → trả lời họ   [thắng tuyệt đối]
② đang đứng cạnh một trạm có việc làm được                  → làm việc đó
③ có người nói chuyện được trong tầm                        → bắt chuyện
④ không gì cả                                               → nói ra lý do (§2.9), không im
```

`F` giữ lại làm **alias tuỳ chọn** "ép nói chuyện" — lối thoát cho quy tắc ②, và người chơi
cũ không phải học lại. `R` / `Q` / `G` / `Tab` / `P` giữ nguyên.

**Không dùng `hold` để phân tầng ý định.** Ngân sách giữ của `E` đã hết (lò 1500–2300 ms,
bồn rửa 3 s, rót trà). Phân tầng bằng **ngữ cảnh đọc được**: có bong bóng `…` treo trên đầu
họ hay không. Thêm hai tuỳ chọn trợ năng: *giữ→bấm* và *`C`-gạt*.

### 2.8. Chỉ báo mục tiêu — lỗi #7

**Lỗi #7 không phải thiếu rõ ràng, nó là không thể tiếp cận về mặt cấu trúc.** Dòng nhắc
`"F — nói chuyện với <tên>"` (`StallScene.ts:1284`) nằm **cuối** chuỗi `prompt()`, **sau**
mọi nhánh `near?.id === "oven" | "basket" | "bin" | "board"`. Đứng ở lò hay ở thớt — tức là
**gần như toàn bộ thời gian chơi** — dòng đó **không bao giờ hiện**. Tệ hơn: `nearbyToTalk()`
(`service.ts:2399`) **loại `front` ra**, nên mục tiêu phổ biến nhất của phím lại là mục tiêu
duy nhất không có chỉ báo nào.

**Thuật toán — chi phí có trọng số theo trục:**

```ts
const W_LATERAL = 1.00, W_DEPTH = 0.45;   // ở quầy mọi người đều cách ~2,1 ô theo y
const B_FRONT = -0.90, B_ADDRESSED = -99; // người đang chờ mình đáp thắng tuyệt đối
const P_NPC_BUSY = +1.20, P_REFUSED = +1.20;
const TALK_STICKY = 0.62;                 // = stations.STICKY, bám dính mục tiêu

function talkTarget(player, cands): Customer | null {
  let best = null, bestCost = TALK_REACH;
  for (const c of cands) {
    if (!talkable(c)) continue;
    if (blockedByProp(player, c)) continue;          // quầy, xe — H-22
    if (c.phase === "arriving") continue;            // H-10
    let cost = W_LATERAL * Math.abs(c.x - player.x)
             + W_DEPTH   * Math.abs(c.y - player.y)
             - 0.80 * facingDot(player, c)           // nón 90°
             + (c === front ? B_FRONT : 0)
             + (c.addressedPlayer ? B_ADDRESSED : 0)
             + (c.inNpcScene ? P_NPC_BUSY : 0)
             + (c.inviteRefused ? P_REFUSED : 0);
    if (c === lastTarget) cost -= TALK_STICKY;       // chống nhấp nháy mục tiêu
    if (cost < bestCost) { best = c; bestCost = cost; }
  }
  return best;
}
```

Vì sao `W_DEPTH` chỉ 0,45: ở quầy **mọi người đều cách người chơi ~2,1 ô theo `y`** — đó là
hằng số, nó chỉ gây nhiễu; **chỉ trục `x` mới phân biệt được ai với ai**. Và người qua đường
**không thể bị chọn nhầm** vì hình học: `Δy ≥ 4,1 > TALK_REACH = 3`.

**Chỉ báo = vòng ellipse mảnh dưới CHÂN người được nhắm** + chip tên sẵn có đổi sang `ink`
với tiền tố `E ·`. Lý do kỹ thuật chứ không phải thẩm mỹ: hai chỗ xếp hàng cách nhau 45 px
ngang trong khi thân người chỉ 26 px ⇒ **bàn chân không bao giờ chồng nhau** —
`CustomerActor.ts:280` đã dựa vào đúng tính chất đó cho chip tên.

**Không dùng `!` hay `?` trên đầu NPC** — `CustomerActor.ts:304` **đã chiếm** hai ký hiệu đó
cho hệ ánh nhìn (`GLIMPSED` / `CONFIRMED`). Mọi phương án "dấu chấm than kiểu JRPG" loại ngay.

**Đổi mục tiêu = bước dọc quầy.** Không phím mới, diegetic. Hai chevron nhỏ hai bên vòng
chân dạy luật đó mà không cần một dòng hướng dẫn nào.

**FR-21 (bắt buộc):** `talkTarget` là **một state công khai, tính một lần mỗi frame**; mọi
UI chỉ báo **và** mọi hành động bấm phím đọc **cùng** state đó. Hiện `talkTarget()` và
`nearbyToTalk()` là **hai hàm khác luật** — đó là gốc của việc "bấm ra người khác với người
được tô sáng".

### 2.9. Lỗi #6 — mười một câu, phân theo NGUYÊN NHÂN THẬT

Câu hiện tại sai hai tầng: (a) ghi **"bữa nay"** nhưng state `usedSeason` là **vĩnh viễn cả
mùa** — máy nói dối về phạm vi; (b) một câu duy nhất cho mọi lý do.

Nguyên tắc: **ánh xạ mỗi nguyên nhân kỹ thuật sang một lý do CON NGƯỜI nhất quán, rồi luôn
dùng đúng lý do đó.** Nhất quán quan trọng hơn hay.

| # | Nguyên nhân kỹ thuật | Lý do con người | Câu | Biểu hiện bắt buộc |
|---|---|---|---|---|
| 1 | `handsBusy` / cửa sổ ⛔ | **mình** đang bận | *"Tay còn đang dính, để lát."* | lời của chính người chơi, NPC không có bong bóng |
| 2 | `usedToday` (đã nói chủ đề này hôm nay) | mình vừa hỏi rồi | *"Nãy hỏi rồi mà con."* | `CUOI_KHAN` |
| 3 | `usedSeason` cạn + tier thấp | chưa thân đủ | *"Dạ."* (gật, hết) | `LANH`, `TURN_AWAY_QUARTER` |
| 4 | `usedSeason` cạn + tier FRIEND | rỗi mà không có tin gì | *"Bữa nay cũng vậy à con."* | `CUOI`, `NOD` — **ấm, không phải từ chối** |
| 5 | NPC đang `queueing` sau người khác | họ đang chờ tới lượt | *"Có người trước kìa con."* | `NGHIEM` |
| 6 | `waitRatio` cao | họ đang gấp | *"Thôi con làm đi, {self} vội."* | `BUC`, `ARMS_CROSS` |
| 7 | `dayMood` xấu / ký ức buồn đang hoạt động | hôm nay họ có chuyện | *"Bữa nay {self} hổng có tâm trạng."* | `BUON`/`MET`, `IDLE`. **Không cười** |
| 8 | tier `RIVAL` / `anger` còn tồn | họ không muốn nói chuyện **với mình** | *"Bán đi, khỏi nói nhiều."* | `LANH`, `FREEZE` |
| 9 | người đi ngang đã từ chối lời mời | họ trả lời rồi | *"Nói rồi mà cô."* / bước nhanh hơn, không ngoái | — |
| 10 | nội dung chưa nạp xong | **không có lý do con người nào** | **không hiện gì**, ~200 ms rồi mở bình thường | nói dối về cái này là làm hỏng 9 câu trên |
| 11 | không ai trong tầm | không có ai ở đó | **không hiện gì, và không ai được tô sáng** | nếu §2.8 làm đúng thì dòng này thừa |

**Luật chọn: duyệt 1 → 9, dừng ở điều kiện đầu tiên khớp.** Thứ tự không tuỳ tiện — nó đi từ
nguyên nhân thuộc về **người chơi** (1), ra nguyên nhân thuộc về **hoàn cảnh** (5–7), rồi mới
tới nguyên nhân thuộc về **quan hệ** (8).

> **Quan hệ luôn là lời giải thích cuối cùng, không bao giờ là mặc định.** Theo T3, người
> chơi không kiểm chứng được nó — nên nói bừa về nó là nói dối một thứ người ta không cãi
> lại được.

Và câu #3 vs #4 xử lý **cùng một mã lỗi** (`usedSeason` cạn) nhưng rẽ theo `tier`: *"hết nội
dung" không phải một sự thật về thế giới, nên nó phải mượn một sự thật có thật để mặc vào.*
Người lạ thì cụt lủn; người thân thì rỗi rãi mà không có tin gì. Cả hai đều bình thường
giữa người với người.

### 2.10. Lỗi #5 — chặn spam mời

Roll đã tất định (`hub.derive('invite:<id>')`) nên **kết quả** không đổi — nhưng **cơ hội**
thì không bị chặn: grep toàn repo, **không tồn tại cờ nào** (`invited` / `refusedInvite`).
Và Esc trước khi chọn câu thì không phạt, không `markTalkUsed` ⇒ mở lại vô hạn.

Ba cái chặn, cả ba đều cần:

1. **`Customer.inviteRefused`** — đặt `true` khi roll trượt. Mọi lựa chọn `INVITE` sau đó bị
   **ẩn** (không phải bị roll lại). Họ **đi tiếp ngay**, không đứng thêm `PASSER_TALK_STAY`.
2. **Tối đa một lời mời mỗi lượt đi ngang**, và nói rõ bằng trạng thái rằng cơ hội đã dùng.
3. **Chi phí cùng trục** (§2.2): mời tốn giờ bán thật. Spam 5 lần liên tiếp **phải** làm
   hàng chờ dài ra hoặc một ổ trong lò sém — nếu không thì spam vẫn là hành vi tối ưu.

> Đây là một lịch thưởng **tỉ lệ biến thiên** với chi phí game **bằng 0** và ~75–95 người
> đi ngang mỗi ngày. Spam không phải người chơi lách luật; nó là **phản ứng tối ưu** với
> cái lịch thưởng mình tự dựng.

### 2.11. Lỗi #4 — NPC với NPC, bản rẻ nhất

**Quyết định: LÀM — 1,5 ngày công, 0 hệ thống mới, 0 byte save mới.**

Lý do làm dù nó là feature mới: **80% hạ tầng đã chạy trong build.** `GossipCorner.ts`
(63 dòng) đã biết fade hai NPC vào góc hẻm, cho họ nói **ba câu luân phiên** qua `BubblePool`,
rồi fade ra. `OverhearScene` đã có ba tầng nghe. `Customer.pass.nod` đã có và đã dùng.

Và nó sửa một triệu chứng thật: cảnh góc hẻm hiện chỉ sáng đèn khi **đêm trước có truyền
tin**, mà `GOSSIP_START_DAY = 9`. Nghĩa là **8 ngày đầu — đúng quãng demo, đúng quãng quyết
định hoàn tiền — cái hẻm hoàn toàn câm.** Đó chính xác là cảm giác chủ dự án mô tả.

> *"Vocalizing intentions can sometimes even be enough, without any actual implementation."*
> — Jeff Orkin (F.E.A.R.), dẫn trong `CANON` §16.
> Dịch ra: **người chơi cần NGHE thấy hai người quen nhau. Họ không cần hai người đó thật sự
> có quan hệ trong mô phỏng.**

| | Việc | Ngày | Nội dung mới |
|---|---|---|---|
| **A** | **Cái chào ngang đường.** Hai người đi ngang giao nhau < 1 ô → roll `hub.derive('greet:<day>:<pairKey>')` < 0,25 → cả hai **chậm lại 0,8 s** (không dừng hẳn, **không quay mặt, không pathing**), một người phát bong bóng, người kia đáp sau 1,2 s | 0,5 | ~20 dòng ngắn |
| **B** | **Mở góc hẻm cho ngày KHÔNG có tin đồn** — cảnh thứ hai/ngày, chạy được cả khi `gossip.overhear == null`, dùng pool "tán gẫu rỗng" (thời tiết, giá cả, con cái) | 0,5 | ~15 dòng |
| **C** | **Chú Kiệt / bà Sáu đi ngang chào nhau** — `pass.nod` đã có, thêm một bong bóng và một câu đáp | 0,5 | 4–6 dòng |

> **⚠️ RÀNG BUỘC CỨNG của (B), nếu bỏ qua là phá `P2-04`:** cảnh rỗng **không có hai chấm
> `..`**, và nghe lỏm tầng 2 trên nó **không ghi gì vào sổ tay**. Hai chấm phải tiếp tục là
> một lời hứa đáng tin — *"ở đây có tin thật"*. Nếu người chơi nghiêng người ba lần liền để
> nghe chuyện thời tiết, họ bỏ cơ chế nghe lỏm vĩnh viễn — và `CANON` §12 RB4 nói rõ:
> **không có nghe lỏm thì bỏ luôn cả đồn thổi lẫn nhớ nhầm.**
>
> Phát biểu thành luật: **chỉ thứ gì mang một `claim` của hệ đồn thổi mới được quyền đòi
> người chơi trả giá để nghe. Mọi lời nói khác giữa hai NPC là nền — và nền thì miễn phí,
> không báo hiệu, không mất gì khi bỏ qua.**

**KHÔNG làm** (giữ danh sách này): lịch hẹn gặp giữa 12 NPC có tên (Đừng-1, và `npc-schedule`
là stream RNG có hợp đồng — chèn roll vào đó là dịch cả mùa) · pathing tới chỗ hẹn (Đừng-1 +
Đừng-2) · thoại NPC-NPC phụ thuộc quan hệ hai bên (chi phí tổ hợp 12×12, người chơi không
đọc ra được) · NPC nhớ cuộc nói chuyện với nhau (mở lại mọi lỗ hổng cap-hop của `gossip.ts`).

### 2.12. BỐN LOẠI HỘI THOẠI — trục thứ hai, vuông góc với `depth`

Chủ dự án nêu sau bản đầu: *"nó đang dùng chung giữa bắt chuyện với người qua đường và
bắt chuyện với người đang mua bánh. 2 cái này nên khác nhau chứ nhỉ?"* — đúng, và chính
dữ liệu đã nói trước: **cả 8 cuộc `QUA_DUONG` đều sâu đúng 2 nhịp, 6/8 kết thúc bằng
`INVITE`**. Nội dung tự nó đã là *lời mời*; chỉ có cái máy đang đối xử với nó như một
cuộc trò chuyện.

`depth` trả lời *"đọc mất bao lâu"*. `kind` trả lời **"chuyện này để làm gì"** — và đó
mới là thứ quyết định luật chơi.

| | **MOI** | **CHAO** | **MUA** | **CHUYEN** |
|---|---|---|---|---|
| Kho | `QUA_DUONG` (có `INVITE`) | `ANY` + `QUA_DUONG` (không `INVITE`) | `WALKIN` | 12 người có tên |
| Để làm gì | họ dừng lại hay không | không để làm gì | mua bán phát sinh | thân hơn, biết chuyện của họ |
| Ai mở lời | **người chơi** luôn luôn | ai cũng được | NPC | NPC |
| Hệ quả | một cái roll, hết | gần như không | sống trong lượt ghé rồi tắt | **trí nhớ · lời hứa · arc** |
| Tiêu trần ngày | **không** | không | không | **có** |
| Cổng giờ cao điểm | không | không | không | **có** |
| Động từ trên dòng nhắc | *"mời … ghé mua"* | *"nói chuyện với …"* | *"nói chuyện với …"* | *"nói chuyện với …"* |

**Ba chuyện vô lý mà việc dùng chung sinh ra**, và cái nào sửa thế nào:

| | Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|---|
| 1 | Mời **một** người lạ ghé mua ăn mất **nửa ngân sách trò chuyện của cả ngày** — hết lượt nói chuyện với bà Bảy, chú Tư | 6/8 cuộc `QUA_DUONG` có `act` ⇒ bị xếp `FULL` ⇒ tiêu `TALK_DEEP_PER_DAY` | `countsAgainstDailyCap()` chỉ đúng với `CHUYEN` |
| 2 | Người đang **đi bộ** bị giữ lại đọc một cây hội thoại, rồi **bốc hơi giữa chừng** sau 4 giây | `openTalk` hẹn cứng `until = now + 4`, không gia hạn; và họ bị `splice` chứ không qua `leave()` nên phiên không được dọn ⇒ **cả hẻm câm** tới khi bấm Esc | gia hạn `until` mỗi frame khi còn đang nói; dọn phiên ngay tại chỗ `splice` |
| 3 | Câu báo lý do nói về *tâm trạng hôm nay* và *độ thân* của một người mình **chưa từng gặp** | `talkUnavailable` tra `mem(memKey)`, mà `memKey` của người lạ là `walkin<dáng>` — tám cái sổ dùng chung cả mùa | người đi ngang có bộ lý do riêng, ba câu, không đụng trí nhớ |

> **Một chuyện đã KIỂM LẠI VÀ KHÔNG PHẢI LỖI.** Bản nháp của mục này từng ghi rằng làm
> thinh với một người đi ngang sẽ trừ điểm quan hệ lên khoá `walkin<dáng>` dùng chung.
> Sai: `applyTalkOption()` đã bọc toàn bộ phần ghi `rel`/`mem` trong `if (c.npc)`, mà
> người đi ngang và khách vãng lai đều có `npc === null`. Ghi lại ở đây để người sau khỏi
> đi "sửa" một thứ đang đúng.

**Vì sao `kind` được SUY RA chứ không bắt khai thêm một trường nữa** (`talk.kindOf`):
bốn loại đã tương ứng 1–1 với bốn kho thoại sẵn có, nên khai tay chỉ tạo thêm một chỗ để
lệch. Trường `kind` vẫn có trong schema để ghi đè khi một cuộc là ngoại lệ thật.

**Hệ quả đo được:** 19 cuộc `CHUYEN` sâu + ~50 cuộc ngắn với 12 người có tên = ~69 cuộc
cho 40 ngày ≈ **1,7 cuộc/ngày**, nằm vừa dưới trần 2. Trần là một **cái trần**, không phải
một định mức phải lấp đầy — test `V-8` đo *nguồn cung của 12 người có tên*, không đo số
cuộc tiêu trần, chính vì đo nhầm sẽ dẫn tới việc "sửa" bằng cách đôn `SHORT` lên `FULL`,
tức làm mọi cuộc dài ra để qua một cái test, đúng chiều ngược với cả tài liệu này.

### 2.13. MỜI KHÁCH — hai chỗ cửa bị hẹp lại, một đã sửa, một còn mở

Cửa DUY NHẤT để một người đi ngang thành khách là người chơi tự bước ra mời. Đo đường đó
sau khi tách cơ chế, nó hẹp hơn hẳn thiết kế:

| | Trước | Sau |
|---|---|---|
| Bấm phím lên người đi ngang → rút trúng cuộc **có đường mời** | **41,7%** | **100%** |
| Số nhánh nhịp-1 **dẫn tới được** lời mời | **6/24** | 6/24 — *chưa sửa* |

**Chỗ đã sửa (code).** Kho `ANY` (chào hỏi) được `TalkStore.get()` ghép vào MỌI người,
kể cả người đi ngang — nên sáu trong mười hai cuộc rút được là chuyện thời tiết. Cộng với
dòng nhắc ghi sẵn *"mời … ghé mua"*, đó là một lời hứa bị bẻ gần sáu phần mười số lần.
`pickRunnable()` giờ ưu tiên tuyệt đối cuộc `MOI` khi mục tiêu là người đi ngang, và
`talkVerb()` đổi chữ theo cuộc THẬT SỰ rút được chứ không theo loại người — hôm nay mời
hết rồi thì dòng nhắc nói "nói chuyện", không nói "mời". Lưới: `p6-passersby`
*"bước ra đường với người đi ngang thì LUÔN mời được"*.

**Chỗ CÒN MỞ (nội dung).** Trong 5 cuộc `MOI`, lời mời nằm ở nhịp 2 và **chỉ MỘT trong ba
nhánh nhịp-1 dẫn tới được nó**. Hai nhánh kia là chuyện phiếm rồi cụt. Nên kể cả khi đã
rút trúng cuộc có mời, người chơi vẫn phải đoán trúng nhánh — mà không có gì đọc được
trước để đoán. Đó là T5.

Hình dạng ĐÚNG cho một lời mời: **mọi cách tiếp cận đều phải đóng được**, chỉ khác nhau ở
tỉ lệ — và `inviteChance` đã dựng sẵn đúng cơ chế đó (`INVITE_TONE`: ấm +0,2 · giỡn +0,08
· thường +0,04 · thẳng −0,04; lạnh/gắt/chửi = 0 tuyệt đối). Tức là *giọng* đã là cái cần
quyết tỉ lệ; việc một nhánh không có nút mời nào là thừa, và nó biến một bài test tay
nghề thành một lần đoán mò.

> **Vì sao chưa sửa ở đây.** Sửa nó là viết lại cây của `qua-duong.json` — prose của
> người viết nội dung dự án, không phải của tôi. Và nhận xét gần nhất của chủ dự án về
> chính mấy dòng tôi tự viết là *"nghe hơi AI"*. Nên chỗ này để lại thành một việc có mô
> tả rõ: giữ nguyên giọng, chỉ đổi CẤU TRÚC — mỗi nhánh nhịp-1 kết bằng một nút `INVITE`
> mang `tone` của chính nhánh đó.

---

## 3. Dữ liệu & schema

```ts
type Talk = {
  id: string;
  npc: string;
  topic: string;

  /** MỚI — bắt buộc. Ai được quyền mở lời. Linter L014 fail nếu vắng. */
  source: "NPC_ONLY" | "PLAYER_ONLY" | "BOTH";

  /** MỚI — cuộc này có cần dải lựa chọn không, hay chỉ là một bark hai nhịp. */
  depth: "BARK" | "SHORT" | "FULL";

  opener: string;
  openMood?: TalkMood;
  initiates?: number;        // GIỮ, nhưng không còn là bộ lọc của offerTalk
  ignore?: { ... };          // GIỮ — nhưng chỉ áp được từ dòng IM, không từ Esc
  when?: TalkWhen;
  weight?: number;
  tree: TalkNode[];
  shared?: Record<string, TalkNode[]>;
};
```

**`depth` quyết định cuộc đó tiêu vào trần nào:**

| `depth` | Nhịp | Tiêu vào trần 2/ngày? | Dùng ở kênh |
|---|---|---|---|
| `BARK` | 1 (chỉ `opener`, không đáp) | **không** | cả hai |
| `SHORT` | 1 nhịp, ≤ 3 lựa chọn ≤ 24 ký tự | **không** | cả hai |
| `FULL` | cây đầy đủ | **có** | **chỉ kênh LỜI** |

Phân loại khởi điểm cho 86 cuộc hiện có: ước **~30 `FULL`** (những cuộc có `act` hoặc `flag`
hoặc thuộc arc), **~40 `SHORT`**, **~16 `BARK`**. Việc phân loại là một task nội dung
nửa ngày, **không viết thêm một chữ nào**.

**Khoá `usedSeason` — sửa H-05.** Hiện `talksDone` ghi trên `walkin<style>` ⇒ 64 cuộc
`QUA_DUONG` dùng chung 8 khoá ⇒ **kho người lạ cạn trong 1–2 ngày**. Sửa: khách lạ và người
đi ngang khoá theo **lượt ghé** (`customer.id`), chỉ 12 NPC có tên mới khoá theo mùa.

**Tầng thoại tái dùng (`ANY`) — nối dây hoặc gỡ.** Hiện `ANY` là **mã chết**: 0 cuộc, không
có loader. Mà nó chính là lớp nội dung mà lỗi #6 đang thiếu — tầng chào hỏi / nhận xét theo
bối cảnh **không bao giờ cạn**, rơi về khi kho riêng hết. Nối dây nó.

---

## 4. UI/UX hai thiết bị

### 4.1. Bảng đáy bị thay — số đo, không phải ý kiến

Comment trong `TalkPanel.ts` nói bảng "nằm dưới cùng, cao vừa đủ, người chơi phải còn thấy
MẶT khách". Số đo nói ngược lại:

| | |
|---|---|
| Đỉnh đầu khách đầu quầy | y ≈ **246 px** |
| Mép trên bảng (`MAX_H_RATIO 0.56`) | y = **244 px** |
| Bảng phủ ngang | x 202–822; khách đứng ở x = **431** |
| Chiều cao điển hình / trần | 314 / 322 px — **"tối đa" chính là "thường ngày"** |

⇒ **Bảng che trọn khách từ đầu tới chân.** Đây là nguyên nhân cơ học của lỗi #1, và là lý do
vì sao "đóng băng để đọc" không cứu được gì: cái đáng xem nhất đã bị che.

Thêm: `TalkPanel` ở `depth 9_400_000` > `Hud` `9_000_000`, mà feed nhật ký ở `(26, 476)` nằm
**dưới gầm panel** ⇒ **người chơi không bao giờ thấy câu của chính mình**. `dockFeed()` chỉ
được gọi cho `AssemblyPanel`, đúng một chỗ trong repo.

Và ở cỡ chữ 200% (trợ năng): cần ~406 px, được cấp 322 ⇒ **hàng 4 ở y ≈ 598 > `GAME_H` 576,
bị cắt mất**, hint đè lên hàng 4. **Trợ năng tự huỷ.**

### 4.2. Thay bằng — bong bóng + dải neo cạnh vai

| Thành phần | Chỗ | Ghi chú |
|---|---|---|
| **Lời NPC** | bong bóng neo trên đầu chính họ | `BubblePool` đã có. Sống **5–6 s** (hiện 2 s — gần như không kịp đọc) |
| **Chỉ báo "đáp được"** | bong bóng **ba nhịp tự xẹp**: đầy → `…` → rụng từng chấm | *negotiated interruption*. "Xẹp dần" chống banner blindness tốt hơn icon bền |
| **Lựa chọn của người chơi** | **dải dọc 2–3 dòng neo ở vai khách** | Chỗ đó còn **533×248 px** toàn vỉa hè trống |
| **Nhãn lựa chọn** | **≤ 24 ký tự** | Câu đầy đủ chuyển thành bong bóng **sau khi chọn** |
| **Mặt/`mood`** | **chỉ vẽ trên người khách** | Bỏ huy hiệu mặt thứ hai trong panel + chữ `MOOD_LABEL` — hiện cùng một thông tin đang hiện **ba lần**, cách nhau 200 px |
| **Toast `talkOffer`** | **bỏ hẳn** | Nó vi phạm luật hai kênh do chính `Hud.ts:84` đặt ra: người nói ≠ việc máy báo |

> **Nhãn ≤ 24 ký tự là ĐÒN BẨY, không phải nhược điểm.** Rút ngắn nhãn lựa chọn chính là
> bước đầu về phía T2: nút trở thành *một ý định* chứ không phải *một câu nói*, và câu đầy
> đủ vẫn được nói ra — bằng miệng nhân vật, trong bong bóng. **12.600 dòng không mất một chữ.**

**Hạng 2 nếu quyết định giữ câu dài:** cột dọc bên **phải** màn hình (tiền lệ Disco Elysium —
cố ý từ chối "một phần ba dưới"). Vẫn tốt hơn bảng đáy vì không che khách.

### 4.3. Trợ năng

| | |
|---|---|
| `Esc` | **luôn miễn phí**, một nghĩa duy nhất. Có **nút đóng bấm chuột được**, chữ *"Thôi"* |
| "Làm thinh" | một **dòng `IM` trong dải**, tự nguyện, đọc được hệ quả trước (T5) |
| `P`, `Tab`, `F1`–`F8` | **không lớp nào được nuốt** (`CANON` §15.2) |
| Cỡ chữ 200% | dải dọc giãn theo chiều **dọc** (còn 248 px) thay vì bị kẹp chiều cao |
| Chế độ không giới hạn thời gian | `scaleMul = 0.5` **tự động** giảm nửa chi phí giờ của §2.2 |
| Mọi thao tác | chuột · phím · chạm (`CANON` §15.5) |

---

## 5. Tham số cần tune

| Tên | Khởi điểm | Khoảng | Cách đo |
|---|---|---|---|
| `TALK_DEEP_PER_DAY` | **2** | 1–3 | `seasonTalkCoverage` ≥ 70/86 cuối ngày 40 **và** ≤ 4 cuộc trong bất kỳ ngày nào |
| `TALK_CHOICES_MAX` | **3** | 2–4 | ký tự đọc/phiên ≤ 340 |
| `LABEL_CHARS_MAX` | **24** | 18–30 | không nhãn nào xuống dòng ở cỡ chữ 200% |
| `BUBBLE_LIFE_SEC` | **5,5** | 4–8 | ≥ 90% người chơi đọc kịp ở cỡ chữ 150% |
| `OFFER_DEFER_TTL_SEC` | **90** | 60–150 | tỉ lệ lời hoãn bị huỷ im lặng ≤ 15% |
| `GREET_CHANCE` (NPC-NPC) | **0,25** | 0,15–0,35 | ≤ 1 cảnh / 90 giây thật |
| `TALK_STICKY` | **0,62** | = `stations.STICKY` | mục tiêu không nhấp nháy khi đứng giữa hai người |

---

## 6. Tiêu chí đạt

Telemetry hiện **không đo gì** về `TalkPanel`. Thêm bốn event: `talk:requested` ·
`talk:opened {npcId, source, band}` · `talk:closed {ms, beats, charsShown, engaged}` ·
`talk:refused {reason}`.

| | Metric | Hiện tại | **Đạt** | Trần cứng |
|---|---|---|---|---|
| **M1** | `talkFrozenRatio` — Σ giây hội thoại ÷ giây thật của ngày | 17,7–50,2% | **≤ 12%** | 15% |
| **M2** | **`talkDuringWait`** — số lần dải lựa chọn mở khi có người chờ | ~9/ngày | **0** | **0 — vượt là bug chặn phát hành** |
| **M3** | `talkRefusedPerDay` | ~7/ngày từ ngày 2 | **≤ 1/ngày** | ≤ 10 cả mùa |
| **M4** | `npcInitiatedShare` | ~33% | **≥ 70%** | ≥ 55% |
| **M5** | `seasonTalkCoverage` | 75/86 **nhưng cạn trong 10 ngày** | **≥ 70/86 và ≤ 4 cuộc/ngày** | ≥ 55/86 |

**Phanh (không được xấu đi):** `msPerCustomer.p50` và `customersLost.IMPATIENT`. Nếu van trò
chuyện làm người chơi làm bánh chậm hơn hoặc mất thêm khách, van đó đặt sai chỗ.

**Checklist hành vi:**

- [ ] Giữ `F`, giữ `Space`, giữ `Enter` trong 3 giây — **không** cuộc nào bị chạy hết, **không**
      `rel` nào đổi.
- [ ] Bấm `P` khi dải lựa chọn đang mở — **vào được** menu tạm dừng.
- [ ] Mở rồi đóng dải 10 lần — đồng hồ ngày **đã trôi**, `rel` **không đổi**, cuộc **chưa bị tiêu**.
- [ ] Một ngày chơi: **0** lần dải mở khi có người đang chờ bánh.
- [ ] Ngày 1: nghe được ít nhất **3** câu NPC tự nói mà không bấm phím nào.
- [ ] Người đi ngang từ chối lời mời → lựa chọn `INVITE` **biến mất**, họ **đi tiếp ngay**.
- [ ] Cỡ chữ 200%: không nhãn nào bị cắt, không hàng nào tràn khỏi màn hình.
- [ ] Ngày 3 (trước `GOSSIP_START_DAY`): nghe được ít nhất **2** cảnh NPC chào nhau.
- [ ] Cảnh tán gẫu rỗng **không có** hai chấm `..`, **không ghi** gì vào sổ tay.

---

## 7. Rủi ro & cách bịt

| Rủi ro | Bịt |
|---|---|
| **A1 · HẺM CÂM** — siết van xong `linesSpoken`/ngày **giảm** | Mục tiêu là **đổi KÊNH**, không giảm **LƯỢNG**. Siết dải lựa chọn **bắt buộc** đi kèm §2.11 (NPC-NPC) và bong bóng sống 5–6 s. *Báo động: giảm > 10% so với baseline.* |
| **A2 · 13 TUẦN VIẾT LÁCH CHẾT TRONG JSON** — `seasonTalkCoverage` < 50/86 | Chữa bằng **nới trần lên 3/ngày** và nới cổng `rain`/`needFlag` của 11 cuộc đang thừa. **Tuyệt đối không phải viết thêm.** |
| **A3 · NGƯỜI CHƠI NGỪNG BẤM PHÍM** — `talk:requested` < 1/ngày trong 5 ngày liền | Đúng cái bẫy `talk.ts` tự sợ: *"người chơi học được đúng một bài: đừng bao giờ bấm F."* *Cảnh báo sớm: `talk:refused` ÷ `talk:requested` > 0,3.* |
| Chi phí giờ của §2.2 quá nặng, người chơi thấy bị phạt vì nói chuyện | Tune `TALK_DEEP_PER_DAY` xuống 1 trước khi tune `clock.busy`. Chi phí phải **đọc được** (đồng hồ treo tường) và **vừa phải** (4,2%/cuộc) |
| Nới `GossipCorner` làm loãng cơ chế nghe lỏm | Ràng buộc cứng §2.11: cảnh rỗng **không có `..`**, **không ghi sổ tay**. `CANON` §12 RB4 |
| NPC-NPC trượt thành Radiant AI | Danh sách "KHÔNG làm" ở cuối §2.11 là **cố định**, không thương lượng. `CANON` §16 Đừng-1 |

**Lỗi ẩn phải sửa kèm** (đã verify trong code, không nằm trong 7 lỗi chủ dự án nêu):

| Mã | Lỗi | Chỗ |
|---|---|---|
| **H-01** | `KeyF` vừa mở vừa đóng-có-phạt; không kiểm `ev.repeat` ⇒ giữ phím chạy hết cây, mất nội dung cả mùa | `TalkPanel.ts:225` |
| **H-03** | Nút pause bằng **chuột** nằm ngoài vùng panel ⇒ `resume()` thả `clock.paused` trong khi panel còn mở | `Hud.ts:253` |
| **H-05** | `talksDone` khoá theo `walkin<style>` ⇒ kho người lạ cạn trong 1–2 ngày | `service.ts:2530` |
| **H-07** | `offer` chỉ **một slot toàn cục**, và `smalltalked.add` chạy **trước** `offerTalk` ⇒ khách bị trượt lời bắt chuyện vẫn bị tiêu lượt | `service.ts:1483` |
| **H-12** | `TalkStore.release()` đếm bằng `Set` thay vì đếm tham chiếu ⇒ kho bị thả khi vẫn còn người dùng | `content/talks/index.ts` |
| **H-14** | `visibleOptions` fallback `nodes.slice(0,1)` **bỏ qua** chính `needCash` nó vừa dựng ⇒ hứa được thứ không trả nổi | `talk.ts:426` |
| **H-15** | `chooseTalk` trả `null` ⇒ panel destroy mà **không** gọi `closeTalk()` ⇒ rò `talkSession` ⇒ **khoá `offerTalk` cả ngày còn lại** | `StallScene.ts:2136` |
| **H-19** | `REFUSE` và ngưỡng bỏ-về-vì-bị-chửi chạy được trên **người đi ngang** — "bị mời đi" vô nghĩa với người chỉ đi ngang qua | `service.ts:2577` |
| **H-20** | `ANY` là mã chết (0 cuộc, không loader) — mà đó đúng là lớp nội dung lỗi #6 đang thiếu | `content/talks/index.ts` |
| **H-22** | `nearestTalkable` không có đường ngắm — xuyên tường, xuyên quầy | `service.ts:2410` |

---

## 8. Truy vết

| Khẳng định | Nguồn |
|---|---|
| T1–T5, Đừng-1, §15 trợ năng, §12 RB4, §11 ngân sách thoại | `CANON.md` §1, §16, §15, §12, §11 |
| Orkin "vocalizing intentions" | `CANON.md` §16 Đừng-1 |
| Ngày game 300 phút, `timeScaleBase` 30, bands | `src/content/days/day_index.json` |
| 7,5 phút thật/ngày | `README.md` §"Vài con số đã chốt" |
| 17,2 khách/ngày | `src/content/season/days.json` |
| `clock.busy` → `TIME_SCALE_BASE` | `src/core/clock.ts:89-92` |
| `openTalk` không lọc ⇒ lỗi #2 | `src/sim/service.ts:2302` vs `:2851` |
| `initiates` không phải bộ lọc | `src/sim/talk.ts:398-404` |
| `walkin.nhamquan`, 0/6 cuộc có `initiates` | `src/content/talks/walkin.json:464` |
| Dòng nhắc trò chuyện là ưu tiên cuối | `src/scenes/StallScene.ts:1284` |
| `nearbyToTalk` loại `front` | `src/sim/service.ts:2399-2402` |
| `?`/`!` đã bị hệ ánh nhìn chiếm | `src/entities/CustomerActor.ts:304` |
| `GossipCorner` 2 ô cố định, phụ thuộc tin đồn đêm trước | `src/ui/stall/GossipCorner.ts:24`, `src/sim/gossip.ts:259` |
| `inviteChance`, `ahead >= slots ⇒ 0` | `src/sim/passersby.ts:199-211` |

---

## 9. Đề xuất sửa CANON

**(1) Sửa §1 T2, cột "Hệ quả bắt buộc".** Từ:

> **Không có dialogue tree.** Người chơi không bao giờ chọn câu nói. Họ chọn nguyên liệu

thành:

> **Khi có người đang chờ bánh, món ăn là câu trả lời DUY NHẤT.** Người chơi không bao giờ
> chọn câu nói với một người đang chờ mình — họ chọn nguyên liệu. Lựa chọn bằng lời tồn tại
> ĐÚNG MỘT CHỖ: khi **không ai đang chờ** (quầy trống, người đã nhận bánh còn nán lại, người
> đi ngang ngoài đường). Trần **2 cuộc/ngày**, **0 cuộc trong khung PEAK**, và **không bao
> giờ đóng băng đồng hồ**. Vi phạm = `talkDuringWait > 0` ở telemetry, và đó là bug chặn
> phát hành.

**(2) Thêm §16 — Đừng-5:**

> **Đừng để hai modal full-stop cùng sống trong một vòng lặp.** `AssemblyPanel` **không**
> đóng băng đồng hồ còn `TalkPanel` thì **có** — hai cái bảng che gần hết màn hình với hai
> luật thời gian ngược nhau, trong cùng một phút chơi. Đó chính là định nghĩa vận hành của
> chữ "switch content". Một vòng lặp được phép có **một** modal; cái thứ hai phải là bong
> bóng / diegetic.

**(3) Thêm §15 mục 7 (trợ năng):**

> **Không một lớp UI nào được nuốt phím tạm dừng.** Người chơi phải vào được menu tạm dừng
> từ **mọi** trạng thái, kể cả giữa lúc khách đang nói. Hiện `TalkPanel.bindKeys` gọi
> `stopPropagation()` trên mọi `keydown` nên `P` không tới được `StallScene` — đó là một vi
> phạm §15.2 đang tồn tại, không phải một góp ý.

**(4) Sửa `README.md`:** gỡ dòng *"T2 — … Không có dialogue tree"* (đang sai so với code), và
sửa bảng phím `F` (đang ghi hành vi `ASK_QUESTION` cũ, đã bị hệ trò chuyện thay).

### 2.15. NGƯỜI CHƠI CHỦ ĐỘNG THÌ NGƯỜI CHƠI NÓI TRƯỚC

Lỗi chủ dự án chỉ ra sau bản đầu: bấm phím bắt chuyện với một người **đang đứng mua
bánh**, và họ đáp *"Ủa. Tưởng ai. Chi hông?"* — *"ai lại đang mua hàng mà hỏi tưởng ai"*.

Gốc: `openTalk` LUÔN phát `talk.opener` (lời của NPC) trước, kể cả khi chính người chơi
vừa bấm phím. `opener` được viết cho tình huống NPC **tự mở lời**; đem dùng cho đường
ngược lại là **đổi vai hai người nói**.

⇒ Luật: **người chơi chủ động ⇒ người chơi nói trước.** Bấm phím → hiện thẳng danh sách
câu → mình nói → họ đáp. `opener` chỉ còn một đường dùng: NPC tự bắt chuyện, và lúc đó
nó đã nổ thành bong bóng trên đầu họ rồi.

Hệ quả cho người viết: với cuộc `PLAYER_ONLY`, **nhịp đầu của `tree` CHÍNH LÀ câu mở lời
của người chơi** — viết nó như một câu mở lời thật, không phải một câu đáp.

### 2.16. MỘT LƯỢT QUA LẠI, BA NHỊP — không phải một cú nhảy

Bản đầu: bấm một cái là thẻ lập tức vẽ lại với câu đáp đã nằm sẵn trong đó. Không ai
thấy mình vừa nói gì, không có khoảng nghỉ, hai lời chồng lên nhau trong một khoảnh
khắc. Nó đọc ra như một cái **menu**, không ra một cuộc nói chuyện.

| Nhịp | Cái gì | Ở đâu |
|---|---|---|
| 1 | câu **mình** nói | bong bóng trên đầu **cô Ba** — trước giờ chỉ khách mới có bong bóng |
| 2 | **ba chấm** `…`, `REPLY_DELAY_SEC` = 0,7 s | trên đầu người kia — "đang trả lời" |
| 3 | câu họ đáp, rồi thẻ mới hiện bộ lựa chọn kế | bong bóng trên đầu họ |

Thẻ bị **giấu** suốt nhịp 1–2: bày sẵn câu trả lời trong lúc người ta còn chưa đáp là
nói trước phần của họ. Và thẻ giờ **chỉ còn danh sách câu để chọn** — mọi lời đều đi vào
bong bóng.

Im lặng cố ý (`silent`) vẫn có ba chấm, nhưng sau đó **không có câu nào** — và chính cái
trống đó là câu trả lời (P2-02 §2.3).

Ba chấm không phải trang trí: nó là thứ nói cho người chơi biết **cú bấm đã ăn** và có
người đang đáp, thay vì để họ ngờ phím hỏng.

---

## 10. BA CHỖ BẢN THI CÔNG LỆCH KHỎI BẢN THIẾT KẾ

Ghi lại vì cả ba đều là chuyện chỉ lộ ra khi chạy thật, và cả ba đều sẽ bị "sửa ngược"
nếu người sau chỉ đọc §2.

### 10.1. `QUA_DUONG` là `BOTH`, không phải `NPC_ONLY`

§2.3 nói mọi câu mô tả ý định của NPC phải là `NPC_ONLY`. Áp đúng chữ đó vào kho người
qua đường thì **khoá chết cơ chế mời khách**: người đi ngang không đứng chờ ai nên họ gần
như không bao giờ tự mở lời, mà cửa DUY NHẤT để họ thành khách là người chơi bước ra mời
(act `INVITE`, nằm trong chính mấy cây đó). Đánh `NPC_ONLY` là bỏ đi việc duy nhất còn
làm được khi quán vắng.

⇒ Cả 8 cuộc `QUA_DUONG` là `BOTH`. Đây là ngoại lệ đáng kể DUY NHẤT của luật "NPC phải
nói trước", và lý do đã ghi thẳng vào `_note` của `qua-duong.json`.

### 10.2. "Không ai đang chờ" KHÔNG tính chính người mình đang nói chuyện

§2.1 phát biểu cổng là `someoneWaiting()`. Thi công đúng chữ đó thì **một người đứng chờ
bánh không bao giờ mở miệng được** — vì chính họ làm vị ngữ đó đúng. Đo thật:
`offersToday = 0` suốt cả ngày, tức anti-goal A1 (hẻm câm) xảy ra ngay ở bản đầu.

Mà họ mới là người đáng nói chuyện nhất: đứng đó, đã gọi món, đang đợi. Cái THẬT SỰ phải
chặn là bỏ một HÀNG NGƯỜI để đi tâm sự với một người.

⇒ `someoneWaiting(except)` và `canOpenDeep(except)` trừ đối tượng đang nói ra.

### 10.3. Phải rút trong tập CHẠY ĐƯỢC, không rút rồi mới kiểm

Bản đầu làm `pickTalk(cả kho)` rồi `if (!canRun) return`. Vì 30/86 cuộc là `FULL` — và
với một người cụ thể tỉ lệ đó còn cao hơn (đo được **5/6** ở bà Bảy) — nên năm lần trong
sáu, một người đủ mọi điều kiện mở lời vẫn im, chỉ vì bốc trúng lá bài không đánh được.
`offersToday` tụt về 1 dù trần là 3.

⇒ `pickRunnable()` lọc `canRun` TRƯỚC khi rút. Lọc trước còn làm trọng số `weight` được
chia lại đúng trong tập còn chơi được.

---

## 11. ĐÃ LÀM GÌ (đối chiếu với §2–§4)

| Hạng mục | Chỗ |
|---|---|
| `source` / `depth` bắt buộc; `okSource`; `isSharedTalk` | `src/sim/talk.ts` |
| Trần 3 lựa chọn mỗi nhịp (`TALK_CHOICES_MAX`) | `src/sim/talk.ts` |
| Đường lui tôn trọng `needCash`; ẩn `INVITE` sau khi bị từ chối | `visibleOptions` |
| Hai kênh: `someoneWaiting` / `canOpenDeep` / `canRun` | `src/sim/service.ts` |
| Trần 2 cuộc sâu/ngày, 0 trong PEAK | `TALK_DEEP_PER_DAY` |
| Cửa sổ ngắt quãng an toàn | `Service.interruptible` ← `StallScene.canBeInterrupted()` |
| Hàng đợi lời bắt chuyện + hết hạn im lặng | `offers`, `expireOffers`, `OFFER_DEFER_TTL_SEC` |
| Mười một câu "không nói được" | `Service.talkUnavailable()` |
| Thuật toán nhắm mục tiêu có trọng số + bám dính | `talkCost`, `talkTarget`, `TALK_W_*` |
| Chặn spam mời (`inviteRefused`) | `Customer`, `invite()`, `talkGate()` |
| Đồng hồ chạy thay vì đóng băng | `StallScene.talkHoldsClock` → `clock.busy` |
| Thẻ neo cạnh người nói, bỏ bảng đáy | `src/ui/stall/TalkPanel.ts` |
| Vòng sáng dưới chân mục tiêu · ba chấm người đang chờ | `drawTalkTarget`, `drawPendingTalk` |
| Bỏ toast `talkOffer`; bong bóng sống 5,5 s | `offerBubbleLife` |
| Xếp hàng cú bấm lúc tay bận | `StallScene.talkQueued` |
| Esc miễn phí · F chỉ mở · `P`/`Tab`/`F1-8` đi thẳng · chặn `ev.repeat` | `TalkPanel.bindKeys` |
| Kho dùng chung không bao giờ cạn | `src/content/talks/any.json`, `SHARED_POOL` |
| Khoá `usedSeason` theo lượt ghé cho người lạ | `talkedThisVisit` |
| `TalkStore` đếm tham chiếu | `src/content/talks/index.ts` |
| NPC chào nhau ngoài đường | `greetPassers`, pool `chaoNhau`/`chaoDap` |
| Lưới chắn | `tests/p5-talk.test.ts` V-1…V-6 · `tests/p6-passersby.test.ts` |

**Chưa làm (cố ý, không chặn ai chơi):** bốn event telemetry ở §6 — cần một phiên đo bằng
người thật mới có baseline để so, mà đó là hạng mục đang chặn sẵn ở `00-TONG-QUAN` §7.1.
