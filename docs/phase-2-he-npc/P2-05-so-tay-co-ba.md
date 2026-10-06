# P2-05 — Sổ tay

> ⚠️ **ĐỔI GIỌNG (sau P2-05b).** Tài liệu này viết thời cuốn sổ còn là *"sổ tay cô Ba"*: cột
> trái *"cô Ba ghi giùm"*, trang cuối ngày và tick mực đỏ là **lời cô Ba**. **Không còn đúng
> nữa.** Quán là của người chơi; cô Ba chỉ xuất hiện ở màn mở đầu (`P4-06`) để dựng bối cảnh.
> Cuốn sổ giờ là **chữ của chính người bán, ngôi thứ nhất** — cột trái *"ghi vội lúc bán"*,
> cột phải *"ngồi nghĩ lại"*, dấu khoanh bút đỏ là **cùng một người, khác cây bút**.
>
> **Cơ chế bên dưới không đổi một dòng nào** — phân chia lao động §2.2, hệ giả thuyết §2.3,
> trang cuối ngày §2.4, năm mốc §2.5 đều giữ nguyên. Chỉ đổi *ai đang viết*. Khi đọc file
> này, cứ đổi "cô Ba ghi" → "mình ghi", "con" → "mình". Giọng mới bị khoá bằng test ở
> `tests/p2-doc-quan-he.test.ts`.

**Thuộc phase:** P2 — Hệ NPC đầy đủ
**Phụ thuộc:** `P2-03` (trí nhớ, quan hệ, lịch sinh hoạt) · `P2-04` (đồn thổi — cấp chất liệu cho nhật ký & lời cô Ba) · `P2-01` (Rule DB) · nối vào `P3-01` (dự báo cầu) và `P4-03` (arc nhân vật, kết game)
**Phụ lục:** `P2-05b-doc-quan-he.md` — đọc quan hệ trên trang sổ (hai trục: độ hiểu đếm được, tình cảm bằng chữ) + bịt lỗ trần tin + **đổi giọng sang ngôi thứ nhất**
**Trạng thái:** **Chốt** về phân chia lao động và hệ giả thuyết · **Cần đo** ngưỡng mốc §2.5 · **Còn mở** bố cục trang trên màn hình dọc

---

## 1. Mục tiêu

Sổ tay là **mặt phẳng để người chơi NHẬN RA hệ thống** (idea.md HT2). Không phải một tính năng tiện ích. Không phải một cái log. Nó là thứ duy nhất đứng giữa một mô phỏng quan hệ tinh vi và việc **không ai biết nó tồn tại**.

- **T3** — không hiện chỉ số: sổ tay là câu trả lời cho câu hỏi *"vậy người chơi đọc hệ thống bằng cách nào?"*. Trả lời: **bằng chữ của chính họ**, viết đè lên **dữ liệu thô của máy**. Không có một con số quan hệ nào trong sổ.
- **T1** — khách chấm quá trình: nhật ký thô là bản ghi của quá trình đó, để người chơi ngắt quãng vẫn nối lại được.
- **T4** — một mùa có điểm kết: trang sổ cuối ngày là **dấu chấm hết cho ngày**. Đây là nhu cầu của Linh và nó cũng chính là hình dạng của T4 thu nhỏ vào một ngày.

**Bài học phải sợ — Oblivion.** Hàng trăm NPC có lịch sinh hoạt đầy đủ: đi ngủ, đi ăn, đi làm, đi chợ. Bruce Nesmith: **mỗi lần cải thiện Radiant AI lại làm nó ÍT được người chơi nhận ra hơn**. Người chơi hiếm khi nói chuyện với một NPC quá 3 lần, nên họ **không bao giờ nhận ra hệ thống tồn tại**. Toàn bộ khoản đầu tư biến mất vào hư không.

**Mô hình đúng — Bombers' Notebook của Majora's Mask.** Thứ biến lịch trình NPC thành *content* **không phải bản thân lịch trình**, mà là **cuốn sổ 20 mục**: một mặt phẳng nơi người chơi thấy được rằng có một cái máy đang chạy, thấy được mình đã biết tới đâu, và thấy được **còn gì chưa biết**. Cùng một hệ mô phỏng, khác nhau một cuốn sổ, khác nhau cả một thế hệ game.

> Nếu tới cuối P2 mà playtest cho thấy người chơi không nhận ra hệ NPC tồn tại, **sửa sổ tay trước, đừng sửa sim.** Sim không sai. Sim đang vô hình.

---

## 2. Cơ chế

### 2.1. Ba lý do, ba persona — và thiết kế phải phục vụ cả ba

Cuốn sổ này được **ba persona hoàn toàn khác nhau đề xuất độc lập**, vì **ba lý do không liên quan gì tới nhau**. Đó là tín hiệu thiết kế mạnh nhất trong cả tài liệu: khi một người tối ưu hoá, một người chơi ngắt quãng và một người lo âu cùng chỉ vào một thứ, thứ đó không phải tính năng phụ.

| Persona | Nhu cầu gốc | Nó biến thành cái gì trong sổ | Nếu thiếu thì sao |
|---|---|---|---|
| **Ngọc Ánh** (mobile, chơi 5 phút/lần, ngắt quãng) | *"Em không nhớ nổi mặt khách gặp 5 ngày trước."* | **Dòng "lâu rồi không thấy ghé"** (§2.4) + nhật ký thô có **mặt NPC** kèm mỗi dòng, không chỉ tên | Toàn bộ XĐ3 ("khách im lặng biến mất") **không tồn tại** với cô ấy. Cô ấy đã nói thẳng: *"Em không nhận ra. Chắc chắn luôn."* |
| **Minh** (tối ưu hoá) | Cần **dữ liệu để dựng mô hình** cầu | **Nhật ký thô đầy đủ, xuất được, lọc được** (§2.2) | Anh ấy tự chép tay ra Excel — nghĩa là game đã thua: phần thú vị nhất diễn ra **ngoài game** |
| **Linh** (ADHD) | Cần **một dấu chấm hết cho ngày** để thôi nghĩ về nó lúc đi ngủ | **Trang cuối ngày của cô Ba**, 2–3 dòng, **không phán đúng sai** (§2.4) | Ngày không có điểm đóng → rumination. *"Im lặng với người lo âu là một loại tiếng ồn."* |

**Tinh chỉnh của Minh, và nó là nguyên tắc tổ chức của cả cuốn sổ:**

> **Game tự log dữ liệu thô. Đừng bắt người chơi chép tay thứ máy đã biết — đó là busywork.**
> **Người chơi chỉ viết DIỄN GIẢI.**

### 2.2. Phân chia lao động tuyệt đối

Đây là ranh giới cứng. Mỗi lần có ý tưởng thêm gì vào sổ, hỏi đúng một câu: **máy đã biết chưa?** Nếu rồi → máy viết. Nếu chưa → người chơi viết. **Không có vùng xám, không có ô nào cả hai cùng đụng vào.**

| | **CỘT TRÁI — máy viết** | **CỘT PHẢI — người chơi viết** |
|---|---|---|
| Nội dung | **Dữ liệu thô đã xảy ra** | **Diễn giải về con người** |
| Ai tạo | Game, tự động, không hỏi | Người chơi, tự nguyện, bỏ trống cũng được |
| Sửa được không | **Không.** Chỉ đọc | Sửa/xoá tự do, mọi lúc |
| Hình thức | Chữ đánh máy, đều, hơi nhoè như giấy than | **Chữ viết tay** của người chơi (font viết tay, mực xanh) |
| Ví dụ | `Ngày 12 · 6h47 · Chú Tư · ổ đầy đủ nhiều ớt · lần thứ 9` | *"chú Tư — T2 tới T6, luôn 6h45. cuối tuần không thấy. thích cay."* |
| Có lên màn hình chính không | Không | Không |

