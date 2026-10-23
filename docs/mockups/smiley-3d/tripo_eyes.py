"""His 3D eyes on the kept Tripo model (plan-rig.png step 2): an eyeball over
each painted eye, iris and pupil that slide on it to look around (the eye's
outline never changes), a skin lid with a dark lash edge that closes to blink,
and a painted-style catchlight that stays put. Matte.

  python3 tripo_eyes.py      -> in/tripo-eyes.blend
Controls (per eye object 'Eye.L'/'Eye.R'): set_gaze(gx, gz) in -1..1,
set_blink(0 open .. 1 shut).
"""
import os, sys, math
import numpy as np
import bpy, bmesh
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tripo_lib as T
import build

HERE = T.HERE
# EYE_STYLE: 'v1' (first try: big white balls, Jose: "the eyes look weird"),
# 'matched' (3D eyes made to match his painted ones: same size, eyeliner, dark
# brown iris, big pupil, soft whites), 'painted' (his painted eyes kept, only a
# blink lid added; no looking around)
EYE_STYLE = os.environ.get('EYE_STYLE', 'matched')
S = {'v1':      dict(cover=1.16, depth=.014, sink=.0055, open=50, ball=True, liner=False),
     'matched': dict(cover=1.0, depth=.012, sink=.0062, open=72, ball=True, liner=True),   # depth 8 was tried (2026-10-23) for the skin lids: a flatter ball read as thick plates; 12 kept
     'painted': dict(cover=1.0, depth=.0075, sink=.0045, open=88, ball=False, liner=False)}[EYE_STYLE]
COVER, DEPTH, SINK, OPEN = S['cover'], S['depth'], S['sink'], S['open']
# the balls sunk deeper for the skin lids (tripo_lids.py, 2026-10-23): at 6.2 mm the ball stood 6 mm proud
# of the painted skin and the lids had to climb 10 mm back to the face round it, a trench that read
# as goggles; EYE_SINK overrides (the size and the opening are unchanged)
SINK = float(os.environ.get('EYE_SINK', .0090 if EYE_STYLE == 'matched' else SINK))   # 9 (2026-10-23, the skin lids): at 6.2 the lids stood proud (goggles), at 12 the shut eye sat deep behind the cheek
SHUT = -62 if EYE_STYLE == 'v1' else -68   # lid edge elevation when closed (matched: the ball's whole opening shows, so all the way down)


def mesh_from(name, verts, faces, mat):
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces); me.validate(); me.shade_smooth()
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    ob.data.materials.append(mat)
    return ob


def ellipsoid_verts(rx, ry, rz, segs=48, rings=32, el0=-90, el1=90):
    vs = []
    for r in range(rings + 1):
        el = math.radians(el0 + (el1 - el0) * r / rings)
        for s in range(segs):
            az = 2 * math.pi * s / segs
            vs.append((rx * math.cos(el) * math.sin(az), -ry * math.cos(el) * math.cos(az), rz * math.sin(el)))
    return vs


def grid(rings, segs):
    return [(r * segs + s, r * segs + (s + 1) % segs, (r + 1) * segs + (s + 1) % segs, (r + 1) * segs + s)
            for r in range(rings) for s in range(segs)]


