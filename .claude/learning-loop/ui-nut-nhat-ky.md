# Nhật ký: style nút/khung UI

| Vòng | Agent làm sai | User dẫn bằng | Gốc lỗi tư duy |
|---|---|---|---|
| 1 | Chọn "style ChatGPT B" rồi tự vẽ bằng Phaser Graphics, ra phẳng, khác ảnh | "style B rõ ràng là hướng 3D, bọc viền trắng, bạn đi tự code?" | Hiểu "style" là bảng màu + chi tiết, bỏ qua độ khối 3D và vật liệu của ảnh mẫu |
| 2 | Dùng ảnh nine-slice, vẫn giữ viền trắng; chữ phụ "Chơi tiếp" đè kẻ chỉ; đinh tán méo khi kéo giãn | "bỏ viền trắng", "chữ bị đè", "phóng ra đinh méo", "ưu tiên code" | Không so với ảnh mẫu theo từng chi tiết user nêu; chiều cao nút cố định không tính dòng phụ; ảnh nine-slice không hợp thành phần có chi tiết tròn |
| 3 | Làm tuần tự từng phương án | "mỗi lần giao task đều làm tuần tự" | Không tách việc độc lập ra sub agent dù rule đã có |

Bài học: nút phải co giãn → dựng bằng code/vector; chi tiết tròn (đinh, đồng xu) không nine-slice. Chiều cao nút tính theo nội dung (có dòng phụ thì cao hơn). So ảnh mẫu từng chi tiết trước khi báo xong. Nhiều phương án độc lập → sub agent song song.
