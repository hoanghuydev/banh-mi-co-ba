#!/usr/bin/env python3
"""Dựng thử ánh sáng cảnh quán ở cỡ màn 27" QHD: nắng qua lá, bóng đổ, AO, phản chiếu sàn bóng. Dùng: python3 tools/light-demo.py after|before"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERE = os.path.join(ROOT, "art-raw", "_duyet", "anh-sang-demo")
ART = os.path.join(ROOT, "public", "art")
RAW = os.path.join(ROOT, "art-raw", "_duyet")
TILE_SRC = os.path.join(RAW, "gach_men", "final.png")
LEAF_SRC = os.path.join(RAW, "tan_la", "final.png")

S = 3.2
TW, TH = 60 * S, 30 * S
N = 7
SUN_K = float(os.environ.get("SUN_K", "0.45"))
MODE = sys.argv[1] if len(sys.argv) > 1 else "after"
REFL_NEAR = float(os.environ.get("REFL_NEAR", "0.34"))
REFL_FAR = float(os.environ.get("REFL_FAR", "0.07"))
HD = os.environ.get("HD", "1") == "1"
TAG = os.environ.get("TAG", "demo")

MATTE_FROM_V = 5.0
M = 160
W = int(N * TW + 2 * M)
OX = W / 2
OY = 300
H = int(OY + N * TH + 6 * S + 80)

TONE = np.array([0xf2, 0xec, 0xe6]) / 255.0
AMB = np.array([0.88, 0.82, 0.88], np.float32)
SUN = np.array([0.20, 0.20, 0.12], np.float32)
AO_COL = np.array([0.45, 0.42, 0.55], np.float32)


def f32(im):
    return np.asarray(im.convert("RGB"), dtype=np.float32) / 255.0


def to_img(a):
    return Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8))


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def blur_arr(a, r):
    return np.asarray(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)),
                      dtype=np.float32) / 255.0


def bilinear(tex, x, y):
    th, tw = tex.shape[:2]
    x0 = np.clip(np.floor(x).astype(int), 0, tw - 2)
    y0 = np.clip(np.floor(y).astype(int), 0, th - 2)
    fx = (x - x0)[..., None]
    fy = (y - y0)[..., None]
    return (tex[y0, x0] * (1 - fx) * (1 - fy) + tex[y0, x0 + 1] * fx * (1 - fy)
            + tex[y0 + 1, x0] * (1 - fx) * fy + tex[y0 + 1, x0 + 1] * fx * fy)


def world_grid(w, h, ss=1):
    X, Y = np.meshgrid(np.arange(w * ss, dtype=np.float32) / ss, np.arange(h * ss, dtype=np.float32) / ss)
    a, b = (X - OX) / (TW / 2), (Y - OY) / (TH / 2)
    return (a + b) / 2, (b - a) / 2


def floor_albedo(U, V):
    tile = f32(Image.open(TILE_SRC))
    cell = tile.shape[0] / 4.0
    out = np.zeros(U.shape + (3,), np.float32)
    iu, iv = np.floor(U).astype(int), np.floor(V).astype(int)
    fu, fv = U - iu, V - iv
    pick = (iu * 7 + iv * 13) % 4
    for p in range(4):
        m = pick == p
        if m.any():
            out[m] = bilinear(tile, (1 + p % 2 + fu[m]) * cell, (1 + p // 2 + fv[m]) * cell)
    return out


def leaf_field(U, V, period=6.0):
    g = np.asarray(Image.open(LEAF_SRC).convert("L").filter(ImageFilter.GaussianBlur(1.2)), dtype=np.float32) / 255.0
    lo, hi = np.percentile(g, 2), np.percentile(g, 98)
    g = np.clip((g - lo) / (hi - lo), 0, 1)
    size = g.shape[0]
    tu = np.abs(((U / period) % 2) - 1) * (size - 2)
    tv = np.abs(((V / period) % 2) - 1) * (size - 2)
    return smooth((bilinear(g[..., None].repeat(3, 2), tu, tv)[..., 0] - 0.36) / 0.38)


def load_sprite(old, h_design, hd_dir):
    path = os.path.join(RAW, hd_dir, "final-Photoroom.png")
    if HD and os.path.exists(path):
        im = Image.open(path).convert("RGBA")
        box = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
        im = im.crop(box)
        src = hd_dir
    else:
        im = Image.open(os.path.join(ART, old)).convert("RGBA")
        src = old
    h = round(h_design * S)
    w = round(im.width * h / im.height)
    out = im.resize((w, h), Image.LANCZOS)
    rgb = out.convert("RGB").filter(ImageFilter.UnsharpMask(radius=1.1, percent=70, threshold=2))
    rgb.putalpha(out.getchannel("A"))
    return rgb, src, im.size


def ground_profile(alpha):
    """Đường chạm đất = bao lõm trên của đáy từng cột; phần mái nhô ra ngoài chân thì kéo dài đường đáy theo độ dốc của nó."""
    a = np.asarray(alpha) > 128
    h, w = a.shape
    has = a.any(0)
    cols = np.nonzero(has)[0]
    raw = np.where(has, h - 1 - np.argmax(a[::-1], axis=0), -10 ** 6).astype(np.float32)
    hull = []
    for x in cols:
        p = (float(x), float(raw[x]))
        while len(hull) >= 2:
            (x0, y0), (x1, y1) = hull[-2], hull[-1]
            if (x1 - x0) * (p[1] - y0) - (y1 - y0) * (p[0] - x0) >= 0:
                hull.pop()
            else:
                break
        hull.append(p)
    hx, hy = zip(*hull)
    g = np.interp(np.arange(w), hx, hy).astype(np.float32)
    flat = np.abs(np.gradient(g)) < 0.9
    sup = np.nonzero(has & flat & (raw >= g - 3))[0]
    if sup.size == 0:
        xs0 = np.arange(w, dtype=np.float32)
        return (raw[None, :] - 0.5 * np.abs(xs0[:, None] - xs0[None, :])).max(axis=1).astype(np.float32)
    lo, hi = int(sup.min()), int(sup.max())
    span = max(4, min(12, (hi - lo) // 2))
    sl_l = (g[lo + span] - g[lo]) / span
    sl_r = (g[hi] - g[hi - span]) / span
    xs = np.arange(w, dtype=np.float32)
    g = np.where(xs < lo, g[lo] + sl_l * (xs - lo), g)
    g = np.where(xs > hi, g[hi] + sl_r * (xs - hi), g)
    return g.astype(np.float32)


def project(alpha_img, k):
    """Mỗi điểm ảnh ở độ cao z so với chân cột của nó → điểm chạm đất của tia nắng (x − 2kz, by + kz)."""
    al = np.asarray(alpha_img, dtype=np.float32) / 255.0
    h, w = al.shape
    by = ground_profile(alpha_img)
    ys, xs = np.nonzero(al > 0.03)
    z = np.maximum(0.0, by[xs] - ys).astype(np.float32)
    dx = xs - 2 * k * z
    dy = by[xs] + k * z
    return xs, ys, z, dx, dy, al[ys, xs], by


def cast_shadow(alpha_img, k):
    xs, ys, z, dx, dy, a, by = project(alpha_img, k)
    h, w = np.asarray(alpha_img).shape
    padx = int(2 * k * h) + 3
    ho = int(h + k * h) + 3
    m = np.zeros((ho, w + padx + 2), np.float32)
    t = np.zeros_like(m)
    tz = np.clip(z / max(1.0, h * 0.85), 0, 1)
    ix = np.round(dx).astype(int) + padx
    iy = np.round(dy).astype(int)
    for ox in (0, 1):
        for oy in (0, 1):
            np.maximum.at(m, (iy + oy, ix + ox), a)
            np.maximum.at(t, (iy + oy, ix + ox), tz)
    close = lambda arr: np.asarray(Image.fromarray((arr * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)),
                                   dtype=np.float32) / 255.0
    return close(m), close(t), padx


def diamond_mask(cx, cy, hw, hh, blur):
    im = Image.new("L", (W, H), 0)
    ImageDraw.Draw(im).polygon([(cx, cy - hh), (cx + hw, cy), (cx, cy + hh), (cx - hw, cy)], fill=255)
    return np.asarray(im.filter(ImageFilter.GaussianBlur(blur)), dtype=np.float32) / 255.0


def light_sprite(spr, k, x0, y0, vis):
    """Nắng qua lá lên vật: điểm ở độ cao z nhìn ánh sáng tại điểm chạm đất của tia nắng, như bóng đổ."""
    rgb = np.asarray(spr.convert("RGB"), dtype=np.float32) / 255.0
    al = spr.getchannel("A")
    xs, ys, z, dx, dy, a, by = project(al, k)
    cx = np.clip(np.round(dx + x0).astype(int), 0, W - 1)
    cy = np.clip(np.round(dy + y0).astype(int), 0, H - 1)
    v = np.zeros(rgb.shape[:2], np.float32)
    v[ys, xs] = vis[cy, cx]
    v = blur_arr(v, 0.6)[..., None]
    shade = np.array([0.68, 0.72, 0.88], np.float32)
    warm = np.array([1.06, 1.02, 0.94], np.float32)
    out = rgb * (shade * (1 - v) + warm * v)
    res = to_img(out).convert("RGBA")
    res.putalpha(al)
    return res


def reflection(spr, side_frac, near, far):
    """Mặt bên của vật lật qua đường chạm đất; mặt trên không hiện trong gương nên cắt bỏ."""
    rgb = np.asarray(spr.convert("RGB"), dtype=np.float32) / 255.0
    al = np.asarray(spr.getchannel("A"), dtype=np.float32) / 255.0
    h, w = al.shape
    g = ground_profile(spr.getchannel("A"))
    hs = int(side_frac * h)
    rows = h + hs + 2
    ref_rgb = np.zeros((rows, w, 3), np.float32)
    ref_a = np.zeros((rows, w), np.float32)
    src_rows = np.arange(h, dtype=np.float32)
    for x in range(w):
        gx = float(g[x])
        if gx < 0 or gx >= h:
            continue
        r = np.arange(int(gx) + 1, min(rows, int(gx) + hs + 2), dtype=np.float32)
        s_row = 2 * gx - r
        ok = (s_row >= 0) & (s_row <= gx) & (s_row >= gx - hs)
        r, s_row = r[ok].astype(int), s_row[ok]
        for c in range(3):
            ref_rgb[r, x, c] = np.interp(s_row, src_rows, rgb[:, x, c])
        d = (r - gx) / max(1, hs)
        ref_a[r, x] = np.interp(s_row, src_rows, al[:, x]) * (near + (far - near) * np.clip(d, 0, 1))
    soft = blur_arr(ref_a, 2.4)
    k = np.clip(0.3 + 0.7 * np.arange(rows, dtype=np.float32)[:, None] / (h + hs), 0, 1)
    ref_a = ref_a * (1 - k) + soft * k
    return ref_rgb, ref_a


def main():
    U, V = world_grid(W, H)
    inside = (U >= 0) & (U < N) & (V >= 0) & (V < N)

    Us, Vs = world_grid(W, H, 2)
    ins = (Us >= 0) & (Us < N) & (Vs >= 0) & (Vs < N)
    alb_s = np.zeros(Us.shape + (3,), np.float32)
    alb_s[ins] = floor_albedo(Us[ins], Vs[ins])
    alb = np.asarray(to_img(alb_s).resize((W, H), Image.LANCZOS), dtype=np.float32) / 255.0
    alb = 1 - (1 - alb) * 0.65
    shiny = np.where(V < MATTE_FROM_V, 1.0, 0.0).astype(np.float32)
    alb = np.where((shiny < 0.5)[..., None], alb * np.array([0.95, 0.62, 0.52], np.float32), alb)
    del alb_s, Us, Vs, ins

    yy = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
    img = np.zeros((H, W, 3), np.float32)
    img[:] = np.array([0.20, 0.24, 0.29], np.float32) * (1.1 - 0.25 * yy)
    avg = np.array([0.90, 0.86, 0.76], np.float32)
    for dy in range(int(6 * S)):
        sh = np.roll(inside, dy + 1, axis=0) & ~inside
        left = sh & (U - V < 0)
        img[left] = avg * 0.62
        img[sh & ~left] = avg * 0.80

    objects = [
        dict(name="cabinet", old="prop_shelf.webp", hd="tu_kinh_hd", h=78, dy=14, u=2.5, v=2.5, fw=1.0, fh=0.9, side=0.64),
        dict(name="sink", old="prop_sink.webp", hd="sink_hd", h=58, dy=10, u=1.3, v=4.0, fw=0.35, fh=0.35, side=0.85),
        dict(name="bin2", old="prop_bin.webp", hd="thung_rac_hd", h=46, dy=10, u=4.6, v=5.6, fw=0.62, fh=0.62, side=0.62),
        dict(name="bin", old="prop_bin.webp", hd="thung_rac_hd", h=46, dy=10, u=4.6, v=3.6, fw=0.62, fh=0.62, side=0.62),
    ]
    objects.sort(key=lambda o: o["u"] + o["v"])
    for o in objects:
        spr, src, srcsize = load_sprite(o["old"], o["h"], o["hd"])
        sx_c = OX + (o["u"] - o["v"]) * TW / 2
        sy_c = OY + (o["u"] + o["v"]) * TH / 2
        o.update(spr=spr, src=src, srcsize=srcsize, x=sx_c, foot=sy_c + o["dy"] * S)
        o["x0"] = int(round(sx_c - spr.width / 2))
        o["y0"] = int(round(o["foot"] - spr.height))

    if MODE == "before":
        alpha = np.zeros((H, W), np.float32)
        img[inside] = alb[inside]
        place_all(img, objects, {o["name"]: o["spr"] for o in objects})
        finish(img, objects, lit=False)
        return

    gobo = leaf_field(U, V)
    patch = (smooth((U - 3.0) / 0.5) * (1 - smooth((U - 5.9) / 0.6))
             * smooth((V - 0.2) / 0.5) * (1 - smooth((V - 6.6) / 0.4)))
    sunny = gobo * (0.50 + 0.50 * patch)

    cast = np.zeros((H, W), np.float32)
    ao = np.zeros((H, W), np.float32)
    for o in objects:
        spr = o["spr"]
        m, t, padx = cast_shadow(spr.getchannel("A"), SUN_K)
        soft = blur_arr(m, 5 * S)
        mid = blur_arr(m, 2 * S)
        base = blur_arr(m, 0.45 * S)
        tt = np.clip(t, 0, 1)
        sh = base * np.clip(1 - tt * 2, 0, 1) + mid * (1 - np.abs(tt * 2 - 1)) + soft * np.clip(tt * 2 - 1, 0, 1)
        sh = sh * (0.97 - 0.30 * tt)
        c = np.zeros((H, W), np.float32)
        x0, y0 = o["x0"] - padx, o["y0"]
        ys0, xs0 = max(0, y0), max(0, x0)
        ys1, xs1 = min(H, y0 + sh.shape[0]), min(W, x0 + sh.shape[1])
        c[ys0:ys1, xs0:xs1] = sh[ys0 - y0:ys1 - y0, xs0 - x0:xs1 - x0]
        cast = np.maximum(cast, c)
        fp_hh = o["fh"] * TH / 2
        ao = np.maximum(ao, diamond_mask(o["x"], o["foot"] - fp_hh, o["fw"] * TW / 2 * 1.3, fp_hh * 1.3,
                                         0.12 * TW * o["fw"]))

    vis = sunny * (1 - cast)
    amb = AMB[None, None, :] * (1 - 0.42 * cast[..., None]) * (1 - 0.75 * ao[..., None] * (1 - AO_COL[None, None, :]))
    sun = SUN[None, None, :] * vis[..., None]
    gloss = (0.10 * shiny * (np.clip(vis * patch, 0, 1) ** 1.5))[..., None] * np.array([1.0, 0.97, 0.90], np.float32)
    lit = alb * (amb + sun) + gloss
    img[inside] = lit[inside]

    lit_sprites = {}
    for o in objects:
        lit_sprites[o["name"]] = light_sprite(o["spr"], SUN_K, o["x0"], o["y0"], vis)

    for o in objects:
        ref_rgb, ref_a = reflection(lit_sprites[o["name"]], o["side"], REFL_NEAR, REFL_FAR)
        x0, y0 = o["x0"], o["y0"]
        h, w = ref_a.shape
        ys1, xs1 = min(H, y0 + h), min(W, x0 + w)
        reg = np.s_[y0:ys1, x0:xs1]
        mm = (ref_a[:ys1 - y0, :xs1 - x0] * inside[reg] * shiny[reg])[..., None]
        img[reg] = img[reg] * (1 - mm) + ref_rgb[:ys1 - y0, :xs1 - x0] * mm

    place_all(img, objects, lit_sprites)
    finish(img, objects, lit=True)


def place_all(img, objects, sprites):
    for o in objects:
        spr = sprites[o["name"]]
        sa = np.asarray(spr.getchannel("A"), dtype=np.float32)[..., None] / 255.0
        sr = np.asarray(spr.convert("RGB"), dtype=np.float32) / 255.0
        x0, y0 = o["x0"], o["y0"]
        x1, y1 = min(W, x0 + spr.width), min(H, y0 + spr.height)
        xs, ys = max(0, x0), max(0, y0)
        a = sa[ys - y0:y1 - y0, xs - x0:x1 - x0]
        img[ys:y1, xs:x1] = img[ys:y1, xs:x1] * (1 - a) + sr[ys - y0:y1 - y0, xs - x0:x1 - x0] * a


def finish(img, objects, lit):
    if lit:
        xx = (np.arange(W, dtype=np.float32) - W / 2) / (W / 2)
        yv = (np.arange(H, dtype=np.float32) - H / 2) / (H / 2)
        vg = 1 - 0.10 * np.clip(xx[None, :] ** 2 + yv[:, None] ** 2, 0, 1.5)
        img *= TONE * vg[..., None]
    out = to_img(img)
    name = "%s_%s.png" % (TAG, MODE)
    out.save(os.path.join(HERE, name))
    print(name, out.size)
    for o in objects:
        print(o["name"], "nguồn", o["src"], o["srcsize"], "→ trên màn", o["spr"].size)


if __name__ == "__main__":
    main()
