"""Dr. Smiley as a 3D toy, built in code with Blender (bpy).

  python3 build.py            -> smiley.blend (figure, skeleton, materials, studio)

Units are metres, he stands 1.0 tall, facing -Y (Blender's front view).
One pixel of drsmiley/base.webp is one millimetre of his head, so the
drawing's numbers carry straight over: the head centre is the drawing's
pixel (232, 270), the chin its row 450.
"""
import os, math, random
import numpy as np
import bpy, bmesh
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(HERE, 'tex')
rng = random.Random(7)

# ---------- palette (sampled from drsmiley/base.webp, sRGB) ----------
def srgb(r, g, b):
    f = lambda c: (c / 255) / 12.92 if c / 255 <= .04045 else ((c / 255 + .055) / 1.055) ** 2.4
    return (f(r), f(g), f(b), 1)

SKIN = srgb(250, 196, 166)
SKIN_EAR = srgb(246, 170, 148)
HAIR_DARK = srgb(48, 16, 7)
HAIR_LIGHT = srgb(118, 44, 18)
COAT = srgb(238, 237, 242)
SCRUB = srgb(22, 52, 112)
SHOE = srgb(244, 245, 248)
SOLE = srgb(120, 170, 220)
LANYARD = srgb(15, 95, 166)   # --accent
BADGE = srgb(250, 251, 253)

# ---------- head shape ----------
HZ = .735                 # head centre height
HEAD = dict(rx=.19, rup=.20, rdown=.18, yf=.175, yb=.20, pu=2.2, pd=3.0)
FACE_PX = (232, 270)       # drawing pixel at the head centre


def head_point(d, grow=0.0):
    """Unit direction -> point on his head (head-local, centre at origin)."""
    x, y, z = d
    h = math.hypot(x, y) or 1e-9
    dx, dy = x / h, y / h
    v = max(-1, min(1, z))
    p = HEAD['pu'] if v >= 0 else HEAD['pd']
    hr = (1 - abs(v) ** p) ** (1 / p)
    ry = HEAD['yf'] if dy < 0 else HEAD['yb']
    # the jaw: cheeks full, chin a little forward and narrower
    jaw = 1.0
    if v < 0:
        jaw = 1 - .10 * max(0, -v - .55) / .45
    X = HEAD['rx'] * hr * dx * jaw
    Y = ry * hr * dy * jaw
    Z = (HEAD['rup'] if v >= 0 else HEAD['rdown']) * v
    n = Vector((X, Y, Z))
    if grow:
        n += Vector((X / HEAD['rx'], Y / ry, Z / HEAD['rup'])).normalized() * grow
    return n


def sph(az, el):
    """az: 0 at his front (-Y), +90 at his left (+X, your right); el: up."""
    a, e = math.radians(az), math.radians(el)
    return Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))


# ---------- mesh helpers ----------
def mesh_obj(name, verts, faces, smooth=True, uvs=None, coll=None):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], faces)
    me.validate()
    if uvs is not None:
        layer = me.uv_layers.new(name='UVMap')
        for poly in me.polygons:
            for li in poly.loop_indices:
                layer.data[li].uv = uvs[me.loops[li].vertex_index]
    if smooth:
        me.shade_smooth()
    ob = bpy.data.objects.new(name, me)
    (coll or bpy.context.scene.collection).objects.link(ob)
    return ob


def grid_faces(rings, segs, closed=True, cap0=False, cap1=False, nverts=None):
    """Quads between consecutive rings of `segs` vertices; optional pole caps
    (the pole vertices are expected after all ring vertices: cap0 then cap1)."""
    faces = []
    for r in range(rings - 1):
        for s in range(segs if closed else segs - 1):
            a = r * segs + s
            b = r * segs + (s + 1) % segs
            faces.append((a, b, b + segs, a + segs))
    pole = rings * segs
    if cap0:
        faces += [(pole, (s + 1) % segs, s) for s in range(segs)]
        pole += 1
    if cap1:
        o = (rings - 1) * segs
        faces += [(o + s, o + (s + 1) % segs, pole) for s in range(segs)]
    return faces


def ellipsoid(name, center, radii, segs=32, rings=20, mat=None, p=2.0, rot=None):
    verts = []
    for r in range(1, rings):
        el = -math.pi / 2 + math.pi * r / rings
        for s in range(segs):
            az = 2 * math.pi * s / segs
            cx, sx = math.cos(az), math.sin(az)
            ce, se = math.cos(el), math.sin(el)
            # superellipse in elevation for a rounder, toy-like body
            ce = math.copysign(abs(ce) ** (2 / p), ce)
            se = math.copysign(abs(se) ** (2 / p), se)
            verts.append(Vector((radii[0] * ce * cx, radii[1] * ce * sx, radii[2] * se)))
    verts += [Vector((0, 0, -radii[2])), Vector((0, 0, radii[2]))]
    if rot:
        verts = [rot @ v for v in verts]
    verts = [v + Vector(center) for v in verts]
    ob = mesh_obj(name, verts, grid_faces(rings - 1, segs, cap0=True, cap1=True))
    if mat:
        ob.data.materials.append(mat)
    return ob


def tube(name, path, radius, segs=24, mat=None, flat=1.0, cap=True, up=Vector((0, 0, 1))):
    """A tube along a polyline; radius(t) -> (rx, ry) or float. Rounded ends."""
    path = [Vector(p) for p in path]
    n = len(path)
    verts, prev_n = [], None
    for i, p in enumerate(path):
        t = i / (n - 1)
        tan = (path[min(i + 1, n - 1)] - path[max(i - 1, 0)]).normalized()
        nrm = (up - tan * up.dot(tan))
        if nrm.length < 1e-4:
            nrm = Vector((1, 0, 0)) - tan * tan.x
        nrm.normalize()
        bi = tan.cross(nrm)
        r = radius(t) if callable(radius) else radius
        rx, ry = (r if isinstance(r, tuple) else (r, r * flat))
        for s in range(segs):
            a = 2 * math.pi * s / segs
            verts.append(p + bi * (rx * math.cos(a)) + nrm * (ry * math.sin(a)))
    faces = grid_faces(n, segs)
    if cap:
        t0 = (path[1] - path[0]).normalized()
        t1 = (path[-1] - path[-2]).normalized()
        r0 = radius(0) if callable(radius) else radius
        r1 = radius(1) if callable(radius) else radius
        r0 = r0[0] if isinstance(r0, tuple) else r0
        r1 = r1[0] if isinstance(r1, tuple) else r1
        verts += [path[0] - t0 * r0 * .6, path[-1] + t1 * r1 * .6]
        faces = grid_faces(n, segs, cap0=True, cap1=True)
        # cap0 winding faces the other way
    ob = mesh_obj(name, verts, faces)
    if mat:
        ob.data.materials.append(mat)
    return ob


def subsurf(ob, levels=2):
    m = ob.modifiers.new('Subdivision', 'SUBSURF')
    m.levels = min(levels, 2)
    m.render_levels = levels
    return m


# ---------- materials ----------
def principled(name, color, rough=.45, coat=.25, sss=0.0, sheen=0.0, spec=.5):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = color
    b.inputs['Roughness'].default_value = rough
    b.inputs['Coat Weight'].default_value = coat
    b.inputs['Coat Roughness'].default_value = .25
    b.inputs['Specular IOR Level'].default_value = spec
    if sss:
        b.inputs['Subsurface Weight'].default_value = sss
        b.inputs['Subsurface Radius'].default_value = (.9, .45, .3)
        b.inputs['Subsurface Scale'].default_value = .012
    if sheen:
        b.inputs['Sheen Weight'].default_value = sheen
    return m


def skin_face_material(face_png):
    """His skin, with the drawn face projected on the front (UV 'UVMap'),
    fading out as the head turns away (object-space normal)."""
    m = principled('Skin_Face', SKIN, rough=.42, coat=.18, sss=.12)
    nt = m.node_tree
    N, L = nt.nodes, nt.links
    b = N['Principled BSDF']
    img = N.new('ShaderNodeTexImage')
    img.name = 'FaceTex'
    img.image = bpy.data.images.load(face_png, check_existing=True)
    img.extension = 'CLIP'
    img.interpolation = 'Cubic'
    uv = N.new('ShaderNodeUVMap'); uv.uv_map = 'UVMap'
    L.new(uv.outputs['UV'], img.inputs['Vector'])
    tc = N.new('ShaderNodeTexCoord')
    sep = N.new('ShaderNodeSeparateXYZ')
    L.new(tc.outputs['Normal'], sep.inputs['Vector'])
    mr = N.new('ShaderNodeMapRange')       # facing front: normal.y from -.15 (1) to +.2 (0)
    mr.inputs['From Min'].default_value = -.15
    mr.inputs['From Max'].default_value = .2
    mr.inputs['To Min'].default_value = 1
    mr.inputs['To Max'].default_value = 0
    L.new(sep.outputs['Y'], mr.inputs['Value'])
    mul = N.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'
    L.new(img.outputs['Alpha'], mul.inputs[0])
    L.new(mr.outputs['Result'], mul.inputs[1])
    mix = N.new('ShaderNodeMix'); mix.data_type = 'RGBA'
    mix.inputs['A'].default_value = SKIN
    L.new(mul.outputs['Value'], mix.inputs['Factor'])
    L.new(img.outputs['Color'], mix.inputs['B'])
    L.new(mix.outputs['Result'], b.inputs['Base Color'])
    # The drawing already carries its own light; a touch of it as emission
    # keeps it as bright as he is drawn when the studio light is soft.
    L.new(img.outputs['Color'], b.inputs['Emission Color'])
    em = N.new('ShaderNodeMath'); em.operation = 'MULTIPLY'
    em.inputs[1].default_value = .22
    L.new(mul.outputs['Value'], em.inputs[0])
    L.new(em.outputs['Value'], b.inputs['Emission Strength'])
    # less subsurface where the drawing is, so the eyes stay crisp
    ss = N.new('ShaderNodeMath'); ss.operation = 'MULTIPLY_ADD'
    ss.inputs[1].default_value = -.12
    ss.inputs[2].default_value = .12
    L.new(mul.outputs['Value'], ss.inputs[0])
    L.new(ss.outputs['Value'], b.inputs['Subsurface Weight'])
    return m


