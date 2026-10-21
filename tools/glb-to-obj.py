#!/usr/bin/env python3
"""GLB cua Tripo -> .obj + .mtl + texture; anh lay thang byte goc (qua Blender JPEG thanh PNG nang gap 4 lan)."""
import bpy, sys, os, json, struct

args = sys.argv[sys.argv.index("--")+1:]
src, out = os.path.abspath(args[0]), os.path.abspath(args[1])
outdir = os.path.dirname(out)
os.makedirs(outdir, exist_ok=True)

EXT = {"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp"}


def dump_textures(glb_path, dest):
    """Moc anh ra khoi chunk nhi phan cua GLB, giu nguyen dinh dang goc."""
    data = open(glb_path, "rb").read()
    off, js, bin_ = 12, None, None
    while off + 8 <= len(data):
        clen, ctype = struct.unpack_from("<I4s", data, off)
        off += 8
        body, off = data[off:off + clen], off + clen
        if ctype == b"JSON":
            js = json.loads(body)
        elif ctype.rstrip(b"\x00") == b"BIN":
            bin_ = body
    names = {}
    for im in js.get("images", []):
        bv = js["bufferViews"][im["bufferView"]]
        start = bv.get("byteOffset", 0)
        name = (im.get("name") or "tex") + EXT.get(im.get("mimeType"), ".bin")
        open(os.path.join(dest, name), "wb").write(bin_[start:start + bv["byteLength"]])
        names[im.get("name")] = name
        print(f"  texture -> {name} ({bv['byteLength'] / 1048576:.2f} MB, {im.get('mimeType')})")
    return names


bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)

# Vut mesh rac khong dinh xuong (Icosphere cua Tripo)
skinned = [o for o in bpy.data.objects if o.type == "MESH"
           and any(m.type == "ARMATURE" for m in o.modifiers)]
for o in [o for o in bpy.data.objects if o.type == "MESH" and o not in skinned]:
    print(f"  - bo mesh roi: {o.name} ({len(o.data.vertices)} dinh)")
    bpy.data.objects.remove(o, do_unlink=True)

files = dump_textures(src, outdir)
for img in bpy.data.images:
    if img.name in files:
        # Chi tro duong dan, khong img.save(): file da co byte goc tren dia.
        img.filepath_raw = os.path.join(outdir, files[img.name])

for o in bpy.data.objects:
    o.select_set(o.type == "MESH")
bpy.ops.wm.obj_export(filepath=out, export_selected_objects=True,
                      export_materials=True, export_triangulated_mesh=True,
                      path_mode="STRIP")
print("[obj]", out)
