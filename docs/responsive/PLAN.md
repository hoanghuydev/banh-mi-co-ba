# Responsive / Mobile — Plan chốt

## Quyết định đã chốt
- Cảnh quán (canvas): **chỉ ngang**; máy dọc hiện lớp nhắc xoay. Menu + intro (DOM) dùng được cả dọc.
- Menu chính: **dựng lại bằng DOM**, bỏ phần canvas của `MenuScene`.
- Di chuyển: **joystick ảo + nút ngữ cảnh**. Chạy là nút riêng, không gắn độ nghiêng.
- Hướng dẫn ngày 1: **cho bỏ qua** như code hiện tại.
- Không đổi số cân bằng (khung thoại không dừng đồng hồ). Nút "Bỏ giới hạn thời gian" sẵn có là trợ giúp.
- Chuẩn: nút/vùng chạm ≥44 CSS px, chữ ≥14 CSS px, không thao tác nào chỉ có phím hoặc hover.

## Phase 0 — Nền
meta + manifest + icon · CSS cảm ứng (touch-action, overscroll, user-select, tap-highlight, callout, dvh, safe-area, contextmenu) · `@media (hover:hover)` · `core/device.ts` · RENDER_SCALE theo viewport + resize · overlay nghe orientation/visualViewport · lớp xoay máy + toàn màn hình · audio resume · font tự host + timeout · pagehide/hidden/context lost/cảnh báo save/persist · SW cache shell · hiệu năng khởi động · công cụ chụp ma trận cỡ.

## Phase 1 — Menu (DOM)
boot, menu chính, xác nhận chơi mới, hỏi số liệu, cài đặt, âm thanh, giới thiệu.

## Phase 2 — Vào game
shutter, PhoneShell intro, đặt tên quán, đánh giá, loading, vào quán.

## Phase 3 — Cảnh quán cảm ứng
input trừu tượng, joystick, nút ngữ cảnh, HUD, AssemblyPanel, TalkPanel, modal, bubble/vòng, Storage/MenuBoard, điện thoại trong game, buổi tối/Broke/Win, hướng dẫn, chuỗi hướng dẫn theo thiết bị.

## Phase 4 — Hoàn thiện
ma trận chụp, sửa doc (CANON, VAN-PHONG-UI, R0.5-KICH-BAN), dọn.

## Ma trận chụp
360×640, 390×844, 412×915 · 800×360, 844×390, 915×412 · 1024×768, 1180×820 · 1280×720 (PC đối chứng).
