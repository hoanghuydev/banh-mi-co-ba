# Rà thoại — ÔNG HẢI (`src/content/talks/ong-hai.json`)

> ## ⚡ REVAMP 2026-10-20 — ☠️ CHẾT TOÀN BỘ
> Rà thoại theo giọng cũ + hệ trí nhớ/quan hệ đã chết. Toàn bộ thoại viết lại giọng Nam gen Z ở R6 (CANON §9, §17.1). Chỉ giữ để truy vết nội dung cũ.

**Hợp đồng:** `docs/phase-2-he-npc/P2-07-neo-thoai-vao-the-gioi.md` (kể cả §4.1 · §4bis ·
§4ter mới thêm) · **8 cuộc · 100 nút**

**Trạng thái đo được:** `while` **1 lần** (6.1.2, và dùng **sai tên khoá**) · `forSec` **0** ·
`needEquip` **1 lần** (3S:xuong.1) · `act` **5 lần** (`STEP_ASIDE` ×1, `REFUSE` ×3 —
6.1.1.3, 6.2.2.2, 6.2.3 — và không còn gì khác).

**Nhân vật:** `nongTinh 0,9` — **người nóng tính nhất hẻm**. `patience 55`. Hai cuộc say
(`hai.say`, `hai.duoi`) đều khoá `slot: ["LULL"]`, nên tính cách "hay say" đã được neo
đúng vào giờ giấc. Hai đơn quen (`arcs.ts:123`): trước 10h ốp la **+ ly trà đá**, ăn tại
chỗ; sau 10h thì chú không nhớ mình thích gì.

**Ba chỗ hỏng rõ nhất:**
* **Khoá sai từ vựng.** 6.1.2 khai `while: ["p.hasTea"]`. §3.1 không có `p.hasTea` — khoá
  đúng là **`p.holdsTea`**. Lỗi này lặp ở **8/15 file thoại** của cả dự án (`anh-bao`,
  `anh-dung`, `ba-bay`, `ba-sau`, `be-su` ×2, `chi-lan` ×2, `ong-hai`), tức toàn bộ chỗ
  dùng `while` trong kho đều viết sai một khoá không tồn tại.
* **"Con hổng bán" mà vẫn bán.** 3.1.4 nói thẳng *"Chú say rồi chú về đi, con hổng bán"*
  — **không có `act: REFUSE`**, trong khi ba câu tương đương ở `hai.duoi` đều có. Cùng một
  lời, hai cuộc, hai kết quả khác nhau.
* **Sáu câu mời ngồi, một câu khai `needEquip`.** 3S:xuong.1 có `GHE_BAN`; 6S:diyen.1,
  6.1, 6.2.1 (qua `ref`), 6.2.2.1 thì không — và cả sáu câu đều thiếu `does` (chú gật
  "Ờ, chú ngồi" rồi vẫn đứng y chỗ cũ).

---

### hai.bienhieu — ai viết cái bảng hiệu (SHORT · day 6–40 · PEAK/MID)

> **Cả cuộc thiếu `when.needEquip: "BANG_HIEU"`.** "Bảng hiệu đỏ chữ vàng" là thiết bị mua
> được (`equipment.json`, nhóm `VAN_HANH`). Chưa mua thì chú đang chỉ vào một chỗ trống.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 1.1 | "Dạ con hổng biết chú. Ai viết vậy chú?" | — | — | — | ĐÚNG |
| 1.1.1 | "Thiệt hả chú? Chú viết đẹp quá trời." | — | — | `mem REMEMBERED_STORY` | ĐÚNG |
| 1.1.1.1 | "Chú viết lại cho con cái bảng mới đi chú." | **thiếu** `needEquip: BANG_HIEU` | — | `flag haiVietBang` (đọc ở 5.2.1.2) | **SỬA** — và nó **không nối vào SK-29**: `arcs.ts:228` đọc `signChoice === "hai"`, cờ do `story.ts:269` đặt ở quyết định ngày 24–26. Chú đã nhận lời ở thoại mà màn quyết định vẫn hỏi lại từ đầu |
| 1.1.1.2 | "Sao chú nghỉ viết vậy chú?" | — | — | — | ĐÚNG |
| 1.1.1.3 | "In máy nhanh mà rẻ hơn chú." | — | — | `rel −2` | ĐÚNG |
| 1.1.1.4 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 1.1.2 | "Hèn gì chữ nó khác mấy xe kia chú ha." | **thiếu** `needEquip: BANG_HIEU` | — | — | **SỬA** — tả chữ viền vàng trên một cái bảng có thể chưa mua |
| 1.1.3 | "Chú nói dóc hoài chú." (DUA) | — | — | `rel −1` | ĐÚNG |
| 1.2 | "Dạ chắc cô Ba thuê người ta viết chú." | **thiếu** `needEquip: BANG_HIEU` | — | — | **SỬA** |
| 1.2.1 | "Ủa. Sao chú hổng lấy tiền chú?" | — | — | — | ĐÚNG |
| 1.2.2 | "Vậy là chú với cô Ba thân lắm hả chú?" | — | — | `mem REMEMBERED_STORY` | ĐÚNG |
| 1.2.3 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 1.3 | "Chú kể chuyện hồi xưa hoài chú." (GAT) | — | — | `anger 30` · lá cuối | ĐÚNG |

