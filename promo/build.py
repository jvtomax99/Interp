"""HUMC Interpreter Hub team promo: 30 s, 1080x1920.
0-3.6 s   hook: "heart failure" turns into "insuficiencia cardíaca"
3.6-5.8   title: Hub icon, Interpreter Hub
5.8-25    the phone: six real screens, a heading and a chip each
25-30     end card: Dr. Smiley, the address, Add to Home Screen"""
import sys, json, wave, os
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from lib import *

P = HERE + '/edit/promo.tsrct'
WK = HERE + '/edit/.tesseract-work'
DUR = 30000
SW, SH = 600, int(600 * 2277 / 1179)
PX, PY = 540, 1190
BEAT0, BEAT = 5800, 3200

# Inter (OFL) from the official release; kept out of git (promo/.gitignore)
if not os.path.exists(HERE + '/fonts/inter/extras/ttf/Inter-Bold.ttf'):
    os.makedirs(HERE + '/fonts', exist_ok=True)
    os.system(f'curl -fsSL -o {HERE}/fonts/inter.zip https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip && unzip -q -o {HERE}/fonts/inter.zip -d {HERE}/fonts/inter')
os.makedirs(WK, exist_ok=True)

ids = iter(range(1, 10000))
nid = lambda: next(ids)
A = []                                              # actions

# ---------- assets ----------
SHOTS = ['home', 'domain', 'translate', 'doctor', 'ask', 'drill']
SFX = {'whoosh1': ('air-whoosh', 1), 'riser': ('short-riser', 2), 'impact': ('soft-impact', 3),
       'whoosh2': ('air-whoosh', 4), 'pop': ('soft-pop', 5), 'down': ('downlifter', 6), 'ping': ('clear-ping', 7)}
if os.path.exists(P): os.remove(P)
run('project', 'create', '--project', P)
for f in ['Bold', 'ExtraBold', 'SemiBold', 'Medium']:
    run('project', 'import-font', '--project', P, '--file', f'{HERE}/fonts/inter/extras/ttf/Inter-{f}.ttf')
for s in SHOTS:
    run('project', 'import-asset', '--project', P, '--file', f'{HERE}/shots/{s}.png', '--asset-id', 'shot-' + s, '--kind', 'image')
run('project', 'import-asset', '--project', P, '--file', '/home/user/Interp/icon-512.png', '--asset-id', 'hub-icon', '--kind', 'image')
run('project', 'import-asset', '--project', P, '--file', '/home/user/Interp/drsmiley/base.webp', '--asset-id', 'smiley', '--kind', 'image')
os.makedirs(HERE + '/sfx', exist_ok=True)
SFXLEN = {}
for name, (preset, seed) in SFX.items():
    f = f'{HERE}/sfx/{name}.wav'
    if not os.path.exists(f):
        os.system(f'python3 ~/.claude/skills/tesseract-video/scripts/tesseract_sound.py make --preset {preset} --seed {seed} --output {f} >/dev/null')
    with wave.open(f) as w: SFXLEN[name] = int(w.getnframes() * 1000 / w.getframerate())
    run('project', 'import-asset', '--project', P, '--file', f, '--asset-id', 'sfx-' + name, '--kind', 'audio')


# ---------- motion helpers (times are on the layer's own clock) ----------
def rise(L, t, dy=40, d=450, base_y=None):
    """Fade in while sliding up dy px."""
    y = base_y if base_y is not None else L['transform']['position'][1]
    A.append(kf(L['id'], 'opacity', [(t, 0, None), (t + d * .7, 100, OUT)]))
    return [(t, y + dy, None), (t + d, y, OUT)]


def leave(L, t, dy=-30, d=300, base_y=None):
    y = base_y if base_y is not None else L['transform']['position'][1]
    A.append(kf(L['id'], 'opacity', [(t, 100, None), (t + d, 0, LIN)]))
    return [(t, y, None), (t + d, y + dy, INOUT)]


def inout(L, t_in, t_out, dy=40):
    """Rise in at t_in, drift up and fade at t_out."""
    y = L['transform']['position'][1]
    A.append(kf(L['id'], 'opacity', [(t_in, 0, None), (t_in + 320, 100, OUT), (t_out, 100, LIN), (t_out + 280, 0, LIN)]))
    A.append(kf(L['id'], 'positionY', [(t_in, y + dy, None), (t_in + 450, y, OUT), (t_out, y, LIN), (t_out + 300, y - 26, INOUT)]))


