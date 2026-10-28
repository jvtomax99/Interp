// ---- moving round the campus (Jose, 2026-10-28: "moving around using your fingers is wonky and hard"): the Maps way ----
// One finger drags the ground (the spot under it stays under it) and glides on when let go; two fingers pinch to zoom
// toward them, twist to turn, slide up or down together to tilt; tapping a building flies to it; Reset view goes home.
// A mouse: drag to move, right-drag to turn and tilt, the wheel zooms toward the pointer. The view stops softly at the
// board's edges. OrbitControls stays only as the camera's bookkeeping (target, getPolarAngle), switched off.
{
const NAV = { minD:10, maxD:240, minPhi:0.25, maxPhi:1.3, pivotY:-1.5, home:{ t:[0.5, -1.5, -3], c:[-34, 70, 82] } };
controls.enabled = false; controls.enableDamping = false; controls.minDistance = 0.1; controls.maxDistance = 1e4; controls.minPolarAngle = 0; controls.maxPolarAngle = Math.PI;
const el = renderer.domElement, UP = new THREE.Vector3(0, 1, 0), GROUND = new THREE.Plane(UP, -0.3), RC = new THREE.Raycaster(), NDC = new THREE.Vector2(), SPH = new THREE.Spherical(), tgt = controls.target;
function apply(){ cam.lookAt(tgt); cam.updateMatrixWorld(); }
function groundAt(x, y){ const r = el.getBoundingClientRect(); NDC.set((x - r.left)/r.width*2 - 1, -(y - r.top)/r.height*2 + 1); RC.setFromCamera(NDC, cam);
  const h = RC.ray.intersectPlane(GROUND, new THREE.Vector3()); return h && h.distanceTo(cam.position) < 600 ? h : null; }
function moveBy(dx, dz){ tgt.x += dx; tgt.z += dz; cam.position.x += dx; cam.position.z += dz; }
// the pivot back on its level along the line of sight (zooming about a ground point moves it), and over the board
function keepIn(){ const dir = tgt.clone().sub(cam.position).normalize(); if (Math.abs(dir.y) > 0.05) tgt.addScaledVector(dir, (NAV.pivotY - tgt.y)/dir.y);
  moveBy(Math.min(BX1 - 2, Math.max(BX0 + 2, tgt.x)) - tgt.x, Math.min(BZ1 - 2, Math.max(BZ0 + 2, tgt.z)) - tgt.z); }
function zoomAbout(M, k){ const d = cam.position.distanceTo(tgt); k = Math.min(Math.max(k, NAV.minD/d), NAV.maxD/d);
  for (const p of [cam.position, tgt]) p.sub(M).multiplyScalar(k).add(M); }
function turnAbout(M, a){ for (const p of [cam.position, tgt]) p.sub(M).applyAxisAngle(UP, a).add(M); }
function tiltBy(d){ const off = cam.position.clone().sub(tgt); SPH.setFromVector3(off); SPH.phi = Math.min(NAV.maxPhi, Math.max(NAV.minPhi, SPH.phi + d)); off.setFromSpherical(SPH); cam.position.copy(tgt).add(off); }
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

// ---- fingers and mouse ----
const P = new Map(); let mode = null, anchor = null, d0 = 0, vel = { x:0, z:0, t:0 }, glide = null, fly = null;
const two = () => { const [a, b] = [...P.values()]; return { x:(a.x + b.x)/2, y:(a.y + b.y)/2, d:Math.hypot(b.x - a.x, b.y - a.y), ang:Math.atan2(b.y - a.y, b.x - a.x) }; };
function begin(){ glide = null;
  if (P.size === 1){ const p = [...P.values()][0]; mode = p.b === 2 ? 'turn' : 'pan'; anchor = groundAt(p.x, p.y); vel = { x:0, z:0, t:performance.now() }; }
  else if (P.size === 2){ mode = 'two'; for (const p of P.values()){ p.sx = p.x; p.sy = p.y; } d0 = two().d; }
  else mode = null; }
el.addEventListener('pointerdown', e => { try { el.setPointerCapture(e.pointerId); } catch(_){}
  P.set(e.pointerId, { x:e.clientX, y:e.clientY, b:e.button }); fly = null; begin(); });
el.addEventListener('pointermove', e => { const p = P.get(e.pointerId); if (!p) return;
  const before = P.size === 2 ? two() : null, dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (mode === 'pan' && anchor){ const h = groundAt(p.x, p.y); if (!h) return;
    const sx = anchor.x - h.x, sz = anchor.z - h.z, now = performance.now(), dt = Math.max(8, now - vel.t);
    moveBy(sx, sz); keepIn(); apply(); vel = { x:vel.x*0.5 + sx/dt*0.5, z:vel.z*0.5 + sz/dt*0.5, t:now }; return; }
  if (mode === 'turn'){ turnAbout(tgt.clone(), -dx*0.006); tiltBy(-dy*0.005); keepIn(); apply(); return; }
  if (!before || P.size !== 2) return;
  const now2 = two();
  if (mode === 'two'){ const [a, b] = [...P.values()], va = a.y - a.sy, vb = b.y - b.sy, ha = a.x - a.sx, hb = b.x - b.sx;
    if (Math.abs(va) + Math.abs(vb) + Math.abs(ha) + Math.abs(hb) + Math.abs(now2.d - d0) < 14) return;   // not decided yet
    mode = va*vb > 0 && Math.abs(va) > 1.5*Math.abs(ha) && Math.abs(vb) > 1.5*Math.abs(hb) && Math.abs(now2.d - d0) < 0.3*(Math.abs(va) + Math.abs(vb)) ? 'tilt' : 'zoom'; }
  if (mode === 'tilt'){ tiltBy(-(now2.y - before.y)*0.004); keepIn(); apply(); return; }
  const M = groundAt(before.x, before.y); if (!M) return;
  zoomAbout(M, before.d/Math.max(1, now2.d)); turnAbout(M, wrap(now2.ang - before.ang)); apply();
  const h = groundAt(now2.x, now2.y); if (h) moveBy(M.x - h.x, M.z - h.z);   // the spot between the fingers follows them
  keepIn(); apply(); });
function end(e){ if (!P.has(e.pointerId)) return; P.delete(e.pointerId);
  if (mode === 'pan' && P.size === 0 && performance.now() - vel.t < 90 && Math.hypot(vel.x, vel.z) > 0.004){ const v = Math.hypot(vel.x, vel.z), k = Math.min(1, 0.15/v); glide = { x:vel.x*k, z:vel.z*k, t:performance.now() }; }   // a flick slides 16 units at most
  if (P.size) begin(); else mode = null; }
el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
el.addEventListener('contextmenu', e => e.preventDefault());
el.addEventListener('wheel', e => { e.preventDefault(); fly = null; glide = null; const M = groundAt(e.clientX, e.clientY); if (!M) return; zoomAbout(M, Math.exp(e.deltaY*0.0015)); keepIn(); apply(); }, { passive:false });

// ---- flights: to a tapped building, and home ----
function flyTo(x, z, r, th, ph, ms=800){ const off = cam.position.clone().sub(tgt); SPH.setFromVector3(off);
  fly = { t0:performance.now(), ms, a:{ x:tgt.x, z:tgt.z, r:SPH.radius, th:SPH.theta, ph:SPH.phi }, b:{ x, z, r, th:SPH.theta + wrap((th ?? SPH.theta) - SPH.theta), ph:ph ?? SPH.phi } }; glide = null; }
const HOME = (() => { const t = new THREE.Vector3(...NAV.home.t), s = new THREE.Spherical().setFromVector3(new THREE.Vector3(...NAV.home.c).sub(t)); return { x:t.x, z:t.z, r:s.radius, th:s.theta, ph:s.phi }; })();
const goHome = () => flyTo(HOME.x, HOME.z, HOME.r, HOME.th, HOME.ph);
const _pick = pick;
pick = k => { const was = picked; _pick(k); if (homeBtn) homeBtn.hidden = !!picked;
  if (picked && picked !== was){ const b = BOX[picked]; flyTo(b.x, b.z, Math.min(120, Math.max(28, Math.max(b.w, b.d)*1.5 + 24)), undefined, Math.min(1.0, Math.max(0.6, cam.position.clone().sub(tgt).angleTo(UP)))); } };
if (document.getElementById('reset')) document.getElementById('reset').onclick = goHome;   // the app's round button ($() never returns null)
else { // the preview: a glass pill just above the sheet on the right, out of the way while a building's card is open
  const btn = document.createElement('button'); btn.type = 'button'; btn.id = 'navHome'; btn.className = 'chip'; btn.textContent = 'Reset view';
  btn.style.cssText = 'position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:calc(env(safe-area-inset-bottom,0px) + 190px);padding:11px 15px;font-size:13px;color:var(--ink);font-family:inherit;cursor:pointer;z-index:2';
  btn.onclick = goHome; document.body.appendChild(btn); }
const homeBtn = document.getElementById('navHome');

// each frame (riding on the runtime's controls.update): the glide after a flick, a flight in progress
const upd = controls.update.bind(controls);
controls.update = () => { const now = performance.now();
  if (glide){ const dt = Math.min(48, now - glide.t); glide.t = now; moveBy(glide.x*dt, glide.z*dt); keepIn(); apply(); const k = Math.pow(0.86, dt/16); glide.x *= k; glide.z *= k; if (Math.hypot(glide.x, glide.z) < 0.0006) glide = null; }
  if (fly){ const u = Math.min(1, (now - fly.t0)/fly.ms), e = u < 0.5 ? 4*u*u*u : 1 - Math.pow(-2*u + 2, 3)/2, L = (p) => fly.a[p] + (fly.b[p] - fly.a[p])*e;
    tgt.set(L('x'), NAV.pivotY, L('z')); SPH.set(L('r'), L('ph'), L('th')); cam.position.copy(tgt).add(new THREE.Vector3().setFromSpherical(SPH)); apply(); if (u >= 1) fly = null; }
  return upd(); };
window.__nav = { groundAt, state:() => ({ mode, glide:!!glide, fly:!!fly, tgt:tgt.toArray(), cam:cam.position.toArray() }) };
}
