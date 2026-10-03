# Nghiên cứu ngoài — NPC biết mình đang ở đâu, và nhớ được chuyện gì

**Ngày:** 2026-10-02 · **Cho:** `../../phase-2-he-npc/P2-09-kien-truc-giao-tiep.md`
**Câu hỏi lõi:** GTA, game mô phỏng đời thật, và lớp agent có trí nhớ — họ dùng **thuật
toán nào** để một NPC nói đúng câu, đúng lúc, với đúng người; và cái nào trong số đó bê
được vào một cái xe bánh mì chạy trên trình duyệt, không LLM, không mô phỏng sâu.

**Quy ước độ tin cậy** (giữ nguyên của `../flow-tro-chuyen/`):
`[N]` có nguồn, dẫn ở §5 · `[~]` suy luận của tôi từ nguồn · `[?]` chưa xác minh được.

> Bản khảo sát trước (`../flow-tro-chuyen/04-research-games.md`) hỏi *"hội thoại và việc
> tay chân cùng lúc thì làm sao"* và trả lời bằng **hình dạng UI**. Bản này hỏi câu khác:
> *"cái gì quyết định NỘI DUNG được phép tồn tại"* và trả lời bằng **thuật toán**. Hai bản
> không chồng nhau; bản này là phần P2-06 cố ý chưa đụng tới.

---

## 0. Kết luận một dòng

Bốn hệ được khảo sát đều giải đúng **một** bài toán, và đó đúng là bài toán Cô Ba đang
hỏng: **nội dung không được phép ĐOÁN thế giới — thế giới phải CHÌA ra cái để nói.**
The Sims gọi nó là *advertisement*, Stanford gọi là *retrieval*, Versu gọi là *practice*,
Rockstar (theo chỗ biết được) gọi là *archetype pool + tag*. Bốn cái tên, một chiều mũi tên:
**thế giới → nội dung**, không bao giờ ngược lại.

Cô Ba hiện đi ngược chiều mũi tên đó ở **1.488/1.534 nút** (xem §4.1).

---

## 1. THE SIMS — "smart object" và *advertisement* `[N1][N2][N3]`

Hệ đáng chép nhất, và là hệ cổ nhất.

**Nguyên tắc:** logic không nằm trong nhân vật, nó nằm trong **đồ vật**. Mỗi đồ vật
*quảng cáo* một tập `(hành động, phần thưởng)` ra xung quanh; nhân vật quét xem quanh
mình có gì được quảng cáo, chấm điểm từng cái theo nhu cầu của chính mình, rồi chọn. `[N1]`

Zubek viết nguyên công thức ra `[N2]`:

```
a. điểm thô          score = Σ (giá trị tương lai của nhu cầu)
b. có suy giảm       score = Σ A(giá trị tương lai)              A không tăng, thường phi tuyến
c. theo ĐỘ CHÊNH     score = Σ ( A(giá trị hiện tại) − A(giá trị tương lai) )
```

Dạng (c) là dạng dùng được: với `A(x) = 10/x`, kéo cơn đói từ 30 → 90 ăn `1/3 − 1/9 = 2/9`,
còn từ 60 → 90 chỉ ăn `1/18` — **một phần tư**. Và làm cho đói hơn thì ra **điểm âm**, nên
nó tự rơi xuống đáy mà không cần một luật cấm nào. `[N2]`

Bốn chi tiết Zubek nhấn, và cả bốn đều trúng một lỗi đang có của Cô Ba:

| Chi tiết của Zubek `[N2]` | Trúng lỗi nào của Cô Ba |
|---|---|
| **Lọc TRƯỚC khi chấm** bằng mặt nạ thuộc tính rẻ tiền ("bếp không quảng cáo *nấu* cho con nít") — *"tốt nhất là bắt đầu bằng một bộ lọc đơn giản"* | đúng ranh giới `need` (ẩn hẳn) / `while` ("?") mà P2-07 §4.1 đã chốt — hoá ra là một mẫu có sẵn, không phải phát minh riêng |
| **Phần thưởng phải được trao TAY trong hành động**, không tự động — *"hành động bị ngắt thì không được thưởng"* | `PROMISE` hiện trả thưởng ngay lúc NÓI (`rel +3`, `calm 12` ở `any.hoitham` 3.1.1) rồi mới kiểm sau. Ngược hẳn |
| **Đồ vật được phép quảng cáo LÁO** — *"objects can falsely advertise, and not actually grant the rewards they promised"* | đây chính là CANON §16 Đừng-1 (Orkin) viết bằng ngôn ngữ cơ chế: chú Tư nói xe thủng lốp mà không cần mô phỏng cái lốp |
| **Hệ số tune theo TỪNG nhân vật cho TỪNG nhu cầu** (`score × tuning[agent][need]`) | P2-02 đã có 4 chiều tính cách và đã dùng chúng làm hệ số nhân — cùng một mẫu, chỉ chưa áp lên việc chọn chuyện để nói |

