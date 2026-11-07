// ---- the Meshy models (cars.json, from cars_bake.py and meshy_bake.cjs). It comes first: the benches and the trees are
// built from it long before cars.js runs.
const KIT = __CARS__;
// Meshy's models (Jose, 2026-11-06/07), slimmed in Blender and packed by meshy_bake.cjs: smooth where the model is round,
// each with its own picture, so unlike the kit they need no colours per vertex or repainting.
const MESHY_GEO = {}, MESHY_MAT = {};
function meshyGeo(name){
  if (MESHY_GEO[name]) return MESHY_GEO[name];
  const e = KIT[name].mesh, bytes = s => Uint8Array.from(atob(s), c => c.charCodeAt(0)).buffer;
  const q = new Uint16Array(bytes(e.pos)), p = new Float32Array(q.length), uq = new Uint16Array(bytes(e.uv)), u = new Float32Array(uq.length);
  for (let i = 0; i < q.length; i++) p[i] = e.min[i%3] + q[i]/65535*e.size[i%3];
  for (let i = 0; i < uq.length; i++) u[i] = uq[i]/65535;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(bytes(e.nrm)), 3, true));
  g.setAttribute('uv', new THREE.BufferAttribute(u, 2));
  g.setIndex(new THREE.BufferAttribute(new Uint16Array(bytes(e.idx)), 1));
  return MESHY_GEO[name] = g; }
function meshyMat(name){
  if (MESHY_MAT[name]) return MESHY_MAT[name];
  const t = new THREE.TextureLoader().load(KIT[name].mesh.tex); t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; t.anisotropy = 4;   // glTF's uv: v runs down
  const matte = name === 'bench';   // wood, not paint: no shine, and a little darker to sit with the campus
  return MESHY_MAT[name] = new THREE.MeshStandardMaterial({ map:t, color:name === 'bench' ? 0xc2a286 : 0xffffff, roughness:matte ? 0.9 : 0.42, metalness:matte ? 0 : 0.1, envMapIntensity:matte ? 0.3 : 0.55 }); }
// The trees' leaves (Jose, 2026-11-07, "more like real trees"): cut-out sprays of leaves (leaf_card.cjs) tinted by each tree's own
// colours. leafy() gives a leaf material the spray; alphaTest cuts each leaf out, and the shadows too.
const LEAF_TEX = new THREE.TextureLoader().load(KIT.leaf.tex); LEAF_TEX.colorSpace = THREE.NoColorSpace; LEAF_TEX.anisotropy = 4;
const LEAFY = new Map();
function leafy(m){ if (!LEAFY.has(m)){ const c = m.clone(); c.map = LEAF_TEX; c.alphaTest = 0.4; c.color.multiplyScalar(1.12); c.roughness = 0.95; c.metalness = 0; c.envMapIntensity = 0.25; LEAFY.set(m, c); } return LEAFY.get(m); }
// A crown of n sprays gathered in five to seven uneven boughs. Each spray is two triangles a side. Its light comes from where it
// sits in the crown, so the whole tree shades as one soft shape while its edge stays leaves; mats runs dark (below) to light (above).
function cardCrown(cx, cy, cz, RX, RY, mats, s, r, n){
  const nl = 5 + Math.floor(r()*3), boughs = [], out = mats.map(() => ({ p:[], n:[], u:[] }));
  for (let i = 0; i < nl; i++){ const th = i/nl*Math.PI*2 + r()*0.7, ph = 0.45 + r()*1.0;
    boughs.push([cx + Math.cos(th)*Math.sin(ph)*RX*0.62, cy + Math.cos(ph)*RY*0.62, cz + Math.sin(th)*Math.sin(ph)*RX*0.62, (0.5 + r()*0.2)*RX]); }
  const V = (x, y, z) => new THREE.Vector3(x, y, z), rnd = () => V(r() - 0.5, r() - 0.5, r() - 0.5);
  for (let k = 0; k < n; k++){ const B = boughs[k % nl], d = rnd().normalize(), rr = 0.45 + r()*0.6;
    const p = V(B[0] + d.x*B[3]*rr, B[1] + d.y*B[3]*rr*0.8, B[2] + d.z*B[3]*rr), N = p.clone().sub(V(cx, cy - RY*0.35, cz)).normalize();
    const T = N.clone().add(rnd().multiplyScalar(0.8)).normalize();   // mostly facing out: a spray seen edge-on is a streak
    const U = V(0, 1, 0).cross(T); if (U.lengthSq() < 0.01) U.set(1, 0, 0); U.normalize(); const W = T.clone().cross(U).normalize();
    const a = r()*Math.PI*2, c = Math.cos(a), sn = Math.sin(a), h = (0.375 + r()*0.25)*s, A = U.clone().multiplyScalar(c*h).addScaledVector(W, sn*h), E = U.clone().multiplyScalar(-sn*h).addScaledVector(W, c*h);
    const P = [p.clone().sub(A).sub(E), p.clone().add(A).sub(E), p.clone().add(A).add(E), p.clone().sub(A).add(E)], UV = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const up = (p.y - cy)/RY + rr*0.5 + (r() - 0.5)*0.5, level = Math.max(0, Math.min(mats.length - 1, Math.floor((up + 0.55)/1.5*mats.length))), o = out[level];
    for (const i of [0, 1, 2, 0, 2, 3, 2, 1, 0, 3, 2, 0]){ o.p.push(P[i].x, P[i].y, P[i].z); o.n.push(N.x, N.y, N.z); o.u.push(UV[i][0], UV[i][1]); } }
  out.forEach((o, i) => { if (!o.p.length) return; const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(o.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(o.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(o.u, 2)); add(g, mats[i], 0, 0, 0); }); }
