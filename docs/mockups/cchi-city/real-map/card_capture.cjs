// Step 1 of the CoreCHI Practice card's pictures (docs/PLAN.md, Next 2, "the card's pictures from Blender"): the built
// preview's scene, from the card's camera, handed to Blender (card_render.py) as GLB files and a JSON of everything else.
//   node card_capture.cjs <campus.html from build.py> <outdir>
// Writes <outdir>/base.glb (the board and every building, nothing that moves), <outdir>/m/*.glb (each moving thing, one
// file per frame, posed where it is drawn), <outdir>/card.json (the camera, the domain buildings' boxes and label points,
// and each mover's 3D path with, per point, whether the camera sees it), <outdir>/spray*.png (the fountain's water, drawn
// here by three.js: Blender has no points). Three.js (x, y up, z) is Blender (x, -z, y up).
const fs = require('fs'), path = require('path');
const { open } = require('./card_page.cjs');
const [HTML, OUT] = process.argv.slice(2);
// the card's camera: diorama.html's direction (-42,64,104 toward the board), pulled back to take in the whole real board
const CAM = { dir: [-42.5, 63.5, 105.5], target: [-1, -3, -29], dist: 235, fov: 18.77, w: 960, h: 840, scale: 2 };
// the lot car: one spot on the Visitors Parking garage's top deck, left empty in the board (card_page.cjs), from which
// it backs out into the aisle and drives off toward the back (Jose, 2026-10-28: a car backing out at Visitors Parking;
// the court itself is hidden behind Medical Plaza from this camera, so the garage's deck above it)
const LOT_SPOT = 'x8886' + 45;
fs.mkdirSync(path.join(OUT, 'm'), { recursive: true });
(async () => {
  const { page, close } = await open(HTML, { skipRoof: LOT_SPOT });
  const res = await page.evaluate(async ({ CAM, LOT_SPOT }) => {
    window.__freeze = true; window.__built({ c:1, e:1, n:1, s:1, t:1 });
    const T = window.__T, L = window.__L, scene = L.scene;
    const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
    const d = new T.Vector3(...CAM.dir).normalize(), P = new T.Vector3(...CAM.target).addScaledVector(d, CAM.dist);
    const cam = new T.PerspectiveCamera(CAM.fov, CAM.w/CAM.h, 0.5, 900); cam.position.copy(P); cam.lookAt(...CAM.target); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    // everything that moves, hidden from the board
    const movers = [L.CAR_IN, L.CAR_OUT, L.AMB, L.HELI, L.CAR_IN2, L.BIRDS, L.BAY_DOORS, ...L.STREET.map(o => o.g), ...L.BACKCARS.map(o => o.g), ...L.BACKWALKS.map(w => w.g),
      ...L.WALKS.map(w => w.g), ...L.SITTERS.map(o => o.g), ...L.IDLE.map(o => o.g)];
    const off = [...L.CLOUDS, ...L.FLAGS, L.SPR, L.petals];
    movers.forEach(g => g.visible = false); off.forEach(g => g.visible = false);
    scene.updateMatrixWorld(true);
    const shown = o => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
    // flatten a group's visible meshes to world space (no sprites, glows or shader materials) and export it
    const glb = async (roots, tag) => { const root = new T.Group(); let n = 0;
      for (const r of roots) r.traverse(o => { if (!o.isMesh || !shown(o)) return; const m = [].concat(o.material)[0];
        if (!m || m.isShaderMaterial || m.blending === T.AdditiveBlending) return;
        if (m.isMeshBasicMaterial && m.transparent && !m.map && m.opacity < 0.5) return;   // the lamps' faint pools of light (Blender draws them black)
        const mesh = new T.Mesh(o.geometry.clone(), o.material); o.matrixWorld.decompose(mesh.position, mesh.quaternion, mesh.scale);
        const k = (o.parent && o.parent.userData.key) || '_'; mesh.name = tag ? tag + '_' + n : k + '_' + n;
        mesh.userData = { k: tag ? '' : k, lit: !!o.userData.litM }; root.add(mesh); n++; });
      const out = await new GLTFExporter().parseAsync(root, { binary: true, maxTextureSize: 1024 });
      const bytes = new Uint8Array(out); let s = ''; for (let i = 0; i < bytes.length; i += 32768) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
      return btoa(s); };
    const files = {};
    files['base.glb'] = await glb([scene]);
    // what the camera sees: a ray from it to the point, stopped just short, hits nothing on the board
    const meshes = []; scene.traverse(o => { if (o.isMesh && shown(o)) meshes.push(o); });
    const ray = new T.Raycaster(); const sees = p => { const q = new T.Vector3(...p), dir = q.clone().sub(P), dist = dir.length(); ray.set(P, dir.normalize()); ray.far = dist - 0.2; return ray.intersectObjects(meshes, false).length ? 0 : 1; };
    // a path's points every `step` units, each with whether it is seen
    const dense = (pts, step = 1.2) => { const out = []; for (let i = 0; i < pts.length - 1; i++){ const a = pts[i], b = pts[i+1], L2 = Math.hypot(b[0]-a[0], b[1]-a[1], b[2]-a[2]), n = Math.max(1, Math.ceil(L2/step));
        for (let k = 0; k < n; k++) out.push([0, 1, 2].map(j => +(a[j] + (b[j]-a[j])*k/n).toFixed(3))); }
      out.push(pts[pts.length-1].map(v => +(+v).toFixed(3))); return out.map(p => [...p, sees(p)]); };
    const place = (g, x, y, z, ry) => { g.position.set(x, y, z); g.rotation.y = ry; g.visible = true; g.updateMatrixWorld(true); };
    const M = {};   // name -> { frames: [glb names], ref, pts, ... }
    const shoot = async (name, g, n, setFrame) => { const fr = []; for (let f = 0; f < n; f++){ if (setFrame) setFrame(f); g.updateMatrixWorld(true); const fn = `m/${name}-${f}.glb`; files[fn] = await glb([g], name); fr.push(fn); } return fr; };
    const lift = (pts, h) => pts.map(p => [p[0], p[1] + h, p[2]]);
    // where to pose a mover drawn once for its whole path: the point nearest the path's middle that the camera sees
    // (in frame, nothing in front), heading along the path there
    const inFrame = p => { const v = new T.Vector3(...p).project(cam); return Math.abs(v.x) < 0.94 && Math.abs(v.y) < 0.94 && v.z < 1; };
    const pick = d => { let best = -1; d.forEach((p, i) => { if (p[3] && inFrame(p) && (best < 0 || Math.abs(i - d.length/2) < Math.abs(best - d.length/2))) best = i; });
      if (best < 0) best = Math.floor(d.length/2); const a = d[Math.max(0, best - 1)], b = d[Math.min(d.length - 1, best + 1)];
      return { at: d[best].slice(0, 3), ry: Math.atan2(b[0] - a[0], b[2] - a[2]) }; };
    // the three cars on the drive, as life() runs them (build.py, the audit's fixes): in on its one lane (x 2.75) to the
    // drop-off; out on the inner lane (x -1.25) after turning round behind the fountain; out from the drive-through on the
    // outer lane (x -2.35). The card draws each leg straight; the turn round is behind the fountain's island.
    for (const [name, g, x, ry, z0, z1] of [['carIn', L.CAR_IN, 2.75, Math.PI, 13.4, -1.3], ['carOut', L.CAR_OUT, -2.35, 0, -3.2, 13.4], ['carIn2', L.CAR_IN2, -1.25, 0, -1.3, 13.4]]){
      place(g, x, 0.2, 4.5, ry); M[name] = { frames: await shoot(name, g, 1), ref: [x, 0.4, 4.5], pts: dense([[x, 0.4, z0], [x, 0.4, z1]]) }; g.visible = false; }
    // the ambulance: up Atlantic Street's northbound lane (the map's path) to the curb at the mouth of the court off
    // Atlantic, the ER's drop-off (Jose, 2026-10-28; the court's middle is hidden behind Women's and Children's), where it
    // stops, its lights still flashing, and its back doors open toward the camera
    { const A = L.SCN.paths.atlA, stop = [-23.0, 0.2, -26.2], heading = Math.atan2(-24.05 - -29.25, -25.68 - -5.58);
      const drive = [...A.slice(1, 8).map(([x, z]) => [x, 0.2, z]), [-24.35, 0.2, -24.7], stop];
      const g = L.AMB; place(g, ...stop, heading);
      // two rear doors, hinged at the body's sides
      const dm = new T.MeshStandardMaterial({ color: 0xf4f6fa, roughness: 0.4 }), red = new T.MeshStandardMaterial({ color: 0xd43a3a, roughness: 0.5 }), inside = new T.MeshStandardMaterial({ color: 0xe6e9ee, roughness: 0.6 });
      const doors = [-1, 1].map(sd => { const piv = new T.Group(); piv.position.set(sd*0.3, 0.36, -0.66); g.add(piv);
        const leaf = new T.Mesh(new T.BoxGeometry(0.29, 0.38, 0.03), dm); leaf.position.set(-sd*0.145, 0, -0.015); piv.add(leaf);
        const st = new T.Mesh(new T.BoxGeometry(0.29, 0.07, 0.035), red); st.position.set(-sd*0.145, -0.06, -0.016); piv.add(st);
        const win = new T.Mesh(new T.BoxGeometry(0.17, 0.1, 0.035), new T.MeshStandardMaterial({ color: 0x1f2633, roughness: 0.15 })); win.position.set(-sd*0.15, 0.09, -0.017); piv.add(win);
        piv.userData.sd = sd; return piv; });
      const cabin = new T.Mesh(new T.BoxGeometry(0.52, 0.34, 0.02), inside); cabin.position.set(0, 0.37, -0.645); g.add(cabin);
      const doorsAt = a => doors.forEach(p => { p.rotation.y = -p.userData.sd * a; });
      doorsAt(0);
      // frames: lights red, lights blue (driving and parked), then doors half open and open (lights red)
      const frames = await shoot('amb', g, 4, f => { if (f < 2){ doorsAt(0); L.ambLights(f); } else { L.ambLights(0); doorsAt(f === 2 ? 0.9 : 1.75); } });
      M.amb = { frames, ref: [stop[0], 0.55, stop[2]], pts: dense(lift(drive, 0.35), 1.6) }; doorsAt(0); g.visible = false; }
    // the helicopter: in from the back right, down onto the helipad on Link Pavilion's roof
    { const p = L.PAD, g = L.HELI, at = [p.x, p.y + 0.5, p.z]; place(g, ...at, Math.PI*0.75);
      const frames = await shoot('heli', g, 2, f => { g.userData.rotor.rotation.y = f*Math.PI/8; });
      M.heli = { frames, ref: at, pts: dense([[p.x + 20, p.y + 13, p.z - 22], [p.x + 10, p.y + 7.5, p.z - 11], [p.x + 3, p.y + 3, p.z - 3.5], [p.x, p.y + 1.4, p.z], at], 1.5), pad: at }; g.visible = false; }
    // Prospect Avenue's cars, end to end of the board
    M.street = [];
    for (const [i, o] of L.STREET.entries()){ place(o.g, 0, 0.2, o.z, o.ry); const ends = [[L.BX0 + 0.5, 0.4, o.z], [L.BX1 - 0.5, 0.4, o.z]]; if (o.dir < 0) ends.reverse();
      M.street.push({ frames: await shoot('street' + i, o.g, 1), ref: [0, 0.4, o.z], pts: dense(ends, 2.4), dur: o.dur*2 }); o.g.visible = false; }
    // the cars on 2nd Street, Atlantic and Essex: posed at their path's middle, heading along it
    for (const [i, o] of L.BACKCARS.entries()){ const d = dense(lift(o.path, 0.2), 2.4), { at, ry } = pick(d); place(o.g, at[0], 0.2, at[2], ry);
      M.street.push({ frames: await shoot('back' + i, o.g, 1), ref: at, pts: d, dur: o.dur*1.6 }); o.g.visible = false; }
    // the people walking (the front's and the back's), two strides each
    M.walkers = [];
    for (const [i, w] of [...L.WALKS, ...L.BACKWALKS].entries()){ const hh = (w.g.userData.h || 0.5)*1.75/2, d = dense(lift(w.pts, hh), 1.0), { at, ry } = pick(d);
      place(w.g, at[0], at[1] - hh, at[2], ry);
      M.walkers.push({ frames: await shoot('walk' + i, w.g, 2, f => L.stride(w.g, f)), ref: at, pts: d, dur: w.dur }); w.g.visible = false; }
    // the people on the benches (a head turn) and the people standing about (two looks each)
    M.sitters = []; for (const [i, o] of L.SITTERS.entries()){ o.g.position.set(...o.at); o.g.visible = true; M.sitters.push({ frames: await shoot('sit' + i, o.g, 2, f => L.turnHead(o.g, f)) }); o.g.visible = false; }
    M.idlers = []; for (const [i, o] of L.IDLE.entries()){ o.g.visible = true; M.idlers.push({ frames: await shoot('idle' + i, o.g, 2, f => o.set(f)) }); o.g.visible = false; }
    // the flock across the sky
    { const g = L.BIRDS; place(g, -2, 13, -32, Math.PI/2);
      M.birds = { frames: await shoot('birds', g, 2, f => L.flap(g, f)), ref: [-2, 13, -32], pts: dense([[-60, 11, -48], [-30, 12.5, -40], [-2, 13, -32], [26, 12.5, -26], [56, 11, -20]], 6).map(p => [...p.slice(0, 3), 1]) }; g.visible = false; }
    // the flags, all together, three phases of their wave
    { const g = new T.Group(); L.FLAGS.forEach(f => { f.visible = true; }); const fl = []; for (const [ph, i] of [[0, 0], [2.1, 1], [4.2, 2]]){ L.waveFlags(ph); scene.updateMatrixWorld(true); const fn = `m/flags-${i}.glb`; files[fn] = await glb(L.FLAGS, 'flags'); fl.push(fn); }
      M.flags = { frames: fl }; L.FLAGS.forEach(f => { f.visible = false; }); }
    // the lot car: nose in to the west in its spot on the garage deck, backs out east into the aisle,
    // then a second look heads down the aisle toward the back and fades
    { const s = window.__roofSpots.find(r => r[0] + r[1] === LOT_SPOT), [, , x, z, a, y] = s, g = L.vehicle('car', 0xd9534f);
      place(g, x, y - 0.06, z, a); const fA = await shoot('lotA', g, 1);
      const bx = x + 1.15; place(g, bx, y - 0.06, z, Math.PI); const fB = await shoot('lotB', g, 1); g.visible = false;
      M.lot = { frames: [fA[0], fB[0]], ref: [x, y + 0.2, z], pts: dense([[x, y + 0.2, z], [bx, y + 0.2, z]], 0.4), ref2: [bx, y + 0.2, z], pts2: dense([[bx, y + 0.2, z], [bx, y + 0.2, z - 4], [bx, y + 0.2, z - 9]], 1.0) }; }
    // the fountain's water: four moments of the spray, drawn here alone on black with everything else as depth only
    const r2 = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r2.setPixelRatio(1); r2.setSize(CAM.w*CAM.scale, CAM.h*CAM.scale); r2.outputColorSpace = T.SRGBColorSpace;
    const keep = new Map(meshes.map(o => [o, o.material])), depthOnly = new T.MeshBasicMaterial({ colorWrite: false });
    meshes.forEach(o => { o.material = depthOnly; }); const bg = scene.background, fog = scene.fog; scene.background = new T.Color(0); scene.fog = null; L.SPR.visible = true;
    const hidden = []; scene.traverse(o => { if ((o.isSprite || o.isPoints) && o !== L.SPR && o.visible){ o.visible = false; hidden.push(o); } });
    for (const [i, t] of [0, 0.36, 0.72, 1.08].entries()){ L.fountain(t); r2.render(scene, cam); files[`spray${i}.png`] = r2.domElement.toDataURL('image/png').split(',')[1]; }
    hidden.forEach(o => { o.visible = true; }); meshes.forEach(o => { o.material = keep.get(o); }); scene.background = bg; scene.fog = fog;
    const BOX = {}; for (const k in L.BOX){ const b = L.BOX[k]; BOX[k] = { x: b.x, z: b.z, w: b.w, d: b.d, y0: b.y0, top: b.top, h: b.h, label: L.LABEL_AT[k] }; }
    window.__files = files;
    return { cam: { pos: P.toArray(), target: CAM.target, fov: CAM.fov, w: CAM.w, h: CAM.h, scale: CAM.scale }, box: BOX, movers: M, files: Object.keys(files) };
  }, { CAM, LOT_SPOT });
  for (const f of res.files){ const b64 = await page.evaluate(n => window.__files[n], f); fs.writeFileSync(path.join(OUT, f), Buffer.from(b64, 'base64')); }
  delete res.files; fs.writeFileSync(path.join(OUT, 'card.json'), JSON.stringify(res));
  console.log('base', fs.statSync(path.join(OUT, 'base.glb')).size, 'movers', fs.readdirSync(path.join(OUT, 'm')).length);
  await close();
})();
