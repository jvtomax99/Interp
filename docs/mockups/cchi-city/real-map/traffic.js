// ---- traffic (Jose, 2026-10-29: "make the cars drive like real traffic: stay in the right-hand lane, follow the real
// direction of each street, slow down and stop at stop signs and crosswalks, turn on curves instead of sliding sideways,
// and never overlap each other. Use the map data for which streets are one-way.") ----
// Every car drives a route: its street's right-hand lane (the map's lanes, scene.json paths), joined to the next street
// by a corner rounded into an arc, so it turns instead of sliding; its heading follows the curve. Speed comes from the
// Intelligent Driver Model (Treiber, Hennecke and Helbing, 2000), the car-following rule traffic simulators use: speed
// up to the street's speed, slow for a bend, keep a safe gap to whatever is ahead in its path, and treat a line it has to
// stop at as a car standing there. What it stops for:
//   stop signs      a full stop at the line, then on when the way is clear
//   the light       Prospect at Essex, the map's one traffic signal (OSM node 103159193); a right turn on red after a
//                   full stop, as New Jersey allows
//   people          a person on or about to step onto the car's path where a sidewalk crosses it: the car waits
//   other cars      where two routes cross or merge, a car takes the crossing only when it is free, and a car coming from
//                   a stop sign or turning left across traffic waits for a gap; it keeps the crossing until it is through
//   the drop-off    the cars in the hospital drive pull up for a moment before turning round
// What is one-way comes from the map: every public street on the board is two-way in it (only a piece of 2nd Street west
// of the board is one-way); the hospital drive is one-way in on its east lane and out on its west lanes, and the ER's
// court off Atlantic is a one-way loop (OSM ways 1039270642-44, 1039268687, 544168945). The map tags no stop signs here:
// the ones on Atlantic (at 2nd Street and at Prospect) and at the drive's exit are this model's, a side street's and a
// driveway's usual control (a driveway: N.J.S.A. 39:4-66, stop before the sidewalk).
// The clock: life(t) calls traffic(t); the cars move in steps of 1/30 s from where they were (a jump back in time starts
// over; a long gap, a hidden page, resumes rather than racing). At the first call the streets are filled by running the
// traffic for 45 s before t, so the board never starts empty.
const TRAFFIC = (() => {
  const STEP = 0.25, LOOK = 9, A = 1.5, B = 2.2, BMAX = 6, S0 = 0.45, HW = 0.9, GAP = 2.6, ALAT = 1.1, DT = 1/30;
  const ZE = 15.9, ZW = 14.1, XL = BX0 + 0.4, XR = BX1 - 0.4;   // Prospect's two lanes: east-bound and west-bound
  const P = SCN.paths;
  // ---- geometry: lanes cut and joined, corners rounded, then sampled every STEP ----
  const lerp = (a, b, f) => [a[0] + (b[0] - a[0])*f, a[1] + (b[1] - a[1])*f];
  // the part of a lane up to where ok() first fails (the crossing point found exactly), and the part from where it first holds
  const until = (pts, ok) => { const out = [pts[0]]; for (let i = 1; i < pts.length; i++){ const a = pts[i-1], b = pts[i];
      if (!ok(b)){ let lo = 0, hi = 1; for (let k = 0; k < 30; k++){ const m = (lo + hi)/2; if (ok(lerp(a, b, m))) lo = m; else hi = m; } out.push(lerp(a, b, lo)); return out; }
      out.push(b); } return out; };
  const from = (pts, ok) => until(pts.slice().reverse(), ok).reverse();
  const part = (pts, a, b) => until(from(pts, a), b);   // from where a() starts to hold to where b() stops
  // where two straight lines meet: the end of one lane and the start of the next
  const meet = (a0, a1, b0, b1) => { const dx = a1[0] - a0[0], dz = a1[1] - a0[1], ex = b1[0] - b0[0], ez = b1[1] - b0[1], den = dx*ez - dz*ex;
    const f = ((b0[0] - a0[0])*ez - (b0[1] - a0[1])*ex)/den; return [a0[0] + dx*f, a0[1] + dz*f]; };
  // a turn from lane a into lane b: a's end, the corner (rounded with radius r), b
  const turn = (a, b, r) => { const c = meet(a[a.length - 2], a[a.length - 1], b[0], b[1]); return [...a, [c[0], c[1], r], ...b]; };
  // corners with a radius (a third value) become arcs; the rest stay as they are
  function round(pts){ const out = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++){ const p = pts[i], r = p[2]; if (!r){ out.push([p[0], p[1]]); continue; }
      const a = out[out.length - 1], c = pts[i+1], l1 = Math.hypot(p[0] - a[0], p[1] - a[1]), l2 = Math.hypot(c[0] - p[0], c[1] - p[1]);
      const u1 = [(p[0] - a[0])/l1, (p[1] - a[1])/l1], u2 = [(c[0] - p[0])/l2, (c[1] - p[1])/l2], cr = u1[0]*u2[1] - u1[1]*u2[0];
      const th = Math.atan2(Math.abs(cr), u1[0]*u2[0] + u1[1]*u2[1]); if (th < 0.02){ out.push([p[0], p[1]]); continue; }
      let d = r*Math.tan(th/2), rr = r; const dm = Math.min(l1, l2*0.5); if (d > dm){ d = dm; rr = d/Math.tan(th/2); }
      const s = Math.sign(cr), p1 = [p[0] - u1[0]*d, p[1] - u1[1]*d], C = [p1[0] - u1[1]*s*rr, p1[1] + u1[0]*s*rr], a0 = Math.atan2(p1[1] - C[1], p1[0] - C[0]), n = Math.max(3, Math.ceil(th*rr/0.12));
      for (let k = 0; k <= n; k++){ const q = a0 + s*th*k/n; out.push([C[0] + Math.cos(q)*rr, C[1] + Math.sin(q)*rr]); } }
    out.push(pts[pts.length - 1]); return out; }
  function sample(pts){ const P = [[pts[0][0], pts[0][1]]]; let carry = 0;
    for (let i = 1; i < pts.length; i++){ const a = pts[i-1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); let d = STEP - carry;
      while (d <= l){ P.push(lerp(a, b, d/l)); d += STEP; } carry = l - (d - STEP); }
    const e = pts[pts.length - 1]; if (Math.hypot(e[0] - P[P.length - 1][0], e[1] - P[P.length - 1][1]) > 0.02) P.push([e[0], e[1]]); return P; }
  // a route: its points every STEP, heading (rotation.y) from the points either side, the speed its bends allow
  function route(name, pts, o = {}){ const Q = sample(round(pts)), n = Q.length, H = [], K = [];
    for (let i = 0; i < n; i++){ const a = Q[Math.max(0, i - 2)], b = Q[Math.min(n - 1, i + 2)]; H.push(Math.atan2(b[0] - a[0], b[1] - a[1])); }
    for (let i = 0; i < n; i++){ const a = H[Math.max(0, i - 2)], b = H[Math.min(n - 1, i + 2)]; let d = Math.abs(b - a); if (d > Math.PI) d = 2*Math.PI - d;
      K.push(Math.sqrt(ALAT/Math.max(d/(STEP*(Math.min(n - 1, i + 2) - Math.max(0, i - 2)) || 1e-6), 1e-4))); }
    const r = { name, P: Q, H, K, L: STEP*(n - 1), v0: o.v0 || 3.0, ctrl: [], minor: [], conf: [], peds: [] };
    // a control at the point of the route nearest [x, z]
    for (const c of o.ctrl || []){ const s = sAt(r, c.at); r.ctrl.push({ ...c, s }); if (c.kind === 'stop' || c.rtor) r.minor.push([s - 1, s + (c.zone || 9)]); }
    for (const y of o.yields || []){ const s = sAt(r, y.at); r.minor.push([s - 1, s + (y.zone || 7)]); }
    return r; }
  const sAt = (r, [x, z]) => { let best = 0, bd = 1e9; r.P.forEach((p, i) => { const d = Math.hypot(p[0] - x, p[1] - z); if (d < bd){ bd = d; best = i; } }); return best*STEP; };
  const at = (r, s) => { const f = Math.max(0, Math.min(r.P.length - 1, s/STEP)), i = Math.min(r.P.length - 2, Math.floor(f)), k = f - i, a = r.P[i], b = r.P[i+1];
    let ha = r.H[i], hb = r.H[i+1]; if (hb - ha > Math.PI) hb -= 2*Math.PI; if (ha - hb > Math.PI) hb += 2*Math.PI;
    return [a[0] + (b[0] - a[0])*k, a[1] + (b[1] - a[1])*k, ha + (hb - ha)*k]; };

  // ---- the routes ----
  const EB = (x0, x1) => [[x0, ZE], [x1, ZE]], WB = (x0, x1) => [[x0, ZW], [x1, ZW]];
  const atlSB = P.atlB, atlNB = P.atlA, essSB = P.essexA, essNB = P.essexB;
  const nb = (ok) => from(atlNB, ok), sb = (ok) => until(atlSB, ok);
  // Atlantic's lines at Prospect (its lanes run on into the middle of Prospect; the turns are cut from these)
  const atlNBin = from(atlNB, p => p[1] <= 12.0), atlSBout = until(atlSB, p => p[1] <= 11.4);
  const essSBout = until(essSB, p => p[1] <= 11.3), essNBin = from(essNB, p => p[1] <= 12.0);
  const toWB = (a, r) => turn(a, WB(meet(a[a.length - 2], a[a.length - 1], [0, ZW], [1, ZW])[0] - 2.6, XL), r);   // a right turn onto Prospect, west-bound
  // the hospital drive (one-way, as the map: in on the east lane, round behind the fountain, out on the west lanes)
  const DRIVE = [[2.75, 12.0], [2.75, -2.85, 1.2], [-1.25, -2.85, 1.2], [-1.25, 11.6]];   // the turn round behind the fountain's island, its corners on arcs
  const DROP = [0.7, -2.85], EXIT_L = [-1.25, 11.6], EXIT_R = [-2.35, 11.6];
  const driveOut = a => turn(a, EB(-1.25 + 3.0, XR), 1.4);   // out of the drive's left lane, a left turn onto Prospect east-bound
  // the ER's court off Atlantic: in on the stub's south half, round the east of the paved circle the way the map's loop
  // runs, a stop by the doors, out on the stub's north half and left down Atlantic
  const COURT = [[-21.6, -26.1], [-18.25, -26.1, 0.95], [-18.25, -28.0, 0.95], [-23.6, -28.0]];
  const SIGNAL_P = { kind: 'signal', light: 'P' };
  const R = {
    ebThru: route('Prospect east', EB(XL, XR), { ctrl: [{ ...SIGNAL_P, at: [30.2, ZE] }] }),
    wbThru: route('Prospect west', WB(XR, XL), { ctrl: [{ ...SIGNAL_P, at: [35.9, ZW] }] }),
    secEB: route('2nd Street east', P.secondA),
    secWB: route('2nd Street west', P.secondB),
    // Atlantic south: stop at 2nd Street, stop at Prospect, right onto Prospect
    atlSouth: route('Atlantic south', toWB(atlSBout, 0.9), { ctrl: [{ kind: 'stop', at: [-22.04, -53.7] }, { kind: 'stop', at: atlSBout[atlSBout.length - 1] }] }),
    // Prospect east, left onto Atlantic north (across the west-bound lane), on past 2nd Street
    atlNorthL: route('Atlantic north (left off Prospect)', turn(EB(XL, -38), atlNBin, 1.6), { yields: [{ at: [-38, ZE], zone: 9 }], ctrl: [{ kind: 'stop', at: [-20.77, -46.3], sign: false }] }),
    // Prospect west (through the light), right onto Atlantic north
    atlNorthR: route('Atlantic north (right off Prospect)', turn(WB(XR, -33.6), atlNBin, 1.0), { ctrl: [{ ...SIGNAL_P, at: [35.9, ZW] }, { kind: 'stop', at: [-20.77, -46.3], sign: false }] }),
    // Essex south to the light, right onto Prospect (right on red after a stop)
    essexSouth: route('Essex south', toWB(essSBout, 1.0), { ctrl: [{ kind: 'signal', light: 'E', rtor: true, at: essSBout[essSBout.length - 1] }] }),
    // Prospect west to the light, right onto Essex north
    essexNorth: route('Essex north', turn(WB(XR, 35.0), essNBin, 1.0), { ctrl: [{ ...SIGNAL_P, at: [35.9, ZW] }] }),
    // into the drive: off Prospect west-bound (a right turn) or east-bound (a left across the other lane)
    driveR: route('drive (right in)', driveOut(turn(WB(XR, 4.0), DRIVE, 0.9)), { v0: 2.4, ctrl: [{ ...SIGNAL_P, at: [35.9, ZW] }, { kind: 'dwell', dur: 3, at: DROP }, { kind: 'stop', at: EXIT_L, sign: false }] }),
    driveL: route('drive (left in)', driveOut(turn(EB(XL, 1.0), DRIVE, 1.5)), { v0: 2.4, yields: [{ at: [1.0, ZE], zone: 6 }], ctrl: [{ kind: 'dwell', dur: 3, at: DROP }, { kind: 'stop', at: EXIT_L, sign: false }] }),
    // out of the drive-through, its right lane, right onto Prospect west-bound
    driveOut: route('drive-through out', toWB([[-2.35, -3.2], EXIT_R], 0.9), { v0: 2.4, ctrl: [{ kind: 'stop', at: EXIT_R }] }),
    // the ambulance: Prospect east, left onto Atlantic, right into the ER's court, round to the doors, out and left
    // down Atlantic, stop at Prospect, right onto Prospect west-bound
    amb: route('ambulance', toWB(turn(turn(turn(EB(XL, -38), part(atlNB, p => p[1] <= 12.0, p => p[1] > -24.5), 1.6), COURT, 0.9), part(atlSB, p => p[1] > -25.6, p => p[1] <= 11.4), 1.1), 0.9),
      { yields: [{ at: [-38, ZE], zone: 9 }, { at: [-23.6, -28.0], zone: 5 }], ctrl: [{ kind: 'dwell', dur: 12, at: [-18.25, -27.05] }, { kind: 'stop', at: atlSBout[atlSBout.length - 1] }] }),
  };
  const ROUTES = Object.values(R);
  ROUTES.forEach(r => { r.grid = new Map(); r.P.forEach((p, j) => { const k = Math.floor(p[0]) + ',' + Math.floor(p[1]); if (!r.grid.has(k)) r.grid.set(k, []); r.grid.get(k).push(j); }); });

  // ---- who drives what: each vehicle runs its routes in turn, with a pause off the board between runs ----
  const LIVE_CAR = vehicle('car', 0x5b6170), MORE = [LIVE_CAR, vehicle('car', 0x8d5fa8), vehicle('car', 0xe0e4ea)];
  MORE.forEach(g => g.traverse(o => { o.castShadow = false; }));
  const V = [
    [STREET[0].g, ['ebThru'], [3, 5]], [STREET[2].g, ['ebThru'], [9]], [STREET[1].g, ['wbThru'], [2, 4]], [STREET[3].g, ['atlNorthR', 'wbThru'], [5, 3]],
    [BACKCARS[0].g, ['secEB'], [2, 4]], [BACKCARS[1].g, ['secWB'], [3, 2]], [BACKCARS[2].g, ['atlSouth'], [4, 7]],
    [BACKCARS[3].g, ['essexSouth'], [3, 6]], [BACKCARS[4].g, ['essexNorth'], [5, 3]],
    [CAR_IN, ['driveR'], [6]], [CAR_IN2, ['driveL'], [9]], [CAR_OUT, ['driveOut'], [8]],
    [LIVE_CAR, ['atlNorthL'], [8]], [MORE[1], ['wbThru', 'essexSouth'], [4, 5]], [MORE[2], ['secEB', 'ebThru'], [5, 4]],
    [AMB, ['amb'], [20]],
  ].map(([g, rs, gaps], i) => { g.rotation.set(0, 0, 0); g.position.set(0, 0, 0); g.updateMatrixWorld(true); const b = new THREE.Box3(); g.traverse(o => { if (o.isMesh) b.expandByObject(o); });
    return { g, rs: rs.map(k => R[k]), gaps, i, ri: 0, gi: 0, on: false, next: i*1.1, s: 0, v: 0, r: null, len: Math.max(0.9, b.max.z - b.min.z), wid: b.max.x - b.min.x, x: 0, z: 0, h: 0, ci: 0, held: new Set(), wait: 0, done: new Set() }; });

  // ---- where routes meet: crossings and merges (two routes within a car's width, coming from different places) ----
  let CID = 0; const CONF = [];
  for (let a = 0; a < ROUTES.length; a++) for (let b = a + 1; b < ROUTES.length; b++){ const ra = ROUTES[a], rb = ROUTES[b];
    const near = []; ra.P.forEach((p, i) => { const gx = Math.floor(p[0]), gz = Math.floor(p[1]);
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (const j of rb.grid.get((gx + dx) + ',' + (gz + dz)) || []){ const q = rb.P[j]; if (Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.75) near.push([i, j]); } });
    // runs of contact along ra
    near.sort((x, y) => x[0] - y[0] || x[1] - y[1]); const runs = [];
    for (const [i, j] of near){ const last = runs[runs.length - 1]; if (last && i - last.i1 <= 2 && Math.abs(j - last.jn) <= 6){ last.i1 = i; last.j0 = Math.min(last.j0, j); last.j1 = Math.max(last.j1, j); last.jn = j; } else runs.push({ i0: i, i1: i, j0: j, j1: j, jn: j }); }
    for (const u of runs){ const before = (r, i) => r.P[Math.max(0, i - 6)];
      // a shared start (both routes begin in the same lane) or the same lane running on is not a meeting: following covers it
      if (u.i0 === 0 && u.j0 === 0) continue;
      const pa = before(ra, u.i0), pb = before(rb, u.j0); if (Math.hypot(pa[0] - pb[0], pa[1] - pb[1]) < 0.75) continue;
      u.i1 = Math.min(u.i1, u.i0 + 12); u.j1 = Math.min(u.j1, u.j0 + 12);
      const c = { id: CID++, at: { [ra.name]: [u.i0*STEP, u.i1*STEP], [rb.name]: [u.j0*STEP, u.j1*STEP] }, routes: [ra, rb], holder: null };
      CONF.push(c); ra.conf.push({ c, s0: u.i0*STEP, s1: u.i1*STEP, other: rb, os0: u.j0*STEP }); rb.conf.push({ c, s0: u.j0*STEP, s1: u.j1*STEP, other: ra, os0: u.i0*STEP }); } }
  ROUTES.forEach(r => r.conf.sort((x, y) => x.s0 - y.s0));
  const minorAt = (r, s) => r.minor.some(([a, b]) => s >= a && s <= b);

  // ---- people (people.js): where their walks cross each route, for the cars to look out for them ----
  ROUTES.forEach(r => { r.STEP = STEP; });
  const PEOPLE = makePeople();
  for (const h of PEOPLE.crossWith(ROUTES)){ const r = h.car; if (!r.peds.some(q => Math.abs(q.s - h.cs) < 0.3)) r.peds.push({ s: h.cs, x: h.x, z: h.z }); }
  ROUTES.forEach(r => r.peds.sort((x, y) => x.s - y.s));

  // ---- the light at Prospect and Essex: Prospect green 16 s, amber 3, all red 1, Essex green 8, amber 2, all red 1 ----
  const CYC = 31, light = (which, t) => { const u = ((t % CYC) + CYC) % CYC;
    if (which === 'P') return u < 16 ? 'g' : u < 19 ? 'y' : 'r'; return u >= 20 && u < 28 ? 'g' : u >= 20 && u < 30 ? 'y' : 'r'; };

  // ---- what stands on the street: stop signs, the signal heads, a white line at each stop ----
  const grey = M(0x6b7280, { r: 0.5 }), red = M(0xc62f36, { r: 0.45 }), white = M(0xf4f6fa, { r: 0.5 }), dark = M(0x1c2230, { r: 0.6 });
  const rayDown = new THREE.Raycaster(), groundY = (x, z) => { rayDown.set(new THREE.Vector3(x, 3, z), new THREE.Vector3(0, -1, 0)); rayDown.far = 3.5;
    const solid = []; scene.traverse(o => { if (o.isMesh) solid.push(o); }); const h = rayDown.intersectObjects(solid, false).find(h => h.object.isMesh && h.object.visible && !(h.object.material && h.object.material.transparent) && !LIVE.some(g => g.getObjectById(h.object.id))); return h ? h.point.y : 0.2; };
  const side = (r, s, d) => { const [x, z, h] = at(r, s); return [x - Math.cos(h)*d, z + Math.sin(h)*d, h]; };   // d to the driver's right
  const signs = [], heads = [];
  function stopLine(r, s){ const [x, z, h] = at(r, s), y = groundY(x, z), m = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.012, 0.09), paint); m.position.set(x, y + 0.004, z); m.rotation.y = h; scene.add(m); }
  function stopSign(r, s){ const [x, z, h] = side(r, s - 0.3, 0.95); if (signs.some(([a, b]) => Math.hypot(a - x, b - z) < 0.8)) return; signs.push([x, z]);
    const g = new THREE.Group(), y = groundY(x, z); g.position.set(x, y, z); g.rotation.y = h + Math.PI;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.78, 6), grey); pole.position.y = 0.39; g.add(pole);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.016, 8), white); rim.rotation.x = Math.PI/2; rim.rotation.y = Math.PI/8; rim.position.set(0, 0.8, 0.02); g.add(rim);
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 8), red); face.rotation.x = Math.PI/2; face.rotation.y = Math.PI/8; face.position.set(0, 0.8, 0.03); g.add(face);
    scene.add(g); }
  function signalHead(r, s, which, d){ const [x, z, h] = side(r, s - 0.2, d), g = new THREE.Group(), y = groundY(x, z); g.position.set(x, y, z); g.rotation.y = h + Math.PI;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 6), grey); pole.position.y = 0.55; g.add(pole);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.36, 0.1), dark); box.position.set(0, 1.18, 0.02); g.add(box);
    const lamp = c => new THREE.MeshBasicMaterial({ color: c }), lamps = { r: [0xff3b30, 0x3a1614], y: [0xffc531, 0x3a2e12], g: [0x34e07a, 0x10301c] }, mats = {};
    [['r', 1.29], ['y', 1.18], ['g', 1.07]].forEach(([k, ly]) => { const m = lamp(lamps[k][1]); mats[k] = m; const b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), m); b.position.set(0, ly, 0.08); g.add(b); });
    scene.add(g); heads.push({ which, mats, lamps, now: '' }); }
  for (const r of ROUTES) for (const c of r.ctrl){ if (c.kind === 'dwell') continue; stopLine(r, c.s); if (c.kind === 'stop' && c.sign !== false) stopSign(r, c.s); }
  signalHead(R.ebThru, R.ebThru.ctrl[0].s, 'P', 1.05); signalHead(R.wbThru, R.wbThru.ctrl[0].s, 'P', 2.3); signalHead(R.essexSouth, R.essexSouth.ctrl[0].s, 'E', 1.6);   // each on its curb, clear of the sidewalk's walkers
  const showLights = t => heads.forEach(hd => { const st = light(hd.which, t); if (st === hd.now) return; hd.now = st; for (const k in hd.mats) hd.mats[k].color.setHex(hd.lamps[k][k === st ? 0 : 1]); });

  // ---- one step ----
  let T = null;
  const active = () => V.filter(c => c.on);
  function place(c){ const [x, z, h] = at(c.r, c.s); c.x = x; c.z = z; c.h = h; }
  function start(c, t){ const r = c.rs[c.ri % c.rs.length], p0 = r.P[0];
    if (V.some(o => o.on && Math.hypot(o.x - p0[0], o.z - p0[1]) < (o.len + c.len)/2 + 1.2)) return;   // its way onto the board is taken: a moment later
    c.r = r; c.s = 0; c.v = Math.min(r.v0, 2.2); c.ci = 0; c.done.clear(); c.wait = 0; c.on = true; place(c); }
  function finish(c, t){ c.on = false; c.held.forEach(k => { if (k.holder === c) k.holder = null; }); c.held.clear(); c.next = t + c.gaps[c.gi++ % c.gaps.length]; c.ri++; }
  function step(t, dt){
    PEOPLE.step(t, dt, V); const W = PEOPLE.now();
    for (const c of V) if (!c.on && t >= c.next) start(c, t);
    const on = active();
    for (const c of on){ const r = c.r, front = c.s + c.len/2; let gap = 1e9, vl = 0, v0 = r.v0;
      const block = (s, lead = 0, s0 = 0.12) => { const g = s - front - s0; if (g < gap){ gap = g; vl = lead; } };   // a line ahead it must not pass
      // the bends ahead: no faster than it can slow down to each
      for (let s = c.s; s < Math.min(r.L, c.s + LOOK); s += STEP){ const k = r.K[Math.round(s/STEP)]; v0 = Math.min(v0, Math.sqrt(k*k + 2*B*(s - c.s))); }
      // cars ahead in its path (any route): the nearest point of its path within half a lane of that car
      for (const o of on){ if (o === c) continue; if (Math.abs(o.x - c.x) > LOOK + 2 || Math.abs(o.z - c.z) > LOOK + 2) continue;
        let dh = Math.abs(o.h - c.h) % (2*Math.PI); if (dh > Math.PI) dh = 2*Math.PI - dh;
        for (let s = c.s + 0.3; s < Math.min(r.L, c.s + LOOK); s += STEP){ const p = r.P[Math.round(s/STEP)], d = Math.hypot(p[0] - o.x, p[1] - o.z);
          if (d < (dh < 1.3 ? 0.62 : 0.55 + o.len/2)){ const g = s - c.s - c.len/2 - (dh < 1.3 ? o.len/2 : o.wid/2); if (g - S0 + 0.12 < gap){ gap = g - S0 + 0.12; vl = dh < 1.3 ? o.v*Math.cos(dh) : 0; } break; } } }
      // controls: stop signs, the light, the drop-off
      for (const k of r.ctrl){ if (c.done.has(k) || k.s < c.s - 0.5) continue; const ks = k.kind === 'dwell' ? k.s + c.len/2 : k.s, dist = ks - front;
        if (dist > LOOK) break;
        if (k.kind === 'signal'){ const st = light(k.light, t);
          if (st === 'g' || (st === 'y' && dist < c.v*c.v/(2*B) + 0.1)){ if (dist < 0.3 || st === 'y') c.done.add(k); continue; }
          if (k.rtor && c.v < 0.05 && dist < 0.4){ c.wait += dt; if (c.wait > 1.2){ c.done.add(k); c.wait = 0; continue; } }
          block(k.s); continue; }
        // stop and dwell: up to the line, a full stop, then on
        if (dist < 0.4 && c.v < 0.05){ c.wait += dt; if (c.wait > (k.kind === 'dwell' ? k.dur : 0.9)){ c.done.add(k); c.wait = 0; continue; } }
        block(ks); }
      // crossings and merges: free, and (from a stop sign, or across traffic) a gap in the other stream
      const want = [];
      for (const m of r.conf){ if (m.s1 + c.len/2 + 0.4 < c.s){ if (m.c.holder === c){ m.c.holder = null; c.held.delete(m.c); } continue; }
        if (m.s0 - front > Math.max(3.5, c.v*c.v/(2*B) + 2)) break; want.push(m); }
      let ok = true; const clear = [];
      for (const m of want){ if (m.s0 < front - 0.05){ if (!m.c.holder){ m.c.holder = c; c.held.add(m.c); } continue; }   // already in it: through
        if (m.c.holder && m.c.holder !== c){ ok = false; break; }
        if (m.c.holder === c) continue;
        if (minorAt(r, m.s0)) for (const o of on){ if (o === c || o.r !== m.other) continue; const d = m.os0 - (o.s + o.len/2);
          if (d > -o.len - 0.6 && d < 14 && (d < 1.2 || d/Math.max(o.v, 0.4) < GAP)){ ok = false; break; } }
        if (!ok) break; clear.push(m); }
      if (ok){ for (const m of clear) if (m.s0 - front < Math.max(2.2, c.v*1.3)){ m.c.holder = c; c.held.add(m.c); } }
      else { const m = want.find(m => m.c.holder !== c && m.s0 >= front - 0.05); if (m) block(m.s0, 0, 0.3); }
      // people on, or about to step onto, its path
      for (const pd of r.peds){ const dist = pd.s - front; if (pd.s < c.s - c.len/2) continue; if (dist > LOOK) break; if (dist < -0.1) continue;
        for (const w of W){ const dx = pd.x - w.x, dz = pd.z - w.z; if (Math.abs(dx) > 3 || Math.abs(dz) > 3) continue; const d = Math.hypot(dx, dz), toward = dx*w.vx + dz*w.vz > 0;
          if (d < 0.75 || (toward && d < 0.75 + Math.hypot(w.vx, w.vz)*1.8)){ if (dist > 0.05 || c.v > 0.3) block(pd.s - 0.45, 0, 0.12); break; } } }
      // the Intelligent Driver Model
      const ss = S0 + Math.max(0, c.v*HW + c.v*(c.v - vl)/(2*Math.sqrt(A*B)));
      let acc = A*(1 - Math.pow(c.v/Math.max(v0, 0.05), 4) - (gap < 1e8 ? Math.pow(ss/Math.max(gap + S0, 0.02), 2) : 0));
      if (gap <= 0.01) acc = -BMAX*4; c.acc = Math.max(-BMAX, acc); }
    for (const c of on){ c.v = Math.max(0, c.v + c.acc*dt); c.s += c.v*dt; if (c.v > 0.05) c.wait = 0;
      if (c.s >= c.r.L) finish(c, t); else place(c); } }
  function draw(){ for (const c of V){ if (!c.on){ c.g.visible = false; c.g.position.set(c.i*5, -50, 0); continue; } c.g.visible = true; c.g.position.set(c.x, 0.2, c.z); c.g.rotation.y = c.h; } }
  function run(t){ let fresh = false;
    if (T === null || t < T - 1e-6){ V.forEach(c => { c.on = false; c.held.clear(); c.next = c.i*1.1 + t - 45; c.ri = c.gi = 0; }); CONF.forEach(k => { k.holder = null; }); PEOPLE.reset(t - 45); T = t - 45; fresh = true; }
    let left = t - T; if (left > 3 && !fresh){ T = t - DT; left = DT; }   // a hidden page or a long pause: carry on from here
    while (left > 1e-6){ const d = Math.min(DT, left); T += d; left -= d; step(T, d); }
    showLights(t); draw(); PEOPLE.draw();
    if ((t*2|0) !== AMB.userData.f){ AMB.userData.f = t*2|0; ambLights(AMB.userData.f % 2); } }
  return { run, R, V, CONF, light, MORE, PEOPLE };
})();
const traffic = t => TRAFFIC.run(t);
