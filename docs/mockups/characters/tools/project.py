# Class-aware combine: the flattened Tripo texture + the drawing projected onto the front, where a texel only takes
# drawing paint of its own kind (skin<-skin, hair<-hair, blue<-blue/white, white<-white) and the face's features land
# on skin. Also writes a roughness map and a coat map per kind.  python3 project.py base projF projM out_dir
import sys, numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, __import__('os').path.dirname(__file__)); from classify import classify
base, pf, pm, out = sys.argv[1:5]; pmf = sys.argv[5] if len(sys.argv) > 5 else None
Image.MAX_IMAGE_PIXELS = None
B = np.asarray(Image.open(base).convert('RGB')).astype(np.float32)
P = np.asarray(Image.open(pf)).astype(np.float32); M = np.asarray(Image.open(pm)).astype(np.float32)
MF = np.asarray(Image.open(pmf)).astype(np.float32) if pmf else M
tc = classify(B.astype(np.uint8)); pc = classify(P[..., :3].astype(np.uint8))
face = M[..., 0] > 200; badge = (M[..., 0] > 90) & (M[..., 0] < 170); mk = M[..., 3] > 40
pa = P[..., 3] / 255
# compatibility
ok = np.zeros(tc.shape, bool)
ok |= (tc == pc)
ok |= face & (tc != 2) & (tc != 1)          # the face: any feature onto anything but hair and cloth
ok |= badge & (tc != 2)
# flatten under the features first, so nothing of Tripo's own eyes, mouth or badge text shows through
sk = (tc == 0).astype(np.float32)
skc = np.asarray(Image.fromarray((B * sk[..., None]).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(14))).astype(np.float32)
skm = np.asarray(Image.fromarray((sk * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(14))).astype(np.float32) / 255
skin_est = np.where(skm[..., None] > 0.05, skc / np.maximum(skm[..., None], 1e-3), np.array([226, 152, 116], np.float32))
# straight-on faces (MF): every mark goes, hair only where the drawing has hair. Sideways faces (M but not MF):
# the model's hair mass stays, thin painted smudges on the skin go.
hairz = M[..., 2] > 128; faceF = MF[..., 0] > 200
hair_mass = np.asarray(Image.fromarray(((tc == 2) * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(13)).filter(ImageFilter.MaxFilter(25))) > 0
hair_near = hairz                            # the drawing's hair, widened on screen before the bake
lower = M[..., 1] > 128                      # below eye level: nothing there is hair
fz = (faceF & (tc != 1) & (~(hair_mass & hair_near) | lower)) | (face & ~faceF & (tc != 1) & (~hair_mass | lower))
B[fz] = skin_est[fz]
# the shirt around the badge: flat blue, the badge bump white
shirtz = (M[..., 0] > 40) & (M[..., 0] < 90)
sz_ = shirtz | badge; B[sz_] = np.array([44, 66, 150], np.float32)

ok |= (tc == 1) & (pc == 3)                 # badge, piping on blue
ok |= (tc == 3) & (pc == 1)                 # a bit of blue on white (hems over shoes)
ok |= (tc == 255)
a = pa * ok
a[badge] = 0; a[face] = 0; a[shirtz] = 0                                  # the badge bump stays plain white; the drawing's badge sits elsewhere
# hair: darker base than clean.py's target (which averaged in the highlights)
hair = tc == 2
# grow the painted area 6 px outward to close seams
known = a > 0.02; c = P[..., :3] * known[..., None]; aa = a.copy()
for _ in range(6):
    acc = np.zeros_like(c); n = np.zeros(a.shape, np.float32); sa = np.zeros_like(aa)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        acc += np.roll(c * known[..., None], (dy, dx), (0, 1)); n += np.roll(known.astype(np.float32), (dy, dx), (0, 1)); sa += np.roll(aa * known, (dy, dx), (0, 1))
    grow = (~known) & (n > 0) & ok
    c[grow] = acc[grow] / n[grow][:, None]; aa[grow] = sa[grow] / n[grow]; known |= grow
res = B * (1 - aa[..., None]) + c * aa[..., None]
res[tc == 1] *= np.array([0.63, 0.81, 0.93])   # measured against the drawing under the studio light
res[tc == 2] *= 0.76
Image.fromarray(res.clip(0, 255).astype(np.uint8)).save(out + '/color.png')
# roughness: hair glossy, eyes glossier, cloth matte
rough = np.full(tc.shape, 0.72, np.float32)
rough[tc == 0] = 0.5; rough[tc == 2] = 0.55; rough[tc == 3] = 0.45; rough[(tc == 4) | (tc == 5)] = 0.4
rough[fz] = 0.5; coat_face = fz
eyes = face & (tc == 0) & known & ((pc == 2) | (pc == 3) | (pc == 4)); rough[eyes] = 0.42
coat = np.zeros(tc.shape, np.float32); coat[tc == 2] = 0.0
spec = np.full(tc.shape, 0.4, np.float32); spec[tc == 2] = 0.12
for nm, arr in (('rough', rough), ('coat', coat), ('spec', spec)):
    Image.fromarray((np.asarray(Image.fromarray((arr * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2)))).astype(np.uint8)).save(out + '/' + nm + '.png')
print('face texels', int(face.sum()), 'badge texels', int(badge.sum())); print('done', 'painted', round(float((aa > 0.1).mean()), 3), 'eyes', int(eyes.sum()))
