
// ==================== live runtime (the iPhone test) ====================
const $ = id => document.getElementById(id);
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NAMES = { e:['Ethics','George Link Jr. Pavilion',9], t:['Terminology','the brick tower',25], s:['US Systems','Jurist Research Center',9], n:['Encounter','John Theurer Cancer Center',45], c:['Culture','Medical Plaza',12] };
// the HMH mark: banners and the tower's plaque
TEX = await new Promise(r => { const t = new THREE.TextureLoader().load(MARK_URI, () => r(t)); }); TEX.colorSpace = THREE.SRGBColorSpace; pend.forEach(f => f());
waveFlags(0);

// ---- merge: thousands of small meshes become a few per building and material (one draw each) ----
BASE.updateMatrixWorld(true);
const keyOf = c => { for (const k in BOX){ const b = BOX[k]; if (Math.abs(c.x - b.x) < b.w/2 + 0.3 && Math.abs(c.z - b.z) < b.d/2 + 0.3 && c.y > 0.35) return k; } return '_'; };
const groups = new Map(), drop = [], skip = new Set(FLAGS);
let lr = 11; const lrnd = () => (lr = (lr*16807)%2147483647)/2147483647;
BASE.traverse(o => { if (!o.isMesh || skip.has(o)) return;
  const c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()), k = keyOf(c);
  const lit = o.userData.win && lrnd() < 0.5;
  const m = o.material, sig = [m.type, m.color && m.color.getHex(), m.map && m.map.uuid, m.bumpMap && m.bumpMap.uuid, m.transparent, m.opacity, m.roughness, m.metalness, m.flatShading, m.side, m.envMapIntensity, m.emissive && m.emissive.getHex(), m.depthWrite].join(',');
  const id = k + '|' + sig + '|' + (o.castShadow ? 1 : 0) + '|' + (lit ? 1 : 0);
  if (!groups.has(id)) groups.set(id, { k, mat:o.material, cast:o.castShadow, lit, geos:[] });
  let g = o.geometry.clone().applyMatrix4(o.matrixWorld); if (g.index) g = g.toNonIndexed();
  for (const a of Object.keys(g.attributes)) if (!['position','normal','uv'].includes(a)) g.deleteAttribute(a);
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2), 2));
  groups.get(id).geos.push(g); drop.push(o); });
drop.forEach(o => o.parent.remove(o));
// one clip height per building: everything above it isn't built yet
const CUT = {}, BG = {}, LITM = {};
for (const k of [...Object.keys(BOX), '_']){ CUT[k] = { value: 999 }; BG[k] = new THREE.Group(); BG[k].userData.key = k; BASE.add(BG[k]); }
const clipped = (mat, k) => { const m = mat.clone(); if (mat.map) m.map = mat.map; if (mat.bumpMap) m.bumpMap = mat.bumpMap;
  if (k !== '_') { m.onBeforeCompile = sh => { sh.uniforms.uCut = CUT[k];
    sh.vertexShader = 'varying float vWY;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vWY = (modelMatrix * vec4(transformed, 1.0)).y;');
    sh.fragmentShader = 'varying float vWY;\nuniform float uCut;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n if (vWY > uCut) discard;'); };
    m.customProgramCacheKey = () => 'clip' + k; }
  return m; };
let draws = 0;
for (const g of groups.values()){ const geo = mergeGeometries(g.geos, false); if (!geo) continue;
  const mesh = new THREE.Mesh(geo, clipped(g.mat, g.k)); mesh.castShadow = g.cast; mesh.receiveShadow = true;
  if (g.lit){ mesh.userData.dark = mesh.material; mesh.userData.litM = clipped(LIT, g.k); (LITM[g.k] = LITM[g.k] || []).push(mesh); }
  BG[g.k].add(mesh); draws++; }

