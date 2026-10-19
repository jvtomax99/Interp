"""Narration with Chatterbox (Resemble AI, MIT licence): a more natural, expressive
open voice than Kokoro, with native Spanish in its multilingual model.

Needs huggingface.co, *.huggingface.co and *.hf.co under the environment's Allowed
domains (the weights, about 3 GB, download on first run), then
  python3 -m venv /tmp/cb && /tmp/cb/bin/pip install chatterbox-tts soundfile "setuptools<81"
  /tmp/cb/bin/python promo/voice_chatterbox.py              # every line
  /tmp/cb/bin/python promo/voice_chatterbox.py 3 7          # only lines 3 and 7
(setuptools 81+ has no pkg_resources, which its watermarker still imports.)
Each line is seeded (its "cb" "seed", default its index), so a take is repeatable and
a line that runs long can be retried with another seed.
Writes voice/lineNN.wav like voice.py (so build.py picks them up), after keeping the
Kokoro takes in voice/kokoro/. English lines use ChatterboxTTS; lines with
"lang": "es" use ChatterboxMultilingualTTS (language_id "es"). Runs on CPU; slow.

Delivery: exaggeration ~0.5 is neutral, higher is more animated; cfg_weight lower
slows and steadies the pace. A line can set "cb": {"exaggeration": .., "cfg_weight": ..}.
Optional: CB_REF=<a clean 10 s recording of a real voice> (audio_prompt_path) makes
Chatterbox speak in that voice. Only with that person's consent."""
import json, os, shutil, sys
import numpy as np, soundfile as sf, torch

HERE = os.path.dirname(os.path.abspath(__file__))
REF = os.environ.get('CB_REF')
ONLY = {int(a) for a in sys.argv[1:]}
lines = json.load(open(HERE + '/narration.json'))['lines']

os.makedirs(HERE + '/voice/kokoro', exist_ok=True)
for f in os.listdir(HERE + '/voice'):
    if f.startswith('line') and not os.path.exists(f'{HERE}/voice/kokoro/{f}'):
        shutil.copy(f'{HERE}/voice/{f}', f'{HERE}/voice/kokoro/{f}')

from chatterbox.tts import ChatterboxTTS
en = ChatterboxTTS.from_pretrained(device='cpu')
es = None


def trim(a, sr):
    """Speech only: from the first 20 ms window within 25 dB of the loudest (less 50 ms),
    to the last within 35 dB, dropping anything after a 450 ms gap that stays 20 dB under
    the peak (the multilingual model can trail a second of noise; takes can open on a quarter second of hiss)."""
    w = int(.02 * sr)
    rms = np.sqrt([np.mean(a[k:k + w] ** 2) for k in range(0, len(a) - w + 1, w)])
    start = np.nonzero(rms > rms.max() * 10 ** (-25 / 20))[0][0]
    on = np.nonzero(rms > rms.max() * 10 ** (-35 / 20))[0]
    on = on[on >= start]
    end = start
    for k in on[1:]:
        if (k - end) * w > .45 * sr and rms[k:].max() < rms.max() / 10: break   # only a quiet tail
        end = k
    return a[max(0, start * w - int(.05 * sr)): (end + 1) * w + int(.08 * sr)]


def say(text, lang, opts):
    global es
    kw = {'exaggeration': opts.get('exaggeration', .55), 'cfg_weight': opts.get('cfg_weight', .5)}
    if REF: kw['audio_prompt_path'] = REF
    if lang == 'es':
        if es is None:
            from chatterbox.mtl_tts import ChatterboxMultilingualTTS
            es = ChatterboxMultilingualTTS.from_pretrained(device='cpu')
        wav, sr = es.generate(text, language_id='es', **kw), es.sr
    else:
        wav, sr = en.generate(text, **kw), en.sr
    a = wav.squeeze().cpu().numpy()
    return trim(a, sr), sr


for i, L in enumerate(lines):
    if ONLY and i not in ONLY: continue
    torch.manual_seed(L.get('cb', {}).get('seed', i))
    parts = L.get('parts') or [[L['lang'], L['text']]]
    out = []
    for j, (lang, txt) in enumerate(parts):
        a, sr = say(txt, lang, L.get('cb', {}))
        if j: out.append(np.zeros(int(.12 * sr), dtype=a.dtype))
        out.append(a)
    a = np.concatenate(out)
    sf.write(f'{HERE}/voice/line{i:02d}.wav', a, sr)
    ms = int(len(a) * 1000 / sr)
    print(f'line{i:02d} {ms:5d} ms of {L["max_ms"]:5d}  {"OK " if ms <= L["max_ms"] else "LONG"} {" / ".join(p[1] for p in parts)}')
