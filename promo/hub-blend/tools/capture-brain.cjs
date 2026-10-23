/* Dr. Smiley's brain for the Ask shot, captured from the app's own page (brain/index.html and
   brain/data.json): its nodes, fibre lines and racing signals exactly as the app draws them.
   The page's clock is stepped from here (a frame every 1/30 s, deterministic), the brain is
   turned by a steady drag (the way a finger turns it), and everything but the 3D and two region
   names is hidden ("Safe first moves", "Startup path"). On black, to be laid over the reel with
   an additive blend, so black is see-through.
   node promo/hub-blend/tools/capture-brain.cjs  ->  promo/hub-blend/assets/brain/NN.webp, frames.json */
const path = require('path'), fs = require('fs'), http = require('http'), { execFileSync } = require('child_process');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const ROOT = path.resolve(__dirname, '../../..'), OUT = path.resolve(__dirname, '../assets/brain');
const N = +(process.env.FRAMES || 40), VW = 720, VH = 840, TURN_PX = +(process.env.TURN_PX || 3.4);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png' };
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = http.createServer((q, r) => {
    const f = path.join(ROOT, decodeURIComponent(new URL(q.url, 'http://x').pathname));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  }).listen(0);
  const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1.5 });
  await page.addInitScript(() => {
    // the page's own clock, stepped from outside
    let T = 1000; const queue = [];
    performance.now = () => T;
    window.requestAnimationFrame = (cb) => { queue.push(cb); return queue.length; };
    window.__step = (dt) => { T += dt * 1000; const run = queue.splice(0); run.forEach((f) => f(T)); };
  });
  await page.goto(`http://localhost:${server.address().port}/brain/index.html`);
  await page.waitForFunction(() => document.querySelectorAll('#labels .lbl.region').length > 0, null, { timeout: 60000 });
  await page.addStyleTag({ content: `
    html,body,#scan{background:#000!important} .hud,#workup,.close-brain,#tip,.lbl.orient,.lbl.node{display:none!important}
    .lbl.region{font-size:15px!important}` });
  await page.evaluate(() => document.querySelectorAll('#labels .lbl.region').forEach((el) => {
    const t = el.textContent.toLowerCase();
    if (!t.includes('safe first moves') && !t.includes('startup path')) el.style.display = 'none';
  }));
  for (let i = 0; i < 20; i++) await page.evaluate(() => window.__step(1 / 30)); // let the signals get going
  const box = await page.locator('#stage').boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy); await page.mouse.down();
  const frames = [];
  for (let i = 0; i < N; i++) {
    await page.mouse.move(cx - (i + 1) * TURN_PX, cy); // a steady turn
    await page.evaluate(() => window.__step(1 / 30));
    const png = path.join(OUT, `${String(i).padStart(2, '0')}.png`);
    await page.screenshot({ path: png });
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-c:v', 'libwebp', '-quality', '86', png.replace('.png', '.webp')]);
    fs.unlinkSync(png);
    frames.push(path.basename(png).replace('.png', '.webp'));
  }
  await page.mouse.up();
  fs.writeFileSync(path.join(OUT, 'frames.json'), JSON.stringify({ size: [VW * 1.5, VH * 1.5], fps: 30, frames, source: 'brain/index.html, data.json (the app)' }, null, 1));
  console.log(OUT, frames.length, 'frames');
  await browser.close(); server.close();
})();
