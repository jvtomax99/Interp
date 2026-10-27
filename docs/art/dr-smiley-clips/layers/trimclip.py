# python3 -I trimclip.py <keyed folder> <out folder>
# Trim a keyed clip's still ends: the frames before the move starts and after it ends (each
# frame against the first, a change under 1.5 of 255 is still), keeping 4 still frames at
# each end for the hand-off, renumbered from 0000. Prints the frames kept.
import numpy as np, glob, os, shutil, sys
from PIL import Image
SRC, OUT = sys.argv[1], sys.argv[2]
fs = sorted(glob.glob(os.path.join(SRC, '*.webp')))
L = lambda f: np.asarray(Image.open(f).convert('RGBA'), dtype=float)[..., :3]
a0 = L(fs[0]); d = [np.abs(L(f) - a0).mean() for f in fs]
moving = [i for i, v in enumerate(d) if v > 1.5]
start, end = max(0, moving[0] - 4), min(len(fs) - 1, moving[-1] + 4)
os.makedirs(OUT, exist_ok=True)
for f in glob.glob(os.path.join(OUT, '*.webp')): os.remove(f)
for k, i in enumerate(range(start, end + 1)): shutil.copy(fs[i], os.path.join(OUT, f'{k:04d}.webp'))
size = sum(os.path.getsize(f) for f in glob.glob(os.path.join(OUT, '*.webp')))
print(f'{len(fs)} frames, the move {moving[0]} to {moving[-1]}: kept {start} to {end} = {end - start + 1} frames, {size / 1e6:.2f} MB')
