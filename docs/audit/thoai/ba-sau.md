# Rà thoại — `src/content/talks/ba-sau.json`

> ## ⚡ REVAMP 2026-10-20 — ☠️ CHẾT TOÀN BỘ
> Rà thoại theo giọng cũ + hệ trí nhớ/quan hệ đã chết. Toàn bộ thoại viết lại giọng Nam gen Z ở R6 (CANON §9, §17.1). Chỉ giữ để truy vết nội dung cũ.

**Hợp đồng:** `docs/phase-2-he-npc/P2-07-neo-thoai-vao-the-gioi.md` · **8 cuộc · 111 nút**

Bà Sáu — gánh tàu hũ nước đường, NPC **có tên** (`kindOf` → `CHUYEN`). Bà **không phải khách
thường**: bà là người bán hàng rong **ghé ngang**, đặt gánh xuống, đổi chác, rồi đi tiếp.
Gần nửa file nói về **cái gánh** và **việc đổi đồ ăn lấy ổ bánh** — hai thứ game không mô phỏng.

---

## 0. Đọc trước khi đọc bảng

Trạng thái code lúc rà (bản đầy đủ ở `docs/audit/thoai/walkin.md` §0):

1. **`while` đã chạy thật** (`TalkNode.while` → `snapshot()` → `allHold()` → `"?"` + `rel −1`).
   File này có **đúng 1 nút khai `while`**: `sau.ganh` 1.2 (`p.hasTea`, vừa thêm giữa lúc rà).
2. **`need` chưa đi qua `holds()`** — vẫn chỉ tra cờ chuyện. File này dùng `need` **đúng** ở
   3 nút: `xetai` 2.2 (`dungNhoNoi`) · `xetai` 2.3 (`dungHoiSau`) · `chonmoi` ket:2 (`sauGuiNoi`)
   · ket:3 (`sauDongHo`).
3. `t.cutLine` · `t.inShade` · `w.shadeFree` · `t.purpose/state` **khai rồi mà vĩnh viễn `false`**.
4. `TalkAct` 7 loại, **không có `forSec`**. `GIVE_BREAD` · `OFFER_TEA` · `WALK_ON` chưa có.

Cột `need` / `while` dưới đây **đã xếp theo §4.1**: TĨNH → `need` (ẩn hẳn) · ĐỘNG → `while`
(ra `?`). Xem §4 cuối file.

**Quy ước phán:** `SỬA` = chữa được bằng JSON (khoá/act đã có) · `CẦN CODE` = phải viết thêm
act/khoá/đạo cụ · `ĐÚNG` = xã giao hoặc câu hỏi thuần, không hứa gì không khẳng định gì ·
`XOÁ` = hứa chuyện không làm được và không đáng làm. Nhánh cha đã bảo đảm điều kiện thì con
không khai lại `need`.

**Ba điểm riêng của file này:**

* **(S-1) BÀ SÁU LÀ FILE GIÀU CỜ NHẤT, VÀ LÀ MẪU ĐÚNG.** Bảy `flag` được đặt (`sauMangDung`,
  `sauNhoNoi`, `sauGuiNoi`, `sauDongHo`, `sauRaoThu`) và **bốn trong số đó được đọc lại bằng
  `need` ở cuộc khác** — trong `anh-dung.json` và trong chính `sau.chonmoi`. Đây là **vòng arc
  khép kín duy nhất trong cả bốn file**. Mọi đề xuất bên dưới chỉ là nhân cái mẫu này ra.
* **(S-2) "CÁI GÁNH" LÀ MỘT VẬT THỂ KHÔNG TỒN TẠI.** Bảy nút nói về việc **bưng nó, để nó
  xuống, gửi lại một nồi, dời nó khỏi lối đi**. Không có đạo cụ gánh, không có ô nào nó chiếm,
  không có trạng thái "gánh đang chắn đường". Và `sau.ganh` 3 — *"bà để gánh chỗ khác giùm
  con, khách con hổng đi qua được bà"* — là **"chị chen hàng" đội lốt cái gánh**: buộc tội
  bằng `rel −4 · anger 20 · RUDE_TO_THEM 55` mà **không ai kiểm cái gánh đang nằm ở đâu**.
* **(S-3) CỬA SỔ NHỚ NHẦM 9 NGÀY.** `sau.xetai` (chuyện bà lái xe tải) mở từ **ngày 15**,
  nhưng `sau.ganh` 2.2, `sau.omcua` và `dung.basau` 1.1 cho người chơi **gọi tên chuyện đó từ
  ngày 6**. Và `sau.xetai` **không đặt một cái cờ nào**, nên kể cả khi `need` chạy được cũng
  chưa có gì để đọc. Xem §6.

---

### sau.doi — đổi chén tàu hũ lấy ổ bánh (14 nút)
`NPC_ONLY · SHORT · day 3–34` · opener *"Đổi hôn con? Chén tàu hũ lấy ổ bánh không."*

> **Cả cuộc là một vụ ĐỔI CHÁC, và không một nút nào có `act`.** Ổ bánh không rời tay, chén
> tàu hũ không tới tay, két không nhúc nhích — rồi hai bên nói *"ai cũng no"*.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Dạ được bà. Bà múc con một chén." | `p.holdsFilled` | — | `BARTER(o-banh ↔ chen-tau-hu)` · ngay — ổ rời tay, chén vào kho | **CẦN CODE**: `rel +3` cho một vụ đổi chác **không có gì đổi**. Không act nào trong `TalkAct` làm được chuyện nhận một món vào |
| 1.1 | "Ba giờ sáng lận hả bà?" | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.1 | "Bà làm cái gì cũng kỹ ha bà." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.2 | "Bà dạy con nấu với bà." | (nhánh cha) | — | `flag: sauDayNau` | **SỬA**: bà đáp *"Thôi để tui chỉ"* — **một lời hứa của NPC cho ngày khác** mà không cờ nào ghi; mai không ai nhắc |
| 1.1.3 | "Ba giờ sáng bà dậy nổi hả bà?" | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.4 | "Bà cực quá bà ơi." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.2 | "Đổi vầy bà có lỗ hông bà?" → `ref: ket` | — | — | — | **ĐÚNG** |
| 1.3 | "Dạ bà cầm ổ đầy đủ đi bà." | `p.holdsFilled` | — | `GIVE_BREAD` + `FREE_LOAF` · ngay **+** `flag: sauNoNuaChen` | **CẦN CODE**: cho hẳn một ổ đầy đủ, `rel +3 · CARED 45`, **không mất một đồng nào**. Bà còn đáp *"vậy tui nợ con nửa chén nghen"* — một món nợ không ai ghi |
| 2 | "Dạ thôi bà, con lấy tiền thôi bà." | — | `t.ordering` | `COLLECT(priceOf)` | **SỬA**: bà đáp *"Tui gửi con **hai chục**"* — **hard-code giá** trong khi `econ.priceOf(g, day)` đổi theo ngày |
| 2.1 | "Mà thôi bà. Đổi đi bà, cho vui." | `p.holdsFilled` | — | `BARTER` · ngay | **CẦN CODE**: như nút 1 |
| 2.2 | "Dạ hai chục bà." | — | `t.ordering` | `COLLECT(priceOf)` | **SỬA**: hard-code giá |
| 3 | "Bà hỏi hoài vậy bà. Con hổng đổi đâu." | **`m.remembers(sauDoi) >= 2`** | — | — | **SỬA**: ***họ hàng của "chị chen hàng"*** — *"bà hỏi hoài"* ném ra với `rel −5 · anger 25 · RUDE 60` **ngay lần bà hỏi đầu tiên** |
| ket:1 | "Bà đi mạnh giỏi nghen bà." | — | — | — | **ĐÚNG** |
| ket:2 | "Dạ bà đi hen." | — | — | — | **ĐÚNG** |

