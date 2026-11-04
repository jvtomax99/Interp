import numpy as np
SEEDS = {'skin': (215,140,90), 'blue': (50,62,170), 'hair': (40,36,40), 'white': (225,225,228), 'iris': (105,60,35), 'line': (120,70,50)}
NAMES = list(SEEDS)          # 0 skin 1 blue 2 hair 3 white 4 iris 5 line
def classify(rgb, far=70):
    s = np.array([SEEDS[n] for n in NAMES], np.float32)
    d = np.linalg.norm(rgb[:, :, None, :].astype(np.float32) - s[None, None], axis=-1)
    c = d.argmin(-1).astype(np.uint8); c[d.min(-1) > far] = 255
    return c
