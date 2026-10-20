# P3-05 — Chỗ đứng và mở rộng

> ## ⚡ REVAMP 2026-10-20 — ⚠️ CHẾT MỘT PHẦN
> Căn cứ: [`CANON.md`](../CANON.md) bản revamp. Phần ☠️ không dùng làm căn cứ.
>
> | Mục | Trạng thái | Lý do / thay bằng |
> |---|---|---|
> | Khối "Nền số học" đầu doc | ⏳ | Hụi, tiền học ☠️; thuê chỗ theo ngày giữ, số mô phỏng lại (R2/R5) |
> | §2.1 Phán quyết KHÔNG chuỗi, KHÔNG nhiều quầy | 🔁 | Phán quyết giữ (T1). Lập luận B/C dựa 40 ngày + ending ☠️. Thắng = mở chi nhánh 2 chỉ là màn kết (R0.5), không phải gameplay nhiều quầy |
> | §2.2 Năm chỗ đứng L1–L5, §2.3 Đổi chỗ của xe | 🔁 | Xe → quán mặt bằng thuê, ký hợp đồng (R0.5): "dời xe" phải xét lại (nhiều khả năng ☠️), cùng map thu nhỏ (R1). Giá thuê L1–L5 ⏳ |
> | §2.3.3 Luật CD-2 — chi phí đổi chỗ là quan hệ | ☠️ | Hệ quan hệ chết |
> | §2.4.1 Chú Kiệt dời xe | ⏳ | Phụ thuộc cơ chế chỗ đứng (R1, R0.5); đối thủ vẫn là xe bên kia hẻm |
> | §2.4.2 XĐ1.5 nhìn thấy đối thủ gian dối | 🔁 | Giữ; đối thủ thêm vai review ác ý (R4); tên đổi R6 |
> | §2.5 Bảy sự kiện hẻm theo lịch 40 ngày | ☠️ | Mùa 40 ngày chết. Ý "sự kiện báo trước" có thể tái dùng cho giá/khách (R3/R5) |
> | §2.6 Ràng buộc chống lạm dụng: dòng "Quan hệ" | ☠️ | Còn cooldown/cọc/chi phí ⏳ |
> | §6 Tiêu chí đạt, §5 tham số | ⏳ | Bỏ chỉ tiêu Friend/khách quen; số mô phỏng lại |
>
> **Còn dùng được:** phán quyết một quầy duy nhất, luật CD-1/CD-3 (đi ngó chỗ trước), XĐ1.5 — cho R1/R4.

**Thuộc phase:** P3 (Kinh tế) · **Phụ thuộc:** `phu-luc/A-quyet-dinh-co-che-moi.md` §2.5 · `P2-01` (perception) · `P2-02` (trí nhớ) · `P2-04` (đồn thổi) · `P3-01` (lịch thời tiết 40 ngày) · **`P3-03` (nền số học, `standLocationMul`)** · `P3-02` (nguồn hàng) · `P3-04` (thiết bị) · `P3-06` (nghĩa vụ & fail mềm) · **Trạng thái:** **Chốt** (các con số: **Cần đo**)

> ### ⚠️ Nền số học — doc này tiêu thụ, không định nghĩa lại
>
> | Khoá | Giá trị chốt | Nguồn |
> |---|---|---|
> | `standLocationMul` | **1,00 đầu hẻm · 0,65 góc khuất** | **P3-03 §2.4** — doc này điền ba ô còn thiếu |
> | Cầu chuẩn | **54 ổ/ngày** (băng ngày 13–22) | P3-03 §2.4 |
> | Giá bán / COGS / lãi gộp mỗi ổ | **28,0k / 15,4k / 12,6k** | P3-03 §2.5.2 |
> | Chi phí cố định | **100k/ngày → 115k từ ngày 33** | P3-01 §2.7 |
> | **Thuê chỗ** | **theo NGÀY.** `L1` = **42k/ngày** = 1.680k cả mùa | **P3-06 §9.5** — bảng hợp nhất: *"`P3-05` thắng. Chỗ đứng là tài sản của `P3-05`, và mô hình thuê theo ngày nối được với cơ chế dời chỗ."* Con số 2.200k/kỳ trong `P3-01`/`P3-03` **bị thay** bởi dòng này |
> | Nghĩa vụ khác | Hụi **500k × 8 kỳ** · tiền học **1.200k × 2** (ngày 18, 38) · **rút về nhà 150k/ngày** | **P3-06 §9.5** |
> | Lịch thời tiết 40 ngày · 6 sự kiện giá | Cố định, seed khoá | P3-01 §2.4.4, P3-03 §2.5.3 |
>
> **7 sự kiện hẻm ở §2.5 được xếp lịch để KHÔNG chồng lên 6 sự kiện giá của `P3-03`**, trừ hai cái cố ý trùng (Rằm ngày 22–23 và Hội chợ ngày 36–37).

---

## 1. Mục tiêu