Chọn hành động: Zubek khuyên **random có trọng số trong top-N**, không phải winner-takes-all,
vì *"winner-takes-all làm nhân vật trông máy móc khó chịu"*. `[N2]`
Cô Ba đã có `pickTalk` random theo trọng số — nhưng trọng số là **một hằng số viết tay**
(`weight ?? 10`), không phải một điểm số tính từ thế giới.

> **Chỗ KHÔNG bê được:** The Sims để nhu cầu điều khiển cả hành vi đi lại. CANON §16 Đừng-1
> cấm đúng chuyện đó. Ở Cô Ba, chấm điểm chỉ được dùng để **chọn chuyện để nói**, không
> được dùng để **chọn chỗ để đi**. `[~]`

---

## 2. GENERATIVE AGENTS (Stanford, 2023) — dòng ký ức có truy hồi `[N4]`

Bài này nổi vì dùng LLM, nhưng phần đáng lấy lại là phần **không cần LLM**.

**Kiến trúc:** một `memory stream` — danh sách bản ghi, mỗi bản ghi có mô tả, giờ tạo,
giờ truy cập gần nhất. Lúc cần biết "nhớ chuyện gì bây giờ", chấm điểm:

```
score = α_recency·recency + α_importance·importance + α_relevance·relevance
```

với cả ba `α = 1`, `recency` là suy giảm mũ **hệ số 0,995** theo giờ kể từ lần truy cập
gần nhất, `importance` là thang **1–10** (1 = đánh răng, 10 = chia tay), `relevance` là
cosine giữa embedding của ký ức và của câu hỏi. `[N4]`

**Reflection:** khi tổng `importance` của các sự kiện mới vượt **ngưỡng 150** (ra khoảng
**2–3 lần mỗi ngày mô phỏng**), agent lấy **100** bản ghi gần nhất, tự đặt **3 câu hỏi nổi
bật nhất**, rồi viết câu trả lời **ngược trở lại vào dòng ký ức** như một ký ức mới. `[N4]`

Đối chiếu với `sim/memory.ts` của Cô Ba:

| Thành phần | Stanford | Cô Ba hiện có |
|---|---|---|
| recency | `0,995^giờ` | **CÓ** — `currentIntensity` suy giảm tapering, và P2-03 §2.5 đã chốt đếm **lần ghé bị lỡ**, không đếm ngày. Đúng hơn Stanford cho bài toán này `[~]` |
| importance | LLM chấm 1–10 | **CÓ** — `intensity` 0–100, người viết khai |
| **relevance** | cosine embedding | **KHÔNG CÓ GÌ CẢ** |
| **truy hồi** | hàm `retrieve(query)` | **KHÔNG CÓ GÌ CẢ** — không có chỗ nào hỏi "giờ nên nhớ chuyện gì" |
| reflection | ngưỡng 150 → 3 câu hỏi | **gần có** — sổ tay cuối ngày (P2-05) ghi dữ liệu thô, nhưng game không tự rút ra kết luận nào |

Thiếu đúng hai ô, và hai ô đó giải thích trọn vẹn **26 chỗ "nhớ nhầm chuyện chưa từng
xảy ra"** của `P2-08` §1.7: không có truy hồi thì người viết **buộc phải đoán** là chuyện
đó đã xảy ra, và 26 lần họ đoán trật.

**Relevance không cần embedding.** Cosine là cách Stanford làm vì họ đã có sẵn LLM. Với
một kho ký ức 6–8 slot mỗi người, **so khớp THẺ** (Jaccard trên tập thẻ) rẻ hơn, chạy
được trong vòng nóng, và quan trọng hơn: **người thiết kế đọc ra được vì sao nó chọn cái
đó** — thứ mà cosine không cho. `[~]`

---

## 3. VERSU / Richard Evans — "social practice" `[N5][N6][N7]`

Evans (lead AI designer của Sims 3) dựng Versu trên một ý mượn của triết học: một hành
động chỉ **tồn tại** khi người ta đang tham gia một **thực hành** (practice) thuộc loại
nào đó. `[N6]` Không phải "lọc bớt lựa chọn" — mà là ngoài thực hành đó, lựa chọn ấy
không có nghĩa.

Emily Short kể một cảnh sinh ra từ đúng cơ chế này, **không ai viết nó**: một người thứ
ba đi vào phòng, người đang nói thấy không thoải mái trước mặt người kia, nên **im bặt**. `[N5]`