---

### sau.xetai — hồi xưa bà chạy xe tải (16 nút)
`NPC_ONLY · SHORT · day 15–34 · minVisits 5 · initiates 0,25` · có `ignore` ✓

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Thiệt hả bà? Bà chạy tuyến nào bà?" | — | — | **`flag: sauXeTai`** | **SỬA**: ***nút quan trọng nhất file***. Đây là **nguồn duy nhất** của chuyện bà lái xe tải, và nó **không đặt cờ**. Ba nút ở ba cuộc khác (`sau.ganh` 2.2 · `sau.moiloi2` 2 · `dung.basau` 1.1) nhắc lại chuyện này mà **không có gì để kiểm** |
| 1.1 | "Sao bà nghỉ chạy vậy bà?" | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.1 | "Bà tiếc hông bà?" | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.2 | "Vậy giờ bà gánh còn nặng hơn lái xe nữa bà." | (nhánh cha) | — | — | **ĐÚNG** (`CARED 50`) |
| 1.1.3 | "Bà kể con nghe chuyện đường trường đi bà." → `ref: ket` | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.4 | "Chuyện xưa rồi bà ơi." | (nhánh cha) | — | — | **ĐÚNG** (`rel −3`, im lặng — có giá thật) |
| 1.2 | "Hồi đó phụ nữ lái xe tải hiếm lắm hả bà?" → `ref: ket` | — | — | — | **ĐÚNG** |
| 1.3 | "Bà nói dóc hoài bà ơi." | **`m.remembers(sauKeChuyen) >= 2`** | — | `flag: sauHuaKhoeBang` | **SỬA**: hai lỗi trong một nút — *"nói dóc **hoài**"* buộc tội thói quen ngay lần đầu; và bà đáp *"Mai tui đem ra tui cho con coi"* — **lời hứa của NPC** không cờ nào ghi |
| 2 | "Hèn gì bà hay chê anh Dũng ôm cua." | **`m.remembers(sauMangDung)`** | — | — | **SỬA**: ***cờ `sauMangDung` ĐÃ TỒN TẠI*** (`sau.omcua` 1 đặt nó, ngày 10+) mà nút này **không gắn `need`**. Sửa chỗ này tốn đúng một dòng JSON |
| 2.1 | "Bà nói nó đi bà, nó nghe bà á." | (nhánh cha) | — | — | **ĐÚNG** |
| 2.2 | "Ảnh nhờ con nói với bà là ảnh hổng có ý gì đâu bà." | `dungNhoNoi` ✓ | — | — | **ĐÚNG** — mẫu chuẩn. (Xem §5.2: đây là nhánh **giữ lời**; nhánh **nuốt lời** chưa có) |
| 2.3 | "Ảnh có qua hỏi bà chuyện vô cua hông bà?" | `dungHoiSau` ✓ | — | — | **ĐÚNG** — mẫu chuẩn |
| 2.4 | "Bà rành ghê bà." → `ref: ket` | (nhánh cha) | — | — | **ĐÚNG** |
| 3 | "Dạ con đang bận bà ơi." | — | `w.queue >= 1` | — | **SỬA**: *"đang bận"* nói giữa hẻm trống |
| ket:1 | "Bữa nào bà kể tiếp nghen bà." | — | — | `flag: sauKeTiep` | **SỬA**: hẹn một chuyện cho ngày khác, không cờ nào nhận |
| ket:2 | "Dạ hay quá bà." | — | — | — | **ĐÚNG** |

---

