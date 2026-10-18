const L = require('/home/user/Interp/tests/support/harness.cjs');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const O = process.argv[2];
const T = (en, es, def) => ({ en, es, def });
const D = { id: 'promo-doc', name: 'Dr. Elena Marín', specialty: 'Lymphoma · Hematology/Oncology',
  hospitalLocation: 'John Theurer Cancer Center', locationDetails: '4th fl · Suite 401',
  notes: 'Explains staging with a drawing.', updatedBy: 'Maria', source: 'research',
  customTerms: [{ id: 'c1', en: 'port flush', es: 'lavado del port', def: 'Keeps the port open.', addedBy: 'Luis' }, { id: 'c2', en: 'scan day', es: 'día de estudios', def: '' }],
  researchResult: { found: true, specialty: 'Hematology/Oncology', note: '', tiers: [
    { key: 'core', terms: [T('staging', 'estadificación', 'How far the lymphoma has spread, stages I to IV.'), T('remission', 'remisión', 'No signs of disease; not the same as cured.'), T('R-CHOP', 'R-CHOP', 'Standard chemo regimen. Said as letters.')] },
    { key: 'procedures', terms: [T('bone marrow biopsy', 'biopsia de médula ósea', 'Sample taken from the hip bone.'), T('PET scan', 'tomografía PET', 'Imaging that shows active cancer.')] },
    { key: 'drugs', terms: [T('rituximab', 'rituximab', 'Antibody given by infusion.')] },
    { key: 'anatomy', terms: [T('lymph node', 'ganglio linfático', 'Small gland of the immune system.')] },
    { key: 'falsefriends', terms: [T('constipated', 'estreñido', 'Not "constipado", which means a cold.')] } ] } };
(async () => {
  const b = await pw.chromium.launch();
  const { ctx, page } = await L.boot(b, { device: 'iphone', name: 'Jose', settle: 5000 });
  await L.go(page, 'doctor-directory', 1200);
  await page.evaluate(d => { const { id, ...rest } = d; if (window.__DB) window.__DB['doctor-directory'][id] = JSON.parse(JSON.stringify(rest)); DOCTOR_DIRECTORY.push(JSON.parse(JSON.stringify(d))); openDoctorDirDetail(d.id); }, D);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: O + '/doctor.png' });
  await ctx.close(); await b.close();
})();
