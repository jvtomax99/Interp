// ==================== the back of the campus, from the real map (Jose, 2026-10-27) ====================
// The ground at the front is the hand-built diorama (Prospect, the drive, the fountain, the drop-off). Every building,
// the front's three included (Jose, 2026-10-28), and every street, lot and garage beyond it is placed from his
// OpenStreetMap export, at the front's own scale
// (1 unit is about 4.3 m), fitted to it by the drive's mouth, Jurist and Medical Plaza. Floors are read off his
// Google 3D flyover, so they are estimates. Map data © OpenStreetMap contributors (ODbL).
const SCN = __SCENE__;
const ROOFS = __ROOFS__;   // roof colours and machines from the state's 2020 aerial (aerial_roofs.py)
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
// a stub of the map's service road left on the lawn between the drive and Medical Plaza, beside Link's front, showed as a
// loose dark plate (Jose, 2026-10-28: "get rid of the circled plate"); the hand-built drive covers that road
const STRAY = r => r.hw === 'service' && r.pts.every(([x, z]) => x > 3.2 && x < 6.5 && z > -7 && z < -3);
for (const r of SCN.roads){ if (STRAY(r)) continue; if (r.hw === 'footway'){ ribbon(r.pts, r.w, 0.17, 0.09, PAVE_W); continue; }
  const big = r.hw !== 'service';
  if (big) ribbon(r.pts, r.w + 1.8, 0.17, 0.08, walk);
  ribbon(r.pts, r.w, 0.17, 0.088, asphalt);
  if (big) dashes(r.pts, 0.262, yellowLine); }
for (const lot of SCN.lots) slab(lot, 0.17, 0.085, asphalt);

// ---- the buildings ----
// Women's and Children's wall, one floor a tile (bottom up): a precast sill band, a teal ribbon window, a thin precast
// band, then a brick spandrel up to the next floor's sill (his Street View on the drive from Atlantic, 2026-10-28)
function wncTex(){ const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#8c4a3a'; g.fillRect(0, 0, 64, 64); g.fillStyle = 'rgba(0,0,0,.07)'; for (let y = 0; y < 64; y += 4) g.fillRect(0, y, 64, 1);
  g.fillStyle = '#d9c8ad'; g.fillRect(0, 14, 64, 9); g.fillRect(0, 47, 64, 13);
  g.fillStyle = '#6e9fa2'; g.fillRect(0, 23, 64, 24); g.fillStyle = '#c9d4d2'; for (let x = 0; x < 64; x += 16) g.fillRect(x, 23, 2, 24);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; }
const STYLE = {
  e: { col:'#6e3a33', band:'#7a4239', roof:0xd9cdb8 },                        // George Link Jr. Pavilion: brown brick (as the hand-built one was)
  s: { col:'#7e3b37', band:'#e6d8c2', roof:0xf1f2f4, glassBase:2 },          // Jurist: brick, cream bands, glass on its two lower floors, a white roof
  c: { col:'#563733', band:'#c9bfb2', roof:0xd6d0c6, kind:'glass' },                     // Medical Plaza: maroon granite, light granite bands (his photos from the court, 2026-10-28)
  x8886: { col:'#8e857c', band:'#9c938a', glass:'#2b2e35' },                 // the Visitor Parking garage: brown-grey concrete, dark open decks
  t: { col:'#c9c2b6', band:'#efe8dc', glass:'#33456e', roof:0xe6e2da, kind:'glass' },   // Patient Pavilion: glass bands on pale stone
  n: { col:'#d0784c', band:'#f4efe6', roof:0xe9e4dc },                       // John Theurer Cancer Center: orange brick, white bands
  x8905: { tex:wncTex, roof:0xe6e2da, noWin:1 },   // Women's and Children's Pavilion: light precast, brick spandrels, teal ribbon windows, a glass grid (his aerials and Street View, 2026-10-28)
  x8899: { col:'#c9b79c', band:'#dccfb9', glass:'#6d93ad', roof:0xd9d2c4, kind:'glass', baseBlock:1 },   // Imus: tan brick, ribbon windows, a pale block ground floor
  x8902: { col:'#d3d6db', band:'#c3c7cd', glass:'#93aebb', roof:0xd6d0c4, noWin:1 },   // the curved building on the court (map: the ED): silver panels, ribbon windows (Jose's photos, 2026-10-28)
  x8914: { col:'#8a4a3a', band:'#cdbfa6', glass:'#2b2e36' },                // the Atlantic Street garage: brick spandrels, precast bands, open decks (his photos)
  x7562: { col:'#c3c8cf', band:'#aab0b9', glass:'#7f8b99', roof:0xdfe2e6 },   // across 2nd Street from Theurer: silver panels (Jose's photos)
  x8907: { col:'#8a3d2e', band:'#93463a', roof:0xd6d0c4 },                  // Creamer Imaging: plain red brick (his Street View, 2026-10-28)
  x8894: { col:'#8f4a3a', band:'#e6d8c2' },
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
  const t = o.tex ? o.tex() : brickTex(o.col, o.band, o.glass || null), wall = new THREE.MeshStandardMaterial({ map:t, bumpMap:t, bumpScale:0.6, roughness:0.85, envMapIntensity:0.12 });
  t.repeat.set(1/0.9, 1/fl); t.offset.set(0, -((1/fl) % 1));
  if (gF) wallsOf(b.pts, y0, gF*fl, o.glassBase ? GLASSWALL : M(0xe4dccd, { r:0.8 }));
  const U = b.under, uh = U ? U.floors*fl : 0;   // a drive under the building: its own ground-floor outline, a soffit over the drive
  if (U){ wallsOf(U.ground, y0, uh, wall); slab(U.open, y0 + uh - 0.12, 0.12, M(0xc9c2b4, { r:0.9, x:{ emissive:0x6a645a } })); }   // the soffit: grey concrete, lit by its downlights
  const [caps, sides] = splitCaps(new THREE.ExtrudeGeometry(shapeOf(b.pts), { depth:hb - Math.max(gF*fl, uh), bevelEnabled:false })); caps.dispose();
  sides.rotateX(-Math.PI/2); sides.translate(0, y0 + Math.max(gF*fl, uh), 0); add(sides, wall, 0, 0, 0, true);
  const RF = ROOFS[b.id], roofM = M(RF ? new THREE.Color(RF.roof).getHex() : o.roof ?? (b.kind === 'garage' ? 0x9a9aa2 : 0xd9cdb8)), parapet = (E2, y) => { const geos = []; for (const e of E2){ if (e.L < 0.3) continue; const [mx, mz] = e.at(e.L/2); geos.push(placed(new THREE.BoxGeometry(e.L + 0.1, 0.14, 0.1), mx, y, mz, e.a).toNonIndexed()); }
    if (geos.length) add(mergeGeometries(geos, false), b.kind === 'house' ? M(0xe8e2d8) : TRIM, 0, 0, 0, false); };
  slab(b.pts, y0 + hb, 0.22, roofM, [], true); parapet(E, y0 + hb + 0.29);
  const [lx, lz] = b.lab, area = Math.abs(b.pts.reduce((s2, p, i) => { const q = b.pts[(i+1) % b.pts.length]; return s2 + p[0]*q[1] - q[0]*p[1]; }, 0))/2;
  if (b.kind !== 'house' && !b.tiers && !RF){ const s2 = Math.min(2.4, Math.sqrt(area)*0.18);
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
  if (b.kind !== 'garage' && !o.noWin) winsOn(E, i => b.win[i], y0, Math.max(gF, U ? Math.ceil(U.floors) : 0), bodyF, door);
  // set-back tiers (Medical Plaza): brick with windows, then dark glass, each on the roof of the one below
  let yb = y0 + hb + 0.22;
  for (const T of b.tiers || []){ const th = T.floors*fl, ET = edgesOf(T.pts);
    wallsOf(T.pts, yb, th, T.glass ? new THREE.MeshStandardMaterial({ color:0x262d3c, roughness:0.06, metalness:0.75, envMapIntensity:1.6 }) : T.plain ? M(0xd5d8dc, { r:0.6 }) : wall);
    slab(T.pts, yb + th, 0.22, roofM, [], true); parapet(ET, yb + th + 0.29);
    if (!T.glass && !T.plain) winsOn(ET, () => true, yb, 0, T.floors, null);
    yb += th + 0.22; }
  if (b.tiers){ hTop = yb - 0.22 - y0; const s2 = 1.6, T = b.tiers[b.tiers.length - 1].pts, cx = T.reduce((a, p) => a + p[0], 0)/T.length, cz = T.reduce((a, p) => a + p[1], 0)/T.length;
    box(s2*1.4, 0.4, s2, M(0x8a8796), cx, yb + 0.2, cz, 0.06); }
  // Medical Plaza's colonnade on the drive (his Street View): brick piers under a cream beam, along its wall facing the drive
  // Medical Plaza stands on square maroon piers with light granite caps, all round its open ground floor (his photos)
  if (b.key === 'c' && b.under){ const pm = M(0x563733, { r:0.8 }), cap = M(0xc9bfb2, { r:0.7 }), ph = b.under.floors*fl;
    for (const e of E){ if (e.L < 1.2) continue; const n = Math.max(1, Math.round(e.L/2.4));
      for (let i = 0; i <= n; i++){ if (i === n && e.L > 1.2) continue; const [px, pz] = e.at(i*e.L/n), ix = px - e.nx*0.28 + e.ux*(i ? 0 : 0.28), iz = pz - e.nz*0.28 + e.uz*(i ? 0 : 0.28);
        box(0.5, ph, 0.5, pm, ix, y0 + ph/2, iz, 0.02).rotation.y = e.a; box(0.56, 0.16, 0.56, cap, ix, y0 + ph - 0.1, iz, 0.02).rotation.y = e.a; } } }
  const MAT = { dark:WIN_DARK, sky:WIN_SKY, warm:WIN_WARM, litDark:WIN_DARK, litSky:WIN_SKY, litWarm:WIN_WARM, sill:SILL, reveal:REVEAL };
  for (const n in W){ if (!W[n].length) continue; const m = add(mergeGeometries(W[n], false), MAT[n], 0, 0, 0, false); if (n.startsWith('lit')) m.userData.litc = true; }
  }
  CUR = '_';
  const [lx, lz] = b.lab;
  if (b.kind === 'garage') (SCN.cars.roofs[b.key] || []).forEach(([x, z, a], j) => parkedAt(x, z, a, j*5 + 3, y0 + h + 0.22));
  if (dom){ const xs = b.pts.map(p => p[0]), zs = b.pts.map(p => p[1]); LABEL_AT[k] = [lx, y0 + hTop + 0.9, lz];
    BOX[k] = { x:lx, z:lz, w:Math.max(...xs) - Math.min(...xs), d:Math.max(...zs) - Math.min(...zs), h:hTop + 0.8, y0, top:y0 + hTop + 0.8, roof:y0 + hTop + 0.22, crane:[lx, lz], pts:b.pts, halo:b.halo };
    if (k === 't'){ Object.assign(BOX.t, { capTower: htpTowerPts(), platTop: y0 + 4*fl + 0.2, x:5.0, z:-38.0, crane:[5.0, -38.0] }); LABEL_AT.t = [5.0, y0 + h + 0.9, -38.0]; } }   // the badge over the glass tower
  BLD[b.key] = { b, E, h, y0, fl }; }
