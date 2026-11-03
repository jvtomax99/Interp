/* Type tidy (DESIGN.md, Type): sizes from the ten --fs-* steps (Apple's
   scale), letter spacing that goes with the size, from the --tr-* tokens,
   and Inter text uses four weights, 400, 500 (text), 550 and 650. The stylesheets are read for any stray value; then the screens are
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
  ok(/--tr-sm:0; --tr-body:-\.015em; --tr-head:-\.02em;\s*--tr-title:-\.025em; --tr-big:-\.03em; --tr-caps:\.06em;/.test(app),
    'the six spacing tokens, next to the --fs-* sizes');
  ok(/--fs-cap:12px; --fs-foot:13px; --fs-sub:15px; --fs-head:17px;\s*--fs-t3:20px; --fs-t2:22px; --fs-t1:28px;[\s\S]{0,120}--fs-cap2:11px; --fs-call:16px; --fs-large:34px;/.test(app),
    'the ten sizes: Apple\'s scale, 11 12 13 15 16 17 20 22 28 34');
  ok(/b, strong, h1, h2, h3, h4, h5, h6, th\{ font-weight:650; \}/.test(app), 'bold in text and bare headings is 650');
  const strayW = [], strayT = [], strayS = [], wrongBand = [];
  const PX = { cap2: 11, cap: 12, foot: 13, sub: 15, call: 16, head: 17, t3: 20, t2: 22, t1: 28, large: 34 };
  const band = px => px < 14 ? 'sm' : px < 17 ? 'body' : px < 19 ? 'head' : px < 24 ? 'title' : 'big';
  for (const f of ['app.css', 'home-polish.css']) {
    const css = clean(f); const re = /([^{}]+)\{([^{}]*)\}/g; let m;
    while ((m = re.exec(css))) {
      const sel = m[1].trim().split('\n').pop().trim(), body = m[2];
      if (KEPT_SEL.test(sel)) continue;
      for (const w of body.matchAll(/font-weight\s*:\s*([^;}\s]+)/g)) if (!WEIGHTS.includes(w[1]) && !/^var\(--fw/.test(w[1])) strayW.push(f + ' ' + sel + ' ' + w[1]);
      for (const w of body.matchAll(/(?:^|[;\s])font\s*:\s*(?:normal\s+|italic\s+)?(\d{3})\s/g)) if (!WEIGHTS.includes(w[1])) strayW.push(f + ' ' + sel + ' font:' + w[1]);
      // Sizes: a --fs-* token, or a display size of 36px and up.
      for (const z of body.matchAll(/font-size\s*:\s*([^;}!]+)/g)) { const v = z[1].trim();
        if (!/^var\(--fs-[a-z0-9]+\)$/.test(v) && !(/^([\d.]+)px$/.test(v) && parseFloat(v) >= 36) && !/^(inherit|1em|100%)$/.test(v)) strayS.push(f + ' ' + sel + ' ' + v); }
      for (const z of body.matchAll(/(?:^|[;\s])font\s*:\s*(?:normal\s+|italic\s+)?(?:\d{3}\s+)?([\d.]+px)/g)) if (parseFloat(z[1]) < 36) strayS.push(f + ' ' + sel + ' font:' + z[1]);
      // Spacing matches the size's band.
      const sz = /(?:font-size\s*:\s*|(?:^|[;\s])font\s*:[^;]*?)var\(--fs-(\w+)\)/.exec(body);
      const tr = /letter-spacing\s*:\s*var\(--tr-(sm|body|head|title|big)\)/.exec(body);
      if (sz && tr && PX[sz[1]] && band(PX[sz[1]]) !== tr[1]) wrongBand.push(f + ' ' + sel + ' ' + sz[1] + '/' + tr[1]);
      const face = (/font-family\s*:\s*([^;]+)/.exec(body) || /(?:^|[;\s])font\s*:\s*([^;]+)/.exec(body) || [])[1] || '';
      if (KEPT_FACE.test(face)) continue;
      for (const t of body.matchAll(/letter-spacing\s*:\s*([^;}\s]+)/g)) if (!/^var\(--tr-[a-z]+\)$/.test(t[1]) && t[1] !== '0' && t[1] !== 'normal') strayT.push(f + ' ' + sel + ' ' + t[1]);
    }
  }
  ok(!strayW.length, 'no weight outside 400, 500, 550, 650', strayW);
  ok(!strayT.length, 'no letter spacing outside the --tr-* tokens (or 0)', strayT);
  ok(!strayS.length, 'every font size is a --fs-* token (display sizes of 36px and up excepted)', strayS);
  ok(!wrongBand.length, 'each rule\'s letter spacing is the one for its size', wrongBand);

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
