"""His eyes made to look alive (out/plan-alive.png, eyes first, Jose's pick
2026-10-22). Run on in/tripo-face.blend after tripo_muscles.py.

  (a) a clear dome over each iris (the cornea): the shine now comes from the
      studio lights on it and moves with them, instead of a painted white oval
  (b) the iris given fine fibres running out from the pupil, a lighter ring
      round the pupil and a darker rim, so it has depth under the dome

  python3 tripo_eyes2.py      -> in/tripo-face.blend, out/plan/eyes2-*.png

set_gaze(eye, gx, gz) here moves the dome with the iris (it wraps
tripo_eyes.set_gaze).
"""
import os, sys, math
import numpy as np
import bpy
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tripo_eyes as E
import build

HERE = os.path.dirname(os.path.abspath(__file__))
BULGE = .0026          # how far the dome stands off the ball at the iris centre (the ball is only 12 mm deep)
GRID = 24


def eye_params(eye):
    N = eye.data.materials[0].node_tree.nodes
    rx, rz = N['RX'].outputs[0].default_value, N['RZ'].outputs[0].default_value
    ry = max(abs(v.co.y) for v in eye.data.vertices)
    els = [e.position for e in N['Color Ramp'].color_ramp.elements]
    iris_r = sorted(els)[-2] - .02
    return rx, ry, rz, iris_r, N['GazeX'].outputs[0].default_value, N['GazeZ'].outputs[0].default_value


def dome_verts(eye):
    rx, ry, rz, R, gx, gz = eye_params(eye)
    R *= 1.06                                        # just past the iris's rim
    vs = []
    for i in range(GRID + 1):
        r = R * i / GRID
        for j in range(GRID * 2):
            a = 2 * math.pi * j / (GRID * 2)
            u, v = gx + r * math.cos(a), gz + r * math.sin(a)
            q = max(0., 1 - u * u - v * v)
            p = np.array([u * rx, -ry * math.sqrt(q), v * rz])
            n = np.array([p[0] / rx ** 2, p[1] / ry ** 2, p[2] / rz ** 2]); n /= np.linalg.norm(n)
            vs.append(tuple(p + n * (BULGE * (1 - (r / R) ** 2) + .00015)))
    return vs


def dome_faces():
    S = GRID * 2
    fs = [(0 * S + j, 1 * S + j, 1 * S + (j + 1) % S) for j in range(S)]          # the centre ring as a fan of quads' worth
    fs += [(i * S + j, (i + 1) * S + j, (i + 1) * S + (j + 1) % S, i * S + (j + 1) % S) for i in range(1, GRID) for j in range(S)]
    return fs


def add_cornea(eye):
    name = 'Cornea.' + eye.name.split('.')[-1]
    if name in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects[name])
    m = bpy.data.materials.get('Cornea') or bpy.data.materials.new('Cornea')
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (1, 1, 1, 1)
    b.inputs['Transmission Weight'].default_value = 1
    b.inputs['Roughness'].default_value = .02
    b.inputs['IOR'].default_value = 1.376                 # the human cornea
    b.inputs['Specular IOR Level'].default_value = .5
    me = bpy.data.meshes.new(name); me.from_pydata(dome_verts(eye), [], dome_faces()); me.validate(); me.shade_smooth()
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    ob.data.materials.append(m)
    ob.visible_shadow = False                           # clear: it must not shade the iris under it
    # rides the eye: same place, and the eye's own skeleton parent
    ob.parent = eye.parent; ob.parent_type = eye.parent_type; ob.parent_bone = eye.parent_bone
    ob.matrix_world = eye.matrix_world.copy()
    for md in eye.modifiers:
        if md.type == 'ARMATURE':
            am = ob.modifiers.new('Armature', 'ARMATURE'); am.object = md.object
            vg = ob.vertex_groups.new(name=eye.vertex_groups[0].name) if eye.vertex_groups else None
            if vg:
                vg.add(list(range(len(me.vertices))), 1.0, 'REPLACE')
    return ob


