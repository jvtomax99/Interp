// The end card (src/endcard.html) as build/endcard.png, 720 x 1280.
const { chromium } = require('../../node_modules/playwright');
const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 720, height: 1280 } });
  await p.goto('file://' + path.resolve(__dirname, '../src/endcard.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  await p.screenshot({ path: path.resolve(__dirname, '../build/endcard.png') }); await b.close(); console.log('build/endcard.png'); })();
