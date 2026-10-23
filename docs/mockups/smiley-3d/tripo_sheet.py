"""The rebuilt model shown whole (handoff "Next" 2): his seven expressions in
one row, six poses with a face each, and a 360-degree turn.

  python3 tripo_sheet.py            -> out/plan/expressions.png, out/plan/poses6.png,
                                       out/plan/turn-strip.png, out/tripo-face-turn.mp4
Nothing is built here: the model is in/tripo-face.blend as the build order leaves it.
"""
import os, sys, math, subprocess
import bpy
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build
from tripo_face import set_face
from tripo_mouths import MOUTHS
from tripo_posetest import pose

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out', 'plan')
TMP = os.path.join(HERE, 'in', 'faceplan')
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
# the six poses of the plan (R1): each with one of his reactions
POSES = [
    ('Hello', 'smile', {'head': (0, -4, 6), 'upper_arm.L': (0, -8, 0), 'upper_arm.R': (0, 8, 0)}),
    ('Wave', 'laugh', {'upper_arm.R': (0, 118, 0), 'forearm.R': (0, 42, 0), 'head': (0, -6, 8), 'chest': (0, -3, 0)}),
    ('Get ready', 'worried', {'lift': -.05, 'spine': (18, 0, 0), 'chest': (10, 0, 0), 'head': (-22, 0, 0),
                              'thigh.L': (-40, -4, 0), 'thigh.R': (-40, 4, 0), 'shin.L': (62, 0, 0), 'shin.R': (62, 0, 0),
                              'upper_arm.L': (-30, -20, 0), 'upper_arm.R': (-30, 20, 0), 'forearm.L': (0, -70, 0), 'forearm.R': (0, 70, 0)}),
    ('Jump', 'laugh', {'lift': .12, 'upper_arm.L': (-10, -150, 0), 'upper_arm.R': (-10, 150, 0),
                       'thigh.L': (-62, -6, 0), 'thigh.R': (-45, 6, 0), 'shin.L': (85, 0, 0), 'shin.R': (70, 0, 0), 'head': (-10, 0, 0)}),
    ('Point', 'surprised', {'spine': (0, 0, 10), 'chest': (0, 0, 8), 'head': (-4, 4, 18), 'upper_arm.L': (-20, -78, -20),
                            'forearm.L': (0, -8, 0), 'upper_arm.R': (0, 10, 0)}),
    ('Thinking', 'doubt', {'head': (6, 0, -12), 'chest': (0, 0, -6), 'upper_arm.R': (-40, 30, 0), 'forearm.R': (0, 120, 0),
                           'hand.R': (-30, 0, 0), 'upper_arm.L': (0, -6, 0)}),
]


def render(path, res):
    sc = bpy.context.scene
    sc.render.resolution_x, sc.render.resolution_y = res
    bpy.context.view_layer.update()
    sc.render.filepath = path; bpy.ops.render.render(write_still=True)
    return Image.open(path).convert('RGB')


def titled(im, text, size=26):
    ImageDraw.Draw(im).text((20, 16), text, font=ImageFont.truetype(FB, size), fill=(37, 46, 109))
    return im


if __name__ == '__main__':
    bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'in', 'tripo-face.blend'))
    sc = bpy.context.scene
    ob = bpy.data.objects['Mesh_0']; arm = bpy.data.objects['Rig']
    build.STYLE_NOW = 'tripo'
    cam = build.studio(); sc.camera = cam
    sc.cycles.samples = int(os.environ.get('SAMPLES', 16))
    os.makedirs(TMP, exist_ok=True)
    jobs = sys.argv[1:] or ['expressions', 'poses', 'turn']

    if 'expressions' in jobs:
        # the seven faces as the reactions sheet renders them (whole face, 3/4 to the left), in one row
        tiles = []
        for name in MOUTHS:
            im = Image.open(os.path.join(TMP, f'mf-{name}.png')).convert('RGB')
            tiles.append(titled(im, name))
        sheet = Image.new('RGB', (480 * len(tiles), 360), 'white')
        for i, t in enumerate(tiles):
            sheet.paste(t, (480 * i, 0))
        sheet.save(os.path.join(OUT, 'expressions.png'))

    if 'poses' in jobs:
        tiles = []
        for name, face, spec in POSES:
            pose(arm, spec); set_face(ob, **MOUTHS[face])
            arm.rotation_euler.z = math.radians(-20)
            build.look(cam, (0, 0, .55 + spec.get('lift', 0) * .5), 4.6, 0, 5)
            tiles.append(titled(render(os.path.join(TMP, f'pose-{name}.png'), (420, 760)), f'{name} ({face})'))
        sheet = Image.new('RGB', (420 * len(tiles), 760))
        for i, t in enumerate(tiles):
            sheet.paste(t, (420 * i, 0))
        sheet.save(os.path.join(OUT, 'poses6.png'))

    if 'turn' in jobs:
        pose(arm, {}); set_face(ob, **MOUTHS['smile'])
        n = int(os.environ.get('FRAMES', 24)); frames = []
        tdir = os.path.join(HERE, 'out', 'tripo_turn'); os.makedirs(tdir, exist_ok=True)
        for k in range(n):
            arm.rotation_euler.z = math.radians(360 * k / n)
            build.look(cam, (0, 0, .55), 4.6, 0, 5)
            frames.append(render(os.path.join(tdir, f'f{k:03d}.png'), (360, 640)))
        step = max(1, n // 8)
        strip = Image.new('RGB', (360 * 8, 640))
        for i in range(8):
            strip.paste(titled(frames[(i * step) % n].copy(), f'{360 * i * step // n}°', 22), (360 * i, 0))
        strip.save(os.path.join(OUT, 'turn-strip.png'))
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '12', '-i', os.path.join(tdir, 'f%03d.png'),
                        '-pix_fmt', 'yuv420p', '-vf', 'scale=360:640', os.path.join(HERE, 'out', 'tripo-face-turn.mp4')], check=True)
    print('done')
