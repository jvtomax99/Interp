# python3 -I keyclip.py <folder of f0001.png...> <out folder>   (frames from: ffmpeg -i clip.mp4 f%04d.png)
# Key a clip's frames (grey wall) to see-through webp at 320 x 440, on the master's grid
# (1070 x 1470, full size: at half size the coat's shadowed front edge averaged into the
# wall's grey over a wide strip, 2026-10-27). What is wall: the grey reached from the
# picture's edge, through pools thick enough to be a gap (thin grey strips inside him, the
# coat's shadowed seams, never carry it in), plus an enclosed pool only if it is plainly the
# wall seen through (flat, the wall's own colour, wide); every other enclosed pool is him.
# Along his outline each pixel's alpha is read from where its colour sits between the wall
# and the colour inside him. The floor and wall shadows go, the hair's painted rim is
# trimmed, only his one shape is kept. Check the result with checkclip.py (Jose, 2026-10-27:
# "make sure you don't make a mistake cropping him out").
import numpy as np, glob, os, sys
from PIL import Image
from scipy import ndimage as ndi
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
W, H = 1070, 1470; yy, xx = np.mgrid[0:H, 0:W]
def fit(im):
    im = im.resize((round(im.size[0] * H / im.size[1]), H), Image.LANCZOS); off = (im.size[0] - W) // 2; return im.crop((off, 0, off + W, H))
# The wall seen through a gap in him is flat (its spread about 1.4), its own colour and wide;
# the coat's shadowed front edge, enclosed, is as grey but varies (2.2 to 4) and is thinner.
def seen_through(pm, P, bg):
    return pm.sum() >= 300 and ndi.distance_transform_edt(pm).max() >= 8 and P[pm].std(0).mean() <= 1.8 and np.abs(P[pm].mean(0) - bg).max() <= 3
def matte(rgb, bg, lo=8, hi=24, near=20):
    d = np.abs(rgb - bg).sum(2); soft = np.clip((d - lo) / hi, 0, 1); bgm = d < near
    core = ndi.binary_erosion(bgm, iterations=3)                       # strips thinner than 7 px drop out, so they never carry the outside in
    lab, n = ndi.label(core)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    out = np.isin(lab, list(edge))
    for k in range(1, n + 1):
        if k in edge: continue
        pm = bgm & ndi.binary_dilation(lab == k, iterations=3)
        if seen_through(pm, rgb, bg): out |= pm
    outside = ndi.binary_dilation(out, iterations=3) & bgm                 # grown back to the wall's true edge, never into a strip
    inner = ndi.binary_erosion(~outside, iterations=2); return np.where(inner, 1.0, soft) * (~outside)
sizes = []
for i, f in enumerate(sorted(glob.glob(os.path.join(SRC, 'f*.png')))):
    P = np.asarray(fit(Image.open(f).convert('RGB')), dtype=float); P[:, :4] = P[:, 4:5]; P[:, -4:] = P[:, -5:-4]   # the clip's dark edge columns
    bg = np.median(P[20:120, 20:120].reshape(-1, 3), 0); a = matte(P, bg)
    blue = (P[..., 2] - P[..., 0]) > 22
    a[(yy > 1150) & ~ndi.binary_dilation(blue & (yy > 1150), iterations=3)] = 0   # the shadows on the floor and on the wall behind his calves: below the coat's hem only blue (trousers, shoes)
    m = a > .5; lab, n = ndi.label(m); sz = ndi.sum(m, lab, range(1, n + 1)); keep = lab == int(np.argmax(sz)) + 1
    a = np.where(ndi.binary_dilation(keep, iterations=2), a, 0)                   # his one shape; a stray patch of wall or shadow goes
    # an enclosed see-through pool is him unless it is plainly the wall seen through
    m = a > .5; holes = ndi.binary_fill_holes(m) & ~m; lab, n = ndi.label(holes); gaps = []
    for k in range(1, n + 1):
        hm = lab == k
        if seen_through(hm, P, bg): gaps.append(int(hm.sum()))
        else: a[hm] = 1
    if gaps: print(f'  frame {i}: gaps kept (the wall seen through) {gaps}')
    # the edge: a pixel along his outline is a mix of him and the wall; how much of each is read
    # from its colour against the wall's and the colour inside him (the matte's own alpha was too
    # generous where he is dark against the wall, and a light rim ran down his legs and shoes)
    solid = ndi.binary_erosion(a > .5, iterations=5); band = (a > 0) & ~solid
    _, (iy, ix) = ndi.distance_transform_edt(~solid, return_indices=True); inner = P[iy, ix]
    v = inner - bg; vv = (v * v).sum(2); est = np.clip(((P - bg) * v).sum(2) / np.maximum(vv, 1), 0, 1)
    strong = band & (np.sqrt(vv) > 40)
    a = np.where(strong, np.minimum(a, est), a)
    soft = (a > 0.02) & (a < 0.98); aa = np.clip(a[..., None], 0.02, 1)
    P = np.where(soft[..., None], np.clip((P - bg * (1 - aa)) / aa, 0, 255), P)   # the wall blended out of the edge
    hair = (yy < 440) & (a > 0); er = ndi.gaussian_filter(ndi.binary_erosion(a > .5, iterations=2).astype(float), .8)
    a = np.where(hair, np.minimum(a, er), a)                                      # the clip paints a light rim on the hair: its outline loses 2 px
    im = Image.fromarray(np.dstack([P, a * 255]).astype(np.uint8), 'RGBA').resize((320, 440), Image.LANCZOS)
    out = f'{OUT}/{i:04d}.webp'; im.save(out, quality=88, method=6); sizes.append(os.path.getsize(out))
print('frames', len(sizes), '30 fps %.2f MB' % (sum(sizes) / 1e6), '15 fps %.2f MB' % (sum(sizes[::2]) / 1e6))
