# P2-08 — Việc cần làm: năm danh sách rút từ bản rà 1.534 nút

**Thuộc phase:** P2 · **Phụ thuộc:** `P2-07` (hợp đồng ba phần) · **Trạng thái:** đặc tả, **chưa code**
**Nguồn:** `docs/audit/thoai/*.md` — 15 file, 4.811 dòng, rà đủ 1.534 nút

---

## 0. Số liệu — cả kho, không sót nút nào

484 (bà Bảy · bé Su · chú Kiệt · qua đường · kho chung) + 459 (khách lạ · anh Dũng ·
bà Sáu · chú Tư) + 591 (cô Mai · thầy Phúc · chị Hạnh · ông Hải · anh Bảo · chị Lan)
= **1.534**, khớp đúng tổng đếm được từ JSON.

| phán | nút | % | nghĩa |
|---|---|---|---|
| `ĐÚNG` | **956** | 62,3% | đã neo đủ, hoặc là xã giao thuần không hứa gì |
| `SỬA` | **374** | 24,4% | thiếu `need` / `while` / `act` — sửa bằng **dữ liệu**, không cần code |
| `CẦN CODE` | **202** | 13,2% | neo đúng rồi nhưng hành động chưa tồn tại |
| `XOÁ` | **2** | 0,1% | hứa một chuyện không đáng làm |

> **Tin tốt bất ngờ: chỉ 2 nút đáng xoá.** Tôi đã dự là sẽ phải cắt nhiều. Nội dung viết
> chắc tay — vấn đề đúng như hợp đồng nói: **nó nói về một thế giới game chưa mô phỏng**.
> Nghĩa là phần lớn công nằm ở **xây thế giới cho kịp lời thoại**, không phải viết lại lời.

Và hai con số nói rõ khoảng cách: **47/1.534 nút có `act`** (3,1%), **13/1.534 có `while`**.

---

## 1. TÌNH HUỐNG CẦN SỬA

| # | Tình huống | Chỗ gãy | Nút | Sửa bằng |
|---|---|---|---|---|
| **1** | **`need` không đọc được sự thật thế giới** | `visibleOptions` chỉ tra `gate.flags` (cờ chuyện). Viết `need: "t.cutLine"` vào JSON là **ẩn mất nút vĩnh viễn**, im lặng | chặn **toàn bộ** 374 nút `SỬA` | CODE — việc đầu tiên, mọi thứ khác xếp sau |
| **2** | **Mời đứng cho mát mà không có chỗ đứng** | `w.shadeFree` vĩnh viễn `false`; họ gật xong đứng y chỗ cũ | 38 | ITEM (ô hóng mát) + ACT |
| **3** | **Buộc tội chen hàng mà họ không chen** | `t.cutLine` đã khai trong từ vựng, **không ai gán** | 5 | SỰ KIỆN |
| **4** | **Mời ăn / mời uống mà tay không có gì** | 13 nút đã gắn `while`, nhưng `p.holdsBread`/`p.hasTea` là sự thật **TĨNH** ⇒ theo §4.1 phải là `need` (ẩn hẳn), không phải "?" | 13 | sửa dữ liệu, sau khi có #1 |
| **5** | **Lời hứa không có hạn** | `PROMISE` chỉ treo *món kẹp vô ổ*, kiểm lúc đưa bánh. Hứa rót trà / bưng gánh / lấy giùm thì **không ai đòi** | 26 | ACT `PROMISE_DEED` |
| **6** | **"Đi học đi con" mà con bé không đi** | `WALK_ON` chưa có; riêng bé Su câu này xuất hiện **11 lần, không lần nào nó đi** | 56 | ACT |
| **7** | **Nhớ nhầm chuyện chưa từng xảy ra** | 26 chỗ nhắc lại một chuyện mà **cuộc nguồn không đặt cờ**. Hai chỗ sai chắc chắn: `tu.moiloi` mở ngày 5 / nguồn ngày 6; `dung.basau` mở ngày 12 / nguồn ngày 15 | 26 | sửa dữ liệu (thêm `flag` vào cuộc nguồn) |
| **8** | **`opener` của cuộc `PLAYER_ONLY` không bao giờ hiện** | 11 cuộc viết cây như câu trả lời cho một opener đã bị bỏ. Đây đúng là *"chính mình là người bắt chuyện trước"* | 11 cuộc | viết lại nhịp đầu |
| **9** | **Act gắn sai chiều** | `be-su` dùng `DISCOUNT` sau khi hoá đơn đã chốt (không bao giờ nổ) · `tu.quenvi` dùng `FREE_LOAF` cho **ghi nợ** · `chi-lan` mượn `REFUSE` ngược chiều 4 lần · `sau.ganh` dùng `STEP_ASIDE` để **dời một vật dưới đất** | 8 | sửa dữ liệu |
| **10** | **Giá viết cứng trong lời thoại** | `anh-bao` nói *"Hai ổ, bốn chục"* — `menu_k.dayDu = 32` nên đúng ra **64k** | 1 | sửa dữ liệu |
| **11** | **Câu làm quen lần đầu mở suốt 36 ngày** | `chi-hanh` 1.1.3 và 7.1 không có `minVisits` — vi phạm luật cứng §4ter | 2 | sửa dữ liệu |
| **12** | **`STEP_ASIDE` đã có code mà nội dung không gọi** | 39 chỗ nhắc tới việc dạt ra, chỉ vài chỗ gắn act | ~6 | sửa dữ liệu, **rẻ nhất bảng** |