1. Ghi rõ **phán quyết KHÔNG làm chuỗi cửa hàng, KHÔNG làm nhiều quầy song song**, với lập luận đủ để không ai mở lại ở P4.
2. Thiết kế cái **được** làm: **đổi chỗ đứng của một cái xe duy nhất** — chuyện có thật, rất Việt Nam, và không cần nhân bản người chơi.
3. Biến chỗ đứng thành một **quyết định có giá bằng quan hệ**, không phải bằng tiền — để T4 (*một mùa có điểm kết*) và sức nặng của quan hệ đều được giữ.
4. Cho chú Kiệt (CANON §9 #12) một cơ chế cạnh tranh **không phải combat**, và cho người chơi **tự nhìn thấy** chuyện gian dối vệ sinh của anh ta mà game không nói một lời (XĐ1.5).

**Trụ cột phục vụ:** **T1** (một xe, một chỗ, khách vẫn đứng cách nửa mét) · **T3** (không có bảng so sánh chỗ đứng có điểm số) · **T4** (đổi chỗ 2–4 lần cả mùa, có điểm dừng) · **T5** (phải **đi ngó chỗ** trước khi dời — chỗ mới không được là cú roll xúc xắc).

---

## 2. Cơ chế

### 2.1. Phán quyết: **KHÔNG chuỗi, KHÔNG nhiều quầy**

#### 2.1.1. Cái bị từ chối

- ❌ Chuỗi cửa hàng / nhiều chi nhánh.
- ❌ Hai quầy trở lên chạy song song trong cùng một ngày.
- ❌ Quầy phụ do NPC trông (kể cả cô Ba — xem NV-0 ở PL-A §2.7.1).
- ❌ Mọi dạng "quản lý từ xa", bảng tổng hợp doanh thu nhiều điểm bán, bản đồ có nhiều ghim.

#### 2.1.2. Lập luận A — hai quầy = người chơi **không ở đâu cả**

Trụ cột T1 phát biểu: *khách chấm QUÁ TRÌNH, không chỉ chấm kết quả*, với hệ quả bắt buộc: *mọi sai sót phải xảy ra trước mặt khách, trong tầm nhìn có thể đọc được*. Và câu một dòng của game: *khách đứng cách bạn **nửa mét**.*

"Nửa mét" là một **ràng buộc không gian**. Nó chỉ có nghĩa khi có **đúng một chỗ** mà người chơi đang đứng.

Giả sử có quầy A và quầy B. Ba khả năng, cả ba đều hỏng:

| Khả năng | Chuyện xảy ra | Trụ cột vỡ |
|---|---|---|
| Camera ở quầy A, quầy B chạy nền | Mọi thứ ở B trở thành **một dòng báo cáo cuối ngày**. Không có ánh mắt, không có `certainty` tích luỹ, không có bark | **T1** — không còn quá trình để chấm |
| Camera chuyển qua lại | Người chơi **không bao giờ thấy trọn một lỗi từ lúc gây ra tới lúc bị phát hiện**. Delivery-time diff (CANON §6) mất nghĩa: *"tôi thấy con quên bỏ hành rồi đó"* vs *"ủa… thiếu hành rồi"* phụ thuộc hoàn toàn vào việc khách **có chứng kiến hay không** — mà giờ chính **người chơi** cũng không chứng kiến | **T1**, **T5** |
| Quầy B do NPC trông | Vi phạm **NV-0** trực tiếp (PL-A §2.7.1): NPC không được ráp bánh | **T1**, **T2** |

Không có nhánh thứ tư.

#### 2.1.3. Lập luận B — chuỗi cửa hàng cần 100 giờ, game có 40 ngày

T4: **40 ngày, ship trọn vẹn, không Early Access.** Một vòng chơi "mở chi nhánh" chỉ có ý nghĩa cảm xúc khi người chơi **leo được nhiều bậc**: 1 → 2 → 4 → 8 quầy. Mỗi bậc cần một cao nguyên kinh tế để tích đủ vốn. Ba bậc là tối thiểu để cảm thấy có đường cong; ba bậc cần ~80–120 giờ.

Game này dài **6–10 giờ**.

Ép chuỗi vào 40 ngày sẽ cho một trong hai kết quả:
- Mở chi nhánh **quá rẻ** → nó thành một nút bấm, không phải thành tựu.
- Mở chi nhánh **đủ đắt** → chỉ ~15% người chơi chạm tới, và 85% còn lại chơi một game có một tính năng lớn treo lơ lửng mà họ không bao giờ thấy. Đó là **Early Access trá hình** — đúng thứ §23 của `idea.md` đã cắt.

#### 2.1.4. Lập luận C — chuỗi phá nguyên tắc kết game

> *"Đừng làm ending dựa trên 'bạn đã làm tốt tới đâu'. Cho mọi ending đều tử tế, chỉ khác nhau về **ai còn ở đó với mình**."* (CANON §15)

Một game có chuỗi cửa hàng **không kết được bằng câu đó**. Nó kết bằng "bạn đã mở được mấy quầy" — một con số, một thứ hạng, một bảng so sánh. Và nó kéo theo cả một họ cơ chế mà T3 cấm: bảng doanh thu theo chi nhánh, chỉ số hiệu suất, xếp hạng.

#### 2.1.5. Phán quyết

> ⚠️ **NHẬN CÓ ĐIỀU KIỆN.**
>
> **Luật CD-1.** Luôn luôn **đúng một cái xe**, đúng **một chỗ đứng** đang hoạt động tại một thời điểm. Không có chế độ quản lý từ xa. Vi phạm là bug chặn phát hành.
>
> Cái được làm: **đổi CHỖ ĐỨNG của cái xe đó.**

**Vì sao "đổi chỗ" giữ được mọi thứ mà "chuỗi" phá:**

| | Chuỗi cửa hàng | Đổi chỗ một cái xe |
|---|---|---|
| Người chơi ở đâu | Chia ra nhiều nơi | **Một nơi, luôn luôn** |
| Khách cách bao xa | Tuỳ quầy | **Nửa mét** |
| Cảm giác "mở rộng" | Có | **Có** — và mạnh hơn, vì nó là một cú nhổ neo thật |
| Chi phí | Tiền | **Quan hệ** — thứ đắt hơn trong game này |
| Kết được trong 40 ngày | Không | **Có** — 2–4 lần đổi là trọn vẹn |
| Đúng bối cảnh Việt Nam | Gượng | **Xe bánh mì Sài Gòn LÀ xe đẩy.** Người ta dời xe thật |

---

### 2.2. Bản đồ khu vực — 5 chỗ đứng

> **Lằn ranh đỏ CANON §14.1:** bản đồ này **TỰ VẼ**. Không mua asset pack. Không có quả địa cầu, poster du lịch, tờ lịch có hình trong bất kỳ chỗ đứng nào.

```
                      ┌──────────────────────┐
                      │   L3  CHỢ SÁNG       │  ◄── 6 phút đẩy xe
                      │   (cạnh tranh nặng)  │
                      └──────────┬───────────┘
                                 │
   ┌───────────────┐   ┌─────────┴─────────┐   ┌────────────────────┐
   │ L2 CỔNG TRƯỜNG│───│  L1  ĐẦU HẺM      │───│ L4 KHU VĂN PHÒNG   │
   │  (4 phút)     │   │   ★ MẶC ĐỊNH      │   │    (11 phút)       │
   └───────────────┘   └─────────┬─────────┘   └────────────────────┘
                                 │
                      ┌──────────┴───────────┐
                      │ L5 GÓC KHUẤT CUỐI HẺM│  ◄── 2 phút
                      │  (nơi bị đẩy về)     │
                      └──────────────────────┘
```

#### 2.2.1. Bảng tổng hợp

> **Đơn vị chuẩn là `standLocationMul`** — hệ số cầu mà `P3-03` §2.4 đã dùng trong `forecastDemand()`: **1,00 ở đầu hẻm, 0,65 ở góc khuất**. Doc này điền ba ô còn thiếu và gắn hồ sơ cho từng chỗ.
> Nền: cầu chuẩn **54 ổ/ngày**, giá bán bình quân **28,0k**, COGS **15,4k**, chi phí cố định **100k/ngày** (`P3-03` §2.5.2).

| | **L1 Đầu hẻm** | **L2 Cổng trường** | **L3 Chợ sáng** | **L4 Khu văn phòng** | **L5 Góc khuất** |
|---|---|---|---|---|---|
| `standLocationMul` | **1,00** | 1,05 | **1,55** *(tiềm năng)* | 1,20 | **0,65** |
| **Ổ bán / ngày thật** | **54** | 57 | **62** *(sau khi chia 3–4 xe)* | 65 | **35** |
| Giá bán bình quân / ổ | **28,0k** | **18,0k** | 25,0k | **33,0k** | 26,0k |
| COGS bình quân / ổ | 15,4k | **9,5k** | 14,0k | **18,5k** | 14,5k |
| **Lãi gộp / ổ** | **12,6k** | **8,5k** | 11,0k | **14,5k** | 11,5k |
| Doanh thu / ngày | 1.512k | 1.026k | 1.550k | **2.145k** | 910k |
| **Thuê chỗ / ngày** | **42k** | 55k | **85k** | **95k** | **12k** |
| Thuê chỗ cả mùa (40 ngày) | **1.680k** | 2.200k | 3.400k | 3.800k | **480k** |
| **Lãi ròng / ngày** *(sau COGS + thuê + 100k cố định)* | **538k** | **329k** | 497k | **747k** | 290k |
| Tỉ lệ khách quen | **62%** | 28% | 35% | **18%** | **71%** |
| Đi chợ mất (khứ hồi) | 18 ph | 26 ph | **4 ph** | 34 ph | 22 ph |
| Mái che sẵn | Không | Không | **Có** | Một phần | **Có (hiên nhà)** |
| Bán tối được (cần E4 đèn) | **Có** | Không | Không | Không | **Có** |
| Số xe khác cùng chỗ | 1 *(chú Kiệt bên kia hẻm)* | 0–1 | **3–4** | 0–2 | **0** |
| `avgGazeFactor` | 0,72 | **0,21** | **0,81** | 0,49 | 0,68 |
| `patienceBase` | 105 s | 88 s | 74 s | **52 s** | **118 s** |
| `gossipSpreadMul` | 1,00 | **2,40** | 1,70 | **0,45** | 0,80 |

**Đọc bảng — bốn điều quan trọng hơn cột "lãi ròng":**

1. **L4 lãi nhất (747k), L1 nhì (538k).** Chênh **209k/ngày**. Đổi chỗ cả mùa sang L4 được thêm ~**6.270k** — gần gấp đôi cái tủ mát. **Và mất gần hết khách quen** (§2.3.3). Đó là toàn bộ bài toán.
2. **L2 lãi thấp nhất nhì (329k) dù bán nhiều ổ nhất nhì.** Học sinh mua bánh mì không (8k) và ổ thường (25k), gần như không ai mua ổ đặc biệt (40k). **Nhiều khách ≠ nhiều tiền.**
3. **L3 có con số gạt người.** Xem §2.2.4.
4. **L5 vẫn sống được (290k/ngày).** Fail mềm không phải fail cứng: xuống góc khuất vẫn trả nổi **rút về nhà 150k/ngày + hụi 500k mỗi 5 ngày**, chỉ còn dư ~**40k/ngày** → **không mua nổi thiết bị nào nữa cả mùa**. Đúng định nghĩa CANON §13: *"không chết, nhưng mất thứ không lấy lại được."* Chi tiết ở `P3-06` §2.5.

---

#### 2.2.2. **L1 — ĐẦU HẺM** ★ *(mặc định, ngày 1)*

**Một câu:** nơi người ta biết tên bạn.

**Lưu lượng theo giờ:**

| Giờ | Khách | Ổ | Ghi chú |
|---|---|---|---|
| 5h30–6h00 | 2 | 2 | Người đi làm sớm, người tập thể dục về |
| 6h00–6h30 | 5 | 6 | |
| **6h30–7h00** | **9** | **11** | Đỉnh. Chú Tư 6h45 (T2–T6) |
| 7h00–7h30 | 8 | 10 | |
| 7h30–8h00 | 7 | 8 | Bé Su đi học ngang |
| 8h00–9h00 | 8 | 9 | Bà Bảy, thầy Phúc, người rảnh |
| 9h00–10h00 | 5 | 6 | Ông Hải (và đây là ông Hải tử tế) |
| 10h00–10h30 | 2 | 2 | Bán xổ (`P3-03` §2.3) |
| **Tổng** | **46** | **54** | 1,17 ổ/khách |
| *18h00–20h00 (cần E4 đèn)* | *+8* | *+9* | *Khách tối, ông Hải phiên bản kia* |

**Cơ cấu tính cách** (trung bình có trọng số của khách trong ngày):

| Chiều | Trung bình | Ghi chú |
|---|---|---|
| `soi` | **0,58** | Trung bình — có bà Bảy 0,9 và chị Lan 0,9, nhưng cũng có anh Dũng 0,2 |
| `nongTinh` | 0,42 | |
| `deTha` | **0,68** | Cao — hẻm quen, người ta tha thứ |
| `thanThien` | **0,61** | Cao — **đây là chỗ quan hệ lên nhanh nhất** |
| `gazeFactor` trung bình | **0,72** | Cao: người ta đứng nói chuyện, nhìn bạn làm |

**Đặc trưng thiết kế:**
- **Chỗ duy nhất có 8/12 NPC có tên** xuất hiện đều đặn. Quan hệ sâu chỉ xây được ở đây.
- `gazeFactor` cao nhất → **T1 mạnh nhất**, mọi lỗi đều bị nhìn thấy. Đây là chỗ khó nhất về vệ sinh và dễ nhất về quan hệ.
- Hẻm hẹp → xe máy chạy qua sát → `DROPPED_FOOD` +12% nếu chưa có F2 (khung gia cố).
- Cạnh tranh: **chú Kiệt bên kia hẻm**, cách ~14 mét. Đủ gần để **nhìn thấy nhau** (§2.4).

**Thời tiết:**

| | Ảnh hưởng |
|---|---|
| Mưa rào / mưa dầm | **khách ×0,60** (`P3-01` §2.8) → **×0,72** nếu có D2 (dù). Hẻm **không ngập** |
| Nắng gắt | −8% khách giờ 9h–10h30. Ổ ỉu **nhanh nhất** (`kStale` ×1,00, P3-02 §2.5.1) |
| Mát / Âm u | +0–4% khách. Ổ ỉu chậm (`kStale` ×0,80–0,85) |
| Gió | Không ảnh hưởng (hẻm kín) |

> **L1 là chỗ duy nhất mà lịch thời tiết cố định của `P3-01` §2.4.4 ảnh hưởng đúng như bảng CANON §8c.** Bốn chỗ còn lại đều lệch, và đó là một lý do chính đáng để dời.

---

#### 2.2.3. **L2 — GẦN CỔNG TRƯỜNG**

**Một câu:** ba cơn lũ, mỗi cơn 30 phút, rồi im lặng.

**Lưu lượng theo giờ:**

| Giờ | Khách | Ổ | Ghi chú |
|---|---|---|---|
| 6h00–6h15 | 2 | 2 | |
| **6h15–6h45** | **16** | **17** | **Cơn lũ 1** — vào học. 16 khách trong 30 phút |
| 6h45–7h00 | 4 | 4 | |
| 7h00–11h00 | **2** | 2 | **Chết hoàn toàn.** 4 tiếng, 2 khách |
| **11h00–11h30** | **13** | **14** | **Cơn lũ 2** — tan buổi sáng |
| 11h30–16h30 | 1 | 1 | |
| **16h30–17h15** | **16** | **17** | **Cơn lũ 3** — tan học chiều. Dữ dội nhất |
| **Tổng** | **54** | **57** | 1,05 ổ/khách — **nhưng chỉ 18,0k mỗi ổ** |

**Cơ cấu tính cách:**

| Chiều | Trung bình | Ghi chú |
|---|---|---|
| `soi` | **0,29** | Rất thấp — học sinh không soi |
| `nongTinh` | 0,31 | |
| `deTha` | **0,84** | Rất cao — tha thứ gần như mọi thứ |
| `thanThien` | **0,88** | Rất cao |
| `gazeFactor` trung bình | **0,21** | **Thấp nhất game** — ai cũng bấm điện thoại |

**Đặc trưng thiết kế:**
- **`gazeFactor` 0,21** → toàn bộ hệ perception gần như **tắt**. `DROPPED_FOOD` (salience 75) cần ~20 giây mới `CONFIRMED`. Đây là chỗ **dễ nhất về vệ sinh** — và đó chính là cái bẫy: người chơi ở đây lâu sẽ **mất thói quen**, rồi dời về L1 và trả giá.
- **Nhưng lan tin cực nhanh.** `thanThien` 0,88 + bé Su + TikTok:

```ts
// Hệ số lan tin theo chỗ đứng
const GOSSIP_SPREAD_MUL: Record<LocationId, number> = {
  L1_DAU_HEM:      1.00,
  L2_CONG_TRUONG:  2.40,   // ← cao nhất
  L3_CHO_SANG:     1.70,
  L4_VAN_PHONG:    0.45,   // ← thấp nhất, không ai quen ai
  L5_GOC_KHUAT:    0.80,
};
```
  Một `FREE_EXTRA` ở L2 lan tới **11 người trong 2 ngày**. Một `DIRTY_HANDS` bị bắt quả tang ở L2 cũng vậy. **Chỗ này khuếch đại mọi thứ.**
- **Ít tiền.** Giá bán trung bình **13k/ổ** (học sinh mua bánh mì không, bánh mì trứng). Biên lợi nhuận **thấp nhất game**: ~4,2k/ổ.
- **Thông lượng là vấn đề sống còn.** 28 khách trong 45 phút = **1 khách / 96 giây**, trong khi một ổ đầy đủ mất 50–65 giây. Không có A1 (lò gas) và A4 (kẹp) thì hàng chờ **không bao giờ hết** → `MADE_THEM_WAIT` liên tục.

**Thời tiết:** mưa **−15%** (học sinh vẫn phải đi học) — **chỗ chịu mưa tốt nhất**. Nhưng không có mái, không có chỗ trú → không có D2 (dù) thì bán trong mưa rất khổ.

---

#### 2.2.4. **L3 — CHỢ SÁNG**

**Một câu:** ai ở đây cũng biết nghề, kể cả khách.

**Lưu lượng theo giờ:**

| Giờ | Khách | Ổ | Ghi chú |
|---|---|---|---|
| **4h30–5h00** | 4 | 10 | Tiểu thương dọn hàng. **Phải dậy từ 3h30** |
| **5h00–5h30** | 6 | 14 | |
| **5h30–6h00** | **7** | **17** | Đỉnh |
| 6h00–6h30 | 5 | 12 | |
| 6h30–7h00 | 2 | 5 | |
| 7h00–8h00 | 1 | 3 | |
| 8h00–9h00 | 1 | 1 | Chợ vãn |
| **Tổng** | **26** | **62** | **2,40 ổ/khách** — ít người, nhiều ổ |

**Cơ cấu tính cách:**

| Chiều | Trung bình | Ghi chú |
|---|---|---|
| `soi` | **0,79** | **Cao nhất game.** Người bán hàng biết nghề — họ nhìn tay bạn như nhìn tay đồng nghiệp |
| `nongTinh` | **0,58** | Nói thẳng |
| `deTha` | 0,55 | |
| `thanThien` | 0,66 | |
| `gazeFactor` trung bình | **0,81** | **Cao nhất game** |

**Đặc trưng thiết kế:**
- **`soi` 0,79 × `gazeFactor` 0,81** → `traitMul` và `gazeFactor` nhân nhau. `DROPPED_FOOD` (75) đạt `CONFIRMED` sau **~0,9 giây** (so với 1,4s chuẩn của CANON §5). **Đây là chỗ khó nhất game về T1.**
- **Khách mua nhiều ổ một lúc: 2,40 ổ/khách.** Tiểu thương mua cho cả sạp. → doanh thu cao, **nhưng mỗi đơn dài gấp 2,4 lần** → thông lượng là vấn đề chết người.
- **4 phút tới nguồn hàng.** Đây là lợi thế lớn nhất và thường bị bỏ qua: S5 Thuận Ký (van xả khẩn cấp, P3-02 §2.10.1) từ 25 phút xuống **6 phút**. Cháy hàng giữa buổi không còn là thảm hoạ.
- **Cạnh tranh trực tiếp: 3–4 xe khác**, trong đó **chú Kiệt**. Lưu lượng bị chia:

```ts
function effectiveTraffic(base: number, rivals: number, myRep: number, rivalRep: number): number {
  const share = (1 + myRep) / ((1 + myRep) + rivals * (1 + rivalRep));
  return base * (1 + rivals) * share;      // tổng cầu tăng, nhưng chia phần
}
// 4 xe, danh tiếng ngang nhau  →  mỗi xe ~25% × 5 lần cầu gốc = 1,25× cầu gốc
// Hơn L1, nhưng KHÔNG gấp 2,2 lần như bảng §2.2.1 gợi ý
```

> **Cầu TIỀM NĂNG ở chợ sáng là `standLocationMul` 1,55 → ~84 ổ/ngày. Doanh số THẬT với 3–4 xe là ~62 ổ.** Người chơi đi ngó chỗ chỉ **đếm được đầu người**, tức họ thấy con số 84, không thấy 62. Đây là một cái bẫy được thiết kế, và nó gỡ được bằng **quan sát** (đếm số xe) chứ không bằng tooltip — T5 vẫn đứng.

- Phải dậy **3h30 sáng**. Ngày ở L3 bắt đầu sớm hơn 2 tiếng → nếu có E4 (đèn) và bán tối thì **ngày dài 16 tiếng** → `STALL_CLEANLINESS` cuối ngày rất cao.

**Thời tiết:** có mái chợ → mưa chỉ **−18%**, và **D2 (dù) vô dụng ở đây**. Nhưng **ngập**: chợ trũng, mưa lớn >2 giờ → **ngập, đóng cửa cả ngày** (~2 lần/mùa).

---

#### 2.2.5. **L4 — GẦN KHU VĂN PHÒNG**

**Một câu:** họ trả nhiều tiền để không phải chờ.

**Lưu lượng theo giờ:**

| Giờ | Khách | Ổ | Ghi chú |
|---|---|---|---|
| 6h45–7h15 | 9 | 11 | |
| **7h15–8h00** | **19** | **23** | Đỉnh. 19 khách / 45 phút, kiên nhẫn 52 giây |
| 8h00–8h30 | 11 | 13 | Người trễ giờ — vội nhất |
| 8h30–9h00 | 4 | 5 | |
| 9h00–11h30 | 0 | 0 | Chết |
| **11h30–12h30** | **11** | **13** | Cơm trưa |
| **Tổng** | **54** | **65** | 1,20 ổ/khách — **và 33,0k mỗi ổ** |

**Cơ cấu tính cách:**

| Chiều | Trung bình | Ghi chú |
|---|---|---|
| `soi` | 0,64 | |
| `nongTinh` | 0,38 | Không la — nhưng **bỏ đi** |
| `deTha` | **0,27** | **Thấp nhất game.** Để bụng |
| `thanThien` | **0,22** | **Thấp nhất game.** Không ai quen ai |
| `gazeFactor` trung bình | 0,49 | Vừa — họ nhìn đồng hồ nhiều hơn nhìn tay bạn |

**Đặc trưng thiết kế:**
- **Tip cao: giá bán trung bình 23k/ổ** — cao nhất game. Họ không mặc cả, họ bo tiền lẻ.
- **`MADE_THEM_WAIT` (salience 100, không cần gaze, leo thang theo giây) là sự kiện thống trị.** Kiên nhẫn trung bình ở L4: **52 giây** (so với 105 giây ở L1). Chạy 26 khách trong 45 phút với kiên nhẫn 52 giây là **bài toán khó nhất trong game về thông lượng**.
- **`deTha` 0,27 + `thanThien` 0,22** → quan hệ **gần như không xây được**. Đây là **chỗ đứng chống lại chính lõi cảm xúc của game** — cố ý. Nó là lựa chọn "tiền thuần tuý", và nó **cô đơn**.
- `GOSSIP_SPREAD_MUL` **0,45** → tin tốt cũng không lan. Danh tiếng hẻm gần như đứng yên khi bạn ở đây.
- Thuê chỗ **95k/ngày** — đắt nhất, gấp **2,26 lần** L1. Cả mùa **3.800k**, tức **+2.120k** so với L1 — **nuốt mất 26% ngân sách thiết bị**. Và có rủi ro riêng: thuê chỗ **tăng gấp đôi** trong đợt hội chợ ngày 36–37 (§2.5).

**Thời tiết:** mưa **−45%** (họ gọi ship, họ ăn căng tin). Nắng gắt −5%. Mái che một phần.

---

#### 2.2.6. **L5 — GÓC KHUẤT CUỐI HẺM**

**Một câu:** chỗ bạn về khi không còn chỗ nào khác.

**Lưu lượng theo giờ:**

| Giờ | Khách | Ổ | Ghi chú |
|---|---|---|---|
| 6h00–7h00 | 9 | 10 | |
| 7h00–8h30 | 12 | 13 | |
| 8h30–10h30 | 11 | 12 | |
| **Tổng** | **32** | **35** | `standLocationMul` = **0,65** (`P3-03` §2.4) |
| *18h00–20h00 (cần E4 đèn)* | *+5* | *+6* | |

**Cơ cấu tính cách:**

| Chiều | Trung bình | Ghi chú |
|---|---|---|
| `soi` | 0,52 | |
| `nongTinh` | 0,33 | |
| `deTha` | **0,79** | Cao |
| `thanThien` | **0,74** | Cao |
| `gazeFactor` trung bình | 0,68 | |

**Đặc trưng thiết kế:**
- **Đây là điểm đến của fail mềm P3-06.** Không trả nổi tiền thuê chỗ ở L1 → **bị đẩy về L5**. Không phải game over. Là một bậc thấp hơn, có thật, và **leo lại được** (nhưng tốn ~9–12 ngày).
- Thuê chỗ **12k/ngày** — rẻ nhất, bằng **29%** của L1. Cả mùa chỉ **480k**, tiết kiệm **1.200k** so với L1. Đây là một phần lý do L5 **sống được** dù bán ít.
- **71% khách quen.** Những người theo bạn xuống đây là **những người thật sự quý bạn**. Đây là chỗ có `thanThien` cao thứ hai, và là chỗ duy nhất mà **mỗi khách đều có tên**.
- Có hiên nhà che → mưa chỉ −22%.
- **Không có đối thủ.** Chú Kiệt sẽ không bao giờ xuống đây.
- **Bark riêng của L5**, và đây là chỗ viết được đoạn hay nhất của cả mùa:
  > Bà Bảy: *"Cô đi bộ xa chút cũng được. Bánh con ngon mà."*
  > Thầy Phúc: *"Thầy thấy ở đây cũng yên. Đỡ ồn."*

---

### 2.3. Đổi chỗ — cơ chế

#### 2.3.1. **Luật CD-3: phải đi ngó chỗ trước** (giữ T5)

Không được phép dời tới một chỗ chưa biết gì. Trước khi mở khoá lựa chọn dời tới `Lx`, người chơi phải **đi ngó chỗ** đó ít nhất một buổi.

```ts
type Scouting = {
  location: LocationId;
  scoutedAt: number;             // ngày
  revealed: {
    hourlyTraffic: boolean;      // ✅ thấy được bằng mắt
    rentPrice: boolean;          // ✅ hỏi được
    rivalCount: boolean;         // ✅ đếm được
    shelter: boolean;            // ✅ nhìn được
    personalityMix: 'ROUGH';     // ⚠️ chỉ cảm nhận được, không có số
    effectiveShare: false;       // ❌ KHÔNG biết được cho tới khi bán thật
  };
};
```

| Cách đi ngó | Chi phí | Thấy được gì |
|---|---|---|
| **Đi buổi chiều** (sau khi dẹp hàng) | Mất cảnh tối (không ghi sổ với cô Ba hôm đó) | Lưu lượng chiều, giá thuê, số xe khác |
| **Nghỉ một buổi sáng đi ngó** | Mất **một ngày lãi gộp (~680k)** + chi phí cố định **100k vẫn mất** = **−780k** | Lưu lượng giờ cao điểm — **thứ duy nhất thật sự quan trọng** |
| **Hỏi người trong nghề** | Một cuộc nói chuyện | Dì Năm (S9) và **chú Kiệt** biết hết. Chú Kiệt sẽ nói thật — nhưng **thiếu một chi tiết** |

> **Chi tiết cố ý giấu:** `effectiveShare` (lưu lượng thật sau khi chia với đối thủ ở L3) **không bao giờ lộ ra trước khi bán**. Người chơi chỉ thấy **~84 ổ tiềm năng**, không thấy **~62 ổ thật**. Đây không phải roll xúc xắc (T5 vẫn được giữ: người chơi **đếm được 3–4 xe** khi đi ngó, thông tin có đủ để suy ra) — đây là một **bài toán suy luận**, và đó là thứ T5 cho phép.

#### 2.3.2. Chi phí đổi chỗ

| Khoản | Giá trị | Ghi chú |
|---|---|---|
| **Thời gian dời** | **45 phút** (→ **25 phút** nếu có F2 khung gia cố; **+8 phút** nếu có F1 giá treo) | Ngày dời chỗ bán ít hơn **~40%** |
| **Cọc chỗ mới** | **3 ngày tiền thuê** | L4: **285k** · L3: 255k · L2: 165k · L1: 126k · L5: **36k** |
| **Mất cọc chỗ cũ** | 100% nếu dời trước kỳ thuê (10 ngày) | |
| **Danh tiếng ở chỗ mới** | Về **0** — phải xây lại. Có E3 (bảng hiệu) thì nhanh hơn 30% | |
| **Cooldown** | **6 ngày** không được dời tiếp | §2.6 |
| **Quan hệ** | **Đây mới là chi phí thật** — §2.3.3 | |

#### 2.3.3. ⭐ **Chi phí đổi chỗ là QUAN HỆ, không phải tiền** (Luật CD-2)

```ts
// world/relocation.ts
const FOLLOW_BASE: Record<RelationTier, number> = {
  Rival:        0.00,
  Acquaintance: 0.25,
  Friend:       0.65,
};

const DISTANCE_MUL: Record<DistanceBand, number> = {
  CUNG_HEM:       1.00,   // L1 ↔ L5
  GAN_300M:       0.70,   // L1 ↔ L2
  KHAC_KHU:       0.35,   // L1 ↔ L3, L1 ↔ L4
};

function followChance(npc: Npc, from: LocationId, to: LocationId, noticeDays: number): number {
  const base     = FOLLOW_BASE[npc.relation];
  const openness = 0.40 + 0.60 * npc.personality.thanThien;
  const dist     = DISTANCE_MUL[bandOf(from, to)];
  const notice   = noticeDays >= 3 ? 1.25 : (noticeDays >= 1 ? 1.00 : 0.70);
  // Lịch sinh hoạt: chú Tư đi làm 6h45 — nếu chỗ mới không nằm trên đường đi, nhân 0.3
  const onRoute  = isOnDailyRoute(npc, to) ? 1.0 : 0.30;

  return Math.min(0.90, base * openness * dist * notice * onRoute);
}
```

**Áp dụng cho 12 NPC — dời từ L1 sang L3 (chợ sáng), đã báo trước 3 ngày, quan hệ `Friend` với 7 người:**

| NPC | `thanThien` | Bucket | Trên đường đi? | `pFollow` | Theo? |
|---|---|---|---|---|---|
| Bà Bảy (bán vé số) | 0,7 | Friend | **Có** (bà đi bán khắp nơi) | **0,47** | ~50/50 |
| Chú Tư (bảo vệ) | 0,6 | Friend | **Không** (công ty hướng ngược) | **0,11** | ❌ |
| Anh Dũng (Grab) | 0,5 | Acquaintance | **Có** (chạy khắp thành phố) | 0,15 | ❌ |
| Chị Lan (văn phòng) | 0,3 | Friend | Không | **0,08** | ❌ |
| Bé Su (học sinh) | **1,0** | Friend | Không (đi học) | 0,15 | ❌ |
| Ông Hải | 0,6 | Acquaintance | Có | 0,07 | ❌ |
| Cô Mai (tạp hoá) | 0,8 | Friend | **Không** (bả trông tiệm) | **0,08** | ❌ |
| Thầy Phúc (hưu trí) | 0,5 | Friend | **Có** (thầy đi bộ buổi sáng) | **0,40** | ~40% |
| Chị Hạnh | 0,4 | Acquaintance | Không | 0,04 | ❌ |
| Anh Bảo (sinh viên) | 0,4 | Acquaintance | Không | 0,04 | ❌ |
| Bà Sáu (gánh tàu hũ) | **0,9** | Friend | **Có** (bả gánh đi bán) | **0,55** | ✅ |
| Chú Kiệt | 0,4 | — | — | — | *(anh ta cũng dời — §2.4)* |

> **Kết quả: dời từ L1 sang L3 giữ được ~1–3 trong 11 khách quen.**
> **Bạn không mất tiền. Bạn mất cái hẻm.**

**Đối chiếu — dời từ L1 xuống L5 (cùng hẻm, 2 phút đi bộ):**

| | L1 → L3 | L1 → L5 |
|---|---|---|
| `DISTANCE_MUL` | 0,35 | **1,00** |
| Số khách quen theo | **1–3 / 11** | **7–9 / 11** |
| Tiền thuê | +43k/ngày | **−30k/ngày** |
| Doanh thu | Cao hơn (nếu thắng cạnh tranh) | Thấp hơn nhiều |

**Và đây là chỗ cơ chế trở thành câu chuyện — họ nói gì:**

```json
[
  {
    "id": "DOI_CHO_THEO_BA_SAU",
    "concept": "RELOCATION_FOLLOW",
    "criteria": [{ "key": "npc.id", "op": "==", "val": "BA_SAU" }, { "key": "follow", "op": "==", "val": true }],
    "responses": [
      { "speaker": "BA_SAU", "line": "Ủa con dời qua chợ hả? Ừ, cô gánh ngang đó mỗi bữa, cô ghé." }
    ]
  },
  {
    "id": "DOI_CHO_KHONG_THEO_CHU_TU",
    "concept": "RELOCATION_FAREWELL",
    "criteria": [{ "key": "npc.id", "op": "==", "val": "CHU_TU" }, { "key": "follow", "op": "==", "val": false },
                 { "key": "noticeDays", "op": ">=", "val": 3 }],
    "responses": [
      { "speaker": "CHU_TU",
        "line": "Vậy hả con. Chú đi làm hướng kia, ghé không tiện. Thôi… con làm ăn được là mừng rồi.",
        "face": "cuoi_gan" }
    ],
    "applycontext": [["chuTu.saidGoodbye", 1, 9999999]],
    "speakonce": true
  },
  {
    "id": "DOI_CHO_KHONG_BAO_TRUOC_CHI_LAN",
    "concept": "RELOCATION_NO_NOTICE",
    "criteria": [{ "key": "npc.id", "op": "==", "val": "CHI_LAN" }, { "key": "noticeDays", "op": "==", "val": 0 }],
    "responses": [
      { "speaker": "CHI_LAN", "line": "", "face": "nhin_cho_trong", "stageDir":
        "Chị đứng ở chỗ cái xe từng đậu. Nhìn một lúc. Rồi đi. Không có thoại." }
    ],
    "applycontext": [["chiLan.abandoned", 1, 9999999]],
    "speakonce": true
  }
]
```

> **Chị Lan là NPC "im lặng biến mất" (CANON §9 #4).** Dời chỗ mà không báo trước là cách nhanh nhất mất chị vĩnh viễn — và game sẽ **không bao giờ nói cho bạn biết** điều đó đã xảy ra. Bạn chỉ nhận ra khi đếm lại xem còn ai ngày 40.

**Báo trước:** người chơi báo bằng cách **nói với khách trong 3 ngày trước khi dời** — không có nút "thông báo". Cơ chế: một mẩu giấy viết tay dán lên xe (thao tác buổi tối, 10 giây), và mỗi khách tới trong 3 ngày đó **tự đọc thấy**. `noticeDays` được tính theo **số ngày mẩu giấy được dán**, không theo ý định của người chơi.

**Luật T3:** không có UI nào hiện `pFollow`. Người chơi **không biết ai sẽ theo** cho tới sáng đầu tiên ở chỗ mới, khi họ đứng đó và đếm xem ai tới.

---

### 2.4. **Chú Kiệt** — cạnh tranh chỗ đứng, không phải combat

CANON §9 #12: *"Xe bánh mì đối thủ bên kia hẻm. `soi` 0,7 / `nongTinh` 0,6 / `deTha` 0,3 / `thanThien` 0,4. Người gian dối vệ sinh (XĐ1.5). **Vừa là đối thủ vừa là người duy nhất hiểu nghề của bạn.**"*

#### 2.4.1. Anh ta cũng dời xe

```ts
// Chú Kiệt chạy CÙNG một bộ luật với người chơi — không có AI đặc biệt
function kietDecideLocation(day: number, st: WorldState): LocationId {
  const scores = LOCATIONS.map(L => ({
    id: L.id,
    score: expectedRevenue(L, st) - L.rent - relocationCost(kiet.at, L.id)
           - RIVALRY_PENALTY * (st.playerAt === L.id ? 1 : 0),   // né người chơi... một phần
  }));
  // Chú Kiệt né người chơi khi quan hệ TỐT, tranh chỗ khi quan hệ XẤU
  const RIVALRY_PENALTY = kiet.relation === 'Friend' ? 900 : kiet.relation === 'Rival' ? -400 : 200;
  return argmax(scores).id;
}
```

| Quan hệ với chú Kiệt | Hành vi |
|---|---|
| **Rival** | **Chủ động dời tới chỗ bạn đang đứng.** Cắt lưu lượng. Đặt xe chắn tầm nhìn |
| **Acquaintance** | Tránh chỗ bạn trừ khi chỗ đó tốt hơn hẳn. Trung lập |
| **Friend** | **Chủ động tránh** — và hơn nữa: **báo tin cho bạn** (*"Ê, tuần sau chợ sửa mái, đừng qua bển."*) |

**Quan hệ với chú Kiệt lên/xuống bằng gì:**

| Hành động | Hiệu ứng |
|---|---|
| Dời tới đúng chỗ anh ta vừa dời tới | **−mạnh** |
| Nói xấu anh ta với khách (kể chuyện vệ sinh) | **−rất mạnh**, và **lan cả hẻm** — người ta không thích kẻ nói xấu đồng nghiệp |
| Cho anh ta mượn đồ khi anh ta hết hàng (đá, than, bao bì) | **+mạnh** |
| Mua hàng cùng lò, cùng giờ, không tranh giành | + nhẹ mỗi ngày |
| Bán rẻ hơn anh ta > 20% | **−mạnh** (phá giá) |

> **Không có nút "cạnh tranh". Không có thanh đối đầu.** Toàn bộ quan hệ với chú Kiệt đọc bằng: anh ta đậu xe **cách bạn bao xa**, có gật đầu chào không, và có nói gì khi cả hai cùng đứng ở chợ lúc 4h30.

#### 2.4.2. ⭐ XĐ1.5 — **người chơi NHÌN THẤY, game không nói một chữ**

CANON §7.5: *"Kẻ gian dối vệ sinh là NPC đối thủ (chú Kiệt), không phải người chơi."*

**Cơ chế: đảo ngược hệ perception. Người chơi trở thành người quan sát.**

```ts
// sim/perception.ts — CÙNG một hàm, đổi observer
function tickObservation(observer: Observer, stim: Stimulus, dt: number) {
  const rate = stim.salience
             * visibility[stim.slot][zoneOf(observer, stim.source)]
             * occluderMul(observer, stim.source)
             * observer.gazeFactor          // ← với người chơi, đây là HƯỚNG NHÌN của camera
             * observer.traitMul
             / 100;
  observer.obs[stim.id].certainty += rate * dt;
}
```

Khi người chơi đứng ở **L1 (cách chú Kiệt 14m)** hoặc **L3 (cách 8m)**, xe của anh ta nằm trong khung hình. Các sự kiện anh ta gây ra (`DROPPED_FOOD`, `DIRTY_HANDS`, `BURNT_OR_COLD`) **chạy qua đúng công thức trên**, với **người chơi là observer**.

| Khoảng cách | `visibility[HANDS]` | `DROPPED_FOOD` (75) đạt `CONFIRMED` sau |
|---|---|---|
| L3 chợ sáng, 8m, nhìn thẳng | 0,42 | **~3,2 giây** |
| L1 đầu hẻm, 14m, nhìn thẳng | 0,21 | **~6,3 giây** |
| Không nhìn (đang làm bánh) | `gazeFactor` = 0,05 | **~2 phút** → không bao giờ |

> ⭐ **Đánh đổi đẹp nhất trong doc này:** **để bắt quả tang chú Kiệt, bạn phải NGỪNG nhìn tay mình.**
> Camera quay sang anh ta = `gazeFactor` của bạn với chính mình về gần 0 — nhưng khách **vẫn đang nhìn bạn**. Mỗi giây bạn dành để nhìn anh ta là một giây bạn thao tác mà không kiểm soát.
>
> **Người chơi phải trả bằng đúng đồng tiền mà game bắt họ trả suốt 40 ngày: sự chú ý.**

**Chuỗi những gì thấy được, theo thứ tự nếu người chơi chịu khó nhìn:**

| Lần | Ngày ~ | Thấy gì | Đủ kết luận chưa |
|---|---|---|---|
| 1 | 8–12 | Anh ta lau tay vào tạp dề rồi bốc rau | Không. Ai chẳng có lúc |
| 2 | 14–18 | Ổ bánh rớt mép bàn — anh ta **thổi rồi để lại vô rổ** | Bắt đầu |
| 3 | 20–26 | Pate hôm qua, anh ta trộn vô khay mới | Gần rồi |
| 4 | 28–34 | Khách hỏi *"bánh mới hả anh?"* — anh ta *"mới ra lò"*, mà bạn **biết** lò giao lúc 5h và giờ là 10h | Rồi |

**Và game làm gì với thông tin đó? KHÔNG GÌ CẢ.**

- Không có nút tố cáo. Không có quest "vạch trần chú Kiệt". Không có thanh tra vệ sinh.
- Không có popup *"Bạn đã phát hiện chú Kiệt gian dối!"*.
- Không có achievement.
- Sổ tay người chơi (P2-06) **có thể tự ghi** — nếu người chơi chủ động ghi. Game không ghi hộ.

**Ba lựa chọn, không cái nào là "đúng":**

| Lựa chọn | Hệ quả |
|---|---|
| **Nói với khách** | Tin lan (hệ số tin xấu 0,85). Chú Kiệt mất khách. **Và bạn thành người nói xấu đồng nghiệp** — bà Bảy, bà Sáu, thầy Phúc đều có bark riêng về chuyện đó, và không cái nào khen bạn |
| **Nói thẳng với anh ta** | Một cảnh. `nongTinh` 0,6 → anh ta gắt trước. Rồi im. Rồi khoảng ngày 34 có một cảnh khác: anh ta đứng ở chỗ bạn lúc dẹp hàng, không nói gì, đưa một bịch đá. **Quan hệ +mạnh** |
| **Không làm gì** | Không có gì xảy ra. Nhưng đến ngày 40, khi đếm lại ai còn ở đó, **bạn sẽ nhớ mình đã thấy gì và đã chọn gì** |

> **Đây là Trục C của `idea.md` §3 — "được tin tưởng giao cho thứ quý giá" — áp dụng ngược:** bạn được giao một thông tin có thể huỷ hoại một người. Game không bảo bạn làm gì với nó.

**Lằn ranh bắt buộc (CANON §14.1 — không hạ thấp nghề):**
- Chú Kiệt **không phải người xấu**. Anh ta là người đang kẹt tiền. Có một cảnh (~ngày 25) người chơi thấy anh ta ngồi một mình đếm tiền lẻ rất lâu.
- **Không có ai bị bệnh** vì bánh của anh ta. Game không đi tới đó.
- Anh ta là **người duy nhất hiểu nghề của bạn**. Ở ngày 40, nếu quan hệ đạt `Friend`, có một cảnh hai xe đậu cạnh nhau lúc 5h sáng, không ai nói gì, cả hai cùng nhóm lò.

---

### 2.5. Mùa vụ và sự kiện hẻm

> Đúng **7 sự kiện** trong 40 ngày. Mỗi sự kiện **báo trước 2–4 ngày** (T5), qua thoại NPC hoặc qua một prop hình ảnh (CANON §16 Đừng-1: *nói ra + một prop, đừng mô phỏng sâu*).

| # | Sự kiện | Ngày | Kéo dài | Ảnh hưởng | Báo trước bằng |
|---|---|---|---|---|---|
| **E-1** | **Đám cưới trong hẻm** | **13–14** | 2 ngày | **L1 bị chắn hoàn toàn** (rạp dựng giữa hẻm). **L5 ×2,8** (khách đám cưới đi ngang → 98 ổ/ngày). L2/L3/L4 không đổi | Rạp dựng từ **ngày 11**. Cô Mai: *"Nhà con Hương cuối hẻm cưới, thứ Bảy dựng rạp."* |
| **E-2** | **Ngập chợ** | **17–18** | 2 ngày | Trùng **mưa dầm (17) + mưa rào (18)** của lịch `P3-01`. **L3 ngập, đóng cả ngày.** L5 ngập nửa ngày. L1 ×0,60 (mưa thường). L2 ×0,85 | Trời từ chiều ngày 16. Bà Bảy: *"Mai mưa lớn đó con, cô thấy kiến bò lên tường."* Và đây **cùng tuần** với sự kiện giá #2 (rau ×1,30) — hai cú chồng nhau, cố ý |
| **E-3** | **Sửa đường khu văn phòng** | **19–22** | 4 ngày | **L4 đóng hoàn toàn.** L3 ×1,12 | Hàng rào công trình xuất hiện **ngày 16**. Anh Dũng (Grab): *"Bển cấm đường rồi anh, chạy vòng mệt xỉu."* |
| **E-4** | **Rằm — người ta ăn chay** | **22–23** | 2 ngày | **Trùng đúng sự kiện giá #3 của `P3-03`** (khách ×0,85, rau ×1,15). Thêm lớp chỗ đứng: **L5 ×1,6** (gần chùa) · L4 ×0,70 · cầu **bánh mì chay** ×4 | Cả hẻm nói từ **ngày 20**. Cô Ba nhắc. **Không chuẩn bị đồ chay thì chỉ đơn giản bán ít đi** — không có hình phạt |
| **E-5** | **Thi học kỳ** | **26–28** | 3 ngày | **L2: cơn lũ chiều biến mất** (học sinh ở lại ôn) → mất 17 ổ; cơn lũ sáng **×1,30**. Tổng L2 ×0,72 | Bé Su nói từ **ngày 24** |
| **E-6** | **Chợ sửa mái** | **31–33** | 3 ngày | **L3 mất mái** → mưa ảnh hưởng đầy đủ, nắng gắt −20%, và `kStale` mất lợi thế. Thuê chỗ giảm còn **2.800k/kỳ** | **Chú Kiệt báo** — nhưng chỉ nếu quan hệ ≥ `Acquaintance`. Đây là phần thưởng quan hệ cụ thể nhất của §2.4 |
| **E-7** | **Hội chợ / lễ hội phố** | **36–37** | 2 ngày | **Trùng đúng sự kiện giá #6 của `P3-03`** (khách ×1,25). Thêm lớp chỗ đứng: **L4 ×2,3** · L1 ×0,78 · thuê chỗ L4 **tăng gấp đôi trong 2 ngày (+320k)** | Băng rôn treo từ **ngày 33**. Bé Su nói |

> **Hai sự kiện cố ý trùng với `P3-03`** (E-4 Rằm, E-7 Hội chợ): đó không phải va chạm, đó là **cùng một sự kiện nhìn từ hai doc** — P3-03 mô tả nó ảnh hưởng **giá và cầu**, doc này mô tả nó ảnh hưởng **chỗ đứng nào được lợi**. Năm sự kiện còn lại nằm ở các ngày `P3-03` để trống.
>
> **Và đây là chỗ hai hệ cắn nhau đau nhất — ngày 18 và 25:** tiền học **1.200k ngày 18** rơi đúng giữa **hai ngày ngập chợ (17–18)**; hụi **500k ngày 25** rơi đúng ngày **mưa rào**. Nếu người chơi đang ở **L4** thì họ vừa mất trắng **4 ngày sửa đường (19–22)** với tiền thuê 95k/ngày **vẫn phải trả** — `P3-06` §2.4 gọi đúng đó là cơ chế: *nghĩa vụ không ngừng khi doanh thu ngừng.*

**Tại sao sự kiện hẻm là cơ chế chứ không phải trang trí:**

**E-1 (đám cưới, ngày 13–14)** rơi vào ngay sau cú nghĩa vụ ngày 10, lúc người chơi vừa học xong bài học tiền mặt. Nó **ép** một quyết định: chịu **mất trắng 2 ngày** ở L1 (−1.360k lãi gộp), hay dời xuống **L5** — 2 phút đi bộ, cùng hẻm, `DISTANCE_MUL` = 1,00 nên **giữ được 8/11 khách quen**, cọc chỉ **300k**, và hứng ×2,8 lưu lượng? Chênh lệch: **+2.200k lãi gộp trong hai ngày**. Đây là **bài học đổi chỗ đầu tiên**, rủi ro thấp nhất, phần thưởng rõ nhất. Sau E-1, người chơi hiểu cơ chế — và hiểu rằng **chỗ "tệ nhất" có ngày là chỗ tốt nhất**.

**E-7 (hội chợ, ngày 36–37)** là **cái bẫy cuối mùa**, và nó được đặt rất cẩn thận:
- Băng rôn treo từ **ngày 33** → người chơi có 3 ngày để tính.
- L4 ×2,3 trong 2 ngày ≈ **+1.900k lãi gộp**.
- Nhưng: cọc L4 **2.400k** + thuê chỗ tăng **+320k** + mất 40% doanh thu ngày dời + **mất gần hết khách quen ở tuần cuối**.
- Và **tiền học 1.200k rơi ngày 38**, đúng hôm sau khi hội chợ tan, trời **mưa dầm**.

Tức: cái bẫy này **lỗ về tiền** *và* lỗ về người — nhưng bảng số duy nhất người chơi nhìn thấy (băng rôn, đám đông) chỉ nói phần được. **Không có cảnh báo nào ngoài trực giác.** Đây là quyết định cuối cùng của mùa, và nó đo đúng cái game đã dạy suốt 35 ngày.

---

### 2.6. Ràng buộc chống lạm dụng

> Mối nguy: người chơi đổi chỗ **mỗi ngày** để luôn hứng đỉnh lưu lượng — farm bản đồ thay vì chơi game.

| Ràng buộc | Giá trị | Bịt gì |
|---|---|---|
| **Cooldown** | **6 ngày** sau mỗi lần dời | Chặn cứng việc dời hằng ngày |
| **Thời gian dời** | 45 phút (25 với F2) → ngày đó **−40% doanh thu** | Mỗi lần dời tốn **~270k lãi gộp** |
| **Cọc chỗ mới** | 3 ngày tiền thuê, **mất cọc chỗ cũ** | Chi phí tiền mặt thật |
| **Danh tiếng về 0** | Ở chỗ mới, khách vãng lai cần ~4 ngày mới ổn định | Dời liên tục = luôn ở đáy đường cong |
| **Quan hệ** | §2.3.3 — mất khách quen **vĩnh viễn**, không respawn (CANON §13) | **Ràng buộc mạnh nhất** |
| **Chú Kiệt phản ứng** | Dời theo/né theo → chỗ "tốt" hôm nay có thể có 2 xe ngày mai | Bản đồ không đứng yên |
| **Lịch sinh hoạt NPC** | `onRoute` = 0,30 nếu chỗ mới không nằm trên đường đi hằng ngày của họ | Không có chỗ nào "tốt cho mọi người" |

**Số lần đổi chỗ hợp lý trong 40 ngày:**

```
40 ngày / (cooldown 6 ngày) = trần lý thuyết 6 lần
```

| Số lần dời | Đánh giá | Kết quả ngày 40 |
|---|---|---|
| **0 lần** | **Hoàn toàn hợp lệ.** Ở L1 cả mùa | Quan hệ sâu nhất (9–11 NPC `Friend`), tiền trung bình. **Đây là lối chơi mặc định, và nó không thua** |
| **1–2 lần** | **Điểm ngọt** | Thấy được 2–3 chỗ, giữ được 5–8 khách quen, tiền khá |
| **3–4 lần** | Hợp lệ, cho người thích khám phá | Thấy hết bản đồ, giữ 2–4 khách quen, tiền cao nhất |
| **5–6 lần** | **Tự phạt** | Tiền không cao hơn 3–4 lần (vì luôn ở đáy đường cong danh tiếng), và ngày 40 **gần như không còn ai**. Cảnh kết rất trống |

> **Không có hình phạt cứng cho việc dời nhiều.** Hệ thống tự cân: dời nhiều = tiền không tăng thêm mà người thì mất. **Kết game vẫn tử tế** (CANON §15) — chỉ là nó tử tế với **ít người hơn**.

**Chốt thiết kế:** mục tiêu là **≥60% người chơi dời 1–3 lần**, và **≥15% không dời lần nào**. Nếu >30% dời ≥5 lần → cooldown hoặc chi phí quan hệ đang quá nhẹ.

---

## 3. Dữ liệu & schema

```ts
// world/location.ts
export type LocationId = 'L1_DAU_HEM' | 'L2_CONG_TRUONG' | 'L3_CHO_SANG'
                       | 'L4_VAN_PHONG' | 'L5_GOC_KHUAT';

export type Location = {
  id: LocationId;
  name: string;
  rentPerDay_k: number;                       // P3-06 §9.5 — thuê theo NGÀY, không theo kỳ
  depositDays: number;                        // 3
  standLocationMul: number;                   // P3-03 §2.4 — 1.00 đầu hẻm, 0.65 góc khuất
  hourlyTraffic: { from: string; to: string; customers: number; loaves: number }[];
  ozPerCustomer: number;
  avgPrice_k: number;
  regularRatio: number;
  personalityMix: Personality;                // trung bình có trọng số
  avgGazeFactor: number;
  patienceBase_s: number;                      // L1 105 · L4 52
  gossipSpreadMul: number;
  rivalSlots: number;                          // số xe khác tối đa
  shelter: 'NONE' | 'PARTIAL' | 'FULL';
  weather: { mua: number; nangGat: number; ngap: boolean };
  marketTravel_min: number;                    // khứ hồi tới chợ
  eveningSales: boolean;                       // có khách tối không
  distanceBand: Record<LocationId, DistanceBand>;
};

export type RelocationState = {
  current: LocationId;
  movedOnDays: number[];
  cooldownUntil: number;
  scouted: Record<LocationId, Scouting | null>;
  noticePostedSince: number | null;            // ngày dán mẩu giấy
  depositPaid_k: Record<LocationId, number>;
  rentPaidToDay: number;                       // thuê trả theo ngày (P3-06 §9.5)
  localRep: Record<LocationId, number>;        // ẩn (T3)
};
```

**Ví dụ content thật** — `content/locations.json` (trích L3):

```json
{
  "id": "L3_CHO_SANG",
  "name": "Chợ sáng",
  "rentPerDay_k": 85,
  "depositDays": 3,
  "standLocationMul": 1.55,
  "standLocationMulEffective": 1.15,
  "_note_mul": "1.55 là cầu TIỀM NĂNG người chơi đếm được khi đi ngó chỗ. 1.15 là thực tế sau khi chia với 3-4 xe. Chênh lệch này KHÔNG bao giờ lộ ra trong UI.",
  "hourlyTraffic": [
    { "from": "04:30", "to": "05:00", "customers": 4, "loaves": 10 },
    { "from": "05:00", "to": "05:30", "customers": 6, "loaves": 14 },
    { "from": "05:30", "to": "06:00", "customers": 7, "loaves": 17 },
    { "from": "06:00", "to": "06:30", "customers": 5, "loaves": 12 },
    { "from": "06:30", "to": "07:00", "customers": 2, "loaves": 5 },
    { "from": "07:00", "to": "08:00", "customers": 1, "loaves": 3 },
    { "from": "08:00", "to": "09:00", "customers": 1, "loaves": 1 }
  ],
  "ozPerCustomer": 2.40,
  "avgPrice_k": 25,
  "avgCogs_k": 14.0,
  "regularRatio": 0.35,
  "personalityMix": { "soi": 0.79, "nongTinh": 0.58, "deTha": 0.55, "thanThien": 0.66 },
  "avgGazeFactor": 0.81,
  "patienceBase_s": 74,
  "gossipSpreadMul": 1.70,
  "rivalSlots": 4,
  "shelter": "FULL",
  "weather": { "muaRao": -0.18, "muaDam": -0.18, "nangGat": 0.0, "ngap": true },
  "ngapOnDays": [17, 18],
  "roofRepairDays": [31, 32, 33],
  "marketTravel_min": 4,
  "eveningSales": false,
  "openFrom": "04:00",
  "notes": "gazeFactor 0.81 × soi 0.79 = chỗ khó nhất game. DROPPED_FOOD → CONFIRMED ~0.9s. Cách lò/sạp 4 phút => S5 Thuan Ky tu 25ph xuong 6ph (P3-02 §2.10).",
  "barkPools": ["CHO_SANG_DONG_NGHIEP", "CHO_SANG_SOI"]
}
```

```json
{
  "id": "KIET_THAY_BANH_ROT",
  "concept": "PLAYER_OBSERVED_RIVAL",
  "criteria": [
    { "key": "observer", "op": "==", "val": "PLAYER" },
    { "key": "stim.source", "op": "==", "val": "CHU_KIET" },
    { "key": "stim.id", "op": "==", "val": "DROPPED_FOOD" },
    { "key": "obs.state", "op": ">=", "val": "CONFIRMED" },
    { "key": "kiet.observedCount", "op": ">=", "val": 2 }
  ],
  "responses": [
    { "speaker": "SYSTEM", "line": "", "stageDir":
      "KHÔNG có thoại. KHÔNG có popup. Camera không zoom. Chú Kiệt thổi ổ bánh, để lại vô rổ, quay đi. Người chơi thấy hoặc không thấy — tuỳ họ đang nhìn đâu." }
  ],
  "applycontext": [["kiet.observedCount", "+1", 9999999]],
  "norepeat": false,
  "odds": 100
}
```

---

## 4. UI/UX hai thiết bị

**Không có bản đồ thế giới có ghim và số liệu.** Bản đồ duy nhất là **một tờ giấy vẽ tay trong sổ tay của người chơi** (P2-06) — và **người chơi tự vẽ nó bằng cách đi ngó chỗ**.

| Yếu tố | PC | Mobile (v2) |
|---|---|---|
| Xem bản đồ | Sổ tay buổi tối → trang "mấy chỗ đứng". Ban đầu **chỉ có L1 và một mũi tên vẽ dở** | Như PC |
| Thông tin chỗ chưa ngó | **Trống.** Chỉ có tên nghe được từ NPC | Như PC |
| Thông tin chỗ đã ngó | **Chữ viết tay của người chơi**: *"chợ sáng — đông dữ, mà có 3 xe khác. Dậy 3h rưỡi."* Không có bảng số | Như PC |
| So sánh chỗ | **Không có bảng so sánh.** Người chơi tự lật trang | Như PC |
| Quyết định dời | Thao tác buổi tối: kéo cái xe trên trang giấy sang chỗ khác + xác nhận (CANON §15.5) | Chạm-để-đặt |
| Dán giấy báo trước | Một thao tác riêng, 10 giây, buổi tối. **Dễ quên — và đó là chủ ý** | Như PC |
| Ngày dời | Một cảnh **đẩy xe** 20–30 giây, đi qua hẻm, có tiếng bánh xe. Không skip được lần đầu | Như PC |
| Ai theo bạn | **Không có danh sách.** Sáng hôm sau, bạn đứng đó, và bạn đếm | Như PC |
| Chú Kiệt | Không có UI nào. Chỉ là một cái xe trong khung hình, gần hơn hoặc xa hơn | Như PC |
| `localRep`, `pFollow` | **Không bao giờ hiện** (T3) | — |

**Trợ năng (CANON §15):**
- Cảnh đẩy xe chịu công tắc **"giảm chuyển động"** → thành một cú mờ chuyển cảnh 1 giây.
- Chế độ **"khách biến mất không chia tay"** → khi bật tuỳ chọn *"họ để lại lời nhắn"*, các NPC không theo bạn sẽ để lại một mẩu giấy ở chỗ xe cũ thay vì im lặng.
- **Pause mọi lúc**, kể cả giữa cảnh đẩy xe.
- Bản đồ vẽ tay phải đọc được ở cỡ chữ 200% → các chỗ đứng phân biệt bằng **hình dáng ký hiệu**, không chỉ màu (CANON §15).

---

## 5. Tham số cần tune

| Tên | Khởi điểm | Khoảng | Cách đo |
|---|---|---|---|
| `RELOCATION_COOLDOWN` | **6 ngày** | 4–10 | Mục tiêu: ≥60% người chơi dời **1–3 lần**, ≤30% dời ≥5 lần |
| `MOVE_TIME_MIN` | 45 (25 với F2) | 30–70 | Ngày dời phải mất **~40%** doanh thu |
| `FOLLOW_BASE.Friend` | 0,65 | 0,50–0,80 | Dời L1→L3 phải giữ **1–3/11** khách quen. Nếu >5 → chi phí quan hệ quá nhẹ |
| `FOLLOW_BASE.Acquaintance` | 0,25 | 0,15–0,40 | |
| `DISTANCE_MUL.KHAC_KHU` | 0,35 | 0,25–0,50 | Phải khiến L1→L5 và L1→L3 là **hai quyết định khác loại**, không chỉ khác mức |
| `noticeMul` (báo 3 ngày) | 1,25 | 1,10–1,45 | Báo trước phải **đáng làm** nhưng không xoá được chi phí |
| Thuê chỗ / ngày L1/L2/L3/L4/L5 | **42 / 55 / 85 / 95 / 12** k | ±25% | **L1 = 42k/ngày là con số bảng hợp nhất `P3-06` §9.5.** Bốn chỗ còn lại phải khiến chênh lệch lãi ròng giữa chỗ lãi nhất và ít nhất **≤ 500k/ngày** |
| `patienceBase_s` L4 | 52 s | 40–70 | Phải khiến `MADE_THEM_WAIT` là sự kiện thống trị ở L4 (≥55% số sự kiện tiêu cực) |
| `avgGazeFactor` L2 / L3 | 0,21 / 0,81 | 0,15–0,30 / 0,72–0,88 | Kiểm theo CANON §5: `DROPPED_FOOD` ở L3 → `CONFIRMED` **~0,9s**; ở L2 → **~5,5s** |
| `gossipSpreadMul` L2 | 2,40 | 1,8–3,0 | Một sự kiện ở L2 phải lan tới **~11 người trong 2 ngày** |
| `rivalSlots` L3 | 4 | 3–5 | Doanh số thật ở L3 phải là **58–68 ổ**, không phải 84 |
| `RIVALRY_PENALTY` (Friend) | 900 | 600–1.200 | Chú Kiệt `Friend` phải **gần như không bao giờ** tranh chỗ |
| Kiet `observedCount` để đủ kết luận | 3–4 lần | 2–6 | Playtest: sau lần thứ mấy thì người chơi tự nói ra "ông này làm ẩu"? |
| Số sự kiện hẻm / mùa | **7** | 5–9 | Không quá 1 sự kiện/5 ngày, và **luôn báo trước 2–4 ngày** |
| L5 `standLocationMul` | **0,65** | **khoá** | Thuộc `P3-03` §2.4. Phải **sống được** (lãi ròng >0) nhưng không bao giờ tối ưu |
| `standLocationMul` L2/L3/L4 | 1,05 / 1,55 / 1,20 | ±0,20 | Không chỗ nào chiếm >45% tổng số ngày-bán khi sim 200 mùa |

---

## 6. Tiêu chí đạt

- [ ] **Luật CD-1 có test tự động.** Sim 40 ngày: `activeLocations.length === 1` ở mọi tick. Build fail nếu >1.
- [ ] **Không có chỗ đứng trội.** Sim 200 mùa với 6 profile người chơi: **không chỗ nào chiếm >45%** tổng số ngày-bán.
- [ ] **Chi phí quan hệ cắn thật:** dời L1→L3 ở ngày 20 → giữ được **1–3 / 11** khách quen. Dời L1→L5 → giữ **7–9 / 11**.
- [ ] **Lối "không dời lần nào" không thua:** sim so sánh — người ở L1 cả mùa phải có **tổng tiền trong khoảng 80–105%** của người dời tối ưu, và **số NPC `Friend` cao nhất**.
- [ ] **Người chơi dời 1–3 lần:** playtest 10 người → **≥6 người dời 1–3 lần**, **≥1 người không dời**, **≤3 người dời ≥5 lần**.
- [ ] **Đi ngó chỗ có giá trị đọc được:** hỏi sau khi ngó L3 *"bạn nghĩ ở đó bán được bao nhiêu?"* → người chơi nêu **cả con số tiềm năng lẫn mối lo về 3–4 xe khác** ở ≥5/10 trường hợp.
- [ ] **XĐ1.5 hoạt động không cần lời:** playtest 10 người chơi tới ngày 30, **không ai được nhắc gì về chú Kiệt** → hỏi *"bạn nghĩ gì về anh bán bánh mì bên kia?"*. **≥6/10 nêu được chuyện vệ sinh**, và **≥6/10 mô tả anh ta bằng từ trung tính hoặc thương cảm**, không phải từ "kẻ xấu".
- [ ] **Không ai hỏi "làm sao mở quầy thứ hai" sau 4 giờ chơi.** Nếu >2/10 hỏi → bản đồ đang gợi ý sai, xem lại UI.
- [ ] **Không có UI nào hiện `pFollow` / `localRep` / điểm chỗ đứng.** Grep: 0 kết quả.
- [ ] **Mọi sự kiện hẻm đều báo trước ≥2 ngày.** Kiểm content: 7/7 sự kiện có `warnedAtDay` và **ít nhất một prop hình ảnh** (CANON §16 Đừng-1).
- [ ] **Cảnh kết đọc được sự lựa chọn:** ba người chơi (0 lần dời / 2 lần / 5 lần) → cảnh kết ngày 40 có **số người xuất hiện khác nhau rõ rệt**, và **cả ba đều tử tế** (CANON §15).

---

## 7. Rủi ro & cách bịt

### 7.1. Bảng 6 câu hỏi (bắt buộc theo PL-A §2.8)

| # | Câu hỏi | Trả lời |
|---|---|---|
| Q1 | Người chơi còn bị nhìn? | **Có — và câu hỏi này quyết định cả phán quyết.** Một xe, một chỗ, luôn luôn. L3 còn làm T1 **gắt hơn** (`CONFIRMED` sau 0,9s thay vì 1,4s) |
| Q2 | Còn nói chuyện bằng nguyên liệu? | **Có.** Chỗ đứng không đụng tới kênh nguyên liệu; nó **đổi ai đang đứng trước mặt bạn** |
| Q3 | Quyết định mới mỗi sáng? | **Không — và đó là đúng.** Đổi chỗ là quyết định **2–4 lần cả mùa**, cooldown 6 ngày. Nhưng nó **đổi 10 trục quyết định của P3-02 mỗi sáng sau đó** (cơ cấu khách đổi → lò nào, bao nhiêu ổ, pate loại gì đều đổi theo) |
| Q4 | Có hiện số quan hệ / điểm chỗ đứng? | **Không.** Bản đồ là giấy vẽ tay của người chơi. `pFollow` không bao giờ hiện. Sáng hôm sau bạn **đếm bằng mắt** |
| Q5 | Kết trong 40 ngày? | **Có.** 5 chỗ, 6 lần dời tối đa, không có chỗ thứ 6 mở khoá muộn. **Chuỗi cửa hàng đã bị cắt chính vì câu hỏi này** |
| Q6 | Rủi ro đọc được trước? | **Có.** Luật CD-3 bắt đi ngó chỗ. 7/7 sự kiện hẻm báo trước 2–4 ngày. `effectiveShare` giấu nhưng **suy ra được** (đếm số xe) |

### 7.2. Lỗ hổng ăn gian (CANON §8)

| # | Ăn gian | Cách bịt |
|---|---|---|
| **Mới — farm bản đồ** | Dời mỗi ngày để luôn hứng đỉnh | Cooldown 6 ngày + mất 40% doanh thu ngày dời + cọc + danh tiếng về 0 + **mất khách quen vĩnh viễn** (§2.6) |
| **Mới — trốn perception** | Ở lì L2 (`gazeFactor` 0,21) để làm ẩu không ai thấy | (1) L2 biên lợi nhuận **thấp nhất** (4,2k/ổ). (2) `gossipSpreadMul` **2,40** — khi bị bắt một lần thì lan tới 11 người. (3) Quan hệ hầu như không lên ở L2 (`regularRatio` 28%) → ngày 40 **không còn ai** |
| **b** | Phân tầng: để khách "soi" ở chỗ này, khách dễ tha ở chỗ kia | Không tách được — mỗi chỗ là một **hỗn hợp cố định**, người chơi không chọn được khách nào tới |
| **c** | Lịch mưa: dời tới chỗ chịu mưa tốt (L2, −15%) vào ngày mưa | Cooldown 6 ngày > tần suất mưa. Và dự báo chỉ đúng 75% (P3-02) |
| **k** | Từ chối phục vụ người "soi" bằng cách bỏ chỗ | Người bị bỏ lại **kể cho cả hẻm**. Và quay về L1 sau đó thì họ vẫn ở đó |
| **l** | Về L5 (thuê 12k) rồi bán ít, né chi phí | `dailyCost` thiết bị (tới 109k/ngày, P3-04) **không giảm theo chỗ đứng**. Và nghĩa vụ định kỳ (P3-06) không đổi. L5 sống được, không giàu được |
| **e** | Save-scum để xem chỗ mới có tốt không | Seed cố định theo ngày + **autosave ngay khi dời xong** |

### 7.3. Rủi ro thiết kế

| Rủi ro | Mức | Cách bịt |
|---|---|---|
| **Người chơi đọc bản đồ như một bảng tính và chọn "chỗ tốt nhất"** | **Cao** | Không có bảng so sánh. Thông tin nằm ở **chữ viết tay của chính họ**. Và không tồn tại chỗ tốt nhất: L3 nhiều tiền nhất nhưng khó nhất + chia khách; L4 tip cao nhất nhưng lạnh lẽo nhất; L1 ít tiền hơn nhưng là chỗ duy nhất có **người** |
| **Dời chỗ bị đọc là "mất tiến trình"** — người chơi thấy như bị phạt | **Cao** | (1) E-1 (đám cưới ngày 9) dạy cơ chế ở mức rủi ro thấp nhất trước. (2) Các NPC **không theo** vẫn có lời chia tay tử tế (`RELOCATION_FAREWELL`), không có ai giận. (3) Cô Ba có một câu ở cảnh tối trước khi dời: *"Xe mà, dời được. Người thì hơi khó."* — nói thẳng luật chơi mà không hiện một con số nào |
| **L4 (văn phòng) quá hấp dẫn về tiền → ai cũng đi** | Trung bình | `deTha` 0,27 + `thanThien` 0,22 + `gossipSpreadMul` 0,45 → **quan hệ đứng yên**. Cảnh kết ngày 40 của người ở L4 cả mùa sẽ rất vắng, và đó là **hệ quả tự nhiên**, không phải hình phạt. Thêm: E-6 làm thuê chỗ tăng gấp đôi đúng tuần cuối |
| **Chú Kiệt bị đọc là phản diện** | **Cao** | Lằn ranh CANON §14.1 (không hạ thấp nghề). Ba bảo hiểm: (1) anh ta là **người kẹt tiền**, có cảnh đếm tiền lẻ ngày ~25. (2) **Không ai bị bệnh** vì bánh của anh ta — game không đi tới đó. (3) Nhánh `Friend` phải **dễ đạt hơn** nhánh `Rival`, và cảnh hai xe cùng nhóm lò lúc 5h sáng là một trong những cảnh đẹp nhất game |
| **Người chơi bị ép "tố cáo" chú Kiệt** | Trung bình | **Không có nút tố cáo.** Không có quest. Không có achievement. Sổ tay chỉ ghi nếu người chơi tự ghi. "Không làm gì" là một lựa chọn hoàn chỉnh, và nó **không bị phạt** |
| **Vi phạm Đừng-1** — mô phỏng sâu 5 chỗ đứng khi người chơi chỉ ở 1 chỗ | **Cao** | **Chỗ đứng không có người chơi thì KHÔNG được mô phỏng.** Lưu lượng của L3 khi bạn ở L1 là **một con số trong bảng tra**, không phải một sim chạy nền. Vị trí chú Kiệt là **một biến**, không phải một agent đang sống. Khi cần cho người chơi biết chuyện gì xảy ra ở chỗ khác → **một câu thoại + một prop** (Jeff Orkin) |
| **Ngân sách art: 5 chỗ đứng = 5 nền** | **Cao** | Nền **bake vào RenderTexture** (CANON §2). Mỗi chỗ 1 nền tĩnh + 3–4 prop đặc trưng, tái dùng chung thư viện prop hẻm (ghế nhựa, xe máy dựng sát vách, chậu trầu bà). **Vertical slice chỉ làm L1** — 4 chỗ còn lại vẽ sau khi đạt 2.000 wishlist (cổng cứng §17) |
| **Vi phạm lằn ranh đỏ bản đồ** | **Cao** | Bản đồ khu vực **TỰ VẼ**, là một tờ giấy nguệch ngoạc trong sổ tay, không phải bản đồ địa lý. Không có quả địa cầu, poster du lịch, tờ lịch có hình ở bất kỳ chỗ đứng nào (CANON §14.1) |
| **Ngân sách thoại: 5 chỗ × barks riêng** | Trung bình | Dùng **pool generic dùng chung** (CANON §11) + ~35 dòng riêng mỗi chỗ cho tình huống đặc trưng + ~40 dòng chia tay/đi theo + ~30 dòng chú Kiệt = **~250 dòng**. Nằm trong khoản P3 |

---

## 8. Truy vết

| Nội dung | `idea.md` | `CANON.md` | Doc khác |
|---|---|---|---|
| Phán quyết ⚠️ NHẬN CÓ ĐIỀU KIỆN — không chuỗi, không nhiều quầy | — | **§10 hàng 3** | **PL-A §2.5** |
| T1 — khách đứng cách nửa mét, chấm quá trình | — | §0, §1 | — |
| T4 — 40 ngày, không Early Access | — | §1 | — |
| Fail mềm — *"mất chỗ đứng đẹp phải dời sang góc khuất (ít khách hơn cả mùa)"* | **§22, dòng 1041** | §13 | P3-06 |
| Khách ruột mất là mất thật, không respawn quan hệ | §22, dòng 1041 | §13 | P2-02 |
| Chú Kiệt — đối thủ, người gian dối vệ sinh, người duy nhất hiểu nghề | — | **§9 #12, §7.5** | — |
| XĐ1 — không thưởng gian dối vệ sinh, người phán xét luôn là người Việt | — | §7 | — |
| Perception — công thức, bảng `visibility`, 4 state | — | §5 | P2-01 |
| `MADE_THEM_WAIT` không cần gaze, leo thang theo giây | — | §3.1 | — |
| Đồn thổi — 6 ràng buộc, tin tốt lan mạnh hơn | — | §12 | P2-04 |
| Chị Lan — người im lặng biến mất | — | §9 #4 | — |
| Chú Tư — arc biến mất ~ngày 30, có báo trước 3–4 ngày | — | §9 #2 | P4-03 |
| Lịch sinh hoạt NPC · dự báo cầu | §22, dòng 1036 | §13.2 | P3-02 |
| Trục C — được tin tưởng giao cho thứ quý giá | §3 | — | §2.4.2 |
| Đừng-1 — đừng mô phỏng sâu cái không nhìn thấy (Radiant AI / Jeff Orkin) | §16 | §16 | — |
| Lằn ranh đỏ — bản đồ tự vẽ, không hạ thấp nghề, không một chữ về chiến tranh | — | **§14.1** | — |
| Nguyên tắc kết game — *"ai còn ở đó với mình"* | — | §15 | P4-05 |
| 12 lỗ hổng ăn gian | §21 | §8 | §7.2 |
| Trợ năng — khách biến mất không chia tay, giảm chuyển động, pause | — | §15 | P5-01 |
| Cổng cứng 2.000 wishlist tuần 12 | §23 | §17 | P6-01 |
| **`standLocationMul` 1,00 đầu hẻm / 0,65 góc khuất** | — | — | **P3-03 §2.4** |
| **Thuê chỗ 42k/ngày ở `L1`** (bảng hợp nhất — thay cho 2.200k/kỳ) | §22 | §13 | **P3-06 §9.5** |
| Lịch thời tiết 40 ngày (mưa ngày 10, 17, 18, 25, 32, 38) | — | §8 (c) | **P3-01 §2.4.4** |
| Sự kiện giá #3 (Rằm 22–23) và #6 (Hội chợ 36–37) | — | §13.4 | **P3-03 §2.5.3** |
| Ổ bánh ỉu theo `kStale`, nguồn hàng gần chợ | — | §13.1 | **P3-02 §2.5.1, §2.10** |

---

## 9. Đề xuất sửa CANON

1. **Thêm mục §14.2 "Năm chỗ đứng"** vào CANON, chốt định danh `L1_DAU_HEM` … `L5_GOC_KHUAT` cùng tiền thuê và một dòng đặc trưng mỗi chỗ — để P4/P5 không bịa thêm chỗ đứng.

2. **Bổ sung §5** một dòng về việc đảo chiều observer:
   > Hệ perception chạy **hai chiều**. NPC quan sát người chơi (mặc định), và **người chơi quan sát chú Kiệt** bằng đúng công thức, với `gazeFactor` = hướng nhìn của camera. Để nhìn anh ta, người chơi phải ngừng nhìn tay mình. Xem `P3-05` §2.4.2.

3. **Bổ sung §13 (Fail mềm)** làm rõ đích đến:
   > Không trả nổi tiền thuê chỗ (42k/ngày ở `L1`, hạn ân **3 ngày** — `P3-06` §2.4) → **bị đẩy về `L5_GOC_KHUAT`** (`standLocationMul` **0,65** = 35 ổ/ngày, thuê **12k/ngày**). Lãi ròng vẫn **290k/ngày** → **không phá sản**, nhưng sau khi rút về nhà 150k và hụi 500k mỗi 5 ngày thì chỉ dư ~**40k/ngày** → gần như không mua nổi thiết bị nào nữa cả mùa. Leo lại được, tốn ~9–12 ngày. **Không phải game over.**

4. **Bổ sung §9 #12 (chú Kiệt)** một dòng: *"Chú Kiệt cũng dời xe, chạy cùng bộ luật chỗ đứng với người chơi. Quan hệ `Friend` → anh ta tránh chỗ bạn và báo tin cho bạn; `Rival` → anh ta tranh chỗ."*

5. **Bổ sung §16 Đừng-1** một câu áp dụng cho bản đồ:
   > **Chỗ đứng không có người chơi thì không được mô phỏng.** Lưu lượng nơi khác là một con số trong bảng tra, không phải một sim chạy nền. Vị trí đối thủ là một biến, không phải một agent đang sống.

6. **Cân nhắc sửa §3.1** — `MADE_THEM_WAIT` cần ghi rõ `patienceBase` là **hằng số theo chỗ đứng** (L1 105s · L2 88s · L3 74s · L4 **52s** · L5 118s), không phải một hằng số toàn cục.

7. **✅ Đã hội tụ với `P3-06` §9.5 — và doc này là bên "thắng" về thuê chỗ.**
   `P3-06` §9.5 phán: *"`P3-05` thắng. Chỗ đứng là tài sản của `P3-05`, và mô hình thuê theo ngày nối được với cơ chế dời chỗ."*

   → **Tiền thuê chỗ là `rentPerDay_k`, không phải một khoản trả theo kỳ.** `L1` = **42k/ngày**. Bốn chỗ còn lại: L2 55k · L3 85k · L4 95k · L5 **12k** (§2.2.1). Cọc = **3 ngày tiền thuê**.

   Lý do thiết kế (nên ghi vào CANON §13 để không bị đảo lại): thuê theo kỳ làm cơ chế đổi chỗ **vỡ** — dời giữa kỳ thì mất cả kỳ, cọc nửa kỳ lên tới 2.400k, và người chơi bị khoá vào một chỗ bởi kế toán chứ không bởi quan hệ. **Mà Luật CD-2 nói rõ: chi phí đổi chỗ phải là QUAN HỆ, không phải tiền.** Thuê theo ngày giữ được luật đó.

   **✅ Đã xử lý.** Bảng hợp nhất được duyệt và nâng thành **CANON §13.1**. Con số *"thuê chỗ 2.200k ngày 10 / 25 / 40"* đã được rút khỏi `P3-01`, `P3-02`, `P3-03` và khỏi phần thân `P3-06`. Không còn tồn tại song song.
