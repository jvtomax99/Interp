// ---- the Meshy models (cars.json, from cars_bake.py and meshy_bake.cjs). It comes first: the benches are built from it
// long before cars.js runs.
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
