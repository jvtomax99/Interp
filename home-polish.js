/* Local presentation only. Each copied tool keeps its existing app action. */
(() => {
  let hasWavedHello = false;

  /* Approved hello sequence: sixteen original logo squares converge before
     the gold hand enters. Each run owns its animation and cleanup. */
  const mark = new Image();
  mark.src = './hmh-mark.png';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const TAU = Math.PI * 2;
  let stopGreeting = () => {};
  let requestId = 0;
  let activeSequence = null, startupTimer = 0;

  const encouragements=[
    'You’ve got this!', 'You make a difference.', 'Your kindness matters.',
    'One step at a time.', 'You bring people closer.', 'Your voice matters.',
    'Keep being you.', 'Small wins count.', 'You belong here.',
    'Your care makes a difference.', 'You help people feel heard.', 'You’re appreciated.'
  ];
  let previousMessage=-1;
  function chooseMessage(){
    let next=Math.floor(Math.random()*(encouragements.length-1));
    if(next>=previousMessage)next++;
    if(previousMessage<0)next=Math.floor(Math.random()*encouragements.length);
    previousMessage=next;
    return encouragements[next];
  }
  function buildThought(bubble){
    const source=document.createElement('canvas');source.width=source.height=288;
    const c=source.getContext('2d');
    c.font='192px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    c.textBaseline='top';c.fillText('💭',32,16);
    const pixels=c.getImageData(0,0,288,288).data,seen=new Uint8Array(288*288);
    const queue=new Int32Array(288*288),parts=[];
    for(let seed=0;seed<seen.length;seed++){
      if(seen[seed]||pixels[seed*4+3]<12)continue;
      let head=0,tail=1,minX=288,minY=288,maxX=0,maxY=0;
      queue[0]=seed;seen[seed]=1;
      while(head<tail){
        const v=queue[head++],x=v%288,y=Math.floor(v/288);
        minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
        for(const n of [x>0?v-1:-1,x<287?v+1:-1,y>0?v-288:-1,y<287?v+288:-1]){
          if(n>=0&&!seen[n]&&pixels[n*4+3]>=12){seen[n]=1;queue[tail++]=n;}
        }
      }
      if(tail>12)parts.push({x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1,size:tail,indices:queue.slice(0,tail)});
    }
    parts.sort((a,b)=>b.size-a.size);
    const targets=[bubble.querySelector('.home-wave-cloud'),bubble.querySelector('.home-wave-dot-near'),bubble.querySelector('.home-wave-dot-far')];
    targets.forEach((target,i)=>{
      const part=parts[i];target.width=part?part.w:20;target.height=part?part.h:20;
      const out=target.getContext('2d');
      if(part){
        const isolated=out.createImageData(part.w,part.h);
        for(const v of part.indices){
          const dst=((Math.floor(v/288)-part.y)*part.w+(v%288-part.x))*4;
          isolated.data.set(pixels.subarray(v*4,v*4+4),dst);
        }
        out.putImageData(isolated,0,0);
      }
      else{out.fillStyle='#f5f7ff';out.beginPath();out.ellipse(10,10,9,8,0,0,Math.PI*2);out.fill();}
    });
  }

  function createThought(button, text){
    const hero=button.closest('.home-greeting');
    const bubble=document.createElement('span');
    bubble.className='home-wave-thought';bubble.setAttribute('aria-hidden','true');
    const cloud=document.createElement('canvas');cloud.className='home-wave-cloud';
    const near=document.createElement('canvas');near.className='home-wave-dot home-wave-dot-near';
    const far=document.createElement('canvas');far.className='home-wave-dot home-wave-dot-far';
    const message=document.createElement('span');message.className='home-wave-message';message.textContent=text || chooseMessage();
    bubble.append(cloud,near,far,message);
    // Escape the greeting card's clipping and backdrop-filter layers.
    document.body.appendChild(bubble);
    buildThought(bubble);
    const b=button.getBoundingClientRect();
    const left=Math.max(8,Math.min(b.left+88,document.documentElement.clientWidth-144));
    bubble.style.left=(left+window.scrollX)+'px';
    bubble.style.top=(b.top+window.scrollY-10)+'px';
    let announced=0,expire=0;
    const status=hero.querySelector('.home-wave-status');
    return {bubble,announce(delay){announced=setTimeout(()=>{if(status)status.textContent=message.textContent;},delay);},
      expire(fn){expire=setTimeout(fn,6500);},
      remove(){clearTimeout(announced);clearTimeout(expire);bubble.remove();if(status)status.textContent='';}};
  }

  async function playGreeting(button, resume = null){
    clearTimeout(startupTimer);
    stopGreeting();
    activeSequence=resume;
    const request = ++requestId;
    lastWaveAt = Date.now();
    if(document.hidden || !button.isConnected) return;
    if(reduced.matches || !button.animate){
      const thought=createThought(button);
      thought.bubble.style.opacity='1';thought.announce(0);
      const width=window.innerWidth;
      const resizeStop=()=>{if(window.innerWidth!==width)stop();};
      const stop=()=>{thought.remove();window.removeEventListener('resize',resizeStop);if(stopGreeting===stop)stopGreeting=()=>{};};
      stopGreeting=stop;thought.expire(stop);window.addEventListener('resize',resizeStop,{passive:true});
      return;
    }
    button.classList.add('home-wave-pending');
    try {
      await Promise.all([mark.decode(), button.querySelector('.home-wave-art').decode()]);
    } catch(e) { if(request===requestId){activeSequence=null;button.classList.remove('home-wave-pending');}return; } // Keep the static hand when artwork is unavailable.
    if(request !== requestId || !button.isConnected || reduced.matches || document.hidden){
      if(request === requestId)button.classList.remove('home-wave-pending');
      return;
    }
    const hero = button.closest('.home-greeting');
    if(!hero) return;
    const art = button.querySelector('.home-wave-pin');
    const halo = button.querySelector('.home-wave-halo');
    const canvas = document.createElement('canvas');
    canvas.className = 'home-wave-canvas';
    canvas.setAttribute('aria-hidden','true');
    const ctx = canvas.getContext('2d');
    if(!ctx) return;
    hero.appendChild(canvas);
    const sequence=resume || {elapsed:0,message:chooseMessage()};
    activeSequence=sequence;
    const thought=createThought(button,sequence.message);
    let frame=0, animations=[], observer;
    const width=window.innerWidth;
    const resizeStop=()=>{if(window.innerWidth!==width)stop();};
    function stop(){
      cancelAnimationFrame(frame);
      button.classList.remove('home-wave-pending');
      if(activeSequence===sequence)activeSequence=null;
      animations.forEach(a=>{a.onfinish=null;a.cancel();});
      animations=[];
      canvas.remove();
      thought.remove();
      if(observer)observer.disconnect();
      window.removeEventListener('resize',resizeStop);
      if(stopGreeting===stop)stopGreeting=()=>{};
    }
    stopGreeting=stop;
    window.addEventListener('resize',resizeStop,{passive:true});
    observer=new IntersectionObserver(entries=>{
      if(!entries[0].isIntersecting)stop();
    });
    observer.observe(button);
    function animate(el,frames,options){
      const a=el.animate(frames,options);
      // Canvas and every DOM effect advance together, including after a stall.
      a.pause();
      a.currentTime=sequence.elapsed;
      animations.push(a);return a;
    }
    const box=hero.getBoundingClientRect(), b=button.getBoundingClientRect();
    const w=box.width,h=box.height,cx=b.left-box.left+b.width/2,cy=b.top-box.top+b.height/2;
    const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    // Separate the spring entrance from the greeting. Sample a continuous
    // wrist swing so each reversal is smooth, with smaller final waves.
    const waveFrames=Array.from({length:161},(_,i)=>{
      const time=i/160*2300;
      let angle=8,sx=1,sy=1,x=0,y=0,opacity=1;
      if(time<440){
        const p=time/440;
        const spring=1-Math.exp(-6*p)*Math.cos(8*p);
        const settle=Math.sin(Math.PI*p);
        sx=.08+.92*spring+.09*settle;
        sy=.08+.92*spring-.07*settle;
        angle=8-22*(1-p)*(1-p);
        y=8*(1-p)-6*Math.sin(Math.PI*p);
        opacity=Math.min(1,p*5);
      }else{
        const p=(time-440)/1860;
        const easeIn=Math.sin(Math.min(1,p/.075)*Math.PI/2);
        const envelope=easeIn*Math.pow(1-p,.8);
        const swing=Math.sin(TAU*3.15*p);
        const hop=Math.pow(Math.sin(Math.PI*2*p),2)*Math.pow(1-p,1.5);
        angle=8+31*swing*envelope;
        x=1.8*swing*envelope;y=-4.5*hop;
        sx=1+.035*Math.abs(swing)*envelope;
        sy=1-.025*Math.abs(swing)*envelope;
      }
      return {offset:i/160,opacity,transform:`translate3d(${x}px,${y}px,0) rotate(${angle}deg) scale(${sx},${sy})`};
    });
    animate(art,waveFrames,{duration:2300,delay:2280,fill:'backwards',easing:'linear'});
    let messageAnnounced=false;
    animate(thought.bubble,[
      {opacity:0,transform:'translate(-4px,5px) rotate(-9deg) scale(.55,.7)'},
      {opacity:1,transform:'translate(0,-2px) rotate(3deg) scale(1.08,.95)',offset:0.048462},
      {opacity:1,transform:'translate(0,0) rotate(-1deg) scale(.99,1.025)',offset:0.075385},
      {opacity:1,transform:'translate(0,0) rotate(0deg) scale(1)',offset:0.113077},
      {opacity:1,transform:'translate(0,-3px) rotate(1deg) scale(1)',offset:0.258462},
      {opacity:1,transform:'translate(0,0) rotate(-1deg) scale(1)',offset:0.387692},
      {opacity:1,transform:'translate(0,-1px) rotate(0deg) scale(1)',offset:0.946154},
      {opacity:0,transform:'translate(0,-7px) rotate(5deg) scale(.9)'}
    ],{duration:6500,delay:2780,easing:'ease-in-out'});
    animate(halo,[{transform:'scale(.6)',opacity:0},{transform:'scale(1.05)',opacity:.45,offset:.55},{transform:'scale(1.7)',opacity:1,offset:.7},{transform:'scale(.85)',opacity:.35}],{duration:3500,easing:'ease-in-out'});
    animate(button.querySelector('.home-wave-shine'),[{opacity:0,backgroundPosition:'100% 0'},{opacity:.65,offset:.3},{opacity:0,backgroundPosition:'0% 0'}],{duration:950,delay:2610,easing:'ease-in-out'});
    button.querySelectorAll('.home-wave-glint').forEach((el,i)=>animate(el,[{opacity:0,transform:'scale(.3) rotate(-25deg)'},{opacity:.85,transform:'scale(1.05) rotate(15deg)',offset:.4},{opacity:0,transform:'scale(.5) rotate(35deg)'}],{duration:600,delay:2840+i*550}));
    // Connected-component bounds of the sixteen actual squares in the
    // original 314 x 261 brand asset, including its diagonal squares.
    const squareBounds=[[60,0,113,53],[152,9,193,44],[109,45,151,78],[54,55,107,108],[152,55,205,108],[207,61,259,113],[9,67,43,109],[44,109,78,151],[182,109,216,151],[0,147,52,200],[217,152,251,194],[54,153,107,206],[152,153,205,206],[109,182,151,216],[147,207,199,261],[66,217,108,251]];
    const logoSize=74;
    const shards=squareBounds.map((bounds,i)=>{
      const [l,t,r,b]=bounds;
      const x=((l+r)/2-129.5)*logoSize/261,y=((t+b)/2-130.5)*logoSize/261;
      return {bounds,x,y,index:i,angle:Math.atan2(y,x),reach:95+(i%5)*12,spin:(i%2?1:-1)*(Math.PI*1.1+(i%4)*.65),orbit:(i%3===0?-1:1)*(1.3+(i%5)*.32),delay:260+(i%4)*40};
    });
    let lastFrame=null;
    button.classList.remove('home-wave-pending');
    const clamp=t=>Math.max(0,Math.min(1,t));
    const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
    function position(p,ms){
      const unfold=smooth((ms-p.delay)/1050);
      const gather=smooth((ms-1530)/(830+(p.index%4)*22));
      const angle=p.angle+p.orbit*unfold+(p.index%2?1:-1)*gather*2.45;
      const dx=Math.cos(angle),dy=Math.sin(angle);
      const rx=Math.min(p.reach,dx<0?cx-18:w-cx-18),ry=Math.min(p.reach,dy<0?cy-18:h-cy-35);
      const x=(p.x*(1-unfold)+dx*rx*unfold)*(1-gather);
      const y=(p.y*(1-unfold)+dy*ry*unfold)*(1-gather);
      const depth=Math.sin(angle+p.index*.5)*unfold*(1-gather);
      return {x:cx+x,y:cy+y,rotation:p.spin*(unfold+gather*.65),depth,scale:(1+depth*.16)*(1-gather*.88),alpha:clamp(ms/220)*(1-smooth((ms-2240)/260)),gather,unfold};
    }
    function glow(x,y,r,alpha,warm){
      if(alpha<=0)return;
      const g=ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,`rgba(${warm?'255,224,162':'160,236,255'},${alpha})`);
      g.addColorStop(.32,`rgba(${warm?'255,200,116':'80,197,252'},${alpha*.4})`);
      g.addColorStop(1,'rgba(80,197,252,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
    }
    function draw(now){
      if(!button.isConnected){stop();return;}
      // A busy startup frame must not skip the logo-to-hand handoff.
      if(lastFrame!==null)sequence.elapsed+=Math.min(40,Math.max(0,now-lastFrame));
      lastFrame=now;
      const elapsed=sequence.elapsed;
      animations.forEach(a=>{a.currentTime=elapsed;});
      if(elapsed>=2780&&!messageAnnounced){messageAnnounced=true;thought.announce(0);}
      if(elapsed>=4580)hasWavedHello=true;
      if(elapsed>=9280){stop();return;}
      if(elapsed>=3250){ctx.clearRect(0,0,w,h);frame=requestAnimationFrame(draw);return;}
      ctx.clearRect(0,0,w,h);
      glow(cx,cy,68,.16*(1-clamp(elapsed/1800)),false);
      const drawOrder=shards.map(p=>({p,v:position(p,elapsed)})).sort((a,b)=>a.v.depth-b.v.depth);
      for(const {p,v} of drawOrder){
        if(v.alpha<=0)continue;
        // Short tapered trails follow the actual trajectory, with no fixed rings.
        for(let j=7;j>0;j--){
          const a=position(p,Math.max(0,elapsed-j*13)),b=position(p,Math.max(0,elapsed-(j-1)*13));
          ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
          ctx.strokeStyle=`rgba(133,226,255,${v.alpha*v.unfold*(1-j/8)*.24})`;
          ctx.lineWidth=.5+(1-j/8)*1.1;ctx.lineCap='round';ctx.stroke();
        }
        const [l,top,r,bottom]=p.bounds;
        const sw=(r-l)/314*mark.naturalWidth,sh=(bottom-top)/261*mark.naturalHeight;
        const scale=logoSize/261*v.scale,dw=(r-l)*scale,dh=(bottom-top)*scale;
        ctx.save();ctx.translate(v.x,v.y);ctx.rotate(v.rotation);ctx.globalAlpha=v.alpha*(.85+.15*(v.depth+1)/2);
        ctx.shadowColor='rgba(179,240,255,.9)';ctx.shadowBlur=4+3*(v.depth+1)/2;
        if(mark.complete&&mark.naturalWidth)ctx.drawImage(mark,l/314*mark.naturalWidth,top/261*mark.naturalHeight,sw,sh,-dw/2,-dh/2,dw,dh);
        ctx.restore();
      }
      // Light gathers with the returning pieces, warming as the gold pin appears.
      const gatherLight=Math.sin(Math.PI*clamp((elapsed-1880)/920));
      glow(cx,cy,54,gatherLight*.32,elapsed>2300);
      if(elapsed>2380&&elapsed<3180){
        const t=(elapsed-2380)/800,fade=Math.pow(1-t,2);
        ctx.beginPath();ctx.ellipse(cx,cy,10+t*47,8+t*32,-.3,0,TAU);
        ctx.strokeStyle=`rgba(214,244,255,${fade*.4})`;ctx.lineWidth=1;ctx.stroke();
        for(let i=0;i<9;i++){
          const a=i*2.39996,rad=18+t*(25+i%3*9);
          const x=cx+Math.cos(a)*rad,y=cy+Math.sin(a)*rad*.65;
          ctx.fillStyle=`rgba(${i%3?'199,240,255':'255,226,168'},${fade*.75})`;
          ctx.beginPath();ctx.arc(x,y,.7+(i%3)*.3,0,TAU);ctx.fill();
        }
      }
      if(elapsed>=3250)ctx.clearRect(0,0,w,h);
      frame=requestAnimationFrame(draw);
    }
    frame=requestAnimationFrame(draw);
  }

  window.initHomeGreeting = function(content){
    const wave=content && content.querySelector('.home-wave-icon');
    if(!wave || wave.dataset.waveReady)return;
    const resume=activeSequence;
    clearTimeout(startupTimer);
    stopGreeting();
    ++requestId;
    wave.dataset.waveReady='single-clock-v4';
    const status=document.createElement('span');status.className='home-wave-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    wave.closest('.home-greeting').appendChild(status);
    const image=wave.querySelector('.home-wave-art');
    if(!image)return;
    const pin=document.createElement('span');
    pin.className='home-wave-pin';pin.setAttribute('aria-hidden','true');
    image.replaceWith(pin);pin.appendChild(image);
    const shine=document.createElement('span');shine.className='home-wave-shine';pin.appendChild(shine);
    ['halo','glint home-wave-glint-a','glint home-wave-glint-b'].forEach((name,i)=>{
      const el=document.createElement('span');el.className='home-wave-'+name;
      el.setAttribute('aria-hidden','true');if(i)el.textContent='✦';wave.appendChild(el);
    });
    const name=wave.parentElement.querySelector('.home-greeting-name');
    if(name && name.textContent.trim().length>4)wave.parentElement.classList.add('home-wave-wide-name');
    const play=()=>playGreeting(wave);
    wave.addEventListener('click',play);
    lastGreetingWave={el:wave,play};
    // Wait for startup rebuilds to settle. If already playing, keep the
    // original clock and message rather than restarting the logo and hand.
    if(resume && resume.elapsed<9280){
      playGreeting(wave,resume);
    }else if(!hasWavedHello){
      if(!reduced.matches)wave.classList.add('home-wave-pending');
      startupTimer=setTimeout(()=>{if(wave.isConnected)play();},400);
    }
  };
  reduced.addEventListener('change',()=>{clearTimeout(startupTimer);++requestId;stopGreeting();if(lastGreetingWave)lastGreetingWave.el.classList.remove('home-wave-pending');});

  /* Reopening an installed PWA does not reload the page, so without this the
     wave fires once on the very first launch and never again -- which is not
     what "when the app is opened" means on a phone. Coming back to the
     foreground on Home counts as opening it.

     Throttled: flicking away to copy a phone number and straight back should
     not set the hand off again. */
  const WAVE_RESUME_GAP_MS = 45000;
  let lastGreetingWave = null, lastWaveAt = 0;
  document.addEventListener('visibilitychange', () => {
    if(document.visibilityState !== 'visible'){clearTimeout(startupTimer);++requestId;stopGreeting();if(lastGreetingWave)lastGreetingWave.el.classList.remove('home-wave-pending');return;}
    const w = lastGreetingWave;
    if(!w || !w.el.isConnected) return;
    const now = Date.now();
    if(hasWavedHello && now - lastWaveAt < WAVE_RESUME_GAP_MS) return;
    lastWaveAt = now;
    w.play(true);   // returning to the foreground IS opening the app
  });
  const initGreetingWithDecor = window.initHomeGreeting;
  window.initHomeGreeting = function(content){
    initGreetingWithDecor(content);
    initHeroDecor(content);
  };

  /* ---------- Hero decor: falling petals + arc of mini marks ----------
     Styles live in home-polish.css under the same heading. */
  const PETAL_SVG_ID = 'homePetalDefs';
  let decorObservers = [];

  // Small seeded random, so the layout is identical every time Home rebuilds.
  function seeded(seed){
    return function(){
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function ensurePetalDefs(){
    if(document.getElementById(PETAL_SVG_ID)) return;
    const shape = 'M20 47C9 41 2 30 3 19 4 9 11 2 17 2c1.6 0 2.4 3.2 3 6.5.6-3.3 1.4-6.5 3-6.5 6 0 13 7 14 17 1 11-6 22-17 28z';
    const wrap = document.createElement('div');
    wrap.innerHTML =
      '<svg id="' + PETAL_SVG_ID + '" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden">' +
      '<defs>' +
      '<linearGradient id="hpBlue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9f1ff"/><stop offset=".45" stop-color="#8fb4ea"/><stop offset="1" stop-color="#3f63b5"/></linearGradient>' +
      '<linearGradient id="hpLav" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3eefc"/><stop offset=".5" stop-color="#a99ddc"/><stop offset="1" stop-color="#5a4f9e"/></linearGradient>' +
      '<linearGradient id="hpPink" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3f7"/><stop offset=".5" stop-color="#f4b9cc"/><stop offset="1" stop-color="#d77a9a"/></linearGradient>' +
      '<radialGradient id="hpShine" cx=".35" cy=".3" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '<symbol id="hpSakura" viewBox="0 0 40 48">' +
        '<path d="' + shape + '" style="fill:var(--fill)" stroke="#fff" stroke-opacity=".55" stroke-width="1.2"/>' +
        '<path d="' + shape + '" fill="url(#hpShine)"/>' +
        '<path d="M20 44C19 32 19.5 20 20 10" stroke="#fff" stroke-opacity=".45" stroke-width=".9" fill="none" stroke-linecap="round"/>' +
        '<path d="M20 30c-3-3-7-5-10-5M20 30c3-3 7-5 10-5" stroke="#fff" stroke-opacity=".25" stroke-width=".6" fill="none"/>' +
      '</symbol></defs></svg>';
    document.body.appendChild(wrap.firstChild);
  }

  function buildPetals(hero){
    const layer = document.createElement('div');
    layer.className = 'home-petals';
    layer.setAttribute('aria-hidden', 'true');
    const rand = seeded(1917);
    const wide = hero.clientWidth > 560;
    const count = wide ? 28 : 20;
    const palette = ['url(#hpBlue)', 'url(#hpBlue)', 'url(#hpLav)', 'url(#hpPink)'];
    // [share, size px, opacity, fall seconds, class]
    const tiers = [
      [.40, [8, 12],  [.42, .56], [14, 20], 'is-far'],
      [.45, [13, 19], [.72, .9],  [10, 14], ''],
      [.15, [24, 32], [.34, .46], [8, 11],  'is-near']
    ];
    const range = (a, b) => a + rand() * (b - a);
    // Continue the flow from wherever it was: re-rendering Home must not
    // restart every petal at the top.
    const elapsed = (performance.now() / 1000);
    layer.style.setProperty('--fall', Math.round(hero.clientHeight * 1.05) + 'px');
    let html = '';
    for(let i = 0; i < count; i++){
      const roll = rand();
      const t = roll < tiers[0][0] ? tiers[0] : (roll < tiers[0][0] + tiers[1][0] ? tiers[1] : tiers[2]);
      const size = range(t[1][0], t[1][1]);
      const dur = range(t[3][0], t[3][1]);
      const delay = -((range(0, 20) + elapsed) % dur);
      html += '<div class="home-petal ' + t[4] + '" style="' +
        // Spread evenly across the width (with jitter) so they don't bunch
        // up behind the glass card.
        'left:' + (((i + rand()) / count) * 104 - 4).toFixed(1) + '%;' +
        'width:' + size.toFixed(1) + 'px;height:' + (size * 1.2).toFixed(1) + 'px;' +
        '--fill:' + palette[i % palette.length] + ';' +
        '--o:' + range(t[2][0], t[2][1]).toFixed(2) + ';' +
        '--dur:' + dur.toFixed(2) + 's;--delay:' + delay.toFixed(2) + 's;' +
        '--flip:' + range(1.8, 3.4).toFixed(2) + 's;' +
        '--sway:' + range(-60, 60).toFixed(0) + 'px;' +
        '--r0:' + range(0, 360).toFixed(0) + 'deg;' +
        '--rest:' + range(20, 70).toFixed(0) + '%' +
        '"><svg><use href="#hpSakura"/></svg></div>';
    }
    layer.innerHTML = html;
    return layer;
  }

  function initHeroDecor(content){
    decorObservers.forEach(o => o.disconnect());
    decorObservers = [];
    const hero = content && content.querySelector('.home-greeting');
    if(!hero) return;
    // .home-arc-marks is still swept up here on purpose: an installed PWA can
    // resume on a cached page that still has the old layer in the DOM.
    hero.querySelectorAll('.home-petals, .home-arc-marks').forEach(n => n.remove());
    ensurePetalDefs();

    const petals = buildPetals(hero);
    const scrim = hero.querySelector('.home-greeting-scrim');
    hero.insertBefore(petals, scrim ? scrim.nextSibling : hero.firstChild);

    if(typeof ResizeObserver !== 'undefined'){
      let lastH = hero.clientHeight;
      const ro = new ResizeObserver(() => {
        if(hero.clientHeight === lastH) return;
        lastH = hero.clientHeight;
        petals.style.setProperty('--fall', Math.round(lastH * 1.05) + 'px');
      });
      ro.observe(hero);
      decorObservers.push(ro);
    }
    if(typeof IntersectionObserver !== 'undefined'){
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => petals.classList.toggle('is-offscreen', !e.isIntersecting));
      });
      io.observe(hero);
      decorObservers.push(io);
    }
  }

  const syncHidden = () => document.documentElement.classList.toggle('is-app-hidden', document.hidden);
  document.addEventListener('visibilitychange', syncHidden);
  syncHidden();

  let railObserver = null;
  window.clearHomeRails = function(){
    if(railObserver) railObserver.disconnect();
    railObserver = null;
  };
  window.initHomeRails = function(content){
    clearHomeRails();
    if(!content) return;
    const updates = [];
    content.querySelectorAll('.home-rail').forEach(rail => {
      const dots = rail.nextElementSibling;
      if(!dots || !dots.classList.contains('home-rail-dots')) return;
      const update = () => {
        const range = rail.scrollWidth - rail.clientWidth;
        const count = range > 2 ? Math.min(7, Math.max(2, Math.ceil(rail.scrollWidth / Math.max(1,rail.clientWidth)))) : 0;
        dots.classList.toggle('has-overflow', count > 0);
        if(dots.children.length !== count){
          dots.replaceChildren(...Array.from({length:count}, () => document.createElement('span')));
        }
        const selected = range > 0 ? Math.round(Math.max(0,Math.min(1,rail.scrollLeft / range)) * (count - 1)) : 0;
        Array.from(dots.children).forEach((dot, i) => dot.classList.toggle('is-current', i === selected));
      };
      rail.addEventListener('scroll', update, {passive:true});
      updates.push(update);
    });
    const refresh = () => updates.forEach(update => update());
    if(typeof ResizeObserver !== 'undefined'){
      railObserver = new ResizeObserver(refresh);
      content.querySelectorAll('.home-rail').forEach(rail => railObserver.observe(rail));
    }
    refresh();
  };

  /* Medical Terminology "View all": one card per domain, in the same sheet
     and the same card style the other sections use, instead of dumping every
     term on one page. Built from the domain rail already on Home, so the
     order (biggest first), colours, icons and counts always match it.
     Each card keeps the rail's own action: a domain with specialties opens
     its folder ON TOP of this sheet (closing it comes back here); a domain
     without them navigates, and navigation closes every overlay. */
  function domainSheetCards(section){
    return Array.from(section.querySelectorAll('.home-rail .domain-family-head'), head => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'qa-card';
      card.setAttribute('style', head.getAttribute('style') || '');
      card.setAttribute('onclick', head.getAttribute('onclick') || '');
      const icon = document.createElement('span');
      icon.className = 'qa-icon';
      const srcIcon = head.querySelector('.home-tile-icon');
      icon.innerHTML = srcIcon ? srcIcon.innerHTML : '';
      const title = document.createElement('span');
      title.className = 'qa-title';
      title.textContent = (head.querySelector('.home-tile-name') || head).textContent.trim();
      const desc = document.createElement('span');
      desc.className = 'qa-desc';
      const terms = head.querySelector('.home-term-count');
      const specs = head.querySelector('.home-specialty-count');
      desc.textContent = terms ? terms.textContent.trim() : '';
      if(specs){
        desc.appendChild(document.createElement('br'));
        desc.appendChild(document.createTextNode(specs.textContent.trim()));
      }
      card.append(icon, title, desc);
      return card;
    });
  }
  window.openHomeSection = function(key){
    // Only the four fixed sections of Home can populate this presentation.
    if(!['medical','doctors','study','tools'].includes(key)) return;
    const section = document.querySelector('#content.is-home [data-home-section="' + key + '"]');
    const overlay = document.getElementById('homeSectionOverlay');
    if(!section || !overlay) return;
    const cards = key === 'medical' ? domainSheetCards(section) : section.querySelectorAll('.home-rail > .qa-card');
    if(!cards.length) return;
    document.getElementById('homeSectionTitle').textContent = section.querySelector('h3').textContent;
    document.getElementById('homeSectionSub').textContent = key === 'medical'
      ? cards.length + (cards.length === 1 ? ' domain' : ' domains')
      : cards.length + ' tools';
    document.getElementById('homeSectionIcon').innerHTML = cards[0].querySelector('.qa-icon').innerHTML;
    document.getElementById('homeSectionPanel').style.setProperty('--folder-color', section.style.getPropertyValue('--section-color'));
    const grid = document.getElementById('homeSectionGrid');
    grid.replaceChildren(...Array.from(cards, card => key === 'medical' ? card : card.cloneNode(true)));
    if(key === 'medical'){
      // The full term list stays one tap away, below the domains.
      const all = document.createElement('button');
      all.type = 'button';
      all.className = 'home-section-all';
      all.textContent = 'Browse every term';
      all.addEventListener('click', () => { closeHomeSection(); setCategory('all'); });
      grid.appendChild(all);
    }
    overlay.classList.add('show');
  };
  window.closeHomeSection = function(){
    const overlay = document.getElementById('homeSectionOverlay');
    if(overlay) overlay.classList.remove('show');
  };
  /* ---- The name flows when you touch its domain ----------------------
     Driven by its own class rather than :active/.is-pressed, because the
     press class only survives about 320ms on a quick tap (60ms of contact
     plus the 260ms hold in index.html) -- a sweep hung off it would be cut
     off part-way and snap back. This one clears itself on animationend, so
     the flow always finishes no matter how briefly the card was touched.

     Delegated from document so it keeps working after a rail re-renders. */
  const FLOW_CARDS = '.domain-family, .home-rail > .qa-card, .home-section-grid > .qa-card, .qa-tile';
  const FLOW_NAMES = '.home-tile-name, .qa-title, .qa-tile-label';
  document.addEventListener('pointerdown', (e) => {
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const card = e.target.closest && e.target.closest(FLOW_CARDS);
    if(!card) return;
    const name = card.querySelector(FLOW_NAMES);
    if(!name || name.classList.contains('is-flowing')) return;
    name.classList.add('is-flowing');
    name.addEventListener('animationend', () => name.classList.remove('is-flowing'), { once:true });
  }, { passive:true });

  const content = document.getElementById('content');
  if(content && content.classList.contains('is-home')){
    initHomeGreeting(content);
    initHomeRails(content);
  }
})();