**Cột trái ghi ĐÚNG SÁU trường, không hơn:**

```ts
type LogEntry = {
  day: number
  minute: number         // 407 → hiện "6h47"
  npcId: NpcId | 'KHACH_LA'
  orderText: string      // nguyên văn cách họ gọi, CANON §14: "cho một ổ đầy đủ"
  visitCount: number     // "lần thứ 9"
  note?: RawNote         // xem dưới
}

type RawNote =
  | { t: 'EAVESDROP'; claim: string; source?: NpcId }   // source rỗng nếu nghe ở tier 1
  | { t: 'ABSENT_STREAK'; missed: number }              // "lâu rồi không thấy ghé"
  | { t: 'FIRST_VISIT' }
  | { t: 'SAID_SOMETHING'; barkId: BarkId }             // chỉ khi NPC nói ra chuyện đời họ
```

**Bốn thứ cột trái TUYỆT ĐỐI không được ghi** — mỗi cái vi phạm một trụ cột:

| ❌ Không ghi | Vi phạm |
|---|---|
| Bất kỳ con số **tình cảm** nào, dù đổi tên thành "độ thân", "★", "♥" | **T3** |
| Việc hôm đó người chơi làm **đúng hay sai** (*"bạn đã làm rớt bánh"*) | **T1** — chấm điểm là việc của khách, không phải của sổ |
| Bất kỳ suy luận nào (*"chú Tư có vẻ thích ớt"*) | **Ranh giới §2.2** — đó là việc của cột phải. Máy cướp mất thì người chơi hết việc để làm |
| Bất kỳ dự báo nào (*"mai chắc cần 5 ổ"*) | **CANON §13.2** — người chơi phải tự suy ra. Có nút tính giùm là cả P2-03 §2.10 vô nghĩa |

> ⚠️ **Hàng đầu cấm con số TÌNH CẢM, không cấm con số ĐỘ HIỂU.** Thước đếm *người chơi
> đã biết mấy điều về một người* (`n/6`, dẫn từ giả thuyết đã `CONFIRMED`) là thước đo
> **người chơi**, không dẫn một chút nào từ `relationPoints`, và nó **được phép hiện số** —
> trang này vốn đã hiện `đang đoán 2/5` từ trước. Xem `P2-05b-doc-quan-he.md` §3.1. Đừng gỡ
> nó đi vì đọc hàng trên mà không đọc dòng này.

**Vì sao ranh giới này phải tuyệt đối:** nếu máy viết cả diễn giải, sổ tay thành một bảng tra cứu và người chơi thành người đọc bảng. Nếu người chơi phải chép cả dữ liệu thô, sổ tay thành busywork và Minh sẽ chuyển sang Excel trong ngày thứ ba. **Chỉ có đúng một cách chia làm cả hai người hài lòng**, và đây là nó.

**Bố cục trang (PC, trang đôi):**

```
╔══════════════════════════════════════╦═══════════════════════════════════════╗
║  SỔ GHI — NGÀY 12                    ║   CHÚ TƯ                              ║
║  (cô Ba ghi giùm)                    ║   (con ghi)                           ║
╠══════════════════════════════════════╬═══════════════════════════════════════╣
║  6h47  Chú Tư                        ║   T2 tới T6, luôn 6h45.               ║
║        "cho chú ổ đầy đủ, nhiều ớt"  ║   cuối tuần không thấy.               ║
║        lần thứ 9                     ║   thích cay. ăn lẹ rồi đi liền.       ║
║                                      ║   mấy bữa nay nói chuyện              ║
║  6h52  Bà Bảy                        ║   công ty dời chỗ ???                 ║
║        "cho cô như mọi bữa"          ║                                       ║
║        lần thứ 14                    ║   ┌─ CÔ ĐOÁN ──────────────────────┐  ║
║                                      ║   │ ✓ hay ăn:        nhiều ớt      │  ║
║  7h40  (nghe ở góc hẻm)              ║   │ ✓ thường ghé:    6h30–7h       │  ║
║        bà Sáu — chuyện ổ bánh rớt    ║   │ ✓ cuối tuần:     không ra      │  ║
║                                      ║   │ ○ làm nghề:      ______        │  ║
║  8h15  Chị Lan                       ║   └────────────────────────────────┘  ║
║        "cho chị một ổ"               ║                                       ║
║        lần thứ 3 · lâu rồi không ghé ║   [ + thêm dòng ]                     ║
╚══════════════════════════════════════╩═══════════════════════════════════════╝
      ▲ chữ đánh máy, không sửa được         ▲ chữ viết tay, sửa tự do
```

Hai nửa trang **khác nhau về chất liệu hình ảnh** đủ để nhận ra trong nửa giây: trái là giấy than in máy, phải là giấy kẻ ô có vết mực. Người chơi không bao giờ phải nhớ "cái nào mình viết".

### 2.3. Hệ giả thuyết — thưởng trực tiếp cho việc HỌC hệ thống

Đề xuất của Minh (idea.md §22.3): *"Sổ tay có cấu trúc + hệ giả thuyết. Đoán đúng 3 điều về một người → mở một cảnh nhỏ. **Thưởng trực tiếp cho việc HỌC hệ thống.**"*

Đây là câu trả lời cho lời phàn nàn sâu nhất về thể loại này: bạn học được rất nhiều về NPC, và **không có gì công nhận điều đó**.

#### Giả thuyết có dạng gì — **chọn từ danh sách, không viết tự do**

Quyết định này cần giải thích, vì viết tự do nghe "tự do" hơn:

| | Viết tự do | **Chọn từ danh sách (đã chốt)** |
|---|---|---|
| Kiểm chứng | Không kiểm chứng được bằng máy | Kiểm chứng chính xác |
| Trên mobile | Gõ tiếng Việt có dấu, 5 phút một lần, một tay | **Chạm 2 lần** |
| Khả năng brute-force | — | Bịt bằng luật "chỉ hiện lựa chọn đã quan sát" (dưới) |
| Vi phạm T3 | — | Không, nếu xác nhận **diegetic** (dưới) |

Viết tự do **vẫn còn** — nó là cả **cột phải** ở §2.2. Ô "cô đoán" là thứ **thêm vào**, không phải thay thế. Người chơi viết văn ở cột phải, và đánh dấu giả thuyết ở ô dưới.

```ts
type HypothesisSlot =
  | 'HAY_AN'          // món / nguyên liệu họ thích
  | 'KHONG_AN_DUOC'   // thứ họ tránh
  | 'THUONG_GHE'      // khung giờ
  | 'NGAY_TRONG_TUAN' // ngày nào ghé / ngày nào không
  | 'LAM_NGHE'        // nghề nghiệp
  | 'TINH_Y'          // "để ý kỹ" hay "xuề xoà"  ← suy ra `soi`, KHÔNG hiện số
  | 'CHUYEN_DOI'      // một chuyện đời họ đã kể

type Hypothesis = {
  npcId: NpcId
  slot: HypothesisSlot
  value: string            // id trong từ vựng, KHÔNG phải chuỗi tự do
  dayGuessed: number
  state: 'OPEN' | 'CONFIRMED'    // KHÔNG CÓ trạng thái 'WRONG'
  dayConfirmed?: number
}
```

**Chống brute-force — ba luật, không luật nào là "khoá bằng cooldown":**

1. **Danh sách chỉ chứa thứ người chơi ĐÃ GẶP.** Ô `HAY_AN` của chú Tư chỉ liệt kê nguyên liệu đã xuất hiện trong nhật ký thô của **chính chú Tư** cộng với nguyên liệu người chơi đã từng dùng. Ngày 3 danh sách có 4 lựa chọn; ngày 20 có 11. **Danh sách lớn dần đúng theo hiểu biết của người chơi** — nó *là* thanh tiến trình, và nó không có số.
2. **Mỗi NPC tối đa 5 giả thuyết mở cùng lúc.** Muốn đoán cái thứ 6 thì phải xoá một cái. Buộc phải **cam kết**.
3. **Một slot đổi giá trị tối đa 1 lần/ngày.** Không thể quét hết danh sách trong một tối.

