/* Runs every suite, one after another, and fails if any check fails.

     cd tests && node run.cjs            all suites
     node run.cjs daily-drill guide      just these

   A suite fails when it prints a FAIL line, exits with an error, or prints
   no PASS line at all (it didn't get far enough to check anything).
   Screenshots land in tests/out/ (not kept in git). */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SUITES = [
  ['events-login.mjs',    'Events watcher login (no browser)'],
  ['deploy-rule.mjs',     'Deploy rule (no browser): only the bump commit deploys, its title matches, nothing the bump skips is deployed'],
  ['sign-in.mjs',         'Email sign-in (no browser): who may ask, the code and its limits, the ticket, the owner keeps the Hub, the mail conversation'],
  ['push.mjs',            'Notifications (no browser): sealed and signed pushes, who hears about a chat message, owner sends, gone phones'],
  ['more-sheet.cjs',      'More, grouped: Study, Doctors, Reference, You; no tabs or domain list; every tool placed; numbers that need you; the settings sheet'],
  ['notifications-screen.cjs', 'More → Notifications: install first on iPhone, off/blocked/on, switches, owners\' Send to the team, ?open= from a notification'],
  ['api-helper.mjs',      'Claude helper (no browser): Term lookup end to end, the retry without a schema, refusals, the routine backup'],
  ['daily-drill.cjs',     'Daily Drill: rounds, levels, score, Home card'],
  ['guide.cjs',           'User Guide: search, answers, Show me'],
  ['destination-labels.cjs', 'Doctor tools: labels, entrances, Back, guide targets'],
  ['doctor-page.cjs',     'Doctor page: header, bento, tabs, terms aloud, glass bar'],
  ['doctor-list.cjs',     'Doctor list: Recent, Sort by Place / Specialty / A-Z, letter strip'],
  ['provider-where.cjs',  'Provider Pictures: the Where picker, unit, saved record, card'],
  ['journey.cjs',         'End-to-end journey: Ask, briefing, review, offline'],
  ['smiley-gaze.cjs',     'Dr. Smiley: eyes, lean, moods'],
  ['smiley-brows.cjs',    'Dr. Smiley: brows follow, hold, settle'],
  ['smiley-gestures.cjs', 'Dr. Smiley: the five performances'],
  ['smiley-squash.cjs',   'Dr. Smiley: squash and stretch on the spring, Lively only'],
  ['smiley-quiz.cjs',     'Dr. Smiley in a quiz: bounce, wince, streaks, in the dock'],
  ['home-rest.cjs',       'Home decor: petals and heartline loop, badge settles'],
  ['humc-brain.cjs',      'Two brains: his head opens the code brain, the Practice tile your knowledge brain (lit by your record; Practise, Open the card), never linked; one tap still opens Ask; Back and X close it'],
  ['chat-titles.cjs',     'Team Chat titles: Admin by phone, Supervisor by name'],
  ['chat-faces.cjs',      'Team Chat faces follow the account, never a typed name'],
  ['chat-keyboard.cjs',   'Team Chat while typing: the box sits on the keyboard'],
  ['dock-tuck.cjs',       'Tab bar tuck: transform only, same at rest, turns around'],
  ['frame-meter.cjs',     'Smoothness meter: More, timer, stalls, results, saved runs'],
  ['sound-alikes.cjs',    'Sound-Alikes: Home and tile, a speaker on every word, es-US voice, search, the drill heard not read, the lure counted'],
  ['voice-check.cjs',     'Voice and mic check: voices, record, speech to text, copy, mic released'],
  ['memory-trainer.cjs',  'Memory trainer: way in, a round with the words hidden, chunks, longer/shorter, notes, flags, leaving'],
  ['pin-burst.cjs',       'Pin burst: plays on a tap, stops when a scroll takes the touch'],
  ['spring-press.cjs',    'Springy press: Practice buttons squash, spring past, settle; flame flickers'],
  ['springs.cjs',         'S5 springs: plain taps settle with no overshoot (tab bar, section panel), the kept list'],
  ['type-tokens.cjs',     'Type tidy: sizes from the ten --fs-* steps, letter spacing from the --tr-* tokens (matching the size), Inter weights 400/500/550/650 (stylesheets read, eight screens measured)'],
  ['campus-pick.cjs',     'Campus: named badges, tap to pick, card, second tap starts'],
  ['campus-life.cjs',     'Campus life 2: the ambulance and its doors, the lot car, sitters, the flock, pauses, reduced motion'],
  ['glossary-cv.cjs',     'Glossary taps: off-screen cards skip layout; same pixels; Back, a jump and a redraw land where they should'],
  ['campus-depth.cjs',    'Campus depth: sky, town and campus layers; scroll and drag slide the back ones, spring home, never pick'],
  ['campus-3d.cjs',      'Campus in 3D: the button, full screen, your progress by message, See it finished, Practise, the X'],
  ['campus-alive.cjs',    'Campus alive: people about, cranes until painted, lit windows, the paint rising after practice'],
  ['startup-work.cjs',    'Startup: name pen in a worker, no repeat repaint, Home measured before paint'],
  ['glossary-hero.cjs',   'Bold glossary: the colour hero, a long name never breaking a word, ••• tappable, the glass search sticking, cards in the domain colour'],
  ['topbar-name.cjs',     'Top bar: the hospital\'s full name on a computer, "Hackensack UMC" on one line on a phone, bar 45px'],
  ['opening.cjs',         'The opening (Badge in): a fresh start plays it over a drawn Home, a tap before the badge skips, the tap scans green into Home, nothing left over, not with ?open=, off, the update reload or a computer, Still, More\'s card'],
  ['lanyard-pins.cjs',    'Pins on your lanyard: one per badge, in order, all on screen above the clasp, a new one clicks on and is remembered, a skip keeps its moment, none without badges, Still, the list matches BADGES'],
  ['account.cjs',         'Your account (email sign-in, the phone): email, then the code, a wrong code, the code box after a restart, signed in as the account, the name follows, sign out back to the team, not joined yet'],
  ['account-identity.cjs','Your account, phase E3: Term Review follows the account (the name\'s record joins once, later answer wins, sign out goes back), titles given to an account (typing the name no longer earns it, no run under someone else\'s title), the owner\'s Title picker'],
  ['account-sync.cjs',    'Your account, what follows you (phase E2): the joins rule by rule, two phones merging through the account, syncing again changes nothing, a local setting kept, signed out stops syncing'],
  ['photo-adjust.cjs',    'Adjust your photo: opens after you pick one, drag and zoom with the photo always covering the frame, the two previews, Save keeps exactly the square, Cancel and Escape keep the old one'],
  ['credits.cjs',         'Idea credits: the tag under a credited title, the card (tap or double-tap), the owner\'s Give credit, Edit, Remove, a refused save taken back'],
  ['tool-banners.cjs',   'Tool banners: Translate, Term Review, Ask and Doctor Directory under a colour banner with their pin (one-line title, no spill, the count above the search, + Add and Ask\'s links on it, his face in a conversation, a credit\'s tag), the pin flying from Home and nothing left behind, none under reduced motion or from the tab bar, Back'],
  ['load-order.cjs',      'Load order: a resize, a key, a message before index.html\'s script raise no error'],
  ['deploy-open.cjs',     'The first open after a deploy: no reload, the hello once; a page older than the worker reloads once'],
  ['feel.cjs',            'The feel guard: no empty flash or jump on data, press feedback, contrast, a scroll that searches nothing, his face on its clock, Home at rest'],
];
const only = process.argv.slice(2);
const pick = only.length ? SUITES.filter(([f]) => only.some(o => f.startsWith(o))) : SUITES;
fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });

