"""Finds the sky in each campus photo (a flood fill from the top edge, in
Lab colour) and writes photos/<name>-sky.png: white where the sky shows.
scene-v2.html paints drifting clouds only there. Where it reaches into a
window that reflects the sky, the clouds read as a reflection.
  python3 -I prep.py"""
import os, glob
import cv2, numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
for src in sorted(glob.glob(os.path.join(HERE, 'photos/src/*.jpg'))):
    n = os.path.basename(src)[:-4]
    img = cv2.imread(src); h, w = img.shape[:2]
    lab = cv2.cvtColor(cv2.GaussianBlur(img, (0, 0), 1.2), cv2.COLOR_BGR2LAB)
    mask = np.zeros((h + 2, w + 2), np.uint8)
    for x in range(0, w, max(1, w // 40)):
        if mask[1, x + 1] == 0:
            cv2.floodFill(lab, mask, (x, 0), 0, (3, 3, 3), (3, 3, 3), cv2.FLOODFILL_MASK_ONLY | (255 << 8) | 4)
    m = cv2.morphologyEx(mask[1:-1, 1:-1], cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    m = cv2.GaussianBlur(cv2.resize(m, (w * 2, h * 2), interpolation=cv2.INTER_LINEAR), (0, 0), 1.5)
    cv2.imwrite(os.path.join(HERE, f'photos/{n}-sky.png'), m)
    print(n, 'sky', round((m > 127).mean(), 3))
