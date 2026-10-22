// Photographs the fake app and the card with a headless browser (Playwright).
//   node render_ui.cjs            -> build/ui.png and build/card/c_0001.png ... c_0360.png
//   node render_ui.cjs ui         -> only the interface image
// Run `python timeline.py` first: it writes build/timeline.json, read here.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const HERE = __dirname;
const BUILD = path.join(HERE, 'build');
const T = JSON.parse(fs.readFileSync(path.join(BUILD, 'timeline.json'), 'utf8'));
const url = f => 'file://' + path.join(HERE, 'src', f);

(async () => {
  const browser = await chromium.launch();
  const only = process.argv[2];

  // 1. The interface: one 2560 x 1440 picture.
  const ui = await browser.newPage({ viewport: { width: T.UI_W, height: T.UI_H } });
  await ui.goto(url('ui.html'));
  await ui.evaluate(() => document.fonts.ready);
  await ui.waitForLoadState('networkidle');
  // The page must agree with the timeline, or he lands beside the buttons.
  const boxes = await ui.evaluate(() => ({
    panels: [...document.querySelectorAll('.panel')].map(e => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }),
    keys: [...document.querySelectorAll('.key')].map(e => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }),
  }));
  const want = { panels: Object.values(T.PANELS), keys: T.KEYS.map(k => T.KEY_RECTS[k]) };
  for (const kind of ['panels', 'keys']) {
    want[kind].forEach((w, i) => {
      const got = boxes[kind][i];
      if (!got || got.some((v, j) => Math.abs(v - w[j]) > 1))
        throw new Error(`${kind}[${i}] is at ${got} but timeline.py says ${w}`);
    });
  }
  await ui.screenshot({ path: path.join(BUILD, 'ui.png') });
  console.log('build/ui.png: the panels and keys match timeline.py');
  if (only === 'ui') return browser.close();

  // 2. The card: one picture per frame, transparent around its corners.
  const out = path.join(BUILD, 'card');
  fs.mkdirSync(out, { recursive: true });
  const card = await browser.newPage({ viewport: { width: 1040, height: 760 } });
  await card.goto(url('card.html'));
  const pin = 'data:image/webp;base64,' + fs.readFileSync(path.join(HERE, '..', '..', 'pins', 'pulmonology.webp')).toString('base64');
  await card.evaluate(([t, p]) => window.init(t, p), [T, pin]);
  for (let n = 1; n <= T.FRAMES; n++) {
    const data = await card.evaluate(n => { draw(n); return document.getElementById('c').toDataURL('image/png'); }, n);
    fs.writeFileSync(path.join(out, `c_${String(n).padStart(4, '0')}.png`), Buffer.from(data.split(',')[1], 'base64'));
  }
  console.log(`build/card/: ${T.FRAMES} frames`);
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
