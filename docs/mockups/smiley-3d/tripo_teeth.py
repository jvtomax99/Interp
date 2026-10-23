"""Real upper teeth for him (out/plan-alive.png step 2, Jose 2026-10-23: "let's
continue"). His model's teeth were a white sheet 1-3 mm thick painted in his
open smile; seen from below as the jaw opened it showed as a streaky band.
Here that band is painted into the colour of the inside of his mouth, and a
row of rounded 3D teeth with a gum line sits in its place, fixed to his skull
(upper teeth never move with the jaw).

  python3 tripo_eyes2.py && python3 tripo_teeth.py      -> in/tripo-face.blend
(safe to rerun: it finds the band in his original colours)
"""
import os, sys, math
import numpy as np
import bpy
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tripo_lib as T
import build

HERE = os.path.dirname(os.path.abspath(__file__))
N_TEETH = 10
X0, X1 = -.027, .052        # the arc the teeth span (the band's ends curve far back; a pucker would push them through)
HEIGHT = .015               # tooth height: the top is hidden behind the gum and lip
DEPTH = .0055


def band(ob):
    """The painted band per x: its front (y) and bottom edge (z), smoothed."""
    # from his original colours (tripo_fix.py's texture): the live one has the band painted out
    im = np.asarray(Image.open(os.path.join(HERE, 'in', 'hair_tex.png')).convert('RGBA'), dtype=np.float32)[::-1] / 255
    cen, tuv = T.face_arrays(ob)
    col = T.sample(im, tuv.mean(1)) * 255
    w = (col.min(1) > 225) & (cen[:, 1] < -.1) & (np.abs(cen[:, 2] - .675) < .03)
    p = cen[w]
    xs = np.linspace(p[:, 0].min() + .003, p[:, 0].max() - .003, 40)
    fy, bz = [], []
    for x in xs:
        s = np.abs(p[:, 0] - x) < .003
        fy.append(p[s, 1].min()); bz.append(p[s, 2].min())
    fy, bz = np.array(fy), np.array(bz)
    # a smooth arc through them (a quartic), so the teeth line up evenly
    return np.poly1d(np.polyfit(xs, fy, 4)), np.poly1d(np.polyfit(xs, bz, 4)), w


def paint_band(ob, w):
    """The painted teeth become the dark red of the inside of his mouth."""
    import cv2
    img, px = T.texture(ob)
    cen, tuv = T.face_arrays(ob)
    col = T.sample(px, tuv.mean(1)) * 255
    roof = (col.sum(1) < 420) & (cen[:, 1] < -.1) & (cen[:, 2] > .672) & (cen[:, 2] < .69)
    c = np.median(T.sample(px, tuv[roof].mean(1)), 0)
    h, wd = px.shape[:2]
    mask = np.zeros((h, wd), np.uint8)
    for f in np.nonzero(w)[0]:
        cv2.fillConvexPoly(mask, np.round(tuv[f] * [wd, h]).astype(np.int32), 1)
    mask = cv2.dilate(mask, np.ones((5, 5), np.uint8))
    soft = cv2.GaussianBlur(mask.astype(np.float32), (7, 7), 0)[..., None]
    out = px.copy(); out[..., :3] = out[..., :3] * (1 - soft) + c * soft
    path = os.path.join(HERE, 'in', 'tex-noteeth.png')
    Image.fromarray((np.clip(out[::-1], 0, 1) * 255).astype(np.uint8), 'RGBA').save(path)
    new = bpy.data.images.load(path, check_existing=False)
    for n in ob.data.materials[0].node_tree.nodes:
        if n.type == 'TEX_IMAGE' and n.image == img:
            n.image = new
    print('band painted', int(mask.sum()), 'texels, colour', (c * 255).astype(int))


def rounded_box(hw, hh, hd, p=4.5, nu=16, nv=12):
    """A superellipsoid: a soft rounded block (exponent p: 2 a ball, higher boxier)."""
    vs = []
    sg = lambda a, e: math.copysign(abs(a) ** e, a)
    for i in range(nv + 1):
        el = -math.pi / 2 + math.pi * i / nv
        for j in range(nu):
            az = 2 * math.pi * j / nu
            ce, se = math.cos(el), math.sin(el)
            vs.append((hw * sg(ce, 2 / p) * sg(math.cos(az), 2 / p), hd * sg(ce, 2 / p) * sg(math.sin(az), 2 / p), hh * sg(se, 2 / p)))
    fs = [(i * nu + j, i * nu + (j + 1) % nu, (i + 1) * nu + (j + 1) % nu, (i + 1) * nu + j) for i in range(nv) for j in range(nu)]
    return vs, fs


