/* A short preview clip of a test page, frame by frame (for ideas, before
   they go into the reel). The page sets window.__renderAt(t).
   node promo/hub-blend/tools/clip.cjs "tools/opener-lab.html?idea=prism" out/opener-prism.mp4 5
   Captures the page (canvas and any text over it) at 540x960, 30 fps. */
const path = require('path'), fs = require('fs'), http = require('http'), { spawn } = require('child_process');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const PROJ = path.resolve(__dirname, '..');
const [pageRel, outRel, secs = '5'] = process.argv.slice(2);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.woff2': 'font/woff2' };
(async () => {
  const server = http.createServer((q, r) => {
    const f = path.join(PROJ, decodeURIComponent(new URL(q.url, 'http://x').pathname));
    if (!f.startsWith(PROJ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  }).listen(0);
  const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://localhost:${server.address().port}/${pageRel}`);
  await page.waitForFunction(() => document.title === 'ready', null, { timeout: 90000 });
  const out = path.resolve(PROJ, outRel); fs.mkdirSync(path.dirname(out), { recursive: true });
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', out]);
  const n = Math.round(+secs * 30);
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => window.__renderAt(t), i / 30);
    ff.stdin.write(await page.screenshot({ type: 'png' }));
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  if (errs.length) console.log('errors:', errs.slice(0, 4).join('\n'));
  console.log(out);
  await browser.close(); server.close();
})();
