"""Sharpens Jose's campus photos: EDSR x4 (OpenCV's dnn_superres; a
faithful upscaler that doesn't invent detail the way GAN upscalers do,
which matters on real signs and windows), in overlapping tiles, then a
light unsharp mask. photos/src/*.jpg -> photos/*.jpg.
  python3 -I upscale.py <path to EDSR_x4.pb>"""
import os, sys, glob
import cv2, numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sr = cv2.dnn_superres.DnnSuperResImpl_create()
sr.readModel(sys.argv[1]); sr.setModel('edsr', 4)
TILE, PAD, S = 160, 12, 4

def upscale(img):
    h, w = img.shape[:2]
    out = np.zeros((h * S, w * S, 3), np.float32)
    for y in range(0, h, TILE):
        for x in range(0, w, TILE):
            y0, x0 = max(0, y - PAD), max(0, x - PAD)
            y1, x1 = min(h, y + TILE + PAD), min(w, x + TILE + PAD)
            up = sr.upsample(img[y0:y1, x0:x1]).astype(np.float32)
            ty, tx = (y - y0) * S, (x - x0) * S
            th, tw = min(TILE, h - y) * S, min(TILE, w - x) * S
            out[y * S:y * S + th, x * S:x * S + tw] = up[ty:ty + th, tx:tx + tw]
    return out

for src in sorted(glob.glob(os.path.join(HERE, 'photos/src/*.jpg'))):
    img = cv2.imread(src)
    up = upscale(img)
    blur = cv2.GaussianBlur(up, (0, 0), 2.0)
    up = np.clip(up * 1.35 - blur * 0.35, 0, 255).astype(np.uint8)
    dst = os.path.join(HERE, 'photos', os.path.basename(src))
    cv2.imwrite(dst, up, [cv2.IMWRITE_JPEG_QUALITY, 93])
    print(os.path.basename(src), img.shape[1::-1], '->', up.shape[1::-1], flush=True)
