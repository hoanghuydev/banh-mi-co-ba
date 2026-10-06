# Bánh Mì Cô Ba — Tổng quan tài liệu thiết kế

> Bạn bán bánh mì ở đầu hẻm Sài Gòn. Khách đứng cách bạn nửa mét và **nhìn thấy mọi thứ bạn làm**.

Tài liệu này là **mục lục và bản đồ đường đi**. Mọi hằng số thiết kế nằm ở [`CANON.md`](CANON.md) — đọc file đó trước, đó là nguồn sự thật duy nhất.
Nguồn gốc mọi quyết định: [`../idea.md`](../idea.md) (Phần I — research thị trường · Phần II — ràng buộc kỹ thuật + hệ NPC · Phần III — hội đồng 9 agent phản biện). **Khi mâu thuẫn, Phần III thắng.**

---

## 1. Đọc theo thứ tự nào

| Nếu bạn là… | Đọc theo thứ tự |
|---|---|
| **Lập trình viên mới vào** | `CANON.md` → P0-01 → P1-02 → P1-03 → P2-01 |
| **Writer / narrative** | `CANON.md` §3,§4,§9,§14 → P2-01 → P2-02 → P4-01 → P4-03 |
| **Artist** | `CANON.md` §14,§16 → P5-02 → P4-01 → P1-04 |
| **Producer / phát hành** | `CANON.md` §17 → P6-01 → P6-02 → P3-06 |
| **Người quyết định "có làm không"** | `CANON.md` §1,§10 → `phu-luc/A-quyet-dinh-co-che-moi.md` → P6-01 |

---

## 2. Năm trụ cột — thước đo mọi quyết định

| | Trụ cột | Cái gì sụp nếu vi phạm |
|---|---|---|
| **T1** | Khách chấm **QUÁ TRÌNH**, không chỉ chấm kết quả | Toàn bộ khác biệt cạnh tranh. Mọi game phục vụ khách khác đều chỉ chấm món cuối |
| **T2** | **Món ăn LÀ lựa chọn hội thoại** | Gameplay và narrative tách làm hai lớp dán vào nhau → đúng lỗi "NPC dễ thương nhưng giả" |
| **T3** | **Không hiện chỉ số quan hệ** | Hiện `+3 trust` là giết hết cảm giác người |
| **T4** | **Một mùa có điểm kết** | Rơi vào bẫy "vòng lặp vô tận không có điểm kết" mà người chơi cozy đang chán |
| **T5** | **Attention phải NHÌN THẤY ĐƯỢC** | Cơ chế lõi thành xổ số. 4 persona độc lập cùng cảnh báo điều này |

---

## 3. Bản đồ tài liệu

### Nền tảng
| File | Nội dung |
|---|---|
| [`CANON.md`](CANON.md) | **Hằng số dùng chung.** 11 sự kiện, 4 chiều tính cách, 12 NPC, công thức perception, lằn ranh đỏ |
| [`VAN-PHONG-UI.md`](VAN-PHONG-UI.md) | **Văn phong chữ trong game.** UI viết tiếng phổ thông, giọng Nam chỉ ở lời thoại — khuôn nút/nhãn/thông báo/hướng dẫn, bảng đổi từ |
| [`phu-luc/A-quyet-dinh-co-che-moi.md`](phu-luc/A-quyet-dinh-co-che-moi.md) | Phán quyết 4 cơ chế đề xuất thêm — chấm theo T1–T5 |
| [`phu-luc/B-bang-tra-so-lieu.md`](phu-luc/B-bang-tra-so-lieu.md) | Mọi con số gom một chỗ để tune |

### Phase 0 — Nền tảng
| File | Nội dung |
|---|---|
| [`phase-0-nen-tang/P0-01-kien-truc-ky-thuat.md`](phase-0-nen-tang/P0-01-kien-truc-ky-thuat.md) | Gỡ Colyseus, cấu trúc module, scene machine, vòng đời frame, EventBus |
| [`phase-0-nen-tang/P0-02-thoi-gian-rng-va-save.md`](phase-0-nen-tang/P0-02-thoi-gian-rng-va-save.md) | Đồng hồ game, seed cố định theo ngày, shuffle-bag, autosave sau mỗi khách |
| [`phase-0-nen-tang/P0-03-do-luong-va-cong-cu-dev.md`](phase-0-nen-tang/P0-03-do-luong-va-cong-cu-dev.md) | Telemetry, debug overlay, validator nội dung, playtest protocol |

