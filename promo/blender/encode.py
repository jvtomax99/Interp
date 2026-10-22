"""Step 7: the pictures and the sound into one MP4 (the guide's command).
    python encode.py                 -> build/film.mp4
    python encode.py renders/stills  -> any folder of f_0001.png ...
A soft vignette darkens the corners; +faststart lets it play before it has
fully downloaded."""
import os
import subprocess
import sys

import timeline as T

frames = os.path.join(T.HERE, sys.argv[1] if len(sys.argv) > 1 else 'renders/full')
out = os.path.join(T.BUILD, 'film.mp4')
cmd = ['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
       '-framerate', str(T.FPS), '-i', os.path.join(frames, 'f_%04d.png'),
       '-i', os.path.join(T.BUILD, 'sound.wav'),
       '-vf', 'vignette=angle=PI/6',
       '-c:v', 'libx264', '-profile:v', 'high', '-crf', '17', '-pix_fmt', 'yuv420p',
       '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', '-shortest', out]
subprocess.run(cmd, check=True)
print('wrote build/film.mp4, %.1f MB' % (os.path.getsize(out) / 1e6))
