"""Rough preview frames for the plan (not the film): one per scene, from
the real assets, at 640 x 360 and low samples.
    python storyboard.py            -> build/board/p1.png ... p8.png
"""
import math
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

import assets as A  # noqa: E402

OUT = os.path.join(A.BUILD, 'board')
FONT = '/usr/share/fonts/opentype/inter/Inter-SemiBold.otf'
FONT_B = '/usr/share/fonts/opentype/inter/Inter-Bold.otf'
SMILEY = os.path.join(A.HERE, '..', 'build', 'smiley', 'look_smile_glad.png')
WAVE = os.path.join(A.HERE, '..', 'build', 'smiley', 'look_laugh_laugh.png')
# CoreCHI buildings: tower(key, x, z, w, d, floors) in entrance.html.
TOWERS = {'e': (0, -12.4, 7, 'Ethics'), 't': (0.6, -20.5, 14, 'Terminology'),
          's': (-10.2, 1.0, 8, 'U.S. Health Systems'), 'c': (10.6, -5.2, 11, 'Cultural Responsiveness'),
          'n': (15.5, -16.6, 9, 'The Encounter')}


def fresh(bg='#070B22', strength=1.0, view='AgX', samples=12):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    # BOARD_SCALE=2 for sharper frames (1280 x 720)
    k = int(os.environ.get('BOARD_SCALE', '1'))
    sc.render.resolution_x, sc.render.resolution_y = 640 * k, 360 * k
    sc.view_settings.view_transform = view
    w = bpy.data.worlds.new('w')
    sc.world = w
    b = w.node_tree.nodes['Background']
    b.inputs['Color'].default_value = A.srgb(bg)
    b.inputs['Strength'].default_value = strength
    return sc


def camera(sc, loc, tgt, lens, fstop=None, focus=None):
    cd = bpy.data.cameras.new('c')
    cd.lens = lens
    cam = A.link(bpy.data.objects.new('c', cd))
    sc.camera = cam
    cam.location = loc
    cam.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    if fstop:
        cd.dof.use_dof = True
        cd.dof.aperture_fstop = fstop
        cd.dof.focus_distance = focus or (Vector(tgt) - Vector(loc)).length
    return cam


def light(name, loc, tgt, power, size, col='#FFFFFF'):
    l = bpy.data.lights.new(name, 'AREA')
    l.energy, l.size, l.color = power, size, A.srgb(col)[:3]
    o = A.link(bpy.data.objects.new(name, l))
    o.location = loc
    o.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    o.visible_glossy = False
    return o


def text(body, loc, size, col='#FFFFFF', bold=False, align='CENTER', face_cam=None, glow=1.0):
    cu = bpy.data.curves.new('t', 'FONT')
    cu.body = body
    cu.font = bpy.data.fonts.load(FONT_B if bold else FONT, check_existing=True)
    cu.size = size
    cu.align_x = align
    cu.align_y = 'CENTER'
    cu.extrude = size * 0.03
    ob = A.link(bpy.data.objects.new('t', cu))
    ob.location = loc
    ob.rotation_euler = (math.radians(90), 0, 0)
    if face_cam:
        d = Vector(face_cam) - Vector(loc)
        ob.rotation_euler = (math.radians(90), 0, math.atan2(d.x, -d.y))
    ob.data.materials.append(A.emission('text', col, glow))
    return ob


def card(en, es, loc, size, face_cam):
    """A bilingual label like the 3D Body's card: English, Spanish under it."""
    text(en, Vector(loc) + Vector((0, 0, size * 0.55)), size, '#FFFFFF', True, face_cam=face_cam, glow=1.2)
    text(es, Vector(loc) - Vector((0, 0, size * 0.55)), size * 0.82, '#5FD3F3', False, face_cam=face_cam, glow=1.2)


