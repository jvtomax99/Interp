# Step 3: the preview page. Runs the live campus generator (../live/gen.py: diorama.html + runtime.js, the same
# pipeline as the app's 3D campus), then keeps its hand-built ground at the front (the street, the drive, the fountain,
# the drop-off), drops every hand-built building and adds the real campus from scene.json (back.js), front included,
# with the runtime's changes for a board twice as wide and deep.
#   python3 build.py <out.html>
import json, os, subprocess, sys, tempfile
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1]
tmp = os.path.join(tempfile.mkdtemp(), 'live.html')
subprocess.run([sys.executable, os.path.join(HERE, '..', 'live', 'gen.py'), tmp], check=True, stdout=subprocess.DEVNULL)
src = open(tmp).read().split('\n')
back = open(os.path.join(HERE, 'back.js')).read().replace('__SCENE__', json.dumps(json.load(open(os.path.join(HERE, 'scene.json'))), separators=(',', ':'))).replace('__ROOFS__', open(os.path.join(HERE, 'roofs.json')).read())
cut = back.index('// ---- the ground behind and beside the front')
back_pre, back_main = back[:cut], back[cut:]
def at(prefix):   # the one line starting with prefix
    hits = [i for i, l in enumerate(src) if l is not None and l.startswith(prefix)]; assert len(hits) == 1, (prefix, len(hits)); return hits[0]
def drop(first, last):   # drop the lines from the one starting with first to the next starting with last
    a = at(first); b = next(i for i in range(a, len(src)) if src[i] is not None and src[i].startswith(last))
    for i in range(a, b + 1): src[i] = None
    return a
# the guessed back buildings (the brick tower, the long buildings, the blue glass one, Theurer at the back right, the
# old helipad on the tower), and the hedge along the old board's back edge
drop("// Terminology: the tall white tower", "  const l = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6)")
drop("// the long glass buildings", "for (const k of ['x2','x5'])")
# the diorama's pond garden: the real campus has a round paved plaza there instead (back.js, Jose's photos 2026-10-28)
drop("// the garden at the back left: a pond with lily pads", "  for (const a of [0.2, 1.55, 3.1, 4.55]) bollard(PX")
# the hand-built front three (Jose, 2026-10-28: "still not accurate"): Link Pavilion's box, banners and planter; Jurist's
# box; Medical Plaza's boxes and colonnade. back.js builds all three from the map, with their looks.
drop("// Ethics: the brown-brick building at the end of the drive", "  tree(sx*4.5, -9.45, 0.42, 'cone'); }")
drop("// no windows under the two banners", "WINDOWS.e = WINDOWS.e.filter(m => { const p = m.position, under")
drop("// US Systems: the brick building on the left", "{ const top = 0.3 + 9*FL + 0.44; Object.assign(BOX.c")
# the surface lot on the left: the map has houses there (Jurist's neighbours on Prospect)
# the white canopy and lobby at the end of the drive: his aerials (2026-10-28) show a curved planted island against Link
# Pavilion's front instead, the drop-off road looping round it (back.js builds the island)
drop("// the entrance (Jose's references): a white canopy", "    for (let q = 0; q < 9; q++){ const a = q/9*Math.PI*2; add(new THREE.IcosahedronGeometry(0.045, 0), FLOWERS[[0, 1, 2, 4][q % 4]], sx*2.85")
drop("box(8.6, 0.08, 7.2, asphalt, -14.6, 0.24, 9.8, 0.03, false);", "for (let i=0;i<10;i++){ if (i === 3 || i === 8) continue; parked(")
pad = drop("// back left (context): the blue glass", "for (let i=0;i<8;i++){ const a = i/8*Math.PI*2; glow(PAD.x")
drop("for (let x = -19; x <= 19; x += 1.15) add(new THREE.IcosahedronGeometry(0.42", "for (let x = -19")
src[pad] = ("// ---- the helipad on Link Pavilion's roof, where the map puts it (the Emil Buehler Helipad) ----\n"
 "const PAD = { x:8.65, y:0.3 + 6*FL + 0.22 + 0.06, z:-15.78 };\nCUR = 'e';\n"
 "add(new THREE.CylinderGeometry(1.3, 1.3, 0.06, 32), M(0x3a3d4c, {r:0.9}), PAD.x, PAD.y, PAD.z, false);\n"
 "add(new THREE.RingGeometry(1.04, 1.16, 32), new THREE.MeshBasicMaterial({ color:0xf4f6fa, side:THREE.DoubleSide }), PAD.x, PAD.y+0.035, PAD.z, false).rotation.x = -Math.PI/2;\n"
 "for (const [w,h,dx] of [[0.12,0.72,-0.25],[0.12,0.72,0.25],[0.42,0.12,0]]) add(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({ color:0xf4f6fa }), PAD.x+dx, PAD.y+0.04, PAD.z, false).rotation.x = -Math.PI/2;\n"
 "CUR = '_';\nfor (let i=0;i<8;i++){ const a = i/8*Math.PI*2; glow(PAD.x+Math.cos(a)*1.2, PAD.y+0.08, PAD.z+Math.sin(a)*1.2, 0.5, i%2 ? 0x8fe3ff : 0xffb070); }")
