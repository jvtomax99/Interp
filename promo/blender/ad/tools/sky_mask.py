"""Cuts the sky out of the opening photo: build/photo/sky_mask.png and
building.png. Real sky is smooth and blue; the tower's glass is blue too but
crossed by window frames, so only smooth blue connected to the top-left
corner counts as sky.
    python tools/sky_mask.py            (needs build/photo/helena.jpg)
"""
import os

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'build', 'photo')
im = Image.open(os.path.join(D, 'helena.jpg')).convert('RGB')
a = np.asarray(im).astype(float)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
gray = a.mean(2)
edges = np.hypot(ndimage.sobel(gray, 0), ndimage.sobel(gray, 1))
busy = ndimage.binary_dilation(edges > 40, iterations=2)
sky = (b > 120) & (b > r + 30) & ~busy
lab, _ = ndimage.label(sky)
mask = lab == lab[5, 5]
mask = ndimage.binary_dilation(mask, iterations=2) & ~ndimage.binary_dilation(edges > 90, iterations=1)
mask = ndimage.binary_fill_holes(mask)
lab2, _ = ndimage.label(mask)
mask = ndimage.binary_closing(lab2 == lab2[5, 5], iterations=3)
m = Image.fromarray((mask * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.0))
m.save(os.path.join(D, 'sky_mask.png'))
bld = im.convert('RGBA')
bld.putalpha(Image.fromarray(255 - np.asarray(m)))
bld.save(os.path.join(D, 'building.png'))
print('sky share %.2f' % mask.mean())
