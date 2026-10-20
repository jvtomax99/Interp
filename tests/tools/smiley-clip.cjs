/* A smooth, sharp clip of Dr. Smiley on Home at phone size, for showing Jose
   a motion before or after it is built. The tests' Chromium can't film it
   directly (video is at CSS pixels, screenshots in a loop at ~4 fps), so
   this slows time: his button is drawn at 3x (CSS zoom), the app's timers
   run on Playwright's clock and every animation is moved on by hand, one
   cropped screenshot per 1/60 s. See "Facts" in docs/PLAN.md.

   node tools/smiley-clip.cjs OUTDIR [names...]     (default: cheer greet)
   Each name: OUTDIR/<name>.mp4 at real speed (60 fps) and OUTDIR/<name>-slow.mp4
   at 1/4. Same variant every run (drPerfSeed(7)). INDEX=... records another
   index.html (harness.cjs), for a before/after pair. Needs ffmpeg. */
const { chromium, boot } = require('../support/harness.cjs');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const OUT = path.resolve(process.argv[2] || 'out/clip'), NAMES = process.argv.slice(3).length ? process.argv.slice(3) : ['cheer', 'greet'];
const STEP = 1000 / 60, DUR = +process.env.MS || 2700;   // MS=3600 for a longer one
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const { page, ctx } = await boot(b, { device: 'iphone', settle: 9000 });
  await page.evaluate(() => {
    document.querySelectorAll('[class*="thought"]').forEach(e => { if(!e.closest('.home-wave-icon')) e.style.display = 'none'; });
    document.querySelector('#content.is-home .home-wave-icon').style.zoom = 3;
  });
  await page.waitForTimeout(800);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Animation.enable');
  await page.clock.install();
  const clip = { x: 16, y: 30, width: 344, height: 420 };
  for(const name of NAMES){
    const dir = fs.mkdtempSync(path.join(OUT, '.f-'));
    await page.evaluate(() => drPerfSeed(7));
    await page.clock.runFor(600);
    await page.clock.pauseAt(await page.evaluate(() => Date.now()) + 50);
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 0 });
    await page.evaluate(n => { window.homeSmileyAct(n); drPerfSeed(null); }, name);
    for(let k = 0; k * STEP < DUR; k++){
      await page.screenshot({ path: path.join(dir, String(k).padStart(4, '0') + '.jpg'), clip, type: 'jpeg', quality: 94 });
      await page.evaluate(ms => document.getAnimations().forEach(a => { try{ if(a.playState !== 'finished') a.currentTime = (a.currentTime || 0) + ms; }catch(e){} }), STEP);
      await page.clock.runFor(Math.round(STEP));
    }
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 });
    await page.clock.resume();
    for(const [suffix, rate] of [['', 60], ['-slow', 15]])
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(rate), '-i', path.join(dir, '%04d.jpg'),
        '-vf', 'fps=60,format=yuv420p', '-c:v', 'libx264', '-crf', '20', '-movflags', '+faststart', path.join(OUT, name + suffix + '.mp4')]);
    fs.rmSync(dir, { recursive: true, force: true });
    console.log('wrote', path.join(OUT, name + '.mp4'));
    await page.waitForTimeout(400);
  }
  if(page.__errors.length) console.log('page errors', page.__errors);
  await ctx.close(); await b.close();
})();
