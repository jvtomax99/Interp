# Step 3: the preview page. Runs the live campus generator (../live/gen.py: diorama.html + runtime.js, the same
# pipeline as the app's 3D campus), then keeps its hand-built ground at the front (the street, the drive, the fountain,
# the drop-off), drops every hand-built building and adds the real campus from scene.json (back.js), front included,
# with the runtime's changes for a board twice as wide and deep.
#   python3 build.py <out.html>
#   python3 build.py --app          the app's 3D campus (campus3d/index.html: gen.py --app's page, the same changes, minus
#                                   the preview's own title, hints and Toy look switch)
import json, os, subprocess, sys, tempfile
HERE = os.path.dirname(os.path.abspath(__file__))
APP = '--app' in sys.argv
if APP:   # gen.py --app writes campus3d/index.html and copies three.js beside it; this page replaces it
    subprocess.run([sys.executable, os.path.join(HERE, '..', 'live', 'gen.py'), '--app'], check=True, stdout=subprocess.DEVNULL)
    tmp = OUT = os.path.join(HERE, '..', '..', '..', '..', 'campus3d', 'index.html')
else:
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
def page(a,b):   # the preview page's own shell (its title, heading, hints, card); the app's shell has its own
    if not APP: rep(a,b)
if APP:   # the app's title pill: the gestures nav.js gives, and the map's credit
    rep('<small>Drag to turn · pinch to zoom</small></div>', '<small>Drag, pinch or twist to look round</small><small style="font-size:10px;font-weight:550;opacity:.8">Map © OpenStreetMap contributors</small></div>')
page('<title>HUMC Campus Live</title>','<title>HUMC Campus Real Layout</title>')
# the front's ground, refitted to the map's buildings: the drive narrowed to run between Jurist and Medical Plaza (the
# map's two lanes run there), the canopy moved onto Link Pavilion's real front wall, the drop-off paved under it
rep("box(10, 0.06, 20, asphalt, 0, 0.21, 2.5, 0.02, false);","box(6.6, 0.06, 20, asphalt, 0.35, 0.21, 2.5, 0.02, false); box(2.1, 0.06, 18.2, asphalt, -3.95, 0.21, 3.0, 0.02, false); box(0.4, 0.1, 18.2, walk, -5.1, 0.22, 3.0, 0.02, false);")   # the aerial: asphalt from x -2.9 to Medical Plaza, a lane of parked cars on the left (its cars are the diorama's), a walk along Jurist
rep("for (let i=0;i<20;i++) box(0.22, 0.02, 1.1, paint, -4.6 + i*0.48","for (let i=0;i<14;i++) box(0.22, 0.02, 1.1, paint, -2.75 + i*0.48")
rep("for (const x of [-3.0, 2.5, 3.6]) for (let z=10.5; z>-3; z-=1.4)","for (const x of [-1.8]) for (let z=10.5; z>5.5; z-=1.4)")
rep("arrow(2.0, 9.0, 0); arrow(3.1, 9.0, 0); arrow(4.2, 9.0, 0);","arrow(2.75, 9.0, 0);")
rep("arrow(-3.8, 10.2, 1); arrow(-2.2, 10.2, -1); arrow(-3.8, 7.6, 1); arrow(-2.2, 7.6, -1);","arrow(-2.35, 10.4, 1); arrow(-1.25, 10.4, -1); arrow(-2.35, 8.0, 1); arrow(-1.25, 8.0, -1);")
rep("box(26, 0.06, 2.8, pave(26, 2.8), 0, 0.21, -7.6, 0.02, false);","")   # the drop-off is now the drive under Link Pavilion (back.js)
rep("for (let z = 11; z > -6; z -= 3.4){ lamp(-5.4, z); lamp(5.4, z); }","for (let z = 11; z > -6; z -= 3.4){ lamp(-4.95, z); if (z > 9.9 || z < -1.9) lamp(3.4, z); }   // Medical Plaza's colonnade lines the right side")
# (the canopy and its lobby are dropped above: Link Pavilion's front has a curved planted island, not a canopy)
# the café on the strip of lawn in front of Medical Plaza, either side of its doors
rep("[[8.6,9.6,0xe0414b],[10.6,10.4,0xf4f6fa],[8.9,11.5,0xf2c14e],[11.2,8.9,0x3aa6a0]]","[[6.4,10.95,0xe0414b],[8.4,10.95,0xf4f6fa],[18.2,10.95,0xf2c14e],[20.2,10.95,0x3aa6a0]]")
# the walkers, the cars and the ambulance keep to the narrowed drive and out of the buildings
rep("{ g: person('nurse', 2), pts: [[-14,0.1,9.2],[-5.2,0.1,9.0],[-3.7,0.1,4],[-3.7,0.1,-4],[-2.4,0.1,-7.4]], dur: 34000 },",
    "{ g: person('nurse', 2), pts: [[-14,0.1,11.2],[-5.0,0.1,11.0],[-4.9,0.1,4],[-4.9,0.1,-4],[-2.7,0.1,-6.4]], dur: 34000 },")