def build_teeth(fy, bz):
    verts, faces, mats = [], [], []
    # place teeth by length along the arc, the middle two widest (incisors), smaller toward the sides
    xs = np.linspace(X0, X1, 400)
    pts = np.stack([xs, fy(xs)], 1)
    s = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]
    xm = (X0 + X1) / 2
    widths = np.array([1.0 - .32 * abs(k - (N_TEETH - 1) / 2) / ((N_TEETH - 1) / 2) for k in range(N_TEETH)])
    widths = widths / widths.sum() * s[-1]
    edges = np.r_[0, np.cumsum(widths)]
    for k in range(N_TEETH):
        sc = (edges[k] + edges[k + 1]) / 2
        x = float(np.interp(sc, s, xs))
        y = float(fy(x)); dydx = float(fy.deriv()(x))
        tan = np.array([1, dydx, 0]); tan /= np.linalg.norm(tan)
        back = np.array([-tan[1], tan[0], 0])            # into the mouth (+y side)
        if back[1] < 0:
            back = -back
        up = np.array([0, 0, 1.])
        hw = widths[k] / 2 * .975                         # only fine gaps: a solid white row, as drawn
        incisor = 1 - abs(k - (N_TEETH - 1) / 2) / ((N_TEETH - 1) / 2)
        hh = HEIGHT / 2 * (.86 + .14 * incisor)
        bottom = float(bz(x)) - .0006
        # just in front of the old painted sheet (behind it, it hid the middle teeth)
        c = np.array([x, y, bottom + hh]) + back * (DEPTH / 2 - .0014)
        vs, fs = rounded_box(hw, hh, DEPTH / 2)
        base = len(verts)
        for v in vs:
            verts.append(tuple(c + tan * v[0] + back * v[1] + up * v[2]))
        faces += [tuple(base + i for i in f) for f in fs]
        mats += [0] * len(fs)
    # the gum: a soft pink band over the teeth's tops, just behind the upper lip
    nx, nz = 60, 6
    base = len(verts)
    for i in range(nx + 1):
        x = X0 - .004 + (X1 - X0 + .008) * i / nx
        y = float(fy(x)); z0 = float(bz(x)) + HEIGHT * .62
        for j in range(nz + 1):
            t = j / nz
            verts.append((x, y - .0026 * math.sin(math.pi * t) - .0004 + .004 * t, z0 + .012 * t))
    for i in range(nx):
        for j in range(nz):
            a = base + i * (nz + 1) + j
            faces.append((a, a + nz + 1, a + nz + 2, a + 1)); mats.append(1)
    return verts, faces, mats


STYLE = os.environ.get('TEETH', 'band')   # 'band': one smooth white band, as drawn; 'grooves': faint dividers; 'teeth': separate


def build_band(fy, bz, grooves=0.):
    """His teeth as one soft white band along the arc, the way his drawings and
    animated kids' faces show them (separate teeth with gaps read as dentures):
    a rounded cross-section swept along the arc, its bottom edge gently rounded,
    tapering at the ends so it tucks into the corners. grooves > 0 adds faint
    dips at the tooth boundaries."""
    nu, nv = 160, 16
    xs = np.linspace(X0, X1, nu + 1)
    pts = np.stack([xs, fy(xs)], 1)
    s = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]; s /= s[-1]
    widths = np.array([1.0 - .32 * abs(k - (N_TEETH - 1) / 2) / ((N_TEETH - 1) / 2) for k in range(N_TEETH)])
    bounds = np.cumsum(widths)[:-1] / widths.sum()
    verts, faces = [], []
    for i, x in enumerate(xs):
        y = float(fy(x)); d = float(fy.deriv()(x))
        tan = np.array([1, d, 0]); tan /= np.linalg.norm(tan)
        back = np.array([-tan[1], tan[0], 0]); back = back if back[1] > 0 else -back
        end = min(s[i], 1 - s[i])
        taper = math.sin(math.pi / 2 * min(1, end / .08)) ** .5          # tucks into the corners
        dip = 1 - grooves * max(0., 1 - min(abs(s[i] - b) for b in bounds) / .012)
        hh = HEIGHT / 2 * taper * dip
        hd = DEPTH / 2 * (.6 + .4 * taper)
        bottom = float(bz(x)) - .0006
        c = np.array([x, y, bottom + HEIGHT / 2]) + back * (DEPTH / 2 - .0014)
        for j in range(nv):
            a_ = 2 * math.pi * j / nv
            ca, sa = math.cos(a_), math.sin(a_)
            # a rounded rectangle cross-section: flat-ish front, soft bottom edge
            u = math.copysign(abs(ca) ** (2 / 4.5), ca); v = math.copysign(abs(sa) ** (2 / 4.5), sa)
            zoff = v * HEIGHT / 2 if v > 0 else v * hh * 2 - (HEIGHT / 2 - hh) * 0
            p = c + back * (u * hd) + np.array([0, 0, 1.]) * (v * HEIGHT / 2 if v > 0 else v * (hh * 2 - HEIGHT / 2) if hh * 2 > HEIGHT / 2 else v * hh)
            verts.append(tuple(p))
    for i in range(nu):
        for j in range(nv):
            a0 = i * nv + j
            faces.append((a0, a0 + nv, i * nv + nv + (j + 1) % nv, i * nv + (j + 1) % nv))
    # caps
    for i in (0, nu):
        cidx = len(verts); verts.append(tuple(np.mean([verts[i * nv + j] for j in range(nv)], 0)))
        for j in range(nv):
            faces.append((i * nv + j, i * nv + (j + 1) % nv, cidx) if i else (i * nv + (j + 1) % nv, i * nv + j, cidx))
    return verts, faces, [0] * len(faces)


