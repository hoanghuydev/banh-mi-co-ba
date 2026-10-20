# Xưởng render nhân vật từ model 3D

> ## ⚡ REVAMP 2026-10-20 — ✅ CÒN SỐNG
> Căn cứ: [`CANON.md`](../CANON.md) bản revamp. Phần ☠️ không dùng làm căn cứ.
>
> | Mục | Trạng thái | Lý do / thay bằng |
> |---|---|---|
> | Nhắc "cô Ba" làm nhân vật chính; tên file model (`anh-bao`, `ba-bay`) | ⏳ | Cô Ba ☠️ → nhân vật chính Phương Anh (R0.5), cần model mới; tên NPC đổi R6. Đường ống render không đổi |
> | §"Vừa đi vừa bưng" — sáu món | ⏳ | Danh mục món theo topping mở dần (R2) |
>
> **Còn dùng được:** toàn bộ đường ống Blender → atlas Phaser, các bẫy đã gỡ — cho mọi model nhân vật mới (Phương Anh R0.5, NPC R6).

Thay cho việc chờ artist gửi bảng xoay: có model 3D **đã rig** là tự render ra
đủ tám hướng, và — điều bảng xoay dán tay không làm được — đủ cả animation.

## Hai bước

⚠️ Đây là lệnh ĐANG dùng để dựng ba bộ ảnh trong `public/art/`. Chạy lại cả ba khi
đụng vào `render-character.py` — ba người dùng chung một đường ống, nên bẫy nào cắn
cô Ba thì cắn luôn hai người khách.

```bash
# 1. render ra từng frame PNG
blender -b -P tools/render-character.py -- --glb art-raw/model/chef.glb --name player \
    --idle \
    --anim walk=art-raw/tripo-anim/tripo_walk.glb \
    --anim carry=art-raw/tripo-anim/tripo_walk.glb --carry carry --frames 8
blender -b -P tools/render-character.py -- --glb art-raw/model/anh-bao.glb --name anh-bao \
    --idle --anim walk=art-raw/tripo-anim/tripo_walk.glb --frames 8
blender -b -P tools/render-character.py -- --glb art-raw/model/ba-bay.glb --name ba-bay \
    --idle --anim walk=art-raw/tripo-anim/tripo_walk.glb --frames 8

# 2. gộp thành một atlas + JSON cho Phaser
python3 tools/pack-atlas.py player  --height 192
python3 tools/pack-atlas.py anh-bao --height 192
python3 tools/pack-atlas.py ba-bay  --height 192
```

Animation lấy của **Tripo**, không phải Mixamo — xem "Vì sao KHÔNG dùng Mixamo" bên dưới.
`--height 192`, không phải 384: xem bảng "Mấy chỗ đã phải dò".

Ra `public/art/player.png` + `public/art/player.json`, tên mỗi ô là
`<tư thế>_<hướng>_<frame>`, ví dụ `walk_se_03`.

## Lấy animation ở đâu — dùng ngay của Tripo

Trang Animate của Tripo có sẵn thư viện preset (walk, run, cheer, afraid, climb…),
bấm một cái là nó **tự retarget** vào đúng rig này rồi trả về một file
`tripo_retarget_*.glb` **chỉ chứa xương + animation**, không kèm mesh — đúng vai trò
"animation rời" mà ta cần, mỗi file chỉ 80–400 KB. Preset không tốn credit.

    https://studio.tripo3d.ai/workspace/animate/<ten-model>-<task-id>

Bắt URL bằng sniffer trong `tripo-download/tripo_sniffer.js`, lọc tên
`tripo_retarget_*.glb`, rồi đưa thẳng vào `--anim`.

> ⚠️ Chrome chặn tải nhiều file liên tiếp từ cùng một trang. File thứ hai trở đi
> im lặng không về. Hoặc bấm cho phép ở thanh địa chỉ, hoặc gộp tất cả thành MỘT
> file rồi tải một lần.

### Vì sao KHÔNG dùng Mixamo cho model này

Đã thử và **không dùng được**, dù rig mang đúng 65 xương tên `mixamorig:*`.
Trùng tên xương là chưa đủ — còn phải trùng **tư thế nghỉ**. Đo trong hệ thế giới:

