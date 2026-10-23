"""The plan for his teeth and eyes (Jose 2026-10-22: "the goal is to look alive
and human like; the teeth needs work and the eyes needs work"):
out/plan-alive.png, from close-ups of the rig as it is (out/plan/cu-*.png)."""
from PIL import Image, ImageDraw, ImageFont
from storyboard import O, fit, board, FB

def tag(im, text):
    g = ImageDraw.Draw(im); f = ImageFont.truetype(FB, 24); tw = g.textlength(text, font=f)
    g.rounded_rectangle((10, 10, 30 + tw, 46), 10, fill=(194, 72, 92)); g.text((20, 28), text, font=f, fill='white', anchor='lm')
    return im

def row(names, tags):
    ims = [tag(Image.open(O('plan/' + n + '.png')).convert('RGB'), t) for n, t in zip(names, tags)]
    out = Image.new('RGB', (sum(i.width for i in ims) + 12 * (len(ims) - 1), ims[0].height), 'white')
    x = 0
    for i in ims:
        out.paste(i, (x, 0)); x += i.width + 12
    return fit(out, 1000, 400)

board('Plan: teeth and eyes that look alive', ['Close-ups of him now; red tags are what reads fake.', 'Nothing is built until you say OK.'], [
    ('1', 'ME', 'Teeth now: one flat white band, no separate teeth, no gums, no lower teeth; when the jaw opens, the back of '
     'the band shows as a streaky curtain.', [row(['cu-teeth-smile', 'cu-teeth-laugh', 'cu-teeth-surprised'],
     ['one flat band', 'streaky curtain', 'slab, no lower teeth'])], 'smile, laugh, surprised', False),
    ('2', 'ME', 'Teeth plan: real 3D teeth in his style (soft, rounded, gently separated, like a Pixar child): an upper row '
     'fixed to his skull, a lower row and gums that move with the jaw, a rounded tongue. His painted band is tucked away.',
     [], '', True),
    ('3', 'ME', 'Eyes now: flat painted iris, a sticker shine, eyeliner that floats off the eye from the side, pure white '
     'whites, and a lowered lid that is a flat card with a hard edge. No lower lid.',
     [row(['cu-eye', 'cu-eye34', 'cu-eye-sad'], ['flat iris, sticker shine', 'liner floats', 'card lid'])], 'front, side, sad', False),
    ('4', 'ME', 'Eyes plan, in this order: (a) a clear dome over the iris so the shine comes from the light and moves; '
     '(b) iris with fine fibres, a darker rim and depth; (c) lids with real thickness and a rounded edge, lashes growing '
     'from the lid instead of the floating liner; (d) soft shading in the whites and pink inner corners; (e) a lower lid, '
     'so he can squint and his laugh can shut the eyes in happy arcs. Each step shown before/after.', [], '', True),
], 'plan-alive.png')
