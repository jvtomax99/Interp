/* The database rules (../../firestore.rules, ../../storage.rules) against Firebase's own
   emulators: every kind of write the app really makes must pass, every listed attack must
   be refused. docs/features/deleted-items.md. Run: cd tests/rules && npm install && npm test
   (needs Java). FIRESTORE_RULES / STORAGE_RULES point at other files, to compare versions. */
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
const here = p => fileURLToPath(new URL(p, import.meta.url));
const env = await initializeTestEnvironment({
  projectId: 'demo-hub',
  firestore: { rules: readFileSync(process.env.FIRESTORE_RULES || here('../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: 8181 },
  storage: { rules: readFileSync(process.env.STORAGE_RULES || here('../../storage.rules'), 'utf8'), host: '127.0.0.1', port: 9199 },
});
const DAY = 864e5, now = Date.now();
let fails = 0, passes = 0;
const t = async (name, run, allowed) => {
  try { await (allowed ? assertSucceeds(run()) : assertFails(run())); passes++; console.log('  PASS', (allowed ? 'allowed: ' : 'refused: ') + name); }
  catch (e) { fails++; console.log('  FAIL', (allowed ? 'should be allowed: ' : 'should be refused: ') + name, '|', String(e.message || e).split('\n')[0].slice(0, 160)); }
};
const seed = fn => env.withSecurityRulesDisabled(async c => fn(c.firestore(), c.storage()));
const as = uid => env.authenticatedContext(uid);
const db = uid => as(uid).firestore();
const bin = (type, id, extra = {}) => ({ type, label: '"' + id + '"', payload: { id, en: 'x' }, extra: {}, deletedBy: 'Ana Torres', deletedAt: now, ...extra });
const NAME = { term: 'terms', doctor: 'doctor-directory', provider: 'healthcare-providers', attachment: 'term-attachments' };

await seed(async d => {
  await d.doc('hub-access/settings').set({ practice: false });
  await d.doc('hub-access/owner').set({ uid: 'owner', at: 1, name: 'Jose' });
  await d.doc('hub-members/owner').set({ role: 'owner', name: 'Owner', who: 'jose' });
  await d.doc('hub-members/m1').set({ role: 'member', name: 'Team', who: 'ana torres' });
  await d.doc('hub-members/m2').set({ role: 'member', name: 'Team', who: 'liz lind' });
  for (const [type, c] of Object.entries(NAME)) for (const id of ['a', 'b', 'c', 'd']) await d.doc(`${c}/${id}`).set({ en: 'seed ' + id });
  await d.doc('terminology-meta/categories').set({ categories: [{ id: 'cardio', name: 'Cardiology', color: '#8B7BAE' }, { id: 'onc', name: 'Oncology', color: '#B5707D' }], updatedAt: 1 });
  await d.doc('team-chat/byLiz').set({ text: 'Rounds at 10', author: 'Liz Lind', uid: 'm2', timestamp: now });
  await d.doc('team-chat/byAna').set({ text: 'Thanks', author: 'Ana Torres', uid: 'm1', timestamp: now });
  await d.doc('announcements/byLiz').set({ text: 'New CE rule', author: 'Liz', uid: 'm2', createdAt: now });
  await d.doc('ce-events/byLiz').set({ title: 'Webinar', uid: 'm2', timestamp: now });
  await d.doc('ce-events/watcher').set({ title: 'CHIA event', author: 'Events watcher', timestamp: now });
  await d.doc('activity-log/a1').set({ author: 'Liz', summary: 'added a term', timestamp: now });
  await d.doc('deleted-items/terms__old').set(bin('term', 'old', { deletedAt: now - 31 * DAY }));
  await d.doc('deleted-items/legacy123').set(bin('term', 'b'));          // an entry from before, random name, its term exists
  await d.doc('deleted-items/legacy456').set(bin('term', 'gone'));       // random name, its term is gone
  await d.doc('deleted-items/terms__c').set(bin('term', 'c'));           // a stale copy: term c exists again
});

console.log('== the glossary, doctors, providers, attachments: a delete needs its copy in the bin');
await t('a teammate adds and edits a term', async () => { await db('m1').doc('terms/new1').set({ en: 'murmur', es: 'soplo' }); return db('m1').doc('terms/new1').update({ es: 'soplo cardíaco' }); }, true);
for (const [type, c] of Object.entries(NAME)) {
  await t(`deleting a ${type} with no copy in the bin`, () => db('m1').doc(`${c}/a`).delete(), false);
  await t(`the app's way: copy to deleted-items/${c}__a, then delete the ${type}`, async () => { await db('m1').doc(`deleted-items/${c}__a`).set(bin(type, 'a')); return db('m1').doc(`${c}/a`).delete(); }, true);
}
await t('even an owner can\'t delete a term without its copy', () => db('owner').doc('terms/b').delete(), false);

console.log('== Recently deleted itself');
await t('a copy under someone else\'s name (terms__d holding term b)', () => db('m1').doc('deleted-items/terms__d').set(bin('term', 'b')), false);
await t('a copy back-dated 40 days, to look old enough to clear', () => db('m1').doc('deleted-items/terms__d').set(bin('term', 'd', { deletedAt: now - 40 * DAY })), false);
await t('a copy with no date', () => { const b = bin('term', 'd'); delete b.deletedAt; return db('m1').doc('deleted-items/terms__d').set(b); }, false);
await t('a copy queued offline 2 days ago, sent now', () => db('m1').doc('deleted-items/terms__d').set(bin('term', 'd', { deletedAt: now - 2 * DAY })), true);
await t('a teammate empties a fresh bin entry', () => db('m2').doc('deleted-items/terms__a').delete(), false);
await t('a teammate overwrites a copy whose term is still gone (destroying it)', () => db('m2').doc('deleted-items/terms__a').set(bin('term', 'a', { payload: { id: 'a', en: 'junk' } })), false);
await t('a restore: the term comes back, then its bin entry goes', async () => { await db('m1').doc('terms/a').set({ en: 'seed a' }); return db('m1').doc('deleted-items/terms__a').delete(); }, true);
await t('overwriting a stale copy (its term exists again)', () => db('m1').doc('deleted-items/terms__c').set(bin('term', 'c')), true);
await t('the 30-day clean removes an entry over 30 days old', () => db('m2').doc('deleted-items/terms__old').delete(), true);
await t('an old random-named entry goes once its term is back', () => db('m1').doc('deleted-items/legacy123').delete(), true);
await t('an old random-named entry whose term is gone, by a teammate', () => db('m1').doc('deleted-items/legacy456').delete(), false);
await t('an owner removes any bin entry', () => db('owner').doc('deleted-items/legacy456').delete(), true);
await t('a teammate reads Recently deleted', () => db('m2').collection('deleted-items').get(), true);

console.log('== batches and transactions (from the review: judged by the database as it will be)');
await seed(async d => { await d.doc('terms/bx').set({ en: 'bx' }); await d.doc('terms/by').set({ en: 'by' }); await d.doc('deleted-items/terms__bx').set(bin('term', 'bx')); });
await t('one batch deletes the bin copy and its term together', () => { const x = db('m1'); const b = x.batch(); b.delete(x.doc('deleted-items/terms__bx')); b.delete(x.doc('terms/bx')); return b.commit(); }, false);
await t('one batch recreates a deleted term and empties its bin entry, then nothing is left', async () => { const x = db('m1'); await x.doc('terms/gone2').set({ en: 'junk' }).catch(() => {});
  await seed(async d => d.doc('deleted-items/terms__gone2').set(bin('term', 'gone2')));
  const b = x.batch(); b.delete(x.doc('deleted-items/terms__gone2')); b.delete(x.doc('terms/gone2')); return b.commit(); }, false);
await t('one batch overwrites a copy with junk and deletes the term', async () => { await seed(async d => d.doc('deleted-items/terms__by').set(bin('term', 'by')));
  const x = db('m1'); const b = x.batch(); b.set(x.doc('deleted-items/terms__by'), bin('term', 'by', { payload: { id: 'by', en: 'junk' } })); b.delete(x.doc('terms/by')); return b.commit(); }, false);
await t('one batch that writes the copy and deletes the term (the right order, at once)', async () => { await seed(async d => d.doc('terms/bz').set({ en: 'bz' }));
  const x = db('m1'); const b = x.batch(); b.set(x.doc('deleted-items/terms__bz'), bin('term', 'bz')); b.delete(x.doc('terms/bz')); return b.commit(); }, true);
await t('a transaction deletes the bin copy and its term together', async () => { await seed(async d => { await d.doc('terms/tx').set({ en: 'tx' }); await d.doc('deleted-items/terms__tx').set(bin('term', 'tx')); });
  const x = db('m1'); return x.runTransaction(async tr => { tr.delete(x.doc('deleted-items/terms__tx')); tr.delete(x.doc('terms/tx')); }); }, false);

console.log('== shared data the app never deletes');
await seed(async d => {
  await d.doc('terminology-meta/migrations').set({ oncologySplit: true });
  await d.doc('practice-questions/q1').set({ q: 'What is...', addedBy: 'Liz' });
  await d.doc('quiz-history/h1').set({ who: 'Liz', total: 10, correct: 7 });
  await d.doc('push-subs/lizphone').set({ endpoint: 'https://push.example/liz', uid: 'm2', name: 'Liz' });
  await d.doc('push-subs/anaphone').set({ endpoint: 'https://push.example/ana', uid: 'm1', name: 'Ana' });
  await d.doc('team-members/liz-lind').set({ name: 'Liz Lind', photo: 'https://x/y.jpg' });
  await d.doc('watcher-state/chia').set({ seen: ['a'] });
  await d.doc('term-link-cache/k1').set({ sources: [] });
});
await t('delete the migrations record (they would rerun on every launch)', () => db('m1').doc('terminology-meta/migrations').delete(), false);
await t('delete a practice question the team wrote', () => db('m1').doc('practice-questions/q1').delete(), false);
await t('add a practice question', () => db('m1').collection('practice-questions').add({ q: 'New', addedBy: 'Ana' }), true);
await t('rewrite a teammate\'s quiz result', () => db('m1').doc('quiz-history/h1').update({ correct: 0 }), false);
await t('save your own quiz result', () => db('m1').collection('quiz-history').add({ who: 'Ana', total: 10, correct: 9 }), true);
await t('delete a teammate\'s notification line', () => db('m1').doc('push-subs/lizphone').delete(), false);
await t('point a teammate\'s notification line elsewhere', () => db('m1').doc('push-subs/lizphone').set({ endpoint: 'https://evil.example/', uid: '' }), false);
await t('turn your own notifications off (delete your line)', () => db('m1').doc('push-subs/anaphone').delete(), true);
await t('turn notifications on (your new line)', () => db('m1').doc('push-subs/ananew').set({ endpoint: 'https://push.example/ana2', uid: 'm1', name: 'Ana' }), true);
await t('delete a teammate\'s face record', () => db('m1').doc('team-members/liz-lind').delete(), false);
await t('change your face (set, as the app does)', () => db('m1').doc('team-members/ana-torres').set({ name: 'Ana Torres', photo: null }), true);
await t('edit the watcher\'s memory to hide events', () => db('m1').doc('watcher-state/chia').set({ seen: [] }), false);
await t('delete a cached lookup', () => db('m1').doc('term-link-cache/k1').delete(), false);
await t('write the old shared glossary blob', () => db('m1').doc('terminology-hub/main').set({ x: 1 }), false);

console.log('== Team Chat, pins, events, Updates');
await t('send a message as yourself', () => db('m1').doc('team-chat/new').set({ text: 'Hi', author: 'Ana Torres', uid: 'm1', timestamp: now }), true);
await t('send a message as another phone', () => db('m1').doc('team-chat/fake').set({ text: 'Hi', author: 'Liz Lind', uid: 'm2', timestamp: now }), false);
await t('edit your own message', () => db('m1').doc('team-chat/byAna').update({ text: 'Thanks!', editedAt: now }), true);
await t('edit a teammate\'s message', () => db('m1').doc('team-chat/byLiz').update({ text: 'Rounds cancelled', editedAt: now }), false);
await t('react to a teammate\'s message', () => db('m1').doc('team-chat/byLiz').update({ reactions: { '👍': ['Ana Torres'] } }), true);
await t('delete a teammate\'s message', () => db('m1').doc('team-chat/byLiz').delete(), false);
await t('an owner deletes a teammate\'s message', () => db('owner').doc('team-chat/byLiz').delete(), true);
await t('pin an announcement as yourself', () => db('m1').doc('announcements/new').set({ text: 'Pin', author: 'Ana', uid: 'm1', createdAt: now }), true);
await t('unpin a teammate\'s announcement', () => db('m1').doc('announcements/byLiz').delete(), false);
await t('an owner unpins it', () => db('owner').doc('announcements/byLiz').delete(), true);
await t('add an event as yourself', () => db('m1').doc('ce-events/new').set({ title: 'In-service', uid: 'm1', timestamp: now }), true);
await t('add an event as another phone', () => db('m1').doc('ce-events/fake').set({ title: 'x', uid: 'm2', timestamp: now }), false);
await t('remove your own event', () => db('m1').doc('ce-events/new').delete(), true);
await t('remove a teammate\'s event', () => db('m1').doc('ce-events/byLiz').delete(), false);
await t('remove the watcher\'s event as a teammate', () => db('m1').doc('ce-events/watcher').delete(), false);
await t('an owner removes the watcher\'s event', () => db('owner').doc('ce-events/watcher').delete(), true);
await t('an action adds a line to Updates', () => db('m1').collection('activity-log').add({ author: 'Ana', summary: 'added "murmur"', timestamp: now }), true);
await t('a teammate removes a line from Updates', () => db('m1').doc('activity-log/a1').delete(), false);
await t('an owner removes it', () => db('owner').doc('activity-log/a1').delete(), true);

console.log('== domains and the rest of terminology-meta');
const cats = (n, rename) => Array.from({ length: n }, (_, i) => ({ id: ['cardio', 'onc', 'neuro'][i] || 'd' + i, name: rename && i === 0 ? 'Cardiology & Vascular' : ['Cardiology', 'Oncology', 'Neurology'][i] || 'D' + i, color: '#8B7BAE' }));
await t('add a domain (the whole list, one longer)', () => db('m1').doc('terminology-meta/categories').set({ categories: cats(3), updatedAt: now }), true);
await t('rename a domain (same length)', () => db('m1').doc('terminology-meta/categories').set({ categories: cats(3, true), updatedAt: now }), true);
await t('shrink the domain list', () => db('m1').doc('terminology-meta/categories').set({ categories: cats(1), updatedAt: now }), false);
await t('wipe the domain list', () => db('m1').doc('terminology-meta/categories').set({ updatedAt: now }), false);
await t('delete the domain list as a teammate', () => db('m1').doc('terminology-meta/categories').delete(), false);
await t('team points go up (smiley, merge)', () => db('m1').doc('terminology-meta/smiley').set({ points: 5, names: { ana: 'Ana' } }, { merge: true }), true);
await t('a place is saved (places, merge)', () => db('m1').doc('terminology-meta/places').set({ places: { p1: { name: 'Cath lab' } } }, { merge: true }), true);

console.log('== outsiders');
await t('a signed-in phone that never joined reads the glossary', () => db('stranger').collection('terms').get(), false);
await t('nobody signed in reads the glossary', () => env.unauthenticatedContext().firestore().collection('terms').get(), false);
await t('a phone that never joined writes a bin entry', () => db('stranger').doc('deleted-items/terms__z').set(bin('term', 'z')), false);

console.log('== Storage (attachments/)');
const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
const put = (uid, path, opts, bytes = jpg) => as(uid).storage().ref(path).put(bytes, opts);
await seed(async (d, st) => { await st.ref('attachments/old-no-uid.jpg').put(jpg, { contentType: 'image/jpeg' }); await st.ref('attachments/liz.jpg').put(jpg, { contentType: 'image/jpeg', customMetadata: { uid: 'm2' } }); });
await t('upload a photo under your own sign-in', () => put('m1', 'attachments/1-ab-photo.jpg', { contentType: 'image/jpeg', customMetadata: { uid: 'm1' } }), true);
await t('upload a PDF under your own sign-in', () => put('m1', 'attachments/2-ab-form.pdf', { contentType: 'application/pdf', customMetadata: { uid: 'm1' } }), true);
await t('upload with no uploader on it', () => put('m1', 'attachments/3.jpg', { contentType: 'image/jpeg' }), false);
await t('upload under another phone\'s name', () => put('m1', 'attachments/4.jpg', { contentType: 'image/jpeg', customMetadata: { uid: 'm2' } }), false);
await t('upload an SVG', () => put('m1', 'attachments/5.svg', { contentType: 'image/svg+xml', customMetadata: { uid: 'm1' } }), false);
await t('upload an SVG in capitals (image/SVG+xml)', () => put('m1', 'attachments/5b.svg', { contentType: 'image/SVG+xml', customMetadata: { uid: 'm1' } }), false);
await t('upload a web page', () => put('m1', 'attachments/6.html', { contentType: 'text/html', customMetadata: { uid: 'm1' } }), false);
await t('upload a 27 MB file', () => put('m1', 'attachments/7.pdf', { contentType: 'application/pdf', customMetadata: { uid: 'm1' } }, new Uint8Array(27 * 1024 * 1024)), false);
await t('overwrite a teammate\'s file', () => put('m1', 'attachments/liz.jpg', { contentType: 'image/jpeg', customMetadata: { uid: 'm1' } }), false);
await t('delete your own file', () => as('m1').storage().ref('attachments/1-ab-photo.jpg').delete(), true);
await t('delete a teammate\'s file', () => as('m1').storage().ref('attachments/liz.jpg').delete(), false);
await t('delete an old file with no uploader, as a teammate', () => as('m1').storage().ref('attachments/old-no-uid.jpg').delete(), false);
await t('an owner deletes a teammate\'s file', () => as('owner').storage().ref('attachments/liz.jpg').delete(), true);
await t('a teammate views a file', () => as('m2').storage().ref('attachments/2-ab-form.pdf').getMetadata(), true);
await t('a phone that never joined views a file', () => as('stranger').storage().ref('attachments/2-ab-form.pdf').getMetadata(), false);

await env.cleanup();
console.log(fails ? `${fails} failed, ${passes} passed` : `all ${passes} passed`);
process.exit(fails ? 1 : 0);
