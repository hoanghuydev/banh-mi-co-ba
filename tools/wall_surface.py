"""Dựng lại bề mặt khối tường theo toạ độ trải phẳng: mép mỗi mặt và mép nắp dùng chung một texture tuần hoàn, dải gạch men nằm trên một lưới chung, nên ô nào cạnh ô nào cũng liền thành một khối."""
import zlib

import numpy as np

from wall_block import AXIS_X, K, LIFT, TH, TW, TOP_Y

FW = round(TW / 2 * K)          # bề rộng mặt (px ảnh)
FH = round(LIFT * K)            # chiều cao mặt
X0 = {"R": 250, "L": 58}        # cột đầu của mặt trong ảnh khối
COLS = 6
PITCH = FW / COLS
GRID_V = [36, 82, 128, 174]     # mạch ngang chuẩn, đo từ chân tường lên
GROUT = 3                       # nửa bề dày mạch
TRIM = 9                        # phần viền sát mép trên dải gạch tính từ mạch trên cùng
PLASTER_TOP = GRID_V[-1] + GROUT
SKIRT_TOP = GRID_V[0] - GROUT
CAP_RES = 384
FLAT_REACH = 20                 # nửa bề rộng cửa sổ làm trơn khi san tông
FACE_EXT = 16                   # px nới mép đứng ra ngoài ô: phần mờ sau khi thu nhỏ phải nằm hẳn trên mặt phẳng ô kề, không chạm gờ giữa của nó
CAP_EXT = 16                    # như trên cho hai cạnh sau của nắp

# các vùng giữ nguyên ảnh gốc (u0, u1, v0, v1) theo (khoá, mặt)
DETAIL = {
    ("prop_wall_window", "L"): [(20, 160, 230, 490)],
    ("prop_wall_rent", "L"): [(14, 182, 250, 505)],
    ("prop_wall_sale", "L"): [(16, 178, 255, 502)],
    ("prop_wall_notice", "L"): [(22, 176, 262, 502)],
    ("prop_wall_meter", "L"): [(30, 140, 178, 490)],
    ("prop_door", "L"): [(26, 176, 56, 528), (-10, 176, 0, 60)],
    ("prop_shop_shutter_half", "R"): [(20, 178, 0, 540)],
    ("prop_shop_shutter_closed", "R"): [(18, 186, 0, 540)],
    ("prop_shop_window_clothes", "R"): [(14, 176, 179, 490)],
    ("prop_shop_window_ac", "R"): [(6, 170, 130, 420)],
}


def _feet(side):
    u = np.arange(FW)
    return 749 - (u + 1) // 2 if side == "R" else 749 - (FW - u) // 2


def _grid(side, shape):
    v = np.arange(FH + 1)
    y = _feet(side)[None, :] - v[:, None]
    x = np.broadcast_to(X0[side] + np.arange(FW)[None, :], y.shape)
    return y, x, (y >= 0) & (y < shape[0])


def to_plane(a, side):
    """Mặt nghiêng của ảnh khối trải thẳng thành (v từ chân lên, u theo hàng tường)."""
    y, x, ok = _grid(side, a.shape)
    out = np.zeros((FH + 1, FW, a.shape[2]), a.dtype)
    out[ok] = a[y[ok], x[ok]]
    return out


