/* The chapter's sound: its sound cues (window.SFX, from kit.js's pop/stamp/sfx calls) mixed into
   voice/ch<N>.sfx.m4a, and voice + cues into out/ch<N>.audio.m4a for the drafts.
   node promo/claude-guide/tools/mix.cjs <chapter> */
const path = require('path'), { execFileSync } = require('child_process');
const { open, PROJ } = require('./serve.cjs');
const ch = process.argv[2];
(async () => {
  const { page, close } = await open(ch);
  const { cues, dur } = await page.evaluate(() => ({ cues: window.SFX, dur: window.BEATS.duration }));
  await close();
  const files = [...new Set(cues.map(c => c.name))];
  const args = ['-nostdin', '-v', 'error', '-y', ...files.flatMap(f => ['-i', path.join(PROJ, 'sfx', f + '.wav')])];
  // one split per sound file, one delayed copy per cue
  const split = files.map((f, i) => { const n = cues.filter(c => c.name === f).length;
    return `[${i}]aresample=48000,asplit=${n}${Array.from({ length: n }, (_, k) => `[${f}${k}]`).join('')}`; });
  const used = {}, legs = cues.map((c, j) => { const k = used[c.name] = (used[c.name] ?? -1) + 1;
    return `[${c.name}${k}]volume=${c.vol},adelay=${Math.round(c.at * 1000)}:all=1[c${j}]`; });
  const graph = [...split, ...legs, `${cues.map((_, j) => `[c${j}]`).join('')}amix=inputs=${cues.length}:normalize=0,apad=whole_dur=${dur},volume=1.6[out]`].join(';');
  const sfxOut = path.join(PROJ, 'voice', `ch${ch}.sfx.m4a`);
  execFileSync('ffmpeg', [...args, '-filter_complex', graph, '-map', '[out]', '-c:a', 'aac', '-b:a', '128k', sfxOut]);
  const both = path.join(PROJ, 'out', `ch${ch}.audio.m4a`);
  execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-y', '-i', path.join(PROJ, 'voice', `ch${ch}.m4a`), '-i', sfxOut, '-filter_complex',
    '[0][1]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95[a]', '-map', '[a]', '-c:a', 'aac', '-b:a', '160k', both]);
  console.log(`${cues.length} cues -> ${sfxOut}\n${both}`);
})();
