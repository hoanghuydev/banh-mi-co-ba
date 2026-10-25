"""Ảnh ChatGPT -> frame rời cho tools/pack-atlas.py.

  python3 .claude/skills/tao-npc-anh/scripts/ghep-npc.py art-raw/_duyet/<ten> <ten-atlas>

Đọc <thư mục>/8huong.png (2 hàng × 4: s se e ne / n nw w sw), <thư mục>/walk/<h>.png (4 pha bước, mẫu frame 1,3,5,7)
và <thư mục>/walk-chan/<h>.png (4 pha chuyển tiếp, mẫu frame 0,2,4,6); ghi art-raw/render/<ten-atlas>/idle/<h>_00.png
và walk/<h>_00..07.png xen kẽ chẵn = chuyển tiếp, lẻ = bước.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[4]
DIRS = ["s", "se", "e", "ne", "n", "nw", "w", "sw"]
CANVAS = (360, 520)  # ô chung, chân đặt tại FOOT_Y
FOOT_Y = 500
WHITE = 236


def cut_alpha(im):
    """Nền = vùng gần trắng nối với mép ảnh, cộng các lỗ trắng kín to (khe tay–thân)."""
    rgb = np.asarray(im.convert("RGB")).astype(np.int16)
    mn = rgb.min(axis=2)
    m = Image.fromarray(np.where(mn >= WHITE, 255, 0).astype(np.uint8)).copy()
    w, h = m.size
    for xy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if m.getpixel(xy) == 255:
            ImageDraw.floodfill(m, xy, 128)
    a = np.asarray(m)
    bg = a == 128
    # lỗ kín: nửa dưới (khe chân) xoá cả lỗ nhỏ, nửa trên chỉ lỗ to để giữ lòng trắng mắt
    hole = Image.fromarray(np.where(a == 255, 255, 0).astype(np.uint8)).copy()
    B = 2
    hb = np.asarray(hole)[: h // B * B, : w // B * B].reshape(h // B, B, w // B, B).min(axis=(1, 3)) == 255
    for by, bx in zip(*np.nonzero(hb)):
        y, x = int(by * B), int(bx * B)
        if hole.getpixel((x, y)) != 255:
            continue
        ImageDraw.floodfill(hole, (x, y), 128)
        comp = np.asarray(hole) == 128
        n = comp.sum()
        if (n > 400 and mn[comp].mean() >= 250) or (n > 8 and np.nonzero(comp)[0].mean() > h * 0.6):
            bg |= comp
        ImageDraw.floodfill(hole, (x, y), 64)
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    # viền mềm: pixel sát nền lấy alpha theo độ "không trắng"
    near = np.asarray(Image.fromarray(alpha).filter(ImageFilter.MinFilter(5))) < 255
    soft = np.clip((255 - mn) * 255 / (255 - 200), 0, 255).astype(np.uint8)
    alpha = np.where(near & ~bg, np.minimum(255, soft), alpha)
    # gỡ màu trắng lẫn ở viền
    af = alpha[..., None] / 255.0
    col = np.where(af > 0.05, (rgb - (1 - af) * 255) / np.maximum(af, 0.05), rgb)
    out = np.dstack([np.clip(col, 0, 255).astype(np.uint8), alpha])
    return Image.fromarray(out, "RGBA")


def split(rgba, n):
    """Tách n nhân vật theo cột trống."""
    a = np.asarray(rgba)[..., 3] > 40
    cols = a.any(axis=0)
    runs, x = [], 0
    while x < len(cols):
        if cols[x]:
            s = x
            while x < len(cols) and cols[x]:
                x += 1
            runs.append((s, x))
        x += 1
    runs = sorted(runs, key=lambda r: r[1] - r[0], reverse=True)[:n]
    if len(runs) != n:
        raise SystemExit(f"tach duoc {len(runs)} khung, can {n}")
    out = []
    for s, e in sorted(runs):
        c = rgba.crop((s, 0, e, rgba.height))
        out.append(c.crop(c.getbbox()))
    return out


def stats(im):
    a = np.asarray(im).astype(float)
    m = a[..., 3] > 250
    return a[m][:, :3].mean(axis=0), a[m][:, :3].std(axis=0)


def head_w(im):
    """Bề ngang đầu (15% trên cùng): thước đo cỡ không đổi theo dáng chân."""
    a = np.asarray(im)[..., 3] > 128
    top = a[: max(1, int(im.height * 0.15))]
    return np.median(top.sum(axis=1)[-5:])


def shift(im, off):
    a = np.asarray(im).astype(float)
    a[..., :3] += off
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA")


def place(im, height):
    """Co theo chiều cao, căn giữa theo khối thân, đặt chân lên FOOT_Y."""
    im = im.resize((round(im.width * height / im.height), height), Image.LANCZOS)
    a = np.asarray(im)[..., 3].astype(float)
    cx = (a.sum(axis=0) * np.arange(im.width)).sum() / a.sum()
    cv = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    cv.alpha_composite(im, (round(CANVAS[0] / 2 - cx), FOOT_Y - height))
    return cv


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    src, out = Path(sys.argv[1]), ROOT / "art-raw" / "render" / sys.argv[2]
    sheet = cut_alpha(Image.open(src / "8huong.png"))
    w, h = sheet.size
    idle = {}
    for i, d in enumerate(DIRS):
        cell = sheet.crop((i % 4 * w // 4, i // 4 * h // 2, (i % 4 + 1) * w // 4, (i // 4 + 1) * h // 2))
        idle[d] = cell.crop(cell.getbbox())
    scale = 440 / max(im.height for im in idle.values())
    for d in DIRS:
        hi = round(idle[d].height * scale)
        p = out / "idle" / f"{d}_00.png"
        p.parent.mkdir(parents=True, exist_ok=True)
        place(idle[d], hi).save(p)
        steps = split(cut_alpha(Image.open(src / "walk" / f"{d}.png")), 4)
        between = split(cut_alpha(Image.open(src / "walk-chan" / f"{d}.png")), 4)
        # đầu và chiều cao cho hai tỉ lệ lệch nhau (ChatGPT vẽ thân hơi khác giữa các lượt): lấy trung bình nhân
        by_head = head_w(idle[d]) / np.median([head_w(f) for f in steps])
        by_height = 0.98 * idle[d].height / np.median([f.height for f in steps])
        k_steps = (by_head * by_height) ** 0.5
        # pha chuyển tiếp nhún cao hơn pha bước chừng 2%; đầu và chiều cao lệch nhau nên lấy trung bình nhân
        k_head = k_steps * np.median([head_w(f) for f in steps]) / np.median([head_w(f) for f in between])
        k_tall = k_steps * 1.02 * np.median([f.height for f in steps]) / np.median([f.height for f in between])
        k_between = (k_head * k_tall) ** 0.5
        heights = []
        for j in range(8):
            strip, k = (between, k_between) if j % 2 == 0 else (steps, k_steps)
            # một độ bù chung cả dải: kéo màu về ảnh đứng im mà frame trong dải vẫn đều nhau
            off = stats(idle[d])[0] - np.mean([stats(f)[0] for f in strip], axis=0)
            f = strip[j // 2]
            hj = round(f.height * k * scale)
            q = out / "walk" / f"{d}_{j:02d}.png"
            q.parent.mkdir(parents=True, exist_ok=True)
            place(shift(f, off), hj).save(q)
            heights.append(hj)
        print(d, "idle", hi, "walk", heights)

if __name__ == "__main__":
    main()
