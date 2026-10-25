# Bye Sếp, Em Bán Bánh Mì

> Bỏ sếp, nghỉ việc văn phòng, mở quán bánh mì ở đầu hẻm Sài Gòn. Khách đứng cách bạn nửa mét, **nhìn thấy mọi thứ bạn làm** — rồi chấm sao trên điện thoại.

Game kinh doanh 2.5D, Phaser 3 + Vite + TypeScript. Client-only, offline, save ở localStorage.

**Đang revamp.** Đề bài: [`docs/revamp/00-YEU-CAU.md`](docs/revamp/00-YEU-CAU.md) · luật thiết kế: [`docs/CANON.md`](docs/CANON.md) · luật làm việc cho agent: [`.claude/CLAUDE.md`](.claude/CLAUDE.md).

| Phase | Nội dung | Trạng thái |
|---|---|---|
| R0 | Sửa CANON, đánh dấu doc chết | ✅ |
| R0.1 | Dọn code chết | ✅ |
| R0.5 | Cốt truyện Phương Anh, màn vào game, điện thoại 3 app | ⏳ |
| R1–R5 | Map gọn · topping + giá · nhà cung cấp · review sao · số khách | chưa |
| R6 | Tên riêng 12 NPC, bỏ giọng Nam cổ trong thoại | 🚧 mới xong tên + thay chữ cổ; còn viết lại thoại từng nhân vật |

## Chạy

```bash
npm install
npm run dev        # http://localhost:5174 — overlay dev: F1–F8, ~ console, ?debug=1
npm run ci         # typecheck + gates + validate:rules + validate:talks + lint:lines + test
npm run build      # ci rút gọn + vite build -> dist/
npm run sim -- --days 30 --policy newbie   # chạy N ngày không render
```

| Lệnh khác | Làm gì |
|---|---|
| `npm test` | test tất định (sim, save, clock, thoại, kinh tế) |
| `npm run gates` | cổng kiến trúc: không Phaser trong `sim/`, không `Math.random` ngoài `core/rng` |
| `npm run validate:rules` / `validate:talks` | kiểm rule DB và cây thoại |
| `npm run lint:lines` | kiểm chữ thoại tiếng Việt (`-- --fix` sửa NFC, dấu) |
| `npm run content:stats` | đếm từ/dòng thoại |
| `python3 tools/prep-art.py` | `art-raw/` → `public/art/` (cần Pillow) |
| `python3 tools/render-character.py` | render 8 hướng nhân vật từ model 3D đã rig |

## Một ngày

```
Chợ sáng  →  Quầy (6:00–11:00 giờ game)  →  Tối đếm tiền  →  ngày mới
```

| Màn | Người chơi làm gì |
|---|---|
| **Chợ sáng** | Trả tiền mặt bằng. Mua bánh, nhân, rau theo giá hôm nay (đổi theo thứ, thời tiết, sự kiện). Chọn tiền lẻ mang theo |
| **Quầy** | Khách tới, gọi món. Nướng bánh, kẹp nhân đúng lời khách, đưa, thu tiền. Khách **thấy** tay bạn: rớt đồ, tay dơ, bánh cháy đều bị nhìn thấy |
| **Tối** | Sổ thu chi cộng lại đúng bằng két. Mua/bán đồ nghề. Đi ngủ |

- Chơi **vô hạn ngày**. Hết tiền nhập hàng = **phá sản**, thua.
- NPC có tên ghé theo lịch tuần, cùng khách vãng lai và người đi ngang.
- Tiền theo ngày = giá thật × `ECON.scale` (`content/econ/econ.json`); giá từng ổ, từng món ngoài chợ giữ giá thật.

## Điều khiển

| Phím | Việc |
|---|---|
| `WASD` / mũi tên | đi · giữ `Shift` chạy (cầm đồ mà chạy thì tay lỏng, dễ rớt) |
| `E` / `Space` | làm việc ở trạm đang đứng (lò, thớt, quầy, bồn rửa…) |
| `1`–`9`, `0` / chạm | bỏ thêm một phần nguyên liệu trong bảng kẹp nhân · `Backspace` hoàn tác · `Esc` gác ổ lại |
| `R` | nhấc ổ đang gác trên thớt |
| `Q` | bỏ thứ đang cầm vô thùng |
| `F` | trả lời / bắt chuyện người gần nhất. Đồng hồ vẫn chạy |
| `P` / `Esc` / ⏸ | tạm dừng |

## Cấu trúc

```
src/
  core/     clock, rng (stream tách rời), save (v6), eventbus, flags, telemetry
  sim/      luật chơi, không import Phaser: service (điều phối quầy), customer, perception,
            order, oven, econ, obligations, equipment, suppliers, talk, broke, headless
  dialog/   rule DB chấm điểm theo độ cụ thể, speaker, gates
  content/  npcs, talks/*.json, rules/*.json, lines, econ, menu
  scenes/   Boot, Menu, Day → Market / Stall / Evening / Broke
  ui/       HUD, bảng kẹp nhân, thoại, chợ, tối, phá sản
  world/    bản đồ, isometric, camera, trạm
  art/ audio/ entities/ dev/
tools/      sim, validate, lint, probe-*, render/cắt ảnh nhân vật
docs/       CANON, revamp/, research/, doc phase cũ (có banner ☠️/⚠️/✅)
```

## Luật kỹ thuật (vi phạm là bug)

| Luật | Nội dung |
|---|---|
| L1 | Không `Math.random()` ngoài `core/rng.ts` — mọi ngẫu nhiên đi qua stream có tên |
| L2 | Không hiện `certainty` dạng số/thanh trong bản phát hành |
| L3 | Không NPC nào làm bánh thay người chơi |
| L4 | `stimId` sinh từ đúng một hàm ở `core/stimid.ts` |
| — | `sim/` chạy headless, không import Phaser |

## Viết code

- Code chết xoá hẳn, git giữ lịch sử. Không comment kể quá trình.
- Comment chỉ khi cần; nói được 1 câu thì không quá 1 câu.
- Chữ giao diện viết tiếng phổ thông ([`docs/VAN-PHONG-UI.md`](docs/VAN-PHONG-UI.md)); giọng Nam chỉ ở lời thoại.
- Số cân bằng game chốt bằng mô phỏng (`tools/sim.ts`), không lấy thẳng từ đề bài.
- Đổi UI hay model 3D thì chụp ảnh, xem bằng mắt rồi mới coi là xong.