def eye_lights():
    """The eyes reflect one small round catchlight, up and to the right as in
    his drawing, and nothing else: the studio's big square lights showed as
    two rectangles in the dome, and the grey room and floor hazed the pupils.
    The catchlight is seen only in reflections; the lights still light him."""
    sc = bpy.context.scene
    for o in sc.objects:
        if o.type == 'LIGHT' or o.name.startswith('Floor'):
            o.visible_glossy = False
    if sc.world:
        sc.world.cycles_visibility.glossy = False
    if 'Catchlight' not in bpy.data.objects:
        from mathutils import Vector
        segs, r = 32, .32          # big: the dome shrinks reflections, and his drawn shine is big
        vs = [(0, 0, 0)] + [(r * math.cos(2 * math.pi * k / segs), r * math.sin(2 * math.pi * k / segs), 0) for k in range(segs)]
        fs = [(0, 1 + k, 1 + (k + 1) % segs) for k in range(segs)]
        me = bpy.data.meshes.new('Catchlight'); me.from_pydata(vs, [], fs)
        ob = bpy.data.objects.new('Catchlight', me); sc.collection.objects.link(ob)
        m = bpy.data.materials.new('Catchlight'); m.use_nodes = True
        N = m.node_tree.nodes; out = N['Material Output']
        em = N.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = 70     # glass reflects ~3%: bright, so the shine reads white
        m.node_tree.links.new(em.outputs[0], out.inputs['Surface']); me.materials.append(m)
        ob.location = (1.0, -1.2, 1.3)       # up and to the right, as in his drawing
        ob.rotation_euler = (Vector((.02, -.13, .76)) - ob.location).to_track_quat('Z', 'Y').to_euler()
        for k in ('camera', 'diffuse', 'transmission', 'volume_scatter', 'shadow'):
            setattr(ob, 'visible_' + k, False)


def set_gaze(eye, gx, gz):
    E.set_gaze(eye, gx, gz)
    c = bpy.data.objects.get('Cornea.' + eye.name.split('.')[-1])
    if c:
        c.data.vertices.foreach_set('co', np.array(dome_verts(eye)).ravel()); c.data.update()


def iris_detail(mat):
    """Fibres running out from the pupil, a lighter ring round it and a darker
    rim, multiplied into the iris band of the eye's colour."""
    N, L = mat.node_tree.nodes, mat.node_tree.links
    if 'IrisFibres' in N:
        return
    ramp = N['Color Ramp']
    els = sorted(e.position for e in ramp.color_ramp.elements)
    pupil_r, iris_r = els[1] + .01, els[-2] - .02
    d_sock = ramp.inputs['Fac'].links[0].from_socket          # distance from the gaze point
    # u, v: the two SUBTRACT nodes feeding the distance; found through the SQRT's input
    sq = [n for n in N if n.type == 'MATH' and n.operation == 'SQRT'][0]
    add = sq.inputs[0].links[0].from_node
    mu, mv = add.inputs[0].links[0].from_node, add.inputs[1].links[0].from_node
    u, v = mu.inputs[0].links[0].from_socket, mv.inputs[0].links[0].from_socket
    def node(op, a, b=None):
        n = N.new('ShaderNodeMath'); n.operation = op
        for i, x in enumerate((a, b)):
            if x is None:
                continue
            if isinstance(x, (int, float)):
                n.inputs[i].default_value = x
            else:
                L.new(x, n.inputs[i])
        return n.outputs[0]
    ang = node('ARCTAN2', v, u)
    vec = N.new('ShaderNodeCombineXYZ')
    L.new(node('MULTIPLY', ang, 9), vec.inputs['X']); L.new(node('MULTIPLY', d_sock, 3), vec.inputs['Y'])
    nz = N.new('ShaderNodeTexNoise'); nz.name = 'IrisFibres'; nz.noise_dimensions = '2D'
    nz.inputs['Scale'].default_value = 7; nz.inputs['Detail'].default_value = 8; nz.inputs['Roughness'].default_value = .7
    L.new(vec.outputs[0], nz.inputs['Vector'])
    # brightness: fibres (+-30%), a lighter collarette just outside the pupil, a darker limbal ring
    t = node('DIVIDE', node('SUBTRACT', d_sock, pupil_r), iris_r - pupil_r)              # 0 at the pupil, 1 at the rim
    fib = node('ADD', .45, node('MULTIPLY', nz.outputs['Fac'], 1.1))     # fibres +-50%: at +-30% they did not show
    coll = node('ADD', 1, node('MULTIPLY', .35, node('MAXIMUM', 0, node('SUBTRACT', 1, node('ABSOLUTE', node('MULTIPLY', node('SUBTRACT', t, .22), 7))))))
    limb = node('SUBTRACT', 1, node('MULTIPLY', .45, node('POWER', node('MAXIMUM', 0, node('MINIMUM', 1, t)), 3)))
    band = node('MULTIPLY', node('GREATER_THAN', t, 0), node('LESS_THAN', t, 1))
    k = node('ADD', node('SUBTRACT', 1, band), node('MULTIPLY', band, node('MULTIPLY', node('MULTIPLY', fib, coll), limb)))
    mix_in = ramp.outputs['Color'].links[0].to_socket
    mul = N.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs['Factor'].default_value = 1
    kk = N.new('ShaderNodeCombineColor')
    for ch in ('Red', 'Green', 'Blue'):
        L.new(k, kk.inputs[ch])
    L.new(ramp.outputs['Color'], mul.inputs['A']); L.new(kk.outputs[0], mul.inputs['B'])
    L.new(mul.outputs['Result'], mix_in)
    # the iris a touch glossier under the dome is the dome's job: the ball stays matte
    return mat


