# Step 2 of the CoreCHI Practice card's pictures: the renders, in Blender, from card_capture.cjs's files, all from the
# card's camera (card.json), at twice the card's size (1920 x 1680; card_build.py halves them):
#   painted.png   the board in the toy look, every building in its colours
#   clay.png      the same with the five domain buildings in white clay (the card's unpainted campus)
#   mask-<k>.exr  each domain building's coverage (what of it the camera sees, everything in front occluding)
#   height.exr    each pixel's height above the board (three.js y), to cut a building's paint at a share of its height
#   glow.exr      the domain buildings' lit windows, light on black
#   m/<name>.png  each moving thing's frame alone, cropped, the rest of the board held out (it hides what is behind it)
#   proj.json     every mover's path and reference point as the camera sees them, the crops' boxes
#   python3.11 card_render.py <capdir> <outdir> [samples]        STAGES=painted,clay,data,movers (default all four)
import bpy, json, math, os, sys
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from toy_look import B, load, drop_clouds, flat_ground_apart, toy_materials, light, cycles, camera
CAP, OUT = sys.argv[1], sys.argv[2]
SAMPLES = int(sys.argv[3]) if len(sys.argv) > 3 else 96
STAGES = os.environ.get('STAGES', 'painted,clay,data,movers').split(',')
os.makedirs(os.path.join(OUT, 'm'), exist_ok=True)
C = json.load(open(os.path.join(CAP, 'card.json'))); CAM = C['cam']
W, H = CAM['w']*CAM['scale'], CAM['h']*CAM['scale']
KEYS = ['e', 't', 's', 'n', 'c']
sc = load(os.path.join(CAP, "base.glb")); drop_clouds(sc); flat_ground_apart(sc)
BASE = [o for o in sc.objects if o.type == 'MESH']
key = lambda o: o.name.split('_')[0] if o.name.split('_')[0] in KEYS else None
toy_materials(); light(sc); cycles(sc, W, H, SAMPLES)
cam = camera(sc, 'card', CAM['pos'], CAM['target'], CAM['fov'])
sc.render.use_persistent_data = True
print('objects', len(BASE), 'domain', sum(1 for o in BASE if key(o)), 'lit', sum(1 for o in BASE if key(o) and o.get('lit')), flush=True)

def render(name, fmt='PNG'):
    sc.render.image_settings.file_format = fmt
    if fmt == 'OPEN_EXR': sc.render.image_settings.color_depth = '32'; sc.render.image_settings.exr_codec = 'ZIP'
    else: sc.render.image_settings.color_mode = 'RGBA'; sc.render.image_settings.color_depth = '8'
    sc.render.filepath = os.path.join(OUT, name); bpy.ops.render.render(write_still=True); print('rendered', name, flush=True)

def swap(objs, mat_of):
    # give each object the material mat_of(object, its material) on every slot; returns how to put them back
    keep = [(o, list(o.data.materials)) for o in objs]
    for o in objs:
        for i, m in enumerate(o.data.materials): o.data.materials[i] = mat_of(o, m)
    def back():
        for o, ms in keep:
            for i, m in enumerate(ms): o.data.materials[i] = m
    return back

def emission(name, colour=None, height=False):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = 1.0
    if height:   # Blender z is three.js y
        geo = nt.nodes.new('ShaderNodeNewGeometry'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); com = nt.nodes.new('ShaderNodeCombineXYZ')
        nt.links.new(geo.outputs['Position'], sep.inputs[0])
        for c in 'XYZ': nt.links.new(sep.outputs['Z'], com.inputs[c])
        nt.links.new(com.outputs[0], em.inputs['Color'])
    else: em.inputs['Color'].default_value = (*colour, 1)
    nt.links.new(em.outputs[0], out.inputs['Surface']); return m

def flat_settings(on):
    # data renders: light only from the surfaces themselves, no tone mapping, no denoising, nothing dithered
    if on:
        flat_settings.keep = (sc.cycles.samples, sc.cycles.use_denoising, sc.cycles.max_bounces, sc.view_settings.view_transform, sc.view_settings.look, sc.view_settings.exposure, sc.render.film_transparent, sc.render.dither_intensity, sc.world.node_tree.nodes['Background'].inputs['Strength'].default_value)
        sc.cycles.samples = 48; sc.cycles.use_denoising = False; sc.cycles.max_bounces = 0
        sc.view_settings.view_transform = 'Raw'; sc.view_settings.look = 'None'; sc.view_settings.exposure = 0; sc.render.film_transparent = False; sc.render.dither_intensity = 0
        sc.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0
    else:
        (sc.cycles.samples, sc.cycles.use_denoising, sc.cycles.max_bounces, sc.view_settings.view_transform, look, sc.view_settings.exposure, sc.render.film_transparent, sc.render.dither_intensity, s) = flat_settings.keep
        sc.view_settings.look = look; sc.world.node_tree.nodes['Background'].inputs['Strength'].default_value = s