rep("{ g: person('doctor', 3), pts: [[2.4,0.1,-7.4],[3.7,0.1,-4],[3.7,0.1,4],[5.6,0.1,9.2],[12,0.1,9.6]], dur: 36000 },",
    "{ g: person('doctor', 3), pts: [[4.6,0.1,-6.6],[3.45,0.1,-4],[3.45,0.1,4],[3.45,0.1,10.6],[3.6,0.1,11.95],[9,0.1,11.95]], dur: 36000 },")
rep("{ g: person('wheel', 4), pts: [[-13,0.1,9.6],[-6.5,0.1,9.6],[-3.7,0.1,5],[-3.7,0.1,-3],[-2.6,0.1,-7.2]], dur: 52000 },",
    "{ g: person('wheel', 4), pts: [[-13,0.1,11.4],[-4.9,0.1,11.2],[-4.9,0.1,5],[-4.9,0.1,-3],[-2.8,0.1,-6.0]], dur: 52000 },")
rep("{ g: person('elder', 1), pts: [[1.4,0.1,-7.3],[-1.6,0.1,-7.3],[1.4,0.1,-7.3]], dur: 22000 },","{ g: person('elder', 1), pts: [[4.4,0.1,-7.6],[4.4,0.1,-6.2],[4.4,0.1,-7.6]], dur: 22000 },")
rep("{ g: person('patient', 2), pts: [[3.7,0.1,-5.5],[3.7,0.1,2],[3.7,0.1,-5.5]], dur: 30000 },","{ g: person('patient', 2), pts: [[3.45,0.1,-5.0],[3.45,0.1,2],[3.45,0.1,-5.0]], dur: 30000 },")
rep("CAR_IN.position.set(3.1, 0.2, 15.5 - u*22)","CAR_IN.position.set(2.5, 0.2, 15.5 - u*21)")
rep("along([[4.2,0.2,15.5],[4.2,0.2,2],[4.4,0.2,-4],[5.4,0.2,-7.2],[6.8,0.2,-8.0],[7.4,0.2,-8.4]]","along([[2.6,0.2,15.5],[2.6,0.2,2],[2.7,0.2,-4],[4.6,0.2,-6.9],[6.6,0.2,-8.0],[7.4,0.2,-8.4]]")
page('<h1>HUMC campus, live<small>iPhone test · not in the app yet</small></h1>','<h1>HUMC campus, front and back<small>Preview · live front on the real map</small></h1>')
page('<p class="hint">Drag to spin · pinch to zoom · tap a building</p>','<p class="hint">Drag to move · pinch to zoom · twist to turn · two fingers up or down to tilt · tap a building<br><span style="opacity:.7;font-size:10px">Map data © OpenStreetMap contributors</span></p>')
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
rep("t:['Terminology','the brick tower',25]","t:['Terminology','Helena Theurer Pavilion',25]")
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
# the drive's islands and the fountain where the state's 2020 aerial has them (2026-10-28): the back island (the fountain
# at its head, trees down it) runs z -0.2 to 4.8 on x 0.64; the front island, narrower, z 6.2 to 11.5 on x 0.58, the
# entrance sign at its mouth. They were about a unit west and the fountain three units north of the real ones.
# the diorama's ambulance bay box (x 7.4, z -11.2) stood on the canopy walk, in front of the Cardiac Surgery center
# (Jose, 2026-10-28): its box, roof, lit door and glow go; its doors move inside Link Pavilion, out of sight
rep("const BAY = { x:7.4, z:-11.2, w:2.2, h:1.3, d:2.4 };", "const BAY = { x:7.4, z:-13.6, w:2.2, h:1.3, d:2.4 };")
for pre in ["box(BAY.w, BAY.h, BAY.d, BRICK(", "box(BAY.w + 0.12, 0.16, BAY.d + 0.12,", "add(new THREE.PlaneGeometry(1.1, 1.0), new THREE.MeshBasicMaterial({ color:0xffd9a0 }), BAY.x", "add(new THREE.PlaneGeometry(1.26, 0.08), M(0xf3efe6, {r:0.5}), BAY.x", "glow(BAY.x, 0.3 + 0.6, BAY.z + BAY.d/2 + 0.3, 1.6, 0xffd0a0);"]:
    ln = [l for l in out.split('\n') if l.startswith(pre)]; assert len(ln) == 1, pre; out = out.replace(ln[0] + '\n', '', 1)