def hair_material():
    m = principled('Hair', HAIR_LIGHT, rough=.32, coat=.35, sheen=.2)
    nt = m.node_tree
    N, L = nt.nodes, nt.links
    b = N['Principled BSDF']
    b.inputs['Anisotropic'].default_value = .6
    # colour along each clump: dark at the root, warm at the tip
    at = N.new('ShaderNodeAttribute'); at.attribute_name = 'along'
    ramp = N.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = HAIR_DARK
    ramp.color_ramp.elements[1].color = HAIR_LIGHT
    ramp.color_ramp.elements[1].position = .85
    L.new(at.outputs['Fac'], ramp.inputs['Fac'])
    # strands: fine grooves running along the clump
    uv = N.new('ShaderNodeUVMap'); uv.uv_map = 'UVMap'
    wave = N.new('ShaderNodeTexWave')
    wave.wave_type = 'BANDS'; wave.bands_direction = 'X'
    wave.inputs['Scale'].default_value = 7
    wave.inputs['Distortion'].default_value = 2.5
    wave.inputs['Detail'].default_value = 3
    L.new(uv.outputs['UV'], wave.inputs['Vector'])
    mixc = N.new('ShaderNodeMix'); mixc.data_type = 'RGBA'; mixc.blend_type = 'MULTIPLY'
    mixc.inputs['Factor'].default_value = .35
    L.new(ramp.outputs['Color'], mixc.inputs['A'])
    L.new(wave.outputs['Color'], mixc.inputs['B'])
    L.new(mixc.outputs['Result'], b.inputs['Base Color'])
    bump = N.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = .25
    bump.inputs['Distance'].default_value = .002
    L.new(wave.outputs['Fac'], bump.inputs['Height'])
    L.new(bump.outputs['Normal'], b.inputs['Normal'])
    tg = N.new('ShaderNodeTangent'); tg.direction_type = 'UV_MAP'; tg.uv_map = 'UVMap'
    L.new(tg.outputs['Tangent'], b.inputs['Tangent'])
    return m


# ---------- the head ----------
# Relief under the drawing, in drawing pixels: (x, y, radius x, radius y, mm forward, roundness).
# The nose is his drawn nose; the cheeks sit under the blush, the mouth area is a soft muzzle.
RELIEF = [(218, 340, 33, 21, 16, 1.6), (103, 348, 58, 50, 7, 1.0), (366, 358, 58, 50, 7, 1.0),
          (222, 378, 92, 46, 5, 1.0), (215, 418, 70, 34, 3, 1.0)]


def face_relief(p):
    """How far (metres) the face pushes forward at head-local point p (front only)."""
    if p.y >= 0:
        return 0.0
    front = min(1, -p.y / .12)
    x, y = FACE_PX[0] + p.x * 1000, FACE_PX[1] - p.z * 1000
    mm = 0.0
    for cx, cy, rx, ry, h, k in RELIEF:
        r2 = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
        mm += h * math.exp(-r2 ** k)
    return mm / 1000 * front


def build_head(mats, coll):
    segs, rings = 160, 120
    verts, uvs = [], []
    for r in range(1, rings):
        el = -math.pi / 2 + math.pi * r / rings
        for s in range(segs):
            az = 2 * math.pi * s / segs
            d = (math.cos(el) * math.sin(az), -math.cos(el) * math.cos(az), math.sin(el))
            p = head_point(d)
            uvs.append(((FACE_PX[0] + p.x * 1000) / 480, 1 - (FACE_PX[1] - p.z * 1000) / 600))
            p.y -= face_relief(p)
            verts.append(p + Vector((0, 0, HZ)))
    for z in (-1, 1):
        p = head_point((0, 0, z))
        verts.append(p + Vector((0, 0, HZ)))
        uvs.append(((FACE_PX[0]) / 480, 1 - (FACE_PX[1] - p.z * 1000) / 600))
    ob = mesh_obj('Head', verts, grid_faces(rings - 1, segs, cap0=True, cap1=True), uvs=uvs, coll=coll)
    ob.data.materials.append(mats['face'])
    return ob


def build_ears(mats, coll):
    obs = []
    for side in (-1, 1):
        big = 1.18 if STYLE_NOW == 'film' else 1.0      # the drawing's ears are big and sit low
        c = head_point(sph(side * 90, -16 if big > 1 else -12)) + Vector((side * .008, .012, HZ))
        rot = Matrix.Rotation(math.radians(side * 18), 3, 'Z') @ Matrix.Rotation(math.radians(-8 * side), 3, 'Y')
        outer = ellipsoid(f'Ear.{"L" if side > 0 else "R"}', c, (.026 * big, .042 * big, .058 * big), mat=mats['ear'], rot=rot, p=2.2)
        inner = ellipsoid(f'EarIn.{"L" if side > 0 else "R"}', c + rot @ Vector((side * .012 * big, -.006, 0)),
                          (.012 * big, .028 * big, .040 * big), mat=mats['earin'], rot=rot)
        for o in (outer, inner):
            coll.objects.link(o); bpy.context.scene.collection.objects.unlink(o)
        obs += [outer, inner]
    return obs


# ---------- the hair ----------
def hairline(az):
    """Lowest elevation the hair reaches at each azimuth (degrees)."""
    a = ((az + 180) % 360) - 180
    pts = [(-180, -32), (-130, -26), (-100, -6), (-80, 4), (-55, 16), (-30, 30), (0, 38), (30, 34),
           (55, 24), (80, 2), (100, -10), (130, -26), (180, -32)]
    for (a0, e0), (a1, e1) in zip(pts, pts[1:]):
        if a0 <= a <= a1:
            t = (a - a0) / (a1 - a0)
            t = t * t * (3 - 2 * t)
            return e0 + (e1 - e0) * t
    return -32


WHORL = sph(200, 62)
QUIFF = sph(30, 46)
PUFF = sph(95, 22)


def flow(d):
    """Hair direction at unit direction d: away from the crown, swept to his left (+X) over the top."""
    d = d.normalized()
    away = d - WHORL
    away -= d * away.dot(d)
    if away.length < 1e-6:
        away = Vector((1, 0, 0))
    away.normalize()
    sweep = Vector((1, -.25, 0))
    sweep -= d * sweep.dot(d)
    top = max(0, d.z) * max(0, -d.y + .3)   # strong on top and at the front
    v = away + sweep.normalized() * (1.8 * top)
    v -= d * v.dot(d)
    return v.normalized()


def az_el(d):
    return math.degrees(math.atan2(d.x, -d.y)), math.degrees(math.asin(max(-1, min(1, d.z))))


def trace(seed, length, step=.03):
    """Streamline over the unit sphere following flow(); stops at the hairline."""
    pts = [seed.normalized()]
    travelled = 0
    while travelled < length:
        d = pts[-1]
        nd = (d + flow(d) * step).normalized()
        az, el = az_el(nd)
        if el < hairline(az) - 3:
            break
        pts.append(nd)
        travelled += step
    return pts


def clump(name, dirs, width, lift, base, ridges=3, segs=14):
    """One clump of hair along unit directions `dirs` over the scalp."""
    n = len(dirs)
    if n < 3:
        return None
    taz, tel = az_el(dirs[-1])
    flick = .026 if (-45 < taz < 135 and tel > -15) else 0.0
    # resample to a smooth spine
    spine, nrms = [], []
    for i, d in enumerate(dirs):
        t = i / (n - 1)
        # volume: the quiff rises over the front of the top, a puff over his left ear
        q = math.exp(-((d - QUIFF).length / .52) ** 2) * .080 + math.exp(-((d - PUFF).length / .5) ** 2) * .032
        q += .020 * max(0, d.z)
        rise = base * (1 - t ** 4) + (lift + q) * math.sin(math.pi * min(1, t * 1.05)) ** .7 * (1 - .3 * t)
        # tips at the fringe and over his left ear flick up off the head, as drawn
        f = max(0, min(1, (t - .72) / .28))
        rise += flick * f * f * (3 - 2 * f)
        p = head_point(d, grow=rise)
        spine.append(p)
        nrms.append(head_point(d, grow=rise + .01) - p)
    verts, uvs, along = [], [], []
    for i, p in enumerate(spine):
        t = i / (n - 1)
        tan = (spine[min(i + 1, n - 1)] - spine[max(i - 1, 0)]).normalized()
        nrm = nrms[i] - tan * nrms[i].dot(tan)
        nrm.normalize()
        bi = tan.cross(nrm)
        w = width * (1 - t ** 1.8) ** .6 * (.35 + .65 * min(1, t / .3) ** .7)
        h = w * .30 + .0015
        if i == n - 1:
            w = h = 1e-4
        for s in range(segs):
            a = 2 * math.pi * s / segs
            rid = 1 + .06 * math.cos(ridges * 2 * a) if math.sin(a) > 0 else 1
            verts.append(p + Vector(bi) * (w * math.cos(a)) + nrm * (h * math.sin(a) * rid))
            uvs.append((s / segs * 2, t * 4))
            along.append(t)
    faces = grid_faces(n, segs)
    ob = mesh_obj(name, verts, faces, uvs=uvs)
    attr = ob.data.attributes.new('along', 'FLOAT', 'POINT')
    attr.data.foreach_set('value', along)
    return ob