renderer.shadowMap.type = THREE.PCFShadowMap; renderer.shadowMap.autoUpdate = false; const shadowsDirty = () => { renderer.shadowMap.needsUpdate = true; };
// ---- an unfinished building is simply shorter, with its roof on (no sign of construction: Jose, 2026-10-26) ----
const CAP = {};
for (const k in BOX){ const b = BOX[k], cap = new THREE.Group(), roofM = M(k === 'n' ? 0xe9e4dc : 0xd9cdb8), unitM = M(0x8a8796);
  const slab = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.15, 0.22, b.d + 0.15), roofM); slab.position.set(b.x, 0.11, b.z); cap.add(slab);
  const u1 = new THREE.Mesh(new THREE.BoxGeometry(b.w*0.3, 0.38, b.d*0.28), unitM); u1.position.set(b.x - b.w*0.15, 0.4, b.z - b.d*0.1); cap.add(u1);
  const u2 = new THREE.Mesh(new THREE.BoxGeometry(b.w*0.16, 0.28, b.d*0.18), unitM); u2.position.set(b.x + b.w*0.25, 0.35, b.z + b.d*0.1); cap.add(u2);
  cap.traverse(o => { if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; } }); BG[k].add(cap); CAP[k] = cap; }
const BUILT = { e:0.8, t:0.35, s:0.6, n:0.5, c:0.7 };   // a sample learner, scaled by the slider
function setProgress(p){ for (const k in BOX){ const b = BOX[k], f = Math.min(1, p * BUILT[k] / 0.6);
    // whole floors only: the walls stop at the top of the last finished floor and the roof sits on them
    const floors = Math.max(1, Math.round((b.roof - 0.3) / FL)), done = Math.max(1, Math.round(f * floors)), cut = f >= 1 ? 999 : 0.3 + done * FL;
    CUT[k].value = cut; CAP[k].visible = f < 1; CAP[k].position.y = Math.min(cut, 900) - 0.02; } shadowsDirty(); }

// ---- the time of day: four looks, blended ----
const HEMI = scene.children.find(c => c.isHemisphereLight);
const KEYS = [
  { h:5,  dir:[0.3,0.12,0.9],  sun:0x7f95ff, si:0.5, sky:0x5a6ad0, ground:0x2a2a40, hi:0.3,  rim:0.4, bg:['#0b1030','#17204a','#2a2f66'], night:1 },
  { h:7.5,dir:[0.85,0.3,0.4],  sun:0xffd2a8, si:2.3, sky:0xbcd0f2, ground:0x7d6a58, hi:0.85, rim:0.6, bg:['#6f8fd8','#f2b8a0','#ffd9b0'], night:0 },
  { h:12, dir:[-0.25,0.95,0.3],sun:0xfff6e8, si:2.9, sky:0xcfe3ff, ground:0x8a7a60, hi:1.1,  rim:0.3, bg:['#6fa8ea','#a9d1f7','#e9f3ff'], night:0 },
  { h:18.5,dir:[-0.8,0.33,0.22],sun:0xffa458,si:3.2, sky:0xb6a6e8, ground:0x7d5a58, hi:0.75, rim:1.1, bg:['#3a2b62','#8a4570','#e88f72'], night:0 },
  { h:20.5,dir:[-0.7,0.2,0.3], sun:0xff7a5a, si:1.2, sky:0x6a5ab0, ground:0x3a2a40, hi:0.45, rim:0.8, bg:['#1d1844','#4b2a63','#a0507a'], night:0.6 },
  { h:22.5,dir:[0.3,0.12,0.9], sun:0x7f95ff, si:0.55,sky:0x5a6ad0, ground:0x2a2a40, hi:0.32, rim:0.5, bg:['#0b1030','#17204a','#2a2f66'], night:1 },
  { h:29, dir:[0.3,0.12,0.9],  sun:0x7f95ff, si:0.5, sky:0x5a6ad0, ground:0x2a2a40, hi:0.3,  rim:0.4, bg:['#0b1030','#17204a','#2a2f66'], night:1 } ];
