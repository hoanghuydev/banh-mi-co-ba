# P6-01 — Chiến lược phát hành

> ## ⚡ REVAMP 2026-10-20 — ✅ CÒN SỐNG
> Căn cứ: [`CANON.md`](../CANON.md) bản revamp + [`revamp/00-YEU-CAU.md`](../revamp/00-YEU-CAU.md). Phần ☠️ không dùng làm căn cứ.
>
> | Mục | Trạng thái | Lý do / thay bằng |
> |---|---|---|
> | §1, §2.6, §2.9, §3.1: T4 làm căn cứ ("ship trọn vẹn 40 ngày", cấm Early Access) | 🔁 | T4 chết; T4 mới chỉ giữ cấm daily login/stamina. Cấm EA/live ops cần chủ dự án chốt lại trên căn cứ khác |
> | §3.1 `title: "Bánh Mì Cô Ba"` | 🔁 | → "Bye Sếp, Em Bán Bánh Mì"; tên tiếng Anh chốt sau (R0.5) |
> | §2.5 góc tiếp cận cộng đồng "NPC nhớ bạn, arc nhân vật" | ☠️ | Thay: sao/review công khai, chủ đề "dám nghỉ việc mở quán" (R0.5) |
> | §2.7 kế hoạch 12 tuần: đo "40 ngày = bao nhiêu giờ", tuần 7 "gossip chain hiển thị" | ☠️ | Thay: đo thời gian tới mốc thắng (R5), demo hiển thị sao/review (R4) |
> | §3.2 ngân sách lồng tiếng (cô Ba) · §3.3 `eventId` WRONG_NAME · §6 checklist 40 ngày | 🔁 | Vai chính Phương Anh (R0.5); bỏ sự kiện chết; đo theo mốc thắng |
>
> **Còn dùng được:** thứ tự nền tảng PC → mobile, quy tắc chọn giá, regional pricing, rào cản phân phối VN, kênh phát hành, chính sách crack/DRM, cổng cứng 2.000 wishlist, bảng publisher.

**Thuộc phase:** P6 — Phát hành
**Phụ thuộc:** `CANON.md` §0 (một câu + tagline), §2 (nền tảng, giá, ngôn ngữ), §14.1 (lằn ranh đỏ), §17 (bản đồ phase + cổng cứng) · `P6-02-marketing-va-noi-dung-viral.md` (nội dung của chiến dịch này) · `P6-03-lo-trinh-sau-phat-hanh.md` (v2 mobile, hậu mãi)
**Trạng thái:** **Chốt** — trừ ba mục đánh dấu **Cần đo**: chi phí lồng tiếng, chi phí pháp lý G1–G4, và giả định độ dài sản xuất trong bảng ngân sách §3.2.

---

## 1. Mục tiêu

Đưa *Bánh Mì Cô Ba* ra thị trường theo đúng thứ tự nền tảng và đúng mức giá đã được hội đồng phán quyết, mà **không phá trụ cột nào**.

- Phục vụ **T4** (một mùa có điểm kết): mô hình thương mại là **bán một lần, ship trọn vẹn**. Mọi lựa chọn phát hành nào kéo dự án về phía Early Access / live ops / daily login đều bị loại ngay từ doc này, không tranh luận lại ở phase sau.
- Phục vụ **T1 + T2**: kênh và giá phải đưa game tới **đúng người** — người mua vì *"bị nhìn trong lúc làm việc"*, không phải người mua vì chữ "cozy" trên tag.
- Đặt một **cổng cứng đo được** (2.000 wishlist ở tuần 12) để dự án có quyền dừng sớm, thay vì chết chậm.

> Doc này trả lời ba câu: **bán ở đâu trước**, **bán bao nhiêu tiền**, **12 tuần tới làm gì từng tuần**.

---

## 2. Cơ chế

### 2.1. Thứ tự nền tảng — đã chốt, không đảo ngược (phán quyết XĐ4)

```
Web demo FREE (itch.io)  →  Steam trả phí (v1)  →  Mobile F2P + IAP cosmetic (v2)
   [kênh marketing]          [nơi tạo tiếng vang]      [nơi có tiền — sau 30k bản PC]
```

| Bậc | Nền tảng | Mô hình | Vai trò thật | Điều kiện kích hoạt |
|---|---|---|---|---|
| 0 | **Web / itch.io** | **Miễn phí**, chơi ngay trên trình duyệt | **Kênh marketing chính.** Không phải nguồn thu | Ngay từ tuần 9 |
| 1 | **Steam (PC, Electron)** | **Trả phí một lần** | Nơi **tạo tiếng vang**, nơi có review score, nơi báo chí và streamer nhìn vào | Sau cổng cứng wishlist |
| 2 | **Mobile (iOS + Android)** | **F2P + IAP cosmetic** | Nơi **có tiền** — IAP mobile VN **+83% YoY** | **Chỉ khi đã bán 30.000 bản PC.** Chi tiết ở `P6-03` |

**Vì sao không làm mobile trước — ba lập luận, không phải một:**

1. **Premium mobile là nghĩa địa.** Đặt một game trả phí một lần lên App Store VN là tự chọn một thị trường mà người dùng mục tiêu (Ngọc Ánh: 19 tuổi, Redmi + 4G, chưa từng mua game, không có thẻ tín dụng) **về mặt cấu trúc không mua được**.
2. **Good Pizza Great Pizza sống được trên mobile là vì F2P + live ops + battle pass suốt 10 năm** — chính xác cái mô hình dự án này **tuyên bố từ chối** ở T4. Lấy Good Pizza làm bằng chứng "mobile bán được" là lấy nhầm bằng chứng: nó chứng minh **live ops** bán được, không chứng minh **premium** bán được.
3. **PC/Steam là nơi tạo tiếng vang trong bối cảnh Việt Nam.** Mọi game Việt tạo được tiếng vang gần đây đều **PC-first**: *Tiệm Phở Anh Hai*, *Bánh Mì Bách Khoa*, *Thần Trùng*, *Tai Ương*. Chiều ngược lại — mobile trước rồi port lên PC — không có ca nào để dẫn.

> **Câu chốt của agent Cộng đồng VN:** *"PC/Steam là nơi tạo tiếng vang, mobile là nơi có tiền. Đừng đảo ngược."*

**Hệ quả kỹ thuật bắt buộc:** giữ codebase web như **tài sản kỹ thuật** (cùng một scene Phaser, đổi layout theo `scale.orientation`, không fork code). Nhưng **không để ràng buộc iOS bóp méo thiết kế v1**. Cụ thể: v1 được phép giả định chuột + bàn phím + màn hình ngang; v2 sẽ trả giá cho phần cảm ứng, không phải v1.

---

### 2.2. Giá — không chọn một mức giá, chọn một QUY TẮC QUYẾT ĐỊNH (phán quyết XĐ2)

Bốn agent đưa bốn con số, và **cả bốn đều đúng trong khung của mình**:

