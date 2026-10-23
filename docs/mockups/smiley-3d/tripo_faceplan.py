"""Mock-ups for the face plan (plan-rig.png steps 3-4) on the rigged Tripo
model, nothing saved back: his brows moved two ways (A: the skin under his
sculpted brows moves, B: the brows lifted off as their own 3D pieces over
painted-out skin), the cheek raise, and a side cut through his mouth.

  python3 tripo_faceplan.py      -> out/plan/face-*.png

Brow poses use the app's own numbers (DR_BROWS in index.html): a lift in
the drawing's units against its brow length (~24.5 units), a tilt in
degrees, positive = the inner end up.
"""
import os, sys, math
import numpy as np
import bpy, cv2
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tripo_lib as T
import build

HERE = T.HERE
OUTD = os.path.join(HERE, 'out', 'plan')
TMP = os.path.join(HERE, 'in', 'faceplan')
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
BROW_UNITS = 24.5
# (lift, tilt) per side, his right (-x) first: DR_BROWS [l_dy, l_rot, r_dy, r_rot],
# l = your left = his right. Lift: drawing units, up positive.
POSES = {'rest': ((0, 0), (0, 0)),
         'surprised': ((4.2, 0), (4.2 * 1.2, 0)),
         'worried': ((1.4, 15), (1.4 * 1.2, 15 * 1.2)),
         'focused': ((-1.2, -10), (-1.2 * 1.2, -10 * 1.2)),
         'doubt': ((3, 4), (-1 * 1.2, 2 * 1.2))}


def smooth(t):
    t = np.clip(t, 0, 1); return t * t * (3 - 2 * t)


def fit_surface(xz, y):
    """y = S(x, z), a cubic in x and z, least squares."""
    def terms(x, z):
        return np.stack([np.ones_like(x), x, z, x * x, x * z, z * z, x ** 3, x * x * z, x * z * z, z ** 3], 1)
    c, *_ = np.linalg.lstsq(terms(xz[:, 0], xz[:, 1]), y, rcond=None)
    return lambda x, z: terms(np.atleast_1d(x), np.atleast_1d(z)) @ c


class Brow:
    """One brow: its faces, footprint on a front grid (.25 mm), centre, ends."""
    G = .00025

    def __init__(self, sx, cen, dark, co, front, eyes):
        self.sx = sx
        mid = (eyes[0][0] + eyes[1][0]) / 2
        # not the painted eyeliner round each eye
        near_eye = np.zeros(len(cen), bool)
        for e in eyes:
            near_eye |= ((cen[:, 0] - e[0]) / e[2]) ** 2 + ((cen[:, 2] - e[1]) / e[3]) ** 2 < 1.35 ** 2
        sel = ~near_eye & dark & (cen[:, 2] > .795) & (cen[:, 2] < .855) & ((cen[:, 0] - mid) * sx > .012) & ((cen[:, 0] - mid) * sx < .15) & (cen[:, 1] < -.1)
        self.faces = np.nonzero(sel)[0]
        p = cen[sel]
        self.c = np.array([np.median(p[:, 0]), np.median(p[:, 2])])
        self.length = np.subtract(*np.percentile(p[:, 0], [98, 2]))    # not a few stray dark specks
        self.xr = np.percentile(p[:, 0], [2, 98])
        # footprint mask on a grid round the brow
        self.x0, self.z0 = p[:, 0].min() - .04, p[:, 2].min() - .03
        W, H = int(np.ptp(p[:, 0]) / self.G) + int(.08 / self.G), int(np.ptp(p[:, 2]) / self.G) + int(.08 / self.G)
        m = np.zeros((H, W), np.uint8)
        gx = ((p[:, 0] - self.x0) / self.G).astype(int); gz = ((p[:, 2] - self.z0) / self.G).astype(int)
        m[gz, gx] = 1
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
        self.mask = m
        self.dist = cv2.distanceTransform(1 - m, cv2.DIST_L2, 5) * self.G      # metres outside the brow
        cols = np.where(m.any(0))[0]
        self.mid = np.full(W, np.nan)
        for c_ in cols:
            self.mid[c_] = self.z0 + np.nonzero(m[:, c_])[0].mean() * self.G
        ok = ~np.isnan(self.mid); self.mid = np.interp(np.arange(W), np.nonzero(ok)[0], self.mid[ok])
        # the skin round it, for the surface it slides on
        d = self.dist_at(co[:, 0], co[:, 2])
        ring = front & (d > .003) & (d < .014)
        self.S = fit_surface(co[ring][:, [0, 2]], co[ring][:, 1])

    def dist_at(self, x, z):
        gx = np.clip(((x - self.x0) / self.G).astype(int), 0, self.mask.shape[1] - 1)
        gz = np.clip(((z - self.z0) / self.G).astype(int), 0, self.mask.shape[0] - 1)
        inside = ((x - self.x0) / self.G >= 0) & ((x - self.x0) / self.G < self.mask.shape[1]) & \
                 ((z - self.z0) / self.G >= 0) & ((z - self.z0) / self.G < self.mask.shape[0])
        return np.where(inside, self.dist[gz, gx], 1.0)

    def above(self, x, z):
        """0 below the brow's middle line .. 1 above it, smoothly over 8 mm."""
        gx = np.clip(((x - self.x0) / self.G).astype(int), 0, len(self.mid) - 1)
        return smooth((z - self.mid[gx] + .004) / .008)

    def motion(self, x, z, lift, tilt):
        """Where a point of the brow goes: the brow's own tilt about its centre, then the lift."""
        a = math.radians(tilt) * (-1 if self.sx > 0 else 1)
        dx, dz = x - self.c[0], z - self.c[1]
        nx = self.c[0] + dx * math.cos(a) - dz * math.sin(a)
        nz = self.c[1] + dx * math.sin(a) + dz * math.cos(a) + lift / BROW_UNITS * self.length
        return nx - x, nz - z


