/* ---------- Check link ----------
   A Check button beside a term's Source link (Add / Edit term) and on every
   row of the Link Directory: does the address still open? The Hub's server
   visits it (api/link-check.js) and answers one of four things: Opens,
   Moved, Not found, Couldn't tell. It never says "safe", stores nothing and
   never changes a link by itself (docs/features/link-check.md).

   Loaded with a plain <script src> before index.html's script, so this file
   only declares things; the names it borrows (escapeHtml, escapeAttr,
   externalUrl, hubAuthHeaders) are read when a function runs. Styles:
   app.css, "Link check". */

const LC_NOTE = 'This only checks that the page opens, not that it is safe or correct.';
const LC_WAIT_MS = 12000;      // the server gives up at 8 s; this is for a dead connection
let lcSeq = 0;                 // every check and every clear takes a number; an older answer is dropped

const LC_ICON = {
  opens: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M8 12.5l2.8 2.8L16.2 9.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  moved: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M8 12h8m-3-3.2l3.2 3.2-3.2 3.2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  not_found: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M9 9l6 6m0-6l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  unknown: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M9.6 9.4a2.5 2.5 0 114 2c-.9.6-1.6 1.1-1.6 2.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16.9" r="1.1" fill="currentColor"/></svg>',
};

/* What each answer says. `reason` is the server's short word for why. */
function linkCheckWords(data){
  const title = String(data.title || '').trim();
  if(data.result === 'opens'){
    return { kind: 'opens', head: 'Opens',
      body: title ? `The page calls itself “${title}”.` : (data.kind === 'pdf' ? 'It is a PDF file.' : 'The page loaded.') };
  }
  if(data.result === 'moved'){
    return { kind: 'moved', head: 'Moved',
      body: 'It opens, but at a different address' + (title ? `, as “${title}”` : '') + ':', newUrl: String(data.newUrl || '') };
  }
  if(data.result === 'not_found'){
    return { kind: 'not_found', head: 'Not found',
      body: data.reason === 'no_site' ? 'There is no site at this address.' : 'The site says this page is gone.' };
  }
  const why = {
    refused: 'The site would not let the Hub in (it may want a sign-in, or it blocks automatic visitors).',
    too_slow: 'The site took too long to answer.',
    not_allowed: 'This is not an address the Hub may visit.',
    too_many_redirects: 'The site kept sending the Hub somewhere else.',
    site_error: 'The site answered with an error of its own.',
  }[data.reason] || 'The site did not give a clear answer.';
  return { kind: 'unknown', head: 'Couldn’t tell', body: why + ' Open it yourself to be sure.' };
}

function linkCheckAnswerHtml(w, canUse){
  // The new address is shown only if it is a plain web address.
  const shown = w.newUrl && /^https?:\/\//i.test(w.newUrl) ? w.newUrl : '';
  return `<div class="lc-ans lc-${w.kind}">
      <span class="lc-ic">${LC_ICON[w.kind] || LC_ICON.unknown}</span>
      <div class="lc-txt">
        <b class="lc-head">${escapeHtml(w.head)}</b>
        <span class="lc-body">${escapeHtml(w.body)}</span>
        ${shown ? `<span class="lc-new">${escapeHtml(shown)}</span>` : ''}
        ${shown && canUse ? `<button type="button" class="btn btn-ghost lc-use" data-url="${escapeAttr(shown)}" onclick="linkCheckUse(this)">Use the new address</button>` : ''}
        <span class="lc-note">${escapeHtml(LC_NOTE)}</span>
      </div>
    </div>`;
}

function linkCheckMessageHtml(text){
  return `<div class="lc-ans lc-msg"><div class="lc-txt"><span class="lc-body">${escapeHtml(text)}</span></div></div>`;
}

/* The check itself: `out` is where the answer is drawn, `btn` the button
   that was pressed, `canUse` whether "Use the new address" may be offered
   (only where there is a box to fill). */
