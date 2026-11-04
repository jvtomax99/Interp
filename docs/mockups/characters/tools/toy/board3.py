# Polish round board: picture | before polish | now front | now turned; faces: picture | before polish | now
import sys
from PIL import Image
sys.argv = [sys.argv[0]] + sys.argv[1:]
exec(open(__file__.replace('board3.py', 'board2.py')).read().split("pic = Image.open")[0])
W = sys.argv[1]
pic = Image.open('/home/user/Interp/docs/art/nurse-single.png')
prev = Image.open(f'{R}/nurse-toy2.png'); prevf = Image.open(f'{R}/nurse-toy2-face.png')
board([fig(pic), fig(prev.crop((780, 60, 1160, prev.height))), fig(Image.open(f'{W}/v_z_front.png')), fig(Image.open(f'{W}/v_z_three.png'))],
      ['Picture', 'Before polish', 'Now (front)', 'Now (turned)'], 900, f'{R}/nurse-toy3.png')
pf = pic.convert('RGB').crop((440, 300, 840, 640))
nf = Image.open(f'{W}/v_z_face.png').convert('RGB').crop((40, 230, 760, 800))
board([pf, prevf.crop((655, 60, prevf.width - 20, prevf.height - 10)), nf], ['Picture', 'Before polish', 'Now'], 440, f'{R}/nurse-toy3-face.png')