| xương | Tripo | Mixamo | |
|---|---|---|---|
| LeftUpLeg | (0,06, 0, −1,00) | (0, −0,01, −1,00) | khớp |
| Spine | (0,12, 0, +0,99) | (0, 0,15, +0,99) | khớp |
| LeftArm | (−0,08, 0,36, **−0,93**) ↓ | (**+1,00**, 0, 0) → | **lệch** |

Tripo rig ở A-pose, Mixamo lấy T-pose làm gốc. Chân và cột sống khớp nên chân bước
đúng, chỉ tay là sai — animation ghi "xoay tay xuống 75° so với nghỉ", đưa vào rig mà
tay vốn đã xuôi thì nó xuôi thêm 75° nữa, tay chui vào người.

Hàm `align_rest_pose()` trong `render-character.py` bẻ rig về T-pose rồi chốt làm gốc
mới — phần xương chạy đúng, nhưng vẫn còn lệch 90° nữa vì giá trị xoay trong action của
Mixamo nằm ở hệ **armature** (nội bộ Y-up, bù bằng một phép xoay 90° ở cấp object),
trong khi hàm căn theo hệ **so với cha**. Muốn khớp hẳn thì phải dựng lại bộ xương Tripo
y hệt bộ xương Mixamo. Không bõ, vì Tripo đã có sẵn animation đúng cho chính rig này.

Hàm đó vẫn giữ trong file: nó tự thành phép rỗng khi nguồn và đích cùng một rig, và
còn dùng được nếu sau này gặp model khác thật sự cần.

## Mấy chỗ đã phải dò, đừng chỉnh bừa

| Tham số | Giá trị | Vì sao |
|---|---|---|
| `--yaw0` | 270 | Model Tripo quay mặt về +X; ô `s` phải là mặt nhìn thẳng vào người chơi (-Y) |
| `--exposure` | 1.0 | Dò bằng cách so màu trung bình vùng yếm với `p_s.png` của artist — lệch 13/765 |
| `--elev` | 30° | Máy ảnh trực giao ngẩng `el` thì nền bị nén `sin(el)`, **không** `tan(el)`: `sin(30°)` = 0,5 ra đúng thoi 2:1. `atan(0.5)` = 26,565° ra thoi 2,24:1, lệch hướng mặt 2,47° ở bốn ô chéo |
| `--height` (pack) | 192 | `PLAYER_H` 65 × `ART_SS` tối đa 3 = 195. Để 384 là phí đúng gấp đôi dung lượng |
| view transform | Standard | Blender 4 mặc định **AgX**, nó khử bão hoà rất mạnh, nhân vật ra một đống xám |

Đổi đèn hay đổi model thì phải **dò lại** `--exposure`, đừng bê nguyên số.

## Mấy cái bẫy đã gỡ

**Pivot còn đứng ở hướng cũ lúc căn tư thế nghỉ.** Bẫy nặng nhất tới giờ, và nó im re.
`main()` parent cả bộ vào một `pivot` rồi xoay pivot để lấy tám hướng; `align_rest_pose()`
lại chạy **giữa** vòng lặp tư thế, tức lúc pivot vẫn đứng ở góc của hướng render cuối cùng
thuộc tư thế trước — `yaw0 + 315°` = **225°**. Bản cũ lấy `matrix_world` nên nuốt luôn góc
đó: tư thế nghỉ bị chốt lệch **+135°** (= −225°), rồi `armature_apply()` nướng cái lệch ấy
thành vĩnh viễn. Đo được ở ô `s`: thân quay **+44,1°** trong khi phải là −90° (phía máy ảnh).

Hậu quả trong game: cô Ba **đi tới mà mặt quay ra sau**, và ổ bánh neo theo bàn tay nên
rơi ra **sau lưng**. Tư thế bưng còn sai thêm một tầng: `set_carry_pose()` nắn tay theo
"+X là phía trước", mà +X giờ không còn là phía trước của thân nữa, nên hai tay dang
ngang thay vì chụm trước bụng — đúng chỗ người chơi đọc ra là "ngược tay".

Vì sao khó thấy: xương lẫn da cùng quay nên người vẫn lành lặn, và **mọi phép đo trong hệ
armature vẫn báo đạt** (đo được hướng thân `−0,58°` ở cả bản hỏng lẫn bản sửa). Dấu vết
duy nhất là cùng một lần chạy mà `idle` **đúng** còn `walk`/`carry` **sai** — vì `idle`
render trước mọi animation, lúc chưa ai xoay pivot. Nhìn ảnh thì ô `s` ra sau gáy, mặt
trước trôi đúng **5 ô** sang `nw` (135° lệch ÷ 45° mỗi ô = 3, cộng tiếp cho tròn vòng).

