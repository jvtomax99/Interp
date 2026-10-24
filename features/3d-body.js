/* The 3D Body's side of the Hub (anatomySync, the ATLAS frame bridge and
   the cards: the section below): moved verbatim out of index.html on
   2026-10-22 (docs/split-index.md, phase 3). The wall around atlas/ is
   unchanged; read docs/features/3d-body.md before touching it. Loaded by a
   plain <script src> just before index.html's own script. At load it only
   declares things and adds two listeners (window resize and message) whose
   handlers run later; the names it uses from index.html are read when a
   function runs. Keep it that way: a top-level line here that calls into
   index.html would run before index.html has. */

/* ---------- 3D Body ----------
   Human Atlas, an interactive 3D anatomy viewer written by someone outside
   the team (atlas/; atlas/README.md says where it came from, the two
   licences and how to rebuild it). It is walled off from the Hub: the frame
   is sandboxed without allow-same-origin, and vercel.json sends the same
   sandbox as a header, so even opened on its own it runs as an anonymous
   origin and cannot read the Hub's sign-in, saved data or page. Do not add
   allow-same-origin.
   The frame is made when this screen opens and removed when it closes: left
   running it would hold the whole body in the phone's graphics memory behind
   every other screen. The models (about 33 MB) are cached by the browser
   (long-lived headers in vercel.json), so the second visit is quicker. */
function anatomySync(){
  const want = activeCategory === 'anatomy';
  let layer = document.getElementById('anatLayer');
  document.body.classList.toggle('anat-open', want);
  if(!want){ if(layer) layer.remove(); return; }
  anatomyPlace();
  atlasLoadCatalogue();            // the cards' text, read only once the 3D Body is opened
  if(layer) return;
  layer = document.createElement('div');
  layer.id = 'anatLayer';
  layer.className = 'anat-layer';
  layer.innerHTML = `<div class="anat-wait">Opening the 3D body&hellip;</div>
    <iframe src="./atlas/index.html" title="3D Body: interactive anatomy"
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" referrerpolicy="no-referrer"></iframe>`;
  layer.querySelector('iframe').addEventListener('load', () => {
    layer.querySelector('.anat-wait')?.remove();
  }, { once:true });
  document.body.appendChild(layer);
}
// The top bar is sticky, and taller on desktop and with a notch.
function anatomyPlace(){
  const bar = document.querySelector('.topbar-global');
  const top = bar ? Math.max(0, Math.round(bar.getBoundingClientRect().bottom)) : 0;
  document.documentElement.style.setProperty('--anat-top', top + 'px');
}
// typeof: this file loads before index.html's script, so a resize while the
// page is still loading can come before activeCategory exists.
window.addEventListener('resize', () => { if(typeof activeCategory !== 'undefined' && activeCategory === 'anatomy') anatomyPlace(); });

/* ---- 3D Body cards: the Hub's side ----
   Tapping a structure in the viewer shows its card: English and Spanish
   names, a speaker for each, what it is, and Open glossary / Practice this
   term / Ask Dr. Smiley. The card text is atlas/hub-catalogue.json (30
   structures checked against the CUN dictionary and NCI/MedlinePlus, each
   with its sources), read when the 3D Body opens; nothing asks an AI to
   draw a card.
   The viewer stays walled off. It can only send these messages, and each is
   checked here before anything happens:
     from    the frame on screen right now (event.source), with the opaque
             origin a sandboxed frame always has ("null")
     shape   { source:'hub-atlas', v:1, type } and nothing large
     type    ready | card | action; action is glossary | practice | ask | pronounce
     id      a structure in the Hub's own copy of the catalogue
   The Hub then uses its own catalogue and its own glossary: no text,
   address or command from the frame is ever used. Back to the frame go only
   whether the glossary has the structure (and its domain's name) and the
   viewer's own place when you come back.
   ATLAS.mem is where you were (structure, camera, layers, card size), kept
   in memory only, so returning from a Hub tool puts you back there. */
const ATLAS = { cat: null, loading: null, byId: new Map(), mem: null, lastAct: 0 };
const ATLAS_FMA = /^FMA\d{1,7}$/, ATLAS_PIECE = /^FJ\d{1,7}M?$/;
const ATLAS_SYSTEMS = new Set(['skeletal', 'muscular', 'arterial', 'venous', 'nervous', 'digestive', 'respiratory', 'urinary', 'reproductive',
  'lymphatic', 'endocrine', 'integumentary', 'connective', 'sensory', 'cardiac']);