### sau.omcua — bà chê anh Dũng ôm cua (19 nút)
`NPC_ONLY · SHORT · day 10–34` · opener *"Con biết thằng chạy xe ôm áo xanh hông?"*

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Anh Dũng đó hả bà? Sao bà biết hay vậy bà?" | **`m.remembers(dungQuen)`** | — | `flag: sauMangDung` ✓ | **SỬA**: bà chỉ nói *"thằng chạy xe ôm áo xanh"*; người chơi **gọi đúng tên anh Dũng** mà không ai kiểm đã quen anh chưa. Phần `flag` thì **đúng mẫu** |
| 1.1 | "Nó sai chỗ nào hả bà?" | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.1 | "Để con nói lại với ảnh nghen bà." | (nhánh cha) | — | `flag: sauNhoNoi` ✓ **+ hạn: lần ghé sau của anh Dũng** | **SỬA**: ***đúng câu "hứa làm giùm" mà chủ dự án chỉ***. Cờ có rồi, `dung.basau` 3.2 đọc lại rồi — **nhưng không có hạn và không có đường NUỐT LỜI**. Hứa xong không bao giờ nói thì bà vẫn quý mình y nguyên (xem §5.2) |
| 1.1.2 | "Bà nói thẳng với ảnh đi bà." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.3 | "Bà rành ghê bà. Bà làm thầy dạy lái được luôn." | (nhánh cha) | — | — | **ĐÚNG** — nhánh cha đã lộ chuyện bà lái xe (*"Tui chạy xe tải ba năm"*), nên đây **không** phải nhớ nhầm |
| 1.1.4 | "Dạ chuyện của ảnh mà bà." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.2 | "Bà ngó người ta chạy xe chi vậy bà?" → `ref: ket` | — | — | — | **ĐÚNG** |
| 1.3 | "Dạ con hổng dám nói ảnh đâu bà." → `ref: ket` | — | — | — | **ĐÚNG** |
| 2 | "Bà ơi, mấy thằng nhỏ chạy app nó gấp lắm bà." | — | — | — | **ĐÚNG** (hiểu biết chung, không phải chuyện riêng ai) |
| 2.1 | "Câu đó nghe hay ghê bà." | (nhánh cha) | — | — | **ĐÚNG** (`REMEMBERED_STORY 45`) |
| 2.1.1 | "Bà kể con nghe về chú đó đi bà." | (nhánh cha) | — | — | **ĐÚNG** |
| 2.1.2 | "Vậy bà truyền lại cho thằng nhỏ đi bà." | (nhánh cha) | — | `flag: sauSeDayDung` | **SỬA**: bà đáp *"Ờ ha. Tui hổng nghĩ ra"* = bà sẽ làm. Không cờ, nên **bà không bao giờ làm** |
| 2.1.3 | "Dạ." (im) | — | — | — | **ĐÚNG** |
| 2.2 | "Bà chạy xe tải thiệt hả bà? Con hổng tin nổi." → `ref: ket` | (nhánh cha) | — | — | **ĐÚNG** |
| 2.3 | "Dạ." (im) | — | — | — | **ĐÚNG** |
| 3 | "Bà lo chuyện người ta chi bà, bà đi bán đi bà." | — | — | `WALK_ON` · ngay | **CẦN CODE**: `rel −5 · anger 30 · RUDE 65`, bà đáp *"Ừ. Tui đi."* rồi **đứng y chỗ cũ**. Bà không phải khách nên `REFUSE` (gọi `leave(c,"refused")`) là sai nghĩa — cần `WALK_ON` |
| ket:1 | "Bà đi tiếp nghen bà. Nắng rồi đó bà." | — | `w.hot` | — | **SỬA**: *"nắng rồi đó bà"* nói giữa cơn mưa |
| ket:2 | "Dạ con nghe rồi bà." | — | — | — | **ĐÚNG** |
| ket:3 | "Dạ." (im) | — | — | — | **ĐÚNG** |

---

### sau.ganh — gánh nặng, vai đau (20 nút)
`NPC_ONLY · FULL · day 6–34` · opener *"Con ơi… tui để gánh xuống đây chút nghen. Vai tui nó cứng ngắc."*

> **Cuộc được hợp đồng lấy làm ví dụ ở §6** (*"Bà ngồi cái ghế này đi bà"* →
> `THEY_SIT · tới khi phục vụ xong`). Rà ra: ngoài cái ghế còn **bốn hành động thể chất
> khác** cũng không có act nào — bưng gánh, giữ hộ một nồi, rót trà, dời gánh.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Bà ngồi cái ghế này đi bà. Con bưng gánh vô cho." `needEquip: GHE_BAN` ✓ | `p.handsEmpty` | ghế trống | `SIT_DOWN` · tới khi phục vụ xong **+** `CARRY_GANH` · ~15 s | **CẦN CODE**: `needEquip` **đúng** (đây là một trong tám chỗ `talk.ts` nói tới). Nhưng `rel +4 · calm 28 · CARED 55` cho **hai hành động thể chất không xảy ra**: bà không ngồi, cái gánh không nhúc nhích |
| 1.1 | "Nặng thiệt bà ơi. Bà gánh cái này đi cả buổi hả bà?" | (nhánh cha) | — | — | **ĐÚNG** (nhánh cha đã bưng gánh) |
| 1.1.1 | "Bà bớt một nồi đi bà. Nhẹ chút cũng được mà." | (nhánh cha) | — | — | **ĐÚNG** (bà từ chối — không nợ act) |
| 1.1.2 | "Vậy bà để một nồi ở đây, chút bà quay lại lấy." | (nhánh cha) | — | `HOLD_ITEM(noi-tau-hu)` · tới khi bà quay lại **+** `flag: sauGuiNoi` ✓ | **CẦN CODE**: `rel +4 · CARED 60`, cờ đặt đúng và `sau.chonmoi` ket:2 đọc lại ✓ — **nhưng cái nồi không hiện ra ở quầy, không chiếm chỗ, và bà KHÔNG BAO GIỜ quay lại lấy** |
| 1.1.3 | "Hai mươi ký mà bà đi được, bà ngon hơn con." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.4 | "Dạ." (im) | — | — | — | **ĐÚNG** |
| 1.2 | "Bà ngồi đi bà, con rót bà ly trà đá." | ✅ `p.hasTea` **đã có** (nhưng đang khai dạng `while` — §4.1 xếp nó là **TĨNH**, phải đổi sang `need`) | ghế trống | `OFFER_TEA` · ~8 s | **CẦN CODE**: nút **duy nhất của file đã khai `while`**. Vẫn **không gọi `serveTea()`** nên `teaLeft` không trừ, `TEA_COST` không tốn, và bà **không có quyền từ chối** (`refuseTea` nằm không) |
| 1.3 | "Dạ bà ngồi lẹ rồi đi nghen bà, con còn bán." | — | `w.queue >= 1` | — | **SỬA**: *"con còn bán"* nói lúc không có ai |
| 2 | "Vai bà đau lâu chưa bà?" | — | — | — | **ĐÚNG** |
| 2.1 | "Bà đổi vai qua lại đi bà." | (nhánh cha) | — | — | **ĐÚNG** |
| 2.1.1 | "Bà đi khám đi bà. Con thấy bà đi hơi xiêu đó." | **`p.sawSauXieu`** | — | — | **SỬA**: khẳng định **chính mình đã nhìn thấy** dáng đi xiêu của bà — game chưa bao giờ vẽ ra chuyện đó. Cùng họ với `dung.basau` 1.2 |
| 2.1.2 | "Bà dán miếng dán nóng đi bà, rẻ mà đỡ lắm." | (nhánh cha) | — | — | **ĐÚNG** |
| 2.1.3 | "Dạ bà ráng đi bà." (im) | (nhánh cha) | — | — | **ĐÚNG** |
| 2.2 | "Sao hồi đó bà bỏ lái xe vậy bà?" → `ref: ket` | **`m.remembers(sauXeTai)`** | — | — | **SỬA**: ***cửa sổ nhớ nhầm 9 ngày*** — cuộc này mở **ngày 6**, `sau.xetai` mở **ngày 15**. Từ ngày 6 tới 14, người chơi hỏi về một quá khứ **chưa ai kể** (S-3) |
| 2.3 | "Dạ." (im) | — | — | — | **ĐÚNG** |
| 3 | "Dạ bà để gánh chỗ khác giùm con, khách con hổng đi qua được bà." `act: STEP_ASIDE` | **`t.ganhBlocking`** | `w.queue >= 1` | `MOVE_GANH` · tới hết lượt ghé | **CẦN CODE**: ***"chị chen hàng" đội lốt cái gánh*** — `rel −4 · anger 20 · RUDE 55` ném ra mà **không ai kiểm cái gánh đang nằm đâu**. Và `STEP_ASIDE` **gắn sai nghĩa**: `askStepAside` gọi `yieldSlot()` = đẩy bà xuống sau trong **hàng đợi**, không phải dời cái gánh khỏi **lối đi** |
| 4 | "Bà để con bưng gánh vô trong cho. Bà đứng nghỉ tay chút." | `p.handsEmpty` | — | `CARRY_GANH` · ~15 s, rồi gánh **nằm ở quầy** tới khi bà đi | **CẦN CODE**: bà đáp *"Nhẹ cả vai"* — và cái gánh ở nguyên chỗ cũ |
| ket:1 | "Bà nghỉ đủ rồi hẵng đi nghen bà." | — | — | — | **ĐÚNG** |
| ket:2 | "Dạ bà cứ để đó bà." | — | — | `HOLD_ITEM(ganh)` · tới khi bà đi | **CẦN CODE**: *"cứ để đó"* — để đâu? |
| ket:3 | "Dạ." (im) | — | — | — | **ĐÚNG** |

