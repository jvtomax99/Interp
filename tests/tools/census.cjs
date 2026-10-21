/* The census of index.html's script (phase 0 of docs/split-index.md): every
   top-level name, the section it sits in, and which sections use which. A
   section starts at a banner comment outside any code:
   /* ============ Title ============ *\/ or /* ---------- Title ---------- *\/
   (the four-dash /* ---- x ---- *\/ ones are sub-headings inside a section).
   A use is a name read, written or called outside its own section: in the
   code (local names that hide it are skipped) or in an on...="" handler,
   in the page's markup or in a string the script writes into the page.
   window[name] and other dynamic lookups are not seen.

     cd tests
     node tools/census.cjs                 the section table
     node tools/census.cjs --names         every top-level name: line, section, used by
     node tools/census.cjs --section Init  one section: what it uses, who uses it
     node tools/census.cjs --json          everything, as JSON
     node tools/census.cjs --write         the table into docs/split-index.md
   INDEX=/path/to/index.html reads another copy. */
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const ROOT = process.env.ROOT || path.join(__dirname, '..', '..');
const INDEX = process.env.INDEX || path.join(ROOT, 'index.html');
const html = fs.readFileSync(INDEX, 'utf8');
const lineAt = (s, i) => { let n = 1; for (let k = s.indexOf('\n'); k !== -1 && k < i; k = s.indexOf('\n', k + 1)) n++; return n; };

/* ---- The inline scripts, and the markup between them ---- */
const scripts = [], markup = [];
let last = 0;
for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
  const at = m.index + m[0].indexOf('>') + 1;
  markup.push(html.slice(last, m.index));
  scripts.push({ text: m[1], line: lineAt(html, at), bytes: Buffer.byteLength(m[1]) });
  last = m.index + m[0].length;
}
markup.push(html.slice(last));

/* ---- Sections ---- */
const sections = [];
const BANNER = /^\s*(?:={3,}|-{6,})\s*(.*?)\s*(?:[=-]{3,}.*)?$/;
const newSection = (title, line) => { const s = { title, line, end: null, bytes: 0, names: [], uses: new Map(), usedBy: new Map() }; sections.push(s); return s; };
const sectionOf = line => { let s = null; for (const x of sections) { if (x.line <= line) s = x; else break; } return s; };

const top = new Map();            // name -> { line, section }
const asts = [];
scripts.forEach((sc, i) => {
  const comments = [];
  const ast = acorn.parse(sc.text, { ecmaVersion: 'latest', sourceType: 'script', locations: true, allowHashBang: true, onComment: comments });
  asts.push({ ast, sc });
  const off = sc.line - 1;
  const inCode = c => ast.body.some(st => c.start > st.start && c.start < st.end);
  const heads = [];
  for (const c of comments) {
    const m = c.value.split('\n')[0].match(BANNER);
    if (inCode(c)) {
      if (m && c.loc.start.column === 0) console.error('Banner inside code, not counted: line ' + (c.loc.start.line + off) + ' ' + m[1]);
      continue;
    }
    if (!m || !m[1] || / end$/.test(m[1])) continue;   // "Global search end" closes a section
    let title = m[1].replace(/\s*[—-]\s*$/, '');
    if (title.includes('(') && !title.includes(')')) title = title.slice(0, title.indexOf('(')).trim();
    heads.push({ title, line: c.loc.start.line + off });
  }
  if (!heads.length || heads[0].line > sc.line + 2) newSection('(script at line ' + sc.line + ', before its first banner)', sc.line);
  for (const h of heads) newSection(h.title, h.line);
  sections[sections.length - 1].scriptEnd = sc.line + sc.text.split('\n').length - 1;
});
sections.sort((a, b) => a.line - b.line);
for (let i = 0; i < sections.length; i++) {
  const s = sections[i], nx = sections[i + 1];
  if (s.scriptEnd) s.end = s.scriptEnd;
  else s.end = nx.line - 1;
}
const lines = html.split('\n');
for (const s of sections) s.bytes = Buffer.byteLength(lines.slice(s.line - 1, s.end).join('\n'));
const MARKUP = { title: '(markup: on... handlers)', line: 0, end: 0, bytes: 0, names: [], uses: new Map(), usedBy: new Map() };

