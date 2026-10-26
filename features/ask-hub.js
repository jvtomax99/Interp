/* Ask the Hub, with Dr. Smiley's side of it: following a conversation
   (ASK.convo), context and actions (ASK_ACTION_TYPES, ASK_RUN), what he
   remembers on this device (drMemGet, drMemSet), the memory screen
   (openMemory), your practice and the next step, and corrections,
   feedback and sources. Moved verbatim out of index.html on 2026-10-25
   (docs/split-index.md, phase 3; docs/features/ask-the-hub.md). Loaded by
   a plain <script src> just before index.html's own script. Nothing here
   runs as the page loads but declarations (ASK, ASK_RUN, DR_MEM_FIELDS
   and the word lists are plain values; ASK calls askConvoEmpty, which is
   in this file); the names it uses from index.html (db, hubAuth,
   activeCategory, setCategory...) are read when a function runs. A few
   lines stay in index.html, where this group began, because they run at
   load or answer events and reach into index.html: ASK_STOP (built with
   foldText), the questions left waiting brought back and resumed
   (askRestoreWaiting, hubAuthReady), the 'online' and 'resize'
   listeners, and window.openAskHub. Keep it that
   way: a top-level line here that calls into index.html would run before
   index.html has. */

/* ============ Ask the Hub ============
   The team's assistant. The phone picks the Hub entries that match a question
   (glossary, False Friends, Doctor Directory, providers, Code of Ethics, User
   Guide) plus any approved team notes, and api/ask.js asks Claude to answer
   from them. "Correct this" saves a suggestion to hub-lessons/ as pending;
   the owner approves it on the review view, and from then on it travels with
   every question it matches. That is the whole of the "learning": the
   model never changes, the team's notes do.

     hub-lessons/{id}  { question, headline, termIds, note, status,
                         suggestedBy, suggestedAt, reviewedBy, reviewedAt }
                       status: pending | approved | declined | retired

   No patient information: askLooksLikePatientInfo() stops a question that
   looks like it carries a name with a date of birth or a record number and
   asks first. */
const ASK_MAX_ENTRIES = 24;
const ASK_MAX_LESSONS = 6;

const ASK = { turns: [], busy: false, draft: '', view: 'chat', lessons: [], lessonsStarted: false, lessonsBlocked: false, phi: null, edits: {},
  from: 'home', selected: null,    // the screen Ask was opened from; a glossary term picked to talk about ({ cat, term })
  anatomy: null,                   // a 3D Body structure picked to talk about ({ id: 'FMA…', withTerm })
  convo: askConvoEmpty(), gen: 0 }; // this conversation's record (askConvoEmpty); gen counts new conversations
let askFaceSeq = 0;

