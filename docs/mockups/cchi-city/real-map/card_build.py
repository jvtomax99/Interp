# Step 3 of the CoreCHI Practice card's pictures: card_render.py's renders cut into the card's files and its manifest.
#   python3.11 card_build.py <capdir> <renderdir> <outdir>     (bpy only to read the EXR files; numpy, Pillow)
# Writes <outdir>/*.webp at the card's size (960 x 840; the renders are twice that, halved here) and <outdir>/entrance.json,
# CAMPUS_MAP's new value (features/campus.js): the backdrop (sky), the board's shadow (far), the board with the domain
# buildings in white clay (near); each domain building's paint and lit windows at 1..10 tenths of its height; every
# moving thing's frames, its path as the camera sees it ([x, y, scale, seen]: seen 0 where something stands in front).
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
CAP, R, OUT = sys.argv[1:4]
os.makedirs(OUT, exist_ok=True)
C = json.load(open(os.path.join(CAP, 'card.json'))); P = json.load(open(os.path.join(R, 'proj.json')))
W, H, S = C['cam']['w'], C['cam']['h'], C['cam']['scale']
KEYS = ['e', 't', 's', 'n', 'c']
total = [0]

def exr(name):   # an EXR render as an H x W x 4 float array, top row first
    import bpy
    im = bpy.data.images.load(os.path.join(R, name)); w, h = im.size; a = np.empty(w*h*4, np.float32); im.pixels.foreach_get(a)
    bpy.data.images.remove(im); return a.reshape(h, w, 4)[::-1]
