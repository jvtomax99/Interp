// ==================== the back of the campus, from the real map (Jose, 2026-10-27) ====================
// The ground at the front is the hand-built diorama (Prospect, the drive, the fountain, the drop-off). Every building,
// the front's three included (Jose, 2026-10-28), and every street, lot and garage beyond it is placed from his
// OpenStreetMap export, at the front's own scale
// (1 unit is about 4.3 m), fitted to it by the drive's mouth, Jurist and Medical Plaza. Floors are read off his
// Google 3D flyover, so they are estimates. Map data © OpenStreetMap contributors (ODbL).
const SCN = __SCENE__;
const [BX0, BX1, BZ0, BZ1] = SCN.board, BCX = (BX0 + BX1)/2, BCZ = (BZ0 + BZ1)/2, BW = BX1 - BX0, BD = BZ1 - BZ0;
const inside = (pts, x, z) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++){ const [ax, az] = pts[i], [bx, bz] = pts[j]; if ((az > z) !== (bz > z) && x < (bx - ax)*(z - az)/(bz - az) + ax) c = !c; } return c; };
function edgesOf(pts){ const out = []; for (let i = 0; i < pts.length; i++){ const [ax, az] = pts[i], [bx, bz] = pts[(i+1) % pts.length], L = Math.hypot(bx - ax, bz - az) || 1, ux = (bx - ax)/L, uz = (bz - az)/L;
    let nx = uz, nz = -ux; if (inside(pts, (ax + bx)/2 + nx*0.3, (az + bz)/2 + nz*0.3)){ nx = -nx; nz = -nz; }
    out.push({ ax, az, bx, bz, L, ux, uz, nx, nz, a: Math.atan2(nx, nz), at: t => [ax + ux*t, az + uz*t] }); } return out; }
const shapeOf = (pts, holes=[]) => { const s = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z))); for (const h of holes) s.holes.push(new THREE.Path(h.map(([x, z]) => new THREE.Vector2(x, -z)))); return s; };
function splitCaps(geo){ const take = idx => { const gr = geo.groups.filter(g => g.materialIndex === idx), out = new THREE.BufferGeometry();
    for (const name of ['position', 'normal', 'uv']){ const a = geo.attributes[name], n = a.itemSize; let len = 0; for (const g of gr) len += g.count*n;
      const arr = new Float32Array(len); let o = 0; for (const g of gr){ arr.set(a.array.subarray(g.start*n, (g.start + g.count)*n), o); o += g.count*n; } out.setAttribute(name, new THREE.BufferAttribute(arr, n)); }
    return out; }; return [take(0), take(1)]; }
function prism(pts, y0, h, holes=[]){ const g = new THREE.ExtrudeGeometry(shapeOf(pts, holes), { depth:h, bevelEnabled:false, curveSegments:6 }); g.rotateX(-Math.PI/2); g.translate(0, y0, 0); return g; }
const slab = (pts, y0, h, mat, holes=[], cast=false) => add(prism(pts, y0, h, holes), mat, 0, 0, 0, cast);
const XF = new THREE.Object3D();
const placed = (geo, x, y, z, a) => { XF.position.set(x, y, z); XF.rotation.set(0, a, 0); XF.updateMatrix(); return geo.applyMatrix4(XF.matrix); };
function ribbon(pts, w, y0, h, mat){ const geos = [];
  for (let i = 1; i < pts.length; i++){ const [ax, az] = pts[i-1], [bx, bz] = pts[i], L = Math.hypot(bx - ax, bz - az); if (L < 0.01) continue;
    geos.push(placed(new THREE.BoxGeometry(w, h, L), (ax + bx)/2, y0 + h/2, (az + bz)/2, Math.atan2(bx - ax, bz - az)).toNonIndexed()); }
  for (let i = 1; i < pts.length - 1; i++) geos.push(placed(new THREE.CylinderGeometry(w/2, w/2, h, 14), pts[i][0], y0 + h/2, pts[i][1], 0).toNonIndexed());
  if (geos.length) add(mergeGeometries(geos, false), mat, 0, 0, 0, false); }
function dashes(pts, y, mat, gap=2.0, len=0.9){ const geos = []; let carry = 0;
  for (let i = 1; i < pts.length; i++){ const [ax, az] = pts[i-1], [bx, bz] = pts[i], L = Math.hypot(bx - ax, bz - az), a = Math.atan2(bx - ax, bz - az);
    for (let t = carry; t < L; t += gap){ geos.push(placed(new THREE.BoxGeometry(0.08, 0.02, len), ax + (bx - ax)*t/L, y, az + (bz - az)*t/L, a).toNonIndexed()); carry = t + gap - L; } }
  if (geos.length) add(mergeGeometries(geos, false), mat, 0, 0, 0, false); }
// where the map puts a building or a street: the front's trees, people and benches stay off them
const ROADLINES = SCN.roads.filter(r => r.hw !== 'footway');
const distSeg = (px, pz, [ax, az], [bx, bz]) => { const dx = bx - ax, dz = bz - az, L2 = dx*dx + dz*dz || 1, t = Math.max(0, Math.min(1, ((px - ax)*dx + (pz - az)*dz)/L2)); return Math.hypot(px - ax - t*dx, pz - az - t*dz); };
function blockedXZ(x, z, pad=0.6){ for (const b of SCN.blds){ if (inside(b.pts, x, z)) return true; }
  for (const b of SCN.blds) for (let i = 0; i < b.pts.length; i++) if (distSeg(x, z, b.pts[i], b.pts[(i+1) % b.pts.length]) < pad) return true;
  for (const r of ROADLINES) for (let i = 1; i < r.pts.length; i++) if (distSeg(x, z, r.pts[i-1], r.pts[i]) < r.w/2 + pad) return true;
  return x < BX0 + 0.8 || x > BX1 - 0.8 || z < BZ0 + 0.8 || z > BZ1 - 0.3; }

