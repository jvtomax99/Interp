/* Your HUMC campus on CoreCHI Practice (renderCampus, CAMPUS_MAP, the
   building pick: the section below): moved verbatim out of index.html on
   2026-10-24 (docs/split-index.md, phase 3). Loaded by a plain <script src>
   just before index.html's own script. Its top-level lines only declare
   things, plus one document keydown listener for Escape, which reads
   CAMPUS_PICK and campusPick from this file when a key is pressed. The
   names it uses from index.html (requireName, startStudy, escapeHtml...)
   are read when a function runs. Keep it that way: a top-level line here
   that calls into index.html would run before index.html has. */

/* ---------- Your HUMC campus (CoreCHI Practice) ----------
   Jose, 2026-10-19: "make it look like a game", then "like Hackensack University Medical Center": the
   main entrance at dusk, from his photos (the entry drive with its lamps, the fountain circle, the brick
   towers with cream bands, the glass tower, the main building with the HMH mark). Each exam domain is one
   building; its windows light up in tenths as you master it. Pre-rendered 3D (docs/mockups/cchi-city:
   entrance.html + buildentr.cjs make city/*.webp and the manifest below): the scene once, and for each
   building its lit windows at 1..10 tenths, occluded by everything in front. CAMPUS_MAP: w,h render size;
   g scene box [x,y,w,h]; b[key] = { label [x,y], box (tap area), lv: boxes of the 10 lit layers };
   f fountain [x,y]; drive: the two lanes' ends. */
