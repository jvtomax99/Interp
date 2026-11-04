import sys, numpy as np
from PIL import Image, ImageFilter
src, out = sys.argv[1], sys.argv[2]
a = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
skin = (r > 170) & (g > 100) & (g < 190) & (b < 140) & (r - b > 70)
lum = a.mean(-1); sat = a.max(-1) - a.min(-1)
greyish = (lum > 110) & (lum < 236) & (sat < 45)          # the smeared whites round the eyes (not the bright highlights)
# only near skin: shoes and the badge sit in blue or white surroundings
near = np.asarray(Image.fromarray((skin * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(14))).astype(np.float32) / 255
fix = greyish & (near > 0.22)
print('eye pixels fixed', int(fix.sum()))
skin_col = np.array([235, 150, 97], np.float32)
# fill with the local skin colour so shading continues
sk = Image.fromarray((a * skin[..., None]).astype(np.uint8)).filter(ImageFilter.GaussianBlur(10))
skm = np.asarray(Image.fromarray((skin * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(10))).astype(np.float32)[..., None] / 255 + 1e-4
local = np.asarray(sk).astype(np.float32) / skm
local = np.where(skm > 0.05, local, skin_col)
res = a.copy(); res[fix] = local[fix]
Image.fromarray(res.clip(0, 255).astype(np.uint8)).save(out)
