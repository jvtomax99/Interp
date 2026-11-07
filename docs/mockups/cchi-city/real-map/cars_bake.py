# The campus's moving cars and ambulances (Jose, 2026-11-03: "cars on the road only"): Kenney's Car Kit models (CC0,
# ../assets/kenney-car-kit/) baked into cars.json, which build.py puts into the page. Each model becomes two meshes:
# its paint (repainted in the car's own colour at run time) and everything else (its own colours, per vertex). Turned
# to face +z like the hand-built cars, sized to their length (car 1.0, ambulance 1.64) but never wider than they were
# (0.52, 0.64: wider ones clipped each other at the drive's mouth, traffic_check.cjs), wheels on the ground at y 0.1.
# The parked cars (lots, garage roofs, the drive's curb; Jose, 2026-11-03) get a slimmed copy of four of them under
# 'park': the old parked car's size (0.95 long, at most 0.48 wide), no faces underneath (nobody sees under a parked
# car), and each wheel a 10-sided drum with its hub on the outside instead of the kit's 284 triangles (a wheel is a
# few pixels at the board's scale). About 1,790 triangles down to about 600 each; ~160 of them stand on the board.
#   python3 cars_bake.py            (numpy only)
#   then: node ambulance_bake.cjs   (the ambulance is Meshy's since 2026-11-06; this script writes the kit's back)
import base64, json, os, struct
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); KIT = os.path.join(HERE, '..', 'assets', 'kenney-car-kit')
MODELS = {'sedan': 1.0, 'suv': 1.0, 'van': 1.0, 'hatchbackSports': 1.0, 'taxi': 1.0, 'ambulance': 1.64}
MAXW = {'ambulance': 0.64}   # the rest 0.52
CENTRE_Z = {'ambulance': 0.17}   # the hand-built ambulance runs from -0.65 to 0.99
PARK = ['sedan', 'suv', 'hatchbackSports', 'van']   # the parked copies (no taxis: the parked colours have no yellow)
SIDES = 10

def glb(path):
    b = open(path, 'rb').read(); n = struct.unpack_from('<I', b, 12)[0]; j = json.loads(b[20:20 + n])
    o = 20 + n; bn = struct.unpack_from('<I', b, o)[0]; bin_ = b[o + 8:o + 8 + bn]
    def acc(i):
        a = j['accessors'][i]; v = j['bufferViews'][a['bufferView']]; dt = {5126: np.float32, 5123: np.uint16, 5125: np.uint32, 5121: np.uint8}[a['componentType']]
        k = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a['type']]; off = v.get('byteOffset', 0) + a.get('byteOffset', 0)
        return np.frombuffer(bin_, dt, a['count']*k, off).reshape(a['count'], k) if k > 1 else np.frombuffer(bin_, dt, a['count'], off)
    return j, acc

def mat4(nd):
    if 'matrix' in nd: return np.array(nd['matrix'], np.float64).reshape(4, 4).T
    t = nd.get('translation', [0, 0, 0]); x, y, z, w = nd.get('rotation', [0, 0, 0, 1]); s = nd.get('scale', [1, 1, 1])
    R = np.array([[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)], [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)], [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]])
    M = np.eye(4); M[:3, :3] = R*np.array(s); M[:3, 3] = t; return M

