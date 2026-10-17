#!/usr/bin/env python3
"""
Model 3D có rig  ->  art-raw/render/<nhân vật>/<tư thế>/<hướng>_<frame>.png

Xưởng render BẢNG XOAY, thay cho việc chờ artist gửi ảnh:

    blender -b -P tools/render-character.py -- --glb <file.glb> --name player
    blender -b -P tools/render-character.py -- --glb x.glb --name player \
            --anim walk=tripo-anim/tripo_walk.glb --frames 8

Chạy bằng Blender, KHÔNG phải python thường: `blender -b -P <file> -- <tham số>`.

── Vì sao render chứ không cắt bảng ──────────────────────────────────────────
`cut-character.py` phải dò tám ô rồi căn chân, vì artist gửi một tấm dán sẵn và
mỗi ô cao thấp một kiểu. Render thì KHÔNG có bài toán đó: máy ảnh đứng yên, chỉ
nhân vật xoay, nên tám hướng đã chồng khít nhau sẵn — chân luôn ở đúng một chỗ.
Thêm animation vào cũng không đổi gì: mọi frame dùng chung đúng một khung hình.

── Bốn việc file này làm ─────────────────────────────────────────────────────
  1. nạp model có rig        giữ nguyên skin + 65 xương mixamorig
  2. gán animation rời       nguồn nên là file retarget của chính Tripo — xem
                             `docs/phu-luc/xuong-render-nhan-vat.md`: trùng TÊN xương
                             là chưa đủ, phải trùng cả TƯ THẾ NGHỈ, nên animation
                             Mixamo KHÔNG dùng thẳng cho rig này được
  3. xoay NHÂN VẬT 8 hướng   máy ảnh đứng yên -> khung chung, miễn phí
  4. render nền trong suốt   mỗi frame một PNG, `pack-atlas.py` gộp lại sau

Góc máy ảnh phải khớp phép chiếu của game: ô sàn là hình thoi 2:1, nên góc ngẩng
đúng là 30° — xem `ISO_ELEV`. Đổi `--elev` nếu muốn so sánh bằng mắt.
"""
import argparse
import json
import math
import os
import sys

import bpy
from mathutils import Vector

DIRS = ["s", "se", "e", "ne", "n", "nw", "w", "sw"]  # đúng thứ tự DIRS8 của photo.ts
#: Góc ngẩng của máy ảnh, độ.
#:
#: ⚠️ 30°, KHÔNG phải `atan(0.5)` = 26,565°. Bản đầu để atan(0.5) vì tưởng góc máy ảnh
#: bằng độ dốc của cạnh hình thoi 2:1 — sai, hai thứ đó khác nhau. Máy ảnh TRỰC GIAO
#: ngẩng một góc `el` thì mặt đất bị nén đúng `sin(el)`, chứ không phải `tan(el)`:
#:
#:     sin(30°)      = 0,500  -> ô sàn ra đúng hình thoi 2:1  ✓
#:     sin(26,565°)  = 0,447  -> ô sàn ra thoi 2,24:1          ✗
#:
#: Hậu quả ĐO ĐƯỢC: hướng mặt trong ảnh lệch khỏi hướng ĐI thật của game.
#: Chiếu vectơ "người đang nhìn về đâu" qua chính máy ảnh này rồi so với `toScreen`:
#:
#:     ô        game đi      sprite nhìn    lệch
#:     se        26,57°        24,09°      −2,47°     (ở 26,565°)
#:     se        26,57°        26,57°       0,00°     (ở 30°)
#:
#: Bốn hướng thẳng luôn khớp dù để góc nào — nên chỉ nhìn `s`/`e` thì không phát hiện ra.
#: Ở 30° cả tám hướng khớp tuyệt đối.
#:
#: Mốc đối chiếu độc lập: `art/photo.ts` ghi bộ ảnh đạo cụ của artist chụp ở "góc ngẩng 30°
#: (mặt trên rộng gấp đôi bề cao)" — cùng một con số, tìm ra bằng hai đường khác nhau.
ISO_ELEV = 30.0

# Hướng hai đoạn tay lúc bưng đồ, trong hệ thế giới của model (trước +X, lên +Z).
# Giá trị cho bên TRÁI; bên phải lật dấu thành phần Y. Xem `set_carry_pose`.
CARRY_ARM = (0.30, 0.0, -0.95)     # vai -> khuỷu: buông xuống, hơi chếch ra trước
CARRY_FORE = (0.93, -0.30, 0.20)   # khuỷu -> bàn tay: đưa ra trước và chụm vào giữa