### hai.congai — con gái kêu lên chung cư (SHORT · day 14–40 · minVisits 5 · PEAK/MID)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 2S:ket.1 | "Chú nghĩ kỹ đi chú. Hổng gấp đâu." | — | — | — | ĐÚNG |
| 2S:ket.2 | "Dạ. Chú ăn đi chú, nguội." | — | **thiếu** `t.served` | — | **SỬA** — mời ăn khi chú chưa cầm ổ nào |
| 2.1 | "Vậy chú tính sao chú?" | — | — | — | ĐÚNG |
| 2.1.1 | "Chung cư gần đây hông chú?" | — | — | — | ĐÚNG |
| 2.1.1.1 | "Nó thương chú nó mới kêu đó chú." | — | — | — | ĐÚNG |
| 2.1.1.2 | "Ở đây chú có ai không chú?" | — | — | `mem REMEMBERED_STORY` | ĐÚNG |
| 2.1.1.3 | "Quận 7 sướng mà chú. Đi đi chú." | — | — | `rel −1` | ĐÚNG |
| 2.1.1.4 | "Chú đi thì ai uống rượu với ai ngoài này." (DUA) | **thiếu** `m.remembers(chú say)` | — | `anger 15` | **SỬA** — trêu một ông về rượu khi có thể mình **chưa từng** thấy chú say (hai cuộc say khoá `slot: LULL`, cuộc này `PEAK/MID`) |
| 2.1.2 | "Chú ở lại đây được hông chú?" | — | — | — | ĐÚNG |
| 2.1.3 | "Chú kể chuyện nhà chi với con chú." (LANH) | — | — | `anger 20` · `mem RUDE_TO_THEM` · lá cuối | ĐÚNG |
| 2.2 | "Chú đi thì hẻm này buồn lắm chú." | — | — | `mem CARED_FOR_THEM` | ĐÚNG |
| 2.2.1 | "Con nói thiệt mà chú." | — | — | — | ĐÚNG |
| 2.2.2 | "Mà chú đi cũng phải thôi chú." | — | — | — | ĐÚNG |
| 2.3 | "Bà bán vé số có qua nói chuyện với chú hông chú?" | `bayHaiGap` ✓ | — | — | ĐÚNG — neo chéo `ba-bay.json` |
| 2.4 | "Dạ." (LANH) | — | — | — | ĐÚNG |

### hai.say — chú ghé lúc đã uống (SHORT · day 4–38 · LULL)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 3S:xuong.1 | "Dạ chú ngồi xuống ghế đi chú, con làm liền." | `needEquip: GHE_BAN` ✓ | — | `calm 30` ✓ · **thiếu** `THEY_SIT · tới khi phục vụ xong` | **CẦN CODE** — cổng thiết bị đúng, `calm` đúng, nhưng **không có hành động ngồi nào trong §3.5**: chú đáp "Ờ, ngồi thì ngồi" rồi vẫn đứng |
| 3S:xuong.2 | "Dạ chú đợi con chút." | — | — | — | ĐÚNG |
| 3S:xuong.3 | "Dạ chú đứng nhích vô trong cho đỡ nắng, con làm liền." | — | **thiếu** `w.hot` · `w.shadeFree` | `calm 22` · **thiếu** `STAND_IN_SHADE · forSec` | **CẦN CODE** — mời đứng chỗ mát khi **không có chỗ mát**; §3.5 ghi `STAND_IN_SHADE` **CHƯA — cần ô mới** |
| 3.1 | "Dạ chú đợi con chút xíu nghen chú." | — | — | — | ĐÚNG |
| 3.1.1 | "Dạ con xin lỗi chú. Con làm liền nè." | — | — | `calm 25` ✓ | ĐÚNG |
| 3.1.1.1 | "Hổng sao đâu chú. Chú mệt rồi." | — | — | `mem CARED_FOR_THEM` | ĐÚNG |
| 3.1.1.2 | "Chú uống chút nước đi chú." | **thiếu** `needEquip: BINH_TRA` | **thiếu** còn trà | `calm 28` · **thiếu** `OFFER_TEA · ~8 s` | **SỬA** — câu đáp **đã nói ra ly trà** ("Cho chú ly trà") mà không tốn một ly nào; `OFFER_TEA` §3.5 ghi "một phần (`refuseTea`)" nên đây là `SỬA`, không phải `CẦN CODE` |
| 3.1.1.3 | "Mai chú tỉnh rồi hẵng ghé chú." | **thiếu** chú đang say thật | — | `rel −2` | **SỬA** — không có khoá nào nói chú đang say; cuộc này mở theo `slot`, không theo trạng thái chú |
| 3.1.2 | "Chú đứng có hai phút hà chú." | — | **thiếu** `!t.impatient` | `anger 20` | **SỬA** — cãi về thời gian chờ mà không đọc thời gian chờ thật; nếu chú đã chờ lâu thì chính mình đang nói sai |
| 3.1.3 | "Chú la nhỏ lại giùm con chú." | — | — | `anger 15` | ĐÚNG — chú **thật sự** đang la ở `opener` |
| 3.1.4 | "Chú say rồi chú về đi, con hổng bán." (GAT) | **thiếu** chú đang say thật | — | **thiếu** `act: REFUSE` | **SỬA** — tuyên bố không bán mà vẫn bán; ba câu tương đương ở `hai.duoi` đều có `REFUSE` |
| 3.2 | "Chú nhậu về hả chú?" | **thiếu** chú đang say thật | — | — | **SỬA** |
| 3.2.1 | "Dạ con biết chú. Chú ngồi nghỉ chút đi." | — | — | `ref: xuong` (nhận `needEquip`/`calm` của nhánh con) | ĐÚNG |
| 3.2.2 | "Chú về ngủ đi chú, mai con để phần cho." | — | — | **không có gì** — hai lời hứa chồng nhau | **CẦN CODE** — (a) chú "về" mà không có `WALK_ON`; (b) "mai con để phần" là lời hứa **qua đêm** mà `PROMISE` chỉ sống tới lúc đưa bánh |
| 3.2.3 | "Ép gì. Chú ham chớ ai ép chú." (GAT) | — | — | `anger 45` · lá cuối | ĐÚNG |
| 3.3 | "…" (IM) | — | — | `anger 20` | ĐÚNG — "làm thinh" được viết ra thành một dòng, đúng luật 3 của `talk.ts` |