---

## 2. HÀNH ĐỘNG CẦN CODE

Cột *nhắc* = số lần bản rà đòi tới nó.

### Nhóm A — chặn mọi thứ khác, làm trước

| Hành động | Mô tả |
|---|---|
| **`need` đi qua `holds()`** | Cho `need` đọc `p.* t.* w.* c.* v.* d.* m.*` thay vì chỉ cờ chuyện. **Không có cái này thì 374 nút `SỬA` không sửa được** |
| **`forSec` trên `TalkAct`** | `TalkAct` hiện không có trường thời lượng nào |
| **chuyển sự thật TĨNH sang `need`** | "?" đã chạy ở `chooseTalk`; còn thiếu bước phân loại §4.1 |

### Nhóm B — hành động thường gặp

| Hành động | Nhắc | Thời lượng | Thiếu gì |
|---|---|---|---|
| `GIVE_BREAD` | **60** | tới khi ăn xong (~20–30 s) | ổ rời `player.hand`; hiện chỉ `deliver()` làm được |
| `WALK_ON` | **56** | ngay | NPC đi tiếp, kết thúc cuộc |
| `STAND_IN_SHADE` + `LEAVE_SHADE` | **54** | 20–90 s, rồi **về đúng mục đích cũ** | cần ô bản đồ mới |
| `STEP_ASIDE` | 39 | tới khi tới lượt | **ĐÃ CÓ CODE** — chỉ cần gắn act |
| `OFFER_TEA` | **27** | ~8 s nhận/từ chối · hạn rót ~25 s | `serveTea`/`refuseTea` đã đủ; thiếu một `TalkAct` gọi vào + trừ ly thật |
| `PROMISE_DEED{việc, hạn}` | **26** | giây (trong buổi) hoặc ngày (qua đêm) | hạng mục lớn nhất — xem P2-07 §4bis |
| `THEY_SIT` / `SIT_DOWN` | 24 | tới khi phục vụ xong | `GHE_BAN` hiện **chỉ là hình vẽ**, không phải chỗ ngồi được |

### Nhóm C — riêng từng nhân vật