# Hướng hai đoạn tay lúc ĐỨNG YÊN — tay buông thõng, hơi dang (dáng A).
#
# ⚠️ Phải nắn, không được lấy nguyên tư thế nghỉ của rig. Tripo rig mỗi model một kiểu:
# `chef.glb` nghỉ ở dáng A (tay xuôi) nên render thẳng ra là đẹp, nhưng `anh-bao.glb` và
# `ba-bay.glb` nghỉ ở T-POSE — đo được `LeftArm` chỉ (0,00, +1,00, −0,07), tức dang ngang
# hẳn. Render tư thế nghỉ của hai người đó ra tám tấm đứng dang tay như bù nhìn.
#
# Số lấy từ chính dáng nghỉ của `chef.glb` (đo trong hệ armature): `LeftArm`
# (−0,081, +0,363, −0,928) · `LeftForeArm` (+0,116, +0,269, −0,956). Nhờ vậy cô Ba đứng
# y như cũ, còn hai rig T-pose thì được kéo về cùng một dáng.
IDLE_ARM = (-0.08, 0.36, -0.93)    # vai -> khuỷu: xuôi xuống, hơi dang ra
IDLE_FORE = (0.12, 0.27, -0.96)    # khuỷu -> bàn tay: tiếp tục xuôi, hơi ra trước


def argv_after_ddash():
    return sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


def wipe_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_model(path):
    before = set(bpy.data.objects)
    ext = os.path.splitext(path)[1].lower()
    if ext in (".glb", ".gltf"):
        bpy.ops.import_scene.gltf(filepath=path)
    elif ext == ".fbx":
        bpy.ops.import_scene.fbx(filepath=path)
    else:
        sys.exit(f"khong ho tro duoi {ext}")
    return [o for o in bpy.data.objects if o not in before]


def find_armature(objs):
    for o in objs:
        if o.type == "ARMATURE":
            return o
    return None


def drop_junk(objs):
    """Vứt mesh rác mà Tripo kèm trong file.

    Bản xuất của Tripo có một `Icosphere` 42 đỉnh bọc quanh nhân vật — không
    material, không dính xương, nhiều khả năng là quả cầu môi trường. Để lại thì
    HỘP BAO tính theo nó chứ không theo người, và máy ảnh lùi ra xa tới mức nhân
    vật chỉ còn bằng con kiến giữa khung.

    Mốc nhận dạng là DÍNH XƯƠNG hay không, chứ không phải tên: tên do người xuất
    file đặt, còn mesh thật của nhân vật thì chắc chắn phải có modifier Armature.
    """
    skinned = [o for o in objs if o.type == "MESH"
               and any(m.type == "ARMATURE" for m in o.modifiers)]
    if not skinned:
        return objs  # model không rig: không có mốc nào để lọc, giữ nguyên tất
    junk = [o for o in objs if o.type == "MESH" and o not in skinned]
    for o in junk:
        print(f"  - bo mesh roi khong dinh xuong: {o.name} ({len(o.data.vertices)} dinh)")
        bpy.data.objects.remove(o, do_unlink=True)
    return [o for o in objs if o not in junk]


def hips_height(arm):
    """Chiều cao xương hông lúc nghỉ, tính trong hệ toạ độ của chính armature.

    Dùng làm THƯỚC ĐO tầm vóc bộ xương. Lấy trong hệ của armature chứ không phải
    hệ thế giới là cố ý: giá trị location trong action cũng nằm ở hệ đó.
    """
    for n in ("mixamorig:Hips", "Hips", "mixamorig:Spine"):
        b = arm.data.bones.get(n)
        if b:
            return b.head_local.length or 1.0
    return max(arm.dimensions) or 1.0


def rescale_locations(act, src_arm, dst_arm):
    """Co giãn mọi khoá `location` cho khớp tầm vóc bộ xương đích.

    ⚠️ Đây là cái bẫy lớn nhất của cả đường ống. Mixamo xuất FBX theo đơn vị
    XENTIMET: armature để scale 0.01, xương hông nằm ở cao độ ~104. Rig của Tripo
    thì theo MET, hông ở ~0,45. Tên xương hai bên trùng nhau nên Blender gán
    action ngon lành, không báo lỗi gì — nhưng khoá location vốn là "nhún 2,5 xentimet"
    bị đọc thành "dịch 2,5 MET", và nhân vật văng ra khỏi khung.

    Hỏng kiểu im lặng: render chạy trơn tru, log sạch, ra 192 tấm ảnh RỖNG.

    Chỉ co giãn `location`, KHÔNG đụng tới `rotation`: góc xoay không có đơn vị,
    tỉ lệ nào cũng đúng — mà xoay mới là phần chính của animation.
    """
    ratio = hips_height(dst_arm) / hips_height(src_arm)
    n = 0
    for fc in act.fcurves:
        if not fc.data_path.endswith(".location"):
            continue
        n += 1
        for k in fc.keyframe_points:
            k.co[1] *= ratio
            k.handle_left[1] *= ratio
            k.handle_right[1] *= ratio
    return ratio, n