def build_hair(mats, coll):
    parts = []
    # the cap under the clumps: the scalp grown outward above the hairline
    segs, rings = 96, 60
    verts, faces, rows = [], [], []
    for r in range(rings + 1):
        row = []
        for s in range(segs):
            az = 360 * s / segs - 180
            lo = hairline(az) - 1
            el = lo + (89.5 - lo) * r / rings
            p = head_point(sph(az, el), grow=.008)
            row.append(len(verts))
            verts.append(p + Vector((0, 0, HZ)))
        rows.append(row)
    for r in range(rings):
        for s in range(segs):
            a, b = rows[r][s], rows[r][(s + 1) % segs]
            c, d = rows[r + 1][(s + 1) % segs], rows[r + 1][s]
            faces.append((a, b, c, d))
    top = len(verts)
    verts.append(head_point((0, 0, 1), grow=.008) + Vector((0, 0, HZ)))
    faces += [(rows[-1][s], rows[-1][(s + 1) % segs], top) for s in range(segs)]
    cap = mesh_obj('HairCap', verts, faces, coll=coll)
    cap.data.attributes.new('along', 'FLOAT', 'POINT').data.foreach_set('value', [.45] * len(verts))
    cap.data.uv_layers.new(name='UVMap')
    cap.data.materials.append(mats['hair'])
    sol = cap.modifiers.new('Solidify', 'SOLIDIFY'); sol.thickness = .006; sol.offset = 1
    parts.append(cap)

    # locks: every one starts near the crown (WHORL) and runs to the hairline,
    # in two layers so the outer one covers the seams of the inner one
    seeds = []
    up = Vector((0, 0, 1))
    e1 = (up - WHORL * up.dot(WHORL)).normalized()
    e2 = WHORL.cross(e1)
    for layer, (count, ring, base, lift, wmin, wmax) in enumerate([
            (26, 10, .004, .010, .062, .078),
            (20, 22, .014, .020, .060, .074)]):
        for j in range(count):
            ang = 2 * math.pi * (j + .5 * layer) / count
            r = math.radians(ring + rng.uniform(-3, 3))
            d = (WHORL * math.cos(r) + (e1 * math.cos(ang) + e2 * math.sin(ang)) * math.sin(r)).normalized()
            seeds.append((layer, d, base, lift, rng.uniform(wmin, wmax), 3.0))
    for i, (layer, d, base, lift, w, length) in enumerate(seeds):
        dirs = trace(d, length)
        az, el = az_el(d)
        # the front clumps over the forehead lift more: his quiff
        front = max(0, math.cos(math.radians(az - 25))) * max(0, (el - 15) / 60)
        ob = clump(f'Hair.{i:03d}', dirs, w, lift * (1 + 1.2 * front), base, segs=16)
        if ob:
            ob.location.z = HZ
            ob.data.materials.append(mats['hair'])
            parts.append(ob)
    # join everything into one mesh so it moves (and renders) as one
    for o in parts:
        if o.name not in coll.objects:
            coll.objects.link(o)
        if o.name in bpy.context.scene.collection.objects:
            bpy.context.scene.collection.objects.unlink(o)
    return join(parts, 'Hair')


# ---------- the hair, collectible-figure style (art direction 2, Jose's pick 2026-10-21) ----------
# A few big molded locks with sharp tips, placed by hand after the drawing:
# (waypoints (az, el) in degrees over the scalp, width, thickness, lift, tip flick).
FIG_LOCKS = []
for i in range(10):                                  # the back: from the crown down to the nape
    a = 112 + 15 * i
    FIG_LOCKS.append(([(200, 66), ((200 + a) / 2, 44), (a, 6), (a + 4, -36)], .072, .018, .012, .024))
FIG_LOCKS += [
    # his right side (your left): combed down and back over the temple
    ([(-150, 62), (-124, 32), (-114, 2), (-118, -24)], .070, .018, .014, .022),
    ([(-118, 66), (-100, 38), (-94, 10), (-97, -12)], .070, .018, .014, .022),
    ([(-88, 66), (-80, 40), (-78, 16), (-83, 0)], .064, .017, .014, .02),
    ([(-68, 58), (-64, 40), (-66, 24), (-70, 12)], .056, .016, .014, .018),
    # his left side (your right): the puff over his ear, standing off more
    ([(152, 62), (124, 32), (117, 2), (121, -26)], .074, .019, .022, .026),
    ([(120, 66), (106, 38), (102, 8), (106, -16)], .078, .019, .030, .032),
    ([(92, 64), (90, 38), (93, 12), (99, -8)], .074, .019, .034, .036),
    # over the top, from the crown towards his left
    ([(-150, 74), (-90, 82), (20, 84), (80, 66), (108, 40)], .082, .019, .030, .03),
    ([(-100, 66), (-55, 76), (10, 78), (64, 66), (96, 40)], .080, .019, .034, .03),
    ([(170, 74), (120, 70), (112, 46)], .076, .019, .024, .028),
    # the pompadour: locks rising from his forehead, up and over to his left,
    # their tips standing up off the top (the swoop in the drawing)
    ([(-58, 34), (-46, 50), (-24, 64), (8, 72)], .066, .019, .046, .040),
    ([(-36, 38), (-20, 54), (6, 66), (36, 68)], .074, .020, .060, .046),
    ([(-12, 40), (6, 55), (32, 62), (58, 58)], .076, .021, .068, .050),
    ([(12, 40), (30, 51), (54, 54), (78, 46)], .072, .020, .060, .046),
    ([(36, 34), (54, 42), (74, 41), (92, 30)], .066, .019, .046, .040),
]


# How far his hair stands off his head in the drawing, seen from the front, by
# angle round the head centre (0 = his left, your right; 90 = the top), in mm.
# Measured on base.webp's hair against head_point()'s outline; the ears' rows
# (170-200 and below -10) replaced by their neighbours.
HAIR_T = [(-30, 0), (-20, 8), (-10, 16), (0, 30), (10, 50), (20, 62), (30, 64), (40, 60), (50, 62), (60, 65),
          (70, 62), (80, 62), (90, 64), (100, 60), (110, 58), (120, 50), (130, 26), (140, 14), (150, 10),
          (160, 9), (170, 8), (180, 8), (190, 6), (210, 0)]


def hair_t(d):
    """Envelope thickness (metres) over unit direction d: the drawing's outline,
    less at the very front and back (the drawing can't show depth), fading to
    nothing at the hairline so the hair rises off the forehead instead of
    hanging over it."""
    p = head_point(d)
    phi = math.degrees(math.atan2(p.z, p.x))
    if phi < -90:
        phi += 360
    t = 0.0
    for (a0, t0), (a1, t1) in zip(HAIR_T, HAIR_T[1:]):
        if a0 <= phi <= a1:
            u = (phi - a0) / (a1 - a0)
            t = t0 + (t1 - t0) * u
            break
    k = 1 - .45 * max(0, -d.y) ** 1.5 - .35 * max(0, d.y) ** 1.5
    az, el = az_el(d)
    ramp = max(0, min(1, (el - hairline(az)) / 22))
    ramp = ramp * ramp * (3 - 2 * ramp)
    return t / 1000 * k * (.25 + .75 * ramp)


def fig_lock_traced(name, dirs, width, frac, flick, segs=18, tuck=False):
    """A moulded lock along a streamline, lying at `frac` of the envelope."""
    m = len(dirs)
    if m < 4:
        return None
    spine = []
    for i, d in enumerate(dirs):
        t = i / (m - 1)
        f = max(0, min(1, (t - .7) / .3))
        root = min(1, t / .18) ** .7          # roots tuck into the cap at the crown
        rise = .004 + root * frac * 1.1 * hair_t(d) * (.6 + .4 * math.sin(math.pi * min(1, t * 1.6))) + flick * f * f * (3 - 2 * f)
        if tuck:                               # drawn hair: the ends curl in against the head
            rise = .004 + root * frac * 1.1 * hair_t(d) * (1 - .75 * f * f * (3 - 2 * f))
        spine.append((head_point(d, grow=rise), head_point(d, grow=rise + .01)))
    verts, along, uv_front, uv_lock = [], [], [], []
    length = sum((spine[i + 1][0] - spine[i][0]).length for i in range(m - 1))
    for i, (p, pn) in enumerate(spine):
        t = i / (m - 1)
        tan = (spine[min(i + 1, m - 1)][0] - spine[max(i - 1, 0)][0]).normalized()
        nrm = (pn - p) - tan * (pn - p).dot(tan)
        nrm.normalize()
        bi = tan.cross(nrm)
        w = width * (.45 + .55 * min(1, t / .25)) * (max(0, 1 - t ** 4) ** .45 if tuck else max(0, 1 - t ** 2.4) ** .9)
        h = max(.004, .32 * w)
        if i == m - 1:
            w, h = .0004, .0004
        for k in range(segs):
            a = 2 * math.pi * k / segs
            sa = math.sin(a)
            v = p + bi * (w * math.cos(a)) + nrm * (h * sa * abs(sa) ** .35)
            verts.append(v)
            along.append(t)
            uv_front.append(((FACE_PX[0] + v.x * 1000) / 480, 1 - (FACE_PX[1] - v.z * 1000) / 600))
            uv_lock.append((k / segs * width / .05, t * length / .05))
    ob = mesh_obj(name, verts, grid_faces(m, segs), uvs=uv_front)
    ob.data.attributes.new('along', 'FLOAT', 'POINT').data.foreach_set('value', along)
    lay = ob.data.uv_layers.new(name='Lock')
    for poly in ob.data.polygons:
        for li in poly.loop_indices:
            lay.data[li].uv = uv_lock[ob.data.loops[li].vertex_index]
    return ob


