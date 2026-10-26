// Builds city/*.webp and the campus manifest from diorama.html (the floating pastel board, 2026-10-26).
// node builddiorama.cjs <outdir>; then paste <outdir>/entrance.json into CAMPUS_MAP (features/campus.js).
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require(fs.existsSync(path.join(__dirname, '../../../tests/node_modules/playwright')) ? '../../../tests/node_modules/playwright' : 'playwright');
const root = __dirname, OUT = process.argv[2];
const srv = http.createServer((q,r)=>{ const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if(!fs.existsSync(f)){r.statusCode=404;return r.end();}
  r.setHeader('Content-Type', f.endsWith('.js')?'text/javascript':f.endsWith('.png')?'image/png':'text/html'); fs.createReadStream(f).pipe(r); }).listen(8128);
(async()=>{
  const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport:{ width:960, height:840 } });
  p.on('pageerror', e=> console.log('ERR', e.message)); p.on('console', m=> console.log('C', m.type(), m.text().slice(0,200)));
  await p.goto('http://localhost:8128/diorama.html?w=960&h=840');
  await p.waitForFunction(()=>window.__done, null, { timeout:120000 });
  const out = await p.evaluate((nolit)=>window.__run(nolit), !!process.env.NOLIT);
  fs.mkdirSync(OUT, { recursive:true }); let total = 0;
  const save = (name, im) => { if(!im) return null; const buf = Buffer.from(im.data.split(',')[1], 'base64'); fs.writeFileSync(path.join(OUT, name), buf); total += buf.length; return [im.x, im.y, im.w, im.h]; };
  const man = { w: out.W, h: out.H, g: save('entrance.webp', out.base), f: out.fountain, drive: out.drive, b:{} };
  // the depth layers for the parallax (F3): sky at the back, the town and skyline, the campus in front
  man.layers = { sky: save('sky.webp', out.layers.sky), far: save('far.webp', out.layers.far), near: save('near.webp', out.layers.near) };
  for (const k in out.b) man.b[k] = { label: out.b[k].label, box: out.b[k].box, lv: out.b[k].lv.map((im, i) => save(`${k}-paint${i+1}.webp`, im)), gl: (out.b[k].gl || []).map((im, i) => save(`${k}-glow${i+1}.webp`, im)) };
  if (process.env.NOLIT){ const old = JSON.parse(fs.readFileSync(process.env.NOLIT, 'utf8')); man.b = old.b; }
  const L = out.live; man.live = { clouds: save('clouds.webp', L.clouds), flags: L.flags.map((im,i) => save(`flag${i}.webp`, im)), spray: L.spray.map((im,i) => save(`spray${i}.webp`, im)),
    carIn: { img: save('car-in.webp', L.carIn.img), ref: L.carIn.ref, pts: L.carIn.pts }, carOut: { img: save('car-out.webp', L.carOut.img), ref: L.carOut.ref, pts: L.carOut.pts },
    amb: { img: L.amb.img.map((im,i) => save(`amb${i}.webp`, im)), ref: L.amb.ref, pts: L.amb.pts }, carIn2: { img: save('car-in2.webp', L.carIn2.img), ref: L.carIn2.ref, pts: L.carIn2.pts },
    street: L.street.map((o,i) => ({ img: save(`street${i}.webp`, o.img), ref: o.ref, pts: o.pts, dur: o.dur })),
    bay: L.bay.map((im,i) => save(`bay${i}.webp`, im)), lot: { img: L.lot.img.map((im,i) => save(`lot${i}.webp`, im)), ref: L.lot.ref, pts: L.lot.pts, ref2: L.lot.ref2, pts2: L.lot.pts2 },
    sitters: L.sitters.map((o,i) => ({ img: o.img.map((im,f) => save(`sit${i}-${f}.webp`, im)) })), birds: { img: L.birds.img.map((im,i) => save(`birds${i}.webp`, im)), ref: L.birds.ref, pts: L.birds.pts },
    walkers: L.walkers.map((o,i) => ({ img: o.img.map((im,f) => save(`walk${i}-${f}.webp`, im)), ref: o.ref, pts: o.pts, dur: o.dur })), heli: { img: L.heli.img.map((im,i) => save(`heli${i}.webp`, im)), ref: L.heli.ref, pts: L.heli.pts, pad: L.heli.pad } };
  // the people about and the cranes: one picture each (the atlas), its size, and per item its box and frame cells
  man.live.idlers = { atlas: save('idlers.webp', L.idlers.atlas), items: L.idlers.items };
  man.live.cranes = { atlas: save('cranes.webp', L.cranes.atlas), items: L.cranes.items };
  fs.writeFileSync(path.join(OUT, 'entrance.json'), JSON.stringify(man));
  console.log('files', fs.readdirSync(OUT).length, 'bytes', total, 'base', man.g);
  await b.close(); srv.close();
})();
