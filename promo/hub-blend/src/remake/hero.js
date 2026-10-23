// The proof, readable (step 7, 2026-10-21): at the desk the phone is small in the frame, so its
// proof item could not be read at phone size (the brief's rule: readable with the frame 360 px
// wide). Like v11, the proof flies off the phone toward the camera, about 86% of the frame wide,
// cyan outline, the scene dimmed behind it; it holds, then settles back onto the phone before
// Dr. Smiley hops. Drawn flat on a canvas over the 3D (so the lens blur never touches it), under
// the captions. A pure function of time like the rest of the reel.
import { clamp, lerp, outBack, inOutCubic } from "../util.js";

export function createHero(after, W, H) {
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
  after.after(cv);
  const g = cv.getContext("2d");
  g.imageSmoothingQuality = "high";
  // the band it may use: under the captions, above Dr. Smiley's head at the top of his hop
  const TOP = H * 0.245, BOTTOM = H * 0.635, MAXW = W * 0.86;
  let box = null;
  function target(art) {
    const a = art.sw / art.sh;
    let w = MAXW, h = w / a;
    if (h > BOTTOM - TOP) { h = BOTTOM - TOP; w = h * a; }
    return { x: (W - w) / 2, y: (TOP + BOTTOM) / 2 - h / 2, w, h };
  }
  // k: 0 on the phone (from = its rect on screen), 1 out front; art: the proof layer's picture and
  // the element's rect inside it (the capture has a margin around it), and optionally the next
  // picture mixed in (art.next, art.mix: frames of the 3D Body coming apart). art2/mix2: what it
  // turns into (the body into its Heart card), its size and picture blending over
  const pic = (a, r, alpha) => {
    if (alpha <= 0.003) return;
    g.globalAlpha = alpha;
    g.drawImage(a.img, a.sx, a.sy, a.sw, a.sh, r.x, r.y, r.w, r.h);
    if (a.next && a.mix > 0.003) { g.globalAlpha = alpha * a.mix; g.drawImage(a.next, a.sx, a.sy, a.sw, a.sh, r.x, r.y, r.w, r.h); }
    g.globalAlpha = 1;
  };
  function draw(art, from, k, art2 = null, mix2 = 0) {
    g.clearRect(0, 0, W, H);
    box = null;
    if (!art || !from || k <= 0.001) return;
    const t1 = target(art), t2 = art2 ? target(art2) : t1, m2 = inOutCubic(clamp(mix2));
    const to = { x: lerp(t1.x, t2.x, m2), y: lerp(t1.y, t2.y, m2), w: lerp(t1.w, t2.w, m2), h: lerp(t1.h, t2.h, m2) };
    const e = outBack(clamp(k), 1.3), f = clamp(k);
    const r = { x: lerp(from.x, to.x, e), y: lerp(from.y, to.y, e), w: lerp(from.w, to.w, e), h: lerp(from.h, to.h, e) };
    g.fillStyle = `rgba(3,6,26,${0.5 * inOutCubic(f)})`;
    g.fillRect(0, 0, W, H);
    const rad = Math.min(r.w, r.h) * 0.06;
    g.save();
    g.shadowColor = "rgba(3,6,26,0.7)"; g.shadowBlur = W * 0.06; g.shadowOffsetY = W * 0.02;
    g.fillStyle = "#fff"; g.beginPath(); g.roundRect(r.x, r.y, r.w, r.h, rad); g.fill();
    g.restore();
    g.save(); g.beginPath(); g.roundRect(r.x, r.y, r.w, r.h, rad); g.clip();
    pic(art, r, art2 ? 1 - m2 : 1);
    if (art2) pic(art2, r, m2);
    g.restore();
    // v11's cyan outline
    g.save();
    g.strokeStyle = "#3fc6ee"; g.lineWidth = Math.max(2, W * 0.007); g.shadowColor = "#3fc6ee"; g.shadowBlur = W * 0.03;
    const p = g.lineWidth * 1.4;
    g.beginPath(); g.roundRect(r.x - p, r.y - p, r.w + 2 * p, r.h + 2 * p, rad + p); g.stroke();
    g.restore();
    box = { x: r.x - p, y: r.y - p, w: r.w + 2 * p, h: r.h + 2 * p };
  }
  return { draw, box: () => box };
}
