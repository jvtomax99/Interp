# Flat-colour map for the toy nurse: every texel gets one of skin, scrubs, hair, white, decided by what is
# around it in 3D (not in the texture's scattered layout), so thin painted marks vanish and edges stay clean.
import numpy as np, sys
from PIL import Image, ImageFilter
D = sys.argv[1]; R = float(sys.argv[2]) if len(sys.argv) > 2 else 0.010
P = np.load(f'{D}/pos.npy'); Nn = np.load(f'{D}/nrm.npy'); cov = np.linalg.norm(Nn, axis=-1) > 0.5
T = np.asarray(Image.open(f'{D}/img1.png').convert('RGB')).astype(np.float32)
SEEDS = np.array([(215, 140, 90), (45, 62, 165), (35, 30, 32), (228, 226, 228), (110, 62, 35)], np.float32)  # skin blue hair white brown
d = np.linalg.norm(T[:, :, None] - SEEDS[None, None], axis=-1); c = d.argmin(-1)
import json, os
Z = dict(head=0.05, eye_z=[0.06, 0.168], eye_x=0.105, white_top=-0.425, blue_bot=-0.44, vneck=True,
         cheek_z=[0.03, 0.125], cheek_x=0.21, hair_top=0.195, hair_top_x=0.12)
if os.path.exists(f'{D}/zones.json'): Z.update(json.load(open(f'{D}/zones.json')))
x, y, z = P[..., 0], P[..., 1], P[..., 2]; nx, ny, nz = Nn[..., 0], Nn[..., 1], Nn[..., 2]
# the face: front of the head (figure faces -Y). Head starts above the neck; find it from skin texels' heights
head = (z > Z['head'])
# eye whites, iris browns and highlights on the head are features painted on: they become skin
c[head & ((c == 3) | (c == 4))] = 0
c[~head & (c == 4)] = 0          # brown elsewhere: shading on skin
# the eye zone: whatever Tripo painted there (pupils, lashes, highlights) becomes skin; the face pieces replace it
fz = (ny < -0.2) & (z > Z['eye_z'][0]) & (z < Z['eye_z'][1]) & (np.abs(x) < Z['eye_x'])
if 'eyes' in Z:     # an ellipse round each eye (lashes and flicks included) instead of one box
    a_, b_ = Z['eye_ab']; fz = np.zeros_like(fz)
    for ex_, ez_ in Z['eyes']:
        fz |= (ny < -0.2) & (((x - ex_) / a_) ** 2 + ((z - ez_) / b_) ** 2 < 1)
c[fz & (c != 0)] = 0
# white is only shoes (below the hems); the badge is its own piece
c[(c == 3) & (z > Z['white_top'])] = 1
c[(c == 1) & (z < Z['blue_bot'])] = 3
K = 4
# 3D vote: voxel histogram of classes, blurred by a box of radius R, read back at each texel
vs = R / 2; lo = P[cov].min(0) - R * 2
ijk = np.floor((P - lo) / vs).astype(int); ijk[~cov] = 0
dims = ijk[cov].max(0) + 4
def box(a, r):
    for ax in (1, 2, 3):
        cs = np.cumsum(np.pad(a, [(0, 0)] + [(r + 1, r) if i == ax else (0, 0) for i in (1, 2, 3)]), axis=ax)
        a = np.take(cs, np.arange(2 * r + 1, cs.shape[ax]), axis=ax) - np.take(cs, np.arange(0, cs.shape[ax] - 2 * r - 1), axis=ax)
    return a
f = (P - lo) / vs - 0.5; f0 = np.floor(f).astype(int); fr = f - f0; f0[~cov] = 0; fr[~cov] = 0
def vote(lab):
    H = np.zeros((K, *dims), np.float32)
    for k in range(K):
        m = cov & (lab == k); np.add.at(H[k], (ijk[m, 0], ijk[m, 1], ijk[m, 2]), 1)
    Hb = box(H, 2)
    acc = np.zeros((K,) + P.shape[:2], np.float32)
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                wgt = (fr[..., 0] if dx else 1 - fr[..., 0]) * (fr[..., 1] if dy else 1 - fr[..., 1]) * (fr[..., 2] if dz else 1 - fr[..., 2])
                ii = np.clip(f0[..., 0] + dx, 0, dims[0] - 1); jj = np.clip(f0[..., 1] + dy, 0, dims[1] - 1); kk = np.clip(f0[..., 2] + dz, 0, dims[2] - 1)
                acc += Hb[:, ii, jj, kk] * wgt
    return acc
acc = vote(c)
FZ = np.zeros_like(acc)
# the V neck: skin inside the collar's V at the front
vneck = (ny < 0) & (y < 0) & (np.abs(x) < 0.06) & (z < 0.045) & (z > -0.048 + np.abs(x) / 0.05 * 0.056)
if isinstance(Z['vneck'], list):   # [apex z, slope, half width, top z]
    az, sl, hw, tz = Z['vneck']; vneck = (ny < 0) & (y < 0) & (np.abs(x) < hw) & (z < tz) & (z > az + sl * np.abs(x))
    FZ[0][vneck] += 1e6
elif Z['vneck']: FZ[0][vneck] += 1e6
FZ[0][(y < -0.03) & (z < Z['cheek_z'][1]) & (z > Z['cheek_z'][0]) & (np.abs(x) < Z['cheek_x']) & (acc.argmax(0) == 2)] += 1e6   # no hair on the cheeks
FZ[2][z < Z.get('hair_low', -9)] -= 1e7   # nothing below the neck is hair (dark shading on cuffs)
FZ[2][(ny < 0) & (z > Z['hair_top']) & (np.abs(x) < Z['hair_top_x'])] += 1e6   # no skin on the hair above the forehead
L = (acc + FZ).argmax(0)
for _ in range(int(__import__('os').environ.get('PASSES', '2')) - 1):   # vote again on the clean labels: smoother edges
    L = (vote(L) + FZ).argmax(0)
L[~cov] = 255
np.save(f'{D}/label.npy', L.astype(np.uint8))
pal = np.array([(0, 0, 0)] * 256, np.uint8); pal[:4] = [(220, 140, 95), (40, 60, 165), (35, 30, 32), (235, 230, 228)]
Image.fromarray(pal[c.astype(np.uint8) if True else c]).resize((768, 768), Image.NEAREST).save(f'{D}/raw_lab.png')
Image.fromarray(pal[L]).resize((768, 768), Image.NEAREST).save(f'{D}/lab.png')
print('share', [(k, round(float((L == k).mean()), 3)) for k in range(4)])
