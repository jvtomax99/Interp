# Face pieces for the toy nurse, run inside toy.py (o, c, h, s, D in scope). Layout measured on the drawing's
# nurse crop (px, 1 px = 1.016 mm at the figure's height), anchored on the model's own nose tip.
from PIL import Image, ImageDraw
MM = 0.978 / 963
def mat(name, rgb, rough=0.5, coat=0.0):
    m_ = bpy.data.materials.new(name); m_.use_nodes = True; b_ = m_.node_tree.nodes['Principled BSDF']
    b_.inputs['Base Color'].default_value = (*[(q / 255) ** 2.2 for q in rgb], 1); b_.inputs['Roughness'].default_value = rough
    b_.inputs['Coat Weight'].default_value = coat; b_.inputs['Coat Roughness'].default_value = 0.08
    return m_
NOSE_D = (242, 385)
def nose_tip():
    best = None
    for v in o.data.vertices:
        p = v.co
        if abs(p.x - c.x) < 0.02 and 0.08 < p.z < 0.15 and (best is None or p.y < best.y): best = p.copy()
    return best
nt_ = nose_tip(); print('nose tip', tuple(round(q, 4) for q in nt_))
def D2M(px, py):           # drawing px -> model (x, z)
    return nt_.x + (px - NOSE_D[0]) * MM, nt_.z - (py - NOSE_D[1]) * MM
# --- smooth the face (Tripo's sockets, mouth crease, chin fold), the nose kept
# a smooth height field fitted to the face (y as a polynomial of x and z), blended in: no sockets, creases or spikes
x0, z0 = D2M(116, 296); x1, z1 = D2M(368, float(os.environ.get('FBOT', '458')))
sel = []
for v in o.data.vertices:
    p = v.co
    if p.y < c.y and x0 < p.x < x1 and z1 < p.z < z0 and v.normal.y < -0.15: sel.append(v.index)
NY = np.array([-o.data.vertices[i].normal.y for i in sel])
X = np.array([[o.data.vertices[i].co.x, o.data.vertices[i].co.z, o.data.vertices[i].co.y] for i in sel])
dn = np.hypot(X[:, 0] - nt_.x, X[:, 1] - nt_.z)
def feats(xx, zz, deg=int(os.environ.get('FDEG', '4'))):
    u = (xx - nt_.x) / 0.1; w = (zz - nt_.z) / 0.1
    return np.stack([u ** i * w ** j for i in range(deg + 1) for j in range(deg + 1 - i)], -1)
fit = dn > 0.02
coef, *_ = np.linalg.lstsq(feats(X[fit, 0], X[fit, 1]), X[fit, 2], rcond=None)
yfit = feats(X[:, 0], X[:, 1]) @ coef
edge = np.minimum.reduce([X[:, 0] - x0, x1 - X[:, 0], X[:, 1] - z1, z0 - X[:, 1]]) / 0.018
wgt = np.clip(edge, 0, 1) * np.clip((NY - 0.2) / 0.3, 0, 1)
wgt = wgt * wgt * (3 - 2 * wgt)
for k, i in enumerate(sel):
    o.data.vertices[i].co.y = float(wgt[k] * yfit[k] + (1 - wgt[k]) * X[k, 2])
o.data.update()
# the nose: a small clay ball where Tripo's was, like the drawing's button nose
ny_fit = float((feats(np.array([nt_.x]), np.array([nt_.z])) @ coef)[0])
bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=48, ring_count=24); nob = bpy.context.active_object; nob.name = 'nose'
NR = float(os.environ.get('NOSER', '0.0085'))
nob.scale = (NR, NR * 0.85, NR * 0.9); nob.location = (nt_.x, ny_fit - NR * 0.25, nt_.z + 0.002)
for p_ in nob.data.polygons: p_.use_smooth = True
nob.data.materials.append(mat('noseskin', (236, 134, 70), 0.5))
print('face fit verts', len(sel), 'rms', float(np.sqrt(np.mean((yfit[fit] - X[fit, 2]) ** 2))))
bpy.context.view_layer.update()
def hit(mx, mz):
    ok, loc, nrm, fi = o.ray_cast(Vector((mx, c.y - 1.0, mz)), Vector((0, 1, 0)))
    return (loc, nrm) if ok and loc.y < c.y else (None, None)
