/* The one Claude helper for the AI endpoints (not an endpoint itself: Vercel
 * skips files that start with "_"). Every request to the Messages API goes
 * through callClaude() below, so the retry rule, the refusal check and the
 * web-search failure log live in one place: Translate and the term check
 * through callRoutine, Term lookup, Ask the Hub and Doctor Prep through
 * callClaude directly.
 *
 * WHICH MODEL DOES WHICH JOB
 * The strong models do the work that needs judgment: Dr. Smiley (ask.js,
 * Claude Opus 5.5) plans an answer and decides which actions to offer; Term
 * lookup and Doctor Prep (Claude Sonnet) search the web and weigh sources.
 * The routine, high-volume jobs -- Translate on every lookup, the term check
 * on every save -- go first to Claude Haiku 5.5, the fast, low-cost model
 * ($0.10 / $0.50 per million tokens in/out, against $2 / $10 for Sonnet and
 * $5 / $25 for Opus 5).
 *
 * THE BACKUP
 * If Haiku declines (stop_reason "refusal"), runs out of room ("max_tokens"),
 * or the call fails (an error status, the model unavailable to this key),
 * the same request goes once to that endpoint's backup: the model it used
 * before, so the worst case is the old behaviour. It does not catch an answer
 * that is merely worse; if Translate or the check reads weaker, raise the
 * endpoint's effort first, then swap ROUTINE_MODEL for its backup.
 */

export const ROUTINE_MODEL = 'claude-haiku-5-5';

const API = 'https://api.anthropic.com/v1/messages';

// Every text field that comes in from a phone or back from the model is
// trimmed and cut to a sane length before it is used or sent on. clipLine
// also folds any run of whitespace into one space (Ask the Hub's fields,
// which go into a prompt as one line each).
export function clip(v, max = 600) {
  return String(v == null ? '' : v).trim().slice(0, max);
}
export function clipLine(v, max = 600) {
  return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
}

/* One model, one request.
 *   model:  the model id
 *   body:   everything but model and output_config (max_tokens, system,
 *           messages, tools)
 *   output: output_config ({ effort, format }), or nothing
 *   retryOutput: what to send as output_config instead when the first one
 *           is rejected (Doctor Prep keeps its effort: { effort }); by
 *           default nothing is sent
 *   beta:   an optional beta to ask for: { header, body } (the anthropic-beta
 *           header's value and what it adds to the request body)
 * Sent with every option first; when this deployment answers 400 naming one
 * of them, that option is dropped (or reduced to retryOutput) and the
 * request sent again: the beta first, then output_config, one retry each;
 * the tolerant parsing below still reads a plain-text answer. A web search that failed inside
 * the call arrives as a normal 200 with an error object where the results
 * list would be; it is logged here.
 * Returns
 *   { ok: true, model, data, stopReason, texts, text, answer, usedSchema }
 *     texts: every text block; text: all of them joined; answer: the last
 *     one when a schema was used (a remark before a search, "Let me look
 *     that up.", can be a block of its own and would break the JSON parse),
 *     otherwise the same as text.
 *   { ok: false, model, status, detail } for an error status. A refusal or
 *     a cut-off answer is ok: true with its stopReason; the caller decides. */
export async function callClaude(apiKey, { model, body, output, retryOutput, beta }) {
  let withBeta = !!beta, sending = output || null, outputTried = false;
  let usedSchema = !!(output && output.format);
  const send = () => fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01',
      ...(withBeta ? { 'anthropic-beta': beta.header } : {}) },
    body: JSON.stringify({ model, ...body, ...(withBeta ? beta.body || {} : {}), ...(sending ? { output_config: sending } : {}) }),
  });
  let res = await send();
  for (let attempt = 0; attempt < 2 && res.status === 400 && (withBeta || (sending && !outputTried)); attempt++) {
    const detail = await res.text();
    if (withBeta && /fallback|anthropic-beta|beta/i.test(detail)) {
      console.warn(`${model}: ${beta.header} rejected, retrying without it:`, detail);
      withBeta = false;
    } else if (sending && !outputTried && /output_config|json_schema|\bformat\b|\beffort\b/i.test(detail)) {
      console.warn(`${model}: output_config rejected, retrying ${retryOutput ? 'with ' + JSON.stringify(retryOutput) : 'without it'}:`, detail);
      sending = retryOutput || null; outputTried = true; usedSchema = !!(sending && sending.format);
    } else {
      return { ok: false, model, status: 400, detail };
    }
    res = await send();
  }
  if (!res.ok) return { ok: false, model, status: res.status, detail: await res.text() };
  const data = await res.json();
  for (const block of data.content || []) {
    if (block.type === 'web_search_tool_result' && !Array.isArray(block.content)) {
      console.error(`${model}: web search failed:`, JSON.stringify(block.content));
    }
  }
  const texts = (data.content || []).filter(b => b.type === 'text').map(b => b.text);
  const text = texts.join('').trim();
  const answer = usedSchema ? texts.slice(-1).join('').trim() : text;
  return { ok: true, model, data, stopReason: data.stop_reason, texts, text, answer, usedSchema };
}

/* The JSON the model answered with, or null when it isn't JSON. Without a
 * schema the model may wrap it in a code fence; that is stripped first.
 * By default the answer is the last text block (result.answer); a caller
 * without tools can pass result.text, every block joined. */
export function parseAnswer(result, text = result.answer) {
  const raw = result.usedSchema ? text : text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try { return JSON.parse(raw); } catch (err) { return null; }
}

/* body:    everything but model and output_config (max_tokens, system, messages)
 * routine: output_config for Haiku ({ effort, format })
 * backup:  { model, output } -- the endpoint's previous model and its settings
 * Returns callClaude's result, with a refusal or a cut-off answer counted as
 * a failure: { ok: false, model, status: 200, detail: 'stop_reason ...' }. */
export async function callRoutine(apiKey, { body, routine, backup }) {
  const attempt = async (model, output) => {
    const r = await callClaude(apiKey, { model, body, output });
    // Declined, or cut off before the answer was complete: not an answer.
    if (r.ok && (r.stopReason === 'refusal' || r.stopReason === 'max_tokens')) {
      return { ok: false, model, status: 200, detail: `stop_reason ${r.stopReason}` };
    }
    return r;
  };
  const first = await attempt(ROUTINE_MODEL, routine);
  if (first.ok || !backup) return first;
  console.warn(`${ROUTINE_MODEL} could not finish (${first.status} ${String(first.detail).slice(0, 300)}); asking ${backup.model}.`);
  return attempt(backup.model, backup.output);
}
