"""Before/after pages for the eye steps (out/plan-alive.png): out/plan-eyes2.png."""
from PIL import Image
from storyboard import O, fit, board

b, a = Image.open(O('plan/eyes2-before.png')), Image.open(O('plan/eyes2-after.png'))
board('Eyes, step 1: glass and iris', ['His eyes before (top) and after (bottom): close up, from', 'the side, and in his whole face.'], [
    ('1', 'ME', 'A clear glass dome over each iris, like a real eye\\u2019s cornea. The shine is now a real reflection of one '
     'small round light, up and to the right as in your drawing: it sits on the glass and shifts as you move round him '
     '(see the side view), instead of a painted white sticker.', [fit(b, 1000, 300), fit(a, 1000, 300)], 'before (top), after (bottom)', False),
    ('2', 'ME', 'The iris got fine fibres running out from the pupil, a lighter ring round the pupil and a darker rim, so it '
     'has depth under the glass.', [], '', True),
    ('3', 'NEXT', 'After your OK, step 2: lids with real thickness and a rounded edge, and lashes growing from the lid in place '
     'of the eyeliner that floats off the eye from the side.', [], '', False),
], 'plan-eyes2.png')


lb, la, ea = Image.open(O('plan/lids-before.png')), Image.open(O('plan/lids-after.png')), Image.open(O('plan/eyes3-after.png'))
board('Eyes, step 2: lids and lashes', ['His lids before (top) and after (bottom): heavy (sad),', 'half closed, shut, and half closed from the side.'], [
    ('1', 'ME', 'The lid edge was a flat cut, so a lowered lid looked like a card with a ruler-straight edge. Now it arches over '
     'the eye the way a real lid does, has a rounded rim with thickness, and a bold lash line that flicks up at the outer '
     'corner. From the side it is a real lid.', [fit(lb, 1000, 260), fit(la, 1000, 260)], 'before (top), after (bottom)', False),
    ('2', 'ME', 'Open, the eyeliner stays bold but is now pressed onto his skin, so from the side it no longer floats off the '
     'eye.', [fit(ea, 1000, 300)], 'open eyes: close up, side, whole face', True),
    ('3', 'NEXT', 'After your OK, step 3: soft shading in the whites and pink inner corners; then step 4, a lower lid (squint, '
     'the laugh\u2019s happy arcs, a lash line when the eye shuts).', [], '', False),
], 'plan-eyes3.png')
