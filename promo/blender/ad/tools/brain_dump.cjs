// Reads the HUMC Brain's real layout out of brain/index.html: node positions,
// tracts, the surface cloud, group names and colours -> build/brain_scene.json.
// The page keeps them inside a closure; this serves a copy whose one exported
// line also hands those out. The app's file is never changed.
//   node tools/brain_dump.cjs
const { chromium } = require('../../node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const REPO = path.resolve(__dirname, '../../../..'), OUT = path.resolve(__dirname, '../build');
const srv = http.createServer((q, r) => { const f = path.join(REPO, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f)) { r.statusCode = 404; return r.end(); }
  r.setHeader('Content-Type', f.endsWith('.js') ? 'text/javascript' : f.endsWith('.json') ? 'application/json' : 'text/html'); fs.createReadStream(f).pipe(r); }).listen(8132);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  await p.route('**/brain/index.html', async r => { const res = await r.fetch(); let body = await res.text();
    const line = 'window.BRAIN = { nodes, edges, DATA };';
    if (!body.includes(line)) throw new Error('brain/index.html changed: update tools/brain_dump.cjs');
    r.fulfill({ response: res, body: body.replace(line, 'window.BRAIN = { nodes, edges, DATA, pos, SHELL_P, SHELL_C, GROUPS, ORDER };') }); });
  await p.goto('http://localhost:8132/brain/index.html');
  await p.waitForFunction(() => window.BRAIN && window.BRAIN.pos, null, { timeout: 30000 });
  const out = await p.evaluate(() => { const { nodes, edges, pos, SHELL_P, SHELL_C, GROUPS, ORDER } = window.BRAIN; return {
    pos, shellP: Array.from(SHELL_P), shellC: Array.from(SHELL_C), groups: GROUPS, order: ORDER,
    nodes: nodes.map(n => ({ i: n.i, title: n.title, bytes: n.bytes, group: n.group })),
    edges: edges.map(e => ({ a: e.a, b: e.b, w: e.w, c: [e.c.x, e.c.y, e.c.z] })) }; });
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'brain_scene.json'), JSON.stringify(out));
  console.log('build/brain_scene.json:', out.pos.length, 'nuclei,', out.edges.length, 'tracts,', out.shellP.length / 3, 'surface points');
  await b.close(); srv.close();
})().catch(e => { console.error(e.message); process.exit(1); });
