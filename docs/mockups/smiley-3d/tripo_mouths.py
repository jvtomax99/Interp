"""His other mouth shapes (out/plan-face.png step 4), as building blocks on
his own surface that add up like the brows: Mouth.JawOpen, Mouth.CornerDown.L/R,
Mouth.CornerUp.L/R, Mouth.Narrow. Added to in/tripo-face.blend (tripo_face.py
first). MOUTHS mixes them into his drawn expressions; out/plan-mouths.png
shows each beside the drawing.

  python3 tripo_mouths.py
"""
import os, sys
import numpy as np
import bpy
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build
from tripo_face import coords, add_key, set_face, L, R
from tripo_faceplan import smooth, shot, label
from tripo_mouthtest import close_mouth, teeth_vertices

HERE = os.path.dirname(os.path.abspath(__file__))
TMP = os.path.join(HERE, 'in', 'faceplan')
# his expressions: the closed mouth, the building blocks, cheeks and the brows the app gives
# each face (DR_BROW_OF -> DR_BROWS; the app's dy is screen-down, so lift = -dy;
# his left brow, your right, goes a fifth further: DR_BROW_SIDE)
MOUTHS = {
    'rest':      dict(close=1),
    'smile':     dict(close=0, cheek=(.6, .6), brow=((2, 0), (2.4, 0))),
    'laugh':     dict(close=0, mouth={'JawOpen': 1, 'CornerUp.L': .6, 'CornerUp.R': .6}, cheek=(1, 1), brow=((2.8, 0), (3.4, 0))),
    'surprised': dict(close=0, mouth={'O': 1}, brow=((4.2, 0), (5, 0))),
    'sad':       dict(close=1, mouth={'Frown': 1}, brow=((1, 11), (1.2, 13))),
    'worried':   dict(close=1, mouth={'Frown': .75, 'Narrow': .3}, brow=((1.4, 15), (1.7, 18))),
    'doubt':     dict(close=1, mouth={'CornerDown.R': .7, 'CornerUp.L': 1}, brow=((3, 4), (-1.2, 2.4))),
}
DRAWN = ['rest', 'blink1', 'blink2', 'shut', 'wink1', 'wink2', 'wink', 'smile1', 'smile2', 'smile', 'laugh1', 'laugh2', 'laugh',
         'laughB', 'lookL', 'lookR', 'love', 'sleep', 'halfL', 'halfR', 'lookU', 'lookD', 'lookUL', 'lookUR', 'lookDL', 'lookDR',
         'surprised', 'sad', 'worried', 'doubt']


def corner(co0, X, ZU, ZL, side, dz, front):
    """One mouth corner (and the lips and cheek round it) moved up or down;
    the middle of the mouth stays, so the line between bends."""
    i = 0 if side == R else -1                     # his right is -x
    cx, cz = X[i], (ZU[i] + ZL[i]) / 2
    x, y, z = co0.T
    r = np.hypot((x - cx) / .032, (z - cz) / .022)             # longer along the lips, so the line between bends evenly
    w = (1 - smooth(r)) * front * (1 - smooth((y + .105) / .022))
    co = co0.copy(); co[:, 2] += dz * w
    return co


def narrow(co0, X, ZU, ZL, front, amount=.03):
    """The corners pulled in toward the middle and the lips pushed forward a
    little: an O. The middle stays; the cheeks beside the corners follow."""
    xm, hw = (X.min() + X.max()) / 2, (X.max() - X.min()) / 2
    zm = float(np.mean((ZU + ZL) / 2))
    x, y, z = co0.T
    u = np.abs(x - xm) / hw
    across = np.where(u < 1, u, 1 - smooth((u - 1) * hw / .02))            # 0 in the middle, 1 at a corner, fading past it
    up_down = 1 - smooth((np.abs(z - zm) - .012) / .02)
    w = across * up_down * front * (1 - smooth((y + .105) / .022))
    co = co0.copy()
    co[:, 0] -= np.sign(x - xm) * amount * w
    co[:, 1] -= .005 * (1 - u.clip(0, 1)) * up_down * front * (np.abs(x - xm) < hw)   # pucker
    return co


def frown(co0, X, ZU, ZL, teeth, front, drop=.009):
    """The closed mouth's whole lip line bent into an arch, corners `drop`
    below the middle (his sculpted line curves up ~8 mm at the corners).
    Added on top of Mouth.Close1: the move is worked out where the lips are
    once closed, and both lips near the line move together. Bending the whole
    line, not pushing the corners, keeps his smile dimples from leaving nicks."""
    from tripo_mouthtest import UPPER
    shut = close_mouth(co0, X, ZU, ZL, 1, teeth)
    xm, hw = (X.min() + X.max()) / 2, (X.max() - X.min()) / 2
    x = co0[:, 0]
    zc = np.interp(x, X, ZU) - UPPER * (np.interp(x, X, ZU) - np.interp(x, X, ZL))     # the closed line
    zmid = float(np.interp(xm, X, ZU) - UPPER * (np.interp(xm, X, ZU) - np.interp(xm, X, ZL)))
    u = np.clip(np.abs(x - xm) / hw, 0, 1)
    f = (zmid - drop * u * u) - zc
    f *= 1 - smooth((np.abs(x - xm) - hw) / .02)                 # past the corners it fades out
    w = (1 - smooth((np.abs(shut[:, 2] - zc) - .004) / .024)) * front * (1 - smooth((co0[:, 1] + .105) / .022))
    co = co0.copy(); co[:, 2] += f * w
    return co


