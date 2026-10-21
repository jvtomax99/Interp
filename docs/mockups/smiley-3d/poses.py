"""Six poses of the 3D Dr. Smiley on one phone-size sheet.

  python3 poses.py [samples] [only]  -> out/poses.png (and out/pose_<name>.png)
Pose angles: degrees about his own axes, relative to the parent bone
(build.pose): X turns a limb forward (-) or back (+); Y swings it out to
the side (his left arm -, right arm +); Z turns (+ towards his left).
'grip.L'/'grip.R' pick a hand shape from build.GRIPS (default relaxed).
"""
import os, sys, math
import bpy
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out'); os.makedirs(OUT, exist_ok=True)

POSES = [
    ('Hello', 'smile', -20, {
        'head': (2, 0, -5), 'neck': (0, 4, 0), 'chest': (0, -2, 0),
        'upper_arm.L': (0, -8, 0), 'upper_arm.R': (0, 8, 0), 'forearm.L': (-12, 0, 0), 'forearm.R': (-12, 0, 0)}),
    ('Wave', 'smile', -18, {
        'spine': (0, 5, 0), 'chest': (-3, 4, 0), 'head': (-4, -9, 8),
        'upper_arm.R': (-6, 114, 10), 'forearm.R': (-10, 0, -40), 'hand.R': (0, -10, -170), 'grip.R': 'wave',
        'upper_arm.L': (8, -14, 0), 'forearm.L': (-25, 0, 0),
        'thigh.L': (0, -4, 0), 'thigh.R': (0, 3, 0)}),
    ('Get ready', 'determined', -35, {
        'drop': .036, 'hips': (10, 0, 0), 'spine': (8, 0, 0), 'chest': (6, 0, 0), 'head': (-20, 0, 0),
        'thigh.L': (-52, -6, 0), 'thigh.R': (-52, 6, 0), 'shin.L': (84, 0, 0), 'shin.R': (84, 0, 0),
        'foot.L': (-32, 0, 0), 'foot.R': (-32, 0, 0),
        'upper_arm.L': (48, -12, 0), 'upper_arm.R': (48, 12, 0), 'forearm.L': (-20, 0, 0), 'forearm.R': (-20, 0, 0),
        'grip.L': 'fist', 'grip.R': 'fist'}),
    ('Jump', 'laugh', -25, {
        'lift': .20, 'spine': (-6, 0, 0), 'chest': (-6, 0, 0), 'head': (-10, 0, 0),
        'thigh.L': (-72, -8, 0), 'thigh.R': (-50, 8, 0), 'shin.L': (100, 0, 0), 'shin.R': (80, 0, 0),
        'foot.L': (-10, 0, 0), 'foot.R': (-15, 0, 0),
        'upper_arm.L': (-18, -128, 0), 'upper_arm.R': (-18, 128, 0), 'forearm.L': (0, 12, 0), 'forearm.R': (0, -12, 0),
        'grip.L': 'open', 'grip.R': 'open'}),
    ('Point', 'pointR', -30, {
        'spine': (0, 0, 8), 'chest': (0, 0, 8), 'head': (-4, 4, 18),
        'upper_arm.L': (0, -82, -28), 'forearm.L': (0, -6, 0), 'grip.L': 'point',
        'upper_arm.R': (-6, 30, 0), 'forearm.R': (-60, 0, -30),
        'thigh.L': (-6, -6, 0)}),
    ('Thinking', 'doubt', -22, {
        'spine': (0, 0, -4), 'head': (4, 10, -6),
        'upper_arm.R': (-84, 38, 32), 'forearm.R': (-42, 0, 36), 'hand.R': (-30, 0, 0), 'grip.R': 'fist',
        'upper_arm.L': (-30, -6, 0), 'forearm.L': (-80, 0, -60)}),
]

if __name__ == '__main__':
    samples = int(sys.argv[1]) if len(sys.argv) > 1 else 48
    only = sys.argv[2] if len(sys.argv) > 2 else None
    parts = build.build()
    sc = bpy.context.scene
    sc.cycles.samples = samples
    sc.render.resolution_x, sc.render.resolution_y = 540, 760
    files = []
    for name, face, az, spec in POSES:
        if only and only.lower() not in name.lower():
            continue
        build.pose(parts['arm'], spec, face)
        parts['root'].rotation_euler.z = -math.radians(az)
        build.look(parts['cam'], (0, 0, .52 + spec.get('lift', 0) * .6), 4.3, 0, 7)
        f = os.path.join(OUT, f'pose_{name.lower().replace(" ", "-")}.png')
        sc.render.filepath = f
        bpy.ops.render.render(write_still=True)
        files.append((name, f))
    ims = [(n, Image.open(f).convert('RGB')) for n, f in files]
    cols = 2
    W, H = ims[0][1].size
    rows = (len(ims) + cols - 1) // cols
    sheet = Image.new('RGB', (W * cols, H * rows), (244, 246, 250))
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
    except OSError:
        font = ImageFont.load_default()
    for i, (n, im) in enumerate(ims):
        x, y = (i % cols) * W, (i // cols) * H
        sheet.paste(im, (x, y))
        ImageDraw.Draw(sheet).text((x + 22, y + 18), n, fill=(37, 46, 109), font=font)
    sheet.save(os.path.join(OUT, 'poses.png'))
    print('done')
