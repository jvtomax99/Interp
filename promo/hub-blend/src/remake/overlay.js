// Dr. Smiley on top of the picture (Jose's notes on the 44.5 s draft: his face went
// teal under the screen light, the rounded 3D body blurred and warped his drawing,
// he sank into screens and sat on the proof items). Here he is his flat drawn art,
// unlit and always crisp, drawn on a canvas over the 3D render: no light, depth of
// field, bloom or motion blur reaches him. His size is a fixed share of the frame
// height; the director (main.js) chooses where he stands so he never covers a
// shot's proof item, and checks it every frame.
import { loadSmileyArt, composeSmiley, BROWS } from "../smiley.js";

export const SMILEY_SHARE = 0.25; // of the frame height (Jose: "about 25%")

export async function createOverlay(root, W, H) {
  const art = await loadSmileyArt("assets/drsmiley/");
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  c.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none";
  root.appendChild(c);
  const g = c.getContext("2d");
  // his whole picture per expression (base, face frame, brows), drawn once each
  const cache = new Map();
  const picture = (frame, brows) => {
    const b = Array.isArray(brows) ? brows : BROWS[brows || "rest"] || BROWS.rest;
    const key = frame + "|" + b.join(",");
    if (!cache.has(key)) {
      const pc = document.createElement("canvas"); pc.width = 480; pc.height = 600;
      composeSmiley(pc.getContext("2d"), art, frame, b);
      cache.set(key, pc);
    }
    return cache.get(key);
  };
  const HT = Math.round(H * SMILEY_SHARE), WD = Math.round((HT * 480) / 600);
  let box = null;

  /* s: { x, base: his feet in px, face, brows, squash (1 = as drawn), lean (deg),
     lift (px he is off the ground), rise (0..1, out of a screen: only the part above
     the base line shows), smear (px of motion, for a light trail), opacity } */
  function draw(s) {
    g.clearRect(0, 0, W, H);
    box = null;
    if (!s) return;
    const sq = s.squash ?? 1, w = WD / Math.sqrt(sq), h = HT * sq, lift = s.lift || 0;
    const pic = picture(s.face || "rest", s.brows || "rest");
    // a soft shadow on the ground, smaller as he rises
    const air = Math.min(1, Math.max(0, lift) / (HT * 0.6));
    if (s.rise == null || s.rise >= 1) {
      g.save();
      g.globalAlpha = (s.opacity ?? 1) * (0.45 - 0.3 * air);
      const rg = g.createRadialGradient(s.x, s.base, 2, s.x, s.base, w * 0.5);
      rg.addColorStop(0, "rgba(6,12,36,0.9)"); rg.addColorStop(1, "rgba(6,12,36,0)");
      g.fillStyle = rg;
      g.beginPath(); g.ellipse(s.x, s.base, w * 0.5 * (1 - 0.4 * air), w * 0.12 * (1 - 0.4 * air), 0, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    const drawAt = (dy, alpha) => {
      g.save();
      g.globalAlpha = alpha;
      if (s.rise != null && s.rise < 1) { g.beginPath(); g.rect(0, 0, W, s.base); g.clip(); } // rising out of a screen
      g.translate(s.x, s.base - lift + dy + (s.rise != null && s.rise < 1 ? (1 - s.rise) * h : 0));
      g.rotate(((s.lean || 0) * Math.PI) / 180);
      g.drawImage(pic, -w / 2, -h, w, h);
      g.restore();
    };
    const op = s.opacity ?? 1;
    // a light trail behind fast motion; the picture itself stays sharp
    if (s.smear) for (const k of [0.66, 0.33]) drawAt(s.smear * k, op * 0.18);
    drawAt(0, op);
    const top = s.base - lift - h + (s.rise != null && s.rise < 1 ? (1 - s.rise) * h : 0);
    box = { x: s.x - w / 2, y: Math.max(0, top), w, h: Math.min(s.base, s.base - lift) - Math.max(0, top) };
  }
  return { draw, size: { w: WD, h: HT }, box: () => box };
}
