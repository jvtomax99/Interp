"""The remake's music, re-cut to follow its script (Jose, 2026-10-21: "the audio doesn't follow
the script"). v11's music was cut to v11's captions: the hook from 0, the logo at 8 s, then one
feature every 3 s from 10 s, the end card at 37 s. The remake's shots are shorter (2.5 s), add the
3D Body and start after a 2.5 s walk-in, so the music drifted further from each caption. Here
every remake shot gets the music v11 had under the same caption, from the same accent, trimmed to
the shot's length; the pieces join on the beat, each edge faded over 20 ms.
  python3 -I promo/hub-blend/tools/music.py <v11.mp4> <out.m4a> [walk-in: silence|swell]"""
import subprocess, sys

V11, OUT = sys.argv[1], sys.argv[2]
WALK = sys.argv[3] if len(sys.argv) > 3 else "silence"
X = 0.04  # each join: 20 ms out, 20 ms in
# (remake start, remake end, v11 start [, v11 piece to repeat for the extra length])
SEGS = [
    (2.5, 10.0, 0.0),     # the hook (its cuts follow v11's: HOOK_MAP in main.js)
    (10.0, 12.0, 8.0),    # logo
    (12.0, 14.5, 10.0),   # home
    (14.5, 17.0, 13.0),   # glossary
    (17.0, 20.5, 34.0),   # 3D Body, not in v11: the Ask shot's music, its last beat played twice
    (20.5, 23.0, 16.0),   # translate
    (23.0, 25.5, 19.0),   # doctor prep
    (25.5, 28.0, 22.0),   # false friends
    (28.0, 30.5, 25.0),   # daily drill
    (30.5, 33.5, 28.0),   # CoreCHI
    (33.5, 36.0, 31.0),   # team chat
    (36.0, 38.5, 34.0),   # ask
]
pieces = []  # (v11 start, length)
for a, b, s in SEGS:
    n = b - a
    if n <= 3.0:
        pieces.append((s, n))
    else:  # longer than v11's shot: its 3 s, then its last beat again
        pieces += [(s, 3.0), (s + 2.5, n - 3.0)]
# the end card: v11's first second of it, then v11's last 3.5 s (its finale)
pieces += [(37.0, 1.0), (41.5, 3.5)]

f, labels = [], []
for i, (s, n) in enumerate(pieces):
    fade_in = "" if i == 0 else f",afade=t=in:st=0:d={X / 2}"
    fade_out = "" if i == len(pieces) - 1 else f",afade=t=out:st={n - X / 2}:d={X / 2}"
    f.append(f"[0:a]atrim={s}:{s + n},asetpts=N/SR/TB{fade_in}{fade_out}[p{i}]")
    labels.append(f"[p{i}]")
f.append("".join(labels) + f"concat=n={len(labels)}:v=0:a=1[cut]")
cur = "cut"
# the walk-in before the words: silence, or a soft air swell into the doors
if WALK == "swell":
    f.append("anoisesrc=d=2.5:c=pink:a=0.2:r=48000,lowpass=f=1500,highpass=f=150,afade=t=in:st=0:d=2.2:curve=exp,afade=t=out:st=2.4:d=0.1,aformat=sample_fmts=fltp:channel_layouts=stereo[w]")
else:
    f.append("anullsrc=r=48000:cl=stereo,atrim=0:2.5[w]")
f.append(f"[{cur}]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[m];[w][m]concat=n=2:v=0:a=1[out]")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", V11, "-filter_complex", ";".join(f), "-map", "[out]",
                "-c:a", "aac", "-b:a", "192k", OUT], check=True)
print(OUT)
