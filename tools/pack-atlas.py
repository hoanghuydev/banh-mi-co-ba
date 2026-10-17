#!/usr/bin/env python3
"""
art-raw/render/<nhân vật>/<tư thế>/<hướng>_<frame>.png  ->  public/art/<nhân vật>.png + .json

Xưởng GỘP ẢNH, chạy sau `render-character.py`:

    python3 tools/pack-atlas.py player
    python3 tools/pack-atlas.py player --height 384     # cỡ cạnh dài mỗi ô

Ra MỘT tấm atlas + MỘT file JSON kiểu Phaser (`load.atlas`). Tên mỗi ô là
`<tư thế>_<hướng>_<số frame>`, ví dụ `walk_se_03`.

── Vì sao gộp, trong khi ảnh tĩnh để rời vẫn chạy tốt ───────────────────────
Tám hướng tĩnh thì để rời cũng được — 8 file, không ai chết. Nhưng thêm
animation vào là 8 hướng × 8 frame = 64 ảnh MỖI tư thế: để rời thì vừa 64 lượt
tải, vừa không ai mở thư mục ra mà dò nổi. Gộp lại còn một lượt tải.

Lưu ý thứ GỘP KHÔNG giúp: tốc độ VẼ trong game. `photo.ts` không vẽ thẳng từ
ảnh nguồn — nó sơn lại vào canvas tự sinh rồi mới vẽ từ đó. Nên cái lợi ở đây
thuần tuý là LÚC TẢI, không phải lúc chạy.

── Khung chung: chỗ duy nhất dễ làm hỏng ────────────────────────────────────
Mọi ô phải cắt theo ĐÚNG MỘT khung, lấy hợp của mọi frame mọi hướng. Cắt sát
mép từng ảnh riêng là nhân vật giật tưng tưng mỗi lần đổi hướng hay sang frame:
tay vung lên ở frame này thì mép alpha cao hơn frame kia, mà game căn theo mép.
Lấy hợp một lần rồi cắt tất cả bằng nó thì chân luôn nằm đúng một chỗ.
"""
import argparse
import json
import math
import os
import re
import sys
from pathlib import Path

from PIL import Image

FRAME_RX = re.compile(r"^(?P<dir>[a-z]{1,2})_(?P<idx>\d+)\.png$")


def collect(root: Path):
    """root/<tư thế>/<hướng>_<frame>.png -> [(tên ô, đường dẫn)] theo thứ tự ổn định."""
    out = []
    for pose_dir in sorted(p for p in root.iterdir() if p.is_dir()):
        for f in sorted(pose_dir.iterdir()):
            m = FRAME_RX.match(f.name)
            if not m:
                continue
            out.append((f"{pose_dir.name}_{m['dir']}_{int(m['idx']):02d}", f))
    return out


def union_box(paths):
    """Hợp của mọi hộp alpha — KHUNG CHUNG cho cả bộ."""
    box = None
    for p in paths:
        with Image.open(p) as im:
            b = im.convert("RGBA").getbbox()
        if b is None:
            continue
        box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]),
                                     max(box[2], b[2]), max(box[3], b[3]))
    if box is None:
        sys.exit("moi anh deu trong suot hoan toan")
    return box


