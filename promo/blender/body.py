"""The 3D Body hero shot: the app's own BodyParts3D meshes (atlas/models),
grouped into body systems that pull apart in depth.

  blender -b --factory-startup -P promo/blender/body.py -- --t 0.0 --out still.png
  blender -b --factory-startup -P promo/blender/body.py -- --frames 1-150 --out renders/body/

--t is a point in the shot (0 start, 1 end) for one still; --frames renders
frames of it ('0-149' or '0,45,100'); the timing is above pose().
Geometry: BodyParts3D, (c) DBCLS, CC BY 4.0 (atlas/ATTRIBUTION.md).
"""
import argparse, gzip, json, math, os, struct, sys
from array import array

import bpy
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MODELS = os.path.join(ROOT, 'atlas', 'models')
FPS = 30

# Layers front to back. Each part goes to the first layer that claims it.
HEART = 'FMA7088'  # the catalogue's Heart (members: true)
LAYERS = [
    ('skin', lambda p: p['system'] == 'integumentary'),
    ('muscle', lambda p: p['system'] == 'muscular'),
    ('vessels', lambda p: p['system'] in ('arterial', 'venous', 'lymphatic')),
    ('organs', lambda p: p['system'] not in ('skeletal', 'connective')),
    ('skeleton', lambda p: True),
]
LAYER_COLOR = {  # base colours; navy-tinted, no pure grey
    'skin': (0.80, 0.86, 0.95), 'muscle': (0.78, 0.33, 0.36),
    'vessels': (0.35, 0.62, 0.95), 'organs': (0.90, 0.66, 0.52),
    'skeleton': (0.93, 0.91, 0.86), 'heart': (0.95, 0.22, 0.30),
}


def args():
    a = argparse.ArgumentParser()
    a.add_argument('--t', type=float, default=0.0)
    a.add_argument('--frames', default='')
    a.add_argument('--out', required=True)
    a.add_argument('--w', type=int, default=1080)
    a.add_argument('--h', type=int, default=1920)
    a.add_argument('--samples', type=int, default=64)
    return a.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])


def load_parts():
    meta = json.load(open(os.path.join(MODELS, 'atlas.json')))
    heart = set(next(c for c in meta['concepts'] if c['id'] == HEART)['elements'])
    chunks = {}
    groups = {name: [] for name, _ in LAYERS}
    groups['heart'] = []
    for p in meta['parts']:
        if p['system'] == 'reproductive' or p['name'] == 'Pubic hair':
            continue  # a promo for a hospital team: kept modest
        if p['chunk'] not in chunks:
            with gzip.open(os.path.join(MODELS, 'body-%d.bin.gz' % p['chunk'])) as f:
                chunks[p['chunk']] = f.read()
        buf = chunks[p['chunk']]
        pos = array('f'); pos.frombytes(buf[p['positions']:p['positions'] + p['vertexCount'] * 12])
        idx = array('I'); idx.frombytes(buf[p['indices']:p['indices'] + p['indexCount'] * 4])
        name = 'heart' if p['id'] in heart else next(n for n, test in LAYERS if test(p))
        groups[name].append((pos, idx))
    return groups


def build_mesh(name, pieces):
    verts, faces, base = [], [], 0
    for pos, idx in pieces:
        n = len(pos) // 3
        # atlas is y-up in metres; Blender is z-up
        verts.extend((pos[3 * i], -pos[3 * i + 2], pos[3 * i + 1]) for i in range(n))
        faces.extend((base + idx[k], base + idx[k + 1], base + idx[k + 2]) for k in range(0, len(idx), 3))
        base += n
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    for poly in me.polygons:
        poly.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def material(name, rgb, glass=False):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1)
    b.inputs['Roughness'].default_value = 0.42
    b.inputs['Coat Weight'].default_value = 0.35
    if glass:
        hologram(m)
    return m


def hologram(m):
    # The skin as a cyan X-ray: edges glow, faces turned to the camera go
    # clear (no transmission, so it converges fast and shows no detail).
    nt = m.node_tree; N = nt.nodes; Lk = nt.links
    for n in list(N):
        if n.type != 'OUTPUT_MATERIAL':
            N.remove(n)
    out = next(n for n in N if n.type == 'OUTPUT_MATERIAL')
    lw = N.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = 0.35
    ramp = N.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.25; ramp.color_ramp.elements[0].color = (0, 0, 0, 1)
    ramp.color_ramp.elements[1].position = 0.95; ramp.color_ramp.elements[1].color = (1, 1, 1, 1)
    em = N.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (0.0, 0.72, 0.9, 1); em.inputs['Strength'].default_value = 3.0
    tr = N.new('ShaderNodeBsdfTransparent')
    mix = N.new('ShaderNodeMixShader')
    Lk.new(lw.outputs['Facing'], ramp.inputs['Fac'])
    Lk.new(ramp.outputs['Color'], mix.inputs['Fac'])
    Lk.new(tr.outputs['BSDF'], mix.inputs[1]); Lk.new(em.outputs['Emission'], mix.inputs[2])
    Lk.new(mix.outputs['Shader'], out.inputs['Surface'])
    m.blend_method = 'BLEND'