| Agent | Đề xuất | Lý lẽ | Khung họ đang tính |
|---|---|---|---|
| Ngọc Ánh | **Free** | 200k₫ = tiền ăn 2 ngày. Không thẻ tín dụng | Khả năng chi trả của người chơi VN trẻ |
| Sarah | **$18** | $5–8 đọc ra là "mobile port" → mua rồi không mở. Rẻ = dev không tin sản phẩm của mình | Tín hiệu chất lượng gửi tới người mua Steam phương Tây |
| Publisher | **$12.99** | $6.99 → **$31–42k** về tay; $14.99 → **$46–55k**. Cùng lượng wishlist, giá cao hơn cho nhiều tiền hơn **~40%** | Doanh thu **trên mỗi wishlist có sẵn** |
| Kiểm chứng | **$4.95–7.99** | Mọi hit cozy/casual viral 2026 đều nằm trong khoảng này | Cái gì **tạo ra** wishlist cho game vô danh |
| Cộng đồng VN | **$6.99–9.99 / 59–79k₫** | Neo thị trường VN | Sức mua nội địa |

**Bản lề của toàn bộ tranh cãi** nằm ở đúng một cụm từ trong lập luận của agent Kiểm chứng: **"ngoại lệ duy nhất là ReStory $19.99 — nhưng có tinyBuild chống lưng"**.

Publisher tính **doanh thu trên mỗi wishlist đã có**. Dữ liệu 2026 nói **giá thấp là thứ TẠO RA wishlist** cho một game vô danh không publisher. Hai bên không mâu thuẫn — họ đang nói về hai giai đoạn khác nhau của cùng một phễu. Ai đang đứng ở giai đoạn nào **quyết định** con số nào đúng.

→ **Quy tắc quyết định đã chốt:**

| Tình huống | Giá quốc tế | Giá VN | Kèm theo |
|---|---|---|---|
| **Không có publisher** (mặc định) | **$9.99** | **59.000₫** | Demo web **miễn phí** trên itch.io |
| **Có publisher trả tiền marketing** | **$12.99–14.99** | Theo PPP tương ứng | Theo đúng lập luận của họ, vì họ đang mua giai đoạn "tạo wishlist" bằng tiền của họ |
| **Mobile v2** | **F2P + IAP cosmetic** | như trên | **Không** premium mobile. Xem `P6-03` |

**Vì sao đúng $9.99, không phải $8.99 hay $11.99:**

- **$9.99 là mức thấp nhất vượt qua mốc tâm lý $10** mà Sarah nói tới. Dưới $10, người mua Steam phương Tây có 600 game trong thư viện đọc ra tín hiệu "impulse buy, chắc là port mobile".
- Đồng thời **không rơi vào vùng $5–8** — vùng mà Sarah nói người ta *mua rồi không mở*. Game này cần người **mở ra chơi**, vì toàn bộ doanh thu dài hạn nằm ở review score và word of mouth, không nằm ở doanh số tuần đầu.
- Nó **không đòi một nhà phát hành chống lưng để biện minh**. ReStory bán được ở $19.99 vì có tinyBuild; chúng ta không có tinyBuild, nên không được mượn cái giá đó.

**Các mốc đã được xác minh để đối chiếu (chỉ dùng những số này, không dùng số khác):**

| Game | Giá | Kết quả | Bài học rút được |
|---|---|---|---|
| **How to Fish** (2 dev Thụy Điển, Dazed Games) | **$7.99** giá gốc ($4.95 chỉ là giá giảm ra mắt) | Peak **373.971 CCU**, **1 triệu bản / 2 ngày** | Giá rẻ + **một ý tưởng sạch** > sản xuất lớn |
| **MECCHA CHAMELEON** (1 dev + 1 artist, Nhật) | **$5.99** | **5 triệu bản / 10 ngày**, peak 244.731 CCU, ~$25M gross, ~2 tháng dev, **0 đồng quảng cáo** | Scope nhỏ không phải điểm yếu. **Lưu ý: không phải solo — có artist riêng** |
| **ReStory: Chill Electronics Repairs** | **$19.99** | **300.000 bản tuần đầu, 95% positive** | Giá cao **được phép** khi có publisher (tinyBuild) trả tiền marketing |
| **The Hust Banhmi** | **$1.99** (~39.000₫) | **~10.000 bản / 2 tuần ≈ $20.000 gross** | Giá siêu thấp bán được số lượng, nhưng gross thấp |
| **Brother Hai's Pho** | **MIỄN PHÍ** | 247 review, **93% tích cực** | ⚠️ Viral vì **free + TikTok + horror**, **không phải vì bán chạy**. Không được dùng làm bằng chứng cho mô hình trả phí |
| **Tiệm Phở Anh Hai** | miễn phí | **650.000 lượt tải** | Đây là bằng chứng **demo free là kênh marketing hiệu quả ở VN** |

---

### 2.3. Regional pricing — nhận giá đề xuất của Valve, **đừng tự nâng**

**Quy tắc một dòng:** khi Steamworks đề xuất bảng giá theo PPP, **bấm nhận**. Không ngồi kéo con số Việt Nam lên cho "đỡ thiệt".

| Lý do | Giải thích |
|---|---|
| **Steam VN ≈ 45% giá Mỹ** | $9.99 → khoảng **59.000₫**. Đây là con số CANON §2 đã chốt, khớp đúng với đề xuất PPP |
| **Neo tâm lý thị trường VN đã có sẵn** | Hust Banhmi **39k** · Thần Trùng **75k** · Tai Ương **128k**. 59k nằm giữa Hust Banhmi và Thần Trùng — đúng chỗ cho một game có art riêng và có lồng tiếng |
| **Tự nâng giá VN = mất đúng tệp bảo vệ mình** | Người Việt mua game Việt là nhóm viết review tiếng Việt, làm clip, seeding vào group. Họ rẻ hơn mọi hình thức quảng cáo và trung thành hơn |
| **Chuyện "người Việt mua được" giải bằng regional pricing, không giải bằng giá gốc** | Đừng hạ $9.99 xuống $6.99 để chiều thị trường VN. Hạ giá gốc là hạ cho **toàn thế giới** |

**Việc phải làm cụ thể:** trong Steamworks, ở bước *Pricing*, chọn **"Use Steam's suggested prices"** cho toàn bộ vùng, sau đó chỉ kiểm tra lại đúng **4 dòng**: VN, TH, PH, ID (các thị trường Đông Nam Á có khả năng thành nguồn word-of-mouth). Nếu con số nào lệch quá xa so với neo thị trường của nước đó, ghi lại lý do rồi mới sửa — không sửa theo cảm tính.

---

### 2.4. ⚠️ Hai rào cản phân phối tại Việt Nam — kế hoạch hành động, không phải cảnh báo

Đây là mục **quan trọng nhất và dễ bị bỏ qua nhất** của cả doc.

#### 2.4.1. Steam đã bị chặn tại Việt Nam

**Hệ quả trực tiếp lên chiến lược, không phải một ghi chú bên lề:**

| Hệ quả | Điều phải đổi trong kế hoạch |
|---|---|
| Người chơi VN **không vào Steam được bằng đường mặc định** | Wishlist từ VN sẽ **thấp hơn dự kiến một cách có hệ thống**. Không được diễn giải wishlist thấp ở VN là "người Việt không quan tâm" |
| Seeding vào group Facebook VN dẫn về link Steam sẽ **rơi rụng ở bước cuối** | **Mọi post seeding tiếng Việt phải dẫn về DEMO WEB/itch.io trước**, Steam là link thứ hai trong post, không phải link đầu |
| Cổng cứng 2.000 wishlist **không thể trông vào thị trường VN** | Cổng cứng phải được đạt bằng **tệp quốc tế** (r/CozyGamers, r/IndieGaming, TikTok EN). VN đóng vai **tạo tiếng vang và tạo độ tin cậy văn hoá**, không đóng vai tạo wishlist |
| Demo web trở thành **kênh duy nhất chơi được ngay** cho người VN | Demo web **phải chạy được trên trình duyệt di động** và **phải nhẹ** (4G, Redmi). Đây là ràng buộc kỹ thuật cứng, không phải tuỳ chọn |

