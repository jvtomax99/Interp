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
