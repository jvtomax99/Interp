import sys, math, bpy
from mathutils import Vector
glb, out = sys.argv[1], sys.argv[2]
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=glb)
objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']; root = [o for o in bpy.context.scene.objects if o.parent is None]
for o in root: o.rotation_mode = 'XYZ'; o.rotation_euler[2] += math.radians(-90)
bpy.context.view_layer.update()
pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))); hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
c = (lo + hi) / 2; h = hi.z - lo.z
s = bpy.context.scene; s.render.resolution_x = 600; s.render.resolution_y = 1200
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); s.collection.objects.link(cam); s.camera = cam
cam.data.lens = 120; d = h * 4.6; cam.location = (c.x, c.y - d, c.z + h * 0.05); cam.rotation_euler = (math.radians(90 - math.degrees(math.atan2(h * 0.05, d))), 0, 0)
for o in objs:
    m = bpy.data.materials.new('uv'); m.use_nodes = True; nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    uvn = nt.nodes.new('ShaderNodeUVMap'); em = nt.nodes.new('ShaderNodeEmission'); outn = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(uvn.outputs['UV'], em.inputs['Color']); nt.links.new(em.outputs['Emission'], outn.inputs['Surface'])
    o.data.materials.clear(); o.data.materials.append(m)
s.render.engine = 'CYCLES'; s.cycles.samples = 1; s.cycles.use_denoising = False; s.render.film_transparent = True
s.view_settings.view_transform = 'Standard'; s.render.image_settings.file_format = 'OPEN_EXR'; s.render.image_settings.color_depth = '32'
s.render.filepath = out; bpy.ops.render.render(write_still=True); print('uv map', out)
