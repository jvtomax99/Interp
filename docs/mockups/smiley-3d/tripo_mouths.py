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
    'smile':     dict(close=0, cheek=(1, 1), brow=((2, 0), (2.4, 0))),
    # pushed toward the size of his drawings (Jose: "push them further"), the
    # muscles past their natural strength the way a cartoon exaggerates
    'laugh':     dict(close=0, mouth={'JawOpen': 1.2, 'CornerUp.L': 1, 'CornerUp.R': 1}, cheek=(1.6, 1.6),
                      brow=((2.8, 0), (3.4, 0)), happy=1),   # eyes shut in an upward curve, the cheeks pushed up
    # after the muscles (tripo_muscles.py, Jose 2026-10-22: "how a normal person makes
    # mouth reactions"): surprise is the jaw dropping with the lips let go (AU 26), not a
    # pucker; sadness pulls the corners down (15) and the chin up into a pout (17);
    # worry stretches the lips sideways (20); doubt dimples one corner (14)
    # a round "oh": the lips gathered into an oval, the skin round them following gently
    'surprised': dict(close=0, mouth={'O': 1, 'JawOpen': 1.1},
                      brow=((5, 0), (6, 0)), lid=(0, 0)),   # lids up from rest: white above the iris is the surprise
    'sad':       dict(close=1, mouth={'AU.Relax.L': 1, 'AU.Relax.R': 1, 'AU.CornerDepress.L': 1.15, 'AU.CornerDepress.R': 1.15,
                                      'AU.ChinRaise': 1.6}, brow=((1.2, 15), (1.4, 18)), lid=(.5, .5)),   # heavy lids, as drawn
    'worried':   dict(close=1, mouth={'AU.Relax.L': 1, 'AU.Relax.R': 1, 'AU.LipStretch.L': 1.25, 'AU.LipStretch.R': 1.25,
                                      'AU.CornerDepress.L': .6, 'AU.CornerDepress.R': .85}, brow=((1.6, 18), (2, 21))),
    'doubt':     dict(close=1, mouth={'AU.Relax.R': 1.2, 'AU.Dimple.L': 1.6, 'CornerUp.L': .6}, lid=(.32, .62),   # one eye half shut, as drawn
                  brow=((3.6, 5), (-1.4, 3))),
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


UP_FADE = .035   # .022 still pinched the skin under the nose
NOSE_Z = .69      # the bottom of his nose


def oval(co0, X, ZU, ZL, front, a=.02, b=.012):
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
    # how much of the squeeze each bit of skin gets: all of it on the lips, fading out
    # gradually above and below, the way a cheek follows a pucker (cut off 1 cm above the
    # lip, the skin creased from the nose to the corners)
    reach = np.where(z > zu, np.exp(-((z - zu) / UP_FADE) ** 2), np.where(z < zl, np.exp(-((zl - z) / .035) ** 2), 1.))
    # never the nose (it was pinched narrow); only the nose: across the whole face that line creased the cheeks
    reach *= 1 - smooth((z - NOSE_Z) / .012) * (1 - smooth((np.abs(x - xm) - .022) / .05))
    edge = 1 - smooth(past / .025)
    dz *= edge
    wall = front * (1 - smooth((y + .105) / .022))
    co = co0.copy()
    co[:, 0] += dx * reach * wall
    co[:, 2] += dz * wall
    co[:, 1] -= .006 * (1 - np.abs(v)) * inside * reach * wall      # pucker
    return co


def fit_line(co0, X, ZU, ZL, teeth, front, xs, zs):
    """A closed mouth fitted to a traced lip line (tripo_trace.py): on top of
    Mouth.Close1, his closed line's ends go to the tracing's ends, each point
    between to its place along it, up or down onto it. Both lips near the
    line move together; past the corners the move fades out."""
    from tripo_mouthtest import UPPER
    shut = close_mouth(co0, X, ZU, ZL, 1, teeth)
    x, y = co0[:, 0], co0[:, 1]
    X0, X1 = X.min(), X.max()
    zc = np.interp(x, X, ZU) - UPPER * (np.interp(x, X, ZU) - np.interp(x, X, ZL))
    u = np.clip((x - X0) / (X1 - X0), 0, 1)
    nx = xs[0] + u * (xs[-1] - xs[0])
    past = np.maximum(np.maximum(X0 - x, x - X1), 0)
    fade = 1 - smooth(past / .025)
    dz = (np.interp(nx, xs, zs) - zc) * fade
    dx = (nx - np.clip(x, X0, X1)) * fade
    off = np.abs(shut[:, 2] - zc)
    wall = front * (1 - smooth((y + .105) / .022))
    co = co0.copy()
    co[:, 2] += dz * (1 - smooth((off - .004) / .024)) * wall
    co[:, 0] += dx * (1 - smooth((off - .004) / .016)) * wall     # sideways only near the lips (it creased under the nose)
    return co