def deform_skin(co0, front, brows, pose):
    """Option A: the skin moves with the brow, the forehead above stretching
    (falls off over 30 mm), a short falloff below (6 mm) so the eye stays put."""
    co = co0.copy()
    for b, (lift, tilt) in zip(brows, POSES[pose]):
        if lift == 0 and tilt == 0:
            continue
        x, z = co0[:, 0], co0[:, 2]
        near = front & (np.abs(x - b.c[0]) < .11) & (np.abs(z - b.c[1]) < .08)
        idx = np.nonzero(near)[0]
        d = b.dist_at(x[idx], z[idx])
        # each bit of skin follows the part of the brow straight below or above it,
        # up and down only: turning the whole patch about the brow's centre dragged
        # the forehead sideways and creased it over the inner ends
        xs = np.clip(x[idx], *b.xr)
        gx = np.clip(((xs - b.x0) / b.G).astype(int), 0, len(b.mid) - 1)
        _, dz = b.motion(xs, b.mid[gx], lift, tilt)
        dx = np.zeros_like(dz)
        # one smooth falloff (a seam where it changes folds the skin): 30 mm up the
        # forehead, 6 mm down to the eye, more where the brow comes down, or the
        # skin it pushes into folds (his brow sits 6-10 mm above the eye)
        up = b.above(x[idx], z[idx])
        reach = .006 + .024 * up + (1 - up) * 2.2 * np.maximum(-dz, 0)
        # past the brow's ends (the bridge of the nose, the temple) there is no eye
        # under it to keep still, so the skin there fades out gently: 6 mm made the
        # lifted inner end stretch it into a crease
        past = np.abs(x[idx] - xs)
        reach = reach + (1 - up) * .016 * smooth(past / .01)
        w = 1 - smooth((d - .003) / reach)                       # the ridge's sides (3 mm) move whole with it
        w *= 1 - smooth((co0[idx, 1] + .105) / .022)              # fades out round the sides of his head (a hard edge tore the temple)
        w *= 1 - smooth((np.abs(x[idx] - b.c[0]) - .09) / .02)   # and before the box's sides
        nx, nz = x[idx] + dx * w, z[idx] + dz * w
        # add to what the other brow did (their areas meet between the eyes)
        co[idx, 0] += nx - x[idx]; co[idx, 2] += nz - z[idx]
        co[idx, 1] += b.S(nx, nz) - b.S(x[idx], z[idx])
    return co


