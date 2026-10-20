/* The one Claude helper for the AI endpoints (not an endpoint itself: Vercel
 * skips files that start with "_"). Every request to the Messages API goes
 * through callClaude() below, so the retry rule, the refusal check and the
 * web-search failure log live in one place. On it so far: Translate and the
 * term check (through callRoutine), Term lookup (callClaude directly). Ask
 * the Hub and Doctor Prep still build their own requests and move next, one
 * per PR (docs/PLAN.md, "One Claude helper").
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
// trimmed and cut to a sane length before it is used or sent on.
export function clip(v, max = 600) {
  return String(v == null ? '' : v).trim().slice(0, max);
}

/* One model, one request.
 *   model:  the model id
 *   body:   everything but model and output_config (max_tokens, system,
 *           messages, tools)
 *   output: output_config ({ effort, format }), or nothing
 * Sent with output_config first, and once more without it if this deployment
 * rejects that parameter (the tolerant parsing below still reads a plain-text
 * answer). A web search that failed inside the call arrives as a normal 200
 * with an error object where the results list would be; it is logged here.
 * Returns
 *   { ok: true, model, data, stopReason, texts, text, answer, usedSchema }
 *     texts: every text block; text: all of them joined; answer: the last
 *     one when a schema was used (a remark before a search, "Let me look
 *     that up.", can be a block of its own and would break the JSON parse),
 *     otherwise the same as text.
 *   { ok: false, model, status, detail } for an error status. A refusal or
 *     a cut-off answer is ok: true with its stopReason; the caller decides. */
export async function callClaude(apiKey, { model, body, output }) {
  const send = extra => fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, ...body, ...extra }),
  });
  let usedSchema = !!(output && output.format);
  let res = await send(output ? { output_config: output } : {});
  if (res.status === 400 && output) {
    const detail = await res.text();
    if (!/output_config|json_schema|\bformat\b|\beffort\b/i.test(detail)) return { ok: false, model, status: 400, detail };
    console.warn(`${model}: output_config rejected, retrying without it:`, detail);
    usedSchema = false;
    res = await send({});
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
 * schema the model may wrap it in a code fence; that is stripped first. */
export function parseAnswer(result) {
  const raw = result.usedSchema ? result.answer : result.answer.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
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
