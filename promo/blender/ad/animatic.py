"""The rough cut of the whole ad (storyboard 7), 45 s, 540 x 960, 30 fps:
the real hook (renders/brainhook), then every other section made from the
storyboard frames and the app's real screens, moving on the beat (pushes,
pans, slides, cross-fades). A preview of pace and story, not the final look.
    python animatic.py      -> renders/animatic/f_0001.png ... f_1350.png
Then animatic_sound.py and encode (see the end of animatic_sound.py).
"""
import math
import os

from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
B = os.path.join(HERE, 'build')
OUT = os.path.join(HERE, 'renders', 'animatic')
W, H, FPS = 540, 960, 30
NAVY = (6, 10, 23)

# (start s, end s, kind, args) -- the timeline; every cut is on a beat (0.5 s).
SHOTS = [
    (0.0, 5.0, 'hook', None),
    (5.0, 11.0, 'phones', (['glossary', 'translate', 'ask', 'falsefriends'], 'glossary', None)),
    (11.0, 13.5, 'still', ('board/v06.png', (1.08, 0, 0.02), (1.0, 0, -0.02))),
    (13.5, 17.0, 'still', ('board/v07.png', (1.18, 0, 0), (1.0, 0, 0))),
    (17.0, 20.5, 'still', ('board/v08.png', (1.0, 0.02, 0), (1.15, -0.03, 0))),
    (20.5, 26.5, 'phones', (['directory', 'doctorpage', 'prep', 'chat'], 'doctors', None)),
    (26.5, 31.0, 'phones', (['drill', 'review', 'memory'], 'drills', None)),
    (31.0, 32.5, 'still', ('board/v13.png', (1.0, 0, 0), (1.9, 0, 0.12))),
    (32.5, 39.0, 'still', ('board/v14.png', (1.15, 0, 0.04), (1.0, 0, -0.02))),
    (39.0, 40.5, 'still', ('board/v16.png', (1.0, 0, 0), (1.25, 0, 0))),
    (40.5, 45.0, 'end', None),
]
FADE = 6   # frames of cross-fade between shots


