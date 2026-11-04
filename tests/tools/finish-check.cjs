/* The finishing checklist (feel audit, phase 5): what premium apps get right,
   screen by screen, at iPhone size. Six checks, all measured, none a
   screenshot judgment:

     press   every tappable thing gets a held touch; one whose computed look
             (transform, colour, shadow, filter, class) has not changed
             70 ms later has no press feedback
     load    the screen's text sampled at 0, 100, 400, 1000 and 2500 ms
             after it opens: a "No ... yet" / "Loading" line that is there
             early and gone at 2.5 s is a flash of empty before the data
     shift   the browser's own layout-shift score through the data arrival
             (PerformanceObserver 'layout-shift'), each shift's element named
     kb      a text field focused with the viewport shrunk to what the
             keyboard leaves: the field stays visible, the tab bar is gone
     dark    the same screens in the app's dark theme (ih_theme): text
             contrast against its background (WCAG 4.5:1, 3:1 for large),
             and light surfaces left over; a screenshot per screen
     safe    the stylesheets' fixed and sticky rules that never mention the
             phone's safe-area inset (static; the lab can't draw the notch)

     cd tests
     node tools/finish-check.cjs                     everything
     CHECKS=press,load node tools/finish-check.cjs   some checks
     ONLY=chat,doctor node tools/finish-check.cjs    screens whose name matches
     JSON=out/finish-check.json ...                  also save the raw findings

   Screenshots go to out/finish/. Firebase and the AI endpoints are the
   suites' stand-ins (their latencies: terms 420 ms, doctors 480 ms). */
const fs = require('fs');
const path = require('path');
const { chromium, route, SEED, OUT, ROOT } = require('../support/harness.cjs');
const CHECKS = (process.env.CHECKS || 'press,load,shift,kb,dark,safe').split(',');
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
const SHOTS = path.join(OUT, 'finish'); fs.mkdirSync(SHOTS, { recursive: true });

// Each opener runs inside the page; `arg` is passed to it.
const SCREENS = [
  ['Home', () => setCategory('home')],
  ['Glossary (all domains)', () => setCategory('all')],
  ['A domain (Mental Health)', () => setCategory('mh')],
  ['Term Review', () => setCategory('review')],
  ['CoreCHI Practice', () => setCategory('practice')],
  ['Memory trainer', () => setCategory('memory')],
  ['False Friends', () => setCategory('falsefriends')],
  ['Sound-Alikes', () => setCategory('soundalikes')],
  ['Doctor Prep', () => setCategory('doctor-research')],
  ['Doctor Directory', () => setCategory('doctor-directory')],
  ['A doctor\'s page', () => { setCategory('doctor-directory'); openDoctorDirDetail('d3'); }],
  ['Provider Pictures', () => { closeDoctorDirDetail(); setCategory('providers'); }],
  ['Team Chat', () => setCategory('chat')],
  ['Training & Events', () => setCategory('events')],
  ['Code of Ethics', () => setCategory('ethics')],
  ['Resources', () => setCategory('resources')],
  ['Translate', () => setCategory('translate')],
  ['3D Body', () => setCategory('anatomy')],
  ['User Guide', () => setCategory('userguide')],
  ['Ask the Hub', () => setCategory('ask')],
  ['Updates', () => setCategory('updates')],
  ['Team access', () => setCategory('team-access')],
  ['More (sheet)', () => { setCategory('home'); openMoreSheet(); }],
  ['Global search (sheet)', () => { if (typeof closeMoreSheet === 'function') closeMoreSheet(); openGlobalSearch(); }],
  ['Add term (sheet)', () => { if (typeof closeGlobalSearch === 'function') closeGlobalSearch(); setCategory('all'); openAddModal(); }],
  ['Daily Drill (sheet)', () => { if (typeof closeModal === 'function') closeModal(); setCategory('home'); openWarmupSheet(); }]
];