### hai.bongda — trọng tài ăn tiền (BARK · BOTH · day 3–40 · PEAK/MID)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 4.1 | "Dạ con hổng có coi chú." | — | — | — | ĐÚNG |
| 4.1.1 | "Chú la vậy bà con hàng xóm chịu nổi hông chú." (DUA) | — | — | — | ĐÚNG |
| 4.1.2 | "Chú kể con nghe đi chú." | — | — | — | ĐÚNG |
| 4.1.3 | "Dạ con bận lắm chú." (LANH) | — | **thiếu** `w.queue >= 1` | `rel −1` | **SỬA** |
| 4.2 | "Có chú. Trọng tài đó thổi kỳ thiệt." | — | — | — | ĐÚNG |
| 4.2.1 | "Chú rành dữ ha chú." (DUA) | — | — | — | ĐÚNG |
| 4.2.2 | "Thôi thua rồi chú ơi, kệ đi chú." | — | — | — | ĐÚNG |
| 4.2.3 | "Chú nói vậy chớ chú có biết luật đâu." (GAT) | — | — | `anger 35` · lá cuối | ĐÚNG |
| 4.3 | "Dạ." (LANH) | — | — | — | ĐÚNG |

### hai.pano — vẽ pano rạp hát (SHORT · day 8–38 · minVisits 3 · PEAK/MID)

