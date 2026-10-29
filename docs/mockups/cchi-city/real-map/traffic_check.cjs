// The traffic, measured (Jose's prompt 2, 2026-10-29). Loads the built preview (build.py's page) with its motion frozen,
// runs the live clock (life(t)) for three minutes in thirtieths of a second, and counts what real traffic never does:
//   overlap    two cars' bodies (their outlines on the ground) touching
//   person     a car's body over a person
//   slide      a car moving sideways: its heading more than 12 deg off the way it is going
//   rolled     a car past a stop sign without having stopped at its line
//   red        a car over the light's line on red (a right on red after a stop is allowed)
//   stuck      a car standing still for more than 40 s
// and reports each route's finished runs and slowest one.
//   node traffic_check.cjs <campus.html> [seconds]
const { open } = require('./card_page.cjs');
const [HTML, SECS] = process.argv.slice(2);
(async () => {
  const { page, close } = await open(HTML, { w: 400, h: 400 });
  const res = await page.evaluate(secs => {
    window.__freeze = true;
    const L = window.__L, TR = L.TRAFFIC, V = TR.V, DT = 1/30;
    const walkers = [...L.WALKS, ...L.BACKWALKS].map(w => w.g);
    const box = c => { const s = Math.sin(c.h), k = Math.cos(c.h), l = c.len/2, w = c.wid/2;   // forward (s, k), right (-k, s)
      return [[c.x + s*l - k*w, c.z + k*l + s*w], [c.x + s*l + k*w, c.z + k*l - s*w], [c.x - s*l + k*w, c.z - k*l - s*w], [c.x - s*l - k*w, c.z - k*l + s*w]]; };
    const sep = (P, Q) => { for (const R of [P, Q]) for (let i = 0; i < 4; i++){ const a = R[i], b = R[(i + 1) % 4], nx = b[1] - a[1], nz = a[0] - b[0];
        const pr = S => S.map(p => p[0]*nx + p[1]*nz), p = pr(P), q = pr(Q); if (Math.max(...p) < Math.min(...q) || Math.max(...q) < Math.min(...p)) return true; } return false; };
    const inBox = (B, x, z, r) => { for (let i = 0; i < 4; i++){ const a = B[i], b = B[(i + 1) % 4], nx = b[1] - a[1], nz = a[0] - b[0], L = Math.hypot(nx, nz);
        if (((x - a[0])*nx + (z - a[1])*nz)/L > r) return false; } return true; };
    const n = { overlap: 0, person: 0, slide: 0, rolled: 0, red: 0, stuck: 0 }, where = { overlap: [], person: [], slide: [], rolled: [], red: [], stuck: [] };
    const note = (k, c, t, what) => { n[k]++; if (where[k].length < 12) where[k].push(`${t.toFixed(1)}s ${c.r ? c.r.name : '?'} at (${c.x.toFixed(1)}, ${c.z.toFixed(1)})${what ? ' ' + what : ''}`); };
    const runs = {}, prev = new Map(), still = new Map(), minV = new Map();
    L.life(0);
    for (let t = DT; t <= secs; t += DT){ L.life(t);
      const on = V.filter(c => c.on), B = on.map(box);
      for (let i = 0; i < on.length; i++){ for (let j = i + 1; j < on.length; j++) if (!sep(B[i], B[j])) note('overlap', on[i], t, 'and ' + on[j].r.name);
        for (const g of walkers) if (inBox(B[i], g.position.x, g.position.z, 0.12)) note('person', on[i], t); }
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
        prev.set(c, { on: true, r: c.r, x: c.x, z: c.z, s: c.s, t0: fresh ? t : p.t0 }); } }
    return { n, where, runs, conflicts: TR.CONF.length, routes: Object.values(TR.R).map(r => `${r.name}: ${r.L.toFixed(0)} long, ${r.conf.length} meetings, ${r.peds.length} crossings`) };
  }, +(SECS || 180));
  console.log(JSON.stringify(res, null, 1));
  await close();
})();
