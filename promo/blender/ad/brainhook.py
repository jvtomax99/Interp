"""Hook, take 2: "inside the brain" (Jose's pick, 2026-10-22). A rough
5-second motion test.
    python brainhook.py [frames...]   -> renders/brainhook/f_0001.png ...
Then hook_sound2 in brainhook_sound.py and ffmpeg make build/brainhook.mp4.

Beats (30 fps, 120 BPM)
  1-68    inside the real HUMC Brain, drawn the way the app draws it (glow
          halos, additive tracts, bloom; Jose's screen recording): signals
          racing past; the app's readout (live numbers: 118 nuclei, 1,097 tracts)
  68-98   pull back: the whole brain appears
  96-122  it shrinks and flies into Dr. Smiley's head on the real Home
          screen, which lights up (the double-tap, in reverse)
  122     rings snap in round his head
  126,132 INTERPRETER, HUB slam in above the phone
  140-150 white flash into the next section
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
import numpy as np  # noqa: E402
from mathutils import Vector  # noqa: E402
from PIL import Image, ImageDraw, ImageFont  # noqa: E402

import assets as A  # noqa: E402
from hook import BLACK, back, ease_out, key, mat_face, mat_side, word  # noqa: E402
from storyboard2 import PH_H, PH_W, phone, ring, sheen  # noqa: E402
from storyboard3 import fresh  # noqa: E402

FPS, N = 30, 150
W, H = 540, 960
OUT = os.path.join(A.HERE, 'renders', 'brainhook')
rnd = random.Random(5)
PHONE_Y, PHONE_H = 0.6, 1.6
HEAD = Vector(((0.746 - 0.5) * PHONE_H * PH_W / PH_H, PHONE_Y - 0.05, (0.5 - 0.29) * PHONE_H))


def smooth(a, b, t):
    t = min(1.0, max(0.0, t))
    t = t * t * (3 - 2 * t)
    return a + (b - a) * t


def soft(name, strength, attr='col', solid=False, tint_white=0.0, see_through=0.0):
    """Emission that adds up like the page's additive sprites: a soft ball
    (bright middle, fading edge), or for lines just partly see-through."""
    m = bpy.data.materials.new(name)
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    a = nt.nodes.new('ShaderNodeAttribute')
    a.attribute_name = attr
    col = a.outputs['Color']
    if tint_white:
        mx = nt.nodes.new('ShaderNodeMix')
        mx.data_type = 'RGBA'
        mx.inputs['Factor'].default_value = tint_white
        nt.links.new(col, mx.inputs[6])
        mx.inputs[7].default_value = (1, 1, 1, 1)
        col = mx.outputs[2]
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Strength'].default_value = strength
    nt.links.new(col, em.inputs['Color'])
    tr = nt.nodes.new('ShaderNodeBsdfTransparent')
    mix = nt.nodes.new('ShaderNodeMixShader')
    if solid:
        mix.inputs['Fac'].default_value = 1.0 - see_through
    else:   # a soft ball: opaque at the middle, nothing at the rim
        lw = nt.nodes.new('ShaderNodeLayerWeight')
        lw.inputs['Blend'].default_value = 0.5
        pw = nt.nodes.new('ShaderNodeMath')
        pw.operation = 'POWER'
        inv = nt.nodes.new('ShaderNodeMath')
        inv.operation = 'SUBTRACT'
        inv.inputs[0].default_value = 1.0
        nt.links.new(lw.outputs['Facing'], inv.inputs[1])
        nt.links.new(inv.outputs[0], pw.inputs[0])
        pw.inputs[1].default_value = 2.2
        nt.links.new(pw.outputs[0], mix.inputs['Fac'])
    nt.links.new(tr.outputs[0], mix.inputs[1])
    nt.links.new(em.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs['Surface'])
    return m


def app_look(B, coll):
    """Restyle assets.brain() the way brain/index.html draws it: each nucleus
    a glow (halo) round a whiter core, tracts thin and additive, the surface
    a faint dotted shell."""
    d = B['data']
    groups = d['groups']
    pts, cols, cores, halos = [], [], [], []
    for n in d['nodes']:
        p = d['pos'][n['i']]
        pts.append((p[0], -p[2], p[1]))
        cols.append(A.srgb(groups[n['group']]['color']))
        size = 0.05 + 0.021 * math.sqrt(n['bytes'] / 1024)      # the page's sprite size
        cores.append(size * 0.13)
        halos.append(size * 0.42)
    B['nuclei'].data.materials.clear()
    B['nuclei'].modifiers['points'].node_group.nodes['Set Material'].inputs['Material'].default_value = \
        soft('core', 7.0, solid=True, tint_white=0.4)
    rad = B['nuclei'].data.attributes['rad']
    rad.data.foreach_set('value', np.asarray(cores, np.float32))
    B['halo'] = A._points('halos', pts, cols, halos, soft('halo', 1.3), coll)
    B['shell'].modifiers['points'].node_group.nodes['Set Material'].inputs['Material'].default_value = \
        soft('shell', 1.1, solid=True, see_through=0.35)
    cu = B['tracts'].data
    cu.bevel_depth = 0.0007
    for i, m in enumerate(cu.materials):
        hexc = m.node_tree.nodes['Emission'].inputs['Color'].default_value
        cu.materials[i] = A.emission('tract app %d' % i, '#FFFFFF', 0.8)
        nt = cu.materials[i].node_tree
        nt.nodes['Emission'].inputs['Color'].default_value = tuple(0.65 * c + 0.35 for c in hexc[:3]) + (1,)
        em, out = nt.nodes['Emission'], nt.nodes['Material Output']
        tr = nt.nodes.new('ShaderNodeBsdfTransparent')
        mx = nt.nodes.new('ShaderNodeMixShader')
        mx.inputs['Fac'].default_value = 0.6
        nt.links.new(tr.outputs[0], mx.inputs[1])
        nt.links.new(em.outputs[0], mx.inputs[2])
        nt.links.new(mx.outputs[0], out.inputs['Surface'])


def build():
    sc = fresh(bg='#060A17')
    sc.render.resolution_x, sc.render.resolution_y = W, H
    sc.cycles.samples = 10
    sc.render.use_motion_blur = True
    sc.render.motion_blur_shutter = 0.4
    sc.frame_start, sc.frame_end = 1, N

    coll, B = A.brain()
    app_look(B, coll)
    d = B['data']
    # One handle for the whole brain, so it can shrink and fly as one.
    pivot = A.link(bpy.data.objects.new('brain', None))
    bpy.context.view_layer.update()
    for o in (B['shell'], B['nuclei'], B['tracts'], B['halo']):
        o.parent = pivot
        o.matrix_parent_inverse = pivot.matrix_world.inverted()

    # Signals: bright dots running along real tracts (moved every frame).
    P = [Vector((p[0], -p[2], p[1])) for p in d['pos']]
    edges = rnd.sample(d['edges'], 90)
    paths = []
    for e in edges:
        a, b = P[e['a']], P[e['b']]
        c = Vector((e['c'][0], -e['c'][2], e['c'][1]))
        paths.append((a, b, c, rnd.uniform(0, 1), rnd.uniform(0.9, 1.6), d['groups'][d['nodes'][e['b']]['group']]['color']))
    me = bpy.data.meshes.new('signals')
    me.vertices.add(len(paths))
    sig = A._points('signals', [(0, 0, 0)] * len(paths), [A.srgb(p[5]) for p in paths], [0.012] * len(paths),
                    A.emission('signals', strength=9.0, attr='col'), coll)
    sig.parent = pivot

    sheen()
    before = set(bpy.data.objects)
    phone('home', (0, PHONE_Y, 0), rot_z=0.0, h=PHONE_H)
    ph = [o for o in bpy.data.objects if o not in before]
    scr_mat = bpy.data.materials.get('screen home')
    rings = [ring(HEAD + Vector((0, -0.02, 0)), r, '#5FD3F3', 3.0, 0.006) for r in (0.08, 0.14, 0.2)]

    white = mat_face('white face', '#FFFFFF', 2.0)
    cyan_side = mat_side('cyan side', '#5FD3F3')
    cam_end = cam_end_pos()
    t1 = word('INTERPRETER', (0, PHONE_Y - 0.3, 1.13), 0.13, white, cyan_side, BLACK, cam_end)
    t2 = word('HUB', (0, PHONE_Y - 0.3, 0.97), 0.13, white, cyan_side, BLACK, cam_end)

    cd = bpy.data.cameras.new('cam')
    cam = A.link(bpy.data.objects.new('cam', cd))
    sc.camera = cam
    global LABELS
    LABELS = []
    for g, info in d['groups'].items():
        if g == 'other':
            continue
        pts = [d['pos'][n['i']] for n in d['nodes'] if n['group'] == g]
        c = Vector([sum(p[i] for p in pts) / len(pts) for i in range(3)])
        LABELS.append((Vector((c.x, -c.z, c.y)), info['name'].upper(), '%s · %s' % (info['region'], info['code']), info['color']))
    return sc, cam, pivot, sig, paths, ph, scr_mat, rings, t1, t2


def animate(sc, cam, pivot, sig, paths, ph, scr_mat, rings, t1, t2):
    for f in range(1, N + 1):
        # Camera: inside, flying through the middle where the tracts converge;
        # then back out to the whole brain; then to the phone.
        if f <= 68:
            t = (f - 1) / 67
            pos = Vector((smooth(-1.05, 0.35, t), smooth(0.25, -0.15, t), smooth(0.2, 0.0, t)))
            tgt = pos + Vector((1.0, -0.15 + 0.3 * math.sin(t * 2.2), -0.05))
            lens = 22
        elif f <= 100:   # out fast, so the wide lens doesn't stretch the brain
            # out to the side: from the front the brain reads as a bow-tie;
            # from the side it reads as a brain
            t = ease_out((f - 68) / 32)
            pos = Vector((0.35, -0.15, 0)).lerp(Vector((4.3, -2.0, 0.5)), t)
            a = Vector((0.35, -0.15, 0)) + Vector((1.0, -0.15 + 0.3 * math.sin(2.2), -0.05))
            tgt = a.lerp(Vector((0, 0.1, 0.0)), min(1.0, t * 1.6))
            lens = smooth(22, 35, (f - 68) / 12)
        else:
            t = (f - 100) / 24
            pos = Vector((4.3, -2.0, 0.5)).lerp(Vector(cam_end_pos()), ease_out(t))
            tgt = Vector((0, 0.1, 0.0)).lerp(Vector((0, PHONE_Y, 0.2)), ease_out(t))
            lens = smooth(32, 35, t)
        cam.location = pos
        cam.rotation_euler = (tgt - pos).to_track_quat('-Z', 'Y').to_euler()
        cam.data.lens = lens
        cam.keyframe_insert('location', frame=f)
        cam.keyframe_insert('rotation_euler', frame=f)
        cam.data.keyframe_insert('lens', frame=f)

        # The brain: whole until 96, then shrinks into his head and is gone at 123.
        t = ease_out((f - 96) / 26)
        s = 1.0 + (0.045 - 1.0) * t if f < 122 else max(0.0005, 0.045 * (1 - (f - 122) / 2))
        key(pivot, f, loc=Vector((0, 0, 0)).lerp(HEAD, t), scale=s)

        # The Home screen lights up as the brain lands.
        if scr_mat:
            sv = scr_mat.node_tree.nodes['Principled BSDF'].inputs['Emission Strength']
            sv.default_value = smooth(0.0, 1.0, (f - 98) / 18)
            sv.keyframe_insert('default_value', frame=f)

        # Rings snap in round his head (the double-tap, in reverse).
        for k, r in enumerate(rings):
            u = (f - 122 - k) / 6
            key(r, f, scale=max(0.001, 2.5 - 1.5 * ease_out(u)) if u >= 0 else 0.001, hide=not (0 <= u < 1.6))

        # INTERPRETER, HUB slam in.
        for word_, land in ((t1, 126), (t2, 132)):
            for p in word_:
                at = land + p['frac'] * 3
                rest = Vector(p['rest_loc'])
                rr = tuple(p['rest_rot'])
                if f < at - 4:
                    key(p, f, loc=rest + Vector((0, -0.8, 0.05)), rot=rr, scale=0.001, hide=True)
                elif f <= at:
                    u = (f - (at - 4)) / 4
                    key(p, f, loc=rest + Vector((0, -0.8 * (1 - u) ** 2, 0.05 * (1 - u))), rot=rr, scale=2.0 - u, hide=False)
                else:
                    key(p, f, loc=rest, rot=rr, scale=back((f - at) / 6, 3.0) if f - at < 6 else 1.0, hide=False)

    for a in bpy.data.actions:
        for fc in getattr(a, 'fcurves', []):
            for kp in fc.keyframe_points:
                kp.interpolation = 'CONSTANT' if fc.data_path == 'hide_render' else 'LINEAR'


def cam_end_pos():
    return (0, -1.75, 0.22)        # the phone fills about two thirds of the frame


def move_signals(sig, paths, f):
    co = []
    for a, b, c, phase, speed, _ in paths:
        u = (phase + f / FPS * speed) % 1.0
        q = (1 - u) ** 2 * a + 2 * (1 - u) * u * c + u * u * b
        co.extend(q)
    sig.data.vertices.foreach_set('co', np.asarray(co, np.float32))
    sig.data.update()


FONTS = os.path.join(A.BUILD, 'fonts')
MONO = os.path.join(FONTS, 'PlexMono-Medium.ttf')     # the page uses JetBrains Mono; Plex Mono is the closest here
INTER_B = '/usr/share/fonts/opentype/inter/Inter-Bold.otf'
LABELS = []
# The live app's numbers (Jose's screen recording, 2026-10-22); this checkout's
# data has 119 / 1,115, a slightly different version.
TELE = [('Nuclei', '118'), ('Tracts', '1,097'), ('Mean degree', '18.6')]


def spaced(dr, xy, txt, font, fill, track):
    x, y = xy
    for ch in txt:
        dr.text((x, y), ch, font=font, fill=fill)
        x += dr.textlength(ch, font=font) + track
    return x


def bloom(im):
    """The page's glow: bright parts blurred and added back, twice."""
    from PIL import ImageFilter
    a = np.asarray(im).astype(np.float32) / 255
    lum = a.mean(2, keepdims=True)
    bright = Image.fromarray((np.clip((a - 0.45) * 1.8, 0, 1) * 255).astype('uint8'))
    b1 = np.asarray(bright.filter(ImageFilter.GaussianBlur(5))).astype(np.float32) / 255
    b2 = np.asarray(bright.filter(ImageFilter.GaussianBlur(22))).astype(np.float32) / 255
    out = 1 - (1 - a) * (1 - 0.55 * b1) * (1 - 0.45 * b2)          # screen blend
    h, w = out.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    v = 1 - 0.35 * (((xx - w / 2) / (w * 0.7)) ** 2 + ((yy - h / 2) / (h * 0.7)) ** 2)
    return Image.fromarray((np.clip(out * v[..., None], 0, 1) * 255).astype('uint8'))


