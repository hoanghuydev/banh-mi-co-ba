# P4-02 — Cấu trúc mùa 40 ngày

**Thuộc phase:** P4 — Nội dung
**Phụ thuộc:** `CANON.md` §3 (11 sự kiện) · §12.6 (không gossip trong 2 giờ đầu) · §13 (4 ràng buộc kinh tế) · §15 (trợ năng + nguyên tắc kết) · §17 (bản đồ phase, cổng cứng) · P4-01 (dàn nhân vật, mốc arc) · P4-03 (thư viện sự kiện) · P4-04 (kết game)
**Trạng thái:** **Chốt** nhịp 4 hồi, lịch 40 ngày, tín hiệu báo trước XĐ3, bảng cân bằng. **Cần đo** thời lượng thật một ngày (cổng bắt buộc, xem §5 và §6). **Còn mở** 🟡 vị trí chính xác của cú twist giờ thứ 2 nếu phép đo cho kết quả lệch.

---

## 1. Mục tiêu

Biến con số "40 ngày" của **T4** thành một cấu trúc có nhịp, có chỗ thở, có chỗ đau, và **có phanh**.

- **T4** (một mùa có điểm kết): 40 ngày, ship trọn vẹn. Doc này là xương sống thời gian của cả game.
- **T1** (khách chấm quá trình): lịch phải tạo ra **áp lực thông lượng** đúng lúc — §13.3 gọi đây là *"ràng buộc quan trọng nhất và đang thiếu hoàn toàn"*. Ở đây nó được đặt vào từng ngày cụ thể.
- **T5** (attention nhìn thấy được): lịch mở khoá hệ thống phải để người chơi **đọc được luật trước khi luật có răng**.
- **Thi hành phanh #1 của phán quyết XĐ3** (`idea.md` §17): *báo trước 3–4 ngày*. Đây là mục tiêu quan trọng nhất của doc. **Khác biệt giữa bi kịch và trò đểu nằm đúng ở chỗ đó.**
- Đảm bảo **số sự kiện tích cực ≥ số sự kiện tiêu cực trong trải nghiệm thực tế** (luật §9.7, nguồn của con số "11 sự kiện" ở CANON §3).

---

## 2. Cơ chế

### 2.1. Nhịp 4 hồi

| Hồi | Ngày | Tên | Hệ thống mở | Mật độ sự kiện kịch bản | Cảm xúc chủ đạo |
|---|---|---|---|---|---|
| **I** | **1–8** | **Học luật** | Làm bánh · nhận thấy (perception) · chợ · mở hàng/đốt vía · trà đá (hạ attention) | **0,6 sự kiện/ngày** (5 sự kiện / 8 ngày) | *Tôi đang bị nhìn, và tôi đọc được điều đó.* Tò mò, hơi căng, chưa mất gì |
| **II** | **9–20** | **Mở rộng** | **Đồn thổi + nhớ nhầm (ngày 9)** · sổ tay khách (ngày 11) · sổ nợ (ngày 9) · bảng QR (ngày 14) · trà sữa + ca tối (ngày 14) · nhà cung cấp nhiều mức (ngày 12) · chỗ đứng (ngày 16) | **1,2 sự kiện/ngày** (14 / 12 ngày) — **cao nhất mùa** | *Cái tôi làm không dừng ở đây.* Phấn khích chuyển thành cảnh giác |
| **III** | **21–33** | **Áp lực và mất mát** | Không mở gì mới. **Chỉ siết cái đã có** | **1,0 sự kiện/ngày** (13 / 13 ngày) nhưng **trọng lượng gấp đôi** | *Tôi không giữ được tất cả.* Đây là hồi duy nhất được phép buồn |
| **IV** | **34–40** | **Khép lại** | Không mở gì. **Gỡ dần**: chú Kiệt bớt, khách vãng lai bớt, hẻm vắng hơn | **1,0 sự kiện/ngày** (7 / 7 ngày), gần như **toàn bộ là tích cực hoặc trung tính** | *Ai còn ở đây.* Ấm, chậm, có chỗ để nhìn lại |

**Luật nhịp bắt buộc:**

| # | Luật | Vì sao |
|---|---|---|
| **N1** | **Hồi I không có một sự kiện tiêu cực nào do hệ thống ép.** Mọi thứ xấu xảy ra ở Hồi I đều do người chơi tự làm | Người chơi phải tin rằng hệ quả đến từ mình, không từ kịch bản. Nếu Hồi I có bad luck scripted, cả T5 sụp |
| **N2** | **Không có hai ngày tiêu cực liên tiếp** ở bất kỳ đâu, trừ đúng một chỗ: ngày **24–25** | Ngày 24 (chị Lan vắng + mưa lớn) và 25 (chú Kiệt bán đồ cũ) là đáy của mùa. Đáy phải có, và phải chỉ có một |
| **N3** | **Mỗi ngày tiêu cực trọng số ≥2 phải có một ngày tích cực trọng số ≥2 trong vòng ±2 ngày** | §9.7. Bảng kiểm ở §2.6 |
| **N4** | **Ngày 7, 14, 21, 28, 35 (Chủ Nhật) luôn nhẹ hơn.** Chú Kiệt nghỉ, chú Tư không tới, ít khách hơn 20% | Người chơi cần nhịp thở hằng tuần. Và điều này dạy luật lịch sinh hoạt mà không cần tutorial |
| **N5** | **Không sự kiện kịch bản nào ở ngày 1 và ngày 2.** Chỉ có khách và luật | Tutorial là việc làm bánh, không phải việc xem cutscene |

---

### 2.2. Lịch mở khoá hệ thống — và luật "2 giờ đầu không có gossip"

> **CANON §12.6 (ràng buộc cứng):** *đồn thổi và nhớ nhầm **không xảy ra trong 2 giờ chơi đầu**. Có công tắc tắt.*

Luật này không phải một cái cờ bật/tắt — nó là **cấu trúc của Hồi I**. Trong 8 ngày đầu, người chơi phải học được rằng *người ta nhìn thấy*. Chỉ khi đó, việc *người ta kể lại* mới có sức nặng thay vì gây ngộp.

| Ngày | Hệ thống mở | Ai mở (không phải popup) | Gating |
|---|---|---|---|
| **1** | Làm bánh · đưa bánh · thối tiền · perception 4 state | Cô Ba đứng cạnh, làm mẫu **một** ổ | — |
| **1** | **Mở hàng** (khách đầu ngày) | Cô Ba nói một câu, nửa đùa | — |
| **2** | Đi chợ (cô Ba dẫn) · hạn dùng | Cô Ba dạy giá | — |
| **3** | **Ly trà đá** = công cụ hạ attention (§5.4) | Bà Sáu đưa nước cho người chơi trước, rồi người chơi hiểu ra | — |
| **4** | **Đốt vía** | Cô Ba làm, người chơi coi. Ngày 6 người chơi tự làm | — |
| **5** | Cạnh tranh (chú Kiệt mở xe) | Chú Kiệt, không lời nào | — |
| **7** | Đi chợ **một mình** | Cô Ba: *"Con đi đi."* | — |
| **9** | 🔴 **ĐỒN THỔI + NHỚ NHẦM** | **Cú lộ** — xem §2.3 | **Ngày ≥9 VÀ playtime ≥90 phút** |
| **9** | **Sổ nợ** | Cô Mai | Ngày ≥9 |
| **11** | **Sổ tay khách** (người chơi tự ghi) | Thầy Phúc đưa cây bút | Ngày ≥11 |
| **12** | **Nhà cung cấp nhiều mức giá** (§10) | Cô Ba đưa số điện thoại một mối | Ngày ≥12 |
| **14** | **Bảng QR** · **bình trà sữa + ca tối** (thiết bị, Trục B) | Cô Mai (QR) · bé Su nì nèo (trà sữa) | Ngày ≥14 **và** đủ tiền |
| **16** | **Đổi chỗ đứng** (không phải chuỗi cửa hàng — §10) | Bà Sáu chỉ chỗ | Ngày ≥16 |
| **21+** | Không mở gì nữa | | |

> 🔴 **Công tắc trợ năng (§15):** tắt "NPC nhớ nhầm / đổ oan" → ngày 9 vẫn diễn ra, **nhưng tin lan đi không bị méo**. Người chơi vẫn thấy tin lan (đó là USP), chỉ không bị đổ oan. Xem P4-03 §2.2.
> **Ràng buộc §12.4 đi kèm:** ngày 9 trở đi, **mọi tin đồn phải nghe lỏm được**. Địa điểm vật lý: trước tiệm cô Mai. Nếu một tin không có cảnh nghe lỏm khả dĩ, tin đó **không được phép tồn tại**.

---

### 2.3. 🔴 GIỜ THỨ 2 — cú twist lớn nhất, đặt đúng cửa sổ refund Steam

> **Steam hoàn tiền tự động khi chơi dưới 2 giờ.** Mọi thứ quyết định việc người mua có giữ game hay không phải xảy ra **trước mốc đó**. Không phải "hook ở phút 5" — hook ở phút 5 giữ người ta khỏi đóng game; **cú twist ở giờ thứ 2 giữ người ta khỏi bấm nút refund.**