async function linkCheckRun(raw, out, btn, canUse){
  if(!out) return;
  const mine = ++lcSeq;
  out.dataset.lc = String(mine);
  const stale = () => out.dataset.lc !== String(mine) || !out.isConnected;
  const show = html => { if(stale()) return; out.innerHTML = html; out.hidden = false; if(btn){ btn.disabled = false; btn.classList.remove('is-busy'); } };

  const url = String(raw == null ? '' : raw).trim();
  if(!url){ show(linkCheckMessageHtml('There is no link to check yet. Paste one first.')); return; }
  const opened = externalUrl(url);
  if(!/^https?:\/\//i.test(opened)){ show(linkCheckMessageHtml('That is not a web address, so there is no page to check.')); return; }
  if(!navigator.onLine){ show(linkCheckMessageHtml('You are offline: checking a link needs a connection.')); return; }

  if(btn){ btn.disabled = true; btn.classList.add('is-busy'); }
  out.hidden = false;
  out.innerHTML = '<div class="lc-ans lc-wait"><span class="lc-spin" aria-hidden="true"></span><div class="lc-txt"><span class="lc-body">Checking…</span></div></div>';

  const stop = new AbortController();
  const timer = setTimeout(() => stop.abort(), LC_WAIT_MS);
  try{
    const res = await fetch('/api/link-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await hubAuthHeaders()) },
      body: JSON.stringify({ url: opened }),
      signal: stop.signal,
    });
    if(res.status === 429){ show(linkCheckMessageHtml('This phone has reached today’s limit for the Hub’s online tools. Checking works again tomorrow.')); return; }
    if(res.status === 401){ show(linkCheckMessageHtml('Checking a link is for the team. Open the Hub with the team code and try again.')); return; }
    if(res.status === 400){ show(linkCheckMessageHtml('That is not a web address the Hub can check.')); return; }
    if(!res.ok){ show(linkCheckAnswerHtml(linkCheckWords({ result: 'unknown', reason: 'service' }), false)); return; }
    const data = await res.json();
    const known = data && ['opens', 'moved', 'not_found', 'unknown'].includes(data.result);
    show(linkCheckAnswerHtml(linkCheckWords(known ? data : { result: 'unknown' }), canUse));
  }catch(err){
    show(linkCheckMessageHtml(navigator.onLine
      ? 'The check did not come back. Try again in a moment, or open the link yourself.'
      : 'You are offline: checking a link needs a connection.'));
  }finally{
    clearTimeout(timer);
  }
}

/* Add / Edit term: the button under "Source link". */
function linkCheckField(btn){
  const box = document.getElementById('fSourceUrl');
  linkCheckRun(box ? box.value : '', document.getElementById('lcFieldOut'), btn, true);
}
/* The answer belongs to the address that was checked: typing a different
   one, or opening the form for another term, takes it away. */
function linkCheckClear(){
  const out = document.getElementById('lcFieldOut');
  if(!out) return;
  out.dataset.lc = String(++lcSeq);
  out.innerHTML = ''; out.hidden = true;
  const btn = document.getElementById('lcFieldBtn');
  if(btn){ btn.disabled = false; btn.classList.remove('is-busy'); }
}
/* Fills the box and nothing more: the person still presses Save term. */
function linkCheckUse(btn){
  const box = document.getElementById('fSourceUrl');
  const url = externalUrl(btn && btn.dataset.url);
  if(!box || !/^https?:\/\//i.test(url)) return;
  box.value = url;
  const out = document.getElementById('lcFieldOut');
  if(out){
    out.dataset.lc = String(++lcSeq);
    out.innerHTML = linkCheckMessageHtml('The new address is in the box. Press Save term to keep it.');
    out.hidden = false;
  }
  box.focus({ preventScroll: true });
}

/* Link Directory: the button on a row, and the line under the row that
   holds its answer. */
function linkCheckRowButton(url){
  return `<button type="button" class="lc-btn lc-row-btn" data-url="${escapeAttr(url)}" onclick="linkCheckRow(this)">Check</button>`;
}
function linkCheckRowOut(){
  return '<div class="lc-out lc-row-out" role="status" aria-live="polite" hidden></div>';
}
function linkCheckRow(btn){
  const row = btn.closest('.dir-row');
  const out = row && row.nextElementSibling && row.nextElementSibling.classList.contains('lc-row-out') ? row.nextElementSibling : null;
  linkCheckRun(btn.dataset.url, out, btn, false);
}
