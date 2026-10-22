"""Dr. Smiley's picture for every frame: build/smiley/s_0001.png ...

Stacks his art the way drSmileyArt() does in index.html: base.webp, then
one frame of face.webp (151 x 111 units, stored at twice that) in the face window, then his brows,
moved by DR_BROWS. Adds a white sticker border so the peel reads.
    python smiley.py
"""
import os
import shutil

from PIL import Image, ImageFilter

import timeline as T

ART = os.path.join(T.REPO, 'drsmiley')
OUT = os.path.join(T.BUILD, 'smiley')

U = 480 / 106                 # base.webp pixels per SVG unit (4.53)
BASE_X, BASE_Y = 14, 0.8      # base.webp's corner in drSmileyArt's SVG
BORDER = 10                   # sticker border, pixels


def svg_px(x, y):
    return round((x - BASE_X) * U), round((y - BASE_Y) * U)


def compose(face_name, brows_name):
    base = Image.open(os.path.join(ART, 'base.webp')).convert('RGBA')
    strip = Image.open(os.path.join(ART, 'face.webp')).convert('RGBA')
    i = T.FACE_FRAMES.index(face_name)
    fw = strip.width // len(T.FACE_FRAMES)       # 302: the file is twice 151 x 111
    face = strip.crop((i * fw, 0, (i + 1) * fw, strip.height)).resize((302, 222), Image.LANCZOS)
    img = base.copy()
    img.alpha_composite(face, svg_px(31.667, 47.617))
    ldy, lrot, rdy, rrot = T.BROWS[brows_name]
    for name, x, y, dy, rot in (('brow-l', 33.875, 39.446, ldy, lrot),
                                ('brow-r', 73.625, 42.758, rdy, rrot)):
        brow = Image.open(os.path.join(ART, name + '.webp')).convert('RGBA')
        if rot:
            # CSS turns clockwise for positive degrees; PIL the other way.
            w, h = brow.size
            brow = brow.rotate(-rot, resample=Image.BICUBIC, expand=True)
            x -= (brow.size[0] - w) / 2 / U
            y -= (brow.size[1] - h) / 2 / U
        img.alpha_composite(brow, svg_px(x, y + dy))
    # The sticker: a white rim just outside his outline.
    canvas = Image.new('RGBA', (img.width + 2 * BORDER, img.height + 2 * BORDER), (0, 0, 0, 0))
    a = Image.new('L', canvas.size, 0)
    a.paste(img.getchannel('A'), (BORDER, BORDER))
    rim = a.point(lambda v: 255 if v > 40 else 0).filter(ImageFilter.MaxFilter(2 * BORDER - 1))
    rim = rim.filter(ImageFilter.GaussianBlur(1.2))
    white = Image.new('RGBA', canvas.size, (255, 255, 255, 255))
    white.putalpha(rim)
    canvas.alpha_composite(white)
    canvas.alpha_composite(img, (BORDER, BORDER))
    return canvas


def main():
    os.makedirs(OUT, exist_ok=True)
    cache = {}
    for frame in range(1, T.FRAMES + 1):
        key = T.face_at(frame)
        if key not in cache:
            path = os.path.join(OUT, 'look_%s_%s.png' % key)
            compose(*key).save(path)
            cache[key] = path
        dst = os.path.join(OUT, 's_%04d.png' % frame)
        if os.path.exists(dst):
            os.remove(dst)
        shutil.copyfile(cache[key], dst)
    print('wrote', T.FRAMES, 'frames from', len(cache), 'looks to build/smiley/')


if __name__ == '__main__':
    main()
