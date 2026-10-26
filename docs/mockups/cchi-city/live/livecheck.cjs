// load the live page locally (three from node_modules instead of the CDN), phone size, report errors, fps, screenshot
const http=require('http'),fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const html=fs.readFileSync('live/campus-live.html','utf8').replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\//g,'/three/');
const T='/home/user/Interp/docs/mockups/cchi-city/node_modules/three/';
const srv=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);if(u==='/'){r.setHeader('Content-Type','text/html');return r.end('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'+html+'</body></html>');}
 if(u.startsWith('/three/')){const f=T+u.slice(7);if(fs.existsSync(f)){r.setHeader('Content-Type','text/javascript');return fs.createReadStream(f).pipe(r);}}r.statusCode=404;r.end();}).listen(0,async()=>{
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true});
 p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('CON',m.text().slice(0,200))});
 await p.goto(`http://localhost:${srv.address().port}/`);await p.waitForFunction(()=>document.body.classList.contains('ready'),null,{timeout:180000}).catch(e=>console.log('not ready'));
 await p.waitForTimeout(4000);console.log(await p.evaluate(()=>document.getElementById('fps').textContent+' '+document.getElementById('draws').textContent+' | '+document.getElementById('loading').textContent));
 await p.screenshot({path:'live/shot-rest.png'});
 // tap the dark stepped building's badge, set night, lower progress
 await p.evaluate(()=>{document.querySelector('.badge[data-k="c"]').click();const h=document.getElementById('hour');h.value=22;h.dispatchEvent(new Event('input'));const g=document.getElementById('prog');g.value=35;g.dispatchEvent(new Event('input'));});
 await p.waitForTimeout(2500);await p.screenshot({path:'live/shot-night.png'});
 // a drag to spin
 await p.mouse.move(200,400);await p.mouse.down();for(let i=0;i<12;i++){await p.mouse.move(200-i*14,400);}await p.mouse.up();await p.waitForTimeout(2000);
 await p.evaluate(()=>{const h=document.getElementById('hour');h.value=12;h.dispatchEvent(new Event('input'));});await p.waitForTimeout(1500);await p.screenshot({path:'live/shot-spin.png'});
 await b.close();srv.close();});
