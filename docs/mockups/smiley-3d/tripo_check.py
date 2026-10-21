"""Step 3 of the Tripo plan: open Jose's model as it came and report it.

  python3 tripo_check.py in/tripo-hands-down.glb
"""
import sys, os
import bpy
from mathutils import Vector

path = sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=path)
lo, hi = Vector((1e9,) * 3), Vector((-1e9,) * 3)
for o in bpy.data.objects:
    print('OBJ', o.type, o.name, 'parent', o.parent.name if o.parent else '-', 'scale', tuple(round(s, 3) for s in o.scale))
    if o.type == 'MESH':
        me = o.data
        print('   verts', len(me.vertices), 'faces', len(me.polygons), 'uv', [u.name for u in me.uv_layers],
              'mats', [m.name for m in me.materials], 'vcols', [a.name for a in me.color_attributes],
              'shapekeys', bool(me.shape_keys), 'groups', len(o.vertex_groups))
        for v in me.vertices:
            w = o.matrix_world @ v.co
            lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
for m in bpy.data.materials:
    if m.use_nodes:
        b = m.node_tree.nodes.get('Principled BSDF')
        imgs = [n.image.name + f' {n.image.size[0]}x{n.image.size[1]}' for n in m.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image]
        print('MAT', m.name, imgs, 'rough', round(b.inputs['Roughness'].default_value, 2) if b else '-',
              'metal', round(b.inputs['Metallic'].default_value, 2) if b else '-')
        if b:
            for k in ('Base Color', 'Roughness', 'Metallic', 'Normal'):
                l = b.inputs[k].links
                print('   ', k, '<-', l[0].from_node.type + ':' + (l[0].from_node.image.name if getattr(l[0].from_node, 'image', None) else l[0].from_node.name) if l else 'value')
print('BOUNDS', tuple(round(x, 3) for x in lo), tuple(round(x, 3) for x in hi), 'size', tuple(round(h - l, 3) for h, l in zip(hi, lo)))
print('ANIMS', [a.name for a in bpy.data.actions], 'ARMATURES', [o.name for o in bpy.data.objects if o.type == 'ARMATURE'])
