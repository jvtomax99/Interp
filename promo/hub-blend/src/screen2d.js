// Laptop screen content for the blend (acts 2-4), Canvas 2D, pure function of time.
import { C, COPY, T } from "./config.js";
import { clamp, lerp, prog, outExpo, inExpo, outCubic, inOutCubic, outBack, roundRect } from "./util.js";

export const SW = 1280;
export const SH = 800;
const CX = SW / 2, CY = SH / 2;
const F = {
  sans: (w, px) => `${w} ${px}px "Inter Tight"`,
  serif: (px) => `italic 400 ${px}px "Instrument Serif"`,
  mono: (w, px) => `${w} ${px}px "JetBrains Mono"`,
};

let ICON = null;
export function setIcon(img) { ICON = img; }
let PHOTOS = {};
export function setPhotos(p) { PHOTOS = p; }

const [F1, F2, F3, F4, F5] = T.features;
export const SCENES = [
  { id: "off", start: 0, end: T.logoEnd },
  { id: "power", start: T.logoEnd, end: F1, ink: "light", idx: 0, label: "INTERPRETER HUB" },
  { id: "cubes", start: F1, end: F2, ink: "light", idx: 1, label: "GLOSSARY", cube: true },
  { id: "translate", start: F2, end: F3, ink: "light", idx: 2, label: "TRANSLATE" },
  { id: "false", start: F3, end: F4, ink: "light", idx: 3, label: "FALSE FRIENDS" },
  { id: "cert", start: F4, end: F5, ink: "dark", idx: 4, label: "CORECHI PREP" },
  { id: "ask", start: F5, end: T.featEnd, ink: "light", idx: 5, label: "ASK DR. SMILEY" },
  { id: "blob", start: T.featEnd, end: T.morphEnd, ink: "light", idx: 6, label: "MORPH" },
  { id: "end", start: T.morphEnd, end: 99, ink: "light", idx: 7, label: "END CARD" },
];
export function sceneAt(t) {
  for (const s of SCENES) if (t >= s.start && t < s.end) return s;
  return SCENES[SCENES.length - 1];
}