def picture(path, loc, h, face_cam=None):
    img = bpy.data.images.load(path, check_existing=True)
    w = h * img.size[0] / img.size[1]
    bpy.ops.mesh.primitive_plane_add(size=1)
    ob = bpy.context.active_object
    ob.scale = (w, h, 1)
    ob.location = loc
    ob.rotation_euler = (math.radians(90), 0, 0)
    m = bpy.data.materials.new('pic')
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    t = nt.nodes.new('ShaderNodeTexImage')
    t.image = img
    em = nt.nodes.new('ShaderNodeEmission')
    tr = nt.nodes.new('ShaderNodeBsdfTransparent')
    mx = nt.nodes.new('ShaderNodeMixShader')
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(t.outputs['Color'], em.inputs['Color'])
    nt.links.new(t.outputs['Alpha'], mx.inputs['Fac'])
    nt.links.new(tr.outputs[0], mx.inputs[1])
    nt.links.new(em.outputs[0], mx.inputs[2])
    nt.links.new(mx.outputs[0], out.inputs['Surface'])
    ob.data.materials.append(m)
    return ob


def shot(sc, name):
    t = time.time()
    sc.render.filepath = os.path.join(OUT, name + '.png')
    bpy.ops.render.render(write_still=True)
    print(name, 'rendered in %.1f s' % (time.time() - t), flush=True)


def body_lights():
    light('key', (-1.8, -2.6, 2.6), (0, 0, 0.9), 300, 2.2)
    light('rim', (1.6, 1.8, 2.2), (0, 0, 1.0), 320, 1.2, '#01B8E6')
    light('rim2', (-1.8, 1.6, 1.4), (0, 0, 1.0), 180, 1.2, '#7C5CFF')
    light('fill', (2.2, -2.2, 0.5), (0, 0, 0.8), 60, 2.0, '#FFD9B0')


LINEUP = [['skeletal'], ['muscular'], ['arterial', 'venous', 'cardiac'], ['nervous', 'sensory'],
          ['respiratory', 'digestive', 'urinary', 'reproductive', 'endocrine', 'lymphatic', 'connective']]
LINEUP_NAMES = ['Skeleton', 'Muscles', 'Heart and vessels', 'Brain and nerves', 'Organs']


