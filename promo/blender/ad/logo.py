"""The Interpreter Hub logo in 3D, after Jose's reference picture
(2026-10-22): "Interpreter" over a bigger "Hub" in a rounded wide face
(Unbounded, from Google Fonts), glossy navy faces with bright blue
bevelled edges, blue and glass diamond tiles streaming in arcs, two speech
bubbles (one solid blue, one glass) beside "Hub", on a bright white-blue
set with a reflective floor.

Used by brainhook.py, where it is "built from the brain": the tiles fly
out of Dr. Smiley's head and the letters assemble from them.
    python logo.py          -> build/logo_test.png, the finished logo on its own
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

import assets as A  # noqa: E402

FONT = os.path.join(A.BUILD, 'fonts', 'Unbounded.ttf')
rnd = random.Random(21)


def glossy(name, base, rough=0.12, emit=None, strength=0.0, transmission=0.0):
    m = bpy.data.materials.new(name)
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = A.srgb(base)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Coat Weight'].default_value = 1.0
    b.inputs['Coat Roughness'].default_value = 0.04
    if emit:
        b.inputs['Emission Color'].default_value = A.srgb(emit)
        b.inputs['Emission Strength'].default_value = strength
    if transmission:
        b.inputs['Transmission Weight'].default_value = transmission
        b.inputs['IOR'].default_value = 1.45
    return m


def letters(body, centre, width, face, side, cam):
    """A word as 3D letters, scaled to `width` metres, facing `cam`; one
    object per letter, sorted left to right, each with ['frac'] 0..1."""
    cu = bpy.data.curves.new('logo', 'FONT')
    cu.body = body
    cu.font = bpy.data.fonts.load(FONT, check_existing=True)
    cu.align_x = 'CENTER'
    cu.align_y = 'CENTER'
    cu.size = 1.0
    ob = A.link(bpy.data.objects.new('logo', cu))
    bpy.context.view_layer.update()
    size = width / ob.dimensions.x
    cu.size = size
    cu.extrude = size * 0.16
    cu.bevel_depth = size * 0.028
    cu.bevel_resolution = 4
    ob.location = centre
    d = Vector(cam) - Vector(centre)
    ob.rotation_euler = (math.radians(90), 0, math.atan2(d.x, -d.y))
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.convert(target='MESH')
    me = ob.data
    me.materials.append(face)
    me.materials.append(side)
    for p in me.polygons:
        p.material_index = 0 if p.normal.z > 0.9 else 1
    me.shade_smooth()
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.separate(type='LOOSE')
    bpy.ops.object.mode_set(mode='OBJECT')
    parts = list(bpy.context.selected_objects)
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY')
    bpy.context.view_layer.update()
    parts.sort(key=lambda p: p.location.x)
    x0, x1 = parts[0].location.x, parts[-1].location.x
    for p in parts:
        p['rest_loc'] = list(p.location)
        p['rest_rot'] = list(p.rotation_euler)
        p['frac'] = (p.location.x - x0) / max(1e-6, x1 - x0)
    return parts, size


def tile(loc, size, mat):
    """A diamond tile: a thin rounded square turned 45 degrees, facing -Y."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    t = bpy.context.active_object
    t.scale = (size, size * 0.28, size)
    t.rotation_euler = (0, math.radians(45 + rnd.uniform(-12, 12)), 0)
    bev = t.modifiers.new('round', 'BEVEL')
    bev.width = size * 0.12
    bev.segments = 3
    t.data.materials.append(mat)
    t['rest_loc'] = list(loc)
    t['rest_rot'] = list(t.rotation_euler)
    t['rest_scale'] = size
    return t


