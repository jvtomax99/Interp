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
 *
 * Findings are written to the existing activity-log collection, so the app's
 * notification system announces them with no extra wiring.
 *
 * SETUP
 *   1. Add a CRON_SECRET environment variable in Vercel (any long random
 *      string). Vercel sends it automatically when it triggers the cron, and
 *      it stops anyone else from hitting this endpoint.
 *   2. Add this Firestore rule so the watcher can remember what it has seen:
 *        match /watcher-state/{docId} { allow read, write: if true; }
 *        match /ce-events/{docId} { allow read, write: if true; }
 *
 * FIRST RUN records the current state silently — it will not announce the
 * entire existing backlog. Announcements begin from the next change onward.
 */

import { createHash } from 'node:crypto';

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
    url: 'https://cultureandlanguage.net/training/',
    link: 'https://cultureandlanguage.net/training/'
  }
];

/* ---------- Firestore REST helpers (works with the app's open rules) ---------- */

async function readState(id) {
  const res = await fetch(`${FS}/watcher-state/${id}?key=${FIREBASE_KEY}`);
  if (res.status === 404) return null;            // never seen before
  if (!res.ok) throw new Error(`state read failed: ${res.status}`);
  const doc = await res.json();
  const f = doc.fields || {};
  return {
    hash: f.hash?.stringValue || '',
    seen: (f.seen?.stringValue || '').split('\n').filter(Boolean)
  };
}

async function writeState(id, state) {
  const body = {
    fields: {
      hash: { stringValue: state.hash || '' },
      seen: { stringValue: (state.seen || []).slice(-MAX_REMEMBERED).join('\n') },
      updatedAt: { integerValue: String(Date.now()) }
    }
  };
  const res = await fetch(`${FS}/watcher-state/${id}?key=${FIREBASE_KEY}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`state write failed: ${res.status}`);
}

/* Findings go to their own collection, not the general activity log — mixing
   "a teammate added a term" with "a new CHIA webinar" makes both easier to
   miss. The app shows these in a dedicated Training & Events section. */
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
  const res = await fetch(`${FS}/ce-events?key=${FIREBASE_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`announce failed: ${res.status}`);
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

  const report = [];

  for (const src of SOURCES) {
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
      const firstRun = prior === null;

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
          hash: '',
          seen: [...(prior?.seen || []), ...items.map(i => i.id)]
        });
        report.push({ source: src.id, status: firstRun ? 'seeded' : 'ok', items: items.length, new: firstRun ? 0 : fresh.length });

      } else {
        const hash = fingerprintPage(body);
        const changed = !firstRun && prior.hash && prior.hash !== hash;
        if (changed) {
          await announce(`${src.name} page updated`, src.name, src.link, `${src.name}'s events page has changed \u2014 worth a look`);
        }
        await writeState(src.id, { hash, seen: [] });
        report.push({ source: src.id, status: firstRun ? 'seeded' : (changed ? 'changed' : 'unchanged') });
      }

    } catch (err) {
      // One failing source must never stop the others.
      console.error(`watcher error for ${src.id}:`, err);
      report.push({ source: src.id, status: 'error', message: String(err.message || err) });
    }
  }

  return res.status(200).json({ ok: true, checkedAt: new Date().toISOString(), report });
}
