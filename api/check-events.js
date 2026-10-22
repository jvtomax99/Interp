/* Vercel scheduled function — watches interpreter CE sources for new events.
 *
 * Runs once a day (see vercel.json). For each source it uses the most robust
 * method available:
 *
 *   CHIA  — publishes a real RSS feed, so events are parsed properly and each
 *           new event is announced by name.
 *   CCHI  — no feed, so the page is fingerprinted and the team is told when it
 *           changes. Their "upcoming" page can sit unchanged for many months,
 *           which makes a change genuinely meaningful signal.
 *   NCIHC — no feed either; same fingerprint approach.
 *   CCC   — Cross-Cultural Communications. DISABLED: their site refuses the
 *           watcher (see the source below). Not fetched; each run logs
 *           "ccc disabled" so it is never mistaken for a working source.
 *
 * Findings are written to the existing activity-log collection, so the app's
 * notification system announces them with no extra wiring.
 *
 * SETUP
 *   1. Add a CRON_SECRET environment variable in Vercel (any long random
 *      string). Vercel sends it automatically when it triggers the cron, and
 *      it stops anyone else from hitting this endpoint.
 *   2. Its own login, so it keeps working once the owner locks the Hub: add
 *      FIREBASE_SERVICE_ACCOUNT in Vercel, the whole JSON key of a Google
 *      service account allowed to use Firestore (api/_service-login.js).
 *      Without it the watcher goes in unsigned, which firestore.rules allows
 *      only while practice mode is on. Each run's report says which it used
 *      ("login").
 *
 * FIRST RUN records the current state silently — it will not announce the
 * entire existing backlog. Announcements begin from the next change onward.
 * The same goes for a source whose address changes: the saved state remembers
 * the address it was taken from, and a different one starts over silently,
 * so a new page is never announced as "updated" against the old one's
 * fingerprint. (State saved before addresses were remembered starts over
 * once, the same way.)
 */

import { createHash } from 'node:crypto';
import { serviceToken } from './_service-login.js';
import { firestore, pushToTeam, clipText } from './_push-team.js';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'language-specialist';
const FIREBASE_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyAvCLXI4RT8Ma_SpGzBIbx-U4zCTm12mKg';
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const MAX_ANNOUNCE_PER_SOURCE = 4;   // avoid flooding the feed after a big update
const MAX_REMEMBERED = 80;

const SOURCES = [
  {
    id: 'chia',
    name: 'CHIA',
    mode: 'rss',
    url: 'https://www.chiaonline.org/Events/RSS',
    link: 'https://www.chiaonline.org/Events'
  },
  {
    id: 'cchi',
    name: 'CCHI',
    mode: 'page',
    url: 'https://cchicertification.org/cchi-webinars/upcoming/',
    link: 'https://cchicertification.org/cchi-webinars/upcoming/'
  },
  {
    id: 'ncihc',
    name: 'NCIHC',
    mode: 'page',
    url: 'https://www.ncihc.org/upcoming-live-events',
    link: 'https://www.ncihc.org/upcoming-live-events'
  },
  {
    id: 'ccc',
    name: 'Cross-Cultural Communications',
    mode: 'page',
    // Their site answers the watcher with 403 Forbidden: first at the old
    // /training/ address, then, on 2026-10-10 after the move to the events
    // page below, at this one too ("ccc fetch_failed 403", run from Vercel's
    // iad1). A firewall decision on their side, not a wrong address. Getting
    // round it (posing as a browser) would defeat a block the site's owner
    // chose, so the source is off. The team adds CCC trainings by hand, and
    // the app's Training & Events screen says so. To try again (say CCC
    // allow-lists the watcher), delete this line: the first run after that
    // records the page silently, as with any new source.
    disabled: 'site refuses automated visits (HTTP 403, checked 2026-10-10)',
    url: 'https://cultureandlanguage.net/upcoming-events/',
    link: 'https://cultureandlanguage.net/upcoming-events/'
  }
];

