# python3 -I checkclip.py <keyed folder> [strip.png]
# Checks every keyed frame of a clip (Jose, 2026-10-27: "make sure you don't make a mistake
# cropping him out") and prints what is wrong, frame by frame, or "clean":
#  - stray: a see-through-ish patch not joined to him (a piece of wall or shadow kept)
#  - hole: a see-through spot inside him (his coat or scrubs keyed as wall)
#  - cut: his shape touching the frame's left, right or bottom edge (part of him outside)
#  - rim: light pixels along his outline (the wall's grey or the clip's painted highlight)
#  - jump: a frame whose shape differs from the last by more than a move can (a bad key)
# A strip of every 15th frame on navy is written if a path is given.
import numpy as np, glob, os, sys
from PIL import Image
from scipy import ndimage as ndi
SRC = sys.argv[1]; fs = sorted(glob.glob(os.path.join(SRC, '*.webp')))
NAVY = np.array([37, 46, 109], float)
bad = {}; prev = None
def note(i, k, v): bad.setdefault(i, []).append(f'{k} {v}')
for i, f in enumerate(fs):
    im = np.asarray(Image.open(f).convert('RGBA'), dtype=float); a = im[..., 3] / 255; rgb = im[..., :3]
    m = a > .5
    lab, n = ndi.label(m); sz = ndi.sum(m, lab, range(1, n + 1))
    if n > 1:
        strays = sorted(sz)[:-1]
        if max(strays) > 12: note(i, 'stray', f'{int(max(strays))} px')
    holes = ndi.binary_fill_holes(m) & ~m
    lab, n = ndi.label(holes); hs = ndi.sum(holes, lab, range(1, n + 1)) if n else []
    if n and max(hs) > 6: note(i, 'hole', f'{int(max(hs))} px')
    ys, xs = np.where(m)
    if len(xs):
        if xs.min() <= 0 or xs.max() >= m.shape[1] - 1: note(i, 'cut', 'side')
        if ys.max() >= m.shape[0] - 1: note(i, 'cut', 'bottom')
        if ys.min() <= 0: note(i, 'cut', 'top')
    # the rim: soft edge pixels (alpha .2 to .9) that are light grey where what is inside
    # them is not (hair, skin, scrubs, shoes): the wall's grey kept, or a painted highlight.
    # The coat's own white edge is not a rim.
    edge = (a > .2) & (a < .9)
    grey = edge & (rgb.min(2) > 150) & (rgb.max(2) - rgb.min(2) < 18)
    solid = a > .95
    _, (iy, ix) = ndi.distance_transform_edt(~solid, return_indices=True)
    inner = rgb[iy, ix]
    rim = grey & ~((inner.min(2) > 170) & (inner.max(2) - inner.min(2) < 30))
    if rim.sum() > 40: note(i, 'rim', f'{int(rim.sum())} px')
    if prev is not None:
        diff = (m ^ prev).sum() / max(1, m.sum())
        if diff > .25: note(i, 'jump', f'{diff * 100:.0f}% of him')
    prev = m
if bad:
    for i, v in bad.items(): print(f'frame {i:4d}: ' + ', '.join(v))
    print(f'{len(bad)} of {len(fs)} frames flagged')
else: print(f'clean: {len(fs)} frames')
if len(sys.argv) > 2:
    sel = fs[::15]; w, h = Image.open(sel[0]).size
    o = Image.new('RGB', (w * len(sel), h), tuple(int(c) for c in NAVY))
    for k, f in enumerate(sel): im = Image.open(f).convert('RGBA'); o.paste(im, (k * w, 0), im)
    o.save(sys.argv[2])
