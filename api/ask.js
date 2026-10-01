/* Vercel serverless function — "Ask the Hub", the team's assistant.
 *
 * WHAT IT DOES
 * An interpreter asks a question between assignments ("how do I explain
 * ejection fraction to a patient?"). The app looks through its own content
 * on the phone -- glossary, False Friends, Doctor Directory, providers, Code
 * of Ethics, User Guide -- and sends the few entries that match, plus any
 * team notes the owner has approved. This function asks Claude to answer
 * FROM THOSE ENTRIES, and to say plainly when the answer is not in the Hub.
 *
 * HOW IT "LEARNS"
 * The model never changes. What changes is the team's own data: when a
 * teammate taps "Correct this" and the owner approves it, the note is stored
 * in Firestore (hub-lessons) and sent along with every later question it
 * matches. The system prompt tells Claude a team note outranks a glossary
 * entry. Nothing here is remembered between requests.
 *
 * WHAT LEAVES THE PHONE
 * Only the question, up to MAX_ENTRIES matching entries, up to MAX_LESSONS
 * notes and the last few turns of the conversation. Members only once the
 * Hub is locked (allowTeam). No patient information: the app warns before
 * sending anything that looks like a name with a date of birth or a record
 * number, and the prompt tells Claude not to repeat any.
 *
 * SETUP: none beyond the ANTHROPIC_API_KEY already configured for Translate.
 */

import { allowTeam } from './_hub-access.js';

// One model turn with a short answer; well inside the limit, but a slow
// moment on the API should not cut an interpreter off mid-answer.
export const config = {
  maxDuration: 60,
};

const MODEL = 'claude-opus-5-5';

/* Low effort. The judgment here is mostly done before the model sees the
 * question: the app has already picked the relevant entries, and the answer
 * is a few lines on a phone. Low keeps the wait and the cost down (about a
 * cent or two a question); raise it to 'medium' if answers come back thin. */
const EFFORT = 'low';

const MAX_QUESTION = 500;
const MAX_FIELD = 600;
const MAX_ENTRIES = 30;
const MAX_LESSONS = 8;
const MAX_HISTORY = 3;

const SYSTEM = `You are "Ask the Hub", the assistant inside the Interpreter Hub, used by the Spanish/English medical interpreter team at Hackensack University Medical Center. Interpreters ask between assignments, on a phone, often one-handed.

How to answer:
- The message gives you HUB ENTRIES from the team's own glossary, False Friends list, Doctor Directory, provider list, Code of Ethics and User Guide, and TEAM NOTES the team lead has approved. They are the team's agreed knowledge: answer from them first. Put the id of every entry you relied on in sourceIds and every team note you followed in lessonIds.
- A team note is a correction from the team. When one applies, follow it, even over a glossary entry.
- If the entries don't answer the question, answer from general knowledge, set fromHub to false and leave sourceIds empty. Never say something is in the Hub when it isn't, and never make up a doctor, a location, a phone number or a policy.
- For a medical term, give the standard term in the other language and, when it helps, a plain way to say it to a patient, at about a sixth-grade level. Prefer neutral Latin American Spanish; many patients are Dominican, Puerto Rican, Colombian, Ecuadorian or Mexican.
- Keep it short; it is read on a phone. headline is the answer itself in a few words. say is something the interpreter could say aloud, or "" when that doesn't fit; sayLabel names it in two to five words. details is at most two short sentences.
- If the question is about a real medical term that is missing from the Hub and worth keeping, fill suggestTerm (English, Spanish, a one-line definition) so the interpreter can add it. Otherwise leave its fields as "".
- Answer in the language of the question, with Spanish terms in Spanish.
- Never ask for or repeat patient-identifying information (names, dates of birth, record numbers, addresses). If the question includes any, answer only the general question and add a short reminder in details.
- You help interpreters render language accurately. You are not a clinician: don't give medical advice or interpret a patient's results.`;

const ANSWER_SCHEMA = {
  type: 'object',
  properties: {
    fromHub:   { type: 'boolean' },
    headline:  { type: 'string' },
    sayLabel:  { type: 'string' },
    say:       { type: 'string' },
    details:   { type: 'string' },
    sourceIds: { type: 'array', items: { type: 'string' } },
    lessonIds: { type: 'array', items: { type: 'string' } },
    suggestTerm: {
      type: 'object',
      properties: { en: { type: 'string' }, es: { type: 'string' }, def: { type: 'string' } },
      required: ['en', 'es', 'def'],
      additionalProperties: false,
    },
  },
  required: ['fromHub', 'headline', 'sayLabel', 'say', 'details', 'sourceIds', 'lessonIds', 'suggestTerm'],
  additionalProperties: false,
};

function clip(value, max = MAX_FIELD) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
}

