/* Stills of a composition at chosen times, without a full render: serves
   this project folder the way HyperFrames does, waits for the build, seeks.
   node promo/hub-blend/tools/stills.cjs remake.html out/stills 0.5 1.8 ...
   Writes <outdir>/<time>.png and a contact sheet <outdir>/sheet.jpg. */
const path = require('path'), fs = require('fs'), http = require('http');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const PROJ = path.resolve(__dirname, '..');
const [page0, outRel, ...times] = process.argv.slice(2);
const OUT = path.resolve(PROJ, outRel);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.woff2': 'font/woff2', '.m4a': 'audio/mp4' };
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = http.createServer((q, r) => {
    const f = path.join(PROJ, decodeURIComponent(new URL(q.url, 'http://x').pathname));
    if (!f.startsWith(PROJ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  }).listen(0);
  const html = fs.readFileSync(path.join(PROJ, page0), 'utf8');
  const w = +(html.match(/data-width="(\d+)"/) || [])[1], h = +(html.match(/data-height="(\d+)"/) || [])[1];
  const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(`http://localhost:${server.address().port}/${page0}`);
  await page.waitForFunction(() => typeof window.__renderAt === 'function', null, { timeout: 90000 });
  const files = [];
  for (const t of times) {
    await page.evaluate(t => window.__renderAt(t), +t);
    const f = path.join(OUT, `${(+t).toFixed(2)}.png`);
    await page.locator('#stage').screenshot({ path: f }); files.push([t, f]);
  }
  // contact sheet: a row of up to 8, the time on each
  const cols = Math.min(8, files.length), cw = 270, ch = Math.round(cw * h / w);
  const sheet = `<body style="margin:0;background:#000;display:grid;grid-template-columns:repeat(${cols},${cw}px)">` + files.map(([t, f]) =>
    `<div style="position:relative"><img src="file://${f}" style="width:${cw}px;display:block"><b style="position:absolute;left:4px;top:4px;color:#ff0;background:#000a;font:12px monospace;padding:1px 4px">${(+t).toFixed(2)}s</b></div>`).join('') + '</body>';
  const sp = await browser.newPage({ viewport: { width: cols * cw, height: 100 } });
  fs.writeFileSync(path.join(OUT, 'sheet.html'), sheet);
  await sp.goto('file://' + path.join(OUT, 'sheet.html')); await sp.waitForTimeout(400);
  await sp.screenshot({ path: path.join(OUT, 'sheet.jpg'), fullPage: true, type: 'jpeg', quality: 85 });
  fs.unlinkSync(path.join(OUT, 'sheet.html'));
  if (errs.length) console.log('errors:', errs.slice(0, 6).join('\n'));
  console.log('sheet:', path.join(OUT, 'sheet.jpg'));
  await browser.close(); server.close();
})();
