# P2-01 — Rule database thoại (Elan Ruskin / Valve, GDC 2012)

**Thuộc phase:** P2 — Hệ NPC đầy đủ
**Phụ thuộc:** `CANON.md` §3 (11 sự kiện) · §4 (4 chiều tính cách) · §5 (perception) · §6 (delivery-diff) · §9 (12 NPC) · §11 (số dòng + kiến trúc thoại) · §12 (trí nhớ, đồn thổi) · §14 (ngôn ngữ) · §16 (ba thứ đừng làm) — và `P2-02-tinh-cach-va-kenh-phan-ung.md` (song hành, không chặn)
**Trạng thái:** **Chốt** về kiến trúc · **Cần đo** ở các tham số cooldown / odds / ngân sách dòng

---

## 1. Mục tiêu

Dựng **một** hệ chọn thoại duy nhất cho toàn game: mọi câu NPC nói — bark khi nhận thấy lỗi, câu lúc nhận bánh, câu kể lể với khách bên cạnh, câu chào, câu chia tay — đều đi qua cùng một hàm `selectRule(concept, query)`. Không có nhánh `if` riêng cho từng nhân vật, không có dialogue tree (**T2**).

Hệ này phục vụ trực tiếp:

- **T1** (khách chấm quá trình): rule được phép đọc `obs.state` của từng sự kiện, nên **cùng một lỗi sinh hai câu hoàn toàn khác nhau** tuỳ khách có chứng kiến hay không.
- **T2** (món ăn là lựa chọn hội thoại): người chơi không chọn câu; họ đổi các fact trong query bằng cách đổi nguyên liệu, và rule DB tự dịch ra lời.
- **T3** (không hiện chỉ số): mọi thứ người chơi biết về quan hệ đều phải đi ra bằng mặt / lời / dáng / hành động / hệ quả trễ. Rule DB là ống dẫn của kênh "lời".
- **T5** (attention nhìn thấy được): bark tier-1 chính là biểu hiện bắt buộc của state `NOTICED`.

Nguyên tắc số một của doc này, lặp lại nguyên văn CANON §11: **copy nguyên Ruskin, không sáng tạo.** Mọi ý "cải tiến" phải đi qua mục 9.

---

## 2. Cơ chế

### 2.1. Đúng bốn khái niệm, không thêm cái thứ năm

Ruskin xây cả hệ thoại của *Left 4 Dead* và *Dota 2* trên đúng bốn danh từ. Nếu doc này sinh ra danh từ thứ năm thì là sai.

| # | Khái niệm | Một câu | Trong game này |
|---|---|---|---|
| 1 | **Fact** | Một cặp `(key: Symbol, value: number)` | `npcSoi = 90`, `eventId = DROPPED_FOOD`, `waitSeconds = 47` |
| 2 | **Query** | Một **dict phẳng** gom TẤT CẢ fact đang đúng ở thời điểm này | Khoảng 70–90 cặp, dựng lại mỗi lần cần một câu thoại |
| 3 | **Criterion** | Một test trên **một** fact: `lo <= query[key] <= hi` | `npcSoi ∈ [70,100]`, `eventId ∈ [DROPPED_FOOD, DROPPED_FOOD]` |
| 4 | **Rule** | Một tuple criteria + các response, **tất cả criteria phải đúng** | Rule "bà Bảy thấy bánh rớt lần đầu trong ngày" |

#### Fact — ví dụ cụ thể

Một fact **không** mô tả thế giới "nói chung". Nó mô tả thế giới **ngay lúc này, từ chỗ đứng của người sắp nói**.

```ts
// Ba fact rất khác nhau, cùng một hình dạng
[FACT.eventId,        SYM.DROPPED_FOOD]   // sự kiện vừa xảy ra
[FACT.npcMemTopKind,  SYM.WRONG_NAME]     // ký ức mạnh nhất trong đầu bà Bảy
[FACT.hour,           643]                // 6h43 sáng, mã hoá thành phút-từ-nửa-đêm / chi tiết §2.3
```

#### Query — ví dụ cụ thể

Lúc người chơi làm rớt ổ bánh trước mặt bà Bảy vào sáng thứ Ba ngày 12, query trông như sau (trích 12 dòng trên tổng ~80):

```
day=12  dayOfWeek=2  hour=643  timeSlot=CAO_DIEM  weather=NANG  stallCleanliness=62
npcId=BA_BAY  npcSoi=90  npcNongTinh=60  npcDeTha=80  npcThanThien=70  npcRelTier=FRIEND
npcVisitCount=9  npcMood=70  npcSlot=FRONT_CENTER  npcGazeState=AT_HANDS
eventId=DROPPED_FOOD  eventSalience=75  obsState=CONFIRMED  witnessCount=2
playerHolding=BANH  queueLength=3  ctxSawDropToday=0
```

#### Criterion — ví dụ cụ thể

```
npcId       ∈ [BA_BAY, BA_BAY]        // "==" viết thành lo==hi
npcSoi      ∈ [70, 100]
eventId     ∈ [DROPPED_FOOD, DROPPED_FOOD]
obsState    ∈ [CONFIRMED, CONFIRMED]
ctxSawDropToday ∈ [0, 0]              // lần đầu trong ngày
```

#### Rule — ví dụ cụ thể

Năm criterion ở trên gộp lại thành một rule score = 5. Một rule generic "ai đó thấy bánh rớt" chỉ có 2 criterion (`eventId`, `obsState`) → score = 2. Rule của bà Bảy **thắng**. Không cần một dòng code nào nói "ưu tiên bà Bảy".

> **Luật loại trừ của Ruskin, giữ nguyên:** rule nhắc tới một fact **không có trong query** → rule đó **bị loại**, không phải "coi như 0". Đây là thứ cho phép ta viết rule chỉ áp dụng lúc có sự kiện mà không cần rào `if (event != null)`.

---

### 2.2. Fact là Symbol / interned string — **không phải string**

Ruskin nói thẳng trong talk: *"Don't actually use strings. Use symbols or interned strings."*

**Lý do hiệu năng, bằng số của game này:**

- Một query ~80 fact. Một concept phổ biến (`NOTICE_EVENT`) có thể có ~150 rule, trung bình 4 criterion → ~600 phép so sánh mỗi lần chọn câu.
- Giờ cao điểm 6h30–8h có tới 5 NPC cùng ở màn hình, mỗi NPC có thể phải chọn câu vài lần/giây → **vài nghìn phép so sánh/giây**.
- So sánh string trong JS là so sánh **nội dung** (O(n) theo độ dài, tệ hơn nếu có dấu tiếng Việt UTF-16: `"npcThanThien"` 12 ký tự, `"ctxNhacCaiLuong"` 15). So sánh integer là **một lệnh CPU**.
- Key dạng string còn làm `Map<string, number>` phải hash lại chuỗi mỗi lần tra. Key dạng int cho phép dùng thẳng **mảng phẳng** `Int32Array` theo chỉ số.

**Cách cài trong TypeScript.** Ta intern hai không gian riêng: **key** và **value**. Cả hai đều ra số nguyên.

```ts
// core/symbols.ts
const _names: string[] = [];
const _index = new Map<string, number>();

/** Intern một tên → số nguyên ổn định trong suốt phiên chạy. */
export function sym(name: string): number {
  let id = _index.get(name);
  if (id === undefined) {
    id = _names.length;
    _names.push(name);
    _index.set(name, id);
  }
  return id;
}
export function symName(id: number): string { return _names[id]; }  // chỉ dùng cho debug/log

// Nhãn kiểu để không lẫn key với value
export type FactKey = number & { readonly __k: unique symbol };
export type FactVal = number & { readonly __v: unique symbol };
```

Sau khi load xong content, ta **đóng băng bảng intern** (`freezeSymbols()`): mọi `sym()` gọi sau đó mà gặp tên lạ sẽ ném lỗi. Nhờ vậy một rule viết sai chính tả key (`npcThanThein`) bị bắt **lúc load**, không phải lúc chơi — xem §2.11.

**Query là mảng phẳng, không phải object.** Vì key đã là số liên tục:

```ts
// dialog/query.ts
export class Query {
  private val  = new Int32Array(MAX_FACT_KEYS);
  private mark = new Uint8Array(MAX_FACT_KEYS);   // fact này có mặt trong query không
  private stamp = 1;

  reset() { this.stamp++; this.mark.fill(0); }    // fill(0) trên Uint8Array ~ memset, rẻ
  set(k: FactKey, v: FactVal | number) { this.val[k] = v as number; this.mark[k] = 1; }
  has(k: FactKey): boolean { return this.mark[k] === 1; }
  get(k: FactKey): number  { return this.val[k]; }
}
```

**Value cũng phải là số.** Enum (`weather`, `npcRelTier`, `eventId`) intern qua cùng `sym()`. Bool → 0/1. Float → nhân 100 rồi làm tròn (`npcSoi` 0.9 → `90`; `stallCleanliness` 0.62 → `62`). Giờ → phút-từ-nửa-đêm (`6h43` → `403`… **không**: dùng `hour*100 + minute` = `643`, dễ đọc hơn cho writer khi viết `hour ∈ [600, 800]`).

> **Quy ước bắt buộc cho writer:** mọi số trong file content là **số nguyên**. Không có `0.9`, chỉ có `90`. Đây là quy ước duy nhất writer phải nhớ về kiểu dữ liệu.

---

### 2.3. Query là dict PHẲNG gom TẤT CẢ fact từ 4 scope

Ruskin giải thích lý do gom hết mọi lúc, nguyên văn: *"you don't need to remember which pieces of world state are available under which system. You've always got the whole world at your fingertips."*

Hệ quả thực tế, và đây là **lý do duy nhất đáng kể để chọn kiến trúc này**:

> **Writer thêm case mới không cần programmer thêm hook.**
> Muốn viết "câu này chỉ xuất hiện khi trời mưa, quầy bẩn, khách đã ghé trên 5 lần, và đang cầm tiền" → writer chỉ việc thêm 4 criterion. Không ai phải mở file `.ts`.

Theo cải tiến của **Firewatch** (CANON §11) ta chia **4 scope** để dễ debug — nhưng **chỉ lúc dựng**. Khi đưa vào `selectRule`, cả bốn **bị ép phẳng thành một dict duy nhất**. Scope là công cụ của con người, không phải của máy.

```ts
// dialog/query.ts
export function buildQuery(q: Query, npc: Npc, ev: Event | null, sess: Session) {
  q.reset();
  writeGlobalFacts(q);            // ~18 fact
  writePlayerFacts(q);            // ~14 fact
  writeCustomerFacts(q, npc);     // ~28 fact  (gồm cả ctx* do applycontext ghi)
  writeSessionFacts(q, ev, sess); // ~22 fact
  return q;                        // ~82 fact, PHẲNG
}
```

**Chi phí:** dựng lại toàn bộ query mỗi lần cần câu thoại là ~82 phép gán `Int32Array`. Rẻ hơn nhiều so với một `if` sai chỗ. **Không cache query** — cache là nơi bug sống.

