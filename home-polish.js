/* Local presentation only. Each copied tool keeps its existing app action. */
(() => {
  let hasWavedHello = false;

  /* ---------- The HMH mark spirals out of the waving hand ----------
     Geometry lives in home-polish.css under the same heading; this only sets
     the per-arm angles and hands them over.

     The mark is warmed up at script load. The first wave fires as soon as Home
     paints, which is early enough that an uncached PNG would otherwise miss it
     -- and the first wave is the one nobody gets to replay. */
  const SPIRAL_MARK = './hmh-mark.png';

  /* Opening the app gets a bigger spiral than tapping the hand does. Opening it
     is the moment worth dressing; a replay you asked for wants to be quick.

     `window` is how long marks keep being thrown, and the per-mark stagger is
     derived from it rather than fixed. That is the whole reason the count can
     go up without the spiral turning into a slow drip: raise `arms` alone with
     a fixed stagger and the emission window stretches with it instead of
     getting denser.

     Angle, radius and size are jittered per mark. An even fan at this many
     marks reads as a machine firing on a timer -- a tidy ring expanding. */
  const SPIRAL_TAP  = { arms: 16, ms: 1150, window: 760,  r0: 34, rSpread: 30, size: [11, 19] };
  const SPIRAL_OPEN = { arms: 26, ms: 2000, window: 1450, r0: 36, rSpread: 36, size: [12, 22] };
  try { new Image().src = SPIRAL_MARK; } catch(e){}

  function spiralOut(wave, cfg){
    cfg = cfg || SPIRAL_TAP;
    const row = wave.parentElement;
    if(!row) return;
    // A wave can be replayed before the last one has cleared.
    row.querySelectorAll('.home-wave-spiral').forEach(n => n.remove());

    const layer = document.createElement('span');
    layer.className = 'home-wave-spiral';
    layer.setAttribute('aria-hidden', 'true');

    const stagger = cfg.window / cfg.arms;
    const jitter = (spread) => (Math.random() - 0.5) * spread;

    /* How far a mark may fly depends on WHICH WAY it is going. .home-greeting
       clips, and the hand sits about 62px below the banner's top edge on a
       phone against 218px of room below it -- so a single radius that suits
       one direction makes marks heading the other way vanish mid-flight.
       Measured per spiral, so it holds at every breakpoint instead of being a
       constant that goes stale the next time the card moves. */
    const banner = wave.closest('#homeGreeting') || wave.closest('.home-greeting');
    const wb = wave.getBoundingClientRect();
    let reach = () => Infinity;
    if(banner){
      const g = banner.getBoundingClientRect();
      const cx = wb.left + wb.width / 2, cy = wb.top + wb.height / 2;
      const room = { l: cx - g.left, r: g.right - cx, u: cy - g.top, d: g.bottom - cy };
      reach = (deg, half) => {
        // CSS rotate() then translateX() lands at (r cos t, r sin t), screen axes.
        const t = deg * Math.PI / 180, c = Math.cos(t), sn = Math.sin(t);
        let m = Infinity;
        if(c >  0.001) m = Math.min(m, (room.r - half) / c);
        if(c < -0.001) m = Math.min(m, (room.l - half) / -c);
        if(sn >  0.001) m = Math.min(m, (room.d - half) / sn);
        if(sn < -0.001) m = Math.min(m, (room.u - half) / -sn);
        return Math.max(10, m);
      };
    }

    for(let k = 0; k < cfg.arms; k++){
      // Even fan, then nudged, so the marks neither queue up nor line up.
      const a0 = k * (360 / cfg.arms) - 90 + jitter(360 / cfg.arms);
      const arm = document.createElement('i');
      arm.style.setProperty('--a0', a0 + 'deg');
      // Far enough out to clear the quote rather than settling on top of it.
      const a1 = a0 + 250 + Math.random() * 130;
      arm.style.setProperty('--a1', a1 + 'deg');
      const size = cfg.size[0] + Math.random() * (cfg.size[1] - cfg.size[0]);
      const want = cfg.r0 + Math.random() * cfg.rSpread;
      arm.style.setProperty('--r', Math.min(want, reach(a1, size / 2)).toFixed(1) + 'px');
      arm.style.setProperty('--s', size.toFixed(1) + 'px');
      const delay = Math.round(stagger * k) + 'ms';
      arm.style.animationDelay = delay;
      arm.style.animationDuration = cfg.ms + 'ms';

      const img = document.createElement('img');
      img.src = SPIRAL_MARK;
      img.alt = '';
      img.draggable = false;
      // Delay AND duration must match the arm exactly, or the mark's
      // counter-rotation stops cancelling and it tumbles as it flies.
      img.style.animationDelay = delay;
      img.style.animationDuration = cfg.ms + 'ms';
      arm.appendChild(img);
      layer.appendChild(arm);
    }

    row.appendChild(layer);
    // Anchor on the hand's centre. Measured rather than hard-coded: the button
    // is 48px on desktop and 44px on a phone, and the name beside it changes
    // width with whatever is in ih_myName.
    const rowBox = row.getBoundingClientRect(), waveBox = wave.getBoundingClientRect();
    layer.style.left = (waveBox.left - rowBox.left + waveBox.width / 2) + 'px';
    layer.style.top  = (waveBox.top  - rowBox.top  + waveBox.height / 2) + 'px';

    setTimeout(() => layer.remove(), cfg.ms + cfg.window + 250);
  }

  /* The hello wave has to survive startup.

     Measured on a cold open, before this: the greeting was rebuilt five times
     in the first two seconds as cached data was replaced by live data. The
     first hand waved at 909ms and was destroyed at 1187ms -- 278ms into a
     1300ms swing -- and the four that replaced it never waved at all, because
     the flag latched the moment the first one STARTED. The hand you were
     actually left looking at had never moved.

     So the flag latches on the animation ENDING, on a node still in the
     document. Until a wave has genuinely played through, every fresh greeting
     gets another go. WAVE_TRIES bounds it, in case something ever rebuilds
     Home faster than the animation can finish. */
  const WAVE_TRIES = 6;
  let waveAttempts = 0;

  window.initHomeGreeting = function(content){
    const wave = content && content.querySelector('.home-wave-icon');
    if(!wave || wave.dataset.waveReady) return;
    wave.dataset.waveReady = 'true';
    const play = (opening) => {
      wave.classList.remove('is-waving');
      if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      void wave.offsetWidth;
      wave.classList.add('is-waving');
      spiralOut(wave, opening ? SPIRAL_OPEN : SPIRAL_TAP);
      lastWaveAt = Date.now();
    };
    wave.addEventListener('animationend', (e) => {
      wave.classList.remove('is-waving');
      if(e.animationName === 'homeHelloWave') hasWavedHello = true;
    });
    wave.addEventListener('click', () => play(false));
    lastGreetingWave = { el: wave, play: play };

    if(!hasWavedHello && waveAttempts < WAVE_TRIES){ waveAttempts++; play(true); }
  };

  /* Reopening an installed PWA does not reload the page, so without this the
     wave fires once on the very first launch and never again -- which is not
     what "when the app is opened" means on a phone. Coming back to the
     foreground on Home counts as opening it.

     Throttled: flicking away to copy a phone number and straight back should
     not set the hand off again. */
  const WAVE_RESUME_GAP_MS = 45000;
  let lastGreetingWave = null, lastWaveAt = 0;
  document.addEventListener('visibilitychange', () => {
    if(document.visibilityState !== 'visible') return;
    const w = lastGreetingWave;
    if(!w || !w.el.isConnected) return;
    const now = Date.now();
    if(now - lastWaveAt < WAVE_RESUME_GAP_MS) return;
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
