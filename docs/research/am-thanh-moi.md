# Âm thanh điện thoại, Hệ thống, vòng quay

13 cue, 17 file, CC0, bus `amBao`, mono, RMS −24 dB. Gọi qua `sfx.ui(id)` — hàm này lấy cảnh đang chạy, vì UI điện thoại là HTML, không có scene trong tay.

Chọn bằng cách **đo phổ** từng ứng viên: cao độ đỉnh, phần năng lượng trên 4 kHz, độ nhô của đỉnh phổ trên nền, hướng lên/xuống tông, thời gian vào và tắt. Chưa ai nghe bằng tai.

## Bộ đang dùng

| Cue | Nghĩa | Gọi ở | Đo được | Nguồn |
|---|---|---|---|---|
| `ph_tin_den` | Tin nhắn đến, banner tin mới | `ui/phone/banner.ts` | 0.29s · 781 Hz · >4k 0%<br>0.43s · 657 Hz · >4k 0%<br>0.42s · 630 Hz · >4k 0% | [750609](https://freesound.org/s/750609/) deadrobotmusic<br>[702806](https://freesound.org/s/702806/) LilMati<br>[235911](https://freesound.org/s/235911/) yfjesse |
| `ph_tin_di` | Người chơi chọn câu trả lời | `ui/phone/apps/messageApp.ts` | 0.17s · 732 Hz · >4k 0% | [760370](https://freesound.org/s/760370/) Froey_ |
| `ph_soan_tin` | Chấm 3 chấm đang soạn | `ui/phone/IntroPhone.ts` | 0.10s · 877 Hz · >4k 0%<br>0.07s · 904 Hz · >4k 0%<br>0.09s · 845 Hz · >4k 0% | [328119](https://freesound.org/s/328119/) D.S.G.<br>[439186](https://freesound.org/s/439186/) FourthWoods<br>[789793](https://freesound.org/s/789793/) quatricise |
| `ph_mo_may` | Mở điện thoại | `ui/phone/PhoneView.ts` | 0.16s · 754 Hz · >4k 5% | [391699](https://freesound.org/s/391699/) JPolito |
| `ph_dang_tin` | Đăng tin rao bán | `ui/phone/apps/sellApp.ts` | 0.15s · 3160 Hz · >4k 37% | [579883](https://freesound.org/s/579883/) yfjesse |
| `sys_thong_bao` | Hệ thống lên tiếng | `ui/phone/apps/systemApp.ts` | 0.10s · 899 Hz · >4k 7% | [404151](https://freesound.org/s/404151/) LilMati |
| `sys_nhiem_vu_xong` | Chấp nhận nhiệm vụ | `systemApp.ts` | 0.46s · 1540 Hz · >4k 3% | [431329](https://freesound.org/s/431329/) SomeGuy22 |
| `sys_canh_bao` | Từ chối, cảnh báo | `systemApp.ts` | 0.21s · 242 Hz · >4k 0% | [249300](https://freesound.org/s/249300/) suntemple |
| `sys_khoi_dong` | Hệ thống thức tỉnh | `systemApp.ts` `awakening` | 1.76s · 581 Hz · >4k 0% | [395798](https://freesound.org/s/395798/) lipsumdolor |
| `wheel_quay` | Vòng quay chạy | `systemApp.ts` `wheelCard` | 3.11s · 807 Hz · >4k 2% | [792466](https://freesound.org/s/792466/) hz37 |
| `wheel_trung` | Trúng thưởng thường | `wheelCard` | 0.44s · 985 Hz · >4k 9% | [842513](https://freesound.org/s/842513/) PiesHelpfulOven |
| `wheel_trung_lon` | Trúng Kim khố | `wheelCard` | 1.32s · 1055 Hz · >4k 11% | [165313](https://freesound.org/s/165313/) ani_music |
| `wheel_truot` | Quay trượt | `wheelCard` | 0.21s · 296 Hz · >4k 0% | [583554](https://freesound.org/s/583554/) thehorriblejoke |

Tổng 88 KB. File ở `public/audio/sfx/<cue>.<n>.mp3`.

## Hai họ âm sắc

| Họ | Vùng | Vì sao |
|---|---|---|
| Điện thoại | 630–904 Hz, 0% trên 4 kHz | bong bóng kiểu Messenger, không sạn; tin đến 0,29–0,43 giây hai nốt lên, tin đi 0,17 giây một nốt, soạn tin 0,07–0,10 giây |
| Hệ thống | chip điện tử, phân biệt bằng cao độ: cảnh báo 242 Hz, khởi động 581 Hz lên tông, thông báo 899 Hz, nhiệm vụ xong 1540 Hz | máy móc, đúng chất terminal của app Hệ thống; mỗi cue một file để lần nào cũng nhận ra ngay |

Ngoại lệ: `ph_dang_tin` là màn trập 3160 Hz, cố ý cơ khí, ngang độ sáng `ui_click`.

## Đã loại, dùng tiếng có sẵn

| Loại | Thay bằng | Vì sao |
|---|---|---|
| `ph_chuyen_app` | `ui_click` | lật giấy 0,7–1,0 giây, 45% trên 4 kHz, lại nổ mỗi lần chuyển trang |
| `wheel_tick` | — | `wheel_quay` là vòng quay thật, 19 nấc thưa dần sẵn trong file |
| `ui_nhan_tien` | `sfx_tien_le` | đã có tiếng đếm tiền, 4 biến thể |
| `ui_tra_tien` | `sfx_ngan_keo` | đã có tiếng mở khay tiền |
| `ui_tong_ket` | `ui_mo_so_tay` | đã có tiếng lật sổ |
| `ui_het_tien` | — | màn thua đã có nhạc `toi` |

## Sửa kèm

- `tools/audio/sources.py`: thêm `UIX` tắt `trim`. `trim_silence` cắt theo ngưỡng tuyệt đối −45 dBFS, bản nghe thử Freesound rất nhỏ nên nó gặm mất thân tiếng — bộ đầu ra toàn mẩu 0,07–0,10 giây. Nay cắt tay bằng `start`/`dur`.
- `src/audio/sfx.ts`: thêm `sfx.ui(id)`; `sys_canh_bao` và `wheel_truot` vào `NEGATIVE_CUES` cho công tắc trợ năng tắt được.
- `src/scenes/BootScene.ts`: nạp trước `sfx_tien_le` và `sfx_ngan_keo` vì điện thoại gọi từ HTML.

## Còn lại

- `sys_nhiem_vu_xong` (8-bit powerup) và `wheel_trung_lon` (arpeggio 8-bit): đúng chất chip nhưng có thể quá chất game.
- `wheel_quay` 3,11 giây, vòng quay chạy 4,2 giây, hụt khoảng 1 giây cuối.
- Màn menu: chuyển trang và kéo thanh âm lượng vẫn im.
