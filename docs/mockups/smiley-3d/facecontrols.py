"""A picture of the face controls a Pixar-style rig gives him, drawn over
his drawing (for the visual plan): out/plan-face-controls.png."""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
im = Image.open(os.path.join(HERE, '..', '..', '..', 'drsmiley', 'base.webp')).convert('RGBA')
bg = Image.new('RGBA', im.size, (244, 246, 250, 255)); bg.alpha_composite(im)
im = bg.convert('RGB').resize((960, 1200), Image.LANCZOS)
im = Image.blend(im, Image.new('RGB', im.size, (255, 255, 255)), .25)
g = ImageDraw.Draw(im)
f = ImageFont.truetype(FB, 30)
NAVY, CYAN = (37, 46, 109), (1, 184, 230)
# (x, y in drawing pixels, label, label side)
pts = [((150, 205), 'brow', 'l'), ((330, 222), 'brow', 'r'),
       ((145, 248), 'upper lid', 'l'), ((318, 268), 'upper lid', 'r'),
       ((145, 300), 'eye aim', 'l'), ((318, 318), 'eye aim', 'r'),
       ((95, 345), 'cheek', 'l'), ((372, 352), 'cheek', 'r'),
       ((150, 375), 'smile corner', 'l'), ((282, 382), 'smile corner', 'r'),
       ((218, 392), 'lips', 'r'), ((222, 432), 'jaw', 'r')]
for (x, y), lab, side in pts:
    X, Y = x * 2, y * 2
    g.ellipse((X - 13, Y - 13, X + 13, Y + 13), fill=(255, 255, 255), outline=CYAN, width=6)
    tw = g.textlength(lab, font=f)
    tx = X - 26 - tw if side == 'l' else X + 26
    g.rounded_rectangle((tx - 10, Y - 22, tx + tw + 10, Y + 22), 12, fill=NAVY)
    g.text((tx, Y), lab, font=f, fill=(255, 255, 255), anchor='lm')
im.save(os.path.join(HERE, 'out', 'plan-face-controls.png'))
print('done')
