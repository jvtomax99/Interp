# Dr. Smiley beside the reader (the opening, with your photo on the badge)

Jose's clips of Dr. Smiley full body (2026-11-06), kept in
`docs/art/dr-smiley-body/`: `gentle-wave.mp4` (5 s, starts and ends on
the same pose, so it loops) and `big-wave.mp4` (5 s; the opening uses
0.3 s to 3.6 s, the grin with his eyes shut, then the wave). Both
1228 x 1686, 30 fps, on a flat gray (211, 213, 213).

Made into `opening/smiley-{wave,grin}-1.{mp4,webm,webp}`:

```
pip install "rembg[cpu]"     # the AI cut-out; downloads its model (~180 MB) on first use
mkdir -p wave grin
ffmpeg -i docs/art/dr-smiley-body/gentle-wave.mp4 wave/%03d.png
ffmpeg -ss 0.3 -t 3.3 -i docs/art/dr-smiley-body/big-wave.mp4 grin/%03d.png
python3 cut.py wave wave-cut       # ~2 s a frame
python3 cut.py grin grin-cut
python3 build.py wave-cut grin-cut opening
```

A plain colour cut doesn't work here: his white coat's shadows are the
same gray as the background. `cut.py` uses rembg's `isnet-general-use`
model (u2net cut as cleanly on the test frames, isnet a little cleaner on
the coat's edge). `build.py` crops both clips to one box, takes the gray
back out of his soft edges, and stacks each frame over its black-and-white
matte; `features/opening.js` (`opDrDraw`) draws them onto a canvas. A new
cut gets a new number in its name.
