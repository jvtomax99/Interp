"""Step A's review pictures (out/plan-match.png; Jose's review brief 2026-10-23):
  out/plan/gateA.png        neutral, warm smile, joyful laugh, relaxed blink: Jose's reference
                            tile, the old shell lids, the new lids front, three-quarter, one eye
  out/plan/gateA-side.png   the side profile: rest and blink, old and new
  out/plan/gateA-moves.png  the in-between shapes: rest -> blink -> rest, rest -> smile -> laugh
  out/plan/gateA-wire.png   the wireframe of the eyelid ring and the face round it
Same camera, light and framing for the old and the new.

  python3 tripo_gateA.py [old.blend]     old.blend: the model before the skin lids, for the "before" tiles
"""
import os, sys
import numpy as np
import bpy
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build
from tripo_face import set_face
from tripo_faceplan import shot
from tripo_mouths import MOUTHS

HERE = os.path.dirname(os.path.abspath(__file__))
TMP = os.path.join(HERE, 'in', 'faceplan')
REF = '/root/.claude/uploads/0a3f0758-232c-5ae0-8fad-34b3e0089a86/8238b9ff-image.png'
TILES = {'rest': (60, 100, 460, 400), 'smile': (560, 100, 960, 400), 'laugh': (60, 470, 460, 770), 'blink': (560, 1210, 960, 1510)}
LABEL = {'rest': 'neutral', 'smile': 'warm smile', 'laugh': 'joyful laugh', 'blink': 'relaxed blink'}
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
W, G = 480, 12


def studio(blend):
    bpy.ops.wm.open_mainfile(filepath=blend)
    ob = bpy.data.objects['Mesh_0']
    build.STYLE_NOW = 'tripo'; cam = build.studio(); sc = bpy.context.scene; sc.camera = cam
    sc.cycles.samples = int(os.environ.get('SAMPLES', 20))
    op = np.load(os.path.join(HERE, 'in', 'mouth-opening.npz')); CX = float(op['CX'])
    eL = bpy.data.objects['Eye.L'].matrix_world.translation
    states = dict(MOUTHS); states['blink'] = dict(close=1, lid=(1, 1))
    return ob, CX, eL, states


def faces(blend, tag):
    ob, CX, eL, states = studio(blend)
    out = {}
    for name in ('rest', 'smile', 'laugh', 'blink'):
        set_face(ob, **states[name])
        out[name, 'front'] = shot(os.path.join(TMP, f'ga-{tag}-{name}-front.png'), (CX, 0, .74), .95, 0, 2, (W, 360))
        out[name, '34'] = shot(os.path.join(TMP, f'ga-{tag}-{name}-34.png'), (CX, 0, .74), .95, -35, 3, (W, 360))
        out[name, 'eye'] = shot(os.path.join(TMP, f'ga-{tag}-{name}-eye.png'), (eL.x, 0, eL.z), .42, -8, 4, (W, 360))
        if name in ('rest', 'blink'):
            out[name, 'side'] = shot(os.path.join(TMP, f'ga-{tag}-{name}-side.png'), (eL.x, -.09, eL.z), .5, -82, 2, (W, 360))   # brow to cheek in view
    return out


def moves(blend):
    """The in-between shapes, the face at rest otherwise."""
    ob, CX, eL, states = studio(blend)
    rows = []
    seq = [('rest → blink → rest', [dict(lid=(k, k)) for k in (0, .3, .6, .85, 1, .7, .35, 0)])]
    sm = states['smile']; la = states['laugh']
    seq.append(('rest → smile → laugh', [dict()] + [dict(close=0, cheek=(k, k), lower=(.45 * k, .45 * k), lid=(.32 - .1 * k, .32 - .1 * k), brow=((2 * k, 0), (2.4 * k, 0))) for k in (.5, 1)]
                + [dict(close=0, cheek=(1 + .6 * k, 1 + .6 * k), happy=k, lower=(.45 + .55 * k, .45 + .55 * k), brow=((2 + .8 * k, 0), (2.4 + k, 0)), mouth={'JawOpen': 1.2 * k, 'CornerUp.L': k, 'CornerUp.R': k}) for k in (.35, .7, 1)]))
    for title, ctls in seq:
        tiles = []
        for k, ctl in enumerate(ctls):
            set_face(ob, **ctl)
            tiles.append(shot(os.path.join(TMP, f'ga-move-{len(rows)}-{k}.png'), (CX, 0, .76), .7, -12, 3, (300, 240)))
        row = Image.new('RGB', (300 * len(tiles) + 8 * (len(tiles) - 1), 240 + 36), 'white'); g = ImageDraw.Draw(row)
        g.text((8, 6), title, font=ImageFont.truetype(FB, 22), fill=(37, 46, 109))
        for k, t in enumerate(tiles):
            row.paste(t, (308 * k, 36))
        rows.append(row)
    sheet = Image.new('RGB', (max(r.width for r in rows), sum(r.height + 10 for r in rows)), 'white')
    y = 0
    for r in rows:
        sheet.paste(r, (0, y)); y += r.height + 10
    sheet.save(os.path.join(HERE, 'out', 'plan', 'gateA-moves.png'))


