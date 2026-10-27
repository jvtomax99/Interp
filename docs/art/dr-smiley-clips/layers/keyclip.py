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
def matte(rgb, bg, lo=8, hi=24, near=20):
    d = np.abs(rgb - bg).sum(2); soft = np.clip((d - lo) / hi, 0, 1); bgm = d < near; lab, n = ndi.label(bgm)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    sizes = ndi.sum(bgm, lab, range(1, n + 1)); big = {i + 1 for i, s in enumerate(sizes) if s > 2000}   # an enclosed pool this big is wall (between the legs, under a raised arm)
    outside = np.isin(lab, list(edge | big)); inner = ndi.binary_erosion(~outside, iterations=1); return np.where(inner, 1.0, soft) * (~outside)
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
    for k in range(1, n + 1):
        hm = lab == k
        if np.abs(P[hm].mean(0) - bg).max() > 6: a[hm] = 1
    soft = (a > 0.02) & (a < 0.98); aa = np.clip(a[..., None], 0.02, 1)
    P = np.where(soft[..., None], np.clip((P - bg * (1 - aa)) / aa, 0, 255), P)   # the wall blended out of the edge
    hair = (yy < 220) & (a > 0); er = ndi.gaussian_filter(ndi.binary_erosion(a > .5, iterations=1).astype(float), .5)
    a = np.where(hair, np.minimum(a, er), a)                                      # the clip paints a light rim on the hair: its outline loses 1 px
    im = Image.fromarray(np.dstack([P, a * 255]).astype(np.uint8), 'RGBA').resize((320, 440), Image.LANCZOS)
    out = f'{OUT}/{i:04d}.webp'; im.save(out, quality=88, method=6); sizes.append(os.path.getsize(out))
print('frames', len(sizes), '30 fps %.2f MB' % (sum(sizes) / 1e6), '15 fps %.2f MB' % (sum(sizes[::2]) / 1e6))
