/* The knowledge brain, live (brain/you.html in the app), frame by frame.
   The brain runs on a fake clock: requestAnimationFrame and performance.now
   are replaced inside /brain/ pages only, and each video frame advances the
   clock 1/30 s, so the motion is smooth whatever the render speed.

   Two passes, cut together in the video on a beat:
     calm   - the brain on its own, turning (made-up review record)
     lit    - reopened with the heart terms as a session ("See it in your
              brain" from Term Review), so those terms glow and the view
              turns to them

     node promo/capture/brain.cjs [calm|lit]  -> public/renders/brain/{calm,lit}_NNNN.png */
const fs = require('fs');
const path = require('path');
const { openApp, seedReviews, GL, L } = require('./capture.cjs');

const OUT = path.join(__dirname, '..', 'public', 'renders', 'brain');
const PASSES = { calm: 40, lit: 50 }; // frames each (the "ask" beat has 120, Ask itself takes the first half)
const STEP = 1000 / 30;

const CLOCK = `;(() => { if (!/\\/brain\\//.test(location.pathname)) return;
  let now = 0; const q = [];
  performance.now = () => now;
  window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
  window.cancelAnimationFrame = () => {};
  window.__tick = ms => { now += ms; q.splice(0).forEach(cb => { try { cb(now); } catch (e) {} }); return now; };
  // For the hero shot the brain fills the frame: the page's text panels are hidden (capture only).
  addEventListener('DOMContentLoaded', () => { const st = document.createElement('style');
    st.textContent = '.hud,#workup,#closeBrain{display:none!important}#scan{height:100vh!important}';
    document.head.appendChild(st); });
})();`;

const brainFrame = page => page.frames().find(f => /\/brain\/you\.html/.test(f.url()));

async function pass(page, name, focus) {
  await page.evaluate(f => openHumcBrain('you', f ? { focus: f } : undefined), focus);
  // Real time for the page to load and get its data; the fake clock stands still meanwhile.
  for (let i = 0; i < 40 && !brainFrame(page); i++) await page.waitForTimeout(250);
  const fr = brainFrame(page);
  await fr.waitForFunction(() => window.__tick && document.querySelector('canvas'), null, { timeout: 20000 });
  await page.waitForTimeout(2500);
  // In a session the brain holds still 9 s before it turns again; start past that.
  await fr.evaluate(ms => window.__tick(ms), focus ? 9200 : STEP);
  // The session's own "tap a name": Heart failure's label shows at its dot.
  if (focus) await fr.evaluate(() => { const li = [...document.querySelectorAll('#sheet .list li')].find(l => /Heart failure/.test(l.textContent)); if (li) li.click();
    // The list is hidden for the shot; marked hidden too, or the label thinks the list covers it.
    document.getElementById('sheet').hidden = true; });
  for (let n = 0; n < PASSES[name]; n++) {
    await fr.evaluate(ms => window.__tick(ms), STEP);
    await page.screenshot({ path: path.join(OUT, `${name}_${String(n).padStart(4, '0')}.png`) });
  }
  await page.evaluate(() => { const x = document.querySelector('.brain-ov'); if (x && window.closeHumcBrain) closeHumcBrain(); });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await L.chromium.launch({ args: GL });
  const only = process.argv.slice(2);
  for (const name of Object.keys(PASSES).filter(n => !only.length || only.includes(n))) {
    const { ctx, page } = await openApp(b, CLOCK);
    await page.setViewportSize({ width: 360, height: 640 }); // x3 = 1080 x 1920
    await seedReviews(page);
    // The session: the heart terms Dr. Smiley's answer is about.
    const focus = name === 'lit' ? await page.evaluate(() => ({
      right: [...new Map(allTermsFlat().filter(t => t.categoryId === 'cardiac').map(t => [t.en, t.id])).values()], missed: [] })) : null;
    await pass(page, name, focus);
    console.log(name, 'done', focus ? focus.right.length + ' terms lit' : '');
    await ctx.close();
  }
  await b.close();
})();
