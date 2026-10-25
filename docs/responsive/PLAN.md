# Responsive / Mobile — Kết quả

## Quyết định
| # | Quyết định |
|---|---|
| 1 | Cảnh quán (canvas) **chỉ ngang** trên điện thoại; máy dọc hiện lớp nhắc xoay. Menu + intro (DOM) dùng được cả dọc |
| 2 | Menu chính dựng bằng **DOM** (`MenuDom`); `MenuScene` chỉ còn chuyển cảnh |
| 3 | Di chuyển: **joystick ảo + nút ngữ cảnh**. Chạy là nút riêng, không gắn độ nghiêng |
| 4 | Hướng dẫn ngày 1 **cho bỏ qua** (nút "Bỏ qua") |

Không đổi số cân bằng. Nút "Bỏ giới hạn thời gian" sẵn có là trợ giúp cho người chạm chậm.

## Chuẩn
- Nút, vùng chạm **≥ 44 CSS px** (`MIN_TOUCH`).
- Chữ **≥ 14 CSS px** (`MIN_FONT`).
- Không thao tác nào chỉ có phím hoặc hover.

## Đã làm
| Phase | Nội dung |
|---|---|
| Nền | meta + manifest + icon; CSS cảm ứng (touch-action, overscroll, safe-area, dvh); font tự host; `device.ts`; `RENDER_SCALE` theo khung nhìn; lớp nhắc xoay + toàn màn hình; pagehide / lưu / xin persist; service worker |
| Menu | boot, menu chính, xác nhận chơi mới, hỏi số liệu, cài đặt, âm thanh, giới thiệu (DOM) |
| Vào game | shutter, PhoneShell intro, đặt tên quán, đánh giá, loading |
| Cảnh quán | `InputState`/intent, joystick + nút, HUD, AssemblyPanel, TalkPanel, modal, bubble/vòng, Storage/MenuBoard, điện thoại, buổi tối / Broke / Win, hướng dẫn theo thiết bị |
| Đợt mobile 2 | canvas phủ toàn màn trên điện thoại ngang (`GAME_W` theo tỉ lệ màn, chốt lúc tải); HUD hai ô gọn + cột nút phải; ba ô điều khiển cố định; hướng dẫn ngày 1 thành dải; Pause có Cài đặt; lắp bánh bảng gọn, kho ngăn kéo phải, bảng menu một thẻ; điện thoại cảm ứng ngang toàn màn; Thực phẩm gọn + giỏ dính đáy; menu "Chơi tiếp" là nút chính, xoá ván giữ 1 giây; chặn click mồ côi (`tapGuard`) |
| Hoàn thiện | ma trận chụp, sửa doc (CANON, VAN-PHONG-UI, QUY-TAC-CANVAS, R0.5, README) |