**Vì sao đây là chìa khoá của kho `ANY`.** `ANY` hiện được rút cho **14 vai × 5 pha** —
người đang xếp hàng, người đang gọi món, người đang đợi ổ bánh, người chỉ đi ngang — và
bản rà đếm được **13/33 nút nhắc một trạng thái thế giới mà không đọc nó**
(`../thoai/any.md` §1). Đó không phải lỗi của 13 câu đó. Đó là hậu quả số học của việc
một cái kho phải đúng trong 70 ngữ cảnh.

Dưới mô hình practice, cái kho không còn phải đúng trong 70 ngữ cảnh: **practice bảo đảm
ngữ cảnh**, và câu chỉ cần đúng trong một cái. `[~]`

> **Chỗ KHÔNG bê được:** Versu để nhân vật tự chạy cả câu chuyện. Cô Ba có 40 ngày đã viết
> cứng (P4-02) và T4 đòi một điểm kết. Practice ở đây chỉ được dùng làm **cổng ngữ cảnh**,
> không được dùng làm máy sinh cốt truyện. `[~]`

---

## 4. GTA V / RDR2 — kho theo archetype, và hai phím thái độ

Đây là chỗ phải nói thẳng: **kiến trúc thoại ped của Rockstar không có tài liệu công khai
đủ sâu để trích.** `[?]` Bài phân tích kỹ nhất tìm được tự ghi rõ nó là *suy đoán có cơ sở,
không phải một bản tóm tắt chính xác*, và không có ID dòng, không có cơ chế chuỗi hội
thoại, không có hệ thẻ. `[N8]` Nên phần dưới chỉ lấy những gì nhìn thấy được từ bên ngoài.

| Thấy được | Nguồn | Lấy được gì |
|---|---|---|
| Ped sinh ra theo **archetype** gắn với KHU VỰC (doanh nhân ở Rockford Hills, dân quê ở Blaine County); thoại gom theo pool của archetype chứ **không theo từng cá thể** | `[N8]` | đúng mô hình `QUA_DUONG`/`WALKIN` của Cô Ba: 8 dáng người dùng chung kho. Mô hình **đang đúng**, chỗ sai chỉ là nội dung viết như thể họ có quá khứ |
| RDR2: **không mở menu nào**, hai prompt thái độ gắn ngữ cảnh (Greet / Antagonize), tập prompt đổi theo chuyện đã xảy ra | `[N9]`, đã khảo ở `../flow-tro-chuyen/04` §1.12 | mẫu M1 — đã được P2-06 nhận, chưa thi công cho `QUA_DUONG` |
| GTA VI (theo rò rỉ, **chưa kiểm chứng**): ped phản ứng theo vũ khí người chơi cầm, thời tiết, giờ trong ngày, trạng thái cảm xúc; hội thoại leo thang theo **chuỗi ID dòng liên kết nhau bắt theo thẻ của từng nhân vật** | `[?]` `[N10]` | nếu đúng thì đó là advertisement + thẻ, tức vẫn là §1 và §2. **Không dùng làm căn cứ** cho quyết định nào |

**Kết luận về GTA:** không có gì ở đây mà §1–§3 chưa nói, và phần được công khai thì mỏng.
Giá trị thật của nó nằm ở chỗ **xác nhận** một chuyện Cô Ba đã làm đúng mà bản rà đang
đòi sửa: **người lạ KHÔNG nên có trí nhớ cá thể.** Kho dùng chung theo archetype là thực
tiễn ngành, không phải chỗ cắt bớt. Việc phải sửa là **ba câu nhắc quá khứ viết lọt vào
kho đó** (`../thoai/qua-duong.md` §5), không phải cái kho.

---

## 4.1. Số đo: Cô Ba đang đi ngược chiều mũi tên ở đâu

Đếm trực tiếp trên `src/content/talks/*.json` (123 cuộc · 1.534 nút):

| | nút | % | nghĩa |
|---|---|---|---|
| có `act` | **46** | 3,0 % | nói xong thế giới đổi |
| có `while` | 13 | 0,8 % | có đọc một sự thật ĐỘNG |
| có `need` | 36 | 2,3 % | …mà `need` chỉ tra được **cờ chuyện** |
| có `needEquip` | 8 | 0,5 % | |
| **không neo gì cả** | **~1.488** | **97 %** | nội dung tự đoán thế giới |

> Bản rà `P2-08` ghi **47** nút có `act`; cách đếm của tôi ra **46**. Lệch 1, gần như chắc
> là khác nhau ở chỗ đếm nút tới qua `ref`. Tổng nút thì khớp đúng **1.534**.

Và hai con số nói rõ nhất rằng vấn đề là **đường nối**, không phải nội dung:

