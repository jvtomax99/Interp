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
    bpy.ops.wm.save_as_mainfile(filepath=src)
    print('done')