---

#### 2.3.1. DANH MỤC FACT ĐẦY ĐỦ

> Đây là **phần quan trọng nhất của doc này**. Bảng dưới là hợp đồng giữa programmer và writer. Programmer cam kết mọi fact trong bảng luôn có mặt trong query (trừ các fact đánh dấu ⚠️ *chỉ có điều kiện* — vắng mặt là cơ chế loại rule, không phải bug). Writer cam kết không dùng key ngoài bảng.
> Cột **Kiểu**: `int` = số nguyên thường · `enum` = symbol · `bool` = 0/1 · `pct` = 0..100 (float đã ×100).

**Scope `Global` — 18 fact.** Nguồn: `core/clock.ts`, `core/flags.ts`, `sim/reputation.ts`.

| # | Fact key | Kiểu | Nguồn | Ví dụ giá trị | Dùng để viết gì |
|---|---|---|---|---|---|
| G1 | `day` | int 1..40 | clock | `12` | Câu chỉ xuất hiện cuối mùa |
| G2 | `dayOfWeek` | int 1..7 | clock | `2` (thứ Ba) | Chú Tư chỉ tới T2–T6 |
| G3 | `hour` | int hhmm | clock | `643` | "Ông Hải trước 10h" = `hour ∈ [0, 1000]` |
| G4 | `timeSlot` | enum | clock | `CAO_DIEM` | `SANG_SOM·CAO_DIEM·TRUA·CHIEU·TOI` |
| G5 | `weather` | enum | clock | `MUA_NHO` | `NANG·AM_U·MUA_NHO·MUA_LON` |
| G6 | `rainStreakDays` | int | clock | `3` | "mưa hoài luôn cô ơi" |
| G7 | `alleyReputation` | pct | reputation | `58` | Danh tiếng hẻm, đổi giọng chào |
| G8 | `stallCleanliness` | pct | perception | `62` | Rule vệ sinh của bà Bảy |
| G9 | `queueLength` | int 0..8 | sim | `3` | Câu sốt ruột khi đông |
| G10 | `customersServedToday` | int | sim | `17` | "bữa nay đông ha" |
| G11 | `soldOutCount` | int | econ | `2` | Hết nhân → khách hụt hẫng |
| G12 | `coBaPresent` | bool | schedule | `1` | Cô Ba đứng quầy → đổi cả tông |
| G13 | `kietOpen` | bool | schedule | `1` | Chú Kiệt có mở xe hôm nay không |
| G14 | `viaToday` | enum | §14 mở hàng | `NHE_VIA` | `NHE_VIA·THUONG·NANG_VIA` |
| G15 | `isPayday` | bool | econ | `0` | Ngày 5 và 20: khách rộng tay |
| G16 | `isMonthEnd` | bool | econ | `1` | §9.2-D22: gọi món rẻ, ngại ngùng |
| G17 | `pateBasePrice` | int | market | `28` | Chú Kiệt bình luận giá chợ |
| G18 | `seasonEvent` | enum | flags | `DICH_HEO` | `NONE·DICH_HEO·LE_TET·MUA_THI` |

**Scope `Player` — 14 fact.** Nguồn: `craft/assembly.ts`, `ui/stall`. Đây là scope cho phép NPC bình luận **cái tay bạn đang làm**, tức trụ cột T1.

| # | Fact key | Kiểu | Nguồn | Ví dụ giá trị | Dùng để viết gì |
|---|---|---|---|---|---|
| P1 | `playerHolding` | enum | assembly | `BANH` | `NONE·BANH·DAO·TIEN·KHAN·KEP·CHAI_SOT` |
| P2 | `playerHandsDirty` | bool | assembly | `1` | Vừa cầm tiền chưa lau |
| P3 | `playerHandsDirtySec` | int | assembly | `6` | Bẩn bao lâu rồi → leo thang |
| P4 | `playerZone` | enum | stall | `BOARD` | `HANDS·BOARD·OVEN·UNDER_COUNTER` |
| P5 | `playerSide` | enum | stall | `TRAI` | Đứng bên nào xe (§5.4) |
| P6 | `playerLastAction` | enum | eventbus | `QUET_PATE` | Thao tác vừa xong |
| P7 | `playerFlourishStreak` | int | assembly | `3` | 3 ổ liên tiếp làm đẹp |
| P8 | `playerGreeted` | bool | session | `0` | Đã chào khách này chưa |
| P9 | `playerUsedName` | bool | session | `1` | Có gọi tên không |
| P10 | `playerNameCorrect` | bool | session | `0` | Gọi **sai** tên → `WRONG_NAME` |
| P11 | `playerHasTraDa` | bool | inventory | `1` | Có trà đá sẵn để mời không |
| P12 | `playerHasQR` | bool | econ | `1` | Đã mua bảng QR (§14) |
| P13 | `playerOvenTier` | int 0..3 | equipment | `1` | Lò nâng cấp tới đâu |
| P14 | `playerMoneyLow` | bool | ledger | `0` | Hết tiền lẻ → không thối được |

**Scope `Customer` — 28 fact.** Nguồn: `content/npcs/*`, `sim/memory.ts`, `sim/gossip.ts`, `sim/perception.ts`. Đây là scope **dày nhất**, vì tính cách nổi lên từ đây.

| # | Fact key | Kiểu | Nguồn | Ví dụ giá trị | Dùng để viết gì |
|---|---|---|---|---|---|
| C1 | `npcId` | enum | npcs | `BA_BAY` | Khoá dòng riêng cho một người |
| C2 | `npcGender` | enum | npcs | `NU` | Đại từ xưng hô |
| C3 | `npcAgeBand` | enum | npcs | `GIA` | `NHO·TRE·TRUNG·GIA` |
| C4 | `npcSoi` | pct | npcs | `90` | CANON §4 chiều 1 |
| C5 | `npcNongTinh` | pct | npcs | `60` | CANON §4 chiều 2 |
| C6 | `npcDeTha` | pct | npcs | `80` | CANON §4 chiều 3 |
| C7 | `npcThanThien` | pct | npcs | `70` | CANON §4 chiều 4 |
| C8 | `npcMood` | pct | mood (P2-02) | `25` | **Độc lập với hành động người chơi** |
| C9 | `npcMoodCause` | enum | mood | `SEP_MANG` | `NONE·SEP_MANG·MUA_UOT·HET_TIEN·TIN_VUI·MET` |
| C10 | `npcMoodProp` | enum | mood | `AO_UOT` | Prop hình ảnh bắt buộc (§16 Đừng-1) |
| C11 | `npcRelTier` | enum | reputation | `FRIEND` | `RIVAL·ACQUAINTANCE·FRIEND` |
| C12 | `npcRelPoints` | int | reputation | `41` | Ngưỡng tinh hơn bucket (không hiện ra UI — T3) |
| C13 | `npcVisitCount` | int | memory | `9` | Lần thứ mấy ghé |
| C14 | `npcDaysSinceVisit` | int | memory | `1` | Vắng lâu → câu chào khác |
| C15 | `npcIsFirstVisit` | bool | memory | `0` | Khách lạ lần đầu |
| C16 | `npcKnowsUsual` | bool | memory | `1` | Đã có "như mọi bữa" chưa |
| C17 | `npcUsualRecipe` | enum | memory | `DAY_DU_NHIEU_OT` | Đầu vào của `REMEMBERED_USUAL` |
| C18 | `npcMemTopKind` | enum | memory | `WRONG_NAME` | Ký ức mạnh nhất đang giữ |
| C19 | `npcMemTopIntensity` | pct | memory | `55` | Mạnh cỡ nào |
| C20 | `npcMemTopAge` | int ngày | memory | `4` | Bao lâu rồi |
| C21 | `npcGrudgeCount` | int | memory | `1` | Số chuyện chưa quên |
| C22 | `npcStoryFlag` | enum | memory | `CHAU_THI_DAI_HOC` | Chuyện họ kể hôm trước → `REMEMBERED_STORY` |
| C23 | `npcHeardRumor` | enum | gossip | `AN_BOT_NGUYEN_LIEU` | Tin đồn đang mang trong đầu |
| C24 | `npcRumorConf` | pct | gossip | `72` | Tin tới đâu |
| C25 | `npcRumorSource` | enum | gossip | `CHI_LAN` | *"chị Lan bảo tôi…"* (CANON §12.3) |
| C26 | `npcArcStage` | int 0..4 | schedule | `2` | Nhịp arc nhân vật |
| C27 | `npcCompanionId` | enum ⚠️ | sim | `BE_SU` | Chỉ có khi dắt người khác tới |
| C28 | `npcPatience` | pct | sim | `48` | Kiên nhẫn còn lại |
| C29 | `npcRumorMutated` | bool | gossip | `1` | **Tin đồn trong đầu họ có phải bản đã BIẾN DẠNG không.** Đây là fact mà cảnh "người chơi giải thích" (`P2-04` §2.5) cần để chọn rule — không có nó thì không phân biệt được *đổ oan* với *trách đúng* ở tầng thoại |

> **Ghi chú hợp đồng fact.** `P2-04` dùng `settings.npcMisremember` — đó là **công tắc trợ năng** (CANON §15), **không phải fact** và **không vào query**. Nó chặn ở tầng `gossipTick()` trước khi mutation được sinh ra, nên tầng thoại không bao giờ thấy nó. Fact duy nhất tầng thoại cần là `C29` ở trên. Ghi rõ ở đây vì hai doc được viết song song và chỗ này trông như một lỗ hổng hợp đồng.

**Scope `Session` — 22 fact.** Nguồn: `dialog/*`, `craft/diff.ts`, `sim/perception.ts`. Scope sống-chết theo **một lượt phục vụ**.

