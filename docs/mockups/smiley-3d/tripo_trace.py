"""Jose's drawn mouths traced (drsmiley/face.webp; Jose's pick 2026-10-22:
his 3D mouths follow the drawings, not curves made up here).

All 30 frames are drawn on one face, so they share one set of coordinates.
That face is tilted (his eyes are not level) and turned a little: the
tracings are levelled by the line between his eyes, then mapped so the drawn
resting mouth lands exactly on the 3D resting mouth (its corners and its
middle); every other mouth goes through the same mapping.

trace(name) -> {'line': (xs, zs)} for a closed mouth, {'open': (xs, tops, bots)}
for an open one, in metres on his face.
"""
import os, math
import numpy as np
import cv2
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
FRAMES = ['rest', 'blink1', 'blink2', 'shut', 'wink1', 'wink2', 'wink', 'smile1', 'smile2', 'smile', 'laugh1', 'laugh2', 'laugh',
          'laughB', 'lookL', 'lookR', 'love', 'sleep', 'halfL', 'halfR', 'lookU', 'lookD', 'lookUL', 'lookUR', 'lookDL', 'lookDR',
          'surprised', 'sad', 'worried', 'doubt']
FW, FH = 302, 222
_im = None


def frame(name):
    global _im
    if _im is None:
        _im = np.asarray(Image.open(os.path.join(HERE, '..', '..', '..', 'drsmiley', 'face.webp')).convert('RGBA')).astype(float)
    k = FRAMES.index(name)
    return _im[:, k * FW:(k + 1) * FW]


def tilt():
    """The drawing's tilt: the line between the eyes in the rest frame (wide open)."""
    f = frame('rest')
    white = ((f[..., :3].min(2) > 225) & (f[..., 3] > 200) & (np.arange(FH)[:, None] < 110)).astype(np.uint8)
    n, lab, st, c = cv2.connectedComponentsWithStats(white)
    (x0, y0), (x1, y1) = sorted(tuple(c[i]) for i in sorted(range(1, n), key=lambda i: -st[i, 4])[:2])
    return math.atan2(y1 - y0, x1 - x0)


def line_px(name):
    """A closed mouth's lip line: from the darkest point under the nose, followed
    left and right while it stays darker than the skin round it."""
    f = frame(name); lum = f[..., :3] @ [.3, .59, .11]; ok = f[..., 3] > 200
    def at(x, y_hint, span):
        lo, hi = max(150, y_hint - span), min(FH - 4, y_hint + span)
        col = np.where(ok[lo:hi, x], lum[lo:hi, x], 999.)
        y = lo + int(np.argmin(col))
        ring = lum[max(140, y - 14):y + 14, x][ok[max(140, y - 14):y + 14, x]]
        return y, (np.median(ring) - lum[y, x]) if len(ring) else 0
    x0 = 140; y0, _ = at(x0, 185, 30)
    pts = {x0: y0}
    for step in (-1, 1):
        x, y = x0, y0
        while 10 < x < FW - 10:
            x += step
            y2, c = at(x, y, 3)
            if c < 22:
                break
            pts[x] = y = y2
    xs = np.array(sorted(pts)); return xs, np.array([pts[x] for x in xs], float)


def open_px(name):
    """An open mouth: the dark inside and the teeth under the nose, top and bottom per column."""
    f = frame(name); lum = f[..., :3] @ [.3, .59, .11]
    m = ((lum < 150) | (f[..., :3].min(2) > 215)) & (f[..., 3] > 200)
    m[:150] = 0
    n, lab, st, c = cv2.connectedComponentsWithStats(m.astype(np.uint8))
    m = lab == 1 + np.argmax(st[1:, 4])
    xs = np.where(m.any(0))[0]
    return xs, np.array([np.nonzero(m[:, x])[0].min() for x in xs], float), np.array([np.nonzero(m[:, x])[0].max() for x in xs], float)


def level(xs, ys, a, c):
    """Rotate drawing points by -a about c; returns x right, z up (pixels)."""
    dx, dy = xs - c[0], ys - c[1]
    return dx * math.cos(a) + dy * math.sin(a), -(-dx * math.sin(a) + dy * math.cos(a))


def mapping(X, ZU, ZL, upper):
    """Drawing pixels -> metres on his face: the levelled drawn rest line's corners
    and middle onto the 3D resting line (zc = zu - upper * h)."""
    a = tilt()
    rx, ry = line_px('rest')
    c = (rx.mean(), ry.mean())
    lx, lz = level(rx, ry, a, c)
    zc = ZU - upper * (ZU - ZL)
    s = (X.max() - X.min()) / (lx.max() - lx.min())            # metres per pixel, one scale both ways
    xm3, xmd = (X.max() + X.min()) / 2, (lx.max() + lx.min()) / 2
    mid3 = float(np.interp(xm3, X, zc)); midd = float(np.interp(xmd, lx, lz))
    def to3d(xs, ys):
        u, v = level(np.asarray(xs, float), np.asarray(ys, float), a, c)
        return xm3 + (u - xmd) * s, mid3 + (v - midd) * s
    return to3d, s


def trace(name, X, ZU, ZL, upper):
    to3d, s = mapping(X, ZU, ZL, upper)
    if name == 'surprised':
        xs, top, bot = open_px(name)
        x3, t3 = to3d(xs, top); _, b3 = to3d(xs, bot)
        return {'open': (x3, t3, b3)}
    xs, ys = line_px(name)
    x3, z3 = to3d(xs, ys)
    return {'line': (x3, z3)}


if __name__ == '__main__':
    op = np.load(os.path.join(HERE, 'in', 'mouth-opening.npz'))
    from tripo_mouthtest import UPPER
    X, ZU, ZL = op['X'], op['ZU'], op['ZL']
    print('tilt', round(math.degrees(tilt()), 1), 'deg; mm per drawing px', round(mapping(X, ZU, ZL, UPPER)[1] * 1000, 3))
    for n in ('rest', 'sad', 'worried', 'surprised'):
        t = trace(n, X, ZU, ZL, UPPER)
        if 'line' in t:
            x, z = t['line']; print(n, 'width mm', round((x.max() - x.min()) * 1000, 1), 'x', x.min().round(4), x.max().round(4),
                                     'z ends', z[0].round(4), z[-1].round(4), 'mid', np.interp((x.min() + x.max()) / 2, x, z).round(4))
        else:
            x, tp, bt = t['open']; print(n, 'width mm', round((x.max() - x.min()) * 1000, 1), 'tallest mm', round((tp - bt).max() * 1000, 1),
                                         'x', x.min().round(4), x.max().round(4))
