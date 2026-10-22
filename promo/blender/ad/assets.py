"""The three real assets, loaded into Blender.

body()    the 3D Body: BodyParts3D 4.0 meshes from atlas/models (2,234 pieces,
          15 systems), one object per piece. CC BY 4.0: credit on screen.
brain()   the HUMC Brain: its 119 nuclei, 1,115 tracts and 24,812-point
          surface, exactly as brain/index.html places them (read out of the
          page by tools/brain_dump.cjs into build/brain_scene.json).
campus()  CoreCHI Practice's campus: the three.js scene the app's pictures
          were rendered from (docs/mockups/cchi-city/entrance.html),
          exported as glTF by tools/campus_export.cjs into build/campus.glb.

Coordinates: three.js is Y-up, Blender Z-up. (x, y, z) -> (x, -z, y), so
what faces the camera in the app faces -Y here, toward our camera.
"""
import gzip
import json
import math
import os

import bpy
import numpy as np
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
BUILD = os.path.join(HERE, 'build')


def srgb(hexstr, a=1.0):
    out = []
    for i in (1, 3, 5):
        c = int(hexstr[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, a)


def link(ob, coll=None):
    (coll or bpy.context.scene.collection).objects.link(ob)
    return ob


def collection(name):
    c = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(c)
    return c


# ---------- 3D Body ----------

# Close to the app's own colours for each system (its Systems list).
SYSTEM_COLOUR = {
    'skeletal': '#E6DCC6', 'muscular': '#B65A4C', 'cardiac': '#B03A3A',
    'arterial': '#C8403C', 'venous': '#3E5DA8', 'nervous': '#E2C25E',
    'respiratory': '#E3A3A0', 'digestive': '#D48A76', 'sensory': '#CFE2E8',
    'connective': '#E6DFCF', 'reproductive': '#D39A8C', 'urinary': '#C8896A',
    'integumentary': '#E2B39A', 'endocrine': '#D9A35A', 'lymphatic': '#9BC48A',
}
HIDDEN_BY_DEFAULT = {'integumentary'}      # the app shows 2,229 of 2,234


def body_material(system):
    m = bpy.data.materials.get('body ' + system)
    if m:
        return m
    m = bpy.data.materials.new('body ' + system)
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = srgb(SYSTEM_COLOUR[system])
    b.inputs['Roughness'].default_value = 0.42 if system != 'skeletal' else 0.55
    b.inputs['Coat Weight'].default_value = 0.25 if system in ('muscular', 'digestive', 'cardiac', 'respiratory') else 0.0
    return m


def body(systems=None):
    """{part id: object}, plus each object's ['system'], ['concept'] and
    ['centre'] (its rest centre, for exploding)."""
    meta = json.load(open(os.path.join(REPO, 'atlas', 'models', 'atlas.json')))
    chunks = {}
    coll = collection('3D Body')
    out = {}
    for p in meta['parts']:
        if systems and p['system'] not in systems:
            continue
        if not systems and p['system'] in HIDDEN_BY_DEFAULT:
            continue
        c = p['chunk']
        if c not in chunks:
            chunks[c] = gzip.open(os.path.join(REPO, 'atlas', 'models', 'body-%d.bin.gz' % c)).read()
        buf = chunks[c]
        n = p['vertexCount']
        pos = np.frombuffer(buf, np.float32, n * 3, p['positions']).reshape(-1, 3)
        idx = np.frombuffer(buf, np.uint32, p['indexCount'], p['indices']).reshape(-1, 3)
        v = np.empty_like(pos)
        v[:, 0], v[:, 1], v[:, 2] = pos[:, 0], -pos[:, 2], pos[:, 1]
        centre = v.mean(0)
        me = bpy.data.meshes.new(p['id'])
        me.vertices.add(n)
        me.vertices.foreach_set('co', (v - centre).ravel())
        me.loops.add(idx.size)
        me.loops.foreach_set('vertex_index', idx.ravel())
        me.polygons.add(len(idx))
        me.polygons.foreach_set('loop_start', np.arange(0, idx.size, 3))
        me.update()
        me.shade_smooth()
        me.materials.append(body_material(p['system']))
        ob = link(bpy.data.objects.new(p['name'], me), coll)
        ob.location = Vector(centre.tolist())
        ob['system'] = p['system']
        ob['concept'] = p['conceptId']
        ob['centre'] = centre.tolist()
        out[p['id']] = ob
    return out


def catalogue():
    """The app's bilingual card text for 30 structures, keyed by FMA id,
    with the piece ids that belong to each (from atlas.json's concepts)."""
    cat = json.load(open(os.path.join(REPO, 'atlas', 'hub-catalogue.json')))['structures']
    meta = json.load(open(os.path.join(REPO, 'atlas', 'models', 'atlas.json')))
    concepts = {c['id']: c['elements'] for c in meta['concepts']}
    by_concept = {}
    for p in meta['parts']:
        by_concept.setdefault(p['conceptId'], []).append(p['id'])
    for s in cat:
        s['pieces'] = concepts.get(s['id'], by_concept.get(s['id'], []))
    return {s['id']: s for s in cat}


# ---------- HUMC Brain ----------

def emission(name, hexstr=None, strength=1.0, attr=None):
    m = bpy.data.materials.new(name)
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Strength'].default_value = strength
    if attr:
        a = nt.nodes.new('ShaderNodeAttribute')
        a.attribute_name = attr
        nt.links.new(a.outputs['Color'], em.inputs['Color'])
    else:
        em.inputs['Color'].default_value = srgb(hexstr)
    nt.links.new(em.outputs[0], out.inputs['Surface'])
    return m


def _points(name, pts, cols, radii, mat, coll):
    """A point cloud: Cycles draws each point as a little sphere."""
    me = bpy.data.meshes.new(name)
    me.vertices.add(len(pts))
    me.vertices.foreach_set('co', np.asarray(pts, np.float32).ravel())
    ca = me.attributes.new('col', 'FLOAT_COLOR', 'POINT')
    ca.data.foreach_set('color', np.asarray(cols, np.float32).ravel())
    ra = me.attributes.new('rad', 'FLOAT', 'POINT')
    ra.data.foreach_set('value', np.asarray(radii, np.float32))
    ob = link(bpy.data.objects.new(name, me), coll)
    ng = bpy.data.node_groups.new(name + ' points', 'GeometryNodeTree')
    ng.interface.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    gi, go = ng.nodes.new('NodeGroupInput'), ng.nodes.new('NodeGroupOutput')
    m2p = ng.nodes.new('GeometryNodeMeshToPoints')
    r = ng.nodes.new('GeometryNodeInputNamedAttribute')
    r.data_type = 'FLOAT'
    r.inputs['Name'].default_value = 'rad'
    sm = ng.nodes.new('GeometryNodeSetMaterial')
    sm.inputs['Material'].default_value = mat
    ng.links.new(gi.outputs[0], m2p.inputs['Mesh'])
    ng.links.new(r.outputs['Attribute'], m2p.inputs['Radius'])
    ng.links.new(m2p.outputs[0], sm.inputs['Geometry'])
    ng.links.new(sm.outputs[0], go.inputs[0])
    mod = ob.modifiers.new('points', 'NODES')
    mod.node_group = ng
    return ob


def _three(p):
    return (p[0], -p[2], p[1])


def brain(scale=1.0):
    """The HUMC Brain, centred on the origin. Returns its collection and
    {'shell', 'nuclei', 'tracts'} objects."""
    d = json.load(open(os.path.join(BUILD, 'brain_scene.json')))
    coll = collection('HUMC Brain')
    sp = np.asarray(d['shellP'], np.float32).reshape(-1, 3)
    sc = np.asarray(d['shellC'], np.float32).reshape(-1, 3)
    shell_pts = [_three(p * scale) for p in sp]
    shell = _points('brain surface', shell_pts, np.c_[sc, np.ones(len(sc))], [0.0035 * scale] * len(sp),
                    emission('brain surface', strength=0.9, attr='col'), coll)
    groups = d['groups']
    cols, pts, radii = [], [], []
    for n in d['nodes']:
        c = srgb(groups[n['group']]['color'])
        cols.append(c)
        pts.append(_three([v * scale for v in d['pos'][n['i']]]))
        radii.append((0.05 + 0.021 * math.sqrt(n['bytes'] / 1024)) * 0.22 * scale)
    nuclei = _points('nuclei', pts, cols, radii, emission('nuclei', strength=3.0, attr='col'), coll)
    # Tracts: the same quadratic curves the page draws (16 segments each).
    cu = bpy.data.curves.new('tracts', 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = 0.0012 * scale
    cu.bevel_resolution = 0
    P = [Vector(_three([v * scale for v in p])) for p in d['pos']]
    tcol = []
    for e in d['edges']:
        A, B, C = P[e['a']], P[e['b']], Vector(_three([v * scale for v in e['c']]))
        sp_ = cu.splines.new('POLY')
        sp_.points.add(16)
        for s in range(17):
            t = s / 16
            q = (1 - t) ** 2 * A + 2 * (1 - t) * t * C + t * t * B
            sp_.points[s].co = (q.x, q.y, q.z, 1)
        tcol.append(groups[d['nodes'][e['b']]['group']]['color'])
    tracts = link(bpy.data.objects.new('tracts', cu), coll)
    # One material per target group, as the page colours each tract.
    order = list(groups)
    for g in order:
        cu.materials.append(emission('tract ' + g, groups[g]['color'], 0.55))
    for sp_, hexc in zip(cu.splines, tcol):
        sp_.material_index = order.index(next(g for g in order if groups[g]['color'] == hexc))
    return coll, {'shell': shell, 'nuclei': nuclei, 'tracts': tracts, 'data': d}


# ---------- CoreCHI campus ----------

def campus():
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(BUILD, 'campus.glb'))
    objs = [o for o in bpy.data.objects if o not in before]
    coll = collection('CoreCHI campus')
    for o in objs:
        for c in list(o.users_collection):
            c.objects.unlink(o)
        coll.objects.link(o)
        # The page's sky dome is a custom shader glTF can't carry: it comes
        # in as a 640 m grey shell around everything. Blender's sky instead.
        if o.type == 'MESH' and max(o.dimensions) > 600 and not o.data.materials:
            o.hide_render = o.hide_viewport = True
        if o.type == 'LIGHT':
            o.hide_render = True
    return coll, objs
