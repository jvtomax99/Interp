/* Your account: what follows you (features/account-sync.js,
   docs/features/email-sign-in.md, phase E2). Two phones signed in as the same
   account, each with its own practice, badges, streak, memory trainer,
   and settings sync (never Dr. Smiley's memory of you), through account-sync/{account}:
   the first sync joins them (badges from both, each question's newer answer
   with the higher counts, the later streak), syncing again changes nothing
   (nothing counted twice), a change on one phone reaches the other, a
   setting changed on this phone is kept over the account's old one, signing
   out forgets the fingerprints, and a phone not signed in never syncs. */
const L = require('../support/harness.cjs');
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 700))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const ACCT = 'acct_0123456789abcdef0123456789ab';
const ME = JSON.stringify({ member: true, uid: ACCT, code: 'TEAMCODE', role: 'member', kind: 'team', joinedAt: 1 });
const DAY = 86400000, T0 = Date.UTC(2026, 10, 1, 15);
const stamp = ts => { const d = new Date(ts); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

// A phone signed in as the account, with its own saved progress.
const phone = (b, seed, signedIn = true) => L.boot(b, { device: 'iphone', name: 'Ana Torres', settle: 4200,
  access: { mode: 'locked', member: true, signedIn: true, uid: signedIn ? ACCT : 'u9' },
  init: `try{ if(!sessionStorage.getItem('__syncInit')){ sessionStorage.setItem('__syncInit','1');
    localStorage.setItem('ih_access_me_v1', ${JSON.stringify(ME)});
    ${signedIn ? `localStorage.setItem('ih_account', JSON.stringify({ uid: '${ACCT}', email: 'ana@gmail.com' }));` : ''}
    const S = ${JSON.stringify(seed)}; Object.keys(S).forEach(k => localStorage.setItem(k, typeof S[k] === 'string' ? S[k] : JSON.stringify(S[k])));
  } }catch(e){}` });

const get = (page, k) => page.evaluate(k => { const v = localStorage.getItem(k); try{ return JSON.parse(v); }catch(e){ return v; } }, k);
const remote = page => page.evaluate(id => (window.__DB['account-sync'] || {})[id] || null, ACCT);
const putRemote = (page, doc) => page.evaluate(({ id, doc }) => { window.__DB['account-sync'] = window.__DB['account-sync'] || {}; window.__DB['account-sync'][id] = doc; }, { id: ACCT, doc });
const sync = (page, why) => page.evaluate(w => accountSync(w), why || 'test');

(async () => {
  const b = await L.chromium.launch();

  console.log('== the joins, one rule at a time');
  {
    const { page } = await phone(b, {});
    const r = await page.evaluate(() => {
      const J = (k, a, b) => JSON.parse(syncJoin(k, JSON.stringify(a), JSON.stringify(b)));
      const P = J('ih_practice_v1', { q1: { seen: 5, right: 4, wrong: 1, step: 3, due: 9, last: 100 }, q2: { seen: 1, right: 1, wrong: 0, last: 50 } },
                                    { q1: { seen: 3, right: 1, wrong: 2, step: 0, due: 2, last: 200 }, q3: { seen: 2, right: 2, wrong: 0, last: 70 } });
      const once = syncJoin('ih_practice_v1', JSON.stringify({ q1: { seen: 5, last: 1 } }), JSON.stringify({ q1: { seen: 5, last: 1 } }));
      const twice = syncJoin('ih_practice_v1', once, JSON.stringify({ q1: { seen: 5, last: 1 } }));
      const S = J('ih_practice_streak_v1', { days: 4, last: '2026-11-3', answered: 2, on: '2026-11-3' }, { days: 9, last: '2026-10-30', answered: 7, on: '2026-10-30' });
      const S2 = J('ih_practice_streak_v1', { days: 4, last: '2026-11-3', answered: 2, on: '2026-11-3' }, { days: 6, last: '2026-11-3', answered: 5, on: '2026-11-3' });
      const B = J('ih_practice_badges_v1', { first10: 300, week: 900 }, { first10: 100, century: 500 });
      const M = J('ih_memory', { level: 12, seen: { a: 2 }, best: { mem: 9 }, log: [{ at: 1, id: 'a' }, { at: 5, id: 'b' }] },
                               { level: 20, seen: { a: 1, c: 3 }, best: { mem: 7, notes: 4 }, log: [{ at: 1, id: 'a' }, { at: 8, id: 'c' }] });
      const K = J('ih_knowledgeLog', { ana: { '2026-11-01': [3, 1, 50] } }, { ana: { '2026-11-01': [5, 0, 50], '2026-11-02': [6, 2, 50] } });
      const W = J('ih_warmup', { day: '2026-11-2', streak: 2, seenFF: ['a', 'b'] }, { day: '2026-11-1', streak: 5, seenFF: ['b', 'c'] });
      const set = syncJoin('ih_theme', 'light', 'dark');
      return { P, same: once === twice, S, S2, B, M, K, W, set,
        decide: [syncDecide('k', 'L', 'R', syncHash('L')), syncDecide('k', 'L', 'R', syncHash('R')), syncDecide('ih_theme', 'L', 'R', 'x')] };
    });
    ok(r.P.q1.step === 0 && r.P.q1.last === 200 && r.P.q1.seen === 5 && r.P.q1.right === 4 && r.P.q1.wrong === 2 && r.P.q2 && r.P.q3,
      'practice: each question\'s newer answer sets its place, the counts never drop, questions from both phones kept', r.P);
    ok(r.same, 'practice: joining the same thing again gives the same answer (nothing counted twice)');
    ok(r.S.last === '2026-11-3' && r.S.days === 4 && r.S2.days === 6 && r.S2.answered === 5, 'streak: the later study day wins; the same day keeps the longer run', [r.S, r.S2]);
    ok(r.B.first10 === 100 && r.B.week === 900 && r.B.century === 500, 'badges: every badge from both phones, dated the first time', r.B);
    ok(r.M.log.length === 3 && r.M.seen.a === 2 && r.M.seen.c === 3 && r.M.best.mem === 9 && r.M.best.notes === 4 && r.M.level === 20,
      'memory trainer: the lines joined once each, the best kept, the level from the phone that practised last', r.M);
    ok(JSON.stringify(r.K.ana['2026-11-01']) === '[5,1,50]' && r.K.ana['2026-11-02'], 'knowledge count: the higher numbers per day', r.K);
    ok(r.W.day === '2026-11-2' && r.W.seenFF.length === 3, 'Daily Drill: the later day, the words already asked joined', r.W);
    ok(r.set === 'dark', 'a setting both phones changed takes the account\'s', r.set);
    ok(r.decide[0] === 'R' && r.decide[1] === 'L' && r.decide[2] === 'R', 'only one side changed since the last sync: that side wins', r.decide);
    await page.context().close();
  }

  console.log('== two phones, one account');
  const seedA = {
    ih_practice_v1: { q1: { seen: 4, right: 3, wrong: 1, step: 2, due: T0 + 3 * DAY, last: T0, streak: 2 } },
    ih_practice_badges_v1: { first10: T0 - 5 * DAY },
    ih_practice_streak_v1: { days: 3, last: stamp(T0), answered: 4, on: stamp(T0) },
    ih_theme: 'dark',
    ih_smileyMemory: { v: 1, people: { 'ana torres': { prefs: { lang: 'es' }, at: 1 } } }, ih_memFlags: { x: 1 },
  };
  const seedB = {
    ih_practice_v1: { q1: { seen: 2, right: 1, wrong: 1, step: 0, due: T0 + DAY, last: T0 + 3600e3, streak: 0 }, q2: { seen: 1, right: 1, wrong: 0, step: 0, due: T0 + DAY, last: T0, streak: 1 } },
    ih_practice_badges_v1: { sweep: T0 - DAY },
    ih_region: 'south',
  };
  const A = await phone(b, seedA), pa = A.page;
  let r = await sync(pa, 'open');
  let doc = await remote(pa);
  ok(r && r.ok && doc && typeof doc.ih_practice_v1 === 'string' && JSON.parse(doc.ih_practice_v1).q1.seen === 4, 'phone 1: its progress goes up to the account', { r, doc: doc && Object.keys(doc) });
  ok(doc && doc.ih_memFlags === undefined && doc.ih_smileyMemory === undefined && doc.ih_smileyMode === undefined,
    'unsent line flags and what Dr. Smiley remembers stay on the phone (never synced)', doc && Object.keys(doc));
  const afterA = doc;

  const B = await phone(b, seedB), pb = B.page;
  // As at sign-in on a second phone: the account holds phone 1's copy, phone 2 has never synced with it.
  await putRemote(pb, afterA); await pb.evaluate(() => accountSyncForget());
  r = await sync(pb, 'signin');
  const bp = await get(pb, 'ih_practice_v1'), bb = await get(pb, 'ih_practice_badges_v1'), bs = await get(pb, 'ih_practice_streak_v1');
  ok(bp.q1.seen === 4 && bp.q1.step === 0 && bp.q1.last === T0 + 3600e3 && bp.q2, 'phone 2: practice joined (the newer answer to q1, the higher count, q2 kept)', bp);
  ok(bb.first10 && bb.sweep, 'phone 2: badges from both phones', bb);
  ok(bs && bs.days === 3, 'phone 2: the streak arrives from phone 1', bs);
  const theme = await pb.evaluate(() => [localStorage.getItem('ih_theme'), document.documentElement.getAttribute('data-theme')]);
  ok(theme[0] === 'dark' && theme[1] === 'dark', 'phone 2: dark mode follows, and the screen turns dark at once', theme);
  const reg = await pb.evaluate(() => localStorage.getItem('ih_region'));
  ok(reg === 'south', 'phone 2 keeps its own region (the account had none)', reg);
  const inMem = await pb.evaluate(() => PRACTICE.q2 ? PRACTICE.q1.seen : -1);
  ok(inMem === 4, 'phone 2: the practice the app shows is the joined one, without a restart', inMem);

  r = await sync(pb, 'again');
  ok(r && r.ok && !r.took.length && !r.sent.length, 'syncing again changes nothing on either side', r);

  // Phone 1 comes back: it gets phone 2's work; then phone 1 changes a setting.
  await putRemote(pa, await remote(pb));
  r = await sync(pa, 'back');
  const ap = await get(pa, 'ih_practice_v1');
  ok(ap.q2 && ap.q1.seen === 4 && ap.q1.step === 0 && (await get(pa, 'ih_region')) === 'south', 'phone 1: phone 2\'s answers and region arrive', ap);
  await pa.evaluate(() => localStorage.setItem('ih_theme', 'light'));
  r = await sync(pa, 'changed');
  ok(r.ok && r.sent.includes('ih_theme') && !r.took.includes('ih_theme') && JSON.parse(JSON.stringify((await remote(pa)).ih_theme)) === 'light',
    'a setting changed on this phone since the last sync is kept, and goes to the account', r);
  await putRemote(pb, await remote(pa));
  await sync(pb, 'open');
  ok((await get(pb, 'ih_theme')) === 'light', 'and reaches phone 2 the next time it opens');

  // Signing out forgets this account's fingerprints; nothing syncs after.
  await pb.evaluate(() => accountSignOut()); await wait(600);
  const after = await pb.evaluate(async () => ({ base: localStorage.getItem('ih_syncBase'), r: await accountSync('x') }));
  ok(after.base === null && after.r === null, 'signed out: the fingerprints are gone and the phone no longer syncs', after);
  await A.page.context().close(); await B.page.context().close();

  console.log('== a phone that never signed in');
  {
    const { page } = await phone(b, seedA, false);
    await wait(300);
    const n = await page.evaluate(async () => ({ r: await accountSync('x'), doc: Object.keys(window.__DB['account-sync'] || {}).length }));
    ok(n.r === null && n.doc === 0, 'not signed in: nothing is read or written', n);
    await page.context().close();
  }

  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
