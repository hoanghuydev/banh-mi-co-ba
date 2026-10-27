# Nhật ký ánh sáng và bóng: vì sao hầu hết lần đầu đều sai

15 phase, từ ảnh phân tích đầu tiên đến bóng người. Gần như mọi phase lần đầu tôi (agent) làm sai và chỉ đúng khi **người dùng dẫn lại bằng một chỉ dẫn cụ thể** (ảnh tham chiếu, câu "ghép đơn giản", "bóng hình đồ vật"). Hỏi ChatGPT 9 lần cũng không triển khai được. Tài liệu này ghi nguyên nhân để lần sau không lặp lại. Bản dựng từng vòng nằm ở `art-raw/_duyet/ban-anh-sang/GHI-CHU.md` (thư mục này không vào git).

## Bảng phase

| # | Phase | Tôi làm sai gì | Người dùng dẫn đúng bằng gì | Gốc lỗi tư duy |
|---|---|---|---|---|
| 1 | So hai ảnh, tìm vì sao game "giả" | Liệt kê 24 nguyên nhân phẳng, ngang hàng nhau | "Chú ý bóng, phản chiếu, bóng loáng" (chọn ba thứ chính) | Liệt kê đủ ≠ xếp ưu tiên |
| 2 | Quy tắc màn 27" | Viết số liệu đúng nhưng không kiểm ảnh thật | Đòi ghi vào quy tắc canvas và skill | — |
| 3 | Demo thùng rác, tủ kính | Phản chiếu hở khỏi chân, hai thanh dọc ở góc nắp, kính phủ sương trắng bằng code | "Phản chiếu phải dính chân", "tủ chưa trong", ảnh mẫu e2.png | Suy ra hình học bằng giả định (đáy dốc 0,5) thay vì đo ảnh |
| 4 | Phản chiếu theo chất liệu | Lấy độ bóng tại ô chân cho cả thân, rồi lấy trung bình qua ranh | "Cắt đúng ranh men/gạch, không mờ dần" | Quyết định theo ô, không theo điểm ảnh |
| 5 | Skill `anh-sang-vat-the` | Viết skill trước khi đồ hoạ được duyệt, số liệu lỗi thời ngay | "Chỉ viết skill tốt nhất sau khi duyệt" | Chốt luật khi chưa chốt kết quả |
| 6 | Đưa vào game bằng sub agent song song | Lá "dơ loang lổ", khác hẳn demo | "Demo đẹp hơn game nhiều" | Dựng lại pipeline phức tạp thay vì mang demo vào |
| 7 | Bóng lá trong và ngoài tiệm | Phủ lá khắp nơi; đốm lá lên cả vật trong tiệm | "Trong tiệm có mái, chỉ chút lá; ngoài thì thưa, chừa nắng" | Không hỏi logic mái trước khi thêm hiệu ứng |
| 8 | Đèn tường, lò, bóng bề mặt | Nhiều đèn, quầng vàng to, vệt men chồng nhau | "Chỉ 3 đèn", "đèn bàn topping xấu" | Thêm lớp để vá lớp |
| 9 | Vòng ChatGPT v0–v5 (5 trong 9 lượt) | Mỗi vòng đổi vài hệ số theo lời khuyên chung; càng hỏi càng tệ | "Bạn càng hỏi càng tệ", "tôi còn không thấy bóng lá đâu" | Tối ưu số khi cấu trúc sai; hỏi người không thấy code |
| 10 | Mép ô đường nhựa chênh | Ô bake 62×38 (thấp hơn sàn khác 4 lần) và lọt mép vát 3D của phiến nguồn | Gửi ảnh phóng ô đường | Đo độ phân giải từng loại ô chưa làm |
| 11 | Bóng lá bằng ảnh A, B, C | Ép ảnh lá thành đen-trắng theo ngưỡng; một ảnh phong lặp lật gương | "Tạo ảnh tán lá riêng, lật lại, đổ từ dưới trái, A giữa tới hết" | Biến đổi mất thông tin (ngưỡng, nhoè) trước khi dùng |
| 12 | Bóng toà nhà dọc mặt tiền | Dựng bằng đường sóng sin | Gửi ảnh `bóng tòa nhà.png`: "không phải bóng cây, nhấp nhô lên thụt" | Nghĩ bóng là hàm toán, bóng thật là bóng của nhiều đồ vật |
| 13 | Ảnh dải bóng: D (mềm), D2 (nét, chữ nhật), D3 | Lần 1 quá nhoè, lần 2 quá nét và đều | "Nét và mềm vừa thôi; bóng nồi, trụ, tam giác, chữ nhật" | Quyết độ nét trong ảnh gen thay vì để code chỉnh |
| 14 | Lớp nắng ấm, mảng nắng mềm | Chồng mảng nhiễu trắng + điểm rực: "giả và lem nhem" | "Ưu tiên ánh sáng, không làm trắng lem nhem", rồi "hơi trắng, cho vàng tí" | Làm theo bảng blend mode nguyên văn thay vì nhìn kết quả |
| 15 | Bóng người đi trên nhiều vùng | Bóng người, bóng toà nhà, bóng lá tính riêng, chồng màu | "Phần chung bóng phải cùng màu" | Tính từng nguồn bóng độc lập, không nhìn mặt bằng ánh sáng chung |

