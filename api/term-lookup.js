/* Vercel serverless function — find live, authoritative reading for a term.
 *
 * WHY THIS EXISTS
 * A glossary term used to link to a fixed MedlinePlus search address built by
 * string concatenation. A hardcoded URL is a guess about someone else's site
 * that is only ever going to get more wrong: paths move, search endpoints get
 * retired, and nothing in the app notices. The result is a link that opens a
 * blank page, which is what happened here.
 *
 * Searching at the moment of the tap cannot go stale that way. Every URL
 * returned below came back from a search run seconds earlier, so it exists.
 *
 * WHY THE DOMAIN LIST MATTERS MORE THAN THE MODEL
 * `allowed_domains` constrains the search to patient-education and clinical
 * sources an interpreter can stand behind. Without it a search for a symptom
 * finds forums, content farms and clinic advertising — plausible-looking and
 * wrong, which is worse than a dead link in a hospital.
 *
 * Spanish is a first-class result, not an afterthought: a Dominican patient's
 * family reads the Spanish page, and MedlinePlus, CDC and NCI all publish
 * real Spanish versions rather than machine translations.
 *
 * IT IS READING, NOT ADVICE. These are references for the interpreter's own
 * preparation. Nothing here is shown to a patient or used as a rendering.
 *
 * SETUP: none beyond the ANTHROPIC_API_KEY already configured for Translate.
 */

// A web search plus a model turn runs well past Vercel's 10s Hobby default.
// This only takes effect on Pro or higher — same caveat as doctor-research.
export const config = {
  maxDuration: 60,
};

const MODEL = 'claude-opus-5';

// A short pass: find pages, judge whether they match the sense the glossary
// means, stop. If results come back thin, raise this before changing model.
const EFFORT = 'low';

const MAX_FIELD = 600;
const MAX_SOURCES = 5;

/* Sources an interpreter can cite without hedging. Government and academic
 * patient-education first, then the large non-profits that publish real
 * Spanish rather than a machine rendering of their English.
 *
 * Hostnames only — subdomains are covered automatically, so `nih.gov` also
 * allows `www.cancer.gov`-style subdomains of that host. Keep this under 64
 * entries; the API rejects a longer list. */
const TRUSTED_SITES = [
  'medlineplus.gov',
  'nih.gov',
  'nlm.nih.gov',
  'cancer.gov',
  'cdc.gov',
  'niddk.nih.gov',
  'nhlbi.nih.gov',
  'ninds.nih.gov',
  'nei.nih.gov',
  'fda.gov',
  'mayoclinic.org',
  'clevelandclinic.org',
  'hopkinsmedicine.org',
  'stanfordchildrens.org',
  'kidshealth.org',
  'healthychildren.org',
  'familydoctor.org',
  'heart.org',
  'diabetes.org',
  'cancer.org',
  'kidney.org',
  'lung.org',
  'arthritis.org',
  'who.int',
  'paho.org',
];

const LOOKUP_SCHEMA = {
  type: 'object',
  properties: {
    sources: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          // The page's own title, not a description of it.
          title: { type: 'string' },
          url: { type: 'string' },
          // Shown as a badge so the interpreter can see the source at a glance.
          site: { type: 'string' },
          language: { type: 'string', enum: ['en', 'es'] },
          // One short line: what this page gives you that the others do not.
          why: { type: 'string' },
        },
        required: ['title', 'url', 'site', 'language', 'why'],
        additionalProperties: false,
      },
    },
    // Empty when the search found nothing worth offering, which is a real
    // answer for a rare or institution-specific term.
    note: { type: 'string' },
  },
  required: ['sources', 'note'],
  additionalProperties: false,
};

