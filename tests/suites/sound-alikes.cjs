/* Sound-Alikes (docs/features/sound-alikes.md): Home's study rail and the
   tool tile open it; Study has a speaker on every spelling and sentence, each
   one 44px and taking its own tap, speaking en-US or es-US (a Latin American
   voice, never Spain's, for seseo); the filter and search; global search
   finds a set; the Drill speaks a sentence with the words hidden, Show the
   words blanks the sound-alike, an answer reveals it, the other spelling is
   counted as the lure, ten questions end in results. The phone's voices are
   stood in for, so this checks the screen, not Chromium's own audio. */
const L = require('../support/harness.cjs');
const O = L.OUT + 'sound-alikes/'; require('fs').mkdirSync(O, { recursive: true });
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 600))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));

function standIns(){
  window.__sa = [];
  const voices = [{ name: 'Mónica', lang: 'es-ES' }, { name: 'Paulina', lang: 'es-MX' }, { name: 'Samantha', lang: 'en-US' }];
  const synth = { getVoices(){ return voices; }, cancel(){}, addEventListener(){}, removeEventListener(){},
    speak(u){ window.__sa.push({ text: u.text, lang: u.lang, rate: u.rate, voice: u.voice ? u.voice.name : '' }); setTimeout(() => u.onend && u.onend(), 120); } };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  // Chromium's own utterance refuses a stand-in voice, so it is stood in for too.
  window.SpeechSynthesisUtterance = class { constructor(t){ this.text = t; } };
}

