# python3 -I keyclip.py <folder of f0001.png...> <out folder>   (frames from: ffmpeg -i clip.mp4 f%04d.png)
# Key a clip's frames (grey wall) to see-through webp at 320 x 440: the master's matte, the
# floor and wall shadows dropped, holes in his coat filled (coat shading near the wall's grey
# keyed out: seen on the wave, 2026-10-27, Jose: "make sure you don't make a mistake cropping
# him out"), the wall blended out of the soft edge pixels, the hair's painted rim trimmed,
# only his one shape kept. Worked at half the master's size (535 x 735; the output is smaller
# still), four times quicker than full size. Check the result with checkclip.py.
import numpy as np, glob, os, sys
from PIL import Image
from scipy import ndimage as ndi
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
W, H = 535, 735; yy, xx = np.mgrid[0:H, 0:W]
def fit(im):
    im = im.resize((round(im.size[0] * H / im.size[1]), H), Image.LANCZOS); off = (im.size[0] - W) // 2; return im.crop((off, 0, off + W, H))
# A pool of wall-coloured pixels is the wall if it is thick (a gap between the legs or under an
# arm is 4 px or more across at this size; a shadowed seam of the coat is 2 or 3) and holds
# the wall's own colour. Thin wall-coloured strips inside him are him (the coat's shadowed
# front edge ran down to the collar at the wall's grey and, read as wall, cut a ragged
# see-through strip into the coat, 2026-10-27).
def wallpool(pm, P, bg): return ndi.distance_transform_edt(pm).max() >= 4 and np.abs(P[pm].mean(0) - bg).max() <= 6
def matte(rgb, bg, lo=8, hi=24, near=20):
    d = np.abs(rgb - bg).sum(2); soft = np.clip((d - lo) / hi, 0, 1); bgm = d < near
    core = ndi.binary_erosion(bgm, iterations=2)                       # strips thinner than 5 px drop out, so they never carry the outside in
    lab, n = ndi.label(core)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    out = np.isin(lab, list(edge))
    for k in range(1, n + 1):
        if k in edge: continue
        pm = lab == k
        if pm.sum() >= 40 and wallpool(bgm & ndi.binary_dilation(pm, iterations=2), rgb, bg): out |= pm
    outside = ndi.binary_dilation(out, iterations=2) & bgm                 # grown back to the wall's true edge, never into a strip
    inner = ndi.binary_erosion(~outside, iterations=1); return np.where(inner, 1.0, soft) * (~outside)
sizes = []
for i, f in enumerate(sorted(glob.glob(os.path.join(SRC, 'f*.png')))):
    P = np.asarray(fit(Image.open(f).convert('RGB')), dtype=float); P[:, :2] = P[:, 2:3]; P[:, -2:] = P[:, -3:-2]   # the clip's dark edge columns
    bg = np.median(P[10:60, 10:60].reshape(-1, 3), 0); a = matte(P, bg)
    blue = (P[..., 2] - P[..., 0]) > 22
    a[(yy > 575) & ~ndi.binary_dilation(blue & (yy > 575), iterations=2)] = 0      # the shadows on the floor and on the wall behind his calves: below the coat's hem only blue (trousers, shoes)
    m = a > .5; lab, n = ndi.label(m); sz = ndi.sum(m, lab, range(1, n + 1)); keep = lab == int(np.argmax(sz)) + 1
    a = np.where(ndi.binary_dilation(keep, iterations=1), a, 0)                   # his one shape; a stray patch of wall or shadow goes
    # holes: an enclosed see-through pool is a real gap only if it holds the wall's grey (seen
    # through); a pool of coat colour (shading near the wall's grey) is filled solid
    m = a > .5; holes = ndi.binary_fill_holes(m) & ~m; lab, n = ndi.label(holes)
    gaps = []
    for k in range(1, n + 1):
        hm = lab == k
        if not wallpool(hm, P, bg): a[hm] = 1
        else: gaps.append(int(hm.sum()))
    if gaps: print(f'  frame {i}: gaps kept (the wall seen through) {gaps}')
    # the edge, properly: a pixel along his outline is a mix of him and the wall, and how much
    # of each is read from its colour against the wall's and the colour 3 px inside him (the
    # matte's own alpha was too generous where he is dark against the wall: a pixel nine parts
    # wall and one part blue trouser counted as solid, and showed as a light rim down his legs
    # and shoes, checkclip.py's "rim"). Where he is nearly the wall's colour (the coat) the
    # matte's alpha stays.
    solid = ndi.binary_erosion(a > .5, iterations=3); band = (a > 0) & ~solid
    _, (iy, ix) = ndi.distance_transform_edt(~solid, return_indices=True); inner = P[iy, ix]
    v = inner - bg; vv = (v * v).sum(2); est = np.clip(((P - bg) * v).sum(2) / np.maximum(vv, 1), 0, 1)
    strong = band & (np.sqrt(vv) > 40)
    a = np.where(strong, np.minimum(a, est), a)
    soft = (a > 0.02) & (a < 0.98); aa = np.clip(a[..., None], 0.02, 1)
    P = np.where(soft[..., None], np.clip((P - bg * (1 - aa)) / aa, 0, 255), P)   # the wall blended out of the edge
    hair = (yy < 220) & (a > 0); er = ndi.gaussian_filter(ndi.binary_erosion(a > .5, iterations=1).astype(float), .5)
    a = np.where(hair, np.minimum(a, er), a)                                      # the clip paints a light rim on the hair: its outline loses 1 px
    im = Image.fromarray(np.dstack([P, a * 255]).astype(np.uint8), 'RGBA').resize((320, 440), Image.LANCZOS)
    out = f'{OUT}/{i:04d}.webp'; im.save(out, quality=88, method=6); sizes.append(os.path.getsize(out))
print('frames', len(sizes), '30 fps %.2f MB' % (sum(sizes) / 1e6), '15 fps %.2f MB' % (sum(sizes[::2]) / 1e6))