/* ---- Top-level names ---- */
const isFn = n => /^(FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/.test(n.type);
const patternIds = (p, out = []) => {
  if (!p) return out;
  if (p.type === 'Identifier') out.push(p);
  else if (p.type === 'ObjectPattern') p.properties.forEach(q => patternIds(q.type === 'RestElement' ? q.argument : q.value, out));
  else if (p.type === 'ArrayPattern') p.elements.forEach(e => patternIds(e, out));
  else if (p.type === 'RestElement') patternIds(p.argument, out);
  else if (p.type === 'AssignmentPattern') patternIds(p.left, out);
  return out;
};
const children = n => {
  const out = [];
  for (const k in n) {
    if (k === 'loc' || k === 'type' || k === 'start' || k === 'end') continue;
    const v = n[k];
    if (Array.isArray(v)) v.forEach(x => x && typeof x.type === 'string' && out.push(x));
    else if (v && typeof v.type === 'string') out.push(v);
  }
  return out;
};
// var (and, in sloppy mode, functions in blocks) belong to the whole function
const collectVar = (n, add) => {
  for (const c of children(n)) {
    if (c.type === 'VariableDeclaration' && c.kind === 'var') c.declarations.forEach(d => patternIds(d.id).forEach(add));
    if (c.type === 'FunctionDeclaration') { add(c.id); continue; }
    if (isFn(c) || /^Class/.test(c.type)) continue;
    collectVar(c, add);
  }
};
const collectLexical = (stmts, add) => {
  for (const st of stmts) {
    if (st.type === 'VariableDeclaration' && st.kind !== 'var') st.declarations.forEach(d => patternIds(d.id).forEach(add));
    else if ((st.type === 'ClassDeclaration' || st.type === 'FunctionDeclaration') && st.id) add(st.id);
  }
};
for (const { ast, sc } of asts) {
  const off = sc.line - 1;
  const add = id => {
    const line = id.loc.start.line + off;
    if (top.has(id.name)) return;
    const s = sectionOf(line);
    top.set(id.name, { line, section: s });
    s.names.push(id.name);
  };
  collectLexical(ast.body, add);
  collectVar(ast, add);
  // window.x = ... at the top level makes x a global too
  for (const st of ast.body) {
    const e = st.type === 'ExpressionStatement' && st.expression;
    if (e && e.type === 'AssignmentExpression' && e.left.type === 'MemberExpression' && !e.left.computed &&
        e.left.object.type === 'Identifier' && /^(window|self|globalThis)$/.test(e.left.object.name)) add(e.left.property);
  }
}

/* ---- Uses ---- */
const use = (from, name, line) => {
  const t = top.get(name);
  if (!t || t.section === from) return;
  const key = t.section;
  if (!from.uses.has(key)) from.uses.set(key, new Map());
  const u = from.uses.get(key); u.set(name, (u.get(name) || 0) + 1);
  if (!key.usedBy.has(from)) key.usedBy.set(from, new Map());
  const b = key.usedBy.get(from); b.set(name, (b.get(name) || 0) + 1);
};
const HANDLER = /\bon[a-z]+\s*=\s*\\?(["'])([\s\S]*?)(?:\\?\1|$)/g;
const handlerUses = (text, from, line) => {
  for (const m of text.matchAll(HANDLER))
    for (const w of m[2].matchAll(/(^|[^\w$.])([A-Za-z_$][\w$]*)/g)) use(from, w[2], line);
};
for (const part of markup) handlerUses(part, MARKUP, 0);

const resolves = (scope, name) => { for (let s = scope; s; s = s.parent) if (s.names.has(name)) return true; return false; };
for (const { ast, sc } of asts) {
  const off = sc.line - 1;
  const here = n => sectionOf(n.loc.start.line + off);
  const scopeOf = (parent, ids) => { const s = { parent, names: new Set() }; ids.forEach(i => s.names.add(i.name)); return s; };
  const walk = (n, scope) => {
    switch (n.type) {
      case 'Identifier':
        if (!resolves(scope, n.name)) use(here(n), n.name, n.loc.start.line + off);
        return;
      case 'Literal':
        if (typeof n.value === 'string' && n.value.includes('on')) handlerUses(n.value, here(n));
        return;
      case 'TemplateElement':
        if (n.value.cooked && n.value.cooked.includes('on')) handlerUses(n.value.cooked, here(n));
        return;
      case 'FunctionDeclaration': case 'FunctionExpression': case 'ArrowFunctionExpression': {
        const ids = [];
        if (n.type === 'FunctionExpression' && n.id) ids.push(n.id);
        n.params.forEach(p => patternIds(p, ids));
        const s = scopeOf(scope, ids);
        if (n.type !== 'ArrowFunctionExpression') s.names.add('arguments');
        if (n.body.type === 'BlockStatement') {
          collectVar(n.body, i => s.names.add(i.name));
          collectLexical(n.body.body, i => s.names.add(i.name));
        }
        n.params.forEach(p => walk(p, s));
        if (n.body.type === 'BlockStatement') n.body.body.forEach(st => walk(st, s));
        else walk(n.body, s);
        return;
      }
      case 'ClassDeclaration': case 'ClassExpression': {
        const s = scopeOf(scope, n.type === 'ClassExpression' && n.id ? [n.id] : []);
        if (n.superClass) walk(n.superClass, scope);
        walk(n.body, s);
        return;
      }
      case 'BlockStatement': case 'StaticBlock': {
        const s = scopeOf(scope, []);
        collectLexical(n.body, i => s.names.add(i.name));
        n.body.forEach(st => walk(st, s));
        return;
      }
      case 'ForStatement': case 'ForInStatement': case 'ForOfStatement': {
        const d = n.type === 'ForStatement' ? n.init : n.left;
        const s = scopeOf(scope, d && d.type === 'VariableDeclaration' && d.kind !== 'var' ? d.declarations.flatMap(x => patternIds(x.id)) : []);
        children(n).forEach(c => walk(c, s));
        return;
      }
      case 'SwitchStatement': {
        walk(n.discriminant, scope);
        const s = scopeOf(scope, []);
        n.cases.forEach(c => collectLexical(c.consequent, i => s.names.add(i.name)));
        n.cases.forEach(c => { if (c.test) walk(c.test, s); c.consequent.forEach(st => walk(st, s)); });
        return;
      }
      case 'CatchClause': {
        const s = scopeOf(scope, patternIds(n.param));
        if (n.param) walk(n.param, s);
        walk(n.body, s);
        return;
      }
      case 'MemberExpression':
        walk(n.object, scope);
        if (n.computed) walk(n.property, scope);
        return;
      case 'Property': case 'MethodDefinition': case 'PropertyDefinition':
        if (n.computed) walk(n.key, scope);
        if (n.value) walk(n.value, scope);
        return;
      case 'LabeledStatement': walk(n.body, scope); return;
      case 'BreakStatement': case 'ContinueStatement': case 'MetaProperty': return;
      default:
        children(n).forEach(c => walk(c, scope));
    }
  };
  ast.body.forEach(st => walk(st, null));
}

/* ---- Output ---- */
const kb = b => (b / 1024).toFixed(b < 10240 ? 1 : 0);
const sum = m => [...m.values()].reduce((a, x) => a + x.size, 0);
const all = [...sections, MARKUP];
const label = s => s.title;
const arg = process.argv[2];

if (arg === '--json') {
  console.log(JSON.stringify({
    index: path.relative(ROOT, INDEX), scripts: scripts.map(s => ({ line: s.line, bytes: s.bytes })), names: top.size,
    sections: all.map(s => ({
      title: s.title, line: s.line, end: s.end, bytes: s.bytes, names: s.names,
      uses: Object.fromEntries([...s.uses].map(([k, m]) => [k.title, Object.fromEntries(m)])),
      usedBy: Object.fromEntries([...s.usedBy].map(([k, m]) => [k.title, Object.fromEntries(m)])),
    })),
  }, null, 1));
} else if (arg === '--names') {
  for (const [name, t] of top) {
    const by = [];
    for (const [s, m] of t.section.usedBy) if (m.has(name)) by.push(s.title);
    console.log(t.line + '\t' + name + '\t' + t.section.title + '\t' + (by.length ? by.join('; ') : '-'));
  }
} else if (arg === '--section') {
  const q = (process.argv[3] || '').toLowerCase();
  const s = all.find(x => x.title.toLowerCase() === q) || all.find(x => x.title.toLowerCase().includes(q));
  if (!s) { console.error('No section matches "' + q + '"'); process.exit(1); }
  console.log(s.title + ' (lines ' + s.line + '-' + s.end + ', ' + kb(s.bytes) + ' KB, ' + s.names.length + ' names)\n');
  console.log('Uses, from ' + s.uses.size + ' sections:');
  for (const [k, m] of [...s.uses].sort((a, b) => b[1].size - a[1].size)) console.log('  ' + k.title + ': ' + [...m.keys()].join(', '));
  console.log('\nUsed by ' + s.usedBy.size + ' sections:');
  for (const [k, m] of [...s.usedBy].sort((a, b) => b[1].size - a[1].size)) console.log('  ' + k.title + ': ' + [...m.keys()].join(', '));
} else {
  const rows = sections.map((s, i) => {
    const t = s.title.replace(/\|/g, '/').replace(/\s+/g, ' ');
    return '| ' + (i + 1) + ' | ' + t + ' | ' + s.line + '-' + s.end + ' | ' + kb(s.bytes) + ' | ' + s.names.length +
      ' | ' + s.uses.size + ' / ' + sum(s.uses) + ' | ' + s.usedBy.size + ' / ' + sum(s.usedBy) + ' |';
  });
  const table = [
    '| # | Section | Lines | KB | Names | Uses: sections / names | Used by: sections / names |',
    '|---|---|---|---|---|---|---|',
    ...rows,
  ].join('\n');
  const head = 'Census of `' + path.relative(ROOT, INDEX) + '`: ' + scripts.length + ' inline scripts, ' + sections.length + ' sections, ' + top.size +
    ' top-level names (`tests/tools/census.cjs`). The markup\'s own on... handlers use ' + sum(MARKUP.uses) + ' names from ' + MARKUP.uses.size + ' sections.';
  if (arg === '--write') {
    const doc = path.join(ROOT, 'docs', 'split-index.md');
    const d = fs.readFileSync(doc, 'utf8');
    const a = '<!-- census:start -->', b = '<!-- census:end -->';
    if (!d.includes(a)) { console.error('No ' + a + ' marker in ' + doc); process.exit(1); }
    fs.writeFileSync(doc, d.slice(0, d.indexOf(a) + a.length) + '\n' + head + '\n\n' + table + '\n' + d.slice(d.indexOf(b)));
    console.log('Wrote ' + sections.length + ' rows to ' + path.relative(ROOT, doc));
  } else console.log(head + '\n\n' + table);
}