Sửa: `align_rest_pose()` dùng `matrix_local` (so với **cha**) thay cho `matrix_world`.
Bỏ được pivot nhưng vẫn giữ phép xoay của chính object armature — đúng thứ cần giữ cho
rig Mixamo. Hai rig cùng gốc thì phép này tự thành phép rỗng, như trước.

Chặn tái phát: `check_facing()` đo trục hai vai ngay ở ô `s` của **mỗi** tư thế, trước khi
đốt công render bảy hướng còn lại, và `sys.exit` nếu lệch quá 10°. Đã thử lại bản hỏng —
`idle` qua (−0,0°), `walk` dừng ngay với `+134,1°`.

**Mesh rác trong file Tripo.** Bản xuất kèm một `Icosphere` 42 đỉnh bọc quanh
nhân vật — không material, không dính xương. Để lại thì hộp bao tính theo nó,
máy ảnh lùi xa tới mức nhân vật bé như con kiến. `drop_junk()` lọc theo *có dính
xương hay không*, chứ không theo tên.

**Root motion.** Animation của Tripo cho người đi tới THẬT — đo được xương Hips
trôi 1,026 đơn vị trong khi người chỉ cao 0,977, nên vài frame là đi khỏi khung.
`strip_root_motion()` trừ đi phần tuyến tính nối khoá đầu với khoá cuối, chứ không
xoá sạch đường cong: xoá sạch là mất luôn nhún và lắc hông, dáng đi thành trượt băng.
Trừ đường thẳng thì trục nào không trôi tự khắc không đổi, khỏi phải đoán trục nào.

**Khung chung.** `pack-atlas.py` lấy **hợp** hộp alpha của mọi frame mọi hướng
rồi cắt tất cả bằng đúng khung đó. Cắt sát mép từng ảnh riêng là nhân vật giật
tưng tưng khi đổi hướng hay sang frame: tay vung lên ở frame này thì mép alpha
cao hơn frame kia, mà game căn theo mép.

## Nhịp chân buộc vào QUÃNG ĐƯỜNG, không vào thời gian

`Player.STRIDE` = đi được bao nhiêu ô thì hết một chu kỳ chân (hai bước).

Bản đầu buộc nhịp vào `bob` — một đồng hồ chạy `11 rad/s` — nên ra **1,75 chu kỳ/giây
≈ 3,5 bước/giây**, trong khi người thật đi khoảng 2 bước/giây. Nhìn ra ngay: chân quậy
liên tục trong khi người trôi đi thong thả.

Buộc vào quãng đường thì bàn chân khớp mặt đất, và được thêm hai thứ miễn phí:

| | |
|---|---|
| Chạy | nhịp TỰ nhanh lên đúng `RUN_MUL` — nên KHÔNG cần bộ ảnh riêng cho lúc chạy, đỡ hẳn 1,3 MB |
| Ấn vào tường | `gait` cộng theo quãng ĐÃ ĐI THẬT sau va chạm, nên chân đứng im thay vì quậy tại chỗ |

Đo trong game, `SPEED` 2,6 và `STRIDE` 2,6:

| | ô/giây | chu kỳ/giây | bước/giây |
|---|---|---|---|
| đi | 2,60 | 1,00 | 2,0 |
| giữ Shift | 3,77 | 1,45 | 2,9 |

Muốn chân mau hơn thì **giảm** `STRIDE`.

## Chỉ nối tư thế CÓ TRẠNG THÁI THẬT kích hoạt

`art-raw/tripo-anim/` có 9 preset Tripo cho không, nhưng chỉ `walk` được nối. Tám cái còn
lại (`run`, `cheer`, `afraid`, `climb`, `basketball_shot`, `box_01/03`, `angry_02`) KHÔNG
nối: người bán bánh mì không leo trèo hay ném rổ, mà mỗi tư thế nối vào là thêm ~1,3 MB
atlas cho một thứ không bao giờ chạy. **Có file sẵn không phải là lý do để dùng.**

Riêng `run` đã nối rồi lại gỡ: giữ Shift giờ dùng chính bộ `walk` quay nhanh hơn. Vừa đỡ
1,3 MB, vừa hợp tông — game cozy mà đổi sang dáng chạy thì lạc giọng.