SCN.lots.length && SCN.cars.lots.forEach(([x, z, a], j) => parkedAt(x, z, a, j*3 + 1, 0.26));
Object.assign(SCN.blds.find(b => b.key === 'x8902'), { floors:5, under: { floors:1.4,
  ground:[[-16.3,-24.48],[-16.3,-31.4],[-16.05,-31.74],[-9.97,-31.66],[-9.95,-24.51]],
  open:[[-16.96,-24.48],[-16.99,-25.04],[-17.62,-26.6],[-17.71,-27.45],[-17.57,-29.54],[-17.32,-30.42],[-16.88,-31.33],[-16.3,-31.4],[-16.3,-24.48]] } });   // over the court on a column (his photos)
Object.assign(SCN.blds.find(b => b.key === 'x7562'), { kind:'plant', floors:5 });
SCN.blds.find(b => b.key === 'x8892').floors = 4;   // Audrey Hepburn Children's House: four floors under its pitched roofs (Google 3D)   // a tall plant building with roof fans, not a house (Jose's photos, 2026-10-28)
// drives under buildings (Jose's photos, 2026-10-28). Link Pavilion: its front entrance is a drive-through under the
// building, the map's tunnel road (way 8933) at z -10, the lobby's glass behind it and the floors above reaching out over
// the drive to the map's stub (cut before, x -2.25 to 4.46, out to z -6). Medical Plaza: its west wing stands on tall piers
// over the map's covered loop (ways 2222-2224).
Object.assign(SCN.blds.find(b => b.key === 'e'), { pts: (() => { const p = SCN.blds.find(b => b.key === 'e').pts, i = p.findIndex(q => q[0] === 4.46 && q[1] === -8.1);
    return [...p.slice(0, i + 1), [4.46, -6.0], [-2.25, -6.0], ...p.slice(i + 1)]; })(),
  under: { floors:1.4, open:rectPts(-2.25, -11.1, 4.46, -6.0),
    ground:[[12.3,-11.79],[5.92,-11.88],[5.9,-11.24],[4.48,-11.27],[-2.2,-11.1],[-2.2,-12.73],[-8.28,-12.83],[-8.26,-13.85],[-9.71,-13.89],[-9.66,-18.62],[-8.97,-18.59],[-8.87,-21.45],[-3.28,-21.4],[-3.29,-20.84],[-2.07,-20.83],[-2.05,-24.33],[0.71,-24.29],[0.71,-26.78],[7.5,-26.71],[7.44,-19.14],[10.68,-19.11],[10.68,-18.05],[11.56,-18.03],[11.52,-13.46],[12.32,-13.43]] } });
// Medical Plaza: open on piers all round its ground floor (his photos from the court, 2026-10-28), the lobby walls set
// back under the floors above; the covered loop under the west wing as before
Object.assign(SCN.blds.find(b => b.key === 'c'), { under: { floors:2, open:SCN.blds.find(b => b.key === 'c').pts,
  ground:[[6.35,8.62],[6.35,-2.75],[10.4,-2.6],[10.35,-0.3],[20.8,-0.1],[20.62,9.0]] } });
for (const b of SCN.blds) realBuilding(b);
// the machines on the hospital roofs, where the state's 2020 aerial shows them (aerial_roofs.py -> roofs.json): their
// colours mostly greyed (the photo tints them) and rounded to a few shades, one merged mesh per shade
{ const byShade = {};
  for (const b of SCN.blds){ const RF = ROOFS[b.id]; if (!RF) continue; const B = BLD[b.key], top = B.y0 + B.h + 0.22;
    for (const [x, z, w, d, h, c] of RF.units){ const v3 = c.slice(1).match(/../g).map(v => parseInt(v, 16)), gr = (v3[0] + v3[1] + v3[2])/3, q = v3.map(v => Math.min(255, Math.round((gr + (v - gr)*0.35)/24)*24)), key = (q[0] << 16) | (q[1] << 8) | q[2];
      (byShade[key] = byShade[key] || []).push(placed(new THREE.BoxGeometry(w, h, d), x, top + h/2, z, 0).toNonIndexed()); } }
  for (const k in byShade) add(mergeGeometries(byShade[k], false), M(+k, { r:0.7 }), 0, 0, 0, true); }
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
entranceOn('t'); entranceOn('n'); entranceOn('s');   // (Medical Plaza's doors are under its piers, set back: no canopy)   // Link Pavilion's is the diorama's canopy at the end of the drive
// Ethics: Link Pavilion's two big banners on its front, at the end of the drive: white with the HMH mark on the left, blue
// on the right (his aerials, 2026-10-28)
// Ethics: Link Pavilion's front at the head of the drive (Jose's photos, 2026-10-28): two tall U.S. News banners, white
// under a navy band ("TOP 20 IN THE NATION, #1 IN NJ" left, "#1 HOSPITAL IN NY-NJ METRO AREA" right), between them an
// arched window over a tall strip of dark glass; three flagpoles, evergreens, a black fence over pink flowers, the
// wayfinding sign (EMERGENCY, Pediatric Emergency, Women's Hospital Entrance, Visitor Parking)
function bannerTex(lines){ const c = document.createElement('canvas'); c.width = 256; c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#f6f7f9'; g.fillRect(0, 0, 256, 512); g.fillStyle = '#2b3a6b'; g.fillRect(0, 0, 256, 92); g.fillStyle = '#5b8fd6'; g.fillRect(0, 86, 256, 6);
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.font = 'bold 19px Inter, Arial, sans-serif'; g.fillText('HACKENSACK UNIVERSITY', 128, 40); g.fillText('MEDICAL CENTER', 128, 68);
  lines.forEach(([t, col], i) => { g.fillStyle = col; g.font = 'bold 32px Inter, Arial Narrow, Arial, sans-serif'; g.fillText(t, 128, 160 + i*46); });
  g.fillStyle = '#e9e6dc'; g.fillRect(70, 340, 116, 120); g.fillStyle = '#2b3a6b'; g.font = 'bold 26px Georgia, serif'; g.fillText('BEST', 128, 378); g.fillStyle = '#c8202e'; g.fillRect(62, 398, 132, 24); g.fillStyle = '#ffffff'; g.font = 'bold 16px Arial'; g.fillText('U.S.News', 128, 416);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
pend.push(() => { CUR = 'e'; const z = -6.0 + 0.06;
  add(new THREE.PlaneGeometry(1.25, 2.5), new THREE.MeshBasicMaterial({ map:bannerTex([['TOP 20', '#2b5ea8'], ['IN THE NATION', '#1d2233'], ['#1 IN NJ.', '#1d2233']]) }), -0.6, 2.75, z, false);
  add(new THREE.PlaneGeometry(1.25, 2.5), new THREE.MeshBasicMaterial({ map:bannerTex([['#1 HOSPITAL', '#2b5ea8'], ['IN NY-NJ', '#1d2233'], ['METRO AREA.', '#1d2233']]) }), 2.7, 2.75, z, false);
  const dark = new THREE.MeshStandardMaterial({ color:0x1d2433, roughness:0.08, metalness:0.7, envMapIntensity:1.4 });
  add(new THREE.PlaneGeometry(0.62, 2.3), dark, 1.05, 1.95, z + 0.01, false);
  const arch = new THREE.Mesh(new THREE.CircleGeometry(0.31, 20, 0, Math.PI), dark); arch.position.set(1.05, 3.3, z + 0.01); G.add(arch);
  for (const y of [1.2, 1.6, 2.0, 2.4, 2.8]) add(new THREE.PlaneGeometry(0.62, 0.025), M(0x101420), 1.05, y, z + 0.015, false);
  CUR = '_'; });
{ const pole = M(0x22252b, { r:0.4, m:0.5 });
  for (const [x, h, flag] of [[-0.2, 2.9, 'us'], [0.5, 2.6, 'pow'], [1.9, 2.5, 'white']]){ add(new THREE.CylinderGeometry(0.025, 0.03, h, 8), pole, x, 0.3 + h/2, -5.0);
    add(new THREE.SphereGeometry(0.045, 8, 6), M(0xc9a64a, { r:0.3, m:0.8 }), x, 0.3 + h + 0.03, -5.0, false);
    const f = add(new THREE.PlaneGeometry(0.62, 0.38), flag === 'us' ? new THREE.MeshStandardMaterial({ map:(() => { const c = document.createElement('canvas'); c.width = 64; c.height = 40; const g = c.getContext('2d');
      for (let i = 0; i < 13; i++){ g.fillStyle = i % 2 ? '#ffffff' : '#b22234'; g.fillRect(0, i*40/13, 64, 40/13 + 0.5); } g.fillStyle = '#3c3b6e'; g.fillRect(0, 0, 26, 21.5);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })(), side:THREE.DoubleSide, roughness:0.8 }) : M(flag === 'pow' ? 0x1b1d22 : 0xf2f2ee, { r:0.8, x:{ side:THREE.DoubleSide } }), x + 0.33, 0.3 + h - 0.24, -5.0, false);
    f.rotation.y = 0.35; }
  for (const [x, s] of [[-1.2, 0.85], [0.15, 0.75], [2.3, 0.95], [3.5, 0.7]]) tree(x, -5.45, s, 'cone');
  box(5.4, 0.22, 0.04, M(0x1b1d22, { r:0.5, m:0.4 }), 1.1, 0.42, -4.55, 0.01);
  for (let q = 0; q < 40; q++) add(new THREE.IcosahedronGeometry(0.05, 0), FLOWERS[q % 3 ? 0 : 1], -1.5 + q*0.135, 0.36, -4.4 + (q % 2)*0.08, false);
  const sc = document.createElement('canvas'); sc.width = 128; sc.height = 192; const g = sc.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 128, 192); g.fillStyle = '#2b5ea8'; g.fillRect(118, 0, 10, 192); g.fillStyle = '#d6402c'; g.fillRect(6, 70, 106, 22);
  g.fillStyle = '#fff'; g.font = 'bold 15px Arial'; g.fillText('EMERGENCY', 12, 87); g.fillStyle = '#333'; g.font = '11px Arial';
  ['Pediatric Emergency', "Women's Hospital", 'Visitor Parking'].forEach((t, i) => g.fillText(t, 8, 112 + i*22)); g.fillStyle = '#2b3a6b'; g.font = 'bold 12px Arial'; g.fillText('Hackensack', 30, 30); g.fillText('Meridian Health', 22, 46);
  const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace;
  box(0.62, 0.95, 0.1, M(0xe9ecf0, { r:0.6 }), -0.95, 0.3 + 0.48, -4.6, 0.02); add(new THREE.PlaneGeometry(0.56, 0.84), new THREE.MeshBasicMaterial({ map:st }), -0.95, 0.3 + 0.5, -4.545, false); }
