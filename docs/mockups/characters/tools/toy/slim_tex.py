# Phone-size copy of a figure GLB: fewer triangles, textures at 1024 px WebP, optional new base colour.
# python3 slim_tex.py -- in.glb out.glb ratio [basetex.png]
import bpy, sys, os
a = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=a[0])
o = [x for x in bpy.context.scene.objects if x.type == 'MESH'][0]
if len(a) > 3:
    for m in o.data.materials:
        b = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        n = b.inputs['Base Color'].links[0].from_node; n.image = bpy.data.images.load(os.path.abspath(a[3]))
KEEP = os.environ.get('KEEPBASE')     # keep the base colour at full size: shrinking it opens seams on the face
base = set()
for m in o.data.materials:
    b = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if b and b.inputs['Base Color'].links: base.add(b.inputs['Base Color'].links[0].from_node.image.name)
for im in bpy.data.images:
    if im.size[0] > 1024 and not (KEEP and im.name in base): im.scale(1024, 1024)
bpy.context.view_layer.objects.active = o
md = o.modifiers.new('d', 'DECIMATE'); md.ratio = float(a[2]); bpy.ops.object.modifier_apply(modifier='d')
print('polys', len(o.data.polygons))
bpy.ops.export_scene.gltf(filepath=os.path.abspath(a[1]), export_format='GLB', export_image_format='WEBP')