def main(which):
    os.makedirs(OUT, exist_ok=True)

    if 'p1' in which:   # Open: Dr. Smiley and the name
        sc = fresh()
        picture(SMILEY, (0, 0, 0.3), 0.62)
        text('Interpreter Hub', (0, 0, -0.2), 0.17, bold=True)
        text('See medicine in 3D', (0, 0, -0.4), 0.075, '#5FD3F3')
        camera(sc, (0, -3.2, 0.02), (0, 0, 0.02), 50)
        shot(sc, 'p1')

    if 'p2' in which or 'p3' in which or 'p3b' in which or 'p4' in which:
        sc = fresh()
        parts = A.body()
        body_lights()
        if 'p2' in which:   # The body, whole
            t1 = text('3D Body', (-0.75, 0, 1.35), 0.16, bold=True, align='LEFT')
            t2 = text('2,234 real anatomical pieces', (-0.75, 0, 1.18), 0.055, '#5FD3F3', align='LEFT')
            camera(sc, (0.9, -3.4, 0.55), (-0.15, 0, 0.95), 40)
            shot(sc, 'p2')
            t1.hide_render = t2.hide_render = True
        if 'p3' in which:   # Broken down into its systems
            for ob in parts.values():
                k = next(j for j, g in enumerate(LINEUP) if ob['system'] in g)
                ob.location.x = ob['centre'][0] + (k - 2) * 0.62
            names = [text(n, ((k - 2) * 0.62, -0.1, -0.1), 0.075, '#C9D6F2', True) for k, n in enumerate(LINEUP_NAMES)]
            camera(sc, (0.0, -4.2, 0.9), (0, 0, 0.82), 32)
            shot(sc, 'p3')
            for t in names:
                t.hide_render = True
        if 'p3b' in which:   # Every piece: the Explode slider at 100%
            for ob in parts.values():
                k = next(j for j, g in enumerate(LINEUP) if ob['system'] in g)
                c = Vector(ob['centre'])
                # Each piece moves out from the middle of its system's column.
                ob.location = Vector(((k - 2) * 0.86 + c.x * 1.75, c.y * 3.0, 0.9 + (c.z - 0.9) * 1.14))
            camera(sc, (0.0, -5.3, 1.0), (0, 0, 0.9), 30)
            shot(sc, 'p3b')
        if 'p4' in which:   # Organs lifted out whole, in a row, each with its bilingual card
            cat = A.catalogue()
            # Whole organs only: in BodyParts3D the lung is its airway tree and
            # the liver mostly its bile ducts, so neither reads as the organ.
            own = {'FMA7088': 'cardiac', 'FMA7148': 'digestive', 'FMA7196': 'digestive',
                   'FMA7198': 'digestive', 'FMA7203': 'urinary'}
            slots = {'FMA7088': -0.39, 'FMA7148': -0.13, 'FMA7198': 0.13, 'FMA7196': 0.13, 'FMA7203': 0.39}
            groups = {}
            for fma in own:
                ids = [p for p in cat[fma]['pieces'] if p in parts and parts[p]['system'] == own[fma]]
                if ids:
                    groups[fma] = ids
            shown = set()
            cam_at = (0.0, -1.45, 1.3)
            for fma, ids in groups.items():
                c = sum((Vector(parts[p]['centre']) for p in ids), Vector()) / len(ids)
                move = Vector((slots[fma], -0.1, 1.2)) - c      # the organ's centre to its slot
                for p in ids:
                    parts[p].location = Vector(parts[p]['centre']) + move
                    shown.add(p)
                bpy.context.view_layer.update()
                top = max(parts[p].location.z + parts[p].dimensions.z / 2 for p in ids)
                s_ = cat[fma]
                card(s_['en'], s_['es'], Vector((slots[fma], -0.14, max(top, 1.27) + 0.06)), 0.034, cam_at)
            for pid, ob in parts.items():
                if pid not in shown:
                    ob.hide_render = True
            camera(sc, cam_at, (0.0, 0, 1.25), 38)
            shot(sc, 'p4')

    if 'p5' in which:   # Into the brain: the real one becomes the HUMC Brain
        sc = fresh(view='Standard')
        parts = A.body(systems={'nervous'})
        cat = A.catalogue()
        brain_pcs = [parts[p] for p in cat['FMA50801']['pieces'] if p in parts]
        for ob in parts.values():
            if ob not in brain_pcs:
                ob.hide_render = True
        light('key', (-0.6, -0.8, 2.2), (0, 0, 1.6), 30, 0.6)
        light('rim', (0.5, 0.6, 1.9), (0, 0, 1.6), 40, 0.4, '#01B8E6')
        c = sum((Vector(p.location) for p in brain_pcs), Vector()) / len(brain_pcs)
        coll, B = A.brain(scale=0.075)
        for o in coll.objects:
            o.location = c + Vector((0, 0.005, 0.0))
        ghost = A.emission('ghost', '#8FB6FF', 0.25)
        nt = ghost.node_tree
        em = nt.nodes['Emission']; out = nt.nodes['Material Output']
        lw = nt.nodes.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = 0.25
        tr = nt.nodes.new('ShaderNodeBsdfTransparent'); mx = nt.nodes.new('ShaderNodeMixShader')
        nt.links.new(lw.outputs['Facing'], mx.inputs['Fac']); nt.links.new(tr.outputs[0], mx.inputs[1])
        nt.links.new(em.outputs[0], mx.inputs[2]); nt.links.new(mx.outputs[0], out.inputs['Surface'])
        for ob in brain_pcs:
            ob.data.materials[0] = ghost
        card('Brain', 'Encéfalo', c + Vector((0.105, -0.08, 0.035)), 0.012, c + Vector((0.12, -0.42, 0.04)))
        camera(sc, c + Vector((0.12, -0.42, 0.04)), c, 50)
        shot(sc, 'p5')

    if 'p6' in which:   # The HUMC Brain
        sc = fresh(bg='#03061A', view='Standard')
        coll, B = A.brain()
        d = B['data']
        cam_at = (3.0, -3.9, 1.0)
        for g, label in (('ask', 'Ask the Hub'), ('smiley', 'Dr. Smiley'), ('core', 'Shared core')):
            pts = [d['pos'][n['i']] for n in d['nodes'] if n['group'] == g]
            m = Vector([sum(p[i] for p in pts) / len(pts) for i in range(3)])
            text(label, Vector((m.x, -m.z, m.y + 0.2)), 0.14, d['groups'][g]['color'], True, face_cam=cam_at, glow=1.6)
        text('HUMC Brain', (-2.0, 0.3, 1.45), 0.3, bold=True, align='LEFT', face_cam=cam_at)
        text('the app, mapped like a brain', (-2.0, 0.3, 1.12), 0.12, '#5FD3F3', align='LEFT', face_cam=cam_at)
        camera(sc, cam_at, (-0.1, 0, 0.1), 30)
        shot(sc, 'p6')

    if 'p7' in which:   # CoreCHI City at golden hour
        sc = fresh(bg='#F6B98E', strength=0.32)
        sky = sc.world.node_tree.nodes.new('ShaderNodeTexSky')
        sky.sun_elevation = math.radians(8)
        sky.sun_rotation = math.radians(250)
        sc.world.node_tree.links.new(sky.outputs[0], sc.world.node_tree.nodes['Background'].inputs['Color'])
        coll, objs = A.campus()
        sun = bpy.data.lights.new('sun', 'SUN')
        sun.energy, sun.color, sun.angle = 5.0, A.srgb('#FF9A4A')[:3], math.radians(3)
        so = A.link(bpy.data.objects.new('sun', sun))
        so.rotation_euler = Vector((0.8, 0.22, -0.33)).to_track_quat('-Z', 'Y').to_euler()
        fill = bpy.data.lights.new('fill', 'SUN')
        fill.energy, fill.color = 0.9, A.srgb('#9C8CE0')[:3]
        fo = A.link(bpy.data.objects.new('fill', fill))
        fo.rotation_euler = Vector((-0.2, -0.9, -0.4)).to_track_quat('-Z', 'Y').to_euler()
        cam_at = (4, -34, 21)
        for k, (x, z, floors, name) in TOWERS.items():
            text(name, (x, -z, floors * 1.05 + 3.2), 1.5, '#FFFFFF', True, face_cam=cam_at, glow=1.4)
        picture(SMILEY, (-3.4, 12.4, 7 * 1.05 + 2.6), 3.6)
        camera(sc, cam_at, (2.5, 6, 6), 30)
        shot(sc, 'p7')

    if 'p8' in which:   # End card
        sc = fresh()
        picture(WAVE, (-0.82, 0, 0.0), 0.8)
        text('Interpreter Hub', (-0.3, 0, 0.14), 0.18, bold=True, align='LEFT')
        text('Built for HUMC medical interpreters', (-0.3, 0, -0.07), 0.062, '#5FD3F3', align='LEFT')
        text('Anatomy: BodyParts3D © DBCLS, CC BY 4.0', (0, 0, -0.62), 0.032, '#7F8AB0')
        camera(sc, (0, -3.2, 0.0), (0, 0, 0.0), 50)
        shot(sc, 'p8')


if __name__ == '__main__':
    main(sys.argv[1:] or ['p1', 'p2', 'p3', 'p3b', 'p4', 'p5', 'p6', 'p7', 'p8'])