i = at('let wr = 41;'); src[i] += '\n' + back_pre
i = at('// ---- the living things, built once each'); src[i] = back_main + '\n' + src[i]
out='\n'.join(x for x in src if x is not None)
def rep(a,b,cnt=1):
    global out
    assert out.count(a)==cnt,(a[:80],out.count(a)); out=out.replace(a,b)
rep('<title>HUMC Campus Live</title>','<title>HUMC Campus Real Layout</title>')
# the front's ground, refitted to the map's buildings: the drive narrowed to run between Jurist and Medical Plaza (the
# map's two lanes run there), the canopy moved onto Link Pavilion's real front wall, the drop-off paved under it
rep("box(10, 0.06, 20, asphalt, 0, 0.21, 2.5, 0.02, false);","box(8.2, 0.06, 20, asphalt, -0.8, 0.21, 2.5, 0.02, false);")
rep("for (let i=0;i<20;i++) box(0.22, 0.02, 1.1, paint, -4.6 + i*0.48","for (let i=0;i<17;i++) box(0.22, 0.02, 1.1, paint, -4.6 + i*0.48")
rep("for (const x of [-3.0, 2.5, 3.6]) for (let z=10.5; z>-3; z-=1.4)","for (const x of [-3.0, 1.2]) for (let z=10.5; z>-3; z-=1.4)")
rep("arrow(2.0, 9.0, 0); arrow(3.1, 9.0, 0); arrow(4.2, 9.0, 0);","arrow(1.9, 9.0, 0); arrow(2.8, 9.0, 0);")
rep("box(26, 0.06, 2.8, pave(26, 2.8), 0, 0.21, -7.6, 0.02, false);","box(13.1, 0.06, 6.0, pave(13.1, 6.0), 2.05, 0.215, -8.0, 0.02, false);")
rep("for (let z = 11; z > -6; z -= 3.4){ lamp(-5.4, z); lamp(5.4, z); }","for (let z = 11; z > -6; z -= 3.4){ lamp(-4.95, z); if (z > 9.9 || z < -1.9) lamp(3.0, z); }   // Medical Plaza's colonnade lines the right side")
# (the canopy and its lobby are dropped above: Link Pavilion's front has a curved planted island, not a canopy)
# the café on the strip of lawn in front of Medical Plaza, either side of its doors
rep("[[8.6,9.6,0xe0414b],[10.6,10.4,0xf4f6fa],[8.9,11.5,0xf2c14e],[11.2,8.9,0x3aa6a0]]","[[6.4,10.95,0xe0414b],[8.4,10.95,0xf4f6fa],[18.2,10.95,0xf2c14e],[20.2,10.95,0x3aa6a0]]")
# the walkers, the cars and the ambulance keep to the narrowed drive and out of the buildings
rep("{ g: person('nurse', 2), pts: [[-14,0.1,9.2],[-5.2,0.1,9.0],[-3.7,0.1,4],[-3.7,0.1,-4],[-2.4,0.1,-7.4]], dur: 34000 },",
    "{ g: person('nurse', 2), pts: [[-14,0.1,11.2],[-5.0,0.1,11.0],[-4.9,0.1,4],[-4.9,0.1,-4],[-2.7,0.1,-6.4]], dur: 34000 },")
