"""Chuẩn hoá ảnh khối tường 1 ô về đúng hình học game và cắt gờ vát để các ô liền nhau."""
import numpy as np
from PIL import Image

TW, TH = 60, 30
LIFT = 86
K = 6.4                     # px ảnh trên 1 px thiết kế
CANVAS_W, CANVAS_H = 78, 118
AXIS_X = CANVAS_W / 2
TOP_Y = 1
FRONT_Y = TOP_Y + TH        # đỉnh trước của mặt trên
FOOT_Y = FRONT_Y + LIFT     # đáy cạnh đứng trước
RIM = 5.0                   # bề dày gờ vát cần cắt (px ảnh)
OVERLAP = 1.2              # px ảnh nới ra mỗi bên
RIM_BAND = 12.0             # gạch ốp chân tường quấn góc nên cắt dày hơn


def measure(im):
    """Đỉnh trên, đỉnh trái hình thoi, đáy trục, mép trên dải gạch (quy về trục) tính bằng px nguồn."""
    a = np.array(im.getchannel("A")) > 40
    rgb = np.array(im.convert("RGB")).astype(int)
    ys, xs = np.where(a)
    y0 = ys.min()
    tops = np.array([np.where(a[:, x])[0].min() if a[:, x].any() else 9999 for x in range(a.shape[1])])
    xc = float(np.mean(np.where(tops <= y0 + 1)[0]))
    rows = range(y0 + 100, y0 + 220)
    lefts = np.array([np.where(a[y])[0].min() for y in rows])
    xl = float(lefts.min())
    yl = float(min(y for y, x in zip(rows, lefts) if x <= xl + 2))
    slope = (yl - y0) / (xc - xl)
    yf = y0 + 2 * (yl - y0)
    yb = float(np.where(a[:, int(round(xc))])[0].max())

    xb = int(xl + 16)
    col = rgb[:, xb]
    blue = col[:, 2] - col[:, 0] > 12
    start = int(yl + 60)
    yband = start + int(np.argmax(blue[start:]))
    yband_axis = yband + slope * (xc - xb)
    return dict(y0=y0, xc=xc, xl=xl, yl=yl, yf=yf, yb=yb, yband=yband_axis, slope=slope)


BAND_Y = FRONT_Y + 60       # mép trên dải gạch men chân tường, khớp `TILE_BAND` trong building.ts


def _remap(im, m):
    """Co từng dải hàng về đúng chiều cao khối, ngang theo nửa rộng; các dải chung một hệ số ngang nên cạnh đứng không gãy."""
    src = im.convert("RGBa")
    w, h = src.size
    sx = K * TW / 2 / (m["xc"] - m["xl"])
    knots = [(m["y0"], TOP_Y), (m["yf"], FRONT_Y), (m["yband"], BAND_Y), (m["yb"], FOOT_Y)]
    tail = (FOOT_Y - BAND_Y) / (m["yb"] - m["yband"])
    knots.append((float(h), FOOT_Y + (h - m["yb"]) * tail))
    out = Image.new("RGBa", (round(CANVAS_W * K), round(CANVAS_H * K)))
    ox = round(AXIS_X * K - m["xc"] * sx)
    for (s0, d0), (s1, d1) in zip(knots, knots[1:]):
        seg = src.resize((round(w * sx), max(1, round((d1 - d0) * K))), Image.LANCZOS, box=(0, s0, w, s1))
        out.paste(seg, (ox, round(d0 * K)))
    return out.convert("RGBA")


def _polys(ext=0.0):
    """Ba mặt của khối; `ext` nới hai mép đứng ngoài ra để hai ô kề nhau gối lên nhau, không hở khe."""
    cx = AXIS_X * K
    t, l, r, f = (cx, TOP_Y * K), (cx - TW / 2 * K, (TOP_Y + TH / 2) * K), (cx + TW / 2 * K, (TOP_Y + TH / 2) * K), (cx, FRONT_Y * K)
    d = LIFT * K
    l2, r2 = (l[0] - ext, l[1]), (r[0] + ext, r[1])
    left_face = [l2, f, (f[0], f[1] + d), (l2[0], l2[1] + d)]
    right_face = [f, r2, (r2[0], r2[1] + d), (f[0], f[1] + d)]
    return [t, l, f, r], left_face, right_face


def _mask(poly, size):
    m = Image.new("L", size, 0)
    from PIL import ImageDraw
    ImageDraw.Draw(m).polygon(poly, fill=255)
    return np.array(m) > 0


def _fill_down(px, inside):
    """Chỗ trống ở đáy khối (ảnh nguồn dốc hơn 0,5 nên đáy cao hơn chuẩn) kéo dài màu từ phía trên xuống, giữ dải chân tường đều."""
    for x in range(px.shape[1]):
        solid = np.where(inside[:, x] & (px[:, x, 3] >= 250))[0]
        if not len(solid):
            continue
        last = solid.max()
        rows = np.where(inside[:, x] & (np.arange(px.shape[0]) > last))[0]
        if len(rows):
            px[rows, x, :3] = px[max(last - 3, 0), x, :3]
            px[rows, x, 3] = 255
    return px


