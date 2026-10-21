"""Face textures for the 3D Dr. Smiley.

His face stays his drawing: the skin inside his hairline from
drsmiley/base.webp, with one of the 30 eye/mouth frames from face.webp and
his two brows laid on exactly where drSmileyArt() puts them in the app.
The hair and the background around the face are painted over as skin
(OpenCV inpaint), so the 3D hair can sit where it likes; an alpha edge
fades the drawing into the head's own skin material.

  python3 prep.py            -> tex/face_<frame>__<brow pose>.png for the poses below
  python3 prep.py all        -> every frame with its own brow pose
"""
import os, sys, json, math
import numpy as np
from PIL import Image, ImageFilter
import cv2

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tex')
SCALE = 2  # textures at twice the drawing's size (Lanczos), 960 x 1200

# Same lists as index.html (DR_FACE_FRAMES, DR_BROWS, DR_BROW_OF, DR_BROW_SIDE).
FRAMES = ['rest', 'blink1', 'blink2', 'shut', 'wink1', 'wink2', 'wink', 'smile1', 'smile2', 'smile', 'laugh1', 'laugh2', 'laugh',
          'laughB', 'lookL', 'lookR', 'love', 'sleep', 'halfL', 'halfR', 'lookU', 'lookD', 'lookUL', 'lookUR', 'lookDL', 'lookDR',
          'surprised', 'sad', 'worried', 'doubt']
BROWS = {
    'rest': [0, 0, 0, 0], 'relax': [.8, 0, .8, 0], 'lift': [-1.2, 0, -1.2, 0], 'glad': [-2, 0, -2, 0],
    'laugh': [-2.8, 0, -2.8, 0], 'up': [-4.2, 0, -4.2, 0], 'quizL': [.4, -7, -3.6, -5], 'quizR': [-3.6, 5, .4, 7],
    'down': [.8, 0, .8, 0], 'love': [-2, -6, -2, 6], 'wink': [-1, 0, 1.2, -4], 'caring': [-1, -11, -1, 11],
    'worried': [-1.4, -15, -1.4, 15], 'focused': [1.2, 10, 1.2, -10], 'doubt': [-3, -4, 1, 2],
}
BROW_OF = {
    'shut': 'relax', 'sleep': 'relax', 'smile1': 'lift', 'smile2': 'glad', 'smile': 'glad',
    'laugh1': 'laugh', 'laugh2': 'laugh', 'laugh': 'laugh', 'laughB': 'laugh',
    'lookU': 'up', 'lookUL': 'quizL', 'lookUR': 'quizR', 'lookD': 'down', 'lookDL': 'down', 'lookDR': 'down',
    'love': 'love', 'wink1': 'wink', 'wink2': 'wink', 'wink': 'wink',
    'surprised': 'up', 'sad': 'caring', 'worried': 'worried', 'doubt': 'doubt',
}
BROW_SIDE = [.9, 1.2]
# Placement in base.webp pixels (480 x 600), from drSmileyArt(): the window
# for the face strip, each brow's box and its CSS transform-origin.
ART = {'face': (80, 212, 302, 222), 'browL': (90, 175, 130, 65), 'browR': (270, 190, 125, 90),
       'originL': (.5385, .4615), 'originR': (.44, .4444), 'unit': 4.53}
# The face oval the drawing keeps (base pixels); outside it, the 3D skin.
OVAL = (238, 300, 182, 162)  # cx, cy, rx, ry


def load(name):
    return Image.open(os.path.join(ROOT, 'drsmiley', name)).convert('RGBA')