**Điều kiện kích hoạt (cái nào tới trước):**
```
TRIGGER_CU_LO =
   (currentDay >= 9)
   OR (totalPlaytimeMinutes >= 90)
```
Lý do có nhánh `playtime`: người chơi nhanh có thể tới ngày 12 trước phút 90; người chơi chậm có thể còn ở ngày 6 lúc phút 90. **Cả hai đều phải gặp cú lộ trước phút 120.** Nếu nhánh `playtime` bắn sớm, các mốc arc từ ngày 9 trở đi được **nén lại** chứ không bị bỏ.

**Cái gì xảy ra — dựng cảnh chi tiết:**

Đây **không** phải một cutscene. Đây là một buổi sáng bình thường, với đúng một thứ khác.

```
06:20  Bà Bảy mở hàng. Bình thường.
06:45  Chú Tư. Bình thường.
07:05  Chị Lan. Bình thường.
07:40  Thầy Phúc. Bình thường.
08:50  Tiếng rao bà Sáu tới gần.  ← bắt đầu từ đây
```

Bà Sáu **không** đi ngang. Bà dừng lại **trước tiệm cô Mai**, cách xe 9 mét, đặt gánh xuống, và hai bà nói chuyện. Camera **không** cắt. Không có khung thoại. Không có mũi tên. Người chơi **vẫn đang làm bánh cho một khách khác**, và giọng hai bà lọt vào qua tiếng xe máy, **nghe được khoảng 70%**:

> **Bà Sáu:** *"...ờ, cái con nhỏ bên xe bánh mì đó..."*
> **Cô Mai:** *"Con cháu bà Ba hả?"*
> **Bà Sáu:** *"Ừ. Nghe nói bữa trước nó làm rớt cái gì đó xuống đất rồi..."*
> **Cô Mai:** *"Rồi sao?"*
> **Bà Sáu:** *"Tui đâu có thấy. Bà Bảy kể."*

**Ba tầng của cú này — đây là lý do nó hiệu quả:**

| Tầng | Người chơi nhận ra |
|---|---|
| **1. Họ thấy** | Người chơi đã học điều này ở Hồi I. Không mới |
| **2. Họ kể** | **Mới.** Và tin đã đi được **5 ngày** trước khi người chơi biết |
| **3. Tin đã méo** | **Mới và đáng sợ.** Chuyện gốc (ví dụ ngày 4, người chơi làm rớt một lát dưa leo và đã bỏ đi đúng luật) đã trở thành *"làm rớt cái gì đó xuống đất"* — bỏ mất mệnh đề quan trọng nhất. Và **nguồn truy vết được**: bà Bảy |

**Hành động được mở khoá ngay sau đó (trong vòng 30 giây):**

1. **Sổ tay mọc thêm một trang: "Người ta kể".** Không có điểm, không có thanh. Chỉ có dòng chữ viết tay: *`nghe được (ngày 9): "làm rớt cái gì đó" — bà Sáu kể, nguồn: bà Bảy`*.
2. **Bà Bảy tới vào ngày 11** (T2 — lịch của bà). Người chơi bây giờ biết bà là nguồn. **Không có nút "hỏi bà".** Người chơi chỉ có thể làm đúng ổ của bà — ít rau, cắt đôi, không ớt — và điều đó **thật sự** làm tin chết nhanh hơn (`deTha 0.8` của bà + `confidence` giảm khi nguồn không lặp lại).
3. **Một khách vãng lai vào ngày 10 nhìn xuống đất trước khi gọi món.** Đúng một người. Không ai giải thích.

**Vì sao đây là twist chứ không phải tính năng:**
Trong 8 ngày đầu, game đã dạy người chơi rằng *cẩn thận trước mặt khách là đủ*. Ngày 9 lật luật đó: **cẩn thận trước mặt khách không đủ, vì khách mang chuyện đi**. Và quan trọng nhất — **người chơi không làm gì sai ở ngày 4**. Họ đã làm đúng: bánh rớt, họ bỏ đi. Tin đồn vẫn hình thành. Đó là điều làm nó *thật* thay vì *công bằng*.

**🟡 Còn mở:** nếu phép đo ở §5 cho ra một ngày = 16 phút (thay vì 10–12), thì ngày 9 rơi vào phút ~130 — **trễ hơn cửa sổ refund**. Phương án: hạ ngưỡng `playtime` từ 90 → 70 phút và chấp nhận cú lộ có thể xảy ra sớm nhất ở ngày 6. Quyết định sau khi có số.

---

### 2.4. Lịch 40 ngày — bảng xương sống

**Ký hiệu.** Thời tiết: ☀️ nắng · ⛅ xanh xám · 🌧️ mưa chiều · ⛈️ mưa lớn/ngập.
Cột "Cân bằng": **`+`** tích cực trọng số 1 · **`++`** tích cực trọng số 2 · **`−`** tiêu cực trọng số 1 · **`−−`** tiêu cực trọng số 2 · **`·`** trung tính.
`SK-xx` = mã sự kiện, tra ở **P4-03**.