def eye_material(name, iris_dark, iris_light, pupil_r, iris_r):
    """White ball; iris and pupil drawn by distance from a gaze point on the
    ball's front (object coordinates divided by its radii)."""
    m = bpy.data.materials.new(name); m.use_nodes = True
    N, L = m.node_tree.nodes, m.node_tree.links
    b = N['Principled BSDF']
    b.inputs['Roughness'].default_value = .55
    b.inputs['Specular IOR Level'].default_value = .15
    # the ball's own undeformed coordinates, so the iris stays put when a skeleton moves the ball
    rest = N.new('ShaderNodeAttribute'); rest.attribute_type = 'GEOMETRY'; rest.attribute_name = 'rest_position'
    sep = N.new('ShaderNodeSeparateXYZ'); L.new(rest.outputs['Vector'], sep.inputs['Vector'])
    gx = N.new('ShaderNodeValue'); gx.name = 'GazeX'
    gz = N.new('ShaderNodeValue'); gz.name = 'GazeZ'
    rx = N.new('ShaderNodeValue'); rx.name = 'RX'
    rz = N.new('ShaderNodeValue'); rz.name = 'RZ'
    def math_node(op, a, bb):
        n = N.new('ShaderNodeMath'); n.operation = op
        for i, v in enumerate((a, bb)):
            if isinstance(v, (int, float)):
                n.inputs[i].default_value = v
            else:
                L.new(v, n.inputs[i])
        return n.outputs[0]
    u = math_node('SUBTRACT', math_node('DIVIDE', sep.outputs['X'], rx.outputs[0]), gx.outputs[0])
    v = math_node('SUBTRACT', math_node('DIVIDE', sep.outputs['Z'], rz.outputs[0]), gz.outputs[0])
    d = math_node('SQRT', math_node('ADD', math_node('MULTIPLY', u, u), math_node('MULTIPLY', v, v)), 0)
    front = math_node('LESS_THAN', sep.outputs['Y'], 0)          # only on the front of the ball
    ramp = N.new('ShaderNodeValToRGB'); cr = ramp.color_ramp
    cr.interpolation = 'EASE'
    cr.elements[0].position, cr.elements[0].color = 0, (.004, .003, .003, 1)          # pupil
    white = (.92, .93, .95, 1) if EYE_STYLE == 'v1' else (.78, .77, .76, 1)   # matched: soft, like the painted whites
    cr.elements[1].position, cr.elements[1].color = 1, white
    for pos, col in ((pupil_r - .01, (.004, .003, .003, 1)), (pupil_r + .02, iris_light), (iris_r - .09, iris_dark),
                     (iris_r - .015, (.05, .02, .01, 1)), (iris_r + .02, white)):
        e = cr.elements.new(max(0, min(1, pos))); e.color = col
    dd = math_node('ADD', d, math_node('MULTIPLY', math_node('SUBTRACT', 1, front), 5))
    L.new(dd, ramp.inputs['Fac'])
    # a soft dark rim where the ball turns away, like the outline round his drawn eyes
    lw = N.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = .5
    rim = N.new('ShaderNodeValToRGB'); rc = rim.color_ramp
    rc.elements[0].position, rc.elements[0].color = .55, (1, 1, 1, 1)
    rc.elements[1].position, rc.elements[1].color = .82, (.06, .03, .02, 1)
    L.new(lw.outputs['Facing'], rim.inputs['Fac'])
    mul = N.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'
    mul.inputs['Factor'].default_value = 1
    L.new(ramp.outputs['Color'], mul.inputs['A']); L.new(rim.outputs['Color'], mul.inputs['B'])
    L.new(mul.outputs['Result'], b.inputs['Base Color'])
    return m


def set_gaze(eye, gx, gz):
    m = eye.data.materials[0].node_tree.nodes
    m['GazeX'].outputs[0].default_value = gx * .32
    m['GazeZ'].outputs[0].default_value = gz * .24


STAGES = 8          # the lid's edge travels round the ball in steps, never through it


def set_blink(lid, amount):
    a = max(0, min(1, amount)) * STAGES
    kb = lid.data.shape_keys.key_blocks
    for i in range(1, STAGES + 1):
        kb[f'B{i}'].value = max(0, 1 - abs(a - i)) if a <= STAGES else 0
    # below stage 1 the open shape (Basis) mixes with B1 by the same rule
    glint = bpy.data.objects.get('Glint.' + lid.name.split('.')[-1])
    if glint:                      # the shine sits on the eye, so it goes when the lid covers it
        glint.hide_render = amount > .2 or EYE_STYLE == 'painted'
    liner = bpy.data.objects.get('Liner.' + lid.name.split('.')[-1])
    if liner:                      # once the lid comes down, its own dark edge is the lash line
        liner.hide_render = amount > .22