def tube(name, pts2d, radii, lift, material, flat=1.0):
    pts = []
    for (px, py) in pts2d:
        mx, mz = D2M(px, py); loc, nrm = hit(mx, mz)
        if loc is None: continue
        pts.append(loc + nrm * lift)
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 1.0; cu.bevel_resolution = 4; cu.use_fill_caps = True
    sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        sp.points[i].co = (p.x, p.y, p.z, 1); sp.points[i].radius = radii[min(i, len(radii) - 1)] if isinstance(radii, list) else radii
    ob = bpy.data.objects.new(name, cu); s.collection.objects.link(ob); cu.materials.append(material)
    print("TUBE", name, len(pts2d), len(pts), [tuple(round(q, 3) for q in p) for p in pts[::max(1, len(pts)//4)]])
    # flatten the tube toward the face (scale along y about its own centre)
    if flat != 1.0:
        cy = sum(p.y for p in pts) / len(pts)
        for i, p in enumerate(pts): sp.points[i].co = (p.x, cy + (p.y - cy), p.z, 1)
    return ob
def smoothpath(ctrl, n=24):
    # Catmull-Rom through control points
    out_ = []
    P_ = [ctrl[0]] + ctrl + [ctrl[-1]]
    for i in range(1, len(P_) - 2):
        for k in range(n):
            t_ = k / n; p0, p1, p2, p3 = P_[i - 1], P_[i], P_[i + 1], P_[i + 2]
            out_.append(tuple(0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t_ + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t_ ** 2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t_ ** 3) for j in (0, 1)))
    out_.append(ctrl[-1]); return out_
FEAT = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'features.json')))
dark = mat('lid', (28, 22, 24), 0.35, 0.3); browm = mat('brow', (34, 28, 30), 0.5); mouthm = mat('mouth', (125, 52, 45), 0.5)
# --- eyes: a dome conformed to the face, textured with the iris
def eye_tex(path, side):
    W = 512; im = Image.new('RGB', (W, W), (246, 243, 240)); dr = ImageDraw.Draw(im)
    E = FEAT['eye']; icx = W / 2 + side * E['iris_dx'] * W; icy = W / 2 + E['iris_dy'] * W; ir = E['iris_r'] * W
    for k in range(60, 0, -1):     # iris: dark rim to warm middle, lighter low
        f = k / 60; col = tuple(int(a + (b - a) * (1 - f) ** 1.5) for a, b in zip((42, 20, 12), (128, 70, 34)))
        dr.ellipse((icx - ir * f, icy - ir * f + (1 - f) * ir * 0.15, icx + ir * f, icy + ir * f + (1 - f) * ir * 0.15), fill=col)
    pr = E['pupil_r'] * W; dr.ellipse((icx - pr, icy - pr, icx + pr, icy + pr), fill=(26, 14, 10))
    hx = icx + side * E['hl_dx'] * W; hy = icy + E['hl_dy'] * W; hr = E['hl_r'] * W
    dr.ellipse((hx - hr, hy - hr, hx + hr, hy + hr), fill=(255, 255, 255))
    hr2 = hr * 0.45; hx2 = icx - side * E['hl_dx'] * W * 0.6; hy2 = icy + E['hl_dx'] * W * 0.9
    dr.ellipse((hx2 - hr2, hy2 - hr2, hx2 + hr2, hy2 + hr2), fill=(250, 246, 242))
    im.save(path)
def eye(name, cx_, cy_, w_, h_, side):
    path = os.path.join(D, f'{name}.png'); eye_tex(path, side)
    n = 40; verts = []; uvs = []; faces = []; idx = {}
    for i in range(n + 1):
        for j in range(n + 1):
            u = i / n; v = j / n; ex = (u - 0.5) * 2; ez = (v - 0.5) * 2
            r2 = ex * ex + ez * ez
            if r2 > 1.0: ex, ez = ex / math.sqrt(r2), ez / math.sqrt(r2); r2 = 1.0
            px = cx_ + ex * w_ / 2; py = cy_ - ez * h_ / 2
            mx, mz = D2M(px, py); loc, nrm = hit(mx, mz)
            if loc is None: loc, nrm = Vector((mx, c.y - 0.1, mz)), Vector((0, -1, 0))
            dome = FEAT['eye']['dome'] * math.sqrt(max(0.0, 1 - r2)) + 0.0004
            idx[(i, j)] = len(verts); verts.append(loc + nrm * dome); uvs.append((0.5 + ex / 2, 0.5 + ez / 2))
    for i in range(n):
        for j in range(n): faces.append((idx[(i, j)], idx[(i + 1, j)], idx[(i + 1, j + 1)], idx[(i, j + 1)]))
    me = bpy.data.meshes.new(name); me.from_pydata([tuple(v) for v in verts], [], faces); me.update()
    uvl = me.uv_layers.new(name='uv')
    for poly in me.polygons:
        poly.use_smooth = True
        for li in poly.loop_indices: uvl.data[li].uv = uvs[me.loops[li].vertex_index]
    mm_ = bpy.data.materials.new(name); mm_.use_nodes = True; bb = mm_.node_tree.nodes['Principled BSDF']
    tt = mm_.node_tree.nodes.new('ShaderNodeTexImage'); tt.image = bpy.data.images.load(path); tt.extension = 'EXTEND'
    mm_.node_tree.links.new(tt.outputs[0], bb.inputs['Base Color']); bb.inputs['Roughness'].default_value = 0.25
    bb.inputs['Coat Weight'].default_value = 0.35; bb.inputs['Coat Roughness'].default_value = 0.05
    me.materials.append(mm_); ob = bpy.data.objects.new(name, me); s.collection.objects.link(ob)
