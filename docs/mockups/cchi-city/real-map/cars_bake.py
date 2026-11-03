# The campus's moving cars and ambulances (Jose, 2026-11-03: "cars on the road only"): Kenney's Car Kit models (CC0,
# ../assets/kenney-car-kit/) baked into cars.json, which build.py puts into the page. Each model becomes two meshes:
# its paint (repainted in the car's own colour at run time) and everything else (its own colours, per vertex). Turned
# to face +z like the hand-built cars, sized to their length (car 1.0, ambulance 1.64) but never wider than they were
# (0.52, 0.64: wider ones clipped each other at the drive's mouth, traffic_check.cjs), wheels on the ground at y 0.1.
#   python3 cars_bake.py            (numpy only)
import base64, json, os, struct
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); KIT = os.path.join(HERE, '..', 'assets', 'kenney-car-kit')
MODELS = {'sedan': 1.0, 'suv': 1.0, 'van': 1.0, 'hatchbackSports': 1.0, 'taxi': 1.0, 'ambulance': 1.64}
MAXW = {'ambulance': 0.64}   # the rest 0.52
CENTRE_Z = {'ambulance': 0.17}   # the hand-built ambulance runs from -0.65 to 0.99

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

def bake(name, length):
    j, acc = glb(os.path.join(KIT, name + '.glb')); mats = j['materials']; tris = []   # (positions 3x3, material index)
    def walk(i, P):
        nd = j['nodes'][i]; M = P @ mat4(nd)
        if 'mesh' in nd:
            for pr in j['meshes'][nd['mesh']]['primitives']:
                p = acc(pr['attributes']['POSITION']).astype(np.float64); p = (np.c_[p, np.ones(len(p))] @ M.T)[:, :3]
                ix = acc(pr['indices']).astype(np.int64).reshape(-1, 3) if 'indices' in pr else np.arange(len(p)).reshape(-1, 3)
                tris.append((p, ix, pr.get('material', 0)))
        for c in nd.get('children', []): walk(c, M)
    for r in j['scenes'][j.get('scene', 0)]['nodes']: walk(r, np.eye(4))
    allp = np.concatenate([p[ix].reshape(-1, 3) for p, ix, _ in tris]); lo, hi = allp.min(0), allp.max(0)
    # face +z: the front lights sit at the front
    fr = [p[ix].reshape(-1, 3)[:, 2].mean() for p, ix, m in tris if mats[m]['name'] == 'lightFront']
    flip = bool(fr) and np.mean(fr) < (lo[2] + hi[2])/2
    k = min(length/(hi[2] - lo[2]), MAXW.get(name, 0.52)/(hi[0] - lo[0])); cz = CENTRE_Z.get(name, 0.0)
    def place(p):
        q = (p - [(lo[0] + hi[0])/2, lo[1], (lo[2] + hi[2])/2])*k
        if flip: q[:, 0] *= -1; q[:, 2] *= -1
        q[:, 1] += 0.1; q[:, 2] += cz; return q
    out = {}
    if name == 'ambulance':   # where its light bar's two blue lamps are, for the flashing lamps (ambLights)
        L = np.concatenate([place(p[ix].reshape(-1, 3)) for p, ix, m in tris if mats[m]['name'] == 'lightBlue'])
        out['lamps'] = [[round(float(v), 3) for v in L[L[:, 0]*sg > 0].mean(0)] for sg in (-1, 1)]
        out['top'] = round(float(L[:, 1].max()), 3); print('lamps', out['lamps'], 'top', out['top'])
    for part in ('paint', 'rest'):
        P, I, C = [], [], []; n = 0
        for p, ix, m in tris:
            nm = mats[m]['name']; isp = nm.startswith('paint') and not (name == 'ambulance' and nm == 'paintRed')   # the ambulance's red band keeps its red
            if (part == 'paint') != isp: continue
            used = np.unique(ix); remap = {v: i for i, v in enumerate(used)}
            P.append(place(p[used])); I.append(np.vectorize(remap.get)(ix) + n); n += len(used)
            col = mats[m].get('pbrMetallicRoughness', {}).get('baseColorFactor', [1, 1, 1, 1])[:3]
            C.append(np.tile(np.round(np.clip(col, 0, 1)**(1/2.2)*255), (len(used), 1)))   # linear factor -> sRGB bytes
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
    print(name, 'tris', sum(len(ix) for _, ix, _ in tris), 'flip', flip, 'size', np.round((hi - lo)*k, 3).tolist())
    return out

cars = {n: bake(n, L) for n, L in MODELS.items()}
s = json.dumps(cars, separators=(',', ':')); open(os.path.join(HERE, 'cars.json'), 'w').write(s); print('cars.json', len(s), 'bytes')
