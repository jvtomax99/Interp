"""A first animated preview (step C's shape, Jose 2026-10-23: "show me a preview
of how it would look animated"): neutral, a blink, a small anticipation, the
warm smile, a hold, the joyful laugh, a hold, the settle back to neutral.
Brows lead by 2 frames, cheeks and lids follow, the mouth comes last; each
arrival overshoots a little and settles; the head never moves.
out/tripo-face-anim.mp4 (24 fps, front and three-quarter side by side).

  python3 tripo_anim.py            FRAMES=n to shorten, SAMPLES=n for quality
"""
import os, sys, math, subprocess
import numpy as np
import bpy
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build
from tripo_face import set_face
from tripo_faceplan import shot

HERE = os.path.dirname(os.path.abspath(__file__))
FPS = 24
# the channels, each a list of (frame, value); between keys a smooth step; the
# last key of each arrival overshoots by OVER then settles over SETTLE frames
T = {  # moments, in frames
    'blink': 12, 'antic': 26, 'smile': 30, 'smile_in': 42, 'laugh_antic': 60, 'laugh': 64, 'laugh_in': 76, 'release': 100, 'rest': 118, 'end': 128,
}
OVER, SETTLE = .07, 5


def keys(ch):
    """The key list of one channel: value by moment."""
    t = T
    if ch == 'brow':      # lift, both brows (the app's units; set_face scales)
        return [(0, 0), (t['antic'] - 2, 0), (t['antic'] + 1, -.6), (t['smile_in'] - 2, 2.2), (t['laugh_antic'] - 2, 2.2), (t['laugh_antic'] + 1, 1.6), (t['laugh_in'] - 2, 3.1), (t['release'] - 2, 3.1), (t['rest'] - 2, 0)]
    if ch == 'cheek':
        return [(0, 0), (t['antic'], 0), (t['smile_in'], 1), (t['laugh_antic'], 1), (t['laugh_antic'] + 2, .9), (t['laugh_in'], 1.6), (t['release'], 1.6), (t['rest'], 0)]
    if ch == 'lower':     # the lower lids up
        return [(0, 0), (t['antic'], 0), (t['smile_in'], .45), (t['laugh_antic'], .45), (t['laugh_in'], 1), (t['release'], 1), (t['rest'], 0)]
    if ch == 'lid':       # the upper lid, old scale: .32 rest, 1 shut, 0 wide
        b = t['blink']
        return [(0, .32), (b - 1, .32), (b + 2, 1), (b + 3, 1), (b + 7, .32), (t['antic'], .32), (t['antic'] + 2, .4), (t['smile_in'], .22), (t['laugh_antic'], .22), (t['laugh_antic'] + 2, .3), (t['release'], .3), (t['rest'], .32)]
    if ch == 'happy':     # the laugh's shut-in-an-arc lids
        return [(0, 0), (t['laugh'], 0), (t['laugh_in'], 1), (t['release'], 1), (t['release'] + 8, 0)]
    if ch == 'close':     # the mouth: 1 closed .. 0 his sculpted smile
        return [(0, 1), (t['antic'] + 2, 1), (t['antic'] + 4, 1), (t['smile_in'] + 2, 0), (t['release'] + 2, 0), (t['rest'] + 2, 1)]
    if ch == 'jaw':       # the laugh's mouth
        return [(0, 0), (t['laugh'] + 2, 0), (t['laugh_in'] + 2, 1.2), (t['release'] + 2, 1.2), (t['release'] + 14, 0)]
    if ch == 'corner':
        return [(0, 0), (t['laugh'] + 2, 0), (t['laugh_in'] + 2, 1), (t['release'] + 2, 1), (t['release'] + 14, 0)]
    if ch == 'gaze_z':    # a small upward look as the laugh takes him, motivating the blink earlier
        b = t['blink']
        return [(0, 0), (b - 3, 0), (b + 1, -.25), (b + 9, .1), (t['laugh'], .1), (t['laugh_in'], .35), (t['release'], .35), (t['rest'], 0)]
    raise KeyError(ch)


def smooth(u):
    u = min(max(u, 0.), 1.); return u * u * (3 - 2 * u)


