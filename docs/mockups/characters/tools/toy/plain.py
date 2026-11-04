# Render any figure GLB as it comes (its own paint), in the studio light. python3 plain.py -- in.glb out.png front|three|face [rotdeg]
import bpy, sys, math, os
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]; glb, out, view = a[0], os.path.abspath(a[1]), a[2]; rot = float(a[3]) if len(a) > 3 else 0
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=glb)
s = bpy.context.scene; objs = [o for o in s.objects if o.type == 'MESH']
piv = bpy.data.objects.new('piv', None); s.collection.objects.link(piv)
for o in s.objects:
    if o.parent is None and o is not piv: o.parent = piv
piv.rotation_euler[2] = math.radians(rot + (24 if view == 'three' else 0)); bpy.context.view_layer.update()
SKIN = os.environ.get('SKIN')    # "r,g,b" multiplier on the base colour (warm the skin) -- applied to whole texture via a mix
for o in objs:
    for m in o.data.materials:
        b = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if b and os.environ.get('BASETEX') and b.inputs['Base Color'].links:
            n = b.inputs['Base Color'].links[0].from_node
            if n.type == 'TEX_IMAGE': n.image = bpy.data.images.load(os.environ['BASETEX'])
        if b and os.environ.get('NONORMAL'):
            for l in list(b.inputs['Normal'].links): m.node_tree.links.remove(l)
pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))); hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
c = (lo + hi) / 2; h = hi.z - lo.z
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); s.collection.objects.link(cam); s.camera = cam
cam.data.lens = 120; dist = h * 4.6
if view == 'face':
    cam.data.lens = 120 * 3.2; cam.location = (c.x, c.y - dist, lo.z + h * float(os.environ.get('FACEF', '0.68'))); cam.rotation_euler = (math.radians(90), 0, 0)
else:
    cam.location = (c.x, c.y - dist, c.z + h * 0.05); cam.rotation_euler = (math.radians(90 - math.degrees(math.atan2(h * 0.05, dist))), 0, 0)
def area(name, loc, power, size, color=(1, 1, 1)):
    L = bpy.data.lights.new(name, 'AREA'); L.energy = power; L.size = size; L.color = color
    ob = bpy.data.objects.new(name, L); s.collection.objects.link(ob); ob.location = loc; ob.rotation_euler = (c - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
area('key', (c.x - h * 0.9, c.y - h * 2.2, c.z + h * 1.4), 55 * h * h, h * 3, (1.0, 0.98, 0.96))
area('fill', (c.x + h * 1.6, c.y - h * 1.6, c.z + h * 0.3), 28 * h * h, h * 2.0, (0.94, 0.94, 1.0))
area('rim', (c.x + h * 0.3, c.y + h * 1.8, c.z + h * 1.2), 50 * h * h, h * 1.0)
area('front', (c.x, c.y - h * 3.5, c.z + h * 0.2), 40 * h * h, h * 2.4, (1.0, 0.98, 0.97))
area('under', (c.x, c.y - h * 1.6, c.z - h * 0.2), 12 * h * h, h * 1.2, (1.0, 0.97, 0.95))
w = bpy.data.worlds.new('w'); s.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.98, 0.96, 0.95, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.35
s.render.resolution_x, s.render.resolution_y = (800, 800) if view == 'face' else (600, 1200)
s.render.engine = 'CYCLES'; s.cycles.device = 'CPU'; s.cycles.samples = int(os.environ.get('SAMPLES', '48')); s.cycles.use_denoising = True
s.render.film_transparent = True; s.view_settings.view_transform = 'Standard'; s.view_settings.exposure = float(os.environ.get('EXPO', '0'))
s.render.filepath = out; bpy.ops.render.render(write_still=True); print('rendered', out, 'h', round(h, 3))