def strip_root_motion(act):
    """Ghim nhân vật tại chỗ: bỏ phần TRÔI của xương gốc, giữ nguyên phần nhún.

    Animation dựng sẵn của Tripo có root motion thật — bước đi là người tiến tới
    thật. Máy ảnh ở đây đứng yên, nên để nguyên thì nhân vật đi thẳng ra khỏi khung:
    đo được xương Hips trôi 1,026 đơn vị trong khi người chỉ cao 0,977.

    Cách bỏ: trừ đi phần TUYẾN TÍNH nối khoá đầu với khoá cuối, không phải xoá sạch
    đường cong. Xoá sạch là mất luôn cái nhún lên xuống và lắc ngang của hông, dáng
    đi thành trượt băng. Trừ đường thẳng thì chỉ net trôi biến mất, dao động còn nguyên —
    và trục nào không trôi (đầu ≈ cuối) thì phép trừ này tự khắc không đổi gì, nên
    không cần đoán trục nào là trục tiến.
    """
    roots = ("mixamorig:Hips", "Hips", "mixamorig:Root", "Root")
    fixed = 0
    for fc in act.fcurves:
        if not fc.data_path.endswith(".location"):
            continue
        if not any(f'"{r}"' in fc.data_path for r in roots):
            continue
        ks = fc.keyframe_points
        if len(ks) < 2:
            continue
        t0, v0 = ks[0].co
        t1, v1 = ks[-1].co
        if abs(v1 - v0) < 1e-6 or t1 == t0:
            continue
        for k in ks:
            k.co[1] -= v0 + (v1 - v0) * (k.co[0] - t0) / (t1 - t0)
            k.handle_left[1] = k.co[1]
            k.handle_right[1] = k.co[1]
        fixed += 1
    return fixed


# ───────────────────────────────────────────────────── tư thế vừa đi vừa bưng

ARM_CHAIN = ("Shoulder", "Arm", "ForeArm", "Hand")



def freeze_arm_chain(act):
    """Xoá mọi đường cong của nhánh tay khỏi action.

    Xoá chứ không ghi đè từng frame: hết đường cong thì `frame_set` không còn đụng tới
    mấy xương đó nữa, nên tư thế đặt một lần là giữ nguyên suốt cả chu kỳ. Ghi đè sau
    mỗi `frame_set` thì phải canh đúng thứ tự với depsgraph, hỏng lúc nào không biết.
    """
    n = 0
    for fc in list(act.fcurves):
        if any(f'"mixamorig:{side}{part}' in fc.data_path
               for side in ("Left", "Right") for part in ARM_CHAIN):
            act.fcurves.remove(fc)
            n += 1
    return n


def reset_arm_chain(arm):
    """Trả cả nhánh tay về ĐÚNG tư thế nghỉ.

    ⚠️ Bắt buộc, và đây là chỗ đã cắn một lần. Gỡ đường cong khỏi action KHÔNG xoá giá trị
    đang nằm trên pose bone — nó chỉ thôi không ghi đè nữa. Nên khi render `walk` trước rồi
    `carry` sau, hai cánh tay bước vào tư thế bưng với phần xoay còn sót của frame cuối
    chu kỳ đi: đo được LeftArm 44,12° · RightArm 27,35° · hai vai ~20°, và trái phải sót
    KHÁC NHAU.

    Nắn hướng xong thì VỊ TRÍ xương vẫn đúng và vẫn đối xứng — nên mọi phép đo theo vị trí
    đều báo "đạt" — nhưng phần XOẮN quanh trục xương còn nguyên, và nó vặn tay áo. Hai vai
    thì không hề được nắn nên giữ trọn 20° rác.

    Reset xong thì tư thế bưng không còn phụ thuộc thứ gì chạy trước nó.
    """
    for side in ("Left", "Right"):
        for part in ARM_CHAIN:
            for pb in [b for b in arm.pose.bones
                       if b.name.startswith(f"mixamorig:{side}{part}")]:
                pb.rotation_mode = "QUATERNION"
                pb.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
                pb.location = (0.0, 0.0, 0.0)
                pb.scale = (1.0, 1.0, 1.0)
    bpy.context.view_layer.update()


def aim_bone(arm, name, wdir):
    """Xoay một xương sao cho nó chỉ theo hướng `wdir`, TRONG HỆ CỦA ARMATURE.

    ⚠️ Hệ armature, KHÔNG phải hệ thế giới — và đây là chỗ đã cắn một lần nữa. `main()`
    parent cả bộ vào một `pivot` rồi xoay pivot để lấy tám hướng, nên `arm.matrix_world`
    mang theo cả góc xoay đó. Bản cũ đo hướng hiện tại ở hệ THẾ GIỚI (có pivot) rồi áp
    phép xoay ấy lên `pb.matrix` ở hệ ARMATURE (không pivot) — trộn hai hệ, và sai khác
    nhau theo từng hướng render: đo được cẳng tay trái ra (-0,309, -0,930, +0,200) ở hướng
    `s` nhưng (+0,962, -0,207, +0,180) ở hướng `n`, trong khi mục tiêu là (+0,93, -0,30, +0,20).

    Tư thế bưng vốn là tư thế SO VỚI THÂN NGƯỜI, nên nó phải độc lập với việc đang render
    hướng nào. Tính trọn trong hệ armature thì tự khắc đúng như vậy.
    """
    from mathutils import Matrix
    pb = arm.pose.bones.get(name)
    if not pb:
        return
    cur = pb.tail - pb.head                      # hệ armature, không nhân `matrix_world`
    if cur.length < 1e-9:
        return
    rot = cur.normalized().rotation_difference(Vector(wdir).normalized())
    m = pb.matrix.copy()
    pb.matrix = Matrix.Translation(m.to_translation()) @ (rot.to_matrix() @ m.to_3x3()).to_4x4()
    bpy.context.view_layer.update()