**Và luật thứ tư, quan trọng nhất:** xác nhận **không đến từ việc bấm nút**. Nó đến từ việc **chơi**.

#### Xác nhận thế nào mà không vi phạm T3

**Không bao giờ** hiện *"Đúng rồi! +1/3"*. Không có tick xanh lúc bấm. Không có chữ "sai" ở bất kỳ đâu.

```ts
function checkHypotheses(npc: Npc, day: number, w: World) {
  for (const h of openHypotheses(npc)) {
    if (!groundTruthMatches(npc, h)) continue          // sai thì KHÔNG làm gì cả
    if (!wasDemonstratedToday(npc, h, w)) continue     // phải CHỨNG MINH bằng hành động
    h.state = 'CONFIRMED'
    h.dayConfirmed = day
    w.eveningNote.confirmations.push({ npcId: npc.id, slot: h.slot })
  }
  if (confirmedCount(npc) >= 3 && !npc.vignetteUnlocked) {
    w.pendingVignettes.push(npc.id)                    // §2.3 cảnh nhỏ, diễn ra 1–2 ngày sau
  }
}
```

**`wasDemonstratedToday` là trái tim của cơ chế.** Đoán không đủ — phải **dùng** cái mình đoán:

| Slot | Chứng minh bằng gì |
|---|---|
| `HAY_AN` | Làm ổ có thứ đó **mà khách không phải nói** → chính là `REMEMBERED_USUAL` |
| `KHONG_AN_DUOC` | Làm ổ **không có** thứ đó, trong khi hôm đó bạn có sẵn nó trên bàn |
| `THUONG_GHE` | Chuẩn bị sẵn ổ của họ **trước** khung giờ đó, và họ tới đúng khung |
| `NGAY_TRONG_TUAN` | Nhập hàng theo đúng giả định đó và không bị ế/thiếu vì họ |
| `LAM_NGHE` | Một hành động phù hợp nghề: gói kỹ cho người chạy xe, để nguội bớt cho người ăn vội |
| `TINH_Y` | Với người `soi` cao: làm một ổ **không có lỗi nào** khi họ đứng `FRONT_CENTER` |
| `CHUYEN_DOI` | Hỏi thăm đúng chuyện hôm trước → chính là `REMEMBERED_STORY` |

Nghĩa là: **hệ giả thuyết không phải một câu đố phụ. Nó là cách đặt tên cho việc người chơi vốn đã làm.** Bạn không bấm để thắng; bạn bấm để **nói ra điều bạn tin**, rồi bạn ra quầy và làm theo nó. Cái tick xuất hiện **sau**, trong lúc bạn không nhìn.

**Tick xuất hiện ở đâu, dưới hình thức gì:** tối hôm đó, trên chính trang sổ, **bằng nét bút của cô Ba** (mực đỏ, khác màu mực xanh của người chơi) — một dấu ✓ nhỏ ở lề và **một câu, không phải một con số**:

> **Cô Ba** *(mực đỏ, lề trái):* ✓ *"Ừa. Chú Tư không ăn cay thì chú ăn gì."*
> **Cô Ba:** ✓ *"Con ghi trúng rồi đó. Bà Bảy hồi nào tới giờ không đụng tới ớt."*
> **Cô Ba:** ✓ *"Giỏi. Cổ đi làm sớm mà, ngày nào cũng vậy."*

**Giả thuyết sai thì sao? — KHÔNG CÓ GÌ HẾT.** Không dấu ✗, không mực đỏ, không câu nào. Dòng đó nằm im, chưa có tick. Người chơi tự đổi khi họ tự thấy sai. Đây là yêu cầu của Linh: **không có kênh nào trong game nói với bạn rằng bạn sai.** Việc chấm sai đã là việc của khách rồi (T1); cuốn sổ thì không.

#### "Cảnh nhỏ" là gì

Đoán đúng **3 điều** về một người → 1–2 ngày sau, trong một lõm khách, **một cảnh 60–90 giây**:

- **Không có gameplay.** Người chơi không làm gì, không chọn gì (T2 — không có dialogue tree).
- **Không thưởng tiền, không thưởng nguyên liệu, không unlock công thức.** Nếu nó cho vật phẩm thì nó thành một cái quest, và Minh sẽ tối ưu nó thay vì thưởng thức nó.
- **Nội dung: NPC kể một điều về chính họ mà KHÔNG CÓ CÁCH NÀO khác để biết.** Đây là toàn bộ phần thưởng, và nó đắt giá đúng bằng mức người chơi đã quan tâm.
- **Hệ quả cơ học duy nhất:** mở một `CORE` slot ứng viên (P2-03 §2.3) + thêm 2–4 dòng vào pool thoại của NPC đó cho phần còn lại mùa. NPC **nói khác đi** từ hôm đó. Người chơi nhận ra ngay, mà không ai thông báo gì.

**Mười hai cảnh, mỗi NPC một cảnh** — nội dung tóm tắt (thoại đầy đủ thuộc P4):

| NPC | Cảnh nhỏ | Điều không thể biết bằng cách khác |
|---|---|---|
| **Bà Bảy** | Bà hát một câu cải lương lúc vắng khách, rồi ngượng | Bà mê cải lương. Và bà có một chuyện 15 năm với cô Ba mà bà **gần nói ra rồi thôi** |
| **Chú Tư** | Chú lấy điện thoại khoe hình con gái đang học đại học | Chú làm bảo vệ ca sáng để chiều chạy thêm |
| **Anh Dũng** | Anh kể hồi còn chạy xe ôm truyền thống, đứng đầu hẻm 8 năm | Vì sao anh luôn vội |
| **Chị Lan** | Chị đứng lại thêm 40 giây. Nói đúng hai câu. Rồi đi | Chị nhớ tên bạn từ ngày thứ tư. Chị chưa bao giờ gọi ra |
| **Bé Su** | Bé cho xem clip bé quay gánh tàu hũ bà Sáu, 40 nghìn view | Bé quay không phải để nổi tiếng |
| **Ông Hải** | Buổi sáng. Ông tỉnh táo, hỏi thăm bạn rất tử tế | **Ông trước 10 giờ là một người khác.** Và ông biết điều đó |
| **Cô Mai** | Cô mở cuốn sổ nợ cho bạn xem, chỉ vài cái tên đã gạch | Cô làm ăn được vì cô nhớ người, không phải vì cô tính kỹ |
| **Thầy Phúc** | Thầy nói thầy đã đứng đây quan sát bạn từ ngày đầu | Thầy đang **dạy** bạn. Thầy vẫn dạy, chỉ là không có lớp |
| **Chị Hạnh** | Chị hỏi bạn cách gọi món cho "đúng giọng trong này" | Chị đã tập nói lại từ đầu, một mình |
| **Anh Bảo** | Điện thoại hết pin. Anh ngẩng lên, nhìn bạn làm bánh, hết cả ổ | Anh không vô tâm. Anh chỉ chưa từng ngẩng lên |
| **Bà Sáu** | Bà kể gánh tàu hũ này là của má bà | Vì sao bà không bao giờ nói xấu ai |
| **Chú Kiệt** | Chú qua mượn cái kẹp gắp. Đứng lại. Nói một câu về nghề | **Chú là người duy nhất hiểu công việc của bạn** |

> Cảnh của chú Kiệt là cảnh quan trọng nhất trong 12: nó biến đối thủ thành đồng nghiệp mà không xoá đi việc chú vẫn gian dối vệ sinh (CANON §7.5). Hai điều đó cùng đúng, và đó là chỗ game người lớn hơn thể loại của nó.

