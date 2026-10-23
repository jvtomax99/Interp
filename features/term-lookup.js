/* Looking a term up (openTermLookup, the trusted-source search and its
   three caches: the section below): moved verbatim out of index.html on
   2026-10-23 (docs/split-index.md, phase 3). Loaded by a plain <script src>
   just before index.html's own script. Nothing here runs as the page
   loads (only declarations); the names it uses from index.html (db, DATA,
   escapeHtml, hubAuthHeaders...) are read when a function runs. Keep it
   that way: a top-level line here that calls into index.html would run
   before index.html has. */

/* ---------- Looking a term up ----------

   Replaces two fixed MedlinePlus search addresses that were assembled by
   string concatenation. A hardcoded URL into someone else's site is a guess
   that can only get more wrong as they reorganise, and there is nothing in
   the app that would ever notice — which is how it came to open a blank page.

   A search runs at the moment of the tap instead, restricted server-side to
   patient-education and clinical sources, so every link offered came back
   from a result seconds earlier and the sense is judged against the term's
   own definition rather than its spelling.

   Three layers of cache, because this costs money per call and a glossary
   term is looked up by many interpreters:
     - memory, for tapping the same term twice in one sitting
     - Firestore, shared across the whole team and across devices
     - and nothing at all when offline, where the sheet says so plainly. */

const LOOKUP_CACHE_VERSION = 1;
// Links rot. Long enough that the team is not re-paying for the same term
// every week, short enough that a moved page gets found again within a term.
const LOOKUP_CACHE_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
const lookupMemoryCache = new Map();
let lookupRequestSeq = 0;

function lookupCacheKey(t){
  return `v${LOOKUP_CACHE_VERSION}__` + foldText(String(t.en || '')).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
}

async function getCachedTermLookup(key){
  if(lookupMemoryCache.has(key)) return lookupMemoryCache.get(key);
  if(!db || !key) return null;
  try{
    const snap = await db.collection('term-link-cache').doc(key).get();
    if(!snap.exists) return null;
    const data = snap.data();
    if(!data || !Array.isArray(data.sources)) return null;
    if(data.cachedAt && (Date.now() - data.cachedAt) > LOOKUP_CACHE_MAX_AGE_MS) return null;
    lookupMemoryCache.set(key, data);
    return data;
  }catch(err){
    console.error('getCachedTermLookup failed:', err);
    return null;
  }
}

async function saveCachedTermLookup(key, payload){
  lookupMemoryCache.set(key, payload);
  if(!db || !key) return;
  try{
    await db.collection('term-link-cache').doc(key).set(stripUndefined({
      sources: payload.sources, note: payload.note || '',
      cachedBy: whoAmI() || 'Someone', cachedAt: Date.now(),
    }));
  }catch(err){
    // The interpreter already has their answer on screen; a failed cache
    // write is not their problem.
    console.error('saveCachedTermLookup failed:', err);
  }
}

/* The same host list the lookup endpoint enforces, checked again here.
   That is not belt-and-braces for its own sake: results are cached in
   Firestore, and these rules are open to anyone who finds the project id, so
   a row read back from the cache is untrusted input no matter who wrote the
   original search. Anything not https and on this list is dropped rather
   than rendered as a link. */
const LOOKUP_TRUSTED_HOSTS = [
  'medlineplus.gov','nih.gov','nlm.nih.gov','cancer.gov','cdc.gov','niddk.nih.gov',
  'nhlbi.nih.gov','ninds.nih.gov','nei.nih.gov','fda.gov','mayoclinic.org',
  'clevelandclinic.org','hopkinsmedicine.org','stanfordchildrens.org','kidshealth.org',
  'healthychildren.org','familydoctor.org','heart.org','diabetes.org','cancer.org',
  'kidney.org','lung.org','arthritis.org','who.int','paho.org',
];

function lookupSafeUrl(raw){
  let parsed;
  try{ parsed = new URL(String(raw || '')); }catch(err){ return ''; }
  if(parsed.protocol !== 'https:') return '';
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const ok = LOOKUP_TRUSTED_HOSTS.some(site => host === site || host.endsWith('.' + site));
  return ok ? parsed.toString() : '';
}

/* A live search takes somewhere between a few seconds and half a minute, and
   most of that is out of our hands — the model searches, reads what came
   back, and sometimes searches again. What IS in our hands is whether the
   wait reads as work or as a hang. A spinner that never changes starts
   looking broken at about eight seconds; one that reports what is happening
   does not, and the last line admits when a term is taking unusually long
   rather than pretending everything is normal. */
const LOOKUP_STAGES = [
  [0,     'Searching trusted medical sources…'],
  [4500,  'Reading what came back…'],
  [10000, 'Choosing the best pages…'],
  [18000, 'Still going — an unusual term can take a moment.'],
];

function startLookupProgress(){
  const body = document.getElementById('termLookupBody');
  if(!body) return () => {};
  const paint = msg => {
    body.innerHTML = `
      <div class="lookup-loading">
        <span class="lookup-spinner" aria-hidden="true"></span>
        <span id="lookupStage">${escapeHtml(msg)}</span>
      </div>`;
  };
  paint(LOOKUP_STAGES[0][1]);
  const timers = LOOKUP_STAGES.slice(1).map(([at, msg]) => setTimeout(() => {
    const el = document.getElementById('lookupStage');
    if(el) el.textContent = msg;
  }, at));
  return () => timers.forEach(clearTimeout);
}

