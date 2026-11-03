// Collectible-figure characters for the Hub (Jose, 2026-11-03): a doctor, a nurse and a visitor, anime-inspired and
// original (his reference sheet), built from code so they stay solid from every side. makeCharacter(cfg) returns a
// THREE.Group with named parts: head (eyes, brows, mouth, hair, ears), torso, arms (shoulder and elbow pivots), legs.
// Units: one head is 1.0 tall; a figure is about 2.7 heads; the feet stand on y 0.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const TAU = Math.PI*2;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a)/(b - a))); return t*t*(3 - 2*t); };

// ---------- materials, shared by colour ----------
const MATS = new Map();
function mat(kind, color, extra = {}){
  const key = kind + color + JSON.stringify(extra);
  if (MATS.has(key)) return MATS.get(key);
  const c = new THREE.Color(color), base = { color: c };
  const m = kind === 'skin'  ? new THREE.MeshPhysicalMaterial({ ...base, roughness: 0.56, sheen: 0.35, sheenRoughness: 0.7, sheenColor: c.clone().offsetHSL(0, 0, 0.12), ...extra })
          : kind === 'hair'  ? new THREE.MeshPhysicalMaterial({ ...base, roughness: 0.38, sheen: 0.8, sheenRoughness: 0.35, sheenColor: c.clone().offsetHSL(0, -0.05, 0.22), ...extra })
          : kind === 'cloth' ? new THREE.MeshPhysicalMaterial({ ...base, roughness: 0.78, sheen: 0.5, sheenRoughness: 0.8, sheenColor: c.clone().offsetHSL(0, -0.1, 0.18), ...extra })
          : kind === 'shoe'  ? new THREE.MeshPhysicalMaterial({ ...base, roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.35, ...extra })
          : kind === 'metal' ? new THREE.MeshStandardMaterial({ ...base, roughness: 0.25, metalness: 0.85, ...extra })
          : new THREE.MeshStandardMaterial({ ...base, roughness: 0.6, ...extra });
  MATS.set(key, m); return m; }
function mesh(geo, m, name){ const o = new THREE.Mesh(geo, m); o.castShadow = true; o.receiveShadow = true; if (name) o.name = name; return o; }

// ---------- the head: a sphere reshaped (rounded cheeks, a gently tapered chin, a slightly flatter face) ----------
// theta runs from the crown (0) to the chin (pi), phi round the head with 0 at the face and +pi/2 the figure's left.
const HEAD = { rx: 0.5, ry: 0.5, rz: 0.47 };
function headRaw(th, ph){
  const ct = Math.cos(th), st = Math.sin(th), sp = Math.sin(ph), cp = Math.cos(ph);
  const low = Math.max(0, -ct), front = Math.max(0, cp);
  const taper = 1 - 0.2*Math.pow(low, 2.6);                                                           // a soft, small chin
  const cheek = 0.085*Math.exp(-(((ct + 0.5)/0.28)**2))*Math.exp(-(((Math.abs(ph) - 0.85)/0.75)**2));     // full, round cheeks
  const flat = 1 - 0.1*front*front*Math.exp(-(((ct + 0.1)/0.5)**2));                                     // the face's plane
  const y = ct*HEAD.ry*(ct > 0 ? 0.96 : 1);
  return V(st*sp*HEAD.rx*taper*(1 + cheek), y, st*cp*HEAD.rz*taper*flat*(1 + cheek) + 0.018*low*low*front); }
function headNormal(th, ph){
  const e = 1e-3, a = headRaw(Math.max(1e-3, th - e), ph), b = headRaw(Math.min(Math.PI - 1e-3, th + e), ph), c = headRaw(th, ph - e), d = headRaw(th, ph + e);
  const n = V().crossVectors(b.sub(a), d.sub(c)).normalize(); const p = headRaw(th, ph);
  if (n.dot(p) < 0) n.negate(); return n; }
const headP = (th, ph, off = 0) => headRaw(th, ph).addScaledVector(headNormal(th, ph), off);

// a grid over (s, t) in [0,1]^2 mapped by f(s, t) -> Vector3, facing outward from `inside`; uv = (s, 1 - t)
function gridGeo(f, ns, nt, inside = V(0, 0, 0)){
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nt; j++) for (let i = 0; i <= ns; i++){ const s = i/ns, t = j/nt, p = f(s, t); pos.push(p.x, p.y, p.z); uv.push(s, 1 - t); }
  for (let j = 0; j < nt; j++) for (let i = 0; i < ns; i++){ const a = j*(ns + 1) + i, b = a + 1, c = a + ns + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  g.computeVertexNormals();
  // face it outward: compare one triangle's normal with the direction away from `inside`
  const P = g.attributes.position, k = Math.floor(idx.length/6)*3, A = V().fromBufferAttribute(P, idx[k]), B = V().fromBufferAttribute(P, idx[k + 1]), C = V().fromBufferAttribute(P, idx[k + 2]);
  const n = V().crossVectors(B.clone().sub(A), C.clone().sub(A));
  if (n.dot(A.clone().sub(inside)) < 0){ for (let q = 0; q < idx.length; q += 3){ const x = idx[q + 1]; idx[q + 1] = idx[q + 2]; idx[q + 2] = x; } g.setIndex(idx); g.computeVertexNormals(); }
  return g; }
const patch = (th0, th1, ph0, ph1, off, ns = 18, nt = 18) => gridGeo((s, t) => headP(th0 + (th1 - th0)*t, ph0 + (ph1 - ph0)*s, typeof off === 'function' ? off(s, t) : off), ns, nt);

