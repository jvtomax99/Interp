// The campus's foliage pictures (Jose, 2026-11-07: trees "like the picture I gave you", in their own colours, "the leafs to have
// better graphics and more details"). Each is a dense round mass of cut-out leaves or petals for one card of a tree's crown,
// 768 px, drawn on a canvas in headless Chromium and seeded, so the same pictures come out every time. In colour: the tree's
// material only lightens or darkens it by where the card sits. Needs playwright in ../node_modules.
//   node leaf_card.cjs   then   node meshy_bake.cjs
//   leaf-green.webp   pointed leaves, each filled from Meshy's painted leaves (../assets/meshy-tree/leaf-source.png, a render of
//                     its 7.7 million triangle tree) with its own hue, a midrib and side veins, darker at the base, a rim of light
//   leaf-red.webp     the same leaves in autumn red and orange (the red trees)
//   petal-pink.webp   sakura petals, notched, deep pink at the base to pale at the tip, faint veins, with little five-petal flowers
//                     and buds among them (every cherry, the one by Don Imus included)
const fs = require('fs'), path = require('path');
const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright'));
const DIR = path.join(__dirname, '..', 'assets', 'meshy-tree');
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  const uri = 'data:image/png;base64,' + fs.readFileSync(path.join(DIR, 'leaf-source.png')).toString('base64');
  const out = await p.evaluate(async uri => {
    const src = await new Promise((r, e) => { const i = new Image(); i.onload = () => r(i); i.onerror = e; i.src = uri; });
    const S = 768, C = S/2;
    const card = () => { const c = document.createElement('canvas'); c.width = c.height = S; return [c, c.getContext('2d')]; };
    const seeded = n => { let s = n; return () => (s = (s*16807) % 2147483647)/2147483647; };
    const edge = g => { const d = g.getImageData(0, 0, S, S);   // nothing reaches the card's edge: no card shows a straight side
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (Math.hypot(x - C, y - C)/C > 0.985) d.data[(y*S + x)*4 + 3] = 0;
      g.putImageData(d, 0, 0); };
    // ---- leaves: back to front, the inner ones darker; hue sets the season
    const leaves = (hue, sat, seed) => {
      const R = seeded(seed), [c, g] = card();
      const leaf = (x, y, L, rot, shade) => {
        const W = L*(0.46 + R()*0.1), bend = (R() - 0.5)*L*0.1;
        g.save(); g.translate(x, y); g.rotate(rot);
        g.beginPath(); g.moveTo(0, 0);
        g.bezierCurveTo(W*0.9, L*0.1, W*0.78 + bend, L*0.62, bend, L);   // pointed at the tip
        g.bezierCurveTo(-W*0.78 + bend, L*0.62, -W*0.9, L*0.1, 0, 0); g.closePath();
        g.save(); g.clip();
        g.filter = `hue-rotate(${(hue + (R() - 0.5)*26).toFixed(0)}deg) saturate(${sat.toFixed(2)}) brightness(${(shade*1.25).toFixed(2)}) contrast(1.15)`;
        g.drawImage(src, 570 + R()*300, 110 + R()*300, 150, 150, -L*0.6, -L*0.05, L*1.2, L*1.2);
        g.filter = 'none';
        const base = g.createLinearGradient(0, 0, 0, L); base.addColorStop(0, 'rgba(0,0,0,0.28)'); base.addColorStop(0.4, 'rgba(0,0,0,0)'); base.addColorStop(1, 'rgba(255,255,220,0.12)');
        g.fillStyle = base; g.fillRect(-W, 0, W*2, L);
        const fold = g.createLinearGradient(-W/2, 0, W/2, 0); fold.addColorStop(0, 'rgba(255,255,255,0.12)'); fold.addColorStop(0.5, 'rgba(255,255,255,0)'); fold.addColorStop(0.52, 'rgba(0,0,0,0.14)'); fold.addColorStop(1, 'rgba(0,0,0,0.02)');
        g.fillStyle = fold; g.fillRect(-W, 0, W*2, L);
        g.strokeStyle = `rgba(255,255,230,${(0.18*shade).toFixed(2)})`; g.lineWidth = Math.max(0.8, L*0.012);   // side veins
        for (let k = 1; k <= 4; k++){ const t = k/5.2, vy = L*t, vx = bend*t*0.5;
          for (const sd of [-1, 1]){ g.beginPath(); g.moveTo(vx, vy); g.quadraticCurveTo(vx + sd*W*0.25, vy + L*0.05, vx + sd*W*0.42*(1 - t*0.5), vy + L*0.13); g.stroke(); } }
        g.restore();
        g.strokeStyle = `rgba(255,255,230,${(0.26*shade).toFixed(2)})`; g.lineWidth = Math.max(1, L*0.022); g.stroke();   // the rim catching light
        g.strokeStyle = `rgba(255,255,230,${(0.24*shade).toFixed(2)})`; g.lineWidth = Math.max(1, L*0.02);   // the midrib
        g.beginPath(); g.moveTo(0, 2); g.quadraticCurveTo(bend*0.4, L*0.5, bend, L*0.95); g.stroke();
        g.restore(); };
      const N = 320;
      for (let i = 0; i < N; i++){ const t = i/N, a = R()*Math.PI*2, d = Math.sqrt(R())*(C*0.8 + t*C*0.12);
        leaf(C + Math.cos(a)*d, C + Math.sin(a)*d, 46 + R()*30, a - Math.PI/2 + (R() - 0.5)*1.5, 0.55 + t*0.5 + (R() - 0.5)*0.14); }
      edge(g); return c.toDataURL('image/webp', 0.8); };
    // ---- sakura petals, with a few whole flowers and buds on top
    const petals = seed => {
      const R = seeded(seed), [c, g] = card();
      const shape = (len, wid) => { g.beginPath(); g.moveTo(0, 0);
        g.bezierCurveTo(wid, len*0.15, wid*1.05, len*0.78, wid*0.32, len);   // the notch at its tip, as cherry petals have
        g.lineTo(0, len*0.86); g.lineTo(-wid*0.32, len);
        g.bezierCurveTo(-wid*1.05, len*0.78, -wid, len*0.15, 0, 0); g.closePath(); };
      const petal = (x, y, L, rot, shade) => {
        const h = 336 + (R() - 0.5)*14, l0 = 52 + shade*12, l1 = 84 + shade*10;
        g.save(); g.translate(x, y); g.rotate(rot); shape(L, L*0.5);
        const pg = g.createLinearGradient(0, 0, 0, L); pg.addColorStop(0, `hsl(${h}, 76%, ${l0}%)`); pg.addColorStop(0.5, `hsl(${h + 6}, 88%, ${l1 - 6}%)`); pg.addColorStop(1, `hsl(${h + 12}, 100%, ${Math.min(97, l1 + 6)}%)`);
        g.fillStyle = pg; g.fill();
        g.save(); g.clip(); g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 1;   // faint veins
        for (const sx of [-0.22, 0, 0.22]){ g.beginPath(); g.moveTo(0, L*0.08); g.quadraticCurveTo(sx*L*0.6, L*0.5, sx*L*0.9, L*0.95); g.stroke(); }
        g.restore();
        g.strokeStyle = `rgba(190,60,115,${(0.4 - shade*0.15).toFixed(2)})`; g.lineWidth = 1.2; g.stroke();
        g.restore(); };
      const flower = (x, y, rad, rot) => { g.save(); g.translate(x, y); g.rotate(rot);
        for (let k = 0; k < 5; k++){ g.save(); g.rotate(k/5*Math.PI*2); shape(rad, rad*0.5);
          const fg = g.createLinearGradient(0, 0, 0, rad); fg.addColorStop(0, 'hsl(335, 78%, 62%)'); fg.addColorStop(0.5, 'hsl(342, 90%, 84%)'); fg.addColorStop(1, 'hsl(350, 100%, 95%)');
          g.fillStyle = fg; g.fill(); g.strokeStyle = 'rgba(200,80,130,0.35)'; g.lineWidth = 1; g.stroke(); g.restore(); }
        g.fillStyle = 'hsl(335, 72%, 46%)'; g.beginPath(); g.arc(0, 0, rad*0.2, 0, Math.PI*2); g.fill();
        for (let k = 0; k < 9; k++){ const a = k/9*Math.PI*2 + R()*0.3, L = rad*(0.38 + R()*0.12);
          g.strokeStyle = 'rgba(200,70,110,0.85)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a)*L, Math.sin(a)*L); g.stroke();
          g.fillStyle = '#f7d56e'; g.beginPath(); g.arc(Math.cos(a)*L, Math.sin(a)*L, Math.max(1.4, rad*0.05), 0, Math.PI*2); g.fill(); }
        g.restore(); };
      const N = 330;
      for (let i = 0; i < N; i++){ const t = i/N, a = R()*Math.PI*2, d = Math.sqrt(R())*(C*0.82 + t*C*0.1);
        petal(C + Math.cos(a)*d, C + Math.sin(a)*d, 40 + R()*22, a - Math.PI/2 + (R() - 0.5)*1.8, t*0.9 + (R() - 0.5)*0.2); }
      for (let k = 0; k < 10; k++){ const a = R()*Math.PI*2, d = Math.sqrt(R())*C*0.62;
        g.save(); g.translate(C + Math.cos(a)*d, C + Math.sin(a)*d); g.rotate(R()*Math.PI*2); g.fillStyle = 'hsl(338, 74%, 64%)';
        g.beginPath(); g.ellipse(0, 0, 7, 12, 0, 0, Math.PI*2); g.fill(); g.restore(); }
      for (let k = 0; k < 16; k++){ const a = R()*Math.PI*2, d = Math.sqrt(R())*C*0.7; flower(C + Math.cos(a)*d, C + Math.sin(a)*d, 26 + R()*10, R()*Math.PI*2); }
      edge(g); return c.toDataURL('image/webp', 0.8); };
    return { 'leaf-green': leaves(0, 1.05, 7), 'leaf-red': leaves(-78, 1.45, 9), 'petal-pink': petals(23) }; }, uri);
  for (const [k, v] of Object.entries(out)){ const f = path.join(DIR, `${k}.webp`); fs.writeFileSync(f, Buffer.from(v.split(',')[1], 'base64')); console.log(`${k}.webp`, fs.statSync(f).size, 'bytes'); }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
