"""The mouth shapes page for Jose: out/plan-mouths.png, from out/plan/mouths.png
(tripo_mouths.py)."""
import os
from PIL import Image
from storyboard import O, fit, board

sheet = Image.open(O('plan/mouths.png')).convert('RGB')
h = sheet.height // 7
rows = lambda ks: fit(Image.fromarray(__import__('numpy').vstack([__import__('numpy').asarray(sheet.crop((0, k * h, sheet.width, (k + 1) * h))) for k in ks])), 1000, 2000)
board('His mouth shapes, traced from your drawings', ['Your drawing (left), his 3D mouth close up (middle) and', 'his whole face (right). Same brows as the app gives each face.'], [
    ('1', 'ME', 'Rest, smile, laugh and doubt, as before: his own lips moving.',
     [rows([0, 1, 2, 6])], 'rest, smile, laugh, doubt', False),
    ('2', 'ME', 'Surprised, sad and worried, now traced from your drawings: your drawn face levelled (it is tilted 11\u00b0), '
     'scaled so your resting mouth lands on his, and his lips fitted onto each outline. Sad is a real frown, worried has its '
     'uneven ends, surprised is your O. The O still has soft folds beside the nose and is a little uneven inside; I can polish '
     'that later.', [rows([3, 4, 5])], 'surprised, sad, worried', True),
    ('3', 'NEXT', 'After your OK: the expression sheet (brows, eyes, mouth and cheeks together), six poses and a 360\u00b0 turn.',
     [], '', False),
], 'plan-mouths.png')
