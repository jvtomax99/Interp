# python3 -I headtrack.py <clip folder in drsmiley/clips> [...]
# Where the clip's head is in every frame, so the app can put his own head there (Jose,
# 2026-10-28: the video tool redrew his face, and a clip starting read as a face switch;
# now the rig's head, with his 30 expressions, rides the clip's body and the clip's head
# stays under it). For each frame: the head's centre (x, y, in the frame's own pixels),
# written to head.json beside the frames as [[x, y], ...]. The head is found as the one
# blob of skin and hair. (A tilt from the pupils was tried and dropped: they hide when he
# looks aside or blinks, and the tilt swung 45 degrees in a wave.)
import numpy as np, glob, os, sys, json
from PIL import Image
from scipy import ndimage as ndi
def head_of(a):
    rgb = a[..., :3]; al = a[..., 3] > 128
    skin = al & (rgb[..., 0] > 150) & (rgb[..., 0] > rgb[..., 1] + 20) & (rgb[..., 1] > rgb[..., 2] - 5)
    hair = al & (rgb[..., 0] < 140) & (rgb[..., 0] > rgb[..., 2] + 10) & (rgb[..., 1] < 110)
    head = ndi.binary_fill_holes(ndi.binary_closing(skin | hair, iterations=4))
    lab, n = ndi.label(head); sz = ndi.sum(head, lab, range(1, n + 1)); head = lab == int(np.argmax(sz)) + 1
    # the eyes: dark (the pupils) inside the skin, below the hair
    dark = head & al & (rgb.max(2) < 70) & ndi.binary_erosion(ndi.binary_fill_holes(skin), iterations=3)
    lab, n = ndi.label(dark); tilt = 0.0
    if n >= 2:
        sz = ndi.sum(dark, lab, range(1, n + 1)); two = np.argsort(sz)[-2:] + 1
        c = [ndi.center_of_mass(dark, lab, k) for k in two]; (y1, x1), (y2, x2) = sorted(c, key=lambda p: p[1])
        if abs(x2 - x1) > 20: tilt = float(np.degrees(np.arctan2(y2 - y1, x2 - x1)))
    ys, xs = np.where(head)
    return [round(float(xs.mean()), 1), round(float(ys.mean()), 1), round(tilt, 2)]
for d in sys.argv[1:]:
    fs = sorted(glob.glob(os.path.join(d, '*.webp'))); out = []
    for f in fs: out.append(head_of(np.asarray(Image.open(f).convert('RGBA'), dtype=float)))
    # smooth the tilt over 5 frames (the pupils' dark spots jitter), the centre over 3
    o = np.array(out); o[:, 2] = ndi.uniform_filter1d(o[:, 2], 5, mode='nearest'); o[:, :2] = ndi.uniform_filter1d(o[:, :2], 3, axis=0, mode='nearest')
    out = [[round(float(v), 1) for v in row] for row in o]
    json.dump([r[:2] for r in out], open(os.path.join(d, 'head.json'), 'w'))
    xs, ys, ts = o[:, 0], o[:, 1], o[:, 2]
    print(f'{d}: {len(fs)} frames, head x {xs.min():.0f}-{xs.max():.0f} y {ys.min():.0f}-{ys.max():.0f} tilt {ts.min():.1f} to {ts.max():.1f}')
