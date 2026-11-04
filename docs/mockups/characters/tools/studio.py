# Blender studio render of a figure: soft key, fill and rim area lights, clay-like matte skin with a little
# subsurface glow, transparent background. python3 studio.py in.glb out.png [view: front|three] [look: standard|agx]
import sys, math, bpy
from mathutils import Vector
glb, out = sys.argv[1], sys.argv[2]
view = sys.argv[3] if len(sys.argv) > 3 else 'front'; look = sys.argv[4] if len(sys.argv) > 4 else 'agx'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
# Tripo's figures face +X in glTF, which the importer keeps as +X; turn them to face -Y (Blender's front)
root = [o for o in bpy.context.scene.objects if o.parent is None]
for o in root:
    o.rotation_mode = 'XYZ'; o.rotation_euler[2] += math.radians(-90)
bpy.context.view_layer.update()
pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))); hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
c = (lo + hi) / 2; h = hi.z - lo.z
import os
tex_dir = os.environ.get('TEXDIR', '')          # color.png, rough.png, coat.png replace the model's maps
smooth = float(os.environ.get('SMOOTH', '0'))   # Blender smooth modifier factor (0 = off)
def img(name):
    p = os.path.join(tex_dir, name); return bpy.data.images.load(p) if tex_dir and os.path.exists(p) else None
import bmesh
for o in objs:
    if smooth > 0:
        bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5); bm.to_mesh(o.data); bm.free()
        md = o.modifiers.new('smooth', 'SMOOTH'); md.factor = smooth; md.iterations = 4
        bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier='smooth')
    for m in o.data.materials:
        if not m or not m.use_nodes: continue
        nt = m.node_tree; b = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if not b: continue
        for key in ('Roughness', 'Metallic', 'Normal'):
            for l in list(b.inputs[key].links): nt.links.remove(l)
        b.inputs['Roughness'].default_value = 0.62; b.inputs['Metallic'].default_value = 0.0
        b.inputs['Subsurface Weight'].default_value = 0.12; b.inputs['Subsurface Radius'].default_value = (1.0, 0.45, 0.25)
        b.inputs['Subsurface Scale'].default_value = 0.02 * h
        if 'Specular IOR Level' in b.inputs: b.inputs['Specular IOR Level'].default_value = 0.4
        if os.environ.get('CLAY'):
            for l in list(b.inputs['Base Color'].links): nt.links.remove(l)
            b.inputs['Base Color'].default_value = (0.75, 0.72, 0.7, 1); b.inputs['Roughness'].default_value = 0.7; continue
        col = img('color.png'); rough = img('rough.png'); coat = img('coat.png'); spec = img('spec.png')
        if col:
            for l in list(b.inputs['Base Color'].links): nt.links.remove(l)
            t = nt.nodes.new('ShaderNodeTexImage'); t.image = col; nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
        if rough:
            t = nt.nodes.new('ShaderNodeTexImage'); t.image = rough; rough.colorspace_settings.name = 'Non-Color'
            nt.links.new(t.outputs['Color'], b.inputs['Roughness'])
        if coat:
            t = nt.nodes.new('ShaderNodeTexImage'); t.image = coat; coat.colorspace_settings.name = 'Non-Color'
            nt.links.new(t.outputs['Color'], b.inputs['Coat Weight']); b.inputs['Coat Roughness'].default_value = 0.12
        if spec and 'Specular IOR Level' in b.inputs:
            t = nt.nodes.new('ShaderNodeTexImage'); t.image = spec; spec.colorspace_settings.name = 'Non-Color'
            nt.links.new(t.outputs['Color'], b.inputs['Specular IOR Level'])
s = bpy.context.scene
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); s.collection.objects.link(cam); s.camera = cam
cam.data.lens = 120; d = h * 4.6
cam.location = (c.x, c.y - d, c.z + h * 0.05); cam.rotation_euler = (math.radians(90 - math.degrees(math.atan2(h * 0.05, d))), 0, 0)
def area(name, loc, power, size, color=(1, 1, 1)):
    L = bpy.data.lights.new(name, 'AREA'); L.energy = power; L.size = size; L.color = color
    o = bpy.data.objects.new(name, L); s.collection.objects.link(o); o.location = loc
    dvec = (c - Vector(loc)); o.rotation_euler = dvec.to_track_quat('-Z', 'Y').to_euler()
