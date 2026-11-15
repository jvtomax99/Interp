/* Nothing shared is lost for good by a teammate's phone (security pass,
   2026-11-15; docs/features/deleted-items.md).
   - Deleting a term, doctor, provider or attachment puts its copy in
     Recently deleted first, named "<collection>__<id>"; no copy, no delete.
   - Offline, the copy and the delete wait in the outbox in that order.
   - An attachment comes back from the bin.
   - You remove your own chat messages, announcements and events; owner phones
     remove anyone's, clear Updates and are the only ones who see those buttons. */
const L = require('../support/harness.cjs');
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d))); if (!c) process.exitCode = 1; };
const me = (role, uid) => `try{ localStorage.setItem('ih_access_me_v1', JSON.stringify({ member: true, role: '${role}', uid: '${uid}', name: 'x' })); }catch(e){}`;

(async () => {
  const b = await L.chromium.launch();

  console.log('== a teammate deletes and restores');
  {
    const { page } = await L.boot(b, { device: 'iphone', name: 'Ana Torres', settle: 5000, access: { mode: 'locked', member: true, signedIn: true, uid: 'u1' }, init: me('member', 'u1') });
    const r = await page.evaluate(async () => {
      window.confirm = () => true;
      const out = {};
      const cat = DATA.categories.find(c => c.terms && c.terms.length > 2);
      const [t1, t2, t3] = cat.terms;
      // 1. online: copy first, then the delete; restore brings it back and clears the bin entry
      await deleteTerm(cat.id, t1.id);
      await new Promise(r => setTimeout(r, 300));
      out.binNamed = !!(__DB['deleted-items'] || {})['terms__' + t1.id];
      out.termGone = !__DB.terms[t1.id];
      await restoreTrashItem('terms__' + t1.id);
      await new Promise(r => setTimeout(r, 300));
      out.termBack = !!__DB.terms[t1.id];
      out.binCleared = !(__DB['deleted-items'] || {})['terms__' + t1.id];
      // 2. the copy can't be kept: nothing is deleted
      const real = window.queuedWrite;
      window.queuedWrite = e => e.collection === 'deleted-items' ? Promise.reject(Object.assign(new Error('denied'), { code: 'permission-denied' })) : real(e);
      await deleteTerm(cat.id, t2.id);
      await new Promise(r => setTimeout(r, 300));
      out.keptWithoutCopy = !!__DB.terms[t2.id] && cat.terms.some(t => t.id === t2.id);
      window.queuedWrite = real;
      // 3. offline: the copy and the delete queue in that order, then replay
      Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false });
      await deleteTerm(cat.id, t3.id);
      out.queue = OUTBOX.map(e => e.collection + ':' + e.op + ':' + e.docId).slice(-2);
      Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true });
      await flushOutbox();
      await new Promise(r => setTimeout(r, 300));
      out.replayed = !__DB.terms[t3.id] && !!(__DB['deleted-items'] || {})['terms__' + t3.id];
      // 4. an attachment goes to the bin and comes back
      __DB['term-attachments'] = __DB['term-attachments'] || {};
      __DB['term-attachments'].att1 = { termId: t2.id, filename: 'scan.pdf', mimeType: 'application/pdf', dataUrl: 'https://firebasestorage.googleapis.com/a.pdf', storagePath: 'attachments/a.pdf', uploadedBy: 'Liz' };
      await loadAttachments();
      await deleteAttachment('att1');
      await new Promise(r => setTimeout(r, 300));
      out.attBinned = !__DB['term-attachments'].att1 && !!__DB['deleted-items']['term-attachments__att1'];
      await restoreTrashItem('term-attachments__att1');
      await new Promise(r => setTimeout(r, 300));
      out.attBack = !!__DB['term-attachments'].att1 && __DB['term-attachments'].att1.filename === 'scan.pdf' && ATTACHMENTS.some(a => a.id === 'att1');
      return { ...out, t3: t3.id };
    });
    ok(r.binNamed && r.termGone, 'a deleted term leaves its copy in the bin as terms__<id>', r);
    ok(r.termBack && r.binCleared, 'Restore brings the term back and clears its bin entry', r);
    ok(r.keptWithoutCopy, 'no copy, no delete: the term stays when the bin can\'t be written', r);
    ok(r.queue[0] === 'deleted-items:set:terms__' + r.t3 && r.queue[1] === 'terms:delete:' + r.t3, 'offline: the copy is queued just ahead of the delete', r.queue);
    ok(r.replayed, 'back online: both replay, the term goes and its copy stays', r);
    ok(r.attBinned && r.attBack, 'an attachment goes to the bin and comes back whole', r);

    console.log('== what a teammate sees');
    const v = await page.evaluate(async () => {
      const now = Date.now();
      const msg = (id, uid) => ({ id, text: 'Hi ' + id, author: 'Someone', timestamp: now, uid, replyTo: null, attachment: null });
      const mineM = msg('m1', 'u1'), other = msg('m2', 'u9'), old = msg('m3', undefined);
      const bar = m => chatRowHtml(m, false, '', false, true, true, true, '');
      return {
        helpers: [isMine(mineM), isMine(other), canRemove(mineM), canRemove(other), canRemove(old)],
        delOwn: bar(mineM).includes('deleteChatMessage'), delOther: bar(other).includes('deleteChatMessage'),
        editOther: bar(other).includes('startChatEdit')
      };
    });
    ok(v.helpers.join() === 'true,false,true,false,false', 'yours means your phone\'s sign-in, not your typed name', v.helpers);
    ok(v.delOwn && !v.delOther && !v.editOther, 'chat: Delete on your own message only; no Edit or Delete on a teammate\'s', v);
    await page.evaluate(async () => {
      const now = Date.now();
      await db.collection('activity-log').doc('a1').set({ author: 'Liz', summary: 'added a term', timestamp: now });
      await db.collection('ce-events').doc('e1').set({ title: 'Mine', source: 'CHIA', timestamp: now, uid: 'u1' });
      await db.collection('ce-events').doc('e2').set({ title: 'Theirs', source: 'CHIA', timestamp: now - 1000, uid: 'u9' });
    });
    await L.go(page, 'updates', 1200);
    const up = await page.evaluate(() => ({ x: document.querySelectorAll('.activity-delete').length, clear: [...document.querySelectorAll('.head-action')].some(e => /Clear all/.test(e.textContent)) }));
    await L.go(page, 'events', 1200);
    const ev = await page.evaluate(() => document.querySelectorAll('.ce-row .activity-delete').length);
    ok(up.x === 0 && !up.clear, 'Updates: no ✕ and no Clear all for a teammate', up);
    ok(ev === 1, 'Events: Remove only on the one you added', ev);
    ok(page.__errors.length === 0, 'no page errors', page.__errors.slice(0, 3));
  }

  console.log('== an owner phone');
  {
    const { page } = await L.boot(b, { device: 'iphone', name: 'Jose Vazquez', settle: 5000, access: { mode: 'locked', member: true, signedIn: true, uid: 'owner-uid' }, init: me('owner', 'owner-uid') });
    // The fake database marks the booting phone as a member; make it the owner.
    await page.evaluate(() => { __DB['hub-members']['owner-uid'] = { ...(__DB['hub-members']['owner-uid'] || {}), role: 'owner' }; writeAccessMe({ ...(readAccessMe() || {}), member: true, role: 'owner', uid: 'owner-uid' }); });
    const o = await page.evaluate(async () => {
      const now = Date.now();
      await db.collection('activity-log').doc('a1').set({ author: 'Liz', summary: 'added a term', timestamp: now });
      const other = { id: 'm2', text: 'Hi', author: 'Liz', timestamp: now, uid: 'u9', replyTo: null, attachment: null };
      const bar = chatRowHtml(other, false, '', false, true, true, true, '');
      return { del: bar.includes('deleteChatMessage'), edit: bar.includes('startChatEdit'), owner: isHubOwner() };
    });
    await L.go(page, 'updates', 1200);
    const up = await page.evaluate(() => ({ x: document.querySelectorAll('.activity-delete').length, clear: [...document.querySelectorAll('.head-action')].some(e => /Clear all/.test(e.textContent)) }));
    ok(o.owner && o.del && !o.edit, 'an owner can delete a teammate\'s message but not edit it', o);
    ok(up.x > 0 && up.clear, 'an owner sees ✕ and Clear all on Updates', up);
    ok(page.__errors.length === 0, 'no page errors', page.__errors.slice(0, 3));
  }
  await b.close();
})();
