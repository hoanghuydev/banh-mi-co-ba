# Rà thoại — THẦY PHÚC (`src/content/talks/thay-phuc.json`)

**Hợp đồng:** `docs/phase-2-he-npc/P2-07-neo-thoai-vao-the-gioi.md` · **8 cuộc · 104 nút**

**Trạng thái đo được:** `while` **0 lần** · `forSec` **0 lần** · `needEquip` **0 lần** ·
`act` **2 lần** (`DISCOUNT 20 000` ở 6.1 và 6.2.1). 102/104 nút không đổi gì ở thế giới.

**Hai chỗ chết người của file này, kiểm trước khi đọc bảng:**
* **Mời ngồi — 4 nút, 0 nút khai `needEquip: GHE_BAN`.** `GHE_BAN` là thiết bị mua được
  (320 k, mở ngày 5, `src/content/econ/equipment.json`) và `StallScene` chỉ vẽ cái ghế
  khi đã mua. Bốn câu 4S:ket.1 · 5.2.1 · 6S:ket.1 · 6.1.2 mời một ông 68 tuổi ngồi vào
  một cái ghế có thể không tồn tại. Các file khác (`ba-bay`, `ba-sau`, `be-su`,
  `anh-dung`, `ong-hai`, `walkin`) đã khai cổng này — file này **sót sạch**.
* **Cà phê không tồn tại trong game.** Không có thiết bị pha, không có món, `§3.1` chỉ có
  `p.holdsTea` (trà đá, từ `BINH_TRA`). Nên 1.2 *"Thầy uống thử một ly đi thầy, con mời"*
  là mời uống một thứ không có — đúng khuôn lỗi chủ dự án nêu. Cả cuộc `phuc.caphe` nói
  về một chi tiết tính cách có thật (arcs.ts: *"cà phê phin cực đoan, cân tiểu ly 22 gam"*),
  nên **chủ đề thì giữ**, chỉ nhánh mời uống là rỗng.

**Luật đọc:** như `co-mai.md` — xã giao thuần không nợ gì; kiến thức nền không cần `need`,
sự kiện cụ thể thì cần; lời hứa làm việc ngoài ổ bánh ⇒ `CẦN CODE` (từ vựng `does` chưa có).

---

### phuc.caphe — cà phê 22 gam (SHORT · day 3–40)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1S:ket.1 | "Dạ bữa nào thầy chỉ con pha đi thầy." | — | — | **thiếu** cờ | **SỬA** — thầy nhận lời dạy ("được, mà con phải chịu khó cân") rồi không cuộc nào nhắc lại; thêm `flag phucDayPhaCaPhe` |
| 1S:ket.2 | "Dạ con làm tiếp đây thầy." | — | — | — | ĐÚNG |
| 1.1 | "Dạ con pha vội thôi thầy, hổng có ngon đâu." | — | — | — | ĐÚNG |
| 1.1.1 | "Hai mươi hai gam lận hả thầy?" | — | — | — | ĐÚNG |
| 1.1.1.1 | "Thầy cân cà phê mà vợ thầy chịu nổi hả thầy." (DUA) | — | — | — | ĐÚNG |
| 1.1.1.2 | "Khác nhiều hông thầy, hai mươi với hai mươi hai?" | — | — | `mem REMEMBERED_STORY` | ĐÚNG |
| 1.1.1.3 | "Dạ con thấy cũng vậy thôi thầy." | — | — | — | ĐÚNG |
| 1.1.1.4 | "Thầy rảnh quá thầy ơi." (GAT) | — | — | `anger 20` · lá cuối | ĐÚNG |
| 1.1.2 | "Dạ con đong bằng muỗng hà thầy." | — | — | — | ĐÚNG |
| 1.1.3 | "Thầy kỹ ghê thầy." | — | — | — | ĐÚNG |
| 1.2 | "Thầy uống thử một ly đi thầy, con mời." | — | **thiếu** — không có khoá nào cho ly cà phê | **không có gì** — thầy "uống" mà không có ly | **CẦN CODE** — mời uống một thứ game không mô phỏng: không thiết bị pha, không món, `p.holdsTea` là trà đá |
| 1.2.1 | "Dạ thầy chê thẳng đi thầy, con sửa." | — | **thiếu** thầy đang cầm ly | — | **SỬA** — treo trên 1.2; không có ly thì cả nhánh chê–sửa là nói suông |
| 1.2.2 | "Thầy chê là con hổng mời nữa đó thầy." (DUA) | — | **thiếu** thầy đang cầm ly | — | **SỬA** — cùng 1.2.1 |
| 1.2.3 | "Dạ thầy uống đi thầy." | — | **thiếu** thầy đang cầm ly | — | **SỬA** — cùng 1.2.1 |
| 1.3 | "Dạ con đang bận thầy ơi." | — | **thiếu** `w.queue >= 1` | — | **SỬA** — viện cớ bận khi ngoài quầy không có ai |

