/* False Friends, the screen (renderFalseFriends: Study and Drill, search,
   the risk filter; the list itself is falsefriends/list.js): moved verbatim
   out of index.html on 2026-10-24 (docs/split-index.md, phase 3). Loaded
   by a plain <script src> just before index.html's own script. Nothing
   here runs as the page loads (only declarations); the names it uses from
   index.html (renderContent, escapeHtml, FALSE_FRIENDS from its data
   file...) are read when a function runs. Keep it that way: a top-level
   line here that calls into index.html would run before index.html has. */

/* ---------- False Friends ---------- */

const FF_RISKS = {
  critical: { label:'Changes care', color:'#C2485C' },
  high:     { label:'Shifts meaning', color:'#B08D2A' },
  everyday: { label:'Everyday', color:'#5B7FBF' },
};
const FF_ORDER = ['critical','high','everyday'];

let ffMode = 'study';      // 'study' | 'drill'
let ffQuery = '';
let ffRisk = 'all';
let ffQuestions = [];
let ffIndex = 0;
let ffAnswers = [];        // chosen option index per question
let ffRevealed = false;
const FF_DRILL_LENGTH = 10;

function ffMatches(f, q){
  if(!q) return true;
  const needle = foldText(q).toLowerCase();
  return [f.es, f.looks, f.means, f.say, f.tag, f.note]
    .some(v => foldText(v || '').toLowerCase().includes(needle));
}

function ffFiltered(){
  return FALSE_FRIENDS
    .filter(f => ffRisk === 'all' || f.risk === ffRisk)
    .filter(f => ffMatches(f, ffQuery))
    .sort((a,b) => FF_ORDER.indexOf(a.risk) - FF_ORDER.indexOf(b.risk));
}

function setFFMode(mode){
  ffMode = mode === 'drill' ? 'drill' : 'study';
  // Opening the drill with no questions built yet starts one, so the tab
  // itself is the start button. Coming back to a drill in progress keeps it.
  if(ffMode === 'drill' && !ffQuestions.length) buildFFDrill();
  render();
}
function setFFRisk(risk){ ffRisk = risk; render(); }
function ffSearch(value){
  ffQuery = value;
  // Re-render only the list: re-rendering the screen would recreate the
  // input and throw away focus and the caret mid-word.
  const list = document.getElementById('ffList');
  if(list) list.innerHTML = renderFFCards();
}

/* Each question offers the real meaning against the false cognate it is
 * pretending to be. The tempting wrong answer is the whole point — a drill
 * whose distractors are unrelated teaches nothing about this particular
 * trap. Two further meanings are borrowed from other entries so the shape
 * of the options does not give the answer away. */
function buildFFDrill(){
  const pool = shuffle(FALSE_FRIENDS).slice(0, FF_DRILL_LENGTH);
  ffQuestions = pool.map(f => {
    const others = shuffle(FALSE_FRIENDS.filter(o => o.es !== f.es && o.means !== f.means))
      .slice(0, 2)
      .map(o => o.means);
    const lure = 'It means "' + f.looks + '"';
    const options = shuffle([f.means, lure, ...others]);
    return { f, options, answer: options.indexOf(f.means), lure: options.indexOf(lure) };
  });
  ffIndex = 0;
  ffAnswers = [];
  ffRevealed = false;
}

function answerFF(i){
  if(ffRevealed) return;
  ffAnswers[ffIndex] = i;
  ffRevealed = true;
  render();
}
function nextFF(){
  ffIndex++;
  ffRevealed = false;
  render();
}
function restartFFDrill(){ buildFFDrill(); render(); }

