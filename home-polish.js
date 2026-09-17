/* Local presentation only. Each copied tool keeps its existing app action. */
(() => {
  let hasWavedHello = false;
  window.initHomeGreeting = function(content){
    const wave = content && content.querySelector('.home-wave-icon');
    if(!wave || wave.dataset.waveReady) return;
    wave.dataset.waveReady = 'true';
    const play = () => {
      wave.classList.remove('is-waving');
      if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      void wave.offsetWidth;
      wave.classList.add('is-waving');
    };
    wave.addEventListener('animationend', () => wave.classList.remove('is-waving'));
    wave.addEventListener('click', play);
    // Data arrivals and theme changes rebuild Home. Only the first paint
    // waves automatically; tapping the hand always lets someone replay it.
    if(!hasWavedHello){ hasWavedHello = true; play(); }
  };
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

  /* Marks follow the dome the photo fades into: highest in the middle,
     lower at the two edges, with a little jitter so it isn't a ruler line. */
  function buildArcMarks(layer, hero){
    const w = hero.clientWidth, h = hero.clientHeight;
    if(!w || !h) return;
    const rand = seeded(4417);
    const count = Math.min(24, Math.max(10, Math.round(w / 24)));
    const edgeLift = 20, centreLift = 44;       // px above the hero's bottom edge
    let html = '';
    for(let i = 0; i < count; i++){
      const u = (i + 0.5 + (rand() - 0.5) * 0.7) / count;   // 0..1 across
      const k = 2 * u - 1;                                   // -1..1
      const lift = edgeLift + (centreLift - edgeLift) * (1 - k * k);
      const x = u * w;
      const y = h - lift + (rand() - 0.5) * 12;
      // Tangent of the arc, so each mark leans with the curve.
      const slope = 2 * k * (centreLift - edgeLift) * 2 / w;
      const angle = Math.atan(slope) * 180 / Math.PI + (rand() - 0.5) * 36;
      const size = 10 + rand() * 7;
      const opacity = 0.34 + rand() * 0.26;
      html += '<span class="home-arc-mark" style="left:' + x.toFixed(1) + 'px;top:' + y.toFixed(1) +
        'px;--s:' + size.toFixed(1) + 'px;--o:' + opacity.toFixed(2) + ';--r:' + angle.toFixed(0) + 'deg"></span>';
    }
    layer.innerHTML = html;
  }

  function initHeroDecor(content){
    decorObservers.forEach(o => o.disconnect());
    decorObservers = [];
    const hero = content && content.querySelector('.home-greeting');
    if(!hero) return;
    hero.querySelectorAll('.home-petals, .home-arc-marks').forEach(n => n.remove());
    ensurePetalDefs();

    const marks = document.createElement('div');
    marks.className = 'home-arc-marks';
    marks.setAttribute('aria-hidden', 'true');
    const petals = buildPetals(hero);
    const scrim = hero.querySelector('.home-greeting-scrim');
    const anchor = scrim ? scrim.nextSibling : hero.firstChild;
    hero.insertBefore(marks, anchor);
    hero.insertBefore(petals, anchor);
    buildArcMarks(marks, hero);

    if(typeof ResizeObserver !== 'undefined'){
      let lastW = hero.clientWidth, lastH = hero.clientHeight;
      const ro = new ResizeObserver(() => {
        if(hero.clientWidth === lastW && hero.clientHeight === lastH) return;
        lastW = hero.clientWidth; lastH = hero.clientHeight;
        buildArcMarks(marks, hero);
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
  window.openHomeSection = function(key){
    // Only the four fixed sections of Home can populate this presentation.
    if(!['medical','doctors','study','tools'].includes(key)) return;
    const section = document.querySelector('#content.is-home [data-home-section="' + key + '"]');
    const overlay = document.getElementById('homeSectionOverlay');
    if(!section || !overlay) return;
    const cards = section.querySelectorAll('.home-rail > .qa-card');
    if(!cards.length) return;
    document.getElementById('homeSectionTitle').textContent = section.querySelector('h3').textContent;
    document.getElementById('homeSectionSub').textContent = cards.length + ' tools';
    document.getElementById('homeSectionIcon').innerHTML = cards[0].querySelector('.qa-icon').innerHTML;
    document.getElementById('homeSectionPanel').style.setProperty('--folder-color', section.style.getPropertyValue('--section-color'));
    const grid = document.getElementById('homeSectionGrid');
    grid.replaceChildren(...Array.from(cards, card => card.cloneNode(true)));
    overlay.classList.add('show');
  };
  window.closeHomeSection = function(){
    const overlay = document.getElementById('homeSectionOverlay');
    if(overlay) overlay.classList.remove('show');
  };
  const content = document.getElementById('content');
  if(content && content.classList.contains('is-home')){
    initHomeGreeting(content);
    initHomeRails(content);
  }
})();
