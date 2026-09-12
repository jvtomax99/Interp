// Vercel serverless function — looks up a doctor's medical specialty, then
// generates a prep list of specialty-specific English/Spanish interpreting
// terminology, grouped into tiers.
//
// Deploy alongside your existing api/translate.js and api/check-events.js
// — same folder, same environment variable (ANTHROPIC_API_KEY) already
// configured in your Vercel project for Translate.
//
// TIERS: the terminology now comes back grouped rather than as one flat
// list. A flat list treats "biopsia" and "régimen AC-T" as the same
// difficulty, when drug names are where renderings actually break and false
// friends are where they cause harm. The handler still flattens everything
// into `terms` before responding, so results cached under the old shape and
// the doctor directory's term count keep working either way.
//
// IMPORTANT — Vercel function timeout: an open web search + Claude can take
// 15-40 seconds for an ambiguous name. Vercel's default timeout is only
// 10 seconds on the Hobby plan (a hard platform limit that cannot be
// extended by any code change) and up to 60s on Pro/Team (extendable via
// the config below). If requests hang or fail without a clear error, this
// is almost certainly why — the `maxDuration` line only takes effect on
// Pro or higher. The local directory lookup below sidesteps this entirely
// for known John Theurer Cancer Center physicians, since it never has to
// call web search at all.
export const config = {
  maxDuration: 60,
};

// Real physicians from the John Theurer Cancer Center building directory —
// checked first, before ever reaching out to web search. A match here
// means an answer in a couple of seconds instead of 20+, and one that's
// guaranteed correct rather than hoping search finds the right person.
// Update this list as your team confirms more providers.
const JTCC_DIRECTORY = [
  { name: 'Anthony C. Ingenito', division: 'Radiation Oncology' },
  { name: 'Glen Gejerman', division: 'Radiation Oncology' },
  { name: 'Loren Godfrey', division: 'Radiation Oncology' },
  { name: 'Brett Lewis', division: 'Radiation Oncology' },
  { name: 'Samuel A. Goldlust', division: 'Neuro-Oncology' },
  { name: 'Sam Singer', division: 'Neuro-Oncology' },
  { name: 'Andre H. Goy', division: 'Lymphoma' },
  { name: 'Tatyana Feldman', division: 'Lymphoma' },
  { name: 'Lori A. Leslie', division: 'Lymphoma' },
  { name: 'Stefan Faderl', division: 'Leukemia' },
  { name: 'Stuart L. Goldberg', division: 'Leukemia' },
  { name: 'James McCloskey', division: 'Leukemia' },
  { name: 'Jamie L. Koprivnikar', division: 'Leukemia' },
  { name: 'Scott D. Rowley', division: 'Blood & Marrow Transplantation' },
  { name: 'Michele L. Donato', division: 'Blood & Marrow Transplantation' },
  { name: 'Alan Skarbnik', division: 'Blood & Marrow Transplantation' },
  { name: 'Mark S. Pascal', division: 'Oncology, Hematology & Leukemia' },
  { name: 'Robert Tassan', division: 'Oncology, Hematology & Leukemia' },
  { name: 'Robert S. Alter', division: 'Head & Neck Oncology' },
  { name: 'Joshua Richter', division: 'Multiple Myeloma' },
  { name: 'David S. Siegel', division: 'Multiple Myeloma' },
  { name: 'David H. Vesole', division: 'Multiple Myeloma' },
  { name: 'Noa Biran', division: 'Multiple Myeloma' },
  { name: 'Andrew L. Pecora', division: 'Skin & Sarcoma' },
  { name: 'Harry D. Harper', division: 'Thoracic Oncology' },
  { name: 'Stanley E. Waintraub', division: 'Breast Oncology' },
  { name: 'Andrew A. Jennis', division: 'Gastrointestinal Oncology' },
  { name: 'Tracy Proverbs-Singh', division: 'Gastrointestinal Oncology' },
  { name: 'Martin E. Gutierrez', division: 'Oncology, Hematology & Leukemia' },
  { name: 'Donna McNamara', division: 'Gynecologic Oncology' },
  { name: 'Deena Mary Atieh Graham', division: 'Gynecologic Oncology' },
  { name: 'Ami Vaidya', division: 'Gynecologic Oncology' },
  { name: 'Mira C. Hellmann', division: 'Gynecologic Oncology' },
  { name: 'Merieme Klobocista', division: 'Gynecologic Oncology' },
];

