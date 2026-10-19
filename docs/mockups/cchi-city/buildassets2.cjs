const { chromium } = require('../../../tests/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname, OUT = process.argv[2];
const srv = http.createServer((q,r)=>{ const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if(!fs.existsSync(f)){r.statusCode=404;return r.end();}
  r.setHeader('Content-Type', f.endsWith('.js')?'text/javascript':f.endsWith('.png')?'image/png':'text/html'); fs.createReadStream(f).pipe(r); }).listen(8126);
(async()=>{
  const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport:{ width:960, height:960 } });
  p.on('pageerror', e=> console.log('ERR', e.message)); p.on('console', m=> m.type()==='error' && console.log('console', m.text()));
  await p.goto('http://localhost:8126/humc2.html?w=960&h=960');
  await p.waitForFunction(()=>window.__done, null, { timeout:60000 });
  const out = await p.evaluate(()=>window.__run());
  fs.mkdirSync(OUT, { recursive:true });
  let total = 0;
  const save = (name, im) => { if(!im) return null; const buf = Buffer.from(im.data.split(',')[1], 'base64'); fs.writeFileSync(path.join(OUT, name), buf); total += buf.length; return { f:name, x:im.x, y:im.y, w:im.w, h:im.h }; };
  const man = { w: out.W, h: out.H, base: save('ground.webp', out.base), b:{}, fountain: out.fountain };
  for (const k in out.b) man.b[k] = out.b[k].map(o => ({ lv:o.lv, img: save(`${k}${o.lv}.webp`, o.img), sh: save(`${k}${o.lv}-sh.webp`, o.sh), label:o.label }));
  for (const c of ['carE','carW']) man[c] = { img: save(c + '.webp', out[c].img), at: out[c].at, from: out[c].from, to: out[c].to };
  fs.writeFileSync(path.join(OUT, 'city.json'), JSON.stringify(man));
  console.log('files', fs.readdirSync(OUT).length, 'bytes', total);
  await b.close(); srv.close();
})();
