/* A smooth, sharp clip of Dr. Smiley's full body acting, from the viewer
   (drsmiley/body.html), for reviewing a move frame by frame and showing Jose a
   before/after. Like smiley-clip.cjs it slows time: the page's clock is
   Playwright's, every CSS animation is moved on by hand, one screenshot per
   1/60 s.

   node tools/body-clip.cjs OUTDIR [names...]     (default: greet)
   Each name: OUTDIR/<name>.mp4 at real speed and OUTDIR/<name>-slow.mp4 at
   1/4, plus OUTDIR/<name>-frames/ (every frame, for the review). Same
   variant every run (SEED, default 7). ROOT=... films another checkout (a
   before). MODE=focused|lively. BG=is-navy|is-mesh (the viewer's
   backgrounds; navy shows a cut's edges the way Home's photo does). Needs
   ffmpeg. */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const OUT = path.resolve(process.argv[2] || 'out/body-clip'), NAMES = process.argv.slice(3).length ? process.argv.slice(3) : ['greet'];
const ROOT = path.resolve(process.env.ROOT || path.join(__dirname, '../..')), SEED = +(process.env.SEED || 7);
const STEP = 1000 / 60, DUR = +process.env.MS || 3400;
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.clock.install();
  await page.goto('file://' + path.join(ROOT, 'drsmiley/body.html'));
  await page.evaluate(() => Promise.all([...document.images, ...document.querySelectorAll('image')].map(i => i.decode ? i.decode().catch(() => {}) : 0)));
  await page.clock.runFor(1500);
  if(process.env.MODE) await page.click(`#mode [data-mode="${process.env.MODE}"]`);
  if(process.env.BG) await page.evaluate(bg => { document.getElementById('stage').className = 'stage ' + bg; }, process.env.BG);
  await page.evaluate(() => { window.stopIdle && window.stopIdle(); body.stop(); body.rest(); });
  await page.clock.runFor(400);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Animation.enable');
  const clip = await page.evaluate(() => { const r = document.getElementById('stage').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
  for(const name of NAMES){
    const dir = path.join(OUT, name + '-frames');
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    await page.clock.pauseAt(await page.evaluate(() => Date.now()) + 50);
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 0 });
    await page.evaluate(([n, s]) => { drBodySeed(s); body.perform(n); drBodySeed(null); }, [name, SEED]);
    for(let k = 0; k * STEP < DUR; k++){
      await page.screenshot({ path: path.join(dir, String(k).padStart(4, '0') + '.png'), clip });
      await page.evaluate(ms => document.getAnimations().forEach(a => { try{ if(a.playState !== 'finished') a.currentTime = (a.currentTime || 0) + ms; }catch(e){} }), STEP);
      await page.clock.runFor(Math.round(STEP));
    }
    const enc = ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2'];
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '60', '-i', path.join(dir, '%04d.png'), ...enc, path.join(OUT, name + '.mp4')]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '15', '-i', path.join(dir, '%04d.png'), ...enc, path.join(OUT, name + '-slow.mp4')]);
    console.log(name, Math.ceil(DUR / STEP), 'frames');
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
