# Redraws the nurse's face features as crisp shapes in the drawing's style, at 4x, over a cleaned skin.
# python3 vecface.py drawing-screen.png out.png   (1200x2400 screen space)
import sys, math, numpy as np
from PIL import Image, ImageDraw, ImageFilter
src, out = sys.argv[1], sys.argv[2]
d = Image.open(src).convert('RGBA'); a = np.asarray(d).astype(np.float32)
X0, Y0, X1, Y1 = 300, 680, 900, 1140; K = 4
# 1. erase the soft features: inpaint skin where the pixel is not skin-like
reg = a[Y0:Y1, X0:X1]; rgb = reg[..., :3]; al = reg[..., 3] > 128
yy0, xx0 = np.mgrid[0:Y1-Y0, 0:X1-X0]; inner0 = ((xx0 - 310) / 300) ** 2 + ((yy0 - 240) / 220) ** 2 < 1
cand = inner0 & al & (rgb.mean(-1) > 120) & (rgb.min(-1) < 200) & (rgb[..., 0] > rgb[..., 2] + 40)
skin = np.median(rgb[cand], axis=0); print('drawing skin', skin.round())
dist = np.linalg.norm(rgb - skin, axis=-1)
white = (rgb.min(-1) > 205) & (rgb.max(-1) - rgb.min(-1) < 35)
irisish = np.linalg.norm(rgb - np.array([105, 52, 26], np.float32), axis=-1) < 70
eyefeat = ((rgb.mean(-1) < 110) | white | irisish) & al
softfeat = ((dist > 34) | (rgb.mean(-1) < 150)) & al
feat_eye = np.asarray(Image.fromarray((eyefeat * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))) > 0
feat_soft = np.asarray(Image.fromarray((softfeat * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))) > 0
yy, xx = np.mgrid[0:Y1-Y0, 0:X1-X0]; cx, cy, rx, ry = 310, 240, 300, 220
inner = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 < 1
boxes = [(330, 795, 545, 985), (685, 795, 905, 985), (568, 948, 662, 1032), (525, 1005, 705, 1085)]
inbox = np.zeros(al.shape, bool)
for x0, y0, x1, y1 in boxes: inbox[y0 - Y0:y1 - Y0, x0 - X0:x1 - X0] = True
notface = np.zeros(al.shape, bool)
for x0, y0, x1, y1 in boxes: notface[y0 - Y0:y1 - Y0, x0 - X0:x1 - X0] = True
hair_raw = (rgb.mean(-1) < 85) & ((rgb[..., 0] - rgb[..., 2]) < 30) & al & ~notface
# hair = the dark region connected to the hair mass at the top of the box; the brows are islands below it
seed = hair_raw & (yy0 < 12)
for _ in range(500):
    grown = (np.asarray(Image.fromarray((seed * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0) & hair_raw
    if (grown == seed).all(): break
    seed = grown
hair_open = seed
eyebox = np.zeros_like(inbox)
for x0, y0, x1, y1 in boxes[:2]: eyebox[y0 - Y0:y1 - Y0, x0 - X0:x1 - X0] = True
feat = np.where(eyebox, feat_eye, feat_soft)
erase = feat & inner & inbox & ~hair_open
hairmask = np.asarray(Image.fromarray((hair_open * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32) / 255
keep = al & ~feat & ~hair_open
# fill: a wide normalised blur of the skin around (one pass, keeps the drawing's soft gradient)
def gblur(a2, r):
    k = np.exp(-0.5 * (np.arange(-3 * r, 3 * r + 1) / r) ** 2); k /= k.sum()
    pad = len(k) // 2
    out = np.empty_like(a2)
    for c in range(a2.shape[-1] if a2.ndim == 3 else 1):
        ch = a2[..., c] if a2.ndim == 3 else a2
        t = np.apply_along_axis(lambda v: np.convolve(np.pad(v, pad, mode='edge'), k, mode='valid'), 1, ch)
        t = np.apply_along_axis(lambda v: np.convolve(np.pad(v, pad, mode='edge'), k, mode='valid'), 0, t)
        if a2.ndim == 3: out[..., c] = t
        else: out = t
    return out
def nblur(col, m, r):
    cb = gblur(col * m[..., None], r); mb = gblur(m, r)
    return cb / np.maximum(mb[..., None], 1e-3), mb
fill, cov = nblur(rgb, keep.astype(np.float32), 22)
fill2, _ = nblur(rgb, keep.astype(np.float32), 60)
fill = np.where(cov[..., None] > 0.08, fill, fill2)
rgb2 = rgb.copy(); rgb2[erase] = fill[erase]
Image.fromarray(rgb2.clip(0,255).astype(np.uint8)).save(out.replace('.png','-base.png')); Image.fromarray((erase*255).astype(np.uint8)).save(out.replace('.png','-erase.png'))
base = Image.fromarray(np.dstack([rgb2, reg[..., 3:]]).clip(0,255).astype(np.uint8)).resize(((X1-X0)*K, (Y1-Y0)*K), Image.LANCZOS)
# 2. draw the features at 4x
lay = Image.new('RGBA', base.size, (0, 0, 0, 0)); dr = ImageDraw.Draw(lay)
P = lambda x, y: ((x - X0) * K, (y - Y0) * K)
def ell(cx, cy, rx, ry, fill, outline=None, w=0):
    dr.ellipse([P(cx - rx, cy - ry), P(cx + rx, cy + ry)], fill=fill, outline=outline, width=int(w * K))
def soft(img, blur): return img.filter(ImageFilter.GaussianBlur(blur * K))
LASH = (28, 16, 12, 255); IRIS = (134, 72, 32, 255); IRIS_D = (92, 44, 18, 255); PUPIL = (52, 24, 10, 255); WHITE = (250, 248, 247, 255); BROW = (56, 33, 24, 255)
# blush: soft pink, drawn first on its own layer
bl = Image.new('RGBA', base.size, (0, 0, 0, 0)); bd = ImageDraw.Draw(bl)
for cx in (372, 848):
    bd.ellipse([P(cx - 60, 978), P(cx + 60, 1034)], fill=(240, 126, 132, 150))
bl = soft(bl, 11)
def eye(cx, cy, flip):
    s = -1 if flip else 1           # s=+1 for the viewer's left eye: outer corner on the left
    rx, ry = 84, 72
    ell(cx, cy, rx, ry, WHITE, LASH, 2.5)                                # eye shape, thin dark outline, white
    ix, iy = cx + 4 * -s, cy + 6
    ell(ix, iy, 69, 71, IRIS_D); ell(ix, iy, 61, 63, IRIS)
    ell(ix - 2 * s, iy + 14, 29, 34, PUPIL)
    band = Image.new('RGBA', base.size, (0, 0, 0, 0)); bd2 = ImageDraw.Draw(band)
    bd2.ellipse([P(cx - rx, cy - ry), P(cx + rx, cy + ry)], outline=LASH, width=12 * K)
    cut = Image.new('L', base.size, 0); cd = ImageDraw.Draw(cut)
    cd.rectangle([P(cx - rx - 40, cy - 16), P(cx + rx + 40, cy + ry + 40)], fill=255)
    band.putalpha(Image.fromarray(np.where(np.asarray(cut) > 0, 0, np.asarray(band.getchannel('A'))).astype(np.uint8)))
    lay.alpha_composite(band)
    ox = cx - s * (rx - 6); oy = cy - 44
    dr.polygon([P(ox + s * 12, oy + 16), P(ox - s * 18, oy - 10), P(ox + s * 2, oy + 28)], fill=LASH)
    dr.arc([P(cx - rx + 8, cy - ry + 36), P(cx + rx - 8, cy + ry)], 25, 155, fill=(78, 40, 26, 255), width=3 * K)
    ell(cx + 36 * -s, cy - 24, 25, 25, WHITE)                          # big highlight, toward the nose and up
    ell(cx - 30 * s, cy + 36, 9, 9, WHITE)                             # small one, outer and low
eye(430, 892, False); eye(790, 892, True)
def brow_stroke(pts, w0, w1):
    n = len(pts)
    for i, (x, y) in enumerate(pts):
        t = i / (n - 1); ww = w0 + (w1 - w0) * t
        ell(x, y, ww / 2, ww / 2, BROW)
def arcpts(x0, y0, xp, yp, x1, y1, n=40):
    return [((1-t)**2*x0 + 2*(1-t)*t*xp + t*t*x1, (1-t)**2*y0 + 2*(1-t)*t*yp + t*t*y1) for t in (i / n for i in range(n + 1))]
brow_stroke(arcpts(372, 760, 436, 716, 506, 776), 14, 24)      # viewer's left: thin at the temple, full at the nose
brow_stroke(arcpts(826, 742, 772, 706, 722, 757), 14, 24)      # viewer's right
# brows: thick arcs with soft rounded ends
def brow(pts, w=26):
    n = len(pts)
    for i, (x, y) in enumerate(pts):
        t = i / (n - 1); ww = w * (0.55 + 0.45 * math.sin(math.pi * min(1, 0.25 + t * 0.75)))   # thin outer end, full inner
        ell(x, y, ww / 2, ww / 2, BROW)
def arcpts(x0, y0, xp, yp, x1, y1, n=12):
    out = []
    for i in range(n + 1):
        t = i / n; out.append(((1-t)**2*x0 + 2*(1-t)*t*xp + t*t*x1, (1-t)**2*y0 + 2*(1-t)*t*yp + t*t*y1))
    return out

# nose: a soft shadow under a small bump, and a lighter top
nose = Image.new('RGBA', base.size, (0, 0, 0, 0)); nd = ImageDraw.Draw(nose)
nd.ellipse([P(598, 994), P(640, 1014)], fill=(168, 92, 60, 80)); nd.ellipse([P(603, 967), P(629, 987)], fill=(244, 182, 142, 70))
nose = soft(nose, 4)
# mouth: a smile line with a soft lighter lip under it
mo = Image.new('RGBA', base.size, (0, 0, 0, 0)); md = ImageDraw.Draw(mo)
md.line([P(x, y) for x, y in arcpts(556, 1033, 612, 1066, 666, 1030, 20)], fill=(112, 52, 42, 255), width=6 * K, joint='curve')
for x, y in ((556, 1033), (666, 1030)): md.ellipse([P(x - 3, y - 3), P(x + 3, y + 3)], fill=(112, 52, 42, 255))
lip = Image.new('RGBA', base.size, (0, 0, 0, 0)); ld = ImageDraw.Draw(lip)
ld.line([P(x, y + 7) for x, y in arcpts(566, 1036, 612, 1066, 656, 1034, 20)], fill=(236, 150, 128, 70), width=8 * K, joint='curve')
lip = soft(lip, 2)
outimg = base.copy(); outimg.alpha_composite(bl); outimg.alpha_composite(nose); outimg.alpha_composite(lip); outimg.alpha_composite(mo)
outimg.alpha_composite(soft(lay, 0.35))
# the decal: the drawn features plus the drawing's own brows, transparent elsewhere (hair excluded)
vec_a = np.maximum.reduce([np.asarray(im.getchannel('A')).astype(np.float32) for im in (soft(lay, 0.35), nose, lip, mo, bl)]) / 255
browbox = np.zeros(al.shape, bool)
for x0, y0, x1, y1 in ((395, 715, 560, 812), (700, 700, 865, 800)): browbox[y0 - Y0:y1 - Y0, x0 - X0:x1 - X0] = True
hair_d = np.asarray(Image.fromarray((hair_open * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))) > 0
hair_d5 = np.asarray(Image.fromarray((hair_open * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
brow_a = (browbox & (rgb.mean(-1) < 115) & ((rgb[..., 0] - rgb[..., 2]) > 22) & al & ~hair_d5)
brow_a = (np.asarray(Image.fromarray((brow_a * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(7)).filter(ImageFilter.MaxFilter(9))) > 0).astype(np.float32)   # thick strokes only: the bang's edge bits go
brow_a = np.asarray(Image.fromarray((brow_a * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255
brow_a = np.asarray(Image.fromarray((brow_a * 255).astype(np.uint8)).resize(base.size, Image.BILINEAR)).astype(np.float32) / 255
dec = np.asarray(outimg).astype(np.float32).copy(); dec[..., 3] = vec_a * 255
Image.fromarray(dec.clip(0, 255).astype(np.uint8)).resize(((X1 - X0) * 2, (Y1 - Y0) * 2), Image.LANCZOS).save(out.replace('.png', '-decal.png'))
small = outimg.resize((X1 - X0, Y1 - Y0), Image.LANCZOS)
# the badge: a clean white rounded rectangle with a soft grey edge, drawn on the full image at 4x
bx0, by0, bx1, by1 = 650, 1244, 748, 1318   # where the model's own badge bump is
bd = Image.new('RGBA', ((bx1 - bx0 + 8) * K, (by1 - by0 + 8) * K), (0, 0, 0, 0)); bdr = ImageDraw.Draw(bd)
bdr.rounded_rectangle([4 * K, 4 * K, (bx1 - bx0 + 4) * K, (by1 - by0 + 4) * K], radius=5 * K, fill=(246, 244, 243, 255), outline=(188, 184, 190, 255), width=int(1.5 * K))
bdr.ellipse([(49 - 2) * K, (7 - 2) * K, (49 + 2) * K, (7 + 2) * K], fill=(150, 150, 160, 255))
badge = bd.resize((bx1 - bx0 + 8, by1 - by0 + 8), Image.LANCZOS)
sm_a = np.asarray(small).astype(np.float32); orig = reg
hm = hairmask[..., None]
sm_a[..., :3] = sm_a[..., :3] * (1 - hm) + orig[..., :3] * hm
small = Image.fromarray(sm_a.clip(0, 255).astype(np.uint8))
full = d.copy(); full.paste(small, (X0, Y0)); full.alpha_composite(badge, (bx0 - 4, by0 - 4)); full.save(out)
# the drawing's hair over the whole figure: neutral dark, connected to the top of the head, eyes and mouth left out
A = a; rgbA = A[..., :3]; alA = A[..., 3] > 128
hr = (rgbA.mean(-1) < 85) & ((rgbA[..., 0] - rgbA[..., 2]) < 30) & alA
for x0, y0, x1, y1 in boxes: hr[y0:y1, x0:x1] = False
ys_, xs_ = np.where(alA); top_y = ys_.min()
seedA = hr & (np.arange(A.shape[0])[:, None] < top_y + 40)
for _ in range(900):
    g = (np.asarray(Image.fromarray((seedA * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0) & hr
    if (g == seedA).all(): break
    seedA = g
Image.fromarray((seedA * 255).astype(np.uint8)).save(out.replace('.png', '-hair.png')); print('full hair px', int(seedA.sum()))
small.resize(((X1-X0)*2, (Y1-Y0)*2), Image.LANCZOS).save(out.replace('.png', '-face2x.png')); print('ok')
