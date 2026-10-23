"""The skin lids (tripo_lids.py) checked: rest, smile, laugh, blink, wide; the
whole face front and three-quarter, and one eye close up. out/plan/lids-test.png

  python3 tripo_lidtest.py [tag]
"""
import os, sys
import numpy as np
import bpy
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build
from tripo_face import set_face
from tripo_faceplan import shot

HERE = os.path.dirname(os.path.abspath(__file__))
TMP = os.path.join(HERE, 'in', 'faceplan')
STATES = [
    ('rest', dict()),
    ('smile', dict(close=0, cheek=(1, 1), lower=(.3, .3), brow=((2, 0), (2.4, 0)))),
    ('laugh', dict(close=0, cheek=(1.6, 1.6), happy=1, brow=((2.8, 0), (3.4, 0)))),
    ('blink', dict(lid=(1, 1))),
    ('wide', dict(lid=(0, 0), brow=((5, 0), (6, 0)))),
]
if __name__ == '__main__':
    tag = sys.argv[1] if len(sys.argv) > 1 else ''
    bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'in', 'tripo-face.blend'))
    ob = bpy.data.objects['Mesh_0']
    build.STYLE_NOW = 'tripo'; cam = build.studio(); sc = bpy.context.scene; sc.camera = cam
    sc.cycles.samples = int(os.environ.get('SAMPLES', 16))
    op = np.load(os.path.join(HERE, 'in', 'mouth-opening.npz')); CX = float(op['CX'])
    eL = bpy.data.objects['Eye.L'].matrix_world.translation
    f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 26)
    rows = []
    for name, ctl in STATES:
        set_face(ob, **ctl)
        a = shot(os.path.join(TMP, f'lt-{name}-front.png'), (CX, 0, .74), .95, 0, 2, (480, 360))
        b = shot(os.path.join(TMP, f'lt-{name}-34.png'), (CX, 0, .74), .95, -35, 3, (480, 360))
        c = shot(os.path.join(TMP, f'lt-{name}-eye.png'), (eL.x, 0, eL.z), .42, -8, 4, (480, 360))
        row = Image.new('RGB', (480 * 3 + 40, 400), 'white'); g = ImageDraw.Draw(row)
        g.text((10, 6), name, font=f, fill=(37, 46, 109))
        row.paste(a, (0, 40)); row.paste(b, (500, 40)); row.paste(c, (1000, 40)); rows.append(row)
    sheet = Image.new('RGB', (rows[0].width, 400 * len(rows)), 'white')
    for i, r in enumerate(rows):
        sheet.paste(r, (0, 400 * i))
    sheet.save(os.path.join(HERE, 'out', 'plan', f'lids-test{tag}.png'))
    print('done')
