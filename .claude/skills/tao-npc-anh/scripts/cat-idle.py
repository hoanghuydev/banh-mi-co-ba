"""Cắt 8huong.png (lưới 4×2: s se e ne / n nw w sw) thành idle/<h>.png nền trắng, làm ảnh đính kèm cho chat đi.

  python3 .claude/skills/tao-npc-anh/scripts/cat-idle.py art-raw/_duyet/<ten>
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

DIRS = ["s", "se", "e", "ne", "n", "nw", "w", "sw"]


def cuts(ink, n, axis):
    """Đường chia lưới n ô: chỗ ít mực nhất quanh mỗi vạch chia đều, vì hình có thể lấn qua giữa ảnh."""
    prof = ink.sum(axis=axis)
    r = len(prof) // (4 * n)
    mids = [k * len(prof) // n for k in range(1, n)]
    return [0] + [c - r + int(np.argmin(prof[c - r: c + r])) for c in mids] + [len(prof)]

if len(sys.argv) != 2:
    sys.exit(__doc__)
src = Path(sys.argv[1])
im = Image.open(src / "8huong.png").convert("RGB")
ink = np.asarray(im).astype(int).min(axis=2) < 235
cx, cy = cuts(ink, 4, 0), cuts(ink, 2, 1)
(src / "idle").mkdir(exist_ok=True)
for i, d in enumerate(DIRS):
    x0, y0 = cx[i % 4], cy[i // 4]
    ys, xs = np.nonzero(ink[y0: cy[i // 4 + 1], x0: cx[i % 4 + 1]])
    box = (x0 + xs.min() - 8, y0 + ys.min() - 8, x0 + xs.max() + 9, y0 + ys.max() + 9)
    im.crop(box).save(src / "idle" / f"{d}.png")
    print(d, box[2] - box[0], box[3] - box[1])
