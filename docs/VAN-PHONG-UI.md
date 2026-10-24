# Văn phong chữ trong game — UI nói tiếng phổ thông, chỉ người nói giọng Nam

> **Luật:** giọng miền Nam chỉ sống trong **lời thoại**. Mọi chữ do *game* viết ra — nút, menu, nhãn, thông báo, hướng dẫn, sổ tay, tooltip — viết **tiếng Việt phổ thông**.
> CANON §4 "Tiếng Việt giọng miền Nam" nói về **giọng nhân vật**, không phải giọng giao diện.

Lý do: giọng là **đặc điểm của người**. Cô Ba nói "bỏ gì vô ổ" vì cô là người Sài Gòn. Cái nút không phải người Sài Gòn — nút đeo giọng vùng miền thì người chơi nghe như game đang nhại, và nhãn mất nghĩa chuẩn khi đọc nhanh giữa giờ cao điểm.

---

## 1. Phạm vi

| Giọng Nam — **bắt buộc** | Phổ thông — **bắt buộc** |
|---|---|
| `content/talks/**`, `content/lines/**` | `src/ui/**` · `src/scenes/**` (mọi chuỗi hiện ra màn hình) |
| `response` trong `content/rules/**` | Tên trạm · tên việc · tên thao tác · phím tắt |
| Bark, thoại mở đầu, thoại kết, `content/intro.ts` | Nhãn hệ thống trong sổ tay (cột, tiêu đề, trạng thái) |
| `content/season/knowledge.json` (toàn bộ là thoại) | `sim/gearHint.ts` — dấu vết dưới thẻ đồ nghề |
| Tên thành tựu trong `achievements.json` — **tục ngữ / lời nói thật**, giữ nguyên | Chuỗi lý do trả cho UI, ví dụ `day.canMoveTo` |
| `sim/recall.ts` — mảnh ký ức, vì nó điền vào `{m.what}` **trong câu người ta nói** | **Lời kể sự kiện** — `kind: "log"`, `morningLines`, `eveningLines`, `timeline`, `noteRel` |
| Câu `say` / `lines` / lời nghe lỏm trong `sim/story.ts`, `suppliers.ts`, `till.ts`, `obligations.ts` | Thông báo hệ thống · hướng dẫn · nút · menu · hộp xác nhận |

Biên giới nằm ở dấu ngoặc kép: **có người phát ra câu đó** thì giọng Nam, không thì phổ thông. Một màn hình trộn cả hai là bình thường — `Cô Ba: "Bỏ đồ chua vô đi con."` ngay dưới nút `Bỏ thêm nhân`.

**Tên món, tên đồ, tên chỗ không phải giọng — giữ nguyên.** `đồ chua`, `xíu mại`, `ba rọi`, `ổ`, `rổ`, `quầy`, `hẻm` là *tên vật*, không phải lựa chọn vùng miền. Đừng "chuẩn hoá" chúng thành `rau ngâm chua`, `bát`, `cái bánh`.

---

## 2. Nền research

Đọc ba bộ chuỗi UI tiếng Việt thật — **Mindustry** `bundle_vi.properties` (3.640 dòng), **OpenTTD** `vietnamese.txt` (6.042 dòng), bảng thuật ngữ Việt hoá của Microsoft — cộng hướng dẫn bản địa hoá game cho thị trường Việt. Bốn điều thấy được:

1. **Không một từ giọng vùng nào.** 0 lần `hổng`, `nè`, `giùm`, `xíu`, `bự`, `mắc`, `nghen`. 18 lần `vô` đều là Hán-Việt (`vô hiệu`, `vô hạn`) — không lần nào là `vào`.
2. **Nút không có chủ ngữ.** `Lưu`, `Đóng`, `Thoát`, `Hủy bỏ`, `Đồng ý`, `Tiếp tục`, `Bỏ qua`, `Đổi tên`, `Chơi thử`. Động từ đứng đầu, hết câu.
3. **Nhãn là danh ngữ.** `Âm thanh`, `Bản đồ`, `Thống kê`, `Thời gian chơi`, `Mục tiêu nhiệm vụ`. Không `Xem thống kê`, không `Thống kê của bạn`.
4. **Thông báo chạy theo khuôn.** `Không thể <việc> …` · `Đã <việc>` · `Đang <việc>…` · `Không tìm thấy <thứ>`. `bạn` chỉ xuất hiện trong hộp xác nhận và câu cảnh báo dài — không bao giờ trên nút hay nhãn.