---

### sau.rao — bà dạy rao (19 nút)
`NPC_ONLY · SHORT · day 5–34` · opener *"Con bán mà con hổng rao. Người ta đi ngang đâu có biết con ơi."*

> **Lỗi cấp CUỘC:** bà mắng người chơi không chịu rao — nhưng `when` không có `notFlag`.
> Rao thử rồi (`sauRaoThu`), hay đã mua `LOA_RAO`, thì câu mở lời này vẫn nổ y nguyên.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Dạ con rao con mắc cỡ lắm bà." | — | — | — | **ĐÚNG** |
| 1.1 | "Bà dạy con rao đi bà." | — | — | — | **ĐÚNG** (`rel +4 · CARED 55`) |
| 1.1.1 | **"Bánh mì nóng hông…"** | (nhánh cha) | — | `RAO` · ~5 s — người đi ngang trong tầm **ngoái nhìn** (`pass.stay`), `inviteChance` nhích lên **+** `flag: sauRaoThu` ✓ | **CẦN CODE**: ***người chơi RAO THẬT và không ai nghe thấy***. `LOA_RAO` là thiết bị mua được **đã có trong `equipment.ts`**, `inviteChance` và `pass.stay` **đã có trong `passersby.ts`** — thiếu đúng cái act nối hai đầu lại |
| 1.1.2 | "Dạ thôi bà. Con rao con quê chết." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.3 | "Bà rao cho con nghe lại đi bà." | (nhánh cha) | — | `RAO(bà)` · ~5 s | **CẦN CODE**: tiếng rao của bà — thứ cả nút 2 gọi là *"đồng hồ của cả hẻm"* — vang lên giữa quầy mà không người đi ngang nào ngoái lại |
| 1.1.4 | "Dạ con hổng rao đâu bà." | (nhánh cha) | — | — | **ĐÚNG** (`rel −2`) |
| 1.2 | "Hồi đó bà run thiệt hả bà?" → `ref: ket` | — | — | — | **ĐÚNG** |
| 1.3 | "Bà rao giùm con luôn đi bà, con trả công bà." | — | — | — | **ĐÚNG** — bà **từ chối** bằng một câu giỡn, nên câu mời không nợ thế giới hành động nào. Cách viết đúng (giống `dung.congai` 3.1) |
| 2 | "Dạ tiếng rao của bà là đồng hồ của cả hẻm đó bà." | **`d.heardSauRao`** | — | — | **SỬA**: `rel +4 · CARED 60` cho một câu khen về tiếng rao mà **người chơi có thể chưa nghe lần nào** |
| 2.1 | "Dạ thiệt. Nghe bà rao là con biết **tám giờ rưỡi** rồi bà." | `d.heardSauRao` | — | `flag: sauDongHo` ✓ | **SỬA**: **hard-code giờ**. `sim/schedule.ts` quyết bà đi ngang lúc nào; nếu lịch đổi thì câu này thành sai, và nó là **nền của cả nhánh `chonmoi` ket:3** |
| 2.1.1 | "Bữa nào bà nghỉ là con mất giờ luôn đó bà." | (nhánh cha) | — | — | **ĐÚNG** |
| 2.1.2 | "Bà đi ngang là con yên tâm á bà." | (nhánh cha) | — | — | **ĐÚNG** (`rel +4 · CARED 55 · RUNG_RUNG`) |
| 2.1.3 | "Dạ con nói vậy thôi bà." | (nhánh cha) | — | — | **ĐÚNG** |
| 2.2 | "Dạ cả hẻm ai cũng biết tiếng bà hết bà." → `ref: ket` | (nhánh cha) | — | — | **ĐÚNG** |
| 2.3 | "Dạ." (im) | — | — | — | **ĐÚNG** |
| 3 | "Bà lo bán của bà đi bà, con bán kiểu con." | — | — | `WALK_ON` · ngay | **CẦN CODE**: `rel −5 · anger 30 · RUDE 65`, bà đáp *"Tui đi"* và **không đi** |
| ket:1 | "Dạ con cảm ơn bà nghen bà." | — | — | — | **ĐÚNG** |
| ket:2 | "Dạ để con tính bà." | `t.hasOrder` | — | `COLLECT(priceOf)` | **SỬA**: tính tiền một người chưa gọi món |
| ket:3 | "Dạ." (im) | — | — | — | **ĐÚNG** |

---

### sau.chonmoi — bà sắp nghỉ gánh, ra chợ ngồi (17 nút)
`NPC_ONLY · SHORT · day 28–34 · minVisits 6 · initiates 0,22` · có `ignore` ✓