def set_carry_pose(arm):
    """Bẻ hai tay về tư thế bưng đồ trước bụng. GỌI LẠI SAU MỖI `frame_set`.

    ⚠️ Phải gọi mỗi frame, không đặt một lần rồi thôi. `aim_bone` nắn theo hệ THẾ GIỚI,
    nhưng Blender cất kết quả thành transform CỤC BỘ so với xương cha. Xương tay treo dưới
    cột sống, mà cột sống vẫn được animate — nên mỗi lần `frame_set` xoay thân là cánh tay
    bị kéo lệch khỏi hướng đã nắn.

    Đặt một lần trước vòng lặp thì chỉ đúng ở đúng frame đó: đo được cẳng tay ra
    (-0,667, -0,647, -0,370) và (-0,636, +0,107, -0,764) thay vì (+0,93, ∓0,30, +0,20),
    lệch cả hướng lẫn đối xứng, và hai tay dang ngang ra như tượng.

    ⚠️ Vì sao cần hẳn một bộ ảnh riêng cho lúc bưng, thay vì neo ổ bánh vào bàn tay của
    chu kỳ đi thường: chu kỳ đi thường là ĐI TAY KHÔNG, hai tay vung hết biên. Neo ổ bánh
    vào bàn tay đó thì ổ bánh vung tới vung lui theo — nhìn còn sai hơn là để nó trôi,
    vì không ai bưng ổ bánh mà đánh tay như đi diễu hành.

    Hướng đặt theo HỆ THẾ GIỚI của model: trước = +X, phải = −Y, lên = +Z (đo từ xương hông).
    Đặt bằng hướng chứ không bằng góc Euler: góc Euler phụ thuộc trục cục bộ của từng xương,
    đổi rig một cái là sai hết, còn "cẳng tay chỉ ra trước" thì rig nào cũng đúng.

    Số đo thu được (tương đối với hông, người cao 0,977 rộng 0,358):
        tay trái (+0,120, +0,064, +0,115) · tay phải (+0,119, −0,064, +0,119)
        hai tay cách nhau 0,128 · dao động qua 8 frame: dx 0,014 · dy 0,017 · dz 0,005
    Tức bàn tay đứng yên trong khoảng ~1 px thiết kế; phần nhúc nhích còn lại là thân
    vẫn xoay theo bước đi, và đó là thứ nên giữ.
    """
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="POSE")
    for side, sy in (("Left", +1), ("Right", -1)):
        aim_bone(arm, f"mixamorig:{side}Arm",
                 (CARRY_ARM[0], CARRY_ARM[1] * sy, CARRY_ARM[2]))
        aim_bone(arm, f"mixamorig:{side}ForeArm",
                 (CARRY_FORE[0], CARRY_FORE[1] * sy, CARRY_FORE[2]))
    bpy.ops.object.mode_set(mode="OBJECT")


def set_idle_pose(arm):
    """Bẻ hai tay về dáng ĐỨNG YÊN — buông thõng, hơi dang. Gọi MỘT lần là đủ.

    Khác `set_carry_pose` ở chỗ không phải gọi lại mỗi frame: tư thế nghỉ không có
    action nào chạy, nên không có gì ghi đè lên xương sau khi nắn.

    Chân thì KHÔNG đụng: cả ba rig đo được đều có `LeftUpLeg` chỉ gần đúng (0, 0, −1)
    lúc nghỉ, tức chân vốn đã duỗi thẳng xuống. Chỉ có tay là mỗi rig một kiểu.
    """
    reset_arm_chain(arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="POSE")
    for side, sy in (("Left", +1), ("Right", -1)):
        aim_bone(arm, f"mixamorig:{side}Arm",
                 (IDLE_ARM[0], IDLE_ARM[1] * sy, IDLE_ARM[2]))
        aim_bone(arm, f"mixamorig:{side}ForeArm",
                 (IDLE_FORE[0], IDLE_FORE[1] * sy, IDLE_FORE[2]))
    bpy.ops.object.mode_set(mode="OBJECT")


