# Đưa ánh sáng vào game thật

Căn cứ: skill `anh-sang-vat-the`, `docs/revamp/ANH-SANG-VA-HINH-ANH.md`, `tools/light-demo.py` (bản chạy được, kết quả đã duyệt). Mục tiêu: cảnh quán trong game ra đúng chất lượng ảnh demo `art-raw/_duyet/anh-sang-demo/v3_after.png`.

## Kiến trúc (đã chốt)

| Lớp | Việc | Khi nào tính |
|---|---|---|
| Sàn gốc | `bakeGround()` vẽ albedo ô sàn **ở mật độ màn thật** (`ZOOM × RENDER_SCALE` px mỗi px thiết kế), chia mảnh nếu quá 4096 px | Đầu buổi bán |
| Lightmap | Một texture nhân (MULTIPLY) phủ sàn: `AMB·(1 − 0,42·bóng)·AO + SUN·nắng` với `nắng = lá × (1 − bóng vật)` | Đầu buổi bán, tính bằng CPU từ vị trí đạo cụ đang hiện |
| Phản chiếu | Texture thường phủ sàn: lật mặt bên mỗi đạo cụ qua đường chạm đất, nhân mặt nạ độ bóng **theo điểm ảnh** (ranh men/gạch đỏ cắt đúng) | Cùng lúc lightmap |
| Đốm lá lên vật | Mỗi sprite đạo cụ đặt cố định có thêm một ảnh nhân cùng khung, tra nắng tại điểm chạm đất của tia nắng | Khi đặt đạo cụ |
| Người, khách | Bóng đổ + phản chiếu từng frame vẽ bằng canvas 2D (nghiêng/lật qua chân), cache theo (texture, frame); nhuộm nhẹ theo `sun()` tại chân | Lúc chạy, lười |
| Daylight | Giữ tone + vignette + vạt nắng cộng; mưa (`OVERCAST`) bỏ bóng nắng và đốm lá | Như cũ |

Hằng số, công thức, chất liệu: skill `anh-sang-vat-the` (mục 0, 1, 5). Hợp đồng giữa các phần: `src/art/light/env.ts` (`LightEnv`, `LIGHT_DEPTH`).

## Phân việc (mỗi file chỉ một chủ)

| Việc | Chủ | File được sửa |
|---|---|---|
| A1 Lõi tính ánh sáng + test | agent lõi | `src/art/light/*` (trừ `env.ts`, `types.ts`: đã đóng băng, cần đổi thì báo agent chính), `tests/light-*.test.ts` |
| A2 Ảnh: sàn men, gạch đỏ, gobo lá, tủ/thùng HD vào game | agent ảnh | `public/art/*`, `tools/prep-art.py`, `art-raw/**`, `src/art/photo.ts` (hàm `floors`, `STANDING`, danh sách preload), `src/art/tiles.ts`, `src/art/index.ts` |
| A3 Cảnh: lightmap, phản chiếu, đốm lá lên vật, hợp đồng `LightEnv` | agent cảnh | `src/scenes/StallScene.ts`, `src/ui/stall/Daylight.ts`, `src/world/light*.ts` mới |
| A4 Người và khách | agent người | `src/entities/*`, `src/art/light/actor.ts` mới |
| Đánh giá | agent chính | không sửa code; chụp ảnh, chạy `check`/`test`, báo lỗi cho chủ file |

## Quy tắc chung

- Không chạy `git` thay đổi trạng thái (commit, stash, checkout, reset, add). Cây làm việc đang có thay đổi của người dùng.
- Lỗi `tsc` ở file không thuộc mình: bỏ qua, người khác đang sửa dở. Tự mình phải sạch lỗi ở file của mình.
- Dev server: mỗi agent tự chạy `npx vite --port <cổng riêng>` rồi `node tools/screenshot.mjs --url http://localhost:<cổng>/ ...`. Cổng: A1 5301, A2 5302, A3 5303, A4 5304.
- Mọi ảnh chụp: lưu vào `/tmp/claude-1000/-home-hoanghuy-Work-BackupData-Freelancer-Game/53fefc9f-cd6c-44db-bafb-8fcc022aff60/scratchpad/<agent>/`, mở ra xem, báo đường dẫn tuyệt đối. Zoom 8–12× ở chân vật, mép bóng, ranh men/gạch.
- Rule `CLAUDE.md` §4: không comment quá trình, comment tối đa một câu, code chết xoá hẳn.
- Rule độ phân giải: ảnh nguồn ≥ cạnh thiết kế × 3,2 (`QUY-TAC-CANVAS.md`).
- Không gen ảnh ChatGPT trừ A2 (một lượt, nếu còn hạn mức).
- Ngân sách: 33 ms mỗi frame; dựng ánh sáng đầu buổi ≤ 400 ms trên máy dev; báo số đo thật.
