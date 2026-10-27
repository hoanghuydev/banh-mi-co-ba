"""Review atlas NPC trước khi chốt: thiếu ô, frame lặp, lệch màu, lệch cỡ, chân lơ lửng, chân không đổi phiên; xuất ảnh soi bằng mắt.

  python3 .claude/skills/tao-npc-anh/scripts/kiem-atlas.py public/art/<ten>.json [anh-soi.png]

Thoát mã 1 nếu có lỗi. Sai hướng máy không đo tin được: soi từng hàng của ảnh soi (cột 1 = đứng im cùng hướng).
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

DIRS = ["s", "se", "e", "ne", "n", "nw", "w", "sw"]
WALK = 8
SAME = 5.0       # |Δ| trung bình dưới mức này là hai frame trông như một
MIN_SHAPES = 5   # số hình khác nhau tối thiểu trong 8 frame đi
MOTION = 16.0    # biên độ: |Δ| RGBA trung bình giữa frame liền kề ở cỡ 40×64 (anh Bảo 3D: 18,8–34); dưới mức này trong game trông như đứng yên
COLOR = 8.0      # lệch màu trung bình so với ảnh đứng im (0–255)
SIZE = 0.13      # lệch bề ngang đầu so với ảnh đứng im (anh Bảo 3D tới 8%, chú Đạt đã duyệt tới 12%)
FOOT = 0.05      # đáy chân lệch đáy chung, theo chiều cao ô (3D nhún tới 4%)
DUNG = 0.95      # cao đứng / trung vị cao đi (3D 1,00–1,02); thấp hơn là ảnh đứng lùn, đầu to hơn lúc đi
KHEP = 0.75      # độ dang chân ở 2 frame khép nhất của mẫu / ở 2 frame dang nhất (anh Bảo 0,36–0,45; lỗi chân không đổi phiên 0,80–1,03)
REF = Path(__file__).resolve().parents[4] / "public" / "art" / "anh-bao.json"


def load(path):
    meta = json.loads(Path(path).read_text())
    sheet = Image.open(Path(path).with_name(meta["meta"]["image"])).convert("RGBA")
    cells = {}
    for k, v in meta["frames"].items():
        f = v["frame"]
        cells[k] = sheet.crop((f["x"], f["y"], f["x"] + f["w"], f["y"] + f["h"]))
    return cells


def small(im):
    return np.asarray(im.resize((60, 96), Image.LANCZOS)).astype(float)


def diff(a, b):
    return float(np.abs(a - b).mean())


def mean_rgb(im):
    a = np.asarray(im).astype(float)
    m = a[..., 3] > 250
    return a[m][:, :3].mean(axis=0)


def head_w(im):
    """Trung vị bề ngang trong dải 10–25% trên: một mốc lẻ dễ rơi đúng vành nón hay búi tóc."""
    a = np.asarray(im)[..., 3] > 128
    ys = np.nonzero(a.any(axis=1))[0]
    t, b = ys[0], ys[-1]
    return float(np.median([a[t + int((b - t) * p)].sum() for p in np.linspace(0.10, 0.25, 16)]))


def spread(im):
    """Bề ngang vùng bàn chân (12% dưới cùng) chia chiều cao hình."""
    a = np.asarray(im)[..., 3] > 40
    ys = np.nonzero(a.any(axis=1))[0]
    t, b = ys[0], ys[-1]
    xs = np.nonzero(a[b - int((b - t) * 0.12): b + 1].any(axis=0))[0]
    return (xs[-1] - xs[0]) / (b - t)


def top_y(im):
    return int(np.nonzero((np.asarray(im)[..., 3] > 128).any(axis=1))[0][0])


def foot_y(im):
    return int(np.nonzero((np.asarray(im)[..., 3] > 128).any(axis=1))[0][-1])


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    cells = load(sys.argv[1])
    errs, warns, dung = [], [], []
    ref = load(REF)

    need = [f"idle_{d}_00" for d in DIRS] + [f"walk_{d}_{j:02d}" for d in DIRS for j in range(WALK)]
    miss = [k for k in need if k not in cells]
    if miss:
        sys.exit(f"THIẾU Ô: {', '.join(miss[:10])}{' …' if len(miss) > 10 else ''}")
    empty = [k for k in need if cells[k].getbbox() is None]
    errs += [f"{k}: ô trống" for k in empty]

    idle = {d: cells[f"idle_{d}_00"] for d in DIRS}
    base = foot_y(idle["s"])
    tol = FOOT * idle["s"].height

    for d in DIRS:
        fr = [cells[f"walk_{d}_{j:02d}"] for j in range(WALK)]
        fs = [small(f) for f in fr]
        # frame lặp: liền kề quá giống nhau, và số hình khác nhau trong cả vòng
        for j in range(WALK):
            dd = diff(fs[j], fs[(j + 1) % WALK])
            if dd < SAME:
                errs.append(f"walk_{d}: frame {j:02d}→{(j + 1) % WALK:02d} gần như trùng (Δ {dd:.1f})")
        tiny = [np.asarray(f.resize((40, 64), Image.LANCZOS)).astype(float) for f in fr]
        motion = float(np.mean([diff(tiny[j], tiny[(j + 1) % WALK]) for j in range(WALK)]))
        if motion < MOTION:
            errs.append(f"walk_{d}: biên độ {motion:.1f} < {MOTION} — ở cỡ game trông như đứng yên (chân bị che? dáng quá nhỏ?)")
        shapes = [j for j in range(WALK) if all(diff(fs[j], fs[k]) > SAME for k in range(j))]
        if len(shapes) < MIN_SHAPES:
            errs.append(f"walk_{d}: chỉ {len(shapes)} hình khác nhau / {WALK} (cần ≥ {MIN_SHAPES}) — thiếu pha chuyển tiếp?")
        # màu, cỡ, chân
        c0, h0 = mean_rgb(idle[d]), head_w(idle[d])
        dc = float(np.abs(np.mean([mean_rgb(f) for f in fr], axis=0) - c0).max())
        if dc > COLOR:
            errs.append(f"walk_{d}: màu lệch ảnh đứng im {dc:.1f}")
        for j, f in enumerate(fr):
            r = head_w(f) / h0
            if abs(r - 1) > SIZE:
                errs.append(f"walk_{d}_{j:02d}: đầu {r:.2f}× ảnh đứng im — lệch cỡ")
            if abs(foot_y(f) - base) > tol:
                errs.append(f"walk_{d}_{j:02d}: chân lệch đáy {foot_y(f) - base:+d}px — lơ lửng/lún")
        # s/n: hai chân chồng nhau theo bề ngang nên không đo được, chỉ soi mắt
        khep = ""
        if d not in ("s", "n"):
            rs = np.argsort([spread(ref[f"walk_{d}_{j:02d}"]) for j in range(WALK)])
            sp = np.array([spread(f) for f in fr])
            k = float(sp[rs[:2]].mean() / sp[rs[-2:]].mean())
            khep = f", khép chân {k:.2f}"
            if k > KHEP:
                warns.append(f"walk_{d}: khép chân {k:.2f} > {KHEP} — pha chuyển tiếp vẽ thành bước dài? soi soi-chan")
        hd = (foot_y(idle[d]) - top_y(idle[d])) / float(np.median([foot_y(f) - top_y(f) for f in fr]))
        dung.append(hd)
        print(f"{d:>2}: {len(shapes)} hình khác nhau, biên độ {motion:.1f}, màu lệch {dc:.1f}{khep}, cao đứng/đi {hd:.2f}")
    if np.mean(dung) < DUNG:
        errs.append(f"ảnh đứng lùn hơn lúc đi: cao đứng/đi trung bình {np.mean(dung):.3f} < {DUNG} — gen lại 8 hướng đứng theo tỉ lệ dải đi")
    for d in DIRS:
        if abs(foot_y(idle[d]) - base) > tol:
            errs.append(f"idle_{d}: chân lệch đáy {foot_y(idle[d]) - base:+d}px")

    if len(sys.argv) > 2:
        w, h = idle["s"].size
        out = Image.new("RGBA", ((WALK + 1) * w, 8 * h), (60, 60, 70, 255))
        dr = ImageDraw.Draw(out)
        for r, d in enumerate(DIRS):
            row = [idle[d]] + [cells[f"walk_{d}_{j:02d}"] for j in range(WALK)]
            for c, f in enumerate(row):
                out.alpha_composite(f, (c * w, r * h))
            dr.line([(0, r * h + base), (out.width, r * h + base)], fill=(255, 220, 0, 160))
            dr.text((3, r * h + 3), d, fill=(255, 255, 255, 255))
        out.convert("RGB").save(sys.argv[2])
        print(f"ảnh soi: {sys.argv[2]} (cột 1 = đứng im, vạch vàng = đáy chân)")
        # nền hồng tím phóng ×2: nền trắng sót ở khe tay–thân, nách, khe chân nổi hẳn lên
        keys = [f"idle_{d}_00" for d in DIRS] + [f"walk_{d}_{j:02d}" for d in ("s", "n") for j in (0, 4)]
        big = Image.new("RGBA", (4 * w * 2, (len(keys) // 4) * h * 2), (200, 0, 160, 255))
        for i, k in enumerate(keys):
            f = cells[k].resize((w * 2, h * 2), Image.NEAREST)
            big.alpha_composite(f, ((i % 4) * w * 2, (i // 4) * h * 2))
        to = Path(sys.argv[2]).with_name(Path(sys.argv[2]).stem + "-to.png")
        big.convert("RGB").save(to)
        print(f"ảnh soi khe: {to} (nền hồng tím ×2 — tìm mảng trắng/xám ở khe tay–thân, nách, khe chân)")
        # vùng chân phóng ×2, mỗi hướng: hàng mẫu anh Bảo rồi hàng nhân vật
        y0 = int(h * 0.55)
        legs = Image.new("RGBA", (WALK * w * 2, 16 * (h - y0) * 2), (200, 0, 160, 255))
        dr = ImageDraw.Draw(legs)
        for r, d in enumerate(DIRS):
            for k, src in enumerate((ref, cells)):
                for j in range(WALK):
                    f = src[f"walk_{d}_{j:02d}"]
                    f = f.crop((0, int(f.height * 0.55), f.width, f.height)).resize((w * 2, (h - y0) * 2), Image.LANCZOS)
                    legs.alpha_composite(f, (j * w * 2, (2 * r + k) * (h - y0) * 2))
                dr.text((4, (2 * r + k) * (h - y0) * 2 + 4), f"{d} {'mau' if k == 0 else 'NPC'}", fill=(255, 255, 255, 255))
        ch = Path(sys.argv[2]).with_name(Path(sys.argv[2]).stem + "-chan.png")
        legs.convert("RGB").save(ch)
        print(f"ảnh soi chân: {ch} (mỗi hướng: hàng mẫu rồi hàng NPC — chân trước phải đổi phiên như mẫu, frame khép chân phải khép)")

    if warns:
        print("\n".join(["CẢNH BÁO (soi -chan.png bằng mắt; mẫu lệch pha có thể báo oan):"] + warns))
    if errs:
        print("\n".join(["LỖI:"] + errs))
        sys.exit(1)
    print("ĐẠT")


if __name__ == "__main__":
    main()
