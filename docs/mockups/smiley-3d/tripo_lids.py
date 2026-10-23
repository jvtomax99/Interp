"""His eyelids as his own skin (Jose's go, 2026-10-23, step A of
out/plan-match.png). The lids used to be separate shells over the eyeballs
(tripo_eyes.py, tripo_eyes2.py); shut, they read as domes, and no lower lid
meant a smile could not push the eye up into a crescent.

Here, in tripo_face.py right after the weld and before any shape key:
  1. the skin inside an oval round each eye (the painted eye) is cut out;
  2. two strips of new skin are built in its place, upper lid and lower lid:
     upright columns across the eye (x), each running from the lid's edge
     on the ball out to the cut, lying on the ball (plus the lid's
     thickness) near the edge and easing onto his own skin further out,
     with a rolled rim at the edge; past the eye's corners the two edges
     meet (shared points), so the strips close into one ring;
  3. the ring's outer row is bridged to the cut, so it is one surface again
     (rig weights copied; the bridge keeps his texture, the ring takes one
     flat skin colour sampled at the cut, with a dark lash line on the
     upper rim through the 'lash' attribute).
Then `lid_keys()` adds the lids' shape keys, each a step of the edge round
the ball (a straight blend would cut through it): Lid.W (upper lid up,
wide), Lid.U1..U6 (upper lid down to the blink line), Lid.D1..D4 (lower
lid up: a squint, the cheek's push, the laugh). Both lids meeting in an
upward arc is U at 2/6 with D at 4/4; `set_lids` keeps the upper edge above
the lower.

The edge of each lid is a curve across the eye in ball units (x/rx, z/rz):
the corners fixed at the height W_C, the middle at h: h > W_C bows up.
A first version ran the columns as rays through the eye's centre: a shut
lid folded over itself in a pie pattern. Upright columns never cross.
"""
import os, sys, math
import numpy as np
import bpy, bmesh
from mathutils import Vector
from scipy.spatial import cKDTree
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

HERE = os.path.dirname(os.path.abspath(__file__))
COLS, ROWS = 160, 22           # columns across the eye, rows from the edge out to the cut (about 1 mm faces, like his mesh)
RIM = 2                        # rows rolled under the edge toward the ball
S_X, S_Z = 1.3, 1.2            # the cut, in ball units (an oval a little wider than tall)
W_C, U_C = -.06, .97           # the corners: height and half width, ball units
H_TOP, H_BOT = .5, -.8         # the edges at rest: the upper on the iris top, the lower under it
H_SHUT = -.74                  # the upper edge shut (just above the resting lower lid)
H_LOW = .4                     # the lower edge fully raised (the laugh: a high upward arc)
H_WIDE = .74                   # the upper edge raised (surprise: white above the iris)
Q = .8                         # the edge curve's roundness
THICK = .0012                  # the lid's thickness at its edge
BULGE = .0026                  # the glass dome over the iris (tripo_eyes2.py)
U_STEPS, D_STEPS = 6, 4
RIM_W = (.03, .015)            # the rim rows, inward from the edge (ball units of height)
FOLD_AT, FOLD_W, FOLD_DEPTH = .42, .07, .0011   # the fold above the open eye: where along the lid (0 edge .. 1 cut), its width, its depth (into the face)
LASH_FULL, LASH_END = .16, .27                 # the lash line: full to this part of the lid, gone by this
FEATHER = .3                   # the ring's flat colour feathers into his texture this far past the cut (ball units)


def smooth(t):
    t = np.clip(t, 0, 1); return t * t * (3 - 2 * t)


def edge_h(u, h):
    """The lid edge's height over the eye's width: the corners at W_C, the middle at h."""
    return W_C + (h - W_C) * np.clip(1 - (u / U_C) ** 2, 0, 1) ** Q


