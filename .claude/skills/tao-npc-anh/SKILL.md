---
name: tao-npc-anh
description: Làm sprite NPC đi 8 hướng chỉ bằng ảnh ChatGPT (không qua model 3D) cho Bánh Mì Cô Ba — ảnh 4 mặt, 8 hướng đứng im, 8 hướng đi, ghép atlas như anh-bao.json rồi lắp vào game. Dùng khi user nhờ "tạo ảnh NPC", "làm nhân vật bằng ảnh", "sprite đi 8 hướng" cho một người trong dàn nhân vật.
---

# Tạo NPC bằng ảnh

Ra atlas `public/art/<ten>.webp + .json` có `idle_<h>_00` ×8 và `walk_<h>_00..07` ×8, cùng khoá với `anh-bao.json`. Mẫu đã chạy: chú Đạt (`art-raw/_duyet/chu_dat/`, xem `log.md`).

Đọc trước: skill `tao-anh-game` (thao tác ChatGPT, tải ảnh) và `claude-in-chrome`. Prompt đầy đủ ở `references/prompt.md`.

## Flow

| # | Việc | Chat | Ảnh đính kèm | Ra file |
|---|---|---|---|---|
| 0 | Phiếu nhân vật từ `src/content/npcs.ts` (`body`: da, tóc, áo, quần, tạp dề…) + `docs/CANON.md` | — | — | — |
| 1 | 4 mặt đứng im (trước, phải, sau, trái), mắt ngang | Chat A | `art-raw/anh-bao-list.png` | `4mat.png` |
| 2 | 8 hướng đứng im, camera nâng 30°, lưới 2×4 | **Vẫn chat A** | — | `8huong.png` |
| 3 | `cat-idle.py` cắt 8 ô đứng im; `mau-dang.py … le` và `… chan` dựng mẫu dáng | — | — | `idle/`, `pose-le/`, `pose-chan/` |
| 4a | Pha bước: mỗi hướng **1 chat riêng**, 1 hàng 4 pha | Chat B1…B8 | `pose-le/<h>.png` + `idle/<h>.png` | `walk/<h>.png` |
| 4b | Pha chuyển tiếp — **bắt buộc, làm ngay từ đầu**: gửi tiếp trong chat B của hướng đó | Chat B1…B8 | `pose-chan/<h>.png` + `walk/<h>.png` | `walk-chan/<h>.png` |
| 5 | Ghép: `ghep-npc.py` → `pack-atlas.py` → `optimize-art.py` | — | — | `public/art/<ten>.*` |
| 6 | **Review cuối** (mục dưới): `kiem-atlas.py` ĐẠT + soi ảnh soi, `-to.png`, `-chan.png` bằng mắt. Chưa đạt thì gen lại đúng hướng/dải hỏng, không lắp | — | — | ảnh soi |
| 7 | Lắp: thêm dòng `NPC_PHOTOS` trong `src/art/photo.ts` | — | — | — |
| 8 | Test trong game bằng **Claude in Chrome** (mục Test game): xem nhân vật đi đủ 8 hướng, nhất là se (tới quầy) và nw (đi về). **Chưa qua bước này thì chưa được báo xong nhân vật** | — | — | GIF, ảnh chụp |

Thứ tự hướng mọi nơi: `s se e ne n nw w sw`. `s` = mặt nhìn camera, `e` = nghiêng phải, `n` = quay lưng.

## Luật đã rút ra

