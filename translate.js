/* Vercel serverless function — AI-assisted medical terminology lookup.
 *
 * WHY THIS FILE EXISTS
 * The API key must never appear in index.html. Anything in the page can be
 * read by anyone who opens the site, and a leaked key can be used to run up
 * charges on your account. This function runs on Vercel's servers, reads the
 * key from an environment variable, and returns only the finished answer — so
 * the key is never sent to the browser.
 *
 * SETUP
 *   1. Get an API key at console.anthropic.com
 *   2. In Vercel: Project → Settings → Environment Variables
 *      Name:  ANTHROPIC_API_KEY
 *      Value: your key
 *   3. Redeploy
 *
 * If the key is missing, this returns a clear message and the app falls back
 * to the free translation path rather than breaking.
 */

const MODEL = 'claude-sonnet-5';   // swap to 'claude-haiku-4-5-20251001' for lower cost
const MAX_CHARS = 400;             // guards against oversized/abusive requests

const LANG_NAMES = {
  en: 'English', es: 'Spanish', ar: 'Arabic', fr: 'French', pt: 'Portuguese',
  zh: 'Chinese (Simplified)', ko: 'Korean', it: 'Italian', pl: 'Polish',
  hi: 'Hindi', ru: 'Russian', tl: 'Tagalog'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'not_configured',
      message: 'ANTHROPIC_API_KEY is not set in this project\u2019s environment variables.'
    });
  }

  try {
    const { text, context, from, to } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Missing text to translate.' });
    }
    if (text.length > MAX_CHARS || (context && context.length > MAX_CHARS)) {
      return res.status(400).json({ error: 'Text too long for a terminology lookup.' });
    }

    const fromName = LANG_NAMES[from] || 'English';
    const toName = LANG_NAMES[to] || 'Spanish';

    const system = `You support certified healthcare interpreters working in a U.S. hospital. \
You are a terminology reference, not a substitute for an interpreter, and you never \
produce content intended to be read directly to a patient in place of live interpreting.

Given a medical term or phrase, return a rigorous terminology breakdown.

Respond with ONLY a JSON object, no markdown fences and no preamble, in this shape:
{
  "primary": "the standard clinical rendering in the target language",
  "plain": "a plain-language version an average patient would understand, or null if identical to primary",
  "register": "one short sentence on register/formality, or null",
  "regional": "note on meaningful regional variation (e.g. Mexican vs Caribbean vs Peninsular Spanish), or null",
  "caution": "a false-friend, ambiguity, or common-error warning, or null",
  "notes": "one or two sentences of useful context for an interpreter, or null"
}

Rules:
- Be precise about clinical meaning. Accuracy matters more than fluency.
- If the source term is ambiguous, say so in "caution" and translate the most likely clinical sense.
- Flag false friends explicitly (for example intoxicado, constipado, embarazada, molestar).
- Prefer terminology a hospital interpreter would actually use.
- Use null, not empty strings, for fields that do not apply.`;

    const userMsg = context
      ? `Translate from ${fromName} to ${toName}.\n\nTerm: "${text}"\n\nIt appeared in this sentence: "${context}"`
      : `Translate from ${fromName} to ${toName}.\n\nTerm: "${text}"`;

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        system,
        messages: [{ role: 'user', content: userMsg }]
      })
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      console.error('Anthropic API error:', upstream.status, detail);
      return res.status(502).json({ error: 'upstream_error', status: upstream.status });
    }

    const data = await upstream.json();
    const raw = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim();

    // Strip code fences if the model wrapped the JSON despite instructions.
    const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      // Never fail outright on a formatting hiccup — return the prose instead.
      return res.status(200).json({ primary: cleaned, notes: null, _unstructured: true });
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error('translate function error:', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