LID_R, LID_D = 1.2, 1.25     # the lid shell round the ball, as tripo_eyes.py: 1.2x wide, 1.25x deep
ARCH_OPEN, ARCH_SHUT = 22, -4   # degrees the edge rises over the pupil: an arch open, a soft sag shut


def lid_stage_verts(rx, ry, rz, edge, arch, side, rows=48, segs=128, lash=.0058, grow=1.):
    """One stage of the new lid: the shell from the top down to an edge that
    arches over the pupil (a flat cut made the lowered lid a card with a
    straight edge), a rounded rim with thickness, and a lash sweep growing
    from the rim: short at the inner corner, longest and flicking up at the
    outer one, only along the front."""
    vs = []
    out_x = 1 if side == 'L' else -1                 # his left eye's outer corner is +x
    def pt(el, az, k=1.0):
        el = math.radians(el)
        return np.array([rx * LID_R * k * math.cos(el) * math.sin(az), -(ry * LID_D * k) * math.cos(el) * math.cos(az),
                         rz * LID_R * k * math.sin(el)])
    azs = [2 * math.pi * j / segs for j in range(segs)]
    edges = [edge + arch * max(0., math.cos(a)) ** 1.5 for a in azs]
    for r in range(rows + 1):
        for j, a in enumerate(azs):
            vs.append(pt(90 - (90 - edges[j]) * r / rows, a))
    for j, a in enumerate(azs):                      # the rim, rolled under toward the ball
        vs.append(pt(edges[j] - 1.6, a, .985))
    for j, a in enumerate(azs):
        vs.append(pt(edges[j] + 2.5, a, .962))
    for j, a in enumerate(azs):                      # lash roots, on the rim's front
        vs.append(pt(edges[j] - .6, a, 1.004))
    for j, a in enumerate(azs):                      # lash tips: out from the ball, and up
        root = pt(edges[j] - .6, a, 1.004)
        n = np.array([root[0] / rx ** 2, root[1] / ry ** 2, root[2] / rz ** 2]); n /= np.linalg.norm(n)
        front = max(0., math.cos(a)) ** .5 * (math.cos(a) > .12)
        t = math.sin(a) * out_x                      # -1 inner corner .. +1 outer
        length = grow * lash * front * (.25 + .75 * (t + 1) / 2) * (1 + .7 * max(0., (t - .45) / .55))
        up = np.array([0, 0, 1.])
        vs.append(root + (n * .75 + up * .55) * length)
    return [tuple(v) for v in vs]


_FACE = {}


def face_grid(eye, rx, rz, n=90, span=1.7):
    """His face's depth round one eye, in the eye's own frame (y: into the head),
    on an n x n grid of x/rx, z/rz from -span to span: ray casts along the eye's
    forward line onto his face, done once per eye."""
    if eye.name in _FACE:
        return _FACE[eye.name]
    from mathutils import Vector
    head = bpy.data.objects['Mesh_0']
    M, Mi, Hi = eye.matrix_world, eye.matrix_world.inverted(), head.matrix_world.inverted()
    fwd = (M.to_3x3() @ Vector((0, -1, 0))).normalized()
    d = (Hi.to_3x3() @ -fwd).normalized()
    us = np.linspace(-span, span, n)
    g = np.full((n, n), np.nan)
    for i, v in enumerate(us):
        for j, u in enumerate(us):
            w = M @ Vector((u * rx, 0, v * rz))
            hit, loc, *_ = head.ray_cast(Hi @ (w + fwd * .05), d)
            if hit:
                g[i, j] = (Mi @ (head.matrix_world @ loc)).y
    _FACE[eye.name] = (us, g)
    return _FACE[eye.name]