def pop(L, t_in, t_out=None, s0=70):
    keys = [(t_in, s0, None), (t_in + 420, 100, {'type': 'cubicBezier', 'x1': .3, 'y1': 1.45, 'x2': .4, 'y2': 1})]
    ok = [(t_in, 0, None), (t_in + 200, 100, LIN)]
    if t_out:
        keys += [(t_out, 100, LIN), (t_out + 260, 88, INOUT)]
        ok += [(t_out, 100, LIN), (t_out + 260, 0, LIN)]
    A.append(kf(L['id'], 'scaleX', keys)); A.append(kf(L['id'], 'scaleY', keys)); A.append(kf(L['id'], 'opacity', ok))


def radial(id, name, cx, cy, r, color):
    return rect(id, name, 0, DUR, (r * 2, r * 2), color, (cx, cy), anchor=(r, r),
                paint={'type': 'gradient', 'gradientType': 'radial', 'start': [r, r], 'end': [r * 2, r],
                       'stops': [{'offset': 0, 'color': color}, {'offset': 1, 'color': color[:3] + [0]}]})


def chip(label, x, y, t_in, t_out, dot=CYAN):
    from PIL import ImageFont
    w = int(ImageFont.truetype(HERE + '/fonts/inter/extras/ttf/Inter-SemiBold.ttf', 34).getlength(label) + 104)
    g = nid()
    pill = rect(nid(), 'Chip pill', 0, DUR, (w, 84), WHITE, (0, 0), roundness=42, shadow=shadow(40, 18, .35))
    d = rect(nid(), 'Chip dot', 0, DUR, (18, 18), dot, (30, 33), roundness=9)
    t = text(nid(), 'Chip label', 0, DUR, label, 34, (62, 0), font='semi', color=NAVY, just='left', box=(w - 70, 84))
    t['sourceText']['verticalAlign'] = 'center'
    G = group(g, 'Chip: ' + label, 0, DUR, [t, d, pill], pos=(x, y), anchor=(w / 2, 42))
    pop(G, t_in, t_out)
    # a slow float while it's up
    A.append(kf(g, 'positionY', [(t_in, y + 10, None), (t_out + 260, y - 14, LIN)]))
    return G


layers = []                                       # front to back, built back to front then reversed
add = lambda L: layers.append(L) or L

# ---------- background ----------
add(rect(nid(), 'Background', 0, DUR, (1080, 1920), DEEP, (0, 0),
         paint={'type': 'gradient', 'gradientType': 'linear', 'start': [0, 0], 'end': [1080, 1920],
                'stops': [{'offset': 0, 'color': hexc('#1E2A6E')}, {'offset': .55, 'color': hexc('#141C4C')}, {'offset': 1, 'color': DEEP}]}))
o1 = add(radial(nid(), 'Glow cyan', 160, 380, 760, hexc('#01B8E6', .30)))
o2 = add(radial(nid(), 'Glow blue', 980, 1560, 860, hexc('#2E8BD0', .34)))
A.append(kf(o1['id'], 'positionX', [(0, 160, None), (15000, 420, INOUT), (30000, 120, INOUT)]))
A.append(kf(o1['id'], 'positionY', [(0, 380, None), (15000, 620, INOUT), (30000, 300, INOUT)]))
A.append(kf(o2['id'], 'positionX', [(0, 980, None), (15000, 700, INOUT), (30000, 1000, INOUT)]))
A.append(kf(o2['id'], 'positionY', [(0, 1560, None), (15000, 1300, INOUT), (30000, 1620, INOUT)]))

# ---------- A. hook ----------
lang1 = add(text(nid(), 'ENGLISH tag', 0, 1500, 'ENGLISH', 34, (540, 700), font='semi', color=CYAN, box=(800, 60), anchor=(400, 0), tracking=280))
w1 = add(text(nid(), 'heart failure', 0, 1700, 'heart failure', 128, (540, 780), font='xbold', box=(1000, 170), anchor=(500, 0), tracking=-20))
lang2 = add(text(nid(), 'ESPAÑOL tag', 1450, 2150, 'ESPAÑOL', 34, (540, 640), font='semi', color=CYAN, box=(800, 60), anchor=(400, 0), tracking=280))
w2 = add(text(nid(), 'insuficiencia cardíaca', 1450, 2150, 'insuficiencia\ncardíaca', 124, (540, 720), font='xbold', color=WHITE, box=(1040, 320), anchor=(520, 0), tracking=-20, leading=132))
bar = add(rect(nid(), 'Accent bar', 1450, 2150, (380, 10), CYAN, (540, 1060), roundness=5, anchor=(190, 5)))
line = add(text(nid(), 'Hook line', 0, 3600, 'The right word, right now.', 46, (540, 1260), font='med', color=hexc('#FFFFFF', .72), box=(1000, 80), anchor=(500, 0)))
A.append(kf(lang1['id'], 'positionY', [(150, 740, None), (600, 700, OUT), (1150, 700, LIN), (1450, 670, INOUT)]))
A.append(kf(lang1['id'], 'opacity', [(150, 0, None), (465, 100, OUT), (1150, 100, LIN), (1450, 0, LIN)]))
A.append(kf(w1['id'], 'positionY', [(250, 830, None), (750, 780, OUT), (1250, 780, LIN), (1600, 640, INOUT)]))
A.append(kf(w1['id'], 'opacity', [(250, 0, None), (600, 100, OUT), (1250, 100, LIN), (1550, 0, LIN)]))
for L, d in ((lang2, 0), (w2, 60)):                # local clock starts at 1450
    y = L['transform']['position'][1]
    A.append(kf(L['id'], 'positionY', [(d, y + 120, None), (d + 520, y, OUT), (1850, y, LIN), (2150, y - 40, INOUT)]))
    A.append(kf(L['id'], 'opacity', [(d, 0, None), (d + 360, 100, OUT), (1850, 100, LIN), (2100, 0, LIN)]))