def png(name): return np.asarray(Image.open(os.path.join(R, name)).convert('RGBA'), np.float32)/255
def half(a):   # halve a straight-alpha RGBA float image, averaging in premultiplied colour
    h, w = a.shape[0]//2*2, a.shape[1]//2*2; a = a[:h, :w]; pm = a.copy(); pm[..., :3] *= pm[..., 3:4]
    q = pm.reshape(h//2, 2, w//2, 2, 4).mean(axis=(1, 3)); al = q[..., 3:4]
    q[..., :3] = np.where(al > 1e-4, q[..., :3]/np.maximum(al, 1e-4), 0); return q
def save(name, a, q=86, box=None, trim=True):
    # a: RGBA float at the card's size (or a crop of it at box's x, y); trimmed to what shows; returns [x, y, w, h]
    x, y = (box or (0, 0))[:2]
    if trim:
        ys, xs = np.nonzero(a[..., 3] > 2/255)
        if not len(xs): return None
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1; a = a[y0:y1, x0:x1]; x += int(x0); y += int(y0)
    im = Image.fromarray((np.clip(a, 0, 1)*255 + 0.5).astype(np.uint8), 'RGBA'); p = os.path.join(OUT, name)
    im.save(p, 'WEBP', quality=q, method=6, exact=False); total[0] += os.path.getsize(p)
    return [int(x), int(y), int(a.shape[1]), int(a.shape[0])]

# ---- the three depth layers ----
painted, clay = png('painted.png'), png('clay.png')
layers = {'near': save('near.webp', half(clay), 90, trim=False)}
g = np.zeros((H, W, 3), np.float32)
stops = [(0, '#5f95d0'), (0.3, '#93c0ec'), (0.55, '#c3def6'), (0.8, '#93c0ec'), (1, '#5f95d0')]   # the daylight card (app.css .cp-card)
hexc = lambda s: np.array([int(s[i:i+2], 16) for i in (1, 3, 5)], np.float32)/255
t = np.linspace(0, 1, H)
for (a, ca), (b, cb) in zip(stops, stops[1:]):
    m = (t >= a) & (t <= b); f = ((t[m] - a)/(b - a))[:, None]; g[m] = (hexc(ca)*(1 - f) + hexc(cb)*f)[:, None, :]
layers['sky'] = save('sky.webp', np.dstack([g, np.ones((H, W))]), 90, trim=False)
sh = Image.new('L', (W, H), 0); ImageDraw.Draw(sh).polygon([tuple(p) for p in P['board']], fill=255); sh = np.asarray(sh.filter(ImageFilter.GaussianBlur(26)), np.float32)/255
far = np.zeros((H, W, 4), np.float32); far[..., :3] = hexc('#283e64'); far[..., 3] = sh*0.22
layers['far'] = save('far.webp', far, 88, trim=False)

# ---- each domain building's paint and lit windows, 1..10 tenths of its height ----
height = exr('height.exr')[..., 0]; glow = exr('glow.exr')[..., :3]
diff = np.abs(painted[..., :3] - clay[..., :3]).max(axis=2) > 5/255
def blur(a, r):   # about a Gaussian of radius r: three box blurs along each axis
    k = max(1, int(r*0.9))
    for ax in (0, 1):
        for _ in range(3):
            c = np.cumsum(np.pad(a, [(k + 1, k) if i == ax else (0, 0) for i in range(a.ndim)], mode='edge'), axis=ax)
            a = (np.take(c, range(2*k + 1, c.shape[ax]), axis=ax) - np.take(c, range(0, c.shape[ax] - 2*k - 1), axis=ax))/(2*k + 1)
    return a
# Medical Plaza's badge sits a little to the left, off the lot car's spot on the garage deck beside it
NUDGE = {'c': (-60, 0)}
B = {}
for k in KEYS:
    full = exr(f'mask-{k}.exr')[..., 0]; b = C['box'][k]; top = b['top']
    ys, xs = np.nonzero(full > 0.02)
    # work in the building's box at full size (even-aligned, 48 px round it for the windows' bloom)
    X0, Y0 = max(0, xs.min() - 48)//2*2, max(0, ys.min() - 48)//2*2; X1, Y1 = min(full.shape[1], xs.max() + 50), min(full.shape[0], ys.max() + 50)
    sl = (slice(Y0, Y1), slice(X0, X1)); mask, hgt, pnt, dif, glw = full[sl], height[sl], painted[sl], diff[sl], glow[sl]
    seen = half(np.dstack([np.ones((*mask.shape, 3)), mask]))[..., 3]
    ys, xs = np.nonzero(seen > 0.3); ox, oy = X0//2, Y0//2
    B[k] = {'label': [round(v + d) for v, d in zip(P['labels'][k], NUDGE.get(k, (0, 0)))], 'box': [int(ox + xs.min()), int(oy + ys.min()), int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)], 'lv': [], 'gl': []}
    for n in range(1, 11):
        cut = 999 if n == 10 else 0.3 + (top - 0.3)*n/10
        below = (hgt < cut).astype(np.float32)
        a = pnt.copy(); a[..., 3] = mask*below*dif
        B[k]['lv'].append(save(f'{k}-paint{n}.webp', half(a), 84, box=(ox, oy)))
        gl = glw*(mask*below)[..., None]*0.9
        gl = gl + blur(gl, 5)*0.9 + blur(gl, 16)*0.5
        lum = gl.max(axis=2); ga = np.dstack([np.clip(gl, 0, 1), np.clip(lum*1.1, 0, 1)]); ga[lum < 4/255, 3] = 0
        B[k]['gl'].append(save(f'{k}-glow{n}.webp', half(ga), 72, box=(ox, oy)))
    print('building', k, B[k]['box'], flush=True)