> Cuộc neo chéo tốt nhất cả sáu file: **ba `need` chéo file** (`bayCaiLuongTalk`,
> `kietMuonBang`, `kietNhoNoi`) và **ba `flag` được đọc lại** ở `ba-bay.json` và
> `chu-kiet.json`. Đây là khuôn mẫu.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 5S:ket.1 | "Bữa nào chú kể con nghe tiếp nghen chú." | — | — | — | ĐÚNG |
| 5S:ket.2 | "Dạ ổ của chú đây chú." | — | **thiếu** `p.holdsFilled` | **thiếu** `GIVE_BREAD` | **CẦN CODE** |
| 5S:ket.3 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 5.1 | "Pano là tấm hình bự trước cửa rạp đó hả chú?" | — | — | `flag haiPano` (mở cuộc ở `ba-bay.json:655`) | ĐÚNG |
| 5.1.1 | "Chú vẽ rạp nào hả chú?" | — | — | — | ĐÚNG |
| 5.1.1.1 | "Bà Bảy hay đi coi hát ở cái rạp lớn đó chú." | `bayCaiLuongTalk` ✓ | — | `flag haiBietBay` (đọc ở `ba-bay.json:693`) | ĐÚNG — mẫu chuẩn: `need` chéo người, `flag` chéo người |
| 5.1.1.2 | "Vẽ mặt cô đào mà hổng giống thì sao hả chú?" (DUA) | — | — | — | ĐÚNG |
| 5.1.1.3 | "Giờ hổng ai vẽ nữa, chú có tiếc hông chú?" | — | — | — | ĐÚNG |
| 5.1.1.4 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 5.1.2 | "Chú Kiệt bên kia ảnh muốn có cái bảng cho xe ảnh đó chú." | `kietMuonBang` ✓ | — | — | ĐÚNG |
| 5.1.2.1 | "Ảnh ngại hỏi chú. Chú qua hỏi ảnh một tiếng đi chú." | `kietNhoNoi` ✓ | — | `flag haiKietNoi` (đọc ở `chu-kiet.json:813`) | ĐÚNG |
| 5.1.2.2 | "Chú vẽ cho ảnh đi chú. Chú đâu có mất gì." | — | — | **thiếu** `flag haiKietNoi` | **SỬA** — cùng đích với 5.1.2.1 ("thôi, chú rảnh thấy mồ") mà không đặt cờ: hai đường một đích, một đường mất đích |
| 5.1.2.3 | "Dạ chú tính sao thì tính chú." (LANH) | — | — | — | ĐÚNG |
| 5.1.3 | "Dạ con hổng ngờ chú làm cái nghề đó chú." | — | — | — | ĐÚNG |
| 5.2 | "Chú vẽ bằng gì hả chú? Sơn hả chú?" | — | — | — | ĐÚNG |
| 5.2.1 | "Pha bằng mắt mà trúng hả chú?" | — | — | `mem REMEMBERED_STORY` | ĐÚNG |
| 5.2.1.1 | "Tay run thì vẽ chậm lại thôi mà chú." | — | — | `mem CARED_FOR_THEM` | ĐÚNG |
| 5.2.1.2 | "Chú vẽ lại cái bảng xe con đi chú. Con hổng chê đâu." | `haiVietBang` ✓ | — | — | **ĐÚNG** — và là **mẫu viết lời hứa chuẩn nhất cả sáu file**: chú *từ chối hứa* ("Để chú coi. Chú hổng hứa. Chú hứa rồi chú làm hổng nổi thì kỳ"). Không hứa thì không nợ |
| 5.2.1.3 | "Run thì thôi chú, nghỉ cho khoẻ chú." (LANH) | — | — | `rel −2` | ĐÚNG |
| 5.2.2 | "Chú hồi đó chắc đắt hàng lắm ha chú." (DUA) | — | — | — | ĐÚNG |
| 5.2.3 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 5.3 | "Dạ con đang đông khách chú ơi. Chút nữa chú kể." (LANH) | — | **thiếu** `w.queue >= 2` | `rel −2` | **SỬA** |

### hai.duoi — chú say chửi người đứng ngoài (FULL · day 6–38 · LULL)