function normalizeName(s) {
  return s.toLowerCase().replace(/^dr\.?\s+/i, '').replace(/[.,]/g, '').trim();
}
function lastNameOf(fullName) {
  const parts = normalizeName(fullName).split(/\s+/).filter(Boolean);
  return parts[parts.length - 1] || '';
}
function findInDirectory(inputName) {
  const inputLast = lastNameOf(inputName);
  if (!inputLast) return null;
  return JTCC_DIRECTORY.find(d => lastNameOf(d.name) === inputLast) || null;
}

// Claude Sonnet 5. Was claude-sonnet-4-6, which is previous-generation and
// costs MORE per token ($3/$15 per million vs $2/$10) — this is cheaper and
// newer at once. translate.js was already on Sonnet 5; this file was left
// behind.
const MODEL = 'claude-sonnet-5';

// Structured outputs: the response is constrained to this schema instead of
// the prompt asking nicely for JSON. `specialty` is a plain string ("" when
// unknown) rather than a nullable — normalizeResult already turns a falsy
// value into null, and a union type is the sort of thing that varies between
// schema validators.
const RESEARCH_SCHEMA = {
  type: 'object',
  properties: {
    found: { type: 'boolean' },
    specialty: { type: 'string' },
    note: { type: 'string' },
    tiers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string', enum: ['core', 'procedures', 'drugs', 'anatomy', 'falsefriends'] },
          terms: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                en: { type: 'string' },
                es: { type: 'string' },
                def: { type: 'string' },
              },
              required: ['en', 'es', 'def'],
              additionalProperties: false,
            },
          },
        },
        required: ['key', 'terms'],
        additionalProperties: false,
      },
    },
  },
  required: ['found', 'specialty', 'note', 'tiers'],
  additionalProperties: false,
};

/* Tolerant parser, kept ONLY for the no-schema fallback path below.
   When the schema is accepted the response is already valid JSON and none of
   this runs. */
function parseLoosely(rawText) {
  const cleaned = rawText
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (firstErr) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch (secondErr) {
        console.error('Still failed to parse after extracting {...} span. Raw text:', rawText);
        throw secondErr;
      }
    }
    console.error('No {...} span found in response. Raw text:', rawText);
    throw firstErr;
  }
}

function textOf(data) {
  return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
}

async function postMessages(apiKey, body) {
  return fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body),
  });
}

async function callClaude(apiKey, systemPrompt, userContent, tools) {
  // max_tokens raised from 4096 long ago: five tiers is more output than the
  // old flat list, and hitting max_tokens throws the whole response away
  // rather than truncating gracefully.
  const base = { model: MODEL, max_tokens: 8000, system: systemPrompt, messages: [{ role: 'user', content: userContent }] };
  if (tools) base.tools = tools;

  // Ask for a schema-constrained response first. If this deployment or this
  // combination (structured outputs alongside the server-side web search tool)
  // is rejected, fall back to the old prose-and-parse path rather than failing
  // the request — Doctor Prep keeps working either way.
  let usedSchema = true;
  let response = await postMessages(apiKey, {
    ...base,
    output_config: { format: { type: 'json_schema', schema: RESEARCH_SCHEMA } },
  });

  if (response.status === 400) {
    const errText = await response.text();
    if (/output_config|json_schema|\bformat\b/i.test(errText)) {
      console.warn('Structured outputs rejected, retrying without a schema:', errText);
      usedSchema = false;
      response = await postMessages(apiKey, base);
    } else {
      console.error('Anthropic API error:', response.status, errText);
      throw new Error('api_error');
    }
  }

  if (!response.ok) {
    const errText = await response.text();
    console.error('Anthropic API error:', response.status, errText);
    throw new Error('api_error');
  }

  const data = await response.json();
  if (data.stop_reason === 'max_tokens') {
    console.error('Response was truncated at max_tokens before finishing.');
    throw new Error('truncated');
  }

  const rawText = textOf(data);
  return usedSchema ? JSON.parse(rawText) : parseLoosely(rawText);
}

