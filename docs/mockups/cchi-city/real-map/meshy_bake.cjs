// The campus's Meshy models (Jose, 2026-11-06/07): each Blender-slimmed model in ../assets/meshy-*/ packed into cars.json
// as its entry's `mesh`, which cars.js draws with its texture. Run it after cars_bake.py, which writes the kit's ambulance
// back and drops the helicopter:   node meshy_bake.cjs
// Each GLB is already in campus units, facing +z (the Blender export; README, "The Meshy ambulance", "The Meshy helicopter", "The Meshy bench").
const fs = require('fs'), path = require('path');
const HERE = __dirname, OUT = path.join(HERE, 'cars.json');
const MODELS = {
  ambulance: { dir: 'meshy-ambulance', file: 'ambulance', extra: {
    lamps: [[-0.171, 0.805, 0.515], [0.171, 0.805, 0.515]], top: 0.83 } },   // the light bar's two blue ends (measured in Blender)
  heli: { dir: 'meshy-helicopter', file: 'helicopter', extra: {
    rotor: [0, 0.628, -0.307], light: [0, -0.092, 0.637] } },                // its hub, for the app's spinning rotor; the nose light
  bench: { dir: 'meshy-bench', file: 'bench', extra: {} } };

function pack({ dir, file }){
  const D = path.join(HERE, '..', 'assets', dir), b = fs.readFileSync(path.join(D, file + '.glb'));
  const jsonLen = b.readUInt32LE(12), j = JSON.parse(b.toString('utf8', 20, 20 + jsonLen));
  const binStart = 20 + jsonLen + 8, prim = j.meshes[0].primitives[0];
  if (j.meshes.length !== 1 || j.meshes[0].primitives.length !== 1) throw new Error(file + ': expected one mesh, one primitive');
  const SIZE = { SCALAR: 1, VEC2: 2, VEC3: 3 };
  const acc = i => {
    const a = j.accessors[i], v = j.bufferViews[a.bufferView], n = a.count*SIZE[a.type];
    const T = { 5126: Float32Array, 5123: Uint16Array, 5125: Uint32Array, 5121: Uint8Array }[a.componentType];
    const off = binStart + (v.byteOffset || 0) + (a.byteOffset || 0);
    return new T(b.buffer.slice(b.byteOffset + off, b.byteOffset + off + n*T.BYTES_PER_ELEMENT)); };
  const pos = acc(prim.attributes.POSITION), nrm = acc(prim.attributes.NORMAL), uv = acc(prim.attributes.TEXCOORD_0), idx = acc(prim.indices);
  const n = pos.length/3, tris = idx.length/3;
  if (n > 65535) throw new Error(file + ': too many vertices for 16-bit indices');
  const bound = (f, s) => [0, 1, 2].map(a => { let m = s; for (let i = a; i < pos.length; i += 3) m = f(m, pos[i]); return +m.toFixed(5); });
  const min = bound(Math.min, Infinity), max = bound(Math.max, -Infinity), size = max.map((v, a) => +(v - min[a]).toFixed(5));
  const qPos = new Uint16Array(pos.length), qNrm = new Int8Array(nrm.length), qUv = new Uint16Array(uv.length);
  for (let i = 0; i < pos.length; i++) qPos[i] = Math.round((pos[i] - min[i%3])/size[i%3]*65535);
  for (let i = 0; i < nrm.length; i++) qNrm[i] = Math.round(nrm[i]*127);
  for (let i = 0; i < uv.length; i++) qUv[i] = Math.round(Math.min(1, Math.max(0, uv[i]))*65535);
  const b64 = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
  console.log(`${file}: ${n} vertices, ${tris} triangles; box`, min, max);
  return { min, size, pos: b64(qPos), nrm: b64(qNrm), uv: b64(qUv), idx: b64(Uint16Array.from(idx)),
           tex: 'data:image/webp;base64,' + fs.readFileSync(path.join(D, file + '.webp')).toString('base64') };
}
const cars = JSON.parse(fs.readFileSync(OUT, 'utf8'));
for (const [name, m] of Object.entries(MODELS)){ cars[name] = { ...m.extra, mesh: pack(m) }; console.log(name, 'page bytes:', JSON.stringify(cars[name]).length); }
fs.writeFileSync(OUT, JSON.stringify(cars));