> `opener` khai một **người thứ ba đang đứng đó** ("cái thằng cha đứng kia kìa"). Không có
> khoá nào kiểm người đó có thật — cả cuộc treo trên một nhân vật có thể không tồn tại.

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 6S:diyen.1 | "Dạ chú ngồi ghế kia đi chú. Con bưng ổ ra cho chú." | **thiếu** `needEquip: GHE_BAN` | — | `calm 28` · **thiếu** `THEY_SIT` + `GIVE_BREAD` | **SỬA** — 3S:xuong.1 của chính file này **đã khai** `GHE_BAN`; câu này thì không. Hai câu mời ngồi, một cái ghế |
| 6S:diyen.2 | "Dạ chú đứng qua bên này cho người ta mua nghen chú." | — | **thiếu** `w.queue >= 1` | `STEP_ASIDE` ✓ | **SỬA** — act đúng, nhưng "cho người ta mua" khi **không có người ta nào** là đúng khuôn lỗi "bảo chị chen hàng trong khi chị không chen" |
| 6S:diyen.3 | "Dạ chú vô đứng trong bóng mát với con. Con bưng ổ ra cho chú." | — | **thiếu** `w.shadeFree` | `calm 26` · **thiếu** `STAND_IN_SHADE · forSec` + `GIVE_BREAD` | **CẦN CODE** — mời vào đứng sau quầy: không có ô đứng, không có đường cho khách vào trong |
| 6S:diyen.4 | "Dạ." (LANH) | — | — | — | ĐÚNG |
| 6.1 | "Chú ơi chú… Chú ngồi xuống cái đã." | **thiếu** `needEquip: GHE_BAN` | — | `calm 26` · **thiếu** `THEY_SIT` | **SỬA** |
| 6.1.1 | "Người ta sợ chú rồi, người ta đi hết trơn." | **thiếu** — có khách bỏ đi thật? | — | — | **SỬA** — khai một chuyện đã xảy ra mà game không ghi; chú còn nhận lỗi theo ("chú làm con ế rồi hả con") |
| 6.1.1.1 | "Dạ hổng sao chú. Mà bữa khác chú đừng vậy nghen chú." | — | — | `mem CARED_FOR_THEM` | ĐÚNG |
| 6.1.1.2 | "Dạ chú uống rồi chú đừng ra đường nữa chú." | — | — | — | ĐÚNG |
| 6.1.1.3 | "Chú làm con mất khách đó chú. Chú đi về đi chú." (GAT) | **thiếu** — như 6.1.1 | — | `REFUSE` ✓ · `anger 35` | **SỬA** — act đúng, lời buộc tội không kiểm |
| 6.1.2 | "Dạ chú uống ly trà đá cái đã chú." | **thiếu** `needEquip: BINH_TRA` | `p.hasTea` ✗ **sai tên** → `p.holdsTea` | `calm 30` · **thiếu** `OFFER_TEA · ~8 s` | **SỬA** — nút `while` **duy nhất** của file, và nó khai một khoá không có trong §3.1 |
| 6.1.3 | "Dạ thằng đó nó nhìn cái bảng hiệu chớ nó đâu nhìn chú." (DUA) | **thiếu** `needEquip: BANG_HIEU` + người thứ ba có thật | — | `calm 22` | **SỬA** |
| 6.2 | "Dạ chú nói nhỏ lại giùm con chú. Con còn khách." | — | **thiếu** `w.queue >= 1` | `anger 15` | **SỬA** — "con còn khách" là một sự thật đếm được |
| 6.2.1 | "Dạ. Chú ngồi xuống đi chú, con làm ổ cho chú." | — | — | `calm 25` · `ref: diyen` | ĐÚNG |
| 6.2.2 | "Chú mà còn la nữa là con hổng bán chú đâu nghen chú." | — | — | `anger 25` | ĐÚNG — **doạ**, chưa làm; chưa doạ thì chưa nợ act |
| 6.2.2.1 | "Dạ con hổng đuổi chú. Chú ngồi đi chú." | **thiếu** `needEquip: GHE_BAN` | — | `calm 28` · `mem CARED_FOR_THEM` | **SỬA** |
| 6.2.2.2 | "Chú đi mua chỗ khác giùm con chú." (LANH) | — | — | `REFUSE` ✓ · `anger 30` | ĐÚNG |
| 6.2.2.3 | "Dạ." (IM) | — | — | — | ĐÚNG |
| 6.2.3 | "Chú say rồi chú về đi, đứng đây làm gì chú." (GAT) | — | — | `REFUSE` ✓ · `anger 55` · lá cuối | ĐÚNG — so với 3.1.4 cùng lời mà **không** có `REFUSE` |
| 6.3 | "…" (IM) | — | — | `anger 20` | ĐÚNG |

### hai.moiloi — người chơi bắt chuyện (PLAYER_ONLY · SHORT · day 7–40 · PEAK/MID)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 7.1 | "Hồi này chú có cầm cọ lại chưa chú?" | **thiếu** `haiPano`/`haiVietBang` | — | — | **SỬA** — "cầm cọ lại" chỉ có nghĩa sau `hai.bienhieu`/`hai.pano` |
| 7.2 | "Tối qua chú có coi đá banh hông chú?" (DUA) | — | — | — | ĐÚNG |
| 7.3 | "Chú uống từ sáng rồi phải hông. Về đi chú." (GAT) | **thiếu** chú đang say thật | — | `anger 25` | **SỬA** — buộc tội say ở khung giờ `PEAK/MID`, trong khi trạng thái say chỉ tồn tại ở `LULL` |

### hai.moiloi2 — người chơi bắt chuyện, lớp sau (PLAYER_ONLY · SHORT · day 15–40 · minVisits 5)

| nút | câu người chơi | TRƯỚC (need) | LÚC NÓI (while) | SAU (does · forSec) | phán |
|---|---|---|---|---|---|
| 8.1 | "Con gái chú còn gọi hoài hông chú?" | **thiếu** cờ đã nghe `hai.congai` | — | — | **SỬA** — `hai.congai` không đặt cờ nào |
| 8.2 | "Chú ăn gì chưa chú? Con làm cho chú ổ nghen." | — | **thiếu** `!p.soldOut` · `!t.hasOrder` | `calm 10` · **thiếu** — không có đơn nào được tạo | **SỬA** — hứa làm một ổ khi có thể đã hết sạch bánh |
| 8.3 | "Thôi chú. Hổng có gì." (LANH) | — | — | — | ĐÚNG |

---

## 1. Thống kê

| phán | số nút | % |
|---|---|---|
| `ĐÚNG` | **69** | 69,0 % |
| `SỬA` | **26** | 26,0 % |
| `XOÁ` | **0** | 0 % |
| `CẦN CODE` | **5** | 5,0 % |
| **tổng** | **100** | |

Theo cuộc (ĐÚNG/SỬA/XOÁ/CẦN CODE): `hai.bienhieu` 10/3/0/0 · `hai.congai` 13/2/0/0 ·
`hai.say` 8/5/0/3 · `hai.bongda` 8/1/0/0 · `hai.pano` 19/2/0/1 · `hai.duoi` 9/9/0/1 ·
`hai.moiloi` 1/2/0/0 · `hai.moiloi2` 1/2/0/0.