// The Hub's smiley (the lock screen's face), with its own gradient ids so
// several copies can be on screen without any of them losing its colour.
function askFaceSvg(){
  const n = ++askFaceSeq;
  return smileyWear(ACCESS_FACE_SVG).replace(/(id="|#)af([A-Z]\w*)/g, (m, pre, name) => pre + 'ask' + name + n);
}

function askTokens(text){
  return foldText(String(text || '')).toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(w => w && (w.length >= 3 || /\d/.test(w)) && !ASK_STOP.has(w));
}

function stripTags(html){
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

// Everything the assistant may draw on, as small flat entries. Built per
// question: a couple of thousand short records, folded once and cached by
// foldText, is a few milliseconds.
function askCorpus(){
  const docs = [];
  const add = (entry, label, strong, weak, go) => docs.push({ entry, label, strong: strong.filter(Boolean).join(' • '), weak: weak.filter(Boolean).join(' • '), go });
  (DATA && DATA.categories || []).forEach(c => (c.terms || []).forEach(t => {
    if(!t.en && !t.es) return;
    add({ id: 't:' + t.id, type: 'Glossary term', domain: c.name, en: t.en || '', es: t.es || '', definition: t.def || '', notes: t.notes || '' },
      `Glossary · ${t.en || t.es}`, [t.en, t.es], [t.def, t.notes, c.name], { cat: c.id, term: t.id });
  }));
  (typeof FALSE_FRIENDS !== 'undefined' ? FALSE_FRIENDS : []).forEach((f, i) => add(
    { id: 'ff:' + i, type: 'False friend', spanish: f.es, looksLike: f.looks, means: f.means, sayInstead: f.say, note: f.note },
    `False Friends · ${f.es}`, [f.es, f.looks], [f.means, f.say, f.note, f.heard], { cat: 'falsefriends' }));
  (DOCTOR_DIRECTORY || []).forEach(d => add(
    { id: 'dr:' + d.id, type: 'Doctor Directory', name: d.name, specialty: d.specialty, location: d.hospitalLocation, locationDetails: d.locationDetails, notes: doctorTipsText(d) },
    `Doctor Directory · ${d.name}`, [d.name], [d.specialty, d.hospitalLocation, d.locationDetails, doctorTipsText(d)], { cat: 'doctor-directory' }));
  (PROVIDERS || []).forEach(p => add(
    { id: 'pv:' + p.id, type: 'Healthcare provider', name: p.name, role: p.role, facility: [p.facility, p.unit].filter(Boolean).join(' · '), notes: p.notes },
    `Provider Pictures · ${p.name}`, [p.name], [p.role, p.facility, p.unit, p.notes], { cat: 'providers' }));
  (typeof ETHICS_CONTENT !== 'undefined' ? ETHICS_CONTENT : []).forEach(e => add(
    { id: 'eth:' + e.id, type: 'Code of Ethics', title: e.title, summary: stripTags(e.summary), inPractice: stripTags(e.practice), source: e.org },
    `Code of Ethics · ${e.title}`, [e.title], [stripTags(e.summary), stripTags(e.practice), e.tag], { cat: 'ethics' }));
  (typeof GUIDE_TOPICS !== 'undefined' ? GUIDE_TOPICS : []).forEach(g => add(
    { id: 'g:' + g.id, type: 'User Guide', question: stripTags(g.q), answer: stripTags(g.a) },
    `User Guide · ${stripTags(g.q)}`, [stripTags(g.q), g.k], [stripTags(g.a)], { guide: g.id }));
  // The 3D Body's checked cards, once the 3D Body has been opened.
  ATLAS.byId.forEach(st => add(atlasEntry(st.id), `3D Body · ${st.en}`, [st.en, st.es, ...st.enAlt], [st.about, st.esNote], { cat: 'anatomy' }));
  return docs;
}

// Picks the entries worth sending: a word in a term's own name counts most,
// the whole term appearing in the question counts more, a word in a
// definition counts a little.
function askRetrieve(question){
  const tokens = [...new Set(askTokens(question))];
  const folded = foldText(question).toLowerCase();
  const docs = askCorpus();
  const scored = [];
  const whole = tokens.map(tok => ({ tok, re: new RegExp('(^|[^a-z0-9])' + tok + '([^a-z0-9]|$)') }));
  for(const d of docs){
    const strong = foldText(d.strong).toLowerCase();
    const weak = foldText(d.weak).toLowerCase();
    let score = 0;
    for(const { tok, re } of whole){
      if(re.test(strong)) score += 4;
      else if(strong.includes(tok)) score += 2;
      else if(weak.includes(tok)) score += 1;
    }
    for(const name of d.strong.split(' • ')){
      const n = foldText(name).toLowerCase().trim();
      if(n.length >= 4 && folded.includes(n)) score += 10;
    }
    if(score >= 2) scored.push({ d, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const picked = scored.slice(0, ASK_MAX_ENTRIES).map(s => s.d);
  const pickedIds = new Set(picked.map(d => d.entry.id));
  const lessons = ASK.lessons.filter(l => l.status === 'approved').map(l => {
    let s = (l.termIds || []).some(id => pickedIds.has(id)) ? 5 : 0;
    const lt = new Set(askTokens(l.question + ' ' + (l.headline || '')));
    s += tokens.filter(t => lt.has(t)).length * 2;
    return { l, s };
  }).filter(x => x.s >= 4).sort((a, b) => b.s - a.s).slice(0, ASK_MAX_LESSONS).map(x => x.l);
  return { picked, lessons, top: scored.slice(0, 5) };
}

function askLooksLikePatientInfo(q){
  const s = String(q || '');
  return /\b(mrn|dob|d\.o\.b|date of birth|fecha de nacimiento|social security|ssn|medical record|record number|n[uú]mero de expediente)\b/i.test(s)
    || /\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b/.test(s)
    || /\b\d{6,}\b/.test(s)
    || /\b(patient|paciente)\s+(named|called|llamad[oa]|se llama)\b/i.test(s)
    || (/\b(mr|mrs|ms|miss|sr|sra|srta)\.?\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/.test(s) && /\b(patient|paciente|room|cuarto|bed|cama|chart)\b/i.test(s));
}

function startAskLessons(){
  if(ASK.lessonsStarted || !db) return;
  ASK.lessonsStarted = true;
  hubAuthReady.then(() => {
    db.collection('hub-lessons').onSnapshot(snap => {
      ASK.lessonsBlocked = false;
      ASK.lessons = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if(activeCategory === 'ask') refreshAskChrome();
      if(activeCategory === 'team-access') renderContent();
    }, err => {
      ASK.lessonsBlocked = err && err.code === 'permission-denied';
      ASK.lessonsStarted = false;
    });
  });
}
function askPendingLessons(){ return ASK.lessons.filter(l => l.status === 'pending'); }
function askOwnerFirst(){ return accessOwnerFirst() || 'the team lead'; }

/* ---- Rendering ---- */
function renderAsk(){
  startAskLessons();
  if(ASK.view === 'review' && isHubOwner()) return renderAskReview();
  ASK.view = 'chat';
  return `
    <div class="ask-head">
      <div class="ask-head-text"><h1>Ask the Hub</h1>
        <p>Answers from our glossary, False Friends, Doctor Directory, Code of Ethics and guide.</p>
</div>
      <span class="ask-face" id="askFace" aria-hidden="true">${askFaceSvg()}</span>
      <div class="ask-head-acts"><button type="button" class="ask-mem-link" onclick="openMemory()">What I remember${(n => n ? ` · ${n}` : '')(Object.keys(drMemGet()).length)}</button>
        <button type="button" class="ask-mem-link ask-new" id="askNew" onclick="askNewConversation()"${askHasConversation() ? '' : ' hidden'}>${ICON_ASK_NEW}New conversation</button></div>
    </div>
    <div id="askChrome">${askChromeHtml()}</div>
    <div class="hipaa-notice-inline">${ICON_SHIELD}<span>No patient names, dates of birth or record numbers here.</span></div>
    <div class="chat-panel ask-panel">
      <div class="chat-messages ask-messages" id="askMessages" aria-live="polite">${askMessagesHtml()}</div>
      <div class="chat-input-wrap">${askContextChipHtml()}${askConvoHtml()}<div class="chat-input-row">
        <label for="askInput" class="sr-only">Ask a question</label>
        <input id="askInput" type="text" enterkeyhint="send" autocomplete="off" maxlength="500"
          placeholder="Ask about a term or a doctor" value="${escapeAttr(ASK.draft)}"
          onfocus="askAttend(true)" onblur="askAttend(false)"
          oninput="ASK.draft=this.value; askTyping()" onkeydown="if(event.key==='Enter'){event.preventDefault(); submitAsk();}">
        ${askSendBtnHtml()}
      </div></div>
    </div>`;
}

function askChromeHtml(){
  if(!isHubOwner()) return '';
  const n = askPendingLessons().length;
  return n ? `<button type="button" class="ask-review-pill" onclick="ASK.view='review'; renderContent()">${n} ${n === 1 ? 'lesson' : 'lessons'} to review →</button>` : '';
}
function refreshAskChrome(){
  if(ASK.view === 'review'){ renderContent(); return; }
  const el = document.getElementById('askChrome');
  if(el) el.innerHTML = askChromeHtml();
}

function askMessagesHtml(){
  if(!ASK.turns.length && !ASK.phi){
    const ex = ['How do I explain “ejection fraction”?', '“Embarazada” or “embarrassed”?'];
    return `<div class="ask-hello">
      <span class="ask-face" aria-hidden="true">${askFaceSvg()}</span>
      ${ASK.fresh ? `<p class="ask-hello-title">New conversation. What do you need?</p>
      <p>What you asked me to remember still applies.</p>` : `<p class="ask-hello-title">Hi${whoAmI() ? ' ' + escapeHtml(whoAmI().split(/\s+/)[0]) : ''}! What do you need?</p>
      <p>I'm Dr. Smiley, your interpreter assistant. I answer from the Hub and can open your briefings and practice.</p>`}
      ${askNextHtml()}
      <div class="ask-chips"><button type="button" class="ask-chip prep-chip" onclick="openPrep()">${ICON_PREP}Prep me for an appointment</button>${(st => st ? `<button type="button" class="ask-chip" onclick="submitAsk(${escapeAttr(JSON.stringify(`Explain the ${st.en.toLowerCase()}.`))})">Explain the ${escapeHtml(st.en.toLowerCase())}</button>` : askSelectedTerm() ? `<button type="button" class="ask-chip" onclick="submitAsk('Explain this term.')">Explain ${escapeHtml(askSelectedTerm().term.en)}</button>` : '')(ASK.anatomy && ATLAS.byId.get(ASK.anatomy.id))}<button type="button" class="ask-chip" onclick="submitAsk('Help me practice five terms I’m still learning.')">Practice 5 terms I’m still learning</button>${ex.map(q => `<button type="button" class="ask-chip" onclick="submitAsk(${escapeAttr(JSON.stringify(q))})">${escapeHtml(q)}</button>`).join('')}</div>
    </div>`;
  }
  return ASK.turns.map(askTurnHtml).join('') + (ASK.phi ? `
    <div class="ask-card ask-warn" role="alert">
      <p class="ask-headline">Check for patient details first</p>
      <p class="ask-details">This question looks like it may include a patient's name, date of birth or record number. Ask about the term or situation without them.</p>
      <div class="ask-acts"><button type="button" onclick="askEditPhi()">Edit my question</button><button type="button" onclick="askSendAnyway()">It's fine, ask</button></div>
    </div>` : '');
}

// The little marks on state cards and the footer.
const ASK_ICO = {
  stop: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2.5" fill="currentColor"/></svg>',
  off: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 3l18 18M8.5 8.6A5.5 5.5 0 0 0 6 13.2 4 4 0 0 0 7 21h10.5M11 6.2A5.5 5.5 0 0 1 17.6 10 4 4 0 0 1 20.5 17" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
  fail: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3.5 2.8 19.5h18.4Z" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M12 10v4.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1.2" fill="currentColor"/></svg>',
  no: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.9"/><path d="M6.2 17.8 17.8 6.2" stroke="currentColor" stroke-width="1.9"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 11v9H4.5V11ZM7 11l4-7c1.6 0 2.5 1.2 2.1 2.8L12.6 10h5.2a2 2 0 0 1 2 2.4l-1.3 6A2 2 0 0 1 16.5 20H7" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
};
// A state card's first line: what happened, with its mark.
const askStateLine = (ico, text) => `<p class="ask-state">${ASK_ICO[ico]}<span>${text}</span></p>`;
function askTurnHtml(t){
  if(t.hidden) return '';
  const q = `<div class="ask-q" data-k="${t.id}:q">${escapeHtml(t.qLabel || t.q)}</div>`;
  const k = `data-k="${t.id}:${t.status}"`;
  if(t.status === 'loading') return q + `<div class="ask-wait" ${k}><span class="ask-dots" role="status" aria-label="Looking it up"><span></span><span></span><span></span></span>
    <span class="ask-wait-l" aria-hidden="true">Looking it up in the Hub…</span>
    <button type="button" class="ask-stop" onclick="askCancel()">${ICON_ASK_STOP}Stop</button></div>`;
  // Each way it can go wrong says what happened and offers the next step.
  if(t.status === 'cancelled') return q + `
    <div class="ask-card is-stopped" ${k}>
      ${askStateLine('stop', 'Stopped')}
      <p class="ask-details">${escapeHtml(t.note || 'Stopped. Ask again whenever you like.')}</p>
      <div class="ask-acts"><button type="button" onclick="askEdit('${t.id}')">Edit question</button><button type="button" onclick="askRetry('${t.id}')">Ask again</button></div>
    </div>`;
  if(t.status === 'waiting') return q + `
    <div class="ask-card ask-warn is-offline" role="status" ${k}>
      ${askStateLine('off', 'Waiting for a connection')}
      <p class="ask-details">You're offline. I'll ask as soon as you're back online.</p>
      <div class="ask-acts"><button type="button" onclick="askDontWait('${t.id}')">Don't ask</button><button type="button" onclick="askRetry('${t.id}')">Try now</button></div>
    </div>`;
  if(t.status === 'refused') return q + `
    <div class="ask-card ask-warn is-refused" ${k}>
      ${askStateLine('no', 'I can’t answer that one')}
      <p class="ask-details">I can't help with that one. Try asking it a different way.</p>
      ${askActionsHtml(t)}
      <div class="ask-acts"><button type="button" class="is-go" onclick="askEdit('${t.id}')">Ask it another way</button></div>
    </div>`;
  if(t.status === 'error') return q + `
    <div class="ask-card ask-warn is-failed" role="alert" ${k}>
      ${askStateLine('fail', 'Couldn’t get an answer')}
      <p class="ask-details">${escapeHtml(t.error)}</p>
      ${askActionsHtml(t)}
      <div class="ask-acts"><button type="button" class="is-go" onclick="askRetry('${t.id}')">Try again</button></div>
    </div>`;
  const a = t.answer;
  const notes = (a.lessonIds || []).map(id => ASK.lessons.find(l => l.id === id)).filter(Boolean);
  const sources = (a.sourceIds || []).map(id => t.labels[id] ? { id, label: t.labels[id] } : null).filter(Boolean);
  const canAdd = !a.local && !a.fromHub && a.suggestTerm && a.suggestTerm.en;
  const lay = askLayout(t);
  const sayEs = /spanish|español|espanol/i.test(a.sayLabel || '');
  const tag = a.convo || a.clarify ? '' : a.mem ? `<span class="ask-tag is-local">On this device</span>` : a.local ? `<span class="ask-tag is-local">On this phone · offline</span>`
    : a.usedCorrection ? `<span class="ask-tag is-off is-user">Your correction · not checked</span>` : `<span class="ask-tag ${a.fromHub ? '' : 'is-off'}">${a.fromHub ? 'From the Hub' : 'Not from the Hub'}</span>`;
  return q + `
    <div class="ask-card ask-a${lay ? ' has-lay is-' + lay.kind : ''}" id="ask-${t.id}" ${k} role="article" aria-label="Dr. Smiley’s answer">
      <div class="ask-by"><span class="ask-by-name">Dr. Smiley</span>${tag}</div>
      <p class="ask-headline">${escapeHtml(a.headline)}</p>
      ${lay ? askLayoutSafe(lay, t) : ''}
      ${a.say ? `<div class="ask-sayblock"><p class="ask-lab">${escapeHtml(a.sayLabel || 'Say')}</p><p class="ask-say"${sayEs ? ' lang="es"' : ''}>${escapeHtml(a.say)}</p></div>` : ''}
      ${notes.map(n => `<div class="ask-note"><p class="ask-lab">Team note</p><p>${escapeHtml(n.note)}</p>
        <small>${n.suggestedBy ? 'Suggested by ' + escapeHtml(n.suggestedBy) + ' · ' : ''}approved by ${escapeHtml(n.reviewedBy || askOwnerFirst())}</small></div>`).join('')}
      ${a.details ? `<p class="ask-details">${escapeHtml(a.details)}</p>` : ''}
      ${a.usedCorrection ? `<p class="ask-details ask-check">This uses your correction. It isn’t team knowledge until ${escapeHtml(askOwnerFirst())} approves it.</p>`
        : a.fromHub || a.local || a.clarify || askHandoff(t) ? '' : `<p class="ask-details ask-check">This came from general knowledge, not the Hub. Double-check it.</p>`}
      ${askSourceLineHtml(t)}
      ${askActionsHtml(t)}
      ${sources.length ? `<div class="ask-src" role="group" aria-label="Sources"><span class="ask-src-lab" aria-hidden="true">Sources</span>${sources.map(s => `<button type="button" onclick="askOpenSource('${t.id}','${escapeAttr(s.id)}')" aria-label="Open source: ${escapeAttr(s.label)}">${escapeHtml(s.label)}</button>`).join('')}</div>` : ''}
      ${a.local || a.clarify ? '' : t.fixOpen ? `
        <div class="ask-fix">
          <label class="ask-lab" for="askFix-${t.id}">What works better?</label>
          <textarea id="askFix-${t.id}" rows="3" maxlength="1000" oninput="askDraftFix('${t.id}', this.value)" placeholder="For example: many of our patients understand … better. Say that first.">${escapeHtml(t.fixDraft || '')}</textarea>
          <p class="ask-details">Your note goes to ${escapeHtml(askOwnerFirst())}. Nothing changes until it's approved.</p>
          <div class="ask-acts"><button type="button" onclick="askToggleFix('${t.id}', false)">Cancel</button><button type="button" class="is-go" onclick="askSendFix('${t.id}')">Send</button></div>
        </div>` : t.fixSent ? `<p class="ask-sent">Thanks! ${escapeHtml(askOwnerFirst())} will review your note.</p>` : `
        <div class="ask-acts ask-foot">
          <button type="button" class="${t.helpful ? 'is-on' : ''}" onclick="askHelpful('${t.id}')"${t.helpful ? ' aria-pressed="true"' : ''}>${ASK_ICO.up}${t.helpful ? 'Thanks!' : 'Helpful'}</button>
          ${canAdd ? `<button type="button" onclick="askAddTerm('${t.id}')">${ASK_ICO.plus}Add to glossary</button>` : ''}
          <button type="button" onclick="askToggleFix('${t.id}', true)">${ASK_ICO.pen}Correct this</button>
        </div>`}
    </div>`;
}

/* ---- How an answer is laid out ----
   A structured layout only when the data for it is checked, never read out
   of the answer's own words:
     term      the one glossary entry the answer cites (one that was sent with
               the question and is still in the glossary): its English and
               Spanish as the glossary has them
     ff        the one False Friend it cites: the Spanish word and the English
               it looks like, side by side
     compare   two entries side by side: a comparison follow-up ("the
               difference between that and the previous term") whose two
               terms the answer cites, or a question naming two entries the
               answer cites both of
     prep      a briefing it hands over (a checked open/continue action):
               what's in it, from the briefing itself
     practice  the still-learning terms it offers to practise, from your Term
               Review record, with what the record says about each
   Anything else is the plain card: headline, what to say, details. */
const ASK_CMP_RE = /\b(difference|differ\w*|compare\w*|comparison|versus|vs|or|diferencia\w*|compar\w*|o)\b/;
// Glossary entries and False Friends the answer cites, among those sent with the question.
function askCited(t){
  const a = t.answer || {};
  return (a.sourceIds || []).filter((id, i, all) => all.indexOf(id) === i && t.labels && t.labels[id] && /^(t|ff):/.test(id) && askResource(id));
}
function askLayout(t){
  const a = t.answer;
  if(t.status !== 'done' || !a || a.clarify || a.mem || a.convo) return null;
  const cited = askCited(t);
  let pair = null;
  if(t.fu === 'compare' && (t.about || []).length === 2 && t.about.every(id => cited.includes(id))) pair = t.about.slice();
  else if(cited.length >= 2 && ASK_CMP_RE.test(foldText(t.q || '').toLowerCase())){
    const named = askNamesSomething(t.q).filter(id => cited.includes(id));
    if(named.length >= 2) pair = named.slice(0, 2);
  }
  if(pair) return { kind: 'compare', ids: pair };
  const acts = (t.actions || []).filter(x => askCheckAction(x, t).ok);
  const prep = acts.find(x => x.type === 'open_prep' || x.type === 'continue_prep');
  if(prep){
    const d = askSpecialties().find(s => s.id === String(prep.target).replace(/^spec:/, ''));
    if(d) return { kind: 'prep', dom: d, cont: prep.type === 'continue_prep' };
  }
  if(acts.some(x => x.type === 'practice_learning') && typeof termReviewsLoaded !== 'undefined' && termReviewsLoaded){
    const list = askLearningTerms().slice(0, t.n || 5);
    if(list.length) return { kind: 'practice', list };
  }
  if(cited.length === 1){
    const id = cited[0];
    if(id.startsWith('t:')){ const x = askTermById(id); if(x && x.term.en && x.term.es) return { kind: 'term', x }; }
    else{ const f = FALSE_FRIENDS[+id.slice(3)]; if(f && f.es && f.looks) return { kind: 'ff', f }; }
  }
  return null;
}
// The first sentence of a glossary definition, kept short.
function askFirstLine(s){
  s = String(s || '').trim();
  const m = s.match(/^.{20,160}?[.!?](\s|$)/);
  const one = m ? m[0].trim() : s;
  return one.length > 150 ? one.slice(0, 147).replace(/\s+\S*$/, '') + '…' : one;
}
const askMeans = f => String(f.means || '').split(' —')[0];
function askLayoutHtml(lay, t){
  if(lay.kind === 'term'){
    const { x } = lay;
    return `<div class="ask-lay ask-term" role="group" aria-label="Glossary entry">
      <div class="ask-tl"><span class="ask-lang" aria-hidden="true">EN</span><span class="sr-only">English: </span><b lang="en">${escapeHtml(x.term.en)}</b></div>
      <div class="ask-tl is-es"><span class="ask-lang" aria-hidden="true">ES</span><span class="sr-only">Spanish: </span><b lang="es">${escapeHtml(x.term.es)}</b></div>
      <p class="ask-tmeta">Glossary · ${escapeHtml(x.cat.name)}</p>
    </div>`;
  }
  if(lay.kind === 'ff'){
    const { f } = lay;
    return `<div class="ask-lay ask-cmp is-ff" role="group" aria-label="False friend: ${escapeAttr(f.es)} and ${escapeAttr(f.looks)}">
      <div class="ask-cc is-es"><span class="ask-cl">Spanish</span><b lang="es">${escapeHtml(f.es)}</b><p>means <strong>${escapeHtml(askMeans(f))}</strong></p></div>
      <div class="ask-cc"><span class="ask-cl">Looks like</span><b lang="en">${escapeHtml(f.looks)}</b>${f.say ? `<p>say <strong lang="es">${escapeHtml(f.say)}</strong></p>` : ''}</div>
    </div>`;
  }
  if(lay.kind === 'compare'){
    const side = id => {
      if(id.startsWith('t:')){
        const x = askTermById(id);
        return `<div class="ask-cc"><b lang="en">${escapeHtml(x.term.en || x.term.es)}</b>${x.term.es && x.term.en ? `<span class="ask-es" lang="es">${escapeHtml(x.term.es)}</span>` : ''}${x.term.def ? `<p>${escapeHtml(askFirstLine(x.term.def))}</p>` : ''}</div>`;
      }
      const f = FALSE_FRIENDS[+id.slice(3)];
      return `<div class="ask-cc"><b lang="es">${escapeHtml(f.es)}</b><span class="ask-es">means ${escapeHtml(askMeans(f))}</span><p>Looks like “${escapeHtml(f.looks)}”.${f.say ? ` For that, say “${escapeHtml(f.say)}”.` : ''}</p></div>`;
    };
    const names = lay.ids.map(id => askResource(id).name);
    return `<div class="ask-lay ask-cmp" role="group" aria-label="Side by side: ${escapeAttr(names.join(' and '))}">${lay.ids.map(side).join('')}</div>`;
  }
  if(lay.kind === 'prep'){
    const d = DATA.categories.find(c => c.id === lay.dom.id);
    if(!d) return '';
    const w = prepWords(d), n = w.words.length;
    const learning = w.words.filter(x => TERM_REVIEWS[x.t.id] && TERM_REVIEWS[x.t.id].box <= 1).length;
    const traps = prepTraps(d), u = lay.cont && askUnfinished();
    const items = [];
    if(u) items.push(`You’re on card ${u.done + 1} of ${u.total}`);
    if(n) items.push(`${n} word${n === 1 ? '' : 's'} to have ready${learning ? `<small>${learning} you’re still learning</small>` : ''}`);
    if(traps.length) items.push(`Traps to watch: ${traps.map(f => `<span lang="es">${escapeHtml(f.es)}</span>`).join(', ')}`);
    items.push(apptActive() ? 'Your appointment timer is running' : 'Start the appointment timer when you go in');
    return `<div class="ask-lay ask-list" role="group" aria-label="In your ${escapeAttr(d.name)} briefing">
      <p class="ask-ll">In your ${escapeHtml(d.name)} briefing</p>
      <ul>${items.map(i => `<li>${i}</li>`).join('')}</ul></div>`;
  }
  if(lay.kind === 'practice'){
    const fb = r => !r ? ['', ''] : reviewMissedRec(r) ? ['is-miss', r.misses > 1 ? `Missed ${r.misses} times` : 'Missed last time']
      : (r.nextReviewAt || 0) <= Date.now() ? ['is-due', 'Due today'] : ['', 'Still learning'];
    return `<div class="ask-lay ask-prac" role="group" aria-label="Terms you’re still learning">
      <p class="ask-ll">Still learning · from your Term Review</p>
      <ul>${lay.list.map(term => {
        const key = t.id + '|' + term.id, open = ASK.revealed && ASK.revealed.has(key), [c, label] = fb(TERM_REVIEWS[term.id]);
        return `<li><button type="button" class="ask-pr" aria-expanded="${open}" onclick="askReveal('${t.id}','${escapeAttr(term.id)}', this)">
          <b lang="en">${escapeHtml(term.en)}</b><span class="ask-pr-es" lang="es"${open ? '' : ' hidden'}>${escapeHtml(term.es || '—')}</span><span class="ask-pr-show"${open ? ' hidden' : ''}>Show Spanish</span></button>
          ${label ? `<span class="ask-fb ${c}">${label}</span>` : ''}</li>`;
      }).join('')}</ul></div>`;
  }
  return '';
}
// A layout that can't be drawn leaves the plain card; it never breaks the conversation.
function askLayoutSafe(lay, t){ try{ return askLayoutHtml(lay, t); }catch(e){ console.warn('Ask layout:', e); return ''; } }
// Practice card: tap a term to see its Spanish (kept for this conversation).
function askReveal(turnId, termId, btn){
  ASK.revealed = ASK.revealed || new Set();
  const key = turnId + '|' + termId, open = !ASK.revealed.has(key);
  if(open) ASK.revealed.add(key); else ASK.revealed.delete(key);
  document.querySelectorAll('.ask-pr').forEach(b => {
    if(b.getAttribute('onclick') !== btn.getAttribute('onclick')) return;
    b.setAttribute('aria-expanded', String(open));
    b.querySelector('.ask-pr-es').hidden = !open; b.querySelector('.ask-pr-show').hidden = open;
  });
}

/* Redrawing the conversation keeps your place. New messages ease in once
   (askEnter); the rest are left exactly as they were. It follows the
   conversation only if you are at its end or just asked something: a new
   answer then shows from its question, so a long one reads from the top.
   If you were reading further up, you stay there and a "New answer" button
   appears instead. */
function renderAskMessages(scrollToEnd){
  drPanelSync();   // the dock's panel shows the same conversation
  const box = document.getElementById('askMessages');
  if(!box) return;
  const atEnd = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  const justAsked = performance.now() - (ASK.sentAt || -1e9) < 1500;
  const keep = box.scrollTop;
  askEnter(box, askMessagesHtml());
  askWatchScroll(box);
  if(scrollToEnd && (atEnd || justAsked)) askScrollNewest(box);
  else{
    box.scrollTop = keep;
    if(scrollToEnd && box.scrollHeight - box.scrollTop - box.clientHeight > 80) askJump(box, true);
  }
  // How he looks while it works and when it lands is his task state
  // (askReact): nothing to do for him here but be there.
  askSendSync();
  askConvoSync();
  askFaceSync();
}
// Swap in new HTML; anything that wasn't there before (by data-k) eases in.
// A container being filled for the first time doesn't animate.
function askEnter(box, html){
  const seen = new Set([...box.querySelectorAll('[data-k]')].map(e => e.dataset.k));
  const first = !box.childElementCount;
  box.innerHTML = html;
  if(first) return;
  box.querySelectorAll('[data-k]').forEach(e => { if(!seen.has(e.dataset.k)) e.classList.add('is-entering'); });
}
// The newest question and what came of it: from the question's top if it
// doesn't all fit, else the very end.
function askScrollNewest(box){
  const qs = box.querySelectorAll('.ask-q'), q = qs[qs.length - 1];
  askJump(box, false);
  if(!q){ box.scrollTop = box.scrollHeight; return; }
  const top = q.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 9;
  box.scrollTop = box.scrollHeight - top > box.clientHeight ? top : box.scrollHeight;
}
function askJump(box, on){
  let b = box.querySelector('.ask-jump');
  if(!on){ if(b) b.remove(); return; }
  if(!b){
    b = document.createElement('button');
    b.type = 'button'; b.className = 'ask-jump'; b.textContent = 'New answer ↓';
    b.addEventListener('click', () => askScrollNewest(box));
    box.appendChild(b);
  }
}
function askWatchScroll(box){
  if(box.dataset.watch) return;
  box.dataset.watch = '1';
  box.addEventListener('scroll', () => { if(box.scrollHeight - box.scrollTop - box.clientHeight < 40) askJump(box, false); }, { passive: true });
}
// Ask the Hub's Dr. Smiley blinks now and then while you're on the screen
// (drFaceIdle, blinks only: his expressions here come from what Ask is
// doing -- his task states -- not from his idle).
// Whichever face is showing gets it: the big hello one, or the header one
// once a conversation has started. A repaint makes a new face; the old one's
// timer stops by itself once its face is gone.
let askIdle = null;
function askFaceSync(){
  if(activeCategory !== 'ask') return;
  const svg = document.querySelector('.ask-hello .ask-face svg') || document.querySelector('#askFace svg');
  if(!svg || (askIdle && askIdle.running && askIdle.svg === svg)) return;
  if(askIdle) askIdle.stop();
  askIdle = drFaceIdle(svg, svg, { expressions: false, canPlay: () => activeCategory === 'ask' });
  askIdle.svg = svg;
}

/* ---- Asking ---- */
async function submitAsk(preset, force, opts){
  const input = document.getElementById('askInput');
  opts = opts || {};
  // A retried question carries the term it was asked about (opts.sel), which
  // may not be the one picked now; your current pick is left alone.
  const selNow = 'sel' in opts ? opts.sel : ASK.selected;
  const q = String(preset != null ? preset : (input ? input.value : ASK.draft)).trim().slice(0, 500);
  if(!q || ASK.busy) return;
  ASK.sentAt = performance.now();   // you just asked: the conversation follows to it
  // "Remember / forget / what do you remember": answered here, nothing sent.
  const mi = askMemoryIntent(q);
  if(mi){
    ASK.phi = null; ASK.draft = '';
    if(input) input.value = '';
    const t = askMemoryTurn(q, mi);
    ASK.turns.push(t);
    renderAskMessages(true);
    if(t.memSaved) drPerform('ack', { priority: DR_P.REACT });
    return;
  }
  if(!force && askLooksLikePatientInfo(q)){
    ASK.phi = q;
    renderAskMessages(true);
    return;
  }
  firstWeekMark('ask');
  ASK.phi = null;
  ASK.draft = '';
  if(input) input.value = '';
  // A follow-up ("make it simpler", "that", "go back to my prep"): what it
  // means in this conversation, or a question back, or what's missing.
  const plan = askPlan(q, selNow, opts);
  if(plan.local){ askPushLocal(q, plan, opts); return; }
  const { picked, lessons } = askRetrieve(q);
  // The term you picked to talk about (or the one "that" means) goes first,
  // so it can be a source; then what the follow-up is about; the
  // conversation's topic and previous term go last.
  // A question naming another entry moves on from the term you picked: it
  // isn't sent as "this term", and the pick is let go once answered.
  // (A request -- a briefing, practice -- isn't a new subject.)
  const intent = askIntent(q), selTerm = selNow ? askTermById(selNow.term) : null;
  const named = plan.fu || !selTerm || intent ? [] : askNamesSomething(q).filter(id => /^(t|ff):/.test(id));
  const moved = !!(selTerm && named.length && !named.includes('t:' + selTerm.term.id) && !ASK_REF.test(foldText(q).toLowerCase()));
  const sel = plan.sel !== undefined ? plan.sel : (moved ? null : selTerm);
  const anat = ASK.anatomy && askResource('an:' + ASK.anatomy.id) ? 'an:' + ASK.anatomy.id : '';
  const front = (sel ? ['t:' + sel.term.id] : []).concat(anat ? [anat] : [], (plan.ids || []).filter(id => (!sel || id !== 't:' + sel.term.id) && id !== anat));
  const cur = askSubjectNow(), prev = askPrevTerm();
  askPlaceEntries(picked, front, (cur ? cur.ids : []).concat(prev ? [prev] : []).filter(id => !front.includes(id)));
  const labels = {};
  picked.forEach(d => { labels[d.entry.id] = d.label; });
  const turn = { id: askTurnId(), q, qLabel: opts.label || '', status: 'loading', labels, go: Object.fromEntries(picked.map(d => [d.entry.id, d.go])),
    sel: sel ? { cat: sel.cat.id, term: sel.term.id } : null, n: (intent && intent.n) || 5, actions: [],
    about: plan.about || null, keepSubject: !!plan.keepSubject, correction: plan.correction || '', fixOf: plan.fixOf || '', langSwitch: plan.lang || '',
    fu: plan.fu ? plan.fu.kind : '', anat: anat ? ASK.anatomy.id : '',
    movedOn: moved && !('sel' in opts) && selNow ? selNow.term : '' };
  // The conversation so far: question, answer and what it was about.
  const history = ASK.turns.filter(x => x.status === 'done' && x.answer && !x.answer.local && !x.answer.clarify).slice(-4)
    .map(x => ({ q: x.q, a: [x.answer.headline, x.answer.say, x.answer.details].filter(Boolean).join(' — ').slice(0, 400), about: x.subjectIds || [] }));
  const gen = ASK.gen;
  ASK.turns.push(turn);
  ASK.busy = true;
  ASK.pending = turn.id;
  renderAskMessages(true);
  // After the repaint, so the first question's thinking plays on the face
  // that stays (the header's), not the hello one it replaces.
  drTask('processing', { key: 'ask:' + turn.id, perform: 'ponder', keep: true });
  // Stopped, or a new conversation started, meanwhile: nothing more from this one.
  const stale = () => ASK.pending !== turn.id || ASK.gen !== gen;
  // Your Term Review record, for "practice the ones I'm still learning".
  const rec = await askLoadRecord();
  if(stale()) return;
  // No connection: what can be done on this phone is done here (the
  // briefing, practice, the glossary entry); anything else waits and goes
  // when the phone is back online.
  if(navigator.onLine === false){
    ASK.busy = false; ASK.pending = null;
    if(intent){ turn.status = 'done'; turn.answer = askLocalAnswer(intent, rec, turn); turn.actions = askIntentActions(intent, rec, turn); askAfterAnswer(turn, plan); }
    else turn.status = 'waiting';
    turn.doneAt = Date.now();
    askSaveWaiting();
    renderAskMessages(true);
    askReact(turn);
    return;
  }
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  ASK.abort = ctl;
  // What came back, applied only if you haven't stopped it meanwhile.
  const out = {};
  try{
    const res = await fetch('/api/ask', {
      method: 'POST',
      signal: ctl ? ctl.signal : undefined,
      headers: { 'Content-Type': 'application/json', ...(await hubAuthHeaders()) },
      body: JSON.stringify({
        question: q,
        entries: picked.map(d => d.entry),
        lessons: lessons.map(l => ({ id: l.id, about: l.question, note: l.note })),
        history,
        context: { ...askContext(rec, sel), ...(c => c ? { conversation: c } : {})(askConvoContext(plan)) }
      })
    });
    if(stale()) return;
    if(res.status === 401){ out.status = 'error'; out.error = 'Ask the Hub is for the team. Open the Hub with the team code and try again.'; }
    else if(res.status === 503){ out.status = 'error'; out.error = "Ask the Hub isn't switched on yet: the AI key is missing on the server."; }
    else if(!res.ok){ out.status = 'error'; out.error = "Couldn't get an answer just now. Try again in a moment."; }
    else{
      const data = await res.json();
      if(data.refused) out.status = 'refused';
      else if(data.answer && data.answer.headline){ out.status = 'done'; out.answer = data.answer; }
      else{ out.status = 'error'; out.error = "Couldn't read the answer. Try again."; }
    }
  }catch(err){
    if(navigator.onLine === false) out.status = 'waiting';
    else{ out.status = 'error'; out.error = "Couldn't reach the Hub. Try again."; }
  }
  if(stale()) return;                                      // stopped: askCancel already moved on
  Object.assign(turn, out);
  if(turn.answer && turn.answer.clarify){
    // He asked which one: a button per option he was sent, nothing else.
    turn.actions = askPickActions(turn.answer.topicIds);
  }else{
    // His suggestions, then what the phone itself recognised; the screen
    // checks each again before it shows a button (askCheckAction).
    turn.actions = askMergeActions(turn.answer ? turn.answer.actions : [], askIntentActions(intent, rec, turn));
    // You named a specialty the Hub doesn't have: no briefing for some other one.
    if(intent && intent.kind === 'prep' && intent.named && !intent.spec) turn.actions = turn.actions.filter(a => a.type !== 'open_prep');
    if(turn.status === 'done'){
      // A language asked for here can be kept for every conversation; a
      // correction can go to the team for review. Both only if you choose.
      if(plan.lang && drPref('lang') !== plan.lang) turn.actions.push({ type: 'keep_lang', target: plan.lang });
      if(plan.correction) turn.actions.push({ type: 'send_correction', target: 'review' });
    }
  }
  // A next step he's already suggested in an answer isn't offered again
  // unasked today.
  turn.actions.forEach(a => { if(/^(continue_|practice_learning|start_review)/.test(a.type)) drMemMarkShown(a.type + ':' + a.target); });
  if(turn.status === 'done') askAfterAnswer(turn, plan);
  turn.doneAt = Date.now();
  askSaveWaiting();
  ASK.busy = false; ASK.abort = null; ASK.pending = null;
  if(activeCategory === 'ask') renderAskMessages(true); else drPanelSync();
  askReact(turn);
  setTimeout(askResumeWaiting, 400);
}

/* What an answer means, from what can be checked here -- not from fromHub
   alone (the provenance label on the card stays exactly as the server sent
   it):
     verified   from the Hub, and at least one of its sources is an entry
                this phone sent or a team note that is approved
     general    from general knowledge (or a "from the Hub" none of whose
                sources checks out)
     refused / failed / offline / cancelled */
function askOutcome(t){
  if(t.status === 'cancelled') return 'cancelled';
  if(t.status === 'waiting') return 'offline';
  if(t.status === 'refused') return 'refused';
  if(t.status !== 'done' || !t.answer) return 'failed';
  const a = t.answer;
  // He asked which one you mean, or what's missing: he waits for you.
  if(a.clarify) return 'clarify';
  // Answered on this phone (offline): it did what was asked if it has something to offer.
  if(a.local) return (t.actions || []).some(x => askCheckAction(x, t).ok) ? 'verified' : 'general';
  if(askHandsOver(t)) return 'handoff';
  const sources = (a.sourceIds || []).filter(id => t.labels && t.labels[id]).length;
  const notes = (a.lessonIds || []).filter(id => ASK.lessons.some(l => l.id === id && l.status === 'approved')).length;
  // Your correction was used: not verified, whatever the Hub says.
  if(a.usedCorrection) return 'general';
  return a.fromHub && sources + notes > 0 ? 'verified' : 'general';
}
// About as long as it takes to read the answer on a phone.
function askReadMs(t){
  const a = t.answer || {};
  const words = [a.headline, a.say, a.details].filter(Boolean).join(' ').split(/\s+/).filter(Boolean).length;
  return Math.max(3000, Math.min(14000, 1800 + words * 260));
}
/* Dr. Smiley's side of an answer (task states, in the engine):
     verified   "got it" (a smile and a nod), he reads it with you, then a
                warm smile
     general    received and considered, no smile; he reads it with you,
                then a composed face (uncertain): the card says to
                double-check it and offers Add to glossary / Correct this
     refused, failed, offline: composed (uncertain); the card offers the
                way on (ask it another way, try again, it'll go when online)
     cancelled  an okay nod, nothing more
     clarify    he asked which one you mean: attentive, waiting for you
   On another page when it lands: the dock's Dr. Smiley looks up, smiling
   only for a verified one. */
function askReact(t){
  const key = 'ask:' + t.id, out = askOutcome(t), here = activeCategory === 'ask';
  if(out === 'cancelled'){
    drTaskEnd(key);
    drPerform('okay', { priority: DR_P.TASK });
    return;
  }
  if(out === 'clarify'){
    drTask('attentive', { key, ms: 6000, perform: here ? 'listen' : null });
    return;
  }
  // A tool handed over: "got it", a moment to see the button, then a smile.
  if(out === 'handoff'){
    drTask('answering', { key, ms: 2600, perform: here ? 'answer' : 'notice', then: { perform: 'smile', where: 'ask' } });
    return;
  }
  if(out === 'verified' || out === 'general'){
    const ok = out === 'verified';
    drTask('answering', {
      key, ms: askReadMs(t),
      perform: here ? (ok ? 'answer' : 'answerGeneral') : (ok ? 'notice' : 'answerGeneral'),
      then: ok ? { perform: 'smile', where: 'ask' } : { kind: 'uncertain', key, ms: 5000, perform: 'composed', where: 'ask' },
    });
    return;
  }
  drTask('uncertain', { key, ms: 6000, perform: 'composed' });
}
const ICON_ASK_STOP = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2.4" fill="white"/></svg>';
// The send button stops a question that's on its way.
function askSendBtnHtml(){
  return ASK.busy
    ? `<button class="chat-send-btn is-stop" id="askSend" type="button" onclick="askCancel()" aria-label="Stop">${ICON_ASK_STOP}</button>`
    : `<button class="chat-send-btn" id="askSend" type="button" onclick="submitAsk()" aria-label="Ask">${ICON_SEND}</button>`;
}
function askSendSync(){
  const b = document.getElementById('askSend');
  if(b && b.classList.contains('is-stop') !== !!ASK.busy) b.outerHTML = askSendBtnHtml();
}
// Stop: the question stays on screen as stopped; whatever comes back for it
// later is dropped (submitAsk checks ASK.pending), and nothing of it is
// recorded in the conversation. quiet: a new conversation is replacing it.
function askCancel(quiet){
  const t = ASK.turns.find(x => x.id === ASK.pending);
  if(!t) return;
  t.status = 'cancelled'; t.doneAt = Date.now();
  const ctl = ASK.abort;
  ASK.busy = false; ASK.abort = null; ASK.pending = null;
  if(ctl) try{ ctl.abort(); }catch(e){}
  if(quiet === true){ drTaskEnd('ask:' + t.id); return; }
  if(activeCategory === 'ask') renderAskMessages(true); else drPanelSync();
  askReact(t);
}
function askDontWait(id){
  const t = ASK.turns.find(x => x.id === id);
  if(!t || t.status !== 'waiting') return;
  t.status = 'cancelled'; t.note = "Okay, I won't ask that one.";
  askSaveWaiting();
  drTaskEnd('ask:' + t.id);
  renderAskMessages(false);
}
// Put a question back in the box to change it.
function askEdit(id){
  const i = ASK.turns.findIndex(t => t.id === id);
  if(i < 0) return;
  ASK.draft = ASK.turns[i].q;
  ASK.turns.splice(i, 1);
  askSaveWaiting();
  drTaskEnd('ask:' + id);
  renderAskMessages(false);
  const input = document.getElementById('askInput');
  if(input){ input.value = ASK.draft; input.focus(); }
}
/* Questions waiting for a connection are kept on the phone (ih_askWaiting),
   so closing the app doesn't lose them; they go once it's back online. Not
   one that looked like it had patient details (sent anyway after the
   warning): that stays in memory only. */
const ASK_WAITING_KEY = 'ih_askWaiting';
function askSaveWaiting(){
  const w = ASK.turns.filter(t => t.status === 'waiting' && !askLooksLikePatientInfo(t.q)).slice(-10)
    .map(t => ({ q: t.q, sel: t.sel || null, n: t.n || 5 }));
  try{ w.length ? localStorage.setItem(ASK_WAITING_KEY, JSON.stringify(w)) : localStorage.removeItem(ASK_WAITING_KEY); }catch(e){}
}
function askRestoreWaiting(){
  let w = [];
  try{ w = JSON.parse(localStorage.getItem(ASK_WAITING_KEY) || '[]'); }catch(e){}
  (Array.isArray(w) ? w : []).forEach((x, k) => {
    if(!x || typeof x.q !== 'string' || !x.q.trim() || ASK.turns.some(t => t.status === 'waiting' && t.q === x.q)) return;
    ASK.turns.push({ id: 'q' + (Date.now() + k).toString(36), q: x.q.slice(0, 500), status: 'waiting', labels: {}, go: {},
      sel: x.sel && x.sel.term ? { cat: String(x.sel.cat || ''), term: String(x.sel.term) } : null, n: +x.n || 5, actions: [] });
  });
}
// Back online: the oldest question waiting for a connection goes now (the
// next one when that's answered).
function askResumeWaiting(){
  if(ASK.busy || navigator.onLine === false) return;
  const t = ASK.turns.find(x => x.status === 'waiting');
  if(t) askRetry(t.id);
}
/* Attentive: tapping into the box, he looks to it (once in a while, not on
   every tap); typing keeps him attentive -- blinks only -- and typing again
   after a pause gets a quick look down. Never while a question is on its
   way: thinking comes first. */
let askAttnAt = 0, askKeyAt = 0;
function askAttend(on){
  if(ASK.busy) return;
  if(!on){ drTaskExtend('ask-attn', 900); return; }
  const now = Date.now(), fresh = now - askAttnAt > 8000;
  askAttnAt = now;
  if(drMind.task && drMind.task.key === 'ask-attn') drTaskExtend('ask-attn', 5000);
  else drTask('attentive', { key: 'ask-attn', ms: 5000, perform: fresh ? 'listen' : null, priority: DR_P.REACT });
}
function askTyping(){
  if(ASK.busy) return;
  const now = Date.now(), gap = now - askKeyAt;
  askKeyAt = now;
  if(drMind.task && drMind.task.key === 'ask-attn'){
    drTaskExtend('ask-attn', 3500);
    if(gap > 4000) drPerform('peekDown', { priority: DR_P.REACT });
  }else if(gap > 1500) askAttend(true);
}

function askRetry(id){
  const i = ASK.turns.findIndex(t => t.id === id);
  if(i < 0 || ASK.busy) return;
  const q = ASK.turns[i].q, sel = ASK.turns[i].sel || null;
  ASK.turns.splice(i, 1);
  askSaveWaiting();
  drTaskEnd('ask:' + id);
  submitAsk(q, true, { sel });   // the same term it was about
}
/* ---------- Dr. Smiley: following a conversation ----------
   What this conversation is about, kept in memory on this phone only and
   bounded (ASK.convo). It is not what you asked him to remember
   (ih_smileyMemory, drMem*): it is never saved, never sent to the team, and
   "New conversation" clears it while saved preferences stay.
     subjects     what the last few answers were about, newest first (at most
                  4): Hub entry ids, or none when an answer wasn't about an
                  entry, so "that" never skips back past it
     task         the briefing this conversation is about (one)
     lang         "Now in Spanish": this conversation only
     corrections  what you corrected (at most 3): used until the conversation
                  ends, never verified team knowledge; "Send for review" is
                  the only way one reaches the team (hub-lessons, pending)
   A follow-up is read here first (askFollowUp, then askPlan): which answer
   "make it simpler" means, which term "that" or "the previous term" means,
   which briefing "go back to my prep" means. One reading: it goes with the
   question (CONTEXT.conversation; api/ask.js keeps only ids that were sent).
   Several: one short question, a button per option. None: he says what's
   missing. He never picks a resource for you. Nothing from a request that
   was stopped or overtaken is recorded (askAfterAnswer runs only after the
   checks in submitAsk). */
const ASK_CONVO_MAX = { subjects: 4, corrections: 3 };
const ASK_LANG_NAMES = { es: 'Spanish', en: 'English', both: 'both languages' };
function askConvoEmpty(){ return { subjects: [], task: null, lang: '', corrections: [] }; }
let askTurnSeq = 0;
function askTurnId(){ return 'q' + Date.now().toString(36) + (++askTurnSeq).toString(36); }
// A Hub entry by the id it's sent under, if it's still there.
function askResource(id){
  id = String(id || '');
  if(id.startsWith('t:')){
    const x = askTermById(id);
    return x ? { id, name: x.term.en || x.term.es, entry: askTermEntry(x), label: `Glossary · ${x.term.en || x.term.es}`, go: { cat: x.cat.id, term: x.term.id } } : null;
  }
  if(id.startsWith('spec:')){ const d = askSpecialties().find(s => s.id === id.slice(5)); return d ? { id, name: d.name } : null; }
  const d = askCorpus().find(x => x.entry.id === id);
  return d ? { id, name: d.label.split(' · ').slice(1).join(' · '), entry: d.entry, label: d.label, go: d.go } : null;
}
function askSubjectNow(){ return ASK.convo.subjects[0] || null; }
// The term talked about before the current one.
function askPrevTerm(){
  const [cur, ...rest] = ASK.convo.subjects, skip = new Set(cur ? cur.ids : []);
  for(const s of rest) for(const id of s.ids) if(/^(t|ff):/.test(id) && !skip.has(id) && askResource(id)) return id;
  return null;
}
// The latest real answer in this conversation (not a memory card, not a question back).
function askLastAnswer(){
  for(let i = ASK.turns.length - 1; i >= 0; i--){
    const t = ASK.turns[i];
    if(t.status === 'done' && t.answer && !t.answer.mem && !t.answer.clarify && !t.answer.convo && !t.hidden) return t;
  }
  return null;
}
// Things a question can name by themselves: glossary terms, False Friends,
// doctors, providers. (Guide and ethics topics match on everyday words like
// "difference" or "previous", so they never count as the thing named.)
function askNamesSomething(q){ return askRetrieve(q).top.filter(s => s.score >= 8 && /^(t|ff|dr|pv):/.test(s.d.entry.id)).map(s => s.d.entry.id); }
const ASK_FILLER = new Set(('now and ok okay so please again same thing it that this say tell me give put explain repeat write translate the answer can you could do '
  + 'what about how also too then in into to en a al ahora y lo eso esto dilo dimelo dime explica explicalo explicame traducelo traduce otra vez por favor de nuevo la respuesta').split(' '));
// "Now in Spanish." / "Explain it in English" -- and nothing else. "How do
// you say heart attack in Spanish?" is a question, not a switch.
function askLangSwitch(f){
  const m = f.match(/\b(?:in|en|into|to|about|al?)\s+(spanish|espanol|english|ingles|both(?: languages)?|ambos(?: idiomas)?)\b/) || f.match(/^(spanish|espanol|english|ingles)\b/);
  if(!m) return '';
  const rest = f.replace(m[0], ' ').replace(/[^a-z ]/g, ' ').split(/\s+/).filter(w => w && !ASK_FILLER.has(w));
  if(rest.length) return '';
  return /^(spanish|espanol)/.test(m[1]) ? 'es' : /^(english|ingles)/.test(m[1]) ? 'en' : 'both';
}
function askRephraseStyle(f){
  if(/\b(simpler|simplify|simply|plainer|easier|in plain (words|terms|language)|in simple (words|terms)|mas (simple|sencillo|facil)|simplific\w*|en palabras (simples|sencillas))\b/.test(f)) return 'simpler';
  if(/\b(shorter|briefer|in short|mas corto|resume\w*)\b/.test(f)) return 'shorter';
  if(/\b(more detail\w*|longer|elaborate|expand|go deeper|tell me more|mas detall\w*|mas largo)\b/.test(f)) return 'longer';
  return '';
}
const ASK_REF = /\b(that|this|it|that one|this one|ese|esa|eso|este|esta|esto)\b/;
function askFollowUp(q){
  const f = foldText(q).toLowerCase().replace(/[’`]/g, "'");
  const words = askTokens(q).length, named = askNamesSomething(q);
  if(/\b(go(ing)? back|back to|return to|resume|pick up|where (was|did) i|regres\w*|vuelv\w*|volver|seguir con|continu\w*)\b/.test(f)
    && /\b(prep|briefing|appointment|cita|repaso|preparacion|quiz|review|practice|practica)\b/.test(f))
    return { kind: 'resume', task: /\bquiz\b/.test(f) ? 'quiz' : /\breview\b/.test(f) ? 'review' : /\b(practice|practica)\b/.test(f) && !/\b(prep|briefing|appointment|cita)\b/.test(f) ? 'any' : 'prep' };
  if(/^(no\b|nope|not quite|actually|that'?s (not|wrong|incorrect)|you'?re wrong|wrong\b|incorrect|it'?s not\b|we (say|use|call)\b|we don'?t (say|use)|here we say|in our (hospital|team)|en realidad|no es\b|incorrecto|aqui (decimos|usamos)|nosotros decimos)/.test(f)
    && !/\b(i meant|quise decir)\b/.test(f) && !/\?\s*$/.test(q)) return { kind: 'correction' };
  const lang = askLangSwitch(f);
  if(lang) return { kind: 'language', lang };
  const style = askRephraseStyle(f);
  if(style && !named.length && words <= 4) return { kind: 'rephrase', style };
  if(/\b(difference|differ\w*|compare\w*|comparison|versus|vs|same (thing )?as|diferencia\w*|compar\w*|igual que)\b/.test(f)
    && /\b(that|this|it|them|both|previous|last|earlier|before|first|other|anterior|ese|esa|eso|este|esta|esto|otro|otra|ambos)\b/.test(f)) return { kind: 'compare', named };
  if(ASK_REF.test(f) && !named.length && words <= 3) return { kind: 'reference' };
  return null;
}
// A question back: one short line, a button per option.
function askClarify(ids, head){
  const rs = ids.map(askResource).filter(Boolean).slice(0, 3);
  return { local: { clarify: true, headline: head || `${rs.map(r => r.name).join(' or ')}?`, details: rs.length ? '' : 'Name it and I’ll go on from there.',
    actions: rs.map(r => ({ type: 'pick_topic', target: r.id })) } };
}
function askMissing(headline, details, actions){ return { local: { clarify: true, headline, details, actions: actions || [] } }; }
function askLastSel(last){ return last && last.sel ? askTermById(last.sel.term) : null; }
function askRefPlan(id){
  const x = id.startsWith('t:') ? askTermById(id) : null;
  return { fu: { kind: 'reference' }, ids: [id], resolved: [{ word: 'that', id }], about: [id], ...(x ? { sel: x } : {}) };
}
function askPlan(q, selNow, opts){
  const fu = askFollowUp(q), last = askLastAnswer();
  // What "that" is now: the one you just picked, else the latest answer's
  // subject, else the term picked to explain.
  const cur = opts.pick ? { ids: [opts.pick] } : askSubjectNow() || (selNow && askTermById(selNow.term) ? { ids: ['t:' + selNow.term] } : null);
  if(opts.pick && (!fu || fu.kind === 'reference')) return askRefPlan(opts.pick);
  if(!fu) return {};
  const ids = cur ? cur.ids.slice() : [];
  switch(fu.kind){
    case 'resume': return askPlanResume(fu.task);
    case 'correction':
      if(!last) return askMissing('What should I correct?', 'I haven’t answered anything in this conversation yet.');
      return { fu: { kind: 'correction' }, ids, keepSubject: true, sel: askLastSel(last), correction: q.slice(0, 200), fixOf: last.q };
    case 'language': {
      const name = ASK_LANG_NAMES[fu.lang];
      if(!last) return { local: { headline: `${name[0].toUpperCase() + name.slice(1)} for the rest of this conversation.`, details: '',
        actions: [{ type: 'keep_lang', target: fu.lang }], commit: () => { ASK.convo.lang = fu.lang; } } };
      return { fu: { kind: 'language' }, ids, keepSubject: true, sel: askLastSel(last), lang: fu.lang };
    }
    case 'rephrase':
      if(!last) return askMissing({ simpler: 'What should I make simpler?', shorter: 'What should I make shorter?', longer: 'More detail about what?' }[fu.style],
        'I haven’t answered anything in this conversation yet. Ask about a term first.');
      return { fu: { kind: 'rephrase', style: fu.style }, ids, keepSubject: true, sel: askLastSel(last) };
    case 'compare': return askPlanCompare(q, cur, fu.named, !!opts.pick);
    case 'reference':
      if(selNow && askTermById(selNow.term)) return {};          // the term you picked is "this term"
      if(!cur && ASK.anatomy && askResource('an:' + ASK.anatomy.id)) return askRefPlan('an:' + ASK.anatomy.id);   // ... or the 3D Body structure
      if(!cur) return askMissing('Which term do you mean?', 'Name it, or open it in the glossary and tap ⋯ → Explain with Dr. Smiley.');
      if(!cur.ids.length) return {};                             // not a Hub entry: the conversation itself says what "that" is
      if(cur.ids.length > 1) return askClarify(cur.ids);
      return askRefPlan(cur.ids[0]);
  }
  return {};
}
// "What's the difference between that and the previous term?"
function askPlanCompare(q, cur, named, picked){
  const f = foldText(q).toLowerCase();
  const curIds = cur ? cur.ids : [];
  const both = /\b(them|both|those two|these two|ambos|los dos|las dos)\b/.test(f);
  const wantsPrev = /\b(previous|last|earlier|before|first|other|anterior|otro|otra|primer\w*)\b/.test(f);
  const others = (named || []).filter(id => !curIds.includes(id));
  if(both && curIds.length === 2) return { fu: { kind: 'compare' }, ids: curIds.slice(), resolved: curIds.map(id => ({ word: 'them', id })), about: curIds.slice() };
  if(!cur && !others.length) return askMissing('Compare which terms?', 'Name both, like “edema or ascites?”');
  if(curIds.length > 1 && !picked && !both) return askClarify(curIds, `Which one do you mean by “that”: ${curIds.map(id => askResource(id)).filter(Boolean).map(r => r.name).join(' or ')}?`);
  const a = curIds[0] || null;
  const b = others[0] || askPrevTerm();
  if(!b){
    const r = a && askResource(a);
    return askMissing(r ? `Compare ${r.name} with which term?` : 'Compare it with which term?',
      r ? `${r.name} is the only term in this conversation so far.` : 'Name the term, like “the difference between that and edema”.');
  }
  const resolved = [], ids = [];
  if(a){ resolved.push({ word: 'that', id: a }); ids.push(a); }
  resolved.push({ word: others[0] ? 'the term named' : wantsPrev ? 'the previous term' : 'the earlier term', id: b }); ids.push(b);
  return { fu: { kind: 'compare' }, ids, resolved, about: ids.slice() };
}
// "Go back to my appointment prep": the briefing it can only mean, or a
// question if there's more than one, or what's missing.
function askPlanResume(kind){
  const cands = [], seen = new Set();
  const add = (a, tier) => {
    const k = a.type.startsWith('continue_') || a.type === 'open_prep' ? (a.target.startsWith('spec:') ? a.target : a.type) : a.type;
    if(seen.has(k) || !askCheckAction(a, { n: 5 }).ok) return;
    seen.add(k); cands.push({ a, tier });
  };
  const u = askUnfinished();
  if(u && (kind === 'any' || u.kind === kind))
    add({ type: 'continue_' + u.kind, target: u.kind === 'prep' ? 'spec:' + u.id : u.kind }, 1);
  if(kind === 'prep' || kind === 'any'){
    if(ASK.convo.task) add({ type: 'open_prep', target: ASK.convo.task.id }, 1);
    if(APPT && APPT.domainId) add({ type: 'open_prep', target: 'spec:' + APPT.domainId }, 1);
    const fromSpec = (ASK.from === 'prep' || ASK.from === 'appt') && askFromSpecialty();
    if(fromSpec) add({ type: 'open_prep', target: 'spec:' + fromSpec }, 1);
    if(PREP.domainId) add({ type: 'open_prep', target: 'spec:' + PREP.domainId }, 2);
  }
  const top = cands.some(c => c.tier === 1) ? cands.filter(c => c.tier === 1) : cands;
  const what = kind === 'quiz' ? 'quiz' : kind === 'review' ? 'Term Review session' : kind === 'any' ? 'practice' : 'appointment prep';
  if(!top.length){
    return kind === 'prep' || kind === 'any'
      ? askMissing(`I don’t see ${kind === 'any' ? 'any practice' : 'an appointment prep'} in progress.`, 'Pick a specialty and I’ll open its briefing.', [{ type: 'choose_prep', target: 'prep' }])
      : askMissing(`I don’t see a ${what} in progress.`, '', kind === 'review' && whoAmI() && dueReviewCount() ? [{ type: 'start_review', target: 'review' }] : []);
  }
  const prepOf = c => c.a.target.startsWith('spec:') ? askResource(c.a.target) : null;
  if(top.length === 1){
    const c = top[0], r = prepOf(c), u2 = askUnfinished();
    const where = c.a.type.startsWith('continue_') && u2 ? `You were on ${u2.kind === 'quiz' ? 'question' : 'card'} ${u2.done + 1} of ${u2.total}.` : '';
    return { local: { headline: r ? `Your ${r.name} briefing` : c.a.type === 'continue_quiz' ? 'Your quiz' : 'Your Term Review',
      details: where, actions: [c.a], commit: () => { if(r) ASK.convo.task = { kind: 'prep', id: r.id, name: r.name }; } } };
  }
  const names = top.slice(0, 3).map(c => (prepOf(c) || { name: c.a.type === 'continue_quiz' ? 'your quiz' : 'Term Review' }).name);
  return { local: { clarify: true, headline: `${names.join(' or ')}?`, details: '', actions: top.slice(0, 3).map(c => c.a) } };
}
// What goes with the question about the conversation (bounded; api/ask.js
// keeps only ids that were sent as entries).
function askConvoContext(plan){
  const c = ASK.convo, cur = askSubjectNow(), prev = askPrevTerm(), out = {};
  if(cur && cur.ids.length) out.topic = cur.ids.map(id => ({ id }));
  if(prev) out.previous = { id: prev };
  if(c.task) out.task = { kind: 'prep', id: c.task.id };
  const lang = plan.lang || c.lang;
  if(lang) out.lang = lang;
  if(plan.fu) out.followUp = plan.fu;
  if(plan.resolved) out.resolved = plan.resolved.map(r => ({ word: r.word, id: r.id }));
  const corr = c.corrections.concat(plan.correction ? [{ about: (cur && cur.ids[0]) || '', text: plan.correction }] : []).slice(-ASK_CONVO_MAX.corrections);
  if(corr.length) out.corrections = corr;
  return Object.keys(out).length ? out : null;
}
// The resources a question needs, in front (the ones it's about) and at the
// end (the conversation's topic and previous term, so "that" can be named).
function askPlaceEntries(picked, front, tail){
  const docs = ids => ids.map(askResource).filter(r => r && r.entry).map(r => ({ entry: r.entry, label: r.label, go: r.go }));
  const all = new Set(front.concat(tail));
  for(let i = picked.length - 1; i >= 0; i--) if(all.has(picked[i].entry.id)) picked.splice(i, 1);
  const f = docs(front), t = docs(tail);
  picked.unshift(...f);
  picked.length = Math.max(f.length, Math.min(picked.length, ASK_MAX_ENTRIES - t.length));
  picked.push(...t);
}
// After an answer that wasn't stopped: what it was about, and anything this
// question asked for that lasts the conversation.
function askAfterAnswer(t, plan){
  const a = t.answer, c = ASK.convo;
  if(!a || a.clarify) return;
  if(plan.lang) c.lang = plan.lang;
  if(plan.correction){
    const cur = askSubjectNow();
    c.corrections.push({ about: (cur && cur.ids[0]) || '', text: plan.correction });
    c.corrections = c.corrections.slice(-ASK_CONVO_MAX.corrections);
  }
  askNoteSubject(t);
  if(t.movedOn && ASK.selected && ASK.selected.term === t.movedOn) askClearSelected();
  const prep = (t.actions || []).find(x => (x.type === 'open_prep' || x.type === 'continue_prep') && askCheckAction(x, t).ok);
  const r = prep && askResource(prep.target);
  if(r) c.task = { kind: 'prep', id: r.id, name: r.name };
}
function askNoteSubject(t){
  const c = ASK.convo, cur = c.subjects[0];
  if(t.keepSubject && cur){ t.subjectIds = cur.ids.slice(); return; }
  const ids = [], add = id => { if(id && ids.length < 2 && !ids.includes(id) && askResource(id)) ids.push(id); };
  (t.about || []).forEach(add);
  if(!ids.length && t.sel) add('t:' + t.sel.term);
  if(!ids.length && t.answer) (t.answer.topicIds || []).forEach(add);
  if(!ids.length && t.answer) add((t.answer.sourceIds || []).find(id => /^(t|ff):/.test(id)));
  t.subjectIds = ids;
  if(cur && ids.length && cur.ids.join('|') === ids.join('|')){ cur.turn = t.id; return; }
  // Handing over a briefing or practice isn't a new subject to talk about.
  if(!ids.length && askHandsOver(t)) return;
  c.subjects.unshift({ ids, turn: t.id });
  c.subjects.length = Math.min(c.subjects.length, ASK_CONVO_MAX.subjects);
}
// An answer from the phone itself (a question back, what's missing, a task to go back to).
function askPushLocal(q, plan, opts){
  const l = plan.local;
  const a = { local: true, convo: true, clarify: !!l.clarify, fromHub: false, headline: l.headline, sayLabel: '', say: '', details: l.details || '',
    sourceIds: [], lessonIds: [], actions: [], suggestTerm: { en: '', es: '', def: '' } };
  const t = { id: askTurnId(), q, qLabel: opts.label || '', status: 'done', labels: {}, go: {}, n: 5, actions: l.actions || [], answer: a, doneAt: Date.now() };
  if(l.commit) l.commit();
  ASK.turns.push(t);
  renderAskMessages(true);
  askReact(t);
}
function askPickActions(ids){
  return (ids || []).filter(id => askResource(id)).slice(0, 3).map(id => ({ type: 'pick_topic', target: id }));
}
/* Start new conversation: stops what's on its way, clears the conversation
   and its record. What you asked him to remember stays. */
function askNewConversation(){
  if(ASK.busy) askCancel(true);
  ASK.gen++;
  ASK.turns.forEach(t => drTaskEnd('ask:' + t.id));
  ASK.turns = []; ASK.phi = null; ASK.draft = ''; ASK.selected = null; ASK.anatomy = null;
  ASK.convo = askConvoEmpty(); ASK.fresh = true;
  askSaveWaiting();
  if(activeCategory === 'ask'){
    renderContent();
    const input = document.getElementById('askInput');
    if(input && prefersAutoFocus()) input.focus();
  }
}
function askHasConversation(){ return ASK.turns.some(t => !t.hidden) || !!ASK.phi; }
// Above the box: what "that" means right now, and a language asked for in
// this conversation (✕ drops it; it was never saved).
function askConvoHtml(){
  const c = ASK.convo, cur = askSubjectNow(), names = cur ? cur.ids.map(askResource).filter(Boolean).map(r => r.name) : [];
  const topic = !askSelectedTerm() && names.length ? `<span class="ask-convo-topic"><small>Talking about</small> <b>${escapeHtml(names.join(' · '))}</b></span>` : '';
  const lang = c.lang ? `<span class="ask-convo-lang">${escapeHtml(ASK_LANG_NAMES[c.lang][0].toUpperCase() + ASK_LANG_NAMES[c.lang].slice(1))} · this conversation<button type="button" onclick="askConvoLang('')" aria-label="Stop answering in ${escapeAttr(ASK_LANG_NAMES[c.lang])}">✕</button></span>` : '';
  return topic || lang ? `<div class="ask-convo" id="askConvo">${topic}${lang}</div>` : '<div id="askConvo" hidden></div>';
}
function askConvoLang(l){ ASK.convo.lang = l; askConvoSync(); }
function askConvoSync(){
  const el = document.getElementById('askConvo');
  if(el) el.outerHTML = askConvoHtml();
  const nb = document.getElementById('askNew'), hide = !askHasConversation();
  // Showing it can change the header's height: the box stays above the tab bar.
  if(nb && nb.hidden !== hide){ nb.hidden = hide; if(!document.body.classList.contains('kb-open')) fitAskPanel(); }
}

/* ---------- Dr. Smiley: context and actions ----------
   Ask is how you talk to Dr. Smiley, and he can do things with the Hub's
   own tools, not just answer:
     "I'm covering oncology. Prep me."   -> the appointment briefing for that
                                            specialty (Appointment prep)
     "Help me practice five terms I'm still learning."
                                         -> Term Review on those terms, from
                                            your review record
     "Explain this term."                -> the glossary entry you picked
                                            (⋯ on its card), in plain Spanish,
                                            with its source
   The phone sends a small context (askContext): the screen you came from,
   the term you picked, the specialties that have a briefing, and how many
   terms your record marks as still learning. Nothing about a patient, and
   nothing free-form beyond the glossary entry itself.
   He can suggest actions from a fixed list (api/ask.js checks each one's
   target against what was sent); the phone recognises the same three
   requests itself (askIntent), so they also work offline and when the
   server fails. Every action is checked again when it's drawn and when it's
   tapped (askCheckAction): a specialty or term that's gone, or a record with
   nothing to practise, gives no button, or a message saying why. "Done" is
   said only after the screen it opens is actually there (askRunAction). */
const ICON_ASK_TERM = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-7.5L7 20v-3.5H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 9.4a2 2 0 1 1 2.8 1.8c-.5.3-.8.6-.8 1.2M12 14.4v.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const ASK_ACTION_TYPES = ['open_prep', 'choose_prep', 'practice_learning', 'start_review', 'set_name', 'open_term', 'look_up', 'open_source', 'ask_online',
  'continue_prep', 'continue_quiz', 'continue_review', 'open_memory', 'mem_undo', 'pick_topic', 'keep_lang', 'send_correction'];
const ICON_ASK_NEW = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

// The term you picked to talk about, if it's still in the glossary.
function askSelectedTerm(){
  const s = ASK.selected;
  if(!s) return null;
  const cat = DATA.categories.find(c => c.id === s.cat);
  const term = cat && cat.terms.find(t => t.id === s.term);
  return term ? { cat, term } : null;
}
// A glossary id ("t:..." as sent to the server) back to its term.
function askTermById(id){
  const tid = String(id || '').replace(/^t:/, '');
  for(const cat of DATA.categories){ const term = cat.terms.find(t => t.id === tid); if(term) return { cat, term }; }
  return null;
}
function askTermEntry(x){
  return { id: 't:' + x.term.id, type: 'Glossary term', domain: x.cat.name, en: x.term.en || '', es: x.term.es || '',
    definition: x.term.def || '', notes: x.term.notes || '', source: x.term.source || '' };
}
// "Explain with Dr. Smiley" on a term card: Ask, about that term.
function askAbout(catId, termId){
  ASK.selected = { cat: catId, term: termId };
  ASK.anatomy = null;
  ASK.draft = 'Explain this term.';
  ASK.view = 'chat';
  setCategory('ask');
  const input = document.getElementById('askInput');
  if(input){ input.value = ASK.draft; if(prefersAutoFocus()) input.focus(); }
}
// ✕ (fromUser): you let go of the term, so "this term" doesn't find it in
// the conversation either.
function askClearSelected(fromUser){
  // The 3D Body structure goes too (and the glossary term it brought along).
  if(fromUser === true && ASK.anatomy){
    const id = 'an:' + ASK.anatomy.id;
    ASK.convo.subjects.forEach(s => { s.ids = s.ids.filter(x => x !== id); });
    if(!ASK.anatomy.withTerm) askConvoSync();
    ASK.anatomy = null;
  }
  if(fromUser === true && ASK.selected){
    const id = 't:' + ASK.selected.term;
    ASK.convo.subjects.forEach(s => { s.ids = s.ids.filter(x => x !== id); });
    askConvoSync();
  }
  ASK.selected = null;
  const el = document.getElementById('askCtx');
  if(el) el.outerHTML = askContextChipHtml();
}
function askContextChipHtml(){
  const st = ASK.anatomy && ATLAS.byId.get(ASK.anatomy.id);
  if(st) return `<div class="ask-ctx" id="askCtx"><span><small>Explaining</small><b>${escapeHtml(st.en)}</b><em>3D Body${ASK.anatomy.withTerm ? ' · in the glossary' : ''}</em></span><button type="button" onclick="askClearSelected(true)" aria-label="Stop explaining ${escapeAttr(st.en)}">✕</button></div>`;
  const sel = askSelectedTerm();
  if(ASK.selected && !sel) return `<div class="ask-ctx is-gone" id="askCtx" role="status"><span>The term you picked is no longer in the glossary.</span><button type="button" onclick="askClearSelected()" aria-label="Clear">✕</button></div>`;
  if(!sel) return '<div id="askCtx" hidden></div>';
  return `<div class="ask-ctx" id="askCtx"><span><small>Explaining</small><b>${escapeHtml(sel.term.en || sel.term.es)}</b><em>${escapeHtml(sel.cat.name)}</em></span><button type="button" onclick="askClearSelected(true)" aria-label="Stop explaining ${escapeAttr(sel.term.en)}">✕</button></div>`;
}
// Specialties with a briefing: the same list Appointment prep offers.
function askSpecialties(){
  return getDomainTiles().filter(t => !t.parentId && DATA.categories.some(c => c.id === t.id));
}
// Terms your Term Review record marks as still learning (box 0-1, as the
// briefing counts them): lowest box first, then the longest overdue.
function askLearningTerms(){
  const byId = new Map(allTermsFlat().map(t => [t.id, t]));
  // Your study focus first, if you've set one.
  const focus = drPref('focus'), off = id => focus && askTopOf(byId.get(id).categoryId) !== focus ? 1 : 0;
  return Object.entries(TERM_REVIEWS).filter(([id, r]) => r && r.box <= 1 && byId.has(id))
    .sort((a, b) => (off(a[0]) - off(b[0])) || (a[1].box - b[1].box) || ((a[1].nextReviewAt || 0) - (b[1].nextReviewAt || 0)))
    .map(([id]) => byId.get(id));
}
// Your record, loaded if it can be (a few seconds at most). loaded: false
// means it couldn't be read (offline before it was ever loaded), not "empty".
async function askLoadRecord(){
  if(!whoAmI()) return { hasName: false, loaded: false };
  const wait = p => Promise.race([p, new Promise(r => setTimeout(r, 4000))]);
  try{ await wait(ensureLoaded('termReviews', loadTermReviews)); }catch(e){}
  if(!termReviewsLoaded && db && navigator.onLine !== false){ try{ await wait(loadTermReviews()); }catch(e){} }
  return { hasName: true, loaded: termReviewsLoaded };
}
const ASK_SCREEN_NAMES = { home: 'Home', anatomy: '3D Body', review: 'Term Review', practice: 'CoreCHI Practice', prep: 'Appointment briefing', appt: 'Appointment',
  translate: 'Translate', chat: 'Team Chat', all: 'All domains', falsefriends: 'False Friends', 'doctor-directory': 'Doctor Directory', userguide: 'User Guide' };
// The small context sent with a question (bounded; api/ask.js cuts it down again).
// The specialty of the screen Ask was opened from: a domain (or its parent),
// the briefing you were on, the appointment running.
function askFromSpecialty(){
  const from = ASK.from || '', cat = DATA.categories.find(c => c.id === from);
  const id = cat ? (cat.parentId || cat.id) : from === 'prep' ? PREP.domainId : from === 'appt' && typeof APPT !== 'undefined' && APPT ? APPT.domainId : null;
  return id && askSpecialties().some(d => d.id === id) ? id : null;
}
function askContext(rec, sel){
  const from = ASK.from || 'home', cat = DATA.categories.find(c => c.id === from);
  if(sel === undefined) sel = askSelectedTerm();
  const fromSpec = (from === 'prep' || from === 'appt') && askFromSpecialty();
  const fromName = fromSpec ? `${askSpecialties().find(d => d.id === fromSpec).name} ${from === 'prep' ? 'briefing' : 'appointment'}` : '';
  return {
    screen: { id: /^[\w:.-]{1,80}$/.test(from) ? from : '', name: fromName || (cat ? cat.name : (ASK_SCREEN_NAMES[from] || '')) },
    selected: sel ? { id: 't:' + sel.term.id, en: sel.term.en || '', es: sel.term.es || '', domain: sel.cat.name,
      source: sel.term.source || '', hasLink: /^https?:\/\//i.test(externalUrl(sel.term.url)) } : null,
    ...(st => st ? { anatomy: { id: 'an:' + st.id, en: st.en, es: st.es, inGlossary: !!(ASK.anatomy && ASK.anatomy.withTerm) } } : {})(ASK.anatomy && ATLAS.byId.get(ASK.anatomy.id)),
    specialties: askSpecialties().slice(0, 40).map(d => ({ id: 'spec:' + d.id, name: d.name })),
    learning: { hasName: !!rec.hasName, loaded: !!rec.loaded, count: rec.loaded ? askLearningTerms().length : 0 },
    ...askPrefsContext(),
    ...(drPref('practice') === 'on' ? { practice: askPractice(rec) } : {}),
  };
}
// The remembered preferences that shape an answer (not how he moves, not the
// practice switch), only the ones actually remembered.
function askPrefsContext(){
  const m = drMemGet(), out = {};
  if(m.lang) out.lang = m.lang;
  if(m.length) out.length = m.length;
  if(m.focus){ const d = askSpecialties().find(x => x.id === m.focus); if(d) out.focus = { id: 'spec:' + d.id, name: d.name }; }
  return Object.keys(out).length ? { prefs: out } : {};
}
/* The three requests, recognised on the phone. */
const ASK_NUMBERS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10 };
// Everyday words for a specialty, for when its name isn't used.
const ASK_SPEC_WORDS = [[/\bcancer|\bchemo|\btumou?r|oncolog|\bonc\b|hem[ae]?[- ]?onc/, 'onco'], [/\bheart|cardi/, 'cardiac'],
  [/\bob\b|obstet|gyn|pregnan|labor and delivery|prenatal/, 'obgyn'], [/\bkids?\b|\bchild|pediatr|\bpeds\b/, 'peds'], [/\ber\b|emergenc/, 'er'],
  [/\beyes?\b|ophth/, 'ophth'], [/\bskin\b|dermat/, 'derm'], [/psych|mental/, 'mh'], [/\blungs?\b|pulmon|respirat/, 'pulm'], [/\bbones?\b|orthop/, 'ortho'],
  [/stomach|gastro|\bgi\b/, 'gi'], [/surg|anesth/, 'surg'], [/infusion/, 'infusion'], [/\blabs?\b/, 'lab'], [/pharm|medication|\bmeds\b/, 'pharm'],
  [/infectio/, 'id'], [/genetic/, 'genetics'], [/neuro|developmental/, 'neuro']];
const ASK_SPEC_SKIP = new Set(['and', 'with', 'center', 'results', 'resources', 'general', 'professional', 'failure', 'recovery']);
function askFindSpecialty(q){
  const f = foldText(q).toLowerCase(), doms = askSpecialties(), has = id => doms.some(d => d.id === id);
  const top = id => { const c = DATA.categories.find(x => x.id === id); return c && c.parentId ? c.parentId : id; };
  // A word of a domain's or subgroup's own name (the first five letters are
  // enough: "cardiology" finds "Cardiac", "radiation" finds Oncology's Radiation).
  const words = f.match(/[a-z]{4,}/g) || [];
  const stem = w => w.slice(0, 5);
  for(const c of DATA.categories){
    const names = (foldText(c.name).toLowerCase().match(/[a-z]{4,}/g) || []).filter(w => !ASK_SPEC_SKIP.has(w));
    if(names.some(n => words.some(w => n.length >= 5 && w.length >= 5 ? stem(n) === stem(w) : n === w)) && has(top(c.id))) return top(c.id);
  }
  for(const [re, id] of ASK_SPEC_WORDS) if(re.test(f) && has(id)) return id;
  return null;
}
function askIntent(q){
  const f = foldText(q).toLowerCase();
  if(/\b(prep|prepare|brief|briefing|covering|cover|heading to|going to|assigned to|get me ready)\b/.test(f) && !/\b(practice|practise|drill|quiz)\b/.test(f)){
    // No specialty named: the domain you asked from, if you were in one.
    // ... else your study focus, if you've set one.
    // A specialty named that isn't in the Hub ("covering astrology") isn't
    // swapped for the screen's or your focus: he asks which one instead.
    const found = askFindSpecialty(q);
    const named = /\b(covering|cover|heading to|going to|assigned to|(prep|prepare|brief) me (for|on)|briefing (for|on))\s+(?!(a|an|the|my|me|it|there|this|that|today|now)\b)[a-z]/.test(f);
    return { kind: 'prep', named, spec: found || (named ? null : (askFromSpecialty() || drPref('focus') || null)) };
  }
  if(/\b(practice|practise|drill|quiz me|study|flashcards?|review)\b/.test(f) && /\b(terms?|words?|learning|still|struggl\w*|weak|missed|review)\b/.test(f)){
    const m = f.match(/\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\b/);
    const n = m ? (+m[1] || ASK_NUMBERS[m[1]] || 5) : 5;
    return { kind: 'practice', n: Math.max(1, Math.min(10, n)) };
  }
  if(/\b(explain|explicame|explica|this (term|word)|what does (this|it) mean|in plain spanish|que significa)\b/.test(f)) return { kind: 'explain' };
  if(/\b(what should i (do|practice|study|review)( next| now)?|what('?s| is) next|where (was|did) i (stop|leave off)|continue|keep going|que (practico|sigue|hago))\b/.test(f)) return { kind: 'next' };
  return null;
}
// What the phone itself would offer for a recognised request.
function askIntentActions(intent, rec, t){
  if(!intent) return [];
  if(intent.kind === 'prep') return intent.spec ? [{ type: 'open_prep', target: 'spec:' + intent.spec }] : [{ type: 'choose_prep', target: 'prep' }];
  if(intent.kind === 'practice'){
    if(!rec.hasName) return [{ type: 'set_name', target: 'name' }];
    if(rec.loaded && askLearningTerms().length) return [{ type: 'practice_learning', target: 'learning' }];
    return rec.loaded && dueReviewCount() ? [{ type: 'start_review', target: 'review' }] : [];
  }
  if(intent.kind === 'next'){
    const step = askNextStep(rec);
    return step ? [step] : [];
  }
  if(intent.kind === 'explain'){
    const sel = t && t.sel && askTermById(t.sel.term);
    if(!sel) return [];
    const id = 't:' + sel.term.id, out = [];
    if(navigator.onLine === false) out.push({ type: 'ask_online', target: id });
    out.push(/^https?:\/\//i.test(externalUrl(sel.term.url)) ? { type: 'open_source', target: id } : { type: 'look_up', target: id });
    out.push({ type: 'open_term', target: id });
    return out;
  }
  return [];
}
// His suggestions first; the phone's own fill in kinds he didn't suggest.
function askMergeActions(model, local){
  const out = [], seen = new Set();
  const kinds = new Set((model || []).map(a => a && a.type));
  (model || []).concat((local || []).filter(a => !kinds.has(a.type) || a.type === 'open_term')).forEach(a => {
    if(!a || !ASK_ACTION_TYPES.includes(a.type)) return;
    const k = a.type + '|' + a.target;
    if(!seen.has(k)){ seen.add(k); out.push({ type: a.type, target: String(a.target || '') }); }
  });
  return out.slice(0, 4);
}
/* Is this action still possible, and what does its button say? Checked when
   drawn and again when tapped. */
function askCheckAction(a, t){
  if(!a || !ASK_ACTION_TYPES.includes(a.type)) return { ok: false, why: "I can't do that from here." };
  switch(a.type){
    case 'open_prep': {
      const id = String(a.target).replace(/^spec:/, ''), d = askSpecialties().find(x => x.id === id);
      return d ? { ok: true, main: true, label: `Open the ${d.name} briefing` } : { ok: false, why: "That specialty isn't in the Hub any more." };
    }
    case 'choose_prep': return { ok: true, label: 'Choose a specialty' };
    case 'continue_prep': case 'continue_quiz': case 'continue_review': {
      const u = askUnfinished(), kind = a.type.slice(9);
      if(!u || u.kind !== kind || (kind === 'prep' && 'spec:' + u.id !== a.target)) return { ok: false, why: 'That practice is already finished or was put away.' };
      const left = `${u.done + 1} of ${u.total}`;
      if(kind === 'prep') return { ok: true, main: true, label: `Continue your ${askSpecialties().find(d => d.id === u.id).name} briefing (${left})` };
      return { ok: true, main: true, label: kind === 'quiz' ? `Continue your quiz (question ${left})` : `Continue Term Review (${left})` };
    }
    case 'open_memory': return { ok: true, label: 'What I remember' };
    // Conversation only: which one you meant; keeping a language; sending a correction for review.
    case 'pick_topic': { const r = askResource(a.target); return r ? { ok: true, label: r.name } : { ok: false, why: 'That’s no longer in the Hub.' }; }
    case 'keep_lang': return ASK_LANG_NAMES[a.target] && drPref('lang') !== a.target ? { ok: true, label: `Use ${ASK_LANG_NAMES[a.target]} in every conversation` } : { ok: false, why: 'That’s already saved.' };
    case 'send_correction': return t && t.correction && !t.fixSent && !t.fixOpen ? { ok: true, label: `Send to ${askOwnerFirst()} for review` } : { ok: false, why: 'Already on its way for review.' };
    case 'mem_undo': return t && t.undo && !t.undone ? { ok: true, label: 'Undo' } : { ok: false, why: 'Nothing to undo.' };
    case 'practice_learning': {
      if(!whoAmI()) return { ok: false, why: 'Set your name first: your review record is kept under it.' };
      const n = Math.min((t && t.n) || 5, askLearningTerms().length);
      return n ? { ok: true, main: true, label: `Practice ${n} term${n === 1 ? '' : 's'} I’m still learning` } : { ok: false, why: 'No terms are marked “still learning” right now.' };
    }
    case 'start_review': {
      const due = dueReviewCount();
      return whoAmI() && due ? { ok: true, label: `Review ${Math.min(due, 15)} due term${Math.min(due, 15) === 1 ? '' : 's'}` } : { ok: false, why: 'Nothing is due in Term Review right now.' };
    }
    case 'set_name': return whoAmI() ? { ok: false, why: 'Your name is already set.' } : { ok: true, main: true, label: 'Set your name' };
    case 'open_term': case 'look_up': case 'open_source': case 'ask_online': {
      const x = askTermById(a.target);
      if(!x) return { ok: false, why: 'That term is no longer in the glossary.' };
      const name = x.term.en || x.term.es;
      if(a.type === 'open_term') return { ok: true, label: `Open “${name}” in the glossary` };
      if(a.type === 'look_up') return { ok: true, label: x.term.source ? `Find the ${x.term.source.replace(/\s*\(.*\)\s*$/, '')} page` : 'Find a source' };
      if(a.type === 'ask_online') return navigator.onLine === false ? { ok: true, main: true, label: 'Plain Spanish when I’m back online' } : { ok: false, why: "You're online now." };
      const href = externalUrl(x.term.url);
      if(!/^https?:\/\//i.test(href)) return { ok: false, why: 'No source link is saved for this term.' };
      let host = ''; try{ host = new URL(href).hostname.replace(/^www\./, ''); }catch(e){}
      return { ok: true, href, label: `Source: ${x.term.source || host}` };
    }
  }
  return { ok: false, why: "I can't do that from here." };
}
// An answer that only hands you one of the Hub's own tools (a briefing,
// Term Review) states no facts to double-check; its label stays as sent.
// The answer's job was to hand over one of the Hub's tools (a briefing, Term
// Review, a next step): a success, whatever its provenance label says.
function askHandsOver(t){
  const a = t.answer;
  return !!a && !a.say && !(a.sourceIds || []).length && (t.actions || []).some(x => x.type !== 'open_term' && x.type !== 'look_up' && askCheckAction(x, t).ok);
}
function askHandoff(t){
  const a = t.answer;
  if(!a || a.say || (a.sourceIds || []).length) return false;
  // A question back ("Which term do you mean?") states nothing either.
  return !a.details || (t.actions || []).some(x => x.type !== 'open_term' && x.type !== 'look_up' && askCheckAction(x, t).ok);
}
function askActionsHtml(t){
  const list = (t.actions || []).map((a, i) => ({ a, i, c: askCheckAction(a, t) })).filter(x => x.c.ok);
  const did = t.did || {};
  const notes = Object.values(did).map(d => `<p class="${d.ok ? 'ask-done' : 'ask-fail'}" role="status">${d.ok ? '✓ ' : ''}${escapeHtml(d.msg)}</p>`).join('');
  if(!list.length && !notes) return '';
  return `<div class="ask-do">${list.map(({ a, i, c }) => c.href
    ? `<a class="ask-do-btn" href="${escapeAttr(c.href)}" target="_blank" rel="noopener">${escapeHtml(c.label)} ${ICON_EXTERNAL}</a>`
    : `<button type="button" class="ask-do-btn${c.main ? ' is-main' : ''}" onclick="askRunAction('${t.id}', ${i})">${escapeHtml(c.label)}</button>`).join('')}</div>${notes}`;
}
// Explaining a term: where it comes from, as the glossary records it. A
// source link only when one is saved (else "Find the ... page" looks it up).
function askSourceLineHtml(t){
  if(!t.sel || !t.answer) return '';
  const x = askTermById(t.sel.term);
  if(!x || !(t.answer.sourceIds || []).includes('t:' + x.term.id)) return '';
  return x.term.source ? `<p class="ask-srcline"><span class="ask-lab">Source</span>${escapeHtml(x.term.source)}</p>` : `<p class="ask-srcline"><span class="ask-lab">Source</span>None saved for this term yet</p>`;
}
/* Offline: the answer for a recognised request, from what's on the phone. */
function askLocalAnswer(intent, rec, t){
  const a = { local: true, fromHub: false, headline: '', sayLabel: '', say: '', details: '', sourceIds: [], lessonIds: [], actions: [], suggestTerm: { en: '', es: '', def: '' } };
  if(intent.kind === 'prep'){
    const d = intent.spec && askSpecialties().find(x => x.id === intent.spec);
    if(d){ a.headline = `Your ${d.name} briefing is ready`; a.details = 'It works offline: the words you’re still learning, the traps to watch and the appointment timer.'; }
    else { a.headline = 'Which specialty are you covering?'; a.details = 'Pick it and I’ll open the briefing.'; }
  }else if(intent.kind === 'practice'){
    const n = rec.loaded ? askLearningTerms().length : 0;
    if(!rec.hasName){ a.headline = 'Set your name first'; a.details = 'Your review record is kept under your name on this phone.'; }
    else if(!rec.loaded){ a.headline = 'I can’t read your review record offline'; a.details = 'Try again when you’re back online.'; }
    else if(!n){ a.headline = 'No terms marked “still learning” yet'; a.details = dueReviewCount() ? 'Term Review has terms due if you want to practise anyway.' : 'Terms you miss in Term Review, the Daily Drill or a briefing show up here.'; }
    else{ const k = Math.min(t.n || 5, n); a.headline = `Practice ${k} term${k === 1 ? '' : 's'} you’re still learning`; a.details = k < (t.n || 5) ? `You have ${n} right now.` : 'From your Term Review record.'; }
  }else{
    const x = t.sel && askTermById(t.sel.term);
    if(x){
      a.headline = `${x.term.en}${x.term.es ? ' — ' + x.term.es : ''}`;
      a.details = (x.term.def || '').slice(0, 220) + (x.term.def ? ' ' : '') + 'A plain Spanish version needs a connection.';
      a.sourceIds = ['t:' + x.term.id];
      t.labels['t:' + x.term.id] = `Glossary · ${x.term.en || x.term.es}`;
      t.go['t:' + x.term.id] = { cat: x.cat.id, term: x.term.id };
    }else if(t.anat && ATLAS.byId.get(t.anat)){
      const st = ATLAS.byId.get(t.anat), id = 'an:' + st.id;
      a.headline = `${st.en}${st.es ? ' — ' + st.es : ''}`;
      a.details = st.about + ' A plain Spanish version needs a connection.';
      a.sourceIds = [id];
      t.labels[id] = `3D Body · ${st.en}`;
      t.go[id] = { cat: 'anatomy' };
    }else{ a.headline = 'Which term?'; a.details = 'Open it in the glossary, tap ⋯ on its card, then Explain with Dr. Smiley.'; }
  }
  return a;
}
/* Doing it. Each says it's done only once the screen it opens is there. */
const ASK_RUN = {
  async continue_prep(a){
    const u = askUnfinished(), d = u && askSpecialties().find(x => x.id === u.id);
    if(!d) return { ok: false, why: 'That briefing is already finished.' };
    PREP.domainId = d.id;
    try{ localStorage.setItem('ih_prepLast', JSON.stringify(PREP)); }catch(e){}
    setCategory('prep');
    const st = prepDeck(d), ok = activeCategory === 'prep' && st.i === u.done && document.querySelector('#content .prep-hero h1')?.textContent === d.name;
    return ok ? { ok: true, msg: `Back in your ${d.name} briefing, card ${u.done + 1} of ${u.total}` } : { ok: false, why: "The briefing didn't open. Try again." };
  },
  async continue_quiz(){
    const u = askUnfinished();
    if(!u || u.kind !== 'quiz') return { ok: false, why: 'That quiz is already finished.' };
    setCategory('practice');
    return quizActive && quizIndex === u.done && document.querySelector('#content .quiz-card') ? { ok: true, msg: `Back to your quiz, question ${u.done + 1} of ${u.total}` } : { ok: false, why: "The quiz didn't open." };
  },
  async continue_review(){
    const u = askUnfinished();
    if(!u || u.kind !== 'review') return { ok: false, why: 'That review is already finished.' };
    reviewResume();
    setCategory('review');
    return reviewActive && reviewIndex === u.done && document.querySelector('#content .review-card') ? { ok: true, msg: `Back to Term Review, ${u.done + 1} of ${u.total}` } : { ok: false, why: "Term Review didn't open." };
  },
  async open_memory(){
    openMemory();
    return document.getElementById('memOverlay')?.classList.contains('show') ? { ok: true } : { ok: false, why: "That didn't open." };
  },
  async mem_undo(a, t){
    if(!t.undo || t.undone) return { ok: false, why: 'Nothing to undo.' };
    let saved = true;
    Object.entries(t.undo).forEach(([k, v]) => { const r = v == null ? drMemForget(k) : drMemSet(k, v).saved; saved = saved && r !== false; });
    t.undone = true;
    return saved ? { ok: true, msg: 'Undone. Back to what was there before.' } : { ok: false, why: 'Couldn’t update this phone’s storage.' };
  },
  async open_prep(a){
    const d = askSpecialties().find(x => x.id === String(a.target).replace(/^spec:/, ''));
    if(!d) return { ok: false, why: "That specialty isn't in the Hub any more." };
    PREP.domainId = d.id; PREP.doctor = '';
    try{ localStorage.setItem('ih_prepLast', JSON.stringify(PREP)); }catch(e){}
    setCategory('prep');
    const h = document.querySelector('#content .prep-hero h1');
    return activeCategory === 'prep' && h && h.textContent === d.name ? { ok: true, msg: `Your ${d.name} briefing is open` } : { ok: false, why: "The briefing didn't open. Try again." };
  },
  async choose_prep(){
    openPrep();
    return document.getElementById('prepOverlay')?.classList.contains('show') ? { ok: true } : { ok: false, why: "The specialty list didn't open." };
  },
  async practice_learning(a, t, overtaken){
    const rec = await askLoadRecord();
    if(overtaken && overtaken()) return { overtaken: true };
    if(!rec.hasName) return { ok: false, why: 'Set your name first: your review record is kept under it.' };
    if(!rec.loaded) return { ok: false, why: 'Your review record didn’t load. Check your connection and try again.' };
    const terms = askLearningTerms().slice(0, (t && t.n) || 5);
    if(!terms.length) return { ok: false, why: 'No terms are marked “still learning” right now.' };
    reviewBegin(terms, null, { why: { k: 'missed', text: 'Still learning, from your record' }, label: 'Still learning' });
    setCategory('review');
    const ok = activeCategory === 'review' && reviewActive && reviewQueue.length === terms.length && document.querySelector('#content .review-card');
    return ok ? { ok: true, msg: `Practicing ${terms.length} term${terms.length === 1 ? '' : 's'} you’re still learning` } : { ok: false, why: "Term Review didn't start. Try again." };
  },
  async start_review(a, t, overtaken){
    await ensureLoaded('termReviews', loadTermReviews);
    if(overtaken && overtaken()) return { overtaken: true };
    setCategory('review');
    await startReview();
    return reviewActive && document.querySelector('#content .review-card') ? { ok: true, msg: 'Term Review started' } : { ok: false, why: 'Nothing is due in Term Review right now.' };
  },
  async set_name(){
    openNameModal();
    return document.getElementById('nameOverlay')?.classList.contains('show') ? { ok: true } : { ok: false, why: "The name sheet didn't open." };
  },
  async open_term(a){
    const x = askTermById(a.target);
    if(!x) return { ok: false, why: 'That term is no longer in the glossary.' };
    revealTerm(x.cat.id, x.term.id);
    return document.querySelector(`#content .card[data-term-id="${CSS.escape(x.term.id)}"]`) ? { ok: true, msg: `Opened “${x.term.en || x.term.es}”` } : { ok: false, why: "That term didn't open. Try again." };
  },
  async look_up(a){
    const x = askTermById(a.target);
    if(!x) return { ok: false, why: 'That term is no longer in the glossary.' };
    openTermLookup(x.cat.id, x.term.id);
    return document.getElementById('termLookup')?.classList.contains('show') ? { ok: true } : { ok: false, why: "The lookup didn't open." };
  },
  async pick_topic(a, t){
    if(ASK.busy) return { ok: false, why: 'One question at a time. Stop the one on its way first.' };
    const r = askResource(a.target);
    if(!r) return { ok: false, why: 'That’s no longer in the Hub.' };
    submitAsk(t.q, true, { pick: a.target, label: r.name, sel: null });
    return { ok: true };
  },
  // Saved only because you tapped it: the same store as "Remember…".
  async keep_lang(a){
    const r = drMemSet('lang', a.target);
    return !r.ok ? { ok: false, why: 'That isn’t one of the choices.' } : r.saved ? { ok: true, msg: `Saved: ${ASK_LANG_NAMES[a.target]} in every conversation` }
      : { ok: false, why: 'Couldn’t save on this phone. It still applies to this conversation.' };
  },
  async send_correction(a, t){
    t.fixOpen = true; t.fixDraft = t.fixDraft || t.correction;
    renderAskMessages(false);
    const el = document.getElementById('askFix-' + t.id);
    if(el){ el.scrollIntoView({ block: 'nearest' }); if(prefersAutoFocus()) el.focus(); }
    return { ok: true };
  },
  async ask_online(a, t){
    if(navigator.onLine !== false) return { ok: false, why: "You're online now. Ask again." };
    ASK.turns.push({ id: 'q' + Date.now().toString(36), q: t.q, status: 'waiting', labels: {}, go: {}, sel: t.sel ? { ...t.sel } : null, n: t.n, actions: [] });
    askSaveWaiting();
    return { ok: true, msg: 'I’ll ask for the plain Spanish when you’re back online' };
  },
};
// Each tap gets a number; an action that has to wait (loading your record)
// checks, before it opens anything, that it's still the latest tap and that
// you're still where you tapped it. If not it does nothing and says nothing.
let askActionSeq = 0;
async function askRunAction(turnId, i){
  const t = ASK.turns.find(x => x.id === turnId), a = t && t.actions && t.actions[i];
  if(!a) return;
  const chk = askCheckAction(a, t);
  const seq = ++askActionSeq, from = activeCategory;
  const overtaken = () => seq !== askActionSeq || activeCategory !== from;
  let res;
  if(!chk.ok) res = { ok: false, why: chk.why };
  else{ try{ res = await ASK_RUN[a.type](a, t, overtaken); }catch(e){ res = { ok: false, why: "That didn't work. Try again." }; } }
  if(res && res.overtaken) return;
  t.did = t.did || {};
  if(res.ok && res.msg) t.did[a.type + '|' + a.target] = { ok: true, msg: res.msg };
  else if(!res.ok) t.did[a.type + '|' + a.target] = { ok: false, msg: res.why };
  if(res.ok){
    if(res.msg){ showToast(res.msg); drPerform('ack', { priority: DR_P.REACT }); }
    // The briefing you went to is what "go back to my prep" means later.
    const r = /^(open_prep|continue_prep)$/.test(a.type) && askResource(a.target);
    if(r) ASK.convo.task = { kind: 'prep', id: r.id, name: r.name };
  }else showToast(res.why);
  if(activeCategory === 'ask') renderAskMessages(false); else drPanelSync();
}

/* ---------- Dr. Smiley: what he remembers (on this device) ----------
   A few choices an interpreter can ask him to remember, kept ONLY on this
   phone (localStorage ih_smileyMemory), filed under the name set on this
   phone. The Hub has no personal accounts: the team code joins the phone,
   and the name is whatever was typed in the profile sheet. So this is not
   "you everywhere" -- it's "you on this phone", and the screens say so.
     lang      the language he explains in (auto: the question's)
     length    brief or detailed answers
     focus     the specialty you're studying (a specialty id, nothing typed)
     mode      how he moves (Lively / Focused / Still)
     practice  use my practice record for a next step (off unless switched on)
   Only these fields, only these values: there is nowhere for free text, so
   nothing about a patient can be kept. Asking him "remember I prefer brief
   answers" saves it here and says so only after reading it back; when the
   phone won't store anything (private browsing, full storage) he says that
   instead and keeps it until the app closes. "What I remember" (Ask's
   header, the profile sheet) shows, changes and forgets them. Another name
   typed on a shared phone gets its own set; the conversation on screen is
   cleared, since it belonged to the person before.
   Sent with a question: only lang, length and focus (style, not
   knowledge), and -- when practice is on -- counts from your own record.
   Never team points: they're the team's, not your mastery. */
const DR_MEM_KEY = 'ih_smileyMemory';
const DR_MEM_FIELDS = {
  lang:     { label: 'Explanation language', options: [['auto', 'Same as my question'], ['es', 'Español'], ['en', 'English'], ['both', 'Both']], def: 'auto' },
  length:   { label: 'Answers', options: [['brief', 'Brief'], ['detailed', 'Detailed']], def: 'brief' },
  focus:    { label: 'Study focus', def: '' },
  mode:     { label: 'How he moves', options: [['lively', 'Lively'], ['focused', 'Focused'], ['still', 'Still']], def: 'lively' },
  practice: { label: 'Use my practice record', options: [['on', 'On'], ['off', 'Off']], def: 'off' },
};
let drMemSession = null;   // the last thing saved, kept in memory too (used when the phone refuses storage)
let drMemFailed = false;   // the last read or write didn't reach the phone's storage
function drMemKey(name){ const n = String(name == null ? whoAmI() : name).trim().toLowerCase(); return n || '_'; }
function drMemLoad(){
  // A save failed: what's in memory is newer than what the phone holds.
  if(drMemFailed && drMemSession) return drMemSession;
  try{
    const raw = localStorage.getItem(DR_MEM_KEY), m = raw ? JSON.parse(raw) : null;
    drMemFailed = false;
    return m && m.people && typeof m.people === 'object' ? m : { v: 1, people: {} };
  }catch(e){ drMemFailed = true; return drMemSession || { v: 1, people: {} }; }
}
function drMemStore(m){
  drMemSession = m;
  try{
    const s = JSON.stringify(m);
    localStorage.setItem(DR_MEM_KEY, s);
    if(localStorage.getItem(DR_MEM_KEY) !== s) throw new Error('not saved');
    drMemFailed = false; return true;
  }catch(e){ drMemFailed = true; return false; }
}
function drMemValid(k, v){
  const f = DR_MEM_FIELDS[k];
  if(!f || typeof v !== 'string') return false;
  if(k === 'focus') return v === '' || askSpecialties().some(d => d.id === v);
  return f.options.some(o => o[0] === v);
}
// What was explicitly remembered for this name (or another one).
function drMemGet(name){
  const p = drMemLoad().people[drMemKey(name)], out = {};
  Object.entries((p && p.prefs) || {}).forEach(([k, v]) => { if(drMemValid(k, v)) out[k] = v; });
  return out;
}
function drPref(k){ const v = drMemGet()[k]; return v !== undefined ? v : DR_MEM_FIELDS[k].def; }
function drPrefLabel(k, v){
  if(k === 'focus'){ const d = askSpecialties().find(x => x.id === v); return d ? d.name : 'None'; }
  const o = DR_MEM_FIELDS[k].options.find(x => x[0] === v); return o ? o[1] : v;
}
// Remember one choice for whoever's name is on this phone. ok: a valid
// choice; saved: it reached the phone's storage (else kept until the app closes).
function drMemSet(k, v){
  if(!drMemValid(k, v)) return { ok: false, saved: false };
  const m = drMemLoad(), who = drMemKey();
  const p = m.people[who] = m.people[who] || { prefs: {}, shown: {} };
  p.prefs = p.prefs || {}; p.prefs[k] = v; p.at = Date.now();
  const saved = drMemStore(m);
  if(k === 'mode' && drModePref !== v){ drModePref = v; drModeChanged(); }
  return { ok: true, saved };
}
function drMemForget(k, name){
  const m = drMemLoad(), who = drMemKey(name), p = m.people[who], mine = who === drMemKey();
  if(p){ if(k === 'all') delete m.people[who]; else if(p.prefs) delete p.prefs[k]; }
  if(mine && (k === 'mode' || k === 'all')) try{ localStorage.removeItem('ih_smileyMode'); }catch(e){}
  const saved = drMemStore(m);
  if(mine && (k === 'mode' || k === 'all') && drModePref !== 'lively'){ drModePref = 'lively'; drModeChanged(); }
  return saved;
}
// Other names with something remembered on this phone.
function drMemOthers(){
  const me = drMemKey(), m = drMemLoad();
  return Object.entries(m.people).filter(([k, p]) => k !== me && p && p.prefs && Object.keys(p.prefs).length)
    .map(([k, p]) => ({ key: k, n: Object.keys(p.prefs).length }));
}
// A suggestion he made without being asked: once a day per thing.
function drMemShownToday(key){ const p = drMemLoad().people[drMemKey()]; return !!(p && p.shown && p.shown[key] === warmupDay()); }
function drMemMarkShown(key){
  const m = drMemLoad(), who = drMemKey(), p = m.people[who] = m.people[who] || { prefs: {}, shown: {} };
  p.shown = p.shown || {}; p.shown[key] = warmupDay(); drMemStore(m);
}
// Another name typed on this phone: their own preferences (and his way of
// moving), and a clean conversation. Returns a line for the toast.
function drMemNameChanged(before, after){
  if(drMemKey(before) === drMemKey(after)) return '';
  const want = drPref('mode');
  if(drModePref !== want){ drModePref = want; drModeChanged(); }
  if(ASK.busy) askCancel(true);
  ASK.turns = []; ASK.selected = null; ASK.anatomy = null; ASK.draft = ''; ASK.convo = askConvoEmpty(); ASK.gen++;
  askSaveWaiting();   // the person before's waiting questions don't go out under the new name
  const n = Object.keys(drMemGet()).length;
  return n ? ` Dr. Smiley is using ${after ? after.split(/\s+/)[0] + "'s" : 'this phone’s'} preferences.` : '';
}

/* "Remember…", "Forget…", "What do you remember?" -- handled on the phone. */
function askMemoryIntent(q){
  const f = foldText(q).toLowerCase();
  if(/\b(what do you remember|what have you (saved|remembered)|que recuerdas|my preferences|mis preferencias)\b/.test(f)) return { kind: 'show' };
  const forget = /\b(forget|olvida|olvidate|stop remembering|borra)\b/.test(f);
  const remember = /\b(remember|recuerda|recuerdalo|save (that|this)|from now on|de ahora en adelante)\b/.test(f);
  if(!forget && !remember) return null;
  if(forget && /\b(everything|all of it|todo)\b/.test(f)) return { kind: 'forget', keys: ['all'] };
  const ch = {};
  if(/\b(both languages|in both|ambos idiomas|bilingual)\b/.test(f)) ch.lang = 'both';
  else if(/\b(in|en) (spanish|espanol)\b|\bexplain\w* (it |things |them )?in spanish|\bspanish explanations?\b/.test(f)) ch.lang = 'es';
  else if(/\b(in|en) (english|ingles)\b|\bexplain\w* (it |things |them )?in english|\benglish explanations?\b/.test(f)) ch.lang = 'en';
  else if(/\bsame language\b|\bexplanation language\b|\blanguage\b/.test(f)) ch.lang = 'auto';
  if(/\b(brief|short|shorter|concise|breve|cortas?|cortos?)\b/.test(f)) ch.length = 'brief';
  else if(/\b(detailed|more detail|longer|in depth|detallad\w*|mas detalle)\b/.test(f)) ch.length = 'detailed';
  if(/\b(stay still|be still|keep still|still mode|don'?t move|stop moving|no animation|quieto)\b/.test(f)) ch.mode = 'still';
  else if(/\b(focused mode|less animation|calmer|menos animad\w*)\b/.test(f)) ch.mode = 'focused';
  else if(/\b(lively|more animation|animad\w*)\b/.test(f)) ch.mode = 'lively';
  if(/\b(my )?(practice|progress|review) (record|history)|\b(use|track|follow|look at|check) my (practice|progress|record|reviews?)\b|usa mi (practica|progreso)/.test(f)) ch.practice = forget || /\b(don'?t|stop|no)\b/.test(f) ? 'off' : 'on';
  if(/\b(study(ing)?|focus\w*|working on|estudi\w*|enfocad\w*)\b/.test(f)){
    if(forget || /\b(no|clear|without a|sin) (study )?focus\b/.test(f)) ch.focus = '';
    else { const sp = askFindSpecialty(q); if(sp) ch.focus = sp; else if(!forget) ch.focusUnknown = true; }
  }
  if(forget) return { kind: 'forget', keys: Object.keys(ch).filter(k => k in DR_MEM_FIELDS) };
  return { kind: 'set', changes: ch };
}
// The answer card for a memory request: a confirmation only once it's
// actually saved (read back), or why not.
function askMemoryTurn(q, mi){
  const name = whoAmI(), who = name ? name.split(/\s+/)[0] : '', where = name ? `On this device, for ${who}.` : 'On this device (no name set).';
  const a = { local: true, mem: true, fromHub: false, headline: '', sayLabel: '', say: '', details: '', sourceIds: [], lessonIds: [], actions: [], suggestTerm: { en: '', es: '', def: '' } };
  const t = { id: 'q' + Date.now().toString(36), q, status: 'done', labels: {}, go: {}, actions: [{ type: 'open_memory', target: 'memory' }], answer: a, doneAt: Date.now() };
  const list = k => `${DR_MEM_FIELDS[k].label}: ${drPrefLabel(k, drPref(k))}`;
  if(askLooksLikePatientInfo(q)){
    a.headline = 'I don’t remember patient details';
    a.details = 'Only a few preferences: explanation language, brief or detailed answers, study focus, how I move, and whether to use your practice record. Nothing was saved.';
    return t;
  }
  if(mi.kind === 'show'){
    const keys = Object.keys(drMemGet());
    a.headline = keys.length ? 'Here’s what I remember' : 'I don’t remember anything for you yet';
    a.details = (keys.length ? keys.map(list).join(' · ') + '. ' : 'Ask me to remember a preference, like “Remember I like brief answers.” ') + where;
    return t;
  }
  if(mi.kind === 'forget'){
    if(!mi.keys.length){ a.headline = 'What should I forget?'; a.details = 'Say which one, or “forget everything”. ' + where; return t; }
    const all = mi.keys[0] === 'all', before = drMemGet();
    const saved = drMemForget(all ? 'all' : mi.keys[0]);
    if(!all) mi.keys.slice(1).forEach(k => drMemForget(k));
    t.undo = all ? before : Object.fromEntries(mi.keys.filter(k => k in before).map(k => [k, before[k]]));
    a.headline = saved ? (all ? 'Forgotten. I don’t remember anything for you now.' : `Forgotten: ${mi.keys.map(k => DR_MEM_FIELDS[k].label.toLowerCase()).join(', ')}`) : 'I couldn’t update this phone’s storage';
    a.details = saved ? where : 'It’s forgotten until you close the app, but the phone may still have the old choice.';
    if(Object.keys(t.undo).length) t.actions.unshift({ type: 'mem_undo', target: 'undo' });
    return t;
  }
  const keys = Object.keys(mi.changes).filter(k => k in DR_MEM_FIELDS);
  if(!keys.length){
    a.headline = mi.changes.focusUnknown ? 'Which specialty are you studying?' : 'I can remember a few things';
    a.details = mi.changes.focusUnknown ? 'Say it the way it’s named in the Hub, like “Remember I’m studying Oncology.”'
      : 'Explanation language, brief or detailed answers, your study focus, how I move, and whether to use your practice record.';
    return t;
  }
  const before = drMemGet(), res = keys.map(k => drMemSet(k, mi.changes[k]));
  t.undo = Object.fromEntries(keys.map(k => [k, k in before ? before[k] : null]));
  const saved = res.every(r => r.saved);
  a.headline = saved ? 'Saved on this device' : 'I couldn’t save that on this phone';
  a.details = keys.map(list).join(' · ') + '. ' + (saved ? where + ' Change or forget it in What I remember.'
    : 'This phone isn’t letting the Hub store anything right now (private browsing or full storage). I’ll use it until you close the app.');
  t.memSaved = saved;
  t.actions.unshift({ type: 'mem_undo', target: 'undo' });
  return t;
}

/* ---------- Ask the Hub: your practice and the next step ---------- */
/* Your own practice, when you've switched it on: what's unfinished, what's
   still learning (in your focus first), what's due. Counts only. */
function askUnfinished(){
  if(quizActive && quizQuestions.length && quizIndex < quizQuestions.length) return { kind: 'quiz', done: quizIndex, total: quizQuestions.length };
  if(reviewActive && reviewIndex < reviewQueue.length) return { kind: 'review', done: reviewIndex, total: reviewQueue.length };
  { const s = reviewStored(); if(s) return { kind: 'review', done: s.i, total: s.ids.length }; }   // paused, or left when the app closed
  try{
    const st = prepDeckStored();
    if(st && typeof st.key === 'string' && Array.isArray(st.queue)){
      const [dom, day] = st.key.split('|');
      if(day === warmupDay() && st.i > 0 && st.i < st.queue.length && askSpecialties().some(d => d.id === dom)) return { kind: 'prep', id: dom, done: st.i, total: st.queue.length };
    }
  }catch(e){}
  return null;
}
function askPractice(rec){
  if(drPref('practice') !== 'on') return null;
  const focus = drPref('focus'), learning = rec.loaded ? askLearningTerms() : [];
  const u = askUnfinished();
  return { learning: learning.length, learningInFocus: focus ? learning.filter(t => askTopOf(t.categoryId) === focus).length : 0,
    due: rec.loaded ? dueReviewCount() : 0, unfinished: u ? { ...u, id: u.kind === 'prep' ? 'spec:' + u.id : u.kind } : null };
}
function askTopOf(catId){ const c = DATA.categories.find(x => x.id === catId); return c ? (c.parentId || c.id) : ''; }
// The one next step worth offering, from your own record.
function askNextStep(rec){
  const u = askUnfinished();
  if(u) return { type: u.kind === 'prep' ? 'continue_prep' : u.kind === 'quiz' ? 'continue_quiz' : 'continue_review', target: u.kind === 'prep' ? 'spec:' + u.id : u.kind };
  if(rec.loaded && askLearningTerms().length) return { type: 'practice_learning', target: 'learning' };
  if(rec.loaded && dueReviewCount()) return { type: 'start_review', target: 'review' };
  return null;
}
// On Ask's hello: one next step, at most once a day per step, only when
// practice is switched on. ✕ puts it away for the day.
let askNextOffer = null;
async function askNextOfferSync(){
  // Already offered and still possible: it stays put through repaints (it's
  // the same offer, not a new one); otherwise at most one new one a day.
  if(askNextOffer && drPref('practice') === 'on' && !ASK.turns.filter(t => !t.hidden).length && askCheckAction(askNextOffer.step, { n: 5 }).ok){
    const el = document.getElementById('askNext'); if(el) el.outerHTML = askNextHtml(); return;
  }
  askNextOffer = null;
  if(drPref('practice') !== 'on' || ASK.turns.length) return;
  const rec = await askLoadRecord(), step = askNextStep(rec);
  if(!step) return;
  const key = step.type + ':' + step.target;
  if(drMemShownToday(key)) return;
  const fake = { n: 5 }, chk = askCheckAction(step, fake);
  if(!chk.ok) return;
  askNextOffer = { step, key, label: chk.label };
  drMemMarkShown(key);
  const el = document.getElementById('askNext');
  if(el) el.outerHTML = askNextHtml();
}
function askNextHtml(){
  if(!askNextOffer) return '<div id="askNext" hidden></div>';
  return `<div class="ask-next" id="askNext"><span>Next for you</span><button type="button" class="ask-do-btn is-main" onclick="askNextGo()">${escapeHtml(askNextOffer.label)}</button>
    <button type="button" class="ask-next-x" onclick="askNextOffer=null; this.parentElement.outerHTML=askNextHtml()" aria-label="Not now">✕</button></div>`;
}
async function askNextGo(){
  if(!askNextOffer) return;
  const t = { id: 'next' + Date.now().toString(36), q: '', status: 'done', labels: {}, go: {}, n: 5, actions: [askNextOffer.step], answer: null, hidden: true };
  ASK.turns.push(t);
  askNextOffer = null;
  await askRunAction(t.id, 0);
  ASK.turns = ASK.turns.filter(x => x !== t);
}

/* ---------- Dr. Smiley's memory screen ---------- */
/* What I remember: view, change, forget. */
function openMemory(){
  let ov = document.getElementById('memOverlay');
  if(!ov){
    ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'memOverlay';
    ov.addEventListener('click', e => { if(e.target === ov) closeMemory(); });
    document.body.appendChild(ov);
  }
  renderMemory();
  ov.classList.add('show');
}
function closeMemory(){ document.getElementById('memOverlay')?.classList.remove('show'); }
function renderMemory(status){
  const ov = document.getElementById('memOverlay');
  if(!ov) return;
  const mine = drMemGet(), name = whoAmI(), others = drMemOthers();
  const row = (k, body) => `<div class="mem-row"><div class="mem-row-head"><span>${DR_MEM_FIELDS[k].label}</span>${k in mine
    ? `<button type="button" class="mem-forget" onclick="memForget('${k}')">Forget</button>` : '<small>Not remembered · default</small>'}</div>${body}</div>`;
  const opts = k => `<div class="mem-opts" role="radiogroup" aria-label="${escapeAttr(DR_MEM_FIELDS[k].label)}">${DR_MEM_FIELDS[k].options.map(([v, l]) =>
    `<button type="button" role="radio" aria-checked="${drPref(k) === v}" onclick="memSet('${k}','${v}')">${escapeHtml(l)}</button>`).join('')}</div>`;
  const focus = `<select class="mem-select" aria-label="Study focus" onchange="memSet('focus', this.value)"><option value="">None</option>${askSpecialties().map(d =>
    `<option value="${escapeAttr(d.id)}"${drPref('focus') === d.id ? ' selected' : ''}>${escapeHtml(d.name)}</option>`).join('')}</select>`;
  ov.innerHTML = `<div class="modal mem-sheet" role="dialog" aria-modal="true" aria-labelledby="memTitle">
    <h3 id="memTitle">What Dr. Smiley remembers</h3>
    <p class="mem-where"><b>On this device</b> · ${name ? 'for ' + escapeHtml(name) : 'no name set on this phone'}</p>
    ${drMemFailed ? `<p class="mem-warn" role="alert">This phone isn’t letting the Hub store anything right now (private browsing or full storage). Changes last until you close the app.</p>` : ''}
    ${row('lang', opts('lang'))}${row('length', opts('length'))}${row('focus', focus)}${row('mode', opts('mode'))}
    ${row('practice', `<p class="mem-help">He can suggest continuing practice you left unfinished, from your own record. Team points aren’t yours alone, so he never counts them.</p>${opts('practice')}`)}
    <p class="mem-status" id="memStatus" role="status">${status ? escapeHtml(status) : ''}</p>
    <p class="mem-note">Kept only on this phone, under the name set here. Not shared with the team, and never patient details. The ones that shape answers (language, length, focus, and your practice counts when on) go with your questions.</p>
    ${others.length ? `<div class="mem-others"><span>Also on this phone</span>${others.map(o => `<button type="button" onclick="memForgetOther('${escapeAttr(o.key)}')">Forget ${escapeHtml(o.key === '_' ? 'no-name' : o.key)}’s (${o.n})</button>`).join('')}</div>` : ''}
    <div class="modal-actions"><button type="button" class="btn btn-ghost mem-forget-all" onclick="memForget('all')"${Object.keys(mine).length ? '' : ' disabled'}>Forget everything</button>
      <button type="button" class="btn btn-primary" onclick="closeMemory()">Done</button></div>
  </div>`;
}
function memSet(k, v){
  const r = drMemSet(k, v);
  renderMemory(!r.ok ? 'That isn’t one of the choices.' : r.saved ? `Saved: ${DR_MEM_FIELDS[k].label.toLowerCase()} · ${drPrefLabel(k, v)}` : 'Couldn’t save on this phone. Kept until you close the app.');
  if(k === 'practice' && activeCategory === 'ask') askNextOfferSync();
}
function memForget(k){
  const saved = drMemForget(k);
  renderMemory(saved ? (k === 'all' ? 'Forgotten. Everything is back to the defaults.' : `Forgotten: ${DR_MEM_FIELDS[k].label.toLowerCase()}`) : 'Couldn’t update this phone’s storage.');
}
function memForgetOther(key){
  const saved = drMemForget('all', key === '_' ? '' : key);
  renderMemory(saved ? 'Forgotten.' : 'Couldn’t update this phone’s storage.');
}

/* ---------- Ask the Hub: corrections, feedback, sources ---------- */
function askEditPhi(){
  const q = ASK.phi; ASK.phi = null; ASK.draft = q || '';
  renderAskMessages(true);
  const input = document.getElementById('askInput');
  if(input){ input.value = ASK.draft; input.focus(); }
  else drPanel.focusInput();
}
function askSendAnyway(){ const q = ASK.phi; ASK.phi = null; submitAsk(q, true); }

// Typed text lives in state, so a redraw from incoming data can't wipe it.
function askDraftFix(id, value){ const t = ASK.turns.find(x => x.id === id); if(t) t.fixDraft = value; }
function askHelpful(id){
  const t = ASK.turns.find(x => x.id === id);
  if(!t || t.helpful) return;
  t.helpful = true; renderAskMessages(false);
  // You thanked him: he's pleased (done reading, too).
  drTaskEnd('ask:' + id);
  drPerform('love', { priority: DR_P.DIRECT });
}

function askToggleFix(id, open){
  const t = ASK.turns.find(x => x.id === id);
  if(!t) return;
  t.fixOpen = open;
  renderAskMessages(false);
  if(open){
    const el = document.getElementById('askFix-' + id);
    if(el){ el.scrollIntoView({ block: 'nearest' }); if(prefersAutoFocus()) el.focus(); }
  }
}

function askSendFix(id){
  const t = ASK.turns.find(x => x.id === id);
  const el = document.getElementById('askFix-' + id);
  const note = ((el ? el.value : '') || (t && t.fixDraft) || '').trim().slice(0, 1000);
  if(!t || !t.answer) return;
  if(!note){ showToast('Write what works better first.'); if(el) el.focus(); return; }
  requireName(async () => {
    try{
      await db.collection('hub-lessons').add({
        question: (t.fixOf || t.q).slice(0, 500),
        headline: (t.answer.headline || '').slice(0, 200),
        termIds: [...new Set((t.answer.sourceIds || []).concat(t.subjectIds || []))].slice(0, 20),
        note,
        status: 'pending',
        suggestedBy: whoAmI().slice(0, 60),
        suggestedAt: Date.now()
      });
      t.fixOpen = false; t.fixSent = true;
      renderAskMessages(false);
      showToast(`Sent to ${askOwnerFirst()} for review.`);
      drTaskEnd('ask:' + id);
      drPerform('ack', { priority: DR_P.TASK });   // noted
    }catch(err){
      drPerform('composed', { priority: DR_P.TASK });
      showToast(err && err.code === 'permission-denied'
        ? "Couldn't save it: the new Firebase rules aren't published yet."
        : "Couldn't save it. Check your connection and try again.");
    }
  });
}

function askAddTerm(id){
  const t = ASK.turns.find(x => x.id === id);
  if(!t || !t.answer || !t.answer.suggestTerm) return;
  const s = t.answer.suggestTerm;
  requireName(() => {
    _openAddModal(false);
    document.getElementById('fEn').value = s.en || '';
    document.getElementById('fEs').value = s.es || '';
    document.getElementById('fDef').value = s.def || '';
  });
}

function askOpenSource(turnId, id){
  const t = ASK.turns.find(x => x.id === turnId);
  const go = t && t.go && t.go[id];
  if(!go) return;
  if(go.guide){ openGuideTopic(go.guide); return; }
  if(go.term){ revealTerm(go.cat, go.term); return; }
  setCategory(go.cat);
}

/* ---- Owner: lessons to review ---- */
function renderAskReview(){
  const pending = askPendingLessons().sort((a, b) => (a.suggestedAt || 0) - (b.suggestedAt || 0));
  const approved = ASK.lessons.filter(l => l.status === 'approved').sort((a, b) => (b.reviewedAt || 0) - (a.reviewedAt || 0));
  const when = ms => ms ? new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
  return `
    <div class="ask-head">
      <div class="ask-head-text"><h1>Lessons to review</h1><p>Corrections teammates sent from Ask the Hub. Nothing reaches anyone until you approve it.</p></div>
      <span class="ask-face" aria-hidden="true">${askFaceSvg()}</span>
    </div>
    <button type="button" class="btn btn-ghost ask-back" onclick="ASK.view='chat'; renderContent()">← Back to Ask the Hub</button>
    ${ASK.lessonsBlocked ? `<div class="ta-card"><p>Lessons can't load: the new Firebase rules aren't published yet.</p></div>` : ''}
    <div class="ta-card">
      <span class="ta-label">Waiting · ${pending.length}</span>
      ${pending.length ? pending.map(l => `
        <div class="ask-lesson">
          <p class="ask-lesson-q">On: “${escapeHtml(l.question)}”</p>
          ${l.headline ? `<p class="ask-lesson-a">The answer said: ${escapeHtml(l.headline)}</p>` : ''}
          <label class="sr-only" for="askLesson-${l.id}">Team note</label>
          <textarea class="ta-field ask-lesson-edit" id="askLesson-${l.id}" rows="3" maxlength="1000" data-id="${l.id}" oninput="ASK.edits[this.dataset.id]=this.value">${escapeHtml(ASK.edits[l.id] != null ? ASK.edits[l.id] : l.note)}</textarea>
          <p class="ask-lesson-by">From ${escapeHtml(l.suggestedBy || 'a teammate')} · ${when(l.suggestedAt)}. You can edit the note before approving.</p>
          <div class="ta-row2">
            <button type="button" class="btn btn-ghost" onclick="askReviewLesson('${l.id}','declined')">Decline</button>
            <button type="button" class="btn btn-primary" onclick="askReviewLesson('${l.id}','approved')">Approve</button>
          </div>
        </div>`).join('') : `<p>Nothing waiting. When a teammate taps Correct this, it shows up here.</p>`}
    </div>
    <div class="ta-card">
      <span class="ta-label">In use · ${approved.length}</span>
      ${approved.length ? approved.map(l => `
        <div class="ask-lesson">
          <p class="ask-lesson-q">On: “${escapeHtml(l.question)}”</p>
          <p class="ask-say">${escapeHtml(l.note)}</p>
          <p class="ask-lesson-by">${escapeHtml(l.suggestedBy || 'A teammate')} · approved ${when(l.reviewedAt)}</p>
          <div class="ta-row2"><button type="button" class="btn btn-ghost" onclick="askReviewLesson('${l.id}','retired')">Stop using this note</button></div>
        </div>`).join('') : `<p>No team notes yet.</p>`}
    </div>`;
}

async function askReviewLesson(id, status){
  const l = ASK.lessons.find(x => x.id === id);
  if(!l) return;
  const edit = document.getElementById('askLesson-' + id);
  const note = (status === 'approved' ? (edit ? edit.value : (ASK.edits[id] != null ? ASK.edits[id] : l.note)) : (l.note || '')).trim().slice(0, 1000);
  if(status === 'approved' && !note){ showToast('The note is empty.'); return; }
  try{
    await db.collection('hub-lessons').doc(id).update({ status, note, reviewedBy: (whoAmI() || ACCESS.ownerName || 'owner').slice(0, 60), reviewedAt: Date.now() });
    showToast(status === 'approved' ? 'Approved. Everyone gets this now.' : status === 'declined' ? 'Declined. Nothing changed.' : 'That note is no longer used.');
  }catch(err){
    showToast("Couldn't save that. Check your connection and try again.");
  }
}

// The conversation fills the space between the header and the floating tab
// bar, so the question box is never under the tab bar or below the screen.
// Phone heights differ too much for one CSS value (an iPhone SE has 568px).
function fitAskPanel(){
  const panel = document.querySelector('.ask-panel');
  if(!panel) return;
  const bar = document.querySelector('.tabbar');
  const barRect = bar && getComputedStyle(bar).display !== 'none' ? bar.getBoundingClientRect() : null;
  const bottom = barRect && barRect.top > 0 && barRect.top < innerHeight ? barRect.top - 9 : innerHeight - 13;
  const top = panel.getBoundingClientRect().top + window.scrollY;
  panel.style.height = Math.max(240, Math.round(bottom - top)) + 'px';
}