function renderFFCards(){
  const list = ffFiltered();
  if(!list.length){
    return `<div class="ff-empty">No false friend matches that. Try the Spanish word, the English word it imitates, or a specialty.</div>`;
  }
  return list.map(f => {
    const risk = FF_RISKS[f.risk] || FF_RISKS.everyday;
    return `
      <article class="ff-card" style="--ff-color:${risk.color};">
        <div class="ff-head">
          <h3 class="ff-es">${escapeHtml(f.es)}</h3>
          <span class="ff-badge">${escapeHtml(risk.label)}</span>
          <span class="ff-tag">${escapeHtml(f.tag)}</span>
        </div>
        <p class="ff-gloss">Looks like <span class="ff-looks">${escapeHtml(f.looks)}</span>. Actually means <span class="ff-means">${escapeHtml(f.means)}</span>.</p>
        <p class="ff-say">For <b>${escapeHtml(f.looks)}</b> you would say <b class="ff-correct">${escapeHtml(f.say)}</b>.</p>
        <div class="ff-example">
          <p class="ff-heard">&ldquo;${escapeHtml(f.heard)}&rdquo;</p>
          <div class="ff-line ff-trap"><span class="ff-line-mark">&#10007;</span><span>${escapeHtml(f.trap)}</span></div>
          <div class="ff-line ff-true"><span class="ff-line-mark">&#10003;</span><span>${escapeHtml(f.truth)}</span></div>
        </div>
        ${f.note ? `<p class="ff-note">${escapeHtml(f.note)}</p>` : ''}
      </article>`;
  }).join('');
}

function renderFFStudy(){
  const counts = FF_ORDER.map(r => ({ r, n: FALSE_FRIENDS.filter(f => f.risk === r).length }));
  const chips = [`<button type="button" class="ff-chip${ffRisk==='all'?' is-active':''}" onclick="setFFRisk('all')">All ${FALSE_FRIENDS.length}</button>`]
    .concat(counts.map(c =>
      `<button type="button" class="ff-chip${ffRisk===c.r?' is-active':''}" onclick="setFFRisk('${c.r}')">${escapeHtml(FF_RISKS[c.r].label)} ${c.n}</button>`))
    .join('');

  return `
    <div class="ff-intro">
      <b>A false friend is a word that looks like an English word and means something else.</b>
      Outside a hospital that is embarrassing. Inside one it changes care: <b>constipado</b>
      read as constipated sends a head cold toward a bowel workup. Each entry below shows
      the trap written out, so you can recognise it when you hear it.
    </div>
    <div class="ff-filters">${chips}</div>
    <div class="search ff-search" style="margin-bottom:17px;">
      <input type="text" id="ffSearch" placeholder="Search a word, a meaning, or a specialty…"
             value="${escapeHtml(ffQuery)}" oninput="ffSearch(this.value)" aria-label="Search false friends">
    </div>
    <div class="ff-list" id="ffList">${renderFFCards()}</div>`;
}