### phuc.hocsinh — học trò cũ nhắn tin sau 30 năm (SHORT · day 9–40 · minVisits 4)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 2S:ket.1 | "Thầy kể con nghe nữa đi thầy." | — | — | — | ĐÚNG — thầy từ chối thẳng, không hứa gì |
| 2S:ket.2 | "Dạ hay quá thầy." | — | — | — | ĐÚNG |
| 2.1 | "Nó nhắn gì hả thầy?" | — | — | — | ĐÚNG |
| 2.1.1 | "Thầy có nhớ nó hông thầy?" | — | — | — | ĐÚNG |
| 2.1.1.1 | "Vậy chắc thầy buồn hả thầy?" | — | — | `mem REMEMBERED_STORY` | ĐÚNG |
| 2.1.1.2 | "Thầy làm gì cho nó mà nó nhớ dữ vậy thầy?" | — | — | — | ĐÚNG |
| 2.1.1.3 | "Thầy nhắn lại chưa thầy?" | — | — | — | ĐÚNG |
| 2.1.1.4 | "Chuyện nhỏ mà thầy, nghĩ chi cho mệt." (LANH) | — | — | `rel −2` | ĐÚNG — hệ quả đọc được ở câu đáp |
| 2.1.2 | "Thầy cứ nhắn thiệt đi thầy. Quên thì nói quên." | — | — | **thiếu** cờ | **SỬA** — thầy đổi ý ngay trước mặt mình ("thầy quên mất điều đó") rồi hôm sau không có gì khác; thêm `flag phucNhanLaiHocTro` |
| 2.1.3 | "Ba mươi năm mà còn nhớ thầy, thầy giỏi thiệt." | — | — | — | ĐÚNG |
| 2.2 | "Dạ ba mươi năm lận hả thầy?" | — | — | — | ĐÚNG |
| 2.2.1 | "Giờ nó làm gì hả thầy?" | — | — | — | ĐÚNG |
| 2.2.2 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 2.3 | "Dạ con đang đông khách thầy ơi." | — | **thiếu** `w.queue >= 2` | `rel −2` | **SỬA** — "đông khách" là một sự thật đo được mà câu này không kiểm |

### phuc.khongnoi — thầy lỡ hỏi chuyện hẻm (BARK · day 11–40)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 3.1 | "Dạ cô Mai có kể con nghe đó thầy." | `maiKeTiep` ✓ | — | — | ĐÚNG — neo chéo file đúng mẫu |
| 3.1.1 | "Dạ. Con cũng thấy kỳ khi nghe thầy." | — | — | `mem CARED_FOR_THEM` | ĐÚNG |
| 3.1.2 | "Thầy hỏi rồi thầy không nghe, kỳ ghê thầy." (DUA) | — | — | — | ĐÚNG |
| 3.1.3 | "Dạ con kể thầy nghe nè thầy." | — | — | `rel −2` | ĐÚNG |
| 3.2 | "Dạ con hổng biết gì đâu thầy." | **thiếu** `!maiKeTiep` | — | `rel +3` | **SỬA** — nếu `maiKeTiep` đang bật thì đây là **nói dối và được +3**; `need` chưa phủ định được |
| 3.2.1 | "Thầy hỏi cũng bình thường mà thầy." | — | — | — | ĐÚNG |
| 3.2.2 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 3.3 | "Dạ chuyện đó con hổng muốn nhắc thầy ơi." | **thiếu** `maiKeLan`/`maiKeTiep` | — | — | **SỬA** — "chuyện đó" giả định mình đã biết chuyện; hiện hiện ra cả khi chưa ai kể |
| 3.4 | "Thầy mà cũng hóng chuyện hả thầy." (DUA) | — | — | — | ĐÚNG |
| 3.4.1 | "Con giỡn thôi thầy." | — | — | — | ĐÚNG |
| 3.4.2 | "Thầy giáo mà vậy đó thầy." (GAT) | — | — | `anger 20` · lá cuối | ĐÚNG |