def bake(name, length, park=False):
    j, acc = glb(os.path.join(KIT, name + '.glb')); mats = j['materials']; tris = []   # (positions, indices, material index, wheel node or None)
    def walk(i, P, wh=None):
        nd = j['nodes'][i]; M = P @ mat4(nd); wh = wh if wh is not None else (i if nd.get('name', '').startswith('wheel') else None)
        if 'mesh' in nd:
            for pr in j['meshes'][nd['mesh']]['primitives']:
                p = acc(pr['attributes']['POSITION']).astype(np.float64); p = (np.c_[p, np.ones(len(p))] @ M.T)[:, :3]
                ix = acc(pr['indices']).astype(np.int64).reshape(-1, 3) if 'indices' in pr else np.arange(len(p)).reshape(-1, 3)
                tris.append((p, ix, pr.get('material', 0), wh))
        for c in nd.get('children', []): walk(c, M, wh)
    for r in j['scenes'][j.get('scene', 0)]['nodes']: walk(r, np.eye(4))
    allp = np.concatenate([p[ix].reshape(-1, 3) for p, ix, _, _ in tris]); lo, hi = allp.min(0), allp.max(0)
    # face +z: the front lights sit at the front
    fr = [p[ix].reshape(-1, 3)[:, 2].mean() for p, ix, m, _ in tris if mats[m]['name'] == 'lightFront']
    flip = bool(fr) and np.mean(fr) < (lo[2] + hi[2])/2
    k = min(length/(hi[2] - lo[2]), (0.48 if park else MAXW.get(name, 0.52))/(hi[0] - lo[0])); cz = 0.0 if park else CENTRE_Z.get(name, 0.0)
    def place(p):
        q = (p - [(lo[0] + hi[0])/2, lo[1], (lo[2] + hi[2])/2])*k
        if flip: q[:, 0] *= -1; q[:, 2] *= -1
        q[:, 1] += 0.1; q[:, 2] += cz; return q
    out = {}
    if name == 'ambulance' and not park:   # where its light bar's two blue lamps are, for the flashing lamps (ambLights)
        L = np.concatenate([place(p[ix].reshape(-1, 3)) for p, ix, m, _ in tris if mats[m]['name'] == 'lightBlue'])
        out['lamps'] = [[round(float(v), 3) for v in L[L[:, 0]*sg > 0].mean(0)] for sg in (-1, 1)]
        out['top'] = round(float(L[:, 1].max()), 3); print('lamps', out['lamps'], 'top', out['top'])
    srgb = lambda m: np.round(np.clip(mats[m].get('pbrMetallicRoughness', {}).get('baseColorFactor', [1, 1, 1, 1])[:3], 0, 1)**(1/2.2)*255)   # linear factor -> sRGB bytes
    if park:   # every wheel becomes a drum: its own box gives its centre, radius, width and which side is outside
        mid = {mats[m]['name']: m for _, _, m, _ in tris}; drums = []
        for w in sorted({wh for *_, wh in tris if wh is not None}):
            W = np.concatenate([place(p[np.unique(ix)]) for p, ix, _, wh in tris if wh == w]); a, b = W.min(0), W.max(0); c = (a + b)/2; ext = b - a
            ax = 0 if ext[0] <= ext[2] else 2; o = 2 - ax; r = max(ext[1], ext[o])/2; hw = ext[ax]/2
            out_s = 1.0 if c[ax] >= 0 else -1.0; drums.append(drum(c, r, hw, ax, out_s, srgb(mid['carTire']), srgb(mid.get('wheelInside', mid['carTire']))))
        tris = [t for t in tris if t[3] is None]
    for part in ('paint', 'rest'):
        P, I, C = [], [], []; n = 0
        for p, ix, m, _ in tris:
            nm = mats[m]['name']; isp = nm.startswith('paint') and not (name == 'ambulance' and nm == 'paintRed')   # the ambulance's red band keeps its red
            if (part == 'paint') != isp: continue
            if park:   # no faces underneath
                q3 = place(p.copy()); tri = q3[ix]; nrm = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0]); L = np.linalg.norm(nrm, axis=1) + 1e-12
                ix = ix[nrm[:, 1]/L > -0.7]
                if not len(ix): continue
            used = np.unique(ix); remap = {v: i for i, v in enumerate(used)}
            P.append(place(p[used])); I.append(np.vectorize(remap.get)(ix) + n); n += len(used)
            C.append(np.tile(srgb(m), (len(used), 1)))
        if park and part == 'rest':
            for dp, di, dc in drums: P.append(dp); I.append(di + n); C.append(dc); n += len(dp)
        if not P: continue
        P = np.concatenate(P); I = np.concatenate(I); C = np.concatenate(C)
        mn, mx = P.min(0), P.max(0); q = np.round((P - mn)/np.maximum(mx - mn, 1e-9)*65535).astype('<u2')
        # weld: one vertex per position and colour (the page draws flat faces, so shared vertices lose nothing)
        key = np.c_[q.astype(np.int64), C.astype(np.int64)]; key, inv = np.unique(key, axis=0, return_inverse=True)
        q, C, I = key[:, :3].astype('<u2'), key[:, 3:], inv.reshape(-1)[I]
        assert len(q) < 65536
        e = {'min': [round(v, 5) for v in mn], 'size': [round(v, 5) for v in (mx - mn)], 'pos': base64.b64encode(q.tobytes()).decode(),
             'idx': base64.b64encode(I.astype('<u2').tobytes()).decode()}
        if part == 'rest': e['col'] = base64.b64encode(C.astype(np.uint8).tobytes()).decode()
        out[part] = e
    print(name + (' (parked)' if park else ''), 'tris', sum(len(base64.b64decode(e['idx']))//6 for e in out.values() if isinstance(e, dict)), 'flip', flip, 'size', np.round((hi - lo)*k, 3).tolist())
    return out

def drum(c, r, hw, ax, out_s, tire, hub):   # a wheel: tread and an outer face (tyre ring, hub disc); its inner face is never seen
    o = 2 - ax; P, T, C = [], [], []
    def v(t, rad, s):   # a point at angle t, radius rad, side s (-1 inside, 1 outside) along the axle
        q = c.copy(); q[ax] += s*hw*out_s; q[1] += rad*np.cos(t); q[o] += rad*np.sin(t); return q
    def tri(a, b, d, col, want):   # keep each face pointing outward (want: the direction it should face)
        nrm = np.cross(b - a, d - a)
        if np.dot(nrm, want) < 0: b, d = d, b
        P.extend([a, b, d]); C.extend([col]*3)
    ang = [2*np.pi*i/SIDES for i in range(SIDES)]
    axv = np.zeros(3); axv[ax] = out_s
    for i in range(SIDES):
        t0, t1 = ang[i], ang[(i + 1) % SIDES]; tm = (t0 + t1)/2; rad = np.zeros(3); rad[1] = np.cos(tm); rad[o] = np.sin(tm)
        a, b, d, e = v(t0, r, -1), v(t1, r, -1), v(t1, r, 1), v(t0, r, 1)
        tri(a, b, d, tire, rad); tri(a, d, e, tire, rad)
        a, b, d, e = v(t0, r, 1), v(t1, r, 1), v(t1, r*0.6, 1), v(t0, r*0.6, 1)
        tri(a, b, d, tire, axv); tri(a, d, e, tire, axv)
        hc = c.copy(); hc[ax] += (hw + 0.002)*out_s; h0, h1 = v(t0, r*0.6, 1), v(t1, r*0.6, 1); h0[ax] += 0.002*out_s; h1[ax] += 0.002*out_s
        tri(hc, h0, h1, hub, axv)
    P = np.array(P); return P, np.arange(len(P)).reshape(-1, 3), np.array(C)

cars = {n: bake(n, L) for n, L in MODELS.items()}
cars['park'] = {n: bake(n, 0.95, park=True) for n in PARK}
s = json.dumps(cars, separators=(',', ':')); open(os.path.join(HERE, 'cars.json'), 'w').write(s); print('cars.json', len(s), 'bytes')
