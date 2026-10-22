"""The face plan as one phone-size picture (plan-rig.png steps 3-4, opened up):
out/plan-face.png, from the mock-ups tripo_faceplan.py renders.

  python3 tripo_faceplan.py && python3 tripo_faceboard.py
"""
import os
from PIL import Image, ImageDraw, ImageFont
from storyboard import O, FB, NAVY, SOFT, fit, board

HERE = os.path.dirname(os.path.abspath(__file__))
T = lambda n: Image.open(os.path.join(HERE, 'in', 'faceplan', n + '.png')).convert('RGB')
P = lambda n: Image.open(O('plan/' + n)).convert('RGB')
GREEN, RED = (30, 140, 90), (194, 72, 92)


def tag(im, text, colour=NAVY, size=22):
    g = ImageDraw.Draw(im); f = ImageFont.truetype(FB, size)
    tw = g.textlength(text, font=f)
    g.rounded_rectangle((10, 10, 28 + tw, 44), 10, fill=colour); g.text((19, 27), text, font=f, fill='white', anchor='lm')
    return im


def brows_ab():
    """Each expression in a row: A on the left, B on the right."""
    tw, th, gap = 490, 258, 16
    rows = [('rest', 'bare', 'rest'), ('surprised',) * 2, ('worried',) * 2, ('focused',) * 2, ('doubt',) * 2]
    head = 70
    out = Image.new('RGB', (tw * 2 + gap, head + len(rows) * (th + gap)), 'white')
    g = ImageDraw.Draw(out); f = ImageFont.truetype(FB, 26)
    g.text((tw // 2, 22), 'A  his brows move', font=f, fill=GREEN, anchor='mt')
    g.text((tw + gap + tw // 2, 22), 'B  new brow pieces', font=f, fill=SOFT, anchor='mt')
    for i, r in enumerate(rows):
        name = r[0]
        a = T('A-' + name).crop((40, 0, 720, 358)).resize((tw, th))
        b = T('B-' + (r[1] if len(r) == 3 else name)).crop((40, 0, 720, 358)).resize((tw, th))
        y = head + i * (th + gap)
        out.paste(tag(a, name), (0, y)); out.paste(tag(b, 'his brows taken off' if len(r) == 3 else name), (tw + gap, y))
    return out


def cheeks():
    a = T('cheek0').crop((0, 60, 640, 480)); b = T('cheek1').crop((0, 60, 640, 480))
    a, b = tag(a, 'rest'), tag(b, 'cheeks up (smile, laugh)')
    out = Image.new('RGB', (a.width * 2 + 16, a.height), 'white'); out.paste(a, (0, 0)); out.paste(b, (a.width + 16, 0))
    return out


def mouth_now():
    f, q = T('mouth-front'), T('mouth-34')
    cut = P('face-mouth-cut.png').resize((380, 336))
    top = Image.new('RGB', (f.width + q.width + 16, f.height), 'white'); top.paste(f, (0, 0)); top.paste(q, (f.width + 16, 0))
    top = fit(top, 1000, 400)
    out = Image.new('RGB', (1000, top.height + 16 + cut.height), 'white')
    out.paste(top, ((1000 - top.width) // 2, 0)); out.paste(cut, ((1000 - cut.width) // 2, top.height + 16))
    return out


def mouths_drawn():
    """His seven drawn mouths (drsmiley/face.webp), which are open and which closed."""
    strip = Image.open(os.path.join(HERE, '..', '..', '..', 'drsmiley', 'face.webp')).convert('RGBA')
    FR = ['rest', 'blink1', 'blink2', 'shut', 'wink1', 'wink2', 'wink', 'smile1', 'smile2', 'smile', 'laugh1', 'laugh2', 'laugh',
          'laughB', 'lookL', 'lookR', 'love', 'sleep', 'halfL', 'halfR', 'lookU', 'lookD', 'lookUL', 'lookUR', 'lookDL', 'lookDR',
          'surprised', 'sad', 'worried', 'doubt']
    names = [('smile', 'open', GREEN), ('laugh', 'open', GREEN), ('surprised', 'small O', NAVY), ('rest', 'closed', RED),
             ('sad', 'closed', RED), ('worried', 'closed', RED), ('doubt', 'closed', RED)]
    cw = 140
    out = Image.new('RGB', (cw * len(names), 170), 'white'); g = ImageDraw.Draw(out)
    for i, (n, kind, c) in enumerate(names):
        k = FR.index(n)
        m = strip.crop((k * 302 + 60, 110, k * 302 + 250, 222))
        bg = Image.new('RGBA', m.size, (255, 255, 255, 255)); bg.alpha_composite(m)
        out.paste(bg.convert('RGB').resize((132, 78)), (i * cw + 4, 4))
        g.text((i * cw + cw // 2, 96), n, font=ImageFont.truetype(FB, 20), fill=NAVY, anchor='mt')
        g.text((i * cw + cw // 2, 128), kind, font=ImageFont.truetype(FB, 18), fill=c, anchor='mt')
    return out


SUB = ['Pictures are quick mock-ups on your model, not the', 'finished work. Nothing is built until you say OK.']
steps = [
    ('1', 'DECIDE', 'Brows. Your model’s brows are sculpted: a raised ridge, painted brown, not only paint. '
     'A: the skin under them moves, ridge and all. B: I take them off and put new brow pieces on top. '
     'Same moves as your app’s brows. My pick: A. They stay the brows you approved, with their soft shine; '
     'B looks like stickers and leaves marks where the old ones were. '
     'A faint line over his left brow in A is mock-up roughness I smooth in the build.',
     [brows_ab()], 'Left: A (my pick). Right: B. Each row is one expression.', True),
    ('2', 'ME', 'When a brow comes down (focused, worried), the top of that eye comes down a little with it, using the eyelid '
     'that already blinks. His brow sits only 6 to 10 mm above the eye, so without this the skin bunches up.', [], '', False),
    ('3', 'ME', 'Cheeks. They rise and round out when he smiles or laughs, and stay still otherwise.',
     [fit(cheeks(), 1000, 420)], 'Mock-up: rest (left), cheeks up (right)', False),
    ('4', 'ME', 'Mouth, what it is now: a real open mouth, sculpted in one smile, with teeth and a tongue inside. '
     'Four of your seven drawn mouths are closed and one is a small O, so closing his mouth is the hard part.',
     [mouth_now(), fit(mouths_drawn(), 1000, 200)], 'His mouth now: front, side, and cut through. Below: your drawn mouths', False),
    ('5', 'DECIDE', 'Mouth, how. 1: reshape his own lips for each shape, the teeth slide back inside when they close (my pick: '
     'it keeps the smile you approved, no join on his face). 2: smooth his mouth over and add a new 3D mouth on top, like the eyes '
     '(more control for talking later, but a join and a new smile). 3: paint flat mouths on (cheapest, looks like a sticker '
     'from the side; not recommended).', [], '', True),
    ('6', 'ME', 'Mouth test first: the hardest shape, his closed resting mouth, on its own, front and side. If it looks wrong I '
     'show you route 2 instead.', [], '', True),
    ('7', 'ME', 'Then all mouth shapes, then the expression sheet, six poses and a 360° turn, for your OK. '
     'After that, the animation plan.', [], '', True),
]
if __name__ == '__main__':
    board('Plan: his brows, cheeks and mouth', SUB, steps, 'plan-face.png')
