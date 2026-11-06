/* Adjust your photo (docs/features/photo-adjust.md, features/photo-adjust.js).
   Picking a photo in the name sheet opens the editor; drag and zoom keep the
   photo covering the frame; the previews follow; Save uploads exactly the
   square in the frame (320 px JPEG); Cancel and Escape upload nothing and keep
   the photo you had. The photo is made in the page: 900 x 1600, a red band at
   the top (where a selfie's head is), green in the middle, blue at the bottom. */
const L = require('../support/harness.cjs');
const O = L.OUT + 'photo-adjust/'; require('fs').mkdirSync(O, { recursive: true });
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 600))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));

// Storage stood in for (it keeps every uploaded square), the name sheet open, and a picked photo.
const setup = page => page.evaluate(() => {
  window.__ups = [];
  storage = { ref: () => ({ child: () => ({ put: async blob => { window.__ups.push(blob); return { ref: { getDownloadURL: async () => URL.createObjectURL(blob) } }; } }) }) };
  openNameModal();
});
const pick = page => page.evaluate(() => new Promise(res => {
  const c = Object.assign(document.createElement('canvas'), { width: 900, height: 1600 }), g = c.getContext('2d');
  g.fillStyle = '#d02020'; g.fillRect(0, 0, 900, 400); g.fillStyle = '#20a040'; g.fillRect(0, 400, 900, 800); g.fillStyle = '#2040c0'; g.fillRect(0, 1200, 900, 400);
  c.toBlob(b => { window.__picked = handleMyPhotoSelected({ target: { files: [new File([b], 'selfie.png', { type: 'image/png' })] } }); res(); }, 'image/png');
}));
const state = page => page.evaluate(() => {
  const q = s => document.querySelector(s), st = q('.pa-stage');
  if (!st) return { open: false };
  const w = PA.img.naturalWidth * PA.s, h = PA.img.naturalHeight * PA.s;
  return { open: true, S: PA.S, stageW: st.clientWidth, x: PA.x, y: PA.y, z: PA.z, covers: PA.x <= 0.01 && PA.y <= 0.01 && PA.x + w >= PA.S - 0.01 && PA.y + h >= PA.S - 0.01,
    img: q('.pa-img').style.transform, chat: q('.pa-pv-chat img').style.transform, badge: q('.pa-pv-badge img').style.transform };
});
const drag = async (page, dx, dy) => {
  const r = await page.evaluate(() => { const b = document.querySelector('.pa-stage').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
  await page.mouse.move(r.x, r.y); await page.mouse.down(); await page.mouse.move(r.x + dx, r.y + dy, { steps: 8 }); await page.mouse.up();
};
const zoom = (page, v) => page.evaluate(v => { const r = document.querySelector('.pa-zoom input'); r.value = v; r.dispatchEvent(new Event('input')); }, v);
// The saved square: its size, type, and the colour at a few points (0-1 across and down).
const saved = page => page.evaluate(async () => {
  const blob = window.__ups[window.__ups.length - 1]; if (!blob) return null;
  const bm = await createImageBitmap(blob), c = Object.assign(document.createElement('canvas'), { width: bm.width, height: bm.height }), g = c.getContext('2d'); g.drawImage(bm, 0, 0);
  const at = (fx, fy) => { const d = g.getImageData(Math.floor(fx * (bm.width - 1)), Math.floor(fy * (bm.height - 1)), 1, 1).data; return d[0] > 150 && d[1] < 90 ? 'red' : d[1] > 120 && d[0] < 90 ? 'green' : d[2] > 150 && d[0] < 90 ? 'blue' : `${d[0]},${d[1]},${d[2]}`; };
  return { w: bm.width, h: bm.height, type: blob.type, top: at(.5, .02), upper: at(.5, .4), mid: at(.5, .5), bottom: at(.5, .98), n: window.__ups.length };
});

(async () => {
  const b = await L.chromium.launch();

  console.log('== picking a photo opens the editor');
  {
    const { ctx, page } = await L.boot(b, { device: 'iphone', name: 'Jose Vazquez', settle: 3500 });
    await setup(page); await wait(300); await pick(page);
    await page.waitForSelector('.pa-stage', { timeout: 3000 }).catch(() => {});
    await wait(400);
    const s = await state(page);
    ok(s.open && Math.abs(s.S - s.stageW) < 0.5, 'Adjust your photo opens over the name sheet, its frame measured right', s);
    ok(s.covers && s.z === 1, 'the photo starts covering the whole frame', s);
    ok(await page.evaluate(() => !window.__ups.length), 'nothing is uploaded until Save');
    const t = await page.evaluate(() => ['.pa-save', '.pa-cancel', '.pa-zoom input'].map(sel => { const e = document.querySelector(sel), r = e.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { sel, h: Math.round(r.height), w: Math.round(r.width), hit: e === hit || e.contains(hit) }; }));
    ok(t.every(x => x.h >= 44 && x.hit), 'Save, Cancel and the zoom slider: 44px or more, and a tap there reaches them', t);
    const fit = await page.evaluate(() => { const r = document.querySelector('.pa-sheet').getBoundingClientRect(); return { t: r.top, b: r.bottom, l: r.left, r: r.right, vw: innerWidth, vh: innerHeight }; });
    ok(fit.t >= 0 && fit.l >= 0 && fit.r <= fit.vw && fit.b <= fit.vh, 'the whole sheet fits on the phone', fit);
    await page.screenshot({ path: O + 'open.png' });

    console.log('== drag and zoom');
    await drag(page, -900, 900);
    let d = await state(page);
    ok(d.covers && Math.abs(d.y) < 0.5, 'dragged far past the edge: it stops with the photo still covering the frame (here, its top at the top)', d);
    await zoom(page, 9);
    d = await state(page);
    ok(d.z === 4 && d.covers, 'zoom stops at 4x, still covering', d);
    await zoom(page, 0.2);
    d = await state(page);
    ok(d.z === 1 && d.covers, 'and not smaller than the frame', d);
    const num = t => (t.match(/-?[\d.]+/g) || []).slice(1, 3).map(Number);
    const [ix, iy] = num(d.img), [cx, cy] = num(d.chat), k = await page.evaluate(() => document.querySelector('.pa-pv-chat').clientWidth / PA.S);
    ok(Math.abs(cx - ix * k) < 0.6 && Math.abs(cy - iy * k) < 0.6, 'the Team Chat preview follows the photo', { ix, iy, cx, cy, k });
    await page.screenshot({ path: O + 'adjusted.png' });

    console.log('== Save');
    await drag(page, 0, 900);                       // the top of the photo: the red band, where a selfie's head is
    await page.click('.pa-save');
    await page.waitForFunction(() => window.__ups.length && !document.querySelector('.pa'), null, { timeout: 4000 }).catch(() => {});
    await page.evaluate(() => window.__picked);
    const sv = await saved(page);
    ok(sv && sv.w === 320 && sv.h === 320 && sv.type === 'image/jpeg', 'Save uploads a 320px square JPEG', sv);
    // The frame holds the photo's top 900px: red (its top 400px) down to 44%, then green. The old middle cut
    // (350-1250px) was almost all green: a selfie's head gone.
    ok(sv && sv.top === 'red' && sv.upper === 'red' && sv.mid === 'green' && sv.bottom === 'green', 'exactly the square in the frame: the photo\'s top, which the old middle cut lost', sv);
    const well = await page.evaluate(() => ({ bg: document.getElementById('nameAvatar').style.backgroundImage, pending: !!pendingMyPhoto, hint: document.querySelector('.name-photo-hint').textContent }));
    ok(/^url\(/.test(well.bg) && well.pending && /pick it again and adjust/.test(well.hint), 'the name sheet shows it, ready to Save, and says how to adjust it again', well);
    await page.screenshot({ path: O + 'saved.png' });

    console.log('== Cancel and Escape keep the photo you had');
    const before = await page.evaluate(() => pendingMyPhoto && pendingMyPhoto.photo);
    await pick(page); await page.waitForSelector('.pa-stage', { timeout: 3000 }).catch(() => {}); await wait(300);
    await page.click('.pa-cancel'); await page.evaluate(() => window.__picked);
    let c = await page.evaluate(() => ({ open: !!document.querySelector('.pa'), n: window.__ups.length, photo: pendingMyPhoto && pendingMyPhoto.photo, busy: uploadingMyPhoto }));
    ok(!c.open && c.n === 1 && c.photo === before && !c.busy, 'Cancel: closed, nothing uploaded, your photo unchanged', c);
    await pick(page); await page.waitForSelector('.pa-stage', { timeout: 3000 }).catch(() => {}); await wait(300);
    await page.keyboard.press('Escape'); await page.evaluate(() => window.__picked);
    c = await page.evaluate(() => ({ open: !!document.querySelector('.pa'), n: window.__ups.length, photo: pendingMyPhoto && pendingMyPhoto.photo, sheet: document.getElementById('nameOverlay').classList.contains('show') }));
    ok(!c.open && c.n === 1 && c.photo === before && c.sheet, 'Escape: the same, and the name sheet stays open', c);
    ok(!page.__errors.length, 'no page errors', page.__errors);
    await ctx.close();
  }

  console.log('== a narrow phone');
  {
    const { ctx, page } = await L.boot(b, { device: 'narrow', name: 'Jose Vazquez', settle: 3500 });
    await setup(page); await wait(300); await pick(page);
    await page.waitForSelector('.pa-stage', { timeout: 3000 }).catch(() => {}); await wait(400);
    const fit = await page.evaluate(() => { const r = document.querySelector('.pa-sheet').getBoundingClientRect(); return { t: r.top, b: r.bottom, l: r.left, r: r.right, vw: innerWidth, vh: innerHeight }; });
    const s = await state(page);
    ok(fit.t >= 0 && fit.b <= fit.vh && fit.r <= fit.vw && s.covers, 'it fits and the photo covers the frame', { fit, s });
    await page.screenshot({ path: O + 'narrow.png' });
    ok(!page.__errors.length, 'no page errors', page.__errors);
    await ctx.close();
  }
  await b.close();
})();