- **Không xin "4 frame đi" suông.** ChatGPT luôn vẽ cùng một chân bước lên, kể cả xin từng frame hay sửa ảnh (chú Đạt: 4 lượt hỏng). Phải đính **mẫu dáng** = frame 1,3,5,7 của atlas 3D có sẵn (`mau-dang.py`, mặc định anh Bảo) và bảo chép đúng tư thế từng ô.
- **Khoá đèn và màu trong mọi prompt**: đèn trên-phải, độ sáng và màu y ảnh đứng im. Ghép xong vẫn bù màu: **một độ bù chung cả strip**, không chỉnh từng frame (chỉnh từng frame làm frame sáng tối xen nhau).
- **Ảnh đứng im và ảnh đi lệch tỉ lệ thân** (hai lượt vẽ khác nhau): cỡ = trung bình nhân của khớp-bề-ngang-đầu và khớp-chiều-cao. Đã có trong `ghep-npc.py`.
- **Đủ frame ngay từ đầu: mỗi hướng 2 dải = 8 frame khác nhau.** Game cần 8 frame đi (`GAIT_FRAMES.walk = 8`). ChatGPT vẽ bước trái và bước phải gần như một (pha 1 ≈ pha 3), nên chỉ 1 dải 4 pha nhân đôi lên 8 thì trong game chỉ thấy **2 hình lật qua lật lại** (lỗi user bắt ở chú Đạt, phải làm bù 8 lượt). Luôn làm cả dải bước (mẫu frame 1,3,5,7) lẫn dải chuyển tiếp (mẫu frame 0,2,4,6) — chân lướt qua nhau, người nhún lên — rồi `ghep-npc.py` xen kẽ: chẵn = chuyển tiếp, lẻ = bước. Không bao giờ nhân đôi frame để đủ số.
- **Hướng s và n (đi thẳng về/ra xa camera) dễ trông như trượt**: tạp dề, váy, áo dài che chân nên frame gần như giống nhau (chú Đạt hướng s chỉ đạt biên độ 13,7, anh Bảo 18,8). Prompt hai hướng này phải thêm câu "legs/feet clearly visible" (xem `references/prompt.md`); vẫn dưới 16 thì gen lại với câu "EXAGGERATE" — bước to, nhấc gót thấy đế, tay vung rộng (mẫu: `references/prompt.md` mục "EXAGGERATE").
- **Chân không đổi phiên** (cô xách giỏ, bà cụ, Dì Liên, Thầy Khải, chú Quang, Ngọc Trâm — user bắt trong game ở hướng se/nw: "giống thiếu hoạt ảnh ở giữa"): cả 8 frame cùng một chân đứng trước, chỉ dang to nhỏ khác nhau → trong game trông như trượt, khựng giữa bước. Hai nguồn: (1) dải chuyển tiếp chép dáng bước dài của ảnh 2 (dải bước cũ) thay vì vẽ chân khép — ở mẫu, cả 4 frame chuyển tiếp mọi hướng đều khép chân (dang ≤ 0,30 chiều cao), dải bước luôn có frame dang rộng; (2) dải bước gộp chân trái/phải. Prompt 3 có câu "LEG CHECK", prompt 4 có câu "Take ONLY the look … NOT its poses … feet stay close together" (`references/prompt.md`). `kiem-atlas.py` không bắt được bằng "8 hình khác nhau" hay biên độ (bản hỏng vẫn ĐẠT cả hai): nó in **khép chân** và CẢNH BÁO khi > 0,75, rồi **bắt buộc soi `-chan.png`** (vùng chân phóng ×2, hàng mẫu anh Bảo ngay trên hàng NPC): chân trước phải đổi phiên đúng như hàng mẫu, frame khép của mẫu thì NPC cũng khép. Cảnh báo có thể oan (pha lệch mẫu nhưng vẫn đổi chân đều: khách lạ w, Khả Hân nw) — mắt quyết. s/n không đo được, chỉ soi mắt.
- Bước 1–2 cùng một chat để giữ mặt; bước 4a mỗi hướng một chat mới, ảnh tham chiếu đính lại đầy đủ; bước 4b gửi tiếp trong chính chat đó.
- **Giày trắng của mẫu dáng lọt sang**: anh Bảo đi giày trắng, ChatGPT hay chép vào chân sau. Mọi prompt đi thêm câu "Footwear" ở `references/prompt.md`; soi chân từng frame trong `soi.png`. Lọt rồi thì **đừng xin ChatGPT sửa giày**: lượt sửa hay vẽ lại cả dải thành bước dài, mất pha khép chân (Dì Liên se/nw, Thầy Khải se hỏng đúng kiểu này). Giữ bản đầu, tô giày bằng `scripts/to-giay.py <vào> <ra> <ô>` rồi soi phóng to.
- Chạy 8 hướng song song (8 tab), xong cả 8 dải bước mới gửi 8 dải chuyển tiếp.
- **Tách nền sót ở khe kín**: tay chạm quần/hông thì khoảng trắng giữa tay và thân bị bao kín, tách nền tưởng là một phần người nên giữ lại (lỗi user bắt ở Chú Quang, ảnh đứng hướng s). `ghep-npc.py` xoá mọi lỗ trắng kín **dưới phần đầu** (38% trên của hình), trong phần đầu chỉ xoá lỗ to để giữ lòng trắng mắt. Máy không đo được lỗi này trên atlas (khe sót và áo/giày trắng có số đo như nhau), nên **bắt buộc soi `-to.png`** (nền hồng tím, phóng ×2): khe tay–thân, nách, khe chân không được còn mảng trắng/xám.
- **Áo sáng màu dễ bị khoét thủng**: lỗ kín chỉ bị xoá khi trung bình min kênh ≥ 247 (khe nền thật ≥ 246,8; áo xanh nhạt của Ngọc Trâm 236–246,6). Áo trắng tinh có thể vượt ngưỡng → soi `-to.png` xem áo còn nguyên mảng. Bị khoét thì xin ChatGPT áo trắng ngà có bóng đổ rõ ("off-white, soft shading, not pure white"), đừng hạ ngưỡng chung. Ăn mòn còn đến từ phía ngoài: mặt áo trắng được đèn chiếu (≥236) chạm liền nền thì phần nền tô từ mép ăn luôn vào áo (Khả Hân: mất áo cả 8 frame hướng sw). Áo/tóc sáng màu (trắng, kem, bạc, xanh nhạt) thì **xin ngay từ đầu** màu ngà có bóng xám rõ và viền xám mảnh (prompt mẫu: `references/prompt.md` mục "Áo/tóc sáng màu").