def flatten(co0, front, brows):
    """Option B, step 1: his brow ridge pressed back to the forehead."""
    co = co0.copy()
    for b in brows:
        x, z = co0[:, 0], co0[:, 2]
        idx = np.nonzero(front & (np.abs(x - b.c[0]) < .09) & (np.abs(z - b.c[1]) < .06))[0]
        d = b.dist_at(x[idx], z[idx])
        w = 1 - smooth((d - .0015) / .003)
        co[idx, 1] = co0[idx, 1] * (1 - w) + b.S(x[idx], z[idx]) * w
    return co


def paint_out(ob, brows, cen, tuv):
    """Option B, step 2: the painted brows covered with the skin round them."""
    img, px = T.texture(ob)
    h, w = px.shape[:2]
    mask = np.zeros((h, w), np.uint8)
    for b in brows:
        for f in b.faces:
            pts = np.round(tuv[f] * [w, h]).astype(np.int32)
            cv2.fillConvexPoly(mask, pts, 1)
    mask = cv2.dilate(mask, np.ones((15, 15), np.uint8))    # the brow's lighter painted edge too
    # skin colour from the forehead round the brows
    ring = np.zeros(len(cen), bool)
    for b in brows:
        d = b.dist_at(cen[:, 0], cen[:, 2]); ring |= (d > .004) & (d < .012) & (cen[:, 1] < -.1)
    skin = np.median(T.sample(px, tuv[ring].mean(1)), 0)
    out = px.copy()
    soft = cv2.GaussianBlur(mask.astype(np.float32), (9, 9), 0)[..., None]
    out[..., :3] = out[..., :3] * (1 - soft) + skin * soft
    path = os.path.join(TMP, 'tex-nobrows.png')
    Image.fromarray((np.clip(out[::-1], 0, 1) * 255).astype(np.uint8), 'RGBA').save(path)
    new = bpy.data.images.load(path)
    old_img = img
    for n in ob.data.materials[0].node_tree.nodes:
        if n.type == 'TEX_IMAGE' and n.image == old_img:
            n.image = new
    return old_img


def brow_pieces(ob, brows, co0, old_img):
    """Option B, step 3: each brow as its own piece, the sculpted top of his
    brow copied off the model with its paint, given a back so it reads as
    solid from the side."""
    me = ob.data
    lv = np.empty(len(me.loops), dtype=np.int64); me.loops.foreach_get('vertex_index', lv)
    uv = np.empty(len(me.loops) * 2); me.uv_layers[0].data.foreach_get('uv', uv); uv = uv.reshape(-1, 2)
    mat = ob.data.materials[0].copy(); mat.name = 'BrowPiece'
    rim = bpy.data.materials.new('BrowRim'); rim.use_nodes = True
    rb = rim.node_tree.nodes['Principled BSDF']; rb.inputs['Base Color'].default_value = build.srgb(50, 18, 9)
    rb.inputs['Roughness'].default_value = .7
    mat.node_tree.nodes['Image Texture'].image = old_img    # the colour only; the other two are roughness and surface detail
    pieces = []
    for b in brows:
        loops = (b.faces[:, None] * 3 + np.arange(3)).ravel()
        vids = lv[loops]
        uniq, inv = np.unique(vids, return_inverse=True)
        pm = bpy.data.meshes.new('Brow'); pm.from_pydata([tuple(v) for v in co0[uniq]], [], inv.reshape(-1, 3).tolist())
        pm.uv_layers.new(); pm.uv_layers[0].data.foreach_set('uv', uv[loops].ravel())
        pm.materials.append(mat)
        po = bpy.data.objects.new('Brow', pm); bpy.context.scene.collection.objects.link(po)
        sol = po.modifiers.new('back', 'SOLIDIFY'); sol.thickness = .004; sol.offset = 1
        pm.materials.append(rim); sol.material_offset_rim = 1           # its sides brow-brown, not the texture's edge
        for p in pm.polygons:
            p.use_smooth = True
        pieces.append((po, co0[uniq].copy()))
    return pieces


def pose_pieces(pieces, brows, pose):
    for (po, base), b, (lift, tilt) in zip(pieces, brows, POSES[pose]):
        dx, dz = b.motion(base[:, 0], base[:, 2], lift, tilt)
        nx, nz = base[:, 0] + dx, base[:, 2] + dz
        ny = base[:, 1] + b.S(nx, nz) - b.S(base[:, 0], base[:, 2])
        po.data.vertices.foreach_set('co', np.stack([nx, ny, nz], 1).ravel())
        po.data.update()


