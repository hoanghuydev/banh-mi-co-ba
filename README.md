# Bánh Mì Cô Ba — bản dựng thử v0.1

> Bạn bán bánh mì ở góc phố Sài Gòn. Khách đứng cách bạn nửa mét và **nhìn thấy mọi thứ bạn làm**.

Bản này có **sảnh menu**, **quán bánh mì ở góc phố**, **di chuyển**, **chuỗi thao tác làm một ổ bánh**,
và **vòng lặp bán hàng với khách thật**: khách tới → gọi món → bạn kẹp nhân → đưa → họ phản ứng → trả tiền.
Trí nhớ dài hạn 3 tầng, tin đồn và kinh tế nằm ở các phase sau (xem `../docs/CANON.md` §17).

## Chạy

```bash
npm install
npm run dev        # http://localhost:5174
npm run build      # tsc --noEmit + vite build -> dist/
npm run check      # chỉ typecheck
```

Client-only, offline-first: **không server, không netcode** (CANON §2). Save nằm ở localStorage.

## Điều khiển

| phím | việc |
|---|---|
| `WASD` / mũi tên | đi (xoay 45° — bấm `D` là đi sang **phải màn hình**) |
| `E` / `Space` | làm việc ở trạm đang đứng cạnh. Trạm có thanh tiến trình thì **giữ** phím |
| kéo–thả | kéo miếng nhân thả vào ổ bánh |
| `1`–`9`, `0` | bỏ thêm một phần nguyên liệu (đường bàn phím) |
| `Backspace` | hoàn tác miếng vừa bỏ |
| `Q` | bỏ thứ đang cầm |
| `Esc` | tạm dừng (đóng băng cả đồng hồ **và** cả sự kiên nhẫn của khách) |

**Chuỗi thao tác:** kệ nguyên liệu → lò than → thớt → chỗ đưa hàng.
Ở **lò** phải **thả tay đúng lúc**: quá vạch trắng là bánh cháy, và bánh cháy **bắt buộc bỏ**
(CANON §7.2 — không có nút nhặt lên dùng tiếp).

## Vòng lặp bán hàng

Khách đi từ ngoài đường vào, xếp hàng, gọi món, chờ, nhận bánh rồi đi.
Ba NPC có tên của CANON §9 (**Bà Bảy**, **Chú Tư**, **Anh Dũng**) xen với khách vãng lai;
Chú Tư luôn ghé 6h45 — lịch sinh hoạt là thứ người chơi phải tự đọc ra.

**Câu gọi món tự nó quyết định được ổ bánh** — cả thành phần lẫn định lượng.
Nghe xong là làm đúng được, không cần nhìn phiếu; phiếu trên HUD chỉ là cái nạng
cho bản dựng thử. Kiểm chứng bằng bất biến: **500/500** đơn sinh ngẫu nhiên đều dựng
lại đúng bảng định lượng chỉ từ câu nói.

Ngữ pháp gọi món: *"một ổ X"* = X mức 2 · *"nhiều X"* = mức 3 · *"đầy đủ"* = đồ chua,
dưa leo, hành ngò mức 2 · *"cho ít rau"* = mức 1 và bỏ hành ngò · *"nhiều ớt"* / *"không ớt"* ·
*"nhiều tương"* / *"không tương"*. Không nói gì thì ớt và tương ở mức 1.

### Định lượng — vì sao có, và vì sao có trần

Mỗi nguyên liệu bỏ được **0–3 phần**, cả ổ tối đa **15 phần**. Không phải có/không.

Có định lượng vì canon đã giả định sẵn: §3.1 xếp *"sai tỉ lệ"* vào `ORDER_DEFECT`;
§14 cho sẵn từ vựng *"nhiều ớt"*, *"cho ít rau"*; §8(g) coi *"bớt một thứ nhỏ với 100%
khách suốt 40 ngày"* là lỗ hổng lớn nhất — lỗ hổng đó chỉ tồn tại nếu bớt được.

Có trần vì §8(i) cấm spam mua chuộc, và một ổ bánh thì kẹp không lại nếu nhồi quá.
Ranh giới giữa hào phóng và ẩu đặt ở **đúng một phần**:

| bạn cho | kết quả |
|---|---|
| đúng mức khách xin | `FLOURISH` |
| **+1** phần đồ chua / ớt / tương / ngò | `FREE_EXTRA` — sự kiện tích cực (§3.2) |
| **+2** phần trở lên | lỗi *"nhiều … quá"* |
| thứ khách đã **cấm**, bao nhiêu cũng vậy | lỗi nặng |
| quá 15 phần | *"ổ bánh nhồi chặt quá, kẹp không lại"* |

Và §8(i): cho thêm hoài thì hết thiêng — hệ số boa tắt dần, tới lần thứ năm khách nói
*"Con cho nhiều vậy chi, cô ngại."* và nó **phản tác dụng**.

Nhân trong ổ vẽ **xếp chồng thành lớp** theo đúng thứ tự làm thật (pate → nhân mặn →
rau → sốt), nên nhìn chiều cao đống là biết mình cho dư hay thiếu.

Mười nguyên liệu: pate · thịt nguội · chả lụa · xíu mại · **trứng ốp la** ·
đồ chua · dưa leo · hành ngò · ớt · **tương ớt**.

### Trà đá — công cụ nguy hiểm nhất trong tay người chơi

CANON §5.4 cho ly trà đá làm **công cụ chủ động hạ attention**: khách cúi xuống uống thì
`gazeFactor` tụt. Chính vì thế nó là thứ dễ phá game nhất — không chặn thì cứ nhồi trà là
khách mù, rồi làm rớt đồ, bánh cháy, sai đơn đều không ai thấy. **T1 và T5 sụp cùng lúc.**

Ba cái khoá, theo đúng thứ tự canon:

| khoá | luật | hiệu quả |
|---|---|---|
| **vật lý** | khách còn cầm ly thì không nhận ly nữa | nhồi liên tục là bất khả |
| **§8(a)** | cửa sổ cúi uống **chỉ có ở ly đầu**, 2,5 s | ly sau họ chỉ cầm lấy đặt xuống |
| **§8(i)** | người tinh ý bắt bài chuyện mua chuộc | từ chối vĩnh viễn + mất kiên nhẫn |

Trần chịu đựng lấy thẳng từ chiều `soi` đã có, không đẻ thêm chỉ số:

| khách | soi | nhận được | tiền tối đa |
|---|---|---|---|
| Bà Bảy — soi nhất hẻm | 0.9 | **1 ly** | 3.000₫ |
| khách thường | 0.55 | 2 ly | 6.000₫ |
| Anh Dũng — vô tư | 0.2 | 3 ly | 9.000₫ |

Trước khi bịt, một khách nhận **20 ly, 60.000₫ tiền không**, 20 lần `CARED_FOR_THEM`,
kiên nhẫn ghim ở trần và `gaze` giữ ở 0.05 vô thời hạn.

### Hai cơ chế lõi đã có thật, không phải giả lập

**Tầng NHẬN THẤY (CANON §5)** — `src/sim/perception.ts`. Chép nguyên công thức:
certainty **tích luỹ** theo thời gian thật, không roll xúc xắc mỗi frame (trụ cột T5).
Bảng `visibility` là bảng tra tĩnh O(1) vì ở quầy khoảng cách và góc đều là hằng số.
Hai mốc hiệu chỉnh của CANON đã kiểm chứng khớp:

| tình huống | CANON nói | đo được |
|---|---|---|
| `DROPPED_FOOD` (75) × khách nhìn thẳng → `CONFIRMED` | ~1,4 s | **1,42 s** |
| cùng sự kiện lúc khách bấm điện thoại (`gaze` 0.05) | ~28 s | **28,1 s** |

**Delivery-time diff (CANON §6)** — cùng MỘT lỗi, hai câu thoại khác hẳn nhau
tuỳ khách có **chứng kiến** hay không. Đây là hiện thân kỹ thuật của trụ cột T1:

> thiếu pate, khách đứng nhìn suốt → *"Nãy cô nhìn thấy rồi — thiếu pate mà."*
> thiếu xíu mại, khách đang bấm điện thoại → *"Sao kỳ vậy, thiếu xíu mại."*

Luật `take(1)` của Lucas Pope: nhiều lỗi cùng lúc chỉ được **nói ra một**, phần còn lại
vẫn trừ tiền ngầm — nói hết làm game dễ đi chứ không khó lên.

## Cấu trúc