def hand_anchor(arm, cam):
    """Chỗ hai bàn tay gặp nhau, tính bằng PIXEL trên chính tấm ảnh vừa render.

    Xuất thẳng từ XƯƠNG chứ không dò trên ảnh: game cần biết dán ổ bánh vào đâu, mà xương
    biết chính xác còn dò pixel thì chỉ đoán được — cùng lý do `strip_root_motion` trừ
    đường thẳng thay vì đoán trục tiến.

    ⚠️ Trả PIXEL ẢNH, không trả tỉ lệ chiều cao người. Bản đầu mình trả tỉ lệ so với chiều
    cao MODEL — sai, vì game đo theo Ô ATLAS, mà ô atlas là KHUNG CHUNG (hợp của mọi frame
    mọi hướng) nên luôn cao hơn nhân vật. Hai thước đo lệch nhau, ổ bánh sẽ dán hụt.

    Trả pixel ảnh thì `pack-atlas.py` quy đổi tiếp bằng ĐÚNG con số nó dùng để cắt và co ô —
    không có chỗ nào phải đoán lại tỉ lệ.
    """
    from bpy_extras.object_utils import world_to_camera_view
    sc = bpy.context.scene
    m_world = arm.matrix_world
    pb = arm.pose.bones
    mid = ((m_world @ pb["mixamorig:LeftHand"].head)
           + (m_world @ pb["mixamorig:RightHand"].head)) / 2
    v = world_to_camera_view(sc, cam, mid)
    # `world_to_camera_view` trả 0..1, gốc ở GÓC DƯỚI-TRÁI; ảnh thì đánh số hàng từ TRÊN
    # xuống, nên y phải lật.
    return (v.x * sc.render.resolution_x, (1.0 - v.y) * sc.render.resolution_y)


def align_rest_pose(dst_arm, src_arm, meshes):
    """Bẻ rig đích về ĐÚNG tư thế nghỉ của rig Mixamo, rồi chốt làm tư thế nghỉ mới.

    ⚠️ Trùng tên xương là CHƯA ĐỦ để gán animation. Còn phải trùng TƯ THẾ NGHỈ.
    Đo thực tế hai rig trong hệ toạ độ thế giới:

        xương          Tripo                Mixamo
        LeftUpLeg      (0,06, 0, -1,00)     (0, -0,01, -1,00)   khớp
        Spine          (0,12, 0, +0,99)     (0, 0,15, +0,99)    khớp
        LeftArm        (-0,08, 0,36, -0,93) (+1,00, 0, 0)       LỆCH

    Tripo rig ở A-pose (tay xuôi), Mixamo lấy T-pose (tay dang ngang) làm gốc.
    Chân và cột sống khớp nên chân bước đúng — chỉ tay là sai, và sai rất rõ:
    animation ghi "xoay tay xuống 75° so với nghỉ", đưa vào rig mà tay VỐN ĐÃ
    xuôi thì nó xuôi thêm 75° nữa, tay chui vào người.

    Vì sao không bù bằng cách cộng trừ góc trên animation: chênh lệch tư thế nghỉ
    không phải một phép xoay cộng thêm được. Phải đưa hai rig về chung một gốc
    rồi mới so, nên ở đây bẻ rig đích về T-pose và CHỐT tư thế đó làm gốc mới.

    Mesh phải nướng biến dạng vào trước khi chốt, nếu không người vẫn đứng A-pose
    trong khi xương đã sang T-pose, và da lệch khỏi xương vĩnh viễn.
    """
    from mathutils import Matrix

    bpy.context.view_layer.objects.active = dst_arm
    bpy.ops.object.mode_set(mode="POSE")

    inv = dst_arm.matrix_world.inverted().to_3x3()
    src_world = src_arm.matrix_world

    def hierarchy(arm):
        out = []

        def walk(b):
            out.append(b)
            for c in b.children:
                walk(c)
        for b in arm.pose.bones:
            if b.parent is None:
                walk(b)
        return out

    n = 0
    for pb in hierarchy(dst_arm):           # cha trước con: con dựa vào chỗ cha vừa dời tới
        sb = src_arm.data.bones.get(pb.name)
        if not sb:
            continue
        # hướng VÀ xoắn của xương nguồn lúc nghỉ, kéo về hệ của armature đích
        want = (inv @ (src_world @ sb.matrix_local).to_3x3()).normalized()
        pb.matrix = Matrix.Translation(pb.matrix.to_translation()) @ want.to_4x4()
        bpy.context.view_layer.update()
        n += 1

    bpy.ops.object.mode_set(mode="OBJECT")

    # Nướng biến dạng hiện tại vào đỉnh mesh.
    #
    # ⚠️ KHÔNG dùng `bpy.ops.object.modifier_copy/modifier_apply` ở đây: chạy nền
    # (`blender -b`) thì ngữ cảnh operator thiếu phần chọn đối tượng, hai lệnh đó
    # IM LẶNG không làm gì — xương sang T-pose mà da vẫn đứng A-pose, ra một đống
    # thịt vặn vẹo, và không có lỗi nào báo.
    #
    # Đọc thẳng từ depsgraph thì không phụ thuộc ngữ cảnh: lấy mesh đã qua modifier
    # rồi gán đè. Nhóm đỉnh nằm trên OBJECT chứ không nằm trên mesh nên vẫn còn
    # nguyên, modifier Armature cũng giữ nguyên để tiếp tục biến dạng từ gốc mới.
    deps = bpy.context.evaluated_depsgraph_get()
    for m in meshes:
        if not any(x.type == "ARMATURE" for x in m.modifiers):
            continue
        baked = bpy.data.meshes.new_from_object(m.evaluated_get(deps))
        old = m.data
        m.data = baked
        if old.users == 0:
            bpy.data.meshes.remove(old)

    bpy.context.view_layer.objects.active = dst_arm
    bpy.ops.object.mode_set(mode="POSE")
    bpy.ops.pose.armature_apply()
    bpy.ops.object.mode_set(mode="OBJECT")
    print(f"  can tu the nghi theo rig Mixamo: {n} xuong")
    return n


