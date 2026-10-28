# python3 -I behead.py <clip folder in drsmiley/clips> [...]
# Take the clip's head off every frame, so his own head rides a body with nothing to peek
# out around it (Jose, 2026-10-28: "the head and body don't fit": the clip's head is drawn
# about 10% bigger than his, its hair 13 px higher, and showed as a fringe around his own).
# The head is the blob of skin and hair found by headtrack.py; everything of it above the
# chin line goes, plus a 3 px margin, and the cut is feathered 2 px so the neck stub blends.
# Below the chin the skin of the neck stays for his head to sit on. Writes the frames in
# place (keep a copy of the keyed clip in the scratchpad to redo), and refreshes head.json.
import numpy as np, glob, os, sys, json
from PIL import Image
from scipy import ndimage as ndi
def head_mask(a):
    rgb = a[..., :3]; al = a[..., 3] > 128
    skin = al & (rgb[..., 0] > 150) & (rgb[..., 0] > rgb[..., 1] + 20) & (rgb[..., 1] > rgb[..., 2] - 5)
    hair = al & (rgb[..., 0] < 140) & (rgb[..., 0] > rgb[..., 2] + 10) & (rgb[..., 1] < 110)
    head = ndi.binary_fill_holes(ndi.binary_closing(skin | hair, iterations=4))
    lab, n = ndi.label(head); sz = ndi.sum(head, lab, range(1, n + 1)); head = lab == int(np.argmax(sz)) + 1
    return head, skin
for d in sys.argv[1:]:
    fs = sorted(glob.glob(os.path.join(d, '*.webp'))); track = []
    for f in fs:
        im = Image.open(f).convert('RGBA'); a = np.asarray(im, dtype=float)
        head, skin = head_mask(a); ys, xs = np.where(head)
        cx, cy = xs.mean(), ys.mean(); track.append([round(float(cx), 1), round(float(cy), 1)])
        # the chin: the head blob's lowest row at its middle columns; the neck is the skin below it
        mid = head[:, int(cx) - 15:int(cx) + 15]; rows = np.where(mid.any(1))[0]; chin = int(rows.max())
        # the hands (skin too) are not the head: only the blob itself, and only above the chin
        cut = head.copy(); cut[chin - 10:] = False                    # keep 10 px of chin and neck under where his head's chin sits (so no gap at the collar)
        cut = ndi.binary_dilation(cut, iterations=3)
        soft = ndi.gaussian_filter(cut.astype(float), 1.5); alpha = a[..., 3] * (1 - soft)
        out = a.copy(); out[..., 3] = alpha
        Image.fromarray(out.astype(np.uint8), 'RGBA').save(f, quality=88, method=6)
    o = np.array(track); o = ndi.uniform_filter1d(o, 3, axis=0, mode='nearest')
    json.dump([[round(float(v), 1) for v in r] for r in o], open(os.path.join(d, 'head.json'), 'w'))
    print(f'{d}: {len(fs)} frames beheaded')
