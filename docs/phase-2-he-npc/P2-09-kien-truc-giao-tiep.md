# P2-09 — Kiến trúc giao tiếp: một bảng đen, một dòng ký ức, bảy khung cảnh

**Thuộc phase:** P2 — Hệ NPC
**Phụ thuộc:** `P2-01` (rule DB) · `P2-02` (tính cách, 5 kênh) · `P2-03` (trí nhớ 3 tầng) ·
`P2-06` (flow v2) · `P2-07` (hợp đồng ba phần) · `P2-08` (năm danh sách việc) ·
`CANON` §11, §16 (Đừng-1), T1 · T2 · T3 · T5
**Nghiên cứu nền:** [`../audit/giao-tiep/research-ai-npc.md`](../audit/giao-tiep/research-ai-npc.md)
**Trạng thái:** **Đã thi công** (đợt 0–10) · §6 ghi rõ chỗ đạt và chỗ chưa · số ở §5 vẫn cần tune

---

## 1. Mục tiêu

P2-07 chốt rằng mỗi câu phải trả lời ba câu hỏi (`need` · `while` · `does`). P2-08 đếm ra
**374 nút sửa được bằng dữ liệu** và **202 nút cần code**, rồi dừng lại ở một câu:
*"không có `need` đọc được sự thật thế giới thì 374 nút kia không sửa được."*

Doc này dựng **cái đường nối đó**, và dựng nó một lần cho cả hệ thay vì vá một chỗ: hiện
có **ba từ vựng** cùng mô tả một thế giới, **bốn chỗ giữ trí nhớ**, và **không đường nào
nối chúng với nhau**. Mục tiêu không phải viết thêm nội dung — mục tiêu là làm cho nội
dung **đã viết** có chỗ bấu vào.

Phục vụ trụ cột nào:

* **T1** — lời nói nói về QUÁ TRÌNH: một câu chỉ tồn tại khi thế giới vừa làm ra cái cớ cho nó.
* **T2** — đi gần hơn tới *"hành động là lựa chọn hội thoại"*: dưới mô hình dưới đây, cái
  người chơi chọn không còn là một câu chữ mà là **một việc làm có lời đi kèm**.
* **T5** — rủi ro đọc được: nút chỉ hiện khi làm được thật; cái không làm được thì **không
  bày ra**, chứ không bày ra rồi chặn.
* **T3** — không một con số nào ở đây lên màn hình. Điểm số của §2.7 là **điểm chọn nội
  dung**, không phải điểm quan hệ, và nó không bao giờ được hiện ra kể cả trong sổ tay.

---

## 2. Cơ chế

### 2.1. Chẩn đoán — ba từ vựng, bốn trí nhớ, không đường nối

| # | Từ vựng | Ở đâu | Nhìn thấy gì | Mù chỗ nào | Gõ sai thì |
|---|---|---|---|---|---|
| **A** | fact catalog của rule DB | `content/rules/_blackboard.json` · `dialog/facts.ts` | **52 fact** · 18 concept · 4 scope (Global/Player/Customer/Session) | không thấy cây thoại, không thấy `act`, không thấy ký ức dài hạn | **ném lỗi lúc nạp** (`factDef`) |
| **B** | khoá thế giới của thoại | `sim/worldfacts.ts` | 27 khoá phẳng + 7 khoá hàm, bảy namespace `p. t. w. c.` | **chỉ `while` đọc nó**; `need` không đi qua đây | **im lặng trả `false`** (`default:`) |
| **C** | cổng cấp CUỘC | `sim/talk.ts` → `TalkWhen` | ngày · thứ · tier · khung giờ · mưa · `minVisits` · 2 cờ · thiết bị | mọi thứ xảy ra TRONG một lượt ghé | im lặng |

Ba cái này không nói chuyện với nhau. Hậu quả đo được, không phải phỏng đoán:

* `TalkNode.need` tra đúng một chỗ: `gate.flags[o.need]` (`talk.ts`, `visibleOptions`).
  Viết `need: "t.cutLine"` vào JSON là **ẩn mất nút đó vĩnh viễn, không báo gì**.
* Cùng một lỗi gõ sai: ở **A** làm game không nạp được, ở **B** làm câu đó biến mất im lặng.
  **Hai chế độ hỏng ngược nhau cho cùng một sai lầm** — đó là định nghĩa của một hệ không
  dạy được người dùng nó.
* `Customer.cutLine` (`customer.ts:213`), `Customer.inShade` (`:233`),
  `Service.shadeFree` (`service.ts:946`): **khai ra, không ai gán, ở bất cứ đâu**.

Và trí nhớ nằm rải bốn chỗ, không chỗ nào nội dung đọc được:

| Chỗ | Giữ gì | Sống bao lâu | Nội dung đọc được không |
|---|---|---|---|
| `sim/memory.ts` | 3 tầng SHORT/LONG/CORE + 3 bucket quan hệ | cả mùa | **không** |
| `dialog/context.ts` | fact `ctx*` có hạn giờ | giây → hết ngày | chỉ rule DB |
| `TalkSession.picked` | giọng đã dùng trong cuộc | tới khi đóng thẻ | chỉ qua `while` |
| `story.flags` | cờ chuyện | cả mùa | chỉ qua `need` (một cờ, bật/tắt) |

**Vậy nên: trước khi thêm bất cứ cơ chế nào, phải gộp.** Phần còn lại của doc này đứng
trên một giả định duy nhất — **có đúng một bảng đen**.

---

### 2.2. Quyết định lõi 1 — MỘT BẢNG ĐEN, MỘT QUERY, MỘT NGÔN NGỮ CỔNG

Gộp **A + B + C** vào `_blackboard.json`. Cả rule DB lẫn cây thoại biên dịch cổng của mình
xuống **cùng một `Criterion[]`** và hỏi **cùng một `Query`**.

Giữ tên có dấu chấm của B làm **mặt tiền cho người viết** (nó đọc được, và 49 nút đã viết
theo nó), nhưng không để nó là một hàm `switch` riêng nữa. Thêm vào catalog một mục
`aliases`: một alias là **một mảnh `when` đặt tên**, biên dịch ra criterion y như mọi
criterion khác.

```jsonc
// content/rules/_blackboard.json
"facts": {
  "playerHolding": { "scope": "Player", "type": "enum",
                     "values": ["EMPTY","BANH","BANH_CHAY","BANH_NHAN","TRA","TIEN"] },
  "npcCutLine":    { "scope": "Customer", "type": "bool",
                     "_note": "P2-08 §4 — sự kiện THẬT do assignSlots ghi, không phải một chữ trong thoại" },
  "npcWaitRatio":  { "scope": "Customer", "type": "number", "min": 0, "max": 100 }
},
"aliases": {
  "p.holdsBread":  { "playerHolding": ["BANH","BANH_CHAY","BANH_NHAN"] },
  "p.holdsFilled": { "playerHolding": "BANH_NHAN" },
  "t.cutLine":     { "npcCutLine": true },
  "t.impatient":   { "npcWaitRatio": ">=60" }
}
```

Bốn thứ rơi ra miễn phí khi gộp:

1. **Một chế độ hỏng duy nhất.** Khoá lạ ném lỗi lúc nạp, ở cả hai hệ. Không còn câu nào
   biến mất im lặng.
2. **Validator có sẵn dùng lại được.** `tools/validate-rules.ts` đang đọc đúng file này;
   nó quét được nội dung thoại mà không phải viết lại.
3. **`rule.why` của P0-03 bao luôn cây thoại.** Panel dev đang trả lời được *"vì sao nó nói
   câu đó"* cho rule; sau khi gộp nó trả lời được cho cả nút thoại — và đó chính là công
   cụ để rà 1.534 nút lần sau mà không phải đọc tay 4.811 dòng.
4. **`need` và `while` thành MỘT ngôn ngữ, khác nhau ở CHỖ ĐẶT chứ không ở cú pháp** —
   đúng như P2-07 §4.1 đã chốt, giờ có chỗ thi công:

```ts
type TalkNode = {
  /** TĨNH: người chơi không đổi được khi thẻ đang mở ⇒ KHÔNG THOẢ THÌ ẨN HẲN. */
  need?: string[];
  /** ĐỘNG: đổi được giữa lúc đang đọc ⇒ KHÔNG THOẢ THÌ RA "?". */
  while?: string[];
};
```

> **Đường lui tương thích:** `need` hiện là một `string` và nghĩa là *một cờ chuyện*. Luật
> di trú: **chuỗi không có dấu chấm = cờ chuyện** (y như cũ), **có dấu chấm = khoá bảng
> đen**. 36 nút `need` đang có chạy nguyên không sửa một chữ.

---

