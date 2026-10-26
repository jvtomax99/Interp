"""The 1-minute cut's voice track (BRIEF-60s.md, SHOTS-60s.md): the 7 passages in assets/voice-60s/
(Kokoro, Michael at 0.92, the Spanish in Dora), cut at their pauses and laid on the film's clock so
each feature gets at least 2.5 s. The feature lengths in src/remake/features.js (F60) and the hook map
in main.js (HOOK_MAP) come from the start times this prints; change them together.
  python3 -I promo/hub-blend/tools/voice60.py   (writes assets/voice-60s.m4a and voice-cues-60s.tsv)"""
import os, subprocess

HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
V = os.path.join(HERE, "assets", "voice-60s")
# (shot, passage, from, to): seconds inside the passage, cut at its pauses (silencedetect, -38 dB)
PIECES = [("hook", "g1", 0, 5.82), ("wrong", "g2", 0, 1.26), ("strike", "g3", 0, 1.41), ("right", "g4", 0, 1.73),
          ("logo", "g5", 0, 4.53), ("home", "g5", 4.91, 6.72), ("glossary", "g5", 7.16, 9.02),
          ("translate", "g5", 9.59, 11.72), ("physician", "g5", 11.82, 13.20), ("falsefriends", "g5", 13.47, 16.12),
          ("drills", "g5", 16.18, 18.22), ("cert", "g5", 18.57, 21.25), ("team", "g5", 21.76, 23.45),
          ("body", "g6", 0.14, 4.02), ("notifications", "g6", 4.50, 7.49), ("brain", "g6", 7.96, 9.46),
          ("ask", "g6", 9.99, 12.20), ("end", "g7", 0, 6.85)]
FEATURES = {"home", "glossary", "translate", "physician", "falsefriends", "drills", "cert", "team", "body", "notifications", "brain", "ask"}
GAP_BEFORE = {"wrong": 0.75, "strike": 0.2, "right": 0.4, "logo": 0.8, "end": 0.6}
MIN, LEAD = 2.5, 0.35  # each feature at least 2.5 s; a feature ends 0.35 s after its line at the least
# Cuts moved onto the real pauses (2026-10-26: "Daily" lost its "Da" to the line before, "interpreters"
# its end), timed as before so the rendered picture still fits: the clock keeps the old end here.
CLOCK_END = {"falsefriends": 16.34}

t, cues = 0.4, []
for k, (shot, g, a, b) in enumerate(PIECES):
    cues.append((shot, g, a, b, round(t, 3)))
    if k + 1 == len(PIECES): break
    b = CLOCK_END.get(shot, b)
    t += max(MIN, b - a + LEAD) if shot in FEATURES else b - a + GAP_BEFORE.get(PIECES[k + 1][0], 0.4)

with open(os.path.join(HERE, "voice-cues-60s.tsv"), "w") as f:
    f.write("shot\tpassage\tfrom\tto\tstarts\n")
    for c in cues: f.write("\t".join(map(str, c)) + "\n")
    print("\n".join(f"{c[4]:6.2f}  {c[0]}" for c in cues))
inputs, parts = [], []
for i, (shot, g, a, b, at) in enumerate(cues):
    inputs += ["-i", os.path.join(V, g + ".wav")]
    parts.append(f"[{i}:a]atrim={a}:{b},asetpts=N/SR/TB,afade=t=in:d=0.02,afade=t=out:st={b - a - 0.03:.3f}:d=0.03,adelay={int(at * 1000)}:all=1[p{i}]")
mix = "".join(f"[p{i}]" for i in range(len(cues))) + f"amix=inputs={len(cues)}:normalize=0,apad=whole_dur=60,loudnorm=I=-16:TP=-1.5,aresample=48000[o]"
subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(parts) + ";" + mix, "-map", "[o]", "-t", "60",
                "-c:a", "aac", "-b:a", "160k", os.path.join(HERE, "assets", "voice-60s.m4a")], check=True)
print("speech ends", round(cues[-1][4] + cues[-1][3] - cues[-1][2], 2))