const SYSTEM = `You find reference reading for staff medical interpreters at Hackensack University Medical Center, who work between English and Spanish. Their patients are largely Dominican, Puerto Rican, Colombian, Ecuadorian and Mexican.

You are given one glossary entry. Search for pages that explain that concept, and return the best few.

Rules:

- Return ONLY URLs that appeared in your search results. Never assemble a URL from a site's naming pattern, and never guess a search address. A URL you did not see in a result is worse than returning nothing, because it sends someone to a dead page.
- Prefer the specific page about the concept over a section index or a site's search results page.
- Include at least one Spanish page when a genuine Spanish version exists. MedlinePlus, CDC and the National Cancer Institute publish real Spanish, not machine translation. Do not pass off an English page as Spanish.
- Judge the sense, not the spelling. The glossary's definition says which meaning is meant — a term that is a heart condition in this entry should not return a page about the unrelated orthopedic sense.
- Three to five sources is right. Fewer is fine. Do not pad with weak matches.
- "why" is one short line addressed to a professional interpreter: what this page gives them. Not a summary of the disease.
- If nothing solid comes back, return an empty sources array and say so plainly in "note". That is a useful answer.

Keep "note" to one sentence, and empty when the sources speak for themselves.`;

function clip(v) {
  return String(v == null ? '' : v).trim().slice(0, MAX_FIELD);
}

/* A URL is only worth showing if it is absolute, https, and on a site we
 * asked for. The domain list is enforced at the API, but a model can still
 * quote a URL out of page text rather than out of a result — so it is checked
 * again here rather than trusted. */
function usableUrl(raw) {
  const value = clip(raw);
  if (!value) return '';
  let parsed;
  try {
    parsed = new URL(value);
  } catch (err) {
    return '';
  }
  if (parsed.protocol !== 'https:') return '';
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const allowed = TRUSTED_SITES.some(site => host === site || host.endsWith('.' + site));
  return allowed ? parsed.toString() : '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // The app falls back to a plain web search link and says so, rather than
    // showing an interpreter an error they can do nothing about.
    return res.status(503).json({ error: 'not_configured' });
  }

  try {
    const { term } = req.body || {};
    if (!term || typeof term !== 'object' || !clip(term.en)) {
      return res.status(400).json({ error: 'A term with an English side is required.' });
    }

    const entry = {
      en: clip(term.en),
      es: clip(term.es),
      def: clip(term.def),
      domain: clip(term.domain),
    };

    const userContent =
      `Glossary entry:\n${JSON.stringify(entry, null, 2)}\n\n` +
      `Find reference reading for this concept. The definition above is what decides which sense of the term is meant.`;

    const body = {
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM,
      messages: [{ role: 'user', content: userContent }],
      tools: [{
        type: 'web_search_20260209',
        name: 'web_search',
        max_uses: 4,
        allowed_domains: TRUSTED_SITES,
      }],
    };

    const post = extra => fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ ...body, ...extra }),
    });

    // Same defensive shape as the other endpoints: prefer a schema-constrained
    // response, but never fail the lookup because the parameter was rejected.
    let usedSchema = true;
    let upstream = await post({
      output_config: { effort: EFFORT, format: { type: 'json_schema', schema: LOOKUP_SCHEMA } },
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

    /* A web search failure arrives as a normal 200 with an error object where
     * the results list would be — it does not throw. On success `content` is
     * an array; on failure it is a single object. Branch on that before
     * treating it as results. */
    for (const block of data.content || []) {
      if (block.type === 'web_search_tool_result' && !Array.isArray(block.content)) {
        console.error('Web search failed:', JSON.stringify(block.content));
      }
    }

    if (data.stop_reason === 'max_tokens') {
      console.error('Response truncated at max_tokens before finishing.');
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
      console.error('Could not parse term-lookup response:', raw.slice(0, 400));
      return res.status(200).json({ sources: [], note: '' });
    }

    const sources = (Array.isArray(parsed.sources) ? parsed.sources : [])
      .map(s => ({
        title: clip(s && s.title),
        url: usableUrl(s && s.url),
        site: clip(s && s.site),
        language: (s && s.language) === 'es' ? 'es' : 'en',
        why: clip(s && s.why),
      }))
      .filter(s => s.url && s.title)
      // Two results for the same page help nobody.
      .filter((s, i, all) => all.findIndex(o => o.url === s.url) === i)
      .slice(0, MAX_SOURCES);

    return res.status(200).json({ sources, note: clip(parsed.note) });

  } catch (err) {
    console.error('term-lookup handler failed:', err);
    return res.status(200).json({ sources: [], note: '' });
  }
}