def main():
    ap = argparse.ArgumentParser(description="Gop anh render thanh atlas cho Phaser")
    ap.add_argument("name", help="ten nhan vat (ten thu muc trong art-raw/render)")
    ap.add_argument("--src", default="art-raw/render")
    ap.add_argument("--out", default="public/art")
    ap.add_argument("--height", type=int, default=384,
                    help="chieu cao moi o sau khi co lai (px)")
    ap.add_argument("--pad", type=int, default=2,
                    help="vien trong giua cac o, chong ri mau khi GPU noi suy")
    a = ap.parse_args()

    root = Path(a.src) / a.name
    if not root.is_dir():
        sys.exit(f"khong thay {root} — chay render-character.py truoc")

    frames = collect(root)
    if not frames:
        sys.exit(f"{root} khong co anh nao dung dang <huong>_<frame>.png")

    box = union_box([p for _, p in frames])
    bw, bh = box[2] - box[0], box[3] - box[1]
    scale = a.height / bh
    cw, ch = max(1, round(bw * scale)), a.height
    print(f"[atlas] {len(frames)} o | khung chung {bw}x{bh} -> moi o {cw}x{ch}")

    # lưới gần vuông nhất: atlas vuông thì GPU nào cũng nuốt, mà cũng đỡ phí chỗ
    cols = max(1, round(math.sqrt(len(frames) * ch / cw)))
    rows = math.ceil(len(frames) / cols)
    pad = a.pad
    W, H = cols * (cw + pad) + pad, rows * (ch + pad) + pad
    print(f"[atlas] luoi {cols}x{rows} -> anh {W}x{H}")

    sheet = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    meta = {}
    for i, (key, path) in enumerate(frames):
        with Image.open(path) as im:
            cell = im.convert("RGBA").crop(box).resize((cw, ch), Image.LANCZOS)
        x = pad + (i % cols) * (cw + pad)
        y = pad + (i // cols) * (ch + pad)
        sheet.paste(cell, (x, y))
        meta[key] = {
            "frame": {"x": x, "y": y, "w": cw, "h": ch},
            "rotated": False, "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": cw, "h": ch},
            "sourceSize": {"w": cw, "h": ch},
        }

    outdir = Path(a.out)
    outdir.mkdir(parents=True, exist_ok=True)
    png = outdir / f"{a.name}.png"
    sheet.save(png, optimize=True)
    (outdir / f"{a.name}.json").write_text(json.dumps(
        {"frames": meta,
         "meta": {"image": png.name, "format": "RGBA8888",
                  "size": {"w": W, "h": H}, "scale": 1,
                  "app": "tools/pack-atlas.py"}},
        indent=1))

    # Bảng neo tay: `render-character.py` xuất một file cho mỗi tư thế bưng. Gộp lại thành
    # MỘT file nhỏ cạnh atlas — game nạp riêng bằng `load.json`, không nhét vào atlas JSON
    # vì Phaser nuốt file đó vào texture manager, lấy lại phần phụ chú rất lắt léo.
    #
    # `render-character.py` ghi toạ độ bằng PIXEL trên tấm ảnh render. Ở đây quy đổi sang
    # TỈ LỆ CỦA Ô bằng đúng phép cắt + co đã áp cho ảnh, nên không có chỗ nào đoán lại:
    #   x : lệch so với TÂM ô, chia cho CHIỀU CAO ô
    #   y : cao hơn ĐÁY ô bao nhiêu, chia cho chiều cao ô
    # Chia cả hai cho chiều cao vì bên game nhân lại với `PLAYER_H` — mà `PLAYER_H` chính
    # là chiều cao ô quy ra px thiết kế. Đáy ô cũng đúng là điểm chạm đất (`standing()` đặt
    # mép dưới ảnh vào đó).
    holds: dict[str, dict[str, list[float]]] = {}
    for f in sorted(root.glob("*.anchor.json")):
        raw = json.loads(f.read_text())
        conv = {}
        for k, (px, py) in raw.items():
            cx = (px - box[0]) * (cw / bw)
            cy = (py - box[1]) * (ch / bh)
            conv[k] = [round((cx - cw / 2) / ch, 5), round((ch - cy) / ch, 5)]
        holds[f.name[:-len(".anchor.json")]] = conv
    if holds:
        hp = outdir / f"{a.name}_hold.json"
        hp.write_text(json.dumps(holds, indent=1))
        n = sum(len(v) for v in holds.values())
        print(f"[atlas] neo tay: {', '.join(holds)} ({n} o) -> {hp.name}")

    poses = sorted({k.rsplit("_", 2)[0] for k in meta})
    print(f"[atlas] tu the: {', '.join(poses)}")
    print(f"[atlas] -> {png} ({png.stat().st_size // 1024} KB) + {a.name}.json")


if __name__ == "__main__":
    main()
