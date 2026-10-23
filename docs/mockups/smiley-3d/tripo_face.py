"""His face rig on the kept Tripo model (out/plan-face.png, Jose's picks: brows
A, mouth route 1, mouth test approved 2026-10-22). Shape keys on his own
surface, nothing added to him:

  BrowUp.L/R, BrowDown.L/R, BrowInUp.L/R, BrowInDown.L/R   brows (A)
  CheekUp.L/R                                              cheeks
  Mouth.Close.25/.50/.75/1                                 the closed mouth, sampled (it isn't a straight line:
                                                           the inside tucks only late)
  Mouth.<shape>                                            the other mouth shapes (tripo_mouths.py)

  python3 tripo_face.py      -> in/tripo-face.blend

set_face(**controls) poses the face; the 3D lids follow a lowered brow.

First the model is welded along its texture seams and its fixed normals
dropped: Tripo split the surface at every seam, and fixed normals don't
follow moved skin (each seam showed as a fold). Welded, Blender's own smooth
normals follow every shape key and bone, and match the old ones at rest.
"""
import os, sys, math
import numpy as np
import bpy, bmesh
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tripo_lib as T
import build

HERE = T.HERE
L, R = 'L', 'R'          # his left (+x) and right
BROWS = {   # key: (lift, tilt) in the app's units (DR_BROWS), the full-strength move
    'BrowUp': (4.2, 0), 'BrowDown': (-1.2, 0), 'BrowInUp': (0, 15), 'BrowInDown': (0, -12)}
CLOSE_STEPS = (.25, .5, .75, 1)
# the upper lid at rest just touches the top of the iris (Jose's pick B, 2026-10-22):
# white above the iris reads startled
REST_LID = .32   # .26 before the lid's hidden back half was fixed (it had been the edge you saw)


def weld(ob):
    me = ob.data
    bm = bmesh.new(); bm.from_mesh(me)
    n0 = len(bm.verts)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=2e-6)
    n1 = len(bm.verts)
    bm.to_mesh(me); bm.free()
    if me.has_custom_normals:
        with bpy.context.temp_override(object=ob, active_object=ob, selected_objects=[ob]):
            bpy.ops.mesh.customdata_custom_splitnormals_clear()
    me.shade_smooth()
    me.update()
    print('welded', n0, '->', n1, 'vertices')


def coords(ob):
    n = len(ob.data.vertices)
    co = np.empty(n * 3); ob.data.vertices.foreach_get('co', co)
    return co.reshape(-1, 3)


def add_key(ob, name, co):
    kb = ob.shape_key_add(name=name, from_mix=False)
    kb.data.foreach_set('co', co.ravel())
    kb.value = 0                       # a new shape key comes in at full strength
    kb.slider_min, kb.slider_max = 0, 1
    return kb


def set_face(ob=None, brow=None, cheek=(0, 0), close=0, mouth=None, lids=True, lid=None, lower=(0, 0), happy=0, gaze=None):
    """brow: per side (his right, his left) a (lift, tilt) in the app's units
    (DR_BROWS: lift up positive, tilt positive = inner end up); cheek: per side
    0..1; close: 0 (his sculpted smile) .. 1 (closed); mouth: {shape: 0..2} (past
    1 for cartoon-strong, Jose 2026-10-22: "push them further"); lid: per side
    0 (open) .. 1 (shut), overriding the lid that follows a lowered brow; lower:
    per side 0 (rest) .. 1 (raised: a squint, the laugh), the lower lids of tripo_eyes2.py."""
    ob = ob or bpy.data.objects['Mesh_0']
    kb = ob.data.shape_keys.key_blocks
    for k in kb[1:]:
        k.slider_max = 2
        k.value = 0
    lid_down = [0, 0]
    for i, s in enumerate((R, L)):
        lift, tilt = (brow or ((0, 0), (0, 0)))[i]
        kb[f'BrowUp.{s}'].value = max(0, lift) / BROWS['BrowUp'][0]
        kb[f'BrowDown.{s}'].value = max(0, -lift) / -BROWS['BrowDown'][0]
        kb[f'BrowInUp.{s}'].value = max(0, tilt) / BROWS['BrowInUp'][1]
        kb[f'BrowInDown.{s}'].value = max(0, -tilt) / -BROWS['BrowInDown'][1]
        kb[f'CheekUp.{s}'].value = cheek[i]
        # a brow that comes down brings the top of that eye down a little with it:
        # his brow sits only 6-10 mm above the eye (lids past .2 hide the liner)
        lid_down[i] = min(.18, .1 * max(0, -lift) + .01 * max(0, -tilt))
    # the closed mouth from its samples, straight between them
    pts = (0,) + CLOSE_STEPS
    for j, c in enumerate(CLOSE_STEPS, 1):
        kb[f'Mouth.Close{c:g}'].value = float(np.interp(close, pts, [float(k == j) for k in range(len(pts))]))
    for k, v in (mouth or {}).items():
        kb[k if k.startswith('AU.') else 'Mouth.' + k].value = v      # AU.*: the muscle blocks (tripo_muscles.py)
    # a key on the tooth band named like a mouth key follows it (O2: the band's ends
    # gather in with the mouth's corners, tripo_oh.py)
    te = bpy.data.objects.get('Teeth')
    if te is not None and te.data.shape_keys is not None:
        for tk in te.data.shape_keys.key_blocks[1:]:
            tk.value = kb['Mouth.' + tk.name].value if 'Mouth.' + tk.name in kb else 0
    if gaze is not None:
        # the eyes look there (the iris in the shader, the glass dome with it); the upper lid
        # follows an upward or downward look by about half the iris's travel, the lower a little
        from tripo_eyes import set_gaze as _ball_gaze
        for s in (R, L):
            e = bpy.data.objects['Eye.' + s]
            _ball_gaze(e, gaze[0], gaze[1])
            if 'Cornea.' + s in bpy.data.objects:
                import tripo_eyes2; tripo_eyes2.set_gaze(e, gaze[0], gaze[1])
    if lids and 'Lid.U1.L' in kb:
        # the lids as his own skin (tripo_lids.py): rest = 0 (the edge on the iris top),
        # the old shells' scale mapped onto it (their .32 was rest; 0 wide open; 1 shut)
        from tripo_lids import set_lids
        for i, s in enumerate((R, L)):
            if happy:
                up, lo = 1., happy                 # the upper comes down to meet the raised lower lid (set_lids clamps it)
            else:
                old = lid[i] if lid else REST_LID + lid_down[i]
                up = (old - REST_LID) / (1 - REST_LID) if old >= REST_LID else (old - REST_LID) / REST_LID
                lo = lower[i]
                if gaze is not None:
                    up -= .09 * gaze[1]                   # looking up: the lid rises (wide); down: it drops
                    lo = max(0., lo + .06 * gaze[1])
            set_lids(ob, s, up, lo)
    elif lids:
        from tripo_eyes import set_blink
        for i, s in enumerate((R, L)):
            lo = bpy.data.objects['Lid.' + s]
            set_blink(lo, (1 - happy) * (lid[i] if lid else REST_LID + lid_down[i]))
            if 'Happy' in lo.data.shape_keys.key_blocks:      # happy shut eyes (tripo_eyes2.py)
                lo.data.shape_keys.key_blocks['Happy'].value = happy
                import tripo_eyes2
                k = 1 - (1 - tripo_eyes2.HAPPY_EYE_DEPTH) * happy      # the eyeball eases back under the shut lid
                for nm in ('Eye.', 'Cornea.'):
                    if nm + s in bpy.data.objects:
                        bpy.data.objects[nm + s].scale[1] = k
            if 'Cornea.' + s in bpy.data.objects:      # the dome's real shine replaces the painted one (tripo_eyes2.py)
                bpy.data.objects['Glint.' + s].hide_render = True
            if 'LidLow.' + s in bpy.data.objects:
                import tripo_eyes2; tripo_eyes2.set_lower(s, lower[i])

