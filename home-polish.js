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
    'Your care makes a difference.', 'You help people feel heard.', 'You’re appreciated.',
    'Tap me to ask the Hub.'
  ];
  let previousMessage=-1;
  function chooseMessage(){
    let next=Math.floor(Math.random()*(encouragements.length-1));
    if(next>=previousMessage)next++;
    if(previousMessage<0)next=Math.floor(Math.random()*encouragements.length);
    previousMessage=next;
    return encouragements[next];
  }
  /* The thought cloud (option C "Sparkle Float", in blue). Drawn, not built
     from the 💭 emoji: that meant a pixel flood-fill on every hello. It lands
     with a jelly wobble, types its message, floats up while gold sparkles and
     mini Hackensack marks twinkle, then drifts away. update(ms) is driven by
     the greeting's own clock, starting when the cloud begins to appear. */
  const CLOUD_BUMPS=[[26,46,19],[46,30,22],[72,24,25],[99,31,21],[117,47,16],[96,56,19],[64,59,20],[34,58,15]];
  const cloudShapes='<rect x="14" y="34" width="112" height="36" rx="18"/>'+CLOUD_BUMPS.map(b=>`<circle cx="${b[0]}" cy="${b[1]}" r="${b[2]}"/>`).join('');
  const CLOUD_DOTS=[{x:-15,y:37,r:3.2},{x:-5,y:27,r:5}];
  // How far below his top a cloud opened to his left sits: level with his face, clear of the name above.
  const LEFT_DROP=14;
  const CLOUD_SPARKS=[[8,8],[132,14],[124,74],[58,-4]];
  const CLOUD_MARKS=[[4,10],[136,6],[128,78],[64,-10],[100,-8]];
  let cloudSeq=0;
  function splitMessage(text){
    const words=String(text).split(/\s+/);
    if(words.length<2)return [text,''];
    let best=[text,''],score=1e9;
    for(let i=1;i<words.length;i++){
      const a=words.slice(0,i).join(' '),b=words.slice(i).join(' ');
      const sc=Math.max(a.length,b.length);
      if(sc<score){score=sc;best=[a,b];}
    }
    return best;
  }
  function createThought(button, text){
    const hero=button.closest('.home-greeting');
    const id='hc'+(++cloudSeq);
    let message=text || chooseMessage();
    let lines=splitMessage(message);
    const bubble=document.createElement('span');
    bubble.className='home-wave-thought';bubble.setAttribute('aria-hidden','true');
    bubble.innerHTML=`<svg class="home-wave-cloudsvg" viewBox="-30 -20 180 110" width="180" height="110" focusable="false">
      <defs>
        <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4FAFF"/><stop offset=".5" stop-color="#CFE8FF"/><stop offset="1" stop-color="#92CDF5"/></linearGradient>
        <clipPath id="${id}c">${cloudShapes}</clipPath>
        <filter id="${id}s" x="-25%" y="-25%" width="150%" height="170%"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#8FD8FF" flood-opacity=".85"/><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0B2340" flood-opacity=".3"/></filter>
        <filter id="${id}b"><feGaussianBlur stdDeviation="2.5"/></filter>
      </defs>
      ${CLOUD_DOTS.map((d,i)=>`<circle class="hc-dot" cx="${d.x}" cy="${d.y}" r="${d.r}" fill="#E3F3FF" stroke="#fff" stroke-width="1.5" filter="url(#${id}s)"/>`).join('')}
      <g class="hc-body">
        <g filter="url(#${id}s)"><g fill="#fff" stroke="#fff" stroke-width="5" stroke-linejoin="round">${cloudShapes}</g><g fill="url(#${id}g)">${cloudShapes}</g></g>
        <g clip-path="url(#${id}c)"><ellipse cx="52" cy="18" rx="24" ry="7" fill="#fff" opacity=".85" filter="url(#${id}b)"/><circle cx="102" cy="24" r="3" fill="#fff"/></g>
        <text x="70" y="41" text-anchor="middle" class="hc-text"><tspan class="hc-l1" x="70"></tspan><tspan class="hc-l2" x="70" dy="15"></tspan></text>
      </g>
      ${CLOUD_SPARKS.map((p,i)=>`<path class="hc-spark" d="M0 -6 Q0 0 6 0 Q0 0 0 6 Q0 0 -6 0 Q0 0 0 -6Z" fill="${i%2?'#fff':'#FFE27A'}" opacity="0"/>`).join('')}
      ${CLOUD_MARKS.map(()=>`<image class="hc-mark" href="./hmh-mark.png" width="16" height="13.3" x="-8" y="-6.6" opacity="0"/>`).join('')}
    </svg>`;
    // Escape the greeting card's clipping and backdrop-filter layers.
    document.body.appendChild(bubble);
    const b=button.getBoundingClientRect();
    // The bubble box is 136px, but the drawing reaches 150px from its left
    // edge (sparkles and marks), and nothing may pass the screen's right
    // edge: past it, the whole page widens, shifts sideways, and on a phone
    // zooms out. On a narrow phone (iPhone SE) the clamp alone would put the
    // cloud over the smiley, so it starts just past the face and shrinks to
    // fit -- but only when 75% or more fits there.
    // On a phone he stands at the right edge, under the name (his own
    // place, home-polish.css), so there is no room: the cloud opens to his
    // left instead, beside his face, in the space under the name, its dots
    // trailing to his cheek. If that can't fit either, it goes above him,
    // a little smaller if the banner needs it, and only then does it stay
    // clamped over him, as it used to.
    const CLOUD_W=150,room=document.documentElement.clientWidth-4;
    let left=Math.min(b.left+88,room-CLOUD_W), top=b.top-10;
    let dotsAt=CLOUD_DOTS, grow0=[20,64];
    const fit=(room-b.right-2)/CLOUD_W;
    if(left<b.right+2&&fit>=.75){left=b.right+2;bubble.style.transformOrigin='0 50%';bubble.style.scale=Math.min(1,fit).toFixed(3);}
    else if(left<b.right+2&&b.left-158>=8){
      // mirrored: dots on the cloud's right, growing from its right side
      left=b.left-158;top=b.top+LEFT_DROP;
      dotsAt=CLOUD_DOTS.map(d=>({x:140-d.x,y:d.y,r:d.r}));grow0=[120,64];
      bubble.classList.add('is-left');
    }
    else if(left<b.right+2){
      // 98px from the bubble's top to the last dot; the face's top must stay clear
      const hr=hero.getBoundingClientRect(), sc=Math.min(1,(b.top-4-hr.top)/98);
      if(sc>=.7){
        const cx=(b.left+b.right)/2;
        left=Math.max(8,Math.min(room-CLOUD_W*sc,cx-70*sc));
        top=b.top-2-98*sc;
        const fx=(cx-left)/sc;
        dotsAt=[{x:fx+3,y:94,r:3.2},{x:fx-5,y:84,r:5}];grow0=[fx,78];
        bubble.style.transformOrigin='0 0';bubble.style.scale=sc.toFixed(3);bubble.classList.add('is-above');
      }
    }
    left=Math.max(8,left);
    bubble.style.left=(left+window.scrollX)+'px';
    bubble.style.top=(top+window.scrollY)+'px';
    // the dots sit where this cloud's own placement needs them
    bubble.querySelectorAll('.hc-dot').forEach((el,i)=>{el.setAttribute('cx',dotsAt[i].x);el.setAttribute('cy',dotsAt[i].y);});
    const q=sel=>[...bubble.querySelectorAll(sel)];
    const body=bubble.querySelector('.hc-body'),dots=q('.hc-dot'),sparks=q('.hc-spark'),marks=q('.hc-mark');
    const l1=bubble.querySelector('.hc-l1'),l2=bubble.querySelector('.hc-l2');
    const clamp=x=>x<0?0:x>1?1:x,sm=x=>{x=clamp(x);return x*x*(3-2*x);},win=(t,a,b)=>clamp((t-a)/(b-a));
    const back=(x,k)=>{x=clamp(x);const c=k+1;return 1+c*Math.pow(x-1,3)+k*Math.pow(x-1,2);};
    let shownChars=-1;
    function update(ms){
      const t=ms/1000,a=t-.3;
      const jig=a<0?0:Math.exp(-4.2*a)*Math.sin(a*22),grow=a<0?0:back(a/.45,1.6);
      const out=win(t,5.3,6.2);
      const ty=-6*sm(win(t,.9,5.3))-1.5*Math.sin(Math.PI*2*t/2)-18*sm(out);
      const op=(a<0?0:1)*(1-sm(out));
      bubble.style.opacity=op>0||t<.4?'1':'0';
      bubble.style.pointerEvents=op>.3?'':'none';
      body.setAttribute('transform',`translate(0 ${ty.toFixed(2)}) translate(${grow0[0]} ${grow0[1]}) scale(${Math.max(0,grow+.1*jig).toFixed(4)} ${Math.max(0,grow-.1*jig).toFixed(4)}) translate(${-grow0[0]} ${-grow0[1]})`);
      body.setAttribute('opacity',op.toFixed(3));
      [back(win(t,0,.2),2.2),back(win(t,.1,.3),2.2)].forEach((v,i)=>{
        v*=1-sm(win(t,5.2,5.5));const d=dotsAt[i];
        dots[i].setAttribute('transform',`translate(${d.x} ${d.y}) scale(${Math.max(0,v).toFixed(3)}) translate(${-d.x} ${-d.y})`);
      });
      const total=lines[0].length+lines[1].length,chars=Math.floor(clamp((t-.75)/.8)*total);
      if(chars!==shownChars){shownChars=chars;l1.textContent=lines[0].slice(0,chars);l2.textContent=lines[1].slice(0,Math.max(0,chars-lines[0].length));}
      const lit=t>.9&&t<5.4;
      sparks.forEach((el,i)=>{const ph=(t*1.3+i*.27)%1,sc=lit?Math.sin(Math.PI*ph)*1.2:0,p=CLOUD_SPARKS[i];
        el.setAttribute('opacity',sc>0?1:0);el.setAttribute('transform',`translate(${p[0]} ${(p[1]+ty).toFixed(1)}) rotate(${(ph*90).toFixed(1)}) scale(${sc.toFixed(3)})`);});
      marks.forEach((el,i)=>{const ph=(t*.55+i*.21)%1,p=CLOUD_MARKS[i],on=lit?Math.sin(Math.PI*ph)*op:0;
        el.setAttribute('opacity',on.toFixed(3));el.setAttribute('transform',`translate(${p[0]} ${(p[1]+ty-8*ph).toFixed(1)}) rotate(${(ph*40-20).toFixed(1)}) scale(${(.8+.5*Math.sin(Math.PI*ph)).toFixed(3)})`);});
    }
    update(0);
    let announced=0,expire=0;
    const status=hero.querySelector('.home-wave-status');
    return {bubble,update,
      // Real news (window.hubNews, index.html) replaces the message if it is
      // ready before the typing starts; the cloud then goes there on a tap.
      news(n){
        if(!n||shownChars>0)return;
        message=n.text;lines=splitMessage(message);shownChars=-1;
        // Tappable only clear of his face: with a long name the cloud has to
        // sit over him, and his face must still take the tap there.
        const r=bubble.getBoundingClientRect(),f=button.getBoundingClientRect();
        if(r.left<f.right&&r.right>f.left&&r.top<f.bottom&&r.bottom>f.top)return;
        bubble.classList.add('is-news');
        bubble.addEventListener('click',()=>{stopGreeting();n.go();});
      },
      announce(delay){announced=setTimeout(()=>{if(status)status.textContent=message;},delay);},
      expire(fn){expire=setTimeout(fn,6500);},
      remove(){clearTimeout(announced);clearTimeout(expire);bubble.remove();if(status)status.textContent='';}};
  }

  /* The greeting face: he arrives (ENTER_MS, faceBody), and once he has
     landed his delighted hello (greet in index.html) plays on his animation
     engine at GREET_AT, like every other gesture of his: a dip and a blink,
     up into an open smile, a bright squint, a settle. FACE_MS is the face's
     part of the sequence, starting when it appears; his idle starts after. */
  const FACE_MS=3300, FACE_AT=2380, CLOUD_AT=2880, SEQUENCE_END=9380, ENTER_MS=460, GREET_AT=FACE_AT+ENTER_MS+80;
  const FACE_REST={open:0,blush:1,gl:0,sqL:0,sqR:0,heart:0,glint:-1};
  // Dr. Smiley's current tilt in degrees, kept by the greeting loop that sets
  // it. The Ask badge's lanyard follows it; reading it back from the browser
  // (getComputedStyle) right after the loop had written it forced a full style
  // recalculation every frame, which was most of Home's idle CPU.
  // During the entrance wave a browser animation tilts him instead, so the
  // badge reads that back only while the wave is in its window (~3 s).
  let smileyTilt=0,entranceWave=null;
  // Writing an SVG attribute repaints the face even when the value is the
  // same, and the idle runs every frame, so only write what changed.
  const setA=(el,name,value)=>{const v=String(value);if(el.getAttribute(name)!==v)el.setAttribute(name,v);};
  // Dr. Smiley is a picture whose eyes and mouth move frame by frame
  // (drSmileyArt in index.html), so a pose picks the frame: the mouth opens
  // through smile1 and smile2 to the smile, both eyes squeezing go through
  // laugh1 and laugh2 to the laugh, one eye squeezing is the wink. The
  // vector parts further down only exist in the old drawing and find nothing.
  function frameFor(P){
    const l=P.sqL||0,r=P.sqR||0,o=Math.max(P.open||0,(P.heart||0)>.3?.8:0);
    const e=Math.min(l,r);
    if(e>.75)return o>.6?'laugh':'laugh2';
    if(e>.4)return o>.5?'laugh2':'laugh1';
    const w=Math.max(l,r);
    if(w>.75)return 'wink';
    if(w>.45)return 'wink2';
    if(w>.15)return 'wink1';
    if((P.heart||0)>.3)return 'love';
    if(o>.75)return 'smile';
    if(o>.45)return 'smile2';
    if(o>.15)return 'smile1';
    return 'rest';
  }
  function setFace(svg,P){
    if(!svg||!svg.querySelector)return;
    if(svg.classList.contains('ds-art')&&typeof window.drFaceSet==='function'){window.drFaceSet(svg,frameFor(P));return;}
    const o=P.open,w=12+9*o,cornerY=72,topY=cornerY+7*(1-o),botY=topY+1+34*o;
    const d=`M${(60-w).toFixed(2)} ${cornerY} Q60 ${topY.toFixed(2)} ${(60+w).toFixed(2)} ${cornerY} Q60 ${botY.toFixed(2)} ${(60-w).toFixed(2)} ${cornerY} Z`;
    svg.querySelectorAll('.hf-mouth,.hf-mclip').forEach(el=>setA(el,'d',d));
    const tongue=svg.querySelector('.hf-tongue');
    if(tongue){setA(tongue,'cy',(cornerY+17*o+4).toFixed(2));setA(tongue,'rx',(w*.72).toFixed(2));setA(tongue,'ry',(10*o).toFixed(2));}
    svg.querySelectorAll('.hf-blush').forEach(el=>{
      const x=+el.dataset.x,bw=16*P.blush,bh=7*Math.sqrt(P.blush);
      setA(el,'x',(x-bw/2).toFixed(2));setA(el,'y',(63-bh/2).toFixed(2));
      setA(el,'width',bw.toFixed(2));setA(el,'height',bh.toFixed(2));setA(el,'rx',(bh/2).toFixed(2));
    });
    const glasses=svg.querySelector('.hf-glasses');
    if(glasses)setA(glasses,'transform',`translate(0 ${(-P.gl).toFixed(2)})`);
    // Eyes: ^ at rest, squeezing toward > < per eye; heart eyes cross-fade in.
    const ey=49,heart=Math.max(0,P.heart||0),hv=Math.min(1,heart);
    svg.querySelectorAll('.hf-eye').forEach(e=>{
      const x=+e.dataset.x,side=+e.dataset.side,u=(side<0?P.sqL:P.sqR)||0;
      const hat=[[x-9,ey+3.5],[x,ey-4.5],[x+9,ey+3.5]];
      const tip=side<0?[[x-6,ey-7],[x+6,ey],[x-6,ey+7]]:[[x+6,ey-7],[x-6,ey],[x+6,ey+7]];
      const pt=hat.map((h,i)=>[(h[0]+(tip[i][0]-h[0])*u).toFixed(2),(h[1]+(tip[i][1]-h[1])*u).toFixed(2)]);
      setA(e,'d',`M${pt[0][0]} ${pt[0][1]} L${pt[1][0]} ${pt[1][1]} L${pt[2][0]} ${pt[2][1]}`);
      setA(e,'opacity',(1-hv).toFixed(3));
    });
    svg.querySelectorAll('.hf-heye').forEach(h=>{
      setA(h,'transform',`translate(${h.dataset.x} ${ey+1}) scale(${(heart*1.25).toFixed(3)})`);
      setA(h,'opacity',hv>.02?1:0);
    });
    const glint=svg.querySelector('.hf-glint');
    if(glint)setA(glint,'transform',`translate(${(P.glint<0?-40:-10+140*P.glint).toFixed(2)} 0)`);
  }

  /* ---------- Idle: after the hello ----------
     His face runs on drFaceIdle (index.html): one timer, blinks at irregular
     moments, now and then a smile, a laugh or a wink, each with a lead-in, a
     short peak and a slower way back, and a lean of a degree or two of his pin
     (never a bounce or a scale). Nothing moves between them. Stops with
     reduced motion, when the tab is hidden, and while he is scrolled out of
     view, so it costs nothing when nobody can see it. */
  const rnd=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  // index.html's reactions and task states (drPerform: a study result, the
  // warm-up, a new team rank...) ask for one of his sequences by name, with
  // a priority; a few old names are still mapped.
  const ACT_FACE={bouncy:'proud',hearts:'love',hum:'sing',gleam:'think',party:'cheer'};
  const seqOf=name=>ACT_FACE[name]||(typeof DR_FACE_SEQ!=='undefined'&&DR_FACE_SEQ[name]?name:'smile');
  const P=(k,d)=>typeof DR_P!=='undefined'?DR_P[k]:d;
  // Still: the phone's reduced motion, or "Still" in his settings (index.html).
  const still=()=>reduced.matches||(typeof window.drStill==='function'&&window.drStill());
  let idleStop=()=>{},idleRunning=false,forcedAct=null,idleCtl=null;
  // Still has no idle, but a reaction still shows: the engine (index.html,
  // drFacePlay) holds its peak frame still, no movement.
  const actNow=(name,priority)=>{const f=seqOf(name),p=priority||(name==='pet'?P('DIRECT',5):P('REACT',3));
    if(idleCtl){idleCtl.act(f,p);forcedAct=null;return;}
    if(still()&&typeof window.drFacePlay==='function'){const b=document.querySelector('#content.is-home .home-wave-icon'),svg=b&&b.querySelector('.home-face');if(svg)window.drFacePlay(svg,f,b.querySelector('.home-wave-pin'),null,p);return;}
    forcedAct=[name,p];};
  window.homeSmileyCelebrate=()=>actNow('party',P('TASK',4));
  window.homeSmileyAct=(name,priority)=>actNow(name,priority);
  function startIdle(button){
    idleStop();
    if(still()||document.hidden||!button||!button.isConnected)return;
    const pin=button.querySelector('.home-wave-pin'),svg=button.querySelector('.home-face');
    if(!pin||!svg||typeof window.drFaceIdle!=='function')return;
    let onScreen=true,goneAt=0,lastNotice=0;
    // Scrolled back up to him after a while: he notices you with a nod.
    const io=new IntersectionObserver(entries=>{
      const was=onScreen;onScreen=entries[0].isIntersecting;
      if(!onScreen&&was){goneAt=performance.now();return;}
      const now=performance.now();
      if(onScreen&&!was&&goneAt&&now-goneAt>4000&&now-lastNotice>15000&&idleCtl){lastNotice=now;setTimeout(()=>idleCtl&&idleCtl.act('ack'),350);}
    });
    if(typeof window.smileySway==='function')window.smileySway(button,'50% 85%');
    io.observe(button);
    pin.style.transformOrigin='50% 88%';
    const ctl=window.drFaceIdle(svg,pin,{canPlay:()=>onScreen&&button.isConnected,first:forcedAct?300:900+Math.random()*600});
    idleCtl=ctl;idleRunning=true;
    if(forcedAct){const [n,p]=forcedAct;forcedAct=null;ctl.act(seqOf(n),p);}
    idleStop=()=>{
      ctl.stop();io.disconnect();idleRunning=false;idleCtl=null;
      pin.style.transform='';pin.style.transformOrigin='';smileyTilt=0;setFace(svg,FACE_REST);
      idleStop=()=>{};
    };
  }
  // His arrival as the logo collapses into him: he grows in whole (the same
  // scale both ways -- never a squash or stretch of the portrait), turning
  // upright as he lands. What he does once he's there is his greeting
  // performance (greet, index.html), played by his animation engine.
  function faceBody(t){
    let s=1,y=0,angle=0,opacity=1;
    if(t<ENTER_MS){
      const p=t/ENTER_MS,spring=1-Math.exp(-6*p)*Math.cos(8*p);
      s=.08+.92*Math.min(1.03,spring);angle=-10*(1-p)*(1-p);y=8*(1-p);opacity=Math.min(1,p*5);
    }
    return {opacity,angle,transform:`translate3d(0,${y.toFixed(2)}px,0) rotate(${angle.toFixed(2)}deg) scale(${s.toFixed(4)})`};
  }

  async function playGreeting(button, resume = null){
    clearTimeout(startupTimer);
    startupWave=null; startupDeadline=0;
    idleStop();
    stopGreeting();
    activeSequence=resume;
    heartline.hide();
    const request = ++requestId;
    lastWaveAt = Date.now();
    if(document.hidden || !button.isConnected) return;
    if(reduced.matches || !button.animate){
      namePen.release();
      const thought=createThought(button);
      thought.news(window.hubNews&&window.hubNews());thought.update(2500);thought.announce(0);
      const width=window.innerWidth;
      const resizeStop=()=>{if(window.innerWidth!==width)stop();};
      // The cloud lives on <body>, so leaving Home must take it down too --
      // without this it floated over the next page until it expired.
      const gone=new IntersectionObserver(entries=>{
        if(entries[0].isIntersecting)return;
        const r=button.getBoundingClientRect();
        if(button.isConnected&&r.width>0&&r.bottom>0&&r.top<innerHeight)return;
        stop();
      });
      const stop=()=>{thought.remove();gone.disconnect();window.removeEventListener('resize',resizeStop);if(stopGreeting===stop)stopGreeting=()=>{};};
      gone.observe(button);
      stopGreeting=stop;thought.expire(stop);window.addEventListener('resize',resizeStop,{passive:true});
      return;
    }
    button.classList.add('home-wave-pending');
    try {
      const artwork=button.querySelector('.home-wave-art');
      await Promise.all([mark.decode(), artwork && artwork.decode ? artwork.decode() : null]);
    } catch(e) { if(request===requestId){activeSequence=null;button.classList.remove('home-wave-pending');namePen.release();}return; } // Keep the static hand when artwork is unavailable.
    if(request !== requestId || !button.isConnected || reduced.matches || document.hidden){
      if(request === requestId){button.classList.remove('home-wave-pending');namePen.release();}
      return;
    }
    const hero = button.closest('.home-greeting');
    if(!hero){namePen.release();return;}
    if(!resume)namePen.start(button);
    const art = button.querySelector('.home-wave-pin');
    const faceSvg = button.querySelector('.home-face');
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
    // His entrance (placeFace below); declared here so stop() can always call it.
    let entered=true, landed=()=>{};
    const width=window.innerWidth;
    const resizeStop=()=>{if(window.innerWidth!==width)stop();};
    function stop(){
      cancelAnimationFrame(frame);
      button.classList.remove('home-wave-pending','home-ask-wait');
      if(activeSequence===sequence)activeSequence=null;
      animations.forEach(a=>{a.onfinish=null;a.cancel();});
      animations=[];
      if(!entered)landed();
      // At rest unless his engine is still playing the hello (it walks him back itself).
      if(!idleRunning&&!(window.drFaceBusy&&window.drFaceBusy(faceSvg)))setFace(faceSvg,FACE_REST);
      canvas.remove();
      thought.remove();
      if(observer)observer.disconnect();
      window.removeEventListener('resize',resizeStop);
      if(stopGreeting===stop)stopGreeting=()=>{};
    }
    stopGreeting=stop;
    window.addEventListener('resize',resizeStop,{passive:true});
    observer=new IntersectionObserver(entries=>{
      if(entries[0].isIntersecting)return;
      // A repaint of Home moves the greeting, and on a slow phone the observer
      // can report that as "off screen" with an empty box. Stop only when the
      // face really is out of view.
      const r=button.getBoundingClientRect();
      if(button.isConnected&&r.width>0&&r.bottom>0&&r.top<innerHeight)return;
      stop();
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
    // The desktop canvas covers the entire wide banner although the shards
    // occupy only a small area around the hand. Native desktop resolution is
    // enough for those pieces and avoids a costly full-width 2x canvas.
    const desktop=window.innerWidth>=901;
    const dpr=desktop?1:Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    // The face springs in, rests as drawn, then squishes and pops into a laugh.
    // Written straight onto him every frame (placeFace, from draw). It used
    // to be a paused browser animation moved along by setting its time; on an
    // iPhone that could stay on its first frame -- him at 8% of his size --
    // while the rest of the hello carried on, because his breathing (a CSS
    // animation on the same layer) is drawn by the graphics chip and the
    // paused one wasn't redrawn with it. Breathing waits until he has landed
    // (.home-wave-entering, home-polish.css).
    entranceWave=null;
    entered=false;
    button.classList.add('home-wave-entering');
    landed=()=>{entered=true;art.style.transform='';art.style.opacity='';smileyTilt=0;button.classList.remove('home-wave-entering');};
    const placeFace=t=>{
      if(entered)return;
      if(t>=FACE_AT+ENTER_MS){landed();return;}
      const f=faceBody(Math.max(0,t-FACE_AT));
      art.style.transform=f.transform;art.style.opacity=String(f.opacity);smileyTilt=f.angle;
    };
    placeFace(sequence.elapsed);
    // Ask the Hub's entrance (picked by Jose: "Pendulum swing-in"). The ring
    // fades in with the face; once he has landed, the badge is released from
    // the side and swings to rest on its lanyard (askBadge, real physics).
    const askRing=button.querySelector('.home-ask-ring');
    if(askRing)animate(askRing,[{opacity:0},{opacity:1}],{duration:500,delay:FACE_AT,fill:'backwards',easing:'ease-out'});
    const askDisc=button.querySelector('.home-ask-disc');
    if(askDisc)animate(askDisc,[{opacity:0,transform:'scale(.6)'},{opacity:1,transform:'none'}],{duration:450,delay:FACE_AT-120,fill:'backwards',easing:'cubic-bezier(.3,1.4,.5,1)'});
    // The badge waits (hidden) until the face has landed, then is released
    // from the side and swings to rest under its own physics (askBadge).
    const BADGE_AT=FACE_AT+350;
    if(sequence.elapsed<BADGE_AT)button.classList.add('home-ask-wait');
    let messageAnnounced=false,newsShown=false;
    animate(halo,[{transform:'scale(.6)',opacity:0},{transform:'scale(1.05)',opacity:.45,offset:.55},{transform:'scale(1.7)',opacity:1,offset:.7},{transform:'scale(.85)',opacity:.35}],{duration:3500,easing:'ease-in-out'});
    animate(button.querySelector('.home-wave-shine'),[{opacity:0,backgroundPosition:'100% 0'},{opacity:.65,offset:.3},{opacity:0,backgroundPosition:'0% 0'}],{duration:950,delay:2710,easing:'ease-in-out'});
    button.querySelectorAll('.home-wave-glint').forEach((el,i)=>animate(el,[{opacity:0,transform:'scale(.3) rotate(-25deg)'},{opacity:.85,transform:'scale(1.05) rotate(15deg)',offset:.4},{opacity:0,transform:'scale(.5) rotate(35deg)'}],{duration:600,delay:2940+i*550}));
    /* The opening ("Sparkle Snap with Light Rays", picked by Jose): the
       sixteen squares of the Hackensack mark fly in from the edges and snap
       into a big logo, each landing with a sparkle; light rays fan out behind
       it, a shine glides across the pieces (never a box around them), it gives
       one heartbeat pulse, then spins down into the smiley with a flash and a
       ring of gold stars. Everything is drawn from the sequence's own clock. */
    const SQ=[[60,0,113,53],[152,9,193,44],[109,45,151,78],[54,55,107,108],[152,55,205,108],[207,61,259,113],[9,67,43,109],[44,109,78,151],[182,109,216,151],[0,147,52,200],[217,152,251,194],[54,153,107,206],[152,153,205,206],[109,182,151,216],[147,207,199,261],[66,217,108,251]];
    const BIG=150,OPEN_END=3400;
    let lastFrame=null;
    button.classList.remove('home-wave-pending');
    const clamp=t=>Math.max(0,Math.min(1,t));
    const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
    const win=(t,a,b)=>clamp((t-a)/(b-a));
    const easeOut3=x=>1-Math.pow(1-clamp(x),3),easeIn3=x=>Math.pow(clamp(x),3);
    const back=(x,k)=>{x=clamp(x);const c=k+1;return 1+c*Math.pow(x-1,3)+k*Math.pow(x-1,2);};
    const rnd=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
    // Soft glows are drawn once into small sprites; blurring every frame was the
    // costliest part of the old spiral.
    const sprite=rgb=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
      const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,`rgba(${rgb},1)`);gr.addColorStop(.35,`rgba(${rgb},.4)`);gr.addColorStop(1,`rgba(${rgb},0)`);
      g.fillStyle=gr;g.fillRect(0,0,64,64);return c;};
    const GLOW_BLUE=sprite('150,230,255'),GLOW_GOLD=sprite('255,222,150'),GLOW_WHITE=sprite('255,255,255');
    const glowAt=(spr,x,y,r,a)=>{if(a<=0||r<=0)return;ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a;ctx.drawImage(spr,x-r,y-r,r*2,r*2);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';};
    // The squares get their own layer so the shine can touch only them.
    const layer=document.createElement('canvas');layer.width=canvas.width;layer.height=canvas.height;
    const lctx=layer.getContext('2d'),scalePx=canvas.width/w,reachFrom=Math.max(w,h);
    const homeOf=(i,size)=>{const b=SQ[i];return {x:((b[0]+b[2])/2-129.5)*size/261,y:((b[1]+b[3])/2-130.5)*size/261};};
    function star(x,y,r,rot,a,color){
      if(a<=0||r<=0)return;ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.globalAlpha=a;ctx.fillStyle=color;
      ctx.beginPath();ctx.moveTo(0,-r);ctx.quadraticCurveTo(0,0,r,0);ctx.quadraticCurveTo(0,0,0,r);ctx.quadraticCurveTo(0,0,-r,0);ctx.quadraticCurveTo(0,0,0,-r);ctx.fill();ctx.restore();
    }
    function ringAt(r,a,width,rgb){if(a<=0)return;ctx.beginPath();ctx.ellipse(cx,cy,r,r*.72,-.2,0,TAU);ctx.strokeStyle=`rgba(${rgb},${a.toFixed(3)})`;ctx.lineWidth=width;ctx.stroke();}
    function drawOpening(t){
      ctx.clearRect(0,0,w,h);
      const collapse=smooth(win(t,1750,2350)),spin=easeIn3(win(t,1750,2350))*TAU*1.5;
      const beat=Math.sin(Math.PI*win(t,1650,1780)),scale=1+.08*beat;
      const rays=smooth(win(t,1050,1450))*(1-smooth(win(t,1800,2250)));
      if(rays>0){
        const len=Math.max(190,h*.62);
        ctx.save();ctx.translate(cx,cy);ctx.rotate(t/1000*.6);ctx.globalCompositeOperation='lighter';
        for(let n=0;n<10;n++){
          ctx.rotate(TAU/10);const gr=ctx.createLinearGradient(0,0,0,-len);
          gr.addColorStop(0,`rgba(190,235,255,${((.38+.2*beat)*rays).toFixed(3)})`);gr.addColorStop(1,'rgba(190,235,255,0)');
          ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-16,-len);ctx.lineTo(16,-len);ctx.closePath();ctx.fill();
        }
        ctx.restore();
      }
      glowAt(GLOW_BLUE,cx,cy,100*(1-collapse*.6),(.42+.3*beat+.15*rays)*smooth(win(t,900,1300))*(1-collapse));
      lctx.setTransform(1,0,0,1,0,0);lctx.clearRect(0,0,layer.width,layer.height);lctx.setTransform(scalePx,0,0,scalePx,0,0);
      const size=BIG*scale*(1-.92*collapse),alpha=clamp(t/120)*(1-smooth(win(t,2300,2420)));
      const cos=Math.cos(spin),sin=Math.sin(spin),landings=[];
      const ready=mark.complete&&mark.naturalWidth;
      for(let i=0;i<16;i++){
        const hm=homeOf(i,BIG),st=80+(i%8)*55,side=i%2?1:-1;
        const a0=rnd(i)*TAU,fx=cx+Math.cos(a0)*reachFrom*.8,fy=cy+Math.sin(a0)*reachFrom*.6;
        const k=scale*(1-.92*collapse),tx=cx+(hm.x*k)*cos-(hm.y*k)*sin,ty=cy+(hm.x*k)*sin+(hm.y*k)*cos;
        const at=ff=>[fx+(tx-fx)*ff,fy+(ty-fy)*ff+Math.sin(Math.PI*clamp(ff))*-40*side];
        const f=back(win(t,st,st+700),1.3),[x,y]=at(f);
        if(f>0&&f<1){
          const pts=[];for(let j=5;j>=0;j--)pts.push(at(back(win(t-j*16,st,st+700),1.3)));
          for(let j=1;j<pts.length;j++){const q=j/pts.length;ctx.beginPath();ctx.moveTo(pts[j-1][0],pts[j-1][1]);ctx.lineTo(pts[j][0],pts[j][1]);
            ctx.strokeStyle=`rgba(140,220,255,${(.35*q).toFixed(3)})`;ctx.lineWidth=3*q;ctx.lineCap='round';ctx.stroke();}
        }
        const b=SQ[i],s=size/261,dw=(b[2]-b[0])*s,dh=(b[3]-b[1])*s;
        glowAt(GLOW_BLUE,x,y,Math.max(dw,dh)*1.15,alpha*.55);
        if(ready&&alpha>0){
          lctx.save();lctx.translate(x,y);lctx.rotate((1-clamp(f))*4*side+spin);lctx.globalAlpha=alpha;
          lctx.drawImage(mark,b[0]/314*mark.naturalWidth,b[1]/261*mark.naturalHeight,(b[2]-b[0])/314*mark.naturalWidth,(b[3]-b[1])/261*mark.naturalHeight,-dw/2,-dh/2,dw,dh);
          lctx.restore();
        }
        const land=win(t,st+700,st+1100);if(land>0&&land<1)landings.push([tx,ty,land,i]);
      }
      const shine=win(t,1250,1650);
      if(shine>0&&shine<1){
        const gx=cx-BIG+shine*BIG*2,gr=lctx.createLinearGradient(gx-26,cy-60,gx+26,cy+60);
        gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.5,'rgba(255,255,255,.85)');gr.addColorStop(1,'rgba(255,255,255,0)');
        lctx.globalCompositeOperation='source-atop';lctx.fillStyle=gr;lctx.fillRect(0,0,w,h);lctx.globalCompositeOperation='source-over';
      }
      ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(layer,0,0);ctx.restore();
      // each square clicks into place with a ripple and a few sparkles
      for(const [x,y,a,i] of landings){
        ctx.beginPath();ctx.arc(x,y,6+16*easeOut3(a),0,TAU);ctx.strokeStyle=`rgba(200,240,255,${((1-a)*.8).toFixed(3)})`;ctx.lineWidth=1.4;ctx.stroke();
        for(let n=0;n<3;n++){const ang=n*2.1+i,d=8+16*easeOut3(a);star(x+Math.cos(ang)*d,y+Math.sin(ang)*d,4*(1-a),a*3,1-a,n%2?'#FFFFFF':'#FFE27A');}
      }
      const fl=win(t,2330,2780);
      if(fl>0&&fl<1){glowAt(GLOW_WHITE,cx,cy,30+90*fl,(1-fl)*.95);ringAt(20+150*easeOut3(fl),(1-fl)*.8,2.4,'214,244,255');ringAt(10+100*easeOut3(fl),(1-fl)*.55,1.2,'255,226,168');}
      const bst=win(t,2360,3300);
      if(bst>0&&bst<1)for(let n=0;n<14;n++){
        const ang=n/14*TAU,d=18+100*easeOut3(bst),sx=cx+Math.cos(ang)*d*1.3,sy=cy+Math.sin(ang)*d*.8;
        glowAt(GLOW_GOLD,sx,sy,14*(1-bst),(1-bst)*.8);star(sx,sy,9*(1-bst*.7),bst*4,1-bst,n%2?'#FFFFFF':'#FFD45A');
      }
    }
    function draw(now){
      if(!button.isConnected){stop();return;}
      // Preserve the mobile frame cap. Desktop follows elapsed wall time so
      // a slow frame cannot stretch the whole sequence across many seconds.
      if(lastFrame!==null)sequence.elapsed+=desktop?Math.max(0,now-lastFrame)*1.4:Math.min(40,Math.max(0,now-lastFrame));
      lastFrame=now;
      const elapsed=sequence.elapsed;
      animations.forEach(a=>{a.currentTime=elapsed;});
      placeFace(elapsed);
      if(elapsed>=BADGE_AT&&button.classList.contains('home-ask-wait')){button.classList.remove('home-ask-wait');askBadge.swing(-38);}
      // His hello, once per greeting (a hello resumed after a repaint too
      // late for the whole of it just carries on to his idle).
      if(elapsed>=GREET_AT&&!sequence.greeted){
        sequence.greeted=true;
        if(elapsed<FACE_AT+FACE_MS-1600&&typeof window.drFacePlay==='function')window.drFacePlay(faceSvg,'greet',art,null,P('REACT',3));
      }
      if(elapsed>=FACE_AT+FACE_MS&&!idleRunning&&!sequence.idled){sequence.idled=true;startIdle(button);}
      // Asked once per hello and kept on the sequence, so a hello resumed
      // after a repaint shows the same news rather than the next one.
      if(elapsed>=CLOUD_AT-120&&!newsShown){
        newsShown=true;
        if(!('news' in sequence))sequence.news=window.hubNews?window.hubNews():null;
        thought.news(sequence.news);
      }
      thought.update(Math.max(0,elapsed-CLOUD_AT));
      if(elapsed>=CLOUD_AT&&!messageAnnounced){messageAnnounced=true;thought.announce(0);}
      if(elapsed>=FACE_AT+FACE_MS)hasWavedHello=true;
      if(elapsed>=SEQUENCE_END){stop();return;}
      if(elapsed<OPEN_END)drawOpening(elapsed);
      else if(!sequence.cleared){sequence.cleared=true;ctx.clearRect(0,0,w,h);}
      frame=requestAnimationFrame(draw);
    }
    frame=requestAnimationFrame(draw);
  }

  /* Opening the app repaints Home several times as data arrives, and the
     phone is busiest right then. Start the opening once repainting has been
     quiet for a moment (index.html fires ih:home-paint on every Home paint),
     but never wait more than STARTUP_MAX_WAIT. */
  const STARTUP_QUIET=500, STARTUP_MAX_WAIT=2400;
  let startupWave=null, startupDeadline=0;
  function scheduleStartup(wave){
    startupWave=wave;
    const now=performance.now();
    if(!startupDeadline)startupDeadline=now+STARTUP_MAX_WAIT;
    clearTimeout(startupTimer);
    startupTimer=setTimeout(()=>{
      startupDeadline=0;const w=startupWave;startupWave=null;
      if(w&&w.isConnected&&!hasWavedHello)playGreeting(w);
    },Math.max(0,Math.min(STARTUP_QUIET,startupDeadline-now)));
  }
  document.addEventListener('ih:home-paint',()=>{
    if(startupWave&&startupWave.isConnected&&!hasWavedHello&&!activeSequence)scheduleStartup(startupWave);
  });

  /* ---------- Ask badge: a real pendulum on a soft lanyard ----------
     The "Ask" badge hangs from Dr. Smiley's neck. Instead of a fixed
     animation it is a tiny spring simulation: gravity keeps the badge
     hanging down while he tilts, bounces and wiggles (so it lags and swings
     the way a real one does), friction settles it, and a faint breeze keeps
     it alive. The two lanyard cords are redrawn every frame as soft curves
     from behind his neck to the badge's clip, so they bend as it swings
     instead of turning like a rigid hanger. The cords are drawn inside his
     own drawing, between the coat and the face, so they start hidden behind
     his head, come out under his chin and lie over the coat, the way a
     lanyard sits around a neck; only the clip is drawn above, with the badge.
     Coordinates are the smiley button's (64px; the neck pivot is 32,56; the
     clip sits 15px below it). Runs only while Home's greeting is on screen;
     under Reduce Motion it hangs still. */
  const askBadge=(()=>{
    const f=n=>(Math.round(n*100)/100);
    // A and B are behind his head, either side of the neck; the face hides
    // the cords until they come out under his chin.
    const P={x:32,y:56},A={x:25.5,y:47},B={x:38.5,y:47};
    // Button px to the face drawing's units (viewBox 4 4 112 112 filling the
    // 60px layer that sits at 2,2 in the button).
    const SV=112/60,sx=x=>f((x-2)*SV+4),sy=y=>f((y-2)*SV+4);
    const K=42,C=3.2,G=.5;           // spring stiffness, friction, how much it hangs down when he tilts
    const REST_LIMIT=8;              // swing limit in everyday motion: keeps the badge's corner clear of the quote
    let btn=null,pin=null,tag=null,cords=[],clip=null,raf=0,last=0,theta=0,omega=0,t0=0,released=-1e9;
    // Off screen (scrolled down Home) nobody sees it swing, so it stops.
    let onScreen=true;
    const io=new IntersectionObserver(entries=>{
      // Several notices can arrive at once; only the newest one for the
      // current badge says where it is now.
      for(const e of entries)if(e.target===btn)onScreen=e.isIntersecting;
      if(onScreen)run();
    });
    const rot=(x,y,a)=>{const c=Math.cos(a),s=Math.sin(a);return{x:P.x+x*c-y*s,y:P.y+x*s+y*c};};
    // A soft limit: big swings are allowed right after the entrance and ease
    // down to REST_LIMIT within about a second, with no hard stop.
    function shown(now){
      const lim=REST_LIMIT+30*Math.exp(-Math.max(0,now-released)/650);
      return lim*Math.tanh(theta/lim);
    }
    let deg=0;
    function draw(){
      const theta=deg,a=theta*Math.PI/180,L=rot(-2.5,15,a),R=rot(2.5,15,a);
      // Each cord drops from behind the neck and curves in to the clip.
      const cord=(S,E)=>`M${sx(S.x)} ${sy(S.y)} Q${sx(S.x+(E.x-S.x)*.15)} ${sy(S.y+(E.y-S.y)*.72)} ${sx(E.x)} ${sy(E.y)}`;
      const d=cord(A,L)+' '+cord(B,R);
      for(const c of cords)c.setAttribute('d',d);
      if(clip)clip.setAttribute('transform',`rotate(${f(theta)} ${P.x} ${P.y})`);
      if(tag)tag.style.rotate=f(theta)+'deg';
    }
    function tilt(){                      // Dr. Smiley's own rotation, in degrees
      const w=entranceWave;
      if(!w||!w.effect||w.effect.getComputedTiming().progress===null)return smileyTilt;
      const m=getComputedStyle(pin).transform;
      if(!m||m==='none')return 0;
      const v=m.match(/-?[\d.]+(?:e-?\d+)?/g);
      return v&&v.length>=2?Math.atan2(+v[1],+v[0])*180/Math.PI:0;
    }
    function frame(now){
      raf=0;
      if(!btn||!btn.isConnected||!pin||!pin.isConnected){btn=null;return;}
      const dt=last?Math.min(.033,Math.max(0,(now-last)/1000)):0;last=now;
      const t=(now-t0)/1000;
      const breeze=2.2*Math.sin(t*1.745)+.8*Math.sin(t*3.3+1);
      const target=breeze-G*tilt();
      omega+=(-K*(theta-target)-C*omega)*dt;theta+=omega*dt;
      deg=shown(now);draw();
      if(!document.hidden&&onScreen)raf=requestAnimationFrame(frame);
    }
    function run(){
      if(raf||!btn||reduced.matches||document.hidden||!onScreen)return;
      last=0;raf=requestAnimationFrame(frame);
    }
    function rest(){if(raf)cancelAnimationFrame(raf);raf=0;theta=0;omega=0;deg=0;if(btn)draw();}
    document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;}else run();});
    reduced.addEventListener('change',()=>{if(reduced.matches)rest();else run();});
    return {
      attach(button){
        if(btn)io.unobserve(btn);
        btn=button;pin=button.querySelector('.home-wave-pin');tag=button.querySelector('.home-ask-tag');
        onScreen=true;io.observe(button);
        const lan=button.querySelector('.home-ask-lanyard');
        cords=[...button.querySelectorAll('.home-face .hub-lanyard path')];clip=lan?lan.querySelector('rect'):null;
        t0=performance.now();theta=0;omega=0;deg=0;draw();
        if(raf){cancelAnimationFrame(raf);raf=0;}
        run();
      },
      // The entrance: released from the side once his face has landed.
      swing(start){theta=start;omega=0;released=performance.now();run();}
    };
  })();

  /* Dr. Smiley's halo: the real Hackensack mark turning slowly behind his
     head (styled in home-polish.css), cut into its sixteen squares so any one
     of them can light up. Every 2-4 s one square he isn't covering glows
     once. Only while the greeting is on screen; never under Reduce Motion. */
  const askHalo=(()=>{
    // Each square's box in hmh-mark.png (314 x 261; the art is 260 x 261).
    const SQ=[[60,0,113,53],[152,9,193,44],[109,45,151,78],[54,55,107,108],[152,55,205,108],[207,61,259,113],[9,67,43,109],[44,109,78,151],
      [182,109,216,151],[0,147,52,200],[217,152,251,194],[54,153,107,206],[152,153,205,206],[109,182,151,216],[147,207,199,261],[66,217,108,251]];
    let ring=null,timer=0,uid=0;
    function svg(){
      const id='hq'+(++uid)+'-';let defs='',g='';
      SQ.forEach((q,i)=>{
        const w=q[2]-q[0],h=q[3]-q[1];
        defs+=`<clipPath id="${id}${i}"><rect x="${q[0]}" y="${q[1]}" width="${w}" height="${h}"/></clipPath>`;
        // The empty rect gives each square a measurable box of its own.
        g+=`<g class="home-ask-sq" style="transform-origin:${q[0]+w/2}px ${q[1]+h/2}px"><image href="./hmh-mark.png" width="314" height="261" clip-path="url(#${id}${i})"/>`
          +`<rect x="${q[0]}" y="${q[1]}" width="${w}" height="${h}" fill="none"/></g>`;
      });
      return `<svg viewBox="0 0 260 261" focusable="false"><defs>${defs}</defs>${g}</svg>`;
    }
    function glow(){
      const btn=ring.parentElement,b=btn.getBoundingClientRect(),cx=(b.left+b.right)/2,cy=(b.top+b.bottom)/2,k=b.width/64;
      // Visible: above his coat and outside his face (about 25px across the
      // middle at his drawn size; k for his size in the greeting).
      const seen=[...ring.querySelectorAll('.home-ask-sq')].filter(q=>{
        const r=q.lastChild.getBoundingClientRect(),x=(r.left+r.right)/2-cx,y=(r.top+r.bottom)/2-cy;
        return y<12*k&&Math.hypot(x,y)>27*k;
      });
      const q=seen[Math.floor(Math.random()*seen.length)];
      if(!q)return;
      q.classList.remove('is-glow');void q.getBBox();q.classList.add('is-glow');
      setTimeout(()=>q.classList.remove('is-glow'),1550);
    }
    function tick(){
      timer=0;
      if(!ring||!ring.isConnected){ring=null;return;}
      if(ring.parentElement.offsetParent&&getComputedStyle(ring).opacity>.5)glow();
      schedule();
    }
    function schedule(){
      clearTimeout(timer);timer=0;
      if(ring&&!reduced.matches&&!document.hidden)timer=setTimeout(tick,2000+Math.random()*2000);
    }
    document.addEventListener('visibilitychange',schedule);
    reduced.addEventListener('change',schedule);
    return {attach(el){ring=el;el.innerHTML=svg();schedule();}};
  })();

  /* Heartline Signature (picked by Jose: idea 5 of the heartbeat set). A
     pink heart-monitor line under the greeting's name (Jose moved it there
     from above Dr. Smiley) draws itself -- a beat, a loop into a heart,
     another beat -- holds, fades, and comes back every few seconds. It waits
     for the hello to finish and for the name to be written, and steps aside
     while his thought cloud is up.
     Under Reduce Motion it is simply there, drawn and still. The drawing
     itself is in home-polish.css (.home-heartline). */
  const heartline=(()=>{
    const BEAT='h5.4 q1.8 -3 3.6 0 h2.7 l1.35 2 l2.25 -16 l2.7 22 l1.8 -8 h3.6 q2.7 -5 5.4 0 h7.2';
    // One unbroken stroke, so it draws strictly left to right: after closing
    // the heart it runs back over the top of it (unseen: a stroke never
    // doubles itself) and carries on from the right lobe. A jump (M) here would
    // start a second piece drawing at the same time as the first.
    const TOP='C44 -10 58 -12 60 -2 C62 -12 76 -10 76 2';
    const D=`M-14 2 H6 ${BEAT} H44 ${TOP} C76 12 64 18 60 24 C56 18 44 12 44 2 ${TOP} H84 ${BEAT} H134`;
    let el=null,btn=null,timer=0;
    const busy=()=>!hasWavedHello||!!activeSequence||btn.classList.contains('home-wave-pending')||!!el.parentElement.querySelector('.home-name-pen')
      ||[...document.querySelectorAll('.home-wave-thought')].some(t=>+getComputedStyle(t).opacity>.02);
    function tick(){
      timer=0;
      if(!el||!el.isConnected){el=null;return;}
      if(busy())el.classList.remove('is-draw');
      else if(el.offsetParent||el.getBoundingClientRect().width){el.classList.remove('is-draw');void el.getBoundingClientRect();el.classList.add('is-draw');}
      schedule();
    }
    function schedule(wait){
      clearTimeout(timer);timer=0;
      if(el&&!reduced.matches&&!document.hidden)timer=setTimeout(tick,wait||5200+Math.random()*1300);
    }
    document.addEventListener('visibilitychange',()=>schedule(1500));
    reduced.addEventListener('change',()=>schedule(1500));
    // Centred under the name's letters, sized to the name (two letter-heights
    // wide), just below them. Again whenever the greeting's layout changes (fitWave).
    function place(){
      if(!el||!el.isConnected)return;
      const row=el.parentElement,name=row.querySelector('.home-greeting-name');if(!name)return;
      const rg=document.createRange();rg.selectNodeContents(name);
      const r=rg.getBoundingClientRect(),rr=row.getBoundingClientRect();if(!r.width)return;
      const fs=parseFloat(getComputedStyle(name).fontSize)||56,w=Math.max(96,Math.min(170,fs*2)),h=w*43/152;
      el.style.width=w+'px';el.style.height=h+'px';
      el.style.left=Math.max(0,(r.left+r.right)/2-rr.left-row.clientLeft-w/2).toFixed(1)+'px';
      el.style.top=(r.bottom-rr.top-row.clientTop-h*.22).toFixed(1)+'px';
    }
    return {
      attach(button){
        el=document.createElementNS('http://www.w3.org/2000/svg','svg');
        el.setAttribute('class','home-heartline');el.setAttribute('viewBox','-16 -16 152 43');
        el.setAttribute('aria-hidden','true');el.setAttribute('focusable','false');
        el.innerHTML=`<path class="hl-glow" pathLength="100" d="${D}"/><path class="hl-core" pathLength="100" d="${D}"/>`;
        btn=button;button.parentElement.appendChild(el);place();schedule(1500);
      },
      place,
      // The hello is starting again: clear the line now rather than at the next beat.
      hide(){if(el)el.classList.remove('is-draw');schedule(1500);}
    };
  })();

  /* ---------- The name, written in light ----------
     The first time Home opens, a small navy ball of light writes the
     greeting's name the way a pen would (Jose's pick: look A, navy, slow).
     The pen's path comes from the letters themselves: the name is drawn on a
     canvas in its own face, thinned to its centre line, and that line is
     walked left to right, each letter finished before the next, the accent
     and the i-dots last (penPathOf). Worked out once per name and kept on
     this phone (ih_penPath). While it writes, the real name is in place but
     invisible (.is-penning) and an SVG copy of it is revealed behind the
     ball; at the end the real name is back. Reduced motion, Still, a hidden
     page or anything going wrong: no pen, the name is simply there. */
  const namePen=(()=>{
    const KEY='ih_penPath', VER=2, NS='http://www.w3.org/2000/svg';
    let lastTxt=null, run=null, held=null, safety=0, waiting=null;
    // The pen's path through a name, in em units from the start of its baseline:
    // [[x,y],...] per stroke, in writing order. null when it can't be worked out.
    function penPathOf(txt,family){
      const S=300, cv=document.createElement('canvas'), x=cv.getContext('2d',{willReadFrequently:true});
      if(!x||!txt)return null;
      const font=`400 ${S}px ${family}`;x.font=font;
      const m=x.measureText(txt), pad=24;
      const L=m.actualBoundingBoxLeft||0, R=m.actualBoundingBoxRight||m.width, A=m.actualBoundingBoxAscent||S*.8, D=m.actualBoundingBoxDescent||S*.35;
      const W=Math.ceil(L+R+2*pad), H=Math.ceil(A+D+2*pad);
      if(!(W>0&&H>0)||W*H>4e6)return null;
      cv.width=W;cv.height=H;x.font=font;
      const ox=pad+L, oy=pad+A;x.fillText(txt,ox,oy);
      const px=x.getImageData(0,0,W,H).data, n=W*H;
      let b=new Uint8Array(n);for(let i=0;i<n;i++)b[i]=px[i*4+3]>115?1:0;
      // close hairline gaps, then thin the letters to their centre line (Zhang-Suen)
      const grow=(src,on)=>{const out=new Uint8Array(n);for(let y=1;y<H-1;y++)for(let xx=1;xx<W-1;xx++){const i=y*W+xx;let v=on?0:1;
        for(let dy=-1;dy<=1&&(on?!v:v);dy++)for(let dx=-1;dx<=1;dx++){const s=src[i+dy*W+dx];if(on&&s){v=1;break;}if(!on&&!s){v=0;break;}}out[i]=v;}return out;};
      b=grow(grow(b,true),false);
      const del=[];let changed=true;
      while(changed){changed=false;
        for(let pass=0;pass<2;pass++){del.length=0;
          for(let y=1;y<H-1;y++)for(let xx=1;xx<W-1;xx++){const i=y*W+xx;if(!b[i])continue;
            const p2=b[i-W],p3=b[i-W+1],p4=b[i+1],p5=b[i+W+1],p6=b[i+W],p7=b[i+W-1],p8=b[i-1],p9=b[i-W-1];
            const B=p2+p3+p4+p5+p6+p7+p8+p9;if(B<2||B>6)continue;
            const T=(!p2&&p3)+(!p3&&p4)+(!p4&&p5)+(!p5&&p6)+(!p6&&p7)+(!p7&&p8)+(!p8&&p9)+(!p9&&p2);if(T!==1)continue;
            if(pass===0?(p2&&p4&&p6)||(p4&&p6&&p8):(p2&&p4&&p8)||(p2&&p6&&p8))continue;
            del.push(i);}
          if(del.length){changed=true;for(const i of del)b[i]=0;}}}
      // the centre line as a graph of pixels (no diagonal shortcuts across a corner)
      const id=new Int32Array(n).fill(-1), X=[], Y=[];
      for(let i=0;i<n;i++)if(b[i]){id[i]=X.length;X.push(i%W);Y.push((i/W)|0);}
      const N=X.length;if(!N||N>80000)return null;
      const adj=[];for(let k=0;k<N;k++){const a=[];const i=Y[k]*W+X[k];
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const j=id[i+dy*W+dx];if(j<0)continue;
          if(dx&&dy&&(id[i+dx]>=0||id[i+dy*W]>=0))continue;a.push(j);}adj.push(a);}
      const alive=new Uint8Array(N).fill(1), deg=k=>{let c=0;for(const j of adj[k])if(alive[j])c++;return c;};
      const plen=p=>{let s=0;for(let i=1;i<p.length;i++)s+=Math.hypot(X[p[i]]-X[p[i-1]],Y[p[i]]-Y[p[i-1]]);return s;};
      const chains=()=>{const out=[], seen=new Set(), key=[];
        for(let k=0;k<N;k++)if(alive[k]&&deg(k)!==2)key.push(k);
        const isKey=new Uint8Array(N);for(const k of key)isKey[k]=1;
        const used=new Uint8Array(N);
        for(const k of key)for(const nb of adj[k]){if(!alive[nb]||seen.has(k*N+nb))continue;
          const p=[k,nb];seen.add(k*N+nb);seen.add(nb*N+k);
          while(!isKey[p[p.length-1]]){const cur=p[p.length-1], prev=p[p.length-2];let nx=-1;for(const j of adj[cur])if(alive[j]&&j!==prev){nx=j;break;}
            if(nx<0)break;seen.add(cur*N+nx);seen.add(nx*N+cur);p.push(nx);}
          for(const q of p)used[q]=1;out.push(p);}
        // closed loops with no ends or junctions (an "o" on its own)
        for(let k=0;k<N;k++){if(!alive[k]||used[k])continue;
          const p=[k];used[k]=1;let prev=-1,cur=k;
          for(;;){let nx=-1;for(const j of adj[cur])if(alive[j]&&j!==prev&&!used[j]){nx=j;break;}if(nx<0)break;used[nx]=1;p.push(nx);prev=cur;cur=nx;}
          p.push(k);out.push(p);}
        return out;};
      // trim the little whiskers thinning leaves at corners
      for(let r=0;r<4;r++){let ch=false;
        for(const c of chains()){const a=c[0],z=c[c.length-1],da=deg(a)===1,dz=deg(z)===1;
          if(da!==dz&&plen(c)<.05*S){for(const q of(da?c.slice(0,-1):c.slice(1)))if(alive[q]&&deg(q)<=2){alive[q]=0;ch=true;}}}
        if(!ch)break;}
      for(let k=0;k<N;k++)if(alive[k]&&!deg(k))alive[k]=0;
      const E=chains().filter(c=>plen(c)>2);
      // pieces: letters, and marks (accent, i-dots) drawn last
      const comp=new Int32Array(N).fill(-1), comps=[];
      for(let k=0;k<N;k++){if(!alive[k]||comp[k]>=0)continue;const c={nodes:[],x0:1e9,x1:-1e9,y0:1e9,y1:-1e9},st=[k];comp[k]=comps.length;
        while(st.length){const q=st.pop();c.nodes.push(q);c.x0=Math.min(c.x0,X[q]);c.x1=Math.max(c.x1,X[q]);c.y0=Math.min(c.y0,Y[q]);c.y1=Math.max(c.y1,Y[q]);
          for(const j of adj[q])if(alive[j]&&comp[j]<0){comp[j]=comps.length;st.push(j);}}
        c.mark=c.y1-c.y0<.22*S&&c.x1-c.x0<.3*S&&c.y1<oy-.2*S;comps.push(c);}
      const order=comps.map((c,i)=>({c,i})).sort((a,b)=>(a.c.mark-b.c.mark)||(a.c.x0-b.c.x0));
      const dir=(p,a,z)=>Math.atan2(Y[p[z]]-Y[p[a]],X[p[z]]-X[p[a]]);
      const strokes=[];
      for(const {c,i:ci} of order){
        const Ec=E.filter(e=>comp[e[0]]===ci);if(!Ec.length)continue;
        const unvis=new Set(Ec.map((_,k)=>k));
        const ends=c.nodes.filter(k=>deg(k)===1);
        let cur=(ends.length?ends:c.nodes).reduce((a,k)=>(X[k]<X[a]||(X[k]===X[a]&&Y[k]<Y[a]))?k:a);
        let heading=0, stroke=[cur];
        const H=new Map();Ec.forEach((e,k)=>{const w=plen(e);for(const[a,z]of[[e[0],e[e.length-1]],[e[e.length-1],e[0]]]){if(!H.has(a))H.set(a,[]);H.get(a).push({to:z,w,k});}});
        while(unvis.size){
          let best=null;
          for(const k of unvis){const e=Ec[k];const p=e[0]===cur?e:e[e.length-1]===cur?e.slice().reverse():null;if(!p)continue;
            const d=dir(p,0,Math.min(p.length-1,10)), t=Math.abs(((d-heading+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI);
            let cx=0;for(const q of p)cx+=X[q];cx/=p.length;const s=t+3*Math.max(0,cx-X[cur])/S;
            if(!best||s<best.s)best={s,k,p};}
          if(best){unvis.delete(best.k);const p=best.p;for(let q=1;q<p.length;q++)stroke.push(p[q]);cur=p[p.length-1];heading=dir(p,Math.max(0,p.length-10),p.length-1);continue;}
          // nothing left here: go back along what's drawn (a short way) or lift the pen
          let nk=-1,nx=1e9;for(const k of unvis){let m=1e9;for(const q of Ec[k])m=Math.min(m,X[q]);if(m<nx){nx=m;nk=k;}}
          const tg=[Ec[nk][0],Ec[nk][Ec[nk].length-1]];
          const dist=new Map([[cur,0]]),prev=new Map(),todo=new Set([cur]);
          while(todo.size){let u=-1,du=1e9;for(const q of todo){const d=dist.get(q);if(d<du){du=d;u=q;}}todo.delete(u);
            for(const ed of H.get(u)||[]){const nd=du+ed.w;if(nd<(dist.has(ed.to)?dist.get(ed.to):1e9)){dist.set(ed.to,nd);prev.set(ed.to,{from:u,k:ed.k});todo.add(ed.to);}}}
          const reach=tg.filter(t=>dist.has(t)).sort((a,z)=>dist.get(a)-dist.get(z));
          if(reach.length&&dist.get(reach[0])<.12*S){const t=reach[0], route=[];let q=t;while(q!==cur){const pv=prev.get(q);route.unshift(pv);q=pv.from;}
            for(const st of route){const e=Ec[st.k], p=e[0]===st.from?e:e.slice().reverse();for(let q2=1;q2<p.length;q2++)stroke.push(p[q2]);}
            cur=t;}
          else{strokes.push(stroke);cur=tg.reduce((a,t)=>Math.hypot(X[t]-X[cur],Y[t]-Y[cur])<Math.hypot(X[a]-X[cur],Y[a]-Y[cur])?t:a);stroke=[cur];}
        }
        strokes.push(stroke);
      }
      // smooth: drop near-straight points, then round the corners twice
      const rdp=(p,eps)=>{if(p.length<3)return p;const[ax,ay]=p[0],[bx,by]=p[p.length-1],L2=Math.hypot(bx-ax,by-ay)||1e-9;let mi=0,md=-1;
        for(let i=1;i<p.length-1;i++){const d=Math.abs((bx-ax)*(p[i][1]-ay)-(by-ay)*(p[i][0]-ax))/L2;if(d>md){md=d;mi=i;}}
        return md>eps?rdp(p.slice(0,mi+1),eps).slice(0,-1).concat(rdp(p.slice(mi),eps)):[p[0],p[p.length-1]];};
      const chaikin=p=>{const o=[p[0]];for(let i=0;i<p.length-1;i++){const[a,c]=p[i],[bq,d]=p[i+1];o.push([.75*a+.25*bq,.75*c+.25*d],[.25*a+.75*bq,.25*c+.75*d]);}o.push(p[p.length-1]);return o;};
      const out=[];
      for(const s of strokes){if(s.length<3)continue;let p=s.map(k=>[X[k],Y[k]]);p=chaikin(chaikin(rdp(p,.9)));
        out.push(p.map(([a,c])=>[+((a-ox)/S).toFixed(3),+((c-oy)/S).toFixed(3)]));}
      return out.length?out:null;
    }
    function pathFor(txt,family){
      try{const c=JSON.parse(localStorage.getItem(KEY)||'{}'),v=c[txt];if(v&&v.v===VER&&v.f===family)return v.s;}catch(e){}
      let s=null;try{s=penPathOf(txt,family);}catch(e){s=null;}
      if(s)try{const c=JSON.parse(localStorage.getItem(KEY)||'{}');delete c[txt];c[txt]={v:VER,f:family,s};
        const k=Object.keys(c);while(k.length>4)delete c[k.shift()];localStorage.setItem(KEY,JSON.stringify(c));}catch(e){}
      return s;
    }
    const show=name=>{if(name)name.classList.remove('is-penning');};
    // Before the hello: keep the name back so it can be written, never longer than 6 s.
    function hold(name){
      if(run||waiting||!name||still())return;
      held=name;name.classList.add('is-penning');
      clearTimeout(safety);safety=setTimeout(()=>{if(!run)show(held);},6000);
    }
    function release(){clearTimeout(safety);if(waiting){const w=waiting;waiting=null;show(w.name);}if(run)run.stop();else show(held);held=null;}
    /* Write the name: with every hello (the app opening, or coming back to
       it, which replays the hello), and when the name itself changes. */
    function start(button){
      const name=button&&button.parentElement&&button.parentElement.querySelector('.home-greeting-name');
      if(!name||run||waiting)return;
      clearTimeout(safety);
      if(still()||document.hidden){show(name);return;}
      name.classList.add('is-penning');
      const txt=name.textContent.trim(), cs=getComputedStyle(name), family=cs.fontFamily, size=parseFloat(cs.fontSize);
      lastTxt=txt;
      const w=waiting={name,txt};
      const fail=()=>{if(waiting===w)waiting=null;run=null;show(w.name);};
      const fontOk=document.fonts&&document.fonts.load?Promise.race([document.fonts.load(`400 ${size}px ${family}`,txt),new Promise(r=>setTimeout(r,1500))]):Promise.resolve();
      fontOk.then(()=>{
        if(waiting!==w)return;
        const nm=w.name;
        if(!nm.isConnected||document.hidden||still())return fail();
        if(document.fonts&&document.fonts.check&&!document.fonts.check(`400 ${size}px ${family}`,txt))return fail();
        const strokes=pathFor(txt,family);
        if(!strokes)return fail();
        waiting=null;
        write(nm,txt,family,parseFloat(getComputedStyle(nm).fontSize)||size,strokes,0);
      },fail);
    }
    /* Home builds a new greeting when its content changes while the app is
       opening (data arriving: his outfit for the team's rank, say). The old
       name and its half-written copy go with the old greeting; carry the
       writing over to the new name, from the same moment, instead of letting
       the complete name pop back in. */
    function adopt(name){
      if(!name)return;
      const txt=name.textContent.trim();
      if(waiting){ if(waiting.txt===txt){show(waiting.name);waiting.name=name;name.classList.add('is-penning');}else{const w=waiting;waiting=null;show(w.name);} return; }
      if(!run)return;
      const r=run;r.stop(true);
      if(r.txt!==txt||still()||document.hidden)return;
      name.classList.add('is-penning');
      write(name,txt,r.family,parseFloat(getComputedStyle(name).fontSize)||r.size,r.strokes,r.elapsed());
    }
    function write(name,txt,family,size,strokes,from){
      const row=name.parentElement;
      // where the name's baseline starts, in the row's own coordinates
      const mk=document.createElement('span');mk.style.cssText='display:inline-block;width:0;height:0;vertical-align:baseline';
      name.insertBefore(mk,name.firstChild);
      const r=mk.getBoundingClientRect(), rr=row.getBoundingClientRect();mk.remove();
      const ox=r.left-rr.left-row.clientLeft, oy=r.top-rr.top-row.clientTop, W=row.clientWidth, H=row.clientHeight;
      const nr0=name.getBoundingClientRect(), at={x:nr0.left-rr.left,y:nr0.top-rr.top};
      const el=(tag,attrs,parent)=>{const n=document.createElementNS(NS,tag);for(const k in attrs)n.setAttribute(k,attrs[k]);if(parent)parent.appendChild(n);return n;};
      const svg=el('svg',{class:'home-name-pen','aria-hidden':'true',focusable:'false',width:W,height:H,viewBox:`0 0 ${W} ${H}`});
      const defs=el('defs',{},svg);
      // the name's own shadow (home-polish.css, the lettering block), as SVG
      const sh=el('filter',{id:'hnpShadow',x:'-30%',y:'-60%',width:'160%',height:'220%'},defs);
      [[1,1,.6],[2,3,.35],[3,11,.42]].forEach(([dy,sd,o])=>el('feDropShadow',{dx:0,dy,stdDeviation:sd,'flood-color':'#040e1c','flood-opacity':o},sh));
      const glow=el('filter',{id:'hnpGlow',x:'-50%',y:'-50%',width:'200%',height:'200%'},defs);el('feGaussianBlur',{stdDeviation:size*.045},glow);
      const rg=el('radialGradient',{id:'hnpBall'},defs);
      [[0,'#ffffff',1],[.13,'#e6ebff',1],[.3,'#7686ea',.95],[.56,'#252E6D',.82],[1,'#252E6D',0]].forEach(([o,c,a])=>el('stop',{offset:o,'stop-color':c,'stop-opacity':a},rg));
      const mask=el('mask',{id:'hnpInk',maskUnits:'userSpaceOnUse',x:-W,y:-H,width:W*3,height:H*3},defs);
      el('rect',{x:-W,y:-H,width:W*3,height:H*3,fill:'#000'},mask);
      const band=el('g',{fill:'none',stroke:'#fff','stroke-linecap':'round','stroke-linejoin':'round','stroke-width':size*.11},mask);
      // The ink is drawn from the very points the light is placed on, a little
      // more each frame, so the two can't drift apart (SVG dashes did, on iPhone).
      const pts=strokes.map(s=>s.map(([x,y])=>[ox+x*size,oy+y*size]));
      const cum=pts.map(p=>{const c=[0];for(let i=1;i<p.length;i++)c.push(c[i-1]+Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]));return c;});
      const paths=pts.map(()=>el('path',{d:''},band)), drawn=pts.map(()=>-1);
      // the point a distance along stroke i, and the ink up to it
      const pointAt=(i,dist)=>{const p=pts[i],c=cum[i];let lo=1,hi=c.length-1;
        if(dist>=c[hi])return{x:p[hi][0],y:p[hi][1],k:hi,f:1};
        while(lo<hi){const m=(lo+hi)>>1;if(c[m]<dist)lo=m+1;else hi=m;}
        const f=(dist-c[lo-1])/((c[lo]-c[lo-1])||1);return{x:p[lo-1][0]+(p[lo][0]-p[lo-1][0])*f,y:p[lo-1][1]+(p[lo][1]-p[lo-1][1])*f,k:lo,f};};
      const inkTo=(i,dist)=>{if(dist===drawn[i])return;drawn[i]=dist;
        if(dist<=0){paths[i].setAttribute('d','');return;}
        const q=pointAt(i,dist),p=pts[i];let d='M'+p[0][0].toFixed(1)+' '+p[0][1].toFixed(1);
        for(let j=1;j<q.k;j++)d+='L'+p[j][0].toFixed(1)+' '+p[j][1].toFixed(1);
        paths[i].setAttribute('d',d+'L'+q.x.toFixed(1)+' '+q.y.toFixed(1));};
      const full=el('rect',{x:-W,y:-H,width:W*3,height:H*3,fill:'#fff',opacity:0},mask);
      const ink=el('g',{mask:'url(#hnpInk)'},el('g',{filter:'url(#hnpShadow)'},svg));
      const t=el('text',{x:ox,y:oy,'font-size':size,fill:'#fff'},ink);t.style.fontFamily=family;t.textContent=txt;
      const sparks=el('g',{},svg), ball=el('g',{opacity:0},svg);
      el('circle',{r:size*.34,fill:'url(#hnpBall)'},ball);
      el('circle',{r:size*.1,fill:'#3646b8',opacity:.5,filter:'url(#hnpGlow)'},ball);
      el('circle',{r:size*.048,fill:'#fff'},ball);
      row.appendChild(svg);
      // timing: about 1.5 s of ink for "José", never more than 3 s (the speed
      // Jose picked). Between strokes the pen lifts: the light glides to the
      // next one, dimming only for a longer hop (to an accent or an i-dot);
      // all the lifts together take under a second.
      const lens=cum.map(c=>c[c.length-1]), sum=lens.reduce((a,b)=>a+b,0)||1, em=sum/size;
      const drawMs=Math.min(3000,1500*Math.pow(em/7.63,.6));
      const gaps=pts.slice(1).map((p,i)=>{const a=pts[i][pts[i].length-1],b=p[0],dist=Math.hypot(b[0]-a[0],b[1]-a[1]);
        return{a,b,dur:Math.min(160,40+dist/size*120),dip:Math.min(.85,dist/(size*.6))};});
      const gapSum=gaps.reduce((t,g)=>t+g.dur,0), gk=gapSum>900?900/gapSum:1;
      const phases=[], lifts=[];let t0=0;
      lens.forEach((L,i)=>{const d=Math.max(60,drawMs*L/sum);phases.push({i,start:t0,dur:d});t0+=d;
        if(i<gaps.length){const g=gaps[i];lifts.push({...g,start:t0,dur:g.dur*gk});t0+=g.dur*gk;}});
      const total=t0, ease=u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
      // Its own clock: each frame moves it on by at most 64 ms, so when the
      // phone is busy opening the app (a frame late by a second or more) the
      // pen carries on from where it was instead of jumping to the end.
      let raf=0, lastSpark=0, clock=from||0, last=0, done=false;
      const spark=(x,y)=>{
        const c=el('circle',{cx:x+(Math.random()-.5)*size*.06,cy:y+(Math.random()-.5)*size*.06,r:size*(.012+Math.random()*.016),fill:'#a7b3ff'},sparks);
        if(!c.animate){c.remove();return;}
        const a=c.animate([{opacity:.95,transform:'translate(0,0)'},{opacity:0,transform:`translate(${(Math.random()-.5)*size*.25}px,${size*(.05+Math.random()*.2)}px)`}],{duration:520+Math.random()*260,easing:'cubic-bezier(.2,.7,.3,1)'});
        a.onfinish=()=>c.remove();
      };
      // Stop: the copy goes and the real name shows. Handing over (adopt): the
      // copy goes and the new greeting's name takes over the writing.
      function stop(handover){
        if(done)return;done=true;cancelAnimationFrame(raf);
        svg.remove();if(!handover)show(name);if(run&&run.stop===stop)run=null;
      }
      let dx=0, dy=0;
      function tick(now){
        if(!svg.isConnected||document.hidden||!name.isConnected)return stop();
        clock+=last?Math.min(64,Math.max(0,now-last)):0;last=now;const tm=clock;
        // the name moved inside its row (he stepped beside a longer name): follow it
        const nr=name.getBoundingClientRect(), rr2=row.getBoundingClientRect(), mx=nr.left-rr2.left-at.x, my=nr.top-rr2.top-at.y;
        if(Math.abs(mx-dx)>.5||Math.abs(my-dy)>.5){dx=mx;dy=my;svg.style.transform=`translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px)`;}
        for(const ph of phases){const u=Math.min(1,Math.max(0,(tm-ph.start)/ph.dur));inkTo(ph.i,lens[ph.i]*ease(u));}
        const ph=phases.find(p=>tm>=p.start&&tm<p.start+p.dur);
        const lf=!ph&&lifts.find(l=>tm>=l.start&&tm<l.start+l.dur);
        if(ph){
          const u=(tm-ph.start)/ph.dur, pt=pointAt(ph.i,lens[ph.i]*ease(u));
          ball.setAttribute('transform',`translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`);
          ball.setAttribute('opacity',(ph.i===0?Math.min(1,(tm-ph.start)/80):1).toFixed(3));
          if(tm-lastSpark>30){spark(pt.x,pt.y);lastSpark=tm;}
        }else if(lf){
          // the pen lifted: glide to the next stroke, dimming for a longer hop
          const u=(tm-lf.start)/lf.dur, e=ease(u);
          ball.setAttribute('transform',`translate(${(lf.a[0]+(lf.b[0]-lf.a[0])*e).toFixed(2)} ${(lf.a[1]+(lf.b[1]-lf.a[1])*e).toFixed(2)})`);
          ball.setAttribute('opacity',(1-lf.dip*Math.sin(Math.PI*u)).toFixed(3));
        }else ball.setAttribute('opacity',0);
        if(tm>=total){
          // the last of the ink settles in and the light flares out
          const last=phases[phases.length-1], pt=pointAt(last.i,lens[last.i]);
          ball.setAttribute('transform',`translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`);ball.setAttribute('opacity',1);
          if(full.animate)full.animate([{opacity:0},{opacity:1}],{duration:380,fill:'forwards'});else full.setAttribute('opacity',1);
          const inner=el('g',{},ball);while(ball.firstChild!==inner)inner.appendChild(ball.firstChild);
          if(inner.animate)inner.animate([{transform:'scale(1)',opacity:1},{transform:'scale(1.7)',opacity:1,offset:.35},{transform:'scale(.4)',opacity:0}],{duration:620,easing:'ease-out',fill:'forwards'});
          setTimeout(stop,660);return;
        }
        raf=requestAnimationFrame(tick);
      }
      run={stop,txt,family,size,strokes,elapsed:()=>clock};
      // a breath after Dr. Smiley starts to appear (none when carrying on)
      if(from)raf=requestAnimationFrame(tick);else setTimeout(()=>{if(!done)raf=requestAnimationFrame(tick);},350);
    }
    // a greeting showing a different name from the one last written (set or changed since)
    const changed=name=>!!name&&lastTxt!==null&&name.textContent.trim()!==lastTxt;
    return {hold,start,release,adopt,changed,get busy(){return !!(run||waiting);}};
  })();

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
    // Ask the Hub: the Hackensack halo, and the "Ask" badge on the lanyard
    // round Dr. Smiley's neck (styled in home-polish.css). The badge lives
    // inside the face layer (pin), so it springs, bounces, laughs and wiggles
    // with him; the layer's pivot is his neck.
    const ring=document.createElement('span');ring.className='home-ask-ring';ring.setAttribute('aria-hidden','true');
    wave.append(ring);askHalo.attach(ring);
    // The disc he pops out of (home-polish.css), in front of the turning mark, behind him.
    const disc=document.createElement('span');disc.className='home-ask-disc';disc.setAttribute('aria-hidden','true');
    pin.before(disc);
    heartline.attach(wave);
    // His lanyard, as on the old smiley: two navy cords that come out from
    // under his chin and meet at the badge's clip, redrawn every frame by
    // askBadge so they swing with it. They sit on top of his picture, and a
    // mask in the shape of his head and jaw hides the part behind his chin.
    // Drawing units (viewBox 4 4 112 112); fixed ids, as only one greeting exists.
    const art=pin.querySelector('.home-face');
    if(art)art.insertAdjacentHTML('beforeend','<defs><mask id="dsNeckMask" maskUnits="userSpaceOnUse" x="-20" y="-40" width="160" height="200">'
      +'<rect x="-20" y="-40" width="160" height="200" fill="#fff"/>'
      +'<path fill="#000" d="M-20 -40 H140 V88.7 L107.6 88.7 L106.5 89.6 L97.0 90.5 L95.9 91.3 L95.3 92.2 L94.6 93.1 L93.7 94.0 L92.8 94.9 L91.7 95.8 L90.6 96.6 L89.3 97.5 L87.8 98.4 L85.8 99.3 L83.6 100.2 L80.9 101.1 L77.8 101.9 L69.7 102.8 L59.5 103.5 L54.2 102.6 L50.4 101.7 L47.3 100.8 L45.1 100.0 L43.1 99.1 L41.4 98.2 L39.6 97.3 L38.1 96.4 L36.5 95.5 L35.2 94.7 L33.9 93.8 L32.8 92.9 L31.7 92.0 L30.8 91.1 L29.9 90.2 L29.2 89.4 L-20 88.7 Z"/></mask></defs>'
      +'<g class="hub-lanyard" mask="url(#dsNeckMask)">'
      +'<path fill="none" stroke="#151B48" stroke-width="5.6" stroke-linecap="round" stroke-linejoin="round"/>'
      +'<path fill="none" stroke="#2C3E9E" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>'
      +'<path fill="none" stroke="#7D93E8" stroke-opacity=".55" stroke-width="1" stroke-linecap="round" transform="translate(-.6 -.4)"/></g>');
    // Only the clip sits above, with the badge.
    pin.insertAdjacentHTML('beforeend','<svg class="home-ask-lanyard" viewBox="0 0 64 100" aria-hidden="true" focusable="false">'
      +'<rect x="29" y="69" width="6" height="5" rx="1.5" fill="#C9D3E0" stroke="#151B48" stroke-width="1.1"/></svg>');
    const tag=document.createElement('span');tag.className='home-ask-tag';tag.setAttribute('aria-hidden','true');
    tag.innerHTML='<span class="home-ask-tag-mark"><img src="./hmh-mark-square.png" alt=""></span>Ask';
    pin.append(tag);
    askBadge.attach(wave);
    const name=wave.parentElement.querySelector('.home-greeting-name');
    keepQuoteEnd(wave.closest('.home-greeting-text'));
    if(namePen.busy)namePen.adopt(name);
    else if(!hasWavedHello&&!(resume&&resume.elapsed<SEQUENCE_END))namePen.hold(name);
    else if(namePen.changed(name))namePen.start(wave);
    fitWave(wave);
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{if(wave.isConnected)fitWave(wave);});
    // The name's script face can arrive after that (it swaps in), and is wider than the fallback.
    if(document.fonts&&document.fonts.load&&name)document.fonts.load('400 56px Parisienne',name.textContent).then(()=>{if(wave.isConnected)fitWave(wave);},()=>{});
    const play=()=>playGreeting(wave);
    // Tapping the smiley opens Ask the Hub (index.html, window.openAskHub).
    // The hello still plays by itself when the app opens; if Ask the Hub is
    // missing, a tap replays the hello as it always did.
    // Press and hold to pet him (index.html, smileyPettable): a giggle and
    // hearts, and that press doesn't open Ask.
    const petted=typeof window.smileyPettable==='function'?window.smileyPettable(wave,()=>{if(window.drSetMood)window.drSetMood('happy',180000);actNow('pet');}):()=>false;
    wave.addEventListener('click',e=>{
      if(petted()){e.preventDefault();return;}
      if(typeof window.openAskHub!=='function'){play();return;}
      wave.classList.add('home-wave-tap');
      setTimeout(()=>{wave.classList.remove('home-wave-tap');window.openAskHub();},reduced.matches?0:200);
    });
    lastGreetingWave={el:wave,play};
    // Wait for startup rebuilds to settle. If already playing, keep the
    // original clock and message rather than restarting the logo and hand.
    if(resume && resume.elapsed<SEQUENCE_END){
      playGreeting(wave,resume);
    }else if(!hasWavedHello){
      if(!reduced.matches)wave.classList.add('home-wave-pending');
      scheduleStartup(wave);
    }else{
      // Home was rebuilt after the hello already played: carry on idling.
      startIdle(wave);
    }
  };
  reduced.addEventListener('change',()=>{clearTimeout(startupTimer);++requestId;stopGreeting();idleStop();namePen.release();if(!reduced.matches&&hasWavedHello&&lastGreetingWave)startIdle(lastGreetingWave.el);if(lastGreetingWave)lastGreetingWave.el.classList.remove('home-wave-pending');});
  // His mode changed (Lively / Focused / Still): Still stops his idle here,
  // leaving it starts it again; Lively and Focused are the engine's business.
  window.addEventListener('drmodechange',()=>{if(still()){idleStop();namePen.release();}else if(!idleRunning&&hasWavedHello&&lastGreetingWave&&lastGreetingWave.el.isConnected)startIdle(lastGreetingWave.el);});

  /* Reopening an installed PWA does not reload the page, so without this the
     wave fires once on the very first launch and never again -- which is not
     what "when the app is opened" means on a phone. Coming back to the
     foreground on Home counts as opening it.

     Throttled: flicking away to copy a phone number and straight back should
     not set the hand off again. */
  const WAVE_RESUME_GAP_MS = 45000;
  let lastGreetingWave = null, lastWaveAt = 0;

  /* His size in the greeting is --hw-size (home-polish.css, a plain number:
     1 is the 64px he's drawn at). A first name sits beside him, and a bigger
     him leaves it less room, so when the name would no longer fit on one line
     (it would break mid-word: "Guadalup / e") he takes the largest size at
     which it does, never less than 1 (--hw-k on .home-greeting-text). Again
     once the fonts are in, and when the screen changes size. */
  // The quote's last two words travel together, so its last line is never one lone word.
  function keepQuoteEnd(text){
    const q=text&&text.querySelector('.home-greeting-quote'),tn=q&&q.firstChild;
    if(!tn||tn.nodeType!==3)return;
    const s=tn.data.replace(/\s+$/,''),i=s.lastIndexOf(' ');
    if(i>0)tn.data=s.slice(0,i)+'\u00a0'+s.slice(i+1);
  }
  function fitWave(wave){fitWave0(wave);heartline.place();}
  // He keeps his own place and size (home-polish.css, "Dr. Smiley's own
  // place"); the name has the line above him to itself. A name too wide for
  // that line, even in the smaller face long names get, shrinks to fit
  // rather than wrapping or pushing him.
  function fitWave0(wave){
    const text=wave.closest('.home-greeting-text'),row=wave.parentElement,name=row&&row.querySelector('.home-greeting-name');
    if(!text||!name)return;
    text.style.removeProperty('--hw-k');
    name.style.removeProperty('font-size');
    const ws=name.style.whiteSpace;name.style.whiteSpace='nowrap';
    const r=document.createRange();r.selectNodeContents(name);
    // 12px spare: a script letter's swash reaches past its own width.
    const need=Math.ceil(r.getBoundingClientRect().width)+12,room=row.clientWidth;
    name.style.whiteSpace=ws;
    if(need>room)name.style.fontSize=Math.floor((parseFloat(getComputedStyle(name).fontSize)||56)*room/need)+'px';
  }
  let fitQueued=0;
  window.addEventListener('resize',()=>{
    if(fitQueued)return;
    fitQueued=requestAnimationFrame(()=>{fitQueued=0;if(lastGreetingWave&&lastGreetingWave.el.isConnected)fitWave(lastGreetingWave.el);});
  },{passive:true});
  document.addEventListener('visibilitychange', () => {
    if(document.visibilityState !== 'visible'){clearTimeout(startupTimer);++requestId;stopGreeting();idleStop();namePen.release();if(lastGreetingWave)lastGreetingWave.el.classList.remove('home-wave-pending');return;}
    const w = lastGreetingWave;
    if(!w || !w.el.isConnected) return;
    const now = Date.now();
    if(hasWavedHello && now - lastWaveAt < WAVE_RESUME_GAP_MS){ startIdle(w.el); return; }
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
    const desktopSpeed = window.innerWidth >= 901 ? .8 : 1;
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
      const dur = range(t[3][0], t[3][1]) * desktopSpeed;
      const delay = -((range(0, 20) + elapsed) % dur);
      html += '<div class="home-petal ' + t[4] + '" style="' +
        // Spread evenly across the width (with jitter) so they don't bunch
        // up behind the glass card.
        'left:' + (((i + rand()) / count) * 104 - 4).toFixed(1) + '%;' +
        'width:' + size.toFixed(1) + 'px;height:' + (size * 1.2).toFixed(1) + 'px;' +
        '--fill:' + palette[i % palette.length] + ';' +
        '--o:' + range(t[2][0], t[2][1]).toFixed(2) + ';' +
        '--dur:' + dur.toFixed(2) + 's;--delay:' + delay.toFixed(2) + 's;' +
        '--flip:' + (range(1.8, 3.4) * desktopSpeed).toFixed(2) + 's;' +
        '--sway:' + range(-60, 60).toFixed(0) + 'px;' +
        '--r0:' + range(0, 360).toFixed(0) + 'deg;' +
        '--rest:' + range(20, 70).toFixed(0) + '%' +
        '"><svg><use href="#hpSakura"/></svg></div>';
    }
    layer.innerHTML = html;
    return layer;
  }

  function initHeroDecor(content){
    // index.html keeps the same greeting across repaints of Home; its petals
    // are already falling, so leave them be.
    const kept = content && content.querySelector('.home-greeting');
    if(kept && kept.dataset.decorReady && kept.querySelector('.home-petals')) return;
    decorObservers.forEach(o => o.disconnect());
    decorObservers = [];
    const hero = content && content.querySelector('.home-greeting');
    if(!hero) return;
    // .home-arc-marks is still swept up here on purpose: an installed PWA can
    // resume on a cached page that still has the old layer in the DOM.
    hero.querySelectorAll('.home-petals, .home-arc-marks').forEach(n => n.remove());
    ensurePetalDefs();

    const petals = buildPetals(hero);
    hero.dataset.decorReady = '1';
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
      // A New-domain slot at the end of the domains. Built here rather than
      // copied from the rail, so it never counts toward "N domains" above.
      if(typeof openAddDomainModal === 'function'){
        const add = document.createElement('button');
        add.type = 'button';
        add.className = 'qa-card home-section-add';
        if(typeof tileVars === 'function') add.setAttribute('style', tileVars(section.style.getPropertyValue('--section-color').trim() || '#0F5FA6'));
        add.innerHTML = '<span class="qa-icon">' + (typeof ICON_PLUS !== 'undefined' ? ICON_PLUS : '+') + '</span>'
          + '<span class="qa-title">New domain</span><span class="qa-desc">Add your own</span>';
        add.setAttribute('aria-label', 'Create a new domain');
        // Close the folder first: the domain editor would otherwise open
        // underneath it.
        add.addEventListener('click', () => { closeHomeSection(); openAddDomainModal(); });
        grid.appendChild(add);
      }
      // Every domain as a folded heading (All domains), one tap away below.
      const all = document.createElement('button');
      all.type = 'button';
      all.className = 'home-section-all';
      all.textContent = 'Browse all domains';
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

  /* ---- Dr. Smiley's widgets wait to be seen ------------------------
     Their entrance (rise, ring fill, streak dots) is held while they are
     below the fold, so it plays when you scroll to them rather than
     off-screen. If they are already in view the observer lets go on its
     first callback. */
  let widgetWatch = null;
  document.addEventListener('ih:home-paint', () => {
    if(widgetWatch){ widgetWatch.disconnect(); widgetWatch = null; }
    const host = document.getElementById('content');
    const sec = host && host.querySelector('.sm-widgets');
    watchCardPetals(sec);
    if(!sec || host.classList.contains('no-enter') || typeof IntersectionObserver === 'undefined') return;
    sec.classList.add('is-waiting');
    const io = widgetWatch = new IntersectionObserver(entries => {
      if(!entries.some(e => e.isIntersecting)) return;
      sec.classList.remove('is-waiting');
      io.disconnect();
      if(widgetWatch === io) widgetWatch = null;
    }, { threshold: .35 });
    io.observe(sec);
  });

  /* ---- Sakura on Dr. Smiley's card -----------------------------------
     The banner's petals (same #hpSakura shape, same pink/blue/lavender
     fills, same fall and flutter keyframes) drifting behind the words on
     his rank card. index.html redraws the card whenever team points
     arrive, so a watcher puts the petals back on each new card; their
     delays come from the clock, so a redraw carries on mid-fall instead of
     restarting them all at the top. Styles in home-polish.css. */
  let cardPetalWatch = [];
  function addCardPetals(card){
    if(!card || !card.classList.contains('smw-dark') || card.querySelector('.smw-petals')) return;
    ensurePetalDefs();
    const rand = seeded(250);
    const count = 8, fall = Math.round((card.clientHeight || 130) * 1.15);
    const palette = ['url(#hpPink)', 'url(#hpBlue)', 'url(#hpLav)', 'url(#hpPink)'];
    const range = (a, b) => a + rand() * (b - a);
    const elapsed = performance.now() / 1000;
    let html = '';
    for(let i = 0; i < count; i++){
      const size = range(9, 16), dur = range(6, 9.5);
      html += '<div class="home-petal" style="' +
        'left:' + (((i + rand()) / count) * 104 - 4).toFixed(1) + '%;' +
        'width:' + size.toFixed(1) + 'px;height:' + (size * 1.2).toFixed(1) + 'px;' +
        '--fill:' + palette[i % palette.length] + ';' +
        '--o:' + range(.7, .95).toFixed(2) + ';' +
        '--dur:' + dur.toFixed(2) + 's;--delay:' + (-((range(0, 20) + elapsed) % dur)).toFixed(2) + 's;' +
        '--flip:' + range(1.8, 3.4).toFixed(2) + 's;' +
        '--sway:' + range(-30, 30).toFixed(0) + 'px;' +
        '--r0:' + range(0, 360).toFixed(0) + 'deg;' +
        '--fall:' + fall + 'px;--rest:' + range(15, 85).toFixed(0) + '%' +
        '"><svg><use href="#hpSakura"/></svg></div>';
    }
    const layer = document.createElement('div');
    layer.className = 'smw-petals';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = html;
    card.prepend(layer);
  }
  function watchCardPetals(sec){
    cardPetalWatch.forEach(o => o.disconnect());
    cardPetalWatch = [];
    if(!sec) return;
    addCardPetals(sec.querySelector('#smileyCareer'));
    if(typeof MutationObserver !== 'undefined'){
      const mo = new MutationObserver(() => addCardPetals(sec.querySelector('#smileyCareer')));
      mo.observe(sec, { childList: true });
      cardPetalWatch.push(mo);
    }
    // Battery: still while the card is scrolled away, like the banner's.
    if(typeof IntersectionObserver !== 'undefined'){
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => sec.classList.toggle('is-offscreen', !e.isIntersecting));
      });
      io.observe(sec);
      cardPetalWatch.push(io);
    }
  }

  const content = document.getElementById('content');
  if(content && content.classList.contains('is-home')){
    initHomeGreeting(content);
    initHomeRails(content);
    // Home may have painted before this file loaded, missing ih:home-paint.
    watchCardPetals(content.querySelector('.sm-widgets'));
  }
})();
