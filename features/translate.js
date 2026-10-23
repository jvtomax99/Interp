/* The Translate tool (renderTranslate, runTranslate and the rest of the
   section below): moved verbatim out of index.html on 2026-10-22
   (docs/split-index.md, phase 3, the first feature). Loaded by a plain
   <script src> just before index.html's own script. Nothing here runs as
   the page loads (only declarations), so the names it uses from
   index.html (DATA, escapeHtml, the ICON_* strings, renderContent...) are
   read when a function is called, by which time they exist; and
   index.html reaches these by name as before. Keep it that way: a
   top-level statement here that calls into index.html would run before
   index.html has. */

/* ============ Translate lookup ============
   Deliberately checks the team's own glossary before reaching for machine
   translation. For terms like "Duffy-null associated neutrophil count", a
   colleague-verified entry is far more trustworthy than generic MT — that
   gap is the whole reason this glossary exists. MT is offered only as a
   fallback, and clearly labelled as unverified. */
const TR_LANGS = [
  { code:'en', name:'English' },
  { code:'es', name:'Spanish' },
  { code:'ar', name:'Arabic' },
  { code:'fr', name:'French' },
  { code:'pt', name:'Portuguese' },
  { code:'zh', name:'Chinese' },
  { code:'ko', name:'Korean' },
  { code:'it', name:'Italian' },
  { code:'pl', name:'Polish' },
  { code:'hi', name:'Hindi' },
  { code:'ru', name:'Russian' },
  { code:'tl', name:'Tagalog' }
];
let trFrom = 'en';
let trTo = 'es';
let trQuery = '';
let trContext = '';

function renderTranslate(){
  let html = `<div class="section-head"><h2>Translate</h2><span class="sub">glossary first</span></div>`;
  html += `<div class="tr-panel">`;
  html += `<details class="tool-note">
    <summary>${ICON_SHIELD}<span>Reference aid, not for patient use</span><em>More</em></summary>
    <p>For building and studying the glossary. Machine translation is not a substitute for a
       qualified interpreter and should not be used to communicate with a patient.</p>
  </details>`;

  html += `
    <div class="tr-box">
      <div class="tr-langs tr-row">
        <select id="trFrom" onchange="trFrom=this.value" aria-label="Translate from">
          ${TR_LANGS.map(l=>`<option value="${l.code}" ${l.code===trFrom?'selected':''}>${l.name}</option>`).join('')}
        </select>
        <button class="tr-swap" title="Swap languages" aria-label="Swap languages" onclick="swapTrLangs()">${ICON_SWAP}</button>
        <select id="trTo" onchange="trTo=this.value" aria-label="Translate into">
          ${TR_LANGS.map(l=>`<option value="${l.code}" ${l.code===trTo?'selected':''}>${l.name}</option>`).join('')}
        </select>
      </div>
      <div class="tr-ask tr-row">
        <input id="trInput" type="text" placeholder="A word or phrase\u2026" value="${escapeAttr(trQuery)}"
               onkeydown="if(event.key==='Enter'){event.preventDefault();runTranslate();}">
        <button class="btn btn-primary tr-go" onclick="runTranslate()">Translate</button>
      </div>
      <details class="tr-more"${trContext ? ' open' : ''}>
        <summary><span>Add the sentence</span><em>more accurate</em></summary>
        <div class="tr-row">
          <input id="trContext" type="text" placeholder="The full sentence it appeared in\u2026"
                 value="${escapeAttr(trContext)}"
                 onkeydown="if(event.key==='Enter'){event.preventDefault();runTranslate();}">
        </div>
        <p class="tr-note">Single words are the hardest case for any translation engine.
          \u201cDischarge\u201d alone could be a hospital discharge or a bodily one \u2014 the
          sentence tells it which.</p>
      </details>
    </div>
    <div id="trResults">${trQuery ? '' : `
      <ol class="tr-how">
        <li><b>Your glossary first</b><span>If the team has already agreed a term, that is the answer.</span></li>
        <li><b>Then the AI</b><span>With the sentence for context, and a note on why it chose that wording.</span></li>
        <li><b>Machine translation last</b><span>Marked as such, so you know what you are looking at.</span></li>
      </ol>`}</div>
  `;
  html += `</div>`;
  return html;
}

function swapTrLangs(){
  const a = trFrom; trFrom = trTo; trTo = a;
  const q = document.getElementById('trInput');
  const ctx = document.getElementById('trContext');
  trQuery = q ? q.value : trQuery;
  trContext = ctx ? ctx.value : trContext;
  renderContent();
}

