"""Hook, take 2: "inside the brain" (Jose's pick, 2026-10-22). A rough
5-second motion test.
    python brainhook.py [frames...]   -> renders/brainhook/f_0001.png ...
Then hook_sound2 in brainhook_sound.py and ffmpeg make build/brainhook.mp4.

Beats (30 fps, 120 BPM)
  1-68    inside the real HUMC Brain: the camera flies through nuclei and
          tracts, signals racing past; "HUMC BRAIN · 119 NUCLEI · 1,115
          TRACTS" flashes (real numbers, brain/data.json via the dump)
  68-98   pull back: the whole brain appears
  96-122  it shrinks and flies into Dr. Smiley's head on the real Home
          screen, which lights up (the double-tap, in reverse)
  122     rings snap in round his head
  126,132 INTERPRETER, HUB slam in above the phone
  140-150 white flash into the next section
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
import numpy as np  # noqa: E402
from mathutils import Vector  # noqa: E402
from PIL import Image, ImageDraw, ImageFont  # noqa: E402

import assets as A  # noqa: E402
from hook import BLACK, back, ease_out, key, mat_face, mat_side, word  # noqa: E402
from storyboard2 import PH_H, PH_W, phone, ring, sheen  # noqa: E402
from storyboard3 import fresh  # noqa: E402

FPS, N = 30, 150
W, H = 540, 960
OUT = os.path.join(A.HERE, 'renders', 'brainhook')
rnd = random.Random(5)
PHONE_Y, PHONE_H = 0.6, 1.6
HEAD = Vector(((0.746 - 0.5) * PHONE_H * PH_W / PH_H, PHONE_Y - 0.05, (0.5 - 0.29) * PHONE_H))


def smooth(a, b, t):
    t = min(1.0, max(0.0, t))
    t = t * t * (3 - 2 * t)
    return a + (b - a) * t


def build():
    sc = fresh(bg='#02030C')
    sc.render.resolution_x, sc.render.resolution_y = W, H
    sc.cycles.samples = 10
    sc.render.use_motion_blur = True
    sc.render.motion_blur_shutter = 0.4
    sc.frame_start, sc.frame_end = 1, N

    coll, B = A.brain()
    d = B['data']
    # One handle for the whole brain, so it can shrink and fly as one.
    pivot = A.link(bpy.data.objects.new('brain', None))
    bpy.context.view_layer.update()
    for o in (B['shell'], B['nuclei'], B['tracts']):
        o.parent = pivot
        o.matrix_parent_inverse = pivot.matrix_world.inverted()

    # Signals: bright dots running along real tracts (moved every frame).
    P = [Vector((p[0], -p[2], p[1])) for p in d['pos']]
    edges = rnd.sample(d['edges'], 90)
    paths = []
    for e in edges:
        a, b = P[e['a']], P[e['b']]
        c = Vector((e['c'][0], -e['c'][2], e['c'][1]))
        paths.append((a, b, c, rnd.uniform(0, 1), rnd.uniform(0.9, 1.6), d['groups'][d['nodes'][e['b']]['group']]['color']))
    me = bpy.data.meshes.new('signals')
    me.vertices.add(len(paths))
    sig = A._points('signals', [(0, 0, 0)] * len(paths), [A.srgb(p[5]) for p in paths], [0.012] * len(paths),
                    A.emission('signals', strength=9.0, attr='col'), coll)
    sig.parent = pivot

    sheen()
    before = set(bpy.data.objects)
    phone('home', (0, PHONE_Y, 0), rot_z=0.0, h=PHONE_H)
    ph = [o for o in bpy.data.objects if o not in before]
    scr_mat = bpy.data.materials.get('screen home')
    rings = [ring(HEAD + Vector((0, -0.02, 0)), r, '#5FD3F3', 3.0, 0.006) for r in (0.08, 0.14, 0.2)]

    white = mat_face('white face', '#FFFFFF', 2.0)
    cyan_side = mat_side('cyan side', '#5FD3F3')
    cam_end = cam_end_pos()
    t1 = word('INTERPRETER', (0, PHONE_Y - 0.3, 1.13), 0.13, white, cyan_side, BLACK, cam_end)
    t2 = word('HUB', (0, PHONE_Y - 0.3, 0.97), 0.13, white, cyan_side, BLACK, cam_end)

    cd = bpy.data.cameras.new('cam')
    cam = A.link(bpy.data.objects.new('cam', cd))
    sc.camera = cam
    return sc, cam, pivot, sig, paths, ph, scr_mat, rings, t1, t2


def animate(sc, cam, pivot, sig, paths, ph, scr_mat, rings, t1, t2):
    for f in range(1, N + 1):
        # Camera: inside, flying through the middle where the tracts converge;
        # then back out to the whole brain; then to the phone.
        if f <= 68:
            t = (f - 1) / 67
            pos = Vector((smooth(-1.05, 0.35, t), smooth(0.25, -0.15, t), smooth(0.2, 0.0, t)))
            tgt = pos + Vector((1.0, -0.15 + 0.3 * math.sin(t * 2.2), -0.05))
            lens = 22
        elif f <= 100:   # out fast, so the wide lens doesn't stretch the brain
            # out to the side: from the front the brain reads as a bow-tie;
            # from the side it reads as a brain
            t = ease_out((f - 68) / 32)
            pos = Vector((0.35, -0.15, 0)).lerp(Vector((3.3, -1.5, 0.45)), t)
            a = Vector((0.35, -0.15, 0)) + Vector((1.0, -0.15 + 0.3 * math.sin(2.2), -0.05))
            tgt = a.lerp(Vector((0, 0.1, 0.0)), min(1.0, t * 1.6))
            lens = smooth(22, 35, (f - 68) / 12)
        else:
            t = (f - 100) / 24
            pos = Vector((3.3, -1.5, 0.45)).lerp(Vector(cam_end_pos()), ease_out(t))
            tgt = Vector((0, 0.1, 0.0)).lerp(Vector((0, PHONE_Y, 0.2)), ease_out(t))
            lens = smooth(32, 35, t)
        cam.location = pos
        cam.rotation_euler = (tgt - pos).to_track_quat('-Z', 'Y').to_euler()
        cam.data.lens = lens
        cam.keyframe_insert('location', frame=f)
        cam.keyframe_insert('rotation_euler', frame=f)
        cam.data.keyframe_insert('lens', frame=f)

        # The brain: whole until 96, then shrinks into his head and is gone at 123.
        t = ease_out((f - 96) / 26)
        s = 1.0 + (0.045 - 1.0) * t if f < 122 else max(0.0005, 0.045 * (1 - (f - 122) / 2))
        key(pivot, f, loc=Vector((0, 0, 0)).lerp(HEAD, t), scale=s)

        # The Home screen lights up as the brain lands.
        if scr_mat:
            sv = scr_mat.node_tree.nodes['Principled BSDF'].inputs['Emission Strength']
            sv.default_value = smooth(0.0, 1.0, (f - 98) / 18)
            sv.keyframe_insert('default_value', frame=f)

        # Rings snap in round his head (the double-tap, in reverse).
        for k, r in enumerate(rings):
            u = (f - 122 - k) / 6
            key(r, f, scale=max(0.001, 2.5 - 1.5 * ease_out(u)) if u >= 0 else 0.001, hide=not (0 <= u < 1.6))

        # INTERPRETER, HUB slam in.
        for word_, land in ((t1, 126), (t2, 132)):
            for p in word_:
                at = land + p['frac'] * 3
                rest = Vector(p['rest_loc'])
                rr = tuple(p['rest_rot'])
                if f < at - 4:
                    key(p, f, loc=rest + Vector((0, -0.8, 0.05)), rot=rr, scale=0.001, hide=True)
                elif f <= at:
                    u = (f - (at - 4)) / 4
                    key(p, f, loc=rest + Vector((0, -0.8 * (1 - u) ** 2, 0.05 * (1 - u))), rot=rr, scale=2.0 - u, hide=False)
                else:
                    key(p, f, loc=rest, rot=rr, scale=back((f - at) / 6, 3.0) if f - at < 6 else 1.0, hide=False)

    for a in bpy.data.actions:
        for fc in getattr(a, 'fcurves', []):
            for kp in fc.keyframe_points:
                kp.interpolation = 'CONSTANT' if fc.data_path == 'hide_render' else 'LINEAR'


def cam_end_pos():
    return (0, -1.75, 0.22)        # the phone fills about two thirds of the frame


def move_signals(sig, paths, f):
    co = []
    for a, b, c, phase, speed, _ in paths:
        u = (phase + f / FPS * speed) % 1.0
        q = (1 - u) ** 2 * a + 2 * (1 - u) * u * c + u * u * b
        co.extend(q)
    sig.data.vertices.foreach_set('co', np.asarray(co, np.float32))
    sig.data.update()


def post(f, path):
    im = Image.open(path).convert('RGB')
    if 22 <= f < 70:   # the readout, the brain page's own numbers
        a = min(1.0, (f - 22) / 6) * min(1.0, (70 - f) / 6)
        layer = Image.new('RGBA', im.size, (0, 0, 0, 0))
        dr = ImageDraw.Draw(layer)
        big = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-SemiBold.otf', 22)
        small = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Medium.otf', 15)
        col = (95, 211, 243, int(255 * a))
        dr.text((34, 60), 'H U M C   B R A I N', font=big, fill=col)
        shown = '1 1 9   N U C L E I   ·   1 , 1 1 5   T R A C T S'
        n = int(len(shown) * min(1.0, (f - 28) / 14)) if f >= 28 else 0
        dr.text((34, 94), shown[:n], font=small, fill=(200, 214, 242, int(230 * a)))
        dr.line((34, 124, 34 + 180 * min(1.0, (f - 22) / 10), 124), fill=col, width=2)
        im = Image.alpha_composite(im.convert('RGBA'), layer).convert('RGB')
    if f >= 140:
        im = Image.blend(im, Image.new('RGB', im.size, (255, 255, 255)), min(1.0, ((f - 140) / 10) ** 2))
    im.save(path)


def main():
    os.makedirs(OUT, exist_ok=True)
    parts = build()
    sc = parts[0]
    animate(*parts)
    only = [int(x) for x in sys.argv[1:]] or range(1, N + 1)
    for f in only:
        sc.frame_set(f)
        move_signals(parts[3], parts[4], f)
        path = os.path.join(OUT, 'f_%04d.png' % f)
        sc.render.filepath = path
        bpy.ops.render.render(write_still=True)
        post(f, path)
        print('frame', f, flush=True)


if __name__ == '__main__':
    main()