**Kế hoạch hành động — 5 việc, có người chịu trách nhiệm và hạn:**

| # | Việc | Khi nào | Tiêu chí đạt |
|---|---|---|---|
| A1 | Tự kiểm tra tình trạng truy cập Steam từ **3 nhà mạng VN khác nhau** (Viettel / VNPT / FPT), ghi lại kết quả + ngày kiểm tra | Tuần 8, lặp lại tuần 11 | Có bảng kết quả thật, không đoán |
| A2 | Dựng **demo web itch.io** làm cổng chính cho VN: chơi ngay, không tải, chạy được trên trình duyệt di động | Tuần 9 | Load < 10s trên 4G, chơi được bằng một ngón cái |
| A3 | Mọi bài seeding tiếng Việt: **link 1 = demo web**, link 2 = Steam, có một dòng ghi chú trung tính về việc truy cập Steam | Từ tuần 10 | Không bài nào dẫn thẳng Steam làm link đầu |
| A4 | Tách **chỉ số VN** ra khỏi chỉ số wishlist tổng trong bảng theo dõi (§3.3) | Tuần 9 | Dashboard có 2 cột riêng |
| A5 | Chuẩn bị **kênh dự phòng cho người chơi VN**: itch.io bản trả phí (bản full) như kênh mua thứ hai | Trước ngày phát hành | itch.io page có bản bán, giá quy đổi tương đương 59.000₫ |

#### 2.4.2. Cấp phép game tại Việt Nam — G1 / G2 / G3 / G4

**Sự kiện phải tính:** **từ tháng 10/2025, Việt Nam đã chặn/gỡ 327 game không phép khỏi App Store và Google Play.** Đây không phải rủi ro lý thuyết — nó đã xảy ra ở quy mô ba trăm tựa.

**Ảnh hưởng tới dự án này theo từng bậc nền tảng:**

| Bậc | Mức phơi nhiễm | Lý do |
|---|---|---|
| Web demo (itch.io) | **Thấp** | Không qua store VN |
| Steam PC | **Thấp–trung bình** | Steam không phải store do VN quản lý trực tiếp; nhưng xem 2.4.1 |
| **Mobile v2 (App Store / Google Play VN)** | **CAO** | Đây đúng là hai store đã bị gỡ 327 tựa. **Đây là nơi phải có giấy tờ** |

**Phân loại G1–G4 (theo cách hiểu hiện tại — ⚠️ BẮT BUỘC xác minh lại với luật sư trước khi nộp hồ sơ, không dùng doc này làm căn cứ pháp lý):**

| Nhóm | Đặc điểm kỹ thuật | Game này có rơi vào không? |
|---|---|---|
| **G1** | Nhiều người chơi **tương tác với nhau đồng thời qua máy chủ** của doanh nghiệp | ❌ **Không** — v1 là client-only, offline-first, không server (CANON §2). Đây là **lợi thế pháp lý trực tiếp của quyết định cắt multiplayer ở HT5** |
| **G2** | Người chơi tương tác **với máy chủ**, không tương tác với nhau | ❌ Không — không có máy chủ |
| **G3** | Nhiều người chơi tương tác **với nhau**, không qua máy chủ | ❌ Không |
| **G4** | **Tải về từ mạng, không có tương tác giữa người chơi với nhau và với máy chủ** | ✅ **Nhiều khả năng đây là nhóm của game này** |

> **Ghi chú chiến lược quan trọng:** quyết định cắt multiplayer (HT5) và cắt Colyseus khỏi v1 vốn được đưa ra vì lý do **chất lượng và scope**. Nhưng nó đồng thời **hạ dự án từ nhóm G1 (nặng nhất) xuống nhóm G4 (nhẹ nhất)**. Đây là một lợi ích không ai tính tới lúc ra quyết định, và nó là lý do nữa để **không đưa co-op trở lại** — xem `P6-03` §2.2.

**Kế hoạch hành động — 6 việc:**

| # | Việc | Khi nào | Tiêu chí đạt |
|---|---|---|---|
| B1 | Tra cứu văn bản gốc hiện hành về quản lý trò chơi điện tử trên mạng (nghị định + thông tư hướng dẫn, **bản mới nhất tại thời điểm tra**) | Tuần 9 | Có bản PDF văn bản gốc lưu trong `docs/phu-luc/`, ghi rõ số hiệu và ngày hiệu lực |
| B2 | **Tư vấn luật 1 buổi** (~1–2 giờ) với luật sư/đơn vị tư vấn có kinh nghiệm hồ sơ game để xác nhận nhóm G và bộ hồ sơ | Tuần 10 | Có văn bản xác nhận game thuộc nhóm nào + danh mục hồ sơ |
| B3 | Xác định **pháp nhân đứng tên**: cá nhân không phát hành được — cần công ty VN, hoặc phát hành qua publisher có pháp nhân VN | Tuần 10 | Chọn xong một trong hai đường, có lý do ghi lại |
| B4 | Rà soát nội dung theo **CANON §14.1 (lằn ranh đỏ)** dưới góc nhìn kiểm duyệt: bản đồ tự vẽ · không một chữ về chiến tranh · tâm linh giữ tông tự trào (VOZ từng tố *Bad Parenting* "tuyên truyền mê tín dị đoan" — đây là rủi ro đã có tiền lệ thật) | Tuần 11 | Checklist ký duyệt, có ảnh chụp từng asset nhạy cảm |
| B5 | Với **v1 PC**: không cần chặn phát hành chờ giấy phép. Với **v2 mobile**: **không được lên store VN trước khi có giấy tờ** | Trước khi mở v2 | Ghi thành điều kiện chặn trong `P6-03` |
| B6 | Dự trù **chi phí pháp lý** vào bảng ngân sách (§3.2), đánh dấu **Cần đo** cho tới khi có báo giá thật | Tuần 10 | Có ít nhất 2 báo giá |

---

### 2.5. Kênh phát hành đầy đủ

Sắp theo đúng thứ tự thời gian, không sắp theo độ quan trọng.

#### Kênh 1 — Demo web / itch.io miễn phí (kênh gốc, mở đầu tiên)

| Điểm seeding | Quy mô | Cách vào |
|---|---|---|
| **Hội Làm Game Việt Nam** | **203.600 thành viên** | Post dev-log, không post quảng cáo. Chia sẻ **quyết định thiết kế** (vd: vì sao bỏ nút "nhặt bánh lên") — group này ăn nội dung nghề, không ăn trailer |
| **Team Việt Hoá SDV** | **51.200 thành viên** | Góc tiếp cận: **bản địa hoá và giọng miền Nam**, đại từ xưng hô không dịch. Đây đúng là chủ đề của group |
| **Stardew Valley Việt Nam** | **29.200 thành viên** | Góc tiếp cận: NPC nhớ bạn, arc nhân vật, hẻm có người làm ăn được. **Không** dùng chữ "cozy farming" |
| **voz** (f33 / Giải trí) | — | Tông phải **tự trào và không xin xỏ**. voz đánh chết mọi thứ có mùi PR. Post dạng "tôi làm cái này, đây là chỗ nó dở" |
| **r/VietNam** | — | Song ngữ, nhấn vào **hẻm Sài Gòn 6 giờ sáng** như hình ảnh, không nhấn vào cơ chế |