> Cuộc **neo tốt nhất cả bốn file**: `minVisits 6` khoá đúng, ba nhánh kết đọc lại ba cờ đã
> đặt từ các cuộc trước. Chỗ thủng duy nhất là **lời hứa lớn nhất của cả game** ở nút 1.1.1.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Ủa sao vậy bà? Bà bệnh hả bà?" | — | — | — | **ĐÚNG** |
| 1.1 | "Vậy là mừng mà bà. Sao bà nói nghe buồn buồn vậy bà?" | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.1 | "Vậy con đi bộ ra chợ mua bà vậy." | (nhánh cha) | — | `PROMISE_TRIP(cho, hiên nhà thuốc)` · **kiểm mỗi sáng từ ngày bà đi** | **CẦN CODE**: ***lời hứa cho ngày khác lớn nhất cả bốn file*** — `rel +4 · CARED 65`, bà rưng rưng. Người chơi **đã đi chợ mỗi sáng thật** (`EconToday.market`, `sim/suppliers.ts`), nên chuyện này **dựng được**; hiện nó bốc hơi sạch sau ngày 34 |
| 1.1.2 | "Ngồi một chỗ đỡ cái vai bà lắm đó bà." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.1.3 | "Bà đi rồi hẻm này thiếu tiếng rao bà ơi." | **`m.remembers(sauRao)`** | — | — | **SỬA**: `rel +4 · CARED 60` cho một câu tiếc tiếng rao mà người chơi có thể chưa từng nghe |
| 1.1.4 | "Dạ bà đi cũng phải bà. Bà lớn tuổi rồi." | (nhánh cha) | — | — | **ĐÚNG** |
| 1.2 | "Chừng nào bà ra ngoài đó hả bà?" → `ref: ket` | — | — | — | **ĐÚNG** |
| 1.3 | "Dạ bà ngồi chỗ nào ngoài chợ hả bà?" → `ref: ket` | — | — | `flag: sauChoNgoi` | **CẦN CODE**: bà chỉ đường rất cụ thể (*"hiên nhà thuốc, phía cổng sau"*) tới một chỗ **không có trên bản đồ**. Cùng gốc với 1.1.1 |
| 2 | "Dạ bà nói con trước làm chi bà. Bà cứ đi, con hiểu mà." | — | — | — | **ĐÚNG** |
| 2.1 | "Bà nghĩ tới cả cái đó nữa hả bà." | (nhánh cha) | — | — | **ĐÚNG** (`REMEMBERED_STORY 60`) |
| 2.2 | "Dạ con cảm ơn bà nghen bà." | (nhánh cha) | — | — | **ĐÚNG** |
| 2.3 | "Dạ." (im) | — | — | — | **ĐÚNG** |
| 3 | "Dạ vậy thôi bà. Ai rồi cũng đi hết mà bà." | — | — | — | **ĐÚNG** (`rel −4 · RUDE 55` — câu lạnh có giá thật) |
| ket:1 | "Bà nhớ ghé con nghen bà. Bà hứa nghen." | — | — | `flag: sauHuaGhe` **+ bà phải ghé thật ≥ 1 lần sau ngày 34** | **CẦN CODE**: ***bà HỨA***, nguyên văn *"Tui có hứa với ai bao giờ đâu, mà tui hứa với con."* `rel +4 · CARED 65` — rồi **không bao giờ ghé**, và người chơi không bao giờ biết bà đã nuốt lời hay chưa |
| ket:2 | "Nồi bà gửi bên con, mai bà còn gửi nữa hông bà?" | `sauGuiNoi` ✓ | — | — | **ĐÚNG** — mẫu chuẩn, và là chỗ **hay nhất** cả file: một cái nồi gửi ngày thứ 6 được nhắc lại ở ngày thứ 28 |
| ket:3 | "Bà đi rồi tám giờ rưỡi hẻm này im re đó bà." | `sauDongHo` ✓ | — | — | **ĐÚNG** — mẫu chuẩn |
| ket:4 | "Dạ con mừng cho bà bà." | — | — | — | **ĐÚNG** |

---

### sau.moiloi — người chơi bắt chuyện (3 nút)
`PLAYER_ONLY · SHORT · day 4–34` · opener *"Ờ. Con kêu tui hả con."* — **opener này không bao
giờ hiện**: `openTalk()` khi người chơi mở lời trả `talkView("")`

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Gánh nặng hông bà? Để con khiêng xuống cho." | `p.handsEmpty` | — | `CARRY_GANH` · ~15 s | **CẦN CODE**: bà nhận lời (*"Nhẹ cả vai luôn"*) và cái gánh không nhúc nhích (S-2) |
| 2 | "Bà nghỉ chưa bà? Nãy giờ con thấy bà đi hoài." | **`d.sawSauPass(2)`** | — | — | **SỬA**: *"nãy giờ con thấy bà đi hoài"* — khẳng định đã thấy bà qua lại nhiều lần hôm nay; không tầng `d.*` nào ghi chuyện đó |
| 3 | "Thôi bà. Con hỏi cho có." | — | — | — | **ĐÚNG** |

---

### sau.moiloi2 — hỏi thăm ngắn (3 nút)
`PLAYER_ONLY · SHORT · day 16–34 · minVisits 5` · opener **không bao giờ hiện**

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1 | "Bà đổi con chén tàu hũ lấy ổ bánh hông bà?" | `p.holdsFilled` | — | `BARTER(o-banh ↔ chen-tau-hu)` · ngay | **CẦN CODE**: y hệt `sau.doi` 1 |
| 2 | "Hồi xưa bà cầm vô lăng, giờ bà gánh. Bà hổng tiếc hả bà?" | **`m.remembers(sauXeTai)`** | — | — | **SỬA**: cuộc này mở ngày **16**, `sau.xetai` mở ngày **15** với cùng `minVisits 5` — nên **ngày 16 người chơi gọi được "hồi xưa bà cầm vô lăng" mà chưa chắc đã nghe** (S-3) |
| 3 | "Thôi bà. Con bận." | — | `w.queue >= 1` | — | **SỬA**: *"con bận"* giữa hẻm trống |

---

## 1. Thống kê

| | số nút |
|---|---|
| **Tổng** | **111** |
| `ĐÚNG` | 70 |
| `SỬA` | 23 |
| `CẦN CODE` | 18 |
| `XOÁ` | 0 |

Bốn con số:

* **1/111 nút có `while`** (`ganh` 1.2) — và nó đang xếp nhầm nhóm (`p.hasTea` là TĨNH, phải
  là `need`).
* **4/111 nút có `need` chạy được** — nhiều nhất cả bốn file, và cả bốn đều đúng mẫu.
* **7 nút đặt `flag`** — cũng nhiều nhất. **Nhưng cuộc quan trọng nhất (`sau.xetai`) thì
  không đặt cờ nào**, và đó là gốc của cả ba lỗi nhớ nhầm trong file.