// ---- the ground behind and beside the front: paving round the hospital buildings, the streets, the lots ----
const PAVE_W = (() => { const t = PAVE_T.clone(); t.needsUpdate = true; t.repeat.set(1/1.3, 1/1.3); return new THREE.MeshStandardMaterial({ map:t, roughness:0.85, envMapIntensity:0.1 }); })();
const yellowLine = new THREE.MeshBasicMaterial({ color:0xf2c94c });
for (const [outer, ...holes] of SCN.aprons) slab(outer, 0.17, 0.08, PAVE_W, holes);
for (const r of SCN.roads){ if (r.hw === 'footway'){ ribbon(r.pts, r.w, 0.17, 0.09, PAVE_W); continue; }
  const big = r.hw !== 'service';
  if (big) ribbon(r.pts, r.w + 1.8, 0.17, 0.08, walk);
  ribbon(r.pts, r.w, 0.17, 0.088, asphalt);
  if (big) dashes(r.pts, 0.262, yellowLine); }
for (const lot of SCN.lots) slab(lot, 0.17, 0.085, asphalt);

// ---- the buildings ----
const STYLE = {
  e: { col:'#6e3a33', band:'#7a4239', roof:0xd9cdb8 },                        // George Link Jr. Pavilion: brown brick (as the hand-built one was)
  s: { col:'#7e3b37', band:'#e6d8c2', roof:0xf1f2f4, glassBase:2 },          // Jurist: brick, cream bands, glass on its two lower floors, a white roof
  c: { col:'#7a3530', band:'#e6d8c2' },                                      // Medical Plaza: maroon brick, cream bands; steps back, dark glass on top (tiers)
  t: { col:'#c9c2b6', band:'#efe8dc', glass:'#33456e', roof:0xe6e2da, kind:'glass' },   // Patient Pavilion: glass bands on pale stone
  n: { col:'#d0784c', band:'#f4efe6', roof:0xe9e4dc },                       // John Theurer Cancer Center: orange brick, white bands
  x8905: { col:'#9a5444', band:'#ece4d6', glass:'#3a4f7a', roof:0xe2dccf }, x8899: { col:'#c9b79c', band:'#dccfb9', glass:'#6d93ad', roof:0xd9d2c4, kind:'glass', baseBlock:1 },   // Imus: tan brick, ribbon windows, a pale block ground floor
  x8902: { col:'#b8553a', band:'#f1ece4', roof:0xd6d0c4 },
  x7562: { col:'#c3c8cf', band:'#aab0b9', glass:'#7f8b99', roof:0xdfe2e6 },   // across 2nd Street from Theurer: silver panels (Jose's photos)   // the ED: red brick, white bands x8907: { col:'#d8d0c2', band:'#b9b0a2', roof:0xd6d0c4 }, x8894: { col:'#8f4a3a', band:'#e6d8c2' },
  x8889: { col:'#9a5a46', band:'#e6d8c2' }, x8890: { col:'#e9d8b8', band:'#f6efe2' }, x8891: { col:'#b56a52', band:'#ead9c4' }, x8892: { col:'#c98a6a', band:'#f4ead8' } };
const HOUSE_COLS = ['#d9c8a8', '#c7d1d8', '#e6d6c0', '#b9c7b0', '#d8b8a8', '#e8e2d4', '#c9b8a0'];
const GARAGE = { col:'#cfcac0', band:'#dcd7ce', glass:'#3d404c' };
const BLD = {}, DOORW = {};
const CARB = CARC.map(c => new THREE.MeshStandardMaterial({ color:c, roughness:0.35, metalness:0.4 })), CARG = new THREE.MeshStandardMaterial({ color:0x1f2633, roughness:0.1, metalness:0.6, envMapIntensity:1.5 });
function parkedAt(x, z, rot, ci, y){   // a parked car baked into the board (lots, garage roofs)
  add(placed(new RoundedBoxGeometry(0.48, 0.18, 0.95, 1, 0.07), x, y + 0.11, z, rot), CARB[ci % CARB.length], 0, 0, 0, true);
  add(placed(new RoundedBoxGeometry(0.42, 0.15, 0.5, 1, 0.06), x, y + 0.27, z, rot), CARG, 0, 0, 0, false); }