def base_skin():
    """base.webp with hair, ears and background inside the oval painted over as skin."""
    im = np.array(load('base.webp')).astype(np.float32)
    R, G, B, A = [im[..., i] for i in range(4)]
    mx = np.maximum(np.maximum(R, G), B)
    mn = np.minimum(np.minimum(R, G), B)
    sat = (mx - mn) / np.maximum(mx, 1)
    skin = (A > 200) & (R > 150) & (R > G + 12) & (mx > 150) & (sat < .62)
    h, w = R.shape
    yy, xx = np.mgrid[0:h, 0:w]
    cx, cy, rx, ry = OVAL
    inside = ((xx - cx) / (rx * 1.12)) ** 2 + ((yy - cy) / (ry * 1.12)) ** 2 < 1
    keep = np.zeros_like(skin)
    fx, fy, fw, fh = ART['face']
    keep[fy:fy + fh, fx:fx + fw] = True     # eyes, nose and mouth are never painted over
    hole = ~skin & ~keep
    hole = cv2.dilate(hole.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    hole &= ~keep
    rgb = im[..., :3].astype(np.uint8).copy()
    # Fill everything outside the oval with the forehead's skin first, so the
    # inpaint only has to blend the hairline.
    rgb[~inside] = (250, 196, 164)
    fixed = cv2.inpaint(rgb, (hole | ~inside).astype(np.uint8) * 255, 9, cv2.INPAINT_TELEA)
    return Image.fromarray(fixed).convert('RGBA')


def face_frame(name):
    strip = load('face.webp')
    i = FRAMES.index(name)
    fw, fh = ART['face'][2], ART['face'][3]
    return strip.crop((i * fw, 0, i * fw + fw, fh))


def paste_brow(img, which, v):
    """One brow, lifted and turned about its CSS origin like drBrowApply()."""
    brow = load('brow-l.webp' if which == 'L' else 'brow-r.webp')
    x, y, w, h = ART['brow' + which]
    brow = brow.resize((w, h), Image.LANCZOS)
    ox, oy = ART['origin' + which]
    side = BROW_SIDE[0] if which == 'L' else BROW_SIDE[1]
    dy, rot = (v[0], v[1]) if which == 'L' else (v[2], v[3])
    dy, rot = dy * side * ART['unit'], rot * side
    pad = 40
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    layer.paste(brow, (x, y), brow)
    # rotate about the origin point; CSS angles turn clockwise, PIL anticlockwise
    layer = layer.rotate(-rot, resample=Image.BICUBIC, center=(x + ox * w, y + oy * h), translate=(0, dy))
    img.alpha_composite(layer)


def face_texture(frame, brow=None, base=None):
    brow = brow or BROW_OF.get(frame, 'rest')
    img = (base or base_skin()).copy()
    fr = face_frame(frame)
    img.alpha_composite(fr, (ART['face'][0], ART['face'][1]))
    v = BROWS[brow]
    paste_brow(img, 'L', v)
    paste_brow(img, 'R', v)
    img = img.resize((img.width * SCALE, img.height * SCALE), Image.LANCZOS)
    # alpha: the oval, feathered, so the drawing fades into the 3D skin
    h, w = img.height, img.width
    yy, xx = np.mgrid[0:h, 0:w] / SCALE
    cx, cy, rx, ry = OVAL
    d = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
    a = np.clip((1.08 - d) / .16, 0, 1)
    a = a * a * (3 - 2 * a)
    arr = np.array(img)
    arr[..., 3] = (a * 255).astype(np.uint8)
    return Image.fromarray(arr)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    base = base_skin()
    base.save(os.path.join(OUT, 'base_skin.png'))
    if len(sys.argv) > 1 and sys.argv[1] == 'all':
        jobs = [(f, None) for f in FRAMES]
    else:
        jobs = [('rest', None), ('smile', None), ('laugh', None), ('surprised', None), ('wink', None), ('lookR', None),
                ('lookL', None), ('worried', None), ('love', None), ('doubt', None)]
    jobs += [('rest', 'focused', 'determined'), ('rest', 'caring', 'caring'), ('lookR', 'quizR', 'pointR')]
    for job in jobs:
        f, b = job[0], job[1]
        b = b or BROW_OF.get(f, 'rest')
        name = job[2] if len(job) > 2 else f
        face_texture(f, b, base).save(os.path.join(OUT, f'face_{name}.png'))
        print('tex', f, b)