const ca = new THREE.Color(), cb = new THREE.Color(), mix = (a, b, f) => '#' + ca.set(a).lerp(cb.set(b), f).getHexString();
let litNow = null;
function setHour(h){ const hh = h < 5 ? h + 24 : h; let i = 0; while (i < KEYS.length - 2 && KEYS[i+1].h <= hh) i++;
  const A = KEYS[i], B = KEYS[i+1], f = Math.max(0, Math.min(1, (hh - A.h) / (B.h - A.h)));
  const d = new THREE.Vector3(...A.dir).lerp(new THREE.Vector3(...B.dir), f).normalize();
  moon.position.copy(d).multiplyScalar(44); moon.color.set(A.sun).lerp(cb.set(B.sun), f); moon.intensity = A.si + (B.si - A.si)*f;
  HEMI.color.set(A.sky).lerp(cb.set(B.sky), f); HEMI.groundColor.set(A.ground).lerp(cb.set(B.ground), f); HEMI.intensity = A.hi + (B.hi - A.hi)*f; rim.intensity = A.rim + (B.rim - A.rim)*f;
  const n = A.night + (B.night - A.night)*f;
  document.documentElement.style.setProperty('--sky', `linear-gradient(${mix(A.bg[0],B.bg[0],f)}, ${mix(A.bg[1],B.bg[1],f)} 55%, ${mix(A.bg[2],B.bg[2],f)})`);
  GLOWS.forEach(g => { g.material.opacity = Math.min(1, n*1.4 + (hh > 17 && hh < 21 ? 0.6 : 0)); g.visible = g.material.opacity > 0.02; });
  const lit = n > 0.3; if (lit !== litNow){ litNow = lit; for (const k in LITM) LITM[k].forEach(m => m.material = lit ? m.userData.litM : m.userData.dark); }
  shadowsDirty(); hourNow = h;
  const hr = Math.floor(h) % 24, mi = Math.round((h % 1) * 60) % 60; $('hourOut').textContent = `${(hr % 12) || 12}:${String(mi).padStart(2,'0')} ${hr < 12 ? 'am' : 'pm'}`; }

// ---- the living things ----
[CAR_IN, CAR_OUT, AMB, HELI, BIRDS, CAR_IN2, ...STREET.map(o => o.g), ...WALKS.map(w => w.g), ...SITTERS.map(o => o.g)].forEach(g => g.visible = true);
SITTERS.forEach(o => o.g.position.set(...o.at)); IDLE.forEach(o => { o.set(0); o.g.visible = true; });
ambLights(0); const SPR = spray(9); const SPA = SPR.geometry.attributes.position, SPN = SPA.count;
const SPD = Array.from({ length:SPN }, (_, i) => [(i*2.399) % (Math.PI*2), (i*0.6180339) % 1, 0.35 + ((i*7) % 10)/18]);
function fountain(t){ for (let i = 0; i < SPN; i++){ const [a, ph, rmax] = SPD[i], u = (t*0.7 + ph) % 1, r = 0.05 + u*rmax;
    SPA.setXYZ(i, -0.1 + Math.cos(a)*r, 1.25 + Math.sin(u*Math.PI)*0.75 - u*0.45, -3.4 + Math.sin(a)*r); } SPA.needsUpdate = true; }
[CAR_IN, CAR_OUT, AMB, HELI, BIRDS, CAR_IN2, ...STREET.map(o => o.g), ...WALKS.map(w => w.g), ...SITTERS.map(o => o.g), ...IDLE.map(o => o.g)].forEach(g => g.traverse(o => { o.castShadow = false; }));
const along = (pts, u) => { const seg = []; let L = 0; for (let i = 1; i < pts.length; i++){ const l = Math.hypot(pts[i][0]-pts[i-1][0], pts[i][2]-pts[i-1][2]); seg.push(l); L += l; }
  let d = u * L; for (let i = 0; i < seg.length; i++){ if (d <= seg[i] || i === seg.length - 1){ const f = seg[i] ? Math.min(1, d/seg[i]) : 0, a = pts[i], b = pts[i+1];
    return [a[0] + (b[0]-a[0])*f, a[1] + (b[1]-a[1])*f, a[2] + (b[2]-a[2])*f, Math.atan2(b[0]-a[0], b[2]-a[2])]; } d -= seg[i]; } };
