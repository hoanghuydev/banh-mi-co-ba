# Canvas game: vì sao hay sai

Áp cho mọi thay đổi chạm canvas: đạo cụ, nhân vật, sàn, tường, biển, chữ vẽ trong cảnh, độ sâu, bản đồ ô.
Đây là mẫu chung các lỗi đã gặp, không phải danh sách phải đánh dấu. Hiểu nguyên nhân rồi tự suy ra chỗ cần soi.

**Báo xong chỉ sau khi đã chụp game ở chỗ đặt thật, phóng 4–5× vào mối nối và chân đồ, rồi nhìn.** Số đo chỉ để bổ sung cho mắt: nhiều lần số đạt mà hình vẫn sai.

## Gốc rễ chung

Ảnh trong game là hình 2D đóng vai vật 3D trên lưới iso 2:1. Mọi lỗi dưới đây là hình 2D không còn khớp với cái 3D nó đang đóng vai.

| Mẫu lỗi | Vì sao xảy ra | Dấu hiệu |
|---|---|---|
| **Biến đổi từng nửa ảnh** | Chia ảnh làm hai nửa rồi kéo mỗi nửa một kiểu để sửa góc. Hai nửa không khớp nhau ở đường chia | Cạnh đứng phía trước gãy, mặt kính/cửa lệch, vật "bị cắt" |
| **Sửa một số đo, quên các số khác** | Chỉnh độ dốc đáy nhưng chiều cao, bề ngang, tỉ lệ hai mặt đổi theo | Vật méo, dài/ngắn hơn số ô nó chiếm |
| **Ảnh AI không đúng hình học** | Ảnh gen dốc 0,58–0,65 thay vì 0,5, hoặc hai mặt không đúng tỉ lệ ô (1:2,4 thay vì 1:2). Biến đổi sau không cứu được | Phải kéo nhiều để khớp lưới |
| **Cắt/xén khi vẽ** | Canvas nhỏ hơn ảnh sau khi dịch, hoặc cắt bằng đường không nằm trên mặt phẳng thật của ô | Mép bị xén thẳng, nhìn như bị cắt khúc |
| **Hai vật kề nhau mỗi cái một mép** | Mỗi sprite có mặt trên nhô ra, cạnh vát riêng, độ cao hơi lệch | Bậc, đường viền tối, khe ở chỗ nối |
| **Chữ không cùng mặt phẳng với bề mặt** | Chữ xoay còn bề mặt thì vuốt | Chữ nghiêng một kiểu, biển nghiêng kiểu khác |
| **Thiếu phối cảnh: vật nhô ra mà dán phẳng** | Mái dù, bảng dày, ngăn kéo, bậc mà gen ảnh nhìn thẳng chính diện rồi dán lên mặt phẳng nó gắn vào | Ra tờ giấy dán tường: không thấy mặt trên, chiều dày, cạnh bên, độ dốc. Đặt cạnh ảnh mẫu của user là thấy 2D |
| **Thứ tự vẽ theo ô, vật chiếm nhiều ô** | Một độ sâu cho cả vật dài nên bị che/đè sai | Biển đè lên lò, người đứng sau bàn mà hiện trước |

Ánh sáng, bóng đổ, phản chiếu của đạo cụ: skill `anh-sang-vat-the`.

## Độ phân giải tối thiểu

Ảnh đi qua bốn chặng: **ảnh nguồn → nướng texture (`ART_SS`) → canvas (`RENDER_SCALE`) → màn hình.** Chặng nào ít pixel hơn chặng sau là ảnh bị phóng, mờ.

- Pixel canvas trên 1 px thế giới = `ZOOM` × `RENDER_SCALE`. PC: `BASE_ZOOM` 1,67 × trần `MAX_SCALE` 2 = **3,34** (`WORLD_SS_MAX`, `world/camera.ts`). Canvas không vẽ nét hơn mức này, dù màn QHD hay 4K.
- `ART_SS` và nướng sàn (`bakeGround`) tự theo `WORLD_SS_MAX`; không gõ số trần riêng. Máy yếu trần 2 để giữ bộ nhớ.
- **Mức sàn: cạnh ảnh nguồn ≥ cạnh thiết kế × `BASE_ZOOM` × `MAX_SCALE` (hiện 3,34).** **Mục tiêu 4K: ×6,3** (`BASE_ZOOM` 1,67 × 3840 / 1024), để nâng `MAX_SCALE` lên 4K là nét ngay. Đo thấy 4K lag thì hạ mục tiêu xuống 2K: ×4,2 (1,67 × 2560 / 1024).
- **Đổi `BASE_ZOOM` hoặc `MAX_SCALE` thì tính lại mức sàn ở đây** và soi lại các ảnh nằm sát mức cũ.