**Bưng đồ vẫn chạy chu kỳ chân.** Có lúc code loại tư thế bưng ra, lấy cớ "tay vung thì
món trôi lơ lửng". Cớ đó sai: `photo.ts` sơn `idle` và `carry` bằng CÙNG MỘT tấm ảnh, nên
món vốn đã nằm ở một cái neo cố định (`holdAnchor`) chứ không nằm trong tay. Loại ra chỉ
tổ mất animation ở đúng trạng thái hay gặp nhất: bưng ổ bánh đi từ lò ra chỗ khách.

## Vừa đi vừa bưng: MỘT bộ ảnh cho CẢ SÁU món

Câu hỏi hay gặp: muốn cô Ba cầm ổ bánh cho thật thì có phải vẽ cô cầm từng món không?
**Không** — và cũng đừng, vì có 6 thứ cầm được (`loaf_cold/baked/hot/burnt/filled`, `tea`),
nướng món vào frame nhân vật là nhân chéo ~7,8 MB.

Món vẫn là **sprite riêng**. Thứ thật sự thiếu không phải ảnh-cầm-món mà là **một chu kỳ đi
với hai tay giữ yên trước bụng**: chu kỳ `walk` là đi TAY KHÔNG, hai tay vung hết biên, neo
ổ bánh vào bàn tay đang vung thì ổ bánh vung theo — sai hơn cả để nó trôi.

`--carry <tư thế>` dựng chu kỳ đó ngay trong Blender, không cần preset mới:

```bash
blender -b -P tools/render-character.py -- --glb art-raw/model/chef.glb --name player \
    --anim walk=art-raw/tripo-anim/tripo_walk.glb \
    --anim carry=art-raw/tripo-anim/tripo_walk.glb --carry carry --frames 8
```

`freeze_arm_chain()` **xoá** đường cong của nhánh tay khỏi action rồi `set_carry_pose()` bẻ
tay một lần. Xoá chứ không ghi đè từng frame: hết đường cong thì `frame_set` không đụng tới
mấy xương đó nữa, khỏi phải canh thứ tự với depsgraph.

Tư thế đặt bằng **hướng trong hệ thế giới**, không bằng góc Euler — góc Euler phụ thuộc trục
cục bộ từng xương, đổi rig là sai hết, còn "cẳng tay chỉ ra trước" thì rig nào cũng đúng.

### Ba cái bẫy khi nắn tay trong Blender

Cả ba đều **không làm render báo lỗi** — ảnh vẫn ra đủ, log vẫn sạch, chỉ có tay sai.

**1. Gỡ đường cong KHÔNG xoá giá trị đang nằm trên xương.** `freeze_arm_chain` chỉ khiến
action thôi ghi đè; phần xoay của frame cuối chu kỳ `walk` vẫn còn nguyên trên pose bone.
Đo được LeftArm **44,12°** · RightArm **27,35°** · hai vai ~20°, và trái phải sót KHÁC nhau.
Nắn hướng xong thì vị trí xương vẫn đúng và vẫn đối xứng — nên **mọi phép đo theo vị trí đều
báo đạt** — nhưng phần xoắn quanh trục xương còn nguyên và nó vặn tay áo. `reset_arm_chain()`
trả cả nhánh về tư thế nghỉ trước khi nắn.

**2. Nắn một lần trước vòng lặp là không đủ.** `aim_bone` nắn theo hướng, nhưng Blender cất
kết quả thành transform CỤC BỘ so với xương cha. Xương tay treo dưới cột sống, mà cột sống
vẫn được animate — mỗi `frame_set` xoay thân là tay lệch khỏi hướng đã nắn. Phải gọi
`set_carry_pose()` **lại sau mỗi `frame_set`**.

**3. Hệ THẾ GIỚI ≠ hệ ARMATURE.** `main()` parent cả bộ vào một `pivot` rồi xoay pivot để lấy
tám hướng, nên `arm.matrix_world` mang theo góc xoay đó. Bản đầu đo hướng ở hệ thế giới rồi
áp phép xoay lên `pb.matrix` ở hệ armature — trộn hai hệ, và **sai khác nhau theo từng hướng
render**: cẳng tay trái ra `(-0,309, -0,930, +0,200)` ở hướng `s` nhưng `(+0,962, -0,207, +0,180)`
ở hướng `n`. Tư thế bưng là tư thế so với THÂN NGƯỜI nên phải tính trọn trong hệ armature.