// ---------- a swept, tapered lock (hair, brows, the smile, eyelids): a flattened tube along a path ----------
// pts: Vector3s; refN(i): the outward direction there (thickness goes along it); w(t), h(t): half width and half thickness
function sweep(pts, refN, w, h, seg = 10){
  const n = pts.length, pos = [], idx = [];
  for (let i = 0; i < n; i++){
    const t = i/(n - 1), T = pts[Math.min(n - 1, i + 1)].clone().sub(pts[Math.max(0, i - 1)]).normalize();
    let N = refN(i).clone(); const B = V().crossVectors(T, N).normalize(); N = V().crossVectors(B, T).normalize();
    const W = w(t), H = h(t);
    for (let k = 0; k < seg; k++){ const a = k/seg*TAU, p = pts[i].clone().addScaledVector(B, Math.cos(a)*W).addScaledVector(N, Math.sin(a)*H); pos.push(p.x, p.y, p.z); } }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < seg; k++){ const a = i*seg + k, b = i*seg + (k + 1)%seg, c = a + seg, d = b + seg; idx.push(a, b, c, b, d, c); }
  const c0 = pos.length/3; pos.push(pts[0].x, pts[0].y, pts[0].z); for (let k = 0; k < seg; k++) idx.push(c0, (k + 1)%seg, k);   // close the root
  const c1 = pos.length/3, l = pts[n - 1]; pos.push(l.x, l.y, l.z); for (let k = 0; k < seg; k++) idx.push(c1, (n - 1)*seg + k, (n - 1)*seg + (k + 1)%seg);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; }
// a path given in head coordinates [theta, phi, lift], smoothed, then laid over the head
function headPath(ctrl, n = 22){
  const curve = new THREE.CatmullRomCurve3(ctrl.map(([a, b, c]) => V(a, b, c)), false, 'centripetal');
  const params = curve.getPoints(n - 1);
  return { pts: params.map(q => headP(q.x, q.y, q.z)), nrm: params.map(q => headNormal(q.x, q.y)) }; }
// a lock of hair: broad at the root, full in the middle, tapering to a point
const lockW = (W, tipK = 1) => t => W*Math.pow(1 - t, 0.75*tipK)*(0.82 + 0.75*t*(1 - t));
function lock(ctrl, W, flat = 0.5, n = 22){ const { pts, nrm } = headPath(ctrl, n); return sweep(pts, i => nrm[i], lockW(W), t => lockW(W)(t)*flat, 12); }

// ---------- the face: eyes drawn on patches that follow the face, so they never stand out like balls ----------
const EYE = { th: 1.72, dth: 0.29, ph: 0.47, dph: 0.25 };
const TEX = new Map();
function eyeTex(iris, side, state, lash){
  const key = [iris, side, state, lash].join('|'); if (TEX.has(key)) return TEX.get(key);
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
  const out = side;   // +1: the outer corner is on the canvas's right
  const cx = 128, cy = 134, rx = 104, ry = 112;
  const shape = () => { g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); };
  if (state === 'closed'){   // a soft lash line, curving down
    g.strokeStyle = '#241a2a'; g.lineWidth = 15; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx - rx*0.82, cy + 6); g.quadraticCurveTo(cx, cy + 46, cx + rx*0.82, cy + 6); g.stroke();
  } else {
    g.save(); shape(); g.clip();
    g.fillStyle = '#fbf5e8'; g.fillRect(0, 0, S, S);                                                      // warm ivory white
    const ig = g.createRadialGradient(cx, cy + 22, 8, cx, cy + 10, 88);                                     // the iris, lighter low down
    ig.addColorStop(0, new THREE.Color(iris).offsetHSL(0, 0, 0.18).getStyle()); ig.addColorStop(0.55, iris); ig.addColorStop(1, new THREE.Color(iris).offsetHSL(0, 0, -0.22).getStyle());
    g.fillStyle = ig; g.beginPath(); g.ellipse(cx, cy + 10, 82, 98, 0, 0, TAU); g.fill();
    const top = g.createLinearGradient(0, cy - 90, 0, cy + 10); top.addColorStop(0, 'rgba(20,16,36,0.55)'); top.addColorStop(1, 'rgba(20,16,36,0)');   // shade under the lid
    g.fillStyle = top; g.fillRect(0, 0, S, S);
    g.fillStyle = '#16122a'; g.beginPath(); g.ellipse(cx, cy + 12, 36, 47, 0, 0, TAU); g.fill();         // pupil
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(cx + out*26, cy - 30, 20, 24, 0, 0, TAU); g.fill();  // highlights
    g.beginPath(); g.ellipse(cx - out*24, cy + 44, 9, 10, 0, 0, TAU); g.fill();
    if (state === 'half'){ g.fillStyle = '#00000000'; g.clearRect(0, 0, S, cy - 6); }
    g.restore();
    // the upper lid: one crescent along the top, thin at the inner corner, heavy at the outer, a flick for lashes
    const lidY = state === 'half' ? cy - 6 : null, A0 = Math.PI*1.08, A1 = Math.PI*1.92, N = 40, lidTop = [], lidBot = [];
    for (let k = 0; k <= N; k++){ const a = A0 + (A1 - A0)*k/N, q = out > 0 ? k/N : 1 - k/N, th = 6 + 16*Math.pow(q, 1.4);
      const x = cx + Math.cos(a)*rx, y = lidY === null ? cy + Math.sin(a)*ry : lidY + Math.sin(a)*rx*0.16;
      lidBot.push([x, y + 2]); lidTop.push([x, y - th]); }
    g.fillStyle = '#241a2a'; g.beginPath(); lidBot.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y));
    if (lash){ const [ex, ey] = out > 0 ? lidTop[N] : lidTop[0]; g.lineTo(ex + out*26, ey - 22); g.lineTo(ex + out*4, ey + 4); }
    lidTop.slice().reverse().forEach(([x, y]) => g.lineTo(x, y)); g.closePath(); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; TEX.set(key, t); return t; }
