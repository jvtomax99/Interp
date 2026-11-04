# Label map -> flat colour + roughness textures, island edges bled outward so seams don't show.
import numpy as np, sys
from PIL import Image, ImageFilter
D = sys.argv[1]
L = np.load(f'{D}/label.npy'); P = np.load(f'{D}/pos.npy')
COL = np.array([(236, 146, 88), (14, 34, 118), (44, 36, 38), (240, 236, 234)], np.float32)
RGH = np.array([0.5, 0.78, 0.42, 0.55], np.float32)
cov = L != 255; Li = np.where(cov, L, 0)
col = COL[Li]; rg = RGH[Li]
# blush on the cheeks (positions from the eyes file if present)
import os, json
if os.path.exists(f'{D}/face.json'):
    F = json.load(open(f'{D}/face.json'))
    for ch in F['cheeks']:
        dd = np.linalg.norm(P - np.array(ch), axis=-1); w = np.exp(-(dd / F['blush_r']) ** 2) * (Li == 0) * 0.45
        col = col * (1 - w[..., None]) + np.array((236, 118, 105), np.float32) * w[..., None]
col[~cov] = 0
# bleed: repeat dilation of covered colour into empty texels
img = col.copy(); m = cov.astype(np.float32)
for _ in range(12):
    a = Image.fromarray((img).clip(0, 255).astype(np.uint8)); mm = Image.fromarray((m * 255).astype(np.uint8))
    s = np.asarray(a.filter(ImageFilter.BoxBlur(1))).astype(np.float32) * 9; w = np.asarray(mm.filter(ImageFilter.BoxBlur(1))).astype(np.float32) / 255 * 9
    fill = (m == 0) & (w > 0); img[fill] = (s[fill] / w[fill, None]) ; m[fill] = 1
    img = img * m[..., None]
Image.fromarray(img.clip(0, 255).astype(np.uint8)).save(f'{D}/flat.png')
Image.fromarray((rg * 255).astype(np.uint8)).save(f'{D}/rough.png')
print('ok')