rep("{ g: person('doctor', 3), pts: [[2.4,0.1,-7.4],[3.7,0.1,-4],[3.7,0.1,4],[5.6,0.1,9.2],[12,0.1,9.6]], dur: 36000 },",
    "{ g: person('doctor', 3), pts: [[4.6,0.1,-6.6],[2.9,0.1,-4],[2.9,0.1,4],[3.2,0.1,10.6],[3.6,0.1,11.95],[9,0.1,11.95]], dur: 36000 },")
rep("{ g: person('wheel', 4), pts: [[-13,0.1,9.6],[-6.5,0.1,9.6],[-3.7,0.1,5],[-3.7,0.1,-3],[-2.6,0.1,-7.2]], dur: 52000 },",
    "{ g: person('wheel', 4), pts: [[-13,0.1,11.4],[-4.9,0.1,11.2],[-4.9,0.1,5],[-4.9,0.1,-3],[-2.8,0.1,-6.0]], dur: 52000 },")
rep("{ g: person('elder', 1), pts: [[1.4,0.1,-7.3],[-1.6,0.1,-7.3],[1.4,0.1,-7.3]], dur: 22000 },","{ g: person('elder', 1), pts: [[4.4,0.1,-7.6],[4.4,0.1,-6.2],[4.4,0.1,-7.6]], dur: 22000 },")
rep("{ g: person('patient', 2), pts: [[3.7,0.1,-5.5],[3.7,0.1,2],[3.7,0.1,-5.5]], dur: 30000 },","{ g: person('patient', 2), pts: [[2.9,0.1,-5.0],[2.9,0.1,2],[2.9,0.1,-5.0]], dur: 30000 },")
rep("CAR_IN.position.set(3.1, 0.2, 15.5 - u*22)","CAR_IN.position.set(2.5, 0.2, 15.5 - u*21)")
rep("along([[4.2,0.2,15.5],[4.2,0.2,2],[4.4,0.2,-4],[5.4,0.2,-7.2],[6.8,0.2,-8.0],[7.4,0.2,-8.4]]","along([[2.6,0.2,15.5],[2.6,0.2,2],[2.7,0.2,-4],[4.6,0.2,-6.9],[6.6,0.2,-8.0],[7.4,0.2,-8.4]]")
rep('<h1>HUMC campus, live<small>iPhone test · not in the app yet</small></h1>','<h1>HUMC campus, front and back<small>Preview · live front on the real map</small></h1>')
rep('<p class="hint">Drag to spin · pinch to zoom · tap a building</p>','<p class="hint">Drag to spin · two fingers to zoom and move · tap a building<br><span style="opacity:.7;font-size:10px">Map data © OpenStreetMap contributors</span></p>')
rep("const BASE = new THREE.Group(); scene.add(BASE); let G = BASE;","const BASE = new THREE.Group(); scene.add(BASE); let G = BASE;\nlet CUR = '_';   // the building the next meshes belong to (the merge sorts them by it)")
rep("const add = (geo, mat, x,y,z, cast=true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x,y,z); m.castShadow=cast;","const add = (geo, mat, x,y,z, cast=true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x,y,z); m.castShadow=cast; m.userData.k=CUR;")
# shadows over the whole, bigger board
rep("moon.shadow.mapSize.set(2048,2048); Object.assign(moon.shadow.camera,{left:-34,right:34,top:34,bottom:-34,near:1,far:110}); moon.shadow.bias=-0.0006; moon.shadow.radius=9; moon.shadow.camera.left=-40; moon.shadow.camera.right=40; moon.shadow.camera.top=40; moon.shadow.camera.bottom=-40; scene.add(moon);",
    "const SHC = new THREE.Vector3(-1, 0, -28.85);   // the board's middle: the sun's shadows cover all of it\nmoon.shadow.mapSize.set(3072,3072); Object.assign(moon.shadow.camera,{left:-62,right:62,top:62,bottom:-62,near:1,far:260}); moon.shadow.bias=-0.0006; moon.shadow.radius=6; moon.target.position.copy(SHC); scene.add(moon, moon.target);")
