/* The 3D Body coming apart, from the app's own viewer (Jose's note: show how
   the body breaks down, like his screenshot at Explode 25%). Opens the 3D Body
   with the tests' stand-ins (as capture-layers.cjs does), then for each frame
   moves the Explode slider a step (arrow keys) and turns the body a little
   (a drag), and saves the phone screen: assets/layers/explode/NN.webp (at 2x)
   plus frames.json. The reel plays them as a sequence on the phone.
   Run from the repo root:  node promo/hub-blend/tools/capture-explode.cjs */
const path = require('path'), fs = require('fs');
const L = require('../../../tests/support/harness.cjs');
const OUT = path.resolve(__dirname, '..', 'assets', 'layers', 'explode');
const FRAMES = 14, STEP = 5, TURN = 14; // explode 0 to 65%, and a slow turn
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await L.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const { ctx, page } = await L.boot(b, { device: 'pwa', settle: 3000, reducedMotion: true });
  await page.setViewportSize({ width: 390, height: 844 });
  page.setDefaultTimeout(120000);
  await ctx.route('**/atlas/**', r => {
    const f = path.join(L.ROOT, decodeURIComponent(new URL(r.request().url()).pathname));
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) return r.fulfill({ status: 404, body: '' });
    r.fulfill({ status: 200, contentType: TYPES[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
  });
  await page.evaluate(() => setCategory('anatomy'));
  await page.waitForTimeout(20000);
  const slider = page.frameLocator('#anatLayer iframe').locator('[role=slider], input[type=range]').first();
  const frame = page.frames().find(f => /atlas/.test(f.url()));
  const shots = [];
  for (let i = 0; i < FRAMES; i++) {
    if (i) {
      await slider.focus();
      for (let k = 0; k < STEP; k++) await page.keyboard.press('ArrowRight');
      await page.mouse.move(150, 430); await page.mouse.down(); await page.mouse.move(150 + TURN, 430, { steps: 3 }); await page.mouse.up();
    }
    await page.waitForTimeout(1200);
    const v = await frame.evaluate(() => (document.querySelector('[role=slider], input[type=range]') || {}).value);
    const png = await page.screenshot();
    const webp = await page.evaluate(async b64 => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width * 2 / 3; c.height = img.height * 2 / 3;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL('image/webp', 0.86).split(',')[1];
    }, png.toString('base64'));
    const f = String(i).padStart(2, '0') + '.webp';
    fs.writeFileSync(path.join(OUT, f), Buffer.from(webp, 'base64'));
    shots.push({ file: f, explode: +v });
    console.log(f, 'explode', v);
  }
  fs.writeFileSync(path.join(OUT, 'frames.json'), JSON.stringify({ size: [780, 1688], frames: shots }, null, 1));
  await b.close();
})();
