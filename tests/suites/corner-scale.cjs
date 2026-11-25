/* Corner scale (DESIGN.md, Border radius): every rounded corner is one of
   the five --r-* sizes, 6 10 14 20 26. Written by hand only: 0, circles
   (50%), pills (999px) and hairlines of 1 to 3px (bars, ticks, carets).
   The stylesheets are read for any stray value; then the screens are
   measured, which also catches a corner set from the page's code. */
const L = require('../support/harness.cjs');
const fs = require('fs');
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d))); if (!c) process.exitCode = 1; };
const SCALE = [6, 10, 14, 20, 26];

(async () => {
  console.log('== the stylesheets (read)');
  const clean = f => fs.readFileSync(L.ROOT + f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  ok(/--r-xs:6px; --r-sm:10px; --r-md:14px; --r-lg:20px; --r-xl:26px;/.test(clean('app.css')), 'the five sizes, in one place: 6 10 14 20 26');
  const stray = [];
  for (const f of ['app.css', 'home-polish.css']) {
    const css = clean(f); const re = /([^{}]+)\{([^{}]*)\}/g; let m;
    while ((m = re.exec(css))) {
      const sel = m[1].trim().split('\n').pop().trim();
      for (const d of m[2].matchAll(/(?:border(?:-(?:top|bottom)-(?:left|right))?-radius|--drp-r|--tc-radius|--tc-tight)\s*:\s*([^;}]+)/g))
        for (const part of d[1].replace(/!important/, '').replace(/\s*\/\s*/g, ' ').trim().split(/\s+(?![^(]*\))/)) {
          if (/^(0|inherit|50%|100%|999px|var\(--(r-(xs|sm|md|lg|xl)|drp-r|tc-radius|tc-tight)\))$/.test(part)) continue;
          if (/^[\d.]+px$/.test(part) && parseFloat(part) <= 3) continue;
          stray.push(f + ' ' + sel.slice(0, 60) + ' ' + part);
        }
    }
  }
  ok(!stray.length, 'every corner is a --r-* size (0, 50%, 999px and 1 to 3px hairlines excepted)', stray.slice(0, 20));
  const inline = [];
  for (const f of ['index.html', 'home-polish.js', ...fs.readdirSync(L.ROOT + 'features').map(n => 'features/' + n)])
    for (const z of fs.readFileSync(L.ROOT + f, 'utf8').matchAll(/border-radius\s*:\s*([\d.]+)px/g)) if (parseFloat(z[1]) > 3 && parseFloat(z[1]) < 999) inline.push(f + ' ' + z[0]);
  ok(!inline.length, 'no corner typed by hand in the page\'s code', inline);

  console.log('== the screens (measured)');
  const b = await L.chromium.launch();
  for (const device of ['iphone', 'desktop']) {
    const { ctx, page } = await L.boot(b, { device, settle: 5000 });
    const off = {};
    for (const s of ['home', 'all', 'cardiac', 'practice', 'doctor-research', 'doctor-directory', 'userguide', 'chat', 'falsefriends', 'events']) {
      await L.go(page, s, 1400);
      const bad = await page.evaluate(scale => {
        const out = {};
        for (const el of document.querySelectorAll('body *')) {
          const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
          const cs = getComputedStyle(el);
          for (const k of ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius']) {
            const v = cs[k]; if (v.includes('%') || v.includes(' ')) continue;
            const px = parseFloat(v); if (!(px > 3) || px >= 100 || scale.includes(px)) continue;
            // a corner as round as the box allows is a pill or a circle whatever its number
            if (px >= Math.min(r.width, r.height) / 2 - 0.5) continue;
            const id = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + '.' + String(el.className && el.className.baseVal === undefined ? el.className : '').trim().split(/\s+/).slice(0, 2).join('.');
            out[id + ' ' + v] = 1;
          }
        }
        return Object.keys(out);
      }, SCALE);
      for (const x of bad) off[x] = s;
    }
    ok(!Object.keys(off).length, device + ': every corner drawn on ten screens is on the scale', Object.entries(off).slice(0, 20));
    ok(!page.__errors.length, device + ': no script errors', page.__errors.slice(0, 3));
    await ctx.close();
  }
  await b.close();
})();