// (no bridge over the drive: the floating brick block there was removed at Jose's word, 2026-10-28)
// ---- the drive-through under Link Pavilion (Jose's 13 photos, 2026-10-28): the lobby's glass behind a sidewalk with steel
// bollards, two round white columns either side of the revolving door, a crosswalk to the outer sidewalk and its brick
// piers; past its east end, the long dark barrel canopy over a herringbone brick walk, on black posts, with lantern
// bollards, running east along the wing's front, in front of the Cardiac Surgery center (Jose) ----
{ const steel = M(0xc4c8ce, { r:0.25, m:0.85 }), brickP = M(0x7a3b30, { r:0.9 }), white = M(0xf2efe8, { r:0.5 }), black = M(0x22252b, { r:0.5, m:0.3 });
  box(10.3, 0.06, 4.6, asphalt, 1.75, 0.285, -8.3, 0.02, false);                                    // the drive under the building and its curves out
  box(6.7, 0.1, 0.55, walk, 1.13, 0.29, -10.85, 0.02, false); box(6.7, 0.02, 0.05, curb, 1.13, 0.345, -10.57, 0.01, false);   // the lobby's sidewalk, yellow curb
  box(6.7, 0.1, 0.5, walk, 1.13, 0.29, -6.25, 0.02, false); box(6.7, 0.02, 0.05, curb, 1.13, 0.345, -6.5, 0.01, false);     // the outer one
  for (const x of [-2.05, 1.1, 4.3]) box(0.42, 0.87, 0.42, brickP, x, 0.3 + 0.435, -6.2, 0.02);       // brick piers under the edge of the floors above
  // the lobby: dark-framed glass, warm inside, pendant lights, the revolving door between two white columns
  add(new THREE.PlaneGeometry(6.2, 0.82), new THREE.MeshBasicMaterial({ map:lobbyTex(), color:0xd8cfc0 }), 1.13, 0.3 + 0.41, -11.08, false);
  add(new THREE.BoxGeometry(6.2, 0.84, 0.02), new THREE.MeshStandardMaterial({ color:0x9fb8c8, roughness:0.05, metalness:0.4, transparent:true, opacity:0.22, envMapIntensity:1.4 }), 1.13, 0.3 + 0.42, -11.06, false);
  for (let k = 0; k <= 9; k++) add(new THREE.BoxGeometry(0.04, 0.84, 0.04), black, -1.97 + k*0.69, 0.3 + 0.42, -11.05);
  box(6.3, 0.05, 0.05, black, 1.13, 0.3 + 0.55, -11.05, 0.01, false);
  for (const x of [0.55, 1.65]) add(new THREE.CylinderGeometry(0.11, 0.11, 0.85, 16), white, x, 0.3 + 0.425, -10.75);
  add(new THREE.CylinderGeometry(0.3, 0.3, 0.55, 20, 1, true), new THREE.MeshStandardMaterial({ color:0xb8d0dc, roughness:0.05, metalness:0.5, transparent:true, opacity:0.45, side:THREE.DoubleSide }), 1.1, 0.3 + 0.275, -11.0, false);
  box(0.64, 0.06, 0.64, M(0xb9a46a, { r:0.4, m:0.6 }), 1.1, 0.3 + 0.58, -11.0, 0.02, false);
  for (const x of [-1.2, 0.2, 2.0, 3.4]) glow(x, 0.3 + 0.62, -10.95, 0.7, 0xffd9a0);
  for (let x = -1.8; x < 4.4; x += 0.75) add(new THREE.CylinderGeometry(0.035, 0.035, 0.2, 10), steel, x, 0.3 + 0.1, -10.65);
  for (let i = 0; i < 10; i++) box(0.62, 0.012, 0.16, paint, -0.6, 0.32, -10.35 + i*0.39, 0.003, false);   // the crosswalk to the lobby
  // the barrel canopy walk east along the wing's front
  const run = [[4.7, -10.85], [8.0, -10.4], [10.4, -10.35], [12.0, -9.9], [13.2, -9.0]], rad = 0.42, cy = 0.3 + 0.62, canM = M(0x3b4049, { r:0.55, m:0.2 });
  for (let i = 1; i < run.length; i++){ const [ax, az] = run[i-1], [bx, bz] = run[i], L = Math.hypot(bx - ax, bz - az), a = Math.atan2(bz - az, bx - ax);
    const c = add(new THREE.CylinderGeometry(rad, rad, L + 0.04, 14, 1, true, 0, Math.PI), canM, (ax + bx)/2, cy, (az + bz)/2, true); c.material.side = THREE.DoubleSide; c.rotation.set(0, -a, Math.PI/2);
    box(L, 0.04, 0.95, M(0x8a5546, { r:0.95 }), (ax + bx)/2, 0.245, (az + bz)/2, 0.01, false).rotation.y = -a;   // the herringbone brick walk
    for (let t = 0; t < L; t += 0.9) for (const sd of [-1, 1]){ const x = ax + (bx - ax)*t/L - Math.sin(a)*sd*rad*0.95, z = az + (bz - az)*t/L + Math.cos(a)*sd*rad*0.95;
      add(new THREE.CylinderGeometry(0.02, 0.02, cy - 0.3, 6), black, x, 0.3 + (cy - 0.3)/2, z); }
    for (let t = 0.45; t < L; t += 1.8){ const x = ax + (bx - ax)*t/L + Math.sin(a)*0.62, z = az + (bz - az)*t/L - Math.cos(a)*0.62;
      add(new THREE.BoxGeometry(0.07, 0.16, 0.07), black, x, 0.38, z); glow(x, 0.44, z, 0.35, 0xfff0d0); } }
  add(new THREE.BoxGeometry(0.1, 0.32, 0.1), M(0xc0282c, { r:0.5 }), 9.6, 0.46, -10.2);   // the red call box by the walk
  // the John Apovian, M.D. Cardiac Surgery and Structural Heart Center (his photos, 2026-10-28): on Link Pavilion's wall
  // along the canopy walk, its own lower grey barrel canopy over the door and windows, white lettering on the brick
  { const wz = -11.83, cy2 = 0.3 + 0.48, grey = M(0x4a4f58, { r:0.5, m:0.2 });
    const c2 = add(new THREE.CylinderGeometry(0.3, 0.3, 4.6, 14, 1, true, 0, Math.PI), grey, 8.6, cy2, wz + 0.3, true); c2.material.side = THREE.DoubleSide; c2.rotation.set(0, 0, Math.PI/2);
    for (const x of [6.4, 8.6, 10.8]) add(new THREE.CylinderGeometry(0.018, 0.018, cy2 - 0.3, 6), M(0x22252b), x, 0.3 + (cy2 - 0.3)/2, wz + 0.58);
    add(new THREE.PlaneGeometry(4.4, 0.42), new THREE.MeshStandardMaterial({ color:0x2a3340, roughness:0.08, metalness:0.6, envMapIntensity:1.2 }), 8.6, 0.3 + 0.22, wz + 0.02, false);
    add(new THREE.PlaneGeometry(0.42, 0.5), new THREE.MeshStandardMaterial({ color:0x1f2733, roughness:0.1, metalness:0.5 }), 10.0, 0.3 + 0.25, wz + 0.025, false);
    const tc = textCanvas(['John Apovian, M.D.', 'Cardiac Surgery and', 'Structural Heart Center'], { w:512, lh:48, font:'bold 34px Inter, Arial, sans-serif', col:'#ffffff' });
    const tt = new THREE.CanvasTexture(tc); tt.colorSpace = THREE.SRGBColorSpace;
    add(new THREE.PlaneGeometry(1.4, 0.4), new THREE.MeshBasicMaterial({ map:tt, transparent:true }), 11.3, 0.3 + 0.95, wz + 0.03, false); }
  // under Medical Plaza's wing: the covered loop
  box(2.8, 0.06, 8.8, asphalt, 4.95, 0.282, 3.05, 0.02, false); }
