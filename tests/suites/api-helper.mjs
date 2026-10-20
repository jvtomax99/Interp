// The one Claude helper (api/_routine.js) and Term lookup on it, with the
// Messages API faked: no network, no key spent. Checks the request that goes
// out, the retry without a schema, refusals, cut-off answers, the web-search
// failure log, and the routine backup.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const ROOT = process.argv[2] || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { default: lookup } = await import(ROOT + '/api/term-lookup.js');
const { default: ask } = await import(ROOT + '/api/ask.js');
const { callRoutine, callClaude, clip, clipLine, parseAnswer, ROUTINE_MODEL } = await import(ROOT + '/api/_routine.js');
let fails = 0; const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (!c && d !== undefined ? ' ' + JSON.stringify(d).slice(0, 400) : '')); if (!c) fails++; };

// The fake API: a queue of answers, one per request, and every request kept.
const sent = []; let queue = [];
const J = (status, obj) => new Response(typeof obj === 'string' ? obj : JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
globalThis.fetch = async (url, opts = {}) => {
  url = String(url);
  if (url.startsWith('https://firestore.googleapis.com/')) return J(404, { error: { code: 404 } }); // nobody has claimed the Hub: practice mode
  if (url !== 'https://api.anthropic.com/v1/messages') throw new Error('unexpected fetch ' + url);
  sent.push({ headers: opts.headers, body: JSON.parse(opts.body) });
  const next = queue.shift();
  if (!next) throw new Error('no scripted answer left');
  return J(next.status || 200, next.body);
};
const errors = [], warns = [], logs = []; const err0 = console.error, warn0 = console.warn, log0 = console.log;
console.error = (...a) => errors.push(a.join(' ')); console.warn = (...a) => warns.push(a.join(' '));
console.log = (...a) => { const l = a.join(' '); if (/^ask usage/.test(l)) logs.push(l); else log0(...a); };
const reply = (content, stop_reason = 'end_turn', extra = {}) => ({ body: { id: 'msg', type: 'message', role: 'assistant', model: 'x', content, stop_reason, ...extra } });
const text = t => ({ type: 'text', text: t });
const reset = () => { sent.length = 0; queue = []; errors.length = 0; warns.length = 0; logs.length = 0; };
const run = async (req) => { let out = {}; const res = { status(c) { out.code = c; return this; }, json(o) { out.body = o; return this; } }; await lookup(req, res); return out; };
const TERM = { en: 'Atrial fibrillation', es: 'Fibrilación auricular', def: 'An irregular, often rapid heart rhythm.', domain: 'Cardiology' };
const post = (body = { term: TERM }, headers = {}) => ({ method: 'POST', headers, body });
process.env.ANTHROPIC_API_KEY = 'sk-test-key';

console.log('== Term lookup: the request that goes out, the answer that comes back');
reset();
const GOOD = {
  sources: [
    { title: 'Atrial Fibrillation', url: 'https://medlineplus.gov/atrialfibrillation.html', site: 'MedlinePlus', language: 'en', why: 'Plain-language overview.' },
    { title: 'Fibrilación auricular', url: 'https://medlineplus.gov/spanish/atrialfibrillation.html', site: 'MedlinePlus', language: 'es', why: 'Real Spanish version.' },
    { title: 'AFib', url: 'http://www.heart.org/afib', site: 'AHA', language: 'en', why: 'not https' },
    { title: 'A forum', url: 'https://example.com/afib', site: 'Forum', language: 'en', why: 'not a trusted site' },
    { title: 'Atrial Fibrillation again', url: 'https://medlineplus.gov/atrialfibrillation.html', site: 'MedlinePlus', language: 'en', why: 'duplicate' },
    { title: '', url: 'https://www.cdc.gov/heartdisease/atrial_fibrillation.htm', site: 'CDC', language: 'en', why: 'no title' },
    { title: 'Atrial Fibrillation | cdc.gov', url: 'https://www.cdc.gov/heartdisease/atrial_fibrillation.htm', site: 'CDC', language: 'fr', why: 'www. subdomain, odd language' },
    { title: 'AFib, NHLBI', url: 'https://www.nhlbi.nih.gov/health/atrial-fibrillation', site: 'NHLBI', language: 'en', why: 'four' },
    { title: 'AFib, Mayo', url: 'https://www.mayoclinic.org/afib', site: 'Mayo', language: 'en', why: 'five' },
    { title: 'AFib, Cleveland', url: 'https://my.clevelandclinic.org/afib', site: 'Cleveland Clinic', language: 'en', why: 'six, over the cap' },
  ],
  note: ' One note. ',
};
queue.push(reply([text('Let me look that up.'), { type: 'server_tool_use', id: 't1', name: 'web_search', input: { query: 'atrial fibrillation' } }, { type: 'web_search_tool_result', tool_use_id: 't1', content: [{ type: 'web_search_result', url: 'https://medlineplus.gov/atrialfibrillation.html', title: 'AF' }] }, text(JSON.stringify(GOOD))]));
let o = await run(post());
ok(sent.length === 1, 'one request', sent.length);
let r = sent[0];
ok(r.headers['x-api-key'] === 'sk-test-key' && r.headers['anthropic-version'] === '2023-06-01' && r.headers['Content-Type'] === 'application/json', 'key, API version and content type in the headers', r.headers);
ok(r.body.model === 'claude-sonnet-5-5' && r.body.max_tokens === 8000 && typeof r.body.system === 'string' && r.body.system.includes('Hackensack'), 'Sonnet 5.5, 8000 tokens, the system prompt', { model: r.body.model, max_tokens: r.body.max_tokens });
ok(r.body.output_config && r.body.output_config.effort === 'medium' && r.body.output_config.format && r.body.output_config.format.type === 'json_schema' && r.body.output_config.format.schema.required.join() === 'sources,note', 'medium effort and the lookup schema in output_config', r.body.output_config);
const tool = r.body.tools && r.body.tools[0];
ok(r.body.tools && r.body.tools.length === 1 && tool.type === 'web_search_20260209' && tool.name === 'web_search' && tool.max_uses === 3 && Array.isArray(tool.allowed_domains) && tool.allowed_domains.length === 25 && tool.allowed_domains.includes('medlineplus.gov') && tool.allowed_domains.length < 64, 'one web search tool, three searches at most, the 25 trusted sites', tool && { type: tool.type, max_uses: tool.max_uses, n: tool.allowed_domains && tool.allowed_domains.length });
const msg = r.body.messages[0];
ok(r.body.messages.length === 1 && msg.role === 'user' && msg.content.includes('"en": "Atrial fibrillation"') && msg.content.includes('"def": "An irregular') && msg.content.includes('"domain": "Cardiology"'), 'the glossary entry in the one user message', msg && msg.content.slice(0, 200));
ok(o.code === 200 && Array.isArray(o.body.sources), 'answers 200 with sources', o);
const urls = (o.body.sources || []).map(s => s.url);
ok(urls.length === 5, 'five sources at most (six good ones offered)', urls);
ok(urls[0] === 'https://medlineplus.gov/atrialfibrillation.html' && urls[1] === 'https://medlineplus.gov/spanish/atrialfibrillation.html', 'the two MedlinePlus pages first, in the order given', urls);
ok(!urls.some(u => u.startsWith('http:')), 'an http:// link is dropped', urls);
ok(!urls.some(u => u.includes('example.com')), 'a page off the trusted list is dropped, even though the API was told the list', urls);
ok(urls.filter(u => u === 'https://medlineplus.gov/atrialfibrillation.html').length === 1, 'the duplicate is dropped', urls);
ok(urls.includes('https://www.cdc.gov/heartdisease/atrial_fibrillation.htm') && !o.body.sources.some(s => s.title === ''), 'the www. subdomain is kept, the untitled copy of the same page dropped', o.body.sources.map(s => [s.title, s.url]));
ok(o.body.sources.every(s => s.language === 'en' || s.language === 'es') && o.body.sources.find(s => s.url.includes('cdc.gov')).language === 'en', 'an unknown language reads as English', o.body.sources.map(s => s.language));
ok(o.body.note === 'One note.', 'the note is trimmed', o.body.note);
ok(!urls.includes('https://my.clevelandclinic.org/afib'), 'the sixth good source is over the cap', urls);
ok(errors.length === 0 && warns.length === 0, 'nothing logged on a clean answer', { errors, warns });

console.log('== the retry without a schema');
reset();
queue.push({ status: 400, body: { type: 'error', error: { type: 'invalid_request_error', message: 'output_config: Extra inputs are not permitted' } } });
queue.push(reply([text('```json\n' + JSON.stringify({ sources: [GOOD.sources[0]], note: '' }) + '\n```')]));
o = await run(post());
ok(sent.length === 2, 'asked twice', sent.length);
ok(sent[0].body.output_config && !('output_config' in sent[1].body), 'the second request has no output_config at all', Object.keys(sent[1].body));
ok(JSON.stringify({ ...sent[0].body, output_config: undefined }) === JSON.stringify(sent[1].body), 'everything else in the request is the same', null);
ok(o.code === 200 && o.body.sources.length === 1 && o.body.sources[0].url === GOOD.sources[0].url, 'the fenced JSON is read', o.body);
ok(warns.length === 1 && /output_config rejected, retrying without it/.test(warns[0]) && warns[0].startsWith('claude-sonnet-5-5:'), 'one warning names the model and the retry', warns);
ok(errors.length === 0, 'no error logged', errors);

console.log('== a 400 about something else is an upstream error, no retry');
reset();
queue.push({ status: 400, body: { type: 'error', error: { type: 'invalid_request_error', message: 'messages: at least one message is required' } } });
o = await run(post());
ok(sent.length === 1 && o.code === 502 && o.body.error === 'upstream_error', 'one request, 502 upstream_error', { n: sent.length, o });
ok(errors.length === 1 && /Anthropic API error: 400/.test(errors[0]) && errors[0].includes('at least one message'), 'the error log carries the status and the detail', errors);

console.log('== a 500, a 529');
for (const status of [500, 529]) {
  reset(); queue.push({ status, body: { type: 'error', error: { type: 'api_error', message: 'Overloaded' } } });
  o = await run(post());
  ok(sent.length === 1 && o.code === 502 && errors.length === 1 && errors[0].includes(String(status)), `${status}: one request, 502, logged`, { n: sent.length, o, errors });
}

console.log('== a refusal, a cut-off answer, an answer that is not JSON');
reset(); queue.push(reply([], 'refusal', { stop_details: { type: 'refusal', reason: 'policy' } }));
o = await run(post());
ok(o.code === 200 && o.body.sources.length === 0 && o.body.note === '', 'a refusal is "nothing found"', o);
ok(errors.length === 1 && /Model declined/.test(errors[0]) && errors[0].includes('policy'), 'and the log says why', errors);
reset(); queue.push(reply([text(JSON.stringify({ sources: [GOOD.sources[1]], note: 'cut' }))], 'max_tokens'));
o = await run(post());
ok(o.code === 200 && o.body.sources.length === 1 && o.body.note === 'cut', 'a complete JSON that still ends at max_tokens is used', o);
ok(errors.length === 1 && /truncated at max_tokens/.test(errors[0]), 'the cut-off is logged', errors);
reset(); queue.push(reply([text('Sorry, I could not find anything.')]));
o = await run(post());
ok(o.code === 200 && o.body.sources.length === 0 && errors.length === 1 && /Could not parse/.test(errors[0]), 'prose instead of JSON: "nothing found", logged', { o, errors });
reset(); queue.push(reply([text('Searching.'), text(JSON.stringify({ sources: [GOOD.sources[0]], note: '' }))]));
o = await run(post());
ok(o.code === 200 && o.body.sources.length === 1, 'with the schema, the answer is the last text block (a remark before it does not break the parse)', o);

console.log('== a web search that failed inside the call');
reset();
queue.push(reply([{ type: 'server_tool_use', id: 't1', name: 'web_search', input: { query: 'x' } }, { type: 'web_search_tool_result', tool_use_id: 't1', content: { type: 'web_search_tool_result_error', error_code: 'max_uses_exceeded' } }, text(JSON.stringify({ sources: [], note: 'Nothing solid came back.' }))]));
o = await run(post());
ok(o.code === 200 && o.body.note === 'Nothing solid came back.' && o.body.sources.length === 0, 'the answer still comes through', o);
ok(errors.length === 1 && /web search failed/.test(errors[0]) && errors[0].includes('max_uses_exceeded') && errors[0].startsWith('claude-sonnet-5-5:'), 'the failure is logged with the model', errors);

console.log('== the door');
reset(); o = await run({ method: 'GET', headers: {} });
ok(o.code === 405 && sent.length === 0, 'GET: 405, nothing sent', o);
reset(); o = await run(post({ term: { es: 'solo español' } }));
ok(o.code === 400 && sent.length === 0 && /English/.test(o.body.error), 'no English side: 400, nothing sent', o);
reset(); o = await run(post({}));
ok(o.code === 400 && sent.length === 0, 'no term: 400, nothing sent', o);
reset(); o = await run(post({ term: { en: 'x'.repeat(2000), es: 'y'.repeat(2000) } }));
queue.length = 0;
ok(sent.length === 0 || sent[0].body.messages[0].content.length < 1500, 'an oversized entry is clipped before it is sent', sent[0] && sent[0].body.messages[0].content.length);
reset(); const key = process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_API_KEY;
o = await run(post());
ok(o.code === 503 && o.body.error === 'not_configured' && sent.length === 0, 'no key: 503 not_configured, nothing sent', o);
process.env.ANTHROPIC_API_KEY = key;

console.log('== Ask the Hub: the request, the beta, the answer');
const runAsk = async (req) => { let out = {}; const res = { status(c) { out.code = c; return this; }, json(o) { out.body = o; return this; } }; await ask(req, res); return out; };
const ASK = { question: '  What is\n atrial   fibrillation?  ', entries: [{ id: 't:afib', en: 'Atrial fibrillation', es: 'Fibrilación auricular', def: 'An irregular, often rapid heart rhythm.' }], lessons: [{ id: 'L1', about: 'afib', note: 'The team says: fibrilación auricular, never "fibrilación atrial".' }], context: { screen: { id: 'home', name: 'Home' }, learning: { hasName: true, loaded: true, count: 3 } } };
const ANSWER = { fromHub: true, headline: 'Great question! atrial fibrillation is an irregular heartbeat', sayLabel: 'Say', say: 'Fibrilación auricular', details: 'An irregular, often rapid heart rhythm. It raises the risk of stroke.', sourceIds: ['t:afib', 't:not-sent'], lessonIds: ['L1', 'L9'], topicIds: ['t:afib'], clarify: false, usedCorrection: false, actions: [{ type: 'open_term', target: 't:afib' }, { type: 'open_prep', target: 'spec:cardio' }, { type: 'open_term', target: 't:afib' }], suggestTerm: { en: '', es: '', def: '' } };
reset(); queue.push(reply([text(JSON.stringify(ANSWER))], 'end_turn', { usage: { input_tokens: 1200, output_tokens: 90 } }));
o = await runAsk(post(ASK));
ok(sent.length === 1, 'one request', sent.length);
r = sent[0];
ok(r.headers['anthropic-beta'] === 'server-side-fallback-2026-07-01' && r.body.fallbacks === 'default', 'the server-side fallback beta: its header and fallbacks: default in the body', { beta: r.headers['anthropic-beta'], fallbacks: r.body.fallbacks });
ok(r.body.model === 'claude-opus-5-5' && r.body.max_tokens === 8000 && r.body.output_config.effort === 'low' && r.body.output_config.format.type === 'json_schema' && !r.body.tools, 'Opus 5.5, low effort, the answer schema, no tools', { model: r.body.model, effort: r.body.output_config.effort });
ok(r.body.messages[0].content.includes('QUESTION:\nWhat is atrial fibrillation?') && r.body.messages[0].content.includes('"id":"t:afib"') && r.body.messages[0].content.includes('TEAM NOTES (1)'), 'the question is one line (whitespace folded), the entries and team notes are in the message', r.body.messages[0].content.slice(-120));
ok(o.code === 200 && o.body.answer && o.body.answer.headline === 'Atrial fibrillation is an irregular heartbeat', 'answers 200; the headline loses its opener and starts with a capital', o.body && o.body.answer && o.body.answer.headline);
const an = o.body.answer || {};
ok(JSON.stringify(an.sourceIds) === '["t:afib"]' && JSON.stringify(an.lessonIds) === '["L1"]' && JSON.stringify(an.topicIds) === '["t:afib"]', 'only ids the app sent come back as sources, notes and topics', { s: an.sourceIds, l: an.lessonIds, t: an.topicIds });
ok(JSON.stringify(an.actions) === '[{"type":"open_term","target":"t:afib"}]', 'actions: only allowed ones with a target the app sent, no duplicates', an.actions);
ok(an.fromHub === true && an.say === 'Fibrilación auricular' && an.details.startsWith('An irregular'), 'fromHub, say and details as given', { fromHub: an.fromHub, say: an.say });
ok(logs.length === 1 && logs[0].includes('"input_tokens":1200'), 'usage is logged', logs);
ok(errors.length === 0 && warns.length === 0, 'nothing else logged', { errors, warns });

console.log('== Ask: the beta rejected, then the schema rejected');
reset();
queue.push({ status: 400, body: { type: 'error', error: { type: 'invalid_request_error', message: 'anthropic-beta: server-side-fallback-2026-07-01 is not a valid beta' } } });
queue.push({ status: 400, body: { type: 'error', error: { type: 'invalid_request_error', message: 'output_config: Extra inputs are not permitted' } } });
queue.push(reply([text('```json\n' + JSON.stringify(ANSWER) + '\n```')]));
o = await runAsk(post(ASK));
ok(sent.length === 3, 'three requests', sent.length);
ok(sent[0].headers['anthropic-beta'] && sent[0].body.fallbacks && sent[0].body.output_config, 'the first with the beta and the schema');
ok(!sent[1].headers['anthropic-beta'] && !('fallbacks' in sent[1].body) && sent[1].body.output_config, 'the second without the beta (header and body), still with the schema', { h: sent[1].headers['anthropic-beta'], f: sent[1].body.fallbacks, oc: !!sent[1].body.output_config });
ok(!sent[2].headers['anthropic-beta'] && !('fallbacks' in sent[2].body) && !('output_config' in sent[2].body), 'the third with neither', Object.keys(sent[2].body));
ok(JSON.stringify({ ...sent[0].body, fallbacks: 0, output_config: 0 }) === JSON.stringify({ ...sent[2].body, fallbacks: 0, output_config: 0 }), 'everything else in the request is the same', null);
ok(o.code === 200 && o.body.answer && o.body.answer.headline === 'Atrial fibrillation is an irregular heartbeat', 'the fenced JSON is read', o.body);
ok(warns.length === 2 && /server-side-fallback-2026-07-01 rejected/.test(warns[0]) && /output_config rejected/.test(warns[1]), 'two warnings, in that order', warns);
reset();
queue.push({ status: 400, body: { error: { message: 'output_config: Extra inputs are not permitted' } } });
queue.push(reply([text(JSON.stringify(ANSWER))]));
o = await runAsk(post(ASK));
ok(sent.length === 2 && sent[1].headers['anthropic-beta'] === 'server-side-fallback-2026-07-01' && !('output_config' in sent[1].body) && o.code === 200, 'the schema rejected first: the retry keeps the beta', { n: sent.length, beta: sent[1] && sent[1].headers['anthropic-beta'] });
reset();
queue.push({ status: 400, body: { error: { message: 'messages: at least one message is required' } } });
o = await runAsk(post(ASK));
ok(sent.length === 1 && o.code === 502 && o.body.error === 'upstream_error', 'a 400 about something else: one request, 502', { n: sent.length, o });
reset(); queue.push({ status: 400, body: { error: { message: 'beta no' } } }); queue.push({ status: 400, body: { error: { message: 'effort no' } } }); queue.push({ status: 400, body: { error: { message: 'still no' } } });
o = await runAsk(post(ASK));
ok(sent.length === 3 && o.code === 502 && o.body.error === 'upstream_error', 'a third 400 after both retries: 502, nobody asked a fourth time', { n: sent.length, o });

console.log('== Ask: a refusal, prose, a cut-off, the door');
reset(); queue.push(reply([], 'refusal'));
o = await runAsk(post(ASK));
ok(o.code === 200 && o.body.refused === true && !o.body.answer, 'a refusal answers 200 { refused: true }', o);
reset(); queue.push(reply([text('I would rather not answer in JSON.')]));
o = await runAsk(post(ASK));
ok(o.code === 502 && o.body.error === 'unreadable_answer' && errors.length === 1 && /Could not parse ask response/.test(errors[0]), 'prose: 502 unreadable_answer, logged', { o, errors });
reset(); queue.push(reply([text(JSON.stringify(ANSWER))], 'max_tokens'));
o = await runAsk(post(ASK));
ok(o.code === 200 && o.body.answer && errors.length === 1 && /truncated at max_tokens/.test(errors[0]), 'a complete JSON that ends at max_tokens is used, the cut-off logged', { code: o.code, errors });
reset(); queue.push(reply([text('part one '), text(JSON.stringify(ANSWER))]));
o = await runAsk(post(ASK));
ok(o.code === 502 && o.body.error === 'unreadable_answer', 'two text blocks are read joined (no tools here), so a stray first block breaks the parse as it always did', o);
reset(); o = await runAsk(post({ question: '   ' }));
ok(o.code === 400 && sent.length === 0 && /question/i.test(o.body.error), 'no question: 400, nothing sent', o);
reset(); o = await runAsk({ method: 'GET', headers: {} });
ok(o.code === 405 && sent.length === 0, 'GET: 405', o);
ok(clipLine(' a \n\n b ') === 'a b' && clipLine(null) === '' && clipLine('x'.repeat(700)).length === 600 && clip(' a \n b ') === 'a \n b', 'clipLine folds whitespace to one space; clip does not');

console.log('== callRoutine: Haiku first, the backup after');
const BODY = { max_tokens: 1000, system: 'sys', messages: [{ role: 'user', content: 'hi' }] };
const ROUTINE = { effort: 'medium', format: { type: 'json_schema', schema: { type: 'object' } } };
const BACKUP = { model: 'claude-sonnet-5-5', output: { effort: 'medium', format: { type: 'json_schema', schema: { type: 'object' } } } };
reset(); queue.push(reply([text('{"a":1}')]));
let c = await callRoutine('k', { body: BODY, routine: ROUTINE, backup: BACKUP });
ok(sent.length === 1 && sent[0].body.model === ROUTINE_MODEL && ROUTINE_MODEL === 'claude-haiku-5-5' && sent[0].body.output_config.effort === 'medium', 'Haiku 5.5 is asked first, with its output_config', sent[0] && sent[0].body);
ok(c.ok && c.model === ROUTINE_MODEL && c.text === '{"a":1}' && c.usedSchema === true && c.answer === '{"a":1}' && c.stopReason === 'end_turn', 'a good answer comes back as is: ok, model, text, usedSchema', c);
ok(warns.length === 0, 'no warning', warns);
for (const [what, scripted] of [
  ['refusal', reply([], 'refusal')],
  ['max_tokens', reply([text('{"a":')], 'max_tokens')],
  ['a 500', { status: 500, body: { error: { message: 'boom' } } }],
  ['a 404 (model not on this key)', { status: 404, body: { error: { type: 'not_found_error', message: 'model: claude-haiku-5-5' } } }],
]) {
  reset(); queue.push(scripted); queue.push(reply([text('{"b":2}')]));
  c = await callRoutine('k', { body: BODY, routine: ROUTINE, backup: BACKUP });
  ok(sent.length === 2 && sent[1].body.model === BACKUP.model && JSON.stringify(sent[1].body.output_config) === JSON.stringify(BACKUP.output) && JSON.stringify({ ...sent[1].body, model: 0, output_config: 0 }) === JSON.stringify({ ...sent[0].body, model: 0, output_config: 0 }), `Haiku ${what}: the same request goes to the backup with the backup's output_config`, sent.map(s => s.body.model));
  ok(c.ok && c.model === BACKUP.model && c.text === '{"b":2}', `and the backup's answer is returned`, c);
  ok(warns.length === 1 && warns[0].includes('could not finish') && warns[0].includes(BACKUP.model), 'one warning says Haiku could not finish and who was asked', warns);
}
reset(); queue.push(reply([], 'refusal'));
c = await callRoutine('k', { body: BODY, routine: ROUTINE });
ok(sent.length === 1 && c.ok === false && c.status === 200 && c.detail === 'stop_reason refusal', 'no backup: the refusal is returned as a failure', c);
reset(); queue.push(reply([], 'refusal')); queue.push(reply([], 'refusal'));
c = await callRoutine('k', { body: BODY, routine: ROUTINE, backup: BACKUP });
ok(sent.length === 2 && c.ok === false && c.model === BACKUP.model && c.detail === 'stop_reason refusal', 'both decline: the backup\'s failure is returned, nobody is asked a third time', c);
reset(); queue.push({ status: 400, body: { error: { message: 'effort: unknown value' } } }); queue.push(reply([text('```json\n{"c":3}\n```')]));
c = await callRoutine('k', { body: BODY, routine: ROUTINE, backup: BACKUP });
ok(sent.length === 2 && sent[0].body.model === ROUTINE_MODEL && sent[1].body.model === ROUTINE_MODEL && !('output_config' in sent[1].body), 'a 400 about effort: Haiku again without output_config, not the backup', sent.map(s => [s.body.model, 'output_config' in s.body]));
ok(c.ok && c.usedSchema === false && parseAnswer(c).c === 3, 'usedSchema false, the fenced answer parses', c);

console.log('== clip and parseAnswer');
ok(clip(null) === '' && clip(undefined) === '' && clip('  a b  ') === 'a b' && clip(12) === '12', 'clip: nothing for null, trims, strings a number');
ok(clip('x'.repeat(700)).length === 600 && clip('x'.repeat(700), 80).length === 80, 'clip: 600 by default, or the given length');
ok(parseAnswer({ usedSchema: true, answer: '{"a":1}' }).a === 1 && parseAnswer({ usedSchema: false, answer: '```json\n{"a":2}\n```' }).a === 2 && parseAnswer({ usedSchema: false, answer: '```\n{"a":4}```' }).a === 4, 'parseAnswer: plain JSON, fenced with or without the json tag');
ok(parseAnswer({ usedSchema: true, answer: '```json\n{"a":3}\n```' }) === null && parseAnswer({ usedSchema: false, answer: 'no' }) === null, 'parseAnswer: null when it is not JSON (a fence is not stripped under a schema, where it cannot appear)');
reset(); queue.push(reply([text('x')]));
c = await callClaude('k', { model: 'm', body: BODY });
ok(!('output_config' in sent[0].body) && c.ok && c.usedSchema === false && c.text === 'x', 'callClaude without output: no output_config, usedSchema false', c);

console.error = err0; console.warn = warn0; console.log = log0;
console.log(fails ? `\n${fails} check(s) failed` : '\nall checks passed');
process.exit(fails ? 1 : 0);