| # | Fact key | Kiểu | Nguồn | Ví dụ giá trị | Dùng để viết gì |
|---|---|---|---|---|---|
| S1 | `eventId` | enum ⚠️ | eventbus | `DROPPED_FOOD` | 1 trong 11 sự kiện CANON §3 |
| S2 | `eventSalience` | int ⚠️ | CANON §3 | `75` | Rule chung theo mức nặng |
| S3 | `obsState` | enum ⚠️ | perception | `CONFIRMED` | `UNAWARE·GLIMPSED·NOTICED·CONFIRMED` |
| S4 | `obsCertainty` | pct ⚠️ | perception | `104` | Vượt ngưỡng bao nhiêu |
| S5 | `witnessCount` | int | perception | `2` | Bao nhiêu người cùng thấy |
| S6 | `npcSlot` | enum | sim | `FRONT_CENTER` | Bảng `visibility` CANON §5 |
| S7 | `npcGazeState` | enum | perception | `AT_HANDS` | `AT_HANDS·AT_FACE·AT_PHONE·AWAY` |
| S8 | `orderSpec` | enum ⚠️ | session | `DAY_DU` | Món đã gọi |
| S9 | `orderExtras` | int | session | `2` | Số yêu cầu thêm/bớt |
| S10 | `orderIsUsual` | bool | session | `1` | Có trùng "như mọi bữa" không |
| S11 | `defectKind` | enum ⚠️ | diff | `THIEU_HANH` | Lỗi **được nói ra** (`take(1)`, CANON §6) |
| S12 | `defectCount` | int | diff | `2` | Tổng lỗi, gồm cả lỗi im lặng |
| S13 | `defectWasSeen` | bool ⚠️ | diff+perception | `1` | `1`→ANTICIPATED · `0`→DISCOVERED |
| S14 | `waitSeconds` | int | session | `47` | Chờ bao lâu |
| S15 | `waitTier` | enum | session | `LAU` | `NHANH·VUA·LAU·QUA_LAU` |
| S16 | `dishTemp` | enum | craft | `NGUOI` | `NONG·AM·NGUOI·CHAY` |
| S17 | `tipGiven` | int ⚠️ | econ | `5` | Nghìn đồng tip |
| S18 | `changeShort` | int | econ | `0` | Thối thiếu bao nhiêu |
| S19 | `nearbyNpcCount` | int | sim | `2` | Có ai nghe lỏm không (CANON §12.4) |
| S20 | `nearbyNpcId` | enum ⚠️ | sim | `THAY_PHUC` | Người đứng gần nhất → đích `followup` |
| S21 | `lastConcept` | enum | dialog | `NOTICE_EVENT` | Concept vừa nói xong |
| S22 | `secSinceLastLine` | int | dialog | `9` | Chống nói dồn |

**Scope `Customer` — 14 fact `ctx*` do `applycontext` ghi.** Đây **không** phải scope thứ năm; chúng nằm trong `Customer` nhưng **không do programmer ghi** — do chính rule ghi ngược. Chi tiết §2.6.

| # | Fact key | Kiểu | Ai ghi | Ví dụ | Ý nghĩa |
|---|---|---|---|---|---|
| X1 | `ctxSawDropToday` | bool | rule bark `DROPPED_FOOD` | `1` | Hôm nay đã thấy rớt bánh rồi |
| X2 | `ctxWrongNameStreak` | int | rule `WRONG_NAME` | `2` | Sai tên liên tiếp mấy lần |
| X3 | `ctxNhacCaiLuong` | bool | rule smalltalk bà Bảy | `1` | Đang trong mạch chuyện cải lương |
| X4 | `ctxChocGiongHanh` | bool | rule bé Su | `1` | Vừa chọc giọng Bắc chị Hạnh |
| X5 | `ctxHaiTinhTao` | bool | rule ông Hải | `1` | Ông Hải còn tỉnh (trước 10h) |
| X6 | `ctxDaKhenBanhHomNay` | bool | rule `FLOURISH` | `1` | Hôm nay khen rồi, đừng khen nữa |
| X7 | `ctxKeChoNguoiKhac` | enum | rule `GOSSIP_TELL` | `DROPPED_FOOD` | Đang kể chuyện gì |
| X8 | `ctxVuaDuocTraDa` | bool | rule `CARED_FOR_THEM` | `1` | Vừa được mời trà đá |
| X9 | `ctxDangDocThoai` | int | rule followup SELF | `2` | Đang ở câu thứ mấy của chuỗi |
| X10 | `ctxKhachMoiToi` | bool | eventbus→rule | `1` | Có khách mới chen vào |
| X11 | `ctxGianChuaNguoi` | bool | rule bark giận | `1` | Còn đang giận, chưa nguội |
| X12 | `ctxDaHoiThamHomNay` | bool | rule `REMEMBERED_STORY` | `1` | Hôm nay hỏi thăm rồi |
| X13 | `ctxMoHangXong` | bool | rule `GREET` khách đầu | `1` | Đã mở hàng (§14) |
| X14 | `ctxNhacKiet` | bool | rule gossip | `1` | Đang trong mạch so sánh với chú Kiệt |

**Tổng: 18 + 14 + 28 + 22 + 14 = 96 fact có tên.** Vượt yêu cầu tối thiểu 60, và đó là chủ ý: thừa fact rẻ hơn thiếu fact rất nhiều, vì thiếu một fact nghĩa là **writer phải đi nhờ programmer**, mà đó chính là thứ kiến trúc này sinh ra để tránh.

---

### 2.4. Criterion — mọi so sánh đều là `lo <= x <= hi`

Ruskin biểu diễn **mọi** phép so sánh, kể cả `==`, thành một khoảng đóng. Lý do: **một instruction stream duy nhất**. Vòng lặp nóng không có `switch (op)`, không có branch misprediction, không có nhánh nào cho `>=` riêng và `<` riêng.

| Writer viết | Nội bộ thành |
|---|---|
| `npcId == BA_BAY` | `lo = hi = sym("BA_BAY")` |
| `npcSoi >= 70` | `lo = 70`, `hi = +∞` (`0x7FFFFFFF`) |
| `waitSeconds < 30` | `lo = -∞`, `hi = 29` |
| `day in 10..20` | `lo = 10`, `hi = 20` |
| `playerHandsDirty` (bool true) | `lo = hi = 1` |
| `npcHeardRumor exists` | `lo = -∞`, `hi = +∞` + cờ `requirePresence` |

```ts
// dialog/ruledb.ts
const NEG_INF = -0x7FFFFFFF, POS_INF = 0x7FFFFFFF;

export interface Criterion {
  key: FactKey;     // đã intern
  lo: number;       // luôn có
  hi: number;       // luôn có
}

/** Vòng lặp nóng: KHÔNG có switch, KHÔNG có nhánh theo toán tử. */
function testCriterion(c: Criterion, q: Query): boolean {
  if (!q.has(c.key)) return false;      // luật loại trừ của Ruskin
  const v = q.get(c.key);
  return v >= c.lo && v <= c.hi;        // đúng hai phép so sánh, luôn luôn
}
```

**Lưu ý về so sánh enum.** Vì symbol id chỉ là thứ tự intern, `lo <= x <= hi` trên enum chỉ có nghĩa khi `lo == hi`. Với "một trong nhiều giá trị" (`eventId in [DROPPED_FOOD, DIRTY_HANDS]`), **không** gộp thành khoảng — trình biên dịch content **tách thành nhiều rule anh em** cùng response (§2.10). Rẻ và không sai lệch.

---

### 2.5. Chấm điểm = SỐ LƯỢNG criteria. Không có gì khác.

Nguyên văn Ruskin: *"The scoring function that worked best for us was the simplest one imaginable — **the number of criteria in a rule**."*

- Rule nhiều criteria hơn = **cụ thể hơn** = thắng.
- Cùng điểm → **chọn ngẫu nhiên** trong số rule thắng. Đây là **nguồn biến thể miễn phí**: viết hai rule cùng 4 criterion cho hai cách nói khác nhau là đã có biến thể mà không phải nghĩ về hệ shuffle.
- `score` **tính sẵn lúc load** (`score = criteria.length`), không tính lại runtime.

**Cấm tuyệt đối:** trọng số tay cho từng criterion, cộng điểm cho "độ quan trọng", nhân hệ số theo NPC. Mọi lần có người trong team muốn thêm trọng số, thứ họ thật sự muốn là **thêm một criterion nữa**. Bảo họ thêm criterion.

#### Pseudocode `selectRule` đầy đủ

```ts
// dialog/ruledb.ts
interface Rule {
  id: number;                  // intern
  concept: FactVal;            // intern
  criteria: Criterion[];       // ĐÃ sort tăng dần theo criteria[i].key
  responses: Response[];       // biến thể NẰM TRONG 1 response (shuffle-bag)
  applycontext: ApplyCtx[];    // [(key, value, durationSec)]
  followup?: Followup;         // (target, concept, delaySec)
  speakonce: boolean;
  norepeat: boolean;
  odds: number;                // 0..100
  score: number;               // = criteria.length, tính lúc load
  // runtime state
  _spoken: boolean;            // cho speakonce
  _lastSpokenAt: number;       // cho norepeat / cooldown
  _cooldownSec: number;
}

/** Rule của một concept đã được sort GIẢM DẦN theo score lúc load. */
function selectRule(concept: FactVal, q: Query, now: number): Rule | null {
  const bucket = rulesByConcept.get(concept);
  if (!bucket) return null;

  let bestScore = -1;
  const winners: Rule[] = [];

  for (let i = 0; i < bucket.length; i++) {
    const r = bucket[i];

    // ---- Tối ưu 1: sort giảm dần theo score → dừng sớm cả bucket ----
    // Đã có winner điểm 5 thì không cần xét rule điểm 4 trở xuống nữa.
    if (r.score < bestScore) break;

    // ---- Lọc trạng thái, rẻ, làm trước khi đụng criteria ----
    if (r.speakonce && r._spoken) continue;
    if (r.norepeat && r._spoken) continue;
    if (now - r._lastSpokenAt < r._cooldownSec) continue;

    // ---- Tối ưu 2: walk tuyến tính + early reject ----
    if (!matches(r, q)) continue;

    // ---- Tối ưu 3: odds kiểm tra SAU CÙNG ----
    // Trượt odds phải khiến rule này biến mất, KHÔNG được để rule generic
    // điểm thấp hơn nhảy vào thế chỗ ở cùng lượt — nếu không, "35% im lặng"
    // sẽ bị bark tier-3 lấp đầy. Chi tiết §2.9.
    if (r.odds < 100 && rng.pct() >= r.odds) { oddsFailedThisTick = true; continue; }

    if (r.score > bestScore) { bestScore = r.score; winners.length = 0; }
    winners.push(r);
  }

  if (winners.length === 0) return null;
  return winners.length === 1 ? winners[0] : winners[rng.int(winners.length)];
}
```

#### Tối ưu: sort criteria theo alphabet để walk tuyến tính + early reject

Cả `criteria` của rule **và** danh sách key của query đều sort theo **cùng một thứ tự** (thứ tự `FactKey`, tức thứ tự intern; ta ép nó trùng thứ tự alphabet bằng cách intern toàn bộ danh mục fact §2.3.1 theo alphabet **trước** mọi symbol khác). Khi đó `matches()` là một **merge walk** hai con trỏ, không phải tra bảng băm:

```ts
function matches(r: Rule, q: Query): boolean {
  const cs = r.criteria;
  // Early reject 1: criterion đầu tiên thường là cái hiếm nhất (§2.10 xếp thứ tự)
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i];
    if (!q.has(c.key)) return false;                 // loại ngay
    const v = q.get(c.key);
    if (v < c.lo || v > c.hi) return false;          // loại ngay
  }
  return true;
}
```

Ba thứ làm nên tốc độ, theo đúng thứ tự quan trọng:

1. **Early reject.** Trung bình một rule bị loại ở criterion thứ **1,3** trong tổng 4 — vì criterion đầu gần như luôn là `eventId` hoặc `npcId`, thứ loại 90%+ rule trong một phép so sánh.
2. **Sort giảm dần theo `score`** trong mỗi bucket concept → `break` sớm toàn bucket.
3. **Bucket theo `concept`** → không bao giờ duyệt rule của concept khác.