```
src/
  core/        clock · config · eventbus · rng · save     khung P0, không biết gì về Phaser
  world/       iso (phép chiếu) · map (bản đồ quán + phố) · stations (luật trạm)
  sim/         perception (§5) · order (§14, T2) · customer · service    luật chơi, không đụng Phaser
  content/     npcs (§9) · lines (§11 shuffle-bag)        dữ liệu viết tay
  art/         palette · canvas · tiles · building · counter · sign · props · character · fx · index
  entities/    Player · CustomerActor                     vị trí, va chạm, sprite, bong bóng thoại
  ui/          theme · Hud · AssemblyPanel                lớp thông tin + bảng kẹp nhân
  scenes/      BootScene · MenuScene · StallScene         StallScene chỉ ĐIỀU PHỐI
```

`sim/` không import Phaser dòng nào — luật chơi tách hẳn khỏi cách vẽ, nên test được
bằng cách bơm frame thẳng vào `Service.update()`.

### Bối cảnh

Quán bánh mì xây ở góc phố, **quầy tủ kính cố định** chứ không phải xe đẩy.
Nhìn từ ngoài đường vào: tường sau có cửa ra vào, hai bên là mặt tiền nhà hàng xóm,
trước quán là vỉa hè rồi tới lòng đường. Người chơi đứng sau quầy, có chừa một lối
đi rộng 2 ô ở đầu quầy để còn ra ngoài dọn bàn, kéo ghế.

### Điểm nối để thay art (v2)

Toàn bộ hình ảnh v1 vẽ bằng `Phaser.Graphics` rồi nướng thành texture.
Mọi thứ đi qua **một cửa duy nhất**: `src/art/index.ts`.

Khi artist giao spritesheet:

1. Đổi `buildTextures()` trong `art/index.ts` thành `scene.load.atlas(...)`.
2. Giữ nguyên bảng tên texture (`TILE`, `BUILD`, `COUNTER`, `PROP`, `FX`, `textureFor`).
3. Xoá `art/tiles.ts`, `art/building.ts`, `art/counter.ts`, `art/props.ts`, `art/character.ts`.

Không file nào trong `core/`, `world/`, `entities/`, `scenes/` phải sửa —
chúng chỉ biết tên texture, không biết texture được tạo ra bằng cách nào.

### Ba luật vẽ (đọc trước khi thêm đạo cụ) — ghi ở đầu `art/canvas.ts`

1. Mọi texture dùng `origin(0.5, 1)`, đặt tại điểm màn hình `footY(sy)`.
   Trong texture, **tâm hình thoi của ô** nằm ở local `y = H - 1 - BASE - TH/2`.
2. **Điểm chạm đất là tâm hình thoi**, KHÔNG phải đáy texture. Đạo cụ luôn dùng
   `standing()`; `isoBox` trần chỉ dành cho nền và tường (hai thứ cố ý ăn xuống đất).
   Sai luật này là vật bị lơ lửng và bóng đổ rơi lệch xuống dưới chân.
3. Thứ **dán lên tường** (cửa, cửa sổ, bảng hiệu) phải nằm trong mặt phẳng vách:
   dùng `facePoint()` / `faceRect()`, và chữ thì `setRotation(atan2(TH, TW))`.
   Vẽ hình chữ nhật thẳng đứng lên mặt nghiêng là ra ngay cảm giác sticker dán đè.

Muốn thêm một vật: `prop(scene, key, heightFor(cao), (g, cx, cy) => ...)` với
`(cx, cy)` là tâm hình thoi. Không tự tính offset ở chỗ khác.

### Vì sao KHÔNG dùng `Container` để gom cảnh

`Phaser.GameObjects.Container` **không depth-sort con** — chỉ `DisplayList` của scene
mới sort. Bỏ cảnh vào Container là mọi `setDepth` mất tác dụng và vật phía sau đè lên
vật phía trước. Nên mọi thứ nằm thẳng trên display list, còn cảnh được canh giữa bằng
**camera scroll** (HUD miễn nhiễm nhờ `setScrollFactor(0)`).

Thêm một đạo cụ mới = thêm ký tự vào `MAP` (`world/map.ts`) + một nhánh trong
`textureForTile()` (`art/index.ts`) + một hàm vẽ trong `art/props.ts`.
Thêm một công đoạn mới = thêm **một dòng** vào `STATIONS` (`world/stations.ts`).

