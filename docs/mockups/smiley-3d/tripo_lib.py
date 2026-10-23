"""Shared helpers for working on Jose's Tripo model (steps 4-6 of out/plan-tripo.png)."""
import os, math
import numpy as np
import bpy
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
GLB = os.path.join(HERE, 'in', 'tripo-hands-down.glb')


def load(path=GLB):
    """Import the model, scaled to 1 m tall, feet at 0, facing -Y. Returns the mesh."""
    bpy.ops.import_scene.gltf(filepath=path)
    ob = [o for o in bpy.data.objects if o.type == 'MESH'][0]
    bpy.context.view_layer.update()
    me = ob.data
    co = np.empty(len(me.vertices) * 3); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
    M = np.array(ob.matrix_world)
    w = co @ M[:3, :3].T + M[:3, 3]
    k = 1 / (w[:, 2].max() - w[:, 2].min())
    w = (w - [0, 0, w[:, 2].min()]) * k
    w[:, :2] -= [(w[:, 0].max() + w[:, 0].min()) / 2, (w[:, 1].max() + w[:, 1].min()) / 2]
    ob.matrix_world.identity()
    ob.parent = None
    me.vertices.foreach_set('co', w.ravel())
    me.update()
    return ob


def face_arrays(ob):
    """Per-face centre (world), per-face UV centre, loop UVs and polygon loop indices."""
    me = ob.data
    n = len(me.polygons)
    cen = np.empty(n * 3); me.polygons.foreach_get('center', cen); cen = cen.reshape(-1, 3)
    uv = np.empty(len(me.loops) * 2); me.uv_layers[0].data.foreach_get('uv', uv); uv = uv.reshape(-1, 2)
    ls = np.empty(n, dtype=np.int64); me.polygons.foreach_get('loop_start', ls)
    lt = np.empty(n, dtype=np.int64); me.polygons.foreach_get('loop_total', lt)
    assert (lt == 3).all(), 'expects triangles'
    tri_uv = uv[ls[:, None] + np.arange(3)]
    return cen, tri_uv


def texture(ob, which=0):
    img = [n.image for n in ob.data.materials[0].node_tree.nodes if n.type == 'TEX_IMAGE'][which]
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32); img.pixels.foreach_get(px)
    return img, px.reshape(h, w, 4)    # rows from the bottom (Blender), linear for sRGB images? (see to_srgb)


def sample(px, uv):
    h, w = px.shape[:2]
    x = np.clip((uv[:, 0] % 1) * w, 0, w - 1).astype(int)
    y = np.clip((uv[:, 1] % 1) * h, 0, h - 1).astype(int)
    return px[y, x, :3]


def hair_faces(ob, px):
    """Which triangles are hair: brown in the texture, and in the largest
    piece of brown surface on the head (his brows, eyes and mouth are
    separate brown islands on the face, so they stay out)."""
    from scipy.sparse import coo_matrix
    from scipy.sparse.csgraph import connected_components
    me = ob.data
    cen, tuv = face_arrays(ob)
    col = sample(px, tuv.mean(1)) * 255
    R, G, B = col.T
    brown = (R > G) & (G >= B * .8) & (R < 140) & (R - B > 12) & (cen[:, 2] > .55)
    # the model's texture islands are separate pieces of mesh: join corners
    # that sit at the same place, then faces sharing a welded edge touch
    co = np.empty(len(me.vertices) * 3); me.vertices.foreach_get('co', co)
    _, weld = np.unique(np.round(co.reshape(-1, 3) * 2e5).astype(np.int64), axis=0, return_inverse=True)
    lv = np.empty(len(me.loops), dtype=np.int64); me.loops.foreach_get('vertex_index', lv)
    tri = weld.ravel()[lv].reshape(-1, 3)
    n = len(me.polygons)
    e = np.concatenate([np.sort(tri[:, [0, 1]], 1), np.sort(tri[:, [1, 2]], 1), np.sort(tri[:, [2, 0]], 1)])
    fe = np.concatenate([np.arange(n)] * 3)
    key = e[:, 0] * (weld.max() + 1) + e[:, 1]
    order = np.argsort(key, kind='stable')
    k_sorted, f_sorted = key[order], fe[order]
    same = k_sorted[1:] == k_sorted[:-1]
    a, b = f_sorted[:-1][same], f_sorted[1:][same]
    keep = brown[a] & brown[b]
    g = coo_matrix((np.ones(keep.sum()), (a[keep], b[keep])), shape=(n, n))
    k, lab = connected_components(g, directed=False)
    sizes = np.bincount(lab[brown], minlength=k)
    big = np.argmax(sizes)
    hair = brown & (lab == big)
    return hair, brown, lab, sizes


