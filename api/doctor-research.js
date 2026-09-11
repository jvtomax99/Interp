// api/doctor-research.js
//
// Doctor Prep. Looks up a provider, then returns terminology for that
// specialty grouped into tiers rather than as one flat list.
//
// Why tiers: a flat list treats "biopsia" and "régimen AC-T" as the same
// difficulty, when they are not. Drug and regimen names are where renderings
// break (brand vs generic), procedures carry consent language, and false
// friends are the ones that cause real harm in a room. Grouping them lets an
// interpreter skim the part they actually need before walking in.
//
// The response stays backward compatible: `terms` is still a flat array of
// everything, so cached results and the directory's term count keep working
// against either shape.

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-5';

// Order matters — this is the order they render in, easiest to hardest.
const TIERS = [
  { key: 'core',        label: 'Core terms' },
  { key: 'procedures',  label: 'Procedures & tests' },
  { key: 'drugs',       label: 'Drugs & regimens' },
  { key: 'anatomy',     label: 'Anatomy & physiology' },
  { key: 'falsefriends', label: 'False friends & pitfalls' },
];

function buildPrompt(doctorName, specialty, location) {
  const hints = [
    specialty ? `Stated specialty: ${specialty}` : null,
    location ? `Stated location or hospital: ${location}` : null,
  ].filter(Boolean).join('\n');

  return `You are supporting a certified Spanish-English medical interpreter at a
US hospital who is preparing for an appointment with a specific physician.

Physician name: ${doctorName}
${hints}

Step 1 — Identify the physician. Use web search. Prefer the hospital's own
provider directory or a primary source. If you cannot identify them with
reasonable confidence, say so and continue using the stated specialty (or your
best inference from the name alone) so the terminology is still useful.

Step 2 — Produce interpreting terminology for that specialty, grouped into
these tiers:

- core: the highest-frequency clinical terms in this specialty. What comes up
  in nearly every encounter.
- procedures: procedures, imaging, and tests this specialist orders or
  performs. Note in the definition when one normally requires informed consent.
- drugs: drug and regimen names. Give the generic name with the common US brand
  name in parentheses on the English side, and render the Spanish the way it is
  actually said in the room — many drug names are not translated. This tier
  matters most; be specific to this specialty rather than generic.
- anatomy: anatomy and physiology terms specific to this specialty.
- falsefriends: Spanish-English false friends, common mistranslations, and
  register traps that appear in THIS specialty. For each, the definition must
  state the trap explicitly — what an interpreter might wrongly reach for and
  what the correct rendering is.

Rules for every entry:
- "en" is the English term as a clinician says it.
- "es" is the Spanish an interpreter would actually deliver to a patient in the
  US. Where usage differs by country, give the widely understood form.
- "def" is one plain sentence, under 25 words, useful to an interpreter rather
  than a definition copied from a textbook.
- No duplicates across tiers.
- Aim for 6-10 entries in core, drugs and procedures; 4-6 in anatomy; 3-6 in
  falsefriends. Fewer good entries beat padding.

Return ONLY a JSON object, no markdown fences and no preamble:

{
  "found": true or false,
  "specialty": "the specialty you are giving terminology for",
  "note": "one or two sentences: who this physician is, and what an interpreter should expect from this kind of appointment",
  "tiers": [
    { "key": "core", "terms": [ { "en": "", "es": "", "def": "" } ] },
    { "key": "procedures", "terms": [] },
    { "key": "drugs", "terms": [] },
    { "key": "anatomy", "terms": [] },
    { "key": "falsefriends", "terms": [] }
  ]
}`;
}

// The model can still wrap JSON in prose or fences despite instructions, so
// pull the outermost object rather than trusting the whole string.
function extractJson(text) {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try { return JSON.parse(cleaned); } catch (e) { /* fall through */ }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try { return JSON.parse(cleaned.slice(start, end + 1)); } catch (e) { return null; }
}

function cleanTerm(t) {
  if (!t || typeof t !== 'object') return null;
  const en = String(t.en || '').trim();
  const es = String(t.es || '').trim();
  if (!en || !es) return null;
  return { en, es, def: String(t.def || '').trim() };
}

// Normalizes whatever came back into the tier order above, drops empties and
// de-duplicates on the English term so a card can't appear twice.
function normalize(parsed, fallbackSpecialty) {
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

  // If the model ignored the tier shape and returned a flat list, keep it
  // rather than returning nothing.
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
    specialty: String(parsed.specialty || fallbackSpecialty || '').trim(),
    note: String(parsed.note || '').trim(),
    tiers,
    terms: flat, // flat list kept for the older client and the directory count
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'The research service is not configured.' });
    return;
  }

  const { doctorName, specialty, location } = req.body || {};
  if (!doctorName || !String(doctorName).trim()) {
    res.status(400).json({ error: 'A doctor name is required.' });
    return;
  }

  try {
    const upstream = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
        messages: [
          { role: 'user', content: buildPrompt(String(doctorName).trim(), specialty, location) },
        ],
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      console.error('Anthropic error', upstream.status, detail);
      res.status(502).json({ error: 'The research service returned an error. Try again.' });
      return;
    }

    const data = await upstream.json();

    // With web search enabled the reply is a mix of block types; the JSON is
    // in the text blocks, so join those rather than assuming content[0].
    const text = (data.content || [])
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    const parsed = extractJson(text);
    if (!parsed) {
      console.error('Unparseable research response:', text.slice(0, 500));
      res.status(502).json({ error: 'The research came back in an unexpected format. Try again.' });
      return;
    }

    const result = normalize(parsed, specialty);
    if (!result.terms.length) {
      res.status(502).json({ error: 'No terminology came back for that search. Try adding a specialty.' });
      return;
    }

    res.status(200).json(result);
  } catch (err) {
    console.error('doctor-research failed:', err);
    res.status(500).json({ error: 'Could not complete the research. Try again.' });
  }
}