function realBuilding(b){
  const dom = b.key[0] !== 'x', k = dom ? b.key : '_', o = STYLE[b.key] || (b.kind === 'house' ? { col:HOUSE_COLS[(+b.id) % HOUSE_COLS.length], band:'#f2ece0', roof:0x8f8a92 } : b.kind === 'garage' ? GARAGE : { col:'#9a5444', band:'#e6d8c2' });
  const fl = b.kind === 'garage' ? 0.5 : b.key === 't' ? htpFL() : FL, y0 = 0.3, h = b.floors*fl, E = edgesOf(b.pts);   // the pavilion's hospital floors run tall
  const bodyF = b.floors - (b.tiers || []).reduce((s2, T) => s2 + T.floors, 0), hb = bodyF*fl, gF = o.glassBase || o.baseBlock || 0;   // the body under any set-back tiers; a glass or block ground floor
  let hTop = h;
  if (dom){ let best = b.door ?? -1, sc = -1e9; if (best < 0) E.forEach((e, i) => { if (!b.win[i] || e.L < 5) return; const s2 = e.L*0.2 + e.nz*6; if (s2 > sc){ sc = s2; best = i; } }); DOORW[b.key] = { i:best, w:2.6 }; }
  CUR = k;
  if (b.key === 't') htpBody(b, y0, h); else {
  const t = brickTex(o.col, o.band, o.glass || null), wall = new THREE.MeshStandardMaterial({ map:t, bumpMap:t, bumpScale:0.6, roughness:0.85, envMapIntensity:0.12 });
  t.repeat.set(1/0.9, 1/fl); t.offset.set(0, -((1/fl) % 1));
  if (gF) wallsOf(b.pts, y0, gF*fl, o.glassBase ? GLASSWALL : M(0xe4dccd, { r:0.8 }));
  const [caps, sides] = splitCaps(new THREE.ExtrudeGeometry(shapeOf(b.pts), { depth:hb - gF*fl, bevelEnabled:false })); caps.dispose();
  sides.rotateX(-Math.PI/2); sides.translate(0, y0 + gF*fl, 0); add(sides, wall, 0, 0, 0, true);
  const roofM = M(o.roof ?? (b.kind === 'garage' ? 0x9a9aa2 : 0xd9cdb8)), parapet = (E2, y) => { const geos = []; for (const e of E2){ if (e.L < 0.3) continue; const [mx, mz] = e.at(e.L/2); geos.push(placed(new THREE.BoxGeometry(e.L + 0.1, 0.14, 0.1), mx, y, mz, e.a).toNonIndexed()); }
    if (geos.length) add(mergeGeometries(geos, false), b.kind === 'house' ? M(0xe8e2d8) : TRIM, 0, 0, 0, false); };
  slab(b.pts, y0 + hb, 0.22, roofM, [], true); parapet(E, y0 + hb + 0.29);
  const [lx, lz] = b.lab, area = Math.abs(b.pts.reduce((s2, p, i) => { const q = b.pts[(i+1) % b.pts.length]; return s2 + p[0]*q[1] - q[0]*p[1]; }, 0))/2;
  if (b.kind !== 'house' && !b.tiers){ const s2 = Math.min(2.4, Math.sqrt(area)*0.18);
    box(s2*1.4, 0.4, s2, M(0x8a8796), lx - s2*0.3, y0 + h + 0.42, lz, 0.06); box(s2*0.7, 0.3, s2*0.6, M(0x9a97a6), lx + s2*0.7, y0 + h + 0.37, lz + s2*0.5, 0.05); }
  // windows on the outside walls: plain panes with a sill and a lintel shadow (no frames back here, to keep the phone fast)
  const glass = o.kind === 'glass', sp = b.kind === 'house' ? 1.5 : glass ? 0.75 : 1.0;
  const W = { dark:[], sky:[], warm:[], litDark:[], litSky:[], litWarm:[], sill:[], reveal:[] };
  let wr2 = (+b.id)*7 + 3; const wr = () => (wr2 = (wr2*16807)%2147483647)/2147483647;
  const door = DOORW[b.key];
  const winsOn = (E2, edgeOk, base, f0, nf, door) => E2.forEach((e, i) => { if (!edgeOk(i) || e.L < 1.2) return; const cols = Math.max(1, Math.round(e.L/sp));
    for (let f = f0; f < nf; f++) for (let c = 0; c < cols; c++){
      const tt = (c + 0.5)*e.L/cols, y = base + f*fl + fl*0.45, gw = Math.min(e.L/cols*0.62, 0.62), gh = fl*(b.kind === 'house' ? 0.38 : 0.42);
      if (door && door.i === i && f < 2 && Math.abs(tt - e.L/2) < door.w/2 + 0.9) continue;
      const [px, pz] = e.at(tt);
      if (!glass && b.kind !== 'house'){ W.sill.push(placed(new THREE.BoxGeometry(gw + 0.12, 0.035, 0.06), px + e.nx*0.02, y - gh/2 - 0.03, pz + e.nz*0.02, e.a).toNonIndexed());
        W.reveal.push(placed(new THREE.BoxGeometry(gw + 0.02, 0.035, 0.04), px + e.nx*0.012, y + gh/2 - 0.01, pz + e.nz*0.012, e.a).toNonIndexed()); }
      const r = wr(), kind = glass ? 'dark' : r < 0.07 ? 'warm' : r < 0.4 ? 'sky' : 'dark', lit = wr() < 0.5;
      W[lit ? 'lit' + kind[0].toUpperCase() + kind.slice(1) : kind].push(placed(new THREE.BoxGeometry(gw, gh, 0.03), px + e.nx*0.004, y, pz + e.nz*0.004, e.a).toNonIndexed()); } });
  if (b.kind !== 'garage') winsOn(E, i => b.win[i], y0, gF, bodyF, door);
  // set-back tiers (Medical Plaza): brick with windows, then dark glass, each on the roof of the one below
  let yb = y0 + hb + 0.22;
  for (const T of b.tiers || []){ const th = T.floors*fl, ET = edgesOf(T.pts);
    wallsOf(T.pts, yb, th, T.glass ? new THREE.MeshStandardMaterial({ color:0x262d3c, roughness:0.06, metalness:0.75, envMapIntensity:1.6 }) : wall);
    slab(T.pts, yb + th, 0.22, roofM, [], true); parapet(ET, yb + th + 0.29);
    if (!T.glass) winsOn(ET, () => true, yb, 0, T.floors, null);
    yb += th + 0.22; }
  if (b.tiers){ hTop = yb - 0.22 - y0; const s2 = 1.6, T = b.tiers[b.tiers.length - 1].pts, cx = T.reduce((a, p) => a + p[0], 0)/T.length, cz = T.reduce((a, p) => a + p[1], 0)/T.length;
    box(s2*1.4, 0.4, s2, M(0x8a8796), cx, yb + 0.2, cz, 0.06); }
  // Medical Plaza's colonnade on the drive (his Street View): brick piers under a cream beam, along its wall facing the drive
  if (b.key === 'c'){ const e = E.filter(q => q.L > 5).sort((p, q) => p.nx - q.nx)[0], pm = M(0x7a3530, { r:0.85 });
    for (let t = 0.7; t < e.L - 0.3; t += 1.55){ const [px, pz] = e.at(t); box(0.3, 1.25, 0.3, pm, px + e.nx*0.3, 0.3 + 0.62, pz + e.nz*0.3, 0.03); }
    const [mx, mz] = e.at(e.L/2); box(e.L - 0.6, 0.18, 0.5, M(0xe6d8c2, { r:0.6 }), mx + e.nx*0.25, 0.3 + 1.3, mz + e.nz*0.25, 0.03).rotation.y = e.a; }
  const MAT = { dark:WIN_DARK, sky:WIN_SKY, warm:WIN_WARM, litDark:WIN_DARK, litSky:WIN_SKY, litWarm:WIN_WARM, sill:SILL, reveal:REVEAL };
  for (const n in W){ if (!W[n].length) continue; const m = add(mergeGeometries(W[n], false), MAT[n], 0, 0, 0, false); if (n.startsWith('lit')) m.userData.litc = true; }
  }
  CUR = '_';
  const [lx, lz] = b.lab;
  if (b.kind === 'garage') (SCN.cars.roofs[b.key] || []).forEach(([x, z, a], j) => parkedAt(x, z, a, j*5 + 3, y0 + h + 0.22));
  if (dom){ const xs = b.pts.map(p => p[0]), zs = b.pts.map(p => p[1]); LABEL_AT[k] = [lx, y0 + hTop + 0.9, lz];
    BOX[k] = { x:lx, z:lz, w:Math.max(...xs) - Math.min(...xs), d:Math.max(...zs) - Math.min(...zs), h:hTop + 0.8, y0, top:y0 + hTop + 0.8, roof:y0 + hTop + 0.22, crane:[lx, lz], pts:b.pts, halo:b.halo };
    if (k === 't'){ Object.assign(BOX.t, { capTower: htpTowerPts(), platTop: y0 + 4*fl + 0.2, x:3.6, z:-38.9, crane:[3.6, -38.9] }); LABEL_AT.t = [3.6, y0 + h + 0.9, -38.9]; } }   // the badge over the glass tower
  BLD[b.key] = { b, E, h, y0, fl }; }