**Nguyên tắc chung cho cả 5 điểm:** một tài khoản người thật, có mặt trong group **trước** khi post bài đầu ít nhất 3 tuần, có comment ở bài người khác. Nhảy vào post quảng cáo từ tài khoản lạ = bị xoá bài + mang tiếng.

#### Kênh 2 — Steam, canh **một chiến dịch gộp** cho hai sự kiện

| Sự kiện | Thời gian | Vì sao quan trọng |
|---|---|---|
| **Viet Indie Week** | **30/4 – 6/5** | **Steam treo banner tại VN** trong tuần này — đây là cửa sổ hiếm hoi mà Steam chủ động đẩy game Việt |
| **Vietnam GameVerse** | **8 – 9/5**, SECC (TP.HCM) | **GameHub top 5 nhận đầu tư**. Là sự kiện offline lớn nhất, có báo chí và nhà đầu tư tới |

> **Hai sự kiện cách nhau đúng vài ngày → GỘP LÀM MỘT CHIẾN DỊCH.**
> Đây không phải mẹo tiết kiệm. Đây là cách duy nhất để một studio nhỏ tạo được cảm giác "game này đang ở khắp nơi" trong một khoảng thời gian đủ hẹp để người ta nhớ.

**Cấu trúc chiến dịch gộp (10 ngày, 30/4 → 9/5):**

| Ngày | Việc |
|---|---|
| 30/4 | Steam page bật **sale/demo highlight** đúng lúc banner Viet Indie Week lên. Đăng clip flagship (§P6-02) đồng thời trên TikTok/Reels/X |
| 1–3/5 | 3 clip mỗi ngày trong 3 ngày. Đẩy mạnh nhất vào ngày banner còn treo |
| 4–6/5 | Seeding vào 5 điểm ở Kênh 1, **chỉ lúc này**, không sớm hơn — để lưu lượng dồn vào một chỗ |
| 7/5 | Nghỉ. Chuẩn bị vật lý cho GameHub |
| **8–9/5** | **Vietnam GameVerse tại SECC**: build chơi thử tại chỗ, nộp **GameHub**, gặp báo chí, gặp publisher |
| 10–12/5 | Đăng nội dung **từ sự kiện** (người lạ chơi thử, phản ứng thật khi bị bắt quả tang) — đây là nội dung marketing tốt nhất và nó chỉ có được sau sự kiện |

#### Kênh 3 — Báo chí và streamer

| Nơi gửi | Loại | Gửi cái gì |
|---|---|---|
| **7 Ngày Chơi Game** | Kênh game Việt | Key + bản build ổn định + 1 trang tóm tắt tiếng Việt + 3 GIF |
| **Mọt Game** | Trang tin game Việt | Như trên + góc "game Việt lấy bối cảnh hẻm Sài Gòn" |
| **Phê Game** | Kênh game Việt | Như trên |
| **1–2 streamer lớn** | Streamer/YouTuber VN | **Mô hình tham chiếu: Dũng CT → *Thần Trùng* trending Steam ngay ngày đầu.** Đây là đòn bẩy mạnh nhất trong toàn bộ danh sách kênh |

**Quy tắc gửi key — 4 điều:**
1. Gửi key **ít nhất 5 ngày trước** ngày phát hành, kèm ngày giờ embargo rõ ràng.
2. Build gửi đi phải là build **đã chơi trọn vẹn được**, không phải demo cụt. Một streamer gặp bug giữa stream là mất luôn cả kênh đó.
3. Kèm **một danh sách 5 khoảnh khắc đáng quay** (timestamp gợi ý) — streamer bận, họ cần biết chỗ nào có nội dung.
4. **Không gửi kèm yêu cầu nói tốt.** Game sẽ bị chê ở một số chỗ; chỗ bị chê là thông tin, không phải thất bại.

#### Kênh 4 — Giải thưởng

| Giải | Hạn | Vì sao nộp |
|---|---|---|
| **IGVN Awards** | **12/2026** | Uy tín trong cộng đồng dev Việt + báo chí đưa tin + là thứ đưa vào Steam page được |
| **GameHub** (trong Vietnam GameVerse) | 8–9/5 | **Top 5 nhận đầu tư** — đây là đường tiếp cận vốn không phải publisher |

---

### 2.6. Game **SẼ** bị crack — và điều đó định hướng ngân sách

**Sự thật phải chấp nhận ngay:** game này **sẽ bị crack**. Một game Electron, client-only, offline-first, không có server xác thực — về mặt kỹ thuật nó là loại game **dễ crack nhất có thể tồn tại**.

**Phán quyết: đừng đầu tư một đồng nào vào DRM.**

| Lập luận | Chi tiết |
|---|---|
| **DRM cho kiến trúc này là bất khả thi** | Muốn chống crack thật thì phải có server xác thực → phải có server → **phá CANON §2 (client-only, offline-first)** và kéo theo chi phí hosting vĩnh viễn + ngày server chết là ngày game chết |
| **Denuvo và tương đương nằm ngoài tầm ngân sách** | Và nếu trong tầm thì vẫn sai: nó làm nặng build, gây tiếng xấu, và vẫn bị crack |
| **DRM đánh trúng người mua thật, không đánh trúng người crack** | Người crack chờ 2 tuần. Người mua thật gặp lỗi kích hoạt ngay tối phát hành |
| **Người chơi VN chơi bản crack hôm nay là người mua bản gốc năm sau** | Và là người làm clip, viết review tiếng Việt, seeding vào group. Đối xử với họ như kẻ trộm là tự cắt chân kênh marketing rẻ nhất mình có |

**Thay vào đó — đầu tư vào LÝ DO CẢM XÚC ĐỂ MUA.** Đây không phải khẩu hiệu; nó là một danh sách ngân sách cụ thể:

| Thay vì chi cho | Chi cho | Vì sao nó tạo lý do mua |
|---|---|---|
| DRM / chống crack | **Lồng tiếng người thật, giọng miền Nam** (CANON §2) | Bản crack có đủ file âm thanh, nhưng **người nghe được giọng thật của cô Ba sẽ muốn trả tiền cho người đã nói câu đó**. Đây là thứ duy nhất trong game có mặt một con người cụ thể |
| DRM | **Credits có tên người Việt viết văn hoá đứng ĐẦU** (CANON §14.1) | Biến việc mua thành một hành vi ủng hộ người cụ thể, không phải ủng hộ "một studio" |
| DRM | **Bản dịch tiếng Việt là bản GỐC, không phải bản dịch** | Người Việt mua game Việt vì nó **nói giọng của họ**. Không ai crack được cảm giác đó |
| DRM | **Ship trọn vẹn 40 ngày, không Early Access** (T4) | Cam kết "mua một lần là xong" là một lý do cảm xúc để mua, trong một thị trường đầy game dở dang |

> **Câu ghi vào tường:** *"Đừng hỏi làm sao ngăn người ta lấy miễn phí. Hỏi làm sao để người đã lấy miễn phí vẫn thấy áy náy đủ để quay lại trả tiền."*

---

### 2.7. Kế hoạch 12 tuần — bảng tuần × việc × tiêu chí đạt