def cheeks(co0, front, amount, CX):
    """Cheek raise: the round of each cheek up and a little forward, nothing
    above the bottom of the eye moving."""
    co = co0.copy()
    for sx in (1, -1):
        c = np.array([CX + .08 * sx, .695])
        x, z = co0[:, 0], co0[:, 2]
        r = np.hypot((x - c[0]) / .034, (z - c[1]) / .03)
        w = (1 - smooth(r)) * (1 - smooth((z - .715) / .02)) * front
        co[:, 2] += w * .009 * amount
        co[:, 1] -= w * .005 * amount
    return co


NRM = {}


def set_co(ob, co):
    """Move his surface and recompute its shading normals across the texture
    seams. The model carries fixed normals (from the GLB); left alone they
    don't follow moved skin, and every seam shows as a fold. Recomputed at
    rest they match the originals (99.85% of the face within 1%)."""
    me = ob.data
    me.vertices.foreach_set('co', co.ravel()); me.update()
    if 'lv' not in NRM:
        lv = np.empty(len(me.loops), dtype=np.int64); me.loops.foreach_get('vertex_index', lv)
        _, weld = np.unique(np.round(co * 2e5).astype(np.int64), axis=0, return_inverse=True)
        NRM.update(lv=lv, tri=lv.reshape(-1, 3), weld=weld.ravel())
    tri, weld = NRM['tri'], NRM['weld']
    fn = np.cross(co[tri[:, 1]] - co[tri[:, 0]], co[tri[:, 2]] - co[tri[:, 0]])
    acc = np.zeros((weld.max() + 1, 3))
    for k in range(3):
        np.add.at(acc, weld[tri[:, k]], fn)
    vn = acc[weld]; vn /= np.linalg.norm(vn, axis=1, keepdims=True) + 1e-12
    me.normals_split_custom_set(vn[NRM['lv']].tolist()); me.update()


def shot(path, target, dist, az, el, res=(560, 420)):
    sc = bpy.context.scene
    sc.render.resolution_x, sc.render.resolution_y = res
    build.look(bpy.context.scene.camera, target, dist, az, el)
    bpy.context.view_layer.update()
    sc.render.filepath = path; bpy.ops.render.render(write_still=True)
    return Image.open(path).convert('RGB')


def label(im, text):
    g = ImageDraw.Draw(im); f = ImageFont.truetype(FB, 24)
    tw = g.textlength(text, font=f)
    g.rounded_rectangle((12, 12, 32 + tw, 50), 10, fill=(37, 46, 109)); g.text((22, 31), text, font=f, fill='white', anchor='lm')
    return im