function navyBg(ctx, glowX = CX, glowY = CY) {
  const g = ctx.createRadialGradient(glowX, glowY, 30, CX, CY, SW * 0.75);
  g.addColorStop(0, C.navy2);
  g.addColorStop(1, C.navy0);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SW, SH);
}
function dotGrid(ctx, color, step = 40) {
  ctx.fillStyle = color;
  for (let y = step / 2; y < SH; y += step) for (let x = step / 2; x < SW; x += step) ctx.fillRect(x - 1, y - 1, 2, 2);
}
function timecode(t) {
  const f = Math.floor(t * 30);
  return `00:00:${String(Math.floor(f / 30) % 60).padStart(2, "0")}:${String(f % 30).padStart(2, "0")}`;
}
function hud(ctx, s, t) {
  if (!s.ink) return;
  const col = s.ink === "light" ? "rgba(255,255,255,0.6)" : "rgba(10,20,60,0.6)";
  ctx.save();
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.5;
  const m = 18, k = 14;
  for (const [x, y, dx, dy] of [[m, m, 1, 1], [SW - m, m, -1, 1], [m, SH - m, 1, -1], [SW - m, SH - m, -1, -1]]) {
    ctx.beginPath(); ctx.moveTo(x, y + dy * k); ctx.lineTo(x, y); ctx.lineTo(x + dx * k, y); ctx.stroke();
  }
  ctx.font = F.mono(500, 13); ctx.textBaseline = "middle";
  ctx.fillStyle = C.cyan; ctx.beginPath(); ctx.arc(46, 42, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = col; ctx.textAlign = "left";
  ctx.fillText(COPY.hudLeft, 58, 42);
  ctx.fillText(`${String(s.idx).padStart(2, "0")} / ${s.label}`, 40, SH - 38);
  ctx.textAlign = "right";
  ctx.fillText(`${String(s.idx).padStart(2, "0")} / 07`, SW - 40, 42);
  ctx.fillText(timecode(t), SW - 40, SH - 38);
  ctx.restore();
}
function letters(ctx, text, font, x, y, tracking, fn) {
  ctx.font = font;
  const baseA = ctx.globalAlpha;
  let cx = x, i = 0;
  for (const ch of text) {
    const w = ctx.measureText(ch).width;
    const { dy = 0, a = 1 } = fn(i);
    ctx.globalAlpha = baseA * a;
    ctx.fillText(ch, cx, y + dy);
    cx += w + tracking; i++;
  }
  ctx.globalAlpha = baseA;
}
function textW(ctx, text, font, tracking) {
  ctx.font = font;
  let w = 0, n = 0;
  for (const ch of text) { w += ctx.measureText(ch).width; n++; }
  return w + tracking * (n - 1);
}
function drawIcon(ctx, x, y, r, a = 1) {
  if (!ICON) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.shadowColor = C.cyan; ctx.shadowBlur = 30;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = "#dbeaf7"; ctx.fill();
  ctx.shadowBlur = 0;
  ctx.drawImage(ICON, x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

// ---- scenes ----
function sOff(ctx) {
  ctx.fillStyle = "#040507";
  ctx.fillRect(0, 0, SW, SH);
}

function sPower(ctx, lt) {
  navyBg(ctx);
  dotGrid(ctx, "rgba(140,180,255,0.10)");
  const ip = outBack(prog(lt, 0.08, 0.45));
  drawIcon(ctx, CX, CY - 110, 74 * ip);
  ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  const font = F.sans(800, 104);
  const w = textW(ctx, COPY.laptopTitle, font, -3);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, CY - 30, SW, 140); ctx.clip();
  letters(ctx, COPY.laptopTitle, font, CX - w / 2, CY + 80, -3, (i) => ({ dy: (1 - outExpo(prog(lt, 0.2 + i * 0.025, 0.65 + i * 0.025))) * 120 }));
  ctx.restore();
  ctx.globalAlpha = outCubic(prog(lt, 0.6, 0.9));
  ctx.font = F.mono(500, 20); ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.letterSpacing = "4px";
  ctx.fillText(COPY.laptopSub.toUpperCase(), CX, CY + 140);
  ctx.letterSpacing = "0px";
  ctx.globalAlpha = 1;
  // power-on flash
  const fl = 1 - prog(lt, 0, 0.12);
  if (fl > 0) { ctx.fillStyle = `rgba(220,240,255,${fl})`; ctx.fillRect(0, 0, SW, SH); }
}

function sCubesBg(ctx) {
  const g = ctx.createRadialGradient(CX, CY * 0.9, 20, CX, CY, SW * 0.75);
  g.addColorStop(0, "#12245e"); g.addColorStop(1, "#02040f");
  ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
}

function sTranslate(ctx, lt) {
  navyBg(ctx, 300, 300);
  dotGrid(ctx, "rgba(140,180,255,0.08)");
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.font = F.mono(500, 16); ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.letterSpacing = "3px";
  ctx.fillText("ENGLISH", 120, 230);
  ctx.fillText("ESPAÑOL · GLOSSARY", 120, 470);
  ctx.letterSpacing = "0px";
  const src = "heart failure";
  const n = Math.floor(src.length * prog(lt, 0.1, 0.55));
  ctx.font = F.sans(800, 92); ctx.fillStyle = "#fff";
  ctx.fillText(src.slice(0, n), 112, 330);
  if (lt < 0.6 && Math.floor(lt * 6) % 2 === 0) {
    const w = ctx.measureText(src.slice(0, n)).width;
    ctx.fillRect(118 + w, 255, 5, 88);
  }
  // arrow
  const ap = outExpo(prog(lt, 0.6, 0.85));
  ctx.strokeStyle = C.cyan; ctx.lineWidth = 5; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(130, 380); ctx.lineTo(130, 380 + 40 * ap); ctx.stroke();
  // result
  const rp = outExpo(prog(lt, 0.8, 1.15));
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 480, SW, 140); ctx.clip();
  ctx.font = F.sans(800, 92); ctx.fillStyle = C.cyan;
  ctx.shadowColor = C.cyan; ctx.shadowBlur = 24 * rp;
  ctx.fillText("insuficiencia cardíaca", 112, 590 + (1 - rp) * 120);
  ctx.restore();
  // badges
  const bp = outBack(prog(lt, 1.2, 1.45));
  if (bp > 0) {
    ctx.save(); ctx.translate(120, 650); ctx.scale(bp, bp);
    ctx.fillStyle = C.cyan; roundRect(ctx, 0, 0, 230, 46, 23); ctx.fill();
    ctx.fillStyle = C.cyanDeep; ctx.font = F.mono(500, 16); ctx.fillText("GLOSSARY ✓", 22, 30);
    ctx.fillStyle = "rgba(255,255,255,0.14)"; roundRect(ctx, 250, 0, 230, 46, 23); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fillText("AI · SECOND", 274, 30);
    ctx.restore();
  }
}

function sFalse(ctx, lt) {
  ctx.fillStyle = "#0a0410";
  ctx.fillRect(0, 0, SW, SH);
  const g = ctx.createRadialGradient(CX, CY, 20, CX, CY, SW * 0.6);
  g.addColorStop(0, "rgba(240,67,106,0.28)"); g.addColorStop(1, "rgba(240,67,106,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  const p1 = outExpo(prog(lt, 0.05, 0.4));
  ctx.font = F.sans(800, 128);
  ctx.fillStyle = "#fff";
  ctx.globalAlpha = p1;
  ctx.fillText("constipado", CX, 330 + (1 - p1) * 60);
  ctx.globalAlpha = 1;
  // not-equal + english
  const p2 = outExpo(prog(lt, 0.45, 0.75));
  ctx.globalAlpha = p2;
  ctx.font = F.sans(500, 64); ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText("≠ constipated", CX, 450);
  const sp = outExpo(prog(lt, 0.75, 0.95));
  if (sp > 0) {
    const w = ctx.measureText("≠ constipated").width;
    ctx.strokeStyle = C.red; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.shadowColor = C.red; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.moveTo(CX - w / 2, 430); ctx.lineTo(CX - w / 2 + w * sp, 426); ctx.stroke();
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;
  // flag pill
  const fp = outBack(prog(lt, 1.0, 1.3));
  if (fp > 0) {
    ctx.save(); ctx.translate(CX, 560); ctx.scale(fp, fp); ctx.rotate(-0.04);
    ctx.fillStyle = C.red; ctx.shadowColor = C.red; ctx.shadowBlur = 26;
    roundRect(ctx, -210, -42, 420, 84, 42); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff"; ctx.font = F.sans(800, 44); ctx.textBaseline = "middle";
    ctx.fillText("= a cold. Flagged.", 0, 2);
    ctx.restore();
  }
}

const BARS = Array.from({ length: 12 }, (_, i) => 60 + i * 22 + ((i * 7) % 3) * 20 + (i === 11 ? 50 : 0));
function sCert(ctx, lt) {
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, SW, SH);
  ctx.strokeStyle = "rgba(10,20,60,0.05)"; ctx.lineWidth = 1;
  for (let y = 80; y < SH; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SW, y); ctx.stroke(); }
  const en = outExpo(prog(lt, 0, 0.3));
  ctx.save(); ctx.globalAlpha = en; ctx.translate(0, (1 - en) * 30);
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.font = F.mono(500, 15); ctx.fillStyle = "rgba(10,20,60,0.55)";
  ctx.fillText("CORECHI PRACTICE · QUESTIONS", 104, 130);
  const v = Math.round(145 * outCubic(prog(lt, 0.1, 1.1)));
  ctx.font = F.sans(800, 150); ctx.fillStyle = C.cyanDeep;
  ctx.fillText(String(v), 96, 275);
  // donut readiness
  const dp = outCubic(prog(lt, 0.3, 1.3));
  const dx = 215, dy = 520, r = 92;
  ctx.lineCap = "round"; ctx.lineWidth = 18;
  ctx.strokeStyle = "#d3dae6"; ctx.beginPath(); ctx.arc(dx, dy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "#1aa6d6"; ctx.beginPath(); ctx.arc(dx, dy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.82 * Math.max(0.001, dp)); ctx.stroke();
  ctx.fillStyle = C.cyanDeep; ctx.textAlign = "center"; ctx.font = F.sans(800, 40);
  ctx.fillText(`${Math.round(82 * dp)}%`, dx, dy + 14);
  ctx.textAlign = "left"; ctx.font = F.mono(500, 14); ctx.fillStyle = "rgba(10,20,60,0.55)";
  ctx.fillText("EXAM", dx + r + 34, dy - 6); ctx.fillText("READINESS", dx + r + 34, dy + 16);
  const bx0 = 600, base = 660, bw = 34, gap = 21;
  for (let i = 0; i < 12; i++) {
    const p = outExpo(prog(lt, 0.22 + i * 0.045, 0.85 + i * 0.045));
    ctx.fillStyle = i === 11 ? "#1aa6d6" : C.cyanDeep;
    ctx.fillRect(bx0 + i * (bw + gap), base - BARS[i] * p, bw, BARS[i] * p);
  }
  ctx.fillStyle = "rgba(10,20,60,0.25)"; ctx.fillRect(bx0 - 10, base, 12 * (bw + gap), 1.5);
  ctx.restore();
}

function bubble(ctx, x, y, w, text, me, p, font) {
  if (p <= 0) return;
  ctx.save();
  ctx.globalAlpha = p;
  ctx.translate(0, (1 - p) * 20);
  ctx.font = font;
  const h = 70;
  ctx.fillStyle = me ? "#2152d9" : "rgba(255,255,255,0.95)";
  roundRect(ctx, x, y, w, h, 22); ctx.fill();
  ctx.fillStyle = me ? "#fff" : C.cyanDeep;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + 28, y + h / 2 + 2);
  ctx.restore();
}
function sAsk(ctx, lt) {
  navyBg(ctx, 900, 200);
  dotGrid(ctx, "rgba(140,180,255,0.08)");
  const f = F.sans(500, 30);
  ctx.textAlign = "left";
  bubble(ctx, 520, 170, 620, "I'm covering oncology. Prep me.", true, outExpo(prog(lt, 0.05, 0.35)), f);
  // typing dots
  const typing = lt > 0.4 && lt < 0.85;
  if (typing) {
    ctx.fillStyle = "rgba(255,255,255,0.9)"; roundRect(ctx, 140, 290, 120, 60, 24); ctx.fill();
    for (let k = 0; k < 3; k++) {
      const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(lt * 18 - k * 1.2));
      ctx.fillStyle = `rgba(11,26,74,${a})`; ctx.beginPath(); ctx.arc(172 + k * 28, 320, 7, 0, Math.PI * 2); ctx.fill();
    }
  }
  bubble(ctx, 140, 290, 700, "Tu repaso de Oncology está listo.", false, outExpo(prog(lt, 0.85, 1.1)), F.sans(800, 30));
  const items = ["10 words to have ready", "Traps: constipado, intoxicado", "Start the appointment timer"];
  items.forEach((s, i) => {
    const p = outExpo(prog(lt, 1.05 + i * 0.12, 1.35 + i * 0.12));
    if (p <= 0) return;
    ctx.globalAlpha = p;
    ctx.strokeStyle = C.cyan; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(176, 420 + i * 62, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.font = F.sans(500, 28); ctx.textBaseline = "middle";
    ctx.fillText(s, 204, 421 + i * 62 + (1 - p) * 10);
    ctx.globalAlpha = 1;
  });
}

// metaballs
const MB_W = 640, MB_H = 400;
let mb = null;
function metaballs(ctx, balls, rgb) {
  if (!mb) { const c = document.createElement("canvas"); c.width = MB_W; c.height = MB_H; const x = c.getContext("2d"); mb = { c, x, img: x.createImageData(MB_W, MB_H) }; }
  const d = mb.img.data, sx = SW / MB_W;
  const bs = balls.map((b) => [b.x / sx, b.y / sx, (b.r / sx) ** 2]);
  for (let y = 0; y < MB_H; y++) for (let x = 0; x < MB_W; x++) {
    let f = 0;
    for (const b of bs) { const dx = x - b[0], dy = y - b[1]; f += b[2] / (dx * dx + dy * dy + 1e-4); }
    const i = (y * MB_W + x) * 4, a = clamp((f - 0.9) / 0.2);
    d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = a * 255;
  }
  mb.x.putImageData(mb.img, 0, 0);
  ctx.drawImage(mb.c, 0, 0, SW, SH);
}
function sBlob(ctx, lt) {
  navyBg(ctx);
  const appear = outBack(prog(lt, 0, 0.2));
  const inward = inOutCubic(prog(lt, 0.25, 0.6));
  const collapse = inExpo(prog(lt, 0.7, 0.95));
  const gs = (1 - collapse) * appear, rot = lt * 2;
  if (gs <= 0.002) return;
  const balls = [];
  const orbit = lerp(130, 0, inward);
  for (let k = 0; k < 6; k++) { const a = rot + k * Math.PI / 3; balls.push({ x: CX + Math.cos(a) * orbit * gs, y: CY + Math.sin(a) * orbit * gs, r: 34 * gs }); }
  balls.push({ x: CX, y: CY, r: lerp(10, 60, inward) * gs });
  ctx.save(); ctx.shadowColor = C.cyan; ctx.shadowBlur = 40;
  metaballs(ctx, balls, [63, 198, 238]);
  ctx.restore();
}

function sEnd(ctx, lt, t) {
  // "Built here.": aerial of the HUMC campus with a pulsing pin
  ctx.fillStyle = C.navy0; ctx.fillRect(0, 0, SW, SH);
  const keep = 1 - 0.85 * prog(t, T.dim, T.dim + 0.4);
  const img = PHOTOS.aerial;
  ctx.save();
  ctx.globalAlpha = keep * outCubic(prog(lt, 0, 0.25));
  if (img) {
    const z = 1.0 + 0.08 * prog(lt, 0, 3);
    const w = SW * z, h = w * (img.height / img.width);
    ctx.filter = "saturate(0.85) brightness(0.8)";
    ctx.drawImage(img, CX - w / 2, CY - h / 2 - 40, w, h);
    ctx.filter = "none";
  }
  const g = ctx.createLinearGradient(0, SH * 0.45, 0, SH);
  g.addColorStop(0, "rgba(3,6,26,0)"); g.addColorStop(1, "rgba(3,6,26,0.92)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
  ctx.fillStyle = "rgba(20,50,140,0.25)"; ctx.fillRect(0, 0, SW, SH);
  // pin
  const px = CX + 40, py = CY - 30;
  const pp = outBack(prog(lt, 0.25, 0.55));
  for (let k = 0; k < 2; k++) {
    const ph = ((lt * 1.2 + k * 0.5) % 1);
    ctx.strokeStyle = `rgba(63,198,238,${(1 - ph) * 0.8 * pp})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(px, py, 14 + ph * 70, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = C.cyan; ctx.shadowColor = C.cyan; ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.arc(px, py, 12 * pp, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  // label
  const lp = outExpo(prog(lt, 0.45, 0.85));
  ctx.globalAlpha = keep * lp;
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.font = F.mono(500, 20); ctx.letterSpacing = "4px"; ctx.fillStyle = C.cyan;
  ctx.fillText("HACKENSACK UNIVERSITY MEDICAL CENTER", 60, SH - 120 + (1 - lp) * 20);
  ctx.font = F.sans(800, 64); ctx.letterSpacing = "-1px"; ctx.fillStyle = "#fff";
  ctx.fillText("Hackensack, NJ", 56, SH - 52 + (1 - lp) * 20);
  ctx.letterSpacing = "0px";
  ctx.restore();
}

export function drawScreen(bg, fg, t) {
  const s = sceneAt(t);
  const lt = t - s.start;
  fg.clearRect(0, 0, SW, SH);
  bg.save();
  switch (s.id) {
    case "off": sOff(bg); break;
    case "power": sPower(bg, lt); break;
    case "cubes": sCubesBg(bg); break;
    case "translate": sTranslate(bg, lt); break;
    case "false": sFalse(bg, lt); break;
    case "cert": sCert(bg, lt); break;
    case "ask": sAsk(bg, lt); break;
    case "blob": sBlob(bg, lt); break;
    case "end": sEnd(bg, lt, t); break;
  }
  bg.restore();
  bg.globalAlpha = 1;
  if (s.ink) hud(fg, s, t);
  return { scene: s, lt };
}
