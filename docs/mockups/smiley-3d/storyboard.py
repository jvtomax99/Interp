"""The visual plans as phone-size pictures: out/plan-glb.png (picture-to-3D),
out/plan-pixar.png (Pixar-style route, Jose 2026-10-21)."""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
O = lambda n: os.path.join(HERE, 'out', n)
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FR = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
NAVY, INK, SOFT, CYAN, BG = (37, 46, 109), (21, 28, 44), (90, 100, 120), (1, 184, 230), (244, 246, 250)
W = 1080


def fit(im, w, h):
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA'); bg = Image.new('RGBA', im.size, (255, 255, 255, 255)); bg.alpha_composite(im); im = bg
    im = im.convert('RGB'); im.thumbnail((w, h), Image.LANCZOS); return im


def wrap(g, text, font, width):
    lines, line = [], ''
    for word in text.split():
        t = (line + ' ' + word).strip()
        if g.textlength(t, font=font) > width and line:
            lines.append(line); line = word
        else:
            line = t
    return lines + [line]


def placeholder(w, h, lines):
    ph = Image.new('RGB', (w, h), (232, 241, 250))
    d = ImageDraw.Draw(ph)
    d.rounded_rectangle((4, 4, w - 5, h - 5), 22, outline=(46, 139, 208), width=4)
    f = ImageFont.truetype(FB, 30)
    for i, ln in enumerate(lines):
        d.text((w // 2, h // 2 + (i - (len(lines) - 1) / 2) * 44), ln, font=f, fill=NAVY, anchor='mm')
    return ph


def side_by_side(a, b, gap=30):
    out = Image.new('RGB', (a.width + b.width + gap, max(a.height, b.height)), (255, 255, 255))
    out.paste(a, (0, (out.height - a.height) // 2)); out.paste(b, (a.width + gap, (out.height - b.height) // 2))
    return out


def board(title, sub, steps, name):
    H = 230
    blocks = []
    probe = ImageDraw.Draw(Image.new('RGB', (10, 10)))
    fT, fS, fC, fN, fH = (ImageFont.truetype(FB, 40), ImageFont.truetype(FR, 30), ImageFont.truetype(FR, 24),
                          ImageFont.truetype(FB, 34), ImageFont.truetype(FB, 26))
    for st in steps:
        lines = wrap(probe, st[2], fS, W - 190)
        h = 40 + 40 * len(lines) + 20 + sum(i.height + 10 for i in st[3]) + (40 if st[4] else 0) + (70 if st[5] else 0) + 40
        blocks.append((st, lines, h))
    H += sum(b[2] for b in blocks) + 40
    im = Image.new('RGB', (W, H), BG)
    g = ImageDraw.Draw(im)
    g.text((50, 50), title, font=ImageFont.truetype(FB, 48), fill=NAVY)
    for k, ln in enumerate(sub):
        g.text((50, 120 + 40 * k), ln, font=fS, fill=SOFT)
    y = H - sum(b[2] for b in blocks) - 40
    for (num, who, text, imgs, cap, gate), lines, h in blocks:
        g.rounded_rectangle((30, y, W - 30, y + h - 20), 26, fill=(255, 255, 255), outline=(226, 231, 240), width=2)
        g.ellipse((55, y + 30, 125, y + 100), fill=NAVY)
        g.text((90, y + 65), num, font=fN, fill=(255, 255, 255), anchor='mm')
        g.text((150, y + 32), who, font=fH, fill=CYAN if who == 'YOU' else SOFT)
        ty = y + 68
        for ln in lines:
            g.text((150, ty), ln, font=fS, fill=INK); ty += 40
        ty += 20
        for i in imgs:
            im.paste(i, ((W - i.width) // 2, ty)); ty += i.height + 10
        if cap:
            g.text((W // 2, ty + 10), cap, font=fC, fill=SOFT, anchor='mt'); ty += 40
        if gate:
            g.rounded_rectangle((150, ty + 8, W - 150, ty + 58), 25, fill=(232, 241, 250))
            g.text((W // 2, ty + 33), 'STOP  •  waits for your OK', font=fH, fill=NAVY, anchor='mm')
        y += h

    im.save(O(name))
    print('done', name, im.size)


SUB = ['Nothing is built until you say OK. Pictures marked "example" use',
       'today\u2019s 3D only to show what each step makes.']
glb = [
    ('1', 'YOU', 'Upload the picture to Tripo or Meshy, download the 3D file (GLB), send it here.',
     [fit(Image.open(O('concept-front.png')), 330, 480)], 'The picture I sent you', False),
    ('2', 'ME', 'Check the AI model from every side, fix size and gaps, split hair, face, hands. I send you its 360\u00b0 turn as it came.',
     [fit(Image.open(O('head-views.png')), 1000, 260)], 'Example of the check (today\u2019s 3D head, front to back)', True),
    ('3', 'ME', 'Put his skeleton in: 36 bones, fingers included, so he can bend, jump, wave and point.',
     [fit(Image.open(O('plan-skeleton.png')), 360, 600)], 'The skeleton (dark: body, light blue: fingers)', False),
    ('4', 'ME', 'Put your 30 drawn expressions and his moving brows on the new face. The eyes and smile are always your drawing.',
     [fit(Image.open(O('plan-faces.png')), 1000, 740)], 'Your expressions on a 3D head (today\u2019s head as the example)', False),
    ('5', 'ME', 'Six poses and a 360\u00b0 turn of the finished figure, phone size.',
     [fit(Image.open(O('poses.png')), 1000, 900)], 'Example: the six poses from round 2', True),
    ('6', 'NEXT', 'Only after your OK: the animation (jumps, flips, landings, wave), again shown as a plan first.', [], '', False),
]
pixar = [
    ('1', 'YOU', 'In your picture app (the one that made his drawing), paste my prompt with his drawing: it draws him full body, Pixar style, from 4 sides.',
     [side_by_side(fit(Image.open(O('../../../../drsmiley/base.webp')), 300, 380),
                   placeholder(560, 380, ['Full body, Pixar style', 'front \u00b7 3/4 \u00b7 side \u00b7 back', '(you make it)']))],
     'Your drawing in, a turnaround out', True),
    ('2', 'YOU', 'Upload the front picture (or all 4, if the site takes several) to Tripo or Meshy, download the GLB, send it here.',
     [placeholder(900, 200, ['3D file (GLB)', 'made by the site from your picture'])], '', False),
    ('3', 'ME', 'Check it from every side; I send you its 360\u00b0 turn as it came.',
     [fit(Image.open(O('head-views.png')), 1000, 260)], 'Example of the check (today\u2019s 3D head)', True),
    ('4', 'ME', 'Skeleton for the body: 36 bones, fingers included.',
     [fit(Image.open(O('plan-skeleton.png')), 360, 600)], 'Example: the skeleton on today\u2019s figure', False),
    ('5', 'ME', 'Face controls for Pixar-style acting: 3D eyes that blink and look around, brows, cheeks, smile corners, lips, jaw.',
     [fit(Image.open(O('plan-face-controls.png')), 600, 750)], 'Where the face controls go (on your drawing)', False),
    ('6', 'ME', 'An expression sheet (happy, laugh, surprised, wink, worried), six poses and a 360\u00b0 turn.',
     [fit(Image.open(O('plan-faces.png')), 1000, 740)], 'Example of an expression sheet (today\u2019s head)', True),
    ('7', 'NEXT', 'Only after your OK: the animation, shown as a plan first.', [], '', False),
]
board('Plan: your 3D file \u2192 Dr. Smiley', SUB, glb, 'plan-glb.png')
board('Plan: Dr. Smiley, Pixar style', SUB, pixar, 'plan-pixar.png')