def _fill_gaps(rgba, inside):
    """Điểm trong khối mà ảnh còn trong suốt (góc bo) lấy màu lân cận, rồi đặt đục hẳn."""
    px = rgba.astype(float)
    for _ in range(40):
        gap = inside & (px[..., 3] < 128)
        if not gap.any():
            break
        ok = (px[..., 3] >= 128).astype(float)
        num = np.zeros_like(px[..., :3])
        den = np.zeros(ok.shape)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                num += np.roll(px[..., :3] * ok[..., None], (dy, dx), (0, 1))
                den += np.roll(ok, (dy, dx), (0, 1))
        sel = gap & (den > 0)
        px[sel, :3] = num[sel] / den[sel][:, None]
        px[sel, 3] = 255
    px[inside, 3] = 255
    return px


def _cut_rim(px, size, inside):
    """Gờ vát và góc gạch quấn ở hai cạnh đứng ngoài và hai cạnh sau của mặt trên được thay bằng ảnh lấy từ bên trong dọc theo chính mặt phẳng đó, để mặt chạy thẳng tới mép ô."""
    h, w = size[1], size[0]
    cx = AXIS_X * K
    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    src = px.copy()

    def take(sel, depth, strip, dx, dy):
        """Điểm cách mép `depth` lấy từ điểm đối xứng qua đường cách mép `strip`, đi theo hướng (dx, dy) có thành phần ngang 1 trên mỗi đơn vị cách."""
        off = 2 * strip[sel] - 2 * depth[sel]
        sy = np.clip(np.round(yy[sel] + dy * off).astype(int), 0, h - 1)
        sx = np.clip(np.round(xx[sel] + dx * off).astype(int), 0, w - 1)
        ok = inside[sy, sx]
        ys, xs = np.where(sel)
        px[ys[ok], xs[ok]] = src[sy[ok], sx[ok]]

    slope = TH / TW
    y_side0 = (TOP_Y + TH / 2) * K
    body = (yy >= y_side0) & (yy <= y_side0 + LIFT * K)
    band = yy >= (BAND_Y - TH / 2 - 1) * K
    strip = np.where(band, RIM_BAND, RIM)
    xl_e, xr_e = cx - TW / 2 * K, cx + TW / 2 * K
    dl, dr = xx - xl_e, xr_e - xx
    take(body & (dl >= -OVERLAP - 1) & (dl < strip), dl, strip, 1, slope)
    take(body & (dr >= -OVERLAP - 1) & (dr < strip), dr, strip, -1, slope)

    n = np.array([TH / 2, TW / 2]) / np.hypot(TH / 2, TW / 2)
    in_top = _mask(_polys()[0], (w, h))
    t = (cx, TOP_Y * K)
    d_l = (xx - t[0]) * n[0] + (yy - t[1]) * n[1]
    d_r = -(xx - t[0]) * n[0] + (yy - t[1]) * n[1]
    top_strip = np.full(d_l.shape, float(RIM))
    step = np.hypot(1, slope)
    ax, ay = np.array([1, slope]) / step / ((2 * slope) / step ** 2)   # đi dọc mặt trên để cách mép thêm 1 đơn vị vuông góc
    take(in_top & (xx <= cx) & (d_l < RIM), d_l, top_strip, ax, ay)
    take(in_top & (xx >= cx) & (d_r < RIM), d_r, top_strip, -ax, ay)
    return px


def normalise(im):
    im = im.convert("RGBA")
    m = measure(im)
    out = _remap(im, m)
    size = out.size
    top, lf, rf = _polys(OVERLAP)
    inside = _mask(top, size) | _mask(lf, size) | _mask(rf, size)
    px = _fill_gaps(_fill_down(np.array(out).astype(float), inside), inside)
    px = _cut_rim(px, size, inside)
    px = _fill_gaps(px, inside)
    return Image.fromarray(np.clip(px, 0, 255).astype(np.uint8), "RGBA")


def _plaster(px):
    """Màu vữa trung vị ở ba vùng ít chi tiết: nắp, dải sát mép trái, dải sát mép phải."""
    cx = int(AXIS_X * K)
    xr = cx + int(TW / 2 * K)
    return [np.median(px[130:190, cx - 20:cx + 20, :3].reshape(-1, 3), 0),
            np.median(px[160:420, 62:70, :3].reshape(-1, 3), 0),
            np.median(px[160:420, xr - 9:xr - 1, :3].reshape(-1, 3), 0)]


def recolor(im, ref):
    """Đưa màu vữa của `im` về màu vữa của `ref`; chỉ điểm ảnh gần màu vữa mới đổi nên kính, áo, khung cửa giữ nguyên."""
    px = np.array(im).astype(float)
    src, dst = _plaster(px), _plaster(np.array(ref).astype(float))
    top, lf, rf = _polys()
    size = im.size
    for poly, s, d, reach in zip((top, lf, rf), src, dst, (58, 40, 52)):
        near = np.linalg.norm(px[..., :3] - s, axis=2)
        wgt = np.clip((reach - near) / (reach * 0.55), 0, 1)
        warm = np.clip((px[..., 0] - px[..., 2] - 2) / 8, 0, 1)      # gạch men ngả xanh thì giữ
        wgt = wgt * wgt * (3 - 2 * wgt) * warm * _mask(poly, size)
        gain = d / s
        px[..., :3] = px[..., :3] * (1 + (gain - 1) * wgt[..., None])
    return Image.fromarray(np.clip(px, 0, 255).astype(np.uint8), "RGBA")