def wrap(vs, eye, rx, ry, rz, rows=None, segs=128, extra=0.):
    # extra: more room off the ball; the upper lid gets .8 mm so it closes over the lower
    # one (at one depth they flickered through each other)
    """A lid wrapped into his skin (Jose's OK, 2026-10-22: shut eyes looked like
    goggles, shells standing out over his face): inside the eye's outline it
    stays on the ball; outside, it tucks just under his skin, the way a real lid
    goes under the brow and cheek; between, a smooth blend. Never into the ball,
    and clear of the glass dome over the iris."""
    from tripo_faceplan import smooth
    us, g = face_grid(eye, rx, rz)
    v = np.array(vs)
    u, w = v[:, 0] / rx, v[:, 2] / rz
    rho = np.hypot(u, w)
    n = len(us); step = us[1] - us[0]
    fi = np.clip((w - us[0]) / step, 0, n - 1.001); fj = np.clip((u - us[0]) / step, 0, n - 1.001)
    i0, j0 = fi.astype(int), fj.astype(int); ti, tj = fi - i0, fj - j0
    gg = np.where(np.isnan(g), np.nanmax(g), g)
    fy = (gg[i0, j0] * (1 - ti) * (1 - tj) + gg[i0 + 1, j0] * ti * (1 - tj) + gg[i0, j0 + 1] * (1 - ti) * tj + gg[i0 + 1, j0 + 1] * ti * tj)
    # only the lid's front half: its back half (behind the eye's centre) was pulled forward too
    # and showed as a second, lower lid edge under the lash line
    front = v[:, 1] < 0
    s = smooth((rho - .85) / .3) * front
    y = v[:, 1] * (1 - s) + (fy + .0006) * s            # outside: .6 mm under his skin
    inside = rho < 1
    yb = -ry * np.sqrt(np.clip(1 - rho * rho, 0, 1))   # the ball's front surface (its y is out-negative)
    margin = .0008 + extra + (BULGE + .0008) * (1 - smooth((rho - .7) / .25))
    # a soft minimum: where the shut lid lies almost on the clearance surface, a hard
    # min switched between the two point by point and shaded as a grid (a cross on the lid)
    a_, b_ = y, yb - margin
    soft = (a_ + b_) / 2 - np.sqrt(((a_ - b_) / 2) ** 2 + .0012 ** 2)
    y = np.where(inside & front, soft, y)
    dy = y - v[:, 1]
    if rows is not None:
        # the rim and lashes move as one piece with their column's lid edge: pushed out
        # point by point, their rolled shape was crushed into jagged dotted lines
        e0 = rows * segs
        k = np.arange(e0 + segs, len(v))
        dy[k] = dy[e0 + (k - e0) % segs]
    v[:, 1] += dy
    return [tuple(p) for p in v]


def lid_faces(rows=48, segs=128):
    q = lambda r: [(r * segs + j, r * segs + (j + 1) % segs, (r + 1) * segs + (j + 1) % segs, (r + 1) * segs + j) for j in range(segs)]
    shell = [f for r in range(rows - 2) for f in q(r)]
    rim = q(rows + 1)
    # the rim's front is the dark lash line: seen from the front, the lashes point at you
    # and read as a thin line on their own
    lash = q(rows) + q(rows - 1) + q(rows - 2)   # a bold line on the lid's edge, moving with it; the rim's dark front only: the spiky lash sweep read awkward (Jose; animators keep boys' lashes to a line)
    return shell + rim, lash


LOW_REST, LOW_HIGH = -58, -24        # the lower lid's edge: at rest under the iris, raised for a squint or a laugh
LOW_ARCH_REST, LOW_ARCH_HIGH = -5, 16   # a slight dip at rest; pushed up by the cheeks it bows up (the laugh's arc)
LOW_STAGES = 6
LOW_R, LOW_D = 1.03, 1.3      # the lower lid hugs the ball (1.2x wide, like the upper, it stood out over his
                              # cheek: a floating lash line, a pink disc raised); deep enough to clear the glass dome


def lower_stage_verts(rx, ry, rz, edge, arch, side, rows=32, segs=128, lash=.0022):
    """The lower lid: a shell from the bottom of the ball up to an edge, with a
    rim and short lashes, the upper lid's build turned upside down."""
    vs = []
    out_x = 1 if side == 'L' else -1
    def pt(el, az, k=1.0):
        el = math.radians(el)
        return np.array([rx * LOW_R * k * math.cos(el) * math.sin(az), -(ry * LOW_D * k) * math.cos(el) * math.cos(az),
                         rz * LOW_R * k * math.sin(el)])
    azs = [2 * math.pi * j / segs for j in range(segs)]
    edges = [edge + arch * max(0., math.cos(a)) ** 1.5 for a in azs]
    for r in range(rows + 1):
        for j, a in enumerate(azs):
            vs.append(pt(-90 + (edges[j] + 90) * r / rows, a))
    for j, a in enumerate(azs):
        vs.append(pt(edges[j] + 1.4, a, .985))
    for j, a in enumerate(azs):
        vs.append(pt(edges[j] - 2.2, a, .962))
    for j, a in enumerate(azs):
        vs.append(pt(edges[j] + .5, a, 1.004))
    for j, a in enumerate(azs):
        root = pt(edges[j] + .5, a, 1.004)
        n = np.array([root[0] / rx ** 2, root[1] / ry ** 2, root[2] / rz ** 2]); n /= np.linalg.norm(n)
        front = max(0., math.cos(a)) ** .5 * (math.cos(a) > .15)
        t = math.sin(a) * out_x
        length = lash * front * (.3 + .7 * (t + 1) / 2)
        vs.append(root + (n * .8 - np.array([0, 0, 1.]) * .45) * length)
    return [tuple(v) for v in vs]


