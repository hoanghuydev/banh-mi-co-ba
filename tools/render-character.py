#!/usr/bin/env python3
"""
Model 3D có rig  ->  art-raw/render/<nhân vật>/<tư thế>/<hướng>_<frame>.png

    blender -b -P tools/render-character.py -- --glb <file.glb> --name player
    blender -b -P tools/render-character.py -- --glb x.glb --name player \
            --anim walk=tripo-anim/tripo_walk.glb --frames 8
"""
import argparse
import json
import math
import os
import sys

import bpy
from mathutils import Vector

DIRS = ["s", "se", "e", "ne", "n", "nw", "w", "sw"]  # đúng thứ tự DIRS8 của photo.ts
# Máy ảnh trực giao nén mặt đất theo sin(el), nên 30° (không phải atan 0,5) mới ra thoi 2:1.
ISO_ELEV = 30.0

# Bên trái, hệ model (trước +X, lên +Z); bên phải lật dấu Y.
CARRY_ARM = (0.30, 0.0, -0.95)     # vai -> khuỷu: buông xuống, hơi chếch ra trước
CARRY_FORE = (0.93, -0.30, 0.20)   # khuỷu -> bàn tay: đưa ra trước và chụm vào giữa

# Dáng nghỉ đo từ `chef.glb`, vì vài rig Tripo nghỉ ở T-pose.
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
    """Bỏ mesh không dính xương (Tripo kèm một Icosphere làm hộp bao phình to)."""
    skinned = [o for o in objs if o.type == "MESH"
               and any(m.type == "ARMATURE" for m in o.modifiers)]
    if not skinned:
        return objs
    junk = [o for o in objs if o.type == "MESH" and o not in skinned]
    for o in junk:
        print(f"  - bo mesh roi khong dinh xuong: {o.name} ({len(o.data.vertices)} dinh)")
        bpy.data.objects.remove(o, do_unlink=True)
    return [o for o in objs if o not in junk]


def hips_height(arm):
    """Hệ armature, không phải thế giới, vì location trong action cũng ở hệ đó."""
    for n in ("mixamorig:Hips", "Hips", "mixamorig:Spine"):
        b = arm.data.bones.get(n)
        if b:
            return b.head_local.length or 1.0
    return max(arm.dimensions) or 1.0


def rescale_locations(act, src_arm, dst_arm):
    """Mixamo tính bằng xentimet, Tripo bằng mét; không co giãn thì nhân vật văng khỏi khung mà không báo lỗi."""
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
    """Trừ đường thẳng nối khoá đầu–cuối của xương gốc: bỏ phần trôi mà giữ nhún và lắc hông."""
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


ARM_CHAIN = ("Shoulder", "Arm", "ForeArm", "Hand")



def freeze_arm_chain(act):
    """Xoá đường cong nhánh tay để `frame_set` không ghi đè tư thế đã nắn."""
    n = 0
    for fc in list(act.fcurves):
        if any(f'"mixamorig:{side}{part}' in fc.data_path
               for side in ("Left", "Right") for part in ARM_CHAIN):
            act.fcurves.remove(fc)
            n += 1
    return n


def reset_arm_chain(arm):
    """Bắt buộc: gỡ đường cong không xoá phần xoay còn sót trên pose bone từ tư thế render trước."""
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
    """Tính trọn trong hệ armature, không dùng `matrix_world` vì nó mang góc xoay của `pivot`."""
    from mathutils import Matrix
    pb = arm.pose.bones.get(name)
    if not pb:
        return
    cur = pb.tail - pb.head
    if cur.length < 1e-9:
        return
    rot = cur.normalized().rotation_difference(Vector(wdir).normalized())
    m = pb.matrix.copy()
    pb.matrix = Matrix.Translation(m.to_translation()) @ (rot.to_matrix() @ m.to_3x3()).to_4x4()
    bpy.context.view_layer.update()


def set_carry_pose(arm):
    """Gọi lại sau mỗi `frame_set`, vì cột sống animate kéo lệch tay đã nắn."""
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="POSE")
    for side, sy in (("Left", +1), ("Right", -1)):
        aim_bone(arm, f"mixamorig:{side}Arm",
                 (CARRY_ARM[0], CARRY_ARM[1] * sy, CARRY_ARM[2]))
        aim_bone(arm, f"mixamorig:{side}ForeArm",
                 (CARRY_FORE[0], CARRY_FORE[1] * sy, CARRY_FORE[2]))
    bpy.ops.object.mode_set(mode="OBJECT")


