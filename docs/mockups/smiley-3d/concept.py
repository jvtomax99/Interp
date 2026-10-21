"""One full-body picture for picture-to-3D sites (Tripo, Meshy): the drawn
head from base.webp, unchanged, on the 3D body standing straight, arms a
little out, on white. Orthographic, so the head lands exactly.

  python3 concept.py -> out/concept-front.png (1024 x 1536)
"""
import os, sys, math
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1024, 1536
parts = build.build(style='film')
sc = bpy.context.scene
sc.cycles.samples = 48
sc.render.resolution_x, sc.render.resolution_y = W, H
sc.render.film_transparent = True
for o in bpy.data.objects:   # the floor and the 3D head go: the drawn head goes on top
    if o.name == 'Floor' or o.name.split('.')[0] in ('Head', 'Hair', 'Ear', 'EarIn'):
        o.hide_render = True
build.pose(parts['arm'], {'upper_arm.L': (0, -16, 0), 'upper_arm.R': (0, 16, 0), 'forearm.L': (-8, 0, 0), 'forearm.R': (-8, 0, 0)}, 'rest')
cam = parts['cam']
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 1.12
cam.location = (0, -4, .5)
cam.rotation_euler = (math.radians(90), 0, 0)
f = os.path.join(HERE, 'out', 'concept-body.png')
sc.render.filepath = f
bpy.ops.render.render(write_still=True)
bpy.context.view_layer.update()


def px(p):
    v = world_to_camera_view(sc, cam, Vector(p))
    return v.x * W, (1 - v.y) * H


# where the drawing's pixel grid lands: 1 drawing pixel = 1 mm at the head
(x0, y0), (x1, y1) = px((0, 0, build.HZ)), px((.1, 0, build.HZ))
scale = (x1 - x0) / 100
body = Image.open(f).convert('RGBA')
out = Image.new('RGBA', (W, H), (255, 255, 255, 255))
out.alpha_composite(body)
head = Image.open(os.path.join(build.HERE, '..', '..', '..', 'drsmiley', 'base.webp')).convert('RGBA')
# keep the drawing above its chin and shoulders (rows to 448), fading out over the last rows
import numpy as np
a = np.array(head)
for y in range(430, 600):
    a[y, :, 3] = (a[y, :, 3] * max(0, (448 - y) / 18)).astype(np.uint8)
head = Image.fromarray(a).resize((round(480 * scale), round(600 * scale)), Image.LANCZOS)
hx, hy = round(x0 - build.FACE_PX[0] * scale), round(y0 - build.FACE_PX[1] * scale)
out.alpha_composite(head, (hx, hy))
out.convert('RGB').save(os.path.join(HERE, 'out', 'concept-front.png'))
print('done', scale, hx, hy)
