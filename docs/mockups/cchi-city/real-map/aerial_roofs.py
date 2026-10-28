# Roofs from the state's aerial photo: each hospital building's roof colour, and the machines on it (air handlers,
# fans, penthouses) as boxes where the photo shows them. Writes roofs.json, which build.py puts into the page.
#   python3 aerial_roofs.py          (needs numpy, scipy, shapely, pillow; downloads the photo once into .cache/)
# The photo: New Jersey Office of GIS, "Natural 2020" orthophoto, 1 ft pixels (img.nj.gov, WMS; access constraints
# "none"). It predates the Helena Theurer Pavilion (2022), so that building keeps its look from Jose's photos.
import json, math, os, subprocess
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from shapely.geometry import Polygon
HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, '.cache'); os.makedirs(CACHE, exist_ok=True)
SCN = json.load(open(os.path.join(HERE, 'scene.json')))
X0, X1, Z0, Z1 = SCN['board']; P = 14   # pixels to a diorama unit in the warped photo
# the same fit as scene_export.py, both ways: map metres <-> diorama units
LA0, LA1, LO0, LO1 = 40.88212, 40.88568, -74.05827, -74.05277   # map.osm.xml's bounds (the fit's origin is their middle)
LAT0, LON0 = (LA0 + LA1)/2, (LO0 + LO1)/2; K = 111320*math.cos(math.radians(LAT0))
TH = math.radians(112); C, S = math.cos(TH), math.sin(TH)
def to_lonlat(X, Z):
    u = 9*((X + 0.1)/2.1 + 0.55); v = -9*(22 - (15 - Z)/2.1)
    x, y = u*C + v*S, -u*S + v*C
    return LON0 + x/K, LAT0 + y/110540
# 1. the photo, a little wider than the board
corners = [to_lonlat(x, z) for x in (X0, X1) for z in (Z0, Z1)]
lo0, lo1 = min(c[0] for c in corners) - 0.0003, max(c[0] for c in corners) + 0.0003
la0, la1 = min(c[1] for c in corners) - 0.0003, max(c[1] for c in corners) + 0.0003
W = int((lo1 - lo0)*K/0.3048); H = int((la1 - la0)*110540/0.3048)
photo = os.path.join(CACHE, 'nj-natural2020.jpg')
if not os.path.exists(photo):
    url = ('https://img.nj.gov/imagerywms/Natural2020?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=Natural2020&STYLES='
           f'&SRS=EPSG:4326&BBOX={lo0},{la0},{lo1},{la1}&WIDTH={W}&HEIGHT={H}&FORMAT=image/jpeg')
    subprocess.run(['curl', '-sS', '-m', '180', '-o', photo, url], check=True)
src = np.asarray(Image.open(photo).convert('RGB')); H, W = src.shape[:2]
# 2. warped into the board's own frame (x right, z down the image), P pixels to a unit
gx, gz = np.meshgrid(X0 + (np.arange(int((X1 - X0)*P)) + 0.5)/P, Z0 + (np.arange(int((Z1 - Z0)*P)) + 0.5)/P)
lon, lat = to_lonlat(gx, gz)
px = np.clip(((lon - lo0)/(lo1 - lo0)*W).astype(int), 0, W - 1); py = np.clip(((la1 - lat)/(la1 - la0)*H).astype(int), 0, H - 1)
img = src[py, px].astype(float)
# the photo is dim with a blue-green cast: scale each channel so its brightest roofs come out near white
img = np.clip(img*(242/np.percentile(img.reshape(-1, 3), 99.5, axis=0)), 0, 255); Image.fromarray(img.astype(np.uint8)).save(os.path.join(CACHE, 'aerial-board.png'))
lum = img @ np.array([0.299, 0.587, 0.114])
def mask_of(poly):
    m = Image.new('L', (img.shape[1], img.shape[0]), 0)
    for ring in ([poly] if poly.geom_type == 'Polygon' else list(poly.geoms)):
        ImageDraw.Draw(m).polygon([((x - X0)*P, (z - Z0)*P) for x, z in ring.exterior.coords], fill=1)
    return np.asarray(m).astype(bool)
hexc = lambda c: '#%02x%02x%02x' % tuple(int(max(0, min(255, v))) for v in c)
# where the roof is not ours to fill: Link Pavilion's two helipads (the live one is built by hand; the old one, "disused"
# in the map, is still painted in the photo), the pavilion (after the photo), Medical Plaza (its tiers)
SKIP_IDS = {'8888', '8885'}
KEEP_OUT = [(6.2, -18.2, 11.1, -13.3), (-9.6, -18.0, -5.7, -14.1)]
out = {}
for b in SCN['blds']:
    if b['kind'] != 'hosp' or b['id'] in SKIP_IDS: continue
    poly = Polygon(b['pts']).buffer(-0.45)
    if poly.is_empty or poly.area < 4: continue
    m = mask_of(poly)
    if m.sum() < 200: continue
    L = lum[m]; lo, hi = np.percentile(L, [35, 85]); sel = m & (lum >= lo) & (lum <= hi)
    roof = np.median(img[sel], axis=0); rl = roof @ np.array([0.299, 0.587, 0.114])
    # the machines: patches that differ from the membrane, not shadow (shadow is darker but the same hue)
    diff = np.abs(img - roof).max(axis=2)
    e = m & (diff > 42) & (lum > 0.62*rl)
    e = ndimage.binary_opening(e, np.ones((3, 3)))
    lab, n = ndimage.label(e)
    units = []
    for k, sl in enumerate(ndimage.find_objects(lab), 1):
        comp = lab[sl] == k; a = comp.sum()/P/P
        if a < 0.22: continue
        z0, z1 = Z0 + sl[0].start/P, Z0 + sl[0].stop/P; x0, x1 = X0 + sl[1].start/P, X0 + sl[1].stop/P
        cx, cz = (x0 + x1)/2, (z0 + z1)/2
        if any(ax0 < cx < ax1 and az0 < cz < az1 for ax0, az0, ax1, az1 in KEEP_OUT): continue
        f = math.sqrt(min(1, comp.sum()/comp.size))   # a ragged patch becomes a smaller box
        w, d = max(0.25, (x1 - x0)*f), max(0.25, (z1 - z0)*f)
        col = np.median(img[sl][comp], axis=0)
        units.append([round(cx, 2), round(cz, 2), round(w, 2), round(d, 2), round(min(0.7, 0.18 + 0.13*math.sqrt(a)), 2), hexc(col), a])
    units = sorted(units, key=lambda u: -u[6])[:30]
    out[b['id']] = { 'roof': hexc(roof), 'units': [u[:6] for u in units] }
    print(b['id'], (b.get('name') or '')[:38].ljust(38), hexc(roof), len(units))
json.dump(out, open(os.path.join(HERE, 'roofs.json'), 'w'), separators=(',', ':'))