def set_idle_pose(arm):
    reset_arm_chain(arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="POSE")
    for side, sy in (("Left", +1), ("Right", -1)):
        aim_bone(arm, f"mixamorig:{side}Arm",
                 (IDLE_ARM[0], IDLE_ARM[1] * sy, IDLE_ARM[2]))
        aim_bone(arm, f"mixamorig:{side}ForeArm",
                 (IDLE_FORE[0], IDLE_FORE[1] * sy, IDLE_FORE[2]))
    bpy.ops.object.mode_set(mode="OBJECT")


def body_yaw(arm):
    """Độ trong hệ thế giới (+X = 0°, +Y = 90°), đo từ trục hai vai."""
    pb = arm.pose.bones
    l, r = pb.get("mixamorig:LeftArm"), pb.get("mixamorig:RightArm")
    if not l or not r:
        return None
    m = arm.matrix_world
    right = (m @ r.head) - (m @ l.head)
    right.z = 0
    if right.length < 1e-9:
        return None
    fwd = Vector((0, 0, 1)).cross(right.normalized())
    return math.degrees(math.atan2(fwd.y, fwd.x))


def check_facing(arm, pose, tol=10.0):
    """Ở ô `s` mặt phải nhìn về máy ảnh (−Y); đo hệ thế giới vì hệ armature vẫn báo đạt khi rig lệch."""
    yaw = body_yaw(arm)
    if yaw is None:
        return
    off = (yaw - (-90.0) + 180.0) % 360.0 - 180.0   # −90° = nhìn về −Y = phía máy ảnh
    if abs(off) > tol:
        sys.exit(
            f"[render] {pose}: o `s` nguoi quay {yaw:+.1f}° (le {off:+.1f}° so voi phia may anh).\n"
            f"         O `s` phai la MAT NHIN THANG vao nguoi choi. Lech dung boi so cua 45° thi\n"
            f"         thu phu `--yaw0` (dang la goc model); lech kieu khac thi xem lai rig/anim.")
    print(f"  huong than o o `s`: {yaw:+.1f}° (le {off:+.1f}°)")


def hand_anchor(arm, cam):
    """Pixel trên ảnh render (không phải tỉ lệ người), để `pack-atlas.py` quy đổi cùng phép cắt ô."""
    from bpy_extras.object_utils import world_to_camera_view
    sc = bpy.context.scene
    m_world = arm.matrix_world
    pb = arm.pose.bones
    mid = ((m_world @ pb["mixamorig:LeftHand"].head)
           + (m_world @ pb["mixamorig:RightHand"].head)) / 2
    v = world_to_camera_view(sc, cam, mid)
    # `world_to_camera_view` gốc ở dưới-trái nên lật y.
    return (v.x * sc.render.resolution_x, (1.0 - v.y) * sc.render.resolution_y)


def align_rest_pose(dst_arm, src_arm, meshes):
    """Trùng tên xương chưa đủ, phải trùng tư thế nghỉ: bẻ rig đích về dáng nghỉ Mixamo, nướng mesh rồi chốt."""
    from mathutils import Matrix

    bpy.context.view_layer.objects.active = dst_arm
    bpy.ops.object.mode_set(mode="POSE")

    # `matrix_local` chứ không `matrix_world`: pivot lúc này còn xoay theo hướng render trước.
    inv = dst_arm.matrix_local.inverted().to_3x3()
    src_local = src_arm.matrix_local

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
        want = (inv @ (src_local @ sb.matrix_local).to_3x3()).normalized()
        pb.matrix = Matrix.Translation(pb.matrix.to_translation()) @ want.to_4x4()
        bpy.context.view_layer.update()
        n += 1

    bpy.ops.object.mode_set(mode="OBJECT")

    # Đọc từ depsgraph vì `modifier_apply` chạy `blender -b` im lặng không làm gì.
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
    added = import_model(fbx_path)
    src = find_armature(added)
    if src is not None and align_with:
        align_rest_pose(align_with["arm"], src, align_with["meshes"])
        align_with.clear()          # chỉ căn một lần, cho animation đầu tiên
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
    for o in added:
        bpy.data.objects.remove(o, do_unlink=True)
    return act


