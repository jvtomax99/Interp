"""Hook, take 2: "inside the brain" (Jose's pick, 2026-10-22). A rough
5-second motion test.
    python brainhook.py [frames...]   -> renders/brainhook/f_0001.png ...
Then hook_sound2 in brainhook_sound.py and ffmpeg make build/brainhook.mp4.

Beats (30 fps, 120 BPM; a beat every 15 frames). Revised after the review
(build/review_frames.png): a subject at frame 1, no dark stretch, big phone,
big held title, two readable labels, a plain-words caption, no scan jargon.
  1-15    frame 1: close on Dr. Smiley's own nucleus (pink), the camera
          rips back from it into the brain
  15-44   flying through: signals racing along the real tracts
  44-84   pull back to the whole brain in profile
          No words over the brain (Jose): no name, caption or labels.
  84-106  the phone rises in face-on; the brain shrinks into Dr. Smiley's
          head on the real Home screen, which lights up
  106,110 two taps, rings (the double-tap, in reverse)
  121,128 INTERPRETER, HUB slam in above the phone, held
  144-150 white flash into the next section
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
# Jose: the logo sits at the top, above the phone, never covering the app.
# The phone stays, the set stays dark, and the camera tilts up and back as
# the logo builds to make room (the white set and floor are switched off by
# ON_APP and kept in the code).
ON_APP = True
LOGO_AT, LOGO_W = Vector((0, PHONE_Y - 0.12, 1.24)), 0.78   # the middle of "Interpreter"'s line
START = Vector()
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

    # The logo (logo.py, after Jose's reference picture), built from the brain.
    import logo as LG
    cam_end = cam_end_pos()
    lg = LG.build(LOGO_AT, cam_end, LOGO_W)
    floor, lights = LG.light_set(min(p.location.z - p.dimensions.z / 2 for p in lg['hub']) - 0.01, PHONE_Y)
    lg['set'] = [floor] + lights
    lg['bg'], lg['dim'] = LG.world_backdrop(sc, '#060A17', light=0.25)
    # A soft bar of light only reflections see: the shine across the letters.
    bpy.ops.mesh.primitive_plane_add(size=1, location=(-2, -1.6, 1.0))
    shine = bpy.context.active_object
    shine.scale = (0.25, 3.0, 1)
    shine.rotation_euler = (0, math.radians(90), math.radians(-20))
    shine.data.materials.append(A.emission('shine', '#FFFFFF', 12))
    shine.visible_camera = shine.visible_diffuse = shine.visible_shadow = False
    lg['shine'] = shine
    t1, t2 = lg, None

    cd = bpy.data.cameras.new('cam')
    cam = A.link(bpy.data.objects.new('cam', cd))
    sc.camera = cam
    global LABELS, START
    biggest = max((n for n in d['nodes'] if n['group'] == 'smiley'), key=lambda n: n['bytes'])
    q = d['pos'][biggest['i']]
    START = Vector((q[0], -q[2], q[1]))          # Dr. Smiley's own nucleus
    LABELS = []
    for g, info in d['groups'].items():
        if g not in ('smiley', 'ask'):            # two readable labels, not seven
            continue
        pts = [d['pos'][n['i']] for n in d['nodes'] if n['group'] == g]
        c = Vector([sum(p[i] for p in pts) / len(pts) for i in range(3)])
        LABELS.append((Vector((c.x, -c.z, c.y)), info['name'].upper(), '%s · %s' % (info['region'], info['code']), info['color']))
    return sc, cam, pivot, sig, paths, ph, scr_mat, rings, t1, t2


def animate(sc, cam, pivot, sig, paths, ph, scr_mat, rings, t1, t2):
    inside = Vector((0.35, -0.15, 0.0))
    side = Vector((4.3, -2.0, 0.5))
    centre = Vector((0, 0.1, 0.0))
    for f in range(1, N + 1):
        if f <= 15:      # close on his nucleus, ripping back
            t = ease_out((f - 1) / 14)
            pos = (START + Vector((0.02, -0.3, 0.02))).lerp(START + Vector((-0.35, -0.75, 0.05)), t)
            tgt = START
            lens = 35
        elif f <= 44:    # flying through the middle, looking along the tracts
            t = (f - 15) / 29
            a = START + Vector((-0.35, -0.75, 0.05))
            pos = a.lerp(inside, smooth(0, 1, t))
            tgt = START.lerp(inside + Vector((1.0, -0.2, -0.05)), smooth(0, 1, t * 1.3))
            lens = smooth(35, 24, t * 2)
        elif f <= 84:    # pull back to the profile, always looking at the brain
            t = ease_out((f - 44) / 36)
            pos = inside.lerp(side, t)
            tgt = (inside + Vector((1.0, -0.2, -0.05))).lerp(centre, ease_out((f - 44) / 8))
            lens = smooth(24, 35, (f - 44) / 10)
        else:            # to the phone, face-on
            t = ease_out((f - 84) / 20)
            pos = side.lerp(Vector(cam_end_pos()), t)
            tgt = centre.lerp(Vector((0, PHONE_Y, 0.26)), t)
            lens = 35
        if f > 108 and ON_APP:          # tilt up and back: room for the logo above the phone
            u = ease_out((f - 108) / 14)
            pos = pos.lerp(Vector((0, PHONE_Y - 2.25, 0.5)), u)
            tgt = tgt.lerp(Vector((0, PHONE_Y, 0.48)), u)
        if f > 108 and not ON_APP:      # settle on the logo, centred, slightly from below like the reference
            u = ease_out((f - 108) / 14)
            pos = pos.lerp(Vector((0, LOGO_AT.y - 1.45, 0.12)), u)
            tgt = tgt.lerp(LOGO_AT + Vector((0, 0, -0.14)), u)
        cam.location = pos
        cam.rotation_euler = (tgt - pos).to_track_quat('-Z', 'Y').to_euler()
        cam.data.lens = lens
        cam.keyframe_insert('location', frame=f)
        cam.keyframe_insert('rotation_euler', frame=f)
        cam.data.keyframe_insert('lens', frame=f)

        # The brain: whole until 88, then shrinks into his head; gone at 108.
        t = ease_out((f - 88) / 18)
        s_ = 1.0 + (0.045 - 1.0) * t if f < 106 else max(0.0005, 0.045 * (1 - (f - 106) / 2))
        key(pivot, f, loc=Vector((0, 0, 0)).lerp(HEAD, t), scale=s_)

        # The phone: hidden inside the brain until it rises in at 84.
        for o in ph:
            if 'rest' not in o:
                o['rest'] = list(o.location)
            u = back((f - 84) / 12, 1.4)
            sink = 0 if ON_APP else 2.2 * max(0.0, min(1.0, (f - 108) / 8)) ** 2   # drops away as the logo starts
            key(o, f, loc=Vector(o['rest']) + Vector((0, 0, -1.2 * (1 - u) - sink)), hide=f < 84 or (f > 116 and not ON_APP))

        if scr_mat:      # the Home screen lights up as the brain lands
            sv = scr_mat.node_tree.nodes['Principled BSDF'].inputs['Emission Strength']
            sv.default_value = smooth(0.15, 1.0, (f - 92) / 16)
            sv.keyframe_insert('default_value', frame=f)

        for k, r in enumerate(rings):   # rings on the two taps, 106 and 110
            u = (f - (106 if k < 2 else 110) - (k % 2)) / 6
            key(r, f, scale=max(0.001, 2.5 - 1.5 * ease_out(u)) if u >= 0 else 0.001, hide=not (0 <= u < 1.6) or f >= 112)

        logo_frame(t1, f)

    for a in bpy.data.actions:
        for fc in getattr(a, 'fcurves', []):
            for kp in fc.keyframe_points:
                kp.interpolation = 'CONSTANT' if fc.data_path == 'hide_render' else 'LINEAR'


def logo_frame(lg, f):
    """The logo, built from the brain: from 110 the set brightens to the
    reference picture's white-blue; diamond tiles stream out of Dr. Smiley's
    head along arcs to their places; the letters assemble left to right as
    the stream passes (Interpreter 114-126, Hub 124-130); the bubbles pop
    (130, 133); a shine sweeps across (134-144)."""
    k = max(0.0, min(1.0, (f - 110) / 12))
    k = k * k * (3 - 2 * k)
    dark, light = Vector(A.srgb('#060A17')[:3]), Vector(A.srgb('#EEF4FD')[:3])
    c = dark.lerp(light, k)
    if ON_APP:
        c = dark
    for node in (lg['bg'], lg['dim']):
        node.inputs['Color'].default_value = (*c, 1)
        node.inputs['Color'].keyframe_insert('default_value', frame=f)
    for o in lg['set']:
        key(o, f, hide=f < 110 or (ON_APP and o.type != 'LIGHT'))
    fl = lg['set'][0].data.materials[0].node_tree.nodes['Principled BSDF'].inputs['Emission Strength']
    fl.default_value = 0.22 * k                       # the floor fades up with the set, no hard edge
    fl.keyframe_insert('default_value', frame=f)
    head = HEAD + Vector((0, -0.05, 0))
    for i, t in enumerate(lg['tiles']):
        at = 110 + (i % 21) * 0.75                     # streaming out over ~16 frames
        rest = Vector(t['rest_loc'])
        u = (f - at) / 9
        if u < 0:
            key(t, f, loc=head, scale=0.001, hide=True)
            continue
        e = ease_out(min(1.0, u))
        mid = head.lerp(rest, 0.5) + Vector((0, -0.15, 0.25))          # an arc, bowing up and toward us
        q = (1 - e) ** 2 * head + 2 * (1 - e) * e * mid + e * e * rest
        bob = 0.006 * math.sin(f * 0.25 + i) if u >= 1 else 0
        r = t['rest_rot']
        key(t, f, loc=q + Vector((0, 0, bob)), rot=(r[0], r[1] + (1 - e) * 3.0, r[2]),
            scale=(t['rest_scale'] * min(1.0, 0.3 + e), t['rest_scale'] * 0.28, t['rest_scale'] * min(1.0, 0.3 + e)), hide=False)
    for word_, start, span in ((lg['inter'], 114, 10), (lg['hub'], 124, 5)):
        for p in word_:
            at = start + p['frac'] * span
            rest = Vector(p['rest_loc'])
            rr = p['rest_rot']
            u = (f - at) / 7
            if u < 0:
                key(p, f, loc=rest, rot=rr, scale=0.001, hide=True)
            else:
                b = back(min(1.0, u), 2.6)
                key(p, f, loc=rest + Vector((0, -0.12 * (1 - min(1.0, u)), -0.04 * (1 - min(1.0, u)))),
                    rot=(rr[0] + 0.9 * (1 - min(1.0, b)), rr[1], rr[2]), scale=max(0.001, b), hide=False)
    for n, o in enumerate(lg['bubbles']):
        at = 130 + n * 3
        u = (f - at) / 6
        s0 = Vector(o['rest_scale'])
        key(o, f, scale=s0 * max(0.001, back(min(1.0, u), 2.4)) if u >= 0 else s0 * 0.001, hide=u < 0)
    u = (f - 134) / 10
    key(lg['shine'], f, loc=(-2.0 + 4.0 * max(0.0, min(1.0, u)), -1.6, 1.0))


def cam_end_pos():
    return (0, PHONE_Y - 1.85, 0.24)  # the phone fills about three quarters of the width


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
    raw = Image.open(path).convert('RGB')
    k = 0.6 * max(0.0, min(1.0, (f - 108) / 10))     # less bloom on the logo
    im = Image.blend(bloom(raw), raw, k) if k else bloom(raw)
    layer = Image.new('RGBA', im.size, (0, 0, 0, 0))
    dr = ImageDraw.Draw(layer)
    # No words over the brain (Jose, 2026-10-22): no name panel, no caption.
    for (x, y, name, sub, col, a) in labels:   # region labels, as on the page
        r, g, b = (int(col[i:i + 2], 16) for i in (1, 3, 5))
        f1 = ImageFont.truetype(os.path.join(FONTS, 'PlexMono-SemiBold.ttf'), 25)
        f2 = ImageFont.truetype(MONO, 17)
        w1 = sum(dr.textlength(ch, font=f1) + 1.5 for ch in name)
        bx = x - w1 / 2
        dr.rounded_rectangle((bx - 8, y - 4, bx + w1 + 6, y + 44), radius=8, fill=(6, 10, 23, int(150 * a)))
        spaced(dr, (bx, y), name, f1, (r, g, b, int(255 * a)), 1.5)
        w2 = dr.textlength(sub, font=f2)
        dr.text((x - w2 / 2, y + 26), sub, font=f2, fill=(164, 176, 204, int(255 * a)))
    im = Image.alpha_composite(im.convert('RGBA'), layer).convert('RGB')
    if f >= 144:
        im = Image.blend(im, Image.new('RGB', im.size, (255, 255, 255)), min(1.0, ((f - 144) / 6) ** 2))
    im.save(path)


def label_spots(sc, cam, pivot, f):
    """Where each region's name goes on screen this frame (during the pull-back)."""
    return []   # no words over the brain (Jose, 2026-10-22); the code below is kept for later
    from bpy_extras.object_utils import world_to_camera_view
    if not 58 <= f < 86:
        return []
    a = min(1.0, (f - 58) / 5) * min(1.0, (86 - f) / 5)
    out = []
    for c, name, sub, col in LABELS:
        p = pivot.matrix_world @ c
        v = world_to_camera_view(sc, cam, p)
        if v.z > 0 and 0.15 < v.x < 0.85 and 0.1 < v.y < 0.75:
            out.append((v.x * W, (1 - v.y) * H - 60, name, sub, col, a))
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
