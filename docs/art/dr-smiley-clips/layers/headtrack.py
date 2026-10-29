# python3 -I headtrack.py <folder of keyed frames, the head still on> [...]
# Where the clip's head is in every frame, so the app can put his own head there (Jose,
# 2026-10-28: the video tool redrew his face, and a clip starting read as a face switch;
# now the rig's head, with his 30 expressions, rides the clip's body). For each frame: the
# head's centre (x, y, in the frame's own pixels) to head.json as [[x, y], ...], and its
# tilt (degrees) and size (against the first frame) to head-pose.json as [[tilt, scale], ...].
#
# The head is followed by his HAIR alone (2026-10-29, Jose: "he glitches"; the first tracker
# took the blob of skin and hair for the head, so a hand at his chin, a thumb beside his
# face or a fist passing his head joined the blob: the head's centre slid 12 px, its tilt
# jumped to 16 degrees, and behead.py cut the hand off with the head, so hands vanished and
# came back). The hair is rigid, dark, and nothing passes in front of it; its centroid moves
# with the head, its principal axis (image moments) turns with it, and its area grows with
# it. The first frame (the master's pose) fixes the head's centre against the hair (the
# blob of skin and hair is clean there); every other frame places the centre from the hair.
# Frames where the hair's area or box departs from its neighbours (something over it) are
# dropped and bridged. Smoothed over 3 frames (the tilt over 5). Run BEFORE behead.py.
import numpy as np, glob, os, sys, json
from PIL import Image
from scipy import ndimage as ndi
def masks(a):
    rgb = a[..., :3]; al = a[..., 3] > 128
    skin = al & (rgb[..., 0] > 150) & (rgb[..., 0] > rgb[..., 1] + 20) & (rgb[..., 1] > rgb[..., 2] - 5)
    hair = al & (rgb[..., 0] < 140) & (rgb[..., 0] > rgb[..., 2] + 10) & (rgb[..., 1] < 110)
    return skin, hair
def biggest(m):
    lab, n = ndi.label(m)
    if not n: return m
    sz = ndi.sum(m, lab, range(1, n + 1)); return lab == int(np.argmax(sz)) + 1
def hair_of(a):
    skin, hair = masks(a)
    h = biggest(ndi.binary_fill_holes(ndi.binary_closing(hair, iterations=3)))
    ys, xs = np.where(h); cx, cy = xs.mean(), ys.mean()
    # the principal axis from the second moments (the hair is wider than tall, so it holds)
    dx, dy = xs - cx, ys - cy; sxx, syy, sxy = (dx * dx).mean(), (dy * dy).mean(), (dx * dy).mean()
    ang = 0.5 * np.degrees(np.arctan2(2 * sxy, sxx - syy))
    return dict(c=(cx, cy), ang=ang, area=float(h.sum()), box=(xs.min(), xs.max(), ys.min(), ys.max()), skin=skin, hair=h)
def head0_of(a, H):
    # the first frame's head: the blob of skin and hair (clean in the master's pose)
    skin, hair = masks(a)
    head = biggest(ndi.binary_fill_holes(ndi.binary_closing(skin | hair, iterations=4)))
    ys, xs = np.where(head); return (xs.mean(), ys.mean()), head
def track(fs):
    a0 = np.asarray(Image.open(fs[0]).convert('RGBA'), dtype=float); H0 = hair_of(a0); (hx0, hy0) = H0['c']; (cx0, cy0), _ = head0_of(a0, H0)
    v0 = np.array([cx0 - hx0, cy0 - hy0])              # the head's centre against the hair, at rest
    rows = []
    for f in fs:
        H = hair_of(np.asarray(Image.open(f).convert('RGBA'), dtype=float))
        rows.append([H['c'][0], H['c'][1], H['ang'], H['area'], H['box'][1] - H['box'][0], H['box'][3] - H['box'][2]])
    o = np.array(rows)
    # tilt against the first frame, unwrapped to the nearest turn (the axis is a line, so +-90 is the same)
    t = o[:, 2] - o[0, 2]; t = (t + 90) % 180 - 90
    sc = np.sqrt(o[:, 3] / o[0, 3])
    # a frame whose hair is not the hair: its area or box off its neighbours' running median, or a wild tilt
    med = lambda v: ndi.median_filter(v, 9, mode='nearest')
    bad = (np.abs(o[:, 3] / med(o[:, 3]) - 1) > 0.08) | (np.abs(o[:, 4] / med(o[:, 4]) - 1) > 0.08) | (np.abs(o[:, 5] / med(o[:, 5]) - 1) > 0.10) | (np.abs(t - med(t)) > 8)
    bad[0] = False
    idx = np.arange(len(fs)); good = ~bad
    cols = []
    for v in (o[:, 0], o[:, 1], t, sc):
        cols.append(np.interp(idx, idx[good], v[good]) if bad.any() else v)
    hx, hy, t, sc = cols
    # the head's centre: the hair's centroid plus the rest offset, turned by the tilt and sized
    r = np.radians(t); cx = hx + sc * (np.cos(r) * v0[0] - np.sin(r) * v0[1]); cy = hy + sc * (np.sin(r) * v0[0] + np.cos(r) * v0[1])
    cx = ndi.uniform_filter1d(cx, 3, mode='nearest'); cy = ndi.uniform_filter1d(cy, 3, mode='nearest')
    t = ndi.uniform_filter1d(t, 5, mode='nearest')
    # the size from the hair's area breathes with a turn or a blur (a 5% dip at the hop's top): smoothed wide and never below 0.97
    sc = np.clip(ndi.uniform_filter1d(sc, 9, mode='nearest'), 0.97, 1.12)
    return cx, cy, t, sc, bad
if __name__ == '__main__':
    for d in sys.argv[1:]:
        fs = sorted(glob.glob(os.path.join(d, '*.webp'))); cx, cy, t, sc, bad = track(fs)
        json.dump([[round(float(x), 1), round(float(y), 1)] for x, y in zip(cx, cy)], open(os.path.join(d, 'head.json'), 'w'))
        json.dump([[round(float(a), 2), round(float(b), 3)] for a, b in zip(t, sc)], open(os.path.join(d, 'head-pose.json'), 'w'))
        print(f'{d}: {len(fs)} frames, head x {cx.min():.0f}-{cx.max():.0f} y {cy.min():.0f}-{cy.max():.0f} tilt {t.min():+.1f} to {t.max():+.1f} scale {sc.min():.2f} to {sc.max():.2f}, bridged {int(bad.sum())} frames {np.where(bad)[0].tolist()[:30]}')
