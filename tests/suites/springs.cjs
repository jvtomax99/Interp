/* S5 (docs/PLAN.md): plain taps settle on Apple's bounce-0 spring, no
   overshoot. --spring0 is one linear() shape (--ease where linear() is
   unsupported); press .368s, screen .588s, sheet .662s. The overshoot stays
   where it is the point: F2's --spring-settle on the Practice buttons
   (spring-press.cjs) and Dr. Smiley's own acting (face, brows, cheer, his
   dock move). Measured: the tab bar's icon and lens on a tab change, the
   Home section panel opening, the week dots' pop; and the two stylesheets
   read for any overshooting cubic-bezier outside the kept list. */
const L = require('../support/harness.cjs');
const fs = require('fs');
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d))); if (!c) process.exitCode = 1; };
const SPRING0 = /^linear\(0 0%, 0\.094 /;
const peak = (xs, final) => Math.max(...xs) - final;
// Samples a computed transform's scale (matrix a) or x-translation every frame.
const SAMPLE = (sel, what, ms) => `new Promise(r => { const out = []; const t0 = performance.now();
  const read = () => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return NaN; const t = getComputedStyle(el).transform; if (t === 'none') return ${what === 'x' ? 0 : 1};
    const m = t.match(/matrix\\(([^)]+)\\)/); if (!m) return NaN; const v = m[1].split(',').map(Number); return ${what === 'x' ? 'v[4]' : 'v[0]'}; };
  const tick = () => { out.push([Math.round(performance.now() - t0), read()]); if (performance.now() - t0 < ${ms}) requestAnimationFrame(tick); else r(out); }; tick(); })`;

(async () => {
  const b = await L.chromium.launch();
  console.log('== the token and the kept list (stylesheets read)');
  const html = fs.readFileSync(L.ROOT + 'index.html', 'utf8'), css = fs.readFileSync(L.ROOT + 'home-polish.css', 'utf8');
  const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n') + '\n' + css;
  const clean = styles.replace(/\/\*[\s\S]*?\*\//g, '');
  ok(/--spring0:var\(--ease\)/.test(clean) && /@supports \(transition-timing-function: linear\(0, 1\)\)\{\s*:root\{ --spring0:linear\(0, 0\.094, 0\.274, 0\.456, 0\.609, 0\.727, 0\.813, 0\.874, 0\.916, 0\.945, 0\.964, 0\.977, 0\.985, 0\.99, 0\.994, 0\.996, 0\.998, 0\.998, 1\); \}/.test(clean), 'the token: --ease, then the 19-point bounce-0 spring under @supports linear()');
  const over = []; const re = /([^{}]+)\{([^{}]*cubic-bezier\([^)]*\)[^{}]*)\}/g; let m;
  while ((m = re.exec(clean))) { const sel = m[1].trim().split('\n').pop().trim();
    for (const d of m[2].split(';')) { const c = /cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/.exec(d);
      if (c && (+c[2] > 1 || +c[4] > 1 || +c[2] < 0 || +c[4] < 0)) over.push(sel + ' | ' + d.trim().slice(0, 60)); } }
  const KEPT = [':root', '.cp-pick .cp-play', '.cp-go button', '.access-face svg', '.ask-face svg', 'svg.ds-art .ds-brow', '.prep-hero .ask-face.is-cheer', '.dock-smiley', 'body.drp-kb .dock-smiley'];
  const stray = over.filter(o => !KEPT.some(k => o.startsWith(k + ' |')));
  ok(!stray.length, 'no overshooting cubic-bezier outside the kept list (--spring itself, F2\'s fallbacks, Dr. Smiley\'s acting)', stray);
  ok(over.filter(o => /^\.(ask-face svg|access-face svg)|ds-brow|is-cheer|dock-smiley/.test(o)).length === 6, 'Dr. Smiley keeps his follow-through: face, brows, cheer, dock move', over);
  ok(/\.mastery-go\{ transition:transform \.6s var\(--spring-settle\)/.test(clean) && /\.study-mode, \.quiz-option, \.conf-btn\{ transition:transform \.6s var\(--spring-settle\)/.test(clean), 'F2\'s settling spring on the Practice buttons is untouched');

  console.log('== phone: the tab bar on a tab change');
  const { page } = await L.boot(b, { device: 'iphone', settle: 5000 });
  const tf = await page.evaluate(() => { const i = document.querySelector('.tabbar-btn.is-active .tabbar-icon'), l = document.querySelector('.tabbar-lens');
    const cs = getComputedStyle(i), cl = getComputedStyle(l); return { icon: cs.transitionTimingFunction, iconD: cs.transitionDuration, lens: cl.transitionTimingFunction, lensD: cl.transitionDuration, lensProps: cl.transitionProperty }; });
  ok(SPRING0.test(tf.icon) && tf.iconD === '0.368s', 'the icon: the spring, .368s (press)', tf);
  ok(SPRING0.test(tf.lens) && tf.lensD.split(',')[0].trim() === '0.588s' && tf.lensProps.startsWith('transform'), 'the lens: the spring on its transform, .588s (screen)', tf);
  // The bar tucks after 4 s idle (dock-mini: icons at their tucked sizes,
  // the lens hidden), so a first tap wakes it; the plain tap measured is
  // the second, with the bar open.
  await page.evaluate(() => { const btns = [...document.querySelectorAll('.tabbar-btn')].filter(b => !b.classList.contains('is-active') && !b.classList.contains('tabbar-search')); (btns[0]).click(); });
  await page.waitForTimeout(900);
  const target = await page.evaluate(() => { const btns = [...document.querySelectorAll('.tabbar-btn')].filter(b => !b.classList.contains('is-active') && !b.classList.contains('tabbar-search')); const t = btns[1] || btns[0]; return t ? t.getAttribute('aria-label') : null; });
  ok(target && !(await page.evaluate(() => document.body.classList.contains('dock-mini'))), 'the bar is open; a tab to switch to: ' + target);
  const [iconS, lensS] = await Promise.all([
    page.evaluate(`(() => { const p = ${SAMPLE('.tabbar-btn.is-active .tabbar-icon', 'scale', 700)}; document.querySelector('.tabbar-btn[aria-label=' + JSON.stringify(${JSON.stringify(target)}) + ']').click(); return p; })()`),
    page.evaluate(SAMPLE('.tabbar-lens', 'x', 700)),
  ]);
  const iconFinal = iconS[iconS.length - 1][1], lensFinal = lensS[lensS.length - 1][1], lensStart = lensS[0][1];
  ok(Math.abs(iconFinal - 1.08) < .005, 'the new tab\'s icon ends at scale 1.08', iconFinal);
  const iconPeak = peak(iconS.map(s => s[1]).filter(v => !isNaN(v)), iconFinal);
  ok(iconPeak < .004, 'the icon never swings past its size (peak over final ' + iconPeak.toFixed(4) + '; the old curve peaked about +0.08)', iconS.filter(s => s[1] > iconFinal + .004).slice(0, 4));
  const settledAt = iconS.find(s => Math.abs(s[1] - iconFinal) < .002 && iconS.filter(z => z[0] > s[0]).every(z => Math.abs(z[1] - iconFinal) < .002));
  ok(settledAt && settledAt[0] <= 420, 'and settles within the press time (' + (settledAt && settledAt[0]) + ' ms)', iconS.slice(0, 12));
  const dir = Math.sign(lensFinal - lensStart);
  const lensOver = lensS.filter(s => !isNaN(s[1]) && (s[1] - lensFinal) * dir > .5);
  ok(dir !== 0 && !lensOver.length, 'the lens glides to the new tab without passing it (moved ' + (lensFinal - lensStart).toFixed(1) + ' px)', lensOver.slice(0, 4));
  const back = lensS.map(s => s[1]).filter(v => !isNaN(v)); let retreats = 0; for (let i = 1; i < back.length; i++) if ((back[i] - back[i - 1]) * dir < -.5) retreats++;
  ok(retreats === 0, 'it never comes back the other way', retreats);

  console.log('== phone: Home section panel, the week dots');
  await page.evaluate(() => goHome()); await page.waitForTimeout(1500);
  const smw = await page.evaluate(() => { const i = document.querySelector('#content.is-home .smw-week i'); if (!i) return null; const cs = getComputedStyle(i); return { name: cs.animationName, tf: cs.animationTimingFunction, d: cs.animationDuration }; });
  ok(!smw || smw.name !== 'smwPop' || (SPRING0.test(smw.tf) && smw.d === '0.588s'), 'the week dots\' pop (when it plays) is on the spring, .588s', smw);
  const panel = await page.evaluate(`(async () => { openHomeSection('tools'); const p = document.querySelector('#homeSectionOverlay .home-section-panel'); const cs = getComputedStyle(p);
    const a = p.getAnimations().find(x => x.animationName === 'folderPanelIn'); const sample = await ${SAMPLE('#homeSectionOverlay .home-section-panel', 'scale', 800)}; return { tf: cs.animationTimingFunction, d: cs.animationDuration, running: !!a, sample }; })()`);
  ok(SPRING0.test(panel.tf) && panel.d === '0.588s' && panel.running, 'the section panel opens on the spring, .588s (screen)', { tf: panel.tf, d: panel.d, running: panel.running });
  const ps = panel.sample.map(s => s[1]).filter(v => !isNaN(v)); const pFinal = ps[ps.length - 1];
  ok(Math.abs(pFinal - 1) < .002 && peak(ps, pFinal) < .004, 'it grows from .8 to its size and never past it (peak over final ' + peak(ps, pFinal).toFixed(4) + ')', panel.sample.filter(s => s[1] > 1.004).slice(0, 4));
  ok(ps[0] < .9, 'it starts small (' + ps[0].toFixed(3) + ')', ps.slice(0, 5));
  await page.evaluate(() => closeHomeSection()); await page.waitForTimeout(400);

  console.log('== reduced motion: the token resolves, nothing new runs');
  const { page: rm } = await L.boot(b, { device: 'iphone', reducedMotion: true, settle: 4000 });
  const r = await rm.evaluate(() => ({ tok: getComputedStyle(document.documentElement).getPropertyValue('--spring0').trim().slice(0, 14), running: document.getAnimations().filter(a => a.playState === 'running').length }));
  ok(r.tok.startsWith('linear(0, 0.09'), 'the token is the spring here too (reduced motion is handled where each motion is turned off)', r);
  ok(rm.__errors.length === 0 && page.__errors.length === 0, 'no page errors', [rm.__errors, page.__errors]);
  await b.close();
})().catch(e => { console.log('  FAIL crashed: ' + e.message); process.exit(1); });