// ==================== the Visitor Parking court (Jose's 8 photos, 2026-10-28) ====================
// Between Link Pavilion's east wing, the Visitor Parking garage and Medical Plaza's tower: an asphalt court to the garage's
// gates ("Enter | Visitor Parking | Enter" over them, gate arms, a booth), a narrow island of white stones in a yellow curb,
// cars at the tower's foot behind a wooden guardrail on a bed of stones, a lawn with a hydrant before the garage, and a
// crosswalk with a "State law: stop for pedestrians" sign from the paved walk by Link to the tower's corner, where steps
// and a ramp with black railings go up between planted beds; the walk's edge in pavers with a dark brick border and a
// yellow curb, a black iron fence and a lamp.
{ const yellow = M(0xe9c33a, { r:0.6 }), stones = M(0xd6d2ca, { r:0.95 }), wood = M(0xb9a68a, { r:0.85 }), black = M(0x1f2228, { r:0.5, m:0.3 }), GY = 0.31;
  box(4.75, 0.06, 6.3, asphalt, 8.78, GY - 0.03, -6.6, 0.02, false);                                       // the court
  for (let i = 0; i < 9; i++) box(0.62, 0.012, 0.16, paint, 6.95, GY + 0.005, -9.1 + i*0.6, 0.003, false); // the crosswalk to the tower's corner
  for (const x of [6.58, 7.32]) box(0.06, 0.012, 5.0, paint, x, GY + 0.006, -6.7, 0.003, false);
  { const g = new THREE.Group(); g.position.set(7.65, GY, -5.4); g.rotation.y = 0.3; G.add(g);                // the stop-for-pedestrians sign in the crosswalk
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.06, 16), black); base.position.y = 0.03; g.add(base);
    const c = document.createElement('canvas'); c.width = 64; c.height = 160; const x = c.getContext('2d'); x.fillStyle = '#d8f03a'; x.fillRect(0, 0, 64, 160); x.fillStyle = '#ffffff'; x.fillRect(6, 6, 52, 148);
    x.fillStyle = '#d8f03a'; x.fillRect(6, 6, 52, 22); x.fillStyle = '#c8202a'; x.beginPath(); x.arc(32, 52, 14, 0, Math.PI*2); x.fill(); x.fillStyle = '#222'; x.fillRect(26, 80, 12, 40);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    for (const ry of [0, Math.PI]){ const f = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.55), new THREE.MeshBasicMaterial({ map:t, side:THREE.FrontSide })); f.position.set(0, 0.36, ry ? -0.012 : 0.012); f.rotation.y = ry; g.add(f); } }
  // the island of white stones, narrow and pointed toward the gates
  { const isl = [[8.35, -7.6], [8.75, -7.55], [9.0, -6.0], [8.85, -5.3], [8.55, -5.3], [8.25, -6.0]]; slab(isl, GY, 0.1, yellow); slab(isl.map(([x, z]) => [x + (8.6 - x)*0.12, z + (-6.4 - z)*0.08]), GY + 0.02, 0.1, stones); }
  for (const [x, z] of [[9.9, -8.2], [9.9, -4.6]]){ box(0.08, 0.012, 0.8, paint, x, GY + 0.006, z, 0.003, false); box(0.3, 0.012, 0.08, paint, x + 0.14, GY + 0.006, z - 0.34, 0.003, false); }   // arrows to the gates
  // the garage's gates on its face to the court: a dark opening, the sign over it, red and white arms, a booth
  { const fx = 11.06;
    add(new THREE.PlaneGeometry(3.4, 0.42), M(0x15171c, { r:0.9 }), fx, 0.3 + 0.24, -5.6, false).rotation.y = -Math.PI/2;
    const c = document.createElement('canvas'); c.width = 512; c.height = 48; const x = c.getContext('2d'); x.fillStyle = '#f4f5f7'; x.fillRect(0, 0, 512, 48);
    x.fillStyle = '#2b3446'; x.font = '600 24px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('Enter', 60, 25); x.fillText('Visitor Parking', 256, 25); x.fillText('Enter', 452, 25);
    x.fillStyle = '#b9bec8'; x.fillRect(118, 6, 2, 36); x.fillRect(392, 6, 2, 36);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    add(new THREE.PlaneGeometry(3.0, 0.28), new THREE.MeshBasicMaterial({ map:t }), fx - 0.02, 0.3 + 0.62, -5.6, false).rotation.y = -Math.PI/2;
    for (const z of [-6.6, -4.9]){ box(0.1, 0.25, 0.1, M(0xe9c33a), fx - 0.25, GY + 0.12, z, 0.02); const arm = box(0.03, 0.03, 0.9, M(0xffffff), fx - 0.25, GY + 0.24, z + 0.48, 0.01, false);
      for (let k = 0; k < 3; k++) box(0.035, 0.035, 0.12, M(0xc8202a), fx - 0.25, GY + 0.24, z + 0.15 + k*0.3, 0.01, false); }
    box(0.36, 0.42, 0.36, M(0xf0efec, { r:0.6 }), fx - 0.32, GY + 0.21, -5.75, 0.03); }
  // the lawn with a hydrant before the garage, in a yellow curb
  slab([[9.55, -9.5], [11.25, -9.55], [11.2, -7.2], [9.7, -7.25]], GY, 0.08, yellow); slab([[9.62, -9.45], [11.18, -9.5], [11.13, -7.28], [9.77, -7.32]], GY + 0.02, 0.08, grass);
  add(new THREE.CylinderGeometry(0.05, 0.06, 0.2, 10), M(0xc8202a, { r:0.5 }), 10.0, GY + 0.2, -7.6);
  // at the tower's foot: a bed of stones, a wooden guardrail, cars parked along it
  box(4.4, 0.05, 0.42, stones, 8.8, GY + 0.02, -3.72, 0.01, false);
  box(4.4, 0.06, 0.05, wood, 8.8, GY + 0.3, -3.98, 0.01); for (let x = 6.7; x <= 10.95; x += 1.05) box(0.07, 0.34, 0.07, wood, x, GY + 0.17, -3.98, 0.01);
  for (const [x, ci] of [[7.6, 2], [9.6, 6]]) parkedAt(x, -4.45, Math.PI/2, ci, GY - 0.04);
  for (const [z, ci] of [[-6.1, 0], [-7.3, 1]]) parkedAt(10.25, z, Math.PI/2, ci, GY - 0.04);                // waiting at the gates
  // the tower's corner: steps and a ramp up under the piers, black railings, planted beds of grasses
  for (let k = 0; k < 3; k++) box(1.0, 0.07, 0.24, M(0xd9d6cf, { r:0.8 }), 7.3, GY + 0.035 + k*0.07, -3.35 + k*0.24, 0.01);
  box(0.9, 0.06, 1.2, M(0xd9d6cf, { r:0.8 }), 8.45, GY + 0.1, -2.9, 0.01).rotation.x = -0.12;
  for (const x of [6.75, 7.85, 9.0]){ box(0.025, 0.025, 1.0, black, x, GY + 0.42, -3.0, 0.005, false); for (const z of [-3.45, -2.6]) box(0.025, 0.32, 0.025, black, x, GY + 0.26, z, 0.005, false); }
  for (const [x, z] of [[6.0, -3.0], [9.8, -3.0], [10.4, -2.95]]){ bed([[x - 0.4, z - 0.25], [x + 0.4, z - 0.25], [x + 0.45, z + 0.2], [x - 0.45, z + 0.2]], GY, { density:10, colours:[2, 3] }); }
  // the walk's edge by Link: pavers with a dark brick border and a yellow curb, a black iron fence and a lamp
  box(6.4, 0.04, 0.16, M(0x3c3f48, { r:0.85 }), 7.9, GY + 0.01, -9.68, 0.01, false); box(6.4, 0.07, 0.06, yellow, 7.9, GY + 0.03, -9.58, 0.01, false);
  for (let x = 9.6; x <= 11.1; x += 0.12) box(0.02, 0.38, 0.02, black, x, GY + 0.19, -9.76, 0.004, false); box(1.55, 0.03, 0.03, black, 10.35, GY + 0.36, -9.76, 0.005, false);
  lamp(9.3, -9.8); }
// the Women's and Children's Pavilion's glass grid on its south face, floors 3 to 6 (his aerials)
pend.push(() => { const E = BLD.x8905.E; let i = 0; E.forEach((e, k) => { if (e.az + e.bz > E[i].az + E[i].bz) i = k; });
  const t = curtainTex(); t.repeat.set(7.0/1.4, 4); onWall('x8905', i, 2.0, 0.3 + 4*FL, 7.0, 4*FL, new THREE.MeshStandardMaterial({ map:t, roughness:0.12, metalness:0.35, envMapIntensity:1.1 }), 0.05); CUR = '_'; });
