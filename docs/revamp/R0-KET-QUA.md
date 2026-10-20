# R0 — Kết quả Canon & hạ tầng

**Ngày:** 2026-10-20 · **Trạng thái:** T0.1 xong (doc) · T0.2 xong từ trước · phần CANON của R0.5 đã vào

## 1. Đã làm

| Việc | Ở đâu |
|---|---|
| CANON: bỏ T3, T4 · thêm **T6 — sao là chỉ số uy tín công khai duy nhất** | `CANON.md` §1 |
| CANON: đánh dấu ☠️/🔁/⏳ từng mục · thêm lỗ ăn gian m/n/o · kết game thắng/thua · R0–R6 (+R0.5) | `CANON.md` khối đầu, §3–§17 |
| CANON theo R0.5: bỏ cô Ba · Phương Anh · sếp cũ · quán thật · tên **Bye Sếp, Em Bán Bánh Mì** | `CANON.md` §0, §7.4, §9.1, §10, §13 |
| Banner trạng thái đầu **67 doc cũ**: 21 ☠️ toàn bộ · ~40 ⚠️ một phần · 5 ✅ sống | đầu mỗi file trong `docs/` |
| Mục lục + luật agent cập nhật | `00-TONG-QUAN.md`, `.claude/CLAUDE.md` |

**Quyết định user đã chốt:** trí nhớ/đồn thổi/quan hệ chết, tính cách giữ làm persona review · perception giữ làm đầu vào review · giữ chi phí cố định/ngày, bỏ hụi + tiền học · mùa 40 ngày + arc + ending chết.

**Chưa làm:** gỡ code chết (`sim/memory`, `gossip`, `notebook`, `season`, `ending`…). Code gỡ ở phase R chạm tới — xem §3.

## 2. Câu hỏi mở — đề bài chưa quyết, doc cũ đang phụ thuộc

| # | Câu hỏi | Phase nên chốt |
|---|---|---|
| 1 | ✅ **Chốt hướng:** ~54 khách/ngày quá tải, 5 ổ quá thưa → R5 mô phỏng chọn mức **vừa phải**, tăng dần. Áp lực giờ cao điểm **được bỏ** hoặc làm nhẹ | R5 |
| 2 | ~~Tip còn không?~~ ✅ **Chốt: tip ☠️** — không có chỉ số ngầm | — |
| 3 | ~~Hết tiền nhập hàng?~~ ✅ **Chốt: game over phá sản** | — |
| 4 | **Rửa tay theo lô 10 ổ** vs `DIRTY_HANDS` "cầm tiền rồi bốc bánh" — trong 10 ổ đó có còn là lỗi không | R1 |
| 5 | **Mất công cụ hạ attention "cô Ba tiếp khách"** — còn 4 công cụ. Thay hay không | R1 |
| 6 | **Lịch thời tiết / sự kiện giá** trước là lịch tĩnh 40 ngày. Chơi vô hạn thì sinh thế nào, mưa có nhân vào `Y(x)` không | R3, R5 |
| 7 | **Chống micro-cheat (§8g)** trước dựa trí nhớ NPC. Review "dạo này nhạt" cần trạng thái tổng hợp — làm sao không thành trí nhớ ẩn | R4 |
| 8 | **Thoại vô hạn:** bỏ `usedSeason` thì kho thoại cần luật quay vòng; cổng thoại theo ngày đổi sang theo thành tích? | R6 |
| 9 | **Act thưởng bằng quan hệ** (`DISCOUNT`, `FREE_LOAF`, `BARTER`) — hệ quả mới là gì | R4 |
| 10 | **Đốt vía / mở hàng** mất người mang niềm tin (cô Ba). Chuyển cho mẹ, khách lớn tuổi, hay bỏ | R0.5 |
| 11 | ~~Màn thua "nộp lại CV"~~ ✅ **Chốt: tuỳ chọn, có thể không làm** — game over đơn giản là đủ | — |
| 12 | Cấm **Early Access / live ops** trước dựa T4 — giữ không, lý do mới là gì | R0.5 / phát hành |
| 13 | **Chơi lại ngày** khi bị đóng cửa ATTP — có cho không | R4 |

## 3. Code chết → Phase 0.1

Đã thêm **Phase 0.1 — Dọn code chết** vào đề bài (`00-YEU-CAU.md` §1a), chạy **ngay sau R0, trước R0.5**. Xoá hẳn, không để code chết, không comment kể quá trình. Luật ghi ở `.claude/CLAUDE.md` §4.