for k, side in (('eye_l', 1), ('eye_r', -1)):
    E = FEAT[k]; eye(k, E['cx'], E['cy'], E['w'], E['h'], side)
    lid = [(E['cx'] + E['w'] / 2 * 1.03 * math.cos(math.radians(a)), E['cy'] - E['h'] / 2 * 1.03 * math.sin(math.radians(a))) for a in (range(180, -1, -10) if side == 1 else range(0, 181, 10))]
    outer = lid[0]; fl = (outer[0] - side * E['w'] * 0.16, outer[1] - E['h'] * 0.18)
    lidpts = [fl] + lid if True else lid
    rad = [0.0008] + [0.0029 - 0.0016 * (i / len(lid)) ** 1.4 for i in range(len(lid))]
    tube(k + '_lid', smoothpath(lidpts, 3), rad, FEAT['eye']['dome'] * 0.55, dark)
for k in ('brow_l', 'brow_r'):
    B = FEAT[k]; pts = smoothpath([tuple(q) for q in B['pts']], 8)
    rr = [0.0036 * math.sin(math.pi * (0.12 + 0.76 * i / (len(pts) - 1))) for i in range(len(pts))]
    tube(k, pts, rr, 0.0006, browm)
M_ = FEAT['mouth']; mp = smoothpath([tuple(q) for q in M_['pts']], 8)
tube('mouth', mp, [0.0012 * math.sin(math.pi * (0.1 + 0.8 * i / (len(mp) - 1))) for i in range(len(mp))], 0.0007, mouthm)
# --- badge: a rounded white card on the chest
Bd = FEAT['badge']; bx, bz = D2M(*Bd['c']); loc, nrm = hit(bx, bz)
ys_ = [hit(bx + dx * Bd['w'] * MM / 2, bz + dz * Bd['h'] * MM / 2)[0] for dx in (-1, 0, 1) for dz in (-1, 0, 1)]
ys_ = [q.y for q in ys_ if q is not None]
if loc is not None: loc = Vector((loc.x, min(ys_) + 0.0004, loc.z))
if loc is not None:
    bpy.ops.mesh.primitive_cube_add(size=1); bo = bpy.context.active_object; bo.name = 'badge'
    bo.scale = (Bd['w'] * MM, 0.003, Bd['h'] * MM); bo.location = loc + Vector((0, -0.0012, 0)); bo.rotation_euler = (math.radians(-8), 0, 0)
    bv = bo.modifiers.new('bv', 'BEVEL'); bv.width = 0.0012; bv.segments = 4
    bo.data.materials.append(mat('badge', (246, 244, 240), 0.45))
    for p in bo.data.polygons: p.use_smooth = True
# --- blush: pink mixed into the skin by distance to two cheek points, in the shader
cheeks = []
for q in FEAT['cheeks']:
    loc, nrm = hit(*D2M(*q))
    if loc is not None: cheeks.append(loc)
ntm = o.data.materials[0].node_tree; bsdf = ntm.nodes['Principled BSDF']; base_link = bsdf.inputs['Base Color'].links[0]; src = base_link.from_socket
geo = ntm.nodes.new('ShaderNodeNewGeometry'); acc = None
for ch in cheeks:
    dist_ = ntm.nodes.new('ShaderNodeVectorMath'); dist_.operation = 'DISTANCE'; dist_.inputs[1].default_value = ch
    ntm.links.new(geo.outputs['Position'], dist_.inputs[0])
    mr = ntm.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = 0.0; mr.inputs['From Max'].default_value = FEAT['blush_r'] * MM
    mr.inputs['To Min'].default_value = FEAT['blush_a']; mr.inputs['To Max'].default_value = 0.0; mr.interpolation_type = 'SMOOTHSTEP'
    ntm.links.new(dist_.outputs['Value'], mr.inputs['Value'])
    if acc is None: acc = mr.outputs['Result']
    else:
        mx_ = ntm.nodes.new('ShaderNodeMath'); mx_.operation = 'MAXIMUM'; ntm.links.new(acc, mx_.inputs[0]); ntm.links.new(mr.outputs['Result'], mx_.inputs[1]); acc = mx_.outputs[0]
if acc is not None:
    mix = ntm.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MIX'
    ntm.links.new(acc, mix.inputs['Factor']); ntm.links.new(src, mix.inputs['A']); mix.inputs['B'].default_value = (0.72, 0.14, 0.11, 1)
    ntm.links.new(mix.outputs['Result'], bsdf.inputs['Base Color'])