### 2.4. Trang cuối ngày của cô Ba

**Phanh #2 trong bốn phanh của phán quyết XĐ3.** Chữ viết tay của cô Ba, **2–3 dòng**, **không phán đúng sai**.

```ts
type EveningNote = {
  day: number
  lines: string[]            // 2–3 dòng
  confirmations: { npcId: NpcId; slot: HypothesisSlot }[]   // tick mực đỏ ở lề
  tone: 'BINH_THUONG' | 'AM' | 'LO' | 'BAO_TRUOC' | 'MUA' | 'KET'
}

function composeEveningNote(day: number, w: World): EveningNote {
  const cands = NOTE_RULES
    .filter(r => r.when(day, w))
    .sort((a, b) => b.priority - a.priority)          // rule DB chấm theo độ cụ thể, CANON §11
  const picked = takeDistinct(cands, 2, 3)            // 2–3 dòng, không trùng concept
  return { day, lines: picked.map(r => shuffleBag(r.variants).next()), ... }
}
```

**Ba luật viết, không thương lượng:**

1. **Không phán đúng sai.** Không có *"hôm nay con làm tốt"*, không có *"con để rớt bánh hai lần rồi đó"*. Cô Ba **thuật lại và cảm thán**, không chấm điểm. Chấm điểm là việc của khách (T1). Nếu một dòng nào nghe ra như một bảng đánh giá, cắt dòng đó.
2. **Không giải thích cơ chế.** Không bao giờ *"bà Sáu đã kể cho cô Mai"*. Cô Ba là một người, không phải một tooltip.
3. **Giọng miền Nam, ngắn, đôi lúc lảng sang chuyện khác.** Cô già rồi, cô viết cho cô chứ không viết cho bạn.

#### Mười sáu câu mẫu theo tình huống

