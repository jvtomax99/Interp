"""Step A's gate picture (out/plan-match.png): neutral, warm smile and joyful
laugh beside Jose's reference tiles, the old shell lids beside the new skin
lids, front and three-quarter; a blink; eye close-ups. out/plan/gateA.png

  python3 tripo_gateA.py [old.blend]     old.blend: the model before the skin lids, for the "before" tiles
"""
import os, sys
import numpy as np
import bpy
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build
from tripo_face import set_face
from tripo_faceplan import shot
from tripo_mouths import MOUTHS

HERE = os.path.dirname(os.path.abspath(__file__))
TMP = os.path.join(HERE, 'in', 'faceplan')
REF = '/root/.claude/uploads/0a3f0758-232c-5ae0-8fad-34b3e0089a86/8238b9ff-image.png'
TILES = {'rest': (60, 100, 460, 400), 'smile': (560, 100, 960, 400), 'laugh': (60, 470, 460, 770), 'blink': (560, 1210, 960, 1510)}
LABEL = {'rest': 'neutral', 'smile': 'warm smile', 'laugh': 'joyful laugh', 'blink': 'relaxed blink'}
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'


def faces(blend, tag):
    bpy.ops.wm.open_mainfile(filepath=blend)
    ob = bpy.data.objects['Mesh_0']
    build.STYLE_NOW = 'tripo'; cam = build.studio(); sc = bpy.context.scene; sc.camera = cam
    sc.cycles.samples = int(os.environ.get('SAMPLES', 20))
    op = np.load(os.path.join(HERE, 'in', 'mouth-opening.npz')); CX = float(op['CX'])
    eL = bpy.data.objects['Eye.L'].matrix_world.translation
    out = {}
    states = dict(MOUTHS)
    states['blink'] = dict(close=1, lid=(1, 1))
    for name in ('rest', 'smile', 'laugh', 'blink'):
        set_face(ob, **states[name])
        out[name, 'front'] = shot(os.path.join(TMP, f'ga-{tag}-{name}-front.png'), (CX, 0, .74), .95, 0, 2, (480, 360))
        out[name, '34'] = shot(os.path.join(TMP, f'ga-{tag}-{name}-34.png'), (CX, 0, .74), .95, -35, 3, (480, 360))
        out[name, 'eye'] = shot(os.path.join(TMP, f'ga-{tag}-{name}-eye.png'), (eL.x, 0, eL.z), .42, -8, 4, (480, 360))
    return out


if __name__ == '__main__':
    old = sys.argv[1] if len(sys.argv) > 1 and os.path.exists(sys.argv[1]) else None
    before = faces(old, 'old') if old else {}
    now = faces(os.path.join(HERE, 'in', 'tripo-face.blend'), 'new')
    ref = Image.open(REF).convert('RGB')
    f = ImageFont.truetype(FB, 24)
    W = 480; G = 12
    rows = []
    for name in ('rest', 'smile', 'laugh', 'blink'):
        tiles = [(LABEL[name] + ': your reference', ref.crop(TILES[name]).resize((W, 360)))]
        if before:
            tiles.append(('before (shell lids)', before[name, 'front']))
        tiles += [('now, front', now[name, 'front']), ('now, three-quarter', now[name, '34']), ('now, one eye', now[name, 'eye'])]
        row = Image.new('RGB', ((W + G) * len(tiles), 360 + 40), 'white'); g = ImageDraw.Draw(row)
        for i, (lab, im) in enumerate(tiles):
            g.text(((W + G) * i + 8, 6), lab, font=f, fill=(37, 46, 109)); row.paste(im, ((W + G) * i, 40))
        rows.append(row)
    sheet = Image.new('RGB', (max(r.width for r in rows), sum(r.height + 10 for r in rows)), 'white')
    y = 0
    for r in rows:
        sheet.paste(r, (0, y)); y += r.height + 10
    sheet.save(os.path.join(HERE, 'out', 'plan', 'gateA.png'))
    print('done')