function renderFFDrill(){
  if(!ffQuestions.length) return `<div class="ff-empty">No drill questions available.</div>`;

  // Results
  if(ffIndex >= ffQuestions.length){
    const correct = ffQuestions.reduce((n,q,i) => n + (ffAnswers[i] === q.answer ? 1 : 0), 0);
    const lured   = ffQuestions.reduce((n,q,i) => n + (ffAnswers[i] === q.lure ? 1 : 0), 0);
    const pct = Math.round((correct / ffQuestions.length) * 100);
    const missed = ffQuestions.filter((q,i) => ffAnswers[i] !== q.answer);
    return `
      <div class="quiz-card">
        <div class="results-head">
          <div class="ff-score"><b>${correct} / ${ffQuestions.length}</b><span>${pct}%</span></div>
        </div>
        <p class="results-summary">${lured
          ? `The false cognate caught you ${lured === 1 ? 'once' : lured + ' times'}. That is the reflex this drill is for — those are the ones worth re-reading.`
          : `You did not take the false cognate once. That is the result that matters here.`}</p>
        ${missed.length ? `<div class="ff-list" style="margin-top:17px;">${missed.map(q => {
          const risk = FF_RISKS[q.f.risk] || FF_RISKS.everyday;
          return `<article class="ff-card" style="--ff-color:${risk.color};">
            <div class="ff-head"><h3 class="ff-es">${escapeHtml(q.f.es)}</h3><span class="ff-badge">${escapeHtml(risk.label)}</span></div>
            <p class="ff-gloss">Looks like <span class="ff-looks">${escapeHtml(q.f.looks)}</span>. Actually means <span class="ff-means">${escapeHtml(q.f.means)}</span>.</p>
          </article>`;
        }).join('')}</div>` : ''}
        <div class="quiz-actions" style="margin-top:17px;">
          <button class="btn primary" onclick="restartFFDrill()">Drill ten more</button>
          <button class="btn" onclick="setFFMode('study')">Back to the list</button>
        </div>
      </div>`;
  }

  const q = ffQuestions[ffIndex];
  const chosen = ffAnswers[ffIndex];
  const pct = Math.round((ffIndex / ffQuestions.length) * 100);
  const letters = ['A','B','C','D'];
  const risk = FF_RISKS[q.f.risk] || FF_RISKS.everyday;

  let html = `<div class="quiz-card">
    <div class="quiz-progress-track"><span class="quiz-progress-fill" style="width:${pct}%"></span><span class="quiz-pip" style="left:${pct}%"></span></div>
    <div class="quiz-meta">
      <span class="tag" style="--tag-color:${risk.color};">${escapeHtml(risk.label)}</span>
      <span class="quiz-counter">${ffIndex+1} / ${ffQuestions.length}</span>
    </div>
    <p class="ff-drill-prompt">A patient says</p>
    <p class="ff-drill-word">${escapeHtml(q.f.es)}</p>
    <p class="ff-drill-heard">&ldquo;${escapeHtml(q.f.heard)}&rdquo;</p>
    <div class="quiz-options">`;

  q.options.forEach((opt, i) => {
    let cls = '';
    if(ffRevealed){
      if(i === q.answer) cls = 'correct';
      else if(i === chosen) cls = 'wrong';
    }
    html += `<button class="quiz-option ${cls}" ${ffRevealed?'disabled':''} onclick="answerFF(${i})">
      <span class="opt-letter">${letters[i]}</span><span>${escapeHtml(opt)}</span>
    </button>`;
  });
  html += `</div>`;

  if(ffRevealed){
    const right = chosen === q.answer;
    const tookLure = chosen === q.lure;
    const lead = right ? 'Correct.' : (tookLure ? 'That is the trap.' : 'Not quite.');
    html += `<div class="quiz-explain"><b>${lead}</b> ${escapeHtml(q.f.es)} means ${escapeHtml(q.f.means)}. For &ldquo;${escapeHtml(q.f.looks)}&rdquo; you would say ${escapeHtml(q.f.say)}.</div>`;
    html += `<div class="ff-example">
        <p class="ff-heard">&ldquo;${escapeHtml(q.f.heard)}&rdquo;</p>
        <div class="ff-line ff-trap"><span class="ff-line-mark">&#10007;</span><span>${escapeHtml(q.f.trap)}</span></div>
        <div class="ff-line ff-true"><span class="ff-line-mark">&#10003;</span><span>${escapeHtml(q.f.truth)}</span></div>
      </div>`;
    html += `<div class="quiz-actions" style="margin-top:17px;">
      <button class="btn primary" onclick="nextFF()">${ffIndex + 1 >= ffQuestions.length ? 'See results' : 'Next'}</button>
    </div>`;
  }

  html += `</div>`;
  return html;
}

function renderFalseFriends(){
  const n = FALSE_FRIENDS.length;
  return `
    <div class="section-head"><h2>False Friends</h2><span class="sub">${n} traps</span></div>
    <div class="ff-modes">
      <button type="button" class="ff-mode${ffMode==='study'?' is-active':''}" onclick="setFFMode('study')">Study</button>
      <button type="button" class="ff-mode${ffMode==='drill'?' is-active':''}" onclick="setFFMode('drill')">Drill</button>
    </div>
    ${ffMode === 'drill' ? renderFFDrill() : renderFFStudy()}`;
}
