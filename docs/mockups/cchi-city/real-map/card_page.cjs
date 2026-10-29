// Loads the built real-map preview (build.py's page) in headless Chromium for the card's capture: three.js served from
// ../node_modules (npm install --no-save three@0.160.0), the scene, THREE and the moving things exposed on window.__L,
// and their motion frozen (window.__freeze) so each can be posed by hand.
//   const { open } = require('./card_page.cjs'); const { page, close } = await open(htmlPath, { w, h });
const fs = require('fs'), http = require('http'), path = require('path');
const { chromium } = require('playwright');
const T = path.join(__dirname, '..', 'node_modules', 'three') + '/';
function patch(html){
  const rep = (a, b) => { if (!html.includes(a)) throw new Error('card_page: missing ' + a.slice(0, 60)); html = html.replace(a, b); };
  html = html.replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\//g, '/three/');
  rep('const scene = new THREE.Scene();', 'const scene = new THREE.Scene(); window.__scene = scene; window.__T = THREE;');
  // the card's lot car backs out of one spot on the Visitors Parking garage's top deck: that spot is left empty here
  rep('(SCN.cars.roofs[b.key] || []).forEach(([x, z, a], j) => parkedAt(', '(SCN.cars.roofs[b.key] || []).forEach(([x, z, a], j) => (window.__roofSpots = window.__roofSpots || []).push([b.key, j, x, z, a, y0 + h + 0.22]) && b.key + j === window.__skipRoof || parkedAt(');
  rep('if (!REDUCE) life(t);', 'if (!REDUCE && !window.__freeze) life(t);');
  rep('life(0); if (!APP)', `window.__L = { CAR_IN, CAR_OUT, AMB, HELI, CAR_IN2, STREET, BACKCARS, BACKWALKS, WALKS, SITTERS, IDLE, BIRDS, FLAGS, CLOUDS, SPR, petals, BAY_DOORS, bayDoors, ambLights, waveFlags, fountain, flap, stride, along, PAD, BOX, BG, LABEL_AT, cam, scene, renderer, vehicle, person, sitter, BLD, setHour, BUILT, BX0, BX1, BZ0, BZ1, SCN, turnHead };
life(0); if (!APP)`);
  return html;
}
async function open(file, { w = 960, h = 840, query = '', skipRoof = '' } = {}){
  const html = patch(fs.readFileSync(file, 'utf8'));
  const srv = http.createServer((q, r) => { const u = q.url.split('?')[0];
    if (u === '/'){ r.setHeader('Content-Type', 'text/html'); return r.end(html); }
    if (u.startsWith('/three/')){ const f = T + u.slice(7); if (fs.existsSync(f)){ r.setHeader('Content-Type', 'text/javascript'); return fs.createReadStream(f).pipe(r); } }
    r.statusCode = 404; r.end(); });
  await new Promise(res => srv.listen(0, res));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await b.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', e => console.log('ERR', e.message));
  await page.addInitScript(k => { window.__skipRoof = k; }, skipRoof);
  await page.goto(`http://localhost:${srv.address().port}/?${query}`);
  await page.waitForFunction(() => document.body.classList.contains('ready') && window.__L, null, { timeout: 300000 });
  return { page, close: async () => { await b.close(); srv.close(); } };
}
module.exports = { open, patch };
