"""Full figure from four sides at rest (quick check while building).

  python3 bodyviews.py [samples] -> out/body-views.png
"""
import os, sys, math
import bpy
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out'); os.makedirs(OUT, exist_ok=True)
samples = int(sys.argv[1]) if len(sys.argv) > 1 else 24
parts = build.build()
sc = bpy.context.scene
sc.cycles.samples = samples
sc.render.resolution_x, sc.render.resolution_y = 420, 720
files = []
for i, az in enumerate((0, -45, -90, 180)):
    build.look(parts['cam'], (0, 0, .5), 4.2, 0, 6)
    parts['root'].rotation_euler.z = -math.radians(az)
    f = os.path.join(OUT, f'body_{i}.png'); sc.render.filepath = f
    bpy.ops.render.render(write_still=True); files.append(f)
ims = [Image.open(f) for f in files]
sheet = Image.new('RGB', (sum(i.width for i in ims), ims[0].height), 'white')
x = 0
for im in ims:
    sheet.paste(im, (x, 0)); x += im.width
sheet.save(os.path.join(OUT, 'body-views.png'))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'smiley.blend'))
print('done')
