# The toy nurse: Tripo's shape, flat colours by part, face as its own pieces, Blender studio light.
# python3 toy.py -- in.glb dir out.png [front|three|face]
import bpy, bmesh, sys, math, os, json
import numpy as np
from mathutils import Vector, Matrix
args = sys.argv[sys.argv.index('--') + 1:]
glb, D, out = args[0], os.path.abspath(args[1]), os.path.abspath(args[2]); view = args[3] if len(args) > 3 else 'front'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
o = [x for x in bpy.context.scene.objects if x.type == 'MESH'][0]
o.rotation_mode = 'XYZ'; o.rotation_euler[2] += math.radians(-90)
bpy.context.view_layer.objects.active = o; o.select_set(True)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
s = bpy.context.scene
# --- material: flat colour, per-part roughness, no Tripo normal map
m = bpy.data.materials.new('toy'); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(f'{D}/flat.png'); nt.links.new(t.outputs[0], b.inputs['Base Color'])
r = nt.nodes.new('ShaderNodeTexImage'); r.image = bpy.data.images.load(f'{D}/rough.png'); r.image.colorspace_settings.name = 'Non-Color'
nt.links.new(r.outputs[0], b.inputs['Roughness'])
b.inputs['Subsurface Weight'].default_value = 0.10; b.inputs['Subsurface Radius'].default_value = (1.0, 0.45, 0.25); b.inputs['Subsurface Scale'].default_value = 0.01
b.inputs['Specular IOR Level'].default_value = 0.35
o.data.materials.clear(); o.data.materials.append(m)
for p in o.data.polygons: p.use_smooth = True
bpy.ops.mesh.customdata_custom_splitnormals_clear()
bm0 = bmesh.new(); bm0.from_mesh(o.data); n0 = len(bm0.verts); bmesh.ops.remove_doubles(bm0, verts=bm0.verts, dist=float(os.environ.get('MERGE', '1e-5'))); print('merged', n0 - len(bm0.verts)); bm0.to_mesh(o.data); bm0.free()
# --- whole-figure smoothing: Tripo's surface is grainy under its stored shading; smooth the real shape
GS = int(os.environ.get('GSMOOTH', '0'))
if GS:
    md = o.modifiers.new('gs', os.environ.get('GTYPE', 'LAPLACIANSMOOTH'))
    if md.type == 'LAPLACIANSMOOTH': md.lambda_factor = float(os.environ.get('GLAM', '0.6')); md.iterations = GS; md.use_volume_preserve = True
    else: md.factor = 0.5; md.iterations = GS
    bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier='gs')
# --- hair smoothing: vertices whose label is hair get Laplacian smoothing (lumps go, shape stays)
HS = float(os.environ.get('HAIRSMOOTH', '0'))
if HS > 0 and os.path.exists(f'{D}/label.npy'):
    L = np.load(f'{D}/label.npy'); N = L.shape[0]
    bm = bmesh.new(); bm.from_mesh(o.data); uv = bm.loops.layers.uv.active
    w = {}
    for f in bm.faces:
        for lp in f.loops:
            u, v = lp[uv].uv; i = min(N - 1, max(0, int((1 - v) * N))); j = min(N - 1, max(0, int(u * N)))
            w.setdefault(lp.vert.index, []).append(L[i, j] == 2)
    bm.free()
    g = o.vertex_groups.new(name='hair')
    for vi, ws in w.items():
        if sum(ws) / len(ws) > 0.5: g.add([vi], 1.0, 'REPLACE')
    md = o.modifiers.new('ls', 'LAPLACIANSMOOTH'); md.vertex_group = 'hair'; md.lambda_factor = HS; md.iterations = int(os.environ.get('HAIRIT', '8')); md.use_volume_preserve = True
    bpy.ops.object.modifier_apply(modifier='ls')
bpy.context.view_layer.update()
pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))); hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
c = (lo + hi) / 2; h = hi.z - lo.z
exec(open(os.path.join(os.path.dirname(__file__), 'face.py')).read()) if os.path.exists(os.path.join(os.path.dirname(__file__), 'face.py')) and os.environ.get('FACE') else None
# --- camera and light (studio.py's set)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); s.collection.objects.link(cam); s.camera = cam
cam.data.lens = 120; dist = h * 4.6
if view == 'face':
    cam.data.lens = 120 * 3.2
    cam.location = (c.x, c.y - dist, float(os.environ.get('FACEZ', '0.15'))); cam.rotation_euler = (math.radians(90), 0, 0)
else:
    cam.location = (c.x, c.y - dist, c.z + h * 0.05); cam.rotation_euler = (math.radians(90 - math.degrees(math.atan2(h * 0.05, dist))), 0, 0)
def area(name, loc, power, size, color=(1, 1, 1)):
    Lg = bpy.data.lights.new(name, 'AREA'); Lg.energy = power; Lg.size = size; Lg.color = color
    ob = bpy.data.objects.new(name, Lg); s.collection.objects.link(ob); ob.location = loc
    ob.rotation_euler = (c - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
area('key', (c.x - h * 0.9, c.y - h * 2.2, c.z + h * 1.4), float(os.environ.get('KEY', '72')) * h * h, h * float(os.environ.get('KEYS', '1.6')), (1.0, 0.98, 0.96))
area('fill', (c.x + h * 1.6, c.y - h * 1.6, c.z + h * 0.3), 28 * h * h, h * 2.0, (0.94, 0.94, 1.0))
area('rim', (c.x + h * 0.3, c.y + h * 1.8, c.z + h * 1.2), 50 * h * h, h * 1.0)
FR = float(os.environ.get('FRONT', '22')); area('front', (c.x, c.y - h * 3.5, c.z + h * 0.2), FR * h * h, h * 2.4, (1.0, 0.98, 0.97))
area('under', (c.x, c.y - h * 1.6, c.z - h * 0.2), float(os.environ.get('UNDER', '0')) * h * h, h * 1.2, (1.0, 0.97, 0.95))
wd = bpy.data.worlds.new('w'); s.world = wd; wd.use_nodes = True
wd.node_tree.nodes['Background'].inputs[0].default_value = (0.98, 0.96, 0.95, 1); wd.node_tree.nodes['Background'].inputs[1].default_value = float(os.environ.get('WORLD', '0.22'))
if view == 'three':
    piv = bpy.data.objects.new('piv', None); s.collection.objects.link(piv); piv.location = (c.x, c.y, 0)
    for ob in list(s.objects):
        if ob.type == 'MESH' or ob.type == 'CURVE':
            ob.parent = piv; ob.matrix_parent_inverse = piv.matrix_world.inverted()
    piv.rotation_euler[2] = math.radians(24)
s.render.resolution_x = 600 if view != 'face' else 800; s.render.resolution_y = 1200 if view != 'face' else 800
s.render.engine = 'CYCLES'; s.cycles.device = 'CPU'; s.cycles.samples = int(os.environ.get('SAMPLES', '64')); s.cycles.use_denoising = True
s.render.film_transparent = True; s.view_settings.view_transform = 'Standard'
s.render.filepath = out; bpy.ops.render.render(write_still=True); print('rendered', out)