import re
FX, FZ = 0.64, -0.2
out, n = re.subn(r'-0\.1, ([0-9.]+), -3\.4\b', lambda m: f'{FX}, {m.group(1)}, {FZ}', out); assert n == 7, n   # the fountain's six pieces and its glow
rep("pos[i*3] = -0.1 + Math.cos(a)*rad;", f"pos[i*3] = {FX} + Math.cos(a)*rad;"); rep("pos[i*3+2] = -3.4 + Math.sin(a)*rad;", f"pos[i*3+2] = {FZ} + Math.sin(a)*rad;")
rep("SPA.setXYZ(i, -0.1 + Math.cos(a)*r,", f"SPA.setXYZ(i, {FX} + Math.cos(a)*r,"); rep("-3.4 + Math.sin(a)*r); }", f"{FZ} + Math.sin(a)*r); }}")
rep("pill(-0.1, -0.5, 1.6, 5.0, curb, 0.24, 0.1); pill(-0.1, -0.5, 1.3, 4.7, grass, 0.3, 0.12);", "pill(0.64, 2.3, 1.6, 5.0, curb, 0.24, 0.1); pill(0.64, 2.3, 1.3, 4.7, grass, 0.3, 0.12);")
rep("pill(-0.1, 7.8, 3.0, 7.2, curb, 0.24, 0.1); pill(-0.1, 7.8, 2.7, 6.9, grass, 0.3, 0.12);", "pill(0.58, 8.85, 2.2, 5.3, curb, 0.24, 0.1); pill(0.58, 8.85, 1.95, 5.05, grass, 0.3, 0.12);")
rep("SIGN.position.set(-0.1, 0.36, 9.7); SIGN.scale.setScalar(0.85);", "SIGN.position.set(0.58, 0.36, 10.6); SIGN.scale.setScalar(0.72);")
rep("[0.3,6.5,0.9,'cone'],[-0.5,-1.3,0.7,'cone']", "[0.58,7.75,0.8,'cone'],[0.64,2.9,0.7,'cone']")
rep("bed([[-0.75, 4.9], [0.55, 4.9], [0.85, 6.2], [0.75, 8.6], [-0.1, 8.95], [-0.95, 8.6], [-1.05, 6.2]]", "bed([[0.0, 6.7], [1.15, 6.7], [1.3, 7.5], [1.25, 9.0], [0.58, 9.3], [-0.1, 9.0], [-0.15, 7.5]]")
rep("bed([[-0.45, -1.9], [0.25, -1.9], [0.4, -0.5], [0.25, 1.4], [-0.1, 1.75], [-0.45, 1.4], [-0.6, -0.5]]", "bed([[0.3, 1.1], [1.0, 1.1], [1.15, 2.4], [1.0, 4.2], [0.64, 4.55], [0.28, 4.2], [0.13, 2.4]]")
rep("CAR_OUT.position.set(-2.8, 0.2, -6.5 + u*22)", "CAR_OUT.position.set(-2.2, 0.2, -6.5 + u*22)")
# moving round with fingers the Maps way (nav.js: drag the ground, pinch, twist, tilt, fly to a building, Reset view);
# it replaces OrbitControls' spin-and-snap, whose hard clamp at the edges fought the fingers every frame
NAV_JS = open(os.path.join(HERE, 'nav.js')).read()
# the Toy look switch (toy.js: Jose's train-diorama video, 2026-10-28), riding after the navigation
if not APP: NAV_JS += '\n' + open(os.path.join(HERE, 'toy.js')).read()
rep("cam.position.set(-34, 70, 82); controls.update();","cam.position.set(-34, 70, 82); controls.update();\n" + NAV_JS + "\nwindow.__built = o => { Object.assign(BUILT, o); setProgress(+$('prog').value/100); };\nwindow.__view = (x, y, z, tx=0.5, ty=-1.5, tz=-3) => { window.__free = true; controls.minDistance = 1; controls.maxPolarAngle = Math.PI*0.62; cam.position.set(x, y, z); controls.target.set(tx, ty, tz); controls.update(); };")
note="/* HUMC campus, front and back (Jose, 2026-10-27/28): every building placed from his OpenStreetMap export, the front's\n   three included; the hand-built ground at the front (street, drive, fountain, drop-off) refitted around them. */\n"
rep("window.__LITE = true;\n","window.__LITE = true;\n"+note)
page('bottom:calc(env(safe-area-inset-bottom,0px) + 168px)', 'bottom:calc(env(safe-area-inset-bottom,0px) + 186px)')   # the card clears the taller sheet