def fit_open(co0, X, ZU, ZL, front, xs, tops, bots):
    """An open mouth fitted to a traced opening: each column of his lips moved
    in to its place across the tracing, the top edge onto its top, the bottom
    edge (and the jaw under it) onto its bottom."""
    x, y, z = co0.T
    X0, X1 = X.min(), X.max()
    zu, zl = np.interp(x, X, ZU), np.interp(x, X, ZL)
    h = zu - zl
    u = np.clip((x - X0) / (X1 - X0), 0, 1)
    nx = xs[0] + u * (xs[-1] - xs[0])
    du, dl = np.interp(nx, xs, tops) - zu, np.interp(nx, xs, bots) - zl
    t = np.clip((z - zl) / np.maximum(h, 1e-6), 0, 1)
    dz = np.where(z > zu, du * (1 - smooth((z - zu) / .012)),
                  np.where(z < zl, dl * (1 - smooth((zl - z) / .045)), dl * (1 - t) + du * t))
    past = np.maximum(np.maximum(X0 - x, x - X1), 0)
    fade = 1 - smooth(past / .06)
    dx = (nx - np.clip(x, X0, X1)) * fade
    # a pucker pulls the cheeks and the skin under the nose in too: kept to the
    # lips alone, the squeeze (10 cm to 4) creased from the nose down
    reach = (1 - smooth((z - zu) / .03)) * (1 - smooth((zl - .004 - z) / .04))
    wall = front * (1 - smooth((y + .105) / .022))
    co = co0.copy()
    co[:, 0] += dx * reach * wall
    co[:, 2] += dz * (1 - smooth(past / .025)) * wall
    inside = (x > X0) & (x < X1)
    co[:, 1] -= .005 * np.sin(np.pi * u) * inside * reach * wall    # the lips push forward a little
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
    # only the lower jaw drops: the upper lip and top teeth stay with the skull (a rising
    # upper lip dragged the teeth and streaked them)
    add_key(ob, 'Mouth.JawOpen', close_mouth(co0, X, ZU, ZL, -.55, teeth, upper=0))
    for s in (L, R):
        # down past his smile's upward curve (~8 mm), or a frown reads as neutral
        add_key(ob, f'Mouth.CornerDown.{s}', corner(co0, X, ZU, ZL, s, -.013, front))
        add_key(ob, f'Mouth.CornerUp.{s}', corner(co0, X, ZU, ZL, s, .006, front))
    add_key(ob, 'Mouth.Narrow', narrow(co0, X, ZU, ZL, front))
    add_key(ob, 'Mouth.Frown', frown(co0, X, ZU, ZL, teeth, front))
    add_key(ob, 'Mouth.O', oval(co0, X, ZU, ZL, front))
    # his three mouths traced from the drawings (Jose's pick)
    from tripo_trace import trace
    from tripo_mouthtest import UPPER
    for n in ('sad', 'worried'):
        xs, zs = trace(n, X, ZU, ZL, UPPER)['line']
        add_key(ob, 'Mouth.' + n.capitalize(), fit_line(co0, X, ZU, ZL, teeth, front, xs, zs))
    xs, tops, bots = trace('surprised', X, ZU, ZL, UPPER)['open']
    add_key(ob, 'Mouth.Surprised', fit_open(co0, X, ZU, ZL, front, xs, tops, bots))
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'in', 'tripo-face.blend'))
    # the sheet: tripo_muscles.py draws it, once its keys are in


def render_sheet(ob, CX, name='mouths.png'):
    """Each drawn mouth, then his, close up and the whole face: out/plan/<name>."""
    build.STYLE_NOW = 'tripo'
    cam = build.studio(); sc = bpy.context.scene; sc.camera = cam
    sc.cycles.samples = int(os.environ.get('SAMPLES', 16))
    strip = Image.open(os.path.join(HERE, '..', '..', '..', 'drsmiley', 'face.webp')).convert('RGBA')
    rows = []
    f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
    for name_, ctl in MOUTHS.items():
        set_face(ob, **ctl)
        close = shot(os.path.join(TMP, f'mo-{name_}.png'), (CX, 0, .672), .5, -10, 2, (480, 360))
        face = shot(os.path.join(TMP, f'mf-{name_}.png'), (CX, 0, .74), .95, -12, 3, (480, 360))
        k = DRAWN.index(name_)
        m = strip.crop((k * 302, 0, k * 302 + 302, 222)); bg = Image.new('RGBA', m.size, (255, 255, 255, 255)); bg.alpha_composite(m)
        drawn = bg.convert('RGB').resize((302 * 360 // 222, 360))
        row = Image.new('RGB', (drawn.width + 480 * 2 + 24, 360 + 50), 'white')
        ImageDraw.Draw(row).text((10, 8), name_, font=f, fill=(37, 46, 109))
        row.paste(drawn, (0, 50)); row.paste(close, (drawn.width + 12, 50)); row.paste(face, (drawn.width + 492 + 12, 50))
        rows.append(row)
    sheet = Image.new('RGB', (rows[0].width, sum(r.height + 16 for r in rows)), 'white')
    y = 0
    for r in rows:
        sheet.paste(r, (0, y)); y += r.height + 16
    sheet.save(os.path.join(HERE, 'out', 'plan', name))
    print('done')
