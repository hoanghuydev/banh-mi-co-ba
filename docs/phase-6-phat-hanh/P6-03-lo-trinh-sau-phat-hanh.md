# P6-03 — Lộ trình sau phát hành

> ## ⚡ REVAMP 2026-10-20 — ⚠️ CHẾT MỘT PHẦN
> Căn cứ: [`CANON.md`](../CANON.md) bản revamp + [`revamp/00-YEU-CAU.md`](../revamp/00-YEU-CAU.md). Phần ☠️ không dùng làm căn cứ.
>
> | Mục | Trạng thái | Lý do / thay bằng |
> |---|---|---|
> | §1, §2.1.1, §2.5, §3.1 `forbidden`: T4 làm căn cứ cấm EA/live ops/season | 🔁 | T4 chết; còn cấm daily login/stamina (CANON §1, dòng T4). Phần còn lại chờ chủ dự án chốt |
> | §2.1.2 IAP: luật "không đổi số trong `memory.ts`/`gossip.ts`", "trang trí xe bánh mì" | 🔁 | Đổi thành `review`/sao + `econ`; xe → quán (R0.5) |
> | §2.1.3 + §4 sổ tay là cứu cánh trên mobile | ☠️ | Sổ tay chết; app sao đã là UI điện thoại |
> | §2.3 bản mở rộng: tái dùng memory/gossip, "mùa mới có điểm kết", `STANDALONE_SEASON` | 🔁 | Game giờ chơi vô hạn tới thắng/thua; engine tái dùng là perception + review + nhà cung cấp |
> | §2.4 game thứ hai: dùng memory core slot, "2–3 lần/mùa 40 ngày" · §5 tần suất | 🔁 | Hết memory và mùa — viết lại cơ chế nếu giữ ý tưởng |
>
> **Còn dùng được:** §2.2 phán quyết cắt multiplayer, mobile F2P + IAP cosmetic, §2.5 hậu mãi/trả lời review, §2.6 bài học + quy trình kiểm chứng số, cổng kích hoạt bằng hằng số.

**Thuộc phase:** P6 — Phát hành (phần hậu phát hành)
**Phụ thuộc:** `P6-01-chien-luoc-phat-hanh.md` (thứ tự nền tảng, cổng cứng, cấp phép G1–G4) · `P6-02-marketing-va-noi-dung-viral.md` (luật không hứa cái chưa làm) · `CANON.md` §1 (T4), §2 (mobile là v2 sau 30k bản), §9 (12 NPC), §10 (4 cơ chế được đề xuất thêm), §14.1
**Trạng thái:** **Chốt** về nguyên tắc và điều kiện kích hoạt · **Còn mở** về chi tiết thực hiện (§2.1.3 danh sách việc phải làm lại cho mobile cần nối với doc UI hai thiết bị của Phase 1 khi doc đó hoàn thành).

---

## 1. Mục tiêu

Ghi ra **trước** những gì sẽ xảy ra sau ngày phát hành, để không ai phải ra quyết định lớn trong lúc đang mệt, đang vui vì bán được, hay đang hoảng vì review xấu.

- Bảo vệ **T4** (một mùa có điểm kết) qua khỏi thời điểm nguy hiểm nhất của nó: **ngay sau khi game bán được**. Đó là lúc mọi người sẽ đề nghị thêm live ops, thêm season, thêm daily.
- Đặt **điều kiện kích hoạt bằng số** cho từng hướng mở rộng, thay vì để hướng nào ồn nhất thì thắng.
- Ghi lại **bài học sai lầm về số liệu** thành một quy trình có thể áp dụng cho dự án sau — vì đó là tài sản giá trị nhất mà đợt nghiên cứu này tạo ra.

---

## 2. Cơ chế

### 2.1. v2 Mobile — F2P + IAP cosmetic

#### 2.1.1. Điều kiện kích hoạt — cổng số, không phải cảm giác

```
Bán được 30.000 bản PC   →  mở v2 mobile
Dưới 30.000 bản          →  KHÔNG mở. Không bàn lại. Không "thử một bản nhỏ"
```

**Vì sao đúng 30.000, và vì sao không được nới:** mobile v2 đòi hỏi làm lại UI, cấp phép G1–G4 (xem §2.1.4), và một hệ IAP cosmetic — đó là **một dự án con**, không phải một bản port. 30.000 bản là mức chứng minh rằng **game này có khán giả**, chứ không phải nhóm này có một tệp bạn bè. Mở v2 với 8.000 bản là lấy tiền của bản PC đi làm một canh bạc thứ hai.

#### 2.1.2. Mô hình tiền — và ba thứ bị cấm tuyệt đối

| Thành phần | Quyết định |
|---|---|
| **Giá tải về** | **Miễn phí (F2P)** |
| **Nguồn thu** | **IAP cosmetic** — và chỉ cosmetic |
| **Vì sao F2P mà không premium** | Premium mobile là nghĩa địa (`P6-01` §2.1). Tệp Ngọc Ánh: 19 tuổi, Redmi + 4G, không thẻ tín dụng. **IAP mobile VN +83% YoY** — tiền ở đó, nhưng chỉ chảy qua đường IAP |

**Ba thứ bị cấm — vi phạm là phá T4, không phải là tranh luận thiết kế:**

| ⛔ Cấm | Vì sao cấm | Nếu ai đề xuất thì trả lời thế nào |
|---|---|---|
| **Pay-to-win** | Bất cứ thứ gì trả tiền để khách bớt soi, bớt giận, hoặc nhớ tên giùm bạn → **phá T1 và T5 cùng lúc**. Toàn bộ game là việc bạn tự chịu hậu quả của việc bạn làm | *"Nếu trả tiền mua được sự tha thứ của bà Bảy thì bà Bảy không còn là người nữa."* |
| **Stamina / năng lượng** | **T4 nói thẳng: không stamina.** Và đây đúng là thứ `idea.md` §2.4 gọi là *"mobile trap with prettier wallpaper"* — lời than phiền mà cả dự án này được sinh ra để trả lời | *"Chúng ta đã viết trong mô tả Steam rằng game này không có stamina. Người mua bản PC sẽ đọc được tin này."* |
| **Daily login** | **T4.** Và nó mâu thuẫn trực tiếp với "một mùa 40 ngày có điểm kết": daily login là cơ chế **không cho phép kết thúc** | *"Game này có ngày 40. Daily login là lời hứa rằng không bao giờ có ngày 40."* |

**Cosmetic được bán cái gì — danh sách trắng:**

| Loại | Ví dụ | Vì sao an toàn |
|---|---|---|
| **Bộ áo / tạp dề cho người chơi** | tạp dề hoa, áo bà ba, áo sơ mi cũ | Không ai nhìn thấy nó ảnh hưởng tới bánh |
| **Trang trí xe bánh mì** | bảng hiệu khác, đèn dây, chậu trầu bà treo thêm | Không đổi `visibility`, không đổi `zone` |
| **Bộ dụng cụ đổi hình thức** | dao khác, thớt khác, hũ đũa khác | ⚠️ **Chỉ được đổi hình, không được đổi tốc độ hay độ chính xác.** Nếu một con dao đẹp cắt nhanh hơn → thành pay-to-win |
| **Bộ màu / bộ nhạc nền** | tông chiều, tông mưa | Thuần thẩm mỹ |
| **Ủng hộ có tên trong credits** | gói "cảm ơn" | Nối với chiến lược §2.6 của `P6-01`: lý do cảm xúc để trả tiền |