# ==================== the audit's fixes (audit.cjs, Jose 2026-10-29: "some people walk into walls and some cars do the
# same"; "I want the interactions to mimic real life") ====================
# The drive: one lane in (x 2.75, its arrow) and two out (x -2.35 and -1.25, theirs), as the aerial has it. The cars in
# pull up at the drop-off before Link Pavilion, turn round behind the fountain and leave by the outer lane out; a third
# car leaves from the drive-through. They no longer run on into the fence and the piers at the end of the drive, and the
# two that came in side by side, half a car apart, now share the one lane, half a loop apart.
DRIVE_LOOP = "[[2.75,0.2,13.4],[2.75,0.2,-1.3],[2.35,0.2,-2.35],[1.4,0.2,-2.85],[0.0,0.2,-2.85],[-0.95,0.2,-2.35],[-1.25,0.2,-1.3],[-1.25,0.2,13.4]]"
rep("{ const u = loop(9000); CAR_IN.position.set(2.5, 0.2, 15.5 - u*21); CAR_IN.rotation.y = Math.PI; }",
    "{ const p = along(" + DRIVE_LOOP + ", loop(17000)); CAR_IN.position.set(p[0], 0.2, p[2]); CAR_IN.rotation.y = p[3]; }")
rep("{ const u = loop(11000, 4000); CAR_OUT.position.set(-2.2, 0.2, -6.5 + u*22); CAR_OUT.rotation.y = 0; }",
    "{ const u = loop(9000, 4000); CAR_OUT.position.set(-2.35, 0.2, -3.2 + u*16.6); CAR_OUT.rotation.y = 0; }")
rep("{ const u = loop(13000, 7000); CAR_IN2.position.set(2.0, 0.2, 15.5 - u*22); CAR_IN2.rotation.y = Math.PI; }",
    "{ const p = along(" + DRIVE_LOOP + ", loop(17000, 8500)); CAR_IN2.position.set(p[0], 0.2, p[2]); CAR_IN2.rotation.y = p[3]; }")
# the ambulance (in 3D as on the card): up Atlantic Street's northbound lane (from Atlantic, not out on Prospect), then out
# of the lane into the mouth of the ER's court, where it stops (a car in its lane drove through it). Atlantic's northbound
# car goes: the ambulance is that lane's traffic
AMB_PATH = "[...SCN.paths.atlA.slice(1, 8).map(([x, z]) => [x, 0.2, z]), [-24.35, 0.2, -24.7], [-23.0, 0.2, -26.2]]"
rep("{ const u = loop(16000, 2000), p = along([[2.6,0.2,15.5],[2.6,0.2,2],[2.7,0.2,-4],[4.6,0.2,-6.9],[6.6,0.2,-8.0],[7.4,0.2,-8.4]], Math.min(1, u*1.4));",
    "{ const u = loop(26000, 2000), p = along(" + AMB_PATH + ", Math.min(1, u*1.6));")