`hai.duoi` là cuộc hỏng nặng nhất (**9/19 phải sửa**) — nghịch lý, vì nó cũng là cuộc có
nhiều `act` nhất file. Nó biết **làm** (`REFUSE`, `STEP_ASIDE`) nhưng không biết **kiểm**
(không `need` nào cho "có khách bỏ đi", "có người thứ ba đứng đó", "ngoài quầy còn ai").

**Trí nhớ trong một cuộc (§3.3): SẠCH.** Sáu nút `GAT` (1.3, 2.1.3, 3.1.4, 3.2.3, 4.2.3,
6.2.3) và hai nút `IM` nặng (3.3, 6.3) đều là **lá cuối**. Không nút `CHUI` nào — đáng
chú ý, vì `talk.ts` nói rõ *"với ông Hải thì `CHUI` là bắt được tần số"*: nhân vật hợp
`CHUI` nhất hẻm lại **không có một dòng `CHUI` nào**. Đó là một lỗ nội dung, không phải
lỗi neo.

**Tính cách:** đúng. `nongTinh 0,9` được dùng thật — chú ăn `anger` cao hơn mọi người
(45, 55, 60), và hai cuộc say khoá đúng `slot: LULL`. Không nút nào bắt chú cư xử ngược tính.

## 2. Đề xuất khoá mới

| khoá đề xuất | nghĩa | nút cần | vì sao §3 không đủ |
|---|---|---|---|
| `t.drunk` | người này **đang say** | 2.1.1.4 · 3.1.1.3 · 3.1.4 · 3.2 · 7.3 | §3.2 có `t.state(Y)` (tâm trạng hôm nay) nhưng say là một **trạng thái của lượt ghé**, không phải tâm trạng cả ngày. Năm nút buộc tội/trêu về rượu hiện không kiểm gì |
| `w.lostCustomer` | có khách bỏ hàng đi trong N giây vừa rồi | 6.1.1 · 6.1.1.3 | `w.queue >= N` đếm người **đang** đứng, không ghi người **đã** bỏ đi |
| `w.bystander` | có một người thứ ba đang đứng gần quầy | cả cuộc `hai.duoi` · 6.1.3 | §3.2 chỉ mô tả người đang nói chuyện với mình |
| `t.waitedSec <= N` | họ mới chờ ngần đó giây | 3.1.2 ("chú đứng có hai phút hà") | `t.impatient` là ngưỡng 0,6 cố định; câu này cãi về **con số phút** cụ thể |

**Sửa từ vựng (không phải khoá mới):** `p.hasTea` → **`p.holdsTea`** — lỗi ở 6.1.2 và ở
7 file khác trong kho.

**Cờ nội dung cần thêm:** `haiKeConGai` (cho 8.1) · `haiKeSay` / dùng `t.drunk` (cho 2.1.1.4,
7.3) · nối `haiVietBang` → `signChoice` (cho SK-29).

## 3. Hành động cần code

| hành động | nút cần | thời lượng đề xuất | thiếu gì trong game |
|---|---|---|---|
| `THEY_SIT` | 3S:xuong.1 · 6S:diyen.1 · 6.1 · 6.2.1 · 6.2.2.1 (5 nút) | **tới khi phục vụ xong**, rồi họ đứng dậy đi | **Không có trong §3.5.** `GHE_BAN` chỉ là hình vẽ ở `StallScene:3081`, không phải chỗ ngồi được. Năm nút nói "chú ngồi đi" và chú đáp "ờ chú ngồi" — rồi không ai ngồi |
| `STAND_IN_SHADE` + `LEAVE_SHADE` | 3S:xuong.3 · 6S:diyen.3 | `forSec` **45–90 s**, hết giờ quay lại mục đích cũ | §3.5 ghi **CHƯA — cần ô mới**; `map.ts` không có ký tự nào cho ô hóng mát |
| `GIVE_BREAD` | 5S:ket.2 · 6S:diyen.1 · 6S:diyen.3 | tới khi ăn xong | §3.5 ghi **CHƯA** |
| `WALK_ON` | 3.2.2 | ngay | §3.5 ghi **CHƯA**. Chú nói "thôi chú về" rồi đứng nguyên |
| `PROMISE_DEED{ việc, hạn ngày }` | 3.2.2 ("mai con để phần cho") | 1 ngày | `PROMISE` hiện chỉ treo món kẹp vô ổ, kiểm lúc đưa bánh — không qua đêm được |
| **`while` nói chung** | 10 nút | — | `TalkNode.while` có kiểu nhưng `visibleOptions()`/`talkGate()` không đọc; "?" của §4 chưa có. Nút 6.1.2 là bằng chứng: nó **đã viết** `while` và không ai thực thi, nên viết sai tên khoá cũng không ai báo |