function blushTex(){ if (TEX.has('blush')) return TEX.get('blush');
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  r.addColorStop(0, 'rgba(255,120,130,0.55)'); r.addColorStop(1, 'rgba(255,120,130,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; TEX.set('blush', t); return t; }

// shared face geometry: every figure has the same head, so its eye, blush and lid patches are made once
const GEO = {};
function faceGeo(){
  if (GEO.face) return GEO.face;
  const f = {};
  f.head = gridGeo((s, t) => headRaw(t*Math.PI, -Math.PI + s*TAU), 96, 64);
  f.eye = [-1, 1].map(sx => patch(EYE.th - EYE.dth, EYE.th + EYE.dth, sx*EYE.ph - EYE.dph, sx*EYE.ph + EYE.dph, 0.004));
  f.blush = [-1, 1].map(sx => patch(EYE.th + 0.16, EYE.th + 0.38, sx*0.7 - 0.15, sx*0.7 + 0.15, 0.003, 8, 8));
  f.brow = [-1, 1].map(sx => { const ctrl = []; for (let k = 0; k <= 6; k++){ const u = k/6; ctrl.push([EYE.th - 0.4 - 0.055*Math.sin(Math.PI*u) + 0.03*(sx > 0 ? 1 - u : u), sx*EYE.ph + (u - 0.5)*0.4, 0.012]); }
    const { pts, nrm } = headPath(ctrl, 16); return sweep(pts, i => nrm[i], t => 0.004 + 0.02*Math.pow(Math.sin(Math.PI*Math.min(1, t*1.15)), 0.6), () => 0.008, 8); });
  { const ctrl = []; for (let k = 0; k <= 6; k++){ const u = k/6; ctrl.push([EYE.th + 0.36 + 0.05*Math.sin(Math.PI*u), (u - 0.5)*0.3, 0.004]); }
    const { pts, nrm } = headPath(ctrl, 16); f.mouth = sweep(pts, i => nrm[i], t => 0.004 + 0.009*Math.sin(Math.PI*t), () => 0.005, 8); }
  f.nose = new THREE.SphereGeometry(0.034, 16, 12); f.nose.scale(1.15, 0.85, 0.75);
  f.ear = new THREE.SphereGeometry(0.085, 20, 14); f.ear.scale(0.42, 1, 0.74);
  f.earIn = new THREE.SphereGeometry(0.05, 16, 10); f.earIn.scale(0.32, 0.78, 0.55);
  return GEO.face = f; }

// ---------- hair: a fitted cap with sculpted locks over it ----------
function hairCap(front, side, back, thick = 0.035){
  const thMax = ph => { const c = Math.cos(ph); return c >= 0 ? side + (front - side)*Math.pow(c, 1.6) : side + (back - side)*Math.pow(-c, 0.45); };   // full behind the ears, down to the nape
  return gridGeo((s, t) => { const ph = -Math.PI + s*TAU, th = t*thMax(ph); return headP(th, ph, thick*(1 - smooth(0.8, 1, t)) + 0.002); }, 72, 26); }
function hairStyle(style){
  const G = [];   // geometries
  if (style === 'swept'){   // chestnut, swept across the forehead to the figure's left
    G.push(hairCap(0.95, 1.7, 2.6));
    for (let k = 0; k < 9; k++){ const p0 = -0.95 + k*0.2, sw = 0.3 + 0.05*k;
      G.push(lock([[0.28, p0*0.5, 0.02], [0.75, p0 + sw*0.4, 0.07], [1.12, p0 + sw*0.8, 0.06], [1.3 - 0.03*Math.abs(k - 4), p0 + sw, 0.03]], 0.12 - 0.004*Math.abs(k - 4), 0.42)); }
    for (const sx of [-1, 1]) for (let k = 0; k < 3; k++){ const p = sx*(1.15 + k*0.22);   // over the temples and down to the ear's top
      G.push(lock([[0.45, p*0.8, 0.02], [0.95, p, 0.06], [1.42, p - sx*0.08, 0.05], [1.62, p - sx*0.22, 0.025]], 0.12, 0.45)); }
    for (let k = 0; k < 9; k++){ const p = Math.PI + (k - 4)*0.3;   // the back, falling to the nape
      G.push(lock([[0.3, p, 0.02], [0.9, p, 0.08], [1.7, p + 0.04*(k - 4), 0.07], [2.28, p + 0.08*(k - 4), 0.045]], 0.15, 0.42)); }
    for (let k = 0; k < 4; k++) G.push(lock([[0.05, k*1.6, 0.03], [0.32, k*1.6 + 0.3, 0.085], [0.62, k*1.6 + 0.55, 0.06]], 0.13, 0.5, 14));   // crown volume
  }
  if (style === 'bun'){   // black: a fringe, the sides drawn back, a high bun
    G.push(hairCap(1.0, 1.68, 2.55));
    for (let k = 0; k < 8; k++){ const p0 = -0.7 + k*0.2, dir = k < 3 ? -1 : 1, sw = dir*(0.22 + 0.06*Math.abs(k - 2.5));
      G.push(lock([[0.38, p0*0.4, 0.02], [0.8, p0 + sw*0.4, 0.06], [1.12, p0 + sw*0.8, 0.055], [1.28 - 0.02*Math.abs(k - 3.5), p0 + sw, 0.028]], 0.11, 0.42)); }
    for (const sx of [-1, 1]) for (let k = 0; k < 4; k++){ const p = sx*(1.15 + k*0.32);   // drawn back toward the bun
      G.push(lock([[1.55 - k*0.12, p, 0.02], [1.05 - k*0.06, p + sx*0.4, 0.05], [0.55, Math.PI*sx*0.9 + sx*0.0, 0.05], [0.35, Math.PI*sx, 0.04]], 0.12, 0.38)); }
    for (let k = 0; k < 6; k++){ const p = Math.PI + (k - 2.5)*0.35;   // up from the nape
      G.push(lock([[2.25, p, 0.02], [1.6, p*1 + 0.0, 0.05], [0.9, Math.PI + (k - 2.5)*0.15, 0.05], [0.45, Math.PI + (k - 2.5)*0.05, 0.04]], 0.13, 0.38)); }
  }
  if (style === 'curls'){   // orange, grouped curls
    G.push(hairCap(0.92, 1.85, 2.65, 0.05));
    const curl = (th, ph, R, turns = 1.35, lift = 0.05, spin = 1, a0 = 0) => {
      const c = headP(th, ph, lift), n = headNormal(th, ph), t1 = V(0, 1, 0).cross(n).normalize(); if (t1.lengthSq() < 1e-6) t1.set(1, 0, 0);
      const t2 = V().crossVectors(n, t1).normalize(), pts = [], nrm = [], N = 30;
      for (let i = 0; i < N; i++){ const s = i/(N - 1), a = a0 + spin*s*turns*TAU, r = R*(1 - 0.78*s);
        pts.push(c.clone().addScaledVector(t1, Math.cos(a)*r).addScaledVector(t2, Math.sin(a)*r).addScaledVector(n, 0.04*Math.sin(Math.PI*Math.min(1, s*1.4)))); nrm.push(n); }
      return sweep(pts, i => nrm[i], t => R*0.62*Math.pow(1 - t, 0.6)*(0.8 + 0.5*t*(1 - t)), t => R*0.4*Math.pow(1 - t, 0.6), 12); };
    const C = [[0.35, 0.7, 0.2, 1.4, 0.07, 1], [0.32, -0.55, 0.17, 1.3, 0.06, -1], [0.18, Math.PI, 0.17, 1.3, 0.06, 1], [0.62, 0.15, 0.16, 1.2, 0.07, -1],
      [0.9, -0.42, 0.13, 1.2, 0.05, 1], [0.86, 0.48, 0.12, 1.2, 0.05, -1],
      [0.95, 1.2, 0.17, 1.3, 0.06, 1], [0.95, -1.2, 0.17, 1.3, 0.06, -1], [1.45, 1.45, 0.15, 1.2, 0.05, -1], [1.45, -1.45, 0.15, 1.2, 0.05, 1],
      [1.0, 2.1, 0.18, 1.3, 0.06, 1], [1.0, -2.1, 0.18, 1.3, 0.06, -1], [1.6, 2.45, 0.17, 1.2, 0.06, -1], [1.6, -2.45, 0.17, 1.2, 0.06, 1], [1.9, Math.PI, 0.17, 1.2, 0.05, 1],
      [0.6, 2.4, 0.16, 1.2, 0.07, -1], [0.6, -2.4, 0.16, 1.2, 0.07, 1], [1.25, 2.0, 0.14, 1.1, 0.05, 1], [1.25, -2.0, 0.14, 1.1, 0.05, -1]];
    C.forEach(([th, ph, R, tu, li, sp], i) => G.push(curl(th, ph, R, tu, li, sp, i*1.3)));
  }
  return G; }

// ---------- the body ----------
// a lathed shape with a depth less than its width; profile: [radius, y] from bottom to top
const DEPTH = 0.72;
function lathe(profile, seg = 48, phi0 = 0, phiLen = TAU, depth = DEPTH){
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg, phi0, phiLen); g.scale(1, 1, depth); g.computeVertexNormals(); return g; }
const radiusAt = profile => y => { for (let i = 1; i < profile.length; i++){ const [r0, y0] = profile[i - 1], [r1, y1] = profile[i]; if (y <= y1) return r0 + (r1 - r0)*(y - y0)/Math.max(1e-6, y1 - y0); } return profile[profile.length - 1][0]; };
// split every triangle until no edge is longer than maxLen, so a flat piece can bend without its faces cutting in
function densify(geo, maxLen = 0.018){
  const src = geo.index ? geo.toNonIndexed() : geo, P = src.attributes.position, out = [], a = V(), b = V(), c = V();
  const split = (A, B, C, depth) => { const ab = A.distanceTo(B), bc = B.distanceTo(C), ca = C.distanceTo(A), m = Math.max(ab, bc, ca);
    if (m <= maxLen || depth > 9){ out.push(A.x, A.y, A.z, B.x, B.y, B.z, C.x, C.y, C.z); return; }
    if (m === ab){ const M = A.clone().lerp(B, 0.5); split(A, M, C, depth + 1); split(M, B, C, depth + 1); }
    else if (m === bc){ const M = B.clone().lerp(C, 0.5); split(A, B, M, depth + 1); split(A, M, C, depth + 1); }
    else { const M = C.clone().lerp(A, 0.5); split(A, B, M, depth + 1); split(M, B, C, depth + 1); } };
  for (let i = 0; i < P.count; i += 3) split(a.fromBufferAttribute(P, i).clone(), b.fromBufferAttribute(P, i + 1).clone(), c.fromBufferAttribute(P, i + 2).clone(), 0);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3)); return mergeVertices(g, 1e-5); }
