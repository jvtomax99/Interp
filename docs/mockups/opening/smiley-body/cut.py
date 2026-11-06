"""Cut Dr. Smiley out of his gray background, frame by frame (rembg, isnet-general-use).

    pip install "rembg[cpu]"
    python3 cut.py <frames dir of PNGs> <out dir>

Writes one RGBA PNG per frame. build.py then crops, scales and packs them
into the opening's videos (README.md beside this)."""
import sys, os
from rembg import remove, new_session
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
s = new_session('isnet-general-use')
names = sorted(n for n in os.listdir(src) if n.endswith('.png'))
for i, n in enumerate(names):
    if os.path.exists(os.path.join(out, n)):
        continue
    remove(Image.open(os.path.join(src, n)).convert('RGB'), session=s).save(os.path.join(out, n))
    if i % 25 == 0:
        print(n, flush=True)
print('done', len(names))