/* ---------- Firestore REST helpers ----------
   With the service account's token every call carries it (and the lock
   doesn't apply); without one they go in unsigned with the app's public key,
   as they always did. TOKEN is set at the start of each run. */
let TOKEN = null;
const fsUrl = (path) => TOKEN ? `${FS}/${path}` : `${FS}/${path}?key=${FIREBASE_KEY}`;
const fsHeaders = (extra) => ({ ...(extra || {}), ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) });

async function readState(id) {
  const res = await fetch(fsUrl(`watcher-state/${id}`), { headers: fsHeaders() });
  if (res.status === 404) return null;            // never seen before
  if (!res.ok) throw new Error(`state read failed: ${res.status}`);
  const doc = await res.json();
  const f = doc.fields || {};
  return {
    url: f.url?.stringValue || '',
    hash: f.hash?.stringValue || '',
    seen: (f.seen?.stringValue || '').split('\n').filter(Boolean)
  };
}

async function writeState(id, state) {
  const body = {
    fields: {
      url: { stringValue: state.url || '' },
      hash: { stringValue: state.hash || '' },
      seen: { stringValue: (state.seen || []).slice(-MAX_REMEMBERED).join('\n') },
      updatedAt: { integerValue: String(Date.now()) }
    }
  };
  const res = await fetch(fsUrl(`watcher-state/${id}`), {
    method: 'PATCH',
    headers: fsHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`state write failed: ${res.status}`);
}

/* Findings go to their own collection, not the general activity log — mixing
   "a teammate added a term" with "a new CHIA webinar" makes both easier to
   miss. The app shows these in a dedicated Training & Events section. */
const ANNOUNCED = [];   // this run's findings, for the one notification at the end
async function announce(summary, source, link, title) {
  const body = {
    fields: {
      summary: { stringValue: summary },
      source:  { stringValue: source || '' },
      link:    { stringValue: link || '' },
      title:   { stringValue: title || '' },
      author:  { stringValue: 'Events watcher' },
      timestamp: { integerValue: String(Date.now()) }
    }
  };
  const res = await fetch(fsUrl('ce-events'), {
    method: 'POST',
    headers: fsHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`announce failed: ${res.status}`);
  ANNOUNCED.push({ summary, source, title });
}

/* One notification per run to the phones that asked for training alerts
   (push-subs .ce, api/_push-team.js), so a closed phone hears about it too.
   Never stops the run: a failed send is only reported. */
async function notifyPhones() {
  if (!ANNOUNCED.length) return 'nothing new';
  const first = ANNOUNCED[0];
  const body = ANNOUNCED.length === 1
    ? clipText(first.title || first.summary, 300)
    : clipText(`${ANNOUNCED.length} new: ` + ANNOUNCED.map(a => a.title || a.summary).join(' \u00b7 '), 300);
  try {
    const out = await pushToTeam(firestore(TOKEN), s => !!s.ce, {
      kind: 'ce', section: 'events', tag: 'events',
      title: ANNOUNCED.length === 1 ? (first.source ? `New from ${first.source}` : 'New training') : 'New training and events',
      body
    }, { topic: 'events', urgency: 'normal' });
    return out.notSetUp ? 'not set up' : `${out.sent}/${out.phones} phones`;
  } catch (err) {
    return `failed: ${String(err.message || err)}`;
  }
}

/* ---------- Parsing ---------- */

function decodeEntities(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function parseRss(xml) {
  const items = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const block of blocks) {
    const title = decodeEntities((block.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '');
    const link  = decodeEntities((block.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || '');
    const guid  = decodeEntities((block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i) || [])[1] || '');
    if (title) items.push({ title, link, id: guid || link || title });
  }
  return items;
}

// Strips markup, scripts, and dynamic noise so the fingerprint only changes
// when the actual content does — not on every page render.
function fingerprintPage(html) {
  const text = String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\d{1,2}:\d{2}(:\d{2})?/g, ' ')   // clock times drift between loads
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 20000);
  return createHash('sha256').update(text).digest('hex');
}

/* ---------- Handler ---------- */

export default async function handler(req, res) {
  // Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.authorization || '';
  if (secret && auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  // Its own login when one is set up; a key that's there but refused stops
  // the run here, with the reason, rather than failing every source below.
  try { TOKEN = await serviceToken(); }
  catch (err) {
    TOKEN = null;
    console.error('watcher login failed:', err.message);
    return res.status(500).json({ ok: false, login: 'service account refused', error: String(err.message || err) });
  }
  const login = TOKEN ? 'service account' : 'none (works only while practice mode is on)';

  const report = [];
  ANNOUNCED.length = 0;

  for (const src of SOURCES) {
    if (src.disabled) {
      report.push({ source: src.id, status: 'disabled', reason: src.disabled });
      continue;
    }
    try {
      const resp = await fetch(src.url, {
        headers: { 'User-Agent': 'InterpreterHub/1.0 (team CE watcher)' }
      });
      if (!resp.ok) {
        report.push({ source: src.id, status: 'fetch_failed', code: resp.status });
        continue;
      }
      const body = await resp.text();
      const prior = await readState(src.id);
      // Never seen, or seen at another address: start over silently.
      const firstRun = prior === null || prior.url !== src.url;

      if (src.mode === 'rss') {
        const items = parseRss(body);
        if (!items.length) {
          report.push({ source: src.id, status: 'no_items_parsed' });
          continue;
        }
        const seen = new Set(prior?.seen || []);
        const fresh = items.filter(i => !seen.has(i.id));

        if (!firstRun) {
          for (const item of fresh.slice(0, MAX_ANNOUNCE_PER_SOURCE)) {
            await announce(`New ${src.name} event`, src.name, item.link || src.link, item.title);
          }
          if (fresh.length > MAX_ANNOUNCE_PER_SOURCE) {
            await announce(`${fresh.length - MAX_ANNOUNCE_PER_SOURCE} more new events`, src.name, src.link, `${fresh.length - MAX_ANNOUNCE_PER_SOURCE} additional ${src.name} events posted`);
          }
        }
        await writeState(src.id, {
          url: src.url,
          hash: '',
          seen: [...(prior?.seen || []), ...items.map(i => i.id)]
        });
        report.push({ source: src.id, status: firstRun ? 'seeded' : 'ok', items: items.length, new: firstRun ? 0 : fresh.length });

      } else {
        const hash = fingerprintPage(body);
        const changed = !firstRun && !!prior.hash && prior.hash !== hash;
        if (changed) {
          await announce(`${src.name} page updated`, src.name, src.link, `${src.name}'s events page has changed \u2014 worth a look`);
        }
        await writeState(src.id, { url: src.url, hash, seen: [] });
        report.push({ source: src.id, status: firstRun ? 'seeded' : (changed ? 'changed' : 'unchanged') });
      }

    } catch (err) {
      // One failing source must never stop the others.
      console.error(`watcher error for ${src.id}:`, err);
      report.push({ source: src.id, status: 'error', message: String(err.message || err) });
    }
  }

  // One line in Vercel's logs per run, so a run started from the dashboard
  // shows which login it used and how each source went (never the key). A
  // source that answered with an error shows its HTTP status ("ccc
  // fetch_failed 404"): 404/410 means the page moved, 403/429/503 usually a
  // block on automated visits.
  const phones = await notifyPhones();
  console.log(`events watcher: phones notified = ${phones}`);
  console.log(`events watcher: login = ${login}; ` + report.map(r => `${r.source} ${r.status}${r.code ? ' ' + r.code : ''}`).join(', '));
  return res.status(200).json({ ok: true, login, phones, checkedAt: new Date().toISOString(), report });
}
