// Exports the CoreCHI campus (docs/mockups/cchi-city/entrance.html, the
// three.js scene the app's campus pictures were rendered from) as glTF:
// build/campus.glb. Works on a copy in build/campus-src with three@0.160.0
// installed beside it; the mockup itself is never changed.
//   node tools/campus_export.cjs
const { chromium } = require('../../node_modules/playwright');
const { execSync } = require('child_process');
const http = require('http'), fs = require('fs'), path = require('path');
const SRC = path.resolve(__dirname, '../../../../docs/mockups/cchi-city'), WORK = path.resolve(__dirname, '../build/campus-src');
fs.mkdirSync(WORK, { recursive: true });
for (const f of fs.readdirSync(SRC)) if (/\.(html|png)$/.test(f)) fs.copyFileSync(path.join(SRC, f), path.join(WORK, f));
if (!fs.existsSync(path.join(WORK, 'node_modules/three'))) execSync('npm init -y >/dev/null && npm install -s three@0.160.0', { cwd: WORK, stdio: 'inherit' });
let page = fs.readFileSync(path.join(WORK, 'entrance.html'), 'utf8');
const end = page.lastIndexOf('</script>');
page = page.slice(0, end) + `
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
window.__export = async () => { await TEX_LOAD();
  const glb = await new GLTFExporter().parseAsync(scene, { binary: true, onlyVisible: false });
  const u8 = new Uint8Array(glb); let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s); };
` + page.slice(end);
fs.writeFileSync(path.join(WORK, 'export.html'), page);
const srv = http.createServer((q, r) => { const f = path.join(WORK, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f)) { r.statusCode = 404; return r.end(); }
  r.setHeader('Content-Type', f.endsWith('.js') ? 'text/javascript' : f.endsWith('.png') ? 'image/png' : 'text/html'); fs.createReadStream(f).pipe(r); }).listen(8128);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 960, height: 760 } });
  await p.goto('http://localhost:8128/export.html?w=960&h=760');
  await p.waitForFunction(() => window.__done, null, { timeout: 90000 });
  const b64 = await p.evaluate(() => window.__export());
  fs.writeFileSync(path.resolve(WORK, '../campus.glb'), Buffer.from(b64, 'base64'));
  console.log('build/campus.glb:', (fs.statSync(path.resolve(WORK, '../campus.glb')).size / 1e6).toFixed(1), 'MB');
  await b.close(); srv.close();
})().catch(e => { console.error(e.message); process.exit(1); });