> **Luật một dòng:** nếu một món IAP làm đổi **bất kỳ con số nào** trong `perception.ts`, `memory.ts`, `gossip.ts`, hoặc `econ/`, thì nó không phải cosmetic.

#### 2.1.3. Những gì phải LÀM LẠI cho mobile

> ⚠️ **Mục này nối trực tiếp vào doc UI hai thiết bị của Phase 1.** Ở đó đã có bố cục dọc/ngang dùng chung một scene Phaser, đổi layout theo `scale.orientation`, **không fork code**. Danh sách dưới đây là phần **không** được doc Phase 1 phủ — và phải được doc Phase 1 đọc lại khi v2 được kích hoạt.

| # | Hạng mục | Làm lại cái gì | Rủi ro nếu bỏ qua |
|---|---|---|---|
| 1 | **Thao tác** | **Chạm-để-đặt là mặc định trên mobile**, không phải tuỳ chọn. Vùng chạm **≥44pt**. Nút Hoàn tác luôn hiện. Một bước xác nhận trước khi đưa bánh | Kéo-thả trên màn hình 6 inch với 8 nguyên liệu = không chơi được bằng một ngón cái |
| 2 | **Đọc được ánh mắt** | Đây là hạng mục **khó nhất**. Cả game dựa vào việc người chơi **đọc được hướng nhìn của khách** (CANON §5). Trên màn hình dọc nhỏ, khuôn mặt khách chiếm ít pixel hơn nhiều | **Nếu không đọc được ánh mắt thì T5 sụp và cơ chế lõi thành xổ số.** Phải test lại toàn bộ bảng `visibility` trên thiết bị thật, không test trên trình duyệt thu nhỏ |
| 3 | **Phiên chơi ngắn** | Ngọc Ánh chơi **5 phút/lần, ngắt quãng**. Autosave **sau mỗi khách** (đã có trong CANON §2) là điều kiện cần, nhưng chưa đủ: cần **màn hình "lần trước bạn đang làm gì"** khi mở lại | Mở app ra không nhớ mình đang ở đâu → bỏ game |
| 4 | **Sổ tay** | Trên mobile, sổ tay là **cứu cánh chính** — người chơi ngắt quãng không nhớ mặt khách gặp 5 ngày trước (HT2). Cần mục *"lâu rồi không thấy ghé"* nổi bật hơn bản PC | Không có thì cơ chế "khách im lặng biến mất" trở thành vô hình → mất trái tim của game |
| 5 | **Hiệu năng** | Mục tiêu **Redmi + 4G**. Nền bake vào RenderTexture (CANON §2), 30fps mục tiêu. Cắt hiệu ứng nền nếu cần | Tệp mobile VN đông nhất là tệp máy yếu nhất |
| 6 | **Hệ IAP + cửa hàng cosmetic** | Hoàn toàn mới. Không tồn tại trong v1 | — |
| 7 | **Cấp phép G1–G4 + pháp nhân VN** | Xem §2.1.4 | **Bị gỡ khỏi store** |
| 8 | **Lồng tiếng — dung lượng** | Lồng tiếng người thật là tài sản lớn nhất của game và cũng là phần nặng nhất của bundle | Bundle quá lớn → tỉ lệ cài đặt tụt trên 4G |

**Nguyên tắc chống trôi thiết kế:** v2 **không được thêm cơ chế mới**. v2 là **cùng một game, chơi được bằng một ngón cái**. Mọi đề xuất kiểu *"trên mobile nên có thêm..."* bị từ chối mặc định.

#### 2.1.4. Thời điểm ra mắt: **TRƯỚC TẾT**

| Bằng chứng | Chi tiết |
|---|---|
| **Corochti** | **Top App Store 2 tuần** khi ra **trước Tết 2025** |

**Vì sao thời điểm này quan trọng hơn bình thường với game này:** Tết là lúc người Việt ở nhà, cầm điện thoại, và ở trong đúng tâm trạng mà game này nói tới — hẻm, hàng xóm, người quen, chuyện ai nhớ ai. Một game về **xe bánh mì đầu hẻm** ra vào dịp Tết không chỉ trúng lịch tải app, nó trúng **tâm trạng**.

**Lịch ngược từ Tết (đây là ràng buộc cứng, không phải mong muốn):**

| Mốc | Việc | Vì sao ở đó |
|---|---|---|
| **Tết − 6 tháng** | Đạt mốc **30.000 bản PC**? Nếu chưa → **hoãn sang Tết năm sau**, không ép | Không có cổng thì không có kỷ luật |
| **Tết − 5 tháng** | Bắt đầu hồ sơ cấp phép + pháp nhân VN (`P6-01` §2.4.2, B1–B6) | Hồ sơ là đường găng dài nhất, không phải code |
| **Tết − 4 tháng** | Bắt đầu làm lại UI mobile (hạng mục 1–5 ở §2.1.3) | |
| **Tết − 2 tháng** | Hệ IAP cosmetic + test trên thiết bị thật (Redmi, không phải emulator) | |
| **Tết − 1 tháng** | **Phải có giấy tờ trong tay.** Không có → **không lên store VN**, không có ngoại lệ | **327 game đã bị gỡ khỏi App Store & Google Play từ 10/2025** |
| **Tết − 2 tuần** | Ra mắt | Đúng cửa sổ Corochti |

---

### 2.2. Multiplayer / co-op — đã bị cắt, và điều kiện để bàn lại

#### 2.2.1. Trạng thái hiện tại: **CẮT KHỎI v1 VÀ KHỎI PITCH DECK** (HT5)

Đây không phải "để sau". Đây là **xoá khỏi tài liệu**, vì sự tồn tại của nó trong pitch deck đã là một tín hiệu xấu.

| Agent | Lập luận |
|---|---|
| **Publisher** | *"'netcode đã có' là câu nói của người chưa ship multiplayer. Xoá khỏi pitch deck."* |
| **Phản biện** | Colyseus cho game một người = **tiền hosting vĩnh viễn** + **ngày server chết là ngày game chết** |
| **Cộng đồng VN** | **Bằng chứng số — cùng dev, cùng hype:** *Bad Parenting* **97% tích cực** → *Night Shippers* (co-op 8 người) tụt xuống **76%** |

**Bằng chứng số này là loại bằng chứng mạnh nhất có thể có**, vì nó khử được gần hết biến nhiễu: cùng một đội, cùng một cộng đồng, cùng một đợt hype, chỉ khác một biến — thêm co-op. Kết quả: **−21 điểm phần trăm** review tích cực.

**Ba lý do bổ sung riêng cho game này — co-op không chỉ khó, nó SAI về thiết kế:**

| # | Lý do | Trụ cột bị phá |
|---|---|---|
| 1 | **Người chơi là người BỊ NHÌN.** Nếu có hai người, ánh mắt của khách chia cho ai? Khách nhìn thấy lỗi của người kia thì ai chịu hậu quả? | **T1** |
| 2 | Cùng logic với phán quyết **từ chối "thuê nhân viên"** (CANON §10): *"nhân viên làm bánh = không còn ai để nhìn → T1 và T2 sụp cùng lúc."* **Người chơi thứ hai là một nhân viên có ý chí riêng** — nặng hơn nhân viên NPC, không nhẹ hơn | **T1 + T2** |
| 3 | **Lợi ích pháp lý ngoài dự kiến:** kiến trúc client-only, không server đưa game về **nhóm G4** (nhẹ nhất). Thêm multiplayer qua máy chủ → **nhóm G1** (nặng nhất, cần giấy phép riêng + phê duyệt nội dung kịch bản từng game). Xem `P6-01` §2.4.2 | — |

