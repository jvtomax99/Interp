// The campus's foliage pictures (Jose, 2026-11-07: trees "like the picture I gave you", in their own colours, "the leafs to have
// better graphics and more details"; then, from his iPhone, the leaves read as speckle, black specks at the edges, flat patches).
// Each picture is 768 px holding four different sprays (2 x 2), so neighbouring cards don't repeat one pattern. Each spray has
// 60-70 leaves big enough to read on a phone (not 300 tiny ones, which blur into noise). The see-through part around the leaves
// carries the leaves' own colour (alpha 12/255, under the cut-out; at 0 the WebP encoder drops the colour), so shrinking the picture for distant trees never bleeds black
// into the edges. Drawn on a canvas in headless Chromium, seeded: the same pictures every time. Needs playwright in ../node_modules.
//   node leaf_card.cjs   then   node meshy_bake.cjs
//   leaf-green.webp   pointed leaves, each filled from Meshy's painted leaves (../assets/meshy-tree/leaf-source.png, a render of
//                     its 7.7 million triangle tree) with its own hue, a midrib and side veins, darker at the base, a rim of light
//   leaf-red.webp     the same leaves in autumn red and orange (the red trees)
//   petal-pink.webp   sakura petals, notched, deep pink at the base to pale at the tip, faint veins, little flowers and buds
const fs = require('fs'), path = require('path');
const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright'));
const DIR = path.join(__dirname, '..', 'assets', 'meshy-tree');
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  const uri = 'data:image/png;base64,' + fs.readFileSync(path.join(DIR, 'leaf-source.png')).toString('base64');
  const out = await p.evaluate(async uri => {
    const src = await new Promise((r, e) => { const i = new Image(); i.onload = () => r(i); i.onerror = e; i.src = uri; });
    const S = 768, Q = S/2, C = Q/2;   // the picture, one spray's square, its middle
    const seeded = n => { let s = n; return () => (s = (s*16807) % 2147483647)/2147483647; };
    // each spray stays inside a circle in its square; around the leaves, their colour carried out (blurred) at alpha 1
    const finish = g => {
      const d = g.getImageData(0, 0, S, S), px = d.data, n = S*S;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++){ const cx = (x % Q) - C, cy = (y % Q) - C; if (Math.hypot(cx, cy)/C > 0.97) px[(y*S + x)*4 + 3] = 0; }
      const cr = new Float32Array(n), cg = new Float32Array(n), cb = new Float32Array(n), ca = new Float32Array(n);
      for (let i = 0; i < n; i++){ const a = px[i*4 + 3] > 115 ? 1 : 0; ca[i] = a; cr[i] = px[i*4]*a; cg[i] = px[i*4 + 1]*a; cb[i] = px[i*4 + 2]*a; }
      const box = (arr, rad) => { const t = new Float32Array(n);
        for (let y = 0; y < S; y++){ let s = 0; for (let x = -rad; x <= rad; x++) s += arr[y*S + Math.min(S - 1, Math.max(0, x))];
          for (let x = 0; x < S; x++){ t[y*S + x] = s; s += arr[y*S + Math.min(S - 1, x + rad + 1)] - arr[y*S + Math.max(0, x - rad)]; } }
        for (let x = 0; x < S; x++){ let s = 0; for (let y = -rad; y <= rad; y++) s += t[Math.min(S - 1, Math.max(0, y))*S + x];
          for (let y = 0; y < S; y++){ arr[y*S + x] = s; s += t[Math.min(S - 1, y + rad + 1)*S + x] - t[Math.max(0, y - rad)*S + x]; } } };
      for (const rad of [3, 9, 24]){ const r2 = Float32Array.from(cr), g2 = Float32Array.from(cg), b2 = Float32Array.from(cb), a2 = Float32Array.from(ca);
        [r2, g2, b2, a2].forEach(arr => box(arr, rad));
        for (let i = 0; i < n; i++) if (px[i*4 + 3] <= 115 && px[i*4 + 3] !== 12 && a2[i] > 0.01){ px[i*4] = r2[i]/a2[i]; px[i*4 + 1] = g2[i]/a2[i]; px[i*4 + 2] = b2[i]/a2[i]; px[i*4 + 3] = Math.max(px[i*4 + 3], 12); } }
      for (let i = 0; i < n; i++) if (px[i*4 + 3] === 0){ px[i*4] = 60; px[i*4 + 1] = 90; px[i*4 + 2] = 50; px[i*4 + 3] = 12; }
      g.putImageData(d, 0, 0); };
    // ---- leaves: back to front, the inner ones darker; hue sets the season
    const leaves = (hue, sat, light, seed) => {
      const R = seeded(seed), c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
      const leaf = (x, y, L, rot, shade) => {
        const W = L*(0.46 + R()*0.1), bend = (R() - 0.5)*L*0.1;
        g.save(); g.translate(x, y); g.rotate(rot);
        g.beginPath(); g.moveTo(0, 0);
        g.bezierCurveTo(W*0.9, L*0.1, W*0.78 + bend, L*0.62, bend, L);   // pointed at the tip
        g.bezierCurveTo(-W*0.78 + bend, L*0.62, -W*0.9, L*0.1, 0, 0); g.closePath();
        g.save(); g.clip();
        g.filter = `hue-rotate(${(hue + (R() - 0.5)*24).toFixed(0)}deg) saturate(${sat.toFixed(2)}) brightness(${(shade*light).toFixed(2)}) contrast(1.1)`;
        g.drawImage(src, 570 + R()*300, 110 + R()*300, 150, 150, -L*0.6, -L*0.05, L*1.2, L*1.2);
        g.filter = 'none';
        const base = g.createLinearGradient(0, 0, 0, L); base.addColorStop(0, 'rgba(0,0,0,0.2)'); base.addColorStop(0.4, 'rgba(0,0,0,0)'); base.addColorStop(1, 'rgba(255,255,210,0.16)');
        g.fillStyle = base; g.fillRect(-W, 0, W*2, L);
        const fold = g.createLinearGradient(-W/2, 0, W/2, 0); fold.addColorStop(0, 'rgba(255,255,255,0.14)'); fold.addColorStop(0.5, 'rgba(255,255,255,0)'); fold.addColorStop(0.52, 'rgba(0,0,0,0.12)'); fold.addColorStop(1, 'rgba(0,0,0,0.02)');
        g.fillStyle = fold; g.fillRect(-W, 0, W*2, L);
        g.strokeStyle = `rgba(255,255,225,${(0.22*shade).toFixed(2)})`; g.lineWidth = Math.max(1, L*0.016);   // side veins
        for (let k = 1; k <= 4; k++){ const t = k/5.2, vy = L*t, vx = bend*t*0.5;
          for (const sd of [-1, 1]){ g.beginPath(); g.moveTo(vx, vy); g.quadraticCurveTo(vx + sd*W*0.25, vy + L*0.05, vx + sd*W*0.42*(1 - t*0.5), vy + L*0.13); g.stroke(); } }
        g.restore();
        g.strokeStyle = `rgba(255,255,225,${(0.3*shade).toFixed(2)})`; g.lineWidth = Math.max(1.4, L*0.028); g.stroke();   // the rim catching light
        g.strokeStyle = `rgba(255,255,225,${(0.3*shade).toFixed(2)})`; g.lineWidth = Math.max(1.2, L*0.024);   // the midrib
        g.beginPath(); g.moveTo(0, 2); g.quadraticCurveTo(bend*0.4, L*0.5, bend, L*0.95); g.stroke();
        g.restore(); };
      for (let v = 0; v < 4; v++){ const ox = (v % 2)*Q + C, oy = Math.floor(v/2)*Q + C, N = 62 + v*3;
        for (let i = 0; i < N; i++){ const t = i/N, a = R()*Math.PI*2, d = Math.sqrt(R())*C*(0.62 + t*0.2);
          leaf(ox + Math.cos(a)*d, oy + Math.sin(a)*d, 58 + R()*30, a - Math.PI/2 + (R() - 0.5)*1.5, 0.72 + t*0.38 + (R() - 0.5)*0.12); }
        for (let k = 0; k < 9; k++) leaf(ox + (R() - 0.5)*C*0.5, oy + (R() - 0.5)*C*0.5, 54 + R()*22, R()*Math.PI*2, 0.95 + R()*0.15); }
      finish(g); return c.toDataURL('image/webp', 0.76); };
    // ---- sakura petals, with whole flowers and buds on top
    const petals = seed => {
      const R = seeded(seed), c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
      const shape = (len, wid) => { g.beginPath(); g.moveTo(0, 0);
        g.bezierCurveTo(wid, len*0.15, wid*1.05, len*0.78, wid*0.32, len);   // the notch at its tip, as cherry petals have
        g.lineTo(0, len*0.86); g.lineTo(-wid*0.32, len);
        g.bezierCurveTo(-wid*1.05, len*0.78, -wid, len*0.15, 0, 0); g.closePath(); };
      const petal = (x, y, L, rot, shade) => {
        const h = 336 + (R() - 0.5)*14, l0 = 56 + shade*12, l1 = 84 + shade*9;
        g.save(); g.translate(x, y); g.rotate(rot); shape(L, L*0.52);
        const pg = g.createLinearGradient(0, 0, 0, L); pg.addColorStop(0, `hsl(${h}, 76%, ${l0}%)`); pg.addColorStop(0.5, `hsl(${h + 6}, 88%, ${l1 - 6}%)`); pg.addColorStop(1, `hsl(${h + 12}, 100%, ${Math.min(97, l1 + 6)}%)`);
        g.fillStyle = pg; g.fill();
        g.save(); g.clip(); g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 1.3;   // faint veins
        for (const sx of [-0.22, 0, 0.22]){ g.beginPath(); g.moveTo(0, L*0.08); g.quadraticCurveTo(sx*L*0.6, L*0.5, sx*L*0.9, L*0.95); g.stroke(); }
        g.restore();
        g.strokeStyle = `rgba(200,80,130,${(0.32 - shade*0.12).toFixed(2)})`; g.lineWidth = 1.4; g.stroke();
        g.restore(); };
      const flower = (x, y, rad, rot) => { g.save(); g.translate(x, y); g.rotate(rot);
        for (let k = 0; k < 5; k++){ g.save(); g.rotate(k/5*Math.PI*2); shape(rad, rad*0.52);
          const fg = g.createLinearGradient(0, 0, 0, rad); fg.addColorStop(0, 'hsl(335, 78%, 64%)'); fg.addColorStop(0.5, 'hsl(342, 90%, 85%)'); fg.addColorStop(1, 'hsl(350, 100%, 95%)');
          g.fillStyle = fg; g.fill(); g.strokeStyle = 'rgba(200,80,130,0.3)'; g.lineWidth = 1.2; g.stroke(); g.restore(); }
        g.fillStyle = 'hsl(335, 72%, 48%)'; g.beginPath(); g.arc(0, 0, rad*0.2, 0, Math.PI*2); g.fill();
        for (let k = 0; k < 9; k++){ const a = k/9*Math.PI*2 + R()*0.3, L = rad*(0.38 + R()*0.12);
          g.strokeStyle = 'rgba(200,70,110,0.85)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a)*L, Math.sin(a)*L); g.stroke();
          g.fillStyle = '#f7d56e'; g.beginPath(); g.arc(Math.cos(a)*L, Math.sin(a)*L, Math.max(1.6, rad*0.06), 0, Math.PI*2); g.fill(); }
        g.restore(); };
      for (let v = 0; v < 4; v++){ const ox = (v % 2)*Q + C, oy = Math.floor(v/2)*Q + C, N = 66 + v*3;
        for (let i = 0; i < N; i++){ const t = i/N, a = R()*Math.PI*2, d = Math.sqrt(R())*C*(0.64 + t*0.18);
          petal(ox + Math.cos(a)*d, oy + Math.sin(a)*d, 50 + R()*24, a - Math.PI/2 + (R() - 0.5)*1.8, t*0.9 + (R() - 0.5)*0.2); }
        for (let k = 0; k < 4; k++){ const a = R()*Math.PI*2, d = Math.sqrt(R())*C*0.5;
          g.save(); g.translate(ox + Math.cos(a)*d, oy + Math.sin(a)*d); g.rotate(R()*Math.PI*2); g.fillStyle = 'hsl(338, 74%, 64%)';
          g.beginPath(); g.ellipse(0, 0, 9, 15, 0, 0, Math.PI*2); g.fill(); g.restore(); }
        for (let k = 0; k < 5; k++){ const a = R()*Math.PI*2, d = Math.sqrt(R())*C*0.58; flower(ox + Math.cos(a)*d, oy + Math.sin(a)*d, 34 + R()*12, R()*Math.PI*2); } }
      finish(g); return c.toDataURL('image/webp', 0.76); };
    return { 'leaf-green': leaves(0, 1.1, 1.55, 7), 'leaf-red': leaves(-78, 1.45, 1.45, 9), 'petal-pink': petals(23) }; }, uri);
  for (const [k, v] of Object.entries(out)){ const f = path.join(DIR, `${k}.webp`); fs.writeFileSync(f, Buffer.from(v.split(',')[1], 'base64')); console.log(`${k}.webp`, fs.statSync(f).size, 'bytes'); }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