### 2.3. Quyết định lõi 2 — THẾ GIỚI CHÀO HÀNG, NỘI DUNG KHÔNG ĐOÁN

Đây là chỗ đổi chiều mũi tên (nghiên cứu §1, The Sims / Zubek).

Hôm nay: nội dung nói *"tôi có câu này, mong là thế giới khớp"*. Và 97% số nút không khớp
được vì không có gì để khớp.
Từ đây: **thế giới chìa ra cái để nói**, nội dung chỉ được gắn vào cái đã được chìa.

```ts
/** Một chuyện ĐANG CÓ THẬT để nói. Chỉ hệ mô phỏng được sinh ra nó. */
export type Topic = {
  id: TopicId;
  /** Ai chìa ra. Nội dung KHÔNG được tự dựng Topic. */
  from: "OVEN" | "QUEUE" | "HAND" | "WEATHER" | "MEMORY" | "PROMISE" | "PURPOSE" | "ARC" | "EVENT";
  /** Dữ liệu THẬT. Câu nói điền từ đây, không viết cứng. */
  payload: Record<string, string | number>;
  /** 0..100 — dùng CHUNG thang với salience của P1-02, không đặt thang mới. */
  salience: number;
  /** Chào hàng cũng hết hạn. Hết là biến mất, không ai phải đi dọn. */
  decaySec: number;
};
```

Nội dung gắn vào topic bằng một trường `on`, và điền chỗ trống từ `payload`:

```jsonc
{ "on": "HO_CHEN_HANG",
  "say": "Có {p.who} tới trước {call} kìa.",
  "tone": "THANG",
  "act": { "kind": "STEP_ASIDE", "forSec": "TOI_LUOT" } }
```

Không ai chen hàng ⇒ không có topic `HO_CHEN_HANG` ⇒ **câu đó không tồn tại**. Không phải
bị ẩn, không phải ra `?` — nó **không được dựng ra**. Đó là cách duy nhất chữa được dứt
điểm lỗi *"bảo có người tới trước chị, chị chen hàng — trong khi bà ấy không hề chen"*,
vì nó làm cho câu đó **không viết sai được nữa**.

**Bảng nguồn chào hàng — đợt một.** Mỗi dòng là một chỗ hệ mô phỏng ĐÃ biết chuyện đó,
chỉ chưa nói ra:

| Nguồn | Topic sinh ra | Đã có sẵn ở đâu | Còn thiếu |
|---|---|---|---|
| `OVEN` | `BANH_MOI_RA_LO` · `LO_DANG_NHEN` · `BANH_KHET` | `sim/oven.ts` | một đường phát topic |
| `QUEUE` | `HO_CHEN_HANG` · `HANG_DAI` · `HO_DUNG_CHAN` | `assignSlots` biết thứ tự | **`npcCutLine` chưa ai gán** |
| `HAND` | `DANG_CAM_O` · `TAY_DINH_TIEN` · `DANG_CAM_TRA` | `playerHand`, `handsDirty` | — |
| `WEATHER` | `NANG_GAT` · `MUA` · `CHO_MAT_CON_TRONG` | `weatherOf` | **ô hóng mát chưa tồn tại** (P2-08 §3) |
| `PURPOSE` | `HO_DANG_VOI` · `HO_DI_CHO_VE` · … | `purposes.json` — **60 × 34, chưa ai đọc** | đường cho nội dung đọc |
| `MEMORY` | `NHAC_CHUYEN_CU` · `NHO_MON_QUEN` | `sim/memory.ts` | **truy hồi** — §2.4 |
| `PROMISE` | `LOI_HUA_DANG_TREO` · `DA_NUOT_LOI` | `PROMISE` (chỉ cho món kẹp) | `PROMISE_DEED` + hạn |
| `EVENT` | 11 sự kiện CANON §3 | `stimid.ts`, rule DB đã dùng | nối sang cây thoại |
| `ARC` | mốc arc từng người | `content/arcs.ts` | — |

Ba luật của Zubek, giữ nguyên tinh thần:

* **Lọc TRƯỚC khi chấm, bằng mặt nạ rẻ tiền.** Đúng là `need`. Không được dùng biểu thức
  lồng nhau — từ vựng nghèo là cố ý (`worldfacts.ts` đã viết đúng lý do này, giữ nguyên).
* **Phần thưởng trao TAY trong hành động, không trao lúc nói.** Hôm nay `any.hoitham` 3.1.1
  trả `rel +3` và `calm 12` **ngay lúc hứa**, rồi miếng bánh không bao giờ tới. Ngược hẳn.
  → §2.6.
* **Được phép chào hàng LÁO.** Một NPC được chìa ra topic về chuyện không có thật (chú Tư
  nói xe thủng lốp). Đó không phải lỗi — đó là CANON §16 Đừng-1 viết bằng ngôn ngữ cơ chế:
  *nói ra là đủ, khỏi mô phỏng*. Chỉ có một điều kiện: **thứ gì người chơi LÀM được thì
  không được láo** (mời đứng mát thì phải có chỗ đứng).

---

### 2.4. Quyết định lõi 3 — TRÍ NHỚ LÀ MỘT DÒNG CÓ TRUY HỒI

`sim/memory.ts` đã có hai trong ba thành phần của Stanford (nghiên cứu §2) và thiếu đúng
hai ô: **relevance** và **một hàm truy hồi**.

```ts
/** Giờ nên nhớ chuyện gì — gọi lúc dựng topic, không gọi trong vòng vẽ. */
export function retrieve(s: RelState, about: TagSet, w: Weights, k = 3): Memory[] {
  return all(s)
    .map((m) => ({ m, score:
        w.recency    * Math.pow(0.995, missedVisitsSince(s, m))   // P2-03 §2.5: đếm LẦN GHÉ, không đếm ngày
      + w.importance * currentIntensity(m) / 100                  // đã có sẵn
      + w.relevance  * jaccard(tagsOf(m), about) }))              // MỚI
    .sort((a, b) => b.score - a.score)
    .slice(0, k).map((x) => x.m);
}
```

Ba ghi chú về chỗ **cố ý lệch** khỏi bài báo:

1. **Recency đếm lần ghé bị lỡ, không đếm giờ.** P2-03 §2.5 đã chốt chuyện này và nó đúng
   hơn cho một game 40 ngày: người ghé mỗi ngày mà hôm nay mình quên họ thì nặng hơn người
   nửa tháng mới ghé một lần. Giữ nguyên, chỉ mượn **hình dạng** `0,995^n`.
2. **Relevance bằng khớp THẺ, không bằng embedding.** Không có LLM, không có vector. Mỗi
   ký ức mang sẵn thẻ (`kind` + `detail` + topic đã sinh ra nó), mỗi topic khai mình hỏi
   về thẻ nào, relevance = Jaccard. Rẻ, chạy được trong vòng nóng, và — quan trọng hơn —
   **người thiết kế đọc ra được vì sao nó chọn cái đó**. Cosine không cho cái đó.
3. **Trọng số theo TỪNG NGƯỜI, không phải `α = 1` cho tất cả.** Chị Lan (`deTha 0,2`) nặng
   `importance`; bé Su (`deTha 0,9`) nặng `recency`; thầy Phúc (`soi 0,8`) nặng `relevance`.
   Đây đúng là *"tuning theo từng agent cho từng nhu cầu"* của Zubek, và nó tái dùng bốn
   chiều tính cách đã có của P2-02 — **không thêm một núm nào cho người tune**.

#### LUẬT CỨNG — nội dung không được GỌI TÊN một chuyện cũ, chỉ được NHẬN một chuyện cũ

```jsonc
// SAI — người viết đoán là chuyện đó đã xảy ra. 26 lần đoán trật (P2-08 §1.7)
{ "say": "Bữa trước {call} nói chuyện thằng con sao rồi?" }

// ĐÚNG — câu này chỉ tồn tại khi retrieve() trả về một ký ức thật, và nó điền từ ký ức đó
{ "on": "NHAC_CHUYEN_CU", "say": "Bữa trước {m.what} sao rồi {call}?" }
```

Truy hồi trả rỗng ⇒ **topic không được chìa ra** ⇒ câu không tồn tại. Luật này không sửa
26 nút nhớ nhầm — nó làm cho **nút nhớ nhầm thứ 27 không viết ra được**. Đó là khác biệt
giữa một lần dọn dẹp và một kiến trúc.

#### Bốn tầng ký ức = một dòng, bốn hạn dùng

P2-07 §4ter gọi tên bốn tầng `c.* v.* d.* m.*` và P2-08 ghi `v.*`/`d.*` là *"chưa tồn tại"*.
Không cần dựng ba hệ mới: `dialog/context.ts` **đã có đúng hình dạng cần** (ghi một fact
lên một người, kèm hạn, hết hạn kiểm lười lúc dựng query, nằm trong save). Chỉ cần nới
`duration` từ ba giá trị lên một `enum` scope:

| Tầng | Hạn | Lưu ở | Ví dụ khoá |
|---|---|---|---|
| `c.*` cuộc | tới khi đóng thẻ | `TalkSession` | `c.saidTone(GAT)` · `c.angered` · `c.openedBy(PLAYER)` |
| `v.*` lượt ghé | tới khi họ đi | `Customer` | `v.gaveTea` · `v.gaveFood` · `v.promised(X)` |
| `d.*` ngày | tới khi đóng cửa | `ContextStore` *(đã có)* | `d.metToday` · `d.toldMe(X)` |
| `m.*` mùa | vĩnh viễn | `RelState` *(đã có)* | `m.visits(N)` · `m.remembers(E)` |

`c.openedBy(PLAYER|NPC)` là khoá được đòi nhiều nhất trong cả bản rà — **21 nút chỉ riêng
`qua-duong`** (`../audit/thoai/qua-duong.md`). Thông tin đã có sẵn ở runtime (`TalkOpenBy`
truyền vào `openTalk`/`offerTalk`), chỉ chưa có đường cho nội dung đọc. Đây là khoá **rẻ
nhất và lời nhất** của cả doc.

#### Reflection — bản không-LLM, mỗi đêm một dòng

Stanford cho agent tự rút kết luận khi `importance` tích đủ ngưỡng. Bản rẻ cho Cô Ba, và
nó rơi đúng vào chỗ P2-05 đã dựng sẵn: **cuối ngày, mỗi NPC có tổng `importance` mới vượt
ngưỡng sẽ ghi ĐÚNG MỘT ký ức dẫn xuất** — không phải một câu LLM viết, mà một mẫu chọn từ
bảng:

```
3 lần cùng `kind` trong 5 lần ghé      → m.habit(<kind>)        "cô này hay quên bỏ đồ chua"
2 lần CARED_FOR_THEM, 0 lần âm         → m.trusts                "con nhỏ này được"
1 lần âm salience ≥ 75 + 0 chuộc lỗi   → m.wary                  "để ý chút"
```

Ba khoá đó trở thành **topic truy hồi được**, tức là nhân vật nhắc lại được một **kết luận**
chứ không chỉ một **sự kiện** — và đó là thứ làm một mùa 40 ngày đọc ra là có tích luỹ.
Chi phí: một vòng lặp lúc đóng cửa, ~9 mẫu câu.

---

### 2.5. Quyết định lõi 4 — BẢY KHUNG CẢNH (practice), KHÔNG CÒN MỘT CÁI KHO

Nghiên cứu §3 (Versu / Evans): một câu chỉ **có nghĩa** bên trong một thực hành xã hội.
Ngoài nó, câu ấy không phải là lựa chọn dở — nó **không phải một lựa chọn**.

Đây là lời giải gốc cho kho `ANY`. `ANY` hiện được rút cho **14 vai × 5 pha ≈ 70 ngữ cảnh**,
và bản rà đếm **13/33 nút nhắc một trạng thái thế giới mà không đọc nó**. Đó không phải lỗi
của 13 câu; đó là số học: không ai viết nổi 33 câu đúng trong 70 ngữ cảnh.

```ts
export type Practice =
  | "DI_NGANG"   // họ đi ngang, chưa hỏi mua gì
  | "XEP_HANG"   // đã vào hàng, chưa tới lượt
  | "GOI_MON"    // đang gọi
  | "DOI_BANH"   // đã gọi, đang đợi ổ
  | "NAN_LAI"    // đã nhận bánh, còn đứng
  | "QUAY_VANG"  // không có ai ở quầy — hàng xóm, người quen tạt qua
  | "NGHE_LOM";  // cảnh NPC↔NPC, người chơi là khán giả
```

| Practice | Suy ra từ | Vai hai bên | CẤM nói gì | Kho rút |
|---|---|---|---|---|
| `DI_NGANG` | `t.passing` | người bán ↔ người qua đường | mọi câu nhắc quá khứ · mọi câu về đơn hàng | `qua-duong` + `P.DI_NGANG` |
| `XEP_HANG` | `phase = queueing` | ↔ người đang chờ tới lượt | mời ăn thử · mời đứng mát · chuyện đời dài | `P.XEP_HANG` |
| `GOI_MON` | `phase = ordering` | ↔ khách đang gọi | mọi thứ không phải về đơn | `walkin` + `P.GOI_MON` |
| `DOI_BANH` | `phase = waiting` | ↔ khách đang đợi | mọi thứ trừ xin lỗi · rót trà · bark ngắn | `P.DOI_BANH` |
| `NAN_LAI` | `t.served` còn nán | ↔ người quen | — **đây là chỗ `CHUYEN` sống** | `<npc>` + `P.NAN_LAI` |
| `QUAY_VANG` | `queue = 0` | ↔ hàng xóm | — | `<npc>` + `P.QUAY_VANG` |
| `NGHE_LOM` | `overhear.ts` | khán giả | người chơi **không được xen vào** (P2-06 §2.11) | `gossip` |

Hai hệ quả:

1. **Kho `ANY` tan ra thành bảy kho nhỏ theo practice.** Không mất một dòng nào — 33 nút
   hiện có được chia về đúng khung cảnh nó đúng. Luật §4.3 mà `../audit/thoai/any.md` phải
   viết riêng cho kho này (*"một câu ở đây còn phải đọc được ở mọi `t.*`"*) **biến mất**,
   vì practice đã bảo đảm `t.*`.
2. **"Đang đợi bánh thì chỉ nói chuyện bằng ổ bánh" thôi là một `if` viết tay.** Hôm nay
   nó là một nhánh trong `talkUnavailable()`. Dưới practice nó là **hình dạng của
   `DOI_BANH`** — và nó đúng cho mọi nội dung viết sau, kể cả nội dung chưa ai nghĩ ra.

---

### 2.6. Quyết định lõi 5 — HỨA LÀ MỘT MÓN NỢ CÓ HẠN, THƯỞNG TRẢ LÚC LÀM XONG

Lỗi Zubek cảnh báo nguyên văn (*"thưởng phải được trao tay trong hành động, không tự động"*)
đang có thật trong kho, và nó là loại tệ nhất vì nó **trả tiền trước cho một chuyện không
bao giờ xảy ra**: `any.hoitham` 3.1.1 *"Ăn miếng gì đi rồi hẵng đi"* trả `rel +3` và
`calm 12` **ngay lúc nói**. `calm` là giảm thật đồng hồ chờ. Tức là cách chơi tối ưu hiện
tại là **hứa rồi quên** — đúng cái `TalkEffect.calm` đã tự cảnh báo trong `talk.ts`.

```ts
export type Deed = {
  what: DeedId;                         // ROT_TRA · DUA_BANH · BUNG_GANH · LAY_SO
  /** Giây THẬT từ lúc nói. Trà ~25 s · bưng đồ ~15 s · chạy đi lấy ~40 s (P2-07 §4bis). */
  dueSec: number;
  /** Trả KHI LÀM XONG. Không bao giờ trả lúc nói. */
  onKept: TalkEffect;
  /** Ba nấc, theo tính cách: nhắc → nói nặng → bỏ đi. */
  onBroken: [TalkEffect, TalkEffect, TalkEffect];
};
```

Ba luật đi kèm:

* **Lúc nói chỉ được trả thứ không rút lại được mà cũng không mua được gì**: một nét mặt.
  `rel`, `calm`, `anger` đều đợi `onKept`/`onBroken`.
* **Lời hứa đang treo phải NHÌN THẤY ĐƯỢC** — một chỉ báo trên đầu họ. Phạt người chơi vì
  quên một chuyện game không nhắc là phạt **trí nhớ**, không phải phạt **lựa chọn** (T5).
* **Nấc một bỏ qua với người nóng tính** (`nongTinh ≥ 0,8`: ông Hải). **Người lạ bỏ cả ba
  nấc, đi luôn** — họ không có trí nhớ để mà nhắc, và mất một khách đã là hình phạt đủ.

Việc đầu tiên, rẻ nhất, làm được trước mọi thứ khác trong doc này: **gỡ `calm` khỏi hai
nút đang trả trước** (`any.hoitham` 3.1.1 và 3.1.2). Một dòng JSON.

---

### 2.7. Quyết định lõi 6 — CHỌN BẰNG ĐIỂM, KHÔNG BẰNG MỘT HẰNG SỐ VIẾT TAY