#### 2.2.2. Nếu sau này vẫn muốn làm — **sáu điều kiện phải thoả TRƯỚC**

Không phải để mở đường. Để bất cứ ai đề xuất lại cũng phải đi qua sáu cái cổng này.

| # | Điều kiện | Đo bằng gì |
|---|---|---|
| 1 | **v1 đã ship trọn vẹn và đạt ≥90% review tích cực trên Steam** sau ≥6 tháng | Steam review score, không phải cảm giác |
| 2 | **v2 mobile đã ra và ổn định** ≥3 tháng | Crash rate, retention |
| 3 | Có câu trả lời **viết ra được** cho câu hỏi: *"khách nhìn ai?"* — và câu trả lời đó **không phá T1** | Một trang thiết kế, có người phản biện ký |
| 4 | Có **ít nhất một người trong nhóm đã ship một game multiplayer** trước đó | Tên game, link store |
| 5 | Có **ngân sách hosting cho 3 năm** nằm sẵn trong tài khoản, và có **kế hoạch cho ngày tắt server** (bản offline vĩnh viễn) | Con số + văn bản |
| 6 | Đã kiểm tra lại **phân loại G** với luật sư: co-op qua máy chủ có đẩy game sang G1 không, và chi phí hồ sơ G1 là bao nhiêu | Văn bản tư vấn |

