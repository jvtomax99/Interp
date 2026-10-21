"""Steps 4-6 of out/plan-tripo.png on Jose's Tripo model: no gloss, his hair
recoloured to the drawing's browns, and reshaped to the drawing's outline.

  python3 tripo_fix.py            -> in/tripo-fixed.blend, in/hair_tex.png
"""
import os, sys, math
import numpy as np
import bpy
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tripo_lib as T
import build

HERE = T.HERE
# The drawing's hair outline over its head outline, by angle in the front view
# (0 = his left, your right; 90 = top): 1 + build.HAIR_T / head radius (~200 mm).
RATIO = [(a, 1 + t / 200) for a, t in build.HAIR_T]
# the drawing's hair tones at brightness percentiles 10..97 (measured on base.webp)
PAL = np.array([[24, 2, 1], [53, 12, 4], [72, 22, 10], [99, 42, 30], [143, 74, 56], [166, 90, 70]], np.float32)
PQ = np.array([.10, .30, .50, .70, .90, .97])
# The colour map is lit before you see it, so the drawn browns are corrected by
# what the render does to them (measured: drawn median 85,30,18 against the
# rendered median of the first try, 83,56,51), and their spread widened.
# Tuned with the warm light (build STYLE_NOW 'tripo') to a rendered middle tone
# of 88,38,30 against the drawing's 85,30,18.
GAIN = np.array([1.02, .54, .35], np.float32) * np.array(os.environ.get('HAIR_GAIN', '.55,.55,.5').split(','), np.float32)
SPREAD = float(os.environ.get('HAIR_SPREAD', 1.6))


def matte(ob):
    """Soft matte everywhere: roughness at least .62, no metal, low specular."""
    for m in ob.data.materials:
        N, L = m.node_tree.nodes, m.node_tree.links
        b = N['Principled BSDF']
        if b.inputs['Roughness'].links:
            src = b.inputs['Roughness'].links[0].from_socket
            mx = N.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'; mx.inputs[1].default_value = .62
            L.new(src, mx.inputs[0]); L.new(mx.outputs[0], b.inputs['Roughness'])
        else:
            b.inputs['Roughness'].default_value = max(.62, b.inputs['Roughness'].default_value)
        for l in list(b.inputs['Metallic'].links):
            L.remove(l)
        b.inputs['Metallic'].default_value = 0
        b.inputs['Specular IOR Level'].default_value = float(os.environ.get('SPEC', .1))   # .1: no shine, and no grey film on the hair
        b.inputs['Coat Weight'].default_value = 0


def recolour(ob, px, hair):
    """Paint the hair's texels with the drawing's browns, keeping each texel's
    rank in brightness (so the strands stay where they are)."""
    from PIL import Image, ImageDraw
    img = [n.image for n in ob.data.materials[0].node_tree.nodes if n.type == 'TEX_IMAGE'][0]
    h, w = px.shape[:2]
    _, tuv = T.face_arrays(ob)
    mask = Image.new('L', (w, h), 0); g = ImageDraw.Draw(mask)
    for tri in tuv[hair]:
        g.polygon([(u * w, (1 - v) * h) for u, v in tri], fill=255)
    m = np.array(mask)[::-1] > 0          # back to Blender's bottom-up rows
    rgb = px[..., :3]
    lum = (rgb * [.3, .59, .11]).sum(-1)
    v = lum[m]
    rank = np.argsort(np.argsort(v)) / max(1, len(v) - 1)
    pal = PAL * GAIN
    med = pal[2]
    pal = np.clip(med + (pal - med) * SPREAD, 0, 255)
    new = np.stack([np.interp(rank, PQ, pal[:, c]) for c in range(3)], 1) / 255
    out = px.copy(); out[..., :3][m] = new
    img.pixels.foreach_set(out.ravel())
    img.update()
    path = os.path.join(HERE, 'in', 'hair_tex.png')
    img.filepath_raw = path; img.file_format = 'PNG'; img.save()
    # the GLB's images are embedded, and an embedded image keeps its own copy:
    # load the edited file as a new image and put that one in the material
    new_img = bpy.data.images.load(path)
    new_img.pack()
    for n in ob.data.materials[0].node_tree.nodes:
        if n.type == 'TEX_IMAGE' and n.image == img:
            n.image = new_img
    return m.sum()


def reshape(ob, hair):
    """The drawing's swoop: the hair over the front of the top lifted up and
    towards his left (+X), a little forward, the most at QUIFF and fading
    out from it; roots held where the hair meets skin, so the hairline stays."""
    from scipy.spatial import cKDTree
    me = ob.data
    co = np.empty(len(me.vertices) * 3); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
    lv = np.empty(len(me.loops), dtype=np.int64); me.loops.foreach_get('vertex_index', lv)
    tri = lv.reshape(-1, 3)
    hv = np.zeros(len(co), bool); hv[tri[hair].ravel()] = True
    nv = np.zeros(len(co), bool); nv[tri[~hair].ravel()] = True
    head = co[:, 2] > .55
    skin = head & nv & ~hv
    yf = co[head, 1].min()
    top = co[hv, 2].max()
    Q = np.array([.03, yf + .09, top - .04])          # front of the top, a little to his left
    d2 = ((co - Q) ** 2).sum(1)
    wq = np.exp(-d2 / (2 * SWOOP_R ** 2))
    d, _ = cKDTree(co[skin]).query(co[hv], k=1)
    wr = np.zeros(len(co)); wr[hv] = np.clip(d / .03, 0, 1) ** 1.5
    w = (wq * wr)[:, None]
    new = co.copy()
    new[hv] += (w * SWOOP)[hv]
    me.vertices.foreach_set('co', new.ravel()); me.update()
    print('swoop centre', Q.round(3), 'moved', int((w[:, 0] > .05).sum()), 'vertices, most', np.round(w.max() * SWOOP, 3))


SWOOP = np.array([float(v) for v in os.environ.get('SWOOP', '.014,-.008,.034').split(',')])   # metres at the centre (he is 1 m)
SWOOP_R = float(os.environ.get('SWOOP_R', .085))


if __name__ == '__main__':
    bpy.ops.wm.read_factory_settings(use_empty=True)
    ob = T.load()
    img, px = T.texture(ob)
    hair, *_ = T.hair_faces(ob, px)
    matte(ob)
    print('hair texels', recolour(ob, px, hair))
    reshape(ob, hair)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'in', 'tripo-fixed.blend'))
    print('done')
