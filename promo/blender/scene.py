"""Builds the 3D world and keys every object on all 360 frames.
    python scene.py          -> build/scene.blend
Needs build/ui.png, build/card/ and build/smiley/ (render_ui.cjs, smiley.py).

Every number comes from timeline.py. Nothing here is animated by hand:
for each frame the code works out where everything is, then stores it.
The camera looks along +Y; the screens stand in the plane y = 0.
"""
import math
import os

import bpy  # first: bmesh and mathutils only exist once Blender is loaded
import bmesh
from mathutils import Euler, Matrix, Vector

import timeline as T

B = T.BUILD


# ---------- small helpers ----------

def srgb(hexstr, a=1.0):
    """'#0B1030' -> linear RGBA, the way Blender stores colours."""
    out = []
    for i in (1, 3, 5):
        c = int(hexstr[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, a)


def lerp(a, b, t):
    return a + (b - a) * t


def vlerp(a, b, t):
    return Vector(a).lerp(Vector(b), t)


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease_out_back(t, s=1.7):
    t = clamp(t) - 1
    return 1 + (s + 1) * t ** 3 + s * t ** 2


def link(ob):
    bpy.context.scene.collection.objects.link(ob)
    return ob


def image(path, sequence=False):
    img = bpy.data.images.load(path, check_existing=True)
    if sequence:
        img.source = 'SEQUENCE'
    return img


def tex_node(nt, img, sequence=False):
    n = nt.nodes.new('ShaderNodeTexImage')
    n.image = img
    n.interpolation = 'Cubic'
    if sequence:
        n.image_user.frame_duration = T.FRAMES
        n.image_user.frame_start = 1
        n.image_user.frame_offset = 0
        n.image_user.use_auto_refresh = True
    return n


# ---------- materials ----------

def mat_screen(name, ui):
    """Black glossy glass with the interface glowing under it.
    Its Emission Strength is keyed per frame (the power)."""
    m = bpy.data.materials.new(name)
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = srgb('#05060E')
    bsdf.inputs['Roughness'].default_value = 0.05
    bsdf.inputs['Coat Weight'].default_value = 1.0
    bsdf.inputs['Coat Roughness'].default_value = 0.02
    t = tex_node(nt, ui)
    nt.links.new(t.outputs['Color'], bsdf.inputs['Emission Color'])
    bsdf.inputs['Emission Strength'].default_value = 1.0
    return m


def mat_body():
    m = bpy.data.materials.new('glass body')
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = srgb('#0A0D1E')
    bsdf.inputs['Roughness'].default_value = 0.12
    bsdf.inputs['Coat Weight'].default_value = 1.0
    return m


def mat_cutout(name, img, emit=1.0, lit=0.0, white_back=False):
    """A picture with see-through edges. emit 1 with lit 0 shows its
    pixels exactly (under the Standard view); lit adds room light on top."""
    m = bpy.data.materials.new(name)
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    t = tex_node(nt, img, sequence=True)
    col = t.outputs['Color']
    if white_back:
        geo = nt.nodes.new('ShaderNodeNewGeometry')
        mix = nt.nodes.new('ShaderNodeMix')
        mix.data_type = 'RGBA'
        nt.links.new(geo.outputs['Backfacing'], mix.inputs['Factor'])
        nt.links.new(t.outputs['Color'], mix.inputs[6])
        mix.inputs[7].default_value = srgb('#F4F6FA')
        col = mix.outputs[2]
    em = nt.nodes.new('ShaderNodeEmission')
    nt.links.new(col, em.inputs['Color'])
    em.inputs['Strength'].default_value = emit
    shader = em.outputs[0]
    if lit:
        dif = nt.nodes.new('ShaderNodeBsdfPrincipled')
        nt.links.new(col, dif.inputs['Base Color'])
        dif.inputs['Roughness'].default_value = 0.55
        add = nt.nodes.new('ShaderNodeMixShader')
        add.inputs['Fac'].default_value = lit
        nt.links.new(em.outputs[0], add.inputs[1])
        nt.links.new(dif.outputs[0], add.inputs[2])
        shader = add.outputs[0]
    clear = nt.nodes.new('ShaderNodeBsdfTransparent')
    mix = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(t.outputs['Alpha'], mix.inputs['Fac'])
    nt.links.new(clear.outputs[0], mix.inputs[1])
    nt.links.new(shader, mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs['Surface'])
    return m


def mat_shadow():
    """A soft dark oval. Its opacity is keyed (node 'opacity')."""
    m = bpy.data.materials.new('contact shadow')
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    tc = nt.nodes.new('ShaderNodeTexCoord')
    d = nt.nodes.new('ShaderNodeVectorMath')
    d.operation = 'DISTANCE'
    d.inputs[1].default_value = (0.5, 0.5, 0)
    nt.links.new(tc.outputs['UV'], d.inputs[0])
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value = 0.08
    mr.inputs['From Max'].default_value = 0.5
    mr.inputs['To Min'].default_value = 1.0
    mr.inputs['To Max'].default_value = 0.0
    nt.links.new(d.outputs['Value'], mr.inputs['Value'])
    op = nt.nodes.new('ShaderNodeValue')
    op.name = 'opacity'
    mul = nt.nodes.new('ShaderNodeMath')
    mul.operation = 'MULTIPLY'
    nt.links.new(mr.outputs[0], mul.inputs[0])
    nt.links.new(op.outputs[0], mul.inputs[1])
    dark = nt.nodes.new('ShaderNodeEmission')
    dark.inputs['Color'].default_value = (0, 0, 0, 1)
    clear = nt.nodes.new('ShaderNodeBsdfTransparent')
    mix = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(mul.outputs[0], mix.inputs['Fac'])
    nt.links.new(clear.outputs[0], mix.inputs[1])
    nt.links.new(dark.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs['Surface'])
    return m


def mat_glow(name, hexstr, strength, radial=False):
    m = bpy.data.materials.new(name)
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = srgb(hexstr)
    em.inputs['Strength'].default_value = strength
    if radial:
        tc = nt.nodes.new('ShaderNodeTexCoord')
        d = nt.nodes.new('ShaderNodeVectorMath')
        d.operation = 'DISTANCE'
        d.inputs[1].default_value = (0.5, 0.5, 0)
        nt.links.new(tc.outputs['UV'], d.inputs[0])
        mr = nt.nodes.new('ShaderNodeMapRange')
        mr.inputs['From Max'].default_value = 0.5
        mr.inputs['To Min'].default_value = strength
        mr.inputs['To Max'].default_value = 0.0
        mr.interpolation_type = 'SMOOTHERSTEP'
        nt.links.new(d.outputs['Value'], mr.inputs['Value'])
        nt.links.new(mr.outputs[0], em.inputs['Strength'])
        # Fade to see-through, not to black, so its edge melts into the void.
        fade = nt.nodes.new('ShaderNodeMapRange')
        fade.inputs['From Max'].default_value = 0.5
        fade.inputs['To Min'].default_value = 1.0
        fade.inputs['To Max'].default_value = 0.0
        fade.interpolation_type = 'SMOOTHERSTEP'
        nt.links.new(d.outputs['Value'], fade.inputs['Value'])
        clear = nt.nodes.new('ShaderNodeBsdfTransparent')
        mix = nt.nodes.new('ShaderNodeMixShader')
        nt.links.new(fade.outputs[0], mix.inputs['Fac'])
        nt.links.new(clear.outputs[0], mix.inputs[1])
        nt.links.new(em.outputs[0], mix.inputs[2])
        nt.links.new(mix.outputs[0], out.inputs['Surface'])
        return m
    nt.links.new(em.outputs[0], out.inputs['Surface'])
    return m


# ---------- meshes ----------

def slab(name, sx, sy, sz, rect, face, screen, body):
    """A box sx x sy x sz (metres) centred on its origin. One face shows
    `rect` of the interface image: 'front' (facing the camera, -Y) or
    'top' (+Z, for the keys)."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(sx, sy, sz), verts=bm.verts)
    uv = bm.loops.layers.uv.new()
    want = Vector((0, -1, 0)) if face == 'front' else Vector((0, 0, 1))
    rx, ry, rw, rh = rect
    for f in bm.faces:
        f.normal_update()
        if f.normal.dot(want) > 0.99:
            f.material_index = 0
            for lp in f.loops:
                c = lp.vert.co
                u = (rx + (c.x / sx + 0.5) * rw) / T.UI_W
                down = (c.z / sz + 0.5) if face == 'front' else (c.y / sy + 0.5)
                v = 1 - (ry + (1 - down) * rh) / T.UI_H
                lp[uv].uv = (u, v)
        else:
            f.material_index = 1
    bm.to_mesh(me)
    bm.free()
    me.materials.append(screen)
    me.materials.append(body)
    return link(bpy.data.objects.new(name, me))


def plane_xz(name, w, h, rows=1, bottom=0.0):
    """An upright w x h picture plane facing the camera, `rows` strips high.
    Its origin is at the middle of its bottom edge + `bottom`."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new()
    vs = [[bm.verts.new((x * w - w / 2, 0, -bottom + r / rows * h)) for x in (0, 1)] for r in range(rows + 1)]
    for r in range(rows):
        f = bm.faces.new((vs[r][0], vs[r][1], vs[r + 1][1], vs[r + 1][0]))
        for lp, (u, v) in zip(f.loops, ((0, r / rows), (1, r / rows), (1, (r + 1) / rows), (0, (r + 1) / rows))):
            lp[uv].uv = (u, v)
    bm.to_mesh(me)
    bm.free()
    return link(bpy.data.objects.new(name, me))


def plane_xy(name, w, d):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new()
    f = bm.faces.new([bm.verts.new((x, y, 0)) for x, y in ((-w / 2, -d / 2), (w / 2, -d / 2), (w / 2, d / 2), (-w / 2, d / 2))])
    for lp, c in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
        lp[uv].uv = c
    bm.to_mesh(me)
    bm.free()
    return link(bpy.data.objects.new(name, me))


def area_light(name, loc, target, power, size, hexstr='#FFFFFF'):
    l = bpy.data.lights.new(name, 'AREA')
    l.energy = power
    l.size = size
    l.color = srgb(hexstr)[:3]
    ob = link(bpy.data.objects.new(name, l))
    ob.location = loc
    ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    # The guide's fix for "big white blocks on the glass": lights never
    # show up in reflections, and never in the picture itself.
    ob.visible_glossy = False
    ob.visible_camera = False
    return ob


# ---------- motion: where Dr. Smiley is at any frame ----------

def hops():
    """Every jump as (take-off frame, landing frame, from, to)."""
    out = []
    lift = Vector(T.HOME_SPOT) + Vector((0, -0.12, 0.04))
    first_land, first_key = T.LANDINGS[0]
    out.append((first_land - T.FIRST_HOP_AIR, first_land, lift, Vector(T.key_centre(first_key))))
    for (_, a), (land, b) in zip(T.LANDINGS, T.LANDINGS[1:]):
        out.append((land - T.HOP_AIR, land, Vector(T.key_centre(a)), Vector(T.key_centre(b))))
    out.append((T.CARD_HOP_LAND - T.HOP_AIR, T.CARD_HOP_LAND,
                Vector(T.key_centre(T.LANDINGS[-1][1])), card_top()))
    return out


def card_centre(n):
    x, y, w, h = T.CARD
    base = Vector((T.ui_x(x + w / 2), -0.006, T.ui_z(y + h / 2)))
    a, b = T.CARD_LIFT
    t = T.smoothstep(a, b, n)
    bob = 0.006 * math.sin((n - b) / T.FPS * 2.2) * T.smoothstep(b, b + 20, n)
    return base + Vector((0, T.CARD_LIFT_Y * t, bob))


def card_top():
    c = card_centre(T.FRAMES)
    return Vector((0.30, c.y - 0.004, c.z + T.CARD[3] * T.PX / 2))


def smiley_state(n):
    """(position of his feet, x scale, z scale, roll, bend angle)."""
    breathe = 1 + 0.012 * math.sin(n / T.FPS * 2 * math.pi * 0.9)
    H = hops()
    # On the Home panel, peeling off.
    if n < H[0][0]:
        p = Vector(T.HOME_SPOT)
        bend = 0.0
        if n >= T.PEEL_START:
            k = (n - T.PEEL_START) / (T.PEEL_END - T.PEEL_START)
            curl = math.radians(-78)
            if k < 0.6:
                bend = curl * T.smoothstep(0, 0.6, k)
            else:
                bend = curl * (1 - ease_out_back((k - 0.6) / 0.4, 2.2))
            p = p + Vector((0, -0.12, 0.04)) * T.smoothstep(0.45, 1.0, k)
        return p, 1.0, breathe if n < T.PEEL_START else 1.0, 0.0, bend
    for i, (t0, t1, a, b) in enumerate(H):
        if t0 <= n < t1:                              # in the air
            t = (n - t0) / (t1 - t0)
            h = T.FIRST_HOP_HEIGHT if i == 0 else T.HOP_HEIGHT + (0.08 if i == len(H) - 1 else 0)
            rise = h + abs(b.z - a.z) / 2      # peaks about h above the higher end
            p = a.lerp(b, t)
            p.z = lerp(a.z, b.z, t) + 4 * rise * t * (1 - t)
            stretch = 1 + 0.12 * (abs(1 - 2 * t) ** 1.5)
            roll = math.radians(9) * math.sin(math.pi * t) * (1 if b.x < a.x else -1)
            return p, 1 / math.sqrt(stretch), stretch, roll, 0.0
    # On the ground: the last landing before n.
    landed = [h for h in H if h[1] <= n]
    t0, t1, a, b = landed[-1]
    p = b.copy()
    if t1 == T.CARD_HOP_LAND:
        p = card_top() + (card_centre(n) - card_centre(T.FRAMES))
        if n >= T.LAUGH:                              # a small happy bounce
            k = (n - T.LAUGH) / 12
            if k < 1:
                p.z += 0.05 * math.sin(math.pi * k)
    since = n - t1
    sq = 0.0
    if since < 14:                                    # landing: squash, spring back
        sq = -0.2 * math.exp(-since / 3.2) * math.cos(since * 0.62)
    nxt = [h for h in H if h[0] > n]
    if nxt and nxt[0][0] - n <= 4:                    # crouch before taking off
        sq += -0.14 * (1 - (nxt[0][0] - n) / 4)
    sz = (1 + sq) * breathe
    return p, 1 / math.sqrt(max(0.5, sz)), sz, 0.0, 0.0


def key_under(n):
    """The key he is standing on at frame n, or None."""
    for t0, t1, a, b in hops():
        if t0 <= n < t1:
            return None
    best = None
    for land, k in T.LANDINGS:
        if land <= n:
            best = k
    nxt = [h for h in hops() if h[0] > n]
    if best and n < T.CARD_HOP_LAND - T.HOP_AIR:
        return best
    return None


# ---------- panels: power and falling ----------

def power(name, n):
    """How bright a screen glows at frame n. 1.0 shows the interface's
    colours exactly; the drop brings everything up to it."""
    p = 0.78 + 0.22 * T.smoothstep(T.DROP - 3, T.DROP + 3, n)
    p += 0.35 * math.exp(-max(0, n - T.DROP) / 4) * (n >= T.DROP)
    for who, at in T.FALLS:
        if who == name:
            k = n - (at - T.POWER_DOWN)
            if k >= 0:
                flick = [1, .35, .9, .25, .7, .12, .4, .05]
                p *= flick[k] if k < len(flick) else 0.0
    return p


def fall_matrix(name, n, pivot):
    for who, at in T.FALLS:
        if who == name and n > at:
            t = (n - at) / T.FPS
            seed = sum(map(ord, name))
            drop = 0.5 * 7.0 * t * t
            tilt = -1.6 * t * t
            spin = (0.6 if seed % 2 else -0.6) * t * t
            R = Euler((tilt, spin, 0.25 * spin)).to_matrix().to_4x4()
            return (Matrix.Translation(pivot + Vector((0, 0.15 * t, -drop))) @ R
                    @ Matrix.Translation(-pivot))
    return Matrix.Identity(4)


# ---------- camera ----------

def camera_at(n, xs):
    S = T.SHOTS
    for (a, pa, ta, la, fa), (b, pb, tb, lb, fb) in zip(S, S[1:]):
        if a <= n <= b:
            k = T.smoothstep(a, b, n)
            pos, tgt = vlerp(pa, pb, k), vlerp(ta, tb, k)
            fstop = lerp(fa or 22, fb or 22, k)
            lens = lerp(la, lb, k)
            break
    else:
        _, pos, tgt, lens, fstop = S[-1]
        pos, tgt, fstop = Vector(pos), Vector(tgt), fstop or 22
    w = T.smoothstep(T.f(2.0), T.f(2.7), n) * (1 - T.smoothstep(T.f(7.6), T.f(8.5), n))
    dx = w * T.FOLLOW * xs[n]
    return pos + Vector((dx, 0, 0)), tgt + Vector((dx, 0, 0)), fstop, lens


# ---------- build ----------

def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = 1, T.FRAMES
    sc.render.fps = T.FPS
    sc.render.resolution_x, sc.render.resolution_y = T.WIDTH, T.HEIGHT
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = 24          # with the denoiser, no visible gain from 64 (tested)
    sc.cycles.use_denoising = True
    sc.cycles.adaptive_threshold = 0.02
    sc.cycles.max_bounces = 4
    sc.cycles.diffuse_bounces = 2
    sc.cycles.glossy_bounces = 3
    sc.cycles.transparent_max_bounces = 12
    sc.cycles.caustics_reflective = sc.cycles.caustics_refractive = False
    # Standard, not AgX: the app's colours and his drawing come out as
    # they are (the guide's "salmon pink" trap).
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'
    sc.view_settings.exposure = 0.0
    sc.render.image_settings.file_format = 'PNG'

    world = bpy.data.worlds.new('void')
    sc.world = world
    world.color = srgb('#0B1030')[:3]
    bg = world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = srgb('#0B1030')
    bg.inputs['Strength'].default_value = 1.0

    ui = image(os.path.join(B, 'ui.png'))
    body = mat_body()

    objs = {}
    # The three screens, standing up.
    for name, (x, y, w, h) in T.PANELS.items():
        ob = slab(name, w * T.PX, 0.03, h * T.PX, (x, y, w, h), 'front', mat_screen(name, ui), body)
        ob.location = (T.ui_x(x + w / 2), 0.015, T.ui_z(y + h / 2))
        objs[name] = ob
    # The key shelf and the six keys on it.
    xs = [T.KEY_RECTS[k][0] for k in T.KEYS]
    x0, x1 = min(xs) - 40, max(xs) + T.KEY_W + 40
    shelf = slab('shelf', (x1 - x0) * T.PX, 0.26, 0.03, (0, 0, 1, 1), 'none', body, body)
    shelf.location = (T.ui_x((x0 + x1) / 2), T.KEY_Y, -0.015)
    objs['shelf'] = shelf
    keys = {}
    for k in T.KEYS:
        ob = slab('key ' + k, T.KEY_W * T.PX, T.KEY_DEPTH, T.KEY_TOP_Z,
                  T.KEY_RECTS[k], 'top', mat_screen('key ' + k, ui), body)
        c = T.key_centre(k)
        ob.location = (c[0], c[1], T.KEY_TOP_Z / 2)
        keys[k] = ob

    # The card.
    cw, ch = T.CARD[2] * T.PX, T.CARD[3] * T.PX
    card = plane_xz('card', cw, ch, bottom=ch / 2)
    card.data.materials.append(mat_cutout('card', image(os.path.join(B, 'card', 'c_0001.png'), True)))

    # Dr. Smiley: his sticker picture is 500 x 620 (480 x 600 plus a 10 px rim).
    sw = T.SMILEY_W * 500 / 480
    sh = T.SMILEY_H * 620 / 600
    rim = T.SMILEY_H * 10 / 600
    smiley = plane_xz('dr smiley', sw, sh, rows=28, bottom=rim)
    smiley.data.materials.append(mat_cutout('dr smiley', image(os.path.join(B, 'smiley', 's_0001.png'), True),
                                            emit=0.9, lit=0.3, white_back=True))  # measured against the drawing
    bend = smiley.modifiers.new('peel', 'SIMPLE_DEFORM')
    bend.deform_method = 'BEND'
    bend.deform_axis = 'X'
    bend.angle = 0.0
    shadow = plane_xy('his shadow', 0.26, 0.09)
    sh_mat = mat_shadow()
    shadow.data.materials.append(sh_mat)

    # Light: soft and from the front, never seen in the glass.
    area_light('key light', (-1.6, -2.6, 2.4), (0, 0, 0.6), 160, 2.5)
    area_light('rim light', (1.4, 1.2, 2.2), (0.2, -0.3, 0.5), 90, 1.5, '#01B8E6')
    # A long dim strip only the glass can see: a soft sheen, not a white block.
    sheen = plane_xy('sheen', 5.0, 0.5)
    sheen.location = (0, -2.6, 2.7)
    sheen.rotation_euler = (math.radians(-60), 0, 0)
    sheen.data.materials.append(mat_glow('sheen', '#9FC4EA', 0.35))
    sheen.visible_camera = False
    sheen.visible_diffuse = False
    sheen.visible_shadow = False
    # The glow far below.
    floor = plane_xy('floor glow', 14, 14)
    floor.location = (0, 3, -2.4)
    floor.data.materials.append(mat_glow('floor glow', '#1B3F8F', 1.0, radial=True))

    cam_data = bpy.data.cameras.new('camera')
    cam_data.lens = 35
    cam_data.sensor_width = 36
    cam_data.dof.use_dof = True
    cam = link(bpy.data.objects.new('camera', cam_data))
    sc.camera = cam

    # ---- key every frame ----
    states = {n: smiley_state(n) for n in range(1, T.FRAMES + 1)}
    raw = {n: states[n][0].x for n in states}
    xs_s = {n: sum(raw[min(T.FRAMES, max(1, m))] for m in range(n - 8, n + 9)) / 17 for n in raw}

    # Blender works out matrix_world only on an update. Read it before one
    # and every panel is "at the origin" (the guide's "objects land in the
    # wrong place").
    bpy.context.view_layer.update()
    panel_rest = {name: ob.matrix_world.copy() for name, ob in objs.items()}
    key_rest = {k: ob.matrix_world.copy() for k, ob in keys.items()}
    shelf_pivot = shelf.location.copy()

    for n in range(1, T.FRAMES + 1):
        # Screens: power, then the fall.
        for name, ob in objs.items():
            if name == 'shelf':
                continue
            M = fall_matrix(name, n, panel_rest[name].to_translation()) @ panel_rest[name]
            ob.location, ob.rotation_euler = M.to_translation(), M.to_euler()
            ob.keyframe_insert('location', frame=n)
            ob.keyframe_insert('rotation_euler', frame=n)
            s = ob.data.materials[0].node_tree.nodes['Principled BSDF'].inputs['Emission Strength']
            s.default_value = power(name, n)
            s.keyframe_insert('default_value', frame=n)
        F = fall_matrix('keys', n, shelf_pivot)
        M = F @ panel_rest['shelf']
        shelf.location, shelf.rotation_euler = M.to_translation(), M.to_euler()
        shelf.keyframe_insert('location', frame=n)
        shelf.keyframe_insert('rotation_euler', frame=n)
        under = key_under(n)
        for k, ob in keys.items():
            press = 0.0
            flash = 0.0
            land = dict((kk, fr) for fr, kk in T.LANDINGS)[k]
            if under == k:
                press = -0.012 * T.smoothstep(land - 1, land + 1, n)
            if n >= land:
                flash = 0.9 * math.exp(-(n - land) / 5)
            M = F @ Matrix.Translation((0, 0, press)) @ key_rest[k]
            ob.location, ob.rotation_euler = M.to_translation(), M.to_euler()
            ob.keyframe_insert('location', frame=n)
            ob.keyframe_insert('rotation_euler', frame=n)
            s = ob.data.materials[0].node_tree.nodes['Principled BSDF'].inputs['Emission Strength']
            s.default_value = power('keys', n) + flash
            s.keyframe_insert('default_value', frame=n)

        # The card.
        card.location = card_centre(n)
        card.keyframe_insert('location', frame=n)

        # Dr. Smiley.
        p, sx, sz, roll, ang = states[n]
        smiley.location = p + Vector((0, -0.004, 0))
        smiley.scale = (sx, 1, sz)
        smiley.rotation_euler = (0, roll, 0)
        bend.angle = ang
        smiley.keyframe_insert('location', frame=n)
        smiley.keyframe_insert('scale', frame=n)
        smiley.keyframe_insert('rotation_euler', frame=n)
        bend.keyframe_insert('angle', frame=n)

        # His shadow, on the key shelf only, fading with height.
        over_keys = abs(p.y - T.KEY_Y) < 0.12 and abs(p.x) < 0.75 and n < T.FALLS[2][1]
        height = max(0.0, p.z - T.KEY_TOP_Z)
        op = 0.55 * (1 - clamp(height / 0.35)) if over_keys else 0.0
        shadow.location = (p.x, p.y + 0.02, T.KEY_TOP_Z + 0.002 + (-0.012 if under else 0))
        s = 0.7 + 0.6 * clamp(height / 0.35)
        shadow.scale = (s, s, 1)
        shadow.keyframe_insert('location', frame=n)
        shadow.keyframe_insert('scale', frame=n)
        v = sh_mat.node_tree.nodes['opacity'].outputs[0]
        v.default_value = op
        v.keyframe_insert('default_value', frame=n)

        # The camera, looking at its target, focused on him.
        pos, tgt, fstop, lens = camera_at(n, xs_s)
        cam_data.lens = lens
        cam_data.keyframe_insert('lens', frame=n)
        cam.location = pos
        cam.rotation_euler = (tgt - pos).to_track_quat('-Z', 'Y').to_euler()
        cam.keyframe_insert('location', frame=n)
        cam.keyframe_insert('rotation_euler', frame=n)
        cam_data.dof.aperture_fstop = fstop
        cam_data.dof.focus_distance = (p + Vector((0, 0, T.SMILEY_H / 2)) - pos).length
        cam_data.dof.keyframe_insert('aperture_fstop', frame=n)
        cam_data.dof.keyframe_insert('focus_distance', frame=n)

    # Keys sit on whole frames; never let Blender smooth between them.
    for a in bpy.data.actions:
        for fc in getattr(a, 'fcurves', []):
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'

    path = os.path.join(B, 'scene.blend')
    bpy.ops.wm.save_as_mainfile(filepath=path)
    print('wrote build/scene.blend:', len(bpy.data.objects), 'objects keyed on', T.FRAMES, 'frames')


if __name__ == '__main__':
    build()
