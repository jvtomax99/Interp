"""Front, three-quarter and side views of the head (the sticker test).

  python3 headviews.py [samples]  -> out/head-views.png
"""
import os, sys
import bpy
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)
samples = int(sys.argv[1]) if len(sys.argv) > 1 else 48
parts = build.build(head_only=True)
sc = bpy.context.scene
sc.cycles.samples = samples
sc.render.resolution_x, sc.render.resolution_y = 600, 680
cam = parts['cam']
files = []
for i, az in enumerate((0, -35, -70, -110, 180)):
    build.look(cam, (0, 0, .76), 2.6, 0, 4)
    parts['root'].rotation_euler.z = -__import__('math').radians(az)
    f = os.path.join(OUT, f'head_{i}.png')
    sc.render.filepath = f
    bpy.ops.render.render(write_still=True)
    files.append(f)
ims = [Image.open(f) for f in files]
sheet = Image.new('RGB', (sum(i.width for i in ims), ims[0].height), 'white')
x = 0
for im in ims:
    sheet.paste(im, (x, 0)); x += im.width
sheet.save(os.path.join(OUT, 'head-views.png'))
print('done', os.path.join(OUT, 'head-views.png'))
