// Renders the reel: opens scene.html in a hidden Chromium, draws every frame,
// saves each as a JPEG, makes the sound (sound.py) and joins them with ffmpeg.
//   node render.cjs            full size, 1080 x 1920
//   node render.cjs preview    540 x 960, for a quick look
//   node render.cjs still 2.5 7  one picture per time given, still_<t>.jpg
//   node render.cjs v2 ...       the same for version 2, at HUMC
const http = require('http'), fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '../../..');
// "v2" first renders version 2 (scene-v2.html, timeline-v2.json, reel-v2.mp4).
const args = process.argv.slice(2), v2 = args[0] === 'v2'; if (v2) args.shift();
const SCENE = v2 ? 'scene-v2.html' : 'scene.html', TIMELINE = v2 ? 'timeline-v2.json' : 'timeline.json', SUFFIX = v2 ? '-v2' : '';
const mode = args[0] || 'full';
const [W, H] = mode === 'full' ? [1080, 1920] : [540, 960];
const TYPES = { '.jpg': 'image/jpeg', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };

const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise(ok => server.listen(0, ok));
  const url = `http://127.0.0.1:${server.address().port}/docs/mockups/smiley-reel/${SCENE}?w=${W}&h=${H}`;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 180000 });
  const grab = () => page.evaluate(() => document.querySelector('canvas').toDataURL('image/jpeg', 0.94).split(',')[1]);

  if (mode === 'still') {
    // node render.cjs still 1.5 3.6 ... : one picture per time, still_<t>.jpg
    for (const t of args.slice(1).map(Number)) {
      await page.evaluate(n => window.draw(n), Math.round(t * 30));
      fs.writeFileSync(path.join(__dirname, `still${SUFFIX}_${t}.jpg`), Buffer.from(await grab(), 'base64'));
    }
    console.log('stills written');
  } else {
    const dir = path.join(__dirname, 'frames');
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
    const n = await page.evaluate(() => window.frames);
    const t0 = Date.now();
    for (let i = 0; i < n; i++) {
      await page.evaluate(k => window.draw(k), i);
      fs.writeFileSync(path.join(dir, `f_${String(i).padStart(4, '0')}.jpg`), Buffer.from(await grab(), 'base64'));
      if (i % 30 === 0) console.log(`frame ${i}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    }
    const wav = path.join(__dirname, `sound${SUFFIX}.wav`);
    execFileSync('python3', ['-I', path.join(__dirname, 'sound.py'), path.join(__dirname, TIMELINE), wav], { stdio: 'inherit' });
    const out = path.join(__dirname, (mode === 'full' ? 'reel' : 'preview') + SUFFIX + '.mp4');
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', '30', '-i', path.join(dir, 'f_%04d.jpg'), '-i', wav,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', v2 ? '27' : '18', ...(v2 ? ['-tune', 'grain'] : []), '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
    console.log('wrote', out);
  }
  await browser.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });
