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


rl = Image.open(O('plan/restlid.png'))
board('Eyes, step 3: more human', ['Three ways his upper lid can rest. All three now have a', 'lower lid and pink inner corners.'], [
    ('1', 'ME', 'Real eyes at rest show no white above the iris: the upper lid sits on its top edge. White there reads as '
     'startled. A is his eyes as they are now; B rests the lid just on the iris; C a little over it.',
     [fit(rl, 1000, 560)], 'A (left), B (middle, my pick), C (right)', False),
    ('2', 'ME', 'New in all three: a lower lid with its own rim and short lashes along the bottom of each eye, and the whites '
     'warming to pink at the inner corners, as real eyes do.', [], '', True),
    ('3', 'NEXT', 'The lower lid rising for a squint and for your laugh\u2019s happy arcs: raised, it still looks like a separate '
     'skin patch; it needs to blend into his cheek. Then the expression sheet.', [], '', False),
], 'plan-eyes4.png')


lg = Image.open(O('plan/laugh-lids.png'))
board('Eyes, step 4: squint and laugh', ['Your pick B is now his resting lid. The lower lid can rise.'], [
    ('1', 'ME', 'Squint (left): the lower lid rises with its lash line and reads as a happy eye. That works.',
     [fit(lg, 1000, 520)], 'squint, and two tries at the laugh\u2019s shut eyes', False),
    ('2', 'ME', 'The laugh\u2019s shut eyes do not work yet: his lids are shells over an eyeball that stands 6 mm out of his face, '
     'so shut eyes look like two pink domes, goggles, and in B the lash lines cross.', [], '', False),
    ('3', 'DECIDE', 'My fix: wrap the lids into his skin. Near the lid edge they follow the eyeball; further out they blend '
     'onto his own face (the way the eyeliner is pressed onto it now), so a shut eye is a soft bulge flowing into his cheek '
     'and brow, as on a real face. Then the two lids can meet in your drawing\u2019s happy arc.', [], '', True),
], 'plan-eyes5.png')