const CAMPUS_MAP = {"w":960,"h":760,"g":[0,0,960,760],"f":[451,480],"drive":[[368,738],[405,472],[510,472],[524,738]],"b":{"e":{"label":[455,348],"box":[374,334,161,109],"lv":[[366,357,90,98],[348,348,198,116],[343,344,206,132],[332,335,225,150],[324,326,240,165],[316,319,255,182],[313,310,267,196],[309,305,276,207],[305,300,284,219],[302,296,289,227]]},"t":{"label":[466,242],"box":[430,234,72,154],"lv":[[411,267,91,125],[398,251,128,152],[389,242,148,169],[379,226,175,190],[372,221,188,208],[362,214,203,228],[356,208,214,241],[350,200,227,255],[346,197,234,260],[341,191,246,271]]},"s":{"label":[242,436],"box":[134,389,201,219],"lv":[[121,452,232,181],[108,426,258,231],[89,406,292,264],[84,392,310,290],[76,388,326,303],[72,379,339,324],[61,374,355,341],[57,368,365,352],[54,364,376,362],[47,359,391,374]]},"c":{"label":[649,354],"box":[573,329,157,187],"lv":[[558,364,189,178],[537,353,215,209],[519,336,262,241],[509,323,282,264],[501,314,298,280],[492,304,312,299],[485,294,325,317],[476,288,338,331],[467,282,354,345],[459,275,369,359]]},"n":{"label":[700,278],"box":[617,292,163,125],"lv":[[613,301,178,104],[597,286,205,137],[582,262,234,179],[571,254,254,198],[562,245,268,213],[555,237,282,231],[548,228,292,248],[543,219,304,264],[538,209,313,283],[534,200,323,302]]}},"layers":{"sky":[0,0,960,760],"far":[0,0,960,760],"near":[0,0,960,760]},"live":{"clouds":[0,0,960,259],"flags":[[258,596,74,13],[258,596,74,14],[258,596,74,13]],"spray":[[434,457,34,33],[435,457,33,33],[433,457,34,34],[434,457,33,32]],"carIn":{"img":[505,565,16,18],"ref":[513,575],"pts":[[522,738,1.204],[517,647,1.095],[513,575,1],[510,517,0.917],[508,468,0.845]]},"carOut":{"img":[382,568,16,18],"ref":[391,575],"pts":[[406,468,0.845],[399,517,0.917],[391,575,1],[381,647,1.095],[368,738,1.202]]},"amb":{"img":[[527,549,23,35],[521,549,23,35]],"ref":[536,574],"pts":[[550,735,1.204],[541,631,1.077],[534,546,0.961],[532,487,0.876],[547,460,0.835],[563,453,0.822]]},"carIn2":{"img":[482,537,15,17],"ref":[490,547],"pts":[[493,738,1.253],[491,633,1.121],[490,547,1],[489,498,0.926],[489,468,0.879]]},"street":[{"img":[427,736,34,17],"ref":[441,745],"pts":[[-70,745,0.896],[257,745,0.981],[624,745,0.992],[951,745,0.921]],"dur":11000},{"img":[423,704,32,16],"ref":[442,713],"pts":[[932,713,0.925],[618,713,0.993],[266,713,0.982],[-48,713,0.901]],"dur":9500},{"img":[411,730,67,26],"ref":[441,745],"pts":[[-70,745,0.896],[257,745,0.981],[624,745,0.992],[951,745,0.921]],"dur":16000},{"img":[423,704,32,16],"ref":[442,713],"pts":[[932,713,0.925],[618,713,0.993],[266,713,0.982],[-48,713,0.901]],"dur":12500}],"bay":[[546,427,19,16],[542,427,28,16],[538,427,36,16]],"lot":{"img":[[66,658,27,26],[82,634,33,14]],"ref":[80,672],"pts":[[80,672,1],[90,653,0.982],[96,642,0.97]],"ref2":[96,642],"pts2":[[96,642,1],[194,642,1.026],[294,645,1.05],[345,665,1.083],[369,701,1.127],[368,738,1.169]]},"sitters":[{"img":[[210,660,11,33],[211,660,10,33]]},{"img":[[228,666,8,23],[228,666,8,23]]},{"img":[[665,660,10,33],[665,660,10,33]]}],"birds":{"img":[[409,167,100,24],[410,171,98,26]],"ref":[460,173],"pts":[[-54,162,0.742],[209,163,0.901],[460,173,1],[770,192,1.014],[1165,234,0.923]]},"walkers":[{"img":[[549,666,9,27],[549,666,9,27]],"ref":[553,684],"pts":[[4,684,0.918],[297,684,0.988],[553,684,1],[883,684,0.94]],"dur":42000},{"img":[[293,659,10,26],[293,659,10,26]],"ref":[299,676],"pts":[[879,676,0.952],[589,676,1.009],[299,676,1],[9,676,0.93]],"dur":48000},{"img":[[369,550,8,23],[369,550,8,23]],"ref":[373,565],"pts":[[128,631,1.041],[328,629,1.081],[373,565,1],[386,485,0.884],[413,457,0.842]],"dur":34000},{"img":[[521,550,8,23],[521,550,8,23]],"ref":[525,565],"pts":[[495,457,0.84],[520,485,0.883],[525,565,1],[573,631,1.087],[721,637,1.072]],"dur":36000},{"img":[[364,556,14,31],[364,556,14,31]],"ref":[371,575],"pts":[[147,635,1.037],[297,635,1.07],[371,575,1],[385,492,0.882],[410,456,0.831]],"dur":52000},{"img":[[329,678,7,18],[329,678,7,18]],"ref":[333,691],"pts":[[615,691,1.001],[554,691,1.007],[333,691,1],[259,691,0.989]],"dur":20000},{"img":[[424,444,6,20],[424,444,6,20]],"ref":[427,457],"pts":[[478,457,1.001],[427,457,1],[478,457,1.001]],"dur":22000},{"img":[[520,528,8,23],[520,528,8,23]],"ref":[524,543],"pts":[[519,472,0.892],[524,543,1],[519,472,0.892]],"dur":30000}],"heli":{"img":[[447,229,39,24],[446,229,40,24]],"ref":[466,244],"pts":[[802,116,0.82],[652,199,0.898],[532,176,0.979],[466,228,1.004],[466,244,1]],"pad":[466,244]}}};
const CAMPUS = [
  { key:'e', id:'ethics',      short:'Ethics',      place:'the building with the banners' },
  { key:'t', id:'terminology', short:'Terminology', place:'the white tower' },
  { key:'s', id:'systems',     short:'US Systems',  place:'the building on the left' },
  { key:'n', id:'encounter',   short:'Encounter',   place:'the Helena Theurer Pavilion' },
  { key:'c', id:'cultural',    short:'Culture',     place:'the dark tower' }
];
// How lit a building is: the same coverage the domain bars show (learned, plus half for shaky), in tenths.
const campusLevel = cover => Math.max(0, Math.min(10, Math.round(cover * 10)));
function renderCampus(ready, st, todayCount, goalPct, due, shaky, unseen){
  const M = CAMPUS_MAP, W = M.w;
  const mast = domainMastery();
  const cover = id => { const m = mast[id]; return m && m.total ? (m.known + m.shaky*0.5)/m.total : 0; };
  // Labels: name + % in a chip ~ (letters x 6.6 + 24) css px at the phone's ~0.37 css px per render px;
  // nudge any that would overlap upward, keep all inside the picture.
  const K = 0.37, tagsAt = {}, placed = [];
  if (!document.querySelector('#content .cp-card')) CAMPUS_PICK.key = null;   // a fresh arrival starts with nothing picked
  CAMPUS.map(b => b.key).sort((a, b) => M.b[b].label[1] - M.b[a].label[1]).forEach(key => {
    const w = ((CAMPUS.find(b => b.key === key).short.length + 5) * 6.6 + 24) / K, h = 30 / K;
    let x = Math.max(w/2 + 4, Math.min(W - w/2 - 4, M.b[key].label[0])), y = M.b[key].label[1];
    for (let guard = 0; guard < 12; guard++){
      const hit = placed.find(p => Math.abs(p.x - x) < (p.w + w)/2 + 6 && Math.abs(p.y - y) < h + 4);
      if (!hit) break; y = hit.y - h - 6;
    }
    placed.push({ x, y, w }); tagsAt[key] = [x, y, w];
  });
  const top = Math.max(0, Math.min(Math.min(...placed.map(p => p.y)) - 34/K - 8, M.g[1]));
  const bottom = M.g[1] + M.g[3], H = bottom - top;
  const pos = (x, y, w, h) => `left:${(x/W*100).toFixed(3)}%;top:${((y-top)/H*100).toFixed(3)}%;width:${(w/W*100).toFixed(3)}%;height:${(h/H*100).toFixed(3)}%`;
  const at = (x, y) => `left:${(x/W*100).toFixed(3)}%;top:${((y-top)/H*100).toFixed(3)}%`;
  const worst = ready.pct < 100 && ready.worst ? ready.worst.d.id : null;
  let lit = '', hits = '', tags = '', legend = '', sig = [];
  CAMPUS.forEach((b, i) => {
    const c = cover(b.id), lv = campusLevel(c), pct = Math.round(c*100), d = CCHI_DOMAINS.find(x => x.id === b.id) || {};
    sig.push(b.key + lv);
    if (lv) lit += `<span class="cp-litw" style="${pos(...M.b[b.key].lv[lv-1])};--i:${i}"><img class="cp-lit" src="./city/${b.key}-lit${lv}.webp" alt="" decoding="async" style="--fl:${(3.2 + i*0.7).toFixed(1)}s"></span>`;
    hits += `<button class="cp-bld" data-k="${b.key}" style="${pos(...M.b[b.key].box)}" tabindex="-1" aria-hidden="true"
        onclick="campusPick('${b.key}')"></button>`;
    tags += `<button class="cp-tag${b.id === worst ? ' is-focus' : ''}${CAMPUS_PICK.key === b.key ? ' is-sel' : ''}" data-k="${b.key}" style="${at(...tagsAt[b.key])};--dom:${d.color||'#888'}"
        onclick="campusPick('${b.key}')" aria-label="${escapeAttr(d.name||b.short)}, ${pct}% lit" aria-pressed="${CAMPUS_PICK.key === b.key}"><b>${escapeHtml(b.short)}</b><i>${pct}%</i></button>`;
    legend += `<button class="cp-key${b.id === worst ? ' is-focus' : ''}" style="--dom:${d.color||'#888'}" onclick="requireName(()=>startStudy('domain','${b.id}'))">
        <span class="cp-dot"></span>${escapeHtml(b.short)} <i>${pct}%</i></button>`;
  });
  // the living layers: clouds, flags, the fountain's spray (frames), vehicles moved along their paths by campusLife()
  const L = M.live, frames = (cls, arr) => arr.map((bx, i) => `<img class="${cls}" src="./city/${cls === 'cp-flag' ? 'flag' : 'spray'}${i}.webp" alt="" decoding="async" style="${pos(...bx)};--f:${i};--n:${arr.length}">`).join('');
  const origin = (o, bx) => `transform-origin:${((o.ref[0]-bx[0])/bx[2]*100).toFixed(2)}% ${((o.ref[1]-bx[1])/bx[3]*100).toFixed(2)}%`;
  const data = o => `data-ref="${o.ref.join(',')}" data-pts="${o.pts.map(p=>p.join(',')).join(';')}"`;
  const live = `<img class="cp-clouds" src="./city/clouds.webp" alt="" decoding="async" style="${pos(...L.clouds)}">${frames('cp-flag', L.flags)}${frames('cp-spray', L.spray)}
    <img class="cp-veh cp-car" src="./city/car-in.webp" alt="" decoding="async" ${data(L.carIn)} style="${pos(...L.carIn.img)};${origin(L.carIn, L.carIn.img)}">
    <img class="cp-veh cp-car" src="./city/car-out.webp" alt="" decoding="async" ${data(L.carOut)} style="${pos(...L.carOut.img)};${origin(L.carOut, L.carOut.img)}">
    <span class="cp-veh cp-amb" ${data(L.amb)} style="${pos(...L.amb.img[0])};${origin(L.amb, L.amb.img[0])}"><img src="./city/amb0.webp" alt="" decoding="async"><img src="./city/amb1.webp" alt="" decoding="async"></span>
    <img class="cp-veh cp-car" src="./city/car-in2.webp" alt="" decoding="async" ${data(L.carIn2)} style="${pos(...L.carIn2.img)};${origin(L.carIn2, L.carIn2.img)}">
    ${L.street.map((o, i) => `<img class="cp-veh cp-mv" src="./city/street${i}.webp" alt="" decoding="async" ${data(o)} data-dur="${o.dur}" data-delay="${-i*3700}" style="${pos(...o.img)};${origin(o, o.img)}">`).join('')}
    ${L.walkers.map((o, i) => `<span class="cp-veh cp-mv cp-walk" ${data(o)} data-dur="${o.dur}" data-delay="${-i*5300}" style="${pos(...o.img[0])};${origin(o, o.img[0])}"><img src="./city/walk${i}-0.webp" alt="" decoding="async"><img src="./city/walk${i}-1.webp" alt="" decoding="async"></span>`).join('')}
    <span class="cp-veh cp-heli" ${data(L.heli)} style="${pos(...L.heli.img[0])};${origin(L.heli, L.heli.img[0])}"><img src="./city/heli0.webp" alt="" decoding="async"><img src="./city/heli1.webp" alt="" decoding="async"></span>
    ${L.bay ? `<span class="cp-bay" style="${pos(...L.bay[2])}">${L.bay.map((bx, i) => `<img src="./city/bay${i}.webp" alt="" decoding="async" style="left:${((bx[0]-L.bay[2][0])/L.bay[2][2]*100).toFixed(2)}%;width:${(bx[2]/L.bay[2][2]*100).toFixed(2)}%">`).join('')}</span>` : ''}
    ${L.lot ? `<span class="cp-veh cp-lot" ${data(L.lot)} data-ref2="${L.lot.ref2.join(',')}" data-pts2="${L.lot.pts2.map(p=>p.join(',')).join(';')}" style="${pos(...L.lot.img[0])};${origin(L.lot, L.lot.img[0])}"><img src="./city/lot0.webp" alt="" decoding="async"><img src="./city/lot1.webp" alt="" decoding="async" style="left:${((L.lot.img[1][0]-L.lot.img[0][0])/L.lot.img[0][2]*100).toFixed(2)}%;top:${((L.lot.img[1][1]-L.lot.img[0][1])/L.lot.img[0][3]*100).toFixed(2)}%;width:${(L.lot.img[1][2]/L.lot.img[0][2]*100).toFixed(2)}%;height:${(L.lot.img[1][3]/L.lot.img[0][3]*100).toFixed(2)}%"></span>` : ''}
    ${(L.sitters || []).map((o, i) => `<span class="cp-veh cp-sit" style="${pos(...o.img[0])};--i:${i}"><img src="./city/sit${i}-0.webp" alt="" decoding="async"><img src="./city/sit${i}-1.webp" alt="" decoding="async"></span>`).join('')}
    ${L.birds ? `<span class="cp-veh cp-birds" ${data(L.birds)} style="${pos(...L.birds.img[0])};${origin(L.birds, L.birds.img[0])}"><img src="./city/birds0.webp" alt="" decoding="async"><img src="./city/birds1.webp" alt="" decoding="async"></span>` : ''}`;
  // Dr. Smiley stands at the building to light next
  const wk = worst ? CAMPUS.find(x => x.id === worst).key : null;
  const dr = wk ? `<span class="cp-dr" style="${at(Math.max(22/K, tagsAt[wk][0] - tagsAt[wk][2]/2 - 24/K), tagsAt[wk][1] - 2/K)}">${drSmileyArt('ask-face')}</span>` : '';
  let say;
  if (!worst) say = 'Every window is lit. Sit an exam simulation to prove it!';
  else { const b = CAMPUS.find(x => x.id === worst); say = `Light up <b>${escapeHtml(b ? b.place : '')}</b>: ${escapeHtml(b ? b.short : ready.worst.d.name)} is ${ready.worst.d.weight}% of the exam.`; }
  const next = due ? ['review', `Play: ${due} due`] : shaky ? ['weak', `Play: ${shaky} mistake${shaky===1?'':'s'}`] : unseen ? ['new', 'Play: learn new'] : ['exam', 'Play: exam sim'];
  return `<div class="cp-card dash-in" data-motion="ready" data-sig="${ready.pct}|${st.days||0}|${todayCount}|${due}|${sig.join('')}">
    <div class="cp-hud">
      <small>Your HUMC campus</small>
      <div class="ready-ring" data-pct="${ready.pct}">
        <div class="ready-ring-in"><b class="ready-pct">0%</b><span class="ready-cap">ready</span></div>
      </div>
      <span>${escapeHtml(ready.title)}</span>
    </div>
    <div class="cp-say"><p><small>Dr. Smiley</small>${say}</p></div>
    <div class="cp-world${CAMPUS_PICK.key ? ' has-sel' : ''}" style="aspect-ratio:${W} / ${H}" data-top="${top}" onclick="campusTapOut(event)">
      ${M.layers ? `<img class="cp-depth cp-d-sky" src="./city/sky.webp" alt="" decoding="async" style="${pos(...M.layers.sky)}"><img class="cp-depth cp-d-far" src="./city/far.webp" alt="" decoding="async" style="${pos(...M.layers.far)}">
      <img class="cp-ground" src="./city/near.webp" alt="" decoding="async" style="${pos(...M.layers.near)}">` : `<img class="cp-ground" src="./city/entrance.webp" alt="" decoding="async" style="${pos(...M.g)}">`}
      ${lit}${live}<span class="cp-shade"${CAMPUS_PICK.key ? ` style="${campusShadeAt(CAMPUS_PICK.key, top)}"` : ''}></span>${CAMPUS_PICK.key ? campusSelLit(CAMPUS_PICK.key, top) : ''}${hits}${tags}${dr}
    </div>
    <div class="cp-foot${CAMPUS_PICK.key ? ' has-sel' : ''}">
    <div class="cp-pick" role="region" aria-live="polite" aria-label="Picked building">${CAMPUS_PICK.key ? campusPickCard(CAMPUS_PICK.key) : ''}</div>
    <div class="cp-chips">
      <span class="cp-chip study-streak"><i>${ICON_FLAME}</i><b class="study-flame js-count" data-to="${st.days||0}">${st.days||0}</b> day${(st.days||0)===1?'':'s'}</span>
      <span class="cp-chip${todayCount >= DAILY_GOAL ? ' is-met' : ''}"><i>${ICON_TARGET}</i><b class="js-count" data-to="${todayCount}">${todayCount}</b>&#8202;/&#8202;${DAILY_GOAL} today</span>
      <span class="cp-chip"><i>${ICON_CLOCK}</i><b class="js-count" data-to="${due}">${due}</b> due</span>
    </div>
    <div class="cp-go">
      <button class="cp-play" onclick="requireName(()=>startStudy('${next[0]}'))">${escapeHtml(next[1])}</button>
      <button class="cp-exam" onclick="requireName(()=>startStudy('exam'))">Exam sim</button>
    </div>
    </div>
  </div>`;
}

