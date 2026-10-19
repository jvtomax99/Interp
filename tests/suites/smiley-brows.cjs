// Dr. Smiley's brows (DR_BROWS in index.html): their own pictures over the
// face window, following the face frame, held by a sequence, released after.
const L=require('../support/harness.cjs');
const ok=(c,m)=>{console.log((c?'  PASS ':'  FAIL ')+m);if(!c)process.exitCode=1;};
(async()=>{const b=await L.chromium.launch();const {ctx,page:P}=await L.boot(b,{device:'iphone',settle:6000});
 const files=await P.evaluate(()=>Promise.all(['brow-l','brow-r'].map(n=>new Promise(r=>{const i=new Image();i.onload=()=>r(i.naturalWidth);i.onerror=()=>r(0);i.src='./drsmiley/'+n+'.webp';}))));
 ok(files[0]===130&&files[1]===125,'both brow pictures load: '+JSON.stringify(files));
 ok(await P.evaluate(()=>[...document.querySelectorAll('svg.ds-art')].every(s=>s.querySelectorAll(':scope > .ds-brow').length===2)),'every Dr. Smiley on the page has two brows');
 ok(await P.evaluate(()=>{const s=document.querySelector('svg.ds-art'),k=[...s.children].map(c=>c.getAttribute('class')||'');return k.indexOf('ds-face')<k.indexOf('ds-brow ds-brow-l');}),'brows are drawn over the face window, not under it');
 await P.evaluate(()=>setCategory('translate'));await P.waitForTimeout(2500);
 const free=async()=>{for(let i=0;i<80;i++){if(!(await P.evaluate(()=>drFaceBusy(document.querySelector('.dock-smiley svg.ds-art')))))return;await P.waitForTimeout(100);}};
 const brows=()=>P.evaluate(()=>{const s=document.querySelector('.dock-smiley svg.ds-art');const base=s.querySelector('.ds-base').getBoundingClientRect();const f=c=>{const e=s.querySelector(c),r={top:(e.getBoundingClientRect().top-base.top)*132.5/base.height},m=new DOMMatrix(getComputedStyle(e).transform==='none'?undefined:getComputedStyle(e).transform);return {top:+r.top.toFixed(2),rot:+(Math.atan2(m.b,m.a)*180/Math.PI).toFixed(2),tf:e.style.transform};};return {l:f('.ds-brow-l'),r:f('.ds-brow-r')};});
 await free();await P.evaluate(()=>drAnim(document.querySelector('.dock-smiley svg.ds-art')).stopIdle?.());
 await P.evaluate(()=>drFaceSet(document.querySelector('.dock-smiley svg.ds-art'),'rest'));await P.waitForTimeout(300);
 const rest=await brows();
 ok(rest.l.tf===''&&rest.r.tf==='','at rest the brows sit exactly where he was drawn (no transform)');
 await P.evaluate(()=>drFaceSet(document.querySelector('.dock-smiley svg.ds-art'),'lookU'));await P.waitForTimeout(300);
 const up=await brows();
 ok(up.l.top<rest.l.top-.5&&up.r.top<rest.r.top-.5,'looking up raises both brows: '+JSON.stringify([rest,up]));
 await P.evaluate(()=>drFaceSet(document.querySelector('.dock-smiley svg.ds-art'),'rest'));await P.waitForTimeout(300);
 // A held pose: composed (he's unsure) turns the inner ends up while he looks down.
 const seen=await P.evaluate(()=>new Promise(r=>{const s=document.querySelector('.dock-smiley svg.ds-art'),a=drAnim(s),out=[];a.play('composed',{priority:DR_P.TASK});
   const t0=performance.now();const tick=()=>{const l=s.querySelector('.ds-brow-l').style.transform,f=a.frame();out.push([Math.round(performance.now()-t0),f,l]);if(performance.now()-t0<3400)setTimeout(tick,100);else r(out);};tick();}));
 const look=seen.filter(x=>x[1]==='lookDL');
 ok(look.length&&look.every(x=>/rotate\(-[1-9]/.test(x[2])),'unsure (composed): while he looks down his brows turn up at the middle, caring ('+(look[0]||[]).join(' ')+')');
 ok(seen[seen.length-1][2]==='','after it, the brows go back to following his face: '+seen[seen.length-1].join(' '));
 // Focused: the same pose, smaller.
 await free();
 const amp=await P.evaluate(()=>{const s=document.querySelector('.dock-smiley svg.ds-art'),v=m=>{setSmileyMode(m);s._brow='';drFaceSet(s,'lookU');return parseFloat(s.querySelector('.ds-brow-l').style.transform.split(',')[1]);};const a=v('lively'),b=v('focused');setSmileyMode('lively');drFaceSet(s,'rest');return [a,b];});
 ok(amp[1]<0&&Math.abs(amp[1])<Math.abs(amp[0]),'Focused lifts the brows less: '+JSON.stringify(amp));
 // Still: no gliding.
 const still=await P.evaluate(()=>{const s=document.querySelector('.dock-smiley svg.ds-art');setSmileyMode('still');s._brow='';drFaceSet(s,'lookU');const t=getComputedStyle(s.querySelector('.ds-brow-l')).transitionDuration;setSmileyMode('lively');drFaceSet(s,'rest');return t;});
 ok(still==='0s','Still: the brows change without gliding ('+still+')');
 ok(P.__errors.length===0,'page errors: '+JSON.stringify(P.__errors.slice(0,3)));
 await ctx.close();await b.close();})();
