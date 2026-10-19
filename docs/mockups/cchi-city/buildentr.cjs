const { chromium } = require('../../../tests/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname, OUT = process.argv[2];
const srv = http.createServer((q,r)=>{ const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if(!fs.existsSync(f)){r.statusCode=404;return r.end();}
  r.setHeader('Content-Type', f.endsWith('.js')?'text/javascript':f.endsWith('.png')?'image/png':'text/html'); fs.createReadStream(f).pipe(r); }).listen(8127);
(async()=>{
  const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport:{ width:960, height:760 } });
  p.on('pageerror', e=> console.log('ERR', e.message)); p.on('console', m=> console.log('C', m.type(), m.text().slice(0,200)));
  await p.goto('http://localhost:8127/entrance.html?w=960&h=760');
  await p.waitForFunction(()=>window.__done, null, { timeout:60000 });
  const out = await p.evaluate((nolit)=>window.__run(nolit), !!process.env.NOLIT);
  fs.mkdirSync(OUT, { recursive:true }); let total = 0;
  const save = (name, im) => { if(!im) return null; const buf = Buffer.from(im.data.split(',')[1], 'base64'); fs.writeFileSync(path.join(OUT, name), buf); total += buf.length; return [im.x, im.y, im.w, im.h]; };
  const man = { w: out.W, h: out.H, g: save('entrance.webp', out.base), f: out.fountain, drive: out.drive, b:{} };
  for (const k in out.b) man.b[k] = { label: out.b[k].label, box: out.b[k].box, lv: out.b[k].lv.map((im, i) => save(`${k}-lit${i+1}.webp`, im)) };
  if (process.env.NOLIT){ const old = JSON.parse(fs.readFileSync(process.env.NOLIT, 'utf8')); man.b = old.b; }
  const L = out.live; man.live = { clouds: save('clouds.webp', L.clouds), flags: L.flags.map((im,i) => save(`flag${i}.webp`, im)), spray: L.spray.map((im,i) => save(`spray${i}.webp`, im)),
    carIn: { img: save('car-in.webp', L.carIn.img), ref: L.carIn.ref, pts: L.carIn.pts }, carOut: { img: save('car-out.webp', L.carOut.img), ref: L.carOut.ref, pts: L.carOut.pts },
    amb: { img: L.amb.img.map((im,i) => save(`amb${i}.webp`, im)), ref: L.amb.ref, pts: L.amb.pts }, heli: { img: L.heli.img.map((im,i) => save(`heli${i}.webp`, im)), ref: L.heli.ref, pts: L.heli.pts, pad: L.heli.pad } };
  fs.writeFileSync(path.join(OUT, 'entrance.json'), JSON.stringify(man));
  console.log('files', fs.readdirSync(OUT).length, 'bytes', total, 'base', man.g);
  await b.close(); srv.close();
})();
