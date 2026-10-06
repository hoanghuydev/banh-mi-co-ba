# Bánh Mì Cô Ba — bản dựng thử v0.1

> Bạn bán bánh mì ở góc phố Sài Gòn. Khách đứng cách bạn nửa mét và **nhìn thấy mọi thứ bạn làm**.

Bản này có **sảnh menu**, **quán bánh mì ở góc phố**, **di chuyển**, **chuỗi thao tác làm một ổ bánh**,
và **vòng lặp bán hàng với khách thật**: khách tới → gọi món → bạn kẹp nhân → đưa → họ phản ứng → trả tiền.
Từ P2: **12 khách có tên** với lịch ghé theo thứ trong tuần, **nhớ** chuyện bạn làm (và quên dần),
**kể cho nhau nghe** (bạn nghe lỏm được ở góc hẻm), và **sổ tay cô Ba** để bạn tự ghi tên, ghi đoán.
Kinh tế nằm ở phase sau (xem `../docs/CANON.md` §17).

## Chạy

```bash
npm install
npm run dev              # http://localhost:5174 — có overlay dev (F1–F8, ~ console, ?debug=1)
npm run build            # typecheck + cổng CI + vite build -> dist/ + quét dist không lọt code dev
npm run build:playtest   # bản gửi người lạ chơi thử cổng P1 -> dist-playtest/ (docs/playtest/)
npm run check            # chỉ typecheck
npm test                 # test tất định, save, clock, frame, telemetry, công cụ nội dung
npm run ci               # check + gates + validate:rules + lint:lines + test
npm run gates            # cổng P0: không phaser trong sim/, không Math.random ngoài core/, …
npm run validate:rules   # R001–R014 cho rule DB (P0-03 §2.3a)
npm run lint:lines       # L001–L013 cho thoại tiếng Việt, `-- --fix` sửa NFC / kiểu dấu / viết hoa
npm run content:stats    # đếm dòng/từ, đối chiếu mốc CANON §11
python3 tools/prep-art.py       # rửa lại ảnh artist: art-raw/ -> public/art/ (cần Pillow)
python3 tools/cut-character.py  # cắt bảng xoay nhân vật ra 8 hướng (thêm tên người để cắt một mình)
npm run sim -- --days 40 --policy newbie   # chạy 40 ngày không render (< 3 s)
```

Client-only, offline-first: **không server, không netcode** (CANON §2). Save nằm ở localStorage.

## Điều khiển

| phím | việc |
|---|---|
| `WASD` / mũi tên | đi (xoay 45° — bấm `D` là đi sang **phải màn hình**) |
| giữ `Shift` | chạy — nhanh hơn, nhưng **cầm đồ mà chạy thì tay lỏng dần** (grip, P1-01 §2.7) |
| `E` / `Space` | làm việc ở trạm đang đứng cạnh (rót trà thì **giữ** phím) |
| kéo–thả / chạm / `1`–`9`, `0` | bỏ thêm một phần nguyên liệu |
| `Backspace` | hoàn tác miếng vừa bỏ |
| `Esc` (trong bảng kẹp nhân) · nút "để đó" · đi khỏi thớt | **gác** ổ lại trên thớt, giữ nguyên phần đã kẹp |
| `F` | **trả lời** người vừa nói với mình, hoặc bắt chuyện với người đang có **vòng sáng dưới chân**. Đồng hồ **vẫn chạy** — nói chuyện tốn giờ bán thật. Tay đang bận thì cú bấm được **xếp hàng**, nói ngay khi rảnh |
| giữ `C` | nghiêng người che tay — khách phía trước khó thấy tay/thớt hơn (OCCLUDE_BODY) |
| `Q` | bỏ thứ đang cầm vô thùng (1 giây, không ai để ý) |
| nút `P1` `P2` `P3` trong bảng kẹp nhân | áp preset chia sẵn buổi sáng — một chạm thay mười chạm, nhưng **không tự sửa theo lời khách dặn** |
| `E` ba nhịp (gập · cuộn · xoắn) | gói bánh — ba nhịp **đều tay** là một khoảnh khắc khéo tay khách nhìn thấy (FLOURISH) |
| đứng ở bồn rửa, giữ `E` 3 s | rửa tay — nhận tiền xong tay **dính tiền**, bốc bánh bằng tay đó là khách thấy (DIRTY_HANDS) |
| `E` ở thớt trống, tay không | lau thớt — quầy bẩn dần (vụn bánh → ruồi) làm khách soi kỹ hơn |
| `P` / `Esc` / nút ⏸ | tạm dừng (đóng băng đồng hồ, sự kiên nhẫn **và** mức nhận thấy của khách) |
| `Tab` | **sổ tay cô Ba** — pause hoàn toàn. Trái: máy ghi ai · mấy giờ · gọi gì · lần thứ mấy. Phải: **con tự ghi** tên, ghi chú, "cô đoán" |
| đứng yên lúc có người nói chuyện ở góc hẻm | nghe lỏm được **nội dung**; giữ `Shift` (nghiêng người) thì nghe được cả **ai nói** — nhưng khách trước quầy thấy mình lơ đễnh |
| `G` (vài giây sau khi khách nói "ghi sổ nghen") | **ghi nợ** vào sổ — không bấm thì chỉ còn trí nhớ hai bên, mà trí nhớ thì lệch dần (P3-02) |