| Vật | Cỡ thiết kế | Ảnh nguồn tối thiểu (3,34×) | Mục tiêu 4K (6,3×) |
|---|---|---|---|
| Vật cao 100 px | 100 | 334 | 630 |
| Thùng rác | cao 46 | 154 | 290 |
| Ô sàn (cạnh ngang hình thoi) | 60 | 200 | 378 |

- Áp khi: gen ảnh, xoá nền, ép iso, cắt, nướng ô sàn, đóng atlas, thu nhỏ lúc boot (`fit()`, `floor_tile()`, `ART_SS`). Bước nào đưa kích thước xuống dưới mức sàn thì sai.
- Kiểm: `fit(im, longest)` không được đặt `longest` thấp hơn cạnh dài thiết kế × 3,34; thấy ảnh gốc nhỏ hơn mức sàn thì gen lại ở độ phân giải cao hơn, không phóng to bằng code.

## Canvas trên cảm ứng

- **`ZOOM` đổi theo thiết bị** (`world/camera.ts`): PC 1,67; cảm ứng tăng tới trần 2,2 để 1 px thế giới chiếm đủ cỡ chạm. Mọi tính toán "px màn hình trên 1 px thiết kế" ở mục trên đọc `ZOOM` hiện hành, không số cố định.
- **Dấu hiệu trong cảnh** (vòng lò, dấu việc cần làm, vòng quanh món đang cầm) nhân `markScale()` (1,25 trên cảm ứng) để không nhỏ hơn ngón tay.
- **Chữ vẽ trong thế giới** đặt cỡ bằng `worldFont(base)` (đã tính `fitScale()` và `ZOOM`; nhãn khách dùng nó; bong bóng thoại thu thêm về cỡ 12 px khung thiết kế, không theo `ZOOM`), không `touchFont`, vì camera thế giới phóng thêm. Chữ ở lớp UI dùng `touchFont` / `touchSize`.
- Camera cảm ứng nhìn cao hơn PC để hàng vòng lò không bị nút HUD che. Soi cả khi đo ảnh chụp ở 844×390.
- Chụp kiểm cảnh: `tools/screenshot.mjs --touch --dpr 3` (xem `responsive/PLAN.md`).

## Cách làm để tránh

- **Đúng từ gốc:** dùng khối xám khi gen để ảnh ra đã đúng góc, đúng tỉ lệ ô. Ảnh lệch xa thì gen lại, không cố kéo cho đúng.
- **Vật nhô ra khỏi mặt phẳng gắn vào thì gen theo góc iso** để thấy mặt trên, chiều dày và cạnh bên (khối xám gồm cả phần nhô). Độ sâu tính ở mép nhô ra xa nhất, chữ vuốt theo mặt nghiêng. So từng điểm với ảnh mẫu của user; còn 2D hơn mẫu thì làm lại, không báo xong.
- **Chỉ sửa góc bằng một phép biến đổi cho cả ảnh** (`ep-iso.py`, `iso2`); sau đó soi xem vật có bị méo không.
- **Soi chỗ nối** của đồ đặt cạnh nhau: cùng độ cao mặt bàn, cùng độ dày, không bậc. Cần liền hẳn thì dùng chung một nguồn ảnh và cắt theo đúng mặt phẳng ô (`bench()`, `prepFromLong()`): cùng màu, cùng mép nên không còn đường nối.
- **Ghép vật mới vào hàng đã khớp: chỉnh vật mới ghép hoặc vật chưa khớp, đừng dịch vật đã khớp** (dịch là lệch với các vật khác trong hàng). Chỗ nối còn bậc màu hay mép thì xử lý phần vật được ghép vào, chứ không sửa đồ đã ổn.
- **Soi quanh vật:** lơ lửng, bay, cắm vào tường, bị xén ở mép ảnh, bị đồ khác đè sai.
- **Vật dài hơn một ô, hoặc dán trên tường cạnh chỗ người đứng** (bàn dài, mái hiên, bảng menu): cắt lát theo cột màn hình (`sliceColumns`), mỗi lát một depth. Lát dán trên tường dời ranh `WALL_OVERHANG` để không bị mép gối của ô tường kế bên đè thành vạch. Lát không thể vừa trên đồ bên dưới vừa dưới người đứng trước thì hạ theo người chơi (`yieldTo`, mái hiên). **Ô chặn phải phủ hết thân vật thật**, không chỉ ô neo ảnh (xe máy dài 2 ô có ô `m` chặn đầu xe). Soi bằng cách đặt người chơi sát từng mặt vật rồi chụp.
- **Soi logic:** vật hướng về phía ai dùng, ô chặn và lối đi còn thông, trạm tương tác không lệch, lối khách và hàng chờ còn nguyên, không để lại khoảng trống vô dụng.
- **Soi chữ:** font đủ dấu tiếng Việt, tên dài tự co, cùng mặt phẳng với biển.
- **Soi các trạng thái đổi hình** (đã/chưa mua đồ, ngày/mưa) và màn hẹp.
- Bỏ phần code chỉ phục vụ thứ vừa bỏ.

