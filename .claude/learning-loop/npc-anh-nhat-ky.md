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