### phuc.betoan — thầy thử bài bé Su (SHORT · day 12–40 · minVisits 4)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 4S:ket.1 | "Dạ thầy ngồi ăn đi thầy, nguội mất." | — | **thiếu** `t.served` | **thiếu** `needEquip: GHE_BAN` · `THEY_SIT` | **SỬA** — hai lỗi trong một câu: mời ngồi lên cái ghế có thể chưa mua, mời ăn ổ bánh có thể chưa đưa |
| 4S:ket.2 | "Bữa nào thầy kể con nghe tiếp nghen thầy." | — | — | — | ĐÚNG — "bữa nào" không có hạn, không ai đòi |
| 4S:ket.3 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 4.1 | "Dạ bé Su đó thầy. Mà thầy biết nó nói trật thiệt hả thầy?" | — | — | `flag phucThayBeSu` (mở cuộc ở `be-su.json`) | ĐÚNG |
| 4.1.1 | "Sao thầy biết hay vậy thầy?" | — | — | — | ĐÚNG |
| 4.1.1.1 | "Vậy sao thầy hổng nói nó biết là thầy biết?" | — | — | `flag phucDeYen` (đọc ở `be-su.json`) | ĐÚNG |
| 4.1.1.2 | "Thầy ngồi im mà thầy thấy hết trơn ha thầy." (DUA) | — | — | — | ĐÚNG |
| 4.1.1.3 | "Thầy nên kêu nó đi thi đi thầy. Giỏi vậy uổng." | — | — | `rel −1` | ĐÚNG |
| 4.1.1.4 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 4.1.2 | "Nó sợ bị bắt đi ôn thi đó thầy. Nó nói với con." | **thiếu** cờ bé Su đã kể | — | — | **SỬA** — khai một chuyện bé Su kể trong khi có thể bé Su chưa hề kể; cùng họ với `suGiuTien` ở 4.1.3 nhưng không có cổng |
| 4.1.3 | "Nó tính tiền giùm con mỗi sáng đó thầy." | `suGiuTien` ✓ | — | — | ĐÚNG — mẫu đúng, ngay cạnh 4.1.2 sai |
| 4.1.4 | "Thầy thử tụi nhỏ chi vậy thầy?" | — | — | — | ĐÚNG |
| 4.2 | "Thầy hỏi nó bài gì vậy thầy?" | — | — | — | ĐÚNG |
| 4.2.1 | "Dạ con cũng rớt bài đó hồi đi học thầy." (DUA) | — | — | — | ĐÚNG |
| 4.2.1.1 | "Dạ con hồi đó đọc nửa chừng là con làm liền." (DUA) | — | — | — | ĐÚNG |
| 4.2.1.2 | "Thầy nói chuyện gì cũng ra bài học hết thầy ha." | — | — | `mem REMEMBERED_STORY` | ĐÚNG |
| 4.2.1.3 | "Dạ con hổng rành mấy cái đó thầy." (LANH) | — | — | — | ĐÚNG |
| 4.2.2 | "Vậy thầy ra đề cho con một bài đi thầy." (DUA) | — | — | **thiếu** — "bán bao nhiêu ổ thì hoà vốn?" | **SỬA** — thầy ra một bài toán mà **game có đáp án thật** (điểm hoà vốn của ngày hôm đó); không nối vào đâu là bỏ phí chỗ neo dễ nhất file |
| 4.2.3 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 4.3 | "Dạ thầy đừng thử tụi nhỏ ở quán con nghen thầy." | — | — | **thiếu** `flag phucDeYen` | **SỬA** — cùng kết quả với 4.1.1.1 ("thầy hổng nói gì đâu") mà không đặt cờ: hai đường cùng một đích, một đường mất đích |
| 4.4 | "Dạ con đang làm thầy. Chút nữa nghen thầy." | — | **thiếu** `w.queue >= 1` | — | **SỬA** |

### phuc.xedap — đạp 40 km tuổi 68 (SHORT · day 15–40 · minVisits 5)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 5S:ket.1 | "Thầy đi đường cẩn thận nghen thầy." | — | — | `mem CARED_FOR_THEM` | ĐÚNG |
| 5S:ket.2 | "Dạ ổ của thầy đây thầy." | — | **thiếu** `p.holdsFilled` | **thiếu** `GIVE_BREAD` · tới khi ăn xong | **CẦN CODE** — đưa bánh bằng lời; `GIVE_BREAD` §3.5 ghi **CHƯA** |
| 5S:ket.3 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 5.1 | "Sáu mươi tám tuổi mà thầy đạp bốn chục cây hả thầy?" | — | — | — | ĐÚNG |
| 5.1.1 | "Thầy đi một mình hả thầy?" | — | — | — | ĐÚNG |
| 5.1.1.1 | "Thầy khoe khéo ghê thầy." (DUA) | — | — | — | ĐÚNG |
| 5.1.1.2 | "Thầy ngon hơn con rồi thầy." (DUA) | — | — | — | ĐÚNG |
| 5.1.1.3 | "Thầy đạp vậy đầu gối chịu nổi hông thầy?" | — | — | `mem CARED_FOR_THEM` | ĐÚNG |
| 5.1.1.4 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 5.1.2 | "Thầy đạp chi cho cực vậy thầy?" | — | — | — | ĐÚNG |
| 5.1.3 | "Thầy đạp xe mà thầy ăn mỗi ổ pate ít rau hả thầy." (DUA) | — | **thiếu** `t.hasOrder` + đơn đúng là pate ít rau | — | **SỬA** — nói về đơn hôm nay trong khi thầy có thể gọi khác; câu trêu thành câu sai cảnh |
| 5.2 | "Thầy chống xe chỗ này nè thầy, con coi giùm cho." | — | **thiếu** — chỗ dựng xe | **thiếu** — xe không đổi vị trí | **CẦN CODE** — cái xe đạp chỉ tồn tại trong `arcs.ts` dưới dạng chữ: không vật thể, không chỗ dựng, không trạng thái "đang ngó xe" |
| 5.2.1 | "Thầy ngồi ăn đi thầy. Con ngó giùm cho." | — | **thiếu** `t.served` | `calm 24` ✓ · **thiếu** `needEquip: GHE_BAN` | **SỬA** — `calm 24` là hệ quả thật (hiếm, tốt) nhưng mời ngồi vào cái ghế có thể chưa mua |
| 5.2.1.1 | "Cái xe quý lắm hả thầy?" | — | — | `mem REMEMBERED_STORY` | ĐÚNG |
| 5.2.1.2 | "Thầy giữ cái bao thơ đó hông thầy?" | — | — | `mem REMEMBERED_STORY` | ĐÚNG |
| 5.2.1.3 | "Dạ thầy ăn đi thầy, con qua bên kia chút." | — | **thiếu** `t.served` | — | **SỬA** — mời ăn khi chưa chắc thầy đã có ổ nào |
| 5.2.2 | "Xe đạp mà ai thèm lấy thầy ơi." (DUA) | — | — | — | ĐÚNG |
| 5.2.3 | "Dạ thầy tự coi xe thầy giùm con, con bận." (LANH) | — | **thiếu** `w.queue >= 1` | `rel −2` | **SỬA** |
| 5.3 | "Dạ con chưa đi đâu xa bao giờ thầy." | — | — | — | ĐÚNG |
| 5.3.1 | "Năm mươi hả thầy? Vậy con còn kịp." | — | — | — | ĐÚNG |
| 5.3.2 | "Dạ con hổng có thời gian đâu thầy." (LANH) | — | — | — | ĐÚNG |
| 5.4 | "Thầy kể chuyện xe cộ hoài con rối tay quá thầy." (GAT) | — | — | `anger 20` · lá cuối | ĐÚNG |

