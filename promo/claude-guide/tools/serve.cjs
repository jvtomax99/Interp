/* Opens a chapter page in headless Chromium, served from this folder, with its timeline built.
   Shared by stills.cjs and mix.cjs. */
const path = require('path'), fs = require('fs'), http = require('http');
const { chromium } = require('playwright');
const PROJ = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png',
  '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.wav': 'audio/wav', '.m4a': 'audio/mp4' };
async function open(chapter, scale = 0.5) {
  const server = http.createServer((q, r) => {
    const f = path.join(PROJ, decodeURIComponent(new URL(q.url, 'http://x').pathname));
    if (!f.startsWith(PROJ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  }).listen(0);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: scale });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await page.goto(`http://localhost:${server.address().port}/ch${chapter}.html`, { waitUntil: 'domcontentloaded' }); // "load" waits on the <audio>
  await page.evaluate(() => Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 5000))]));
  await page.waitForTimeout(400);
  return { page, errs, close: async () => { await browser.close(); server.close(); } };
}
module.exports = { open, PROJ };