SCN.lots.length && SCN.cars.lots.forEach(([x, z, a], j) => parkedAt(x, z, a, j*3 + 1, 0.26));
SCN.blds.find(b => b.key === 'x8902').floors = 5;   // the ED is five floors in the photos
Object.assign(SCN.blds.find(b => b.key === 'x7562'), { kind:'plant', floors:5 });   // a tall plant building with roof fans, not a house (Jose's photos, 2026-10-28)
for (const b of SCN.blds) realBuilding(b);
// an entrance on a real building's wall: canopy, columns, glass doors into a lobby, planters either side
const DOOR_AT = {};
function entranceOn(key){ const B = BLD[key], d = DOORW[key], e = B.E[d.i], dw = d.w, [cx, cz] = e.at(e.L/2), fr = M(0x27324d, { r:0.4, m:0.3 }), white = M(0xf4f0e9, { r:0.55 });
  const P = (o, s) => [cx + e.nx*o + e.ux*s, cz + e.nz*o + e.uz*s];
  CUR = key;
  let [x, z] = P(0.03, 0); add(new THREE.PlaneGeometry(dw, 1.4), new THREE.MeshBasicMaterial({ map:lobbyTex(), color:0xd8d0c4 }), x, 0.3 + 0.72, z, false).rotation.y = e.a;
  [x, z] = P(0.06, 0); add(new THREE.BoxGeometry(dw + 0.1, 1.45, 0.02), new THREE.MeshStandardMaterial({ color:0x9fc3d8, roughness:0.05, metalness:0.3, transparent:true, opacity:0.16, envMapIntensity:1.4 }), x, 0.3 + 0.74, z, false).rotation.y = e.a;
  for (let k = 0; k <= 3; k++){ [x, z] = P(0.08, -dw/2 + k*dw/3); add(new THREE.BoxGeometry(0.06, 1.5, 0.06), fr, x, 0.3 + 0.75, z).rotation.y = e.a; }
  [x, z] = P(0.08, 0); add(new THREE.BoxGeometry(dw + 0.2, 0.08, 0.07), fr, x, 0.3 + 1.49, z).rotation.y = e.a;
  CUR = '_';
  [x, z] = P(0.95, 0); box(dw + 1.6, 0.2, 1.9, white, x, 2.25, z, 0.08).rotation.y = e.a; box(dw + 1.7, 0.06, 2.0, M(0xe0d9ce, { r:0.6 }), x, 2.12, z, 0.03).rotation.y = e.a;
  for (const sx of [-1, 1]){ [x, z] = P(1.7, sx*(dw/2 + 0.55)); add(new THREE.CylinderGeometry(0.13, 0.13, 1.85, 18), white, x, 1.22, z); }
  for (let k = 0; k < 4; k++){ [x, z] = P(1.1, -dw/2 + 0.1 + k*(dw - 0.2)/3); add(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 12), new THREE.MeshBasicMaterial({ color:0xfff0c8 }), x, 2.085, z, false); }
  [x, z] = P(1.0, 0); glow(x, 1.7, z, 2.0, 0xffe0b0);
  [x, z] = P(1.4, 0); box(dw + 2.2, 0.05, 2.8, pave(dw + 2.2, 2.8), x, 0.26, z, 0.01, false).rotation.y = e.a;
  for (const sx of [-1, 1]){ const [px, pz] = P(0.45, sx*(dw/2 + 1.15)); add(new THREE.CylinderGeometry(0.28, 0.22, 0.4, 20), M(0xf2efe9, { r:0.5 }), px, 0.5, pz);
    shrub(px, 0.66, pz, 0.22, 1); const r = rngAt(px, pz); for (let q = 0; q < 9; q++){ const a = q/9*Math.PI*2; add(new THREE.IcosahedronGeometry(0.045, 0), FLOWERS[[0, 1, 2, 4][q % 4]], px + Math.cos(a)*0.22, 0.74 + r()*0.06, pz + Math.sin(a)*0.22, false); } }
  for (const sx of [-1, 1]){ const pts = [[0.35, 2.5], [0.35, 4.2], [0.9, 4.4], [1.35, 3.9], [1.3, 2.7], [0.85, 2.4]].map(([o, s]) => P(o, sx*s)); bed(pts, 0.27, { density:12 }); }
  DOOR_AT[key] = { e, P }; }
