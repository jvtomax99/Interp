"""The mouth shapes page for Jose: out/plan-mouths.png, from out/plan/mouths.png
(tripo_mouths.py)."""
import os
from PIL import Image
from storyboard import O, fit, board

sheet = Image.open(O('plan/mouths.png')).convert('RGB')
h = sheet.height // 7
rows = lambda ks: fit(Image.fromarray(__import__('numpy').vstack([__import__('numpy').asarray(sheet.crop((0, k * h, sheet.width, (k + 1) * h))) for k in ks])), 1000, 2000)
diagram = fit(Image.open(O('plan/muscles.png')).convert('RGB').crop((0, 0, 900, 730)), 1000, 820)
board('His mouth, moved like a real face', ['Each reaction is now made the way a person makes it: by', 'the muscles that do it, on his own face.'], [
    ('1', 'ME', 'What real faces do (the Facial Action Coding System, Ekman and Friesen, the scientific catalogue of face '
     'movements): surprise drops the jaw with the lips let go, no pucker; sadness pulls the corners down and the chin muscle '
     'pushes the lower lip up into a pout; worry stretches the lips sideways; doubt dimples one corner; a mouth corner drags a '
     'wide patch of cheek with it, which is why the old shapes creased.', [diagram], 'Which way each muscle pulls on his face', False),
    ('2', 'ME', 'All seven, rebuilt that way: your drawing (left), his mouth close up, his whole face. Surprised is now a '
     'relaxed open \u201coh\u201d, sad a frown with the chin pout, worried a stretched flat mouth, doubt a one-sided dimple.',
     [rows([0, 1, 2, 3, 4, 5, 6])], '', True),
    ('3', 'NEXT', 'After your OK: the expression sheet, where the eyes join in too (surprise opens them wider, a laugh '
     'squints them, as real faces do), then six poses and a 360\u00b0 turn.', [], '', False),
], 'plan-mouths.png')