def mouth_cut(ob, cen, tuv, px, path):
    """A side cut through his mouth at the middle (x ~ 0): each triangle
    there drawn at its depth and height in its own colour."""
    sel = (np.abs(cen[:, 0] - .012) < .0015) & (cen[:, 2] > .62) & (cen[:, 2] < .72) & (cen[:, 1] < -.09)
    col = (T.sample(px, tuv[sel].mean(1)) * 255).astype(int)
    W, H = 520, 460
    im = Image.new('RGB', (W, H), (250, 250, 252)); g = ImageDraw.Draw(im)
    Y = lambda y: 60 + (y + .185) / .09 * 400
    Z = lambda z: H - 30 - (z - .62) / .1 * 400
    for (x, y, z), c in sorted(zip(cen[sel], col), key=lambda t: t[0][0]):
        g.ellipse((Y(y) - 3, Z(z) - 3, Y(y) + 3, Z(z) + 3), fill=tuple(c))
    f = ImageFont.truetype(FB, 20)
    for t, x, y in (('upper lip', 135, 135), ('teeth', 195, 205), ('inside (tongue)', 360, 215), ('lower lip', 165, 300)):
        g.text((x, y), t, font=f, fill=(37, 46, 109), anchor='rm' if x < 300 else 'mm')
    g.text((W // 2, 18), 'His mouth cut through, seen from the side', font=f, fill=(37, 46, 109), anchor='mt')
    g.text((W - 20, H - 12), 'front ←   → back', font=ImageFont.truetype(FB, 16), fill=(90, 100, 120), anchor='rb')
    im.save(path); return im


if __name__ == '__main__':
    os.makedirs(TMP, exist_ok=True)
    bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'in', 'tripo-rig.blend'))
    ob = bpy.data.objects['Mesh_0']
    build.STYLE_NOW = 'tripo'
    cam = build.studio(); sc = bpy.context.scene; sc.camera = cam
    sc.cycles.samples = int(os.environ.get('SAMPLES', 16))
    n = len(ob.data.vertices)
    co0 = np.empty(n * 3); ob.data.vertices.foreach_get('co', co0); co0 = co0.reshape(-1, 3)
    front = (co0[:, 1] < -.08) & (co0[:, 2] > .6)
    img, px = T.texture(ob)
    cen, tuv = T.face_arrays(ob)
    col = T.sample(px, tuv.mean(1)) * 255
    dark = col.sum(1) < 260
    eyes = []
    for e in ('Eye.R', 'Eye.L'):
        o = bpy.data.objects[e]; t, d = o.matrix_world.translation, o.dimensions
        eyes.append((t.x, t.z, d.x / 2, d.z / 2))
    CX = (eyes[0][0] + eyes[1][0]) / 2                  # his face's middle (the model is a little off centre)
    brows = [Brow(-1, cen, dark, co0, front, eyes), Brow(1, cen, dark, co0, front, eyes)]
    for b in brows:
        print('brow', b.sx, 'faces', len(b.faces), 'centre', b.c.round(4), 'length', round(b.length, 4))
    P = lambda name: os.path.join(TMP, name + '.png')
    BROW_CAM = ((CX, 0, .79), .9, -8, 5, (760, 400))
    tiles = {}
    mouth_cut(ob, cen, tuv, px, os.path.join(OUTD, 'face-mouth-cut.png'))
    for pose in ('rest', 'surprised', 'worried', 'focused', 'doubt'):
        set_co(ob, deform_skin(co0, front, brows, pose))
        tiles['A', pose] = label(shot(P('A-' + pose), *BROW_CAM), pose)
    set_co(ob, co0)
    tiles['cheek', 0] = label(shot(P('cheek0'), (CX, 0, .725), .8, -18, 2, (640, 480)), 'rest')
    set_co(ob, cheeks(co0, front, 1, CX))
    tiles['cheek', 1] = label(shot(P('cheek1'), (CX, 0, .725), .8, -18, 2, (640, 480)), 'cheeks up')
    tiles['mouth', 0] = shot(P('mouth-front'), (CX, 0, .675), .42, 0, 2, (560, 380))
    tiles['mouth', 1] = shot(P('mouth-34'), (CX, 0, .68), .6, -32, 2, (560, 380))
    # option B
    set_co(ob, flatten(co0, front, brows))
    old = paint_out(ob, brows, cen, tuv)
    tiles['B', 'bare'] = label(shot(P('B-bare'), *BROW_CAM), 'brows taken off')
    pieces = brow_pieces(ob, brows, co0, old)
    for pose in ('rest', 'surprised', 'worried', 'focused', 'doubt'):
        pose_pieces(pieces, brows, pose)
        tiles['B', pose] = label(shot(P('B-' + pose), *BROW_CAM), pose)
    # sheets
    def row(keys, name):
        ims = [tiles[k] for k in keys]
        s = Image.new('RGB', (sum(i.width for i in ims) + 12 * (len(ims) - 1), ims[0].height), 'white')
        x = 0
        for i in ims:
            s.paste(i, (x, 0)); x += i.width + 12
        s.save(os.path.join(OUTD, name)); return s
    row([('A', p) for p in ('rest', 'surprised', 'worried', 'focused', 'doubt')], 'face-brows-A.png')
    row([('B', p) for p in ('bare', 'surprised', 'worried', 'focused', 'doubt')], 'face-brows-B.png')
    row([('cheek', 0), ('cheek', 1)], 'face-cheeks.png')
    row([('mouth', 0), ('mouth', 1)], 'face-mouth-now.png')
    print('done')
