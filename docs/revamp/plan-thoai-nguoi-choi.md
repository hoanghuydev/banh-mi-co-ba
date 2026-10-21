# Plan — Viết lại câu thoại của người chơi (Phương Anh)

> Làm theo skill `research-giong-viet`. Thuộc **T6.2** + xưng hô **T0.5.9**. Khuôn: `plan-thoai-anh-bao.md`.
> Mục tiêu: câu người chơi bấm nghe như **Phương Anh — 24 tuổi, bỏ văn phòng ra mở quán, lanh, vui, lì**, không như cháu cô Ba năm 1990.

## 1. Phạm vi (đo 2026-10-20)

| | Số |
|---|---|
| File thoại (trừ `anh-bao` đã xong) | 14 file · 153 cuộc |
| Câu người chơi (`say`, không trùng) | **1.870 câu · ~15.900 từ** |
| Câu dính từ cổ dễ thấy (`nghen`, `hổng`, `chớ`, `thiệt`, `bữa nay`…) | ≥ 400 (đếm thô, thực tế nhiều hơn) |
| Câu có tên NPC viết cứng | 51 — còn lại dùng `{call}` / `{me}` |
| Câu cứng trong code | `playerSay` lúc đưa đồ cho thêm (`sim/service.ts`) |

File nhiều việc nhất: `walkin` 204 · `ba-bay` 165 · `be-su` 160 · `anh-dung` 147 · `chu-kiet` 140.

**Không đụng:** câu NPC (giọng NPC là việc R6 riêng từng người), `tone`, cấu trúc cây, `act`.
**Có đụng:** câu NPC đáp **sai xưng hô** với Phương Anh (vd bé Su gọi "cô" → "chị") — chỉ sửa chữ xưng hô.

## 2. Thứ tự

```
R0.1 xong (thoại hết rel/mem, hết câu nhắc cô Ba)
  → Research giọng chủ quán trẻ
  → Bảng giọng Phương Anh + bảng xưng hô
  → Thí điểm 1 file → bạn duyệt diff
  → 13 file còn lại (agent song song, mỗi agent 1–2 file)
  → Kiểm + chụp màn hình
```

Chờ R0.1 vì R0.1 đợt 3 đang gỡ trường máy và xoá câu chết trong chính các file này — viết trước là viết cả câu sắp bị xoá.

## 3. Research → `docs/research/giong-noi/chu-quan-tre.md`

| Nguồn | Tìm gì | Mẫu |
|---|---|---|
| TikTok | Chủ quán/xe đồ ăn trẻ nói với khách, video "nghỉ việc mở quán", livestream bán đồ ăn | 40 |
| Google Maps / ShopeeFood | **Chủ quán trả lời review** (khen, chê, xin lỗi, cà khịa nhẹ) | 40 |
| Facebook | Page quán nhỏ do người trẻ chạy, group "khởi nghiệp quán ăn", comment chủ quán | 30 |
| Threads | Dân văn phòng than sếp/OT — lấy chất "cựu công sở" | 20 |
| Dataset | UIT-ViHSD câu CLEAN ngắn, đời thường | 50 |

Rút pattern theo **tone đang có trong cây** (`AM` ấm · `THUONG` thương · `DUA` đùa · `LANH` lạnh · …): cách mở câu · từ đệm · độ dài · kiểu đùa · từ cấm.

## 4. Hướng giọng (nháp — chốt sau research)

- Ngắn, lanh, hay đùa nhẹ, không sến. Từ đệm sống: `nha, á, nè, ha, luôn, ghê`. Thỉnh thoảng chất văn phòng (`deadline`, `OT`, `sếp`) — tối đa vài lần cả game.
- Giọng Nam chỉ giữ chữ còn dùng: `hông, nha, nè, mắc, dzậy` (ít).
- Bảng đổi từ cổ dùng chung với `plan-thoai-anh-bao.md` §4.

| Đang có | Hướng mới |
|---|---|
| Trưa bà ghé nghen, con để phần ổ bánh. | Trưa bà ghé nha, con chừa bà một ổ. |
| Dạ bà đi mạnh giỏi nghen bà. | Bà về cẩn thận nha bà. |
| Mai bà kể con nghe cái tuồng bà đang coi đi bà. | Mai kể con nghe tuồng bà đang coi đi bà. |

## 5. Cần chốt

| # | Câu hỏi | Đề xuất |
|---|---|---|
| Q1 | **Phương Anh xưng gì với từng người** | Người lớn tuổi (bà Bảy, bà Sáu, ông Hải, thầy Phúc, chú Tư, chú Kiệt, cô Mai) → xưng **con** · ngang/lớn hơn chút (anh Dũng, chị Lan, chị Hạnh) → **em** · nhỏ hơn (anh Bảo, bé Su, khách sinh viên) → **chị** · khách lạ → theo dáng người (bảng `{call}`/`{me}` sẵn có) |
| Q2 | Câu NPC đáp sai xưng hô | Sửa luôn chữ xưng hô, không đổi giọng NPC |
| Q3 | File thí điểm | `ba-bay` (nhiều câu nhất, người lớn tuổi — khó nhất về xưng hô + tôn trọng mà vẫn trẻ) |
| Q4 | Tên NPC viết cứng (51 câu) | Giữ tên cũ; R6 đổi tên riêng sẽ thay một lượt |

## 6. Kiểm

- `validate:talks`, `lint:lines`, `content:stats` (từ/dòng 8–12).
- Tự chấm theo skill: đọc to, không từ cổ, không trùng khuôn — nhiều câu cùng khuôn thì viết lại.
- Mỗi lựa chọn vẫn khớp `reply` của NPC ngay sau nó.
- Chụp bảng lựa chọn trong game (PC + màn hẹp): chữ không tràn, không cắt.

## 7. Đầu ra

- File research + bảng giọng Phương Anh.
- 14 file JSON mới + diff trước/sau từng câu (giống `thoai-anh-bao-truoc-sau.md`).
- Danh sách câu nghi ngờ để bạn duyệt riêng.

## 8. Đã chốt (2026-10-20)

Q1 xưng hô **theo tuổi** như đề xuất · research chạy **ngay**, sửa JSON **sau R0.1** · thí điểm **`ba-bay`**.