# the ambulance parked at the corner of Atlantic and 2nd stood in 2nd Street's westbound lane, and its traffic ran into
# it: it waits in the ER's court instead, by the doors
rep("pa.position.set(-28.6, 0.2, -51.3); pa.rotation.y = Math.PI/2;", "pa.position.set(-20.9, 0.2, -27.1); pa.rotation.y = Math.PI/2;")
# Prospect's cars stay on the board (they ran out onto the soil past its ends) and on a street raised over the side
# streets' sidewalks (Atlantic's and Essex's sidewalks crossed its asphalt); its centre lines with it
rep("STREET.forEach((o, i) => { const u = loop(o.dur*2, i*3000); o.g.position.set((o.dir > 0 ? BX0 - 1 : BX1 + 1) + u*(BW + 2)*o.dir, 0.2, o.z);", "STREET.forEach((o, i) => { const u = loop(o.dur*2, o.off); o.g.position.set((o.dir > 0 ? BX0 + 0.4 : BX1 - 0.4) + u*(BW - 0.8)*o.dir, 0.2, o.z);")
rep("box(BW - 0.4, 0.06, 3.4, asphalt, BCX, 0.2, 15, 0.02, false);", "box(BW - 0.4, 0.06, 3.4, asphalt, BCX, 0.232, 15, 0.02, false);")
rep("box(BW - 0.4, 0.02, 0.06, curb, BCX, 0.24, 14.9, 0.01, false); box(BW - 0.4, 0.02, 0.06, curb, BCX, 0.24, 15.1, 0.01, false);",
    "box(BW - 0.4, 0.02, 0.06, curb, BCX, 0.262, 14.9, 0.01, false); box(BW - 0.4, 0.02, 0.06, curb, BCX, 0.262, 15.1, 0.01, false);")
# Prospect's sidewalks stop where a street or the drive crosses them; the drive's mouth is paved across them with a
# crosswalk, so the people walking along Prospect cross it on the stripes
rep("box(BW - 0.4, 0.1, 1.2, walk, BCX, 0.22, 12.7, 0.03, false); box(BW - 0.4, 0.1, 1.0, walk, BCX, 0.22, 17.3, 0.03, false);",
    """{ const cuts = z => { const out = [[-2.95, 3.65]];   // the drive's mouth
    for (const r of ROADLINES){ if (r.hw === 'service') continue; for (let i = 1; i < r.pts.length; i++){ const [ax, az] = r.pts[i-1], [bx, bz] = r.pts[i];
      if ((az - z)*(bz - z) > 0 || az === bz) continue; const x = ax + (bx - ax)*(z - az)/(bz - az), s = Math.abs(Math.hypot(bx - ax, bz - az)/(bz - az)); out.push([x - (r.w/2 + 0.9)*s, x + (r.w/2 + 0.9)*s]); } }
    return out.sort((p, q) => p[0] - q[0]); };
  for (const [z, d] of [[12.7, 1.2], [17.3, 1.0]]){ let x0 = BX0 + 0.2;
    for (const [a, b] of [...cuts(z), [BX1 - 0.2, BX1 - 0.2]]){ if (a > x0 + 0.05) box(a - x0, 0.1, d, walk, (a + x0)/2, 0.22, z, 0.03, false); x0 = Math.max(x0, b);
      if (b > a) for (let x = a + 0.2; x < b - 0.1; x += 0.42) box(0.24, 0.012, d - 0.1, paint, x, 0.272, z, 0.003, false); } }
  box(6.6, 0.06, 1.3, asphalt, 0.35, 0.23, 12.75, 0.02, false);
 }""")
# the people standing on Prospect's sidewalk keep to its inner edge, by the benches, out of the way of those walking
for a, b in [("['visitor',2,-15,12.6,", "['visitor',2,-15,12.25,"), ("['elder',4,-12.4,12.9,", "['elder',4,-12.4,12.25,"), ("['visitor',0,-1.5,12.5,", "['visitor',0,-4.2,12.25,"),
             ("['nurse',1,1.0,12.8,", "['nurse',1,4.3,12.25,"), ("['doctor',2,6.5,12.4,", "['doctor',2,6.5,12.25,"), ("['patient',3,13.5,12.7,", "['patient',3,13.5,12.25,"), ("['visitor',4,16.8,12.5,", "['visitor',4,16.8,12.25,")]:
    rep(a, b)
