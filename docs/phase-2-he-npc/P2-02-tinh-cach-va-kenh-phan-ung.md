# P2-02 — Tính cách 4 chiều và 5 kênh phản ứng

> ## ⚡ REVAMP 2026-10-20 — ⚠️ CHẾT MỘT PHẦN
> Căn cứ: [`CANON.md`](../CANON.md) bản revamp. Phần ☠️ không dùng làm căn cứ.
>
> | Mục | Trạng thái | Lý do / thay bằng |
> |---|---|---|
> | §1 "doc gánh T3" · T-14 · R1 | ☠️ | T3 chết; thay bằng T6 (sao công khai) |
> | §2.1 ánh xạ `deTha` → decay, `thanThien` → tốc độ quan hệ + `pGossip`; cột `pGossip`, "ngày lên Friend" | 🔁 | 4 chiều thành **persona review** (CANON §4): `nongTinh` độ gắt chữ · `deTha` khoan dung khi chấm sao · `thanThien` xác suất viết chữ. Bảng chốt ở R4 |
> | §2.3 "nút lan tin", "nhớ dai" · cài "im lặng biến mất" bằng memory | 🔁 | Chị Lan → khách chỉ chấm sao, không chữ (CANON §9) |
> | §3.5 Kênh 5 — hệ quả trễ (vắng n ngày, kể cho người khác, đổi món, trần tin, biến mất) · kênh 5 trong luật phối kênh | ☠️ | Hệ quả đổ về **sao/review**; số khách chỉ đi qua sao (T6, R5) |
> | §3.4 hành động: thêm tip theo `npcRelTier`, dắt người khác tới, ghi sổ nợ, ngồi lại để nghe lỏm | ☠️ | Quan hệ, sổ nợ, nghe lỏm đã chết |
> | §4.1 `WRONG_NAME` · §4.7 `REMEMBERED_USUAL` · §4.8 `REMEMBERED_STORY` | ☠️ | Sự kiện chết theo trí nhớ NPC |
> | §4 cột "Trễ" + "Lan tin" của mọi bảng | ☠️ | Thoại mẫu + kênh tức thì vẫn dùng; thoại đổi giọng gen Z ở R6 |
> | §4.6 chị Lan: báo trước 3–4 ngày, vắng/biến mất · T-7, T-10 | ☠️ | Nguyên tắc "im lặng nguy hiểm hơn ồn ào" giữ, nhưng biểu hiện bằng **sao thấp không chữ** (R4) |
> | §5.1 M2 chú Tư dời đi ~ngày 30 · M3′/T-12 "biến mất vĩnh viễn" | ☠️ | Arc theo ngày + vắng khách theo người đã chết |
> | T-1 "sau 3 ngày chơi" · hằng số cường độ, delay, ngưỡng | ⏳ | Chốt lại khi mô phỏng R4–R5 |
> | Tên 12 NPC, bảng 11×12 | ⏳ | Đổi tên riêng R6; còn 8 sự kiện (CANON §3) |
>
> **Còn dùng được:** 4 chiều + quy tắc suy hành vi §2.3 (làm persona R4) · kênh 1–4 (mặt 216 tổ hợp, dáng Rain World, bark, hành động tức thì) · mood độc lập §5.2 · chống twinning §5.3 · khách khó ưa chú Kiệt → review ác ý (R4).

**Thuộc phase:** P2 — Hệ NPC đầy đủ
**Phụ thuộc:** `P2-01-rule-database-thoai.md` (danh mục fact §2.3.1 — doc này đọc/ghi đúng tên đó) · `CANON.md` §3 (11 sự kiện) · §4 (4 chiều) · §5 (perception) · §6 (delivery-diff) · §9 (12 NPC) · §12 (trí nhớ, đồn thổi) · §14 (ngôn ngữ) · §15 (trợ năng) · §16 (Đừng-1, Đừng-3, Đừng-4)
**Trạng thái:** **Chốt** về 4 chiều, 5 kênh và bảng 11×12 · **Cần đo** ở các hằng số cường độ, delay, ngưỡng biến mất

---

## 1. Mục tiêu

Biến bốn con số vô hình thành **thứ người chơi đọc được bằng mắt**. Doc này định nghĩa: bốn chiều tính cách nghĩa là gì, chúng chảy vào hệ nào, và chúng **hiện ra qua đúng năm kênh chạy song song**.

Phục vụ trụ cột:

- **T3** (không hiện chỉ số quan hệ) — đây là doc gánh T3. Nếu người chơi không đọc được quan hệ qua mặt/lời/dáng/hành động/hệ quả trễ, thì T3 sụp và ai đó sẽ đòi thêm thanh tình cảm.
- **T1** (chấm quá trình) — phản ứng phải xảy ra **trước mặt**, đúng lúc, trong tầm nhìn đọc được.
- **T5** (attention nhìn thấy được) — nét mặt và dáng người **là** cách state `GLIMPSED`/`NOTICED`/`CONFIRMED` hiện ra.

Một câu tóm tắt cả doc:

> **Phản ứng im lặng phải nguy hiểm hơn phản ứng ồn ào.** Người thật ít khi hét vào mặt bạn; họ chỉ là không quay lại nữa.

---

## 2. Cơ chế

### 2.1. Bốn chiều — định nghĩa chính xác và hệ nhận

```ts
// content/npcs/types.ts — nguyên văn CANON §4
type Personality = {
  soi: number        // 0..1  kỹ tính ↔ xuề xoà   → traitMul ở tầng nhận thấy
  nongTinh: number   // 0..1  dễ nổi  ↔ điềm đạm  → cường độ phản ứng, âm lượng
  deTha: number      // 0..1  dễ bỏ qua ↔ để bụng → tốc độ decay của memory
  thanThien: number  // 0..1  mở lòng ↔ khép kín  → tốc độ lên quan hệ + xác suất lan tin
}
```

> **Đọc `deTha` cho đúng:** `deTha` **cao** = **dễ tha** = quên nhanh = decay **nhanh**. `deTha` thấp = để bụng = decay chậm. Bà Bảy `deTha 0.8` soi kinh khủng nhưng mai vẫn ghé. Chị Lan `deTha 0.2` thấy một lần là nhớ hai tuần.

#### Bảng ánh xạ đầy đủ: chiều → hệ → công thức → biểu hiện người chơi thấy

| Chiều | Hệ nhận chính | Công thức / cách vào hệ | Hệ nhận phụ | Người chơi **thấy** gì |
|---|---|---|---|---|
| **`soi`** | **Perception** (CANON §5) | `traitMul = 0.55 + 0.9 × soi` → `rate = salience × visibility × occluderMul × gazeFactor × traitMul / 100` | Số lỗi bị **bắt** trong `defectCount`; ngưỡng `GLIMPSED` sớm hơn | Người này **quay đầu sớm hơn**. Bà Bảy ngẩng lên khi bạn mới vừa trượt tay |
| | | | Mật độ rule (P2-01 §2.11) | Họ **có câu để nói** về những thứ người khác bỏ qua |
| **`nongTinh`** | **Cường độ phản ứng** | `intensityMul = 0.5 + 1.0 × nongTinh` → chọn tầng biểu cảm I1/I2/I3 và âm lượng bark | `reactionDelay` (§6.4): nóng tính phản ứng **sớm hơn** | **To hơn, nhanh hơn, người khác quay lại nhìn.** `witnessCount` tăng |
| | | `barkVolume = 0.4 + 0.6 × nongTinh` | | Ông Hải sau 10h làm cả hàng chờ ngoái đầu |
| **`deTha`** | **Trí nhớ** (CANON §12) | `decayRate = base × (0.4 + 1.6 × deTha)` ⚠️ đây là một **TỐC ĐỘ**; chỗ nào đem nó nhân vào một **THỜI LƯỢNG** thì phải NGHỊCH ĐẢO — xem `P2-03 §2.4`, một bản dựng đã gắn ngược chiều ở đúng chỗ đó — `base` = −2/−10/−20 theo bucket | Ngưỡng promote short→long: `deTha` cao thì **khó promote** | **Bao nhiêu ngày sau họ còn nhắc.** Chị Lan nhắc sau 9 ngày; chú Tư quên sau 1 ngày |
| | | Sàn theo bucket: `points = max(points − decay, floor_of_tier)` | | |
| **`thanThien`** | **Tốc độ quan hệ** | `relGain = base × (0.5 + 1.0 × thanThien)` | | Bao nhiêu ngày để lên `Friend`. Bé Su (1.0) lên sau ~4 lần; chị Lan (0.3) cần ~14 lần |
| | **Xác suất lan tin** (CANON §12) | `pGossip = 0.15 + 0.55 × thanThien`, nhân thêm `×1.35` nếu tin tốt (CANON §12.5) | Số hop tối đa của tin từ người này | Họ **kể cho ai đó** ở góc hẻm — và bạn **nghe lỏm được** (CANON §12.4) |

**Bốn chiều KHÔNG được chạm vào:** công thức có ra đúng món không, tiền có vào túi không, cốt truyện có unlock được không (CANON §16 Đừng-3). Chúng đổi **biến thể**, **cường độ hiển thị** và **thời gian sống của ký ức** — không đổi **category** của hệ quả.

#### Giá trị 12 NPC (CANON §9, chép nguyên)

| # | NPC | `soi` | `nongTinh` | `deTha` | `thanThien` | `traitMul` | `intensityMul` | `pGossip` | Ngày để lên `Friend` (ước) |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Bà Bảy | **0.9** | 0.6 | 0.8 | 0.7 | **1,36** | 1,10 | 0,54 | ~6 |
| 2 | Chú Tư | 0.3 | 0.3 | **0.9** | 0.6 | 0,82 | 0,80 | 0,48 | ~7 |
| 3 | Anh Dũng | 0.2 | 0.5 | 0.7 | 0.5 | 0,73 | 1,00 | 0,43 | ~8 |
| 4 | Chị Lan | **0.9** | **0.1** | **0.2** | 0.3 | **1,36** | **0,60** | 0,32 | **~14** |
| 5 | Bé Su | 0.4 | 0.4 | **0.9** | **1.0** | 0,91 | 0,90 | **0,70** | **~4** |
| 6 | Ông Hải | 0.5 | **0.9** | 0.5 | 0.6 | 1,00 | **1,40** | 0,48 | ~7 |
| 7 | Cô Mai | 0.6 | 0.4 | 0.6 | 0.8 | 1,09 | 0,90 | 0,59 | ~5 |
| 8 | Thầy Phúc | 0.8 | 0.2 | 0.7 | 0.5 | 1,27 | 0,70 | 0,43 | ~8 |
| 9 | Chị Hạnh | 0.5 | 0.3 | 0.6 | 0.4 | 1,00 | 0,80 | 0,37 | ~10 |
| 10 | Anh Bảo | 0.3 | 0.2 | 0.8 | 0.4 | 0,82 | 0,70 | 0,37 | ~10 |
| 11 | Bà Sáu | 0.4 | 0.3 | 0.8 | **0.9** | 0,91 | 0,80 | **0,65** | ~5 |
| 12 | Chú Kiệt | 0.7 | 0.6 | **0.3** | 0.4 | 1,18 | 1,10 | 0,37 | ~12 |

> **Lưu ý về `gazeFactor`, đừng nhầm với `soi`.** Anh Bảo `soi 0.3` nhưng thứ làm cậu không thấy gì là **`gazeFactor` thấp nhất hẻm** (cắm mặt điện thoại) — đó là biến **hành vi theo thời điểm**, không phải tính cách. Cậu là sandbox để người chơi học hệ perception (CANON §9 hàng 10): người chơi **nhìn thấy** cậu cúi xuống, và hiểu ngay vì sao mình an toàn (CANON §5: *"gaze phải được VẼ RA"*).

---

### 2.2. Vì sao cắt từ 6 chiều còn 4

Bản gốc (idea.md §9.3) có sáu chiều: `soi`, `noiThang`, `kienNhan`, `nongTinh`, `thanThien`, `deTha`. Hội thảo thiết kế (idea.md HT7) cắt còn bốn. Lý lẽ quyết định, của Minh:

> *"6 chiều × nhớ nhầm × đồn thổi = ba tầng nhiễu chồng lên nhau, người chơi không thể phân giải được cái nào gây ra cái gì."*

Đây không phải lý lẽ về ngân sách. Nó là lý lẽ về **khả năng quy nạp của người chơi**. Game này bắt người chơi làm một việc: quan sát con người rồi rút ra luật. Nếu cùng một kết quả có thể do sáu nguyên nhân độc lập, cộng với **nhớ nhầm** (CANON §12) và **đồn thổi** (CANON §12) làm nhiễu thêm hai tầng nữa, thì không ai rút được luật gì — và trò chơi biến thành xổ số có đồ hoạ đẹp.

Cụ thể hai chiều bị cắt đi đâu:

| Chiều bị cắt | Đi đâu | Lý do gộp được |
|---|---|---|
| **`noiThang`** (nói thẳng ↔ nuốt vào) | **Suy ra** từ `nongTinh` và `thanThien` (CANON §4) | "Nói ra" chỉ có hai nguồn động cơ: *bức xúc quá không nhịn được* (`nongTinh`) hoặc *coi người kia là người nhà nên nói* (`thanThien`). Không có nguồn thứ ba. Giữ `noiThang` riêng tạo ra tổ hợp vô nghĩa: "điềm đạm + khép kín + nói thẳng" là ai? |
| **`kienNhan`** (chờ được ↔ vội) | **Chuyển thành fact `npcPatience`** — biến **theo phiên**, không phải tính cách | Kiên nhẫn của một người **đổi theo ngày**: anh Dũng vội vì đang chạy đơn, chị Lan vội vì 7h50 phải vô công ty. Đó là **lịch sinh hoạt + mood**, không phải bản chất. Để nó thành tính cách là nói dối về con người |

**Hệ quả kiểm chứng được:** với 4 chiều, một người chơi bình thường sau **3 ngày chơi** phải phân biệt được ít nhất 3 kiểu người (người soi, người nóng, người im). Với 6 chiều, playtest nội bộ của bản prototype cho thấy họ chỉ phân biệt được "khách dễ" và "khách khó". Đây là tiêu chí đạt T-1 ở mục 6.

---

### 2.3. Quy tắc suy ra hành vi từ 4 chiều

CANON §4 cho hai luật gốc:

```
nói thẳng ra miệng  ≈  nongTinh cao  HOẶC  thanThien cao
im lặng rồi biến mất ≈ soi cao  VÀ  nongTinh thấp  VÀ  thanThien thấp
```

Cài đặt: hai luật này **không phải code**. Chúng là **criterion trong rule DB** (P2-01), nên writer đọc được và sửa được.

```yaml
# Điều kiện "nói ra" — dùng lại trong rất nhiều rule
# (build step expand macro này thành criteria thật)
_macro_noi_ra:   { any: [ npcNongTinh: ">=55", npcThanThien: ">=55" ] }
_macro_im_lang:  { npcSoi: ">=70", npcNongTinh: "<=30", npcThanThien: "<=40" }
```

