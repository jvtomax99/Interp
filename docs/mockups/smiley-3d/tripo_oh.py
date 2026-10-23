"""The surprised "oh", second build (Jose 2026-10-23: the "oh" first of the
leftovers). The first `oval()` mapped his whole smile onto a small oval: the
corner skin travelled 32 mm, which creased the cheeks from the nose to the
corners, sheared the tongue (the move faded with depth, so the tongue's tip
moved more than its back: it crumpled), and the lips rose over the teeth.

Here, as in his drawing: the corners come in (`C`), the lips meet just past
the opening and open in the middle into a shape that is flat along the upper
lip (the tooth band's edge shows under it, as he drew it) and a U below
(`A` half width, `H` height); the whole inside of the mouth scales as one
piece, so the tongue keeps its shape; the chin drops with the lower lip; the
tooth band's ends follow the corners in (a key `O2` on Teeth, set by
`set_face` with the mouth key), or they showed through the gathered lips.

Tried and dropped (2026-10-23): sliding the moved skin along his surface so
the corner skin (13 mm further back than the middle) comes forward as it
moves in. A fitted curve bent under the cavity's roof; a grid of the most
forward points broke where the skin is steep; ray casts read a lip rim's
underside. The band following the corners removed the need.

  python3 tripo_oh.py            -> out/plan/oh2.png (drawing | before | after, close and whole face)
  SAVE=1 python3 tripo_oh.py     -> also writes Mouth.O2 (and Teeth's O2) into in/tripo-face.blend
"""
import os, sys
import numpy as np
import bpy
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build
from tripo_face import add_key, set_face
from tripo_faceplan import smooth, shot
from tripo_mouthtest import teeth_vertices
from tripo_mouths import MOUTHS, NOSE_Z

HERE = os.path.dirname(os.path.abspath(__file__))
TMP = os.path.join(HERE, 'in', 'faceplan')
A = float(os.environ.get('A', .022))      # half width of the opening (his drawing: .42 of the smile's width)
H = float(os.environ.get('H', .036))      # its height at the middle (drawing: .8 of the width)
C = float(os.environ.get('C', .026))      # how far each corner comes in (the lips meet just past the opening)
TOP_RISE = .003                            # the upper lip's edge rises this much toward the corners
TOP_LIFT = float(os.environ.get('TOP_LIFT', -.004))  # the whole edge: at 0, 8 mm of the band showed, a grin; -4 mm is the thin sliver he drew
JAW_FADE = .045                            # the chin follows the lower lip, fading out this far below
UP_FADE2 = float(os.environ.get('UP_FADE', .02))     # the squeeze fades out this far above the upper lip (.035 reached the nose: a crease)
NOSE_BLEND = .02                           # the nose guard fades in over this height


def oval2(co0, X, ZU, ZL, teeth, front, a=A, hgt=H, c=C):
    xm, hw = (X.min() + X.max()) / 2, (X.max() - X.min()) / 2
    x, y, z = co0.T
    zu, zl = np.interp(x, X, ZU), np.interp(x, X, ZL)
    h = zu - zl
    # the corners in by c: one scale about the middle for everything near the mouth
    k = 1 - c / hw
    nx = xm + (x - xm) * k
    v = np.clip((nx - xm) / a, -1, 1)
    zt = float(np.interp(xm, X, ZU))                  # the upper lip's edge keeps its height
    top = zt + TOP_LIFT + TOP_RISE * v * v
    bot = top - hgt * (1 - v * v) ** .6               # a U, fuller than an ellipse; past the opening the lips meet (top = bot)
    du, dl = top - zu, bot - zl
    w_up = 1 - smooth((z - zu) / .012)
    w_lo = 1 - smooth((zl - z) / JAW_FADE)
    t = np.clip((z - zl) / np.maximum(h, 1e-6), 0, 1)
    dz = np.where(z > zu, du * w_up, np.where(z < zl, dl * w_lo, dl * (1 - t) + du * t))
    past = np.maximum(np.abs(x - xm) - hw, 0)
    dx = np.where(np.abs(x - xm) < hw, nx - x, -np.sign(x - xm) * c * (1 - smooth(past / .04)))
    reach = np.where(z > zu, np.exp(-((z - zu) / UP_FADE2) ** 2), np.where(z < zl, np.exp(-((zl - z) / .035) ** 2), 1.))
    reach *= 1 - smooth((z - NOSE_Z) / NOSE_BLEND) * (1 - smooth((np.abs(x - xm) - .022) / .05))     # never the nose
    edge = 1 - smooth(past / .025)
    wall = front * (1 - smooth((y + .105) / .022))
    # the inside of the mouth (the lips' wet side, teeth, tongue, cavity): moved as one piece
    cav = (front > 0) & (y > -.1475) & (np.abs(x - xm) < hw + .008) & (z > zl - .008) & (z < zu + .012)
    co = co0.copy()
    co[:, 0] += dx * np.where(cav, 1., reach * wall)
    co[:, 2] += dz * np.where(cav, 1., edge * wall)
    inside = np.abs(nx - xm) < a
    co[:, 1] -= .004 * (1 - np.abs(v)) * inside * reach * wall      # a slight pout
    # a safety net: skin over the (gathered) band stays 3 mm in front of its front
    te = bpy.data.objects.get('Teeth')
    if te is not None:
        tc = np.array([te.matrix_world @ vv.co for vv in te.data.vertices])
        tc[:, 0] = xm + (tc[:, 0] - xm) * k                 # as the band's O2 key gathers it
        bins = np.arange(tc[:, 0].min(), tc[:, 0].max() + .002, .002)
        fr = np.array([tc[(tc[:, 0] >= b0) & (tc[:, 0] < b0 + .002), 1].min() if ((tc[:, 0] >= b0) & (tc[:, 0] < b0 + .002)).any() else np.nan for b0 in bins])
        ok = ~np.isnan(fr)
        lim = np.interp(co[:, 0], bins[ok] + .001, fr[ok], left=np.nan, right=np.nan) - .003
        near = (~cav) & (co0[:, 1] < -.1) & ~np.isnan(lim)
        soft = (1 - smooth((tc[:, 2].min() - .002 - co[:, 2]) / .006)) * (1 - smooth((co[:, 2] - tc[:, 2].max() - .002) / .006))
        kk = reach * wall * near * soft
        pushed = np.where(near, np.minimum(co[:, 1], np.nan_to_num(lim, nan=0.)) - co[:, 1], 0.)
        co[:, 1] += pushed * kk
        if os.environ.get('DEBUG'):
            m = pushed * kk < -.0003
            print('teeth limit moved', m.sum(), 'points, up to', -(pushed * kk).min() * 1000, 'mm')
    tv = teeth_vertices(bpy.data.objects['Mesh_0'])
    co[tv, 1] += .014                                       # the old painted sheet tucks out of sight
    return co