def materials():
    t = bpy.data.materials.get('Teeth') or bpy.data.materials.new('Teeth'); t.use_nodes = True
    b = t.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = build.srgb(244, 238, 226)
    b.inputs['Roughness'].default_value = .32
    b.inputs['Specular IOR Level'].default_value = .45
    b.inputs['Subsurface Weight'].default_value = .15
    b.inputs['Subsurface Radius'].default_value = (.002, .0015, .001)
    g = bpy.data.materials.get('Gum') or bpy.data.materials.new('Gum'); g.use_nodes = True
    gb = g.node_tree.nodes['Principled BSDF']
    gb.inputs['Base Color'].default_value = build.srgb(206, 112, 112)
    gb.inputs['Roughness'].default_value = .45
    return t, g


if __name__ == '__main__':
    src = os.path.join(HERE, 'in', 'tripo-face.blend')
    bpy.ops.wm.open_mainfile(filepath=src)
    ob = bpy.data.objects['Mesh_0']
    fy, bz, w = band(ob)
    paint_band(ob, w)
    if 'Teeth' in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects['Teeth'])
    np.savez(os.path.join(HERE, 'in', 'teeth-arc.npz'), fy=fy.coeffs, bz=bz.coeffs)     # for the pucker (tripo_mouths.oval)
    if STYLE == 'teeth':
        verts, faces, mats = build_teeth(fy, bz)
    else:
        verts, faces, mats = build_band(fy, bz, grooves=.18 if STYLE == 'grooves' else 0.)
        gv, gf, gm = build_teeth(fy, bz)            # keep its gum strip only
        n0 = len(verts); k0 = gm.index(1)
        used = sorted({i for f in gf[k0:] for i in f}); remap = {o: n0 + i for i, o in enumerate(used)}
        verts += [gv[o] for o in used]; faces += [tuple(remap[i] for i in f) for f in gf[k0:]]; mats += [1] * (len(gf) - k0)
    me = bpy.data.meshes.new('Teeth'); me.from_pydata(verts, [], faces); me.validate(); me.shade_smooth()
    tm, gm = materials(); me.materials.append(tm); me.materials.append(gm)
    me.polygons.foreach_set('material_index', mats)
    to = bpy.data.objects.new('Teeth', me); bpy.context.scene.collection.objects.link(to)
    # rides the head like the eyes: the rig as parent, an armature modifier on the head bone
    eye = bpy.data.objects['Eye.L']
    to.parent = eye.parent; to.parent_type = eye.parent_type
    from mathutils import Matrix
    to.matrix_world = Matrix.Identity(4)          # its points are already where they belong on his face
    for md in eye.modifiers:
        if md.type == 'ARMATURE':
            am = to.modifiers.new('Armature', 'ARMATURE'); am.object = md.object
    to.vertex_groups.new(name='head').add(list(range(len(me.vertices))), 1.0, 'REPLACE')
    bpy.ops.wm.save_as_mainfile(filepath=src)
    print('done', N_TEETH, 'teeth')