#### Bảng đầy đủ 16 tổ hợp (mỗi chiều nhị phân hoá tại ngưỡng 0.5)

Ký hiệu: `S` = soi cao · `N` = nóng tính cao · `D` = dễ tha cao · `T` = thân thiện cao. Dấu `−` = thấp.

| # | S | N | D | T | Kiểu người | Hành vi khi bạn làm sai | Ai trong 12 NPC |
|---|---|---|---|---|---|---|---|
| 1 | + | + | + | + | **Người dì trong hẻm** | Nói ngay, nói to, mai vẫn ghé | **Bà Bảy** (0.9/0.6/0.8/0.7) |
| 2 | + | + | + | − | Người khó tính ồn ào | La lên, rồi quên, nhưng không thân lên được | — |
| 3 | + | + | − | + | Người nhà nghiêm khắc | Nói thẳng, để bụng, nhưng vẫn coi bạn là người nhà | — |
| 4 | + | + | − | − | **Đối thủ** | Nói xóc, nhớ dai, không lan tin (không ai nghe ổng) | **Chú Kiệt** (0.7/0.6/0.3/0.4) |
| 5 | + | − | + | + | Người thầy hiền | Nhắc nhẹ một câu, bỏ qua, dạy lại lần sau | **Cô Mai** (0.6/0.4/0.6/0.8) |
| 6 | + | − | + | − | Người quan sát | Thấy hết, nói rất ít, không giữ lâu | **Thầy Phúc** (0.8/0.2/0.7/0.5) — sát biên `T` |
| 7 | + | − | − | + | Người thân thất vọng | Không la, nhưng buồn thấy rõ, và **nhớ** | — |
| 8 | **+** | **−** | **−** | **−** | **NGƯỜI IM LẶNG BIẾN MẤT** | **Không nói một câu. Trả tiền. Đi. Không quay lại.** | **Chị Lan** (0.9/0.1/0.2/0.3) |
| 9 | − | + | + | + | Người ồn ào dễ thương | Kêu trời một tiếng rồi cười | **Ông Hải sau 10h** (0.5/0.9/0.5/0.6) |
| 10 | − | + | + | − | Người cáu vặt | Càu nhàu, quên ngay | **Anh Dũng** (0.2/0.5/0.7/0.5) — sát biên `N` |
| 11 | − | + | − | + | Người giận dỗi | Trách móc, giận lâu, nhưng vẫn nói chuyện | — |
| 12 | − | + | − | − | Người bùng nổ rồi mất | Nổ một lần rồi biến | Khách vãng lai vô danh |
| 13 | − | − | + | + | **Bộ khuếch đại** | Không giận, nhưng **kể cho cả hẻm** — vô tư | **Bé Su** (0.4/0.4/0.9/1.0), **Bà Sáu** (0.4/0.3/0.8/0.9) |
| 14 | − | − | + | − | Người xuề xoà | Nhún vai, đi | **Anh Bảo** (0.3/0.2/0.8/0.4) |
| 15 | − | − | − | + | Người hiền nhớ dai | Không nói, nhưng lần sau gọi món khác | **Chị Hạnh** (0.5/0.3/0.6/0.4) — sát biên |
| 16 | − | − | − | − | Người trung tính | Gần như không phản ứng | **Chú Tư** (0.3/0.3/0.9/0.6) — thực ra ô 13 |

**Ba quan sát rút ra từ bảng:**

1. **Ô số 8 là ô nguy hiểm nhất, và ta chỉ đặt MỘT người vào đó.** Chị Lan. Nếu có ba người im lặng biến mất, người chơi không học được gì — họ chỉ thấy khách cứ rụng dần. Một người thì họ học được **một luật**, và luật đó ám họ cả mùa.
2. **Ô 13 có hai người** (bé Su, bà Sáu) — cố ý. Hệ đồn thổi cần ít nhất hai nút, nếu không thì tắt một người là tắt cả hệ.
3. **Sáu ô trống.** Đó là ngân sách cho v2 / full release, không phải thiếu sót. Mỗi ô trống lấp thêm = một NPC mới, mà CANON §9 chốt 12 người.

#### Cài `im lặng biến mất` — phải cài ở **hệ quả trễ**, không ở kênh lời

```ts
// sim/memory.ts
function onCustomerLeave(npc: Npc, sess: Session) {
  const silentGrudge =
    npc.p.soi >= 0.7 && npc.p.nongTinh <= 0.3 && npc.p.thanThien <= 0.4;

  if (silentGrudge && sess.confirmedNegatives.length > 0) {
    // KHÔNG phát bark. KHÔNG đổi nét mặt quá mức. Chỉ ghi.
    memory.record(npc, sess.worstNegative(), { silent: true });
    schedule.setAbsence(npc, absenceDaysFor(npc, sess.worstNegative()));
  }
}
```

Chi tiết số cụ thể của chị Lan ở **§4.6**.

---

## 3. Năm kênh phản ứng — chạy SONG SONG

idea.md §9.4 định nghĩa năm kênh. Từ "song song" là bắt buộc: một sự kiện **CONFIRMED** phải chạm ít nhất **ba** kênh cùng lúc. Một kênh một mình thì người chơi không tin.

| # | Kênh | Chi phí làm | Sức nặng | Độ trễ | Tắt được? (CANON §15) |
|---|---|---|---|---|---|
| 1 | **Nét mặt** | **Rẻ nhất** — 18 file sprite, xong một lần | **Cao** — mắt người bắt mặt trước tiên | 0,2–0,4s | Không (là kênh cốt lõi của T3) |
| 2 | **Ngôn ngữ cơ thể** | Rẻ — **chỉ là tween**, 0 sprite mới | **Rất cao**, và **ít game 2D làm** | 0,2–0,6s | Có, qua "giảm chuyển động" → thay bằng pose tĩnh |
| 3 | **Bark (câu thoại nổi)** | Trung bình — tốn ngân sách 520 dòng | Cao, **nhưng lặp lại là chết** | 0,4–1,2s | Có, qua "tắt âm báo tiêu cực" (chỉ âm, chữ vẫn hiện) |
| 4 | **Hành động** | Trung bình — cần state machine khách | **Cao nhất trong các kênh tức thì** | 1–8s | Không |
| 5 | **Hệ quả trễ** | Cần hệ memory + schedule | **Cao nhất tuyệt đối** — đây là thứ tạo cảm giác "thật" | 1–7 **ngày** | Một phần: "khách biến mất không chia tay" có thể bật "họ để lại lời nhắn" |

**Luật phối kênh bắt buộc:**

| `obsState` | Kênh bắt buộc | Kênh tuỳ chọn |
|---|---|---|
| `GLIMPSED` (0.35–0.70) | 1 (nét mặt nhẹ) + 2 (quay đầu) + dấu `?` | — |
| `NOTICED` (0.70–1.0) | 1 + 2 | 3 (bark tier-1, **65%** — vì luật 35% im lặng) |
| `CONFIRMED` (≥ 1.0) | 1 + 2 + 5 (ghi memory) | 3 (bark), 4 (hành động) tuỳ tính cách và mức nặng |

> **Luật 35% im lặng (CANON §11) không được đụng tới kênh 1, 2, 5.** Nó chỉ tắt kênh 3. Im lặng nghĩa là **không nói**, không phải **không phản ứng**. Nếu tắt cả nét mặt thì người chơi mất tín hiệu và cơ chế thành xổ số — đúng thứ CANON §5.4 cấm.

---

### 3.1. Kênh 1 — Nét mặt: 216 trạng thái từ 18 file

CANON §16 **Đừng-4**: không frame-by-frame animation (Cuphead: >25 phút cho MỘT frame). Thay bằng **layered sprite**.

**18 file, ba lớp, ghép tự do:**

| Lớp | 6 sprite | Ý nghĩa |
|---|---|---|
| **Lông mày** `B0..B5` | `B0` thường · `B1` nhíu nhẹ · `B2` nhíu sâu · `B3` nhướn cao · `B4` lệch một bên · `B5` xuôi ngoài | `B2` = giận · `B3` = bất ngờ · `B4` = nghi · `B5` = thương/buồn |
| **Mắt** `E0..E5` | `E0` thường · `E1` nheo · `E2` mở to · `E3` liếc ngang · `E4` chớp dài/nhắm · `E5` cong cười | `E1` = **soi** · `E3` = né · `E4` = chịu đựng |
| **Miệng** `M0..M5` | `M0` thường · `M1` mím chặt · `M2` cười nhẹ · `M3` cười tươi · `M4` méo/ghê · `M5` há | `M1` = nuốt vào · `M4` = ghê tởm · `M5` = đang nói/sốc |

6 × 6 × 6 = **216 trạng thái**. Mỗi lớp là một `Phaser.GameObjects.Image` trong một `Container`, đổi `setTexture()` — **0 chi phí animation**.

```ts
// ui/stall/face.ts
const FACE_SWAP_MS = 90;   // Celeste: biến dạng chỉ tồn tại 1-2 frame
export function setFace(npc: NpcView, b: number, e: number, m: number) {
  npc.brow.setTexture(`brow_${npc.skin}_${b}`);
  npc.eye .setTexture(`eye_${npc.skin}_${e}`);
  npc.mouth.setTexture(`mouth_${npc.skin}_${m}`);
  // Celeste: đẩy lệch MỘT hàng pixel trong 2 frame rồi trả về — "cái giật" của cảm xúc
  npc.head.y -= 1; scene.time.delayedCall(FACE_SWAP_MS, () => { npc.head.y += 1; });
}
```

#### Bảng ánh xạ (sự kiện × tính cách trội × cường độ) → tổ hợp sprite

Cường độ: `I1` (GLIMPSED) · `I2` (NOTICED) · `I3` (CONFIRMED). "Tính cách trội" = chiều cao nhất của NPC sau khi trừ trung bình.

| Nhóm sự kiện | Tính cách trội | I1 | I2 | I3 |
|---|---|---|---|---|
| **Vệ sinh** (`DROPPED_FOOD`, `DIRTY_HANDS`, quầy bẩn) | `soi` cao | `B1 E1 M0` | `B2 E1 M1` | `B2 E2 M4` |
| | `nongTinh` cao | `B3 E2 M0` | `B2 E2 M5` | `B2 E2 M5` + rung đầu |
| | `deTha` cao | `B3 E2 M0` | `B1 E0 M2` | `B1 E0 M4` rồi về `M2` sau 1,5s |
| | `thanThien` cao | `B3 E2 M5` | `B5 E0 M5` | `B5 E2 M4` |
| **Chờ lâu** (`MADE_THEM_WAIT`) | `soi` cao | `B0 E3 M1` | `B1 E3 M1` | `B2 E4 M1` |
| | `nongTinh` cao | `B1 E3 M0` | `B2 E0 M5` | `B2 E2 M5` |
| | `deTha` cao | `B0 E3 M0` | `B0 E4 M0` | `B0 E4 M2` |
| | `thanThien` cao | `B0 E0 M2` | `B5 E3 M1` | `B5 E4 M1` |
| **Sai món** (`ORDER_DEFECT`, `BURNT_OR_COLD`) | `soi` cao | `B4 E1 M0` | `B4 E1 M1` | `B2 E1 M4` |
| | `nongTinh` cao | `B3 E2 M0` | `B2 E2 M5` | `B2 E2 M5` |
| | `deTha` cao | `B3 E0 M0` | `B4 E0 M2` | `B1 E0 M2` |
| | `thanThien` cao | `B3 E2 M5` | `B5 E0 M5` | `B5 E4 M1` |
| **Sai tên** (`WRONG_NAME`) — **luôn ≥ I2**, bỏ qua gaze | `soi` cao | — | `B3 E2 M1` | `B5 E4 M1` |
| | `nongTinh` cao | — | `B3 E2 M5` | `B2 E2 M5` |
| | `deTha` cao | — | `B3 E2 M2` | `B1 E0 M2` |
| | `thanThien` cao | — | `B5 E2 M5` | `B5 E4 M1` ← **đây là khuôn mặt đau nhất của cả game** |
| **Tích cực nhẹ** (`FLOURISH`, `FREE_EXTRA`) | bất kỳ | `B0 E0 M2` | `B3 E5 M2` | `B3 E5 M3` |
| **Tích cực nặng** (`REMEMBERED_USUAL`, `REMEMBERED_STORY`) | `soi` cao | `B3 E2 M2` | `B3 E5 M3` | `B5 E5 M3` |
| | `thanThien` cao | `B3 E5 M2` | `B3 E5 M3` | `B5 E5 M3` + đầu nghiêng |
| | `deTha` cao | `B0 E5 M2` | `B3 E5 M3` | `B3 E5 M3` |
| | `nongTinh` cao | `B3 E2 M3` | `B3 E2 M3` | `B3 E2 M3` + vỗ quầy |
| **Được chăm sóc** (`CARED_FOR_THEM`) | bất kỳ | `B3 E2 M2` | `B5 E5 M2` | `B5 E5 M3` |
| **Mood xấu ngoài tầm kiểm soát** (§5) | bất kỳ | `B1 E3 M1` **từ xa, trước khi tới quầy** | giữ nguyên | giữ nguyên |

**Ba quy ước hiển thị bắt buộc:**

1. **`M1` (mím chặt) là chữ ký của chị Lan.** Cô gần như chỉ dùng `M1`. Khi người chơi thấy `M1` trên mặt bất kỳ ai, họ phải rùng mình — vì họ đã học nó từ chị Lan.
2. **Mặt trở về trạng thái nền sau `3,0s + deTha × 4,0s`.** Bà Bảy (`deTha 0.8`) hết cau sau 6,2s. Chị Lan (`deTha 0.2`) giữ `M1` suốt 3,8s và **vẫn `M1` khi trả tiền**.
3. **Mặt KHÔNG BAO GIỜ đổi ngay lập tức.** Delay 0,2–0,4s ngẫu nhiên (§6.4) — chống twinning.

---

### 3.2. Kênh 2 — Ngôn ngữ cơ thể: kỹ thuật Rain World, **0 sprite mới**

CANON §16 Đừng-4: *"kỹ thuật Rain World (vài node đầu/thân/tay + spring/lerp → lean, tilt, nhún vai, **không tốn thêm sprite**)."*

**Cấu trúc:** mỗi NPC có **4 node** — `head`, `torso`, `armL`, `armR`. Mỗi node có vị trí mục tiêu; vị trí thật chạy theo bằng **spring damper**. Sprite thân **không đổi**; chỉ toạ độ và góc đổi.

