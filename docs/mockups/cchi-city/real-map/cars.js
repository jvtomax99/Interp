// ---- the moving cars and ambulances (Jose, 2026-11-03: "cars on the road only"): Kenney's Car Kit (CC0,
// ../assets/kenney-car-kit/), baked by cars_bake.py into cars.json. vehicle() still builds the hand-made car with its
// lights; its body is swapped for the model's two meshes: its paint, in the car's own colour, and the rest (windows,
// tyres, lights, trim) in the kit's colours. The yellow cars are taxis; the rest take turns as sedan, SUV, hatchback, van.
// The bus, the helicopter and the parked cars (lots, garage roofs) stay hand-made.
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