// Render order, easiest to hardest. The client reads `label` straight off
// the response, so renaming a tier only has to happen here.
const TIERS = [
  { key: 'core',         label: 'Core terms' },
  { key: 'procedures',   label: 'Procedures & tests' },
  { key: 'drugs',        label: 'Drugs & regimens' },
  { key: 'anatomy',      label: 'Anatomy & physiology' },
  { key: 'falsefriends', label: 'False friends & pitfalls' },
];

// Totals 23-37 entries, up from the flat 18-24 — the extra room goes to the
// two tiers that didn't exist before.
const TIER_BRIEF = `Group the terminology into these five tiers:

- core (6-9 entries): the highest-frequency clinical terms in this specialty — what comes up in nearly every encounter.
- procedures (5-8): procedures, imaging and tests this specialist orders or performs. Say in the definition when one normally requires informed consent.
- drugs (5-8): drug and regimen names used in this specialty. Give the generic name with the common US brand name in parentheses on the English side, and render the Spanish the way it is actually said in the room — most drug names are not translated. Be specific to this specialty rather than generic.
- anatomy (4-6): anatomy and physiology terms specific to this specialty.
- falsefriends (3-6): Spanish-English false friends, common mistranslations and register traps that appear in THIS specialty. Each definition must state the trap explicitly — what an interpreter might wrongly reach for, and what the correct rendering is.

Rules for every entry:
- "en" is the English term as a clinician actually says it.
- "es" is the Spanish an interpreter would deliver to a patient in the US. Where usage differs by country, give the widely understood form.
- "def" is one concise sentence written for a professional interpreter, not a patient. Under 25 words.
- No duplicates across tiers. Favor terms specific to this specialty over generic terms already common knowledge. Fewer good entries beat padding.`;

// The response shape is enforced by RESEARCH_SCHEMA above; this stays as a
// description of what each field should CONTAIN, which a schema cannot say.
const RESPONSE_SHAPE = `Fill in every field of the response:
{
  "found": true or false,
  "specialty": "string, or null if not found",
  "note": "1-2 sentences: what you found and roughly where (e.g. hospital/practice), or a brief explanation if nothing reliable was found",
  "tiers": [
    { "key": "core", "terms": [ { "en": "string", "es": "string", "def": "string" } ] },
    { "key": "procedures", "terms": [] },
    { "key": "drugs", "terms": [] },
    { "key": "anatomy", "terms": [] },
    { "key": "falsefriends", "terms": [] }
  ]
}`;

function cleanTerm(t) {
  if (!t || typeof t !== 'object') return null;
  const en = String(t.en || '').trim();
  const es = String(t.es || '').trim();
  if (!en || !es) return null;
  return { en, es, def: String(t.def || '').trim() };
}