```ts
// ui/stall/body.ts
interface Node { x: number; y: number; rot: number;
                 tx: number; ty: number; trot: number;   // target
                 vx: number; vy: number; vrot: number; }  // velocity

const K = 120;      // độ cứng lò xo
const DAMP = 14;    // giảm chấn — cao thì "chắc", thấp thì "nhão"

function springStep(n: Node, dt: number, k = K, d = DAMP) {
  n.vx   += (-k * (n.x   - n.tx)   - d * n.vx)   * dt;
  n.vy   += (-k * (n.y   - n.ty)   - d * n.vy)   * dt;
  n.vrot += (-k * (n.rot - n.trot) - d * n.vrot) * dt;
  n.x += n.vx * dt; n.y += n.vy * dt; n.rot += n.vrot * dt;
}

/** Một "pose" chỉ là một bộ target. Không có animation clip nào. */
function applyPose(v: NpcView, pose: Pose, intensityMul: number) {
  const s = intensityMul;                       // nongTinh phóng đại biên độ
  v.head .setTarget(pose.head.x * s,  pose.head.y * s,  pose.head.rot * s);
  v.torso.setTarget(pose.torso.x * s, pose.torso.y * s, pose.torso.rot * s);
  v.armL .setTarget(pose.armL.x * s,  pose.armL.y * s,  pose.armL.rot * s);
  v.armR .setTarget(pose.armR.x * s,  pose.armR.y * s,  pose.armR.rot * s);
}
```

#### Bảng đầy đủ các pose và ý nghĩa

| Pose | `head` | `torso` | `arms` | Đọc ra là gì | Dùng khi |
|---|---|---|---|---|---|
| `IDLE` | 0, 0, 0° | 0, 0, 0° | buông | Bình thường | Nền |
| `LEAN_IN` | +4px trước | +3px trước, +2° | hơi nâng | **Quan tâm / nhìn kỹ** | `GLIMPSED` của người `soi` cao; smalltalk hào hứng |
| `LEAN_BACK` | −3px | −4px, −3° | khép | **Giữ khoảng cách** | Ghê, nghi, mood xấu |
| `STEP_BACK_HALF` | −2px | **−10px, cả thân** | khép | **Lùi nửa bước** — nặng nhất trong các pose im lặng | `DROPPED_FOOD` `CONFIRMED` |
| `TILT_HEAD` | rot **+8°** | 0 | 0 | **Nghi ngờ / chưa hiểu** | `GLIMPSED`, `ORDER_DEFECT` lúc mới thấy |
| `PEEK_OVER` | +5px trước, +3px lên, +5° | +2px | một tay chống quầy | **Nghiêng người xem** bạn làm | Người `soi` cao lúc bạn thao tác |
| `NOD` | y dao động ±3px, 2 nhịp | 0 | 0 | **Đồng ý / nghe rồi** | Trả lời, nhận bánh |
| `SHAKE_SLOW` | rot ±4°, 2 nhịp chậm | 0 | 0 | **Không tin nổi** | `CONFIRMED` tiêu cực, người điềm đạm |
| `SHRUG` | +2px lên | +3px lên | **cả hai tay nâng 6px, rot ±12°** | **Nhún vai — "kệ"** | `deTha` cao, sự kiện nhẹ |
| `ARMS_CROSS` | 0 | +1° | **hai tay chéo trước ngực** | **Phán xét / chờ đợi có ý** | `MADE_THEM_WAIT` tier 2; bà Bảy lần thứ hai |
| `TURN_AWAY_QUARTER` | rot −15° | rot −8° | buông | **Quay đi một phần** — chuẩn bị đi | Trước khi bỏ đi |
| `SHIFT_WEIGHT` | 0 | x dao động ±3px chu kỳ 1,8s | 0 | **Sốt ruột** | `waitTier = LAU` |
| `CHECK_TIME` | rot +20° cúi, 0,8s | 0 | **armL nâng lên tầm mắt** | **Nhìn đồng hồ** | `waitTier = QUA_LAU` |
| `PHONE_DOWN` | rot +25° cúi | +2px | **armR giơ ngang ngực** | **Đang bấm điện thoại** — `gazeFactor` thấp | Anh Bảo; cửa sổ 2–3s của CANON §5.4 |
| `PHONE_UP` | rot về 0 trong 0,25s | 0 | armR hạ | **Vừa ngẩng lên** — khoảnh khắc chết người | Kết thúc cửa sổ |
| `SETTLE_IN` | 0 | −2px, ngồi xuống ghế nhựa | buông thõng | **Ở lại lâu** | Mưa (idea.md §9.2-D21) |
| `FREEZE` | **tất cả target = vị trí hiện tại, `d` = 40** | | | **Đứng sững** — không cử động gì cả | **Chị Lan lúc `CONFIRMED`.** Xem §4.6 |
| `HAND_OUT` | 0 | +2px trước | armR duỗi ra | Đưa tiền / nhận bánh | `PAY`, `DELIVERY` |
| `WAVE_SMALL` | +2px | 0 | armR vẫy nhỏ 2 nhịp | Chào | `GREET`, `FAREWELL` |

**Ba luật dùng pose:**

1. **Không bao giờ hai pose cùng lúc trên cùng node.** Pose mới ghi đè target; spring lo phần chuyển tiếp. Đây là lý do không cần blend tree.
2. **`intensityMul` (từ `nongTinh`) nhân vào biên độ, không nhân vào tốc độ.** Ông Hải nhún vai **to hơn**; thầy Phúc nhún vai **nhỏ đến mức gần như không thấy** — và đó chính là điều đáng nói về thầy.
3. **Chế độ "giảm chuyển động" (CANON §15.3):** spring bị thay bằng `lerp` 1 bước (pose nhảy thẳng tới target, không dao động). Người chơi vẫn đọc được pose, chỉ mất cái nhún.

---

### 3.3. Kênh 3 — Bark

Toàn bộ cơ chế nằm ở `P2-01` §2.9 (bark 3 tầng, cooldown, nghịch lý lặp, 35% im lặng). Doc này chỉ thêm **ba ràng buộc trình bày**:

| Ràng buộc | Chi tiết |
|---|---|
| **Âm lượng theo `nongTinh`** | `barkVolume = 0.4 + 0.6 × nongTinh`. Ông Hải 0,94; chị Lan 0,46. Bark ≥ 0,85 làm `witnessCount` **+2** (người xung quanh quay lại nhìn) → kéo theo hệ đồn thổi |
| **Không bao giờ hai bark chồng nhau** | Hàng đợi 1 chỗ. Bark mới mà chỗ đang bận → **bỏ**, không xếp hàng. Xếp hàng sinh ra hiệu ứng "cả hẻm cùng lải nhải" |
| **Bark tiêu cực tắt được** (CANON §15.4) | Tắt **âm**, giữ **chữ**. Không được tắt chữ — đó là thông tin gameplay, không phải hiệu ứng |

---

### 3.4. Kênh 4 — Hành động

Hành động là kênh **nặng nhất trong các kênh tức thì**, vì nó **tốn của người chơi thứ gì đó ngay lập tức**.

| Hành động | Điều kiện điển hình | Chi phí cho người chơi | Ai hay làm |
|---|---|---|---|
| **Đòi làm lại** | `ORDER_DEFECT` `CONFIRMED` + `soi ≥ 0.6` + (`nongTinh ≥ 0.5` hoặc `thanThien ≥ 0.6`) | 1 ổ bánh + ~25s → hàng chờ dài ra → khách sau cau có | Bà Bảy, ông Hải, thầy Phúc |
| **Bỏ đi (chưa trả tiền)** | `waitTier = QUA_LAU` + `npcPatience = 0` | Mất doanh thu + `npcDaysSinceVisit` bắt đầu đếm | Anh Dũng, chị Lan |
| **Trả tiền rồi bỏ món** | `soi ≥ 0.7` + `nongTinh ≤ 0.3` + sự kiện vệ sinh `CONFIRMED` | **Không mất tiền — mất người.** Người chơi thấy họ ra tới góc đường bỏ vô thùng rác | **Chị Lan** (chữ ký) |
| **Thêm tip** | `FLOURISH`/`REMEMBERED_USUAL` + `npcRelTier ≥ ACQUAINTANCE` + không `isMonthEnd` | — (thưởng) | Cô Mai, chú Tư, bà Sáu |
| **Gọi thêm** | `CARED_FOR_THEM` hoặc mood tốt + `queueLength ≤ 2` | Thời gian, nhưng doanh thu tăng | Ông Hải (trước 10h), bé Su |
| **Dắt người khác tới** | `npcRelTier = FRIEND` + `REMEMBERED_USUAL` ≥ 3 lần | — (thưởng lớn: `npcCompanionId` xuất hiện) | Bé Su, bà Sáu, cô Mai |
| **Ngồi lại ghế nhựa** | `weather = MUA_LON` | Chiếm chỗ, nhưng tăng cơ hội nghe lỏm (CANON §12.4) | Ai cũng |
| **Ghi sổ nợ** | `playerMoneyLow` hoặc `isMonthEnd` | Rủi ro nhớ nhầm (CANON §14) | Cô Mai, chú Tư |
| **Không nhận thối** | `FREE_EXTRA` lặp nhiều lần → phản tác dụng (CANON §8i) | — | Chị Hạnh, thầy Phúc |

Chi tiết `hành động` là state machine trong `sim/schedule.ts`, ngoài phạm vi doc này; ở đây chỉ chốt **danh mục và điều kiện**.

---

### 3.5. Kênh 5 — Hệ quả trễ

Kênh mạnh nhất, và **kênh duy nhất người chơi không thể sửa ngay**.

| Hệ quả | Cơ chế | Độ trễ | Người chơi đọc ra bằng gì |
|---|---|---|---|
| **Mai không tới** | `schedule.setAbsence(npc, n)` | 1 ngày | Chỗ trống lúc 6h45 của chú Tư |
| **Vắng n ngày** | Như trên, `n = 1..7` | 1–7 ngày | Sổ tay cuối ngày (CANON §15) |
| **Kể cho người khác** | `pGossip`, cap 2–3 hop, `confidence ×0.7–0.85` | Cùng ngày → 2 ngày | **Nghe lỏm ở góc hẻm** — bắt buộc (CANON §12.4) |
| **Đổi món gọi** | `npcUsualRecipe` bị hạ cấp về món an toàn hơn | 1–3 ngày | Họ gọi "bánh mì không" thay vì "đầy đủ" |
| **Không kể chuyện nữa** | `npcStoryFlag` ngừng cập nhật | 2–5 ngày | Không còn gì để `REMEMBERED_STORY` bắt vào |
| **Hạ trần tin tưởng vĩnh viễn** | CANON §8d: grudge decay được nhưng trần bị hạ | Vĩnh viễn | Không bao giờ lên lại `Friend` |
| **Biến mất hẳn** | `schedule.remove(npc)` | 3–5 ngày, **có báo trước** | §4.6 |

---

## 4. Bảng phản ứng đầy đủ: 11 sự kiện × 12 NPC

> **Cách đọc.** Mỗi bảng là **một sự kiện**, 12 hàng là 12 NPC. Cột **Tức thì** ghi kênh nào chạy (1=mặt, 2=dáng, 3=bark, 4=hành động). Cột **Trễ** là kênh 5. Cột **Lan tin** là `pGossip` hiệu dụng cho sự kiện đó.
> Thoại mẫu **tiếng Việt giọng miền Nam**, đại từ xưng hô giữ nguyên (CANON §2, §14).

---

### 4.1. `WRONG_NAME` — gọi sai tên / quên tên khách quen (salience 100, **bỏ qua `gazeFactor`**)

FLAGSHIP của game. Là âm thanh, nhắm thẳng vào khách → **luôn bị nghe thấy**, mọi NPC luôn ít nhất `NOTICED`.

| NPC | Tức thì | Thoại mẫu | Trễ | Lan tin |
|---|---|---|---|---|
| **Bà Bảy** | 1 `B3 E2 M2` → `B1 E0 M2` · 2 `TILT_HEAD` · 3 | ▸ *"Bảy. Cô là Bảy con ơi. Sáu là bà bán tàu hũ."* — cười, nhưng mắt không cười | Nhắc lại ngày mai một lần | 0,40 |
| **Chú Tư** | 1 `B3 E2 M2` · 2 `SHRUG` · 3 (odds 50) | ▸ *"Ừ… ờ. Không sao con."* — rồi im, và đó là câu buồn nhất ổng nói | Không. `deTha 0.9` | 0,10 |
| **Anh Dũng** | 1 `B0 E3 M0` · 2 `SHIFT_WEIGHT` | — (bận, không để ý) | Không | 0,12 |
| **Chị Lan** | 1 `B3 E2 M1` **giữ 3,8s** · 2 `FREEZE` | — **không một chữ** | **Nặng.** Ghi memory `intensity 85`, vắng 3 ngày | 0,55 ← **kể cho người khác dù không nói với bạn** |
| **Bé Su** | 1 `B3 E5 M3` · 2 `LEAN_IN` · 3 | ▸ *"Ủa cô ơi con là Su mà! S-U Su á! Cô nhớ nha, mai con kiểm tra!"* | Không giận, nhưng **kể** | **0,70** |
| **Ông Hải** | 1 `B3 E2 M5` · 2 `LEAN_BACK` · 3 (to) | ▸ *"Hải! Hải chứ Hưng nào! Bây kêu tao Hưng là tao giận đó nghen!"* — cười lớn, nhưng có thật một chút giận | Quên sau 1 ngày | 0,48 |
| **Cô Mai** | 1 `B4 E1 M2` · 2 `TILT_HEAD` · 3 | ▸ *"Mai. Mai tạp hoá đối diện nè con. Bán buôn mà không nhớ tên khách là mất khách đó."* | Dạy lại, không giận | 0,45 |
| **Thầy Phúc** | 1 `B5 E4 M1` · 2 `NOD` (chậm) · 3 (odds 40) | ▸ *"Không sao. Tên con người ta khó nhớ lắm."* — ông nói thật, và nó **đau hơn** là ông giận | Nhớ 6 ngày, không nhắc | 0,25 |
| **Chị Hạnh** | 1 `B3 E3 M1` · 2 `TURN_AWAY_QUARTER` | ▸ *"Dạ… Hạnh ạ."* — giọng Bắc, nhỏ lại | **Đổi món về "bánh mì không"** 2 ngày | 0,30 |
| **Anh Bảo** | 1 `B3 E2 M0` · 2 `PHONE_UP` | ▸ *"Dạ? À… dạ con là Bảo."* | Không | 0,15 |
| **Bà Sáu** | 1 `B3 E5 M2` · 2 `SHRUG` · 3 | ▸ *"Sáu chứ Bảy gì bây! Hai bà già bán hàng rong, lộn hoài à."* — cười, rồi **kể ngay cho bà Bảy** | Không giận | **0,65** |
| **Chú Kiệt** | 1 `B4 E1 M2` · 2 `ARMS_CROSS` · 3 | ▸ *"Kiệt. K-I-Ệ-T. Mà thôi, mậy nhớ tên khách còn không nổi thì lo gì tao."* | Nhớ **rất lâu** (`deTha 0.3`) | 0,20 |

