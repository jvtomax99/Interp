/* Stills of a chapter at given times, as one contact sheet (half size).
   node promo/claude-guide/tools/stills.cjs <chapter> <out.jpg> <t> [t ...] */
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const { open, PROJ } = require('./serve.cjs');
const [ch, outRel, ...times] = process.argv.slice(2);
(async () => {
  const { page, errs, close } = await open(ch);
  const out = path.resolve(PROJ, outRel), dir = out + '.d'; fs.mkdirSync(dir, { recursive: true });
  const files = [];
  for (const t of times) {
    await page.evaluate((t) => { window.__timelines.main.seek(t, false); }, +t); // return nothing: the timeline itself is too big to send back
    const f = path.join(dir, `${t}.png`); await page.screenshot({ path: f }); files.push(f);
  }
  const cols = Math.min(files.length, 5);
  const rows = Math.ceil(files.length / cols);
  const pad = Array(rows * cols - files.length).fill(files[0]);
  const all = [...files, ...pad];
  const filt = Array.from({ length: rows }, (_, r) => `${all.slice(r * cols, r * cols + cols).map((_, i) => `[${r * cols + i}]`).join('')}hstack=${cols}[r${r}]`).join(';')
    + (rows > 1 ? `;${Array.from({ length: rows }, (_, r) => `[r${r}]`).join('')}vstack=${rows}` : '');
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...all.flatMap(f => ['-i', f]), '-filter_complex', rows > 1 ? filt : filt.replace('[r0]', ''), '-q:v', '4', out]);
  if (errs.length) console.log('errors:', [...new Set(errs)].join('\n'));
  console.log(out); await close();
})();