# tower(): tag its meshes with its key
rep("function tower(key, x, z, w, d, floors, style, base){\n","function tower(key, x, z, w, d, floors, style, base){\n  CUR = key[0] === 'x' ? '_' : key;\n")
rep("  if (key[0] !== 'x'){ LABEL_AT[key] = [x, y0 + h + 0.9, z]; BOX[key] = { x, z, w, d, h: h + 0.8, y0, top: y0 + h + 0.8, roof: y0 + h + 0.22 }; }\n}",
    "  if (key[0] !== 'x'){ LABEL_AT[key] = [x, y0 + h + 0.9, z]; BOX[key] = { x, z, w, d, h: h + 0.8, y0, top: y0 + h + 0.8, roof: y0 + h + 0.22, rect:true }; }\n  CUR = '_';\n}")
# the board: the whole map's width and depth
rep("box(40.6, 1.3, 46.6, M(0x9a6a48, {r:0.9}), 0, -0.55, -4, 0.5, false); box(40.2, 1.6, 46.2, M(0x7a4f36, {r:0.95}), 0, -1.9, -4, 0.6, false); box(39.6, 0.9, 45.6, M(0x5e3b2a, {r:0.95}), 0, -3.0, -4, 0.45, false);",
    "box(BW + 0.7, 1.3, BD + 0.7, M(0x9a6a48, {r:0.9}), BCX, -0.55, BCZ, 0.5, false); box(BW + 0.3, 1.6, BD + 0.3, M(0x7a4f36, {r:0.95}), BCX, -1.9, BCZ, 0.6, false); box(BW - 0.3, 0.9, BD - 0.3, M(0x5e3b2a, {r:0.95}), BCX, -3.0, BCZ, 0.45, false);")
rep("box(39.9, 0.3, 45.9, new THREE.MeshStandardMaterial({ map:GRASS_T, roughness:0.95, envMapIntensity:0.08 }), 0, 0.02, -4, 0.15, false);",
    "{ const gt = GRASS_T.clone(); gt.needsUpdate = true; gt.repeat.set(8*BW/40, 8*BD/46); box(BW, 0.3, BD, new THREE.MeshStandardMaterial({ map:gt, roughness:0.95, envMapIntensity:0.08 }), BCX, 0.02, BCZ, 0.15, false); }")
rep("box(39.5, 0.06, 3.4, asphalt, 0, 0.2, 15, 0.02, false);","box(BW - 0.4, 0.06, 3.4, asphalt, BCX, 0.2, 15, 0.02, false);")
rep("box(39.5, 0.02, 0.06, curb, 0, 0.24, 14.9, 0.01, false); box(39.5, 0.02, 0.06, curb, 0, 0.24, 15.1, 0.01, false);","box(BW - 0.4, 0.02, 0.06, curb, BCX, 0.24, 14.9, 0.01, false); box(BW - 0.4, 0.02, 0.06, curb, BCX, 0.24, 15.1, 0.01, false);")
rep("box(39.5, 0.1, 1.2, walk, 0, 0.22, 12.7, 0.03, false);","box(BW - 0.4, 0.1, 1.2, walk, BCX, 0.22, 12.7, 0.03, false); box(BW - 0.4, 0.1, 1.0, walk, BCX, 0.22, 17.3, 0.03, false);")
rep("for (let x = -18; x <= 18; x += 6) if (x) lamp(x, 13.4);","for (let x = -42; x <= 40; x += 6) if (x && !blockedXZ(x, 13.4, 0.2)) lamp(x, 13.4);")
# the front's trees, beds, benches and people stay off the map's buildings and streets
rep("function tree(x, z, s=1, kind='round'){\n","function tree(x, z, s=1, kind='round'){\n  if (blockedXZ(x, z, 0.5)) return;\n")
rep("function bed(pts, y=0.3, o={}){\n","function bed(pts, y=0.3, o={}){\n  if (pts.some(([px, pz]) => blockedXZ(px, pz, 0.1))) return;\n")
rep("function bench(x, z, ry=0, y=0.3){ ","function bench(x, z, ry=0, y=0.3){ if (blockedXZ(x, z, 0.2)) return; ")
rep("function stand(kind, i, x, z, ry=0, f=0){ ","function stand(kind, i, x, z, ry=0, f=0){ if (blockedXZ(x, z, 0.3)) return null; ")
# the garden moves into the open court between Link Pavilion and the Patient Pavilion
# (the pond garden is dropped above: back.js builds the real little park beside the pavilion in its place)
# traffic: Prospect's cars run the board's full width; cars on 2nd Street, Atlantic and Essex; walkers on their sidewalks
rep("const CAR_IN2 = vehicle('car', 0x2b2f3a);","""const CAR_IN2 = vehicle('car', 0x2b2f3a);
const BACKCARS = [['secondA',0x2f5fa6,16000],['secondB',0xe9e2d0,18000],['atlA',0x5b6170,17000],['atlB',0xc9583a,19000],['essexA',0xf2c94c,12000],['essexB',0x3aa6a0,13000]]
  .map(([p, c, dur]) => ({ g: vehicle('car', c), path: SCN.paths[p].map(([x, z]) => [x, 0.2, z]), dur }));""")