---

### 4.2. `MADE_THEM_WAIT` — bắt chờ quá lâu / sai thứ tự (salience 100, không cần gaze, **leo thang theo giây**)

| NPC | Tức thì | Thoại mẫu | Trễ | Lan tin |
|---|---|---|---|---|
| **Bà Bảy** | 1 I1→I3 · 2 `SETTLE_IN` (bà ngồi xuống ghế) | ▸ *"Từ từ con, cô ngồi đây cô chờ. Cô có đi đâu đâu."* — bà thật sự không gấp | Không | 0,20 |
| **Chú Tư** | 1 `B0 E3 M0` · 2 `CHECK_TIME` (6h52) | ▸ *"Con… chú vô ca 7 giờ."* — nói một lần, không nói lần hai | Nếu trễ 2 ngày liên tiếp → **đổi giờ tới sớm hơn 10 phút** | 0,15 |
| **Anh Dũng** | 1 I2 nhanh · 2 `SHIFT_WEIGHT` → `CHECK_TIME` · 3 · 4 **bỏ đi** ở 95s | ▸ *"Ê em ơi lẹ giùm anh cái, anh có đơn nè."* → ▸ *"Thôi khỏi, anh đi. Bữa khác."* | Mai vẫn tới (`deTha 0.7`) nhưng **gọi món nhanh nhất** | 0,35 |
| **Chị Lan** | 1 `B1 E3 M1` · 2 `CHECK_TIME` **một lần duy nhất** · 4 **bỏ đi** ở 110s, không nói | — | **Vắng 2 ngày.** Lần sau tới sớm hơn 15 phút để không phải chờ | 0,45 |
| **Bé Su** | 1 `B0 E5 M2` · 2 `PHONE_DOWN` | ▸ *"Không sao cô, con quay cái xe cô cái đã."* | Không | 0,30 |
| **Ông Hải** | 1 I3 nhanh · 2 `LEAN_IN` · 3 **to** (`witnessCount +2`) | ▸ *"Trời ơi nãy giờ hai chục phút rồi đó bây! Người ta đói muốn xỉu!"* (sau 10h) · trước 10h: ▸ *"Chú chờ được con, làm cho kỹ."* | Quên sau nửa ngày | 0,50 |
| **Cô Mai** | 1 `B1 E1 M2` · 2 `PEEK_OVER` | ▸ *"Đông quá hen. Để cô chạy về coi tiệm cái, chút cô qua lấy."* — **cô tự giải quyết** | Không. Nhưng ghi nhận "giờ này đông" | 0,25 |
| **Thầy Phúc** | 1 `B0 E4 M1` · 2 `IDLE` (không nhúc nhích) | ▸ *"Con cứ làm đi. Thầy về hưu rồi, thầy nhiều thời gian lắm."* | Không | 0,15 |
| **Chị Hạnh** | 1 `B1 E3 M1` · 2 `SHIFT_WEIGHT` | ▸ *"Em ơi… em còn lâu không em?"* — giọng Bắc | Nhớ 3 ngày | 0,25 |
| **Anh Bảo** | 1 — · 2 `PHONE_DOWN` | — (**không nhận ra mình đang chờ**) | Không | 0,05 |
| **Bà Sáu** | 1 `B0 E5 M2` · 2 `SETTLE_IN` | ▸ *"Kệ bây, tui ngồi đây tui nghỉ cái chân."* | Không | 0,35 |
| **Chú Kiệt** | 1 `B4 E1 M2` · 2 `ARMS_CROSS` · 3 | ▸ *"Một lò mà ôm chi lắm khách vậy mậy. Bên tao hai lò."* | Nhớ, và **dùng làm nguyên liệu nói xóc** | 0,20 |

---

### 4.3. `BURNT_OR_COLD` — bánh cháy hoặc nguội không nướng lại (salience 80, **có mùi → bán kính rộng hơn**)

| NPC | Tức thì | Thoại mẫu | Trễ | Lan tin |
|---|---|---|---|---|
| **Bà Bảy** | 1 `B2 E1 M4` · 2 `LEAN_IN` · 3 · 4 **đòi làm lại** | ▸ *"Khét rồi con ơi! Con ngửi thử coi. Thôi làm ổ khác, cô chờ."* | Không | 0,35 |
| **Chú Tư** | 1 `B1 E0 M2` · 2 `SHRUG` | ▸ *"Ờ hơi cháy chút. Không sao, chú ăn được."* — **và ổng ăn thật** | Không | 0,10 |
| **Anh Dũng** | 1 `B1 E0 M0` · 2 — | ▸ *"Nguội rồi nè em."* — cầm đi luôn | `trust` ngầm xuống | 0,20 |
| **Chị Lan** | 1 `B1 E1 M1` · 2 `LEAN_BACK` · 4 **trả tiền, nhận, không ăn** | — | Vắng 2 ngày | 0,40 |
| **Bé Su** | 1 `B3 E2 M3` · 3 | ▸ *"Ui cháy đen thui luôn! Cô ơi cho con quay cái này!"* — **và bé quay thật** | Không giận, nhưng **video lan** | **0,70** |
| **Ông Hải** | 1 I3 · 3 to · 4 đòi làm lại | ▸ *"Cháy như than vầy mà bây dám đưa hả? Làm lại!"* | Quên nhanh | 0,50 |
| **Cô Mai** | 1 `B4 E1 M1` · 2 `TILT_HEAD` · 3 | ▸ *"Lò con nóng quá rồi đó. Hạ lửa xuống, không thì ngày nào cũng cháy."* — **dạy nghề** | Không | 0,30 |
| **Thầy Phúc** | 1 `B4 E1 M1` · 3 | ▸ *"Bánh nguội thì ruột nó dai, con nướng lại ba chục giây là được."* | Không | 0,20 |
| **Chị Hạnh** | 1 `B1 E3 M1` | ▸ *"Ơ… bánh này hơi cháy em nhỉ?"* | Nhớ 3 ngày | 0,25 |
| **Anh Bảo** | 1 — | — (ăn luôn) | Không | 0,05 |
| **Bà Sáu** | 1 `B1 E0 M2` · 3 | ▸ *"Cháy rồi bây. Để đó tui ăn cho, đừng bỏ uổng."* | Không | 0,30 |
| **Chú Kiệt** | 1 `B4 E1 M2` · 3 | ▸ *"Lò cũ nó vậy đó. Hồi xưa tao cũng cháy hoài, tới hồi đổi lò mới hết."* — **vừa xóc vừa chỉ đường** | Nhớ lâu | 0,20 |

---

### 4.4. `DROPPED_FOOD` — làm rớt xuống đất (salience 75, **có tiếng động**, bắt buộc bỏ — CANON §7)

Sự kiện dạy luật. `CONFIRMED` sau **~1,4s** nếu khách nhìn thẳng (CANON §5).

| NPC | Tức thì | Thoại mẫu | Trễ | Lan tin |
|---|---|---|---|---|
| **Bà Bảy** | 1 `B2 E2 M4` · 2 `LEAN_IN` · 3 tier-1 | ▸ *"Ủa con, cái bánh đó rớt xuống đất rồi mà?"* → (followup) ▸ *"Bỏ đi con, cô chờ được mà."* | **Mai vẫn ghé** (`deTha 0.8`) | 0,45 |
| **Chú Tư** | 1 `B3 E2 M0` · 2 `SHRUG` | ▸ *"Ui."* | Không | 0,12 |
| **Anh Dũng** | 1 `B3 E2 M0` · 2 `SHRUG` | — (ngó thấy, nhún vai) | `trust −1` **âm thầm** | 0,25 |
| **Chị Lan** | 1 `B2 E2 M1` **giữ** · 2 `STEP_BACK_HALF` rồi `FREEZE` · 4 **trả tiền, cầm bánh, ra góc đường bỏ thùng rác** | — **không một câu nào** | **BIẾN MẤT 5 NGÀY** — xem §4.6 | **0,55** |
| **Bé Su** | 1 `B3 E2 M3` · 2 `LEAN_IN` · 3 | ▸ *"Ê ghê quá cô ơiiii!"* — cười phá lên, **vẫn ăn** | Không giận | **0,70** |
| **Ông Hải** | 1 I3 · 2 `LEAN_IN` · 3 **rất to** (`witnessCount +2`) | ▸ *"Trời đất ơi bán buôn kiểu gì vậy?"* — **cả hàng chờ quay lại nhìn** | Quên sau 1 ngày | 0,55 |
| **Cô Mai** | 1 `B1 E1 M1` · 2 `TILT_HEAD` · 3 | ▸ *"Bỏ nghen con. Một ổ bánh rẻ hơn một cái tiếng đồn nhiều."* | Không | 0,35 |
| **Thầy Phúc** | 1 `B5 E4 M1` · 2 `NOD` chậm · 3 (odds 45) | ▸ *"Thầy thấy rồi. Con làm ổ khác đi."* — điềm đạm, và **không nhắc lại lần nào nữa** | Nhớ 5 ngày | 0,25 |
| **Chị Hạnh** | 1 `B2 E2 M4` · 2 `LEAN_BACK` | ▸ *"Ôi giời…"* — bật ra tiếng Bắc, rồi im | Nhớ 4 ngày, **đổi món** | 0,30 |
| **Anh Bảo** | 1 — · 2 `PHONE_DOWN` | — (**không thấy gì cả**) | Không | 0,05 |
| **Bà Sáu** | 1 `B3 E2 M2` · 3 | ▸ *"Rớt rồi bây ơi. Thôi bỏ, bán đồ ăn mà."* | Không | 0,40 |
| **Chú Kiệt** | 1 `B4 E1 M2` · 2 `PEEK_OVER` · 3 | ▸ *"Thấy chưa. Rớt là bỏ nghen mậy. Tao nói trước cho khỏi nói tao không nhắc."* — **và ổng thì không bỏ** (CANON §7.5) | Nhớ rất lâu | 0,25 |

---

### 4.5. `ORDER_DEFECT` — sai công thức (salience **20 tại quầy → 100 lúc ăn**, chạy qua delivery-diff CANON §6)

Đây là **họ** sự kiện. Cột **Tức thì** chia hai: `ANTICIPATED` (khách đã thấy bạn làm sai — `defectWasSeen = 1`) và `DISCOVERED` (mở ra mới biết).

| NPC | `ANTICIPATED` | `DISCOVERED` | Trễ | Lan tin |
|---|---|---|---|---|
| **Bà Bảy** | ▸ *"Cô thấy con quên bỏ ngò rồi đó."* | ▸ *"Ủa… thiếu ngò rồi con."* | Không | 0,40 |
| **Chú Tư** | ▸ *"Ờ, thôi khỏi cũng được."* | — (ăn luôn, không nói) | Không | 0,10 |
| **Anh Dũng** | — | ▸ *"Ê em, anh dặn không hành mà."* — nói lúc đã leo lên xe | Nhớ 2 ngày | 0,30 |
| **Chị Lan** | 1 `B4 E1 M1`, không nói | 1 `M1` giữ · 4 **bỏ món** | **Vắng 3 ngày.** Lần sau **tự nói lại yêu cầu** — dấu hiệu bạn đã mất điểm | 0,50 |
| **Bé Su** | ▸ *"Cô ơi con dặn nhiều ớt mà cô bỏ có một khoanh à!"* | ▸ *"Ơ ớt đâu rồiii"* — cười | Không | **0,70** |
| **Ông Hải** | ▸ *"Bây bỏ hành vô rồi kìa! Tao nói không hành mà!"* | ▸ *"Ủa cái gì đây? Hành hả? Tao dặn rồi mà!"* | Quên nhanh | 0,50 |
| **Cô Mai** | ▸ *"Con bỏ nhầm rồi kìa. Lấy ra còn kịp."* — **cho bạn cơ hội sửa** | ▸ *"Thôi được rồi, lần sau nhớ nghen."* | Không | 0,35 |
| **Thầy Phúc** | ▸ *"Thầy thấy con lấy nhầm hũ. Hũ bên trái là đồ chua, bên phải là dưa leo."* — **đây là NPC dạy người chơi đọc hệ thống** | ▸ *"Ừ, thiếu chút. Không sao con."* | Không | 0,20 |
| **Chị Hạnh** | ▸ *"Em ơi chị xin **rau mùi** chứ không phải hành ạ."* — **và đây là lỗi do khác từ vùng miền, không phải do bạn ẩu** | ▸ *"Ơ… cái này là hành à em?"* | Nhớ 3 ngày, và **lần sau nói "ngò" thay vì "rau mùi"** — arc hoà nhập | 0,30 |
| **Anh Bảo** | — | ▸ *"À… dạ không sao."* (ăn luôn) | Không | 0,05 |
| **Bà Sáu** | ▸ *"Bây bỏ thiếu kìa."* | ▸ *"Thôi kệ, ăn cũng được."* | Không | 0,45 |
| **Chú Kiệt** | ▸ *"Tỉ lệ pate mậy bỏ ít quá. Khách nó biết đó, đừng tưởng nó không biết."* | ▸ *"Nhạt. Mậy tiết kiệm pate hả?"* — **nguy hiểm: đây là mầm tin đồn "ăn bớt nguyên liệu"** (CANON §12, mutation 0.35) | Nhớ rất lâu | 0,25 |

---

### 4.6. `DIRTY_HANDS` — cầm tiền rồi bốc đồ ăn, gãi đầu, chạm mặt (salience 40 — **sự kiện dẫn đầu trailer**, CANON §7.6)

| NPC | Tức thì | Thoại mẫu | Trễ | Lan tin |
|---|---|---|---|---|
| **Bà Bảy** | 1 `B2 E1 M1` · 2 `PEEK_OVER` · 3 (odds 85) | ▸ *"Con ơi, cầm tiền rồi bốc đồ ăn kìa."* · ▸ *"Lau tay cái đi con, cô nhắc chừng thôi."* | Không | 0,35 |
| **Chú Tư** | 1 `B0 E0 M0` | — | Không | 0,08 |
| **Anh Dũng** | — | — | Không | 0,10 |
| **Chị Lan** | 1 `B1 E1 M1` · 2 `LEAN_BACK` | — | **Ghi memory.** Cộng dồn: lần thứ 3 trong 5 ngày → vắng | 0,45 |
| **Bé Su** | 1 `B3 E2 M4` · 3 | ▸ *"Cô ơi tay cô nè! Tiền dơ lắm á cô!"* | Không | 0,60 |
| **Ông Hải** | 1 `B1 E0 M0` · 3 (odds 40) | ▸ *"Rửa tay đi bây."* — nói nhẹ, hiếm khi | Quên | 0,35 |
| **Cô Mai** | 1 `B1 E1 M1` · 3 | ▸ *"Để cô kêu con nhỏ nhà cô đem qua cho con chai nước rửa tay. Bán hàng phải sạch."* | Không — **cô giúp** | 0,30 |
| **Thầy Phúc** | 1 `B4 E1 M1` · 2 `TILT_HEAD` | ▸ *"Tiền là thứ qua tay nhiều người nhất trên đời này con à."* | Nhớ 5 ngày | 0,20 |
| **Chị Hạnh** | 1 `B1 E3 M1` | — (im, nhưng thấy) | Nhớ 3 ngày | 0,25 |
| **Anh Bảo** | — | — | Không | 0,03 |
| **Bà Sáu** | 1 `B1 E0 M2` | ▸ *"Tui bán tàu hũ tui cũng vậy à. Mà thôi, lau cái đi bây."* | Không | 0,35 |
| **Chú Kiệt** | 1 `B4 E1 M2` · 3 | ▸ *"Ê, khách nó nhìn kìa."* — **ổng nhắc bạn, rồi chính ổng làm y vậy khi không ai nhìn** | Nhớ | 0,15 |