## Kiến trúc
| Phần | File | Vai trò |
|---|---|---|
| Thiết bị | `src/core/device.ts` | `isTouch()` (cài đặt `touchControls` on/off/auto, auto theo `pointer: coarse`), `orientation()`, `viewport()`, `fitScale()`, `designFor()`, `hint(pc, touch)`, `onDeviceChange()`. Gắn `data-touch`, `data-orient` lên `<html>` |
| Nhập liệu | `src/input/intent.ts` | `InputState`: bàn phím và cảm ứng cùng ghi, cảnh chỉ đọc. Joystick ra 8 hướng như WASD, độ nghiêng chỉ quyết định đi hay đứng. Action: interact, discard, lift, talk, pause, phone |
| Điều khiển chạm | `src/ui/touch/TouchControls.ts`, `touchStyle.ts` | DOM phủ trên canvas: joystick nổi ở 45% trái, nút hành động tròn, nút nhỏ chạy / che / bỏ / nhấc / nói. Nút không áp dụng thì ẩn. Màn có dải trống hai bên thì đặt vào giữa dải |
| Cỡ theo thiết bị | `src/ui/theme.ts` | `touchSize()`, `touchFont()` (UI), `worldFont()` (chữ trong thế giới, tính cả ZOOM); chuột giữ nguyên cỡ gốc |
| Menu | `src/ui/menu/MenuDom.ts`, `menuStyle.ts` | Toàn bộ trang menu bằng DOM; chữ chỉ dẫn qua `hint()` |
| Điện thoại trong game | `src/ui/phone/PhoneShell.ts` | Đủ chỗ (tỉ lệ ≥ 0,85) thì có khung viền ảnh; không thì **chế độ gọn** (`data-compact`), thêm `data-card` khi rộng ≥ 500 và `data-short` khi cao < 520 |
| Camera | `src/world/camera.ts` | PC: `ZOOM` = 1,28. Cảm ứng: tăng tới trần 1,7 để vòng lò đạt cỡ chạm; nhìn cao hơn để vòng lò không chui xuống nút HUD. Tính lại mỗi lần dựng camera |
| Nhắc xoay | `src/ui/rotatePrompt.ts` | Ở cảnh quán + cảm ứng + máy dọc: phủ lớp nhắc, ngủ vòng lặp game; xoay ngang thì chạy tiếp. Nút "Toàn màn hình" nếu trình duyệt hỗ trợ; vào cảnh quán lúc đang toàn màn hình thì thử khoá ngang |
| Service worker | `public/sw.js` | 2 cache: `shell-<version>` (trang, `assets/`; mạng trước, rớt thì cache) và `static-v1` (`art/ audio/ fonts/ icons/`; cache trước). Đổi nội dung asset giữ nguyên tên thì đổi tên `static-v1` |
| PWA | `public/manifest.webmanifest` | fullscreen, icon 192/512/maskable |

## Chụp kiểm
Cần `npm run dev` (cổng 5174).

| Việc | Lệnh |
|---|---|
| Giả lập điện thoại | `node tools/screenshot.mjs --out A.png --size 844,390 --touch --dpr 3` |
| Đặt / nhấc ngón, giữ ngón | `--press x,y[,x2,y2]` · `--release` · `--hold x,y,ms[,x2,y2]` |
| Một màn, cả ma trận | `node tools/shot-matrix.mjs --out DIR --name boot [--sizes ...]` (cạnh ngắn ≤ 500 thì tự `--touch --dpr 3`) |

## Ma trận cỡ màn
| Nhóm | Cỡ |
|---|---|
| Điện thoại dọc | 360×640, 390×844, 412×915 |
| Điện thoại ngang | 800×360, 844×390, 915×412 |
| Máy tính bảng | 1024×768, 1180×820 |
| PC (đối chứng) | 1280×720 |

## Chạy trên điện thoại
`npm run dev` mở `host: true`, cổng 5174: vào `http://<IP máy tính>:5174` từ máy cùng wifi.

## Giới hạn đã biết
- Chưa thử máy thật Android / iOS; mới chụp bằng giả lập Chrome headless.
- iOS Safari không khoá được hướng; chỉ có lớp nhắc xoay (và toàn màn hình chỉ có trên iPad).
- `ZOOM` chỉ tính lúc dựng camera; xoay máy hay đổi cỡ giữa cảnh quán thì đến lần dựng sau mới đổi.
- Bàn phím ảo (ô đặt tên quán, ô nhập khác) chưa thử thật; PhoneShell và menu bám `visualViewport` để né.
- `RENDER_SCALE` tính một lần lúc tải trang theo cỡ khung nhìn lúc đó, trần 2.
- `markScale` (vòng, dấu hiệu trong cảnh to thêm 1,25 lần) cũng chốt lúc dựng cảnh.
- `GAME_W` chốt lúc tải trang: xoay máy sang tỉ lệ khác giữa chừng thì letterbox lại; chưa thử tai thỏ thật.
- Điện thoại ngang thấp (cao ≤ 390): Cài đặt và Âm thanh cuộn trong khay (chỉ thấy khoảng 2 hàng), vì vùng chạm 44px không cho ép vừa hơn.
- Thẻ hướng dẫn ngày 1 ở 800×360 đè một phần HUD ngày/tiền (đặt ngay dưới nút điện thoại đang được chỉ).
- `tests/p5-rain.test.ts` ("mặt tiền ngắn bất thường") và cổng `dist/art 7,6 MB > 6 MB` đỏ sẵn từ nhánh gốc, không do phần responsive.