// bend a flat piece (x across, y up, z out of the surface) onto the front of a lathed shape
function wrap(geo, Rof, depth = DEPTH, lift = 0.002){
  geo = densify(geo); const P = geo.attributes.position;
  for (let i = 0; i < P.count; i++){ const x = P.getX(i), y = P.getY(i), z = P.getZ(i), R = Rof(y), a = x/R;
    const nx = Math.sin(a)/R, nz = Math.cos(a)/(R*depth), l = Math.hypot(nx, nz);
    P.setXYZ(i, R*Math.sin(a) + (z + lift)*nx/l, y, R*Math.cos(a)*depth + (z + lift)*nz/l); }
  geo.computeVertexNormals(); return geo; }
function rounded(w, h, r){ const s = new THREE.Shape(), x = -w/2, y = -h/2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }
const slab = (shape, t, bevel = 0.006, cs = 6) => new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: cs });
function ribbed(r0, r1, y0, y1, n = 30, amp = 0.007, depth = DEPTH){   // a ribbed band (collar, cuffs, hem)
  const g = lathe([[r0*0.92, y0 - 0.005], [r0, y0], [r1, y1], [r1*0.92, y1 + 0.005]], 96, 0, TAU, 1), P = g.attributes.position;
  for (let i = 0; i < P.count; i++){ const x = P.getX(i), z = P.getZ(i), a = Math.atan2(x, z), k = 1 + amp*Math.cos(n*a)/Math.max(0.05, Math.hypot(x, z)); P.setX(i, x*k); P.setZ(i, z*k*depth); }
  g.computeVertexNormals(); return g; }