// Looks for the term in the team's own glossary, matching either direction.
function searchGlossary(query){
  const q = query.trim().toLowerCase();
  if(!q) return [];
  const hits = [];
  DATA.categories.forEach(cat=>{
    cat.terms.forEach((t, idx)=>{
      const en = (t.en||'').toLowerCase();
      const es = (t.es||'').toLowerCase();
      const exact = en === q || es === q;
      const partial = en.includes(q) || es.includes(q);
      if(exact || partial) hits.push({ t, cat, idx, exact });
    });
  });
  hits.sort((a,b)=> (b.exact - a.exact) || collateTerms(a.t.en, b.t.en));
  return hits.slice(0, 5);
}

// Calls the AI terminology endpoint. Returns null if it isn't set up, so the
// app falls back to the free translation path rather than breaking.
let aiAvailable = null;   // null = untested, false = unavailable this session

async function aiTranslate(text, context, from, to){
  if(aiAvailable === false) return null;
  try{
    const res = await fetch('/api/translate', {
      method:'POST',
      headers:{'Content-Type':'application/json', ...(await hubAuthHeaders()) },
      body: JSON.stringify({ text, context, from, to })
    });
    if(res.status === 503 || res.status === 404){
      aiAvailable = false;   // not configured — stop retrying this session
      return null;
    }
    if(!res.ok) return null;
    const data = await res.json();
    if(data && data.error) return null;
    aiAvailable = true;
    return data;
  }catch(err){
    aiAvailable = false;
    return null;
  }
}

// Single shared call so the forward and reverse translations use identical logic.
async function mtTranslate(text, from, to){
  try{
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
    const data = await res.json();
    const out = data && data.responseData && data.responseData.translatedText;
    if(!out || /INVALID|QUERY LENGTH|MYMEMORY WARNING|NO QUERY/i.test(out)) return null;
    return out;
  }catch(err){
    return null;
  }
}

const normalizeForCompare = s => (s||'').toLowerCase().replace(/[^\p{L}\p{N} ]/gu,'').trim();

