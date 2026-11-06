"""Pack the cut frames (cut.py) into the opening's Dr. Smiley files, in opening/.

    python3 build.py <wave-cut dir> <grin-cut dir> <repo>/opening

Each clip becomes one video with two halves stacked: on top his colours, below
a black-and-white matte (white = him). features/opening.js draws a frame onto a
canvas and takes each pixel's see-through amount from the matte, so it works in
every browser (a video with real transparency plays only in some). Both clips
are cropped to one box, the union of every frame of both, so he never jumps
between them. Also writes a still of each (WebP with transparency): shown until
the video is ready, and in Still / reduced motion.

Out: smiley-wave-1.{mp4,webm}, smiley-grin-1.{mp4,webm}, smiley-wave-1.webp,
smiley-grin-1.webp. A new cut gets a new number (sw.js keeps opening/ files
between versions)."""
import sys, os, subprocess, tempfile
from PIL import Image
import numpy as np

H = 380            # his frame's height in pixels: 2x the 190px he takes on the 390-wide stage
BG = np.array([211, 213, 213], dtype=np.float32)   # the clips' gray, measured
STILL = {'wave': 0, 'grin': 9}                     # which frame is each still (grin: eyes shut in a grin)

wave_dir, grin_dir, out = sys.argv[1], sys.argv[2], sys.argv[3]
clips = {'wave': wave_dir, 'grin': grin_dir}
frames = {k: [os.path.join(d, n) for n in sorted(os.listdir(d)) if n.endswith('.png')] for k, d in clips.items()}

# One box for both clips.
box = None
for k in frames:
    for f in frames[k]:
        b = Image.open(f).getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
        if b:
            box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
pad = 6
box = (box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad)
bw, bh = box[2] - box[0], box[3] - box[1]
W = int(round(bw * H / bh / 2)) * 2
print('box', box, '->', W, 'x', H)

def clean(img):
    """Crop, scale, and take the gray back out of his soft edges (so no pale halo on a dark scene)."""
    a = np.asarray(img.crop(box).resize((W, H), Image.LANCZOS), dtype=np.float32)
    rgb, al = a[..., :3], a[..., 3:4] / 255
    safe = np.maximum(al, 0.08)
    rgb = np.clip((rgb - (1 - safe) * BG) / safe, 0, 255)
    rgb = np.where(al > 0.02, rgb, 0)
    return rgb.astype(np.uint8), (al[..., 0] * 255).astype(np.uint8)

for k, fs in frames.items():
    with tempfile.TemporaryDirectory() as tmp:
        for i, f in enumerate(fs):
            rgb, al = clean(Image.open(f).convert('RGBA'))
            stack = np.concatenate([rgb, np.repeat(al[..., None], 3, axis=2)], axis=0)
            Image.fromarray(stack).save(os.path.join(tmp, '%03d.png' % i))
            if i == STILL[k]:
                Image.fromarray(np.dstack([rgb, al])).save(os.path.join(out, f'smiley-{k}-1.webp'), quality=88, method=6)
        src = ['-framerate', '30', '-i', os.path.join(tmp, '%03d.png')]
        subprocess.run(['ffmpeg', '-v', 'error', '-y', *src, '-c:v', 'libx264', '-preset', 'slow', '-crf', '23',
                        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', os.path.join(out, f'smiley-{k}-1.mp4')], check=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', *src, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '34', '-row-mt', '1',
                        '-pix_fmt', 'yuv420p', '-an', os.path.join(out, f'smiley-{k}-1.webm')], check=True)
    print(k, len(fs), 'frames')
for n in sorted(os.listdir(out)):
    if n.startswith('smiley-'):
        print(n, os.path.getsize(os.path.join(out, n)) // 1024, 'KB')