`pickTalk` hiện rút theo `weight ?? 10` — **gần như mọi cuộc đều để trống**, nên thực tế là
rút đều tay trong tập hợp lệ. Thay bằng dạng (c) của Zubek: **tổng độ chênh có suy giảm**.

Mỗi NPC mang sáu **drive** 0..100, suy giảm theo thời gian, bị sự kiện đẩy lên:

| Drive | Lên khi | Topic nào hạ nó |
|---|---|---|
| `DUOC_PHUC_VU` | đang đợi, hàng dài, đã gọi món | mọi topic về ổ bánh của họ |
| `KE_CHUYEN` | có chuyện mới, lâu chưa kể | topic `ARC`, `MEMORY` của chính họ |
| `DUOC_HOI` | ghé nhiều mà không ai hỏi han | topic hỏi thăm |
| `PHAN_NAN` | vừa có sự kiện âm, trời xấu, giá tăng | topic than / chửi đổng |
| `YEN_THAN` | đang vội, tâm trạng xấu, vừa bị gắt | **im lặng**, `WALK_ON` |
| `VIEC_RIENG` | mục đích hôm nay đòi đi tiếp | `WALK_ON` |

```ts
score(topic) = Σ_drive ( A(mức hiện tại) − A(mức sau khi nói) ) × tune[npc][drive]   // Zubek (c)
             × khopPractice(topic, practice)        // 0 nếu topic không thuộc khung cảnh này
             × (0,5 + salience/200)                 // chuyện nóng hơn thì được nói trước
// rút ngẫu nhiên có trọng số trong TOP-3 — không winner-takes-all (Zubek: trông máy móc)
```

Vì sao đáng đổi — ba lỗi hiện phải vá tay, dưới hệ này **tự biến mất**:

* **"Spam mời khách"** (lỗi #5 của chủ dự án): người đang vội có `YEN_THAN` + `VIEC_RIENG`
  cao, nên mọi topic mời ăn điểm gần 0. Không cần một luật chống spam nào — `inviteRefused`
  thành cái lưới thứ hai, không phải cái lưới duy nhất.
* **"Đang bán mà bị bắt chuyện rất phiền"** (lỗi #3): `DOI_BANH` ⇒ `DUOC_PHUC_VU` cao ⇒ áp
  đảo mọi topic tán gẫu. Luật thành **hành vi nổi lên**, không phải một `if`.
* **"Hết chuyện để nói"** (lỗi #6): hết topic điểm dương ≠ hết nội dung. `talkUnavailable()`
  đọc được **drive nào đang cao** để chọn đúng một trong 11 câu lý do — nhất quán, và người
  chơi học được.

> **Ranh giới T3, không thương lượng:** điểm này chọn **nội dung**, không phải **quan hệ**.
> Nó không bao giờ lên màn hình, không vào sổ tay, không ra nhật ký người chơi đọc được.
> Chỗ duy nhất nó hiện ra là overlay dev F3 (`rule.why`).

---

### 2.8. XỬ LÝ RIÊNG TỪNG NPC — hồ sơ giao tiếp

Không phải nội dung mới. Là một **tờ bìa** đặt lên nội dung đã có, để 12 người khác nhau
đi qua cùng một bộ máy mà ra 12 cách nói chuyện. (P2-02 §2.11: *tính cách nổi lên từ mật
độ rule, không code riêng* — đây là cùng một nguyên tắc, áp lên tầng chọn chuyện.)

```ts
export type TalkProfile = {
  npc: NpcId;
  address: Address;                               // đã có ở talk.ts
  drives: Record<Drive, { base: number; decayPerMin: number; tune: number }>;
  /** Chuyện CỦA HỌ — chỗ nhân vật thành người, không phải một bộ hệ số. */
  advertises: TopicId[];
  /** Nghe chuyện gì thì để ý. Nhân vào relevance lúc truy hồi. */
  cares: Partial<Record<TopicId, number>>;
  /** Nhắc là RUDE_TO_THEM, dù câu chữ lịch sự. */
  taboo: TopicId[];
  memoryWeights: { recency: number; importance: number; relevance: number };
  /** Ba nấc nuốt lời (giây). Người nóng tính bỏ nấc một ⇒ phần tử [0] = 0. */
  breakPromise: [number, number, number];
};
```

Đợt một, suy từ `content/npcs.ts` + `../audit/thoai/*.md` + P4-01 — **mọi ô dưới đây đều
là số khởi điểm cần tune**, không phải hằng số chốt:

| NPC | tính cách nổi | Drive trội | Chìa ra chuyện gì | Kỵ | Ký ức nặng về |
|---|---|---|---|---|---|
| **Bà Bảy** `soi .9` | soi, dễ tha | `KE_CHUYEN` · `DUOC_HOI` | `VE_SO` · `CHUYEN_HEM` · `QUAY_DO` | hỏi tiền bạc riêng | relevance |
| **Chú Tư** `deTha .9` | xuề xoà, điềm | `PHAN_NAN` | `CA_TRUC` · `XE_HONG` · `GHI_NO` | — | recency |
| **Anh Dũng** `nongTinh .5` | tài xế, vội | `DUOC_PHUC_VU` · `VIEC_RIENG` | `DON_GAP` · `AO_MUA` · `XE_CHAN_QUAY` | hỏi thu nhập | recency |
| **Chị Lan** `soi .9 deTha .2` | kỹ, để bụng | `DUOC_PHUC_VU` | `GIAY_TO` · `TRA_NONG` · `DUNG_GIO` | đùa về công việc | **importance** |
| **Bé Su** `thanThien 1.0` | mở lòng, quên nhanh | `KE_CHUYEN` | `QUAY_PHIM` · `DI_HOC_TRE` · `THIEU_TIEN` | hỏi chuyện người lớn | **recency** |
| **Ông Hải** `nongTinh .9` | dễ nổi | `PHAN_NAN` · `YEN_THAN` | `BANG_HIEU` · `RUOU` · `CHUYEN_CU` | nhắc chuyện nhậu | importance |
| **Cô Mai** `thanThien .8` | mở, hay để ý | `DUOC_HOI` · `KE_CHUYEN` | `TAP_HOA` · `SO_NO` · `TIN_HEM` | — | relevance |
| **Thầy Phúc** `soi .8` | kỹ, điềm | `DUOC_HOI` | `HOC_TRO` · `SO_GHI` · `CHU_NGHIA` | nói trống không | **relevance** |
| **Chị Hạnh** `thanThien .4` | khép, người Bắc | `YEN_THAN` → `KE_CHUYEN` | `QUE_NHA` · `GIONG_BAC` · `LAM_QUEN` | trêu giọng | importance |
| **Anh Bảo** `deTha .8` | sinh viên, ít tiền | `DUOC_PHUC_VU` | `GIA_TIEN` · `DOI_DON` · `THI_CU` | thương hại | recency |
| **Bà Sáu** `thanThien .9` | mở hết, hàng xóm | `KE_CHUYEN` · `DUOC_HOI` | `GANH_TAU_HU` · `RAO` · `DOI_HANG` | — | relevance |
| **Chú Kiệt** `deTha .3` | để bụng, đối thủ | `PHAN_NAN` · `YEN_THAN` | `XE_BEN_KIA` · `CHO_DUNG` · `GIA_CA` | khen xe mình | **importance** |

Đọc bảng này theo chiều dọc là thấy ngay vì sao nó đáng: **chị Lan và bé Su đi qua cùng một
bộ máy, cùng một kho câu, và không bao giờ cư xử giống nhau** — một người nhớ lâu và nặng
`importance`, một người quên nhanh và nặng `recency`. Không có một dòng `if (npc === …)` nào.

---

### 2.9. `ANY` — không còn là một kho, là tầng practice

Bỏ `npc: "ANY"` như một **khoá kho**; giữ nguyên tính chất *không bao giờ cạn* (P2-06 FR-06
— `isSharedTalk` chỉ chặn theo chủ đề trong ngày, không chặn cả mùa). Thay bằng:

```jsonc
{ "id": "chao.ranh", "practice": "QUAY_VANG", "source": "PLAYER_ONLY", "depth": "SHORT",
  "tree": [ { "on": "W.NANG_GAT", "say": "Nắng quá {call} ha.", "tone": "THUONG" } ] }
```

Chữa được đúng bốn cụm lỗi mà `../audit/thoai/any.md` đếm ra, **không viết lại một câu nào**:

| Lỗi đếm được | Chữa bằng |
|---|---|
| 13/33 nút nhắc trạng thái thế giới mà không đọc nó | `on:` — không có topic thì câu không tồn tại |
| 4/33 nút là câu ĐÁP bị dùng làm câu MỞ LỜI | `c.openedBy(NPC)` (§2.4) |
| mời ăn hai lần trong một lượt ghé | `v.gaveFood` (§2.4 tầng `v.*`) |
| `any.banh` 4.1.1 — mời người đang xếp hàng ăn thử | practice `XEP_HANG` **cấm** topic mời ăn |

> `any.banh` 4.1.1 là nút duy nhất bản rà đề nghị **XOÁ**. Dưới kiến trúc này nó **không
> cần xoá**: chuyển sang practice `DI_NGANG`, gắn `GIVE_BREAD` thật kèm hạn 15 giây và
> đường nuốt lời của §2.6. Câu *"Bẻ miếng ăn thử cho biết"* vốn là một câu hay — cái sai
> của nó là **nó được bày ra sai chỗ** và **lời từ chối được viết cứng sẵn để khỏi phải làm**.

---

### 2.10. `QUA_DUONG` — archetype, hai thái độ, `WALK_ON` là trạng thái nghỉ

Nghiên cứu §4: kho dùng chung theo archetype là **thực tiễn ngành, không phải chỗ cắt bớt**.
Giữ nguyên tám dáng người dùng chung một kho, giữ nguyên `touchesRelationship = false`.
Ba chỗ sửa:

1. **`WALK_ON` là mặc định, không phải một act phải khai.** Người đi ngang là người **ĐANG
   ĐI**: trạng thái nghỉ của họ là đi tiếp, không phải đứng. Mọi nút lá của cả 8 cuộc kết
   bằng `WALK_ON` **trừ khi khai khác đi**. Một dòng code, 56 nút được chữa.
2. **Mở lời đúng vai.** 21/49 nút viết như câu ĐÁP (26/49 nút mở miệng bằng chữ *"Dạ"*).
   `c.openedBy(NPC)` gắn vào chúng; mỗi cuộc thêm 1–2 nút mở lời thật cho đường `PLAYER` —
   và đó chính là chỗ `INVITE` sống đúng chỗ của nó.
3. **Ba câu nhắc quá khứ phải viết lại**, không phải gắn khoá. Kho này **không có hôm qua**,
   và không nên có. Ghi thẳng vào `_note` của file.

Hình dạng tương tác, theo mẫu RDR2 (M1 của `../audit/flow-tro-chuyen/04` §6), nay có đủ nền
để thi công: **hai thái độ, không menu.**

```
người chơi hướng mặt về một người đi ngang  →  hai dòng neo cạnh vai:
   [ mời một câu ]        ← topic do thế giới chìa ra (còn bánh? họ đã ngoái nhìn? hàng ngắn?)
   [ chào một tiếng ]     ← luôn có
                          ↓
            roll inviteChance × purposeInviteMul   ← ĐÃ CÓ CẢ HAI
                          ↓
              ghé vô  /  "thôi" + WALK_ON
```

`inviteChance` (`passersby.ts`) và `purposeInviteMul` (`purpose.ts`) **đã viết xong cả hai**
và chưa bao giờ gặp nhau ở một chỗ. Đây là phần **rẻ nhất, lời nhất** của toàn doc:
60 mục đích × 34 tâm trạng đang nằm đó, **0 câu thoại nào đọc tới**.

---

### 2.11. `WALKIN` — practice `GOI_MON`, trí nhớ chỉ sống trong một lượt ghé

Khách vãng lai là người **đang mua**, chỉ khác là mình chưa biết tên. Nên:

* practice `GOI_MON` → `DOI_BANH` → `NAN_LAI`, không bao giờ `QUAY_VANG`.
* mọi ký ức ghi vào tầng `v.*`, **không bao giờ lên `m.*`** — `memKey` của họ dùng chung
  cho tám dáng người cả mùa; ghi vào đó là ghi lên sổ của người khác.
* `walkin.nhamquan` (*"Cho tui tô hủ tiếu"*) là `NPC_ONLY` tuyệt đối — nó là một topic do
  **thế giới** chìa ra lúc họ tới, không bao giờ do người chơi bấm phím moi ra. Đây là lỗi
  #2 nguyên bản của chủ dự án; P2-06 §2.3 đã chốt, §2.5 ở đây làm nó **không tái phát được**
  vì practice `GOI_MON` không có chỗ cho người chơi mở lời bằng một câu gọi món.

---

### 2.12. NPC ↔ NPC — practice `NGHE_LOM`, chi phí gần bằng không

Lỗi #4 của chủ dự án (*"muốn lâu lâu NPC ngoài đường gặp nhau nói chuyện"*), công thức rẻ
nhất đã khảo ở `../audit/flow-tro-chuyen/04` §4.2:

```
mỗi N giây, hai người qua đường cách nhau ≤ 2 ô, cả hai đang đi:
  1. một người dừng, quay mặt           ← 0 dòng nội dung
  2. gật đầu / vẫy                      ← 0 dòng nội dung
  3. người kia dừng, quay lại           ← 0 dòng nội dung
  4. một bong bóng chào                 ← ~8 dòng
  5. 0–1 bong bóng đáp                  ← ~8 dòng
  6. cả hai WALK_ON
```

Bước 1–3 **không tốn một chữ nào** và mang phần lớn cảm giác sống — người chơi đọc *hành vi*,
không đọc *chữ*. Đúng nguyên tắc Orkin của CANON §16.

Hai chỗ nối sẵn có: nội dung bong bóng rút từ `sim/gossip.ts` (tin vừa lan đêm trước ⇒ *"khu
phố biết chuyện của mình"* mà không thêm một hệ nào), và `OVERHEARD_BY` của `overhear.ts`
đã tồn tại, hệ thoại chưa gọi tới. Người chơi **nghe lỏm được, không xen vào được** — xen
được là mở thêm một cổng tương tác nữa, tức lỗi #1 quay lại.

---

## 3. Dữ liệu & schema

### 3.1. `TalkNode` sau khi gộp

```ts
export type TalkNode = TalkEffect & {
  /** Topic phải đang được chìa ra. Vắng = câu không cần cớ (xã giao thuần). */
  on?: TopicId;
  /** TĨNH — không thoả thì ẨN HẲN. Chuỗi không có dấu chấm = cờ chuyện (tương thích cũ). */
  need?: string | string[];
  /** ĐỘNG — không thoả thì ra "?" rồi bỏ qua nhịp. */
  while?: string[];
  say: string;                    // {call} {me} {self} {you} + {p.*} từ payload + {m.*} từ ký ức
  tone: TalkTone;
  reply?: string;
  mood?: TalkMood;
  silent?: boolean;
  act?: TalkAct;                  // nay mọi act có thời lượng đều PHẢI khai forSec
  then?: TalkNode[];
  ref?: string;
  needCash?: number;
  needEquip?: string;
};

export type TalkAct =
  | { kind: "PAY"; vnd: number; note: string }
  | { kind: "DISCOUNT"; vnd: number }
  | { kind: "FREE_LOAF" }
  | { kind: "REFUSE" }
  | { kind: "INVITE"; yes: string; no: string }
  // ── có thời lượng: `forSec` BẮT BUỘC, và hết giờ thì về ĐÚNG mục đích cũ
  | { kind: "STEP_ASIDE";     forSec: number | "TOI_LUOT" }
  | { kind: "STAND_IN_SHADE"; forSec: number }
  | { kind: "LEAVE_SHADE" }
  | { kind: "LOOK_INSIDE";    forSec: number }
  | { kind: "GIVE_BREAD";     forSec: "TOI_KHI_AN_XONG" }
  | { kind: "OFFER_TEA";      forSec: number }
  | { kind: "WALK_ON" }
  // ── lời hứa: thưởng trả LÚC LÀM XONG, không trả lúc nói (§2.6)
  | { kind: "PROMISE_DEED"; deed: Deed };
```

### 3.2. `Talk` sau khi gộp

```ts
export type Talk = {
  id: string;
  /** Người có tên, hoặc "WALKIN"/"QUA_DUONG". `"ANY"` BỎ — thay bằng `practice`. */
  npc: string;
  /** Khung cảnh cuộc này sống được. Vắng = mọi khung (hiếm, phải có lý do). */
  practice?: Practice | Practice[];
  topic: string;
  source: TalkSource;
  depth: TalkDepth;
  kind?: TalkKind;
  opener: string;
  openMood?: TalkMood;
  initiates?: number;
  ignore?: { … };
  when?: TalkWhen;
  /** BỎ `weight` — điểm số của §2.7 thay nó. */
  tree: TalkNode[];
  shared?: Record<string, TalkNode[]>;
};
```

### 3.3. Ví dụ thật — chữa `any.imlang` 6.3 (*"xích qua chút giùm"*)

```jsonc
{ "id": "chao.xichqua", "practice": ["XEP_HANG", "GOI_MON"],
  "source": "PLAYER_ONLY", "depth": "BARK", "topic": "cho-dung",
  "opener": "", "tree": [
    { "on": "Q.HO_DUNG_CHAN",
      "need": ["!c.angered"],
      "while": ["w.queue>=1"],
      "say": "{call} xích qua chút giùm {me} cái.",
      "tone": "THANG",
      "act": { "kind": "STEP_ASIDE", "forSec": "TOI_LUOT" },
      "reply": "Ờ ờ. {self} đứng lấn hả." , "mood": "NGUONG" },

    { "say": "…", "tone": "IM", "silent": true }
  ] }
```

Đọc ngược từng dòng là thấy hợp đồng ba phần đã khép kín:
`on` = **thế giới đã chìa ra chuyện có người đứng chắn** ·
`need` = **tĩnh**, mình chưa gắt với họ trong cuộc này ⇒ không thoả thì ẩn hẳn ·
`while` = **động**, hàng có thể vãn giữa lúc đang đọc ⇒ không thoả thì ra `?` ·
`act` + `forSec` = **họ dạt ra thật, tới khi tới lượt, rồi thôi**.
`STEP_ASIDE` **đã có code** (`service.ts:3338` khối `applyAct`). Đây là 6 nút rẻ nhất bảng.

### 3.4. Bảng đen sau khi gộp — ngân sách

| | hiện có | thêm | sau |
|---|---|---|---|
| fact | 52 | ~26 (`npcCutLine`, `npcBlocking`, `npcOnPhone`, `npcEating`, `visitGaveTea`, `dayMetToday`, `seasonVisits`, `purposeId`, `stateId`, `stock`, `ovenHot`, `band`…) | **~78** |
| alias | 0 | ~34 (toàn bộ `FACT_KEYS` + `FACT_FNS` của `worldfacts.ts`) | **~34** |
| concept | 18 | 0 | 18 |
| topic | 0 | ~40 đợt một | **~40** |
| practice | 0 | 7 | **7** |

`worldfacts.ts` **mất hẳn** sau khi di trú — đó là dấu hiệu việc gộp xong, không phải một
file nữa chồng lên hai file cũ.

---

## 4. UI/UX hai thiết bị

Không đổi hình dạng đã chốt ở P2-06 §4.2 (bong bóng + dải neo cạnh vai, đồng hồ vẫn chạy,
không modal). Doc này chỉ thêm **ba chỉ báo**, và cả ba đều là **hình, không phải số** (T3):

| Chỉ báo | Hình | Vì sao bắt buộc |
|---|---|---|
| **Lời hứa đang treo** | một dấu nhỏ trên đầu người được hứa, mờ dần theo `dueSec` | T5 — phạt vì quên một chuyện game không nhắc là phạt trí nhớ, không phải phạt lựa chọn |
| **Ai đang được nhắm** | viền sáng đúng MỘT người + tên, trước khi bấm | lỗi #7, đã chốt ở P2-06 §2.8 |
| **Có chuyện để nói** | một dấu nhỏ, **phân loại bằng HÌNH** (ổ bánh = chuyện đơn hàng, bong bóng = chuyện đời) | M5 — và tuyệt đối không mã hoá mức thiện cảm vào màu hay số |

Mobile: cả ba đều là ký hiệu ≥ 24 px ở chỗ ngón tay không che. Không thêm phím nào trên PC.

---

## 5. Tham số cần tune

| Tham số | Khởi điểm | Khoảng | Đo bằng |
|---|---|---|---|
| `retrieve.w.recency` | 1,0 | 0,5–2,0 | tỉ lệ câu nhắc chuyện cũ bị người chơi báo "sai" |
| `retrieve.w.importance` | 1,0 | 0,5–2,0 | nt |
| `retrieve.w.relevance` | 1,0 | 0,5–2,0 | nt |
| `retrieve.decay` | 0,995 / lần ghé lỡ | 0,98–0,999 | khoảng cách ngày giữa hai lần nhắc cùng một chuyện |
| `retrieve.k` | 3 | 1–5 | số topic `MEMORY` chìa ra một lúc |
| `reflect.threshold` | 150 (thang `importance` 0–100 × số sự kiện) | 80–300 | số ký ức dẫn xuất mỗi mùa / người, mục tiêu **3–6** |
| `topic.decaySec` mặc định | 45 s | 15–120 | tỉ lệ topic hết hạn trước khi được nói |
| `drive` suy giảm | 2 điểm / phút game | 0,5–6 | tần suất một người tự bắt chuyện |
| `score` → top-N | 3 | 2–5 | độ lặp nội dung giữa hai lần ghé của cùng một người |
| `Deed.dueSec` trà đá | 25 s | 15–40 | tỉ lệ nuốt lời (mục tiêu 15–30 %, không phải 0) |
| `Deed.dueSec` trao tay | 15 s | 8–25 | nt |
| `breakPromise` nấc 1 | 0 s với `nongTinh ≥ 0,8` | — | — |
| tỉ lệ nhịp kết bằng `?` | **< 5 %** | — | đã chốt ở P2-07 §4.1, giữ nguyên làm mốc |

---

## 6. Tiêu chí đạt

Đo được, không cảm tính. Cột **đo** là số chạy ra lúc viết dòng này
(`npm run validate:talks` · `npm run probe:p209` · đếm trực tiếp trên JSON).

| | Tiêu chí | Đo | |
|---|---|---|---|
| 1 | **Một bảng đen.** `sim/worldfacts.ts` không còn là từ vựng thứ hai; mọi khoá biên dịch qua `dialog/gates.ts` | `switch (key)` = 0 | ✅ |
| 2 | **Không khoá im lặng.** Khoá gõ sai NÉM LỖI, và `validate:talks` chặn lúc build | test `W-2` · cổng `T001` | ✅ |
| 3 | **Không câu nào đoán quá khứ.** Nhắc chuyện cũ phải có bằng chứng: `m.remembers` + `{m.what}`, cổng `m.*`/`d.toldMe`, hoặc cờ của cuộc nguồn | cổng `T004`, 0 vi phạm | ✅ |
| 4 | **Ba khoá chết sống lại.** `cutLine` · `blocking` · `shadeFree` đều có chỗ GÁN và chỗ ĐỌC | 20 ngày: chen hàng 4.656 frame · đứng chắn 242 · chỗ mát bị chiếm 20 | ✅ |
| 5 | **60 mục đích có người dùng** | **15** nút đọc `t.purpose()` / `t.state()` (trước: **0**) | ✅ |
| 6 | **Tỉ lệ neo** nút có `need`/`while`/`act`/`needEquip` | **7,7%** (119/1.555), trước **~3%** | ⚠️ **xem dưới** |
| 7 | **`?` dưới 5%** số nhịp kết thúc | chưa đo được — cần telemetry người thật | ⏳ |
| 8 | **Lời hứa có hạn.** 0 act trả `rel`/`calm` lúc nói | test `D-12` | ✅ |
| 9 | **Practice phủ hết.** Mọi cuộc khai `practice`, hoặc khai LÝ DO vì sao không | **123/125**; 2 cuộc còn lại khai lý do trong `_note` (tầng dùng chung không được cạn — FR-06) | ✅ |
| 10 | **Mỗi khung cảnh đều có cuộc sống được** | 6/6 khung chơi được, ≥ 3 cuộc mỗi khung | ✅ |
| 11 | **12 người khác nhau.** Hồ sơ đổi được cách nhớ và cách chọn chuyện | test `R-9` · `D-4` | ✅ |
| 12 | **Reflection ra 3–6 lần/người/mùa** | **4,5 lần/người** (36 lần · 8/12 người, 40 ngày) | ✅ |
| 13 | **T3 còn nguyên.** Không chỗ nào in `score`/`drive`/`rel` ra màn hình | `npm run gates` | ✅ |
| 14 | **Đồng hồ không đóng băng** | `clock.paused` vắng mặt khỏi đường hội thoại | ✅ |

> **Tiêu chí 6 chưa đạt, và nói rõ vì sao.** Bản đầu đặt mục tiêu **≥ 70%**. Thực tế đạt
> **7,7%** — vì cái đã làm là **BỘ MÁY** và **~30 nút hỏng nặng**, chưa phải 374 nút `SỬA`
> của P2-08. Và đó là đúng thứ tự: 374 nút ấy mỗi nút cần một phán đoán của người viết về
> *câu này giả định điều gì*, không phải một lần chạy script. Giờ thì:
>
> · cổng đã đọc được thế giới, nên sửa một nút là sửa được THẬT (trước đây không);
> · `validate:talks` chặn mọi nút sửa SAI ngay lúc build;
> · và **123/125 cuộc đã khai `practice`** — đó là cái neo cấp CUỘC, và nó làm cho mọi
>   nút bên trong đúng ngữ cảnh mà không phải khai một chữ nào. Neo cấp cuộc không vào
>   con số 7,7% ở trên, nhưng nó mới là cái chữa 13/33 nút sai của kho `ANY`.
>
> Việc còn lại là một đợt NỘI DUNG, không phải một đợt kỹ thuật.

## 7. Rủi ro & cách bịt

| Rủi ro | Vì sao thật | Bịt bằng |
|---|---|---|
| **Gộp bảng đen làm vỡ 1.534 nút đang chạy** | hai hệ đang chạy thật, có save ngoài đời | luật di trú §2.2 (chuỗi không chấm = cờ chuyện) giữ 36 nút `need` chạy nguyên; `while` đã dùng đúng tên khoá, map 1–1 |
| **Mô phỏng trượt sang Đừng-1 của CANON §16** | drive + topic + practice nghe rất giống "mô phỏng đời sống NPC" | **Ranh giới cứng: điểm số chỉ chọn CHUYỆN ĐỂ NÓI, không bao giờ chọn CHỖ ĐỂ ĐI.** NPC vẫn đi theo lịch của P2-03 §2.9. Mọi topic đều được phép **chào hàng láo** — nói ra là đủ |
| **Topic trở thành một tầng đoán mới** | nếu topic sinh ra từ ước lượng thay vì từ sự kiện thật thì chỉ đổi chỗ cái sai | Topic **chỉ** được sinh từ hệ mô phỏng (bảng §2.3). Nội dung **không** được dựng Topic. Test: `grep` trong `content/` không có chỗ nào tạo Topic |
| **Chấm điểm thành bất khả tra** | "vì sao nó nói câu đó" là câu hỏi phải trả lời được | `rule.why` của P0-03 mở rộng sang topic + drive: panel F3 in ra **từng số hạng** của tổng, và criterion nào loại nút nào |
| **Reflection sinh câu sai** | một kết luận sai nặng hơn một sự kiện sai | 9 mẫu viết tay, **không sinh chữ**; mỗi mẫu đòi `occurrences ≥ 3` trong 5 lần ghé; và mọi kết luận đều **chuộc lỗi được** qua §2.7 của P2-03 |
| **Ăn gian (CANON §8)**: farm topic để kéo quan hệ | topic `MEMORY` chìa ra được nhiều lần | truy hồi tiêu `d.toldMe(X)` — một chuyện mỗi ngày một lần; và luật `0,75^(n−1)` của P2-03 §2.6 vẫn chặn ở tầng dưới |
| **Ngân sách**: 40 topic + 7 practice + 12 hồ sơ là nhiều việc | đúng là nhiều | thứ tự §8 xếp theo **lời/chi phí**: ba việc đầu tiên **không cần topic nào** và chữa được 374 nút |

---

## 8. Thứ tự thi công — và đã làm tới đâu

| Đợt | Việc | Trạng thái |
|---|---|---|
| **0** | Gỡ `calm`/`rel` trả trước ở nút hứa | ✅ — và từ P2-09 `PROMISE_DEED` không trả được thưởng lúc nói nữa (cổng `T007` + test `D-12`) |
| **1** | **Gộp bảng đen** — `aliases`, `need` qua criterion, một chế độ hỏng | ✅ `dialog/gates.ts` · 93 fact · 53 alias · `worldfacts.ts` thành bộ dựng `Query` |
| **2** | `c.* v.* d.* m.*` + `c.openedBy` | ✅ bốn tầng chạy; `Customer.visit`, `Service.toldToday`, `RelState` |
| **3** | `WALK_ON` mặc định cho `QUA_DUONG` · gắn `STEP_ASIDE` · sửa act sai chiều · giá viết cứng | ✅ 7 `STEP_ASIDE` có `forSec` + lý do · 6 `REFUSE` đổi thành `WALK_ON` · `CREDIT_LOAF` · `{gia}` lấy từ `econ.json` |
| **4** | Nối `purpose` × `inviteChance` + thoại đọc mục đích | ✅ 2 cuộc mới, 15 nút đọc `t.purpose()`/`t.state()` |
| **5** | `retrieve()` + thẻ ký ức | ✅ `sim/recall.ts` · `{m.what}` · cổng `T004` |
| **6** | `PROMISE_DEED` + chỉ báo treo + ba nấc | ✅ `Deed` · `tickDeeds` · cung tròn vơi dần trên đầu họ |
| **7** | Practice + tách `ANY` | ✅ 7 khung · 123/125 cuộc khai · cổng `T009`/`T009b` |
| **8** | Sự kiện thật — chen hàng, đứng chắn, ô hóng mát | ✅ `maybeCutLine` · `tickWorldFacts` · `SHADE_SPOT` trên bản đồ |
| **9** | Drive + chấm điểm · hồ sơ 12 người | ✅ `sim/drives.ts` (Zubek dạng độ chênh) · `profiles.json` |
| **10** | Reflection · NPC↔NPC | ✅ 4,5 kết luận/người/mùa · 25 tin thả ra đường/mùa |
| **—** | **Rà 374 nút `SỬA` của P2-08** | ⏳ **chưa** — đợt NỘI DUNG, xem ghi chú ở §6 |
| **—** | **Topic/advertisement của §2.3** | ⏳ **một phần** — `need`/`while` đã đọc được thế giới và `validate:talks` đã chặn free word; `Topic` như một object rời thì chưa cần tới, và sẽ chỉ cần khi nội dung bắt đầu đòi `payload` |

### Công cụ mới

| Lệnh | Làm gì |
|---|---|
| `npm run validate:talks` | 11 kiểm tra `T001`–`T011` trên cây thoại. **Đã vào `ci` và `build`** |
| `npm run probe:p209` | chạy N ngày headless rồi đếm mấy cơ chế mới có thật sự nổ ra không — một cơ chế không bao giờ nổ trong một mùa thì nó không tồn tại, dù test đơn vị có xanh |

## 9. Truy vết

| Khẳng định | Nguồn |
|---|---|
| 123 cuộc · 1.534 nút · 46 `act` · 13 `while` · 36 `need` · 8 `needEquip` | đếm trực tiếp `src/content/talks/*.json` (bản rà ghi 47 `act` — lệch 1, xem nghiên cứu §4.1) |
| `need` chỉ tra cờ chuyện | `src/sim/talk.ts` → `visibleOptions` |
| `while` CÓ chạy, qua `peek()` + `allHold()` | `src/sim/service.ts` → `chooseTalk` |
| 52 fact · 18 concept | `src/content/rules/_blackboard.json` |
| `cutLine` / `inShade` / `shadeFree` không ai gán | `customer.ts:213`, `:233`, `service.ts:946` — `grep` toàn repo |
| 60 mục đích × 34 tâm trạng, 0 câu thoại đọc tới | `src/content/npcs/purposes.json`; `grep "t.purpose("` trong `content/talks/` = 0 |
| `STEP_ASIDE` đã có code | `src/sim/service.ts` → `applyAct` |
| `inviteChance` và hệ số | `src/sim/passersby.ts` |
| Advertisement · chấm điểm theo độ chênh · thưởng trao tay | Zubek, *Needs-Based AI* — nghiên cứu §1 |
| Truy hồi `recency + importance + relevance`, decay 0,995, reflection ngưỡng 150 | Park et al., arXiv:2304.03442 — nghiên cứu §2 |
| Practice làm cổng ngữ cảnh | Evans / Short, Versu — nghiên cứu §3 |
| Kho theo archetype cho người lạ | GTA V (**suy đoán, không có tài liệu chính thức**) — nghiên cứu §4 |
| Orkin: *"vocalizing intentions can be enough"* | `CANON` §16 Đừng-1 |
| Không đóng băng đồng hồ · hai kênh · NPC nói trước | `P2-06` §2.1–§2.3 |
| Hợp đồng ba phần · tĩnh/động · lời hứa có hạn · bốn tầng ký ức | `P2-07` §2, §4.1, §4bis, §4ter |
| Năm danh sách việc, 374 `SỬA` / 202 `CẦN CODE` | `P2-08` |
| Trí nhớ 3 tầng · decay đếm lần ghé · `0,75^(n−1)` | `P2-03` §2.1, §2.5, §2.6 |

---

## 10. Đề xuất sửa CANON

1. **§16, thêm Đừng-6:** *"Đừng để nội dung tự đoán thế giới. Một câu chỉ được tồn tại khi
   hệ mô phỏng đã chìa ra cái cớ cho nó."* — đây là bài học chung rút từ 1.488/1.534 nút
   không neo, và nó tổng quát hơn hợp đồng ba phần của P2-07 (vốn chỉ nói về cách KHAI,
   chưa nói về chiều mũi tên).

2. **§11, ghi rõ một ranh giới hiện đang ngầm:** chấm điểm chọn **nội dung** không phải
   chấm điểm **quan hệ**; T3 cấm hiện cái thứ hai, không cấm cái thứ nhất tồn tại. Chưa
   viết ra thì sớm muộn sẽ có người đọc T3 thành "cấm mọi con số", rồi lại có người đọc
   ngược lại và cho một con số lên màn hình.

3. **§2 (danh xưng), bổ sung:** kho dùng chung theo archetype **không có hôm qua**. Mọi câu
   nhắc quá khứ với `WALKIN` / `QUA_DUONG` là lỗi thiết kế, không phải lỗi chính tả — và
   đó là một ràng buộc vĩnh viễn, không phải một việc cần làm.

---

## 11. BỐN CHỖ THI CÔNG DẠY LẠI BẢN THIẾT KẾ

Ghi lại vì cả ba đều là chỗ bản thiết kế viết nghe hợp lý mà chạy ra thì sai — và nếu
không ghi thì lần sau có người sẽ "sửa lại cho đúng doc".

### 11.1. Chép đúng công thức Zubek là chép SAI DẤU

`scoreSatisfies` bản đầu chép nguyên `A(hiện tại) − A(tương lai)` của *Needs-Based AI*, và
mọi dấu lộn ngược: một cuộc thoả đúng cái người ta đang cần ra điểm **âm**.

Vì sao: thang của Zubek là **ĐÃ THOẢ BAO NHIÊU** (`hunger = 10` là sắp chết đói), nên
`A(x) = K/x` cho điểm cao ở giá trị THẤP. Thang ở đây là **ĐANG MUỐN BAO NHIÊU**
(`KE_CHUYEN = 80` là rất muốn kể) — ngược hẳn. Phải quy về thang của ông ngay trong hàm
chấm (`cur = 100 − want`), một dòng, có tên. Test `D-1`/`D-2` canh cả hai chiều.

### 11.2. `0,995` của *Generative Agents* là MỖI GIỜ, không phải mỗi ngày

Chép thẳng sang thang ngày của một mùa bốn mươi ngày thì cả dải recency rộng **1%**
(`0,995^1` so với `0,995^8`) — tức một phần ba công thức truy hồi là đồ trang trí, nó
không bao giờ đổi được thứ hạng. Đo thật: bé Su (`deTha 0,95`, lẽ ra nhớ theo cái mới)
vẫn lôi ra chuyện nặng hai tuần trước.

`0,995^24 ≈ 0,887` là đúng một ngày của bài báo. Dùng **`0,88` mỗi LẦN GHÉ** thì đường
cong đọc được: 5 lần ghé còn 0,53 · 10 lần còn 0,28. Test `R-5` neo con số này lại kèm lý
do, để không ai "sửa về đúng bài báo".

### 11.3. `GOI_MON` là một KHOẢNH KHẮC, không phải một khung cảnh

Bản thiết kế liệt bảy khung cảnh ngang hàng nhau. Chạy thử (`npm run probe:p209`) ra pha
`ordering` chiếm **165 / 131.221 frame** trong mười ngày — khoá một cuộc vào riêng pha đó
là chôn nó, và năm cuộc quan trọng nhất của khách vãng lai (quên ví, trả giá, nhầm quán,
đơn văn phòng, hết tiền) đều bị khoá đúng chỗ ấy.

Cửa thật là *"cái đơn còn đang mở"*: lúc gọi, **cộng khúc đầu của quãng đợi**
(`ORDER_WINDOW = 0,35`). Đó cũng đúng đời — người ta bàn chuyện cái đơn trong lúc mình
đang kẹp nhân, chứ không trong một phần tư giây lúc mở miệng. Sau khi sửa, cả sáu khung
chơi được đều có mặt với số frame đáng kể.

### 11.4. Một fact có HAI nghĩa thì nội dung sẽ chọn nhầm nghĩa

Chủ dự án chơi thử và báo: câu *"{call} ngửi thấy mùi than hông? Lò {me} đó."* **cứ ra dấu
`?`**. Truy ra một chuỗi ba chỗ sai nối nhau, và chỗ đầu là chỗ đáng nhớ nhất:

1. `StallScene` gán thẳng `service.ovenHot = oven.busy || servedCount > 0` — một KẾT LUẬN,
   nghĩa là *"cái xe đang chạy"*. Bảng đen thì khai `w.ovenHot` là *"lò đang nhen / mẻ vừa
   ra"*. **Một cái tên, hai nghĩa**, và nội dung viết theo nghĩa trong bảng đen. Người chơi
   bước ra đường mời khách lúc sáng sớm — đúng lúc chưa bán ổ nào và lò vừa trống — nên
   cổng đúng, tên đúng, chỉ có GIÁ TRỊ là của một fact khác.
2. Sửa bằng cách tách làm hai (`ovenHot` thật · `stallRunning` cho phản ứng chú Kiệt), và
   **scene thôi suy ra kết luận** — nó chỉ đưa `ovenBusy`, `Service` tự tính. Thêm
   `OVEN_SMELL_SEC = 90` vì mùi bánh không tắt ngay lúc rút ổ ra, mà đó cũng chính là
   khoảng người chơi hay bước ra ngoài mời khách nhất.
3. Khoá `w.ovenHot` cho TỪNG NÚT thì **hai lưới cãi nhau**: `T002` bảo nó là sự thật ĐỘNG
   nên phải nằm ở `while` (ra `?`), `T011` bảo khoá kiểu đó làm nhánh người-chơi-mở-lời
   teo xuống một dòng. Cả hai đều đúng — và hai lưới cãi nhau là **dấu hiệu chỗ sửa nằm ở
   một TẦNG khác**. Cái cần khoá không phải một lựa chọn mà là cả chủ đề, nên thêm
   `TalkWhen.world`: cả cuộc "mùi bánh" không được rút ra khi không có mùi nào.

Đo sau khi sửa: tỉ lệ nhịp kết bằng `?` là **1,11%** (`npm run probe:talk`), dưới mốc 5%
của P2-07 §4.1; chỗ còn lại là `w.queue(1)` — đúng loại động thật (hàng vãn giữa lúc đọc).

> Bài học chung của cả bốn: **một cơ chế không bao giờ nổ ra trong một mùa thì nó không tồn
> tại**, dù test đơn vị có xanh — và **một cái tên mang hai nghĩa thì nội dung sẽ chọn
> nhầm nghĩa**. `tools/probe-p209.ts` và `tools/probe-talk.ts` có mặt để hỏi đúng hai câu
> đó, và nên chạy mỗi lần thêm một cơ chế mới.

---

## 12. MỘT LỖI CÓ SẴN TÌM THẤY DỌC ĐƯỜNG — CHƯA SỬA, CẦN CHỦ DỰ ÁN CHỐT

**`P2-03 §2.4` gắn hệ số decay NGƯỢC CHIỀU.** Không phải lỗi của P2-09, nhưng `importance`
của truy hồi đọc thẳng `currentIntensity`, nên nó thừa hưởng cái sai này.

Doc viết `tTaper = taper × (0,4 + 1,6·deTha)` kèm chú thích *"deTha 0,2 → ×0,72 (nhớ dai
nhất hẻm)"*. Nhưng `taper` là **ĐỘ DÀI đoạn dốc**: nhân cho một số nhỏ hơn 1 làm đoạn dốc
NGẮN LẠI, tức phai **nhanh hơn**. Một hệ số tên là "tốc độ quên" đem nhân vào một "thời
lượng" — hai thứ ngược nhau.

Đo thật (`WRONG_NAME`, intensity 90, tạo ngày 1):

| | ngày 6 | ngày 10 | ngày 16 | ngày 24 |
|---|---|---|---|---|
| **chị Lan** `deTha 0,2` — để bụng nhất hẻm | 76 | 37 | **23** | 23 |
| **bé Su** `deTha 0,9` — quên nhanh nhất hẻm | 88 | 78 | **56** | 28 |

Suốt hơn hai tuần — gần hết một mùa — người mau quên giận dai hơn người để bụng.

**Sửa:** ở `memory.temperFactor`, nhánh âm đổi thành `2.0 - decayMul(p)` (deTha 0,2 →
×1,28 · 0,9 → ×0,16), hoặc `1 / decayMul(p)`.

**Chưa sửa** vì nó dịch mọi đường cong quan hệ của cả mùa và phải tune lại — đó là quyết
định của chủ dự án, không phải việc đi kèm của P2-09. Đã neo lại bằng một test `todo`
(`tests/p2-recall.test.ts` → `R-4b`) để không ai quên nó.