### Phase 1 — Vertical slice *(đây là nơi dự án sống hoặc chết)*
| File | Nội dung |
|---|---|
| [`phase-1-vertical-slice/P1-01-quay-va-che-do-lam-banh.md`](phase-1-vertical-slice/P1-01-quay-va-che-do-lam-banh.md) | Quy trình làm một ổ, zone quầy, preset công thức, `FLOURISH`, thông lượng cao điểm |
| [`phase-1-vertical-slice/P1-02-he-nhan-thay-perception.md`](phase-1-vertical-slice/P1-02-he-nhan-thay-perception.md) | **Certainty tích luỹ**, bảng visibility, gaze machine, 4 state, công cụ hạ attention |
| [`phase-1-vertical-slice/P1-03-don-hang-va-delivery-diff.md`](phase-1-vertical-slice/P1-03-don-hang-va-delivery-diff.md) | Ngôn ngữ gọi món, `diff()`, **ANTICIPATED vs DISCOVERED**, luật `take(1)`, phản ứng trễ |
| [`phase-1-vertical-slice/P1-04-ui-ux-hai-thiet-bi.md`](phase-1-vertical-slice/P1-04-ui-ux-hai-thiet-bi.md) | Layout PC/mobile không fork code, vẽ gaze ra màn hình, bark bubble, icon phân biệt hình dáng |

### Phase 2 — Hệ NPC
| File | Nội dung |
|---|---|
| [`phase-2-he-npc/P2-01-rule-database-thoai.md`](phase-2-he-npc/P2-01-rule-database-thoai.md) | Rule DB kiểu Valve, chấm điểm theo số criteria, `applycontext`, `followup`, bark 3 tầng |
| [`phase-2-he-npc/P2-02-tinh-cach-va-kenh-phan-ung.md`](phase-2-he-npc/P2-02-tinh-cach-va-kenh-phan-ung.md) | 4 chiều tính cách, 5 kênh phản ứng, bảng 11 sự kiện × 12 NPC |
| [`phase-2-he-npc/P2-03-tri-nho-va-quan-he.md`](phase-2-he-npc/P2-03-tri-nho-va-quan-he.md) | 3 tầng slot, decay có sàn, trần tin tưởng vĩnh viễn, lịch sinh hoạt |
| [`phase-2-he-npc/P2-04-don-thoi-va-nho-nham.md`](phase-2-he-npc/P2-04-don-thoi-va-nho-nham.md) | Mutation graph, cap 2–3 hop, **nghe lỏm là điều kiện tồn tại**, đồ thị quan hệ NPC |
| [`phase-2-he-npc/P2-05-so-tay-co-ba.md`](phase-2-he-npc/P2-05-so-tay-co-ba.md) | Mặt phẳng để người chơi NHẬN RA hệ thống. Game log dữ liệu thô, người chơi viết diễn giải |
| [`phase-2-he-npc/P2-06-flow-tro-chuyen.md`](phase-2-he-npc/P2-06-flow-tro-chuyen.md) | **Flow trò chuyện v2** — hai kênh chia theo "có ai đang chờ không", bỏ đóng băng đồng hồ, NPC phải nói trước. Hồ sơ rà soát gốc ở [`audit/flow-tro-chuyen/`](audit/flow-tro-chuyen/README.md) |
| [`phase-2-he-npc/P2-07-neo-thoai-vao-the-gioi.md`](phase-2-he-npc/P2-07-neo-thoai-vao-the-gioi.md) | **Hợp đồng ba phần** của một câu nói — `need` (ẩn) · `while` ("?") · `does` + `forSec`. Lời hứa có hạn, trí nhớ bốn tầng |
| [`phase-2-he-npc/P2-08-viec-can-lam.md`](phase-2-he-npc/P2-08-viec-can-lam.md) | Năm danh sách rút từ bản rà đủ 1.534 nút: 374 `SỬA` · 202 `CẦN CODE` · 2 `XOÁ`. Hồ sơ rà gốc ở [`audit/thoai/`](audit/thoai/) |
| [`phase-2-he-npc/P2-09-kien-truc-giao-tiep.md`](phase-2-he-npc/P2-09-kien-truc-giao-tiep.md) | **Kiến trúc giao tiếp** — gộp ba từ vựng thành một bảng đen, thế giới chào hàng (Sims), trí nhớ có truy hồi (`recency + importance + relevance`), bảy khung cảnh thay kho `ANY`, hồ sơ giao tiếp 12 NPC. Nghiên cứu nền ở [`audit/giao-tiep/`](audit/giao-tiep/research-ai-npc.md) |
| [`phase-2-he-npc/P2-10-ke-hoach-ra-noi-dung.md`](phase-2-he-npc/P2-10-ke-hoach-ra-noi-dung.md) | **Kế hoạch rà 1.595 nút thoại** — sáu bước cho một file, thứ tự 14 file còn lại, việc code còn nợ. `qua-duong` đã xong (63,4% neo), mười bốn file còn ở 2–15% |

