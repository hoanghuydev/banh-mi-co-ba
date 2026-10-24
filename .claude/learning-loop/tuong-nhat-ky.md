# Nhật ký tường ghép hàng: vì sao phải dẫn hai vòng

Thay 9 ảnh tường, cửa, nhà xóm bằng ảnh AI. Người dùng phải bắt lỗi hai lần mới đúng. Quy tắc nằm ở `docs/QUY-TAC-CANVAS.md` (mục "Khối nhiều ô ghép hàng" và "Lịch sử sai").

| Vòng | Tôi làm sai gì | Người dùng dẫn bằng gì | Gốc lỗi tư duy |
|---|---|---|---|
| 1 | Cài 9 ảnh, chấm từng ảnh riêng, thấy bậc ở mối nối mà gọi là "đường kẻ mảnh" | "Các bước tường không liền mạch, nhớ vát mép, làm xong không chụp xem lại à?" | Chấm phần tử thay vì chấm hàng ghép; biện hộ điều mắt đã thấy |
| 2 | Cắt gờ vát và chuẩn hoá cỡ nhưng bỏ qua tông vữa từng ô, độ dốc dải gạch, cột biên lẫn nền; chụp cũng chỉ ở một khung nhìn | Ảnh khoanh đỏ: nắp lệch tông, vạch đứng giữa hai ô, dải gạch lệch ở góc | Sửa đúng cái đã bị chỉ ra thay vì liệt kê mọi thứ khiến hai ô khác nhau ở mép |
| 3 | Vá từng khác biệt của hai ô (tông, mép, dải gạch) thay vì hỏi vì sao hai ô khác nhau | "Muốn giữa 2-3 ô nhìn vào là một khối, trong code là một khối nhưng render tinh tế rồi cắt" | Sửa triệu chứng ở mép; không đổi cấu trúc: mỗi ảnh là một bề mặt riêng thì ghép sao cũng thấy mối |
| 4 | Ảnh ghép thử đã liền nhưng trong game còn vạch; tôi chỉ soi ảnh rời | "Ảnh kia ok rồi, sao trong game không được? bạn không thấy các đường kẻ à?" | Chấm ở môi trường thử thay vì môi trường thật: game còn thu nhỏ texture và phủ lớp ánh sáng riêng từng sprite |
| 5 | Dựng lại bề mặt chung, ghép thử liền ở 6,4 px/px, nhìn mắt thấy ổn; ba ô tờ rơi mới thêm vào mà chưa chụp game ở độ phóng thật | Người dùng nhắc lại: "nhớ quy tắc learning loop khi gắn tường có đường kẻ giữa các tường" | Tin ảnh ghép thử (môi trường dễ), không chạy lại bước "chấm ở game thật" đã ghi ở mục cuối; đo số trước khi nhìn mắt mới ra bướu +8 ở mối nối |

## Cách làm đúng lần sau

- Muốn liền thành một khối thì **mọi ô dùng chung một bề mặt** (texture tuần hoàn, lưới gạch chung); đừng ghép ảnh riêng rồi vá mép.
- Khối ghép hàng phải **khớp ở mép** về hình, màu, vân, độ cao dải gạch. Với mỗi ô, so cột biên với ô kề trước khi cài.
- Ghép hàng 5–6 ô ở 6,4 px/px rồi nhìn **trước** khi đưa vào game; phóng riêng từng mối nối.
- Đo bằng số chỉ để hỗ trợ: cột biên (vạch sáng/lệch màu), độ lệch mép dải gạch giữa hai ô.
- Đo mép dải gạch bằng một cột là sai (cửa sổ, áo, kim loại xanh gây nhiễu); khớp đường thẳng nhiều cột hoặc đo ở hai đầu mỗi mặt và loại giá trị lệch xa.
- Sau khi ảnh ghép thử đạt, tìm mọi thứ game làm thêm lên sprite (lớp phủ sáng tối, thu nhỏ texture, làm tròn vị trí) và soi lại ở game thật bằng camera phóng to.
- **Vạch ở mối nối đo được bằng số trước khi thấy bằng mắt**: chụp game ở 2732 px, phóng 2,6×, đo hồ sơ độ sáng ngang mối nối (`.claude/skills/ghep-khoi-lien-mach/scripts/do-moi-noi.py`). Bướu +5 trở lên rộng 8–10 px là vạch.
- **Gối mép phải rộng hơn phần mờ sau khi thu nhỏ** (mặt đứng 16 px ảnh); nắp trên thì không gối rộng vì lớp bóng lá phủ riêng từng ô sẽ phủ đôi.
- Mọi việc thêm hay đổi khối ghép hàng đi theo skill `ghep-khoi-lien-mach`.
