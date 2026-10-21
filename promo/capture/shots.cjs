/* Fresh phone screenshots of the app for the promo, taken with the test
   harness (tests/support: Firebase and the AI stood in for, nothing real
   touched). Run from the repo root: node promo/capture/shots.cjs
   Writes promo/public/shots/<name>.jpg at iPhone size (393 x 759, 3x). */
const path = require('path');
const { execFileSync } = require('child_process');
const fs = require('fs');
const { chromium, boot, go } = require('../../tests/support/harness.cjs');
const OUT = path.resolve(__dirname, '../public/shots') + '/';
const T = (en, es, def) => ({ en, es, def });
const DOCTOR = { id: 'promo-doc', name: 'Dr. Elena Marín', specialty: 'Cardiology',
  hospitalLocation: 'Heart & Vascular Hospital', locationDetails: '3rd fl · Suite 310',
  notes: 'Draws the heart for every patient.', updatedBy: 'Maria', source: 'research', customTerms: [],
  researchResult: { found: true, specialty: 'Cardiology', note: '', tiers: [
    { key: 'core', terms: [T('heart failure', 'insuficiencia cardíaca', 'The heart does not pump as well as it should.'), T('ejection fraction', 'fracción de eyección', 'Share of blood pumped out with each beat.'), T('atrial fibrillation', 'fibrilación auricular', 'Irregular, often rapid heart rhythm.')] },
    { key: 'procedures', terms: [T('echocardiogram', 'ecocardiograma', 'Ultrasound of the heart.'), T('cardiac catheterization', 'cateterismo cardíaco', 'A thin tube is guided to the heart.')] },
    { key: 'drugs', terms: [T('beta-blocker', 'betabloqueador', 'Slows the heart and lowers blood pressure.')] },
    { key: 'anatomy', terms: [T('left ventricle', 'ventrículo izquierdo', 'The main pumping chamber.')] },
    { key: 'falsefriends', terms: [T('heart failure', 'fallo cardíaco', 'Avoid with patients; say insuficiencia cardíaca.')] } ] } };
const CHAT = [['Maria', 'Anyone free for 4 West? Spanish, discharge teaching.', 34], ['Luis', 'On my way, 5 min.', 31],
  ['Ana', 'Heads up: Dr. Marín says "EF" a lot. Fracción de eyección.', 18], ['Jose', 'Added it to the glossary 👍', 15],
  ['Maria', 'Thank you! 🙏', 12]];

(async () => {
  const browser = await chromium.launch();
  const { page } = await boot(browser, { device: 'iphone', settle: 6000,
    init: () => { try { localStorage.setItem('ih_region', 'north'); } catch (e) {} } });
  const shot = async (name, wait = 900) => {
    await page.waitForTimeout(wait);
    const png = OUT + name + '.png';
    await page.screenshot({ path: png });
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-q:v', '3', OUT + name + '.jpg']);
    fs.unlinkSync(png); console.log('  shot', name);
  };
  await page.evaluate(([d, chat]) => {
    const { id, ...rest } = d;
    if (window.__DB) window.__DB['doctor-directory'][id] = JSON.parse(JSON.stringify(rest));
    if (!DOCTOR_DIRECTORY.some(x => x.id === id)) DOCTOR_DIRECTORY.push(JSON.parse(JSON.stringify(d)));
    const now = Date.now();
    chat.forEach(([author, text, min], i) => db.collection('team-chat').doc('p' + i).set({ text, author, timestamp: now - min * 60000, replyTo: null, attachment: null }));
  }, [DOCTOR, CHAT]);

  await go(page, 'home', 2500); await shot('home', 3500);
  await go(page, 'er', 1200); await shot('glossary');
  await go(page, 'translate', 1200);
  await page.fill('#trInput', 'heart failure');
  await page.evaluate(() => runTranslate()); await shot('translate', 2500);
  await go(page, 'home', 800);
  await page.evaluate(i => openDoctorDirDetail(i), DOCTOR.id); await shot('doctor', 1500);
  await page.evaluate(() => { const m = document.getElementById('doctorDirDetailModal'); if (m) m.remove(); });
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(5000);
  await go(page, 'falsefriends', 1200); await shot('falsefriends');
  await go(page, 'home', 800); await page.evaluate(() => openWarmupSheet()); await shot('drill', 2000);
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(5000);
  await go(page, 'practice', 1500); await shot('practice', 2500);
  await go(page, 'chat', 1500); await shot('chat', 1500);
  await go(page, 'ask', 1500); await shot('ask', 1500);
  console.log('errors:', page.__errors.slice(0, 5));
  await browser.close();
})();
