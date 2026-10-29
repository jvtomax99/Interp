// The campus's moving things, checked against the board (Jose, 2026-10-29: "some people walk into walls and some cars
// do the same"; "I want the interactions to mimic real life"). Loads the built preview (build.py's page) with its motion
// frozen, steps the live runtime's clock (life(t)) over two minutes, and for every car, person and the ambulance checks:
//   bump   a ray at body height along each step hits something (a wall, a tree, a pole, a parked car, a sign)
//   inside the mover stands inside a building's outline (scene.json), outside a drive-through under it
//   ground what is under it: a car on grass, a sidewalk or paving; a person on the road away from a crosswalk
//   close  two movers closer than their bodies allow (cars 0.7, a person and a car 0.45, people 0.25)
// and the two paths only the card has (the ambulance to the ER's curb, the lot car on the garage deck).
//   node audit.cjs <campus.html> <out.json>
const fs = require('fs');
const { open } = require('./card_page.cjs');
const [HTML, OUT] = process.argv.slice(2);
(async () => {
  const { page, close } = await open(HTML);
  const res = await page.evaluate(() => {
    window.__freeze = true;
    const T = window.__T, L = window.__L, scene = L.scene;
    const movers = [['car in (drive)', L.CAR_IN, 'car'], ['car out (drive)', L.CAR_OUT, 'car'], ['car in 2 (drive)', L.CAR_IN2, 'car'], ['ambulance (3D)', L.AMB, 'car'],
      ...L.STREET.map((o, i) => [`Prospect car ${i}`, o.g, 'car']), ...L.BACKCARS.map((o, i) => [`back car ${i} (${['2nd St A','2nd St B','Atlantic B','Essex A','Essex B'][i]})`, o.g, 'car']),
      ...L.TRAFFIC.MORE.map((g, i) => [`traffic car ${i}`, g, 'car']),
      ...L.WALKS.map((w, i) => [`front walker ${i}`, w.g, 'person']), ...L.BACKWALKS.map((w, i) => [`back walker ${i} (${['2nd St R','2nd St L','Atlantic L 1','Essex R','Atlantic L 2'][i]})`, w.g, 'person'])];
    const all = movers.map(m => m[1]);
    const moving = new Set(); all.forEach(g => g.traverse(o => moving.add(o)));
    [L.HELI, L.BIRDS, ...L.CLOUDS, L.petals, L.SPR].forEach(g => g && g.traverse(o => moving.add(o)));
    scene.updateMatrixWorld(true);
    const solid = []; scene.traverse(o => { if (!o.isMesh || moving.has(o)) return; for (let q = o; q; q = q.parent) if (!q.visible) return; const m = [].concat(o.material)[0]; if (m && m.transparent && m.opacity < 0.5) return; solid.push(o); });
    const ray = new T.Raycaster();
    const surf = h => { if (!h) return 'nothing'; const m = [].concat(h.object.material)[0], img = m.map && m.map.image;
      if (img && img === L.ASPH_T.image) return 'road'; if (img && img === L.GRASS_T.image) return 'grass'; if (img && img === L.PAVE_T.image) return 'paving';
      const c = m.color ? m.color.getHex() : -1;
      return ({ 0x9a99a6:'sidewalk', 0xe9e9f0:'paint', 0xe7d36a:'curb', 0xf2c94c:'road line' })[c] || ('#' + (c >>> 0).toString(16).padStart(6, '0') + (img ? ' textured' : '')); };
    const below = (x, y, z) => { ray.set(new T.Vector3(x, y + 0.75, z), new T.Vector3(0, -1, 0)); ray.far = 1.75; const h = ray.intersectObjects(solid, false)[0]; return h; };
    // buildings: outlines from scene.json; a drive-through's ground outline is open
    const inPoly = (pts, x, z) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++){ const [xi, zi] = pts[i], [xj, zj] = pts[j]; if ((zi > z) !== (zj > z) && x < (xj - xi)*(z - zi)/(zj - zi) + xi) c = !c; } return c; };
    const blds = L.SCN.blds.map(b => ({ name: b.name || b.id, pts: b.pts, open: (b.under && (b.under.ground || b.under.open)) || null }));
    const inside = (x, z) => { for (const b of blds) if (inPoly(b.pts, x, z) && !(b.open && inPoly(b.open, x, z))) return b.name; return null; };
    const nearest = (x, z) => { let best = null, bd = 1e9; for (const b of blds){ const cx = b.pts.reduce((a, p) => a + p[0], 0)/b.pts.length, cz = b.pts.reduce((a, p) => a + p[1], 0)/b.pts.length, d = Math.hypot(cx - x, cz - z); if (d < bd){ bd = d; best = b.name; } } return best; };
    const issues = []; const note = (who, kind, x, z, t, what) => issues.push({ who, kind, x: +x.toFixed(2), z: +z.toFixed(2), t: +t.toFixed(2), what, near: nearest(x, z) });
    // the clock: two minutes in quarter seconds
    const track = movers.map(() => []);
    for (let t = 0; t <= 120; t += 0.25){ L.life(t); all.forEach(g => g.updateMatrixWorld(true));
      movers.forEach(([, g], i) => track[i].push([g.position.x, g.position.y, g.position.z, g.rotation.y, g.visible]));
      // closeness at this moment
      for (let i = 0; i < movers.length; i++) for (let j = i + 1; j < movers.length; j++){ const a = track[i][track[i].length - 1], b = track[j][track[j].length - 1];
        if (!a[4] || !b[4]) continue;   // off the board, waiting for its next run
        const ka = movers[i][2], kb = movers[j][2], lim = ka === 'car' && kb === 'car' ? 0.7 : ka === kb ? 0.25 : 0.45, d = Math.hypot(a[0] - b[0], a[2] - b[2]);
        if (d < lim && Math.abs(a[1] - b[1]) < 1) note(movers[i][0] + ' + ' + movers[j][0], 'close', (a[0] + b[0])/2, (a[2] + b[2])/2, t, d.toFixed(2) + ' apart'); } }
    movers.forEach(([who, , kind], i) => { const tr = track[i];
      for (let s = 1; s < tr.length; s++){ const [x0, y0, z0] = tr[s-1], [x, y, z, ry] = tr[s], t = s*0.25, step = Math.hypot(x - x0, z - z0);
        if (step > 3 || !tr[s][4] || !tr[s-1][4]) continue;   // wrapped round to its start, or off the board
        // bump: along the step at body height, and for a car from its two sides
        if (step > 0.01){ const h = kind === 'car' ? 0.32 : 0.45, dir = new T.Vector3(x - x0, 0, z - z0).normalize(), side = new T.Vector3(dir.z, 0, -dir.x);
          for (const o of kind === 'car' ? [-0.22, 0, 0.22] : [0]){ ray.set(new T.Vector3(x0 + side.x*o, y0 + h, z0 + side.z*o), dir); ray.far = step + (kind === 'car' ? 0.5 : 0.15);
            const hit = ray.intersectObjects(solid, false)[0]; if (hit){ const m = [].concat(hit.object.material)[0]; note(who, 'bump', hit.point.x, hit.point.z, t, 'runs into ' + surf(hit) + ' (' + (hit.object.parent && hit.object.parent.userData.key || '') + ')'); break; } } }
        const b = inside(x, z); if (b) note(who, 'inside', x, z, t, 'inside ' + b);
        const g = surf(below(x, y, z));
        if (kind === 'car' && !['road', 'paint', 'road line'].includes(g)) note(who, 'ground', x, z, t, 'drives on ' + g);
        // a person on the road: fine on a crosswalk (stripes within a step), or crossing a driveway (under 3 units of road);
        // a longer stretch with no stripes is walking in the street
        if (kind === 'person'){ const road = ['road', 'road line'].includes(g) && ![[0.22, 0], [-0.22, 0], [0, 0.22], [0, -0.22]].some(([dx, dz]) => surf(below(x + dx, y, z + dz)) === 'paint');
          tr.run = road ? (tr.run || 0) + step : 0;
          if (road && tr.run > 3 && !tr.flagged){ note(who, 'ground', x, z, t, 'walks along the road (no sidewalk, no crosswalk)'); tr.flagged = true; } if (!road) tr.flagged = false; } } });
    // the card's own two paths
    { const A = L.SCN.paths.atlA, pts = [...A.slice(1, 8), [-24.35, -24.7], [-23.0, -26.2]]; for (let i = 1; i < pts.length; i++){ const [ax, az] = pts[i-1], [bx, bz] = pts[i], n = Math.ceil(Math.hypot(bx - ax, bz - az)/0.5);
        for (let k = 0; k <= n; k++){ const x = ax + (bx - ax)*k/n, z = az + (bz - az)*k/n, g = surf(below(x, 0.2, z)); if (!['road', 'paint', 'road line'].includes(g)) note('ambulance (card)', 'ground', x, z, 0, 'drives on ' + g); const b = inside(x, z); if (b) note('ambulance (card)', 'inside', x, z, 0, 'inside ' + b); } } }
    // group: one line per mover, kind and place (within 1.5 units)
    const groups = [];
    for (const it of issues){ const g = groups.find(q => q.who === it.who && q.kind === it.kind && q.what === it.what && Math.hypot(q.x - it.x, q.z - it.z) < 1.5); if (g){ g.n++; } else groups.push({ ...it, n: 1 }); }
    return { groups, count: issues.length, movers: movers.map(m => m[0]) };
  });
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  if (process.env.MAP){   // a picture from straight above, each spot circled: red bump, orange inside, blue ground, purple close
    await page.setViewportSize({ width: 1400, height: 1600 });
    await page.evaluate(() => { const L = window.__L, c = L.cam; window.__view(-1, 175, -28.8, -1, 0, -28.9); c.fov = 40; c.updateProjectionMatrix();
      document.querySelectorAll('body > *:not(#stage)').forEach(e => e.style.visibility = 'hidden'); });
    await page.waitForTimeout(2000);
    // the spots as rings standing in the scene itself, so they sit exactly where the picture has them
    await page.evaluate(g => { const L = window.__L, T = window.__T, col = { bump: 0xff2d2d, inside: 0xff9a1a, ground: 0x2d8cff, close: 0xb04dff };
      for (const x of g){ const m = new T.Mesh(new T.RingGeometry(0.45, 0.62, 24), new T.MeshBasicMaterial({ color: col[x.kind], side: T.DoubleSide, depthTest: false })); m.rotation.x = -Math.PI/2; m.position.set(x.x, 6, x.z); m.renderOrder = 999; L.scene.add(m); } }, res.groups);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: process.env.MAP, timeout: 240000 });
  }
  const by = {}; res.groups.forEach(g => { (by[g.kind] = by[g.kind] || []).push(g); });
  for (const k in by){ console.log(`== ${k}: ${by[k].length}`); by[k].slice(0, 60).forEach(g => console.log(`  ${g.who}: ${g.what} at (${g.x}, ${g.z}) near ${g.near} x${g.n}`)); }
  await close();
})();