entranceOn('t'); entranceOn('n'); entranceOn('s'); entranceOn('c');   // Link Pavilion's is the diorama's canopy at the end of the drive
// Ethics: Link Pavilion's two big banners, on the face of its wing beside the ambulance bay (they hung on the hand-built one's front)
pend.push(() => { CUR = 'e'; const z = -11.8;
  for (const [x, col] of [[9.6, 0xf4f6fa], [11.35, 0x1f3f7a]]) add(new THREE.PlaneGeometry(1.5, 3.4), new THREE.MeshBasicMaterial({ color:col }), x, 2.6, z + 0.06, false);
  add(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map:TEX, transparent:true }), 9.6, 3.4, z + 0.07, false);
  add(new THREE.PlaneGeometry(1.2, 0.55), new THREE.MeshBasicMaterial({ color:0xf4f6fa }), 11.35, 3.4, z + 0.07, false); CUR = '_'; });
function onWall(key, i, s, y, w, h, mat, out=0.03){ const e = BLD[key].E[i], [cx, cz] = e.at(e.L/2); const m = add(new THREE.PlaneGeometry(w, h), mat, cx + e.ux*s + e.nx*out, y, cz + e.uz*s + e.nz*out, false); m.rotation.y = e.a; return m; }
// (the hospital's name is on the Helena Theurer Pavilion's glass tower, built below with the corner of Atlantic and 2nd)
// Encounter: the name on John Theurer Cancer Center's face, over its doors
pend.push(() => { CUR = 'n'; const d = DOORW.n, e = BLD.n.E[d.i], wlen = Math.min(e.L - 0.6, 7.5);
  const c = document.createElement('canvas'); c.width = 1024; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#f6efe2'; g.font = 'bold 40px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('JOHN THEURER CANCER CENTER', 512, 34);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  onWall('n', d.i, 0, 0.3 + 3.5*FL, wlen, wlen*0.0625, new THREE.MeshBasicMaterial({ map:t, transparent:true }), 0.05); CUR = '_'; });
// a lighter tree for the back lawns and streets (a trunk and a clustered crown), so the bigger board stays fast
const BACK_LEAF = [M(0x3f7a3a, { r:0.85 }), M(0x4f8c44, { r:0.85 }), M(0x5f9e4c, { r:0.85 }), M(0x86bf5f, { r:0.85 })], BACK_RED = [M(0xb8452e, { r:0.85 }), M(0xd0633a, { r:0.85 }), M(0xe08a4a, { r:0.85 })];
function backTree(x, z, s, kind){ if (kind === 'cone' || kind === 'blossom') return tree(x, z, s*0.8, kind);
  const r = rngAt(x, z), mats = kind === 'red' ? BACK_RED : BACK_LEAF, h = 1.1*s;
  limb(x, 0.28, z, x + (r() - 0.5)*0.2, 0.3 + h, z + (r() - 0.5)*0.2, 0.13*s, 0.08*s, BARK);
  for (let k = 0; k < 6; k++){ const a = r()*Math.PI*2, d = (k ? 0.45 + r()*0.25 : 0)*s; add(new THREE.IcosahedronGeometry((k ? 0.42 + r()*0.18 : 0.7)*s, 1), mats[(k + Math.floor(r()*2)) % mats.length], x + Math.cos(a)*d, 0.3 + h + 0.35*s + (k ? r()*0.35*s : 0), z + Math.sin(a)*d); } }
for (const [x, z, s, k] of SCN.trees) if (!(x > -4 && x < 5 && z > -54.5 && z < -45.5) && !(x > 8.4 && x < 12.8 && z > -46.6 && z < -40.9) && Math.hypot(x - 14.2, z + 44.8) > 3.4) backTree(x, z, s*0.75, k);   // none under the pavilion's bridge
// ==================== the corner of Atlantic and 2nd Street (Jose's photos, 2026-10-27) ====================
// Seen from his window at John Theurer: Don Imus - WFAN Pediatric Center on the corner, tan brick with ribbon windows
// and its name across the curved corner; the red-brick ED with white bands beside it; behind them the Helena Theurer
// Pavilion (opened 2022, nine stories): a terracotta platform that bridges Atlantic Street into the Atlantic Street
// garage, "Helena Theurer Pavilion" on its grey fascia over the road, a curved glass tower on top with the hospital's
// name, and a slimmer glass tower with the HMH mark. At the corner: crosswalks all round, pink corner paving, a stop
// sign, the flagpole over a round bed of red and yellow mums, the Emergency sign, an ambulance at the curb.
// (The map file predates the pavilion, so it is placed from the photos: approximate.)
const ATL2 = { x:-21.4, z:-50.0 };                     // the intersection
// ---- textures: a glass curtain wall (mullions, sky in the glass, a few lit panels) and terracotta with slit windows ----
function curtainTex(){ const c = document.createElement('canvas'); c.width = 128; c.height = 128; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 128, 128); gr.addColorStop(0, '#9cc3e6'); gr.addColorStop(0.5, '#5d8ec4'); gr.addColorStop(1, '#3f6aa0'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(10, 128); g.lineTo(60, 0); g.lineTo(78, 0); g.lineTo(28, 128); g.fill();   // a streak of sky
  g.fillStyle = 'rgba(255,214,150,.45)'; g.fillRect(36, 70, 26, 50);                                                                    // a lit room
  g.fillStyle = '#d9dee6'; for (let x = 0; x < 128; x += 32) g.fillRect(x, 0, 3, 128); g.fillRect(0, 0, 128, 5); g.fillRect(0, 62, 128, 2);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; }
function terraTex(){ const c = document.createElement('canvas'); c.width = 256; c.height = 192; const g = c.getContext('2d');
  g.fillStyle = '#9a4b33'; g.fillRect(0, 0, 256, 192); g.fillStyle = 'rgba(0,0,0,.08)'; for (let x = 0; x < 256; x += 8) g.fillRect(x, 0, 1, 192);
  g.fillStyle = '#e9edf2'; let r = 5; const rr = () => (r = (r*16807)%2147483647)/2147483647;
  for (const [y0, y1] of [[10, 86], [104, 182]]) for (let x = 6 + (y0 > 50 ? 11 : 0); x < 250; x += 22){ const a = y0 + rr()*14, b = y1 - rr()*14; g.fillRect(x, a, 5 + Math.round(rr()*4), b - a); }   // two staggered rows, as on the bridge (Street View)
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; }
function wallsOf(pts, y0, h, mat){ const [caps, sides] = splitCaps(new THREE.ExtrudeGeometry(shapeOf(pts), { depth:h, bevelEnabled:false, curveSegments:12 })); caps.dispose(); sides.rotateX(-Math.PI/2); sides.translate(0, y0, 0); return add(sides, mat, 0, 0, 0, true); }
function rectPts(x0, z0, x1, z1){ return [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]; }
// lettering laid along a run of wall (a polyline), sliced so it follows a curve; faces away from `from`
function letterAlong(run, y, h, canvas, from, out=0.06){ const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  run = run.filter((p, i) => i === 0 || Math.hypot(p[0] - run[i-1][0], p[1] - run[i-1][1]) > 0.01);
  { // read left to right from outside: the run must go the way a viewer facing the wall reads
    const [ax, az] = run[0], [bx, bz] = run[run.length - 1], mx = (ax + bx)/2, mz = (az + bz)/2; let nx = bz - az, nz = -(bx - ax);
    if ((from[0] - mx)*nx + (from[1] - mz)*nz > 0){ nx = -nx; nz = -nz; }
    if ((bx - ax)*nz - (bz - az)*nx < 0) run = run.slice().reverse(); }
  const L = []; let tot = 0; for (let i = 1; i < run.length; i++){ const l = Math.hypot(run[i][0] - run[i-1][0], run[i][1] - run[i-1][1]); L.push(l); tot += l; }
  let acc = 0; for (let i = 1; i < run.length; i++){ const [ax, az] = run[i-1], [bx, bz] = run[i], l = L[i-1], tt = t.clone(); tt.needsUpdate = true; tt.repeat.set(l/tot, 1); tt.offset.set(acc/tot, 0); acc += l;
    let nx = (bz - az)/l, nz = -(bx - ax)/l; const mx = (ax + bx)/2, mz = (az + bz)/2; if ((from[0] - mx)*nx + (from[1] - mz)*nz > 0){ nx = -nx; nz = -nz; }
    const m = add(new THREE.PlaneGeometry(l + 0.02, h), new THREE.MeshBasicMaterial({ map:tt, transparent:true, depthWrite:false }), mx + nx*out, y, mz + nz*out, false); m.rotation.y = Math.atan2(nx, nz); } }
function textCanvas(lines, { w=1024, lh=64, font='bold 44px Georgia, serif', col='#ffffff', spacing='0px' }={}){ const c = document.createElement('canvas'); c.width = w; c.height = lh*lines.length; const g = c.getContext('2d');
  g.fillStyle = col; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; try { g.letterSpacing = spacing; } catch(e){}
  lines.forEach((s, i) => g.fillText(s, w/2, lh*(i + 0.5))); return c; }

// ---- Helena Theurer Pavilion: the map's "Patient Pavilion" (Terminology). Its photos: a terracotta platform with
// slit windows over the whole footprint; the curved glass tower right at 2nd Street, its west face bowed toward the
// corner with Imus and the hospital's name along its top, its south end cantilevered over the parking beside the
// bridge; the bridge over 2nd Street ("Helena Theurer Pavilion" on its grey fascia) into the Employee Parking Garage,
// where a slimmer glass tower with the HMH mark rises (photos from 2nd St and Jose's window, Google 3D; 2026-10-28:
// the tower moved up to the street and made taller, it stood 45 m back and barely showed over the bridge).
function htpTowerPts(){ const pts = [[-1.5, -46.3], [9.0, -46.3], [9.0, -31.5], [-1.5, -31.5]];
  for (let k = 1; k < 16; k++){ const u = k/16; pts.push([-1.5 - Math.sin(u*Math.PI)*2.5, -31.5 - 14.8*u]); } return pts; }
var TERRA_M = null, CURTAIN_M = null;
function htpFL(){ return FL*1.65; }   // var: the buildings are built before this line runs; tall hospital floors. With 4 of terracotta
// platform and 9 of glass (scene.json floors 13) the glass rises over the bridge as in his window photo, measured against Imus
function htpMats(){ if (TERRA_M) return; const t = terraTex(); t.repeat.set(1/3.2, 1/(3*htpFL())); TERRA_M = new THREE.MeshStandardMaterial({ map:t, roughness:0.75, envMapIntensity:0.15 });
  const c = curtainTex(); c.repeat.set(1/1.4, 1/htpFL()); c.offset.set(0, -((1/htpFL()) % 1)); CURTAIN_M = new THREE.MeshStandardMaterial({ map:c, roughness:0.12, metalness:0.35, envMapIntensity:1.1 }); }
function htpBody(b, y0, h){ htpMats(); const FL = htpFL(); const HTP_SLIM = rectPts(9.0, -46.0, 12.2, -41.5), HTP_BRIDGE = rectPts(-3.0, -53.5, 4.0, -46.3), P4 = 4*FL, ty = y0 + P4 + 0.2, th = h - P4 - 0.2, FAS = M(0xd3d6db, { r:0.5 });
  wallsOf(b.pts, y0, P4, TERRA_M); slab(b.pts, y0 + P4, 0.2, M(0xd8d2c8), [], true);
  const T = htpTowerPts(); wallsOf(T, ty, th, CURTAIN_M); slab(T, ty + th, 0.25, M(0xc9ccd2), [], true);
  slab(T, ty - 0.08, 0.08, M(0x2f3442, { r:0.8 }));   // its dark underside where it reaches out past the platform
  for (const x of [1.5, 4.6, 7.7]) add(new THREE.CylinderGeometry(0.16, 0.16, ty - 0.3, 12), M(0xd3d6db, { r:0.5 }), x, 0.3 + (ty - 0.3)/2, -45.8);
  for (const [x, z] of [[2.6, -36.0], [5.6, -41.0]]) box(1.6, 0.5, 1.2, M(0x9a97a6), x, ty + th + 0.5, z, 0.05);
  // the slim tower: on Imus's side of the street, against the curved tower's far side (Jose, 2026-10-28), on terracotta
  wallsOf(HTP_SLIM, y0, ty - y0, TERRA_M); slab(HTP_SLIM, ty - 0.2, 0.2, M(0xd8d2c8), [], true);
  wallsOf(HTP_SLIM, ty, th - 0.9, CURTAIN_M); slab(HTP_SLIM, ty + th - 0.9, 0.22, M(0xc9ccd2), [], true);
  // the bridge over 2nd Street: grey fascia, terracotta above, its underside lit, columns on the sidewalks
  const by = 0.3 + 1.7*FL; slab(HTP_BRIDGE, by - 0.02, 0.06, M(0x2f3442, { r:0.8 }), [], true);
  wallsOf(HTP_BRIDGE, by, 0.42, FAS); wallsOf(HTP_BRIDGE, by + 0.42, y0 + P4 - by - 0.42, TERRA_M); slab(HTP_BRIDGE, y0 + P4, 0.2, M(0xd8d2c8), [], true);
  for (const [x, z] of [[-2.6, -47.7], [0.5, -47.7], [3.6, -47.7], [-2.6, -52.3], [3.6, -52.3]]) add(new THREE.CylinderGeometry(0.16, 0.16, by - 0.3, 12), FAS, x, 0.3 + (by - 0.3)/2, z);
  CUR = '_'; for (let k = 0; k < 5; k++) glow(0.5, by - 0.12, -52.6 + k*1.4, 0.7, 0xffe2b0); CUR = 't'; }
pend.push(() => { CUR = 't'; const FL = htpFL(), T = htpTowerPts(), ty = 0.3 + 4*FL + 0.2, th = 13*FL - 4*FL - 0.2;
  letterAlong([T[3], ...T.slice(4), T[0]], ty + th - FL*0.45, 0.62, textCanvas(['HACKENSACK UNIVERSITY MEDICAL CENTER'], { w:2048, lh:96, font:'600 64px Georgia, serif', spacing:'4px' }), [-20, -38], 0.06);
  letterAlong([[-3.0, -53.3], [-3.0, -46.5]], 0.3 + 1.7*FL + 0.21, 0.3, textCanvas(['Helena Theurer Pavilion'], { w:1024, lh:64, font:'italic 44px Georgia, serif', col:'#55606e' }), [0.5, -50], 0.04);
  add(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map:TEX, transparent:true }), 10.6, ty + th - 0.9 - 1.0, -46.04, false).rotation.y = Math.PI;   // the HMH mark, on the slim tower's face toward 2nd Street
  CUR = '_'; });

