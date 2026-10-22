/* The campus hero shot: the app's own 3D campus (docs/mockups/cchi-city/
   entrance.html, the scene its pictures were rendered from), flown through
   with a moving camera while each building's windows light up.

     node promo/capture/campus.cjs              all frames -> public/renders/campus/
     node promo/capture/campus.cjs 0 60 119     just those frames (a check)

   Needs three.js beside the page once: cd docs/mockups/cchi-city &&
   npm i --no-save three@0.160.0. SwiftShader WebGL, a few seconds a frame. */
const fs = require('fs');
const path = require('path');
const http = require('http');
const L = require('../../tests/support/harness.cjs');

const DIR = path.join(__dirname, '..', '..', 'docs', 'mockups', 'cchi-city');
const OUT = path.join(__dirname, '..', 'public', 'renders', 'campus');
const FRAMES = 120; // the "cert" beat in src/hub-promo/timing.ts
const W = 1080, H = 1920;

// The move: high and wide over the drive, then pushing in and down toward
// the white tower. Easing without overshoot.
const ease = t => 1 - Math.pow(1 - t, 3);
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
function shot(n) {
  const t = ease(n / (FRAMES - 1));
  // Buildings light in turn, Terminology first (Dr. Smiley's tip in the app).
  const order = ['t', 'e', 'n', 'c', 's'];
  const lit = {};
  order.forEach((k, i) => { lit[k] = Math.max(0, Math.min(1, (n - 8 - i * 12) / 40)) * (k === 's' ? 0.6 : 1); });
  return {
    pos: mix([1.5, 26, 40], [3.0, 16, 22], t),
    look: mix([1.5, 2, -4], [1.0, 5, -9], t),
    fov: 60 - 8 * t,
    lit,
  };
}

(async () => {
  const want = process.argv.slice(2).map(Number);
  const frames = want.length ? want : [...Array(FRAMES).keys()];
  fs.mkdirSync(OUT, { recursive: true });
  const srv = http.createServer((q, r) => {
    const f = path.join(DIR, decodeURIComponent(q.url.split('?')[0]));
    if (!fs.existsSync(f)) { r.statusCode = 404; return r.end(); }
    r.setHeader('Content-Type', f.endsWith('.js') ? 'text/javascript' : f.endsWith('.png') ? 'image/png' : 'text/html');
    fs.createReadStream(f).pipe(r);
  }).listen(8128);
  const b = await L.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  p.on('pageerror', e => console.log('page error:', e.message));
  await p.goto(`http://localhost:8128/entrance.html?promo&w=${W}&h=${H}&pr=1`);
  await p.waitForFunction(() => window.__done && window.__promoFrame, null, { timeout: 120000 });
  for (const n of frames) {
    const t0 = Date.now();
    const url = await p.evaluate(f => window.__promoFrame(f), shot(n));
    fs.writeFileSync(path.join(OUT, `campus_${String(n).padStart(4, '0')}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
    if (n % 10 === 0 || want.length) console.log('frame', n, (Date.now() - t0) + ' ms');
  }
  await b.close(); srv.close();
})();