# ---- the moving things ----
crops = P['crops']
def frame(f):   # a mover frame's crop, halved, on the card's grid: (array, [x, y]) or None when nothing of it shows
    c = crops.get(f)
    if not c: return None
    x, y, name = c; a = png(name)
    if x % 2: a = np.pad(a, ((0, 0), (1, 0), (0, 0))); x -= 1
    if y % 2: a = np.pad(a, ((1, 0), (0, 0), (0, 0))); y -= 1
    return half(a), [x//2, y//2]
def union_save(files, names, q=86):
    # several frames of one mover share one box (the union of what shows in each), so they swap in place
    fr = [frame(f) for f in files]
    if any(f is None for f in fr): return None
    boxes = []
    for a, (x, y) in fr:
        ys, xs = np.nonzero(a[..., 3] > 2/255)
        if len(xs): boxes.append((x + xs.min(), y + ys.min(), x + xs.max() + 1, y + ys.max() + 1))
    if not boxes: return None
    X0, Y0 = min(b[0] for b in boxes), min(b[1] for b in boxes); X1, Y1 = max(b[2] for b in boxes), max(b[3] for b in boxes)
    out = []
    for (a, (x, y)), name in zip(fr, names):
        c = np.zeros((Y1 - Y0, X1 - X0, 4), np.float32); sx, sy = x - X0, y - Y0
        ax0, ay0 = max(0, -sx), max(0, -sy); ax1, ay1 = min(a.shape[1], X1 - x), min(a.shape[0], Y1 - y)
        c[sy + ay0:sy + ay1, sx + ax0:sx + ax1] = a[ay0:ay1, ax0:ax1]
        out.append(save(name, c, q, box=(X0, Y0), trim=False))
    return out
M, PP = C['movers'], P['paths']
pts = lambda p: [[round(q[0]), round(q[1]), q[2], q[3]] for q in p]
ref = lambda r: [round(r[0]), round(r[1])]
live = {}
# flags: all of them in one picture, three phases; the fountain's spray from three.js, light on black
live['flags'] = union_save(M['flags']['frames'], [f'flag{i}.webp' for i in range(3)], 80)
spray = []
for i in range(4):
    a = np.asarray(Image.open(os.path.join(CAP, f'spray{i}.png')).convert('RGB'), np.float32)/255; l = a.max(axis=2)
    spray.append(np.dstack([a, np.where(l < 5/255, 0, np.clip(l*1.1, 0, 1))]))
spray = [half(a) for a in spray]
ys, xs = np.nonzero(np.max([a[..., 3] for a in spray], axis=0) > 2/255)
x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
live['spray'] = [save(f'spray{i}.webp', a[y0:y1, x0:x1], 80, box=(x0, y0), trim=False) for i, a in enumerate(spray)]
for name, file in (('carIn', 'car-in'), ('carOut', 'car-out'), ('carIn2', 'car-in2')):
    live[name] = {'img': union_save(M[name]['frames'], [file + '.webp'])[0], 'ref': ref(PP[name]['ref']), 'pts': pts(PP[name]['pts'])}
am = M['amb']['frames']
live['amb'] = {'img': union_save(am, ['amb0.webp', 'amb1.webp', 'ambd0.webp', 'ambd1.webp']), 'ref': ref(PP['amb']['ref']), 'pts': pts(PP['amb']['pts'])}
live['ambDoors'] = live['amb']['img'][2:]; live['amb']['img'] = live['amb']['img'][:2]
live['heli'] = {'img': union_save(M['heli']['frames'], ['heli0.webp', 'heli1.webp']), 'ref': ref(PP['heli']['ref']), 'pts': pts(PP['heli']['pts']), 'pad': ref(PP['heli']['pad'])}
live['street'] = []
for i, o in enumerate(M['street']):
    p = PP[f'street{i}']
    if not any(q[3] for q in p['pts']): continue
    n = len(live['street']); im = union_save(o['frames'], [f'street{n}.webp'])
    if im: live['street'].append({'img': im[0], 'ref': ref(p['ref']), 'pts': pts(p['pts']), 'dur': o['dur']})
live['walkers'] = []
for i, o in enumerate(M['walkers']):
    p = PP[f'walkers{i}']
    if sum(q[3] for q in p['pts']) < 3: continue
    n = len(live['walkers']); im = union_save(o['frames'], [f'walk{n}-0.webp', f'walk{n}-1.webp'], 84)
    if im: live['walkers'].append({'img': im, 'ref': ref(p['ref']), 'pts': pts(p['pts']), 'dur': o['dur']})
live['sitters'] = [x for x in ({'img': union_save(o['frames'], [f'sit{i}-0.webp', f'sit{i}-1.webp'], 84)} for i, o in enumerate(M['sitters'])) if x['img']]
live['birds'] = {'img': union_save(M['birds']['frames'], ['birds0.webp', 'birds1.webp'], 80), 'ref': ref(PP['birds']['ref']), 'pts': pts(PP['birds']['pts'])}
live['lot'] = {'img': [union_save([f], [f'lot{i}.webp'])[0] for i, f in enumerate(M['lot']['frames'])], 'ref': ref(PP['lot']['ref']), 'pts': pts(PP['lot']['pts']), 'ref2': ref(PP['lot']['ref2']), 'pts2': pts(PP['lot']['pts2'])}
# the people standing about: one picture (an atlas), each one's two looks side by side in its union box
cells, AW, x, y, rowH = [], 0, 0, 0, 0
for i, o in enumerate(M['idlers']):
    fr = [frame(f) for f in o['frames']]
    if any(f is None for f in fr): continue
    bx = []
    for a, (fx, fy) in fr:
        ys, xs = np.nonzero(a[..., 3] > 2/255)
        if len(xs): bx.append((fx + xs.min(), fy + ys.min(), fx + xs.max() + 1, fy + ys.max() + 1))
    if not bx: continue
    U = (min(b[0] for b in bx), min(b[1] for b in bx), max(b[2] for b in bx), max(b[3] for b in bx)); uw, uh = U[2] - U[0], U[3] - U[1]
    if uw*uh < 12: continue
    a2 = []
    for _ in fr:
        if x + uw > 1600: x = 0; y += rowH + 2; rowH = 0
        a2.append([x, y]); x += uw + 2; rowH = max(rowH, uh); AW = max(AW, x)
    cells.append({'U': U, 'a': a2, 'fr': fr})
atlas = np.zeros((y + rowH, AW, 4), np.float32)
for c in cells:
    for (a, (fx, fy)), (ax, ay) in zip(c['fr'], c['a']):
        U = c['U']; uw, uh = U[2] - U[0], U[3] - U[1]; sx, sy = fx - U[0], fy - U[1]
        ox0, oy0 = max(0, -sx), max(0, -sy); ox1, oy1 = min(a.shape[1], uw - sx), min(a.shape[0], uh - sy)
        atlas[ay + sy + oy0:ay + sy + oy1, ax + sx + ox0:ax + sx + ox1] = a[oy0:oy1, ox0:ox1]
live['idlers'] = {'atlas': save('idlers.webp', atlas, 86, trim=False), 'items': [{'box': [int(c['U'][0]), int(c['U'][1]), int(c['U'][2] - c['U'][0]), int(c['U'][3] - c['U'][1])], 'a': c['a']} for c in cells]}
man = {'w': W, 'h': H, 'g': [0, 0, W, H], 'b': B, 'layers': layers, 'live': live}
json.dump(man, open(os.path.join(OUT, 'entrance.json'), 'w'), separators=(',', ':'), default=int)
print('files', len([f for f in os.listdir(OUT) if f.endswith('.webp')]), 'bytes', total[0], 'walkers', len(live['walkers']), 'street', len(live['street']), 'idlers', len(cells))
# --install: the files replace city/ and the manifest replaces CAMPUS_MAP in features/campus.js
if '--install' in sys.argv:
    import re, shutil
    ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'); CITY = os.path.join(ROOT, 'city')
    for f in os.listdir(CITY):
        if f.endswith('.webp'): os.remove(os.path.join(CITY, f))
    for f in os.listdir(OUT):
        if f.endswith('.webp'): shutil.copy(os.path.join(OUT, f), CITY)
    js = os.path.join(ROOT, 'features', 'campus.js'); s = open(js).read()
    s, n = re.subn(r'^const CAMPUS_MAP = .*;$', lambda m: 'const CAMPUS_MAP = ' + json.dumps(man, separators=(',', ':'), default=int) + ';', s, flags=re.M); assert n == 1
    open(js, 'w').write(s); print('installed into city/ and features/campus.js')