const ATLAS_VIEWS = ['three-quarter', 'front', 'side', 'back'];
const ATLAS_MEM_MS = 30 * 60000;
function atlasLoadCatalogue(){
  if(ATLAS.cat) return Promise.resolve(ATLAS.cat);
  if(!ATLAS.loading) ATLAS.loading = fetch('./atlas/hub-catalogue.json').then(r => r.ok ? r.json() : null).then(d => {
    const list = d && d.version === 1 && Array.isArray(d.structures) ? d.structures : [];
    const str = (v, max) => typeof v === 'string' && v.length <= max ? v : '';
    ATLAS.byId = new Map(list.filter(s => s && ATLAS_FMA.test(s.id) && str(s.en, 80) && str(s.about, 400)).map(s => [s.id, {
      id: s.id, en: s.en, es: str(s.es, 80), enAlt: (Array.isArray(s.enAlt) ? s.enAlt : []).map(a => str(a, 80)).filter(Boolean),
      about: s.about, esNote: str(s.esNote, 300), glossaryTermId: str(s.glossaryTermId, 80) || null }]));
    ATLAS.cat = ATLAS.byId.size ? d : null;
    return ATLAS.cat;
  }).catch(() => null).finally(() => { ATLAS.loading = null; });
  return ATLAS.loading;
}
// The glossary entry for a structure: the one the catalogue names, else an
// exact name match (English, or an everyday name the catalogue lists, as
// Term Review compares: accents, capitals and a leading article aside; an
// entry's "A / B" and "A (note)" parts count). Never a partial match.
function atlasGlossaryMatch(s){
  if(s.glossaryTermId){ const x = askTermById(s.glossaryTermId); if(x) return x; }
  const want = new Set([s.en, ...s.enAlt].map(rvLoose).filter(Boolean)), hits = [];
  (DATA.categories || []).forEach(cat => (cat.terms || []).forEach(term => {
    const names = String(term.en || '').split(/\s*[\/;|]\s*/).flatMap(p => { const m = p.match(/^(.*?)\s*\(([^)]+)\)\s*$/); return m ? [m[1], p] : [p]; });
    if(names.some(n => want.has(rvLoose(n)))) hits.push({ cat, term });
  }));
  return hits.find(h => h.term.es) || hits[0] || null;
}
function atlasFrame(){ const f = document.querySelector('#anatLayer iframe'); return f ? f.contentWindow : null; }
// '*': a sandboxed frame has no origin of its own to name. Nothing private
// goes this way (see above), and only that frame's window is posted to.
function atlasPost(msg){ const w = atlasFrame(); if(w) w.postMessage({ source: 'hub', v: 1, ...msg }, '*'); }
function atlasReadView(v){
  if(!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const p = v.pick, kind = p && p.kind, id = p && String(p.id);
  if(!(kind === 'part' && ATLAS_PIECE.test(id)) && !(kind === 'concept' && ATLAS_FMA.test(id))) return null;
  const vec = a => Array.isArray(a) && a.length === 3 && a.every(n => typeof n === 'number' && isFinite(n) && Math.abs(n) < 1000) ? a.slice() : null;
  const cp = v.cam && vec(v.cam.p), ct = v.cam && vec(v.cam.t);
  return { pick: { kind, id }, cam: cp && ct ? { p: cp, t: ct } : null,
    explode: typeof v.explode === 'number' && v.explode >= 0 && v.explode <= 1 ? v.explode : 0,
    visible: (Array.isArray(v.visible) ? v.visible : []).filter(x => ATLAS_SYSTEMS.has(x)).slice(0, ATLAS_SYSTEMS.size),
    isolate: v.isolate === true, view: ATLAS_VIEWS.includes(v.view) ? v.view : 'three-quarter', expanded: v.expanded === true };
}
async function atlasSendGlossary(id, tries){
  await atlasLoadCatalogue();
  const s = ATLAS.byId.get(id);
  if(!s || activeCategory !== 'anatomy') return;
  // The glossary paints from this phone's copy at startup; if it isn't there yet, say "checking" and look again.
  if(!(DATA.categories || []).length){
    atlasPost({ type: 'glossary', id, state: 'checking', domain: '' });
    if((tries || 0) < 6) setTimeout(() => atlasSendGlossary(id, (tries || 0) + 1), 1500);
    return;
  }
  const m = atlasGlossaryMatch(s);
  atlasPost({ type: 'glossary', id, state: !m ? 'none' : m.term.es ? 'match' : 'nospanish', domain: m ? String(m.cat.name || '').slice(0, 60) : '' });
}
function atlasOnMessage(e){
  const w = atlasFrame();
  if(!w || e.source !== w || e.origin !== 'null' || activeCategory !== 'anatomy') return;
  const d = e.data;
  if(!d || typeof d !== 'object' || Array.isArray(d) || d.source !== 'hub-atlas' || d.v !== 1 || Object.keys(d).length > 7) return;
  if(d.type === 'ready') return atlasReady();
  if(d.type === 'card'){ if(typeof d.id === 'string' && ATLAS_FMA.test(d.id)) atlasSendGlossary(d.id); return; }
  if(d.type === 'action') return atlasAction(d);
}
window.addEventListener('message', atlasOnMessage);
// The viewer is listening: the card list, and your place if you're coming back.
function atlasReady(){
  atlasLoadCatalogue();
  const mem = ATLAS.mem;
  ATLAS.mem = null;
  if(mem && Date.now() - mem.at < ATLAS_MEM_MS) atlasPost({ type: 'restore', view: mem.view });
}
const ATLAS_ACTIONS = ['glossary', 'practice', 'ask', 'pronounce'];
async function atlasAction(d){
  if(!ATLAS_ACTIONS.includes(d.action) || typeof d.id !== 'string' || !ATLAS_FMA.test(d.id)) return;
  await atlasLoadCatalogue();
  const s = ATLAS.byId.get(d.id);
  if(!s || activeCategory !== 'anatomy') return;            // only structures in the Hub's own list
  if(d.action === 'pronounce'){
    if(d.lang !== 'en' && d.lang !== 'es') return;
    const text = d.lang === 'es' ? s.es : s.en;
    if(text) speakText(null, text, d.lang === 'es' ? 'es-US' : 'en-US');
    return;
  }
  // One tap, one action (a double tap doesn't open two screens).
  if(Date.now() - ATLAS.lastAct < 700) return;
  ATLAS.lastAct = Date.now();
  const view = atlasReadView(d.view), m = atlasGlossaryMatch(s);
  const keep = () => { ATLAS.mem = view ? { view, at: Date.now() } : null; };
  if(d.action === 'glossary'){
    if(!m){ showToast(`“${s.en}” isn’t in the Hub glossary yet.`); return; }
    keep(); revealTerm(m.cat.id, m.term.id);
  }else if(d.action === 'practice'){
    if(!m || !m.term.es){ showToast(m ? 'That glossary entry has no Spanish yet.' : `“${s.en}” isn’t in the Hub glossary yet.`); return; }
    if(!whoAmI()){ showToast('Set your name first: your review record is kept under it.'); return; }
    // Practising one term replaces a paused session's place (its saved answers stay in your record).
    const paused = (reviewActive && reviewIndex < reviewQueue.length) || reviewStored();
    if(paused && !confirm(`You have a Term Review session in progress. Practise “${m.term.en}” instead? Your place in that session will be let go; answers you already saved stay in your record.`)) return;
    keep(); reviewStartWith([m.term.id], null, '3D Body');
  }else if(d.action === 'ask'){
    keep(); atlasAsk(s, m);
  }
}
// Ask Dr. Smiley about the structure: its checked card goes with the question.
function atlasAsk(s, m){
  ASK.anatomy = { id: s.id, withTerm: !!m };
  ASK.selected = m ? { cat: m.cat.id, term: m.term.id } : null;
  ASK.draft = `Explain the ${s.en.toLowerCase()}.`;
  ASK.view = 'chat';
  setCategory('ask');
  const input = document.getElementById('askInput');
  if(input){ input.value = ASK.draft; if(prefersAutoFocus()) input.focus(); }
}
function atlasEntry(id){
  const s = ATLAS.byId.get(id);
  return s ? { id: 'an:' + s.id, type: '3D Body structure (checked Hub card)', en: s.en, es: s.es, definition: s.about, notes: s.esNote } : null;
}
