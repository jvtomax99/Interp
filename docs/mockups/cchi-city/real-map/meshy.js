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
// The trees (Jose, 2026-11-07: "like the picture I gave you" but "with their respective colors", the sakura trees pink, the others
// green; "the leafs to have better graphics and more details"). One kind of tree, after his picture: a thick trunk that twists
// as it rises and flares into roots, curved limbs, one up into each of several great dense masses of leaves, each mass bright
// on top, dark under it and where it meets the next. The leaves are pictures in colour (leaf_card.cjs): green, autumn red, pink.
const FOLIAGE = {}, BARK_T = new THREE.MeshStandardMaterial({ color:0x74452f, roughness:0.85, metalness:0 });
function foliage(kind){
  if (FOLIAGE[kind]) return FOLIAGE[kind];
  const t = new THREE.TextureLoader().load(KIT.foliage[kind]); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const mats = [0.64, 0.82, 0.97, 1.1].map(v => new THREE.MeshStandardMaterial({ map:t, alphaTest:0.45, color:new THREE.Color(v, v, v), roughness:0.85, metalness:0, envMapIntensity:0.3 }));
  mats.core = new THREE.MeshStandardMaterial({ color:{ green:0x30502a, red:0x7a3218, pink:0x86385e }[kind], roughness:1, metalness:0, envMapIntensity:0.08 });   // inside each mass, so no sky shows through
  return FOLIAGE[kind] = mats; }
// One mass: a dark low core under a coat of n leaf cards, two triangles a side, lit from the mass's own middle, mostly facing out
// (a card seen edge-on is a streak). mats run dark (below) to light (above). core: the core's detail, -1 for none.
function lobe(lx, ly, lz, R, mats, s, r, n, sz=1, core=1, out=null){
  const own = !out; out = out || mats.map(() => ({ p:[], n:[], u:[] }));
  if (core >= 0){ const k = add(new THREE.IcosahedronGeometry(R*0.58, core), mats.core, lx, ly - R*0.08, lz); k.scale.y = 0.86; }
  const V = (x, y, z) => new THREE.Vector3(x, y, z), rnd = () => V(r() - 0.5, r() - 0.5, r() - 0.5);
  for (let k = 0; k < n; k++){
    const d = rnd().normalize(); d.y = d.y*0.9 + 0.12; d.normalize();
    const rr = 0.68 + r()*0.44, p = V(lx + d.x*R*rr, ly + d.y*R*rr*0.86, lz + d.z*R*rr), N = d.clone();
    const T = N.clone().add(rnd().multiplyScalar(0.7)).normalize();
    const U = V(0, 1, 0).cross(T); if (U.lengthSq() < 0.01) U.set(1, 0, 0); U.normalize(); const W = T.clone().cross(U).normalize();
    const a = r()*Math.PI*2, c = Math.cos(a), sn = Math.sin(a), h = (0.3 + r()*0.2)*s*sz, A = U.clone().multiplyScalar(c*h).addScaledVector(W, sn*h), E = U.clone().multiplyScalar(-sn*h).addScaledVector(W, c*h);
    const P = [p.clone().sub(A).sub(E), p.clone().add(A).sub(E), p.clone().add(A).add(E), p.clone().sub(A).add(E)], UV = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const up = N.y*0.75 + (r() - 0.5)*0.45, level = Math.max(0, Math.min(mats.length - 1, Math.floor((up + 0.75)/1.55*mats.length))), o = out[level];
    for (const i of [0, 1, 2, 0, 2, 3, 2, 1, 0, 3, 2, 0]){ o.p.push(P[i].x, P[i].y, P[i].z); o.n.push(N.x, N.y, N.z); o.u.push(UV[i][0], UV[i][1]); } }
  if (own) flush(out, mats);
  return out; }
function flush(out, mats){ out.forEach((o, i) => { if (!o.p.length) return; const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(o.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(o.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(o.u, 2)); add(g, mats[i], 0, 0, 0); }); }
// A sculpted limb or trunk: a tube along a smooth curve through pts, its radius running through radii from start to end.
function tube(pts, radii, mat, radial=8, per=3){
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), segs = Math.max(3, (pts.length - 1)*per);
  const g = new THREE.TubeGeometry(curve, segs, 1, radial, false), p = g.attributes.position, c = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i <= segs; i++){ const t = i/segs, f = t*(radii.length - 1), k = Math.min(radii.length - 2, Math.floor(f)), rad = radii[k] + (radii[k + 1] - radii[k])*(f - k);
    curve.getPointAt(t, c);
    for (let j = 0; j <= radial; j++){ const n = i*(radial + 1) + j; v.fromBufferAttribute(p, n).sub(c).multiplyScalar(rad).add(c); p.setXYZ(n, v.x, v.y, v.z); } }
  g.computeVertexNormals(); return add(g, mat, 0, 0, 0); }
