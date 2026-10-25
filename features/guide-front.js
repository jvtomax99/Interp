/* The User Guide's front page (renderUserGuide, the home of answers, its
   sections, search, and the install steps for iPhone and Android; the
   answers themselves are guide/topics.js): moved verbatim out of
   index.html on 2026-10-24 (docs/split-index.md, phase 3). Loaded by a
   plain <script src> just before index.html's own script. Nothing here
   runs as the page loads (only declarations); the names it uses from
   index.html (guideOpenSheet, escapeHtml, GUIDE_NEWS...) are read when a
   function runs. Keep it that way: a top-level line here that calls into
   index.html would run before index.html has. */

/* ---------- The guide: installing, the front page ----------
   Steps for the phone being held, in the answer sheet. The guide's front
   page keeps only a one-line reminder, and only until the app is installed:
   it used to fill the whole first screen and push search below the fold. */

let guideInstallPlatform = null;   // null = detect it

function appIsInstalled(){
  try{
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }catch(err){ return false; }
}

function detectPhonePlatform(){
  const ua = navigator.userAgent || '';
  if(/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if(/Android/i.test(ua)) return 'android';
  return 'other';
}

function setGuidePlatform(p){
  guideInstallPlatform = p;
  const t = GUIDE_TOPICS.find(x => x.id === 'install');
  if(t) guideOpenSheet(t);
}

const GUIDE_INSTALL_STEPS = {
  ios: [
    'Open this page in <b>Safari</b> (not Chrome — only Safari can do this on an iPhone).',
    'Tap the <b>Share</b> button at the bottom of the screen — the square with an arrow pointing up out of it.',
    'Scroll down the list and tap <b>Add to Home Screen</b>.',
    'Tap <b>Add</b> in the top-right corner.',
  ],
  android: [
    'Open this page in <b>Chrome</b>.',
    'Tap the <b>three dots</b> in the top-right corner.',
    'Tap <b>Install app</b>, or <b>Add to Home screen</b> if you don’t see that.',
    'Tap <b>Install</b> to confirm.',
  ],
};

function guideInstallHtml(){
  const detected = detectPhonePlatform();
  const p = guideInstallPlatform || (detected === 'other' ? 'ios' : detected);
  const note = appIsInstalled() ? 'This phone already has it. It opens from its own icon.'
    : detected === 'other' ? 'You look like you’re on a computer right now. Do this on your phone when you have it to hand.'
    : 'About ten seconds. Afterwards it opens full screen with its own icon, and keeps working where there’s no signal.';
  return `<div class="gd-seg" role="group" aria-label="Your phone">
      <button type="button" aria-pressed="${p === 'ios'}" onclick="setGuidePlatform('ios')">iPhone</button>
      <button type="button" aria-pressed="${p === 'android'}" onclick="setGuidePlatform('android')">Android</button>
    </div>
    <ol class="gd-steps">${(GUIDE_INSTALL_STEPS[p] || GUIDE_INSTALL_STEPS.ios).map(s => `<li>${s}</li>`).join('')}</ol>
    <p class="gd-note">${note}</p>`;
}

/* ---- The front page ---- */
// The question with the words you typed marked. foldText keeps every
// index where it was, so the marks land on the original letters.
function guideMarkWords(text, words){
  const f = foldText(text), ranges = [];
  for(const w of words || []){
    if(w.length < 2) continue;
    const i = f.indexOf(w);
    if(i >= 0) ranges.push([i, i + w.length]);
  }
  if(!ranges.length) return escapeHtml(text);
  ranges.sort((a, b) => a[0] - b[0]);
  let out = '', at = 0;
  for(const [s, e] of ranges){
    if(s < at) continue;
    out += escapeHtml(text.slice(at, s)) + '<mark>' + escapeHtml(text.slice(s, e)) + '</mark>';
    at = e;
  }
  return out + escapeHtml(text.slice(at));
}

function guideRow(t, words){
  const sec = GUIDE_SECTIONS.find(s => s.id === t.section) || { name:'', color:'#5B7FBF' };
  return `<button type="button" class="gd-row" id="guide-topic-${t.id}" style="--c:${sec.color}" onclick="openGuideTopic('${t.id}')">
    <i class="gd-dot" aria-hidden="true"></i><span class="gd-row-text">${guideMarkWords(guideTitle(t), words)}${words ? `<small>${escapeHtml(sec.name)}</small>` : ''}</span>${ICON_CHEVRON_RIGHT}</button>`;
}

function guideHomeHtml(){
  const seen = guideSeen();
  let html = `<p class="gd-eyebrow">New lately</p>
    <div class="gd-news">${GUIDE_NEWS.filter(n => GUIDE_TOPICS.some(t => t.id === n.id)).map(n => `
      <button type="button" class="gd-news-card ${n.tone}" onclick="openGuideTopic('${n.id}')">
        <img src="${n.pin}" alt="" loading="lazy" decoding="async">
        <small>${seen.has(n.id) ? '' : '<span class="gd-new">New</span>'}${escapeHtml(n.eyebrow)}</small><b>${escapeHtml(n.title)}</b><span>See how →</span></button>`).join('')}</div>`;

  const steps = firstWeekSteps(), done = steps.filter(s => s.done).length;
  if(done < steps.length && !firstWeekState().hidden){
    const C = 2 * Math.PI * 22, left = steps.length - done;
    html += `<p class="gd-eyebrow">Your first week</p>
      <div class="gd-week">
        <div class="gd-week-top">
          <span class="gd-ring" role="img" aria-label="${done} of ${steps.length} done"><svg viewBox="0 0 54 54" aria-hidden="true"><circle class="bg" cx="27" cy="27" r="22"/><circle class="fg" cx="27" cy="27" r="22" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - done / steps.length)).toFixed(1)}"/></svg><b aria-hidden="true">${done}/${steps.length}</b></span>
          <div><h3>Get to know the Hub</h3><p>${left === 1 ? '1 thing' : left + ' things'} left to try</p></div>
          <button type="button" class="gd-week-hide" onclick="hideFirstWeek()" aria-label="Hide this list">${ICON_X_TC}</button>
        </div>
        ${steps.map(s => `<div class="gd-wk${s.done ? ' is-done' : ''}"><i aria-hidden="true">${s.done ? '✓' : ''}</i><span>${escapeHtml(s.label)}${s.done ? '<span class="sr-only"> (done)</span>' : ''}</span>${s.done ? ''
          : `<button type="button" onclick="${s.show ? `guideShowMe('${s.show}')` : `openGuideTopic('${s.topic}')`}">Show me</button>`}</div>`).join('')}
      </div>`;
  }

  html += `<p class="gd-eyebrow">Browse</p>
    <div class="gd-tiles">${GUIDE_SECTIONS.map(s => {
      const n = GUIDE_TOPICS.filter(t => t.section === s.id).length;
      return `<button type="button" class="gd-tile" style="--c:${s.color}" onclick="openGuideSection('${s.id}')">
        <img src="${GUIDE_SECTION_PINS[s.id] || 'pins/userguide.webp'}" alt="" loading="lazy" decoding="async"><span><b>${escapeHtml(s.name)}</b><small>${n === 1 ? '1 answer' : n + ' answers'}</small></span></button>`;
    }).join('')}</div>`;

  html += `<p class="gd-eyebrow">Most asked</p>
    <div class="gd-rows">${GUIDE_POPULAR.map(id => GUIDE_TOPICS.find(t => t.id === id)).filter(Boolean).map(t => guideRow(t)).join('')}</div>`;

  if(!appIsInstalled()){
    html += `<button type="button" class="gd-install" onclick="openGuideTopic('install')">${ICON_PHONE}<span><b>Install the Hub</b> on your phone · 10 seconds</span>${ICON_CHEVRON_RIGHT}</button>`;
  }
  html += `<p class="guide-foot">Still stuck? Ask Dr. Smiley in the box at the top, or ask in <b>Team Chat</b>. If the answer was useful, it probably belongs in here. Tell Jose.</p>`;
  return html;
}

function guideSectionHtml(id){
  const s = GUIDE_SECTIONS.find(x => x.id === id);
  const list = GUIDE_TOPICS.filter(t => t.section === id);
  return `<div class="gd-sec-head" style="--c:${s.color}">
      <button type="button" class="gd-all" onclick="closeGuideSection()">${ICON_CHEVRON_LEFT}<span>All topics</span></button>
      <div class="gd-sec-title"><img src="${GUIDE_SECTION_PINS[s.id] || 'pins/userguide.webp'}" alt=""><div><h3>${escapeHtml(s.name)}</h3><p>${list.length === 1 ? '1 answer' : list.length + ' answers'}</p></div></div>
    </div>
    <div class="gd-rows">${list.map(t => guideRow(t)).join('')}</div>`;
}

/* The list is rendered on its own, separately from the shell, so the search
   box is never rebuilt while someone is typing in it. Replacing the whole
   screen on each keystroke destroyed the field, which on a phone closes the
   keyboard mid-word. */
function renderGuideList(){
  const q = guideQuery.trim();
  if(q){
    const words = foldText(q).split(/\s+/).filter(Boolean);
    const hits = matchingGuideTopics();
    return (hits.length
        ? `<p class="gd-eyebrow">${hits.length === 1 ? '1 answer' : hits.length + ' answers'}</p><div class="gd-rows">${hits.slice(0, 8).map(t => guideRow(t, words)).join('')}</div>`
        : `<p class="gd-none">No answer uses those words.</p>`)
      + `<button type="button" class="gd-ask" onclick="guideAsk(guideQuery)">${ICON_CHAT}<span><b>Ask Dr. Smiley</b><em>“${escapeHtml(q)}”</em></span>${ICON_CHEVRON_RIGHT}</button>`;
  }
  if(guideSection && GUIDE_SECTIONS.some(s => s.id === guideSection)) return guideSectionHtml(guideSection);
  return guideHomeHtml();
}

function renderUserGuide(){
  return `
    <div class="user-guide" id="userGuideRoot">
      <div class="gd-head">
        <div><h2>Help</h2><p>${GUIDE_TOPICS.length} answers. Search, browse, or ask Dr. Smiley.</p></div>
        <button type="button" class="gd-tour" onclick="openOnboarding()">Take the tour</button>
      </div>
      <div class="gd-stick" id="guideStick" aria-hidden="true"></div>
      <div class="gd-searchbar" id="guideSearchbar">
        <div class="gd-search">
          ${ICON_SEARCH}
          <label class="sr-only" for="guideSearchInput">Search help</label>
          <input id="guideSearchInput" type="search" placeholder="Search help, or ask Dr. Smiley" value="${escapeAttr(guideQuery)}"
                 autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search">
          <button type="button" class="gd-clear ${guideQuery.trim() ? '' : 'is-hidden'}" id="guideSearchClear" onclick="clearGuideSearch()" aria-label="Clear the search">${ICON_X_TC}</button>
          <button type="button" class="gd-face-btn" onclick="guideAsk(guideQuery)" aria-label="Ask Dr. Smiley"><span class="ask-face gd-face" aria-hidden="true">${askFaceSvg()}</span></button>
        </div>
      </div>
      <div id="guideList">${renderGuideList()}</div>
    </div>`;
}

/* Updates ONLY the list. The input keeps its identity, its focus and the
   keyboard. */
let guideSearchTimer = null, guideStickObserver = null;
function refreshGuideList(){
  const list = document.getElementById('guideList');
  if(list) list.innerHTML = renderGuideList();
  const clear = document.getElementById('guideSearchClear');
  if(clear) clear.classList.toggle('is-hidden', !guideQuery.trim());
}

function setupGuideSearch(){
  // The box docks under the app's top bar, like a domain's search row.
  const bar = document.querySelector('.topbar-global');
  const top = bar ? Math.round(bar.getBoundingClientRect().height) : 0;
  document.documentElement.style.setProperty('--dock-top', top + 'px');
  // Glass behind it only once it's docked; at rest it sits on the page.
  if(guideStickObserver){ guideStickObserver.disconnect(); guideStickObserver = null; }
  const stick = document.getElementById('guideStick'), sb = document.getElementById('guideSearchbar');
  if(stick && sb && 'IntersectionObserver' in window){
    guideStickObserver = new IntersectionObserver(en => sb.classList.toggle('is-stuck', !en[0].isIntersecting), { rootMargin: `-${top}px 0px 0px 0px` });
    guideStickObserver.observe(stick);
  }
  const input = document.getElementById('guideSearchInput');
  if(!input) return;
  input.addEventListener('input', (e)=>{
    guideQuery = e.target.value;
    clearTimeout(guideSearchTimer);
    guideSearchTimer = setTimeout(()=>{ guideSearchTimer = null; refreshGuideList(); }, 140);
  });
  // Enter opens the best answer; with none, it asks Dr. Smiley.
  input.addEventListener('keydown', (e)=>{
    if(e.key !== 'Enter') return;
    e.preventDefault();
    guideQuery = input.value;
    if(!guideQuery.trim()) return;
    clearTimeout(guideSearchTimer); guideSearchTimer = null;
    refreshGuideList();
    input.blur();
    const best = matchingGuideTopics()[0];
    if(best) guideOpenSheet(best); else guideAsk(guideQuery);
  });
}

function clearGuideSearch(){
  guideQuery = '';
  const input = document.getElementById('guideSearchInput');
  if(input){ input.value = ''; input.focus(); }
  refreshGuideList();
}
