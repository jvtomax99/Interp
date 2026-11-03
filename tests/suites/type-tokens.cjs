/* Type tidy (DESIGN.md, Type): letter spacing goes with the size, from the
   --tr-* tokens, and Inter text uses four weights, 400, 500 (text), 550 and
   650. The stylesheets are read for any stray value; then the screens are
   measured, which also catches the browser's own bold (b, strong, h1-h6:
   700, or 900 from "bolder" inside a 650 parent) and inline styles.
   Kept outside the rule, on purpose: the Home hello banner (Jose's "style
   8": .home-greeting-*, .home-wave-*), and serif, mono and rounded faces. */
const L = require('../support/harness.cjs');
const fs = require('fs');
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d))); if (!c) process.exitCode = 1; };

const WEIGHTS = ['400', '500', '550', '650'];
const KEPT_SEL = /home-greeting|home-wave/;
const KEPT_FACE = /--serif|--mono|Plex|Lora|Parisienne|ui-rounded/i;

(async () => {
  console.log('== the stylesheets (read)');
  const clean = f => fs.readFileSync(L.ROOT + f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const app = clean('app.css');
  ok(/--tr-xs:\.02em; --tr-sm:0; --tr-body:-\.015em; --tr-head:-\.02em;\s*--tr-title:-\.025em; --tr-big:-\.03em; --tr-caps:\.06em;/.test(app),
    'the seven spacing tokens, next to the --fs-* sizes');
  ok(/b, strong, h1, h2, h3, h4, h5, h6, th\{ font-weight:650; \}/.test(app), 'bold in text and bare headings is 650');
  const strayW = [], strayT = [];
  for (const f of ['app.css', 'home-polish.css']) {
    const css = clean(f); const re = /([^{}]+)\{([^{}]*)\}/g; let m;
    while ((m = re.exec(css))) {
      const sel = m[1].trim().split('\n').pop().trim(), body = m[2];
      if (KEPT_SEL.test(sel)) continue;
      for (const w of body.matchAll(/font-weight\s*:\s*([^;}\s]+)/g)) if (!WEIGHTS.includes(w[1]) && !/^var\(--fw/.test(w[1])) strayW.push(f + ' ' + sel + ' ' + w[1]);
      for (const w of body.matchAll(/(?:^|[;\s])font\s*:\s*(?:normal\s+|italic\s+)?(\d{3})\s/g)) if (!WEIGHTS.includes(w[1])) strayW.push(f + ' ' + sel + ' font:' + w[1]);
      const face = (/font-family\s*:\s*([^;]+)/.exec(body) || /(?:^|[;\s])font\s*:\s*([^;]+)/.exec(body) || [])[1] || '';
      if (KEPT_FACE.test(face)) continue;
      for (const t of body.matchAll(/letter-spacing\s*:\s*([^;}\s]+)/g)) if (!/^var\(--tr-[a-z]+\)$/.test(t[1]) && t[1] !== '0' && t[1] !== 'normal') strayT.push(f + ' ' + sel + ' ' + t[1]);
    }
  }
  ok(!strayW.length, 'no weight outside 400, 500, 550, 650', strayW);
  ok(!strayT.length, 'no letter spacing outside the --tr-* tokens (or 0)', strayT);

  console.log('== the screens (measured)');
  const b = await L.chromium.launch();
  for (const device of ['iphone', 'desktop']) {
    const { ctx, page } = await L.boot(b, { device, settle: 5000 });
    const off = {};
    for (const s of ['home', 'all', 'practice', 'doctor-directory', 'userguide', 'chat', 'falsefriends', 'events']) {
      await L.go(page, s, 1400);
      const found = await page.evaluate(([W]) => {
        const out = [];
        for (const el of document.querySelectorAll('body *')) {
          if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
          if (el.closest('.home-greeting, [class*="home-greeting"], [class*="home-wave"]')) continue;
          const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
          const cs = getComputedStyle(el); if (!/^"?Inter/.test(cs.fontFamily)) continue;
          if (!W.includes(cs.fontWeight)) out.push(el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] + ' ' + cs.fontWeight);
        }
        return out;
      }, [WEIGHTS]);
      for (const k of found) off[k] = (off[k] || 0) + 1;
    }
    ok(!Object.keys(off).length, device + ': every Inter text on eight screens is 400, 500, 550 or 650', off);
    ok(!page.__errors.length, device + ': no page errors', page.__errors);
    await ctx.close();
  }
  await b.close();
})();