def bubble(loc, w, h, mat, flip=False):
    """A speech bubble: a rounded slab and a tail at its lower corner."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    b = bpy.context.active_object
    b.scale = (w, h * 0.35, h)
    bev = b.modifiers.new('round', 'BEVEL')
    bev.width = h * 0.16
    bev.segments = 6
    b.data.materials.append(mat)
    sx = -1 if flip else 1
    bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=h * 0.22, depth=h * 0.18,
                                    location=(loc[0] + sx * w * 0.3, loc[1], loc[2] - h * 0.55))
    t = bpy.context.active_object
    t.rotation_euler = (math.radians(90), 0, math.radians(180 + sx * 20))
    t.data.materials.append(mat)
    for o in (b, t):
        o['rest_loc'] = list(o.location)
        o['rest_scale'] = list(o.scale)
    return [b, t]


def build(centre, cam, width):
    """The whole logo around `centre` (the middle of "Interpreter"'s line),
    `width` metres wide, facing `cam`. Returns its pieces."""
    c = Vector(centre)
    navy = glossy('logo navy', '#061648', 0.14)
    edge = glossy('logo edge', '#1756D6', 0.1, '#2F7BFF', 0.35)
    hub_face = glossy('logo hub', '#0B3FB8', 0.12)
    hub_edge = glossy('logo hub edge', '#3C8DFF', 0.08, '#5AA8FF', 0.6)
    tile_mats = [glossy('tile navy', '#0B2A78', 0.1), glossy('tile blue', '#1F6BFF', 0.1, '#2F7BFF', 0.4),
                 glossy('tile glass', '#F4F9FF', 0.03, '#CFE3FF', 0.5, transmission=0.6)]
    inter, s1 = letters('Interpreter', c, width, navy, edge, cam)
    hub, s2 = letters('Hub', c + Vector((width * 0.12, 0, -width * 0.27)), width * 0.6, hub_face, hub_edge, cam)
    glass = glossy('bubble glass', '#F4F9FF', 0.03, '#CFE3FF', 0.5, transmission=0.6)
    blue_b = glossy('bubble blue', '#1F6BFF', 0.08, '#2F7BFF', 0.6)
    bx = c.x - width * 0.36
    bz = c.z - width * 0.23
    bubbles = bubble((bx + width * 0.03, c.y + 0.01, bz + width * 0.02), width * 0.16, width * 0.1, blue_b) + \
        bubble((bx - width * 0.02, c.y - 0.02, bz - width * 0.06), width * 0.15, width * 0.1, glass)
    # Tiles: an arc over "Interpreter" (left, rising) and a cluster right of "Hub".
    tiles = []
    for k in range(26):
        u = k / 25
        x = c.x - width * 0.38 + u * width * 0.62
        z = c.z + width * (0.2 + 0.1 * math.sin(u * math.pi)) - u * width * 0.08
        s = width * (0.05 * (1 - u) + 0.012) * rnd.uniform(0.7, 1.2)
        tiles.append(tile((x + rnd.uniform(-1, 1) * width * 0.03, c.y + rnd.uniform(-.02, .02),
                           z + rnd.uniform(-1, 1) * width * 0.04), s, rnd.choice(tile_mats)))
    for k in range(16):
        u = k / 15
        x = c.x + width * (0.36 + 0.12 * u)
        z = c.z - width * (0.08 + 0.22 * u) + width * 0.03 * math.sin(u * 6)
        s = width * (0.015 + 0.035 * u) * rnd.uniform(0.7, 1.2)
        tiles.append(tile((x + rnd.uniform(-1, 1) * width * 0.03, c.y, z), s, rnd.choice(tile_mats)))
    return {'inter': inter, 'hub': hub, 'bubbles': bubbles, 'tiles': tiles}


def light_set(floor_z, floor_y):
    """The reference picture's bright studio: white-blue walls, a soft
    reflective floor, big soft lights."""
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, floor_y + 8, floor_z))
    fl = bpy.context.active_object
    m = glossy('logo floor', '#D6E3F7', 0.32, '#E6EFFC', 0.0)   # its glow is keyed up with the set
    fl.data.materials.append(m)
    lights = []
    for name, loc, power, size, col in (('logo key', (-1.5, -3.0, 3.0), 160, 3.0, '#FFFFFF'),
                                         ('logo fill', (2.5, -2.5, 0.6), 60, 3.0, '#DDE9FF'),
                                         ('logo rim', (0.0, 2.0, 2.5), 220, 2.0, '#4F9DFF')):
        l = bpy.data.lights.new(name, 'AREA')
        l.energy, l.size, l.color = power, size, A.srgb(col)[:3]
        o = A.link(bpy.data.objects.new(name, l))
        o.location = loc
        o.rotation_euler = (Vector((0, 0, 0.3)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        lights.append(o)
    return fl, lights


def world_backdrop(sc, col='#EEF4FD', light=0.25):
    """The camera sees `col` as the background, but it lights the scene
    only at `light` strength: a bright set that doesn't wash the logo out.
    Returns the Background node, whose Color can be keyed."""
    nt = sc.world.node_tree
    bg = nt.nodes['Background']
    out = nt.nodes['World Output']
    dim = nt.nodes.new('ShaderNodeBackground')
    dim.inputs['Strength'].default_value = light
    lp = nt.nodes.new('ShaderNodeLightPath')
    mx = nt.nodes.new('ShaderNodeMixShader')
    bg.inputs['Color'].default_value = A.srgb(col)
    nt.links.new(bg.inputs['Color'].links[0].from_socket, dim.inputs['Color']) if bg.inputs['Color'].links else None
    dim.inputs['Color'].default_value = A.srgb(col)
    nt.links.new(lp.outputs['Is Camera Ray'], mx.inputs['Fac'])
    nt.links.new(dim.outputs[0], mx.inputs[1])
    nt.links.new(bg.outputs[0], mx.inputs[2])
    nt.links.new(mx.outputs[0], out.inputs['Surface'])
    return bg, dim


if __name__ == '__main__':
    from storyboard import camera
    from storyboard3 import fresh
    sc = fresh(bg='#EEF4FD', view='Standard')
    sc.render.resolution_x, sc.render.resolution_y = 540, 960
    sc.cycles.samples = 24
    world_backdrop(sc)
    cam = (0, -1.45, 0.08)
    parts = build((0, 0, 0.42), cam, 0.72)
    light_set(-0.02, 0)
    camera(sc, cam, (0, 0, 0.3), 35)
    sc.render.filepath = os.path.join(A.BUILD, 'logo_test.png')
    bpy.ops.render.render(write_still=True)
    print('wrote build/logo_test.png')