---

### 4.7. `REMEMBERED_USUAL` — làm đúng "như mọi bữa" mà khách không phải nói (salience 90 — **khoảnh khắc chữa lành lõi của game**)

| NPC | Tức thì | Thoại mẫu | Trễ | Lan tin |
|---|---|---|---|---|
| **Bà Bảy** | 1 `B5 E5 M3` · 2 `LEAN_IN` + `NOD` · 3 | ▸ *"Ủa, con nhớ cô không ăn ớt hả? … Con nhỏ này được."* | `relGain ×1.5`, mở khoá mạch cải lương | 0,54 |
| **Chú Tư** | 1 `B3 E5 M2` · 2 `NOD` · 3 · 4 **thêm tip** | ▸ *"Chú chưa nói gì hết mà. Con giỏi."* — và ổng **im rất lâu** sau đó | Tới sớm hơn 5 phút hôm sau để đứng nói chuyện | 0,48 |
| **Anh Dũng** | 1 `B3 E5 M2` · 4 thêm tip | ▸ *"Ê được đó em! Khỏi nói luôn hả? Anh khoái vụ này."* | Giới thiệu cho tài xế khác | 0,43 |
| **Chị Lan** | 1 `B3 E2 M2` → **`M2` giữ 2s** (cô **hiếm khi** cười) · 2 `NOD` một nhịp | ▸ *"…Cảm ơn em."* — **ba chữ, và đó là nhiều nhất cô từng nói** | `relGain ×2.0` — với cô, đây là **cách duy nhất** để lên quan hệ | 0,32 |
| **Bé Su** | 1 `B3 E5 M3` · 2 `LEAN_IN` · 3 · 4 **dắt bạn tới** | ▸ *"Cô nhớ con nè! Cô nhớ con thiệt nè! Mai con dẫn nhỏ bạn qua nha cô!"* | **+2 khách vãng lai** ngày hôm sau | **0,95** (tin tốt ×1.35) |
| **Ông Hải** | 1 `B3 E2 M3` · 2 vỗ quầy · 3 to | ▸ *"Đó! Vậy mới đúng! Bây nhớ tao thích nhiều pate nè!"* | Gọi thêm ổ thứ hai | 0,65 |
| **Cô Mai** | 1 `B3 E5 M3` · 2 `NOD` | ▸ *"Cô đâu có nói gì đâu. Con nhớ luôn hả? Làm ăn vậy mới được nè."* | **Cho gối đầu tiền lẻ** | 0,80 |
| **Thầy Phúc** | 1 `B5 E5 M3` · 2 `NOD` chậm · 3 | ▸ *"Thầy dạy học ba mươi năm, thầy biết đứa nào chịu để ý. Con để ý."* | Bắt đầu kể chuyện riêng → mở `npcStoryFlag` | 0,43 |
| **Chị Hạnh** | 1 `B3 E5 M2` · 2 `LEAN_IN` | ▸ *"Ơ… em nhớ chị ăn thế à?"* — và lần đầu tiên chị **cười** | Arc hoà nhập +1 bậc | 0,37 |
| **Anh Bảo** | 1 `B3 E2 M2` · 2 `PHONE_UP` — **cậu bỏ điện thoại xuống** | ▸ *"Ủa… dạ. Cảm ơn cô."* | `gazeFactor` của cậu **tăng vĩnh viễn** +0.1 — cậu bắt đầu nhìn bạn | 0,37 |
| **Bà Sáu** | 1 `B5 E5 M3` · 3 | ▸ *"Bây nhớ tui hả? Trời, tui bán tàu hũ hai chục năm có ai nhớ tui đâu."* | Mốc tiến trình: *"nhà tui gần xe bánh mì cô Ba"* | **0,88** |
| **Chú Kiệt** | 1 `B3 E2 M1` → `M2` · 2 `SHRUG` | ▸ *"…Ừ. Mậy nhớ đơn khách. Được."* — **lời khen duy nhất ổng nói cả mùa** | Hạ giọng xóc trong 3 ngày | 0,37 |

---

### 4.8. `REMEMBERED_STORY` — hỏi thăm đúng chuyện họ kể hôm trước (salience 70, dùng `npcStoryFlag`)

| NPC | Tức thì | Thoại mẫu | Trễ | Lan tin |
|---|---|---|---|---|
| **Bà Bảy** | 1 `B3 E5 M3` · 2 `LEAN_IN` · 3 chuỗi followup | ▸ *"Con còn nhớ vụ cái tuồng đó hả? Trời… Để cô kể tiếp cho nghe."* | Mở chuỗi 4 câu cải lương (P2-01 §2.7) | 0,54 |
| **Chú Tư** | 1 `B3 E5 M2` · 2 `NOD` | ▸ *"Con nhỏ nó thi xong rồi. Đậu. … Ừ, đậu rồi."* — ông nói hai lần vì ông tự hào | Kể tiếp arc | 0,48 |
| **Anh Dũng** | 1 `B3 E5 M2` | ▸ *"Cái xe hả? Sửa rồi em. Tốn bốn trăm mấy."* | — | 0,43 |
| **Chị Lan** | 1 `B3 E2 M0` · 2 `TILT_HEAD` | ▸ *"…Sao em biết?"* — **cảnh giác trước, cảm động sau** | Nếu đúng 2 lần liên tiếp → `relGain ×2.2`, đây là **con đường duy nhất tới Friend** | 0,32 |
| **Bé Su** | 1 `B3 E5 M3` · 3 dài | ▸ *"Cô nhớ luôn á?! Cái video đó được hai chục ngàn view rồi nha cô!"* | Video nhắc tên xe → `alleyReputation +` | **0,95** |
| **Ông Hải** | 1 `B5 E5 M2` · 2 `SETTLE_IN` | ▸ *"Ờ… thằng con tao. Nó còn giận tao."* — **và ổng nói câu đó trước 10h sáng, tỉnh táo hoàn toàn** | Mở arc ông Hải | 0,48 |
| **Cô Mai** | 1 `B3 E5 M3` · 3 | ▸ *"Cái lô hàng đó hả? Bán hết trong hai ngày con ơi. Cô tính nhập thêm."* | Mở nguồn hàng giá tốt (P3) | 0,80 |
| **Thầy Phúc** | 1 `B5 E5 M2` · 2 `NOD` chậm | ▸ *"Con nhớ à. … Ít người hỏi lại lắm."* | Mở `speakonce` lớn nhất của thầy | 0,43 |
| **Chị Hạnh** | 1 `B3 E5 M2` · 2 `LEAN_IN` | ▸ *"Em nhớ chị kể à? Ừ… chị vẫn chưa quen được cái nắng trong này."* | Arc hoà nhập +1 | 0,37 |
| **Anh Bảo** | 1 `B3 E2 M2` · 2 `PHONE_UP` | ▸ *"Dạ con thi xong rồi. … Cô nhớ hả?"* | `gazeFactor` +0.1 | 0,37 |
| **Bà Sáu** | 1 `B5 E5 M3` · 3 | ▸ *"Cái chân tui hả? Đỡ rồi bây. Đi hết cái hẻm mà không mỏi."* | — | 0,88 |
| **Chú Kiệt** | 1 `B3 E0 M1` · 2 `TURN_AWAY_QUARTER` | ▸ *"…Sao mậy nhớ chuyện đó."* — **ổng bỏ đi, nhưng mai ổng quay lại sớm hơn 10 phút** | Mở arc "người duy nhất hiểu nghề" | 0,37 |

---

### 4.9. `CARED_FOR_THEM` — trà đá, kéo ghế, che dù, gói kỹ (salience 50 — **đồng thời là công cụ hạ attention**, CANON §5.4)

| NPC | Tức thì | Thoại mẫu | Trễ | Lan tin |
|---|---|---|---|---|
| **Bà Bảy** | 1 `B5 E5 M2` · 2 `SETTLE_IN` · `gazeFactor ↓` 2–3s | ▸ *"Ui, cho cô ly nước hả. Cảm ơn con nghen."* | `ctxVuaDuocTraDa` 180s → bark tiêu cực dịu đi | 0,54 |
| **Chú Tư** | 1 `B3 E5 M2` · 2 `NOD` | ▸ *"Chú uống miếng thôi, chú vô ca liền."* | +tip | 0,48 |
| **Anh Dũng** | 1 `B3 E5 M2` · 2 `HAND_OUT` | ▸ *"Ê đúng lúc luôn em ơi. Chạy nắng khát muốn chết."* | Kể cho tài xế khác | 0,58 |
| **Chị Lan** | 1 `B3 E2 M1` → `M2` **0,8s rồi về `M1`** · 2 `NOD` một nhịp | ▸ *"Dạ, cảm ơn em."* | `relGain ×1.4`. **Nhưng spam 3 ngày liên tiếp → phản tác dụng** (CANON §8i) | 0,32 |
| **Bé Su** | 1 `B3 E5 M3` · 3 | ▸ *"Cô cưng quá à! Con quay cô nha!"* | +khách | 0,95 |
| **Ông Hải** | 1 `B3 E5 M3` · 2 `SETTLE_IN` | ▸ *"Bây biết điều à nghen. Ngồi xuống chú kể cho nghe cái này."* | Gọi thêm | 0,65 |
| **Cô Mai** | 1 `B3 E5 M3` | ▸ *"Con giống cô Ba y chang. Bả cũng hay rót nước cho người ta vậy đó."* | Mở chuyện về cô Ba | 0,80 |
| **Thầy Phúc** | 1 `B5 E5 M2` · 2 `NOD` chậm | ▸ *"Cảm ơn con. Thầy ngồi một chút rồi thầy về."* | Ngồi lại → nhiều `SMALLTALK` hơn | 0,43 |
| **Chị Hạnh** | 1 `B3 E5 M2` · 2 `LEAN_IN` | ▸ *"Ôi, em chu đáo thế. Trong này ai cũng thế à em?"* | Arc hoà nhập +1 | 0,37 |
| **Anh Bảo** | 1 `B3 E2 M2` · 2 `PHONE_UP` | ▸ *"Dạ… con cảm ơn cô."* | `gazeFactor` +0.05 | 0,37 |
| **Bà Sáu** | 1 `B5 E5 M3` · 2 `SETTLE_IN` | ▸ *"Trời, người bán hàng rong mà đi rót nước cho người bán hàng rong. Ngộ hen."* | Gossip tốt | 0,88 |
| **Chú Kiệt** | 1 `B3 E3 M1` · 2 `TURN_AWAY_QUARTER` | ▸ *"…Thôi khỏi. Tao có nước rồi."* — **nhưng ổng cầm** | `relGain` nhỏ nhưng thật | 0,37 |

---

### 4.10. `FREE_EXTRA` — cho thêm đồ chua / thêm ớt / bớt tiền lẻ (salience 25, **có diminishing returns** CANON §8i)

**Luật chung, áp cho cả 12 người:** lần 1 `relGain ×1.0` · lần 2 `×0.6` · lần 3 `×0.3` · **lần 4 trở đi `×0` và với `soi ≥ 0.6` thì `×−0.2`** — họ nhận ra bạn đang mua chuộc.

| NPC | Tức thì | Thoại mẫu | Trễ | Lan tin |
|---|---|---|---|---|
| **Bà Bảy** | 1 `B3 E5 M2` | ▸ *"Cho nhiều vậy con? Thôi cô lấy ít thôi, để dành bán."* | Lần 4: ▸ *"Con cho hoài vậy cô ngại. Bán buôn mà con."* | 0,54 |
| **Chú Tư** | 1 `B3 E5 M2` | ▸ *"Ờ cảm ơn con."* | — | 0,48 |
| **Anh Dũng** | 1 `B3 E5 M2` | ▸ *"Ngon! Cho anh xin thêm miếng ớt nữa đi em."* | — | 0,43 |
| **Chị Lan** | 1 `B4 E1 M1` — **cô nhận ra ngay từ lần 2** | ▸ *"Em không cần làm vậy đâu."* | **Lần 3 → `relGain` âm.** Đây là cái bẫy dành riêng cho người chơi nghĩ mình mua được cô | 0,45 |
| **Bé Su** | 1 `B3 E5 M3` · 3 | ▸ *"Cô ơi cô cho con thêm nữa đi cô ơiiii"* | Vòi thêm mỗi lần | 0,95 |
| **Ông Hải** | 1 `B3 E2 M3` · 3 to | ▸ *"Được! Bây rộng rãi! Mai tao dẫn thằng bạn qua!"* | Dắt người tới thật | 0,65 |
| **Cô Mai** | 1 `B4 E1 M2` — **cô là người buôn bán, cô tính được** | ▸ *"Cho nhiều vậy lời đâu con? Cô nói thiệt đó, tính lại đi."* | **Dạy kinh tế** | 0,80 |
| **Thầy Phúc** | 1 `B4 E0 M2` | ▸ *"Con cho thầy thì thầy nhận. Nhưng đừng cho ai cũng vậy."* | — | 0,43 |
| **Chị Hạnh** | 1 `B3 E5 M2` | ▸ *"Ơ nhiều thế em? Chị gửi thêm tiền nhé."* — **và chị trả thêm thật** | Arc +1 | 0,37 |
| **Anh Bảo** | 1 `B3 E2 M2` | ▸ *"Dạ."* | — | 0,37 |
| **Bà Sáu** | 1 `B3 E5 M3` | ▸ *"Bây cho nhiều quá. Mai tui đổi cho bây chén tàu hũ."* | **Đổi hàng** — mở quan hệ đồng nghiệp | 0,88 |
| **Chú Kiệt** | 1 `B2 E1 M1` · 2 `ARMS_CROSS` · 3 | ▸ *"Cho thêm hoài rồi ế thì sao mậy. Cái chiêu đó tao xài năm ngoái, lỗ chỏng gọng."* | **Mầm tin đồn "cho thêm vì ế hàng"** (CANON §12, mutation 0.25) | 0,25 |

---

### 4.11. `FLOURISH` — thao tác đẹp: rạch bánh một đường, quết pate gọn, gói nhanh (salience 15 — **thưởng cho kỹ năng tay, không thưởng cho tiền**)

