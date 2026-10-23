/* The brief's rule "no dark or empty phone screen in any frame", measured: in every feature
   frame, the phone's screen (window.__smileyCheck.screen, the director's projection of it) is
   read back from the 3D canvas; a screen that is dark (mean luma under 0.12) or empty (almost
   no variation) fails. Frames where the CoreCHI campus covers the phone are skipped.
   node promo/hub-blend/tools/check-screens.cjs [fps=5] */
const path = require('path'), fs = require('fs'), http = require('http');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const PROJ = path.resolve(__dirname, '..');
const FPS = +(process.argv[2] || 5);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.woff2': 'font/woff2', '.m4a': 'audio/mp4' };
(async () => {
  const server = http.createServer((q, r) => {
    const f = path.join(PROJ, decodeURIComponent(new URL(q.url, 'http://x').pathname));
    if (!f.startsWith(PROJ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  }).listen(0);
  const html = fs.readFileSync(path.join(PROJ, 'remake.html'), 'utf8');
  const W = +html.match(/data-width="(\d+)"/)[1], H = +html.match(/data-height="(\d+)"/)[1], D = +html.match(/data-duration="([\d.]+)"/)[1];
  const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const warns = []; page.on('console', m => { if (m.type() === 'warning') warns.push(m.text()); });
  await page.goto(`http://localhost:${server.address().port}/remake.html`);
  await page.waitForFunction(() => typeof window.__renderAt === 'function', null, { timeout: 120000 });
  let frames = 0, fails = 0, lo = Infinity;
  for (let i = 0; i <= D * FPS; i++) {
    const t = Math.min(D - 0.01, i / FPS);
    const r = await page.evaluate(t => {
      window.__renderAt(t);
      const c = window.__smileyCheck, q = c.screen;
      if (!q || (c.shot === 'cert' && t - 0 > 0 && document.querySelectorAll('canvas')[1].style.opacity > 0.5)) return null;
      const st = document.getElementById('stage'), W = st.width, H = st.height;
      const cv = window.__chk || (window.__chk = document.createElement('canvas')); cv.width = W; cv.height = H;
      const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(st, 0, 0);
      const d = g.getImageData(0, 0, W, H).data;
      const inside = (x, y) => { let k = false; for (let a = 0, b = 3; a < 4; b = a++) { const [xa, ya] = q[a], [xb, yb] = q[b]; if ((ya > y) !== (yb > y) && x < (xb - xa) * (y - ya) / (yb - ya) + xa) k = !k; } return k; };
      let n = 0, s = 0, s2 = 0;
      for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) if (inside(x, y)) {
        const o = (y * W + x) * 4, l = (0.2126 * d[o] + 0.7152 * d[o + 1] + 0.0722 * d[o + 2]) / 255; n++; s += l; s2 += l * l; }
      if (n < 50) return null;
      const m = s / n; return { shot: c.shot, mean: m, sd: Math.sqrt(Math.max(0, s2 / n - m * m)), n };
    }, t);
    if (!r) continue;
    frames++; lo = Math.min(lo, r.mean);
    if (r.mean < 0.12 || r.sd < 0.02) { fails++; console.log(`FAIL ${t.toFixed(2)}s ${r.shot}: mean ${r.mean.toFixed(3)} sd ${r.sd.toFixed(3)}`); }
  }
  console.log(`screen frames ${frames}, failing ${fails}, darkest mean ${lo.toFixed(3)}`);
  await browser.close(); server.close();
})();
