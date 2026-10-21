/* The HUMC Brain's data (brain/data.json): the census of index.html
   (tools/census.cjs) as nodes and links, each section given a brain region.

     cd tests
     node tools/brain-data.cjs            writes ../brain/data.json
     node tools/brain-data.cjs --check    says whether data.json is out of date

   A section the lists below don't name goes to "other" (the cortex), so a new
   or renamed section still shows up; give it a region here if it belongs to
   one. The regions follow docs/split-index.md: core and startup stay inline,
   data lists move out as files, safe moves go first, Ask the Hub and Dr.
   Smiley move as groups. See docs/features/humc-brain.md. */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const GROUPS = {
  core: ['Firebase: config, and the SDK loading in the background', 'State', 'Shared state: search, editing, providers, quiz',
    'Shared state: Term Review, domains, chat, events, activity', 'Utilities', 'Small helpers: save errors, toasts, colours, tile lists',
    'Small helpers: tile colours, escaping, links', 'Icons (inline SVG)', 'Theme, navigation and overlays', 'Your name and photo (the name sheet)'],
  start: ['Dark mode before the first paint', 'Loading the glossary', 'The screen: renderContent', 'Split dock (phones)', 'Home screen', 'Init',
    'Phone chrome, dialogs and the on-screen keyboard', 'Install / offline support'],
  data: ['Seed data (from the shared reference doc)', 'CoreCHI practice bank', 'False Friends (falsos amigos)', 'Domain icons and link lists'],
  safe: ['Translate lookup', 'CSV export / import', 'Training & Events', 'The guide: installing, the front page', '3D Body', 'Looking a term up',
    'Subdomain folder', 'Practice dashboard tiles', 'Your HUMC campus (CoreCHI Practice)', 'Voice and mic check',
    'Lists: providers, recently deleted, doctors hub', 'Duplicate doctors', 'Terminology backfill', 'Healthcare Providers: modal + photo handling',
    'Doctor directory: the add and edit sheet'],
  ask: ['Ask the Hub', 'Dr. Smiley: following a conversation', 'Dr. Smiley: context and actions', 'Dr. Smiley: what he remembers (on this device)',
    'Ask the Hub: your practice and the next step', "Dr. Smiley's memory screen", 'Ask the Hub: corrections, feedback, sources'],
  smiley: ["Dr. Smiley's art", 'Dr. Smiley: performances', 'Dr. Smiley: animation engine', 'Dr. Smiley: how lively (Lively, Focused, Still)',
    "Dr. Smiley: what he's doing (task states)", 'Dr. Smiley reacts', "Dr. Smiley's career", "Dr. Smiley's news", 'Dr. Smiley companion',
    'Dr. Smiley: the companion panel'],
};
const groupOf = new Map();
for (const [g, titles] of Object.entries(GROUPS)) titles.forEach(t => groupOf.set(t, g));

const r = spawnSync(process.execPath, [path.join(__dirname, 'census.cjs'), '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: process.env });
if (r.status !== 0) { process.stderr.write(r.stderr || 'census failed\n'); process.exit(1); }
const census = JSON.parse(r.stdout);
// The markup's on...="" handlers are a census row, not a section of the script.
const secs = census.sections.filter(s => !/^\(markup/.test(s.title));
const idx = new Map(secs.map((s, i) => [s.title, i]));
const nodes = secs.map(s => [s.title, s.bytes, groupOf.get(s.title) || 'other']);
const edges = [];
secs.forEach((s, i) => {
  for (const [user, names] of Object.entries(s.usedBy)) {
    const j = idx.get(user);
    if (j == null) continue;                       // used from the markup, not a section
    edges.push([j, i, Object.values(names).reduce((a, b) => a + b, 0)]);
  }
});
const missing = [...groupOf.keys()].filter(t => !idx.has(t));
const out = { measured: new Date().toISOString().slice(0, 10), names: census.names, total: secs.reduce((a, s) => a + s.bytes, 0), nodes, edges };
const file = path.join(__dirname, '..', '..', 'brain', 'data.json');

if (process.argv[2] === '--check') {
  let old = null; try { old = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) {}
  const same = old && JSON.stringify({ ...old, measured: '' }) === JSON.stringify({ ...out, measured: '' });
  console.log(same ? 'brain/data.json is up to date (' + old.measured + ')' : 'brain/data.json is out of date: run node tools/brain-data.cjs');
} else {
  fs.writeFileSync(file, JSON.stringify(out) + '\n');
  console.log(`brain/data.json: ${nodes.length} sections, ${edges.length} links, ${(out.total / 1048576).toFixed(2)} MB, measured ${out.measured}`);
}
if (missing.length) console.log('Not found in the census (renamed?), so not placed: ' + missing.join(' | '));