Salience thấp nhất → **chỉ người `soi` cao mới `NOTICED`**. Đó là chủ ý: kỹ năng được người biết nghề công nhận.

| NPC | Tức thì | Thoại mẫu | Trễ | Lan tin |
|---|---|---|---|---|
| **Bà Bảy** | 1 `B3 E5 M2` · 2 `PEEK_OVER` | ▸ *"Tay con dạo này gọn ghê."* | +tip nhỏ | 0,54 |
| **Chú Tư** | 1 `B0 E0 M2` | — | — | 0,10 |
| **Anh Dũng** | 1 — | — (không thấy) | — | 0,08 |
| **Chị Lan** | 1 `B3 E1 M0` — **cô thấy. Cô luôn thấy.** | — | `relGain` nhỏ nhưng **cộng dồn**, và đây là con đường **im lặng** để lên quan hệ với cô | 0,32 |
| **Bé Su** | 1 `B3 E2 M3` · 3 | ▸ *"Cô làm nhanh dữ! Quay lại coi nè!"* | Video | 0,95 |
| **Ông Hải** | 1 `B3 E2 M3` | ▸ *"Nghề đó nghen bây."* | — | 0,50 |
| **Cô Mai** | 1 `B3 E1 M2` | ▸ *"Nhanh hơn hồi tuần trước rồi đó."* — **cô đo được tiến bộ** | — | 0,60 |
| **Thầy Phúc** | 1 `B3 E1 M2` · 2 `NOD` | ▸ *"Một đường dao. Hồi đầu con rạch ba lần lận."* — **thầy nhớ**, và đó là kiểu quan tâm của thầy | `relGain ×1.3` | 0,43 |
| **Chị Hạnh** | 1 `B3 E2 M2` | ▸ *"Em làm khéo nhỉ."* | — | 0,37 |
| **Anh Bảo** | 1 — | — | — | 0,03 |
| **Bà Sáu** | 1 `B3 E5 M2` | ▸ *"Tay nghề lên rồi bây ơi."* | — | 0,70 |
| **Chú Kiệt** | 1 `B3 E1 M1` · 2 `PEEK_OVER` **rồi quay đi** | ▸ *"…Ai dạy mậy rạch kiểu đó?"* — **ổng là người duy nhất biết cái đó khó** | `relGain` lớn nhất trong các sự kiện với ổng | 0,25 |

**Tổng số ô có thoại mẫu trong §4: 118/132.** Những ô để trống (`—`) là **cố ý im lặng** — đó là dữ liệu, không phải thiếu sót: anh Bảo không thấy gì là **đặc điểm thiết kế** của anh Bảo.

---

## 4.6. Nguyên tắc vàng, cụ thể hoá thành số: **chị Lan**

> **Phản ứng im lặng phải NGUY HIỂM HƠN phản ứng ồn ào.**

Chị Lan: `soi 0.9 / nongTinh 0.1 / deTha 0.2 / thanThien 0.3` — ô số 8 trong bảng §2.3, và **người duy nhất** trong ô đó.

### Kịch bản chuẩn: `DROPPED_FOOD` `CONFIRMED` trước mặt chị Lan

| t | Kênh | Chuyện gì xảy ra | Con số |
|---|---|---|---|
| **0,00s** | — | Ổ bánh chạm đất. `salience 75`, `visibility[FRONT_CENTER][HANDS] = 0.95`, `gazeFactor 1.0`, `traitMul 1.36` | `rate = 75×0.95×1.0×1.36/100 = 0.97/s` |
| **+0,31s** | — | Delay chống twinning (0,2–0,4s ngẫu nhiên) | |
| **+0,36s** | 1 | `certainty = 0.35` → `GLIMPSED`. Mặt: `B1 E1 M0`. Dấu `?` nhỏ | |
| **+0,72s** | 1+2 | `certainty = 0.70` → `NOTICED`. Mặt: `B2 E2 M1`. Pose `STEP_BACK_HALF` | |
| **+1,03s** | 3 | **Roll bark: trượt.** `nongTinh 0.1` → rule "nói ra" cần `nongTinh ≥ 55` hoặc `thanThien ≥ 55` → **không rule nào khớp** (§2.3). Không phải 35% may rủi — **luật tính cách** | |
| **+1,40s** | 1+2 | `certainty = 1.0` → `CONFIRMED`. Pose `FREEZE` (damping 40 — cô **đứng sững**) | |
| **+1,4→5,2s** | 1 | Mặt giữ `M1`. Không trở về nền (`deTha 0.2` → thời gian giữ `3,0 + 0.2×4,0 = 3,8s`) | |
| **+6s** | 4 | Cô **trả tiền đủ**, cầm bánh, `WAVE_SMALL` rất nhỏ, đi | |
| **+14s** | 4 | **Người chơi nhìn thấy cô ra tới góc đường và bỏ ổ bánh vô thùng rác.** Đây là frame quan trọng nhất của cả game — nó phải **nằm trong khung hình**, không phải ngoài màn hình | |
| **+0 ngày** | 5 | `memory.record(intensity 88, silent: true)`; `decayRate = base × (0.4 + 1.6×0.2) = base × 0.72` — chậm nhất hẻm | |
| **+1..5 ngày** | 5 | **Vắng 5 ngày.** Chỗ 7h35 của cô trống | |
| **+3..5 ngày** | 5 | `pGossip 0.55` ở sự kiện vệ sinh → cô **kể cho một người** (thường là cô Mai hoặc chị Hạnh) → người chơi **nghe lỏm được** ở góc hẻm (CANON §12.4) | |
| **+6 ngày** | 5 | Cô quay lại. `relPoints` đã tụt qua sàn `Acquaintance`. Cô **gọi món bằng cách nói đủ yêu cầu**, không còn tin bạn nhớ | |

### Nhưng phải có **báo trước 3–4 ngày** (phán quyết XĐ3)

Đây là ràng buộc **không thương lượng**, cùng luật với arc chú Tư (CANON §9: *"biến mất ~ngày 30, **có báo trước 3–4 ngày**"*).

**Lý do:** *"khách ruột mất là mất thật — không có respawn quan hệ"* (CANON §13). Một mất mát vĩnh viễn mà người chơi **không có cơ hội đọc ra** thì không phải thiết kế, đó là trừng phạt. Trụ cột **T5** đòi người chơi phải đọc được rủi ro **trước** khi hành động.

**Cơ chế báo trước — ba tầng, chạy trong 3–4 ngày trước khi biến mất hẳn:**

| Ngày trước khi mất | Tín hiệu | Kênh | Người chơi đọc ra |
|---|---|---|---|
| **D−4** | Cô **đổi món** về thứ an toàn nhất (*"bánh mì không"*) và **nói đủ yêu cầu** dù đã ghé 20 lần | 4 | "Ủa sao chị ấy không để mình tự làm nữa?" |
| **D−3** | Cô đứng **`QUEUE_2` thay vì `FRONT_CENTER`** — lùi ra khỏi tầm nhìn gần | 2 | "Chị ấy đứng xa hơn mọi bữa" |
| **D−3** | `M1` **ngay từ lúc tới**, trước khi bạn làm gì | 1 | "Chị ấy đã khó chịu sẵn rồi" |
| **D−2** | Cô **không nhận trà đá** — lần đầu tiên | 4 | Đây là tín hiệu rõ nhất, và nó **im lặng** |
| **D−2** | Sổ tay cuối ngày ghi: *"Chị Lan — hôm nay chị không lấy ly nước."* (CANON §15: sổ tay là công tắc, nhưng **dòng này luôn có**) | 5 | |
| **D−1** | Cô trả tiền **đúng số, không nhận thối** — cắt nốt lý do phải nói chuyện | 4 | "Chị ấy đang kết thúc" |
| **D−1** | **Một câu duy nhất**, `speakonce`: ▸ *"Dạo này em bận quá hả?"* — **câu hỏi duy nhất cô hỏi cả mùa**, và nó **không phải câu hỏi** | 3 | Cơ hội cuối |
| **D0** | Không tới. Không tới nữa | 5 | |

**Cửa sổ chuộc lỗi:** trong 4 ngày đó, **một** `REMEMBERED_USUAL` hoặc `REMEMBERED_STORY` đúng sẽ **huỷ lịch biến mất** và reset về `Acquaintance`. Không phải quà, không phải giảm giá, không phải cho thêm (`FREE_EXTRA` với cô là **âm**). Chỉ có: **nhớ đúng**.

Nếu bật công tắc trợ năng *"khách biến mất không chia tay → họ để lại lời nhắn"* (CANON §15), D0 thêm: cô Mai đưa bạn một mẩu giấy ▸ *"Chị Lan gửi con. Chị nói chị chuyển chỗ làm."* — **lời nói dối lịch sự**, và người chơi biết đó là lời nói dối. Đó là cách tử tế nhất có thể giữ mà không phá cơ chế.

### Kiểm tra đối xứng: ồn ào phải **ít nguy hiểm hơn**

| | Ông Hải (`nongTinh 0.9`) | Chị Lan (`nongTinh 0.1`) |
|---|---|---|
| Âm lượng bark | 0,94 — **cả hẻm nghe** | 0,46 — không bark |
| `witnessCount` cộng thêm | **+2** | 0 |
| Memory intensity | 62 | **88** |
| `decayRate` hệ số | `×1.20` (quên nhanh) | **`×0.72`** (nhớ lâu nhất) |
| Vắng mặt | **0 ngày** | **5 ngày** |
| Hạ trần tin tưởng (CANON §8d) | Không | **Có** |

Đọc bảng: ông Hải **gây ồn gấp đôi và gây hại bằng một phần năm**. Đây chính là nguyên tắc vàng, viết bằng số.

---

## 5. Chống rập khuôn — không thương lượng (idea.md §19.5)

David nêu đích danh những cái bẫy. Đây là cách từng người thoát khỏi bẫy của mình.

| NPC | Cái khuôn nguy hiểm | Thứ được cấp để thoát ra | Hiện ra trong game bằng gì |
|---|---|---|---|
| **Bà Bảy** — bán vé số | *"Trong mọi media về VN, bà ấy tồn tại để người xem thương hại."* | **1. Mê cải lương** — chuỗi 4 câu, `applycontext` 240s, có tuồng có tên (*Tiếng trống Mê Linh*), có ý kiến chuyên môn (*"đào bây giờ hát tới vọng cổ là hụt hơi"*). **2. Mối bất hoà 15 năm với cô Ba** — không ai chịu nhắc lại | Bà **không bao giờ** xin xỏ. Bà là **người soi nhất hẻm** — tức bà có **quyền lực** trong quan hệ, không phải đối tượng thương hại. Khi cô Ba có mặt (`coBaPresent = 1`), bà Bảy **đứng `QUEUE_2`, không đứng `FRONT_CENTER`** — và **không ai giải thích vì sao**. Người chơi phải tự thấy |
| **Ông Hải** — chú nhậu | *"Nếu chỉ là comic relief say xỉn thì rẻ tiền."* | **Trước 10h sáng rất tử tế** — và đó mới là cái đau. Hai bộ rule hoàn toàn tách biệt qua `hour ∈ [0,1000]` + `ctxHaiTinhTao` (P2-01 §2.6-5) | Buổi sáng: ▸ *"Chú chờ được con, làm cho kỹ."* · ▸ *"Ờ… thằng con tao. Nó còn giận tao."* Buổi chiều: ▸ *"Trời đất ơi bán buôn kiểu gì vậy?"* **Người chơi phải tự phát hiện có hai ông Hải.** Không một dòng UI nào nói ra |
| **Cô Mai** — tạp hoá | *"Cái hẻm mà ai cũng nghèo giống nhau là cái hẻm giả."* | **Làm ăn được.** Cô có hàng nhập, có sổ sách, có con đi học thêm. Cô là **nguồn đổi tiền lẻ và sổ nợ** — tức cô **cho bạn vay**, không phải ngược lại | ▸ *"Cho nhiều vậy lời đâu con? Cô nói thiệt đó, tính lại đi."* — cô **dạy bạn kinh tế**. Cô là người duy nhất phản ứng tiêu cực với `FREE_EXTRA` **vì lý do kinh doanh**, không vì đạo đức |
| **Chị Hạnh** — người Bắc | Bị chọc giọng → dễ thành nhân vật để cười | **Việc chọc giọng là do NPC khác làm, và game không đứng về phía người chọc.** Bé Su chọc (`ctxChocGiongHanh`), và **bà Bảy rầy bé Su**. Arc hoà nhập có đích rõ: ngày ~28 chị nói *"ngò"* thay vì *"rau mùi"* — **và đó là mất mát, không phải chiến thắng** | Lỗi `ORDER_DEFECT` của chị **thường là do khác từ vùng miền, không do bạn ẩu** (§4.5) — game đặt bạn vào thế phải **học từ của chị**, không phải bắt chị học từ của bạn. Người Việt cười người Việt, không phải game cười người Việt (CANON §14.1) |
| **Anh Dũng** — xe ôm → Grab | Khuôn "bác xe ôm già đầu hẻm" | **Anh là tài xế Grab, trước là xe ôm truyền thống** — câu chuyện thật của 10 năm qua. Arc: **đổi ca đêm giữa mùa** | ▸ *"Hồi xưa anh đậu ngay gốc cây kia kìa. Giờ có ai kêu đâu, toàn bấm app."* — nói một lần, `speakonce`, không bi luỵ. Sau khi đổi ca đêm, anh tới lúc **5h sáng** thay vì 7h — người chơi phải **đổi lịch nhập hàng** |
| **Bé Su** — trẻ quay TikTok | Khuôn "trẻ con nghiện điện thoại" | Bé là **bộ khuếch đại danh tiếng có thật** — video của bé **thực sự đổi `alleyReputation`**. Bé không bị trừng phạt vì quay TikTok; bé là **lý do xe bánh mì nổi tiếng** | Chuyện tốt **lẫn** chuyện xấu đều lan qua bé (`pGossip 0.70`, tin tốt ×1.35 = 0,95). Bé là hệ quả trực tiếp của hành động bạn, **không phải trò đùa** |
| **Chú Kiệt** — đối thủ | Khuôn "kẻ xấu bên kia hẻm" | **Người duy nhất hiểu nghề của bạn.** Ổng là người duy nhất nhận ra `FLOURISH` (§4.11) và người duy nhất khen bạn khi bạn giỏi thật | ▸ *"…Ai dạy mậy rạch kiểu đó?"* Ổng gian dối vệ sinh (CANON §7.5) **và** ổng đúng về nghề. Hai thứ cùng tồn tại — đó là con người |
| **Thầy Phúc** — thầy giáo hưu | Khuôn "ông già thông thái phát quest" | Thầy **không phát quest**. Thầy chỉ **để ý**, và thầy nhớ những chi tiết rất nhỏ (▸ *"Hồi đầu con rạch ba lần lận."*). Thầy là NPC dạy người chơi **đọc hệ thống**, bằng cách **chỉ ra cái người chơi chưa thấy**, không bằng cách cho thưởng | ▸ *"Không sao. Tên con người ta khó nhớ lắm."* — thầy nói thật lòng, và **nó đau hơn là thầy giận** |
| **Chú Tư** — bảo vệ | Khuôn "chú bảo vệ nghiêm khắc" | `deTha 0.9` — **người dễ tha nhất hẻm**. Ổng chưa giận bạn lần nào. Arc của ổng là **công ty dời chỗ**, tức ổng mất **không phải vì lỗi của bạn** | ▸ *"Ừ… ờ. Không sao con."* — câu buồn nhất trong game, vì nó là câu **tha thứ** |
| **Bà Sáu** — gánh tàu hũ | Khuôn "bà bán hàng rong tội nghiệp" số hai | Bà là **đồng nghiệp**, ngang hàng. Bà **đổi hàng** với bạn (▸ *"mai tui đổi cho bây chén tàu hũ"*). Mốc tiến trình đẹp nhất game đi qua bà: *"nhà tui gần chỗ bán tàu hũ"* → *"nhà tui gần xe bánh mì cô Ba"* | Không một con số, không một thanh progress (CANON §19.2) |
| **Anh Bảo** — sinh viên | Khuôn "gen Z vô cảm" | Cậu là **sandbox để người chơi học hệ perception**, và cậu **có thể thay đổi**: mỗi `REMEMBERED_USUAL`/`REMEMBERED_STORY` cộng `gazeFactor +0.1` vĩnh viễn. Đến cuối mùa cậu **bỏ điện thoại xuống khi tới** | ▸ *"Ủa… dạ. Cảm ơn cô."* — và lần sau cậu ngẩng đầu lên sớm hơn. **Người chơi tự làm ra sự thay đổi đó** |
| **Chị Lan** — nhân viên văn phòng | Khuôn "chị công sở khó tính" | Cô không khó tính. Cô **kỹ và mệt**. Con đường tới `Friend` của cô tồn tại thật, chỉ là nó **chỉ có một cửa**: nhớ đúng. Và khi cô cười (`M2` 0,8s), nó đáng giá hơn mọi lời khen của người khác | ▸ *"…Cảm ơn em."* — ba chữ, và đó là nhiều nhất cô từng nói |