def build_lower_lid(eye, side):
    """A new lower lid per eye, riding the head like the upper one; shape keys
    U1..U6 raise it (set_lower drives them)."""
    name = 'LidLow.' + side
    if name in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects[name])
    up = bpy.data.objects['Lid.' + side]
    N = eye.data.materials[0].node_tree.nodes
    rx, rz = N['RX'].outputs[0].default_value, N['RZ'].outputs[0].default_value
    ry = max(abs(v.co.y) for v in eye.data.vertices)
    st = [(LOW_REST + (LOW_HIGH - LOW_REST) * k / LOW_STAGES, LOW_ARCH_REST + (LOW_ARCH_HIGH - LOW_ARCH_REST) * k / LOW_STAGES)
          for k in range(LOW_STAGES + 1)]
    skin, lash = lid_faces(rows=32)
    me = bpy.data.meshes.new(name)
    me.from_pydata(wrap(lower_stage_verts(rx, ry, rz, *st[0], side), eye, rx, ry, rz, rows=32), [], skin + lash); me.shade_smooth()
    # the cheek's own colour, not the upper lid's darker tone: raised, it must read as his cheek pushing up
    lm = bpy.data.materials.get('LidLow') or bpy.data.materials['Lid'].copy()
    lm.name = 'LidLow'
    c = cheek_colour(eye)
    lm.node_tree.nodes['Color Ramp'].color_ramp.elements[0].color = build.srgb(*c)
    me.materials.append(lm); me.materials.append(bpy.data.materials['Lash'])
    me.polygons.foreach_set('material_index', [0] * len(skin) + [1] * len(lash))
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    ob.parent = up.parent; ob.parent_type = up.parent_type; ob.matrix_world = up.matrix_world.copy()
    for md in up.modifiers:
        if md.type == 'ARMATURE':
            am = ob.modifiers.new('Armature', 'ARMATURE'); am.object = md.object
    ob.vertex_groups.new(name='head').add(list(range(len(me.vertices))), 1.0, 'REPLACE')
    ob.shape_key_add(name='Basis', from_mix=False)
    for k in range(1, LOW_STAGES + 1):
        kb = ob.shape_key_add(name=f'U{k}', from_mix=False)
        kb.data.foreach_set('co', np.array(wrap(lower_stage_verts(rx, ry, rz, *st[k], side), eye, rx, ry, rz, rows=32)).ravel())
        kb.value = 0
    return ob


def cheek_colour(eye):
    """His skin just under this eye, from the face texture."""
    import tripo_lib as T
    head = bpy.data.objects['Mesh_0']
    img, px = T.texture(head)
    cen, tuv = T.face_arrays(head)
    t = eye.matrix_world.translation
    rz = eye.data.materials[0].node_tree.nodes['RZ'].outputs[0].default_value
    sel = (np.abs(cen[:, 0] - t.x) < .012) & (np.abs(cen[:, 2] - (t.z - rz * 1.35)) < .005) & (cen[:, 1] < -.09)
    return [int(v) for v in np.median(T.sample(px, tuv[sel].mean(1)) * 255, 0)]


def lid_skin_colour_above(eye):
    """His skin between this eye and its brow, from the face texture (after the liner is painted out)."""
    import tripo_lib as T
    head = bpy.data.objects['Mesh_0']
    img, px = T.texture(head)
    cen, tuv = T.face_arrays(head)
    t = eye.matrix_world.translation
    rz = eye.data.materials[0].node_tree.nodes['RZ'].outputs[0].default_value
    sel = (np.abs(cen[:, 0] - t.x) < .015) & (np.abs(cen[:, 2] - (t.z + rz * 1.5)) < .004) & (cen[:, 1] < -.09)
    return [int(v) for v in np.median(T.sample(px, tuv[sel].mean(1)) * 255, 0)]


def set_lower(side, amount):
    """The lower lid raised 0 (rest) .. 1 (high: a squint, the laugh's arc), through its stages."""
    ob = bpy.data.objects.get('LidLow.' + side)
    if not ob:
        return
    a = max(0, min(1, amount)) * LOW_STAGES
    for i in range(1, LOW_STAGES + 1):
        ob.data.shape_keys.key_blocks[f'U{i}'].value = max(0, 1 - abs(a - i))


