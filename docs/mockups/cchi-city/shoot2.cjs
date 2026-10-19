const { chromium } = require('../../../tests/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname;
const srv = http.createServer((q,r)=>{ const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if(!fs.existsSync(f)){r.statusCode=404;return r.end();} r.setHeader('Content-Type', f.endsWith('.js')?'text/javascript':f.endsWith('.png')?'image/png':'text/html'); fs.createReadStream(f).pipe(r); }).listen(8123);
(async()=>{
  const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport:{ width:1080, height:1080 } });
  p.on('console', m=> console.log('console', m.text())); p.on('pageerror', e=> console.log('err', e.message));
  await p.goto('http://localhost:8123/humc.html?' + (process.argv[2]||''));
  await p.waitForFunction(()=>window.__done, null, { timeout:120000 });
  console.log('LABELS', JSON.stringify(await p.evaluate(()=>({l:window.__labels}))));
  await p.screenshot({ path: path.join(root, process.argv[3]||'city.png'), omitBackground:true });
  await b.close(); srv.close();
})();