A.append(kf(bar['id'], 'scaleX', [(300, 0, None), (900, 100, OUT), (1850, 100, LIN), (2150, 0, INOUT)]))
A.append(kf(line['id'], 'opacity', [(500, 0, None), (900, 100, OUT), (3250, 100, LIN), (3550, 0, LIN)]))

# ---------- B. title ----------
T0 = 3600
icon = add(image(nid(), 'Hub icon', T0, 2300, 'hub-icon', (230, 230), (540, 760), anchor=(115, 115), radius=56, shadow=shadow(60, 24, .45)))
tt = add(text(nid(), 'Interpreter Hub', T0, 2300, 'Interpreter Hub', 116, (540, 920), font='xbold', box=(1040, 150), anchor=(520, 0), tracking=-25))
ts = add(text(nid(), 'Title sub', T0, 2300, 'for the HUMC interpreter team', 44, (540, 1080), font='med', color=hexc('#FFFFFF', .72), box=(1000, 70), anchor=(500, 0)))
pop(icon, 0, 1900, s0=40)
inout(tt, 150, 1900, dy=50)
inout(ts, 330, 1900, dy=40)

# ---------- C. the phone ----------
HEAD = [('Everything for your shift', 'Glossary, doctors, chat and practice, in one app'),
        ('A glossary the team builds', 'Every specialty, in English and Spanish'),
        ('Glossary first. Then AI.', 'With a note on why it chose that word'),
        ('Prep for every doctor', 'Their terms, where they work, team tips'),
        ('Ask Dr. Smiley', 'He gets you ready for the appointment'),
        ('The Daily Drill', 'Catch the traps before the patient does')]
CHIP = [('Made by our own team', 830, 760), ('Necrosis avascular', 270, 1130), ('insuficiencia cardíaca', 760, 1480),
        ('10 prep terms', 280, 900), ('Watch for: constipado', 760, 1320), ('Counted.', 300, 1560)]
PH0 = BEAT0 - 400                                 # phone arrives
PHD = 25000 + 700 - PH0
for i, (h, s) in enumerate(HEAD):
    t = BEAT0 + i * BEAT
    H = add(text(nid(), 'Head ' + str(i + 1), t, BEAT, h, 74, (540, 175), font='xbold', box=(1000, 110), anchor=(500, 0), tracking=-15))
    S = add(text(nid(), 'Sub ' + str(i + 1), t, BEAT, s, 40, (540, 290), font='med', color=hexc('#FFFFFF', .72), box=(940, 120), anchor=(470, 0)))
    inout(H, 120, BEAT - 330, dy=36)
    inout(S, 240, BEAT - 330, dy=30)

pid = nid()
body = rect(nid(), 'Phone body', 0, PHD, (SW + 34, SH + 34), hexc('#060918'), (PX, PY), roundness=84,
            anchor=((SW + 34) / 2, (SH + 34) / 2), stroke=(hexc('#3A4790'), 3), shadow=shadow(90, 46, .55, '#02040F'))
matte = rect(nid(), 'Screen matte', 0, PHD, (SW, SH), WHITE, (PX, PY), roundness=66, anchor=(SW / 2, SH / 2))
strip = [image(nid(), 'Screen ' + s, 0, PHD, 'shot-' + s, (SW, SH), (i * SW, 0)) for i, s in enumerate(SHOTS)]
stid = nid()
stripG = group(stid, 'Screen strip', 0, PHD, strip[::-1], pos=(PX - SW / 2, PY - SH / 2))
scr = group(nid(), 'Screens', 0, PHD, [stripG], matte=matte['id'])
# the strip slides one screen left at each beat
sx, keys = PX - SW / 2, [(0, PX - SW / 2, None)]
for i in range(1, len(SHOTS)):
    t = BEAT0 + i * BEAT - PH0
    keys += [(t - 300, sx - (i - 1) * SW, LIN), (t + 300, sx - i * SW, INOUT)]