Sau cả ba: đo 8 hướng × 8 frame × 2 tay = 128 lần, lệch hướng **0,00000**, góc khuỷu **95,1°
ở mọi tư thế**.

### Đo đối xứng: đừng dùng phép so theo TRỤC

Phép "soi gương rồi so từng trục" đã làm mình kết luận sai **hai lần** — một lần tưởng rig sai
(hoá ra công thức kỳ vọng ngược dấu), một lần đo trong hệ `Spine2` (trục dọc theo xương, không
phải trước/trái/lên của cơ thể). Dùng **đại lượng bất biến** thì không có quy ước nào để sai:
khoảng cách tay–ngực và tầm với tay–vai của hai bên.

Và so với **mốc nền của chính bộ rig**, đừng so với ngưỡng bịa ra: rig Tripo vốn đã lệch
**0,00548** ở tư thế nghỉ (vai trái y=+0,090, vai phải y=−0,093). Tư thế bưng ra 0,01389, tức
phần thêm vào là ~0,56 px thiết kế — dưới ngưỡng mắt thấy, và là hệ quả tất yếu của việc giữ
tay cố định trong khi thân xoay.

### Neo bàn tay xuất thẳng từ xương

`hand_anchor()` chiếu điểm giữa hai bàn tay qua máy ảnh, ghi **pixel ảnh**; `pack-atlas.py`
quy sang tỉ lệ ô bằng đúng phép cắt + co đã áp cho ảnh, ra `public/art/player_hold.json`.

> ⚠️ Bản đầu xuất theo tỉ lệ chiều cao MODEL — sai, vì game đo theo Ô ATLAS mà ô atlas là
> khung chung (hợp của mọi frame mọi hướng) nên luôn cao hơn nhân vật. Hai thước lệch nhau
> thì ổ bánh dán hụt.

Kiểm chứng số:

| | |
|---|---|
| Tay xê dịch qua 8 frame | ~1 px thiết kế (thân vẫn xoay theo bước, nên không phải 0) |
| Bước neo lớn nhất giữa 2 frame | **1,07 px** (1,6% chiều cao), vòng 7→0 cũng ~1 px nên khép kín |
| Đối xứng trái/phải | `e + w = 0,0000` — khớp tuyệt đối |
| So bảng `HOLD_ANCHOR` artist chỉnh tay | hướng `s`: suy ra x −1,1 y 23,0 · chỉnh tay x 0 y 23 |

Hai cách hoàn toàn độc lập mà ra cùng số là dấu hiệu cả hai đều đúng. Bảng suy ra còn bắt
được thứ bảng tay bỏ sót: **`y` đổi theo hướng** (27,5 lúc quay mặt lại, 32,3 lúc quay lưng) —
đúng phép chiếu iso, bảng cũ để phẳng 22.

**Đứng yên mà đang bưng thì ghim ở frame 0 của chính chu kỳ bưng**, không rơi về ảnh tĩnh:
rơi về ảnh tĩnh là tay đổi từ "bưng" sang "buông thõng", neo nhảy 28 → 23 px và ổ bánh giật
một cái mỗi lần thả phím. Mà đứng yên trong lúc cầm ổ bánh thì đằng nào cũng đang bưng.

## Bóng đổ phải ăn theo BÀN CHÂN trong ảnh

Hai thứ làm cái bóng cũ trông giả, cả hai đều ở `art/fx.ts` + `entities/Player.ts`:

**Mép cắt ngọt.** Bản cũ là một ê-líp ĐẶC alpha đều 0,26 (`fillEllipse`). Bóng thật không
có đường biên — nó đậm nhất ngay chỗ chạm đất rồi nhoè dần, và chính vùng nhoè đó mới làm
người ta tin vật đứng TRÊN sàn. Nay vẽ bằng canvas, hai lớp gradient: một vầng nhoè +
một lõi tiếp đất. Đo lại: tâm alpha **0,486**, bề ngang nhìn thấy **31 px** (sải chân 24).