def measure_eyes(ob, out_png=None):
    """Find his painted eyes: a flat (unlit) orthographic picture of his face
    from the front, the whites found there, the opening filled (iris and lash
    line inside), ellipse by image moments, depth by casting a ray at the
    model. Returns per eye (+x first): centre (x, y, z), half-width,
    half-height, iris centre (x, z) and iris radius, all in metres."""
    import cv2
    from mathutils import Vector
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'     # the .blend may default to Eevee (needs a GPU)
    mat = ob.data.materials[0]
    N, L = mat.node_tree.nodes, mat.node_tree.links
    out = [n for n in N if n.type == 'OUTPUT_MATERIAL'][0]
    keep = out.inputs['Surface'].links[0].from_socket
    tex = [n for n in N if n.type == 'TEX_IMAGE'][0]
    em = N.new('ShaderNodeEmission'); L.new(tex.outputs['Color'], em.inputs['Color'])
    L.new(em.outputs[0], out.inputs['Surface'])
    cd = bpy.data.cameras.new('EyeCam'); cd.type = 'ORTHO'; cd.ortho_scale = .4
    cam = bpy.data.objects.new('EyeCam', cd); sc.collection.objects.link(cam)
    cam.location = (0, -2, .8); cam.rotation_euler = (math.radians(90), 0, 0)
    old = sc.camera, sc.render.resolution_x, sc.render.resolution_y, sc.cycles.samples, sc.view_settings.view_transform, sc.render.filepath
    sc.camera = cam; sc.render.resolution_x = sc.render.resolution_y = 800; sc.cycles.samples = 4
    sc.view_settings.view_transform = 'Standard'
    path = out_png or os.path.join(HERE, 'in', 'eyes-flat.png')
    sc.render.filepath = path; bpy.ops.render.render(write_still=True)
    L.new(keep, out.inputs['Surface']); N.remove(em)
    sc.camera, sc.render.resolution_x, sc.render.resolution_y, sc.cycles.samples, sc.view_settings.view_transform, sc.render.filepath = old
    a = np.array(Image.open(path).convert('RGB')).astype(int)
    px2m = .4 / 800                        # metres per pixel; image centre = (0, .8)
    to_xz = lambda u, v: ((u - 400) * px2m, .8 - (v - 400) * px2m)
    white = ((a > 200).all(-1)).astype(np.uint8)
    n, lab, st, cent = cv2.connectedComponentsWithStats(white)
    eyes = []
    # the two biggest white blobs above the mouth (z > .72) are the eyes
    cands = [i for i in range(1, n) if to_xz(*cent[i])[1] > .72 and st[i, cv2.CC_STAT_AREA] > 300]
    cands = sorted(cands, key=lambda i: -st[i, cv2.CC_STAT_AREA])[:2]
    for i in sorted(cands, key=lambda i: -cent[i][0]):
        m = (lab == i).astype(np.uint8)
        hull = cv2.convexHull(cv2.findNonZero(m))
        fill = np.zeros_like(m); cv2.fillConvexPoly(fill, hull, 1)
        ys, xs = np.nonzero(fill)
        cx, cy = xs.mean(), ys.mean()
        hw, hh = (xs.max() - xs.min()) / 2, (ys.max() - ys.min()) / 2
        dark = fill.astype(bool) & (a.sum(-1) < 260)
        dys, dxs = np.nonzero(dark)
        ix, iy = dxs.mean(), dys.mean()
        ir = np.sqrt(dark.sum() / math.pi)
        x, z = to_xz(cx, cy)
        hit, loc, nrm, *_ = sc.ray_cast(bpy.context.evaluated_depsgraph_get(), Vector((x, -2, z)), Vector((0, 1, 0)))
        eyes.append(dict(c=(x, loc.y if hit else -.15, z), hw=hw * px2m, hh=hh * px2m, iris=to_xz(ix, iy), ir=ir * px2m,
                         normal=tuple(nrm) if hit else (0, -1, 0)))
    bpy.data.objects.remove(cam)
    return eyes