# the people walking: on Prospect's sidewalks in two lanes (east on the inner, west on the outer), the kid beside the
# patient; the nurse and the wheelchair out of Jurist's doors and down its walk to Link Pavilion's, the walk's lamps moved
# to the drive's edge; the doctor along Prospect behind the visitor; the elder and another patient one way along the far
# sidewalk, half a loop apart, on its outer side clear of the street trees in it
rep("for (let z = 11; z > -6; z -= 3.4){ lamp(-4.95, z);", "for (let z = 11; z > -6; z -= 3.4){ lamp(-2.92, z);")
a = out.index("const WALKS = ["); b = out.index("];", a) + 2
out = out[:a] + """const WALKS = [
  { g: person('visitor', 0), pts: [[BX0 + 1,0.1,12.78],[BX1 - 1,0.1,12.78]], dur: 90000 },
  { g: person('patient', 1), pts: [[BX1 - 1,0.1,13.25],[BX0 + 1,0.1,13.25]], dur: 100000 },
  { g: person('nurse', 2), pts: [[-5.0,0.1,9.4],[-5.0,0.1,-4],[-3.7,0.1,-5.4]], dur: 30000, off: 0 },
  { g: person('doctor', 3), pts: [[BX0 + 1,0.1,12.78],[BX1 - 1,0.1,12.78]], dur: 90000, off: 45000 },
  { g: person('wheel', 4), pts: [[-5.0,0.1,9.4],[-5.0,0.1,-4],[-3.7,0.1,-5.4]], dur: 30000, off: 15000 },
  { g: person('kid', 0), pts: [[BX1 - 1,0.1,12.98],[BX0 + 1,0.1,12.98]], dur: 100000, off: 5000 },
  { g: person('elder', 1), pts: [[BX0 + 3,0.1,17.6],[BX1 - 3,0.1,17.6]], dur: 110000, off: 0 },
  { g: person('patient', 2), pts: [[BX0 + 3,0.1,17.6],[BX1 - 3,0.1,17.6]], dur: 110000, off: 55000 },
];""" + out[b:]
rep("WALKS.forEach((w, i) => { const u = loop(w.dur, i*5000), p = along(w.pts, u);", "WALKS.forEach((w, i) => { const u = loop(w.dur, w.off != null ? w.off : i*5000), p = along(w.pts, u);")
# the walkers along the side streets keep out of the buildings the map draws up to the curb: a point inside one moves
# toward its street until it is clear
rep("""  .map(([p, k, i, dur]) => ({ g: person(k, i), pts: SCN.walks[p].map(([x, z]) => [x, 0.12, z]), dur }));""",
    """  .map(([p, k, i, dur]) => ({ g: person(k, i), pts: clearOfBuildings(SCN.walks[p]).map(([x, z]) => [x, 0.12, z]), dur }));""")
rep("const BACKWALKS = [", """function clearOfBuildings(pts){ const inB = (x, z) => SCN.blds.some(b => inside(b.pts, x, z));
  const near = (x, z) => { let best = null, bd = 1e9; for (const r of ROADLINES) for (let i = 1; i < r.pts.length; i++){ const [ax, az] = r.pts[i-1], [bx, bz] = r.pts[i], dx = bx - ax, dz = bz - az, L2 = dx*dx + dz*dz || 1,
      t = Math.max(0, Math.min(1, ((x - ax)*dx + (z - az)*dz)/L2)), px = ax + t*dx, pz = az + t*dz, d = Math.hypot(x - px, z - pz); if (d < bd){ bd = d; best = [px, pz]; } } return best; };
  return pts.map(([x, z]) => { if (!inB(x, z)) return [x, z]; const [px, pz] = near(x, z), L0 = Math.hypot(px - x, pz - z) || 1;
    for (let s = 0.05; s < 1.4; s += 0.05){ const qx = x + (px - x)/L0*s, qz = z + (pz - z)/L0*s; if (!inB(qx, qz)) return [qx + (px - x)/L0*0.12, qz + (pz - z)/L0*0.12]; } return [x, z]; }); }
const BACKWALKS = [""")

