// GitHub runs the suites as several shares side by side, one machine each
// (.github/workflows/tests.yml, `node run.cjs --shard=K/N`). A suite left
// out of every share would simply never run, with a green check all the
// same. So: every file in suites/ is in run.cjs's list, the list names no
// missing file, and the shares the workflow asks for hold each suite once.
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (!c && d !== undefined ? ' ' + JSON.stringify(d) : '')); if (!c) process.exitCode = 1; };
const { SUITES, shares } = createRequire(import.meta.url)(path.join(HERE, '..', 'run.cjs'));

const listed = SUITES.map(([f]) => f);
const onDisk = readdirSync(HERE).filter(f => /\.(cjs|mjs)$/.test(f));
ok(onDisk.every(f => listed.includes(f)), 'every file in suites/ is in run.cjs', onDisk.filter(f => !listed.includes(f)));
ok(listed.every(f => onDisk.includes(f)), 'run.cjs lists no file that is missing', listed.filter(f => !onDisk.includes(f)));
ok(new Set(listed).size === listed.length, 'no suite is listed twice', listed.filter((f, i) => listed.indexOf(f) !== i));

const yml = readFileSync(path.join(ROOT, '.github', 'workflows', 'tests.yml'), 'utf8');
const m = yml.match(/^\s*shard:\s*\[([\d,\s]+)\]/m);
const asked = m ? m[1].split(',').map(s => +s.trim()) : [];
const n = asked.length;
ok(n >= 2 && asked.every((k, i) => k === i + 1), 'the workflow asks for shares 1 to N in order', asked);
ok(/run\.cjs --shard=\$\{\{ matrix\.shard \}\}\/\$\{\{ strategy\.job-total \}\}/.test(yml), 'each machine runs its own share, out of the number of machines');

const parts = n ? shares(n) : [];
const all = parts.flat();
ok(all.length === listed.length && listed.every(f => all.filter(x => x === f).length === 1), `the ${n} shares together run each of the ${listed.length} suites exactly once`, { inShares: all.length, listed: listed.length });
ok(parts.every(p => p.length > 0), 'no share is empty', parts.map(p => p.length));
const again = n ? shares(n) : [];
ok(JSON.stringify(parts) === JSON.stringify(again), 'the split is the same every time it is worked out');
for (const k of [1, 3, 7]) { const p = shares(k).flat(); ok(p.length === listed.length && new Set(p).size === listed.length, `split ${k} ways: still each suite once`); }
