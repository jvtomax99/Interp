"""Jose's Tripo model as it came: 8 views (out/tripo-views.png) and a 360-degree
turn (out/tripo-turn.mp4). Its own materials untouched; our studio light.

  python3 tripo_turn.py in/tripo-hands-down.glb [frames]
"""
import os, sys, math, subprocess
import bpy
from mathutils import Vector
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build

HERE = os.path.dirname(os.path.abspath(__file__))
glb = sys.argv[-2] if sys.argv[-1].isdigit() else sys.argv[-1]
frames = int(sys.argv[-1]) if sys.argv[-1].isdigit() else 0
bpy.ops.wm.read_factory_settings(use_empty=True)
build.STYLE_NOW = 'film'
bpy.ops.import_scene.gltf(filepath=os.path.join(HERE, glb) if not os.path.isabs(glb) else glb)
mesh = [o for o in bpy.data.objects if o.type == 'MESH'][0]
root = bpy.data.objects.new('Tripo', None); bpy.context.scene.collection.objects.link(root)
mesh.parent = root
bpy.context.view_layer.update()
zs = [(mesh.matrix_world @ v.co).z for v in mesh.data.vertices]
h = max(zs) - min(zs)
k = 1.0 / h                                   # scale him to 1 m, feet on the floor
root.scale = (k, k, k)
root.location.z = -min(zs) * k
cam = build.studio()
sc = bpy.context.scene
sc.cycles.samples = 24
sc.render.resolution_x, sc.render.resolution_y = 540, 960
build.look(cam, (0, 0, .5), 4.6, 0, 6)
out = os.path.join(HERE, 'out')
views = []
for i in range(8):
    root.rotation_euler.z = 2 * math.pi * i / 8
    f = os.path.join(out, f'tripo_v{i}.png'); sc.render.filepath = f
    bpy.ops.render.render(write_still=True); views.append(Image.open(f).resize((270, 480)))
sheet = Image.new('RGB', (270 * 4, 480 * 2))
for i, v in enumerate(views):
    sheet.paste(v, ((i % 4) * 270, (i // 4) * 480))
sheet.save(os.path.join(out, 'tripo-views.png'))
print('views done')
if frames:
    d = os.path.join(out, 'tripo_turn'); os.makedirs(d, exist_ok=True)
    sc.cycles.samples = 16
    for i in range(frames):
        f = os.path.join(d, f'{i:04d}.png')
        if os.path.exists(f):
            continue
        root.rotation_euler.z = 2 * math.pi * i / frames
        sc.render.filepath = f; bpy.ops.render.render(write_still=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '24', '-stream_loop', '1', '-i', os.path.join(d, '%04d.png'),
                    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', os.path.join(out, 'tripo-turn.mp4')], check=True)
    print('turn done')