function life(t){ const loop = (dur, off=0) => ((t*1000 + off) % dur) / dur;
  { const u = loop(9000); CAR_IN.position.set(3.1, 0.2, 15.5 - u*22); CAR_IN.rotation.y = Math.PI; }
  { const u = loop(11000, 4000); CAR_OUT.position.set(-2.8, 0.2, -6.5 + u*22); CAR_OUT.rotation.y = 0; }
  { const u = loop(13000, 7000); CAR_IN2.position.set(2.0, 0.2, 15.5 - u*22); CAR_IN2.rotation.y = Math.PI; }
  { const u = loop(16000, 2000), p = along([[4.2,0.2,15.5],[4.2,0.2,2],[4.4,0.2,-4],[5.4,0.2,-7.2],[6.8,0.2,-8.0],[7.4,0.2,-8.4]], Math.min(1, u*1.4)); AMB.position.set(p[0], 0.2, p[2]); AMB.rotation.y = p[3]; if ((t*2|0) !== AMB.userData.f){ AMB.userData.f = t*2|0; ambLights(AMB.userData.f % 2); } }
  STREET.forEach((o, i) => { const u = loop(o.dur, i*3000); o.g.position.set(-21*o.dir + u*42*o.dir, 0.2, o.z); o.g.rotation.y = o.ry; });
  WALKS.forEach((w, i) => { const u = loop(w.dur, i*5000), p = along(w.pts, u); w.g.position.set(p[0], p[1], p[2]); w.g.rotation.y = p[3]; stride(w.g, (t*3.2 + i) % 2 < 1 ? 1 : 0); });
  IDLE.forEach((o, i) => o.set(((t + i*1.7) % 7) < 1.2 ? 1 : 0));
  HELI.position.set(PAD.x + Math.cos(t*0.25)*5, PAD.y + 3 + Math.sin(t*0.7)*0.4, PAD.z + Math.sin(t*0.25)*5); HELI.rotation.y = -t*0.25; HELI.userData.rotor.rotation.y = t*18;
  BIRDS.position.set(-30 + ((t*2.2) % 60), 14 + Math.sin(t*0.5), -10); BIRDS.rotation.y = Math.PI/2; flap(BIRDS, (t*4|0) % 2);
  waveFlags(t*3); fountain(t); petalsAt(t);
  CLOUDS.forEach((c, i) => c.position.y += Math.sin(t*0.4 + i)*0.004); }

// ---- petals drifting down from the blossoms ----
const PN = 160, PET = new Float32Array(PN*3), PD = [];
for (let i = 0; i < PN; i++){ const [x, z, s] = BLOSSOMS[i % BLOSSOMS.length]; PD.push([x, z, s, (i*0.618) % 1, (i*2.399) % 6.283]); }
const petals = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(PET, 3)), new THREE.PointsMaterial({ color:0xffc6d8, size:0.16, transparent:true, opacity:0.95, depthWrite:false }));
scene.add(petals);
function petalsAt(t){ for (let i = 0; i < PN; i++){ const [x, z, s, ph, a] = PD[i], u = (t*0.09 + ph) % 1, h = 0.5 + 1.9*s;
    PET[i*3] = x + Math.cos(a)*0.9*s + Math.sin(t*1.3 + a)*0.35 + u*1.6; PET[i*3+1] = 0.3 + h*(1 - u); PET[i*3+2] = z + Math.sin(a)*0.9*s + Math.cos(t*1.1 + a)*0.3; }
  petals.geometry.attributes.position.needsUpdate = true; }
petalsAt(0);

