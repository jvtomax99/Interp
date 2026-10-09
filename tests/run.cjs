/* Runs every suite, one after another, and fails if any check fails.

     cd tests && node run.cjs            all suites
     node run.cjs daily-drill guide      just these

   A suite fails when it prints a FAIL line, exits with an error, or prints
   no PASS line at all (it didn't get far enough to check anything).
   Screenshots land in tests/out/ (not kept in git). */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SUITES = [
  ['events-login.mjs',    'Events watcher login (no browser)'],
  ['daily-drill.cjs',     'Daily Drill: rounds, levels, score, Home card'],
  ['guide.cjs',           'User Guide: search, answers, Show me'],
  ['journey.cjs',         'End-to-end journey: Ask, briefing, review, offline'],
  ['smiley-gaze.cjs',     'Dr. Smiley: eyes, lean, moods'],
  ['smiley-gestures.cjs', 'Dr. Smiley: the five performances'],
];
const only = process.argv.slice(2);
const pick = only.length ? SUITES.filter(([f]) => only.some(o => f.startsWith(o))) : SUITES;
fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });

const summary = [];
for (const [file, what] of pick) {
  const t0 = Date.now();
  console.log(`\n=== ${file} · ${what}`);
  const r = spawnSync(process.execPath, [path.join(__dirname, 'suites', file)], { cwd: __dirname, encoding: 'utf8', timeout: 15 * 60 * 1000, maxBuffer: 64 * 1024 * 1024 });
  const out = (r.stdout || '') + (r.stderr || '');
  fs.writeFileSync(path.join(__dirname, 'out', file + '.log'), out);
  const lines = out.split('\n');
  const pass = lines.filter(l => /^\s*PASS\b/.test(l)).length;
  const fail = lines.filter(l => /^\s*FAIL\b/.test(l));
  const ok = r.status === 0 && !fail.length && pass > 0;
  fail.slice(0, 20).forEach(l => console.log(l));
  if (!ok && !fail.length) console.log(out.split('\n').slice(-25).join('\n'));
  const secs = Math.round((Date.now() - t0) / 1000);
  console.log(`${ok ? '✓' : '✗'} ${file}: ${pass} passed, ${fail.length} failed${r.status ? `, exit ${r.status}` : ''}${r.signal ? `, ${r.signal}` : ''} (${secs}s)`);
  summary.push([ok, file, pass, fail.length]);
}
console.log('\n' + summary.map(([ok, f, p, n]) => `${ok ? '✓' : '✗'} ${f.padEnd(22)} ${p} passed${n ? `, ${n} failed` : ''}`).join('\n'));
const bad = summary.filter(s => !s[0]).length;
console.log(bad ? `\n${bad} suite(s) failed.` : '\nAll suites passed.');
process.exitCode = bad ? 1 : 0;
