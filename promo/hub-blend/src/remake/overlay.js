// Dr. Smiley on top of the picture (Jose's notes on the 44.5 s draft: his face went
// teal under the screen light, the rounded 3D body blurred and warped his drawing,
// he sank into screens and sat on the proof items). Here he is his flat drawn art,
// unlit and always crisp, drawn on a canvas over the 3D render: no light, depth of
// field, bloom or motion blur reaches him. His size is a fixed share of the frame
// height; the director (main.js) chooses where he stands so he never covers a
// shot's proof item, and checks it every frame.
import { loadSmileyArt, composeSmiley, BROWS } from "../smiley.js";
import { rng } from "../util.js";

export const SMILEY_SHARE = 0.25; // of the frame height (Jose: "about 25%")
// his head only glows now; the brain itself is the app's real one, lifted out as a hologram (hologram.js)
const DRAWN_BRAIN = false;

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

  /* His AI brain (Jose, 2026-10-22; the Ask shot): his hair turns to tinted glass and inside it a
     brain drawn in light, two hemispheres of nodes joined to their nearest neighbours, pulses
     running along the links. In his own 480 x 600 drawing: the cranium under the hair is about
     x 70-410, y 20-200. Built once, the same every render. */
  const BRAIN = (() => {
    const r = rng(11), HEMI = [-1, 1].map((sd) => ({ cx: 240 + sd * 78, cy: 112, rx: 80, ry: 86, sd }));
    // each hemisphere's outline: an oval with small lobes along it (the gyri seen from the front)
    const outline = (h) => Array.from({ length: 90 }, (_, i) => {
      const th = (i / 90) * Math.PI * 2, k = 1 + 0.045 * Math.sin(th * 11 + h.sd) + 0.02 * Math.sin(th * 23);
      let x = h.cx + Math.cos(th) * h.rx * k, y = h.cy + Math.sin(th) * h.ry * k;
      if ((x - 240) * h.sd < 6) x = 240 + h.sd * 6 + (x - 240) * 0.15; // flat along the middle
      return [x, y];
    });
    const insideH = (h, x, y) => ((x - h.cx) / h.rx) ** 2 + ((y - h.cy) / h.ry) ** 2 < 0.8 && (x - 240) * h.sd > 12;
    // the folds: wavy lines across each hemisphere
    const folds = HEMI.flatMap((h) => [-0.55, -0.2, 0.15, 0.5].map((f, n) => Array.from({ length: 24 }, (_, i) => {
      const u = i / 23, y0 = h.cy + f * h.ry, span = h.rx * Math.sqrt(Math.max(0, 1 - f * f)) * 0.86;
      return [h.cx + (u * 2 - 1) * span, y0 + Math.sin(u * Math.PI * 4 + n * 1.7 + h.sd) * 9];
    })));
    const nodes = [];
    while (nodes.length < 56) { const h = HEMI[nodes.length % 2], x = h.cx - h.rx + r() * h.rx * 2, y = h.cy - h.ry + r() * h.ry * 2; if (insideH(h, x, y)) nodes.push([x, y, r(), h.sd]); }
    const edges = [];
    nodes.forEach((a, i) => nodes.map((c, j) => [j, (a[0] - c[0]) ** 2 + (a[1] - c[1]) ** 2]).filter(([j]) => j !== i && nodes[j][3] === a[3])
      .sort((p, q) => p[1] - q[1]).slice(0, 2).forEach(([j]) => edges.push([i, j, r()])));
    return { HEMI, outlines: HEMI.map(outline), folds, nodes, edges };
  })();
  const hairMask = (() => { // his hair and forehead above the brows, as a mask for the glass tint
    const m = document.createElement("canvas"); m.width = 480; m.height = 600;
    const mg = m.getContext("2d");
    mg.drawImage(art.base, 0, 0);
    mg.globalCompositeOperation = "destination-in";
    const gr = mg.createLinearGradient(0, 150, 0, 215);
    gr.addColorStop(0, "#000"); gr.addColorStop(1, "rgba(0,0,0,0)");
    mg.fillStyle = gr; mg.fillRect(0, 0, 480, 600);
    return m;
  })();
  const brainLayer = document.createElement("canvas"); brainLayer.width = 480; brainLayer.height = 600;
  const bg = brainLayer.getContext("2d");
  function drawBrain(b, time) {
    bg.clearRect(0, 0, 480, 600);
    // the glass: his hair tinted deep blue-cyan, still his shape
    bg.globalCompositeOperation = "source-over";
    bg.globalAlpha = 0.82 * b;
    bg.drawImage(hairMask, 0, 0);
    bg.globalCompositeOperation = "source-in";
    const tg = bg.createLinearGradient(0, 0, 0, 210);
    tg.addColorStop(0, "#0b1f5c"); tg.addColorStop(1, "#123a7a");
    bg.fillStyle = tg; bg.fillRect(0, 0, 480, 600);
    // the brain, in light: each hemisphere glowing from inside, its lobed outline and folds, a
    // network across it with pulses running along the links
    bg.globalCompositeOperation = "lighter";
    bg.globalAlpha = 1;
    bg.lineCap = "round"; bg.lineJoin = "round";
    const { HEMI, outlines, folds, nodes, edges } = BRAIN;
    const breathe = 0.85 + 0.15 * Math.sin(time * 4);
    HEMI.forEach((h, n) => {
      const rg = bg.createRadialGradient(h.cx, h.cy, 4, h.cx, h.cy, h.rx * 1.05);
      rg.addColorStop(0, `rgba(63,198,238,${0.42 * b * breathe})`); rg.addColorStop(1, "rgba(63,198,238,0)");
      bg.fillStyle = rg;
      bg.beginPath(); outlines[n].forEach(([x, y], i) => (i ? bg.lineTo(x, y) : bg.moveTo(x, y))); bg.closePath(); bg.fill();
    });
    if (!DRAWN_BRAIN) { bg.shadowBlur = 0; bg.globalAlpha = 1; bg.globalCompositeOperation = "destination-in"; bg.drawImage(art.base, 0, 0); bg.globalCompositeOperation = "source-over"; return brainLayer; }
    bg.shadowColor = "#3fc6ee"; bg.shadowBlur = 16;
    bg.strokeStyle = `rgba(170,235,255,${0.95 * b})`; bg.lineWidth = 4;
    for (const o of outlines) { bg.beginPath(); o.forEach(([x, y], i) => (i ? bg.lineTo(x, y) : bg.moveTo(x, y))); bg.closePath(); bg.stroke(); }
    bg.strokeStyle = `rgba(120,215,245,${0.6 * b})`; bg.lineWidth = 2.6;
    for (const f of folds) { bg.beginPath(); f.forEach(([x, y], i) => (i ? bg.lineTo(x, y) : bg.moveTo(x, y))); bg.stroke(); }
    bg.shadowBlur = 10;
    for (const [i, j, ph] of edges) {
      const a = nodes[i], c = nodes[j];
      bg.strokeStyle = `rgba(110,215,245,${0.35 * b})`; bg.lineWidth = 1.6;
      bg.beginPath(); bg.moveTo(a[0], a[1]); bg.lineTo(c[0], c[1]); bg.stroke();
      const p = (time * 1.4 + ph * 3) % 1;
      bg.fillStyle = `rgba(235,252,255,${b})`;
      bg.beginPath(); bg.arc(a[0] + (c[0] - a[0]) * p, a[1] + (c[1] - a[1]) * p, 3.6, 0, Math.PI * 2); bg.fill();
    }
    for (const [x, y, ph] of nodes) {
      bg.fillStyle = `rgba(160,235,255,${b * (0.55 + 0.45 * Math.sin(time * 6 + ph * 20))})`;
      bg.beginPath(); bg.arc(x, y, 4, 0, Math.PI * 2); bg.fill();
    }
    // all of it inside his head's outline
    bg.shadowBlur = 0; bg.globalAlpha = 1;
    bg.globalCompositeOperation = "destination-in"; bg.drawImage(art.base, 0, 0);
    bg.globalCompositeOperation = "source-over";
    return brainLayer;
  }
  let box = null;

  /* s: { x, base: his feet in px, face, brows, squash (1 = as drawn), lean (deg),
     lift (px he is off the ground), rise (0..1, out of a screen: only the part above
     the base line shows), smear (px of motion, for a light trail), opacity,
     brain (0..1, his AI brain showing), time (s, for its pulses) } */
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
      if (s.brain > 0.003 && alpha > 0.5) g.drawImage(drawBrain(s.brain, s.time || 0), -w / 2, -h, w, h);
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
