"""Quick look at the head: front, 3/4 and side, small and fast (for iterating).

  python3 quickhead.py [samples] -> out/quick-head.png
"""
import os, sys, math
import bpy
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build

HERE = os.path.dirname(os.path.abspath(__file__))
parts = build.build(head_only=True)
sc = bpy.context.scene
sc.cycles.samples = int(sys.argv[1]) if len(sys.argv) > 1 else 12
sc.render.resolution_x, sc.render.resolution_y = 420, 460
ims = []
for i, az in enumerate((0, -35, -80, 150)):
    build.look(parts['cam'], (0, 0, .78), 2.4, 0, 8)
    parts['root'].rotation_euler.z = -math.radians(az)
    f = os.path.join(HERE, 'out', f'qh_{i}.png'); sc.render.filepath = f
    bpy.ops.render.render(write_still=True); ims.append(Image.open(f))
sheet = Image.new('RGB', (420 * len(ims), 460))
for i, im in enumerate(ims):
    sheet.paste(im, (420 * i, 0))
sheet.save(os.path.join(HERE, 'out', 'quick-head.png'))
print('done')
