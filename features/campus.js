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
const CAMPUS_MAP = {"w":960,"h":840,"g":[0,0,960,840],"f":[455,432],"drive":[[552,644],[389,434],[496,414],[672,618]],"b":{"e":{"label":[400,280],"box":[264,251,252,163],"lv":[[268,353,248,60],[267,347,249,66],[267,341,249,72],[267,331,249,82],[265,323,251,90],[264,315,252,98],[264,309,252,104],[264,300,252,113],[263,259,255,154],[263,259,255,154]],"gl":[[262,347,269,89],[248,330,287,112],[248,330,287,112],[245,321,296,128],[239,301,306,157],[239,301,306,157],[230,285,323,177],[220,274,333,190],[220,274,333,190],[220,274,333,190]]},"t":{"label":[330,150],"box":[302,159,107,177],"lv":[null,[306,278,7,9],[305,265,18,22],[304,253,28,34],[304,240,105,47],[304,225,105,62],[303,213,106,74],[303,199,106,88],[302,185,107,102],[301,168,108,119]],"gl":[[302,296,35,38],[284,259,144,96],[282,251,147,107],[277,236,153,127],[261,208,179,161],[255,189,197,184],[252,182,203,192],[242,158,220,220],[239,149,227,230],[239,149,227,230]]},"s":{"label":[300,470],"box":[225,395,190,191],"lv":[[228,490,188,97],[227,481,189,106],[227,475,189,112],[227,466,189,121],[227,456,189,131],[227,448,189,139],[226,439,190,148],[226,436,190,151],[226,405,190,182],[226,405,190,182]],"gl":[[281,453,155,155],[280,443,167,169],[280,443,167,169],[270,424,195,202],[255,413,216,219],[255,413,216,219],[242,397,233,238],[239,390,242,248],[239,390,242,248],[239,390,242,248]]},"c":{"label":[740,300],"box":[567,272,322,254],"lv":[[566,417,299,109],[566,407,314,119],[566,397,315,129],[566,376,318,150],[566,372,318,154],[566,360,318,166],[566,347,318,179],[566,338,318,188],[566,326,318,200],[566,295,318,231]],"gl":[[553,410,337,142],[545,395,349,170],[534,375,366,202],[522,359,380,224],[520,349,387,236],[518,336,390,252],[514,315,397,276],[512,295,401,297],[511,284,405,308],[511,284,405,308]]},"n":{"label":[715,150],"box":[514,219,216,134],"lv":[[514,303,111,52],[513,298,112,57],[513,291,214,64],[513,285,215,70],[513,280,215,75],[513,273,215,82],[513,266,216,89],[513,262,216,93],[513,228,218,127],[513,228,218,127]],"gl":[[504,292,237,84],[504,292,237,84],[497,282,245,100],[491,264,258,131],[491,264,258,131],[486,246,265,155],[486,246,265,155],[475,228,277,178],[475,228,277,178],[475,228,277,178]]}},"layers":{"sky":[0,0,960,840],"far":[0,0,960,840],"near":[0,0,960,840]},"live":{"clouds":[15,94,928,731],"flags":[[429,538,61,24],[429,539,61,23],[429,538,60,24]],"spray":[[440,409,32,34],[440,410,29,32],[438,410,32,32],[440,409,31,31]],"carIn":{"img":[562,497,20,17],"ref":[574,507],"pts":[[670,618,1.072],[620,560,1.035],[574,507,1],[530,457,0.967],[490,410,0.935]]},"carOut":{"img":[455,522,20,17],"ref":[463,529],"pts":[[386,430,0.933],[423,478,0.966],[463,529,1],[506,585,1.036],[552,644,1.074]]},"amb":{"img":[[580,478,25,33],[575,479,30,32]],"ref":[594,501],"pts":[[691,611,1.071],[632,544,1.028],[574,478,0.985],[531,425,0.949],[525,395,0.928],[543,385,0.921],[550,379,0.917]]},"carIn2":{"img":[522,478,20,17],"ref":[534,488],"pts":[[648,623,1.089],[590,555,1.045],[534,488,1],[496,443,0.97],[471,414,0.949]]},"street":[{"img":[600,627,29,16],"ref":[612,636],"pts":[[201,729,1.05],[470,668,1.02],[749,605,0.977],[981,553,0.933]],"dur":11000},{"img":[579,609,29,16],"ref":[596,616],"pts":[[961,535,0.934],[732,586,0.978],[455,648,1.02],[189,707,1.049]],"dur":9500},{"img":[587,620,56,27],"ref":[612,636],"pts":[[201,729,1.05],[470,668,1.02],[749,605,0.977],[981,553,0.933]],"dur":16000},{"img":[579,609,29,16],"ref":[596,616],"pts":[[961,535,0.934],[732,586,0.978],[455,648,1.02],[189,707,1.049]],"dur":12500}],"bay":[[529,352,20,21],[525,351,28,23],[521,350,37,24]],"lot":{"img":[[252,646,24,22],[238,626,29,15]],"ref":[263,657],"pts":[[263,657,1],[255,644,0.992],[250,635,0.986]],"ref2":[250,635],"pts2":[[250,635,1],[339,616,0.991],[429,599,0.982],[488,603,0.985],[530,622,0.996],[552,644,1.009]]},"sitters":[{"img":[[389,617,11,29],[389,617,11,29]]},{"img":[[404,620,7,20],[404,620,7,20]]},{"img":[[755,538,10,28],[755,538,10,28]]}],"birds":{"img":[[232,50,121,40],[234,57,119,41]],"ref":[288,59],"pts":[[-557,114,0.938],[-76,78,0.991],[288,59,1],[661,40,0.972],[1066,38,0.912]]},"walkers":[{"img":[[667,562,8,24],[667,562,8,24]],"ref":[671,578],"pts":[[213,678,1.06],[464,623,1.031],[671,578,1],[920,523,0.954]],"dur":42000},{"img":[[456,601,8,25],[456,601,8,25]],"ref":[460,618],"pts":[[915,519,0.925],[695,567,0.965],[460,618,1],[209,672,1.027]],"dur":48000},{"img":[[438,508,8,24],[438,508,8,24]],"ref":[442,524],"pts":[[274,620,1.06],[451,580,1.037],[442,524,1],[386,450,0.95],[387,417,0.928]],"dur":34000},{"img":[[577,480,8,23],[577,480,8,23]],"ref":[581,496],"pts":[[472,401,0.936],[519,425,0.952],[581,496,1],[660,538,1.027],[781,517,1.008]],"dur":36000},{"img":[[442,513,15,31],[442,513,15,31]],"ref":[450,532],"pts":[[298,618,1.054],[430,590,1.038],[450,532,1],[393,457,0.95],[385,418,0.923]],"dur":52000},{"img":[[493,610,6,16],[493,610,6,17]],"ref":[496,622],"pts":[[720,573,0.966],[673,583,0.974],[496,622,1],[435,635,1.008]],"dur":20000},{"img":[[398,400,8,23],[398,400,8,23]],"ref":[402,415],"pts":[[455,405,0.993],[402,415,1],[455,405,0.993]],"dur":22000},{"img":[[561,462,8,23],[561,462,8,23]],"ref":[565,477],"pts":[[508,412,0.955],[565,477,1],[508,412,0.955]],"dur":30000}],"heli":{"img":[[327,162,51,30],[327,162,50,30]],"ref":[354,180],"pts":[[666,-71,0.886],[524,63,0.934],[412,87,0.986],[354,162,1.003],[354,180,1]],"pad":[354,180]},"idlers":{"atlas":[0,0,672,27],"items":[{"box":[403,397,8,22],"a":[[0,0],[10,0]]},{"box":[412,392,8,23],"a":[[20,0],[30,0]]},{"box":[453,388,8,23],"a":[[40,0],[50,0]]},{"box":[463,383,7,22],"a":[[60,0],[69,0]]},{"box":[463,395,5,15],"a":[[78,0],[85,0]]},{"box":[272,646,9,25],"a":[[92,0],[103,0]]},{"box":[329,638,9,25],"a":[[114,0],[125,0]]},{"box":[548,585,9,25],"a":[[136,0],[147,0]]},{"box":[600,578,9,24],"a":[[158,0],[169,0]]},{"box":[702,551,9,24],"a":[[180,0],[191,0]]},{"box":[835,525,9,24],"a":[[202,0],[213,0]]},{"box":[892,511,9,24],"a":[[224,0],[235,0]]},{"box":[366,467,8,23],"a":[[246,0],[256,0]]},{"box":[399,512,8,24],"a":[[266,0],[276,0]]},{"box":[181,413,8,23],"a":[[286,0],[296,0]]},{"box":[154,394,6,15],"a":[[306,0],[314,0]]},{"box":[96,437,8,23],"a":[[322,0],[332,0]]},{"box":[738,356,8,22],"a":[[342,0],[352,0]]},{"box":[753,359,8,22],"a":[[362,0],[372,0]]},{"box":[547,352,7,22],"a":[[382,0],[391,0]]},{"box":[316,394,7,23],"a":[[400,0],[409,0]]},{"box":[369,603,6,17],"a":[[418,0],[426,0]]},{"box":[704,517,13,24],"a":[[434,0],[449,0]]},{"box":[724,518,9,19],"a":[[464,0],[475,0]]},{"box":[748,517,13,24],"a":[[486,0],[501,0]]},{"box":[765,513,14,26],"a":[[516,0],[532,0]]},{"box":[727,535,13,24],"a":[[548,0],[563,0]]},{"box":[744,530,14,27],"a":[[578,0],[594,0]]},{"box":[745,500,13,24],"a":[[610,0],[625,0]]},{"box":[762,496,14,26],"a":[[640,0],[656,0]]}]},"cranes":{"atlas":[0,0,1541,181],"items":{"e":{"box":[304,282,83,54],"a":[[0,0],[85,0],[170,0],[255,0],[340,0],[425,0],[510,0],[595,0]]},"t":{"box":[312,156,80,50],"a":[[680,0],[762,0],[844,0],[926,0],[1008,0],[1090,0],[1172,0],[1254,0]]},"s":{"box":[264,436,93,63],"a":[[1336,0],[1431,0],[0,65],[95,65],[190,65],[285,65],[380,65],[475,65]]},"c":{"box":[661,301,89,58],"a":[[570,65],[661,65],[752,65],[843,65],[934,65],[1025,65],[1116,65],[1207,65]]},"n":{"box":[552,239,79,51],"a":[[1298,65],[1379,65],[1460,65],[0,130],[81,130],[162,130],[243,130],[324,130]]}}}}};
const CAMPUS = [
  { key:'e', id:'ethics',      short:'Ethics',      place:'the building with the banners' },
  { key:'t', id:'terminology', short:'Terminology', place:'the brick tower' },
  { key:'s', id:'systems',     short:'US Systems',  place:'the building on the left' },
  { key:'n', id:'encounter',   short:'Encounter',   place:'John Theurer Cancer Center' },
  { key:'c', id:'cultural',    short:'Culture',     place:'the stepped building on the right' }
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
  let paint = '', hits = [], tags = '', legend = '', sig = [];
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
    // a tenth hidden behind another building (the brick tower's first, behind Ethics) has no picture
    const layer = (n, extra) => !B.lv[n-1] ? '' : `<span class="cp-paintw${extra ? ' cp-rise' : ''}" style="${pos(...B.lv[n-1])};--i:${i}${extra || ''}"><img class="cp-paint" src="./city/${b.key}-paint${n}.webp" alt="" decoding="async"></span>`;
    if (was) paint += layer(was);
    for (let n = was + 1; n <= lv; n++) paint += layer(n, `;--s:${n - was - 1}`);
    if (lv > was) paint += `<span class="cp-spark" style="${at(...B.label)};--s:${lv - was}"></span>`;
    // warm windows on the painted floors, flickering; after a rise they come on at its end
    if (lv && B.gl && B.gl[lv-1]) paint += `<span class="cp-paintw cp-glw${lv > was ? ' cp-rise' : ''}" style="${pos(...B.gl[lv-1])};--i:${i};--s:${lv - was}"><img class="cp-glow" src="./city/${b.key}-glow${lv}.webp" alt="" decoding="async" style="--fl:${(3.2 + i*0.7).toFixed(1)}s"></span>`;
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
    ${L.idlers ? L.idlers.items.map((it, i) => `<span class="cp-idle" style="${pos(...it.box)};--i:${i};--d:${(5 + (i*7)%5).toFixed(0)}s"><i style="${sprite(L.idlers.atlas, it, 0)}"></i><i style="${sprite(L.idlers.atlas, it, 1)}"></i></span>`).join('') : ''}
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