// ==================== the drive in from Atlantic, along Women's and Children's (his Street View, 2026-10-28) ====================
// The map's service road from Atlantic runs along the pavilion's front. His four shots there: a long flat grey canopy on
// columns over the pavilion's doors, a drop-off lane under it split from the through lane by a long island (yellow curb,
// red mulch and flowers, a wayfinding sign, a hydrant and two yellow bollards at its east tip); at the pavilion's east end
// a drive-through tunnel under it (the map's covered service road, way 4473) between red-brick piers, louvres over it;
// across the side drive, the red-brick Creamer Imaging building with a one-floor front under a flat grey canopy that wraps
// its corner, a red Emergency sign on it, its roof's machines (from the aerial) and a tall white banner.
{ const wz = x => -6.65 + (x + 27.57)/16.64*0.15;   // the pavilion's front wall (map 8905)
  const greyC = M(0x6b7079, { r:0.55, m:0.25 }), greyU = M(0xc9ccd2, { r:0.7 }), tanCol = M(0xd6c4a8, { r:0.75 }), brickP = M(0x8c4a3a, { r:0.9 });
  // the drop-off lane and the island between it and the through lane
  box(12.6, 0.06, 1.05, asphalt, -17.6, 0.235, -5.25, 0.02, false);
  pill(-18.3, -4.6, 0.34, 8.6, curb, 0.27, 0.12).rotation.y = Math.PI/2; pill(-18.3, -4.6, 0.24, 8.45, M(0x7a3a2c, { r:0.95 }), 0.3, 0.12).rotation.y = Math.PI/2;
  { const r = rngAt(-18.3, -4.6); for (let q = 0; q < 34; q++) add(new THREE.IcosahedronGeometry(0.05, 0), FLOWERS[[0, 4, 2, 5][q % 4]], -22.3 + q*0.24 + r()*0.08, 0.38, -4.6 + (r() - 0.5)*0.12, false); }
  for (const x of [-21.0, -19.2]) shrub(x, 0.33, -4.6, 0.13, 1);
  for (const x of [-14.25, -14.65]){ add(new THREE.CylinderGeometry(0.045, 0.045, 0.34, 10), M(0xe8c43a, { r:0.5 }), x, 0.5, -4.6); }
  add(new THREE.CylinderGeometry(0.05, 0.06, 0.2, 10), M(0xc8322c, { r:0.5 }), -14.45, 0.43, -4.66);
  box(0.06, 0.5, 0.34, M(0xe9ecf2, { r:0.6 }), -15.4, 0.62, -4.6, 0.02); box(0.07, 0.08, 0.36, M(0x2b5ea8, { r:0.6 }), -15.4, 0.82, -4.6, 0.01);
  // the canopy over the pavilion's front, on tan columns, with a glass storefront under it
  { const x0 = -22.0, x1 = -13.3, zc = wz((x0 + x1)/2) + 0.42;
    box(x1 - x0, 0.1, 0.84, greyC, (x0 + x1)/2, 0.3 + 0.86, zc, 0.03); box(x1 - x0 - 0.04, 0.02, 0.8, greyU, (x0 + x1)/2, 0.3 + 0.8, zc, 0.01, false);
    for (let x = x0 + 0.45; x < x1; x += 1.45) add(new THREE.CylinderGeometry(0.09, 0.09, 0.82, 12), tanCol, x, 0.3 + 0.41, wz(x) + 0.72);
    add(new THREE.PlaneGeometry(x1 - x0 - 0.3, 0.5), new THREE.MeshStandardMaterial({ color:0x31424f, roughness:0.08, metalness:0.6, envMapIntensity:1.2 }), (x0 + x1)/2, 0.3 + 0.3, wz((x0 + x1)/2) + 0.035, false);
    for (let x = x0 + 1.2; x < x1 - 0.5; x += 2.4) glow(x, 0.3 + 0.55, wz(x) + 0.2, 0.6, 0xffe2b0); }
  // a grey rolling door, then the tunnel at the east end: dark under a lintel, brick piers, two louvres over it
  add(new THREE.PlaneGeometry(0.9, 0.55), M(0x8d9097, { r:0.6, m:0.3 }), -13.0, 0.3 + 0.28, wz(-13.0) + 0.03, false);
  add(new THREE.PlaneGeometry(1.5, 0.8), new THREE.MeshBasicMaterial({ color:0x15171c }), -11.7, 0.3 + 0.4, wz(-11.7) + 0.02, false);
  for (const x of [-12.5, -11.0]) box(0.24, 0.82, 0.22, brickP, x, 0.3 + 0.41, wz(x) + 0.1, 0.02);
  box(1.75, 0.12, 0.2, tanCol, -11.75, 0.3 + 0.86, wz(-11.75) + 0.08, 0.02);
  for (const x of [-12.15, -11.35]) box(0.6, 0.12, 0.04, M(0xe4e6ea, { r:0.5 }), x, 0.3 + 1.08, wz(x) + 0.03, 0.01, false);
  for (const z of [-3.25, -6.15]) for (let i = 0; i < 6; i++) box(0.16, 0.012, 0.6, paint, -11.95 + i*0.28, 0.262, z + 0.3, 0.003, false);   // the crosswalks across the tunnel's mouth
  // Creamer Imaging (map 8907): the one-floor front with a canopy wrapping its corner, the Emergency sign, the penthouse, the banner
  { const wx = -8.88, nzw = -5.42, cy = 0.3 + 0.66;
    box(0.6, 0.08, 6.0, greyC, wx - 0.3, cy, -8.4, 0.02); box(4.6, 0.08, 0.7, greyC, wx + 2.3 - 0.3, cy, nzw + 0.35, 0.02);
    for (let z = -6.0; z > -11.4; z -= 1.5) add(new THREE.CylinderGeometry(0.06, 0.06, 0.62, 10), M(0x9a9ea6, { r:0.5 }), wx - 0.52, 0.3 + 0.31, z);
    for (let x = wx + 1.2; x < wx + 4.4; x += 1.5) add(new THREE.CylinderGeometry(0.06, 0.06, 0.62, 10), M(0x9a9ea6, { r:0.5 }), x, 0.3 + 0.31, nzw + 0.62);
    const sf = new THREE.MeshStandardMaterial({ color:0x2a3340, roughness:0.08, metalness:0.6, envMapIntensity:1.2 });
    add(new THREE.PlaneGeometry(5.6, 0.5), sf, wx - 0.02, 0.3 + 0.27, -8.6, false).rotation.y = -Math.PI/2;
    add(new THREE.PlaneGeometry(2.6, 0.5), sf, wx + 2.3, 0.3 + 0.27, nzw + 0.02, false);
    const sign = textCanvas(['EMERGENCY'], { w:512, lh:96, font:'bold 64px Inter, Arial, sans-serif', col:'#ffffff' }), st = new THREE.CanvasTexture(sign); st.colorSpace = THREE.SRGBColorSpace;
    box(0.06, 0.24, 1.05, M(0xc8262e, { r:0.5 }), wx - 0.62, cy + 0.15, -6.0, 0.02);
    add(new THREE.PlaneGeometry(1.0, 0.19), new THREE.MeshBasicMaterial({ map:st, transparent:true }), wx - 0.655, cy + 0.15, -6.0, false).rotation.y = -Math.PI/2;
    glow(wx - 0.7, cy + 0.15, -6.0, 0.8, 0xff6a6a);
    pend.push(() => { add(new THREE.PlaneGeometry(0.42, 1.5), new THREE.MeshBasicMaterial({ color:0xf4f6fa }), -5.0, 0.3 + 1.25, nzw + 0.03, false);
      add(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshBasicMaterial({ map:TEX, transparent:true }), -5.0, 0.3 + 1.75, nzw + 0.04, false); }); } }
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
for (const [x, z, s, k] of SCN.trees) if (!(x > -24.6 && x < -16.9 && z > -31.8 && z < -24.4) && !(x > -4 && x < 5 && z > -54.5 && z < -45.5) && !(x > 11.6 && x < 16.0 && z > -36.6 && z < -30.9) && !(x > -6.5 && x < 12.8 && z > -47 && z < -29) && !(x > 12.6 && x < 19.9 && z > -47.4 && z < -36.4)) backTree(x, z, s*0.75, k);   // none under the pavilion's bridge
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
// (2026-10-28, "the upper glass portion, it's big": a big floor plate, its long curved face toward the corner,
// sweeping from beside the bridge to behind Imus, as in his window photo and the Google 3D view from the southwest)
// the curved face runs from (-3, -29.5), behind Imus, to (6, -46.3), beside the bridge (plain numbers: the buildings are
// built before a const here would be set)
function htpCurve(u, inset=0){ const b = Math.sin(u*Math.PI)*3.5 - inset; return [-3.0 + 9.0*u - 0.88*b, -29.5 - 16.8*u - 0.47*b]; }
function htpTowerPts(){ const pts = [[6.0, -46.3], [12.2, -46.3], [12.2, -29.5], [-3.0, -29.5]];
  for (let k = 1; k < 16; k++) pts.push(htpCurve(k/16)); return pts; }
var TERRA_M = null, CURTAIN_M = null;
function htpFL(){ return FL*1.65; }   // var: the buildings are built before this line runs; tall hospital floors. With 4 of terracotta
// platform and 9 of glass (scene.json floors 13) the glass rises over the bridge as in his window photo, measured against Imus
function htpMats(){ if (TERRA_M) return; const t = terraTex(); t.repeat.set(1/3.2, 1/(3*htpFL())); TERRA_M = new THREE.MeshStandardMaterial({ map:t, roughness:0.75, envMapIntensity:0.15 });
  const c = curtainTex(); c.repeat.set(1/1.4, 1/htpFL()); c.offset.set(0, -((1/htpFL()) % 1)); CURTAIN_M = new THREE.MeshStandardMaterial({ map:c, roughness:0.12, metalness:0.35, envMapIntensity:1.1 }); }