A.append(kf(stid, 'positionX', keys))
phone = add(group(pid, 'Phone', PH0, PHD, [scr, matte, body], pos=(PX, PY), anchor=(PX, PY)))
# arrive from below with a tilt, swing a little at each slide, leave downward
A.append(kf(pid, 'positionY', [(0, PY + 1500, None), (750, PY, OUT), (25000 - PH0, PY, LIN), (25000 - PH0 + 650, PY + 1600, INOUT)]))
A.append(kf(pid, 'rotationX', [(0, 28, None), (900, 0, OUT)]))
ry = [(0, -14, None), (900, -4, OUT)]
for i in range(1, len(SHOTS)):
    t = BEAT0 + i * BEAT - PH0
    ry += [(t - 300, ry[-1][1], LIN), (t + 450, 4 if i % 2 else -4, INOUT)]
A.append(kf(pid, 'rotationY', ry))
for i, (lbl, x, y) in enumerate(CHIP):
    t = BEAT0 + i * BEAT
    add(chip(lbl, x, y, t + 650, t + BEAT - 420))
# Dr. Smiley pops in beside the phone on the Ask beat
ta = BEAT0 + 4 * BEAT
sm = add(image(nid(), 'Smiley peek', 0, DUR, 'smiley', (300, 375), (900, 1700), anchor=(150, 375), fit='contain'))
pop(sm, ta + 350, ta + BEAT - 450, s0=50)
A.append(kf(sm['id'], 'rotation', [(ta + 350, -12, None), (ta + 900, 4, OUT), (ta + 1700, -3, INOUT), (ta + 2500, 3, INOUT)]))

# ---------- D. end card ----------
E = 25000
big = add(image(nid(), 'Smiley end', E, DUR - E, 'smiley', (440, 550), (540, 1020), anchor=(220, 550), fit='contain'))
pop(big, 350, s0=60)
A.append(kf(big['id'], 'positionY', [(350, 1100, None), (900, 1020, OUT), (2400, 1032, INOUT), (3800, 1020, INOUT), (5000, 1030, INOUT)]))
et = add(text(nid(), 'End title', E, DUR - E, 'Interpreter Hub', 104, (540, 1080), font='xbold', box=(1040, 140), anchor=(520, 0), tracking=-25))
A.append(kf(et['id'], 'positionY', rise(et, 650, 46)))
uw = 640
url = add(group(nid(), 'Address', E, DUR - E, [
    text(nid(), 'Address text', 0, DUR - E, 'interp-six.vercel.app', 44, (0, 0), font='semi', color=NAVY, box=(uw, 96)),
    rect(nid(), 'Address pill', 0, DUR - E, (uw, 96), WHITE, (0, 0), roundness=48, shadow=shadow(50, 20, .4))],
    pos=(540, 1290), anchor=(uw / 2, 48)))
url['layers'][0]['sourceText']['verticalAlign'] = 'center'
pop(url, 950, s0=80)
how = add(text(nid(), 'Add to Home Screen', E, DUR - E, 'Open it on your phone, then Add to Home Screen', 38, (540, 1380), font='med', color=hexc('#FFFFFF', .75), box=(960, 120), anchor=(480, 0)))
A.append(kf(how['id'], 'positionY', rise(how, 1250, 30)))
logo = add(text(nid(), 'Made at HUMC', E, DUR - E, 'MADE BY THE HUMC INTERPRETER TEAM', 26, (540, 1760), font='semi', color=hexc('#01B8E6', .9), box=(1000, 50), anchor=(500, 0), tracking=240))
A.append(kf(logo['id'], 'opacity', [(1600, 0, None), (2100, 100, OUT)]))

# ---------- sound ----------
for name, at in [('whoosh1', 1380), ('riser', T0 - SFXLEN['riser'] + 60), ('impact', T0), ('whoosh2', PH0 + 100),
                 ('down', E - 50), ('ping', E + 950)]:
    add(audio(nid(), 'SFX ' + name, at, SFXLEN[name], 'sfx-' + name, vol=1.6))
for i in range(1, len(SHOTS)):
    add(audio(nid(), f'SFX slide {i}', BEAT0 + i * BEAT - 330, SFXLEN['pop'], 'sfx-pop', vol=.9))

save(P, WK, DUR / 1000, layers[::-1], A)
print('built', len(layers), 'layers,', len(A), 'actions')