### phuc.quen — thầy quên đã trả tiền chưa (FULL · day 22–40 · minVisits 8)

> Cuộc nặng nhất của cả nhân vật, và là chỗ **duy nhất** trong sáu file này có `DISCOUNT`.
> Cũng là chỗ lỗ hổng ăn gian (CANON §8) lộ rõ nhất — xem 6.2 và 6.2.2.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 6S:ket.1 | "Thầy ngồi ăn đi thầy. Con nhớ giùm thầy." | — | **thiếu** `t.served` | **thiếu** `needEquip: GHE_BAN` + lời hứa nhớ giùm không ai kiểm | **CẦN CODE** — hứa làm trí nhớ cho một người đang mất trí nhớ, rồi lần `phuc.quen` sau mở ra y như chưa có gì |
| 6S:ket.2 | "Xe thầy con ngó giùm, tiền thầy con nhớ giùm luôn thầy." | `phucGuiXe` ✓ | — | **thiếu** — hai lời hứa trong một câu | **CẦN CODE** — `need` đúng, nhưng đây là lời hứa nặng nhất file: "thầy mắc nợ con" mà không có món nợ nào tồn tại |
| 6S:ket.3 | "Dạ thầy đừng lo, chuyện nhỏ mà thầy." | — | — | — | ĐÚNG |
| 6.1 | "Dạ thầy trả rồi thầy. Thầy cất tờ đó đi thầy." | — | — | `DISCOUNT 20 000` · ngay · `mem CARED_FOR_THEM` | **ĐÚNG** — mẫu chuẩn: lời nói trừ tiền thật khỏi hoá đơn |
| 6.1.1 | "Dạ ai cũng quên mà thầy." | — | — | — | ĐÚNG |
| 6.1.1.1 | "Thầy có đi khám chưa thầy?" | — | — | `mem CARED_FOR_THEM` | ĐÚNG |
| 6.1.1.2 | "Vậy từ mai con ghi lại giùm thầy nghen." | — | — | **không có gì** | **CẦN CODE** — "từ mai" là một lời hứa **có hạn rõ ràng** mà không ai đòi; đúng loại free word nặng nhất hợp đồng nêu |
| 6.1.1.3 | "Thầy ghi vô cuốn sổ của thầy đi thầy." | — | — | — | ĐÚNG |
| 6.1.1.4 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 6.1.2 | "Thầy cứ ngồi ăn đi thầy, tiền nong tính sau." | — | **thiếu** `t.served` | **thiếu** `needEquip: GHE_BAN` | **SỬA** |
| 6.1.3 | "Thầy nhớ giùm con cái ổ ít rau là được rồi thầy." (DUA) | — | — | — | ĐÚNG |
| 6.2 | "Dạ thầy chưa trả. Thầy đưa con đi thầy." | — | — | **thiếu** — 20 000 không vào két | **SỬA** — lừa một ông già quên mà **két không nhận được đồng nào**: ăn gian chỉ có giá, không có lợi ⇒ không phải lựa chọn, chỉ là cái bẫy |
| 6.2.1 | "Dạ… thôi thầy. Con nói giỡn. Thầy trả rồi." | — | — | `DISCOUNT 20 000` · ngay | **ĐÚNG** — và đây là **mẫu đúng của §3.3**: câu `AM` đi sau một câu `RUDE_TO_THEM` nhưng lời đáp đọc ra là thầy chưa nguôi ("Con đừng giỡn cái đó với thầy") |
| 6.2.2 | "Dạ hai chục thầy." (LANH) | — | — | **thiếu** — 20 000 không vào két | **SỬA** — cùng lỗ hổng 6.2 |
| 6.3 | "…" (IM) | — | — | **thiếu** `WALK_ON` — "Thôi. Thầy đi." | **CẦN CODE** — thầy tuyên bố bỏ đi rồi vẫn đứng nguyên; và không rõ ổ bánh có được trả tiền hay không |