// ---- Don Imus - WFAN Pediatric Center: tan brick, its name in three lines across the curved corner ----
pend.push(() => { const B = BLD.x8899.b, run = B.pts.slice(2, 9);   // the curve that faces the corner
  const c = textCanvas(['DON IMUS - WFAN', 'PEDIATRIC CENTER', 'FOR TOMORROWS CHILDREN'], { w:1024, lh:84, font:'600 46px "Trebuchet MS", sans-serif', col:'#4a3f36', spacing:'6px' });
  letterAlong(run, 0.3 + 3.9*FL, 1.35, c, [-14, -38], 0.05); });

// ---- across 2nd Street from Theurer (his window photo, Google 3D): a row of big round fans on the silver building's roof ----
{ const y = 0.3 + 5*FL + 0.22, hous = M(0xb9bec6, { r:0.5, m:0.3 }), dark = M(0x2a2f3a, { r:0.7 }), hub = M(0x8d939e, { r:0.4, m:0.5 });
  for (let z = -56.2; z > -69; z -= 2.05){ add(new THREE.CylinderGeometry(0.86, 0.9, 0.42, 24), hous, -15.85, y + 0.21, z);
    add(new THREE.CylinderGeometry(0.72, 0.72, 0.02, 24), dark, -15.85, y + 0.43, z, false); add(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 12), hub, -15.85, y + 0.45, z, false); } }