rep("const WALKS = [","""const BACKWALKS = [['secondR','teal',2,60000],['secondL','hoodie',3,66000],['atlR','sweater',4,70000],['essexL','visitor',1,50000],['atlL','nurse',0,72000]]
  .map(([p, k, i, dur]) => ({ g: person(k, i), pts: SCN.walks[p].map(([x, z]) => [x, 0.12, z]), dur }));
const WALKS = [""")
rep("STREET.forEach((o, i) => { const u = loop(o.dur, i*3000); o.g.position.set(-21*o.dir + u*42*o.dir, 0.2, o.z); o.g.rotation.y = o.ry; });",
    """STREET.forEach((o, i) => { const u = loop(o.dur*2, i*3000); o.g.position.set((o.dir > 0 ? BX0 - 1 : BX1 + 1) + u*(BW + 2)*o.dir, 0.2, o.z); o.g.rotation.y = o.ry; });
  BACKCARS.forEach((o, i) => { const p = along(o.path, loop(o.dur, i*2500)); o.g.position.set(p[0], 0.2, p[2]); o.g.rotation.y = p[3]; });
  BACKWALKS.forEach((w, i) => { const p = along(w.pts, loop(w.dur, i*7000)); w.g.position.set(p[0], p[1], p[2]); w.g.rotation.y = p[3]; stride(w.g, (t*3.2 + i) % 2 < 1 ? 1 : 0); });""")
rep("[CAR_IN, CAR_OUT, AMB, HELI, BIRDS, CAR_IN2, ...STREET.map(o => o.g), ...WALKS.map(w => w.g), ...SITTERS.map(o => o.g)].forEach(g => g.visible = true);",
    "[CAR_IN, CAR_OUT, AMB, HELI, BIRDS, CAR_IN2, ...STREET.map(o => o.g), ...BACKCARS.map(o => o.g), ...BACKWALKS.map(w => w.g), ...WALKS.map(w => w.g), ...SITTERS.map(o => o.g)].forEach(g => g.visible = true);")
rep("SITTERS.forEach(o => o.g.position.set(...o.at)); IDLE.forEach(o => { o.set(0); o.g.visible = true; });","SITTERS.forEach(o => o.g.position.set(...o.at)); IDLE.forEach(o => { o.set(0); o.g.visible = true; });\n[...BACKCARS.map(o => o.g), ...BACKWALKS.map(w => w.g)].forEach(g => g.traverse(o => { o.castShadow = false; }));")
# runtime
rep("t:['Terminology','the brick tower',25]","t:['Terminology','Patient Pavilion',25]")
rep("const keyOf = c => { for (const k in BOX){ const b = BOX[k]; if (Math.abs(c.x - b.x) < b.w/2 + 0.3 && Math.abs(c.z - b.z) < b.d/2 + 0.3 && c.y > 0.35) return k; } return '_'; };",
    "// a mesh belongs to the building it was made for; the front's extra pieces (tiers, glass bases, banners) to the box they sit in\nconst keyOf = (o, c) => { if (o.userData.k && o.userData.k in BOX) return o.userData.k; for (const k in BOX){ const b = BOX[k]; if (b.rect && Math.abs(c.x - b.x) < b.w/2 + 0.3 && Math.abs(c.z - b.z) < b.d/2 + 0.3 && c.y > 0.35) return k; } return '_'; };")
