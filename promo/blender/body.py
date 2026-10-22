"""The 3D Body hero shot: the app's own BodyParts3D meshes (atlas/models),
grouped into body systems that pull apart in depth.

  blender -b --factory-startup -P promo/blender/body.py -- --t 0.0 --out still.png
  blender -b --factory-startup -P promo/blender/body.py -- --frames 1-150 --out renders/body/

--t is how far apart the systems are (0 whole, 1 fully apart) for one still;
--frames renders the animation (the timing is in explode_at()).
Geometry: BodyParts3D, (c) DBCLS, CC BY 4.0 (atlas/ATTRIBUTION.md).
"""
import argparse, gzip, json, math, os, struct, sys
from array import array

import bpy
from mathutils import Matrix, Vector

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
        b.inputs['Transmission Weight'].default_value = 0.85
        b.inputs['Roughness'].default_value = 0.18
    return m


# Where each layer ends up when fully apart (metres): a row receding to the
# right and back, so a 3/4 camera sees them as stacked sheets in depth.
SPREAD = {'skin': (-0.45, -1.5, 0), 'muscle': (-0.22, -0.75, 0), 'vessels': (0.0, 0.0, 0),
          'organs': (0.22, 0.75, 0), 'skeleton': (0.45, 1.5, 0), 'heart': (-0.35, -2.4, 0.25)}
STAGGER = ['skin', 'muscle', 'vessels', 'organs', 'skeleton', 'heart']


def ease(x):  # critically damped settle, no overshoot
    x = max(0.0, min(1.0, x))
    return 1 - (1 + 6 * x) * math.exp(-6 * x) if x < 1 else 1.0


def explode_at(name, frame):
    # 0-1.5 s whole and turning; then each layer leaves 0.12 s after the last
    start = 45 + 4 * STAGGER.index(name)
    return ease((frame - start) / 30.0)


def place(objs, t_of):
    for name, ob in objs.items():
        d = Vector(SPREAD[name])
        ob.location = d * t_of(name)


def scene(a):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.render.engine = 'CYCLES'
    s.cycles.device = 'CPU'
    s.cycles.samples = a.samples
    s.cycles.use_denoising = False  # this Blender build has no denoiser
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

    # pivot for the turn: an empty at the body's centre
    pivot = bpy.data.objects.new('pivot', None)
    s.collection.objects.link(pivot)
    pivot.location = (0, 0, 0.95)
    for ob in objs.values():
        ob.parent = pivot  # pivot.matrix_world isn't updated yet; undo its offset by hand
        ob.matrix_parent_inverse = Matrix.Translation(-pivot.location)

    cam_data = bpy.data.cameras.new('cam')
    cam_data.lens = 50
    cam_data.dof.use_dof = True
    cam_data.dof.aperture_fstop = 2.8
    cam = bpy.data.objects.new('cam', cam_data)
    s.collection.objects.link(cam)
    cam.location = (-3.4, -6.4, 1.5)
    look = Vector((0.05, 0, 0.95)) - cam.location
    cam.rotation_euler = look.to_track_quat('-Z', 'Y').to_euler()
    cam_data.dof.focus_distance = look.length
    s.camera = cam

    # light: warm key top-left, cyan rim behind right, soft navy world
    def area(name, loc, energy, rgb, size):
        L = bpy.data.lights.new(name, 'AREA'); L.energy = energy; L.color = rgb; L.size = size
        o = bpy.data.objects.new(name, L); s.collection.objects.link(o); o.location = loc
        o.rotation_euler = (Vector((0, 0, 1)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    area('key', (-2.5, -3.0, 3.2), 900, (1.0, 0.93, 0.85), 2.5)
    area('rim', (2.2, 2.4, 2.2), 1200, (0.0, 0.72, 0.9), 1.5)
    area('fill', (3.0, -2.0, 0.5), 200, (0.6, 0.65, 1.0), 3.0)
    w = bpy.data.worlds.new('w'); s.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.02, 0.03, 0.08, 1)
    w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.6
    return s, objs, pivot


def main():
    a = args()
    s, objs, pivot = scene(a)
    if a.frames:
        f0, f1 = (int(x) for x in a.frames.split('-'))
        os.makedirs(a.out, exist_ok=True)
        for f in range(f0, f1 + 1):
            place(objs, lambda n: explode_at(n, f))
            pivot.rotation_euler = (0, 0, math.radians(-25 + 0.25 * f))
            s.render.filepath = os.path.join(a.out, 'body_%04d.png' % f)
            bpy.ops.render.render(write_still=True)
    else:
        place(objs, lambda n: a.t)
        pivot.rotation_euler = (0, 0, math.radians(-20))
        s.render.filepath = a.out
        bpy.ops.render.render(write_still=True)


main()
