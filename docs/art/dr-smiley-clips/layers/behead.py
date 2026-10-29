# python3 -I behead.py <keyed clip folder, head on> <out folder (drsmiley/clips/<move>)>
# Take the clip's head off every frame, so his own head rides a body with nothing to peek
# out around it (Jose, 2026-10-28: "the head and body don't fit": the clip's head is drawn
# about 10% bigger than his, its hair 13 px higher, and showed as a fringe around his own).
# The cut is ONE SHAPE, the first frame's head (the blob of skin and hair in the master's
# pose, everything above 10 px under its chin, plus a 3 px margin), carried to each frame
# by the head track (head.json, head-pose.json from headtrack.py: moved, turned and sized
# with the hair), and feathered 2 px so the neck stub blends. Not the frame's own blob
# (2026-10-29, Jose: "he glitches": a hand at his chin, a thumb by his face or a fist
# passing his head had joined the blob and was cut off with it, so hands vanished and came
# back). A hand over the head's shape is cut there, and reads as behind his head. Writes
# the frames to the out folder with the two tracks copied beside them; the keyed frames
# stay where they were (in git before the beheading too: commit 93c1d5f).
import numpy as np, glob, os, sys, json, shutil
from PIL import Image
from scipy import ndimage as ndi
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from headtrack import masks, biggest   # (-I leaves the script folder off the path)
src, dst = sys.argv[1], sys.argv[2]; os.makedirs(dst, exist_ok=True)
FILL = 20   # rows of the cut, above its bottom in each column, filled with the collar under it
SPAN = 38   # and only within this many columns of the head's centre (the neck and the scrubs' V)
fs = sorted(glob.glob(os.path.join(src, '*.webp')))
head = json.load(open(os.path.join(src, 'head.json'))); pose = json.load(open(os.path.join(src, 'head-pose.json')))
a0 = np.asarray(Image.open(fs[0]).convert('RGBA'), dtype=float); skin, hair = masks(a0)
h0 = biggest(ndi.binary_fill_holes(ndi.binary_closing(skin | hair, iterations=4)))
ys, xs = np.where(h0); c0 = np.array([xs.mean(), ys.mean()])
mid = h0[:, int(c0[0]) - 15:int(c0[0]) + 15]; chin = int(np.where(mid.any(1))[0].max())
T = h0.copy(); T[chin - 10:] = False; T = ndi.binary_dilation(T, iterations=3).astype(float)   # the shape, in the first frame's place
for i, f in enumerate(fs):
    a = np.asarray(Image.open(f).convert('RGBA'), dtype=float)
    (cx, cy), (tilt, sc) = head[i], pose[i]
    # the shape carried to this frame: for each output pixel, where it came from in the first frame
    r = np.radians(tilt); R = np.array([[np.cos(r), -np.sin(r)], [np.sin(r), np.cos(r)]]) * sc
    Minv = np.linalg.inv(R)                                     # output -> input, about the centres (arrays are [y, x])
    M = np.array([[Minv[1, 1], Minv[1, 0]], [Minv[0, 1], Minv[0, 0]]])
    off = np.array([c0[1], c0[0]]) - M @ np.array([cy, cx])
    cut = ndi.affine_transform(T, M, offset=off, order=1, mode='constant', cval=0.0)
    soft = ndi.gaussian_filter(np.clip(cut, 0, 1), 1.5); alpha = a[..., 3] * (1 - soft)
    out = a.copy(); out[..., 3] = alpha
    # the collar carried up behind the head (2026-10-29): the clip's head is bigger than his, so where its jaw sat over
    # the collar and the scrubs' V, taking it off left a hole beside his own chin when the clip's head dipped (the wince,
    # measured on a flat banner: a wedge of background at the V). The lowest FILL rows of the cut, in each column, take
    # the colour of the first solid pixel under the cut (the collar, the lapel, the neck band) with the frame's own alpha,
    # so the coat stands up behind his head instead of a gap; his head covers all of it but the edge.
    hard = soft > 0.02; H, W = hard.shape          # the cut with its feather: the half-clear seam along the lapel showed the background too
    for x in np.where(hard.any(0))[0]:
        if abs(x - cx) > SPAN: continue                        # only the neck's columns: wider, the lapel stood up as a white tab beside his cheek
        rows = np.where(hard[:, x])[0]; bottom = rows.max()
        below = np.where(a[bottom + 1:min(H, bottom + 8), x, 3] > 128)[0]
        if not len(below): continue
        px = a[bottom + 1 + below[0], x]
        lo = max(rows.min(), bottom - FILL + 1); band = rows[rows >= lo]
        out[band, x, :3] = px[:3]; out[band, x, 3] = a[band, x, 3]
    Image.fromarray(out.astype(np.uint8), 'RGBA').save(os.path.join(dst, os.path.basename(f)), quality=88, method=4)   # method 6 took 2 s a frame for the same size; 4 takes 0.02
for j in ('head.json', 'head-pose.json'): shutil.copy(os.path.join(src, j), os.path.join(dst, j))
print(f'{src} -> {dst}: {len(fs)} frames beheaded with one shape (chin row {chin}, centre {c0.round(1).tolist()})')
