"""Pictures for the visual plan (Jose's rule, 2026-10-21: a visual step-by-step
plan with screenshots before anything on the mascot is built).

  python3 planboard.py -> out/plan-skeleton.png, out/plan-faces.png
"""
import os, sys, math
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out')
parts = build.build(style='film')
sc = bpy.context.scene
arm, cam = parts['arm'], parts['cam']

# 1. the skeleton drawn over him (bones don't render, so they are projected and drawn)
sc.cycles.samples = 24
W, H = 540, 900
sc.render.resolution_x, sc.render.resolution_y = W, H
build.pose(arm, {'upper_arm.L': (0, -16, 0), 'upper_arm.R': (0, 16, 0), 'forearm.L': (-8, 0, 0), 'forearm.R': (-8, 0, 0)}, 'rest')
build.look(cam, (0, 0, .5), 4.4, 0, 3)
bpy.context.view_layer.update()
f = os.path.join(OUT, 'plan-skeleton.png'); sc.render.filepath = f
bpy.ops.render.render(write_still=True)
im = Image.open(f).convert('RGB')
im = Image.blend(im, Image.new('RGB', im.size, (255, 255, 255)), .45)
g = ImageDraw.Draw(im)
root = parts['root']
for pb in arm.pose.bones:
    a = world_to_camera_view(sc, cam, root.matrix_world @ arm.matrix_world @ pb.head)
    b = world_to_camera_view(sc, cam, root.matrix_world @ arm.matrix_world @ pb.tail)
    pa, pb_ = (a.x * W, (1 - a.y) * H), (b.x * W, (1 - b.y) * H)
    small = pb.name.startswith(('f0', 'f1', 'f2', 'tha', 'thb'))
    col = (1, 184, 230) if small else (37, 46, 109)
    g.line([pa, pb_], fill=col, width=3 if small else 6)
    r = 3 if small else 7
    g.ellipse([pa[0] - r, pa[1] - r, pa[0] + r, pa[1] + r], fill=(255, 255, 255), outline=col, width=3)
im.save(f)

# 2. his drawn expressions on the 3D head
sc.render.resolution_x, sc.render.resolution_y = 360, 400
build.pose(arm, {}, 'rest')
build.look(cam, (0, 0, .78), 2.0, 0, 4)
tiles = []
for face in ('rest', 'smile', 'laugh', 'surprised', 'wink', 'worried'):
    build.set_face(face)
    f = os.path.join(OUT, f'plan_face_{face}.png'); sc.render.filepath = f
    bpy.ops.render.render(write_still=True)
    tiles.append(Image.open(f).convert('RGB'))
sheet = Image.new('RGB', (360 * 3, 400 * 2))
for i, t in enumerate(tiles):
    sheet.paste(t, ((i % 3) * 360, (i // 3) * 400))
sheet.save(os.path.join(OUT, 'plan-faces.png'))
print('done')