### Phase 3 — Kinh tế
| File | Nội dung |
|---|---|
| [`phase-3-kinh-te/P3-01-vong-mot-ngay.md`](phase-3-kinh-te/P3-01-vong-mot-ngay.md) | 4 pha một ngày, thông lượng 6h30–8h, mở hàng / đốt vía |
| [`phase-3-kinh-te/P3-02-nguon-hang-va-nha-cung-cap.md`](phase-3-kinh-te/P3-02-nguon-hang-va-nha-cung-cap.md) | **Nhà cung cấp là NPC** — tái dùng engine tính cách. 4 lò bánh mì, 8 trục quyết định mỗi sáng |
| [`phase-3-kinh-te/P3-03-ton-kho-han-dung-du-bao-cau.md`](phase-3-kinh-te/P3-03-ton-kho-han-dung-du-bao-cau.md) | Hạn dùng, đồ chua càng ngâm càng ngon, dự báo cầu từ lịch NPC, sổ nợ |
| [`phase-3-kinh-te/P3-04-thiet-bi-va-nang-cap.md`](phase-3-kinh-te/P3-04-thiet-bi-va-nang-cap.md) | **Trục B** — 16+ thiết bị, mỗi cái có mặt trái, sức chứa xe hữu hạn |
| [`phase-3-kinh-te/P3-05-cho-dung-va-mo-rong.md`](phase-3-kinh-te/P3-05-cho-dung-va-mo-rong.md) | Đổi chỗ đứng của **một** cái xe, không phải chuỗi. Chi phí là quan hệ, không phải tiền |
| [`phase-3-kinh-te/P3-06-nghia-vu-va-fail-mem.md`](phase-3-kinh-te/P3-06-nghia-vu-va-fail-mem.md) | Tiền thuê chỗ, hụi, fail mềm nhưng vĩnh viễn, bảng cân đối 40 ngày |

### Phase 4 — Nội dung
| File | Nội dung |
|---|---|
| [`phase-4-noi-dung/P4-01-dan-nhan-vat.md`](phase-4-noi-dung/P4-01-dan-nhan-vat.md) | Hồ sơ 12 NPC + cô Ba. Chống rập khuôn |
| [`phase-4-noi-dung/P4-02-cau-truc-mua-40-ngay.md`](phase-4-noi-dung/P4-02-cau-truc-mua-40-ngay.md) | Lịch 40 ngày, 4 hồi, **báo trước 3–4 ngày khi NPC sắp biến mất** |
| [`phase-4-noi-dung/P4-03-su-kien-va-arc.md`](phase-4-noi-dung/P4-03-su-kien-va-arc.md) | 30+ sự kiện nội dung, món ăn thay dialogue tree, arc từng nhân vật |
| [`phase-4-noi-dung/P4-04-ket-game.md`](phase-4-noi-dung/P4-04-ket-game.md) | **Cú quay lại ngày 40.** Mọi ending đều tử tế, chỉ khác ai còn ở đó |
| [`phase-4-noi-dung/P4-05-co-che-van-hoa-va-lan-ranh-do.md`](phase-4-noi-dung/P4-05-co-che-van-hoa-va-lan-ranh-do.md) | Đốt vía, sổ nợ, QR, **lằn ranh đỏ**, đề cương phỏng vấn chủ xe thật |

