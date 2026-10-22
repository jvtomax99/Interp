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


def lid_faces(rows=48, segs=128):
    q = lambda r: [(r * segs + j, r * segs + (j + 1) % segs, (r + 1) * segs + (j + 1) % segs, (r + 1) * segs + j) for j in range(segs)]
    shell = [f for r in range(rows) for f in q(r)]
    rim = q(rows + 1)
    # the rim's front is the dark lash line: seen from the front, the lashes point at you
    # and read as a thin line on their own
    lash = q(rows) + q(rows + 3)
    return shell + rim, lash


def rebuild_lid(eye, side):
    """The lid object kept (its rig, place and material), its mesh replaced; the
    blink stages B1..B8 rebuilt to match (tripo_eyes.set_blink drives them)."""
    lid = bpy.data.objects['Lid.' + side]
    N = eye.data.materials[0].node_tree.nodes
    rx, rz = N['RX'].outputs[0].default_value, N['RZ'].outputs[0].default_value
    ry = max(abs(v.co.y) for v in eye.data.vertices)
    # the arch holds until the lid is nearly shut (straight between, half closed was flat again)
    stages = [(E.OPEN + (E.SHUT - E.OPEN) * k / E.STAGES, ARCH_OPEN + (ARCH_SHUT - ARCH_OPEN) * (k / E.STAGES) ** 2.5) for k in range(E.STAGES + 1)]
    skin, lash = lid_faces()
    me = bpy.data.meshes.new('Lid.' + side)
    # open, the lid is tucked above the eye behind his face and the liner draws the line;
    # its lashes grow in as it comes down (open, they poked out over the eye as tabs)
    grow = lambda k: min(1., k / 2)
    me.from_pydata(lid_stage_verts(rx, ry, rz, *stages[0], side, grow=grow(0)), [], skin + lash)
    me.shade_smooth()
    me.materials.append(bpy.data.materials['Lid'])
    lm = bpy.data.materials.get('Lash') or bpy.data.materials.new('Lash')
    lm.use_nodes = True
    lb = lm.node_tree.nodes['Principled BSDF']
    lb.inputs['Base Color'].default_value = build.srgb(30, 16, 10); lb.inputs['Roughness'].default_value = .65
    lb.inputs['Specular IOR Level'].default_value = .15
    me.materials.append(lm)
    mi = [0] * len(skin) + [1] * len(lash)
    me.polygons.foreach_set('material_index', mi)
    old = lid.data
    lid.data = me
    bpy.data.meshes.remove(old)
    lid.vertex_groups.clear()
    vg = lid.vertex_groups.new(name='head'); vg.add(list(range(len(me.vertices))), 1.0, 'REPLACE')
    lid.shape_key_add(name='Basis', from_mix=False)
    for k in range(1, E.STAGES + 1):
        kb = lid.shape_key_add(name=f'B{k}', from_mix=False)
        kb.data.foreach_set('co', np.array(lid_stage_verts(rx, ry, rz, *stages[k], side, grow=grow(k))).ravel())
        kb.value = 0
    glue_liner(eye, side, rx, rz)


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
    before = os.path.join(HERE, 'in', 'tripo-face-before-eyes2.blend')
    if not os.path.exists(before):
        shutil.copy(src, before)
    bpy.ops.wm.open_mainfile(filepath=before)        # always from the eyes as they were
    for s in ('L', 'R'):
        eye = bpy.data.objects['Eye.' + s]
        iris_detail(eye.data.materials[0])
        add_cornea(eye)
        bpy.data.objects['Glint.' + s].hide_render = True      # the dome's real shine replaces the painted one
        rebuild_lid(eye, s)
    bpy.ops.wm.save_as_mainfile(filepath=src)
    print('done')
