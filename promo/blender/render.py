"""Renders any frames of build/scene.blend, one PNG each.
    python render.py --frames 1-360 --out renders/full
    python render.py --frames 105-145,285-360 --out renders/full
    python render.py --frames 1,20,40 --out renders/stills --pct 50 --samples 16
Frames already on disk are skipped, so a stopped render picks up where it
left off. --redo renders them again. Every frame stands on its own."""
import argparse
import os
import sys
import time

import bpy

import device
import timeline as T


def frame_list(spec):
    out = []
    for part in spec.split(','):
        if '-' in part:
            a, b = part.split('-')
            out += range(int(a), int(b) + 1)
        elif part:
            out.append(int(part))
    return sorted(set(out))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--frames', default='1-%d' % T.FRAMES)
    ap.add_argument('--out', default='renders/full')
    ap.add_argument('--pct', type=int, default=100, help='size, percent of 1280 x 720')
    ap.add_argument('--samples', type=int, default=0, help='0 = the scene default')
    ap.add_argument('--redo', action='store_true')
    a = ap.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else None)

    bpy.ops.wm.open_mainfile(filepath=os.path.join(T.BUILD, 'scene.blend'))
    sc = bpy.context.scene
    print('rendering on', device.setup(sc))
    sc.render.resolution_percentage = a.pct
    if a.samples:
        sc.cycles.samples = a.samples
    out = os.path.join(T.HERE, a.out)
    os.makedirs(out, exist_ok=True)
    todo = [n for n in frame_list(a.frames)
            if a.redo or not os.path.exists(os.path.join(out, 'f_%04d.png' % n))]
    print(len(todo), 'frames to render')
    for i, n in enumerate(todo):
        t = time.time()
        sc.frame_set(n)
        final = os.path.join(out, 'f_%04d.png' % n)
        sc.render.filepath = final + '.part.png'
        bpy.ops.render.render(write_still=True)
        os.replace(final + '.part.png', final)   # never leave half a picture
        print('frame %d done in %.1f s (%d/%d)' % (n, time.time() - t, i + 1, len(todo)), flush=True)


if __name__ == '__main__':
    main()