def wire(blend):
    """The eyelid ring and the face round it as a wireframe: a copy of the faces near
    the left eye with a Wireframe modifier (black), over the shaded face."""
    ob, CX, eL, states = studio(blend)
    me = ob.data
    co = np.empty(len(me.vertices) * 3); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
    near = np.linalg.norm(co - np.array(eL), axis=1) < .06
    pv = np.empty(len(me.loops), dtype=np.int64); me.loops.foreach_get('vertex_index', pv); tri = pv.reshape(-1, 3)
    keep = near[tri].all(1)
    import bmesh
    bm = bmesh.new()
    idx = {}
    for i in np.nonzero(near)[0]:
        idx[int(i)] = bm.verts.new(co[i])
    for f in tri[keep]:
        try:
            bm.faces.new([idx[int(v)] for v in f])
        except ValueError:
            pass
    wm = bpy.data.meshes.new('EyeWire'); bm.to_mesh(wm); bm.free()
    wo = bpy.data.objects.new('EyeWire', wm); bpy.context.scene.collection.objects.link(wo)
    wo.matrix_world = ob.matrix_world.copy()
    mod = wo.modifiers.new('wire', 'WIREFRAME'); mod.thickness = .00025; mod.use_replace = True
    m = bpy.data.materials.new('Wire'); m.use_nodes = True
    e = m.node_tree.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (.02, .02, .05, 1); e.inputs['Strength'].default_value = 1
    m.node_tree.links.new(e.outputs[0], m.node_tree.nodes['Material Output'].inputs['Surface'])
    wm.materials.append(m)
    out = []
    for name in ('rest', 'blink'):
        set_face(ob, **states[name])
        # the wire copy does not move with the keys: for the blink it is rebuilt from the evaluated mesh
        dg = bpy.context.evaluated_depsgraph_get(); ev = ob.evaluated_get(dg).data
        ec = np.empty(len(ev.vertices) * 3); ev.vertices.foreach_get('co', ec); ec = ec.reshape(-1, 3)
        for i, v in idx.items():
            pass
        wco = np.empty(len(wm.vertices) * 3); wm.vertices.foreach_get('co', wco); wco = wco.reshape(-1, 3)
        order = np.nonzero(near)[0]
        wm.vertices.foreach_set('co', ec[order].ravel()); wm.update()
        out.append(shot(os.path.join(TMP, f'ga-wire-{name}.png'), (eL.x, -.1, eL.z), .3, -20, 6, (700, 525)))
    sheet = Image.new('RGB', (700 * 2 + 12, 525 + 36), 'white'); g = ImageDraw.Draw(sheet)
    g.text((8, 6), 'wireframe: the lid ring and the face round it, rest and blink (left eye, three-quarter)', font=ImageFont.truetype(FB, 22), fill=(37, 46, 109))
    sheet.paste(out[0], (0, 36)); sheet.paste(out[1], (712, 36))
    sheet.save(os.path.join(HERE, 'out', 'plan', 'gateA-wire.png'))


if __name__ == '__main__':
    old = sys.argv[1] if len(sys.argv) > 1 and os.path.exists(sys.argv[1]) else None
    new_blend = os.path.join(HERE, 'in', 'tripo-face.blend')
    before = faces(old, 'old') if old else {}
    now = faces(new_blend, 'new')
    ref = Image.open(REF).convert('RGB')
    f = ImageFont.truetype(FB, 24)
    rows = []
    for name in ('rest', 'smile', 'laugh', 'blink'):
        tiles = [(LABEL[name] + ': reference (generated art)', ref.crop(TILES[name]).resize((W, 360)))]
        if before:
            tiles.append(('before (shell lids)', before[name, 'front']))
        tiles += [('now, front', now[name, 'front']), ('now, three-quarter', now[name, '34']), ('now, one eye', now[name, 'eye'])]
        row = Image.new('RGB', ((W + G) * len(tiles), 360 + 40), 'white'); g = ImageDraw.Draw(row)
        for i, (lab, im) in enumerate(tiles):
            g.text(((W + G) * i + 8, 6), lab, font=f, fill=(37, 46, 109)); row.paste(im, ((W + G) * i, 40))
        rows.append(row)
    sheet = Image.new('RGB', (max(r.width for r in rows), sum(r.height + 10 for r in rows)), 'white')
    y = 0
    for r in rows:
        sheet.paste(r, (0, y)); y += r.height + 10
    sheet.save(os.path.join(HERE, 'out', 'plan', 'gateA.png'))
    # the side profiles
    tiles = []
    for name in ('rest', 'blink'):
        if before:
            tiles.append((LABEL[name] + ', side: before', before[name, 'side']))
        tiles.append((LABEL[name] + ', side: now', now[name, 'side']))
    row = Image.new('RGB', ((W + G) * len(tiles), 360 + 40), 'white'); g = ImageDraw.Draw(row)
    for i, (lab, im) in enumerate(tiles):
        g.text(((W + G) * i + 8, 6), lab, font=f, fill=(37, 46, 109)); row.paste(im, ((W + G) * i, 40))
    row.save(os.path.join(HERE, 'out', 'plan', 'gateA-side.png'))
    moves(new_blend)
    wire(new_blend)
    print('done')