area('key', (c.x - h * 0.9, c.y - h * 2.2, c.z + h * 1.4), 72 * h * h, h * 1.6, (1.0, 0.98, 0.96))
area('fill', (c.x + h * 1.6, c.y - h * 1.6, c.z + h * 0.3), 28 * h * h, h * 2.0, (0.94, 0.94, 1.0))
area('rim', (c.x + h * 0.3, c.y + h * 1.8, c.z + h * 1.2), 50 * h * h, h * 1.0)
area('front', (c.x, c.y - h * 3.5, c.z + h * 0.2), 22 * h * h, h * 2.4, (1.0, 0.98, 0.97))
w = bpy.data.worlds.new('w'); s.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.98, 0.96, 0.95, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.22
s.render.resolution_x = 600; s.render.resolution_y = 1200
def add_decal(path, box, name, lift):
    # A copy of the model's camera-facing faces inside a screen box (drawing px, 1200 x 2400), lifted off the
    # surface, with picture coordinates from the camera: the picture lands exactly where it sits on screen.
    U0, U1, V0, V1 = box[0] / 1200, box[2] / 1200, 1 - box[3] / 2400, 1 - box[1] / 2400
    src = objs[0]
    bm = bmesh.new(); bm.from_mesh(src.data); bm.transform(src.matrix_world); bm.normal_update()
    inv = cam.matrix_world.inverted(); tanh = (cam.data.sensor_width / 2) / cam.data.lens
    def proj(p):
        q = inv @ p; return 0.5 + (q.x / -q.z) / (2 * tanh * (s.render.resolution_x / s.render.resolution_y)), 0.5 + (q.y / -q.z) / (2 * tanh)
    uv_of = {v.index: proj(v.co) for v in bm.verts}
    # the drawing was fitted to the browser render's figure box (x 64..534, y 25..1191 of 600 x 1200); map through the boxes
    us_all = [uv_of[i][0] for i in uv_of]; vs_all = [uv_of[i][1] for i in uv_of]
    umin, umax, vmin, vmax = min(us_all), max(us_all), min(vs_all), max(vs_all)
    k = (vmax - vmin) / ((1191 - 25) / 1200); uc, vc = (umin + umax) / 2, (vmin + vmax) / 2
    uc_t, vc_t = (64 + 534) / 2 / 600, 1 - (25 + 1191) / 2 / 1200
    U0, U1 = uc + (U0 - uc_t) * k, uc + (U1 - uc_t) * k
    V0, V1 = vc + (V0 - vc_t) * k, vc + (V1 - vc_t) * k
    view = (c - cam.location).normalized()
    sign = 1 if sum(f.normal.dot(f.calc_center_median() - c) for f in bm.faces[:5000]) > 0 else -1
    sel = [f for f in bm.faces if all(U0 <= uv_of[v.index][0] <= U1 and V0 <= uv_of[v.index][1] <= V1 for v in f.verts) and sign * f.normal.dot(view) < -0.12]
    vmap = {}; verts = []; faces = []
    for f in sel:
        idx = []
        for v in f.verts:
            if v.index not in vmap: vmap[v.index] = len(verts); verts.append(v.co - view * (lift * h))
            idx.append(vmap[v.index])
        faces.append(idx)
    me = bpy.data.meshes.new(name); me.from_pydata([tuple(v) for v in verts], [], faces); me.update()
    invm = {v: k_ for k_, v in vmap.items()}
    uvl = me.uv_layers.new(name='proj')
    for poly in me.polygons:
        for li in poly.loop_indices:
            vi = me.loops[li].vertex_index; u, vv = uv_of[invm[vi]]
            uvl.data[li].uv = ((u - U0) / (U1 - U0), (vv - V0) / (V1 - V0))
    pl = bpy.data.objects.new(name, me); s.collection.objects.link(pl)
    dm = bpy.data.materials.new(name); dm.use_nodes = True; dm.blend_method = 'BLEND'
    nt = dm.node_tree; bsdf = nt.nodes['Principled BSDF']; t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(path)
    t.extension = 'CLIP'
    nt.links.new(t.outputs['Color'], bsdf.inputs['Base Color']); nt.links.new(t.outputs['Alpha'], bsdf.inputs['Alpha'])
    bsdf.inputs['Roughness'].default_value = 0.55
    if 'Specular IOR Level' in bsdf.inputs: bsdf.inputs['Specular IOR Level'].default_value = 0.15
    me.materials.append(dm); pl.visible_shadow = False
    for p_ in me.polygons: p_.use_smooth = True
    bm.free()
    pl.parent = root[0]; pl.matrix_parent_inverse = root[0].matrix_world.inverted()
    print(name, 'faces', len(sel))
