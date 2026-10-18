"""UNTESTED. Narration with Chatterbox (Resemble AI, MIT licence): a more natural,
expressive open voice than Kokoro, with native Spanish in its multilingual model.
Written 2026-10-18 in a session where huggingface.co (where its weights live) was
blocked, so it has never been run. Expect to fix small API details on first run.

Needs: huggingface.co allowed in the environment's network settings, then
  python3 -m venv /tmp/cb && /tmp/cb/bin/pip install chatterbox-tts soundfile
  /tmp/cb/bin/python promo/voice_chatterbox.py
Writes voice/lineNN.wav like voice.py (so build.py picks them up), after keeping the
Kokoro takes in voice/kokoro/. English lines use ChatterboxTTS; lines with
"lang": "es" use ChatterboxMultilingualTTS (language_id "es"). Runs on CPU; slow.

Delivery: exaggeration ~0.5 is neutral, higher is more animated; cfg_weight lower
slows and steadies the pace. A line can set "cb": {"exaggeration": .., "cfg_weight": ..}.
Optional: a clean 10 s recording of a real voice as REF (audio_prompt_path) makes
Chatterbox speak in that voice. Only with that person's consent."""
import json, os, shutil, sys
import numpy as np, soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
REF = sys.argv[1] if len(sys.argv) > 1 else None
lines = json.load(open(HERE + '/narration.json'))['lines']

os.makedirs(HERE + '/voice/kokoro', exist_ok=True)
for f in os.listdir(HERE + '/voice'):
    if f.startswith('line') and not os.path.exists(f'{HERE}/voice/kokoro/{f}'):
        shutil.copy(f'{HERE}/voice/{f}', f'{HERE}/voice/kokoro/{f}')

from chatterbox.tts import ChatterboxTTS
en = ChatterboxTTS.from_pretrained(device='cpu')
es = None


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
    nz = np.nonzero(np.abs(a) > 0.01)[0]                      # trim silence at both ends
    return a[max(0, nz[0] - int(.03 * sr)): nz[-1] + int(.08 * sr)], sr


for i, L in enumerate(lines):
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
