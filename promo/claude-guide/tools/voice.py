"""The narrator for the Claude video guide: Kokoro's Puck (am_puck), Jose's pick "puckwarm"
(2026-10-29): normal speed, each script line read in one go (2-3 sentences flow better than one
clip per sentence), a breath between lines, then a little warmth and a very light room.

Reads the "Says" lines of SCRIPT.md (the captions), swaps in spellings the voice reads right
(SAY below), and writes per chapter:
  voice/ch<N>.wav       the chapter's voice, 24 kHz
  voice/cues.tsv        chapter, line, start, end (seconds), caption: what the animation follows

Needs kokoro-onnx in a venv and Kokoro's files, which `hyperframes tts` downloads once into
~/.cache/hyperframes/tts (promo/hub-blend/BRIEF-60s.md, "Voice"). Run from the repo root:
  <venv>/bin/python promo/claude-guide/tools/voice.py [chapter ...]
"""
import os, re, subprocess, sys
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HERE, 'voice')
CACHE = os.path.expanduser('~/.cache/hyperframes/tts/')
VOICE, SPEED, GAP, LEAD, TAIL = 'am_puck', 1.0, 0.42, 0.5, 0.9
WARM = ('equalizer=f=220:t=q:w=1:g=2.5,equalizer=f=6500:t=q:w=1.5:g=-2,'
        'aecho=0.85:0.6:28|47:0.10|0.06')
# Written for the eye in the captions, said like this by the voice.
SAY = [(r'\bDr\. Smiley\b', 'Doctor Smiley'), (r'\bCLAUDE\.md\b', 'Claude dot M D'),
       (r'\bclaude\.ai\b', 'claude dot A I'), (r'\b3D\b', 'three D'), (r'\bNOT\b', 'not'),
       (r'\bslash init\b', 'slash in-it')]


def says():
    """{chapter: [caption, ...]} from SCRIPT.md, in order."""
    text = open(os.path.join(HERE, 'SCRIPT.md'), encoding='utf-8').read()
    out = {}
    for block in re.split(r'\n## Chapter ', text)[1:]:
        n = int(block[0])
        out[n] = [re.sub(r'\s+', ' ', s).strip()
                  for s in re.findall(r'\*\*Says:\*\* (.*?)\n\s+\*\*Shows', block, re.S)]
    return out


def spoken(line):
    for a, b in SAY:
        line = re.sub(a, b, line)
    return line


def main():
    os.makedirs(OUT, exist_ok=True)
    k = Kokoro(CACHE + 'models/kokoro-v1.0.onnx', CACHE + 'voices/voices-v1.0.bin')
    lines, want = says(), [int(a) for a in sys.argv[1:]] or None
    cues_path = os.path.join(OUT, 'cues.tsv')
    old = []
    if want and os.path.exists(cues_path):  # keep the other chapters' cues
        old = [l for l in open(cues_path, encoding='utf-8').read().splitlines()[1:]
               if int(l.split('\t')[0]) not in want]
    cues = []
    for n, caps in sorted(lines.items()):
        if want and n not in want:
            continue
        sr, parts, t = 24000, [np.zeros(int(24000 * LEAD), np.float32)], LEAD
        for i, cap in enumerate(caps, 1):
            a, sr = k.create(spoken(cap), voice=VOICE, speed=SPEED, lang='en-us')
            cues.append(f'{n}\t{i}\t{t:.3f}\t{t + len(a) / sr:.3f}\t{cap}')
            t += len(a) / sr + GAP
            parts += [a.astype(np.float32), np.zeros(int(sr * GAP), np.float32)]
        parts[-1] = np.zeros(int(sr * TAIL), np.float32)
        raw = os.path.join(OUT, f'ch{n}.raw.wav')
        sf.write(raw, np.concatenate(parts), sr)
        dst = os.path.join(OUT, f'ch{n}.wav')
        # the room is a short echo, so the timing of every word stays where Kokoro put it
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', WARM + ',loudnorm=I=-16:TP=-1.5',
                        '-ar', str(sr), dst], check=True)
        os.remove(raw)
        print(f'chapter {n}: {len(caps)} lines, {t - GAP + TAIL:.1f} s')
    rows = sorted(old + cues, key=lambda l: (int(l.split('\t')[0]), int(l.split('\t')[1])))
    with open(cues_path, 'w', encoding='utf-8') as f:
        f.write('chapter\tline\tstart\tend\tcaption\n' + '\n'.join(rows) + '\n')


if __name__ == '__main__':
    main()