**Chuỗi thao tác:** kệ → **lò (3 slot, nướng nền)** → thớt → quầy gọi món.
Lò không còn là "giữ phím canh giờ": bỏ ổ vào rồi đi làm việc khác, **vòng trên cửa lò**
cho biết độ giòn (vạch = giòn / sém). Quá tay là **cháy, có mùi** — cả hàng cùng ngửi thấy.
Ổ ra lò **nguội dần** (~26 s, hơi khói tắt = nguội) — đưa ổ nguội là khách chê.
Bánh cháy **bắt buộc bỏ** (CANON §7.2). Rớt đồ chỉ xảy ra khi tay lỏng (chạy, va đồ đạc) —
luôn có vòng cảnh báo cam → đỏ quanh món trước khi rớt (T5: rủi ro phải đọc được trước).

## Một ngày kinh tế (Phase 3)

**Chợ sáng** (trước quầy): giá hôm nay theo thứ trong tuần + chuyện ngoài chợ, giá hôm qua mờ bên cạnh.
Chọn tiền lẻ mang theo (100/200/300k), "Mua như hôm qua", mua chịu mối quen (thân rồi mới cho chịu —
trả trễ Chủ nhật là mối nhớ). Đồ để trong thùng xốp có hạn, hàng cũ xuống chất dần; pate chỉ để qua đêm.

**Tối đếm tiền**: sổ thu chi bên trái, bên phải ba trang — **Sổ nợ nần** (tiền chỗ, gửi về nhà, hụi,
tiền học, thuốc; hoãn được nhưng mất là mất thật: mất chỗ đầu hẻm, bị đuổi hụi, phải bán đồ nghề),
**Đồ nghề** (xe 12 ô — mua/bán lại 60%, món hiện ngay trên xe, không có con số hiệu ứng),
**Chỗ đứng** (hỏi dì Năm để coi chỗ; dán giấy báo dời trước 1/2/4 bữa — báo trước càng lâu người quen
càng đi theo; dời ra xa thì người không theo sẽ không ghé nữa). Không có game over: hết tiền thì cô Ba bù,
gửi về nhà thiếu.

Tiền trong game = giá thật × một hệ số (`ECON.scale` = 0,40 trong `content/econ/econ.json`)
cho các khoản theo ngày/mùa; giá từng ổ, từng lạng ngoài chợ giữ đúng giá thật.

## Một mùa 40 ngày (Phase 4)

Mùa có nhịp 4 hồi (học luật · mở rộng · áp lực và mất mát · khép lại) — người chơi **không bao
giờ** thấy mình ở hồi mấy, và HUD không có "/40". Lịch mùa ở `src/content/season/days.json` là
nguồn duy nhất: trời, sự kiện, mốc arc, tín hiệu báo trước (có test cân bằng + phanh XĐ3).

- **Mở dần bằng người, không popup:** đồn thổi + nhớ nhầm từ ngày 9 hoặc phút thứ 90 (cú lộ:
  bà Sáu kể cô Mai nghe trước tiệm) · sổ nợ ngày 9 (cô Mai — trước đó bán chịu chỉ nhớ trong
  đầu) · **tự ghi sổ tay ngày 11** (thầy Phúc đưa cây bút) · bảng QR, đèn ca tối ngày 14 · đổi
  chỗ đứng ngày 16.