| # | Tình huống | Câu của cô Ba |
|---|---|---|
| 1 | **Ngày thường, không gì đặc biệt** | *"Bữa nay bán được. Trời cũng không nắng lắm. Nhớ đậy nắp thùng đồ chua."* |
| 2 | **Ngày tốt, nhiều khách quen** | *"Bữa nay thấy mấy đứa nhỏ ghé đông. Hồi cô còn bán, cũng cỡ vầy là vui rồi."* |
| 3 | **Một khách không ăn hết** (phanh #2, câu gốc của XĐ3) | *"Hôm nay thằng nhỏ áo xanh không ăn hết. Chắc nó có chuyện."* |
| 4 | **Khách quen vắng 2–3 ngày** | *"Mấy bữa rồi không thấy cô Lan. Chắc cổ bận."* |
| 5 | **Khách quen vắng ≥5 ngày** (Ngọc Ánh) | *"Lâu quá rồi không thấy cổ ghé. Con có thấy cổ đi ngang không?"* |
| 6 | **Sau một ngày nhiều lỗi** — không trách | *"Bữa nay tay con hơi run. Hồi cô mới bán cô còn làm rớt cả khay."* |
| 7 | **Sau `DROPPED_FOOD`** (CANON §7.4 — cô buồn chứ không la) | *"Ổ bánh đó con để cô ăn. Đừng có bỏ, uổng."* |
| 8 | **Ngày mưa** | *"Mưa cả buổi. Ít khách mà cũng đỡ mệt. Con có ướt không đó."* |
| 9 | **Có khách mới lần đầu** | *"Bữa nay có người lạ ghé. Không biết người ta chỉ đường sao mà tới được."* |
| 10 | **Sau khi nghe lỏm tin đồn xấu** (gợi, không giảng) | *"Bữa nay cô Mai hỏi chuyện gì đó. Chắc có người nói ra nói vô. Kệ đi con."* |
| 11 | **Sau khi chuộc lỗi thành công** (`HEALED_*`) | *"Thấy bà Bảy cười với con. Vậy là xong chuyện rồi đó."* |
| 12 | **Hết hàng sớm** | *"Hết sớm cũng mừng mà cũng tiếc. Mấy người tới trễ về không, kỳ lắm."* |
| 13 | **Ế, còn nhiều hàng** | *"Còn dư nhiều quá. Mai con để cô mang qua cho mấy đứa nhỏ bên kia."* |
| 14 | **BÁO TRƯỚC — ngày 26–29, chú Tư** | *"Chú Tư nói công ty chú dời. Cô nghe vậy thôi chớ cũng không dám hỏi kỹ."* |
| 15 | **BÁO TRƯỚC — ngày cuối cùng còn thấy** | *"Bữa nay chú Tư mua có nửa ổ. Chú nói chú ăn sáng ở bển rồi."* |
| 16 | **Ngày 40 — kết mùa** (CANON §15 nguyên tắc kết game) | *"Bốn chục ngày rồi đó con. Cô không nhớ bán được bao nhiêu. Cô chỉ nhớ ai còn ghé."* |

Thêm sáu biến thể thời tiết/mùa vụ để shuffle-bag không lộ (CANON §11: 8 biến thể ≈ cảm giác của 25–30 dòng random):

| # | Tình huống | Câu |
|---|---|---|
| 17 | Ngày nắng gắt | *"Nắng chang chang. Nhớ để nước cho bà Sáu với, gánh nặng lắm."* |
| 18 | Hôm có người đứng bán hộ | *"Nghe nói lúc con đi lấy hàng có người đứng bán giùm. Ở đây vậy đó con."* |
| 19 | Sau khi mua thiết bị mới | *"Cái tủ mới nhìn cũng được. Hồi xưa cô toàn lấy thùng xốp không hà."* |
| 20 | Sau một `REMEMBERED_USUAL` đầu tiên với ai đó | *"Có người khen con nhớ đồ người ta hay ăn. Cô nghe cô cũng nở mũi."* |
| 21 | Hôm bà Bảy ghé (cô Ba né chuyện cũ) | *"Bà Bảy có ghé hả. ...Thôi. Con nhớ đừng bỏ ớt cho bả."* |
| 22 | Hôm chú Kiệt bán đắt hơn | *"Bên kia bữa nay đông. Cũng mừng cho người ta. Nghề này ai cũng cực."* |

> Câu 21 là cả một arc nén vào hai câu: cô Ba **nói nửa chừng rồi thôi**, rồi lảng sang chuyện ớt. Không bao giờ giải thích bất hoà 15 năm (CANON §9). Người chơi để ý sẽ thấy cô làm vậy **mỗi lần** bà Bảy ghé.

#### Kênh báo trước 3–4 ngày

Phanh #1 của XĐ3 (*"báo trước 3–4 ngày"*) chạy qua **ba lớp song song**, và sổ tay là lớp **thứ ba — lớp lưới an toàn**:

| Lớp | Kênh | Ai bắt được |
|---|---|---|
| 1 | **NPC tự nói ra** (P2-03 §2.9 `announce`) | Người chơi chú tâm, chơi liền mạch |
| 2 | **Hành vi đổi**: mua ít đi, tới giờ khác, prop hình ảnh | Người chơi quan sát kỹ (Sarah, Minh) |
| 3 | **Sổ tay cô Ba** — câu #14, #15 | **Ngọc Ánh và Linh.** Người chơi ngắt quãng, người không giữ được chuỗi suy luận qua nhiều buổi |

**Luật kích hoạt lớp 3:**

```ts
const FAREWELL_WINDOW = 4      // ngày

function needsFarewellHint(npc: Npc, day: number): boolean {
  const exit = npc.schedule.overrides.find(o => o.effect.includes('SKIP'))
  if (!exit) return false
  return exit.fromDay - day <= FAREWELL_WINDOW && exit.fromDay - day >= 1
}
```

Dòng báo trước được ghim **priority cao nhất** trong `NOTE_RULES`, nên nó **luôn** chiếm một trong 2–3 dòng của tối đó. Xuất hiện **≥3 tối liên tiếp** trước khi NPC biến mất — vì Ngọc Ánh có thể bỏ lỡ hai tối.

> **Đây là dòng phân chia giữa bi kịch và trò đểu** (idea.md XĐ3): người chơi phải có cơ hội nói *"mình đã có thể đoán ra"*, chứ không phải *"game vừa cướp của mình"*. Ba lớp là để **không ai** trượt cả ba.

**Và công tắc** (CANON §15, công tắc #3): *"họ để lại một lời nhắn"*. Bật lên → NPC biến mất để lại một mảnh giấy, và nó xuất hiện **trong sổ tay**, ở cột trái, một lần duy nhất:

> *(giấy xé từ cuốn tập, chữ nghiêng nghiêng)*
> *"Chú dời qua bên kia làm rồi con. Chín tháng ăn bánh mì của con, chú nhớ. Chú Tư."*

### 2.5. Thước đo tiến trình không có con số

idea.md §19.2: người trong hẻm **định vị nhà bằng hàng quán**, không bằng số nhà — *"nhà tôi gần chỗ bán tàu hũ"*. Khi xe bánh mì đủ nổi tiếng, NPC bắt đầu nói **"nhà tui gần xe bánh mì cô Ba"**.

> *"Không cần một con số nào, không cần một thanh progress nào."*

**Năm mốc.** Mỗi mốc chỉ xuất hiện **qua thoại và qua sổ tay**, không bao giờ qua thông báo.

| Mốc | Điều kiện (không hiện ra) | Người chơi nghe thấy gì | Dòng trong sổ |
|---|---|---|---|
| **0** — mặc định | Ngày 1 | **Bà Sáu** là mốc của hẻm: *"Nhà tui gần chỗ bán tàu hũ đó."* | — |
| **1** — có mặt | ≥3 NPC có belief tốt sống + ≥1 đạt `declarations` 2 | *"Gần cái chỗ có xe bánh mì đó."* — **chưa có tên** | *"Nghe người ta chỉ đường có nhắc tới cái xe. Ngộ ghê."* |
| **2** — có tên | ≥2 NPC có belief tốt `hardened` (`declarations` ≥3) | *"Nhà tui gần **xe bánh mì cô Ba**."* | *"Bữa nay có người kêu đúng tên cái xe. Cô nghe cũng lạ."* |
| **3** — hút khách lạ | Mốc 2 + ≥1 belief tốt tới hop 2 | Khách lạ ghé: *"Người ta chỉ tui qua đây. Cho một ổ đầy đủ."* | *"Có người lạ tới. Nói là nghe ai đó chỉ."* |
| **4** — **nhường mốc** | Mốc 3 + bà Sáu ở bucket `Friend` | **Chính bà Sáu** nói với người khác: *"Nhà tui hả? Gần xe bánh mì cô Ba đó."* | *"Bà Sáu chỉ đường cho người ta bằng cái xe của mình. Cô nghe cô muốn khóc."* |

**Mốc 4 là đỉnh cảm xúc của cả hệ thống tiến trình**, và nó không tốn gì ngoài bốn câu thoại: **người vốn LÀ cái mốc của hẻm giờ dùng bạn làm mốc.** Không có thanh progress nào nói được điều đó.

```ts
function landmarkTier(w: World): 0|1|2|3|4 {
  const good = allBeliefs(w).filter(b => b.valence > 0 && !b.dormant)
  const hardened = good.filter(b => b.declarations >= 3)
  const holders = new Set(hardened.map(b => b.holder))
  if (holders.size >= 2 && w.strangerVisits >= 1 && bucketOf(w, 'ba_sau') === 'Friend') return 4
  if (holders.size >= 2 && w.strangerVisits >= 1) return 3
  if (holders.size >= 2) return 2
  if (good.length >= 3 && good.some(b => b.declarations >= 2)) return 1
  return 0
}
```

**Mốc có thể TỤT.** Nếu belief tốt chết hết (người chơi bỏ bê hoặc làm ẩu cả tuần), `landmarkTier` giảm và cách chỉ đường quay về mốc cũ. Không có thông báo. Một hôm người chơi nhận ra không ai nhắc tên cái xe nữa. **Đó là thanh progress tàn nhẫn nhất và êm nhất có thể viết ra**, và nó không có một pixel UI nào.

### 2.6. Dòng "lâu rồi không thấy ghé"

Nhu cầu riêng của Ngọc Ánh, và là thứ làm XĐ3 tồn tại được với người chơi ngắt quãng.

```ts
function absenceNote(npc: Npc, day: number): RawNote | null {
  if (!wasExpectedRecently(npc, day)) return null      // P2-03: đếm lần ghé BỊ LỠ
  const missed = npc.missStreak
  if (missed < 2) return null
  return { t: 'ABSENT_STREAK', missed }
}
```

Hiển thị **ở cột trái**, trong một khối riêng dưới cùng trang, với **mặt NPC** chứ không chỉ tên:

```
╔══════════════════════════════════════╗
║  LÂU RỒI KHÔNG THẤY                  ║
║                                      ║
║  [mặt]  Chị Lan     — 5 bữa          ║
║  [mặt]  Ông Hải     — 3 bữa          ║
╚══════════════════════════════════════╝
```

- **Chỉ đếm số bữa, không diễn giải.** Không *"chị Lan có vẻ giận bạn"*. Máy không biết điều đó, và ngay cả nếu biết, nói ra là vi phạm §2.2 và T3.
- **Có mặt NPC**, vì Ngọc Ánh *"không nhớ nổi mặt khách gặp 5 ngày trước"* — tên không đủ.
- **Xoá khỏi khối** khi họ quay lại, hoặc khi họ đã biến mất hẳn (`SKIP` vĩnh viễn) — trường hợp sau, dòng cuối cùng chuyển sang mực đỏ của cô Ba một lần rồi thôi: *"Chắc chú không ghé nữa đâu con."*

---

## 3. Dữ liệu & schema

```ts
type Notebook = {
  log: LogEntry[]                       // cột trái, chỉ đọc, append-only
  pages: Record<NpcId, NpcPage>         // cột phải
  eveningNotes: EveningNote[]
  landmarkTier: 0|1|2|3|4
  settings: { enabled: boolean }        // CANON §15 công tắc #4
}

type NpcPage = {
  npcId: NpcId
  freeLines: string[]                   // người chơi viết, tự do, tiếng Việt có dấu
  hypotheses: Hypothesis[]              // tối đa 5 OPEN
  vignetteUnlocked: boolean
  firstSeenDay: number
  pinned: boolean                       // ghim lên đầu danh sách
}

type NoteRule = {
  id: string
  priority: number                      // = số điều kiện, CANON §11 chấm theo độ cụ thể
  concept: 'ABSENCE'|'FAREWELL'|'WEATHER'|'HYGIENE'|'GOSSIP'|'HEAL'|'SALES'|'SEASON'
  when: (day: number, w: World) => boolean
  variants: string[]                    // shuffle-bag, ≥3 biến thể mỗi rule
  speakonce?: boolean
}
```

**`content/lines/so-tay.json`** (trích):

```json
{
  "note_farewell_warn": {
    "priority": 9, "concept": "FAREWELL", "speakonce": false,
    "when": "npcNeedsFarewellHint",
    "variants": [
      "Chú Tư nói công ty chú dời. Cô nghe vậy thôi chớ cũng không dám hỏi kỹ.",
      "Nghe chú Tư than đường xa. Chắc bên đó xa thiệt.",
      "Bữa nay chú Tư mua có nửa ổ. Chú nói chú ăn sáng ở bển rồi."
    ]
  },
  "note_absence_long": {
    "priority": 7, "concept": "ABSENCE",
    "when": "anyNpcMissedGE5",
    "variants": [
      "Lâu quá rồi không thấy cổ ghé. Con có thấy cổ đi ngang không?",
      "Mấy bữa rồi vắng cổ. Cô cũng không biết nữa."
    ]
  },
  "note_dropped_food": {
    "priority": 8, "concept": "HYGIENE",
    "when": "droppedFoodToday",
    "variants": [
      "Ổ bánh đó con để cô ăn. Đừng có bỏ, uổng.",
      "Bữa nay tay con hơi run. Hồi cô mới bán cô còn làm rớt cả khay."
    ]
  },
  "note_landmark_2": {
    "priority": 6, "concept": "SEASON", "speakonce": true,
    "when": "landmarkTierReached2",
    "variants": ["Bữa nay có người kêu đúng tên cái xe. Cô nghe cũng lạ."]
  },
  "note_ba_bay_deflect": {
    "priority": 5, "concept": "SEASON",
    "when": "baBayVisitedToday",
    "variants": [
      "Bà Bảy có ghé hả. ...Thôi. Con nhớ đừng bỏ ớt cho bả.",
      "Bà Bảy khoẻ hông con. ...Ừa. Thôi con ngủ sớm đi."
    ]
  },
  "note_day40": {
    "priority": 10, "concept": "SEASON", "speakonce": true,
    "when": "isDay40",
    "variants": ["Bốn chục ngày rồi đó con. Cô không nhớ bán được bao nhiêu. Cô chỉ nhớ ai còn ghé."]
  }
}
```

**Một `NpcPage` thật** (chú Tư, ngày 27):

```json
{
  "npcId": "chu_tu",
  "firstSeenDay": 1,
  "pinned": true,
  "freeLines": [
    "T2 tới T6, luôn 6h45. cuối tuần không thấy.",
    "thích cay. ăn lẹ rồi đi liền.",
    "mấy bữa nay nói chuyện công ty dời chỗ ???",
    "hôm qua mua có nửa ổ"
  ],
  "hypotheses": [
    { "slot": "HAY_AN",          "value": "nhieu_ot",   "dayGuessed": 6,  "state": "CONFIRMED", "dayConfirmed": 8 },
    { "slot": "THUONG_GHE",      "value": "630_700",    "dayGuessed": 7,  "state": "CONFIRMED", "dayConfirmed": 9 },
    { "slot": "NGAY_TRONG_TUAN", "value": "t2_t6",      "dayGuessed": 9,  "state": "CONFIRMED", "dayConfirmed": 13 },
    { "slot": "LAM_NGHE",        "value": "bao_ve",     "dayGuessed": 14, "state": "OPEN" }
  ],
  "vignetteUnlocked": true
}
```

Đọc trang này: người chơi đã đoán đúng 3 điều (ngày 8, 9, 13) → cảnh nhỏ đã mở. Giả thuyết `LAM_NGHE` đoán từ ngày 14 vẫn `OPEN` — **có thể đúng, có thể sai, game không nói**. Và dòng viết tay thứ ba, *"nói chuyện công ty dời chỗ ???"*, là bằng chứng người chơi đã bắt được tín hiệu báo trước. Ba dấu hỏi đó là do họ gõ.

---

## 4. UI/UX hai thiết bị

### 4.1. Khi nào sổ tay mở ra

| Lối vào | PC | Mobile |
|---|---|---|
| **Tự mở cuối ngày** (`EveningScene`) | Luôn — trừ khi tắt công tắc | Luôn |
| Mở giữa ngày | Phím `Tab` · **pause hoàn toàn** (CANON §15.2) | Nút góc dưới phải, **≥44pt**, pause hoàn toàn |
| Trang một NPC | Bấm vào mặt họ trong hàng chờ | Chạm mặt họ |

**Mở sổ giữa ngày pause game, kể cả kiên nhẫn của khách.** Đây là ràng buộc trợ năng cứng của CANON §15.2, và nó cũng loại bỏ mọi cám dỗ biến việc tra sổ thành một thử thách thao tác.

### 4.2. PC — trang đôi (§2.2)

- Cuộn dọc độc lập hai cột.
- Cột phải: click để sửa tại chỗ; `Enter` xuống dòng, không tự chạy tiếp (CANON §15.1).
- Ô "Cô đoán": mỗi slot là một dropdown; **mở ra là danh sách đã quan sát**.
- Lọc nhật ký: theo NPC · theo ngày · theo `RawNote.t`. **Xuất CSV** — cho Minh, và vì anh ấy sẽ tự làm nếu ta không làm.
- Chuyển NPC: `←` `→`, hoặc dải mặt nhỏ ở mép dưới.

### 4.3. Mobile (v2) — hai tab, không chia đôi

Màn hình dọc không đủ cho hai cột. **Tab**, không phải chia đôi:

```
┌──────────────────────────────┐
│  ‹  CHÚ TƯ              ⋯   │
├──────────────────────────────┤
│ ╭─────────╮ ╭──────────────╮ │
│ │ SỔ GHI  │ │  CON GHI     │ │   ← 2 tab, mỗi tab ≥44pt cao
│ ╰─────────╯ ╰──────────────╯ │
├──────────────────────────────┤
│  6h47   "cho chú ổ đầy đủ,   │
│         nhiều ớt"            │
│         lần thứ 9            │
│                              │
│  ────────────────────────    │
│  6h45   lần thứ 8            │
│  ...                         │
├──────────────────────────────┤
│        [ + ghi thêm ]        │   ← ≥44pt
└──────────────────────────────┘
```

| Ràng buộc | Cách làm |
|---|---|
| **Vùng chạm ≥44pt** | Mọi tab, mọi dropdown, mọi nút. Khoảng cách giữa hai vùng chạm **≥8pt** |
| **Gõ tiếng Việt có dấu** | Ô nhập luôn ở **nửa trên** màn hình để bàn phím không che. Có **gợi ý từ** lấy từ nhật ký thô (chạm là chèn) → giảm gõ |
| **Cỡ chữ 4 mức** (CANON §15.1) | Hộp **tự giãn** ở 200%. Hai tab xuống thành hai dòng nếu cần. **Không cắt chữ** |
| **Font** | Sans, **line-height rộng** — tiếng Việt chồng dấu (ề, ộ, ỡ, ữ). Chữ viết tay của cô Ba dùng font viết tay **đã kiểm dấu đầy đủ**; nếu font thiếu dấu → **dùng sans**, không bao giờ để rụng dấu |
| **Không viết hoa toàn bộ** (CANON §15) | Tiêu đề dùng chữ thường + đậm |
| **Chơi một tay** | Tab và nút chính nằm ở **nửa dưới**; nội dung đọc ở nửa trên |

### 4.4. Công tắc tắt sổ tay

CANON §15, công tắc **#4** trong 6 công tắc bắt buộc.

| | Tắt |
|---|---|
| Trang cuối ngày của cô Ba | ❌ Không tự mở nữa |
| Nhật ký thô | ✅ **Vẫn ghi, vẫn mở được bằng tay** |
| Hệ giả thuyết | ✅ Vẫn chạy. Cảnh nhỏ vẫn mở (diễn ra ở quầy, không trong sổ) |
| Dòng "lâu rồi không thấy ghé" | ❌ Ẩn |
| Báo trước NPC biến mất | ✅ **Vẫn còn qua lớp 1 và 2** (NPC tự nói + hành vi đổi) |

**Một ngoại lệ, đã chốt ở `P2-02 §4.6`:** dòng báo trước của arc chị Lan (*"Chị Lan — hôm nay chị không lấy ly nước."*) **luôn được ghi**, kể cả khi tắt công tắc. Nó không xuất hiện ở trang cuối ngày (trang đó đã tắt) mà rơi xuống **cột trái**, dưới dạng `RawNote` kiểu `SAID_SOMETHING` — tức là **dữ liệu thô về một hành vi quan sát được**, không phải lời bình của cô Ba. Đúng ranh giới §2.2, và không mất kênh báo trước.

**Tắt sổ tay không được phép làm mất kênh báo trước.** Đó là lý do phanh #1 của XĐ3 có **ba lớp** chứ không một. Người tắt sổ vẫn nghe chú Tư than chuyện công ty, vẫn thấy chú mua ít đi. Họ chỉ không có lưới an toàn — và đó là lựa chọn của họ, được tôn trọng.

---

## 5. Tham số cần tune

| Tên | Khởi điểm | Khoảng | Cách đo |
|---|---|---|---|
| Số dòng trang cuối ngày | **2–3** | 2–4 | Thời gian đọc ở cỡ chữ 200%: **≤12 giây** |
| Số `NOTE_RULES` | ~28 rule × 3 biến thể ≈ **84 dòng** | 70–110 | Không lặp một câu trong **7 ngày liên tiếp** |
| `FAREWELL_WINDOW` | **4** ngày | 3–5 | XĐ3 phanh #1. ≥**7/10** nói *"mình đã có thể đoán ra"* |
| Số tối liên tiếp có dòng báo trước | **≥3** | 3–4 | Ngọc Ánh bỏ lỡ 2 tối vẫn bắt được |
| Ngưỡng `ABSENT_STREAK` hiện | **2** bữa lỡ | 2–3 | Không hiện với người vốn ghé thưa |
| Ngưỡng mực đỏ "chắc không ghé nữa" | 3 ngày sau `SKIP` | 2–5 | Chỉ 1 lần/NPC cả mùa |
| Số giả thuyết OPEN / NPC | **5** | 3–7 | Không ai quét hết danh sách: **0%** |
| Giả thuyết cần để mở cảnh nhỏ | **3** | 3–4 | Số NPC mở được cảnh tới ngày 40 — mục tiêu **4–7/12** |
| Đổi giá trị một slot | 1 lần/ngày | 1–2 | Chống brute-force |
| Độ trễ cảnh nhỏ sau khi đủ 3 | **1–2 ngày** | 1–3 | Không để nó đọc ra như phần thưởng tức thì của một nút bấm |
| Độ dài cảnh nhỏ | **60–90s** | 45–120 | Bỏ qua được sau 3s giữ; tỉ lệ bỏ qua — mục tiêu **<15%** |
| Mốc `landmarkTier` 2 | 2 belief tốt `hardened` | 2–3 | Đạt vào khoảng **ngày 16–24** với người chơi trung bình |
| Mốc `landmarkTier` 4 | + bà Sáu `Friend` | — | Đạt bởi **30–50%** người chơi. **Không được phổ biến** |
| Dòng nhật ký / ngày | ~12–20 | — | Cuộn hết một ngày **≤3 lần vuốt** trên mobile |

---

## 6. Tiêu chí đạt

**Ranh giới phân chia lao động (test tự động):**

- [ ] `LogEntry` có **đúng 6 trường**. Thêm trường thứ 7 → build fail (khoá bằng type test).
- [ ] Quét toàn bộ `content/lines/so-tay.json` + mọi chuỗi render cột trái: **0** kết quả cho regex `[+-]?\d+\s*(trust|điểm|point|thân|★|♥)`.
- [ ] Cột trái **0** câu chứa động từ suy luận (`có vẻ`, `chắc là`, `thích`, `ghét`) — danh sách cấm kiểm tự động.
- [ ] Cột trái **0** dự báo (`mai`, `sắp`, `cần bao nhiêu`).
- [ ] Không có API nào cho phép game ghi vào `NpcPage.freeLines`.
- [ ] Không có API nào cho phép người chơi ghi vào `Notebook.log`.

**Hệ giả thuyết:**

- [ ] `Hypothesis.state` không bao giờ nhận giá trị `'WRONG'` (kiểu không tồn tại).
- [ ] Không có asset/chuỗi nào chứa ✗, "sai", "không đúng" trong ngữ cảnh giả thuyết.
- [ ] Danh sách lựa chọn của một slot ⊆ những gì đã xuất hiện trong `log`. Test: ngày 3, `HAY_AN` của một NPC chưa gặp → danh sách **rỗng**.
- [ ] Không xác nhận được giả thuyết nào **nếu không có `wasDemonstratedToday`** — 500 mùa, 0 vi phạm.
- [ ] Mở cảnh nhỏ cần **đúng 3** `CONFIRMED`; không cách nào mở bằng 2.
- [ ] Cảnh nhỏ **không** trao tiền / nguyên liệu / công thức (diff `ledger` và `inventory` trước-sau = 0).

**Trang cuối ngày:**

- [ ] **0** câu phán xét: quét danh sách cấm `làm tốt / làm dở / con sai / con giỏi / điểm`.
- [ ] **0** câu giải thích cơ chế: quét `vì / do / tại vì` + tên NPC khác trong cùng câu.
- [ ] Mọi `NoteRule` có **≥3 biến thể** (trừ `speakonce`).
- [ ] Không câu nào lặp trong 7 ngày liên tiếp (chạy 200 mùa).
- [ ] Dòng báo trước xuất hiện **≥3 tối liên tiếp** trước mọi `SKIP` vĩnh viễn — 100% số mùa.
- [ ] Tắt công tắc sổ tay → dòng báo trước lớp 1 và 2 **vẫn còn**.

**Trợ năng:**

- [ ] Mọi vùng chạm mobile **≥44pt**, khoảng cách **≥8pt**.
- [ ] Cỡ chữ 200%: **0 chữ bị cắt**, **0 dấu bị cắt cụt**, hộp tự giãn.
- [ ] Mở sổ giữa ngày → kiên nhẫn khách **đóng băng hoàn toàn**.
- [ ] Giảm chuyển động: lật trang không trượt, chỉ hiện.
- [ ] Font viết tay của cô Ba render đủ **ề ộ ỡ ữ ẳ ẵ** ở cả 4 mức cỡ chữ. Thiếu một dấu → **fallback sans**.

**Người chơi (10 người lạ, đo ở ngày 10 và ngày 30):**

- [ ] ≥**8/10** mở sổ tay ít nhất 1 lần **mà không được hướng dẫn**.
- [ ] ≥**6/10** viết ít nhất 1 dòng ở cột phải trước ngày 10.
- [ ] ≥**7/10** đặt ít nhất 1 giả thuyết trước ngày 10.
- [ ] ≥**7/10** phát biểu được một luật lịch đúng khi bị hỏi (*"chú Tư cuối tuần không ra"*) — **tiêu chí trung tâm của HT2**: nó chứng minh họ đã **nhận ra hệ thống tồn tại**.
- [ ] ≥**7/10** nói *"mình đã có thể đoán ra"* sau khi chú Tư biến mất (XĐ3).
- [ ] **0/10** mô tả sổ tay bằng chữ "phải chép", "bài tập", "busywork".
- [ ] ≥**5/10** nhắc lại được **một câu** của cô Ba từ trí nhớ. ← phép đo tốt nhất cho biết giọng văn đã đúng chưa.
- [ ] Nhóm chơi ngắt quãng (≤10 phút/lần, mô phỏng Ngọc Ánh): ≥**6/10** nhận ra có người đã vắng mặt lâu.

---

## 7. Rủi ro & cách bịt

| # | Rủi ro | Mức | Cách bịt |
|---|---|---|---|
| R1 | **Hội chứng Oblivion** — người chơi không nhận ra hệ NPC tồn tại | **Cao nhất** | Cả doc này. Phép đo quyết định: tiêu chí "≥7/10 phát biểu được một luật lịch". Fail → **sửa sổ, đừng sửa sim** |
| R2 | **Sổ thành busywork** (Minh bỏ sang Excel) | Cao | §2.2 ranh giới tuyệt đối + xuất CSV. Nếu thấy ai đó chép tay dữ liệu thô → ta đã sai ở cột trái |
| R3 | **Sổ thành bảng tra**, giết hết việc suy luận | Cao | 4 điều cấm ở §2.2. Không bao giờ có nút "tính giùm" (CANON §13.2) |
| R4 | **Hệ giả thuyết làm rò chỉ số** (T3) | **Cao** | Không tick lúc bấm; xác nhận **diegetic**, mực đỏ + một câu; **không có trạng thái sai** |
| R5 | Brute-force giả thuyết | Trung | 3 luật §2.3: danh sách chỉ chứa thứ đã quan sát · tối đa 5 OPEN · 1 lần đổi/ngày · **cộng `wasDemonstratedToday`** — luật cuối là luật thật sự chặn |
| R6 | **Cô Ba thành tooltip** — bắt đầu giải thích cơ chế | Cao | 3 luật viết §2.4 + test quét câu giải thích. Cô Ba **gợi**, không giảng |
| R7 | Cô Ba thành người chấm điểm → phá T1 | Cao | Test quét danh sách cấm. CANON §7.4: **cô buồn chứ không la** |
| R8 | Tắt sổ tay làm mất kênh báo trước XĐ3 | **Cao** | Ba lớp §2.4; lớp 1 và 2 không đi qua sổ. Có test riêng |
| R9 | Ngọc Ánh vẫn bỏ lỡ vì chơi quá ngắt quãng | Trung | Dòng báo trước **≥3 tối liên tiếp** + khối "lâu rồi không thấy" có **mặt** NPC + công tắc "họ để lại lời nhắn" |
| R10 | Cảnh nhỏ bị tối ưu thành quest | Trung | Không thưởng vật chất; trễ 1–2 ngày; có 12 cảnh nên không thể "farm". Test diff `ledger` |
| R11 | Chữ viết tay rụng dấu tiếng Việt | **Cao** (lằn ranh đỏ về ngôn ngữ) | Kiểm font tự động cho **toàn bộ** bảng dấu; thiếu → fallback sans. *"Đủ dấu"* là điều kiện không thương lượng (idea.md §19.5) |
| R12 | Sổ phình trên mobile (40 ngày × 20 dòng = 800 dòng) | Thấp | Cuộn ảo + gộp theo ngày + lọc. Trang NPC chỉ tải dòng của NPC đó |
| R13 | Mốc `landmarkTier` tụt mà người chơi đọc ra là bug | Trung | Không bao giờ thông báo mốc lên; **cũng không thông báo mốc xuống**. Đối xứng thì không ai gọi là bug. Sổ ghi một câu cảm thán khi lên, im lặng khi xuống |

---

## 8. Truy vết

| Nội dung | `idea.md` | `CANON.md` |
|---|---|---|
| HT2 — mặt phẳng để nhận ra hệ thống, 3 persona | §16 HT2 (dòng 664–671) | §15 (công tắc #4) |
| Bài học Oblivion / Radiant AI (Bruce Nesmith) | §16 HT2 + §18.6 | §16 Đừng-1 |
| Bombers' Notebook (Majora's Mask) | §16 HT2 (dòng 671) | — |
| Minh: game log thô, người chơi viết diễn giải | §16 HT2 (dòng 667) | — |
| Ngọc Ánh: *"lâu rồi không thấy ghé"* | §16 HT2 (dòng 666) | — |
| Linh: dấu chấm hết cho ngày | §16 HT2 (dòng 668) | §15 |
| Hệ giả thuyết — đoán đúng 3 → mở cảnh nhỏ | §22 mục 3 (dòng 1049) | — |
| Sổ do **người chơi tự ghi**, không hiện chỉ số | §9.7 bảng bẫy 2 (dòng 413) | §1 T3 |
| XĐ3 — 4 phanh, sổ tay là phanh #2 | §17 XĐ3 (dòng 750–766) | §9, §15 |
| Câu gốc *"thằng nhỏ áo xanh không ăn hết"* | §17 XĐ3 phanh 2 | — |
| Báo trước 3–4 ngày (phanh #1) | §17 XĐ3 phanh 1 | §9 (chú Tư ~ngày 30) |
| Công tắc "họ để lại lời nhắn" (phanh #3) | §17 XĐ3 phanh 3 | §15 |
| Thước đo tiến trình: *"nhà tui gần xe bánh mì cô Ba"* | §19.2 (dòng 953) | §9 (bà Sáu) |
| Cô Ba là mentor, buồn chứ không la | §19.1 | §7.4, §7 XĐ1.4 |
| Bà Bảy ↔ cô Ba: bất hoà 15 năm | §19.5 | §9 |
| Trợ năng: cỡ chữ, pause, vùng chạm, font, dấu | §20 | §15 |
| Nguyên tắc kết game: *"ai còn ở đó với mình"* | §20 (dòng 1010) | §15 |
| Rule DB chấm theo độ cụ thể, shuffle-bag | §18.7 | §11 |
| Ngôn ngữ gọi món dùng nguyên văn | §19.3 | §14 |

---

## 9. Đề xuất sửa CANON

1. **§15 — làm rõ công tắc #4 tắt cái gì.** CANON ghi *"sổ tay cuối ngày"*. Doc này tách: tắt **trang cuối ngày của cô Ba**, nhưng **giữ nhật ký thô** và **giữ hệ giả thuyết**. Lý do: Linh cần thoát khỏi một nghi thức cảm xúc bắt buộc mỗi tối, chứ không cần mất luôn dữ liệu — và Minh có thể là cùng một người chơi ở một tâm trạng khác. **Đề nghị ghi rõ phạm vi vào §15.**

2. **§17 — thêm "sổ tay" vào mục tiêu đạt của P1, không chỉ P2.** Bảng phase hiện đặt sổ tay ở P2. Nhưng cổng cứng của P1 đòi *"≥7/10 trả lời đúng vì sao khách đó giận"*, và bài học Oblivion nói thẳng rằng **không có sổ thì người chơi không nhận ra hệ thống**. **Đề nghị đưa một phiên bản tối giản của cột trái (nhật ký thô) vào P1** — chi phí thấp, và nếu thiếu thì cổng P1 gần như chắc chắn fail vì lý do sai.

3. **§13 — ghi thành luật: KHÔNG có nút "tính giùm nhu cầu".** §13.2 nói người chơi phải suy ra lịch, nhưng không cấm giao diện tính giùm. Một ngày nào đó ai đó sẽ thêm nó vì nó "tiện", và nó sẽ **vô hiệu hoá toàn bộ P2-03 §2.10 cùng cả cuốn sổ này**. **Đề nghị nâng thành cấm rõ ràng.**

4. **§9 — thêm cột "cảnh nhỏ" cho 12 NPC.** Mười hai vignette ở §2.3 là nội dung cốt lõi của P4 và là chỗ duy nhất một số sự thật về nhân vật được nói ra. Chúng nên sống trong CANON bên cạnh tên và tính cách, không nằm lẻ trong một doc P2.

5. **§15 — bổ sung ràng buộc font tiếng Việt.** §15 đã yêu cầu *"sans, line-height rộng"*, nhưng chưa nói gì về **font viết tay**. Chữ của cô Ba là font viết tay, và phần lớn font viết tay miễn phí **thiếu dấu tiếng Việt**. Đây chạm vào lằn ranh đỏ về ngôn ngữ (idea.md §19.5: *"Đủ dấu"*). **Đề nghị thêm: mọi font trang trí phải qua kiểm bảng dấu đầy đủ, thiếu thì fallback sans, không bao giờ để rụng dấu.**

6. **§12 / §15 — đặt tên cho `landmarkTier`.** Thước đo tiến trình *"nhà tui gần xe bánh mì cô Ba"* (idea.md §19.2) hiện không có mặt trong CANON, dù nó là **thanh progress duy nhất** của cả game và nó tiêu thụ đầu ra của hệ đồn thổi. **Đề nghị thêm một mục ngắn vào §12 hoặc §14.**
