// The traffic, measured (Jose's prompt 2, 2026-10-29). Loads the built preview (build.py's page) with its motion frozen,
// runs the live clock (life(t)) for three minutes in thirtieths of a second, and counts what real traffic never does:
//   overlap    two cars' bodies (their outlines on the ground) touching
//   person     a car's body over a person
//   slide      a car moving sideways: its heading more than 12 deg off the way it is going
//   rolled     a car past a stop sign without having stopped at its line
//   red        a car over the light's line on red (a right on red after a stop is allowed)
//   stuck      a car standing still for more than 40 s
// and for the people (people.js):
//   crowd      two people closer than 0.25 (a couple or a child and parent with each other aside), or someone walking
//              within 0.3 of someone standing or sitting
//   street     someone standing still out on a street (waiting is for the curb or a median)
//   waits      someone standing still for more than 30 s
// and reports each route's finished runs and slowest one.
//   node traffic_check.cjs <campus.html> [seconds]
const { open } = require('./card_page.cjs');
const [HTML, SECS] = process.argv.slice(2);
(async () => {
  const { page, close } = await open(HTML, { w: 400, h: 400 });
  const res = await page.evaluate(secs => {
    window.__freeze = true;
    const L = window.__L, TR = L.TRAFFIC, V = TR.V, DT = 1/30;
    const walkers = TR.PEOPLE.P.flatMap(p => [p.g, ...(p.pair ? [p.pair.g] : [])]);
    const box = c => { const s = Math.sin(c.h), k = Math.cos(c.h), l = c.len/2, w = c.wid/2;   // forward (s, k), right (-k, s)
      return [[c.x + s*l - k*w, c.z + k*l + s*w], [c.x + s*l + k*w, c.z + k*l - s*w], [c.x - s*l + k*w, c.z - k*l - s*w], [c.x - s*l - k*w, c.z - k*l + s*w]]; };
    const sep = (P, Q) => { for (const R of [P, Q]) for (let i = 0; i < 4; i++){ const a = R[i], b = R[(i + 1) % 4], nx = b[1] - a[1], nz = a[0] - b[0];
        const pr = S => S.map(p => p[0]*nx + p[1]*nz), p = pr(P), q = pr(Q); if (Math.max(...p) < Math.min(...q) || Math.max(...q) < Math.min(...p)) return true; } return false; };
    const inBox = (B, x, z, r) => { for (let i = 0; i < 4; i++){ const a = B[i], b = B[(i + 1) % 4], nx = b[1] - a[1], nz = a[0] - b[0], L = Math.hypot(nx, nz);
        if (((x - a[0])*nx + (z - a[1])*nz)/L > r) return false; } return true; };
    const n = { overlap: 0, person: 0, slide: 0, rolled: 0, red: 0, stuck: 0, crowd: 0, street: 0, waits: 0 }, where = { overlap: [], person: [], slide: [], rolled: [], red: [], stuck: [], crowd: [], street: [], waits: [] };
    const seen = new Set(), PP = TR.PEOPLE, still2 = new Map(), prunsP = {}, prevP = new Map();
    const fixed = [...L.IDLE.map(o => o.g), ...L.SITTERS.map(o => o.g)];
    const note = (k, c, t, what) => { n[k]++; if (where[k].length < 12) where[k].push(`${t.toFixed(1)}s ${c.r ? c.r.name : '?'} at (${c.x.toFixed(1)}, ${c.z.toFixed(1)})${what ? ' ' + what : ''}`); };
    const runs = {}, prev = new Map(), still = new Map(), minV = new Map();
    L.life(0);
    for (let t = DT; t <= secs; t += DT){ L.life(t);
      const on = V.filter(c => c.on), B = on.map(box);
      for (let i = 0; i < on.length; i++){ for (let j = i + 1; j < on.length; j++) if (!sep(B[i], B[j])) note('overlap', on[i], t, 'and ' + on[j].r.name);
        for (const g of walkers) if (g.visible && inBox(B[i], g.position.x, g.position.z, 0.12)) note('person', on[i], t); }
      for (const c of V){ const p = prev.get(c);
        if (!c.on){ if (p && p.on){ const k = p.r.name; (runs[k] = runs[k] || { n: 0, worst: 0 }).n++; runs[k].worst = Math.max(runs[k].worst, t - p.t0); } prev.set(c, { on: false }); still.delete(c); continue; }
        const fresh = !p || !p.on || p.r !== c.r;
        if (!fresh){ const dx = c.x - p.x, dz = c.z - p.z, d = Math.hypot(dx, dz);
          if (d > 0.02){ let a = Math.abs(Math.atan2(dx, dz) - c.h) % (2*Math.PI); if (a > Math.PI) a = 2*Math.PI - a; if (a > 12*Math.PI/180) note('slide', c, t, (a*180/Math.PI).toFixed(0) + ' deg'); }
          // its lines: a stop sign passed with no stop, the light passed on red
          for (const k of c.r.ctrl){ const f0 = p.s + c.len/2, f1 = c.s + c.len/2; if (!(f0 < k.s && f1 >= k.s)) continue;
            if (k.kind === 'stop' && (minV.get(c.i + ':' + c.r.ctrl.indexOf(k)) ?? 9) > 0.06) note('rolled', c, t, 'stop at ' + k.s.toFixed(1));
            if (k.kind === 'signal' && TR.light(k.light, t) === 'r' && !(k.rtor && c.done.has(k))) note('red', c, t); }
          // the slowest it went near each stop line
          for (const k of c.r.ctrl) if (Math.abs(k.s - c.s - c.len/2) < 0.6) minV.set(c.i + ':' + c.r.ctrl.indexOf(k), Math.min(minV.get(c.i + ':' + c.r.ctrl.indexOf(k)) ?? 9, c.v));
          if (c.v < 0.02){ const s0 = still.get(c) ?? t; still.set(c, s0); if (t - s0 > 40 && t - s0 < 40 + DT*1.5) note('stuck', c, t); } else still.delete(c); }
        else { for (const k of c.r.ctrl) minV.delete(c.i + ':' + c.r.ctrl.indexOf(k)); }
        prev.set(c, { on: true, r: c.r, x: c.x, z: c.z, s: c.s, t0: fresh ? t : p.t0 }); }
      // the people
      const pon = PP.P.filter(p => p.on), pt = g => [g.position.x, g.position.z], behind = (g, d) => [g.position.x - Math.sin(g.rotation.y)*d, g.position.z - Math.cos(g.rotation.y)*d];
      // each body a point; a wheelchair two (the chair, and the one pushing it half a unit behind)
      const bodies = pon.flatMap(p => [[p, pt(p.g)], ...(p.size > 0.3 ? [[p, behind(p.g, 0.5)]] : []), ...(p.pair ? [[p, pt(p.pair.g)]] : [])]);
      const pnote = (k, p, what) => { n[k]++; const key = k + p.r.name + Math.round(p.x/2) + ',' + Math.round(p.z/2) + (what || '').replace(/[0-9.]+$/, ''); if (seen.has(key)) return; seen.add(key); if (where[k].length < 40) where[k].push(`${t.toFixed(1)}s ${p.r.name} at (${p.x.toFixed(1)}, ${p.z.toFixed(1)})${what ? ' ' + what : ''}`); };
      const fixedPts = fixed.filter(f => f.visible).flatMap(f => f.userData.legs && f.children.length > 4 && f.userData.h > 1.05 && f.userData.head === undefined ? [pt(f), behind(f, 0.5)] : [pt(f)]);
      for (let i = 0; i < bodies.length; i++){ const [p, a] = bodies[i];
        for (let j = i + 1; j < bodies.length; j++){ const [q, b] = bodies[j]; if (q === p) continue; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (d < 0.25) pnote('crowd', p, 'and ' + q.r.name + ' ' + d.toFixed(2)); }
        for (const f of fixedPts){ const d = Math.hypot(a[0] - f[0], a[1] - f[1]); if (d < 0.3) pnote('crowd', p, 'and someone standing ' + d.toFixed(2)); } }
      for (const p of PP.P){ const q = prevP.get(p);
        if (!p.on){ if (q && q.on){ const k = q.r.name; (prunsP[k] = prunsP[k] || { n: 0, worst: 0 }).n++; prunsP[k].worst = Math.max(prunsP[k].worst, t - q.t0); } prevP.set(p, { on: false }); still2.delete(p); continue; }
        const fresh = !q || !q.on || q.r !== p.r; prevP.set(p, { on: true, r: p.r, t0: fresh ? t : q.t0 });
        if (p.v < 0.02){ const s0 = still2.get(p) ?? t; still2.set(p, s0); if (t - s0 > 30 && t - s0 < 30 + DT*1.5) pnote('waits', p);
          if (p.r.zones.some(zn => p.s > zn.first - 0.3 && p.s < zn.last + 0.3) && t - s0 > 0.5 && t - s0 < 0.5 + DT*1.5) pnote('street', p); } else still2.delete(p); } }
    return { n, where, runs, people: prunsP, conflicts: TR.CONF.length, routes: Object.values(TR.R).map(r => `${r.name}: ${r.L.toFixed(0)} long, ${r.conf.length} meetings, ${r.peds.length} crossings`) };
  }, +(SECS || 180));
  console.log(JSON.stringify(res, null, 1));
  await close();
})();