---

## 3. Năm quy tắc viết

**V1 — Nút: động từ, không chủ ngữ, ≤ 3 từ.**
`Bỏ qua` · `Chơi lại ngày này` · `Về sảnh` · `Đóng`.
Không: `Bạn hãy bỏ qua` · `Nhấn để bỏ qua` · `Bỏ qua nhé`.

**V2 — Nhãn và menu: danh ngữ, không động từ, không sở hữu.**
`Công thức món` · `Việc cần làm` · `Sổ tay` · `Nguồn hàng` · `Âm thanh`.
Không: `Xem công thức` · `Sổ tay của bạn` · `Các việc cần làm`.

**V3 — Hướng dẫn: `<phím>` rồi `để` rồi việc. Một câu, một việc.**
`E — nhấc rổ` · `Giữ E để rót trà` · `WASD đi · Shift chạy · Tab sổ tay`.
Không: `Bạn hãy nhấn E để nhấc rổ lên nhé` · `Hãy thử giữ E xem sao`.
Dạy **thao tác**, không dạy **lý do**. Lý do để nhân vật nói.

**V4 — Thông báo: nói trạng thái, bốn khuôn, không giải thích.**

| Khuôn | Dùng khi | Ví dụ |
|---|---|---|
| `Đã <việc>` | xong rồi | `Đã lưu` · `Đã bán 12 ổ` |
| `Đang <việc>…` | đang chạy | `Đang lưu…` |
| `Không đủ <thứ>` | thiếu tài nguyên | `Không đủ vốn` · `Không đủ đồ chua` |
| `Không thể <việc>` | chặn hành động | `Không thể bán — xe trống` |

Không: `Rất tiếc, bạn không đủ vốn để mua món này rồi!`

**`rồi` không phải lỗi vùng miền.** Nó là thể hoàn thành của tiếng Việt chuẩn, và nó ở lại trong **lời nhắc tại chỗ** — câu mà cái trạm nói về trạng thái của chính nó: `lò đầy rồi`, `khét rồi`, `dưới sàn hết chỗ rồi`. Bốn khuôn trên là cho **thông báo hệ thống** (lưu, thiếu tài nguyên, chặn hành động) và cho **nhãn nút**, nơi một hình dạng cố định giúp đọc nhanh: nút ghi `Hết mùa`, không `Hết mùa rồi`.

**V5 — Hình thức.**
Tiêu đề, nút và hộp xác nhận viết hoa chữ đầu, phần còn lại viết thường — `Lưu và về sảnh`, không `Lưu Và Về Sảnh`, không `LƯU VÀ VỀ SẢNH` (chữ in toàn bộ chỉ dành cho tiêu đề bảng đã chốt trong art).
Lời nhắc tại chỗ và toast giữ **chữ thường** theo đúng lệ của game — `thớt — bấm E để lau thớt`, `bỏ vào thùng`. Đừng viết hoa chúng lên cho "chuẩn".
Số: chữ số, dấu chấm nghìn, `₫` — `25.000₫`. Đọc thành lời (`hai mươi lăm ngàn`) **chỉ trong thoại**.
Một dấu chấm hết câu thông báo dài; nút và nhãn không có dấu chấm. `!` chỉ cho lỗi nặng. Không emoji.

---

## 4. Bảng đổi từ

Bên trái **chỉ được** xuất hiện trong thoại. Bên phải là chữ của UI.