// shoes: a chunky rounded toe-cap shape, a separate sole for the sneakers
function shoeGeo(sneaker){
  const key = 'shoe' + sneaker; if (GEO[key]) return GEO[key];
  const up = new THREE.SphereGeometry(1, 36, 22), P = up.attributes.position;
  for (let i = 0; i < P.count; i++){ let x = P.getX(i)*0.13, y = P.getY(i)*0.1, z = P.getZ(i)*0.21;
    if (y < -0.03) y = -0.03 + (y + 0.03)*0.12;                    // a flat bottom
    if (z > 0.02) y += 0.018*(z/0.21)*(y > 0 ? 0.4 : 0);            // a little rise at the toe
    if (z < -0.12 && y > 0.02) y += 0.012;                          // the heel's collar
    P.setXYZ(i, x, y + 0.045 + (sneaker ? 0.035 : 0.012), z + 0.05); }
  up.computeVertexNormals();
  const s = new THREE.Shape(); s.absellipse(0, 0, 0.142, 0.228, 0, TAU, false, 0);
  const sole = new THREE.ExtrudeGeometry(s, { depth: sneaker ? 0.03 : 0.012, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3, curveSegments: 32 });
  sole.rotateX(-Math.PI/2); sole.translate(0, 0.012, 0.05);
  return GEO[key] = { up, sole }; }
function handGeo(){
  if (GEO.hand) return GEO.hand;
  const palm = new THREE.SphereGeometry(1, 24, 18), P = palm.attributes.position;
  for (let i = 0; i < P.count; i++){ const x = P.getX(i), y = P.getY(i), z = P.getZ(i); P.setXYZ(i, x*0.062*(1 - 0.12*y), y*0.088 - 0.07, z*0.078*(1 + 0.1*Math.max(0, -y))); }   // a soft mitten, fuller at the fingers
  palm.computeVertexNormals();
  const thumb = new THREE.CapsuleGeometry(0.026, 0.045, 6, 12); thumb.rotateX(0.55); thumb.rotateZ(0.3); thumb.translate(0.016, -0.05, 0.07);
  return GEO.hand = { palm, thumb }; }

