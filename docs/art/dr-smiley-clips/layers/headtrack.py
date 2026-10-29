# python3 -I headtrack.py <clip folder in drsmiley/clips> [...]
# Where the clip's head is in every frame, so the app can put his own head there (Jose,
# 2026-10-28: the video tool redrew his face, and a clip starting read as a face switch;
# now the rig's head, with his 30 expressions, rides the clip's body and the clip's head
# stays under it). For each frame: the head's centre (x, y, in the frame's own pixels),
# written to head.json beside the frames as [[x, y], ...]. The head is found as the one
# blob of skin and hair. Also head-pose.json: [[tilt deg, scale], ...] per frame, the head's
# tilt from where the hair sits against the head's centre (the hair's top is a clear landmark
# on every frame; the pupils were tried first and hide when he looks aside or blinks) and its
# size against the first frame, both smoothed over 5 frames. Run BEFORE behead.py (it needs
# the clip's head); behead.py refreshes head.json only.
import numpy as np, glob, os, sys, json
from PIL import Image
from scipy import ndimage as ndi
def head_of(a):
    rgb = a[..., :3]; al = a[..., 3] > 128
    skin = al & (rgb[..., 0] > 150) & (rgb[..., 0] > rgb[..., 1] + 20) & (rgb[..., 1] > rgb[..., 2] - 5)
    hair = al & (rgb[..., 0] < 140) & (rgb[..., 0] > rgb[..., 2] + 10) & (rgb[..., 1] < 110)
    head = ndi.binary_fill_holes(ndi.binary_closing(skin | hair, iterations=4))
    lab, n = ndi.label(head); sz = ndi.sum(head, lab, range(1, n + 1)); head = lab == int(np.argmax(sz)) + 1
    ys, xs = np.where(head); cx, cy = xs.mean(), ys.mean()
    hy, hx = np.where(hair & head)
    tilt = float(np.degrees(np.arctan2(hx.mean() - cx, cy - hy.mean()))) if len(hx) else 0.0
    return [round(float(cx), 1), round(float(cy), 1), round(tilt, 2), float(head.sum()) ** .5]
for d in sys.argv[1:]:
    fs = sorted(glob.glob(os.path.join(d, '*.webp'))); out = []
    for f in fs: out.append(head_of(np.asarray(Image.open(f).convert('RGBA'), dtype=float)))
    # smooth the tilt over 5 frames (the pupils' dark spots jitter), the centre over 3
    o = np.array(out); o[:, :2] = ndi.uniform_filter1d(o[:, :2], 3, axis=0, mode='nearest')
    t = ndi.uniform_filter1d(o[:, 2] - o[0, 2], 5, mode='nearest'); sc = ndi.uniform_filter1d(o[:, 3] / o[0, 3], 5, mode='nearest')
    json.dump([[round(float(r[0]), 1), round(float(r[1]), 1)] for r in o], open(os.path.join(d, 'head.json'), 'w'))
    json.dump([[round(float(a), 2), round(float(b), 3)] for a, b in zip(t, sc)], open(os.path.join(d, 'head-pose.json'), 'w'))
    print(f'{d}: {len(fs)} frames, head x {o[:, 0].min():.0f}-{o[:, 0].max():.0f} y {o[:, 1].min():.0f}-{o[:, 1].max():.0f} tilt {t.min():+.1f} to {t.max():+.1f} scale {sc.min():.2f} to {sc.max():.2f}')