**Đây là 12 tuần dẫn tới CỔNG CỨNG, không phải 12 tuần dẫn tới ngày phát hành.** Phát hành ở sau, và chỉ xảy ra nếu qua được cổng.

| Tuần | Việc chính | Việc marketing song song | **Tiêu chí đạt (đo được)** |
|---|---|---|---|
| **1** | Viết lại design doc còn **6 trang**. Đo prototype: **một ngày chơi mất bao nhiêu phút thật** → 40 ngày = bao nhiêu giờ. Dưới 4 giờ thì giảm số ngày, tăng mật độ | — | **Trả lời được bằng con số.** *"Nếu bạn chưa đo, bạn chưa thiết kế"* |
| **1** ⭐ | **Phỏng vấn 3–5 chủ xe bánh mì thật ở TP.HCM**, 30 phút/người. Lấy chính xác câu thoại khách hay nói, quy trình làm một ổ, tình huống "khách khó" thật | Ghi âm (có xin phép) → nguồn nội dung clip | **Có ≥3 bản ghi.** Đây là thứ không nguồn online nào thay được — và là **lợi thế duy nhất so với marisa0704**, người làm bối cảnh Hà Nội chứ không phải hẻm Sài Gòn |
| **2** | Hoàn tất đo đạc + chốt số ngày một mùa | Lập **danh sách 36 ý tưởng clip** (xem `P6-02` §2.5) | Danh sách 36 clip có ID, có sự kiện CANON §3 tương ứng |
| **3** | **Ký artist** (VN, **$1.500–2.500/tháng** khả thi). Giao **đúng một việc**: một khung key art **hẻm Sài Gòn lúc 6 giờ sáng**. Không làm gì khác cho tới khi khung đó đẹp. Song song: **chuyển sang Electron** | Tạo tài khoản, bắt đầu **có mặt** trong 5 group (comment, chưa post bài mình) | Hợp đồng có tên, có lịch giao, có ngân sách. Electron build chạy được |
| **4** | Artist tiếp tục khung key art. Bắt đầu vertical slice | Tiếp tục hiện diện trong group | **Khung hình đó đứng được một mình** — đưa cho 5 người xem, không giải thích, hỏi "cái này là game gì?" |
| **5** | **Vertical slice 20 phút** — bắt đầu: 1 quầy, **3 NPC quen có tên và mặt** | — | 3 NPC có mặt, có tên, phân biệt được |
| **6** | **11 sự kiện** chạy được (CANON §3) | Quay tư liệu thô cho clip (chưa đăng) | 11/11 sự kiện trigger được trong build |
| **7** | **Gossip chain hoạt động và HIỂN THỊ ĐƯỢC** (NPC A thấy → NPC B biết → NPC C nhắc lại sai) | — | Chuỗi 3 hop chạy được, **người chơi nghe lỏm được** |
| **8** | Art final **chỉ cho phạm vi vertical slice**. Kiểm tra Steam từ 3 nhà mạng VN (A1) | Dựng trailer 60s. Thuê **capsule art riêng ($800–1.200) — đừng để artist chính làm** | **Gửi 10 người lạ chơi, quay màn hình phản ứng.** Câu hỏi duy nhất: *"Bạn có biết vì sao khách đó giận không?"* — **dưới 7/10 trả lời đúng = hệ thống chưa đọc được, và không lượng thoại nào cứu được nó** |
| **9** | **Steam page LIVE.** Giá $9.99 / 59.000₫. **Demo web chơi ngay trên itch.io.** Bắt đầu B1 (tra văn bản G1–G4) | Trailer 60s lên page. Bắt đầu đăng clip | **Page live.** Demo web load <10s trên 4G |
| **10** | Tra cứu pháp lý B2–B3. Sửa bug từ phản hồi demo | **3 clip/tuần** bắt đầu. Bắt đầu seeding 5 group (A3: link 1 = demo web) | ≥**500 wishlist**. Có ≥3 clip đạt tiêu chí "tự giải thích không cần lời thoại" |
| **11** | Rà soát lằn ranh đỏ (B4). Kiểm tra lại Steam/nhà mạng (A1) | **3 clip/tuần**. Gửi build sớm cho 1–2 streamer để họ lên lịch | ≥**1.200 wishlist** |
| **12** | Chốt số liệu. **Ra quyết định cổng cứng** | **3 clip/tuần**. Đẩy mạnh nhất trong tuần này | 🚦 **CỔNG CỨNG — xem §2.8** |

**Tổng sản lượng clip:** 3 clip/tuần × 3 tuần (10–12) = **9 clip tối thiểu**, nhưng danh sách 36 ý tưởng phải có sẵn từ tuần 2 để không bao giờ phải nghĩ nội dung dưới áp lực. Chi tiết ở `P6-02`.

---

### 2.8. 🚦 Cổng cứng tuần 12 — điều kiện dừng

```
Tuần 12:
  wishlist >= 5.000   →  MỤC TIÊU. Đi tiếp, tự tin, cân nhắc đàm phán publisher ở thế mạnh
  wishlist 2.000-4.999 →  Đi tiếp, nhưng KHÔNG tăng scope. Xem lại hook + capsule trước
  wishlist <  2.000   →  ⛔ DỪNG LẠI
```

> **Diễn giải bắt buộc khi dưới 2.000 — đây là phần hay bị hiểu sai nhất:**
> **Vấn đề nằm ở HOOK hoặc ART. Vấn đề KHÔNG nằm ở việc chưa làm đủ nội dung.**

Phản xạ tự nhiên khi wishlist thấp là *"chắc tại game chưa đủ nội dung, làm thêm 3 tháng nữa rồi đăng lại"*. **Phản xạ đó là cách dự án này chết.** Ở tuần 12, người ta chưa chơi game — họ mới nhìn capsule, đọc một dòng short description, và xem một clip 15 giây. Nếu 2.000 người không bấm wishlist sau khi thấy ba thứ đó, thì ba thứ đó sai, chứ không phải nội dung thiếu.

**Việc phải làm nếu rơi vào vùng dừng — theo đúng thứ tự:**

| Bước | Việc | Thời hạn |
|---|---|---|
| 1 | **Dừng sản xuất nội dung.** Không viết thêm dòng thoại nào | Ngay |
| 2 | Đổi **capsule art** (thuê người khác) và đổi **short description** | 2 tuần |
| 3 | Làm lại **clip flagship** với cấu trúc khác | 2 tuần |
| 4 | Chạy lại 2 tuần đo | 2 tuần |
| 5 | Vẫn dưới 2.000 → **dừng thật**. Giữ lại codebase + hệ NPC làm tài sản cho dự án sau. Ghi bài học vào `P6-03` §2.6 | — |

**Dừng không phải là thất bại.** Dừng ở tuần 12 với một hệ NPC chạy được và một artist đã làm việc cùng là một kết quả **tốt hơn nhiều** so với dừng ở tháng 18 với một game làm xong mà không ai biết tới.

---

### 2.9. Có nên tìm publisher không — bảng đánh đổi

Đây là chỗ hai agent giỏi nhất trong hội đồng **nói ngược nhau**, và cả hai đều có dữ liệu.