- **12 người gọi đúng câu của mình** (P4-01), có khẩu vị ẩn không bao giờ nói ra — làm theo khẩu
  vị ẩn cũng đúng, bỏ qua thì không bị gì. **Gói sẵn ổ quen trước khi khách mở miệng** là cách
  "nhớ" mạnh nhất (REMEMBERED_USUAL tầng T-B).
- Người đi ngang không mua: chú Kiệt 6h10 liếc vô lò (nóng thì gật đầu), bà Sáu rao, cô Mai chạy
  bộ sáng thứ Hai. Có người sẽ đi, có báo trước — không có gì đánh dấu.
- **Tối — "Chuyện trong hẻm":** thỉnh thoảng có một việc để làm bằng tay (đem hũ đồ chua qua cho
  ai đó, đẩy xe ra sân đình, thuê làm bảng hay chờ người vẽ). Không bấm = không làm gì — cũng là
  một lựa chọn.
- **Ngày 40** không có cảnh tối: sau khi khách cuối đi là khoảng lặng 40 giây (Enter/Space để qua),
  rồi màn kết — ai còn ghé, sổ tay của chính người chơi, cô Mai chốt sổ, dòng cuối của cô Ba,
  credits, **một nút duy nhất**. Không điểm, không %, không New Game+.

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
  core/        clock · rng · save · eventbus · context · flags · platform · telemetry · types
               khung P0, không biết gì về Phaser
  world/       iso (phép chiếu) · map (bản đồ quán + phố) · stations (luật trạm)
  sim/         perception (§5) · menu (bảng món) · order (§14, T2) · customer · service · frame · headless
               tour  dẫn bữa đầu, 7 việc: chợ → bảng menu → lấy bánh → nướng → thớt → nhân → gói
               luật chơi, không đụng Phaser — chạy headless được
  content/     npcs (§9) · lines/*.json (§11) · days/ · rules/ · recipes/menu.json · redlines.json
               dữ liệu viết tay
  art/         palette · canvas · tiles · building · counter · sign · menuboard · props · character · fx · index
               photo        art v2 — ảnh artist đè lên bản vẽ code (xem "Art v2" bên dưới)
  entities/    Player · CustomerActor                     vị trí, va chạm, sprite, bong bóng thoại
  ui/          theme · backdrop · Hud · AssemblyPanel · menu/MenuBoardView · intro/IntroView
               tour/TourCoach  bong bóng dẫn bữa đầu (khoanh tròn + cô Ba + nút Bỏ qua)
               lớp thông tin + bảng kẹp nhân + bảng menu treo vách (E ở vách) + màn mở đầu
  scenes/      Boot · Menu · Intro (màn mở đầu + đặt tên) · Day (thường trực, sở hữu GameContext)
               → Market → Stall → Evening
  dev/         overlay F1–F8 + console — chỉ có ở dev build, tree-shake khỏi bản phát hành
tools/         sim · validate-rules · lint-lines · content-stats · check-gates   (Node, qua tsx)
               prep-art.py  rửa ảnh artist art-raw/ -> public/art/   (Python + Pillow)
               cut-character.py  cắt bảng xoay nhân vật -> public/art/{player,npc/<tên>}/ (8 hướng)
art-raw/       ảnh artist gửi, nguyên bản — KHÔNG đi vào bản build
tests/         node:test
```

`sim/` không import Phaser dòng nào — luật chơi tách hẳn khỏi cách vẽ, nên test được
bằng cách bơm frame thẳng vào `Service.update()`.

### Bối cảnh

Quán bánh mì xây ở góc phố, **quầy tủ kính cố định** chứ không phải xe đẩy.
Nhìn từ ngoài đường vào: tường sau có cửa ra vào, hai bên là mặt tiền nhà hàng xóm,
trước quán là vỉa hè rồi tới lòng đường. Người chơi đứng sau quầy, có chừa một lối
đi rộng 2 ô ở đầu quầy để còn ra ngoài dọn bàn, kéo ghế.

### Art v2 — ảnh thật của artist

Art v1 vẽ bằng `Phaser.Graphics` rồi nướng thành texture. **Art v2 KHÔNG thay thế v1
mà ĐÈ LÊN nó**: `src/art/photo.ts` ghi đè đúng những key texture mà artist đã có ảnh,
chạy ở cuối `buildTextures()`. Nhờ vậy món nào artist chưa vẽ (quầy tủ kính, tường,
nhà hàng xóm, khách, két nước, dưa leo, tương ớt) tự khắc còn nguyên bản vẽ code —
không thủng lỗ, và không một file nào trong `core/`, `world/`, `entities/`, `scenes/`
phải sửa: chúng chỉ biết TÊN texture, không biết texture ấy sinh ra bằng cách nào.

```
art-raw/            ảnh artist gửi, NGUYÊN BẢN. Nằm ngoài public/ là cố ý: vite chép
                    nguyên si public/ vào dist/, mà bộ ảnh gốc nặng ~10 MB
  |  python3 tools/prep-art.py     chạy lại mỗi khi artist gửi file mới
  v
public/art/         ảnh đã rửa: tách nền đen, cắt sát alpha, XOAY ổ bánh về nằm ngang
                    (ổ bánh nằm trên tay người chơi thì phải ngang), và ép ô sàn về
                    hình thoi 2:1 đúng cỡ texture game
  |  src/art/photo.ts              bảng chỗ đặt: cao bao nhiêu px, lệch trái phải bao nhiêu
  v
texture game        TILE.floor · PROP.* · HELD.key · FOOD.icon / big / loaf · p_<hướng> · <NPC>_<hướng>
```

Hai file hai việc, không chồng lấn: **`prep-art.py` chỉ RỬA ảnh**, **`photo.ts` chỉ ĐẶT ảnh**.
Muốn cái lò cao hơn thì sửa bảng `STANDING` trong `photo.ts`, không đụng script Python.

**Tám hướng.** `tools/cut-character.py` cắt bảng xoay của artist ra tám file rời,
mỗi người một **thư mục riêng**, file đặt tên bằng đúng tên hướng:

| ai | bảng gốc | ra |
|---|---|---|
| cô Ba (người chơi) | `art-raw/character_model_list.png` | `public/art/player/p_<hướng>.png` |
| anh Dũng | `art-raw/anh-dung-list.png` | `public/art/npc/anh-dung/<hướng>.png` |
| bà Bảy | `art-raw/ba-bay-list.png` | `public/art/npc/ba-bay/<hướng>.png` |
| anh Bảo | `art-raw/anh-bao-list.png` | `public/art/npc/anh-bao/<hướng>.png` |

Mỗi người một dòng trong bảng `CAST` của script; artist gửi bảng mới thì thêm một
dòng, không hàm nào phải sửa. Bố cục ô **mỗi bảng một kiểu** nên `CAST` ghi rõ ô nào
ra hướng nào — đừng chép bảng của người này sang người kia. Bảng nào artist render
trùng góc (hoặc bỏ sót) một hướng thì lấy hướng đối xứng lật ngang; `CAST` ghi rõ ô
nào bị lật và vì sao lật được.

Tên hướng là hướng TRÊN MÀN HÌNH (`Facing8` ở `world/iso.ts`): `s` là đi xuống màn
hình, `e` là sang phải — khớp đúng tám tổ hợp WASD. Tám file dùng CHUNG một khung,
đáy khung là mặt đất và tâm ngang khung là tâm hai bàn chân, nên quay người không
làm nhân vật nhảy lên hụp xuống hay trượt ngang. Ai chưa có bảng xoay thì vẫn là bản
vẽ code ba hướng (`w` lật ngang `e`), nên `textureFor` gộp tám về ba cho họ — xem
`markEightWay` ở `art/character.ts`. Khách có ảnh thì khai ở bảng `NPC_PHOTOS` trong
`art/photo.ts`, khoá là `id` bên `content/npcs.ts` (trùng luôn tiền tố texture, nên
không file gameplay nào phải sửa). Thiếu dù chỉ một file ảnh là cả bộ lặng lẽ rơi về
bản vẽ code, đúng luật "không thủng lỗ" ở trên.

Bảng nào artist render hai hàng bằng hai **góc máy** khác nhau thì thân người chênh
cả chục phần trăm giữa hai hàng (dấu hiệu: thân chênh nhiều mà bề ngang ĐẦU gần như
không đổi) — xoay một vòng là người cao lên thấp xuống mấy px. Bật `san` cho người đó
trong `CAST` để ép tám hướng về cùng cỡ; script in sẵn `chênh cao giữa tám hướng` mỗi
lần cắt để biết khi nào cần. Cách sửa thật nằm ở phía artist: render lại cả tám ô bằng
một góc máy.

Lưu ý cho lần artist vẽ tiếp — CANON §15 bắt icon nhân phải khác nhau về **hình dáng**
chứ không chỉ khác màu: ảnh thịt nguội và chả lụa hiện đều là lát tròn hồng, in đen
trắng ra là lẫn nhau. Bản vẽ code cũ cố tình cho thịt nguội hình vuông bo góc.

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
vật phía trước. Nên mọi thứ nằm thẳng trên display list, còn khung hình do **camera**
lo (`world/camera.ts`).

Camera thế giới có zoom, mà `setZoom` của Phaser phóng **mọi** thứ camera đó vẽ — kể cả
object `scrollFactor(0)`. Nên UI đi một **camera riêng** không phóng: `StallCamera` xếp
object vào camera nào dựa đúng vào `scrollFactorX === 0`, chốt ở `PRE_RENDER` (lúc đó
mọi `setScrollFactor` và `container.add()` của frame đã chạy xong). Con của Container
thì không đụng tới — Phaser bỏ qua cả Container khi `willRender` trả false, nên con
thừa hưởng quyết định của cha.

Thêm một đạo cụ mới = thêm ký tự vào `MAP` (`world/map.ts`) + một nhánh trong
`textureForTile()` (`art/index.ts`) + một hàm vẽ trong `art/props.ts`.
Thêm một công đoạn mới = thêm **một dòng** vào `STATIONS` (`world/stations.ts`).

## Vài con số đã chốt

| | |
|---|---|
| Khung hình thiết kế | 1024 × 576 — mọi toạ độ trong code là toạ độ này |
| Độ phân giải render | canvas dựng ở `1024 × RENDER_SCALE` (trần 2×, theo màn hình), camera zoom bù lại — `core/render` |
| Siêu lấy mẫu ảnh | texture ảnh thật nướng dư `ART_SS` lần (`art/photo`), sprite thu lại bằng `fitPhoto` |
| Ô isometric | 60 × 30 (2:1) |
| Bản đồ | 20 × 12 ô = 960 × 480 px |
| Camera | zoom 1,4× · bám người chơi (deadzone 300 × 170, lerp 0,09), chặn trong hình bao cảnh — `world/camera` |
| Lớp UI | camera RIÊNG, zoom 1: `setZoom` của Phaser phóng cả object `scrollFactor(0)` |
| Một buổi bán | 06:00 → 11:00 giờ game, `TIME_SCALE_BASE = 30`; quầy trống ở MID/LULL thì tua 60/120 (P0-02 §2.1) — bot đo ~7,5 phút thật |
| Khung giờ | `PRE_OPEN` 6:00 · `PEAK` 6:30–8:00 (không bao giờ tua) · `MID` · `LULL` |
| fps | 30 (CANON §2) |
| Khách một buổi | ~12–16 người, dày hơn hẳn trong cao điểm 6h30–8h (CANON §13.3) |
| Một mùa | 40 ngày, có điểm kết (CANON T4) |
| Tốc độ đi | 3.4 ô/giây |

## Đã bám CANON ở những chỗ nào

- **T1** — camera **không bao giờ cắt đi chỗ khác**: cả buổi bán nằm trong đúng một góc
  phố, mép bản đồ chính là mép đường đi của camera, nên người chơi luôn thấy trọn một
  lỗi từ lúc gây ra tới lúc bị phát hiện (lý do thật của T1 — xem P3-05 §Camera). Camera
  **có** trượt theo người chơi bên trong góc phố đó, vì để cả 20 × 12 ô lọt một khung
  1024 × 576 thì một người chỉ cao chừng 40 px — không đọc ra ai đang cau mày. Khúc quầy
  ở trạm làm việc vẫn để **trống cố ý** để tay người chơi luôn nhìn thấy được.
- **T5** — "quá tay" ở lò là **thanh tiến trình có vạch nhìn thấy trước**, không phải roll xúc xắc.
- **§2 / §8e** — autosave NGAY khi sự kiện xảy ra (khách rời đi, bị bắt quả tang, chuyển cảnh,
  mất focus), double-buffer A/B + meta; seed cố định theo ngày + **6 stream RNG tách riêng**;
  nút chính thức **"Chơi lại ngày này"** khôi phục đúng bản chụp đầu ngày.
- **T2** — **khi có người đang chờ bánh, món ăn là câu trả lời duy nhất**: không một dòng chữ nào để bấm, chỉ có nguyên liệu. Lựa chọn bằng lời chỉ tồn tại ở **khoảng vắng** (quầy trống, người đã nhận bánh còn nán lại, người đi ngang) — trần 2 cuộc sâu/ngày, 0 cuộc trong giờ cao điểm. Xem `docs/phase-2-he-npc/P2-06-flow-tro-chuyen.md`.
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
- **§15** — pause mọi lúc, đóng băng đồng hồ + kiên nhẫn + certainty (một điểm `dt = 0` duy nhất);
  4 mức cỡ chữ; giảm chuyển động; chế độ không giới hạn thời gian (kiên nhẫn không tụt,
  đồng hồ chậm một nửa, lỗi vẫn là lỗi). Cả ba công tắc đều **có tác dụng thật**.
- **§16 Đừng-4** — không frame-by-frame: nhịp bước là squash/stretch + lerp.

## Hai thứ phải sống XUYÊN NGÀY

`Service` được tạo mới mỗi sáng, nên bất cứ thứ gì để trong nó là mất sau một ngày.
Hai thứ không được phép mất:

- **Đơn "ruột" của mỗi khách** — sinh từ `Rng.forSeason(saveId, npcId)`, bất biến cả 40 ngày.
  Sinh lại mỗi sáng thì *"cho cô như mọi bữa"* (CANON §3.2, salience 90 — khoảnh khắc
  chữa lành lõi của game) thành vô nghĩa.
- **State từng NPC + shuffle-bag thoại** — nằm trong `world.npcs` / `world.shuffleBags` của save,
  tích luỹ qua ngày. Khách chỉ được nói *"như mọi bữa"* khi người chơi đã NGHE đơn ruột ≥ 2 lần.

## Hai thang thời gian — đừng trộn

`core/clock.ts` là **giờ trong ngày**, bị nén lại (1 giây thật = 30 giây game).
`clock.advance()` trả `dt` **giây thật** — tầng nhận thấy, kiên nhẫn, delay bark đều chạy bằng nó, vì chuyện "khách có kịp
nhìn thấy không" diễn ra theo tay người chơi chứ không theo đồng hồ treo tường.
Trộn hai thang này là mọi kích thích tắt ngay trước khi ai kịp nhận ra — đã vấp một lần rồi.

## Chưa có (và cố ý chưa có)

Kinh tế (hạn dùng, giá chợ, nghĩa vụ — MarketScene mới là khung), arc nhân vật + cảnh nhỏ khi đoán
đúng 3 điều (P4), overrides lịch có báo trước 3–4 ngày (chú Tư dời chỗ, anh Dũng đổi ca — P4),
kênh cải chính qua nguồn (#2) của tin đồn, phụ đề tiếng Anh, đóng gói Electron.

**Về tên quán:** mùa mới mở bằng **màn mở đầu** (`scenes/IntroScene`): cô Ba — bà bán bánh mì
cũ của hẻm — nói chuyện với người chơi rồi hỏi tên. Tên đó thành **tên quán** trên bảng hiệu
ngoài vách và trên bảng menu bấm E ("BÁNH MÌ HOÀNG HUY"), và nằm trong `SaveFile.playerName`.
Bỏ trống được: bảng còn trơ hai chữ "BÁNH MÌ". Script + bốn luật viết thoại: `docs/phase-4-noi-dung/P4-06-man-mo-dau.md`.

**Về tên khách:** tên trên đầu khách và trên phiếu là tên **con tự ghi** trong sổ (chưa ghi thì `—`).
Tên nghe được qua lời khách, lời đồn, và lời cô Ba. Ghi sai tên rồi đưa bánh là **gọi sai tên** (WRONG_NAME).
Xem lộ trình phase ở `../docs/CANON.md` §17.
