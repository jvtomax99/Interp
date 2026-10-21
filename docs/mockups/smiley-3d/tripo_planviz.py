"""Pictures for the skeleton + face plan on Jose's (fixed) Tripo model:
out/plan/tripo-skeleton.png (planned bones over him), out/plan/tripo-face-plan.png."""
import os, sys, math
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build

HERE = os.path.dirname(os.path.abspath(__file__))
OUTD = os.path.join(HERE, 'out', 'plan')
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
NAVY, CYAN = (37, 46, 109), (1, 184, 230)
# Planned joints (x, z in metres, he is 1 m), measured off the mesh: legs part
# below .25, hands hang at |x| ~.2 down to .24, shoulders at .53, neck .60.
J = {'root': (0, 0), 'hips': (0, .27), 'spine': (0, .40), 'chest': (0, .53), 'neck': (0, .60), 'head': (0, .64), 'top': (0, .95)}
for s, sx in (('L', 1), ('R', -1)):
    J.update({f'sh{s}': (.04 * sx, .53), f'arm{s}': (.14 * sx, .53), f'elb{s}': (.18 * sx, .42), f'wri{s}': (.195 * sx, .31),
              f'hand{s}': (.20 * sx, .24), f'hip{s}': (.065 * sx, .25), f'knee{s}': (.068 * sx, .14), f'ank{s}': (.07 * sx, .05),
              f'toe{s}': (.075 * sx, .01)})
CHAIN = [('root', 'hips'), ('hips', 'spine'), ('spine', 'chest'), ('chest', 'neck'), ('neck', 'head'), ('head', 'top')]
for s in 'LR':
    CHAIN += [('chest', f'sh{s}'), (f'sh{s}', f'arm{s}'), (f'arm{s}', f'elb{s}'), (f'elb{s}', f'wri{s}'), (f'wri{s}', f'hand{s}'),
              ('hips', f'hip{s}'), (f'hip{s}', f'knee{s}'), (f'knee{s}', f'ank{s}'), (f'ank{s}', f'toe{s}')]

bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'in', 'tripo-fixed.blend'))
ob = [o for o in bpy.data.objects if o.type == 'MESH'][0]
build.STYLE_NOW = 'tripo'
cam = build.studio(); sc = bpy.context.scene
sc.cycles.samples = 24
W, H = 540, 960
sc.render.resolution_x, sc.render.resolution_y = W, H
build.look(cam, (0, 0, .5), 4.4, 0, 2)
bpy.context.view_layer.update()
f = os.path.join(OUTD, 'tripo-skeleton.png'); sc.render.filepath = f; bpy.ops.render.render(write_still=True)
im = Image.blend(Image.open(f).convert('RGB'), Image.new('RGB', (W, H), 'white'), .4)
g = ImageDraw.Draw(im)
yfront = -.06
P = lambda k: (lambda v: (v.x * W, (1 - v.y) * H))(world_to_camera_view(sc, cam, Vector((J[k][0], yfront, J[k][1]))))
for a, b in CHAIN:
    g.line([P(a), P(b)], fill=NAVY, width=6)
for k in J:
    x, y = P(k); g.ellipse((x - 7, y - 7, x + 7, y + 7), fill='white', outline=NAVY, width=3)
for s in 'LR':                                   # fingers, small, at each hand
    x, y = P(f'hand{s}')
    for i in range(4):
        dx = (i - 1.5) * 5
        g.line([(x + dx, y), (x + dx * 1.3, y + 16)], fill=CYAN, width=3)
im.save(f)

# the face: a close-up with what moves, and the mouth shapes from his drawings
sc.render.resolution_x, sc.render.resolution_y = 700, 640
build.look(cam, (0, 0, .79), 1.25, 0, 2)
bpy.context.view_layer.update()
f2 = os.path.join(OUTD, 'tripo-face-raw.png'); sc.render.filepath = f2; bpy.ops.render.render(write_still=True)
face = Image.open(f2).convert('RGB')
g = ImageDraw.Draw(face); fnt = ImageFont.truetype(FB, 22)
FW, FH = 700, 640
Q = lambda x, z, y=-.17: (lambda v: (v.x * FW, (1 - v.y) * FH))(world_to_camera_view(sc, cam, Vector((x, y, z))))
notes = [((-.065, .775), '3D eye: blinks, looks', 'l'), ((.065, .775), '3D eye: blinks, looks', 'r'),
         ((-.07, .835), 'brow: lifts, frowns', 'l'), ((.07, .835), 'brow: lifts, frowns', 'r'),
         ((-.10, .715), 'cheek lifts', 'l'), ((.0, .675), 'mouth: shapes swap', 'r')]
for (x, z), t, side in notes:
    px, py = Q(x, z)
    g.ellipse((px - 10, py - 10, px + 10, py + 10), fill='white', outline=CYAN, width=5)
    tw = g.textlength(t, font=fnt); tx = px - 22 - tw if side == 'l' else px + 22
    tx = min(max(tx, 10), FW - tw - 12)
    g.rounded_rectangle((tx - 8, py - 18, tx + tw + 8, py + 18), 10, fill=NAVY)
    g.text((tx, py), t, font=fnt, fill='white', anchor='lm')
strip = Image.open(os.path.join(HERE, '..', '..', '..', 'drsmiley', 'face.webp')).convert('RGBA')
names = ['rest', 'smile', 'laugh', 'surprised', 'sad', 'worried', 'doubt']
FR = ['rest', 'blink1', 'blink2', 'shut', 'wink1', 'wink2', 'wink', 'smile1', 'smile2', 'smile', 'laugh1', 'laugh2', 'laugh',
      'laughB', 'lookL', 'lookR', 'love', 'sleep', 'halfL', 'halfR', 'lookU', 'lookD', 'lookUL', 'lookUR', 'lookDL', 'lookDR',
      'surprised', 'sad', 'worried', 'doubt']
mouths = Image.new('RGB', (len(names) * 100, 130), 'white'); gm = ImageDraw.Draw(mouths)
for i, n in enumerate(names):
    k = FR.index(n)
    m = strip.crop((k * 302 + 60, 110, k * 302 + 250, 222))
    bg = Image.new('RGBA', m.size, (255, 255, 255, 255)); bg.alpha_composite(m)
    mouths.paste(bg.convert('RGB').resize((95, 56)), (i * 100 + 2, 4))
    gm.text((i * 100 + 50, 80), n, font=ImageFont.truetype(FB, 15), fill=NAVY, anchor='mt')
out = Image.new('RGB', (FW, FH + 150), 'white'); out.paste(face, (0, 0)); out.paste(mouths, ((FW - mouths.width) // 2, FH + 10))
out.save(os.path.join(OUTD, 'tripo-face-plan.png'))
print('done')