### phuc.moiloi — người chơi bắt chuyện (PLAYER_ONLY · SHORT · day 4–40)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 7.1 | "Thầy còn ngửi thấy mùi cà phê từ đầu hẻm hông thầy?" (DUA) | **thiếu** cờ đã nghe `phuc.caphe` | — | — | **SỬA** — `phuc.caphe` không đặt cờ nào nên câu này hỏi lại một chuyện có thể chưa xảy ra |
| 7.2 | "Thầy ăn gì chưa thầy?" | — | **thiếu** `!t.served` | — | **SỬA** — hỏi "ăn gì chưa" khi thầy đang cầm ổ bánh mình vừa đưa |
| 7.3 | "Thôi thầy. Hổng có gì." (LANH) | — | — | — | ĐÚNG — đường ra, đúng luật 3 của `talk.ts` |

### phuc.moiloi2 — người chơi bắt chuyện, lớp sau (PLAYER_ONLY · SHORT · day 16–40 · minVisits 5)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 8.1 | "Thứ Bảy rồi thầy đạp tới đâu thầy?" | **thiếu** cờ đã nghe `phuc.xedap` | **thiếu** — không nên hỏi "thứ Bảy rồi" vào chính thứ Bảy | — | **SỬA** |
| 8.2 | "Có đứa học trò cũ nào nhắn thầy nữa hông thầy?" (DUA) | **thiếu** cờ đã nghe `phuc.hocsinh` | — | — | **SỬA** — chữ "nữa" giả định đã có lần đầu |
| 8.3 | "Thôi thầy. Con bận." (LANH) | — | — | — | ĐÚNG |

---

## 1. Thống kê

| phán | số nút | % |
|---|---|---|
| `ĐÚNG` | **72** | 69,2 % |
| `SỬA` | **25** | 24,0 % |
| `XOÁ` | **0** | 0 % |
| `CẦN CODE` | **7** | 6,7 % |
| **tổng** | **104** | |

Theo cuộc (ĐÚNG/SỬA/XOÁ/CẦN CODE): `phuc.caphe` 9/5/0/1 · `phuc.hocsinh` 12/2/0/0 ·
`phuc.khongnoi` 9/2/0/0 · `phuc.betoan` 16/5/0/0 · `phuc.xedap` 16/4/0/2 ·
`phuc.quen` 8/3/0/4 · `phuc.moiloi` 1/2/0/0 · `phuc.moiloi2` 1/2/0/0.

**Trí nhớ trong một cuộc (§3.3): file này SẠCH về `GAT`.** Cả 4 nút `GAT` (1.1.1.4,
3.4.2, 5.4) và nút `IM` nặng 6.3 đều là **lá cuối**. Không có nút `CHUI` nào.
Chỗ duy nhất có `AM` đi sau một câu xúc phạm là **6.2 → 6.2.1**, và nó **đúng luật**:
lời đáp nói rõ thầy chưa nguôi. Đây là mẫu nên chép sang các file khác.

**Tính cách:** không nút nào bắt thầy Phúc cư xử ngược tính (ông chậm, kỹ, nói ngắn,
không hóng chuyện) — `phuc.khongnoi` còn lấy chính việc ông lỡ hóng làm chủ đề. Không có
`SỬA` nào vì lý do tính cách ở file này.

## 2. Đề xuất khoá mới

| khoá đề xuất | nghĩa | nút cần | vì sao §3 không đủ |
|---|---|---|---|
| `p.holdsCup` | đang cầm một ly đồ uống **không phải trà đá** | 1.2 · 1.2.1 · 1.2.2 · 1.2.3 | §3.1 chỉ có `p.holdsTea`. Nếu không định làm cà phê thì **xoá nhánh mời uống**, đừng thêm khoá |
| `t.orderIs(X)` | món khách gọi hôm nay đúng là X | 5.1.3 | §3.2 có `t.hasOrder` (có món trong đầu) nhưng không nói **món gì**; mọi câu trêu về "ổ quen" của 12 người đều cần khoá này |
| `t.parkedBike` | khách đã dựng xe ở chỗ mình chỉ | 5.2 | không có trong §3.2, và không có vật thể xe đạp trong `map.ts`/`StallScene` |
| `need` nhận dấu `!` | phủ định cờ | 3.2 (`!maiKeTiep`) · 7.2 | `visibleOptions` hiện chỉ `!!gate.flags[o.need]` |
| `w.queue >= N` dùng được ở `while` | — | 1.3 · 2.3 · 4.4 · 5.2.3 | §3.4 đã có khoá, nhưng **chưa có cơ chế `while` nào đọc nó** (xem mục 3) |