- **Khối nhiều ô ghép hàng (tường, nhà xóm, cửa)**: muốn nhìn ra một khối liền thì không thể ghép ảnh từng ô, dù đã cắt gờ và san tông. Mỗi ô được dựng lại bằng `tools/wall_surface.py` (qua `BLOCKS` trong `tools/prep-art.py`): mỗi mặt trải phẳng theo (u dọc hàng tường, v từ chân lên), vữa sát mép và nắp dùng chung một texture tuần hoàn, dải gạch men đứng trên một lưới chung (6 cột × 3 hàng, mạch ngang kẻ thẳng), chi tiết (cửa sổ, cửa cuốn, poster) giữ nguyên ảnh gốc trong một vùng khai ở `DETAIL`. Ô nào đứng cạnh ô nào cũng khớp ở mép. Đường chéo phải lấy mẫu theo điểm ảnh (khử răng cưa), không dịch cột theo số nguyên. Quy trình và bẫy chụp game: skill `ghep-khoi-lien-mach`.
- **Mặt phẳng nằm trong khối**: chi tiết dán trên mặt tường (cửa sổ, công tơ, poster, dây phơi) tồn tại cùng mặt phẳng với vữa, nên mọi phép lấy mẫu để sửa mép phải đi dọc theo mặt phẳng đó (mặt trái dốc xuống phải, mặt phải dốc lên phải), không đi ngang màn hình.

## Báo cáo

Kèm đường dẫn ảnh chụp tuyệt đối và ảnh phóng. Nói rõ mục nào chưa kiểm.

## Lịch sử sai

Mỗi mục là một lần báo xong mà user phải bắt lỗi. Đọc trước khi động vào canvas.

### 2026-10-24, thay 9 ảnh tường bằng ảnh AI

| Đã làm sai | Hậu quả | Làm đúng |
|---|---|---|
| Làm việc canvas mà chưa đọc hết file này (chỉ grep vài dòng) | Rơi đúng vào dòng "Hai vật kề nhau mỗi cái một mép" và "Soi chỗ nối" | Mở và đọc cả file trước khi gen, ghi lại mục nào áp cho task |
| Cài nguyên 9 ảnh AI, chấm từng ảnh riêng thấy "đạt" | Cao lệch 1–3 px, dải gạch mỗi ảnh một độ cao, gờ vát sáng chạy dọc mối nối, khe 1 px lộ mặt sáng của ô trước: tường nhấp nhô, lỏm nhỏm | Chấm cả hàng ghép liền, không chấm từng ảnh; chuẩn hoá chung như mục "Khối nhiều ô ghép hàng" |
| Có chụp game, thấy bậc và đường kẻ ở mối nối nhưng gọi là "bước hình học thường thấy", "đường kẻ mảnh", báo "mối nối ổn" | User phải tự chỉ ra | Thấy bậc, đường tối/sáng, khe ở chỗ nối là lỗi. Không biện hộ. Phóng 4–5× ở độ phân giải gốc (màn 2732 px) rồi mới báo |
| Chụp ở 1366 px, hộp thoại hướng dẫn che một phần cảnh, tin ảnh đó | Soi chưa đủ nét | Tắt hộp thoại rồi mới chụp; ảnh tối do lớp phủ thì chụp lại |
| Ép màu từng nhà xóm khác nhau (xanh xám, hồng be) để "phân biệt" | Nhà xanh xám chen giữa tường kem và sàn men trắng trông lạc | Đồ cùng một bộ giữ cùng tông; muốn khác màu thì hỏi user duyệt trong cảnh trước |
| Đặt `h`, `dx`, `dy` riêng cho từng ảnh trong `photo.ts` | Mỗi ảnh một cỡ, cộng dồn ra bậc | Chuẩn hoá ảnh để cả 9 ảnh dùng chung một bộ số (`WALL_PHOTO`) |

### 2026-10-24, tường vẫn chia line sau lần sửa đầu