def band_key(te, X, c=C):
    """Teeth's key O2: the band's ends gathered in with the mouth's corners."""
    xm, hw = (X.min() + X.max()) / 2, (X.max() - X.min()) / 2
    k = 1 - c / hw
    if te.data.shape_keys is None:
        te.shape_key_add(name='Basis', from_mix=False)
    kb = te.data.shape_keys.key_blocks
    if 'O2' in kb:
        te.shape_key_remove(kb['O2'])
    key = te.shape_key_add(name='O2', from_mix=False); key.value = 0
    M = te.matrix_world; Mi = M.inverted()
    for i, vv in enumerate(te.data.vertices):
        w = M @ vv.co
        w.x = xm + (w.x - xm) * k
        key.data[i].co = Mi @ w
    return key


RECIPE = dict(close=0, mouth={'O2': 1}, brow=((5, 0), (6, 0)), lid=(0, 0))
OLD = dict(close=0, mouth={'O': 1, 'JawOpen': 1.1}, brow=((5, 0), (6, 0)), lid=(0, 0))     # the first "oh", for the before picture


if __name__ == '__main__':
    bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'in', 'tripo-face.blend'))
    ob = bpy.data.objects['Mesh_0']
    kb = ob.data.shape_keys.key_blocks
    if 'Mouth.O2' in kb:
        ob.shape_key_remove(kb['Mouth.O2'])
    co0 = np.array([v.co for v in kb['Basis'].data])
    front = (co0[:, 1] < -.08).astype(float)
    op = np.load(os.path.join(HERE, 'in', 'mouth-opening.npz'))
    X, ZU, ZL, CX = op['X'], op['ZU'], op['ZL'], float(op['CX'])
    teeth = teeth_vertices(ob)
    add_key(ob, 'Mouth.O2', oval2(co0, X, ZU, ZL, teeth, front))
    band_key(bpy.data.objects['Teeth'], X)
    if os.environ.get('SAVE'):
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'in', 'tripo-face.blend'))
    build.STYLE_NOW = 'tripo'
    cam = build.studio(); sc = bpy.context.scene; sc.camera = cam
    sc.cycles.samples = int(os.environ.get('SAMPLES', 16))
    tag = os.environ.get('TAG', '')
    states = (('after', RECIPE),) if os.environ.get('BEFORE') == '0' else (('before', OLD), ('after', RECIPE))
    cols = []
    for name, ctl in states:
        set_face(ob, **ctl)
        close = shot(os.path.join(TMP, f'oh2-{name}-close.png'), (CX, 0, .672), .5, -10, 2, (480, 360))
        face = shot(os.path.join(TMP, f'oh2-{name}-face.png'), (CX, 0, .74), .95, -12, 3, (480, 360))
        side = shot(os.path.join(TMP, f'oh2-{name}-side.png'), (CX, -.1, .672), .45, -40, 4, (480, 360))
        col = Image.new('RGB', (480, 360 * 3 + 20), 'white')
        col.paste(close, (0, 0)); col.paste(face, (0, 370)); col.paste(side, (0, 740))
        cols.append((name, col))
    strip = Image.open(os.path.join(HERE, '..', '..', '..', 'drsmiley', 'face.webp')).convert('RGBA')
    m = strip.crop((26 * 302, 0, 27 * 302, 222)); bg = Image.new('RGBA', m.size, (255, 255, 255, 255)); bg.alpha_composite(m)
    drawn = bg.convert('RGB').resize((480, 480 * 222 // 302))
    sheet = Image.new('RGB', (500 * (len(cols) + 1), 360 * 3 + 70), 'white')
    f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 28)
    g = ImageDraw.Draw(sheet)
    g.text((10, 8), 'your drawing', font=f, fill=(37, 46, 109)); sheet.paste(drawn, (0, 50))
    for i, (name, col) in enumerate(cols):
        g.text((500 + 500 * i, 8), name, font=f, fill=(37, 46, 109)); sheet.paste(col, (500 + 500 * i, 50))
    sheet.save(os.path.join(HERE, 'out', 'plan', f'oh2{tag}.png'))
    print('done')