def bounds(objs):
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
    """Trực giao, đứng yên suốt bộ ảnh để tám hướng chung một khung."""
    cx = (lo.x + hi.x) / 2
    cy = (lo.y + hi.y) / 2
    cz = (lo.z + hi.z) / 2
    height = hi.z - lo.z
    radius = max(hi.x - lo.x, hi.y - lo.y, height)

    cam_data = bpy.data.cameras.new("cam")
    cam_data.type = "ORTHO"
    # Ôm trọn đường chéo để xoay 360° khung không đổi.
    cam_data.ortho_scale = max(height, math.hypot(hi.x - lo.x, hi.y - lo.y)) * margin
    cam = bpy.data.objects.new("cam", cam_data)
    bpy.context.collection.objects.link(cam)

    el = math.radians(elev_deg)
    dist = radius * 6 + 10
    # Nhìn từ -Y tới để ra tấm "s".
    cam.location = (cx, cy - dist * math.cos(el), cz + dist * math.sin(el))
    cam.rotation_euler = (math.radians(90) - el, 0, 0)
    bpy.context.scene.camera = cam
    return cam


def setup_light(lo, hi):
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
    # Ambient cao hơn là ảnh bệt, mất khối.
    w.node_tree.nodes["Background"].inputs[1].default_value = 0.12
    bpy.context.scene.world = w


def cz_mid(lo, hi):
    return (lo.z + hi.z) / 2


def setup_render(res_h, samples, exposure=0.0):
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in \
        {i.identifier for i in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items} else "BLENDER_EEVEE"
    sc.render.film_transparent = True
    sc.render.resolution_x = res_h
    sc.render.resolution_y = res_h
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    # AgX mặc định của Blender 4 làm nhạt màu; `Standard` giữ đúng màu texture.
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
    # Model Tripo nhìn về +X, quay bù 270° để ô `s` ra mặt trước.
    ap.add_argument("--yaw0", type=float, default=270.0, help="xoay bu neu model quay sai huong")
    ap.add_argument("--margin", type=float, default=1.15, help="chua le quanh nhan vat")
    # +1.0 dò bằng cách so màu vùng yếm với `p_s.png` của artist; đổi đèn thì dò lại.
    ap.add_argument("--exposure", type=float, default=1.0,
                    help="bu sang theo stop (EV): am la toi di, duong la sang len")
    ap.add_argument("--carry", action="append", default=[],
                    help="ten tu the duoc dat tay ve kieu BUNG DO (lap lai duoc)")
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

    pivot = bpy.data.objects.new("pivot", None)
    bpy.context.collection.objects.link(pivot)
    for o in objs:
        if o.parent is None:
            o.parent = pivot

    lo, hi = bounds(objs)
    # Đế giày ở z=0 vì đó là mốc neo của game.
    pivot.location = (-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z)
    bpy.context.view_layer.update()
    lo, hi = bounds(objs)

    cam = setup_camera(lo, hi, a.elev, a.margin)
    setup_light(lo, hi)
    setup_render(a.res, a.samples, a.exposure)

    poses = {}
    # `idle` phải đứng đầu vì `align_rest_pose()` chốt lại tư thế nghỉ thành T-pose.
    if a.idle:
        poses["idle"] = None
    for spec in a.anim:
        if "=" not in spec:
            sys.exit(f"--anim phai dang ten=duong/dan.fbx, nhan duoc: {spec}")
        nm, path = spec.split("=", 1)
        poses[nm] = os.path.abspath(path)
    if not poses:
        poses = {"idle": None}

    align = {"arm": arm, "meshes": [o for o in objs if o.type == "MESH"]} if arm else None

    sc = bpy.context.scene
    total = 0
    for pose, fbx in poses.items():
        act = load_action(fbx, arm, align, not a.keep_root_motion) if (fbx and arm) else None
        if act is None and arm:
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
            pivot.rotation_euler = (0, 0, math.radians(a.yaw0 + di * 45))
            if di == 0 and arm:
                if act and nframes > 1:
                    sc.frame_set(f0)
                if carrying:
                    set_carry_pose(arm)
                bpy.context.view_layer.update()
                check_facing(arm, pose)
            for fi in range(nframes):
                if act and nframes > 1:
                    # Bỏ frame cuối vì trùng frame đầu.
                    sc.frame_set(int(f0 + (f1 - f0) * fi / nframes))
                if carrying and arm:
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