async function runTranslate(){
  const input = document.getElementById('trInput');
  const ctxEl = document.getElementById('trContext');
  const out = document.getElementById('trResults');
  if(!input || !out) return;
  const q = input.value.trim();
  const ctx = ctxEl ? ctxEl.value.trim() : '';
  trQuery = q; trContext = ctx;
  if(!q){ out.innerHTML = ''; return; }

  // With context supplied, translate the sentence — engines disambiguate far
  // better with surrounding words than with a bare term.
  const toTranslate = ctx || q;
  const gtUrl = `https://translate.google.com/?sl=${trFrom}&tl=${trTo}&text=${encodeURIComponent(toTranslate)}&op=translate`;

  let html = '';

  // 1. False-friend warnings come first — these are the errors that cause harm.
  const traps = findFalseFriends(q).concat(ctx ? findFalseFriends(ctx) : []);
  const seenTraps = new Set();
  traps.forEach(f=>{
    if(seenTraps.has(f.es)) return;
    seenTraps.add(f.es);
    html += `
      <div class="tr-result trap">
        <span class="tr-badge trap">${ICON_ALERT} False friend — check carefully</span>
        <p class="tr-target" style="font-size:18px;">${escapeHtml(f.es)}</p>
        <p class="tr-note"><b>Often mistaken for:</b> ${escapeHtml(f.looks)}<br>
        <b>Actually means:</b> ${escapeHtml(f.means)}</p>
        <p class="tr-note">${escapeHtml(f.note)}</p>
      </div>`;
  });

  // 2. The team's verified glossary.
  const hits = searchGlossary(q);
  hits.forEach(h=>{
    const isEnQuery = (h.t.en||'').toLowerCase().includes(q.toLowerCase());
    const primary = isEnQuery ? (h.t.es || h.t.en) : (h.t.en || h.t.es);
    const secondary = isEnQuery ? h.t.en : h.t.es;
    html += `
      <div class="tr-result verified">
        <span class="tr-badge verified">${ICON_CHECK} Your team's glossary</span>
        <p class="tr-source">${escapeHtml(secondary || '')}</p>
        <p class="tr-target">${escapeHtml(primary || '')}</p>
        ${h.t.def ? `<p class="tr-note">${escapeHtml(h.t.def)}</p>` : ''}
        <div class="tr-actions">
          <button class="tr-mini" onclick="setCategory('${h.cat.id}')">Open in ${escapeHtml(h.cat.name.split(',')[0])}</button>
          ${primary ? `<button class="tr-mini" onclick="copyText(this, ${JSON.stringify(primary).replace(/"/g,'&quot;')})">${ICON_COPY} Copy</button>` : ''}
        </div>
      </div>`;
  });

  if(!hits.length){
    html += `<div class="tr-result"><p class="tr-note">Not in your team's glossary yet — a good candidate to add.</p></div>`;
  }

  out.innerHTML = html + `<div class="tr-result"><span class="tr-badge ai">${ICON_SPARK} Looking up…</span><p class="tr-target"><span class="tr-spinner"></span></p></div>`;

  // 3. AI terminology breakdown, if the endpoint is configured.
  const ai = await aiTranslate(q, ctx, trFrom, trTo);
  if(ai && (ai.primary || ai.notes)){
    html += `
      <div class="tr-result ai">
        <span class="tr-badge ai">${ICON_SPARK} Interpreter reference — AI assisted</span>
        <p class="tr-source">${escapeHtml(toTranslate)}</p>
        <p class="tr-target">${escapeHtml(ai.primary || '')}</p>
        ${ai.plain ? `<p class="tr-note"><b>Plain language:</b> ${escapeHtml(ai.plain)}</p>` : ''}
        ${ai.register ? `<p class="tr-note"><b>Register:</b> ${escapeHtml(ai.register)}</p>` : ''}
        ${ai.regional ? `<p class="tr-note"><b>Regional:</b> ${escapeHtml(ai.regional)}</p>` : ''}
        ${ai.caution ? `<p class="tr-note tr-caution"><b>Caution:</b> ${escapeHtml(ai.caution)}</p>` : ''}
        ${ai.notes ? `<p class="tr-note">${escapeHtml(ai.notes)}</p>` : ''}
        <div class="tr-actions">
          ${ai.primary ? `<button class="tr-mini" onclick="copyText(this, ${JSON.stringify(ai.primary).replace(/"/g,'&quot;')})">${ICON_COPY} Copy</button>` : ''}
          <button class="tr-mini" onclick="addTermFromTranslate(${JSON.stringify(q).replace(/"/g,'&quot;')}, ${JSON.stringify((ai.primary)||'').replace(/"/g,'&quot;')})">+ Add to glossary</button>
        </div>
        <p class="tr-note" style="margin-top:10px;opacity:.75;">AI-generated reference. Verify before adding to the glossary.</p>
      </div>`;
    out.innerHTML = html + `<div class="tr-result"><span class="tr-badge machine">${ICON_GLOBE} Machine translation</span><p class="tr-target"><span class="tr-spinner"></span></p></div>`;
  }

  // 4. Machine translation, then a back-translation as a sanity check.
  const mt = await mtTranslate(toTranslate, trFrom, trTo);
  let back = null, drift = false;
  if(mt){
    back = await mtTranslate(mt, trTo, trFrom);
    if(back) drift = normalizeForCompare(back) !== normalizeForCompare(toTranslate);
  }

  html += `
    <div class="tr-result">
      <span class="tr-badge machine">${ICON_GLOBE} Machine translation — unverified</span>
      ${mt
        ? `<p class="tr-source">${escapeHtml(toTranslate)}</p>
           <p class="tr-target">${escapeHtml(mt)}</p>
           ${back ? `<p class="tr-note"><b>Translated back:</b> "${escapeHtml(back)}"${
              drift
                ? ` — <span style="color:var(--danger);font-weight:600;">this differs from what you typed, so treat the translation with caution.</span>`
                : ` — round-trips cleanly, a reasonable sign it held its meaning.`
            }</p>` : ''}
           <p class="tr-note">Automatically generated. Confirm before relying on it, and consider adding a verified entry to the glossary.</p>`
        : `<p class="tr-note">Automatic translation isn’t available right now. Use Google Translate below.</p>`}
      <div class="tr-actions">
        <a class="tr-mini" href="${escapeAttr(gtUrl)}" target="_blank" rel="noopener">${ICON_EXTERNAL} Open in Google Translate</a>
        ${mt ? `<button class="tr-mini" onclick="copyText(this, ${JSON.stringify(mt).replace(/"/g,'&quot;')})">${ICON_COPY} Copy</button>` : ''}
        <button class="tr-mini" onclick="addTermFromTranslate(${JSON.stringify(q).replace(/"/g,'&quot;')}, ${JSON.stringify(mt||'').replace(/"/g,'&quot;')})">+ Add to glossary</button>
      </div>
    </div>`;

  out.innerHTML = html;
}

function addTermFromTranslate(en, es){
  openAddModal();
  const enEl = document.getElementById('fEn');
  const esEl = document.getElementById('fEs');
  if(trFrom === 'en'){
    if(enEl) enEl.value = en;
    if(esEl && trTo === 'es') esEl.value = es || '';
  }else{
    if(enEl) enEl.value = (trTo === 'en' ? (es || '') : '');
    if(esEl && trFrom === 'es') esEl.value = en;
  }
}
