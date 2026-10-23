"""Pose test for the skeleton on the kept Tripo model: rest, wave, crouch-jump,
turn and point (out/plan/rig-test.png)."""
import os, sys, math
import bpy
from mathutils import Matrix, Vector
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build

HERE = os.path.dirname(os.path.abspath(__file__))
POSES = [
    ('Rest', {}),
    ('Wave', {'upper_arm.R': (0, 118, 0), 'forearm.R': (0, 42, 0), 'head': (0, -6, 8), 'chest': (0, -3, 0)}),
    ('Jump', {'lift': .12, 'upper_arm.L': (-10, -150, 0), 'upper_arm.R': (-10, 150, 0),
              'thigh.L': (-62, -6, 0), 'thigh.R': (-45, 6, 0), 'shin.L': (85, 0, 0), 'shin.R': (70, 0, 0), 'head': (-10, 0, 0)}),
    ('Point', {'spine': (0, 0, 10), 'chest': (0, 0, 8), 'head': (-4, 4, 18), 'upper_arm.L': (-20, -78, -20),
               'forearm.L': (0, -8, 0), 'upper_arm.R': (0, 10, 0)}),
]


def pose(arm, spec):
    for pb in arm.pose.bones:
        pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
    for b, r in spec.items():
        if b == 'lift':
            continue
        pb = arm.pose.bones[b]; M = pb.bone.matrix_local.to_3x3()
        R = Matrix.Rotation(math.radians(r[2]), 3, 'Z') @ Matrix.Rotation(math.radians(r[1]), 3, 'Y') @ Matrix.Rotation(math.radians(r[0]), 3, 'X')
        pb.rotation_quaternion = (M.inverted() @ R @ M).to_quaternion()
    rb = arm.pose.bones['root']
    rb.location = rb.bone.matrix_local.to_3x3().inverted() @ Vector((0, 0, spec.get('lift', 0)))


if __name__ == '__main__':
    bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'in', 'tripo-rig.blend'))
    sc = bpy.context.scene
    arm = bpy.data.objects['Rig']
    build.STYLE_NOW = 'tripo'
    cam = build.studio()
    sc.cycles.samples = 16
    sc.render.resolution_x, sc.render.resolution_y = 420, 760
    tiles = []
    f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 26)
    for name, spec in POSES:
        pose(arm, spec)
        arm.rotation_euler.z = math.radians(-20)
        build.look(cam, (0, 0, .55 + spec.get('lift', 0) * .5), 4.6, 0, 5)
        p = os.path.join(HERE, 'out', 'plan', 'rig-t.png'); sc.render.filepath = p
        bpy.ops.render.render(write_still=True)
        im = Image.open(p).copy(); ImageDraw.Draw(im).text((20, 16), name, font=f, fill=(37, 46, 109)); tiles.append(im)
    sheet = Image.new('RGB', (420 * len(tiles), 760))
    for i, t in enumerate(tiles):
        sheet.paste(t, (420 * i, 0))
    sheet.save(os.path.join(HERE, 'out', 'plan', 'rig-test.png'))
    print('done')