def load_action(fbx_path, target_arm, align_with=None, in_place=True):
    """Nạp FBX animation của Mixamo rồi gán action sang armature của model.

    Tên xương hai bên đều là `mixamorig:*` nên gán thẳng là chạy — đây chính là
    lý do KHÔNG cần upload model lên Mixamo để rig lại. Nhưng phải quy đổi đơn vị
    trước, xem `rescale_locations`.
    """
    added = import_model(fbx_path)
    src = find_armature(added)
    if src is not None and align_with:   # dict rỗng = đã căn rồi, bỏ qua
        align_rest_pose(align_with["arm"], src, align_with["meshes"])
        align_with.clear()          # chỉ căn MỘT lần, cho animation đầu tiên
    if not src:
        for o in added:
            bpy.data.objects.remove(o, do_unlink=True)
        print(f"  ! {fbx_path}: khong thay armature, bo qua")
        return None
    act = src.animation_data.action if src.animation_data else None
    if act:
        act.use_fake_user = True
        ratio, n = rescale_locations(act, src, target_arm)
        print(f"  quy doi don vi: ti le {ratio:.5f} tren {n} duong cong location")
        if in_place:
            k = strip_root_motion(act)
            if k:
                print(f"  ghim tai cho: bo troi tren {k} truc cua xuong goc")
        if not target_arm.animation_data:
            target_arm.animation_data_create()
        target_arm.animation_data.action = act
    # dọn armature tạm của Mixamo, chỉ giữ lại action
    for o in added:
        bpy.data.objects.remove(o, do_unlink=True)
    return act


def bounds(objs):
    """Hộp bao của toàn bộ mesh, theo toạ độ thế giới."""
    lo = Vector((1e9, 1e9, 1e9))
    hi = Vector((-1e9, -1e9, -1e9))
    found = False
    for o in objs:
        if o.type != "MESH":
            continue
        found = True
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            lo = Vector((min(lo[i], w[i]) for i in range(3)))
            hi = Vector((max(hi[i], w[i]) for i in range(3)))
    if not found:
        sys.exit("khong tim thay mesh nao trong file")
    return lo, hi


def setup_camera(lo, hi, elev_deg, margin):
    """Máy ảnh TRỰC GIAO, đứng yên suốt cả bộ ảnh.

    Trực giao chứ không phối cảnh: phối cảnh thì nhân vật ở rìa màn hình bị nghiêng
    ra ngoài, mà game lát ô theo lưới nên mọi ô phải nhìn giống hệt nhau.
    """
    cx = (lo.x + hi.x) / 2
    cy = (lo.y + hi.y) / 2
    cz = (lo.z + hi.z) / 2
    height = hi.z - lo.z
    radius = max(hi.x - lo.x, hi.y - lo.y, height)

    cam_data = bpy.data.cameras.new("cam")
    cam_data.type = "ORTHO"
    # thước ngắm ôm trọn đường chéo: nhân vật xoay 360° mà khung không được đổi
    cam_data.ortho_scale = max(height, math.hypot(hi.x - lo.x, hi.y - lo.y)) * margin
    cam = bpy.data.objects.new("cam", cam_data)
    bpy.context.collection.objects.link(cam)

    el = math.radians(elev_deg)
    dist = radius * 6 + 10
    # nhìn từ -Y tới: trong Blender nhân vật quay 0° là đang quay lưng về -Y,
    # nên hướng này ra tấm "s" (mặt nhìn thẳng vào người chơi)
    cam.location = (cx, cy - dist * math.cos(el), cz + dist * math.sin(el))
    cam.rotation_euler = (math.radians(90) - el, 0, 0)
    bpy.context.scene.camera = cam
    return cam