def oval(co0, X, ZU, ZL, front, a=.024, b=.01):
    """The surprised O: the open mouth mapped onto an oval `a` by `b` (half
    width, half height): every lip point pulled in toward the middle, the
    top edge onto the oval's top, the bottom edge onto its bottom; the skin
    round the mouth follows, the lips push forward a little."""
    xm, hw = (X.min() + X.max()) / 2, (X.max() - X.min()) / 2
    x, y, z = co0.T
    zu, zl = np.interp(x, X, ZU), np.interp(x, X, ZL)
    h = zu - zl
    zo = float(np.interp(xm, X, ZU) + np.interp(xm, X, ZL)) / 2 + .002
    inside = np.abs(x - xm) < hw
    k = a / hw
    nx = xm + (x - xm) * k                                       # where each column of the lips goes
    v = np.clip((nx - xm) / a, -1, 1)
    top, bot = zo + b * np.sqrt(1 - v * v), zo - b * np.sqrt(1 - v * v)
    du, dl = top - zu, bot - zl
    w_up = 1 - smooth((z - zu) / .012)
    w_lo = 1 - smooth((zl - z) / .03)
    t = np.clip((z - zl) / np.maximum(h, 1e-6), 0, 1)
    dz = np.where(z > zu, du * w_up, np.where(z < zl, dl * w_lo, dl * (1 - t) + du * t))
    # sideways: the lips' columns squeezed in; beyond the corners the cheek follows, fading out
    past = np.maximum(np.abs(x - xm) - hw, 0)
    dx = np.where(inside, nx - x, -np.sign(x - xm) * (hw - a) * (1 - smooth(past / .04)))
    # the squeeze stays off the skin under his nose (it creased from the nose to the cheeks)
    reach = (1 - smooth((z - zu - .002) / .01)) * (1 - smooth((zl - .004 - z) / .03))
    edge = 1 - smooth(past / .025)
    dz *= edge
    wall = front * (1 - smooth((y + .105) / .022))
    co = co0.copy()
    co[:, 0] += dx * reach * wall
    co[:, 2] += dz * wall
    co[:, 1] -= .006 * (1 - np.abs(v)) * inside * reach * wall      # pucker
    return co


if __name__ == '__main__':
    bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'in', 'tripo-face.blend'))
    ob = bpy.data.objects['Mesh_0']
    kb = ob.data.shape_keys.key_blocks
    for k in list(kb):
        if k.name.startswith('Mouth.') and not k.name.startswith('Mouth.Close'):
            ob.shape_key_remove(k)
    co0 = np.array([v.co for v in kb['Basis'].data])
    front = (co0[:, 1] < -.08).astype(float)
    op = np.load(os.path.join(HERE, 'in', 'mouth-opening.npz'))
    X, ZU, ZL, CX = op['X'], op['ZU'], op['ZL'], float(op['CX'])
    teeth = teeth_vertices(ob)
    add_key(ob, 'Mouth.JawOpen', close_mouth(co0, X, ZU, ZL, -.6, teeth))
    for s in (L, R):
        # down past his smile's upward curve (~8 mm), or a frown reads as neutral
        add_key(ob, f'Mouth.CornerDown.{s}', corner(co0, X, ZU, ZL, s, -.013, front))
        add_key(ob, f'Mouth.CornerUp.{s}', corner(co0, X, ZU, ZL, s, .006, front))
    add_key(ob, 'Mouth.Narrow', narrow(co0, X, ZU, ZL, front))
    add_key(ob, 'Mouth.Frown', frown(co0, X, ZU, ZL, teeth, front))
    add_key(ob, 'Mouth.O', oval(co0, X, ZU, ZL, front))
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'in', 'tripo-face.blend'))
    # the sheet: each drawn mouth, then his, close up and the whole face
    build.STYLE_NOW = 'tripo'
    cam = build.studio(); sc = bpy.context.scene; sc.camera = cam
    sc.cycles.samples = int(os.environ.get('SAMPLES', 16))
    strip = Image.open(os.path.join(HERE, '..', '..', '..', 'drsmiley', 'face.webp')).convert('RGBA')
    rows = []
    f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
    for name, ctl in MOUTHS.items():
        set_face(ob, **ctl)
        close = shot(os.path.join(TMP, f'mo-{name}.png'), (CX, 0, .672), .5, -10, 2, (480, 360))
        face = shot(os.path.join(TMP, f'mf-{name}.png'), (CX, 0, .74), .95, -12, 3, (480, 360))
        k = DRAWN.index(name)
        m = strip.crop((k * 302, 0, k * 302 + 302, 222)); bg = Image.new('RGBA', m.size, (255, 255, 255, 255)); bg.alpha_composite(m)
        drawn = bg.convert('RGB').resize((302 * 360 // 222, 360))
        row = Image.new('RGB', (drawn.width + 480 * 2 + 24, 360 + 50), 'white')
        ImageDraw.Draw(row).text((10, 8), name, font=f, fill=(37, 46, 109))
        row.paste(drawn, (0, 50)); row.paste(close, (drawn.width + 12, 50)); row.paste(face, (drawn.width + 492 + 12, 50))
        rows.append(row)
    sheet = Image.new('RGB', (rows[0].width, sum(r.height + 16 for r in rows)), 'white')
    y = 0
    for r in rows:
        sheet.paste(r, (0, y)); y += r.height + 16
    sheet.save(os.path.join(HERE, 'out', 'plan', 'mouths.png'))
    print('done')