def ease(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ease_out(t):
    t = min(1.0, max(0.0, t))
    return 1 - (1 - t) ** 3


_cache = {}


def load(path, size=None):
    key = (path, size)
    if key not in _cache:
        im = Image.open(path).convert('RGBA')
        if size:
            im = im.resize(size, Image.LANCZOS)
        _cache[key] = im
    return _cache[key]


def push(im, zoom, dx, dy):
    """A camera push on a still: zoom about the centre, shifted by dx, dy
    (fractions of the frame)."""
    w, h = im.size
    cw, ch = w / zoom, h / zoom
    cx, cy = w / 2 + dx * w, h / 2 + dy * h
    box = (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)
    return im.resize((W, H), Image.BICUBIC, box=box)


def still(args, u):
    path, a, b = args
    im = load(os.path.join(B, path), (W * 2, H * 2))
    e = ease(u)
    z = a[0] + (b[0] - a[0]) * e
    return push(im, max(1.0, z), a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e).convert('RGB')


def backdrop():
    if 'bg' not in _cache:
        bg = Image.new('RGB', (W, H), NAVY)
        glow = Image.new('L', (W, H), 0)
        ImageDraw.Draw(glow).ellipse((-W * 0.2, H * 0.15, W * 1.2, H * 0.95), fill=255)
        glow = glow.filter(ImageFilter.GaussianBlur(120))
        tint = Image.new('RGB', (W, H), (18, 40, 96))
        _cache['bg'] = Image.composite(tint, bg, glow)
    return _cache['bg'].copy()


def phone_img(name, h):
    key = ('phone', name, h)
    if key not in _cache:
        sc = load(os.path.join(B, 'screens', 'r_%s.png' % name))
        w = int(h * sc.width / sc.height)
        body = Image.new('RGBA', (w + 16, h + 16), (0, 0, 0, 0))
        ImageDraw.Draw(body).rounded_rectangle((0, 0, w + 15, h + 15), radius=int(w * 0.12), fill=(10, 15, 38, 255))
        body.alpha_composite(sc.resize((w, h), Image.LANCZOS), (8, 8))
        _cache[key] = body
    return _cache[key]


def phones(args, t, dur):
    """One real app screen per slot on a glass phone; each slides in from the
    right on its beat and pushes the last one out to the left; the next one
    peeks in at the edge. The section's caption on top."""
    names, caption, _ = args
    slot = dur / len(names)
    k = min(len(names) - 1, int(t / slot))
    u = (t - k * slot) / slot
    im = backdrop()
    ph_h = int(H * 0.66)
    y = int(H * 0.27)

    def place(name, x, scale, alpha=1.0):
        p = phone_img(name, int(ph_h * scale))
        if alpha < 1:
            p = p.copy()
            p.putalpha(p.getchannel('A').point(lambda v: int(v * alpha)))
        im.paste(p, (int(x - p.width / 2), int(y + (ph_h - p.height) / 2)), p)

    slide = ease_out(u / 0.28)               # the slide takes about a quarter of the slot
    if k + 1 < len(names):                   # the next one peeking in
        place(names[k + 1], W * 1.02, 0.86, 0.6)
    if k > 0 and slide < 1:                  # the last one leaving
        place(names[k - 1], W / 2 - W * 0.9 * slide, 1.0 - 0.1 * slide, 1 - slide)
    x = W * 1.02 + (W / 2 - W * 1.02) * slide if k > 0 else W / 2
    s = (0.86 + 0.14 * slide if k > 0 else 1.0) * (1 + 0.025 * u)
    place(names[k], x, s)
    cap = load(os.path.join(B, 'captions', caption + '.png'), (W, H))
    a = ease(t / 0.4) if t < 0.4 else 1.0
    if a < 1:
        cap = cap.copy()
        cap.putalpha(cap.getchannel('A').point(lambda v: int(v * a)))
    im = im.convert('RGBA')
    im.alpha_composite(cap)
    return im.convert('RGB')


def end(t):
    """Rise over (done in the last shot), then the 3D campus melts into the
    real photo and the end card settles with a slow pull-back."""
    card = load(os.path.join(B, 'endcard.png'), (W * 2, H * 2))
    z = 1.12 - 0.12 * ease(t / 4.0)
    im = push(card, z, 0, 0.0).convert('RGB')
    if t < 1.0:                              # the melt from the campus
        camp = still(('board/v16.png', (1.25, 0, 0), (1.45, 0, 0)), t)
        im = Image.blend(camp, im, ease(t))
    return im


def frame(n):
    t = (n - 1) / FPS
    shot = next(s for s in SHOTS if s[0] <= t < s[1]) if t < SHOTS[-1][1] else SHOTS[-1]
    a, b, kind, args = shot
    u, local = (t - a) / (b - a), t - a
    if kind == 'hook':
        return load(os.path.join(HERE, 'renders', 'brainhook', 'f_%04d.png' % min(150, n))).convert('RGB').resize((W, H))
    if kind == 'still':
        im = still(args, u)
    elif kind == 'phones':
        im = phones(args, local, b - a)
    else:
        im = end(local)
    if a == 5.0 and local < 0.3:             # out of the hook's white flash
        im = Image.blend(Image.new('RGB', (W, H), (255, 255, 255)), im, ease(local / 0.3))
    i = SHOTS.index(shot)
    if 0 < i and SHOTS[i - 1][2] != 'hook' and kind != 'end' and local * FPS < FADE:   # cross-fade in
        p = SHOTS[i - 1]
        prev = frame_at(p, t)                # the last shot's final frame, held
        im = Image.blend(prev, im, ease(local * FPS / FADE))
    return im


def frame_at(shot, t):
    a, b, kind, args = shot
    local = min(t, b - 1 / FPS) - a
    if kind == 'still':
        return still(args, local / (b - a))
    if kind == 'phones':
        return phones(args, local, b - a)
    return end(local)


def main():
    os.makedirs(OUT, exist_ok=True)
    n_all = int(SHOTS[-1][1] * FPS)
    for n in range(1, n_all + 1):
        frame(n).save(os.path.join(OUT, 'f_%04d.png' % n))
        if n % 150 == 0:
            print('frame', n, flush=True)


if __name__ == '__main__':
    main()
