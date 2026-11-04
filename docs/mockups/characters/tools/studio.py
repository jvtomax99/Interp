# Blender studio render of a figure: soft key, fill and rim area lights, clay-like matte skin with a little
# subsurface glow, transparent background. python3 studio.py in.glb out.png [view: front|three] [look: standard|agx]
import sys, math, bpy
from mathutils import Vector
glb, out = sys.argv[1], sys.argv[2]
view = sys.argv[3] if len(sys.argv) > 3 else 'front'; look = sys.argv[4] if len(sys.argv) > 4 else 'agx'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
# Tripo's figures face +X in glTF, which the importer keeps as +X; turn them to face -Y (Blender's front)
root = [o for o in bpy.context.scene.objects if o.parent is None]
for o in root:
    o.rotation_mode = 'XYZ'; o.rotation_euler[2] += math.radians(-90 if view == 'front' else -90 + 24)
bpy.context.view_layer.update()
pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))); hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
c = (lo + hi) / 2; h = hi.z - lo.z
for o in objs:
    for m in o.data.materials:
        if not m or not m.use_nodes: continue
        b = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if not b: continue
        for l in list(b.inputs['Roughness'].links): m.node_tree.links.remove(l)
        for l in list(b.inputs['Metallic'].links): m.node_tree.links.remove(l)
        b.inputs['Roughness'].default_value = 0.62; b.inputs['Metallic'].default_value = 0.0
        b.inputs['Subsurface Weight'].default_value = 0.12; b.inputs['Subsurface Radius'].default_value = (1.0, 0.45, 0.25)
        b.inputs['Subsurface Scale'].default_value = 0.02 * h
        if 'Specular IOR Level' in b.inputs: b.inputs['Specular IOR Level'].default_value = 0.35
s = bpy.context.scene
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); s.collection.objects.link(cam); s.camera = cam
cam.data.lens = 120; d = h * 4.6
cam.location = (c.x, c.y - d, c.z + h * 0.05); cam.rotation_euler = (math.radians(90 - math.degrees(math.atan2(h * 0.05, d))), 0, 0)
def area(name, loc, power, size, color=(1, 1, 1)):
    L = bpy.data.lights.new(name, 'AREA'); L.energy = power; L.size = size; L.color = color
    o = bpy.data.objects.new(name, L); s.collection.objects.link(o); o.location = loc
    dvec = (c - Vector(loc)); o.rotation_euler = dvec.to_track_quat('-Z', 'Y').to_euler()
area('key', (c.x - h * 0.9, c.y - h * 2.2, c.z + h * 1.4), 90 * h * h, h * 1.6, (1.0, 0.97, 0.93))
area('fill', (c.x + h * 1.6, c.y - h * 1.6, c.z + h * 0.3), 35 * h * h, h * 2.0, (0.94, 0.94, 1.0))
area('rim', (c.x + h * 0.3, c.y + h * 1.8, c.z + h * 1.2), 60 * h * h, h * 1.0)
w = bpy.data.worlds.new('w'); s.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.93, 0.91, 0.97, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.3
s.render.engine = 'CYCLES'; s.cycles.device = 'CPU'; s.cycles.samples = 96; s.cycles.use_denoising = True
s.render.film_transparent = True; s.render.resolution_x = 600; s.render.resolution_y = 1200
s.view_settings.view_transform = 'AgX' if look == 'agx' else 'Standard'
if look == 'agx': s.view_settings.look = 'AgX - Medium High Contrast'
s.render.filepath = out; bpy.ops.render.render(write_still=True); print('rendered', out)
