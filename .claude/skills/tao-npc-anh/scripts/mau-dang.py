"""Ghép 4 frame đi của nhân vật đã có atlas render 3D làm ảnh mẫu dáng cho ChatGPT.

  python3 .claude/skills/tao-npc-anh/scripts/mau-dang.py <thu-muc-ra> le|chan [nguon=anh-bao]

le = frame 1,3,5,7 (hai bước), chan = frame 0,2,4,6 (chân lướt qua nhau); ghép xen ra đủ 8 frame.
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
DIRS = ["s", "se", "e", "ne", "n", "nw", "w", "sw"]

if len(sys.argv) < 3 or sys.argv[2] not in ("le", "chan"):
    sys.exit(__doc__)
out = Path(sys.argv[1])
pick = (1, 3, 5, 7) if sys.argv[2] == "le" else (0, 2, 4, 6)
src = ROOT / "art-raw" / "render" / (sys.argv[3] if len(sys.argv) > 3 else "anh-bao") / "walk"
out.mkdir(parents=True, exist_ok=True)
for d in DIRS:
    fr = [Image.open(src / f"{d}_{i:02d}.png").convert("RGBA") for i in pick]
    boxes = [f.getbbox() for f in fr]
    box = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
    w, h = box[2] - box[0] + 20, box[3] - box[1] + 20
    strip = Image.new("RGB", (w * 4, h), "white")
    for i, f in enumerate(fr):
        c = f.crop(box)
        strip.paste(c, (i * w + 10, 10), c)
    strip.resize((strip.width * 3, h * 3), Image.LANCZOS).save(out / f"{d}.png")
print(f"-> {out}/<huong>.png")