def _smooth(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def _periodic(patch, axis):
    """Cắt ghép lệch nửa chu kỳ để hai đầu của `patch` nối liền nhau."""
    n = patch.shape[axis]
    w = np.abs(np.arange(n) - n / 2) / (n / 2)
    shape = [1, 1, 1]
    shape[axis] = n
    w = w.reshape(shape)
    return patch * (1 - w) + np.roll(patch, n // 2, axis=axis) * w


def _minima(profile, expected, reach=9):
    out = []
    for e in expected:
        lo, hi = max(int(e - reach), 0), min(int(e + reach) + 1, len(profile))
        out.append(lo + int(np.argmin(profile[lo:hi])))
    return out


class Resources:
    """Texture chung lấy từ ảnh tường trơn: vữa tuần hoàn, chân tường, ô gạch, nắp tuần hoàn."""

    def __init__(self, plain, plain_left):
        self.plaster, self.skirt, self.stamps, self.hlines = {}, {}, {}, {}
        for side, src in (("R", plain), ("L", plain_left)):
            e = to_plane(src, side).astype(float)
            self.plaster[side] = self._flat_field(_periodic(e[..., :3], 1))
            self.skirt[side] = self._skirt(self.plaster[side])
            self.stamps[side], self.hlines[side] = self._stamps(e[..., :3], side)
        self.cap = self._cap(plain.astype(float))

    @staticmethod
    def _flat_field(tex):
        """Bỏ dải sáng tối ngang mặt (rộng hơn ~40 px) của vữa chung, mỗi hàng về tông trung bình của nó: ô nào đứng cạnh ô nào cũng không có vạch ở mối nối."""
        low = sum(np.roll(tex, s, axis=1) for s in range(-FLAT_REACH, FLAT_REACH + 1)) / (2 * FLAT_REACH + 1)
        return tex * np.clip(low.mean(axis=1, keepdims=True) / np.maximum(low, 1), 0.8, 1.25)

    @staticmethod
    def _skirt(tex):
        """Chân tường; mấy hàng sát đáy bị viền tối khử răng cưa nên thay bằng hàng sạch phía trên."""
        out = tex.copy()
        out[:4] = tex[4]
        return out

    @staticmethod
    def _straight(e):
        """Mạch ngang của ảnh gốc hơi dốc và gợn; kéo từng cột để mọi mạch nằm đúng `GRID_V`."""
        blue = e[..., 2] - e[..., 0]
        us = np.arange(6, FW - 6, 4)
        fits = []
        for expect in GRID_V:
            pts = []
            for u in us:
                col = blue[:, u - 4:u + 5].mean(1)
                pts.append(_minima(col, [expect], 12)[0])
            coef = np.polyfit(us, pts, 2)
            keep = np.abs(np.polyval(coef, us) - pts) < 4
            fits.append(np.polyfit(us[keep], np.array(pts)[keep], 2))
        out = np.zeros_like(e)
        v = np.arange(FH + 1)
        for u in range(FW):
            knots = [np.polyval(c, u) for c in fits]
            src = np.interp(v, GRID_V, knots)
            src = np.where(v < GRID_V[0], knots[0] + (v - GRID_V[0]), src)
            src = np.where(v > GRID_V[-1], knots[-1] + (v - GRID_V[-1]), src)
            src = np.clip(src, 0, FH - 0.001)
            i = src.astype(int)
            f = (src - i)[:, None]
            out[:, u] = e[i, u] * (1 - f) + e[i + 1, u] * f
        return out

    @classmethod
    def _stamps(cls, e, side):
        e = cls._straight(e)
        blue = e[..., 2] - e[..., 0]
        col_prof = blue[GRID_V[0] + 8:GRID_V[-1] - 8].mean(0)
        guess = [35 + 33 * i for i in range(5)] if side == "R" else [28 + 32 * i for i in range(5)]
        cols = _minima(col_prof, guess)
        pool = []
        for r in range(3):
            lo, hi = GRID_V[r] - GROUT, GRID_V[r + 1] + GROUT
            cells = []
            for c in range(4):
                cell = e[lo:hi, cols[c] - GROUT:cols[c + 1] + GROUT]
                cells.append(_resize(cell, hi - lo, round(PITCH) + 2 * GROUT))
            cells = _register(cells, GRID_V[r + 1] - GRID_V[r])
            pool.append([x for cell in cells for x in (cell, cell[:, ::-1])])
        across = np.median(e, axis=1)
        hlines = [np.array([across[g + d] for d in range(-GROUT, TRIM if k == len(GRID_V) - 1 else GROUT + 1)]) for k, g in enumerate(GRID_V)]
        return pool, hlines

    @staticmethod
    def _cap(img):
        """Mặt trên trải thành ô vuông theo toạ độ thế giới, rồi làm tuần hoàn theo cả hai trục."""
        cx = AXIS_X * K
        cy = (TOP_Y + TH / 2) * K
        i, j = np.mgrid[0:CAP_RES, 0:CAP_RES] / CAP_RES - 0.5
        x = cx + (j - i) * FW
        y = cy + (j + i) * FW / 2
        tex = _sample(img[..., :3], x, y)
        return _periodic(_periodic(tex, 1), 0)


def _sample(img, x, y):
    x = np.clip(x, 0, img.shape[1] - 1.001)
    y = np.clip(y, 0, img.shape[0] - 1.001)
    x0, y0 = x.astype(int), y.astype(int)
    fx, fy = (x - x0)[..., None], (y - y0)[..., None]
    return (img[y0, x0] * (1 - fx) * (1 - fy) + img[y0, x0 + 1] * fx * (1 - fy)
            + img[y0 + 1, x0] * (1 - fx) * fy + img[y0 + 1, x0 + 1] * fx * fy)


def _register(cells, rise):
    """Gờ sáng sát mép trên của mỗi ô nằm lệch nhau 1-2 px; dịch phần trên từng ô để gờ cùng một hàng, mép trên dải gạch không có bậc."""
    lo, hi = rise - 16, rise - 2
    peaks = [lo + int(np.argmax(c[lo:hi, 8:-8].sum(2).mean(1))) for c in cells]
    target = int(np.median(peaks))
    out = []
    for c, pk in zip(cells, peaks):
        y = np.arange(c.shape[0])
        taper = _smooth((y - rise / 2) / (c.shape[0] - rise / 2))
        yy = np.clip(y + (pk - target) * taper, 0, c.shape[0] - 1.001)[:, None] * np.ones((1, c.shape[1]))
        xx = np.ones((c.shape[0], 1)) * np.arange(c.shape[1])[None, :]
        out.append(_sample(c, xx, yy))
    return out


def _resize(cell, h, w):
    yy = np.linspace(0, cell.shape[0] - 1.001, h)[:, None] * np.ones((1, w))
    xx = np.ones((h, 1)) * np.linspace(0, cell.shape[1] - 1.001, w)[None, :]
    return _sample(cell, xx, yy)


def _band(res, side, rng):
    """Dải gạch men: 6 cột × 3 hàng ô lấy ngẫu nhiên từ ô của tường trơn, mạch kẻ thẳng đúng lưới chung."""
    out = np.zeros((FH + 1, FW, 3))
    for r in range(3):
        pool = res.stamps[side][r]
        pick = rng.permutation(len(pool))[:COLS]
        lo = GRID_V[r] - GROUT
        for c, k in enumerate(pick):
            cell = pool[k]
            u0 = round(PITCH * c) - GROUT
            for du in range(cell.shape[1]):
                u = u0 + du
                if 0 <= u < FW:
                    out[lo:lo + cell.shape[0], u] = cell[:, du]
    for g, line in zip(GRID_V, res.hlines[side]):
        out[g - GROUT:g - GROUT + len(line)] = line[:, None, :]
    return out


def _plane_sample(tex, v, u):
    """Lấy mẫu song tuyến tính từ ảnh trải phẳng `tex` (hàng = v từ chân lên, cột = u); u ngoài mặt thì lặp vòng."""
    return _sample(tex, np.clip((u - 0.5) % FW, 0, FW - 1.001), np.clip(v, 0, FH - 0.001))


def _cover(t, lo, hi):
    """Độ phủ khử răng cưa của điểm ảnh nằm ở toạ độ `t` trong đoạn [lo, hi]."""
    return np.clip(t - lo + 0.5, 0, 1) * np.clip(hi - t + 0.5, 0, 1)


def _face_colour(a, side, key, res, rng):
    """Màu mới và độ phủ của một mặt, tính theo từng điểm ảnh của khối để đường chéo giữ khử răng cưa."""
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    u = xx - X0[side] + 0.5
    foot = 749 - 0.5 * u if side == "R" else 749 - 0.5 * (FW - u)
    v = foot - yy
    plaster = _plane_sample(res.plaster[side], v, u)
    band = _plane_sample(_band(res, side, rng), v, u)
    skirt = _plane_sample(res.skirt[side], v, u)
    sk = np.clip(SKIRT_TOP - v + 0.5, 0, 1)[..., None]
    bd = (np.clip(v - SKIRT_TOP + 0.5, 0, 1) * np.clip(PLASTER_TOP - v + 0.5, 0, 1))[..., None]
    out = skirt * sk + band * bd + plaster * np.clip(1 - sk - bd, 0, 1)
    for rect in DETAIL.get((key, side), []):
        u0, u1, v0, v1 = rect
        keep = (_smooth((u - u0) / 6) * _smooth((u1 - u) / 6) * _smooth((v - v0) / 6) * _smooth((v1 - v) / 6) * a[..., 3] / 255)[..., None]
        out = out * (1 - keep) + a[..., :3] * keep
    lo, hi = (-FACE_EXT, FW) if side == "L" else (0, FW + FACE_EXT)
    return out, _cover(u, lo, hi) * _cover(v, 0, FH)


def _cap_colour(a, res):
    cx = AXIS_X * K
    cy = (TOP_Y + TH / 2) * K
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    dx, dy = xx - cx, yy - cy
    X = (dx / FW + dy / (FW / 2)) / 2
    Y = (dy / (FW / 2) - dx / FW) / 2
    shared = _sample(res.cap, (X % 1.0) * CAP_RES, (Y % 1.0) * CAP_RES)
    dist = FW * np.minimum.reduce([X + 0.5 + CAP_EXT / FW, 0.5 - X, Y + 0.5 + CAP_EXT / FW, 0.5 - Y])
    cover = np.clip(dist + 0.5, 0, 1)
    return shared, cover


def build(sprite, key, res):
    """`sprite`: RGBA đã chuẩn hoá và san tông. Trả RGBA mới; chỉ đổi màu, giữ alpha."""
    a = np.array(sprite).astype(float)
    rng = np.random.default_rng(zlib.crc32(key.encode()))
    parts = [_face_colour(a, side, key, res, rng) for side in "LR"] + [_cap_colour(a, res)]
    total = sum(c for _, c in parts)
    mix = sum(col * c[..., None] for col, c in parts)
    ok = total > 0.02
    a[..., :3] = np.where(ok[..., None], mix / np.maximum(total, 1e-6)[..., None], a[..., :3])
    a[..., 3] = np.maximum(a[..., 3], np.clip(total, 0, 1) * 255)
    return np.clip(a, 0, 255).astype(np.uint8)