**Đo thực tế cần đạt** (mục 6): 150 rule trong bucket `NOTICE_EVENT`, query 96 fact, 5 NPC × 3 lần chọn/giây → **< 0,4 ms/frame** trên máy tầm trung. Nếu vượt, thứ cần sửa **không phải** thuật toán mà là **thứ tự criterion** trong content (§2.11 có validator cảnh báo).

---

### 2.6. `applycontext` có `duration` — ĐÂY LÀ TOÀN BỘ CƠ CHẾ TRÍ NHỚ

CANON §11 liệt kê đây là thứ **thứ nhất trong ba thứ phải có từ v0**. Lý do: nếu thiếu `duration`, mọi "nhớ tạm" sẽ bị người ta cài bằng biến toàn cục rời rạc, và đó chính xác là **hối tiếc của Ruskin ở slide 143**.

```ts
interface ApplyCtx { key: FactKey; value: number; durationSec: number; }
// durationSec = 0        → chỉ đúng trong tick này
// durationSec = -1       → vĩnh viễn (cho tới hết ngày/hết save, tuỳ scope)
// durationSec > 0        → tự hết hạn
```

Cài đặt: mỗi NPC giữ một mảng nhỏ `ctxEntries: {key, value, expireAt}[]`. `writeCustomerFacts()` đổ chúng vào query; entry hết hạn bị xoá khi đổ. **Không có timer, không có `setTimeout`** — kiểm tra lười lúc dựng query.

```ts
function applyContext(npc: Npc, r: Rule, now: number) {
  for (const a of r.applycontext) {
    const expireAt = a.durationSec < 0 ? Infinity : now + a.durationSec;
    npc.ctxSet(a.key, a.value, expireAt);   // ghi đè entry cùng key
  }
}
```

#### Năm ví dụ cụ thể trong game này

**(1) Running gag "bánh rớt" — 900 giây (15 phút chơi).**
Rule bark tier-1 của bà Bảy khi thấy `DROPPED_FOOD` ghi `ctxSawDropToday = 1` trong 900s. Trong 15 phút đó, **mọi** rule smalltalk của bà có thêm một biến thể được mở khoá:

> *"Bữa nay tay con run hay gì vậy? Nãy giờ cô thấy rớt một lần rồi đó nghen."*

Sau 900s fact biến mất, biến thể đó tự đóng lại. Không ai phải viết code dọn dẹp.

**(2) Trà đá — 180 giây.**
Rule `CARED_FOR_THEM` ghi `ctxVuaDuocTraDa = 1` trong 180s. Trong 3 phút đó, rule bark tiêu cực cấp thấp (`eventSalience <= 40`) có một rule anh em **cùng điểm** nhưng dịu hơn, nhờ criterion `ctxVuaDuocTraDa == 1`. Kết quả: ly trà đá **thật sự** làm khách bớt gắt, và nó **hiện ra bằng lời**, không bằng con số (T3).

**(3) Chuỗi sai tên — vĩnh viễn trong ngày (`duration = -1`, reset lúc qua ngày).**
Rule `WRONG_NAME` ghi `ctxWrongNameStreak = ctxWrongNameStreak + 1`. Lần 1 nhẹ, lần 2 có ý, lần 3 giận thật — đúng luật **leo thang** của idea.md §9.4 luật 3. Ba mức là ba rule khác nhau, khác nhau đúng một criterion (`ctxWrongNameStreak ∈ [1,1] / [2,2] / [3,+∞]`), nên chúng **cùng score** và cạnh tranh sòng phẳng — chỉ một cái khớp.

**(4) Mạch cải lương của bà Bảy — 240 giây.**
Rule smalltalk mở mạch ghi `ctxNhacCaiLuong = 1` trong 240s. Trong 4 phút đó, bà Bảy có **6 rule** chỉ sống được khi fact này có mặt: bà hát một câu, bà chê đào trẻ bây giờ hát không ra hơi, bà hỏi con có biết *Tiếng trống Mê Linh* không. Hết 4 phút, mạch đóng. Đây là §19.5: **bà không tồn tại để bị thương hại** — bà có một thứ hoàn toàn không liên quan tới nghèo, và cơ chế giữ nó sống đúng 4 phút là `applycontext`.

**(5) Ông Hải trước 10h — 3.600 giây, ghi lúc gặp lần đầu trong ngày.**
Rule `GREET` của ông Hải, criterion `hour ∈ [0, 1000]`, ghi `ctxHaiTinhTao = 1` trong 3600s. Khi ông quay lại buổi chiều fact đã hết hạn → bộ rule hoàn toàn khác tiếp quản. Người chơi **tự phát hiện** rằng có hai ông Hải, mà không có một dòng UI nào nói ra.

**(6, bonus) Cooldown của bark tier-1** cũng là `applycontext`: rule tier-1 ghi `ctxBarkT1_<eventId> = 1` trong 90s; rule tier-1 có criterion `ctxBarkT1_<eventId>` **vắng mặt**. Nhờ vậy **cooldown không phải cơ chế riêng** — nó là fact hết hạn. Đây là lý do CANON nói "copy nguyên, không sáng tạo": một cơ chế lo được bốn việc.

---

### 2.7. `followup` tra LÚC CALLBACK — chi tiết tinh tế nhất của cả talk

```ts
interface Followup {
  target: FactVal;    // sym("SELF") | sym("BROADCAST") | npcId cụ thể
  concept: FactVal;   // concept sẽ hỏi lại
  delaySec: number;
}
```

**Điều duy nhất phải hiểu đúng:** lúc rule A chạy xong, ta **không** chọn sẵn câu tiếp theo. Ta chỉ **hẹn giờ**: "sau `delaySec` giây, hãy chạy `selectRule(concept, query MỚI)`".

```ts
function scheduleFollowup(r: Rule, speaker: Npc, sess: Session, now: number) {
  if (!r.followup) return;
  const f = r.followup;
  const target = resolveTarget(f.target, speaker, sess);   // có thể null
  pendingFollowups.push({ targetRef: weakRef(target), concept: f.concept, at: now + f.delaySec });
}

function tickFollowups(now: number) {
  for (const p of pendingFollowups.drainDue(now)) {
    const npc = p.targetRef.deref();
    if (!npc || !npc.isPresent) continue;             // khách đã đi → im lặng, không lỗi

    // ĐIỂM MẤU CHỐT: query được dựng LẠI TẠI ĐÂY, không phải lúc lên lịch.
    const q = buildQuery(scratchQuery, npc, currentEvent, sess);
    const r = selectRule(p.concept, q, now);

    if (r === null) continue;                          // KHÔNG có câu nào khớp nữa
                                                       // → hội thoại TỰ CHẤM DỨT.
    speak(npc, r, now);
  }
}
```

> **Hệ quả:** ta **không cần cơ chế ngắt lời nào cả.**
> Không có `interrupt()`, không có hàng đợi ưu tiên, không có `cancelDialogue()`. Nếu giữa chừng thế giới đổi — khách mới tới, người chơi làm rớt bánh, mưa ập xuống, khách được gọi tên đúng — thì criterion của câu tiếp theo đơn giản là **không còn khớp**, `selectRule` trả `null`, và chuỗi **im bặt**. Đúng như đời thật: người ta không "bị ngắt lời", người ta chỉ **thôi nói**.

#### Áp dụng: cắt độc thoại dài thành nhiều câu ngắn nối bằng `followup` về chính mình

Không bao giờ viết một `Response` dài 4 câu. Viết **4 rule**, mỗi rule một câu, nối bằng `followup: (SELF, concept_kế_tiếp, 2.2s)`, và **mỗi rule mang theo criterion kiểm tra thế giới vẫn còn như cũ**.

Chi phí thêm: ba criterion. Lợi ích: độc thoại **tự biết lúc nào phải dừng**.

#### Ví dụ đầy đủ: chuỗi 4 câu của bà Bảy, bị cắt giữa chừng vì khách mới tới

Bối cảnh: ngày 12, 6h41 sáng. Bà Bảy đứng `FRONT_CENTER`, `npcRelTier = FRIEND`, `visitCount = 9`. Người chơi vừa làm đúng "như mọi bữa" → `REMEMBERED_USUAL`. Bà mở mạch cải lương.

```yaml
# content/rules/ba-bay/cailuong.rules.yaml
- id: bay.cailuong.1
  concept: SMALLTALK
  when:
    npcId: BA_BAY
    npcRelTier: FRIEND
    timeSlot: CAO_DIEM
    queueLength: "<=2"           # chỉ mở mạch khi quầy còn thong thả
    ctxNhacCaiLuong: absent
  say:
    - "Con biết hông, hồi xưa cô mê cải lương dữ lắm."
  applycontext:
    ctxNhacCaiLuong: { value: 1, duration: 240 }
    ctxDangDocThoai: { value: 1, duration: 30 }
  followup: { target: SELF, concept: SMALLTALK_CAILUONG_2, delay: 2.4 }

- id: bay.cailuong.2
  concept: SMALLTALK_CAILUONG_2
  when:
    npcId: BA_BAY
    ctxNhacCaiLuong: 1
    queueLength: "<=2"           # ← criterion GIỮ CHUỖI SỐNG
    ctxKhachMoiToi: absent       # ← criterion GIỮ CHUỖI SỐNG
  say:
    - "Tối thứ Bảy nào cũng lết qua nhà con Tám coi ké cái ti vi."
  applycontext:
    ctxDangDocThoai: { value: 2, duration: 30 }
  followup: { target: SELF, concept: SMALLTALK_CAILUONG_3, delay: 2.6 }

- id: bay.cailuong.3
  concept: SMALLTALK_CAILUONG_3
  when:
    npcId: BA_BAY
    ctxNhacCaiLuong: 1
    queueLength: "<=2"
    ctxKhachMoiToi: absent
  say:
    - "Tuồng *Tiếng trống Mê Linh* đó, con có nghe qua lần nào chưa?"
  applycontext:
    ctxDangDocThoai: { value: 3, duration: 30 }
  followup: { target: SELF, concept: SMALLTALK_CAILUONG_4, delay: 3.0 }

- id: bay.cailuong.4
  concept: SMALLTALK_CAILUONG_4
  when:
    npcId: BA_BAY
    ctxNhacCaiLuong: 1
    queueLength: "<=2"
    ctxKhachMoiToi: absent
  say:
    - "Đào bây giờ mặt đẹp thiệt, mà hát tới câu vọng cổ là hụt hơi. Cô nói thiệt đó."
  applycontext:
    ctxNhacCaiLuong: { value: 0, duration: 0 }   # đóng mạch, sạch sẽ
```

**Diễn biến khi KHÔNG có gì xen vào** (`t` tính từ câu 1):

