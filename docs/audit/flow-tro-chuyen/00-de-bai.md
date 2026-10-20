# BRIEF CHUNG — Rà soát lại toàn bộ FLOW TRÒ CHUYỆN của "Bánh Mì Cô Ba"

> ## ⚡ REVAMP 2026-10-20 — ⚠️ LỊCH SỬ, CÒN THAM KHẢO
> Hồ sơ gốc của P2-06 (T2 còn sống). Phần dựa trên quan hệ / trí nhớ / mùa 40 ngày ☠️ — xem banner của [`P2-06`](../../phase-2-he-npc/P2-06-flow-tro-chuyen.md) và [`CANON.md`](../../CANON.md) bản revamp.

## Game là gì
2.5D isometric, Phaser + TypeScript, client-only. Người chơi bán bánh mì ở một con hẻm
Sài Gòn. Một mùa = 40 ngày. Lõi thiết kế (docs/CANON.md §0): **"a game about being
watched while you work"** — khách đứng cách nửa mét và NHÌN THẤY mọi thứ bạn làm.

Vòng lặp một lượt khách: khách tới → đứng vào 1 trong các slot ở quầy → gọi món bằng
LỜI NÓI (không có checklist) → người chơi đi lấy ổ ở kệ → nướng ở lò (3 slot) → mang ra
thớt → mở **bảng kẹp nhân** (AssemblyPanel, modal, kéo-thả / phím 1–9) → gói 3 nhịp →
đưa → khách phản ứng → trả tiền. Song song: tay dính tiền phải rửa, thớt bẩn phải lau,
ổ nguội dần ~26s, bánh cháy có mùi cả hàng ngửi thấy, khách có `waitSec` (kiên nhẫn)
và bỏ đi nếu chờ lâu.

## 5 trụ cột CANON (vi phạm = sai thiết kế, không phải tranh luận)
- **T1** Khách chấm QUÁ TRÌNH, không chỉ kết quả.
- **T2** "Món ăn LÀ lựa chọn hội thoại" — nguyên văn CANON: *"Không có dialogue tree.
  Người chơi không bao giờ chọn câu nói. Họ chọn nguyên liệu."*
- **T3** KHÔNG hiện chỉ số quan hệ. Không "+3 thiện cảm", không thanh tình cảm, không màu tên.
- **T4** Một mùa có điểm kết, 40 ngày, ship trọn vẹn.
- **T5** Rủi ro phải ĐỌC ĐƯỢC TRƯỚC khi hành động. Không roll xúc xắc giấu mặt.

CANON §16 "Ba thứ đừng làm" cũng quan trọng: Đừng-1 — đừng mô phỏng sâu đời sống NPC
ngoài quầy; thay bằng nguyên tắc Jeff Orkin (F.E.A.R.): *"Vocalizing intentions can
sometimes even be enough, without any actual implementation."*

CANON §15 trợ năng: pause mọi lúc (đóng băng cả kiên nhẫn khách); chế độ không giới hạn
thời gian; text không bao giờ tự chạy tiếp; cỡ chữ 4 mức; giảm chuyển động.

## HỆ THỐNG TRÒ CHUYỆN HIỆN TẠI (bản P5-01/P5-02, code thật)

### Dữ liệu — `src/sim/talk.ts`
- Một `Talk` = `{ id, npc, topic, opener, openMood, initiates?, ignore?, when?, weight?, tree[], shared{} }`.
- `TalkNode` = `{ say (câu người chơi), tone, reply? (câu khách đáp), mood?, silent?,
  then[]? | ref?, need?, needCash?, rel?, mem?, anger?, calm?, flag?, act? }`.