def caruncle(mat, side):
    """Pink inner corners and softer whites: the whites warm a little toward
    pink at the corner by his nose, as a real eye's do."""
    N, L = mat.node_tree.nodes, mat.node_tree.links
    if 'Caruncle' in N:
        return
    mul = [n for n in N if n.type == 'MIX' and n.blend_type == 'MULTIPLY' and n.outputs['Result'].links
           and n.outputs['Result'].links[0].to_socket.name == 'Base Color'][0]
    rest = [n for n in N if n.type == 'ATTRIBUTE' and n.attribute_name == 'rest_position'][0]
    sep = N.new('ShaderNodeSeparateXYZ'); L.new(rest.outputs['Vector'], sep.inputs['Vector'])
    rx = N['RX'].outputs[0]
    m = N.new('ShaderNodeMath'); m.operation = 'DIVIDE'; L.new(sep.outputs['X'], m.inputs[0]); L.new(rx, m.inputs[1])
    s = N.new('ShaderNodeMath'); s.operation = 'MULTIPLY'; L.new(m.outputs[0], s.inputs[0]); s.inputs[1].default_value = -1 if side == 'L' else 1
    ramp = N.new('ShaderNodeValToRGB'); ramp.name = 'Caruncle'
    ramp.color_ramp.elements[0].position, ramp.color_ramp.elements[0].color = .62, (1, 1, 1, 1)
    ramp.color_ramp.elements[1].position, ramp.color_ramp.elements[1].color = .97, (1, .62, .6, 1)
    L.new(s.outputs[0], ramp.inputs['Fac'])
    tint = N.new('ShaderNodeMix'); tint.data_type = 'RGBA'; tint.blend_type = 'MULTIPLY'; tint.inputs['Factor'].default_value = 1
    L.new(mul.outputs['Result'], tint.inputs['A']); L.new(ramp.outputs['Color'], tint.inputs['B'])
    L.new(tint.outputs['Result'], N['Principled BSDF'].inputs['Base Color'])


def paint_out_liner(eyes):
    """His model's eyeliner is painted into the skin texture above each eye.
    With the lid resting lower it showed as a second line, and stayed put as
    the lid came down (glasses). Animators keep the lash line on the lid's
    edge so it moves with it: the painted line goes, the lid's rim is the line.
    Dark texels in a ring round each eye (not the brows) become his skin."""
    import cv2, tripo_lib as T
    head = bpy.data.objects['Mesh_0']
    img, px = T.texture(head)
    cen, tuv = T.face_arrays(head)
    col = T.sample(px, tuv.mean(1)) * 255
    h, w = px.shape[:2]
    mask = np.zeros((h, w), np.uint8)
    ring = np.zeros(len(cen), bool)
    for eye in eyes:
        t = eye.matrix_world.translation
        N = eye.data.materials[0].node_tree.nodes
        rx, rz = N['RX'].outputs[0].default_value, N['RZ'].outputs[0].default_value
        rho = np.hypot((cen[:, 0] - t.x) / rx, (cen[:, 2] - t.z) / rz)
        near = (rho > .8) & (rho < 1.75) & (cen[:, 1] < -.09)
        dark = near & (col.sum(1) < 330)
        ring |= near & (rho > 1.3) & (col.sum(1) > 500)
        for f in np.nonzero(dark)[0]:
            cv2.fillConvexPoly(mask, np.round(tuv[f] * [w, h]).astype(np.int32), 1)
    skin = np.median(T.sample(px, tuv[ring].mean(1)), 0)
    mask = cv2.dilate(mask, np.ones((9, 9), np.uint8))
    soft = cv2.GaussianBlur(mask.astype(np.float32), (15, 15), 0)[..., None]
    out = px.copy(); out[..., :3] = out[..., :3] * (1 - soft) + skin * soft
    path = os.path.join(HERE, 'in', 'tex-noliner.png')
    Image.fromarray((np.clip(out[::-1], 0, 1) * 255).astype(np.uint8), 'RGBA').save(path)
    new = bpy.data.images.load(path, check_existing=False)
    for n in head.data.materials[0].node_tree.nodes:
        if n.type == 'TEX_IMAGE' and n.image == img:
            n.image = new
    print('liner painted out', int(mask.sum()), 'texels')


LINE_N, LINE_SG = 72, 8
HAPPY_EYE_DEPTH = .4