class EyeRing:
    """One eye's ring: its frame, sizes, skin depth grid and vertex indices."""

    def __init__(self, eye, side):
        from tripo_eyes2 import eye_params, face_grid
        self.side = side
        self.rx, self.ry, self.rz, *_ = eye_params(eye)
        self.M = eye.matrix_world.copy(); self.Mi = self.M.inverted()
        self.us, self.g = face_grid(eye, self.rx, self.rz)        # skin depth in the eye's frame (y, forward negative)
        self.u = S_X * np.cos(np.linspace(math.pi, 0, COLS + 1))   # columns, denser toward the corners
        self.idx = None            # {'up': (rows, COLS+1) vertex indices, 'lo': ...}
        # his skin round the eye kept whole for the casts (the mesh itself is cut open there)
        from mathutils.bvhtree import BVHTree
        head = bpy.data.objects['Mesh_0']; me = head.data
        hv = np.empty(len(me.vertices) * 3); me.vertices.foreach_get('co', hv); hv = hv.reshape(-1, 3)
        pv = np.empty(len(me.loops), dtype=np.int64); me.loops.foreach_get('vertex_index', pv); tri = pv.reshape(-1, 3)
        pc = hv[tri].mean(1)
        c = np.array(self.M.translation)
        near = (np.linalg.norm(pc - c, axis=1) < 2.2 * self.rx)
        self.skin = BVHTree.FromPolygons([Vector(v) for v in hv], [tuple(int(i) for i in f) for f in tri[near]], all_triangles=True)
        self.fwd = (self.M.to_3x3() @ Vector((0, -1, 0))).normalized()
        # the cut's depth per column, exactly: a ray along the eye's forward line onto his skin
        # (the 1.4 mm grid's reading left the outer row a fraction off the skin: a ridge)
        head = bpy.data.objects['Mesh_0']
        Hi = head.matrix_world.inverted()
        fwd = (self.M.to_3x3() @ Vector((0, -1, 0))).normalized()
        d = (Hi.to_3x3() @ -fwd).normalized()
        self.y_cut, self.slope_cut = {}, {}
        for key, sgn in (('up', 1), ('lo', -1)):
            ys, sl = [], []
            for u in self.u:
                ws = sgn * S_Z * math.sqrt(max(0., 1 - (u / S_X) ** 2))
                got = []
                for k in (1., 1.08):                   # at the cut, and a little outside it, for the skin's slope there
                    wpt = self.M @ Vector((self.rx * u * k, 0, self.rz * ws * k))
                    hit, loc, *_ = head.ray_cast(Hi @ (wpt + fwd * .05), d)
                    got.append((self.Mi @ (head.matrix_world @ loc)).y if hit else float(self.skin_y(np.array([u * k]), np.array([ws * k]))[0]))
                ys.append(got[0]); sl.append((got[1] - got[0]) / .08)      # dy per unit of rho
            self.y_cut[key], self.slope_cut[key] = np.array(ys), np.array(sl)

    def cast_y(self, u, w):
        """His skin's depth at (u, w) in the eye's frame: a ray along the eye's forward line
        onto the kept copy of his skin (the grid's bilinear reading is 1.4 mm coarse)."""
        origin = self.M @ Vector((self.rx * u, -.06, self.rz * w))
        loc, *_ = self.skin.ray_cast(origin, self.fwd, .2)
        if loc is not None:
            return (self.Mi @ loc).y
        return float(self.skin_y(np.array([u]), np.array([w]))[0])

    def skin_y(self, u, w):
        n = len(self.us); step = self.us[1] - self.us[0]
        g = np.where(np.isnan(self.g), np.nanmax(self.g), self.g)
        fi = np.clip((w - self.us[0]) / step, 0, n - 1.001); fj = np.clip((u - self.us[0]) / step, 0, n - 1.001)
        i0, j0 = fi.astype(int), fj.astype(int); ti, tj = fi - i0, fj - j0
        return g[i0, j0] * (1 - ti) * (1 - tj) + g[i0 + 1, j0] * ti * (1 - tj) + g[i0, j0 + 1] * (1 - ti) * tj + g[i0 + 1, j0 + 1] * ti * tj

    def ball_y(self, a, i, upper):
        """y of the lid over the ball at radius a (ball units): the ball's front plus the
        lid's thickness, more over the glass dome; past the ball, flat. Rows 0, 1: the rim."""
        margin = THICK + (BULGE + .0002) * (1 - smooth((min(a, 1.) - .7) / .25)) + (.0006 if upper else 0.)
        if i == 0:
            margin = .0003
        elif i == 1:
            margin *= .5
        yb = -self.ry * math.sqrt(1 - a * a) if a < 1 else 0.
        return yb - margin

    def strip(self, h, upper):
        """One lid's points (RIM + 1 + ROWS, COLS + 1, 3) in the eye's frame, the edge at h.
        From the edge outward the lid hugs the ball, then eases to his skin's depth at the
        cut (not his skin in between: the sculpt dips under the eye, and a lid following it
        made a ledge). Never into the ball's clearance."""
        pts = np.zeros((RIM + 1 + ROWS, COLS + 1, 3))
        sgn = 1 if upper else -1
        lift = 0. if upper else (h - H_BOT) / (H_LOW - H_BOT)                # the lower lid rising: 0 .. 1
        for j, u in enumerate(self.u):
            we = float(edge_h(u, h))
            # the ring ends 5% inside the cut: on the cut itself its outer row lay on top of the
            # cut's zigzag, and the bridge between them was all slivers (a dotted ring)
            ws = sgn * S_Z * math.sqrt(max(0., 1 - (u / S_X) ** 2)) * .93
            taper = float(np.clip((U_C - abs(u)) / .1, 0, 1))                 # the rim thins out at the corners
            rows = [we - sgn * RIM_W[0] * taper, we - sgn * RIM_W[1] * taper] + [we + (ws - we) * (k / ROWS) ** 1.4 for k in range(ROWS + 1)]
            y_cut = float(self.y_cut['up' if upper else 'lo'][j])
            for i, w in enumerate(rows):
                a = math.hypot(u, w)
                yb = self.ball_y(a, i, upper)
                if i < RIM:
                    y = yb
                else:
                    t = (i - RIM) / ROWS
                    # the lid is his own skin, read exactly, with the ball-hugging surface blended
                    # in near the opening by a weight that dies out (value and slope) by the cut:
                    # every earlier scheme (a curve to the cut, the skin's slope matched per column)
                    # met his skin in a crease that read as a ring round the eye
                    ys = self.cast_y(u, w)
                    F = float(smooth((1 - a) / .5)) if a < 1 else 0.
                    y = F * yb + (1 - F) * ys
                    if a < 1:                                            # never behind the ball's clearance (softly)
                        y = (y + yb) / 2 - math.sqrt(((y - yb) / 2) ** 2 + .0006 ** 2)
                    # the fold above the open eye (the sheet's crease line): a shallow groove across the
                    # upper lid about 6 mm above its edge, fading toward the corners, flattening as the lid shuts
                    if upper:
                        openness = float(np.clip((h - H_SHUT) / (H_TOP - H_SHUT), 0, 1))
                        y += FOLD_DEPTH * openness * math.exp(-((t - FOLD_AT) / FOLD_W) ** 2) * float(np.clip(1 - (u / U_C) ** 2, 0, 1)) ** .5
                    y -= .0022 * lift * (1 - (u / S_X) ** 2) * float(smooth((t - .2) / .3) * (1 - smooth((t - .55) / .45)))
                if i == RIM + ROWS:
                    y = y_cut
                pts[i, j] = (self.rx * u, y, self.rz * w)
        return pts

    def points(self, h_top, h_bot):
        """Both lids' points, world space: {'up': ..., 'lo': ...}."""
        out = {}
        for key, h, upper in (('up', h_top, True), ('lo', h_bot, False)):
            p = self.strip(h, upper)
            w = np.zeros_like(p)
            for i in range(p.shape[0]):
                for j in range(p.shape[1]):
                    w[i, j] = self.M @ Vector(p[i, j])
            out[key] = w
        return out


