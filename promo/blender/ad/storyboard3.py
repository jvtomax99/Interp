"""Storyboard 4: the vertical (9:16) ad, after the original promo
(media/hub-promo.mp4) and Jose's remake draft: the "heart failure" opening,
his own two-line captions, a glossy floor, Dr. Smiley in the corner.
    BOARD_SCALE=2 python storyboard3.py [v01 ...]   -> build/board/v01.png ...
Captions come from tools/captions.cjs (build/captions/) and are laid over.
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
from mathutils import Euler, Vector  # noqa: E402
from PIL import Image  # noqa: E402

import assets as A  # noqa: E402
from storyboard import LINEUP, SMILEY, WAVE, body_lights, camera, light, picture, text  # noqa: E402
from storyboard import fresh as fresh_wide  # noqa: E402
from storyboard2 import PH_H, PH_W, phone, ring, sheen  # noqa: E402

OUT = os.path.join(A.BUILD, 'board')
CAPS = os.path.join(A.BUILD, 'captions')
SURPRISED = os.path.join(A.HERE, '..', 'build', 'smiley', 'look_surprised_up.png')
K = int(os.environ.get('BOARD_SCALE', '1'))


def fresh(bg='#070B22', view='Standard', strength=1.0):
    sc = fresh_wide(bg=bg, view=view, strength=strength)
    sc.render.resolution_x, sc.render.resolution_y = 360 * K, 640 * K
    return sc


def floor(z=-0.75, size=30, rough=0.07):
    """A black glossy floor: everything above it reflects, like the draft's desk."""
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, z))
    f = bpy.context.active_object
    m = bpy.data.materials.new('floor')
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = A.srgb('#03050F')
    b.inputs['Roughness'].default_value = rough
    b.inputs['Coat Weight'].default_value = 1.0
    f.data.materials.append(m)
    return f


def neon(body, loc, size, col, strength=6.0, extrude=0.06, cam=None):
    """Glowing 3D lettering: a lit front over a darker glass body."""
    t = text(body, loc, size, col, True, face_cam=cam, glow=strength)
    t.data.extrude = extrude
    t.data.bevel_depth = size * 0.012
    t.data.resolution_u = 6
    return t


def shot(sc, name, caption=None, smiley=None):
    sc.render.filepath = os.path.join(OUT, name + '.png')
    bpy.ops.render.render(write_still=True)
    im = Image.open(sc.render.filepath).convert('RGBA')
    if smiley:   # Dr. Smiley in the corner, reacting, as in both videos
        s = Image.open(smiley).convert('RGBA')
        h = int(im.height * 0.2)
        s = s.resize((int(s.width * h / s.height), h), Image.LANCZOS)
        im.alpha_composite(s, (im.width - s.width - int(im.width * 0.03), im.height - h - int(im.height * 0.025)))
    if caption:
        c = Image.open(os.path.join(CAPS, caption + '.png')).convert('RGBA').resize(im.size, Image.LANCZOS)
        im.alpha_composite(c)
    im.convert('RGB').save(sc.render.filepath)
    print(name, 'done', flush=True)


def hook(name, label, word, col, strike=False):
    sc = fresh(bg='#04061A')
    floor(z=-0.55)
    cam = (0, -2.6, 0.05)
    text(label, (0, 0, 0.66), 0.085, '#9FB0D6', False, face_cam=cam, glow=1.4)
    lines = word.split('\n')
    size = 0.4 if max(len(x) for x in lines) <= 8 else 0.25
    for i, ln in enumerate(lines):
        neon(ln, (0, 0, 0.32 - i * size * 1.15), size, col, cam=cam)
    if strike:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -0.08, 0.2 - (len(lines) - 1) * 0.18))
        bar = bpy.context.active_object
        bar.scale = (1.75, 0.02, 0.035)
        bar.rotation_euler = (0, math.radians(-8), 0)
        bar.data.materials.append(A.emission('strike', '#FF3B6B', 8))
        text('Not for patients.', (0, 0, -0.42), 0.08, '#FF8FA8', True, face_cam=cam, glow=1.6)
    light('wash', (0, -2, 2.5), (0, 0, 0), 40, 3, '#5FD3F3')
    camera(sc, cam, (0, 0, 0.12), 32)
    return sc


def carousel(name, centre, peek, caption, note_smiley):
    """One big phone, the next peeking in from the right, on the glossy floor."""
    sc = fresh(bg='#070B22')
    sheen()
    floor(z=-0.86)
    phone(centre, (0, 0, 0), rot_z=0.06, h=1.6)
    phone(peek, (1.15, 0.5, 0), rot_z=-0.35, h=1.6)
    camera(sc, (0.08, -3.2, 0.2), (0.08, 0, -0.1), 35)
    shot(sc, name, caption, note_smiley)