| Đã làm sai | Hậu quả | Làm đúng |
|---|---|---|
| Sau khi cắt gờ vát tôi báo xong mà chưa so cột biên của hai ô kề nhau | Mỗi ô còn một tông vữa và một dải sáng tối riêng: nắp lệch tông, vạch sáng đứng giữa hai ô | Mỗi mặt san về cùng màu vữa, cột biên lấy lại màu cột sát trong |
| Căn dải gạch bằng một cột đo hoặc đo toàn mặt | Cửa sổ, áo xanh, kim loại làm sai số đo, dải gạch gợn sóng | Đo hai đầu mỗi mặt, bỏ giá trị lệch xa, chỉ kéo vùng quanh mép trên dải gạch |
| Chụp game sau mỗi lần sửa ở một khung | Không phóng 4–5× vào từng mối nối | Ghép hàng thử ở 6,4 px/px, phóng từng mối nối, rồi mới chụp game |

Nhật ký đầy đủ: `.claude/learning-loop/tuong-nhat-ky.md`.

### 2026-10-24, tường vẫn thấy rõ là ghép nhiều khối

| Đã làm sai | Hậu quả | Làm đúng |
|---|---|---|
| Vá từng khác biệt giữa hai ô (tông, mép, độ cao dải gạch) | Vá xong chỗ này lộ chỗ khác; người dùng phải khoanh thêm lần nữa | Hỏi "thứ gì làm ô này khác ô kề nó" ở gốc: mỗi ảnh là một bề mặt riêng. Cho cả hàng dùng chung một bề mặt (texture tuần hoàn + lưới gạch chung) |
| Căn dải gạch bằng một cột đo hay độ dốc khớp đường | Gợn sóng, bậc ở góc | Dựng dải gạch trên lưới chung từ ô lấy trong tường trơn, kẻ mạch ngang thẳng |
| Dịch cột theo số nguyên để trải phẳng mặt nghiêng | Răng cưa dọc mọi đường chéo | Lấy mẫu song tuyến theo điểm ảnh, độ phủ khử răng cưa ở mép mặt |

### 2026-10-24, ảnh ghép hàng đạt nhưng trong game vẫn thấy vạch

| Đã làm sai | Hậu quả | Làm đúng |
|---|---|---|
| Chấm hàng ghép thử rồi báo đạt, chụp game ở khung nhỏ và gọi vạch mờ là "hết" | Trong game còn vạch: các lớp ánh sáng phủ riêng từng sprite (`wallOverlays` trong `lightTint.ts`) có dải sáng tối rộng ±14 px mỗi ô nên lệch ở mỗi mối nối; thu nhỏ texture còn hở khe ở mép | Mọi lớp phủ lên khối ghép hàng phải đều trong từng mặt (chỉ đổi tông ở cạnh giữa); ảnh nới mép ra ngoài ô cho ô kề gối lên; phóng camera trong game (`window.__game`, zoom 6) để soi như người chơi thấy |

### 2026-10-25, thêm ba tờ rơi trên tường: vạch dọc ở mọi mối nối trong game

| Đã làm sai | Hậu quả | Làm đúng |
|---|---|---|
| Ghép thử liền ở 6,4 px/px rồi coi như xong | Trong game còn vạch sáng dọc ở mọi mối nối mặt đứng: mép ô sau chỉ gối 3 px ảnh, 1–2 texel mờ sau khi thu nhỏ rơi lên gờ giữa của ô trước nên gờ sáng lộ qua (bướu +8 độ sáng) | Gối mép mặt đứng ≥ 16 px ảnh; chụp game 2732 px phóng 2,6× và đo hồ sơ độ sáng ngang mối nối |
| Nới gối của nắp lên 16 như mặt đứng | Nắp ra lưới vạch và răng cưa: lớp bóng lá phủ riêng từng ô bị phủ đôi ở vùng gối | Nắp giữ gối 5 px |
| Giữ vữa ảnh gen ở giữa mặt, chỉ san tông cột | Mỗi mối nối còn dải sáng +4 do vữa chung sát mép khác tông phần giữa; vệt xanh chéo trên dải gạch do mép gạch ảnh gen dốc | Ngoài vùng chi tiết chỉ dùng vữa chung đã san tông theo hàng; dải 32 px trên dải gạch lấy hoàn toàn từ vữa chung |
| Chụp game bằng dev server đang bị người khác sửa file | Trang tự tải lại, ảnh ra màn menu; mất cả buổi tưởng lỗi ở game | Build tĩnh (`vite build --mode development`) rồi chụp |