def cut_and_ring(ob, eyes):
    """The surgery. eyes: {'L': Eye.L object, 'R': Eye.R}. Returns {'L': EyeRing, 'R': EyeRing}."""
    import tripo_lib as T, build
    me = ob.data
    rings = {s: EyeRing(e, s) for s, e in eyes.items()}
    img, px = T.texture(ob)
    bm = bmesh.new(); bm.from_mesh(me)
    bm.verts.ensure_lookup_table(); bm.faces.ensure_lookup_table()
    uv_lay = bm.loops.layers.uv.active
    dl = bm.verts.layers.deform.active or bm.verts.layers.deform.new()
    head_g = ob.vertex_groups['head'].index
    lash_lay = bm.verts.layers.float.new('lash')
    flat_lay = bm.verts.layers.float.new('flat')      # 1 on the ring: one flat skin colour, feathered into his texture over the bridge
    row_lay = bm.verts.layers.float.new('lidrow')     # for checks: the row (0..1) and strip (up 0 / lo 1) of each ring point
    strip_lay = bm.verts.layers.float.new('lidstrip')
    skin_slot = 0
    corner = np.abs(rings['L'].u) >= U_C           # columns past the corners: the two edges are one
    for s, R in rings.items():
        Mi = R.Mi
        # 1. the cut: faces inside the oval, on the front
        kill = []
        for f in bm.faces:
            inside = True
            for v in f.verts:
                p = Mi @ v.co
                if not (math.hypot(p.x / R.rx / S_X, p.z / R.rz / S_Z) < 1 and p.y < .02):
                    inside = False; break
            if inside:
                kill.append(f)
        for v in bm.verts:                             # the feather: his skin near the cut takes the ring's colour, fading out
            p = Mi @ v.co
            if p.y < .02:
                rho = math.hypot(p.x / R.rx / S_X, p.z / R.rz / S_Z)
                if rho < 1 + FEATHER:
                    v[flat_lay] = max(v[flat_lay], float(1 - smooth((rho - 1) / FEATHER)))
        bmesh.ops.delete(bm, geom=kill, context='FACES')
        bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table(); bm.faces.ensure_lookup_table()
        bnd = []
        for e in bm.edges:
            if len(e.link_faces) != 1:
                continue
            p = Mi @ ((e.verts[0].co + e.verts[1].co) / 2)
            if math.hypot(p.x / R.rx / S_X, p.z / R.rz / S_Z) < 1.25 and p.y < .02:
                bnd.append(e)
        print(f'  {s}: cut {len(kill)} faces, boundary edges {len(bnd)}')
        # 2. the two strips
        pts = R.points(H_TOP, H_BOT)
        nrow = pts['up'].shape[0]
        verts = {}
        for key in ('up', 'lo'):
            verts[key] = [[None] * (COLS + 1) for _ in range(nrow)]
        for i in range(nrow):
            for j in range(COLS + 1):
                vu = bm.verts.new(Vector(pts['up'][i, j])); verts['up'][i][j] = vu
                # the lower strip shares the end columns (the cut's two ends) and the edge rows past the corners
                share = (j in (0, COLS)) or (corner[j] and i <= RIM)
                verts['lo'][i][j] = vu if share else bm.verts.new(Vector(pts['lo'][i, j]))
        new_verts = {id(v): v for row in verts['up'] for v in row}
        new_verts.update({id(v): v for row in verts['lo'] for v in row})
        for v in new_verts.values():
            v[dl][head_g] = 1.0
            v[lash_lay] = 0.
            v[flat_lay] = 1.
        for key in ('up', 'lo'):
            for i, row in enumerate(verts[key]):
                for v in row:
                    v[row_lay] = i / (nrow - 1); v[strip_lay] = 0. if key == 'up' else 1.
        inner = -1 if s == 'L' else 1                  # his left eye's inner corner is at -x
        for j, u in enumerate(R.u):
            taper = float(np.clip((U_C * .97 - abs(u)) / .12, 0, 1))
            taper *= .45 + .55 * (1 - inner * u / U_C) / 2          # thin toward the nose, full at the outer corner
            verts['up'][1][j][lash_lay] = taper                     # a crisp dark line: the rim's middle row, the edge, half of the next
            verts['up'][RIM][j][lash_lay] = taper
            # and the first tenth of the lid's front: the edge zone wraps over the ball and is
            # seen foreshortened from the front, so a line only on it read as a hairline
            outer = (1 + inner * u / U_C) / 2                           # 0 at the nose .. 1 at the outer corner
            for i in range(RIM + 1, RIM + 1 + ROWS):
                t = (i - RIM) / ROWS
                full = LASH_FULL * (1 + .5 * outer)                    # thicker toward the outer corner
                k = 1. if t <= full else 1 - float(smooth((t - full) / (LASH_END - LASH_FULL)))
                if k > 0:
                    verts['up'][i][j][lash_lay] = k * taper
        faces = []
        for key in ('up', 'lo'):
            vv = verts[key]
            for i in range(nrow - 1):
                for j in range(COLS):
                    quad = (vv[i][j], vv[i][j + 1], vv[i + 1][j + 1], vv[i + 1][j])
                    if len(set(map(id, quad))) < 4:
                        continue
                    try:
                        f = bm.faces.new(quad if key == 'up' else quad[::-1])
                    except ValueError:
                        continue
                    f.material_index = skin_slot; f.smooth = True
                    faces.append(f)
        # 3. the join: the ring's outer row bridged to the cut (one closed loop each). The
        # bridge's thin triangles showed as a dotted ring at first; that was Tripo's bump map
        # read through borrowed texture coordinates (now faded out there by 'flat'), not the
        # bridge. Inserting points so both loops matched was tried: the cut zigzags, so its
        # edges never lined up with the row's.
        bverts = list({v for e in bnd for v in e.verts})
        buv = []
        for v in bverts:
            uv = None
            for l in v.link_loops:
                uv = l[uv_lay].uv.copy(); break
            buv.append(uv)
        bco = np.array([[v.co.x, v.co.y, v.co.z] for v in bverts])
        outer_e = []
        for key in ('up', 'lo'):
            row = verts[key][-1]
            for j in range(COLS):
                e = bm.edges.get((row[j], row[j + 1]))
                if e is not None:
                    outer_e.append(e)
        res = bmesh.ops.bridge_loops(bm, edges=bnd + outer_e, use_pairs=False, use_cyclic=True, use_merge=False)
        bfaces = list(res.get('faces', []))
        for f in bfaces:
            f.smooth = True
        # the cut's own zigzag and the ring's last two rows relaxed against each other (the
        # sawtooth shaded as a dashed line); the ring's shift from this is kept (R.delta) and
        # added to every lid key, or the join would pop as the lids move
        rows_out = list({id(v): v for key in ('up', 'lo') for r in (-2, -1) for v in verts[key][r]}.values())
        before_co = {id(v): v.co.copy() for v in rows_out}
        for _ in range(3):
            bmesh.ops.smooth_vert(bm, verts=bverts + rows_out, factor=.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
        R.delta = {}
        for key in ('up', 'lo'):
            dd = np.zeros((nrow, COLS + 1, 3))
            for i in (-2, -1):
                for j in range(COLS + 1):
                    v = verts[key][i][j]
                    dd[i, j] = np.array(v.co - before_co[id(v)])
            R.delta[key] = dd
        allnew = faces + bfaces
        tree = cKDTree(bco)
        bid = {id(v): k for k, v in enumerate(bverts)}
        for f in allnew:                               # texture coordinates: the nearest cut point's (the colour is the flat mix anyway)
            for l in f.loops:
                k = bid.get(id(l.vert))
                if k is None:
                    _, k = tree.query([l.vert.co.x, l.vert.co.y, l.vert.co.z])
                if buv[k] is not None:
                    l[uv_lay].uv = buv[k]
        tri = bmesh.ops.triangulate(bm, faces=[f for f in allnew if len(f.verts) > 3], quad_method='FIXED')
        for f in tri['faces']:
            f.smooth = True
        print(f'  {s}: bridged {len(bnd)} cut edges to {len(outer_e)} row edges: {len(bfaces)} faces')
        R.colour = None
        R.verts = verts
    bm.verts.index_update()
    for s, R in rings.items():
        R.idx = {key: np.array([[v.index for v in row] for row in R.verts[key]]) for key in ('up', 'lo')}
        del R.verts
    bm.to_mesh(me); bm.free(); me.update()
    # the ring's one skin colour: his texture on the bridge of his nose and his forehead
    # (the texture at the cut carries shading and read as a pink disc), mixed into his own
    # material by the 'flat' attribute, then the lash line by 'lash'
    cen, tuv = T.face_arrays(ob)
    cx = np.mean([R.M.translation.x for R in rings.values()]); cz = np.mean([R.M.translation.z for R in rings.values()])
    patch = (np.abs(cen[:, 0] - cx) < .012) & (cen[:, 2] > cz + .005) & (cen[:, 2] < cz + .05) & (cen[:, 1] < -.1)
    col = T.sample(px, tuv[patch].mean(1)) * 255
    c = np.median(col, 0)
    print(f'  ring skin colour {c.round(1)} from {patch.sum()} texels')
    mat = me.materials[0]; nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    src = bsdf.inputs['Base Color'].links[0].from_socket
    def mixer(fac_name, colour):
        att = nt.nodes.new('ShaderNodeAttribute'); att.attribute_name = fac_name
        mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'
        A = next(i for i in mix.inputs if i.identifier == 'A_Color'); B = next(i for i in mix.inputs if i.identifier == 'B_Color')
        out = next(o for o in mix.outputs if o.identifier == 'Result_Color')
        B.default_value = colour
        nt.links.new(att.outputs['Fac'], mix.inputs['Factor'])
        return A, out
    A1, out1 = mixer('flat', build.srgb(*c)); nt.links.new(src, A1)
    # Tripo's bump and roughness maps mean nothing on the ring (its texture coordinates are
    # borrowed from the cut): both fade out with 'flat' (the bump read as a streak down the lid)
    flat_att = nt.nodes.new('ShaderNodeAttribute'); flat_att.attribute_name = 'flat'
    inv = nt.nodes.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1.
    nt.links.new(flat_att.outputs['Fac'], inv.inputs[1])
    for n in nt.nodes:
        if n.type == 'NORMAL_MAP':
            n.inputs['Strength'].default_value = 1.
            nt.links.new(inv.outputs[0], n.inputs['Strength'])
    rl = bsdf.inputs['Roughness'].links
    if rl:
        rmix = nt.nodes.new('ShaderNodeMix'); rmix.data_type = 'FLOAT'
        rA = next(i for i in rmix.inputs if i.identifier == 'A_Float'); rB = next(i for i in rmix.inputs if i.identifier == 'B_Float')
        rout = next(o for o in rmix.outputs if o.identifier == 'Result_Float')
        nt.links.new(rl[0].from_socket, rA); rB.default_value = .62
        nt.links.new(flat_att.outputs['Fac'], rmix.inputs['Factor'])
        nt.links.new(rout, bsdf.inputs['Roughness'])
    A2, out2 = mixer('lash', (.03, .012, .006, 1)); nt.links.new(out1, A2)
    nt.links.new(out2, bsdf.inputs['Base Color'])
    np.savez(os.path.join(HERE, 'in', 'lids.npz'), **{f'{key}_{s}': R.idx[key] for s, R in rings.items() for key in ('up', 'lo')})
    return rings


def lid_keys(ob, rings, add_key, co0):
    """The lids' shape keys on co0 (the Basis after the surgery)."""
    for s, R in rings.items():
        states = [(f'Lid.W.{s}', H_WIDE, H_BOT)]
        states += [(f'Lid.U{k}.{s}', H_TOP + (H_SHUT - H_TOP) * k / U_STEPS, H_BOT) for k in range(1, U_STEPS + 1)]
        states += [(f'Lid.D{k}.{s}', H_TOP, H_BOT + (H_LOW - H_BOT) * k / D_STEPS) for k in range(1, D_STEPS + 1)]
        for name, ht, hb in states:
            co = co0.copy()
            p = R.points(ht, hb)
            co[R.idx['up']] = p['up'] + R.delta['up']
            lo = R.idx['lo']
            own = lo != R.idx['up']                     # shared points keep the upper strip's place
            co[lo[own]] = (p['lo'] + R.delta['lo'])[own]
            add_key(ob, name, co)


def set_lids(ob, side, lid, lower):
    """lid: the upper lid -1 (wide) .. 0 (rest) .. 1 (shut); lower: the lower lid
    0 (rest) .. 1 (fully raised). The upper edge stays above the lower one."""
    kb = ob.data.shape_keys.key_blocks
    h_bot = H_BOT + (H_LOW - H_BOT) * lower
    max_lid = (H_TOP - (h_bot + .04)) / (H_TOP - H_SHUT)
    lid = min(lid, max(0., max_lid))
    kb[f'Lid.W.{side}'].value = max(0., -lid)
    for name, amount, steps in (('U', max(0., lid), U_STEPS), ('D', lower, D_STEPS)):
        t = min(amount, 1.) * steps
        for k in range(1, steps + 1):
            kb[f'Lid.{name}{k}.{side}'].value = max(0., 1 - abs(t - k)) if t > 0 else 0.
        if t >= steps:
            kb[f'Lid.{name}{steps}.{side}'].value = 1.


def lash_material(ob):
    """Kept for tripo_face.py: the lash line now lives in the LidSkin material."""
    return