# (round 2 of the audit) Prospect's traffic: one speed per lane, the two in each lane half a loop apart (they drove
# through each other)
rep("{ g: vehicle('car', 0x6fb3e0), ry: Math.PI/2, z: 15.9, dir: 1, dur: 11000 }, { g: vehicle('car', 0xb83a3a), ry: -Math.PI/2, z: 14.1, dir: -1, dur: 9500 },",
    "{ g: vehicle('car', 0x6fb3e0), ry: Math.PI/2, z: 15.9, dir: 1, dur: 13000, off: 0 }, { g: vehicle('car', 0xb83a3a), ry: -Math.PI/2, z: 14.1, dir: -1, dur: 11000, off: 0 },")
rep("{ g: bus(), ry: Math.PI/2, z: 15.9, dir: 1, dur: 16000 }, { g: vehicle('car', 0xf3f5fb), ry: -Math.PI/2, z: 14.1, dir: -1, dur: 12500 } ];",
    "{ g: bus(), ry: Math.PI/2, z: 15.9, dir: 1, dur: 13000, off: 13000 }, { g: vehicle('car', 0xf3f5fb), ry: -Math.PI/2, z: 14.1, dir: -1, dur: 11000, off: 11000 } ];")
rep("const BACKCARS = [['secondA',0x2f5fa6,16000],['secondB',0xe9e2d0,18000],['atlA',0x5b6170,17000],['atlB',0xc9583a,19000],",
    "const BACKCARS = [['secondA',0x2f5fa6,16000],['secondB',0xe9e2d0,18000],['atlB',0xc9583a,16000],")
# the side streets' walkers on the sidewalks the map leaves clear: Atlantic's west side (its east side runs into the houses
# and Women's and Children's), Essex's east side; the two on Atlantic one way, half a loop apart
rep("const BACKWALKS = [['secondR','teal',2,60000],['secondL','hoodie',3,66000],['atlR','sweater',4,70000],['essexL','visitor',1,50000],['atlL','nurse',0,72000]]",
    "const BACKWALKS = [['secondR','teal',2,60000],['secondL','hoodie',3,66000],['atlL','sweater',4,72000,36000],['essexR','visitor',1,50000],['atlL','nurse',0,72000,0]]")
rep("  .map(([p, k, i, dur]) => ({ g: person(k, i), pts: clearOfBuildings(", "  .map(([p, k, i, dur, off]) => ({ g: person(k, i), off, pts: clearOfBuildings(")
rep("BACKWALKS.forEach((w, i) => { const p = along(w.pts, loop(w.dur, i*7000));", "BACKWALKS.forEach((w, i) => { const p = along(w.pts, loop(w.dur, w.off != null ? w.off : i*7000));")

# (round 3) the two side-street walkers past things standing on their sidewalks step toward the road: on 2nd Street's
# north side the bridge's grey columns, on its south side a sign and a tree
rep("  .map(([p, k, i, dur, off]) => ({ g: person(k, i), off, pts: clearOfBuildings(SCN.walks[p]).map(([x, z]) => [x, 0.12, z]), dur }));",
    """  .map(([p, k, i, dur, off]) => ({ g: person(k, i), off, pts: clearOfBuildings(densify(SCN.walks[p], 0.5)).map(([x, z]) => [x, 0.12, z + (p === 'secondR' && x > -4 && x < 5 ? -0.38 : p === 'secondL' && (Math.abs(x + 30.32) < 0.7 || Math.abs(x + 8.13) < 0.7) ? 0.38 : 0)]), dur }));""")
rep("function clearOfBuildings(pts){", """function densify(pts, step){ const out = []; for (let i = 1; i < pts.length; i++){ const [ax, az] = pts[i-1], [bx, bz] = pts[i], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az)/step));
    for (let k = 0; k < n; k++) out.push([ax + (bx - ax)*k/n, az + (bz - az)*k/n]); } out.push(pts[pts.length - 1]); return out; }
function clearOfBuildings(pts){""")
open(OUT, 'w').write(out); print(OUT, len(out))