**Nếu thiếu bất kỳ điều nào trong sáu điều → không làm.** Và cho tới khi đủ cả sáu: **không nhắc tới co-op trong bất kỳ tài liệu marketing nào** (`P6-02` §2.8, cấm bổ sung #2).

---

### 2.3. Bản mở rộng có thể có — đánh giá theo khả năng tái dùng engine

**Bảng xếp hạng gốc theo 4 ràng buộc (`idea.md` §11):**

| Ý tưởng | 2.5D | Mobile | VN | NPC nhìn quá trình | Hạng |
|---|---|---|---|---|---|
| **Xe bánh mì đầu hẻm** | ✅ | ✅ | ✅✅ | ✅✅ khách đứng sát, thấy hết | **🥇** (đang làm) |
| **Quán trà sữa trước cổng trường** | ✅ | ✅✅ | ✅ | ✅✅ + topping = hệ sai sót tự nhiên | **🥈** |
| **Cà phê vợt / cà phê cóc vỉa hè** | ✅ | ✅ | ✅✅ | ✅ khách ngồi lâu, nói nhiều | **🥉** |

#### 2.3.1. Đánh giá theo chi phí thật — cái nào tái dùng được engine, cái nào phải làm lại

| Hệ thống | **Trà sữa 🥈** | **Cà phê vợt 🥉** |
|---|---|---|
| `sim/perception.ts` (bảng `visibility`, `certainty`) | ✅ **Tái dùng nguyên** — khách vẫn đứng sát quầy | ⚠️ **Phải làm lại một phần.** Khách **ngồi**, không đứng. Cần thêm zone `SEATED_NEAR` và chỉnh lại toàn bộ cột `visibility` |
| `sim/memory.ts`, `sim/gossip.ts` | ✅ **Tái dùng nguyên** | ✅ **Tái dùng nguyên** — và mạnh hơn: khách ngồi lâu, **nghe lỏm được nhiều hơn** |
| `dialog/ruledb.ts` + rule DB | ✅ Tái dùng engine, viết nội dung mới | ✅ Tái dùng engine, viết nội dung mới |
| `craft/assembly.ts` + `diff.ts` | ✅ **Tái dùng rất tốt.** Topping trà sữa = **hệ sai sót tự nhiên**, nhiều tổ hợp hơn bánh mì (đường %, đá %, trân châu, thạch...) → delivery-diff có **nhiều thứ để diff hơn** | ⚠️ **Yếu.** Cà phê vợt có ít biến số: đậm/nhạt, đá/nóng, sữa/đen. **Ít lỗi có thể xảy ra trước mặt khách** → T1 mỏng đi |
| `econ/` (hạn dùng, giá chợ, thông lượng giờ cao điểm) | ✅ Tái dùng. Cao điểm = **giờ tan học**, rõ ràng và dễ đọc hơn giờ đi làm | ✅ Tái dùng. Cao điểm sáng sớm |
| **Nhịp độ / áp lực** | ✅ **Cao** — tan học là một đợt sóng, đúng kiểu ràng buộc "đông khách = nhiều mắt nhìn" | ❌ **Thấp** — cà phê vợt là nghề chậm. Chậm hợp với cozy, nhưng **làm yếu T1** vì ít thao tác bị nhìn |
| Art mới cần làm | Quán, cổng trường, học sinh, ly nhựa | Xe cà phê, ghế đẩu, vỉa hè, khách ngồi |
| **Kết luận** | ✅ **Ứng viên mạnh nhất cho bản mở rộng** | ⚠️ **Để dành. Hợp làm game riêng hơn là bản mở rộng** |

#### 2.3.2. Phán quyết

| Hướng | Quyết định | Điều kiện |
|---|---|---|
| **Trà sữa trước cổng trường** | ⚠️ **NHẬN CÓ ĐIỀU KIỆN**, dạng **bản mở rộng độc lập** (một mùa mới, dàn NPC mới, không nối vào 40 ngày cũ) | Chỉ khi v1 ≥90% review tích cực sau 6 tháng **và** đã ship v2 mobile |
| **Cà phê vợt** | ❌ **KHÔNG làm bản mở rộng.** Giữ lại làm ứng viên game riêng | Cần thiết kế lại tầng perception cho khách **ngồi**, đó là một dự án, không phải một DLC |

**Ba lằn ranh cho mọi bản mở rộng — không thương lượng:**
1. **Không kéo dài 40 ngày cũ.** Bản mở rộng là **một mùa mới có điểm kết riêng**, không phải "season 2" của cùng một save. T4.
2. **Không phải chuỗi cửa hàng.** Giữ nguyên phán quyết CANON §10: không nhiều quầy song song — nhiều quầy = giết T1.
3. **Không bán như DLC gắn vào bản gốc nếu nó thay đổi bản gốc.** Người đã mua v1 phải được chơi v1 y nguyên như lúc họ mua.

---

### 2.4. Game thứ hai — **Tiệm phục chế ảnh cũ**

#### 2.4.1. Vì sao nó vẫn là ý tưởng mạnh nhất Phần I

Nó là ý tưởng duy nhất **trúng cả 4 trục cảm xúc** của Phần I: restoration có lịch sử (A), nâng cấp công cụ cọ tay → bàn sáng → máy scan → buồng tối (B), **được người lạ giao cho ký ức riêng tư nhất của họ** (C), bối cảnh trống (D). Và nó có **before/after** — nội dung TikTok/Shorts **tự sinh**.

#### 2.4.2. Vì sao nó là GAME RIÊNG, không phải DLC — và không phải bản mở rộng

> **Câu chẩn đoán:** *"Phục chế ảnh là **nghề làm một mình**. Khách đưa ảnh rồi về, mấy hôm sau quay lại lấy. **Không ai đứng nhìn bạn tẩy mốc.**"*

| Tầng của engine hiện tại | Dùng được cho tiệm ảnh không? |
|---|---|
| `perception.ts` — nhận thấy | ❌ **Sụp hoàn toàn.** Không có ai trong phòng → `gazeFactor` không có nghĩa, bảng `visibility` không có nghĩa, `certainty` không có gì để tích luỹ. **Sự kiện "làm rớt / làm sai giữa chừng" không có ai chứng kiến** |
| `craft/diff.ts` — delivery-time diff | ⚠️ Vẫn dùng được, nhưng mất đi nửa hay nhất: **ANTICIPATED vs DISCOVERED**. Khách không chứng kiến quá trình nên **mọi lỗi đều là `DISCOVERED`** — mất đúng cái hiện thân kỹ thuật của T1 |
| `memory.ts` / `gossip.ts` | ✅ Dùng được |
| `econ/` | ⚠️ Khác hẳn: không có hạn dùng nguyên liệu, không có giờ cao điểm, không có dự báo cầu |

**Cộng lại: mất `perception` + mất một nửa `diff` + phải viết lại `econ` = mất hơn nửa giá trị kỹ thuật của engine.** Đó là định nghĩa của một game khác, không phải một bản mở rộng.

**Ba lý do nữa, không phải lý do kỹ thuật:**

| # | Lý do | Giải thích |
|---|---|---|
| 1 | **Nhịp hoàn toàn khác** | Bánh mì: áp lực, hàng chờ, giờ cao điểm 6h30–8h. Tiệm ảnh: chậm, tỉ mỉ, một mình. Ghép hai nhịp vào một sản phẩm làm hỏng cả hai |
| 2 | **Lời hứa với người mua khác nhau** | v1 hứa *"bạn bị nhìn"*. Một DLC mà không có ai nhìn là **phá lời hứa**, kể cả khi nó hay |
| 3 | **Rủi ro cốt lõi khác nhau** | Rủi ro của tiệm ảnh là **hệ sinh hư hỏng ngẫu nhiên đủ đa dạng, nếu không sẽ lặp** (`idea.md` §4 #1). Đó là một bài toán kỹ thuật hoàn toàn mới, phải giải từ đầu |

#### 2.4.3. Cách dùng ý tưởng tiệm ảnh NGAY TRONG v1 — không tốn thêm gì

Có một cách lấy **trục cảm xúc mạnh nhất** của tiệm ảnh mà **không** cần hệ thống của nó:

> **Làm lớp phụ:** thỉnh thoảng một khách quen nhờ bạn **giữ giùm / sửa giùm** một thứ có kỷ niệm. Không có mini-game phục chế. Chỉ có việc **được giao một thứ riêng tư** và việc **trả nó lại**.

| Ràng buộc | Chi tiết |
|---|---|
| Tần suất | **Tối đa 2–3 lần trong cả mùa 40 ngày.** Nhiều hơn thì hết thiêng |
| Cơ chế | **Không thêm mini-game.** Dùng `memory.ts` core slot — thứ *"một lần duy nhất định hình NPC"* (CANON §12) |
| Ứng viên NPC | **Bà Bảy** (mối bất hoà 15 năm với cô Ba — có thứ để giao) · **Thầy Phúc** (giáo viên hưu trí) · **Chị Lan** (người im lặng biến mất — nếu chị giao một thứ rồi biến mất, thứ đó ở lại) |
| Chi phí | Gần bằng 0 — tái dùng nguyên `memory` + `ruledb` |

#### 2.4.4. Điều kiện khởi động game thứ hai

| Điều kiện | Ngưỡng |
|---|---|
| v1 đã ship trọn vẹn | ✅ bắt buộc |
| v1 đạt **≥30.000 bản** | ✅ bắt buộc (cùng ngưỡng với v2 mobile) |
| Đã trả lời được câu hỏi khó nhất: **"ai nhìn bạn làm?"** | Nếu câu trả lời là *"không ai"* thì phải có **một trụ cột thay thế T1** viết ra được trước khi viết dòng code đầu tiên |
| Đã có hệ **sinh hư hỏng ngẫu nhiên** đủ đa dạng, chứng minh bằng prototype | ✅ bắt buộc — đây là rủi ro #1 của ý tưởng đó |

---

### 2.5. Hậu mãi — patch, bản dịch, review, cộng đồng

#### 2.5.1. ⛔ Hai điều không bao giờ làm

| Cấm | Vì sao | Câu trả lời sẵn khi bị đề nghị |
|---|---|---|
| **Không Early Access** | **T4.** Và đây là một trong những lý do người ta mua game này — nó được ghi thành bullet trên Steam page (`P6-02` §2.6.4) | *"Chúng ta đã in lời hứa đó lên trang bán hàng."* |
| **Không live ops** — không season, không battle pass, không sự kiện theo tuần, không daily | **T4.** Good Pizza sống trên mobile nhờ **F2P + live ops + battle pass 10 năm**, và đó **chính xác là mô hình dự án này từ chối** (`P6-01` §2.1) | *"Nếu chúng ta làm live ops thì chúng ta đang làm Good Pizza, và Good Pizza đã đi trước 10 năm."* |

> **Thời điểm nguy hiểm nhất là 2–4 tuần sau phát hành**, khi doanh số tuần đầu tụt (nó luôn tụt) và ai đó sẽ nói *"hay là làm một sự kiện nhỏ để kéo người quay lại"*. Đó là bước một của live ops. Doc này tồn tại để trả lời câu đó **trước khi nó được hỏi**.

#### 2.5.2. Patch — phân loại và cam kết

| Loại | Nội dung | Cam kết thời gian | Ghi chú |
|---|---|---|---|
| **P0 — Hỏng** | Crash, mất save, không chơi tiếp được | **≤48 giờ** | Mất save là loại lỗi giết review score nhanh nhất. Autosave sau mỗi khách (CANON §2) giảm rủi ro nhưng không loại bỏ |
| **P1 — Chặn đường** | Một arc không hoàn thành được, một NPC không xuất hiện, sự kiện không trigger | **≤1 tuần** | |
| **P2 — Cân bằng** | Tham số perception/economy lệch làm game quá khó hoặc quá dễ | **Gộp thành 1 bản mỗi 2–4 tuần** | ⚠️ **Đừng vá cân bằng theo từng review.** Đợi đủ dữ liệu |
| **P3 — Trợ năng** | Bổ sung công tắc, cỡ chữ, chế độ | **Ưu tiên ngang P1** | CANON §15: trợ năng **bắt buộc**, không phải nice-to-have. Một người không chơi được là một người bị loại khỏi game |
| **P4 — Nội dung mới** | ❌ | **KHÔNG** | Thêm nội dung sau phát hành = live ops trá hình. Nội dung mới đi vào **bản mở rộng có điểm kết riêng** (§2.3) |

**Bản dịch:**

| Ngôn ngữ | Trạng thái v1 | Sau phát hành |
|---|---|---|
| **Tiếng Việt (giọng miền Nam)** | **Bản GỐC** | — |
| **Tiếng Anh** | Phụ đề, ship cùng v1 | Hiệu đính theo phản hồi |
| Ngôn ngữ khác | ❌ không có ở v1 | **Chỉ cân nhắc khi có yêu cầu thật đo được** (≥200 yêu cầu từ một vùng). Ưu tiên theo thứ tự doanh số thực tế, không theo cảm giác |

> ⚠️ **Ràng buộc dịch thuật không được phá ở bất kỳ ngôn ngữ nào:** **đại từ xưng hô KHÔNG dịch.** Giữ nguyên *cô / con / chú / chị / anh / em*, giải thích một lần ở đầu game (CANON §2). Một người dịch tự ý đổi *"cô"* thành *"ma'am"* là đã xoá một tầng của game.

#### 2.5.3. Phản hồi review — quy tắc trả lời

| Loại review | Trả lời không? | Trả lời thế nào |
|---|---|---|
| **Báo lỗi cụ thể** | ✅ **Luôn luôn** | Cảm ơn + số hiệu bản vá + ngày dự kiến. Ngắn |
| **"Không cozy như tôi tưởng"** | ✅ **Một lần, không tranh luận** | *"Đúng — game này có phần lo lắng, đó là chủ ý. Có chế độ không giới hạn thời gian và công tắc tắt nhớ nhầm nếu bạn muốn nhẹ hơn."* Rồi dừng. Xem `P6-02` §2.4.3 |
| **Chê art / chê giá** | ❌ **Không trả lời** | Đây là ý kiến, không phải vấn đề. Trả lời làm nó thành tranh cãi công khai |
| **Chê văn hoá / nói game sai về Việt Nam** | ⚠️ **Đọc rất kỹ, trả lời chậm** | Nếu họ đúng → **sửa, và nói rõ là đã sửa**. Nếu họ nhầm → giải thích một lần, có dẫn nguồn (phỏng vấn 3–5 chủ xe bánh mì thật ở TP.HCM — đây là lúc tài sản đó được dùng) |
| **Review 1 sao không nội dung** | ❌ Không | |

**Quy tắc chung:** **không bao giờ trả lời trong 24 giờ đầu sau khi thấy một review xấu.** Viết bản nháp, để qua một đêm, đọc lại.

#### 2.5.4. Cộng đồng

| Kênh | Duy trì thế nào | Không làm gì |
|---|---|---|
| **Steam discussions** | Đọc hằng ngày tháng đầu, sau đó 2 lần/tuần. Ghim một bài **"lộ trình"** nói rõ: **không EA, không live ops, không season** | Không hứa nội dung mới |
| **5 group VN** (Hội Làm Game VN, Team Việt Hoá SDV, Stardew Valley VN, voz, r/VietNam) | Chuyển từ tông "giới thiệu" sang tông **hậu trường**: vì sao quyết định thế này, chỗ nào làm sai | Không biến group thành kênh thông báo bản vá |
| **Người làm clip / streamer** | Gửi key cho người mới, không chỉ người lớn. Xem `P6-01` §2.5 Kênh 3 | Không yêu cầu nói tốt |
| **Bài viết hậu kỳ (post-mortem)** | Viết **một bài duy nhất**, 3 tháng sau phát hành, đăng vào Hội Làm Game VN + r/gamedev | Đây là thứ có giá trị lâu nhất và là nền cho game thứ hai |

---

### 2.6. 📌 Bài học ghi lại — những chỗ đã viết SAI, và quy trình để không lặp lại

> **Mục này là tài sản giá trị nhất mà đợt nghiên cứu này tạo ra.** Chép lại đầy đủ để không bao giờ lặp lại — và để bất kỳ ai viết tài liệu gọi vốn cho dự án sau đều phải đọc.

#### 2.6.1. Bảng đầy đủ — những khẳng định đã bị kiểm chứng đánh sập (`idea.md` §15)

| # | Khẳng định cũ (SAI) | Sự thật | Hậu quả nếu không phát hiện |
|---|---|---|---|
| 1 | *"Ẩm thực Việt trên Steam chỉ có game kinh dị"* | **TET** (Steam 2023, miễn phí, nấu mâm cỗ Tết, **97% / 220 review**) đã tồn tại | Luận điểm **"thị trường trống"** — nền của cả quyết định — **sụp** |
| 2 | Good Pizza phạt ở **80%** happiness | Ngưỡng thật là **40%**; trên 40% **không phạt gì** | Copy số sai → hệ thống khắc nghiệt **gấp đôi** tham chiếu → **phá đúng cái "cozy"** |
| 3 | *"Leaf it Alone viral 8/2026, search +4.800%"* | Peak chỉ **1.547 CCU** (11/2025), nay ~201 CCU, ~152k bản / ~$728k gross. **Không hề viral** | **Chọn sai hình mẫu để bắt chước** |
| 4 | *"≥3 game bị gỡ vì NPC AI nói bậy"* | **Không có trường hợp nào.** Rủi ro AI thật nằm ở **asset**, không ở lời thoại | Loại bỏ cả một hướng kỹ thuật **dựa trên rủi ro bịa** |
| 5 | *"LLM $0.001–0.10/hội thoại, 10k DAU ≈ $3,5–6,5k/tháng"* | Chỉ khớp **một trang khoá học nhập môn**; và **chính trang đó** nói **$0,50–3 / phiên 8 giờ** | **Mô hình tài chính dựng trên số không có nguồn** |
| 6 | Trích **Arthur Lee** (ex-Stardew): *"people are sick of playing half-finished games of this type"* | **Không xác minh được.** Arthur "Mr. Podunkian" Lee có thật (rời ConcernedApe 2022, đang làm *Sunkissed City*), nhưng **câu này không tìm ra nguồn** | **Đưa quote giả vào tài liệu gọi vốn** |
| 7 | How to Fish **$4,95**, peak **340k** | Giá gốc **$7,99** ($4,95 chỉ là giá giảm ra mắt), peak **373.971**, **1 triệu bản / 2 ngày** | Sai cả giá lẫn quy mô của hình mẫu chính |
| 8 | *"Solo dev bán 5 triệu bản"* | **MECCHA CHAMELEON** — **1 dev + 1 artist** | **Ảo tưởng "một mình làm được"** → lập kế hoạch nhân sự sai |

#### 2.6.2. ⛔ Danh sách cấm tuyệt đối — không bao giờ dùng lại, ở bất kỳ đâu

Áp dụng cho: pitch deck · tài liệu gọi vốn · press kit · bài post · caption clip · trả lời phỏng vấn · hồ sơ dự giải.

```
❌ "Leaf it Alone viral +4800%"                        → thật: peak 1.547 CCU, không hề viral
❌ Quote Arthur Lee về Early Access                    → không xác minh được
❌ "LLM $0.001–0.10/hội thoại"                         → không có nguồn
❌ "≥3 game bị gỡ vì NPC AI nói bậy"                   → không có trường hợp nào
❌ "Ẩm thực Việt trên Steam chỉ có game kinh dị"       → sai: TET đã tồn tại từ 2023
❌ "Good Pizza phạt ở 80% happiness"                   → thật: 40%
❌ "How to Fish giá $4.95 / peak 340k"                 → thật: $7.99 / 373.971
❌ "Solo dev bán 5 triệu bản"                          → thật: 1 dev + 1 artist
```

#### 2.6.3. ✅ Danh sách trắng — những số ĐƯỢC dùng

| Chủ đề | Số liệu được dùng |
|---|---|
| **How to Fish** (2 dev Thuỵ Điển, Dazed Games) | Giá gốc **$7,99** · peak **373.971 CCU** (26/08/2026) · **1 triệu bản / 2 ngày** |
| **MECCHA CHAMELEON** | **1 dev + 1 artist** (Nhật) · **$5,99** · ~2 tháng dev · **0 đồng quảng cáo** · **5 triệu bản / 10 ngày** · peak 244.731 CCU · ~$25M gross |
| **ReStory: Chill Electronics Repairs** | **300.000 bản tuần đầu** · **95% positive** · **$19,99** · ⚠️ **có tinyBuild chống lưng** (phải luôn nói kèm) |
| **The Hust Banhmi** | **$1,99** · **~10.000 bản / 2 tuần ≈ $20.000 gross** |
| **Brother Hai's Pho** | **MIỄN PHÍ** · 247 review · **93% tích cực** · ⚠️ **viral vì free + TikTok + horror, KHÔNG phải vì bán chạy** (phải luôn nói kèm) |
| **Tiệm Phở Anh Hai** | **650.000 lượt tải** |
| **TET** | Steam 2023 · miễn phí · **97% / 220 review** |
| **Tag "Cozy" trên Steam** | **+675% kể từ 2022** |
| **Good Pizza** | Ngưỡng phạt **40%** happiness · sống trên mobile nhờ **F2P + live ops + battle pass 10 năm** |
| **Bad Parenting → Night Shippers** | **97% → 76%** tích cực khi thêm co-op 8 người (cùng dev, cùng hype) |
| **Neo giá VN** | Hust Banhmi **39k** · Thần Trùng **75k** · Tai Ương **128k** · Steam VN ≈ **45%** giá Mỹ |
| **IAP mobile VN** | **+83% YoY** |
| **Corochti** | **Top App Store 2 tuần** khi ra **trước Tết 2025** |
| **Phân phối VN** | **Steam đã bị chặn tại VN** · **327 game không phép bị chặn/gỡ khỏi App Store & Google Play từ 10/2025** |
| **Quy mô cộng đồng VN** | Hội Làm Game Việt Nam **203.600** · Team Việt Hoá SDV **51.200** · Stardew Valley Việt Nam **29.200** |
| **Firewatch** (đối chiếu khối lượng thoại) | **6.169 dòng / 51.103 từ / 8,3 từ mỗi dòng** — đếm trực tiếp từ repo localization chính thức |
| **Ngân sách** | Artist VN **$1.500–2.500/tháng** · capsule art thuê riêng **$800–1.200** |
| **Doanh thu theo giá** (lập luận Publisher) | $6,99 → **$31–42k** về tay · $14,99 → **$46–55k** về tay |

#### 2.6.4. 🔬 Quy trình kiểm chứng số liệu — bắt buộc trước khi đưa vào tài liệu gọi vốn

> **Bài học phương pháp (nguyên văn `idea.md` §15):** *ba khẳng định nguy hiểm nhất đều là loại **"chưa ai làm X"**. Không ai kiểm chứng được mệnh đề phủ định bằng cách tìm kiếm hời hợt. Lần sau, mọi câu "thị trường trống" phải bị coi là **CHƯA CHỨNG MINH** cho tới khi có agent riêng đi bác bỏ nó.*

**Quy trình 6 bước — áp dụng cho MỌI con số trước khi nó ra khỏi nhóm:**

| Bước | Việc | Tiêu chí qua |
|---|---|---|
| **1. Phân loại** | Con số này thuộc loại nào: (a) **khẳng định phủ định** *"chưa ai làm X"* / (b) **số liệu định lượng** / (c) **trích dẫn một người** | Đã gắn nhãn a/b/c |
| **2. Với loại (a) — phủ định** | **Mặc định coi là SAI.** Cử **một người riêng** đi **tìm bằng chứng bác bỏ** trong ≥60 phút. Không phải người đã viết ra khẳng định đó | Có báo cáo *"đã tìm, đây là những thứ tìm được"*. Không có báo cáo = khẳng định **bị xoá**, không phải bị "để ngỏ" |
| **3. Với loại (b) — định lượng** | Truy về **nguồn cấp một** (trang store, repo chính thức, báo cáo gốc). **Không chấp nhận** một bài blog dẫn lại một bài blog | Có URL nguồn cấp một + **ngày truy cập** |
| **4. Với loại (c) — trích dẫn** | Phải tìm được **nguyên văn** ở nguồn gốc (talk, bài viết, video có timestamp) | Không tìm ra nguyên văn → **xoá cả câu**, không sửa thành "nghe nói rằng" |
| **5. Ghi điều kiện ngầm** | Mỗi số phải kèm **điều kiện làm nó đúng**. VD: ReStory $19,99 → **luôn kèm "có tinyBuild chống lưng"**. Brother Hai's Pho → **luôn kèm "miễn phí, viral vì TikTok + horror"** | Số đứng một mình trong tài liệu = số đã bị tước ngữ cảnh = số sai |
| **6. Đối chứng hai phương pháp** | Với số quan trọng (khối lượng nội dung, ngân sách, doanh thu dự kiến): tính bằng **hai phương pháp độc lập**. Ra cùng một khoảng thì tin được | Ví dụ mẫu: số dòng thoại được tính từ **ma trận sự kiện × tính cách × quan hệ** (≈2.500–4.000) **và** từ **số liệu Firewatch thật** (≈2.980) — hai đường độc lập, cùng khoảng → **tin được** |

**Một luật cứng cuối cùng:** trong tài liệu gọi vốn, **mỗi con số phải có một dòng chú thích truy vết được**. Nếu một con số không truy được về nguồn cấp một, nó **không được xuất hiện** — kể cả khi nó đúng. Số đúng mà không dẫn nguồn được là số sẽ bị hỏi trong buổi pitch, và không trả lời được một câu hỏi về số của chính mình là cách nhanh nhất để mất một hợp đồng.

---

## 3. Dữ liệu & schema

### 3.1. Cổng kích hoạt — viết thành hằng số, không thành ý kiến

```ts
const POST_LAUNCH_GATES = {
  v2Mobile: {
    requires: { pcUnitsSold: 30_000 },
    releaseWindow: "BEFORE_TET",            // Corochti: top App Store 2 tuần khi ra trước Tết 2025
    model: "F2P_IAP_COSMETIC",
    forbidden: ["PAY_TO_WIN", "STAMINA", "DAILY_LOGIN"],   // T4 — không thương lượng
    blockers: ["G1_G4_LICENSE", "VN_LEGAL_ENTITY"],        // 327 game đã bị gỡ từ 10/2025
  },
  expansionBubbleTea: {
    requires: { v1PositiveReviewPct: 90, monthsSinceLaunch: 6, v2MobileShipped: true },
    shape: "STANDALONE_SEASON",             // mùa mới có điểm kết riêng, KHÔNG nối vào 40 ngày cũ
  },
  expansionVotCoffee: { decision: "REJECTED_AS_DLC", reason: "perception cho khách NGỒI phải làm lại" },
  secondGamePhotoRestoration: {
    requires: { pcUnitsSold: 30_000, answeredWhoIsWatching: true, damagePrototypeProven: true },
    shape: "SEPARATE_GAME",                 // KHÔNG phải DLC — xem §2.4.2
  },
  coop: { decision: "CUT_FROM_V1_AND_PITCH_DECK", conditionsToReopen: 6 },  // §2.2.2
} as const;

const NEVER = ["EARLY_ACCESS", "LIVE_OPS", "BATTLE_PASS", "SEASON_PASS",
               "DAILY_LOGIN", "STAMINA", "PAY_TO_WIN"] as const;   // T4
```

### 3.2. Schema kiểm chứng số liệu

```ts
type Claim = {
  text: string;
  kind: "NEGATIVE_ASSERTION" | "QUANTITATIVE" | "QUOTE";   // bước 1
  status: "VERIFIED" | "REFUTED" | "UNPROVEN";
  primarySource?: { url: string; accessedAt: string };      // bước 3 — BẮT BUỘC nếu VERIFIED
  refutationAttempt?: { by: string; minutesSpent: number; found: string };  // bước 2
  hiddenCondition?: string;      // bước 5 — vd: "ReStory có tinyBuild chống lưng"
  crossCheck?: { methodA: string; methodB: string; agree: boolean };        // bước 6
  allowedInExternalDocs: boolean; // false nếu status !== "VERIFIED"
};
```

**Luật thực thi:** `allowedInExternalDocs === false` → con số đó **không được xuất hiện** trong bất kỳ tài liệu nào người ngoài đọc. Một khẳng định `UNPROVEN` **không phải là "chưa chắc"** — nó bị đối xử như `REFUTED` cho tới khi có người làm xong bước 2 hoặc bước 3.

---

## 4. UI/UX hai thiết bị

Mục này chỉ áp dụng cho **v2 mobile**; v1 PC đã xong ở Phase 1 và Phase 5.

| Hạng mục | **Mobile dọc (v2)** | **PC ngang (v1, để đối chiếu)** |
|---|---|---|
| **Đọc ánh mắt khách** | ⚠️ **Rủi ro cao nhất.** Mặt khách chiếm ít pixel hơn → phải **phóng to khuôn mặt trong khung trên** và tăng độ tương phản của hướng nhìn. **Test lại toàn bộ bảng `visibility` trên thiết bị thật** | Mặt khách rõ, không cần bù |
| **Thao tác làm bánh** | **Chạm-để-đặt mặc định** (không phải tuỳ chọn). Vùng chạm ≥44pt. Nút Hoàn tác luôn hiện. Chơi được **bằng một ngón cái** | Kéo-thả bằng chuột + phím tắt 1–9 |
| **Sổ tay** | Nổi bật hơn — người chơi ngắt quãng cần mục *"lâu rồi không thấy ghé"* ngay ở màn hình đầu | Ở panel phải |
| **Mở lại app** | Cần màn hình **"lần trước bạn đang làm gì"** (autosave sau mỗi khách đã có, nhưng cần lớp trình bày) | Không cần |
| **Cửa hàng cosmetic** | Mới hoàn toàn. Đặt ở **màn hình cuối ngày**, không chen vào lúc đang bán | Không có |
| **Hiệu năng mục tiêu** | **Redmi + 4G**, 30fps | Không ràng buộc |

> **Nối doc:** danh sách này phải được đọc cùng với doc **UI hai thiết bị của Phase 1**. Nguyên tắc từ Phase 1 giữ nguyên: **cùng một scene Phaser, đổi layout theo `scale.orientation`, không fork code.** v2 không được phá nguyên tắc đó.

---

## 5. Tham số cần tune

| Tham số | Giá trị khởi điểm | Khoảng | Cách đo |
|---|---|---|---|
| Ngưỡng mở v2 mobile | **30.000 bản PC** | **KHÔNG TUNE** | Hằng số CANON §2 |
| Ngưỡng mở bản mở rộng | **90% review tích cực, 6 tháng** | 88–92% | Steam review score |
| Cửa sổ ra mắt v2 | **Tết − 2 tuần** | Tết − 1 đến − 4 tuần | Tham chiếu Corochti |
| Giá gói IAP cosmetic nhỏ nhất | **Cần đo** | — | Phải đối chiếu sức mua VN thật, lấy báo giá/khảo sát, **không đoán** |
| SLA vá lỗi P0 | **48 giờ** | 24–72h | |
| SLA vá lỗi P1 | **1 tuần** | 5–10 ngày | |
| Chu kỳ gộp bản vá cân bằng | **2–4 tuần** | 2–6 tuần | Đừng vá theo từng review |
| Ngưỡng bổ sung ngôn ngữ mới | **200 yêu cầu từ một vùng** | 150–300 | Đếm từ Steam discussions + email |
| Tần suất "lớp phụ tiệm ảnh" trong v1 | **2–3 lần / mùa 40 ngày** | 2–4 | Nhiều hơn thì hết thiêng |

---

## 6. Tiêu chí đạt

**Giữ T4 (quan trọng nhất):**
- [ ] Sau 6 tháng phát hành: **vẫn không có** Early Access, live ops, season, battle pass, daily login, stamina
- [ ] Có bài ghim trên Steam discussions nói rõ lộ trình **không có** những thứ trên
- [ ] Mọi đề nghị thêm live ops đều được trả lời bằng câu đã viết sẵn ở §2.5.1, không ứng biến

**v2 mobile (chỉ khi qua cổng):**
- [ ] Đã bán **≥30.000 bản PC** trước khi viết dòng code mobile đầu tiên
- [ ] **Có giấy tờ cấp phép trong tay** trước khi lên store VN (không ngoại lệ)
- [ ] IAP **100% cosmetic** — không món nào đổi số trong `perception/memory/gossip/econ`
- [ ] **Đọc được ánh mắt khách trên thiết bị thật** (Redmi), đã test lại bảng `visibility`
- [ ] Chơi được **bằng một ngón cái**, vùng chạm ≥44pt
- [ ] Ra mắt trong cửa sổ **trước Tết**
- [ ] **Không thêm cơ chế mới nào** so với v1

**Multiplayer:**
- [ ] **Không xuất hiện** trong bất kỳ tài liệu marketing nào của v1 và v2
- [ ] Nếu được đề xuất lại: đã đi qua **đủ 6 điều kiện** của §2.2.2, có văn bản

**Bản mở rộng / game thứ hai:**
- [ ] Mọi bản mở rộng là **mùa mới có điểm kết riêng**, không kéo dài 40 ngày cũ
- [ ] Người đã mua v1 chơi được v1 **y nguyên như lúc họ mua**
- [ ] Game thứ hai: đã trả lời được **"ai nhìn bạn làm?"** trước khi viết code

**Hậu mãi:**
- [ ] P0 vá trong **48 giờ**; P1 trong **1 tuần**; P3 (trợ năng) ưu tiên ngang P1
- [ ] **Không** thêm nội dung mới qua đường patch
- [ ] Bản dịch: **đại từ xưng hô không dịch** ở mọi ngôn ngữ
- [ ] Không trả lời review xấu trong **24 giờ đầu**

**Kiểm chứng số liệu:**
- [ ] **Không** con số nào trong danh sách cấm (§2.6.2) xuất hiện ở bất kỳ tài liệu ngoài nào
- [ ] Mọi con số trong tài liệu gọi vốn có **dòng chú thích truy vết được** về nguồn cấp một
- [ ] Mọi khẳng định loại *"chưa ai làm X"* đã có **một người riêng** đi tìm bằng chứng bác bỏ ≥60 phút
- [ ] ReStory **luôn** kèm "có tinyBuild chống lưng"; Brother Hai's Pho **luôn** kèm "miễn phí, viral vì TikTok + horror"

---

## 7. Rủi ro & cách bịt

| # | Rủi ro | Cách bịt |
|---|---|---|
| L1 | **Doanh số tụt sau tuần đầu → hoảng → làm live ops** | §2.5.1 viết sẵn câu trả lời. Doanh số **luôn** tụt sau tuần đầu; đó là hình dạng bình thường, không phải tín hiệu. Bài ghim lộ trình được đăng **trước** khi doanh số tụt, không phải sau |
| L2 | **Mobile v2 bị gỡ khỏi store VN vì thiếu giấy phép** | `POST_LAUNCH_GATES.v2Mobile.blockers`. **327 game đã bị gỡ từ 10/2025** — đây là tiền lệ, không phải giả thuyết. Lịch ngược ở §2.1.4 đặt hồ sơ vào **đường găng dài nhất** |
| L3 | **IAP cosmetic trôi dần thành pay-to-win** | Luật một dòng ở §2.1.2: đổi bất kỳ số nào trong `perception/memory/gossip/econ` thì không phải cosmetic. Kiểm bằng code review, không bằng ý định |
| L4 | **Co-op được đề xuất lại vì "netcode đã có"** | §2.2. Đây đúng là câu Publisher chỉ đích danh. Bằng chứng số **97% → 76%** phải được nhắc lại mỗi lần. Và co-op đẩy game từ **G4 sang G1** về mặt pháp lý |
| L5 | **Trên mobile không đọc được ánh mắt → T5 sụp → cơ chế lõi thành xổ số** | Hạng mục 2 của §2.1.3 là **hạng mục khó nhất**, phải test trên **thiết bị thật** trước khi làm bất cứ thứ gì khác. Nếu không giải được → **không ra mobile**, chấp nhận mất thị trường đó |
| L6 | **Bản mở rộng kéo dài 40 ngày cũ → phá T4** | Ba lằn ranh ở §2.3.2. `shape: "STANDALONE_SEASON"` là hằng số trong code, không phải ý kiến |
| L7 | **Tiệm ảnh bị làm thành DLC vì "tái dùng được engine"** | §2.4.2: mất `perception` + nửa `diff` + viết lại `econ` = **mất hơn nửa giá trị kỹ thuật**. Và nó phá **lời hứa** của v1 |
| L8 | **Người dịch tự ý dịch đại từ xưng hô** | Ghi thành ràng buộc trong **hợp đồng dịch**, không chỉ trong hướng dẫn. Kiểm tra mẫu 50 dòng trước khi nhận toàn bộ |
| L9 | **Số liệu đã bị đánh sập quay lại tài liệu sau** vì ai đó nhớ nhầm | §2.6.2 là danh sách **cấm có tên**, dán vào template pitch deck. Quy trình 6 bước §2.6.4 áp dụng cho **mọi** số mới |
| L10 | **Vá cân bằng theo từng review → game trôi khỏi thiết kế gốc** | P2 gộp **2–4 tuần/bản**. Đợi đủ dữ liệu. Review đơn lẻ là giai thoại, không phải dữ liệu |
| L11 | **Game thứ hai khởi động quá sớm, hút nguồn lực khỏi hậu mãi v1** | Cổng 30.000 bản + 4 điều kiện §2.4.4. Hậu mãi v1 **xong trước**, rồi mới bắt đầu |

---

## 8. Truy vết

| Nội dung | Nguồn |
|---|---|
| Thứ tự nền tảng · mobile là v2 sau 30k bản · F2P + IAP cosmetic | `idea.md` §17 **XĐ4** · `CANON.md` **§2** |
| Premium mobile là nghĩa địa · Good Pizza sống nhờ F2P + live ops + battle pass 10 năm | `idea.md` §17 XĐ4 (agent Publisher) |
| IAP mobile VN **+83% YoY** | `idea.md` §17 XĐ4 (agent Cộng đồng VN) |
| Corochti top App Store 2 tuần khi ra **trước Tết 2025** | `idea.md` **§23** (Kênh phát hành, mục 5) |
| Không stamina / daily login / Early Access | `CANON.md` §1 **T4** · `idea.md` §2 |
| Cắt co-op/multiplayer khỏi v1 và khỏi pitch deck | `idea.md` §16 **HT5** · §23 (Cắt) |
| *"'netcode đã có' là câu nói của người chưa ship multiplayer"* | `idea.md` §16 HT5 (agent Publisher) |
| Bad Parenting **97%** → Night Shippers **76%** | `idea.md` §16 HT5 (agent Cộng đồng VN) |
| Từ chối "thuê nhân viên" (cùng logic với co-op) | `CANON.md` **§10** |
| Xếp hạng lại 9 ý tưởng · trà sữa 🥈 · cà phê vợt 🥉 | `idea.md` **§11** |
| Tiệm phục chế ảnh là #1 Phần I nhưng *"nghề làm một mình"* | `idea.md` **§4 #1** · **§5** · **§11** |
| Dùng tiệm ảnh làm **lớp phụ** trong v1 hoặc để dành làm game thứ hai | `idea.md` §11 (đoạn cuối) |
| Rủi ro tiệm ảnh: cần hệ sinh hư hỏng ngẫu nhiên đủ đa dạng | `idea.md` §4 #1 |
| Bảng đầy đủ những chỗ đã viết SAI | `idea.md` **§15** |
| Bài học phương pháp: *"chưa ai làm X"* phải coi là chưa chứng minh | `idea.md` §15 (đoạn trích cuối) |
| Số dòng thoại: hai phương pháp độc lập cùng ra một khoảng | `idea.md` §16 **HT6** |
| Steam bị chặn ở VN · 327 game bị gỡ · G1–G4 | `idea.md` §23 (⚠️) · `P6-01` §2.4 |
| Trí nhớ core slot (dùng cho lớp phụ tiệm ảnh) | `CANON.md` **§12** |
| Đại từ xưng hô không dịch | `CANON.md` **§2** |
| Trợ năng bắt buộc (ưu tiên vá ngang P1) | `CANON.md` **§15** |
| 12 NPC (ứng viên cho lớp phụ tiệm ảnh) | `CANON.md` **§9** |

---

## 9. Đề xuất sửa CANON

**Đề xuất 1 — bổ sung §1, dòng T4.**
Thêm vào cột "Hệ quả bắt buộc" của **T4**:

> *T4 áp dụng cho **mọi phiên bản, mọi nền tảng, mọi bản mở rộng** — kể cả v2 mobile F2P. Cụ thể: bản mobile được phép có **IAP cosmetic**, nhưng **không** stamina, **không** daily login, **không** battle pass, **không** season. Bản mở rộng là **mùa mới có điểm kết riêng**, không phải phần nối dài của 40 ngày cũ.*

Lý do: T4 hiện được đọc như ràng buộc của v1. Thời điểm nó bị phá là lúc bàn v2 mobile, và lúc đó doc CANON sẽ được viện dẫn — nên câu chặn phải nằm ngay trong CANON.

**Đề xuất 2 — thêm mục mới §2.1: "Ràng buộc pháp lý".**
Đề xuất thêm một dòng vào bảng §2 (Định danh kỹ thuật cố định):

| Khoá | Giá trị |
|---|---|
| **Phân loại pháp lý VN** | **G4** (tải về, không tương tác giữa người chơi và không tương tác với máy chủ) — ⚠️ **cần xác minh với luật sư**. Thêm multiplayer qua máy chủ sẽ đẩy sang **G1**, nặng hơn nhiều |

Lý do: kiến trúc client-only hiện được ghi là quyết định kỹ thuật. Nó đồng thời là quyết định **pháp lý** có giá trị lớn, và không ai trong các phase trước biết điều đó — nên bất kỳ ai định thêm server đều không thấy cái giá thật.

**Đề xuất 3 — thêm mục §19: "Kiểm chứng số liệu".**
Đề xuất đưa **danh sách cấm §2.6.2** và **quy trình 6 bước §2.6.4** của doc này lên thành một mục riêng trong `CANON.md`.

Lý do: `CANON.md` §18 hiện chỉ ghi *"Không bịa số liệu thị trường mới. Chỉ dùng số đã có trong idea.md."* Câu đó **không đủ** — nó không ngăn được việc dùng lại một con số **đã có trong idea.md nhưng đã bị gạch bỏ ở §15**. Danh sách cấm có tên là thứ duy nhất ngăn được lỗi đó.