| t | Câu | Query lúc callback |
|---|---|---|
| 0,0s | *"Con biết hông, hồi xưa cô mê cải lương dữ lắm."* | `queueLength=1` |
| 2,4s | *"Tối thứ Bảy nào cũng lết qua nhà con Tám coi ké cái ti vi."* | `queueLength=1`, `ctxNhacCaiLuong=1` |
| 5,0s | *"Tuồng Tiếng trống Mê Linh đó, con có nghe qua lần nào chưa?"* | `queueLength=2` — vẫn `<=2`, qua |
| 8,0s | *"Đào bây giờ mặt đẹp thiệt, mà hát tới câu vọng cổ là hụt hơi."* | `queueLength=2`, qua |

**Diễn biến khi anh Dũng tấp xe vô lúc t = 4,1s** (`eventbus` ghi `ctxKhachMoiToi = 1` trong 8s, và `queueLength` nhảy lên 3):

| t | Chuyện gì xảy ra |
|---|---|
| 0,0s | Câu 1 phát. `followup(SELF, …_2, 2.4)` lên lịch. |
| 2,4s | Callback. Dựng query mới: `queueLength=1`, `ctxKhachMoiToi` vắng → khớp. Câu 2 phát. `followup(…_3, 2.6)` lên lịch. |
| **4,1s** | **Anh Dũng tới.** `queueLength=3`. `ctxKhachMoiToi=1`. |
| 5,0s | Callback `…_3`. Dựng query mới → `queueLength=3` **trượt** `<=2`; `ctxKhachMoiToi=1` **trượt** `absent`. `selectRule` trả **`null`**. |
| 5,0s | **Bà Bảy im.** Không có animation ngắt lời, không có dấu `…`, không có code nào chạy. Chỉ là không có câu nào khớp. |
| 5,0s | `ctxNhacCaiLuong` vẫn còn (240s) → nếu hàng chờ giãn ra trước t≈245s, rule `bay.cailuong.3` lại khớp và bà **nói tiếp đúng chỗ đang dở**. |

Điểm cuối là thứ khiến kỹ thuật này đắt giá: **hội thoại không bị huỷ, nó bị treo.** Và cái treo đó là tự nhiên, vì nó chỉ là một fact còn hạn.

> ⚠️ **Đừng "sửa" cái im lặng này.** Mỗi khi playtester nói "bà ấy đang nói dở mà tự nhiên nín", phản xạ đúng là thêm **một rule** `SMALLTALK_CAILUONG_3_NGAT` điểm thấp hơn (*"Thôi con lo cho khách đi, chút cô kể tiếp."*), **không phải** thêm cơ chế.

---

### 2.8. `norepeat` là first-class — hối tiếc của chính Ruskin (slide 143)

Nguyên văn: *"Storing individual variables to remember which lines were said... is lame."*

Cho nên `norepeat` và `speakonce` là **trường của Rule**, không phải flag người ta tự cài bằng `applycontext`. Ba mức, phân biệt rõ:

| Trường | Ý nghĩa | Vòng đời | Ví dụ |
|---|---|---|---|
| `speakonce: true` | Nói **một lần duy nhất trong cả save** | Ghi vào file save | *"Ủa con là cháu cô Ba hả? Cô nhớ hồi con còn nhỏ xíu."* |
| `norepeat: true` | Nói **một lần mỗi ngày** | Reset lúc qua ngày | Câu chào đặc biệt sau khi vắng 3 ngày |
| `cooldown: N` | Không lặp trong N giây | Hết hạn theo `applycontext` (§2.6-6) | Bark tier-1 |

Ba trường này ghi **cùng một chỗ**: `Rule._spoken` / `Rule._lastSpokenAt`, serialize theo `rule.id` (đã intern). Save chỉ cần một mảng bit + một mảng int. Không có một biến rời nào.

---

### 2.9. Bark 3 tầng + luật 35% im lặng + nghịch lý lặp

CANON §11 và §16 quy định cả hai; chúng chạy chung một chỗ nên viết chung ở đây.

**Nghịch lý lặp (Sergio Ocio Barriales, Splinter Cell Blacklist):** *phản ứng càng đặc thù càng dễ lộ khi lặp.* Câu *"Ủa con, cái bánh đó rớt xuống đất rồi mà?"* là câu hay nhất trong game — nghe lần thứ ba trong một ngày thì nó là câu tệ nhất trong game. Cho nên câu càng hay càng phải **có cooldown dài**.

| Tầng | Số criterion điển hình | Cooldown | Vai trò | Ví dụ (bà Bảy, `DROPPED_FOOD`) |
|---|---|---|---|---|
| **tier-1** | 5–7 | **90s**, `norepeat` theo ngày với vài câu đắt | Câu **hay nhất**, nhắm đúng người đúng sự kiện | *"Ủa con, cái bánh đó rớt xuống đất rồi mà?"* |
| **tier-2** | 3–4 | 25s | Chung hơn: đúng loại sự kiện, không đúng riêng ai | *"Í, rớt kìa con."* |
| **tier-3** | 1–2 | 6s | **Lưới an toàn** — không bao giờ trả `null` | *"Hửm."* · *"Ơ…"* · *(chép miệng)* |

Vì score = số criterion, **thứ tự thắng tự đúng**: tier-1 (6 điểm) > tier-2 (3 điểm) > tier-3 (1 điểm). Ta **không** cần trường `tier` trong Rule. Tier chỉ là cách writer **gọi tên** các mức cụ thể. Đây lại là một ví dụ của "copy nguyên, không sáng tạo".

**Luật 35% im lặng (CANON §11).** Khoảng 35% số lần chuyển sang `NOTICED` thì NPC **không nói gì cả** — chỉ đổi nét mặt (kênh 1 của P2-02). Cài ở **tầng gọi**, không ở tầng rule:

```ts
// dialog/barks.ts
const SILENT_NOTICE_PCT = 35;

function onNoticed(npc: Npc, ev: Event, now: number) {
  // Quyết định im lặng TRƯỚC khi hỏi rule DB.
  // Nếu để rule DB trả câu rồi mới bỏ, tier-3 "Hửm." sẽ lấp đầy chỗ im lặng.
  if (rng.pct() < SILENT_NOTICE_PCT) {
    face.set(npc, expressionFor(npc, ev, /*intensity*/ ev.salience));  // P2-02 §4
    memory.record(npc, ev);        // VẪN ghi nhớ. Im lặng ≠ không biết.
    return;
  }
  const q = buildQuery(scratchQuery, npc, ev, session);
  const r = selectRule(SYM.NOTICE_EVENT, q, now);
  if (r) speak(npc, r, now);
}
```

Hai chi tiết sống còn:

1. **Im lặng vẫn ghi memory.** Nếu không, luật 35% biến thành "35% sự kiện không tính", và người chơi sẽ học được rằng cứ làm liều là hoà. Đây là lỗ hổng ăn gian tiềm năng — xem mục 7.
2. **Kiểm tra im lặng trước `selectRule`.** Ngược lại thì tier-3 nhảy vào và ta có 0% im lặng thật.

**`odds` trong rule ≠ luật 35%.** `odds` dùng cho biến thể hiếm (*"Trời đất quỷ thần ơi."* `odds: 15`). Khi rule trượt `odds`, nó bị bỏ qua **và không cho rule điểm thấp hơn thế chỗ trong cùng lượt** (cờ `oddsFailedThisTick` ở §2.5) — nếu không, mỗi lần trượt odds ta lại nghe *"Hửm."*, và "hiếm" biến thành "nhạt".

---

### 2.10. Shuffle-bag trong `responses`

CANON §11 gọi đây là **đòn bẩy rẻ nhất của cả dự án**: 8 biến thể shuffle-bag cho cảm giác tương đương ~25–30 dòng random thuần (random thuần trùng ~50% sau chỉ ~3,4 lần — bài toán sinh nhật).

**Quy tắc kiến trúc, theo đúng CANON §11:** *"biến thể NẰM TRONG 1 response, không phải nhiều rule."* Nhiều rule cùng điểm cũng cho biến thể, nhưng **không kiểm soát được độ lặp**; shuffle-bag thì có.

```ts
// dialog/shufflebag.ts
export class ShuffleBag {
  private order: number[];
  private pos = 0;
  constructor(private n: number, private rng: Rng) { this.order = [...Array(n).keys()]; this.reshuffle(); }

  private reshuffle() {
    // Fisher–Yates
    for (let i = this.n - 1; i > 0; i--) {
      const j = this.rng.int(i + 1);
      [this.order[i], this.order[j]] = [this.order[j], this.order[i]];
    }
    // Chống "nối đuôi": không để phần tử cuối túi cũ thành phần tử đầu túi mới
    if (this.n > 1 && this.order[0] === this.lastDrawn) {
      [this.order[0], this.order[1]] = [this.order[1], this.order[0]];
    }
    this.pos = 0;
  }
  private lastDrawn = -1;
  draw(): number {
    if (this.pos >= this.n) this.reshuffle();
    return (this.lastDrawn = this.order[this.pos++]);
  }
}
```

Mỗi `Response` giữ **một** `ShuffleBag` theo số dòng của nó. Bag **không** serialize vào save (mất vị trí túi khi load lại là chấp nhận được; serialize nó là tối ưu sớm).

**Chèn biến ngữ cảnh** (idea.md §9.4 luật 2) làm ở tầng render, sau khi rút dòng:

```
"{ten}, bữa nay {mon} nghen?"   →  "Cô Bảy, bữa nay ổ đầy đủ nghen?"
```

Biến hợp lệ: `{ten}` `{xungHo}` `{mon}` `{nhan}` `{thoiTiet}` `{lanThu}` `{tenNguoiQuen}` `{gioSang}`. Validator (§2.11) từ chối biến ngoài danh sách.

---

### 2.11. Tính cách nổi lên từ MẬT ĐỘ RULE, không code riêng

Bài học *Left 4 Dead*, nguyên văn: **Coach luôn thắng khi ai đó bị thương, vì hắn có nhiều rule "động viên" rất cụ thể — "Coach coaches — that's who he is."**

Không có `if (npc.isCoach)`. Không có trường `npc.personalityType`. Chỉ có: **hắn có nhiều rule hơn về chuyện đó, và rule của hắn nhiều criterion hơn, nên hắn thắng.**

#### Áp vào bà Bảy

Bà Bảy: `soi 0.9 / nongTinh 0.6 / deTha 0.8 / thanThien 0.7`. Bà là **người soi nhất hẻm**. Cách hiện thực hoá điều đó **không phải** là nhân hệ số ở đâu đó, mà là:

| Sự kiện | Số rule generic (ai cũng dùng) | Số rule riêng của bà Bảy | Criterion trung bình của rule bà Bảy |
|---|---|---|---|
| `DROPPED_FOOD` | 4 | **7** | 5,4 |
| `DIRTY_HANDS` | 4 | **6** | 5,2 |
| `STALL_CLEANLINESS` (trạng thái) | 3 | **5** | 5,0 |
| `BURNT_OR_COLD` | 4 | 2 | 3,5 |
| `MADE_THEM_WAIT` | 5 | 1 | 3,0 |
| `WRONG_NAME` | 5 | 2 | 4,0 |

