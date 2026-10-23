"""The mouth test (out/plan-face.png step 6, route 1, Jose's pick): his own
sculpted open smile closed into his resting mouth, nothing added to him.
The lower lip and chin rise most of the way (the jaw closing), the upper
lip comes down a little, they meet along a line that keeps his smile's
curve, and the teeth and tongue tuck back behind the lips.

  python3 tripo_mouthtest.py      -> out/plan/mouth-test.png

CLOSE (0..1) is how shut; UPPER is the upper lip's share of the closing.
"""
import os, sys, math
import numpy as np
import bpy, cv2
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build
from tripo_faceplan import smooth, fit_surface, set_co, shot, label, TMP

HERE = os.path.dirname(os.path.abspath(__file__))
UPPER = float(os.environ.get('UPPER', .3))
OVERLAP = .0008        # the upper lip goes this far past the meeting line, so no gap shows
# the lower lip further: its top curls inward, so its visible front stops a few mm
# short of its edge; it tucks up behind the upper lip, as real lips do
OVER_LO = float(os.environ.get('OVER_LO', .004))


def opening(ob, cx):
    """The mouth opening as you see it from the front: a flat (unlit)
    straight-on picture, the teeth and the dark inside found in it. Returns
    x positions and the top and bottom of the opening at each (metres)."""
    sc = bpy.context.scene
    hidden = [o for o in bpy.data.objects if o.type == 'MESH' and o != ob and not o.hide_render]
    for o in hidden:
        o.hide_render = True
    mat = ob.data.materials[0]; N, L = mat.node_tree.nodes, mat.node_tree.links
    out = [n for n in N if n.type == 'OUTPUT_MATERIAL'][0]; keep = out.inputs['Surface'].links[0].from_socket
    em = N.new('ShaderNodeEmission'); L.new(N['Image Texture'].outputs['Color'], em.inputs['Color']); L.new(em.outputs[0], out.inputs['Surface'])
    cd = bpy.data.cameras.new('MouthCam'); cd.type = 'ORTHO'; cd.ortho_scale = .16
    cam = bpy.data.objects.new('MouthCam', cd); sc.collection.objects.link(cam)
    cam.location = (cx, -2, .67); cam.rotation_euler = (math.radians(90), 0, 0)
    old = sc.camera, sc.cycles.samples, sc.render.resolution_x, sc.render.resolution_y, sc.view_settings.exposure
    old_vt = sc.view_settings.view_transform
    sc.view_settings.exposure = 0              # the studio's -.5 greys the teeth out of 'white'
    sc.view_settings.view_transform = 'Standard'
    sc.camera = cam; sc.cycles.samples = 4; sc.render.resolution_x = sc.render.resolution_y = 640
    path = os.path.join(TMP, 'mouth-flat.png'); sc.render.filepath = path; bpy.ops.render.render(write_still=True)
    L.new(keep, out.inputs['Surface']); N.remove(em); bpy.data.objects.remove(cam)
    sc.camera, sc.cycles.samples, sc.render.resolution_x, sc.render.resolution_y, sc.view_settings.exposure = old
    sc.view_settings.view_transform = old_vt
    for o in hidden:
        o.hide_render = False
    a = np.array(Image.open(path).convert('RGB')).astype(int)
    G = .16 / 640
    m = ((a.min(2) > 215) | (a.sum(2) < 380)).astype(np.uint8)      # teeth, or the dark inside
    n, lab, st, cent = cv2.connectedComponentsWithStats(m)
    best = max([i for i in range(1, n) if .67 - (cent[i][1] - 320) * G < .69], key=lambda i: st[i, cv2.CC_STAT_AREA])
    m = cv2.morphologyEx((lab == best).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    xs, zu, zl = [], [], []
    for c in range(640):
        r = np.nonzero(m[:, c])[0]
        if len(r):
            xs.append(cx + (c - 320) * G); zu.append(.67 - (r.min() - 320) * G); zl.append(.67 - (r.max() - 320) * G)
    return np.array(xs), np.array(zu), np.array(zl)


def close_mouth(co0, X, ZU, ZL, close, teeth, upper=None):
    co = co0.copy()
    x, y, z = co0[:, 0], co0[:, 1], co0[:, 2]
    x0, x1 = X.min(), X.max()
    near = (y < -.06) & (z > .585) & (z < .71) & (x > x0 - .04) & (x < x1 + .04)
    i = np.nonzero(near)[0]
    xi, yi, zi = x[i], y[i], z[i]
    zu, zl = np.interp(xi, X, ZU), np.interp(xi, X, ZL)
    h = zu - zl
    taper = 1 - smooth(np.maximum(x0 - xi, xi - x1) / .012)          # past the corners the move fades out
    upper = UPPER if upper is None else upper                       # the upper lip's share (opening wider: ~0, only the jaw moves)
    zc = zu - upper * h                                              # where the lips meet
    tuck = smooth(h / .006)                     # fades in from the corners (a step there creased them)
    up_by = (upper * h + OVERLAP * tuck) * taper * close
    lo_by = ((1 - UPPER) * h + OVER_LO * tuck) * taper * close
    w_up = 1 - smooth((zi - zu) / .010)          # the upper lip, fading out 10 mm above the opening
    w_lo = 1 - smooth((zl - zi) / .045)          # the lower lip and chin: the jaw, fading out 45 mm below
    # inside the opening everything is squeezed evenly from the lower lip's move to the
    # upper lip's (split into up and down at a middle line, the inside folded over itself)
    t = np.clip((zi - zl) / np.maximum(h, 1e-6), 0, 1)
    dz = np.where(zi > zu, -up_by * w_up, np.where(zi < zl, lo_by * w_lo, lo_by * (1 - t) - up_by * t))
    dz *= 1 - smooth((yi + .09) / .025)          # fades out round the sides of the chin
    # the skin around the mouth, for depth (what's behind the lips)
    ring = (np.abs(xi - (x0 + x1) / 2) < (x1 - x0) / 2 + .03) & ((zi > zu + .004) & (zi < zu + .014) | (zi < zl - .004) & (zi > zl - .02))
    S = fit_surface(np.stack([xi[ring], zi[ring]], 1), yi[ring])
    depth = yi - S(xi, zi)
    # inside the mouth: behind the lips, and only within the opening's own height
    # (the fit runs wild further out, and chin skin read as 'inside' tore his chin)
    band = (1 - smooth((zl - .004 - zi) / .004)) * (1 - smooth((zi - zu - .002) / .003))
    inner = smooth((depth - .003) / .004) * ((xi > x0 - .004) & (xi < x1 + .004)) * band
    nz = zi + dz
    late = smooth((close - .4) / .6)           # the inside moves only once the lips cover it (halfway it stretched)
    nz = nz * (1 - inner * late) + (zc + (nz - zc) * .3) * inner * late    # teeth and tongue pulled to the meeting line...
    # the lips and chin keep their own depth and just move up or down: sliding them
    # on the fitted skin pushed the lower lip 12 mm back (the fit bends the wrong
    # way across the open mouth) and tore his chin below it
    ny = yi + .008 * inner * late                                     # ...and back behind the lips
    # his upper teeth stay with his head, up behind the upper lip: the lower lip
    # curls inward at its top, so where the lips meet it sits behind where the
    # teeth were, and they showed through
    t = teeth[i] & (xi > x0 - .004) & (xi < x1 + .004)
    nz[t] = zi[t] + (zu[t] + .008 - zi[t]) * .6 * late
    ny[t] = yi[t] + .015 * late
    if close < 0:          # the jaw opening wider: the top teeth stay still with the skull (squeezed with the inside they streaked)
        nz[t] = zi[t]
    co[i, 1], co[i, 2] = ny, nz
    return co


def teeth_vertices(ob):
    """His teeth: white in the texture, in the mouth."""
    import tripo_lib as T
    # from his original colours when they are kept (tripo_fix.py's in/hair_tex.png): after
    # tripo_teeth.py the live texture has the band painted into the mouth's dark red, and
    # reading that found no teeth at all (2026-10-23: the sheet then stayed in front of the
    # 3D band in the "oh" and hid its middle)
    orig = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'in', 'hair_tex.png')
    if os.path.exists(orig):
        px = np.asarray(Image.open(orig).convert('RGBA'), dtype=np.float32)[::-1] / 255
    else:
        img, px = T.texture(ob)
    cen, tuv = T.face_arrays(ob)
    col = T.sample(px, tuv.mean(1)) * 255
    # white, or the grey shading along their edges (light and not pink): pure white
    # alone left the bottom rim behind, and it streaked when the jaw opened
    f = ((col.min(1) > 225) | ((col.min(1) > 160) & (np.ptp(col, 1) < 45))) & (cen[:, 1] < -.1) & (np.abs(cen[:, 2] - .675) < .03)
    lv = np.empty(len(ob.data.loops), dtype=np.int64); ob.data.loops.foreach_get('vertex_index', lv)
    tri = lv.reshape(-1, 3)
    m = np.zeros(len(ob.data.vertices), bool); m[tri[f].ravel()] = True
    m[tri[m[tri].any(1)].ravel()] = True          # and one ring round them
    return m