| | **Lập luận của agent Publisher** | **Lập luận của agent Kiểm chứng** |
|---|---|---|
| **Luận điểm** | Với **cùng một lượng wishlist**, giá cao hơn cho nhiều tiền hơn ~**40%** | **Giá thấp là thứ TẠO RA wishlist** cho game vô danh không publisher |
| **Số liệu** | $6.99 → **$31–42k** về tay · $14.99 → **$46–55k** về tay | How to Fish **$7.99** → 1 triệu bản/2 ngày · MECCHA CHAMELEON **$5.99** → 5 triệu bản/10 ngày, 0 đồng quảng cáo |
| **Điều kiện ngầm chưa nói ra** | **Giả định wishlist đã có sẵn.** Publisher tính doanh thu **trên mỗi wishlist có sẵn** | **Giả định không có ai chi tiền đẩy.** Ngoại lệ duy nhất ở giá cao là ReStory $19.99 — **và nó có tinyBuild chống lưng** |
| **Đúng khi nào** | Khi đã qua cổng cứng và đang có ≥5.000 wishlist, hoặc khi publisher **thực sự trả tiền marketing** | Khi là game vô danh, không có ngân sách đẩy, phải tự tạo phễu từ số 0 |

**Hai lập luận này không mâu thuẫn. Chúng mô tả hai giai đoạn khác nhau của cùng một phễu.** Và điều đó cho ra **quy tắc quyết định theo thời điểm**, chứ không phải một câu trả lời cố định:

| Thời điểm | Tư thế đàm phán | Quyết định |
|---|---|---|
| **Trước tuần 12** | Yếu. Không có gì để chứng minh | **Không ký.** Nhưng **được phép nói chuyện** — đặc biệt ở Vietnam GameVerse. Nói chuyện để biết thị trường, không để ký |
| **Tuần 12, wishlist ≥5.000** | **Mạnh nhất có thể có** | Đây là lúc đàm phán. Giá lên **$12.99–14.99** **chỉ nếu** họ trả tiền marketing thật |
| **Tuần 12, wishlist 2.000–4.999** | Trung bình | Ký **chỉ khi** họ mang lại thứ mình không tự làm được (xem bảng dưới). Không ký để lấy tiền mặt |
| **Tuần 12, wishlist <2.000** | Không có | Publisher cũng sẽ không ký. Xem §2.8 |

**Publisher phải mang lại đúng một trong ba thứ này, nếu không thì không đáng:**

| Thứ họ mang lại | Có đáng đổi % doanh thu không? | Ghi chú |
|---|---|---|
| **Tiền marketing thật** (ngân sách có con số, có kế hoạch) | ✅ **Đáng** — đây chính là thứ biến $9.99 thành $12.99–14.99 hợp lệ | Phải có con số trong hợp đồng, không phải "chúng tôi sẽ hỗ trợ marketing" |
| **Pháp nhân VN + hồ sơ cấp phép G1–G4** (xem §2.4.2) | ✅ **Đáng** — đặc biệt cho v2 mobile | Đây là thứ một cá nhân gần như không tự làm được |
| **Quan hệ streamer/báo chí quốc tế** | ⚠️ **Tuỳ** — hỏi tên cụ thể 3 kênh họ đã đẩy game gần nhất | Nếu họ không nói được tên thì họ không có |
| "Kinh nghiệm", "network", "sẽ giúp về QA" | ❌ **Không đáng** | Đây là những thứ ai cũng nói |

**Ba lằn ranh đỏ trong hợp đồng publisher — không thương lượng:**
1. **Không Early Access.** Nếu publisher yêu cầu EA để "test thị trường" → phá T4 → từ chối.
2. **Không live ops / battle pass / daily login** ở bất kỳ phiên bản nào. Đây là toàn bộ lý do tồn tại của dự án.
3. **Credits: người Việt viết văn hoá đứng ĐẦU** (CANON §14.1). Không đổi thành "cultural consultant" ở cuối.

---

## 3. Dữ liệu & schema

### 3.1. Định danh phát hành cố định

```ts
const RELEASE = {
  title:        "Bánh Mì Cô Ba",            // tên tạm — chốt trước tuần 9
  tagline:      "Món ăn chính là lựa chọn hội thoại.",
  leadWith:     "a game about being watched while you work",   // KHÔNG dẫn bằng "cozy"
  priceUSD:     9.99,
  priceVND:     59_000,
  priceIfPublisher: [12.99, 14.99] as const,  // CHỈ khi publisher trả tiền marketing
  regionalPricing: "STEAM_SUGGESTED_PPP",     // nhận đề xuất của Valve, KHÔNG tự nâng
  platforms: {
    v1: ["steam-win", "steam-mac", "steam-linux", "itch-web-demo"],
    v2: ["ios", "android"],                   // F2P + IAP cosmetic, gate: 30_000 bản PC
  },
  drm: "NONE",                                // xem §2.6 — chủ ý, không phải bỏ sót
  earlyAccess: false,                         // T4, không thương lượng
  languages: {
    vo:   "vi-VN-south",                      // lồng tiếng NGƯỜI THẬT, không AI voice
    text: ["vi-VN", "en-US"],
    pronounPolicy: "DO_NOT_TRANSLATE",         // cô/con/chú/chị/anh/em giữ nguyên
  },
} as const;
```

### 3.2. Ngân sách tối thiểu để ship

**Giả định của bảng này (⚠️ Cần đo — phải xác nhận lại sau khi đo vertical slice ở tuần 8):** 9 tháng từ tuần 1 tới ngày phát hành; artist làm 7 tháng trong đó.

**A. 12 tuần đầu (tới cổng cứng) — đây là số tiền phải bỏ ra TRƯỚC khi biết dự án có sống không:**

| Khoản | Số tiền | Trạng thái số liệu | Ghi chú |
|---|---|---|---|
| **Artist VN** — 2,5 tháng (tuần 3–12) | **$3.750 – 6.250** | ✅ Xác minh ($1.500–2.500/tháng) | Giao đúng một việc trước: khung key art hẻm 6h sáng |
| **Capsule art thuê riêng** | **$800 – 1.200** | ✅ Xác minh | **Đừng để artist chính làm.** Đây là hai kỹ năng khác nhau |
| **Steam Direct fee** | ~$100 | ⚠️ Cần xác minh tại thời điểm nộp | Được hoàn lại sau khi đạt ngưỡng doanh thu |
| **Phỏng vấn 3–5 chủ xe bánh mì** (bồi dưỡng + cà phê + đi lại) | **$100 – 200** | ⚠️ Ước tính | **Khoản ROI cao nhất trong cả bảng.** Không được cắt |
| **Tư vấn pháp lý G1–G4** (1 buổi) | **Cần đo** | ❌ Chưa có báo giá | Phải lấy ≥2 báo giá ở tuần 10 |
| **Nhạc / âm thanh nền (tạm, cho trailer)** | **Cần đo** | ❌ Chưa có báo giá | Có thể dùng license tạm cho 12 tuần đầu |
| **TỔNG 12 tuần (chưa gồm các khoản Cần đo)** | **≈ $4.750 – 7.750** | | |

**B. Từ tuần 13 tới ngày phát hành (chỉ chi nếu QUA cổng cứng):**