// The tree. kind: 'green', 'red' or 'pink'. c: its build (TREE_FRONT for the street trees, TREE_BACK for the back's many, lighter
// ones, TREE_IMUS for the sakura by Don Imus): trunk height H and radius tr, roots, masses (lobes, spread from the trunk, radius
// R), leaf cards per mass and their size, the core's detail (blossom has none: a cherry stays a little airy), the tubes' sides.
const TREE_FRONT = { H:1.02, tr:0.15, roots:3, lobes:7, spread:0.7, R:0.44, cards:40, sz:0.5, core:1, radial:6, rl:5 };
const TREE_BACK = { H:0.92, tr:0.13, roots:0, lobes:5, spread:0.6, R:0.4, cards:30, sz:0.52, core:0, radial:5, rl:4 };
const TREE_IMUS = { H:0.95, tr:0.22, roots:5, lobes:10, spread:0.95, R:0.5, cards:84, sz:0.5, core:-1, radial:10, rl:7 };
function pictureTree(x, z, s, kind, c){
  const r = rngAt(x + 0.37, z - 0.11), mats = foliage(kind), H = c.H*s, fx = x + (r() - 0.5)*0.16*s, fz = z + (r() - 0.5)*0.16*s, fy = 0.3 + H;
  tube([[x, 0.26, z], [x + (r() - 0.3)*0.1*s, 0.3 + H*0.34, z + (r() - 0.5)*0.1*s], [x - (r() - 0.3)*0.08*s, 0.3 + H*0.68, z + (r() - 0.5)*0.08*s], [fx, fy, fz]],
    [c.tr*s, c.tr*0.72*s, c.tr*0.6*s, c.tr*0.5*s], BARK_T, c.radial);
  for (let k = 0; k < c.roots; k++){ const a = k/c.roots*Math.PI*2 + r()*0.6, d = (c.tr*1.25 + r()*0.08)*s;   // roots flaring out into the ground
    tube([[x + Math.cos(a)*d, 0.29, z + Math.sin(a)*d], [x + Math.cos(a)*d*0.45, 0.35, z + Math.sin(a)*d*0.45], [x, 0.3 + c.tr*2.2*s, z]], [0.02*s, c.tr*0.32*s, c.tr*0.55*s], BARK_T, 4, 3); }
  const lobes = [], ring = c.lobes - (c.lobes > 7 ? 2 : 1);   // a ring of masses, one or two high in the middle
  for (let k = 0; k < ring; k++){ const a = k/ring*Math.PI*2 + r()*0.5, d = c.spread*(0.78 + r()*0.32)*s;
    lobes.push([fx + Math.cos(a)*d, fy + (0.36 + r()*0.3)*s, fz + Math.sin(a)*d, c.R*(0.88 + r()*0.24)*s]); }
  for (let k = ring; k < c.lobes; k++){ const a = k*Math.PI + r(), d = 0.26*s; lobes.push([fx + Math.cos(a)*d, fy + (0.85 + r()*0.18)*s, fz + Math.sin(a)*d, c.R*(1.04 + r()*0.12)*s]); }
  const out = mats.map(() => ({ p:[], n:[], u:[] })), n0 = Math.round(c.cards*(LITE ? 0.8 : 1));
  for (const [lx, ly, lz, R] of lobes){
    tube([[fx, fy - 0.06*s, fz], [fx + (lx - fx)*0.5, fy + (ly - fy)*0.35 + 0.1*s, fz + (lz - fz)*0.5], [fx + (lx - fx)*0.82, ly - R*0.35, fz + (lz - fz)*0.82]],
      [c.tr*0.45*s, c.tr*0.3*s, 0.022*s], BARK_T, c.rl, 3);   // a curved limb up into the mass
    lobe(lx, ly, lz, R, mats, s, r, Math.round(n0*R/(c.R*s)), c.sz, kind === 'pink' ? -1 : c.core, out); }
  flush(out, mats);
  if (kind === 'pink') for (let q = 0; q < 10 + c.roots*4; q++){ const a = r()*Math.PI*2, d = (0.2 + r()*1.1)*s*c.spread;   // petals on the ground
    add(new THREE.CircleGeometry(0.035 + r()*0.03, 5), PETAL_GROUND, x + Math.cos(a)*d, 0.37, z + Math.sin(a)*d, false).rotation.x = -Math.PI/2; } }
const PETAL_GROUND = new THREE.MeshStandardMaterial({ color:0xf7b8cf, roughness:0.8 });