**Luật chung rút ra, áp cho mọi NPC thêm về sau:** mỗi người phải có **một thứ hoàn toàn không liên quan tới vai trò của họ trong gameplay**. Bà Bảy có cải lương. Ông Hải có đứa con giận ổng. Cô Mai có lô hàng bán hết trong hai ngày. Thiếu thứ đó thì nhân vật là **chức năng**, không phải người.

---

## 5.1. Khách khó ưa thật sự — ai, và ở mức nào

Không có người này thì mọi lời khen trong game đều rẻ. Ba mức:

| Mức | Định nghĩa | Ai | Con số | Vì sao cần |
|---|---|---|---|---|
| **M3 — không bao giờ hài lòng** | Luôn tìm ra một thứ để nói. Phục vụ hoàn hảo vẫn nhận được một câu xóc | **Chú Kiệt** (`soi 0.7`, `deTha 0.3`) | Rule DB của ổng có **một rule score 2 luôn khớp**: bất kỳ `DELIVERY` nào không có defect → ▸ *"Được. Mà pate mậy mua chỗ nào vậy? Nghe đồn chỗ đó trộn."* Không bao giờ có lượt "không có gì để nói" | Người chơi cần **một người không mua được**. Nếu ai cũng chinh phục được thì hệ quan hệ là máy bán hàng tự động |
| **M3′ — không bao giờ quay lại, không lý do** | Khách vãng lai vô danh lần đầu gặp sự kiện `CONFIRMED` tiêu cực | **Pool khách vãng lai** — ~1/6 số khách mỗi ngày | `npcIsFirstVisit = 1` + `CONFIRMED` tiêu cực → *"Im, đi thẳng. Không bao giờ quay lại."* Không bark, không memory, không gossip. **Họ chỉ biến mất khỏi pool** | idea.md §9.3 hàng cuối. Đây là thứ làm người chơi hiểu rằng **thế giới lớn hơn 12 người có tên** |
| **M2 — phục vụ hoàn hảo mà vẫn đi mất** | Mất người **vì lý do không liên quan tới bạn** | **Chú Tư** (công ty dời chỗ, ~ngày 30) | Không có hành động nào của người chơi ngăn được. Có **báo trước 3–4 ngày** (CANON §9) | *"Đừng làm ending dựa trên bạn đã làm tốt tới đâu."* (CANON §15) Chú Tư là bằng chứng sống của câu đó trong suốt mùa |
| **M2′ — mất vì lỗi của bạn, nhưng im lặng** | | **Chị Lan** | §4.6 | Nguyên tắc vàng |
| **M1 — khó chịu ồn ào, nhưng vô hại** | | **Ông Hải sau 10h**, **anh Dũng lúc vội** | `intensityMul` cao, memory intensity thấp, `deTha` cao | Làm nền để M2/M3 nổi bật. Không có M1 thì mọi tiếng ồn đều đáng sợ, và người chơi tê liệt |

**Một ràng buộc quan trọng:** chú Kiệt (M3) **không được phép làm giảm doanh thu**. Ổng xóc, ổng khó chịu, nhưng ổng **vẫn mua** và `pGossip` của ổng chỉ 0,25 (không ai nghe ổng). Nếu người khó ưa cũng gây thiệt hại lớn thì người chơi sẽ **từ chối phục vụ** — và CANON §8k nói từ chối phải tốn kém. Đừng tạo động cơ cho lỗ hổng đó.

---

## 5.2. Sự kiện ngoài tầm kiểm soát — `mood` độc lập

idea.md §9.2 nhóm D, mục 20: **khách vừa bị sếp mắng → cáu vô cớ, chê cả món hoàn hảo, và bạn không làm gì sai.**

> *"Mục 20 là thứ nhiều game bỏ quên: NPC phải có lý do riêng, không liên quan tới bạn. Một NPC chỉ phản ứng với hành động của bạn thì vẫn là cái máy — chỉ là cái máy tinh vi hơn."*

### Cơ chế

`npcMood` (fact C8, 0..100) được roll **lúc NPC spawn**, từ **seed cố định theo ngày** (CANON §8e — chống save-scum). Nó **hoàn toàn không đọc** bất kỳ hành động nào của người chơi.

```ts
// sim/mood.ts
const MOOD_TABLE: { cause: FactVal; prop: FactVal; weight: number; moodDelta: [number, number] }[] = [
  { cause: SYM.NONE,      prop: SYM.NONE,      weight: 62, moodDelta: [  0,   0] },
  { cause: SYM.SEP_MANG,  prop: SYM.MAT_LAM_LI,weight:  9, moodDelta: [-45, -25] },
  { cause: SYM.MUA_UOT,   prop: SYM.AO_UOT,    weight:  8, moodDelta: [-30, -15] },
  { cause: SYM.DAU_OM,    prop: SYM.TAY_BANG,  weight:  6, moodDelta: [-35, -20] },
  { cause: SYM.HET_TIEN,  prop: SYM.VI_MONG,   weight:  6, moodDelta: [-25, -10] },
  { cause: SYM.MET,       prop: SYM.VAI_XUOI,  weight:  5, moodDelta: [-20,  -8] },
  { cause: SYM.TIN_VUI,   prop: SYM.AO_MOI,    weight:  4, moodDelta: [+20, +40] },
];

function rollMood(npc: Npc, daySeed: number) {
  const r = weightedPick(MOOD_TABLE, rngFromSeed(daySeed, npc.id));
  npc.mood      = clamp(50 + rndIn(r.moodDelta), 0, 100);
  npc.moodCause = r.cause;   // fact C9
  npc.moodProp  = r.prop;    // fact C10  ← BẮT BUỘC có, xem dưới
}
```

### Mood đổi cái gì, và **không** đổi cái gì

Ràng buộc từ CANON §16 Đừng-3 (Ocio Barriales): *"có thể có nhiều biến thể của cùng một phản ứng, nhưng **loại** phản ứng — category và intensity — thì không được đổi."*

| Mood ĐƯỢC đổi | Mood KHÔNG được đổi |
|---|---|
| Biến thể thoại (rule có criterion `npcMood`) | Công thức có ra đúng món không |
| Dáng đi, pose nền (`LEAN_BACK` thay `IDLE`) | Tiền có vào túi không |
| Món gọi (mood thấp → món rẻ, `isMonthEnd`) | Cốt truyện có unlock được không |
| Tip (mood thấp → không tip) | `salience` của sự kiện |
| Thứ tự đến trong ngày | **`memory.intensity` ghi vào** — sự kiện xấu vẫn nặng đúng bằng đó |
| Ngưỡng `npcPatience` khởi điểm | `traitMul` (perception) — **mood không làm họ soi hơn** |

> **Điểm tinh tế:** mood thấp làm họ **nói khó nghe hơn**, nhưng **không** làm họ nhớ dai hơn. Nếu mood chạm vào memory thì một ngày xui của NPC sẽ để lại sẹo vĩnh viễn cho người chơi vì chuyện người chơi không gây ra — và đó là thiết kế xấu.

### Nhưng phải **ĐỌC ĐƯỢC** — nguyên tắc Orkin (CANON §16 Đừng-1)

> *"Vocalizing intentions can sometimes even be enough, without any actual implementation."*

**KHÔNG mô phỏng.** Không có cảnh văn phòng, không có sếp, không có hệ thống công việc của chị Lan. Chỉ có **hai thứ**:

1. **Một prop hình ảnh, nhìn thấy từ xa** — trước khi NPC tới quầy, lúc họ còn ở `QUEUE_3` hoặc đang đi vào hẻm.
2. **NPC nói ra** — một câu, một lần, không giải thích thêm.

| `moodCause` | `moodProp` — nhìn thấy từ xa | Câu nói ra (một lần, `norepeat` theo ngày) |
|---|---|---|
| `SEP_MANG` | **Mặt lầm lì** (`B1 E3 M1` ngay từ lúc vào khung hình) + bước chân nhanh, `torso` chúi trước | ▸ *"Cho ổ đầy đủ."* — **cộc lốc, không chào**. Rồi sau đó, nếu `thanThien ≥ 0.5`: ▸ *"Xin lỗi con nghen. Hồi sáng cô bị nói."* |
| `MUA_UOT` | **Áo ướt** — sprite overlay tối màu ở vai + tóc bết + `SHIVER` (spring biên độ nhỏ, tần số cao) | ▸ *"Mắc mưa dọc đường luôn."* |
| `DAU_OM` | **Tay băng** — sprite overlay trắng ở `armR` + pose `armR` không duỗi được | ▸ *"Tay chú bị đứt, làm ơn gói giùm chú."* |
| `HET_TIEN` | **Ví mỏng** — thao tác đếm tiền lâu hơn 1,5s, `head` cúi | ▸ *"Cho ổ không thôi con. Cuối tháng rồi."* |
| `MET` | **Vai xuôi** — `torso` target thấp hơn 4px suốt phiên | ▸ *"Tối qua chú ngủ có ba tiếng."* |
| `TIN_VUI` | **Áo mới** — palette swap 1 lớp áo + pose `LEAN_IN` nền | ▸ *"Bữa nay cho hai ổ! Chú bao!"* |

**Luật bắt buộc:** `moodProp ≠ NONE` ⟹ prop phải hiện **trước khi** NPC vào tầm nói chuyện, và **ít nhất 2 giây** trước câu thoại cộc lốc đầu tiên. Thứ tự phải là **thấy → hiểu → nghe**, không bao giờ ngược lại. Nếu người chơi nghe câu cáu trước khi thấy cái áo ướt, họ sẽ nghĩ mình làm sai — và cả cơ chế phản tác dụng.

**Kiểm chứng (mục 6, T-8):** cho 10 người lạ chơi. Sau một lượt `mood` xấu, hỏi *"vì sao khách đó cáu?"*. **≥ 7/10 phải trả lời được rằng không phải lỗi của họ.** Đây là biến thể của cổng P1 trong CANON §17.

**Và một lỗ hổng phải bịt:** mood xấu **không được** trở thành cái cớ để người chơi làm ẩu. Vì vậy: mood **không** giảm `traitMul`, **không** giảm `memory.intensity`, và sự kiện `CONFIRMED` trong lượt mood xấu **vẫn ghi nhớ đầy đủ**. Khách cáu vô cớ **vẫn** nhớ đúng việc bạn làm rớt bánh.

---

## 5.3. Chống twinning — random hoá delay 0,2–0,4s

CANON §11: *"random hoá độ trễ phản ứng 0,2–0,4 giây; không bao giờ cho cả nhóm phản ứng cùng một frame."*

Lý do (idea.md §18.7 bonus): *"nếu cả nhóm phản ứng đúng cùng một frame, dù mỗi người dùng animation riêng, vẫn 'sai sai'."* Mắt người bắt được **đồng bộ** trước khi bắt được **nội dung**.

```ts
// sim/perception.ts — duyệt loop TỪ PHÍA SỰ KIỆN (CANON §5, bài học Mark of the Ninja)
function dispatchEvent(ev: Event, now: number) {
  const witnesses = ev.zone.customersInRange();        // từ phía sự kiện, không poll từ NPC
  for (const npc of witnesses) {
    // Ba tầng tách biệt, cộng dồn:
    const base   = 0.20;                               // 1. sàn cứng
    const jitter = rng.range(0, 0.20);                 // 2. ngẫu nhiên 0..0,2s
    const trait  = (1 - npc.p.nongTinh) * 0.25;        // 3. điềm đạm phản ứng chậm hơn
    const delay  = base + jitter + trait;              // 0,20 .. 0,65s
    scheduleReaction(npc, ev, now + delay);
  }
}
```

**Ba tầng, không phải một:**

| Tầng | Khoảng | Vai trò |
|---|---|---|
| Sàn cứng `0,20s` | — | Khớp thời gian phản xạ go/no-go của người thật (~0,38s tổng, Rabin) — dưới mức này thì *NPC biết trước cả người chơi* |
| Jitter `0..0,20s` | ngẫu nhiên đều | **Phá đồng bộ** — đây là phần chống twinning thuần |
| Theo `nongTinh` | `0..0,25s` | **Thông tin**: ông Hải (`0.9`) phản ứng ở ~0,32s; thầy Phúc (`0.2`) ở ~0,50s. Người chơi học được rằng **ai quay đầu trước** |

**Hai luật phụ:**

1. **Không hai NPC nào phản ứng trong cùng 60 ms.** Nếu delay đã tính rơi vào cửa sổ đó của một người khác, đẩy thêm `+0,06s`. Đây là chốt chặn cuối, vì với 5 NPC thì jitter đều vẫn va nhau khoảng 1 lần trên 8.
2. **Delay áp cho kênh 1 và 2 (mặt, dáng).** Kênh 3 (bark) cộng thêm `0,2–0,8s` nữa — người ta **nhìn trước, nói sau**. Nếu mặt và lời cùng frame thì nó thành hoạt hình, không thành người.