**Cờ nội dung cần thêm:** `phucDayPhaCaPhe` (1S:ket.1) · `phucNhanLaiHocTro` (2.1.2) ·
`phucKeCaPhe` / `phucKeXeDap` / `phucKeHocTro` — ba cờ "đã kể chuyện này" cho 7.1 · 8.1 · 8.2 ·
`suKeOnThi` (bé Su kể chuyện sợ ôn thi, cho 4.1.2 — phải do `be-su.json` đặt).

## 3. Hành động cần code

| hành động | nút cần | thời lượng đề xuất | thiếu gì trong game |
|---|---|---|---|
| `PROMISE_DEED{ việc, hạn ngày }` | 6.1.1.2 ("từ mai con ghi lại giùm") · 6S:ket.1 · 6S:ket.2 | hạn **1 ngày** với 6.1.1.2 (câu nói rõ "từ mai"), 3–7 ngày với hai câu kia | `TalkAct.PROMISE` chỉ treo **món kẹp vô ổ**, kiểm lúc đưa bánh. Không có chỗ treo lời hứa qua đêm, không có `BROKEN_PROMISE` cho việc |
| `GIVE_BREAD` | 5S:ket.2 | tới khi ăn xong | §3.5 ghi **CHƯA**. Cần kèm `while: p.holdsFilled` |
| `WALK_ON` | 6.3 | ngay, kết thúc cuộc | §3.5 ghi **CHƯA**. "Thôi. Thầy đi." hiện không làm thầy đi |
| `OFFER_DRINK` (mở rộng `OFFER_TEA`) | 1.2 | ~8 s, có đường từ chối | Game không có cà phê: không thiết bị trong `equipment.json`, không món, không `p.holdsCup`. **Khuyến nghị: xoá nhánh mời uống, giữ cuộc** — rẻ hơn nhiều so với thêm một dây chuyền đồ uống |
| `TAKE_CASH{ vnd }` (ngược chiều `PAY`) | 6.2 · 6.2.2 | ngay | Ăn gian 20 k của thầy Phúc hiện **chỉ trừ `rel`**, không cộng tiền. CANON §8 đòi ăn gian phải có **lợi thật** thì mới là một lựa chọn |
| `ORDER_ANSWER` — nối một câu thoại vào số liệu kinh tế thật | 4.2.2 (điểm hoà vốn) | ngay | Thầy ra một bài toán mà `src/sim/econ` biết đáp án; không có đường cho thoại đọc số đó |
| **`while` nói chung** | 13 nút ở file này | — | `TalkNode.while` **đã khai kiểu trong `talk.ts` nhưng không ai đọc**: `visibleOptions()` và `talkGate()` bỏ qua hoàn toàn, và bong bóng "?" của §4 chưa tồn tại. Mọi dòng `while` ở đây là đề xuất |
| `needEquip` cho 4 câu mời ngồi | 4S:ket.1 · 5.2.1 · 6S:ket.1 · 6.1.2 | — | Cổng **đã có code** (`visibleOptions` → `gate.hasEquip`). Đây là `SỬA` nội dung thuần, không cần code — liệt ở đây để không ai bỏ sót |

---

## 4. §4.1 — "?" là lưới an toàn: xếp lại TĨNH vs ĐỘNG

| sự thật đề xuất | nút | TĨNH / ĐỘNG | khai bằng | lý do |
|---|---|---|---|---|
| `needEquip: GHE_BAN` | 4S:ket.1 · 5.2.1 · 6S:ket.1 · 6.1.2 | **TĨNH** | **`needEquip`** → ẩn hẳn | cổng **đã có code** (`visibleOptions` → `gate.hasEquip`); chỉ cần khai |
| `p.holdsCup` · `p.holdsFilled` | 1.2 · 1.2.1–3 · 5S:ket.2 | **TĨNH** | **`need`** → ẩn hẳn | thẻ thoại khoá phím |
| `t.orderIs(pate ít rau)` | 5.1.3 | **TĨNH** | **`need`** → ẩn hẳn | đơn chốt ở `phase: ordering`, trước khi thẻ mở |
| `t.parkedBike` | 5.2 | **TĨNH** trong một nhịp | **`need`** → ẩn hẳn | thầy không tự dựng xe giữa cuộc |
| `!maiKeTiep` · `maiKeLan` · các cờ "đã kể" | 3.2 · 3.3 · 7.1 · 8.1 · 8.2 · 4.1.2 | **TĨNH** | **`need`** → ẩn hẳn | quá khứ không đổi |
| `w.queue >= 1` · `>= 2` | 1.3 · 2.3 · 4.4 · 5.2.3 | **ĐỘNG** | **`while`** → "?" | hàng người đổi trong lúc đọc |
| `t.served` / `!t.served` | 4S:ket.1 · 5.2.1 · 5.2.1.3 · 6S:ket.1 · 6.1.2 · 7.2 | **ĐỘNG** | **`while`** → "?" | đổi đúng vào lúc mình đưa ổ |
| hôm nay là thứ Bảy | 8.1 | **TĨNH** | **`when.weekday`** (tầng cuộc) | chặn ở `when`, đừng để cuộc mở rồi mới ẩn nút |