// ---- the sun: a big smiling face in the sky behind the campus, on your clock; at night a sleepy moon ----
const SUN = $('sun'); let hourNow = 18.5;
function sunAt(){ const h = hourNow, day = h >= 6 && h < 19.75, e = day ? Math.sin(Math.PI * (h - 6) / 13.75) : 0.75;
  SUN.classList.toggle('is-night', !day);
  const camAz = Math.atan2(cam.position.x - controls.target.x, cam.position.z - controls.target.z), sunAz = day ? -1.2 + (h - 6) / 13.75 * 2.4 : 0.6;
  const rel = Math.atan2(Math.sin(sunAz - camAz + Math.PI), Math.cos(sunAz - camAz + Math.PI)), W = innerWidth, H = innerHeight;
  const x = W*0.5 + Math.sin(rel)*W*0.42, y = H*(0.36 - e*0.22) + Math.cos(controls.getPolarAngle())*H*0.05, s = 0.8 + 0.25*e;
  SUN.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) scale(${s.toFixed(3)})`; }
function giggle(){ SUN.classList.remove('giggle'); void SUN.offsetWidth; SUN.classList.add('giggle'); }

// ---- the camera: drag to spin, pinch to zoom ----
cam.clearViewOffset();
const controls = new OrbitControls(cam, renderer.domElement);
controls.target.set(0.5, -1.5, -3); controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false;
controls.minPolarAngle = 0.3; controls.maxPolarAngle = 1.32; controls.minDistance = 45; controls.maxDistance = 190; controls.rotateSpeed = 0.7;
function fit(){ const w = innerWidth, h = innerHeight; renderer.setSize(w, h); const a = w/h;
  cam.aspect = a; cam.fov = Math.min(46, 2*Math.atan(Math.tan(THREE.MathUtils.degToRad(11.5)) / Math.min(a, 1.15)) * 180/Math.PI); cam.updateProjectionMatrix(); }
let DPR = Math.min(devicePixelRatio, 1.5); renderer.setPixelRatio(DPR); fit(); addEventListener('resize', fit);
cam.position.set(-34, 70, 82); controls.update();

// ---- tap a building: it lifts off the board ----
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64), new THREE.MeshBasicMaterial({ color:0xffd27a, transparent:true, opacity:0.9, side:THREE.DoubleSide, depthWrite:false }));
ring.rotation.x = -Math.PI/2; ring.visible = false; scene.add(ring);
let picked = null; const LIFT = {}; for (const k in BOX) LIFT[k] = { y:0, v:0 };
function pick(k){ picked = k === picked ? null : k;
  if (picked){ const b = BOX[picked], s = Math.max(b.w, b.d)*0.62; ring.scale.set(b.w/Math.max(b.w,b.d)*s, b.d/Math.max(b.w,b.d)*s, 1); ring.position.set(b.x, 0.34, b.z); ring.visible = true;
    const [name, place, w] = NAMES[picked], f = Math.min(1, +$('prog').value/100 * BUILT[picked] / 0.6);
    $('cardK').textContent = name; $('cardP').textContent = `${place} · ${w}% of the exam`; $('cardF').textContent = f >= 1 ? 'Finished!' : `${Math.round(f*100)}% built`; $('card').hidden = false; }
  else { ring.visible = false; $('card').hidden = true; }
  document.querySelectorAll('.badge').forEach(el => el.classList.toggle('on', el.dataset.k === picked)); }
let down = null;
renderer.domElement.addEventListener('pointerdown', e => { down = { x:e.clientX, y:e.clientY, t:performance.now() }; });
renderer.domElement.addEventListener('pointerup', e => { if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), quick = performance.now() - down.t < 350; down = null;
  if (moved > 8 || !quick) return; { const sr = SUN.getBoundingClientRect(); if (e.clientX > sr.left && e.clientX < sr.right && e.clientY > sr.top && e.clientY < sr.bottom){ giggle(); return; } }
  const r = renderer.domElement.getBoundingClientRect(); ndc.set((e.clientX - r.left)/r.width*2 - 1, -(e.clientY - r.top)/r.height*2 + 1); ray.setFromCamera(ndc, cam);
  const hits = ray.intersectObjects(Object.keys(BOX).map(k => BG[k]), true).filter(h => h.object.visible);
  let k = null; for (const h of hits){ let o = h.object; while (o && !(o.userData.key in BOX)) o = o.parent; if (o){ k = o.userData.key; break; } }
  pick(k); });
$('cardX').onclick = () => pick(null);

// ---- badges over the roofs ----
const BADGES = {}; for (const k in BOX){ const el = document.createElement('button'); el.className = 'badge'; el.dataset.k = k; el.innerHTML = `${NAMES[k][0]} <b></b>`; el.onclick = () => pick(k); $('badges').appendChild(el); BADGES[k] = el; }
const v3 = new THREE.Vector3();
function badges(){ const r = renderer.domElement.getBoundingClientRect(), p = +$('prog').value/100, at = [];
  for (const k in BOX){ const b = BOX[k], f = Math.min(1, p * BUILT[k] / 0.6), y = Math.min(b.top, CUT[k].value) + 0.9 + LIFT[k].y;
    v3.set(b.x, y, b.z).project(cam); const el = BADGES[k], txt = f >= 1 ? '★' : Math.round(f*100) + '%', bb = el.querySelector('b'); if (bb.textContent !== txt) bb.textContent = txt; el.classList.toggle('done', f >= 1);
    if (!el._w || el._t !== el.textContent){ el._t = el.textContent; el._w = el.offsetWidth; el._h = el.offsetHeight; }
    at.push({ el, x:(v3.x+1)/2*r.width, y:(1-v3.y)/2*r.height, w:el._w, h:el._h }); }
  // nearest first; a badge that would cover one already placed moves up above it
  at.sort((a, b) => b.y - a.y); const placed = [];
  for (const a of at){ for (let g = 0; g < 8; g++){ const hit = placed.find(q => Math.abs(q.x - a.x) < (q.w + a.w)/2 + 4 && Math.abs(q.y - a.y) < a.h + 3); if (!hit) break; a.y = hit.y - a.h - 4; }
    placed.push(a); a.el.style.transform = `translate(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px) translate(-50%, -100%)`; } }

// ---- controls in the sheet ----
const nowH = () => { const d = new Date(); return d.getHours() + d.getMinutes()/60; };
let follow = true;
$('hour').value = nowH(); setHour(nowH());
$('hour').oninput = e => { follow = false; $('now').classList.remove('on'); setHour(+e.target.value); };
$('now').onclick = () => { follow = true; $('now').classList.add('on'); $('hour').value = nowH(); setHour(nowH()); };
$('prog').oninput = e => { setProgress(+e.target.value/100); if (picked) { const k = picked; picked = null; pick(k); } }; setProgress(0.6);

// ---- the loop, with a frame meter ----
let slowSecs = 0, last = performance.now(), frames = 0, acc = 0, worst = 0, t0 = last;
function frame(now){ const dt = now - last; last = now; frames++; acc += dt; worst = Math.max(worst, dt);
  if (acc > 1000){ const fps = frames*1000/acc; $('fps').textContent = `${Math.round(fps)} fps`; $('fps').classList.toggle('slow', fps < 45);
    slowSecs = fps < 42 ? slowSecs + 1 : 0; if (slowSecs >= 2 && DPR > 1){ DPR = Math.max(1, DPR - 0.25); renderer.setPixelRatio(DPR); fit(); slowSecs = 0; }
    $('draws').textContent = `${DPR}x · ${draws} draws`; frames = 0; acc = 0; worst = 0; }
  const t = (now - t0)/1000; if (!REDUCE) life(t);
  for (const k in BOX){ const L = LIFT[k], goal = k === picked ? 1.6 : 0; L.v += (goal - L.y)*0.12; L.v *= 0.72; L.y += L.v; if (Math.abs(L.y - BG[k].position.y) > 0.002) shadowsDirty(); BG[k].position.y = L.y; }
  if (ring.visible) ring.material.opacity = 0.6 + Math.sin(t*4)*0.3;
  if (follow && frames === 1) setHour(nowH());
  controls.update(); renderer.render(scene, cam); badges(); sunAt(); requestAnimationFrame(frame); }
life(0); $("draws").textContent = `${draws} draws`;
document.body.classList.add('ready');
requestAnimationFrame(frame);