if __name__ == '__main__':
    bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'in', 'tripo-rig.blend'))
    ob = bpy.data.objects['Mesh_0']
    build.STYLE_NOW = 'tripo'
    cam = build.studio(); sc = bpy.context.scene; sc.camera = cam
    sc.cycles.samples = int(os.environ.get('SAMPLES', 16))
    eyes = [bpy.data.objects[e].matrix_world.translation.x for e in ('Eye.R', 'Eye.L')]
    CX = sum(eyes) / 2
    X, ZU, ZL = opening(ob, CX)
    print('opening x', X.min().round(4), X.max().round(4), 'tallest', round((ZU - ZL).max() * 1000, 1), 'mm')
    n = len(ob.data.vertices)
    co0 = np.empty(n * 3); ob.data.vertices.foreach_get('co', co0); co0 = co0.reshape(-1, 3)
    teeth = teeth_vertices(ob)
    P = lambda name: os.path.join(TMP, name + '.png')
    views = [('front', (CX, 0, .675), .42, 0, 2), ('side', (CX, 0, .675), .55, -38, 2), ('face', (CX, 0, .73), .95, -12, 3)]
    tiles = []
    for state, close in (('now', 0), ('halfway', .5), ('closed', 1)):
        set_co(ob, close_mouth(co0, X, ZU, ZL, close, teeth) if close else co0)
        tiles.append([label(shot(P(f'mt-{state}-{v[0]}'), *v[1:], res=(560, 420)), f'{state}, {v[0]}') for v in views])
    W, H, g = 560, 420, 12
    sheet = Image.new('RGB', (W * 3 + g * 2, H * 3 + g * 2), 'white')
    for c, col in enumerate(tiles):
        for r, im in enumerate(col):
            sheet.paste(im, (c * (W + g), r * (H + g)))
    sheet.save(os.path.join(HERE, 'out', 'plan', 'mouth-test.png'))
    # the page for Jose: his drawn resting mouth beside the 3D one
    from storyboard import fit, board
    strip = Image.open(os.path.join(HERE, '..', '..', '..', 'drsmiley', 'face.webp')).convert('RGBA')
    m = strip.crop((60, 110, 250, 222)); bg = Image.new('RGBA', m.size, (255, 255, 255, 255)); bg.alpha_composite(m)
    drawn = label(bg.convert('RGB').resize((380, 224)), 'your drawing, rest')
    pair = Image.new('RGB', (380 + 16 + 560, 420), 'white')
    pair.paste(drawn, (0, 98)); pair.paste(Image.open(P('mt-closed-front')).convert('RGB'), (396, 0))
    board('Mouth test: his resting mouth', ['Route 1, your pick: his own lips close. Nothing added', 'to him, nothing painted.'], [
        ('1', 'ME', 'His sculpted open smile, closed: the lower lip and chin rise (the jaw closing), the upper lip comes down a '
         'little, the teeth tuck back behind the lips. Front, side and whole face; the middle column is halfway, so it can move.',
         [fit(sheet, 1000, 1000)], 'Now (left), halfway (middle), closed (right)', False),
        ('2', 'ME', 'Next to your drawing of his resting mouth.', [fit(pair, 1000, 440)], '', True),
        ('3', 'NEXT', 'After your OK: his brows (A), the eyelid following a lowered brow, cheeks, then the other mouth shapes '
         '(laugh, surprised O, sad, worried, doubt) and the expression sheet.', [], '', False),
    ], 'plan-mouth-test.png')
    print('done')
