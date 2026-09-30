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
  /* The thought cloud (option C "Sparkle Float", in blue). Drawn, not built
     from the 💭 emoji: that meant a pixel flood-fill on every hello. It lands
     with a jelly wobble, types its message, floats up while gold sparkles and
     mini Hackensack marks twinkle, then drifts away. update(ms) is driven by
     the greeting's own clock, starting when the cloud begins to appear. */
  const CLOUD_BUMPS=[[26,46,19],[46,30,22],[72,24,25],[99,31,21],[117,47,16],[96,56,19],[64,59,20],[34,58,15]];
  const cloudShapes='<rect x="14" y="34" width="112" height="36" rx="18"/>'+CLOUD_BUMPS.map(b=>`<circle cx="${b[0]}" cy="${b[1]}" r="${b[2]}"/>`).join('');
  const CLOUD_DOTS=[{x:-15,y:37,r:3.2},{x:-5,y:27,r:5}];
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
    const message=text || chooseMessage();
    const lines=splitMessage(message);
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
    const left=Math.max(8,Math.min(b.left+88,document.documentElement.clientWidth-144));
    bubble.style.left=(left+window.scrollX)+'px';
    bubble.style.top=(b.top+window.scrollY-10)+'px';
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
      body.setAttribute('transform',`translate(0 ${ty.toFixed(2)}) translate(20 64) scale(${Math.max(0,grow+.1*jig).toFixed(4)} ${Math.max(0,grow-.1*jig).toFixed(4)}) translate(-20 -64)`);
      body.setAttribute('opacity',op.toFixed(3));
      [back(win(t,0,.2),2.2),back(win(t,.1,.3),2.2)].forEach((v,i)=>{
        v*=1-sm(win(t,5.2,5.5));const d=CLOUD_DOTS[i];
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
    return {bubble,update,announce(delay){announced=setTimeout(()=>{if(status)status.textContent=message;},delay);},
      expire(fn){expire=setTimeout(fn,6500);},
      remove(){clearTimeout(announced);clearTimeout(expire);bubble.remove();if(status)status.textContent='';}};
  }

  /* The greeting face (option D): it rests as drawn in index.html, then
     squishes, bounces and breaks into a big open laugh, and settles back.
     FACE_MS is the face's part of the sequence, starting when it appears. */
  const FACE_MS=3300, FACE_AT=2380, CLOUD_AT=2880, SEQUENCE_END=9380;
  const FACE_POSES=[[0,{}],[1000,{}],[1180,{blush:1.05}],[1480,{open:1,blush:1.25,gl:2}],
    [1780,{open:.9,blush:1.25}],[2080,{open:1,blush:1.25}],[2600,{open:1,blush:1.2}],[3200,{}],[FACE_MS,{}]];
  const FACE_REST={open:0,blush:1,gl:0,sqL:0,sqR:0,heart:0,glint:-1};
  function facePose(t){
    let i=0;while(i<FACE_POSES.length-2&&t>FACE_POSES[i+1][0])i++;
    const a=FACE_POSES[i],b=FACE_POSES[i+1];
    let u=Math.max(0,Math.min(1,(t-a[0])/(b[0]-a[0])));u=u*u*(3-2*u);
    const out={};
    for(const k in FACE_REST){const va=k in a[1]?a[1][k]:FACE_REST[k],vb=k in b[1]?b[1][k]:FACE_REST[k];out[k]=va+(vb-va)*u;}
    return out;
  }
  // Writing an SVG attribute repaints the face even when the value is the
  // same, and the idle runs every frame, so only write what changed.
  const setA=(el,name,value)=>{const v=String(value);if(el.getAttribute(name)!==v)el.setAttribute(name,v);};
  function setFace(svg,P){
    if(!svg||!svg.querySelector)return;
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

  /* ---------- Idle: random happy loops after the hello ----------
     Six short performances, picked at random (never the same twice in a
     row) with a brief bouncy pause between them. Anything that flies off
     the face is a mini Hackensack mark. Positions are in the face's own
     drawing units (the face is 112 units across, centred on 60,60).
     Stops with reduced motion, when the tab is hidden, and while the face
     is scrolled out of view, so it costs nothing when nobody can see it. */
  const clamp1=x=>x<0?0:x>1?1:x;
  const sm1=x=>{x=clamp1(x);return x*x*(3-2*x);};
  const win=(t,a,b)=>clamp1((t-a)/(b-a));
  const bump=(t,a,b)=>Math.sin(Math.PI*win(t,a,b));
  const backOut=x=>{const c1=2.4,c3=c1+1;x=clamp1(x);return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2);};
  const rnd=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  const idlePose=()=>({tx:0,ty:0,rot:0,sx:1,sy:1,pivot:'50% 90%',...FACE_REST});
  const IDLE=[
    { name:'bouncy', L:2.4,
      pose(t){const p=idlePose(),ph=(t%.6)/.6,air=Math.sin(Math.PI*ph);
        const land=ph<.12?1-ph/.12:ph>.9?(ph-.9)/.1:0;
        p.ty=-9*air;p.sx=1+.09*land-.03*air;p.sy=1-.09*land+.04*air;p.open=.25+.45*air;p.blush=1.1+.15*air;
        p.sqL=bump(t,1.75,2.15);p.rot=3*Math.sin(TAU*t/1.2);return p;},
      marks(){return [];} },
    { name:'hum', L:3.2,
      pose(t){const p=idlePose(),s=Math.sin(TAU*t/1.6);
        p.rot=10*s;p.tx=3*s;p.ty=-2.5*Math.abs(s);p.open=.18+.14*Math.abs(Math.sin(TAU*t/.4));p.blush=1.15+.1*Math.sin(TAU*t/.8);return p;},
      marks(t){const out=[];
        for(let k=0;k<4;k++){const a=t-.8*k;if(a<0||a>1.7)continue;const side=k%2?-1:1;
          out.push({x:60+side*(40+16*a)+4*Math.sin(a*6),y:30-34*a,r:12*Math.sin(a*5)*side,s:1+.35*a,o:a<.2?a/.2:1-(a-.2)/1.5});}
        return out;} },
    { name:'giggle', L:3.6,
      pose(t){const p=idlePose(),b=sm1(win(t,1.5,1.7))*(1-sm1(win(t,2.7,3)));
        p.sy=1+.025*Math.sin(TAU*t/1.2)*(1-b);p.sx=1-.02*Math.sin(TAU*t/1.2)*(1-b);
        p.sqL=p.sqR=b;p.open=b;p.blush=1+.35*b;p.ty=-5*b*Math.abs(Math.sin(TAU*t*3));p.rot=7*b*Math.sin(TAU*t*7);
        if(t>1.3&&t<1.5){const a=sm1(win(t,1.3,1.5));p.sx=1+.08*a;p.sy=1-.08*a;}
        return p;},
      marks(t){const out=[],a=t-1.62;if(a<0||a>1)return out;
        for(let i=0;i<7;i++){const ang=-Math.PI/2+(i-3)*.52,d=54+34*sm1(a);
          out.push({x:60+Math.cos(ang)*d,y:58+Math.sin(ang)*d*.9,r:120*a,s:1.3*Math.sin(Math.PI*a),o:1});}
        return out;} },
    { name:'gleam', L:3.4,
      pose(t){const p=idlePose();
        p.gl=5*bump(t,.3,.75);p.ty=-3*bump(t,.3,.75);p.glint=win(t,.8,1.35);
        p.sqR=sm1(win(t,1.6,1.75))*(1-sm1(win(t,2.25,2.4)));p.open=.35*bump(t,1.5,2.6);p.rot=-6*bump(t,1.5,2.6);
        p.blush=1+.3*bump(t,1.5,2.6);p.ty+=-2*Math.abs(Math.sin(TAU*t/.8))*win(t,2.4,3.4);return p;},
      marks(t){const a=t-1.65;if(a<0||a>.9)return [];
        return [{x:98+14*a,y:30-18*a,r:90*a,s:1.5*Math.sin(Math.PI*a/.9),o:1}];} },
    { name:'party', L:3.8,
      pose(t){const p=idlePose(),crouch=bump(t,.1,.45),air=win(t,.45,1.05);
        p.pivot='50% 50%';
        if(t<.45){p.sx=1+.12*crouch;p.sy=1-.12*crouch;p.ty=4*crouch;}
        else if(t<1.05){p.ty=-26*Math.sin(Math.PI*air);p.rot=360*sm1(air);p.sx=.94;p.sy=1.07;}
        else{const land=bump(t,1.05,1.3);p.sx=1+.14*land;p.sy=1-.14*land;p.ty=5*land-4*Math.abs(Math.sin(TAU*(t-1.3)))*(1-win(t,1.3,3.2));}
        const laugh=sm1(win(t,1.05,1.2))*(1-sm1(win(t,2.8,3.3)));
        p.open=laugh;p.sqL=p.sqR=sm1(win(t,.45,.6))*(1-sm1(win(t,1.3,1.5)));p.blush=1+.4*laugh;return p;},
      marks(t){const out=[],a=t-1.08;if(a<0||a>1.5)return out;
        for(let i=0;i<14;i++){const ang=-Math.PI*(.08+.84*rnd(i)),v=70+50*rnd(i+20);
          out.push({x:60+Math.cos(ang)*v*a,y:40+Math.sin(ang)*v*a+70*a*a,r:(rnd(i+40)-.5)*900*a,s:.8+.4*rnd(i+60),o:1-win(a,1,1.5)});}
        return out;} },
    { name:'hearts', L:3.4,
      pose(t){const p=idlePose(),h=backOut(win(t,.4,.75))*(1-sm1(win(t,2.5,2.8))),hc=clamp1(h);
        const beat=Math.max(0,Math.sin(TAU*t*1.6));
        p.heart=h*(1+.12*beat);p.open=.75*hc;p.blush=1+.45*hc;
        p.sx=p.sy=1+.035*beat*hc;p.ty=-2*beat*hc;p.rot=4*Math.sin(TAU*t/1.7)*hc;return p;},
      marks(t){const out=[];
        for(let k=0;k<5;k++){const a=t-(.7+.4*k);if(a<0||a>1.4)continue;const side=k%2?1:-1;
          out.push({x:60+side*(18+(10*k)%30)+6*Math.sin(a*5),y:14-36*a,r:side*10*Math.sin(a*4),s:.9+.45*a,o:a<.15?a/.15:1-(a-.15)/1.25});}
        return out;} }
  ];
  // The pause between performances keeps a gentle happy bob going.
  function restPose(t){const p=idlePose(),b=Math.abs(Math.sin(TAU*t/1.4));p.ty=-2.2*b;p.sy=1+.02*Math.sin(TAU*t/1.4);p.sx=2-p.sy;return p;}

  let idleStop=()=>{},idleRunning=false,lastIdle=-1;
  function startIdle(button){
    idleStop();
    if(reduced.matches||document.hidden||!button||!button.isConnected)return;
    const pin=button.querySelector('.home-wave-pin'),svg=button.querySelector('.home-face');
    if(!pin||!svg)return;
    let layer=button.querySelector('.home-face-marks');
    if(!layer){
      layer=document.createElement('span');layer.className='home-face-marks';layer.setAttribute('aria-hidden','true');
      for(let i=0;i<14;i++){const img=document.createElement('img');img.src='./hmh-mark.png';img.alt='';img.draggable=false;layer.appendChild(img);}
      button.appendChild(layer);
    }
    const imgs=[...layer.children];
    let raf=0,onScreen=true,act=null,actStart=0,restUntil=0,restStart=performance.now(),lastNow=0;
    const pick=()=>{let i=Math.floor(Math.random()*(IDLE.length-1));if(i>=lastIdle&&lastIdle>=0)i++;if(lastIdle<0)i=Math.floor(Math.random()*IDLE.length);lastIdle=i;return IDLE[i];};
    restUntil=restStart+900+Math.random()*900;
    function paint(p,marks){
      const u=pin.clientWidth/112;
      if(pin.style.transformOrigin!==p.pivot)pin.style.transformOrigin=p.pivot;
      pin.style.transform=`translate3d(${(p.tx*u).toFixed(1)}px,${(p.ty*u).toFixed(1)}px,0) rotate(${p.rot.toFixed(1)}deg) scale(${p.sx.toFixed(3)},${p.sy.toFixed(3)})`;
      setFace(svg,p);
      imgs.forEach((img,i)=>{
        const m=marks[i];
        if(!m||m.o<=0){if(img.style.opacity!=='0')img.style.opacity='0';return;}
        img.style.opacity=clamp1(m.o).toFixed(3);
        img.style.transform=`translate3d(${((m.x-60)*u).toFixed(2)}px,${((m.y-60)*u).toFixed(2)}px,0) rotate(${m.r.toFixed(1)}deg) scale(${Math.max(0,m.s).toFixed(3)})`;
      });
    }
    function frame(now){
      raf=0;
      if(!button.isConnected||document.hidden){idleStop();return;}
      lastNow=now;
      if(act){
        const t=(now-actStart)/1000;
        if(t>=act.L){act=null;restStart=now;restUntil=now+900+Math.random()*1600;paint(restPose(0),[]);}
        else paint(act.pose(t),act.marks(t));
      }else if(now>=restUntil){act=pick();actStart=now;paint(act.pose(0),[]);}
      else paint(restPose((now-restStart)/1000),[]);
      if(onScreen)raf=requestAnimationFrame(frame);
    }
    const io=new IntersectionObserver(entries=>{
      onScreen=entries[0].isIntersecting;
      if(onScreen&&!raf&&idleRunning)raf=requestAnimationFrame(frame);
    });
    io.observe(button);
    idleRunning=true;
    pin.style.willChange='transform';
    raf=requestAnimationFrame(frame);
    idleStop=()=>{
      if(raf)cancelAnimationFrame(raf);raf=0;io.disconnect();idleRunning=false;
      pin.style.transform='';pin.style.transformOrigin='';pin.style.willChange='';setFace(svg,FACE_REST);
      imgs.forEach(img=>{img.style.opacity='0';});
      idleStop=()=>{};
    };
  }
  // Squash, lift and tilt of the whole face, sampled for the Web Animation.
  function faceBody(t){
    const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
    let sx=1,sy=1,y=0,angle=0,opacity=1;
    if(t<440){
      const p=t/440,spring=1-Math.exp(-6*p)*Math.cos(8*p),settle=Math.sin(Math.PI*p);
      sx=.08+.92*spring+.09*settle;sy=.08+.92*spring-.07*settle;
      angle=-14*(1-p)*(1-p);y=8*(1-p)-6*settle;opacity=Math.min(1,p*5);
    }else if(t>=1000&&t<1180){
      const a=smooth((t-1000)/180);sx=1+.08*a;sy=1-.08*a;y=2*a;
    }else if(t>=1180&&t<1480){
      const g=(t-1180)/300,e=smooth(g),arc=Math.sin(Math.PI*g);
      sx=1+.08*(1-e)-.06*arc;sy=1-.08*(1-e)+.07*arc;y=2*(1-e)-9*arc;angle=4*arc;
    }else if(t>=1480&&t<2600){
      const k=(t-1480)/1120,bounce=Math.abs(Math.sin(Math.PI*3*k))*(1-.6*k);
      y=-4*bounce;sx=1+.025*(1-bounce)*(1-k);sy=1-.025*(1-bounce)*(1-k);angle=3*Math.sin(TAU*1.5*k)*(1-k);
    }
    return {opacity,transform:`translate3d(0,${y.toFixed(2)}px,0) rotate(${angle.toFixed(2)}deg) scale(${sx.toFixed(4)},${sy.toFixed(4)})`};
  }

  async function playGreeting(button, resume = null){
    clearTimeout(startupTimer);
    startupWave=null; startupDeadline=0;
    idleStop();
    stopGreeting();
    activeSequence=resume;
    const request = ++requestId;
    lastWaveAt = Date.now();
    if(document.hidden || !button.isConnected) return;
    if(reduced.matches || !button.animate){
      const thought=createThought(button);
      thought.update(2500);thought.announce(0);
      const width=window.innerWidth;
      const resizeStop=()=>{if(window.innerWidth!==width)stop();};
      const stop=()=>{thought.remove();window.removeEventListener('resize',resizeStop);if(stopGreeting===stop)stopGreeting=()=>{};};
      stopGreeting=stop;thought.expire(stop);window.addEventListener('resize',resizeStop,{passive:true});
      return;
    }
    button.classList.add('home-wave-pending');
    try {
      const artwork=button.querySelector('.home-wave-art');
      await Promise.all([mark.decode(), artwork && artwork.decode ? artwork.decode() : null]);
    } catch(e) { if(request===requestId){activeSequence=null;button.classList.remove('home-wave-pending');}return; } // Keep the static hand when artwork is unavailable.
    if(request !== requestId || !button.isConnected || reduced.matches || document.hidden){
      if(request === requestId)button.classList.remove('home-wave-pending');
      return;
    }
    const hero = button.closest('.home-greeting');
    if(!hero) return;
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
    const width=window.innerWidth;
    const resizeStop=()=>{if(window.innerWidth!==width)stop();};
    function stop(){
      cancelAnimationFrame(frame);
      button.classList.remove('home-wave-pending');
      if(activeSequence===sequence)activeSequence=null;
      animations.forEach(a=>{a.onfinish=null;a.cancel();});
      animations=[];
      if(!idleRunning)setFace(faceSvg,FACE_REST);
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
    const waveFrames=Array.from({length:166},(_,i)=>({offset:i/165,...faceBody(i/165*FACE_MS)}));
    animate(art,waveFrames,{duration:FACE_MS,delay:FACE_AT,fill:'backwards',easing:'linear'});
    let messageAnnounced=false;
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
      if(elapsed<FACE_AT+FACE_MS)setFace(faceSvg,elapsed>FACE_AT?facePose(elapsed-FACE_AT):FACE_REST);
      else if(!idleRunning&&!sequence.idled){sequence.idled=true;setFace(faceSvg,FACE_REST);startIdle(button);}
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
  reduced.addEventListener('change',()=>{clearTimeout(startupTimer);++requestId;stopGreeting();idleStop();if(!reduced.matches&&hasWavedHello&&lastGreetingWave)startIdle(lastGreetingWave.el);if(lastGreetingWave)lastGreetingWave.el.classList.remove('home-wave-pending');});

  /* Reopening an installed PWA does not reload the page, so without this the
     wave fires once on the very first launch and never again -- which is not
     what "when the app is opened" means on a phone. Coming back to the
     foreground on Home counts as opening it.

     Throttled: flicking away to copy a phone number and straight back should
     not set the hand off again. */
  const WAVE_RESUME_GAP_MS = 45000;
  let lastGreetingWave = null, lastWaveAt = 0;
  document.addEventListener('visibilitychange', () => {
    if(document.visibilityState !== 'visible'){clearTimeout(startupTimer);++requestId;stopGreeting();idleStop();if(lastGreetingWave)lastGreetingWave.el.classList.remove('home-wave-pending');return;}
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