## Nguyên nhân gốc (xếp theo mức nặng)

1. **Dựng pipeline phức tạp thay vì phép ghép đơn giản nhất.** Ở phase 6, 9, 11 demo ngoại tuyến đã đúng, tôi vẫn dựng lại thứ nhiều lớp hơn trong game và nó kém hơn. Phép ghép "ảnh bóng xám nhân lên sàn" đã đủ.
2. **Làm mất thông tin trước khi dùng:** ngưỡng, nhoè hai lần, lightmap độ phân giải thấp. Chi tiết lá biến mất rồi tôi thêm mẹo để bù.
3. **Chồng lớp vá lớp.** Mỗi lỗi nhìn thấy được vá bằng lớp mới đọc cùng trường dữ liệu đã nhoè, nên cộng trùng. Không ai (tôi) quay lại nguồn.
4. **Chỉnh số liệu thay vì sửa cấu trúc.** Ví dụ bóng lá chỉ trừ số hạng nắng (khoảng 10% độ sáng) nên vô hình; tôi tăng hệ số thay vì tách độ tối riêng cho lá.
5. **Hỏi ChatGPT lấy hệ số.** ChatGPT không thấy code nên trả về "đổi X thêm 10%". Phần tư duy nó đưa (chốt câu chuyện ánh sáng, phân loại chất liệu, thứ tự lớp) đúng nhưng tôi không biến thành thay đổi cấu trúc. Dùng ChatGPT để **gen ảnh** (A, B, C, D3) thì hiệu quả; dùng để **chỉnh số** thì không.
6. **Quyết định theo ô thay vì theo điểm ảnh** (phản chiếu qua ranh chất liệu, bóng người qua ranh trong/ngoài).
7. **Không kiểm giả thuyết trước khi sửa.** Khối kem trên tường tôi tưởng do lớp mới (thậm chí đổi tên lớp, tắt lớp, đo từng bản dựng) trong khi là biến thể tường ngẫu nhiên mỗi lần tải. Bài học: chụp hai lần cùng cấu hình để xem có ngẫu nhiên không.
8. **Không hỏi thứ tự ưu tiên khi hai yêu cầu có thể xung đột** (sắc nét vs mềm, trắng vs vàng): người dùng phải chỉnh qua nhiều vòng.
9. **Môi trường kiểm không ổn định:** popup hướng dẫn che ảnh, máy chủ xem trước tự tắt, ảnh chụp lúc game còn tải 96%. Lỗi kiểm làm tôi kết luận sai nhiều lần.

## Điều người dùng đã làm mà agent chưa tự nghĩ ra

- Đưa **ảnh thật làm đích** cho từng thứ (bóng lá, bóng toà nhà, gạch sau chỉnh) thay vì mô tả bằng lời.
- Nhìn ra **bóng là bóng của vật gì** (nồi, cột, tam giác), không phải đường cong.
- Quyết định **tách ảnh nguồn nét, độ mềm do code lo**.
- Bảo **dừng thêm kỹ thuật, ghép đơn giản**.
- Chỉ rõ **một việc mỗi lần** (C nhỏ 10%, A ngắn, các mảng dài thêm 10%, bớt nhấp nhô 25%).

## Phase 15: cách đúng

Bóng người nhân thẳng với ảnh nắng của sàn (đã gồm bóng nhà, bóng lá, bóng đạo cụ): chỗ đã có bóng thì bóng người không tối thêm, chỗ kề bên cùng một màu vì `SHADOW_RGB` suy từ chính hằng số sàn. Hình bóng người vẫn riêng; độ đậm tổng vẫn lấy trung bình vùng và làm mượt để không nhấp nháy. Điểm bài học: **hai nguồn bóng không được cộng bằng phép nhân, mà phải là hợp (chung một trường nắng)**.

Sau phase này, skill `anh-sang-vat-the` và `.claude/CLAUDE.md` đã được viết lại theo các quy tắc trên.
