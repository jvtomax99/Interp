/* ---------- Idea credits ----------
   Whose idea a screen was (Jose, 2026-11-05: "Sylvia came up with the idea of
   Sound-Alikes"). An owner gives the credit; everyone then sees a small tag
   under that screen's title, and a card with the name, their own words and
   who gave the credit when they tap the tag or double-tap the title. An owner
   double-tapping a title with no credit yet gets the Give credit sheet.

   One document per credited screen, hub-credits/{key}, the key made from the
   screen's title ("Sound-Alikes" -> "sound-alikes"), so the tag shows on the
   screen with that title and not on its drills or lists. Kept on the phone
   (ih_credits) so the tag is there on the first paint, like the glossary.
   The rules let the team read and only the owner write (firestore.rules,
   hub-credits). docs/features/credits.md.

   Loaded before index.html's own script: escapeHtml, escapeAttr, whoAmI,
   isHubOwner, showToast and db are read only when a function here runs. */

const CREDIT_STORE = 'ih_credits';
const CREDIT_ROLES = {
  idea:    { chip: 'The idea',            tag: n => `${n}'s idea`,              line: 'came up with this idea',          kicker: s => `The idea behind ${s}` },
  content: { chip: 'Wrote the content',   tag: n => `Written by ${n}`,          line: 'wrote what is in it',             kicker: s => `Behind ${s}` },
  spanish: { chip: 'Checked the Spanish', tag: n => `Spanish checked by ${n}`,  line: 'checked the Spanish',             kicker: s => `Behind ${s}` },
  testing: { chip: 'Tested it',           tag: n => `Tested by ${n}`,           line: 'tested it before the team got it', kicker: s => `Behind ${s}` },
};
const CREDIT_BULB = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" fill="#F7C948" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9.5 18.5h5M10.5 21h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const CREDITS = {
  map: (() => { try { return creditClean(JSON.parse(localStorage.getItem(CREDIT_STORE) || '{}')); } catch (e) { return {}; } })(),
  started: false,
  tap: { t: 0, x: 0, y: 0 },
  shownAt: 0,
};

function creditValid(c) {
  return !!(c && typeof c.name === 'string' && c.name.trim() && typeof c.section === 'string' && CREDIT_ROLES[c.role]);
}
function creditClean(m) {
  const out = {};
  if (m && typeof m === 'object') Object.keys(m).forEach(k => { if (creditValid(m[k])) out[k] = m[k]; });
  return out;
}
function creditKeep() {
  try { localStorage.setItem(CREDIT_STORE, JSON.stringify(CREDITS.map)); } catch (e) {}
}
// "Sound-Alikes" -> "sound-alikes"; accents folded, at most 40 characters.
function creditKeyOf(title) {
  return String(title || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '');
}

/* The screen's title: the first heading on it, when that heading is the
   screen's own head (a .section-head, or the Doctors list's .hub-head). */
function creditTitle() {
  const h = document.querySelector('#content h1, #content h2');
  if (!h) return null;
  const head = h.closest('#content > .section-head, #content .hub-head');
  if (!head) return null;
  const section = h.textContent.replace(/\s+/g, ' ').trim().slice(0, 60);
  const key = creditKeyOf(section);
  return key ? { el: h, head, section, key } : null;
}

// Marks the title for the double-tap and puts the tag under it (or takes it
// away). Run after every redraw of #content and when the credits change.
function creditDecorate() {
  const t = creditTitle();
  const c = t && CREDITS.map[t.key];
  const sig = c ? [t.key, c.name, c.role].join('|') : '';
  document.querySelectorAll('#content .credit-tag').forEach(el => { if (el.dataset.sig !== sig) el.remove(); });
  if (!t) return;
  if (!t.el.classList.contains('credit-title')) t.el.classList.add('credit-title');
  if (t.el.dataset.creditKey !== t.key) t.el.dataset.creditKey = t.key;
  if (t.el.dataset.creditSection !== t.section) t.el.dataset.creditSection = t.section;
  if (!c || document.querySelector('#content .credit-tag')) return;
  const tag = document.createElement('button');
  tag.type = 'button';
  tag.className = 'credit-tag';
  tag.dataset.sig = sig;
  tag.dataset.creditKey = t.key;
  tag.setAttribute('aria-label', `${CREDIT_ROLES[c.role].tag(c.name)}. Open the credit`);
  tag.innerHTML = CREDIT_BULB + `<span>${escapeHtml(CREDIT_ROLES[c.role].tag(c.name))}</span>`;
  t.head.insertAdjacentElement('afterend', tag);
}

