"""Before / after for steps 4-6: Jose's Tripo model as it came and after
tripo_fix.py, head close-ups and full body, same studio.

  python3 tripo_compare.py before|after  -> out/plan/tripo-<which>-*.png
  python3 tripo_compare.py sheet          -> out/tripo-before-after.png
"""
import os, sys, math
import bpy
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tripo_lib as T
import build

HERE = T.HERE
which = sys.argv[-1]
OUTD = os.path.join(HERE, 'out', 'plan')
VIEWS = ((0, 'front'), (35, '3/4'), (90, 'side'), (180, 'back'))
if which in ('before', 'after'):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if which == 'before':
        ob = T.load()
    else:
        bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'in', 'tripo-fixed.blend'))
        ob = [o for o in bpy.data.objects if o.type == 'MESH'][0]
    root = bpy.data.objects.new('R', None); bpy.context.scene.collection.objects.link(root); ob.parent = root
    build.STYLE_NOW = 'tripo' if which == 'after' else 'film'
    cam = build.studio(); sc = bpy.context.scene
    sc.cycles.samples = 32
    for az, name in (VIEWS[:1] if os.environ.get('FRONT_ONLY') else VIEWS):
        root.rotation_euler.z = math.radians(az)
        sc.render.resolution_x, sc.render.resolution_y = 480, 520
        build.look(cam, (0, 0, .80), 1.7, 0, 4)
        sc.render.filepath = os.path.join(OUTD, f'tripo-{which}-head-{az}.png'); bpy.ops.render.render(write_still=True)
    if os.environ.get('FRONT_ONLY'):
        sys.exit(0)
    root.rotation_euler.z = math.radians(20)
    sc.render.resolution_x, sc.render.resolution_y = 480, 860
    build.look(cam, (0, 0, .5), 4.4, 0, 5)
    sc.render.filepath = os.path.join(OUTD, f'tripo-{which}-body.png'); bpy.ops.render.render(write_still=True)
    print('done', which)
else:
    FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
    f = ImageFont.truetype(FB, 28)
    rows = []
    for az, name in VIEWS:
        a = Image.open(os.path.join(OUTD, f'tripo-before-head-{az}.png'))
        b = Image.open(os.path.join(OUTD, f'tripo-after-head-{az}.png'))
        r = Image.new('RGB', (980, 520), 'white'); r.paste(a, (0, 0)); r.paste(b, (500, 0)); rows.append(r)
    sheet = Image.new('RGB', (980, 70 + 520 * len(rows)), 'white')
    g = ImageDraw.Draw(sheet)
    g.text((240, 35), 'As it came', font=f, fill=(90, 100, 120), anchor='mm')
    g.text((740, 35), 'After: matte, recoloured, reshaped', font=f, fill=(37, 46, 109), anchor='mm')
    for i, r in enumerate(rows):
        sheet.paste(r, (0, 70 + 520 * i))
    sheet.save(os.path.join(HERE, 'out', 'tripo-before-after.png'))
    print('done sheet')