---

## 6. Tiêu chí đạt

- [ ] **T-1.** Sau **3 ngày chơi**, ≥ 7/10 người lạ phân biệt được ít nhất **3 kiểu khách** và mô tả đúng ít nhất 2 (câu hỏi mở, không gợi ý). Đây là lý do cắt 6 chiều còn 4 (§2.2).
- [ ] **T-2.** Mọi sự kiện `CONFIRMED` chạm **≥ 3 kênh** cùng lúc. Log tự động đếm; 0 ngoại lệ.
- [ ] **T-3.** Mặt: đúng **18 file sprite**, ghép được **216 tổ hợp**, và bảng §3.1 phủ hết 11 sự kiện × 4 tính cách trội × 3 cường độ.
- [ ] **T-4.** Dáng: **0 sprite mới** cho toàn bộ 19 pose ở §3.2. Kiểm bằng cách đếm asset.
- [ ] **T-5.** Bảng 11×12 (§4) có **≥ 25 ô** có thoại mẫu viết xong (thực tế đạt **118/132**), và mỗi NPC có ít nhất **6 ô** có giọng riêng nhận ra được.
- [ ] **T-6.** Test mù giọng: cắt tên khỏi 20 dòng thoại ngẫu nhiên, đưa cho người đã chơi 5 ngày. **≥ 14/20 đoán đúng người nói.**
- [ ] **T-7.** Chị Lan: chuỗi báo trước 3–4 ngày (§4.6) chạy đủ **7 tín hiệu**. Playtest: ≥ 6/10 người nhận ra "có gì đó không ổn với chị Lan" **trước** ngày D0.
- [ ] **T-8.** Mood: sau một lượt mood xấu, **≥ 7/10** trả lời đúng *"không phải lỗi của tôi"*. Và prop hiện **≥ 2,0s** trước câu thoại đầu (đo tự động).
- [ ] **T-9.** Chống twinning: trong 1 giờ log, **0 cặp NPC** phản ứng cách nhau < 60 ms.
- [ ] **T-10.** Nguyên tắc vàng: đo bảng đối xứng §4.6 — ông Hải gây `witnessCount` cao hơn chị Lan **≥ 2×**, và chị Lan gây mất ngày ghé cao hơn ông Hải **≥ 4×**.
- [ ] **T-11.** Chống rập khuôn: mỗi NPC trong 12 người có **≥ 1 nội dung hoàn toàn không liên quan tới vai trò gameplay** đã viết thành rule chạy được (§5).
- [ ] **T-12.** Khách khó ưa: chú Kiệt có **0 lượt** "không có gì để nói"; pool vãng lai có **≥ 1 người biến mất vĩnh viễn** mỗi 6 ngày chơi trung bình.
- [ ] **T-13.** Trợ năng (CANON §15): bật "giảm chuyển động" → mọi pose vẫn đọc được (test mù với 5 người); bật "tắt âm báo tiêu cực" → chữ bark **vẫn hiện**.
- [ ] **T-14.** Không có một chỉ số quan hệ nào hiện trên màn hình (T3). Grep UI: 0 thanh, 0 số, 0 màu tên.

---

## 7. Rủi ro & cách bịt

| # | Rủi ro | Nối tới | Cách bịt |
|---|---|---|---|
| R1 | **Người chơi không đọc được quan hệ** → team đòi thêm thanh tình cảm | **T3** | Sổ tay cuối ngày (CANON §15) là **duy nhất một** kênh chữ, và nó ghi **sự kiện**, không ghi **số**: *"Chị Lan — hôm nay chị không lấy ly nước."* Không bao giờ *"Chị Lan: −12 trust"* |
| R2 | **Im lặng bị đọc là bug** ("NPC này bị đứng hình") | §3.2 `FREEZE` | `FREEZE` có `damping 40` chứ không phải đóng băng tuyệt đối — vẫn có vi chuyển động thở. Cộng: mặt **giữ `M1`**, tức có tín hiệu rõ ràng đang chạy |
| R3 | **Phân tầng khách**: dồn đồ xịn cho người `soi` cao | CANON §8b | Người `deTha` cao không giận nhưng **vẫn vô tư kể lại** (`pGossip` của bé Su 0,70, bà Sáu 0,65) → dùng chính hệ đồn thổi để bịt |
| R4 | **Mood trở thành cớ ăn gian** ("khách đang cáu sẵn, làm ẩu đi") | §5.2 | Mood **không** chạm `traitMul`, **không** chạm `memory.intensity`. Ghi rõ trong bảng "không được đổi" |
| R5 | **Khai thác nhớ nhầm chiều ngược** | CANON §8h | Bias nhớ nhầm **theo tính cách**: `soi` cao lệch xấu, `thanThien` cao lệch tốt. Cài trong `sim/memory.ts`, không ở doc này nhưng phải dùng đúng 4 chiều ở đây |
| R6 | **Micro-cheat lặp vô hạn** (bớt 1 thứ nhỏ với 100% khách × 40 ngày) | CANON §8g — **lỗ hổng lớn nhất hiện tại** | Phát hiện theo **pattern**: fact `ctxRepeatDefect` đếm theo loại lỗi × số khách. Sau N lần → rule score cao ▸ *"Ê, dạo này bánh nhạt hơn hay tại tao?"* (chú Kiệt và bà Bảy là hai người nói câu này) |
| R0.5 | **Spam `CARED_FOR_THEM` / `FREE_EXTRA` để mua quan hệ** | CANON §8i | Diminishing returns §4.10 + **người `soi ≥ 0.6` nhận ra và phản tác dụng**. Chị Lan lần 3 → `relGain` **âm** |
| R8 | **Từ chối phục vụ người khó ưa** | CANON §8k | Chú Kiệt `pGossip` thấp (0,25) nên ổng không hại được bạn — **không có động cơ từ chối**. Còn nếu từ chối thật: người bị từ chối kể cho cả hẻm |
| R9 | **Bốn chiều bị dùng như hệ số nhân bí ẩn** trộn cả tầng perception lẫn tầng thoại | P2-01 §2.11 | Ranh giới cứng: `soi → traitMul` quyết định họ **biết**; **mật độ rule** quyết định họ **nói**. Không trộn. Code review chặn |
| R10 | **Chọc giọng chị Hạnh bị đọc là game cười người Bắc** | CANON §14.1 | Bà Bảy **rầy** bé Su ngay tại chỗ. Và lỗi `ORDER_DEFECT` do khác từ vùng miền được khung là **bạn phải học từ của chị**, không ngược lại |
| R11 | **Bà Bảy bị đọc là nhân vật để thương hại** | idea.md §19.5 | Bà là **người có quyền lực nhất trong quan hệ** (soi cao nhất, thắng mọi rule vệ sinh). Bà **không bao giờ xin xỏ**. Review thoại bởi người Việt viết văn hoá |
| R12 | **Mô phỏng sâu đời sống NPC** lọt vào qua đường mood | CANON §16 Đừng-1 | Mood là **một enum + một prop + một câu**. Không có hệ công việc, không có mô phỏng sếp. Validator: fact `npcMoodCause` chỉ được có 7 giá trị |
| R13 | 216 tổ hợp mặt nhưng chỉ dùng ~20 | §3.1 | Đó là **được**, không phải lãng phí: 18 file là chi phí cố định. Bảng §3.1 dùng ~28 tổ hợp; phần còn lại là ngân sách cho full release |
| R14 | Lồng tiếng người thật (CANON §2) không phủ hết bảng §4 | — | Ưu tiên: `speakonce` > tier-1 sự kiện salience ≥ 75 > phần còn lại. Dòng không có voice vẫn chạy bằng chữ |

---

## 8. Truy vết

| Nội dung trong doc này | `idea.md` | `CANON.md` |
|---|---|---|
| 4 chiều tính cách, định nghĩa | §9.3 (bản 6 chiều) · HT7 (cắt còn 4) | **§4** |
| Cắt 6 → 4, lời Minh nguyên văn | **HT7** | §4 (kết quả) |
| `soi → traitMul` | §18.2 | §5 (công thức `rate`) |
| `deTha → decay memory` | §18.4 | §4 · §12 |
| `thanThien → quan hệ + lan tin` | §18.5 | §4 · §12 |
| Quy tắc suy ra "nói thẳng / im lặng biến mất" | §9.3 | **§4** |
| Ba bucket quan hệ bất đối xứng | §18.4 | §4 |
| 5 kênh phản ứng, bảng chi phí/sức nặng | **§9.4** | §11 (gián tiếp) · T3 |
| 6 người phản ứng 6 kiểu với cùng một lỗi | **§9.3** | §3 · §9 |
| Nguyên tắc vàng "im lặng nguy hiểm hơn ồn ào" | **§9.3** cuối | §4 · §9 hàng 4 |
| Chị Lan biến mất 5 ngày | §9.3 bảng | §9 hàng 4 |
| Báo trước 3–4 ngày (XĐ3) | — | **§9** hàng 2 (arc chú Tư) · §13 ("khách ruột mất là mất thật") · T5 |
| Layered sprite 6×6×6 = 216 từ 18 file | §18.6 Đừng-4 | **§16 Đừng-4** |
| Rain World: node + spring/lerp, 0 sprite mới | §18.6 Đừng-4 | §16 Đừng-4 |
| Celeste: biến dạng 1–2 frame, một hàng pixel | §18.6 Đừng-4 | §16 Đừng-4 |
| 35% im lặng, 6 biến thể tối thiểu, leo thang | **§9.4** | §11 |
| Chống twinning 0,2–0,4s | §18.7 bonus | §11 |
| Mood ngoài tầm kiểm soát (mục 20) | **§9.2 nhóm D** | — (đề xuất bổ sung, mục 9) |
| Orkin: nói ra + một prop, không mô phỏng | §18.6 Đừng-1 | **§16 Đừng-1** |
| Ngẫu nhiên không đổi category/intensity | §18.6 Đừng-3 | §16 Đừng-3 |
| Chống rập khuôn từng nhân vật | **§19.5** | §9 (ghi chú từng hàng) |
| Ông Hải trước 10h | §19.5 | §9 hàng 6 |
| Cô Mai làm ăn được, "hẻm mà ai cũng nghèo là hẻm giả" | §19.5 | §9 hàng 7 |
| Chị Hạnh người Bắc bị chọc giọng | §19.5 | §9 hàng 9 |
| Anh Dũng xe ôm → Grab | §19.5 | §9 hàng 3 |
| Bà Bảy: cải lương + bất hoà 15 năm với cô Ba | §19.5 | §9 hàng 1 |
| Mốc tiến trình "nhà tui gần xe bánh mì cô Ba" | §19.2 | §9 hàng 11 · §14 |
| Giọng miền Nam, giữ đại từ xưng hô | §19.5 cuối | §2 · §14 |
| Người Việt cười người Việt | §19.4 | §14.1 |
| Trợ năng: giảm chuyển động, tắt âm báo tiêu cực | §20 | §15 |
| Duyệt loop từ phía sự kiện | §18.2 | §5 |
| 12 lỗ hổng ăn gian b, g, h, i, k | HT4 · §18.x | **§8** |

---

## 9. Đề xuất sửa CANON

**Đ1. Bổ sung `mood` vào CANON như một cơ chế có tên.**
CANON §11 có nhắc `Customer (archetype, **mood**, memory, visitCount)` trong scope blackboard, nhưng không có mục nào định nghĩa mood. idea.md §9.2 nhóm D (mục 20–24) là nguồn, và nó là **một trong những thứ phân biệt game này với mọi game nấu ăn khác**. Đề xuất thêm vào CANON §4 hoặc §12 một đoạn ngắn:

> **`mood` — độc lập với hành động người chơi.** Roll lúc spawn từ seed ngày. Đổi được: thoại, dáng, món gọi, tip, thứ tự đến, `npcPatience` khởi điểm. **Không** đổi: `traitMul`, `memory.intensity`, `salience`, và mọi hệ quả cơ học. Bắt buộc có **prop hình ảnh nhìn thấy từ xa ≥ 2s trước câu thoại đầu** (nguyên tắc Orkin, §16 Đừng-1).

**Đ2. Ghi rõ luật "báo trước 3–4 ngày" áp cho MỌI mất mát vĩnh viễn, không chỉ arc chú Tư.**
CANON §9 hàng 2 nói chú Tư *"biến mất ~ngày 30, có báo trước 3–4 ngày"*. Doc này áp cùng luật cho chị Lan (§4.6) vì cùng lý lẽ (T5: đọc được rủi ro **trước**; §13: mất khách ruột là mất thật). Đề xuất nâng thành luật chung ở §13:

> **Mọi mất mát vĩnh viễn phải có báo trước 3–4 ngày, bằng ít nhất 3 tín hiệu thuộc 3 kênh khác nhau, và phải có ít nhất một cửa sổ chuộc lỗi.**

**Đ3. Làm rõ hướng của `deTha` trong CANON §4.**
CANON §4 ghi `deTha: // 0..1 dễ bỏ qua ↔ để bụng → tốc độ decay của memory`. Mũi tên hai chiều không nói rõ `1.0` là đầu nào. Doc này đọc `deTha = 1.0` là **dễ tha, decay nhanh** (khớp CANON §9: bà Bảy `deTha 0.8` được mô tả là *"dễ tha"*, chú Tư `0.9` là người hiền nhất). Đề xuất sửa thành: `deTha: // 0=để bụng .. 1=dễ tha → nhân vào tốc độ decay của memory`.

**Đ4. Ghi nhận rằng ô "im lặng biến mất" (§2.3 ô 8) chỉ được có ĐÚNG MỘT người.**
Đây là phát hiện thiết kế của doc này, không có trong CANON. Nếu P4 (nội dung) thêm NPC mới rơi vào tổ hợp `soi cao / nongTinh thấp / deTha thấp / thanThien thấp`, cơ chế sẽ loãng và luật vàng mất tác dụng. Đề xuất thêm một dòng vào CANON §4:

> **Trong 12 NPC, tổ hợp "im lặng biến mất" chỉ được cấp cho đúng một người (chị Lan).** NPC thêm về sau phải tránh tổ hợp này.

**Đ5. (Ghi nhận, không đổi số)** CANON §9 hàng 6 mô tả ông Hải *"trước 10 giờ sáng rất tử tế"*. Doc này cài bằng `hour ∈ [0, 1000]` + `ctxHaiTinhTao` 3600s. Nếu playtest cho thấy người chơi **không bao giờ gặp ông Hải buổi sáng** (vì cao điểm 6h30–8h quá bận), thì thứ cần sửa là **lịch của ông**, không phải cơ chế — nếu không, nửa hay nhất của nhân vật này không ai thấy.