def setup_light(lo, hi):
    """Ánh sáng dịu, đều, không đổ bóng gắt — khớp với bộ ảnh artist đã gửi."""
    size = max(hi - lo)
    key = bpy.data.lights.new("key", type="AREA")
    key.energy = 110 * size * size
    key.size = size * 4
    ko = bpy.data.objects.new("key", key)
    ko.location = (lo.x - size, lo.y - size * 2, hi.z + size * 1.5)
    ko.rotation_euler = (math.radians(55), 0, math.radians(-30))
    bpy.context.collection.objects.link(ko)

    fill = bpy.data.lights.new("fill", type="AREA")
    fill.energy = 40 * size * size
    fill.size = size * 6
    fo = bpy.data.objects.new("fill", fill)
    fo.location = (hi.x + size * 2, lo.y - size * 2, cz_mid(lo, hi))
    fo.rotation_euler = (math.radians(80), 0, math.radians(60))
    bpy.context.collection.objects.link(fo)

    w = bpy.data.worlds.new("w")
    w.use_nodes = True
    # Ambient vừa đủ vén sáng vùng tối. Để cao như 0.35 là ảnh bệt thành một màu xám:
    # ánh sáng từ mọi phía dội vào thì không còn chỗ nào tối, mà mất tối là mất khối.
    w.node_tree.nodes["Background"].inputs[1].default_value = 0.12
    bpy.context.scene.world = w


def cz_mid(lo, hi):
    return (lo.z + hi.z) / 2


