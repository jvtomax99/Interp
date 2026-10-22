/* Copies the app's own art into public/ for Remotion, which doesn't follow
   symlinks. The copies are not committed (.gitignore); the repo's files are
   the source. Runs before studio and render (package.json). */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const PUB = path.join(__dirname, '..', 'public');
for (const p of ['drsmiley', 'pins', 'city', 'hero.jpg', 'icon-512.png']) {
  fs.cpSync(path.join(ROOT, p), path.join(PUB, p), { recursive: true });
}
console.log('app art copied into promo/public');
