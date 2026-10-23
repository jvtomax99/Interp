"""Face close-ups of the 3D eyes: open / half / shut, front and 3/4, and looking
left / right / up (out/plan/eyes-test.png); with 'clip', a short blink-and-look
clip (out/tripo-eyes.mp4)."""
import os, sys, math, subprocess
import bpy
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tripo_eyes as E
import build

HERE = E.HERE
bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'in', 'tripo-eyes.blend'))
sc = bpy.context.scene
build.STYLE_NOW = 'tripo'
cam = build.studio()
root = bpy.data.objects.new('R', None); sc.collection.objects.link(root)
for o in list(sc.objects):
    if o.type == 'MESH' and o.name not in ('Floor',) and o.parent is None:
        o.parent = root
        o.matrix_parent_inverse = root.matrix_world.inverted()
eyes = [bpy.data.objects[f'Eye.{s}'] for s in 'LR']
lids = [bpy.data.objects[f'Lid.{s}'] for s in 'LR']
rest = [tuple(e['rest_gaze']) for e in eyes]


def face(blink=0, gx=None, gz=None):
    for e, l, r in zip(eyes, lids, rest):
        E.set_gaze(e, r[0] if gx is None else gx, r[1] if gz is None else gz)
        E.set_blink(l, blink)


def shot(path, az, w=420, h=380, samples=24):
    sc.cycles.samples = samples
    sc.render.resolution_x, sc.render.resolution_y = w, h
    root.rotation_euler.z = math.radians(az)
    build.look(cam, (0, 0, .78), 1.0, 0, 2)
    sc.render.filepath = path; bpy.ops.render.render(write_still=True)
    return Image.open(path).copy()


if sys.argv[-1] != 'clip':
    tiles = []
    for name, az, kw in (('open', 0, {}), ('half', 0, {'blink': .5}), ('shut', 0, {'blink': 1}),
                         ('3/4', 35, {}), ('look left', 0, {'gx': -1, 'gz': 0}), ('look right', 0, {'gx': 1, 'gz': 0}),
                         ('look up', 0, {'gx': 0, 'gz': 1}), ('3/4 half', 35, {'blink': .5})):
        face(**kw)
        tiles.append(shot(os.path.join(HERE, 'out', 'plan', 'eyes-t.png'), az))
    sheet = Image.new('RGB', (420 * 4, 380 * 2))
    for i, t in enumerate(tiles):
        sheet.paste(t, ((i % 4) * 420, (i // 4) * 380))
    sheet.save(os.path.join(HERE, 'out', 'plan', 'eyes-test.png'))
    print('done')

else:
    # the clip: (frame, gaze x, gaze z, blink) keys, eased between
    K = [(0, None, None, 0), (14, None, None, 0), (22, -1, 0, 0), (40, -1, 0, 0), (50, 1, -.1, 0), (68, 1, -.1, 0),
         (72, 1, -.1, 1), (76, 1, -.1, 0), (86, 0, 1, 0), (102, 0, 1, 0), (110, None, None, 0), (118, None, None, 0),
         (121, None, None, 1), (125, None, None, 0), (144, None, None, 0)]
    def at(f):
        for (f0, *a), (f1, *b) in zip(K, K[1:]):
            if f0 <= f <= f1:
                u = (f - f0) / max(1, f1 - f0); u = u * u * (3 - 2 * u)
                res = []
                for k, (x, y) in enumerate(zip(a, b)):
                    x = x if x is not None else (rest[0][k] if k < 2 else 0)
                    y = y if y is not None else (rest[0][k] if k < 2 else 0)
                    res.append(x + (y - x) * u)
                return res
        return [rest[0][0], rest[0][1], 0]
    d = os.path.join(HERE, 'out', 'eyes_clip'); os.makedirs(d, exist_ok=True)
    for f in range(145):
        gx, gz, bl = at(f)
        for e, l, r in zip(eyes, lids, rest):
            E.set_gaze(e, gx + (r[0] - rest[0][0]), gz + (r[1] - rest[0][1]))
            E.set_blink(l, bl)
        shot(os.path.join(d, f'{f:04d}.png'), 8, 540, 540, 12)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '24', '-i', os.path.join(d, '%04d.png'),
                    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart',
                    os.path.join(HERE, 'out', 'tripo-eyes.mp4')], check=True)
    print('clip done')