// ---- the Atlantic Street garage's corner on the intersection: a beige stair tower with a dark slit of glass up it (Google 3D) ----
{ const st = box(1.4, 4.1, 1.4, M(0xd9c7a2, { r:0.8 }), -25.1, 0.3 + 2.05, -45.2, 0.04), slit = M(0x2a3142, { r:0.3, m:0.4 });
  add(new THREE.PlaneGeometry(0.26, 3.3), slit, -24.385, 2.25, -45.2, false).rotation.y = Math.PI/2; add(new THREE.PlaneGeometry(0.26, 3.3), slit, -25.1, 2.25, -45.915, false).rotation.y = Math.PI; }
// ---- a glass skybridge over Atlantic Street, from the garage to the ED, north of Imus (Google 3D; where exactly it lands is a guess) ----
{ const glassB = new THREE.MeshStandardMaterial({ color:0x3d5578, roughness:0.08, metalness:0.6, envMapIntensity:1.4 }), frameB = M(0xd3d6db, { r:0.5 });
  box(8.7, 0.8, 1.1, glassB, -21.95, 2.3, -29.5, 0.03); box(8.8, 0.14, 1.2, frameB, -21.95, 2.77, -29.5, 0.02); box(8.8, 0.14, 1.2, frameB, -21.95, 1.83, -29.5, 0.02); }