**Tổng: 22 dòng đề xuất → 16 nên là `need`/`needEquip`/`when` (ẩn hẳn), 6 nên là `while`
(ra "?").**

Thầy Phúc có `patience 80` — **cao nhất sáu người** — nên "?" với thầy rẻ nhất về mặt
đồng hồ. Nhưng thầy cũng là người **soi 0,8**: một ông giáo nghe một câu lạc đề rồi nói
*"Hả?"* là một cảnh rất đúng, và vì thế **càng không nên lạm dụng**. Bốn câu mời ngồi
phải ẩn hẳn bằng `needEquip`, không bao giờ được rơi vào "?".

## 5. §4bis — LỜI HỨA CÓ HẠN

Thầy Phúc `deTha 0,7` · `nongTinh 0,2` · `patience 80` — **người kiên nhẫn nhất hẻm**.
Theo §4bis là **người dễ tha: nhắc hai lần, rồi thôi, nhưng VẪN NHỚ**. Thầy không bỏ đi —
thầy **ghi nhận**. Và vì cả arc của thầy là **mất trí nhớ** (`phuc.quen`, ngày 22+),
nấc phạt đúng của thầy không phải giận, mà là: **thầy tưởng là mình nhớ sai.** Đó là
hình phạt nặng nhất mà hệ này có thể gây ra cho người chơi.

| nút | hứa gì | hạn | giữ lời thì sao | NUỐT LỜI thì sao (dễ tha, 3 nấc — nấc cuối: thầy tự trách mình) |
|---|---|---|---|---|
| 5.2 / 5.2.1 "Thầy chống xe chỗ này nè, **con coi giùm cho**" | trông cái xe đạp **suốt lúc thầy ăn** | **tới khi thầy ăn xong** (~60–90 s) | `calm 24` ✓ đã khai · `flag phucGuiXe` ✓ | nấc 1: thầy liếc ra cái xe (đúng câu đáp: *"mọi bữa thầy ăn mà mắt thầy ngó cái xe"*) · nấc 2: thầy đứng dậy ra đứng cạnh xe, `rel −2` · nấc 3: thầy **không gửi xe nữa** — khoá `phucGuiXe` ở những ngày sau. **Đây là lời hứa dễ kiểm nhất file**: nó chỉ đòi người chơi **đứng lại sau quầy** cho tới khi thầy ăn xong |
| 6.1.1.2 "**Từ mai** con ghi lại giùm thầy nghen" | ghi lại thầy đã trả tiền hay chưa, **từ ngày mai** | **1 ngày**, rồi lặp lại mỗi lần `phuc.quen` mở | thầy đỡ lo; `mem CARED_FOR_THEM` | lần `phuc.quen` sau, thầy hỏi lại y như chưa có gì ⇒ **người chơi mới là người quên**. Nấc 2: *"Con có ghi không con? …Thôi, chắc thầy nhớ lộn."* — `arcs.ts:259` **đã có sẵn** `c.flags.notebookEntries` cho đúng chuyện này |
| 6S:ket.1 "Thầy ngồi ăn đi. **Con nhớ giùm thầy**" | làm trí nhớ cho thầy | **cả mùa** | `rel +4` · `mem` | như trên, nhưng nặng hơn vì câu nói to hơn |
| 6S:ket.2 "Xe thầy con ngó giùm, tiền thầy con nhớ giùm luôn" | hai việc cùng lúc | xe: tới khi ăn xong · tiền: cả mùa | thầy đáp *"Thầy mắc nợ con"* | nuốt **một trong hai** cũng đủ: thầy nói câu đó rồi mình lơ cái xe là cảnh đắt nhất của nhân vật |
| 1S:ket.1 "Bữa nào thầy chỉ con pha đi thầy" | *(thầy nhận lời dạy)* | **không hạn** ("bữa nào") | `flag phucDayPhaCaPhe` | xã giao — **không nợ gì**, chỉ cần cờ để cuộc sau nhắc lại. Không cần nấc phạt |
| 4S:ket.2 "Bữa nào thầy kể con nghe tiếp nghen thầy" | *(thầy kể tiếp)* | **không hạn** | — | xã giao thuần. Giữ nguyên |
| 1.2 "Thầy uống thử một ly đi thầy, con mời" | rót một ly cà phê | **25 s** | thầy chê thẳng (1.2.1) — cảnh hay nhất cuộc | **game không có cà phê**. Khuyến nghị **xoá nhánh mời uống**, giữ cuộc: rẻ hơn nhiều so với thêm một dây chuyền đồ uống cho một câu |
| 5S:ket.2 "Dạ ổ của thầy đây thầy" | đưa ổ | **ngay** | — | cần `GIVE_BREAD`; hiện là lời nói suông |