def setup_render(res_h, samples, exposure=0.0):
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in \
        {i.identifier for i in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items} else "BLENDER_EEVEE"
    sc.render.film_transparent = True          # nền trong suốt, game cần alpha thật
    sc.render.resolution_x = res_h
    sc.render.resolution_y = res_h
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    # ⚠️ Blender 4 mặc định AgX — bộ chuyển màu dành cho phim người đóng, nó kéo tụt
    # bão hoà để giữ vùng cháy sáng. Nhân vật hoạt hình qua AgX là ra một đống xám,
    # lệch hẳn bộ ảnh artist đã gửi. `Standard` mới trả đúng màu của texture.
    try:
        sc.view_settings.view_transform = "Standard"
        sc.view_settings.look = "None"
        sc.view_settings.exposure = exposure
    except TypeError:
        pass
    try:
        sc.eevee.taa_render_samples = samples
    except AttributeError:
        pass


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--glb", required=True, help="model co rig (.glb/.fbx)")
    ap.add_argument("--name", required=True, help="ten nhan vat, thanh ten thu muc")
    ap.add_argument("--anim", action="append", default=[],
                    help="ten=duong/dan.fbx — lap lai duoc nhieu lan")
    ap.add_argument("--frames", type=int, default=8, help="so frame moi tu the")
    ap.add_argument("--res", type=int, default=512, help="canh anh render (px)")
    ap.add_argument("--elev", type=float, default=ISO_ELEV, help="goc ngang may anh (do)")
    # Model Tripo nhập vào Blender là đang quay mặt về +X, tức nhìn sang PHẢI màn hình,
    # trong khi ô đầu tiên `s` phải là mặt nhìn thẳng vào người chơi (-Y, phía máy ảnh).
    # Quay bù 270° thì ô `s` ra đúng mặt trước, và bảy hướng còn lại tự khớp theo.
    # Model khác hướng gốc khác thì đổi số này; render thử rồi xem ô đầu có phải mặt
    # trước không là biết ngay.
    ap.add_argument("--yaw0", type=float, default=270.0, help="xoay bu neu model quay sai huong")
    ap.add_argument("--margin", type=float, default=1.15, help="chua le quanh nhan vat")
    # +1.0 không phải số đẹp bịa ra: dò bằng cách render thử nhiều mức rồi so màu
    # trung bình vùng yếm với `public/art/player/p_s.png` của artist. Mức này lệch 13/765,
    # tức khớp. Thay đèn hay đổi model thì phải dò lại, đừng bê nguyên số này.
    ap.add_argument("--exposure", type=float, default=1.0,
                    help="bu sang theo stop (EV): am la toi di, duong la sang len")
    ap.add_argument("--carry", action="append", default=[],
                    help="ten tu the duoc dat tay ve kieu BUNG DO (lap lai duoc)")
    # Tư thế ĐỨNG YÊN phải ra từ CHÍNH model này, không mượn bảng xoay của artist:
    # hai nguồn là hai bộ đèn khác nhau, mà `art-raw/character_model_list.png` còn là
    # một bản model KHÁC hẳn (tạp dề của nó có dây chéo sau lưng, model 3D thì không).
    # Đứng yên một màu, bước đi một màu, đổi qua lại là thấy nhấp nháy.
    ap.add_argument("--idle", action="store_true",
                    help="render them tu the NGHI (dung yen) tu chinh model nay")
    ap.add_argument("--keep-root-motion", action="store_true",
                    help="giu nguyen phan troi cua xuong goc (mac dinh la ghim tai cho)")
    ap.add_argument("--samples", type=int, default=64)
    ap.add_argument("--out", default="art-raw/render")
    a = ap.parse_args(argv_after_ddash())

    wipe_scene()
    objs = import_model(os.path.abspath(a.glb))
    objs = drop_junk(objs)
    arm = find_armature(objs)
    print(f"[render] nap {a.glb}: {len(objs)} object, armature={arm.name if arm else 'KHONG CO'}")

    # gom cả bộ vào một empty để xoay một phát, mesh vẫn bám xương
    pivot = bpy.data.objects.new("pivot", None)
    bpy.context.collection.objects.link(pivot)
    for o in objs:
        if o.parent is None:
            o.parent = pivot

    lo, hi = bounds(objs)
    # đặt chân nhân vật xuống z=0 và canh giữa theo trục ngang: mốc neo của game là ĐẾ GIÀY
    pivot.location = (-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z)
    bpy.context.view_layer.update()
    lo, hi = bounds(objs)

    cam = setup_camera(lo, hi, a.elev, a.margin)
    setup_light(lo, hi)
    setup_render(a.res, a.samples, a.exposure)

    poses = {}
    # ⚠️ Tư thế nghỉ phải đứng ĐẦU HÀNG, trước mọi animation. `align_rest_pose()` bẻ bộ
    # xương sang tư thế nghỉ của rig NGUỒN rồi CHỐT nó làm gốc mới — chạy xong thì "nghỉ"
    # không còn là dáng buông tay của Tripo nữa mà là T-pose dang ngang. Render tư thế
    # nghỉ sau animation là ra tám tấm người đứng dang hai tay như bù nhìn.
    if a.idle:
        poses["idle"] = None
    for spec in a.anim:
        if "=" not in spec:
            sys.exit(f"--anim phai dang ten=duong/dan.fbx, nhan duoc: {spec}")
        nm, path = spec.split("=", 1)
        poses[nm] = os.path.abspath(path)
    if not poses:
        poses = {"idle": None}   # khong co anim -> render dung tu the rest

    # căn tư thế nghỉ một lần, dùng rig của animation đầu tiên làm chuẩn
    align = {"arm": arm, "meshes": [o for o in objs if o.type == "MESH"]} if arm else None

    sc = bpy.context.scene
    total = 0
    for pose, fbx in poses.items():
        act = load_action(fbx, arm, align, not a.keep_root_motion) if (fbx and arm) else None
        if act is None and arm:
            # Không có action: đây là tư thế ĐỨNG YÊN. Nắn tay xuống, vì tư thế nghỉ
            # của rig có thể là T-pose — xem `set_idle_pose`.
            set_idle_pose(arm)
        carrying = pose in a.carry
        if carrying and act and arm:
            n_removed = freeze_arm_chain(act)
            print(f"  tu the BUNG DO: go {n_removed} duong cong tay")
        anchors: dict[str, list[float]] = {}
        if act:
            f0, f1 = (int(act.frame_range[0]), int(act.frame_range[1]))
            nframes = max(1, a.frames)
            print(f"[render] {pose}: action '{act.name}' frame {f0}..{f1} -> lay {nframes}")
        else:
            f0 = f1 = sc.frame_current
            nframes = 1
            print(f"[render] {pose}: khong co animation, render 1 frame tinh")

        for di, d in enumerate(DIRS):
            # xoay nhân vật, KHÔNG xoay máy ảnh -> tám hướng dùng chung một khung
            pivot.rotation_euler = (0, 0, math.radians(a.yaw0 + di * 45))
            for fi in range(nframes):
                if act and nframes > 1:
                    # bỏ frame cuối: chu kỳ khép kín nên frame cuối trùng frame đầu
                    sc.frame_set(int(f0 + (f1 - f0) * fi / nframes))
                if carrying and arm:
                    # nắn LẠI mỗi frame: thân vừa xoay thì tay phải nắn theo — xem `set_carry_pose`
                    set_carry_pose(arm)
                    ax, ay = hand_anchor(arm, cam)
                    anchors[f"{d}_{fi:02d}"] = [round(ax, 2), round(ay, 2)]
                out = os.path.join(a.out, a.name, pose, f"{d}_{fi:02d}.png")
                os.makedirs(os.path.dirname(out), exist_ok=True)
                sc.render.filepath = os.path.abspath(out)
                bpy.ops.render.render(write_still=True)
                total += 1
            print(f"  {pose}/{d}: {nframes} frame")
        if anchors:
            ap_path = os.path.join(a.out, a.name, f"{pose}.anchor.json")
            with open(ap_path, "w", encoding="utf-8") as fh:
                json.dump(anchors, fh, indent=1)
            xs = [v[0] for v in anchors.values()]
            ys = [v[1] for v in anchors.values()]
            print(f"  neo tay -> {os.path.basename(ap_path)} | x {min(xs):.1f}..{max(xs):.1f}"
                  f" y {min(ys):.1f}..{max(ys):.1f} (pixel tren anh {a.res})")

    print(f"[render] xong {total} anh -> {a.out}/{a.name}/")


if __name__ == "__main__":
    main()
