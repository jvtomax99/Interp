# Bake each texel's 3D position and normal (figure facing -Y) into float images, so the colour map can be cleaned by place.
import bpy, sys, math, numpy as np
glb, out = sys.argv[-2], sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
o = [x for x in bpy.context.scene.objects if x.type == 'MESH'][0]
o.rotation_mode = 'XYZ'; o.rotation_euler[2] += math.radians(-90)
bpy.context.view_layer.objects.active = o; o.select_set(True)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
s = bpy.context.scene; s.render.engine = 'CYCLES'; s.cycles.device = 'CPU'; s.cycles.samples = 1
N = 2048
m = o.data.materials[0]; nt = m.node_tree
for n in list(nt.nodes):
    if n.type != 'OUTPUT_MATERIAL': nt.nodes.remove(n)
outn = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
geo = nt.nodes.new('ShaderNodeNewGeometry'); em = nt.nodes.new('ShaderNodeEmission'); nt.links.new(em.outputs[0], outn.inputs[0])
tex = nt.nodes.new('ShaderNodeTexImage'); nt.nodes.active = tex
for name, sock in (('pos', 'Position'), ('nrm', 'Normal')):
    img = bpy.data.images.new(name, N, N, float_buffer=True); img.colorspace_settings.name = 'Non-Color'; tex.image = img
    nt.links.new(geo.outputs[sock], em.inputs[0])
    s.render.bake.margin = 4
    bpy.ops.object.bake(type='EMIT')
    a = np.array(img.pixels[:], dtype=np.float32).reshape(N, N, 4)[::-1, :, :3]   # top row first, like PIL
    np.save(f'{out}/{name}.npy', a)
    print('baked', name, a.min((0, 1)), a.max((0, 1)))
print('dims', tuple(o.dimensions), 'bbox z', min(v.co.z for v in o.data.vertices), max(v.co.z for v in o.data.vertices))
