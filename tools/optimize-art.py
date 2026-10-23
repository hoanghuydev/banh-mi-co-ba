#!/usr/bin/env python3
"""public/art/**/*.png -> .webp (lossy q95, alpha lossless); PNG gốc dời sang art-raw/_png/ để còn đường quay lại."""
import os
import shutil
import sys
from concurrent.futures import ProcessPoolExecutor

try:
    from PIL import Image
except ImportError:
    sys.exit("cần Pillow: python3 -m pip install --user Pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "art")
ARCHIVE = os.path.join(ROOT, "art-raw", "_png")

QUALITY = 95


def convert(png):
    rel = os.path.relpath(png, OUT)
    webp = os.path.splitext(png)[0] + ".webp"
    Image.open(png).convert("RGBA").save(webp, "WEBP", quality=QUALITY, alpha_quality=100, method=4)
    keep = os.path.join(ARCHIVE, rel)
    os.makedirs(os.path.dirname(keep), exist_ok=True)
    shutil.move(png, keep)
    return rel, os.path.getsize(keep), os.path.getsize(webp)


def main():
    pngs = sorted(os.path.join(d, f) for d, _, fs in os.walk(OUT) for f in fs if f.endswith(".png"))
    if not pngs:
        print("không còn PNG nào trong public/art")
        return
    before = after = 0
    with ProcessPoolExecutor() as pool:
        for rel, a, b in pool.map(convert, pngs):
            before += a
            after += b
            print(f"  {rel}  {a / 1024:.0f} KB -> {b / 1024:.0f} KB")
    print(f"{len(pngs)} file: {before / 1e6:.2f} MB -> {after / 1e6:.2f} MB")


if __name__ == "__main__":
    main()
