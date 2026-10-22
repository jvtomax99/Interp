"""The mouth shapes page for Jose: out/plan-mouths.png, from out/plan/mouths.png
(tripo_mouths.py)."""
import os
from PIL import Image
from storyboard import O, fit, board

sheet = Image.open(O('plan/mouths.png')).convert('RGB')
h = sheet.height // 7
rows = lambda ks: fit(Image.fromarray(__import__('numpy').vstack([__import__('numpy').asarray(sheet.crop((0, k * h, sheet.width, (k + 1) * h))) for k in ks])), 1000, 2000)
board('His mouth shapes, first pass', ['Your drawing (left), his 3D mouth close up (middle) and', 'his whole face (right). Same brows as the app gives each face.'], [
    ('1', 'ME', 'Working well: rest, smile and laugh, and doubt (one corner up). All are his own lips moving.',
     [rows([0, 1, 2, 6])], 'rest, smile, laugh, doubt', False),
    ('2', 'ME', 'Not right yet: surprised leans to one side and creases above the lip; sad and worried are flat lines, '
     'not the frown in your drawings.', [rows([3, 4, 5])], 'surprised, sad, worried', False),
    ('3', 'DECIDE', 'How I fix them. My pick: trace each of your drawn mouths and fit his lips onto that outline, the way '
     'the closed mouth was done, so his shapes follow your drawings instead of curves I invent. Then the expression sheet.',
     [], '', True),
], 'plan-mouths.png')
