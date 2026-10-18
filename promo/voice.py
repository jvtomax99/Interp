"""Narration for the promo: Kokoro (open model, runs locally), voice am_puck,
the same narrator as the CPA/EA guide video. One WAV per line in narration.json.
Needs: a venv with kokoro-onnx + soundfile, and the two model files from
github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0), passed as
argv[1] (folder holding kokoro-v1.0.onnx and voices-v1.0.bin)."""
import json, os, sys
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = sys.argv[1]
VOICE, SPEED = 'am_puck', 1.0
k = Kokoro(MODEL + '/kokoro-v1.0.onnx', MODEL + '/voices-v1.0.bin')
lines = json.load(open(HERE + '/narration.json'))['lines']
os.makedirs(HERE + '/voice', exist_ok=True)
for i, L in enumerate(lines):
    a, sr = k.create(L['text'], voice=VOICE, speed=SPEED, lang='es' if L['lang'] == 'es' else 'en-us')
    nz = np.nonzero(np.abs(a) > 0.01)[0]                      # trim silence at both ends
    a = a[max(0, nz[0] - int(.03 * sr)): nz[-1] + int(.08 * sr)]
    sf.write(f'{HERE}/voice/line{i:02d}.wav', a, sr)
    ms = int(len(a) * 1000 / sr)
    print(f'line{i:02d} {ms:5d} ms of {L["max_ms"]:5d}  {"OK " if ms <= L["max_ms"] else "LONG"} {L["text"]}')
