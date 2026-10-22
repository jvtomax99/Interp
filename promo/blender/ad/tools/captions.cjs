// Photographs each caption (src/captions.html) as a transparent 720 x 1280
// PNG: build/captions/<name>.png, laid over the frames.
const { chromium } = require('../../node_modules/playwright');
const path = require('path'), fs = require('fs');
const OUT = path.resolve(__dirname, '../build/captions');
const NAMES = ['title', 'glossary', 'body', 'doctors', 'brain', 'drills', 'campus', 'end'];
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 720, height: 1280 } });
  for (const n of NAMES) {
    await p.goto('file://' + path.resolve(__dirname, '../src/captions.html') + '?c=' + n);
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(OUT, n + '.png'), omitBackground: true });
  }
  console.log('build/captions:', NAMES.length);
  await b.close();
})();
