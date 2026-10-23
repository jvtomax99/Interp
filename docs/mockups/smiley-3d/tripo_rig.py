"""His skeleton on the kept Tripo model (plan-rig.png step 1): 36 bones at the
joints measured off the mesh, weights by Blender's bone heat on a lighter copy
(the model is one fused surface of 900k faces, too heavy for it), copied onto
the full model; eyes, lids and shines ride the head bone.

  python3 tripo_rig.py      -> in/tripo-rig.blend
"""
import os, sys, math
import bpy
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tripo_lib as T

HERE = T.HERE
# joints (x, y, z) in metres, he is 1 m tall; his left is +x, front is -y
B = {'root': ((0, 0, 0), (0, 0, .08), None),
     'hips': ((0, -.005, .25), (0, -.005, .33), 'root'),
     'spine': ((0, -.005, .33), (0, -.005, .43), 'hips'),
     'chest': ((0, -.005, .43), (0, -.005, .53), 'spine'),
     'neck': ((0, -.005, .53), (0, -.005, .61), 'chest'),
     'head': ((0, -.005, .61), (0, -.005, .95), 'neck')}
for S, sx in (('L', 1), ('R', -1)):
    B.update({
        f'shoulder.{S}': ((.035 * sx, -.005, .525), (.135 * sx, 0, .525), 'chest'),
        f'upper_arm.{S}': ((.135 * sx, 0, .525), (.178 * sx, 0, .42), f'shoulder.{S}'),
        f'forearm.{S}': ((.178 * sx, 0, .42), (.193 * sx, 0, .31), f'upper_arm.{S}'),
        f'hand.{S}': ((.193 * sx, 0, .31), (.196 * sx, 0, .275), f'forearm.{S}'),
        f'thigh.{S}': ((.064 * sx, -.01, .25), (.067 * sx, -.012, .14), 'hips'),
        f'shin.{S}': ((.067 * sx, -.012, .14), (.07 * sx, -.005, .05), f'thigh.{S}'),
        f'foot.{S}': ((.07 * sx, -.005, .05), (.074 * sx, -.11, .015), f'shin.{S}'),
    })
    # palms face his body, fingers hang down, spread front to back; the thumb in front
    for k, y in enumerate((-.013, .002, .016)):
        B[f'f{k}a.{S}'] = ((.197 * sx, y, .275), (.199 * sx, y, .255), f'hand.{S}')
        B[f'f{k}b.{S}'] = ((.199 * sx, y, .255), (.2 * sx, y, .237), f'f{k}a.{S}')
    B[f'tha.{S}'] = ((.192 * sx, -.022, .292), (.194 * sx, -.032, .274), f'hand.{S}')
    B[f'thb.{S}'] = ((.194 * sx, -.032, .274), (.195 * sx, -.036, .258), f'tha.{S}')


def ctx(active, selected):
    return bpy.context.temp_override(active_object=active, object=active, selected_objects=selected,
                                     selected_editable_objects=selected)


def build_armature():
    ad = bpy.data.armatures.new('Rig'); arm = bpy.data.objects.new('Rig', ad)
    bpy.context.scene.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')
    for n, (h, t, p) in B.items():
        eb = ad.edit_bones.new(n); eb.head, eb.tail = h, t
    for n, (h, t, p) in B.items():
        if p:
            eb = ad.edit_bones[n]; eb.parent = ad.edit_bones[p]
            eb.use_connect = (Vector(B[p][1]) - Vector(h)).length < 1e-6
    ad.edit_bones['root'].use_deform = False
    bpy.ops.object.mode_set(mode='OBJECT')
    return arm


if __name__ == '__main__':
    bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'in', 'tripo-eyes.blend'))
    sc = bpy.context.scene
    body = [o for o in sc.objects if o.type == 'MESH' and o.name.startswith('Mesh')][0]
    arm = build_armature()
    # a light copy for the bone heat
    proxy = body.copy(); proxy.data = body.data.copy(); proxy.name = 'Proxy'; sc.collection.objects.link(proxy)
    # the model is split along its texture seams; bone heat needs one closed skin
    import bmesh
    bm = bmesh.new(); bm.from_mesh(proxy.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=2e-5)
    bm.to_mesh(proxy.data); bm.free()
    print('proxy welded verts', len(proxy.data.vertices))
    dec = proxy.modifiers.new('Dec', 'DECIMATE'); dec.ratio = .06
    with ctx(proxy, [proxy]):
        bpy.ops.object.modifier_apply(modifier='Dec')
    print('proxy faces', len(proxy.data.polygons))
    for o in sc.objects:
        o.select_set(False)
    proxy.select_set(True); arm.select_set(True); bpy.context.view_layer.objects.active = arm
    with ctx(arm, [proxy, arm]):
        bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    pw = sum(1 for v in proxy.data.vertices if any(g.weight > .01 for g in v.groups))
    print('proxy groups', len(proxy.vertex_groups), 'weighted verts', pw, 'of', len(proxy.data.vertices))
    # copy the weights onto the full model
    for g in proxy.vertex_groups:
        body.vertex_groups.new(name=g.name)
    dt = body.modifiers.new('Weights', 'DATA_TRANSFER'); dt.object = proxy
    dt.use_vert_data = True; dt.data_types_verts = {'VGROUP_WEIGHTS'}; dt.vert_mapping = 'POLYINTERP_NEAREST'
    dt.layers_vgroup_select_src = 'ALL'; dt.layers_vgroup_select_dst = 'NAME'
    with ctx(body, [body]):
        bpy.ops.object.modifier_apply(modifier='Weights')
    bpy.data.objects.remove(proxy)
    body.parent = arm
    am = body.modifiers.new('Armature', 'ARMATURE'); am.object = arm
    # eyes, lids and shines follow the head bone through an armature modifier
    # (bone parenting via matrix_world reads a stale parent matrix and shifts them)
    for o in list(sc.objects):
        if o.name.split('.')[0] in ('Eye', 'Lid', 'Glint', 'Liner'):
            o.parent = arm                       # the rig sits at the origin: no shift
            g = o.vertex_groups.new(name='head'); g.add(range(len(o.data.vertices)), 1.0, 'REPLACE')
            m = o.modifiers.new('Armature', 'ARMATURE'); m.object = arm
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'in', 'tripo-rig.blend'))
    print('done', len(B), 'bones')