if __name__ == '__main__':
    from tripo_faceplan import Brow, deform_skin, cheeks, POSES
    from tripo_mouthtest import opening, close_mouth, teeth_vertices
    bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'in', 'tripo-rig.blend'))
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
    ob = bpy.data.objects['Mesh_0']
    weld(ob)
    # the eyelids as his own skin (tripo_lids.py, Jose's go 2026-10-23): cut, ring, bridge
    from tripo_lids import cut_and_ring, lid_keys, lash_material
    rings = cut_and_ring(ob, {'L': bpy.data.objects['Eye.L'], 'R': bpy.data.objects['Eye.R']})
    for n in ('Lid.L', 'Lid.R', 'Glint.L', 'Glint.R', 'Liner.L', 'Liner.R'):     # the old shells, shines and painted-style liner tubes
        if n in bpy.data.objects:
            bpy.data.objects.remove(bpy.data.objects[n])
    lash_material(ob)
    co0 = coords(ob)
    front = (co0[:, 1] < -.08) & (co0[:, 2] > .6)
    img, px = T.texture(ob)
    cen, tuv = T.face_arrays(ob)
    dark = (T.sample(px, tuv.mean(1)) * 255).sum(1) < 260
    eyes = []
    for e in ('Eye.R', 'Eye.L'):
        o = bpy.data.objects[e]; t, d = o.matrix_world.translation, o.dimensions
        eyes.append((t.x, t.z, d.x / 2, d.z / 2))
    CX = (eyes[0][0] + eyes[1][0]) / 2
    brows = [Brow(-1, cen, dark, co0, front, eyes), Brow(1, cen, dark, co0, front, eyes)]
    ob.shape_key_add(name='Basis', from_mix=False)
    for key, (lift, tilt) in BROWS.items():
        for i, s in enumerate((R, L)):
            POSES['_one'] = tuple((lift, tilt) if j == i else (0, 0) for j in range(2))
            add_key(ob, f'{key}.{s}', deform_skin(co0, front, brows, '_one'))
    for i, s in enumerate((R, L)):
        c = cheeks(co0, front, 1, CX) - co0
        side = (co0[:, 0] > CX) if s == L else (co0[:, 0] <= CX)
        add_key(ob, f'CheekUp.{s}', co0 + c * side[:, None])
    X, ZU, ZL = opening(ob, CX)
    teeth = teeth_vertices(ob)
    for c in CLOSE_STEPS:
        add_key(ob, f'Mouth.Close{c:g}', close_mouth(co0, X, ZU, ZL, c, teeth))
    np.savez(os.path.join(HERE, 'in', 'mouth-opening.npz'), X=X, ZU=ZU, ZL=ZL, CX=CX)
    lid_keys(ob, rings, add_key, co0)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'in', 'tripo-face.blend'))
    print('done', [k.name for k in ob.data.shape_keys.key_blocks])