* `src/content/npcs/purposes.json` có **60 mục đích × 34 tâm trạng**, đã nối vào
  `inviteChance` và sức chờ — và **0 câu thoại nào trong cả kho đọc `t.purpose()` hay
  `t.state()`**. Một hệ đầy đủ, không có một người dùng.
* `Customer.cutLine` (`customer.ts:213`), `Customer.inShade` (`:233`),
  `Service.shadeFree` (`service.ts:946`) — cả ba **khai ra rồi không bao giờ được gán ở
  đâu**. Đó là lý do cơ học của câu *"bảo có người tới trước chị, chị chen hàng — trong
  khi bà ấy không hề chen"*: khoá có thật, sự kiện thì không.

---

## 5. NĂM THỨ BÊ THẲNG ĐƯỢC

| # | Lấy của | Lấy cái gì | Vào đâu của Cô Ba | Chi phí |
|---|---|---|---|---|
| **R1** | Sims `[N1][N2]` | **Thế giới chào hàng** `(topic, payload, salience)`; nội dung gắn vào topic, không tự đoán | thay chỗ `need` tra cờ chuyện | Cao — nhưng nó là cái chặn mọi thứ khác |
| **R2** | Stanford `[N4]` | **Truy hồi ký ức** `recency + importance + relevance`, relevance bằng khớp thẻ chứ không embedding | `sim/memory.ts` thiếu đúng hai ô này | Vừa |
| **R3** | Versu `[N5][N6]` | **Practice** làm cổng ngữ cảnh; kho rút theo practice, không rút theo người | chữa gốc `ANY` (13/33 nút sai) | Vừa |
| **R4** | Sims `[N2]` | **Chấm điểm theo độ chênh có suy giảm**, random trong top-3 | thay `weight ?? 10` của `pickTalk` | Thấp |
| **R5** | Sims `[N2]` | **Thưởng trao tay TRONG hành động**, không trao lúc nói | chữa `PROMISE` trả `calm` trước khi làm | Thấp — làm được ngay |

**Thứ tự:** R5 → R4 → R2 → R3 → R1. R5 và R4 rẻ và độc lập; R2 mở khoá 26 nút nhớ nhầm;
R3 mở khoá cả kho `ANY` và `QUA_DUONG`; R1 là cái lớn và phải làm sau cùng vì nó đổi hình
dạng dữ liệu.

Thi công chi tiết: `../../phase-2-he-npc/P2-09-kien-truc-giao-tiep.md`.

---

## 6. Nguồn

- `[N1]` Mark Brown, *The Genius AI Behind The Sims* — https://gmtk.substack.com/p/the-genius-ai-behind-the-sims
- `[N2]` Robert Zubek, *Needs-Based AI* (bản nháp chương sách) — https://robert.zubek.net/publications/Needs-based-AI-draft.pdf
- `[N3]` Yoann Bourse, *Artificial Intelligence in The Sims series* — https://yo252yo.com/old/ens/sims-rapport.pdf
- `[N4]` Park et al., *Generative Agents: Interactive Simulacra of Human Behavior* (UIST 2023), arXiv:2304.03442 — https://ar5iv.labs.arxiv.org/html/2304.03442
- `[N5]` Emily Short, *Introducing Versu* — https://emshort.blog/2013/02/14/introducing-versu/
- `[N6]` Richard Evans, *Computer Models of Constitutive Social Practice* — https://versu.com/wp-content/uploads/2014/05/ptai_evans.pdf
- `[N7]` Richard Evans & Emily Short, *Thinking About People: Designing Games for Social Simulation* — https://www.gamedeveloper.com/design/thinking-about-people-designing-games-for-social-simulation
- `[N8]` *Breaking Down GTA V's Pedestrian Dialogue System* (Game Developer) — https://www.gamedeveloper.com/design/breaking-down-gta-v-s-pedestrian-dialogue-system-an-analysis-with-speculative-examples — **tác giả tự ghi là suy đoán**
- `[N9]` RDR2 — đã khảo ở `../flow-tro-chuyen/04-research-games.md` §1.12, nguồn `[N16][N17]` của file đó
- `[N10]` Rò rỉ GTA VI về hệ thoại ped — **tin đồn, không kiểm chứng được**, không dùng làm căn cứ: https://dotesports.com/gta/news/gta-6-new-dialogue-system-npc-conversations

### Những chỗ KHÔNG xác minh được

- Kiến trúc thoại ped của GTA V: **không có tài liệu kỹ thuật công khai**. Mọi mô tả tìm
  được đều là suy đoán của cộng đồng mod hoặc của người viết blog. Đừng trích ra ngoài.
- Mọi thứ về GTA VI: rò rỉ, chưa phát hành.
- Trọng số `α` của Stanford đều bằng 1 **trong bài báo đó**; không có chứng cứ nào nói
  bộ ba đó là tối ưu cho một bài toán khác.