### Phase 5 — Hoàn thiện
| File | Nội dung |
|---|---|
| [`phase-5-hoan-thien/P5-01-tro-nang.md`](phase-5-hoan-thien/P5-01-tro-nang.md) | 5 nhóm bắt buộc + 6 công tắc. Typography tiếng Việt |
| [`phase-5-hoan-thien/P5-02-art-va-animation.md`](phase-5-hoan-thien/P5-02-art-va-animation.md) | Bảng màu xanh xám, layered sprite 216 trạng thái từ 18 file, key art, capsule |
| [`phase-5-hoan-thien/P5-03-am-thanh.md`](phase-5-hoan-thien/P5-03-am-thanh.md) | 5 bus, tiếng rao, lồng tiếng người thật |
| [`phase-5-hoan-thien/P5-04-can-bang-va-chong-an-gian.md`](phase-5-hoan-thien/P5-04-can-bang-va-chong-an-gian.md) | 12 lỗ hổng, quy trình cân bằng, playtest protocol |

### Phase 6 — Phát hành
| File | Nội dung |
|---|---|
| [`phase-6-phat-hanh/P6-01-chien-luoc-phat-hanh.md`](phase-6-phat-hanh/P6-01-chien-luoc-phat-hanh.md) | Web → Steam → Mobile. Quy tắc giá. Steam bị chặn tại VN. Kế hoạch 12 tuần |
| [`phase-6-phat-hanh/P6-02-marketing-va-noi-dung-viral.md`](phase-6-phat-hanh/P6-02-marketing-va-noi-dung-viral.md) | Clip 15s đã chốt, capsule art, 36 ý tưởng clip, Steam page |
| [`phase-6-phat-hanh/P6-03-lo-trinh-sau-phat-hanh.md`](phase-6-phat-hanh/P6-03-lo-trinh-sau-phat-hanh.md) | v2 mobile, multiplayer đã cắt, game thứ hai, bài học ghi lại |

---

## 4. Bốn cơ chế được đề xuất thêm — phán quyết tóm tắt

| Cơ chế | Phán quyết | Một dòng |
|---|---|---|
| **Mua thiết bị / nâng cấp** | ✅ **NHẬN** | Chính là Trục B. Là bể chứa tiền duy nhất đáng tin. Điều kiện: mỗi thiết bị phải **nhìn thấy được trên xe** và **có mặt trái** |
| **Nguồn hàng nhiều mức giá** | ✅ **NHẬN, MỞ RỘNG** | Vá trực tiếp lời phê *"vòng kinh tế có đúng 1 quyết định"*. Nhà cung cấp là NPC → tái dùng nguyên engine tính cách/trí nhớ/đồn thổi |
| **Mở rộng nơi bán** | ⚠️ **NHẬN CÓ ĐIỀU KIỆN** | Đổi **chỗ đứng của một cái xe**, KHÔNG phải chuỗi cửa hàng. Hai quầy song song = người chơi không ở đâu cả = T1 sụp |
| **Thuê nhân viên** | ❌ **TỪ CHỐI** | Người chơi là **người bị nhìn**. Nhân viên làm bánh = không còn ai để nhìn → **T1 và T2 sụp cùng lúc**. Automation là cơ chế của tycoon/idle, ngược hoàn toàn với "khách đứng cách bạn nửa mét" |

**Phương án thay cho "thuê nhân viên": người phụ việc KHÔNG CHẠM VÀO BÁNH.**
Cô Ba đứng tiếp khách vài phút → chuyển ánh nhìn của một khách sang cô → đây là một **công cụ hạ attention**, tức là cơ chế **cộng thêm** chứ không **thay thế**. Bé Su phụ bưng ghế lau bàn → giảm độ bẩn quầy. Và sự kiện **"khách tự đứng bán hộ"** — chuyện có thật ở VN — cho đúng cái cảm giác "có người phụ" mà không phá trụ cột nào.
**Luật cứng: không NPC nào được phép thực hiện thao tác làm bánh.**

Chi tiết đầy đủ: [`phu-luc/A-quyet-dinh-co-che-moi.md`](phu-luc/A-quyet-dinh-co-che-moi.md).

---

## 5. Những thứ đã bị CẮT — không thương lượng lại