// Entries arrive as small flat objects built by the app. Keep only short
// string fields so nothing unexpected (or enormous) reaches the prompt.
function cleanEntry(e) {
  if (!e || typeof e !== 'object') return null;
  const id = clip(e.id, 80);
  if (!id) return null;
  const out = { id };
  for (const [k, v] of Object.entries(e)) {
    if (k === 'id' || Object.keys(out).length > 9) continue;
    if (typeof v === 'string' && /^[a-zA-Z]{1,20}$/.test(k) && v.trim()) out[k] = clip(v);
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // Members only once the owner locks the Hub -- see _hub-access.js.
  if (!(await allowTeam(req, res))) return;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'not_configured' });
  }

  try {
    const body = req.body || {};
    const question = clip(body.question, MAX_QUESTION);
    if (!question) {
      return res.status(400).json({ error: 'A question is required.' });
    }
    const entries = (Array.isArray(body.entries) ? body.entries : [])
      .slice(0, MAX_ENTRIES).map(cleanEntry).filter(Boolean);
    const lessons = (Array.isArray(body.lessons) ? body.lessons : [])
      .slice(0, MAX_LESSONS)
      .map(l => l && ({ id: clip(l.id, 80), about: clip(l.about, 300), note: clip(l.note, 1000) }))
      .filter(l => l && l.id && l.note);
    const history = (Array.isArray(body.history) ? body.history : [])
      .slice(-MAX_HISTORY)
      .map(h => h && ({ asked: clip(h.q, 300), answered: clip(h.a, 300) }))
      .filter(h => h && h.asked);

    // Reference material first, the question last.
    const userContent =
      `HUB ENTRIES (${entries.length}):\n${JSON.stringify(entries)}\n\n` +
      `TEAM NOTES (${lessons.length}):\n${JSON.stringify(lessons)}\n\n` +
      (history.length ? `EARLIER IN THIS CONVERSATION (oldest first):\n${JSON.stringify(history)}\n\n` : '') +
      `QUESTION:\n${question}`;

    const request = {
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM,
      messages: [{ role: 'user', content: userContent }],
    };

    const post = (extra, withFallback) => fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        // If a safety check declines a medical question, the API retries it
        // on another model inside the same call instead of failing it.
        ...(withFallback ? { 'anthropic-beta': 'server-side-fallback-2026-07-01' } : {}),
      },
      body: JSON.stringify({ ...request, ...(withFallback ? { fallbacks: 'default' } : {}), ...extra }),
    });

    // Same defensive shape as the other endpoints: prefer the fallback and a
    // schema-constrained answer, but never fail a question because the API
    // rejected one of those options.
    let withFallback = true;
    let usedSchema = true;
    let extra = { output_config: { effort: EFFORT, format: { type: 'json_schema', schema: ANSWER_SCHEMA } } };
    let upstream = await post(extra, withFallback);
    for (let attempt = 0; attempt < 2 && upstream.status === 400; attempt++) {
      const detail = await upstream.text();
      if (withFallback && /fallback|anthropic-beta|beta/i.test(detail)) {
        console.warn('Fallback option rejected, retrying without it:', detail);
        withFallback = false;
      } else if (usedSchema && /output_config|json_schema|\bformat\b|\beffort\b/i.test(detail)) {
        console.warn('Structured outputs rejected, retrying without a schema:', detail);
        usedSchema = false;
        extra = {};
      } else {
        console.error('Anthropic API error:', upstream.status, detail);
        return res.status(502).json({ error: 'upstream_error' });
      }
      upstream = await post(extra, withFallback);
    }

    if (!upstream.ok) {
      console.error('Anthropic API error:', upstream.status, await upstream.text());
      return res.status(502).json({ error: 'upstream_error' });
    }

    const data = await upstream.json();
    if (data.usage) console.log('ask usage', JSON.stringify(data.usage));

    // A decline arrives as a normal 200 with stop_reason "refusal"; check it
    // before reading the answer.
    if (data.stop_reason === 'refusal') {
      return res.status(200).json({ refused: true });
    }
    if (data.stop_reason === 'max_tokens') {
      console.error('Ask answer truncated at max_tokens.');
    }

    const raw = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(usedSchema ? raw : raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim());
    } catch (err) {
      console.error('Could not parse ask response:', raw.slice(0, 400));
      return res.status(502).json({ error: 'unreadable_answer' });
    }

    // Only ids the app actually sent may come back as sources, so a chip on
    // screen always points at a real entry.
    const sentIds = new Set(entries.map(e => e.id));
    const sentLessons = new Set(lessons.map(l => l.id));
    const sourceIds = (Array.isArray(parsed.sourceIds) ? parsed.sourceIds : [])
      .map(id => clip(id, 80)).filter(id => sentIds.has(id));
    const lessonIds = (Array.isArray(parsed.lessonIds) ? parsed.lessonIds : [])
      .map(id => clip(id, 80)).filter(id => sentLessons.has(id));
    const st = parsed.suggestTerm || {};

    return res.status(200).json({
      answer: {
        fromHub: !!parsed.fromHub && sourceIds.length + lessonIds.length > 0,
        headline: clip(parsed.headline, 200),
        sayLabel: clip(parsed.sayLabel, 60),
        say: clip(parsed.say),
        details: clip(parsed.details),
        sourceIds,
        lessonIds,
        suggestTerm: { en: clip(st.en, 120), es: clip(st.es, 120), def: clip(st.def, 300) },
      },
    });
  } catch (err) {
    console.error('ask failed:', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
