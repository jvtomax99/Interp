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
   main entrance, from his photos (the entry drive, the fountain circle, the brick towers with cream bands,
   the glass towers, the main building with the HMH mark). 2026-10-26, from a video he sent: a floating
   diorama on a layered board, seen from the front-left corner, in the campus's own colours at golden hour. Each exam domain is one
   building; it is painted in tenths as you master it (full colour from the ground up, a faded
   version of its colours above, its windows pale). Pre-rendered 3D (docs/mockups/cchi-city: diorama.html + builddiorama.cjs make city/*.webp and the
   manifest below): the board with every building faded once, and for each building its paint at 1..10 tenths, occluded by
   everything in front. CAMPUS_MAP: w,h render size; g scene box [x,y,w,h]; b[key] = { label [x,y], box
   (tap area), lv: boxes of the 10 paint layers }; f fountain [x,y]; drive: the two lanes' ends. */
const CAMPUS_MAP = {"w":960,"h":840,"g":[0,0,960,840],"f":[455,432],"drive":[[552,644],[389,434],[496,414],[672,618]],"b":{"e":{"label":[396,275],"box":[297,258,198,152],"lv":[[299,362,196,41],[299,355,196,48],[298,346,197,57],[298,337,197,66],[298,330,197,73],[297,320,198,83],[297,311,198,92],[297,303,198,100],[295,267,202,136],[295,267,202,136]],"gl":[[299,363,156,69],[285,341,218,101],[277,330,229,117],[277,330,229,117],[271,314,245,139],[262,296,255,161],[257,282,263,177],[251,270,272,191],[251,270,272,191],[251,270,272,191]]},"t":{"label":[330,150],"box":[301,139,108,197],"lv":[[306,289,6,4],[306,274,13,19],[305,260,26,33],[304,245,105,48],[303,229,106,64],[303,215,106,78],[302,195,107,98],[302,183,107,110],[301,167,108,126],[300,148,109,145]],"gl":[[296,287,104,65],[287,264,113,89],[278,239,152,125],[273,225,162,141],[260,195,192,176],[255,180,206,194],[246,156,224,222],[241,142,231,238],[236,124,241,257],[236,124,241,257]]},"s":{"label":[260,480],"box":[187,358,220,243],"lv":[[192,472,216,130],[191,463,217,139],[191,453,217,149],[191,439,217,163],[190,430,218,172],[190,421,218,181],[189,413,219,189],[188,400,220,202],[188,400,220,202],[188,367,220,235]],"gl":[[280,444,137,174],[246,441,189,200],[239,424,202,224],[230,402,227,249],[225,391,244,263],[218,373,256,283],[211,360,270,299],[211,360,270,299],[201,349,286,313],[201,349,286,313]]},"c":{"label":[690,275],"box":[539,230,188,213],"lv":[[539,363,87,78],[539,352,87,89],[539,341,88,100],[539,327,88,114],[539,311,89,130],[539,302,186,139],[539,290,186,151],[539,273,187,168],[539,265,189,176],[539,236,189,205]],"gl":[[533,366,205,89],[514,331,236,155],[506,317,249,173],[496,303,269,190],[493,293,278,203],[487,277,290,222],[481,253,306,252],[478,236,314,271],[474,221,320,287],[474,221,320,287]]},"n":{"label":[680,150],"box":[531,166,189,166],"lv":[[532,286,201,28],[532,275,201,39],[532,263,201,51],[532,247,201,67],[532,234,201,80],[531,211,202,103],[531,199,202,115],[531,186,202,128],[531,172,202,142],[531,145,202,169]],"gl":[null,null,[522,247,204,74],[514,235,219,91],[493,187,256,166],[492,182,262,173],[485,171,276,186],[474,140,296,222],[474,140,296,222],[474,140,296,222]]}},"layers":{"sky":[0,0,960,840],"far":[0,0,960,840],"near":[0,0,960,840]},"live":{"clouds":[15,94,928,731],"flags":[[429,538,61,24],[429,539,61,23],[429,538,60,24]],"spray":[[440,409,32,34],[440,410,29,32],[438,410,32,32],[440,409,31,31]],"carIn":{"img":[562,497,20,17],"ref":[574,507],"pts":[[670,618,1.072],[620,560,1.035],[574,507,1],[530,457,0.967],[490,410,0.935]]},"carOut":{"img":[455,522,20,17],"ref":[463,529],"pts":[[386,430,0.933],[423,478,0.966],[463,529,1],[506,585,1.036],[552,644,1.074]]},"amb":{"img":[[580,478,25,33],[575,479,30,32]],"ref":[594,501],"pts":[[691,611,1.071],[632,544,1.028],[574,478,0.985],[531,425,0.949],[525,395,0.928],[535,384,0.92]]},"carIn2":{"img":[522,478,20,17],"ref":[534,488],"pts":[[648,623,1.089],[590,555,1.045],[534,488,1],[496,443,0.97],[471,414,0.949]]},"street":[{"img":[600,627,29,16],"ref":[612,636],"pts":[[201,729,1.05],[470,668,1.02],[749,605,0.977],[981,553,0.933]],"dur":11000},{"img":[579,609,29,16],"ref":[596,616],"pts":[[961,535,0.934],[732,586,0.978],[455,648,1.02],[189,707,1.049]],"dur":9500},{"img":[587,620,56,27],"ref":[612,636],"pts":[[201,729,1.05],[470,668,1.02],[749,605,0.977],[981,553,0.933]],"dur":16000},{"img":[579,609,29,16],"ref":[596,616],"pts":[[961,535,0.934],[732,586,0.978],[455,648,1.02],[189,707,1.049]],"dur":12500}],"bay":[[507,356,20,21],[503,355,28,23],[499,355,37,24]],"lot":{"img":[[252,646,24,22],[238,626,29,15]],"ref":[263,657],"pts":[[263,657,1],[255,644,0.992],[250,635,0.986]],"ref2":[250,635],"pts2":[[250,635,1],[339,616,0.991],[429,599,0.982],[488,603,0.985],[530,622,0.996],[552,644,1.009]]},"sitters":[{"img":[[389,617,11,29],[389,617,11,29]]},{"img":[[404,620,7,20],[404,620,7,20]]},{"img":[[755,538,10,28],[755,538,10,28]]}],"birds":{"img":[[232,50,121,40],[234,57,119,41]],"ref":[288,59],"pts":[[-557,114,0.938],[-76,78,0.991],[288,59,1],[661,40,0.972],[1066,38,0.912]]},"walkers":[{"img":[[667,562,8,24],[667,562,8,24]],"ref":[671,578],"pts":[[213,678,1.06],[464,623,1.031],[671,578,1],[920,523,0.954]],"dur":42000},{"img":[[456,601,8,25],[456,601,8,25]],"ref":[460,618],"pts":[[915,519,0.925],[695,567,0.965],[460,618,1],[209,672,1.027]],"dur":48000},{"img":[[438,508,8,24],[438,508,8,24]],"ref":[442,524],"pts":[[274,620,1.06],[451,580,1.037],[442,524,1],[386,450,0.95],[387,417,0.928]],"dur":34000},{"img":[[577,480,8,23],[577,480,8,23]],"ref":[581,496],"pts":[[472,401,0.936],[519,425,0.952],[581,496,1],[660,538,1.027],[781,517,1.008]],"dur":36000},{"img":[[442,513,15,31],[442,513,15,31]],"ref":[450,532],"pts":[[298,618,1.054],[430,590,1.038],[450,532,1],[393,457,0.95],[385,418,0.923]],"dur":52000},{"img":[[493,610,6,16],[493,610,6,17]],"ref":[496,622],"pts":[[720,573,0.966],[673,583,0.974],[496,622,1],[435,635,1.008]],"dur":20000},{"img":[[398,400,8,23],[398,400,8,23]],"ref":[402,415],"pts":[[455,405,0.993],[402,415,1],[455,405,0.993]],"dur":22000},{"img":[[561,462,8,23],[561,462,8,23]],"ref":[565,477],"pts":[[508,412,0.955],[565,477,1],[508,412,0.955]],"dur":30000}],"heli":{"img":[[326,141,52,30],[326,141,50,30]],"ref":[354,159],"pts":[[666,-71,0.883],[524,63,0.931],[411,66,0.985],[353,141,1.003],[354,159,1]],"pad":[354,159]},"idlers":{"atlas":[0,0,674,27],"items":[{"box":[403,397,8,22],"a":[[0,0],[10,0]]},{"box":[412,392,8,23],"a":[[20,0],[30,0]]},{"box":[453,388,8,23],"a":[[40,0],[50,0]]},{"box":[463,383,7,22],"a":[[60,0],[69,0]]},{"box":[463,395,5,15],"a":[[78,0],[85,0]]},{"box":[272,646,9,25],"a":[[92,0],[103,0]]},{"box":[329,638,9,25],"a":[[114,0],[125,0]]},{"box":[548,585,9,25],"a":[[136,0],[147,0]]},{"box":[600,578,9,24],"a":[[158,0],[169,0]]},{"box":[702,551,9,24],"a":[[180,0],[191,0]]},{"box":[835,525,9,24],"a":[[202,0],[213,0]]},{"box":[892,511,9,24],"a":[[224,0],[235,0]]},{"box":[356,469,8,23],"a":[[246,0],[256,0]]},{"box":[387,514,9,24],"a":[[266,0],[277,0]]},{"box":[181,413,8,23],"a":[[288,0],[298,0]]},{"box":[154,394,6,15],"a":[[308,0],[316,0]]},{"box":[96,437,8,23],"a":[[324,0],[334,0]]},{"box":[719,379,7,22],"a":[[344,0],[353,0]]},{"box":[740,382,8,23],"a":[[362,0],[372,0]]},{"box":[549,355,8,22],"a":[[382,0],[392,0]]},{"box":[316,394,7,23],"a":[[402,0],[411,0]]},{"box":[369,603,6,17],"a":[[420,0],[428,0]]},{"box":[704,517,13,24],"a":[[436,0],[451,0]]},{"box":[724,518,9,19],"a":[[466,0],[477,0]]},{"box":[748,517,13,24],"a":[[488,0],[503,0]]},{"box":[765,513,14,26],"a":[[518,0],[534,0]]},{"box":[727,535,13,24],"a":[[550,0],[565,0]]},{"box":[744,530,14,27],"a":[[580,0],[596,0]]},{"box":[745,500,13,24],"a":[[612,0],[627,0]]},{"box":[762,496,14,26],"a":[[642,0],[658,0]]}]},"cranes":{"atlas":[0,0,1538,183],"items":{"e":{"box":[322,271,83,54],"a":[[0,0],[85,0],[170,0],[255,0],[340,0],[425,0],[510,0],[595,0]]},"t":{"box":[311,135,81,50],"a":[[680,0],[763,0],[846,0],[929,0],[1012,0],[1095,0],[1178,0],[1261,0]]},"s":{"box":[241,421,95,64],"a":[[1344,0],[1441,0],[0,66],[97,66],[194,66],[291,66],[388,66],[485,66]]},"c":{"box":[586,254,86,56],"a":[[582,66],[670,66],[758,66],[846,66],[934,66],[1022,66],[1110,66],[1198,66]]},"n":{"box":[566,149,80,51],"a":[[1286,66],[1368,66],[1450,66],[0,132],[82,132],[164,132],[246,132],[328,132]]}}}}};
const CAMPUS = [
  { key:'e', id:'ethics',      short:'Ethics',      place:'the building with the banners' },
  { key:'t', id:'terminology', short:'Terminology', place:'the white tower' },
  { key:'s', id:'systems',     short:'US Systems',  place:'the building on the left' },
  { key:'n', id:'encounter',   short:'Encounter',   place:'the Helena Theurer Pavilion' },
  { key:'c', id:'cultural',    short:'Culture',     place:'the dark tower' }
];
// How painted a building is: the same coverage the domain bars show (learned, plus half for shaky), in tenths.
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
  let paint = '', hits = [], tags = '', legend = '', sig = [], cranes = '';
  // Paint rising (Jose, 2026-10-26, "more alive"): a building whose level went up since this phone last drew the
  // campus climbs from the old tenth to the new one, a tenth at a time, then flashes warm at its top. ih_campusLv
  // keeps the levels drawn; the first visit just draws them.
  let seen = null; try { seen = JSON.parse(localStorage.getItem('ih_campusLv') || 'null'); } catch (e) {}
  const now = {}, sprite = (A, it, k) => { const [aw, ah] = [A[2], A[3]], [, , w, h] = it.box, [ax, ay] = it.a[k];
    return `background-size:${(aw/w*100).toFixed(2)}% ${(ah/h*100).toFixed(2)}%;background-position:${aw > w ? (ax/(aw-w)*100).toFixed(3) : 0}% ${ah > h ? (ay/(ah-h)*100).toFixed(3) : 0}%`; };
  CAMPUS.forEach((b, i) => {
    const c = cover(b.id), lv = campusLevel(c), pct = Math.round(c*100), d = CCHI_DOMAINS.find(x => x.id === b.id) || {}, B = M.b[b.key];
    sig.push(b.key + lv); now[b.key] = lv;
    const was = seen && Number.isInteger(seen[b.key]) && seen[b.key] < lv ? seen[b.key] : lv;
    const layer = (n, extra) => `<span class="cp-paintw${extra ? ' cp-rise' : ''}" style="${pos(...B.lv[n-1])};--i:${i}${extra || ''}"><img class="cp-paint" src="./city/${b.key}-paint${n}.webp" alt="" decoding="async"></span>`;
    if (was) paint += layer(was);
    for (let n = was + 1; n <= lv; n++) paint += layer(n, `;--s:${n - was - 1}`);
    if (lv > was) paint += `<span class="cp-spark" style="${at(...B.label)};--s:${lv - was}"></span>`;
    // warm windows on the painted floors, flickering; after a rise they come on at its end
    if (lv && B.gl) paint += `<span class="cp-paintw cp-glw${lv > was ? ' cp-rise' : ''}" style="${pos(...B.gl[lv-1])};--i:${i};--s:${lv - was}"><img class="cp-glow" src="./city/${b.key}-glow${lv}.webp" alt="" decoding="async" style="--fl:${(3.2 + i*0.7).toFixed(1)}s"></span>`;
    // a crane swings on the roof until the building is fully painted
    const C = M.live.cranes; if (C && lv < 10 && C.items[b.key]){ const it = C.items[b.key];
      cranes += `<span class="cp-crane" style="${pos(...it.box)}">${it.a.map((_, k) => `<i style="${sprite(C.atlas, it, k)}"></i>`).join('')}</span>`; }
    // tap areas go in back to front (lowest on screen last), so a building in front takes the tap where boxes overlap
    hits.push([M.b[b.key].box[1] + M.b[b.key].box[3], `<button class="cp-bld" data-k="${b.key}" style="${pos(...M.b[b.key].box)}" tabindex="-1" aria-hidden="true"
        onclick="campusPick('${b.key}')"></button>`]);
    tags += `<button class="cp-tag${b.id === worst ? ' is-focus' : ''}${CAMPUS_PICK.key === b.key ? ' is-sel' : ''}" data-k="${b.key}" style="${at(...tagsAt[b.key])};--dom:${d.color||'#888'}"
        onclick="campusPick('${b.key}')" aria-label="${escapeAttr(d.name||b.short)}, ${pct}% painted" aria-pressed="${CAMPUS_PICK.key === b.key}"><b>${escapeHtml(b.short)}</b><i>${pct}%</i></button>`;
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
    ${cranes}${L.idlers ? L.idlers.items.map((it, i) => `<span class="cp-idle" style="${pos(...it.box)};--i:${i};--d:${(5 + (i*7)%5).toFixed(0)}s"><i style="${sprite(L.idlers.atlas, it, 0)}"></i><i style="${sprite(L.idlers.atlas, it, 1)}"></i></span>`).join('') : ''}
    ${(L.sitters || []).map((o, i) => `<span class="cp-veh cp-sit" style="${pos(...o.img[0])};--i:${i}"><img src="./city/sit${i}-0.webp" alt="" decoding="async"><img src="./city/sit${i}-1.webp" alt="" decoding="async"></span>`).join('')}
    ${L.birds ? `<span class="cp-veh cp-birds" ${data(L.birds)} style="${pos(...L.birds.img[0])};${origin(L.birds, L.birds.img[0])}"><img src="./city/birds0.webp" alt="" decoding="async"><img src="./city/birds1.webp" alt="" decoding="async"></span>` : ''}`;
  try { localStorage.setItem('ih_campusLv', JSON.stringify(now)); } catch (e) {}
  // Dr. Smiley stands at the building to paint next
  const wk = worst ? CAMPUS.find(x => x.id === worst).key : null;
  // left of its badge, or right of it when that would cover another badge
  let dr = '';
  if (wk){ const [tx, ty, tw] = tagsAt[wk], r = 22/K, y = ty - 2/K;
    const covers = x => CAMPUS.some(c => { if (c.key === wk) return false; const [cx, cy, cw] = tagsAt[c.key]; return Math.abs(cx - x) < cw/2 + r && y + r > cy - 30/K && y - r < cy; });
    const left = Math.max(r, tx - tw/2 - 24/K), right = Math.min(W - r, tx + tw/2 + 24/K);
    dr = `<span class="cp-dr" style="${at(covers(left) && !covers(right) ? right : left, y)}">${drSmileyArt('ask-face')}</span>`; }
  let say;
  if (!worst) say = 'Every building is painted. Sit an exam simulation to prove it!';
  else { const b = CAMPUS.find(x => x.id === worst); say = `Paint <b>${escapeHtml(b ? b.place : '')}</b>: ${escapeHtml(b ? b.short : ready.worst.d.name)} is ${ready.worst.d.weight}% of the exam.`; }
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
      ${paint}${live}<span class="cp-shade"${CAMPUS_PICK.key ? ` style="${campusShadeAt(CAMPUS_PICK.key, top)}"` : ''}></span>${CAMPUS_PICK.key ? campusSelPaint(CAMPUS_PICK.key, top) : ''}${hits.sort((a, b) => a[0] - b[0]).map(h => h[1]).join('')}${tags}${dr}
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

/* Picking a building: the first tap on a building or its badge picks it (it shows in full colour, the
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
const campusSelPaint = (key, top) => `<span class="cp-paintw cp-paintsel" style="${campusPos(top).box(...CAMPUS_MAP.b[key].lv[9])}"><img class="cp-paint" src="./city/${key}-paint10.webp" alt="" decoding="async"></span>`;
function campusPickCard(key){
  const b = CAMPUS.find(x => x.key === key), d = CCHI_DOMAINS.find(x => x.id === b.id) || {}, m = domainMastery()[b.id];
  const pct = Math.round((m && m.total ? (m.known + m.shaky*0.5)/m.total : 0) * 100), n = allQuestions().filter(q => q.d === b.id).length;
  return `<div class="cp-pick-in" style="--dom:${d.color||'#888'}">
    <p><b><span class="cp-dot"></span>${escapeHtml(d.name || b.short)}</b>
      <small>${n} question${n === 1 ? '' : 's'} · ${d.weight}% of exam</small></p>
    <div class="cp-pick-go"><button class="cp-play" onclick="campusGo('${key}')" aria-label="Practise ${escapeAttr(b.short)}, ${pct}% painted">Practise</button>
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
  const old = world.querySelector('.cp-paintsel'); if (old) old.remove();
  if (key){ shade.setAttribute('style', campusShadeAt(key, top)); shade.insertAdjacentHTML('afterend', campusSelPaint(key, top)); }
  pick.innerHTML = key ? campusPickCard(key) : '';
}
function campusGo(key){
  const b = CAMPUS.find(x => x.key === key); CAMPUS_PICK.key = null;
  if (b) requireName(() => startStudy('domain', b.id));
}
function campusTapOut(e){ if (CAMPUS_PICK.key && !e.target.closest('.cp-bld, .cp-tag')) campusPick(null); }
document.addEventListener('keydown', e => { if (e.key === 'Escape' && CAMPUS_PICK.key && document.querySelector('#content .cp-world.has-sel')) campusPick(null); });
