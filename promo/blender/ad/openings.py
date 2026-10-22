"""Three candidate openings (the first 5 s) for Jose to choose from, two
preview frames each, vertical:
  A  glass letters: "¿Fallo cardíaco?" shatters letter by letter, the
     pieces come back as "Insuficiencia cardíaca"
  B  the hospital at night: "Heart failure" from a window of the real
     campus, then the real Translate screen with its real caution
  C  a heartbeat: a monitor line writes the words, flatlines red on the
     wrong one, beats back cyan on the right one
    BOARD_SCALE=2 python openings.py [a1 a2 b1 b2 c1 c2]  -> build/board/o_a1.png ...
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
from mathutils import Euler, Vector  # noqa: E402

import assets as A  # noqa: E402
from storyboard import WAVE, camera, light, text  # noqa: E402
from storyboard2 import phone, ring, sheen  # noqa: E402
from storyboard3 import floor, fresh, neon, shot  # noqa: E402

SURPRISED = os.path.join(A.HERE, '..', 'build', 'smiley', 'look_surprised_up.png')
WINK = os.path.join(A.HERE, '..', 'build', 'smiley', 'look_wink_wink.png')


def glass(name, tint, glow):
    m = bpy.data.materials.new(name)
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = A.srgb(tint)
    b.inputs['Transmission Weight'].default_value = 1.0
    b.inputs['Roughness'].default_value = 0.04
    b.inputs['IOR'].default_value = 1.45
    b.inputs['Emission Color'].default_value = A.srgb(tint)
    b.inputs['Emission Strength'].default_value = glow
    b.inputs['Coat Weight'].default_value = 1.0
    return m


def letters(body, loc, size, mat, cam):
    """3D text cut into one object per letter, so letters can fly apart."""
    t = text(body, loc, size, '#FFFFFF', True, face_cam=cam)
    t.data.extrude = size * 0.16
    t.data.bevel_depth = size * 0.025
    t.data.bevel_resolution = 2
    t.data.align_x = 'CENTER'
    bpy.ops.object.select_all(action='DESELECT')
    t.select_set(True)
    bpy.context.view_layer.objects.active = t
    bpy.ops.object.convert(target='MESH')
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.separate(type='LOOSE')
    bpy.ops.object.mode_set(mode='OBJECT')
    parts = list(bpy.context.selected_objects)
    for p in parts:
        p.data.materials.clear()
        p.data.materials.append(mat)
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY')
    return parts


def strips(col_a, col_b):
    """Long soft lights only the glass sees: they draw the letters' edges."""
    for x, col in ((-1.4, col_a), (1.4, col_b)):
        bpy.ops.mesh.primitive_plane_add(size=1, location=(x, 0.8, 0.3))
        s = bpy.context.active_object
        s.scale = (0.25, 4.0, 1)
        s.rotation_euler = (0, math.radians(90 if x < 0 else -90), 0)
        s.data.materials.append(A.emission('strip', col, 6.0))
        s.visible_camera = False