def fig_lock(name, waypoints, width, thick, lift, flick, segs=18, n=36):
    pts = [sph(a, e) for a, e in waypoints]
    dirs = [p.normalized() for p in catmull(pts, max(2, n // (len(pts) - 1)))]
    m = len(dirs)
    spine = []
    for i, d in enumerate(dirs):
        t = i / (m - 1)
        f = max(0, min(1, (t - .65) / .35))
        rise = .006 + lift * math.sin(math.pi * min(1, t * 1.15)) ** .8 * (1 - .4 * t) + flick * f * f * (3 - 2 * f)
        spine.append((head_point(d, grow=rise), head_point(d, grow=rise + .01)))
    verts, along = [], []
    for i, (p, pn) in enumerate(spine):
        t = i / (m - 1)
        tan = (spine[min(i + 1, m - 1)][0] - spine[max(i - 1, 0)][0]).normalized()
        nrm = (pn - p) - tan * (pn - p).dot(tan)
        nrm.normalize()
        bi = tan.cross(nrm)
        w = width * (.55 + .45 * min(1, t / .2)) * max(0, 1 - t ** 2.2) ** .85
        h = thick * max(0, 1 - t ** 1.6) ** .6 + .0008
        if i == m - 1:
            w, h = .0004, .0004
        for k in range(segs):
            a = 2 * math.pi * k / segs
            sa = math.sin(a)
            verts.append(p + bi * (w * math.cos(a)) + nrm * (h * sa * abs(sa) ** .35))
            along.append(t)
    ob = mesh_obj(name, verts, grid_faces(m, segs))
    ob.data.attributes.new('along', 'FLOAT', 'POINT').data.foreach_set('value', along)
    ob.data.uv_layers.new(name='UVMap')
    return ob


def fig_hair_material():
    """Glossy moulded PVC: one brown, a touch darker at the roots."""
    m = principled('HairFig', srgb(88, 34, 15), rough=.34, coat=.35, sss=.04)
    N, L = m.node_tree.nodes, m.node_tree.links
    b = N['Principled BSDF']
    b.inputs['Coat Roughness'].default_value = .18
    at = N.new('ShaderNodeAttribute'); at.attribute_name = 'along'
    ramp = N.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = srgb(52, 19, 8)
    ramp.color_ramp.elements[1].color = srgb(104, 40, 17)
    ramp.color_ramp.elements[1].position = .6
    L.new(at.outputs['Fac'], ramp.inputs['Fac'])
    L.new(ramp.outputs['Color'], b.inputs['Base Color'])
    return m


def build_hair_figure(mats, coll):
    parts = []
    segs, rings = 96, 50
    verts, faces, rows = [], [], []
    for r in range(rings + 1):
        row = []
        for s_ in range(segs):
            az = 360 * s_ / segs - 180
            lo = hairline(az) + 2
            el = lo + (89.5 - lo) * r / rings
            row.append(len(verts))
            verts.append(head_point(sph(az, el), grow=.006) + Vector((0, 0, HZ)))
        rows.append(row)
    for r in range(rings):
        for s_ in range(segs):
            faces.append((rows[r][s_], rows[r][(s_ + 1) % segs], rows[r + 1][(s_ + 1) % segs], rows[r + 1][s_]))
    top = len(verts)
    verts.append(head_point((0, 0, 1), grow=.006) + Vector((0, 0, HZ)))
    faces += [(rows[-1][s_], rows[-1][(s_ + 1) % segs], top) for s_ in range(segs)]
    cap = mesh_obj('HairCap', verts, faces, coll=coll)
    cap.data.attributes.new('along', 'FLOAT', 'POINT').data.foreach_set('value', [0.0] * len(verts))
    cap.data.uv_layers.new(name='UVMap')
    cap.data.uv_layers.new(name='Lock')
    cap.data.materials.append(mats['hair'])
    parts.append(cap)
    # a little swirl where the locks meet at the crown
    for k, (r, g) in enumerate(((.026, .010), (.016, .016))):
        sw = ellipsoid(f'Swirl.{k}', head_point(WHORL, grow=g) + Vector((0, 0, HZ)), (r, r, r * .45), mat=mats['hair'],
                       rot=WHORL.to_track_quat('Z', 'Y').to_matrix())
        sw.data.attributes.new('along', 'FLOAT', 'POINT').data.foreach_set('value', [.3] * len(sw.data.vertices))
        sw.data.uv_layers.new(name='UVMap')
        sw.data.uv_layers.new(name='Lock')
        parts.append(sw)
    # locks traced from the crown (flow()), in three layers up to the envelope
    up = Vector((0, 0, 1))
    e1 = (up - WHORL * up.dot(WHORL)).normalized()
    e2 = WHORL.cross(e1)
    i = 0
    for layer, (count, ring, frac, wmin, wmax) in enumerate([(24, 8, .35, .060, .072),
                                                            (22, 18, .70, .058, .070),
                                                            (18, 30, .98, .054, .066)]):
        for j in range(count):
            ang = 2 * math.pi * (j + .33 * layer) / count
            r = math.radians(ring + rng.uniform(-3, 3))
            d = (WHORL * math.cos(r) + (e1 * math.cos(ang) + e2 * math.sin(ang)) * math.sin(r)).normalized()
            dirs = trace(d, 3.0)
            tuck = STYLE_NOW == 'film'
            if not tuck:                       # figure: carry on past the hairline so the tips end in points
                for _ in range(4):
                    dirs.append((dirs[-1] + flow(dirs[-1]) * .03).normalized())
            wd = rng.uniform(wmin, wmax) * (1.25 if tuck else 1)
            ob = fig_lock_traced(f'Lock.{i:02d}', dirs, wd, frac, .010 + .008 * layer, tuck=tuck)
            i += 1
            if ob:
                ob.location.z = HZ
                ob.data.materials.append(mats['hair'])
                parts.append(ob)
    for o in parts:
        if o.name not in coll.objects:
            coll.objects.link(o)
        if o.name in bpy.context.scene.collection.objects:
            bpy.context.scene.collection.objects.unlink(o)
    return join(parts, 'Hair')


# ---------- the hair, wrapped (art direction 3, Jose's pick 2026-10-21) ----------
def hair_film_material():
    """His drawn hair on the front (projected like the face), drawn strands
    from the same drawing everywhere else (box-mapped tile), blended by how
    much the surface faces forward."""
    m = principled('HairFilm', srgb(110, 42, 18), rough=.42, coat=.06)
    N, L = m.node_tree.nodes, m.node_tree.links
    b = N['Principled BSDF']
    uv = N.new('ShaderNodeUVMap'); uv.uv_map = 'UVMap'
    front = N.new('ShaderNodeTexImage'); front.name = 'HairFront'
    front.image = bpy.data.images.load(os.path.join(TEX, 'hair_front.png'), check_existing=True)
    front.extension = 'CLIP'; front.interpolation = 'Cubic'
    L.new(uv.outputs['UV'], front.inputs['Vector'])
    tc = N.new('ShaderNodeTexCoord')
    luv = N.new('ShaderNodeUVMap'); luv.uv_map = 'Lock'
    mp = N.new('ShaderNodeMapping')      # fine strands: fast across the lock, slow along it
    mp.inputs['Scale'].default_value = (40, .5, 1)
    L.new(luv.outputs['UV'], mp.inputs['Vector'])
    nz = N.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = 1.0
    nz.inputs['Detail'].default_value = 4
    nz.inputs['Roughness'].default_value = .55
    L.new(mp.outputs['Vector'], nz.inputs['Vector'])
    tile = N.new('ShaderNodeValToRGB'); tile.name = 'HairStrands'   # browns sampled from his drawn hair
    cr = tile.color_ramp
    # the drawing's hair tones at its 10th, 30th, 50th, 70th and 90th percentiles of brightness
    cr.elements[0].position, cr.elements[0].color = .32, srgb(30, 5, 2)
    cr.elements[1].position, cr.elements[1].color = .44, srgb(56, 14, 5)
    for pos, col in ((.52, (76, 23, 10)), (.60, (100, 42, 28)), (.70, (146, 76, 56))):
        e = cr.elements.new(pos); e.color = srgb(*col)
    L.new(nz.outputs['Fac'], tile.inputs['Fac'])
    sep = N.new('ShaderNodeSeparateXYZ')
    L.new(tc.outputs['Normal'], sep.inputs['Vector'])
    mr = N.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value = -.2
    mr.inputs['From Max'].default_value = -.6
    L.new(sep.outputs['Y'], mr.inputs['Value'])
    w = N.new('ShaderNodeMath'); w.operation = 'MULTIPLY'
    L.new(mr.outputs['Result'], w.inputs[0]); L.new(front.outputs['Alpha'], w.inputs[1])
    soft = N.new('ShaderNodeMix'); soft.data_type = 'RGBA'   # the drawn gaps are deep; soften them on the sides
    soft.inputs['Factor'].default_value = 0.0
    soft.inputs['B'].default_value = srgb(72, 22, 10)
    L.new(tile.outputs['Color'], soft.inputs['A'])
    mix = N.new('ShaderNodeMix'); mix.data_type = 'RGBA'
    L.new(w.outputs['Value'], mix.inputs['Factor'])
    L.new(soft.outputs['Result'], mix.inputs['A']); L.new(front.outputs['Color'], mix.inputs['B'])
    L.new(mix.outputs['Result'], b.inputs['Base Color'])
    L.new(mix.outputs['Result'], b.inputs['Emission Color'])
    b.inputs['Emission Strength'].default_value = .16
    return m


def build_hair_film(mats, coll):
    """One smooth hair shape filling the drawing's outline (hair_t), its lower
    edge tucked into the head, with front-projection UVs like the face."""
    segs, rings = 160, 70
    verts, uvs, rows = [], [], []
    for r in range(-1, rings + 1):
        row = []
        for s_ in range(segs):
            az = 360 * s_ / segs - 180
            lo = hairline(az)
            if r < 0:
                d = sph(az, lo - 3); g = -.006
            else:
                el = lo + (89.6 - lo) * (r / rings) ** .9
                d = sph(az, el); g = .004 + 1.08 * hair_t(d)
            p = head_point(d, grow=g)
            row.append(len(verts))
            verts.append(p + Vector((0, 0, HZ)))
            uvs.append(((FACE_PX[0] + p.x * 1000) / 480, 1 - (FACE_PX[1] - p.z * 1000) / 600))
        rows.append(row)
    faces = []
    for r in range(len(rows) - 1):
        for s_ in range(segs):
            faces.append((rows[r][s_], rows[r][(s_ + 1) % segs], rows[r + 1][(s_ + 1) % segs], rows[r + 1][s_]))
    top = len(verts)
    p = head_point((0, 0, 1), grow=.004 + 1.08 * hair_t(Vector((0, 0, 1))))
    verts.append(p + Vector((0, 0, HZ)))
    uvs.append(((FACE_PX[0] + p.x * 1000) / 480, 1 - (FACE_PX[1] - p.z * 1000) / 600))
    faces += [(rows[-1][s_], rows[-1][(s_ + 1) % segs], top) for s_ in range(segs)]
    ob = mesh_obj('Hair', verts, faces, uvs=uvs, coll=coll)
    ob.data.materials.append(mats['hair'])
    return ob


def join(obs, name):
    ctx = bpy.context
    for o in ctx.view_layer.objects:
        o.select_set(False)
    for o in obs:
        o.select_set(True)
    ctx.view_layer.objects.active = obs[0]
    # apply transforms so the joined mesh keeps positions
    with ctx.temp_override(selected_editable_objects=obs, active_object=obs[0], selected_objects=obs):
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        bpy.ops.object.join()
    ob = ctx.view_layer.objects.active
    ob.name = name
    return ob



# ---------- the body ----------
# Coat rings: (height, half-width, depth to the front, depth to the back)
COAT_RINGS = [(.185, .168, .138, .132), (.22, .160, .130, .126), (.27, .150, .121, .118), (.33, .150, .120, .116),
              (.39, .151, .118, .113), (.44, .150, .113, .108), (.48, .145, .104, .100), (.505, .130, .093, .090),
              (.525, .105, .080, .078), (.540, .078, .068, .066), (.550, .062, .058, .056)]
V_BOTTOM = .385          # the coat is buttoned below this; above it opens in a V
LAPEL_DEG = 22


def ring_at(z, rings=COAT_RINGS):
    for a, b in zip(rings, rings[1:]):
        if a[0] <= z <= b[0]:
            t = (z - a[0]) / (b[0] - a[0])
            t = t * t * (3 - 2 * t)
            return tuple(a[i] + (b[i] - a[i]) * t for i in range(1, 4))
    r = rings[0] if z < rings[0][0] else rings[-1]
    return r[1:]


def coat_point(z, ang, grow=0.0, rings=COAT_RINGS):
    """ang in degrees from his front (-Y), + towards his left (+X)."""
    rx, rf, rb = ring_at(z, rings)
    a = math.radians(ang)
    s, c = math.sin(a), math.cos(a)
    p = 2.3
    se = math.copysign(abs(s) ** (2 / p), s)
    ce = math.copysign(abs(c) ** (2 / p), c)
    ry = rf if c > 0 else rb
    return Vector(((rx + grow) * se, -(ry + grow) * ce, z))


def v_half(z):
    """Half-angle of the coat's front opening at height z."""
    if z <= V_BOTTOM:
        return 0.0
    t = (z - V_BOTTOM) / (COAT_RINGS[-1][0] - V_BOTTOM)
    return 4 + 40 * t ** 1.15


def build_coat(mats, coll):
    zs = [COAT_RINGS[0][0] + (COAT_RINGS[-1][0] - COAT_RINGS[0][0]) * i / 70 for i in range(71)]
    segs = 96
    verts, faces = [], []
    for z in zs:
        h = max(v_half(z), 1.2)
        for k in range(segs + 1):
            ang = h + (360 - 2 * h) * k / segs
            verts.append(coat_point(z, ang))
    W = segs + 1
    for r in range(len(zs) - 1):
        for k in range(segs):
            a = r * W + k
            faces.append((a, a + 1, a + 1 + W, a + W))
    coat = mesh_obj('Coat', verts, faces, coll=coll)
    coat.data.materials.append(mats['coat'])
    sol = coat.modifiers.new('Solidify', 'SOLIDIFY'); sol.thickness = .007; sol.offset = 1
    sol.use_rim = True
    # lapels: a band folded back along each edge of the V
    parts = [coat]
    for side in (-1, 1):
        lv, lf = [], []
        zl = [V_BOTTOM - .005 + (COAT_RINGS[-1][0] - .004 - V_BOTTOM) * i / 30 for i in range(31)]
        for z in zl:
            h = v_half(z)
            wdeg = LAPEL_DEG * min(1, (z - V_BOTTOM + .01) / .05) * (1 - .55 * ((z - V_BOTTOM) / (.55 - V_BOTTOM)) ** 2)
            for j in range(4):
                ang = h + wdeg * j / 3
                lv.append(coat_point(z, side * ang, grow=.008 + .002 * (1 - j / 3)))
        for r in range(len(zl) - 1):
            for j in range(3):
                a = r * 4 + j
                lf.append((a, a + 1, a + 5, a + 4) if side > 0 else (a, a + 4, a + 5, a + 1))
        lap = mesh_obj(f'Lapel.{"L" if side > 0 else "R"}', lv, lf, coll=coll)
        lap.data.materials.append(mats['coat'])
        m = lap.modifiers.new('Solidify', 'SOLIDIFY'); m.thickness = .004
        parts.append(lap)
    # the collar: a band standing round the back of his neck, folded over
    cv, cf = [], []
    n = 48
    for k in range(n + 1):
        a = 40 + 280 * k / n
        bot = coat_point(.540, a, grow=.004)
        top = coat_point(.585, a, grow=-.002, rings=[(.5, .074, .066, .066), (.6, .074, .066, .066)])
        fold = (1 - abs(math.cos(math.radians(a)))) * .006
        mid = bot.lerp(top, .55) + Vector((bot.x, bot.y, 0)).normalized() * (.006 + fold)
        cv += [bot, mid, top]
    for k in range(n):
        for j in range(2):
            a = k * 3 + j
            cf.append((a, a + 3, a + 4, a + 1))
    col = mesh_obj('Collar', cv, cf, coll=coll)
    col.data.materials.append(mats['coat'])
    m = col.modifiers.new('Solidify', 'SOLIDIFY'); m.thickness = .005
    parts.append(col)
    # buttons, pockets, the pen
    for z in (.345, .275):
        b = ellipsoid('Button', coat_point(z, 0, grow=.009), (.009, .004, .009), mat=mats['button'], segs=20, rings=10)
        parts.append(b)
    for side in (-1, 1):
        c = coat_point(.255, side * 38, grow=.007)
        rot = Matrix.Rotation(math.radians(side * 34), 3, 'Z')
        parts.append(ellipsoid('Pocket', c, (.040, .006, .032), mat=mats['coat'], p=5, rot=rot))
    c = coat_point(.44, 40, grow=.007)
    rot = Matrix.Rotation(math.radians(38), 3, 'Z')
    parts.append(ellipsoid('BreastPocket', c, (.026, .005, .022), mat=mats['coat'], p=5, rot=rot))
    pen = tube('Pen', [c + Vector((.006, -.004, .0)), c + Vector((.006, -.004, .045))], .0055, segs=16, mat=mats['pen'])
    parts.append(pen)
    for o in parts[1:]:
        if o.name not in coll.objects:
            coll.objects.link(o); bpy.context.scene.collection.objects.unlink(o)
    return parts


def build_torso(mats, coll):
    """The navy scrub top under the coat (seen in the V) and his neck."""
    rings = [(z, rx - .012, rf - .012, rb - .012) for z, rx, rf, rb in COAT_RINGS[2:]]
    rings[-1] = (.555, .050, .046, .046)
    segs = 64
    zs = [rings[0][0] + (rings[-1][0] - rings[0][0]) * i / 40 for i in range(41)]
    verts = [coat_point(z, 360 * k / segs, rings=rings) for z in zs for k in range(segs)]
    verts += [Vector((0, 0, zs[0])), Vector((0, 0, zs[-1]))]
    torso = mesh_obj('Scrubs', verts, grid_faces(len(zs), segs, cap0=True, cap1=True), coll=coll)
    torso.data.materials.append(mats['scrub'])
    # the scrub top's own V-neck: a little skin triangle at the throat
    v = [Vector((-.024, -.050, .556)), Vector((.024, -.050, .556)), Vector((0, -.064, .505))]
    vn = mesh_obj('ThroatV', [p + Vector((0, -.003, 0)) for p in v], [(0, 2, 1)], coll=coll)
    vn.data.materials.append(mats['skin'])
    m = vn.modifiers.new('Solidify', 'SOLIDIFY'); m.thickness = .002
    neck = tube('Neck', [(0, -.004, .50), (0, -.004, .64)], .05, segs=32, mat=mats['skin'], cap=False)
    coll.objects.link(neck); bpy.context.scene.collection.objects.unlink(neck)
    return [torso, vn, neck]


# Rest pose of the skeleton (armature space); his left is +X.
BONES = {
    'root': ((0, 0, 0), (0, 0, .1), None),
    'hips': ((0, 0, .26), (0, 0, .34), 'root'),
    'spine': ((0, 0, .34), (0, 0, .42), 'hips'),
    'chest': ((0, 0, .42), (0, 0, .50), 'spine'),
    'neck': ((0, 0, .50), (0, 0, .57), 'chest'),
    'head': ((0, 0, .57), (0, 0, .82), 'neck'),
}
for S, sx in (('L', 1), ('R', -1)):
    BONES.update({
        f'shoulder.{S}': ((.03 * sx, 0, .49), (.140 * sx, 0, .49), 'chest'),
        f'upper_arm.{S}': ((.140 * sx, 0, .49), (.180 * sx, -.004, .395), f'shoulder.{S}'),
        f'forearm.{S}': ((.180 * sx, -.004, .395), (.198 * sx, -.014, .305), f'upper_arm.{S}'),
        f'thigh.{S}': ((.066 * sx, 0, .265), (.070 * sx, -.004, .170), 'hips'),
        f'shin.{S}': ((.070 * sx, -.004, .170), (.070 * sx, 0, .072), f'thigh.{S}'),
        f'foot.{S}': ((.070 * sx, 0, .072), (.070 * sx, -.085, .030), f'shin.{S}'),
    })

# Hands: a palm, a thumb and three fingers, two bones each. HAND_FRAME holds
# each hand's rest axes (palm normal, front-to-back, along the hand) and
# FINGERS each finger's rest direction, for curling (pose 'grip.L').
HAND_FRAME, FINGERS = {}, {}
HS = 1.45                               # hand size: cartoon hands, big enough to read in a full shot
for S, sx in (('L', 1), ('R', -1)):
    W = Vector((.198 * sx, -.014, .305))
    d = (Vector((.205 * sx, -.022, .238)) - W).normalized()
    rot = d.to_track_quat('Z', 'Y').to_matrix()
    ex, ey = rot.col[0].copy(), rot.col[1].copy()
    palm = ex * sx                      # out of the palm, towards his body
    HAND_FRAME[S] = (palm, ey, d, rot)
    BONES[f'hand.{S}'] = (tuple(W), tuple(W + d * .030 * HS), f'forearm.{S}')
    for k, (la, lb, r) in enumerate(((.019, .017, .0090), (.021, .018, .0093), (.018, .015, .0086))):
        la, lb, r = la * HS, lb * HS, r * HS
        base = W + d * .030 * HS + ey * (-.0118 + .0118 * k) * HS
        dk = (d + ey * (-.10 + .10 * k)).normalized()
        a, b = base + dk * la, base + dk * (la + lb)
        BONES[f'f{k}a.{S}'] = (tuple(base), tuple(a), f'hand.{S}')
        BONES[f'f{k}b.{S}'] = (tuple(a), tuple(b), f'f{k}a.{S}')
        FINGERS[(S, f'f{k}')] = (dk, r)
    tb = W + (d * .010 - ey * .016 + palm * .007) * HS
    dt = (d * .55 - ey * .65 + palm * .35).normalized()
    BONES[f'tha.{S}'] = (tuple(tb), tuple(tb + dt * .017 * HS), f'hand.{S}')
    BONES[f'thb.{S}'] = (tuple(tb + dt * .017 * HS), tuple(tb + dt * .031 * HS), f'tha.{S}')
    FINGERS[(S, 'th')] = (dt, .0098 * HS)

# Hand shapes: (first joint, second joint) curl in degrees per finger.
GRIPS = {
    'relaxed': {'th': (8, 10), 'f0': (18, 22), 'f1': (24, 28), 'f2': (30, 34)},
    'open':    {'th': (-8, 0), 'f0': (-4, 2), 'f1': (0, 2), 'f2': (2, 4)},
    'fist':    {'th': (38, 52), 'f0': (92, 100), 'f1': (95, 100), 'f2': (98, 100)},
    'point':   {'th': (34, 46), 'f0': (-2, 0), 'f1': (92, 100), 'f2': (96, 100)},
    'wave':    {'th': (-12, -4), 'f0': (-8, 0), 'f1': (-2, 2), 'f2': (4, 6), 'spread': 9},
}


def build_limbs(mats, coll):
    obs = []
    B = lambda n, i: Vector(BONES[n][i])
    for S, sx in (('L', 1), ('R', -1)):
        # sleeve: shoulder to cuff, one tube so the elbow bends smoothly
        sh = B(f'upper_arm.{S}', 0) + Vector((-.012 * sx, 0, .004))
        el = B(f'forearm.{S}', 0)
        wr = B(f'hand.{S}', 0)
        path = [sh.lerp(el, i / 10) for i in range(10)] + [el.lerp(wr, i / 10) for i in range(11)]
        sleeve = tube(f'Sleeve.{S}', path, lambda t: .043 - .006 * t + .006 * max(0, t - .88) / .12, segs=28, mat=mats['coat'])
        cuff = tube(f'Cuff.{S}', [wr + (wr - el).normalized() * -.012, wr + (wr - el).normalized() * .004], .040, segs=28, mat=mats['coat'])
        # the hand: a soft palm, then each finger segment its own capsule on its bone
        palm, ey, d, rot = HAND_FRAME[S]
        W = B(f'hand.{S}', 0)
        hand = ellipsoid(f'Hand.{S}', W + (d * .017 + palm * -.001) * HS, (.016 * HS, .021 * HS, .023 * HS), mat=mats['skin'], rot=rot, p=2.4)
        digits = []
        for f in ('th', 'f0', 'f1', 'f2'):
            dk, r = FINGERS[(S, f)]
            for j, part in enumerate('ab'):
                bn = f'{f}{part}.{S}'
                h0, h1 = B(bn, 0), B(bn, 1)
                rr = r * (1 if part == 'a' else .94)
                digits.append(tube(f'Fing.{bn}', [h0 - dk * rr * .2, h1], rr, segs=16, mat=mats['skin']))
        # trouser leg and shoe
        hp, kn, an = B(f'thigh.{S}', 0), B(f'shin.{S}', 0), B(f'foot.{S}', 0)
        lp = [hp.lerp(kn, i / 8) for i in range(8)] + [kn.lerp(an, i / 8) for i in range(9)]
        leg = tube(f'Leg.{S}', [p + Vector((0, 0, 0)) for p in lp], lambda t: .052 - .006 * t + .006 * max(0, t - .85) / .15,
                   segs=28, mat=mats['scrub'])
        sc = Vector((.070 * sx, -.026, .036))
        shoe = ellipsoid(f'Shoe.{S}', sc, (.042, .072, .038), mat=mats['shoe'], p=3.2)
        sole = ellipsoid(f'Sole.{S}', sc + Vector((0, 0, -.026)), (.045, .075, .012), mat=mats['sole'], p=4)
        lace = ellipsoid(f'Tongue.{S}', sc + Vector((0, -.018, .030)), (.022, .03, .010), mat=mats['sole'], p=3,
                         rot=Matrix.Rotation(math.radians(-25), 3, 'X'))
        for o in [sleeve, cuff, hand, leg, shoe, sole, lace] + digits:
            coll.objects.link(o); bpy.context.scene.collection.objects.unlink(o)
            obs.append(o)
    return obs


def build_lanyard(mats, coll):
    obs = []
    clip = coat_point(.405, 0, grow=.016)
    for sx in (1, -1):
        pts = [Vector((0, .066, .548)), Vector((.05 * sx, .046, .552)), Vector((.068 * sx, -.012, .546)),
               coat_point(.50, sx * 26, grow=.011), coat_point(.45, sx * 14, grow=.013), clip + Vector((.004 * sx, 0, .006))]
        # Catmull-Rom through the points
        path = []
        for i in range(len(pts) - 1):
            p0, p1, p2, p3 = pts[max(i - 1, 0)], pts[i], pts[i + 1], pts[min(i + 2, len(pts) - 1)]
            for k in range(8):
                t = k / 8
                path.append(.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
        path.append(pts[-1])
        obs.append(tube(f'Lanyard.{"L" if sx > 0 else "R"}', path, .0052, segs=12, mat=mats['lanyard']))
    obs.append(ellipsoid('Clip', clip + Vector((0, 0, -.004)), (.008, .004, .012), mat=mats['metal'], segs=16, rings=10))
    bc = clip + Vector((0, -.004, -.050))
    obs.append(ellipsoid('Badge', bc, (.027, .0035, .037), mat=mats['badge'], p=7))
    for o in obs:
        coll.objects.link(o); bpy.context.scene.collection.objects.unlink(o)
    return obs


def catmull(pts, k=8):
    pts = [Vector(p) for p in pts]
    path = []
    for i in range(len(pts) - 1):
        p0, p1, p2, p3 = pts[max(i - 1, 0)], pts[i], pts[i + 1], pts[min(i + 2, len(pts) - 1)]
        for j in range(k):
            t = j / k
            path.append(.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    path.append(pts[-1])
    return path


def build_stethoscope(mats, coll):
    """Draped round his neck over the collar: the chest piece hangs on his
    left (your right), the ear tubes on his right."""
    obs = []
    back = [Vector((-.04, .080, .577)), Vector((0, .084, .579)), Vector((.04, .080, .577))]
    left = [Vector((.075, .030, .574)), Vector((.083, -.030, .560)), coat_point(.515, 34, grow=.020),
            coat_point(.465, 31, grow=.021), coat_point(.415, 29, grow=.022), coat_point(.385, 28, grow=.024)]
    right = [Vector((-.075, .030, .574)), Vector((-.083, -.030, .560)), coat_point(.515, -34, grow=.020),
             coat_point(.47, -32, grow=.021), coat_point(.44, -31, grow=.022)]
    tubing = catmull(list(reversed(right)) + back + left, 10)
    obs.append(tube('Steth.Tube', tubing, .0062, segs=14, mat=mats['steth']))
    # chest piece: a metal bell with a dark diaphragm, facing out
    end = left[-1]
    out = Vector((end.x, end.y, 0)).normalized()
    rot = out.to_track_quat('-Y', 'Z').to_matrix()
    cp = end + out * .004 + Vector((0, 0, -.016))
    obs.append(tube('Steth.Stem', [end, cp + Vector((0, 0, .012))], .0045, segs=12, mat=mats['metal']))
    obs.append(ellipsoid('Steth.Bell', cp, (.018, .007, .018), mat=mats['metal'], rot=rot, p=3))
    obs.append(ellipsoid('Steth.Disc', cp + out * .006, (.015, .002, .015), mat=mats['steth'], rot=rot, p=3))
    # ear tubes: two metal tubes from the Y-piece, ear tips at the ends
    y0 = right[-1]
    for k, (ang, z) in enumerate(((-40, .392), (-22, .388))):
        tip = coat_point(z, ang, grow=.03)
        mid = y0.lerp(tip, .5) + Vector((y0.x, y0.y, 0)).normalized() * .01
        obs.append(tube(f'Steth.Ear{k}', catmull([y0, mid, tip], 6), .0034, segs=10, mat=mats['metal']))
        obs.append(ellipsoid(f'Steth.Tip{k}', tip, (.0075, .0075, .0075), mat=mats['steth'], segs=16, rings=10))
    obs.append(ellipsoid('Steth.Y', y0, (.0075, .006, .009), mat=mats['metal'], segs=16, rings=10))
    for o in obs:
        coll.objects.link(o); bpy.context.scene.collection.objects.unlink(o)
    return obs


def badge_material():
    """White card: a navy band, a photo square, two lines (drawn here, no text)."""
    from PIL import Image, ImageDraw
    path = os.path.join(TEX, 'badge.png')
    im = Image.new('RGB', (270, 370), (250, 251, 253))
    g = ImageDraw.Draw(im)
    g.rectangle((0, 0, 270, 70), fill=(37, 46, 109))
    g.rounded_rectangle((85, 100, 185, 210), 14, fill=(198, 214, 236))
    g.ellipse((112, 118, 158, 164), fill=(250, 196, 166))
    g.rounded_rectangle((60, 240, 210, 262), 8, fill=(37, 46, 109))
    g.rounded_rectangle((85, 285, 185, 302), 7, fill=(152, 161, 179))
    g.rectangle((0, 340, 270, 370), fill=(1, 184, 230))
    im.save(path)
    m = principled('Badge', BADGE, rough=.3, coat=.5)
    N, L = m.node_tree.nodes, m.node_tree.links
    img = N.new('ShaderNodeTexImage'); img.image = bpy.data.images.load(path, check_existing=True)
    tc = N.new('ShaderNodeTexCoord')
    mp = N.new('ShaderNodeMapping')          # generated coords: x across, z up -> image
    mp.inputs['Location'].default_value = (0, 0, 0)
    sep = N.new('ShaderNodeSeparateXYZ'); comb = N.new('ShaderNodeCombineXYZ')
    L.new(tc.outputs['Generated'], sep.inputs['Vector'])
    L.new(sep.outputs['X'], comb.inputs['X']); L.new(sep.outputs['Z'], comb.inputs['Y'])
    L.new(comb.outputs['Vector'], img.inputs['Vector'])
    L.new(img.outputs['Color'], N['Principled BSDF'].inputs['Base Color'])
    return m


# ---------- the skeleton ----------
def build_rig(coll):
    ad = bpy.data.armatures.new('RigData')
    arm = bpy.data.objects.new('Rig', ad)
    coll.objects.link(arm)
    ad.display_type = 'STICK'
    vl = bpy.context.view_layer
    vl.objects.active = arm
    arm.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    for name, (h, t, par) in BONES.items():
        eb = ad.edit_bones.new(name)
        eb.head, eb.tail = h, t
        eb.roll = 0
    for name, (h, t, par) in BONES.items():
        if par:
            eb = ad.edit_bones[name]
            eb.parent = ad.edit_bones[par]
            eb.use_connect = Vector(BONES[par][1]) == Vector(h) and name not in ('hips',)
    bpy.ops.object.mode_set(mode='OBJECT')
    for pb in arm.pose.bones:
        pb.rotation_mode = 'XYZ'
    return arm


def seg_dist(p, a, b):
    a, b = Vector(a), Vector(b)
    ab = b - a
    t = max(0, min(1, (p - a).dot(ab) / ab.length_squared))
    return (p - (a + ab * t)).length


def skin(ob, arm, bones, power=4.0, bias=None):
    """Weights by inverse distance to the allowed bones (rigid if only one).
    bias: optional {bone: factor} to make a bone pull less (factor > 1)."""
    ob.parent = arm
    mod = ob.modifiers.new('Armature', 'ARMATURE'); mod.object = arm
    # keep the armature first, before subdivision/solidify
    ob.modifiers.move(len(ob.modifiers) - 1, 0)
    groups = {b: ob.vertex_groups.new(name=b) for b in bones}
    if len(bones) == 1:
        groups[bones[0]].add(range(len(ob.data.vertices)), 1.0, 'REPLACE')
        return
    for v in ob.data.vertices:
        p = ob.matrix_world @ v.co
        ws = []
        for b in bones:
            f = (bias or {}).get(b, 1.0)
            f = f(p) if callable(f) else f
            d = seg_dist(p, BONES[b][0], BONES[b][1]) * f
            ws.append(1 / (d ** power + 1e-9))
        tot = sum(ws)
        for b, w in zip(bones, ws):
            if w / tot > .002:
                groups[b].add([v.index], w / tot, 'REPLACE')


def coat_thigh(sx):
    """How little a thigh pulls on the coat: the front of the skirt, on its
    own side, follows the leg (so a raised knee carries the hem with it);
    the back and the chest hardly at all."""
    def f(p):
        low = max(0, min(1, (.30 - p.z) / .09))
        front = max(0, min(1, (-p.y + .01) / .09))
        side = max(0, min(1, .5 + 6 * p.x * sx))
        return 2.4 - 1.35 * low * front * side
    return f


def rig_everything(arm, objs):
    trunk = ['hips', 'spine', 'chest']
    for o in objs:
        n = o.name.split('.')[0]
        S = o.name.split('.')[-1] if '.' in o.name else ''
        if n in ('Head', 'Hair', 'Ear', 'EarIn'):
            skin(o, arm, ['head'])
        elif n == 'Neck':
            skin(o, arm, ['neck', 'head'], bias={'head': 3})
        elif n == 'Collar':
            skin(o, arm, ['chest', 'neck'], bias={'neck': 1.5})
        elif n in ('Coat', 'Lapel', 'Button', 'Pocket', 'BreastPocket', 'Pen', 'Scrubs', 'ThroatV'):
            skin(o, arm, trunk + ['neck', 'thigh.L', 'thigh.R'], bias={'thigh.L': coat_thigh(1), 'thigh.R': coat_thigh(-1), 'neck': 1.6})
        elif n in ('Lanyard', 'Clip', 'Badge', 'Steth'):
            skin(o, arm, ['chest'])
        elif n == 'Sleeve':
            skin(o, arm, [f'upper_arm.{S}', f'forearm.{S}', 'chest'], bias={'chest': 2.5})
        elif n == 'Cuff':
            skin(o, arm, [f'forearm.{S}'])
        elif n == 'Hand':
            skin(o, arm, [f'hand.{S}'])
        elif n == 'Fing':
            skin(o, arm, [o.name[5:]])
        elif n == 'Leg':
            skin(o, arm, [f'thigh.{S}', f'shin.{S}', 'hips'], bias={'hips': 2.5})
        elif n in ('Shoe', 'Sole', 'Tongue'):
            skin(o, arm, [f'foot.{S}'])
        else:
            print('unrigged', o.name)


# ---------- posing ----------
def pose(arm, spec, face=None):
    """spec: {bone: (rx, ry, rz) degrees about his own axes at rest (X his left,
    Y his back, Z up), relative to the parent}, plus 'lift': metres up for hips,
    'drop' likewise down, 'point.L/R': True to show a pointing finger."""
    for pb in arm.pose.bones:
        pb.rotation_euler = (0, 0, 0)
        pb.location = (0, 0, 0)
    spec = dict(spec)
    for S in ('L', 'R'):
        g = GRIPS[spec.get(f'grip.{S}', 'relaxed')]
        palm = HAND_FRAME[S][0]
        spread = g.get('spread', 0)
        for f, ab in g.items():
            if f == 'spread':
                continue
            a, b = ab
            dk = FINGERS[(S, f)][0]
            u = (-palm).cross(dk).normalized()
            fan = {'f0': -1, 'f1': 0, 'f2': 1}.get(f, 0) * spread
            M = Matrix.Rotation(math.radians(fan), 3, palm) @ Matrix.Rotation(math.radians(a), 3, u)
            spec[f'{f}a.{S}'] = ('mat', M)
            spec[f'{f}b.{S}'] = ('mat', Matrix.Rotation(math.radians(b), 3, u))
    for b, r in spec.items():
        if b not in arm.pose.bones:
            continue
        pb = arm.pose.bones[b]
        M = pb.bone.matrix_local.to_3x3()
        if isinstance(r, tuple) and r and r[0] == 'mat':
            R = r[1]
        else:
            R = Matrix.Rotation(math.radians(r[2]), 3, 'Z') @ Matrix.Rotation(math.radians(r[1]), 3, 'Y') @ Matrix.Rotation(math.radians(r[0]), 3, 'X')
        q = (M.inverted() @ R @ M).to_quaternion()
        pb.rotation_mode = 'QUATERNION'
        pb.rotation_quaternion = q
    off = Vector((0, 0, spec.get('lift', 0) - spec.get('drop', 0))) + Vector(spec.get('move', (0, 0, 0)))
    pb = arm.pose.bones['root']
    pb.location = pb.bone.matrix_local.to_3x3().inverted() @ off
    if face:
        set_face(face)


def set_face(name):
    m = bpy.data.materials['Skin_Face']
    node = m.node_tree.nodes['FaceTex']
    node.image = bpy.data.images.load(os.path.join(TEX, f'face_{name}.png'), check_existing=True)


# ---------- studio ----------
def studio():
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = 64
    sc.cycles.use_denoising = True
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'
    sc.view_settings.exposure = -.5 if STYLE_NOW == 'film' else -.75
    sc.render.film_transparent = False
    w = bpy.data.worlds.new('World'); sc.world = w
    w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Color'].default_value = srgb(226, 232, 242)
    w.node_tree.nodes['Background'].inputs['Strength'].default_value = .35

    def area(name, loc, target, size, power, color=(1, 1, 1)):
        ld = bpy.data.lights.new(name, 'AREA'); ld.size = size; ld.energy = power; ld.color = color
        ob = bpy.data.objects.new(name, ld); sc.collection.objects.link(ob)
        ob.location = loc
        d = (Vector(target) - Vector(loc)).normalized()
        ob.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
        return ob
    area('Key', (-1.4, -2.0, 2.2), (0, 0, .6), 1.6, 190, (1, .97, .92))
    area('Fill', (2.0, -1.6, 1.0), (0, 0, .6), 2.5, 70, (.88, .93, 1))
    area('Rim', (.6, 2.2, 2.0), (0, 0, .7), 1.2, 160, (.9, .95, 1))
    area('Top', (0, -.3, 3.0), (0, 0, .5), 2.0, 50 if STYLE_NOW != 'film' else 20)
    # floor: a soft studio sweep (floor curving up into a back wall) in the app's blue-grey
    prof = []
    for i in range(41):
        y = -8 + i * .25 if i <= 32 else None
        if i <= 32:
            prof.append((-8 + 11 * i / 32, 0))
        else:
            a = (i - 32) / 8 * math.pi / 2
            prof.append((3 + 3 * math.sin(a), 3 * (1 - math.cos(a))))
    prof.append((6, 10))
    vs, fs = [], []
    for x in (-8, 8):
        for y, z in prof:
            vs.append((x, y, z))
    m = len(prof)
    fs = [(i, i + 1, m + i + 1, m + i) for i in range(m - 1)]
    drop = STAND_H if STYLE_NOW == 'figure' else 0
    fl = mesh_obj('Floor', [(x, y, z - drop) for x, y, z in vs], fs)
    fm = principled('Floor', srgb(196, 206, 222), rough=.7, coat=0)
    fl.data.materials.append(fm)
    cam_d = bpy.data.cameras.new('Cam'); cam_d.lens = 85
    cam = bpy.data.objects.new('Cam', cam_d); sc.collection.objects.link(cam)
    sc.camera = cam
    return cam


STAND_H = .036      # the display stand he stands on; the floor sits under it


def build_stand(coll):
    m = principled('Stand', srgb(37, 46, 109), rough=.22, coat=.6)
    rim = principled('StandRim', srgb(1, 184, 230), rough=.3, coat=.4)
    st = ellipsoid('Stand', (0, -.01, -STAND_H / 2), (.25, .25, STAND_H / 2), mat=m, segs=96, rings=24, p=7)
    ring = ellipsoid('StandRing', (0, -.01, -.002), (.236, .236, .003), mat=rim, segs=96, rings=8, p=8)
    top = ellipsoid('StandTop', (0, -.01, -.0005), (.226, .226, .002), mat=m, segs=96, rings=8, p=8)
    for o in (st, ring, top):
        coll.objects.link(o); bpy.context.scene.collection.objects.unlink(o)
    return [st, ring, top]


def look(cam, target, dist, az, el):
    t = Vector(target)
    cam.location = t + sph(az, el) * dist
    cam.rotation_euler = (t - cam.location).to_track_quat('-Z', 'Y').to_euler()


STYLE = 'film'        # 'film' (art direction 3: his drawing wrapped on), 'figure' (2) or 'v1' (the first look)


STYLE_NOW = STYLE


def build(head_only=False, style=None):
    global STYLE_NOW
    style = STYLE_NOW = style or STYLE
    bpy.ops.wm.read_factory_settings(use_empty=True)
    coll = bpy.data.collections.new('DrSmiley'); bpy.context.scene.collection.children.link(coll)
    mats = {
        'face': skin_face_material(os.path.join(TEX, 'face_rest.png')),
        'skin': principled('Skin', SKIN, rough=.42, coat=.18, sss=.12),
        'ear': principled('Ear', SKIN_EAR, rough=.45, coat=.15, sss=.15),
        'earin': principled('EarIn', srgb(236, 140, 128), rough=.5, coat=.1, sss=.15),
        'hair': {'figure': fig_hair_material, 'film': hair_film_material}.get(style, hair_material)(),
        'coat': principled('Coat', COAT, rough=.42, coat=.3) if style == 'figure' else principled('Coat', COAT, rough=.55, coat=.12, sheen=.3),
        'scrub': principled('Scrubs', SCRUB, rough=.45, coat=.25) if style == 'figure' else principled('Scrubs', SCRUB, rough=.6, coat=.08, sheen=.4),
        'shoe': principled('Shoe', SHOE, rough=.4, coat=.3),
        'sole': principled('Sole', SOLE, rough=.45, coat=.2),
        'button': principled('Button', srgb(214, 220, 232), rough=.25, coat=.6),
        'pen': principled('Pen', srgb(15, 95, 166), rough=.25, coat=.6),
        'lanyard': principled('Lanyard', LANYARD, rough=.55, coat=.1, sheen=.4),
        'metal': principled('Metal', srgb(200, 205, 215), rough=.2, coat=.3),
        'steth': principled('Stethoscope', srgb(37, 46, 109), rough=.35, coat=.4),
        'badge': None,
    }
    mats['badge'] = badge_material()
    head = build_head(mats, coll)
    subsurf(head, 1)
    ears = build_ears(mats, coll)
    for e in ears:
        subsurf(e, 1)
    hair = {'figure': build_hair_figure, 'film': build_hair_figure}.get(style, build_hair)(mats, coll)
    subsurf(hair, 1)
    arm = None
    if not head_only:
        body = build_coat(mats, coll) + build_torso(mats, coll) + build_limbs(mats, coll) + build_lanyard(mats, coll) + build_stethoscope(mats, coll)
        for o in body:
            if o.name.split('.')[0] in ('Sleeve', 'Leg', 'Hand', 'Thumb', 'Shoe', 'Sole', 'Scrubs', 'Neck', 'Pocket', 'BreastPocket', 'Badge'):
                subsurf(o, 1)
            elif o.name.split('.')[0] in ('Coat', 'Lapel', 'Collar'):
                subsurf(o, 2)
        if style == 'figure':
            build_stand(coll)
        arm = build_rig(coll)
        rig_everything(arm, [head, hair] + ears + body)
    root = bpy.data.objects.new('DrSmiley', None); coll.objects.link(root)
    for o in list(coll.objects):
        if o is not root and o.parent is None:
            o.parent = root
    cam = studio()
    return dict(head=head, hair=hair, cam=cam, mats=mats, root=root, arm=arm)


if __name__ == '__main__':
    import sys
    build(head_only='head' in sys.argv)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'smiley.blend'))
