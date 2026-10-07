/* Vercel serverless function — "Ask the Hub", where Dr. Smiley, the
 * team's interpreter assistant, answers.
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
 * WHAT HE CAN DO, NOT JUST SAY
 * The app also sends a small CONTEXT: the screen the interpreter came from,
 * a glossary term they picked ("explain this term"), the specialties that
 * have a briefing, and how many terms their Term Review record marks as still
 * learning -- never anything about a patient. Dr. Smiley may suggest a few
 * ACTIONS from a fixed list (open a briefing, practice those terms, open a
 * term or its source...). Each must name a target the app sent; anything
 * else is dropped here, and the app checks again before showing a button.
 * The app runs the action and only then says it's done.
 *
 * PREFERENCES, NOT KNOWLEDGE
 * An interpreter can ask Dr. Smiley to remember a few choices on their own
 * phone (explanation language, brief or detailed, a study focus) and, if
 * they switch it on, to use their own practice record (what they're still
 * learning, what's due, practice left unfinished). These arrive as
 * CONTEXT.prefs and CONTEXT.practice: style and personal choices only, kept
 * apart from TEAM NOTES and never a source. Team points are the team's and
 * are never sent. Nothing about a patient is stored or sent.
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
const MAX_SPECIALTIES = 40;
const MAX_ACTIONS = 3;

/* What Dr. Smiley may offer to do. The target each takes:
 *   open_prep          a specialty id from CONTEXT.specialties ("spec:...")
 *   choose_prep        "prep"     (the briefing's specialty picker)
 *   practice_learning  "learning" (Term Review on the terms still being learned)
 *   start_review       "review"   (Term Review on everything due)
 *   set_name           "name"     (a review record needs the name on this phone)
 *   open_term          a glossary entry id ("t:...") from HUB ENTRIES or CONTEXT.selected
 *   look_up            the same: a live search for the term's sources
 *   open_source        CONTEXT.selected's id, only when it has a saved source link
 *   continue_prep      a specialty id: the briefing deck left part-way today (CONTEXT.practice.unfinished)
 *   continue_quiz      "quiz"     (a practice quiz left part-way)
 *   continue_review    "review"   (a Term Review session left part-way) */
const ACTION_TYPES = ['open_prep', 'choose_prep', 'practice_learning', 'start_review', 'set_name', 'open_term', 'look_up', 'open_source',
  'continue_prep', 'continue_quiz', 'continue_review'];

