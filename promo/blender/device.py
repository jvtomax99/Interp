"""Picks what renders: a graphics card if there is one, else the processor.
The guide's gpu.py. The choice is a Blender preference, not saved in the
.blend file, so render.py calls this every time."""
import bpy


def setup(scene):
    prefs = bpy.context.preferences.addons['cycles'].preferences
    for kind in ('OPTIX', 'CUDA', 'HIP', 'ONEAPI', 'METAL'):
        try:
            prefs.compute_device_type = kind
        except TypeError:
            continue
        prefs.get_devices()
        gpus = [d for d in prefs.devices if d.type == kind]
        if gpus:
            for d in prefs.devices:
                d.use = d.type == kind
            scene.cycles.device = 'GPU'
            return '%s (%s)' % (kind, ', '.join(d.name for d in gpus))
    prefs.compute_device_type = 'NONE'
    scene.cycles.device = 'CPU'
    scene.render.threads_mode = 'AUTO'
    return 'CPU (no graphics card found)'