Độ đậm chỉnh ở MỘT chỗ duy nhất: `SHADOW.alpha` trong `art/palette.ts` — `art/fx.ts` là file
duy nhất đọc nó, và mọi mốc gradient đều nhân với nó, nên một số đó kéo theo cả bóng người chơi,
bóng khách lẫn bóng đạo cụ. Đã nâng 0,26 → 0,38 (tâm 0,35 → 0,49): ở 0,26 cái bóng mềm quá, trên
nền gạch men trắng của quán gần như không đọc ra — đúng cái vùng nhoè làm nó trông thật lại là
thứ làm nó biến mất.

**Bóng đứng im trong khi người nhún.** Lúc nối animation, `hop` bị tắt khi chạy chu kỳ đi
(nhún đã nằm sẵn trong frame render) — nên bóng đóng đinh một chỗ, và đó là thứ tố cáo nó
là miếng dán. Nay `photo.ts` ĐO độ nhấc chân của từng frame (`footLift`, quét alpha từ đáy
lên) và `Player` cho bóng co + nhạt theo số đo đó.

Đo từ ảnh chứ không dựng lại bằng sine, vì dãy đáy chân tám frame là
359·364·361·361·359·366·363·369 — không phải hình sin sạch, mọi công thức đoán đều lệch.

| Hệ số | Giá trị | |
|---|---|---|
| co theo độ nhấc | `0,03` /px | đỉnh bước co ~7% |
| nhạt theo độ nhấc | `0,05` /px | đỉnh bước nhạt ~11% |

Hai số này phải NHỎ: nhấc cao nhất chỉ ~2,2 px trên thân 65 px (3,3%). Bản thử để
0,075/0,12 ra bóng co 16% và nhạt 26% — nhìn thành nảy tưng tưng chứ không phải bước đi.

## Bóng đạo cụ: theo TÁN CHE, không theo chỗ chạm đất

`PROP_SHADOW` trong `art/fx.ts` — có tên trong bảng mới có bóng, nên tường, cửa, nhà bên và
mặt quầy tự khắc đứng ngoài (chúng ra key `BUILD.*` / `COUNTER.*`, không phải `PROP.*`).

Bề ngang lấy theo **vật che nắng**, không theo diện tích tiếp đất. Hai cột này lệch nhau rất xa:

| vật | bề ngang vẽ | bề ngang đáy | chọn |
|---|---|---|---|
| dù | 109,5 | 24,0 | **76** |
| ghế đẩu | 28,9 | 2,1 | **22** |
| bàn | 75,5 | 40,1 | **56** |
| bảng gỗ | 41,5 | 3,8 | **26** |

Lấy cột phải thì cái dù ra một chấm bé tí dưới cây cột trong khi thứ che nắng là cái tán rộng
gấp bốn, còn cái ghế đẩu gần như không có bóng dù mặt ghế vẫn chắn sáng.

Con số 76 của cái dù không phải bịa: bản vẽ-code dự phòng trong `StallScene` xưa nay vẫn vẽ
`fillEllipse(x, y + 2, 76, 26)` dưới chân dù — giữ đúng nó để hai bản không lệch nhau.

**Hệ số `a` cho vật không nằm trên sàn.** Càng cao khỏi mặt đất thì sáng càng vòng ra sau,
bóng càng tán và nhạt:

| | `a` | |
|---|---|---|
| dù | 0,45 | tán ở tầm hai mét |
| bồn rửa | 0,6 | **gắn tường**, chỉ ống thoát mảnh chạm sàn |
| xe máy, Vespa | 0,8 | thân xe gác trên hai bánh |
| bàn | 0,75 | mặt bàn tầm đùi |
| còn lại | 1 | đặt thẳng trên sàn |

Bóng đạo cụ dùng CHUNG texture với bóng người chơi, chỉ phóng theo `SHADOW_CORE` — nên chỉnh
lại gradient một lần là cả người lẫn đồ đạc đổi theo, không có chuyện bóng người mềm mà bóng
cái bàn vẫn là miếng ê-líp cũ.

## Atlas giúp gì, và KHÔNG giúp gì

Gộp atlas là cái lợi **lúc tải**: 64 lượt tải còn 1. Nó **không** làm game vẽ
nhanh hơn — `photo.ts` không vẽ thẳng từ ảnh nguồn mà sơn lại vào canvas tự sinh
(`standing()` → `textures.createCanvas`) rồi mới vẽ từ đó, nên gộp hay rời thì
lúc chạy cũng như nhau.

Với tám ảnh tĩnh thì để rời cũng chẳng sao. Có animation mới đáng gộp: 8 hướng ×
8 frame = 64 ảnh mỗi tư thế.
