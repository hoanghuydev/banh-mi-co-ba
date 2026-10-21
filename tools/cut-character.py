#!/usr/bin/env python3
"""Cắt bảng xoay 8 hướng thành file rời, chung khung, căn tâm bàn chân để đổi hướng không giật: `python3 tools/cut-character.py [tên]`."""
import os
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("cần Pillow: python3 -m pip install --user Pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "art-raw")
ART = os.path.join(ROOT, "public", "art")

# Dư chỗ vì `photo.ts` thu nhỏ bằng cách chia đôi nhiều nhịp.
LONGEST = 384

INK = 8

# Phần đáy hình coi là bàn chân (~23 px trên người cao 380 px).
SOLE = 0.06

# Phải khớp `BODY_H` ở `src/art/character.ts`.
BODY_H = 64

# Hướng là hướng TRÊN MÀN HÌNH ("s" = mặt về người chơi); số ô đếm từ 1 theo thứ tự đọc; tuple = (hướng, ô, lật ngang).
# `san` ép mọi hướng về cỡ hướng `ref` — chỉ bật khi artist render hai hàng bằng hai góc máy khác nhau.
CAST = {
    "co-ba": {
        "sheet": "character_model_list.png",
        "out": ("player", "p_"),
        "knob": "PLAYER_H",
        "ref": "s",
        # Cả game đã căn theo bộ ảnh này, bật san thì phải soi lại vị trí bóng/món cầm.
        "san": False,
        "slots": [
            ("s",  1, False),
            ("n",  2, False),
            ("w",  3, False),
            ("e",  4, False),
            ("se", 5, False),
            ("sw", 8, False),
            ("nw", 7, False),
            ("ne", 7, True),    # ô 6 trùng góc ô 5 nên thiếu hướng này
        ],
    },
    "anh-dung": {
        "sheet": "anh-dung-list.png",
        "out": ("npc/anh-dung", ""),
        "knob": "NPC_PHOTOS.ANH_DUNG.h",
        "ref": "s",
        "san": True,
        "slots": [
            ("s",  1, False),
            ("n",  2, False),
            ("e",  3, False),
            ("w",  4, False),
            ("se", 5, False),
            ("sw", 6, False),
            ("nw", 7, False),   # kính lật ló ra mép TRÁI
            ("ne", 8, False),   # kính lật ló ra mép PHẢI
        ],
    },
    # Bảng không có kính lão dù `content/npcs.ts` ghi `glasses: true`.
    "ba-bay": {
        "sheet": "ba-bay-list.png",
        "out": ("npc/ba-bay", ""),
        "knob": "NPC_PHOTOS.BA_BAY.h",
        "ref": "s",
        "san": True,
        "slots": [
            ("s",  1, False),
            ("n",  2, False),
            ("e",  3, False),
            ("w",  4, False),
            ("se", 5, False),
            ("sw", 6, False),
            ("nw", 7, False),
            ("ne", 7, True),    # ô 8 trùng góc ô 7 nên thiếu hướng này
        ],
    },
    # Ảnh có kính, không nón kết — ngược với `content/npcs.ts`.
    "anh-bao": {
        "sheet": "anh-bao-list.png",
        "out": ("npc/anh-bao", ""),
        "knob": "NPC_PHOTOS.ANH_BAO.h",
        "ref": "s",
        "san": False,
        "slots": [
            ("s",  2, False),
            ("n",  1, False),
            ("w",  4, False),
            ("e",  4, True),    # bảng thiếu nửa phía đông
            ("se", 7, False),
            ("sw", 8, False),
            ("nw", 5, False),
            ("ne", 5, True),
        ],
    },
}


def bands(hits, gap_min=8):
    """Các dải LIỀN MẠCH có hình, bỏ dải mỏng hơn `gap_min` (bụi, viền lẻ)."""
    out, start = [], None
    for i, v in enumerate(hits):
        if v and start is None:
            start = i
        elif not v and start is not None:
            if i - start >= gap_min:
                out.append((start, i))
            start = None
    if start is not None and len(hits) - start >= gap_min:
        out.append((start, len(hits)))
    return out


def cells(im):
    """Cắt hàng trước rồi mới cắt cột trong từng hàng, vì hai hàng có thể lệch cột."""
    w, h = im.size
    a = im.getchannel("A").point(lambda v: 255 if v > INK else 0)
    px = a.load()

    rows = bands([any(px[x, y] for x in range(w)) for y in range(h)])
    out = []
    for y0, y1 in rows:
        cols = bands([any(px[x, y] for y in range(y0, y1)) for x in range(w)])
        out += [(x0, y0, x1, y1) for x0, x1 in cols]
    return out


def sole_center(im):
    """Tâm ngang bàn chân, không dùng tâm khung vì tóc/búi kéo lệch khác nhau mỗi hướng."""
    px = im.load()
    y0 = max(0, im.height - max(1, round(im.height * SOLE)))
    xs = [x for y in range(y0, im.height) for x in range(im.width) if px[x, y][3] > INK]
    if not xs:
        return im.width / 2
    return (min(xs) + max(xs) + 1) / 2


def cut(who, spec):
    path = os.path.join(RAW, spec["sheet"])
    if not os.path.exists(path):
        sys.exit(f"không thấy bảng xoay: {path}")
    sheet = Image.open(path).convert("RGBA")

    boxes = cells(sheet)
    if len(boxes) != 8:
        sys.exit(f"{who}: bảng phải có đúng 8 ô, dò ra {len(boxes)} — xem lại ảnh gốc")

    slots = spec["slots"]
    ref = spec["ref"]
    ref_slot = next(s for n, s, _ in slots if n == ref)

    figs = [sheet.crop(box) for box in boxes]
    figs = [f.crop(f.getbbox()) for f in figs]

    # San TRƯỚC khi đo tâm chân, không thì tâm chân còn theo thang cũ.
    if spec["san"]:
        tall = figs[ref_slot - 1].height
        figs = [f if f.height == tall else
                f.resize((max(1, round(f.width * tall / f.height)), tall), Image.LANCZOS)
                for f in figs]

    figs = [(f, sole_center(f)) for f in figs]

    # Khung đối xứng quanh tâm chân nên tâm ngang khung = tâm chân ở mọi hướng.
    used = {slot for _, slot, _ in slots}
    H = max(figs[i - 1][0].height for i in used)
    reach = max(max(c, f.width - c) for i in used for f, c in [figs[i - 1]])
    W = int(round(reach)) * 2

    folder, prefix = spec["out"]
    out = os.path.join(ART, folder)
    os.makedirs(out, exist_ok=True)
    k = LONGEST / max(W, H)
    size = (max(1, round(W * k)), max(1, round(H * k))) if k < 1 else (W, H)

    print(f"{who}: khung chung {W}×{H} -> file {size[0]}×{size[1]}"
          f"  ({folder}/{prefix or ''}<hướng>.png{', đã san chiều cao' if spec['san'] else ''})")
    for name, slot, flip in slots:
        fig, cx = figs[slot - 1]
        canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        canvas.alpha_composite(fig, (int(round(W / 2 - cx)), H - fig.height))
        if flip:
            canvas = canvas.transpose(Image.FLIP_LEFT_RIGHT)
        if size != (W, H):
            canvas = canvas.resize(size, Image.LANCZOS)
        canvas.save(os.path.join(out, f"{prefix}{name}.png"))
        print(f"  {prefix}{name}.png   (ô {slot}{', lật ngang' if flip else ''})")

    # `photo.ts` ép cả khung về `h`, nên nới `h` theo tỉ lệ khung/hình mốc để hướng mốc cao đúng BODY_H.
    print(f"\n-> src/art/photo.ts: {spec['knob']} = {round(BODY_H * H / figs[ref_slot - 1][0].height)}"
          f"  (hướng {ref!r} cao đúng BODY_H = {BODY_H})")

    lo = min(figs[i - 1][0].height for i in used)
    print(f"   chênh cao giữa tám hướng: {100 * (H - lo) / H:.1f}%\n")


def main():
    want = sys.argv[1:] or list(CAST)
    for who in want:
        if who not in CAST:
            sys.exit(f"không có ai tên {who!r} trong bảng — có: {', '.join(CAST)}")
    for who in want:
        cut(who, CAST[who])


if __name__ == "__main__":
    main()