rep("const c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()), k = keyOf(c);","const k = (o.userData.k && o.userData.k in BOX) ? o.userData.k : keyOf(o, new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()));")
rep("const lit = o.userData.win && lrnd() < 0.5;","const lit = o.userData.litc || (o.userData.win && lrnd() < 0.5);")
rep("for (const k in BOX){ const b = BOX[k], cap = new THREE.Group(), roofM = M(k === 'n' ? 0xe9e4dc : 0xd9cdb8), unitM = M(0x8a8796);\n  const slab = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.15, 0.22, b.d + 0.15), roofM); slab.position.set(b.x, 0.11, b.z); cap.add(slab);",
    "for (const k in BOX){ const b = BOX[k], cap = new THREE.Group(), roofM = M(k === 'n' ? 0xe9e4dc : k === 't' ? 0xe6e2da : 0xd9cdb8), unitM = M(0x8a8796);\n  if (b.pts){ const g = new THREE.ExtrudeGeometry(shapeOf(b.pts), { depth:0.22, bevelEnabled:false }); g.rotateX(-Math.PI/2); cap.add(new THREE.Mesh(g, roofM)); }\n  else { const slab = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.15, 0.22, b.d + 0.15), roofM); slab.position.set(b.x, 0.11, b.z); cap.add(slab); }")
rep("moon.position.copy(d).multiplyScalar(44);","moon.position.copy(d).multiplyScalar(110).add(SHC);")
# the lid on a part-built building: no rooftop boxes on the real outlines. They are sized from the building's bounding
# box, so on Helena Theurer (its whole block) one came out about 50 m long and hung off the glass tower like a plate
# (Jose, 2026-10-28: "remove the plate on top of the upper glass tower")
rep("cap.add(u1);","if (!b.pts) cap.add(u1);")
rep("cap.add(u2);","if (!b.pts) cap.add(u2);")
rep("CUT[k].value = cut; CAP[k].visible = f < 1; CAP[k].position.y = Math.min(cut, 900) - 0.02; }","CUT[k].value = cut; CAP[k].visible = f < 1; CAP[k].position.y = Math.min(cut, 900) - 0.02;\n    if (CAP[k].userData.tower){ const up = cut > BOX[k].platTop + 0.05; CAP[k].userData.full.visible = !up; CAP[k].userData.tower.visible = up; } }")
rep("  if (b.pts){ const g = new THREE.ExtrudeGeometry(shapeOf(b.pts), { depth:0.22, bevelEnabled:false }); g.rotateX(-Math.PI/2); cap.add(new THREE.Mesh(g, roofM)); }","  if (b.pts){ const g = new THREE.ExtrudeGeometry(shapeOf(b.pts), { depth:0.22, bevelEnabled:false }); g.rotateX(-Math.PI/2); const full = new THREE.Mesh(g, roofM); cap.add(full);\n    if (b.capTower){ const g2 = new THREE.ExtrudeGeometry(shapeOf(b.capTower), { depth:0.22, bevelEnabled:false }); g2.rotateX(-Math.PI/2); const tw = new THREE.Mesh(g2, M(0xc9ccd2)); cap.add(tw); cap.userData.full = full; cap.userData.tower = tw; } }")
rep("controls.minPolarAngle = 0.3; controls.maxPolarAngle = 1.32; controls.minDistance = 45; controls.maxDistance = 190; controls.rotateSpeed = 0.7;",
    "controls.minPolarAngle = 0.3; controls.maxPolarAngle = 1.32; controls.minDistance = 30; controls.maxDistance = 300; controls.rotateSpeed = 0.7;\ncontrols.enablePan = true; controls.screenSpacePanning = false; controls.panSpeed = 0.8;   // two fingers move over the board, to reach the back")
