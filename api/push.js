/* Notifications that reach a closed phone (Web Push). docs/features/notifications.md.
 *
 *   GET                         { publicKey } the key a phone signs up with
 *                               (null until VAPID_* are set in Vercel)
 *   POST { kind:'chat', id }    a Team Chat message just landed: tell the
 *                               phones that follow its channel (or that it
 *                               @mentions), never the sender's. Sent by the
 *                               sender's phone once the message is saved
 *                               (pushChatMessage in index.html). The text is
 *                               read from the database, not taken from the
 *                               request, and each message goes out once
 *                               (push-sent/{id}).
 *   POST { kind:'test', id }    a test to one phone (push-subs/{id}), from
 *                               its own Notifications screen.
 *   POST { kind:'team', title, body }
 *                               an owner's notification to every phone
 *                               signed up. Only a phone that joined with the
 *                               owner code (hub-members/{uid}.role 'owner',
 *                               read with that phone's own sign-in). Kept in
 *                               push-log/ for the Notifications screen.
 *
 * The door is the AI endpoints' (api/_hub-access.js): members once the Hub is
 * locked, anyone in practice mode. Owner sends always need the owner phone.
 */

import { allowTeam, readToken, claimsOf } from './_hub-access.js';
import { serviceToken } from './_service-login.js';
import { vapidKeys } from './_webpush.js';
import { firestore, plain, typed, pushToTeam, wantsChat, mentions, clipText } from './_push-team.js';

const CHAT_WINDOW = 15 * 60 * 1000;     // older messages aren't news any more
const TITLE_MAX = 80;
const BODY_MAX = 600;

function bodyOf(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; }
}

function chatLine(msg) {
  const files = Array.isArray(msg.attachments) && msg.attachments.length ? msg.attachments : (msg.attachment ? [msg.attachment] : []);
  const photos = files.filter(a => String((a && a.mimeType) || '').startsWith('image/')).length;
  if (msg.text) return clipText(msg.text, 300);
  if (photos) return photos === 1 ? 'Sent a photo' : `Sent ${photos} photos`;
  return files.length ? 'Sent an attachment' : 'New message';
}

async function dataToken(callerToken) {
  // A refused service key shouldn't stop a chat notification: fall back to
  // the phone's own sign-in, which the rules let read and write these.
  try { const t = await serviceToken(); if (t) return t; } catch (e) { console.error('push: service login refused:', e.message); }
  return callerToken || null;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    let keys = null;
    try { keys = vapidKeys(); } catch (e) { console.error('push:', e.message); }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ publicKey: keys ? keys.publicKey : null });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

  let keys;
  try { keys = vapidKeys(); } catch (e) { keys = null; }
  if (!keys) return res.status(503).json({ error: 'not_set_up', message: 'Notifications are not set up on the server yet (VAPID keys).' });

  if (!await allowTeam(req, res)) return;
  const callerToken = readToken(req);
  const callerUid = (claimsOf(callerToken) || {}).user_id || '';
  const body = bodyOf(req);
  const db = firestore(await dataToken(callerToken));

  try {
    if (body.kind === 'chat') {
      const id = String(body.id || '');
      if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return res.status(400).json({ error: 'id' });
      const r = await db.get(`team-chat/${id}`);
      if (r.status === 404) return res.status(404).json({ error: 'no_message' });
      if (!r.ok) return res.status(502).json({ error: 'read', status: r.status });
      const msg = plain((await r.json()).fields);
      if (!msg.timestamp || Math.abs(Date.now() - msg.timestamp) > CHAT_WINDOW) {
        return res.status(200).json({ ok: true, skipped: 'old' });
      }
      // Once per message, whoever asks: creating push-sent/{id} fails if it exists.
      const mark = await db.create('push-sent', id, typed({ at: Date.now(), kind: 'chat' }));
      if (mark.status === 409) return res.status(200).json({ ok: true, skipped: 'already_sent' });
      if (!mark.ok) return res.status(502).json({ error: 'mark', status: mark.status });

      const author = clipText(msg.author || 'Teammate', 40);
      const ch = msg.channel === 'north' || msg.channel === 'south' ? msg.channel : 'all';
      const where = ch === 'all' ? 'Team Chat' : `Team Chat · ${ch === 'north' ? 'North' : 'South'}`;
      const line = chatLine(msg);
      const out = await pushToTeam(db, s => wantsChat(s, msg) && !(callerUid && s.uid === callerUid), s => ({
        kind: 'chat', section: 'chat', id, tag: `chat-${id}`,
        title: mentions(msg.text, s.name) ? `${author} mentioned you` : author,
        body: line, where
      }));
      return res.status(200).json({ ok: true, ...out });
    }

    if (body.kind === 'test') {
      // One phone checking that its own notifications arrive.
      const id = String(body.id || '');
      if (!/^[a-f0-9]{40}$/.test(id)) return res.status(400).json({ error: 'id' });
      const out = await pushToTeam(db, s => s.id === id, {
        kind: 'test', section: 'notifications', tag: 'test',
        title: 'Interpreter Hub', body: 'Notifications are working on this phone.'
      });
      if (!out.phones) return res.status(404).json({ error: 'no_phone', message: 'This phone isn\u2019t signed up. Turn notifications off and on again.' });
      return res.status(200).json({ ok: true, ...out });
    }

    if (body.kind === 'team') {
      const title = clipText(body.title, TITLE_MAX);
      const text = clipText(body.body, BODY_MAX);
      if (!title && !text) return res.status(400).json({ error: 'empty', message: 'Write a title or a message.' });
      if (!callerToken || !callerUid) return res.status(403).json({ error: 'owner_only', message: 'Only a phone with the owner code can send notifications.' });
      // Read with the phone's own sign-in: a forged token is refused by
      // Firestore itself, and only the owner code gives role 'owner'.
      const who = await firestore(callerToken).get(`hub-members/${encodeURIComponent(callerUid)}`);
      const member = who.ok ? plain((await who.json()).fields) : {};
      if (member.role !== 'owner') return res.status(403).json({ error: 'owner_only', message: 'Only a phone with the owner code can send notifications.' });

      const from = clipText(body.from || member.name || '', 60);
      const at = Date.now();
      const out = await pushToTeam(db, () => true, {
        kind: 'team', section: 'notifications', tag: `team-${at}`,
        title: title || 'Interpreter Hub', body: text, from
      });
      // Kept for the Notifications screen. A failed note doesn't undo the send.
      let logged = true;
      try {
        const lg = await firestore(callerToken).create('push-log', '', typed({ title, body: text, from, uid: callerUid, at, phones: out.phones, sent: out.sent }));
        logged = lg.ok;
      } catch (e) { logged = false; }
      return res.status(200).json({ ok: true, logged, ...out });
    }

    return res.status(400).json({ error: 'kind' });
  } catch (err) {
    console.error('push error:', err);
    return res.status(500).json({ error: 'push_failed', message: String(err.message || err) });
  }
}