def main(which):
    os.makedirs(OUT, exist_ok=True)

    if 'v01' in which:
        sc = hook('v01', 'THE DOCTOR SAYS', 'Heart\nfailure', '#FFFFFF')
        shot(sc, 'v01')
    if 'v02' in which:
        sc = hook('v02', 'THE INTERPRETER', '¿Fallo\ncardíaco?', '#FF4F86', strike=True)
        shot(sc, 'v02')
    if 'v03' in which:
        sc = hook('v03', 'THE RIGHT WORD', 'Insuficiencia\ncardíaca', '#5FD3F3')
        shot(sc, 'v03')

    if 'v04' in which:   # Title: Dr. Smiley peels off the glass; the Hub's mark
        sc = fresh()
        floor(z=-0.9)
        picture(SMILEY, (0, -0.05, -0.12), 0.95)
        text('Interpreter Hub', (0, 0, 0.55), 0.17, bold=True)
        camera(sc, (0, -3.3, 0.1), (0, 0, 0.05), 35)
        shot(sc, 'v04', 'title')

    if 'v05' in which:
        carousel('v05', 'glossary', 'translate', 'glossary', WAVE)

    if 'v06' in which or 'v07' in which or 'v08' in which:
        sc = fresh(view='AgX')
        parts = A.body()
        body_lights()
        floor(z=-0.002, rough=0.12)
        if 'v06' in which:   # The whole body, tall in the frame
            camera(sc, (0.75, -2.9, 0.75), (0.0, 0, 0.88), 35)
            shot(sc, 'v06', 'body', SURPRISED)
        if 'v07' in which:   # Systems, receding in a line the camera looks along
            for ob in parts.values():
                k = next(j for j, g in enumerate(LINEUP) if ob['system'] in g)
                ob.location = Vector(ob['centre']) + Vector((k * 0.42, k * 0.8, 0))
            camera(sc, (-2.3, -1.55, 1.1), (0.75, 1.55, 0.82), 30)
            shot(sc, 'v07', 'body')
        if 'v08' in which:   # Every piece, apart
            for ob in parts.values():
                k = next(j for j, g in enumerate(LINEUP) if ob['system'] in g)
                c = Vector(ob['centre'])
                ob.location = Vector((k * 0.42 + c.x * 1.75, k * 0.8 + c.y * 3.0, 0.9 + (c.z - 0.9) * 1.14))
            camera(sc, (-2.45, -1.7, 1.15), (0.75, 1.55, 0.86), 30)
            shot(sc, 'v08', 'body')

    if 'v09' in which:
        carousel('v09', 'doctorpage', 'directory', 'doctors', WAVE)

    if 'v10' in which:   # The double-tap on Dr. Smiley's head, on Home
        sc = fresh()
        sheen()
        floor(z=-0.86)
        phone('home', (0, 0, 0), rot_z=0.08, h=1.6)
        w = 1.6 * PH_W / PH_H
        head = Vector(((0.746 - 0.5) * w, -0.05, (0.5 - 0.29) * 1.6))
        head.rotate(Euler((0, 0, 0.08)))
        for r, s in ((0.07, 3.0), (0.12, 1.5), (0.18, 0.7)):
            ring(head, r, strength=s)
        cam = (0.2, -2.6, 0.35)
        text('double-tap', head + Vector((-0.02, -0.12, 0.26)), 0.07, '#5FD3F3', True, face_cam=cam, glow=1.4)
        camera(sc, cam, head + Vector((-0.12, 0, -0.35)), 35, fstop=2.4, focus=(head - Vector(cam)).length)
        shot(sc, 'v10')

    if 'v11' in which:   # The HUMC Brain
        sc = fresh(bg='#03061A')
        coll, B = A.brain()
        d = B['data']
        cam_at = (4.2, -1.2, 0.35)       # from the front: the brain's narrow side suits a tall frame
        for g, label, dz in (('ask', 'Ask the Hub', 0.22), ('smiley', 'Dr. Smiley', 0.22), ('core', 'Shared core', -0.32)):
            pts = [d['pos'][n['i']] for n in d['nodes'] if n['group'] == g]
            m = Vector([sum(p[i] for p in pts) / len(pts) for i in range(3)])
            text(label, Vector((m.x, -m.z, m.y + dz)), 0.2, d['groups'][g]['color'], True, face_cam=cam_at, glow=2.2)
        camera(sc, cam_at, (0.0, 0, -0.2), 30)
        shot(sc, 'v11', 'brain')

    if 'v12' in which:
        carousel('v12', 'drill', 'review', 'drills', WAVE)

    if 'v13' in which:   # CoreCHI Practice: into its campus card
        sc = fresh()
        sheen()
        floor(z=-0.86)
        phone('practice', (0, 0, 0), rot_z=-0.08, h=1.6)
        w = 1.6 * PH_W / PH_H
        card = Vector((0, -0.05, (0.5 - 0.74) * 1.6))
        ring(card, 0.3, '#F2A65A', 1.2, 0.004)
        cam = (-0.15, -2.3, -0.05)
        camera(sc, cam, card + Vector((0, 0, 0.1)), 35, fstop=2.4, focus=(card - Vector(cam)).length)
        shot(sc, 'v13')

    if 'v14' in which:   # CoreCHI City, tall: the towers rise into the frame
        sc = fresh(bg='#F6B98E', view='AgX', strength=0.32)
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
        cam_at = (5, -30, 23)
        for x, z, floors, name in ((0.6, -20.5, 14, 'Terminology'), (0, -12.4, 7, 'Ethics'), (10.6, -5.2, 11, 'Culture'),
                                   (-10.2, 1.0, 8, 'U.S. Systems'), (15.5, -16.6, 9, 'Encounter')):
            text(name, (x, -z, floors * 1.05 + 3.2), 2.6, '#FFFFFF', True, face_cam=cam_at, glow=1.4)
        camera(sc, cam_at, (1.5, 7, 6.5), 30)
        shot(sc, 'v14', 'campus', WAVE)

    if 'v15' in which:   # End
        sc = fresh(bg='#070B22')
        floor(z=-0.75)
        picture(WAVE, (0, 0, 0.35), 1.0)
        camera(sc, (0, -3.4, 0.2), (0, 0, 0.0), 35)
        shot(sc, 'v15', 'end')


if __name__ == '__main__':
    main(sys.argv[1:] or ['v%02d' % i for i in range(1, 16)])