// ---- in-page helpers (sent over as source) ----
const INIT = () => {
  window.__ls = [];
  try {
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) {
        if (e.hadRecentInput) continue;
        const srcs = (e.sources || []).map(s => { const n = s.node; if (!n || !n.tagName) return '?';
          return n.tagName.toLowerCase() + (n.id ? '#' + n.id : n.className && typeof n.className === 'string' ? '.' + n.className.trim().split(/\s+/).slice(0, 2).join('.') : ''); });
        window.__ls.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), srcs });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch (e) {}
};
const TEXT = () => {
  const top = document.querySelector('.modal.show, .overlay.show, .gs-overlay.show') || document.getElementById('content') || document.body;
  return top.innerText.replace(/[ \t]+/g, ' ').split('\n').map(s => s.trim()).filter(Boolean);
};
const SIG = el => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).filter(c => !/^(is-|has-|active|selected|open|show)/.test(c)).slice(0, 3).join('.') : '');
const TAPPABLES = (sigSrc) => {
  const SIG = eval(sigSrc);
  const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); };
  const top = document.querySelector('.modal.show, .overlay.show, .gs-overlay.show');
  const root = top || document;
  const inter = [...root.querySelectorAll('button, a[href], [onclick], [role=button], [role=tab], [role=radio], summary, label[for], input[type=checkbox], input[type=radio]')]
    .filter(vis).filter(el => !el.closest('[aria-hidden="true"]')).filter(el => top ? true : !el.closest('.modal, .overlay, .gs-overlay'));
  const outer = inter.filter(el => !inter.some(o => o !== el && o.contains(el) && o.matches('button, a[href]')));
  const seen = new Set(); const out = [];
  for (const el of outer) {
    const s = SIG(el); if (seen.has(s)) continue; seen.add(s);
    el.__fc = s; out.push(s);
  }
  return out;
};
const LOOK = el => { const c = getComputedStyle(el); return [c.transform, c.translate, c.scale, c.rotate, c.opacity, c.backgroundColor, c.boxShadow, c.filter, c.color, c.borderColor, c.outlineColor].join('|'); };
const SNAP = ({ sig, lookSrc }) => {
  const LOOK = eval(lookSrc);
  const el = [...document.querySelectorAll('*')].find(e => e.__fc === sig);
  if (!el) return null;
  el.scrollIntoView({ block: 'center', inline: 'nearest' });
  const r = el.getBoundingClientRect();
  const inner = el.querySelector('span, i, svg, img');
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, look: LOOK(el) + (inner ? '/' + LOOK(inner) : ''), cls: el.className && typeof el.className === 'string' ? el.className : '',
    label: (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 32) };
};
const SNAP2 = ({ sig, lookSrc }) => {
  const LOOK = eval(lookSrc);
  const el = [...document.querySelectorAll('*')].find(e => e.__fc === sig);
  if (!el) return null;
  const inner = el.querySelector('span, i, svg, img');
  return { look: LOOK(el) + (inner ? '/' + LOOK(inner) : ''), cls: el.className && typeof el.className === 'string' ? el.className : '', active: el.matches(':active') };
};
const CONTRAST = (sigSrc) => {
  const SIG = eval(sigSrc);
  const lum = (r, g, b) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const rgb = s => { const m = s && s.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; };
  const bgOf = el => { let n = el; while (n && n !== document.documentElement) { const c = getComputedStyle(n); if (c.backgroundImage !== 'none') return 'img'; const b = rgb(c.backgroundColor); if (b && b[3] > .9) return b; n = n.parentElement; } return rgb(getComputedStyle(document.body).backgroundColor) || [255, 255, 255, 1]; };
  const top = document.querySelector('.modal.show, .overlay.show, .gs-overlay.show') || document.getElementById('content') || document.body;
  const low = {}, light = [];
  const vw = innerWidth, vh = innerHeight;
  for (const el of top.querySelectorAll('*')) {
    const direct = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || r.bottom < 0 || r.top > vh) continue;
    const c = getComputedStyle(el);
    if (c.visibility === 'hidden' || +c.opacity < .5) continue;
    const bg = rgb(c.backgroundColor);
    if (bg && bg[3] > .9 && lum(bg[0], bg[1], bg[2]) > .7 && r.width * r.height > vw * vh * .04) light.push(SIG(el) + ' ' + Math.round(100 * r.width * r.height / (vw * vh)) + '%');
    if (!direct) continue;
    const fg = rgb(c.color); const b = bgOf(el);
    if (!fg || b === 'img' || !b) continue;
    const L1 = lum(fg[0], fg[1], fg[2]), L2 = lum(b[0], b[1], b[2]);
    const ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
    const size = parseFloat(c.fontSize), bold = +c.fontWeight >= 700;
    const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
    if (ratio < need) { const s = SIG(el); if (!low[s]) low[s] = { ratio: +ratio.toFixed(2), need, text: el.textContent.trim().slice(0, 28), n: 0 }; low[s].n++; }
  }
  return { low: Object.entries(low).slice(0, 12), light: [...new Set(light)].slice(0, 8) };
};

