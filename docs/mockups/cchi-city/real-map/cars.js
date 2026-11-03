// ---- the moving cars and ambulances (Jose, 2026-11-03: "cars on the road only"): Kenney's Car Kit (CC0,
// ../assets/kenney-car-kit/), baked by cars_bake.py into cars.json. vehicle() still builds the hand-made car with its
// lights; its body is swapped for the model's two meshes: its paint, in the car's own colour, and the rest (windows,
// tyres, lights, trim) in the kit's colours. The yellow cars are taxis; the rest take turns as sedan, SUV, hatchback, van.
// The parked cars (kitParked, below) are the kit's too; the bus and the helicopter stay hand-made.
const KIT = __CARS__, KIT_GEO = {}, KIT_CARS = ['sedan', 'suv', 'hatchbackSports', 'van'];
const KIT_REST = new THREE.MeshStandardMaterial({ vertexColors:true, roughness:0.5, metalness:0.15, envMapIntensity:0.5 });
let kitN = 0;
function kitPart(e, withCol){
  const bytes = s => Uint8Array.from(atob(s), c => c.charCodeAt(0)).buffer;
  const q = new Uint16Array(bytes(e.pos)), n = q.length/3, p = new Float32Array(q.length);
  for (let i = 0; i < n; i++) for (let a = 0; a < 3; a++) p[i*3 + a] = e.min[a] + q[i*3 + a]/65535*e.size[a];
  let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setIndex(new THREE.BufferAttribute(new Uint16Array(bytes(e.idx)), 1));
  if (withCol){ const c = new Uint8Array(bytes(e.col)), f = new Float32Array(n*3), k = new THREE.Color();
    for (let i = 0; i < n; i++){ k.setRGB(c[i*3]/255, c[i*3 + 1]/255, c[i*3 + 2]/255, THREE.SRGBColorSpace); f[i*3] = k.r; f[i*3 + 1] = k.g; f[i*3 + 2] = k.b; }
    g.setAttribute('color', new THREE.BufferAttribute(f, 3)); }
  g = g.toNonIndexed(); g.computeVertexNormals(); return g; }   // flat faces, as the kit is drawn
const vehicleHandMade = vehicle;
vehicle = (kind, col) => { const g = vehicleHandMade(kind, col);
  if (kind !== 'car' && kind !== 'amb') return g;
  const name = kind === 'amb' ? 'ambulance' : col === 0xf2c94c ? 'taxi' : KIT_CARS[kitN++ % KIT_CARS.length];
  const geo = KIT_GEO[name] || (KIT_GEO[name] = { paint: kitPart(KIT[name].paint, false), rest: kitPart(KIT[name].rest, true) });
  g.children.filter(c => c.isMesh && c.geometry.type !== 'SphereGeometry').forEach(c => g.remove(c));   // the body; the lights stay
  const paint = new THREE.Mesh(geo.paint, new THREE.MeshStandardMaterial({ color:col, roughness:0.3, metalness:0.45, envMapIntensity:0.6 })), rest = new THREE.Mesh(geo.rest, KIT_REST);
  for (const m of [paint, rest]){ m.castShadow = true; m.receiveShadow = true; g.add(m); }
  if (name === 'ambulance'){   // its flashing lamps and their glow go up onto the kit's light bar
    const y = KIT.ambulance.top - 0.05, lamps = KIT.ambulance.lamps.map(([x, , z]) => [x, y, z]); g.userData.lamps = g.userData.lights = lamps;
    let i = 0; g.children.forEach(c => { if ((c.isMesh && c.geometry.type === 'SphereGeometry') || c.isSprite){ const [x, y2, z] = lamps[Math.min(1, (i++ >> 1))]; c.position.set(x, y2, z + (c.isSprite ? 0.05 : 0)); } }); }
  g.userData.kit = name; return g; };
// ---- the parked cars (Jose, 2026-11-03): the lots, the garage roofs, the drive's curb, the Visitor Parking court. The
// kit's slimmed copies (KIT.park, cars_bake.py: the old parked car's size, nothing underneath, simple wheels), the four
// models in turn, painted in the parked car's colour. Their other colours become one material each: the board's merge
// (runtime.js) keeps only position, normal and uv, so colours per vertex would be lost there.
const KIT_PARKED = ['sedan', 'suv', 'hatchbackSports', 'van'], KIT_PARTS = {}, KIT_MATS = {};
let kitParkN = 0;
const kitMat = (hex, paint) => KIT_MATS[hex + (paint ? 'p' : 'r')] || (KIT_MATS[hex + (paint ? 'p' : 'r')] = new THREE.MeshStandardMaterial(paint
  ? { color:hex, roughness:0.3, metalness:0.45, envMapIntensity:0.6 } : { color:hex, roughness:0.5, metalness:0.15, envMapIntensity:0.5 }));
function kitParts(name){   // [{ geo, hex }]: its paint first (hex null), then one geometry per colour of the rest
  if (KIT_PARTS[name]) return KIT_PARTS[name];
  const e = KIT.park[name], rest = kitPart(e.rest, true), pos = rest.attributes.position.array, nrm = rest.attributes.normal.array, col = rest.attributes.color, by = new Map();
  for (let v = 0; v < col.count; v += 3){ const hex = new THREE.Color(col.getX(v), col.getY(v), col.getZ(v)).getHex();
    if (!by.has(hex)) by.set(hex, { p:[], n:[] }); const o = by.get(hex);
    for (let a = v*3; a < v*3 + 9; a++){ o.p.push(pos[a]); o.n.push(nrm[a]); } }
  const parts = [{ geo:kitPart(e.paint, false), hex:null }];
  for (const [hex, o] of by){ const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(o.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(o.n, 3)); parts.push({ geo:g, hex }); }
  return KIT_PARTS[name] = parts; }
function kitParked(x, yGround, z, rot, col){   // a parked car standing on yGround, facing rot (the kit's wheels sit at y 0.1)
  for (const p of kitParts(KIT_PARKED[kitParkN++ % KIT_PARKED.length])) add(p.geo, kitMat(p.hex ?? col, p.hex === null), x, yGround - 0.1, z, true).rotation.y = rot; }
