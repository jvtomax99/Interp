/* Sound-Alikes, the screen (renderSoundAlikes: the front page, the list
   with its filter and search, the drill; the list itself is
   soundalikes/list.js). Built 2026-10-29 on the False Friends pattern
   (features/false-friends.js), dressed in CoreCHI Practice's classes (its
   blue cp-card, cp-play, mastery rows and candy buttons) and False Friends'
   ff-* cards; its own styles are the "Sound-Alikes" block in app.css.
   docs/features/sound-alikes.md. Loaded by a plain <script src> just before
   index.html's own script. Nothing here runs as the page loads (only
   declarations); the names it uses from index.html (render, escapeHtml,
   escapeAttr, foldText, shuffle, showToast, ICON_SPEAKER) are read when a
   function runs. Nothing is stored: not the drill, not the results. */

/* ---------- Sound-Alikes ---------- */

const SA_KINDS = {
  same: { label:'Sound the same', color:'#7A5BA8' },
  near: { label:'Sound close',    color:'#B08D2A' },
};
const SA_ES_COLOR = '#2E8BD0';
const SA_DRILL_LENGTH = 10;

/* The three groups the front page shows, in CoreCHI Practice's "Your
 * domains" style. Counts only: nothing here is a score, because nothing is
 * stored (docs/features/sound-alikes.md). */
const SA_GROUPS = [
  { key:'same', name:'Sound the same',   chip:'sound the same',   color:'#7A5BA8', blurb:'One sound, two or three spellings' },
  { key:'near', name:'Sound close',      chip:'sound close',      color:'#B08D2A', blurb:'A sound or two apart, easy to mishear' },
  { key:'es',   name:'Heard in Spanish', chip:'heard in Spanish', color:SA_ES_COLOR, blurb:'b and v, s and z, g and j: one sound each' },
];
function saInGroup(s, key){
  return key === 'all' || (key === 'es' ? s.lang === 'es' : (s.lang === 'en' && s.kind === key));
}

let saMode = 'home';       // 'home' (the groups) | 'study' (the list) | 'drill'
let saQuery = '';
let saFilter = 'all';      // the list's filter: 'all' | 'same' | 'near' | 'es'
let saGroup = 'all';       // what the drill draws from
let saEntered = -1;        // the question whose card last slid in
let saQuestions = [];
let saIndex = 0;
let saAnswers = [];
let saRevealed = false;
let saShowWords = false;

function saColor(s){ return s.lang === 'es' ? SA_ES_COLOR : (SA_KINDS[s.kind] || SA_KINDS.same).color; }
function saSet(id){ return SOUND_ALIKES.find(s => s.id === id); }

/* The device voice, like speakText, with two differences that matter here.
 * Spanish asks for a Latin American voice: a Spain voice says sien and cien,
 * taza and tasa differently (no seseo), which would hide the very thing the
 * set is about for patients here. And the drill has a slower replay. */
