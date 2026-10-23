// Dr. Smiley's real brain on "Ask Dr. Smiley." (Jose, 2026-10-22): the HUMC Brain from the app,
// captured from its own page (tools/capture-brain.cjs: brain/index.html and data.json, the
// page's clock stepped, a steady turn). As he rises out of the screen his head glows, the brain
// lifts out of it as a hologram into the middle of the frame, turns, and folds back into his head
// as his briefing card flies out. The frames are on black; here black becomes see-through (alpha
// = the brightest channel), so only the glow is laid over the reel.
import { clamp, lerp, prog, outBack, inOutCubic, outCubic } from "../util.js";

const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

export async function createHologram(after, W, H) {
  const meta = await fetch("assets/brain/frames.json").then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const frames = [];
  if (meta) for (const f of meta.frames) {
    const im = await loadImg(`assets/brain/${f}`);
    // crop to the brain and its two names (the page's stage is taller than the brain)
    const sx = Math.round(im.width * 0.04), cw = Math.round(im.width * 0.92), sy = Math.round(im.height * 0.12), ch = Math.round(im.height * 0.68), c = document.createElement("canvas");
    c.width = Math.round(cw / 2); c.height = Math.round(ch / 2); // half size: plenty for a hologram, light to hold
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(im, sx, sy, cw, ch, 0, 0, c.width, c.height);
    const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      const a = Math.max(p[i], p[i + 1], p[i + 2]);
      if (a < 10) { p[i + 3] = 0; continue; } // the page's faint edge marks and the black go
      p[i] = Math.min(255, (p[i] * 255) / a); p[i + 1] = Math.min(255, (p[i + 1] * 255) / a); p[i + 2] = Math.min(255, (p[i + 2] * 255) / a); p[i + 3] = a;
    }
    g.putImageData(d, 0, 0);
    frames.push(c);
  }
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
  after.after(cv);
  const g = cv.getContext("2d"); g.imageSmoothingQuality = "high";
  // its place out front: the band the proof cards use, under the caption, above his head
  const TOP = H * 0.25, BOTTOM = H * 0.64;
  /* u: seconds into the Ask shot; head: where his head is on screen {x, y, r} */
  function draw(u, head) {
    g.clearRect(0, 0, W, H);
    if (!frames.length || !head) return;
    const up = prog(u, 0.85, 1.15), down = prog(u, 1.55, 1.82);
    const k = outBack(up, 1.2) * (1 - inOutCubic(down)); // 0 in his head, 1 out front
    if (k <= 0.002 && up <= 0) return;
    const fade = Math.min(1, up * 3) * (1 - Math.max(0, down - 0.7) / 0.3);
    if (fade <= 0.002) return;
    const fr = frames[0], aspect = fr.width / fr.height;
    let h = BOTTOM - TOP, w = h * aspect;
    if (w > W * 0.96) { w = W * 0.96; h = w / aspect; }
    const big = { x: W / 2, y: (TOP + BOTTOM) / 2, w, h };
    const small = { x: head.x, y: head.y, w: head.r * 2.2, h: (head.r * 2.2) / aspect };
    const r = { x: lerp(small.x, big.x, k), y: lerp(small.y, big.y, k), w: lerp(small.w, big.w, k), h: lerp(small.h, big.h, k) };
    // the scene dims a little behind it, so the glow carries
    g.fillStyle = `rgba(3,6,26,${0.45 * clamp(k)})`; g.fillRect(0, 0, W, H);
    // a beam of light from his head to it
    if (k > 0.05) {
      const bg = g.createLinearGradient(head.x, head.y, r.x, r.y);
      bg.addColorStop(0, `rgba(120,215,255,${0.35 * fade})`); bg.addColorStop(1, "rgba(120,215,255,0)");
      g.fillStyle = bg; g.beginPath();
      g.moveTo(head.x - head.r * 0.5, head.y); g.lineTo(r.x - r.w * 0.32, r.y + r.h * 0.2); g.lineTo(r.x + r.w * 0.32, r.y + r.h * 0.2); g.lineTo(head.x + head.r * 0.5, head.y); g.fill();
    }
    // the turning brain: the captured frames at 30 fps, blended between them
    const f = clamp((u - 0.8) * 30, 0, frames.length - 1), a = Math.floor(f), b = Math.min(frames.length - 1, a + 1), m = f - a;
    g.globalAlpha = fade * (1 - m); g.drawImage(frames[a], r.x - r.w / 2, r.y - r.h / 2, r.w, r.h);
    g.globalAlpha = fade * m; g.drawImage(frames[b], r.x - r.w / 2, r.y - r.h / 2, r.w, r.h);
    // a faint hologram flicker: scan lines
    g.globalAlpha = 0.08 * fade; g.fillStyle = "#03061a";
    for (let y = r.y - r.h / 2; y < r.y + r.h / 2; y += 4) g.fillRect(r.x - r.w / 2, y, r.w, 1.5);
    g.globalAlpha = 1;
  }
  return { draw };
}
