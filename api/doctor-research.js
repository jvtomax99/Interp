// Vercel serverless function — looks up a doctor's medical specialty via
// Claude with web search enabled, then generates a prep list of
// specialty-specific English/Spanish interpreting terminology.
//
// Deploy alongside your existing api/translate.js and api/check-events.js
// — same folder, same environment variable (ANTHROPIC_API_KEY) already
// configured in your Vercel project for Translate.
//
// IMPORTANT — Vercel function timeout: web search + Claude can take
// 15-40 seconds for an ambiguous name. Vercel's default timeout is only
// 10 seconds on the Hobby plan (which cannot be extended — that's a hard
// platform limit) and up to 60s on Pro/Team (extendable via the config
// below). If requests are hanging or failing without a clear error, this
// is almost certainly why. The `maxDuration` line only takes effect on
// Pro or higher.
export const config = {
  maxDuration: 60,
};

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

  // Filters narrow the web search to the right person and cut down on how
  // much searching Claude needs to do for a common name — both a speed
  // and an accuracy improvement.
  const details = [`Doctor name: ${doctorName.trim()}`];
  if (specialty && specialty.trim()) details.push(`Specialty (if helpful to confirm): ${specialty.trim()}`);
  if (location && location.trim()) details.push(`Hospital / location: ${location.trim()}`);

  const systemPrompt = `You are a research assistant helping a professional medical interpreter prepare for an upcoming appointment. Given a doctor's name (and optionally a specialty or hospital to help disambiguate a common name), search the web to determine their medical specialty and specific practice focus (for example: "Hematology/Oncology — Lymphoma" rather than just "Oncology"). Do at most one or two targeted searches — prioritize speed over exhaustiveness, and if the provided specialty/location already narrows it down, use that instead of searching further. Then produce a prep list of 18 to 24 English/Spanish medical terms an interpreter should be ready to use for that specialty. Favor terms specific to that specialty over generic terms already common knowledge. Definitions should be one concise sentence, written for a professional interpreter, not a patient.

Respond with ONLY valid JSON, no other text, no markdown code fences, in exactly this shape:
{
  "found": true or false,
  "specialty": "string, or null if not found",
  "note": "1-2 sentences: what you found and roughly where (e.g. hospital/practice), or a brief explanation if nothing reliable was found",
  "terms": [ { "en": "string", "es": "string", "def": "string" }, ... ]
}

If you cannot find reliable, specific information about this named individual, set "found" to false, explain briefly in "note", and still populate "terms" with a general list of widely-useful medical interpreting terms as a fallback so the response is never empty.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: details.join('\n') }
        ],
        tools: [
          // max_uses caps how many searches Claude can run in one request —
          // the main lever for keeping this fast on an ambiguous name.
          { type: 'web_search_20250305', name: 'web_search', max_uses: 2 }
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      res.status(502).json({ error: 'Research service is temporarily unavailable. Please try again.' });
      return;
    }

    const data = await response.json();

    // Claude may interleave tool_use / tool_result / text blocks when using
    // web search. The final answer is in the text block(s) — usually just
    // the last one, but join all text blocks defensively in case it's split.
    const textBlocks = (data.content || [])
      .filter(block => block.type === 'text')
      .map(block => block.text);
    const rawText = textBlocks.join('\n').trim();

    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('Failed to parse model response as JSON:', cleaned);
      res.status(502).json({ error: 'Could not understand the research result. Please try again.' });
      return;
    }

    if (!Array.isArray(parsed.terms)) parsed.terms = [];
    res.status(200).json(parsed);
  } catch (err) {
    console.error('doctor-research handler failed:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