* **1/111 nút có `act`** — `ganh` 3, và nó là act **gắn sai nghĩa** (`STEP_ASIDE` cho một cái
  gánh nằm dưới đất).

Tỉ lệ `ĐÚNG` cao nhất cả bốn file (63%) là **thật**: bà Sáu là nhân vật được viết chắc tay
nhất, phần lớn nút là nghe bà kể chuyện. Nhưng **mọi chỗ bà ĐƯA hoặc NHẬN một cái gì** —
chén tàu hũ, ổ bánh, cái nồi, cái gánh, ly trà, tiếng rao — **đều là free word, không trừ**.

---

## 2. Đề xuất khoá mới

| khoá | vì sao cần | nút nào đòi |
|---|---|---|
| `m.remembers(E)` **chạy được** | bảy nút nhắc lại chuyện người chơi chưa chắc đã nghe; và `sau.xetai` — nguồn của ba trong bảy — **không đặt cờ**. Phải sửa cả hai đầu | xetai 2 · 1.3 · ganh 2.2 · moiloi2 2 · chonmoi 1.1.3 · omcua 1 · doi 3 |
| `t.ganhBlocking` | *"bà để gánh chỗ khác giùm con"* — buộc tội cái gánh chắn lối mà không ai biết nó ở đâu | ganh 3 |
| `p.sawSauXieu` | *"con thấy bà đi hơi xiêu đó"* — khẳng định chính mình đã nhìn thấy | ganh 2.1.1 |
| `d.heardSauRao` · `d.sawSauPass(N)` | tầng **trong ngày** chưa tồn tại; ba nút nói về việc hôm nay đã thấy/nghe bà mấy lần | rao 2 · 2.1 · moiloi 2 |
| `p.holdsFilled` (dùng làm `need`) | năm nút đưa/đổi ổ bánh — khoá **đã có trong `worldfacts.ts`**, chỉ chưa ai dùng | doi 1 · 1.3 · 2.1 · moiloi2 1 |
| `p.hasTea` xếp lại thành `need` | đang khai dạng `while` ở `ganh` 1.2 — §4.1 xếp nó là TĨNH | ganh 1.2 |
| `w.slot(X)` ở cấp nút | *"tám giờ rưỡi"* hard-code | rao 2.1 |

---

## 3. Hành động cần code

| hành động | câu nào đòi | thời lượng đề xuất | thiếu gì trong game |
|---|---|---|---|
| **`need` đi qua `holds()`** | 7 nút `m.remembers(...)` + 5 nút `p.holdsFilled` | — | `visibleOptions()` vẫn chỉ tra `gate.flags`. **Việc đầu tiên.** Kèm: `sau.xetai` 1 phải đặt `flag: sauXeTai` thì mới có gì cho nó đọc |
| `BARTER` (đổi đồ ăn lấy ổ bánh) | doi 1 · 2.1 · moiloi2 1 | ngay | **không có act nào NHẬN một món vào**. Cần: ổ rời `player.hand`, một chén tàu hũ vào kho (ăn được? bán lại? chỉ là kỷ niệm?), và két **không** thu tiền ổ đó |
| `GIVE_BREAD` + `FREE_LOAF` | doi 1.3 | ngay | cho hẳn một ổ đầy đủ mà không mất một đồng; `FREE_LOAF` **đã có code**, chỉ cần gắn vào |
| `CARRY_GANH` + đạo cụ gánh | ganh 1 · 4 · ket:2 · moiloi 1 | ~15 s bưng, gánh nằm ở quầy tới khi bà đi | **không có đạo cụ gánh**, không có ô nó chiếm, không có trạng thái "gánh đang ở quầy". Đây là vật thể trung tâm của nhân vật |
| `HOLD_ITEM(noi-tau-hu)` + **bà quay lại lấy** | ganh 1.1.2 | tới khi bà quay lại (vòng hai, ~10 giờ rưỡi — bà nói rõ trong `ganh` 1.1) | cờ `sauGuiNoi` **đã đặt và đã được đọc lại** ở `chonmoi` ket:2 — nhưng **cái nồi không tồn tại và bà không quay lại**. Chữa chỗ này là chữa đoạn hay nhất của nhân vật |
| `MOVE_GANH` (thay cho `STEP_ASIDE` gắn sai) | ganh 3 | tới hết lượt ghé | `askStepAside()` gọi `yieldSlot()` = **đổi thứ tự hàng đợi**, không phải dời một vật dưới đất. Cần act riêng, và cần `t.ganhBlocking` để câu buộc tội có căn cứ |
| `OFFER_TEA` | ganh 1.2 | ~8 s | `serveTea()` / `refuseTea()` **đã đủ** (trừ `teaLeft`, tốn `TEA_COST`, từ chối theo `soi` + `teaSuspect`). Thiếu một `TalkAct` gọi vào |
| `SIT_DOWN` | ganh 1 | tới khi phục vụ xong | `GHE_BAN` **có thật và `needEquip` khai đúng**. Thiếu act đặt người ngồi xuống |
| `RAO` | rao 1.1.1 · 1.1.3 | ~5 s | **ba mảnh đã có, chưa ai nối**: `LOA_RAO` trong `equipment.ts` · `inviteChance` + `pass.stay` trong `passersby.ts` · cờ `sauRaoThu` trong nội dung. Rao phải làm người đi ngang **ngoái nhìn** |
| `WALK_ON` | omcua 3 · rao 3 | ngay | bà **không phải khách** nên `REFUSE` (gọi `leave(c,"refused")`) sai nghĩa. Đuổi một người bán hàng rong thì họ **đi tiếp**, không phải "bị mời đi" |
| `PROMISE_TRIP(cho)` | chonmoi 1.1.1 · 1.3 | kiểm **mỗi sáng** từ ngày bà rời hẻm | người chơi **đã đi chợ mỗi sáng thật** (`EconToday.market`, `sim/suppliers.ts`) — thiếu chỗ ngồi của bà ngoài chợ và một đường ghé qua. Đây là lời hứa đáng dựng nhất cả bốn file |
| **`flag` cho lời hứa của NPC** | doi 1.1.2 (*"để tui chỉ"*) · xetai 1.3 (*"mai tui đem bằng ra"*) · xetai ket:1 · omcua 2.1.2 · chonmoi ket:1 (**"tui hứa"**) | sang ngày hôm sau | năm lời hứa **bà nói ra** mà không cờ nào ghi. Bà hứa rồi quên thì người chơi không biết, mà bà giữ lời thì cũng không ai thấy |
| **`forSec`** | mọi act có thời lượng ở trên | — | `TalkAct` không có trường thời lượng |

