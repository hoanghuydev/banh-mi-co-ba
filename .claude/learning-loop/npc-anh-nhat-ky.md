# Nhật ký NPC bằng ảnh: vì sao phải dẫn hai vòng

Thí điểm chú Đạt: sprite đi 8 hướng chỉ bằng ảnh ChatGPT. Người dùng phải nhắc hai lần mới đúng. Quy trình nằm ở skill `tao-npc-anh`.

| Vòng | Tôi làm sai gì | Người dùng dẫn bằng gì | Gốc lỗi tư duy |
|---|---|---|---|
| 1 | Lên kế hoạch gen từng hướng mà chưa tính đèn/màu giữa các lượt | "Giữa 2 động tác mà nhân vật lúc tối lúc sáng thì rất kì. Ít nhất phải cùng màu" | Chấm từng ảnh riêng, không nghĩ tới lúc các ảnh nối thành chuyển động |
| 2 | Chấm "đổi chân rõ" bằng mắt trên ảnh to; 4 pha thật ra chỉ 2 dáng, rồi còn nhân đôi frame cho đủ 8 → trong game 2 hình lật qua lại | "Sao chú Đạt đi có 2 bước thế? … trong game chỉ thấy 2 hình animation thôi" | Chấm ảnh tĩnh thay vì chấm chuyển động; lấp số frame bằng cách nhân đôi thay vì tạo thêm dáng |

## Cách làm đúng lần sau

- Khoá đèn/màu trong prompt và bù màu **một mức chung cả dải**.
- Đủ 8 frame khác nhau ngay từ đầu: dải bước + dải chuyển tiếp, xen kẽ. Không nhân đôi frame.
- Đo trước khi tin mắt: `kiem-atlas.py` đếm số hình khác nhau mỗi hướng (cần ≥ 5), báo frame liền kề trùng.
- Chụp game nhiều ảnh liền nhau lúc NPC đang đi; mỗi ảnh phải một dáng khác.

## 2026-10-26 — Chân không đổi phiên (cô xách giỏ, bà cụ, Dì Liên)

- **Sai gì**: báo xong 4 nhân vật chỉ dựa vào `kiem-atlas` ĐẠT (8 hình khác nhau, biên độ đủ) và soi ảnh thu nhỏ. Cả 8 frame hướng se/nw cùng một chân đứng trước, frame chuyển tiếp vẽ thành bước dài → trong game khựng, như thiếu hoạt ảnh giữa.
- **User dẫn bằng gì**: xem trong game, chỉ đúng hướng "dưới phải", "trên trái" của từng người; so với người đi đúng (khách lạ, chị khẩu trang).
- **Gốc lỗi tư duy**: đo "khác nhau" thay vì đo "đúng nhịp đi"; soi tổng thể mà không soi chân phóng to cạnh mẫu; coi xong khi chưa xem nhân vật đi trong game. Thêm nữa, lượt "sửa giày trắng" đổi luôn dáng chân mà không soi lại chân.
- **Sửa**: `kiem-atlas` in khép chân + xuất `-chan.png` (mẫu trên, NPC dưới); prompt thêm LEG CHECK / "Take ONLY the look"; giày lọt thì tô bằng `to-giay.py`, không xin sửa; nhân vật chỉ xong sau khi test game se/nw trên Chrome.

## 2026-10-27 — Ảnh đứng lùn hơn lúc đi (chị đeo khẩu trang)

- **Sai gì**: ảnh 8 hướng đứng vẽ đầu to thân ngắn hơn dải đi; ghép khớp cỡ theo trung bình đầu–chiều cao nên lúc dừng nhân vật co lùn ~6%. Máy không đo, mắt soi từng hàng không thấy vì không đặt đứng cạnh đi cùng đường đỉnh.
- **User dẫn bằng gì**: ảnh dải ngang có vạch đỉnh/đáy, cột cuối (đứng) thấp hơn các cột đi.
- **Gốc lỗi tư duy**: coi ảnh đứng là chuẩn cỡ tuyệt đối, không kiểm nó có cùng tỉ lệ thân với dải đi. Phát hiện muộn (sau ghép) thay vì ngay sau dải bước.
- **Sửa**: prompt 2 thêm câu PROPORTIONS; `do-ti-le.py` chạy ngay sau 4a; `kiem-atlas` báo LỖI cao đứng/đi < 0,95; gen lại 8 hướng đứng đính dải đi làm mẫu tỉ lệ.

## 2026-10-27 — Chân đi dài ở hướng chéo (sửa sai hướng lần trước)

- **Sai gì**: thấy "ảnh đứng lùn hơn lúc đi" thì gen lại ảnh đứng cho cao bằng dải đi — làm cả nhân vật chân dài thêm. Gốc thật là dải đi ChatGPT vẽ chân dài hơn ảnh đứng 8–17%, và ghép khớp cỡ theo trung bình đầu–chiều cao nên đầu lúc đi bị thu nhỏ.
- **User dẫn bằng gì**: so với player 3D ở các hướng chéo — "chân đi siêu dài, hết cute".
- **Gốc lỗi tư duy**: sửa triệu chứng (cao đứng < cao đi) bằng cách đổi vật chuẩn (ảnh đứng) thay vì hỏi cái nào lệch khỏi phong cách; không so với mẫu 3D trước khi chọn hướng sửa.
- **Sửa**: ghép khớp cỡ theo đầu (kẹp ±15% quanh khớp chiều cao), nén đoạn hông–cổ chân về 0,98–1,00 chiều cao ảnh đứng; bỏ bước gen lại ảnh đứng.