| Hành động | Của ai | Nhắc | Vì sao đáng |
|---|---|---|---|
| `FILM` / `STOP_FILM` | bé Su | 13 | quay phim là **lý do tồn tại** của nhân vật, có ở 4/9 cuộc |
| `MOVE_CART` | chú Kiệt | 11 | hai cái xe tranh chỗ là arc của ông |
| `CARRY_GANH` · `MOVE_GANH` · `HOLD_ITEM` | bà Sáu | 11 | cái gánh là **vật thể trung tâm** của nhân vật |
| `RAO` | bà Sáu dạy | 7 | ba mảnh đã có (`LOA_RAO`, `inviteChance`, cờ `sauRaoThu`), chưa ai nối |
| `BARTER` | bà Sáu | 5 | không act nào **nhận một món vào** |
| `LEND_ITEM` / `CLEAR_DEBT` | anh Dũng, chị Lan | 5 | arc áo mưa — *"arc đẹp nhất của anh Dũng và nó đang là sáu dòng chữ"* |
| `TAKE_CASH` | bé Su, thầy Phúc | 5 | `PAY` có chiều ra, **không có chiều vào** |
| `ORDER_CHANGE` | anh Bảo, chị Lan | 4 | sửa đơn từ một nút thoại |
| `MOVE_BOARD` / `MOVE_ICEBOX` | bà Bảy soi | 3 | trạm cố định, không có đường dời |
| `MOVE_BIKE` | anh Dũng | 2 | **không có khoá nào ghi "xe đang chắn quầy"** ⇒ câu buộc tội luôn nói bừa |
| `OVERHEARD_BY` | bà Sáu | 2 | `overhear.ts` có sẵn, hệ thoại chưa nối |
| `CREDIT_LOAF` | chú Tư | 3 | ghi nợ ≠ `FREE_LOAF` |

---

## 3. ITEM CẦN THÊM

| Item | Cho | Hiện trạng | Tạm làm bằng code |
|---|---|---|---|
| **Ô hóng mát** | 38 nút | **không có gì** — không ô bản đồ, không mái quán | một ô `world/map.ts` + hình chữ nhật mờ |
| **Ghế ngồi được** | 24 nút | `GHE_BAN` là **hình vẽ**, không phải chỗ ngồi | ô đứng + dáng ngồi |
| **Cái gánh tàu hũ** | bà Sáu, 11 nút | không tồn tại | prop + một ô nó chiếm |
| **Cái nồi tàu hũ gửi lại** | `sau.ganh` | cờ `sauGuiNoi` **đã đặt và đã được đọc**, mà cái nồi không có | prop đứng ở quầy tới khi bà quay lại |
| **Áo mưa** | anh Dũng, chị Lan | không có, không sổ mượn | item + cờ "đang mượn" |
| **Cuốn sổ ghi nợ** | cô Mai, thầy Phúc | `notebookEntries` đã có ở `arcs.ts:259` | nối vào |
| **Dáng giơ điện thoại** | bé Su | `MOOD_POSE` không có | thêm một `PoseId` |
| **Trà nóng** | anh Dũng, chị Lan (ngày mưa) | game chỉ có **trà đá** | hoặc thêm, hoặc **sửa lời thoại** |

---

## 4. SỰ KIỆN CẦN GHI LẠI

Đây là chỗ *"bà ấy có chen hàng thật đâu"* sống. Mỗi sự kiện là một sự thật game **phải
tự biết**, không phải một chữ trong thoại.

| Sự kiện | Khoá | Nút cần | Hiện trạng |
|---|---|---|---|
| Chen hàng | `t.cutLine` | 5 | **đã khai từ vựng, không ai gán** |
| Đứng chắn quầy | `t.blocking` | 5 | chưa có |
| Xe máy chắn lối | `t.bikeBlocking` | 2 | chưa có |
| Gánh để chắn | `t.ganhBlocking` | 2 | chưa có |
| Đang bấm điện thoại | `t.onPhone` | vài | chưa có |
| Đang ăn | `t.eating` | vài | chưa có |
| Đang ngó vào quầy | `t.lookingInside` | nhiều | **map từ `gazeState`, làm được ngay** |
| Đã kể chuyện X | `m.remembers(X)` | **26** | cuộc nguồn **không đặt cờ** — sửa dữ liệu |
| Đã mời trà trong lượt này | `v.gaveTea` | vài | tầng `v.*` chưa tồn tại |
| Đã gặp hôm nay | `d.metToday` | vài | tầng `d.*` chưa tồn tại |
| Nghe lỏm được | `OVERHEARD_BY` | 2 | `overhear.ts` có sẵn |

