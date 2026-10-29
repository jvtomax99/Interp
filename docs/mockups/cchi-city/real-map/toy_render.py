# The campus as a toy diorama, rendered in Blender (Jose, 2026-10-28: "can this visual be achieved?", the train-diorama
# video, his pick "Blender test render"). The live page's scene is exported to GLB (export.cjs, the built page in
# headless Chromium), then this script, run with Blender's Python module (bpy 5.0.1, Python 3.11), gives it the video's
# look: satin toy plastic with softly rounded edges (Cycles' Bevel node), a warm sun with soft shadows, a bright sky
# for the bounce light, AgX colour, real depth of field, and renders each view with Cycles on the CPU.
#   python3.11 toy_render.py campus.glb outdir [w h samples]
import bpy, math, sys, os
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from toy_look import B, load, drop_clouds, flat_ground_apart, toy_materials, light, cycles, camera
args = sys.argv[1:]
GLB, OUT = args[0], args[1]
W, H, SAMPLES = (int(args[2]), int(args[3]), int(args[4])) if len(args) > 4 else (900, 1200, 64)
os.makedirs(OUT, exist_ok=True)
sc = load(GLB); drop_clouds(sc); flat_ground_apart(sc); toy_materials(); light(sc); cycles(sc, W, H, SAMPLES)

# the CoreCHI Practice card's view (diorama.html's camera direction, -42,64,104 toward 0.5,0.5,-1.5, fov 18.77), pulled
# back to take in the whole real board round its middle
import math as _m
_d = Vector((-42.5, 63.5, 105.5)).normalized(); _c = Vector((-1, -3, -29)); _p = _c + _d*float(os.environ.get('CARD_DIST', '250'))
CARD = ((_p.x, _p.y, _p.z), (_c.x, _c.y, _c.z), 18.77, 2.2)
VIEWS = {   # name: camera, target (the live page's own numbers), field of view (vertical, degrees), f-stop
  'front':  ((-16, 22, 28), (2, 0, -6), 30, 0.35),
  'whole':  ((-55, 70, 60), (-1, 0, -30), 30, 0.6),
  'court':  ((-40, 16, -10), (-19, 1, -29), 30, 0.25),
  'card':   CARD,
}
PROG = os.environ.get('PROGRESS')   # e.g. "e:0.8,t:0.5,n:0.3,s:0.9,c:0.6": each domain building painted up to that share
if PROG:
    share = {k: float(v) for k, v in (p.split(':') for p in PROG.split(','))}
    for k, f in share.items():
        objs = [o for o in sc.objects if o.type == 'MESH' and o.name.startswith(k + '_')]
        if not objs: continue
        zs = [(o.matrix_world @ Vector(c)).z for o in objs for c in o.bound_box]; cut = min(zs) + (max(zs) - min(zs))*f
        done = {}
        for o in objs:
            for i, m in enumerate(o.data.materials):
                if m is None: continue
                if m.name not in done:
                    mm = m.copy(); nt = mm.node_tree; P = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
                    if P:
                        geo = nt.nodes.new('ShaderNodeNewGeometry'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); cmp = nt.nodes.new('ShaderNodeMath'); cmp.operation = 'GREATER_THAN'; cmp.inputs[1].default_value = cut
                        mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.inputs['B'].default_value = (0.93, 0.92, 0.9, 1)
                        nt.links.new(geo.outputs['Position'], sep.inputs[0]); nt.links.new(sep.outputs['Z'], cmp.inputs[0]); nt.links.new(cmp.outputs[0], mix.inputs['Factor'])
                        src = P.inputs['Base Color'].links[0].from_socket if P.inputs['Base Color'].is_linked else None
                        if src: nt.links.new(src, mix.inputs['A'])
                        else: mix.inputs['A'].default_value = P.inputs['Base Color'].default_value
                        nt.links.new(mix.outputs['Result'], P.inputs['Base Color'])
                    done[m.name] = mm
                o.data.materials[i] = done[m.name]
want = os.environ.get('VIEWS', 'front,whole,court').split(',')
for name in want:
    pos, target, fov, fstop = VIEWS[name]
    camera(sc, name, pos, target, fov, fstop); sc.render.filepath = os.path.join(OUT, f'{name}.png')
    bpy.ops.render.render(write_still=True); print('rendered', name, flush=True)