---

## 4. §4.1 — "?" là lưới an toàn: xếp lại TĨNH vs ĐỘNG

Áp luật mới cho mọi dòng `while` đề xuất ở trên. Mốc đòi tỉ lệ nhịp kết bằng `?` **dưới 5 %**,
nên chỉ sự thật **đổi được trong lúc đang đọc** mới xứng đáng là `while`.

| sự thật đề xuất | nút | TĨNH / ĐỘNG | khai bằng | lý do |
|---|---|---|---|---|
| `needEquip: GHE_BAN` · `BINH_TRA` · `BANG_HIEU` | 3S:xuong.1, 6S:diyen.1, 6.1, 6.2.2.1, 3.1.1.2, 6.1.2, 1.1.1.1, 1.1.2, 1.2, 6.1.3 | **TĨNH** | **`needEquip`** → ẩn hẳn | mua rồi là mua, không mất giữa cuộc |
| `p.holdsTea` · `p.holdsFilled` · `!p.soldOut` | 6.1.2, 5S:ket.2, 6S:diyen.1/3, 8.2 | **TĨNH** | **`need`** → ẩn hẳn | thẻ thoại khoá phím; tay người chơi không đổi được trong lúc thẻ mở |
| `t.drunk` | 2.1.1.4, 3.1.1.3, 3.1.4, 3.2, 7.3 | **TĨNH** | **`need`** → ẩn hẳn | chú say lúc tới là say suốt lượt ghé; không tỉnh giữa cuộc |
| `m.remembers(…)` các cờ "đã kể" | 7.1, 8.1, 2.1.1.4 | **TĨNH** | **`need`** → ẩn hẳn | quá khứ không đổi |
| `w.queue >= 1` · `>= 2` | 4.1.3, 5.3, 6S:diyen.2, 6.2 | **ĐỘNG** | **`while`** → "?" | người xếp hàng tới và đi trong lúc mình đọc — đúng loại "vừa nãy còn đúng" |
| `w.lostCustomer` | 6.1.1, 6.1.1.3 | **ĐỘNG** | **`while`** → "?" | xảy ra giữa cuộc được |
| `t.impatient` / `t.waitedSec` | 3.1.2 | **ĐỘNG** | **`while`** → "?" | chú hết kiên nhẫn ngay trong lúc mình đọc dòng thứ ba |
| `t.served` | 2S:ket.2 | **ĐỘNG** | **`while`** → "?" | mình vừa đưa ổ xong thì nó đổi |
| `w.hot` · `w.shadeFree` | 3S:xuong.3, 6S:diyen.3 | **ĐỘNG** | **`while`** → "?" | trời tạnh, hoặc có người chiếm chỗ mát |
| `w.bystander` | `hai.duoi`, 6.1.3 | **ĐỘNG** | **`while`** → "?" | người đó bỏ đi được |

**Tổng ở file này: 24 dòng đề xuất → 18 nên là `need`/`needEquip` (ẩn hẳn), 6 nên là
`while` (ra "?").** Tức **ba phần tư** chỗ hỏng của ông Hải xử bằng ẩn nút, không bằng
bong bóng "?" — đúng tinh thần *"hạn chế hiện câu gợi ý trả lời lạc đề"*.

## 5. §4bis — LỜI HỨA CÓ HẠN

Ông Hải `nongTinh 0,9` ⇒ theo bảng §4bis là **người nóng tính: bỏ nấc một, nói nặng rồi
đi luôn**. `patience 55` (thấp thứ hai trong sáu người).

| nút | hứa gì | hạn (giây thật) | giữ lời thì sao | NUỐT LỜI thì sao (nóng tính — 2 nấc) |
|---|---|---|---|---|
| 3.1.1.2 "Chú uống chút nước đi chú" | rót một ly trà đá | **25 s** | `calm 28` như đã khai · `PROMISE_KEPT` | **nấc 1 (bỏ qua)** → **nấc 2 @25 s**: *"Nước đâu con? Thôi khỏi."* `anger +25`, `rel −3` · **nấc 3 @40 s**: bỏ đi, không mua, `mem BROKEN_PROMISE` |
| 6.1.2 "Dạ chú uống ly trà đá cái đã chú" | rót một ly trà đá | **25 s** | `calm 30` như đã khai | như trên; nặng hơn vì chú đang quạu sẵn (`hai.duoi`): nấc 2 ở **18 s** |
| 6S:diyen.1 / 6S:diyen.3 "Con bưng ổ ra cho chú" | bưng ổ ra chỗ chú ngồi/đứng | **15 s** | `calm 26–28` · chú thôi chửi | **nấc 2 @15 s**: chú đứng dậy, chửi một câu · **nấc 3 @25 s**: bỏ đi + `REFUSE` ngược (chú tự bỏ) |
| 3.1.1 "Con làm liền nè" / 3S:xuong.1–2 "con làm liền" | đưa ổ ra | **30 s** | `calm 25–30` | **nấc 2 @30 s**: *"Chút xíu là bao lâu?"* (câu này **đã có sẵn** ở `opener` 3.1 — dùng lại được) · **nấc 3 @45 s**: bỏ đi |
| 6.2.1 "Con làm ổ cho chú" | đưa ổ ra | **30 s** | `calm 25` | như trên |
| 8.2 "Con làm cho chú ổ nghen" | làm một ổ | **30 s** | `calm 10` | như trên — và nếu `p.soldOut` thì **không được phép hứa** (`need: "!p.soldOut"`) |
| 3.2.2 "Mai con để phần cho" | để dành một ổ cho ngày mai | **1 ngày** | `mem CARED_FOR_THEM` | hôm sau chú tới, không có phần ⇒ `BROKEN_PROMISE` nặng. **Chú nóng tính: không nhắc, đi luôn** |
| 1.1.1.1 "Chú viết lại cho con cái bảng mới đi chú" | *(người chơi không hứa — chú hứa)* | — | — | chú **tự rút lui** ở 5.2.1.2 ("chú hổng hứa") — **đúng mẫu**, không cần hạn |

