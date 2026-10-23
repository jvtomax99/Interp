"""He turns 360 degrees, phone size (540 x 960), for checking every side.

  python3 turntable.py [samples] [frames]  -> out/turn/####.png, out/turntable.mp4
Frames already rendered are kept (re-run to resume).
"""
import os, sys, math, subprocess
import bpy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build

HERE = os.path.dirname(os.path.abspath(__file__))
DIR = os.path.join(HERE, 'out', 'turn'); os.makedirs(DIR, exist_ok=True)
samples = int(sys.argv[1]) if len(sys.argv) > 1 else 24
frames = int(sys.argv[2]) if len(sys.argv) > 2 else 96
parts = build.build()
sc = bpy.context.scene
sc.cycles.samples = samples
sc.render.resolution_x, sc.render.resolution_y = 540, 960
build.pose(parts['arm'], {'head': (2, 0, 0), 'upper_arm.L': (0, -8, 0), 'upper_arm.R': (0, 8, 0),
                          'forearm.L': (-12, 0, 0), 'forearm.R': (-12, 0, 0)}, 'rest')
build.look(parts['cam'], (0, 0, .5), 4.6, 0, 6)
for i in range(frames):
    f = os.path.join(DIR, f'{i:04d}.png')
    if os.path.exists(f):
        continue
    parts['root'].rotation_euler.z = 2 * math.pi * i / frames
    sc.render.filepath = f
    bpy.ops.render.render(write_still=True)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '24', '-stream_loop', '1', '-i', os.path.join(DIR, '%04d.png'),
                '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart',
                os.path.join(HERE, 'out', 'turntable.mp4')], check=True)
print('done')