async function screenPass(ctx, page, cdp, dark, findings) {
  for (const [name, open] of SCREENS) {
    if (ONLY && !ONLY.some(o => name.toLowerCase().includes(o.toLowerCase()))) continue;
    const f = findings[name] = findings[name] || {};
    const key = dark ? 'dark' : 'light';
    try {
      await page.evaluate(() => { if (typeof closeAllOverlays === 'function') closeAllOverlays(); window.scrollTo(0, 0); });
      await page.waitForTimeout(400);
      await page.evaluate(() => { window.__ls = []; });
      const t0 = Date.now();
      await page.evaluate(open);
      if (!dark && (CHECKS.includes('load') || CHECKS.includes('shift'))) {
        const samples = {};
        for (const at of [0, 100, 400, 1000, 2500]) {
          const wait = at - (Date.now() - t0); if (wait > 0) await page.waitForTimeout(wait);
          samples[at] = await page.evaluate(TEXT);
        }
        const last = new Set(samples[2500]);
        const flashes = [];
        for (const at of [0, 100, 400, 1000]) for (const line of samples[at]) if (/^(No .{2,40} yet\b|Loading)/i.test(line) && !last.has(line) && !flashes.some(x => x.line === line)) flashes.push({ at, line: line.slice(0, 60) });
        f.flashes = flashes;
        f.empty = samples[2500].length === 0;
        const ls = await page.evaluate(() => window.__ls);
        f.shift = +ls.reduce((a, e) => a + e.v, 0).toFixed(3);
        f.shifts = ls.filter(e => e.v >= .005).slice(0, 6);
      } else await page.waitForTimeout(2500);
      if (CHECKS.includes('press') && !dark) {
        const sigs = await page.evaluate(TAPPABLES, SIG.toString());
        const none = [];
        for (const sig of sigs.slice(0, 40)) {
          const a = await page.evaluate(SNAP, { sig, lookSrc: LOOK.toString() });
          if (!a) continue;
          await page.waitForTimeout(80);
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.x, y: a.y }] });
          await page.waitForTimeout(70);
          const b = await page.evaluate(SNAP2, { sig, lookSrc: LOOK.toString() });
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
          await page.waitForTimeout(120);
          if (b && b.look === a.look && b.cls === a.cls) none.push(sig + (a.label ? ' "' + a.label + '"' : '') + (b.active ? ' (:active, no rule)' : ''));
        }
        f.tappables = sigs.length; f.noPress = none;
        // The touches may have moved things; put the screen back.
        await page.evaluate(open); await page.waitForTimeout(800);
      }
      if (CHECKS.includes('kb') && !dark) {
        const input = await page.evaluate(() => { const top = document.querySelector('.modal.show, .overlay.show, .gs-overlay.show') || document; const i = [...top.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]), textarea')].find(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }); if (!i) return null; i.__fk = 1; return (i.id || i.placeholder || i.className || i.tagName).toString().slice(0, 30); });
        if (input) {
          await page.evaluate(() => { const i = [...document.querySelectorAll('input, textarea')].find(e => e.__fk); delete i.__fk; i.focus(); });
          await page.setViewportSize({ width: 393, height: 420 });
          await page.waitForTimeout(500);
          f.kb = await page.evaluate(() => {
            const i = document.activeElement; const r = i ? i.getBoundingClientRect() : null;
            const bar = document.querySelector('.tabbar'); const br = bar ? bar.getBoundingClientRect() : null; const bc = bar ? getComputedStyle(bar) : null;
            const barAway = !bar || bc.display === 'none' || bc.visibility === 'hidden' || +bc.opacity < .05 || br.top >= innerHeight || br.bottom <= 0;
            return { input: (i && (i.id || i.placeholder || i.tagName) || '?').toString().slice(0, 30), kbOpen: document.body.classList.contains('kb-open'), visible: !!r && r.top >= 0 && r.bottom <= innerHeight, top: r ? Math.round(r.top) : null, bottom: r ? Math.round(r.bottom) : null, barAway, barTop: br ? Math.round(br.top) : null };
          });
          await page.evaluate(() => { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); });
          await page.setViewportSize({ width: 393, height: 759 });
          await page.waitForTimeout(400);
        }
      }
      if (CHECKS.includes('dark') && dark) {
        f.contrast = await page.evaluate(CONTRAST, SIG.toString());
      }
      await page.screenshot({ path: path.join(SHOTS, key + '-' + name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.png') });
    } catch (e) { f.error = (f.error ? f.error + '; ' : '') + key + ': ' + String(e.message).split('\n')[0].slice(0, 120); }
  }
}