def build_eyes(ob, eyes):
    srgb = build.srgb
    skin_m = bpy.data.materials.new('Lid'); skin_m.use_nodes = True
    sb = skin_m.node_tree.nodes['Principled BSDF']
    sb.inputs['Roughness'].default_value = .62; sb.inputs['Specular IOR Level'].default_value = .1
    at = skin_m.node_tree.nodes.new('ShaderNodeAttribute'); at.attribute_name = 'edge'
    lr = skin_m.node_tree.nodes.new('ShaderNodeValToRGB')
    # skin, then a thin dark lash line along the very edge, there at every stage of a blink
    lr.color_ramp.elements[0].position, lr.color_ramp.elements[0].color = (.935 if EYE_STYLE == 'v1' else .90), srgb(250, 205, 180)
    lr.color_ramp.elements[1].position, lr.color_ramp.elements[1].color = (.965 if EYE_STYLE == 'v1' else .93), srgb(36, 18, 10)
    skin_m.node_tree.links.new(at.outputs['Fac'], lr.inputs['Fac'])
    skin_m.node_tree.links.new(lr.outputs['Color'], sb.inputs['Base Color'])
    hl_m = bpy.data.materials.new('Catchlight'); hl_m.use_nodes = True
    hb = hl_m.node_tree.nodes['Principled BSDF']
    hb.inputs['Base Color'].default_value = (1, 1, 1, 1); hb.inputs['Emission Color'].default_value = (1, 1, 1, 1)
    hb.inputs['Emission Strength'].default_value = 1.2
    liner_m = bpy.data.materials.new('Liner'); liner_m.use_nodes = True
    lb = liner_m.node_tree.nodes['Principled BSDF']
    lb.inputs['Base Color'].default_value = srgb(36, 18, 10); lb.inputs['Roughness'].default_value = .7
    lb.inputs['Specular IOR Level'].default_value = .1
    made = []
    for side, e in zip(('L', 'R'), eyes):
        n = Vector(e['normal']).normalized()
        c = Vector(e['c'])
        rot = (-n).to_track_quat('-Y', 'Z').to_matrix().to_4x4() if False else n.to_track_quat('-Y', 'Z').to_matrix().to_4x4()
        rx, rz = e['hw'] * COVER, e['hh'] * COVER
        centre = c - n * SINK
        # the ball
        if EYE_STYLE == 'v1':
            iris_r = e['ir'] / max(e['hw'], e['hh']) * .95
            mat = eye_material(f'Eye.{side}', srgb(92, 46, 20), srgb(170, 102, 50), iris_r * .42, iris_r)
        else:                   # his painted iris: about .7 of the eye's half-width, dark brown, a big pupil
            iris_r = e['ir'] / rx * 1.02
            mat = eye_material(f'Eye.{side}', srgb(62, 32, 14), srgb(126, 76, 40), iris_r * .5, iris_r)
        ball = mesh_from(f'Eye.{side}', ellipsoid_verts(rx, DEPTH, rz), grid(32, 48), mat)
        if not S['ball']:
            ball.hide_render = True
        ball.matrix_world = Matrix.Translation(centre) @ rot
        ball.add_rest_position_attribute = True
        nodes = mat.node_tree.nodes
        nodes['RX'].outputs[0].default_value = rx
        nodes['RZ'].outputs[0].default_value = rz
        # where the painted iris looks now becomes the rest gaze
        gx0 = (e['iris'][0] - c.x) / rx / .32
        gz0 = (e['iris'][1] - c.z) / rz / .24
        ball['rest_gaze'] = (gx0, gz0)
        set_gaze(ball, gx0, gz0)
        # the upper lid: a shell just outside the ball, from the top down to OPEN;
        # its shape key 'Shut' brings the edge down to SHUT
        lr_, rows, segs = (1.07 if EYE_STYLE == 'v1' else 1.2), 64, 128   # matched: wide enough to cover the painted eyeliner when shut
        def lid_verts(edge):
            vs = []
            for r in range(rows + 1):
                el = math.radians(90 - (90 - edge) * r / rows)
                for s in range(segs):
                    az = 2 * math.pi * s / segs
                    # the lid only wraps the front half of the ball
                    if math.cos(az) < -.05:
                        k = .2
                    vs.append((rx * lr_ * math.cos(el) * math.sin(az), -(DEPTH * 1.25) * math.cos(el) * math.cos(az), rz * lr_ * math.sin(el)))
            return vs
        lid = mesh_from(f'Lid.{side}', lid_verts(OPEN), grid(rows, segs), skin_m)
        edge = lid.data.attributes.new('edge', 'FLOAT', 'POINT')
        edge.data.foreach_set('value', [r / rows for r in range(rows + 1) for s in range(segs)])
        lid.shape_key_add(name='Basis')
        for k in range(1, STAGES + 1):
            sk = lid.shape_key_add(name=f'B{k}', from_mix=False)
            for i, v in enumerate(lid_verts(OPEN + (SHUT - OPEN) * k / STAGES)):
                sk.data[i].co = v
        lid.matrix_world = Matrix.Translation(centre) @ rot
        set_blink(lid, 0)              # a new shape key comes in at full strength: start open
        # catchlight: a small soft white oval up and to the light's side, fixed to the head
        hl_verts = ellipsoid_verts(rx * .16, .0015, rz * .2, 16, 8)
        hl = mesh_from(f'Glint.{side}', hl_verts, grid(8, 16), hl_m)
        if EYE_STYLE == 'v1':
            gpos = Vector((-rx * .3, -DEPTH * 1.02, rz * .38))
        else:   # on the iris at rest, upper right (viewer's), like his painted shine
            ix, iz = gx0 * .32 * rx + iris_r * rx * .42, gz0 * .24 * rz + iris_r * rz * .45
            iy = -DEPTH * math.sqrt(max(0, 1 - (ix / rx) ** 2 - (iz / rz) ** 2)) - .0006
            gpos = Vector((ix, iy, iz))
        hl.matrix_world = Matrix.Translation(centre + (rot.to_3x3() @ gpos)) @ rot
        if not S['ball']:
            hl.hide_render = True
        made += [ball, lid, hl]
        if S['liner']:
            # eyeliner like his painted eyes: a dark line round the opening, thick on top
            pts, rads = [], []
            # over the top only, from just below the outer corner to the inner one, tapering at both ends
            NP = 96
            for k in range(NP + 1):
                t = math.radians(-14 + 208 * k / NP)
                pts.append(Vector((rx * 1.03 * math.cos(t), -SINK - .0012, rz * 1.03 * math.sin(t))))
                u = k / NP
                rads.append(.0042 * math.sin(math.pi * u) ** .6 + .0003)
            vs, fs = [], []
            sg = 10
            for k, p in enumerate(pts):
                tan = (pts[min(k + 1, NP)] - pts[max(k - 1, 0)]).normalized()
                nrm = Vector((p.x / rx, 0, p.z / rz)).normalized()
                bi = tan.cross(nrm)
                for j in range(sg):
                    a = 2 * math.pi * j / sg
                    vs.append(p + (nrm * math.cos(a) + bi * math.sin(a)) * rads[k])
            fs = [(k * sg + j, k * sg + (j + 1) % sg, (k + 1) * sg + (j + 1) % sg, (k + 1) * sg + j) for k in range(NP) for j in range(sg)]
            ln = mesh_from(f'Liner.{side}', [tuple(v) for v in vs], fs, liner_m)
            ln.matrix_world = Matrix.Translation(centre) @ rot
            made.append(ln)
    return made


def lid_skin_colour(ob):
    """Sample his skin under the eyes, so the lids match it."""
    img, px = T.texture(ob)
    cen, tuv = T.face_arrays(ob)
    sel = (np.abs(cen[:, 2] - .795) < .006) & (np.abs(cen[:, 0] - .018) < .012) & (cen[:, 1] < -.12)   # between the brows
    c = T.sample(px, tuv[sel].mean(1)) * 255
    return np.median(c, 0)


if __name__ == '__main__':
    bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'in', 'tripo-fixed.blend'))
    ob = [o for o in bpy.data.objects if o.type == 'MESH'][0]
    eyes = T.measure_eyes(ob)
    skin = lid_skin_colour(ob)
    print('eyes', [{k: v for k, v in e.items() if k in ('c', 'hw', 'hh', 'ir')} for e in eyes], 'skin', skin)
    made = build_eyes(ob, eyes)
    lid_m = bpy.data.materials['Lid']
    # a lid sits forward of the face and catches more light: a shade darker to match
    lid_m.node_tree.nodes['Color Ramp'].color_ramp.elements[0].color = build.srgb(*[int(v * float(os.environ.get('LID_K', .84))) for v in skin])
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'in', 'tripo-eyes.blend'))
    print('done')