// ---------- the figure ----------
export function makeCharacter(cfg){
  const F = faceGeo(), root = new THREE.Group(); root.name = cfg.name || 'figure';
  const skin = mat('skin', cfg.skin), hairM = mat('hair', cfg.hair), browM = mat('hair', new THREE.Color(cfg.hair).offsetHSL(0, 0, -0.06).getHex());
  const outfit = cfg.outfit;
  // legs: trousers with a rolled cuff, the shoes planted
  const legs = new THREE.Group(); legs.name = 'legs'; root.add(legs);
  const legProf = [[0.0, 0.16], [0.098, 0.165], [0.1, 0.25], [0.108, 0.5], [0.118, 0.74], [0.0, 0.78]];
  const pantsM = mat('cloth', cfg.pants), shoeUp = mat('shoe', cfg.shoe), soleM = mat('shoe', cfg.sole ?? new THREE.Color(cfg.shoe).offsetHSL(0, 0, -0.05).getHex());
  for (const sx of [-1, 1]){ const leg = new THREE.Group(); leg.name = sx < 0 ? 'legR' : 'legL'; leg.position.x = sx*0.135; legs.add(leg);
    leg.add(mesh(lathe(legProf, 28, 0, TAU, 0.92), pantsM, 'trouser'));
    leg.add(mesh(lathe([[0.1, 0.165], [0.113, 0.17], [0.116, 0.2], [0.112, 0.235], [0.1, 0.24]], 28, 0, TAU, 0.92), pantsM, 'cuff'));
    const sg = shoeGeo(!!cfg.sneaker), shoe = new THREE.Group(); shoe.name = 'shoe'; shoe.position.set(sx*0.008, 0, 0.0); shoe.rotation.y = sx*0.06; leg.add(shoe);
    shoe.add(mesh(sg.up, shoeUp, 'upper')); shoe.add(mesh(sg.sole, soleM, 'sole')); }
  // the torso, breathing about the hips
  const torso = new THREE.Group(); torso.name = 'torso'; torso.position.y = 0.62; root.add(torso);
  const T = new THREE.Group(); T.position.y = -0.62; torso.add(T);   // build in figure coordinates
  const chest = new THREE.Group(); chest.name = 'chest'; chest.position.y = 1.3; root.add(chest);   // what rides on the breath: arms, neck
  const C = new THREE.Group(); C.position.y = -1.3; chest.add(C);
  const prof = outfit === 'sweater'
    ? [[0, 0.66], [0.27, 0.665], [0.305, 0.7], [0.33, 0.84], [0.335, 1.0], [0.33, 1.14], [0.31, 1.25], [0.26, 1.33], [0.17, 1.39], [0.11, 1.41], [0, 1.42]]
    : [[0, 0.56], [0.27, 0.57], [0.29, 0.64], [0.282, 0.82], [0.29, 0.98], [0.305, 1.12], [0.3, 1.23], [0.265, 1.31], [0.18, 1.37], [0.1, 1.405], [0, 1.415]];
  const R = radiusAt(prof.slice(1, -1));
  const topM = mat('cloth', cfg.top);
  T.add(mesh(lathe(prof), topM, 'body'));
  const neck = new THREE.Group(); neck.name = 'neck'; neck.position.y = 1.4; C.add(neck);   // the neck's pivot
  neck.add(mesh(new THREE.CylinderGeometry(0.074, 0.08, 0.2, 20).translate(0, 0.03, 0), skin, 'neckSkin'));
  if (outfit === 'coat'){   // an open coat with thick lapels, two pockets, a badge, a stethoscope; the scrubs' V at the neck
    const coatM = mat('cloth', cfg.coat), cp = [[0.3, 0.44], [0.312, 0.56], [0.305, 0.74], [0.312, 0.92], [0.33, 1.08], [0.335, 1.18], [0.322, 1.27], [0.285, 1.34], [0.2, 1.395], [0.13, 1.42]];
    const gap = 0.3, coat = mesh(lathe(cp, 64, gap, TAU - 2*gap), coatM, 'coat'); coat.material = coatM.clone(); coat.material.side = THREE.DoubleSide; T.add(coat);
    const RC = radiusAt(cp);
    const vee = new THREE.Shape(); vee.moveTo(-0.11, 1.40); vee.lineTo(0, 1.2); vee.lineTo(0.11, 1.40); vee.lineTo(0.07, 1.40); vee.lineTo(0, 1.27); vee.lineTo(-0.07, 1.40);
    T.add(mesh(wrap(slab(vee, 0.004, 0.003), R), mat('cloth', new THREE.Color(cfg.top).offsetHSL(0, 0, -0.08).getHex()), 'vneck'));
    for (const sx of [-1, 1]){   // lapels: broad at the chest, notched, tapering down the front edge
      const s = new THREE.Shape(), e = sx;   // x measured as arc length round the coat
      const edge = y => e*(gap*RC(y) - 0.004);
      s.moveTo(edge(1.4) + e*0.0, 1.40); s.lineTo(edge(1.4) + e*0.075, 1.405); s.lineTo(edge(1.2) + e*0.16, 1.2); s.lineTo(edge(1.17) + e*0.12, 1.16); s.lineTo(edge(1.12) + e*0.15, 1.1);
      s.lineTo(edge(0.95), 0.92); s.lineTo(edge(1.0) - e*0.0, 0.95);
      T.add(mesh(wrap(slab(s, 0.016, 0.008, 4), RC, DEPTH, 0.004), coatM, 'lapel'));
      const fs = new THREE.Shape(); fs.moveTo(edge(0.5), 0.45); fs.lineTo(edge(0.5) + e*0.03, 0.45); fs.lineTo(edge(1.3) + e*0.03, 1.3); fs.lineTo(edge(1.3), 1.3);   // the front edge's facing
      T.add(mesh(wrap(slab(fs, 0.008, 0.004, 2), RC, DEPTH, 0.002), coatM, 'facing'));
      const pk = mesh(wrap(slab(rounded(0.15, 0.13, 0.025), 0.008, 0.005).translate(sx*0.205, 0.66, 0), RC, DEPTH, 0.003), mat('cloth', new THREE.Color(cfg.coat).offsetHSL(0, 0, -0.03).getHex()), 'pocket'); T.add(pk); }
    T.add(mesh(wrap(slab(rounded(0.085, 0.06, 0.01), 0.006, 0.003).translate(0.17, 1.1, 0), RC, DEPTH, 0.006), mat('cloth', 0xfafafa, { roughness: 0.5 }), 'badge'));
    // the stethoscope: round the neck, down the front, a silver chest piece
    const front = (x, y, out = 0.035) => { const r = RC(y), a = x/r; return V(r*Math.sin(a)*(1 + out), y, r*Math.cos(a)*DEPTH + out); };
    const tube = new THREE.CatmullRomCurve3([front(-0.08, 1.0, 0.04), front(-0.11, 1.18, 0.04), V(-0.14, 1.4, 0.05), V(-0.1, 1.45, -0.08), V(0, 1.45, -0.12), V(0.1, 1.45, -0.08), V(0.14, 1.4, 0.05), front(0.12, 1.2, 0.04), front(0.1, 1.04, 0.045)]);
    T.add(mesh(new THREE.TubeGeometry(tube, 80, 0.013, 10, false), mat('shoe', 0x2a2c33), 'stethoscope'));
    const end = front(0.1, 1.0, 0.05), disc = mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.022, 28), mat('metal', 0xc9ccd4), 'chestpiece'); disc.position.copy(end); disc.rotation.x = Math.PI/2; T.add(disc);
    const ring = mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 24), mat('metal', 0x9ca2ae)); ring.position.copy(end).add(V(0, 0, 0.012)); T.add(ring);
    const tip = front(-0.08, 0.98, 0.045), ear = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 10), mat('metal', 0xc9ccd4), 'earpiece'); ear.position.copy(tip); ear.rotation.z = 0.3; T.add(ear);
  }
  if (outfit === 'scrubs'){   // a layered V neckline, a chest pocket with a badge
    const dark = mat('cloth', new THREE.Color(cfg.top).offsetHSL(0, 0, -0.1).getHex()), band = mat('cloth', new THREE.Color(cfg.top).offsetHSL(0, 0.02, 0.04).getHex());
    const inner = new THREE.Shape(); inner.moveTo(-0.09, 1.405); inner.lineTo(0, 1.12); inner.lineTo(0.09, 1.405); inner.lineTo(-0.09, 1.405);
    T.add(mesh(wrap(slab(inner, 0.002, 0.002), R), mat('skin', cfg.skin), 'vneckSkin'));
    const b = new THREE.Shape(); b.moveTo(-0.125, 1.4); b.lineTo(0, 1.07); b.lineTo(0.125, 1.4); b.lineTo(0.09, 1.4); b.lineTo(0, 1.125); b.lineTo(-0.09, 1.4);
    T.add(mesh(wrap(slab(b, 0.01, 0.005), R, DEPTH, 0.003), band, 'vneck'));
    const b2 = new THREE.Shape(); b2.moveTo(-0.15, 1.395); b2.lineTo(0, 1.03); b2.lineTo(0.15, 1.395); b2.lineTo(0.125, 1.395); b2.lineTo(0, 1.07); b2.lineTo(-0.125, 1.395);
    T.add(mesh(wrap(slab(b2, 0.005, 0.004), R, DEPTH, 0.002), dark, 'vneckSeam'));
    T.add(mesh(wrap(slab(rounded(0.12, 0.11, 0.015), 0.006, 0.004).translate(0.17, 0.98, 0), R, DEPTH, 0.002), dark, 'pocket'));
    T.add(mesh(wrap(slab(rounded(0.085, 0.045, 0.008), 0.005, 0.003).translate(0.17, 1.045, 0), R, DEPTH, 0.01), mat('cloth', 0xfafafa, { roughness: 0.5 }), 'badge'));
    T.add(mesh(lathe([[0.27, 0.56], [0.285, 0.565], [0.292, 0.6], [0.285, 0.605]], 48), dark, 'hem'));
  }
  if (outfit === 'sweater'){   // rounded, with a ribbed collar and hem
    const rib = mat('cloth', new THREE.Color(cfg.top).offsetHSL(0, 0, -0.04).getHex());
    T.add(mesh(ribbed(0.275, 0.275, 0.6, 0.7, 40, 0.006), rib, 'hem'));
    C.add(mesh(ribbed(0.135, 0.125, 1.34, 1.47, 30, 0.006, 0.9), rib, 'collar'));
  }
  // arms: shoulder and elbow pivots, relaxed a little away from the body
  const arms = new THREE.Group(); arms.name = 'arms'; C.add(arms);
  const sleeveM = mat('cloth', outfit === 'coat' ? cfg.coat : cfg.top), cuffM = outfit === 'sweater' ? mat('cloth', new THREE.Color(cfg.top).offsetHSL(0, 0, -0.04).getHex()) : sleeveM;
  const fat = outfit === 'sweater' ? 1.12 : 1;
  const upper = lathe([[0, 0.05], [0.05*fat, 0.045], [0.078*fat, 0.015], [0.084*fat, -0.03], [0.079*fat, -0.18], [0.071*fat, -0.29], [0, -0.31]], 24, 0, TAU, 0.95);
  const fore = lathe([[0, 0.02], [0.05*fat, 0.018], [0.068*fat, 0.0], [0.072*fat, -0.05], [0.07*fat, -0.2], [0.068*fat, -0.24], [0, -0.25]], 24, 0, TAU, 0.95);
  const H = handGeo();
  for (const sx of [-1, 1]){
    const sh = new THREE.Group(); sh.name = sx < 0 ? 'shoulderR' : 'shoulderL'; sh.position.set(sx*(outfit === 'coat' ? 0.29 : outfit === 'sweater' ? 0.285 : 0.272), 1.255, 0); sh.rotation.z = sx*(outfit === 'coat' ? 0.3 : 0.26); arms.add(sh);
    sh.add(mesh(upper, sleeveM, 'upperArm'));
    const el = new THREE.Group(); el.name = 'elbow'; el.position.y = -0.29; el.rotation.x = -0.12; sh.add(el);
    el.add(mesh(fore, sleeveM, 'forearm'));
    el.add(mesh(outfit === 'sweater' ? ribbed(0.072, 0.068, -0.26, -0.2, 22, 0.004, 0.95) : lathe([[0.066*fat, -0.26], [0.078*fat, -0.255], [0.08*fat, -0.22], [0.072*fat, -0.205]], 24, 0, TAU, 0.95), cuffM, 'cuff'));
    const hand = new THREE.Group(); hand.name = 'hand'; hand.position.y = -0.26; hand.scale.x = -sx; el.add(hand);   // palm toward the body, thumb forward
    hand.add(mesh(H.palm, skin, 'palm')); hand.add(mesh(H.thumb, skin, 'thumb')); }
  // the head on its neck
  const head = new THREE.Group(); head.name = 'head'; head.position.y = 0.52; neck.add(head);
  head.add(mesh(F.head, skin, 'skull'));
  const eyes = new THREE.Group(); eyes.name = 'eyes'; head.add(eyes);
  const eyeM = [-1, 1].map(sx => new THREE.MeshStandardMaterial({ map: eyeTex(cfg.iris, sx, 'open', cfg.lash), transparent: true, roughness: 0.32, polygonOffset: true, polygonOffsetFactor: -2 }));
  [-1, 1].forEach((sx, i) => eyes.add(mesh(F.eye[i], eyeM[i], sx < 0 ? 'eyeR' : 'eyeL')));
  const brows = new THREE.Group(); brows.name = 'brows'; head.add(brows); [0, 1].forEach(i => brows.add(mesh(F.brow[i], browM, i ? 'browL' : 'browR')));
  const mouth = new THREE.Group(); mouth.name = 'mouth'; head.add(mouth); mouth.add(mesh(F.mouth, mat('plain', 0x6e3432, { roughness: 0.5 }), 'smile'));
  const nose = mesh(F.nose, mat('skin', new THREE.Color(cfg.skin).offsetHSL(0.0, 0.05, -0.04).getHex()), 'nose'); nose.position.copy(headP(EYE.th + 0.2, 0, -0.012)); head.add(nose);
  const blushM = new THREE.MeshStandardMaterial({ map: blushTex(), transparent: true, depthWrite: false, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -1 });
  F.blush.forEach(g => head.add(mesh(g, blushM, 'blush')));
  const earM = mat('skin', new THREE.Color(cfg.skin).offsetHSL(0, 0.06, -0.06).getHex());
  for (const sx of [-1, 1]){ const e = new THREE.Group(); e.name = 'ear'; e.position.copy(headP(EYE.th + 0.02, sx*1.5, -0.03)); e.rotation.set(0, -sx*0.25, sx*0.08); head.add(e);
    e.add(mesh(F.ear, skin, 'earOuter')); const inn = mesh(F.earIn, earM, 'earInner'); inn.position.set(sx*0.022, 0.0, 0.006); e.add(inn); }
  const hair = new THREE.Group(); hair.name = 'hair'; head.add(hair);
  for (const g of cfg._hair || (cfg._hair = hairStyle(cfg.hairStyle))) hair.add(mesh(g, hairM, 'lock'));
  if (cfg.hairStyle === 'bun'){   // the bun: a round core wrapped in locks, on the crown
    const bun = new THREE.Group(); bun.name = 'bun'; bun.position.copy(headP(0.38, Math.PI, 0.2)); hair.add(bun);
    bun.add(mesh(new THREE.SphereGeometry(0.17, 28, 20), hairM, 'bunCore'));
    for (let k = 0; k < 5; k++){ const tilt = k*0.65, pts = [], nrm = [], N = 28;
      for (let i = 0; i < N; i++){ const s = i/(N - 1), a = s*Math.PI*1.7 + k*1.1, p = V(Math.cos(a)*0.17, Math.sin(a)*0.17*Math.cos(tilt), Math.sin(a)*0.17*Math.sin(tilt)); pts.push(p); nrm.push(p.clone().normalize()); }
      bun.add(mesh(sweep(pts, i => nrm[i], t => 0.075*Math.pow(1 - t, 0.6)*(0.8 + 0.6*t*(1 - t)), t => 0.04*Math.pow(1 - t, 0.6), 12), hairM, 'bunLock')); }
    bun.add(mesh(new THREE.TorusGeometry(0.1, 0.022, 10, 28).rotateX(Math.PI/2).translate(0, -0.13, 0), mat('cloth', cfg.tie ?? 0x2b2f3a), 'tie')); }
  // ---------- life: breathing, blinking, small head moves; the feet stay planted ----------
  const ph = cfg.phase || 0; let nextBlink = 1 + Math.random()*2, blinkT = -1;
  let eyeState = 'open';
  const setEyes = state => { if (state === eyeState) return; eyeState = state; [-1, 1].forEach((sx, i) => { eyeM[i].map = eyeTex(cfg.iris, sx, state, cfg.lash); }); };
  root.userData.tick = (t, dt) => {
    const br = Math.sin(t*1.7 + ph);
    torso.scale.set(1 + 0.006*br, 1 + 0.01*br, 1 + 0.008*br); chest.position.y = 1.3 + 0.007*br;
    neck.rotation.set(0.04*Math.sin(t*0.53 + ph) - 0.02, 0.1*Math.sin(t*0.37 + ph*1.7), 0.035*Math.sin(t*0.45 + ph*0.6));
    for (const s of arms.children){ const sx = s.position.x > 0 ? 1 : -1; s.rotation.z = sx*((outfit === 'coat' ? 0.3 : 0.26) + 0.015*br); }
    if (blinkT < 0 && t > nextBlink){ blinkT = t; }
    if (blinkT >= 0){ const u = t - blinkT; setEyes(u < 0.045 ? 'half' : u < 0.11 ? 'closed' : u < 0.16 ? 'half' : 'open');
      if (u >= 0.16){ blinkT = -1; nextBlink = t + 2.2 + Math.random()*3.5; setEyes('open'); } } };
  root.userData.still = () => { torso.scale.set(1, 1, 1); chest.position.y = 1.3; neck.rotation.set(-0.02, 0, 0); setEyes('open'); };
  return root; }

export const CAST = {
  doctor:  { name: 'doctor',  skin: 0xf4d3bf, iris: '#3f72c0', hair: 0x4a2c22, hairStyle: 'swept', outfit: 'coat', top: 0x139488, coat: 0xefe9dd, pants: 0x139488, shoe: 0x22242a, sole: 0x17181c, lash: false, phase: 0 },
  nurse:   { name: 'nurse',   skin: 0xc68a62, iris: '#7a4a26', hair: 0x1f1b24, hairStyle: 'bun', outfit: 'scrubs', top: 0x2440b8, pants: 0x2440b8, shoe: 0xf6f6f3, sole: 0xe3e4e6, sneaker: true, lash: true, phase: 2.1 },
  visitor: { name: 'visitor', skin: 0xf7d1b6, iris: '#3c9a4c', hair: 0xe8742c, hairStyle: 'curls', outfit: 'sweater', top: 0xe3a51f, pants: 0x283561, shoe: 0x8a4a2c, sole: 0x5e3420, lash: true, phase: 4.2 } };