**Bảy lời hứa, không lời nào có hạn.** Sáu trong bảy là lời hứa **trong lượt ghé** (trà,
bưng ổ, làm ổ) — đúng nguyên văn chủ dự án: *"đi rót trà mà họ không rót, bắt người ta
đợi, thì họ cũng bỏ đi hay ít nhất chửi rồi bỏ đi"*. Với ông Hải, "chửi rồi bỏ đi" là
đúng tính cách tới từng chữ.

**Thiếu trong game:** không có chỉ báo "đang treo một lời hứa" trên đầu khách hay ở khung
nhắc. CANON T5 đòi rủi ro phải đọc được trước — phạt người chơi vì quên ly trà mà game
không nhắc là phạt trí nhớ, không phạt lựa chọn.

## 6. §4ter — TRÍ NHỚ BỐN TẦNG

| tầng | chỗ file này cần | nút |
|---|---|---|
| **`c.*` trong cuộc** | **không thiếu chỗ nào** — mọi `GAT`/`IM` nặng đều là lá cuối | — |
| **`v.*` trong lượt ghé** | **`v.gaveTea` — thiếu, và hỏng thật.** `hai.say` và `hai.duoi` **cùng khoá `slot: LULL`**, nên trong một lượt ghé người chơi mời trà được **hai lần** (3.1.1.2 rồi 6.1.2) và chú nhận cả hai, mỗi lần một `calm` riêng. Thêm nữa: đơn quen buổi sáng của chú (`arcs.ts:125`) **đã gồm "Cho xin ly trà đá"** — nên câu mời trà có thể là ly **thứ ba** | 3.1.1.2 · 6.1.2 |
| | `v.promised(X)` — bảy lời hứa ở §5 không chỗ nào treo | xem bảng §5 |
| | `v.apologised` — 3.1.1 ("con xin lỗi chú") và 6.1.1.1 ("chú đừng vậy nghen") lặp được trong một lượt | 3.1.1 · 6.1.1.1 |
| **`d.*` trong ngày** | `d.toldMe(bongda)` — `hai.bongda` (BARK, `BOTH`) và 7.2 **cùng nội dung "tối qua coi đá banh"**; trong một ngày người chơi nghe được cả hai, lần hai chú kể y hệt như chưa kể | 4.x ↔ 7.2 |
| | `d.toldMe(congai)` — `hai.congai` và 8.1 cùng chuyện con gái gọi | 2.x ↔ 8.1 |
| **`m.*` cả mùa** | `m.remembers(E)` thiếu ở **5 nút nhắc lại chuyện cũ**: 7.1 (cầm cọ), 8.1 (con gái), 2.1.1.4 (rượu), 3.1.1.3 + 7.3 (say) | |
| | `!m.visits(2)` — **không nút nào** ở file này giả định "lần đầu gặp"; ông Hải là người quen cả hẻm, `when.minVisits` đã chặn đúng. Không có lỗi ở tầng này | — |

**Kết luận tầng trí nhớ:** chỗ thủng nặng nhất của ông Hải là **`v.*` (trong lượt ghé)** —
cụ thể là **mời trà hai lần trong một lượt**, do hai cuộc say dùng chung `slot: LULL`.
Đó là lỗi đọc ra ngay trên màn hình, không phải lỗi lý thuyết.

> **Ghi chú phạm vi:** phần được giao cho tôi là 6 file NPC có tên
> (`co-mai`, `thay-phuc`, `chi-hanh`, `ong-hai`, `anh-bao`, `chi-lan`).
> **`walkin.json` không nằm trong phần này** — luật "khách vãng lai không có trí nhớ qua
> ngày" của §4ter phải được rà bởi người cầm `walkin.json`/`qua-duong.json`.
