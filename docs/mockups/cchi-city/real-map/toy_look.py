# The toy look in Blender, shared by toy_render.py (test renders and mock-ups) and card_render.py (the CoreCHI Practice
# card's pictures): satin toy plastic with softly rounded edges (Cycles' Bevel node), a warm sun with soft shadows, a
# bright sky for the bounce light, AgX colour, Cycles on the CPU. Run with Blender's Python module (bpy 5.0.1, Python 3.11).
import bpy, math
from mathutils import Vector
# three.js (x, y up, z) -> Blender (x, -z, y up)
B = lambda x, y, z: Vector((x, -z, y))

def load(glb):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=glb)
    return bpy.context.scene

def base_colour(o):
    m = o.data.materials[0] if o.type == 'MESH' and o.data.materials else None
    P = m and m.node_tree and next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    return tuple(round(c, 2) for c in P.inputs['Base Color'].default_value[:3]) if P else None

def drop_clouds(sc):
    # the page's floating clouds don't belong on a model on a table (they are the only things in their peach colour)
    for o in list(sc.objects):
        if base_colour(o) == (1.0, 0.69, 0.62): bpy.data.objects.remove(o)

def toy_materials(mats=None):
    # glass stays glassy; everything else gets a satin finish, a light clear coat and rounded edges
    for m in (mats if mats is not None else bpy.data.materials):
        if not m.use_nodes or m.get('toy'): continue
        nt = m.node_tree; P = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if not P: continue
        metal = P.inputs['Metallic'].default_value; rough = P.inputs['Roughness'].default_value
        if not (metal > 0.3 and rough < 0.2):
            P.inputs['Metallic'].default_value = 0.0
            P.inputs['Roughness'].default_value = max(0.32, min(rough, 0.5))
            P.inputs['Coat Weight'].default_value = 0.25; P.inputs['Coat Roughness'].default_value = 0.2
        bev = nt.nodes.new('ShaderNodeBevel'); bev.inputs['Radius'].default_value = 0.035; bev.samples = 6
        nt.links.new(bev.outputs['Normal'], P.inputs['Normal']); m['toy'] = 1

def light(sc):
    # a warm sun, low and from the front left, soft-edged shadows; a bright, slightly blue sky for the bounce
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sc.collection.objects.link(sun)
    sun.data.energy = 5.6; sun.data.color = (1.0, 0.9, 0.78); sun.data.angle = math.radians(6)
    sun.rotation_euler = (math.radians(52), 0, math.radians(-38))
    world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
    bg = world.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (0.62, 0.74, 0.95, 1); bg.inputs['Strength'].default_value = 1.05
    return sun

def cycles(sc, w, h, samples):
    # Cycles on the CPU, denoised, AgX with a punchier look, transparent film (the backdrop is composited after, so the
    # sky still lights the scene)
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = samples; sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 6; sc.render.film_transparent = True
    sc.render.resolution_x, sc.render.resolution_y = w, h; sc.render.resolution_percentage = 100
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.exposure = 0.3
    for look in ('AgX - Punchy', 'Punchy'):
        try: sc.view_settings.look = look; break
        except Exception: pass

def camera(sc, name, pos, target, fov, fstop=None):
    # pos and target in three.js units; fov vertical in degrees, as three.js's PerspectiveCamera
    cd = bpy.data.cameras.new(name); cam = bpy.data.objects.new(name, cd); sc.collection.objects.link(cam)
    cam.location = B(*pos); d = B(*target) - cam.location
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    cd.sensor_fit = 'VERTICAL'; cd.sensor_height = 24.0; cd.lens = 12.0 / math.tan(math.radians(fov)/2)
    cd.clip_start = 0.5; cd.clip_end = 900
    if fstop: cd.dof.use_dof = True; cd.dof.focus_distance = d.length; cd.dof.aperture_fstop = fstop
    sc.camera = cam; return cam

def flat_ground_apart(sc, top=0.5, thick=0.2):
    # the ground's flat layers (streets and their joints, sidewalks, paving, lots) overlap in the very same plane; Cycles
    # then finds the overlapping face at the shading point itself and draws it in shadow, black. Each vertex of those
    # layers is lifted by its own few thousandths of a unit, so at every point one face is clearly on top.
    import numpy as np
    n = 0
    for o in sc.objects:
        if o.type != 'MESH': continue
        zs = [(o.matrix_world @ Vector(c)).z for c in o.bound_box]
        if max(zs) > top or max(zs) - min(zs) > thick: continue
        me = o.data; co = np.empty(len(me.vertices)*3, np.float32); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
        i = np.arange(len(co), dtype=np.int64); up = ((i*2654435761 + n*97) % 1009)/1009*0.004
        # the mesh is in the object's own space: lift along the world's up, through the inverse of its matrix
        w = (o.matrix_world.inverted().to_3x3() @ Vector((0, 0, 1)))
        co += np.outer(up, np.array(w[:], np.float32)); me.vertices.foreach_set('co', co.ravel()); me.update(); n += 1
    return n