(async () => {
  const b = await L.chromium.launch();
  for (const [device, dark] of [['iphone', false], ['iphone', true], ['narrow', false], ['desktop', false]]) {
    const tag = device + (dark ? '-dark' : '');
    console.log('== ' + tag);
    const { page } = await L.boot(b, { device, dark, init: standIns });
    if (dark) await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));

    // Home: first on the study rail, and a tool tile right after False Friends.
    const home = await page.evaluate(() => {
      const titles = [...document.querySelectorAll('#content .qa-card .qa-title')].map(e => e.textContent.trim());
      const tiles = getToolTiles().map(t => t.id);
      return { railFirst: titles.indexOf('Sound-Alikes') >= 0 && titles[titles.indexOf('Sound-Alikes') + 1] === 'False Friends',
        tileAfterFF: tiles[tiles.indexOf('falsefriends') + 1] === 'soundalikes', n: SOUND_ALIKES.length };
    });
    ok(home.railFirst, 'Home: Sound-Alikes on the study rail, just before False Friends', home);
    ok(home.tileAfterFF, 'tool tile right after False Friends', home);
    await page.evaluate(() => { const c = [...document.querySelectorAll('#content .qa-card')].find(x => /Sound-Alikes/.test(x.textContent)); c.scrollIntoView({ block: 'center' }); c.click(); });
    await wait(900);
    const st = await page.evaluate(() => {
      const cards = document.querySelectorAll('#saList .sa-card');
      const words = SOUND_ALIKES.reduce((n, s) => n + s.words.length, 0);
      const btns = [...document.querySelectorAll('#content .sa-say, #content .sa-all')].slice(0, 12).map(x => { x.scrollIntoView({ block: 'center' });
        const q = x.getBoundingClientRect(), hit = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2);
        return { w: Math.round(q.width), h: Math.round(q.height), hit: !!hit && x.contains(hit) }; });
      window.scrollTo(0, 0);
      return { cat: activeCategory, cards: cards.length, says: document.querySelectorAll('#saList .sa-say').length, words,
        alls: document.querySelectorAll('#saList .sa-all').length, btns, sideways: document.documentElement.scrollWidth - innerWidth,
        searchFont: parseFloat(getComputedStyle(document.getElementById('saSearch')).fontSize), errs: 0 };
    });
    ok(st.cat === 'soundalikes' && st.cards === home.n && st.alls === home.n, 'Study lists every set, each with Hear them all', st);
    ok(st.says === st.words * 2, 'a speaker on every spelling and every sentence', st);
    ok(st.btns.every(x => x.w >= 44 && x.h >= 44 && x.hit), 'speakers 44px and taking their own tap', st.btns);
    ok(st.sideways <= 0 && st.searchFont >= 16, 'no sideways scroll; search 16px (no iPhone zoom)', st);
    if (device === 'iphone') await page.screenshot({ path: O + 'study-' + tag + '.png' });
    if (device === 'iphone') { await page.evaluate(() => { const c = document.querySelector('#saList .sa-card'); window.scrollTo(0, c.getBoundingClientRect().top + scrollY - 80); }); await wait(200);
      await page.screenshot({ path: O + 'card-' + tag + '.png' }); await page.evaluate(() => window.scrollTo(0, 0)); }
    const contrast = await page.evaluate(() => { const t = document.querySelector('.topbar'); return { topbar: !!t && t.getBoundingClientRect().height > 0 && getComputedStyle(t).display !== 'none' }; });
    ok(!contrast.topbar, 'no glossary search bar over this screen', contrast);

    // Speaking: the word in English; a Spanish set in es-US with the Mexican voice, not Spain's.
    const spoke = await page.evaluate(async () => {
      __sa.length = 0;
      document.querySelector('#saList .sa-card .sa-say').click();
      setSAFilter('es'); await new Promise(r => setTimeout(r, 50));
      const es = [...document.querySelectorAll('#saList .sa-card')];
      es[0].querySelector('.sa-all').click();
      const first = SOUND_ALIKES[0], vaso = SOUND_ALIKES.find(s => s.lang === 'es');
      return { en: __sa[0], es: __sa[1], first: first.words[0].w, all: vaso.words.map(w => w.w).join('. ') + '.', esCards: es.length,
        esCount: SOUND_ALIKES.filter(s => s.lang === 'es').length };
    });
    ok(spoke.en && spoke.en.text === spoke.first && spoke.en.lang === 'en-US', 'a word speaker says the word in en-US', spoke);
    ok(spoke.es && spoke.es.lang === 'es-US' && spoke.es.voice === 'Paulina' && spoke.es.text === spoke.all, 'Hear them all on a Spanish set: es-US, Latin American voice, every spelling', spoke);
    ok(spoke.esCards === spoke.esCount, 'the Heard in Spanish filter shows only those', spoke);

    const search = await page.evaluate(async () => {
      setSAFilter('all'); const i = document.getElementById('saSearch'); i.focus(); i.value = 'bazo'; i.dispatchEvent(new Event('input'));
      await new Promise(r => setTimeout(r, 50));
      const one = document.querySelectorAll('#saList .sa-card').length, kept = document.activeElement === i;
      i.value = 'zzqx'; i.dispatchEvent(new Event('input')); const none = !!document.querySelector('#saList .ff-empty');
      i.value = ''; i.dispatchEvent(new Event('input'));
      const g = collectSearchMatches('ilium').filter(m => m.group === 'Sound-Alikes');
      return { one, kept, none, global: g.length, target: g[0] && g[0].target };
    });
    ok(search.one === 1 && search.kept && search.none, 'search: "bazo" finds one set, focus kept, nothing found says so', search);
    ok(search.global === 1 && search.target === 'soundalikes', 'global search finds "ilium" under Sound-Alikes', search);

    // Drill
    await page.evaluate(() => { __sa.length = 0; document.querySelectorAll('.ff-mode')[1].click(); }); await wait(300);
    const d1 = await page.evaluate(() => {
      const q = saQuestions[0], s = SOUND_ALIKES.find(x => x.id === q.id), w = s.words[q.wi];
      const text = document.getElementById('content').innerText;
      return { n: saQuestions.length, spoke: __sa[0] && __sa[0].text === w.line, lang: __sa[0] && __sa[0].lang, wantLang: s.lang === 'es' ? 'es-US' : 'en-US',
        hidden: !text.includes(w.line), opts: q.options.length, own: s.words.every(x => q.options.includes(x.say)), word: w.w,
        play: (() => { const r = document.getElementById('saPlay').getBoundingClientRect(); return Math.round(r.height); })() };
    });
    ok(d1.n === 10 && d1.opts === 4 && d1.own, 'ten questions, four options holding every spelling’s rendering', d1);
    ok(d1.spoke && d1.lang === d1.wantLang, 'opening the Drill speaks the first sentence in its language', d1);
    ok(d1.hidden && d1.play >= 44, 'the sentence is hidden; Hear again is 44px', d1);
    const slow = await page.evaluate(() => { __sa.length = 0; document.querySelector('.sa-slow').click(); return __sa[0] && __sa[0].rate; });
    ok(slow && slow < 0.8, 'Slower replays at a slower rate', slow);
    await page.evaluate(() => document.querySelector('.sa-show').click()); await wait(100);
    const shown = await page.evaluate(() => { const h = document.querySelector('.sa-heard'), q = saQuestions[0], s = SOUND_ALIKES.find(x => x.id === q.id);
      return { blank: !!h.querySelector('.sa-blank'), hasWord: new RegExp('(^|[^\\p{L}])' + s.words[q.wi].w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=[^\\p{L}]|$)', 'iu').test(h.textContent) }; });
    ok(shown.blank && !shown.hasWord, 'Show the words: the sentence with the sound-alike blanked out', shown);
    if (device === 'iphone') await page.screenshot({ path: O + 'drill-' + tag + '.png' });
    const ans = await page.evaluate(() => { const q = saQuestions[0]; const lure = q.lures[0]; answerSA(lure);
      const h = document.querySelector('.sa-heard'); return { lead: document.querySelector('.quiz-explain b').textContent, marked: !!(h && h.querySelector('.sa-hit')),
        right: document.querySelectorAll('.quiz-option.correct').length, wrong: document.querySelectorAll('.quiz-option.wrong').length }; });
    ok(ans.lead === 'That is the other spelling.' && ans.marked && ans.right === 1 && ans.wrong === 1, 'picking the other spelling: called out, the word marked in the sentence', ans);
    if (device === 'iphone') await page.screenshot({ path: O + 'answer-' + tag + '.png' });
    const res = await page.evaluate(async () => {
      for (let i = 1; i < 10; i++){ nextSA(); answerSA(saQuestions[saIndex].answer); }
      __sa.length = 0; nextSA(); await new Promise(r => setTimeout(r, 50));
      return { score: document.querySelector('.ff-score b').textContent, summary: document.querySelector('.results-summary').textContent, missed: document.querySelectorAll('.quiz-card .sa-card').length, spoke: __sa.length };
    });
    ok(res.score === '9 / 10' && /caught you once/.test(res.summary) && res.missed === 1 && res.spoke === 0, 'results: 9 / 10, the lure counted once, the missed set shown, nothing spoken', res);
    const errs = await page.evaluate(() => 0).then(() => page.__errors);
    ok(!errs.length, 'no page errors', errs);
    await page.context().close();
  }
  await b.close();
})().catch(e => { console.log('  FAIL crashed ' + e.stack); process.exitCode = 1; });