Đọc bảng: **18 trong tổng 23 rule riêng của bà Bảy nằm ở 3 sự kiện vệ sinh**, và chúng có trung bình 5+ criterion. Hệ quả tự động:

- Khi có sự kiện vệ sinh, bà Bảy **gần như luôn có một rule 5–6 điểm** khớp → bà thắng mọi rule generic 2–3 điểm → **bà luôn là người lên tiếng**.
- Khi có sự kiện chờ lâu, bà chỉ có rule 3 điểm → anh Dũng (người có 6 rule riêng về `MADE_THEM_WAIT`, trung bình 5,1 criterion) thắng → **anh Dũng là người lên tiếng**.

Người chơi sau 3–4 ngày sẽ tự nói: *"bà Bảy lúc nào cũng nhìn, đừng có giỡn khi bả ngồi đó"* (idea.md §9.1). Không một dòng code nào chứa chữ "soi".

> **`soi` trong CANON §4 vẫn dùng — nhưng ở tầng khác.** `soi → traitMul` ở tầng **NHẬN THẤY** (CANON §5), quyết định bà **biết**. Mật độ rule quyết định bà **nói**. Hai thứ khác nhau, đừng trộn. Nếu trộn, ta sẽ có một hệ số nhân bí ẩn mà không ai debug được.

#### Bảng mật độ rule mục tiêu cho 12 NPC (v1)

| NPC | "Chuyên môn" (nơi dồn rule) | Rule riêng | Criterion TB | Thắng generic ở sự kiện |
|---|---|---|---|---|
| **Bà Bảy** | Vệ sinh + cải lương | 23 | 5,1 | `DROPPED_FOOD` `DIRTY_HANDS` `STALL_CLEANLINESS` |
| **Chú Tư** | Lịch sinh hoạt, đúng giờ | 16 | 4,6 | `REMEMBERED_USUAL` (vì ông có "như mọi bữa" rõ nhất) |
| **Anh Dũng** | Chờ lâu, vội | 14 | 5,1 | `MADE_THEM_WAIT` |
| **Chị Lan** | **Im lặng** — rule ít, phần lớn là rule `applycontext` không có `say` | 17 | 5,3 | (không thắng "nói", thắng **hệ quả trễ**) |
| **Bé Su** | Lan tin, quay TikTok | 18 | 4,4 | `GOSSIP_TELL` |
| **Ông Hải** | Ồn ào (sau 10h) + tử tế (trước 10h) | 19 | 5,0 | mọi sự kiện salience ≥ 75, chỉ sau 10h |
| **Cô Mai** | Tiền lẻ, sổ nợ, buôn bán | 15 | 4,7 | `PAY` `FREE_EXTRA` |
| **Thầy Phúc** | Giải thích hệ thống, điềm đạm | 15 | 5,4 | `ORDER_DEFECT` (ông nói rõ vì sao sai) |
| **Chị Hạnh** | Từ ngữ miền Bắc, hoà nhập | 15 | 4,5 | `ORDER_DEFECT` do khác tên gọi món |
| **Anh Bảo** | Không thấy gì cả | 11 | 4,0 | (thắng ở `obsState = UNAWARE`) |
| **Bà Sáu** | Đồng nghiệp, gossip | 12 | 4,3 | `GOSSIP_HEAR` |
| **Chú Kiệt** | So kè, nghề nghiệp | 12 | 4,8 | `FLOURISH` (chỉ ổng nhận ra tay nghề) |

---

## 3. Dữ liệu & schema

### 3.1. Kiểu TypeScript đầy đủ

```ts
// dialog/types.ts
export interface Response {
  lines: string[];              // các biến thể — shuffle-bag chạy trên mảng này
  _bag?: ShuffleBag;            // dựng lúc load
  emote?: FactVal;              // gợi ý nét mặt cho P2-02 (không bắt buộc)
  pose?: FactVal;               // gợi ý ngôn ngữ cơ thể cho P2-02
  voice?: string;               // id file lồng tiếng (người thật — CANON §2)
}

export interface Rule {
  id: number; idName: string;              // idName chỉ cho log/validator
  concept: FactVal;
  criteria: Criterion[];                   // sort tăng theo key; score = length
  responses: Response[];
  applycontext: ApplyCtx[];
  followup?: Followup;
  speakonce: boolean;
  norepeat: boolean;
  cooldownSec: number;
  odds: number;                            // 0..100, mặc định 100
  score: number;
  _spoken: boolean; _lastSpokenAt: number;
}

export interface RuleDb {
  byConcept: Map<FactVal, Rule[]>;         // mỗi mảng sort GIẢM theo score
  byId: Map<number, Rule>;
}
```

### 3.2. Định dạng file content cho writer

**Chốt: YAML**, không phải JSON. Ba lý do, đo được:

1. **Không dấu ngoặc kép quanh thoại.** Thoại tiếng Việt đầy dấu `"` và `,`; JSON bắt escape từng cái → writer làm hỏng file mỗi ngày.
2. **Comment được.** Writer ghi chú ngay cạnh dòng (`# câu này chỉ hay khi trời mưa`).
3. **Diff git đọc được.** Đổi một dòng thoại → diff một dòng.

Build step chuyển YAML → một file `rules.bin` (mảng `Int32Array` phẳng) lúc `vite build`. Runtime **không parse YAML**.

**Ba quy ước duy nhất writer phải nhớ:**

| Quy ước | Cụ thể |
|---|---|
| Số nguyên | `npcSoi: ">=70"` chứ không phải `0.7` |
| Toán tử là chuỗi | `">=70"` `"<=2"` `"10..20"` `absent` `present` — ngoài ra là `==` |
| Mỗi `say` là một túi | Nhiều dòng trong một `say` = biến thể shuffle-bag của **cùng một câu** |

#### File content thật — `content/rules/ba-bay/vesinh.rules.yaml`

```yaml
# ============================================================
# Bà Bảy — bộ rule VỆ SINH.
# Bà là người soi nhất hẻm (soi 0.9) nhưng dễ tha (deTha 0.8):
# bà nói thẳng ngay lúc đó, nhưng mai vẫn ghé. An toàn để người chơi học luật.
# CANON §9 hàng 1 · §7 (phán quyết vệ sinh) · §3.1
# ============================================================

- id: bay.drop.t1.lan1
  concept: NOTICE_EVENT
  # 6 criterion -> score 6 -> thắng mọi rule generic (2-3 điểm)
  when:
    npcId: BA_BAY
    eventId: DROPPED_FOOD
    obsState: CONFIRMED
    ctxSawDropToday: absent        # lần đầu trong ngày
    ctxBarkT1_DROP: absent         # cooldown 90s, xem applycontext
    queueLength: "<=4"
  say:
    - "Ủa con, cái bánh đó rớt xuống đất rồi mà?"
    - "Ê ê ê — cái ổ đó rớt rồi đó con."
    - "Con ơi, cô thấy hết rồi nghen. Bỏ đi."
    - "Rớt rồi kìa con. Thôi bỏ, làm ổ khác."
  emote: NHIU_MAY_LO
  pose: LEAN_IN
  applycontext:
    ctxSawDropToday: { value: 1, duration: 900 }
    ctxBarkT1_DROP:  { value: 1, duration: 90 }
  followup: { target: SELF, concept: NOTICE_FOLLOW, delay: 2.8 }

- id: bay.drop.t1.lan2
  concept: NOTICE_EVENT
  # Leo thang: lần thứ hai trong ngày. Cùng 6 criterion, khác đúng một cái.
  when:
    npcId: BA_BAY
    eventId: DROPPED_FOOD
    obsState: CONFIRMED
    ctxSawDropToday: 1
    ctxBarkT1_DROP: absent
    queueLength: "<=4"
  say:
    - "Lại rớt nữa hả con? Bữa nay tay con sao vậy?"
    - "Trời, hai lần rồi đó nghen. Bình tĩnh lại đi con."
    - "Cô nói rồi mà. Rớt là bỏ, đừng tiếc."
  emote: NHIU_MAY_NANG
  pose: ARMS_CROSS
  applycontext:
    ctxBarkT1_DROP: { value: 1, duration: 90 }

- id: bay.drop.follow.bobanh
  concept: NOTICE_FOLLOW
  # Câu nối. Tra LÚC CALLBACK: nếu người chơi đã bỏ ổ bánh đi rồi thì
  # playerHolding đổi -> criterion trượt -> bà im, không cằn nhằn thừa.
  when:
    npcId: BA_BAY
    playerHolding: BANH
    ctxSawDropToday: 1
  say:
    - "Bỏ đi con, cô chờ được mà."
    - "Làm lại ổ khác đi, cô không gấp."
  emote: BUON_NHE
  pose: NOD

- id: bay.tay.t1
  concept: NOTICE_EVENT
  when:
    npcId: BA_BAY
    eventId: DIRTY_HANDS
    obsState: ">=NOTICED"
    playerHandsDirtySec: ">=4"
    ctxBarkT1_TAY: absent
  say:
    - "Con ơi, cầm tiền rồi bốc đồ ăn kìa."
    - "Lau tay cái đi con, cô nhắc chừng thôi."
    - "Tiền bạc dơ lắm con. Cô già rồi cô biết."
  emote: NHIU_MAY_LO
  odds: 85                          # 15% bà chỉ nhíu mày, không nói
  applycontext:
    ctxBarkT1_TAY: { value: 1, duration: 120 }

- id: bay.quaydo.nhacnho
  concept: SMALLTALK
  # Trạng thái, không phải sự kiện (CANON §3.3): không bark tức thì,
  # nhưng bà bình luận lúc rảnh.
  when:
    npcId: BA_BAY
    stallCleanliness: "<=45"
    queueLength: "<=1"
    ctxNhacQuayDo: absent
  say:
    - "Con quét cái sàn đi, ruồi bu kìa."
    - "Cái thùng rác đầy rồi con ơi. Đổ đi kẻo hôi."
    - "Sạch sẽ là bán được, con nhớ lời cô."
  emote: NHIU_MAY_NHE
  norepeat: true                    # một lần mỗi ngày
  applycontext:
    ctxNhacQuayDo: { value: 1, duration: -1 }

# ---- Generic: ai cũng dùng, score thấp, luôn có để không bao giờ trả null ----
- id: gen.drop.t2
  concept: NOTICE_EVENT
  when: { eventId: DROPPED_FOOD, obsState: CONFIRMED }
  say: [ "Í, rớt kìa.", "Ui, rớt rồi.", "Ơ, rớt." ]
  emote: NGAC_NHIEN
  cooldown: 25

- id: gen.any.t3
  concept: NOTICE_EVENT
  # Lưới an toàn, 1 criterion, score 1. KHÔNG BAO GIỜ được xoá rule này.
  when: { obsState: ">=NOTICED" }
  say: [ "Hửm.", "Ơ…", "Ủa.", "…" ]
  emote: NHIU_MAY_NHE
  cooldown: 6
```

### 3.3. Ngân sách dòng thoại v1 — **520 dòng** (CANON §11)