function saSpeak(btn, text, lang, slow){
  if(!('speechSynthesis' in window)){
    showToast('Speech isn’t supported in this browser. Tap Show the words.');
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang === 'es' ? 'es-US' : 'en-US';
  utter.rate = slow ? 0.62 : 0.92;
  if(lang === 'es'){
    const voices = synth.getVoices ? synth.getVoices() : [];
    const v = voices.find(v => /^es[-_](US|MX|419)/i.test(v.lang))
           || voices.find(v => /^es/i.test(v.lang) && !/^es[-_]ES/i.test(v.lang));
    if(v) utter.voice = v;
  }
  if(btn){
    btn.classList.add('speaking');
    const done = () => btn.classList.remove('speaking');
    utter.onend = done; utter.onerror = done;
  }
  synth.speak(utter);
}
function saSpeakWord(btn, id, i){
  const s = saSet(id), w = s && s.words[i];
  if(w) saSpeak(btn, w.w, s.lang);
}
function saSpeakLine(btn, id, i){
  const s = saSet(id), w = s && s.words[i];
  if(w) saSpeak(btn, w.line, s.lang);
}
// Every spelling one after another, so you hear that they match.
function saSpeakAll(btn, id){
  const s = saSet(id);
  if(s) saSpeak(btn, s.words.map(w => w.w).join('. ') + '.', s.lang);
}

function saMatches(s, q){
  if(!q) return true;
  const needle = foldText(q).toLowerCase();
  return [s.tag, s.note, ...s.words.flatMap(w => [w.w, w.means, w.say, w.line])]
    .some(v => foldText(v || '').toLowerCase().includes(needle));
}
function saFiltered(){
  return SOUND_ALIKES
    .filter(s => saInGroup(s, saFilter))
    .filter(s => saMatches(s, saQuery));
}

function saHush(){ window.speechSynthesis && window.speechSynthesis.cancel(); }
function saHome(){ saHush(); saMode = 'home'; render(); window.scrollTo(0, 0); }
function saOpenList(f){ saHush(); saFilter = f || 'all'; saQuery = ''; saMode = 'study'; render(); window.scrollTo(0, 0); }
// Called from a tap, so iPhone Safari lets the first sentence speak.
function saStartDrill(g){
  saHush(); saGroup = g || 'all'; buildSADrill(); saMode = 'drill';
  render(); window.scrollTo(0, 0); saPlay();
}
function setSAMode(mode){
  if(mode === 'drill') saStartDrill(saGroup); else if(mode === 'study') saOpenList(saFilter); else saHome();
}
function setSAFilter(f){ saFilter = f; render(); }
function saSearch(value){
  saQuery = value;
  // Only the list: redrawing the screen would throw away focus mid-word.
  const list = document.getElementById('saList');
  if(list) list.innerHTML = renderSACards();
}

/* One question per set: a sentence holding one of its spellings. The other
 * spellings' renderings are the options that matter, because hearing the
 * wrong one is the mistake this trains against. Renderings from other sets
 * in the same language fill it up to four, so a pair isn't a coin toss. */
function buildSADrill(){
  const sets = shuffle(SOUND_ALIKES.filter(s => saInGroup(s, saGroup))).slice(0, SA_DRILL_LENGTH);
  saQuestions = sets.map(s => {
    const wi = Math.floor(Math.random() * s.words.length);
    const own = s.words.map(w => w.say);
    const fill = shuffle(SOUND_ALIKES.filter(o => o.id !== s.id && o.lang === s.lang).flatMap(o => o.words.map(w => w.say)))
      .filter(x => !own.includes(x)).slice(0, Math.max(0, 4 - own.length));
    const options = shuffle([...own, ...fill]);
    const answer = options.indexOf(s.words[wi].say);
    const lures = own.filter((x, i) => i !== wi).map(x => options.indexOf(x));
    return { id:s.id, wi, options, answer, lures };
  });
  saIndex = 0; saAnswers = []; saRevealed = false; saShowWords = false; saEntered = -1;
}

function saPlay(slow){
  const q = saQuestions[saIndex];
  if(!q) return;
  const s = saSet(q.id);
  saSpeak(document.getElementById('saPlay'), s.words[q.wi].line, s.lang, slow);
}
function saToggleWords(){ saShowWords = !saShowWords; render(); }
function answerSA(i){
  if(saRevealed) return;
  saAnswers[saIndex] = i;
  saRevealed = true;
  render();
}
function nextSA(){
  saIndex++; saRevealed = false; saShowWords = false;
  render();
  if(saIndex < saQuestions.length) saPlay();
}
function restartSADrill(){ saStartDrill(saGroup); }

// The sentence with its sound-alike blanked out: context without the spelling.
function saBlanked(line, w){
  const esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escapeHtml(line).replace(new RegExp('(^|[^\\p{L}])(' + escapeHtml(esc) + ')(?=[^\\p{L}]|$)', 'iu'),
    (m, pre) => pre + '<span class="sa-blank" aria-label="the sound-alike">        </span>');
}
// The same sentence with the word picked out, once it has been answered.
function saMarked(line, w){
  const esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escapeHtml(line).replace(new RegExp('(^|[^\\p{L}])(' + escapeHtml(esc) + ')(?=[^\\p{L}]|$)', 'iu'),
    (m, pre, word) => pre + '<b class="sa-hit">' + word + '</b>');
}

const SA_RAE = 'https://dle.rae.es/';
const SA_MW = 'https://www.merriam-webster.com/medical/';
function saSources(s){
  const link = (base, e) => `<a href="${base + encodeURIComponent(e)}" target="_blank" rel="noopener">${escapeHtml(e)}</a>`;
  const parts = [];
  if(s.mw && s.mw.length) parts.push('Merriam-Webster Medical: ' + s.mw.map(e => link(SA_MW, e)).join(', '));
  if(s.rae && s.rae.length) parts.push('RAE: ' + s.rae.map(e => link(SA_RAE, e)).join(', '));
  return parts.length ? `<p class="sa-src">Sources: ${parts.join(' · ')}</p>` : '';
}

function saCard(s){
  const kind = SA_KINDS[s.kind] || SA_KINDS.same;
  const id = escapeAttr(JSON.stringify(s.id));
  return `
    <article class="ff-card sa-card" style="--ff-color:${saColor(s)};">
      <div class="ff-head">
        <h3 class="ff-es">${s.words.map(w => escapeHtml(w.w)).join('<span class="sa-dot"> · </span>')}</h3>
        <span class="ff-badge">${escapeHtml(kind.label)}</span>
        ${s.lang === 'es' ? '<span class="ff-badge sa-es">Heard in Spanish</span>' : ''}
        <span class="ff-tag">${escapeHtml(s.tag)}</span>
      </div>
      <button type="button" class="sa-all" onclick="saSpeakAll(this, ${id})">${ICON_SPEAKER}<span>Hear them all</span></button>
      <ul class="sa-words">${s.words.map((w, i) => `
        <li class="sa-word">
          <div class="sa-word-head">
            <button type="button" class="sa-say" aria-label="Hear ${escapeAttr(w.w)}" onclick="saSpeakWord(this, ${id}, ${i})">${ICON_SPEAKER}</button>
            <b class="sa-w">${escapeHtml(w.w)}</b>
            <span class="sa-means">${escapeHtml(w.means)}</span>
          </div>
          <p class="sa-to"><span>${s.lang === 'es' ? 'In English' : 'In Spanish'}</span> <b>${escapeHtml(w.say)}</b></p>
          <div class="ff-example sa-example">
            <button type="button" class="sa-say sa-say-line" aria-label="Hear the sentence" onclick="saSpeakLine(this, ${id}, ${i})">${ICON_SPEAKER}</button>
            <div>
              <p class="ff-heard">&ldquo;${saMarked(w.line, w.w)}&rdquo;</p>
              <p class="sa-line-to">${escapeHtml(w.lineTo)}</p>
            </div>
          </div>
        </li>`).join('')}
      </ul>
      ${s.note ? `<p class="ff-note">${escapeHtml(s.note)}</p>` : ''}
      ${saSources(s)}
      ${s.esChecked ? '' : `<p class="sa-unchecked">${s.lang === 'es' ? 'English' : 'Spanish'} not yet checked by a staff interpreter.</p>`}
    </article>`;
}

function renderSACards(){
  const list = saFiltered();
  if(!list.length) return `<div class="ff-empty">No sound-alike matches that. Try a spelling, a meaning, the Spanish or a specialty.</div>`;
  return list.map(saCard).join('');
}

function renderSAStudy(){
  const n = f => SOUND_ALIKES.filter(s => f === 'es' ? s.lang === 'es' : (s.lang === 'en' && s.kind === f)).length;
  const chip = (f, label, count) => `<button type="button" class="ff-chip${saFilter===f?' is-active':''}" onclick="setSAFilter('${f}')">${label} ${count}</button>`;
  return `
    <div class="ff-filters">
      ${chip('all', 'All', SOUND_ALIKES.length)}${chip('same', 'Sound the same', n('same'))}${chip('near', 'Sound close', n('near'))}${chip('es', 'Heard in Spanish', n('es'))}
    </div>
    <div class="search ff-search" style="margin-bottom:17px;">
      <input type="text" id="saSearch" placeholder="Search a word, a meaning, or a specialty…"
             value="${escapeHtml(saQuery)}" oninput="saSearch(this.value)" aria-label="Search sound-alikes">
    </div>
    <div class="ff-list" id="saList">${renderSACards()}</div>`;
}

function renderSADrill(){
  if(!saQuestions.length) return `<div class="ff-empty">No drill questions available.</div>`;

  if(saIndex >= saQuestions.length){
    const correct = saQuestions.reduce((n, q, i) => n + (saAnswers[i] === q.answer ? 1 : 0), 0);
    const lured = saQuestions.reduce((n, q, i) => n + (q.lures.includes(saAnswers[i]) ? 1 : 0), 0);
    const pct = Math.round(correct / saQuestions.length * 100);
    const missed = saQuestions.filter((q, i) => saAnswers[i] !== q.answer);
    return `
      <div class="quiz-card">
        <div class="results-head"><div class="ff-score"><b>${correct} / ${saQuestions.length}</b><span>${pct}%</span></div></div>
        <p class="results-summary">${lured
          ? `The other spelling caught you ${lured === 1 ? 'once' : lured + ' times'}. Those are the pairs worth hearing again in Study.`
          : `The other spelling never caught you. That is the result that matters here.`}</p>
        ${missed.length ? `<div class="ff-list" style="margin-top:17px;">${missed.map(q => saCard(saSet(q.id))).join('')}</div>` : ''}
        <div class="quiz-actions" style="margin-top:17px;">
          <button class="btn primary" onclick="restartSADrill()">Drill again</button>
          <button class="btn" onclick="saHome()">All groups</button>
        </div>
      </div>`;
  }

  const q = saQuestions[saIndex], s = saSet(q.id), w = s.words[q.wi];
  const chosen = saAnswers[saIndex];
  const pct = Math.round(saIndex / saQuestions.length * 100);
  const letters = ['A','B','C','D'];
  const kind = SA_KINDS[s.kind] || SA_KINDS.same;
  const to = s.lang === 'es' ? 'English' : 'Spanish';

  // Slides in only on a new question, like CoreCHI's quiz: answering redraws
  // the card too, and replaying the entrance then would flinch under a thumb.
  const entering = saIndex !== saEntered;
  saEntered = saIndex;
  let html = `<div class="quiz-card${entering ? ' is-entering' : ''}" style="--dom:${saColor(s)};">
    <div class="quiz-progress-track"><span class="quiz-progress-fill" style="width:${pct}%"></span><span class="quiz-pip" style="left:${pct}%"></span></div>
    <div class="quiz-meta">
      <span class="tag" style="--tag-color:${saColor(s)};">${s.lang === 'es' ? 'Heard in Spanish' : escapeHtml(kind.label)}</span>
      <span class="quiz-counter">${saIndex + 1} / ${saQuestions.length}</span>
    </div>
    <p class="ff-drill-prompt">Listen</p>
    <div class="sa-play-row">
      <button type="button" id="saPlay" class="cp-play sa-play sa-hear" onclick="saPlay()">${ICON_SPEAKER}<span>Hear again</span></button>
      <button type="button" class="mastery-go sa-play sa-slow" onclick="saPlay(true)"><span>Slower</span></button>
      <button type="button" class="mastery-go sa-play sa-show" aria-pressed="${saShowWords || saRevealed}" ${saRevealed ? 'disabled' : ''} onclick="saToggleWords()"><span>${saShowWords ? 'Hide the words' : 'Show the words'}</span></button>
    </div>
    ${saRevealed
      ? `<p class="ff-drill-heard sa-heard">&ldquo;${saMarked(w.line, w.w)}&rdquo;</p>`
      : (saShowWords ? `<p class="ff-drill-heard sa-heard">&ldquo;${saBlanked(w.line, w.w)}&rdquo;</p>` : '')}
    <p class="sa-ask">Which ${to} fits the sound-alike in that sentence?</p>
    <div class="quiz-options">`;

  q.options.forEach((opt, i) => {
    let cls = '';
    if(saRevealed){
      if(i === q.answer) cls = 'correct';
      else if(i === chosen) cls = 'wrong';
    }
    html += `<button class="quiz-option ${cls}" ${saRevealed ? 'disabled' : ''} onclick="answerSA(${i})">
      <span class="opt-letter">${letters[i]}</span><span>${escapeHtml(opt)}</span>
    </button>`;
  });
  html += `</div>`;

  if(saRevealed){
    const right = chosen === q.answer;
    const lead = right ? 'Correct.' : (q.lures.includes(chosen) ? 'That is the other spelling.' : 'Not quite.');
    const others = s.words.filter((x, i) => i !== q.wi).map(x => `${escapeHtml(x.w)} (${escapeHtml(x.means)})`).join(', ');
    html += `<div class="quiz-explain"><b>${lead}</b> Here it is <b>${escapeHtml(w.w)}</b>, ${escapeHtml(w.means)}: ${escapeHtml(w.say)}. It sounds like ${others}.</div>
      <div class="ff-example"><div class="ff-line ff-true"><span class="ff-line-mark">&#10003;</span><span>${escapeHtml(w.lineTo)}</span></div></div>
      <div class="quiz-actions" style="margin-top:17px;">
        <button class="btn primary" onclick="nextSA()">${saIndex + 1 >= saQuestions.length ? 'See results' : 'Next'}</button>
      </div>`;
  }
  return html + `</div>`;
}

/* The front page, in CoreCHI Practice's clothes: its blue card with the
 * chunky yellow button, then the groups as its domain rows with candy
 * buttons. The card's sample pair speaks, and its bars move while it does. */
function renderSAHome(){
  // Arriving slides the blocks in; a redraw while already here doesn't.
  const arriving = !document.querySelector('#content .sa-hero');
  const din = arriving ? ' dash-in' : '';
  const pair = saSet('ileum') || SOUND_ALIKES[0];
  const pid = escapeAttr(JSON.stringify(pair.id));
  const bars = [5, 9, 14, 8, 12, 6, 10, 4].map((h, i) => `<i style="--h:${h}; --b:${i}"></i>`).join('');
  const count = g => SOUND_ALIKES.filter(s => saInGroup(s, g.key)).length;
  const rows = SA_GROUPS.map((g, i) => {
    const sets = SOUND_ALIKES.filter(s => saInGroup(s, g.key));
    const words = sets.reduce((n, s) => n + s.words.length, 0);
    const samples = sets.slice(0, 3).map(s => `<span class="sa-sample">${s.words.map(w => escapeHtml(w.w)).join(' \u00b7 ')}</span>`).join('');
    return `
      <div class="mastery-row sa-group${din}" style="--dom:${g.color}; --i:${i + 1}">
        <div class="mastery-top">
          <span class="mastery-dot"></span>
          <span class="mastery-id">
            <span class="mastery-name">${escapeHtml(g.name)}</span>
            <span class="mastery-weight">${escapeHtml(g.blurb)}</span>
          </span>
          <span class="mastery-pct">${sets.length}<small> sets</small></span>
        </div>
        <div class="sa-samples">${samples}</div>
        <div class="mastery-foot">
          <span class="mastery-stats">${words} words to hear</span>
          <button type="button" class="mastery-go sa-list-go" onclick="saOpenList('${g.key}')" aria-label="List ${escapeAttr(g.name)}">List</button>
          <button type="button" class="mastery-go" onclick="saStartDrill('${g.key}')" aria-label="Practise ${escapeAttr(g.name)}">Practise</button>
        </div>
      </div>`;
  }).join('');
  return `
    <div class="section-head"><h2>Sound-Alikes</h2><span class="sub">${SOUND_ALIKES.length} sets</span></div>
    <div class="cp-card sa-hero${din}" style="--i:0">
      <div class="cp-hud"><small>Train your ear</small></div>
      <div class="sa-pair">
        <button type="button" class="sa-pair-say" onclick="saSpeakAll(this, ${pid})" aria-label="Hear ${escapeAttr(pair.words.map(w => w.w).join(' and '))}">${ICON_SPEAKER}</button>
        <span class="sa-wave" aria-hidden="true">${bars}</span>
        <p class="sa-pair-words">${pair.words.map(w => `<b>${escapeHtml(w.w)}</b>`).join('<span>sounds like</span>')}</p>
        <p class="sa-pair-means">${pair.id === 'ileum' ? 'Bowel, or hip bone.' : escapeHtml(pair.words.map(w => w.means).join(' \u00b7 ')) + '.'} Heard in a hallway, only context tells them apart.</p>
      </div>
      <div class="cp-chips">${SA_GROUPS.map(g => `<span class="cp-chip"><b>${count(g)}</b> ${escapeHtml(g.chip)}</span>`).join('')}</div>
      <div class="cp-go">
        <button type="button" class="cp-play" onclick="saStartDrill('all')">Drill by ear</button>
        <button type="button" class="cp-exam" onclick="saOpenList('all')">Study the list</button>
      </div>
    </div>
    <div class="section-head"><h2>Your groups</h2><span class="sub">hear them, then drill</span></div>
    <div class="mastery-list">${rows}</div>`;
}

function renderSoundAlikes(){
  if(saMode === 'home') return renderSAHome();
  const g = SA_GROUPS.find(x => x.key === (saMode === 'drill' ? saGroup : saFilter));
  const title = g ? g.name : 'Sound-Alikes';
  if(saMode === 'drill'){
    const sub = saIndex < saQuestions.length ? `${saIndex + 1} of ${saQuestions.length}` : 'results';
    return `<div class="section-head"><h2>${escapeHtml(title)}</h2><span class="sub">${sub}</span>
        <button class="head-action" onclick="saHome()">Exit</button></div>
      ${renderSADrill()}`;
  }
  return `<div class="section-head"><h2>${escapeHtml(title)}</h2><span class="sub">${SOUND_ALIKES.filter(s => saInGroup(s, saFilter)).length} sets</span>
      <button class="head-action" onclick="saHome()">All groups</button></div>
    ${renderSAStudy()}`;
}