| Ngày | Thứ | Trời | Khách đặc biệt / vắng | Sự kiện kịch bản | Nghĩa vụ & chợ | Mốc arc | CB |
|---|---|---|---|---|---|---|---|
| **1** | T2 | ⛅ | Cô Ba đứng cùng cả ngày. Bà Bảy mở hàng 6h20 | — (tutorial) | Chợ: cô Ba trả tiền. Thịt **đắt** (T2) | Cô Ba M1 · bà Bảy mở hàng | `·` |
| **2** | T3 | ☀️ | Ông Hải **sáng** 7h30 (bản tử tế) | **SK-01** hết tiền thối, cô Mai chạy qua | Chợ ngày đầu tự trả | Cô Mai M1 · chị Hạnh M1 (rau mùi) | `+` |
| **3** | T4 | ⛅ | Anh Dũng **mặc đồng phục lần đầu** | **SK-02** bà Sáu rủ đổi | — | Anh Dũng M1 · bà Sáu M1 | `+` |
| **4** | T5 | 🌧️ | — | **SK-03** thầy Phúc mô tả lỗi thay vì trách | Chợ: thịt **rẻ** (T5) | Thầy Phúc M1 | `+` |
| **5** | T6 | ☀️ | **Chú Kiệt mở xe.** Bé Su quay clip lần đầu | **SK-04** cạnh tranh giá · **SK-12** điện thoại giơ lên | — | Chú Kiệt M1 · bé Su M1 · ông Hải M1 | `−` |
| **6** | T7 | ⛅ | Bà Bảy mua **2 ổ** (lần đầu) | **SK-13** tai nghe cải lương | Người chơi **tự đốt vía** lần đầu | Bà Bảy M1 | `++` |
| **7** | CN | ☀️ | Chú Kiệt **nghỉ**. Chú Tư không tới. Ít khách 20% | — | Cô Ba: *"Con đi đi."* → đi chợ một mình | Cô Ba M2 | `+` |
| **8** | T2 | ⛅ | Khách vãng lai **nhại giọng chị Hạnh** | **SK-18** chọc giọng (ông Hải chặn) | Chợ: thịt đắt | Chị Hạnh M2 | `−` |
| **9** | T3 | ☀️ | Bà Sáu dừng trước tiệm cô Mai | 🔴 **CÚ LỘ** (§2.3) · **SK-20** cô Mai mở sổ nợ | — | Cô Mai M2 · bé Su (đá ít lại) | `−−` `+` |
| **10** | T4 | ⛅ | Chị Hạnh **mua chỗ khác** (vắng). 1 khách nhìn xuống đất | **SK-14** clip bé Su nổ view | **Tiền chỗ kỳ 1** đến hạn | Bé Su M2 | `+` `−` |
| **11** | T5 | 🌧️ | **+40% khách vãng lai.** Anh Dũng ngồi im 40 giây | **SK-21** thầy Phúc đưa bút · **SK-15** app khoá | Chợ: thịt rẻ | Anh Dũng M2 · thầy Phúc M2 · chị Hạnh quay lại | `++` |
| **12** | T6 | ☀️ | Vẫn đông. Ông Hải tới sáng **ngoài lịch** | **SK-22** mối hàng mới | Mở nhà cung cấp nhiều mức | Anh Bảo M2 (dạy khẩu vị) · anh Dũng prop cá | `+` |
| **13** | T7 | ⛅ | Bà Bảy 2 ổ. Bé Su nghỉ quay (để dành tiền) | **SK-06** đưa nhầm đơn hai khách | **Tiền hụi kỳ 1** | Bà Bảy M2 (ổ thứ hai) | `++` `−` |
| **14** | CN | ☀️ | Chú Kiệt nghỉ. Chị Lan **để lại miếng lót ly** | **SK-23** mua bảng QR + bình trà sữa | Thiết bị: QR · trà sữa · đèn ca tối | Chị Lan M2 | `++` |
| **15** | T2 | ⛅ | Sinh viên bạn anh Bảo bắt đầu tới nhóm | **SK-07** khách cáu vô cớ (vừa bị sếp mắng) | Chợ: thịt đắt. Cô Mai chạy bộ ngang | Anh Dũng **báo trước #1** | `−` |
| **16** | T3 | 🌧️ | Anh Dũng trễ 25 phút, mắt đỏ | **SK-05** bà Sáu trú mưa, nghe lỏm · **SK-24** chuyện bảng hiệu ông Hải | Mở **đổi chỗ đứng** | Ông Hải M2 · anh Dũng **báo trước #2** | `+` |
| **17** | T4 | ☀️ | **Anh Bảo hết pin điện thoại** | 🔴 **SK-08** anh Bảo ngẩng đầu lên | — | Anh Bảo M3 · anh Dũng **báo trước #3** (nói thẳng) · bé Su mua gimbal | `−−` |
| **18** | T5 | ⛅ | **7h20 KHÔNG CÓ ANH DŨNG.** Cô Ba không xuống xe cả ngày | **SK-25** bán một mình, không ai để hỏi | **Tiền thuốc cô Ba** đến hạn. Chợ: thịt rẻ | Anh Dũng M4 · cô Ba M3 | `−−` |
| **19** | T6 | 🌧️ | Anh Bảo tới **6h20** (mùa thi) | **SK-09** mưa lớn, khách nán lại nói chuyện | 🔴 **Dịch heo: pate +40%**, 5 ngày (19–23) | Bà Sáu M2 (**"nhà tui gần xe bánh mì cô Ba"**) | `++` `−` |
| **20** | T7 | ☀️ | Thầy Phúc **vắng** (đi giải xe đạp). Bé Su thi, không quay | **SK-26** người chuyển nhà đi không báo | **Tiền chỗ kỳ 2**. Pate đắt | Thầy Phúc M3 (giả báo động) | `−` |
| **21** | CN | ⛅ | Thầy Phúc **vắng ngày 2**. Bà Bảy **và** cô Ba đều không đi đờn ca | **SK-27** buổi đờn ca tài tử ở sân đình | Pate đắt | Bà Bảy M3 (bất hoà) · chú Tư prop lồng chim | `+` `−` |
| **22** | T2 | 🌧️ | Thầy Phúc **về**, da cháy nắng. Chị Hạnh nói chuyện với chị Lan (1 câu) | **SK-28** bà Sáu khoe bằng lái xe tải | Chợ: thịt đắt + pate đắt → **ngày khó nhất về tiền** | 🔴 **Chú Tư bớt ớt (báo trước #1)** · chị Lan **rạn #1** | `++` `−` |
| **23** | T3 | ☀️ | Chị Lan **không cầm bịch đồ chua** | **SK-16** clip xấu của bé Su (nếu đủ điều kiện) | Pate đắt (ngày cuối) | Chị Lan **rạn #2** · bé Su M3 | `−−` |
| **24** | T4 | ⛈️ | 🔴 **7h05 KHÔNG CÓ CHỊ LAN.** Mưa lớn, ngập lối vào | **SK-10** cúp điện (mưa lớn) · bảng hiệu tróc sơn | Khách **−40%** vì mưa | 🔴 **Chị Lan M4 (biến mất)** · ông Hải M3 | `−−` `−−` |
| **25** | T5 | 🌧️ | Chú Kiệt bán hàng hôm trước | **SK-11** cái khăn của chú Kiệt | **Tiền điện nước**. Chợ: thịt rẻ | Chú Kiệt M2 | `−−` |
| **26** | T6 | ⛅ | Chú Tư **tới 7h10** (trễ 25 phút) | **SK-29** ông Hải vẽ lại bảng hiệu (nhánh) | — | 🔴 **Chú Tư báo trước #2** (*"công ty dời qua Bình Dương"*) · ông Hải M4 | `+` `−` |
| **27** | T7 | 🌧️ | Ông Hải tới sáng ngoài lịch (vẽ bảng) | **SK-30** cô Mai kể chuyện lỗ chậu lan 4 triệu | — | Cô Mai M4 · ông Hải M4 (tay run) | `+` |
| **28** | CN | ☀️ | Chú Kiệt nghỉ. **Bé Su đeo huy chương** | **SK-17** khách dẫn người mới tới khoe | Bà Sáu vòng 2 **trễ 20 phút** | Bé Su M4 · bà Sáu M3 · anh Bảo M4 bắt đầu | `++` `++` |
| **29** | T2 | 🌧️ | **Chú Tư mua nửa ổ.** Anh Bảo gọi bánh mì không | 🔴 **SK-31** khách hết tiền cuối tháng (anh Bảo) | Chợ: thịt đắt | 🔴 **Chú Tư báo trước #3** · anh Bảo M4 | `−` `+` |
| **30** | T3 | ⛅ | 🔴 **6h45 KHÔNG CÓ CHÚ TƯ.** Cô Mai mua **một ổ** | — (**cố ý không có sự kiện nào**) | **Tiền chỗ kỳ 3** | 🔴 **Chú Tư M5 (biến mất)** · cô Mai M5 | `−−` |
| **31** | T4 | ⛈️ | Bà Sáu **không có vòng 2** | **SK-32** chú Kiệt nói chuyện nghề (nhánh b) | Khách −40% vì mưa. Chợ: thịt rẻ | Chú Kiệt M3 · bà Sáu M3 | `++` |
| **32** | T5 | ☀️ | — | **SK-19** khách tự đứng bán hộ | **Tiền hụi kỳ 2**. Thầy Phúc xin đọc sổ tay | Thầy Phúc M4 | `++` |
| **33** | T6 | ⛅ | **Vợ chú Tư ghé**, mua 2 ổ. Bà Sáu ngồi nghỉ 10 phút ở ghế xe | **SK-33** lời nhắn của chú Tư | — | 🔴 **Chú Tư M6** (lời giải thích duy nhất) · bà Sáu M3 | `+` `·` |
| **34** | T7 | 🌧️ | Anh Dũng **chở con gái đi học**, ghé ban ngày | 🔴 **SK-34 CÔ BA NÓI CÔ NGHỈ HẲN** · **SK-35** bà Sáu nhờ giữ giùm gánh | Bắt đầu Hồi IV | Cô Ba M4 · anh Dũng M5 · bà Sáu M3 | `++` `−−` |
| **35** | CN | ☀️ | **Bà Bảy vắng** (đi coi hát). **Bà Sáu có bàn gấp**, không gánh nữa | **SK-36** bà Sáu đặt gánh xuống | Chú Kiệt nghỉ | Bà Bảy M4 · bà Sáu M4 | `++` |
| **36** | T2 | 🌧️ | **Bà Bảy về, cầm tờ chương trình cải lương.** Chú Kiệt gắn QR + POS | **SK-37** chú Kiệt gắn POS | Chợ: thịt đắt. Cô Mai chạy bộ ngang | Bà Bảy M4 (tiết lộ) · chú Kiệt M4 | `++` `−` |
| **37** | T3 | ⛅ | — | **SK-38** trẻ con nhặt được ví | — | — | `++` |
| **38** | T4 | ☀️ | **Ông Hải tới SÁNG, mặc áo mới, tỉnh** | **SK-39** đám cưới trong hẻm | **Tiền thuốc cô Ba kỳ 2** | Ông Hải M5 | `++` `++` |
| **39** | T5 | 🌧️ | Ngày bán bình thường cuối cùng. Hẻm vắng hơn | **SK-40** dọn xe, cô Ba ghi sổ sớm | Chợ: thịt rẻ. **Mua hàng cho ngày mai** | — | `·` |
| **40** | T6 | ⛅☀️ | 🔴 **NGÀY CUỐI.** Bà Bảy mở hàng · chú Kiệt gật đầu rồi dừng lại · thầy Phúc 6h00 · **CHỊ LAN QUAY LẠI** | 🔴 Xem **P4-04** toàn bộ | Chốt sổ nợ với cô Mai | Tất cả M-kết | `++` |

**Đọc bảng — ba điều quan trọng:**

1. **Ngày 30 không có sự kiện kịch bản nào.** Đó là quyết định thiết kế, không phải thiếu sót. Ngày chú Tư biến mất phải là một ngày **trống**, vì nếu có sự kiện khác, người chơi sẽ bận và không để ý cái ghế trống. **Sự vắng mặt cần không gian trống để được nghe thấy.**
2. **Ngày 24 là ngày duy nhất có hai `−−`.** Đáy của mùa. Nó được bao bởi ngày 22 (`++`) và ngày 26–28 (ba ngày tích cực liên tiếp).
3. **Hồi IV (34–40) có 9 dấu `++` và chỉ 3 dấu `−−`** — và cả 3 đều nằm ở ngày 34 và 36. Từ ngày 37, **không còn một sự kiện tiêu cực nào trong game.**

---

### 2.5. 🔴 PHANH CỦA PHÁN QUYẾT XĐ3 — tín hiệu báo trước từng ngày

> `idea.md` §17 XĐ3, phanh #1 (nguyên văn):
> *"**Báo trước 3–4 ngày**: chú than chuyện công ty chuyển chỗ, mua ít đi, đến giờ khác. Để khi chú biến mất, cảm giác là **'mình đã có thể đoán ra'** chứ không phải **'game vừa cướp của mình'**. **Khác biệt giữa bi kịch và trò đểu nằm đúng ở chỗ đó.**"*

**Luật thi hành — 6 điều, không thương lượng:**

| # | Luật | Vì sao |
|---|---|---|
| **B1** | **Mọi NPC rời đi phải có ≥3 tín hiệu trong 4–8 ngày trước đó** | Định nghĩa của phanh |
| **B2** | **Không tín hiệu nào được gắn marker, âm thanh riêng, hay chữ vàng.** Chúng nằm trong dòng thoại và trong hành vi bình thường | Nếu game đánh dấu tín hiệu thì nó thành cutscene, và người chơi mất quyền "đã có thể đoán ra" |
| **B3** | **Ít nhất một tín hiệu phải là HÀNH VI, không phải LỜI NÓI** (mua ít đi, đến giờ khác, đứng xa hơn) | Người không đọc thoại kỹ vẫn phải có cơ hội. Và lời nói dễ bị bỏ qua hơn cái ghế trống |
| **B4** | **Tín hiệu cuối cùng phải ở ngày liền trước hoặc cách 1 ngày** | Trí nhớ ngắn hạn của người chơi |
| **B5** | **Sổ tay cô Ba tối hôm đó phải nhắc, nhưng KHÔNG PHÁN ĐÚNG SAI** (phanh #2) | `idea.md` §17 XĐ3 phanh 2 |
| **B6** | **Công tắc "họ để lại lời nhắn"** (phanh #3) đổi một tín hiệu cuối thành lời nhắn tường minh | §15 · `idea.md` §20 |

---

#### B-A. **CHÚ TƯ** — biến mất ngày 30 (dời công ty). Tín hiệu: 3 + 1 nền

| Ngày | Loại | Tín hiệu chính xác | Ghi chú dựng |
|---|---|---|---|
| **22** | **Hành vi** (khẩu vị) | Chú **bớt ớt**. Đơn "như mọi bữa" vẫn nói, nhưng khi người chơi bỏ 3 khoanh ớt như thường, chú nói: *"Thôi khỏi ớt con. Bữa nay chú ăn lạt."* | **Đây là tín hiệu tinh vi nhất và cố tình gây hiểu nhầm.** Người chơi sẽ nghĩ chú bệnh. Chú có đi khám thật (men gan), nhưng đó không phải lý do chú đi. **Một tín hiệu đúng, một cách hiểu sai — đó là đời thật.** Chú cũng bỏ nhậu chiều với ông Hải từ ngày này |
| **26** | **Lời nói** | *"Công ty chú nó tính dời qua bên Bình Dương đó con."* Nói một lần. Rồi chú **đổi chủ đề ngay**: *"Ờ mà bữa nay đồ chua ngon nghen."* | **VA: đọc như đang than thời tiết.** Câu sau quan trọng ngang câu trước — việc chú bỏ qua nó ngay là cách game từ chối đánh dấu nó. Chú cũng **tới 7h10**, trễ 25 phút, không giải thích |
| **29** | **Hành vi** (số lượng) | Chú mua **nửa ổ**, lần đầu trong 29 ngày. *"Bữa nay chú ăn ít."* Chú **không đưa tiền thừa như mọi khi** — chú đếm đúng | Nếu người chơi có sổ tay ghi "chú Tư luôn đưa 20k khỏi thối", chi tiết này đập vào mắt. Nếu không ghi, nó trôi qua. **Đó là phần thưởng cho việc ghi sổ** |
| **27, 28** | **Nền** | T7 và CN — chú **không tới theo lịch bình thường**. Hai ngày trống này làm ngày 29 trở thành "lần cuối" mà người chơi không biết là lần cuối | Khai thác chính lịch sinh hoạt đã dạy từ Hồi I |
| **30** | — | **6h45. Không ai. 6h50. 7h00.** Không sting nhạc. Không thông báo. Không ghi chú tự động | N-luật: ngày 30 **không có sự kiện kịch bản nào khác** |

**Sổ tay cô Ba, tối ngày 30** (phanh #2 — chữ viết tay, 2–3 dòng, không phán đúng sai):
> *"Bữa nay chú Tư không ghé.*
> *Cô nhớ hôm trước ổng có nói gì đó về chuyện công ty. Cô quên mất."*

**Công tắc "họ để lại lời nhắn" BẬT** (phanh #3): ngày 30, thay vì trống, **vợ chú ghé ngay sáng đó** (thay vì ngày 33) và đưa một mẩu giấy:
> *"Chú đi làm chỗ mới. Xa quá con ơi. Cảm ơn con 30 bữa cơm sáng."*

**Ngày 33 (không phụ thuộc công tắc):** vợ chú ghé, mua 2 ổ, nói một câu. Xem P4-01 NPC-02 M6.

---

#### B-B. **CHỊ LAN** — biến mất ngày 24 (im lặng). Tín hiệu: 4, **toàn bộ là hành vi**

> Chị Lan là người *"im lặng biến mất"* (`soi` cao + `nongTinh` thấp + `thanThien` thấp — quy tắc suy hành vi ở CANON §4). **Chị không được phép nói một câu báo trước nào.** Nếu chị nói, chị không còn là chị.
> → Toàn bộ tín hiệu của chị là **hành vi**, và chúng phải **rõ ràng hơn** tín hiệu của chú Tư để bù lại.

| Ngày | Tín hiệu chính xác | Người chơi có thể thấy nếu... |
|---|---|---|
| **19** | Chị tới **7h11** thay vì 7h05. Sai số lịch của chị là ±2 phút suốt 18 ngày — **6 phút là một dị thường lớn** | ...người chơi đã quen chuẩn bị ổ của chị lúc 7h03 |
| **20** | Chị **không đổi giày**. Suốt 19 ngày chị đổi từ dép sang giày bệt ngay trước xe. Hôm nay chị mang dép đi luôn | ...người chơi đã từng nhìn chị làm việc đó (animation lặp 19 ngày, ai cũng thấy) |
| **22** | Chị **đứng lùi một bước**, ở `QUEUE_2` thay vì `FRONT_CENTER`, dù không có ai phía trước. Và chị nói chuyện với chị Hạnh — **đúng một câu, lần duy nhất trong game** | ...người chơi để ý zone. Đây là tín hiệu dành riêng cho người chơi đã hiểu hệ perception |
| **23** | Chị **không cầm bịch đồ chua**. Suốt 22 ngày chị luôn xin thêm một bịch đồ chua nhỏ để ăn buổi chiều ở công ty. Hôm nay chị nói: *"...Dạ, thôi em."* | Câu *"...Dạ, thôi em."* là **bark tier-1 duy nhất** của chị trong cả arc này. Một chữ "thôi" |
| **24** | **7h05. Không ai. Trời mưa lớn từ 6h.** | — |

**Tại sao 4 tín hiệu mà không phải 3:** chị không nói gì, nên xác suất người chơi bắt được mỗi tín hiệu thấp hơn. Playtest phải đo: **≥6/10 người chơi nhớ được ít nhất 2 trong 4 tín hiệu khi được hỏi ở ngày 26.** Nếu dưới, tăng lên 5 tín hiệu (thêm ngày 21: chị trả tiền lẻ đúng khớp thay vì đưa chẵn).

**Sổ tay cô Ba, tối ngày 24:**
> *"Bữa nay mưa từ sớm.*
> *Cô thấy con cứ nhìn ra đầu hẻm hoài."*

**Cái KHÔNG được có ở ngày 24–25:**
- ❌ Không có NPC nào nói *"ủa cô gái hay mua chả lụa đâu rồi?"*
- ❌ Không có mục nào trong sổ tay tự động ghi "chị Lan đã 1 ngày không ghé"
- ❌ Không có nhạc thay đổi
- ✅ **Có duy nhất:** ổ chả lụa không ớt không hành mà người chơi đã chuẩn bị sẵn lúc 7h03, nằm đó, nguội dần. Nếu người chơi bán nó cho người khác — được. Nếu để đó — cô Ba ăn nó buổi tối và không nói gì.

**Công tắc "họ để lại lời nhắn" BẬT:** ngày 26, một miếng lót ly móc len **thứ hai** xuất hiện trên nắp thùng đá, kèm mẩu giấy: *"Em chuyển chỗ làm. Cảm ơn chị."* — Chị gọi người chơi là "chị" một lần duy nhất, và đó là lỗi đánh máy của một người đang vội. Giữ nguyên lỗi đó.

---

#### B-C. **ANH DŨNG** — đổi ca đêm ngày 18. Tín hiệu: 3, **có cả lời nói thẳng**

> Đây là **ca dễ nhất có chủ ý**, đặt ở giữa Hồi II như một bài học. Anh Dũng **nói thẳng** ở tín hiệu cuối. Người chơi học được: *"à, khi họ sắp đi, họ có dấu hiệu."* Bài học đó được kiểm tra lại ở chú Tư (nói nhẹ) và chị Lan (không nói gì).

| Ngày | Loại | Tín hiệu chính xác |
|---|---|---|
| **15** | Lời nói (lơ lửng) | *"Ủa quán em mấy giờ dọn vậy?"* — hỏi giờ đóng cửa. Không nói tại sao hỏi |
| **16** | Hành vi | Tới **trễ 25 phút**, mắt đỏ, gọi món rồi đứng im 10 giây trước khi đi. Anh cũng **không kêu trà đá** — lần đầu |
| **17** | Lời nói (thẳng) | *"Chắc anh chạy đêm. Ngày giờ đông tài xế quá."* — bình thản, không thở dài |
| **18** | — | 7h20 không có anh |

**Và đây là điểm khác biệt quan trọng nhất:** anh Dũng **không mất**. Nếu người chơi đã mua **đèn + bình giữ nhiệt** ở ngày 14 (mở ca tối), thì 19h40 ngày 18 anh tới. **Người chơi đã được báo trước ba ngày, và người chơi có thể làm gì đó với thông tin đó.**

> **Đây là bài học cấu trúc của cả phanh XĐ3:** tín hiệu báo trước không chỉ để giảm đau — **một trong ba lần, nó thật sự cho người chơi hành động được.** Nếu cả ba lần đều chỉ là báo tin buồn, người chơi sẽ học được rằng tín hiệu vô dụng và ngừng để ý. Anh Dũng là lý do người chơi vẫn để ý tới ngày 22.

**Nếu người chơi KHÔNG mở ca tối:** anh mất khỏi game từ ngày 18 tới ngày 34. Ngày 34 anh ghé ban ngày (chở con gái). Không có trách móc. Anh nói: *"Lâu quá hả em. Anh chạy đêm quen rồi."*

---

#### B-D. **BÀ SÁU** — đổi cách làm ăn ngày 35. Tín hiệu: 4 — và **đây không phải mất mát**

| Ngày | Tín hiệu |
|---|---|
| **28** | Vòng 2 trễ 20 phút. Bà nói: *"Nắng quá con ơi."* |
| **31** | **Không có vòng 2.** Lần đầu trong 31 ngày |
| **33** | Bà **ngồi nghỉ 10 phút trên ghế nhựa của xe** — chưa từng. Bà vẫn nói *"nắng quá"* |
| **34** | Bà **nhờ giữ giùm cái gánh** 15 phút để bà đi việc (SK-35, lớp "được tin giao" — P4-03 §2.4) |
| **35** | Bà xuất hiện với **bàn gấp và ghế**, bán cố định ở đầu hẻm bên. **Bà khoe.** Bà cười |

**Đây là arc báo trước duy nhất kết thúc bằng tin tốt.** Nó tồn tại vì luật N3/§9.7: nếu mọi lần người chơi đọc được tín hiệu đều dẫn tới mất mát, thì kỹ năng đọc tín hiệu trở thành một hình phạt. Bà Sáu là bằng chứng ngược.

---

#### B-E. Bảng tổng hợp — mọi thay đổi lịch trong mùa đều có báo trước

| NPC | Thay đổi | Ngày | Số tín hiệu | Có lời nói? | Kết quả |
|---|---|---|---|---|---|
| Chị Hạnh | Mua chỗ khác 2 ngày | 10–11 | 1 (SK-18 ngày 8) | Không | **Quay lại ngày 11** — arc thu nhỏ của cả game |
| Anh Dũng | Đổi ca đêm | 18 | 3 | **Có, thẳng** | Người chơi **hành động được** (mở ca tối) |
| Thầy Phúc | Vắng 2 ngày | 20–21 | 1 (ngày 19: ông nói *"cuối tuần thầy đi Vũng Tàu"*) | Có | **Quay lại ngày 22** — giả báo động có đạo đức |
| Chị Lan | Biến mất | 24 | **4, toàn hành vi** | **Không một chữ** | Quay lại **ngày 40** |
| Chú Tư | Biến mất | 30 | 3 + 2 ngày nền | Có, nhẹ | **Không quay lại.** Lời giải thích ngày 33 |
| Bà Sáu | Đổi cách bán | 35 | 4 | Có (nhưng nói sai lý do) | **Tin tốt** |
| Ông Hải | Về ở với con gái | 38–40 | 3 (ngày 27, 34, 38) | Có | Vắng ngày 40, **nhưng cái bảng hiệu thì còn** |

> **Tiêu chí nghiệm thu của toàn bộ §2.5** (đo ở playtest, ngày 31, câu hỏi mở):
> - *"Chú Tư đi đâu?"* → **≥7/10 nói được "công ty dời chỗ"** hoặc "chú có nói gì đó về công ty".
> - *"Bạn cảm thấy thế nào khi chú Tư không tới nữa?"* → **<2/10 dùng từ mang nghĩa "bị lừa / bị cướp / vô lý / bug"**.
> - Nếu tỉ lệ thứ hai ≥2/10: **thêm tín hiệu, đừng thêm lời giải thích.**

---

### 2.6. Cân bằng tích cực / tiêu cực — bảng kiểm

> **Luật nguồn (§9.7, được trích trong CANON §3):** *số sự kiện tích cực ≥ số sự kiện tiêu cực **trong trải nghiệm thực tế***.
> "Trong trải nghiệm thực tế" là phần quan trọng: danh mục 11 sự kiện cơ chế là 5 tích / 6 tiêu, **nhưng tần suất xuất hiện thực tế mới là thứ người chơi cảm nhận**. `REMEMBERED_USUAL` bắn mỗi ngày, `DROPPED_FOOD` bắn vài lần cả mùa.

**Bảng kiểm A — sự kiện KỊCH BẢN (doc này kiểm soát trực tiếp):**

| Hồi | Ngày | `++` | `+` | `·` | `−` | `−−` | Điểm ròng | Đạt? |
|---|---|---|---|---|---|---|---|---|
| **I** | 1–8 | 1 | 4 | 1 | 2 | 0 | **+4** | ✅ (N1: không có `−−` nào) |
| **II** | 9–20 | 4 | 3 | 0 | 3 | 3 | **+2** | ✅ |
| **III** | 21–33 | 5 | 3 | 1 | 3 | 5 | **0** | ⚠️ **Hoà — chấp nhận được, đây là hồi mất mát, nhưng KHÔNG ĐƯỢC ÂM** |
| **IV** | 34–40 | 9 | 0 | 0 | 1 | 2 | **+15** | ✅ |
| **Tổng** | 1–40 | **19** | **10** | **2** | **9** | **10** | **+21** | ✅ |

**Đọc bảng:**
- Tổng `++`/`+` = **29 sự kiện tích cực** vs `−`/`−−` = **19 sự kiện tiêu cực**. Tỉ lệ **1,53 : 1**.
- Hồi III hoà là **đúng ý đồ**. Nhưng vì nó hoà, Hồi IV phải bù mạnh — và nó bù `+15`.
- **Không hồi nào âm.** Đây là luật cứng.

**Bảng kiểm B — sự kiện CƠ CHẾ (ước lượng tần suất, cần đo lại sau vertical slice):**

| Sự kiện | Loại | Ước lượng/ngày (người chơi trung bình, ngày 15) | Tổng 40 ngày |
|---|---|---|---|
| `REMEMBERED_USUAL` | + (90) | **3,5** | ~140 |
| `CARED_FOR_THEM` | + (50) | **2,0** | ~80 |
| `FLOURISH` | + (15) | **4,0** | ~160 |
| `REMEMBERED_STORY` | + (70) | **0,8** | ~32 |
| `FREE_EXTRA` | + (25) | **1,2** | ~48 |
| **Tổng tích cực** | | **11,5** | **~460** |
| `ORDER_DEFECT` | − (20→100) | **0,9** | ~36 |
| `MADE_THEM_WAIT` | − (100) | **0,5** | ~20 |
| `DIRTY_HANDS` | − (40) | **0,4** | ~16 |
| `BURNT_OR_COLD` | − (80) | **0,25** | ~10 |
| `WRONG_NAME` | − (100) | **0,15** | ~6 |
| `DROPPED_FOOD` | − (75) | **0,1** | ~4 |
| **Tổng tiêu cực** | | **2,3** | **~92** |

→ **Tỉ lệ cơ chế ≈ 5 : 1** theo số lần. Theo **salience tích luỹ** thì gần hơn: tích cực ~640/ngày, tiêu cực ~140/ngày → **4,5 : 1**.

**Bảng kiểm C — luật kiểm tra chạy tự động (CI, chạy trên save giả lập):**

```ts
// sim/__tests__/balance.test.ts
it('không hồi nào có điểm cân bằng âm', () => {
  for (const act of ACTS) expect(netBalance(act)).toBeGreaterThanOrEqual(0);
});
it('không có hai ngày trọng số -- liên tiếp, trừ 24-25', () => {
  const bad = daysWithDoubleNegative().filter(pairs => !eq(pairs, [24,25]));
  expect(bad).toHaveLength(0);
});
it('mỗi ngày -- có một ngày ++ trong vòng +/-2 ngày', () => {
  for (const d of daysWithDoubleNegative()) expect(hasDoublePositiveWithin(d, 2)).toBe(true);
});
it('không sự kiện tiêu cực kịch bản nào sau ngày 36', () => {
  expect(scriptedNegativesAfter(36)).toHaveLength(0);
});
it('Hồi I không có sự kiện tiêu cực do hệ thống ép (N1)', () => {
  expect(forcedNegatives(1, 8)).toHaveLength(0);
});
```

**Bảng kiểm D — cảm nhận (playtest, không phải code). Hỏi ở cuối mỗi hồi:**

| Câu hỏi | Ngưỡng đạt |
|---|---|
| *"Trong ba ngày vừa rồi, có chuyện gì vui không?"* | **≥8/10 kể được ít nhất một chuyện**, ở mọi hồi kể cả Hồi III |
| *"Bạn có thấy game đang trừng phạt bạn không?"* | **≤2/10 trả lời có**, ở mọi hồi |
| *"Bạn có muốn chơi tiếp ngày mai không?"* | **≥8/10 có**, đo ở cuối ngày 20 và cuối ngày 33 |

> ⚠️ **Nếu Hồi III fail bảng kiểm D**, cách sửa **KHÔNG PHẢI** giảm mất mát. Cách sửa là **tăng tích cực**: thêm một SK tích cực vào ngày 26 hoặc 32. Mất mát là nội dung của hồi; nó không được cắt.

---

### 2.7. Áp lực thông lượng theo ngày (§13.3 — *"ràng buộc quan trọng nhất và đang thiếu hoàn toàn"*)

Đông khách = nhiều mắt nhìn + áp lực làm nhanh = dễ ẩu. Lịch phải **điều khiển** biến này, không để nó trôi.

| Giai đoạn | Khách/ngày (mục tiêu) | Đỉnh cao điểm 6h30–8h | Nguồn áp lực |
|---|---|---|---|
| Ngày 1–4 | 14–18 | tối đa **2 người cùng lúc** | Tutorial |
| Ngày 5–9 | 12–16 | 2 | **Chú Kiệt mở xe → giảm khách vãng lai 25%** |
| Ngày 10–13 | **22–28** | **4 người cùng lúc** | 🔴 **Clip bé Su nổ.** Đây là đỉnh áp lực đầu tiên, và nó do **thành công** gây ra |
| Ngày 14–18 | 18–22 | 3 | Ổn định. Ca tối mở thêm 4–6 khách |
| Ngày 19–23 | 16–20 | 3 | Pate đắt → người chơi phải chọn nguyên liệu → **áp lực chuyển từ tay sang đầu** |
| Ngày 24–25 | **8–12** | 1–2 | Mưa lớn −40%. **Hẻm vắng đúng lúc người chơi buồn nhất.** Chủ ý |
| Ngày 26–33 | 18–24 | 3–4 | Phục hồi |
| Ngày 34–39 | 14–18 | 2–3 | **Gỡ dần.** Chú Kiệt bớt, khách vãng lai bớt |
| **Ngày 40** | **~12, gần như toàn khách quen** | 1–2 | Hẻm trả lại cho người chơi đúng những người đã ở đó từ đầu |

**Luật:** đỉnh 4-người-cùng-lúc **chỉ xuất hiện 2 lần trong mùa** (ngày 10–13 và ngày 28–32). Nếu xuất hiện thường xuyên, T1 sụp — người chơi không còn đủ chú ý để *đọc* ánh mắt, và game biến thành game quản lý hàng chờ.

---

## 3. Dữ liệu & schema

```ts
type Weather = 'nang' | 'xanh_xam' | 'mua_chieu' | 'mua_lon';
type Balance  = '++' | '+' | '·' | '−' | '−−';

type DaySpec = {
  day: number;                 // 1..40
  weekday: 'T2'|'T3'|'T4'|'T5'|'T6'|'T7'|'CN';   // day 1 = T2
  weather: Weather;
  act: 1 | 2 | 3 | 4;

  customerTarget: { total: number; peakConcurrent: 1|2|3|4 };

  absent: NpcId[];             // ai KHÔNG tới hôm nay
  scheduleOverrides: { npc: NpcId; time?: string; note?: string }[];

  scriptedEvents: EventId[];   // tra P4-03
  arcBeats: { npc: NpcId; beatId: string }[];

  obligations: ObligationId[]; // tiền chỗ / hụi / thuốc / điện nước
  market: { priceMods: Record<IngredientId, number>; note?: string };

  balance: Balance[];          // dùng cho test cân bằng
  telegraph?: { npc: NpcId; signalId: string; kind: 'loi_noi'|'hanh_vi' }[];
};

type SeasonSpec = { days: DaySpec[]; acts: ActSpec[]; unlocks: UnlockSpec[] };
```

**Ví dụ thật — `content/days/day-29.json`** (ngày tín hiệu cuối của chú Tư):

```json
{
  "day": 29, "weekday": "T2", "weather": "mua_chieu", "act": 3,
  "customerTarget": { "total": 20, "peakConcurrent": 3 },
  "absent": [],
  "scheduleOverrides": [],
  "scriptedEvents": ["SK-31"],
  "arcBeats": [
    { "npc": "chu_tu",  "beatId": "M4" },
    { "npc": "anh_bao", "beatId": "M4" }
  ],
  "obligations": [],
  "market": { "priceMods": { "thit_nguoi": 1.15 }, "note": "thịt đắt thứ Hai" },
  "balance": ["−", "+"],
  "telegraph": [
    { "npc": "chu_tu", "signalId": "TU-S3-nua-o", "kind": "hanh_vi" }
  ]
}
```

**Và `content/days/day-30.json`** — ngày trống, cố ý:

```json
{
  "day": 30, "weekday": "T3", "weather": "xanh_xam", "act": 3,
  "customerTarget": { "total": 19, "peakConcurrent": 3 },
  "absent": ["chu_tu"],
  "scheduleOverrides": [{ "npc": "co_mai", "note": "mua MỘT ổ, không phải hai" }],
  "scriptedEvents": [],
  "__comment_scriptedEvents": "TRỐNG LÀ CỐ Ý. Sự vắng mặt cần không gian trống để được nghe thấy. Không thêm sự kiện vào ngày này.",
  "arcBeats": [
    { "npc": "chu_tu", "beatId": "M5" },
    { "npc": "co_mai", "beatId": "M5" }
  ],
  "obligations": ["tien_cho_ky3"],
  "market": { "priceMods": {} },
  "balance": ["−−"],
  "notebookLine": "Bữa nay chú Tư không ghé.\nCô nhớ hôm trước ổng có nói gì đó về chuyện công ty. Cô quên mất."
}
```

**Schema tín hiệu báo trước** — để CI kiểm được luật B1:

```ts
type TelegraphPlan = {
  npc: NpcId;
  departureDay: number;
  signals: { day: number; kind: 'loi_noi' | 'hanh_vi'; id: string; text?: string }[];
};

// CI:
it('mọi NPC rời đi phải có >=3 tín hiệu trong 8 ngày trước, >=1 là hành vi (B1, B3)', () => {
  for (const p of ALL_DEPARTURES) {
    const inWindow = p.signals.filter(s => p.departureDay - s.day <= 8 && s.day < p.departureDay);
    expect(inWindow.length).toBeGreaterThanOrEqual(3);
    expect(inWindow.some(s => s.kind === 'hanh_vi')).toBe(true);
    expect(Math.min(...inWindow.map(s => p.departureDay - s.day))).toBeLessThanOrEqual(2); // B4
  }
});
```

---

## 4. UI/UX hai thiết bị

**Cái gì hiện về tiến trình mùa — và cái gì tuyệt đối không.**

| | Có | Không |
|---|---|---|
| **Ngày** | *"Ngày 23"* ở góc màn hình buổi sáng, 3 giây, rồi mờ đi | ❌ Không có *"Ngày 23/40"*. **Người chơi không được đếm ngược.** Chữ "/40" biến mùa thành một thanh progress và giết cảm giác sống |
| **Thời tiết** | Nhìn thấy (trời, nước đọng, người mặc áo mưa) | ❌ Không icon thời tiết |
| **Giờ** | Đồng hồ nhỏ ở quầy — **đồng hồ thật của cái xe**, có trong bối cảnh | ❌ Không HUD thời gian nổi |
| **Nghĩa vụ đến hạn** | Cô Ba nhắc buổi tối hôm trước, một câu | ❌ Không quest log, không dấu chấm than |
| **Hồi (Act)** | **Không hiện gì cả.** Người chơi không bao giờ biết mình đang ở hồi mấy | Đây là khái niệm dành cho người làm game |
| **Tín hiệu báo trước** | **Không đánh dấu gì** (luật B2) | ❌ Không highlight, không âm thanh riêng, không ghi chú tự động |

**Màn hình buổi sáng (PC):**
```
       ⛅  ngày 23                       [3 giây rồi mờ]
   ┌──────────────────────────────────────────────┐
   │  hẻm, 5h50. đèn đường còn sáng.              │
   │  chú Kiệt đẩy xe ngang → liếc vô lò          │
   └──────────────────────────────────────────────┘
   [đi chợ]        [nhóm lò]        [dọn quầy]
```

**Mobile (v2):** ngày hiện ở thanh trên cùng cùng với thời tiết, biến mất sau 3 giây. Nút chợ/lò/quầy xếp dọc.

**Trợ năng bắt buộc liên quan doc này (§15):**
- **Pause mọi lúc**, kể cả giữa giờ cao điểm 4 khách. Pause **đóng băng cả sự kiên nhẫn của khách**.
- **Chế độ không giới hạn thời gian:** mọi `customerTarget.peakConcurrent` bị ép về **1** (chế độ "một khách một lượt"). Áp lực thông lượng ở §2.7 biến mất hoàn toàn; kịch bản 40 ngày **không đổi một chữ**. Đây là lý do áp lực thông lượng phải là biến độc lập với nội dung.
- **Công tắc sổ tay cuối ngày:** tắt → cô Ba vẫn ghi, nhưng game không mở trang đó ra tự động.

---

## 5. Tham số cần tune

| Tham số | Khởi điểm | Khoảng | Cách đo |
|---|---|---|---|
| 🔴 **Thời lượng một ngày** | **10–12 phút** | 8–16 | **Xem §5.1 — đây là phép đo gác cổng của cả phase** |
| Ngưỡng `playtime` bắn cú lộ | **90 phút** | 70–105 | Đo: ≥9/10 playtester phải gặp cú lộ **trước phút 115** |
| Số ngày Hồi I | **8** | 6–10 | Nếu một ngày >13 phút → giảm Hồi I xuống 6 ngày |
| Khách/ngày đỉnh (ngày 10–13) | **25** | 20–32 | Đo số `MADE_THEM_WAIT` trong 4 ngày đó: mục tiêu **3–6 lần**, không phải 0 và không phải 15 |
| Giảm khách ngày mưa | **−40%** | −30…−50 | §8 mục (c): phải đủ để bịt lỗ hổng "nhập hàng rẻ ngày mưa" |
| Khoảng trống chị Lan | **15 ngày** (24→39) | 12–18 | Playtest ngày 40: ≥7/10 phải có phản ứng cảm xúc rõ rệt khi chị xuất hiện |
| Số tín hiệu chị Lan | **4** | 4–5 | ≥6/10 nhớ được ≥2 tín hiệu khi hỏi ở ngày 26 |
| Số tín hiệu chú Tư | **3 + 2 nền** | 3–4 | ≥7/10 trả lời đúng lý do; **<2/10 thấy bị cướp** |
| Tỉ lệ sự kiện tích/tiêu kịch bản | **1,53 : 1** | 1,3–2,0 | Bảng kiểm A tự động |
| Thời lượng đỉnh cao điểm | **6h30–8h00** (90 phút game) | 60–110 | §13.3 |
| Tiền chỗ / kỳ | 🟡 chờ P3 | — | Đặt sao cho **trượt 1 kỳ là mất thật nhưng không chết** (§13) |

### 5.1. 🔴 ĐO THỜI LƯỢNG — phép đo gác cổng

> `idea.md` §23, tuần 1–2 (nguyên văn): *"Đo prototype: **một ngày chơi mất bao nhiêu phút thật** → 40 ngày = bao nhiêu giờ. **Dưới 4 giờ thì giảm số ngày, tăng mật độ.** … **'Nếu bạn chưa đo, bạn chưa thiết kế'**"*
> CANON §17: đây là mục tiêu đạt của **P0**, tức là phép đo này **phải xong trước khi doc này được implement**.

**Cách đo (không phải ước lượng — đo):**

| Bước | Việc | Đầu ra |
|---|---|---|
| 1 | Dựng 3 ngày mẫu: **ngày 4** (Hồi I, nhẹ), **ngày 12** (Hồi II, đông nhất), **ngày 32** (Hồi III, trung bình) | 3 build chơi được |
| 2 | **10 người lạ**, mỗi người chơi cả 3 ngày. Ghi màn hình, đo bằng đồng hồ thật, tính cả lúc họ do dự | 30 mẫu thời lượng |
| 3 | Tách riêng: thời gian **chợ** / thời gian **bán** / thời gian **tối + sổ tay** | 3 phân phối |
| 4 | Lấy **trung vị**, không lấy trung bình (một người loay hoay 25 phút làm lệch tất cả) | `T_ngày` |
| 5 | `T_mùa = 8×T_ngàyI + 12×T_ngàyII + 13×T_ngàyIII + 7×T_ngàyIV` | Giờ chơi ước lượng |

**Phân bổ mục tiêu cho một ngày trung bình (11 phút):**

| Phần | Phút | Ghi chú |
|---|---|---|
| Sáng: đi chợ | **2,0** | Ngày 1–6 lâu hơn (cô Ba dạy). Từ ngày 20 người chơi quen → 1,2 phút |
| Bán: giờ cao điểm 6h30–8h | **5,5** | Phần lõi. **Không được rút ngắn** |
| Bán: giờ thưa 8h–11h | **2,0** | Chỗ thở, chỗ nghe lỏm, chỗ dọn quầy |
| Chiều/tối: dọn, đếm tiền, sổ tay | **1,5** | Bao gồm đọc sổ tay cô Ba |
| **Tổng** | **11,0** | |

**Kết quả dự kiến:** `40 × 11 phút ≈ 7,3 giờ` — thoải mái trên ngưỡng 4 giờ.

**🔴 Phương án nếu đo ra DƯỚI 4 giờ (tức `T_ngày` < 6 phút):**

Thứ tự áp dụng, **dừng lại ngay khi vượt 4,5 giờ** — đừng áp dụng hết:

| # | Phương án | Cái gì đổi | Cái gì KHÔNG được đổi |
|---|---|---|---|
| **1** | 🥇 **Tăng mật độ, giữ 40 ngày** | Khách/ngày +30%. Đỉnh cao điểm 3→4 người thường xuyên hơn. Thêm 1 sự kiện kịch bản/ngày ở Hồi II–III | Lịch arc, ngày biến mất, ngày 40 |
| **2** | 🥈 **Giảm còn 32 ngày** | Nén Hồi I (8→6) và Hồi III (13→11), giữ nguyên Hồi II và IV. Mọi mốc arc dịch theo tỉ lệ | **Số ngày báo trước phải giữ nguyên tuyệt đối** (3–4 ngày). Nếu nén làm chú Tư chỉ còn 2 tín hiệu → **hỏng phanh XĐ3, thà bỏ phương án này** |
| **3** | 🥉 **Giảm còn 28 ngày** | Chỉ làm nếu 1+2 chưa đủ. Cắt 4 ngày của Hồi III | Khoảng trống chị Lan **không được dưới 12 ngày** |
| ❌ | **Thêm ngày (>40)** | **Cấm.** T4 nói 40 ngày. Kéo dài mùa làm loãng Hồi III và phá cổng cứng của §17 | |
| ❌ | **Thêm grind / thêm bước lặp để câu giờ** | **Cấm.** Đây chính là thứ T4 tồn tại để ngăn | |

**🟡 Phương án nếu đo ra TRÊN 9 giờ (`T_ngày` > 13,5 phút):**
Cắt phần **chợ** trước (gộp thành 1 màn chọn nhanh từ ngày 20), rồi cắt **giờ thưa**. **Không cắt giờ cao điểm** — đó là chỗ T1 sống.

---

## 6. Tiêu chí đạt

- [ ] 🔴 **Đã ĐO thời lượng một ngày bằng 10 người lạ.** Có con số trung vị, có phân bổ 4 phần, có kết luận `T_mùa`. **Không có con số này thì không ai được viết tiếp content ngày.** (`idea.md` §23: *"Nếu bạn chưa đo, bạn chưa thiết kế"*)
- [ ] `T_mùa` ∈ **[4,5 giờ, 9 giờ]**. Nếu ngoài khoảng → áp dụng phương án §5.1 rồi đo lại.
- [ ] **40 file `content/days/day-XX.json`** load được, test schema xanh.
- [ ] **Test cân bằng (bảng kiểm C) xanh cả 5 assert.**
- [ ] **Test tín hiệu báo trước (B1, B3, B4) xanh** cho cả 4 ca rời đi.
- [ ] **Cú lộ ngày 9:** ≥9/10 playtester gặp nó **trước phút 115** đồng hồ thật.
- [ ] **Cú lộ ngày 9:** hỏi ngay sau đó *"chuyện gì vừa xảy ra?"* → **≥8/10 nói được rằng có người đang kể chuyện về mình**, và **≥5/10 nói được tin đó không hoàn toàn đúng**.
- [ ] **Phanh XĐ3 (chú Tư):** ≥7/10 giải thích được lý do; <2/10 dùng từ mang nghĩa bị lừa/bị cướp/bug.
- [ ] **Chị Lan:** ≥6/10 nhớ được ≥2 trong 4 tín hiệu khi hỏi ở ngày 26.
- [ ] **Bảng kiểm D** đạt ngưỡng ở cả 4 hồi, đặc biệt Hồi III.
- [ ] Ngày 30 **không có sự kiện kịch bản nào** — kiểm tra bằng test, vì người viết content sau này sẽ muốn thêm vào.
- [ ] **Không sự kiện tiêu cực kịch bản nào sau ngày 36.**
- [ ] Không có chuỗi *"/40"* ở bất kỳ đâu trong UI.
- [ ] Chế độ **"một khách một lượt"** chạy được trọn 40 ngày, không kịch bản nào gãy.

---

## 7. Rủi ro & cách bịt

| Rủi ro | Mức | Cách bịt | Nối tới |
|---|---|---|---|
| 🔴 **Chưa đo thời lượng mà đã viết 40 ngày content** | **Cao nhất** | §5.1 là cổng cứng. Viết day-spec cho **ngày 4, 12, 32 trước**, đo, rồi mới viết 37 ngày còn lại | `idea.md` §23 · CANON §17 P0 |
| 🔴 **Cú lộ rơi sau phút 120 → mất cửa sổ refund** | Cao | Nhánh `playtime >= 90` bắn độc lập với ngày. Nén mốc arc thay vì bỏ | `idea.md` §17 XĐ2 (giá) · §23 |
| 🔴 **Người chơi đọc cú biến mất của chú Tư là bug** | Cao | Toàn bộ §2.5. Đặc biệt **B3** (tín hiệu hành vi) và **anh Dũng** (ca mà tín hiệu dẫn tới hành động được) | `idea.md` §17 XĐ3 (Minh) |
| 🔴 **Người chơi lo âu bị rumination vì im lặng** | Cao | Phanh #2 (sổ tay cô Ba mỗi tối, **không phán đúng sai**) + phanh #3 (công tắc "họ để lại lời nhắn") + bảng kiểm D | `idea.md` §17 XĐ3 (Linh) · §20 |
| **Hồi III quá nặng → bỏ game ở ngày 25** | Cao | Ngày 26–28 là **ba ngày tích cực liên tiếp**, ngay sau đáy. Bà Sáu M4 là arc-tin-tốt. Bảng kiểm D đo ở cuối ngày 33 | §9.7 |
| **Người chơi chơi ngắt quãng 5 phút/lần → không thấy tín hiệu nào** | Cao | (a) Sổ tay khách **người chơi tự ghi** (ngày 11) — công cụ ngoại hoá trí nhớ. (b) Sổ tay cô Ba đọc lại được. (c) Trang "Người ta kể". **(d) Tín hiệu hành vi ưu tiên hơn lời nói — cái ghế trống không cần nhớ** | `idea.md` §17 XĐ3 (Ngọc Ánh) |
| **Save-scum để né sự kiện xấu** | Trung | Autosave **ngay khi sự kiện xảy ra** + **seed cố định theo ngày** + **6 stream RNG tách rời** (CANON §8.1 L1) → tải lại ra cùng kết quả, và không dịch được chuỗi bằng hành động hợp lệ | CANON §8 e |
| **Nhập hàng rẻ ngày mưa (lịch mưa datamine được)** | Trung | Mưa giảm **40% khách** → tự cân bằng. Cộng: anh Dũng là NPC **tăng** tần suất ngày mưa, làm lịch mưa không thuần lợi | CANON §8 c |
| **Đóng cửa sớm ngày ế** | Trung | Chi phí cố định hằng ngày + khách tới mà hết hàng thì mất lòng. Cả hai nằm ở P3 | CANON §8 l |
| **Content 40 ngày phình to, không ship kịp** | Cao | Ưu tiên: **ngày 1–8 + ngày 9 + ngày 24 + ngày 30 + ngày 40** là "ngày vàng", làm trước và làm kỹ. 31 ngày còn lại dùng khung chung + arc beat | CANON §11 (đòn bẩy giảm khối lượng) |
| **Thêm sự kiện vào ngày 30 trong lần review sau** | Trung | Comment trong JSON + test tự động. Ghi rõ lý do để người sau không "sửa lỗi" | — |
| **Đổi thời tiết/lịch chợ làm gãy arc** | Trung | `DaySpec` là nguồn duy nhất; arc beat trỏ tới `day`, không trỏ tới điều kiện thời tiết | — |

---

## 8. Truy vết

| Nội dung | `CANON.md` | `idea.md` |
|---|---|---|
| 40 ngày, một mùa có điểm kết, không EA/daily login/stamina | **§1 T4** | §12.2 · §23 |
| 11 sự kiện cơ chế + luật tích cực ≥ tiêu cực (§9.7) | **§3** (ghi chú đầu mục) | — |
| Không gossip/nhớ nhầm trong 2 giờ chơi đầu + công tắc | **§12** ràng buộc 6 | §18 |
| Nghe lỏm là điều kiện tồn tại của gossip | §12 ràng buộc 4 | §18 |
| 4 ràng buộc kinh tế: hạn dùng, dự báo cầu, **thông lượng giờ cao điểm**, giá chợ | **§13** | §16 |
| Giá chợ: thịt đắt T2 rẻ T5; dịch heo pate +40% trong 5 ngày | §13.4 | §16 |
| Nghĩa vụ định kỳ = fail mềm nhưng vĩnh viễn | §13 (cuối mục) | §16 |
| Mưa giảm ~40% khách | §8 c | §21 |
| Autosave ngay khi sự kiện xảy ra + seed cố định theo ngày | §8 e | §21 |
| Vòng lặp một ngày: sáng chợ / trưa bán / chiều sổ tay / tối yên tĩnh | — | **§12.2** |
| 🔴 **Phanh XĐ3: báo trước 3–4 ngày** | — | **§17 XĐ3 phanh 1** |
| Sổ tay cuối ngày của cô Ba, 2–3 dòng, không phán đúng sai | §15 (công tắc) | **§17 XĐ3 phanh 2** |
| Công tắc "họ để lại lời nhắn" | §15 (6 công tắc) | **§17 XĐ3 phanh 3** |
| Cú quay lại ngày 40 — giữ nguyên | — | **§17 XĐ3 phanh 4** |
| Sự kiện đóng lại: giải toả / cô Ba nghỉ / truyền xe | — | **§12.2** |
| Đo "một ngày = bao nhiêu phút thật", dưới 4 giờ thì giảm ngày tăng mật độ | §17 (P0) | **§23 tuần 1–2** |
| Pause mọi lúc + chế độ không giới hạn thời gian + 6 công tắc | §15 | §20 |
| Cổng cứng tuần 12 / 2.000 wishlist | §17 | §23 |

---

## 9. Đề xuất sửa CANON

**Đ1 — Bổ sung §13: ghi nhận "thông lượng giờ cao điểm" là biến ĐỘC LẬP với nội dung ngày.**
CANON §13.3 nói đây là *"ràng buộc quan trọng nhất và đang thiếu hoàn toàn"*. Doc này thi hành nó bằng `customerTarget.peakConcurrent` trong `DaySpec`. Đề xuất ghi rõ vào CANON rằng **biến này phải ép được về 1 mà không gãy kịch bản nào** — vì đó là điều kiện để chế độ trợ năng "một khách một lượt" (§15) tồn tại mà không cần một nhánh content thứ hai. Nếu không ghi, sẽ có người viết một sự kiện đòi 3 khách cùng lúc và chế độ trợ năng sẽ chết âm thầm.

**Đ2 — Bổ sung §17 (bản đồ phase): thêm một cổng cứng cho P4.**
Hiện §17 chỉ có một cổng cứng (tuần 12 / 2.000 wishlist). Đề xuất thêm: **"P4 không được bắt đầu viết content ngày trước khi có con số `T_ngày` đo từ 10 người lạ."** Lý do: `idea.md` §23 đặt phép đo này ở tuần 1–2 và gắn nó với câu *"Nếu bạn chưa đo, bạn chưa thiết kế"*, nhưng CANON §17 chỉ liệt kê nó như một "mục tiêu đạt" của P0, không phải một cổng chặn. Rủi ro thật: 40 ngày content viết xong rồi mới phát hiện phải cắt còn 28 ngày = **mất 30% công viết**.

**Đ3 — Làm rõ §12 ràng buộc 6: "2 giờ chơi đầu" cần một định nghĩa vận hành.**
Doc này diễn dịch thành `day >= 9 OR playtime >= 90 phút`. Đề xuất CANON ghi rõ rằng mốc này là **theo `playtime` đồng hồ thật, có chặn dưới theo ngày**, không phải theo ngày thuần — vì (a) người chơi nhanh sẽ vượt 2 giờ ở ngày 14 và mất cửa sổ refund; (b) người chơi chậm sẽ gặp gossip trước khi học xong perception nếu chỉ gate theo ngày. **Và mốc 90 phút (không phải 120) là cố ý**: cú twist phải xảy ra *có khoảng thở* trước ranh giới refund, không phải *đúng lúc* ranh giới.