| Khoản | Số tiền | Trạng thái | Ghi chú |
|---|---|---|---|
| **Artist VN** — 4,5 tháng còn lại | **$6.750 – 11.250** | ✅ Xác minh đơn giá | |
| **Lồng tiếng người thật, giọng miền Nam** | **Cần đo** | ❌ Chưa có báo giá | Cần ≥3 giọng (cô Ba + 12 NPC dùng chung ít giọng hơn). **Không dùng AI voice** (CANON §2) — đây vừa là quyết định chất lượng vừa là quyết định né rủi ro asset AI |
| **Nhạc gốc** | **Cần đo** | ❌ Chưa có báo giá | |
| **Hiệu đính tiếng Anh (bản dịch từ tiếng Việt)** | **Cần đo** | ❌ | Chú ý: đại từ xưng hô **không dịch** → cần người hiệu đính hiểu việc này |
| **QA / build test đa máy** | **Cần đo** | ❌ | Electron nên rủi ro thấp hơn Tauri, nhưng vẫn phải test |
| **Phí pháp nhân + cấp phép (nếu tự đứng tên)** | **Cần đo** | ❌ | Hoặc bằng 0 nếu đi qua publisher có pháp nhân VN |

> ⚠️ **Nguyên tắc ngân sách:** mọi ô ghi **"Cần đo"** phải được thay bằng **báo giá thật có tên người/đơn vị** trước khi đưa bảng này vào bất kỳ tài liệu gọi vốn nào. Đây chính là bài học phương pháp của `idea.md` §15 — xem `P6-03` §2.6.

### 3.3. Schema theo dõi chiến dịch

```ts
type WeeklySnapshot = {
  week: number;                    // 1..12
  date: string;                    // ISO
  wishlist: {
    total: number;
    fromVN: number;                // TÁCH RIÊNG — xem §2.4.1, Steam bị chặn ở VN
    fromIntl: number;
    deltaWeek: number;
  };
  demo: {
    itchPlays: number;
    itchMedianSessionSec: number;  // < 180s = hook hỏng, không phải "người ta bận"
    mobileBrowserShare: number;    // 0..1 — kiểm chứng A2
  };
  clips: Array<{
    id: string;                    // "C07"
    eventId: string;               // khớp CANON §3: "DIRTY_HANDS" | "WRONG_NAME" | ...
    npcId?: string;                // khớp CANON §9
    platform: "tiktok" | "reels" | "shorts" | "x";
    lang: "vi" | "en";
    views: number;
    saves: number;
    selfExplainPass: boolean;      // xem P6-02 §2.7 — tiêu chí "ủa bả thấy kìa"
  }>;
  gateStatus: "ON_TRACK" | "WARNING" | "STOP";
};
```

**Quy tắc đọc dashboard:** `gateStatus` được tính **tự động**, không tính bằng cảm giác.

```ts
function gateStatus(s: WeeklySnapshot): WeeklySnapshot["gateStatus"] {
  const need = { 10: 500, 11: 1200, 12: 2000 }[s.week];
  if (need === undefined) return "ON_TRACK";
  if (s.wishlist.total >= need * 1.5) return "ON_TRACK";
  if (s.wishlist.total >= need) return "WARNING";
  return "STOP";
}
```

---

## 4. UI/UX hai thiết bị — mặt tiền cửa hàng

| | **Steam (desktop)** | **Steam (mobile app / web mobile)** | **itch.io demo (web)** |
|---|---|---|---|
| Thứ nhìn thấy đầu tiên | Capsule ngang + trailer autoplay | **Capsule dọc bị crop** → capsule phải đọc được cả khi cắt vuông | Nút **PLAY NOW**, không có bước tải |
| Short description | Hiện đủ ~300 ký tự | **Bị cắt ~120 ký tự** → **12 chữ đầu phải gánh toàn bộ** | Một dòng dưới tiêu đề |
| Ràng buộc bắt buộc | Trailer có phụ đề burn-in (nhiều người xem tắt tiếng) | Mọi chữ trong ảnh chụp ≥ 24px ở kích thước thật | **Load < 10s trên 4G**, chơi được **bằng một ngón cái**, vùng chạm **≥44pt** |
| Sai lầm phải tránh | Nhồi 8 bullet tính năng | Để tagline ở dòng thứ 6 | Bắt đăng ký trước khi chơi |

**Ràng buộc capsule (nối với `P6-02` §2.3):** hình capsule là **cận cảnh đôi mắt khách nhìn thẳng vào tay bạn**. Hình này phải sống sót qua cả ba lần crop: ngang (header), vuông (library), nhỏ xíu (search result). Nếu cắt vuông mà mất đôi mắt thì capsule sai — làm lại.

---

## 5. Tham số cần tune

| Tham số | Giá trị khởi điểm | Khoảng | Cách đo |
|---|---|---|---|
| `priceUSD` | **$9.99** | 9.99 (mặc định) · 12.99–14.99 (có publisher) | Không A/B test giá trên Steam. Quyết định bằng **quy tắc §2.2**, không bằng thử nghiệm |
| `launchDiscount` | **0%** | 0–15% | Nếu giảm, đây là giảm ra mắt như How to Fish ($7.99 → $4.95), **không** phải hạ giá gốc |
| Số clip/tuần | **3** | 3–5 | Dưới 3 → không đủ mẫu để biết clip nào đúng. Trên 5 → chất lượng tụt, mỗi clip mất tính "tự giải thích" |
| Tỉ lệ clip song ngữ | **50/50 vi–en** | 40/60 → 60/40 | Xem tỉ lệ wishlist VN vs quốc tế ở §3.3 và điều chỉnh mỗi 2 tuần |
| Ngày gửi key trước phát hành | **5 ngày** | 5–10 | Ngắn hơn 5 → streamer không kịp lên lịch. Dài hơn 10 → rò rỉ embargo |
| Ngưỡng cổng cứng tuần 12 | **2.000 wishlist** | **KHÔNG TUNE** | Đây là hằng số CANON §17. Hạ ngưỡng lúc sắp không đạt là cách tự lừa mình |
| Ngưỡng mở v2 mobile | **30.000 bản PC** | **KHÔNG TUNE** | Hằng số CANON §2 |

---

## 6. Tiêu chí đạt

**Chuẩn bị (trước tuần 9):**
- [ ] Đã đo: **40 ngày = bao nhiêu giờ thật**? Có con số, không có ước lượng
- [ ] Đã phỏng vấn **≥3 chủ xe bánh mì thật** ở TP.HCM, có bản ghi
- [ ] Đã **ký artist**: có tên, có lịch giao, có ngân sách trong hợp đồng
- [ ] Khung key art hẻm 6h sáng **đứng được một mình** (5/5 người xem đoán đúng đây là game gì)
- [ ] Đã chuyển sang **Electron** (không Tauri)

**Steam page (tuần 9):**
- [ ] Page **live**, giá **$9.99 / 59.000₫**
- [ ] Capsule **thuê riêng**, không phải artist chính vẽ
- [ ] Đã nhận **giá PPP đề xuất của Valve**, không tự nâng vùng nào
- [ ] Trailer 60s có **phụ đề burn-in**
- [ ] Mục **trợ năng liệt kê rõ** (5 nhóm + 6 công tắc của CANON §15)
- [ ] **Không hứa bất cứ tính năng nào chưa làm**

**Demo web (tuần 9):**
- [ ] itch.io live, **chơi ngay, không tải**
- [ ] Load **< 10s trên 4G**
- [ ] Chơi được **bằng một ngón cái**, vùng chạm ≥44pt
- [ ] Chơi được **không cần mạng** sau khi đã tải xong