---

## 5. HỘI THOẠI CẦN BỔ SUNG

| Việc | Lượng | Vì sao |
|---|---|---|
| **Viết lại nhịp đầu 11 cuộc `PLAYER_ONLY`** | 11 cuộc | cây đang viết như câu trả lời cho một `opener` không bao giờ hiện |
| **Câu NHẮC lời hứa** (nấc 1) | ~26 | *"Ly trà con nói đó…"* — mỗi lời hứa cần một câu nhắc |
| **Câu NÓI NẶNG rồi bỏ đi** (nấc 2–3) | ~26 | theo tính cách: người nóng tính bỏ nấc một |
| **Câu đáp khi nuốt lời qua đêm** | ~10 | hứa hôm nay, mai họ nhắc |
| **Câu cho `?`** | 1 bộ nhỏ | *"Hả?"* · *"Gì?"* · *"…"* theo tính cách |
| **Thoại theo MỤC ĐÍCH** | mới | 60 mục đích đã có data, **chưa có câu nào dùng tới** — đây là chỗ rẻ nhất để thế giới dày lên |

---

## 6. THỨ TỰ ĐỀ NGHỊ

| Đợt | Việc | Mở khoá được gì |
|---|---|---|
| **1** | `need` qua `holds()` · `forSec` · chuyển TĨNH sang `need` | **374 nút `SỬA`** sửa được bằng dữ liệu |
| **2** | Gắn cờ cho 26 chỗ nhớ nhầm · gắn `STEP_ASIDE` · sửa 8 act sai chiều · sửa giá viết cứng | sửa thuần dữ liệu, **không cần code** |
| **3** | `GIVE_BREAD` · `OFFER_TEA` · `WALK_ON` | 143 nút |
| **4** | Ô hóng mát + `STAND_IN_SHADE`/`LEAVE_SHADE` · ghế ngồi được + `THEY_SIT` | 62 nút |
| **5** | `PROMISE_DEED` + chỉ báo lời hứa đang treo + ba nấc nuốt lời | 26 nút, và nó là thứ chủ dự án hỏi trực tiếp |
| **6** | Sự kiện (`t.cutLine`, `t.blocking`, `t.onPhone`…) | ~20 nút, chữa hẳn loại "nói bừa" |
| **7** | Hành động riêng từng nhân vật (gánh, áo mưa, quay phim, xe chú Kiệt) | ~50 nút, và là chỗ nhân vật thành người |

---

## 7. BA CHỖ BẢN RÀ KẾT LUẬN SAI — đã kiểm lại

Ghi để không ai đi sửa một thứ đang đúng. Chi tiết ở `P2-07` §6bis.

1. **`kiet.bienhieu` KHÔNG thiếu `needEquip`** — xe có bảng đỏ chữ vàng từ ngày đầu
   (`art/sign.ts:9`, `StallScene:848` gọi vô điều kiện); `BANG_HIEU` chỉ là bản nâng cấp.
2. **`p.hasTea` là khoá CÓ THẬT** — lỗi là tôi quên ghi nó vào bảng §3.1, không phải khoá sai.
3. **`while` CÓ chạy** — qua `peek()` + `allHold()` trong `chooseTalk`, đúng thiết kế §4
   (ra "?" lúc bấm, không ẩn ở `visibleOptions`). Hai bản rà báo "chưa chạy" vì đọc doc
   chứ không đọc code.
