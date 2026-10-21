"""Shared helpers for working on Jose's Tripo model (steps 4-6 of out/plan-tripo.png)."""
import os
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
