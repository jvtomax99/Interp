# The campus as a toy diorama, rendered in Blender (Jose, 2026-10-28: "can this visual be achieved?", the train-diorama
# video, his pick "Blender test render"). The live page's scene is exported to GLB (export.cjs, the built page in
# headless Chromium), then this script, run with Blender's Python module (bpy 5.0.1, Python 3.11), gives it the video's
# look: satin toy plastic with softly rounded edges (Cycles' Bevel node), a warm sun with soft shadows, a bright sky
# for the bounce light, AgX colour, real depth of field, and renders each view with Cycles on the CPU.
#   python3.11 toy_render.py campus.glb outdir [w h samples]
import bpy, math, sys, os
from mathutils import Vector
args = sys.argv[1:]
GLB, OUT = args[0], args[1]
W, H, SAMPLES = (int(args[2]), int(args[3]), int(args[4])) if len(args) > 4 else (900, 1200, 64)
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
sc = bpy.context.scene
# three.js (x, y up, z) -> Blender (x, -z, y up)
B = lambda x, y, z: Vector((x, -z, y))
# the page's floating clouds don't belong on a model on a table: drop anything whose bottom is high above the board
# (the clouds are the only things in their peach colour: those objects go)
def base(o):
    m = o.data.materials[0] if o.type == 'MESH' and o.data.materials else None
    P = m and m.node_tree and next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    return tuple(round(c, 2) for c in P.inputs['Base Color'].default_value[:3]) if P else None
for o in list(sc.objects):
    if base(o) == (1.0, 0.69, 0.62) and min((o.matrix_world @ Vector(c)).z for c in o.bound_box) > 10: bpy.data.objects.remove(o)

# ---- materials: toy plastic. Glass stays glassy; everything else gets a satin finish, a light clear coat and rounded edges
for m in bpy.data.materials:
    if not m.use_nodes: continue
    nt = m.node_tree; P = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if not P: continue
    metal = P.inputs['Metallic'].default_value; rough = P.inputs['Roughness'].default_value
    glass = metal > 0.3 and rough < 0.2
    if not glass:
        P.inputs['Metallic'].default_value = 0.0
        P.inputs['Roughness'].default_value = max(0.32, min(rough, 0.5))
        P.inputs['Coat Weight'].default_value = 0.25; P.inputs['Coat Roughness'].default_value = 0.2
    bev = nt.nodes.new('ShaderNodeBevel'); bev.inputs['Radius'].default_value = 0.035; bev.samples = 6
    nt.links.new(bev.outputs['Normal'], P.inputs['Normal'])

# ---- light: a warm sun, low and from the front left, soft-edged shadows; a bright, slightly blue sky for the bounce
sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sc.collection.objects.link(sun)
sun.data.energy = 5.6; sun.data.color = (1.0, 0.9, 0.78); sun.data.angle = math.radians(6)
sun.rotation_euler = (math.radians(52), 0, math.radians(-38))
world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
bg = world.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (0.62, 0.74, 0.95, 1); bg.inputs['Strength'].default_value = 1.05

# ---- render: Cycles on the CPU, denoised, AgX with a punchier look, transparent film (the dark studio backdrop is
# composited after, so the sky still lights the scene)
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = True
sc.cycles.max_bounces = 6; sc.render.film_transparent = True
sc.render.resolution_x, sc.render.resolution_y = W, H; sc.render.resolution_percentage = 100
sc.view_settings.view_transform = 'AgX'; sc.view_settings.exposure = 0.3
try: sc.view_settings.look = 'AgX - Punchy'
except Exception:
    try: sc.view_settings.look = 'Punchy'
    except Exception: pass

VIEWS = {   # name: camera, target (the live page's own numbers), field of view (vertical, degrees), f-stop
  'front':  ((-16, 22, 28), (2, 0, -6), 30, 0.35),
  'whole':  ((-55, 70, 60), (-1, 0, -30), 30, 0.6),
  'court':  ((-40, 16, -10), (-19, 1, -29), 30, 0.25),
}
want = os.environ.get('VIEWS', 'front,whole,court').split(',')
for name in want:
    (cx, cy, cz), (tx, ty, tz), fov, fstop = VIEWS[name]
    cd = bpy.data.cameras.new(name); cam = bpy.data.objects.new(name, cd); sc.collection.objects.link(cam)
    cam.location = B(cx, cy, cz); d = B(tx, ty, tz) - cam.location
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    cd.sensor_fit = 'VERTICAL'; cd.angle = math.radians(fov)
    cd.dof.use_dof = True; cd.dof.focus_distance = d.length; cd.dof.aperture_fstop = fstop
    sc.camera = cam; sc.render.filepath = os.path.join(OUT, f'{name}.png')
    bpy.ops.render.render(write_still=True); print('rendered', name, flush=True)