## Chấm ảnh (mở bằng Read)

| Bước | Đạt khi |
|---|---|
| 4 mặt | Đủ 4 góc, đứng thẳng tay buông, đúng phiếu (màu áo, phụ kiện), nền trắng |
| 8 hướng | Ô 2 xiên phải-dưới, ô 4 lưng xiên phải-trên, ô 6 lưng xiên trái-trên, ô 8 xiên trái-dưới; thấy đỉnh đầu (camera nâng); đèn đều 8 ô |
| Dải bước | Đúng hướng như ô đứng im; ô 1 và ô 3 ngược chân trước, ô 2 và ô 4 cũng vậy; cùng màu với đứng im; hướng s/n thấy rõ chân và dép |
| Dải chuyển tiếp | Cả 4 ô chân khép/lướt sát nhau dưới thân — có ô nào dang chân như dải bước là hỏng, gen lại |

Sai thì gửi câu sửa **trong chính chat đó** (user muốn mỗi việc một chat), sửa đúng lỗi đó.

## Review cuối (bắt buộc trước khi lắp và trước khi báo xong)

```bash
python3 .claude/skills/tao-npc-anh/scripts/kiem-atlas.py public/art/<ten>.json <scratchpad>/soi-<ten>.png
```

Máy kiểm (phải ra `ĐẠT`; đã chỉnh ngưỡng cho anh Bảo 3D đạt, bản lỗi "nhân đôi frame" bị bắt):

| Lỗi | Ngưỡng |
|---|---|
| Thiếu ô / ô trống | đủ `idle` ×8, `walk` ×8×8 |
| Frame lặp | 2 frame liền kề chênh < 5 (ảnh thu 60×96) |
| Thiếu pha | < 5 hình khác nhau trong 8 frame một hướng |
| Chuyển động yếu | biên độ (|Δ| frame liền kề, cỡ 40×64) < 16 — anh Bảo thấp nhất 18,8; dưới mức này trong game trông như đứng yên |
| Lệch màu | trung bình màu dải đi lệch ảnh đứng im > 8/255 |
| Lệch cỡ | bề ngang đầu (trung vị dải 10–25% trên) lệch ảnh đứng im > 13% |
| Chân lơ lửng / lún | đáy chân lệch đáy chung > 5% chiều cao ô |

Mắt soi trên ảnh soi (mỗi hàng một hướng, cột 1 = đứng im, vạch vàng = đáy chân) — máy **không** đo tin được mấy thứ này:

- **Sai hướng**: mọi frame trong hàng quay cùng phía với cột 1 (mặt/lưng, trái/phải). Không frame nào lật ngược.
- **Đúng chu kỳ**: đọc trái → phải thấy bước → lướt → bước chân kia → lướt; không có frame nhảy cóc.
- **Chân đổi phiên** — soi trên `soi-<ten>-chan.png`: mỗi hướng so hàng NPC với hàng mẫu ngay trên nó; chân trước đổi đúng chỗ mẫu đổi, frame mẫu khép chân thì NPC cũng khép. Cả hàng một chân đứng trước = hỏng.
- **Đúng người**: mặt, ria, tóc, tạp dề, dép giống nhau mọi frame; không lẫn đồ của mẫu dáng (kính, áo khoác anh Bảo).
- **Sạch** — soi trên `soi-<ten>-to.png` (nền hồng tím ×2): không viền trắng, không mảng trắng ở khe tay–thân, nách, khe chân, không cụt tay chân.
- Cỡ 65 px (ảnh soi thu nhỏ): đứng ↔ đi không co giãn.

Lỗi nằm ở hướng nào thì gen lại đúng dải đó trong chat của hướng đó, ghép và review lại cả atlas.

**Xong nhân vật = review cuối đạt + test game đạt** (bước 8): spawn NPC, xem nó đi tới quầy (se) và đi về (nw) ở Chrome thật, chân phải đổi đều, không khựng, không trượt. Agent không test game được thì báo "chưa test game", người giao việc test rồi mới chốt.

## Lệnh

```bash
T=.claude/skills/tao-npc-anh/scripts
python3 $T/cat-idle.py art-raw/_duyet/<ten>                  # 8huong.png -> idle/<h>.png
python3 $T/mau-dang.py art-raw/_duyet/<ten>/pose-le le       # mẫu pha bước
python3 $T/mau-dang.py art-raw/_duyet/<ten>/pose-chan chan   # mẫu pha chuyển tiếp
python3 $T/to-giay.py <vào.png> <ra.png> <ô 1–4>             # giày trắng lọt -> nâu, trước khi ghép
python3 $T/ghep-npc.py art-raw/_duyet/<ten> <ten-atlas>      # -> art-raw/render/<ten-atlas>/
python3 tools/pack-atlas.py <ten-atlas> --height 192         # -> public/art/<ten-atlas>.png+.json
python3 tools/optimize-art.py                                # png -> webp
sed -i 's/"image": "<ten-atlas>.png"/"image": "<ten-atlas>.webp"/' public/art/<ten-atlas>.json
python3 $T/kiem-atlas.py public/art/<ten-atlas>.json <scratchpad>/soi-<ten-atlas>.png   # review cuối
```

Đặt file trong `art-raw/_duyet/<ten>/`: `8huong.png`, `walk/<h>.png` (dải bước), `walk-chan/<h>.png` (dải chuyển tiếp) — đúng tên này thì `ghep-npc.py` mới đọc được. Bản thử hỏng để riêng thư mục khác.

Lắp game — khoá là `id` NPC (= `memKey`), `h` = cao thiết kế (người lớn 64–65):

```ts
CHU_KIET: { src: (d) => `npc/chu-dat/${d}`, h: 64, walk: "chu-dat" },
```

## Test game

Dùng **Claude in Chrome** (Chrome thật, 60 khung hình/giây). **Không dùng headless** để soi chuyển động: headless chỉ ~3 khung hình/giây nên ai cũng đi như quay chậm, kết luận sai (đã sai một lần ở chú Đạt).