**Phân bổ theo concept.** "Generic" = pool dùng chung cho cả 12 NPC + khách vãng lai vô danh; "Riêng" = dòng chỉ một NPC dùng.

| # | Concept | Generic | Riêng NPC | Tổng | Ghi chú |
|---|---|---|---|---|---|
| 1 | `GREET` | 24 | 24 | 48 | Có nhánh mở hàng (§14) |
| 2 | `ORDER` | 18 | 24 | 42 | Dùng nguyên văn §14/§19.3 |
| 3 | `SMALLTALK` | 20 | 36 | 56 | Gồm các chuỗi `followup` SELF |
| 4 | `NOTICE_EVENT` (bark 3 tầng) | 46 | 60 | **106** | Nặng nhất — 11 sự kiện × 3 tầng |
| 5 | `DELIVERY` (ANTICIPATED/DISCOVERED) | 34 | 40 | **74** | ROI cao nhất (CANON §6) |
| 6 | `PAY` | 14 | 12 | 26 | Tip, thối tiền, QR, sổ nợ |
| 7 | `FAREWELL` | 16 | 16 | 32 | |
| 8 | `GOSSIP_TELL` | 12 | 18 | 30 | Phải nghe lỏm được (CANON §12.4) |
| 9 | `GOSSIP_HEAR` | 10 | 12 | 22 | *"chị Lan bảo tôi…"* |
| 10 | `IDLE` | 20 | 10 | 30 | Lẩm bẩm lúc chờ |
| 11 | `ARC` | 0 | 24 | 24 | Nhịp arc 12 NPC |
| 12 | `CO_BA` (mentor) | 0 | 30 | 30 | Ngoài 12 NPC (CANON §9) |
| | **Tổng** | **214** | **306** | **520** | |

**Phân bổ 276 dòng riêng cho 12 NPC** (306 − 30 của cô Ba):

| NPC | Dòng riêng | % | Vì sao được/bị cắt |
|---|---|---|---|
| **Bà Bảy** | **34** | 12,3% | Nhiều nhất: 3 sự kiện vệ sinh + mạch cải lương + mối bất hoà với cô Ba |
| **Ông Hải** | **28** | 10,1% | Phải có **hai bộ giọng** (trước/sau 10h) — đó mới là cái đau (§19.5) |
| **Chị Lan** | **26** | 9,4% | Ít câu nhưng **đắt**: câu báo trước 3–4 ngày phải viết rất kỹ (P2-02) |
| **Bé Su** | **26** | 9,4% | Nút khuếch đại danh tiếng → nhiều `GOSSIP_TELL` |
| **Chú Tư** | **24** | 8,7% | Dạy lịch sinh hoạt + arc biến mất ngày ~30 |
| **Cô Mai** | **22** | 8,0% | Tiền lẻ, sổ nợ, và **làm ăn được** (§19.5) |
| **Thầy Phúc** | **22** | 8,0% | NPC dạy đọc hệ thống → câu giải thích dài hơn trung bình |
| **Chị Hạnh** | **22** | 8,0% | Từ ngữ miền Bắc + arc hoà nhập + bị chọc giọng |
| **Anh Dũng** | **20** | 7,2% | `MADE_THEM_WAIT` + arc đổi ca đêm |
| **Bà Sáu** | **18** | 6,5% | Gossip + mốc *"nhà tui gần xe bánh mì cô Ba"* |
| **Chú Kiệt** | **18** | 6,5% | Đối thủ + người duy nhất hiểu nghề |
| **Anh Bảo** | **16** | 5,8% | Ít nhất **có chủ ý**: giá trị của cậu là **không nói gì** (sandbox perception) |
| | **276** | 100% | |

**Kiểm tra đối chiếu (CANON §11 / idea.md §18.7):** 520 dòng ≈ 5.000 từ ≈ **9,6 từ/dòng** — sát Firewatch (8,3 từ/dòng), tức ngân sách này **không** ngầm giả định câu dài bất thường. 1 writer × 2–3 tuần.

**Hệ số nở nhờ 3 đòn bẩy (CANON §11):**

| Đòn bẩy | Hệ số cảm nhận | 520 dòng thật ≈ |
|---|---|---|
| Shuffle-bag (túi 4–8 dòng) | ×3,1 | ~1.610 dòng random thuần |
| Chèn biến ngữ cảnh | ×1,3 | |
| Bark 3 tầng + 35% im lặng | ×1,2 (giảm tần suất lặp cảm nhận) | |
| **Kết hợp** | **≈ ×4,8** | **≈ 2.500 dòng cảm nhận** |

Con số cuối gần đúng bằng **full release ~2.980 dòng** — đó là lý do CANON gọi shuffle-bag là đòn bẩy rẻ nhất dự án, và cũng là lý do **không được bỏ nó để "làm sau"**.

---

### 3.4. Công cụ validate rule DB

Chạy bằng `npm run rules:check`, **và chạy trong CI — build fail nếu có lỗi cấp `ERROR`**. Đây là thứ giữ cho writer làm việc một mình được.

| # | Kiểm tra | Mức | Vì sao |
|---|---|---|---|
| V1 | Mọi `when.<key>` nằm trong danh mục 96 fact §2.3.1 | **ERROR** | Sai chính tả key → rule **im lặng không bao giờ khớp**, là bug tệ nhất vì không crash |
| V2 | Mọi giá trị enum (`BA_BAY`, `DROPPED_FOOD`) có trong bảng intern | **ERROR** | Cùng lý do |
| V3 | Mọi `concept` có **ít nhất một rule score ≤ 2** (lưới an toàn tier-3) | **ERROR** | Thiếu → `selectRule` trả `null` → NPC câm giữa cảnh |
| V4 | Mọi `followup.concept` tồn tại và **có rule khớp được** (giải tối thiểu) | **ERROR** | Chuỗi cụt |
| V5 | Không có hai rule **trùng hệt** bộ criteria (cùng concept) | WARN | Thường là copy-paste quên sửa; nếu cố ý (biến thể) thì bỏ qua được |
| V6 | Không có rule bị **che hoàn toàn**: tồn tại rule khác cùng concept có criteria là **tập con** và score **cao hơn** | WARN | Rule không bao giờ chạy |
| V7 | `say` rỗng và không có `applycontext`/`followup` | **ERROR** | Rule không làm gì |
| V8 | Túi `say` có < 3 dòng ở concept tần suất cao (`NOTICE_EVENT`, `GREET`) | WARN | Sẽ nghe lặp |
| V9 | Biến `{…}` trong `say` nằm ngoài danh sách 8 biến hợp lệ | **ERROR** | Render ra `{tenn}` trước mặt người chơi |
| V10 | Criterion đầu tiên của rule **không phải** fact có độ chọn lọc cao (`npcId`/`eventId`/`concept`) | WARN | Hỏng early reject → chậm |
| V11 | Rule có `speakonce` mà không có `voice` | INFO | Câu nói-một-lần nên có lồng tiếng |
| V12 | Tổng số dòng `say` theo concept lệch > 15% so với ngân sách §3.3 | WARN | Cảnh báo trượt ngân sách sớm |
| V13 | `odds < 100` trên rule score ≤ 2 | **ERROR** | Lưới an toàn không được phép trượt |
| V14 | Dòng thoại chứa từ miền Bắc ngoài whitelist của chị Hạnh | WARN | Giữ giọng miền Nam (CANON §2, §14) |
| V15 | Dòng thoại chứa từ trong **blacklist lằn ranh đỏ** (§14.1) | **ERROR** | Không thương lượng |
| V16 | Đại từ xưng hô trong `say` khớp `npcGender`/`npcAgeBand` của `npcId` trong `when` | WARN | Bà Bảy không thể xưng "anh" |

```ts
// tools/rules-check.ts — trích phần V6, kiểm tra che phủ
function isShadowed(a: Rule, b: Rule): boolean {
  if (a.concept !== b.concept) return false;
  if (b.score <= a.score) return false;
  // criteria của a là TẬP CON của criteria b, và khoảng của b hẹp hơn hoặc bằng
  return a.criteria.every(ca => {
    const cb = b.criteria.find(x => x.key === ca.key);
    return cb !== undefined && cb.lo >= ca.lo && cb.hi <= ca.hi;
  }) && a.criteria.length < b.criteria.length && sameResponses(a, b);
}
```

**Công cụ phụ bắt buộc — `rules:explain`.** Cho một query đã dump từ save, in ra **bảng xếp hạng rule**: rule nào thắng, rule nào suýt thắng, rule nào bị loại và **loại ở criterion thứ mấy**. Không có công cụ này thì debug rule DB là mò kim đáy bể.

```
$ npm run rules:explain -- --save day12.json --npc BA_BAY --concept NOTICE_EVENT
  ✔ bay.drop.t1.lan1        score 6   THẮNG
  ✘ bay.drop.t1.lan2        score 6   loại tại criterion #4 (ctxSawDropToday: cần 1, query không có)
  ✘ bay.tay.t1              score 5   loại tại criterion #2 (eventId: cần DIRTY_HANDS, có DROPPED_FOOD)
  ✔ gen.drop.t2             score 2   khớp nhưng thua điểm
  ✔ gen.any.t3              score 1   khớp nhưng thua điểm
```

---

## 4. UI/UX hai thiết bị

Rule DB không có UI riêng, nhưng nó **quyết định hình dạng của bong bóng thoại**:

| Thiết bị | Ràng buộc từ rule DB |
|---|---|
| **PC (Steam)** | Câu có `followup` phải hiện **tuần tự**, không chồng bong bóng. Khi `selectRule` trả `null` giữa chuỗi → bong bóng hiện tại **fade sau 1,2s**, không cắt đột ngột (đó là thứ duy nhất ta "làm thêm" cho cái im lặng) |
| **Web demo (itch.io)** | `rules.bin` phải < 200 KB để demo tải nhanh. 520 dòng ≈ 45 KB text + ~12 KB bảng rule → đạt thoải mái |
| **Cả hai** | CANON §15.1: text **không bao giờ tự chạy tiếp**. Với chuỗi `followup`, `delaySec` là **thời gian tối thiểu**; nếu người chơi chưa bấm qua câu trước, callback **hoãn**, và query được dựng lúc **callback thật sự chạy** — luật §2.7 vẫn đúng |
| **Cả hai** | CANON §15.1: hộp thoại nền **đục**, tự giãn khi cỡ chữ ≥200%. Dòng dài nhất trong toàn bộ content **≤ 90 ký tự** (validator V17 nên thêm) |

---

## 5. Tham số cần tune