---

## 4. §4.1 — chia `need` / `while` theo TĨNH hay ĐỘNG

> `?` là lưới an toàn, không phải đường đi chính. Mốc: dưới 5% số nhịp kết bằng `?`.

| nhóm | khoá trong file này | xếp | vì sao |
|---|---|---|---|
| **TĨNH → `need`** | `p.holdsFilled` · `p.handsEmpty` · `p.hasTea` · `p.sawSauXieu` · `t.hasOrder` · `t.ganhBlocking` · `m.remembers(X)` · `d.heardSauRao` · `d.sawSauPass(N)` | **25 nút** | tay người chơi, cái gánh đã đặt đâu rồi, và sổ quá khứ — không đổi trong lúc thẻ mở |
| **ĐỘNG → `while`** | `t.ordering` · `w.queue(N)` · `w.hot` | **9 nút** | hàng dài ra, trời đổ mưa trong lúc đang đọc |

**Ba chỗ dễ xếp nhầm:**

1. **`p.hasTea` là TĨNH** — `ganh` 1.2 đang khai nó dạng `while`. Người chơi biết bình trà
   còn hay hết trước khi bấm, nên hết trà thì câu mời phải **ẩn hẳn**, không được bày ra rồi
   trả `?`. Đây đúng là chỗ §4.1 gọi là *"bày ra rồi chặn là trêu người chơi"*.
2. **`t.ganhBlocking` là TĨNH.** Cái gánh nằm im dưới đất suốt lúc thẻ mở ⇒ `need`, **ẩn hẳn**.
   Hệ quả đáng mừng: với một bà Sáu đặt gánh gọn gàng, nút `ganh` 3 **biến mất** — không có
   gánh chắn đường thì **không có câu nào để mắng về chuyện chắn đường**.
3. **`w.hot` ở `omcua` ket:1 là ĐỘNG** ⇒ `while`, ra `?`. Mưa đổ xuống giữa lúc đọc ba dòng
   là chuyện xảy ra thật, và lúc đó *"nắng rồi đó bà"* phải thành một câu lạc đề.

**Rủi ro `?` quá 5%:** không có. Phần lớn gate của file này là TĨNH, và chúng ẩn hẳn. Cuộc
duy nhất đáng lo là `sau.ganh` — nếu `t.ganhBlocking` và `p.handsEmpty` cùng ẩn thì nhịp đầu
chỉ còn hai dòng; `trimKeepingExit()` vẫn giữ được đường ra (nút 3 `LANH`), **nhưng chỉ khi
nút 3 không bị `need` ẩn cùng lúc**. Phải kiểm riêng chỗ này — nó đúng là loại bug H-14 mà
`trimKeepingExit` sinh ra để chặn.

---

## 5. §4bis — LỜI HỨA CÓ HẠN

> *"Nếu đi rót trà mà họ không rót, bắt người ta đợi, thì họ cũng bỏ đi hay ít nhất chửi rồi bỏ đi."*

Bà Sáu `nongTinh` thấp (bà điềm đạm, hay tha) ⇒ theo §4bis bà thuộc nhóm **"nhắc hai lần,
rồi thôi, nhưng VẪN NHỚ"**. Nhớ ở đây phải là `record(..., "BROKEN_PROMISE", ...)` thật, chứ
không phải không có gì.

### 5.1. Hứa LÀM NGAY TẠI CHỖ — hạn tính bằng giây thật

| nút | hứa gì | hạn | giữ lời | **NUỐT LỜI** |
|---|---|---|---|---|
| `ganh` 1.2 | rót bà ly trà đá | **25 s** | `CARED_FOR_THEM` theo `takeTea(cup)` | nấc 1 bà nhắc *"Ly trà hồi nãy con nói đó…"* → nấc 2 bà thôi, **không nhắc nữa**, nhưng ghi một ký ức nhạt. Bà **không bỏ đi** — bà điềm đạm, và đó chính là chỗ đau hơn |
| `ganh` 1 · 4 · `moiloi` 1 | **bưng cái gánh vô cho bà** | **15 s** | `CARRY_GANH` → gánh nằm ở quầy, bà nhẹ vai (`calm`) | nói rồi đứng im: bà tự gánh lên, `rel −2`, và **câu đó cả lượt ghé không nói lại được** (`v.promised(ganh)`) |
| `ganh` 1 | bà ngồi xuống ghế | **15 s** | `SIT_DOWN` tới khi phục vụ xong | bà đứng mãi giữa lời mời ngồi — `rel −1` |
| `ganh` ket:2 · 1.1.2 | **giữ hộ một cái nồi** | nhận **ngay**; trả khi bà quay lại (**vòng hai, ~10 g 30**) | `HOLD_ITEM` + bà quay lại lấy → `CARED 60` như đang khai | **làm mất / không trả được**: đây phải là một đường thất bại thật, không chỉ là một dòng chữ |
| `doi` 1 · 1.3 · 2.1 · `moiloi2` 1 | đổi ổ bánh lấy chén tàu hũ | **ngay** | `BARTER` | nhận chén rồi không đưa ổ: bà **không nói gì**, nhưng mai không đổi nữa (`m.remembers`) |
| `rao` ket:2 | *"để con tính bà"* | **20 s** | `COLLECT` | bà đứng chờ tính tiền mà không ai tính — nấc 1 nhắc, nấc 2 bà để tiền xuống rồi đi |

### 5.2. Hứa CHO NGÀY KHÁC — kiểm ở lần ghé sau

Đây là **phần nặng nhất của bà Sáu**, và là chỗ `flag` đã có mà **hạn thì chưa**.

