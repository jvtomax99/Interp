"""The one source of truth for the film: every time and every place.

Every other piece reads this file: smiley.py (his face per frame),
render_ui.cjs (the screen and the card), scene.py (the 3D world) and
sound.py (the soundtrack). Change a number here and all of them follow.

Run it on its own to write build/timeline.json for the JavaScript side:
    python timeline.py
"""
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, 'build')
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))

# ---------- Format ----------
FPS = 30
SECONDS = 12
FRAMES = FPS * SECONDS            # 360, numbered 1..360 like Blender
WIDTH, HEIGHT = 1280, 720
BPM = 120
BEAT = FPS * 60 / BPM             # 15 frames


def f(seconds):
    """Seconds to a frame number (frame 1 is the very start)."""
    return int(round(seconds * FPS)) + 1


DROP = f(4.0)                     # the music drop; the screens brighten

# ---------- The interface image ----------
# One 2560 x 1440 picture of the whole fake app (src/ui.html). Each 3D
# panel shows its own rectangle of it. Rects are [x, y, w, h] in pixels.
UI_W, UI_H = 2560, 1440
PANELS = {
    'domains': [60, 120, 500, 1060],
    'editor':  [620, 120, 1320, 1060],
    'home':    [2000, 120, 500, 1060],
}
CARD = [760, 250, 1040, 760]          # where the card sits on the editor
HELLO = [2120, 300, 260, 325]         # Dr. Smiley's spot on the Home panel

KEYS = ['Type', 'ES/EN', 'Domain', 'Audio', 'Example', 'Save']
KEY_W, KEY_H, KEY_GAP = 200, 160, 24
KEY_ROW_Y = 1240                      # the key labels' row in the image
KEY_RECTS = {k: [620 + i * (KEY_W + KEY_GAP), KEY_ROW_Y, KEY_W, KEY_H]
             for i, k in enumerate(KEYS)}

# ---------- Interface pixels to the 3D world (metres) ----------
# The screens stand upright facing the camera (the camera looks along +Y).
# 1 pixel = 1 mm. The keys lie flat on a shelf in front of them.
PX = 0.001
SCREEN_BOTTOM_Z = 0.10                # the panels' bottom edge (y = 1180 px); low,
                                      # so one shot holds the keys and the card
KEY_TOP_Z = 0.04                      # the top of a key at rest
KEY_DEPTH = 0.16                      # front to back
KEY_Y = -0.30                         # the keys' centre line


def ui_x(px):
    return (px - UI_W / 2) * PX


def ui_z(py):
    return SCREEN_BOTTOM_Z + (1180 - py) * PX


def key_centre(name):
    x, _, w, _ = KEY_RECTS[name]
    return (ui_x(x + w / 2), KEY_Y, KEY_TOP_Z)


# ---------- Dr. Smiley ----------
SMILEY_W = HELLO[2] * PX              # 0.26 m
SMILEY_H = HELLO[3] * PX              # 0.325 m
# At rest he is the picture on Home: feet at the bottom of his spot, just
# in front of the glass.
HOME_SPOT = (ui_x(HELLO[0] + HELLO[2] / 2), -0.012, ui_z(HELLO[1] + HELLO[3]))

PEEL_START, PEEL_END = f(1.3), f(2.0)   # curls off the glass, top first
HOP_HEIGHT = 0.22
FIRST_HOP_HEIGHT = 0.06             # off the Home panel: a drop, not a leap

# Where he lands, and when. Each hop takes off half a beat after the last
# landing settled and lands on the beat.
LANDINGS = [
    (f(2.5), 'Type'),
    (f(3.5), 'ES/EN'),
    (f(4.5), 'Domain'),
    (f(5.5), 'Audio'),
    (f(6.5), 'Example'),
    (f(7.5), 'Save'),
]
CARD_HOP_LAND = f(8.5)                # up onto the card's top edge
HOP_AIR = int(BEAT)                   # 15 frames in the air per hop
FIRST_HOP_AIR = 12                    # off the Home panel to the first key

# ---------- What each press does to the card ----------
CARD_EVENTS = {
    'Type': f(2.5),       # "shortness of breath" types in
    'ES/EN': f(3.5),      # "falta de aire" flips in
    'Domain': f(4.5),     # the Pulmonology pin stamps on
    'Audio': f(5.5),      # a voice wave runs across
    'Example': f(6.5),    # the example pair writes in
    'Save': f(7.5),       # check, "Saved", the card lifts
}
CARD_LIFT = (f(7.5), f(8.2))          # off the editor, toward the camera
CARD_LIFT_Y = -0.18

# ---------- The ending ----------
# Panels power down, then fall, one after another.
FALLS = [
    ('domains', f(8.6)),
    ('home', f(8.9)),
    ('keys', f(9.2)),
    ('editor', f(9.5)),
]
POWER_DOWN = 8                        # frames of flicker before each fall
LAUGH = f(10.5)