| Thoại (giọng Nam) | UI (phổ thông) |
|---|---|
| vô | vào |
| hổng · hông | không |
| …gì hết · …nào hết | bỏ `hết`: `không còn gì` |
| giùm | giúp — hoặc viết lại bỏ hẳn |
| một xíu · chút xíu | một chút · ít |
| bự | lớn |
| mắc | đắt |
| lẹ | nhanh |
| kiếm | tìm |
| chừng nào | khi nào |
| mối | nguồn hàng · nhà cung cấp |
| nghen · nha · nhé · nè · đó · á (cuối câu) | bỏ |
| đặng · hồi · bữa | để · lúc · ngày |

---

## 5. Câu không được viết

- Hỏi lại người chơi ngoài hộp xác nhận — `Bạn có muốn thử lại không?`
- Khen và cổ vũ — `Tuyệt vời!`, `Làm tốt lắm!`, `Cố lên!`
- Rào trước đón sau — `Hãy`, `Vui lòng`, `Lưu ý rằng`, `Rất tiếc`, `Đừng lo`.
- Giải thích cơ chế trong thông báo. `Không đủ vốn` là đủ; vì sao hết vốn thì người chơi tự thấy, hoặc nhân vật nói.
- Hai từ cho một thứ. Đã gọi `nhân` thì mọi nơi là `nhân` — không chỗ `nhân` chỗ `topping` chỗ `nguyên liệu`.
- Nói thay cái bảng. Bảng hiện **dữ liệu**; nhận xét về dữ liệu là việc của nhân vật.

---

## 6. Giao diện **hiện** cái đó, không **kể** cái đó

> **Luật V6 — màn hình nào cũng trông như đúng thứ nó đang là, và không giải thích chính nó.**
> App ghi chú trông như app ghi chú. Trang đánh giá trông như trang đánh giá. Người chơi nhìn là hiểu — không cần một dòng chữ dắt tay.

Ba thứ **cấm** viết ra:

| Cấm | Vì sao | Thay bằng |
|---|---|---|
| **Dắt tay** — `Hãy note vào đây`, `Hãy bán hàng để có đánh giá`, `Nhấn vào để xem` | App thật không ai viết vậy. Ô nhập trống + con trỏ nháy là đủ | Để trống, hoặc placeholder một từ |
| **Tự thuật** — `Chủ quán đã phản hồi`, `Đã gửi phản hồi thành công` | Phản hồi hiện ra ngay dưới comment khách là đã thấy rồi. Dán nhãn lên nó là thừa | Hiện đúng hình dạng quen: comment khách → comment mình, như app social |
| **Kể cơ chế người chơi thấy được** — `Giá đắt nên 15% khách bỏ đi`, `Chờ lâu nên khách chấm sao thấp` | Khách **diễn ra trước mắt**: họ bỏ đi, họ chê giá, họ chấm sao. Viết thêm là nói lại cái vừa xảy ra | Để khách diễn. Bảng chỉ hiện dữ liệu |

**⚠️ Hiệu ứng ngầm thì PHẢI ghi.** Thay đổi nhỏ, chậm, cộng dồn — thứ người chơi **không đo nổi bằng mắt** — thì nói rõ, kèm mức hiện tại:
`Nhan sắc +1 (cấp 3/12). Kiên nhẫn của khách +1 giây, vĩnh viễn, cộng dồn. Hiện tại: +3 giây.`
Giấu mấy con số này đi thì phần thưởng thành vô nghĩa — người chơi không biết mình vừa được gì.

**Phép thử — một người chơi ngồi xuống có tự thấy điều này không?**

| Thấy được | Không thấy được |
|---|---|
| Khách bỏ đi vì giá · khách chê · số sao tụt · giỏ hàng cộng tiền · danh sách trống | +1 giây kiên nhẫn · buff cộng dồn · thời hạn hiệu lực · xác suất ẩn · điều kiện mở khoá |
| → **đừng viết** | → **phải viết, kèm con số** |