| nút | hứa gì | kiểm khi nào | giữ lời | **NUỐT LỜI** |
|---|---|---|---|---|
| `omcua` 1.1.1 | ***"Để con nói lại với ảnh nghen bà"*** | **lần ghé sau của anh Dũng** | `flag: sauNhoNoi` ✓ → `dung.basau` 3.2 ✓ (đã có đủ) | **chưa có gì**. Phải thêm: bà hỏi *"Con nói nó chưa con?"* ở lần ghé sau của **bà**; chưa nói → `rel −3` và bà **thôi nhờ** (`notFlag`). Hiện hứa rồi im luôn cũng không mất gì |
| `chonmoi` 1.1.1 | ***"con đi bộ ra chợ mua bà vậy"*** | **mỗi sáng từ ngày bà rời hẻm (≈ngày 35)** | ghé chợ mua một chén → `CARED` lớn, và bà *"để dành một chén cho con"* như bà nói | không ghé lần nào: không phải phạt, mà là **một chỗ trống nhìn thấy được** — cái hiên nhà thuốc có bà ngồi mà mình chưa bao giờ tới |
| `chonmoi` ket:1 | **bà hứa với mình**: *"Tui hứa. Tui có hứa với ai bao giờ đâu."* | sau ngày 34 | bà ghé thật ≥ 1 lần → trả cái `rel +4 · CARED 65` đã ứng trước | bà không ghé → **lời hứa duy nhất trong đời bà bị nuốt**, và người chơi phải thấy được. Đây là đoạn đáng giá nhất cả file |
| `doi` 1.1.2 | bà dạy nấu tàu hũ | lần ghé sau | cần `flag: sauDayNau` + một cuộc dạy nấu | — |
| `xetai` 1.3 | bà đem tấm bằng lái ra cho coi | ngày hôm sau | cần `flag: sauHuaKhoeBang` | — |
| `omcua` 2.1.2 | bà truyền câu *"đừng gấp trong cua"* lại cho anh Dũng | lần ghé sau của anh Dũng | cần `flag: sauSeDayDung` | — |
| `xetai` ket:1 | *"bữa nào bà kể tiếp nghen"* | lần ghé sau | cần `flag: sauKeTiep` | — |

### 5.3. Phải NHÌN THẤY được lúc đang treo (CANON T5)

Hai thứ phải hiện ra, không được nằm trong đầu người chơi:

* **Cái nồi bà gửi** (`sauGuiNoi`) — phải thấy nó ở quầy. Hiện nó là một cái cờ boolean.
* **Lời hứa "nói lại với anh Dũng"** (`sauNhoNoi`) — phải có một dòng ở sổ tay. Hiện người
  chơi hứa ngày 10 rồi gặp anh Dũng ngày 12 mà **không có gì nhắc mình đã hứa gì**.

---

## 6. §4ter — TRÍ NHỚ BỐN TẦNG

| tầng | khoá | hiện trạng |
|---|---|---|
| **trong cuộc** `c.*` | `c.angered` · `c.saidTone(X)` | code nuôi thật, **0/111 nút đọc**. File này **không vi phạm §3.3**: cả năm nút `GAT`/`LANH` nặng (`doi` 3 · `xetai` 1.1.4 · `omcua` 3 · `ganh` 3 · `rao` 3 · `chonmoi` 3) đều **không có `then`** — cuộc chết tại đó. Sạch nhờ hình dạng cây, không nhờ cổng nào |
| **trong lượt ghé** `v.*` | `v.gaveTea` · `v.promised(X)` · `v.carriedGanh` | **không tồn tại**. Cần cho §5.1: hiện mời bà ngồi ở `ganh` 1, rồi mời lại ở `ganh` 1.2, rồi bưng gánh lần nữa ở `ganh` 4 — ba lần trong một lượt ghé, không ai thấy lạ |
| **trong ngày** `d.*` | `d.heardSauRao` · `d.sawSauPass(N)` · `d.metToday` | **không tồn tại**. Bà đi ngang **hai vòng mỗi ngày** (bà nói rõ ở `ganh` 1.1: *"vòng hai tui đi lúc mười giờ rưỡi"*) — vòng hai vẫn chào như chưa gặp |
| **cả mùa** `m.*` | `m.visits(N)` · `m.tier(X)` · `m.remembers(E)` | `mem.visits` / `mem.tier` / `record()` **đã có đủ**; `TalkWhen.minVisits` dùng được ở **cấp cuộc** (và `chonmoi` dùng đúng: `minVisits 6`). **Cấp nút thì không có đường nào** |

### Luật cứng — câu giả định "lần đầu gặp"

File này **không có nút nào** giả định lần đầu gặp. Mọi cuộc khoá `day >= 3`, ba cuộc khoá
thêm `minVisits`. **Sạch.**

### Luật cứng — câu NHẮC LẠI một chuyện (chỗ thủng chính)

*Nhớ nhầm một chuyện chưa từng xảy ra là lỗi nặng hơn quên.* **Bảy nút phạm**, và cả bảy đổ
về **một gốc**: `sau.xetai` không đặt cờ.

| nút | nhắc lại chuyện gì | nguồn duy nhất | cửa sổ nhớ nhầm | phải khai |
|---|---|---|---|---|
| `ganh` 2.2 | bà bỏ nghề lái xe | `sau.xetai` (ngày **15**) | cuộc mở ngày **6** ⇒ **9 ngày** | `need: "m.remembers(sauXeTai)"` |
| `moiloi2` 2 | *"hồi xưa bà cầm vô lăng"* | `sau.xetai` (ngày 15) | cuộc mở ngày **16**, cùng `minVisits 5` ⇒ **chồng cửa sổ** | `need: "m.remembers(sauXeTai)"` |
| `xetai` 2 | *"bà hay chê anh Dũng ôm cua"* | `sau.omcua` (ngày 10, **có đặt cờ `sauMangDung`**) | ngày 15 trở đi | `need: "sauMangDung"` — **sửa đúng một dòng, cờ đã có sẵn** |
| `omcua` 1 | gọi đích danh **"anh Dũng"** từ *"thằng áo xanh"* | quen anh Dũng | ngày 10 trở đi | `need: "m.remembers(dungQuen)"` |
| `chonmoi` 1.1.3 | tiếng rao của bà | `sau.rao` (ngày 5) | ngày 28 — hẹp, nhưng có thật | `need: "m.remembers(sauRao)"` |
| `rao` 2 · 2.1 | *"tiếng rao của bà là đồng hồ của cả hẻm"* | **nghe bà rao ngoài đời game** | luôn luôn | `need: "d.heardSauRao"` |
| `doi` 3 | *"bà hỏi hoài vậy bà"* | bà đã hỏi ≥ 2 lần | ngay lần đầu | `need: "m.remembers(sauDoi) >= 2"` |

**Một dòng sửa đáng giá nhất cả file:** thêm `"flag": "sauXeTai"` vào `sau.xetai` nút 1.
Nó mở khoá cho hai nút của chính file này **và** cho `dung.basau` 1.1 — chỗ nhớ nhầm nặng
nhất của `anh-dung.json`.
