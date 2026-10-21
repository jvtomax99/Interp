"""The remake's audio (Jose, 2026-10-21): v11's track, untouched. It has a narrator reading the
script, so any edit inside it cut his words, and the picture now follows v11's clock instead (the
hook on v11's cut times, then one feature every 3 s; HOOK_MAP in src/remake/main.js). Before the
first word, under the 2.5 s walk-in: v11's last notes (41.5-44 s), faded in, crossfaded into the
first word. (The earlier beat-by-beat re-cut is in git history.)
  python3 -I promo/hub-blend/tools/music.py <v11.mp4> <out.m4a>"""
import subprocess, sys

V11, OUT = sys.argv[1], sys.argv[2]
WALK, X = 2.5, 0.04
f = (f"[0:a]atrim=41.5:{41.5 + WALK + X},asetpts=N/SR/TB,afade=t=in:st=0:d=0.6,"
     f"afade=t=out:st={WALK}:d={X}[walk];"
     f"[0:a]atrim=0,asetpts=N/SR/TB,afade=t=in:st=0:d={X}[v11];"
     f"[walk][v11]acrossfade=d={X}:c1=tri:c2=tri[out]")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", V11, "-filter_complex", f, "-map", "[out]",
                "-c:a", "aac", "-b:a", "192k", OUT], check=True)
print(OUT)
