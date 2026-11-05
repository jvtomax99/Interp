# The opening mockup (Badge in)

The mockup Jose picked on 2026-11-05 (`docs/features/opening.md`). Not part
of the app; `docs/` is never deployed.

- `src/src7.html`: the page, with placeholders the build fills in.
- `src/badge3-css.txt`, `src/badge4-html.txt`: the badge, the lanyard and the reader.
- `src/gal-css.txt`: the page around the phone frame.
- `src/build7.py`: fills the placeholders (three.js from `campus3d/three/`,
  Dr. Smiley from `drsmiley/`, the mark `hmh-mark.png`, the photo and its
  depth map). Its paths point at the chat's scratch folder: change `d` to
  this folder before running it.
- `src/sound.wav`: the placeholder beep, chime and whoosh.
- `src/pavilion.jpg`: Jose's own photo of the Helena Theurer Pavilion;
  `src/s-pav-depth.png` its depth map (Depth Anything V2 Small, ONNX, from
  fabio-sim/Depth-Anything-ONNX on GitHub, run with onnxruntime, then
  smoothed).
- `hub-opening-final.mp4`: the picked opening with sound (the tap at 4.4 s).
  `light-options.mp4` and `exit-options.mp4`: the choices it was picked
  from. `stills.png`: three frames.

Query string of the built page: `?t=<ms>` draws one still (with `&tap=<ms>`),
`&light=1|2|3` (1 picked: shafts from the photo's own sky), `&exit=1..4`
(3 picked: the green ring opens into Home), `&font=cg` (Cormorant, picked).