/* Picking a building: the first tap on a building or its badge picks it (its windows all light, the
   rest of the scene dims, a card names the exam area with Practise); a second tap, or Practise,
   starts. A tap on the empty scene, the card's close or Escape puts it back. Kept across the
   screen's re-renders, dropped on a fresh arrival (renderCampus). */
const CAMPUS_PICK = { key: null };
function campusPos(top){ const M = CAMPUS_MAP, H = M.g[1] + M.g[3] - top;
  return { box: (x, y, w, h) => `left:${(x/M.w*100).toFixed(3)}%;top:${((y-top)/H*100).toFixed(3)}%;width:${(w/M.w*100).toFixed(3)}%;height:${(h/H*100).toFixed(3)}%`,
    pt: (x, y) => [(x/M.w*100).toFixed(2) + '%', ((y-top)/H*100).toFixed(2) + '%'], H }; }
function campusShadeAt(key, top){
  const [x, y, w, h] = CAMPUS_MAP.b[key].box, P = campusPos(top), [cx, cy] = P.pt(x + w/2, y + h/2);
  return `--cx:${cx};--cy:${cy};--rw:${(w/CAMPUS_MAP.w*100*0.85).toFixed(2)}%;--rh:${(h/P.H*100*0.8).toFixed(2)}%`;
}
const campusSelLit = (key, top) => `<span class="cp-litw cp-litsel" style="${campusPos(top).box(...CAMPUS_MAP.b[key].lv[9])}"><img class="cp-lit" src="./city/${key}-lit10.webp" alt="" decoding="async"></span>`;
function campusPickCard(key){
  const b = CAMPUS.find(x => x.key === key), d = CCHI_DOMAINS.find(x => x.id === b.id) || {}, m = domainMastery()[b.id];
  const pct = Math.round((m && m.total ? (m.known + m.shaky*0.5)/m.total : 0) * 100), n = allQuestions().filter(q => q.d === b.id).length;
  return `<div class="cp-pick-in" style="--dom:${d.color||'#888'}">
    <p><b><span class="cp-dot"></span>${escapeHtml(d.name || b.short)}</b>
      <small>${n} question${n === 1 ? '' : 's'} · ${d.weight}% of exam</small></p>
    <div class="cp-pick-go"><button class="cp-play" onclick="campusGo('${key}')" aria-label="Practise ${escapeAttr(b.short)}, ${pct}% lit">Practise</button>
      <button class="cp-pick-x" onclick="campusPick(null)" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button></div>
  </div>`;
}
function campusPick(key){
  if (key && CAMPUS_PICK.key === key) return campusGo(key);
  CAMPUS_PICK.key = key;
  const world = document.querySelector('#content .cp-world'), pick = document.querySelector('#content .cp-pick');
  if (!world || !pick) return;
  const top = +world.dataset.top || 0, shade = world.querySelector('.cp-shade');
  world.classList.toggle('has-sel', !!key);
  const foot = document.querySelector('#content .cp-foot'); if (foot) foot.classList.toggle('has-sel', !!key);
  world.querySelectorAll('.cp-tag').forEach(t => { const on = t.dataset.k === key; t.classList.toggle('is-sel', on); t.setAttribute('aria-pressed', on); });
  const old = world.querySelector('.cp-litsel'); if (old) old.remove();
  if (key){ shade.setAttribute('style', campusShadeAt(key, top)); shade.insertAdjacentHTML('afterend', campusSelLit(key, top)); }
  pick.innerHTML = key ? campusPickCard(key) : '';
}
function campusGo(key){
  const b = CAMPUS.find(x => x.key === key); CAMPUS_PICK.key = null;
  if (b) requireName(() => startStudy('domain', b.id));
}
function campusTapOut(e){ if (CAMPUS_PICK.key && !e.target.closest('.cp-bld, .cp-tag')) campusPick(null); }
document.addEventListener('keydown', e => { if (e.key === 'Escape' && CAMPUS_PICK.key && document.querySelector('#content .cp-world.has-sel')) campusPick(null); });
