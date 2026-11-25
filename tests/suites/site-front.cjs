/* What a stranger meets before the app itself: the card a pasted link shows
   (og:* and twitter:*, og-image.jpg at 1200 x 630), the canonical address,
   robots.txt and sitemap.xml, the page for a wrong address (404.html), the
   notes that must not be served (.vercelignore), a title that follows the
   screen, and Doctor Prep's three boxes at 16px so an iPhone never zooms. */
const fs = require('fs');
const L = require('../support/harness.cjs');
const R = L.ROOT;
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d))); if (!c) process.exitCode = 1; };
const read = f => fs.readFileSync(R + f, 'utf8');

(async () => {
  console.log('== files');
  const head = read('index.html').split('</head>')[0];
  const meta = k => (head.match(new RegExp('<meta (?:property|name)="' + k + '" content="([^"]*)"')) || [])[1] || '';
  const site = (head.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] || '';
  ok(/^https:\/\/[^/]+\/$/.test(site), 'index.html names its canonical address', site);
  for (const k of ['og:title', 'og:description', 'og:image:alt', 'twitter:title', 'twitter:description', 'description'])
    ok(meta(k).length >= 20 && !/—/.test(meta(k)), k + ' is written', meta(k));
  ok(meta('og:url') === site, 'og:url is the canonical address', meta('og:url'));
  ok(meta('twitter:card') === 'summary_large_image', 'the card is the large-picture kind');
  ok(meta('og:image') === site + 'og-image.jpg' && meta('twitter:image') === meta('og:image'), 'both cards point at og-image.jpg by its full address', meta('og:image'));
  // A JPEG's size sits in its SOF0/SOF2 marker.
  const jpg = fs.readFileSync(R + 'og-image.jpg'); let w = 0, h = 0;
  for (let i = 2; i < jpg.length - 9;) { if (jpg[i] !== 0xFF) break; const m = jpg[i + 1], len = jpg.readUInt16BE(i + 2);
    if (m === 0xC0 || m === 0xC2) { h = jpg.readUInt16BE(i + 5); w = jpg.readUInt16BE(i + 7); break; } i += 2 + len; }
  ok(w === 1200 && h === 630 && meta('og:image:width') === '1200' && meta('og:image:height') === '630', 'og-image.jpg is 1200 x 630, as the tags say', { w, h });
  ok(jpg.length < 400 * 1024, 'og-image.jpg stays under 400 KB', jpg.length);

  const robots = read('robots.txt'), map = read('sitemap.xml');
  ok(/^User-agent: \*$/m.test(robots) && /^Disallow: \/api\/$/m.test(robots), 'robots.txt keeps crawlers out of /api/');
  ok(robots.includes('Sitemap: ' + site + 'sitemap.xml'), 'robots.txt points at the sitemap');
  ok(map.includes('<loc>' + site + '</loc>') && (map.match(/<loc>/g) || []).length === 1, 'sitemap.xml lists the one page there is');

  const ignore = read('.vercelignore').split('\n').map(s => s.trim());
  for (const f of ['SPEC.md', 'DESIGN.md', 'HANDOFF.md', 'AGENTS.md', 'CLAUDE.md', 'docs', 'tests'])
    ok(ignore.includes(f), f + ' is not served');
  ok(!ignore.some(l => /^(404\.html|robots\.txt|sitemap\.xml|og-image\.jpg)$/.test(l)), 'the new files are served');

  for (const [f, t] of [['brain/index.html', 'HUMC Brain'], ['brain/you.html', 'Your knowledge brain']]) {
    const s = read(f);
    ok(s.includes('<title>' + t + '</title>') && /<meta name="description" content="[^"]{20,}">/.test(s) && /<link rel="icon"[^>]+href="\.\.\/icon-192\.png">/.test(s) && s.includes('<meta name="robots" content="noindex">'),
      f + ' has its own title, description and icon, and stays out of search');
  }

  /* No long dash in what the app says (Jose, 2026-11-25). Every string in
     the app's files is read, comments left out; the few the code uses as a
     separator of its own are named here (docs/FACTS.md, "Long dashes"). */
  console.log('== long dashes');
  const acorn = require('acorn');
  const DASH = /\u2014|\\u2014|&mdash;/g;
  const ALLOWED = [/HMH_NETWORK_LABEL = /, /\\u201d \\u2014 [A-Z]/, /quote\.(includes|split)\(' \\u2014 '\)/, /text\.match\(\/\^\(\.\{1,60\}/, /Duffy-null/,
    /term\.es \|\| '\u2014'/, /x\.answer\.details\]\.filter\(Boolean\)\.join/, /title\.replace\(\/\\s\*\\u2014/];
  const inJs = (src, base) => { const com = [], out = []; let done = false;
    for (const sourceType of ['script', 'module']) { try { com.length = 0; acorn.parse(src, { ecmaVersion: 'latest', sourceType, onComment: (bl, t, st, en) => com.push([st, en]) }); done = true; break; } catch (e) {} }
    if (!done) return null;
    for (const m of src.matchAll(DASH)) if (!com.some(([st, en]) => m.index >= st && m.index < en)) out.push(base + m.index);
    return out; };
  const shown = ['index.html', '404.html', 'guide/topics.js', 'falsefriends/list.js', 'soundalikes/list.js', 'practice/questions.js', 'home-polish.js', 'pin-icons.js', 'sw.js',
    'brain/index.html', 'brain/you.html', ...fs.readdirSync(R + 'features').filter(f => f.endsWith('.js')).map(f => 'features/' + f)];
  const left = []; let unread = [];
  for (const f of shown) {
    const src = read(f); let hits = [];
    if (f.endsWith('.html')) {
      const scripts = [...src.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => { const st = m.index + m[0].indexOf('>') + 1; return [st, st + m[1].length, m[1]]; });
      const notes = [...src.matchAll(/<!--[\s\S]*?-->/g)].map(m => [m.index, m.index + m[0].length]);
      for (const [st, , body] of scripts) { const h = inJs(body, st); if (h) hits.push(...h); else unread.push(f); }
      for (const m of src.matchAll(DASH)) if (![...scripts, ...notes].some(([st, en]) => m.index >= st && m.index < en)) hits.push(m.index);
    } else { const h = inJs(src, 0); if (h) hits = h; else unread.push(f); }
    const lines = src.split('\n');
    for (const n of new Set(hits.map(h => src.slice(0, h).split('\n').length))) if (!ALLOWED.some(re => re.test(lines[n - 1]))) left.push(f + ':' + n + ' ' + lines[n - 1].trim().slice(0, 70));
  }
  ok(!unread.length && shown.length > 25, 'every file of on-screen wording was read (' + shown.length + ')', unread);
  ok(!left.length, 'no long dash in what the app says', left.slice(0, 8));

  const b = await L.chromium.launch();
  for (const [name, vp] of [['phone', { width: 390, height: 780 }], ['narrow', { width: 320, height: 568 }], ['desktop', { width: 1440, height: 900 }]]) {
    console.log('== 404.html, ' + name);
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1 }), page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await L.route(page);
    await page.route('https://interp.test/no-such-page', r => r.fulfill({ status: 404, contentType: 'text/html; charset=utf-8', body: read('404.html') }));
    await page.goto('https://interp.test/no-such-page', { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const m = await page.evaluate(() => {
      const a = document.querySelector('a.go'), r = a.getBoundingClientRect(), img = document.querySelector('.brand img');
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { title: document.title, h1: document.querySelectorAll('h1').length, h1Text: document.querySelector('h1').textContent, href: a.getAttribute('href'),
        w: r.width, h: r.height, inView: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth, hit: hit === a,
        hScroll: document.documentElement.scrollWidth - innerWidth, img: img.naturalWidth, alt: img.hasAttribute('alt'),
        noindex: !!document.querySelector('meta[name=robots][content=noindex]'), font: getComputedStyle(document.body).fontFamily };
    });
    ok(/not found/i.test(m.title) && /Interpreter Hub/.test(m.title), 'its title says the page was not found', m.title);
    ok(m.h1 === 1 && m.h1Text.length > 10, 'one heading says what happened', m.h1Text);
    ok(m.href === '/' && m.w >= 44 && m.h >= 44 && m.inView && m.hit, 'Go to Home is on screen, 44px or more, and takes the tap', m);
    ok(m.hScroll <= 0, 'nothing runs off the side', m.hScroll);
    ok(m.img > 0 && m.alt, 'the mark loads and has alt text');
    ok(m.noindex && /^Inter/.test(m.font), 'kept out of search, set in Inter', m.font);
    ok(!errors.length, 'no page errors', errors);
    await page.screenshot({ path: L.SHOTS + 'site-front-404-' + name + '.png' });
    await ctx.close();
  }

  console.log('== the app, phone');
  const { page } = await L.boot(b, { device: 'iphone' });
  const titleAt = async cat => { await L.go(page, cat, 500); return page.title(); };
  const home = await titleAt('home');
  ok(/Interpreter Hub/.test(home) && !/·/.test(home), 'Home keeps the full title', home);
  const seen = new Set([home]);
  for (const [cat, want] of [['chat', 'Team Chat'], ['doctor-research', 'Doctor Prep'], ['translate', 'Translate'], ['review', 'Term Review'], ['practice', 'CoreCHI Practice'],
    ['ask', 'Ask the Hub'], ['doctors', 'Doctors'], ['doctor-directory', 'Doctor Directory'], ['providers', 'Provider Pictures'], ['updates', 'Recent Updates'],
    ['events', 'Training & Events'], ['userguide', 'User Guide'], ['ethics', 'Code of Ethics'], ['falsefriends', 'False Friends'], ['soundalikes', 'Sound-Alikes'],
    ['all', 'All domains'], ['directory', 'Link Directory'], ['resources', 'Professional Resources'], ['memory', 'Memory trainer'], ['notifications', 'Notifications'],
    ['team-access', 'Team access'], ['trash', 'Recently deleted'], ['anatomy', '3D Body']]) {
    const t = await titleAt(cat);
    ok(t === want + ' · Interpreter Hub' && !seen.has(t), cat + ': the title is "' + want + '"', t);
    seen.add(t);
  }
  const dom = await page.evaluate(() => { const c = DATA.categories.find(c => !c.parentId); return { id: c.id, name: c.name }; });
  ok(await titleAt(dom.id) === dom.name + ' · Interpreter Hub', 'a glossary domain shows its own name', dom.name);
  await page.evaluate(() => goHome()); await page.waitForTimeout(600);
  ok(await page.title() === home, 'back on Home the full title returns');

  await L.go(page, 'doctor-research', 700);
  const boxes = await page.evaluate(() => ['doctorResearchInput', 'doctorResearchSpecialty', 'doctorResearchLocation'].map(id => { const el = document.getElementById(id);
    return { id, fs: parseFloat(getComputedStyle(el).fontSize), ph: el.placeholder, cut: el.value ? false : (() => { const c = document.createElement('canvas').getContext('2d'); const s = getComputedStyle(el);
      c.font = s.fontWeight + ' ' + s.fontSize + ' ' + s.fontFamily; return c.measureText(el.placeholder).width > el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight); })() }; }));
  ok(boxes.every(x => x.fs >= 16), 'Doctor Prep: each box is 16px or more (no iPhone zoom)', boxes.map(x => x.id + ' ' + x.fs));
  ok(boxes.every(x => !x.cut), 'Doctor Prep: no hint is cut off in its box', boxes.filter(x => x.cut).map(x => x.ph));
  ok(!page.__errors.length, 'no page errors', page.__errors);
  await b.close();
})();