const summary = [];
for (const [file, what] of pick) {
  const t0 = Date.now();
  console.log(`\n=== ${file} · ${what}`);
  const r = spawnSync(process.execPath, [path.join(__dirname, 'suites', file)], { cwd: __dirname, encoding: 'utf8', timeout: 15 * 60 * 1000, maxBuffer: 64 * 1024 * 1024 });
  const out = (r.stdout || '') + (r.stderr || '');
  fs.writeFileSync(path.join(__dirname, 'out', file + '.log'), out);
  const lines = out.split('\n');
  const pass = lines.filter(l => /^\s*PASS\b/.test(l)).length;
  const fail = lines.filter(l => /^\s*FAIL\b/.test(l));
  const ok = r.status === 0 && !fail.length && pass > 0;
  fail.slice(0, 20).forEach(l => console.log(l));
  if (!ok && !fail.length) console.log(out.split('\n').slice(-25).join('\n'));
  const secs = Math.round((Date.now() - t0) / 1000);
  console.log(`${ok ? '✓' : '✗'} ${file}: ${pass} passed, ${fail.length} failed${r.status ? `, exit ${r.status}` : ''}${r.signal ? `, ${r.signal}` : ''} (${secs}s)`);
  summary.push([ok, file, pass, fail.length]);
}
console.log('\n' + summary.map(([ok, f, p, n]) => `${ok ? '✓' : '✗'} ${f.padEnd(22)} ${p} passed${n ? `, ${n} failed` : ''}`).join('\n'));
const bad = summary.filter(s => !s[0]).length;
console.log(bad ? `\n${bad} suite(s) failed.` : '\nAll suites passed.');
process.exitCode = bad ? 1 : 0;
