import bpy, sys
a = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=a[0])
o = [x for x in bpy.context.scene.objects if x.type == 'MESH'][0]
bpy.context.view_layer.objects.active = o
md = o.modifiers.new('d', 'DECIMATE'); md.ratio = float(a[2]); bpy.ops.object.modifier_apply(modifier='d')
print('polys', len(o.data.polygons))
bpy.ops.export_scene.gltf(filepath=a[1], export_format='GLB', use_selection=False)
