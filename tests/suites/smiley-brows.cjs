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
 const look=seen.filter(x=>x[1]==='sad');
 ok(look.length&&look.every(x=>/rotate\(-[1-9]/.test(x[2])),'unsure (composed): while he looks down his brows turn up at the middle, caring ('+(look[0]||[]).join(' ')+')');
 ok(seen[seen.length-1][2]==='','after it, the brows go back to following his face: '+seen[seen.length-1].join(' '));
 // Focused: the same pose, smaller.
 await free();
 const amp=await P.evaluate(async()=>{const s=document.querySelector('.dock-smiley svg.ds-art'),w=ms=>new Promise(r=>setTimeout(r,ms)),v=async m=>{setSmileyMode(m);s._brow='';s._browLift=0;drFaceSet(s,'lookU');await w(150);return parseFloat(s.querySelector('.ds-brow-l').style.transform.split(',')[1]);};const a=await v('lively'),b=await v('focused');setSmileyMode('lively');drFaceSet(s,'rest');return [a,b];});
 ok(amp[1]<0&&Math.abs(amp[1])<Math.abs(amp[0]),'Focused lifts the brows less: '+JSON.stringify(amp));
 // Still: no gliding.
 const still=await P.evaluate(()=>{const s=document.querySelector('.dock-smiley svg.ds-art');setSmileyMode('still');s._brow='';drFaceSet(s,'lookU');const t=getComputedStyle(s.querySelector('.ds-brow-l')).transitionDuration;setSmileyMode('lively');drFaceSet(s,'rest');return t;});
 ok(still==='0s','Still: the brows change without gliding ('+still+')');
 // The Disney touches: follow-through, no twins, anticipation.
 await P.waitForTimeout(200);
 const ease=await P.evaluate(()=>{const c=getComputedStyle(document.querySelector('.dock-smiley .ds-brow-l'));return [c.transitionTimingFunction,c.transitionDelay];});
 ok(/1\.45/.test(ease[0])&&ease[1]==='0.03s','follow-through: the brows start a beat after the eyes and overshoot before settling '+JSON.stringify(ease));
 const take=await P.evaluate(async()=>{const s=document.querySelector('.dock-smiley svg.ds-art'),w=ms=>new Promise(r=>setTimeout(r,ms)),y=c=>parseFloat(s.querySelector(c).style.transform.split(',')[1]||0);
   s._brow='';s._browLift=0;drFaceSet(s,'rest');await w(50);drFaceSet(s,'lookU');const dip=y('.ds-brow-l');await w(150);const l=y('.ds-brow-l'),r=y('.ds-brow-r');drFaceSet(s,'rest');return {dip,l,r};});
 ok(take.dip>0&&take.l<0,'anticipation: a big raise dips first, then goes up '+JSON.stringify(take));
 ok(take.r<take.l,'no twins: his expressive brow (your right) goes further than the other '+JSON.stringify(take));
 ok(await P.evaluate(()=>{const g=DR_FACE_SEQ.greet;return !!(g.brow&&g.brow.some(b=>b[1]==='up')&&g.brow.some(b=>b[1]===null));}),'hello: an eyebrow flash, then the brows follow his face again');
 ok(await P.evaluate(()=>{const t=DR_FACE_SEQ.think;return !!(t.brow&&t.brow.some(b=>b[1]==='focused')&&t.brow.some(b=>b[1]==='up'));}),'thinking: brows knit as he starts, an "aha" lift as it lands');
 await free();
 const pet=await P.evaluate(()=>new Promise(r=>{const s=document.querySelector('.dock-smiley svg.ds-art'),a=drAnim(s);a.play('pet',{priority:DR_P.DIRECT});setTimeout(()=>r({f:a.frame(),hold:s._browHold}),220);}));
 ok(pet.f==='surprised'&&pet.hold==='up','held: a startled take (eyes and brows up) before the giggle '+JSON.stringify(pet));
 await free();
 const off=await P.evaluate(()=>new Promise(r=>{window.dispatchEvent(new Event('offline'));setTimeout(()=>{const s=document.querySelector('.dock-smiley svg.ds-art'),a=drAnim(s);const out={run:a.run&&a.run.name,hold:s._browHold};window.dispatchEvent(new Event('online'));r(out);},400);}));
 ok(off.run==='worry'&&off.hold==='worried','the connection drops: he looks worried, then reassuring '+JSON.stringify(off));
 // E2: the drawn faces, each where it belongs.
 const uses=await P.evaluate(()=>{const has=(n,f)=>DR_FACE_SEQ[n].f.some(x=>x[0]===f);return {surprise:has('surprise','surprised'),pet:has('pet','surprised'),worry:has('worry','worried'),general:has('answerGeneral','doubt'),composed:has('composed','sad'),sadOnce:Object.keys(DR_FACE_SEQ).filter(n=>{try{return DR_FACE_SEQ[n].f.some(x=>x[0]==='sad');}catch(e){return false;}}),brows:['surprised','sad','worried','doubt'].map(f=>DR_BROW_OF[f])};});
 ok(uses.surprise&&uses.pet&&uses.worry&&uses.general&&uses.composed,'the drawn faces: surprised (surprise, the startled take), worried (worry), doubt (a general answer), sad (composed) '+JSON.stringify(uses));
 ok(uses.sadOnce.length===1,'sad stays rare: one sequence uses it '+JSON.stringify(uses.sadOnce));
 ok(uses.brows.join()==='up,caring,worried,doubt','each drawn face brings its brow pose '+JSON.stringify(uses.brows));
 // E4: each drawn face stays long enough to see (Jose couldn't find them).
 const holds=await P.evaluate(()=>{const ms=(n,f)=>Math.max(0,...DR_FACE_SEQ[n].f.filter(x=>x[0]===f).map(x=>x[1]));drPerfSeed(3);const o={pet:ms('pet','surprised'),surprise:ms('surprise','surprised'),worry:ms('worry','worried'),general:ms('answerGeneral','doubt'),composed:ms('composed','sad'),wince:ms('wince','worried'),wow:ms('wow','surprised')};drPerfSeed(null);return o;});
 ok(holds.surprise>=1000&&holds.worry>=1000&&holds.general>=1000&&holds.composed>=1000&&holds.wow>=900,'each drawn face holds about a second '+JSON.stringify(holds));
 ok(holds.pet>=600&&holds.wince>=550,'the quick ones (the startled take, the quiz wince) at least 0.55 s '+JSON.stringify(holds));
 const wow=await P.evaluate(()=>{const w=DR_FACE_SEQ.wow,f=w.f.map(x=>x[0]);return {first:f.indexOf('surprised'),laugh:f.indexOf('laugh'),up:(w.brow||[])[0],squash:w.squash,tone:DR_TONE.appointment.wow};});
 ok(wow.first>=0&&wow.first<3&&wow.laugh>wow.first&&wow.up[1]==='up'&&wow.tone==='ack','a streak milestone: the surprised take first, then the cheer (an ack in an appointment) '+JSON.stringify(wow));
 ok(P.__errors.length===0,'page errors: '+JSON.stringify(P.__errors.slice(0,3)));
 await ctx.close();await b.close();})();
