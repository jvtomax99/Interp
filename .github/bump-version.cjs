// Moves the two version lines every deploy needs, so pull requests never
// touch them (they used to, and every open PR conflicted on these lines).
// Run by .github/workflows/bump-version.yml after each push to main:
//   index.html  const BUILD_ID = 'bMMDD.HHMM';  const BUILD_TIME = 'YYYY-MM-DD HH:MM UTC';
//   sw.js       const CACHE_VERSION = 'interpreter-hub-v<n+1>-<BUILD_ID>';
// Prints the new values. Exits 1 if a line is missing, so a renamed
// constant fails the run instead of deploying an unbumped app.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const now = process.env.BUMP_NOW ? new Date(process.env.BUMP_NOW) : new Date();
const p2 = n => String(n).padStart(2, '0');
const mm = p2(now.getUTCMonth() + 1), dd = p2(now.getUTCDate());
const hh = p2(now.getUTCHours()), mi = p2(now.getUTCMinutes());
const buildId = `b${mm}${dd}.${hh}${mi}`;
const buildTime = `${now.getUTCFullYear()}-${mm}-${dd} ${hh}:${mi} UTC`;

function swap(file, re, make) {
  const f = path.join(root, file);
  const s = fs.readFileSync(f, 'utf8');
  const m = s.match(re);
  if (!m) { console.error(`${file}: no match for ${re}`); process.exit(1); }
  fs.writeFileSync(f, s.replace(re, make(m)));
  return m;
}

swap('index.html', /const BUILD_ID = '[^']*';/, () => `const BUILD_ID = '${buildId}';`);
swap('index.html', /const BUILD_TIME = '[^']*';/, () => `const BUILD_TIME = '${buildTime}';`);
let cache;
swap('sw.js', /const CACHE_VERSION = 'interpreter-hub-v(\d+)[^']*';/, m => {
  cache = `interpreter-hub-v${Number(m[1]) + 1}-${buildId}`;
  return `const CACHE_VERSION = '${cache}';`;
});
console.log(`BUILD_ID ${buildId}\nCACHE_VERSION ${cache}`);