const SYSTEM = `You are Dr. Smiley, the interpreter assistant inside the Interpreter Hub ("Ask the Hub"), used by the Spanish/English medical interpreter team at Hackensack University Medical Center. Interpreters ask between assignments, on a phone, often one-handed. You are friendly and brief, and you help them get ready and render language accurately.

How to answer:
- The message gives you HUB ENTRIES from the team's own glossary, False Friends list, Doctor Directory, provider list, Code of Ethics and User Guide, and TEAM NOTES the team lead has approved. They are the team's agreed knowledge: answer from them first. Put the id of every entry you relied on in sourceIds and every team note you followed in lessonIds.
- A team note is a correction from the team. When one applies, follow it, even over a glossary entry.
- If the entries don't answer the question, answer from general knowledge, set fromHub to false and leave sourceIds empty. Never say something is in the Hub when it isn't, and never make up a doctor, a location, a phone number or a policy.
- For a medical term, give the standard term in the other language and, when it helps, a plain way to say it to a patient, at about a sixth-grade level. Prefer neutral Latin American Spanish; many patients are Dominican, Puerto Rican, Colombian, Ecuadorian or Mexican.
- Keep it short; it is read on a phone. headline is the answer itself in a few words. say is something the interpreter could say aloud, or "" when that doesn't fit; sayLabel names it in two to five words. details is at most two short sentences.
- If the question is about a real medical term that is missing from the Hub and worth keeping, fill suggestTerm (English, Spanish, a one-line definition) so the interpreter can add it. Otherwise leave its fields as "".
- Answer in the language of the question, with Spanish terms in Spanish.
- Never ask for or repeat patient-identifying information (names, dates of birth, record numbers, addresses). If the question includes any, answer only the general question and add a short reminder in details.
- You help interpreters render language accurately. You are not a clinician: don't give medical advice or interpret a patient's results.

Context and actions:
- CONTEXT says which screen the interpreter came from, which glossary term they selected (if any), which specialties have a briefing, and their Term Review record (whether a name is set on the phone and how many terms are still being learned).
- "Explain this term" (or "this word", "it") means CONTEXT.selected. Explain that entry: headline is the term and its Spanish; say is a plain Spanish rendering a patient would understand, with sayLabel "In plain Spanish"; details is at most two short sentences. Put its id in sourceIds. If nothing is selected and the question doesn't name a term, ask which one in headline and leave say "".
- You can't open anything yourself. To help someone do something, add up to 3 actions from this list, and only with a target given in CONTEXT or HUB ENTRIES:
  open_prep (target: a specialty id from CONTEXT.specialties) opens the appointment briefing for that specialty. Use it for "I'm covering X", "prep me", "heading to X". If the specialty isn't in the list, say so and use choose_prep (target "prep") instead.
  practice_learning (target "learning") starts Term Review on the terms the interpreter is still learning. Only when CONTEXT.learning.count is above 0. If it's 0, say there are none yet and offer start_review (target "review") when a name is set.
  set_name (target "name") when CONTEXT.learning.hasName is false and they want to practice: a review record belongs to a name.
  open_term (target: a glossary id) opens that term in the glossary. look_up (same target) searches live for its sources. open_source (target: CONTEXT.selected.id) opens the selected term's saved source; only when CONTEXT.selected.hasLink is true.
- Never say you have opened, started or done something; the interpreter taps the button. Say what the button will do, for example "Your Oncology briefing is ready to open."
- Keep it short: one headline, at most two short sentences of details.

Preferences and practice (only when CONTEXT has them):
- CONTEXT.prefs are this interpreter's own choices, saved on their phone. lang is the language for your explanation (headline and details): "auto" means the question's language, "es" Spanish, "en" English, "both" Spanish then English. Spanish terms stay Spanish and say stays the patient-facing words whatever lang is. length "brief": the headline and at most one short sentence of details; "detailed": up to four sentences of details. focus is the specialty they are studying: prefer it when they leave the specialty open ("prep me", "practice some terms").
- Preferences are style, not knowledge. Never cite one as a source, never put one in sourceIds or lessonIds, and never let one override a HUB ENTRY or a TEAM NOTE.
- CONTEXT.practice is the interpreter's own record: terms still learning (and how many in their focus), terms due, and practice they left unfinished. When it helps with what they asked, offer the matching action (continue_prep with its specialty id, continue_quiz "quiz", continue_review "review", practice_learning). Don't offer an unrelated next step when they asked about something else.
- Team points belong to the whole team; they are not in CONTEXT and never describe them as this interpreter's progress.`;

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
    actions: {
      type: 'array',
      items: {
        type: 'object',
        properties: { type: { type: 'string', enum: ACTION_TYPES }, target: { type: 'string' } },
        required: ['type', 'target'],
        additionalProperties: false,
      },
    },
    suggestTerm: {
      type: 'object',
      properties: { en: { type: 'string' }, es: { type: 'string' }, def: { type: 'string' } },
      required: ['en', 'es', 'def'],
      additionalProperties: false,
    },
  },
  required: ['fromHub', 'headline', 'sayLabel', 'say', 'details', 'sourceIds', 'lessonIds', 'actions', 'suggestTerm'],
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

