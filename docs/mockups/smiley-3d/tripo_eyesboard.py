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


lg2 = Image.open(O('plan/laugh-lids2.png')).crop((0, 0, 864 - 12, 652))
sheet = Image.open(O('plan/mouths.png'))
board('Eyes, step 5: lids wrapped into his skin', ['Shut eyes no longer look like goggles. All seven reactions', 'with the new eyes, beside your drawings.'], [
    ('1', 'ME', 'The lids now tuck under his skin past the eye\u2019s outline, like a real lid under the brow and cheek, so a shut '
     'eye sits flush. The laugh shuts his eyes in a gentle upward arc, the lower lid rising to meet the upper. A squint '
     'works too.', [fit(lg2, 1000, 520)], 'squint, and the laugh\u2019s shut eyes', False),
    ('2', 'ME', 'All seven with the new eyes: calm resting lids, lower lids lifting in a smile, white above the iris in '
     'surprise, heavy lids in sad, one half-shut eye in doubt.', [fit(sheet, 1000, 2200)], 'your drawing, his mouth, his whole face', True),
    ('3', 'NEXT', 'After your OK: the teeth (real upper and lower teeth, gums and tongue), then the expression sheet.', [], '', False),
], 'plan-eyes6.png')


e7 = Image.open(O('plan/eyes7.png'))
sheet = Image.open(O('plan/mouths.png'))
board('Eyes, the animator\u2019s way', ['No lower lids, no spiky lashes. What animators do instead.'], [
    ('1', 'ME', 'What animation teachers say (Animation Mentor, AnimSchool, Bloop Animation): the top lid does the work and '
     'moves with the eye; a boy\u2019s lashes are one bold line, not separate hairs; the line lives on the lid\u2019s edge '
     'so it travels with every blink; happy shut eyes are a closed lid with an upward-curved line.', [], '', False),
    ('2', 'ME', 'Done that way: the eyeliner painted into his old texture is gone (it stayed behind like glasses when the lid '
     'came down); one smooth tapered lash line rides the lid\u2019s edge; the lid is his own skin colour; the laugh is a shut '
     'lid with an upward arc.', [fit(e7, 1000, 380)], 'rest, half blink, sad, laugh', False),
    ('3', 'ME', 'All seven reactions with these eyes.', [fit(sheet, 1000, 2200)], 'your drawing, his mouth, his whole face', True),
    ('4', 'NEXT', 'Known: a shut eye still bulges a little (the eyeball stands out of his face), and the arc\u2019s ends dip as '
     'they tuck under the skin. After your OK: the teeth.', [], '', False),
], 'plan-eyes7.png')


e7b, e8 = Image.open(O('plan/eyes7-before.png')), Image.open(O('plan/eyes8.png'))
sheet = Image.open(O('plan/mouths.png'))
board('Eyes: the lash line fixed', ['You spotted it: the lash line floated above the eye.'], [
    ('1', 'ME', 'Why: each lid is a ring round the eyeball, and its hidden back half was being pulled forward too. It showed '
     'as a second, lower lid edge under the lash line, so the line looked detached and wandered from pose to pose. Now only '
     'the front half wraps; the line sits exactly on the lid\u2019s edge, which rests on the top of the iris (your pick B).',
     [fit(e7b, 1000, 380), fit(e8, 1000, 380)], 'before (top), after (bottom): rest, half blink, sad, laugh', False),
    ('2', 'ME', 'All seven reactions with the fix.', [fit(sheet, 1000, 2200)], 'your drawing, his mouth, his whole face', True),
], 'plan-eyes8.png')


import numpy as _np
sh = Image.open(O('plan/mouths.png')); _h = sh.height // 7
two = Image.fromarray(_np.vstack([_np.asarray(sh.crop((0, k * _h, sh.width, (k + 1) * _h))) for k in (2, 3)]))
board('Laugh and surprised, redone', ['Your drawing (left), his mouth close up, his whole face.'], [
    ('1', 'ME', 'Laugh: when he shuts his eyes the eyeballs ease back, so the lids lie nearly flush instead of bulging, and '
     'the shut line runs across the middle of the eye like your drawing. Surprised: a round \u201coh\u201d instead of a wide '
     'flat mouth; the skin round it follows gently and his nose stays put.', [fit(two, 1000, 700)], 'laugh, surprised', False),
    ('2', 'ME', 'Surprised straight on and at three-quarters.', [fit(Image.open(O('plan/surprised-front.png')), 1000, 420)], '', True),
    ('3', 'NEXT', 'Still off: the teeth show as a streaky band in both (they are a painted strip, not real teeth); a shut eye '
     'still shows a faint rim; the \u201coh\u201d leaves two soft folds beside the nose. The teeth rebuild fixes the first.',
     [], '', False),
], 'plan-laugh-surprised.png')


import numpy as _np2
def _rows(path, ks):
    sh = Image.open(path).convert('RGB'); hh = sh.height // 7
    return Image.fromarray(_np2.vstack([_np2.asarray(sh.crop((0, k * hh, sh.width, (k + 1) * hh))) for k in ks]))
board('Real teeth', ['His painted tooth strip replaced by real 3D teeth.'], [
    ('1', 'ME', 'Before: his teeth were a white sheet 1\u20133 mm thin painted inside his smile; whenever his mouth opened '
     'wider you saw its edge from below as a streaky band.', [fit(_rows('/tmp/claude-0/fp/mouths-before.png', [1, 2, 3]), 1000, 900)],
     'before: smile, laugh, surprised', False),
    ('2', 'ME', 'Now: a row of ten rounded teeth (the middle ones a little bigger, fine gaps between) with a pink gum line, '
     'fixed to his skull like real upper teeth; the old sheet is painted into the dark of his mouth. In the \u201coh\u201d his '
     'lips come forward over the teeth as real lips do.', [fit(Image.open(O('plan/teeth-after.png')), 1000, 420),
     fit(_rows(O('plan/mouths.png'), [1, 2, 3]), 1000, 900)], 'after', True),
    ('3', 'NOTE', 'Not yet: no lower teeth (your drawings show none either); the tongue crumples a little in the \u201coh\u201d; '
     'the \u201coh\u201d hides the teeth where your drawing shows a sliver.', [], '', False),
], 'plan-teeth.png')


board('Teeth, closer to your drawing', ['Three ways to show his teeth, on his face.'], [
    ('1', 'ME', 'Your drawing shows his teeth as one smooth white band under the upper lip, as animated kids are drawn; '
     'separate teeth with gaps read as dentures. A (my pick): one smooth band.',
     [fit(Image.open(O('plan/teeth-band.png')), 1000, 380)], 'A: one smooth band', False),
    ('2', 'ME', 'B: the band with faint dividers between teeth (they read as a saw edge).',
     [fit(Image.open(O('plan/teeth-grooves.png')), 1000, 380)], 'B: faint dividers', False),
    ('3', 'ME', 'C: the separate teeth from before.', [fit(Image.open(O('plan/teeth-after.png')), 1000, 380)], 'C: separate teeth', True),
], 'plan-teeth2.png')
