"""Preview frames for the new scenes of storyboard 2: the feature bursts
(each feature's real screen on a floating glass phone), the double-tap that
opens the HUMC Brain, and the dive from CoreCHI Practice into its campus.
    BOARD_SCALE=2 python storyboard2.py      -> build/board/m1.png ...
Screens come from tools/screens.cjs (build/screens/r_<name>.png).
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
from mathutils import Euler, Vector  # noqa: E402

import assets as A  # noqa: E402
from storyboard import camera, fresh, shot, text  # noqa: E402

SCREENS = os.path.join(A.BUILD, 'screens')
PH_W, PH_H = 0.52, 1.0          # a phone: the screenshots are 1179 x 2277


def phone(name, loc, rot_z=0.0, power=1.0, h=PH_H):
    """A glass phone: a dark rounded body with the real screen glowing under
    a glossy coat (like the first film's panels)."""
    w = h * PH_W / PH_H
    bpy.ops.mesh.primitive_cube_add(size=1)
    body = bpy.context.active_object
    body.scale = (w * 1.045, 0.035, h * 1.025)
    bev = body.modifiers.new('round', 'BEVEL')
    bev.width = w * 0.1
    bev.segments = 8
    bev.limit_method = 'ANGLE'
    bm = bpy.data.materials.new('phone body')
    b = bm.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = A.srgb('#0A0F26')
    b.inputs['Metallic'].default_value = 0.6
    b.inputs['Roughness'].default_value = 0.18
    b.inputs['Coat Weight'].default_value = 1.0
    body.data.materials.append(bm)
    # The screen
    bpy.ops.mesh.primitive_plane_add(size=1)
    scr = bpy.context.active_object
    scr.scale = (w, h, 1)
    scr.rotation_euler = (math.radians(90), 0, 0)
    scr.location = (0, -0.0185, 0)
    m = bpy.data.materials.new('screen ' + name)
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (0.005, 0.006, 0.012, 1)
    bsdf.inputs['Roughness'].default_value = 0.05
    bsdf.inputs['Coat Weight'].default_value = 1.0
    bsdf.inputs['Coat Roughness'].default_value = 0.03
    t = nt.nodes.new('ShaderNodeTexImage')
    t.image = bpy.data.images.load(os.path.join(SCREENS, 'r_%s.png' % name), check_existing=True)
    nt.links.new(t.outputs['Color'], bsdf.inputs['Emission Color'])
    bsdf.inputs['Emission Strength'].default_value = power
    tr = nt.nodes.new('ShaderNodeBsdfTransparent')
    mx = nt.nodes.new('ShaderNodeMixShader')
    out = nt.nodes['Material Output']
    nt.links.new(t.outputs['Alpha'], mx.inputs['Fac'])
    nt.links.new(tr.outputs[0], mx.inputs[1])
    nt.links.new(bsdf.outputs[0], mx.inputs[2])
    nt.links.new(mx.outputs[0], out.inputs['Surface'])
    scr.data.materials.append(m)
    # Placed directly, not parented: a still frame doesn't need them to move together.
    body.location = loc
    body.rotation_euler = (0, 0, rot_z)
    off = Vector((0, -0.0185, 0))
    off.rotate(Euler((0, 0, rot_z)))
    scr.location = Vector(loc) + off
    scr.rotation_euler = (math.radians(90), 0, rot_z)
    scr.scale = (w, h, 1)
    return body


def sheen():
    """A long dim strip only glass sees: a soft highlight across the phones."""
    bpy.ops.mesh.primitive_plane_add(size=1)
    s = bpy.context.active_object
    s.scale = (6, 0.6, 1)
    s.location = (0, -3.0, 2.6)
    s.rotation_euler = (math.radians(-55), 0, 0)
    s.data.materials.append(A.emission('sheen', '#9FC4EA', 0.5))
    s.visible_camera = False
    s.visible_diffuse = False
    s.visible_shadow = False


def ring(loc, r, col='#5FD3F3', strength=4.0, thick=0.006):
    bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=thick, location=loc,
                                     rotation=(math.radians(90), 0, 0))
    o = bpy.context.active_object
    o.data.materials.append(A.emission('ring', col, strength))
    return o


def burst(name, title, items):
    """Three phones in a shallow arc, each lights on its beat; names below."""
    sc = fresh(bg='#070B22', view='Standard')
    sheen()
    cam = (0, -2.75, 0.12)
    for k, (scr, label) in enumerate(items):
        x = (k - 1) * 0.68
        phone(scr, (x, abs(k - 1) * 0.18, 0.12), rot_z=-(k - 1) * 0.2)
        text(label, (x, abs(k - 1) * 0.18 - 0.1, -0.5), 0.07, '#FFFFFF', True, face_cam=cam, glow=1.0)
    text(title, (-1.0, 0.1, 0.8), 0.055, '#5FD3F3', False, align='LEFT', face_cam=cam, glow=1.0)
    camera(sc, cam, (0, 0, 0.1), 35)
    shot(sc, name)


def main(which):
    if 'm1' in which:
        burst('m1', 'FINDING A WORD', [('glossary', 'Glossary'), ('translate', 'Translate'), ('ask', 'Ask the Hub')])
    if 'm2' in which:
        burst('m2', 'BEFORE AN APPOINTMENT', [('prep', 'Doctor Prep'), ('falsefriends', 'False Friends'), ('chat', 'Team Chat')])
    if 'm3' in which:
        burst('m3', 'KEEP LEARNING', [('review', 'Term Review'), ('drill', 'Daily Drill'), ('memory', 'Memory trainer')])
    if 'm4' in which:   # Home: a double-tap on Dr. Smiley's head opens the HUMC Brain
        sc = fresh(bg='#070B22', view='Standard')
        sheen()
        phone('home', (0, 0, 0), rot_z=0.12, h=1.6)
        bpy.context.view_layer.update()
        # His head on the Home screen sits at about 75% across, 29% down.
        w = 1.6 * PH_W / PH_H
        head = Vector(((0.746 - 0.5) * w, -0.05, (0.5 - 0.29) * 1.6))
        head.rotate(Euler((0, 0, 0.12)))
        for r, s in ((0.07, 5.0), (0.12, 2.5), (0.18, 1.2)):
            ring(head, r, strength=s * 0.6)
        cam = (0.45, -2.6, 0.45)
        text('double-tap', head + Vector((0.32, -0.1, 0.12)), 0.06, '#5FD3F3', True, face_cam=cam, glow=1.4)
        camera(sc, cam, head + Vector((-0.1, 0, -0.12)), 40, fstop=2.0, focus=(head - Vector(cam)).length)
        shot(sc, 'm4')
    if 'm5' in which:   # CoreCHI Practice: into its campus card
        sc = fresh(bg='#070B22', view='Standard')
        sheen()
        phone('practice', (0, 0, 0), rot_z=-0.1, h=1.6)
        w = 1.6 * PH_W / PH_H
        card = Vector(((0.5 - 0.5) * w, -0.05, (0.5 - 0.74) * 1.6))
        ring(card, 0.3, '#F2A65A', 1.6, 0.004)
        cam = (-0.3, -2.3, 0.05)
        camera(sc, cam, card + Vector((0, 0, 0.05)), 40, fstop=2.2, focus=(card - Vector(cam)).length)
        shot(sc, 'm5')


if __name__ == '__main__':
    main(sys.argv[1:] or ['m1', 'm2', 'm3', 'm4', 'm5'])