function htpBody(b, y0, h){ htpMats(); const FL = htpFL(); const HTP_SLIM = rectPts(12.2, -36.0, 15.4, -31.5), HTP_BRIDGE = rectPts(-3.0, -53.5, 4.0, -46.3), P4 = 4*FL, ty = y0 + P4 + 0.2, th = h - P4 - 0.2, FAS = M(0xd3d6db, { r:0.5 });
  wallsOf(b.pts, y0, P4, TERRA_M); slab(b.pts, y0 + P4, 0.2, M(0xd8d2c8), [], true);
  const T = htpTowerPts(); wallsOf(T, ty, th, CURTAIN_M); slab(T, ty + th, 0.25, M(0xc9ccd2), [], true);
  slab(T, ty - 0.08, 0.08, M(0x2f3442, { r:0.8 }));   // its dark underside where it reaches out past the platform
  for (const [x, z] of [htpCurve(0.86, 0.7), [11.4, -45.6]]) box(0.36, ty - 0.3, 0.7, M(0xc9cdd3, { r:0.45, m:0.2 }), x, 0.3 + (ty - 0.3)/2, z, 0.03);   // slim grey piers under it
  // under it, along the sidewalk: a raised brick planter of shrubs and red flowers
  box(11.0, 0.45, 0.8, M(0xa0523d, { r:0.9 }), 6.2, 0.3 + 0.225, -46.9, 0.04);
  { const r = rngAt(6, -47); for (let x = 1.1; x < 11.6; x += 0.85){ shrub(x, 0.76, -46.9 + (r() - 0.5)*0.2, 0.22 + r()*0.08, Math.floor(r()*3));
      for (let q = 0; q < 4; q++) add(new THREE.IcosahedronGeometry(0.05, 0), FLOWERS[q % 2 ? 0 : 2], x + 0.4 + (r() - 0.5)*0.3, 0.8, -46.9 + (r() - 0.5)*0.5, false); } }
  for (const [x, z] of [[4.0, -34.0], [8.5, -38.5], [6.0, -42.5]]) box(1.6, 0.5, 1.2, M(0x9a97a6), x, ty + th + 0.5, z, 0.05);
  // the slim tower: on Imus's side of the street, against the curved tower's far side (Jose, 2026-10-28), on terracotta
  wallsOf(HTP_SLIM, y0, ty - y0, TERRA_M); slab(HTP_SLIM, ty - 0.2, 0.2, M(0xd8d2c8), [], true);
  wallsOf(HTP_SLIM, ty, th - 0.9, CURTAIN_M); slab(HTP_SLIM, ty + th - 0.9, 0.22, M(0xc9ccd2), [], true);
  // the bridge over 2nd Street: grey fascia, terracotta above, its underside lit, columns on the sidewalks
  const by = 0.3 + 1.15*FL; slab(HTP_BRIDGE, by - 0.02, 0.06, M(0x2f3442, { r:0.8 }), [], true);   // low over the road, the terracotta tall above (his photos)
  wallsOf(HTP_BRIDGE, by, 0.6, FAS); wallsOf(HTP_BRIDGE, by + 0.6, y0 + P4 - by - 0.6, TERRA_M); slab(HTP_BRIDGE, y0 + P4, 0.2, M(0xd8d2c8), [], true);
  for (const [x, z] of [[-2.6, -47.7], [0.5, -47.7], [3.6, -47.7], [-2.6, -52.3], [3.6, -52.3]]) add(new THREE.CylinderGeometry(0.16, 0.16, by - 0.3, 12), FAS, x, 0.3 + (by - 0.3)/2, z);
  for (const [fx, ry] of [[-3.03, -Math.PI/2], [4.03, Math.PI/2]]) for (const z of [-52.1, -47.7]) add(new THREE.PlaneGeometry(1.9, 0.42), M(0x2f3540, { r:0.6 }), fx, by + 0.3, z, false).rotation.y = ry;
  // the older hospital tower at the platform's east end, behind the little park (his Google 3D): orange brick with white
  // bands and ribbon windows over a beige base, ten floors
  { const OT = rectPts(19.75, -44.25, 29.15, -26.1), ofl = FL*0.8, base = 3*ofl, top = 10*ofl, mk = (col, band, glass, fl) => { const t = brickTex(col, band, glass); t.repeat.set(1/0.9, 1/fl); return new THREE.MeshStandardMaterial({ map:t, roughness:0.85, envMapIntensity:0.12 }); };
    wallsOf(OT, y0, base, mk('#d9c9a8', '#e8dcc6', '#6f8ea8', ofl)); wallsOf(OT, y0 + base, top - base, mk('#c96a42', '#f0ece4', '#5f7f9c', ofl));
    slab(OT, y0 + top, 0.22, M(0xd9d2c4), [], true); box(3.0, 0.7, 2.4, M(0x9a97a6), 24.4, y0 + top + 0.55, -35.0, 0.06); }
  CUR = '_'; for (let k = 0; k < 5; k++) glow(0.5, by - 0.12, -52.6 + k*1.4, 0.7, 0xffe2b0); CUR = 't'; }
pend.push(() => { CUR = 't'; const FL = htpFL(), T = htpTowerPts(), ty = 0.3 + 4*FL + 0.2, th = 13*FL - 4*FL - 0.2;
  letterAlong([T[3], ...T.slice(4), T[0]], ty + th - FL*0.45, 0.62, textCanvas(['HACKENSACK UNIVERSITY MEDICAL CENTER'], { w:2048, lh:96, font:'600 64px Georgia, serif', spacing:'4px' }), [-20, -50], 0.06);
  for (const [x, from] of [[-3.0, [-10, -50]], [4.0, [10, -50]]]) letterAlong([[x, -51.0], [x, -48.8]], 0.3 + 1.15*FL + 0.3, 0.3, textCanvas(['Helena Theurer Pavilion'], { w:1024, lh:64, font:'italic 44px Georgia, serif', col:'#55606e' }), from, 0.04);
  add(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map:TEX, transparent:true }), 13.8, ty + th - 0.9 - 1.0, -36.04, false).rotation.y = Math.PI;   // the HMH mark, on the slim tower's face toward 2nd Street
  CUR = '_'; });

// ---- Don Imus - WFAN Pediatric Center: tan brick, its name in three lines across the curved corner ----
pend.push(() => { const B = BLD.x8899.b, run = B.pts.slice(2, 9);   // the curve that faces the corner
  const c = textCanvas(['DON IMUS - WFAN', 'PEDIATRIC CENTER', 'FOR TOMORROWS CHILDREN'], { w:1024, lh:84, font:'600 46px "Trebuchet MS", sans-serif', col:'#4a3f36', spacing:'6px' });
  letterAlong(run, 0.3 + 3.9*FL, 1.35, c, [-14, -38], 0.05); });

// ---- across 2nd Street from Theurer (his window photo, Google 3D): a row of big round fans on the silver building's roof ----
{ const y = 0.3 + 5*FL + 0.22, hous = M(0xb9bec6, { r:0.5, m:0.3 }), dark = M(0x2a2f3a, { r:0.7 }), hub = M(0x8d939e, { r:0.4, m:0.5 });
  for (let z = -56.2; z > -69; z -= 2.05){ add(new THREE.CylinderGeometry(0.86, 0.9, 0.42, 24), hous, -15.85, y + 0.21, z);
    add(new THREE.CylinderGeometry(0.72, 0.72, 0.02, 24), dark, -15.85, y + 0.43, z, false); add(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 12), hub, -15.85, y + 0.45, z, false); } }
// the silver building carries the HMH mark high on its corner, on both faces (Street View from 2nd St and Atlantic)
pend.push(() => { const y = 0.3 + 5*FL - 0.75, mk = () => new THREE.MeshBasicMaterial({ map:TEX, transparent:true });
  add(new THREE.PlaneGeometry(1.3, 1.3), mk(), -16.9, y, -54.0, false);
  add(new THREE.PlaneGeometry(1.3, 1.3), mk(), -17.97, y, -55.3, false).rotation.y = -Math.PI/2; });
// ---- Audrey Hepburn Children's House: red brick under two grey pitched roofs, ridges along its length (Google 3D) ----
{ const roofM = M(0x8d939e, { r:0.7 }), y = 0.3 + 4*FL + 0.22;
  for (const cx of [31.9, 34.8]){ const sh = new THREE.Shape([new THREE.Vector2(-1.5, 0), new THREE.Vector2(1.5, 0), new THREE.Vector2(0, 0.85)]);
    const g = new THREE.ExtrudeGeometry(sh, { depth:9.7, bevelEnabled:false }); g.translate(cx, y, -62.4); add(g, roofM, 0, 0, 0, true);
    for (let z = -61.4; z < -53; z += 2.2) box(0.45, 0.4, 0.5, M(0xf2ede4, { r:0.6 }), cx - 0.85, y + 0.32, z, 0.04); } }   // dormers on the street side
// ---- the little park beside the pavilion (his Street View and Google 3D): a round plaza paved in rings of pink and
// terracotta round a planted centre, red-leaf trees along the street, a small brick utility house with white tanks
// and a white tent behind (it replaces the diorama's pond garden, which stood about here) ----
{ const PX = 16.0, PZ = -43.3, PINKP = M(0xe2a593, { r:0.85 }), TERRAP = M(0xb8644a, { r:0.85 }), BEIGE = M(0xe8dcc6, { r:0.85 });
  for (const [r0, r1, m, y] of [[2.95, 3.3, BEIGE, 0.262], [2.3, 2.95, PINKP, 0.266], [1.85, 2.3, TERRAP, 0.27], [1.3, 1.85, PINKP, 0.274], [1.0, 1.3, BEIGE, 0.278]]){
    const g = new THREE.RingGeometry(r0, r1, 56); g.rotateX(-Math.PI/2); add(g, m, PX, y, PZ, false); }
  add(new THREE.CylinderGeometry(1.0, 1.05, 0.24, 36), M(0x9a5a44, { r:0.9 }), PX, 0.39, PZ);   // the planted centre in a low brick ring
  add(new THREE.CylinderGeometry(0.92, 0.92, 0.04, 36), M(0x5a4030, { r:1 }), PX, 0.52, PZ, false);
  { const r = rngAt(PX, PZ); shrub(PX, 0.54, PZ, 0.34, 1); for (let q = 0; q < 22; q++){ const a = q/22*Math.PI*2, d = 0.5 + r()*0.32; add(new THREE.IcosahedronGeometry(0.06, 0), FLOWERS[q % 4], PX + Math.cos(a)*d, 0.58 + r()*0.04, PZ + Math.sin(a)*d, false); } }
  for (const a of [0.6, 2.2, 3.8, 5.3]) bench(PX + Math.cos(a)*2.55, PZ + Math.sin(a)*2.55, Math.PI/2 - a, 0.27);
  for (const a of [1.4, 3.0, 4.55, 6.0]) shrub(PX + Math.cos(a)*3.55, 0.3, PZ + Math.sin(a)*3.55, 0.3, 2);
  for (let x = 13.3; x < 19.6; x += 1.55) tree(x, -47.1, 0.62, 'red');   // red-leaf trees along the street
  // behind it: the brick utility house, two white tanks, a white tent
  box(2.2, 1.1, 1.4, M(0xa0523d, { r:0.9 }), 18.5, 0.3 + 0.55, -38.3, 0.05); box(2.3, 0.1, 1.5, M(0xd8d2c8), 18.5, 0.3 + 1.15, -38.3, 0.03);
  for (const x of [14.8, 15.6]) add(new THREE.CylinderGeometry(0.32, 0.32, 1.4, 20), M(0xf2f2f0, { r:0.4, m:0.2 }), x, 0.3 + 0.7, -38.0);
  box(1.1, 0.9, 1.8, M(0xf4f4f2, { r:0.7 }), 16.9, 0.3 + 0.45, -38.2, 0.12); }