// ---- the intersection: crosswalks on all four sides, pink paving at the corners, a stop sign ----
{ // a crosswalk: bars lying along the road, side by side across it
  const across = (cx, cz, roadAlongX, n=7) => { for (let i = 0; i < n; i++){ const o = (i - (n - 1)/2)*0.37;
      if (roadAlongX) box(1.3, 0.02, 0.2, paint, cx, 0.27, cz + o, 0.01, false); else box(0.2, 0.02, 1.3, paint, cx + o, 0.27, cz, 0.01, false); } };
  across(ATL2.x + 0.35, ATL2.z + 2.75, false); across(ATL2.x, ATL2.z - 2.75, false);   // across Atlantic, both legs
  across(ATL2.x - 2.75, ATL2.z, true); across(ATL2.x + 2.75, ATL2.z, true);            // across 2nd Street, both legs
  const PINK = M(0xe6a49a, { r:0.8 });
  for (const [dx, dz] of [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]]) add(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 16), PINK, ATL2.x + dx*0.92, 0.265, ATL2.z + dz*0.92, false);
  // the stop sign on the ED side
  add(new THREE.CylinderGeometry(0.035, 0.035, 1.4, 8), M(0x9aa0aa, { r:0.4, m:0.5 }), ATL2.x + 2.0, 0.97, ATL2.z + 2.6);
  const st = add(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 8), M(0xc8202a, { r:0.6 }), ATL2.x + 2.0, 1.62, ATL2.z + 2.62, false); st.rotation.x = Math.PI/2; st.rotation.y = Math.PI/8;
  // utility poles with a sag of wire along 2nd Street
  for (const x of [-26.5, -16.5, -8.5]){ add(new THREE.CylinderGeometry(0.06, 0.08, 3.2, 8), M(0x6b5544, { r:0.9 }), x, 1.85, ATL2.z + 1.6); add(new THREE.BoxGeometry(0.9, 0.06, 0.06), M(0x6b5544, { r:0.9 }), x, 3.3, ATL2.z + 1.6); }
  for (const [a, b] of [[-26.5, -16.5], [-16.5, -8.5]]) for (const dy of [0, -0.25]){ const L = b - a; add(new THREE.CylinderGeometry(0.012, 0.012, L, 4), M(0x1d1d24), (a + b)/2, 3.25 + dy - 0.15, ATL2.z + 1.6, false).rotation.z = Math.PI/2; } }

// ---- Theurer's corner, under Jose's window: the flagpole over a round bed of red and yellow mums ----
{ const fx = -24.3, fz = -53.3;
  add(new THREE.CylinderGeometry(0.95, 0.95, 0.08, 32), M(0xe8e2d6, { r:0.7 }), fx, 0.28, fz, false);
  const mum = (r0, r1, col, n) => { const m = M(col, { r:0.8 }); let s = 3; const rr = () => (s = (s*16807)%2147483647)/2147483647;
    for (let i = 0; i < n; i++){ const a = rr()*Math.PI*2, d = r0 + rr()*(r1 - r0); add(new THREE.IcosahedronGeometry(0.11, 0), m, fx + Math.cos(a)*d, 0.38 + rr()*0.04, fz + Math.sin(a)*d, false); } };
  mum(0, 0.45, 0x9c1c2a, 30); mum(0.45, 0.88, 0xf2c522, 48);
  add(new THREE.CylinderGeometry(0.035, 0.045, 4.6, 8), M(0xd8dbe3, {r:0.4, m:0.6}), fx, 2.6, fz);
  add(new THREE.SphereGeometry(0.07, 8, 6), M(0xd9b44a, { r:0.3, m:0.7 }), fx, 4.93, fz);
  const usa = (() => { const c = document.createElement('canvas'); c.width = 190; c.height = 100; const g = c.getContext('2d');
    for (let i = 0; i < 13; i++){ g.fillStyle = i % 2 ? '#ffffff' : '#b22234'; g.fillRect(0, i*100/13, 190, 100/13 + 0.5); }
    g.fillStyle = '#3c3b6e'; g.fillRect(0, 0, 76, 54); g.fillStyle = '#ffffff'; for (let y = 0; y < 5; y++) for (let x = 0; x < 6; x++) g.fillRect(6 + x*12, 5 + y*10, 3, 3);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  for (const [y, mat] of [[4.6, new THREE.MeshStandardMaterial({ map:usa, side:THREE.DoubleSide, roughness:0.8 })], [3.85, new THREE.MeshStandardMaterial({ color:0xf4f6fa, side:THREE.DoubleSide, roughness:0.8 })]]){
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55, 12, 4), mat); fl.position.set(fx + 0.47, y, fz); fl.castShadow = true; G.add(fl); FLAGS.push(fl); }
}
pend.push(() => { const pa = vehicle('amb', 0xf4f6fa); pa.visible = true; pa.position.set(-28.6, 0.2, -51.3); pa.rotation.y = Math.PI/2; });   // an ambulance at the curb
// the Emergency sign on the lawn by the garage, facing the corner
{ const sx = -25.6, sz = -47.6, g = new THREE.Group(); g.position.set(sx, 0.27, sz); g.rotation.y = -0.5; G.add(g);
  for (const dx of [-0.35, 0.35]){ const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.06), M(0x8d929c)); p.position.set(dx, 0.45, 0); p.castShadow = true; g.add(p); }
  const c = document.createElement('canvas'); c.width = 256; c.height = 192; const x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, 256, 192); x.fillStyle = '#c8202a'; x.fillRect(0, 0, 256, 54);
  x.fillStyle = '#ffffff'; x.font = 'bold 34px Arial, sans-serif'; x.textAlign = 'center'; x.fillText('EMERGENCY', 128, 40); x.fillStyle = '#333a46'; x.font = '20px Arial, sans-serif';
  ['Emergency Department', 'Pediatric Emergency', 'Ambulance Entrance'].forEach((s, i) => x.fillText(s, 128, 92 + i*34));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.72, 0.05), M(0xdddddd)); back.position.y = 1.0; back.castShadow = true; g.add(back);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.93, 0.7), new THREE.MeshBasicMaterial({ map:t })); face.position.set(0, 1.0, 0.03); g.add(face); }