// Anything that looks like a patient identifier: a date, a long number, a
// record-number label. Context values come from the app's own data, but none
// of these belongs in it either way.
const PHI = /\b(mrn|dob|d\.o\.b|date of birth|fecha de nacimiento|social security|ssn|medical record|record number)\b|\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b|\b\d{6,}\b/i;
const ID_RE = /^[\w:.-]{1,80}$/;
function safeText(v, max) {
  const s = clip(v, max);
  return PHI.test(s) ? '' : s;
}
// The app's context, cut down to the fields and sizes listed here.
const PREF_LANG = ['auto', 'es', 'en', 'both'];
const PREF_LENGTH = ['brief', 'detailed'];
const int = (v, max) => Math.max(0, Math.min(max, Math.floor(+v || 0)));
function cleanContext(c) {
  c = c && typeof c === 'object' ? c : {};
  const scr = c.screen && typeof c.screen === 'object' ? c.screen : {};
  const sel = c.selected && typeof c.selected === 'object' ? c.selected : null;
  const lr = c.learning && typeof c.learning === 'object' ? c.learning : {};
  const out = {
    screen: { id: ID_RE.test(String(scr.id || '')) ? String(scr.id) : '', name: safeText(scr.name, 80) },
    selected: null,
    specialties: (Array.isArray(c.specialties) ? c.specialties : []).slice(0, MAX_SPECIALTIES)
      .filter(s => s && ID_RE.test(String(s.id || '')) && String(s.id).startsWith('spec:'))
      .map(s => ({ id: String(s.id), name: safeText(s.name, 80) })).filter(s => s.name),
    learning: {
      hasName: !!lr.hasName,
      loaded: !!lr.loaded,
      count: Math.max(0, Math.min(999, Math.floor(+lr.count || 0))),
    },
  };
  // The interpreter's own preferences: three choices from fixed lists.
  const pr = c.prefs && typeof c.prefs === 'object' ? c.prefs : null;
  if (pr) {
    const focus = pr.focus && out.specialties.find(s => s.id === String(pr.focus.id || ''));
    out.prefs = {
      lang: PREF_LANG.includes(pr.lang) ? pr.lang : 'auto',
      length: PREF_LENGTH.includes(pr.length) ? pr.length : 'brief',
      focus: focus ? { id: focus.id, name: focus.name } : null,
    };
  }
  // Their own practice record, when they've switched it on. Counts only.
  const pc = c.practice && typeof c.practice === 'object' ? c.practice : null;
  if (pc) {
    const u = pc.unfinished && typeof pc.unfinished === 'object' ? pc.unfinished : null;
    const kind = u && ['prep', 'quiz', 'review'].includes(u.kind) ? u.kind : '';
    const spec = kind === 'prep' && out.specialties.find(s => s.id === String(u.id || ''));
    out.practice = {
      learning: int(pc.learning, 9999), learningInFocus: int(pc.learningInFocus, 9999), due: int(pc.due, 9999),
      unfinished: kind && (kind !== 'prep' || spec) ? { kind, id: spec ? spec.id : kind, name: spec ? spec.name : '', done: int(u.done, 999), total: int(u.total, 999) } : null,
    };
  }
  if (sel && ID_RE.test(String(sel.id || '')) && String(sel.id).startsWith('t:')) {
    out.selected = { id: String(sel.id), en: safeText(sel.en, 160), es: safeText(sel.es, 160), domain: safeText(sel.domain, 80),
      source: safeText(sel.source, 120), hasLink: !!sel.hasLink };
  }
  return out;
}
// "Brief" is a promise: one sentence of details, whatever came back.
function fitLength(details, prefs) {
  if (!prefs || prefs.length !== 'brief' || !details) return details;
  const m = details.match(/^.+?[.!?](\s|$)/);
  return (m ? m[0] : details).trim().slice(0, 240);
}
// Only actions from the list, each with a target the app actually sent.
function allowedActions(parsed, ctx, entries) {
  const glossary = new Set(entries.map(e => e.id).filter(id => id.startsWith('t:')));
  if (ctx.selected) glossary.add(ctx.selected.id);
  const ok = {
    open_prep: new Set(ctx.specialties.map(s => s.id)),
    choose_prep: new Set(['prep']),
    practice_learning: new Set(ctx.learning.count > 0 ? ['learning'] : []),
    start_review: new Set(ctx.learning.hasName ? ['review'] : []),
    set_name: new Set(ctx.learning.hasName ? [] : ['name']),
    open_term: glossary,
    look_up: glossary,
    open_source: new Set(ctx.selected && ctx.selected.hasLink ? [ctx.selected.id] : []),
    continue_prep: new Set(ctx.practice && ctx.practice.unfinished && ctx.practice.unfinished.kind === 'prep' ? [ctx.practice.unfinished.id] : []),
    continue_quiz: new Set(ctx.practice && ctx.practice.unfinished && ctx.practice.unfinished.kind === 'quiz' ? ['quiz'] : []),
    continue_review: new Set(ctx.practice && ctx.practice.unfinished && ctx.practice.unfinished.kind === 'review' ? ['review'] : []),
  };
  const seen = new Set();
  return (Array.isArray(parsed.actions) ? parsed.actions : [])
    .map(a => a && ({ type: clip(a.type, 40), target: clip(a.target, 80) }))
    .filter(a => a && ACTION_TYPES.includes(a.type) && ok[a.type].has(a.target))
    .filter(a => { const k = a.type + '|' + a.target; if (seen.has(k)) return false; seen.add(k); return true; })
    .slice(0, MAX_ACTIONS);
}

export { cleanContext, allowedActions, fitLength, ACTION_TYPES };

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
    const context = cleanContext(body.context);

    // Reference material first, the question last.
    const userContent =
      `HUB ENTRIES (${entries.length}):\n${JSON.stringify(entries)}\n\n` +
      `TEAM NOTES (${lessons.length}):\n${JSON.stringify(lessons)}\n\n` +
      `CONTEXT:\n${JSON.stringify(context)}\n\n` +
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
        details: fitLength(clip(parsed.details), context.prefs),
        sourceIds,
        lessonIds,
        actions: allowedActions(parsed, context, entries),
        suggestTerm: { en: clip(st.en, 120), es: clip(st.es, 120), def: clip(st.def, 300) },
      },
    });
  } catch (err) {
    console.error('ask failed:', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