// ---- the Atlantic Street garage's corner on the intersection: a beige stair tower with a dark slit of glass up it (Google 3D) ----
{ const st = box(1.4, 4.1, 1.4, M(0xd9c7a2, { r:0.8 }), -25.1, 0.3 + 2.05, -45.2, 0.04), slit = M(0x2a3142, { r:0.3, m:0.4 });
  add(new THREE.PlaneGeometry(0.26, 3.3), slit, -24.385, 2.25, -45.2, false).rotation.y = Math.PI/2; add(new THREE.PlaneGeometry(0.26, 3.3), slit, -25.1, 2.25, -45.915, false).rotation.y = Math.PI; }
// ---- the Joseph M. Sanzari Family Walkway over Atlantic Street, from the garage to the hospital by Imus: the map's footway
// bridge (way 8918). His photos (2026-10-28): grey panels with children's silhouettes and its name, a band of glass on
// diagonal steel, a sign band under it (Hackensack Meridian Health, Hackensack University Medical Center), an X-braced
// grey pier at the hospital end ----
{ const BR = { x0:-26.12, z0:-31.19, x1:-16.85, z1:-31.64 }, bl = Math.hypot(BR.x1 - BR.x0, BR.z1 - BR.z0), ba = -Math.atan2(BR.z1 - BR.z0, BR.x1 - BR.x0), bx = (BR.x0 + BR.x1)/2, bz = (BR.z0 + BR.z1)/2;
  const c = document.createElement('canvas'); c.width = 1024; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#c9ccd1'; g.fillRect(0, 0, 1024, 128); g.fillStyle = '#d9dce0'; g.fillRect(0, 0, 1024, 44);
  g.fillStyle = '#5f8296'; g.fillRect(0, 46, 1024, 44); g.strokeStyle = '#e8eaee'; g.lineWidth = 3;
  for (let x = 0; x < 1024; x += 64){ g.beginPath(); g.moveTo(x, 46); g.lineTo(x, 90); g.moveTo(x, 90); g.lineTo(x + 64, 46); g.stroke(); }
  g.fillStyle = '#f4f5f7'; g.fillRect(0, 92, 1024, 36);
  g.fillStyle = '#1d2230'; g.font = 'bold 20px Georgia, serif'; g.textAlign = 'center'; g.fillText('JOSEPH M. SANZARI FAMILY WALKWAY', 512, 30);
  for (const x of [200, 250, 300, 724, 774, 824, 874]){ g.beginPath(); g.arc(x, 14, 5, 0, 7); g.fill(); g.fillRect(x - 4, 19, 8, 14); g.fillRect(x - 9, 22, 18, 3); }
  g.font = '18px Georgia, serif'; g.fillStyle = '#26324d'; g.fillText('Hackensack Meridian Health      Hackensack University Medical Center', 512, 117);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const side = new THREE.MeshStandardMaterial({ map:t, roughness:0.45, metalness:0.2, envMapIntensity:0.6 }), plain = M(0xc9ccd1, { r:0.5 });
  add(new THREE.BoxGeometry(bl, 1.1, 1.1), plain, bx, 2.3, bz, true).rotation.y = ba;
  for (const sg of [-1, 1]){ const nx = -Math.sin(ba)*sg, nz = Math.cos(ba)*sg, m = add(new THREE.PlaneGeometry(bl, 1.1), side, bx + nx*0.56, 2.3, bz + nz*0.56, false); m.rotation.y = ba + (sg < 0 ? Math.PI : 0); }
  const grey = M(0xa9adb4, { r:0.5, m:0.2 }), px = -19.6, pz = bz + (px - bx)*Math.tan(-ba);
  for (const o of [-0.38, 0.38]) add(new THREE.BoxGeometry(0.16, 1.45, 0.16), grey, px + o, 0.3 + 0.72, pz);
  for (const sg of [-1, 1]){ const m = add(new THREE.BoxGeometry(0.08, 1.5, 0.08), grey, px, 0.3 + 0.72, pz); m.rotation.z = sg*0.48; } }
// ==================== the court off Atlantic Street (Jose's 11 photos, 2026-10-28) ====================
// An open drop-off court between Women's and Children's (north), the curved silver building (east) and Imus (south):
// asphalt to the curved building's overhang, steel bollards along its sidewalk, an orange barrier; at its south-west
// corner an island under the walkway with a big evergreen, a lamp, a red hydrant, a blue sign and a black fence.
{ // the court's middle is a round turnaround (his photo from under the overhang): a circle of asphalt in a low curb,
  // pale concrete sidewalk round it, its mouth open to Atlantic Street on the west
  slab([[-24.62,-24.6],[-17.0,-24.6],[-17.75,-27.4],[-17.4,-30.3],[-18.6,-30.0],[-22.0,-29.8],[-24.95,-29.6]], 0.17, 0.1, M(0xd3d0c8, { r:0.85 }));
  const TC = { x:-21.0, z:-27.2, r:2.55 }, circ = (r, n=40) => Array.from({ length:n }, (_, k) => { const a = k/n*Math.PI*2; return [TC.x + Math.cos(a)*r, TC.z + Math.sin(a)*r]; });
  slab(circ(TC.r + 0.12), 0.17, 0.115, M(0xbdb9b0, { r:0.8 })); slab(circ(TC.r), 0.17, 0.118, asphalt);
  slab([[-24.95,-25.6],[TC.x - 1.2,-25.0],[TC.x - 1.2,-29.4],[-24.95,-28.9]], 0.17, 0.118, asphalt);   // the mouth to Atlantic
  add(new THREE.BoxGeometry(0.5, 0.01, 0.25), M(0x2a2c30), TC.x + 0.3, 0.296, TC.z, false);            // a drain grate
  slab([[-24.95,-29.6],[-22.0,-29.8],[-19.3,-30.0],[-18.7,-30.6],[-18.9,-31.4],[-24.98,-31.3]], 0.17, 0.16, M(0xd6d2c8, { r:0.8 }));
  slab([[-24.6,-29.85],[-22.0,-30.0],[-19.6,-30.2],[-19.2,-30.7],[-19.4,-31.2],[-24.6,-31.15]], 0.2, 0.15, M(0x5a3a2a, { r:0.95 }));
  tree(-20.55, -30.7, 1.2, 'cone'); shrub(-20.2, 0.35, -30.55, 0.32, 1); lamp(-19.9, -30.15);
  add(new THREE.CylinderGeometry(0.07, 0.08, 0.28, 10), M(0xc8322c, { r:0.5 }), -19.55, 0.48, -30.3);
  // its corner by Atlantic, before the walk down the hill (his photo): a pink blossom tree, round clipped bushes, and the
  // white wayfinding sign (Cancer Center, Children's Hospital, Pediatric Center, Pediatric Center Parking)
  tree(-22.15, -30.6, 0.95, 'blossom');   // (trees keep 0.5 off the map's Atlantic Street, which runs under this end of the island) shrub(-24.25, 0.35, -30.0, 0.26, 1); shrub(-22.7, 0.35, -30.1, 0.24, 2); shrub(-22.3, 0.35, -30.95, 0.22, 1);
  { const c = document.createElement('canvas'); c.width = 192; c.height = 256; const g = c.getContext('2d');
    g.fillStyle = '#f4f5f7'; g.fillRect(0, 0, 192, 256); g.fillStyle = '#2b5ea8'; for (const [x, y] of [[18,22],[30,14],[42,22],[30,30],[22,34],[38,34]]) g.fillRect(x, y, 8, 8);
    g.fillStyle = '#1d2433'; g.font = 'bold 15px Georgia, serif'; g.fillText('Hackensack', 62, 26); g.fillText('Meridian Health', 62, 44); g.font = '12px Georgia, serif'; g.fillText('Hackensack University', 62, 62);
    g.fillStyle = '#c9ccd2'; g.fillRect(0, 76, 192, 3); g.fillStyle = '#1d2433'; g.font = '15px Arial';
    [['\u2191', 'Cancer Center'], ['\u2192', "Children's Hospital"], ['\u2192', 'Pediatric Center'], ['\u2191', 'Pediatric Center'], ['', 'Parking']].forEach(([ar, t], i) => { g.fillText(ar, 10, 108 + i*30); g.fillText(t, 32, 108 + i*30); });
    const st = new THREE.CanvasTexture(c); st.colorSpace = THREE.SRGBColorSpace;
    box(0.62, 0.85, 0.08, M(0xe9ecf0, { r:0.5 }), -24.3, 0.3 + 0.48, -29.75, 0.02);
    add(new THREE.PlaneGeometry(0.58, 0.8), new THREE.MeshBasicMaterial({ map:st }), -24.3, 0.3 + 0.49, -29.705, false); }
  box(2.4, 0.18, 0.03, M(0x1b1d22, { r:0.5, m:0.4 }), -20.6, 0.45, -30.05, 0.01);
  const steel = M(0xc4c8ce, { r:0.25, m:0.85 });
  for (let z = -24.9; z > -27.0; z -= 0.45) add(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 10), steel, -18.95 + (z + 24.9)*0.05, 0.38, z);
  box(0.5, 0.25, 0.16, M(0xf26a1b, { r:0.6 }), -18.9, 0.4, -26.6, 0.03); }