def post(f, path, labels=()):
    im = bloom(Image.open(path).convert('RGB'))
    layer = Image.new('RGBA', im.size, (0, 0, 0, 0))
    dr = ImageDraw.Draw(layer)
    if 14 <= f < 100:   # the page's own readout, top left
        a = min(1.0, (f - 14) / 6) * min(1.0, (100 - f) / 8)
        cyan = (1, 184, 230, int(255 * a))
        mono = ImageFont.truetype(MONO, 14)
        spaced(dr, (26, 54), 'CONNECTOMIC TRACTOGRAPHY · DTI', mono, cyan, 1.6)
        dr.text((26, 76), 'HUMC Brain', font=ImageFont.truetype(INTER_B, 34), fill=(233, 238, 250, int(255 * a)))
        x = 26
        small = ImageFont.truetype(MONO, 14)
        for k, (lab, val) in enumerate(TELE):
            if f < 22 + k * 5:
                break
            x = spaced(dr, (x, 124), lab + ' ', small, (106, 119, 158, int(255 * a)), 0.3)
            x = spaced(dr, (x, 124), val + '   ', small, (233, 238, 250, int(255 * a)), 0.3)
        pts = []   # the EEG trace, scrolling
        for i in range(120):
            u = i / 119
            y = 162 + 7 * math.sin(i * 0.9 + f * 0.7) * math.sin(i * 0.13 + f * 0.05)
            if (i + f * 2) % 37 == 0:
                y -= 16
            pts.append((26 + u * 300, y))
        dr.line(pts, fill=(1, 184, 230, int(200 * a)), width=2)
        if (f // 8) % 2 == 0:
            dr.ellipse((26, 182, 34, 190), fill=(61, 220, 151, int(255 * a)))
        dr.text((40, 179), 'Acquiring', font=small, fill=(61, 220, 151, int(255 * a)))
    for (x, y, name, sub, col, a) in labels:   # region labels, as on the page
        r, g, b = (int(col[i:i + 2], 16) for i in (1, 3, 5))
        f1 = ImageFont.truetype(MONO, 14)
        f2 = ImageFont.truetype(MONO, 12)
        w1 = sum(dr.textlength(ch, font=f1) + 1.5 for ch in name)
        spaced(dr, (x - w1 / 2, y), name, f1, (r, g, b, int(255 * a)), 1.5)
        w2 = dr.textlength(sub, font=f2)
        dr.text((x - w2 / 2, y + 18), sub, font=f2, fill=(106, 119, 158, int(255 * a)))
    im = Image.alpha_composite(im.convert('RGBA'), layer).convert('RGB')
    if f >= 140:
        im = Image.blend(im, Image.new('RGB', im.size, (255, 255, 255)), min(1.0, ((f - 140) / 10) ** 2))
    im.save(path)


def label_spots(sc, cam, pivot, f):
    """Where each region's name goes on screen this frame (during the pull-back)."""
    from bpy_extras.object_utils import world_to_camera_view
    if not 76 <= f < 98:
        return []
    a = min(1.0, (f - 76) / 5) * min(1.0, (98 - f) / 5)
    out = []
    for c, name, sub, col in LABELS:
        p = pivot.matrix_world @ c
        v = world_to_camera_view(sc, cam, p)
        if v.z > 0 and 0.05 < v.x < 0.95 and 0.05 < v.y < 0.95:
            out.append((v.x * W, (1 - v.y) * H, name, sub, col, a))
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    parts = build()
    sc = parts[0]
    animate(*parts)
    only = [int(x) for x in sys.argv[1:]] or range(1, N + 1)
    for f in only:
        sc.frame_set(f)
        move_signals(parts[3], parts[4], f)
        path = os.path.join(OUT, 'f_%04d.png' % f)
        sc.render.filepath = path
        bpy.ops.render.render(write_still=True)
        post(f, path, label_spots(sc, parts[1], parts[2], f))
        print('frame', f, flush=True)


if __name__ == '__main__':
    main()
