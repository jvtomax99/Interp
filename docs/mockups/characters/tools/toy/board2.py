# Before/after board for the second nurse: new picture | first rebuild | now front | now turned; and faces.
import numpy as np, sys
from PIL import Image, ImageDraw, ImageFont
W = sys.argv[1]; R = '/home/user/Interp/docs/mockups/characters'
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
def fig(im, pad=20):
    a = np.asarray(im.convert('RGB')).astype(int); m = (abs(a - a[5, 5]).sum(-1) > 30); ys, xs = m.nonzero()
    return im.convert('RGB').crop((max(0, xs.min() - pad), max(0, ys.min() - pad), min(im.width, xs.max() + pad), min(im.height, ys.max() + pad)))
def board(ims, labels, H, out):
    ims = [i.resize((int(i.width * H / i.height), H), Image.LANCZOS) for i in ims]
    o = Image.new('RGB', (sum(i.width for i in ims) + 20 * (len(ims) + 1), H + 70), (236, 232, 248)); d = ImageDraw.Draw(o); x = 20
    for i, lb in zip(ims, labels): o.paste(i, (x, 60)); d.text((x + 8, 14), lb, fill=(40, 40, 70), font=font); x += i.width + 20
    o.save(out); print(out, o.size)
pic = Image.open('/home/user/Interp/docs/art/nurse-single.png')
first = Image.open(f'{R}/nurse-toy.png'); fw = first.width
first_front = fig(first.crop((870, 60, 1250, first.height)))
board([fig(pic), first_front, fig(Image.open(f'{W}/v_z_front.png')), fig(Image.open(f'{W}/v_z_three.png'))],
      ['New picture', 'First rebuild', 'Now (front)', 'Now (turned)'], 900, f'{R}/nurse-toy2.png')
pf = pic.convert('RGB').crop((440, 300, 840, 640)); nf = Image.open(f'{W}/v_z_face.png').convert('RGB').crop((40, 230, 760, 842 if False else 800))
board([pf, nf], ['New picture', 'Now'], 520, f'{R}/nurse-toy2-face.png')
