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

## Độ phân giải tối thiểu (màn 27 inch)

Ảnh nguồn không được thấp hơn số pixel nó chiếm trên màn thật; thấp hơn là bị phóng, mờ.

- Pixel màn hình trên 1 px thiết kế = `ZOOM` (1,28) × chiều rộng màn thật / `GAME_W` (1024).
- 27" QHD (2560 px) → **×3,2**. 27" 4K (3840 px) → **×4,8**.
- **Mức sàn: cạnh ảnh nguồn ≥ cạnh thiết kế × 3,2.** Mục tiêu có dư cho 4K: ×4,8.

| Vật | Cỡ thiết kế | Ảnh nguồn tối thiểu (3,2×) | Mục tiêu 4K (4,8×) |
|---|---|---|---|
| Vật cao 100 px | 100 | 320 | 480 |
| Thùng rác | cao 46 | 147 | 221 |
| Ô sàn (cạnh ngang hình thoi) | 60 | 192 | 288 |

- Áp khi: gen ảnh, xoá nền, ép iso, cắt, nướng ô sàn, đóng atlas, thu nhỏ lúc boot (`fit()`, `floor_tile()`, `ART_SS`). Bước nào đưa kích thước xuống dưới mức sàn thì sai.
- Kiểm: `fit(im, longest)` không được đặt `longest` thấp hơn cạnh dài thiết kế × 3,2; thấy ảnh gốc nhỏ hơn mức sàn thì gen lại ở độ phân giải cao hơn, không phóng to bằng code.

## Cách làm để tránh

- **Đúng từ gốc:** dùng khối xám khi gen để ảnh ra đã đúng góc, đúng tỉ lệ ô. Ảnh lệch xa thì gen lại, không cố kéo cho đúng.
- **Vật nhô ra khỏi mặt phẳng gắn vào thì gen theo góc iso** để thấy mặt trên, chiều dày và cạnh bên (khối xám gồm cả phần nhô). Độ sâu tính ở mép nhô ra xa nhất, chữ vuốt theo mặt nghiêng. So từng điểm với ảnh mẫu của user; còn 2D hơn mẫu thì làm lại, không báo xong.
- **Chỉ sửa góc bằng một phép biến đổi cho cả ảnh** (`ep-iso.py`, `iso2`); sau đó soi xem vật có bị méo không.
- **Soi chỗ nối** của đồ đặt cạnh nhau: cùng độ cao mặt bàn, cùng độ dày, không bậc. Cần liền hẳn thì dùng chung một nguồn ảnh và cắt theo đúng mặt phẳng ô (`bench()`, `prepFromLong()`): cùng màu, cùng mép nên không còn đường nối.
- **Ghép vật mới vào hàng đã khớp: chỉnh vật mới ghép hoặc vật chưa khớp, đừng dịch vật đã khớp** (dịch là lệch với các vật khác trong hàng). Chỗ nối còn bậc màu hay mép thì xử lý phần vật được ghép vào, chứ không sửa đồ đã ổn.
- **Soi quanh vật:** lơ lửng, bay, cắm vào tường, bị xén ở mép ảnh, bị đồ khác đè sai.
- **Soi logic:** vật hướng về phía ai dùng, ô chặn và lối đi còn thông, trạm tương tác không lệch, lối khách và hàng chờ còn nguyên, không để lại khoảng trống vô dụng.
- **Soi chữ:** font đủ dấu tiếng Việt, tên dài tự co, cùng mặt phẳng với biển.
- **Soi các trạng thái đổi hình** (đã/chưa mua đồ, ngày/mưa) và màn hẹp.
- Bỏ phần code chỉ phục vụ thứ vừa bỏ.

- **Khối nhiều ô ghép hàng (tường, nhà xóm, cửa)**: ảnh AI từng ảnh đạt vẫn không đủ, vì mỗi ảnh một độ cao, một độ cao dải gạch, một gờ vát. Chạy qua `tools/wall_block.py` (`BLOCKS` trong `tools/prep-art.py`): đưa về đúng 60 × 86 px, căn mép trên dải gạch, cắt gờ vát và gạch quấn góc, nới mép đứng 1 px để ô sau gối lên ô trước. Trước khi cài, ghép 5 ô thành một hàng ở 6,4 px/px thiết kế và nhìn.
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

