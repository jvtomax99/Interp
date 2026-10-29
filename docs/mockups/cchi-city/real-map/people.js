// ---- people (Jose, 2026-10-29, prompt 3: "sidewalks, crosswalks, real doors, waiting at the ER and main entrance,
// pairs, wheelchairs, standing and talking; never through walls, cars, trees or each other") ----
// Everyone walking follows a route on the sidewalks, from a door or the board's edge to a door or the edge: out of Link
// Pavilion's main entrance, Jurist's door on Prospect, Medical Plaza's doors, the Cancer Center's door on 2nd Street.
// On Prospect's busy sidewalk each way keeps to its own side (to the right, as people do); on the side streets each
// sidewalk is walked one way. Nobody walks through anybody: a person slows behind someone slower and waits for someone
// crossing in front (when two would wait for each other, one goes first). Streets are crossed on the crosswalks only,
// from the curb, when no car is coming or the cars have stopped, and never stopped halfway (a median is a place to
// wait). A couple walks side by side on the far sidewalk, a child a step behind a parent, a wheelchair slowly with the
// one pushing it. The people standing and talking (waiting at the main entrance, at the ER's doors, by the benches) are
// IDLE's, not moved here. traffic.js steps them (makePeople is called from it) before the cars, so the cars see them.
function makePeople(){
  const STEP = 0.1, ZE = 13.06, ZW = 12.75, ZS = 17.6, XL = BX0 + 0.3, XR = BX1 - 0.3, CURB = 0.85, LOOKP = 1.5;
  const lerp = (a, b, f) => [a[0] + (b[0] - a[0])*f, a[1] + (b[1] - a[1])*f];
  const until = (pts, ok) => { const out = [pts[0]]; for (let i = 1; i < pts.length; i++){ const a = pts[i-1], b = pts[i];
      if (!ok(b)){ let lo = 0, hi = 1; for (let k = 0; k < 30; k++){ const m = (lo + hi)/2; if (ok(lerp(a, b, m))) lo = m; else hi = m; } out.push(lerp(a, b, lo)); return out; }
      out.push(b); } return out; };
  function sample(pts){ const P = [[pts[0][0], pts[0][1]]]; let carry = 0;
    for (let i = 1; i < pts.length; i++){ const a = pts[i-1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); let d = STEP - carry;
      while (d <= l){ P.push(lerp(a, b, d/l)); d += STEP; } carry = l - (d - STEP); }
    const e = pts[pts.length - 1]; if (Math.hypot(e[0] - P[P.length - 1][0], e[1] - P[P.length - 1][1]) > 0.01) P.push([e[0], e[1]]); return P; }
  function route(name, pts, y = 0.1){ const Q = sample(pts), n = Q.length, H = [];
    for (let i = 0; i < n; i++){ const a = Q[Math.max(0, i - 3)], b = Q[Math.min(n - 1, i + 3)]; H.push(Math.atan2(b[0] - a[0], b[1] - a[1])); }
    return { name, P: Q, H, L: STEP*(n - 1), y, zones: [] }; }
  const at = (r, s) => { const f = Math.max(0, Math.min(r.P.length - 1, s/STEP)), i = Math.min(r.P.length - 2, Math.floor(f)), k = f - i, a = r.P[i], b = r.P[i+1];
    let ha = r.H[i], hb = r.H[i+1]; if (hb - ha > Math.PI) hb -= 2*Math.PI; if (ha - hb > Math.PI) hb += 2*Math.PI;
    return [a[0] + (b[0] - a[0])*k, a[1] + (b[1] - a[1])*k, ha + (hb - ha)*k]; };

  // ---- the walking lines ----
  // Link's main entrance: the revolving door in the lobby's glass under the building, between the bollards to the lobby's
  // sidewalk, its crosswalk over the drive-through, past the brick pier on the outer sidewalk, over the drive-through's
  // mouth to the end of Jurist's walk
  const LINK = [[1.1, -11.0], [0.83, -10.85], [0.83, -10.4], [-0.6, -10.4], [-0.6, -6.45], [-1.75, -6.45], [-2.45, -6.7], [-3.7, -5.4], [-5.0, -4.0]];
  const JSIDE = [-5.0, 9.4];                                              // Jurist's side door onto its walk (the nurses')
  const JDOOR = [-9.12, 10.45], MPDOOR = [13.0, 11.25];                   // Jurist's door on Prospect; Medical Plaza's, under its piers
  const BW = BACKWALKS.map(w => w.pts.map(p => [p[0], p[2]]));            // the side streets' sidewalks (cleared of walls, columns, signs)
  const [secS, secN, atlW, , ] = BW, essE = BW[3];
  const rev = a => a.slice().reverse();
  // Atlantic's west sidewalk and Essex's east one, walked south, end where they meet Prospect's sidewalk
  const atlSouth = until(atlW[0][1] < atlW[atlW.length - 1][1] ? atlW : rev(atlW), p => p[1] <= ZW);
  const essSouth = until(essE[0][1] < essE[essE.length - 1][1] ? essE : rev(essE), p => p[1] <= ZW);
  const last = a => a[a.length - 1];
  // the Cancer Center's door, from 2nd Street's north sidewalk walked west
  const secWest = secN[0][0] > last(secN)[0] ? secN : rev(secN), NDOOR = [-28.41, -53.85];
  const secToN = [...until(secWest, p => p[0] >= NDOOR[0]), [NDOOR[0], NDOOR[1] + 1.4], NDOOR];
  const R = {
    east: route('Prospect, walking east', [[XL, ZE], [XR, ZE]]),
    west: route('Prospect, walking west', [[XR, ZW], [XL, ZW]]),
    far: route('the far sidewalk', [[BX0 + 3, ZS], [BX1 - 3, ZS]]),
    linkIn: route('from the west into Link', [[XL, ZE], [-5.0, ZE], ...rev(LINK)]),   // on the curb side, clear of the benches
    nurseIn: route('Jurist to Link', [JSIDE, ...rev(LINK)]),
    nurseOut: route('Link to Jurist', [...LINK, JSIDE]),
    jurToMp: route('Jurist to Medical Plaza', [JDOOR, [JDOOR[0], ZE], [MPDOOR[0], ZE], MPDOOR]),
    mpOut: route('out of Medical Plaza to the west', [MPDOOR, [MPDOOR[0], ZW], [XL, ZW]]),
    toMp: route('from the east into Medical Plaza', [[XR, ZW], [MPDOOR[0], ZW], MPDOOR]),
    sec: route('2nd Street, south side', secS[0][0] < last(secS)[0] ? secS : rev(secS), 0.12),
    secN: route('2nd Street to the Cancer Center', secToN, 0.12),
    atlHome: route('down Atlantic, west on Prospect', [...atlSouth, [last(atlSouth)[0], ZW], [XL, ZW]], 0.12),
    atlMp: route('down Atlantic, across, to Medical Plaza', [...atlSouth, [last(atlSouth)[0] + 0.2, ZE], [MPDOOR[0], ZE], MPDOOR], 0.12),
    essex: route('down Essex, across, to Medical Plaza', [...essSouth, [last(essSouth)[0], ZW], [MPDOOR[0], ZW], MPDOOR], 0.12),
  };
  const ROUTES = Object.values(R);

  // ---- who walks: [figure, routes in turn, pauses (s), speed (units/s), partner] ----
  const W = WALKS, B = BACKWALKS;
  const partner = (kind, i, o) => ({ g: person(kind, i), ...o });
  const P = [
    [W[0].g, ['east'], [6, 11], 0.85], [W[1].g, ['west', 'toMp'], [5, 9], 0.75], [W[2].g, ['nurseIn', 'nurseOut'], [4, 7], 0.95],
    [W[3].g, ['jurToMp', 'east'], [7, 5], 0.95], [W[4].g, ['linkIn'], [14], 0.55], [W[5].g, ['mpOut'], [12], 0.7, partner('visitor', 3, { behind: 0.5 })],
    [W[6].g, ['far'], [10], 0.55, partner('elder', 2, { side: -0.28, b: 0 })], [W[7].g, ['far'], [16], 0.7],
    [B[0].g, ['sec'], [5, 8], 0.9], [B[1].g, ['secN'], [9], 0.85], [B[2].g, ['atlHome'], [8], 0.85], [B[3].g, ['essex'], [7], 0.85], [B[4].g, ['atlMp'], [11], 0.95],
    [person('doctor', 4), ['west'], [9, 6], 0.95],
  ].map(([g, rs, gaps, v0, pair], i) => { g.traverse(o => { o.castShadow = false; }); if (pair) pair.g.traverse(o => { o.castShadow = false; });
    return { g, i, rs: rs.map(k => R[k]), gaps, v0, pair, ri: 0, gi: 0, on: false, next: i*2.3, s: 0, v: 0, r: null, x: 0, z: 0, h: 0, vx: 0, vz: 0, step: 0, done: new Set(), size: g === W[4].g ? 0.45 : 0.18 }; });   // the wheelchair and the one pushing it take more room

  // ---- where a walk crosses a car's lane: the crossings, grouped by street (a median between two is a place to wait) ----
  function crossWith(CR){
    for (const r of ROUTES){ const hits = [];
      for (const c of CR) for (let i = 1; i < r.P.length; i++){ const a = r.P[i-1], b = r.P[i], js = new Set(), gx = Math.floor(a[0]), gz = Math.floor(a[1]);
        for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (const j of c.grid.get((gx + dx) + ',' + (gz + dz)) || []){ if (j > 0) js.add(j); if (j + 1 < c.P.length) js.add(j + 1); }
        for (const j of js){ const p = c.P[j-1], q = c.P[j]; if (Math.max(a[0], b[0]) < Math.min(p[0], q[0]) - 0.01 || Math.min(a[0], b[0]) > Math.max(p[0], q[0]) + 0.01 || Math.max(a[1], b[1]) < Math.min(p[1], q[1]) - 0.01 || Math.min(a[1], b[1]) > Math.max(p[1], q[1]) + 0.01) continue;
          const d1x = b[0] - a[0], d1z = b[1] - a[1], d2x = q[0] - p[0], d2z = q[1] - p[1], den = d1x*d2z - d1z*d2x; if (Math.abs(den) < 1e-9) continue;
          const u = ((p[0] - a[0])*d2z - (p[1] - a[1])*d2x)/den, v = ((p[0] - a[0])*d1z - (p[1] - a[1])*d1x)/den;
          if (u >= 0 && u <= 1 && v >= 0 && v <= 1) hits.push({ s: (i - 1 + u)*STEP, car: c, cs: (j - 1 + v)*c.STEP, x: a[0] + d1x*u, z: a[1] + d1z*u }); } }
      hits.sort((x, y) => x.s - y.s); for (let k = hits.length - 1; k > 0; k--) if (hits[k].car === hits[k-1].car && hits[k].s - hits[k-1].s < 0.05) hits.splice(k, 1);
      for (const h of hits){ const zn = r.zones[r.zones.length - 1]; if (zn && h.s - zn.last < 2.0){ zn.last = h.s; zn.hits.push(h); } else r.zones.push({ first: h.s, last: h.s, hits: [h] }); }
      r.zones.forEach(zn => { zn.curb = zn.first - CURB; }); }
    // for the cars: every point where a person may step in front of them
    const pts = []; ROUTES.forEach(r => r.zones.forEach(zn => zn.hits.forEach(h => pts.push(h)))); return pts; }

  // ---- one step ----
  const active = () => P.filter(p => p.on);
  // where a person is: on the line, or stepped aside to the right (p.off) to pass someone coming the other way
  function place(p){ const [x, z, h] = at(p.r, p.s), ox = p.x, oz = p.z; p.x = x - Math.cos(h)*p.off; p.z = z + Math.sin(h)*p.off; p.h = h; return [ox, oz]; }
  // where a person's partner is: beside (to the right) or a step behind
  // side by side, or (q.b toward 1) falling in a step behind to pass a tree or someone standing
  const partnerAt = p => { const q = p.pair; if (q.side){ const sx = p.x - Math.cos(p.h)*q.side, sz = p.z + Math.sin(p.h)*q.side; if (!q.b) return [sx, sz, p.h];
      const [bx, bz] = at(p.r, Math.max(0, p.s - 0.6)); return [sx + (bx - sx)*q.b, sz + (bz - sz)*q.b, p.h]; }
    const [x, z, h] = at(p.r, Math.max(0, p.s - q.behind)); return [x, z, h]; };
  // what stands in the far sidewalk: the map's street trees, the diorama's own along the front (its verge list), the people standing
  const OBST = [...SCN.trees.map(t => [t[0], t[1]]), ...[-16, -13, -10, -7.6, -3, 0.6, 5, 7.2, 12, 13.4, 17].map(x => [x, 17.3]), ...IDLE.map(o => [o.g.position.x, o.g.position.z])];
  const sideBlocked = p => { const q = p.pair; for (let s = p.s - 0.3; s < p.s + 0.9; s += 0.15){ const [x, z, h] = at(p.r, Math.max(0, s)), sx = x - Math.cos(h)*q.side, sz = z + Math.sin(h)*q.side;
      if (OBST.some(([ox, oz]) => Math.abs(ox - sx) < 0.4 && Math.abs(oz - sz) < 0.4 && Math.hypot(ox - sx, oz - sz) < 0.4)) return true; } return false; };
  const partnerOut = p => !p.pair || p.pair.side || (p.s >= p.pair.behind && p.s - p.pair.behind <= p.r.L);   // a step behind: not out of the door yet, or already in
  const leaderOut = p => p.s <= p.r.L;
  const bodies = on => { const out = []; for (const p of on){ if (!leaderOut(p)){ if (partnerOut(p)){ const [x, z, h] = partnerAt(p); out.push([p, x, z, h, 0.18]); } continue; } if (p.size > 0.3){ out.push([p, p.x, p.z, p.h, 0.3], [p, p.x - Math.sin(p.h)*0.5, p.z - Math.cos(p.h)*0.5, p.h, 0.3]); } else out.push([p, p.x, p.z, p.h, p.size]); if (p.pair && partnerOut(p)){ const [x, z, h] = partnerAt(p); out.push([p, x, z, h, 0.18]); } } return out; };
  function start(p, t){ const r = p.rs[p.ri % p.rs.length], p0 = r.P[0];
    if (P.some(o => o.on && Math.hypot(o.x - p0[0], o.z - p0[1]) < 0.9)) return;
    p.r = r; p.s = 0; p.v = 0; p.off = 0; p.done.clear(); p.on = true; place(p); p.vx = p.vz = 0; }
  function finish(p, t){ p.on = false; p.next = t + p.gaps[p.gi++ % p.gaps.length]; p.ri++; }
  // is the street clear for this crossing? no car on it, none coming that would not stop in time
  function clearToCross(zn, cars){ for (const h of zn.hits) for (const c of cars){ if (!c.on || c.r !== h.car) continue; const d = h.cs - (c.s + c.len/2);
      if (d < -c.len - 0.4 || d > 11) continue; if (d < 0.7) return false; if (c.v > 0.3 && d/c.v < 3.4) return false; } return true; }
  function step(t, dt, cars){
    for (const p of P) if (!p.on && t >= p.next) start(p, t);
    const on = active(), B = bodies(on), want = new Map();
    // who is in whose way: someone within reach of the path ahead, not walking toward it on the other side
    for (const p of on){ let lim = 1e9, who = null, aside = 0;
      for (const [q, x, z, h, size] of B){ if (q === p) continue; if (Math.abs(x - p.x) > LOOKP + 2 || Math.abs(z - p.z) > LOOKP + 2) continue;
        let dh = Math.abs(h - p.h) % (2*Math.PI); if (dh > Math.PI) dh = 2*Math.PI - dh;
        // coming the other way: if on the same line, both step to their right to pass
        if (dh > 2.6){ for (let s = p.s; s < Math.min(p.r.L, p.s + LOOKP + 1); s += STEP*2){ const [px, pz] = at(p.r, s); if (Math.hypot(px - x, pz - z) < 0.28){ aside = 0.2; break; } } continue; }
        for (let s = p.s + 0.1; s < Math.min(p.r.L, p.s + LOOKP); s += STEP){ const [px, pz] = at(p.r, s); if (Math.hypot(px - x, pz - z) < p.size*0.5 + size*0.5 + 0.12){ const g = s - p.s - 0.32; if (g < lim){ lim = g; who = q; } break; } } }
      p.off += ((aside || (p.off > 0.02 && B.some(([q, x, z]) => q !== p && Math.hypot(x - p.x, z - p.z) < 0.7) ? p.off : 0)) - p.off)*Math.min(1, dt*4);   // back to the line once they have passed
      want.set(p, { lim, who }); }
    for (const p of on){ const w = want.get(p); let v0 = p.v0;
      // two waiting for each other: the one further along its list goes first
      if (w.who && want.get(w.who) && want.get(w.who).who === p && w.who.i > p.i) w.lim = 1e9;
      if (w.lim < 1e8) v0 = Math.min(v0, Math.max(0, w.lim)*2.2);
      // the curb: wait for a clear street, then across without stopping
      for (const zn of p.r.zones){ if (p.done.has(zn)) continue; const d = zn.curb - p.s; if (d < 0){ p.done.add(zn); continue; } if (d > 1.2) break;
        if (!clearToCross(zn, cars)) v0 = Math.min(v0, Math.max(0, d - 0.02)*2.5); else if (d < 0.08) p.done.add(zn); break; }
      if (p.pair && p.pair.side) p.pair.b = Math.max(0, Math.min(1, p.pair.b + (sideBlocked(p) ? 2.5 : -1.5)*dt));
      const acc = v0 > p.v ? 1.6 : -4; p.v = v0 > p.v ? Math.min(v0, p.v + acc*dt) : Math.max(v0, p.v + acc*dt); }
    for (const p of on){ p.s += p.v*dt; if (p.s >= p.r.L + (p.pair && p.pair.behind || 0)){ finish(p, t); continue; } if (p.s > p.r.L){ p.vx = p.vz = 0; continue; } const [ox, oz] = place(p); p.vx = (p.x - ox)/dt; p.vz = (p.z - oz)/dt; p.step += p.v*dt; } }
  function draw(){ for (const p of P){ const all = p.pair ? [p.g, p.pair.g] : [p.g];
      if (!p.on){ all.forEach((g, k) => { g.visible = false; g.position.set(p.i*3 + k, -50, 5); }); continue; }
      const f = p.v > 0.05 ? (Math.floor(p.step/0.22) % 2) : 0, y = p.r.y;
      p.g.visible = leaderOut(p); p.g.position.set(p.x, y, p.z); p.g.rotation.y = p.h; stride(p.g, f);
      if (p.pair){ const [x, z, h] = partnerAt(p); p.pair.g.visible = partnerOut(p); p.pair.g.position.set(x, y, z); p.pair.g.rotation.y = h; stride(p.pair.g, 1 - f); } } }
  function reset(t){ P.forEach(p => { p.on = false; p.ri = p.gi = 0; p.next = p.i*2.3 + t; }); }
  // everyone on the board now, partners included, for the cars to see
  const now = () => { const out = []; for (const p of P){ if (!p.on) continue; if (leaderOut(p)) out.push({ x: p.x, z: p.z, vx: p.vx, vz: p.vz });
      if (p.pair && partnerOut(p)){ const [x, z] = partnerAt(p); out.push({ x, z, vx: p.vx, vz: p.vz }); } } return out; };
  return { P, R, ROUTES, crossWith, step, draw, reset, now, EXTRA: P.flatMap(p => [p.g, ...(p.pair ? [p.pair.g] : [])]).filter(g => !WALKS.some(w => w.g === g) && !BACKWALKS.some(w => w.g === g)) };
}