- `TalkTone`: AM · THUONG · DUA · THANG · LANH · GAT · CHUI · IM (tô mép trái nút theo giọng).
- `TalkMood` 14 giá trị → map sang hệ mặt 3 lớp (mày/mắt/miệng) + pose.
- `TalkAct` (hành động thật): PAY · DISCOUNT · FREE_LOAF · PROMISE · STEP_ASIDE · REFUSE · INVITE.
- `MAX_DEPTH = 6`. Cây rẽ nhánh thật, mỗi nút mang `reply` riêng.
- Kho thoại: 12 NPC có tên + `WALKIN` (khách vãng lai đang mua) + `QUA_DUONG`
  (người đi ngang, KHÔNG mua) + `ANY`. ~12.600 dòng JSON đã viết.

### UI — `src/ui/stall/TalkPanel.ts`
- Panel modal nằm ĐÁY màn hình, cao tối đa 56% khung hình, hiện: tên người nói + câu họ
  vừa nói + huy hiệu mặt + 2–4 nút lựa chọn (số 1–4 / ↑↓+Enter / click) + hint.
- Mở panel = `clock.paused = true` (StallScene.openTalkPanel) — ĐÓNG BĂNG cả thế giới.
- Esc = "làm thinh", có giá (`talk.ignore`, mặc định rel −1).

### Luồng vào — `src/sim/service.ts` + `src/scenes/StallScene.ts`
1. **Chủ động:** người chơi bấm `F` → `Service.openTalk()`. Target chọn theo
   `talkTarget()`: (1) người vừa bắt chuyện với mình → (2) người nói chuyện được GẦN
   NHẤT trong bán kính `TALK_REACH = 3` ô (kể cả người đi ngang ngoài đường) → (3) người
   đứng đầu quầy (`front`).
2. **Bị động:** `offerTalk()` — khách TỰ bắt chuyện. Ba cái van: `initiates ≤ 0.6` khai
   trên từng cuộc (toàn bộ 14 file chỉ có 18 cuộc có `initiates`), `TALK_OFFERS_PER_DAY = 3`,
   `TALK_OFFER_GAP_SEC = 100`. Khi trigger: khách nói opener thành bong bóng + HUD toast
   `"<tên> bắt chuyện — bấm F để trả lời"`. Không bấm F tới lúc họ đi = làm thinh, có giá.
3. **Mời khách:** act `INVITE` trong một cuộc với người QUA_DUONG → roll
   `inviteChance()` (`src/sim/passersby.ts`): base 0.2, +0.24 nếu đã ngoái nhìn xe,
   +giọng (AM +0.2, DUA +0.08, THUONG +0.04, THANG −0.04; LANH/GAT/CHUI/IM = 0 tuyệt đối),
   +warmth (trần +0.15), −0.13×số người đang đứng quầy, trần 0.8, = 0 nếu hết bánh.
   Roll là `hub.derive('invite:<id>')` → MỘT người chỉ có MỘT câu trả lời, mở lại cũng
   ra đúng chữ "thôi" đó (chống save-scum).
4. **Thất bại:** `talkUnavailable()` trả 3 câu: `"chưa có ai để nói chuyện"` · `"…"` ·
   **`"hết chuyện để nói với <tên> bữa nay rồi"`**.

### Người qua đường — `src/sim/passersby.ts`
Người đi ngang KHÔNG mua gì, không vào kinh tế, không tính `ahead`. 30% ngoái nhìn cái
xe 1.1–2.6s. Cửa DUY NHẤT để họ thành khách là người chơi tự mời.

## 7 LỖI NGƯỜI CHƠI (chủ dự án) BÁO
1. **Switch content quá nhiều** — nhảy qua lại giữa trò chuyện và làm bánh mì. (Lưu ý:
   trò chuyện là modal full-stop đóng băng đồng hồ, làm bánh cũng là một modal panel khác.)
2. **Phải chủ động bấm F mới có gì xảy ra.** Tệ hơn: khách đang định mua bánh mì, bấm F
   thì nó lại mở cuộc `walkin.nhamquan` — khách gọi "Cho tui tô hủ tiếu" (nhầm quán).
   Câu đó LẼ RA phải do NPC chủ động nói lúc họ tới, chứ người chơi bấm F mà ra câu đó
   là lỗi logic game. → Một số câu thoại BẮT BUỘC phải do NPC chủ động nói.
