/* Builds the phone review page for the memory trainer lines: Jose ticks each
   Spanish line OK or writes a fix; his ticks live in the page's own store
   (collection "reviews", one document per line id), where Claude reads them.

     node tests/tools/trainer-review.cjs <out.html>

   Publish the result with the Artifact tool (capabilities db + user) to the
   same link each time, so the ticks already made stay. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const out = process.argv[2];
if (!out) { console.error('usage: node trainer-review.cjs <out.html>'); process.exit(1); }
const box = { self: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', '..', 'trainer-lines.js'), 'utf8'), box);
const lines = box.self.TRAINER_LINES;
const tpl = fs.readFileSync(path.join(__dirname, 'trainer-review.html'), 'utf8');
fs.writeFileSync(out, tpl.replace('__LINES__', JSON.stringify(lines).replace(/</g, '\\u003c')));
console.log(`${out}: ${lines.length} lines`);