def main(which):
    rnd = random.Random(7)

    if 'a1' in which or 'a2' in which:
        cam = (0, -2.7, 0.15)
        if 'a1' in which:   # the wrong word breaking apart
            sc = fresh(bg='#04050F')
            floor(z=-0.62)
            strips('#FF4F86', '#7C5CFF')
            text('THE INTERPRETER', (0, 0, 0.78), 0.08, '#9FB0D6', False, face_cam=cam, glow=1.4)
            pink = glass('pink glass', '#FF4F86', 0.12)
            for i, ln in enumerate(('¿Fallo', 'cardíaco?')):
                for p in letters(ln, (0, 0, 0.4 - i * 0.42), 0.36, pink, cam):
                    # the crack runs left to right: the right side flies first
                    k = max(0.0, (p.location.x - 0.05) / 0.9) ** 1.5   # the crack: the left half still reads
                    p.location += Vector((rnd.uniform(0, .2) * k, -rnd.uniform(.3, 1.2) * k, rnd.uniform(-.25, .3) * k))
                    r = p.rotation_euler                                   # add to the standing pose, never replace it
                    p.rotation_euler = (r.x + rnd.uniform(-1, 1) * k * 1.4, r.y + rnd.uniform(-1, 1) * k * 1.4, r.z + rnd.uniform(-1, 1) * k)
            bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.05, -0.12, 0.2))
            bar = bpy.context.active_object
            bar.scale = (1.7, 0.012, 0.022)
            bar.rotation_euler = (0, math.radians(-7), 0)
            bar.data.materials.append(A.emission('strike', '#FF2D6B', 10))
            camera(sc, cam, (0, 0, 0.18), 32, fstop=2.2, focus=2.7)
            shot(sc, 'o_a1', smiley=SURPRISED)
        if 'a2' in which:   # the right word assembling
            sc = fresh(bg='#04050F')
            floor(z=-0.62)
            strips('#5FD3F3', '#2E8BD0')
            text('THE RIGHT WORD', (0, 0, 0.78), 0.08, '#9FB0D6', False, face_cam=cam, glow=1.4)
            cyan = glass('cyan glass', '#5FD3F3', 0.15)
            for i, ln in enumerate(('Insuficiencia', 'cardíaca')):
                for p in letters(ln, (0, 0, 0.42 - i * 0.36), 0.25, cyan, cam):
                    k = max(0.0, (p.location.x - 0.45) / 0.8) ** 1.5   # the last letters still arriving
                    p.location += Vector((rnd.uniform(0, .25) * k, -rnd.uniform(.1, .6) * k, rnd.uniform(-.1, .2) * k))
                    r = p.rotation_euler
                    p.rotation_euler = (r.x + rnd.uniform(-1, 1) * k, r.y + rnd.uniform(-1, 1) * k, r.z)
            camera(sc, cam, (0, 0, 0.2), 32, fstop=2.8, focus=2.7)
            shot(sc, 'o_a2', smiley=WAVE)

    if 'b1' in which or 'b2' in which:
        sc = fresh(bg='#0A1440', view='AgX', strength=0.6)
        sky = sc.world.node_tree.nodes.new('ShaderNodeTexSky')
        sky.sun_elevation = math.radians(-2)
        sky.sun_rotation = math.radians(250)
        mixn = sc.world.node_tree.nodes.new('ShaderNodeMix')
        mixn.data_type = 'RGBA'
        mixn.inputs['Factor'].default_value = 0.65
        sc.world.node_tree.links.new(sky.outputs[0], mixn.inputs[6])
        mixn.inputs[7].default_value = A.srgb('#0A1440')
        sc.world.node_tree.links.new(mixn.outputs[2], sc.world.node_tree.nodes['Background'].inputs['Color'])
        coll, objs = A.campus()
        moon = bpy.data.lights.new('dusk', 'SUN')
        moon.energy, moon.color = 0.6, A.srgb('#8FA8FF')[:3]
        mo = A.link(bpy.data.objects.new('dusk', moon))
        mo.rotation_euler = Vector((0.5, 0.6, -0.6)).to_track_quat('-Z', 'Y').to_euler()
        glow = bpy.data.lights.new('sunset', 'SUN')
        glow.energy, glow.color = 1.4, A.srgb('#FF7A45')[:3]
        go = A.link(bpy.data.objects.new('sunset', glow))
        go.rotation_euler = Vector((0.9, 0.1, -0.12)).to_track_quat('-Z', 'Y').to_euler()
        # One lit window on the main hospital, where it's happening.
        win = Vector((1.2, 9.9, 5.6))
        bpy.ops.mesh.primitive_plane_add(size=1, location=win, rotation=(math.radians(90), 0, 0))
        w = bpy.context.active_object
        w.scale = (1.1, 0.8, 1)
        w.data.materials.append(A.emission('window', '#FFD58A', 18))
        if 'b1' in which:
            cam = (3.6, -9.5, 3.4)
            words = [neon('Heart', win + Vector((0.1, -1.2, 3.3)), 1.3, '#FFFFFF', strength=5, extrude=0.12, cam=cam),
                     neon('failure', win + Vector((0.1, -1.2, 1.8)), 1.3, '#FFFFFF', strength=5, extrude=0.12, cam=cam),
                     text('THE DOCTOR SAYS', win + Vector((0.1, -1.2, 4.6)), 0.4, '#9FB0D6', False, face_cam=cam, glow=2)]
            camera(sc, cam, win + Vector((0, 0, 1.9)), 30, fstop=4.0, focus=(win - Vector(cam)).length)
            shot(sc, 'o_b1')
            for o in words:
                o.hide_render = True
        if 'b2' in which:   # through the window: the real Translate answer, its real caution
            cam = Vector((1.55, -0.6, 5.35))
            ph = phone('translate2', (1.35, 3.2, 5.1), rot_z=0.12, h=2.6)
            sheen()
            # The caution line sits about 40% down the screen.
            c = Vector((1.35, 3.0, 5.1 + (0.5 - 0.44) * 2.6))
            ring(c + Vector((0, -0.05, 0)), 0.55, '#FF4F86', 1.4, 0.008)
            camera(sc, tuple(cam), (1.35, 3.2, 5.12), 30, fstop=2.0, focus=(Vector((1.35, 3.2, 5.1)) - cam).length)
            shot(sc, 'o_b2', smiley=WINK)

    if 'c1' in which or 'c2' in which:
        def ecg(x0, x1, z, beats, col, flat_from=None, name='ecg'):
            cu = bpy.data.curves.new(name, 'CURVE')
            cu.dimensions = '3D'
            cu.bevel_depth = 0.008
            sp = cu.splines.new('POLY')
            pts = []
            n = 600
            for i in range(n + 1):
                x = x0 + (x1 - x0) * i / n
                u = (x - x0) / (x1 - x0) * beats
                f = u - math.floor(u)
                y = 0.0
                if flat_from is None or x < flat_from:
                    y += 0.05 * math.exp(-((f - .18) / .03) ** 2)      # P
                    y -= 0.06 * math.exp(-((f - .30) / .008) ** 2)     # Q
                    y += 0.42 * math.exp(-((f - .33) / .012) ** 2)     # R
                    y -= 0.12 * math.exp(-((f - .36) / .01) ** 2)      # S
                    y += 0.09 * math.exp(-((f - .55) / .05) ** 2)      # T
                pts.append((x, 0, z + y))
            sp.points.add(len(pts) - 1)
            for p, q in zip(sp.points, pts):
                p.co = (*q, 1)
            ob = A.link(bpy.data.objects.new(name, cu))
            cu.materials.append(A.emission(name, col, 8))
            return ob

        cam = (0, -2.9, 0.1)
        if 'c1' in which:   # the beat writes the doctor's words
            sc = fresh(bg='#03050E')
            floor(z=-0.6)
            ecg(-1.6, 1.6, -0.05, 4, '#5FD3F3')
            ring((0.42, 0, 0.37), 0.05, '#FFFFFF', 6, 0.012)
            text('THE DOCTOR SAYS', (0, 0, 0.85), 0.08, '#9FB0D6', False, face_cam=cam, glow=1.4)
            neon('Heart failure', (0, 0, 0.55), 0.2, '#FFFFFF', strength=4, extrude=0.03, cam=cam)
            camera(sc, cam, (0, 0, 0.2), 32)
            shot(sc, 'o_c1')
        if 'c2' in which:   # flatline red on the wrong word, back to life on the right one
            sc = fresh(bg='#03050E')
            floor(z=-0.6)
            ecg(-1.6, 0.0, 0.1, 2, '#FF2D6B', flat_from=-0.8, name='flat')
            ecg(0.0, 1.6, 0.1, 2, '#5FD3F3', name='back')
            neon('¿Fallo', (0, 0, 0.78), 0.17, '#FF4F86', strength=4, extrude=0.03, cam=cam)
            neon('cardíaco?', (0, 0, 0.57), 0.17, '#FF4F86', strength=4, extrude=0.03, cam=cam)
            bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -0.04, 0.67))
            bar = bpy.context.active_object
            bar.scale = (1.0, 0.01, 0.014)
            bar.rotation_euler = (0, math.radians(-8), 0)
            bar.data.materials.append(A.emission('strike', '#FF2D6B', 8))
            neon('Insuficiencia', (0, 0, -0.18), 0.17, '#5FD3F3', strength=4, extrude=0.03, cam=cam)
            neon('cardíaca', (0, 0, -0.4), 0.17, '#5FD3F3', strength=4, extrude=0.03, cam=cam)
            camera(sc, cam, (0, 0, 0.12), 32)
            shot(sc, 'o_c2', smiley=WAVE)


if __name__ == '__main__':
    main(sys.argv[1:] or ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'])