function safeAreas() {
  const out = [];
  for (const file of ['app.css', 'home-polish.css']) {
    const css = fs.readFileSync(ROOT + file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' ')); // comments out, line numbers kept
    const re = /([^{}]+)\{([^{}]*)\}/g; let m;
    const usesInset = new Set();
    while ((m = re.exec(css))) if (/safe-area-inset/.test(m[2])) m[1].split(',').forEach(s => usesInset.add(s.trim().replace(/\s+/g, ' ')));
    re.lastIndex = 0;
    while ((m = re.exec(css))) {
      const body = m[2];
      if (!/position\s*:\s*(fixed|sticky)/.test(body)) continue;
      const sel = m[1].trim().replace(/\s+/g, ' ').split(',').map(s => s.trim());
      if (/safe-area-inset/.test(body) || sel.some(s => usesInset.has(s))) continue;
      const edge = /\bbottom\s*:/.test(body) ? 'bottom' : /\btop\s*:/.test(body) ? 'top' : 'inset?';
      const line = css.slice(0, m.index).split('\n').length;
      out.push({ file: file + ':' + line, sel: sel.join(', ').slice(0, 70), edge });
    }
  }
  return out;
}

(async () => {
  const browser = await chromium.launch();
  const findings = {};
  for (const dark of [false, true]) {
    if (dark && !CHECKS.includes('dark')) continue;
    if (!dark && !CHECKS.some(c => ['press', 'load', 'shift', 'kb'].includes(c))) continue;
    const ctx = await browser.newContext({ viewport: { width: 393, height: 759 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message.slice(0, 120)));
    await route(page, {});
    await page.addInitScript(o => { window.__SEED_CATS = o.seed; window.__ACCESS = { mode: 'none' };
      try { localStorage.setItem('ih_onboarded', '1'); localStorage.setItem('ih_myName', 'Jose'); localStorage.setItem('ih_region', 'north'); if (o.dark) localStorage.setItem('ih_theme', 'dark'); } catch (e) {} }, { seed: SEED, dark });
    await page.addInitScript(INIT);
    await page.goto('https://interp.test/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(12000);
    const cdp = await ctx.newCDPSession(page);
    await screenPass(ctx, page, cdp, dark, findings);
    findings.__errors = (findings.__errors || []).concat(errors.map(e => (dark ? 'dark: ' : '') + e));
    await ctx.close();
  }
  await browser.close();
  if (CHECKS.includes('safe')) findings.__safe = safeAreas();

  // ---- report ----
  const names = Object.keys(findings).filter(k => !k.startsWith('__'));
  const pad = (s, n) => String(s).padEnd(n);
  console.log(pad('screen', 26), 'taps', 'no press', 'flash', 'shift', 'kb', 'contrast', 'light');
  for (const n of names) {
    const f = findings[n];
    console.log(pad(n, 26), pad(f.tappables ?? '-', 4), pad(f.noPress ? f.noPress.length : '-', 8), pad(f.flashes ? f.flashes.length : '-', 5), pad(f.shift ?? '-', 5),
      pad(f.kb ? (f.kb.visible && f.kb.barAway ? 'ok' : (f.kb.visible ? '' : 'field hidden ') + (f.kb.barAway ? '' : 'bar stays')) : '-', 12),
      pad(f.contrast ? f.contrast.low.length : '-', 8), f.contrast ? f.contrast.light.length : '-', f.error ? '  ERROR ' + f.error : '');
  }
  for (const n of names) {
    const f = findings[n]; const lines = [];
    if (f.noPress && f.noPress.length) lines.push('  no press feedback: ' + f.noPress.join(' | '));
    if (f.flashes && f.flashes.length) lines.push('  empty flash: ' + f.flashes.map(x => `"${x.line}" at ${x.at} ms`).join(' | '));
    if (f.empty) lines.push('  the screen is empty at 2.5 s');
    if (f.shifts && f.shifts.length) lines.push('  shifts: ' + f.shifts.map(s => `${s.v} at ${s.t} ms (${s.srcs.join(', ')})`).join(' | '));
    if (f.kb && !(f.kb.visible && f.kb.barAway)) lines.push('  keyboard: ' + JSON.stringify(f.kb));
    if (f.contrast && f.contrast.low.length) lines.push('  low contrast: ' + f.contrast.low.map(([s, v]) => `${s} "${v.text}" ${v.ratio}:1 (needs ${v.need}, x${v.n})`).join(' | '));
    if (f.contrast && f.contrast.light.length) lines.push('  light surfaces in dark mode: ' + f.contrast.light.join(' | '));
    if (lines.length) { console.log('\n' + n); lines.forEach(l => console.log(l)); }
  }
  if (findings.__safe) { console.log('\nfixed/sticky rules with no safe-area inset (' + findings.__safe.length + '):'); findings.__safe.forEach(s => console.log(`  ${s.file.padEnd(22)} ${s.edge.padEnd(7)} ${s.sel}`)); }
  if (findings.__errors && findings.__errors.length) console.log('\npage errors:', findings.__errors.slice(0, 6));
  if (process.env.JSON) { fs.mkdirSync(path.dirname(process.env.JSON), { recursive: true }); fs.writeFileSync(process.env.JSON, JSON.stringify(findings, null, 1)); }
})();