1. Tìm cổng dev đang sống: `ss -ltnp | grep 517` + `ps -o stat -p <pid>` (vite bị Ctrl+Z có trạng thái `T`, vẫn giữ cổng nhưng treo — dùng cổng khác, đừng đụng tiến trình của user). Tab **mới** `http://localhost:<cổng>/` → "Chơi tiếp" (save của user; báo user là đã vào save) → chờ vào quán, đồng hồ chạy (6h00 "mới dọn hàng" là đồng hồ chưa chạy, khách đứng yên).
2. `javascript_tool`: `dev.npc.spawn('<ID>')`. Gọi một NPC mỗi lần (hai người đứng đè nhau).
3. Xem đi thật: để NPC tự đi tới quầy rồi đi về (hướng se, nw), cùng lúc người qua đường đi ngang (e, w). Đối chiếu với `-chan.png`: hướng nào nhìn khựng/trượt thì gen lại dải đó. Đo frame thật: chuỗi `zoom` liên tiếp (giữ tab ở trước mặt — tab nền bị Chrome hãm còn ~2 khung/giây) + `gif_creator`. Mỗi ảnh phải một dáng khác.
4. Kiểm texture đã nạp đúng bản mới: vẽ `__game.textures.getFrame('<ID>_<h>_w<i>')` ra canvas, so 8 frame liền nhau (phải khác nhau). `__game.scene.getScene("stall").actors` → `a.body.texture.key` cho biết frame đang hiện.
5. Game nạp atlas **một lần lúc mở trang**: thay atlas xong phải tải lại trang (Ctrl+Shift+R). Báo user tải lại tab của họ, không thì họ vẫn thấy bản cũ.
6. So cỡ cả dàn: đặt tạm một hàng `scene.add.image(x, y, '<ID>_s')` (scale lấy từ `a.body.scaleX` của một actor) cạnh người chơi và NPC cũ, phóng to xem, rồi `destroy()`. Trẻ em thấp rõ, người lớn ngang nhau.
7. Xong thì đóng tab đã mở.

## Mẹo trình duyệt (ChatGPT Plus)

- **Chỉ dùng ChatGPT.** Đã thử Gemini (26/10, chú đeo kính): 41+ ảnh chưa xong một nhân vật, sửa trong chat không ăn, lệch hướng, đầu nhỏ, watermark, CAPTCHA khi mở nhiều tab; Flow không đính được ảnh tham chiếu. Hết hạn mức ChatGPT thì chờ reset.

- Chạy song song nhiều tab được (đã chạy 7 tab cùng lúc, không vướng hạn mức).
- Tab nền không nạp ảnh: chụp màn hình tab đó trước rồi mới lấy `img[alt^="Generated image"]`.
- Gửi nhiều file trong một `browser_batch`: tổng mỗi lượt dưới 10 MB, chia 2 tab một lượt.
- Một tab "Thinking" quá 5 phút: bấm dừng, đính lại ảnh, gửi lại trong cùng chat.
- `javascript_tool` đứt sau 45 giây: đừng chờ ảnh trong JS, chờ bằng lượt khác. Bọc code trong `(()=>{…})()` để khỏi trùng biến giữa các lượt.
- Ảnh mới nhất = `Generated image` cuối danh sách; chat dài thì ảnh cũ bị gỡ khỏi DOM.
- Chrome chặn tải tự động sau 1–2 file mỗi tab: đóng tab, mở tab mới vào đúng URL chat rồi tải.
- Dính giới hạn tần suất ("too many requests"): chờ 2–4 phút rồi bấm "Try again"; 3 agent song song là vừa.
- **Hạn mức gói Plus**: ngày 2026-10-25 hết sau khoảng 170 ảnh trong ~3 giờ (≈ 7 nhân vật × 18–26 lượt), khoá ~7 giờ ("You've hit the Plus plan limit… resets in 7 hours"). Sau reset hạn mức không hồi đủ: 0h21 mở lại thì 0h47 khoá tiếp sau ~40 ảnh (hạn mức tính theo khung thời gian trượt). Một đợt chỉ nên nhắm ~6–7 nhân vật; gặp màn này thì dừng tất cả agent, ghi log.md (ảnh đạt, hướng còn thiếu, URL chat từng hướng) để làm tiếp, không bấm "Upgrade".

## Báo user

Đường dẫn đầy đủ: atlas, kết quả `kiem-atlas.py` (số hình khác nhau + biên độ từng hướng) + ảnh soi, `xem-truoc-di.gif` (8 hướng đi), `4mat.png`, `8huong.png`, GIF trong game; số lượt gen. Nhắc user Ctrl+Shift+R tab game. Ghi `log.md` mỗi lượt.
