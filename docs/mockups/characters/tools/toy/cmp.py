import sys
from PIL import Image
S = sys.argv[1]; tag = sys.argv[2]
d = Image.open(f'{S}/../nurse-crop.png').convert('RGB')
f = Image.open(f'{S}/v_{tag}_front.png'); t = Image.open(f'{S}/v_{tag}_three.png')
# crop figure renders to the figure box, scale all to 1000 tall
def fig(im):
    import numpy as np
    a = np.asarray(im).astype(int); m = (abs(a - a[5, 5]).sum(-1) > 30); ys, xs = m.nonzero()
    return im.crop((max(0, xs.min() - 30), ys.min() - 20, xs.max() + 30, ys.max() + 20))
ims = [d.crop((0, 0, 464, 1000)), fig(f), fig(t)]
ims = [i.resize((int(i.width * 1000 / i.height), 1000)) for i in ims]
W = sum(i.width for i in ims) + 40
out = Image.new('RGB', (W, 1000), (236, 232, 248)); x = 0
for i in ims: out.paste(i, (x, 0)); x += i.width + 20
out.save(f'{S}/cmp_{tag}.png'); print(out.size)
