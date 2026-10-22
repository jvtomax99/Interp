"""His mouth moved the way a person's moves (Jose, 2026-10-22: "study how a
normal person makes mouth reactions"): building blocks after the Facial
Action Coding System's action units (Ekman & Friesen; the emotion recipes as
in Matsumoto & Ekman 2008, Scholarpedia "Facial expression analysis":
happiness 6+12, sadness 1+4+15+17, surprise 1+2+5+25/26, fear
1+2+4+5+7+20+25/26). Each is one muscle's pull on his own surface:

  AU12off   SmileOff.L/R      his sculpted smile let go: corner in and down, the cheek with it
  AU15      CornerDepress.L/R corner pulled down and a little out (depressor anguli oris)
  AU17      ChinRaise         chin boss up, pushing the lower lip up and out: the pout
  AU20      LipStretch.L/R    corner pulled straight back to the side (risorius)
  AU14      Dimple.L/R        corner tightened in and back: the smirk's dimple
  AU26      (Mouth.JawOpen)   the jaw drops, lips relaxed

A mouth corner sits in a knot of muscle that drags a wide patch of cheek with
it: every corner move here carries the cheek over ~4-5 cm, fading out, which
is what kept the lips from creasing when pulled alone.

  python3 tripo_muscles.py      -> keys in in/tripo-face.blend, out/plan/muscles-*.png
"""
import os, sys
import numpy as np
import bpy
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build
from tripo_face import add_key, set_face, L, R
from tripo_faceplan import smooth, shot, label

HERE = os.path.dirname(os.path.abspath(__file__))
TMP = os.path.join(HERE, 'in', 'faceplan')


def side_fade(x, y, xm):
    """Fades out toward the sides of his face, by how far out to the side, not by
    depth: the mouth goes deep at its corners, and a fade by depth left the
    inside of each corner half behind the lips, tearing it open into a slit."""
    return (1 - smooth((np.abs(x - xm) - .085) / .03)) * (1 - smooth((y + .06) / .015))


def corner_soften(co0, X, ZU, ZL, side, r0=.007, ring=.016):
    """His smile's dimple at one mouth corner filled in: the pit pressed out to
    the skin round it. When the smile lets go a real corner's pit softens;
    pulled down hard, his sculpted pit tore into a V notch."""
    from tripo_faceplan import fit_surface
    i = 0 if side == R else -1
    cx, cz = X[i], (ZU[i] + ZL[i]) / 2
    x, y, z = co0.T
    r = np.hypot(x - cx, z - cz)
    near = (r < ring + .004) & (y < -.08)
    ringm = near & (r > r0 + .002) & (r < ring)
    S = fit_surface(co0[ringm][:, [0, 2]], y[ringm])
    w = (1 - smooth((r - r0) / (ring - r0))) * near
    target = S(x[near], z[near])
    co = co0.copy()
    co[near, 1] = y[near] + (np.minimum(target, y[near]) - y[near]) * w[near]    # only ever outward, to the skin
    return co


def corner_pull(co0, X, ZU, ZL, side, d, rx=.05, rz=.04, below=None, keep_middle=True):
    """One mouth corner moved by d (dx outward, dy forward, dz up), the skin
    round it following over an ellipse rx by rz (below: a different reach
    under the corner). The middle of the mouth stays put."""
    i = 0 if side == R else -1
    cx, cz = X[i], (ZU[i] + ZL[i]) / 2
    xm, hw = (X.min() + X.max()) / 2, (X.max() - X.min()) / 2
    out = -1 if side == R else 1
    x, y, z = co0.T
    rzz = np.where(z < cz, below or rz, rz)
    r = np.hypot((x - cx) / rx, (z - cz) / rzz)
    ramp = np.clip((x - xm) * out / hw, 0, 1) ** .7               # 0 at the middle, 1 at the corner and past it
    w = (1 - smooth(r)) * (ramp if keep_middle else 1) * ((x - xm) * out > 0)
    w *= side_fade(x, y, xm)
    co = co0.copy()
    co[:, 0] += d[0] * out * w; co[:, 1] -= d[1] * w; co[:, 2] += d[2] * w
    return co


def chin_raise(co0, X, ZU, ZL, up=.006, fwd=.005):
    """The chin muscle: the chin boss up, the lower lip pushed up and out."""
    xm = (X.min() + X.max()) / 2
    zl = float(np.interp(xm, X, ZL))
    x, y, z = co0.T
    r = np.hypot((x - xm) / .034, (z - (zl - .02)) / .03)
    w = (1 - smooth(r)) * (z < zl + .004) * side_fade(x, y, xm)
    co = co0.copy(); co[:, 2] += up * w; co[:, 1] -= fwd * w
    return co


