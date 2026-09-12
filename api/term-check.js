/* Vercel serverless function — a second pair of eyes on a new glossary term.
 *
 * WHY THIS EXISTS
 * The glossary is maintained by several interpreters at once. Left alone, a
 * shared glossary drifts: the same concept gets entered twice under different
 * domains, a plausible-looking Spanish rendering turns out to be a false
 * friend, and a term meant for a patient conversation gets written in a
 * register no patient uses. None of that is visible to the person adding the
 * term, because they already know what they meant.
 *
 * This checks a term right after it is saved and reports what it notices.
 *
 * IT IS ADVISORY, NEVER A GATE.
 * The term is already saved by the time this runs. Nothing here can block,
 * reject, or alter a save. A hospital tool must not refuse a certified
 * interpreter's entry because a model disagreed with it — the interpreter is
 * the expert and the model is a reviewer. Findings are suggestions to accept
 * or dismiss.
 *
 * DUPLICATE DETECTION IS A TWO-STAGE JOB
 * The client finds near-matches locally (it already holds all ~1,700 terms in
 * memory) and sends only a handful of candidates. Sending the whole glossary
 * on every save would be slow and expensive; local matching catches the
 * spelling-similar ones, and the model judges whether they are actually the
 * same concept — which string similarity cannot do ("shot" vs "injection").
 *
 * SETUP: none beyond the ANTHROPIC_API_KEY already configured for Translate.
 */

const MODEL = 'claude-opus-5';

// This runs on every term save, so it is deliberately a quick pass rather
// than a deep one. If findings come back shallow — missing false friends you
// would expect it to catch — raise this to 'medium' or 'high' first; that is
// the knob that matters here, not the model.
const EFFORT = 'low';

const MAX_FIELD = 600;      // guards against oversized or abusive requests
const MAX_CANDIDATES = 10;

const FINDING_TYPES = [
  'false_friend',   // the Spanish looks right but means something else
  'duplicate',      // the same concept already exists in the glossary
  'register',       // wrong formality level for a patient conversation
  'regional',       // the rendering is marked to one country in a way that matters
  'spanish',        // the Spanish is missing, misspelled, or not the usual term
  'definition',     // the definition is wrong, circular, or unhelpful
  'other',
];

const CHECK_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['ok', 'review'] },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: FINDING_TYPES },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          // One sentence, addressed to a professional interpreter.
          message: { type: 'string' },
          // A concrete replacement where one applies, otherwise "".
          suggestion: { type: 'string' },
          // The id of the existing term this duplicates, otherwise "".
          duplicateId: { type: 'string' },
        },
        required: ['type', 'severity', 'message', 'suggestion', 'duplicateId'],
        additionalProperties: false,
      },
    },
  },
  required: ['verdict', 'findings'],
  additionalProperties: false,
};

const SYSTEM = `You review new entries for a Spanish/English medical glossary maintained by the staff interpreter team at Hackensack University Medical Center. Their patients are largely Dominican, Puerto Rican, Colombian, Ecuadorian and Mexican.

You are reviewing the work of certified professional interpreters. They are the experts. Report only what would genuinely change the entry — a reviewer who flags everything gets ignored, and that is worse than one who says nothing.

Report a finding ONLY when one of these is true:

- false_friend: the Spanish given is a false friend or a common mistranslation of the English (intoxicado, constipado, embarazada, molestar, and the like), or is otherwise likely to be misunderstood as something clinically different.
- duplicate: one of the existing terms supplied is the SAME CONCEPT, not merely a similar string. "shot" and "injection" are the same concept; "biopsy" and "biopsia" are the two sides of one entry, not a duplicate of each other. Put that term's id in duplicateId.
- register: the Spanish is pitched at a register no patient would use or understand, in an entry clearly meant for patient communication.
- regional: the rendering is specific to one country in a way that would confuse this patient population, and a widely understood alternative exists.
- spanish: the Spanish is missing, misspelled, or not the term an interpreter would actually deliver in a US hospital.
- definition: the definition is circular, wrong, or would not help a colleague who did not already know the term.

Say nothing about: style, capitalisation, punctuation, a definition simply being terse, or a perfectly good term you would merely have phrased differently. A correct entry must return verdict "ok" and an empty findings array.

Set verdict to "review" only if findings is non-empty. Keep each message to one sentence. Use "" for suggestion and duplicateId when they do not apply.`;

