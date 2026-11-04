// Smooths the face's carved relief (Tripo's own eye sockets, lid ridges, mouth creases) on the front of the head,
// so the painted features from Jose's drawing carry the face. Same front camera as render.html / bake.html.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld } from '@gltf-transform/functions';
const [inGlb, outGlb, ITER] = [process.argv[2], process.argv[3], +(process.argv[4] || 12)];
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(inGlb);
const prim = doc.getRoot().listMeshes()[0].listPrimitives()[0];
const P = prim.getAttribute('POSITION'), idx = prim.getIndices().getArray(), n = P.getCount();
const pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const v = P.getElement(i, []); pos.set(v, i * 3); }
// model is turned -90° about Y in the viewer: world x = -z_local... use world = rotY(-90°): (x,y,z) -> (-z, y, x)
const W = i => [-pos[i*3+2], pos[i*3+1], pos[i*3]];
let minY = 1e9, maxY = -1e9, minX = 1e9, maxX = -1e9; for (let i = 0; i < n; i++) { const w = W(i); minY = Math.min(minY, w[1]); maxY = Math.max(maxY, w[1]); minX = Math.min(minX, w[0]); maxX = Math.max(maxX, w[0]); }
const H = maxY - minY, cx = (minX + maxX) / 2;
// the face on screen: y from ~31% to ~47% of the height from the top (eyes to mouth), x within ±19% of the height of centre
const yTop = maxY - 0.30 * H, yBot = maxY - 0.475 * H, xHalf = 0.19 * H;
// seam copies: vertices at the same spot are one point (grouped by position), so a smoothed seam stays closed
const key = i => `${Math.round(pos[i*3]*1e5)},${Math.round(pos[i*3+1]*1e5)},${Math.round(pos[i*3+2]*1e5)}`;
const gOf = new Int32Array(n), groups = new Map(); let G = 0;
for (let i = 0; i < n; i++) { const k = key(i); let g = groups.get(k); if (g === undefined) { g = G++; groups.set(k, g); } gOf[i] = g; }
const members = Array.from({ length: G }, () => []); for (let i = 0; i < n; i++) members[gOf[i]].push(i);
const nbG = Array.from({ length: G }, () => new Set());
for (let t = 0; t < idx.length; t += 3) { const a = gOf[idx[t]], b = gOf[idx[t+1]], c = gOf[idx[t+2]]; nbG[a].add(b).add(c); nbG[b].add(a).add(c); nbG[c].add(a).add(b); }
for (let g = 0; g < G; g++) nbG[g].delete(g);
console.log('points', G);
// weight: inside the face box and on the front half (largest local-x = world z toward camera)
let maxZ = -1e9; for (let i = 0; i < n; i++) maxZ = Math.max(maxZ, W(i)[2]);
const wgt = new Float32Array(n); let cnt = 0;
for (let i = 0; i < n; i++) { const [x, y, z] = W(i);
  const fy = Math.min(1, Math.max(0, Math.min((yTop - y), (y - yBot)) / (0.02 * H)));
  const fx = Math.min(1, Math.max(0, (xHalf - Math.abs(x - cx)) / (0.03 * H)));
  const fz = Math.min(1, Math.max(0, (z - (maxZ - 0.16 * H)) / (0.04 * H)));
  wgt[i] = fy * fx * fz; if (wgt[i] > 0) cnt++; }
console.log('vertices', n, 'in face', cnt);
const gp = new Float32Array(G * 3), gw = new Float32Array(G);
for (let g = 0; g < G; g++) { const i = members[g][0]; gp.set(pos.subarray(i*3, i*3+3), g*3); gw[g] = Math.max(...members[g].map(m => wgt[m])); }
for (let it = 0; it < ITER; it++) { const nxt = gp.slice();
  for (let g = 0; g < G; g++) { if (!gw[g]) continue; let sx = 0, sy = 0, sz = 0, k = 0;
    for (const h of nbG[g]) { sx += gp[h*3]; sy += gp[h*3+1]; sz += gp[h*3+2]; k++; }
    if (!k) continue; const w = 0.6 * gw[g];
    nxt[g*3] += w * (sx/k - gp[g*3]); nxt[g*3+1] += w * (sy/k - gp[g*3+1]); nxt[g*3+2] += w * (sz/k - gp[g*3+2]); }
  gp.set(nxt); }
for (let i = 0; i < n; i++) pos.set(gp.subarray(gOf[i]*3, gOf[i]*3+3), i*3);
for (let i = 0; i < n; i++) P.setElement(i, [pos[i*3], pos[i*3+1], pos[i*3+2]]);
// recompute normals for the smoothed area
const N = prim.getAttribute('NORMAL'); if (N) { const acc = new Float32Array(n * 3);
  for (let t = 0; t < idx.length; t += 3) { const a = idx[t], b = idx[t+1], c = idx[t+2];
    const ax = pos[a*3], ay = pos[a*3+1], az = pos[a*3+2], ux = pos[b*3]-ax, uy = pos[b*3+1]-ay, uz = pos[b*3+2]-az, vx = pos[c*3]-ax, vy = pos[c*3+1]-ay, vz = pos[c*3+2]-az;
    const nx = uy*vz-uz*vy, ny = uz*vx-ux*vz, nz = ux*vy-uy*vx; for (const v of [a,b,c]) { acc[v*3] += nx; acc[v*3+1] += ny; acc[v*3+2] += nz; } }
  const ga = new Float32Array(G * 3); for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) ga[gOf[i]*3+c] += acc[i*3+c];
  for (let i = 0; i < n; i++) { if (!gw[gOf[i]]) continue; const g = gOf[i], l = Math.hypot(ga[g*3], ga[g*3+1], ga[g*3+2]) || 1; N.setElement(i, [ga[g*3]/l, ga[g*3+1]/l, ga[g*3+2]/l]); } }
await io.write(outGlb, doc); console.log('written');