def diagram(ob, X, ZU, ZL, CX):
    """out/plan/muscles.png: his face at rest with each muscle's pull drawn on."""
    from mathutils import Vector
    from bpy_extras.object_utils import world_to_camera_view
    build.STYLE_NOW = 'tripo'
    cam = build.studio(); sc = bpy.context.scene; sc.camera = cam; sc.cycles.samples = 16
    set_face(ob, close=1)
    W, H = 900, 900
    im = shot(os.path.join(TMP, 'muscles-base.png'), (CX, 0, .72), 1.05, 0, 3, (W, H))
    dg = bpy.context.evaluated_depsgraph_get()
    def P(x, z):
        hit, loc, *_ = sc.ray_cast(dg, Vector((x, -1, z)), Vector((0, 1, 0)))
        v = world_to_camera_view(sc, cam, loc if hit else Vector((x, -.15, z)))
        return v.x * W, (1 - v.y) * H
    g = ImageDraw.Draw(im); f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
    def arrow(a, b, colour, text, side):
        (x0, y0), (x1, y1) = P(*a), P(*b)
        g.line((x0, y0, x1, y1), fill=colour, width=7)
        import math
        ang = math.atan2(y1 - y0, x1 - x0)
        for da in (2.6, -2.6):
            g.line((x1, y1, x1 + 22 * math.cos(ang + da), y1 + 22 * math.sin(ang + da)), fill=colour, width=7)
        tw = g.textlength(text, font=f)
        tx = x1 + 14 if side == 'r' else x1 - 14 - tw
        g.rounded_rectangle((tx - 8, y1 - 18, tx + tw + 8, y1 + 18), 10, fill=colour)
        g.text((tx, y1), text, font=f, fill='white', anchor='lm')
    cl, cr = (X[0], (ZU[0] + ZL[0]) / 2 - .012), (X[-1], (ZU[-1] + ZL[-1]) / 2 - .012)
    xm = (X.min() + X.max()) / 2
    zl = float(np.interp(xm, X, ZL))
    NAVY, CYAN, RED, GREEN, PURPLE = (37, 46, 109), (1, 140, 190), (194, 72, 92), (30, 140, 90), (120, 70, 160)
    arrow(cr, (cr[0] + .03, cr[1] + .03), GREEN, 'smile (up, out)', 'r')
    arrow(cr, (cr[0] + .035, cr[1] - .004), CYAN, 'stretch (sideways)', 'r')
    arrow(cl, (cl[0] - .006, cl[1] - .03), RED, 'corners down (sad)', 'l')
    arrow(cl, (cl[0] + .012, cl[1] + .004), PURPLE, 'dimple (doubt)', 'l')
    arrow((xm, zl - .045), (xm, zl - .02), NAVY, 'chin up: pout (sad)', 'r')
    arrow((xm + .02, zl - .05), (xm + .02, zl - .085), (90, 100, 120), 'jaw drops (surprise)', 'r')
    im.save(os.path.join(HERE, 'out', 'plan', 'muscles.png'))


if __name__ == '__main__':
    bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'in', 'tripo-face.blend'))
    ob = bpy.data.objects['Mesh_0']
    kb = ob.data.shape_keys.key_blocks
    for k in list(kb):
        if k.name.startswith('AU.'):
            ob.shape_key_remove(k)
    co0 = np.array([v.co for v in kb['Basis'].data])
    op = np.load(os.path.join(HERE, 'in', 'mouth-opening.npz'))
    X, ZU, ZL, CX = op['X'], op['ZU'], op['ZL'], float(op['CX'])
    for s in (L, R):
        # his sculpt has a strong smile in it (corners 9-14 mm above the middle): letting it
        # go has to bring them most of the way down before the other muscles read
        # mostly down, only a little in: 20 mm in squeezed the lips ~40% and bunched them
        add_key(ob, f'AU.SmileOff.{s}', corner_pull(co0, X, ZU, ZL, s, (-.009, 0, -.012)))
        # the open mouth curves up harder at its corners: letting go there takes more
        add_key(ob, f'AU.SmileOffOpen.{s}', corner_pull(co0, X, ZU, ZL, s, (-.018, 0, -.017)))
        add_key(ob, f'AU.CornerDepress.{s}', corner_pull(co0, X, ZU, ZL, s, (.003, 0, -.015), rx=.042, rz=.018, below=.045))
        add_key(ob, f'AU.LipStretch.{s}', corner_pull(co0, X, ZU, ZL, s, (.008, -.002, -.002), rx=.045, rz=.03))
        add_key(ob, f'AU.Dimple.{s}', corner_pull(co0, X, ZU, ZL, s, (-.003, -.004, .001), rx=.016, rz=.014))
    add_key(ob, 'AU.ChinRaise', chin_raise(co0, X, ZU, ZL))
    for s in (L, R):
        add_key(ob, f'AU.CornerSoften.{s}', corner_soften(co0, X, ZU, ZL, s))
    # with the lips closed, letting go of the smile moves the line where they meet,
    # both lips following it (fit_line): pulling closed lips sideways by the corners
    # pushed a bump of lower lip up over the line near each corner
    from tripo_mouths import fit_line
    from tripo_mouthtest import UPPER, teeth_vertices
    teeth = teeth_vertices(ob)
    xm, hw = (X.min() + X.max()) / 2, (X.max() - X.min()) / 2
    xs = np.linspace(X.min(), X.max(), 200)
    u = (xs - xm) / hw
    zc = np.interp(xs, X, ZU) - UPPER * (np.interp(xs, X, ZU) - np.interp(xs, X, ZL))
    for s, side in ((L, xs > xm), (R, xs <= xm)):
        k = np.where(side, 1, 0)
        tx = xs - np.sign(u) * .009 * np.abs(u) * k
        tz = zc - .012 * np.abs(u) ** 1.5 * k
        add_key(ob, f'AU.Relax.{s}', fit_line(co0, X, ZU, ZL, teeth, (co0[:, 1] < -.08).astype(float), tx, tz))
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'in', 'tripo-face.blend'))
    from tripo_mouths import render_sheet
    render_sheet(ob, CX)
    diagram(ob, X, ZU, ZL, CX)
    print('keys', [k.name for k in kb if k.name.startswith('AU.')])