def value(ch, f):
    ks = keys(ch)
    if f <= ks[0][0]:
        return ks[0][1]
    for (f0, v0), (f1, v1) in zip(ks, ks[1:]):
        if f0 <= f <= f1:
            u = smooth((f - f0) / max(1, f1 - f0))
            v = v0 + (v1 - v0) * u
            # the overshoot: just past an arrival, a little beyond it, back over SETTLE frames
            return v
    # past the last key
    return ks[-1][1]


def overshoot(ch, f):
    """A small overshoot after each arrival (a key the value changes to and then holds)."""
    ks = keys(ch); extra = 0.
    for (f0, v0), (f1, v1) in zip(ks, ks[1:]):
        if v1 != v0 and f1 <= f < f1 + SETTLE:
            u = (f - f1) / SETTLE
            extra += (v1 - v0) * OVER * math.sin(math.pi * u) * (1 - u)
    return extra


if __name__ == '__main__':
    bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'in', 'tripo-face.blend'))
    ob = bpy.data.objects['Mesh_0']
    build.STYLE_NOW = 'tripo'; cam = build.studio(); sc = bpy.context.scene; sc.camera = cam
    sc.cycles.samples = int(os.environ.get('SAMPLES', 10))
    op = np.load(os.path.join(HERE, 'in', 'mouth-opening.npz')); CX = float(op['CX'])
    n = int(os.environ.get('FRAMES', T['end']))
    fdir = os.path.join(HERE, 'out', 'anim'); os.makedirs(fdir, exist_ok=True)
    f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 18)
    for k in range(n):
        v = {ch: value(ch, k) + overshoot(ch, k) for ch in ('brow', 'cheek', 'lower', 'lid', 'happy', 'close', 'jaw', 'corner', 'gaze_z')}
        v['lid'] = min(max(v['lid'], 0.), 1.); v['happy'] = min(max(v['happy'], 0.), 1.); v['close'] = min(max(v['close'], 0.), 1.)
        v['cheek'] = max(0., v['cheek']); v['lower'] = min(max(v['lower'], 0.), 1.)
        mouth = {'JawOpen': max(0., v['jaw']), 'CornerUp.L': max(0., v['corner']), 'CornerUp.R': max(0., v['corner'])}
        set_face(ob, brow=((v['brow'], 0), (v['brow'] * 1.2, 0)), cheek=(v['cheek'], v['cheek']), lower=(v['lower'], v['lower']),
                 lid=(v['lid'], v['lid']), happy=v['happy'], close=v['close'], mouth=mouth, gaze=(0, v['gaze_z']))
        a = shot(os.path.join(fdir, 'a.png'), (CX, 0, .74), .95, 0, 2, (420, 316))
        b = shot(os.path.join(fdir, 'b.png'), (CX, 0, .74), .95, -35, 3, (420, 316))
        im = Image.new('RGB', (848, 316), 'white'); im.paste(a, (0, 0)); im.paste(b, (428, 0))
        g = ImageDraw.Draw(im)
        label = ('neutral' if k < T['antic'] - 2 else 'warm smile' if k < T['laugh_antic'] else 'joyful laugh' if k < T['release'] else 'settle' if k < T['rest'] else 'neutral')
        if T['blink'] - 1 <= k <= T['blink'] + 7: label = 'blink'
        g.rectangle((0, 290, 160, 316), fill=(37, 46, 109)); g.text((8, 294), f'{label}  {k / FPS:4.2f}s', font=f, fill='white')
        im.save(os.path.join(fdir, f'f{k:03d}.png'))
        print('frame', k, {c: round(x, 2) for c, x in v.items()}, flush=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', os.path.join(fdir, 'f%03d.png'),
                    '-pix_fmt', 'yuv420p', '-vf', 'scale=848:316', os.path.join(HERE, 'out', 'tripo-face-anim.mp4')], check=True)
    # a contact sheet: every 8th frame
    tiles = [Image.open(os.path.join(fdir, f'f{k:03d}.png')).crop((0, 0, 420, 316)) for k in range(0, n, 8)]
    cols = 8; rows = math.ceil(len(tiles) / cols)
    sheet = Image.new('RGB', (420 * cols, 316 * rows), 'white')
    for i, t in enumerate(tiles):
        sheet.paste(t, (420 * (i % cols), 316 * (i // cols)))
    sheet.save(os.path.join(HERE, 'out', 'plan', 'anim-sheet.png'))
    print('done')
