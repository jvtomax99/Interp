// Vercel deploys only "Bump version" commits (ignoreCommand in vercel.json),
// so three things must agree, or changes stop going live with no error: the
// rule, the title the bump workflow writes, and what the workflow skips.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (!c && d !== undefined ? ' ' + JSON.stringify(d) : '')); if (!c) process.exitCode = 1; };

const rule = JSON.parse(readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')).ignoreCommand;
ok(typeof rule === 'string' && rule.length > 0, 'vercel.json has the deploy rule');

const workflow = readFileSync(path.join(ROOT, '.github/workflows/bump-version.yml'), 'utf8');
const title = (workflow.match(/git commit -qa -m "(Bump version to )\$id"/) || [])[1];
ok(title === 'Bump version to ', 'the workflow writes the title the rule looks for', title);

// The rule itself, in a real repository. Vercel: exit 0 skips, 1 builds.
const dir = mkdtempSync(path.join(tmpdir(), 'deploy-rule-'));
const git = (...a) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd: dir, stdio: 'pipe' });
git('init', '-q');
const exitFor = message => {
  git('commit', '-q', '--allow-empty', '-m', message);
  return spawnSync('sh', ['-c', rule], { cwd: dir }).status;
};
ok(exitFor('Bump version to b1104.1348') === 1, 'a bump commit deploys');
ok(exitFor('Merge pull request #203: his face frames') === 0, 'a merge is skipped');
ok(exitFor('Docs: mention Bump version to b1104.1348') === 0, 'a title that only mentions a bump is skipped');
rmSync(dir, { recursive: true, force: true });

// A path the workflow skips gets no bump, so it can never go live: nothing
// the app needs may be on that list.
const ignored = readFileSync(path.join(ROOT, '.vercelignore'), 'utf8').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
const skipped = [...(workflow.match(/paths-ignore:\n((?:\s+- .*\n)+)/) || [, ''])[1].matchAll(/- '([^']+)'/g)].map(m => m[1]);
ok(skipped.length > 0, 'the workflow lists the paths it skips');
const live = skipped.filter(p => p !== '**/*.md' && !ignored.includes(p.replace(/\/\*\*$/, '')));
ok(live.length === 0, 'everything the bump skips stays out of the deployment', live);