| Cắt | Vì sao |
|---|---|
| ❌ Co-op / multiplayer / Colyseus | *"'netcode đã có' là câu nói của người chưa ship multiplayer."* Cùng dev cùng hype: Bad Parenting 97% → Night Shippers (co-op 8 người) 76% |
| ❌ Mobile khỏi v1 | PC/Steam là nơi **tạo tiếng vang**, mobile là nơi **có tiền**. Đừng đảo ngược |
| ❌ Tauri → dùng **Electron** | Tauri dùng WebView hệ thống → render khác nhau mỗi máy, Steam Overlay/Input hay lỗi |
| ❌ 24 sự kiện → **11** | Cắt bề rộng, giữ chiều sâu. 11 cái đó phải có đủ 5 kênh phản ứng |
| ❌ 6 chiều tính cách → **4** | *"6 chiều × nhớ nhầm × đồn thổi = ba tầng nhiễu chồng lên nhau"* |
| ❌ Nhớ nhầm random 10% | Người chơi không phân biệt được "thiết kế tinh vi" với "code lỗi". Chỉ giữ nhớ nhầm **qua đồn thổi truy vết được** |
| ❌ Xác suất ở tầng nhận thấy | Thay bằng **certainty tích luỹ**. *"Player perception should win over simulation accuracy"* |
| ❌ **Nút "nhặt bánh dưới đất lên dùng tiếp"** | Không bao giờ thưởng cho gian dối vệ sinh. Rớt = bắt buộc bỏ, làm lại. **Rủi ro chuyển từ đạo đức sang vận hành** |

---

## 5.1. CANON đã được sửa sau khi viết xong bộ doc — 6 mục

Các doc chi tiết tìm ra mâu thuẫn trong chính `CANON.md` bản đầu. Đã sửa, ghi lại ở đây để không ai đọc bản cũ trong đầu:

| # | Sửa gì | Vì sao |
|---|---|---|
| 1 | **§12.6 — mốc đồn thổi đổi từ "2 giờ chơi" sang NGÀY**: `GOSSIP_START_DAY = 4`, `MUTATION_START_DAY = 8` | Bản đầu sai số học: với ~10 phút/ngày, "2 giờ chơi" ≈ **ngày 12** → **bản demo web sẽ không có đồn thổi gì cả**, mà demo web là kênh marketing chính và đồn thổi chính là USP |
| 2 | **§3.4 — thêm sự kiện `REFUSED_SERVICE`** (salience 85) | Lỗ hổng ăn gian §8k (từ chối phục vụ người "soi") **chưa thực sự được bịt** vì không có sự kiện nào biểu diễn nó |
| 3 | **§8.1 — thêm 4 LUẬT kỹ thuật** (cấm `Math.random()` ngoài `core/rng.ts` · cấm hiện `certainty` dạng số/thanh · Luật NV-0 · `stimId` một nguồn) | Cả bốn đều là **điều kiện sống** của một cơ chế lõi, nhưng trước đó chỉ tồn tại như suy luận, không như ràng buộc |
| 4 | **§13.1 — BẢNG NGHĨA VỤ HỢP NHẤT** | Bốn doc P3 viết song song lệch nhau (thuê chỗ 6.600k vs 1.680k). Đã hợp nhất về **thuê chỗ theo NGÀY** + **rút về nhà 150k/ngày**, và quét sạch con số cũ khỏi cả 6 doc P3 |
| 5 | **§4 — chốt công thức `traitMul = 0.65 + 0.70 · soi`** + 2 ràng buộc kỹ thuật | `deTha` và `thanThien` phải giữ **độc lập** (gộp = mở lại lỗ hổng §8b); ô "im lặng biến mất" chỉ cấp cho **đúng một người** |
| 6 | **§14.2 (đề xuất) — Culture lead có quyền VETO** | §14.1 liệt kê lằn ranh đỏ nhưng **không nói ai chặn được build**. Chi tiết ở `P4-05` §2.8 |

---

## 6. Cổng kiểm tra — nơi dự án được phép dừng