def line_verts(edge_pts, eye, side):
    """The lash line: one smooth tube riding the lid's edge, bold over the eye and
    tapering to nothing at both corners, thickest toward the outer corner (as
    animated films draw a boy's lash line: a bold stroke, no separate lashes)."""
    M = len(edge_pts)                      # the edge row, one point per azimuth step (front = index 0)
    out_x = 1 if side == 'L' else -1
    idx = [(j % M) for j in range(-M // 4 + 3, M // 4 - 2)]
    pts = np.array([edge_pts[i] for i in idx])
    # resample evenly along its length
    seg = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]
    t = np.linspace(0, seg[-1], LINE_N)
    P = np.stack([np.interp(t, seg, pts[:, k]) for k in range(3)], 1)
    P[:, 1] -= .0007                        # just in front of the lid's skin
    vs = []
    for k in range(LINE_N):
        u = k / (LINE_N - 1)
        x = P[k, 0] * out_x                 # outer corner is +x for his left eye
        bias = .75 + .5 * (x - P[:, 0].min() * out_x if out_x > 0 else 0) * 0
        r = (.0034 * math.sin(math.pi * u) ** .55 + .0002) * (1 + .35 * (u if out_x * (P[-1, 0] - P[0, 0]) > 0 else 1 - u))
        tan = P[min(k + 1, LINE_N - 1)] - P[max(k - 1, 0)]; tan /= np.linalg.norm(tan)
        a = np.array([0, -1., 0]); a -= tan * (a @ tan); a /= np.linalg.norm(a)
        b = np.cross(tan, a)
        for j in range(LINE_SG):
            ang = 2 * math.pi * j / LINE_SG
            vs.append(tuple(P[k] + (a * math.cos(ang) * .55 + b * math.sin(ang)) * r))   # flat-ish: wider up/down than deep
    return vs


def line_faces(base):
    return [(base + k * LINE_SG + j, base + k * LINE_SG + (j + 1) % LINE_SG,
             base + (k + 1) * LINE_SG + (j + 1) % LINE_SG, base + (k + 1) * LINE_SG + j)
            for k in range(LINE_N - 1) for j in range(LINE_SG)]


def rebuild_lid(eye, side):
    """The lid object kept (its rig, place and material), its mesh replaced: a
    skin shell that ends at its edge, and a lash line riding that edge. Blink
    stages B1..B8 (tripo_eyes.set_blink) and Happy rebuilt to match."""
    lid = bpy.data.objects['Lid.' + side]
    N = eye.data.materials[0].node_tree.nodes
    rx, rz = N['RX'].outputs[0].default_value, N['RZ'].outputs[0].default_value
    ry = max(abs(v.co.y) for v in eye.data.vertices)
    rows, segs = 48, 128
    # the arch holds until the lid is nearly shut (straight between, half closed was flat again)
    stages = [(E.OPEN + (E.SHUT - E.OPEN) * k / E.STAGES, ARCH_OPEN + (ARCH_SHUT - ARCH_OPEN) * (k / E.STAGES) ** 2.5) for k in range(E.STAGES + 1)]
    def stage(edge, arch, line_at=None, ryk=1.):
        v = wrap(lid_stage_verts(rx, ry, rz, edge, arch, side, grow=0), eye, rx, ry * ryk, rz, rows=rows, extra=.0008)
        shell = v[:(rows + 1) * segs]          # the skin only: the rolled rim poked through his skin at the corners
        path = shell[rows * segs:]
        if line_at:                            # a crease drawn on the shut lid instead of on its edge
            w = wrap(lid_stage_verts(rx, ry, rz, *line_at, side, grow=0), eye, rx, ry * ryk, rz, rows=rows, extra=.0008)
            path = w[rows * segs:(rows + 1) * segs]
        return shell + line_verts(path, eye, side)
    q = lambda r: [(r * segs + j, r * segs + (j + 1) % segs, (r + 1) * segs + (j + 1) % segs, (r + 1) * segs + j) for j in range(segs)]
    skin = [f for r in range(rows) for f in q(r)]
    line = line_faces((rows + 1) * segs)
    me = bpy.data.meshes.new('Lid.' + side)
    me.from_pydata(stage(*stages[0]), [], skin + line)
    me.shade_smooth()
    me.materials.append(bpy.data.materials['Lid'])
    lm = bpy.data.materials.get('Lash') or bpy.data.materials.new('Lash')
    lm.use_nodes = True
    lb = lm.node_tree.nodes['Principled BSDF']
    lb.inputs['Base Color'].default_value = build.srgb(30, 16, 10); lb.inputs['Roughness'].default_value = .65
    lb.inputs['Specular IOR Level'].default_value = .15
    me.materials.append(lm)
    me.polygons.foreach_set('material_index', [0] * len(skin) + [1] * len(line))
    old = lid.data
    lid.data = me
    bpy.data.meshes.remove(old)
    lid.vertex_groups.clear()
    lid.vertex_groups.new(name='head').add(list(range(len(me.vertices))), 1.0, 'REPLACE')
    lid.shape_key_add(name='Basis', from_mix=False)
    for k in range(1, E.STAGES + 1):
        kb = lid.shape_key_add(name=f'B{k}', from_mix=False)
        kb.data.foreach_set('co', np.array(stage(*stages[k])).ravel())
        kb.value = 0
    # happy shut eyes: the lid closed in an upward curve, as animators draw a laugh (with the
    # cheeks pushed up); a blink closes in a soft sag instead
    kb = lid.shape_key_add(name='Happy', from_mix=False)
    # the lid fully shut, the line an upward arc across it (a closed lid with a
    # curved line, as a happy shut eye is drawn: no lower lid needed)
    # the eyeballs ease back when he laughs (set_face scales them by HAPPY_EYE_DEPTH), so the
    # shut lid lies nearly flush instead of bulging; the line across the middle of the eye
    kb.data.foreach_set('co', np.array(stage(E.SHUT, 0, line_at=(-40, 28), ryk=HAPPY_EYE_DEPTH)).ravel())
    kb.value = 0
    ln = bpy.data.objects.get('Liner.' + side)
    if ln:                      # the lid's own edge carries the line now
        bpy.data.objects.remove(ln)


def glue_liner(eye, side, rx, rz):
    """The eyeliner rebuilt on his skin: the same arc and taper as tripo_eyes.py,
    each point pressed onto his face along the eye's forward line. It was a flat
    arc while his face curves back toward the outer corner, so from the side it
    floated off the eye."""
    from mathutils import Vector
    ln = bpy.data.objects['Liner.' + side]
    head = bpy.data.objects['Mesh_0']
    M = eye.matrix_world
    fwd = (M.to_3x3() @ Vector((0, -1, 0))).normalized()          # out of the eye
    Hi = head.matrix_world.inverted()
    NP, sg = 96, 10
    pts, rads = [], []
    for k in range(NP + 1):
        t = math.radians(-14 + 208 * k / NP)
        w = M @ Vector((rx * 1.07 * math.cos(t), 0, rz * 1.07 * math.sin(t)))     # clear of the ball, which hid its inner half
        o = Hi @ (w + fwd * .05); d = (Hi.to_3x3() @ -fwd).normalized()
        hit, loc, nrm, _ = head.ray_cast(o, d)
        p = head.matrix_world @ loc + fwd * .0009 if hit else w + fwd * .006
        pts.append(M.inverted() @ p)
        u = k / NP
        rads.append(.0058 * math.sin(math.pi * u) ** .6 + .0004)      # bolder: on the skin it reads thinner than floating in front
    vs = []
    for k, p in enumerate(pts):
        tan = (pts[min(k + 1, NP)] - pts[max(k - 1, 0)]).normalized()
        nrm = Vector((p.x / rx, 0, p.z / rz)).normalized()
        bi = tan.cross(nrm)
        for j in range(sg):
            a = 2 * math.pi * j / sg
            vs.append(tuple(p + (nrm * math.cos(a) + bi * math.sin(a)) * rads[k]))
    fs = [(k * sg + j, k * sg + (j + 1) % sg, (k + 1) * sg + (j + 1) % sg, (k + 1) * sg + j) for k in range(NP) for j in range(sg)]
    me = bpy.data.meshes.new('Liner.' + side); me.from_pydata(vs, [], fs); me.shade_smooth()
    me.materials.append(ln.data.materials[0])
    old = ln.data; ln.data = me; bpy.data.meshes.remove(old)
    ln.vertex_groups.clear()
    ln.vertex_groups.new(name='head').add(list(range(len(me.vertices))), 1.0, 'REPLACE')


if __name__ == '__main__':
    import shutil
    src = os.path.join(HERE, 'in', 'tripo-face.blend')
    # in place: each part here rebuilds itself, so a rerun is safe (starting from a saved
    # copy instead undid the mouth shapes made since that copy)
    bpy.ops.wm.open_mainfile(filepath=src)
    paint_out_liner([bpy.data.objects['Eye.L'], bpy.data.objects['Eye.R']])
    # the lid in his skin's own colour right above the eye (a shade darker read as a disc
    # round each eye); the new lid has no 'edge' attribute, so the ramp's first stop is it
    if 'Lid.L' in bpy.data.objects:        # the old shell lids (gone since tripo_lids.py, 2026-10-23)
        c = lid_skin_colour_above(bpy.data.objects['Eye.L'])
        r = bpy.data.materials['Lid'].node_tree.nodes['Color Ramp'].color_ramp
        r.elements[0].color = r.elements[1].color = build.srgb(*c)
    for s in ('L', 'R'):
        eye = bpy.data.objects['Eye.' + s]
        iris_detail(eye.data.materials[0])
        add_cornea(eye)
        if 'Glint.' + s in bpy.data.objects:
            bpy.data.objects['Glint.' + s].hide_render = True      # the dome's real shine replaces the painted one
        if 'Lid.' + s in bpy.data.objects:
            rebuild_lid(eye, s)
        # no lower lids (Jose, 2026-10-22: "I don't want him to have lower eye lids")
        caruncle(eye.data.materials[0], s)
    bpy.ops.wm.save_as_mainfile(filepath=src)
    print('done')
