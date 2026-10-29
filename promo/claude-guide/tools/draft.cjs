/* A draft video of a chapter without HyperFrames: the timeline seeked to every frame, a
   screenshot each, joined by ffmpeg with the chapter's sound (out/ch<N>.audio.m4a from mix.cjs).
   Same page, same frames HyperFrames would take; much faster in this container.
   node promo/claude-guide/tools/draft.cjs <chapter> [scale=0.6667 (720x1280)] [fps=30]
   Scale 1 is the finished chapter (1080x1920), written to renders/ch<N>.mp4. */
const path = require('path'), fs = require('fs'), { spawn } = require('child_process');
const { open, PROJ } = require('./serve.cjs');
const [ch, scale = '0.6667', fps = '30'] = process.argv.slice(2);
(async () => {
  const { page, errs, close } = await open(ch, +scale);
  const dur = await page.evaluate(() => window.BEATS.duration);
  const w = Math.round(1080 * scale / 2) * 2, h = Math.round(1920 * scale / 2) * 2;
  // full size is the finished chapter, kept in renders/; anything smaller is a draft in out/
  const final = +scale >= 1, out = final ? path.join(PROJ, 'renders', `ch${ch}.mp4`) : path.join(PROJ, 'out', `ch${ch}-draft.mp4`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', fps, '-c:v', 'mjpeg', '-i', '-',
    '-i', path.join(PROJ, 'out', `ch${ch}.audio.m4a`), '-vf', `scale=${w}:${h}`, '-c:v', 'libx264', '-preset', final ? 'slow' : 'medium', '-crf', final ? '21' : '22',
    '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.ceil(dur * fps), t0 = Date.now();
  for (let k = 0; k < n; k++) {
    await page.evaluate((t) => { window.__timelines.main.seek(t, false); }, k / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: final ? 95 : 90 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (k % 300 === 0) console.log(`frame ${k}/${n}, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  if (errs.length) console.log('errors:', [...new Set(errs)].join('\n'));
  console.log(out, ((Date.now() - t0) / 1000).toFixed(0) + ' s'); await close();
})();
