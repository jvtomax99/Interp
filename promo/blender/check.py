"""The guide's last check after a render: finds blank or broken frames.
    python check.py renders/full
Prints the frames to render again, ready for render.py --frames ... --redo.
A frame is suspect if it is missing, unreadable, nearly black, or much
brighter or darker than both its neighbours (a glitch, not a cut)."""
import os
import sys

import numpy as np
from PIL import Image

import timeline as T


def main(folder):
    path = os.path.join(T.HERE, folder)
    light = {}
    bad = []
    for n in range(1, T.FRAMES + 1):
        p = os.path.join(path, 'f_%04d.png' % n)
        try:
            light[n] = float(np.asarray(Image.open(p).convert('L'), dtype=np.float32).mean())
        except Exception:
            bad.append(n)
    for n, v in light.items():
        if v < 4:
            bad.append(n)
            continue
        a, b = light.get(n - 1), light.get(n + 1)
        if a is not None and b is not None and abs(v - a) > 12 and abs(v - b) > 12 and abs(a - b) < 6:
            bad.append(n)
    bad = sorted(set(bad))
    print('%d frames checked, %d to redo' % (len(light), len(bad)))
    if bad:
        print('python render.py -- --frames %s --out %s --redo' % (','.join(map(str, bad)), folder))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'renders/full')
