/* Shared by the AI endpoints that run on every tap or save (not an endpoint
 * itself: Vercel skips files that start with "_").
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

// One model, one try: with output_config first, and once without it if this
// deployment rejects that parameter (the tolerant parsing in each endpoint
// still reads a plain-text answer).
async function attempt(apiKey, model, body, output) {
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
  // Declined, or cut off before the answer was complete: not an answer.
  if (data.stop_reason === 'refusal' || data.stop_reason === 'max_tokens') {
    return { ok: false, model, status: 200, detail: `stop_reason ${data.stop_reason}` };
  }
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
  return { ok: true, model, data, text, usedSchema };
}

/* body:    everything but model and output_config (max_tokens, system, messages)
 * routine: output_config for Haiku ({ effort, format })
 * backup:  { model, output } -- the endpoint's previous model and its settings
 * Returns { ok, model, text, usedSchema } or { ok: false, status, detail }. */
export async function callRoutine(apiKey, { body, routine, backup }) {
  const first = await attempt(apiKey, ROUTINE_MODEL, body, routine);
  if (first.ok || !backup) return first;
  console.warn(`${ROUTINE_MODEL} could not finish (${first.status} ${String(first.detail).slice(0, 300)}); asking ${backup.model}.`);
  return attempt(apiKey, backup.model, body, backup.output);
}