decal = os.environ.get('DECAL', '')
if decal:
    bpy.context.view_layer.update()
    add_decal(decal, (300, 680, 900, 1140), 'face_decal', 0.006)
badge = os.environ.get('BADGE', '')
if badge:
    bpy.context.view_layer.update()
    # a flat card in front of the chest, at the badge bump's place on screen and its depth
    box = (650, 1244, 748, 1318)
    src = objs[0]; inv = cam.matrix_world.inverted(); tanh = (cam.data.sensor_width / 2) / cam.data.lens
    asp = s.render.resolution_x / s.render.resolution_y
    def proj(p):
        q = inv @ p; return 0.5 + (q.x / -q.z) / (2 * tanh * asp), 0.5 + (q.y / -q.z) / (2 * tanh)
    pts = [src.matrix_world @ v.co for v in src.data.vertices]
    uvs = [proj(p) for p in pts]
    umin, umax = min(u for u, v in uvs), max(u for u, v in uvs); vmin, vmax = min(v for u, v in uvs), max(v for u, v in uvs)
    k = (vmax - vmin) / ((1191 - 25) / 1200); uc, vc = (umin + umax) / 2, (vmin + vmax) / 2
    uc_t, vc_t = (64 + 534) / 2 / 600, 1 - (25 + 1191) / 2 / 1200
    U0, U1 = uc + (box[0] / 1200 - uc_t) * k, uc + (box[2] / 1200 - uc_t) * k
    V0, V1 = vc + (1 - box[3] / 2400 - vc_t) * k, vc + (1 - box[1] / 2400 - vc_t) * k
    inbox = [p for p, (u, v) in zip(pts, uvs) if U0 <= u <= U1 and V0 <= v <= V1]
    yf = min(p.y for p in inbox) - 0.004 * h
    # world x and z from screen u, v at that depth: the camera looks along +y with a slight tilt; near enough to use the centre scale
    d_ = yf - cam.location.y; W_ = 2 * tanh * asp * d_; H_ = 2 * tanh * d_
    xa, xb = cam.location.x + (U0 - 0.5) * W_, cam.location.x + (U1 - 0.5) * W_
    za, zb = cam.location.z + (V0 - 0.5) * H_, cam.location.z + (V1 - 0.5) * H_
    bpy.ops.mesh.primitive_plane_add(size=1); pl = bpy.context.active_object; pl.name = 'badge_card'
    cxm = sum(p.x for p in inbox) / len(inbox); czm = sum(p.z for p in inbox) / len(inbox)
    pl.scale = (xb - xa, zb - za, 1); pl.rotation_euler = (math.radians(90), 0, 0); pl.location = (cxm, yf, czm)
    dm = bpy.data.materials.new('badge'); dm.use_nodes = True; dm.blend_method = 'BLEND'
    nt = dm.node_tree; bsdf = nt.nodes['Principled BSDF']; t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(badge); t.extension = 'CLIP'
    nt.links.new(t.outputs['Color'], bsdf.inputs['Base Color']); nt.links.new(t.outputs['Alpha'], bsdf.inputs['Alpha']); bsdf.inputs['Roughness'].default_value = 0.5
    pl.data.materials.append(dm); pl.visible_shadow = False
    pl.parent = root[0]; pl.matrix_parent_inverse = root[0].matrix_world.inverted()
    print('badge card at', tuple(round(q, 3) for q in pl.location), 'size', round(xb - xa, 3), round(zb - za, 3))
if view == 'three':
    for o in root: o.rotation_euler[2] += math.radians(24)
    bpy.context.view_layer.update()
s.render.engine = 'CYCLES'; s.cycles.device = 'CPU'; s.cycles.samples = int(os.environ.get('SAMPLES', '96')); s.cycles.use_denoising = True
s.render.film_transparent = True
s.view_settings.view_transform = 'AgX' if look == 'agx' else 'Standard'
if look == 'agx': s.view_settings.look = 'AgX - Medium High Contrast'
s.render.filepath = out; bpy.ops.render.render(write_still=True); print('rendered', out)