# The shot (150 frames = the "body" beat in src/hub-promo/timing.ts):
#   0-40    the whole body, close, turning slowly
#   40-85   the layers fan out sideways and back like cards; the camera pulls back
#   80-110  the heart flies up to just in front of the lens; focus follows it
#   110-150 hold on the heart, still turning (the app's card joins it in Remotion)
TARGET = Vector((0.0, 0.0, 0.92))
VIEW = Vector((0.42, 1.0, -0.06)).normalized()  # camera looks from front-left
SIDE = Vector((VIEW.y, -VIEW.x, 0)).normalized()  # screen right
ORDER = ['skin', 'muscle', 'vessels', 'organs', 'skeleton']  # front to back


def ease(x):  # critically damped settle, no overshoot
    x = max(0.0, min(1.0, x))
    return 1 - (1 + 6 * x) * math.exp(-6 * x) if x < 1 else 1.0


def apart(name, f):
    return ease((f - 40 - 5 * ORDER.index(name)) / 30.0)


def cam_at(f):
    d = 3.3 + 2.9 * ease((f - 35) / 50.0)
    return TARGET - VIEW * d + Vector((0, 0, 0.12)), d


def layer_offset(name):
    k = ORDER.index(name) - 2  # -2 front ... +2 back
    return SIDE * (0.31 * k + 0.16) + VIEW * (0.8 * k)


def pose(objs, cam, f, heart_c):
    turn = math.radians(-30 + 22 * ease(f / 100.0))
    for name in ORDER:
        ob = objs[name]
        ob.rotation_euler = (0, 0, turn)  # meshes are in world space around x=y=0: turns in place
        ob.location = layer_offset(name) * apart(name, f)
    # the heart: from its place in the chest to a spot just in front of the
    # final camera, lower left of frame, turning on its own
    c_end, _ = cam_at(149)
    spot = c_end + VIEW * 0.9 - SIDE * 0.05 + Vector((0, 0, 0.02))
    h = ease((f - 80) / 28.0)
    heart = objs['heart']
    heart.rotation_euler = (0, 0, turn + math.radians(140) * h + math.radians(0.6 * f))
    heart.location = (0, 0, 0)
    bpy.context.view_layer.update()
    here = heart.matrix_world @ heart_c  # where the turn puts its centre
    heart.location = (spot - here) * h
    pos, d = cam_at(f)
    cam.location = pos
    cam.rotation_euler = (TARGET - pos).to_track_quat('-Z', 'Y').to_euler()
    heart_d = (spot - pos).length
    cam.data.dof.focus_distance = d + (heart_d - d) * ease((f - 84) / 22.0)


def scene(a):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.render.engine = 'CYCLES'
    s.cycles.device = 'CPU'
    s.cycles.samples = a.samples
    s.cycles.use_denoising = False  # this Blender build has no denoiser
    s.cycles.max_bounces = 4
    s.render.resolution_x, s.render.resolution_y = a.w, a.h
    s.render.film_transparent = True
    s.view_settings.view_transform = 'AgX'
    s.render.fps = FPS

    groups = load_parts()
    objs = {}
    for name, pieces in groups.items():
        ob = build_mesh(name, pieces)
        ob.data.materials.append(material(name, LAYER_COLOR[name], glass=(name == 'skin')))
        objs[name] = ob

    cam_data = bpy.data.cameras.new('cam')
    cam_data.lens = 50
    cam_data.dof.use_dof = True
    cam_data.dof.aperture_fstop = 2.2
    cam = bpy.data.objects.new('cam', cam_data)
    s.collection.objects.link(cam)
    s.camera = cam

    # light: warm key top-left, cyan rim behind right, soft navy world
    def area(name, loc, energy, rgb, size):
        L = bpy.data.lights.new(name, 'AREA'); L.energy = energy; L.color = rgb; L.size = size
        o = bpy.data.objects.new(name, L); s.collection.objects.link(o); o.location = loc
        o.rotation_euler = (Vector((0, 0, 1)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    area('key', (-3.0, -3.5, 3.2), 1100, (1.0, 0.93, 0.85), 2.5)
    area('rim', (2.2, 2.4, 2.2), 1400, (0.0, 0.72, 0.9), 1.5)
    area('fill', (2.5, -3.0, 0.8), 260, (0.6, 0.65, 1.0), 3.0)
    w = bpy.data.worlds.new('w'); s.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.02, 0.03, 0.08, 1)
    w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.6
    return s, objs, cam


def main():
    a = args()
    s, objs, cam = scene(a)
    me = objs['heart'].data
    heart_c = sum((v.co for v in me.vertices), Vector()) / len(me.vertices)
    if a.frames:
        frames = [int(x) for x in a.frames.split(',')] if ',' in a.frames else range(int(a.frames.split('-')[0]), int(a.frames.split('-')[1]) + 1)
        os.makedirs(a.out, exist_ok=True)
        for f in frames:
            pose(objs, cam, f, heart_c)
            s.render.filepath = os.path.join(a.out, 'body_%04d.png' % f)
            bpy.ops.render.render(write_still=True)
    else:
        pose(objs, cam, round(a.t * 149), heart_c)
        s.render.filepath = a.out
        bpy.ops.render.render(write_still=True)


main()
