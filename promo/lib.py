"""Helpers that write Tesseract editable-document layers and keyframe actions."""
import json, subprocess

TSRCT = '/root/.local/share/Tesseract/bin/tsrct'
FONT = {'bold': ('Inter', 'Bold'), 'xbold': ('Inter ExtraBold', 'Regular'),
        'semi': ('Inter SemiBold', 'Regular'), 'med': ('Inter Medium', 'Regular')}


def hexc(h, a=1.0):
    h = h.lstrip('#')
    return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)] + [a]


NAVY, DEEP, ACCENT, CYAN, WHITE = hexc('#252E6D'), hexc('#0E1438'), hexc('#0F5FA6'), hexc('#01B8E6'), hexc('#FFFFFF')


def tf(pos=(0, 0), anchor=(0, 0), scale=100, rot=0, op=100, rx=0, ry=0):
    s = scale if isinstance(scale, (list, tuple)) else (scale, scale)
    return {'anchorPoint': list(anchor), 'position': list(pos), 'scale': list(s), 'rotation': rot,
            'opacity': op, 'rotationX': rx, 'rotationY': ry}


def rng(start, dur):
    return {'start': int(start), 'duration': int(dur)}


def rect(id, name, start, dur, size, color, pos, roundness=0, anchor=None, paint=None, stroke=None, shadow=None, op=100):
    r = {'size': list(size), 'fillColor': color, 'roundness': roundness}
    if paint: r['fillPaint'] = paint
    if stroke: r.update(strokeEnabled=True, strokeColor=stroke[0], strokeWidth=stroke[1])
    L = {'type': 'Rect', 'id': id, 'name': name, 'blendMode': 'normal', 'activeRange': rng(start, dur),
         'transform': tf(pos, anchor if anchor is not None else (0, 0), op=op), 'rect': r}
    if shadow: L['dropShadow'] = shadow
    return L


def image(id, name, start, dur, asset, frame, pos, anchor=(0, 0), fit='cover', radius=None, shadow=None, op=100):
    L = {'type': 'Image', 'id': id, 'name': name, 'blendMode': 'normal', 'activeRange': rng(start, dur),
         'transform': tf(pos, anchor, op=op),
         'source': {'assetId': asset, 'fit': fit, 'sourceRect': {'x': 0, 'y': 0, 'width': frame[0], 'height': frame[1]}}}
    if radius is not None: L['cornerRadius'] = radius
    if shadow: L['dropShadow'] = shadow
    return L


def text(id, name, start, dur, txt, size, pos, font='bold', color=None, just='center', box=None, tracking=0,
         caps=False, leading=None, op=100, anchor=(0, 0)):
    fam, sty = FONT[font]
    st = {'text': txt, 'fontFamily': fam, 'fontStyle': sty, 'fontSize': size, 'fillColor': color or WHITE,
          'strokeWidth': 0, 'justification': just, 'tracking': tracking, 'allCaps': caps}
    if leading: st['leading'] = leading
    if box:
        st.update(boxText=True, boxPosition=[0, 0], boxSize=list(box), verticalAlign='top')
    return {'type': 'Text', 'id': id, 'name': name, 'blendMode': 'normal', 'activeRange': rng(start, dur),
            'transform': tf(pos, anchor, op=op), 'sourceText': st}


def group(id, name, start, dur, layers, pos=(0, 0), anchor=(0, 0), op=100, matte=None, shadow=None):
    L = {'type': 'Group', 'id': id, 'name': name, 'blendMode': 'normal',
         'playback': {'type': 'windowed', 'inputRange': rng(start, dur),
                      'mapping': {'type': 'linear', 'input': rng(start, dur), 'output': rng(0, dur)},
                      'inputOffsetMs': 0},
         'transform': tf(pos, anchor, op=op), 'layers': layers}
    if matte: L['trackMatte'] = {'layer': matte, 'mode': 'alpha'}
    if shadow: L['dropShadow'] = shadow
    return L


def audio(id, name, start, dur, asset, vol=1.0):
    return {'type': 'Audio', 'id': id, 'name': name, 'source': {'assetId': asset},
            'sourceRange': rng(0, dur), 'sourceIntrinsicDuration': int(dur), 'volume': vol,
            'playback': {'type': 'windowed', 'inputRange': rng(start, dur),
                         'mapping': {'type': 'linear', 'input': rng(start, dur), 'output': rng(0, dur)},
                         'inputOffsetMs': 0}}


def shadow(blur=60, y=30, a=0.35, color='#060A24', spread=0):
    return {'color': hexc(color, a), 'blurRadius': blur, 'spreadRadius': spread, 'blendMode': 'normal',
            'offset': [0, y], 'enabled': True}


OUT = {'type': 'cubicBezier', 'x1': 0.2, 'y1': 0.8, 'x2': 0.2, 'y2': 1}      # the app's --ease
INOUT = {'type': 'cubicBezier', 'x1': 0.65, 'y1': 0, 'x2': 0.35, 'y2': 1}
LIN = {'type': 'linear'}
_kid = [0]


def kf(layer, prop, keys):
    """keys: [(ms, value, easing)] on the layer's own clock."""
    ts = [k[0] for k in keys]
    assert all(a < b for a, b in zip(ts, ts[1:])), f"keys not increasing on {layer}/{prop}: {ts}"
    out = []
    for t, v, e in keys:
        _kid[0] += 1
        out.append({'id': f'k{layer}-{prop}-{_kid[0]}', 'layerTime': int(t),
                    'value': {'type': 'float', 'value': float(v)}, 'easing': e or LIN})
    return {'type': 'setFxPropertyKeyframes', 'compositionId': 'main',
            'property': {'layerId': layer, 'propertyType': prop}, 'keyframes': out}


def run(*args):
    r = subprocess.run([TSRCT, *args], capture_output=True, text=True)
    if r.returncode:
        raise SystemExit('tsrct ' + ' '.join(args[:2]) + ' failed:\n' + r.stdout + r.stderr)
    return r.stdout


def save(project, work, duration, layers, actions, bg=None, comp=None):
    run('project', 'checkout', '--project', project, '--output', work + '/editable.json')
    doc = json.load(open(work + '/editable.json'))
    doc['duration'] = duration
    doc['composition']['layers'] = layers
    if bg: doc['backgroundColor'] = bg
    if comp: doc['composition'].update(comp)
    json.dump(doc, open(work + '/editable.json', 'w'))
    run('project', 'commit', '--project', project, '--file', work + '/editable.json')
    if actions:
        json.dump(actions, open(work + '/edits.json', 'w'))
        run('project', 'apply', '--project', project, '--actions', work + '/edits.json')