## Vài con số đã chốt

| | |
|---|---|
| Khung hình thiết kế | 1024 × 576, `Phaser.Scale.FIT` |
| Ô isometric | 60 × 30 (2:1) |
| Bản đồ | 20 × 12 ô = 960 × 480 px, cả góc phố lọt gọn một khung hình (CANON T1) |
| Một buổi bán | 05:30 → 10:30 giờ game = **5 phút thật** (`core/clock.ts`, `scale = 1`) |
| Khách một buổi | ~12–16 người, dày hơn hẳn trong cao điểm 6h30–8h (CANON §13.3) |
| Một mùa | 40 ngày, có điểm kết (CANON T4) |
| Tốc độ đi | 3.4 ô/giây |

## Đã bám CANON ở những chỗ nào

- **T1** — cả góc phố trong một khung hình, camera không đi lang thang; khúc quầy ở trạm
  làm việc để **trống cố ý** để tay người chơi luôn nhìn thấy được.
- **T5** — "quá tay" ở lò là **thanh tiến trình có vạch nhìn thấy trước**, không phải roll xúc xắc.
- **§2** — autosave ngay sau mỗi lần đưa hàng, không phải cuối ngày.
- **T2** — người chơi KHÔNG BAO GIỜ chọn câu nói, chỉ chọn nguyên liệu. Không có dialogue tree.
- **T3** — không một chỉ số quan hệ nào hiện ra. Sốt ruột đọc qua **dáng** (đứng yên → nhấp nhổm
  → khoanh tay) và qua lời, không qua thanh số.
- **§5** — perception chạy thật, duyệt **từ phía sự kiện** chứ không phải từ phía NPC
  (bài học Mark of the Ninja). Mỗi mức certainty có biểu hiện bắt buộc: `?` khi liếc thấy,
  `!` khi đã chắc.
- **§11** — shuffle-bag thay random thuần; **~35% số lần nhận thấy không nói gì cả** —
  im lặng làm phần còn lại đáng tin.
- **§7.2 / §7.4** — đồ hỏng bắt buộc bỏ; cô Ba buồn chứ không la.
- **§14** — bảng màu xanh xám + nắng gắt trắng (KHÔNG vàng nghệ); ghế nhựa, hũ đũa,
  bảng hiệu đỏ chữ vàng, xe máy dựng sát vách, chậu trầu bà.
- **§15** — pause mọi lúc và đóng băng đồng hồ; 4 mức cỡ chữ; giảm chuyển động;
  chế độ không giới hạn thời gian. Cả ba công tắc đều **có tác dụng thật**.
- **§16 Đừng-4** — không frame-by-frame: nhịp bước là squash/stretch + lerp.

## Hai thứ phải sống XUYÊN NGÀY

`Service` được tạo mới mỗi sáng, nên bất cứ thứ gì để trong nó là mất sau một ngày.
Hai thứ không được phép mất:

- **Đơn "ruột" của mỗi khách** — sinh từ `Rng.forSeason(seed, npcId)`, bất biến cả 40 ngày.
  Sinh lại mỗi sáng thì *"cho cô như mọi bữa"* (CANON §3.2, salience 90 — khoảnh khắc
  chữa lành lõi của game) thành vô nghĩa.
- **Số lần ghé và số lần được cho thêm** — nằm trong `save.npcMemory`, tích luỹ qua ngày.
  Từ lần ghé thứ 3 khách mới được phép nói *"như mọi bữa"*.

## Hai thang thời gian — đừng trộn

`core/clock.ts` là **giờ trong ngày**, bị nén lại (1 giây thật = 1 phút game).
Tầng nhận thấy chạy bằng **giây thật** (`StallScene.elapsed`), vì chuyện "khách có kịp
nhìn thấy không" diễn ra theo tay người chơi chứ không theo đồng hồ treo tường.
Trộn hai thang này là mọi kích thích tắt ngay trước khi ai kịp nhận ra — đã vấp một lần rồi.

## Chưa có (và cố ý chưa có)

Trí nhớ 3 tầng và decay, đồn thổi, rule DB thoại đầy đủ, 12 NPC (mới có 3),
kinh tế (hạn dùng, giá chợ, nghĩa vụ), sổ tay cuối ngày, âm thanh.
Xem lộ trình phase ở `../docs/CANON.md` §17.