Giữa hai cột là **hướng dẫn nhẹ**: một câu ngắn ở đúng chỗ cần, không phải đoạn văn dạy dỗ.

**Trống thì trông như trống.** Danh sách chưa có gì thì để khung rỗng của chính nó (trang đánh giá: tên quán, chỗ chấm sao chưa có số, 0 đánh giá). Không viết câu an ủi, không viết hướng dẫn, không viết lý do.

**Ngoại lệ duy nhất:** hướng dẫn ngày đầu — chỗ đó *được phép* dạy thao tác, theo khuôn V3 (`<phím>` + `để` + việc). Dạy **bấm gì**, vẫn không kể **cơ chế bên dưới**.

---

## 6a. Nhãn theo thiết bị

Cùng một việc, PC và cảm ứng nói khác nhau. Chuỗi hiện màn hình có nhắc cách bấm thì viết bằng `hint(pc, touch)` (`core/device.ts`).

| Quy tắc | PC | Cảm ứng |
|---|---|---|
| PC nói **phím** | `thùng rác — bấm E bỏ` | — |
| Cảm ứng **bỏ cụm phím**, chỉ giữ việc (nút ngữ cảnh đã mang nhãn) | — | `thùng rác — bỏ` |
| Việc có nút riêng thì gọi tên nút | `dưới sàn có đồ, bấm Q nhặt lên` | `dưới sàn có đồ, bấm Nhặt` |
| Việc chỉ có trên PC thì cảm ứng để trống | `… đang chờ mình trả lời — bấm F` | `… đang chờ mình trả lời` |
| Cảm ứng không nhắc phím, `chuột`, `hover`, `rê`, `click` | — | `Chạm vào ổ bánh` |
| Nhãn nút hành động ngắn, **động từ trước** | — | `Nướng` · `Nhặt` · `Gói lại` |

- Nhãn trên nút cảm ứng gồm một cụm 1–2 từ, vừa nút; không câu đầy đủ.
- Thao tác chỉ có ở một bên (vd. `Tab` mở điện thoại) thì bên kia nói **nút ở đâu**, không nói thiếu.

---

## 7. Cách kiểm

| Chỗ | Làm gì |
|---|---|
| `src/content/redlines.json` → `northern` | đã chặn **từ Bắc trong thoại** (L008). Rule này là chiều ngược lại, cho UI. |
| `npm run lint:lines` | chỉ quét `content/lines` + `content/rules`. **Chưa** quét `src/ui/**` — cần thêm một kiểm tra mới quét chuỗi hiện màn hình theo §4. |
| Review tay | mở bảng ở §4, tìm từ bên cột trái trong `src/ui/**`, `src/scenes/**`, `sim/gearHint.ts`. |

**Lời kể sự kiện là chữ của game.** Dòng log không có ai phát ra: nó là game thuật lại chuyện vừa xảy ra, nên nó viết phổ thông — `dì Liên bước vào chỗ mát đứng`, `khách thấy ổ đó rơi rồi`. Giọng Nam chỉ còn ở phần **trong ngoặc kép** của chính dòng đó: `Cô Thuý (chạy qua): "Cần tiền lẻ hôn? Cô có nè."` giữ nguyên, vì đó là người nói.

**Một chuỗi dùng ở hai kênh thì theo kênh UI.** `DEED_LABEL` vừa vào nhãn lời hứa vừa vào một câu thoại, nên nó về phổ thông (`bưng giúp cái gánh`) — một người Sài Gòn nói "giúp" vẫn tự nhiên, còn cái nhãn thì không được "giùm". Ngoại lệ duy nhất đi ngược chiều: `sim/recall.ts`, vì mọi mảnh ở đó chỉ tồn tại bên trong câu NPC nói.

---

## 8. Đã sửa

**Đợt 1 — UI, 11 file.** `src/ui/**`, `src/scenes/**`, `sim/gearHint.ts`, `sim/day.ts`:

