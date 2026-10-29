/* Film one of Dr. Smiley's moves on Home at phone size, 30 fps, one PNG a
   frame cropped to him, and an MP4, for measuring a filmed clip frame by
   frame and showing Jose (2026-10-29; the clips' head track and the
   beheading were both judged from these). Time is stepped by hand like
   smiley-clip.cjs, so a slow machine films the same frames.

   node tools/home-film.cjs OUTDIR name [ms]      name: greet, think, wince, bounce, cheer (DR_CLIPS)
   OUTDIR/<name>-frames/0000.png ... and OUTDIR/<name>.mp4 (needs ffmpeg).
   BG='#ff00ff' paints the banner flat, so background showing through him
   (a hole at the neck) can be counted: magenta pixels inside his outline.
   ROOT=... films another checkout (a before). */
const { chromium, boot } = require('../support/harness.cjs');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const OUT = path.resolve(process.argv[2]), NAME = process.argv[3] || 'greet', DUR = +(process.argv[4] || 5400), STEP = 1000 / 30;
(async () => {
  const dir = path.join(OUT, NAME + '-frames'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const b = await chromium.launch();
  const { page, ctx } = await boot(b, { device: 'iphone', settle: 9000 });
  await page.evaluate(() => { document.querySelectorAll('[class*="thought"]').forEach(e => { e.style.display = 'none'; }); });
  if(process.env.BG) await page.evaluate(bg => { const st = document.createElement('style'); st.textContent = `#content.is-home .home-greeting{background:${bg} !important;box-shadow:none !important} #content.is-home .home-greeting::before,#content.is-home .home-greeting::after,#content.is-home .home-greeting-photo{display:none !important} #content.is-home .home-greeting *:not(.home-body):not(.home-body *){background:transparent !important;text-shadow:none !important}`; document.head.appendChild(st); }, process.env.BG);
  // wait for the clip's frames
  const loaded = await page.evaluate(n => { const e = drClipPreload(n); return e.ready; }, NAME);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Animation.enable');
  await page.clock.install();
  await page.clock.runFor(600);
  const r = await page.evaluate(() => { const h = window.homeBody.host.getBoundingClientRect(); return { x: h.x - 30, y: h.y - 120, width: h.width + 60, height: h.height + 140 }; });
  const was = await page.evaluate(() => ({ clip: !!window.homeBody.clip, busy: window.homeBody.body.busy() })); await page.evaluate(() => { drClipStop(window.homeBody); window.homeBody.body.stop(); window.homeBody.body.rest(); }); await page.clock.runFor(200); await page.waitForTimeout(400);
  await page.clock.pauseAt(await page.evaluate(() => Date.now()) + 50);
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 0 });
  const played = await page.evaluate(n => window.homeBody.act(n), NAME); console.log('before', was);
  console.log('loaded', loaded, 'played', played, 'box', r);
  for(let k = 0; k * STEP < DUR; k++){
    await page.screenshot({ path: path.join(dir, String(k).padStart(4, '0') + '.png'), clip: r });
    await page.evaluate(ms => document.getAnimations().forEach(a => { try{ if(a.playState !== 'finished') a.currentTime = (a.currentTime || 0) + ms; }catch(e){} }), STEP);
    await page.clock.runFor(Math.round(STEP));
  }
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '30', '-i', path.join(dir, '%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', path.join(OUT, NAME + '.mp4')]);
  if(page.__errors.length) console.log('page errors', page.__errors);
  await ctx.close(); await b.close();
  console.log('wrote', path.join(OUT, NAME + '.mp4'));
})().catch(e => { console.error(e); process.exit(1); });