// the curved building's glass: two floors of curved glass along its west face, over the court, a white band under it
{ const run = [[-16.96,-24.48],[-16.99,-25.04],[-17.62,-26.6],[-17.71,-27.45],[-17.57,-29.54],[-17.32,-30.42],[-16.88,-31.33]], fl = FL, y0 = 0.3 + 1.4*fl;
  const t = curtainTex(); const gm = new THREE.MeshStandardMaterial({ map:t, color:0xbfe6e6, roughness:0.1, metalness:0.4, envMapIntensity:1.3 }), wb = M(0xe6e8ec, { r:0.5 });
  for (let i = 1; i < run.length; i++){ const [ax, az] = run[i-1], [bx, bz] = run[i], L = Math.hypot(bx - ax, bz - az), mx = (ax + bx)/2, mz = (az + bz)/2, nx = -(bz - az)/L, nz = (bx - ax)/L;
    const o = nx < 0 ? 1 : -1, a = Math.atan2(nx*o, nz*o), tt = t.clone(); tt.needsUpdate = true; tt.repeat.set(L/1.0, 2);
    const m = add(new THREE.PlaneGeometry(L + 0.03, 1.8*fl), gm.clone(), mx + nx*o*0.05, y0 + 0.9*fl, mz + nz*o*0.05, false); m.material.map = tt; m.rotation.y = a;
    for (const y of [y0 - 0.05, y0 + 1.8*fl + 0.04]) box(L + 0.06, 0.1, 0.3, wb, mx + nx*o*0.12, y, mz + nz*o*0.12, 0.02).rotation.y = a; }
  add(new THREE.CylinderGeometry(0.26, 0.26, 1.4*fl, 18), M(0xcdb898, { r:0.85 }), -17.0, 0.3 + 0.7*fl, -28.1); }
// the Mark Messier Skyway for Tomorrow's Children sign: a tan panel at the walkway's hospital end, beside the curved
// glass, facing the court and Atlantic Street (his photos, 2026-10-28)
{ const c = textCanvas(['MARK MESSIER', 'SKYWAY', 'FOR', "TOMORROW'S", 'CHILDREN'], { w:320, lh:48, font:'bold 27px Georgia, serif', col:'#2b2622' });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  box(0.14, 1.1, 0.9, M(0xcdb898, { r:0.85 }), -17.75, 2.45, -30.4, 0.02);
  add(new THREE.PlaneGeometry(0.8, 0.9), new THREE.MeshBasicMaterial({ map:t, transparent:true }), -17.83, 2.45, -30.4, false).rotation.y = -Math.PI/2; }
// Women's and Children's south face on the court: tan stucco, the Joseph M. Sanzari Children's Hospital entrance under a
// grey canopy, a green glass wall above it with pink, green, blue and peach diamonds, a round column at its west end
{ const z = -24.6, h = 6*FL;
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#d6b98c'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#9fc9c1'; for (let r = 0; r < 6; r++) g.fillRect(60, 18 + r*40, 120, 18);
  const tan = new THREE.CanvasTexture(c); tan.colorSpace = THREE.SRGBColorSpace;
  add(new THREE.PlaneGeometry(5.9, h), new THREE.MeshStandardMaterial({ map:tan, roughness:0.85 }), -19.95, 0.3 + h/2, z, false).rotation.y = Math.PI;
  const d = document.createElement('canvas'); d.width = 256; d.height = 320; const q = d.getContext('2d');
  q.fillStyle = '#2f5a52'; q.fillRect(0, 0, 256, 320); q.strokeStyle = '#d9e2e0'; q.lineWidth = 3;
  for (let x = 0; x <= 256; x += 21) { q.beginPath(); q.moveTo(x, 0); q.lineTo(x, 320); q.stroke(); } for (let y = 0; y <= 320; y += 26) { q.beginPath(); q.moveTo(0, y); q.lineTo(256, y); q.stroke(); }
  q.fillStyle = 'rgba(190,240,225,.55)'; for (const [x, y] of [[42, 52], [126, 130], [189, 78], [63, 208], [210, 182]]) q.fillRect(x, y, 21, 26);
  const dia = (x, y, col) => { q.fillStyle = col; q.beginPath(); q.moveTo(x, y - 15); q.lineTo(x + 15, y); q.lineTo(x, y + 15); q.lineTo(x - 15, y); q.fill(); };
  dia(22, 30, '#e46fc8'); dia(90, 40, '#a6e34a'); dia(92, 74, '#a6e34a'); dia(210, 236, '#a6e34a'); dia(212, 268, '#a6e34a'); dia(178, 296, '#e46fc8'); dia(220, 300, '#e46fc8');
  q.fillStyle = '#2d8fe0'; q.fillRect(4, 64, 36, 22); q.fillRect(56, 26, 30, 22); q.fillStyle = '#f2c9a0'; q.fillRect(108, 6, 24, 24); q.fillRect(176, 220, 24, 24);
  const dt = new THREE.CanvasTexture(d); dt.colorSpace = THREE.SRGBColorSpace;
  add(new THREE.PlaneGeometry(3.5, 4.4*FL), new THREE.MeshStandardMaterial({ map:dt, roughness:0.15, metalness:0.35, envMapIntensity:1.1 }), -20.85, 0.3 + 1.2*FL + 2.2*FL, z - 0.03, false).rotation.y = Math.PI;
  add(new THREE.PlaneGeometry(3.5, 1.1*FL), new THREE.MeshStandardMaterial({ color:0x8fb4b4, roughness:0.08, metalness:0.5 }), -20.85, 0.3 + 0.55*FL, z - 0.03, false).rotation.y = Math.PI;
  box(2.0, 0.08, 0.7, M(0xa8acb3, { r:0.4, m:0.3 }), -20.6, 0.3 + 0.62, z - 0.35, 0.02);
  for (const x of [-21.2, -20.0]) add(new THREE.PlaneGeometry(0.5, 0.5), M(0xe9edf1, { r:0.4 }), x, 0.3 + 0.25, z - 0.04, false).rotation.y = Math.PI;
  const tc = textCanvas(["JOSEPH M. SANZARI CHILDREN'S HOSPITAL"], { w:1024, lh:64, font:'bold 40px Inter, Arial, sans-serif', col:'#eef2f4' }), tt2 = new THREE.CanvasTexture(tc); tt2.colorSpace = THREE.SRGBColorSpace;
  add(new THREE.PlaneGeometry(2.0, 0.13), new THREE.MeshBasicMaterial({ map:tt2, transparent:true }), -20.6, 0.3 + 0.75, z - 0.05, false).rotation.y = Math.PI;
  add(new THREE.CylinderGeometry(0.17, 0.17, 1.2*FL, 16), M(0xcdb898, { r:0.85 }), -22.55, 0.3 + 0.6*FL, z - 0.35); }
// Imus' face on the court: two floors of grey panels with a glass band, a tall glass atrium over them with a white
// overhanging roof on a white tree column, its name on the low wall in front
{ const ax = -16.05, az = -31.74, bx2 = -19.22, bz2 = -32.37, L = Math.hypot(bx2 - ax, bz2 - az), mx = (ax + bx2)/2, mz = (az + bz2)/2, a = Math.atan2(-(bz2 - az)/L*-1, (bx2 - ax)/L*-1);
  const nx = (bz2 - az)/L, nz = -(bx2 - ax)/L, o = nz > 0 ? 1 : -1, ry = Math.atan2(nx*o, nz*o), P = (d, y, w, h, mat) => { const m = add(new THREE.PlaneGeometry(w, h), mat, mx + nx*o*d, y, mz + nz*o*d, false); m.rotation.y = ry; return m; };
  P(0.04, 0.3 + FL, L, 2*FL, M(0xc9ccd1, { r:0.5 })); P(0.05, 0.3 + FL, L - 0.2, 0.5*FL, new THREE.MeshStandardMaterial({ color:0x6f93a6, roughness:0.08, metalness:0.5 }));
  const g2 = curtainTex(); g2.repeat.set(L/0.9, 3); P(0.05, 0.3 + 3.5*FL, L, 3*FL, new THREE.MeshStandardMaterial({ map:g2, roughness:0.1, metalness:0.4, envMapIntensity:1.3 }));
  box(L + 0.6, 0.08, 1.2, M(0xf2f2ef, { r:0.5 }), mx + nx*o*0.45, 0.3 + 5.1*FL, mz + nz*o*0.45, 0.02).rotation.y = ry;
  add(new THREE.CylinderGeometry(0.05, 0.06, 5*FL, 8), M(0xf2f2ef, { r:0.5 }), mx + nx*o*0.8, 0.3 + 2.5*FL, mz + nz*o*0.8);
  const tc = textCanvas(['DON IMUS - WFAN PEDIATRIC CENTER'], { w:1024, lh:64, font:'bold 38px Georgia, serif', col:'#2a2a2a' }), tt = new THREE.CanvasTexture(tc); tt.colorSpace = THREE.SRGBColorSpace;
  P(0.06, 0.48, L - 0.4, 0.16, new THREE.MeshBasicMaterial({ map:tt, transparent:true })); }
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