| File | Sửa |
|---|---|
| `ui/AssemblyPanel.ts` | `vô`→`vào`; nút `để đó`→`Gác lại`; bốn câu chặn về khuôn §4 |
| `ui/broke/BrokeView.ts` | `mối`→`nguồn hàng`; `Hết vốn rồi.`→`Hết vốn.` |
| `ui/menu/MenuBoardView.ts` | `không bỏ gì hết`→`không bỏ gì`; `bảng không sửa giùm`→`bảng không tự sửa` |
| `ui/market/MarketView.ts` | `coi`→`xem` ×3, `vô`→`vào`, `bữa`→`hôm` ×3, `bấy nhiêu`→`chừng đó` |
| `ui/evening/EveningView.ts` | `mối`, `giùm`, `bữa` ×5, `dơ`→`bẩn`, `lộn`→`nhầm`, bỏ `con`, `Bán rồi.`→`Đã bán.` |
| `ui/notebook/NotebookView.ts` | `bữa`→`hôm` trong ghi chú xuất CSV |
| `ui/intro/IntroView.ts` | nhãn `Tên con`→`Tên`; nút `Thôi, để trống`→`Để trống` |
| `scenes/StallScene.ts` | `vô`→`vào` ×4, `dơ`→`bẩn`, `rớt`→`rơi`, `bữa`→`hôm`, bỏ `con`, bỏ hạt cuối `đã`/`đi`, `Lại chỗ này`→`Tới chỗ này`, bỏ `!` |
| `scenes/MenuScene.ts` | `Hết mùa rồi`→`Hết mùa`, `mất luôn`→`sẽ mất`, `rớt`→`rơi`, `bữa qua`→`hôm qua` |
| `sim/gearHint.ts` · `sim/day.ts` | `bữa`→`hôm` ×8, `vô`→`vào`, bỏ `con`, `ruồi bu`→`ruồi bám`, `im re`→`im ắng`, `nón`→`mũ`, `coi`→`xem` |

**Đợt 2 — lời kể sự kiện, 3 file / 23 chuỗi.**

| File | Sửa |
|---|---|
| `sim/service.ts` | `vô`→`vào` ×6 (`bước vào chỗ mát`, `ghi vào sổ`, `bước trở vào hàng`, `bưng gánh vào trong`, `dời gánh vào sát vách`, `ghé vào thật`) · `ngó`→`nhìn` ×4 · `rớt`→`rơi` ×2 (gồm toast từ chối ổ bẩn) · `giùm`→`giúp` trong `DEED_LABEL` · `bữa`→`hôm` ×2 · `hổng`→`không` · `hẵng`→`hãy` · `mời người ta vô chi nữa`→`mời vào cũng không có gì bán` |
| `sim/story.ts` | `hết xài được`→`không dùng được` · `Bữa nay con bán một mình`→`Hôm nay bán một mình` · `lối vô`→`lối vào` · `hẹn mốt`→`hẹn hai ngày nữa` |
| `sim/day.ts` | đuôi kể sau câu thoại: `năm bữa nay`→`năm hôm nay` |

Test chốt nguyên văn chuỗi cũ đã cập nhật: `tests/p3-het-von.test.ts`, `tests/p3-stands.test.ts`. `npm run ci` xanh, 661/661.

**Còn lại là cố ý:** mọi câu trong ngoặc kép có người nói (`sim/suppliers.ts`, `till.ts`, `obligations.ts`, `story.ts` phần `say`/nghe lỏm, `order.ts`) · toàn bộ `sim/recall.ts` · `ổ`, `rổ`, `quầy`, `kệ`, `hẻm`, `đồ chua`, `xíu mại`, `hụi`, `trong ống` (tên vật, §1) · `con` trong `con chó`/`con số` (loại từ) · `mốt` trong `hai mươi mốt` (`core/clock.ts`, `sim/econ.ts` — số đếm) · `rồi` trong lời nhắc tại chỗ (§4) · dòng tri ân cuối game.
