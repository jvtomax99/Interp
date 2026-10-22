"""The opening, animated: a rough 5-second motion test of the hook (Jose,
2026-10-22: "more of a hook, more animated, the words less bland").
    python hook.py            -> renders/hook/f_0001.png ... and build/hook.mp4 (with sound)
Frames at 540 x 960, low samples: a test of motion and type, not the final look.

Beats (30 fps, 120 BPM: a beat every 15 frames)
  1-12    whip in on the building, heartbeat thump
  16, 31  HEART, then FAILURE slam in (Inter Display Black Italic), camera shake
  36-58   a clock ticks; the doctor's words blow away
  60-66   ¿FALLO CARDÍACO? glitches in, pink
  72-78   a red slash cuts through it; NOT FOR PATIENTS stamps on
  84-96   its letters crack and fall
  90-102  the phone shoots up into frame: the real Translate answer
  104-122 INSUFICIENCIA CARDÍACA builds letter by letter, cyan, upright
  114-124 the pink ring draws round the real caution
  136-150 white flash into the title
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
import numpy as np  # noqa: E402
from mathutils import Euler, Vector  # noqa: E402
from PIL import Image, ImageChops  # noqa: E402

import assets as A  # noqa: E402
from openings import photo_layers, photo_plane  # noqa: E402
from storyboard import text  # noqa: E402
from storyboard2 import phone, ring, sheen  # noqa: E402
from storyboard3 import fresh  # noqa: E402

FPS, N = 30, 150
W, H = 540, 960
OUT = os.path.join(A.HERE, 'renders', 'hook')
BLACK_IT = '/usr/share/fonts/opentype/inter/InterDisplay-BlackItalic.otf'
BLACK = '/usr/share/fonts/opentype/inter/InterDisplay-Black.otf'
SMILEY_DIR = os.path.join(A.HERE, '..', 'build', 'smiley')
rnd = random.Random(11)


def ease_out(t):
    t = min(1.0, max(0.0, t))
    return 1 - (1 - t) ** 3


def back(t, s=2.2):
    t = min(1.0, max(0.0, t)) - 1
    return 1 + (s + 1) * t ** 3 + s * t ** 2


def mat_face(name, col, glow):
    m = bpy.data.materials.new(name)
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = A.srgb(col)
    b.inputs['Emission Color'].default_value = A.srgb(col)
    b.inputs['Emission Strength'].default_value = glow
    b.inputs['Roughness'].default_value = 0.2
    b.inputs['Coat Weight'].default_value = 1.0
    return m


def mat_side(name, col):
    m = bpy.data.materials.new(name)
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = A.srgb('#0B0F26')
    b.inputs['Metallic'].default_value = 0.8
    b.inputs['Roughness'].default_value = 0.18
    b.inputs['Emission Color'].default_value = A.srgb(col)
    b.inputs['Emission Strength'].default_value = 0.35
    return m


def word(body, loc, size, face, side, font, cam):
    """Heavy 3D letters: a glowing face, dark metal sides; one object per
    letter (sorted left to right) so each can be animated on its own."""
    cu = bpy.data.curves.new('w', 'FONT')
    cu.body = body
    cu.font = bpy.data.fonts.load(font, check_existing=True)
    cu.size = size
    cu.align_x = 'CENTER'
    cu.align_y = 'CENTER'
    cu.extrude = size * 0.18
    cu.bevel_depth = size * 0.02
    cu.bevel_resolution = 2
    cu.space_character = 0.96
    ob = A.link(bpy.data.objects.new('w', cu))
    ob.location = loc
    d = Vector(cam) - Vector(loc)
    ob.rotation_euler = (math.radians(90), 0, math.atan2(d.x, -d.y))
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.convert(target='MESH')
    me = ob.data
    me.materials.append(face)
    me.materials.append(side)
    for p in me.polygons:   # the letter's face looks along its local +Z
        p.material_index = 0 if p.normal.z > 0.9 else 1
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.separate(type='LOOSE')
    bpy.ops.object.mode_set(mode='OBJECT')
    parts = list(bpy.context.selected_objects)
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY')
    bpy.context.view_layer.update()
    # Left to right only: italic letters sit at slightly different heights,
    # so sorting by height first scrambled the order. frac: 0 first letter, 1 last.
    parts.sort(key=lambda p: p.location.x)
    x0, x1 = parts[0].location.x, parts[-1].location.x
    for p in parts:
        p['rest_loc'] = list(p.location)
        p['rest_rot'] = list(p.rotation_euler)
        p['frac'] = (p.location.x - x0) / max(1e-6, x1 - x0)
    return parts


def key(ob, f, loc=None, rot=None, scale=None, hide=None):
    if loc is not None:
        ob.location = loc
        ob.keyframe_insert('location', frame=f)
    if rot is not None:
        ob.rotation_euler = rot
        ob.keyframe_insert('rotation_euler', frame=f)
    if scale is not None:
        ob.scale = (scale,) * 3 if isinstance(scale, (int, float)) else scale
        ob.keyframe_insert('scale', frame=f)
    if hide is not None:
        ob.hide_render = hide
        ob.keyframe_insert('hide_render', frame=f)


def build():
    sc = fresh(bg='#2D6FD8')
    sc.render.resolution_x, sc.render.resolution_y = W, H
    sc.cycles.samples = 10
    sc.render.use_motion_blur = True
    sc.render.motion_blur_shutter = 0.45
    sc.frame_start, sc.frame_end = 1, N
    sc.render.fps = FPS
    bld, sky = photo_layers()
    # The sky reaches far above the building: the opening whip looks up into it.
    photo_plane(sky, 0, 1.024 * 6.0, (0, 2.2, 1.6))
    photo_plane(bld, 0, 1.024, (0, 0, 0))
    cam_far = (0, -1.36, 0)

    # Light for the letters' metal sides: soft strips only reflections see.
    for x, col in ((-0.9, '#FFFFFF'), (0.9, '#5FD3F3')):
        bpy.ops.mesh.primitive_plane_add(size=1, location=(x, -1.0, 0.3))
        s = bpy.context.active_object
        s.scale = (0.2, 1.4, 1)
        s.rotation_euler = (0, math.radians(90 if x < 0 else -90), 0)
        s.data.materials.append(A.emission('strip', col, 4))
        s.visible_camera = False

    white = mat_face('white face', '#FFFFFF', 2.2)
    navy_side = mat_side('navy side', '#5FD3F3')
    pink = mat_face('pink face', '#FF3D7A', 2.6)
    pink_side = mat_side('pink side', '#FF3D7A')
    cyan = mat_face('cyan face', '#5FD3F3', 2.6)
    cyan_side = mat_side('cyan side', '#5FD3F3')

    label = text('THE DOCTOR SAYS', (-0.06, -0.12, 0.3), 0.03, '#0A1A40', True, align='LEFT', face_cam=cam_far, glow=1.0)
    heart = word('HEART', (0.0, -0.12, 0.2), 0.115, white, navy_side, BLACK_IT, cam_far)
    failure = word('FAILURE', (0.0, -0.12, 0.085), 0.115, white, navy_side, BLACK_IT, cam_far)
    wrong1 = word('¿FALLO', (0.0, -0.22, 0.17), 0.085, pink, pink_side, BLACK_IT, cam_far)
    wrong2 = word('CARDÍACO?', (0.0, -0.22, 0.09), 0.085, pink, pink_side, BLACK_IT, cam_far)
    stamp = text('NOT FOR PATIENTS', (0.02, -0.24, 0.02), 0.026, '#FFFFFF', True, face_cam=cam_far, glow=3)
    stamp.data.font = bpy.data.fonts.load(BLACK, check_existing=True)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0.0, -0.235, 0.022))
    pill = bpy.context.active_object
    pill.scale = (0.26, 0.002, 0.04)
    pill.data.materials.append(A.emission('pill', '#E0124F', 2.5))
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0.0, -0.25, 0.13))
    slash = bpy.context.active_object
    slash.scale = (0.001, 0.002, 0.007)
    slash.rotation_euler = (0, math.radians(-9), 0)
    slash.data.materials.append(A.emission('slash', '#FF2D6B', 10))

    # The phone, waiting below the frame; the right word above it.
    before = set(bpy.data.objects)
    phone('translate2', (0.0, -0.78, -0.075), rot_z=0.0, h=0.3)
    sheen()
    ph = [o for o in bpy.data.objects if o not in before and o.type == 'MESH' and o.name.startswith(('Cube', 'Plane')) and abs(o.location.y + 0.78) < 0.05]
    for o in ph:
        o['rest_loc'] = list(o.location)
    cam_near = Vector((0.0, -1.4, 0.0))
    right1 = word('INSUFICIENCIA', (0.0, -0.8, 0.155), 0.034, cyan, cyan_side, BLACK, cam_near)
    right2 = word('CARDÍACA', (0.0, -0.8, 0.115), 0.034, cyan, cyan_side, BLACK, cam_near)
    for p in right2:
        p['row'] = 1
    ring_ob = ring((0.0, -0.81, -0.075 + (0.5 - 0.44) * 0.3), 0.06, '#FF4F86', 2.2, 0.0014)

    cd = bpy.data.cameras.new('cam')
    cd.lens = 50
    cam = A.link(bpy.data.objects.new('cam', cd))
    sc.camera = cam
    return sc, cam, label, heart, failure, wrong1 + wrong2, stamp, pill, slash, ph, right1 + right2, ring_ob


def animate(sc, cam, label, heart, failure, wrong, stamp, pill, slash, ph, right, ring_ob):
    def shake(f, at, amp):
        k = f - at
        if k < 0 or k > 8:
            return Vector()
        a = amp * math.exp(-k / 2.5)
        return Vector((a * math.sin(k * 2.7), 0, a * math.cos(k * 3.3)))

    for f in range(1, N + 1):
        # Camera: whip in, drift, the impacts, then down to the phone.
        if f <= 12:   # whip down from the sky onto the building (a start from far back showed the photo's edges)
            t = ease_out((f - 1) / 11)
            pos = Vector((0, -1.36, 0))
            roll = math.radians(5) * (1 - t)
        elif f < 92:
            t = (f - 12) / 80
            pos = Vector((0.01 * t, -1.36 + 0.2 * t, -0.03 * t))
            roll = 0
        else:
            t = ease_out((f - 92) / 12)
            pos = Vector((0.01 * (1 - t), -1.16 - 0.24 * t, -0.03 + 0.03 * t))
            roll = 0
        pos += shake(f, 16, 0.006) + shake(f, 31, 0.008) + shake(f, 78, 0.004)
        tgt = pos + Vector((0, 1, 0))
        if f <= 12:
            tgt = pos + Vector((0, 1, 0.55 * (1 - ease_out((f - 1) / 11))))
        cam.location = pos
        cam.rotation_euler = (tgt - pos).to_track_quat('-Z', 'Y').to_euler()
        cam.rotation_euler.y += roll
        cam.keyframe_insert('location', frame=f)
        cam.keyframe_insert('rotation_euler', frame=f)
        cd = cam.data
        cd.dof.use_dof = f >= 96
        cd.dof.aperture_fstop = 2.2
        cd.dof.focus_distance = 0.62
        cd.dof.keyframe_insert('use_dof', frame=f)

        # THE DOCTOR SAYS slides in from the left.
        rl = Vector((-0.06, -0.12, 0.3))
        t = ease_out((f - 6) / 8)
        key(label, f, loc=rl + Vector((-0.4 * (1 - t), 0, 0)), hide=f < 6 or f > 58)

        # HEART, FAILURE: each letter slams in from behind the camera.
        for word_, land in ((heart, 16), (failure, 31)):
            for i, p in enumerate(word_):
                at = land + p['frac'] * 3          # the word lands left to right in 3 frames
                rest = Vector(p['rest_loc'])
                rr = Euler(p['rest_rot'])
                if f < at - 4:
                    key(p, f, loc=rest + Vector((0, -0.45, 0.03)), rot=rr, scale=0.001, hide=True)
                elif f <= at:
                    t = (f - (at - 4)) / 4
                    key(p, f, loc=rest + Vector((0, -0.45 * (1 - t) ** 2, 0.03 * (1 - t))), rot=rr,
                        scale=2.1 - 1.15 * t, hide=False)
                elif f < 52:
                    key(p, f, loc=rest, rot=rr, scale=back((f - at) / 6, 3.0) * 0.95 + 0.05 * ((f - at) > 6), hide=False)
                else:   # blown away up and out
                    t = (f - 52 - i * 0.4) / 8
                    t = max(0.0, t)
                    key(p, f, loc=rest + Vector((rnd.uniform(-0.02, 0.02), 0.2 * t, 0.5 * t * t)),
                        rot=(rr.x - 1.2 * t, rr.y, rr.z + (0.6 if i % 2 else -0.6) * t), scale=max(0.001, 1 - t),
                        hide=f > 64)

        # ¿FALLO CARDÍACO?: glitches in, gets cut, cracks and falls.
        for i, p in enumerate(wrong):
            rest = Vector(p['rest_loc'])
            rr = Euler(p['rest_rot'])
            if f < 60:
                key(p, f, loc=rest, rot=rr, scale=1, hide=True)
            elif f < 67:   # glitch: jumps about, a few frames visible, a few not
                j = Vector((rnd.uniform(-.03, .03), 0, rnd.uniform(-.012, .012))) * (67 - f) / 7
                key(p, f, loc=rest + j, rot=rr, scale=(1 + rnd.uniform(-.2, .3) * (67 - f) / 7, 1, 1), hide=rnd.random() < 0.3)
            elif f < 84 + i * 0.8:
                key(p, f, loc=rest, rot=rr, scale=1, hide=False)
            else:   # cracks loose and falls
                t = (f - 84 - i * 0.8) / FPS
                key(p, f, loc=rest + Vector((rnd.uniform(-1, 1) * 0.02 * t * 30, -0.05 * t * 30, -0.5 * 9.8 * t * t * 0.08)),
                    rot=(rr.x + (i % 3 - 1) * 4 * t, rr.y + (1 if i % 2 else -1) * 5 * t, rr.z), scale=1, hide=f > 104)
        t = ease_out((f - 72) / 6)
        key(slash, f, scale=(max(0.001, 0.36 * t), 0.002, 0.007), hide=not (72 <= f < 92))
        s = 1.0 if f < 78 else back((f - 78) / 5, 2.4)
        s = max(0.001, 1.7 - 0.7 * s) if f >= 78 else 0.001
        key(stamp, f, scale=s, hide=not (78 <= f < 92))
        key(pill, f, scale=(0.26 * s, 0.002, 0.04 * s), hide=not (78 <= f < 92))

        # The phone shoots up into frame.
        t = back((f - 90) / 12, 1.6)
        for o in ph:
            rest = Vector(o['rest_loc'])
            key(o, f, loc=rest + Vector((0, 0, -0.45 * (1 - t))), hide=f < 90)

        # INSUFICIENCIA CARDÍACA builds itself, letter by letter, flipping up.
        for i, p in enumerate(right):
            at = 104 + p['frac'] * 9 + 6 * p.get('row', 0)   # CARDÍACA starts as INSUFICIENCIA finishes
            rest = Vector(p['rest_loc'])
            rr = Euler(p['rest_rot'])
            t = back((f - at) / 6, 1.8)
            key(p, f, loc=rest + Vector((0, 0, -0.03 * (1 - t))), rot=(rr.x - 1.4 * (1 - min(t, 1)), rr.y, rr.z),
                scale=max(0.001, min(t, 1.1)), hide=f < at)

        t = ease_out((f - 114) / 10)
        key(ring_ob, f, scale=max(0.001, t), hide=f < 114)

    for a in bpy.data.actions:
        for fc in getattr(a, 'fcurves', []):
            for kp in fc.keyframe_points:
                kp.interpolation = 'CONSTANT' if fc.data_path == 'hide_render' else 'LINEAR'


def post(f, path):
    """The 2D pass: RGB split on the impacts and the glitch, Dr. Smiley in the
    corner, the white flash at the end."""
    im = Image.open(path).convert('RGB')
    split = {16: 6, 17: 3, 31: 7, 32: 4, 78: 3}.get(f, 0)
    if 60 <= f < 67:
        split = rnd.choice((4, 8, 12))
    if split:
        r, g, b = im.split()
        r = ImageChops.offset(r, split, 0)
        b = ImageChops.offset(b, -split, 0)
        im = Image.merge('RGB', (r, g, b))
    face = 'look_surprised_up.png' if 62 <= f < 100 else 'look_wink_wink.png' if 118 <= f < 140 else None
    if face:
        s = Image.open(os.path.join(SMILEY_DIR, face)).convert('RGBA')
        k = min(1.0, (f - (62 if f < 100 else 118)) / 5)
        h = int(H * 0.2 * (0.6 + 0.4 * back(k)))
        s = s.resize((max(1, int(s.width * h / s.height)), max(1, h)), Image.LANCZOS)
        base = im.convert('RGBA')
        base.alpha_composite(s, (W - s.width - 14, H - h - 18))
        im = base.convert('RGB')
    if f >= 136:
        a = ((f - 136) / 14) ** 2
        im = Image.blend(im, Image.new('RGB', im.size, (255, 255, 255)), min(1.0, a))
    im.save(path)


def main():
    os.makedirs(OUT, exist_ok=True)
    parts = build()
    animate(*parts)
    sc = parts[0]
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(A.BUILD, 'hook.blend'))
    only = [int(x) for x in sys.argv[1:]] or range(1, N + 1)
    for f in only:
        sc.frame_set(f)
        path = os.path.join(OUT, 'f_%04d.png' % f)
        sc.render.filepath = path
        bpy.ops.render.render(write_still=True)
        post(f, path)
        print('frame', f, flush=True)


if __name__ == '__main__':
    main()
