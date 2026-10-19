/* Memory trainer lines (trainer-lines.js): no browser.
   The False Friends starters still match FALSE_FRIENDS in index.html; every
   chunk is really in its line and the chunks cover the whole line; the long
   lines run 10-45 words, both ways, across the six topics. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..', '..');
let fails = 0;
const check = (ok, what) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${what}`); if (!ok) fails++; };

const box = { self: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'trainer-lines.js'), 'utf8'), box);
const LINES = box.self.TRAINER_LINES;
check(Array.isArray(LINES) && LINES.length > 0, `trainer-lines.js sets self.TRAINER_LINES (${LINES && LINES.length} lines)`);

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const a = html.indexOf('const FALSE_FRIENDS = [');
const b = html.indexOf('\n];', a);
const FF = vm.runInNewContext('(' + html.slice(a + 'const FALSE_FRIENDS = '.length, b + 2) + ')');

const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const key = s => fold(s).replace(/\s+/g, '-');
const words = s => (fold(s).match(/[a-z0-9']+/g) || []);

// ids
const ids = LINES.map(l => l.id);
check(new Set(ids).size === ids.length, 'ids are unique');
check(LINES.every(l => ['es', 'en'].includes(l.from) && ['patient', 'family', 'provider'].includes(l.who) && l.topic && l.text && l.render && Array.isArray(l.chunks) && l.chunks.length),
  'every line has from, who, topic, text, render and chunks');

// starters against FALSE_FRIENDS
const ADAPTED = { desorden: 'The doctor says I have a condition.', estomago: 'My belly hurts.', severo: 'Severe pain.' };
const LEFT_OUT = ['aborto', 'argumento', 'bizarro', 'seno', 'derrame', 'ataque', 'pecho'];
const starters = LINES.filter(l => l.id.startsWith('ff-'));
const byKey = new Map(FF.map(f => [key(f.es), f]));
const drift = [];
for (const l of starters) {
  const k = l.id.slice(3);
  const f = byKey.get(k);
  if (!f) { drift.push(`${l.id}: no False Friend "${k}"`); continue; }
  if (l.text !== f.heard) drift.push(`${l.id}: text "${l.text}" != heard "${f.heard}"`);
  const want = ADAPTED[k] || f.truth;
  if (l.render !== want) drift.push(`${l.id}: render "${l.render}" != "${want}"`);
  if (l.from !== 'es') drift.push(`${l.id}: from ${l.from}`);
}
check(!drift.length, `starters match FALSE_FRIENDS heard/truth${drift.length ? ': ' + drift.join('; ') : ''}`);
const covered = new Set(starters.map(l => l.id.slice(3)));
const missing = FF.map(f => key(f.es)).filter(k => !covered.has(k) && !LEFT_OUT.includes(k));
check(!missing.length, `every False Friend is a starter or listed as left out${missing.length ? ' (missing: ' + missing.join(', ') + ')' : ''}`);
check(starters.length === FF.length - LEFT_OUT.length, `${starters.length} starters = ${FF.length} False Friends - ${LEFT_OUT.length} left out`);

// chunks: each piece is in its sentence, rendering pieces in order, both sides fully covered
const bad = [];
for (const l of LINES) {
  const T = fold(l.text), R = fold(l.render);
  const spans = (s, pieces, ordered) => {
    const used = []; let from = 0;
    for (const p of pieces) {
      const q = fold(p);
      const at = ordered ? s.indexOf(q, from) : s.indexOf(q);
      if (at < 0) return { err: `"${p}" not found${ordered ? ' in order' : ''}` };
      if (used.some(([x, y]) => at < y && at + q.length > x)) return { err: `"${p}" overlaps another chunk` };
      used.push([at, at + q.length]); from = at + q.length;
    }
    let rest = s;
    used.sort((x, y) => y[0] - x[0]).forEach(([x, y]) => { rest = rest.slice(0, x) + ' ' + rest.slice(y); });
    const left = words(rest);
    return left.length ? { err: `not in any chunk: ${left.join(' ')}` } : {};
  };
  const r = spans(R, l.chunks.map(c => c[1]), true);
  if (r.err) bad.push(`${l.id} render: ${r.err}`);
  const t = spans(T, l.chunks.map(c => c[0]), false);
  if (t.err) bad.push(`${l.id} text: ${t.err}`);
  if (l.chunks.some(c => c.length !== 2 || !c[0].trim() || !c[1].trim())) bad.push(`${l.id}: a chunk is not [text, render]`);
}
check(!bad.length, `chunks sit in their lines and cover them${bad.length ? ':\n  ' + bad.join('\n  ') : ''}`);

// the long lines
const long = LINES.filter(l => !l.id.startsWith('ff-'));
const TOPICS = ['ED', 'meds', 'consent', 'discharge', 'OB', 'peds'];
const en = long.filter(l => l.from === 'en'), es = long.filter(l => l.from === 'es');
check(en.length >= 30 && es.length >= 30, `long lines both ways: ${en.length} English to Spanish, ${es.length} Spanish to English`);
check(en.every(l => l.who === 'provider') && es.every(l => l.who !== 'provider'), 'English lines are the provider, Spanish lines the patient or family');
check(long.every(l => l.id === `${l.from}-${l.id.slice(3)}`), 'long ids name the language read aloud');
const counts = long.map(l => [l.id, words(l.text).length]);
const outOfRange = counts.filter(([, n]) => n < 10 || n > 45);
check(!outOfRange.length, `long lines are 10-45 words${outOfRange.length ? ' (' + outOfRange.map(([i, n]) => `${i}: ${n}`).join(', ') + ')' : ''}`);
const gaps = [];
for (const t of TOPICS) for (const side of [en, es]) if (!side.some(l => l.topic === t)) gaps.push(`${t} ${side === en ? 'en' : 'es'}`);
check(long.every(l => TOPICS.includes(l.topic)) && !gaps.length, `each topic both ways${gaps.length ? ' (missing ' + gaps.join(', ') + ')' : ''}`);
const n = counts.map(c => c[1]).sort((x, y) => x - y);
console.log(`  long lines: ${n.length}, words ${n[0]}-${n[n.length - 1]}, median ${n[n.length >> 1]}; chunks ${Math.min(...long.map(l => l.chunks.length))}-${Math.max(...long.map(l => l.chunks.length))}`);

process.exitCode = fails ? 1 : 0;
