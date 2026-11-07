// The campus's leaf spray (Jose, 2026-11-07, "more like real trees"): a cut-out sprig of individual leaves on twigs, each leaf
// filled from Meshy's painted leaves (../assets/meshy-tree/leaf-source.png, a render of its 7.7 million triangle tree). Gray,
// so each tree's own colour tints it: meshy.js builds every crown from it. The stream of random numbers is seeded, so the same
// spray comes out every time. Needs playwright in ../node_modules.   node leaf_card.cjs   then   node meshy_bake.cjs
const fs = require('fs'), path = require('path');
const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright'));
const DIR = path.join(__dirname, '..', 'assets', 'meshy-tree');
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  const uri = 'data:image/png;base64,' + fs.readFileSync(path.join(DIR, 'leaf-source.png')).toString('base64');
  const out = await p.evaluate(async uri => {
    const src = await new Promise((r, e) => { const i = new Image(); i.onload = () => r(i); i.onerror = e; i.src = uri; });
    let seed = 7; const R = () => (seed = (seed*16807) % 2147483647)/2147483647;
    const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
    const leaf = (x, y, L, rot, shade) => {
      const W = L*(0.38 + R()*0.12); g.save(); g.translate(x, y); g.rotate(rot);
      const bend = (R() - 0.5)*L*0.12;
      g.beginPath(); g.moveTo(0, 0);
      g.bezierCurveTo(W*0.75, L*0.12, W*0.62 + bend, L*0.68, bend, L);
      g.bezierCurveTo(-W*0.62 + bend, L*0.68, -W*0.75, L*0.12, 0, 0); g.closePath();
      g.save(); g.clip();
      g.filter = `grayscale(1) brightness(${(shade*1.75).toFixed(2)}) contrast(1.25)`;   // a different part of the painting for each leaf
      g.drawImage(src, 570 + R()*300, 110 + R()*300, 150, 150, -L*0.6, -L*0.05, L*1.2, L*1.2);
      g.filter = 'none';
      const lg = g.createLinearGradient(-W/2, 0, W/2, 0);   // light on one half, as a leaf folds along its midrib
      lg.addColorStop(0, 'rgba(255,255,255,0.13)'); lg.addColorStop(0.5, 'rgba(255,255,255,0)'); lg.addColorStop(0.52, 'rgba(0,0,0,0.13)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = lg; g.fillRect(-W, 0, W*2, L); g.restore();
      g.strokeStyle = `rgba(255,255,255,${0.16*shade})`; g.lineWidth = Math.max(1, L*0.018); g.beginPath(); g.moveTo(0, 2); g.quadraticCurveTo(bend*0.4, L*0.5, bend, L*0.96); g.stroke();
      g.restore(); };
    const N = 95;   // back to front: dark inner leaves first, bright outer ones last, each pointing away from the middle
    for (let i = 0; i < N; i++){ const t = i/N, a = R()*Math.PI*2, d = Math.sqrt(R())*(92 + t*80);
      leaf(S/2 + Math.cos(a)*d, S/2 + Math.sin(a)*d*0.92, 62 + R()*38, a - Math.PI/2 + (R() - 0.5)*1.2, 0.5 + t*0.42 + (R() - 0.5)*0.14); }
    g.globalCompositeOperation = 'destination-over'; g.strokeStyle = 'rgb(70,70,70)'; g.lineCap = 'round';   // twigs behind the leaves
    for (let i = 0; i < 7; i++){ const a = i/7*Math.PI*2 + R(); g.lineWidth = 5; g.beginPath(); g.moveTo(S/2, S/2); g.quadraticCurveTo(S/2 + Math.cos(a + 0.4)*90, S/2 + Math.sin(a + 0.4)*90, S/2 + Math.cos(a)*170, S/2 + Math.sin(a)*170); g.stroke(); }
    const d = g.getImageData(0, 0, S, S);   // nothing reaches the card's edge, so no card shows a straight side
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (Math.hypot(x - S/2, y - S/2)/(S/2) > 0.985) d.data[(y*S + x)*4 + 3] = 0;
    g.putImageData(d, 0, 0);
    return c.toDataURL('image/webp', 0.8); }, uri);
  const f = path.join(DIR, 'leaf-card.webp'); fs.writeFileSync(f, Buffer.from(out.split(',')[1], 'base64'));
  console.log('leaf-card.webp', fs.statSync(f).size, 'bytes'); await b.close();
})().catch(e => { console.error(e); process.exit(1); });