**Phân phối VN:**
- [ ] Đã kiểm tra truy cập Steam từ **3 nhà mạng VN**, có bảng kết quả + ngày
- [ ] **Mọi** bài seeding tiếng Việt dẫn về **demo web làm link đầu**
- [ ] Đã tra **văn bản gốc** về G1–G4, có PDF lưu trong `docs/phu-luc/`
- [ ] Đã có **≥2 báo giá** tư vấn pháp lý
- [ ] Đã xác định **pháp nhân đứng tên** (công ty VN hoặc publisher có pháp nhân VN)

**Chiến dịch:**
- [ ] Đã có mặt trong **5 group/forum** ≥3 tuần trước bài post đầu tiên
- [ ] Chiến dịch **Viet Indie Week + Vietnam GameVerse gộp làm một**, có lịch 10 ngày cụ thể
- [ ] Đã gửi key cho **7 Ngày Chơi Game / Mọt Game / Phê Game** + **1–2 streamer lớn**, trước phát hành ≥5 ngày
- [ ] Đã nộp **IGVN Awards** (12/2026) và **GameHub**

**Cổng cứng (tuần 12):**
- [ ] ≥ **2.000 wishlist** → được đi tiếp
- [ ] ≥ **5.000 wishlist** → đạt mục tiêu, có tư thế đàm phán publisher

---

## 7. Rủi ro & cách bịt

| # | Rủi ro | Xác suất | Cách bịt |
|---|---|---|---|
| R1 | **Steam bị chặn ở VN → wishlist VN thấp → hiểu nhầm là game không hấp dẫn** | Cao (đã xảy ra) | Tách chỉ số VN/quốc tế ngay từ §3.3. Cổng cứng trông vào tệp quốc tế. Demo web là cổng chính cho VN |
| R2 | **Mobile v2 bị gỡ khỏi store VN vì thiếu giấy phép** | Trung bình–cao (**327 game đã bị gỡ từ 10/2025**) | B1–B6. **Không lên store VN trước khi có giấy tờ.** Kiến trúc client-only đưa game về nhóm G4 (nhẹ nhất) — giữ nguyên kiến trúc đó |
| R3 | **Wishlist thấp ở tuần 12 → phản xạ "làm thêm nội dung"** | **Rất cao** — đây là rủi ro nguy hiểm nhất của cả doc | §2.8 viết sẵn quy trình 5 bước. Vấn đề ở **hook hoặc art**, không ở nội dung. Ngưỡng 2.000 **không được tune xuống** |
| R4 | **Game bị crack ngay ngày đầu** | **Chắc chắn 100%** | §2.6. Không chi cho DRM. Chi cho lồng tiếng thật + credits + ship trọn vẹn |
| R5 | **Bị đánh giá là "mobile port" vì giá rẻ** | Trung bình | Đây chính là lý do chọn $9.99 chứ không $6.99 (Sarah). Kèm theo: capsule và screenshot phải trông như game PC, không dùng UI kiểu mobile trong ảnh chụp Steam |
| R6 | **Seeding vào group bị coi là spam → bị cấm** | Trung bình | Có mặt ≥3 tuần trước khi post. Post **nội dung nghề** vào Hội Làm Game VN, không post trailer. voz: tông tự trào, không xin xỏ |
| R0.5 | **Publisher ép Early Access hoặc live ops** | Trung bình | 3 lằn ranh đỏ hợp đồng ở §2.9. Phá T4 = từ chối, kể cả khi tiền tốt |
| R8 | **Chi hết ngân sách 12 tuần rồi mới biết không qua cổng** | Cao | Bảng ngân sách tách **A (12 tuần)** và **B (sau cổng)**. Tuyệt đối không chi khoản B trước khi qua cổng |
| R9 | **Vi phạm lằn ranh đỏ CANON §14.1 trong ẢNH MARKETING** (bản đồ mua từ marketplace lọt vào background của screenshot) | Trung bình | B4 ở tuần 11: rà soát **từng asset** trong **từng ảnh chụp** sẽ đăng. Xem thêm `P6-02` §2.8 |
| R10 | **Dùng lại số liệu đã bị kiểm chứng đánh sập trong pitch/press kit** | Trung bình | Danh sách cấm ở `P6-03` §2.6. Mọi con số đưa ra ngoài phải truy được về `idea.md` §1 hoặc §17 |

---

## 8. Truy vết

| Nội dung | Nguồn |
|---|---|
| Thứ tự nền tảng web → Steam → mobile | `idea.md` §17 **XĐ4** · `CANON.md` §2 |
| Quy tắc quyết định giá $9.99 / 59.000₫ | `idea.md` §17 **XĐ2** · `CANON.md` §2 |
| Số liệu thị trường đã xác minh (How to Fish, MECCHA CHAMELEON, ReStory) | `idea.md` **Phần I §1** |
| Neo thị trường VN (Hust Banhmi 39k, Thần Trùng 75k, Tai Ương 128k), Steam VN ≈45% giá Mỹ | `idea.md` §17 XĐ2 |
| Tiệm Phở Anh Hai 650.000 lượt tải | `idea.md` §17 XĐ2 |
| Kênh phát hành, group VN, Viet Indie Week, Vietnam GameVerse, IGVN, GameHub | `idea.md` **§23 — Kênh phát hành** |
| Kế hoạch 12 tuần | `idea.md` **§23 — 90 ngày tới** |
| Cổng cứng 2.000 wishlist / mục tiêu 5.000 | `idea.md` §23 · `CANON.md` **§17** |
| Steam bị chặn ở VN · 327 game bị gỡ · G1–G4 · game sẽ bị crack | `idea.md` §23 (hai dòng ⚠️ cuối mục) |
| Ngân sách artist $1.500–2.500/tháng · capsule $800–1.200 | `idea.md` §23 (tuần 3–4, tuần 9) |
| Lập luận publisher ($6.99→$31–42k; $14.99→$46–55k) vs Kiểm chứng | `idea.md` §17 XĐ2 |
| Cắt multiplayer (ảnh hưởng tới phân loại G) | `idea.md` §16 **HT5** · §23 |
| Lằn ranh đỏ áp dụng cho marketing | `CANON.md` **§14.1** |
| Trợ năng phải liệt kê trên Steam page | `CANON.md` §15 · `idea.md` §25 |
| Số liệu bị cấm dùng lại | `idea.md` **§15** |

---

## 9. Đề xuất sửa CANON

**Đề xuất 1 — bổ sung, không sửa số.**
`CANON.md` §2 ghi *"Nền tảng v1: PC (Steam) + demo web itch.io"*. Đề xuất thêm một dòng ghi chú dưới bảng:

> *Steam đã bị chặn tại Việt Nam → demo web itch.io không chỉ là kênh marketing phụ, nó là **kênh tiếp cận duy nhất chơi được ngay** cho người chơi VN. Ràng buộc kỹ thuật kéo theo: demo web phải load <10s trên 4G và chơi được bằng một ngón cái.*

Lý do: ràng buộc này ảnh hưởng tới Phase 1 (UI hai thiết bị) và Phase 5 (tối ưu), nhưng hiện chỉ nằm trong doc P6 — các phase trước sẽ không thấy.

**Đề xuất 2 — bổ sung §17.**
Đề xuất thêm một dòng dưới mục "Cổng cứng" của `CANON.md` §17:

> *Ngưỡng 2.000 **không được hạ xuống**. Hạ ngưỡng lúc sắp không đạt là cách tự lừa mình tốn thêm 6 tháng.*

Lý do: ngưỡng hiện đã có, nhưng chưa có câu chặn việc tự nới ngưỡng — đó là thất bại phổ biến nhất của loại cổng này.
