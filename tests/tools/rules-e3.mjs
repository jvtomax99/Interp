/* Phase E3's database rules (term-reviews by account, hub-titles) against
   Firebase's own emulator: 17 cases, owner, member, account, impostor.
   Not in run.cjs (the emulator is a ~200 MB download). By hand:
     mkdir emu && cd emu && npm i firebase-tools@13 @firebase/rules-unit-testing@3 firebase@10
     echo '{"firestore":{"rules":"<repo>/firestore.rules"},"emulators":{"firestore":{"port":8080}}}' > firebase.json
     npx firebase emulators:exec --only firestore --project demo-e3 "node <repo>/tests/tools/rules-e3.mjs"
   Reads the rules from ../../firestore.rules. Passed 2026-11-07. */
import { fileURLToPath } from 'url';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
const env = await initializeTestEnvironment({ projectId: 'demo-e3', firestore: { rules: readFileSync(fileURLToPath(new URL('../../firestore.rules', import.meta.url)), 'utf8'), host: '127.0.0.1', port: 8080 } });
const A = 'acct_0123456789abcdef0123456789ab';
await env.withSecurityRulesDisabled(async c => {
  const db = c.firestore();
  await db.doc('hub-access/settings').set({ practice: false });
  await db.doc(`hub-members/${A}`).set({ role: 'member', who: 'liz lind' });
  await db.doc('hub-members/phoneP').set({ role: 'member', who: 'liz lind' });
  await db.doc('hub-members/owner').set({ role: 'owner', who: 'jose v' });
  await db.doc('hub-members/imp').set({ role: 'member', who: A });
  await db.doc(`term-reviews/${A}__t1`).set({ who: A, termId: 't1', box: 2 });
  await db.doc('term-reviews/liz-lind__t2').set({ who: 'liz lind', termId: 't2', box: 1 });
});
const as = uid => env.authenticatedContext(uid).firestore();
let fail = 0;
const t = async (name, p, ok) => { try { await (ok ? assertSucceeds(p) : assertFails(p)); console.log('  PASS', name); } catch (e) { fail++; console.log('  FAIL', name, e.message); } };
const q = (db, who) => db.collection('term-reviews').where('who', '==', who).get();
await t('account reads its own record by query', q(as(A), A), true);
await t('account writes its own record', as(A).doc(`term-reviews/${A}__t3`).set({ who: A, termId: 't3', box: 0 }), true);
await t('account reads its typed-name record (the one-time move)', q(as(A), 'liz lind'), true);
await t('a phone typed "Liz Lind" still reads the name record', q(as('phoneP'), 'liz lind'), true);
await t('that phone can NOT read the account record', q(as('phoneP'), A), false);
await t('that phone can NOT write into the account record', as('phoneP').doc(`term-reviews/${A}__t1`).set({ who: 'liz lind', termId: 't1', box: 4 }), false);
await t('a phone that typed the account id as its name is refused', q(as('imp'), A), false);
await t('...and cannot create one under it', as('imp').doc(`term-reviews/x__t9`).set({ who: A, termId: 't9' }), false);
const T = { title: 'Supervisor of Language Services', kind: 'supervisor', rule: 'liz', name: 'Liz Lind', at: 1 };
await t('owner gives a title to an account', as('owner').doc(`hub-titles/${A}`).set(T), true);
await t('everyone in the team reads titles', as('phoneP').doc(`hub-titles/${A}`).get(), true);
await t('a member can NOT give a title', as('phoneP').doc('hub-titles/acct_zzz').set(T), false);
await t('a member can NOT give themselves one', as(A).doc(`hub-titles/${A}`).set(T), false);
await t('owner can NOT title a plain phone id', as('owner').doc('hub-titles/phoneP').set(T), false);
await t('owner: an unknown kind is refused', as('owner').doc(`hub-titles/${A}`).set({ ...T, kind: 'god' }), false);
await t('owner: extra fields refused', as('owner').doc(`hub-titles/${A}`).set({ ...T, x: 1 }), false);
await t('owner takes a title back', as('owner').doc(`hub-titles/${A}`).delete(), true);
await t('a member can NOT take one away', as('phoneP').doc(`hub-titles/${A}`).delete(), false);
await env.cleanup();
console.log(fail ? `${fail} failed` : 'all passed'); process.exit(fail ? 1 : 0);