**Tám lời hứa, không lời nào có hạn.** Hai lời hứa đắt nhất (5.2.1 trông xe, 6.1.1.2 ghi
giùm) **đều đã có một nửa hạ tầng trong code**: `calm 24` cho cái thứ nhất,
`c.flags.notebookEntries` (`arcs.ts:259`) cho cái thứ hai. Chúng chỉ thiếu **cái hạn**
và **đường thất bại**.

**Thiếu trong game:** chỉ báo "đang treo một lời hứa". Với thầy Phúc nó **bắt buộc**:
thầy không giận, thầy **tự trách mình**, nên nếu game không hiện gì thì người chơi không
bao giờ biết mình vừa đẩy một ông già vào chỗ nghi ngờ trí nhớ của chính ông.

## 6. §4ter — TRÍ NHỚ BỐN TẦNG

| tầng | chỗ file này cần | nút |
|---|---|---|
| **`c.*` trong cuộc** | **không thiếu chỗ nào, và có MẪU TỐT NHẤT cả sáu file**: 6.2 → 6.2.1 là câu `AM` đi sau một câu `RUDE_TO_THEM`, và lời đáp đọc ra rõ là thầy **chưa nguôi** (*"Con đừng giỡn cái đó với thầy. Thầy hổng còn chắc được gì nữa đâu con"*). Đây đúng là điều khoản thoát của §3.3, viết đúng | 6.2 → 6.2.1 |
| **`v.*` trong lượt ghé** | **`v.invitedSit` — thiếu, và hỏng thật.** Bốn câu mời ngồi (4S:ket.1, 5.2.1, 6S:ket.1, 6.1.2) nằm ở ba cuộc khác nhau, cùng mở được trong một lượt ghé. Mời một ông 68 tuổi ngồi **ba lần** trong một buổi sáng, ông đáp "Ờ, thầy ngồi" cả ba lần, và không lần nào ông ngồi | 4S:ket.1 · 5.2.1 · 6S:ket.1 · 6.1.2 |
| | `v.promised(ngoXe)` — 5.2, 5.2.1, 6S:ket.2 cùng hứa trông xe; đi hai nhánh là hứa hai lần | 5.2 · 5.2.1 · 6S:ket.2 |
| | `v.gaveTea` — không có nút mời trà; 1.2 mời **cà phê** và là nút duy nhất. Không lặp | 1.2 |
| **`d.*` trong ngày** | **`d.toldMe(22gam)` — hỏng rõ nhất và thấy ngay trên màn hình.** `phuc.caphe` 1.1 và `phuc.moiloi` 7.1 có câu đáp **gần như trùng từng chữ**: *"Mà con có cân không? Hai mươi hai gam, không hơn không kém"* ↔ *"Mà con có cân không? Hai mươi hai gam, không hơn."* Hai cuộc cùng mở từ ngày 3–4, nên trong một buổi sáng thầy nói y một câu hai lần | 1.1 ↔ 7.1 |
| | `d.toldMe(hocTro)` — `phuc.hocsinh` 2.1 và 8.2 trùng **nguyên câu** *"Thầy đọc xong thầy ngồi im nửa tiếng"* | 2.1 ↔ 8.2 |
| | `d.toldMe(xeDap)` — `phuc.xedap` opener và 8.1 trùng ("Cần Giuộc, bốn chục cây") | 5.x ↔ 8.1 |
| | `d.metToday` — 7.2 "Thầy ăn gì chưa thầy?" hỏi được **sau khi** đã đưa ổ cho thầy sáng nay | 7.2 |
| **`m.*` cả mùa** | `when.minVisits` dùng ở 4/8 cuộc (4, 4, 5, **8** cho `phuc.quen`) · `when.day` ở 8/8. Riêng `phuc.quen` (day 22–40, minVisits 8) là cổng `m.*` chặt nhất cả sáu file — và đúng, vì nó là cuộc nặng nhất | — |
| | `m.remembers(E)` thiếu ở **5 nút**: 3.2, 3.3 (chuyện cô Mai kể), 7.1, 8.1, 8.2 | |
| | `!m.visits(2)` — **không nút nào** giả định "lần đầu gặp" | — |

**Kết luận tầng trí nhớ:** hai chỗ thủng của thầy Phúc nằm ở hai tầng khác nhau và cùng
nặng. Ở **`v.*`**: mời ngồi ba lần một buổi sáng vào một cái ghế có thể chưa mua. Ở
**`d.*`**: thầy nói lại **nguyên văn** ba câu của mình trong cùng một ngày — và với một
nhân vật mà arc chính là **ông đang quên dần**, để ông lặp lại chính mình vì lỗi hệ thống
là làm hỏng đúng cái thứ cả nhân vật được xây để kể.

> **Ghi chú phạm vi:** phần được giao cho tôi là 6 file NPC có tên. **`walkin.json` không
> nằm trong phần này** — luật §4ter *"với `walkin.json` thì ngược lại: mọi câu giả định
> ĐÃ QUEN đều SAI"* phải được rà bởi người cầm `walkin.json`/`qua-duong.json`.
