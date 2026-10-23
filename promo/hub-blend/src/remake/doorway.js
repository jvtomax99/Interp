// The doorway to CoreCHI City (Jose, 2026-10-22): the CoreCHI shot opens on his cherry-tree
// photo of the campus (the app's hero.jpg: the tree, the lamp post, the Hackensack Meridian Health
// sign) instead of the desk. The camera pushes in with gentle depth, the tree, post, sign and
// bushes nearer than the building and sky, and the photo dissolves into the CoreCHI Practice card
// on the phone, where the flight into the campus (city.js) takes over. The two depths come from
// the photo's own colours (the building and sky are pale and grey or blue, the rest is not); the
// building behind the near things is filled from its surroundings, so nothing doubles as they move.
import { clamp, lerp, prog, inOutSine, smooth } from "../util.js";

const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

export async function createDoorway(after, W, H) {
  const img = await loadImg("assets/humc/cherry.jpg");
  const pw = img.width, ph = img.height;
  // ---------- the two layers ----------
  const S = 2; // the mask and the fill are worked out at half size
  const mw = Math.round(pw / S), mh = Math.round(ph / S);
  const small = document.createElement("canvas"); small.width = mw; small.height = mh;
  const sg = small.getContext("2d", { willReadFrequently: true });
  sg.drawImage(img, 0, 0, mw, mh);
  const px = sg.getImageData(0, 0, mw, mh).data;
  const near = new Float32Array(mw * mh);
  for (let i = 0; i < mw * mh; i++) {
    const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx ? (mx - mn) / mx : 0, lum = 0.3 * r + 0.59 * g + 0.11 * b;
    const y = Math.floor(i / mw) / mh;
    // far: pale and grey (the building), or blue (sky, glass); everything low in the picture is near
    const far = (sat < 0.22 && lum > 120) || (b > r + 12 && b >= g && lum > 70);
    near[i] = y > 0.83 || !far ? 1 : 0;
  }
  // soften the edge a little (two box passes)
  const blurA = (a, w, h, r) => {
    const o = new Float32Array(a.length);
    for (let y = 0; y < h; y++) { let s = 0; for (let x = -r; x <= r; x++) s += a[y * w + clamp(x, 0, w - 1)]; for (let x = 0; x < w; x++) { o[y * w + x] = s / (2 * r + 1); s += a[y * w + Math.min(w - 1, x + r + 1)] - a[y * w + Math.max(0, x - r)]; } }
    const p = new Float32Array(a.length);
    for (let x = 0; x < w; x++) { let s = 0; for (let y = -r; y <= r; y++) s += o[clamp(y, 0, h - 1) * w + x]; for (let y = 0; y < h; y++) { p[y * w + x] = s / (2 * r + 1); s += o[Math.min(h - 1, y + r + 1) * w + x] - o[Math.max(0, y - r) * w + x]; } }
    return p;
  };
  const soft = blurA(near, mw, mh, 2);
  // the near layer: the photo with the soft mask as its alpha
  const nearC = document.createElement("canvas"); nearC.width = mw; nearC.height = mh;
  const ng = nearC.getContext("2d"); const nd = ng.createImageData(mw, mh);
  for (let i = 0; i < mw * mh; i++) { nd.data[i * 4] = px[i * 4]; nd.data[i * 4 + 1] = px[i * 4 + 1]; nd.data[i * 4 + 2] = px[i * 4 + 2]; nd.data[i * 4 + 3] = Math.round(255 * soft[i]); }
  ng.putImageData(nd, 0, 0);
  // the far layer: the building and sky, the holes the near things leave filled from around them
  // (a wide blur of the far pixels alone, divided by how much far was in reach)
  const fw = new Float32Array(mw * mh), fr = new Float32Array(mw * mh), fgc = new Float32Array(mw * mh), fb = new Float32Array(mw * mh);
  for (let i = 0; i < mw * mh; i++) { const k = 1 - near[i]; fw[i] = k; fr[i] = px[i * 4] * k; fgc[i] = px[i * 4 + 1] * k; fb[i] = px[i * 4 + 2] * k; }
  const R = 18, bw = blurA(fw, mw, mh, R), br = blurA(fr, mw, mh, R), bg2 = blurA(fgc, mw, mh, R), bb = blurA(fb, mw, mh, R);
  const farC = document.createElement("canvas"); farC.width = mw; farC.height = mh;
  const fg = farC.getContext("2d"); const fd = fg.createImageData(mw, mh);
  for (let i = 0; i < mw * mh; i++) {
    const k = near[i], w = Math.max(1e-3, bw[i]);
    const fill = [br[i] / w, bg2[i] / w, bb[i] / w];
    for (let c = 0; c < 3; c++) fd.data[i * 4 + c] = Math.round(lerp(px[i * 4 + c], bw[i] > 0.02 ? fill[c] : 200, k));
    fd.data[i * 4 + 3] = 255;
  }
  fg.putImageData(fd, 0, 0);

  // ---------- on screen ----------
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0";
  after.after(cv);
  const g = cv.getContext("2d"); g.imageSmoothingQuality = "high";
  // the frame starts with the sign whole on the left and the tree filling the rest, then pushes in
  // toward the blossoms (away from the sign, after it has been read)
  const FRAME_W = ph * (W / H); // the photo's full height in the frame
  const C0 = [FRAME_W / 2 + 30, ph / 2], C1 = [pw * 0.56, ph * 0.42];
  function draw(u, alpha) {
    cv.style.opacity = String(alpha);
    if (alpha <= 0.001) return;
    g.clearRect(0, 0, W, H);
    const e = inOutSine(clamp(u / 0.85));
    const cx = lerp(C0[0], C1[0], smooth(clamp((u - 0.25) / 0.6))), cy = lerp(C0[1], C1[1], e);
    const layer = (c, zoom) => {
      const s = (H / ph) * zoom; // screen px per photo px
      g.drawImage(c, 0, 0, mw, mh, W / 2 - cx * s, H / 2 - cy * s, pw * s, ph * s);
    };
    layer(farC, lerp(1.0, 1.07, e));
    layer(nearC, lerp(1.0, 1.16, e));
    // a soft navy edge, as on every shot, so the caption and Dr. Smiley sit on it
    const vg = g.createLinearGradient(0, 0, 0, H * 0.32);
    vg.addColorStop(0, "rgba(3,6,26,0.35)"); vg.addColorStop(1, "rgba(3,6,26,0)");
    g.fillStyle = vg; g.fillRect(0, 0, W, H * 0.32);
  }
  return { draw };
}
