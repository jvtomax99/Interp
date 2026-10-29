"""Timing for the animation, from the narrator's audio (voice/ch<N>.wav, voice/cues.tsv):
  - each script line split into sentences, each sentence's start and end placed on the real
    pause in the audio (silencedetect), so a caption changes when the voice does;
  - how loud the voice is at every frame (30 fps), so Dr. Smiley's mouth follows it.
Writes voice/ch<N>.beats.js (window.BEATS), loaded by ch<N>.html.
Run from the repo root:  python3 promo/claude-guide/tools/beats.py 1 [2 3 4]
Needs numpy and soundfile (the voice venv has both)."""
import json, os, re, subprocess, sys
import numpy as np, soundfile as sf

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30


def silences(wav):
    log = subprocess.run(['ffmpeg', '-i', wav, '-af', 'silencedetect=n=-38dB:d=0.16', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    s = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
    e = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
    return list(zip(s, e))


def sentences(text):
    # split after . ! ? but never after "Dr."
    return [p for p in re.split(r'(?<!Dr\.)(?<=[.!?])\s+', text) if p]


def main(n):
    wav = os.path.join(HERE, 'voice', f'ch{n}.wav')
    rows = [l.split('\t') for l in open(os.path.join(HERE, 'voice', 'cues.tsv'), encoding='utf-8').read().splitlines()[1:]]
    rows = [r for r in rows if int(r[0]) == n]
    gaps = silences(wav)
    lines = []
    for _, i, a, b, text in rows:
        a, b = float(a), float(b)
        sents = sentences(text)
        inside = [g for g in gaps if g[0] > a + 0.1 and g[1] < b - 0.1]
        total = sum(len(s) for s in sents)
        out, t0, last = [], a, -1
        for k, s in enumerate(sents):
            if k == len(sents) - 1:
                out.append({'text': s, 'start': round(t0, 3), 'end': round(b, 3)}); break
            est = a + (b - a) * sum(len(x) for x in sents[:k + 1]) / total
            # in order, leaving a pause for each boundary still to place
            left = len(sents) - 2 - k
            cand = list(range(last + 1, len(inside) - left))
            if cand:
                j = min(cand, key=lambda j: abs((inside[j][0] + inside[j][1]) / 2 - est))
                last = j; end, nxt = inside[j]
            else:
                end = nxt = est
            out.append({'text': s, 'start': round(t0, 3), 'end': round(end, 3)}); t0 = nxt
        lines.append({'n': int(i), 'start': a, 'end': b, 'text': text, 'sentences': out})
    audio, sr = sf.read(wav, dtype='float32')
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    hop = sr // FPS
    rms = np.array([np.sqrt(np.mean(audio[k:k + hop] ** 2)) for k in range(0, len(audio), hop)])
    env = np.clip(rms / (np.percentile(rms[rms > 0.005], 90) if (rms > 0.005).any() else 1), 0, 1)
    data = {'chapter': n, 'duration': round(len(audio) / sr, 3), 'fps': FPS, 'lines': lines,
            'env': [round(float(x), 2) for x in env]}
    dst = os.path.join(HERE, 'voice', f'ch{n}.beats.js')
    with open(dst, 'w', encoding='utf-8') as f:
        f.write('window.BEATS = ' + json.dumps(data, ensure_ascii=False) + ';\n')
    print(dst, len(lines), 'lines,', sum(len(l['sentences']) for l in lines), 'sentences,', data['duration'], 's')


if __name__ == '__main__':
    for a in sys.argv[1:] or ['1']:
        main(int(a))
