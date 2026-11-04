import sys, numpy as np
from PIL import Image, ImageFilter
src, out, K, SIG = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
Image.MAX_IMAGE_PIXELS = None
im = Image.open(src).convert('RGB').resize((4096, 4096), Image.LANCZOS)
a = np.asarray(im).astype(np.float32)
# seeds: class -> (seed colour in Tripo's paint, target colour from Jose's drawing)
C = {'skin': ((215,140,90), (226,152,116)), 'blue': ((50,62,170), (22,44,128)), 'hair': ((40,36,40), (30,26,31)),
     'white': ((225,225,228), (244,241,240)), 'iris': ((105,60,35), None), 'line': ((120,70,50), None)}
names = list(C); seeds = np.array([C[n][0] for n in names], np.float32)
d = np.linalg.norm(a[:, :, None, :] - seeds[None, None], axis=-1)
cls = d.argmin(-1); far = d.min(-1) > 70
# speckles: a texel whose kind is rare around it but another kind fills the area takes that kind (badge text, hems)
frac = []
for i in range(len(names)):
    mk = Image.fromarray(((cls == i) & ~far).astype(np.uint8) * 255).filter(ImageFilter.BoxBlur(14))
    frac.append(np.asarray(mk).astype(np.float32) / 255)
frac = np.stack(frac, -1); own = np.take_along_axis(frac, cls[..., None], -1)[..., 0]; best = frac.argmax(-1)
re = (own < 0.3) & (frac.max(-1) > 0.55) & ~far; cls[re] = best[re]; print('speckles reassigned', int(re.sum()))
res = a.copy()
for i, n in enumerate(names):
    tgt = C[n][1]
    if tgt is None: continue
    m = (cls == i) & ~far
    if m.sum() == 0: continue
    mean = a[m].mean(0)
    # smoothed colour inside the class only: blur(colour*mask) / blur(mask)
    mk = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(SIG))
    mkf = np.asarray(mk).astype(np.float32)[..., None] / 255 + 1e-4
    col = Image.fromarray((a * m[..., None]).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(SIG))
    sm = np.asarray(col).astype(np.float32) / mkf
    kk = {'white': 0.15, 'blue': 0.3, 'skin': 0.35, 'hair': 0.45}.get(n, K)
    new = np.array(tgt, np.float32) + kk * (sm - mean)
    res[m] = new[m]
    print(n, int(m.sum()), mean.round().tolist(), '->', tgt)
Image.fromarray(res.clip(0, 255).astype(np.uint8)).save(out)
