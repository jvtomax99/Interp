#!/bin/bash
# run.sh tag view   (the new nurse, from nurse-single.png)
S=/tmp/claude-0/-home-user-Interp/eeb5c01e-39d2-5349-a181-b7db26ff828c/scratchpad; W=$S/mv/w
cd $S/toy && MERGE=${MERGE:-3e-4} FEATURES=$W/features.json FACE=1 SAMPLES=${SAMPLES:-32} GSMOOTH=${GSMOOTH:-16} GTYPE=SMOOTH JAWIT=${JAWIT:-60} KEY=55 KEYS=3 FRONT=40 UNDER=12 WORLD=0.35 FACEZ=${FACEZ:-0.17} \
  python3 toy.py -- $S/mv/nurse2.glb $W $W/r_$1_$2.png $2 2>&1 | grep -E "rendered|rror|fit" | head -3
python3 -c "
from PIL import Image
a=Image.open('$W/r_$1_$2.png'); bg=Image.new('RGBA',a.size,(236,232,248,255)); bg.alpha_composite(a); bg.convert('RGB').save('$W/v_$1_$2.png')"
