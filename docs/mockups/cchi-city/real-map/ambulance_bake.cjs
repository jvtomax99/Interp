// The campus's ambulance from Meshy (Jose, 2026-11-06): the Blender-slimmed model in ../assets/meshy-ambulance/ packed
// into cars.json as `ambulance.mesh`, which cars.js draws with its texture. Run it after cars_bake.py, which writes the
// kit's ambulance back:   node ambulance_bake.cjs
// The GLB is already in campus units, facing +z, wheels at y 0.1 (the Blender export; README, "The Meshy ambulance").
const fs = require('fs'), path = require('path');
const HERE = __dirname, DIR = path.join(HERE, '..', 'assets', 'meshy-ambulance'), OUT = path.join(HERE, 'cars.json');

const b = fs.readFileSync(path.join(DIR, 'ambulance.glb'));
const jsonLen = b.readUInt32LE(12), j = JSON.parse(b.toString('utf8', 20, 20 + jsonLen));
const binStart = 20 + jsonLen + 8;
const prim = j.meshes[0].primitives[0];
if (j.meshes.length !== 1 || j.meshes[0].primitives.length !== 1) throw new Error('expected one mesh, one primitive');
const SIZE = { SCALAR: 1, VEC2: 2, VEC3: 3 };
function acc(i){
  const a = j.accessors[i], v = j.bufferViews[a.bufferView], n = a.count*SIZE[a.type];
  const T = { 5126: Float32Array, 5123: Uint16Array, 5125: Uint32Array, 5121: Uint8Array }[a.componentType];
  const off = binStart + (v.byteOffset || 0) + (a.byteOffset || 0);
  return new T(b.buffer.slice(b.byteOffset + off, b.byteOffset + off + n*T.BYTES_PER_ELEMENT));
}
const pos = acc(prim.attributes.POSITION), nrm = acc(prim.attributes.NORMAL), uv = acc(prim.attributes.TEXCOORD_0), idx = acc(prim.indices);
const n = pos.length/3, tris = idx.length/3;
if (n > 65535) throw new Error('too many vertices for 16-bit indices');

const min = [0, 1, 2].map(a => { let m = Infinity; for (let i = a; i < pos.length; i += 3) m = Math.min(m, pos[i]); return +m.toFixed(5); });
const max = [0, 1, 2].map(a => { let m = -Infinity; for (let i = a; i < pos.length; i += 3) m = Math.max(m, pos[i]); return +m.toFixed(5); });
const size = max.map((v, a) => +(v - min[a]).toFixed(5));
const qPos = new Uint16Array(pos.length), qNrm = new Int8Array(nrm.length), qUv = new Uint16Array(uv.length);
for (let i = 0; i < pos.length; i++) qPos[i] = Math.round((pos[i] - min[i%3])/size[i%3]*65535);
for (let i = 0; i < nrm.length; i++) qNrm[i] = Math.round(nrm[i]*127);
for (let i = 0; i < uv.length; i++) qUv[i] = Math.round(Math.min(1, Math.max(0, uv[i]))*65535);
const b64 = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');

const cars = JSON.parse(fs.readFileSync(OUT, 'utf8'));
cars.ambulance = {
  lamps: [[-0.171, 0.805, 0.515], [0.171, 0.805, 0.515]], top: 0.83,   // the light bar's two blue ends (measured in Blender)
  mesh: { min, size, pos: b64(qPos), nrm: b64(qNrm), uv: b64(qUv), idx: b64(Uint16Array.from(idx)),
          tex: 'data:image/webp;base64,' + fs.readFileSync(path.join(DIR, 'ambulance.webp')).toString('base64') } };
fs.writeFileSync(OUT, JSON.stringify(cars));
const m = cars.ambulance.mesh;
console.log(`${n} vertices, ${tris} triangles; box`, min, max);
console.log('page bytes:', JSON.stringify(cars.ambulance).length, 'of which texture', m.tex.length);
