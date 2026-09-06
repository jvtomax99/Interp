// Vercel serverless function — looks up a doctor's medical specialty, then
// generates a prep list of specialty-specific English/Spanish interpreting
// terminology.
//
// Deploy alongside your existing api/translate.js and api/check-events.js
// — same folder, same environment variable (ANTHROPIC_API_KEY) already
// configured in your Vercel project for Translate.
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

async function callClaude(apiKey, systemPrompt, userContent, tools) {
  const body = { model: 'claude-sonnet-4-6', max_tokens: 2000, system: systemPrompt, messages: [{ role: 'user', content: userContent }] };
  if (tools) body.tools = tools;
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errText = await response.text();
    console.error('Anthropic API error:', response.status, errText);
    throw new Error('api_error');
  }
  const data = await response.json();
  const textBlocks = (data.content || []).filter(b => b.type === 'text').map(b => b.text);
  const rawText = textBlocks.join('\n').trim();
  const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned);
}

const RESPONSE_SHAPE = `Respond with ONLY valid JSON, no other text, no markdown code fences, in exactly this shape:
{
  "found": true or false,
  "specialty": "string, or null if not found",
  "note": "1-2 sentences: what you found and roughly where (e.g. hospital/practice), or a brief explanation if nothing reliable was found",
  "terms": [ { "en": "string", "es": "string", "def": "string" }, ... ]
}`;

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
      const systemPrompt = `You are helping a professional medical interpreter prepare for an appointment. The doctor's specialty division is already known: "${directoryMatch.division}" at John Theurer Cancer Center. Do not search the web — go straight to producing a prep list of 18 to 24 English/Spanish medical terms specific to that division. Favor terms specific to that specialty over generic terms already common knowledge. Definitions should be one concise sentence, written for a professional interpreter, not a patient.

${RESPONSE_SHAPE}
Set "found" to true, "specialty" to "${directoryMatch.division} — John Theurer Cancer Center", and "note" to mention this was matched directly against the confirmed building directory.`;

      const parsed = await callClaude(apiKey, systemPrompt, `Division: ${directoryMatch.division}`, null);
      if (!Array.isArray(parsed.terms)) parsed.terms = [];
      res.status(200).json(parsed);
      return;
    }

    // Fallback path: not a known name, fall back to a real web search.
    const details = [`Doctor name: ${doctorName.trim()}`];
    if (specialty && specialty.trim()) details.push(`Specialty (if helpful to confirm): ${specialty.trim()}`);
    if (location && location.trim()) details.push(`Hospital / location: ${location.trim()}`);

    const isHackensack = location && /hackensack/i.test(location);

    const systemPrompt = `You are a research assistant helping a professional medical interpreter prepare for an upcoming appointment. Given a doctor's name (and optionally a specialty or hospital to help disambiguate a common name), search the web to determine their medical specialty and specific practice focus (for example: "Hematology/Oncology — Lymphoma" rather than just "Oncology"). Do at most one or two targeted searches — prioritize speed over exhaustiveness, and if the provided specialty/location already narrows it down, use that instead of searching further.${isHackensack ? ' The doctor is affiliated with Hackensack Meridian Health — check the official Hackensack Meridian "Find a Doctor" directory (doctors.hackensackmeridianhealth.org) first, since it directly lists specialty, department, and location for their affiliated physicians.' : ''} Then produce a prep list of 18 to 24 English/Spanish medical terms an interpreter should be ready to use for that specialty. Favor terms specific to that specialty over generic terms already common knowledge. Definitions should be one concise sentence, written for a professional interpreter, not a patient.

${RESPONSE_SHAPE}
If you cannot find reliable, specific information about this named individual, set "found" to false, explain briefly in "note", and still populate "terms" with a general list of widely-useful medical interpreting terms as a fallback so the response is never empty.`;

    const webSearchTool = { type: 'web_search_20250305', name: 'web_search', max_uses: 2 };
    if (isHackensack) {
      webSearchTool.allowed_domains = ['hackensackmeridianhealth.org', 'doctors.hackensackmeridianhealth.org'];
      webSearchTool.strict = true;
    }

    const parsed = await callClaude(apiKey, systemPrompt, details.join('\n'), [webSearchTool]);
    if (!Array.isArray(parsed.terms)) parsed.terms = [];
    res.status(200).json(parsed);
  } catch (err) {
    console.error('doctor-research handler failed:', err);
    if (err.message === 'api_error') {
      res.status(502).json({ error: 'Research service is temporarily unavailable. Please try again.' });
    } else if (err instanceof SyntaxError) {
      res.status(502).json({ error: 'Could not understand the research result. Please try again.' });
    } else {
      res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  }
}
