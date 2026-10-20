# Rà soát flow trò chuyện — hồ sơ gốc

> ## ⚡ REVAMP 2026-10-20 — ⚠️ LỊCH SỬ, CÒN THAM KHẢO
> Hồ sơ gốc của P2-06 (T2 còn sống). Phần dựa trên quan hệ / trí nhớ / mùa 40 ngày ☠️ — xem banner của [`P2-06`](../../phase-2-he-npc/P2-06-flow-tro-chuyen.md) và [`CANON.md`](../../CANON.md) bản revamp.

**Ngày:** 2026-10-02 · **Kết quả:** `../../phase-2-he-npc/P2-06-flow-tro-chuyen.md`

Hồ sơ này là **vật liệu thô** dẫn tới bản thiết kế P2-06. Giữ lại vì ba lý do: các con số
trong P2-06 đều truy ngược về đây; 22 lỗi ẩn ở `03-ba.md` chưa sửa hết nên còn phải tra
lại; và bản khảo sát `04` / `05` là thứ không nên phải làm lại lần hai.

| File | Góc nhìn | Thứ đáng đọc nhất |
|---|---|---|
| `00-de-bai.md` | Đề bài chung đưa cho cả sáu hướng rà soát | Hiện trạng hệ thống + 7 lỗi người chơi báo, nguyên văn |
| `01-players.md` | Bốn persona chơi thử | Xếp hạng **mức đau thật** (khác hẳn mức đau kỹ thuật) · 5 lỗi mới · thời điểm từng persona bỏ tính năng |
| `02-pm.md` | Phán quyết sản phẩm | Bốn đường xử lý mâu thuẫn CANON T2 kèm chi phí từng đường · đo tỉ lệ đọc/làm · bảng P0/P1/cắt · 5 metric + 3 anti-goal |
| `03-ba.md` | Đặc tả hệ thống | Máy trạng thái hiện tại · truy vết 7 lỗi về `file:dòng` · **22 lỗi ẩn đã verify** · 40 FR + 8 NFR · ma trận xung đột 7×5 · bản đồ ~40 dòng code |
| `04-research-games.md` | Khảo sát 16 tựa có quầy hàng | Bảng **10 mẫu thiết kế bê thẳng được** · mục phản biện (ca thất bại) · 35 nguồn có link |
| `05-research-interaction.md` | Khảo sát hệ tương tác, input, chỉ báo | Sơ đồ phím 0-phím-mới · thuật toán chọn mục tiêu có trọng số theo trục · số đo chứng minh bảng đáy che trọn khách |
| `06-theory.md` | Lý thuyết UX | Chẩn đoán bằng CLT / attention residue / mode error · trục cửa sổ ngắt quãng · **17 luật thiết kế** kèm cách kiểm chứng tự động · bảng 11 câu thay "hết chuyện để nói" |

---

## Một mâu thuẫn đã phân xử

Hai hướng rà soát ra kết luận ngược nhau, và bản P2-06 **không chọn một bên**:

| | Đề nghị | Lý do |
|---|---|---|
| `02-pm.md` | **Giữ 100% cây thoại, kèm cả `clock.paused`** | 12.600 dòng JSON ≈ 13 tuần-người; mọi phương án cắt đều bỏ 70–95% số chữ đã trả tiền |
| `06-theory.md` + `03-ba.md` | **Bỏ cả cây lẫn đóng băng** | *"Bất kỳ phương án nào vẫn giữ một modal toàn phần có `clock.paused` thì không đóng được lỗi #1, và không đáng làm."* |

**Phân xử:** cả hai đúng một nửa, và hai nửa đó không xung đột nhau.

- **Giữ nội dung** — PM đúng. Không một dòng nào bị bỏ.
- **Bỏ modal và bỏ đóng băng** — Theorist và BA đúng. Cây chuyển sang dải neo cạnh vai khách,
  nhãn ≤ 24 ký tự, câu đầy đủ nói ra bằng bong bóng *sau khi chọn*.

Cái chốt lại hai bên là **`clock.busy` thay cho `clock.paused`** (P2-06 §2.2): hội thoại thôi
đóng băng thế giới, mà vẫn không bị đốt ở tốc độ tua nhanh ×120. Nó thoả luật L17 của
`06-theory.md` — *chi phí chú ý và chi phí trong game phải đi cùng chiều* — bằng một cơ chế
`Clock.currentScale()` **đã có sẵn**, và không hiện thêm một con số nào (T3).

Và nhãn ngắn hoá ra là **đòn bẩy chứ không phải nhược điểm**: nút trở thành *một ý định* thay
vì *một câu nói*, tức là đi về phía T2 chứ không phải chạy khỏi nó.

---

## Những chỗ hồ sơ tự đánh dấu là CHƯA xác minh

Giữ nguyên để người đọc sau không tưởng là đã chắc:

- `04-research-games.md` — không tìm được tên nghề thống nhất cho mẫu "bark + đi sâu tuỳ chọn";
  Supergiant không dùng chữ "shuffle-bag" trong nguồn nào tìm được; chưa rõ Stardew có dừng
  đồng hồ khi mở hộp thoại hay không.
- `05-research-interaction.md` — "notification decay" **không phải** thuật ngữ nghiên cứu đã có;
  gần nhất là banner blindness + interruption coordination. Deus Ex và AbleGamers APX chỉ nêu
  theo trí nhớ, đã đánh dấu `[M]` trong file.

---

## Việc còn lại

P2-06 §7 liệt kê **10 lỗi ẩn phải sửa kèm**. `03-ba.md` §C có đủ **22 lỗi**, tất cả đã verify
trong code — 12 lỗi còn lại chưa được đưa vào P2-06 vì không nằm trên đường tới bảy lỗi chính.
Chúng vẫn là lỗi thật, và `03-ba.md` là chỗ duy nhất ghi lại chúng.