if 'painted' in STAGES: render('painted.png')
if 'clay' in STAGES:
    # white clay on the five domain buildings: each of their materials copied with its colour replaced, and matte (their
    # glass stays a mirror otherwise, and a clay tower of it reads as fog)
    clay = {}
    def to_clay(o, m):
        if m is None: return m
        if m.name not in clay:
            mm = m.copy(); P = next((n for n in mm.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
            if P:
                for l in list(P.inputs['Base Color'].links): mm.node_tree.links.remove(l)
                P.inputs['Base Color'].default_value = (0.84, 0.83, 0.81, 1)   # under the bright sun this still reads white, with its shape
                P.inputs['Metallic'].default_value = 0.0; P.inputs['Roughness'].default_value = 0.5
                for i in ('Transmission Weight', 'Specular IOR Level'):
                    if i in P.inputs and not P.inputs[i].is_linked: P.inputs[i].default_value = 0.0 if i == 'Transmission Weight' else 0.5
            clay[m.name] = mm
        return clay[m.name]
    back = swap([o for o in BASE if key(o)], to_clay); render('clay.png'); back()

if 'data' in STAGES:
    flat_settings(True)
    black = emission('black', (0, 0, 0)); white = emission('white', (1, 1, 1))
    for k in KEYS:
        back = swap(BASE, lambda o, m: white if key(o) == k else black); render(f'mask-{k}.exr', 'OPEN_EXR'); back()
    hm = emission('height', height=True)
    back = swap(BASE, lambda o, m: hm); render('height.exr', 'OPEN_EXR'); back()
    warm = emission('warm', (1.0, 0.64, 0.32))
    back = swap(BASE, lambda o, m: warm if key(o) and o.get('lit') else black); render('glow.exr', 'OPEN_EXR'); back()
    flat_settings(False)

def px(p):   # a three.js point -> [x, y] in the card's 960 x 840 and its distance from the camera
    v = B(*p); c = world_to_camera_view(sc, cam, v)
    return [round(c.x*CAM['w'], 2), round((1 - c.y)*CAM['h'], 2)], (v - cam.location).length

if 'movers' in STAGES:
    M = C['movers']
    # every frame's file, imported hidden; the board held out (it hides a mover where it stands in front of it)
    for o in BASE: o.is_holdout = True
    groups = {}
    def frames(o): return o['frames']
    allf = []
    for k, v in M.items():
        for it in (v if isinstance(v, list) else [v]): allf += frames(it)
    for f in allf:
        before = set(sc.objects); bpy.ops.import_scene.gltf(filepath=os.path.join(CAP, f)); objs = [o for o in sc.objects if o not in before and o.type == 'MESH']
        groups[f] = objs
        for o in objs: o.hide_render = True
    toy_materials()
    sc.cycles.samples = min(SAMPLES, 64)
    crops = {}
    for f, objs in groups.items():
        # the frame's box on screen, from its meshes' corners, a few pixels round it
        xs, ys = [], []
        for o in objs:
            for c in o.bound_box:
                v = world_to_camera_view(sc, cam, o.matrix_world @ Vector(c)); xs.append(v.x); ys.append(v.y)
        x0, x1, y0, y1 = max(0, min(xs)), min(1, max(xs)), max(0, min(ys)), min(1, max(ys))
        if x1 <= x0 or y1 <= y0: crops[f] = None; continue
        mx, my = 6/W, 6/H
        sc.render.use_border = True; sc.render.use_crop_to_border = True
        sc.render.border_min_x, sc.render.border_max_x = max(0, x0 - mx), min(1, x1 + mx)
        sc.render.border_min_y, sc.render.border_max_y = max(0, y0 - my), min(1, y1 + my)
        for o in objs: o.hide_render = False
        name = 'm/' + os.path.basename(f).replace('.glb', '.png'); render(name)
        for o in objs: o.hide_render = True
        # the crop in full-size pixels, top-left origin (Blender rounds the border to whole pixels)
        bx0 = int(sc.render.border_min_x*W); by1 = int(sc.render.border_max_y*H); by0 = int(sc.render.border_min_y*H)
        crops[f] = [bx0, H - by1, name]
    sc.render.use_border = False
    # paths as the camera sees them: [x, y, scale, seen], scale = the reference's distance over the point's
    proj = {}
    for k, v in M.items():
        for i, it in enumerate(v if isinstance(v, list) else [v]):
            r = {}
            for rk, pk in (('ref', 'pts'), ('ref2', 'pts2')):
                if rk not in it: continue
                (rx, ry), rd = px(it[rk]); r[rk] = [rx, ry]
                r[pk] = [[*px(p[:3])[0], round(rd/px(p[:3])[1], 4), p[3]] for p in it[pk]]
            if 'pad' in it: r['pad'] = px(it['pad'])[0]
            proj[f'{k}{i}' if isinstance(v, list) else k] = r
    labels = {k: px(b['label'])[0] for k, b in C['box'].items()}
    X0, X1, Z0, Z1 = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scene.json')))['board']
    board = [px([x, -7.5, z])[0] for x, z in ((X0, Z0), (X1, Z0), (X1, Z1), (X0, Z1))]   # the board's footprint, under it (its shadow)
    json.dump({'crops': crops, 'paths': proj, 'labels': labels, 'board': board, 'fountain': px([0.64, 1.3, -0.2])[0]}, open(os.path.join(OUT, 'proj.json'), 'w'))
print('done', flush=True)