// Puts tiers in the fixed order above, drops empty ones, de-duplicates on the
// English term, and flattens everything into `terms` so an older client — or
// a directory entry saved under the old shape — still finds what it expects.
function normalizeResult(parsed) {
  const seen = new Set();
  const tiers = [];
  const flat = [];
  const rawTiers = Array.isArray(parsed.tiers) ? parsed.tiers : [];

  for (const spec of TIERS) {
    const match = rawTiers.find(t => t && t.key === spec.key);
    const terms = [];
    for (const raw of (match && Array.isArray(match.terms) ? match.terms : [])) {
      const term = cleanTerm(raw);
      if (!term) continue;
      const key = term.en.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      terms.push(term);
      flat.push(term);
    }
    if (terms.length) tiers.push({ key: spec.key, label: spec.label, terms });
  }

  // If the model ignores the tier shape and returns a flat list anyway, keep
  // the terms rather than responding with nothing.
  if (!tiers.length && Array.isArray(parsed.terms)) {
    for (const raw of parsed.terms) {
      const term = cleanTerm(raw);
      if (!term || seen.has(term.en.toLowerCase())) continue;
      seen.add(term.en.toLowerCase());
      flat.push(term);
    }
    if (flat.length) tiers.push({ key: 'core', label: 'Core terms', terms: flat.slice() });
  }

  return {
    found: parsed.found === true,
    specialty: parsed.specialty || null,
    note: parsed.note || '',
    tiers,
    terms: flat,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { doctorName, specialty, location } = req.body || {};
  if (!doctorName || typeof doctorName !== 'string' || !doctorName.trim()) {
    res.status(400).json({ error: 'A doctor name is required.' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server is not configured with an API key.' });
    return;
  }

  try {
    const directoryMatch = findInDirectory(doctorName);

    if (directoryMatch) {
      // Fast path: no web search at all, just generate terminology for a
      // division we already know for certain — a couple of seconds, tops.
      const systemPrompt = `You are helping a professional medical interpreter prepare for an appointment. The doctor's specialty division is already known: "${directoryMatch.division}" at John Theurer Cancer Center. Do not search the web — go straight to producing the prep terminology for that division.

${TIER_BRIEF}

${RESPONSE_SHAPE}
Set "found" to true, "specialty" to "${directoryMatch.division} — John Theurer Cancer Center", and "note" to mention this was matched directly against the confirmed building directory.`;

      const parsed = await callClaude(apiKey, systemPrompt, `Division: ${directoryMatch.division}`, null);
      res.status(200).json(normalizeResult(parsed));
      return;
    }

    // Fallback path: not a known name, fall back to a real web search.
    const details = [`Doctor name: ${doctorName.trim()}`];
    if (specialty && specialty.trim()) details.push(`Specialty (if helpful to confirm): ${specialty.trim()}`);
    if (location && location.trim()) details.push(`Hospital / location: ${location.trim()}`);

    const isHackensack = location && /hackensack/i.test(location);

    const systemPrompt = `You are a research assistant helping a professional medical interpreter prepare for an upcoming appointment. Given a doctor's name (and optionally a specialty or hospital to help disambiguate a common name), search the web to determine their medical specialty and specific practice focus (for example: "Hematology/Oncology — Lymphoma" rather than just "Oncology"). Do at most one or two targeted searches — prioritize speed over exhaustiveness, and if the provided specialty/location already narrows it down, use that instead of searching further.${isHackensack ? ' The doctor is affiliated with Hackensack Meridian Health — check the official Hackensack Meridian "Find a Doctor" directory (doctors.hackensackmeridianhealth.org) first, since it directly lists specialty, department, and location for their affiliated physicians.' : ''} Then produce the prep terminology for that specialty.

${TIER_BRIEF}

${RESPONSE_SHAPE}
If you cannot find reliable, specific information about this named individual, set "found" to false, leave "specialty" as an empty string, explain briefly in "note", and still populate the tiers with widely-useful medical interpreting terminology as a fallback so the response is never empty.`;

    // web_search_20260209 adds dynamic filtering and is supported on Sonnet 5.
    // Worth having here specifically: this tool's whole job is finding the
    // RIGHT Dr. Gutierrez rather than any of them.
    const webSearchTool = { type: 'web_search_20260209', name: 'web_search', max_uses: 2 };
    if (isHackensack) {
      webSearchTool.allowed_domains = ['hackensackmeridianhealth.org', 'doctors.hackensackmeridianhealth.org'];
      webSearchTool.strict = true;
    }

    const parsed = await callClaude(apiKey, systemPrompt, details.join('\n'), [webSearchTool]);
    res.status(200).json(normalizeResult(parsed));
  } catch (err) {
    console.error('doctor-research handler failed:', err);
    if (err.message === 'api_error') {
      res.status(502).json({ error: 'Research service is temporarily unavailable. Please try again.' });
    } else if (err.message === 'truncated') {
      res.status(502).json({ error: 'The response was cut off before finishing. Please try again.' });
    } else if (err instanceof SyntaxError) {
      res.status(502).json({ error: 'Could not understand the research result. Please try again.' });
    } else {
      res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  }
}