| Tham số | Khởi điểm | Khoảng | Cách đo |
|---|---|---|---|
| `SILENT_NOTICE_PCT` | **35%** | 25–45% | Playtest 10 người: đếm số lần người chơi nói "sao nó nói hoài vậy". Mục tiêu 0 |
| Cooldown bark tier-1 | **90s** | 60–180s | Log: số lần một câu tier-1 nghe lại trong 1 phiên. Mục tiêu ≤ 2 |
| Cooldown bark tier-2 | **25s** | 15–45s | Như trên |
| Cooldown bark tier-3 | **6s** | 4–12s | Nếu *"Hửm."* nghe > 8 lần/ngày chơi → tăng |
| `followup.delay` chuỗi SELF | **2,2–3,0s** | 1,8–4,0s | Đo tốc đọc: 9,6 từ/dòng ÷ ~4 từ/s ≈ 2,4s |
| Kích thước shuffle-bag | **4–8 dòng** | 3–10 | Bag < 3 nghe lặp rõ; > 10 tốn ngân sách dòng |
| `odds` biến thể hiếm | **15** | 5–30 | Cảm giác "câu đó hiếm lắm mới nghe" |
| Ngưỡng `queueLength` cắt smalltalk | **≤ 2** | 1–4 | Nếu 4 thì khách hàng chờ nghe NPC tám chuyện → bực |
| Số rule/bucket concept nóng | **≤ 180** | — | Vượt → đo lại ngân sách frame |
| Ngân sách `selectRule` | **< 0,4 ms/frame** | < 1,0 ms | `performance.now()` quanh vòng lặp, ghi p95 |
| Số fact trong query | **96** | 80–130 | Vượt 130 → xem lại có fact nào chưa từng bị rule nào dùng (tool `rules:unused`) |

---

## 6. Tiêu chí đạt

- [ ] **T-1.** `selectRule` có **đúng một** hàm chấm điểm, và nó là `criteria.length`. Grep toàn repo: không có chuỗi `weight`, `priority`, `importance` trong `dialog/`.
- [ ] **T-2.** Mọi fact key và value là **số nguyên đã intern**. Grep `dialog/ruledb.ts`: không có phép so sánh string nào trong vòng lặp nóng.
- [ ] **T-3.** Query có **≥ 90 fact**, phẳng, dựng lại mỗi lần. Có test khẳng định 96 key §2.3.1 đều có mặt (trừ nhóm ⚠️) ở ít nhất một kịch bản.
- [ ] **T-4.** **Writer thêm một case mới hoàn toàn (rule + 4 dòng thoại) mà không mở một file `.ts` nào** — đo bằng buổi thử: đưa YAML cho một người không biết code, họ thêm được case trong < 20 phút.
- [ ] **T-5.** `applycontext` có `duration`, và **≥ 5 running gag** trong content v1 dùng nó (§2.6).
- [ ] **T-6.** `followup` dựng query **tại callback**. Có test tự động: chuỗi 4 câu bà Bảy, bơm `queueLength = 3` vào giữa → chuỗi dừng ở câu 2, **không có exception, không có bong bóng rỗng**.
- [ ] **T-7.** `norepeat` và `speakonce` là **trường của Rule** và serialize được. Không có biến nhớ-câu-đã-nói nào ngoài `Rule._spoken`.
- [ ] **T-8.** Mọi concept có lưới an toàn tier-3 (V3 pass). `selectRule` **chưa từng** trả `null` cho concept bắt buộc trong 5 giờ log playtest.
- [ ] **T-9.** Đo lặp: trong 1 phiên chơi 60 phút, **không dòng thoại nào nghe quá 4 lần**, và không dòng tier-1 nào nghe quá 2 lần.
- [ ] **T-10.** Đo im lặng: tỉ lệ `NOTICED` không sinh lời nằm trong 30–40%.
- [ ] **T-11.** Mật độ rule khớp bảng §2.11 ±20%, và bà Bảy thắng **≥ 80%** các lượt có sự kiện vệ sinh khi bà có mặt.
- [ ] **T-12.** `npm run rules:check` pass sạch cấp ERROR trong CI.
- [ ] **T-13.** Hiệu năng: p95 `selectRule` < 0,4 ms với 5 NPC, 180 rule/bucket.
- [ ] **T-14.** Tổng dòng thoại v1 = **520 ± 20**, phân bổ lệch không quá 15% mỗi concept so với §3.3.

---

## 7. Rủi ro & cách bịt

| # | Rủi ro | Nối tới | Cách bịt |
|---|---|---|---|
| R1 | **Có người thêm trọng số vào scoring** ("rule này quan trọng hơn") | CANON §11 "copy nguyên" | Code review chặn; validator grep từ khoá; trong mọi ca, câu trả lời là **thêm một criterion** |
| R2 | **Sinh ra hệ ngắt lời** vì playtester thấy NPC nín giữa chừng | §2.7 | Đây là **tính năng**. Bịt bằng cách thêm rule `_NGAT` điểm thấp, không thêm cơ chế |
| R3 | **35% im lặng bị dùng để ăn gian** — người chơi học rằng 1/3 số lỗi "không tính" | CANON §8g (micro-cheat) | **Im lặng vẫn ghi memory** (§2.9). Thêm: fact `ctxRepeatDefect` đếm theo pattern → sau N lần sinh rule *"ê, dạo này bánh nhạt hơn hay tại tao?"* |
| R4 | Writer sai chính tả key → rule **im lặng không bao giờ khớp** | §3.4 V1 | ERROR cấp CI + `freezeSymbols()` ném lỗi lúc load |
| R5 | Bucket concept phình quá to lúc full release (~2.980 dòng) | §5 | Sort giảm theo score + `break` sớm làm chi phí gần như độc lập với số rule **điểm thấp**. Nếu vẫn chậm: index phụ theo `npcId` |
| R6 | **Tin đồn/ngẫu nhiên chạm vào hệ quả** qua đường rule DB | CANON §16 Đừng-3 | Rule **chỉ được** ghi fact `ctx*` và phát `say`/`emote`/`pose`. Cấm `applycontext` ghi vào fact scope `Global`/`Player`. Validator V18 kiểm |
| R7 | Rule DB bị dùng để **mô phỏng đời sống NPC ngoài quầy** | CANON §16 Đừng-1 | Nguyên tắc Orkin: cho NPC **nói ra** + **một prop** (fact `npcMoodProp`). Không có rule nào được đọc fact về nơi NPC vừa đi qua |
| R8 | Shuffle-bag bị bỏ để "làm sau" | §3.3 | Nó là ×3,1 của cả ngân sách. Không có nó, 520 dòng nghe như 520 dòng. Đưa vào tiêu chí đạt T-9 |
| R9 | Lồng tiếng người thật (CANON §2) không kịp cho 520 dòng | — | `voice` là **tuỳ chọn** trong Response. Ưu tiên `speakonce` + tier-1. Dòng không có voice vẫn chạy |
| R10 | Vi phạm lằn ranh đỏ §14.1 lọt qua vì thoại nằm trong data, không ai review | CANON §14.1 | V15 blacklist cứng trong CI + review thoại bởi người Việt viết văn hoá (đứng đầu credits) |

---

## 8. Truy vết

| Nội dung trong doc này | `idea.md` | `CANON.md` |
|---|---|---|
| Bốn khái niệm Fact/Query/Criterion/Rule | §18.1 | §11 |
| Fact là Symbol, không phải string | §18.1 (*"Don't actually use strings"*) | §11 |
| Query phẳng, *"whole world at your fingertips"* | §18.1 | §11 |
| 4 scope blackboard (Firewatch) | §18.1 | §11 |
| Scoring = số criteria | §18.1 (nguyên văn) | §11 |
| `applycontext` + `duration` | §18.1 mục 1 | §11 "Ba thứ phải có từ v0" (1) |
| `followup` tra lúc callback | §18.1 mục 2 | §11 "Ba thứ phải có từ v0" (2) |
| `norepeat` first-class, slide 143 | §18.1 mục 3 | §11 (3) |
| Tính cách từ mật độ rule, *"Coach coaches"* | §18.1 cuối | §11 |
| Bark 3 tầng, nghịch lý lặp | §18.7 đòn bẩy 3 | §11 |
| Shuffle-bag, bài toán sinh nhật | §18.7 đòn bẩy 1 | §11 |
| Pool generic, cắt ~40% | §18.7 đòn bẩy 2 | §11 |
| 35% im lặng | §9.4 luật 4 | §11 |
| Chống twinning 0,2–0,4s | §18.7 bonus | §11 |
| Ngân sách 520 dòng / 5.000 từ | §18.7 bảng · HT6 | §11 |
| Delivery-diff ANTICIPATED/DISCOVERED | §18.3 | §6 |
| 11 sự kiện, salience | §9.2 | §3 |
| 12 NPC, 4 chiều tính cách | §9.3 · HT7 | §4 · §9 |
| Ngôn ngữ gọi món nguyên văn | §19.3 | §14 |
| Lằn ranh đỏ | §19.4 | §14.1 |
| Đừng mô phỏng, cho NÓI RA + prop (Orkin) | §18.6 Đừng-1 | §16 Đừng-1 |
| Ngẫu nhiên không chạm hệ quả | §18.6 Đừng-3 | §16 Đừng-3 |

---

## 9. Đề xuất sửa CANON

**Đ1. Bổ sung danh mục fact vào CANON §11 dưới dạng trỏ tới doc này.**
CANON §11 hiện mô tả `Rule` và 4 scope nhưng không có danh mục fact. Danh mục §2.3.1 (96 fact) là **hợp đồng liên doc** — P2-02 (kênh phản ứng), P2-03 (trí nhớ), P2-04 (đồn thổi) đều phải đọc/ghi đúng tên đó. Đề xuất CANON §11 thêm một dòng: *"Danh mục fact chuẩn: `docs/phase-2-he-npc/P2-01-rule-database-thoai.md` §2.3.1. Thêm fact mới phải cập nhật tại đó."*

**Đ2. Làm rõ trong CANON §11 rằng `cooldown` là trường thứ tư bên cạnh `speakonce`/`norepeat`.**
CANON §11 liệt kê `speakonce: bool; norepeat: bool; odds: int(0..100)`. Bark 3 tầng (cũng của §11) **bắt buộc** cần cooldown theo giây, khác `norepeat` theo ngày. Doc này cài cooldown bằng `applycontext` nên **không phát sinh cơ chế mới**, nhưng schema Rule nên ghi rõ `cooldownSec: int` để tránh mỗi doc cài một kiểu.

**Đ3. Ghi nhận quy ước "mọi số trong content là số nguyên (float ×100)".**
CANON §4 viết `soi: number // 0..1`. Content YAML viết `npcSoi: ">=70"`. Hai cách viết cùng tồn tại là mầm bug. Đề xuất CANON §4 thêm ghi chú: *"Trong rule DB, 4 chiều được lượng hoá thành 0..100."*

**Đ4. (Chỉ ghi nhận, không đổi số)** Ngân sách §3.3 phân bổ **34 dòng cho bà Bảy** — nhiều nhất trong 12 NPC. Điều này nhất quán với CANON §9 (bà là người soi nhất hẻm, an toàn để học luật) và §19.5 (bà phải có thứ không liên quan tới nghèo). Nếu playtest cho thấy bà Bảy lấn át, thứ cần cắt là **rule vệ sinh tier-1**, không phải mạch cải lương.