rep("controls.target.set(0.5, -1.5, -3); controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false;","controls.target.set(0.5, -1.5, -3); controls.enableDamping = true; controls.dampingFactor = 0.08;")
rep("""const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64), new THREE.MeshBasicMaterial({ color:0xffd27a, transparent:true, opacity:0.9, side:THREE.DoubleSide, depthWrite:false }));
ring.rotation.x = -Math.PI/2; ring.visible = false; scene.add(ring);""","""// the picked building's outline glows on the ground round its footprint
const HALOM = new THREE.MeshBasicMaterial({ color:0xffd27a, transparent:true, opacity:0.9, side:THREE.DoubleSide, depthWrite:false });
const HALO = {}; for (const k in BOX){ const b = BOX[k]; let o, i;
  if (b.halo) [o, i] = b.halo; else { const r = (p) => [[b.x - b.w/2 - p, b.z - b.d/2 - p], [b.x + b.w/2 + p, b.z - b.d/2 - p], [b.x + b.w/2 + p, b.z + b.d/2 + p], [b.x - b.w/2 - p, b.z + b.d/2 + p]]; o = r(0.9); i = r(0.45); }
  const g = new THREE.ShapeGeometry(shapeOf(o, [i])); g.rotateX(-Math.PI/2); const m = new THREE.Mesh(g, HALOM); m.position.y = 0.32; m.visible = false; scene.add(m); HALO[k] = m; }
let ring = null;""")
rep("if (picked){ const b = BOX[picked], s = Math.max(b.w, b.d)*0.62; ring.scale.set(b.w/Math.max(b.w,b.d)*s, b.d/Math.max(b.w,b.d)*s, 1); ring.position.set(b.x, 0.34, b.z); ring.visible = true;","if (ring) ring.visible = false; ring = null;\n  if (picked){ ring = HALO[picked]; ring.visible = true;")
rep("else { ring.visible = false; $('card').hidden = true; }","else { $('card').hidden = true; }")
rep("if (ring.visible) ring.material.opacity","if (ring) ring.material.opacity")
rep("at.push({ el, x:(v3.x+1)/2*r.width, y:(1-v3.y)/2*r.height, w:el._w, h:el._h }); }","at.push({ el, x:Math.max(el._w/2 + 6, Math.min(r.width - el._w/2 - 6, (v3.x+1)/2*r.width)), y:(1-v3.y)/2*r.height, w:el._w, h:el._h, back:v3.z > 1 }); }")
rep("controls.update(); renderer.render(scene, cam); badges(); sunAt(); if (!document.hidden) requestAnimationFrame(frame); }",
    "if (!window.__free) controls.target.set(Math.max(BX0 + 4, Math.min(BX1 - 4, controls.target.x)), -1.5, Math.max(BZ0 + 4, Math.min(BZ1 - 4, controls.target.z)));\n  controls.update(); renderer.render(scene, cam); badges(); sunAt(); if (!document.hidden) requestAnimationFrame(frame); }")
rep("cam.position.set(-34, 70, 82); controls.update();","cam.position.set(-34, 70, 82); controls.update();\nwindow.__built = o => { Object.assign(BUILT, o); setProgress(+$('prog').value/100); };\nwindow.__view = (x, y, z, tx=0.5, ty=-1.5, tz=-3) => { window.__free = true; controls.minDistance = 1; controls.maxPolarAngle = Math.PI*0.62; cam.position.set(x, y, z); controls.target.set(tx, ty, tz); controls.update(); };")
note="/* HUMC campus, front and back (Jose, 2026-10-27/28): every building placed from his OpenStreetMap export, the front's\n   three included; the hand-built ground at the front (street, drive, fountain, drop-off) refitted around them. */\n"
rep("window.__LITE = true;\n","window.__LITE = true;\n"+note)
rep('bottom:calc(env(safe-area-inset-bottom,0px) + 168px)', 'bottom:calc(env(safe-area-inset-bottom,0px) + 186px)')   # the card clears the taller sheet
open(OUT, 'w').write(out); print(OUT, len(out))