function closeTermLookup(){
  const ov = document.getElementById('termLookup');
  if(ov) ov.classList.remove('show');
}

async function openTermLookup(categoryId, termId){
  const cat = DATA.categories.find(c => c.id === categoryId);
  const term = cat && cat.terms.find(t => t.id === termId);
  if(!term) return;

  const ov = document.getElementById('termLookup');
  const body = document.getElementById('termLookupBody');
  if(!ov || !body) return;

  document.getElementById('termLookupTitle').textContent = term.en || 'Look up';
  document.getElementById('termLookupSub').textContent =
    [term.es, cat.name].filter(Boolean).join(' · ');
  ov.classList.add('show');

  /* Paint the loading state before anything that can block. The cache read
     goes to Firestore, and until it came back the panel still held the
     PREVIOUS term's results — so opening one term straight after another
     showed the old links under the new title for as long as that took. */
  const stopProgress = startLookupProgress();

  // Every open supersedes the one before it, so a slow search for a term the
  // interpreter has already moved on from cannot paint over a newer answer.
  const seq = ++lookupRequestSeq;
  const stale = () => { if(seq !== lookupRequestSeq){ stopProgress(); return true; } return false; };

  const key = lookupCacheKey(term);
  const cached = await getCachedTermLookup(key);
  if(stale()) return;
  if(cached){
    stopProgress();
    renderTermLookup(cached.sources, cached.note, term, true);
    return;
  }

  if(!navigator.onLine){
    stopProgress();
    renderTermLookupMessage(
      'You are offline',
      'Looking a term up needs a connection. The glossary itself works offline — this is the one part that cannot.',
      term);
    return;
  }

  try{
    const res = await fetch('/api/term-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await hubAuthHeaders()) },
      body: JSON.stringify({ term: { en: term.en, es: term.es, def: term.def, domain: cat.name } }),
    });
    if(stale()) return;

    if(!res.ok){
      stopProgress();
      renderTermLookupMessage(
        'Lookup is unavailable right now',
        res.status === 503
          ? 'The lookup service is not switched on for this deployment.'
          : 'The search could not be completed. This is usually temporary.',
        term);
      return;
    }

    const data = await res.json();
    if(stale()) return;
    stopProgress();
    const sources = Array.isArray(data.sources) ? data.sources : [];
    if(sources.length) saveCachedTermLookup(key, { sources, note: data.note || '' });
    renderTermLookup(sources, data.note || '', term, false);
  }catch(err){
    if(stale()) return;
    stopProgress();
    console.error('term lookup failed:', err);
    renderTermLookupMessage(
      'The search could not be completed',
      'This is usually temporary. The glossary entry itself is unaffected.',
      term);
  }
}

/* A search engine as the floor. It is not as good as the curated result, but
   it is never a dead link, and an interpreter mid-assignment needs somewhere
   to go rather than an apology. */
function lookupFallbackLink(term){
  const q = encodeURIComponent(`${term.en || ''} ${term.es || ''}`.trim() + ' medlineplus');
  return `<a class="lookup-fallback" href="https://duckduckgo.com/?q=${q}" target="_blank" rel="noopener">
            Search the web for this term ${ICON_EXTERNAL}</a>`;
}

function renderTermLookupMessage(title, detail, term){
  const body = document.getElementById('termLookupBody');
  if(!body) return;
  body.innerHTML = `
    <div class="lookup-empty">
      <div class="lookup-empty-title">${escapeHtml(title)}</div>
      <p>${escapeHtml(detail)}</p>
      ${lookupFallbackLink(term)}
    </div>`;
}

function renderTermLookup(rawSources, note, term, fromCache){
  const body = document.getElementById('termLookupBody');
  if(!body) return;
  // Drop anything that is not https on a trusted medical host. A list that
  // came back empty after filtering is "nothing found", not a blank sheet.
  const sources = (rawSources || [])
    .map(sc => ({ ...sc, url: lookupSafeUrl(sc && sc.url) }))
    .filter(sc => sc.url);
  if(!sources.length){
    renderTermLookupMessage(
      'Nothing solid came back',
      note || 'No trusted source had a clear page for this term. That happens with rare or institution-specific wording.',
      term);
    return;
  }
  const cards = sources.map(sc => `
    <a class="lookup-card" href="${escapeAttr(sc.url)}" target="_blank" rel="noopener">
      <span class="lookup-card-top">
        <span class="lookup-site">${escapeHtml(sc.site || '')}</span>
        ${sc.language === 'es' ? '<span class="lookup-lang">Español</span>' : ''}
      </span>
      <span class="lookup-card-title">${escapeHtml(sc.title || '')}</span>
      ${sc.why ? `<span class="lookup-why">${escapeHtml(sc.why)}</span>` : ''}
      <span class="lookup-go">${ICON_EXTERNAL}</span>
    </a>`).join('');

  body.innerHTML = `
    ${note ? `<p class="lookup-note">${escapeHtml(note)}</p>` : ''}
    <div class="lookup-grid">${cards}</div>
    <p class="lookup-foot">
      ${fromCache ? 'Saved from an earlier search by the team.' : 'Found just now.'}
      Reference reading for your own preparation — not a rendering, and not for showing a patient.
    </p>`;
}
