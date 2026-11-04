#!/bin/bash
# view.sh name [front|three|face] : render then put on lavender
cd "$(dirname "$0")"; v=${2:-front}
python3 toy.py -- /home/user/Interp/docs/mockups/characters/tripo/nurse-best.glb . r_$1_$v.png $v 2>&1 | grep -E "rendered|rror" | head -5
python3 -c "
from PIL import Image
a=Image.open('r_$1_$v.png'); bg=Image.new('RGBA',a.size,(236,232,248,255)); bg.alpha_composite(a); bg.convert('RGB').save('v_$1_$v.png')"