3. **Đang bán bánh mà có người bắt chuyện + hiện hội thoại là rất phiền.** Cần tham khảo
   các game khác: hiện dấu/chỉ báo trò chuyện? NPC cứ nói (bong bóng) rồi nếu người chơi
   muốn phản hồi thì mới bấm F?
4. **Thiếu NPC-với-NPC:** muốn lâu lâu các NPC ngoài đường gặp nhau nói chuyện/tán gẫu
   với nhau, hoặc chỉ chào nhau rồi đi. (Hiện chỉ có cảnh "nghe lỏm" ở `sim/overhear.ts`
   — 1 cảnh/ngày, 8h15–10h30, dùng đúng tin vừa lan đêm trước.)
5. **Spam mời khách:** NPC qua đường đã từ chối 1–2 lần, người chơi vẫn spam mở trò
   chuyện để mời tiếp. Vô lý. (Roll đã deterministic nhưng cuộc trò chuyện vẫn mở lại được.)
6. **Câu "hết chuyện để nói với abc bữa nay rồi" nghe vô lý** — phải là "abc không muốn
   nói chuyện lúc này" / "abc không muốn nói chuyện với bạn" gì đó.
7. **Nhiều người cùng đứng đó, bấm F không biết sẽ nói với AI.** Không có chỉ báo target.

## TÓM LẠI (nguyên văn chủ dự án)
> Flow nói chuyện còn khá nhiều lỗi và dễ xung đột với việc user làm bánh, gây mất cân
> bằng, và user switch content khá nhiều. Thêm những flow nói chuyện còn rất nhiều lỗi
> logic thực tế, cũng như lỗi về UX thao tác gây khó khăn cho player.

Toàn quyền: được **sửa hết flow, đập bỏ tính năng, đổi UX/UI** nếu cần.

## MÂU THUẪN GỐC CẦN ĐƯỢC CÂN NHẮC NGHIÊM TÚC
CANON T2 nói nguyên văn **"Không có dialogue tree. Người chơi không bao giờ chọn câu
nói."** Nhưng P5-01 đã dựng đúng một cái dialogue tree với panel chọn câu. Đây rất có
thể là nguồn gốc của lỗi #1 và #3. Mọi đề xuất phải trả lời thẳng câu hỏi này: giữ,
thu nhỏ, hay bỏ hẳn cây thoại — và nếu bỏ thì 12.600 dòng nội dung đã viết đi đâu.

## ĐƯỜNG DẪN FILE QUAN TRỌNG (gốc repo: /home/hoanghuy/Work/BackupData/Freelancer/Game/banh-mi-co-ba)
- `src/sim/talk.ts` (544 dòng) — mô hình dữ liệu + phiên + hệ quả
- `src/ui/stall/TalkPanel.ts` (256) — panel chọn câu
- `src/sim/service.ts` (3083) — §"trò chuyện (P5-01)" ~dòng 2285–2470, `offerTalk` ~2845, `applyAct`/`invite` ~2577–2680
- `src/scenes/StallScene.ts` (2800) — input ~960–995, prompt ~1280, talkOffer toast ~1405, `askFront`/panel ~2100–2160
- `src/sim/passersby.ts` (211) — người đi ngang + `inviteChance`
- `src/sim/overhear.ts` (68) + `src/sim/gossip.ts` (377) — nghe lỏm, tin đồn
- `src/ui/AssemblyPanel.ts` (560) — bảng kẹp nhân (cái modal kia)
- `src/ui/Hud.ts` (624), `src/ui/stall/BubblePool.ts`, `src/ui/stall/GossipCorner.ts`
- `src/content/talks/*.json` (14 file, ~12.600 dòng)
- `docs/CANON.md`, `docs/00-TONG-QUAN.md`, `docs/phase-2-he-npc/*`
