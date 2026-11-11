/* Sends one plain email through Gmail's mail server (email sign-in's codes,
 * api/sign-in.js). The leading underscore keeps Vercel from serving this
 * file as an endpoint.
 *
 * The Hub's own Gmail sends them (Jose's pick, 2026-11-06: a Gmail just for
 * the Hub, so codes never sit in his own Sent folder), signed in with an app
 * password, Google's separate password for one program:
 *
 *   GMAIL_USER          the address, e.g. humc.interp.hub@gmail.com
 *   GMAIL_APP_PASSWORD  its app password (Vercel's settings only)
 *
 * No package: there is no package.json, so this speaks the mail protocol
 * (SMTP) itself over Node's own TLS, the way _service-login.js and
 * _webpush.js do their own signing. smtp.gmail.com, port 465, encrypted
 * from the first byte. If Google ever stops app passwords for personal
 * accounts, only this file changes (an email service instead).
 */

import tls from 'node:tls';

export function mailConfig(env = process.env) {
  const user = String(env.GMAIL_USER || '').trim();
  const pass = String(env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');   // Google shows it in groups of four
  return user && pass ? { user, pass, host: 'smtp.gmail.com', port: 465 } : null;
}

const CRLF = '\r\n';

// Header text stays plain ASCII; anything else goes in RFC 2047 words.
function headerText(s) {
  s = String(s || '').replace(/[\r\n]+/g, ' ');
  return /^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${Buffer.from(s, 'utf8').toString('base64')}?=`;
}

function buildMessage({ from, fromName, to, subject, text, now = new Date(), id }) {
  const domain = String(from).split('@')[1] || 'localhost';
  const body = Buffer.from(String(text || ''), 'utf8').toString('base64').replace(/.{1,76}/g, '$&' + CRLF);
  return [
    `From: ${fromName ? `"${headerText(fromName).replace(/"/g, '')}" ` : ''}<${from}>`,
    `To: <${to}>`,
    `Subject: ${headerText(subject)}`,
    `Date: ${now.toUTCString().replace('GMT', '+0000')}`,
    `Message-ID: <${id || Date.now().toString(36) + Math.random().toString(36).slice(2)}@${domain}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    body
  ].join(CRLF);
}

/* One conversation with the mail server. `connect` is tls.connect; the test
 * passes a plain socket to a fake server. Resolves when the server has
 * accepted the message (250 after the data), rejects with the step that
 * failed and the server's own words (never the password). */
export function sendMail(cfg, { to, subject, text, fromName = 'HUMC Interpreter Hub' }, { connect = tls.connect, timeoutMs = 15000 } = {}) {
  if (!cfg) return Promise.reject(new Error('mail is not set up (GMAIL_USER, GMAIL_APP_PASSWORD)'));
  if (!/^[^\s@<>]+@[^\s@<>]+$/.test(String(to || ''))) return Promise.reject(new Error('bad recipient'));
  return new Promise((resolve, reject) => {
    const sock = connect({ host: cfg.host, port: cfg.port, servername: cfg.host });
    let buf = '', step = 'greeting', done = false, lines = [];
    const finish = (err) => {
      if (done) return; done = true; clearTimeout(timer);
      try { sock.end(); } catch (e) { /* closed */ }
      err ? reject(err) : resolve();
    };
    const timer = setTimeout(() => finish(new Error(`mail server timed out at ${step}`)), timeoutMs);
    const write = (s) => sock.write(s + CRLF);
    const auth = Buffer.from(`\0${cfg.user}\0${cfg.pass}`, 'utf8').toString('base64');
    const msg = buildMessage({ from: cfg.user, fromName, to, subject, text })
      .split(CRLF).map(l => (l.startsWith('.') ? '.' + l : l)).join(CRLF);   // dot-stuffing
    const next = { greeting: ['220', () => { step = 'ehlo'; write('EHLO interp-hub'); }],
      ehlo:  ['250', () => { step = 'auth'; write('AUTH PLAIN ' + auth); }],
      auth:  ['235', () => { step = 'from'; write(`MAIL FROM:<${cfg.user}>`); }],
      from:  ['250', () => { step = 'rcpt'; write(`RCPT TO:<${to}>`); }],
      rcpt:  ['250', () => { step = 'data'; write('DATA'); }],
      data:  ['354', () => { step = 'sent'; sock.write(msg + CRLF + '.' + CRLF); }],
      sent:  ['250', () => { step = 'quit'; write('QUIT'); finish(); }] };
    sock.setEncoding('utf8');
    sock.on('data', (chunk) => {
      buf += chunk;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).replace(/\r$/, ''); buf = buf.slice(i + 1);
        lines.push(line);
        if (/^\d{3}-/.test(line)) continue;          // more lines of the same reply
        const code = line.slice(0, 3), reply = lines.join(' | '); lines = [];
        const want = next[step];
        if (!want) continue;
        if (code !== want[0]) { finish(new Error(`mail server refused at ${step}: ${reply.slice(0, 200)}`)); return; }
        want[1]();
      }
    });
    sock.on('error', (e) => finish(new Error(`mail connection failed at ${step}: ${e.message}`)));
    sock.on('close', () => finish(step === 'quit' ? null : new Error(`mail server hung up at ${step}`)));
  });
}