function creditOverlay() {
  let ov = document.getElementById('creditOverlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'creditOverlay';
    ov.className = 'overlay credit-ov';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    // The click that follows a double-tap's second touch lands on the backdrop
    // the moment it appears; that one must not close it again.
    ov.addEventListener('click', e => { if (e.target === ov && performance.now() - CREDITS.shownAt > 450) creditClose(); });
    document.body.appendChild(ov);
  }
  return ov;
}
function creditIsOpen() {
  const ov = document.getElementById('creditOverlay');
  return !!(ov && ov.classList.contains('show'));
}
function creditClose() {
  const ov = document.getElementById('creditOverlay');
  if (ov) { ov.classList.remove('show'); ov.innerHTML = ''; }
}
function creditShow(html, label, focusSel) {
  const ov = creditOverlay();
  ov.setAttribute('aria-label', label);
  ov.innerHTML = html;
  ov.classList.add('show');
  CREDITS.shownAt = performance.now();
  const f = ov.querySelector(focusSel);
  if (f) { try { f.focus({ preventScroll: true }); } catch (e) {} }
}

// A tap on the tag, or a double-tap on the title.
function creditOpen(key, section) {
  if (!key || creditIsOpen()) return;
  const c = CREDITS.map[key];
  const owner = typeof isHubOwner === 'function' && isHubOwner();
  if (!c) { if (owner) creditEdit(key, section); return; }
  const r = CREDIT_ROLES[c.role];
  const when = c.at ? new Date(c.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const meta = [c.by ? `Credited by ${escapeHtml(c.by)}` : '', when].filter(Boolean).join(' · ');
  const initial = escapeHtml(Array.from(c.name.trim())[0].toUpperCase());
  creditShow(`
    <div class="modal credit-card">
      <div class="credit-av" aria-hidden="true">${initial}<i>${CREDIT_BULB}</i></div>
      <p class="credit-kicker">${escapeHtml(r.kicker(c.section))}</p>
      <h3 class="credit-name">${escapeHtml(c.name)}</h3>
      <p class="credit-line">${escapeHtml(r.line)}</p>
      ${c.words ? `<blockquote class="credit-words">“${escapeHtml(c.words)}”<small>${escapeHtml(c.name)}</small></blockquote>` : ''}
      ${meta ? `<p class="credit-meta">${meta}</p>` : ''}
      <div class="credit-row">
        ${owner ? `<button type="button" class="credit-btn credit-btn-soft" onclick="creditClose(); creditEdit('${escapeAttr(key)}')">Edit</button>` : ''}
        <button type="button" class="credit-btn credit-btn-main" onclick="creditClose()">Close</button>
      </div>
    </div>`, `${r.tag(c.name)}`, '.credit-btn-main');
}

// The owner's Give credit sheet, new or editing.
function creditEdit(key, section) {
  if (typeof isHubOwner !== 'function' || !isHubOwner()) return;
  const c = CREDITS.map[key];
  const sec = (c && c.section) || section || '';
  const role = (c && c.role) || 'idea';
  const chips = Object.keys(CREDIT_ROLES).map(k => `
    <label class="credit-chip"><input type="radio" name="creditRole" value="${k}"${k === role ? ' checked' : ''}><span>${escapeHtml(CREDIT_ROLES[k].chip)}</span></label>`).join('');
  creditShow(`
    <div class="modal credit-sheet" data-key="${escapeAttr(key)}" data-section="${escapeAttr(sec)}">
      <span class="credit-owner">Owners only</span>
      <h3>${c ? 'Edit credit' : 'Give credit'}</h3>
      <p class="credit-lede">For <b>${escapeHtml(sec)}</b>. The whole team sees it under this screen's title. Check with them before you add their words.</p>
      <div class="field"><label for="creditName">Name</label>
        <input id="creditName" type="text" maxlength="60" autocomplete="off" placeholder="First name" value="${escapeAttr(c ? c.name : '')}"></div>
      <div class="field"><label for="creditWords">In their words (optional)</label>
        <textarea id="creditWords" maxlength="300" placeholder="What they said when they suggested it">${escapeHtml(c && c.words ? c.words : '')}</textarea></div>
      <div class="field"><span class="credit-label">Credit for</span><div class="credit-chips" role="radiogroup" aria-label="Credit for">${chips}</div></div>
      <div class="credit-row">
        ${c ? `<button type="button" class="credit-btn credit-btn-danger" onclick="creditRemove('${escapeAttr(key)}')">Remove</button>` : ''}
        <button type="button" class="credit-btn credit-btn-soft" onclick="creditClose()">Cancel</button>
        <button type="button" class="credit-btn credit-btn-main" onclick="creditSave()">Save</button>
      </div>
    </div>`, c ? 'Edit credit' : 'Give credit', '#creditName');
}

function creditSave() {
  const box = document.querySelector('#creditOverlay .credit-sheet');
  if (!box) return;
  const key = box.dataset.key, section = box.dataset.section;
  const name = document.getElementById('creditName').value.replace(/\s+/g, ' ').trim().slice(0, 60);
  const words = document.getElementById('creditWords').value.replace(/\s+/g, ' ').trim().slice(0, 300);
  const picked = box.querySelector('input[name="creditRole"]:checked');
  const role = picked && CREDIT_ROLES[picked.value] ? picked.value : 'idea';
  if (!name) { showToast('Type whose idea it was.'); document.getElementById('creditName').focus(); return; }
  if (!db) { showToast('Not connected yet. Try again in a moment.'); return; }
  const doc = { section, name, role, words, by: String(whoAmI() || '').trim().slice(0, 60), at: Date.now() };
  const before = CREDITS.map[key];
  CREDITS.map[key] = doc;
  creditKeep();
  creditDecorate();
  creditClose();
  showToast(`Credit saved: ${CREDIT_ROLES[role].tag(name)}`);
  db.collection('hub-credits').doc(key).set(doc).catch(() => {
    if (before) CREDITS.map[key] = before; else delete CREDITS.map[key];
    creditKeep();
    creditDecorate();
    showToast('The credit was not saved: the database refused it.');
  });
}

function creditRemove(key) {
  const c = CREDITS.map[key];
  if (!c || !db) { creditClose(); return; }
  delete CREDITS.map[key];
  creditKeep();
  creditDecorate();
  creditClose();
  showToast('Credit removed');
  db.collection('hub-credits').doc(key).delete().catch(() => {
    CREDITS.map[key] = c;
    creditKeep();
    creditDecorate();
    showToast('The credit was not removed: the database refused it.');
  });
}

// The team's credits, live. Called from index.html once the sign-in is back.
function startCredits() {
  if (CREDITS.started || !db) return;
  CREDITS.started = true;
  db.collection('hub-credits').onSnapshot(snap => {
    const m = {};
    snap.docs.forEach(d => { m[d.id] = d.data() || {}; });
    CREDITS.map = creditClean(m);
    creditKeep();
    creditDecorate();
  }, () => {
    // Refused (rules not published yet) or offline: keep what the phone has.
    CREDITS.started = false;
  });
}

/* The double-tap. Touch and pen: two taps on the title within 350 ms and
   30 px. A mouse: the browser's own dblclick. A tap on the tag opens it too. */
document.addEventListener('pointerup', e => {
  const tag = e.target.closest && e.target.closest('.credit-tag');
  if (tag) return;   // its click does it
  if (e.pointerType === 'mouse') return;
  const el = e.target.closest && e.target.closest('.credit-title');
  const T = CREDITS.tap;
  if (!el) { T.t = 0; return; }
  if (T.t && e.timeStamp - T.t < 350 && Math.hypot(e.clientX - T.x, e.clientY - T.y) < 30) {
    T.t = 0;
    creditOpen(el.dataset.creditKey, el.dataset.creditSection);
  } else { T.t = e.timeStamp; T.x = e.clientX; T.y = e.clientY; }
});
document.addEventListener('dblclick', e => {
  const el = e.target.closest && e.target.closest('.credit-title');
  if (!el) return;
  e.preventDefault();
  creditOpen(el.dataset.creditKey, el.dataset.creditSection);
});
document.addEventListener('click', e => {
  const tag = e.target.closest && e.target.closest('.credit-tag');
  if (tag) creditOpen(tag.dataset.creditKey);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && creditIsOpen()) { e.preventDefault(); creditClose(); }
});

// Every redraw of a screen replaces #content's children: decorate it again.
// The frame around it (#app) is rebuilt now and then too, with a new
// #content, so that is watched as well and the watch moves to the new one.
// Called by index.html's script at startup (not on DOMContentLoaded, which
// waits for every deferred script and can come late).
function creditWatch() {
  const app = document.getElementById('app');
  if (!app || CREDITS.watching) return;
  CREDITS.watching = true;
  const inner = new MutationObserver(() => creditDecorate());
  let current = null;
  const attach = () => {
    const content = document.getElementById('content');
    if (content && content !== current) { inner.disconnect(); current = content; inner.observe(content, { childList: true }); }
    creditDecorate();
  };
  new MutationObserver(attach).observe(app, { childList: true });
  attach();
}
