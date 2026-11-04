import bpy,sys
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=sys.argv[-1])
for o in bpy.context.scene.objects:
    print(o.name,o.type,o.parent.name if o.parent else None, tuple(round(x,3) for x in o.dimensions))
    if o.type=='MESH':
        print(' verts',len(o.data.vertices),'polys',len(o.data.polygons),'uv',[u.name for u in o.data.uv_layers])
        for m in o.data.materials:
            for n in m.node_tree.nodes:
                if n.type=='TEX_IMAGE': print('  tex',n.image.name,n.image.size[:], [l.to_socket.name for l in n.outputs[0].links])