# ---------- His face over time ----------
# (from frame, face frame name, brows). Face names are DR_FACE_FRAMES in
# index.html; brows are DR_BROWS: [left dy, left turn, right dy, right turn].
FACE_FRAMES = ['rest', 'blink1', 'blink2', 'shut', 'wink1', 'wink2', 'wink',
               'smile1', 'smile2', 'smile', 'laugh1', 'laugh2', 'laugh',
               'laughB', 'lookL', 'lookR', 'love', 'sleep', 'halfL', 'halfR',
               'lookU', 'lookD', 'lookUL', 'lookUR', 'lookDL', 'lookDR',
               'surprised', 'sad', 'worried', 'doubt']
BROWS = {
    'rest': [0, 0, 0, 0], 'lift': [-1.2, 0, -1.2, 0],
    'glad': [-2, 0, -2, 0], 'laugh': [-2.8, 0, -2.8, 0],
    'up': [-4.2, 0, -4.2, 0], 'wink': [-1, 0, 1.2, -4],
    'down': [.8, 0, .8, 0], 'relax': [.8, 0, .8, 0],
}
FACE = [
    (1, 'rest', 'rest'),
    (f(0.6), 'blink1', 'rest'), (f(0.6) + 1, 'shut', 'relax'),
    (f(0.6) + 3, 'blink1', 'rest'), (f(0.6) + 4, 'rest', 'rest'),
    (f(1.0), 'lookL', 'rest'),
    (PEEL_START, 'surprised', 'up'),
    (PEEL_END, 'smile2', 'glad'), (PEEL_END + 2, 'smile', 'glad'),
    (f(3.0), 'lookD', 'down'), (f(3.3), 'smile', 'glad'),
    (f(4.0), 'laugh1', 'laugh'), (f(4.0) + 2, 'laugh', 'laugh'),
    (f(4.6), 'smile', 'glad'),
    (f(5.5), 'lookU', 'up'), (f(6.0), 'smile', 'glad'),
    (f(6.5), 'lookD', 'down'), (f(7.0), 'smile', 'glad'),
    (f(7.5), 'wink1', 'wink'), (f(7.5) + 2, 'wink', 'wink'),
    (f(7.9), 'wink1', 'glad'), (f(7.9) + 2, 'smile', 'glad'),
    (f(9.0), 'lookDL', 'down'), (f(9.5), 'lookDR', 'down'),
    (f(10.0), 'smile', 'glad'),
    (LAUGH, 'laugh1', 'laugh'), (LAUGH + 2, 'laugh', 'laugh'),
    (LAUGH + 6, 'laughB', 'laugh'), (LAUGH + 10, 'laugh', 'laugh'),
    (LAUGH + 18, 'laugh2', 'glad'), (LAUGH + 21, 'smile', 'glad'),
    (f(11.4), 'blink1', 'glad'), (f(11.4) + 1, 'shut', 'relax'),
    (f(11.4) + 3, 'smile', 'glad'),
]


def face_at(frame):
    """His face frame name and brows at a film frame."""
    name, brows = 'rest', 'rest'
    for start, n, b in FACE:
        if frame >= start:
            name, brows = n, b
    return name, brows


# ---------- Camera shots ----------
# (frame, camera position, look-at point, lens mm, f-stop). Between keys
# the camera eases. f-stop None = everything sharp.
SHOTS = [
    (1,        (0.0, -3.2, 0.9), (0.0, 0.0, 0.47), 35, None),
    (f(1.2),   (0.6, -2.6, 0.85), (0.62, 0.0, 0.57), 35, None),
    (f(2.2),   (0.2, -1.95, 0.80), (0.1, 0.0, 0.46), 32, 4.0),
    (f(7.6),   (-0.05, -1.95, 0.80), (0.15, 0.0, 0.48), 32, 4.0),
    (f(8.6),   (0.0, -2.3, 0.92), (0.0, 0.0, 0.74), 35, 5.6),
    (f(12.0),  (0.0, -2.2, 0.86), (0.0, 0.0, 0.77), 35, 5.6),
]
# Within the follow shot the camera also slides along with him by this much.
FOLLOW = 0.6

# ---------- Sound hits (for sound.py) ----------
SOUNDS = (
    [(f(0.3), 'glass')] +
    [(PEEL_START, 'peel')] +
    [(fr, 'key') for fr, _ in LANDINGS] +
    [(fr, 'ding') for k, fr in CARD_EVENTS.items() if k != 'Save'] +
    [(CARD_EVENTS['Save'], 'save')] +
    [(CARD_HOP_LAND, 'land')] +
    [(fr - POWER_DOWN, 'powerdown') for _, fr in FALLS] +
    [(LAUGH, 'sparkle')]
)


def smoothstep(a, b, x):
    t = min(1.0, max(0.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def to_json():
    data = {k: v for k, v in globals().items()
            if k.isupper() and isinstance(v, (int, float, list, dict, tuple, str))}
    data['KEY_CENTRES'] = {k: key_centre(k) for k in KEYS}
    os.makedirs(BUILD, exist_ok=True)
    with open(os.path.join(BUILD, 'timeline.json'), 'w') as fh:
        json.dump(data, fh, indent=1)
    return data


if __name__ == '__main__':
    d = to_json()
    print('wrote build/timeline.json:', len(d), 'entries,', FRAMES, 'frames')
