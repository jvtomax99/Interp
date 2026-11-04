const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport:{ width:300, height:600 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message)); p.on('console', m => { if (m.type()==='error') console.log('ERR', m.text()); });
  await p.goto('http://localhost:8766/docs/mockups/characters/bake.html?glb=tripo/nurse6-full.glb&img=tripo/mask-screen.png&size=4096&bias=0.02&f0=0.25&f1=0.45');
  await p.waitForFunction(() => window.__ready, null, { timeout: 600000 });
  const url = await p.evaluate(() => window.__png); fs.writeFileSync(process.argv[2], Buffer.from(url.split(',')[1], 'base64'));
  await b.close(); })();