| Cổng | Tiêu chí | Không đạt thì làm gì |
|---|---|---|
| **Sau Phase 1** | Gửi **10 người lạ** chơi vertical slice 20 phút, quay màn hình. Câu hỏi duy nhất: **"Bạn có biết vì sao khách đó giận không?"** — **≥7/10 trả lời đúng** | Dưới 7/10 = hệ thống chưa đọc được. **Không lượng thoại nào cứu được nó.** Quay lại sửa tầng hiển thị attention |
| **Đo thời lượng** | 40 ngày = **bao nhiêu giờ thật**? | Dưới 4 giờ → giảm số ngày, tăng mật độ. *"Nếu bạn chưa đo, bạn chưa thiết kế"* |
| **Key art** | Một khung hẻm Sài Gòn 6 giờ sáng **đứng được một mình** | Không làm gì khác cho tới khi khung đó đẹp |
| **Tuần 12** | **5.000 wishlist** (mục tiêu) · **2.000** (sàn) | Dưới 2.000 → **DỪNG LẠI.** Vấn đề ở hook hoặc art, không ở việc chưa làm đủ nội dung |

---

## 7. Việc phải làm ngay tuần 1

**Phỏng vấn 3–5 chủ xe bánh mì thật ở TP.HCM**, 30 phút mỗi người. Lấy chính xác: câu thoại khách hay nói, quy trình làm một ổ, tình huống "khách khó" thật.
Đây là thứ **không nguồn online nào thay được**, và là lợi thế duy nhất so với các dự án cùng đề tài. Đề cương phỏng vấn đầy đủ + mẫu biên bản ở [`phase-4-noi-dung/P4-05-co-che-van-hoa-va-lan-ranh-do.md`](phase-4-noi-dung/P4-05-co-che-van-hoa-va-lan-ranh-do.md) §2.10.

### 7.1. Hai hạng mục ĐANG CHẶN — cần một quyết định của người, không phải thêm tài liệu

| # | Hạng mục | Chặn cái gì | Vì sao không tự giải quyết được |
|---|---|---|---|
| **B1** | **Chưa có Chủ biên văn hoá người Việt CÓ QUYỀN PHỦ QUYẾT** | Toàn bộ P4, và mọi build gửi ra ngoài | `CANON.md` §14.1 liệt kê 7 lằn ranh đỏ nhưng **không chỉ định ai chặn được build**. Một "cultural consultant" không có quyền veto là một cái tên để trưng — và đó chính xác là thứ lằn ranh R5 (credits) tồn tại để chống. Hai lằn ranh **LR-1 (bản đồ/chủ quyền)** và **LR-4 (chiến tranh)** chặn build tự động, nhưng 5 cái còn lại cần một con người |
| **B2** | **Chưa đo `T_ngày` bằng 10 người lạ** | Việc viết 40 file day-spec của P4-02 | Con số **6,8 giờ** hiện tại là **TÍNH RA từ `TIME_SCALE_BASE = 30`, không phải ĐO ĐƯỢC**. Viết 40 ngày nội dung trước khi đo là rủi ro phải bỏ đi. Nếu kết quả dưới 4 giờ: **ưu tiên tăng mật độ, giữ 40 ngày**; nếu buộc phải nén số ngày thì **số ngày báo trước khi NPC biến mất giữ nguyên tuyệt đối** — đó là phanh của phán quyết XĐ3, nén nó là biến bi kịch thành trò đểu |

---

## 8. Lằn ranh đỏ — đọc trước khi viết dòng code hay vẽ pixel đầu tiên

- 🔴 **Bản đồ / chủ quyền** — mọi bản đồ, địa cầu, poster du lịch, tờ lịch có hình → **TỰ VẼ**. Không bao giờ mua asset pack.
- 🔴 **Làm sai món Việt** — người Việt cười người Việt, không phải game cười người Việt.
- 🔴 **Hạ thấp nghề** — xe bánh mì là nghề đáng tự hào, tảo tần, có phẩm giá.
- 🔴 **Chiến tranh — KHÔNG MỘT CHỮ.**
- 🔴 **Credits** — người Việt viết văn hoá đứng **ĐẦU**, không phải dòng "cultural consultant" ở cuối.
- 🔴 **Người phán xét vệ sinh LUÔN LUÔN là người Việt.**
- 🟡 **Tâm linh** — tông trìu mến / tự trào, không phải hệ ma thuật có tác dụng cơ học rõ ràng.

Chi tiết và tiền lệ thật: [`CANON.md`](CANON.md) §14.1 và [`phase-4-noi-dung/P4-05-co-che-van-hoa-va-lan-ranh-do.md`](phase-4-noi-dung/P4-05-co-che-van-hoa-va-lan-ranh-do.md).
