# Âm thanh — bản dựng thử v0.1

## Trạng thái: NHẠC TẠM, KHÔNG PHẢI NHẠC CUỐI

`P5-03 §6.5.1` đòi nhạc **sáng tác gốc, mua đứt vĩnh viễn**, do một nhạc sĩ Việt
hiểu nhạc tài tử viết. Cái nằm ở đây là **nhạc giữ chỗ** để vòng lặp game có
không khí trong lúc chờ, và để phần code (`src/audio/music.ts`) được thử thật
với file thật chứ không phải với im lặng.

Thay bằng nhạc thật = đổi đường dẫn file trong bảng `CUES` ở `src/audio/music.ts`.
Không file gameplay nào phải sửa.

## Ghi công — BẮT BUỘC, không được bỏ

Cả 5 bản đều của **Kevin MacLeod (incompetech.com)**, giấy phép
**Creative Commons Attribution 4.0** (<https://creativecommons.org/licenses/by/4.0/>).
CC BY buộc phải nêu tên tác giả **ở nơi người chơi thấy được** — hiện đang nằm ở
trang **Giới thiệu** trong menu. Gỡ dòng đó ra là vi phạm giấy phép.

| Cue | Bản nhạc | Vì sao chọn |
|---|---|---|
| `menu` | Cattails | guitar mộc + erhu, 77 BPM — có màu đàn dây châu Á mà không thành pastiche |
| `to_mo` | Morning | guitar cổ điển thưa, 60 BPM — đúng "gần như chỉ guitar đơn" của §6.3 |
| `cao_diem` | Ave Marimba | marimba + trống, **không có giai điệu nổi** — §6.3 cấm giai điệu ở giờ cao điểm vì nó đánh nhau với bark |
| `lang` | Windswept | guitar + dàn dây, 79 BPM — chỗ duy nhất §6.3 cho phép giai điệu nở ra |
| `toi` | Avec Soin | piano solo chậm, 64 BPM — màn kết buổi, đếm tiền |

Danh sách máy đọc được: `PROVENANCE.csv` (đúng quy ước `P5-02 §2.8.2`).

## Vì sao chọn được 5 bản này

`P5-03 §6.1` cấm rất cụ thể: lo-fi hip-hop beat, vinyl crackle, pad synth vô danh
tính, nhạc phản hồi điểm số. `§6.2` đòi biên chế nhỏ (≤3 bè), acoustic, 68–84 BPM,
rubato nhẹ. Năm bản trên lọc ra từ catalog ~1.400 bản của incompetech theo đúng
mấy ràng buộc đó: 57–79 BPM, nhạc cụ mộc, không trống điện tử, không sidechain.

**Chưa đạt** (và biết là chưa đạt): không bản nào có guitar phím lõm hay hơi thở
điệu oán. Đó chính là thứ chỉ nhạc sĩ Việt viết mới có, và là lý do §6.5.1 tồn tại.

## Xử lý file

Tải bản gốc 256–320 kbps rồi nén lại còn **112 kbps VBR, 44,1 kHz stereo**
(GStreamer `lamemp3enc`), tổng 11 MB cho 5 bản. Chọn MP3 chứ không Ogg vì Ogg
Vorbis trên Safari còn chưa chắc ăn, mà build web phải chạy được trên điện thoại.

Nhạc **tải lười theo cue**, không tải hết lúc mở game: vào sảnh chỉ kéo về ~2 MB.

## Còn thiếu so với P5-03

Bản dựng này mới có **bus "Nhạc"** — 1 trong 5 bus của `CANON §15.4`.
Bốn bus còn lại (tiếng đường phố / giọng NPC / tiếng thao tác / âm báo) chưa có
âm thanh nào nên chưa có công tắc; mỗi bus sẽ là một công tắc riêng ở Cài đặt,
**không gộp chung**.

Luật `§6.5` (nhạc phải im ở khoảnh khắc quan trọng) mới cài 3 trong 8 mục:
tạm dừng (hạ −12 dB), sự kiện tiêu cực (im 6 giây), hết buổi (đổi sang `toi`).
Năm mục còn lại cần tầng perception bắn ra `CONFIRMED` và cần hệ khách mở hàng.