function clip(v) {
  return String(v == null ? '' : v).trim().slice(0, MAX_FIELD);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // The app treats this as "check unavailable" and stays silent, rather than
    // showing the interpreter an error they can do nothing about.
    return res.status(503).json({ error: 'not_configured' });
  }

  try {
    const { term, candidates } = req.body || {};
    if (!term || typeof term !== 'object' || !clip(term.en)) {
      return res.status(400).json({ error: 'A term with an English side is required.' });
    }

    const entry = {
      en: clip(term.en),
      es: clip(term.es),
      def: clip(term.def),
      notes: clip(term.notes),
      domain: clip(term.domain),
    };

    const nearby = (Array.isArray(candidates) ? candidates : [])
      .slice(0, MAX_CANDIDATES)
      .map(c => ({ id: clip(c && c.id), en: clip(c && c.en), es: clip(c && c.es), domain: clip(c && c.domain) }))
      .filter(c => c.id && c.en);

    const userContent =
      `New entry to review:\n${JSON.stringify(entry, null, 2)}\n\n` +
      (nearby.length
        ? `Existing glossary entries with similar wording — judge whether any is the same concept:\n${JSON.stringify(nearby, null, 2)}`
        : 'No existing entries were close enough in wording to be duplicate candidates.');

    const post = (extra) => fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system: SYSTEM,
        messages: [{ role: 'user', content: userContent }],
        ...extra,
      }),
    });

    // Same defensive shape as translate.js: prefer a schema-constrained
    // response, but never fail the check because the parameter was rejected.
    let usedSchema = true;
    let upstream = await post({
      output_config: { effort: EFFORT, format: { type: 'json_schema', schema: CHECK_SCHEMA } },
    });

    if (upstream.status === 400) {
      const detail = await upstream.text();
      if (/output_config|json_schema|\bformat\b|\beffort\b/i.test(detail)) {
        console.warn('Structured outputs rejected, retrying without a schema:', detail);
        usedSchema = false;
        upstream = await post({});
      } else {
        console.error('Anthropic API error:', upstream.status, detail);
        return res.status(502).json({ error: 'upstream_error' });
      }
    }

    if (!upstream.ok) {
      console.error('Anthropic API error:', upstream.status, await upstream.text());
      return res.status(502).json({ error: 'upstream_error' });
    }

    const data = await upstream.json();
    const raw = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(usedSchema ? raw : raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim());
    } catch (err) {
      // A check that cannot be read is the same as no check. Staying quiet is
      // the right failure mode for something advisory.
      console.error('Could not parse term-check response:', raw);
      return res.status(200).json({ verdict: 'ok', findings: [] });
    }

    const findings = (Array.isArray(parsed.findings) ? parsed.findings : [])
      .filter(f => f && FINDING_TYPES.includes(f.type) && clip(f.message))
      .slice(0, 5)
      .map(f => ({
        type: f.type,
        severity: ['high', 'medium', 'low'].includes(f.severity) ? f.severity : 'low',
        message: clip(f.message),
        suggestion: clip(f.suggestion),
        duplicateId: clip(f.duplicateId),
      }));

    // The verdict is derived rather than trusted, so the two can never
    // disagree — "review" with nothing to review would be a dead end.
    return res.status(200).json({ verdict: findings.length ? 'review' : 'ok', findings });

  } catch (err) {
    console.error('term-check handler failed:', err);
    return res.status(200).json({ verdict: 'ok', findings: [] });
  }
}
